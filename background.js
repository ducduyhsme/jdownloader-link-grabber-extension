/**
 * JDownloader 2 LinkGrabber Background Service Worker
 * Handles tab monitoring, domain matching against the database,
 * context menus, and communication with JDownloader 2 local API.
 */

const JD_LOCAL_URL = 'http://127.0.0.1:9666';
const REFERER_HEADER = 'http://127.0.0.1:9666/flashgot';
const DEDUPLICATION_TIMEOUT_MS = 60000; // 60 seconds cooldown for same URL

let builtinDatabase = null;
let customDomains = {};
let settings = {
  autoGrabEnabled: true,
  interceptDownloads: true, // Intercept browser downloads and route to JD2
  fallbackIfJdOffline: true, // Allow browser to download if JD2 is not running
  notifyOnGrab: true,
  defaultPackageTemplate: 'WebGrab_{domain}',
  jdPort: 9666
};

// Startup grace period and tab tracking (prevents auto-grabbing restored session tabs on Chrome boot)
let isStartupGracePeriod = true;
const STARTUP_GRACE_PERIOD_MS = 15000; // 15 seconds grace period on boot
const startupTabIds = new Set();

// Cache for grabbed history: url -> timestamp (synced with chrome.storage.local)
let grabbedHistory = {};
const GRABBED_HISTORY_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours cooldown per URL

// Notification grouping and debouncing
const NOTIF_GRAB_ID = 'jd_linkgrabber_notify';
let notifyDebounceTimer = null;
let pendingNotifyCount = 0;

/**
 * Initialize declarativeNetRequest rule so that all requests to JD 127.0.0.1:9666
 * have Referer: http://127.0.0.1:9666/flashgot, bypassing JD external confirmation prompt.
 */
async function setupNetRules() {
  try {
    const RULE_ID = 9666;
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID],
      addRules: [
        {
          id: RULE_ID,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              {
                header: 'Referer',
                operation: 'set',
                value: REFERER_HEADER
              }
            ]
          },
          condition: {
            urlFilter: 'http://127.0.0.1:9666/*',
            resourceTypes: ['xmlhttprequest', 'other']
          }
        }
      ]
    });
  } catch (error) {
    // Non-fatal if rule update failed
  }
}

/**
 * Load the bundled database of supported JDownloader plugins & domains.
 */
async function loadDatabase() {
  try {
    const url = chrome.runtime.getURL('database.json');
    const response = await fetch(url);
    builtinDatabase = await response.json();
  } catch (error) {
    builtinDatabase = { total: 0, domains: {} };
  }
}

/**
 * Load user settings and custom domains from chrome.storage.local
 */
async function loadStorage() {
  const data = await chrome.storage.local.get(['customDomains', 'settings']);
  if (data.customDomains) {
    customDomains = data.customDomains;
  } else {
    customDomains = {};
    await chrome.storage.local.set({ customDomains: {} });
  }

  if (data.settings) {
    settings = { ...settings, ...data.settings };
  } else {
    await chrome.storage.local.set({ settings });
  }
}

/**
 * Load and clean grabbedHistory from chrome.storage.local
 */
async function loadGrabbedHistory() {
  try {
    const data = await chrome.storage.local.get(['grabbedHistory']);
    grabbedHistory = data.grabbedHistory || {};
    const now = Date.now();
    let modified = false;
    for (const [url, time] of Object.entries(grabbedHistory)) {
      if (now - time > GRABBED_HISTORY_COOLDOWN_MS) {
        delete grabbedHistory[url];
        modified = true;
      }
    }
    if (modified) {
      await chrome.storage.local.set({ grabbedHistory });
    }
  } catch (e) {
    grabbedHistory = {};
  }
}

/**
 * Check if a URL has already been grabbed within cooldown window.
 */
function isUrlRecentlyGrabbed(url) {
  if (!url) return false;
  const time = grabbedHistory[url];
  if (!time) return false;
  return Date.now() - time < GRABBED_HISTORY_COOLDOWN_MS;
}

