import {
  makeTangquanTimeControlState,
  normalizeTangquanClock,
  normalizeTangquanTimeControlState,
  recordTangquanTimeTravel,
  type TangquanTimeControlState,
} from './timeTravel';

export type WaiterGrade = 'D' | 'C' | 'B' | 'A' | 'S';

export type WaiterMenuView =
  | 'shift'
  | 'service'
  | 'nomination'
  | 'growth'
  | 'finance'
  | 'rating'
  | 'investment'
  | 'log';

export type WaiterWorkStatus = '未上班' | '待岗' | '休息中' | '接客中' | '被指名' | '已下班';
export type WaiterAssignmentStatus = '待接待' | '进行中' | '已完成' | '已错过';
export type WaiterGuestSource = '普通客' | '回头客' | '指名客';
export type WaiterGuestGenerationSource = 'ai' | 'fallback' | 'migrated';
export type WaiterLedgerKind = '日薪' | '打赏' | '指名费' | '额外服务' | '生活费' | '恢复' | '个人投入';
export type WaiterInvestmentKey = '标准服务培训' | '沟通训练' | '形象打理' | '生活品质' | '生活目标';
export type WaiterRecoveryKey = '餐食与休息' | '身体护理';

export type WaiterGrowthRecord = {
  标准服务: {
    完成次数: number;
    礼貌拒绝次数: number;
    好评次数: number;
  };
  擦边记录: {
    胸部接触次数: number;
    大腿接触次数: number;
    隔衣摩擦次数: number;
  };
  性服务记录: {
    手交次数: number;
    口交次数: number;
    阴道性交次数: number;
    肛交次数: number;
    多人性服务次数: number;
  };
  保持记录: {
    阴道未插入: boolean;
    肛门未插入: boolean;
    未发生性服务: boolean;
  };
};

export type WaiterSkillSummary = {
  标准服务: number;
  沟通应对: number;
  手部服务: number;
  口部服务: number;
  阴道服务: number;
  肛门服务: number;
  多人服务: number;
};

export type WaiterGuest = {
  id: string;
  name: string;
  gender: string;
  species: string;
  origin: string;
  budget: number;
  projectPreferences: string[];
  source: WaiterGuestSource;
  returning: boolean;
  nominated: boolean;
  nominationRemainingDays: number;
  notes: string;
};

export type WaiterGuestGenerationState = {
  dateIso: string;
  attempted: boolean;
  source: WaiterGuestGenerationSource;
  issues: string[];
};

export type WaiterAssignment = {
  id: string;
  time: string;
  timeControl: TangquanTimeControlState;
  guestId: string;
  guest: string;
  source: WaiterGuestSource;
  project: string;
  area: string;
  durationMinutes: number;
  nominationDays: number;
  status: WaiterAssignmentStatus;
  opening: string;
};

export type WaiterAssignmentFact = {
  assignmentId: string;
  time: string;
  guestId: string;
  guest: string;
  gender: string;
  species: string;
  source: WaiterGuestSource;
  project: string;
  area: string;
  durationMinutes: number;
  status: WaiterAssignmentStatus;
};

export type WaiterCurrentService = {
  assignmentId: string;
  startedAt: string;
  resultBaseline: WaiterGrowthRecord;
};

export type WaiterNomination = {
  guestId: string;
  guest: string;
  remainingDays: number;
  project: string;
  area: string;
};

export type WaiterLedgerEntry = {
  id: string;
  date: string;
  kind: WaiterLedgerKind;
  amount: number;
  note: string;
};

export type WaiterDailyMoney = {
  日薪: number;
  打赏: number;
  指名费: number;
  额外服务: number;
};

export type WaiterDailySettlement = {
  date: string;
  income: number;
  expense: number;
  net: number;
  services: number;
  averageScore: number;
  grade: WaiterGrade;
};

export type WaiterDialogueState = {
  speaker: string;
  text: string;
};

export type WaiterPageState = {
  version: 2;
  dateIso: string;
  dateText: string;
  time: string;
  dayIndex: number;
  location: string;
  balance: number;
  grade: WaiterGrade;
  ratingPoints: number;
  dailySalary: number;
  stamina: number;
  maxStamina: number;
  workStatus: WaiterWorkStatus;
  freeRestUsed: boolean;
  shift: {
    name: string;
    start: string;
    end: string;
    area: string;
  };
  guests: Record<string, WaiterGuest>;
  dailyGuestIds: string[];
  guestGeneration: WaiterGuestGenerationState;
  assignments: WaiterAssignment[];
  currentService: WaiterCurrentService | null;
  activeNominations: WaiterNomination[];
  activeNomination: WaiterNomination | null;
  growth: WaiterGrowthRecord;
  skills: WaiterSkillSummary;
  evaluation: {
    reviewCount: number;
    totalScore: number;
    averageScore: number;
    goodReviewCount: number;
    nominationCount: number;
  };
  investments: Record<WaiterInvestmentKey, number>;
  todayIncome: WaiterDailyMoney;
  todayExpense: number;
  ledger: WaiterLedgerEntry[];
  latestSettlement: WaiterDailySettlement | null;
  shiftNote: string;
  dialogue: WaiterDialogueState;
  logs: string[];
};

export type WaiterMutationResult = {
  ok: boolean;
  message: string;
  state: WaiterPageState;
};

export type WaiterServiceOutcome = {
  score?: number;
  note?: string;
};

export type WaiterInvestmentOption = {
  key: WaiterInvestmentKey | WaiterRecoveryKey;
  kind: 'investment' | 'recovery';
  title: string;
  description: string;
  maxLevel?: number;
};

type GradeRule = {
  salary: number;
  nominationFee: number;
  points: number;
  services: number;
  average: number;
};

const GRADE_ORDER: WaiterGrade[] = ['D', 'C', 'B', 'A', 'S'];
const MAX_ACTIVE_NOMINATIONS = 4;
const MAX_GUEST_REGISTRY_SIZE = 720;

export const WAITER_GRADE_RULES: Record<WaiterGrade, GradeRule> = {
  D: { salary: 600, nominationFee: 300, points: 0, services: 0, average: 0 },
  C: { salary: 850, nominationFee: 450, points: 100, services: 8, average: 3.6 },
  B: { salary: 1200, nominationFee: 650, points: 300, services: 24, average: 3.9 },
  A: { salary: 1700, nominationFee: 900, points: 700, services: 60, average: 4.2 },
  S: { salary: 2400, nominationFee: 1300, points: 1600, services: 120, average: 4.5 },
};

export const WAITER_INVESTMENT_OPTIONS: WaiterInvestmentOption[] = [
  {
    key: '餐食与休息',
    kind: 'recovery',
    title: 'Ăn uống và nghỉ ngơi',
    description: 'Tốn ít chi phí, hồi phục ngay 28 điểm thể lực.',
  },
  {
    key: '身体护理',
    kind: 'recovery',
    title: 'Chăm sóc cơ thể',
    description: 'Hồi phục ngay 60 điểm thể lực, phù hợp sau khi tiếp đón liên tục.',
  },
  {
    key: '标准服务培训',
    kind: 'investment',
    title: 'Đào tạo dịch vụ tiêu chuẩn',
    description: 'Tăng vĩnh viễn độ thành thạo dịch vụ tiêu chuẩn, tối đa cấp 8.',
    maxLevel: 8,
  },
  {
    key: '沟通训练',
    kind: 'investment',
    title: 'Huấn luyện giao tiếp',
    description: 'Tăng vĩnh viễn khả năng giao tiếp và ứng biến, tối đa cấp 8.',
    maxLevel: 8,
  },
  {
    key: '形象打理',
    kind: 'investment',
    title: 'Chăm chút hình ảnh',
    description: 'Tăng nhẹ cơ hội được khách quen và khách chỉ định chọn, tối đa cấp 6.',
    maxLevel: 6,
  },
  {
    key: '生活品质',
    kind: 'investment',
    title: 'Chất lượng cuộc sống',
    description: 'Tăng giới hạn thể lực và hồi phục mỗi ngày, nhưng sẽ tăng chi phí sinh hoạt hàng ngày, tối đa cấp 5.',
    maxLevel: 5,
  },
  {
    key: '生活目标',
    kind: 'investment',
    title: 'Mục tiêu sống dài hạn',
    description: 'Từ chỗ ở thoải mái đến dự trữ dài hạn, cung cấp mục tiêu tài chính lớn cho giai đoạn trung và hậu kỳ, tối đa cấp 4.',
    maxLevel: 4,
  },
];

