/**
 * JDownloader 2 LinkGrabber Popup Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const connectionEl = document.getElementById('connection-status');
  const siteBadgeEl = document.getElementById('site-badge');
  const currentDomainEl = document.getElementById('current-domain');
  const pluginInfoEl = document.getElementById('plugin-info');
  const btnPrimaryAction = document.getElementById('btn-primary-action');
  const btnActionText = document.getElementById('btn-action-text');
  const btnRemoveCustom = document.getElementById('btn-remove-custom');
  const actionMessageEl = document.getElementById('action-message');
  const toggleAutograb = document.getElementById('toggle-autograb');
  const toggleIntercept = document.getElementById('toggle-intercept');
  const toggleNotify = document.getElementById('toggle-notify');
  const totalDomainsEl = document.getElementById('total-domains');
  const btnOpenOptions = document.getElementById('btn-open-options');

  let currentTab = null;
  let currentMatch = null;
  let currentDomain = '';

  // 1. Get current active tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch (e) {
    // Ignore
  }

  // 2. Load settings
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response && response.settings) {
      toggleAutograb.checked = !!response.settings.autoGrabEnabled;
      toggleIntercept.checked = response.settings.interceptDownloads !== false;
      toggleNotify.checked = !!response.settings.notifyOnGrab;
    }
  });

  // 3. Update connection and domain status
  async function refreshStatus() {
    if (!currentTab || !currentTab.url) {
      currentDomainEl.textContent = 'Không có trang web hợp lệ';
      btnPrimaryAction.disabled = true;
      btnActionText.textContent = 'Không khả dụng';
      return;
    }

    try {
      const url = new URL(currentTab.url);
      currentDomain = url.hostname.replace(/^www\./, '');
      currentDomainEl.textContent = currentDomain;
    } catch (e) {
      currentDomainEl.textContent = currentTab.url;
    }

    chrome.runtime.sendMessage(
      { action: 'checkTabStatus', url: currentTab.url },
      (response) => {
        if (!response) return;

        const { match, isAlive, totalBuiltin, totalCustom } = response;
        currentMatch = match;

        // Total domains count
        totalDomainsEl.textContent = `${(totalBuiltin || 0).toLocaleString()} (+${totalCustom || 0} tùy chỉnh)`;

        // Connection status
        if (isAlive) {
          connectionEl.className = 'status-badge online';
          connectionEl.innerHTML = '<span class="status-dot"></span><span>JD2: Online (9666)</span>';
        } else {
          connectionEl.className = 'status-badge offline';
          connectionEl.innerHTML = '<span class="status-dot"></span><span>JD2: Chưa mở</span>';
        }

        // Domain match status
        btnPrimaryAction.disabled = false;

        if (match && match.isSupported) {
          if (match.isCustom) {
            siteBadgeEl.className = 'badge custom';
            siteBadgeEl.textContent = '⭐ Tùy chỉnh';
            pluginInfoEl.textContent = `Loại: Tùy chỉnh (Đã thêm bởi bạn)`;
            btnRemoveCustom.classList.remove('hidden');
          } else {
            siteBadgeEl.className = 'badge supported';
            const typeStr = (match.types || []).join(' / ') || 'Hoster';
            siteBadgeEl.textContent = `⚡ Hỗ trợ (${typeStr})`;
            pluginInfoEl.textContent = `JDownloader Plugin: ${match.plugin || 'Tự động'}`;
            btnRemoveCustom.classList.add('hidden');
          }

          btnPrimaryAction.className = 'btn btn-primary';
          btnPrimaryAction.querySelector('.btn-icon').textContent = '📥';
          btnActionText.textContent = 'Gửi lại vào LinkGrabber';
        } else {
          siteBadgeEl.className = 'badge unsupported';
          siteBadgeEl.textContent = '❓ Chưa có trong DB';
          pluginInfoEl.textContent = 'Chưa có trong danh sách hỗ trợ mặc định';
          btnRemoveCustom.classList.add('hidden');

          btnPrimaryAction.className = 'btn btn-add-db';
          btnPrimaryAction.querySelector('.btn-icon').textContent = '➕';
          btnActionText.textContent = 'Thêm trang này vào Database';
        }
      }
    );
  }

  await refreshStatus();

  // Helper to show message
  function showMessage(text, isSuccess = true) {
    actionMessageEl.textContent = text;
    actionMessageEl.className = `action-message ${isSuccess ? 'success' : 'error'}`;
    actionMessageEl.classList.remove('hidden');
    setTimeout(() => {
      actionMessageEl.classList.add('hidden');
    }, 4000);
  }

  // 4. Primary Button Click: Add to DB or Grab URL
  btnPrimaryAction.addEventListener('click', () => {
    btnPrimaryAction.disabled = true;

    if (!currentMatch || !currentMatch.isSupported) {
      // Add to database
      btnActionText.textContent = 'Đang thêm...';
      chrome.runtime.sendMessage(
        {
          action: 'addDomain',
          domain: currentDomain,
          url: currentTab.url
        },
        (res) => {
          btnPrimaryAction.disabled = false;
          if (res && res.success) {
            showMessage(res.message, true);
            refreshStatus();
          } else {
            showMessage((res && res.message) || 'Lỗi khi thêm domain', false);
          }
        }
      );
    } else {
      // Re-send to LinkGrabber
      btnActionText.textContent = 'Đang gửi...';
      chrome.runtime.sendMessage(
        {
          action: 'grabUrl',
          url: currentTab.url
        },
        (res) => {
          btnPrimaryAction.disabled = false;
          btnActionText.textContent = 'Gửi lại vào LinkGrabber';
          if (res && res.success) {
            showMessage(res.message, true);
          } else {
            showMessage((res && res.message) || 'Không thể gửi tới JDownloader', false);
          }
        }
      );
    }
  });

  // 5. Remove Custom Domain Button
  btnRemoveCustom.addEventListener('click', () => {
    if (!confirm(`Bạn có chắc muốn xóa "${currentDomain}" khỏi database tùy chỉnh?`)) {
      return;
    }

    btnRemoveCustom.disabled = true;
    chrome.runtime.sendMessage(
      { action: 'removeDomain', domain: currentDomain },
      (res) => {
        btnRemoveCustom.disabled = false;
        if (res && res.success) {
          showMessage(`Đã xóa ${currentDomain} khỏi database tùy chỉnh.`, true);
          refreshStatus();
        }
      }
    );
  });

  // 6. Toggles change handlers
  toggleAutograb.addEventListener('change', () => {
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: { autoGrabEnabled: toggleAutograb.checked }
    });
  });

  toggleIntercept.addEventListener('change', () => {
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: { interceptDownloads: toggleIntercept.checked }
    });
  });

  toggleNotify.addEventListener('change', () => {
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: { notifyOnGrab: toggleNotify.checked }
    });
  });

  // 7. Open Options Page
  btnOpenOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