/**
 * Record a grabbed URL into memory and persistent storage.
 */
function recordGrabbedUrl(url) {
  if (!url) return;
  grabbedHistory[url] = Date.now();
  chrome.storage.local.set({ grabbedHistory }).catch(() => {});
}

/**
 * Unified notification helper with fixed ID to prevent stacking multiple cards on Windows.
 */
function showNotification(title, message, durationMs = 4000) {
  if (!settings.notifyOnGrab) return;
  chrome.notifications.create(
    NOTIF_GRAB_ID,
    {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message,
      priority: 0
    },
    () => {
      setTimeout(() => {
        chrome.notifications.clear(NOTIF_GRAB_ID);
      }, durationMs);
    }
  );
}

/**
 * Debounced notification for auto-grabbed links to prevent notification spam.
 */
function notifyAutoGrabbed(matchedDomain, pluginName) {
  if (!settings.notifyOnGrab) return;

  pendingNotifyCount++;
  clearTimeout(notifyDebounceTimer);
  notifyDebounceTimer = setTimeout(() => {
    const count = pendingNotifyCount;
    pendingNotifyCount = 0;

    const message =
      count > 1
        ? `Đã tự động bắt ${count} liên kết gửi sang JDownloader 2.`
        : `Đã tự động bắt link từ ${matchedDomain} (${pluginName || 'Hoster/Decrypter'})`;

    showNotification('JDownloader 2 LinkGrabber', message, 4000);
  }, 300);
}

/**
 * Determine if a URL is an actual downloadable item, video, or shortlink
 * rather than a generic homepage, feed, login, or dashboard.
 */
function isContentOrDownloadUrl(urlStr, matchedDomain) {
  try {
    const parsed = new URL(urlStr);
    const path = parsed.pathname.trim();
    const lowerPath = path.toLowerCase();
    const search = parsed.search.trim();

    // 1. Root / pure homepage check: https://example.com or https://example.com/
    if ((path === '' || path === '/') && !search && !parsed.hash) {
      return false;
    }

    // Common non-download pages
    if (
      (lowerPath === '/index.html' ||
        lowerPath === '/index.php' ||
        lowerPath === '/home' ||
        lowerPath === '/login' ||
        lowerPath === '/register' ||
        lowerPath === '/signup' ||
        lowerPath === '/dashboard') &&
      !search
    ) {
      return false;
    }

    // 2. Specific domain filters for large multi-purpose platforms:
    const hostname = parsed.hostname.toLowerCase();

    // YouTube: only grab videos, shorts, playlists, embeds
    if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
      if (hostname === 'youtu.be' && path.length > 1) return true;
      if (lowerPath.startsWith('/watch') && search.includes('v=')) return true;
      if (lowerPath.startsWith('/shorts/') && path.length > 8) return true;
      if (lowerPath.startsWith('/playlist') && search.includes('list=')) return true;
      if (lowerPath.startsWith('/embed/')) return true;
      return false;
    }

    // Google Drive: only grab file or folder links
    if (hostname === 'drive.google.com') {
      if (lowerPath.includes('/file/d/') || lowerPath.includes('/folders/')) return true;
      if (search.includes('id=')) return true;
      return false;
    }

    // Facebook: only grab videos and reels
    if (hostname.includes('facebook.com') || hostname === 'fb.watch') {
      if (hostname === 'fb.watch') return true;
      if (lowerPath.includes('/videos/') || lowerPath.includes('/watch/') || lowerPath.includes('/reel/')) return true;
      return false;
    }

    // Mega.nz: only grab file and folder links
    if (hostname.includes('mega.nz')) {
      if (lowerPath.includes('/file/') || lowerPath.includes('/folder/') || parsed.hash.includes('#!')) return true;
      return false;
    }

    // Microsoft: only grab actual download center links
    if (hostname.includes('microsoft.com')) {
      if (lowerPath.includes('/download/details') || lowerPath.includes('/download/confirmation')) return true;
      return false;
    }

    // For all other file hosters and decrypters:
    // Must have a non-trivial path or query
    return path.length > 1 || search.length > 0;
  } catch (e) {
    return false;
  }
}