export const WAITER_PROJECT_CATALOG = [
  { project: '入浴休憩', area: '室内大浴场', duration: 90 },
  { project: '休息区陪同', area: '榻榻米休息室', duration: 90 },
  { project: '香柚汤护理', area: '简易包间', duration: 120 },
  { project: '理疗按摩', area: '按摩室', duration: 120 },
  { project: '包间休憩', area: '简易包间', duration: 150 },
  { project: '住宿陪同', area: '简易客房', duration: 180 },
] as const;

type WaiterFallbackGuestSeed = Omit<
  WaiterGuest,
  'id' | 'source' | 'returning' | 'nominated' | 'nominationRemainingDays'
>;

const FALLBACK_GUEST_SEEDS: Record<'male' | 'female' | 'other', WaiterFallbackGuestSeed[]> = {
  male: [
    {
      name: 'Trần Nghiễn',
      gender: 'Nam',
      species: 'Con người',
      origin: 'Khu thương mại địa phương',
      budget: 3600,
      projectPreferences: ['理疗按摩', '入浴休憩'],
      notes: 'Đến quán sau giờ làm, thích sắp xếp yên tĩnh.',
    },
    {
      name: 'Noah',
      gender: 'Nam',
      species: 'Người rồng',
      origin: 'Khu mới ven biển',
      budget: 5200,
      projectPreferences: ['香柚汤护理', '包间休憩'],
      notes: 'Thân nhiệt hơi cao, muốn tránh bồn tắm quá nóng.',
    },
    {
      name: 'Lục Văn Xuyên',
      gender: 'Nam',
      species: 'Thú nhân',
      origin: 'Trung tâm thể thao phía Bắc thành phố',
      budget: 4200,
      projectPreferences: ['理疗按摩', '休息区陪同'],
      notes: 'Có nhu cầu hồi phục rõ ràng sau khi vận động.',
    },
  ],
  female: [
    {
      name: 'Lâm Chi',
      gender: 'Nữ',
      species: 'Tinh linh',
      origin: 'Khu phố Ngắm Hoa',
      budget: 4800,
      projectPreferences: ['香柚汤护理', '住宿陪同'],
      notes: 'Nhạy cảm với mùi hương, thích tông thảo mộc nhẹ nhàng.',
    },
    {
      name: 'Tô Diêu',
      gender: 'Nữ',
      species: 'Con người',
      origin: 'Chuyến du lịch ngắn từ nơi khác',
      budget: 3000,
      projectPreferences: ['入浴休憩', '休息区陪同'],
      notes: 'Lần đầu đến quán, muốn tìm hiểu các dự án cơ bản trước.',
    },
    {
      name: 'Sầm Vũ',
      gender: 'Nữ',
      species: 'Yêu tinh',
      origin: 'Khu dân cư Đom Đóm',
      budget: 5600,
      projectPreferences: ['包间休憩', '香柚汤护理'],
      notes: 'Thích ánh sáng dịu và trò chuyện nhỏ nhẹ.',
    },
  ],
  other: [
    {
      name: 'Milo',
      gender: 'Vô tính',
      species: 'Tộc búp bê',
      origin: 'Khu thủ công trung tâm',
      budget: 4000,
      projectPreferences: ['入浴休憩', '理疗按摩'],
      notes: 'Nhu cầu bảo dưỡng khớp khá cao, tránh kéo giãn đột ngột.',
    },
    {
      name: 'An Lan',
      gender: 'Phi nhị nguyên',
      species: 'Tộc slime',
      origin: 'Khu dân cư Vịnh Sông',
      budget: 3400,
      projectPreferences: ['包间休憩', '休息区陪同'],
      notes: 'Cơ thể mềm mại, cường độ dự án cần xác nhận tại chỗ.',
    },
    {
      name: 'Tinh Thùy',
      gender: 'Lưỡng tính',
      species: 'Ma tộc',
      origin: 'Chợ đêm phố cổ',
      budget: 6200,
      projectPreferences: ['住宿陪同', '香柚汤护理'],
      notes: 'Sinh hoạt về đêm, thích đặt lịch khung giờ muộn.',
    },
  ],
};

