
# Hợp đồng lời nhắc AI chợ nhân tài và world book

> Tài liệu bàn giao P5-3 (bản sửa lại 2026-07-16). Định nghĩa lời nhắc, mẫu đầu vào, hợp đồng đầu ra, quy tắc kiểm tra và quy phạm tích hợp Codex cho việc sinh ứng viên AI hàng ngày và sinh hồ sơ nhân vật đầy đủ cho một NPC sau khi ký hợp đồng.
> Mọi yêu cầu AI phải đi vào hàng đợi đơn `enqueueAiGeneration` hiện có. Không thêm định dạng đầu ra preset mới.

---

## Một, lời nhắc ứng viên nhân tài AI hàng ngày

### 1.1 Nội dung lời nhắc hệ thống

```text
Bạn là bộ sinh chợ nhân tài AI của trò chơi kinh doanh ôn tuyền "Hoa Chưa Nở". Nhiệm vụ duy nhất của bạn là sinh 1～3 ứng viên NPC thuần hoàn toàn nguyên gốc cho người chơi mỗi ngày.

Định dạng đầu ra:
- Chỉ trả về một đối tượng JSON. Không được xuất Markdown code fence, giải thích, lời mở đầu, lời kết hay bất kỳ văn bản không phải JSON nào.
- Cấp cao nhất phải là một đối tượng, chứa mảng "candidates". Không được xuất trực tiếp một mảng.
- Mỗi ứng viên phải chứa và chỉ chứa các trường sau, không được thiếu, không được thêm:

{
  "candidates": [
    {
      "id": "ai-market-số ngày-số thứ tự-5 ký tự ngẫu nhiên",
      "姓名": "",
      "性别": "",
      "种族": "",
      "年龄段": "",
      "来源地": "",
      "评级": "B",
      "期望日薪": 0,
      "市场签约价格": 0,
      "擅长项目": [],
      "性格关键词": [],
      "经历简介": "",
      "应聘动机": "",
      "特殊说明": ""
    }
  ]
}

- Không được xuất trường "生成日期" và "来源标记".

Quy tắc nội dung:
1. Mọi ứng viên phải là nhân vật hoàn toàn nguyên gốc. Không được tái sử dụng, ám chỉ hoặc tự xưng là bất kỳ nhân vật nào trong danh sách loại trừ.
2. Độ dài candidates chỉ có thể là 1, 2 hoặc 3.
3. Ứng viên phù hợp với bối cảnh kinh doanh ôn tuyền hiện đại. Có thể là con người hoặc chủng tộc kỳ ảo hợp lý, không được phá vỡ thế giới quan ôn tuyền đô thị đương đại.
4. id bắt đầu bằng "ai-market-", chỉ chứa chữ thường, số và dấu gạch nối, tổng độ dài 18～80. Khuyến nghị: ai-market-{8 chữ số ngày}-{2 chữ số thứ tự}-{5 chữ số ngẫu nhiên}.
5. Tên và id trong lần xuất này không được trùng lặp với nhau, không được trùng danh sách loại trừ.
6. 评级 chỉ có thể là "B", "A", "S".
7. 期望日薪: số nguyên 300～20000.
8. 市场签约价格: số nguyên 1000～2000000.
9. 擅长项目 ít nhất một mục, phải lấy đúng nguyên văn từ danh sách dự án được phép trong đầu vào.
10. 性格关键词 1～6 mục, mỗi mục không quá 24 ký tự.
11. 经历简介 ≤360 ký tự, 应聘动机 ≤240 ký tự, 特殊说明 ≤240 ký tự.
12. Khi không thể thỏa mãn điều kiện, hãy sinh lại trực tiếp một JSON hợp lệ hoàn chỉnh, không kèm giải thích.
```

### 1.2 Mẫu đầu vào người dùng

```json
{
  "task": "generateAiTalentCandidates",
  "date": "Ngày 16 tháng 07 năm 2026",
  "businessDay": 45,
  "businessPhase": "Giai đoạn tăng trưởng",
  "shopLevel": 3,
  "shopRating": 78,
  "currentFunds": 520000,
  "recruitPressure": "Trung bình",
  "allowedProjects": [
    "Ngâm tắm nghỉ ngơi",
    "Xoa bóp trị liệu",
    "Chăm sóc bồn tắm hương bưởi",
    "Nghỉ ngơi phòng riêng",
    "Trò chuyện đêm sân vườn",
    "Trị liệu tinh dầu",
    "Tắm đá nóng",
    "Chăm sóc tắm thuốc",
    "Trải nghiệm trà đạo",
    "Bao trọn ôn tuyền riêng"
  ],
  "excludedNames": ["atri", "Bạch Ninh", "Tinh Trần", "Hành Tây", "Alice", "Cầm Âm"],
  "excludedIds": ["atri", "bai-ning", "xing-chen", "yang-cong", "ai-li-si", "qin-yin"]
}
```

### 1.3 Ví dụ đầu ra hợp lệ