/**
 * Check if JDownloader 2 is running on localhost.
 * @returns {Promise<boolean>}
 */
async function checkJdAlive() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(`${JD_LOCAL_URL}/flash`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!resp.ok) return false;
    const text = await resp.text();
    return text.includes('JDownloader');
  } catch (e) {
    return false;
  }
}

/**
 * Extract candidates for domain matching from a full URL.
 * Example: for "https://sub.mega.nz/path" -> ["sub.mega.nz", "mega.nz"]
 * @param {string} urlString
 * @returns {{ hostname: string, candidates: string[] } | null}
 */
function extractDomainCandidates(urlString) {
  try {
    if (!urlString || !urlString.startsWith('http')) return null;
    const url = new URL(urlString);
    let hostname = url.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return null;
    }

    const parts = hostname.split('.');
    const candidates = [hostname];

    // Check parent domains (e.g. download.mediafire.com -> mediafire.com)
    for (let i = 1; i < parts.length - 1; i++) {
      candidates.push(parts.slice(i).join('.'));
    }

    return { hostname, candidates };
  } catch (e) {
    return null;
  }
}

/**
 * Match a URL against custom domains and builtin JDownloader plugins.
 * @param {string} urlString
 * @returns {{ isSupported: boolean, isCustom: boolean, matchedDomain: string, types: string[], plugin: string } | null}
 */
function matchDomain(urlString) {
  const extracted = extractDomainCandidates(urlString);
  if (!extracted) return null;

  const { hostname, candidates } = extracted;

  // 1. Check custom domains first
  for (const candidate of candidates) {
    if (customDomains[candidate]) {
      return {
        isSupported: true,
        isCustom: true,
        matchedDomain: candidate,
        types: ['custom'],
        plugin: customDomains[candidate].plugin || 'UserCustomDomain'
      };
    }
  }

  // 2. Check builtin database
  if (builtinDatabase && builtinDatabase.domains) {
    for (const candidate of candidates) {
      if (builtinDatabase.domains[candidate]) {
        const info = builtinDatabase.domains[candidate];
        return {
          isSupported: true,
          isCustom: false,
          matchedDomain: candidate,
          types: info.types || ['hoster'],
          plugin: info.plugin || candidate
        };
      }
    }
  }

  return {
    isSupported: false,
    isCustom: false,
    matchedDomain: hostname,
    types: [],
    plugin: ''
  };
}

/**
 * Send URL(s) to JDownloader 2 LinkGrabber via FlashGot endpoint.
 * @param {string} url
 * @param {string} matchedDomain
 * @param {{ filename?: string, referer?: string }} [options]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function sendToJDownloader(url, matchedDomain, options = {}) {
  const isAlive = await checkJdAlive();
  if (!isAlive) {
    return {
      success: false,
      message: 'Không tìm thấy JDownloader 2 đang chạy trên cổng 9666.'
    };
  }

  const packageName = (settings.defaultPackageTemplate || 'WebGrab_{domain}')
    .replace('{domain}', matchedDomain || 'link')
    .replace('{date}', new Date().toLocaleDateString('vi-VN'));

  const formData = new URLSearchParams();
  formData.append('urls', url);
  formData.append('referer', options.referer || REFERER_HEADER);
  formData.append('package', packageName);
  if (options.filename) {
    formData.append('fnames', options.filename);
  }
  formData.append('autostart', '0');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(`${JD_LOCAL_URL}/flashgot`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (resp.ok) {
      recordGrabbedUrl(url);
      return {
        success: true,
        message: 'Đã gửi liên kết tới JDownloader 2 LinkGrabber thành công!'
      };
    } else {
      return {
        success: false,
        message: `JDownloader phản hồi mã lỗi: ${resp.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Lỗi kết nối tới JDownloader: ${error.message}`
    };
  }
}

/**
 * Add a domain to the user's custom database.
 * @param {string} domain
 * @param {string} [urlToGrab]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function addCustomDomain(domain, urlToGrab = null) {
  if (!domain) return { success: false, message: 'Domain không hợp lệ' };
  const cleanDomain = domain.trim().toLowerCase();

  customDomains[cleanDomain] = {
    addedAt: new Date().toISOString(),
    plugin: 'CustomSite'
  };

  await chrome.storage.local.set({ customDomains });

  let grabResult = null;
  if (urlToGrab) {
    grabResult = await sendToJDownloader(urlToGrab, cleanDomain);
  }

  return {
    success: true,
    message: `Đã thêm ${cleanDomain} vào database!${grabResult && grabResult.success ? ' Và đã gửi liên kết vào LinkGrabber.' : ''}`,
    grabResult
  };
}

/**
 * Remove a domain from custom database.
 * @param {string} domain
 */