const EXTRA_INCOME_RATES = {
  胸部接触次数: 40,
  大腿接触次数: 35,
  隔衣摩擦次数: 65,
  手交次数: 130,
  口交次数: 190,
  阴道性交次数: 320,
  肛交次数: 360,
  多人性服务次数: 480,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hashSeed(seed: number): number {
  const x = Math.sin(seed * 999.91) * 43758.5453;
  return x - Math.floor(x);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function clockMinutes(time: string): number {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

function formatClockMinutes(value: number): string {
  const normalized = ((Math.round(value) % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
}

function formatDate(date: Date): string {
  const week = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][date.getDay()];
  return `Ngày ${pad(date.getDate())} tháng ${pad(date.getMonth() + 1)} năm ${date.getFullYear()}, ${week}`;
}

function makeDateIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDay(dateIso: string): Date {
  const date = new Date(`${dateIso}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return date;
}

function makeGrowthRecord(): WaiterGrowthRecord {
  return {
    标准服务: { 完成次数: 0, 礼貌拒绝次数: 0, 好评次数: 0 },
    擦边记录: { 胸部接触次数: 0, 大腿接触次数: 0, 隔衣摩擦次数: 0 },
    性服务记录: { 手交次数: 0, 口交次数: 0, 阴道性交次数: 0, 肛交次数: 0, 多人性服务次数: 0 },
    保持记录: { 阴道未插入: true, 肛门未插入: true, 未发生性服务: true },
  };
}

function sanitizeCount(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function cleanGuestText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';
}

function hashGuestText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function makeLegacyWaiterGuestId(name: string): string {
  const normalized = cleanGuestText(name, 40).toLocaleLowerCase() || 'unknown';
  return `guest-legacy-${hashGuestText(normalized)}`;
}

function normalizeGuestId(value: unknown, fallbackName: string): string {
  const candidate = cleanGuestText(value, 64).toLocaleLowerCase();
  return /^[a-z0-9][a-z0-9_-]{2,63}$/.test(candidate) ? candidate : makeLegacyWaiterGuestId(fallbackName);
}

export function normalizeWaiterGuest(value: unknown, fallbackName = ''): WaiterGuest | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Partial<WaiterGuest>;
  const name = cleanGuestText(source.name, 40) || cleanGuestText(fallbackName, 40);
  if (!name) return null;
  const projectNames = new Set<string>(WAITER_PROJECT_CATALOG.map(project => project.project));
  const projectPreferences = Array.isArray(source.projectPreferences)
    ? [
        ...new Set(
          source.projectPreferences.map(item => cleanGuestText(item, 40)).filter(item => projectNames.has(item)),
        ),
      ].slice(0, 6)
    : [];
  const nominated = source.nominated === true || source.source === '指名客';
  const returning = source.returning === true || source.source === '回头客';
  const guestSource: WaiterGuestSource = nominated ? '指名客' : returning ? '回头客' : '普通客';
  return {
    id: normalizeGuestId(source.id, name),
    name,
    gender: cleanGuestText(source.gender, 20) || 'Chưa rõ',
    species: cleanGuestText(source.species, 20) || 'Con người',
    origin: cleanGuestText(source.origin, 40) || 'Địa phương',
    budget: clamp(Math.round(Number(source.budget) || 0), 0, 1_000_000),
    projectPreferences,
    source: guestSource,
    returning,
    nominated,
    nominationRemainingDays: nominated ? clamp(sanitizeCount(source.nominationRemainingDays), 1, 365) : 0,
    notes: cleanGuestText(source.notes, 120),
  };
}

function normalizeWaiterNomination(value: unknown): WaiterNomination | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Partial<WaiterNomination>;
  const guest = typeof source.guest === 'string' ? source.guest.trim().slice(0, 40) : '';
  const project = typeof source.project === 'string' ? source.project.trim().slice(0, 40) : '';
  const area = typeof source.area === 'string' ? source.area.trim().slice(0, 40) : '';
  const remainingDays = clamp(sanitizeCount(source.remainingDays), 0, 365);
  if (!guest || !project || !area || remainingDays <= 0) return null;
  return { guestId: normalizeGuestId(source.guestId, guest), guest, remainingDays, project, area };
}

function syncWaiterNominationAlias(state: WaiterPageState): void {
  const unique = new Map<string, WaiterNomination>();
  state.activeNominations.forEach(value => {
    const nomination = normalizeWaiterNomination(value);
    if (nomination && !unique.has(nomination.guestId)) unique.set(nomination.guestId, nomination);
  });
  state.activeNominations = [...unique.values()].slice(0, MAX_ACTIVE_NOMINATIONS);
  state.activeNomination = state.activeNominations[0] ? clone(state.activeNominations[0]) : null;
}

export function normalizeWaiterGrowthRecord(value: unknown): WaiterGrowthRecord {
  const source = value && typeof value === 'object' ? (value as Record<string, any>) : {};
  const standard = source.标准服务 ?? {};
  const edge = source.擦边记录 ?? {};
  const sexual = source.性服务记录 ?? {};
  const keep = source.保持记录 ?? {};
  return {
    标准服务: {
      完成次数: sanitizeCount(standard.完成次数),
      礼貌拒绝次数: sanitizeCount(standard.礼貌拒绝次数),
      好评次数: sanitizeCount(standard.好评次数),
    },
    擦边记录: {
      胸部接触次数: sanitizeCount(edge.胸部接触次数),
      大腿接触次数: sanitizeCount(edge.大腿接触次数),
      隔衣摩擦次数: sanitizeCount(edge.隔衣摩擦次数),
    },
    性服务记录: {
      手交次数: sanitizeCount(sexual.手交次数),
      口交次数: sanitizeCount(sexual.口交次数),
      阴道性交次数: sanitizeCount(sexual.阴道性交次数),
      肛交次数: sanitizeCount(sexual.肛交次数),
      多人性服务次数: sanitizeCount(sexual.多人性服务次数),
    },
    保持记录: {
      阴道未插入: keep.阴道未插入 !== false,
      肛门未插入: keep.肛门未插入 !== false,
      未发生性服务: keep.未发生性服务 !== false,
    },
  };
}

export function calculateWaiterSkills(
  growth: WaiterGrowthRecord,
  investments: Record<WaiterInvestmentKey, number>,
): WaiterSkillSummary {
  const standard = growth.标准服务;
  const edge = growth.擦边记录;
  const sexual = growth.性服务记录;
  return {
    标准服务: clamp(
      Math.round(12 + investments.标准服务培训 * 9 + standard.完成次数 * 1.4 + standard.好评次数 * 0.6),
      0,
      100,
    ),
    沟通应对: clamp(
      Math.round(10 + investments.沟通训练 * 9 + standard.礼貌拒绝次数 * 1.8 + standard.好评次数 * 0.4),
      0,
      100,
    ),
    手部服务: clamp(Math.round(sexual.手交次数 * 7 + edge.隔衣摩擦次数 * 0.8), 0, 100),
    口部服务: clamp(Math.round(sexual.口交次数 * 8), 0, 100),
    阴道服务: clamp(Math.round(sexual.阴道性交次数 * 9), 0, 100),
    肛门服务: clamp(Math.round(sexual.肛交次数 * 9), 0, 100),
    多人服务: clamp(Math.round(sexual.多人性服务次数 * 11), 0, 100),
  };
}

type WaiterFallbackDay = {
  assignments: WaiterAssignment[];
  guests: Record<string, WaiterGuest>;
  dailyGuestIds: string[];
};

function normalizeGuestRegistry(value: unknown): Record<string, WaiterGuest> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([id, guest]) => normalizeWaiterGuest({ ...(guest as Record<string, unknown>), id }, id))
    .filter((guest): guest is WaiterGuest => Boolean(guest))
    .slice(-MAX_GUEST_REGISTRY_SIZE);
  return Object.fromEntries(entries.map(guest => [guest.id, guest]));
}

function makeFallbackDay(
  dayIndex: number,
  grade: WaiterGrade,
  imageLevel: number,
  activeNominations: WaiterNomination[],
  existingGuests: Record<string, WaiterGuest>,
): WaiterFallbackDay {
  const baseDesiredCount = grade === 'A' || grade === 'S' ? 4 : 3;
  const shiftStartMinutes = 18 * 60;
  const shiftEndMinutes = 24 * 60;
  const shortestProjectMinutes = Math.min(...WAITER_PROJECT_CATALOG.map(project => project.duration));
  const gradeIndex = GRADE_ORDER.indexOf(grade);
  const nominationChance = clamp(0.06 + gradeIndex * 0.07 + imageLevel * 0.035, 0.06, 0.58);
  const assignments: WaiterAssignment[] = [];
  const guests = normalizeGuestRegistry(existingGuests);
  let cursorMinutes = shiftStartMinutes;

  const nominationQueue = activeNominations
    .map(normalizeWaiterNomination)
    .filter((nomination): nomination is WaiterNomination => Boolean(nomination))
    .slice(0, MAX_ACTIVE_NOMINATIONS);
  for (const activeNomination of nominationQueue) {
    const activeProject = WAITER_PROJECT_CATALOG.find(project => project.project === activeNomination.project);
    const durationMinutes = activeProject?.duration ?? shortestProjectMinutes;
    if (cursorMinutes + durationMinutes > shiftEndMinutes) continue;
    assignments.push({
      id: `assignment-${dayIndex}-${assignments.length + 1}`,
      time: formatClockMinutes(cursorMinutes),
      guestId: activeNomination.guestId,
      guest: activeNomination.guest,
      source: '指名客',
      project: activeNomination.project,
      area: activeNomination.area,
      durationMinutes,
      nominationDays: activeNomination.remainingDays,
      status: '待接待',
      opening: 'Khách chỉ định đã đến quán đúng giờ hẹn, đang chờ được tiếp đón hôm nay.',
    });
    const existingGuest = guests[activeNomination.guestId];
    guests[activeNomination.guestId] = normalizeWaiterGuest(
      {
        ...(existingGuest ?? {}),
        id: activeNomination.guestId,
        name: activeNomination.guest,
        projectPreferences: [activeNomination.project, ...(existingGuest?.projectPreferences ?? [])],
        source: '指名客',
        nominated: true,
        nominationRemainingDays: activeNomination.remainingDays,
      },
      activeNomination.guest,
    ) ?? {
      id: activeNomination.guestId,
      name: activeNomination.guest,
      gender: 'Chưa rõ',
      species: 'Con người',
      origin: 'Save cũ',
      budget: 0,
      projectPreferences: [activeNomination.project],
      source: '指名客',
      returning: false,
      nominated: true,
      nominationRemainingDays: activeNomination.remainingDays,
      notes: '',
    };
    cursorMinutes += durationMinutes;
  }

  const desiredCount = Math.max(baseDesiredCount, assignments.length);
  const feasibleCount = Math.min(
    desiredCount,
    assignments.length + Math.floor((shiftEndMinutes - cursorMinutes) / shortestProjectMinutes),
  );
  const activeNominationGuestIds = new Set(nominationQueue.map(item => item.guestId));
  const genderGroups: Array<keyof typeof FALLBACK_GUEST_SEEDS> = ['male', 'female', 'other'];
  while (assignments.length < feasibleCount) {
    const index = assignments.length;
    const slotsAfterCurrent = feasibleCount - index - 1;
    const maxDuration = shiftEndMinutes - cursorMinutes - slotsAfterCurrent * shortestProjectMinutes;
    const availableProjects = WAITER_PROJECT_CATALOG.filter(project => project.duration <= maxDuration);
    if (availableProjects.length === 0) break;
    const project = availableProjects[Math.floor(hashSeed(dayIndex * 31 + index * 17) * availableProjects.length)];
    const preferredGenderGroup = genderGroups[(index - nominationQueue.length) % genderGroups.length];
    const usedNames = new Set(assignments.map(assignment => assignment.guest));
    const preferredCandidates = FALLBACK_GUEST_SEEDS[preferredGenderGroup]
      .map((seed, seedIndex) => ({ group: preferredGenderGroup, seed, seedIndex }))
      .filter(candidate => !usedNames.has(candidate.seed.name));
    const seedCandidates =
      preferredCandidates.length > 0
        ? preferredCandidates
        : genderGroups
            .filter(group => group !== preferredGenderGroup)
            .flatMap(group => FALLBACK_GUEST_SEEDS[group].map((seed, seedIndex) => ({ group, seed, seedIndex })))
            .filter(candidate => !usedNames.has(candidate.seed.name));
    const candidateIndex = Math.floor(hashSeed(dayIndex * 41 + index * 23) * seedCandidates.length);
    const selectedSeed = seedCandidates[candidateIndex] ?? {
      group: preferredGenderGroup,
      seed: FALLBACK_GUEST_SEEDS[preferredGenderGroup][0],
      seedIndex: 0,
    };
    const { group: genderGroup, seed, seedIndex: seededGuestIndex } = selectedSeed;
    const guestId = `guest-fallback-d${dayIndex}-${genderGroup}-${seededGuestIndex + 1}`;
    const sourceRoll = hashSeed(dayIndex * 59 + index * 29);
    const generatedNominationCount = assignments.filter(
      item => item.source === '指名客' && !activeNominationGuestIds.has(item.guestId),
    ).length;
    const nominated =
      nominationQueue.length + generatedNominationCount < MAX_ACTIVE_NOMINATIONS && sourceRoll < nominationChance;
    const returning = !nominated && sourceRoll < nominationChance + 0.3;
    const nominationDays = nominated ? (hashSeed(dayIndex * 73 + index) > 0.72 ? 2 : 1) : 0;
    const source: WaiterGuestSource = nominated ? '指名客' : returning ? '回头客' : '普通客';
    const guest: WaiterGuest = {
      ...seed,
      id: guestId,
      projectPreferences: [...new Set([project.project, ...seed.projectPreferences])],
      source,
      returning,
      nominated,
      nominationRemainingDays: nominationDays,
    };
    guests[guestId] = guest;
    assignments.push({
      id: `assignment-${dayIndex}-${index + 1}`,
      time: formatClockMinutes(cursorMinutes),
      guestId,
      guest: guest.name,
      source,
      project: project.project,
      area: project.area,
      durationMinutes: project.duration,
      nominationDays,
      status: '待接待',
      opening: 'Khách đã đến khu vực đã đặt lịch, đang chờ được tiếp đón.',
    });
    cursorMinutes += project.duration;
  }
  return { assignments, guests, dailyGuestIds: assignments.map(assignment => assignment.guestId) };
}

function totalIncome(income: WaiterDailyMoney): number {
  return income.日薪 + income.打赏 + income.指名费 + income.额外服务;
}

function addLedger(state: WaiterPageState, kind: WaiterLedgerKind, amount: number, note: string): void {
  state.ledger.unshift({
    id: `ledger-${state.dayIndex}-${state.ledger.length + 1}-${kind}`,
    date: state.dateText,
    kind,
    amount,
    note,
  });
  state.ledger = state.ledger.slice(0, 240);
}

function addLog(state: WaiterPageState, message: string): void {
  state.logs.unshift(`${state.dateText} ${state.time} · ${message}`);
  state.logs = state.logs.slice(0, 120);
}

function markGrowthConsistency(growth: WaiterGrowthRecord): void {
  if (growth.性服务记录.阴道性交次数 > 0) {
    growth.保持记录.阴道未插入 = false;
  }
  if (growth.性服务记录.肛交次数 > 0) {
    growth.保持记录.肛门未插入 = false;
  }
  if (Object.values(growth.性服务记录).some(value => value > 0)) {
    growth.保持记录.未发生性服务 = false;
  }
}

function getGrowthDelta(current: WaiterGrowthRecord, baseline: WaiterGrowthRecord): WaiterGrowthRecord {
  const delta = makeGrowthRecord();
  delta.标准服务.完成次数 = Math.max(0, current.标准服务.完成次数 - baseline.标准服务.完成次数);
  delta.标准服务.礼貌拒绝次数 = Math.max(0, current.标准服务.礼貌拒绝次数 - baseline.标准服务.礼貌拒绝次数);
  delta.标准服务.好评次数 = Math.max(0, current.标准服务.好评次数 - baseline.标准服务.好评次数);
  for (const key of Object.keys(delta.擦边记录) as Array<keyof WaiterGrowthRecord['擦边记录']>) {
    delta.擦边记录[key] = Math.max(0, current.擦边记录[key] - baseline.擦边记录[key]);
  }
  for (const key of Object.keys(delta.性服务记录) as Array<keyof WaiterGrowthRecord['性服务记录']>) {
    delta.性服务记录[key] = Math.max(0, current.性服务记录[key] - baseline.性服务记录[key]);
  }
  return delta;
}

function getExtraIncome(delta: WaiterGrowthRecord): number {
  let amount = 0;
  for (const [key, rate] of Object.entries(EXTRA_INCOME_RATES)) {
    const edgeValue = delta.擦边记录[key as keyof WaiterGrowthRecord['擦边记录']];
    const sexualValue = delta.性服务记录[key as keyof WaiterGrowthRecord['性服务记录']];
    amount += (edgeValue ?? sexualValue ?? 0) * rate;
  }
  return amount;
}

function getResultIntensity(delta: WaiterGrowthRecord): number {
  return (
    delta.标准服务.完成次数 * 1 +
    delta.标准服务.礼貌拒绝次数 * 1 +
    Object.values(delta.擦边记录).reduce((sum, value) => sum + value, 0) * 1 +
    Object.values(delta.性服务记录).reduce((sum, value) => sum + value, 0) * 2
  );
}

function tryPromote(state: WaiterPageState): WaiterGrade | null {
  const currentIndex = GRADE_ORDER.indexOf(state.grade);
  const nextGrade = GRADE_ORDER[currentIndex + 1];
  if (!nextGrade) {
    return null;
  }
  const rule = WAITER_GRADE_RULES[nextGrade];
  if (
    state.ratingPoints < rule.points ||
    state.evaluation.reviewCount < rule.services ||
    state.evaluation.averageScore < rule.average
  ) {
    return null;
  }
  state.grade = nextGrade;
  state.dailySalary = rule.salary;
  return nextGrade;
}

export function makeWaiterPageState(now = new Date()): WaiterPageState {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const investments: Record<WaiterInvestmentKey, number> = {
    标准服务培训: 0,
    沟通训练: 0,
    形象打理: 0,
    生活品质: 0,
    生活目标: 0,
  };
  const growth = makeGrowthRecord();
  const state: WaiterPageState = {
    version: 2,
    dateIso: makeDateIso(date),
    dateText: formatDate(date),
    time: '17:30',
    timeControl: makeTangquanTimeControlState(),
    dayIndex: 1,
    location: '员工休息室',
    balance: 1200,
    grade: 'D',
    ratingPoints: 0,
    dailySalary: WAITER_GRADE_RULES.D.salary,
    stamina: 100,
    maxStamina: 100,
    workStatus: '未上班',
    freeRestUsed: false,
    shift: { name: '晚班', start: '18:00', end: '00:00', area: '室内大浴场' },
    guests: {},
    dailyGuestIds: [],
    guestGeneration: { dateIso: makeDateIso(date), attempted: false, source: 'fallback', issues: [] },
    assignments: [],
    currentService: null,
    activeNominations: [],
    activeNomination: null,
    growth,
    skills: calculateWaiterSkills(growth, investments),
    evaluation: { reviewCount: 0, totalScore: 0, averageScore: 0, goodReviewCount: 0, nominationCount: 0 },
    investments,
    todayIncome: { 日薪: 0, 打赏: 0, 指名费: 0, 额外服务: 0 },
    todayExpense: 0,
    ledger: [],
    latestSettlement: null,
    shiftNote: 'Sắp xếp ca tối hôm nay đã được xác nhận, chỉ cần hoàn thành phục vụ theo thứ tự tiếp đón.',
    dialogue: {
      speaker: 'Trưởng ca',
      text: 'Ca tối chưa bắt đầu. Hãy xác nhận sắp xếp hôm nay trước, đến giờ thì ra vị trí làm việc.',
    },
    logs: [],
  };
  const fallbackDay = makeFallbackDay(state.dayIndex, state.grade, 0, [], {});
  state.assignments = fallbackDay.assignments;
  state.guests = fallbackDay.guests;
  state.dailyGuestIds = fallbackDay.dailyGuestIds;
  addLog(state, 'Ca làm và lịch tiếp đón hôm nay đã được xác nhận.');
  return state;
}

export function cloneWaiterPageState(state: WaiterPageState): WaiterPageState {
  return clone(state);
}

export function hasAttemptedWaiterGuestGeneration(state: WaiterPageState): boolean {
  return state.guestGeneration.dateIso === state.dateIso && state.guestGeneration.attempted;
}

export function markWaiterGuestGenerationFallback(state: WaiterPageState, issues: string[] = []): WaiterPageState {
  const next = cloneWaiterPageState(state);
  next.guestGeneration = {
    dateIso: next.dateIso,
    attempted: true,
    source: 'fallback',
    issues: issues
      .map(issue => cleanGuestText(issue, 160))
      .filter(Boolean)
      .slice(0, 20),
  };
  return next;
}

export function normalizeWaiterPageState(value: unknown): WaiterPageState {
  const fallback = makeWaiterPageState();
  if (!value || typeof value !== 'object') {
    return fallback;
  }
  const source = clone(value as Partial<WaiterPageState>);
  const sourceVersion = Number(source.version) || 1;
  const state = { ...fallback, ...source } as WaiterPageState;
  state.version = 2;
  state.timeControl = normalizeTangquanTimeControlState(source.timeControl);
  state.grade = GRADE_ORDER.includes(state.grade) ? state.grade : 'D';
  state.balance = Math.max(0, Math.round(Number(state.balance) || 0));
  state.ratingPoints = Math.max(0, Math.round(Number(state.ratingPoints) || 0));
  state.growth = normalizeWaiterGrowthRecord(state.growth);
  state.investments = { ...fallback.investments, ...(state.investments ?? {}) };
  for (const key of Object.keys(state.investments) as WaiterInvestmentKey[]) {
    state.investments[key] = Math.max(0, Math.floor(Number(state.investments[key]) || 0));
  }
  state.maxStamina = clamp(100 + state.investments.生活品质 * 6 + state.investments.生活目标 * 8, 80, 170);
  state.stamina = clamp(Math.round(Number(state.stamina) || 0), 0, state.maxStamina);
  state.skills = calculateWaiterSkills(state.growth, state.investments);
  state.dailySalary = WAITER_GRADE_RULES[state.grade]?.salary ?? WAITER_GRADE_RULES.D.salary;
  state.todayIncome = { ...fallback.todayIncome, ...(state.todayIncome ?? {}) };
  state.evaluation = { ...fallback.evaluation, ...(state.evaluation ?? {}) };
  state.guests = normalizeGuestRegistry(source.guests);
  state.assignments = Array.isArray(state.assignments)
    ? state.assignments
        .map((assignment, index) => {
          const guest = cleanGuestText(assignment?.guest, 40);
          const project = cleanGuestText(assignment?.project, 40);
          const area = cleanGuestText(assignment?.area, 40);
          if (!guest || !project || !area) return null;
          const guestId = normalizeGuestId(assignment?.guestId, guest);
          const sourceType: WaiterGuestSource = ['普通客', '回头客', '指名客'].includes(String(assignment?.source))
            ? assignment.source
            : '普通客';
          const normalizedAssignment: WaiterAssignment = {
            id: cleanGuestText(assignment?.id, 64) || `assignment-${state.dayIndex}-${index + 1}`,
            time: /^\d{2}:\d{2}$/.test(String(assignment?.time))
              ? String(assignment.time)
              : formatClockMinutes(18 * 60 + index * 90),
            guestId,
            guest,
            source: sourceType,
            project,
            area,
            durationMinutes: clamp(sanitizeCount(assignment?.durationMinutes), 30, 360),
            nominationDays: sourceType === '指名客' ? clamp(sanitizeCount(assignment?.nominationDays), 1, 365) : 0,
            status: ['待接待', '进行中', '已完成', '已错过'].includes(String(assignment?.status))
              ? assignment.status
              : '待接待',
            opening: cleanGuestText(assignment?.opening, 80) || 'Khách đã đến khu vực đã đặt lịch, đang chờ được tiếp đón.',
          };
          const existingGuest = state.guests[guestId];
          state.guests[guestId] = normalizeWaiterGuest(
            {
              ...(existingGuest ?? {}),
              id: guestId,
              name: guest,
              projectPreferences: [project, ...(existingGuest?.projectPreferences ?? [])],
              source: sourceType,
              returning: sourceType === '回头客' || existingGuest?.returning === true,
              nominated: sourceType === '指名客',
              nominationRemainingDays: normalizedAssignment.nominationDays,
              gender: existingGuest?.gender || (/小姐|女士/.test(guest) ? 'Nữ' : 'Chưa rõ'),
              origin: existingGuest?.origin || (sourceVersion < 2 ? 'Save cũ' : 'Địa phương'),
            },
            guest,
          ) as WaiterGuest;
          return normalizedAssignment;
        })
        .filter((assignment): assignment is WaiterAssignment => Boolean(assignment))
    : clone(fallback.assignments);
  state.assignments.forEach(assignment => {
    if (state.guests[assignment.guestId]) return;
    state.guests[assignment.guestId] = clone(
      fallback.guests[assignment.guestId] ?? {
        id: assignment.guestId,
        name: assignment.guest,
        gender: /小姐|女士/.test(assignment.guest) ? 'Nữ' : 'Chưa rõ',
        species: 'Con người',
        origin: sourceVersion < 2 ? 'Save cũ' : 'Địa phương',
        budget: 0,
        projectPreferences: [assignment.project],
        source: assignment.source,
        returning: assignment.source === '回头客',
        nominated: assignment.source === '指名客',
        nominationRemainingDays: assignment.nominationDays,
        notes: '',
      },
    );
  });
  const savedDailyGuestIds = Array.isArray(source.dailyGuestIds)
    ? [
        ...new Set(
          source.dailyGuestIds.filter((id): id is string => typeof id === 'string' && Boolean(state.guests[id])),
        ),
      ].slice(0, 12)
    : [];
  state.dailyGuestIds =
    savedDailyGuestIds.length === state.assignments.length
      ? savedDailyGuestIds
      : state.assignments.map(assignment => assignment.guestId);
  const generation = source.guestGeneration;
  state.guestGeneration = {
    dateIso: cleanGuestText(generation?.dateIso, 10) || state.dateIso,
    attempted: sourceVersion < 2 ? true : generation?.attempted === true,
    source:
      sourceVersion < 2 || !['ai', 'fallback', 'migrated'].includes(String(generation?.source))
        ? 'migrated'
        : generation.source,
    issues: Array.isArray(generation?.issues)
      ? generation.issues
          .map(issue => cleanGuestText(issue, 160))
          .filter(Boolean)
          .slice(0, 20)
      : [],
  };
  if (state.guestGeneration.dateIso !== state.dateIso) {
    state.guestGeneration = {
      dateIso: state.dateIso,
      attempted: false,
      source: 'fallback',
      issues: ['Ngày sinh khách hàng ngày không khớp với ngày hiện tại, đã đặt lại về dự phòng cục bộ'],
    };
  }
  state.shiftNote =
    typeof state.shiftNote === 'string' && state.shiftNote.trim()
      ? state.shiftNote.trim().slice(0, 120)
      : fallback.shiftNote;
  state.ledger = Array.isArray(state.ledger) ? state.ledger.slice(0, 240) : [];
  state.logs = Array.isArray(state.logs) ? state.logs.slice(0, 120) : [];
  const nominationSource = Array.isArray(source.activeNominations)
    ? source.activeNominations
    : source.activeNomination
      ? [source.activeNomination]
      : [];
  state.activeNominations = nominationSource
    .map(normalizeWaiterNomination)
    .filter((nomination): nomination is WaiterNomination => Boolean(nomination));
  syncWaiterNominationAlias(state);
  state.activeNominations.forEach(nomination => {
    const existingGuest = state.guests[nomination.guestId];
    state.guests[nomination.guestId] = normalizeWaiterGuest(
      {
        ...(existingGuest ?? {}),
        id: nomination.guestId,
        name: nomination.guest,
        projectPreferences: [nomination.project, ...(existingGuest?.projectPreferences ?? [])],
        source: '指名客',
        nominated: true,
        nominationRemainingDays: nomination.remainingDays,
        origin: existingGuest?.origin || 'Save cũ',
      },
      nomination.guest,
    ) as WaiterGuest;
  });
  markGrowthConsistency(state.growth);
  return state;
}

export function setWaiterDialogue(state: WaiterPageState, speaker: string, text: string): WaiterPageState {
  const next = clone(state);
  next.dialogue = { speaker, text };
  return next;
}

export function getWaiterTodayIncome(state: WaiterPageState): number {
  return totalIncome(state.todayIncome);
}

export function getWaiterCompletedServices(state: WaiterPageState): number {
  return state.assignments.filter(item => item.status === '已完成').length;
}

export function getWaiterNextGrade(state: WaiterPageState): WaiterGrade | null {
  return GRADE_ORDER[GRADE_ORDER.indexOf(state.grade) + 1] ?? null;
}

export function getWaiterGradeProgress(state: WaiterPageState): number {
  const nextGrade = getWaiterNextGrade(state);
  if (!nextGrade) {
    return 100;
  }
  const currentRule = WAITER_GRADE_RULES[state.grade];
  const nextRule = WAITER_GRADE_RULES[nextGrade];
  const pointsProgress = (state.ratingPoints - currentRule.points) / Math.max(1, nextRule.points - currentRule.points);
  const serviceProgress = state.evaluation.reviewCount / Math.max(1, nextRule.services);
  const averageProgress = nextRule.average === 0 ? 1 : state.evaluation.averageScore / nextRule.average;
  return clamp(Math.round(Math.min(pointsProgress, serviceProgress, averageProgress) * 100), 0, 100);
}

export function getWaiterLivingCost(state: WaiterPageState): number {
  const gradeBase: Record<WaiterGrade, number> = { D: 180, C: 260, B: 420, A: 700, S: 1100 };
  return gradeBase[state.grade] + state.investments.生活品质 * 80 + state.investments.生活目标 * 180;
}

export function getWaiterInvestmentCost(state: WaiterPageState, key: WaiterInvestmentKey | WaiterRecoveryKey): number {
  if (key === '餐食与休息') {
    return 80;
  }
  if (key === '身体护理') {
    return 260;
  }
  const level = state.investments[key];
  const bases: Record<WaiterInvestmentKey, number> = {
    标准服务培训: 600,
    沟通训练: 550,
    形象打理: 900,
    生活品质: 1800,
    生活目标: 20000,
  };
  if (key === '生活目标') {
    return [20_000, 60_000, 180_000, 500_000][level] ?? 500_000;
  }
  return Math.round((bases[key] * Math.pow(level + 1, 1.38)) / 10) * 10;
}

export function startWaiterShift(state: WaiterPageState): WaiterMutationResult {
  const next = clone(state);
  if (!['未上班', '休息中'].includes(next.workStatus)) {
    return { ok: false, message: 'Hiện không thể đến vị trí lặp lại.', state };
  }
  next.workStatus = '待岗';
  next.time = next.time < next.shift.start ? next.shift.start : next.time;
  next.location = next.shift.area;
  next.dialogue = { speaker: 'Trưởng ca', text: `Tối nay hãy đứng chờ ở ${next.shift.area} trước, hoàn thành tiếp đón theo thứ tự là được.` };
  addLog(next, `Đã đến vị trí: ${next.shift.area}.`);
  return { ok: true, message: 'Đã đến vị trí', state: next };
}

export function restWaiter(state: WaiterPageState): WaiterMutationResult {
  const next = clone(state);
  if (next.currentService) {
    return { ok: false, message: 'Lượt tiếp đón hiện tại chưa kết thúc.', state };
  }
  if (next.workStatus === '未上班' || next.workStatus === '已下班') {
    return { ok: false, message: 'Hiện không trong ca làm việc.', state };
  }
  if (next.freeRestUsed) {
    return { ok: false, message: 'Nghỉ giữa ca hôm nay đã dùng hết, có thể chọn ăn uống hoặc chăm sóc cơ thể để hồi phục.', state };
  }
  next.workStatus = '休息中';
  next.freeRestUsed = true;
  next.location = '员工休息室';
  next.stamina = clamp(next.stamina + 22, 0, next.maxStamina);
  next.dialogue = { speaker: 'Đồng nghiệp', text: 'Nghỉ một lát đã, hồi phục xong rồi tiếp tục tiếp đón.' };
  addLog(next, 'Nghỉ giữa ca, hồi phục 22 điểm thể lực.');
  return { ok: true, message: 'Thể lực đã hồi phục', state: next };
}

export function startWaiterService(state: WaiterPageState, assignmentId: string): WaiterMutationResult {
  const next = clone(state);
  if (!['待岗', '休息中'].includes(next.workStatus)) {
    return { ok: false, message: next.workStatus === '未上班' ? 'Vui lòng đến vị trí trước.' : 'Hiện không thể bắt đầu tiếp đón mới.', state };
  }
  if (next.currentService) {
    return { ok: false, message: 'Đã có một lượt tiếp đón đang diễn ra.', state };
  }
  const assignment = next.assignments.find(item => item.id === assignmentId);
  if (!assignment || assignment.status !== '待接待') {
    return { ok: false, message: 'Lượt tiếp đón này hiện chưa thể bắt đầu.', state };
  }
  if (next.stamina < 12) {
    return { ok: false, message: 'Thể lực không đủ, hãy nghỉ ngơi hoặc chăm sóc cơ thể trước.', state };
  }
  assignment.status = '进行中';
  next.currentService = {
    assignmentId,
    startedAt: next.time,
    resultBaseline: clone(next.growth),
  };
  next.workStatus = assignment.source === '指名客' ? '被指名' : '接客中';
  next.location = assignment.area;
  next.time = assignment.time;
  if (assignment.source === '指名客') {
    const existingNomination = next.activeNominations.find(item => item.guestId === assignment.guestId);
    if (existingNomination) {
      existingNomination.remainingDays = Math.max(existingNomination.remainingDays, assignment.nominationDays, 1);
      existingNomination.project = assignment.project;
      existingNomination.area = assignment.area;
    } else if (next.activeNominations.length < MAX_ACTIVE_NOMINATIONS) {
      next.activeNominations.push({
        guestId: assignment.guestId,
        guest: assignment.guest,
        remainingDays: Math.max(1, assignment.nominationDays),
        project: assignment.project,
        area: assignment.area,
      });
      next.evaluation.nominationCount += 1;
    }
    const guest = next.guests[assignment.guestId];
    if (guest) {
      guest.source = '指名客';
      guest.nominated = true;
      guest.nominationRemainingDays = Math.max(1, assignment.nominationDays);
      guest.projectPreferences = [...new Set([assignment.project, ...guest.projectPreferences])];
    }
    syncWaiterNominationAlias(next);
  }
  next.dialogue = {
    speaker: assignment.guest,
    text: assignment.opening || `${assignment.project} đã bắt đầu, tương tác cụ thể tiếp theo do bạn tự quyết định.`,
  };
  addLog(next, `Bắt đầu tiếp đón ${assignment.guest}: ${assignment.project}.`);
  return { ok: true, message: 'Đã vào hiện trường tiếp đón', state: next };
}

export function applyWaiterGrowthFromMvu(
  state: WaiterPageState,
  growth: WaiterGrowthRecord,
  allowRollback = false,
): WaiterPageState {
  const next = clone(state);
  const incoming = normalizeWaiterGrowthRecord(growth);
  const floor = allowRollback ? next.currentService?.resultBaseline : next.growth;
  if (floor) {
    for (const key of Object.keys(incoming.标准服务) as Array<keyof WaiterGrowthRecord['标准服务']>) {
      incoming.标准服务[key] = Math.max(incoming.标准服务[key], floor.标准服务[key]);
    }
    for (const key of Object.keys(incoming.擦边记录) as Array<keyof WaiterGrowthRecord['擦边记录']>) {
      incoming.擦边记录[key] = Math.max(incoming.擦边记录[key], floor.擦边记录[key]);
    }
    for (const key of Object.keys(incoming.性服务记录) as Array<keyof WaiterGrowthRecord['性服务记录']>) {
      incoming.性服务记录[key] = Math.max(incoming.性服务记录[key], floor.性服务记录[key]);
    }
  }
  if (!allowRollback) {
    incoming.保持记录.阴道未插入 = next.growth.保持记录.阴道未插入 && incoming.保持记录.阴道未插入;
    incoming.保持记录.肛门未插入 = next.growth.保持记录.肛门未插入 && incoming.保持记录.肛门未插入;
    incoming.保持记录.未发生性服务 = next.growth.保持记录.未发生性服务 && incoming.保持记录.未发生性服务;
  }
  markGrowthConsistency(incoming);
  next.growth = incoming;
  next.skills = calculateWaiterSkills(next.growth, next.investments);
  return next;
}

export function finishWaiterService(state: WaiterPageState, outcome: WaiterServiceOutcome = {}): WaiterMutationResult {
  const next = clone(state);
  const current = next.currentService;
  if (!current) {
    return { ok: false, message: 'Hiện không có lượt tiếp đón nào đang diễn ra.', state };
  }
  const assignment = next.assignments.find(item => item.id === current.assignmentId);
  if (!assignment || assignment.status !== '进行中') {
    return { ok: false, message: 'Trạng thái tiếp đón hiện tại bất thường, không kết toán lặp lại.', state };
  }

  const delta = getGrowthDelta(next.growth, current.resultBaseline);
  if (getResultIntensity(delta) === 0) {
    next.growth.标准服务.完成次数 += 1;
  }
  const finalDelta = getGrowthDelta(next.growth, current.resultBaseline);
  const standardSkill = calculateWaiterSkills(next.growth, next.investments).标准服务;
  const score = clamp(
    Number(outcome.score) || 3.6 + standardSkill / 180 + Math.min(0.45, getResultIntensity(finalDelta) * 0.04),
    1,
    5,
  );
  const roundedScore = Math.round(score * 10) / 10;
  const goodReview = roundedScore >= 4.4;
  if (goodReview && finalDelta.标准服务.好评次数 === 0) {
    next.growth.标准服务.好评次数 += 1;
  }
  markGrowthConsistency(next.growth);
  next.skills = calculateWaiterSkills(next.growth, next.investments);

  const tip = roundedScore < 3.5 ? 0 : Math.max(20, Math.round(((roundedScore - 3.2) * 80) / 10) * 10);
  const extraIncome = getExtraIncome(finalDelta);
  const nominationIncome = assignment.source === '指名客' ? WAITER_GRADE_RULES[next.grade].nominationFee : 0;
  next.todayIncome.打赏 += tip;
  next.todayIncome.额外服务 += extraIncome;
  next.todayIncome.指名费 += nominationIncome;
  next.balance += tip + extraIncome + nominationIncome;
  if (tip) addLedger(next, '打赏', tip, `${assignment.guest} · ${roundedScore.toFixed(1)} điểm`);
  if (extraIncome) addLedger(next, '额外服务', extraIncome, `${assignment.guest} · Kết quả lần này đã xác nhận`);
  if (nominationIncome) addLedger(next, '指名费', nominationIncome, `${assignment.guest} · Toàn bộ phí chỉ định trong ngày`);

  next.evaluation.reviewCount += 1;
  next.evaluation.totalScore += roundedScore;
  next.evaluation.averageScore = Math.round((next.evaluation.totalScore / next.evaluation.reviewCount) * 100) / 100;
  if (goodReview) next.evaluation.goodReviewCount += 1;
  next.ratingPoints += Math.round(roundedScore * 3) + Math.min(10, getResultIntensity(finalDelta) * 2);
  assignment.status = '已完成';
  next.currentService = null;
  next.workStatus = '待岗';
  next.stamina = clamp(
    next.stamina - (assignment.source === '指名客' ? 18 : 14) - Math.min(12, getResultIntensity(finalDelta) * 2),
    0,
    next.maxStamina,
  );
  next.time = formatClockMinutes(clockMinutes(assignment.time) + assignment.durationMinutes);
  const promoted = tryPromote(next);
  next.dialogue = {
    speaker: assignment.guest,
    text: `Lượt phục vụ này đã kết thúc, đánh giá ${roundedScore.toFixed(1)} điểm.${tip ? ` Đã để lại ${tip} đồng tiền boa.` : ''}`,
  };
  addLog(
    next,
    `${assignment.project} của ${assignment.guest} đã hoàn thành, đánh giá ${roundedScore.toFixed(1)}, thu nhập cá nhân +${tip + extraIncome + nominationIncome}.`,
  );
  if (promoted) {
    addLog(next, `Đánh giá được nâng lên hạng ${promoted}, lương ngày điều chỉnh thành ${next.dailySalary}.`);
  }
  return { ok: true, message: promoted ? `Dịch vụ hoàn thành, thăng hạng ${promoted}` : 'Dịch vụ đã được kết toán', state: next };
}

export function buyWaiterOption(
  state: WaiterPageState,
  key: WaiterInvestmentKey | WaiterRecoveryKey,
): WaiterMutationResult {
  const next = clone(state);
  const option = WAITER_INVESTMENT_OPTIONS.find(item => item.key === key);
  if (!option) {
    return { ok: false, message: 'Không tìm thấy khoản đầu tư này.', state };
  }
  if (option.kind === 'investment') {
    const investmentKey = key as WaiterInvestmentKey;
    const level = next.investments[investmentKey];
    if (level >= (option.maxLevel ?? 0)) {
      return { ok: false, message: 'Khoản đầu tư này đã đạt cấp độ tối đa.', state };
    }
  }
  const cost = getWaiterInvestmentCost(next, key);
  if (next.balance < cost) {
    return { ok: false, message: `Số dư không đủ, còn cần thêm ${cost - next.balance}.`, state };
  }
  next.balance -= cost;
  next.todayExpense += cost;
  if (key === '餐食与休息') {
    next.stamina = clamp(next.stamina + 28, 0, next.maxStamina);
    addLedger(next, '恢复', -cost, option.title);
  } else if (key === '身体护理') {
    next.stamina = clamp(next.stamina + 60, 0, next.maxStamina);
    addLedger(next, '恢复', -cost, option.title);
  } else {
    next.investments[key] += 1;
    if (key === '生活品质' || key === '生活目标') {
      next.maxStamina = 100 + next.investments.生活品质 * 6 + next.investments.生活目标 * 8;
      next.stamina = clamp(next.stamina + 12, 0, next.maxStamina);
    }
    next.skills = calculateWaiterSkills(next.growth, next.investments);
    addLedger(next, '个人投入', -cost, `${option.title} tăng lên cấp ${next.investments[key]}`);
  }
  addLog(next, `${option.title} đã chi ${cost}.`);
  return { ok: true, message: `${option.title} đã hoàn tất`, state: next };
}

export function settleWaiterDay(state: WaiterPageState): WaiterMutationResult {
  const next = clone(state);
  if (next.currentService) {
    return { ok: false, message: 'Vui lòng kết thúc lượt tiếp đón hiện tại trước.', state };
  }
  if (next.workStatus === '未上班') {
    return { ok: false, message: 'Hôm nay chưa đến vị trí làm việc.', state };
  }
  if (next.workStatus === '已下班') {
    return { ok: false, message: 'Hôm nay đã kết toán rồi.', state };
  }
  const unfinishedNomination = next.assignments.find(item => item.source === '指名客' && item.status === '待接待');
  if (unfinishedNomination) {
    return { ok: false, message: 'Lượt tiếp đón chỉ định hôm nay chưa hoàn thành.', state };
  }

  next.todayIncome.日薪 = next.dailySalary;
  next.balance += next.dailySalary;
  addLedger(next, '日薪', next.dailySalary, `Hạng ${next.grade} ${next.shift.name}`);
  const livingCost = Math.min(next.balance, getWaiterLivingCost(next));
  next.balance -= livingCost;
  next.todayExpense += livingCost;
  addLedger(next, '生活费', -livingCost, 'Chi phí sinh hoạt cơ bản trong ngày');

  const income = totalIncome(next.todayIncome);
  const completed = getWaiterCompletedServices(next);
  next.latestSettlement = {
    date: next.dateText,
    income,
    expense: next.todayExpense,
    net: income - next.todayExpense,
    services: completed,
    averageScore: next.evaluation.averageScore,
    grade: next.grade,
  };
  addLog(next, `Kết toán tan ca: thu nhập ${income}, chi tiêu ${next.todayExpense}, còn lại ${income - next.todayExpense}.`);

  const servedNominationGuestIds = new Set(
    next.assignments.filter(item => item.source === '指名客' && item.status === '已完成').map(item => item.guestId),
  );
  next.activeNominations = next.activeNominations
    .map(item => ({
      ...item,
      remainingDays: servedNominationGuestIds.has(item.guestId) ? item.remainingDays - 1 : item.remainingDays,
    }))
    .filter(item => item.remainingDays > 0);
  syncWaiterNominationAlias(next);
  Object.values(next.guests).forEach(guest => {
    const nomination = next.activeNominations.find(item => item.guestId === guest.id);
    guest.nominated = Boolean(nomination);
    guest.nominationRemainingDays = nomination?.remainingDays ?? 0;
    if (nomination) guest.source = '指名客';
  });
  const tomorrow = addDay(next.dateIso);
  next.dateIso = makeDateIso(tomorrow);
  next.dateText = formatDate(tomorrow);
  next.dayIndex += 1;
  next.time = '17:30';
  next.location = '员工休息室';
  next.workStatus = '未上班';
  next.freeRestUsed = false;
  next.todayIncome = { 日薪: 0, 打赏: 0, 指名费: 0, 额外服务: 0 };
  next.todayExpense = 0;
  next.stamina = clamp(72 + next.investments.生活品质 * 7 + next.investments.生活目标 * 4, 0, next.maxStamina);
  const fallbackDay = makeFallbackDay(
    next.dayIndex,
    next.grade,
    next.investments.形象打理,
    next.activeNominations,
    next.guests,
  );
  next.assignments = fallbackDay.assignments;
  next.guests = fallbackDay.guests;
  next.dailyGuestIds = fallbackDay.dailyGuestIds;
  next.guestGeneration = { dateIso: next.dateIso, attempted: false, source: 'fallback', issues: [] };
  next.shiftNote = 'Sắp xếp ca tối của ngày mới đã có. Hãy xác nhận thứ tự tiếp đón trước, rồi chuẩn bị đến vị trí.';
  next.dialogue = { speaker: 'Trưởng ca', text: next.shiftNote };
  return { ok: true, message: 'Đã kết toán và chuyển sang ngày tiếp theo', state: next };
}

export function applyWaiterTimeText(state: WaiterPageState, timeText: string): WaiterPageState {
  const next = clone(state);
  const match = timeText.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    next.time = `${pad(clamp(Number(match[1]), 0, 23))}:${pad(clamp(Number(match[2]), 0, 59))}`;
  }
  return next;
}

export function applyWaiterManualTimeTarget(
  state: WaiterPageState,
  targetTime: string,
  transition: { fromDate: string; crossesMidnight: boolean },
): WaiterMutationResult {
  const normalizedTime = normalizeTangquanClock(targetTime);
  if (!normalizedTime) {
    return { ok: false, message: 'Thời gian mục tiêu không hợp lệ, vui lòng chọn lại', state };
  }
  const next = clone(state);
  next.time = normalizedTime;
  next.timeControl = recordTangquanTimeTravel(next.timeControl, {
    fromDate: transition.fromDate,
    toDate: next.dateIso,
    targetTime: normalizedTime,
    crossesMidnight: transition.crossesMidnight,
  });
  return { ok: true, message: `Thời gian đã tiến đến ${normalizedTime}`, state: next };
}

export function makeWaiterAreaEntryContent(state: WaiterPageState): string {
  return `<当前区域>\n名称: ${state.location}\n说明: Khu vực của ca làm việc hiện tại\n</当前区域>`;
}

export function makeWaiterAssignmentFacts(state: WaiterPageState): WaiterAssignmentFact[] {
  return state.assignments.map(assignment => {
    const guest = state.guests[assignment.guestId];
    return {
      assignmentId: assignment.id,
      time: assignment.time,
      guestId: assignment.guestId,
      guest: guest?.name ?? assignment.guest,
      gender: guest?.gender ?? 'Chưa rõ',
      species: guest?.species ?? 'Chưa rõ',
      source: assignment.source,
      project: assignment.project,
      area: assignment.area,
      durationMinutes: assignment.durationMinutes,
      status: assignment.status,
    };
  });
}

export function makeWaiterAssignmentFactsEntryContent(state: WaiterPageState): string {
  const facts = makeWaiterAssignmentFacts(state);
  return [
    '<当日接待安排>',
    `日期: ${state.dateText}`,
    `班次: ${state.shift.name} ${state.shift.start}-${state.shift.end}`,
    ...facts.map(
      (fact, index) =>
        `接待${index + 1}: assignment_id=${fact.assignmentId} | time=${fact.time} | guest_id=${fact.guestId} | guest=${fact.guest} | gender=${fact.gender} | species=${fact.species} | source=${fact.source} | project=${fact.project} | area=${fact.area} | duration_minutes=${fact.durationMinutes} | status=${fact.status}`,
    ),
    '</当日接待安排>',
  ].join('\n');
}

export function makeWaiterGuestEntryContent(state: WaiterPageState, assignment: WaiterAssignment): string {
  const guest = state.guests[assignment.guestId];
  return [
    '<当前客人>',
    `ID: ${assignment.guestId}`,
    `称呼: ${guest?.name ?? assignment.guest}`,
    `性别: ${guest?.gender ?? 'Chưa rõ'}`,
    `种族: ${guest?.species ?? 'Con người'}`,
    `来源地: ${guest?.origin ?? 'Địa phương'}`,
    `预算: ${guest?.budget ?? 0}`,
    `客源类型: ${guest?.source ?? assignment.source}`,
    `项目偏好: ${(guest?.projectPreferences ?? [assignment.project]).join('、')}`,
    `是否回头客: ${guest?.returning === true}`,
    `是否指名: ${guest?.nominated === true || assignment.source === '指名客'}`,
    `指名剩余天数: ${guest?.nominationRemainingDays ?? (assignment.source === '指名客' ? Math.max(1, assignment.nominationDays) : 0)}`,
    `特殊说明: ${guest?.notes || 'không có'}`,
    `当前项目: ${assignment.project}`,
    '</当前客人>',
  ].join('\n');
}

export function makeWaiterProjectEntryContent(assignment: WaiterAssignment): string {
  return `<当前项目>\n名称: ${assignment.project}\n地点: ${assignment.area}\n预计时长: ${assignment.durationMinutes}分钟\n</当前项目>`;
}

export function makeWaiterCoworkerEntryContent(name: string, area: string): string {
  return `<当前员工>\n姓名: ${name}\n所在地: ${area}\n当前状态: Đang làm việc\n</当前员工>`;
}
