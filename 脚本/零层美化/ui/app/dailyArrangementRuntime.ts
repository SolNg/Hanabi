import {
  cloneCustomerPageState,
  type CustomerEmployeeStatus,
  type CustomerPageState,
} from './customerGame';
import {
  cloneWaiterPageState,
  WAITER_PROJECT_CATALOG,
  type WaiterAssignment,
  type WaiterGuest,
  type WaiterGuestSource,
  type WaiterPageState,
} from './waiterGame';

export type DailyArrangementApplyResult<T> = {
  ok: boolean;
  state: T;
  note: string;
  issues: string[];
};

type CustomerDailyEmployee = {
  name: string;
  rating: string;
  area: string;
  status: CustomerEmployeeStatus;
  nominationRemainingDays: number;
};

type CustomerDailyNomination = {
  employee: string;
  remainingDays: number;
  dailyFee: number;
};

type CustomerDailyProject = {
  name: string;
  price: number;
  area: string;
  durationMinutes: number;
};

type CustomerDailyPayload = {
  date: string;
  time: string;
  location: string;
  stayStatus: string;
  stayRemainingDays: number;
  employees: CustomerDailyEmployee[];
  nominations: CustomerDailyNomination[];
  projects: CustomerDailyProject[];
  sceneNote: string;
};

type WaiterDailyAssignment = {
  id: string;
  time: string;
  guestId: string;
  source: string;
  project: string;
  area: string;
  durationMinutes: number;
  nominationDays: number;
  opening: string;
};

type WaiterDailyGuest = {
  id: string;
  name: string;
  gender: string;
  species: string;
  origin: string;
  budget: number;
  projectPreferences: string[];
  source: string;
  returning: boolean;
  nominated: boolean;
  nominationRemainingDays: number;
  notes: string;
};

type WaiterDailyPayload = {
  date: string;
  time: string;
  grade: string;
  shiftName: string;
  shiftArea: string;
  shiftStart: string;
  shiftEnd: string;
  guests: WaiterDailyGuest[];
  assignments: WaiterDailyAssignment[];
  shiftNote: string;
};

const CUSTOMER_STATUSES: CustomerEmployeeStatus[] = ['空闲', '指名待命', '服务中', '被其他客人指名', '休息'];

function elementChildren(element: Element): Element[] {
  return Array.from(element.childNodes).filter((node): node is Element => node.nodeType === 1);
}

function assertExactChildNames(element: Element, allowedNames: string[], context: string, issues: string[]): void {
  const allowed = new Set(allowedNames);
  const unknown = elementChildren(element).map(item => item.tagName).filter(name => !allowed.has(name));
  if (unknown.length > 0) {
    issues.push(`${context} chứa trường không xác định: ${[...new Set(unknown)].join('、')}`);
  }
}

function directChildren(element: Element, name: string): Element[] {
  return elementChildren(element).filter(child => child.tagName === name);
}

function readSingleText(element: Element, name: string, context: string, issues: string[]): string {
  const matches = directChildren(element, name);
  if (matches.length !== 1) {
    issues.push(`${context}.${name} số lượng phải là 1, thực tế là ${matches.length}`);
    return '';
  }
  if (elementChildren(matches[0]).length > 0) {
    issues.push(`${context}.${name} không được chứa thẻ lồng nhau`);
  }
  return (matches[0].textContent ?? '').trim();
}

function readSingleElement(element: Element, name: string, context: string, issues: string[]): Element | null {
  const matches = directChildren(element, name);
  if (matches.length !== 1) {
    issues.push(`${context}.${name} số lượng phải là 1, thực tế là ${matches.length}`);
    return null;
  }
  return matches[0];
}

function readInteger(element: Element, name: string, context: string, issues: string[]): number {
  const value = readSingleText(element, name, context, issues);
  if (!/^-?\d+$/.test(value)) {
    issues.push(`${context}.${name} phải là số nguyên`);
    return 0;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    issues.push(`${context}.${name} vượt quá phạm vi số nguyên cho phép`);
    return 0;
  }
  return parsed;
}

function readBoolean(element: Element, name: string, context: string, issues: string[]): boolean {
  const value = readSingleText(element, name, context, issues);
  if (value !== 'true' && value !== 'false') {
    issues.push(`${context}.${name} phải là true hoặc false`);
  }
  return value === 'true';
}