async function removeCustomDomain(domain) {
  if (!domain) return;
  const cleanDomain = domain.trim().toLowerCase();
  delete customDomains[cleanDomain];
  await chrome.storage.local.set({ customDomains });
}

/**
 * Update tab badge to indicate support status.
 */
function updateBadge(tabId, matchInfo, isGrabbed = false) {
  if (!matchInfo || !matchInfo.isSupported) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  if (isGrabbed) {
    chrome.action.setBadgeText({ tabId, text: '✓' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#16a34a' }); // Green
  } else if (matchInfo.isCustom) {
    chrome.action.setBadgeText({ tabId, text: '★' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#2563eb' }); // Blue
  } else {
    chrome.action.setBadgeText({ tabId, text: 'JD' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#0284c7' }); // Sky blue
  }
}

/**
 * Setup Context Menus
 */
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'jd-add-current-domain',
      title: '➕ Thêm trang web này vào JDownloader Database',
      contexts: ['page', 'action']
    });

    chrome.contextMenus.create({
      id: 'jd-send-current-page',
      title: '📥 Gửi trang này tới JDownloader 2 LinkGrabber',
      contexts: ['page', 'action']
    });

    chrome.contextMenus.create({
      id: 'jd-send-link',
      title: '📥 Gửi đường link liên kết này tới JDownloader 2',
      contexts: ['link']
    });
  });
}

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'jd-add-current-domain' && tab && tab.url) {
    const match = matchDomain(tab.url);
    const domain = match ? match.matchedDomain : new URL(tab.url).hostname;
    const res = await addCustomDomain(domain, tab.url);
    showNotification('JDownloader 2 Database', res.message);
    if (tab.id) updateBadge(tab.id, { isSupported: true, isCustom: true }, true);
  } else if (info.menuItemId === 'jd-send-current-page' && tab && tab.url) {
    const match = matchDomain(tab.url);
    const domain = match ? match.matchedDomain : new URL(tab.url).hostname;
    recordGrabbedUrl(tab.url);
    const res = await sendToJDownloader(tab.url, domain);
    showNotification(res.success ? 'JDownloader 2' : 'Lỗi JDownloader 2', res.message);
    if (tab.id && res.success) {
      updateBadge(tab.id, match, true);
    }
  } else if (info.menuItemId === 'jd-send-link' && info.linkUrl) {
    const match = matchDomain(info.linkUrl);
    const domain = match ? match.matchedDomain : new URL(info.linkUrl).hostname;
    recordGrabbedUrl(info.linkUrl);
    const res = await sendToJDownloader(info.linkUrl, domain);
    showNotification(res.success ? 'JDownloader 2' : 'Lỗi JDownloader 2', res.message);
  }
});