```json
{
  "candidates": [
    {
      "id": "ai-market-20260716-01-k8f2a",
      "姓名": "Tô Mộ Vãn",
      "性别": "Nữ",
      "种族": "Con người",
      "年龄段": "26 tuổi",
      "来源地": "Thành Tự Do Vịnh Biển",
      "评级": "A",
      "期望日薪": 1480,
      "市场签约价格": 44400,
      "擅长项目": ["Xoa bóp trị liệu", "Trị liệu tinh dầu"],
      "性格关键词": ["Điềm đạm", "Biết lắng nghe", "Có ranh giới nghề nghiệp"],
      "经历简介": "Từng làm việc bốn năm tại một tiệm trị liệu cao cấp ở Thành Tự Do Vịnh Biển, sở trường thư giãn vai cổ và kỹ thuật tinh dầu chuyên sâu. Nghỉ việc do chủ cũ đóng cửa, có chứng chỉ hành nghề trị liệu viên độc lập. Tính cách yên tĩnh nhưng quan sát khách rất tỉ mỉ, có thể nhanh chóng nhận ra sự khó chịu của khách và điều chỉnh lực tay.",
      "应聘动机": "Mong muốn tìm được một vị trí lâu dài coi trọng ranh giới nhân viên, lượng khách ổn định và không ép buộc dịch vụ ngoài phạm vi. Có ấn tượng tốt với hệ thống đánh giá khách hàng và phong cách kinh doanh của quán này.",
      "特殊说明": "Dị ứng với một số thành phần tinh dầu nhất định, không thể nhận các công thức có tinh dầu oải hương; các hạng mục chăm sóc khác đều có thể thực hiện bình thường."
    },
    {
      "id": "ai-market-20260716-02-m3q7b",
      "姓名": "Sương Diệp",
      "性别": "Nam",
      "种族": "Bán tinh linh",
      "年龄段": "31 tuổi",
      "来源地": "Ôn Tuyền Hương Bắc Lục",
      "评级": "B",
      "期望日薪": 980,
      "市场签约价格": 23520,
      "擅长项目": ["Ngâm tắm nghỉ ngơi", "Trò chuyện đêm sân vườn"],
      "性格关键词": ["Tỉ mỉ", "Phản ứng nhanh nhạy"],
      "经历简介": "Xuất thân từ một nhà trọ gia đình nhỏ ở Ôn Tuyền Hương Bắc Lục, làm công việc lễ tân và hướng dẫn bồn tắm suốt sáu năm. Tính cách không phô trương nhưng làm việc gọn gàng, có trực giác nhạy bén về nhiệt độ nước, vệ sinh và luồng di chuyển của khách.",
      "应聘动机": "Nhà trọ gia đình phải giảm bớt nhân sự do thay đổi vị trí địa lý, mong muốn tìm cơ hội việc làm mới tại một khu ôn tuyền quy mô lớn hơn.",
      "特殊说明": "Không có hạn chế đặc biệt."
    }
  ]
}
```

### 1.4 Ví dụ đầu ra không hợp lệ

```json
{
  "candidates": [
    {
      "id": "market-20260716-01",
      "姓名": "atri",
      "性别": "Nữ",
      "种族": "Robot",
      "年龄段": "Ngoại hình 17 tuổi",
      "来源地": "Một viện nghiên cứu",
      "评级": "SS",
      "期望日薪": 50000,
      "市场签约价格": 500,
      "擅长项目": ["Dịch vụ siêu năng lực", "Xoa bóp lượng tử"],
      "性格关键词": ["Đây là một đoạn mô tả từ khóa rất dài vượt quá giới hạn 24 ký tự"],
      "经历简介": "Lược",
      "应聘动机": "Lược",
      "特殊说明": "Lược"
    }
  ]
}
```

**Lý do từ chối mà bộ phân tích hiện tại đã kiểm chứng:**

| Vấn đề | Bộ phân tích báo cáo |
|------|-----------|
| `id` không bắt đầu bằng `ai-market-` hoặc sai định dạng | "Ứng viên thứ N ID không hợp lệ" |
| `姓名` trống | "Ứng viên thứ N thiếu tên" |
| `评级` "SS" không nằm trong enum | "Ứng viên thứ N đánh giá không hợp lệ" |
| `期望日薪` 50000 vượt phạm vi | "Ứng viên thứ N số tiền không hợp lệ" |
| `市场签约价格` 500 thấp hơn giá trị tối thiểu | "Ứng viên thứ N số tiền không hợp lệ" |
| `擅长项目` không thuộc danh sách được phép | "Ứng viên thứ N hạng mục sở trường không hợp lệ" |
| `姓名` "atri" trùng danh sách loại trừ | "Tên ứng viên trùng lặp: atri" |
| `id` trùng danh sách loại trừ | "ID ứng viên trùng lặp" |

**Kiểm tra nghiêm ngặt bắt buộc phải thêm khi Codex tích hợp:**

