/**
 * Inject prompt sinh nội dung của chế độ nhân viên.
 *
 * Cung cấp ràng buộc định dạng output cho 2 loại cảnh dialogue / story,
 * inject một lần qua generate({ injects }), không làm ô nhiễm injectPrompts toàn cục.
 * Không nạp sự thật gameplay; sự thật do world book và block biến MVU cung cấp.
 */

export type WaiterGenerationKind = 'dialogue' | 'story';

type InjectItem = Omit<InjectionPrompt, 'id'>;

function makeWaiterDialoguePrompt(speaker: string): string {
  return [
    `[Yêu cầu định dạng output]`,
    `Loại tương tác hiện tại: đối thoại.`,
    ``,
    `Trong <content> chỉ viết lời thoại thật sự được người nói hiện tại nói ra, mỗi dòng theo định dạng:`,
    `角色名: 台词 (Tên nhân vật: Lời thoại)`,
    ``,
    `Một dòng tương ứng một trang lời thoại, có thể có nhiều dòng nhưng giữ ngắn gọn.`,
    ...(speaker ? [`Người nói hiện tại: ${speaker}.`] : []),
    ``,
    `Cấm:`,
    `- Lời dẫn, miêu tả môi trường, miêu tả động tác`,
    `- Độc thoại nội tâm hoặc phân tích tâm lý nhân vật`,
    `- Nói hoặc hành động thay <user>`,
    `- Ký hiệu đơn lẻ ở đầu chính văn như -`,
    `- Viết cập nhật biến vào trong <content>`,
    ``,
    `Cập nhật biến đặt sau </content> theo định dạng có sẵn.`,
  ].join('\n');
}

function makeWaiterStoryPrompt(speaker: string | null): string {
  const speakerLine = speaker ? `Đối tượng tương tác hiện tại: ${speaker}.\n` : '';
  return [
    `[Yêu cầu định dạng output]`,
    `Loại tương tác hiện tại: chính văn tiếp khách.`,
    ``,
    `Chính văn hoàn chỉnh đặt trong <content>...</content>.`,
    `Dùng địa điểm, dự án, khách và sự thật tiếp khách hiện tại đã kích hoạt để tiếp tục cảnh.`,
    speakerLine,
    `Chỉ được tiếp nhận hành động mà <user> đã input rõ ràng, không được quyết định thay <user>.`,
    ``,
    `Cấm:`,
    `- Chấp nhận dịch vụ thêm thay <user>`,
    `- Sinh phản ứng cơ thể hoặc thái độ tâm lý thay <user>`,
    `- Tự ý tuyên bố kết thúc toàn bộ dịch vụ, quyết toán, đánh giá, tiền boa hoặc lên cấp`,
    `- Chuỗi tư duy, phân tích, phán định thông tin, lời trong lòng`,
    `- Viết cập nhật biến vào trong <content>`,
    ``,
    `Nếu cốt truyện thực sự đẩy thời gian, có thể output sau </content>:`,
    `<time>YYYY年MM月DD日 星期X HH:mm</time>`,
    `Khi không có đẩy thời gian rõ ràng thì không output.`,
    ``,
    `Cập nhật biến đặt ở cuối theo định dạng có sẵn.`,
  ].filter(line => line !== undefined).join('\n');
}

/**
 * Dựa theo loại cổng sinh nội dung hiện tại và người nói, xây prompt inject một lần cho chế độ nhân viên.
 * Khi speaker là chuỗi rỗng hoặc null, prompt không output dòng "người nói hiện tại/đối tượng tương tác".
 */
export function makeWaiterGenerationInjects(kind: WaiterGenerationKind, speaker: string | null = null): InjectItem[] {
  let content: string;
  switch (kind) {
    case 'dialogue':
      content = makeWaiterDialoguePrompt(speaker || '');
      break;
    case 'story':
      content = makeWaiterStoryPrompt(speaker || null);
      break;
    default:
      content = makeWaiterDialoguePrompt(speaker || '');
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
