/**
 * JDownloader 2 LinkGrabber Content Script
 * - Displays subtle feedback toasts
 * - Injects a smart Download button overlay at top-right corner of video player areas
 *   for YouTube, Facebook, and generic HTML5 video players on supported video/social sites.
 */

(function () {
  let userLang = 'en';
  let showVideoBtn = true;

  const I18N = {
    en: {
      btn_video_download: 'Download with JD2',
      btn_video_download_tooltip: 'Send this video to JDownloader 2 LinkGrabber',
      btn_video_downloading: 'Sending...',
      btn_video_grabbed: 'Sent to JD2! ✓',
      toast_success: 'Sent video to JDownloader 2 LinkGrabber!',
      toast_fail: 'Failed to send to JDownloader 2: '
    },
    vi: {
      btn_video_download: 'Tải với JD2',
      btn_video_download_tooltip: 'Gửi video này vào JDownloader 2 LinkGrabber',
      btn_video_downloading: 'Đang gửi...',
      btn_video_grabbed: 'Đã gửi JD2! ✓',
      toast_success: 'Đã gửi video vào JDownloader 2 LinkGrabber!',
      toast_fail: 'Không thể gửi sang JDownloader 2: '
    }
  };

  function getMsg(key) {
    const dict = I18N[userLang] || I18N.en;
    return dict[key] || I18N.en[key] || key;
  }

  // Fetch initial language and video button settings
  chrome.storage.local.get(['settings'], (res) => {
    if (res && res.settings) {
      if (res.settings.language) {
        userLang = res.settings.language;
      }
      if (typeof res.settings.showVideoOverlayButton === 'boolean') {
        showVideoBtn = res.settings.showVideoOverlayButton;
      }
      if (!showVideoBtn) {
        removeAllVideoButtons();
      } else {
        scanAndInject();
      }
    }
  });

  // Watch for settings changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings && changes.settings.newValue) {
      const newSettings = changes.settings.newValue;
      userLang = newSettings.language || 'en';
      updateButtonLabels();

      if (typeof newSettings.showVideoOverlayButton === 'boolean') {
        const prevShow = showVideoBtn;
        showVideoBtn = newSettings.showVideoOverlayButton;
        if (!showVideoBtn) {
          removeAllVideoButtons();
        } else if (!prevShow) {
          scanAndInject();
        }
      }
    }
  });

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showToast') {
      showToast(message.text, message.isSuccess);
      sendResponse({ received: true });
    }
    return false;
  });

  function showToast(text, isSuccess = true) {
    let container = document.getElementById('jd-linkgrabber-toast');
    if (!container) {
      container = document.createElement('div');
      container.id = 'jd-linkgrabber-toast';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${isSuccess ? '#0f172a' : '#7f1d1d'};
        color: #f8fafc;
        border: 1px solid ${isSuccess ? '#38bdf8' : '#ef4444'};
        padding: 12px 18px;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const icon = isSuccess ? '⚡' : '⚠️';
    container.innerHTML = `<span style="font-size: 18px;">${icon}</span> <span>${text}</span>`;

    requestAnimationFrame(() => {
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      container.style.opacity = '0';
      container.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 400);
    }, 3500);
  }

  // ==========================================
  // Video Overlay Download Button Injection
  // ==========================================

  const VIDEO_DOMAINS = [
    'youtube.com',
    'youtu.be',
    'facebook.com',
    'fb.watch',
    'instagram.com',
    'tiktok.com',
    'twitter.com',
    'x.com',
    'bilibili.com',
    'vimeo.com',
    'dailymotion.com',
    'twitch.tv'
  ];

  const currentHost = window.location.hostname.toLowerCase();
  const isVideoSite = VIDEO_DOMAINS.some(d => currentHost === d || currentHost.endsWith('.' + d));

  function isYouTube() {
    return currentHost.includes('youtube.com') || currentHost === 'youtu.be';
  }

  function isFacebook() {
    return currentHost.includes('facebook.com') || currentHost.includes('fb.watch');
  }

  /**
   * Determine the most accurate URL for the targeted video.
   */
  function getVideoUrl(targetElement) {
    if (isYouTube()) {
      // YouTube Shorts: check current URL or reel renderer
      if (window.location.pathname.startsWith('/shorts/')) {
        return window.location.href;
      }
      const shortsRenderer = targetElement ? targetElement.closest('ytd-reel-video-renderer') : null;
      if (shortsRenderer) {
        // Find anchor inside shorts
        const anchor = shortsRenderer.querySelector('a[href*="/shorts/"]');
        if (anchor && anchor.href) return anchor.href;
      }
      return window.location.href;
    }

    if (isFacebook()) {
      if (targetElement) {
        const link = targetElement.closest('div[role="dialog"], div[role="article"], div[data-pagelet]')?.querySelector('a[href*="/videos/"], a[href*="/watch/"], a[href*="/reel/"]');
        if (link && link.href) return link.href;
      }
      return window.location.href;
    }

    return window.location.href;
  }

  /**
   * Create the stylized Download button.
   */
  function createDownloadButton(container, getTargetUrlFn) {
    const btn = document.createElement('button');
    btn.className = 'jd-video-overlay-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('title', getMsg('btn_video_download_tooltip'));
    btn.dataset.jdVideoBtn = 'true';

    btn.style.cssText = `
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 2147483640;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      background: rgba(15, 23, 42, 0.88);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.45);
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
      cursor: pointer;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      pointer-events: auto;
    `;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'jd-btn-icon';
    iconSpan.style.cssText = 'font-size: 13px; line-height: 1; display: inline-block;';
    iconSpan.textContent = '📥';

    const textSpan = document.createElement('span');
    textSpan.className = 'jd-btn-text';
    textSpan.textContent = getMsg('btn_video_download');

    btn.appendChild(iconSpan);
    btn.appendChild(textSpan);

    // Hover effect
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#0284c7';
      btn.style.color = '#ffffff';
      btn.style.borderColor = '#38bdf8';
      btn.style.transform = 'scale(1.04)';
      btn.style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.45)';
    });

    btn.addEventListener('mouseleave', () => {
      if (btn.dataset.status !== 'grabbed') {
        btn.style.background = 'rgba(15, 23, 42, 0.88)';
        btn.style.color = '#38bdf8';
        btn.style.borderColor = 'rgba(56, 189, 248, 0.45)';
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.55)';
      }
    });

    // Click handler
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      const targetUrl = getTargetUrlFn ? getTargetUrlFn() : window.location.href;
      if (!targetUrl) return;

      // Updating button state
      btn.disabled = true;
      textSpan.textContent = getMsg('btn_video_downloading');
      iconSpan.textContent = '⏳';
      btn.style.opacity = '0.7';

      chrome.runtime.sendMessage({ action: 'grabUrl', url: targetUrl }, (response) => {
        btn.disabled = false;
        btn.style.opacity = '1';

        if (response && response.success) {
          btn.dataset.status = 'grabbed';
          iconSpan.textContent = '✓';
          textSpan.textContent = getMsg('btn_video_grabbed');
          btn.style.background = '#16a34a';
          btn.style.color = '#ffffff';
          btn.style.borderColor = '#22c55e';
          showToast(getMsg('toast_success'), true);

          setTimeout(() => {
            btn.dataset.status = '';
            iconSpan.textContent = '📥';
            textSpan.textContent = getMsg('btn_video_download');
            btn.style.background = 'rgba(15, 23, 42, 0.88)';
            btn.style.color = '#38bdf8';
            btn.style.borderColor = 'rgba(56, 189, 248, 0.45)';
          }, 3500);
        } else {
          iconSpan.textContent = '⚠️';
          textSpan.textContent = getMsg('btn_video_download');
          const errorMsg = response ? response.message : 'Unknown error';
          showToast(getMsg('toast_fail') + errorMsg, false);
        }
      });
    });

    return btn;
  }

  function updateButtonLabels() {
    document.querySelectorAll('.jd-video-overlay-btn').forEach(btn => {
      if (btn.dataset.status !== 'grabbed') {
        const textSpan = btn.querySelector('.jd-btn-text');
        if (textSpan) textSpan.textContent = getMsg('btn_video_download');
        btn.setAttribute('title', getMsg('btn_video_download_tooltip'));
      }
    });
  }

  /**
   * Ensure container has relative positioning so absolute button is placed correctly.
   */
  function ensureRelativePosition(el) {
    const computed = window.getComputedStyle(el);
    if (computed.position === 'static') {
      el.style.position = 'relative';
    }
  }

  /**
   * YouTube Specific Injector
   */
  function injectYouTube() {
    // 1. Main player: #movie_player
    const mainPlayer = document.querySelector('#movie_player, .html5-video-player');
    if (mainPlayer && !mainPlayer.querySelector('.jd-video-overlay-btn')) {
      ensureRelativePosition(mainPlayer);
      const btn = createDownloadButton(mainPlayer, () => window.location.href);
      // Position slightly below YouTube's top controls bar if present
      btn.style.top = '16px';
      btn.style.right = '16px';
      mainPlayer.appendChild(btn);
    }

    // 2. YouTube Shorts: ytd-reel-video-renderer[is-active] or all rendered reels
    document.querySelectorAll('ytd-reel-video-renderer, ytd-shorts').forEach(reel => {
      const videoWrapper = reel.querySelector('.video-stream')?.parentElement || reel;
      if (videoWrapper && !reel.querySelector('.jd-video-overlay-btn')) {
        ensureRelativePosition(videoWrapper);
        const btn = createDownloadButton(videoWrapper, () => getVideoUrl(reel));
        btn.style.top = '20px';
        btn.style.right = '20px';
        videoWrapper.appendChild(btn);
      }
    });
  }

  /**
   * Facebook Specific Injector
   */
  function injectFacebook() {
    // Facebook embeds HTML5 video elements in multiple complex containers.
    // We locate each visible <video> element and inject into its player container.
    document.querySelectorAll('video').forEach(video => {
      if (video.offsetWidth < 180 || video.offsetHeight < 120) return; // skip tiny previews/stories
      // Find suitable player wrapper
      const wrapper = video.closest('[data-video-id], div[role="dialog"], div[role="region"]') || video.parentElement;
      if (wrapper && !wrapper.querySelector('.jd-video-overlay-btn')) {
        ensureRelativePosition(wrapper);
        const btn = createDownloadButton(wrapper, () => getVideoUrl(wrapper));
        wrapper.appendChild(btn);
      }
    });
  }

  /**
   * Generic HTML5 Video Injector for other video/social platforms
   */
  function injectGeneric() {
    document.querySelectorAll('video').forEach(video => {
      if (video.offsetWidth < 200 || video.offsetHeight < 150) return; // ignore tiny thumbnails
      const parent = video.parentElement;
      if (parent && !parent.querySelector('.jd-video-overlay-btn')) {
        ensureRelativePosition(parent);
        const btn = createDownloadButton(parent, () => window.location.href);
        parent.appendChild(btn);
      }
    });
  }

  /**
   * Remove all injected video download buttons if disabled in settings.
   */
  function removeAllVideoButtons() {
    document.querySelectorAll('.jd-video-overlay-btn').forEach(btn => {
      if (btn.parentNode) {
        btn.parentNode.removeChild(btn);
      }
    });
  }

  /**
   * Scan and inject buttons based on domain.
   */
  function scanAndInject() {
    if (!isVideoSite || !showVideoBtn) return;

    if (isYouTube()) {
      injectYouTube();
    } else if (isFacebook()) {
      injectFacebook();
    } else {
      injectGeneric();
    }
  }

  // Only activate video injection on supported video & social platforms
  if (isVideoSite) {
    // Initial scan
    scanAndInject();

    // DOM Mutation Observer to support SPA navigation (YouTube, Facebook, TikTok dynamic feeds)
    let scanTimeout = null;
    const observer = new MutationObserver(() => {
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(scanAndInject, 500);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    // Listen to custom SPA navigation events if available (e.g. YouTube yt-navigate-finish)
    window.addEventListener('yt-navigate-finish', () => setTimeout(scanAndInject, 300));
    window.addEventListener('popstate', () => setTimeout(scanAndInject, 300));
  }
})();