| Vấn đề | Yêu cầu |
|------|------|
| Giới tính, chủng tộc, độ tuổi, nơi xuất thân trống | Phải là chuỗi không rỗng, nếu không thì từ chối |
| Từ khóa tính cách vượt quá 6 mục hoặc một mục vượt quá 24 ký tự | Từ chối trực tiếp, không còn cắt ngầm |
| Tóm tắt kinh nghiệm >360 ký tự, động cơ ứng tuyển >240 ký tự, ghi chú đặc biệt >240 ký tự | Từ chối trực tiếp |
| Đầu ra thiếu trường được định nghĩa trong hợp đồng | Từ chối trực tiếp |
| Đầu ra chứa trường thêm không được định nghĩa | Bỏ qua hoặc từ chối (khuyến nghị từ chối) |

**Ràng buộc ngữ nghĩa của lời nhắc (giao diện không thể tự động phán đoán hoàn toàn):**
- "Chủng tộc có phá vỡ thế giới quan hay không" — trừ khi thêm enum đầu vào `allowedSpecies` mới, nếu không chỉ có thể dựa vào ràng buộc của lời nhắc

### 1.5 Lời nhắc thử lại

```text
Đầu ra lần trước của bạn không vượt qua kiểm tra. Vấn đề như sau:
{issues}

Vui lòng sinh lại toàn bộ JSON candidates hoàn chỉnh. Không giải thích lý do, xuất trực tiếp JSON hợp lệ.
Mọi điều kiện đầu vào ban đầu không đổi.
```

Khi thử lại vẫn thất bại: giao diện dùng `makeLocalBossAiTalentCandidates()` để hạ cấp về NPC thuần cục bộ.

---

## Hai, hợp đồng hồ sơ nhân vật đầy đủ cho một NPC sau khi ký hợp đồng

### 2.1 Nội dung lời nhắc hệ thống

```text
Bạn là bộ sinh hồ sơ nhân vật đầy đủ cho nhân vật AI của trò chơi kinh doanh ôn tuyền "Hoa Chưa Nở". Người chơi đã xác nhận ký hợp đồng với một ứng viên từ chợ nhân tài AI. Nhiệm vụ duy nhất của bạn là sinh hồ sơ nhân vật đầy đủ và nội dung entry world book thời gian chạy có thể ghi trực tiếp cho ứng viên này.

Định dạng đầu ra:
- Chỉ trả về một đối tượng JSON. Không được xuất Markdown code fence, giải thích hay bất kỳ văn bản không phải JSON nào.
- Phải chứa và chỉ chứa cấu trúc trường sau, không được thiếu, không được thêm trường cấp cao nhất mới:

{
  "version": 1,
  "candidateId": "",
  "姓名": "",
  "profile": {
    "基础身份": "",
    "外貌特征": "",
    "性格核心": [],
    "经历": "",
    "应聘动机": "",
    "擅长与短板": "",
    "服务风格": "",
    "说话方式": "",
    "边界与禁忌": "",
    "关系发展原则": "",
    "日常习惯": "",
    "可持续剧情钩子": []
  },
  "worldbook": {
    "entryId": "",
    "entryName": "",
    "activation": "manual",
    "enabled": false,
    "content": ""
  }
}

Quy tắc nội dung:
1. Chỉ sinh hồ sơ cho duy nhất ứng viên được chỉ định trong đầu vào. Không được sinh nhân vật thứ hai.
2. candidateId và tên phải hoàn toàn khớp với đầu vào, không được sửa đổi.
3. Đánh giá, lương ngày kỳ vọng, giá ký hợp đồng thị trường phải khớp với đầu vào, không được viết trong profile các con số mâu thuẫn với chúng.
4. Không được tái sử dụng OC hiện có. Không được dùng ID, tên hoặc đặc điểm rõ ràng nằm trong danh sách loại trừ.
5. Không được tự quyết định việc trừ tiền, tuyển dụng thành công hay kết quả ghi vào world book — những việc này do giao diện kiểm soát giao dịch.
6. profile và worldbook.content không được viết "nhân viên chính thức", "đã nhập chức", "đã trừ tiền" hay tuyên bố thành công giao dịch khác. Chỉ mô tả thân phận, nhân thiết lập, kinh nghiệm, năng lực và khuynh hướng của bản thân nhân vật.
7. Có thể bổ sung chi tiết bối cảnh nguyên gốc tương thích với tư liệu ứng viên, dùng để hình thành hồ sơ nhân vật đầy đủ.
8. Không được thay đổi hoặc phủ định tên, ID, giới tính, chủng tộc, độ tuổi, nơi xuất thân, đánh giá, lương, giá, hạng mục sở trường, từ khóa tính cách, kinh nghiệm rõ ràng, động cơ và ghi chú đặc biệt trong ứng viên.
9. Nếu kinh nghiệm của ứng viên là câu giữ chỗ hạ cấp (như "chờ hợp đồng nhân vật chính thức bổ sung"), không coi câu giữ chỗ đó là sự kiện cuộc đời; có thể sinh lại kinh nghiệm hoàn chỉnh trong trường hợp không mâu thuẫn.
10. Chi tiết mới thêm không được tái sử dụng OC hiện có, cũng không được viết thành hành vi người dùng, kết quả quan hệ hoặc kết quả sự vụ kinh doanh.
11. worldbook.content là nội dung sự thật thế giới quan/nhân vật thuần túy, không chứa các từ ngữ kỹ thuật như TODO, debug, console, "giao diện sẽ".
12. worldbook.content không được thay người dùng quyết định thái độ, hành vi, quan hệ hoặc kết quả tương tác.
13. worldbook.entryId phải là "character.profile.<candidateId>".
14. worldbook.entryName phải là "[未开之花][AI角色] <tên ứng viên>".
15. worldbook.activation phải là "manual", worldbook.enabled phải là false.
16. Thử lại cùng một candidateId phải trả về cùng một entryId, không được nhân bản nhân vật.
```