function parseRoot(raw: string, rootName: string, issues: string[]): Element | null {
  const source = raw.trim();
  const openTag = `<${rootName}>`;
  const closeTag = `</${rootName}>`;
  if (typeof DOMParser === 'undefined') {
    issues.push('Môi trường hiện tại không hỗ trợ phân tích XML');
    return null;
  }

  const openingIndices: number[] = [];
  const closingIndices: number[] = [];
  for (let index = source.indexOf(openTag); index >= 0; index = source.indexOf(openTag, index + openTag.length)) {
    openingIndices.push(index);
  }
  for (let index = source.indexOf(closeTag); index >= 0; index = source.indexOf(closeTag, index + closeTag.length)) {
    closingIndices.push(index);
  }

  const candidates = openingIndices.flatMap(openIndex => {
    const closeIndex = closingIndices.find(index => index > openIndex);
    if (closeIndex === undefined) {
      return [];
    }
    const block = source.slice(openIndex, closeIndex + closeTag.length);
    const document = new DOMParser().parseFromString(block, 'application/xml');
    const root = document.documentElement;
    if (
      document.getElementsByTagName('parsererror').length > 0
      || root.tagName !== rootName
      || elementChildren(root).length === 0
    ) {
      return [];
    }
    return [{ openIndex, closeIndex, root }];
  });

  if (candidates.length !== 1) {
    issues.push(`Phải có đúng một khối dữ liệu <${rootName}>`);
  }
  const candidate = candidates.at(-1);
  if (!candidate) {
    issues.push(`Thiếu khối dữ liệu <${rootName}> hoàn chỉnh`);
    return null;
  }

  const suffix = source.slice(candidate.closeIndex + closeTag.length).trim();
  if (suffix) {
    issues.push('Có nội dung ngoài định dạng sau khối dữ liệu sắp xếp hàng ngày');
  }
  return candidate.root;
}

function sameStringSet(actual: string[], expected: string[], label: string, issues: string[]): void {
  if (new Set(actual).size !== actual.length) {
    issues.push(`${label} có mục trùng lặp`);
  }
  const actualSorted = [...new Set(actual)].sort();
  const expectedSorted = [...new Set(expected)].sort();
  if (actualSorted.length !== expectedSorted.length || actualSorted.some((value, index) => value !== expectedSorted[index])) {
    issues.push(`${label} không khớp với danh sách hiện có`);
  }
}

