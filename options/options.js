/**
 * JDownloader 2 LinkGrabber Options & Database Manager Logic
 * Multi-language supported (Default: English 'en', Vietnamese 'vi')
 */

import { t, applyI18n, DEFAULT_LANG } from '../i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation elements
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.tab-section');

  // Stats elements
  const statTotalDomains = document.getElementById('stat-total-domains');
  const statDecrypters = document.getElementById('stat-decrypters');
  const statHosters = document.getElementById('stat-hosters');
  const statCustomDomains = document.getElementById('stat-custom-domains');

  // Connection elements
  const jdStatusBadge = document.getElementById('jd-status-badge');
  const jdStatusText = document.getElementById('jd-status-text');
  const btnRecheckJd = document.getElementById('btn-recheck-jd');

  // Search elements
  const dbSearchInput = document.getElementById('db-search-input');
  const searchResultsTbody = document.getElementById('search-results-tbody');
  const searchResultCount = document.getElementById('search-result-count');

  // Custom domains elements
  const inputNewDomain = document.getElementById('input-new-domain');
  const btnAddCustomDomain = document.getElementById('btn-add-custom-domain');
  const customDomainsTbody = document.getElementById('custom-domains-tbody');

  // Settings elements
  const settingLang = document.getElementById('setting-lang');
  const settingPort = document.getElementById('setting-port');
  const settingTemplate = document.getElementById('setting-template');
  const settingAutograb = document.getElementById('setting-autograb');
  const settingIntercept = document.getElementById('setting-intercept');
  const settingFallback = document.getElementById('setting-fallback');
  const settingNotify = document.getElementById('setting-notify');
  const settingVideobtn = document.getElementById('setting-videobtn');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const saveSettingsMsg = document.getElementById('save-settings-msg');

  let builtinDatabase = null;
  let customDomains = {};
  let domainList = [];
  let currentLang = DEFAULT_LANG;
  let lastSearchResults = null;

  // --- 1. Tab Navigation ---
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('data-target');

      navItems.forEach((n) => n.classList.remove('active'));
      sections.forEach((s) => s.classList.remove('active'));

      item.classList.add('active');
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.classList.add('active');
    });
  });

  // --- 2. Check JDownloader Connection ---
  async function checkConnection() {
    jdStatusBadge.className = 'status-indicator checking';
    jdStatusText.textContent = t('conn_checking', {}, currentLang);

    chrome.runtime.sendMessage({ action: 'pingJDownloader' }, (res) => {
      const port = settingPort.value || 9666;
      if (res && res.isAlive) {
        jdStatusBadge.className = 'status-indicator online';
        jdStatusText.textContent = t('conn_online', { port }, currentLang);
      } else {
        jdStatusBadge.className = 'status-indicator offline';
        jdStatusText.textContent = t('conn_offline', {}, currentLang);
      }
    });
  }

  btnRecheckJd.addEventListener('click', checkConnection);

  // --- 3. Load Database & Storage ---
  try {
    const url = chrome.runtime.getURL('database.json');
    const resp = await fetch(url);
    builtinDatabase = await resp.json();
    domainList = Object.keys(builtinDatabase.domains || {});
  } catch (e) {
    builtinDatabase = { total: 0, domains: {} };
    domainList = [];
  }

  // Load custom domains & settings
  const storageData = await chrome.storage.local.get(['customDomains', 'settings']);
  customDomains = storageData.customDomains || {};
  const currentSettings = storageData.settings || {};

  // Setup Language
  currentLang = currentSettings.language || DEFAULT_LANG;
  if (settingLang) {
    settingLang.value = currentLang;
  }
  applyI18n(currentLang);
  await checkConnection();

  // Fill settings form
  if (currentSettings.jdPort) settingPort.value = currentSettings.jdPort;
  if (currentSettings.defaultPackageTemplate) settingTemplate.value = currentSettings.defaultPackageTemplate;
  settingAutograb.checked = currentSettings.autoGrabEnabled !== false;
  settingIntercept.checked = currentSettings.interceptDownloads !== false;
  settingFallback.checked = currentSettings.fallbackIfJdOffline !== false;
  settingNotify.checked = currentSettings.notifyOnGrab !== false;
  if (settingVideobtn) settingVideobtn.checked = currentSettings.showVideoOverlayButton !== false;

  // Compute and show stats
  function updateStats() {
    let decCount = 0;
    let hostCount = 0;
    if (builtinDatabase && builtinDatabase.domains) {
      for (const d of Object.values(builtinDatabase.domains)) {
        if (d.types.includes('decrypter')) decCount++;
        if (d.types.includes('hoster')) hostCount++;
      }
    }
    const customCount = Object.keys(customDomains).length;
    const totalCount = domainList.length + customCount;

    statTotalDomains.textContent = totalCount.toLocaleString();
    statDecrypters.textContent = decCount.toLocaleString();
    statHosters.textContent = hostCount.toLocaleString();
    statCustomDomains.textContent = customCount.toLocaleString();
  }

  updateStats();

  // --- 4. Search Database Logic ---
  const popularHighlights = [
    'mega.nz',
    'fshare.vn',
    'mediafire.com',
    'rapidgator.net',
    '1fichier.com',
    'drive.google.com',
    'youtube.com',
    'adf.ly',
    'ouo.io',
    'filecrypt.cc',
    'dropgalaxy.com',
    'ddownload.com',
    'pixeldrain.com',
    'zippyshare.day',
    'uptobox.com'
  ];

  function renderSearchResults(domainsToShow) {
    lastSearchResults = domainsToShow;
    searchResultsTbody.innerHTML = '';
    if (domainsToShow.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4" style="text-align: center; color: #94a3b8; padding: 24px;">${t('search_no_results', {}, currentLang)}</td>`;
      searchResultsTbody.appendChild(tr);
      return;
    }

    domainsToShow.forEach((domain) => {
      const info = (builtinDatabase && builtinDatabase.domains[domain]) || { types: ['custom'], plugin: 'Custom' };
      const isCustom = !!customDomains[domain];

      const tr = document.createElement('tr');

      // Domain cell
      const tdDomain = document.createElement('td');
      tdDomain.innerHTML = `<strong>${escapeHtml(domain)}</strong>`;

      // Type tags cell
      const tdTypes = document.createElement('td');
      if (isCustom) {
        tdTypes.innerHTML = `<span class="type-tag custom">${t('tag_custom', {}, currentLang)}</span>`;
      } else {
        tdTypes.innerHTML = (info.types || ['hoster'])
          .map((tp) => {
            const label = tp === 'decrypter' ? t('tag_decrypter', {}, currentLang) : t('tag_hoster', {}, currentLang);
            return `<span class="type-tag ${tp}">${label}</span>`;
          })
          .join(' ');
      }

      // Plugin cell
      const tdPlugin = document.createElement('td');
      tdPlugin.textContent = isCustom
        ? (currentLang === 'vi' ? 'Người dùng thêm' : 'User Added')
        : info.plugin || domain;

      // Status cell
      const tdStatus = document.createElement('td');
      tdStatus.innerHTML = `<span style="color: #4ade80;">${t('status_autograb', {}, currentLang)}</span>`;

      tr.appendChild(tdDomain);
      tr.appendChild(tdTypes);
      tr.appendChild(tdPlugin);
      tr.appendChild(tdStatus);

      searchResultsTbody.appendChild(tr);
    });
  }

  // Initial render with popular domains
  const initialList = popularHighlights.filter((d) => builtinDatabase && builtinDatabase.domains[d]);
  renderSearchResults(initialList);
  searchResultCount.textContent = t('search_popular_hint', { count: initialList.length }, currentLang);

  // Search input handler with debounce
  let searchTimeout = null;
  dbSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = dbSearchInput.value.trim().toLowerCase();
      if (!q) {
        renderSearchResults(initialList);
        searchResultCount.textContent = t('search_popular_hint', { count: initialList.length }, currentLang);
        return;
      }

      // Filter matches (limit to top 100 for snappy performance)
      const matches = [];
      // Search custom first
      for (const cd of Object.keys(customDomains)) {
        if (cd.includes(q)) matches.push(cd);
      }
      // Search builtin
      for (const d of domainList) {
        if (d.includes(q)) {
          matches.push(d);
          if (matches.length >= 100) break;
        }
      }

      renderSearchResults(matches);
      searchResultCount.textContent = t('search_results_hint', { count: matches.length }, currentLang);
    }, 250);
  });

  // --- 5. Custom Domains Management ---
  function renderCustomDomains() {
    customDomainsTbody.innerHTML = '';
    const keys = Object.keys(customDomains);

    if (keys.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3" style="text-align: center; color: #94a3b8; padding: 24px;">${t('custom_empty', {}, currentLang)}</td>`;
      customDomainsTbody.appendChild(tr);
      return;
    }

    keys.forEach((domain) => {
      const item = customDomains[domain];
      const tr = document.createElement('tr');

      const tdDomain = document.createElement('td');
      tdDomain.innerHTML = `<strong>${escapeHtml(domain)}</strong>`;

      const tdDate = document.createElement('td');
      const locale = currentLang === 'vi' ? 'vi-VN' : 'en-US';
      tdDate.textContent = item.addedAt ? new Date(item.addedAt).toLocaleDateString(locale) : 'New';

      const tdAction = document.createElement('td');
      const btnDel = document.createElement('button');
      btnDel.className = 'btn-del';
      btnDel.textContent = t('btn_delete', {}, currentLang);
      btnDel.addEventListener('click', async () => {
        if (confirm(t('confirm_delete_domain', { domain }, currentLang))) {
          chrome.runtime.sendMessage({ action: 'removeDomain', domain }, () => {
            delete customDomains[domain];
            renderCustomDomains();
            updateStats();
          });
        }
      });
      tdAction.appendChild(btnDel);

      tr.appendChild(tdDomain);
      tr.appendChild(tdDate);
      tr.appendChild(tdAction);

      customDomainsTbody.appendChild(tr);
    });
  }

  renderCustomDomains();

  // Add custom domain via input
  btnAddCustomDomain.addEventListener('click', () => {
    const raw = inputNewDomain.value.trim().toLowerCase();
    if (!raw) return;

    let clean = raw;
    try {
      if (clean.startsWith('http')) {
        clean = new URL(clean).hostname;
      }
      clean = clean.replace(/^www\./, '');
    } catch (e) {
      // Keep string as is
    }

    if (!clean.includes('.')) {
      alert(t('alert_invalid_domain', {}, currentLang));
      return;
    }

    chrome.runtime.sendMessage({ action: 'addDomain', domain: clean }, (res) => {
      if (res && res.success) {
        customDomains[clean] = { addedAt: new Date().toISOString(), plugin: 'CustomSite' };
        inputNewDomain.value = '';
        renderCustomDomains();
        updateStats();
        alert(t('alert_domain_added', { domain: clean }, currentLang));
      }
    });
  });

  // --- 6. Live Language Switcher ---
  if (settingLang) {
    settingLang.addEventListener('change', () => {
      currentLang = settingLang.value || DEFAULT_LANG;
      applyI18n(currentLang);
      renderSearchResults(lastSearchResults || initialList);
      renderCustomDomains();
      checkConnection();
    });
  }

  // --- 7. Save Settings ---
  btnSaveSettings.addEventListener('click', () => {
    const newSettings = {
      language: settingLang ? settingLang.value : currentLang,
      jdPort: parseInt(settingPort.value, 10) || 9666,
      defaultPackageTemplate: settingTemplate.value.trim() || 'WebGrab_{domain}',
      autoGrabEnabled: settingAutograb.checked,
      interceptDownloads: settingIntercept.checked,
      fallbackIfJdOffline: settingFallback.checked,
      notifyOnGrab: settingNotify.checked,
      showVideoOverlayButton: settingVideobtn ? settingVideobtn.checked : true
    };

    chrome.runtime.sendMessage({ action: 'saveSettings', settings: newSettings }, (res) => {
      if (res && res.success) {
        currentLang = newSettings.language;
        applyI18n(currentLang);
        saveSettingsMsg.classList.remove('hidden');
        setTimeout(() => {
          saveSettingsMsg.classList.add('hidden');
        }, 3000);
      }
    });
  });

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