### 2.2 Mẫu đầu vào người dùng

```json
{
  "task": "generateAiTalentFullProfile",
  "candidate": {
    "id": "ai-market-20260716-01-k8f2a",
    "姓名": "Tô Mộ Vãn",
    "性别": "Nữ",
    "种族": "Con người",
    "年龄段": "26 tuổi",
    "来源地": "Thành Tự Do Vịnh Biển",
    "评级": "A",
    "期望日薪": 1480,
    "市场签约价格": 44400,
    "擅长项目": ["Xoa bóp trị liệu", "Trị liệu tinh dầu"],
    "性格关键词": ["Điềm đạm", "Biết lắng nghe", "Có ranh giới nghề nghiệp"],
    "经历简介": "Từng làm việc bốn năm tại một tiệm trị liệu cao cấp ở Thành Tự Do Vịnh Biển, sở trường thư giãn vai cổ và kỹ thuật tinh dầu chuyên sâu. Nghỉ việc do chủ cũ đóng cửa, có chứng chỉ hành nghề trị liệu viên độc lập.",
    "应聘动机": "Mong muốn tìm được một vị trí lâu dài coi trọng ranh giới nhân viên, lượng khách ổn định và không ép buộc dịch vụ ngoài phạm vi.",
    "特殊说明": "Dị ứng với một số thành phần tinh dầu nhất định, không thể nhận các công thức có tinh dầu oải hương."
  },
  "shopContext": {
    "shopName": "Hoa Chưa Nở",
    "businessDay": 45,
    "businessPhase": "Giai đoạn tăng trưởng",
    "shopLevel": 3,
    "currentProjects": ["Ngâm tắm nghỉ ngơi", "Xoa bóp trị liệu", "Trị liệu tinh dầu", "Nghỉ ngơi phòng riêng", "Trò chuyện đêm sân vườn"]
  },
  "userProfile": {
    "name": "Tam Minh Nguyệt",
    "gender": "Nam"
  },
  "excludedNames": ["atri", "Bạch Ninh", "Tinh Trần", "Hành Tây", "Alice", "Cầm Âm"],
  "excludedIds": ["atri", "bai-ning", "xing-chen", "yang-cong"],
  "worldRules": "Bối cảnh kinh doanh ôn tuyền đô thị hiện đại. Chủng tộc kỳ ảo hợp lý tồn tại nhưng không phá vỡ tông màu đời sống thường nhật. Nhân viên có ranh giới nghề nghiệp và ý chí cá nhân rõ ràng."
}
```

### 2.3 Ví dụ đầu ra hợp lệ đầy đủ

