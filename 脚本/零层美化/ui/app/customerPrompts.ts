/**
 * Inject prompt sinh nội dung của chế độ khách.
 *
 * Cung cấp ràng buộc định dạng output cho 3 loại cảnh dialogue / story / message,
 * inject một lần qua generate({ injects }), không làm ô nhiễm injectPrompts toàn cục.
 */

export type CustomerGenerationKind = 'dialogue' | 'story' | 'message';

type InjectItem = Omit<InjectionPrompt, 'id'>;

function makeDialoguePrompt(speaker: string): string {
  return [
    `[Yêu cầu định dạng output]`,
    `Loại tương tác hiện tại: đối thoại ngắn Galgame.`,
    ``,
    `Trong <content> chỉ viết lời thoại thật sự được nhân vật hiện tại nói ra, mỗi dòng theo định dạng:`,
    `角色名: 台词 (Tên nhân vật: Lời thoại)`,
    ``,
    `Một dòng tương ứng một trang lời thoại, có thể có nhiều dòng nhưng giữ ngắn gọn.`,
    `Người nói hiện tại: ${speaker}.`,
    ``,
    `Cấm:`,
    `- Lời dẫn, miêu tả môi trường, độc thoại nội tâm nhân vật`,
    `- Phán định thông tin, logic hành vi, quá trình tư duy`,
    `- Diễn tập lời thoại hoặc nhiều khả năng`,
    `- Nói hoặc hành động thay <user>`,
    `- Ký hiệu đơn lẻ ở đầu chính văn như -`,
    `- Viết cập nhật biến vào trong <content>`,
    ``,
    `Cập nhật biến đặt sau </content> theo định dạng có sẵn.`,
  ].join('\n');
}

function makeStoryPrompt(speaker: string | null): string {
  const speakerLine = speaker ? `Nhân vật chính hiện tại: ${speaker}.\n` : '';
  return [
    `[Yêu cầu định dạng output]`,
    `Loại tương tác hiện tại: chính văn AIRP hoàn chỉnh.`,
    ``,
    `Chính văn đặt trong <content>...</content>.`,
    `Dùng địa điểm, nhân viên, dự án và sự thật quan hệ hiện tại đã kích hoạt để tiếp tục cảnh.`,
    speakerLine,
    `Hành động người dùng đã input có thể được tiếp nhận và miêu tả kết quả.`,
    ``,
    `Cấm:`,
    `- Chuỗi tư duy, phân tích, phán định thông tin, logic hành vi, lời trong lòng`,
    `- Quyết định thay <user> hành động, tâm lý và lời thoại chưa input`,
    `- Tự ý thêm nhân vật chính chưa kích hoạt`,
    `- Liệt kê lặp lại biến hoặc trạng thái hiện tại`,
    `- Viết cập nhật biến vào trong <content>`,
    ``,
    `Nếu cốt truyện thực sự đẩy thời gian, có thể output sau </content>:`,
    `<time>YYYY年MM月DD日 星期X HH:mm</time>`,
    `Khi không có đẩy thời gian rõ ràng thì không output thay đổi thời gian giả.`,
    ``,
    `Cập nhật biến đặt ở cuối theo định dạng có sẵn.`,
  ].join('\n');
}

function makeMessagePrompt(speaker: string): string {
  return [
    `[Yêu cầu định dạng output]`,
    `Loại tương tác hiện tại: tin nhắn online danh bạ.`,
    ``,
    `Trong <content> chỉ viết một tin nhắn nhân viên hiện tại gửi lại, định dạng:`,
    `${speaker}: nội dung trả lời`,
    ``,
    `Đây là tin nhắn online, không phải cảnh mặt đối mặt.`,
    ``,
    `Cấm:`,
    `- Lời dẫn môi trường hoặc miêu tả động tác`,
    `- Trả lời thay người dùng`,
    `- Miêu tả 2 bên đã gặp mặt`,
    `- Viết vị trí hiện tại của nhân viên thành nơi ở người dùng`,
    `- Viết thành chính văn dài`,
    `- Viết cập nhật biến vào trong <content>`,
    ``,
    `Độ dài trả lời phù hợp thói quen tin nhắn phần mềm chat.`,
    `Lời mời có thể chấp nhận, do dự, từ chối hoặc bàn thời gian, quyết định theo thiết lập nhân vật và quan hệ.`,
    `Mời thành công chỉ đại diện cho việc hẹn đã thành lập, không đại diện việc gặp mặt đã xảy ra.`,
    ``,
    `Cập nhật biến đặt sau </content> theo định dạng có sẵn.`,
  ].join('\n');
}

/**
 * Dựa theo loại cổng sinh nội dung hiện tại và người nói, xây prompt inject một lần cho chế độ khách.
 * Khi speaker là null hoặc chuỗi rỗng, prompt story sẽ không output dòng "nhân vật chính hiện tại".
 */
export function makeCustomerGenerationInjects(kind: CustomerGenerationKind, speaker: string | null): InjectItem[] {
  let content: string;
  switch (kind) {
    case 'dialogue':
      content = makeDialoguePrompt(speaker || '');
      break;
    case 'story':
      content = makeStoryPrompt(speaker || null);
      break;
    case 'message':
      content = makeMessagePrompt(speaker || '');
      break;
    default:
      content = makeDialoguePrompt(speaker || '');
  }

  return [
    {
      position: 'in_chat',
      depth: 1,
      role: 'system',
      content,
      should_scan: false,
    },
  ];
}
