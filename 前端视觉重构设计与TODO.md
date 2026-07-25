# Thiết kế tái cấu trúc hình ảnh frontend Suối nước nóng và TODO

## Mục tiêu tái cấu trúc

Vòng này là tái cấu trúc hoàn chỉnh 4 trang preview, không phải vá cục bộ.

Các trang cần hoàn thành:

- `frontend-mode-select.html`: màn hình tiêu đề, chứa bắt đầu, tiếp tục, load save, chọn gameplay và cổng vào setting.
- `frontend-preview.html`: gameplay chủ tiệm, mật độ thông tin kinh doanh cao nhất, cho phép hiển thị dữ liệu kinh doanh nhân viên.
- `frontend-customer-preview.html`: gameplay khách, lấy chỉ định, dịch vụ, thiện cảm, danh bạ và tiêu dùng làm cốt lõi.
- `frontend-waiter-preview.html`: gameplay nhân viên, lấy ca trực, tiếp khách, số lần kết quả, trưởng thành, thu nhập và đánh giá làm cốt lõi.

## Quy tắc cứng

- Trang chơi mặc định luôn là màn hình kiểu galgame: background cảnh, vùng ảnh minh họa nhân vật, khung tên, hộp thoại, một ít HUD tự nhiên.
- Trừ khi có yêu cầu rõ ràng, không làm lại kết cấu màn hình khởi đầu galgame mặc định, chỉ điều chỉnh tư liệu, nút, menu và tầng thông tin.
- Giao diện chơi không được xuất hiện từ ngữ triển khai nội bộ: MVU, world book, script, biến, AI, prompt, phán định frontend, kết cấu chính văn v.v.
- Menu là menu game mà người chơi có thể hiểu, không phải panel kỹ thuật.
- Gameplay chủ tiệm có thể hiển thị dữ liệu kinh doanh như số lần dịch vụ nhân viên, số lần chỉ định, kết quả thêm v.v.
- Gameplay khách không hiển thị số lần backend hay mức độ khai thác của nhân viên, chỉ hiển thị thiện cảm, danh bạ, đặt lịch, tiêu dùng mà người chơi có thể cảm nhận được.
- Gameplay nhân viên hiển thị số lần kết quả khách quan, độ thành thạo, thu nhập và đánh giá của "bản thân", nhưng không thay người chơi quyết định thái độ, tâm lý, đồng ý hay từ chối.
- 3 gameplay vẫn là gameplay độc lập được chọn khi khởi đầu; trang tiêu đề có thể quay lại và đổi gameplay, không có nghĩa là đổi danh tính nóng giữa gameplay.

## Ngôn ngữ hình ảnh

Hướng tham khảo: đêm khách sạn suối nước nóng, tông màu ấm độ bão hòa thấp, gỗ tối màu, HUD màu sáng trên cảnh tối, menu sát mép, đường phân cách mảnh, lớp phủ bán trong suốt nhẹ.

Hiệu ứng cốt lõi:

- Background dùng ảnh sinh ra, thống nhất cảnh 16:9.
- Background là chủ thể giao diện, không còn lồng khung ngoài lớn.
- Trang mặc định là HUD game: thẻ trạng thái trái, thông tin nhỏ trên cùng, cột thao tác phải, dải hội thoại nhẹ dưới cùng.
- Khi mở menu background tối và mờ đi, thông tin nổi trực tiếp trên cảnh.
- Thông tin kinh doanh và trạng thái dùng đường mảnh, đường chấm, thanh đo ngắn và danh sách, không dùng tường card kiểu backend.
- Nút dùng viên nang hẹp, icon và chữ ngắn, cố gắng gần với menu game.
- Ảnh minh họa nhân vật đứng trực tiếp trong cảnh, không đặt vào khung, không dùng hình nhân giả CSS.
- Cấm coi việc chỉnh màu trang cũ là tái cấu trúc; tái cấu trúc bắt buộc phải thay đổi kết cấu, tầng layout và ngôn ngữ hình ảnh.

## Hướng của 4 trang

### Màn hình tiêu đề

- Màn hình đầu tiên giống như trang tiêu đề game thật.
- Menu chính: bắt đầu game, tiếp tục game, load save, chọn gameplay, setting, thoát giao diện.
- Chọn gameplay dùng 3 card ngang: chủ tiệm, khách, nhân viên.
- Tiếp tục game và load save hiển thị card save, nhưng không viết từ ngữ triển khai nội bộ.

### Gameplay chủ tiệm

- Màn hình mặc định vẫn là chủ tiệm đối thoại với nhân viên trong cảnh Suối nước nóng.
- Phân loại menu: tổng quan, xếp ca, khu vực, nhân viên, dự án, chỉ định, chợ nhân tài, tuyển dụng, quyết toán.
- Tổng quan hiển thị vốn, đánh giá tiệm, tỷ lệ đánh giá tốt, đặt lịch hôm nay, chiếm dụng chỉ định, độ hot dự án, log việc cần làm.
- Xếp ca sau khi bấm ô thời gian nhân viên, chọn nghỉ, chờ hoặc khu vực ở bên cạnh, và có nút xác nhận xếp ca.
- Khi nhân viên không cùng khu vực chỉ hiển thị đến; sau khi cùng khu vực mới hiển thị trò chuyện, tăng lương ngày, xem dịch vụ.
- Chợ nhân tài chỉ làm mua, giao lưu, thông tin ứng viên, không bán rao nhân viên của mình.
- Đếm ngược tuyển dụng đặt ở vị trí nổi bật trên trang tuyển dụng, mặc định làm mới 12 giờ.
- Quyết toán là quyết toán trực tiếp hôm đó và đẩy tới 00:00.