```json
{
  "version": 1,
  "candidateId": "ai-market-20260716-01-k8f2a",
  "姓名": "Tô Mộ Vãn",
  "profile": {
    "基础身份": "Nữ, 26 tuổi, con người, quê quán Thành Tự Do Vịnh Biển, có chứng chỉ hành nghề trị liệu viên độc lập. Hiện đang làm thủ tục nhập chức.",
    "外貌特征": "Chiều cao trung bình, tóc thẳng ngang vai buộc thấp bằng dây tóc màu tối. Đường nét khuôn mặt mềm mại nhưng không nổi bật, ngón tay thon dài và móng tay luôn được cắt tỉa ngắn gọn. Khi làm việc mặc đồng phục tiêu chuẩn, đồ thường ngày thiên về màu tối đơn giản.",
    "性格核心": ["Điềm đạm kín đáo", "Giỏi quan sát trong im lặng", "Ranh giới nghề nghiệp rõ ràng", "Chậm nóng nhưng đã tin tưởng thì rất đáng tin cậy"],
    "经历": "Làm việc bốn năm tại một tiệm trị liệu cao cấp ở Thành Tự Do Vịnh Biển, từ học việc lên trị liệu viên chủ lực. Chủ cũ đóng cửa do vấn đề kinh doanh, cô không theo đồng nghiệp chuyển sang chuỗi cơ sở khác mà chọn tìm một cửa hàng độc lập chú trọng chất lượng dịch vụ hơn.",
    "应聘动机": "Coi trọng phẩm giá nghề nghiệp và ranh giới công việc. Mong muốn làm việc lâu dài trong môi trường không bị ép buộc cung cấp dịch vụ ngoài phạm vi. Có ấn tượng tốt với chế độ đánh giá khách hàng và chính sách bảo vệ nhân viên của quán này.",
    "擅长与短板": "Sở trường thư giãn vai cổ và kỹ thuật tinh dầu chuyên sâu, kiểm soát lực tay chính xác. Điểm yếu là dị ứng với một số thành phần tinh dầu nhất định, không thể nhận công thức có tinh dầu oải hương; cần thời gian thích nghi dài hơn với các hạng mục hoàn toàn mới lạ.",
    "服务风格": "Kiểu yên tĩnh tập trung. Trước khi bắt đầu dịch vụ sẽ xác nhận ngắn gọn vị trí khó chịu và mức lực ưa thích của khách, trong quá trình phục vụ ít chủ động trò chuyện phiếm, nhưng sẽ điều chỉnh ngay khi nhận thấy khách khó chịu. Khi kết thúc đưa ra gợi ý tiếp theo ngắn gọn.",
    "说话方式": "Tốc độ nói hơi chậm, dùng từ ngắn gọn. Rất ít dùng câu cảm thán hay cách diễn đạt phóng đại. Giữ giọng điệu lịch sự nhưng có khoảng cách với người lạ, khi đã quen sẽ thỉnh thoảng lộ ra khiếu hài hước khô khan.",
    "边界与禁忌": "Từ chối rõ ràng các yêu cầu tiếp xúc cơ thể vượt phạm vi dịch vụ. Không nhận lời mời riêng tư ngoài giờ làm việc, trừ khi đã xây dựng đủ lòng tin qua thời gian dài tiếp xúc. Khi bị cưỡng ép vượt ranh giới sẽ bình tĩnh nhưng kiên quyết dừng tương tác.",
    "关系发展原则": "Lòng tin cần được tích lũy qua tương tác thường nhật lặp lại và không vượt ranh giới. Cảm tình tăng chậm nhưng ổn định. Không vì một sự việc đơn lẻ mà nhanh chóng thay đổi thái độ. Với người chân thành và tôn trọng ranh giới sẽ dần bộc lộ nhiều mặt cá nhân hơn.",
    "日常习惯": "Sau giờ làm thích đi dạo một mình hoặc xem video nấu ăn trên điện thoại ở phòng nghỉ. Mỗi tuần cố định chăm sóc tay để giữ trạng thái làm việc. Thỉnh thoảng vào ngày nghỉ đến hiệu sách độc lập gần đó.",
    "可持续剧情钩子": ["Giữ im lặng về lý do thật sự khiến chủ cũ đóng cửa, thỉnh thoảng lộ ra cảm xúc chưa nguôi", "Đằng sau chứng dị ứng tinh dầu có thể có một câu chuyện cá nhân", "Sự chống đối với các cơ sở chuỗi ngụ ý cô đã từng chứng kiến điều không muốn lặp lại", "Tính cách chậm nóng nghĩa là chỉ tương tác lâu dài mới có thể khơi mở những cuộc trò chuyện sâu sắc hơn"]
  },
  "worldbook": {
    "entryId": "character.profile.ai-market-20260716-01-k8f2a",
    "entryName": "[未开之花][AI角色] Tô Mộ Vãn",
    "activation": "manual",
    "enabled": false,
    "content": "【Tô Mộ Vãn】\nNữ, 26 tuổi, con người, quê quán Thành Tự Do Vịnh Biển, có chứng chỉ hành nghề trị liệu viên độc lập, hiện đang làm thủ tục nhập chức.\n\nNgoại hình: Chiều cao trung bình, tóc thẳng ngang vai buộc thấp, đường nét khuôn mặt mềm mại, ngón tay thon dài và móng tay luôn ngắn gọn. Khi làm việc mặc đồng phục tiêu chuẩn, đồ thường ngày thiên về màu tối đơn giản.\n\nTính cách: Điềm đạm kín đáo, giỏi quan sát trạng thái khách trong im lặng. Ranh giới nghề nghiệp rõ ràng, không dễ bị phá vỡ. Chậm nóng nhưng đã tin tưởng thì đáng tin cậy. Dùng từ ngắn gọn, nói hơi chậm, ít khi cảm thán hay phóng đại. Khi đã quen thỉnh thoảng có khiếu hài hước khô khan.\n\nNăng lực: Sở trường thư giãn vai cổ và kỹ thuật tinh dầu chuyên sâu, kiểm soát lực tay chính xác. Dị ứng với một số thành phần tinh dầu nhất định (gồm tinh dầu oải hương), không thể nhận công thức liên quan. Cần thời gian thích nghi dài hơn với hạng mục hoàn toàn mới lạ.\n\nPhong cách phục vụ: Kiểu yên tĩnh tập trung. Trước khi bắt đầu xác nhận ngắn gọn vị trí khó chịu và mức lực ưa thích, trong quá trình ít trò chuyện phiếm, nhận thấy khó chịu thì điều chỉnh ngay, khi kết thúc đưa gợi ý tiếp theo ngắn gọn.\n\nKinh nghiệm: Làm việc bốn năm tại một tiệm trị liệu cao cấp ở Thành Tự Do Vịnh Biển, từ học việc lên trị liệu viên chủ lực. Sau khi chủ cũ đóng cửa vì vấn đề kinh doanh, chủ động tìm một cửa hàng độc lập chú trọng chất lượng dịch vụ.\n\nRanh giới: Từ chối rõ ràng tiếp xúc cơ thể vượt phạm vi dịch vụ. Không nhận lời mời riêng tư ngoài giờ làm việc, trừ khi đã xây dựng đủ lòng tin qua thời gian dài tiếp xúc. Khi bị cưỡng ép vượt ranh giới sẽ bình tĩnh kiên quyết dừng tương tác.\n\nPhát triển quan hệ: Lòng tin được tích lũy qua tương tác thường nhật lặp lại và không vượt ranh giới, cảm tình tăng chậm nhưng ổn định. Không vì một sự việc đơn lẻ mà nhanh chóng thay đổi thái độ. Với người chân thành tôn trọng ranh giới sẽ dần bộc lộ nhiều mặt cá nhân hơn.\n\nĐời thường: Sau giờ làm đi dạo một mình hoặc xem video nấu ăn. Mỗi tuần chăm sóc tay để giữ trạng thái làm việc. Thỉnh thoảng đến hiệu sách độc lập.\n\nViệc chưa giải quyết: Giữ im lặng về lý do chủ cũ đóng cửa; đằng sau chứng dị ứng tinh dầu có thể có câu chuyện cá nhân; có sự chống đối rõ ràng với các cơ sở chuỗi."
  }
}
```

