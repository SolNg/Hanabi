export type TutorialMode = '老板' | '游客' | '服务员';

export type TutorialAction =
  | 'boss-select-hostess'
  | 'boss-open-employees'
  | 'boss-open-schedule'
  | 'boss-select-shift'
  | 'boss-confirm-schedule'
  | 'boss-open-overview'
  | 'boss-open-recruit'
  | 'boss-open-facilities'
  | 'boss-open-settlement'
  | 'boss-close-menu'
  | 'customer-open-nomination'
  | 'customer-nominate-atri'
  | 'customer-open-projects'
  | 'customer-select-project'
  | 'customer-select-atri'
  | 'customer-book-service'
  | 'customer-start-service'
  | 'waiter-start-shift'
  | 'waiter-start-service'
  | 'waiter-open-menu'
  | 'waiter-open-growth'
  | 'waiter-open-log'
  | 'waiter-open-save'
  | 'airp-leave'
  | 'open-save'
  | 'save';

export type TutorialStep = {
  title: string;
  text: string;
  action?: TutorialAction;
  buttonLabel?: string;
  placement?: 'left' | 'right' | 'center';
};

export type TutorialProgress = {
  version: 1;
  mode: TutorialMode;
  step: number;
  active: boolean;
  completed: boolean;
  skipped: boolean;
};

const BOSS_STEPS: TutorialStep[] = [
  {
    title: 'Chọn mascot tiếp tân của bạn',
    text: 'Trước tiên chọn một mascot tiếp tân trong số các nhân vật hiện có. Cô ấy sẽ trở thành nhân viên khởi đầu, và bị loại khỏi bể tuyển dụng thường sau này.',
    action: 'boss-select-hostess',
    placement: 'center',
  },
  {
    title: 'Trước tiên xem danh sách nhân viên',
    text: 'Trang nhân viên hiển thị đánh giá, lương ngày, độ hài lòng, mệt mỏi và khu vực hiện tại.',
    action: 'boss-open-employees',
    placement: 'left',
  },
  {
    title: 'Làm quen với mascot tiếp tân hiện tại',
    text: 'Mascot tiếp tân bạn vừa chọn là nhân viên cấp D khi khởi đầu. Cô ấy sẽ tham gia xếp ca, đánh giá, lương và lên cấp như các nhân viên khác.',
    buttonLabel: 'Đi sắp xếp ca',
    placement: 'right',
  },
  {
    title: 'Mở xếp ca',
    text: 'Mỗi khung giờ trong ngày đều có thể sắp xếp riêng nghỉ, chờ hoặc khu vực cụ thể.',
    action: 'boss-open-schedule',
    placement: 'left',
  },
  {
    title: 'Chọn ô thời gian của mascot tiếp tân',
    text: 'Bấm vào bất kỳ ô thời gian nào, phía dưới sẽ hiện vị trí và trạng thái có thể chọn cho khung giờ đó.',
    action: 'boss-select-shift',
    placement: 'right',
  },
  {
    title: 'Xác nhận xếp ca hôm nay',
    text: 'Sau khi điều chỉnh xong phải bấm xác nhận xếp ca, khu vực trực và khả năng tiếp đón hôm nay mới được tính theo sắp xếp mới.',
    action: 'boss-confirm-schedule',
    placement: 'right',
  },
  {
    title: 'Xem tổng quan kinh doanh',
    text: 'Tổng quan hiển thị tập trung lượng khách, đánh giá, vốn, bảo trì, chiếm dụng chỉ định và nhắc nhở hôm nay.',
    action: 'boss-open-overview',
    placement: 'left',
  },
  {
    title: 'Tuyển nhân viên mới',
    text: 'Ứng viên tuyển dụng làm mới theo thời gian thực. Sau khi tuyển, nhân viên sẽ vào danh sách và tham gia xếp ca sau này.',
    action: 'boss-open-recruit',
    placement: 'left',
  },
  {
    title: 'Mở rộng Hoa Chưa Nở',
    text: 'Cơ sở hạ tầng quyết định giới hạn tiếp đón và hiệu suất kinh doanh, công trình cần đủ điều kiện, thi công và nghiệm thu.',
    action: 'boss-open-facilities',
    placement: 'left',
  },
  {
    title: 'Quyết toán ngày và qua ngày',
    text: 'Quyết toán sẽ tổng hợp thu nhập, lương, vận hành và tiêu hao công trình hôm đó, và đẩy thời gian tới ngày hôm sau.',
    action: 'boss-open-settlement',
    placement: 'left',
  },
  {
    title: 'Quay lại màn hình hiện trường',
    text: 'Nút quay lại trong menu sẽ giữ nguyên trạng thái kinh doanh hiện tại, có thể mở lại bất kỳ trang nào bất cứ lúc nào.',
    action: 'boss-close-menu',
    placement: 'left',
  },
  {
    title: 'Hoàn thành lần lưu đầu tiên',
    text: 'Bấm nút save ở góc trên phải. Sau đó có thể lưu, đọc, kiểm tra, sửa hoặc export save bất cứ lúc nào trong game.',
    action: 'open-save',
    placement: 'left',
  },
  {
    title: 'Lưu tiến độ hiện tại',
    text: 'Bấm lưu và xác nhận. Sau khi hoàn thành, hướng dẫn người mới lần này cũng sẽ được ghi vào save này.',
    action: 'save',
    placement: 'right',
  },
];