function parseCustomerDaily(raw: string, issues: string[]): CustomerDailyPayload | null {
  const root = parseRoot(raw, 'customer_daily', issues);
  if (!root) return null;
  assertExactChildNames(
    root,
    ['date', 'time', 'location', 'stay_status', 'stay_remaining_days', 'today_employees', 'current_nominations', 'available_projects', 'scene_note'],
    'customer_daily',
    issues,
  );

  const employeesContainer = readSingleElement(root, 'today_employees', 'customer_daily', issues);
  const nominationsContainer = readSingleElement(root, 'current_nominations', 'customer_daily', issues);
  const projectsContainer = readSingleElement(root, 'available_projects', 'customer_daily', issues);

  const employees = employeesContainer
    ? directChildren(employeesContainer, 'employee').map((employee, index) => {
        const context = `today_employees.employee[${index}]`;
        assertExactChildNames(employee, ['name', 'rating', 'area', 'status', 'nomination_remaining_days'], context, issues);
        const status = readSingleText(employee, 'status', context, issues) as CustomerEmployeeStatus;
        if (!CUSTOMER_STATUSES.includes(status)) {
          issues.push(`${context}.status không phải trạng thái hợp lệ`);
        }
        return {
          name: readSingleText(employee, 'name', context, issues),
          rating: readSingleText(employee, 'rating', context, issues),
          area: readSingleText(employee, 'area', context, issues),
          status,
          nominationRemainingDays: readInteger(employee, 'nomination_remaining_days', context, issues),
        };
      })
    : [];
  if (employeesContainer) {
    assertExactChildNames(employeesContainer, ['employee'], 'today_employees', issues);
  }

  const nominations = nominationsContainer
    ? directChildren(nominationsContainer, 'nomination').map((nomination, index) => {
        const context = `current_nominations.nomination[${index}]`;
        assertExactChildNames(nomination, ['employee', 'remaining_days', 'daily_fee'], context, issues);
        return {
          employee: readSingleText(nomination, 'employee', context, issues),
          remainingDays: readInteger(nomination, 'remaining_days', context, issues),
          dailyFee: readInteger(nomination, 'daily_fee', context, issues),
        };
      })
    : [];
  if (nominationsContainer) {
    assertExactChildNames(nominationsContainer, ['nomination'], 'current_nominations', issues);
  }

  const projects = projectsContainer
    ? directChildren(projectsContainer, 'project').map((project, index) => {
        const context = `available_projects.project[${index}]`;
        assertExactChildNames(project, ['name', 'price', 'area', 'duration_minutes'], context, issues);
        return {
          name: readSingleText(project, 'name', context, issues),
          price: readInteger(project, 'price', context, issues),
          area: readSingleText(project, 'area', context, issues),
          durationMinutes: readInteger(project, 'duration_minutes', context, issues),
        };
      })
    : [];
  if (projectsContainer) {
    assertExactChildNames(projectsContainer, ['project'], 'available_projects', issues);
  }

  return {
    date: readSingleText(root, 'date', 'customer_daily', issues),
    time: readSingleText(root, 'time', 'customer_daily', issues),
    location: readSingleText(root, 'location', 'customer_daily', issues),
    stayStatus: readSingleText(root, 'stay_status', 'customer_daily', issues),
    stayRemainingDays: readInteger(root, 'stay_remaining_days', 'customer_daily', issues),
    employees,
    nominations,
    projects,
    sceneNote: readSingleText(root, 'scene_note', 'customer_daily', issues).replace(/\s+/g, ' ').trim(),
  };
}

export function applyCustomerDailyArrangement(raw: string, state: CustomerPageState): DailyArrangementApplyResult<CustomerPageState> {
  const issues: string[] = [];
  const payload = parseCustomerDaily(raw, issues);
  if (!payload) return { ok: false, state, note: '', issues };

  if (payload.date !== state.日期) issues.push('date không khớp với ngày hiện tại');
  if (payload.time !== state.时间) issues.push('time không khớp với giờ hiện tại');
  if (payload.location !== state.地点) issues.push('location không khớp với vị trí hiện tại');
  if (payload.stayStatus !== state.住宿.状态) issues.push('stay_status không khớp với trạng thái lưu trú');
  const expectedStayDays = state.住宿.状态 === '住宿中' ? state.住宿.剩余天数 : 0;
  if (payload.stayRemainingDays !== expectedStayDays) issues.push('stay_remaining_days không khớp với hồ sơ lưu trú');

  sameStringSet(payload.employees.map(item => item.name), state.今日员工, 'today_employees', issues);
  const openAreas = new Set(Object.values(state.区域).filter(area => area.开放).map(area => area.名称));
  const nominations = new Map(state.指名.map(item => [item.员工, item]));
  payload.employees.forEach(item => {
    const employee = state.员工[item.name];
    if (!employee) {
      issues.push(`Nhân viên ${item.name} không có trong nhóm nhân vật hiện tại`);
      return;
    }
    if (item.rating !== employee.评级) issues.push(`Đánh giá của ${item.name} đã bị sửa đổi`);
    if (!openAreas.has(item.area)) issues.push(`${item.name} bị xếp vào khu vực chưa mở ${item.area}`);
    if (item.status === '休息') issues.push(`Nhân viên hôm nay ${item.name} không được xuất trạng thái nghỉ ngơi`);
    const expectedNominationDays = nominations.get(item.name)?.剩余天数 ?? 0;
    if (item.nominationRemainingDays !== expectedNominationDays) {
      issues.push(`Số ngày chỉ định còn lại của ${item.name} đã bị sửa đổi`);
    }
    if (expectedNominationDays > 0 && item.status !== '指名待命') {
      issues.push(`${item.name} có chỉ định xuyên ngày, trạng thái phải là chờ chỉ định`);
    }
  });

  sameStringSet(payload.nominations.map(item => item.employee), state.指名.map(item => item.员工), 'current_nominations', issues);
  payload.nominations.forEach(item => {
    const expected = nominations.get(item.employee);
    if (!expected || item.remainingDays !== expected.剩余天数 || item.dailyFee !== expected.每日费用) {
      issues.push(`Hồ sơ chỉ định của ${item.employee} không khớp với sự kiện phía giao diện`);
    }
  });

  const openProjects = Object.values(state.项目).filter(project => project.开放);
  sameStringSet(payload.projects.map(item => item.name), openProjects.map(item => item.名称), 'available_projects', issues);
  const projects = new Map(openProjects.map(item => [item.名称, item]));
  payload.projects.forEach(item => {
    const expected = projects.get(item.name);
    if (!expected || item.price !== expected.价格 || item.area !== expected.区域 || item.durationMinutes !== expected.时长分钟) {
      issues.push(`Dữ liệu dự án của ${item.name} không khớp với sự kiện phía giao diện`);
    }
  });
  if (!payload.sceneNote || payload.sceneNote.length > 60) issues.push('scene_note phải là mô tả một dòng dài từ 1 đến 60 ký tự');

  if (issues.length > 0) return { ok: false, state, note: '', issues };
  const next = cloneCustomerPageState(state);
  payload.employees.forEach(item => {
    const employee = next.员工[item.name];
    employee.区域 = item.area;
    employee.状态 = item.status;
    employee.在线状态 = ['空闲', '指名待命'].includes(item.status) ? '在线' : '忙碌';
  });
  next.今日记录 = [...next.今日记录, payload.sceneNote].slice(-40);
  return { ok: true, state: next, note: payload.sceneNote, issues: [] };
}