### 2.4 Lời nhắc thử lại khi kiểm tra thất bại

```text
Đầu ra lần trước của bạn không vượt qua kiểm tra. Vấn đề như sau:
{issues}

Vui lòng sinh lại toàn bộ JSON hồ sơ nhân vật hoàn chỉnh. candidateId phải là "{candidateId}", tên phải là "{candidateName}".
Không giải thích lý do, xuất trực tiếp JSON hợp lệ. Mọi điều kiện đầu vào ban đầu không đổi.
```

### 2.5 Danh sách trường mà giao diện cần kiểm tra

| Đường dẫn trường | Quy tắc kiểm tra |
|---------|---------|
| `version` | Phải là `1` |
| `candidateId` | Phải khớp từng ký tự với `candidate.id` trong đầu vào |
| `姓名` | Phải khớp từng ký tự với `candidate.姓名` trong đầu vào |
| `profile` | Phải là đối tượng không rỗng |
| `profile.基础身份` | Chuỗi không rỗng, ≤800 ký tự |
| `profile.外貌特征` | Chuỗi không rỗng, ≤800 ký tự |
| `profile.性格核心` | Mảng không rỗng, mỗi mục là chuỗi không rỗng, 2～8 mục |
| `profile.经历` | Chuỗi không rỗng, ≤1200 ký tự |
| `profile.应聘动机` | Chuỗi không rỗng, ≤600 ký tự |
| `profile.擅长与短板` | Chuỗi không rỗng, ≤800 ký tự |
| `profile.服务风格` | Chuỗi không rỗng, ≤600 ký tự |
| `profile.说话方式` | Chuỗi không rỗng, ≤600 ký tự |
| `profile.边界与禁忌` | Chuỗi không rỗng, ≤600 ký tự |
| `profile.关系发展原则` | Chuỗi không rỗng, ≤600 ký tự |
| `profile.日常习惯` | Chuỗi không rỗng, ≤600 ký tự |
| `profile.可持续剧情钩子` | Mảng không rỗng, ít nhất 2 mục, mỗi mục là chuỗi không rỗng |
| `worldbook` | Phải là đối tượng không rỗng |
| `worldbook.entryId` | Phải chính xác bằng `character.profile.<candidateId>` |
| `worldbook.entryName` | Phải chính xác bằng `[未开之花][AI角色] <tên ứng viên>` |
| `worldbook.activation` | Phải chính xác là `"manual"` |
| `worldbook.enabled` | Phải chính xác là `false` |
| `worldbook.content` | Chuỗi không rỗng, 200～4000 ký tự Unicode |
| Từ cấm trong `worldbook.content` | Không được chứa `TODO`, `debug`, `console`, `giao diện sẽ`, `nhân viên chính thức`, `đã nhập chức`, `đã trừ tiền` |
| Loại trừ OC trong `worldbook.content` | Không được chứa tên OC nằm trong danh sách loại trừ |
| Cấm tuyên bố giao dịch trong `worldbook.content` | Không được chứa mô tả kết quả kỹ thuật hoặc giao dịch như "tuyển dụng thành công", "đã ghi vào world book", "hoàn tất giao dịch" |

### 2.6 Quy phạm entry world book

- **entryId**: `character.profile.<candidateId>`, xác định duy nhất
- **entryName**: `[未开之花][AI角色] <tên>`
- **Trạng thái bật mặc định**: `enabled: false`, chỉ được giao diện bật khi nhân vật thực sự tham gia hiện trường AIRP
- **activation**: `manual`, không tự động kích hoạt theo từ khóa
- **Định dạng nội dung**: Bắt đầu bằng tiêu đề tên nhân vật, bao gồm ngoại hình, tính cách, năng lực, phong cách phục vụ, kinh nghiệm, ranh giới, nguyên tắc phát triển quan hệ và việc chưa giải quyết. Văn bản thuần phân đoạn bằng `\n`.
- **Điều kiện tồn tại của entry**: Chỉ thực sự được tạo và lưu trữ lâu dài sau khi giao dịch hoàn tất thành công; khi giao dịch thất bại, đầu ra chỉ tồn tại trong bộ nhớ tạm thời, không để lại mảnh vụn.