const CUSTOMER_STEPS: TutorialStep[] = [
  {
    title: 'Lần đầu đến tiệm',
    text: 'Gameplay khách xoay quanh tiêu dùng, chỉ định, dịch vụ, quan hệ và danh bạ. Trước tiên bắt đầu bằng việc chỉ định mascot tiếp tân atri.',
    buttonLabel: 'Bắt đầu hướng dẫn',
    placement: 'center',
  },
  {
    title: 'Mở danh sách chỉ định',
    text: 'Chỉ định sẽ khóa thời gian đồng hành của nhân viên hôm đó; khi ở trọ cũng có thể chỉ định liên tục theo số ngày còn lại.',
    action: 'customer-open-nomination',
    placement: 'left',
  },
  {
    title: 'Chỉ định atri',
    text: 'atri là nhân viên đầu tiên trong hướng dẫn lần này. Bấm nút chỉ định của cô ấy và xác nhận phí.',
    action: 'customer-nominate-atri',
    placement: 'left',
  },
  {
    title: 'Chọn dịch vụ',
    text: 'Dự án quyết định địa điểm, thời gian và giá, nhân viên phải có mặt hôm đó và có thể nhận dự án đó.',
    action: 'customer-open-projects',
    placement: 'left',
  },
  {
    title: 'Chọn nghỉ ngơi tắm',
    text: 'Trước tiên dùng dự án thường để đi qua quy trình đặt lịch. Sau này có thể tự do chọn dự án khác.',
    action: 'customer-select-project',
    placement: 'right',
  },
  {
    title: 'Chọn atri',
    text: 'Cùng một dự án có thể có nhiều nhân viên để chọn. Nhân viên đã chỉ định sẽ ưu tiên giữ khả dụng.',
    action: 'customer-select-atri',
    placement: 'right',
  },
  {
    title: 'Xác nhận đặt lịch',
    text: 'Sau khi xác nhận sẽ trừ phí dự án, và thêm dịch vụ vào sắp xếp hôm nay.',
    action: 'customer-book-service',
    placement: 'right',
  },
  {
    title: 'Bắt đầu dịch vụ',
    text: 'Sau khi bắt đầu sẽ vào hiện trường tương tác. Bạn có thể tự input hành động, cũng có thể rời đi trước rồi tiếp tục sau.',
    action: 'customer-start-service',
    placement: 'right',
  },
  {
    title: 'Rời hiện trường tương tác',
    text: 'Rời đi chỉ thu gọn tương tác hiện tại, không kết thúc dịch vụ đã bắt đầu.',
    action: 'airp-leave',
    placement: 'left',
  },
  {
    title: 'Hoàn thành lần lưu đầu tiên',
    text: 'Bấm nút save ở góc trên phải, lưu lại chỉ định, đặt lịch, quan hệ và ghi chép tiêu dùng hiện tại.',
    action: 'open-save',
    placement: 'left',
  },
  {
    title: 'Lưu tiến độ hiện tại',
    text: 'Bấm lưu và xác nhận. Sau đó có thể tiếp tục dịch vụ, nâng cao quan hệ, thêm danh bạ hoặc sắp xếp ngày tiếp theo.',
    action: 'save',
    placement: 'right',
  },
];

