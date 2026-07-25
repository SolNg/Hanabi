/**
 * Inject prompt một vòng cho việc sinh sắp xếp hàng ngày của Hoa Chưa Nở.
 *
 * Sắp xếp hàng ngày của khách và của nhân viên độc lập với nhau, trường không dùng lẫn.
 * Inject một lần qua generate({ injects }), không làm ô nhiễm injectPrompts toàn cục.
 * Không chứa quy tắc gameplay, giới thiệu thế giới quan hay thuyết minh kỹ thuật frontend.
 */

import type { CustomerPageState, CustomerEmployee, CustomerNomination } from './customerGame';
import { WAITER_PROJECT_CATALOG, type WaiterPageState, type WaiterAssignment, type WaiterGuest } from './waiterGame';

type InjectItem = Omit<InjectionPrompt, 'id'>;

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

//─── Sắp xếp hàng ngày của khách ────────────────────────────────────────────────────────────

function buildCustomerDailyInput(state: CustomerPageState): string {
  const todayEmployees = state.今日员工
    .map(name => state.员工[name])
    .filter((e): e is CustomerEmployee => Boolean(e));

  const nomination = state.指名;
  const employeeLines = todayEmployees
    .map(e => {
      const nom: CustomerNomination | undefined = nomination.find(n => n.员工 === e.姓名);
      return [
        `    <employee>`,
        `      <name>${escapeXml(e.姓名)}</name>`,
        `      <rating>${escapeXml(e.评级)}</rating>`,
        `      <area>${escapeXml(e.区域)}</area>`,
        `      <status>${escapeXml(e.状态)}</status>`,
        `      <nomination_remaining_days>${nom ? nom.剩余天数 : 0}</nomination_remaining_days>`,
        `    </employee>`,
      ].join('\n');
    })
    .join('\n');

  const nominationLines = nomination.length > 0
    ? nomination
        .map(n =>
          [
            `    <nomination>`,
            `      <employee>${escapeXml(n.员工)}</employee>`,
            `      <remaining_days>${n.剩余天数}</remaining_days>`,
            `      <daily_fee>${n.每日费用}</daily_fee>`,
            `    </nomination>`,
          ].join('\n'),
        )
        .join('\n')
    : '';

  const openProjects = Object.values(state.项目).filter(p => p.开放);
  const projectLines = openProjects
    .map(p =>
      [
        `    <project>`,
        `      <name>${escapeXml(p.名称)}</name>`,
        `      <price>${p.价格}</price>`,
        `      <area>${escapeXml(p.区域)}</area>`,
        `      <duration_minutes>${p.时长分钟}</duration_minutes>`,
        `    </project>`,
      ].join('\n'),
    )
    .join('\n');

  const openAreas = Object.values(state.区域)
    .filter(a => a.开放)
    .map(a => escapeXml(a.名称))
    .join('、');

  const stayRemainingDays = state.住宿.状态 === '住宿中' ? state.住宿.剩余天数 : 0;

  return [
    `<daily_input>`,
    `  <task>Sinh dữ liệu sắp xếp tại tiệm hôm nay của khách</task>`,
    `  <date>${escapeXml(state.日期)}</date>`,
    `  <time>${escapeXml(state.时间)}</time>`,
    `  <location>${escapeXml(state.地点)}</location>`,
    `  <stay_status>${escapeXml(state.住宿.状态)}</stay_status>`,
    `  <stay_remaining_days>${stayRemainingDays}</stay_remaining_days>`,
    `  <open_areas>${openAreas}</open_areas>`,
    `  <today_employee_names>${state.今日员工.map(escapeXml).join('、')}</today_employee_names>`,
    `  <today_employees>`,
    employeeLines,
    `  </today_employees>`,
    `  <current_nominations>`,
    nominationLines,
    `  </current_nominations>`,
    `  <available_projects>`,
    projectLines,
    `  </available_projects>`,
    `  <female_only_visible>${state.女性限定角色可见}</female_only_visible>`,
    `</daily_input>`,
  ].join('\n');
}