function parseWaiterDaily(raw: string, issues: string[]): WaiterDailyPayload | null {
  const root = parseRoot(raw, 'waiter_daily', issues);
  if (!root) return null;
  assertExactChildNames(
    root,
    ['date', 'time', 'grade', 'shift_name', 'shift_area', 'shift_start', 'shift_end', 'guests', 'assignments', 'shift_note'],
    'waiter_daily',
    issues,
  );
  const guestsContainer = readSingleElement(root, 'guests', 'waiter_daily', issues);
  const assignmentsContainer = readSingleElement(root, 'assignments', 'waiter_daily', issues);
  if (guestsContainer) {
    assertExactChildNames(guestsContainer, ['guest'], 'guests', issues);
  }
  if (assignmentsContainer) {
    assertExactChildNames(assignmentsContainer, ['assignment'], 'assignments', issues);
  }

  const guests = guestsContainer
    ? directChildren(guestsContainer, 'guest').map((guest, index) => {
        const context = `guests.guest[${index}]`;
        assertExactChildNames(
          guest,
          [
            'id',
            'name',
            'gender',
            'species',
            'origin',
            'budget',
            'project_preferences',
            'source',
            'returning',
            'nominated',
            'nomination_remaining_days',
            'notes',
          ],
          context,
          issues,
        );
        const preferences = readSingleElement(guest, 'project_preferences', context, issues);
        if (preferences) assertExactChildNames(preferences, ['project'], `${context}.project_preferences`, issues);
        return {
          id: readSingleText(guest, 'id', context, issues),
          name: readSingleText(guest, 'name', context, issues),
          gender: readSingleText(guest, 'gender', context, issues),
          species: readSingleText(guest, 'species', context, issues),
          origin: readSingleText(guest, 'origin', context, issues),
          budget: readInteger(guest, 'budget', context, issues),
          projectPreferences: preferences
            ? directChildren(preferences, 'project').map(project => (project.textContent ?? '').trim())
            : [],
          source: readSingleText(guest, 'source', context, issues),
          returning: readBoolean(guest, 'returning', context, issues),
          nominated: readBoolean(guest, 'nominated', context, issues),
          nominationRemainingDays: readInteger(guest, 'nomination_remaining_days', context, issues),
          notes: readSingleText(guest, 'notes', context, issues).replace(/\s+/g, ' ').trim(),
        };
      })
    : [];

  const assignments = assignmentsContainer
    ? directChildren(assignmentsContainer, 'assignment').map((assignment, index) => {
        const context = `assignments.assignment[${index}]`;
        assertExactChildNames(
          assignment,
          ['id', 'time', 'guest_id', 'source', 'project', 'area', 'duration_minutes', 'nomination_days', 'opening'],
          context,
          issues,
        );
        return {
          id: readSingleText(assignment, 'id', context, issues),
          time: readSingleText(assignment, 'time', context, issues),
          guestId: readSingleText(assignment, 'guest_id', context, issues),
          source: readSingleText(assignment, 'source', context, issues),
          project: readSingleText(assignment, 'project', context, issues),
          area: readSingleText(assignment, 'area', context, issues),
          durationMinutes: readInteger(assignment, 'duration_minutes', context, issues),
          nominationDays: readInteger(assignment, 'nomination_days', context, issues),
          opening: readSingleText(assignment, 'opening', context, issues).replace(/\s+/g, ' ').trim(),
        };
      })
    : [];

  return {
    date: readSingleText(root, 'date', 'waiter_daily', issues),
    time: readSingleText(root, 'time', 'waiter_daily', issues),
    grade: readSingleText(root, 'grade', 'waiter_daily', issues),
    shiftName: readSingleText(root, 'shift_name', 'waiter_daily', issues),
    shiftArea: readSingleText(root, 'shift_area', 'waiter_daily', issues),
    shiftStart: readSingleText(root, 'shift_start', 'waiter_daily', issues),
    shiftEnd: readSingleText(root, 'shift_end', 'waiter_daily', issues),
    guests,
    assignments,
    shiftNote: readSingleText(root, 'shift_note', 'waiter_daily', issues).replace(/\s+/g, ' ').trim(),
  };
}

