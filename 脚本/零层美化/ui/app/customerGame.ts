import {
  findTangquanCharacter,
  isTangquanCharacterAllowed,
  listTangquanCharacters,
  type TangquanCharacterDefinition,
} from './characterCatalog';
import {
  makeTangquanTimeControlState,
  normalizeTangquanClock,
  normalizeTangquanTimeControlState,
  recordTangquanTimeTravel,
  type TangquanTimeControlState,
} from './timeTravel';

export type CustomerEmployeeRating = 'D' | 'C' | 'B' | 'A' | 'S';
export type CustomerEmployeeStatus = '空闲' | '指名待命' | '服务中' | '被其他客人指名' | '休息';
export type CustomerContactStatus = '未添加' | '可请求' | '已添加';
export type CustomerOnlineStatus = '在线' | '忙碌' | '离线';
export type CustomerStayStatus = '未住宿' | '住宿中';
export type CustomerServiceStatus = '已预约' | '进行中';
export type CustomerMenuView = 'today' | 'areas' | 'projects' | 'nomination' | 'relationship' | 'contacts' | 'schedule' | 'wallet';

export type CustomerArea = {
  名称: string;
  说明: string;
  开放: boolean;
};

export type CustomerEmployee = {
  姓名: string;
  评级: CustomerEmployeeRating;
  区域: string;
  状态: CustomerEmployeeStatus;
  每日指名费: number;
  好感度: number;
  信任度: number;
  联系状态: CustomerContactStatus;
  在线状态: CustomerOnlineStatus;
  互动次数: number;
  服务次数: number;
  额外服务次数: number;
  私下邀约次数: number;
  最近互动: string;
  标签: string[];
  说明: string;
  擅长项目: string[];
};

export type CustomerProject = {
  名称: string;
  价格: number;
  时长分钟: number;
  区域: string;
  开放: boolean;
  标签: string[];
  说明: string;
};

export type CustomerNomination = {
  员工: string;
  总天数: number;
  剩余天数: number;
  每日费用: number;
  已付费用: number;
  开始日: number;
};

export type CustomerService = {
  id: string;
  项目: string;
  员工: string;
  区域: string;
  价格: number;
  时长分钟: number;
  状态: CustomerServiceStatus;
  开始时间: string;
};

export type CustomerTransaction = {
  id: string;
  日期: string;
  时间: string;
  时间控制: TangquanTimeControlState;
  类型: '住宿' | '指名' | '项目' | '打赏';
  名称: string;
  金额: number;
  余额: number;
};

export type CustomerMessage = {
  id: string;
  发送者: '用户' | string;
  内容: string;
  日期: string;
  时间: string;
  已读: boolean;
};

export type CustomerConversation = {
  员工: string;
  未读: number;
  消息: CustomerMessage[];
};

export type CustomerDialogueState = {
  说话人: string;
  台词页: { speaker: string; text: string }[];
  当前页: number;
  最近正文: string;
};

export type CustomerPageState = {
  version: 1;
  日期: string;
  日序: number;
  时间: string;
  地点: string;
  资金: number;
  到店次数: number;
  到店状态: '临时到店' | '住宿中';
  住宿: {
    状态: CustomerStayStatus;
    房型: string;
    剩余天数: number;
    每日房费: number;
  };
  指名: CustomerNomination[];
  当前指名: CustomerNomination | null;
  当前服务: CustomerService | null;
  今日员工: string[];
  女性限定角色可见: boolean;
  区域: Record<string, CustomerArea>;
  员工: Record<string, CustomerEmployee>;
  项目: Record<string, CustomerProject>;
  联系人: Record<string, CustomerConversation>;
  消费流水: CustomerTransaction[];
  今日记录: string[];
  对话: CustomerDialogueState;
  随机种子: number;
};

export type CustomerMutationResult = {
  ok: boolean;
  message: string;
  state: CustomerPageState;
};

export const CUSTOMER_INITIAL_FUNDS = 30_000;
export const CUSTOMER_ROOM_OPTIONS = [
  { 名称: '简易客房', 每日房费: 1_800 },
  { 名称: '和室客房', 每日房费: 3_200 },
  { 名称: '私宅式客房', 每日房费: 5_600 },
] as const;

const MAX_TRANSACTIONS = 240;
const MAX_DAILY_LOGS = 40;
const MAX_CONTACT_MESSAGES = 80;
const CUSTOMER_AREAS: CustomerArea[] = [
  { 名称: '前台大厅', 说明: 'Nơi làm thủ tục đến quán, lưu trú và đặt lịch, cũng là nơi xác nhận sắp xếp hôm nay.', 开放: true },
  { 名称: '室内大浴场', 说明: 'Phù hợp để ngâm tắm nghỉ ngơi và giao lưu nhẹ nhàng lần đầu.', 开放: true },
  { 名称: '榻榻米休息室', 说明: 'Trò chuyện, đồ uống và đồng hành lâu dài chủ yếu diễn ra ở đây.', 开放: true },
  { 名称: '按摩室', 说明: 'Khu vực chính cho các hạng mục trị liệu và chăm sóc.', 开放: true },
  { 名称: '简易包间', 说明: 'Không gian phục vụ riêng tư yên tĩnh hơn, phù hợp để tương tác sâu.', 开放: true },
  { 名称: '庭院小径', 说明: 'Khu vực đi dạo và trò chuyện riêng tư giữa các lượt phục vụ.', 开放: true },
  { 名称: '简易客房', 说明: 'Khu vực nghỉ ngơi cho khách lưu trú, có thể duy trì chỉ định xuyên ngày.', 开放: true },
];

const CUSTOMER_PROJECTS: CustomerProject[] = [
  { 名称: '入浴休憩', 价格: 680, 时长分钟: 90, 区域: '室内大浴场', 开放: true, 标签: ['Lần đầu đến quán', 'Nhẹ nhàng'], 说明: 'Chủ yếu ngâm tắm và nghỉ ngơi, phù hợp để làm quen tự nhiên với nhân viên hôm nay.' },
  { 名称: '休息区陪同', 价格: 900, 时长分钟: 90, 区域: '榻榻米休息室', 开放: true, 标签: ['Trò chuyện', 'Thiện cảm'], 说明: 'Đồ uống, nghỉ ngơi và trò chuyện dài, phù hợp để tăng độ thân quen.' },
  { 名称: '香柚汤护理', 价格: 1_100, 时长分钟: 120, 区域: '简易包间', 开放: true, 标签: ['Chăm sóc', 'Yên tĩnh'], 说明: 'Dự án riêng tư kết hợp hương thơm, nước nóng và chăm sóc nhẹ nhàng.' },
  { 名称: '理疗按摩', 价格: 1_400, 时长分钟: 120, 区域: '按摩室', 开放: true, 标签: ['Trị liệu', 'Thư giãn'], 说明: 'Tập trung hơn vào thư giãn cơ thể và trải nghiệm dịch vụ.' },
  { 名称: '包间休憩', 价格: 1_650, 时长分钟: 150, 区域: '简易包间', 开放: true, 标签: ['Không gian riêng', 'Thời gian dài'], 说明: 'Phòng riêng độc lập và nghỉ ngơi cùng nhau, dành nhiều thời gian hơn cho tương tác tự do.' },
  { 名称: '庭院夜话', 价格: 760, 时长分钟: 60, 区域: '庭院小径', 开放: true, 标签: ['Ban đêm', 'Trò chuyện'], 说明: 'Đi dạo và trò chuyện trong sân vườn, phù hợp với khách đã quen thân.' },
  { 名称: '住宿陪同', 价格: 2_400, 时长分钟: 180, 区域: '简易客房', 开放: true, 标签: ['Chỉ dành cho khách lưu trú', 'Tương tác sâu'], 说明: 'Dự án đồng hành thời gian dài chỉ mở cho khách lưu trú.' },
];

