# World book nhân vật DLC Suối nước nóng — Prompt bàn giao cho Codex

## I. Công việc đã hoàn thành

38 file world book nhân vật DLC từ `src/汤泉/世界书/角色/员工/39_ame.md` đến `76_黄豆粉.md` đều đã được viết đầy đủ chính văn. Mỗi file gồm 4 phần cốt lõi:
1. Hồ sơ nhân vật (thông tin cơ bản + đặc điểm ngoại hình + thiết lập bối cảnh)
2. Bảng màu (màu nền + tông màu chính + điểm nhấn + mỗi mục 3 dòng phái sinh)
3. Hiểu biết và suy nghĩ về nhân vật
4. Ý tượng

### Ghi chú đặc biệt
- **63_晴空 (Tình Không)**: cốt lõi thiết lập nhân vật đã thay bằng bản chuyển thể "Lạc Vân Tịch" (bên ngoài nóng bên trong lạnh/ôn hòa nhiệt tình/lười biếng yên tĩnh/thử thách tương phản), ngoại hình giữ sự thật gốc trong `汤泉全角色.txt`, phần NSFW chưa đưa vào. Tên file và tên tag vẫn là "晴空" (Tình Không), entry `qing-kong` trong `index.yaml` không cần sửa.
- **72_诗音 (Thi Âm)**: ngoại hình đã bổ sung đầy đủ (tóc đen siêu dài + highlight đỏ đậm bên trong + đồng tử hình tim + nhiều phụ kiện tóc hình X/thỏ/bông len + khuyên tai hình sao trắng + móng tay xanh nhạt + nơ đỏ).
- **durvis(42)**: trong `汤泉全角色.txt` không có ghi chép ngoại hình, phần ngoại hình xử lý chủng tộc là "không rõ", không bịa đặc điểm.

### Tham khảo số chữ
- Trung vị chính văn hợp lệ của nhân vật cũ (01-38): khoảng 1934 chữ
- Phạm vi mục tiêu nhân vật mới: 1451-2418 chữ (0.75-1.25 lần)
- Toàn bộ 38 nhân vật mới đều nằm trong phạm vi

---

## II. Task cần thực hiện sau khi Codex tiếp quản

### 1. Quét hàng loạt tính nhất quán định dạng
Một số file đã được sửa trong vòng này (40_CC, 54_半疯, 67_珑, 72_诗音, 76_黄豆粉), các file còn lại nên dùng regex quét xác nhận phần đầu hồ sơ nhân vật có đúng định dạng thụt lề chuẩn không:
```
角色档案:
  基本信息:
    姓名: xxx
    种族: xxx
    ...
  外貌特征:
    ...
  背景设定:
    ...
```
Nếu phát hiện trường hợp nhiều trường cùng dòng như `角色档案:基本信息:姓名:`, cần tách thành định dạng trên.

### 2. Đồng bộ `index.yaml`
- Xác nhận trường `启用` (bật) của các entry 39-76 đã đổi từ `false` thành `true` (hoặc đặt theo trạng thái phát hành mà dự án yêu cầu)
- Xác nhận đường dẫn trường `文件` (file) của mỗi entry khớp với tên file md thực tế

### 3. Sinh lại `index.yaml.json`
Chạy script build của dự án để sinh lại phiên bản json của index.

### 4. Đối chiếu index tên
Trọng tâm xác nhận quan hệ tương ứng giữa tên tag file và `稳定ID` (ID cố định) trong `index.yaml` của các nhân vật sau:
| STT | Tên tag file | ID cố định |
|---:|---|---|
| 63 | 晴空 (Tình Không) | qing-kong |
| 72 | 诗音 (Thi Âm) | shi-yin |
| 42 | durvis | durvis |

Tên tag các nhân vật còn lại = tên nhân vật = cột tên nhân vật trong `DLC角色名单.md`, không nên có xung đột.

### 5. Nghiệm thu tương thích frontend
- Xác nhận script frontend có thể phân tích đúng entry world book định dạng mới
- Xác nhận ánh xạ tư liệu ảnh minh họa/ảnh đại diện bình thường (tham khảo số lượng tư liệu trong `DLC角色名单.md`)
- Thi Âm hiện chỉ có 3 tấm ảnh minh họa không có ảnh đại diện riêng, Bột Đậu Vàng chỉ có 4 tấm ảnh đại diện không có ảnh minh họa, cần xác minh logic fallback của frontend

### 6. Build và phát hành
- `pnpm build` hoặc lệnh build tương ứng
- Phát hành CDN (nếu áp dụng)
- Smoke test chức năng

---

## III. Nội dung cấm sửa

- File nhân vật cũ số 01-38
- Logic script frontend (trừ khi phát hiện vấn đề tương thích)
- Bản thân file tư liệu
- Tab Chrome đã có sẵn của người dùng

---

## IV. Tra cứu nhanh quy phạm viết (để tham khảo khi bổ sung nhân vật sau này)

1. Tag: `<角色名>...</角色名>` (tên nhân vật) đóng theo cặp, tên tag = phần sau dấu gạch dưới trong tên file
2. Ngoại hình: chỉ lấy sự thật từ `汤泉全角色.txt`, không bịa đặt
3. Cấu trúc bảng màu: màu nền + tông màu chính + điểm nhấn, mỗi màu 3 dòng phái sinh
4. Điều cấm: không dấu gạch ngang, không câu phủ định trước kiểu "không phải…mà là…", không prompt ngược, không ẩn dụ AI hóa (như "giao hưởng" v.v.), không số liệu quá chính xác
5. Số chữ: khoảng bình thường 1451-2418 chữ
