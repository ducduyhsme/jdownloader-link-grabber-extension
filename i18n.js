/**
 * Internationalization (i18n) Module for JDownloader 2 LinkGrabber
 * Default language: 'en' (English). Also supports 'vi' (Vietnamese).
 */

export const DEFAULT_LANG = 'en';

export const MESSAGES = {
  en: {
    // Navigation & Brand
    brand_title: 'JDownloader 2',
    brand_subtitle_options: 'LinkGrabber Manager',
    brand_subtitle_popup: 'LinkGrabber Autodetect',
    nav_overview: '📊 Overview',
    nav_search: '🔍 Search Database',
    nav_custom: '⭐ Custom Domains',
    nav_settings: '⚙️ General Settings',

    // Connection
    conn_title: 'JDownloader 2 Status',
    conn_checking: 'Checking...',
    conn_online: 'Connected (Port {port})',
    conn_offline: 'Not Connected / Offline',
    btn_recheck: 'Recheck 🔄',

    // Overview Tab
    overview_title: 'System Overview',
    overview_desc: 'Overview of file-hosters and decrypters supported by JDownloader 2.',
    stat_total_domains: 'Total Supported Domains',
    stat_decrypters: 'Decrypter Shortlinks',
    stat_hosters: 'File-Hoster Plugins',
    stat_custom_domains: 'Custom Domains Added',
    how_it_works_title: '💡 How It Works',
    how_it_works_1: '<strong>Decrypters (Intermediate Shortlinks):</strong> Automatically detects multi-step decryption links and forwards them to JDownloader 2 LinkGrabber to crawl the final downloadable file.',
    how_it_works_2: '<strong>File-Hosters (Cloud & File Sharing):</strong> Captures links from file hosting providers (Mega.nz, Fshare.vn, Rapidgator, 1fichier, Google Drive, YouTube, etc.).',
    how_it_works_3: '<strong>Easy Addition:</strong> When visiting an unlisted website, simply right-click or open the extension menu and click <em>"Add to Database"</em>.',

    // Search Tab
    search_title: 'Database Search',
    search_desc: 'Search across 8,600+ default supported domains and plugins.',
    search_placeholder: 'Enter domain name (e.g., mega, fshare, rapid, adfly, ouo, 1fichier)...',
    search_popular_hint: 'Showing {count} popular domains',
    search_results_hint: 'Found {count} results (max 100)',
    search_no_results: 'No matching domains found in the database.',
    th_domain: 'Domain Name',
    th_type: 'Classification',
    th_plugin: 'JDownloader Plugin',
    th_status: 'Status',
    tag_custom: '⭐ Custom',
    tag_decrypter: '🔓 Decrypter',
    tag_hoster: '📦 Hoster',
    status_autograb: '✓ Auto-grab active',

    // Custom Domains Tab
    custom_title: 'User Custom Domains',
    custom_desc: 'Websites added manually or via the "Add to Database" button.',
    input_custom_placeholder: 'Enter new domain (e.g., mycustomshare.com)...',
    btn_add_custom: '➕ Add to Database',
    th_date_added: 'Date Added',
    th_action: 'Action',
    btn_delete: '🗑️ Delete',
    custom_empty: 'No custom domains added yet. You can add one using the input above or via right-click / extension popup.',
    confirm_delete_domain: 'Are you sure you want to remove "{domain}" from your custom database?',
    alert_invalid_domain: 'Please enter a valid domain name (e.g., sharefile.net)!',
    alert_domain_added: 'Successfully added {domain} to Database!',

    // Settings Tab
    settings_title: 'General Settings',
    settings_desc: 'Configure JDownloader 2 connection and auto-grab behavior.',
    setting_lang_label: 'Display Language / Ngôn ngữ',
    setting_lang_desc: 'Select the extension display language (English is default)',
    setting_port_label: 'JDownloader 2 Port',
    setting_port_desc: 'Default is 9666 (FlashGot / Click\'n\'Load loopback API)',
    setting_template_label: 'Package Name Template',
    setting_template_desc: 'Use {domain} and {date} to customize package name in LinkGrabber',
    setting_autograb_label: 'Auto-Grab Links',
    setting_autograb_desc: 'Automatically push links to LinkGrabber when visiting supported sites',
    setting_intercept_label: 'Download Interception',
    setting_intercept_desc: 'Intercept browser file downloads and forward them into JDownloader 2',
    setting_fallback_label: 'Offline Fallback',
    setting_fallback_desc: 'Allow Chrome to download normally if JDownloader 2 is not running',
    setting_notify_label: 'Desktop Notifications',
    setting_notify_desc: 'Show desktop notifications when links or downloads are captured',
    setting_video_btn_label: 'Video Download Button',
    setting_video_btn_desc: 'Show "Download with JD2" overlay button at the top-right of video players',
    btn_save_settings: 'Save Settings',
    msg_settings_saved: 'Settings saved successfully!',

    // Popup UI
    popup_current_page: 'Current Page',
    popup_badge_supported: '⚡ Supported ({types})',
    popup_badge_custom: '⭐ Custom',
    popup_badge_unsupported: '❓ Not in Database',
    popup_plugin_label: 'JDownloader Plugin: {plugin}',
    popup_custom_added: 'Type: Custom (Added by you)',
    popup_not_in_default: 'Not in default supported list',
    popup_btn_grab_again: 'Re-send to LinkGrabber',
    popup_btn_add_db: 'Add this site to Database',
    popup_btn_remove_custom: '🗑️ Remove from Custom Database',
    popup_btn_manage_db: 'Database Manager ⚙️',
    popup_total_domains: '{builtin} (+{custom} custom)',
    popup_invalid_tab: 'No valid web page open',
    popup_status_online: 'JD2: Online ({port})',
    popup_status_offline: 'JD2: Offline',

    // Context Menus & Notifications
    menu_add_domain: '➕ Add this domain to JDownloader Database',
    menu_send_page: '📥 Send this page to LinkGrabber',
    menu_send_link: '📥 Send link to LinkGrabber',
    notif_title: 'JDownloader 2 LinkGrabber',
    notif_grab_single: 'Grabbed link from {domain} ({plugin})',
    notif_grab_multi: 'Automatically grabbed {count} links sent to JDownloader 2.',
    notif_download_success: 'Transferred {filename} from {domain} to JDownloader 2!',
    notif_download_error: 'Failed to send file to JDownloader: {error}',
    notif_jd_offline_title: 'JDownloader 2 Offline',
    notif_jd_offline_message: 'JDownloader 2 is not running. Chrome will proceed with downloading normally.',
    notif_domain_added: 'Added {domain} to Database!',

    // Video Player Overlay Button
    btn_video_download: 'Download with JD2',
    btn_video_download_tooltip: 'Send this video to JDownloader 2 LinkGrabber',
    btn_video_downloading: 'Sending...',
    btn_video_grabbed: 'Sent to JD2! ✓'
  },
  vi: {
    // Navigation & Brand
    brand_title: 'JDownloader 2',
    brand_subtitle_options: 'LinkGrabber Manager',
    brand_subtitle_popup: 'LinkGrabber Autodetect',
    nav_overview: '📊 Tổng quan',
    nav_search: '🔍 Tra cứu Database',
    nav_custom: '⭐ Danh sách tùy chỉnh',
    nav_settings: '⚙️ Cài đặt chung',

    // Connection
    conn_title: 'Trạng thái JDownloader 2',
    conn_checking: 'Đang kiểm tra...',
    conn_online: 'Đã kết nối (Cổng {port})',
    conn_offline: 'Chưa kết nối JDownloader 2',
    btn_recheck: 'Kiểm tra lại 🔄',

    // Overview Tab
    overview_title: 'Tổng quan hệ thống',
    overview_desc: 'Thông tin các đường dẫn file-hoster và decrypter được JDownloader 2 hỗ trợ.',
    stat_total_domains: 'Tổng số domain hỗ trợ',
    stat_decrypters: 'Decrypter Shortlinks',
    stat_hosters: 'File-Hoster Plugins',
    stat_custom_domains: 'Domain do bạn thêm',
    how_it_works_title: '💡 Cơ chế hoạt động',
    how_it_works_1: '<strong>Decrypters (Shortlinks trung gian):</strong> Tự động phát hiện các liên kết giải mã qua nhiều bước và chuyển cho JDownloader 2 LinkGrabber crawl đường dẫn tải file cuối cùng.',
    how_it_works_2: '<strong>File-Hosters (Lưu trữ / Chia sẻ):</strong> Bắt link từ các dịch vụ lưu trữ đám mây (Mega.nz, Fshare.vn, Rapidgator, 1fichier, Google Drive, YouTube, v.v.).',
    how_it_works_3: '<strong>Bổ sung dễ dàng:</strong> Khi gặp trang web chưa có trong danh sách, chỉ cần nhấn chuột phải hoặc mở extension và bấm <em>"Thêm vào Database"</em>.',

    // Search Tab
    search_title: 'Tra cứu danh sách hỗ trợ',
    search_desc: 'Tìm kiếm trong hơn 8,600 domains và plugins được hỗ trợ mặc định.',
    search_placeholder: 'Nhập tên miền (ví dụ: mega, fshare, rapid, adfly, ouo, 1fichier)...',
    search_popular_hint: 'Hiển thị {count} domain phổ biến',
    search_results_hint: 'Tìm thấy {count} kết quả (tối đa 100)',
    search_no_results: 'Không tìm thấy domain phù hợp trong cơ sở dữ liệu.',
    th_domain: 'Tên miền (Domain)',
    th_type: 'Phân loại',
    th_plugin: 'Tên Plugin JDownloader',
    th_status: 'Trạng thái',
    tag_custom: '⭐ Tùy chỉnh',
    tag_decrypter: '🔓 Decrypter',
    tag_hoster: '📦 Hoster',
    status_autograb: '✓ Tự động bắt link',

    // Custom Domains Tab
    custom_title: 'Domain do người dùng thêm',
    custom_desc: 'Các website bạn đã thêm thủ công hoặc qua nút "Thêm vào Database".',
    input_custom_placeholder: 'Nhập domain mới (ví dụ: mycustomshare.com)...',
    btn_add_custom: '➕ Thêm vào Database',
    th_date_added: 'Ngày thêm',
    th_action: 'Thao tác',
    btn_delete: '🗑️ Xóa',
    custom_empty: 'Chưa có domain tùy chỉnh nào. Bạn có thể thêm bằng ô bên trên hoặc nhấn nút trong menu chuột phải/extension popup.',
    confirm_delete_domain: 'Xác nhận xóa "{domain}" khỏi database tùy chỉnh?',
    alert_invalid_domain: 'Vui lòng nhập tên miền hợp lệ (ví dụ: sharefile.net)!',
    alert_domain_added: 'Đã thêm {domain} vào Database thành công!',

    // Settings Tab
    settings_title: 'Cài đặt chung',
    settings_desc: 'Tùy chỉnh cấu hình kết nối JDownloader 2 và hành vi tự động bắt link.',
    setting_lang_label: 'Ngôn ngữ hiển thị / Language',
    setting_lang_desc: 'Chọn ngôn ngữ hiển thị cho tiện ích (Mặc định là Tiếng Anh)',
    setting_port_label: 'Cổng kết nối JDownloader 2',
    setting_port_desc: 'Mặc định là 9666 (FlashGot / Click\'n\'Load)',
    setting_template_label: 'Mẫu tên gói (Package Name)',
    setting_template_desc: 'Sử dụng {domain} và {date} để tạo tên gói trong LinkGrabber',
    setting_autograb_label: 'Tự động bắt link (Auto-Grab)',
    setting_autograb_desc: 'Tự động gửi link vào LinkGrabber khi bạn truy cập website hỗ trợ',
    setting_intercept_label: 'Chặn Chrome tải xuống (Download Interception)',
    setting_intercept_desc: 'Chuyển hướng toàn bộ lượt tải từ trình duyệt vào JDownloader 2 LinkGrabber',
    setting_fallback_label: 'Dự phòng khi JD2 chưa bật (Fallback)',
    setting_fallback_desc: 'Cho phép Chrome tiếp tục tải bình thường nếu JDownloader 2 đang tắt',
    setting_notify_label: 'Hiển thị thông báo',
    setting_notify_desc: 'Bật thông báo trên màn hình mỗi khi bắt link hoặc chuyển file thành công',
    setting_video_btn_label: 'Nút tải trên video (Video Button)',
    setting_video_btn_desc: 'Hiển thị nút "Tải với JD2" ở góc trên bên phải khung phát video',
    btn_save_settings: 'Lưu cài đặt',
    msg_settings_saved: 'Đã lưu cài đặt thành công!',

    // Popup UI
    popup_current_page: 'Trang hiện tại',
    popup_badge_supported: '⚡ Hỗ trợ ({types})',
    popup_badge_custom: '⭐ Tùy chỉnh',
    popup_badge_unsupported: '❓ Chưa có trong DB',
    popup_plugin_label: 'JDownloader Plugin: {plugin}',
    popup_custom_added: 'Loại: Tùy chỉnh (Đã thêm bởi bạn)',
    popup_not_in_default: 'Chưa có trong danh sách hỗ trợ mặc định',
    popup_btn_grab_again: 'Gửi lại vào LinkGrabber',
    popup_btn_add_db: 'Thêm trang này vào Database',
    popup_btn_remove_custom: '🗑️ Xóa khỏi Database tùy chỉnh',
    popup_btn_manage_db: 'Quản lý Database ⚙️',
    popup_total_domains: '{builtin} (+{custom} tùy chỉnh)',
    popup_invalid_tab: 'Không có trang web hợp lệ',
    popup_status_online: 'JD2: Online ({port})',
    popup_status_offline: 'JD2: Chưa mở',

    // Context Menus & Notifications
    menu_add_domain: '➕ Thêm trang web này vào JDownloader Database',
    menu_send_page: '📥 Gửi trang này vào LinkGrabber',
    menu_send_link: '📥 Gửi link này vào LinkGrabber',
    notif_title: 'JDownloader 2 LinkGrabber',
    notif_grab_single: 'Tự động bắt link từ {domain} ({plugin})',
    notif_grab_multi: 'Đã tự động bắt {count} liên kết gửi sang JDownloader 2.',
    notif_download_success: 'Đã chuyển file {filename} từ {domain} sang JDownloader 2!',
    notif_download_error: 'Không thể chuyển file sang JDownloader: {error}',
    notif_jd_offline_title: 'JDownloader 2 Chưa Mở',
    notif_jd_offline_message: 'JDownloader 2 chưa chạy. Trình duyệt Chrome sẽ tiếp tục tải file.',
    notif_domain_added: 'Đã thêm {domain} vào Database thành công!',

    // Video Player Overlay Button
    btn_video_download: 'Tải với JD2',
    btn_video_download_tooltip: 'Gửi video này vào JDownloader 2 LinkGrabber',
    btn_video_downloading: 'Đang gửi...',
    btn_video_grabbed: 'Đã gửi JD2! ✓'
  }
};

/**
 * Format string with parameter interpolation.
 * Example: t('conn_online', { port: 9666 }, 'en') => "Connected (Port 9666)"
 */
export function t(key, params = {}, lang = DEFAULT_LANG) {
  const dict = MESSAGES[lang] || MESSAGES[DEFAULT_LANG];
  let text = dict[key] || MESSAGES[DEFAULT_LANG][key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

/**
 * Automatically translate all elements with data-i18n attributes in the document.
 */
export function applyI18n(lang = DEFAULT_LANG) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const translated = t(key, {}, lang);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.getAttribute('placeholder')) {
        el.setAttribute('placeholder', translated);
      }
    } else {
      if (translated.includes('<')) {
        el.innerHTML = translated;
      } else {
        el.textContent = translated;
      }
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key, {}, lang));
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.setAttribute('title', t(key, {}, lang));
  });
}