const CUSTOMER_RATINGS: CustomerEmployeeRating[] = ['D', 'C', 'B', 'A', 'S'];

function stableCharacterHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeCatalogEmployee(character: TangquanCharacterDefinition): CustomerEmployee {
  const hash = stableCharacterHash(character.id);
  const isAtri = character.id === 'atri';
  const rating = isAtri ? 'D' : CUSTOMER_RATINGS[hash % CUSTOMER_RATINGS.length];
  const feeByRating: Record<CustomerEmployeeRating, number> = { D: 500, C: 720, B: 980, A: 1400, S: 1900 };
  const projectStart = hash % CUSTOMER_PROJECTS.length;
  const projects = isAtri
    ? ['入浴休憩', '休息区陪同', '香柚汤护理']
    : [0, 1, 2].map(offset => CUSTOMER_PROJECTS[(projectStart + offset) % CUSTOMER_PROJECTS.length].名称);
  return {
    姓名: character.name,
    评级: rating,
    区域: '前台大厅',
    状态: '休息',
    每日指名费: feeByRating[rating],
    好感度: 0,
    信任度: 0,
    联系状态: '未添加',
    在线状态: '离线',
    互动次数: 0,
    服务次数: 0,
    额外服务次数: 0,
    私下邀约次数: 0,
    最近互动: 'Chưa có cuộc trò chuyện chính thức nào.',
    标签: [...(isAtri ? ['Linh vật đại diện'] : []), ...(character.femaleUserOnly ? ['Giới hạn nữ'] : [])],
    说明: '',
    擅长项目: projects,
  };
}

function makeDailyEmployeeNames(employees: CustomerEmployee[], dateLabel: string): string[] {
  const sorted = [...employees]
    .sort(
      (left, right) =>
        stableCharacterHash(`${dateLabel}:${left.姓名}`) - stableCharacterHash(`${dateLabel}:${right.姓名}`),
    );
  const atri = sorted.find(employee => employee.姓名 === 'atri');
  const daily = [atri, ...sorted.filter(employee => employee.姓名 !== 'atri')]
    .filter((employee): employee is CustomerEmployee => Boolean(employee))
    .slice(0, Math.min(6, employees.length));
  return daily.map(employee => employee.姓名);
}