// Tab navigation listener: auto-detect and auto-grab with strict spam prevention
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab || !tab.url) return;
  if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) return;

  const match = matchDomain(tab.url);
  if (!match || !match.isSupported) {
    updateBadge(tabId, match, false);
    return;
  }

  const alreadyGrabbed = isUrlRecentlyGrabbed(tab.url);

  // Filter 1: If browser/extension is in startup grace period, DO NOT auto-grab!
  if (isStartupGracePeriod) {
    updateBadge(tabId, match, alreadyGrabbed);
    return;
  }

  // Filter 2: If this tab was already open before boot / session restore, DO NOT auto-grab!
  if (startupTabIds.has(tabId)) {
    updateBadge(tabId, match, alreadyGrabbed);
    return;
  }

  // Filter 3: DO NOT auto-grab background / inactive tabs (e.g. background tabs loading)
  if (!tab.active) {
    updateBadge(tabId, match, alreadyGrabbed);
    return;
  }

  // Filter 4: DO NOT auto-grab pure homepages / feeds / dashboards (e.g. youtube.com, mega.nz homepage)
  if (!isContentOrDownloadUrl(tab.url, match.matchedDomain)) {
    updateBadge(tabId, match, false);
    return;
  }

  // Filter 5: If auto-grab is enabled and URL has not been recently grabbed
  if (settings.autoGrabEnabled && !alreadyGrabbed) {
    recordGrabbedUrl(tab.url);
    const res = await sendToJDownloader(tab.url, match.matchedDomain);
    if (res.success) {
      updateBadge(tabId, match, true);
      notifyAutoGrabbed(match.matchedDomain, match.plugin);
    } else {
      updateBadge(tabId, match, false);
    }
  } else {
    updateBadge(tabId, match, alreadyGrabbed);
  }
});

// Tab activated listener: ensure badge is consistent
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab || !tab.url) return;
    const match = matchDomain(tab.url);
    const isGrabbed = isUrlRecentlyGrabbed(tab.url);
    updateBadge(activeInfo.tabId, match, isGrabbed);
  } catch (e) {
    // Ignore closed tabs
  }
});

// Set of download IDs that our extension has intercepted and canceled
const interceptedDownloadIds = new Set();

/**
 * Intercept browser downloads before "Save As" dialog or file saving happens,
 * and route them to JDownloader 2 LinkGrabber.
 */
if (chrome.downloads && chrome.downloads.onDeterminingFilename) {
  chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    // 1. Check if interception is enabled
    if (!settings.interceptDownloads) {
      suggest();
      return false;
    }

    // 2. Ignore if download was initiated by this extension or already handled
    if (downloadItem.byExtensionId === chrome.runtime.id) {
      suggest();
      return false;
    }
    if (interceptedDownloadIds.has(downloadItem.id)) {
      return false;
    }

    const rawUrl = downloadItem.finalUrl || downloadItem.url;
    if (!rawUrl) {
      suggest();
      return false;
    }

    // 3. Ignore non-network downloads (blob:, data:, file:, chrome:)
    const lowerUrl = rawUrl.toLowerCase();
    if (
      lowerUrl.startsWith('blob:') ||
      lowerUrl.startsWith('data:') ||
      lowerUrl.startsWith('file:') ||
      lowerUrl.startsWith('chrome:') ||
      lowerUrl.startsWith('chrome-extension:') ||
      lowerUrl.includes('127.0.0.1:9666') ||
      lowerUrl.includes('localhost:9666')
    ) {
      suggest();
      return false;
    }

    // Only intercept HTTP, HTTPS, FTP downloads
    if (
      !lowerUrl.startsWith('http://') &&
      !lowerUrl.startsWith('https://') &&
      !lowerUrl.startsWith('ftp://')
    ) {
      suggest();
      return false;
    }

    // Handle asynchronously: Returning true tells Chrome to pause and NOT show "Save As" dialog!
    (async () => {
      // 4. Check if JDownloader 2 is online
      let isAlive = true;
      if (settings.fallbackIfJdOffline) {
        isAlive = await checkJdAlive();
        if (!isAlive) {
          showNotification(
            'JDownloader 2 Chưa Mở',
            'JDownloader 2 chưa chạy. Trình duyệt Chrome sẽ tiếp tục tải file.'
          );
          suggest(); // Let Chrome proceed with normal download
          return;
        }
      }

      // 5. Intercept: Cancel the download immediately in Chrome before any dialog appears
      interceptedDownloadIds.add(downloadItem.id);
      chrome.downloads.cancel(downloadItem.id, () => {
        // Erase from download shelf and history to avoid "cancelled" clutter
        chrome.downloads.erase({ id: downloadItem.id }, () => {
          setTimeout(() => interceptedDownloadIds.delete(downloadItem.id), 20000);
        });
      });

      // 6. Extract domain and filename
      let domain = 'Download';
      try {
        domain = new URL(rawUrl).hostname.replace(/^www\./, '');
      } catch (e) {}

      const filename = downloadItem.filename ? downloadItem.filename.split(/[\/\\]/).pop() : '';
      const referrer = downloadItem.referrer || REFERER_HEADER;

      // 7. Route URL to JDownloader 2 LinkGrabber
      const res = await sendToJDownloader(rawUrl, domain, {
        filename,
        referer: referrer
      });

      // 8. Notification
      if (settings.notifyOnGrab) {
        showNotification(
          'JDownloader 2 LinkGrabber',
          res.success
            ? `Đã chuyển file ${filename ? `"${filename}"` : `từ ${domain}`} sang JDownloader 2!`
            : `Không thể chuyển file sang JDownloader: ${res.message}`
        );
      }
    })();

    return true; // Asynchronous handling tells Chrome to wait and prevents the Save As dialog
  });
}