function makeCustomerDailyFormatInstruction(): string {
  return [
    `[Yêu cầu định dạng output]`,
    `Task hiện tại: sinh sắp xếp tại tiệm hôm nay của khách.`,
    ``,
    `Bắt buộc phải output nghiêm ngặt theo quy tắc định dạng output <customer_daily> đang kích hoạt hiện tại.`,
    `Chỉ được dùng nhân viên, khu vực, dự án và số liệu được cung cấp trong <daily_input>.`,
    ``,
    `Cấm:`,
    `- Bịa nhân viên, khu vực hoặc dự án ngoài danh sách input`,
    `- Sửa vốn, đánh giá, độ thiện cảm hoặc quan hệ`,
    `- Định sẵn hành động, đặt lịch hoặc kết quả quan hệ thay <user>`,
    `- Output <content>, <time> hoặc <UpdateVariable>`,
    `- Ngoài <thinking>...</thinking> đặt trước, không output bất kỳ nội dung nào ngoài <customer_daily>...</customer_daily>`,
  ].join('\n');
}

/**
 * Xây prompt inject một lần cho việc sinh sắp xếp hàng ngày của khách.
 * Serialize dữ liệu khả dụng trong CustomerPageState hiện tại thành <daily_input>,
 * và đính kèm ràng buộc định dạng output.
 */
