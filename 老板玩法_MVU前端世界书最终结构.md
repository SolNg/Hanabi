# Cấu trúc cuối cùng MVU, frontend, world book của gameplay chủ tiệm

## Phân công cốt lõi

Gameplay chủ tiệm không chỉ chạy dựa vào MVU.

Prompt hoàn chỉnh được tạo thành từ các nội dung sau:

- World book chung
- World book gameplay chủ tiệm
- World book tổng quan nhân viên đèn xanh
- World book thiết lập nhân vật của nhân vật đang được kích hoạt hiện tại
- Quy tắc biến của nhân vật đang được kích hoạt hiện tại
- Sự thật MVU hiện tại
- Input người dùng

MVU không chịu trách nhiệm lưu thường trực toàn bộ nhân viên, ứng viên thị trường, ứng viên tuyển dụng, xếp ca hoàn chỉnh, lượng khách hoàn chỉnh và sổ sách kinh doanh hoàn chỉnh.

Các nội dung này thuộc về dữ liệu frontend/script để lưu. Chỉ khi vào tương tác AIRP, hoặc một sự thật nào đó cần AI đọc/cập nhật, mới ghi vào MVU.

## Biến ban đầu của gameplay chủ tiệm

```yaml
stat_data:
  当前:
    _时间: "00:00"
    _地点: "汤泉"

  店铺:
    _资金: 0
    _店铺评分: 0
    _好评率: 0

  互动现场: {}
```

Thuyết minh:

- `当前` (hiện tại): sự thật cứng hiện tại mà AI nhìn thấy được, do frontend/script ghi, AI không cập nhật.
- `店铺` (tiệm): tổng quan kinh doanh cần thiết mà AI nhìn thấy được, do frontend/script ghi, AI không cập nhật.
- `互动现场` (hiện trường tương tác): ban đầu rỗng; chỉ mở rộng khi vào tương tác AIRP. Đây là vùng chính mà AI có thể cập nhật theo quy tắc biến.

## Nội dung không đi vào MVU thường trực

Các nội dung sau không ghi thường trực vào MVU của gameplay chủ tiệm:

- Danh sách hoàn chỉnh nhân viên hiện có
- Hồ sơ hoàn chỉnh nhân viên
- Xếp ca hoàn chỉnh của nhân viên
- Danh sách rao bán chợ nhân tài
- Danh sách ứng viên tuyển dụng
- Ứng viên chưa tuyển
- Nhân viên thị trường chưa mua vào
- Bể lượng khách hoàn chỉnh
- Bể đơn hàng dịch vụ hoàn chỉnh
- Hợp đồng chỉ định hoàn chỉnh
- Bảng gốc đánh giá dự án
- Bảng gốc giá trị đề xuất dự án
- Bảng gốc đánh giá nhân viên
- Bảng phán định nhãn đặc biệt
- Công thức giá và công thức quyết toán

Các nội dung này do dữ liệu frontend/script lưu.

Nhân viên hiện có gồm những ai, do world book tổng quan nhân viên đèn xanh ghi lại. Khi nhân vật cụ thể xuất hiện, mới kích hoạt world book thiết lập nhân vật và quy tắc biến của nhân vật đó.

## Cấu trúc gameplay frontend

Frontend gameplay chủ tiệm chịu trách nhiệm:

- Hiển thị danh sách nhân viên, thẻ nhân viên, tranh minh họa và thông tin cơ bản
- Hiển thị bảng xếp ca và gửi xếp ca
- Sinh lượng khách hôm nay dựa theo xếp ca, đánh giá, giá trị đề xuất dự án, đánh giá nhân viên, tỷ lệ chỉ định, nhãn đặc biệt v.v.
- Sinh việc có chỉ định hay không, chỉ định ai, ở trọ mấy ngày, chỉ định mấy ngày, khi nào thả nhân viên ra
- Hiển thị trang khu vực, như phòng nghỉ, bể tắm, phòng riêng, văn phòng
- Hiển thị nhân viên có thể tương tác hiện tại ở trang khu vực
- Hiển thị khách đang được nhân viên bị chỉ định phục vụ ở trang khu vực
- Khách thường chỉ hiển thị dưới dạng số lượng khách, không khí khu vực, tóm tắt nhóm
- Xử lý chợ nhân tài, tuyển dụng, tuyển dụng录用, mua vào, bán ra, từ chối, làm mới
- Xử lý quyết toán kinh doanh hôm nay, vốn, đánh giá, giá trị đề xuất dự án, đánh giá nhân viên, tỷ lệ chỉ định

Chỉ khi frontend bấm vào một nhân viên, quan hệ chỉ định, ứng viên hoặc hiện trường dịch vụ nào đó để vào tương tác AIRP, mới ghi thông tin cần thiết vào `互动现场`.

## Mở rộng hiện trường tương tác

### Tương tác riêng với nhân viên

Khi chủ tiệm trò chuyện với nhân viên, tăng lương ngày, sắp xếp công việc, trao đổi riêng:

```yaml
互动现场:
  地点: "办公室"
  员工:
    由梨:
      状态: "正在与老板谈话"
      日薪: 800
      当前安排: "休息室"
```

Có thể được AI cập nhật:

- `互动现场.地点` (địa điểm)
- `互动现场.员工.${tên nhân viên}.状态` (trạng thái)
- `互动现场.员工.${tên nhân viên}.日薪` (lương ngày)
- `互动现场.员工.${tên nhân viên}.当前安排` (sắp xếp hiện tại)

### Tương tác quan hệ chỉ định

Khi chủ tiệm vào một khu vực nào đó xem nhân viên bị chỉ định và khách:

```yaml
互动现场:
  地点: "休息室"
  指名关系:
    由梨:
      客人: "熟客甲"
      指名状态: "2天指名中，当前第1天"
      当前项目: "休息区陪同"
      当前状态: "陪同中"
      员工状态: "正在陪同客人"
      客人状态: "正在休息"
```

Thuyết minh:

- Một quan hệ chỉ định lấy nhân viên bị chỉ định làm khóa.
- Dữ liệu quyết toán hoàn chỉnh như khách chỉ định mấy ngày, ở trọ mấy ngày, tổng phí chỉ định, thời gian thả ra v.v. không ghi ở đây, lưu trong dữ liệu frontend/script.
- Ở đây chỉ ghi sự thật mà AIRP cần hiện tại.

Có thể được AI cập nhật:

- `互动现场.地点` (địa điểm)
- `互动现场.指名关系.${tên nhân viên}.当前项目` (dự án hiện tại)
- `互动现场.指名关系.${tên nhân viên}.当前状态` (trạng thái hiện tại)
- `互动现场.指名关系.${tên nhân viên}.员工状态` (trạng thái nhân viên)
- `互动现场.指名关系.${tên nhân viên}.客人状态` (trạng thái khách)

Nếu trong AIRP chủ tiệm rõ ràng đổi nhân viên phục vụ, kết thúc chỉ định sớm, thêm dự án hoặc điều chỉnh lương ngày, AI trước tiên cập nhật sự thật tương ứng trong `互动现场`. Khi thoát tương tác, frontend/script sẽ gộp lại vào dữ liệu kinh doanh của mình.

### Tương tác phỏng vấn ứng viên

Khi ứng viên tuyển dụng hoặc nhân viên thị trường chưa được tuyển, không ghi thường trực vào MVU.

Chỉ khi chủ tiệm bấm giao lưu hoặc vào phỏng vấn AIRP:

```yaml
互动现场:
  地点: "办公室"
  候选人:
    小春:
      来源: "招聘候选"
      状态: "正在面试"
      期望日薪: 760
      拒绝次数: 1
```

Sau khi phỏng vấn kết thúc:

- Tuyển dụng: vào dữ liệu nhân viên frontend, và cập nhật world book tổng quan nhân viên.
- Từ chối: về lại kho nhân tài frontend/script, số lần từ chối +1.
- Không tuyển cũng không tiếp tục tương tác: không ghi vào biến MVU thường trực của chủ tiệm.

## Đánh giá và giá trị đề xuất

Sau khi khách rời đi, frontend/script ghi lại 3 loại đánh giá:

- Đánh giá tiệm: ảnh hưởng tổng lượng khách
- Đánh giá dự án: ảnh hưởng lượng khách của dự án đó và giá trị đề xuất dự án
- Đánh giá nhân viên: ảnh hưởng đánh giá, tỷ lệ chỉ định và phí chỉ định

Giá trị đề xuất dự án do frontend/script tính, dùng cho sắp xếp frontend, độ hot dự án, sinh ý định khách.

Nhãn thu hút đặc biệt do frontend/script làm nhân tố phán định sự kiện chỉ định. Khi chưa kích hoạt không vào MVU; sau khi kích hoạt thành sự kiện chỉ định cụ thể, ghi vào dữ liệu chỉ định frontend/script, khi vào tương tác mới ghi vào `互动现场` theo sự thật hiện tại.

## Logic world book

### Đèn xanh thường trực

- Thế giới quan chung
- Cơ sở vật chất và chế độ dịch vụ của Suối nước nóng
- Chế độ chỉ định
- Quy tắc gameplay chủ tiệm
- Tổng quan nhân viên

World book tổng quan nhân viên chỉ ghi "hiện có những nhân viên nào" và thông tin nhận diện cực ngắn, không ghi thiết lập nhân vật hoàn chỉnh.

### Kích hoạt theo nhu cầu

- Khi một nhân viên nào đó được bấm vào, khớp xếp ca, bị chỉ định, vào tương tác, kích hoạt world book thiết lập nhân vật của nhân viên đó.
- Khi nhân viên đó có biến có thể cập nhật trong AIRP, kích hoạt quy tắc biến của nhân viên đó.
- Khi khách chỉ định cần trở thành đối tượng tương tác hiện tại, ghi vào `互动现场`; khách thường chỉ làm tóm tắt lượng khách, không kích hoạt thông tin nhân vật.

### Tắt

- Sau khi thoát tương tác, thiết lập nhân vật và quy tắc biến của nhân vật không còn tiếp tục ở hiện trường sẽ tắt.
- `互动现场` xóa hoặc thu gọn.
- Frontend/script cập nhật dữ liệu kinh doanh của mình theo thay đổi của `互动现场`.

## Logic cập nhật

### Frontend/script cập nhật trực tiếp

Frontend/script cập nhật trực tiếp:

- Thời gian
- Địa điểm chủ tiệm
- Vốn
- Đánh giá tiệm
- Tỷ lệ đánh giá tốt
- Xếp ca
- Lượng khách
- Hợp đồng chỉ định
- Tuyển dụng và chợ nhân tài
- Giá trị đề xuất dự án
- Thống kê đánh giá
- Kết quả quyết toán

### AI có thể cập nhật

AI chỉ cập nhật các trường không có tiền tố `_` trong `互动现场`.

Quy tắc biến chỉ ghi trường liên quan đến `互动现场`, không ghi `当前`, `店铺`, dữ liệu frontend/script và world book tổng quan nhân viên.

### Thoát tương tác

Khi thoát tương tác AIRP:

1. Frontend/script đọc `互动现场`.
2. Đồng bộ các thay đổi như điều chỉnh lương ngày, đổi nhân viên phục vụ, thay đổi dự án, thay đổi trạng thái v.v. về lại dữ liệu kinh doanh frontend/script.
3. Cập nhật world book tổng quan nhân viên hoặc gắn world book nhân vật theo nhu cầu.
4. Xóa hoặc thu gọn `互动现场`.