function waiterClockMinutes(value: string): number | null {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function sameWaiterGuest(actual: WaiterDailyGuest, expected: WaiterGuest): boolean {
  return actual.id === expected.id
    && actual.name === expected.name
    && actual.gender === expected.gender
    && actual.species === expected.species
    && actual.origin === expected.origin
    && actual.budget === expected.budget
    && [...new Set(actual.projectPreferences)].sort().join('|') === [...new Set(expected.projectPreferences)].sort().join('|')
    && actual.source === expected.source
    && actual.returning === expected.returning
    && actual.nominated === expected.nominated
    && actual.nominationRemainingDays === expected.nominationRemainingDays
    && actual.notes === expected.notes;
}

export function applyWaiterDailyArrangement(raw: string, state: WaiterPageState): DailyArrangementApplyResult<WaiterPageState> {
  const issues: string[] = [];
  const payload = parseWaiterDaily(raw, issues);
  if (!payload) return { ok: false, state, note: '', issues };

  if (payload.date !== state.dateText) issues.push('date không khớp với ngày hiện tại');
  if (payload.time !== state.time) issues.push('time không khớp với giờ hiện tại');
  if (payload.grade !== state.grade) issues.push('grade không khớp với đánh giá hiện tại');
  if (payload.shiftName !== state.shift.name) issues.push('shift_name không khớp với ca làm việc hiện tại');
  if (payload.shiftArea !== state.shift.area) issues.push('shift_area không khớp với vị trí hiện tại');
  if (payload.shiftStart !== state.shift.start || payload.shiftEnd !== state.shift.end) {
    issues.push('Thời gian bắt đầu/kết thúc ca không khớp với ca hiện tại');
  }

  sameStringSet(payload.assignments.map(item => item.id), state.assignments.map(item => item.id), 'assignments', issues);
  sameStringSet(payload.assignments.map(item => item.guestId), payload.guests.map(item => item.id), 'guests với assignments', issues);
  if (payload.assignments.length < 1 || payload.assignments.length > 6) issues.push('assignments số lượng phải từ 1 đến 6');

  const sourceTypes: WaiterGuestSource[] = ['普通客', '回头客', '指名客'];
  const projectCatalog = new Map(WAITER_PROJECT_CATALOG.map(project => [project.project, project]));
  const payloadGuests = new Map(payload.guests.map(guest => [guest.id, guest]));
  const guestNames = payload.guests.map(guest => guest.name);
  if (new Set(guestNames).size !== guestNames.length) issues.push('Tên gọi khách trong cùng một ngày không được trùng lặp');
  payload.guests.forEach((guest, index) => {
    const context = `guest ${guest.id || index + 1}`;
    if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(guest.id)) issues.push(`${context} định dạng id không hợp lệ`);
    if (!guest.name || guest.name.length > 40) issues.push(`${context} name phải dài từ 1 đến 40 ký tự`);
    if (!guest.gender || guest.gender.length > 20) issues.push(`${context} gender phải dài từ 1 đến 20 ký tự`);
    if (!guest.species || guest.species.length > 20) issues.push(`${context} species phải dài từ 1 đến 20 ký tự`);
    if (!guest.origin || guest.origin.length > 40) issues.push(`${context} origin phải dài từ 1 đến 40 ký tự`);
    if (guest.budget < 100 || guest.budget > 1_000_000) issues.push(`${context} budget vượt phạm vi 100 đến 1000000`);
    if (!sourceTypes.includes(guest.source as WaiterGuestSource)) issues.push(`${context} source không hợp lệ`);
    if (guest.projectPreferences.length < 1 || guest.projectPreferences.length > 6) {
      issues.push(`${context} project_preferences số lượng phải từ 1 đến 6`);
    }
    if (new Set(guest.projectPreferences).size !== guest.projectPreferences.length) {
      issues.push(`${context} project_preferences có mục trùng lặp`);
    }
    guest.projectPreferences.forEach(project => {
      if (!projectCatalog.has(project)) issues.push(`${context} chứa sở thích dự án không xác định ${project}`);
    });
    if (guest.source === '普通客' && (guest.returning || guest.nominated)) issues.push(`${context} cờ đánh dấu khách thường mâu thuẫn`);
    if (guest.source === '回头客' && (!guest.returning || guest.nominated)) issues.push(`${context} cờ đánh dấu khách quen mâu thuẫn`);
    if (guest.source === '指名客' && !guest.nominated) issues.push(`${context} khách chỉ định phải đánh dấu nominated=true`);
    if (guest.nominated && (guest.nominationRemainingDays < 1 || guest.nominationRemainingDays > 365)) {
      issues.push(`${context} số ngày chỉ định còn lại không hợp lệ`);
    }
    if (!guest.nominated && guest.nominationRemainingDays !== 0) issues.push(`${context} khi chưa chỉ định số ngày còn lại phải là 0`);
    if (guest.notes.length > 120) issues.push(`${context} notes không được vượt quá 120 ký tự`);
  });

  const activeNominationIds = new Set(state.activeNominations.map(nomination => nomination.guestId));
  state.activeNominations.forEach(nomination => {
    const actual = payloadGuests.get(nomination.guestId);
    const expected = state.guests[nomination.guestId];
    if (!actual || !expected || !sameWaiterGuest(actual, expected)) {
      issues.push(`Khách chỉ định xuyên ngày ${nomination.guestId} bị sửa đổi hoặc thiếu thông tin thân phận ổn định`);
    }
  });
  const replaceableFallbackIds = new Set(state.dailyGuestIds.filter(id => !activeNominationIds.has(id)));
  payload.guests.forEach(guest => {
    if (state.guests[guest.id] && !activeNominationIds.has(guest.id) && !replaceableFallbackIds.has(guest.id)) {
      issues.push(`ID khách mới ${guest.id} xung đột với khách cũ`);
    }
  });
  const newGuests = payload.guests.filter(guest => !activeNominationIds.has(guest.id));
  if (newGuests.length >= 2 && new Set(newGuests.map(guest => guest.gender)).size < 2) {
    issues.push('Khách mới trong ngày cần ít nhất hai giới tính khác nhau, tránh suy thoái thành danh sách một giới tính cố định');
  }

  const expectedAssignments = new Map(state.assignments.map(assignment => [assignment.id, assignment]));
  const shiftStart = waiterClockMinutes(state.shift.start);
  const shiftEnd = state.shift.end === '00:00' ? 24 * 60 : waiterClockMinutes(state.shift.end);
  const scheduled: Array<{ id: string; start: number; end: number }> = [];
  payload.assignments.forEach(item => {
    const expected = expectedAssignments.get(item.id);
    const guest = payloadGuests.get(item.guestId);
    const project = projectCatalog.get(item.project);
    if (!expected) issues.push(`Tiếp đón ${item.id} không nằm trong khung giờ khả dụng hiện tại`);
    if (!guest) issues.push(`Tiếp đón ${item.id} tham chiếu đến khách không tồn tại ${item.guestId}`);
    if (guest && item.source !== guest.source) issues.push(`Tiếp đón ${item.id} source không khớp với hồ sơ khách`);
    if (!project || item.area !== project?.area || item.durationMinutes !== project?.duration) {
      issues.push(`Tiếp đón ${item.id} dự án, khu vực hoặc thời lượng không có trong danh mục dự án phía giao diện`);
    }
    if (guest && !guest.projectPreferences.includes(item.project)) {
      issues.push(`Tiếp đón ${item.id} dự án không nằm trong sở thích của khách`);
    }
    if (item.source === '指名客' && item.nominationDays !== guest?.nominationRemainingDays) {
      issues.push(`Tiếp đón ${item.id} số ngày chỉ định không khớp với hồ sơ khách`);
    }
    if (item.source !== '指名客' && item.nominationDays !== 0) issues.push(`Tiếp đón ${item.id} khách không chỉ định thì số ngày phải là 0`);
    if (!item.opening || item.opening.length > 40) issues.push(`Tiếp đón ${item.id} opening phải dài từ 1 đến 40 ký tự`);
    const start = waiterClockMinutes(item.time);
    if (start === null || shiftStart === null || shiftEnd === null || start < shiftStart || start + item.durationMinutes > shiftEnd) {
      issues.push(`Tiếp đón ${item.id} thời gian vượt quá ca làm việc`);
    } else {
      scheduled.push({ id: item.id, start, end: start + item.durationMinutes });
    }
  });
  scheduled.sort((left, right) => left.start - right.start);
  scheduled.forEach((item, index) => {
    if (index > 0 && item.start < scheduled[index - 1].end) issues.push(`Tiếp đón ${item.id} trùng thời gian với sắp xếp trước đó`);
  });
  state.activeNominations.forEach((nomination, index) => {
    const expectedAssignment = state.assignments[index];
    const actual = expectedAssignment ? payload.assignments.find(item => item.id === expectedAssignment.id) : null;
    if (
      !actual
      || actual.guestId !== nomination.guestId
      || actual.source !== '指名客'
      || actual.project !== nomination.project
      || actual.area !== nomination.area
      || actual.nominationDays !== nomination.remainingDays
    ) {
      issues.push(`Khách chỉ định xuyên ngày ${nomination.guestId} chưa được ưu tiên xếp vào khung giờ hôm nay theo đúng thân phận và dự án gốc`);
    }
  });
  if (!payload.shiftNote || payload.shiftNote.length > 60) issues.push('shift_note phải dài từ 1 đến 60 ký tự');

  if (issues.length > 0) return { ok: false, state, note: '', issues };
  const next = cloneWaiterPageState(state);
  const guests = Object.fromEntries(payload.guests.map(guest => [guest.id, {
    ...guest,
    source: guest.source as WaiterGuestSource,
  } satisfies WaiterGuest]));
  next.guests = { ...next.guests, ...guests };
  next.dailyGuestIds = payload.assignments.map(assignment => assignment.guestId);
  next.assignments = payload.assignments.map((assignment): WaiterAssignment => ({
    id: assignment.id,
    time: assignment.time,
    guestId: assignment.guestId,
    guest: guests[assignment.guestId].name,
    source: assignment.source as WaiterGuestSource,
    project: assignment.project,
    area: assignment.area,
    durationMinutes: assignment.durationMinutes,
    nominationDays: assignment.nominationDays,
    status: '待接待',
    opening: assignment.opening,
  }));
  next.guestGeneration = { dateIso: next.dateIso, attempted: true, source: 'ai', issues: [] };
  next.shiftNote = payload.shiftNote;
  next.dialogue = { speaker: 'Trưởng ca', text: payload.shiftNote };
  next.logs = [`${next.dateText} ${next.time} · ${payload.shiftNote}`, ...next.logs].slice(0, 120);
  return { ok: true, state: next, note: payload.shiftNote, issues: [] };
}
