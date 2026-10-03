# JDownloader 2 LinkGrabber Autodetect (Chrome Extension)

Extension Google Chrome tự động nhận diện các website chia sẻ file (file-hosters) và đường link rút gọn trung gian (decrypters) được JDownloader 2 hỗ trợ, sau đó tự động đẩy liên kết vào mục **LinkGrabber** trong JDownloader 2.

---

## 🌟 Tính Năng Nổi Bật

1. **Cơ sở dữ liệu hỗ trợ toàn diện (8,613+ Domains):**
   - Tự động trích xuất và phân tích toàn bộ plugin trong 2 thư mục `jd\plugins\decrypter` và `jd\plugins\hoster` của JDownloader 2.
   - Hỗ trợ đầy đủ các host phổ biến: Mega.nz, Fshare.vn, Rapidgator, Mediafire, 1fichier, Google Drive, Youtube, Adf.ly, Filecrypt, Ouo.io, Dropgalaxy, Ddownload, Pixeldrain,... và hơn 8,600 domains khác.

2. **Tự động bắt link thông minh & Chống spam thông báo (Smart Auto-Grab):**
   - Khi bạn truy cập bất kỳ trang web nào nằm trong database, extension sẽ nhận diện và tự động gửi link đó sang JDownloader 2 (LinkGrabber) thông qua cổng nội bộ `127.0.0.1:9666`.
   - **Bảo vệ khởi động (Startup Protection):** Khi vừa mở máy và bật Chrome, trình duyệt thường tự khôi phục lại các tab từ phiên làm việc trước. Tiện ích sẽ kích hoạt chế độ chờ an toàn (15 giây) và chụp ảnh toàn bộ các tab cũ để tuyệt đối **không tự động bắt link** và **không làm phiền bằng thông báo rác khi vừa mở máy**.
   - **Bỏ qua tab chạy ngầm (Active Tab only):** Chỉ bắt link khi bạn đang thực sự mở và tương tác trên tab đó.
   - **Bộ lọc trang chủ & điều hướng (Content-only Filter):** Tự động bỏ qua các trang chủ, trang tin tức, bảng điều khiển (như `youtube.com/`, `mega.nz/`, `facebook.com/`, `drive.google.com/drive/my-drive`, `fshare.vn/`), chỉ tự động bắt khi URL thực sự là link video, link tải file, thư mục chia sẻ hoặc link rút gọn giải mã.
   - **Lưu lịch sử bắt link bền vững:** Ghi nhớ các link đã bắt trong 12 tiếng vào bộ nhớ trình duyệt để không bao giờ bắt lại nhiều lần gây trùng lặp.
   - **Chống tràn thông báo:** Các thông báo được gộp chung vào 1 khung duy nhất và tự động biến mất sau 4 giây, không gây chồng chéo lên góc phải màn hình Windows.

3. **Nút bổ sung website ngoài danh sách vào Database (Yêu cầu chính):**
   - **Menu chuột phải (Context Menu):** Click chuột phải vào bất kỳ trang web nào và chọn **"➕ Thêm trang web này vào JDownloader Database"** để thêm domain vào bộ nhớ và gửi ngay link đến LinkGrabber.
   - **Extension Menu (Popup):** Mở popup extension trên thanh công cụ, nếu trang chưa có trong database, một nút lớn **"➕ Thêm trang này vào Database"** sẽ xuất hiện để bạn bấm lưu ngay lập tức.
   - Sau khi thêm, domain được lưu vĩnh viễn vào bộ nhớ extension (`chrome.storage.local`) và sẽ được tự động nhận diện trong các lần truy cập tiếp theo.

4. **Chặn Chrome tải xuống & Tự động đẩy vào LinkGrabber (Download Interception):**
   - Khi bạn bấm nút tải xuống bất kỳ tệp nào trên trình duyệt Chrome (từ nút download trên trang web, file đính kèm, liên kết trực tiếp,...), Chrome sẽ **không tự tải file về máy**.
   - Extension sẽ tự động chặn (cancel) tác vụ tải của Chrome, xóa khỏi danh sách tải xuống để giữ sạch thanh tải, và gửi đường dẫn tải đó sang **LinkGrabber trong JDownloader 2**.
   - Có cơ chế **Dự phòng thông minh (Fallback)**: Nếu JDownloader 2 chưa được mở, trình duyệt sẽ hiển thị thông báo và cho phép Chrome tiếp tục tải bình thường để không làm gián đoạn công việc của bạn.
   - Bạn có thể bật/tắt tính năng chặn tải này bất kỳ lúc nào ngay trong Popup hoặc trong trang Cài đặt chung.

5. **Giao diện Popup & Trang Quản Lý Hiện Đại:**
   - Xem trạng thái kết nối thời gian thực với JDownloader 2 (Online / Offline).
   - Nút gửi lại liên kết thủ công.
   - Trang Options (`Quản lý Database ⚙️`) cho phép tra cứu danh sách 8,600+ domain, quản lý danh sách domain tùy chỉnh của bạn, và tùy biến cấu hình.

---

## 🚀 Hướng Dẫn Cài Đặt Vào Google Chrome / Edge / Cốc Cốc

1. Mở trình duyệt Chrome và truy cập vào:
   ```
   chrome://extensions/
   ```
2. Ở góc trên bên phải, bật công tắc **"Developer mode" (Chế độ dành cho nhà phát triển)**.
3. Nhấn vào nút **"Load unpacked" (Tải tiện ích đã giải nén)** ở góc trên bên trái.
4. Chọn thư mục extension:
   ```
   C:\Users\Duy\.gemini\antigravity\scratch\jdownloader-link-grabber-extension
   ```
5. Tiện ích **JDownloader 2 LinkGrabber Autodetect** sẽ xuất hiện trên thanh tiện ích của Chrome. Bạn có thể ghim (Pin) biểu tượng extension lên thanh công cụ để tiện theo dõi.

---

## 🛠️ Cập Nhật Lại Database (Khi JDownloader Cập Nhật Plugins Mới)

Nếu JDownloader 2 vừa cập nhật thêm các plugins mới, bạn có thể chạy script để tự động quét lại toàn bộ thư mục `jd\plugins` và cập nhật file `database.json`:

```powershell
python "C:\Users\Duy\.gemini\antigravity\scratch\jdownloader-link-grabber-extension\scripts\extract_plugins.py"
```

Sau khi chạy xong, vào `chrome://extensions/` và bấm nút **Reload (Làm mới)** trên tiện ích để cập nhật database mới.