const WAITER_STEPS: TutorialStep[] = [
  {
    title: 'Bắt đầu ca hôm nay',
    text: 'Gameplay nhân viên xoay quanh đến ca, tiếp đón, đánh giá, thu nhập, trưởng thành và đánh giá cấp bậc. Trước tiên hoàn thành một lần chuẩn bị tiếp đón.',
    buttonLabel: 'Bắt đầu hướng dẫn',
    placement: 'center',
  },
  {
    title: 'Đến ca',
    text: 'Sau khi đến ca mới có thể bắt đầu tiếp đón hôm nay. Thể lực, khu vực ca trực và trạng thái hiện tại sẽ hiển thị ở màn hình chính.',
    action: 'waiter-start-shift',
    placement: 'left',
  },
  {
    title: 'Tiếp đón khách tiếp theo',
    text: 'Khách chỉ định sẽ ưu tiên xuất hiện. Bấm khách tiếp theo để vào hiện trường dịch vụ lần này.',
    action: 'waiter-start-service',
    placement: 'left',
  },
  {
    title: 'Rời hiện trường tương tác',
    text: 'Input hiện trường do bạn quyết định. Bây giờ hãy rời đi trước, việc tiếp đón vẫn được giữ, có thể tiếp tục hoặc kết thúc sau.',
    action: 'airp-leave',
    placement: 'left',
  },
  {
    title: 'Mở menu công việc',
    text: 'Bấm dải đối thoại dưới cùng để vào menu công việc, xem ca trực, tiếp đón, trưởng thành, thu chi và đánh giá.',
    action: 'waiter-open-menu',
    placement: 'right',
  },
  {
    title: 'Xem ghi nhận trưởng thành',
    text: 'Trang trưởng thành ghi lại kết quả dịch vụ đã hoàn thành, và quy đổi thành độ thành thạo tương ứng.',
    action: 'waiter-open-growth',
    placement: 'left',
  },
  {
    title: 'Xem tương tác và ghi chép',
    text: 'Trang ghi chép có thể giao lưu với chủ tiệm, đồng nghiệp, cũng có thể mở save. Các trang khác chịu trách nhiệm thu chi, đánh giá và đầu tư cá nhân.',
    action: 'waiter-open-log',
    placement: 'left',
  },
  {
    title: 'Mở save',
    text: 'Bấm save, lưu ca trực, tiếp đón, trưởng thành và thu chi cá nhân hiện tại.',
    action: 'waiter-open-save',
    placement: 'left',
  },
  {
    title: 'Lưu tiến độ hiện tại',
    text: 'Bấm lưu và xác nhận. Sau khi hoàn thành có thể tiếp tục tiếp đón, kết thúc dịch vụ, hoặc quyết toán tan ca sau khi hoàn thành ca trực.',
    action: 'save',
    placement: 'right',
  },
];

export const TUTORIAL_STEPS: Record<TutorialMode, TutorialStep[]> = {
  老板: BOSS_STEPS,
  游客: CUSTOMER_STEPS,
  服务员: WAITER_STEPS,
};

export function makeTutorialProgress(mode: TutorialMode): TutorialProgress {
  return { version: 1, mode, step: 0, active: true, completed: false, skipped: false };
}

export function normalizeTutorialProgress(value: unknown, mode: TutorialMode): TutorialProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return makeTutorialProgress(mode);
  }
  const source = value as Partial<TutorialProgress>;
  const steps = TUTORIAL_STEPS[mode];
  const step = Math.max(0, Math.min(steps.length - 1, Math.floor(Number(source.step) || 0)));
  const completed = source.completed === true;
  const skipped = source.skipped === true;
  return {
    version: 1,
    mode,
    step,
    active: !completed && source.active !== false,
    completed,
    skipped,
  };
}