export function makeCustomerDailyArrangementInjects(state: CustomerPageState): InjectItem[] {
  const inputBlock = buildCustomerDailyInput(state);
  const formatInstruction = makeCustomerDailyFormatInstruction();
  const content = `${inputBlock}\n\n${formatInstruction}`;
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

// ─── Sắp xếp hàng ngày của nhân viên ──────────────────────────────────────────────────────────

function buildWaiterDailyInput(state: WaiterPageState): string {
  const nominationIds = new Set(state.activeNominations.map(nomination => nomination.guestId));
  const guestLines = state.activeNominations
    .map(nomination => state.guests[nomination.guestId])
    .filter((guest): guest is WaiterGuest => Boolean(guest))
    .map(guest =>
      [
        `    <guest>`,
        `      <id>${escapeXml(guest.id)}</id>`,
        `      <name>${escapeXml(guest.name)}</name>`,
        `      <gender>${escapeXml(guest.gender)}</gender>`,
        `      <species>${escapeXml(guest.species)}</species>`,
        `      <origin>${escapeXml(guest.origin)}</origin>`,
        `      <budget>${guest.budget}</budget>`,
        `      <project_preferences>${guest.projectPreferences.map(project => `<project>${escapeXml(project)}</project>`).join('')}</project_preferences>`,
        `      <source>${escapeXml(guest.source)}</source>`,
        `      <returning>${guest.returning}</returning>`,
        `      <nominated>${guest.nominated}</nominated>`,
        `      <nomination_remaining_days>${guest.nominationRemainingDays}</nomination_remaining_days>`,
        `      <notes>${escapeXml(guest.notes)}</notes>`,
        `    </guest>`,
      ].join('\n'),
    )
    .join('\n');

  const assignmentSlots = state.assignments
    .map((assignment: WaiterAssignment) =>
      [
        `    <slot>`,
        `      <id>${escapeXml(assignment.id)}</id>`,
        `      <fixed_guest_id>${nominationIds.has(assignment.guestId) ? escapeXml(assignment.guestId) : ''}</fixed_guest_id>`,
        `      <fixed_project>${nominationIds.has(assignment.guestId) ? escapeXml(assignment.project) : ''}</fixed_project>`,
        `      <fixed_area>${nominationIds.has(assignment.guestId) ? escapeXml(assignment.area) : ''}</fixed_area>`,
        `      <fixed_nomination_days>${nominationIds.has(assignment.guestId) ? assignment.nominationDays : 0}</fixed_nomination_days>`,
        `    </slot>`,
      ].join('\n'),
    )
    .join('\n');
  const projectLines = WAITER_PROJECT_CATALOG.map(project =>
    [
      `    <project>`,
      `      <name>${escapeXml(project.project)}</name>`,
      `      <area>${escapeXml(project.area)}</area>`,
      `      <duration_minutes>${project.duration}</duration_minutes>`,
      `    </project>`,
    ].join('\n'),
  ).join('\n');

  return [
    `<daily_input>`,
    `  <guest_schema_version>2</guest_schema_version>`,
    `  <task>Sinh dữ liệu ca và sắp xếp tiếp đón hôm nay của nhân viên</task>`,
    `  <date>${escapeXml(state.dateText)}</date>`,
    `  <time>${escapeXml(state.time)}</time>`,
    `  <grade>${escapeXml(state.grade)}</grade>`,
    `  <shift_name>${escapeXml(state.shift.name)}</shift_name>`,
    `  <shift_area>${escapeXml(state.shift.area)}</shift_area>`,
    `  <shift_start>${escapeXml(state.shift.start)}</shift_start>`,
    `  <shift_end>${escapeXml(state.shift.end)}</shift_end>`,
    `  <location>${escapeXml(state.location)}</location>`,
    `  <assignment_count>${state.assignments.length}</assignment_count>`,
    `  <minimum_new_guest_gender_variety>${state.assignments.length - state.activeNominations.length >= 2 ? 2 : 1}</minimum_new_guest_gender_variety>`,
    `  <reserved_guest_ids>${Object.keys(state.guests).filter(id => !state.dailyGuestIds.includes(id)).map(id => `<id>${escapeXml(id)}</id>`).join('')}</reserved_guest_ids>`,
    `  <active_nomination_guests>`,
    guestLines,
    `  </active_nomination_guests>`,
    `  <assignment_slots>`,
    assignmentSlots,
    `  </assignment_slots>`,
    `  <available_projects>`,
    projectLines,
    `  </available_projects>`,
    `</daily_input>`,
  ].join('\n');
}

function makeWaiterDailyFormatInstruction(): string {
  return [
    `[Yêu cầu định dạng output]`,
    `Task hiện tại: sinh tóm tắt ca và sắp xếp tiếp đón hôm nay của nhân viên.`,
    ``,
    `Bắt buộc phải output nghiêm ngặt theo quy tắc định dạng output <waiter_daily> đang kích hoạt hiện tại.`,
    `Khu vực, dự án, thời lượng, ca và assignment slot ID chỉ được lấy từ sự thật frontend trong <daily_input>.`,
    `Slot có fixed_guest_id không rỗng bắt buộc phải tái sử dụng nguyên trạng hồ sơ khách hoàn chỉnh trong active_nomination_guests, không được đổi người hay sửa bất kỳ trường nào.`,
    `Slot không cố định bắt buộc phải sinh guestId hợp lệ mới và hồ sơ khách hoàn chỉnh, không được xung đột với reserved_guest_ids.`,
    `Mỗi khách mới điền một giá trị giới tính tự nhiên (như "nam", "nữ", "vô tính", "song tính" v.v.), tổng số khách mới không cố định phải thỏa mãn số loại giới tính tối thiểu theo yêu cầu minimum_new_guest_gender_variety.`,
    ``,
    `Cấm:`,
    `- Bịa khu vực hoặc dự án không tồn tại trong available_projects`,
    `- Sửa số dư, đánh giá, ghi nhận trưởng thành hoặc độ thành thạo`,
    `- Định sẵn việc chấp nhận dịch vụ thêm, kết quả hoàn thành dịch vụ hoặc thay đổi quan hệ thay <user>`,
    `- Output <content> hoặc <UpdateVariable>`,
    `- Ngoài <thinking>...</thinking> đặt trước, không output bất kỳ nội dung nào ngoài <waiter_daily>...</waiter_daily>`,
  ].join('\n');
}

/**
 * Xây prompt inject một lần cho việc sinh sắp xếp hàng ngày của nhân viên.
 * Serialize dữ liệu khả dụng trong WaiterPageState hiện tại thành <daily_input>,
 * và đính kèm ràng buộc định dạng output.
 */
export function makeWaiterDailyArrangementInjects(state: WaiterPageState): InjectItem[] {
  const inputBlock = buildWaiterDailyInput(state);
  const formatInstruction = makeWaiterDailyFormatInstruction();
  const content = `${inputBlock}\n\n${formatInstruction}`;
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