---

## Ba, quy phạm tích hợp giao dịch world book

### 3.1 Giới hạn của `enableEntries()` hiện có

`enableEntries()` hiện tại của `worldbookRuntime.ts` chỉ có thể xử lý các entry đã tồn tại trong danh sách tĩnh `ENTRY_DEFINITIONS`. `character.profile.ai-market-*` không nằm trong danh sách đó, ID chưa biết sẽ chỉ đi vào `missingIds` mà không tạo entry mới.

**`enableEntries()` không thể dùng làm giao diện tạo entry world book cho nhân vật AI.**

### 3.2 Năng lực dịch vụ vận hành world book mà Codex phải mở rộng

Codex cần mở rộng dịch vụ vận hành world book (hoặc tạo mới module giao dịch), cung cấp các năng lực sau (tên hàm cụ thể do Codex quyết định):

1. **Tra cứu entry đã có theo entryId ổn định**: kiểm tra `character.profile.<candidateId>` đã tồn tại hay chưa, ngăn tạo trùng lặp
2. **Tạo entry nhân vật vừa sinh**: dùng `entryId`, `entryName`, `content`, `activation: manual`, `enabled: false` làm tham số, tạo entry mới trong world book nhân vật, kèm nhãn nguồn có thể nhận dạng:
   - `extra.source`: `"tangquan-ai-talent"`
   - `extra.candidateId`: ID ứng viên

3. **Xóa entry nhân vật vừa sinh**: xóa theo `entryId`, dùng để rollback giao dịch
4. **Lưu snapshot trước khi ghi**: ghi lại trạng thái world book cũ trước khi tạo, có thể khôi phục khi thất bại
5. **Khôi phục khi thất bại**: xóa entry vừa tạo, không để lại mảnh vụn
6. **Bật khi nhân vật vào AIRP**: gọi giao diện tương tự `enableEntries` (sau khi entry đã tồn tại) để bật entry tương ứng
7. **Tắt khi rời đi**: vô hiệu hóa entry, nhưng giữ lại nội dung (không xóa trắng content)

### 3.3 Tính an toàn khi thử lại

- Thử lại cùng `candidateId` phải kiểm tra entry đã tồn tại hay chưa trước, nếu đã tồn tại thì không tạo lại
- Sau khi thất bại không được để lại bất kỳ entry mảnh vụn nào với trạng thái `enabled: false`

### 3.4 Nhãn nguồn entry của dịch vụ vận hành world book

Entry nhân vật vừa sinh cần mang các trường extra sau, để phân biệt với entry thời gian chạy hiện có:

```json
{
  "extra": {
    "source": "tangquan-ai-talent",
    "candidateId": "ai-market-20260716-01-k8f2a",
    "tangquanEntryId": "character.profile.ai-market-20260716-01-k8f2a"
  }
}
```

---

## Bốn, phương án định dạng đầu ra preset (đã xác định)

- Trong lúc sinh ứng viên chợ nhân tài AI và sinh hồ sơ đầy đủ, tạm thời chuyển định dạng đầu ra chuyên dụng sang `none`
- Enum `TangquanPresetOutputFormat` không thêm loại `aiMarket` mới
- Không thêm entry đầu ra chợ AI Maya mới
- JSON nghiêm ngặt hoàn toàn do lời nhắc hệ thống trong tệp này ràng buộc
- Sau khi yêu cầu kết thúc, khôi phục định dạng trước đó trong `finally` (`restoreFormat = resolvePresetOutputFormat(airpState.value)`)
- Mọi chuyển đổi định dạng và yêu cầu AI đều nằm trong hàng đợi đơn `enqueueAiGeneration` hiện có

Mẫu tích hợp tham khảo cho Codex (nhất quán với nhật báo kinh doanh):

```typescript
const restoreFormat = resolvePresetOutputFormat(airpState.value);
await props.services.presetOutputFormat.setFormat('none', 'Sinh ứng viên AI');
try {
  const result = await generate({ user_input: '', should_stream: false });
  // Phân tích và xử lý
} finally {
  await props.services.presetOutputFormat.setFormat(restoreFormat, 'Khôi phục định dạng');
}
```

---

## Năm, tổng hợp vị trí tích hợp Codex