// Listen for messages from Popup and Content Scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkTabStatus') {
    (async () => {
      const match = matchDomain(request.url);
      const isAlive = await checkJdAlive();
      const isGrabbed = request.url ? isUrlRecentlyGrabbed(request.url) : false;
      sendResponse({
        match,
        isAlive,
        isGrabbed,
        totalBuiltin: builtinDatabase ? builtinDatabase.total : 0,
        totalCustom: Object.keys(customDomains).length
      });
    })();
    return true; // Keep message channel open for async response
  }

  if (request.action === 'grabUrl') {
    (async () => {
      const match = matchDomain(request.url);
      const domain = match ? match.matchedDomain : (new URL(request.url).hostname || 'link');
      recordGrabbedUrl(request.url);
      const res = await sendToJDownloader(request.url, domain);
      if (sender.tab && sender.tab.id && res.success) {
        updateBadge(sender.tab.id, match, true);
      }
      sendResponse(res);
    })();
    return true;
  }

  if (request.action === 'addDomain') {
    (async () => {
      const res = await addCustomDomain(request.domain, request.url);
      sendResponse(res);
    })();
    return true;
  }

  if (request.action === 'removeDomain') {
    (async () => {
      await removeCustomDomain(request.domain);
      sendResponse({ success: true });
    })();
    return true;
  }

  if (request.action === 'pingJDownloader') {
    (async () => {
      const isAlive = await checkJdAlive();
      sendResponse({ isAlive });
    })();
    return true;
  }

  if (request.action === 'getSettings') {
    sendResponse({ settings });
    return false;
  }

  if (request.action === 'saveSettings') {
    settings = { ...settings, ...request.settings };
    chrome.storage.local.set({ settings });
    sendResponse({ success: true });
    return false;
  }
});

// Storage change listener to keep memory state synced
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.customDomains) {
      customDomains = changes.customDomains.newValue || {};
    }
    if (changes.settings) {
      settings = changes.settings.newValue || settings;
    }
  }
});

// Initialize on service worker startup
(async function init() {
  await setupNetRules();
  await loadDatabase();
  await loadStorage();
  await loadGrabbedHistory();
  setupContextMenus();

  // Snapshot all existing tabs currently open at startup to prevent session-restore spam
  try {
    const existingTabs = await chrome.tabs.query({});
    for (const tab of existingTabs) {
      if (tab.id) startupTabIds.add(tab.id);
      if (tab.url) {
        // Record as known so they aren't re-grabbed on boot
        recordGrabbedUrl(tab.url);
      }
    }
  } catch (e) {
    // Ignore query error on initial startup
  }

  // Grace period timer: after 15 seconds, clear startupTabIds and allow auto-grab for new user actions
  setTimeout(() => {
    isStartupGracePeriod = false;
    startupTabIds.clear();
  }, STARTUP_GRACE_PERIOD_MS);
})();