### Gameplay khách

- Cốt lõi là chỉ định, chọn dịch vụ, tăng thiện cảm, yêu cầu liên hệ, hẹn riêng.
- Phân loại menu: hôm nay, dịch vụ, chỉ định, quan hệ, danh bạ, vốn, ghi chép.
- Chỉ ghi vốn của người chơi, không tách tiền mặt và tiền gửi.
- Có thể làm thêm để kiếm vốn, làm cổng vào tăng cảm giác thật, không bắt buộc.
- Sau khi kết thúc dịch vụ có cổng vào đánh giá, tiền boa, yêu cầu liên hệ.
- Danh bạ chỉ hiển thị quan hệ liên hệ đã đồng ý hoặc đang chờ đẩy, không hiển thị số lần backend của nhân viên.

### Gameplay nhân viên

- Cốt lõi là từ góc nhìn bản thân đến ca, tiếp khách, giành đánh giá, nâng cấp và thu nhập.
- Chỉ định không thể từ chối, nhưng dịch vụ thêm không bắt buộc.
- Người chơi có thể dựa vào dịch vụ tiêu chuẩn, từ chối lịch sự, giao tiếp khéo léo hoặc dịch vụ thêm để tiến lên.
- Phân loại menu: ca trực, tiếp khách, chỉ định, trưởng thành, thu nhập, đánh giá, ghi chép.
- Trang trưởng thành hiển thị số lần kết quả khách quan và độ thành thạo, không ghi thái độ người chơi.
- Trang thu nhập tách lương ngày, tiền boa, thu nhập thêm, chia phần chỉ định.

## TODO

### A. Xác nhận thiết kế

- [x] Xác nhận vòng này là tái cấu trúc hoàn chỉnh 4 trang.
- [x] Xác nhận trang khởi đầu galgame mặc định là màn hình đầu tiên quan trọng nhất của mọi gameplay.
- [x] Xác nhận giao diện chơi không lộ từ ngữ triển khai nội bộ.
- [x] Xác nhận trang tiêu đề đổi thành trang bắt đầu game thật.

### B. Tư liệu

- [x] Đưa vào background tiêu đề `assets/onsen-refactor/title-night-entrance.png`.
- [x] Đưa vào background chủ tiệm `assets/onsen-refactor/boss-lobby.png`.
- [x] Đưa vào background khách `assets/onsen-refactor/customer-private-bath.png`.
- [x] Đưa vào background nhân viên `assets/onsen-refactor/waiter-staff-room.png`.
- [x] 4 trang thay thế phụ thuộc background test cũ.
- [x] 4 trang thay thế phụ thuộc khung ảnh UI cũ.
- [x] Sinh placeholder ảnh minh họa nhân viên trong suốt `assets/onsen-refactor/staff-sprite-transparent.png`.

### C. Màn hình tiêu đề

- [x] Xây dựng lại `frontend-mode-select.html`.
- [x] Hoàn thành menu chính, card save, chọn 3 gameplay.
- [x] Xác nhận có thể nhảy tới trang 3 bộ gameplay.

### D. Gameplay chủ tiệm

- [x] Tái cấu trúc `frontend-preview.html`.
- [x] Giữ màn hình khởi đầu galgame.
- [x] Hoàn thành tổng quan, xếp ca, khu vực, nhân viên, dự án, chỉ định, chợ nhân tài, tuyển dụng, quyết toán.
- [x] Thẻ nhân viên chuyển đổi thao tác theo cùng/khác khu vực.
- [x] Xếp ca hỗ trợ bấm ô rồi chọn vị trí và xác nhận.
- [x] Bỏ việc bán rao nhân viên của mình.

### E. Gameplay khách

- [x] Tái cấu trúc `frontend-customer-preview.html`.
- [x] Giữ màn hình khởi đầu galgame.
- [x] Hoàn thành hôm nay, dịch vụ, chỉ định, quan hệ, danh bạ, vốn, ghi chép.
- [x] Thêm quyết toán dịch vụ, tiền boa, yêu cầu liên hệ.
- [x] Không hiển thị số lần backend hay mức độ khai thác của nhân viên.

### F. Gameplay nhân viên

- [x] Tái cấu trúc `frontend-waiter-preview.html`.
- [x] Giữ màn hình khởi đầu galgame.
- [x] Hoàn thành ca trực, tiếp khách, chỉ định, trưởng thành, thu nhập, đánh giá, ghi chép.
- [x] Trang trưởng thành chỉ hiển thị số lần kết quả khách quan và độ thành thạo.
- [x] Trang thu nhập tách lương ngày, tiền boa, thu nhập thêm, chia phần chỉ định.

### G. Nghiệm thu

- [x] Kiểm tra cú pháp script của 4 file HTML đã pass.
- [x] Văn bản khả kiến của 4 trang không chứa từ ngữ triển khai nội bộ.
- [x] Tự kiểm tra class layout cũ: không sót vỏ cũ, bảng menu cũ, tường card cũ, panel truyện cũ.
- [x] Screenshot độ rộng desktop kiểm tra trang mặc định, lớp phủ menu, lớp phủ cốt truyện không chồng lấp.
- [x] Screenshot màn hình hẹp di động 430px kiểm tra menu đọc được, không cuộn ngang.
- [x] Cập nhật `项目进度清单.md` (Danh sách tiến độ dự án).
- [ ] Khi kết nối script sau này triển khai hoạt động dịp lễ, điều chỉnh giá dự án hot và hiển thị set.