| Chức năng | Vị trí tệp/hàm/dòng chính xác | Ghi chú |
|------|-----------------|------|
| Sinh AI chính thức cho ứng viên hàng ngày | `App.vue::ensureBossAiTalentMarketReady()` dòng 6607 | Hiện chỉ đánh dấu fallback, cần tích hợp generate chính thức + `applyBossAiTalentMarketResponse()` |
| Phân tích ứng viên hàng ngày | `aiTalentMarket.ts::parseBossAiTalentCandidates()` dòng 154 | Đã triển khai, dùng trực tiếp; thêm kiểm tra không rỗng cho trường mới |
| Hạ cấp ứng viên hàng ngày | `aiTalentMarket.ts::markBossAiTalentMarketFallback()` dòng 244 | Đã triển khai, gọi khi AI thất bại |
| Điểm vào giao dịch ký hợp đồng | `App.vue::signBossAiMarket(candidateId)` dòng 6671 | Hiện chỉ log + toast, cần tích hợp sinh hồ sơ đầy đủ + giao dịch |
| Phân tích hồ sơ đầy đủ | `aiTalentMarket.ts` (chờ thêm) | Thêm mới `parseBossAiTalentFullProfile()` |
| Tạo entry world book | `worldbookRuntime.ts` (chờ mở rộng) | Cần thêm năng lực giao dịch tạo entry nhân vật vừa sinh, xem §3.2 |
| Bật/tắt entry world book | `props.services.worldbookRuntime.enableEntries()` / `disableEntries()` | Chỉ dùng sau khi entry đã tồn tại, không thể tạo mới |
| Hàng đợi đơn AI | `App.vue::enqueueAiGeneration()` dòng 2496 | Mọi yêu cầu AI phải đi qua hàng đợi này |
| Chuyển đổi định dạng preset | `props.services.presetOutputFormat.setFormat('none', ...)` | Chuyển sang none trước khi yêu cầu, khôi phục trong finally |

---

## Sáu, trình tự giao dịch ký hợp đồng bảy bước

1. Yêu cầu AI đi vào hàng đợi `enqueueAiGeneration` (preset chuyển sang none, finally khôi phục)
2. Tạm lưu toàn bộ đầu ra AI vào biến tạm thời
3. Kiểm tra: kiểm tra đầy đủ theo danh sách trường §2.5
4. Kiểm tra trước: vốn ≥ giá ký hợp đồng; không có nhân vật hoặc entry world book cùng tên/cùng ID đã tồn tại
5. Ghi giao dịch một lần:
   a. Tạo entry world book (`enabled: false`)
   b. Chuyển ứng viên thành trạng thái nhân viên chờ nhận việc và ghi vào save
6. Chỉ trừ tiền sau khi tất cả đều thành công
7. Bất kỳ bước nào thất bại thì rollback: không trừ tiền, xóa entry world book vừa tạo (không để lại mảnh vụn), không thay đổi trạng thái nhân viên

---

## Bảy, hợp đồng trường TypeScript

```typescript
/** Đã được định nghĩa trong aiTalentMarket.ts, đây chỉ là ghi chú hợp đồng */
type BossAiTalentGrade = 'B' | 'A' | 'S';

type BossAiTalentCandidate = {
  /** /^ai-market-[a-z0-9-]{8,70}$/ */
  id: string;
  姓名: string;
  性别: string;
  种族: string;
  年龄段: string;
  来源地: string;
  评级: BossAiTalentGrade;
  /** Số nguyên 300～20000 */
  期望日薪: number;
  /** Số nguyên 1000～2000000 */
  市场签约价格: number;
  /** Ít nhất một mục, đúng nguyên văn từ danh sách được phép */
  擅长项目: string[];
  /** 1～6 mục, mỗi mục ≤24 ký tự */
  性格关键词: string[];
  /** ≤360 ký tự */
  经历简介: string;
  /** ≤240 ký tự */
  应聘动机: string;
  /** ≤240 ký tự */
  特殊说明: string;
  /** Do giao diện bổ sung ghi thêm */
  生成日期: string;
  /** Do giao diện bổ sung ghi thêm */
  来源标记: 'ai-market';
};

type BossAiTalentProfile = {
  基础身份: string;
  外貌特征: string;
  性格核心: string[];
  经历: string;
  应聘动机: string;擅长与短板: string;
  服务风格: string;
  说话方式: string;
  边界与禁忌: string;
  关系发展原则: string;
  日常习惯: string;
  /** Ít nhất 2 mục */
  可持续剧情钩子: string[];
};

type BossAiTalentWorldbookEntry = {
  /** Chính xác bằng "character.profile.<candidateId>" */
  entryId: string;
  /** Chính xác bằng "[未开之花][AI角色]<tên ứng viên>" */
  entryName: string;
  activation: 'manual';
  enabled: false;
  /** 200～4000 ký tự Unicode, văn bản thuần */
  content: string;
};

type BossAiTalentFullProfile = {
  version: 1;
  /** Phải khớp từng ký tự với candidate.id đầu vào */
  candidateId: string;
  /** Phải khớp từng ký tự với candidate.姓名 đầu vào */
  姓名: string;
  profile: BossAiTalentProfile;
  worldbook: BossAiTalentWorldbookEntry;
};
```

---

*Tệp này được Claude sinh trong giai đoạn hợp đồng lời nhắc P5-3 (bản sửa lại 2026-07-16). Khi Codex tích hợp, vui lòng lấy bảng vị trí hàm ở mục Năm làm chuẩn, không được bỏ qua hàng đợi đơn `enqueueAiGeneration`, không được dùng trực tiếp `enableEntries()` để tạo entry nhân vật vừa sinh.*
