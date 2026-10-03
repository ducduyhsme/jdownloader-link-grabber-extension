/**
 * JDownloader 2 LinkGrabber Popup Logic
 * Multi-language supported (Default: English 'en', Vietnamese 'vi')
 */

import { t, applyI18n, DEFAULT_LANG } from '../i18n.js';

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
  let currentLang = DEFAULT_LANG;
  let currentPort = 9666;

  // 1. Get current active tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch (e) {
    // Ignore
  }

  // 2. Load settings and language
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response && response.settings) {
      currentLang = response.settings.language || DEFAULT_LANG;
      currentPort = response.settings.jdPort || 9666;
      applyI18n(currentLang);
      toggleAutograb.checked = !!response.settings.autoGrabEnabled;
      toggleIntercept.checked = response.settings.interceptDownloads !== false;
      toggleNotify.checked = !!response.settings.notifyOnGrab;
      refreshStatus();
    }
  });

  // 3. Update connection and domain status
  async function refreshStatus() {
    if (!currentTab || !currentTab.url) {
      currentDomainEl.textContent = t('popup_invalid_tab', {}, currentLang);
      btnPrimaryAction.disabled = true;
      btnActionText.textContent = '-';
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
        totalDomainsEl.textContent = t(
          'popup_total_domains',
          {
            builtin: (totalBuiltin || 0).toLocaleString(),
            custom: totalCustom || 0
          },
          currentLang
        );

        // Connection status
        if (isAlive) {
          connectionEl.className = 'status-badge online';
          connectionEl.innerHTML = `<span class="status-dot"></span><span>${t('popup_status_online', { port: currentPort }, currentLang)}</span>`;
        } else {
          connectionEl.className = 'status-badge offline';
          connectionEl.innerHTML = `<span class="status-dot"></span><span>${t('popup_status_offline', {}, currentLang)}</span>`;
        }

        // Domain match status
        btnPrimaryAction.disabled = false;

        if (match && match.isSupported) {
          if (match.isCustom) {
            siteBadgeEl.className = 'badge custom';
            siteBadgeEl.textContent = t('popup_badge_custom', {}, currentLang);
            pluginInfoEl.textContent = t('popup_custom_added', {}, currentLang);
            btnRemoveCustom.classList.remove('hidden');
          } else {
            siteBadgeEl.className = 'badge supported';
            const typeStr = (match.types || []).join(' / ') || 'Hoster';
            siteBadgeEl.textContent = t('popup_badge_supported', { types: typeStr }, currentLang);
            pluginInfoEl.textContent = t('popup_plugin_label', { plugin: match.plugin || 'Auto' }, currentLang);
            btnRemoveCustom.classList.add('hidden');
          }

          btnPrimaryAction.className = 'btn btn-primary';
          btnPrimaryAction.querySelector('.btn-icon').textContent = '📥';
          btnActionText.textContent = t('popup_btn_grab_again', {}, currentLang);
        } else {
          siteBadgeEl.className = 'badge unsupported';
          siteBadgeEl.textContent = t('popup_badge_unsupported', {}, currentLang);
          pluginInfoEl.textContent = t('popup_not_in_default', {}, currentLang);
          btnRemoveCustom.classList.add('hidden');

          btnPrimaryAction.className = 'btn btn-add-db';
          btnPrimaryAction.querySelector('.btn-icon').textContent = '➕';
          btnActionText.textContent = t('popup_btn_add_db', {}, currentLang);
        }
      }
    );
  }

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
      btnActionText.textContent = currentLang === 'vi' ? 'Đang thêm...' : 'Adding...';
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
            showMessage((res && res.message) || 'Error adding domain', false);
          }
        }
      );
    } else {
      // Re-send to LinkGrabber
      btnActionText.textContent = currentLang === 'vi' ? 'Đang gửi...' : 'Sending...';
      chrome.runtime.sendMessage(
        {
          action: 'grabUrl',
          url: currentTab.url
        },
        (res) => {
          btnPrimaryAction.disabled = false;
          btnActionText.textContent = t('popup_btn_grab_again', {}, currentLang);
          if (res && res.success) {
            showMessage(res.message, true);
          } else {
            showMessage((res && res.message) || 'Could not send to JDownloader', false);
          }
        }
      );
    }
  });

  // 5. Remove Custom Domain Button
  btnRemoveCustom.addEventListener('click', () => {
    if (!confirm(t('confirm_delete_domain', { domain: currentDomain }, currentLang))) {
      return;
    }

    btnRemoveCustom.disabled = true;
    chrome.runtime.sendMessage(
      { action: 'removeDomain', domain: currentDomain },
      (res) => {
        btnRemoveCustom.disabled = false;
        if (res && res.success) {
          showMessage(
            currentLang === 'vi'
              ? `Đã xóa ${currentDomain} khỏi database tùy chỉnh.`
              : `Removed ${currentDomain} from custom database.`,
            true
          );
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