function applyDailyEmployeeSchedule(state: CustomerPageState): void {
  const areaNames = Object.values(state.区域).filter(area => area.开放).map(area => area.名称);
  const scheduled = new Set(state.今日员工);
  Object.values(state.员工).forEach(employee => {
    if (!scheduled.has(employee.姓名)) {
      employee.状态 = '休息';
      employee.在线状态 = '离线';
      return;
    }
    const index = state.今日员工.indexOf(employee.姓名);
    employee.区域 = areaNames[index % Math.max(1, areaNames.length)] ?? '前台大厅';
    employee.状态 = employee.姓名 === 'atri' ? '空闲' : index === 1 ? '服务中' : index === 0 ? '被其他客人指名' : '空闲';
    employee.在线状态 = employee.状态 === '空闲' ? '在线' : '忙碌';
  });
  state.指名.forEach(nomination => {
    const nominated = state.员工[nomination.员工];
    if (!nominated) return;
    nominated.状态 = state.当前服务?.员工 === nominated.姓名 ? '服务中' : '指名待命';
    nominated.在线状态 = '在线';
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function finiteNumber(value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function formatDate(date: Date): string {
  const week = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][date.getDay()];
  return `Ngày ${String(date.getDate()).padStart(2, '0')} tháng ${String(date.getMonth() + 1).padStart(2, '0')} năm ${date.getFullYear()}, ${week}`;
}

function addDateDays(value: string, days: number): string {
  const match = /^Ngày (\d{1,2}) tháng (\d{1,2}) năm (\d{4})/.exec(value);
  const date = match
    ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
    : new Date();
  date.setDate(date.getDate() + Math.max(0, Math.round(days)));
  return formatDate(date);
}

function toMinutes(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) {
    return 9 * 60;
  }
  return clamp(Number(match[1]), 0, 23) * 60 + clamp(Number(match[2]), 0, 59);
}

function fromMinutes(value: number): string {
  const normalized = ((Math.round(value) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed >>> 0, 1_664_525) + 1_013_904_223) >>> 0;
}

function makeId(prefix: string, state: CustomerPageState): string {
  return `${prefix}-${state.日序}-${state.时间.replace(':', '')}-${state.随机种子.toString(36)}`;
}

function makeBaseCustomerState(date = new Date(), femaleUser = false): CustomerPageState {
  const areas = Object.fromEntries(CUSTOMER_AREAS.map(area => [area.名称, clone(area)]));
  const projects = Object.fromEntries(CUSTOMER_PROJECTS.map(project => [project.名称, clone(project)]));
  const employeeList = listTangquanCharacters(femaleUser).map(makeCatalogEmployee);
  const employees = Object.fromEntries(employeeList.map(employee => [employee.姓名, clone(employee)]));
  const state: CustomerPageState = {
    version: 1,
    日期: formatDate(date),
    日序: 1,
    时间: '18:30',
    时间控制: makeTangquanTimeControlState(),
    地点: '前台大厅',
    资金: CUSTOMER_INITIAL_FUNDS,
    到店次数: 1,
    到店状态: '临时到店',
    住宿: { 状态: '未住宿', 房型: '', 剩余天数: 0, 每日房费: 0 },
    指名: [],
    当前指名: null,
    当前服务: null,
    今日员工: makeDailyEmployeeNames(employeeList, formatDate(date)),
    女性限定角色可见: femaleUser,
    区域: areas,
    员工: employees,
    项目: projects,
    联系人: {},
    消费流水: [],
    今日记录: ['Lần đầu đến quán, quầy lễ tân đã có thể làm thủ tục lưu trú, chỉ định và đặt lịch dịch vụ.'],
    对话: {
      说话人: 'Lễ tân',
      台词页: [{ speaker: 'Lễ tân', text: '"Chào mừng đến với Hoa Chưa Nở. Bạn có thể xem qua nhân viên đang phục vụ hôm nay, hoặc chọn dịch vụ ngay."' }],
      当前页: 0,
      最近正文: '',
    },
    随机种子: Math.max(1, Math.floor(date.getTime() % 2_147_483_647)),
  };
  applyDailyEmployeeSchedule(state);
  return state;
}

function normalizeEmployee(name: string, value: unknown, fallback?: CustomerEmployee): CustomerEmployee {
  const source = asRecord(value);
  const base = fallback ?? {
    姓名: name, 评级: 'C' as const, 区域: '前台大厅', 状态: '休息' as const, 每日指名费: 700,
    好感度: 0, 信任度: 0, 联系状态: '未添加' as const, 在线状态: '离线' as const, 互动次数: 0,
    服务次数: 0, 额外服务次数: 0, 私下邀约次数: 0, 最近互动: 'Chưa có cuộc trò chuyện chính thức nào.', 标签: [], 说明: '', 擅长项目: [],
  };
  const ratings: CustomerEmployeeRating[] = ['D', 'C', 'B', 'A', 'S'];
  const statuses: CustomerEmployeeStatus[] = ['空闲', '指名待命', '服务中', '被其他客人指名', '休息'];
  const contacts: CustomerContactStatus[] = ['未添加', '可请求', '已添加'];
  const online: CustomerOnlineStatus[] = ['在线', '忙碌', '离线'];
  const rating = text(source.评级, base.评级) as CustomerEmployeeRating;
  const status = text(source.状态, base.状态) as CustomerEmployeeStatus;
  const contact = text(source.联系状态, base.联系状态) as CustomerContactStatus;
  const onlineStatus = text(source.在线状态, base.在线状态) as CustomerOnlineStatus;
  return {
    姓名: text(source.姓名, name) || name,
    评级: ratings.includes(rating) ? rating : base.评级,
    区域: text(source.区域, base.区域),
    状态: statuses.includes(status) ? status : base.状态,
    每日指名费: Math.max(0, Math.round(finiteNumber(source.每日指名费, base.每日指名费))),
    好感度: clamp(Math.round(finiteNumber(source.好感度, base.好感度)), 0, 100),
    信任度: clamp(Math.round(finiteNumber(source.信任度, base.信任度)), 0, 100),
    联系状态: contacts.includes(contact) ? contact : base.联系状态,
    在线状态: online.includes(onlineStatus) ? onlineStatus : base.在线状态,
    互动次数: Math.max(0, Math.round(finiteNumber(source.互动次数, base.互动次数))),
    服务次数: Math.max(0, Math.round(finiteNumber(source.服务次数, base.服务次数))),
    额外服务次数: Math.max(0, Math.round(finiteNumber(source.额外服务次数, base.额外服务次数))),
    私下邀约次数: Math.max(0, Math.round(finiteNumber(source.私下邀约次数, base.私下邀约次数))),
    最近互动: text(source.最近互动, base.最近互动),
    标签: Array.isArray(source.标签) ? source.标签.filter(item => typeof item === 'string').slice(0, 8) : clone(base.标签),
    说明: text(source.说明, base.说明) === 'Nhân thiết lập chi tiết đang chờ bổ sung.' ? '' : text(source.说明, base.说明),
    擅长项目: Array.isArray(source.擅长项目) ? source.擅长项目.filter(item => typeof item === 'string').slice(0, 12) : clone(base.擅长项目),
  };
}

function normalizeProject(name: string, value: unknown, fallback?: CustomerProject): CustomerProject {
  const source = asRecord(value);
  const base = fallback ?? { 名称: name, 价格: 800, 时长分钟: 60, 区域: '前台大厅', 开放: true, 标签: [], 说明: '' };
  return {
    名称: text(source.名称, name) || name,
    价格: Math.max(0, Math.round(finiteNumber(source.价格, base.价格))),
    时长分钟: clamp(Math.round(finiteNumber(source.时长分钟, base.时长分钟)), 15, 720),
    区域: text(source.区域, base.区域),
    开放: typeof source.开放 === 'boolean' ? source.开放 : base.开放,
    标签: Array.isArray(source.标签) ? source.标签.filter(item => typeof item === 'string').slice(0, 8) : clone(base.标签),
    说明: text(source.说明, base.说明),
  };
}

function normalizeConversation(name: string, value: unknown): CustomerConversation {
  const source = asRecord(value);
  const messages = Array.isArray(source.消息) ? source.消息 : [];
  return {
    员工: name,
    未读: Math.max(0, Math.round(finiteNumber(source.未读, 0))),
    消息: messages.slice(-MAX_CONTACT_MESSAGES).map((item, index) => {
      const message = asRecord(item);
      return {
        id: text(message.id, `message-${index}`),
        发送者: text(message.发送者, '用户'),
        内容: text(message.内容),
        日期: text(message.日期),
        时间: text(message.时间),
        已读: typeof message.已读 === 'boolean' ? message.已读 : true,
      };
    }).filter(message => message.内容),
  };
}

export function makeCustomerPageState(date = new Date(), femaleUser = false): CustomerPageState {
  return makeBaseCustomerState(date, femaleUser);
}

export function cloneCustomerPageState(state: CustomerPageState): CustomerPageState {
  return clone(state);
}

export function normalizeCustomerPageState(value: unknown): CustomerPageState {
  const source = asRecord(value);
  const femaleUser = source.女性限定角色可见 === true;
  const base = makeBaseCustomerState(new Date(), femaleUser);
  const sourceEmployees = asRecord(source.员工);
  const sourceProjects = asRecord(source.项目);
  const sourceAreas = asRecord(source.区域);
  const employees: Record<string, CustomerEmployee> = {};
  const employeeNames = new Set([...Object.keys(base.员工), ...Object.keys(sourceEmployees)]);
  employeeNames.forEach(name => {
    if (!isTangquanCharacterAllowed(name, femaleUser) && findTangquanCharacter(name)) {
      return;
    }
    employees[name] = normalizeEmployee(name, sourceEmployees[name], base.员工[name]);
  });
  const projects: Record<string, CustomerProject> = {};
  const projectNames = new Set([...Object.keys(base.项目), ...Object.keys(sourceProjects)]);
  projectNames.forEach(name => {
    projects[name] = normalizeProject(name, sourceProjects[name], base.项目[name]);
  });
  const areas: Record<string, CustomerArea> = {};
  const areaNames = new Set([...Object.keys(base.区域), ...Object.keys(sourceAreas)]);
  areaNames.forEach(name => {
    const raw = asRecord(sourceAreas[name]);
    const fallback = base.区域[name] ?? { 名称: name, 说明: '', 开放: true };
    areas[name] = {
      名称: text(raw.名称, name) || name,
      说明: text(raw.说明, fallback.说明),
      开放: typeof raw.开放 === 'boolean' ? raw.开放 : fallback.开放,
    };
  });
  const contacts: Record<string, CustomerConversation> = {};
  const sourceContacts = asRecord(source.联系人);
  Object.keys(sourceContacts).forEach(name => {
    if (employees[name]) {
      contacts[name] = normalizeConversation(name, sourceContacts[name]);
    }
  });
  Object.values(employees).forEach(employee => {
    if (employee.联系状态 === '已添加' && !contacts[employee.姓名]) {
      contacts[employee.姓名] = { 员工: employee.姓名, 未读: 0, 消息: [] };
    }
  });
  const staySource = asRecord(source.住宿);
  const stayStatus: CustomerStayStatus = staySource.状态 === '住宿中' ? '住宿中' : '未住宿';
  const nominationSource = asRecord(source.当前指名);
  const nominationEmployee = text(nominationSource.员工);
  const legacyNomination = nominationEmployee && employees[nominationEmployee]
    ? {
        员工: nominationEmployee,
        总天数: clamp(Math.round(finiteNumber(nominationSource.总天数, 1)), 1, 30),
        剩余天数: clamp(Math.round(finiteNumber(nominationSource.剩余天数, 1)), 1, 30),
        每日费用: Math.max(0, Math.round(finiteNumber(nominationSource.每日费用, employees[nominationEmployee].每日指名费))),
        已付费用: Math.max(0, Math.round(finiteNumber(nominationSource.已付费用, 0))),
        开始日: Math.max(1, Math.round(finiteNumber(nominationSource.开始日, 1))),
      }
    : null;
  const nominationList = Array.isArray(source.指名) ? source.指名 : [];
  const nominations = nominationList
    .map(item => {
      const raw = asRecord(item);
      const employeeName = text(raw.员工);
      if (!employeeName || !employees[employeeName]) return null;
      return {
        员工: employeeName,
        总天数: clamp(Math.round(finiteNumber(raw.总天数, 1)), 1, 30),
        剩余天数: clamp(Math.round(finiteNumber(raw.剩余天数, 1)), 1, 30),
        每日费用: Math.max(0, Math.round(finiteNumber(raw.每日费用, employees[employeeName].每日指名费))),
        已付费用: Math.max(0, Math.round(finiteNumber(raw.已付费用, 0))),
        开始日: Math.max(1, Math.round(finiteNumber(raw.开始日, 1))),
      } satisfies CustomerNomination;
    })
    .filter((item): item is CustomerNomination => Boolean(item));
  if (legacyNomination && !nominations.some(item => item.员工 === legacyNomination.员工)) {
    nominations.unshift(legacyNomination);
  }
  const uniqueNominations = [...new Map(nominations.map(item => [item.员工, item])).values()];
  const currentNomination = legacyNomination
    ? uniqueNominations.find(item => item.员工 === legacyNomination.员工) ?? uniqueNominations[0] ?? null
    : uniqueNominations[0] ?? null;
  const serviceSource = asRecord(source.当前服务);
  const serviceProject = text(serviceSource.项目);
  const serviceEmployee = text(serviceSource.员工);
  const currentService = serviceProject && serviceEmployee && projects[serviceProject] && employees[serviceEmployee]
    ? {
        id: text(serviceSource.id, 'service-restored'),
        项目: serviceProject,
        员工: serviceEmployee,
        区域: text(serviceSource.区域, projects[serviceProject].区域),
        价格: Math.max(0, Math.round(finiteNumber(serviceSource.价格, projects[serviceProject].价格))),
        时长分钟: clamp(Math.round(finiteNumber(serviceSource.时长分钟, projects[serviceProject].时长分钟)), 15, 720),
        状态: serviceSource.状态 === '进行中' ? '进行中' as const : '已预约' as const,
        开始时间: text(serviceSource.开始时间, text(source.时间, base.时间)),
      }
    : null;
  const dialogueSource = asRecord(source.对话);
  const dialoguePages = Array.isArray(dialogueSource.台词页)
    ? dialogueSource.台词页.map(item => {
        const page = asRecord(item);
        return { speaker: text(page.speaker), text: text(page.text) };
      }).filter(page => page.text).slice(0, 80)
    : clone(base.对话.台词页);
  const transactions = Array.isArray(source.消费流水) ? source.消费流水 : [];
  const result: CustomerPageState = {
    version: 1,
    日期: text(source.日期, base.日期),
    日序: Math.max(1, Math.round(finiteNumber(source.日序, 1))),
    时间: /^\d{1,2}:\d{2}$/.test(text(source.时间)) ? text(source.时间) : base.时间,
    时间控制: normalizeTangquanTimeControlState(source.时间控制),
    地点: text(source.地点, base.地点),
    资金: Math.max(0, Math.round(finiteNumber(source.资金, base.资金))),
    到店次数: Math.max(1, Math.round(finiteNumber(source.到店次数, base.到店次数))),
    到店状态: stayStatus === '住宿中' ? '住宿中' : '临时到店',
    住宿: {
      状态: stayStatus,
      房型: stayStatus === '住宿中' ? text(staySource.房型, '简易客房') : '',
      剩余天数: stayStatus === '住宿中' ? clamp(Math.round(finiteNumber(staySource.剩余天数, 1)), 1, 30) : 0,
      每日房费: stayStatus === '住宿中' ? Math.max(0, Math.round(finiteNumber(staySource.每日房费, 1_800))) : 0,
    },
    指名: uniqueNominations,
    当前指名: currentNomination,
    当前服务: currentService,
    今日员工: (Array.isArray(source.今日员工) ? source.今日员工 : base.今日员工)
      .filter((name): name is string => typeof name === 'string' && Boolean(employees[name]))
      .slice(0, 8),
    女性限定角色可见: femaleUser,
    区域: areas,
    员工: employees,
    项目: projects,
    联系人: contacts,
    消费流水: transactions.slice(-MAX_TRANSACTIONS).map((item, index) => {
      const entry = asRecord(item);
      const type = text(entry.类型, '项目') as CustomerTransaction['类型'];
      return {
        id: text(entry.id, `transaction-${index}`),
        日期: text(entry.日期),
        时间: text(entry.时间),
        类型: ['住宿', '指名', '项目', '打赏'].includes(type) ? type : '项目',
        名称: text(entry.名称),
        金额: Math.max(0, Math.round(finiteNumber(entry.金额, 0))),
        余额: Math.max(0, Math.round(finiteNumber(entry.余额, 0))),
      };
    }),
    今日记录: Array.isArray(source.今日记录) ? source.今日记录.filter(item => typeof item === 'string').slice(-MAX_DAILY_LOGS) : clone(base.今日记录),
    对话: {
      说话人: text(dialogueSource.说话人, dialoguePages[0]?.speaker || base.对话.说话人),
      台词页: dialoguePages.length > 0 ? dialoguePages : clone(base.对话.台词页),
      当前页: clamp(Math.round(finiteNumber(dialogueSource.当前页, 0)), 0, Math.max(0, dialoguePages.length - 1)),
      最近正文: text(dialogueSource.最近正文),
    },
    随机种子: Math.max(1, Math.round(finiteNumber(source.随机种子, base.随机种子))) >>> 0,
  };
  if (result.今日员工.length === 0) {
    result.今日员工 = makeDailyEmployeeNames(Object.values(result.员工), result.日期);
  }
  result.指名.forEach(nomination => {
    if (!result.今日员工.includes(nomination.员工)) result.今日员工.push(nomination.员工);
    result.员工[nomination.员工].状态 = '指名待命';
  });
  if (result.当前服务?.状态 === '进行中') {
    result.员工[result.当前服务.员工].状态 = '服务中';
  }
  return result;
}

export function setCustomerFemaleUser(state: CustomerPageState, femaleUser: boolean): CustomerPageState {
  const next = cloneCustomerPageState(state);
  if (next.女性限定角色可见 === femaleUser) {
    return normalizeCustomerPageState(next);
  }
  next.女性限定角色可见 = femaleUser;

  for (const character of listTangquanCharacters(true)) {
    const allowed = isTangquanCharacterAllowed(character.name, femaleUser);
    if (allowed && !next.员工[character.name]) {
      next.员工[character.name] = makeCatalogEmployee(character);
      continue;
    }
    if (allowed || !next.员工[character.name]) {
      continue;
    }
    if (next.当前服务?.员工 === character.name) {
      next.当前服务 = null;
    }
    next.指名 = next.指名.filter(nomination => nomination.员工 !== character.name);
    if (next.当前指名?.员工 === character.name) next.当前指名 = next.指名[0] ?? null;
    delete next.联系人[character.name];
    delete next.员工[character.name];
  }

  next.今日员工 = makeDailyEmployeeNames(Object.values(next.员工), next.日期);
  next.指名.forEach(nomination => {
    if (!next.今日员工.includes(nomination.员工)) next.今日员工.push(nomination.员工);
  });
  applyDailyEmployeeSchedule(next);
  return normalizeCustomerPageState(next);
}

export function getCustomerRelationshipStage(employee: CustomerEmployee): string {
  const score = Math.round(employee.好感度 * 0.6 + employee.信任度 * 0.4);
  if (score >= 85) return 'Thân mật';
  if (score >= 65) return 'Mập mờ';
  if (score >= 40) return 'Gần gũi';
  if (score >= 20) return 'Quen thuộc';
  return 'Mới quen';
}

export function getCustomerExtraAcceptance(employee: CustomerEmployee): { score: number; label: string } {
  const score = clamp(Math.round(employee.好感度 * 0.48 + employee.信任度 * 0.42 + Math.min(10, employee.服务次数 * 2)), 0, 100);
  const label = score >= 80 ? 'Rất dễ chấp nhận' : score >= 60 ? 'Khá dễ chấp nhận' : score >= 40 ? 'Cần có bước đệm' : score >= 20 ? 'Khá thận trọng' : 'Tạm thời còn xa lạ';
  return { score, label };
}

export function getCustomerCurrentEmployee(state: CustomerPageState, preferred = ''): CustomerEmployee | null {
  if (preferred && state.员工[preferred]) return state.员工[preferred];
  if (state.当前服务 && state.员工[state.当前服务.员工]) return state.员工[state.当前服务.员工];
  if (state.当前指名 && state.员工[state.当前指名.员工]) return state.员工[state.当前指名.员工];
  const nominated = state.指名.find(item => state.员工[item.员工]);
  if (nominated) return state.员工[nominated.员工];
  const todayEmployees = state.今日员工.map(name => state.员工[name]).filter(Boolean);
  return todayEmployees.find(employee => employee.区域 === state.地点 && employee.状态 !== '休息') ?? todayEmployees[0] ?? null;
}

export function listCustomerAvailableEmployees(state: CustomerPageState, projectName = ''): CustomerEmployee[] {
  return Object.values(state.员工).filter(employee => {
    if (state.指名.some(nomination => nomination.员工 === employee.姓名)) return true;
    if (!state.今日员工.includes(employee.姓名)) return false;
    if (employee.状态 === '休息' || employee.状态 === '被其他客人指名' || employee.状态 === '服务中') return false;
    return !projectName || employee.擅长项目.includes(projectName);
  });
}

function success(state: CustomerPageState, message: string): CustomerMutationResult {
  return { ok: true, message, state: normalizeCustomerPageState(state) };
}

function failure(state: CustomerPageState, message: string): CustomerMutationResult {
  return { ok: false, message, state: cloneCustomerPageState(state) };
}

function addDailyLog(state: CustomerPageState, message: string): void {
  state.今日记录 = [...state.今日记录, message].slice(-MAX_DAILY_LOGS);
}

function spend(state: CustomerPageState, type: CustomerTransaction['类型'], name: string, amount: number): boolean {
  const cost = Math.max(0, Math.round(amount));
  if (state.资金 < cost) return false;
  state.资金 -= cost;
  state.消费流水.push({
    id: makeId('money', state), 日期: state.日期, 时间: state.时间, 类型: type, 名称: name, 金额: cost, 余额: state.资金,
  });
  state.消费流水 = state.消费流水.slice(-MAX_TRANSACTIONS);
  state.随机种子 = nextSeed(state.随机种子);
  return true;
}

export function advanceCustomerTime(state: CustomerPageState, minutes: number): CustomerPageState {
  const next = cloneCustomerPageState(state);
  next.时间 = fromMinutes(toMinutes(next.时间) + Math.max(0, minutes));
  return normalizeCustomerPageState(next);
}

export function applyCustomerTimeText(state: CustomerPageState, value: string): CustomerPageState {
  const next = cloneCustomerPageState(state);
  const dateMatch = /Ngày (\d{1,2}) tháng (\d{1,2}) năm (\d{4})/.exec(value);
  const timeMatch = /(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?:\D|$)/.exec(value);
  if (dateMatch) {
    next.日期 = formatDate(new Date(Number(dateMatch[3]), Number(dateMatch[2]) - 1, Number(dateMatch[1])));
  }
  if (timeMatch) {
    next.时间 = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }
  return normalizeCustomerPageState(next);
}

export function applyCustomerManualTimeTarget(
  state: CustomerPageState,
  targetTime: string,
  transition: { fromDate: string; crossesMidnight: boolean },
): CustomerMutationResult {
  const normalizedTime = normalizeTangquanClock(targetTime);
  if (!normalizedTime) return failure(state, 'Thời gian mục tiêu không hợp lệ, vui lòng chọn lại');
  const next = cloneCustomerPageState(state);
  next.时间 = normalizedTime;
  next.时间控制 = recordTangquanTimeTravel(next.时间控制, {
    fromDate: transition.fromDate,
    toDate: next.日期,
    targetTime: normalizedTime,
    crossesMidnight: transition.crossesMidnight,
  });
  return success(next, `Thời gian đã tiến đến ${normalizedTime}`);
}

export function travelCustomerArea(state: CustomerPageState, areaName: string): CustomerMutationResult {
  const area = state.区域[areaName];
  if (!area || !area.开放) return failure(state, 'Khu vực này hiện chưa thể đến');
  if (state.当前服务?.状态 === '进行中') return failure(state, 'Dịch vụ hiện tại chưa kết thúc');
  const next = advanceCustomerTime(state, state.地点 === areaName ? 0 : 15);
  next.地点 = areaName;
  addDailyLog(next, `Đến ${areaName}.`);
  return success(next, state.地点 === areaName ? `Vẫn đang ở ${areaName}` : `Đã đến ${areaName}`);
}

export function checkInCustomerStay(state: CustomerPageState, roomName: string, days: number): CustomerMutationResult {
  if (state.住宿.状态 === '住宿中') return failure(state, 'Hiện đã làm thủ tục lưu trú');
  const room = CUSTOMER_ROOM_OPTIONS.find(option => option.名称 === roomName);
  if (!room) return failure(state, 'Không tìm thấy loại phòng này');
  const normalizedDays = clamp(Math.round(days), 1, 7);
  const total = room.每日房费 * normalizedDays;
  const next = cloneCustomerPageState(state);
  if (!spend(next, '住宿', `${room.名称} ${normalizedDays} ngày`, total)) return failure(state, 'Không đủ tiền, không thể làm thủ tục lưu trú');
  next.住宿 = { 状态: '住宿中', 房型: room.名称, 剩余天数: normalizedDays, 每日房费: room.每日房费 };
  next.到店状态 = '住宿中';
  next.地点 = '简易客房';
  addDailyLog(next, `Đã làm thủ tục ${room.名称}, tổng cộng ${normalizedDays} ngày.`);
  return success(next, `Đã làm thủ tục lưu trú ${normalizedDays} ngày`);
}

export function checkOutCustomerStay(state: CustomerPageState): CustomerMutationResult {
  if (state.住宿.状态 !== '住宿中') return failure(state, 'Hiện không có lưu trú');
  if (state.当前服务?.状态 === '进行中') return failure(state, 'Vui lòng kết thúc dịch vụ hiện tại trước');
  const next = cloneCustomerPageState(state);
  next.指名.forEach(nomination => {
    if (next.员工[nomination.员工]) next.员工[nomination.员工].状态 = '空闲';
  });
  next.指名 = [];
  next.当前指名 = null;
  next.住宿 = { 状态: '未住宿', 房型: '', 剩余天数: 0, 每日房费: 0 };
  next.到店状态 = '临时到店';
  next.地点 = '前台大厅';
  addDailyLog(next, 'Đã làm thủ tục trả phòng, chỉ định xuyên ngày cũng kết thúc theo.');
  return success(next, 'Đã trả phòng');
}

export function nominateCustomerEmployee(state: CustomerPageState, employeeName: string, requestedDays?: number): CustomerMutationResult {
  const employee = state.员工[employeeName];
  if (!employee) return failure(state, 'Không tìm thấy nhân viên này');
  if (!isTangquanCharacterAllowed(employeeName, state.女性限定角色可见)) {
    return failure(state, `${employeeName} không nhận chỉ định từ khách nam`);
  }
  if (state.指名.some(nomination => nomination.员工 === employeeName)) return failure(state, `${employeeName} đã có trong danh sách chỉ định`);
  if (employee.状态 === '休息' || employee.状态 === '被其他客人指名' || employee.状态 === '服务中') return failure(state, `${employeeName} hiện không thể nhận chỉ định`);
  const maximumDays = state.住宿.状态 === '住宿中' ? state.住宿.剩余天数 : 1;
  const days = clamp(Math.round(requestedDays ?? maximumDays), 1, maximumDays);
  const total = employee.每日指名费 * days;
  const next = cloneCustomerPageState(state);
  if (!spend(next, '指名', `${employeeName} ${days} ngày`, total)) return failure(state, 'Không đủ tiền, không thể hoàn tất chỉ định');
  const nomination = { 员工: employeeName, 总天数: days, 剩余天数: days, 每日费用: employee.每日指名费, 已付费用: total, 开始日: next.日序 };
  next.指名.push(nomination);
  next.当前指名 = nomination;
  next.员工[employeeName].状态 = '指名待命';
  addDailyLog(next, `Đã chỉ định ${employeeName}, kéo dài ${days} ngày.`);
  return success(next, `Đã chỉ định ${employeeName}`);
}

export function endCustomerNomination(state: CustomerPageState, employeeName = state.当前指名?.员工 ?? ''): CustomerMutationResult {
  if (!employeeName || !state.指名.some(nomination => nomination.员工 === employeeName)) return failure(state, 'Hiện không có nhân viên chỉ định này');
  if (state.当前服务?.状态 === '进行中') return failure(state, 'Vui lòng kết thúc dịch vụ hiện tại trước');
  const next = cloneCustomerPageState(state);
  if (next.员工[employeeName]) next.员工[employeeName].状态 = '空闲';
  next.指名 = next.指名.filter(nomination => nomination.员工 !== employeeName);
  next.当前指名 = next.指名[0] ?? null;
  addDailyLog(next, `Đã kết thúc chỉ định với ${employeeName}, phí đã trả không hoàn lại.`);
  return success(next, 'Chỉ định đã kết thúc');
}

export function bookCustomerService(state: CustomerPageState, projectName: string, employeeName: string): CustomerMutationResult {
  const project = state.项目[projectName];
  const employee = state.员工[employeeName];
  if (!project || !project.开放) return failure(state, 'Dự án này hiện chưa thể đặt lịch');
  if (!employee) return failure(state, 'Không tìm thấy nhân viên này');
  if (state.当前服务) return failure(state, 'Hiện đã có một lịch dịch vụ được sắp xếp');
  if (projectName === '住宿陪同' && state.住宿.状态 !== '住宿中') return failure(state, 'Dự án này chỉ mở cho khách lưu trú');
  const nominated = state.指名.some(nomination => nomination.员工 === employeeName);
  if (!nominated && (employee.状态 === '休息' || employee.状态 === '被其他客人指名' || employee.状态 === '服务中')) return failure(state, `${employeeName} hiện không có thời gian trống`);
  if (!employee.擅长项目.includes(projectName)) return failure(state, `${employeeName} hôm nay không phụ trách dự án này`);
  const next = cloneCustomerPageState(state);
  if (!spend(next, '项目', `${projectName} · ${employeeName}`, project.价格)) return failure(state, 'Không đủ tiền, không thể đặt lịch dự án này');
  next.当前服务 = {
    id: makeId('service', next), 项目: projectName, 员工: employeeName, 区域: project.区域, 价格: project.价格,
    时长分钟: project.时长分钟, 状态: '已预约', 开始时间: next.时间,
  };
  next.地点 = project.区域;
  next.员工[employeeName].区域 = project.区域;
  next.员工[employeeName].状态 = '指名待命';
  addDailyLog(next, `Đã đặt lịch ${projectName} với ${employeeName}.`);
  return success(next, 'Dịch vụ đã được đặt lịch');
}

export function startCustomerService(state: CustomerPageState): CustomerMutationResult {
  if (!state.当前服务) return failure(state, 'Hiện không có dịch vụ đã đặt lịch');
  if (state.当前服务.状态 === '进行中') return failure(state, 'Dịch vụ đã bắt đầu');
  const next = cloneCustomerPageState(state);
  next.当前服务!.状态 = '进行中';
  next.当前服务!.开始时间 = next.时间;
  next.地点 = next.当前服务!.区域;
  next.员工[next.当前服务!.员工].区域 = next.当前服务!.区域;
  next.员工[next.当前服务!.员工].状态 = '服务中';
  addDailyLog(next, `${next.当前服务!.项目} bắt đầu.`);
  return success(next, 'Dịch vụ đã bắt đầu');
}

export function finishCustomerService(state: CustomerPageState): CustomerMutationResult {
  if (!state.当前服务 || state.当前服务.状态 !== '进行中') return failure(state, 'Hiện không có dịch vụ đang diễn ra');
  const next = cloneCustomerPageState(state);
  const service = clone(next.当前服务!);
  const employee = next.员工[service.员工];
  employee.服务次数 += 1;
  employee.互动次数 += 1;
  employee.好感度 = clamp(employee.好感度 + 2, 0, 100);
  employee.信任度 = clamp(employee.信任度 + 1, 0, 100);
  employee.最近互动 = `Đã hoàn thành ${service.项目}.`;
  if (employee.联系状态 === '未添加' && employee.好感度 >= 20 && employee.信任度 >= 12) {
    employee.联系状态 = '可请求';
  }
  employee.状态 = next.指名.some(nomination => nomination.员工 === employee.姓名) ? '指名待命' : '空闲';
  const currentMinutes = toMinutes(next.时间);
  const startMinutes = toMinutes(service.开始时间);
  const elapsedMinutes = (currentMinutes - startMinutes + 24 * 60) % (24 * 60);
  next.时间 = fromMinutes(currentMinutes + Math.max(0, service.时长分钟 - elapsedMinutes));
  next.当前服务 = null;
  addDailyLog(next, `${service.项目} đã kết thúc, ${employee.姓名} đã hoàn thành lượt phục vụ này.`);
  return success(next, 'Dịch vụ đã kết thúc');
}

export function tipCustomerEmployee(state: CustomerPageState, employeeName: string, amount: number): CustomerMutationResult {
  const employee = state.员工[employeeName];
  const normalized = Math.max(100, Math.round(amount / 100) * 100);
  if (!employee) return failure(state, 'Không tìm thấy nhân viên này');
  const next = cloneCustomerPageState(state);
  if (!spend(next, '打赏', employeeName, normalized)) return failure(state, 'Không đủ tiền, không thể hoàn tất tặng thưởng');
  next.员工[employeeName].好感度 = clamp(next.员工[employeeName].好感度 + Math.min(4, Math.max(1, Math.floor(normalized / 500))), 0, 100);
  next.员工[employeeName].最近互动 = `Nhận được một khoản tặng thưởng ${normalized} đồng.`;
  addDailyLog(next, `Đã tặng thưởng ${normalized} đồng cho ${employeeName}.`);
  return success(next, 'Tặng thưởng đã hoàn tất');
}

export function setCustomerDialoguePages(
  state: CustomerPageState,
  pages: { speaker: string; text: string }[],
  fallbackSpeaker: string,
  fallbackText: string,
): CustomerPageState {
  const next = cloneCustomerPageState(state);
  const cleanPages = pages
    .filter(page => page.text.trim())
    .map(page => ({ speaker: page.speaker.trim() || fallbackSpeaker, text: page.text.trim() }))
    .slice(0, 80);
  next.对话.台词页 = cleanPages.length > 0 ? cleanPages : [{ speaker: fallbackSpeaker, text: fallbackText.trim() || 'Đối phương tạm thời không nói tiếp.' }];
  next.对话.当前页 = 0;
  next.对话.说话人 = next.对话.台词页[0].speaker || fallbackSpeaker;
  return normalizeCustomerPageState(next);
}

export function nextCustomerDialoguePage(state: CustomerPageState): CustomerPageState {
  const next = cloneCustomerPageState(state);
  if (next.对话.台词页.length > 1) {
    next.对话.当前页 = (next.对话.当前页 + 1) % next.对话.台词页.length;
    next.对话.说话人 = next.对话.台词页[next.对话.当前页]?.speaker || next.对话.说话人;
  }
  return normalizeCustomerPageState(next);
}

export function previousCustomerDialoguePage(state: CustomerPageState): CustomerPageState {
  const next = cloneCustomerPageState(state);
  if (next.对话.台词页.length > 1) {
    next.对话.当前页 = (next.对话.当前页 - 1 + next.对话.台词页.length) % next.对话.台词页.length;
    next.对话.说话人 = next.对话.台词页[next.对话.当前页]?.speaker || next.对话.说话人;
  }
  return normalizeCustomerPageState(next);
}

export function setCustomerStory(state: CustomerPageState, story: string): CustomerPageState {
  const next = cloneCustomerPageState(state);
  next.对话.最近正文 = story.trim().slice(0, 24_000);
  return normalizeCustomerPageState(next);
}

export function applyCustomerRelationshipUpdate(
  state: CustomerPageState,
  employeeName: string,
  update: Record<string, unknown>,
  allowRollback = false,
): CustomerPageState {
  if (!state.员工[employeeName]) return cloneCustomerPageState(state);
  const next = cloneCustomerPageState(state);
  const employee = next.员工[employeeName];
  employee.好感度 = clamp(Math.round(finiteNumber(update.好感度, employee.好感度)), 0, 100);
  employee.信任度 = clamp(Math.round(finiteNumber(update.信任度, employee.信任度)), 0, 100);
  const applyCount = (value: unknown, current: number) => {
    const incoming = Math.max(0, Math.round(finiteNumber(value, current)));
    return allowRollback ? incoming : Math.max(current, incoming);
  };
  employee.互动次数 = applyCount(update.互动次数, employee.互动次数);
  employee.服务次数 = applyCount(update.服务次数, employee.服务次数);
  employee.额外服务次数 = applyCount(update.额外服务次数, employee.额外服务次数);
  employee.私下邀约次数 = applyCount(update.私下邀约次数, employee.私下邀约次数);
  employee.最近互动 = text(update.最近互动, employee.最近互动);
  const contact = text(update.联系状态) as CustomerContactStatus;
  const contactOrder: CustomerContactStatus[] = ['未添加', '可请求', '已添加'];
  if (contactOrder.includes(contact)) {
    const incomingIndex = contactOrder.indexOf(contact);
    const currentIndex = contactOrder.indexOf(employee.联系状态);
    if (allowRollback || incomingIndex >= currentIndex) employee.联系状态 = contact;
  }
  if (employee.联系状态 === '未添加' && employee.好感度 >= 20 && employee.信任度 >= 12) employee.联系状态 = '可请求';
  if (employee.联系状态 === '已添加' && !next.联系人[employeeName]) {
    next.联系人[employeeName] = { 员工: employeeName, 未读: 0, 消息: [] };
  }
  return normalizeCustomerPageState(next);
}

export function appendCustomerMessage(
  state: CustomerPageState,
  employeeName: string,
  sender: '用户' | string,
  content: string,
  unread = false,
): CustomerPageState {
  const next = cloneCustomerPageState(state);
  if (!next.员工[employeeName]) return next;
  if (!next.联系人[employeeName]) next.联系人[employeeName] = { 员工: employeeName, 未读: 0, 消息: [] };
  next.联系人[employeeName].消息.push({
    id: makeId('message', next), 发送者: sender, 内容: content.trim().slice(0, 4_000), 日期: next.日期, 时间: next.时间, 已读: !unread,
  });
  next.联系人[employeeName].消息 = next.联系人[employeeName].消息.slice(-MAX_CONTACT_MESSAGES);
  if (unread) next.联系人[employeeName].未读 += 1;
  next.随机种子 = nextSeed(next.随机种子);
  return normalizeCustomerPageState(next);
}

export function updateCustomerMessageContent(
  state: CustomerPageState,
  employeeName: string,
  messageId: string,
  content: string,
): CustomerPageState {
  const next = cloneCustomerPageState(state);
  const message = next.联系人[employeeName]?.消息.find(item => item.id === messageId);
  if (!message) return next;
  message.内容 = content.trim().slice(0, 4_000);
  return normalizeCustomerPageState(next);
}

export function removeCustomerMessages(
  state: CustomerPageState,
  employeeName: string,
  messageIds: string[],
): CustomerPageState {
  const next = cloneCustomerPageState(state);
  const conversation = next.联系人[employeeName];
  if (!conversation || messageIds.length === 0) return next;
  const removedIds = new Set(messageIds);
  conversation.消息 = conversation.消息.filter(message => !removedIds.has(message.id));
  conversation.未读 = conversation.消息.filter(message => !message.已读).length;
  return normalizeCustomerPageState(next);
}

export function markCustomerConversationRead(state: CustomerPageState, employeeName: string): CustomerPageState {
  const next = cloneCustomerPageState(state);
  const conversation = next.联系人[employeeName];
  if (!conversation) return next;
  conversation.未读 = 0;
  conversation.消息.forEach(message => { message.已读 = true; });
  return normalizeCustomerPageState(next);
}

export function refreshCustomerDailySchedule(state: CustomerPageState): CustomerPageState {
  const next = cloneCustomerPageState(state);
  next.今日员工 = makeDailyEmployeeNames(Object.values(next.员工), next.日期);
  next.指名.forEach(nomination => {
    if (!next.今日员工.includes(nomination.员工)) next.今日员工.push(nomination.员工);
  });
  applyDailyEmployeeSchedule(next);
  next.随机种子 = nextSeed(next.随机种子);
  return normalizeCustomerPageState(next);
}

export function restCustomerToNextDay(state: CustomerPageState): CustomerMutationResult {
  if (state.当前服务?.状态 === '进行中') return failure(state, 'Vui lòng kết thúc dịch vụ hiện tại trước');
  let next = cloneCustomerPageState(state);
  next.日期 = addDateDays(next.日期, 1);
  next.日序 += 1;
  next.时间 = '09:00';
  next.当前服务 = null;
  next.今日记录 = [];
  if (next.住宿.状态 === '住宿中') {
    next.住宿.剩余天数 -= 1;
    if (next.住宿.剩余天数 <= 0) {
      next.住宿 = { 状态: '未住宿', 房型: '', 剩余天数: 0, 每日房费: 0 };
      next.到店状态 = '临时到店';
      next.地点 = '前台大厅';
    }
  }
  next.指名 = next.指名
    .map(nomination => ({ ...nomination, 剩余天数: nomination.剩余天数 - 1 }))
    .filter(nomination => {
      const expired = nomination.剩余天数 <= 0 || (next.住宿.状态 !== '住宿中' && nomination.总天数 > 1);
      if (expired && next.员工[nomination.员工]) next.员工[nomination.员工].状态 = '空闲';
      return !expired;
    });
  next.当前指名 = next.指名.find(item => item.员工 === next.当前指名?.员工) ?? next.指名[0] ?? null;
  next.到店次数 += 1;
  addDailyLog(next, 'Một ngày mới bắt đầu, lịch làm việc và trạng thái có thể đặt lịch của nhân viên đã được làm mới.');
  next = refreshCustomerDailySchedule(next);
  return success(next, 'Đã nghỉ đến ngày hôm sau');
}

export function makeCustomerAreaEntryContent(state: CustomerPageState): string {
  const area = state.区域[state.地点];
  const employees = Object.values(state.员工).filter(employee => employee.区域 === state.地点 && employee.状态 !== '休息').map(employee => employee.姓名);
  const projects = Object.values(state.项目).filter(project => project.开放 && project.区域 === state.地点).map(project => project.名称);
  return `<当前区域>\n名称: ${state.地点}\n在场员工: ${employees.join('、') || '无'}\n可用项目: ${projects.join('、') || '无'}\n说明: ${area?.说明 ?? ''}\n</当前区域>`;
}

export function makeCustomerEmployeeEntryContent(employee: CustomerEmployee): string {
  return `<当前员工>\n姓名: ${employee.姓名}\n评级: ${employee.评级}\n所在地: ${employee.区域}\n当前状态: ${employee.状态}\n好感度: ${employee.好感度}\n信任度: ${employee.信任度}\n关系阶段: ${getCustomerRelationshipStage(employee)}\n联系方式: ${employee.联系状态}\n最近互动: ${employee.最近互动}\n</当前员工>`;
}

export function makeCustomerEmployeesEntryContent(employees: CustomerEmployee[]): string {
  return employees.map(makeCustomerEmployeeEntryContent).join('\n\n');
}

export function makeCustomerProjectEntryContent(project: CustomerProject): string {
  return `<当前项目>\n名称: ${project.名称}\n价格: ${project.价格}\n时长: ${project.时长分钟}分钟\n地点: ${project.区域}\n说明: ${project.说明}\n</当前项目>`;
}
