/**
 * JDownloader 2 LinkGrabber Content Script
 * Displays subtle feedback toast and assists with page actions.
 */

(function () {
  // Listen for messages from background script
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

    // Trigger animation
    requestAnimationFrame(() => {
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    });

    // Auto hide
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
})();
