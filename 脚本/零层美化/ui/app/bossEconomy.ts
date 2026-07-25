import { findTangquanCharacter, isTangquanCharacterAllowed, listTangquanCharacters } from './characterCatalog';
import {
  makeTangquanTimeControlState,
  normalizeTangquanClock,
  normalizeTangquanTimeControlState,
  recordTangquanTimeTravel,
  type TangquanTimeControlState,
} from './timeTravel';
import {
  makeBossAiTalentMarketState,
  markBossAiTalentMarketFallback,
  normalizeBossAiTalentMarketState,
  type BossAiTalentMarketState,
} from './aiTalentMarket';

export type BossGrade = 'SSS' | 'S' | 'A' | 'B' | 'C' | 'D' | '新人' | '待定';

const LEGACY_TEST_CHARACTER_NAMES = new Set(['由梨', '千夏', '澪', '铃', '雾子', '真白', '小夜', '纱织']);

export const BOSS_EMPLOYEE_GRADE_RULES = {
  C: { 服务次数: 0, 评分: 62 },
  B: { 服务次数: 140, 评分: 75 },
  A: { 服务次数: 280, 评分: 86 },
  S: { 服务次数: 550, 评分: 92 },
  SSS: { 服务次数: 800, 评分: 96 },
} as const;

export type BossEmployee = {
  角色ID?: string;
  姓名: string;
  头衔?: string;
  是否看板娘?: boolean;
  评级: BossGrade;
  区域: string;
  状态: string;
  日薪: number;
  期望日薪: number;
  评分: number;
  满意度: number;
  疲劳: number;
  个人收入: number;
  离职风险: number;
  低满意天数: number;
  服务次数: number;
  指名次数: number;
  额外结果次数: number;
  排班: string[];
};

export type BossHostessState = {
  version: 1;
  已选择: boolean;
  角色ID: string;
  姓名: string;
  来源: 'new' | 'legacy';
};

export type BossArea = {
  名称: string;
  客人: number;
  员工: string[];
  说明: string;
};

export type BossProject = {
  名称: string;
  基础价格: number;
  评分: number;
  推荐值: number;
  热度: string;
  设施需求: string;
  容量: number;
  成本率: number;
  今日订单: number;
};

export type BossNomination = {
  员工: string;
  客人: string;
  区域: string;
  剩余天数: number;
  每日指名费: number;
  预计小费: number;
  预计收入: number;
};

export type BossMarketCandidate = {
  姓名: string;
  类型: string;
  说明: string;
  市场价格: number;
  期望日薪: number;
  评级: BossGrade;
};

export type BossRecruitCandidate = {
  姓名: string;
  拒绝记录: number;
  期望日薪: number;
  说明: string;
};

export type BossRecruitmentState = {
  候选: BossRecruitCandidate[];
  下次刷新时间: string;
  刷新序号: number;
  上次刷新来源: 'initial' | 'natural' | 'paid';
  已录用: string[];
  女性限定可见: boolean;
};

export type BossInfrastructure = {
  占地规模: number;
  前台接待: number;
  更衣清洗: number;
  汤池: number;
  休息区: number;
  理疗区: number;
  包间: number;
  餐饮区: number;
  客房: number;
  庭院: number;
  员工休息室: number;
  后勤: number;
  维护度: number;
};

export type BossInfrastructureKey = keyof Omit<BossInfrastructure, '维护度'>;
export type BossUnlockCategory = '区域' | '项目' | '经营';
export type BossInfrastructureRequirement = Partial<Record<BossInfrastructureKey, number>>;

export type BossInfrastructureUnlock = {
  id: string;
  名称: string;
  分类: BossUnlockCategory;
  条件: BossInfrastructureRequirement;
  说明: string;
  条目占位: string;
};

export type BossInfrastructureCatalogItem = {
  key: BossInfrastructureKey;
  label: string;
  level: number;
  maxLevel: number;
  cost: number;
  days: number;
  note: string;
  nextUnlocks: BossInfrastructureUnlock[];
  isMaxed: boolean;
  inProgress: boolean;
};

export type BossBuildingStatus = '未开放' | '可扩建' | '施工中' | '待验收' | '已建成';

export type BossBuildingState = {
  id: string;
  状态: BossBuildingStatus;
  等级: number;
};

export type BossBuildingCatalogItem = BossInfrastructureUnlock & {
  状态: BossBuildingStatus;
  等级: number;
  maxLevel: number;
  cost: number;
  days: number;
  missing: string[];
  canStart: boolean;
};

export type BossMarketingCampaign = {
  id: string;
  名称: string;
  剩余天数: number;
  客流加成: number;
  推荐加成: number;
  说明: string;
};

export type BossProjectBoost = {
  id: string;
  项目: string;
  剩余天数: number;
  推荐加成: number;
  评分加成: number;
  说明: string;
};

export type BossStaffCare = {
  剩余天数: number;
  满意加成: number;
  疲劳恢复: number;
};

export type BossLedgerEntryType = '收入' | '支出' | '员工收入' | '投资' | '调整';
export type BossBusinessStatus = '营业中' | '暂停营业' | '今日停业';
export type BossHolidayStatus = '平日' | '休息日' | '节假日';
export type BossEmployeeDayRole = '接待' | '值班' | '清洁' | '休息';
export type BossConstructionStatus = '施工中' | '待验收';

export type BossHolidayEffect = {
  状态: BossHolidayStatus;
  名称: string;
  客流倍率: number;
  价格倍率: number;
  活动倍率: number;
  说明: string;
  来源: '日期判定' | '前端写入' | '世界书判定';
};

export type BossLedgerEntry = {
  id: string;
  营业日: number;
  类型: BossLedgerEntryType;
  名称: string;
  金额: number;
  资金变动: number;
  说明: string;
};

export type BossEmployeeDayReport = {
  员工: string;
  角色: BossEmployeeDayRole;
  接待段: number;
  值班段: number;
  清洁段: number;
  休息段: number;
  工资: number;
  工资倍率: number;
  疲劳变化: number;
  满意变化: number;
  说明: string;
};

export type BossConstructionProject = {
  id: string;
  类型: '基建' | '建筑';
  设施: BossInfrastructureKey;
  建筑ID?: string;
  名称: string;
  当前等级: number;
  目标等级: number;
  状态: BossConstructionStatus;
  总费用: number;
  已支付: number;
  每日消耗: number;
  总天数: number;
  剩余天数: number;
  开工日: number;
  验收日: string;
};

export type BossDailyReportSource = 'ai' | 'fallback';

export type BossDailyReport = {
  version: 1;
  营业日: number;
  日期: string;
  来源: BossDailyReportSource;
  标题: string;
  客人概况: string;
  收入说明: string;
  评价说明: string;
  项目日结: Array<{ 项目: string; 订单: number; 纪要: string }>;
  员工纪要: Array<{ 员工: string; 角色: BossEmployeeDayRole; 纪要: string }>;
  事件纪要: Array<{ id: string; 纪要: string }>;
  收束: string;
  问题: string[];
};

export type BossSettlement = {
  营业日: number;
  状态: '预估' | '已结算';
  收入: number;
  支出: number;
  毛利: number;
  店铺收入明细: {
    到店消费: number;
    项目消费: number;
    住宿包场: number;
    活动套餐: number;
  };
  支出明细: {
    日薪: number;
    固定运营: number;
    设施维护: number;
    服务准备: number;
    工程消耗: number;
    投资: number;
  };
  员工收入合计: number;
  员工日结: BossEmployeeDayReport[];
  工程日结: BossConstructionProject[];
  流水: BossLedgerEntry[];
  明日预测: {
    客流: number;
    店铺评分: number;
    平均满意度: number;
  };
  经营纪要: BossDailyReport | null;
};

export type BossPageState = {
  营业日: number;
  日期: string;
  时间: string;
  地点: string;
  营业状态: BossBusinessStatus;
  暂停保留客流: number;
  节假日: BossHolidayEffect;
  资金: number;
  店铺评分: number;
  好评率: number;
  客流: number;
  今日已结算: boolean;
  时间控制: TangquanTimeControlState;
  看板娘: BossHostessState;
  时间段: string[];
  员工: BossEmployee[];
  区域: BossArea[];
  项目: BossProject[];
  指名: BossNomination[];
  人才市场: BossMarketCandidate[];
  AI人才市场: BossAiTalentMarketState;
  招聘: BossRecruitmentState;
  基建: BossInfrastructure;
  建筑: BossBuildingState[];
  工程: BossConstructionProject[];
  宣传活动: BossMarketingCampaign[];
  品质投入: BossProjectBoost[];
  员工福利: BossStaffCare;
  结算: BossSettlement;
  账本: BossLedgerEntry[];
  经营提醒: string[];
};

export type BossMutationResult = {
  ok: boolean;
  message: string;
  state: BossPageState;
};

const BOSS_TIME_SLOTS = ['Buổi sáng', 'Buổi chiều', 'Buổi tối', 'Đêm khuya'];
export const BOSS_CURRENT_SHIFT_INDEX = 2;
const MIN_TRAFFIC = 6;
const INITIAL_FUNDS = 128400;
const INFRASTRUCTURE_MAX_LEVEL = 5;
const BUILDING_MAX_LEVEL = 5;

const DEFAULT_INFRASTRUCTURE: BossInfrastructure = {
  占地规模: 1,
  前台接待: 1,
  更衣清洗: 1,
  汤池: 1,
  休息区: 1,
  理疗区: 1,
  包间: 1,
  餐饮区: 1,
  客房: 1,
  庭院: 1,
  员工休息室: 1,
  后勤: 1,
  维护度: 82,
};

const GRADE_MULTIPLIER: Record<BossGrade, number> = {
  SSS: 1.62,
  S: 1.45,
  A: 1.25,
  B: 1.08,
  C: 0.95,
  D: 0.82,
  新人: 0.72,
  待定: 0.8,
};

const AREA_DESCRIPTIONS: Record<string, string> = {
  大堂: 'Nơi khách đăng ký, chờ đợi, chọn dự án.',
  更衣清洗: 'Thay đồ, vệ sinh và chỉnh trang trước khi tắm tập trung ở đây.',
  汤池: 'Lượng khách hàng ngày tập trung, việc duy trì môi trường sẽ ảnh hưởng trực tiếp đến đánh giá.',
  休息室: 'Khách quen ở lại lâu hơn, phù hợp để quan sát dịch vụ chỉ định.',
  理疗区: 'Xoa bóp trị liệu và dịch vụ thư giãn tập trung, đánh giá sẽ ảnh hưởng đến đề xuất dự án.',
  包间: 'Đặt lịch riêng tư tập trung, giá cao nhưng phụ thuộc nhiều hơn vào trạng thái nhân viên.',
  餐饮区: 'Đồ uống, bữa ăn nhẹ và đồ ăn khuya sẽ tăng ý muốn lưu lại.',
  客房: 'Khách lưu trú và chỉ định xuyên ngày dễ tiếp diễn ở đây hơn.',
  庭院: 'Sân vườn sẽ tăng bầu không khí tổng thể, cũng hỗ trợ bể tắm ngoài trời.',
  员工休息室: 'Nơi nhân viên đổi ca, nghỉ ngơi và hồi phục trạng thái.',
  办公室: 'Quản lý kinh doanh, phỏng vấn và sắp xếp hậu cần tập trung ở đây.',
};

type BossAreaCatalogItem = {
  名称: string;
  设施: BossInfrastructureKey;
  最低等级: number;
  权重: number;
  说明: string;
};

type BossProjectDefinition = Omit<BossProject, '今日订单' | '热度'> & {
  条件: BossInfrastructureRequirement;
  建筑需求?: string[];
};

const AREA_CATALOG: BossAreaCatalogItem[] = [
  { 名称: '大堂', 设施: '前台接待', 最低等级: 1, 权重: 0.13, 说明: AREA_DESCRIPTIONS.大堂 },
  { 名称: '更衣清洗', 设施: '更衣清洗', 最低等级: 1, 权重: 0.07, 说明: AREA_DESCRIPTIONS.更衣清洗 },
  { 名称: '汤池', 设施: '汤池', 最低等级: 1, 权重: 0.2, 说明: AREA_DESCRIPTIONS.汤池 },
  { 名称: '休息室', 设施: '休息区', 最低等级: 1, 权重: 0.15, 说明: AREA_DESCRIPTIONS.休息室 },
  { 名称: '理疗区', 设施: '理疗区', 最低等级: 1, 权重: 0.12, 说明: AREA_DESCRIPTIONS.理疗区 },
  { 名称: '包间', 设施: '包间', 最低等级: 1, 权重: 0.12, 说明: AREA_DESCRIPTIONS.包间 },
  { 名称: '餐饮区', 设施: '餐饮区', 最低等级: 1, 权重: 0.08, 说明: AREA_DESCRIPTIONS.餐饮区 },
  { 名称: '客房', 设施: '客房', 最低等级: 1, 权重: 0.07, 说明: AREA_DESCRIPTIONS.客房 },
  { 名称: '庭院', 设施: '庭院', 最低等级: 1, 权重: 0.04, 说明: AREA_DESCRIPTIONS.庭院 },
  { 名称: '员工休息室', 设施: '员工休息室', 最低等级: 1, 权重: 0, 说明: AREA_DESCRIPTIONS.员工休息室 },
  { 名称: '办公室', 设施: '后勤', 最低等级: 1, 权重: 0, 说明: AREA_DESCRIPTIONS.办公室 },
];

const DEFAULT_HOLIDAY_EFFECT: BossHolidayEffect = {
  状态: '平日',
  名称: 'Ngày thường',
  客流倍率: 1,
  价格倍率: 1,
  活动倍率: 1,
  说明: 'Ngày kinh doanh bình thường.',
  来源: '日期判定',
};

const INFRASTRUCTURE_LABELS: Record<BossInfrastructureKey, string> = {
  占地规模: 'Quy mô mặt bằng',
  前台接待: 'Tiếp tân',
  更衣清洗: 'Thay đồ - Vệ sinh',
  汤池: 'Bể tắm suối nước nóng',
  休息区: 'Khu nghỉ ngơi',
  理疗区: 'Khu trị liệu',
  包间: 'Phòng riêng',
  餐饮区: 'Khu ẩm thực',
  客房: 'Phòng khách',
  庭院: 'Sân vườn',
  员工休息室: 'Phòng nghỉ nhân viên',
  后勤: 'Hậu cần',
};

const INFRASTRUCTURE_NOTES: Record<BossInfrastructureKey, string> = {
  占地规模: 'Quyết định không gian mở rộng tổng thể và giới hạn tiếp đón, quy mô càng lớn thì áp lực bảo trì càng cao.',
  前台接待: 'Ảnh hưởng đến đăng ký, chờ đợi, nhận đặt lịch và ấn tượng đầu tiên của khách khi vào quán.',
  更衣清洗: 'Ảnh hưởng đến trải nghiệm trước khi tắm, lượng khách càng cao càng cần khả năng thay đồ và vệ sinh ổn định.',
  汤池: 'Trải nghiệm cốt lõi của ôn tuyền, nâng cấp sẽ dần mở khóa tắm thuốc, bể ngoài trời và bể theo mùa.',
  休息区: 'Ảnh hưởng đến thời gian lưu lại của khách quen, dịch vụ đồng hành và dung lượng các dự án nghỉ ngơi.',
  理疗区: 'Ảnh hưởng đến các dự án đánh giá cao như xoa bóp, tinh dầu, chăm sóc thảo dược.',
  包间: 'Ảnh hưởng đến đặt lịch riêng tư, tắm riêng, dịch vụ VIP và các dự án giá trị cao.',
  餐饮区: 'Ảnh hưởng đến trà, đồ ăn nhẹ, ẩm thực và ý muốn lưu lại của khách lưu trú.',
  客房: 'Ảnh hưởng đến lưu trú, đặt lịch xuyên ngày và các dự án khách ở dài hạn.',
  庭院: 'Ảnh hưởng đến bầu không khí, khu vực ngoài trời và mở rộng tắm riêng cao cấp.',
  员工休息室: 'Ảnh hưởng đến hồi phục mệt mỏi, sự hài lòng và ổn định lâu dài của nhân viên.',
  后勤: 'Ảnh hưởng đến kho bãi, giặt ủi, vật tư tiêu hao và vận hành ổn định của các dự án lớn.',
};

const INFRASTRUCTURE_COST_WEIGHT: Record<BossInfrastructureKey, number> = {
  占地规模: 1.55,
  前台接待: 0.82,
  更衣清洗: 0.88,
  汤池: 1.18,
  休息区: 0.92,
  理疗区: 1.05,
  包间: 1.22,
  餐饮区: 0.96,
  客房: 1.28,
  庭院: 1.12,
  员工休息室: 0.9,
  后勤: 0.98,
};

const INFRASTRUCTURE_UNLOCKS: BossInfrastructureUnlock[] = [
  {
    id: 'area_lobby',
    名称: '前台大厅',
    分类: '区域',
    条件: { 前台接待: 1 },
    说明: 'Đăng ký, chờ đợi, chọn dịch vụ và trưng bày quà lưu niệm được mở.',
    条目占位: '设施/前台大厅',
  },
  {
    id: 'area_changing',
    名称: '更衣清洗区',
    分类: '区域',
    条件: { 更衣清洗: 1 },
    说明: 'Thay đồ, gửi đồ, vệ sinh và chỉnh trang trước khi tắm được mở.',
    条目占位: '设施/更衣清洗区',
  },
  {
    id: 'area_indoor_bath',
    名称: '室内大浴场',
    分类: '区域',
    条件: { 汤池: 1 },
    说明: 'Không gian cốt lõi cho tắm cơ bản và lượng khách hàng ngày được mở.',
    条目占位: '设施/室内大浴场',
  },
  {
    id: 'area_rest_hall',
    名称: '榻榻米休息室',
    分类: '区域',
    条件: { 休息区: 1 },
    说明: 'Không gian nghỉ ngơi, trà nước và lưu lại cho khách quen được mở.',
    条目占位: '设施/榻榻米休息室',
  },
  {
    id: 'area_massage',
    名称: '按摩室',
    分类: '区域',
    条件: { 理疗区: 1 },
    说明: 'Xoa bóp trị liệu cơ bản được mở.',
    条目占位: '设施/按摩室',
  },
  {
    id: 'area_basic_room',
    名称: '简易包间',
    分类: '区域',
    条件: { 包间: 1 },
    说明: 'Không gian nghỉ ngơi riêng tư nhỏ được mở.',
    条目占位: '设施/简易包间',
  },
  {
    id: 'area_tea_corner',
    名称: '茶点角',
    分类: '区域',
    条件: { 餐饮区: 1 },
    说明: 'Trà cơ bản và bữa ăn nhẹ được mở.',
    条目占位: '设施/茶点角',
  },
  {
    id: 'area_guest_room',
    名称: '简易客房',
    分类: '区域',
    条件: { 客房: 1 },
    说明: 'Lưu trú cơ bản và lưu lại ngắn hạn được mở.',
    条目占位: '设施/简易客房',
  },
  {
    id: 'area_garden_path',
    名称: '庭院小径',
    分类: '区域',
    条件: { 庭院: 1 },
    说明: 'Không gian đi lại và dạo bộ trong sân vườn được mở.',
    条目占位: '设施/庭院小径',
  },
  {
    id: 'area_staff_room',
    名称: '员工休息室',
    分类: '区域',
    条件: { 员工休息室: 1 },
    说明: 'Đổi ca, ăn uống và nghỉ ngắn của nhân viên được mở.',
    条目占位: '设施/员工休息室',
  },
  {
    id: 'area_office',
    名称: '办公室与仓储',
    分类: '区域',
    条件: { 后勤: 1 },
    说明: 'Quản lý kinh doanh, phỏng vấn và kho bãi cơ bản được mở.',
    条目占位: '设施/办公室与仓储',
  },
  {
    id: 'area_herbal_bath',
    名称: '药汤池',
    分类: '区域',
    条件: { 汤池: 2, 后勤: 2 },
    说明: 'Sau khi chuẩn bị dược liệu ổn định, bể tắm thuốc được mở.',
    条目占位: '设施/药汤池',
  },
  {
    id: 'area_oil_therapy',
    名称: '精油理疗室',
    分类: '区域',
    条件: { 理疗区: 2, 后勤: 2 },
    说明: 'Giá tinh dầu, khăn nóng và dịch vụ trị liệu hoàn chỉnh hơn được mở.',
    条目占位: '设施/精油理疗室',
  },
  {
    id: 'area_steam_room',
    名称: '香氛蒸房',
    分类: '项目',
    条件: { 更衣清洗: 2, 后勤: 2 },
    说明: 'Sau khi luồng hơi nước, hương thơm và vệ sinh ổn định, các dự án phòng xông hơi được mở.',
    条目占位: '设施/香氛蒸房',
  },
  {
    id: 'area_comic_tea',
    名称: '茶饮漫画休息区',
    分类: '区域',
    条件: { 休息区: 2, 餐饮区: 2 },
    说明: 'Trải nghiệm lưu lại ở khu nghỉ ngơi được nâng cấp, khách quen sẵn lòng ở lại lâu hơn.',
    条目占位: '设施/茶饮漫画休息区',
  },
  {
    id: 'area_foot_bath_bar',
    名称: '足汤茶亭',
    分类: '项目',
    条件: { 庭院: 2, 餐饮区: 2 },
    说明: 'Tổ hợp ngâm chân và trà bên sân vườn được mở, tăng tiêu dùng nhẹ và cảm giác lưu lại.',
    条目占位: '设施/足汤茶亭',
  },
  {
    id: 'area_private_bath',
    名称: '包间汤池',
    分类: '区域',
    条件: { 包间: 2, 汤池: 2 },
    说明: 'Bể tắm suối nước nóng độc lập và không gian nghỉ ngơi riêng tư được mở.',
    条目占位: '设施/包间汤池',
  },
  {
    id: 'area_kitchen',
    名称: '料理台',
    分类: '区域',
    条件: { 餐饮区: 2, 后勤: 2 },
    说明: 'Đồ ăn nóng, ẩm thực và gói hoạt động có được không gian tiếp nhận ổn định.',
    条目占位: '设施/料理台',
  },
  {
    id: 'area_wash_storage',
    名称: '洗衣仓储间',
    分类: '经营',
    条件: { 后勤: 2 },
    说明: 'Giảm áp lực vật tư tiêu hao, tăng độ ổn định cho phòng khách và dự án trị liệu.',
    条目占位: '设施/洗衣仓储间',
  },
  {
    id: 'area_open_air',
    名称: '露天风吕',
    分类: '区域',
    条件: { 占地规模: 2, 汤池: 3, 庭院: 2 },
    说明: 'Sau khi sân vườn và bể tắm mở rộng hoàn tất, bể tắm ngoài trời được mở.',
    条目占位: '设施/露天风吕',
  },
  {
    id: 'area_bedrock_bath',
    名称: '岩盘浴室',
    分类: '项目',
    条件: { 汤池: 3, 理疗区: 2, 后勤: 2 },
    说明: 'Sau khi kết hợp đá nóng, nghỉ ngơi và luồng trị liệu, dự án chườm đá nóng được mở.',
    条目占位: '设施/岩盘浴室',
  },
  {
    id: 'area_washitsu_room',
    名称: '和室客房',
    分类: '区域',
    条件: { 占地规模: 2, 客房: 2 },
    说明: 'Trải nghiệm lưu trú hoàn chỉnh hơn được mở.',
    条目占位: '设施/和室客房',
  },
  {
    id: 'area_quiet_library',
    名称: '静音书廊',
    分类: '区域',
    条件: { 休息区: 3, 庭院: 2 },
    说明: 'Không gian đọc sách yên tĩnh và nghỉ dài được mở, phù hợp với nhóm khách thư giãn ít kích thích.',
    条目占位: '设施/静音书廊',
  },
  {
    id: 'area_herbal_care',
    名称: '药草护理室',
    分类: '区域',
    条件: { 汤池: 2, 理疗区: 3, 后勤: 3 },
    说明: 'Dự án kết hợp chăm sóc thảo dược và trị liệu được mở.',
    条目占位: '设施/药草护理室',
  },
  {
    id: 'area_beauty_care',
    名称: '美容护理间',
    分类: '项目',
    条件: { 理疗区: 3, 包间: 2 },
    说明: 'Sau khi hoàn thiện giường chăm sóc, ánh sáng và luồng riêng tư, dự án chăm sóc sắc đẹp được mở.',
    条目占位: '设施/美容护理间',
  },
  {
    id: 'area_tatami_dining',
    名称: '榻榻米餐饮包间',
    分类: '区域',
    条件: { 餐饮区: 3, 包间: 2 },
    说明: 'Phòng ăn nhỏ riêng tư và tụ họp khách quen được mở.',
    条目占位: '设施/榻榻米餐饮包间',
  },
  {
    id: 'area_shift_office',
    名称: '排班管理室',
    分类: '经营',
    条件: { 前台接待: 3, 后勤: 3 },
    说明: 'Đặt lịch, xếp ca và điều phối lượng khách ổn định hơn, giảm hỗn loạn giờ cao điểm.',
    条目占位: '设施/排班管理室',
  },
  {
    id: 'area_staff_dorm',
    名称: '员工夜班宿舍',
    分类: '经营',
    条件: { 占地规模: 2, 员工休息室: 3 },
    说明: 'Áp lực mệt mỏi của nhân viên giảm khi làm ca đêm và kinh doanh liên tục.',
    条目占位: '设施/员工夜班宿舍',
  },
  {
    id: 'area_member_lounge',
    名称: '会员休息廊',
    分类: '区域',
    条件: { 前台接待: 4, 休息区: 3 },
    说明: 'Khách quen, khách đặt lịch và hội viên dài hạn có không gian lưu lại ổn định.',
    条目占位: '设施/会员休息廊',
  },
  {
    id: 'area_supply_center',
    名称: '集中补给间',
    分类: '经营',
    条件: { 后勤: 4, 更衣清洗: 3 },
    说明: 'Hiệu quả bổ sung vật tư tiêu hao, khăn và dược liệu tăng lên, giảm áp lực chuẩn bị dịch vụ.',
    条目占位: '设施/集中补给间',
  },
  {
    id: 'area_night_lounge',
    名称: '夜间休息厅',
    分类: '区域',
    条件: { 休息区: 4 },
    说明: 'Trải nghiệm lưu lại đêm khuya được tăng cường, lượng khách ban đêm ổn định hơn.',
    条目占位: '设施/夜间休息厅',
  },
  {
    id: 'area_seasonal_bath',
    名称: '季节汤庭',
    分类: '项目',
    条件: { 汤池: 4, 庭院: 2, 后勤: 3 },
    说明: 'Sân vườn bể tắm chuẩn bị theo mùa được mở, phù hợp cho hoạt động dịp lễ.',
    条目占位: '设施/季节汤庭',
  },
  {
    id: 'area_kaiseki_kitchen',
    名称: '会席厨房',
    分类: '项目',
    条件: { 餐饮区: 4, 后勤: 4 },
    说明: 'Ẩm thực trang trọng hơn và gói lưu trú có khả năng tiếp nhận ổn định.',
    条目占位: '设施/会席厨房',
  },
  {
    id: 'area_vip_private_bath',
    名称: 'VIP庭院私汤',
    分类: '区域',
    条件: { 占地规模: 3, 包间: 4, 庭院: 3 },
    说明: 'Đặt lịch riêng tư giá cao và không gian khách quen cao cấp được mở.',
    条目占位: '设施/VIP庭院私汤',
  },
  {
    id: 'area_long_stay',
    名称: '长住客房',
    分类: '区域',
    条件: { 餐饮区: 3, 客房: 4 },
    说明: 'Lưu trú dài hạn, dưỡng bệnh và đặt lịch xuyên ngày tự nhiên hơn.',
    条目占位: '设施/长住客房',
  },
  {
    id: 'area_training',
    名称: '员工培训室',
    分类: '经营',
    条件: { 员工休息室: 4, 后勤: 3 },
    说明: 'Đào tạo nhân viên và tính ổn định được nâng cao hơn nữa.',
    条目占位: '设施/员工培训室',
  },
  {
    id: 'area_group_reservation',
    名称: '团体包场区',
    分类: '区域',
    条件: { 占地规模: 4, 休息区: 3, 包间: 3 },
    说明: 'Dung lượng khách đoàn, đặt lịch dịp lễ và gói hoạt động được tăng lên.',
    条目占位: '设施/团体包场区',
  },
  {
    id: 'area_sky_bath',
    名称: '天台观景汤',
    分类: '项目',
    条件: { 占地规模: 4, 汤池: 5, 庭院: 4 },
    说明: 'Bể tắm ngắm cảnh trên cao được mở, trở thành mục tiêu đặt lịch giá cao ở giai đoạn sau.',
    条目占位: '设施/天台观景汤',
  },
  {
    id: 'area_private_lodging',
    名称: '私宅式客房',
    分类: '区域',
    条件: { 客房: 5, 包间: 4 },
    说明: 'Trải nghiệm lưu trú độc lập hoàn chỉnh hơn được mở, phù hợp khách ở dài hạn cao cấp.',
    条目占位: '设施/私宅式客房',
  },
  {
    id: 'area_annex',
    名称: '别馆',
    分类: '区域',
    条件: { 占地规模: 5, 汤池: 4, 包间: 5, 客房: 4 },
    说明: 'Biệt quán độc lập được mở, tiếp nhận lưu trú cao cấp và đặt lịch dài hạn.',
    条目占位: '设施/别馆',
  },
];

const INITIAL_BUILDING_IDS = new Set([
  'area_lobby',
  'area_changing',
  'area_indoor_bath',
  'area_rest_hall',
  'area_massage',
  'area_basic_room',
  'area_tea_corner',
  'area_guest_room',
  'area_garden_path',
  'area_staff_room',
  'area_office',
]);

const PROJECT_CATALOG: BossProjectDefinition[] = [
  {
    名称: '入浴休憩',
    基础价格: 420,
    评分: 4.5,
    推荐值: 82,
    设施需求: '汤池',
    容量: 22,
    成本率: 0.04,
    条件: { 汤池: 1 },
    建筑需求: ['area_indoor_bath'],
  },
  {
    名称: '休息区陪同',
    基础价格: 600,
    评分: 4.6,
    推荐值: 86,
    设施需求: '休息室',
    容量: 18,
    成本率: 0.05,
    条件: { 休息区: 1 },
    建筑需求: ['area_rest_hall'],
  },
  {
    名称: '理疗按摩',
    基础价格: 900,
    评分: 4.8,
    推荐值: 92,
    设施需求: '理疗区',
    容量: 16,
    成本率: 0.08,
    条件: { 理疗区: 1 },
    建筑需求: ['area_massage'],
  },
  {
    名称: '包间休憩',
    基础价格: 980,
    评分: 4.3,
    推荐值: 74,
    设施需求: '包间',
    容量: 8,
    成本率: 0.08,
    条件: { 包间: 1 },
    建筑需求: ['area_basic_room'],
  },
  {
    名称: '药汤护理',
    基础价格: 1180,
    评分: 4.4,
    推荐值: 76,
    设施需求: '汤池',
    容量: 10,
    成本率: 0.11,
    条件: { 汤池: 2, 后勤: 2 },
    建筑需求: ['area_herbal_bath'],
  },
  {
    名称: '私汤包间',
    基础价格: 1400,
    评分: 4.2,
    推荐值: 72,
    设施需求: '包间',
    容量: 10,
    成本率: 0.1,
    条件: { 包间: 2, 汤池: 2 },
    建筑需求: ['area_private_bath'],
  },
  {
    名称: '精油理疗',
    基础价格: 1600,
    评分: 4.5,
    推荐值: 78,
    设施需求: '理疗区',
    容量: 10,
    成本率: 0.13,
    条件: { 理疗区: 2, 后勤: 2 },
    建筑需求: ['area_oil_therapy'],
  },
  {
    名称: '香氛蒸房',
    基础价格: 860,
    评分: 4.4,
    推荐值: 74,
    设施需求: '更衣清洗',
    容量: 14,
    成本率: 0.08,
    条件: { 更衣清洗: 2, 后勤: 2 },
    建筑需求: ['area_steam_room'],
  },
  {
    名称: '足汤茶会',
    基础价格: 760,
    评分: 4.5,
    推荐值: 78,
    设施需求: '庭院',
    容量: 14,
    成本率: 0.12,
    条件: { 庭院: 2, 餐饮区: 2 },
    建筑需求: ['area_foot_bath_bar'],
  },
  {
    名称: '露天夜汤',
    基础价格: 1280,
    评分: 4.7,
    推荐值: 82,
    设施需求: '汤池',
    容量: 12,
    成本率: 0.09,
    条件: { 占地规模: 2, 汤池: 3, 庭院: 2 },
    建筑需求: ['area_open_air'],
  },
  {
    名称: '岩盘热敷',
    基础价格: 1320,
    评分: 4.6,
    推荐值: 80,
    设施需求: '理疗区',
    容量: 12,
    成本率: 0.1,
    条件: { 汤池: 3, 理疗区: 2, 后勤: 2 },
    建筑需求: ['area_bedrock_bath'],
  },
  {
    名称: '餐饮套餐',
    基础价格: 520,
    评分: 4.2,
    推荐值: 68,
    设施需求: '餐饮区',
    容量: 20,
    成本率: 0.18,
    条件: { 餐饮区: 2, 后勤: 2 },
    建筑需求: ['area_kitchen'],
  },
  {
    名称: '静音长休',
    基础价格: 720,
    评分: 4.4,
    推荐值: 72,
    设施需求: '休息室',
    容量: 16,
    成本率: 0.05,
    条件: { 休息区: 3, 庭院: 2 },
    建筑需求: ['area_quiet_library'],
  },
  {
    名称: '美容护理',
    基础价格: 1880,
    评分: 4.5,
    推荐值: 76,
    设施需求: '理疗区',
    容量: 8,
    成本率: 0.16,
    条件: { 理疗区: 3, 包间: 2 },
    建筑需求: ['area_beauty_care'],
  },
  {
    名称: '会员夜茶',
    基础价格: 980,
    评分: 4.4,
    推荐值: 75,
    设施需求: '休息室',
    容量: 16,
    成本率: 0.14,
    条件: { 前台接待: 4, 休息区: 3 },
    建筑需求: ['area_member_lounge'],
  },
  {
    名称: '季节限定汤',
    基础价格: 1680,
    评分: 4.8,
    推荐值: 84,
    设施需求: '汤池',
    容量: 12,
    成本率: 0.14,
    条件: { 汤池: 4, 庭院: 2, 后勤: 3 },
    建筑需求: ['area_seasonal_bath'],
  },
  {
    名称: '会席料理',
    基础价格: 1280,
    评分: 4.6,
    推荐值: 78,
    设施需求: '餐饮区',
    容量: 12,
    成本率: 0.22,
    条件: { 餐饮区: 4, 后勤: 4 },
    建筑需求: ['area_kaiseki_kitchen'],
  },
  {
    名称: '住宿包场',
    基础价格: 1800,
    评分: 4.3,
    推荐值: 70,
    设施需求: '客房',
    容量: 8,
    成本率: 0.12,
    条件: { 客房: 2, 包间: 2 },
    建筑需求: ['area_washitsu_room'],
  },
  {
    名称: 'VIP庭院私汤',
    基础价格: 3600,
    评分: 4.8,
    推荐值: 86,
    设施需求: '包间',
    容量: 4,
    成本率: 0.16,
    条件: { 占地规模: 3, 包间: 4, 庭院: 3 },
    建筑需求: ['area_vip_private_bath'],
  },
  {
    名称: '团体包场',
    基础价格: 2600,
    评分: 4.2,
    推荐值: 72,
    设施需求: '休息室',
    容量: 10,
    成本率: 0.13,
    条件: { 占地规模: 4, 休息区: 3, 包间: 3 },
    建筑需求: ['area_group_reservation'],
  },
  {
    名称: '私宅长住',
    基础价格: 4200,
    评分: 4.6,
    推荐值: 80,
    设施需求: '客房',
    容量: 5,
    成本率: 0.18,
    条件: { 客房: 5, 包间: 4 },
    建筑需求: ['area_private_lodging'],
  },
  {
    名称: '天台观景汤',
    基础价格: 3200,
    评分: 4.9,
    推荐值: 88,
    设施需求: '汤池',
    容量: 6,
    成本率: 0.16,
    条件: { 占地规模: 4, 汤池: 5, 庭院: 4 },
    建筑需求: ['area_sky_bath'],
  },
  {
    名称: '别馆整宿预约',
    基础价格: 6800,
    评分: 4.9,
    推荐值: 90,
    设施需求: '客房',
    容量: 3,
    成本率: 0.2,
    条件: { 占地规模: 5, 汤池: 4, 包间: 5, 客房: 4 },
    建筑需求: ['area_annex'],
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function money(value: number): number {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

function average(values: number[], fallback: number): number {
  if (values.length === 0) {
    return fallback;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isInfrastructureKey(value: string): value is BossInfrastructureKey {
  return value in INFRASTRUCTURE_LABELS;
}

function normalizeInfrastructure(value: Partial<BossInfrastructure> | undefined): BossInfrastructure {
  const next: BossInfrastructure = { ...DEFAULT_INFRASTRUCTURE, ...(value ?? {}) };
  (Object.keys(INFRASTRUCTURE_LABELS) as BossInfrastructureKey[]).forEach(key => {
    next[key] = Math.round(clamp(next[key], 1, INFRASTRUCTURE_MAX_LEVEL));
  });
  next.维护度 = Math.round(clamp(next.维护度, 0, 100));
  return next;
}

function getPrimaryRequirementKey(requirement: BossInfrastructureRequirement): BossInfrastructureKey {
  const entries = Object.keys(requirement) as BossInfrastructureKey[];
  return entries[0] ?? '占地规模';
}

function isRequirementMet(infra: BossInfrastructure, requirement: BossInfrastructureRequirement): boolean {
  return (Object.entries(requirement) as [BossInfrastructureKey, number][]).every(
    ([key, level]) => infra[key] >= level,
  );
}

function getMissingRequirements(infra: BossInfrastructure, requirement: BossInfrastructureRequirement): string[] {
  return (Object.entries(requirement) as [BossInfrastructureKey, number][])
    .filter(([key, level]) => infra[key] < level)
    .map(([key, level]) => `${INFRASTRUCTURE_LABELS[key]} cấp ${level}`);
}

function makeBuildingStateFromDefinition(
  definition: BossInfrastructureUnlock,
  value: Partial<BossBuildingState> | undefined,
  infra: BossInfrastructure,
): BossBuildingState {
  const initialBuilt = INITIAL_BUILDING_IDS.has(definition.id);
  const storedStatus = value?.状态;
  const storedLevel = Math.round(clamp(value?.等级 ?? (initialBuilt ? 1 : 0), 0, BUILDING_MAX_LEVEL));
  const level = initialBuilt ? Math.max(1, storedLevel) : storedLevel;
  const built = storedStatus === '已建成' || level > 0 || initialBuilt;
  let status: BossBuildingStatus = built ? '已建成' : isRequirementMet(infra, definition.条件) ? '可扩建' : '未开放';

  if (storedStatus === '施工中' || storedStatus === '待验收') {
    status = storedStatus;
  }

  return {
    id: definition.id,
    状态: status,
    等级: status === '未开放' || status === '可扩建' ? 0 : level,
  };
}

function normalizeBuildings(value: unknown, infra: BossInfrastructure): BossBuildingState[] {
  const source = Array.isArray(value) ? value : [];
  const map = new Map(
    source
      .filter(item => item && typeof item === 'object' && !Array.isArray(item))
      .map(item => {
        const partial = item as Partial<BossBuildingState>;
        return [partial.id, partial] as const;
      }),
  );
  return INFRASTRUCTURE_UNLOCKS.map(definition =>
    makeBuildingStateFromDefinition(definition, map.get(definition.id), infra),
  );
}

function normalizeMarketingCampaigns(value: unknown): BossMarketingCampaign[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(item => item && typeof item === 'object' && !Array.isArray(item))
    .map(item => {
      const source = item as Partial<BossMarketingCampaign>;
      return {
        id: source.id || `campaign-${Date.now().toString(36)}`,
        名称: source.名称 || 'Chiến dịch quảng bá',
        剩余天数: Math.round(clamp(source.剩余天数 ?? 0, 0, 14)),
        客流加成: Number(clamp(source.客流加成 ?? 0, 0, 0.5).toFixed(2)),
        推荐加成: Math.round(clamp(source.推荐加成 ?? 0, 0, 12)),
        说明: source.说明 || 'Tăng lượng khách gần đây và độ hot dự án.',
      };
    })
    .filter(item => item.剩余天数 > 0);
}

function normalizeProjectBoosts(value: unknown): BossProjectBoost[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(item => item && typeof item === 'object' && !Array.isArray(item))
    .map(item => {
      const source = item as Partial<BossProjectBoost>;
      return {
        id: source.id || `quality-${Date.now().toString(36)}`,
        项目: source.项目 || '',
        剩余天数: Math.round(clamp(source.剩余天数 ?? 0, 0, 14)),
        推荐加成: Math.round(clamp(source.推荐加成 ?? 0, 0, 16)),
        评分加成: Number(clamp(source.评分加成 ?? 0, 0, 0.4).toFixed(2)),
        说明: source.说明 || 'Tăng trải nghiệm dự án tương ứng.',
      };
    })
    .filter(item => item.项目 && item.剩余天数 > 0);
}

function normalizeStaffCare(value: unknown): BossStaffCare {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? (value as Partial<BossStaffCare>) : {};
  return {
    剩余天数: Math.round(clamp(source.剩余天数 ?? 0, 0, 14)),
    满意加成: Math.round(clamp(source.满意加成 ?? 0, 0, 12)),
    疲劳恢复: Math.round(clamp(source.疲劳恢复 ?? 0, 0, 18)),
  };
}

function syncBuildingsWithProjects(
  buildings: BossBuildingState[],
  projects: BossConstructionProject[],
): BossBuildingState[] {
  return buildings.map(building => {
    const project = projects.find(item => item.类型 === '建筑' && item.建筑ID === building.id);
    if (!project) {
      return building;
    }
    return {
      ...building,
      状态: project.状态,
    };
  });
}

function getBuildingState(buildings: BossBuildingState[], id: string): BossBuildingState | undefined {
  return buildings.find(item => item.id === id);
}

function isBuildingBuilt(buildings: BossBuildingState[], id: string): boolean {
  return getBuildingState(buildings, id)?.状态 === '已建成';
}

function getBuiltBuildingDefinitions(buildings: BossBuildingState[]): BossInfrastructureUnlock[] {
  return INFRASTRUCTURE_UNLOCKS.filter(item => isBuildingBuilt(buildings, item.id));
}

function getBuildingLevel(buildings: BossBuildingState[], id: string): number {
  return getBuildingState(buildings, id)?.等级 ?? 0;
}

function isProjectBuildingRequirementMet(buildings: BossBuildingState[], definition: BossProjectDefinition): boolean {
  return (definition.建筑需求 ?? []).every(id => isBuildingBuilt(buildings, id));
}

function getUnlockedItems(buildings: BossBuildingState[]): BossInfrastructureUnlock[] {
  return getBuiltBuildingDefinitions(buildings);
}

function getLockedItems(buildings: BossBuildingState[]): BossInfrastructureUnlock[] {
  return INFRASTRUCTURE_UNLOCKS.filter(item => !isBuildingBuilt(buildings, item.id));
}

function getNextUnlocksForKey(infra: BossInfrastructure, key: BossInfrastructureKey): BossInfrastructureUnlock[] {
  const nextLevel = Math.min(INFRASTRUCTURE_MAX_LEVEL, infra[key] + 1);
  return INFRASTRUCTURE_UNLOCKS.filter(item => !INITIAL_BUILDING_IDS.has(item.id))
    .filter(item => {
      const requiredLevel = item.条件[key];
      if (!requiredLevel || requiredLevel > nextLevel) {
        return false;
      }
      return (Object.entries(item.条件) as [BossInfrastructureKey, number][]).every(([requirementKey, level]) => {
        if (requirementKey === key) {
          return nextLevel >= level;
        }
        return infra[requirementKey] >= level || infra[requirementKey] + 1 >= level;
      });
    })
    .slice(0, 3);
}

function getUnlockedAreaCatalog(infra: BossInfrastructure, buildings: BossBuildingState[]): BossAreaCatalogItem[] {
  const built = getBuiltBuildingDefinitions(buildings).filter(item => item.分类 === '区域');
  const dynamicAreas = built.map(item => ({
    名称: item.名称,
    设施: getPrimaryRequirementKey(item.条件),
    最低等级: 1,
    权重: item.id === 'area_staff_room' || item.id === 'area_office' ? 0 : item.分类 === '区域' ? 0.08 : 0,
    说明: item.说明,
  }));
  const baseFallback = AREA_CATALOG.filter(area => infra[area.设施] >= area.最低等级);
  const merged = new Map([...baseFallback, ...dynamicAreas].map(area => [area.名称, area]));
  return [...merged.values()];
}

function getUnlockedProjectDefinitions(
  infra: BossInfrastructure,
  buildings: BossBuildingState[],
): BossProjectDefinition[] {
  return PROJECT_CATALOG.filter(
    project => isRequirementMet(infra, project.条件) && isProjectBuildingRequirementMet(buildings, project),
  );
}

function makeUnlockedProjects(
  savedProjects: BossProject[],
  infra: BossInfrastructure,
  buildings: BossBuildingState[],
): BossProject[] {
  const saved = new Map(savedProjects.map(project => [project.名称, project]));
  return getUnlockedProjectDefinitions(infra, buildings).map(definition => {
    const current = saved.get(definition.名称);
    return {
      名称: definition.名称,
      基础价格: money(current?.基础价格 ?? definition.基础价格),
      评分: Number(clamp(current?.评分 ?? definition.评分, 1, 5).toFixed(1)),
      推荐值: Math.round(clamp(current?.推荐值 ?? definition.推荐值, 30, 100)),
      热度: makeProjectHeat(current?.推荐值 ?? definition.推荐值),
      设施需求: definition.设施需求,
      容量: money(current?.容量 ?? definition.容量),
      成本率: Number(clamp(current?.成本率 ?? definition.成本率, 0, 0.6).toFixed(2)),
      今日订单: money(current?.今日订单 ?? 0),
    };
  });
}

function isExternalHolidayEffect(effect: BossHolidayEffect | undefined): boolean {
  return effect?.来源 === '前端写入' || effect?.来源 === '世界书判定';
}

function makeDateHolidayEffect(dateLabel: string): BossHolidayEffect {
  if (/Thứ Bảy|Chủ Nhật/.test(dateLabel)) {
    return {
      状态: '休息日',
      名称: 'Ngày nghỉ',
      客流倍率: 1.12,
      价格倍率: 1.05,
      活动倍率: 1.1,
      说明: 'Ngày nghỉ có lượng khách và ý muốn lưu lại cao hơn một chút.',
      来源: '日期判定',
    };
  }
  return { ...DEFAULT_HOLIDAY_EFFECT };
}

function normalizeHolidayEffect(effect: BossHolidayEffect | undefined, dateLabel: string): BossHolidayEffect {
  const base = isExternalHolidayEffect(effect) ? effect! : makeDateHolidayEffect(dateLabel);
  return {
    状态: base.状态 ?? '平日',
    名称: base.名称 || base.状态 || 'Ngày thường',
    客流倍率: Number(clamp(base.客流倍率 ?? 1, 0.4, 2.4).toFixed(2)),
    价格倍率: Number(clamp(base.价格倍率 ?? 1, 0.5, 2.2).toFixed(2)),
    活动倍率: Number(clamp(base.活动倍率 ?? 1, 0, 2.5).toFixed(2)),
    说明: base.说明 || 'Thay đổi lượng khách và giá dịp lễ đã có hiệu lực.',
    来源: base.来源 ?? '日期判定',
  };
}

function normalizeConstructionProject(value: unknown, state: BossPageState): BossConstructionProject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const source = value as Partial<BossConstructionProject>;
  const type = source.类型 === '建筑' ? '建筑' : '基建';
  if (!source.设施 || !isInfrastructureKey(source.设施)) {
    return null;
  }
  const facility = source.设施;
  const currentLevel = Math.round(
    clamp(
      source.当前等级 ?? state.基建[facility],
      type === '建筑' ? 0 : 1,
      type === '建筑' ? BUILDING_MAX_LEVEL : INFRASTRUCTURE_MAX_LEVEL,
    ),
  );
  const targetLevel = Math.min(
    type === '建筑' ? BUILDING_MAX_LEVEL : INFRASTRUCTURE_MAX_LEVEL,
    Math.max(currentLevel + 1, money(source.目标等级 ?? currentLevel + 1)),
  );
  const buildingDefinition =
    type === '建筑' ? INFRASTRUCTURE_UNLOCKS.find(item => item.id === source.建筑ID) : undefined;
  const totalCost = money(
    source.总费用 ??
      (buildingDefinition
        ? getBuildingProjectCostByLevel(buildingDefinition, currentLevel)
        : getInfrastructureUpgradeCostByLevel(facility, currentLevel)),
  );
  const totalDays = Math.max(
    1,
    Math.round(
      source.总天数 ??
        (buildingDefinition
          ? makeBuildingProjectDays(buildingDefinition, currentLevel)
          : makeConstructionDays(facility, currentLevel)),
    ),
  );
  const remainingDays = Math.max(0, Math.round(source.剩余天数 ?? totalDays));
  const status: BossConstructionStatus = source.状态 === '待验收' || remainingDays <= 0 ? '待验收' : '施工中';

  return {
    id: source.id || makeConstructionId(facility, state.营业日),
    类型: type,
    设施: facility,
    建筑ID: source.建筑ID,
    名称: source.名称 || buildingDefinition?.名称 || INFRASTRUCTURE_LABELS[facility],
    当前等级: currentLevel,
    目标等级: targetLevel,
    状态: status,
    总费用: totalCost,
    已支付: money(source.已支付 ?? 0),
    每日消耗: money(source.每日消耗 ?? totalCost * 0.18),
    总天数: totalDays,
    剩余天数: status === '待验收' ? 0 : remainingDays,
    开工日: money(source.开工日 ?? state.营业日),
    验收日: source.验收日 || `第${state.营业日 + remainingDays}日`,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeLedgerId(day: number, name: string): string {
  return `${day}-${name}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeConstructionId(key: BossInfrastructureKey, day: number): string {
  return `construction-${key}-${day}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getInfrastructureUpgradeCostByLevel(key: BossInfrastructureKey, current: number): number {
  if (current >= INFRASTRUCTURE_MAX_LEVEL) {
    return 0;
  }
  const weight = INFRASTRUCTURE_COST_WEIGHT[key] ?? 1;
  return money((18000 + current * current * 5200 + (key === '占地规模' ? 18000 : 0)) * weight);
}

function makeConstructionDays(key: BossInfrastructureKey, current: number): number {
  const extra = key === '占地规模' ? 2 : key === '客房' || key === '庭院' || key === '汤池' ? 1 : 0;
  return Math.max(1, Math.min(9, 1 + Math.ceil(current / 2) + extra));
}

function getBuildingProjectCostByLevel(definition: BossInfrastructureUnlock, current: number): number {
  if (current >= BUILDING_MAX_LEVEL) {
    return 0;
  }
  const requirementTotal = (Object.values(definition.条件) as number[]).reduce((sum, value) => sum + value, 0);
  const categoryWeight = definition.分类 === '经营' ? 0.88 : definition.分类 === '项目' ? 0.96 : 1;
  const buildWeight = current <= 0 ? 1.28 : 0.9;
  return money(
    (16000 + Math.max(1, current) * Math.max(1, current) * 4200 + requirementTotal * 3600) *
      categoryWeight *
      buildWeight,
  );
}

function makeBuildingProjectDays(definition: BossInfrastructureUnlock, current: number): number {
  const requirementTotal = (Object.values(definition.条件) as number[]).reduce((sum, value) => sum + value, 0);
  return Math.max(1, Math.min(8, 1 + Math.ceil(requirementTotal / 4) + (current <= 0 ? 1 : Math.ceil(current / 2))));
}

function appendLedgerEntry(state: BossPageState, entry: Omit<BossLedgerEntry, 'id' | '营业日'>): BossPageState {
  const next = clone(state);
  const fullEntry: BossLedgerEntry = {
    ...entry,
    id: makeLedgerId(next.营业日, entry.名称),
    营业日: next.营业日,
    金额: money(entry.金额),
    资金变动: Math.round(entry.资金变动),
  };
  next.账本 = [...next.账本, fullEntry].slice(-80);
  next.资金 = Math.max(0, Math.round(next.资金 + fullEntry.资金变动));
  return recalculateBossState(next);
}

function infrastructureCapacity(infra: BossInfrastructure): number {
  return (
    8 +
    infra.占地规模 * 7 +
    infra.前台接待 * 3 +
    infra.更衣清洗 * 2 +
    infra.汤池 * 5 +
    infra.休息区 * 3 +
    infra.理疗区 * 2 +
    infra.包间 * 3 +
    infra.餐饮区 * 2 +
    infra.客房 * 4 +
    infra.庭院 * 2 +
    infra.后勤
  );
}

function infrastructureLevelTotal(infra: BossInfrastructure): number {
  return (Object.keys(INFRASTRUCTURE_LABELS) as BossInfrastructureKey[]).reduce((sum, key) => sum + infra[key], 0);
}

function builtBuildingLevelTotal(buildings: BossBuildingState[], category?: BossUnlockCategory): number {
  return INFRASTRUCTURE_UNLOCKS.reduce((sum, definition) => {
    if (category && definition.分类 !== category) {
      return sum;
    }
    const building = getBuildingState(buildings, definition.id);
    return building?.状态 === '已建成' ? sum + building.等级 : sum;
  }, 0);
}

function builtBuildingCount(buildings: BossBuildingState[], category?: BossUnlockCategory): number {
  return INFRASTRUCTURE_UNLOCKS.reduce((sum, definition) => {
    if (category && definition.分类 !== category) {
      return sum;
    }
    return isBuildingBuilt(buildings, definition.id) ? sum + 1 : sum;
  }, 0);
}

function buildingCapacityBonus(buildings: BossBuildingState[]): number {
  const areaLevel = builtBuildingLevelTotal(buildings, '区域');
  const projectLevel = builtBuildingLevelTotal(buildings, '项目');
  const businessLevel = builtBuildingLevelTotal(buildings, '经营');
  return Math.round(areaLevel * 1.35 + projectLevel * 0.9 + businessLevel * 0.45);
}

function storeCapacity(state: Pick<BossPageState, '基建' | '建筑'>): number {
  return infrastructureCapacity(state.基建) + buildingCapacityBonus(state.建筑);
}

function buildingAppealFactor(buildings: BossBuildingState[]): number {
  const areaLevel = builtBuildingLevelTotal(buildings, '区域');
  const projectLevel = builtBuildingLevelTotal(buildings, '项目');
  const premium =
    getBuildingLevel(buildings, 'area_vip_private_bath') +
    getBuildingLevel(buildings, 'area_sky_bath') +
    getBuildingLevel(buildings, 'area_annex') +
    getBuildingLevel(buildings, 'area_private_lodging');
  return clamp(1 + areaLevel * 0.004 + projectLevel * 0.006 + premium * 0.012, 0.92, 1.24);
}

function buildingOperatingCost(buildings: BossBuildingState[]): number {
  const builtLevel = builtBuildingLevelTotal(buildings);
  const openCount = builtBuildingCount(buildings);
  const projectLevel = builtBuildingLevelTotal(buildings, '项目');
  const premiumLevel =
    getBuildingLevel(buildings, 'area_vip_private_bath') +
    getBuildingLevel(buildings, 'area_sky_bath') +
    getBuildingLevel(buildings, 'area_annex') +
    getBuildingLevel(buildings, 'area_private_lodging');
  return money(openCount * 180 + builtLevel * 165 + projectLevel * 95 + premiumLevel * 260);
}

function servicePreparationFactor(buildings: BossBuildingState[]): number {
  const support =
    getBuildingLevel(buildings, 'area_wash_storage') +
    getBuildingLevel(buildings, 'area_supply_center') +
    getBuildingLevel(buildings, 'area_shift_office');
  return clamp(1 - support * 0.018, 0.78, 1);
}

function staffRecoveryBonus(buildings: BossBuildingState[]): number {
  return (
    getBuildingLevel(buildings, 'area_staff_dorm') * 2 +
    getBuildingLevel(buildings, 'area_training') * 1.5 +
    getBuildingLevel(buildings, 'area_shift_office')
  );
}

function maintenanceDecayMitigation(buildings: BossBuildingState[]): number {
  return (
    getBuildingLevel(buildings, 'area_wash_storage') * 0.18 +
    getBuildingLevel(buildings, 'area_supply_center') * 0.22 +
    getBuildingLevel(buildings, 'area_shift_office') * 0.08
  );
}

function projectFacilityCapacity(infra: BossInfrastructure, facility: string): number {
  const facilityMap: Record<string, BossInfrastructureKey> = {
    大堂: '前台接待',
    更衣清洗: '更衣清洗',
    汤池: '汤池',
    休息室: '休息区',
    理疗区: '理疗区',
    包间: '包间',
    餐饮区: '餐饮区',
    客房: '客房',
    庭院: '庭院',
    员工休息室: '员工休息室',
    办公室: '后勤',
  };
  const key = facilityMap[facility] ?? (isInfrastructureKey(facility) ? facility : '占地规模');
  const scale =
    key === '汤池' ? 4 : key === '包间' || key === '客房' ? 3 : key === '理疗区' || key === '餐饮区' ? 2 : 2;
  return Math.max(2, infra[key] * scale);
}

function isRestSlot(slot: string): boolean {
  return slot === '休息';
}

function isCleanSlot(slot: string): boolean {
  return slot === '清洁';
}

function isDutySlot(slot: string): boolean {
  return slot === '待命' || slot === '前台' || slot === '店务管理' || slot === '办公室' || slot === '员工休息室';
}

function isReceptionSlot(slot: string): boolean {
  return !isRestSlot(slot) && !isCleanSlot(slot) && !isDutySlot(slot);
}

function countWorkingSlots(employee: BossEmployee): number {
  return employee.排班.filter(slot => slot !== '休息').length;
}

function makeEmployeeDayReport(state: BossPageState, employee: BossEmployee): BossEmployeeDayReport {
  const slots = employee.排班.length > 0 ? employee.排班 : ['休息'];
  const restSlots = slots.filter(isRestSlot).length;
  const cleanSlots = slots.filter(isCleanSlot).length;
  const dutySlots = slots.filter(isDutySlot).length;
  const receptionSlots = slots.filter(isReceptionSlot).length;
  const closed = state.营业状态 === '今日停业';
  const activeReceptionSlots = closed ? 0 : receptionSlots;
  const activeDutySlots = dutySlots + (closed ? receptionSlots : 0);

  let role: BossEmployeeDayRole = '休息';
  if (cleanSlots > 0 && cleanSlots >= activeReceptionSlots && cleanSlots >= activeDutySlots) {
    role = '清洁';
  } else if (activeReceptionSlots > 0) {
    role = '接待';
  } else if (activeDutySlots > 0) {
    role = '值班';
  }

  const workSegments = activeReceptionSlots + activeDutySlots + cleanSlots;
  const salaryMultiplier = workSegments > 0 ? 1 : 0.22;
  const fatigueChange = Math.round(activeReceptionSlots * 7 + activeDutySlots * 4 + cleanSlots * 5 - restSlots * 7);
  const satisfactionChange = Math.round(
    (salaryMultiplier >= 1 ? 1 : -1) + restSlots * 0.8 - activeReceptionSlots * 0.3 - cleanSlots * 0.2,
  );
  const roleText: Record<BossEmployeeDayRole, string> = {
    接待: 'Phát lương ngày theo vị trí tiếp đón.',
    值班: 'Phát lương ngày theo vị trí trực ca.',
    清洁: 'Phát lương ngày theo công việc dọn dẹp.',
    休息: 'Chỉ phát trợ cấp lưu dụng tối thiểu.',
  };

  return {
    员工: employee.姓名,
    角色: role,
    接待段: activeReceptionSlots,
    值班段: activeDutySlots,
    清洁段: cleanSlots,
    休息段: restSlots,
    工资: money(employee.日薪 * salaryMultiplier),
    工资倍率: Number(salaryMultiplier.toFixed(2)),
    疲劳变化: fatigueChange,
    满意变化: satisfactionChange,
    说明: roleText[role],
  };
}

function makeEmployeeDayReports(state: BossPageState): BossEmployeeDayReport[] {
  return state.员工.map(employee => makeEmployeeDayReport(state, employee));
}

function countProjectStaff(state: BossPageState, facility: string): number {
  return state.员工.filter(employee => employee.排班.includes(facility)).length;
}

function computeTraffic(state: BossPageState): number {
  if (state.营业状态 === '今日停业') {
    return 0;
  }

  const capacity = storeCapacity(state);
  const workingSlots = state.员工.reduce((sum, employee) => sum + countWorkingSlots(employee), 0);
  const expectedSlots = Math.max(4, state.员工.length * 2.25);
  const ratingFactor = clamp(state.店铺评分 / 5, 0.45, 1.18);
  const projectFactor = clamp(
    average(
      state.项目.map(project => project.推荐值),
      70,
    ) / 82,
    0.58,
    1.18,
  );
  const coverageFactor = clamp(workingSlots / expectedSlots, 0.46, 1.12);
  const maintenanceFactor = clamp(state.基建.维护度 / 92, 0.55, 1.05);
  const satisfactionFactor = clamp(
    average(
      state.员工.map(employee => employee.满意度),
      70,
    ) / 82,
    0.76,
    1.03,
  );
  const campaignFactor = clamp(1 + state.宣传活动.reduce((sum, campaign) => sum + campaign.客流加成, 0), 1, 1.65);
  const appealFactor = buildingAppealFactor(state.建筑);
  const utilizationFactor = clamp(
    0.58 + state.店铺评分 * 0.025 + state.好评率 * 0.04 + builtBuildingLevelTotal(state.建筑) * 0.0015,
    0.56,
    0.9,
  );
  const openTraffic = Math.round(
    clamp(
      capacity *
        utilizationFactor *
        ratingFactor *
        projectFactor *
        coverageFactor *
        maintenanceFactor *
        satisfactionFactor *
        state.节假日.客流倍率 *
        campaignFactor *
        appealFactor,
      MIN_TRAFFIC,
      capacity,
    ),
  );
  if (state.营业状态 === '暂停营业') {
    return Math.max(0, Math.min(openTraffic, state.暂停保留客流 || openTraffic));
  }
  return openTraffic;
}

function computeProjectOrders(state: BossPageState, traffic: number): BossProject[] {
  const projectWeights = state.项目.map(project => {
    const priceFactor = clamp(850 / Math.max(360, project.基础价格), 0.62, 1.18);
    const projectBoost = state.品质投入.filter(boost => boost.项目 === project.名称);
    const activeBoost = projectBoost.reduce((sum, boost) => sum + boost.推荐加成, 0);
    const campaignBoost = state.宣传活动.reduce((sum, campaign) => sum + campaign.推荐加成, 0);
    const effectiveRecommendation = clamp(project.推荐值 + activeBoost + campaignBoost, 30, 120);
    const effectiveRating = clamp(project.评分 + projectBoost.reduce((sum, boost) => sum + boost.评分加成, 0), 1, 5);
    const ratingFactor = clamp(effectiveRating / 4.5, 0.65, 1.16);
    return Math.max(0.05, (effectiveRecommendation / 100) * ratingFactor * priceFactor);
  });
  const totalWeight = projectWeights.reduce((sum, value) => sum + value, 0) || 1;

  return state.项目.map((project, index) => {
    const staffCapacity = countProjectStaff(state, project.设施需求) * 3;
    const facilityCapacity = projectFacilityCapacity(state.基建, project.设施需求);
    const buildingBonus =
      PROJECT_CATALOG.find(item => item.名称 === project.名称)?.建筑需求?.reduce(
        (sum, id) => sum + getBuildingLevel(state.建筑, id),
        0,
      ) ?? 0;
    const capacity = Math.max(
      1,
      Math.min(project.容量 + buildingBonus, staffCapacity + facilityCapacity + buildingBonus),
    );
    const demand = Math.round(traffic * 0.68 * (projectWeights[index] / totalWeight));
    const 今日订单 = Math.max(0, Math.min(capacity, demand));
    return {
      ...project,
      今日订单,
      热度: makeProjectHeat(project.推荐值),
    };
  });
}

function computeEmployeeOwnedIncome(state: BossPageState, projects: BossProject[]): Map<string, number> {
  const income = new Map<string, number>();
  state.员工.forEach(employee => income.set(employee.姓名, 0));

  state.指名.forEach(item => {
    income.set(item.员工, (income.get(item.员工) ?? 0) + money(item.每日指名费 + item.预计小费));
  });

  const projectOrderTotal = projects.reduce((sum, project) => sum + project.今日订单, 0);
  if (projectOrderTotal <= 0) {
    return income;
  }

  const reports = new Map(makeEmployeeDayReports(state).map(report => [report.员工, report]));
  state.员工.forEach(employee => {
    const report = reports.get(employee.姓名);
    const receptionSegments = report?.接待段 ?? 0;
    if (receptionSegments <= 0) {
      return;
    }
    const grade = GRADE_MULTIPLIER[employee.评级] ?? 0.9;
    const tip = Math.round(receptionSegments * 45 * grade * clamp(employee.评分 / 80, 0.7, 1.28));
    income.set(employee.姓名, (income.get(employee.姓名) ?? 0) + tip);
  });

  return income;
}

function makeProjectHeat(recommendation: number): string {
  if (recommendation >= 90) {
    return 'Nổi bật';
  }
  if (recommendation >= 76) {
    return 'Ổn định';
  }
  if (recommendation >= 62) {
    return 'Đang phục hồi';
  }
  return 'Ế ẩm';
}

function makeAreaList(state: BossPageState, traffic: number): BossArea[] {
  const currentAreas = new Map(state.区域.map(area => [area.名称, area]));
  const areas = getUnlockedAreaCatalog(state.基建, state.建筑);
  const trafficAreas = areas.filter(area => area.权重 > 0);
  const totalWeight = trafficAreas.reduce((sum, area) => sum + area.权重, 0) || 1;
  let remaining = traffic;
  return areas.map(area => {
    const trafficIndex = trafficAreas.findIndex(item => item.名称 === area.名称);
    const isLastTrafficArea = trafficIndex === trafficAreas.length - 1;
    const guestCount =
      area.权重 <= 0
        ? 0
        : isLastTrafficArea
          ? Math.max(0, remaining)
          : Math.max(0, Math.floor(traffic * (area.权重 / totalWeight)));
    remaining -= guestCount;
    return {
      名称: area.名称,
      客人: guestCount,
      员工: state.员工.filter(employee => employee.区域 === area.名称).map(employee => employee.姓名),
      说明:
        currentAreas.get(area.名称)?.说明 ||
        area.说明 ||
        AREA_DESCRIPTIONS[area.名称] ||
        'Nơi này sẽ tiếp tục mở rộng theo các cơ sở vật chất sau này.',
    };
  });
}

function makeSettlement(state: BossPageState, traffic: number, projects: BossProject[]): BossSettlement {
  const isClosedToday = state.营业状态 === '今日停业';
  const priceMultiplier = isClosedToday ? 1 : state.节假日.价格倍率;
  const activityMultiplier = isClosedToday ? 0 : state.节假日.活动倍率;
  const appealFactor = buildingAppealFactor(state.建筑);
  const 到店消费 = isClosedToday ? 0 : money(traffic * 150 * priceMultiplier * clamp(appealFactor, 0.94, 1.14));
  const 项目消费 = isClosedToday
    ? 0
    : projects.reduce((sum, project) => sum + money(project.今日订单 * project.基础价格 * priceMultiplier), 0);
  const lodgingBonus =
    getBuildingLevel(state.建筑, 'area_washitsu_room') * 420 +
    getBuildingLevel(state.建筑, 'area_long_stay') * 720 +
    getBuildingLevel(state.建筑, 'area_private_lodging') * 980;
  const diningBonus =
    getBuildingLevel(state.建筑, 'area_kitchen') * 160 +
    getBuildingLevel(state.建筑, 'area_kaiseki_kitchen') * 420 +
    getBuildingLevel(state.建筑, 'area_tatami_dining') * 220;
  const 住宿包场 = isClosedToday
    ? 0
    : money(
        (Math.round(traffic * 0.12) * 360 + state.基建.客房 * 220 + state.基建.包间 * 160 + lodgingBonus) *
          priceMultiplier,
      );
  const 活动套餐 = isClosedToday
    ? 0
    : money(
        (Math.round(traffic * 0.05) * 260 + state.基建.餐饮区 * 80 + diningBonus) *
          priceMultiplier *
          activityMultiplier,
      );
  const 收入 = money(到店消费 + 项目消费 + 住宿包场 + 活动套餐);

  const 员工日结 = makeEmployeeDayReports(state);
  const 日薪 = money(员工日结.reduce((sum, report) => sum + report.工资, 0));
  const capacity = storeCapacity(state);
  const fixedCostFactor = state.营业状态 === '今日停业' ? 0.68 : 1;
  const 固定运营 = money(
    (1980 +
      capacity * 34 +
      state.员工.length * 180 +
      state.基建.后勤 * 160 +
      buildingOperatingCost(state.建筑) * 0.85) *
      fixedCostFactor,
  );
  const 设施维护 = money(
    (infrastructureLevelTotal(state.基建) * 210 +
      builtBuildingLevelTotal(state.建筑) * 115 +
      (100 - state.基建.维护度) * 26) *
      (state.营业状态 === '今日停业' ? 0.86 : 1),
  );
  const 服务准备 = money(
    (projects.reduce((sum, project) => sum + project.今日订单 * project.基础价格 * project.成本率, 0) +
      traffic * 42 +
      builtBuildingLevelTotal(state.建筑, '项目') * 75) *
      servicePreparationFactor(state.建筑),
  );
  const 工程日结 = state.工程.filter(project => project.状态 === '施工中');
  const 工程消耗 = money(工程日结.reduce((sum, project) => sum + project.每日消耗, 0));
  const 投资 = 0;
  const 支出 = money(日薪 + 固定运营 + 设施维护 + 服务准备 + 工程消耗 + 投资);
  const employeeIncome = computeEmployeeOwnedIncome(state, projects);
  const 员工收入合计 = money([...employeeIncome.values()].reduce((sum, value) => sum + value, 0));
  const 毛利 = Math.round(收入 - 支出);

  return {
    营业日: state.营业日,
    状态: '预估',
    收入,
    支出,
    毛利,
    店铺收入明细: { 到店消费, 项目消费, 住宿包场, 活动套餐 },
    支出明细: { 日薪, 固定运营, 设施维护, 服务准备, 工程消耗, 投资 },
    员工收入合计,
    员工日结,
    工程日结: 工程日结.map(project => ({ ...project })),
    流水: [
      {
        id: `preview-income-${state.营业日}`,
        营业日: state.营业日,
        类型: '收入',
        名称: 'Doanh thu cửa hàng',
        金额: 收入,
        资金变动: 收入,
        说明: 'Đến quán, dự án, bao trọn lưu trú và gói hoạt động.',
      },
      {
        id: `preview-expense-${state.营业日}`,
        营业日: state.营业日,
        类型: '支出',
        名称: 'Chi tiêu hôm nay',
        金额: 支出,
        资金变动: -支出,
        说明: 'Lương ngày, vận hành, bảo trì và chuẩn bị dịch vụ.',
      },
      {
        id: `preview-staff-${state.营业日}`,
        营业日: state.营业日,
        类型: '员工收入',
        名称: 'Thu nhập cá nhân nhân viên',
        金额: 员工收入合计,
        资金变动: 0,
        说明: 'Phí chỉ định và tiền boa thuộc về cá nhân nhân viên.',
      },
    ],
    明日预测: {
      客流: Math.round(clamp(traffic * (毛利 >= 0 ? 1.03 : 0.94), MIN_TRAFFIC, storeCapacity(state))),
      店铺评分: Number(clamp(state.店铺评分 + (毛利 >= 0 ? 0.02 : -0.04), 1, 5).toFixed(2)),
      平均满意度: Math.round(
        average(
          state.员工.map(employee => employee.满意度),
          70,
        ),
      ),
    },
    经营纪要: null,
  };
}

function updateEmployeeStatus(state: BossPageState, employee: BossEmployee): BossEmployee {
  const currentSlot = employee.排班[BOSS_CURRENT_SHIFT_INDEX] ?? '待命';
  const nomination = state.指名.find(item => item.员工 === employee.姓名 && item.剩余天数 > 0);
  if (currentSlot === '休息') {
    return { ...employee, 区域: '员工休息室', 状态: '休息' };
  }
  if (currentSlot === '清洁') {
    return { ...employee, 区域: '大堂', 状态: '清洁' };
  }
  if (currentSlot === '待命') {
    return { ...employee, 区域: '大堂', 状态: '待命' };
  }
  return {
    ...employee,
    区域: currentSlot,
    状态: nomination ? '指名中' : '服务中',
  };
}

function updateEmployeeAfterSettlement(
  state: BossPageState,
  employee: BossEmployee,
  personalIncome: number,
  qualityScore: number,
  report: BossEmployeeDayReport,
): BossEmployee {
  const worked = report.接待段 + report.值班段 + report.清洁段;
  const salaryRatio = clamp(employee.日薪 / Math.max(1, employee.期望日薪), 0.45, 1.8);
  const salaryEffect = clamp((salaryRatio - 1) * 14, -9, 9);
  const incomeEffect = clamp(personalIncome / 380, 0, 8);
  const careFatigueRecover = state.员工福利.剩余天数 > 0 ? state.员工福利.疲劳恢复 : 0;
  const careSatisfaction = state.员工福利.剩余天数 > 0 ? state.员工福利.满意加成 : 0;
  const recoveryBonus = staffRecoveryBonus(state.建筑);
  const fatigueGain = Math.max(0, report.疲劳变化 - state.基建.员工休息室 * 3 - careFatigueRecover - recoveryBonus);
  const nextFatigue = Math.round(clamp(employee.疲劳 + fatigueGain - (worked === 0 ? 22 : 10), 0, 100));
  const ratingEffect = qualityScore >= 82 ? 2 : qualityScore < 64 ? -4 : 0;
  const maintenanceEffect = state.基建.维护度 >= 70 ? 2 : -4;
  const supportEffect =
    getBuildingLevel(state.建筑, 'area_training') * 0.9 +
    getBuildingLevel(state.建筑, 'area_shift_office') * 0.6 +
    getBuildingLevel(state.建筑, 'area_staff_dorm') * 0.7;
  const stableWorkEffect = qualityScore >= 78 && state.基建.维护度 >= 68 ? 1.2 : 0;
  const nextSatisfaction = Math.round(
    clamp(
      employee.满意度 +
        salaryEffect +
        incomeEffect +
        ratingEffect +
        maintenanceEffect +
        report.满意变化 +
        careSatisfaction +
        supportEffect +
        stableWorkEffect -
        nextFatigue / 45,
      0,
      100,
    ),
  );
  const lowDays = nextSatisfaction < 42 ? employee.低满意天数 + 1 : Math.max(0, employee.低满意天数 - 1);
  const riskBase =
    nextSatisfaction < 45 ? (45 - nextSatisfaction) * 1.55 + lowDays * 6 : Math.max(0, (58 - nextSatisfaction) * 0.62);
  const risk = Math.round(clamp(riskBase + Math.max(0, nextFatigue - 82) * 0.32, 0, 96));
  const nextScore = Math.round(clamp(employee.评分 * 0.82 + qualityScore * 0.18 + (salaryRatio >= 1 ? 1 : -1), 0, 100));
  const serviceGain = Math.max(0, Math.round(report.接待段 * clamp(GRADE_MULTIPLIER[employee.评级] ?? 0.85, 0.7, 1.4)));

  return {
    ...employee,
    评分: nextScore,
    满意度: nextSatisfaction,
    疲劳: nextFatigue,
    个人收入: money(personalIncome),
    离职风险: risk,
    低满意天数: lowDays,
    服务次数: employee.服务次数 + serviceGain,
    评级: resolveEmployeeGrade(employee.评级, employee.服务次数 + serviceGain, nextScore),
  };
}

function updateEmployeeAfterQuietDay(
  employee: BossEmployee,
  report: BossEmployeeDayReport,
  satisfactionGain: number,
  fatigueRecover: number,
  care: BossStaffCare = { 剩余天数: 0, 满意加成: 0, 疲劳恢复: 0 },
  buildings: BossBuildingState[] = [],
): BossEmployee {
  const workPressure = Math.max(0, report.值班段 * 3 + report.清洁段 * 4 + report.接待段 * 2);
  const careFatigueRecover = care.剩余天数 > 0 ? care.疲劳恢复 : 0;
  const careSatisfaction = care.剩余天数 > 0 ? care.满意加成 : 0;
  const nextFatigue = Math.round(
    clamp(employee.疲劳 + workPressure - fatigueRecover - careFatigueRecover - staffRecoveryBonus(buildings), 0, 100),
  );
  const salaryRatio = clamp(employee.日薪 / Math.max(1, employee.期望日薪), 0.45, 1.8);
  const salaryEffect = clamp((salaryRatio - 1) * 8, -5, 6);
  const supportEffect =
    getBuildingLevel(buildings, 'area_staff_dorm') * 0.5 + getBuildingLevel(buildings, 'area_training') * 0.6;
  const nextSatisfaction = Math.round(
    clamp(
      employee.满意度 +
        satisfactionGain +
        salaryEffect +
        report.满意变化 +
        careSatisfaction +
        supportEffect +
        (employee.疲劳 - nextFatigue) / 18,
      0,
      100,
    ),
  );
  const lowDays = nextSatisfaction < 42 ? employee.低满意天数 + 1 : Math.max(0, employee.低满意天数 - 1);
  const riskBase =
    nextSatisfaction < 48 ? (48 - nextSatisfaction) * 1.6 + lowDays * 6 : Math.max(0, (62 - nextSatisfaction) * 0.62);

  return {
    ...employee,
    满意度: nextSatisfaction,
    疲劳: nextFatigue,
    个人收入: 0,
    离职风险: Math.round(clamp(riskBase, 0, 96)),
    低满意天数: lowDays,
  };
}

function resolveEmployeeGrade(current: BossGrade, serviceCount: number, score: number): BossGrade {
  if (
    serviceCount >= BOSS_EMPLOYEE_GRADE_RULES.SSS.服务次数 &&
    score >= BOSS_EMPLOYEE_GRADE_RULES.SSS.评分
  ) {
    return 'SSS';
  }
  if (serviceCount >= BOSS_EMPLOYEE_GRADE_RULES.S.服务次数 && score >= BOSS_EMPLOYEE_GRADE_RULES.S.评分) {
    return 'S';
  }
  if (serviceCount >= BOSS_EMPLOYEE_GRADE_RULES.A.服务次数 && score >= BOSS_EMPLOYEE_GRADE_RULES.A.评分) {
    return 'A';
  }
  if (serviceCount >= BOSS_EMPLOYEE_GRADE_RULES.B.服务次数 && score >= BOSS_EMPLOYEE_GRADE_RULES.B.评分) {
    return 'B';
  }
  if (score >= BOSS_EMPLOYEE_GRADE_RULES.C.评分) {
    return current === '新人' || current === '待定' ? 'C' : current;
  }
  return current;
}

function updateProjectsAfterSettlement(
  projects: BossProject[],
  qualityScore: number,
  boosts: BossProjectBoost[] = [],
): BossProject[] {
  return projects.map(project => {
    const orderPressure = project.今日订单 >= project.容量 ? -2 : 1;
    const projectBoosts = boosts.filter(boost => boost.项目 === project.名称);
    const boostRating = projectBoosts.reduce((sum, boost) => sum + boost.评分加成, 0);
    const boostRecommendation = projectBoosts.reduce((sum, boost) => sum + boost.推荐加成, 0);
    const nextRating = Number(
      clamp(project.评分 * 0.86 + (qualityScore / 20) * 0.14 + boostRating * 0.18, 1, 5).toFixed(1),
    );
    const nextRecommendation = Math.round(
      clamp(project.推荐值 + (nextRating - 4.1) * 4 + orderPressure + boostRecommendation * 0.2, 30, 100),
    );
    return {
      ...project,
      评分: nextRating,
      推荐值: nextRecommendation,
      热度: makeProjectHeat(nextRecommendation),
    };
  });
}

function makeDefaultSettlement(): BossSettlement {
  return {
    营业日: 1,
    状态: '预估',
    收入: 0,
    支出: 0,
    毛利: 0,
    店铺收入明细: { 到店消费: 0, 项目消费: 0, 住宿包场: 0, 活动套餐: 0 },
    支出明细: { 日薪: 0, 固定运营: 0, 设施维护: 0, 服务准备: 0, 工程消耗: 0, 投资: 0 },
    员工收入合计: 0,
    员工日结: [],
    工程日结: [],
    流水: [],
    明日预测: { 客流: 0, 店铺评分: 0, 平均满意度: 0 },
    经营纪要: null,
  };
}

function makeReminderList(state: BossPageState): string[] {
  const reminders = state.经营提醒.filter(item => item.startsWith('Hiện trường: ')).slice(0, 2);
  const averageSatisfaction = Math.round(
    average(
      state.员工.map(employee => employee.满意度),
      70,
    ),
  );
  const highRisk = state.员工.find(employee => employee.离职风险 >= 60);
  const hotProject = [...state.项目].sort((left, right) => right.推荐值 - left.推荐值)[0];
  const pendingProject = state.工程.find(project => project.状态 === '待验收');
  const expandable = state.建筑.find(building => building.状态 === '可扩建');
  const expandableDefinition = expandable ? INFRASTRUCTURE_UNLOCKS.find(item => item.id === expandable.id) : undefined;

  if (state.基建.维护度 < 62) {
    reminders.push('Bảo trì cơ sở vật chất hơi thấp, lượng khách và đánh giá ngày mai sẽ bị ảnh hưởng.');
  }
  if (pendingProject) {
    reminders.push(`${pendingProject.名称} đã hoàn công, nhớ nghiệm thu rồi mới chính thức có hiệu lực.`);
  }
  if (expandableDefinition) {
    reminders.push(`${expandableDefinition.名称} đã đủ điều kiện mở rộng, có thể cân nhắc sắp xếp thi công.`);
  }
  if (averageSatisfaction < 55) {
    reminders.push('Sự hài lòng của nhân viên hơi thấp, nên kiểm tra lương ngày và áp lực xếp ca.');
  }
  if (highRisk) {
    reminders.push(`Rủi ro nghỉ việc của ${highRisk.姓名} hơi cao, tiếp tục ép đãi ngộ thấp sẽ ảnh hưởng đến sự ổn định.`);
  }
  if (hotProject) {
    reminders.push(`${hotProject.名称} hiện có giá trị đề xuất cao nhất, có thể sắp xếp thêm nhân viên phù hợp.`);
  }
  if (state.结算.毛利 < 0) {
    reminders.push('Lợi nhuận gộp dự tính hôm nay âm, cần kiểm tra xếp ca, giá cả hoặc áp lực bảo trì.');
  }
  if (state.营业状态 === '暂停营业') {
    reminders.push('Cửa hàng đã tạm ngừng nhận khách, lượng khách hôm nay sẽ không tăng thêm.');
  }
  if (state.营业状态 === '今日停业') {
    reminders.push('Hôm nay đã ngừng kinh doanh, khi kết toán sẽ không phát sinh doanh thu kinh doanh.');
  }
  if (state.节假日.状态 !== '平日') {
    reminders.push(`${state.节假日.名称} đang có hiệu lực: lượng khách và giá cả sẽ được tính theo hiệu chỉnh hôm nay.`);
  }
  return _.uniq(reminders).slice(0, 4);
}

function formatBossDateLabel(base: Date): string {
  const week = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][base.getDay()];
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `Ngày ${day} tháng ${month} năm ${year}, ${week}`;
}

function nextDateLabel(current: string): string {
  const match = /^Ngày (\d{2}) tháng (\d{2}) năm (\d{4})/.exec(current);
  const base = match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]) + 1) : new Date();
  return formatBossDateLabel(base);
}

export function cloneBossPageState(state: BossPageState): BossPageState {
  return clone(state);
}

export const BOSS_RECRUIT_REFRESH_MS = 12 * 60 * 60 * 1000;

function stableTextHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRecruitCandidate(name: string): BossRecruitCandidate {
  const salary = 560 + (stableTextHash(name) % 8) * 80;
  return {
    姓名: name,
    拒绝记录: 0,
    期望日薪: salary,
    说明: 'Thông tin cơ bản đã đăng ký, kinh nghiệm cụ thể và xu hướng công việc chờ xác nhận qua phỏng vấn.',
  };
}

function makeMarketCandidate(name: string): BossMarketCandidate {
  const hash = stableTextHash(name);
  const grades: BossGrade[] = ['B', 'A', 'S'];
  const grade = grades[hash % grades.length];
  const salaryBase: Record<'B' | 'A' | 'S', number> = { B: 880, A: 1280, S: 1880 };
  const expectedSalary = salaryBase[grade as 'B' | 'A' | 'S'] + (hash % 5) * 40;
  return {
    姓名: name,
    类型: 'Nhân tài kỳ cựu',
    说明: 'Kinh nghiệm đầy đủ và xu hướng công việc lấy theo hồ sơ nhân vật và giao lưu tại hiện trường.',
    市场价格: Math.round(expectedSalary * (grade === 'S' ? 32 : grade === 'A' ? 26 : 20) / 100) * 100,
    期望日薪: expectedSalary,
    评级: grade,
  };
}

function selectRecruitCandidates(
  excludedNames: string[],
  femaleUser: boolean,
  now: number,
  salt = 'natural',
): BossRecruitCandidate[] {
  const excluded = new Set(excludedNames.map(name => name.trim()).filter(Boolean));
  const refreshBucket = Math.floor(now / BOSS_RECRUIT_REFRESH_MS);
  return listTangquanCharacters(femaleUser)
    .filter(character => !excluded.has(character.name))
    .sort(
      (left, right) =>
        stableTextHash(`${refreshBucket}:${salt}:${left.id}`) - stableTextHash(`${refreshBucket}:${salt}:${right.id}`),
    )
    .slice(0, 2)
    .map(character => makeRecruitCandidate(character.name));
}

function makeRecruitmentState(employeeNames: string[], femaleUser: boolean, now: number): BossRecruitmentState {
  return {
    候选: selectRecruitCandidates(employeeNames, femaleUser, now),
    下次刷新时间: new Date(now + BOSS_RECRUIT_REFRESH_MS).toISOString(),
    刷新序号: 0,
    上次刷新来源: 'initial',
    已录用: [],
    女性限定可见: femaleUser,
  };
}

export function getBossRecruitCountdown(state: BossPageState, now = Date.now()): string {
  const deadline = Date.parse(state.招聘.下次刷新时间);
  const remaining = Math.max(0, (Number.isFinite(deadline) ? deadline : now) - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

export function refreshBossRecruitmentByRealTime(
  state: BossPageState,
  now = Date.now(),
  force = false,
): BossPageState {
  const deadline = Date.parse(state.招聘.下次刷新时间);
  if (!force && Number.isFinite(deadline) && deadline > now) {
    return state;
  }
  const next = clone(state);
  const employeeNames = next.员工.map(employee => employee.姓名);
  const recruitExcludedNames = [...next.招聘.已录用, ...employeeNames];
  next.招聘.刷新序号 = Math.max(0, Math.round(next.招聘.刷新序号 || 0)) + 1;
  next.招聘.上次刷新来源 = 'natural';
  next.招聘.候选 = selectRecruitCandidates(
    recruitExcludedNames,
    next.招聘.女性限定可见,
    now,
    `natural-${next.招聘.刷新序号}`,
  );
  next.招聘.下次刷新时间 = new Date(now + BOSS_RECRUIT_REFRESH_MS).toISOString();
  return recalculateBossState(next);
}

export function getBossRecruitPaidRefreshCost(state: BossPageState): number {
  const businessDayPressure = Math.min(160_000, Math.max(0, state.营业日 - 1) * 1_000);
  const rosterPressure = state.员工.length * 10_000;
  const repeatedPressure = Math.min(120_000, Math.max(0, state.招聘.刷新序号) * 5_000);
  return Math.ceil((60_000 + businessDayPressure + rosterPressure + repeatedPressure) / 1_000) * 1_000;
}

export function paidRefreshBossRecruitment(state: BossPageState, now = Date.now()): BossMutationResult {
  const cost = getBossRecruitPaidRefreshCost(state);
  if (state.资金 < cost) return { ok: false, message: `Không đủ tiền, còn cần thêm ${cost - state.资金}`, state };
  const nextSequence = Math.max(0, Math.round(state.招聘.刷新序号 || 0)) + 1;
  const excludedNames = [
    ...state.招聘.已录用,
    ...state.员工.map(employee => employee.姓名),
    ...state.招聘.候选.map(candidate => candidate.姓名),
  ];
  const candidates = selectRecruitCandidates(
    excludedNames,
    state.招聘.女性限定可见,
    now,
    `paid-${nextSequence}`,
  );
  if (candidates.length === 0) {
    return { ok: false, message: 'Nhóm ứng viên OC hiện có gần cạn kiệt, lần này chưa trừ tiền', state };
  }
  const next = appendLedgerEntry(state, {
    类型: '投资',
    名称: 'Làm mới trả phí nhóm tuyển dụng thường',
    金额: cost,
    资金变动: -cost,
    说明: 'Chỉ làm mới nhóm tuyển dụng OC thường hiện có, không ảnh hưởng đến chợ nhân tài AI.',
  });
  next.招聘.候选 = candidates;
  next.招聘.刷新序号 = nextSequence;
  next.招聘.上次刷新来源 = 'paid';
  next.招聘.下次刷新时间 = new Date(now + BOSS_RECRUIT_REFRESH_MS).toISOString();
  return { ok: true, message: `Nhóm tuyển dụng thường đã được làm mới, chi phí ${cost}`, state: recalculateBossState(next) };
}

export function setBossRecruitmentFemaleUser(state: BossPageState, femaleUser: boolean, now = Date.now()): BossPageState {
  const hasDisallowedCandidate = state.招聘.候选.some(
    candidate => !isTangquanCharacterAllowed(candidate.姓名, femaleUser),
  );
  if (state.招聘.女性限定可见 === femaleUser && !hasDisallowedCandidate) {
    return refreshBossRecruitmentByRealTime(state, now);
  }
  const next = clone(state);
  next.招聘.女性限定可见 = femaleUser;
  return refreshBossRecruitmentByRealTime(next, now, true);
}

export function makeBossPageState(femaleUser = false, now = Date.now()): BossPageState {
  const defaultBuildings = normalizeBuildings([], DEFAULT_INFRASTRUCTURE);
  const startDate = new Date(now);
  const dateLabel = formatBossDateLabel(startDate);
  const starterEmployees: BossEmployee[] = [];
  const starterNames = starterEmployees.map(employee => employee.姓名);
  const marketCandidates: BossMarketCandidate[] = [];
  const state: BossPageState = {
    营业日: 1,
    日期: dateLabel,
    时间: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
    地点: '大堂',
    营业状态: '营业中',
    暂停保留客流: 0,
    节假日: makeDateHolidayEffect(dateLabel),
    资金: INITIAL_FUNDS,
    店铺评分: 4.7,
    好评率: 0.91,
    客流: 0,
    今日已结算: false,
    时间控制: makeTangquanTimeControlState(),
    看板娘: { version: 1, 已选择: false, 角色ID: '', 姓名: '', 来源: 'new' },
    时间段: [...BOSS_TIME_SLOTS],
    员工: starterEmployees,
    区域: [],
    项目: makeUnlockedProjects([], DEFAULT_INFRASTRUCTURE, defaultBuildings),
    指名: [],
    人才市场: marketCandidates,
    AI人才市场: makeBossAiTalentMarketState(dateLabel, starterNames),
    招聘: makeRecruitmentState(starterNames, femaleUser, now),
    基建: { ...DEFAULT_INFRASTRUCTURE },
    建筑: defaultBuildings,
    工程: [],
    宣传活动: [],
    品质投入: [],
    员工福利: { 剩余天数: 0, 满意加成: 0, 疲劳恢复: 0 },
    结算: makeDefaultSettlement(),
    账本: [
      {
        id: 'initial-funds',
        营业日: 1,
        类型: '调整',
        名称: 'Vốn khởi điểm',
        金额: INITIAL_FUNDS,
        资金变动: INITIAL_FUNDS,
        说明: 'Vốn khi bắt đầu.',
      },
    ],
    经营提醒: [],
  };

  return recalculateBossState(state);
}

export function recalculateBossState(state: BossPageState): BossPageState {
  const next = clone(state);
  next.营业状态 = next.营业状态 === '暂停营业' || next.营业状态 === '今日停业' ? next.营业状态 : '营业中';
  next.暂停保留客流 = money(next.暂停保留客流);
  next.节假日 = normalizeHolidayEffect(next.节假日, next.日期);
  next.基建 = normalizeInfrastructure(next.基建);
  next.工程 = Array.isArray(next.工程)
    ? (next.工程
        .map(project => normalizeConstructionProject(project, next))
        .filter(Boolean) as BossConstructionProject[])
    : [];
  next.建筑 = syncBuildingsWithProjects(normalizeBuildings(next.建筑, next.基建), next.工程);
  next.宣传活动 = normalizeMarketingCampaigns(next.宣传活动);
  next.品质投入 = normalizeProjectBoosts(next.品质投入);
  next.员工福利 = normalizeStaffCare(next.员工福利);
  next.AI人才市场 = normalizeBossAiTalentMarketState(
    next.AI人才市场,
    next.日期,
    [
      ...next.员工.map(employee => employee.姓名),
      ...next.招聘.候选.map(candidate => candidate.姓名),
      ...next.人才市场.map(candidate => candidate.姓名),
    ],
  );
  next.资金 = money(next.资金);
  next.店铺评分 = Number(clamp(next.店铺评分, 1, 5).toFixed(2));
  next.好评率 = clamp(next.好评率, 0, 1);
  next.员工 = next.员工.map(employee => updateEmployeeStatus(next, employee));
  next.项目 = makeUnlockedProjects(next.项目, next.基建, next.建筑);
  if (!getUnlockedAreaCatalog(next.基建, next.建筑).some(area => area.名称 === next.地点)) {
    next.地点 = getUnlockedAreaCatalog(next.基建, next.建筑)[0]?.名称 ?? '前台大厅';
  }

  const traffic = computeTraffic(next);
  next.客流 = traffic;
  next.项目 = computeProjectOrders(next, traffic);
  next.区域 = makeAreaList(next, traffic);
  if (!next.今日已结算 || next.结算.状态 !== '已结算') {
    next.结算 = makeSettlement(next, traffic, next.项目);
  }
  next.经营提醒 = makeReminderList(next);
  return next;
}

export function confirmBossScheduleState(state: BossPageState): BossPageState {
  const next = clone(state);
  next.今日已结算 = false;
  return recalculateBossState(next);
}

export function applyBossManualTimeTarget(
  state: BossPageState,
  targetTime: string,
  transition: { fromDate: string; crossesMidnight: boolean },
): BossMutationResult {
  const normalizedTime = normalizeTangquanClock(targetTime);
  if (!normalizedTime) {
    return { ok: false, message: 'Thời gian mục tiêu không hợp lệ, vui lòng chọn lại', state };
  }
  const next = clone(state);
  next.时间 = normalizedTime;
  next.时间控制 = recordTangquanTimeTravel(next.时间控制, {
    fromDate: transition.fromDate,
    toDate: next.日期,
    targetTime: normalizedTime,
    crossesMidnight: transition.crossesMidnight,
  });
  if (next.今日已结算 && normalizedTime !== '00:00') {
    next.今日已结算 = false;
  }
  return { ok: true, message: `Thời gian đã tiến đến ${normalizedTime}`, state: next };
}

export function selectBossHostess(state: BossPageState, characterId: string): BossMutationResult {
  if (state.看板娘.已选择) {
    return { ok: false, message: 'Đã chọn xong linh vật đại diện', state };
  }
  const character = findTangquanCharacter(characterId);
  if (!character || !isTangquanCharacterAllowed(character.id, state.招聘.女性限定可见)) {
    return { ok: false, message: 'Nhân vật này hiện không thể chọn', state };
  }
  if (hasBossEmployeeName(state, character.name)) {
    return { ok: false, message: 'Danh sách đã có nhân viên trùng tên', state };
  }
  const next = clone(state);
  const employee = makeBossStarterEmployee(character.id, character.name);
  next.员工.push(employee);
  next.看板娘 = {
    version: 1,
    已选择: true,
    角色ID: character.id,
    姓名: character.name,
    来源: 'new',
  };
  next.招聘.候选 = next.招聘.候选.filter(candidate => candidate.姓名 !== character.name);
  next.招聘.已录用 = _.uniq([...next.招聘.已录用, character.name]);
  next.AI人才市场 = normalizeBossAiTalentMarketState(
    next.AI人才市场,
    next.日期,
    [...next.员工.map(item => item.姓名), ...next.招聘.候选.map(item => item.姓名)],
  );
  return { ok: true, message: `${character.name} đã trở thành linh vật đại diện`, state: recalculateBossState(next) };
}

export function markBossAiTalentMarketAttempted(state: BossPageState, issues: string[] = []): BossPageState {
  const next = clone(state);
  next.AI人才市场 = markBossAiTalentMarketFallback(next.AI人才市场, issues);
  return next;
}

export function signBossAiTalentCandidate(state: BossPageState, candidateId: string): BossMutationResult {
  const candidate = state.AI人才市场.候选.find(item => item.id === candidateId);
  if (!candidate) {
    return { ok: false, message: 'Không tìm thấy ứng viên nhân tài AI này', state };
  }
  if (hasBossEmployeeName(state, candidate.姓名)) {
    return { ok: false, message: 'Danh sách đã có nhân viên trùng tên', state };
  }
  if (state.员工.some(employee => employee.角色ID === candidate.id)) {
    return { ok: false, message: 'Danh sách đã có nhân viên trùng ID', state };
  }
  if (state.资金 < candidate.市场签约价格) {
    return { ok: false, message: 'Không đủ tiền', state };
  }

  const next = clone(state);
  next.员工.push({
    ...makeEmployeeFromCandidate(candidate.姓名, candidate.评级, candidate.期望日薪),
    角色ID: candidate.id,
  });
  next.AI人才市场.候选 = next.AI人才市场.候选.filter(item => item.id !== candidate.id);
  const committed = appendLedgerEntry(next, {
    类型: '投资',
    名称: `${candidate.姓名} AI 人才签约`,
    金额: candidate.市场签约价格,
    资金变动: -candidate.市场签约价格,
    说明: `Chi phí ký hợp đồng từ chợ nhân tài AI; ID nhân vật ổn định: ${candidate.id}.`,
  });
  return {
    ok: true,
    message: `${candidate.姓名} đã gia nhập danh sách`,
    state: committed,
  };
}

export function raiseBossEmployeeSalary(state: BossPageState, employeeName: string, amount = 100): BossMutationResult {
  const next = clone(state);
  const employee = next.员工.find(item => item.姓名 === employeeName);
  if (!employee) {
    return { ok: false, message: 'Không tìm thấy nhân viên này', state };
  }
  employee.日薪 = money(employee.日薪 + Math.max(0, amount));
  employee.满意度 = Math.round(clamp(employee.满意度 + 2, 0, 100));
  return {
    ok: true,
    message: `${employee.姓名} đã tăng lương ngày lên ¥${employee.日薪.toLocaleString('vi-VN')}`,
    state: recalculateBossState(next),
  };
}

function hasBossEmployeeName(state: BossPageState, name: string): boolean {
  const normalizedName = name.trim();
  return normalizedName.length > 0 && state.员工.some(employee => employee.姓名.trim() === normalizedName);
}

function dedupeBossEmployees(employees: BossEmployee[]): BossEmployee[] {
  const names = new Set<string>();
  return employees.filter(employee => {
    const name = employee.姓名.trim();
    if (!name || names.has(name)) return false;
    names.add(name);
    return true;
  });
}

export function buyBossMarketCandidate(state: BossPageState, name: string): BossMutationResult {
  const candidate = state.人才市场.find(item => item.姓名 === name);
  if (!candidate) {
    return { ok: false, message: 'Không tìm thấy ứng viên này', state };
  }
  if (hasBossEmployeeName(state, candidate.姓名)) {
    return { ok: false, message: 'Danh sách đã có nhân viên trùng tên', state };
  }
  if (state.资金 < candidate.市场价格) {
    return { ok: false, message: 'Không đủ tiền', state };
  }

  const next = appendLedgerEntry(state, {
    类型: '投资',
    名称: `${candidate.姓名} 入职`,
    金额: candidate.市场价格,
    资金变动: -candidate.市场价格,
    说明: 'Chi phí mua vào từ chợ nhân tài.',
  });
  next.员工.push(makeEmployeeFromCandidate(candidate.姓名, candidate.评级, candidate.期望日薪));
  next.人才市场 = next.人才市场.filter(item => item.姓名 !== candidate.姓名);
  return { ok: true, message: `${candidate.姓名} đã gia nhập danh sách`, state: recalculateBossState(next) };
}

export function hireBossRecruitCandidate(state: BossPageState, name: string): BossMutationResult {
  const recruit = state.招聘.候选.find(candidate => candidate.姓名 === name);
  if (!recruit) {
    return { ok: false, message: 'Hiện không có ứng viên này', state };
  }
  const entryCost = recruit.期望日薪 > 0 ? 1200 : 0;
  if (!recruit.期望日薪) {
    return { ok: false, message: 'Hiện không có ứng viên nào để tuyển', state };
  }
  if (!isTangquanCharacterAllowed(recruit.姓名, state.招聘.女性限定可见)) {
    return { ok: false, message: `${recruit.姓名} sẽ không xuất hiện trong điều kiện tuyển dụng hiện tại`, state };
  }
  if (hasBossEmployeeName(state, recruit.姓名)) {
    return { ok: false, message: 'Danh sách đã có nhân viên trùng tên', state };
  }
  if (state.资金 < entryCost) {
    return { ok: false, message: 'Không đủ tiền', state };
  }

  const next = appendLedgerEntry(state, {
    类型: '投资',
    名称: `${recruit.姓名} 入职准备`,
    金额: entryCost,
    资金变动: -entryCost,
    说明: 'Chi phí chuẩn bị nhập chức khi tuyển dụng.',
  });
  next.员工.push(makeEmployeeFromCandidate(recruit.姓名, '新人', recruit.期望日薪));
  next.招聘.候选 = next.招聘.候选.filter(candidate => candidate.姓名 !== recruit.姓名);
  next.招聘.已录用 = _.uniq([...next.招聘.已录用, recruit.姓名]);
  return { ok: true, message: `${recruit.姓名} đã được tuyển dụng`, state: recalculateBossState(next) };
}

export function rejectBossRecruitCandidate(state: BossPageState, name: string): BossPageState {
  const next = clone(state);
  const recruit = next.招聘.候选.find(candidate => candidate.姓名 === name);
  if (!recruit) {
    return state;
  }
  recruit.拒绝记录 += 1;
  next.招聘.候选 = next.招聘.候选.filter(candidate => candidate.姓名 !== name);
  return recalculateBossState(next);
}

export function upgradeBossInfrastructure(state: BossPageState, key: BossInfrastructureKey): BossMutationResult {
  const current = state.基建[key];
  if (current >= INFRASTRUCTURE_MAX_LEVEL) {
    return { ok: false, message: 'Cơ sở này đã đạt cấp tối đa', state };
  }
  if (state.工程.some(project => project.设施 === key)) {
    return { ok: false, message: 'Cơ sở này đã có công trình đang thi công', state };
  }

  const totalCost = getInfrastructureUpgradeCostByLevel(key, current);
  const startCost = money(totalCost * 0.35);
  const totalDays = makeConstructionDays(key, current);
  const dailyCost = money((totalCost - startCost) / totalDays);
  if (state.资金 < startCost) {
    return { ok: false, message: 'Không đủ tiền', state };
  }

  const next = appendLedgerEntry(state, {
    类型: '投资',
    名称: `${INFRASTRUCTURE_LABELS[key]}开工`,
    金额: startCost,
    资金变动: -startCost,
    说明: 'Khoản khởi công mở rộng, cấp độ cơ sở chỉ có hiệu lực sau khi hoàn công và nghiệm thu.',
  });
  next.工程.push({
    id: makeConstructionId(key, next.营业日),
    类型: '基建',
    设施: key,
    名称: INFRASTRUCTURE_LABELS[key],
    当前等级: current,
    目标等级: Math.min(INFRASTRUCTURE_MAX_LEVEL, current + 1),
    状态: '施工中',
    总费用: totalCost,
    已支付: startCost,
    每日消耗: dailyCost,
    总天数: totalDays,
    剩余天数: totalDays,
    开工日: next.营业日,
    验收日: `第${next.营业日 + totalDays}日`,
  });
  next.基建.维护度 = Math.max(48, next.基建.维护度 - 4);
  return { ok: true, message: `${INFRASTRUCTURE_LABELS[key]} đã khởi công`, state: recalculateBossState(next) };
}

export function startBossBuildingProject(state: BossPageState, buildingId: string): BossMutationResult {
  const prepared = recalculateBossState(state);
  const definition = INFRASTRUCTURE_UNLOCKS.find(item => item.id === buildingId);
  if (!definition) {
    return { ok: false, message: 'Không tìm thấy công trình này', state };
  }
  const building = prepared.建筑.find(item => item.id === buildingId);
  if (!building) {
    return { ok: false, message: 'Không tìm thấy công trình này', state };
  }
  if (building.状态 === '施工中' || building.状态 === '待验收') {
    return { ok: false, message: 'Công trình này đã có dự án đang thi công', state };
  }
  const missing = getMissingRequirements(prepared.基建, definition.条件);
  if (missing.length > 0 && building.状态 !== '已建成') {
    return { ok: false, message: `Còn thiếu ${missing.join('、')}`, state };
  }
  if (building.状态 === '已建成' && building.等级 >= BUILDING_MAX_LEVEL) {
    return { ok: false, message: 'Công trình này đã đạt cấp tối đa', state };
  }

  const current = building.状态 === '已建成' ? building.等级 : 0;
  const totalCost = getBuildingProjectCostByLevel(definition, current);
  const startCost = money(totalCost * 0.35);
  const totalDays = makeBuildingProjectDays(definition, current);
  const dailyCost = money((totalCost - startCost) / totalDays);
  if (prepared.资金 < startCost) {
    return { ok: false, message: 'Không đủ tiền', state };
  }

  const facility = getPrimaryRequirementKey(definition.条件);
  const next = appendLedgerEntry(prepared, {
    类型: '投资',
    名称: `${definition.名称}开工`,
    金额: startCost,
    资金变动: -startCost,
    说明: current <= 0 ? 'Khoản khởi công mở rộng công trình, chính thức mở sau khi nghiệm thu.' : 'Khoản khởi công nâng cấp công trình, cấp độ có hiệu lực sau khi nghiệm thu.',
  });
  next.建筑 = next.建筑.map(item => (item.id === buildingId ? { ...item, 状态: '施工中' } : item));
  next.工程.push({
    id: makeConstructionId(facility, next.营业日),
    类型: '建筑',
    设施: facility,
    建筑ID: buildingId,
    名称: definition.名称,
    当前等级: current,
    目标等级: Math.min(BUILDING_MAX_LEVEL, current + 1),
    状态: '施工中',
    总费用: totalCost,
    已支付: startCost,
    每日消耗: dailyCost,
    总天数: totalDays,
    剩余天数: totalDays,
    开工日: next.营业日,
    验收日: `第${next.营业日 + totalDays}日`,
  });
  next.基建.维护度 = Math.max(48, next.基建.维护度 - 3);
  return { ok: true, message: `${definition.名称} đã khởi công`, state: recalculateBossState(next) };
}

export function acceptBossConstructionProject(state: BossPageState, projectId: string): BossMutationResult {
  const project = state.工程.find(item => item.id === projectId);
  if (!project) {
    return { ok: false, message: 'Không tìm thấy dự án thi công này', state };
  }
  if (project.状态 !== '待验收') {
    return { ok: false, message: 'Dự án thi công chưa hoàn thành', state };
  }

  const next = clone(state);
  if (project.类型 === '建筑' && project.建筑ID) {
    next.建筑 = normalizeBuildings(next.建筑, next.基建).map(building =>
      building.id === project.建筑ID
        ? {
            ...building,
            状态: '已建成',
            等级: Math.max(building.等级, project.目标等级),
          }
        : building,
    );
  } else {
    next.基建[project.设施] = Math.max(next.基建[project.设施], project.目标等级);
  }
  next.工程 = next.工程.filter(item => item.id !== projectId);
  next.基建.维护度 = Math.max(42, next.基建.维护度 - 2);
  return {
    ok: true,
    message: `${project.名称 || INFRASTRUCTURE_LABELS[project.设施]} đã được nghiệm thu`,
    state: recalculateBossState(next),
  };
}

export function maintainBossInfrastructure(state: BossPageState): BossMutationResult {
  if (state.基建.维护度 >= 96) {
    return { ok: false, message: 'Độ bảo trì hiện tại đã rất cao', state };
  }
  const cost = getBossMaintenanceCost(state);
  if (state.资金 < cost) {
    return { ok: false, message: 'Không đủ tiền', state };
  }
  const next = appendLedgerEntry(state, {
    类型: '支出',
    名称: 'Bảo trì cơ sở vật chất',
    金额: cost,
    资金变动: -cost,
    说明: 'Khôi phục độ bảo trì môi trường.',
  });
  next.基建.维护度 = Math.min(100, next.基建.维护度 + 22);
  return { ok: true, message: 'Bảo trì cơ sở vật chất đã hoàn tất', state: recalculateBossState(next) };
}

export function adjustBossProjectPrice(
  state: BossPageState,
  projectName: string,
  direction: 'up' | 'down',
): BossMutationResult {
  const next = clone(state);
  const project = next.项目.find(item => item.名称 === projectName);
  if (!project) {
    return { ok: false, message: 'Không tìm thấy dự án này', state };
  }
  const multiplier = direction === 'up' ? 1.1 : 0.9;
  project.基础价格 = money(clamp(project.基础价格 * multiplier, 260, 6800));
  project.推荐值 = Math.round(clamp(project.推荐值 + (direction === 'up' ? -3 : 2), 30, 100));
  project.评分 = Number(clamp(project.评分 + (direction === 'up' ? -0.05 : 0.03), 1, 5).toFixed(1));
  return {
    ok: true,
    message: `${project.名称} đã điều chỉnh thành ${project.基础价格.toLocaleString('vi-VN')} đồng`,
    state: recalculateBossState(next),
  };
}

export function startBossMarketingCampaign(state: BossPageState): BossMutationResult {
  const prepared = recalculateBossState(state);
  if (prepared.宣传活动.length >= 3) {
    return { ok: false, message: 'Số chiến dịch quảng bá hiện tại đã đủ nhiều', state };
  }
  const cost = money(5200 + storeCapacity(prepared) * 80 + prepared.宣传活动.length * 2400);
  if (prepared.资金 < cost) {
    return { ok: false, message: 'Không đủ tiền', state };
  }
  const next = appendLedgerEntry(prepared, {
    类型: '投资',
    名称: 'Chiến dịch quảng bá',
    金额: cost,
    资金变动: -cost,
    说明: 'Tăng lượng khách và độ hot của dự án trong thời gian gần.',
  });
  next.宣传活动.push({
    id: makeLedgerId(next.营业日, '宣传'),
    名称: 'Quảng bá sương đêm ôn tuyền',
    剩余天数: 3,
    客流加成: 0.14,
    推荐加成: 3,
    说明: 'Tăng lượng khách và độ hot của dự án trong vài ngày tới.',
  });
  return { ok: true, message: 'Chiến dịch quảng bá đã bắt đầu', state: recalculateBossState(next) };
}

export function investBossStaffCare(state: BossPageState): BossMutationResult {
  const prepared = recalculateBossState(state);
  const cost = money(prepared.员工.length * 1200 + infrastructureLevelTotal(prepared.基建) * 180);
  if (prepared.资金 < cost) {
    return { ok: false, message: 'Không đủ tiền', state };
  }
  const next = appendLedgerEntry(prepared, {
    类型: '支出',
    名称: 'Phúc lợi nhân viên',
    金额: cost,
    资金变动: -cost,
    说明: 'Cải thiện bữa ăn, nghỉ ngơi và chăm sóc trong ngày cho nhân viên.',
  });
  next.员工 = next.员工.map(employee => ({
    ...employee,
    满意度: Math.round(clamp(employee.满意度 + 6, 0, 100)),
    疲劳: Math.round(clamp(employee.疲劳 - 8, 0, 100)),
    离职风险: Math.round(clamp(employee.离职风险 - 8, 0, 100)),
  }));
  next.员工福利 = { 剩余天数: 3, 满意加成: 3, 疲劳恢复: 4 };
  return { ok: true, message: 'Phúc lợi nhân viên đã được sắp xếp', state: recalculateBossState(next) };
}

export function investBossProjectQuality(state: BossPageState, projectName: string): BossMutationResult {
  const prepared = recalculateBossState(state);
  const project = prepared.项目.find(item => item.名称 === projectName);
  if (!project) {
    return { ok: false, message: 'Không tìm thấy dự án này', state };
  }
  const cost = money(project.基础价格 * 5 + 2600);
  if (prepared.资金 < cost) {
    return { ok: false, message: 'Không đủ tiền', state };
  }
  const next = appendLedgerEntry(prepared, {
    类型: '投资',
    名称: `${project.名称}品质投入`,
    金额: cost,
    资金变动: -cost,
    说明: 'Mua vật tư tiêu hao, dược liệu, tinh dầu hoặc nguyên liệu ẩm thực tốt hơn.',
  });
  next.项目 = next.项目.map(item =>
    item.名称 === projectName
      ? {
          ...item,
          评分: Number(clamp(item.评分 + 0.1, 1, 5).toFixed(1)),
          推荐值: Math.round(clamp(item.推荐值 + 7, 30, 100)),
        }
      : item,
  );
  next.品质投入.push({
    id: makeLedgerId(next.营业日, project.名称),
    项目: project.名称,
    剩余天数: 3,
    推荐加成: 5,
    评分加成: 0.12,
    说明: 'Tăng trải nghiệm dự án và ý muốn đặt dịch vụ trong ngắn hạn.',
  });
  return { ok: true, message: `${project.名称} đã hoàn tất đầu tư chất lượng`, state: recalculateBossState(next) };
}

export function pauseBossBusiness(state: BossPageState): BossMutationResult {
  if (state.今日已结算) {
    return { ok: false, message: 'Hôm nay đã kết toán rồi', state };
  }
  if (state.营业状态 === '今日停业') {
    return { ok: false, message: 'Hôm nay đã ngừng kinh doanh', state };
  }

  const prepared = recalculateBossState({ ...state, 营业状态: '营业中', 暂停保留客流: 0 });
  const next = clone(prepared);
  next.营业状态 = '暂停营业';
  next.暂停保留客流 = prepared.客流;
  return { ok: true, message: 'Đã tạm ngừng nhận khách', state: recalculateBossState(next) };
}

export function resumeBossBusiness(state: BossPageState): BossMutationResult {
  if (state.今日已结算) {
    return { ok: false, message: 'Hôm nay đã kết toán rồi', state };
  }
  if (state.营业状态 !== '暂停营业') {
    return { ok: false, message: 'Hiện không tạm ngừng nhận khách', state };
  }

  const next = clone(state);
  next.营业状态 = '营业中';
  next.暂停保留客流 = 0;
  return { ok: true, message: 'Đã khôi phục nhận khách', state: recalculateBossState(next) };
}

export function closeBossBusinessToday(state: BossPageState): BossMutationResult {
  if (state.今日已结算) {
    return { ok: false, message: 'Hôm nay đã kết toán rồi', state };
  }

  const next = clone(state);
  next.营业状态 = '今日停业';
  next.暂停保留客流 = 0;
  next.时间 = '20:40';
  return { ok: true, message: 'Hôm nay đã được đặt thành ngừng kinh doanh', state: recalculateBossState(next) };
}

function advanceConstructionAfterDay(projects: BossConstructionProject[]): BossConstructionProject[] {
  return projects.map(project => {
    if (project.状态 === '待验收') {
      return project;
    }
    const paid = money(Math.min(project.总费用, project.已支付 + project.每日消耗));
    const remainingDays = Math.max(0, project.剩余天数 - 1);
    return {
      ...project,
      已支付: paid,
      剩余天数: remainingDays,
      状态: remainingDays <= 0 ? '待验收' : '施工中',
    };
  });
}

function advanceTemporaryInvestments(state: BossPageState): BossPageState {
  const next = clone(state);
  next.宣传活动 = next.宣传活动
    .map(campaign => ({ ...campaign, 剩余天数: Math.max(0, campaign.剩余天数 - 1) }))
    .filter(campaign => campaign.剩余天数 > 0);
  next.品质投入 = next.品质投入
    .map(boost => ({ ...boost, 剩余天数: Math.max(0, boost.剩余天数 - 1) }))
    .filter(boost => boost.剩余天数 > 0);
  next.员工福利 = {
    ...next.员工福利,
    剩余天数: Math.max(0, next.员工福利.剩余天数 - 1),
  };
  if (next.员工福利.剩余天数 <= 0) {
    next.员工福利 = { 剩余天数: 0, 满意加成: 0, 疲劳恢复: 0 };
  }
  return next;
}

export function restBossOneDay(state: BossPageState): BossMutationResult {
  if (state.今日已结算) {
    return { ok: false, message: 'Hôm nay đã kết toán rồi', state };
  }

  const prepared = recalculateBossState({ ...state, 营业状态: '今日停业', 暂停保留客流: 0 });
  const closedProjects = prepared.项目.map(project => ({ ...project, 今日订单: 0 }));
  const settlement = makeSettlement(prepared, 0, closedProjects);
  const next = appendLedgerEntry(prepared, {
    类型: settlement.毛利 >= 0 ? '收入' : '支出',
    名称: `第${prepared.营业日}日休息`,
    金额: Math.abs(settlement.毛利),
    资金变动: settlement.毛利,
    说明: 'Ngày nghỉ kết toán theo lịch làm việc nhân viên, công trình và chi phí vận hành tối thiểu.',
  });

  const reportMap = new Map(settlement.员工日结.map(report => [report.员工, report]));
  next.员工 = next.员工.map(employee =>
    updateEmployeeAfterQuietDay(
      employee,
      reportMap.get(employee.姓名) ?? makeEmployeeDayReport(prepared, employee),
      4,
      28,
      prepared.员工福利,
      prepared.建筑,
    ),
  );
  next.项目 = closedProjects;
  next.工程 = advanceConstructionAfterDay(next.工程);
  Object.assign(next, advanceTemporaryInvestments(next));
  next.建筑 = syncBuildingsWithProjects(normalizeBuildings(next.建筑, next.基建), next.工程);
  next.指名 = next.指名
    .map(item => ({
      ...item,
      剩余天数: Math.max(0, item.剩余天数 - 1),
      预计收入: money(item.每日指名费 + item.预计小费),
    }))
    .filter(item => item.剩余天数 > 0);
  next.基建.维护度 = Math.round(
    clamp(next.基建.维护度 - Math.max(0.18, 0.5 - maintenanceDecayMitigation(next.建筑)), 35, 100),
  );
  next.今日已结算 = true;
  next.营业状态 = '营业中';
  next.暂停保留客流 = 0;
  next.时间 = '00:00';
  next.营业日 += 1;
  next.日期 = nextDateLabel(next.日期);
  next.AI人才市场 = makeBossAiTalentMarketState(next.日期, [
    ...next.员工.map(employee => employee.姓名),
    ...next.招聘.候选.map(candidate => candidate.姓名),
  ]);
  next.节假日 = makeDateHolidayEffect(next.日期);
  next.结算 = {
    ...settlement,
    状态: '已结算',
    流水: settlement.流水.map(entry => ({ ...entry, 营业日: prepared.营业日 })),
  };
  next.客流 = computeTraffic(next);
  next.区域 = makeAreaList(next, next.客流);
  next.经营提醒 = makeReminderList(next);

  return { ok: true, message: 'Đã nghỉ một ngày', state: next };
}

export function settleBossDay(state: BossPageState): BossMutationResult {
  if (state.今日已结算) {
    return { ok: false, message: 'Hôm nay đã kết toán rồi', state };
  }

  const prepared = recalculateBossState(state);
  const settlement = makeSettlement(prepared, prepared.客流, prepared.项目);
  const employeeIncome = computeEmployeeOwnedIncome(prepared, prepared.项目);
  const isClosedToday = prepared.营业状态 === '今日停业';
  const qualityScore = isClosedToday
    ? 70
    : Math.round(
        clamp(
          average(
            prepared.员工.map(employee => employee.评分),
            72,
          ) *
            0.5 +
            prepared.店铺评分 * 7 +
            prepared.基建.维护度 * 0.12 +
            average(
              prepared.员工.map(employee => employee.满意度),
              70,
            ) *
              0.12 +
            builtBuildingLevelTotal(prepared.建筑, '区域') * 0.12 +
            builtBuildingLevelTotal(prepared.建筑, '项目') * 0.16,
          35,
          98,
        ),
      );

  const next = appendLedgerEntry(prepared, {
    类型: settlement.毛利 >= 0 ? '收入' : '支出',
    名称: `第${prepared.营业日}日结算`,
    金额: Math.abs(settlement.毛利),
    资金变动: settlement.毛利,
    说明: 'Kết quả sau khi trừ chi tiêu cửa hàng khỏi doanh thu cửa hàng.',
  });

  const reportMap = new Map(settlement.员工日结.map(report => [report.员工, report]));
  next.员工 = isClosedToday
    ? next.员工.map(employee =>
        updateEmployeeAfterQuietDay(
          employee,
          reportMap.get(employee.姓名) ?? makeEmployeeDayReport(prepared, employee),
          1,
          16,
          prepared.员工福利,
          prepared.建筑,
        ),
      )
    : next.员工.map(employee =>
        updateEmployeeAfterSettlement(
          next,
          employee,
          employeeIncome.get(employee.姓名) ?? 0,
          qualityScore,
          reportMap.get(employee.姓名) ?? makeEmployeeDayReport(prepared, employee),
        ),
      );
  next.项目 = isClosedToday
    ? next.项目.map(project => ({ ...project, 今日订单: 0 }))
    : updateProjectsAfterSettlement(next.项目, qualityScore, prepared.品质投入);
  next.工程 = advanceConstructionAfterDay(next.工程);
  Object.assign(next, advanceTemporaryInvestments(next));
  next.建筑 = syncBuildingsWithProjects(normalizeBuildings(next.建筑, next.基建), next.工程);
  next.指名 = next.指名
    .map(item => ({
      ...item,
      剩余天数: Math.max(0, item.剩余天数 - 1),
      预计收入: money(item.每日指名费 + item.预计小费),
    }))
    .filter(item => item.剩余天数 > 0);
  next.基建.维护度 = Math.round(
    clamp(
      next.基建.维护度 -
        Math.max(
          0.35,
          1 +
            infrastructureLevelTotal(next.基建) * 0.04 +
            builtBuildingLevelTotal(next.建筑) * 0.018 -
            maintenanceDecayMitigation(next.建筑),
        ),
      35,
      100,
    ),
  );
  next.店铺评分 = Number(clamp(next.店铺评分 * 0.82 + (qualityScore / 20) * 0.18, 1, 5).toFixed(2));
  next.好评率 = Number(clamp(next.好评率 * 0.86 + clamp(qualityScore / 100, 0, 1) * 0.14, 0, 1).toFixed(2));
  next.今日已结算 = true;
  next.营业状态 = '营业中';
  next.暂停保留客流 = 0;
  next.时间 = '00:00';
  next.营业日 += 1;
  next.日期 = nextDateLabel(next.日期);
  next.AI人才市场 = makeBossAiTalentMarketState(next.日期, [
    ...next.员工.map(employee => employee.姓名),
    ...next.招聘.候选.map(candidate => candidate.姓名),
  ]);
  next.节假日 = makeDateHolidayEffect(next.日期);
  next.结算 = {
    ...settlement,
    状态: '已结算',
    流水: settlement.流水.map(entry => ({ ...entry, 营业日: prepared.营业日 })),
  };
  next.客流 = computeTraffic(next);
  next.区域 = makeAreaList(next, next.客流);
  next.经营提醒 = makeReminderList(next);

  return { ok: true, message: 'Hôm nay đã kết toán', state: next };
}

function normalizeRecruitment(value: unknown, employeeNames: string[]): BossRecruitmentState {
  const base = makeRecruitmentState(employeeNames, false, Date.now());
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return base;
  }
  const source = value as Partial<BossRecruitmentState & BossRecruitCandidate & { 刷新倒计时?: string }>;
  const legacyCandidate =
    typeof source.姓名 === 'string' && source.姓名 && source.姓名 !== '候选刷新中'
      ? [{
          姓名: source.姓名,
          拒绝记录: Number.isFinite(source.拒绝记录) ? Number(source.拒绝记录) : 0,
          期望日薪: Number.isFinite(source.期望日薪) ? money(Number(source.期望日薪)) : 0,
          说明: typeof source.说明 === 'string' ? source.说明 : '',
        }]
      : [];
  const femaleUser = source.女性限定可见 === true;
  const candidates = (Array.isArray(source.候选) ? source.候选 : legacyCandidate)
    .filter(candidate => candidate && typeof candidate.姓名 === 'string' && candidate.姓名.trim())
    .map(candidate => ({
      姓名: candidate.姓名.trim(),
      拒绝记录: Math.max(0, Math.round(Number(candidate.拒绝记录) || 0)),
      期望日薪: money(Number(candidate.期望日薪) || 0),
      说明: typeof candidate.说明 === 'string' ? candidate.说明 : '',
    }))
    .filter(
      candidate =>
        !LEGACY_TEST_CHARACTER_NAMES.has(candidate.姓名) && isTangquanCharacterAllowed(candidate.姓名, femaleUser),
    );
  const hired = _.uniq([
    ...(Array.isArray(source.已录用)
      ? source.已录用.filter(
          (name): name is string => typeof name === 'string' && !LEGACY_TEST_CHARACTER_NAMES.has(name),
        )
      : []),
    ...employeeNames.filter(name => Boolean(findTangquanCharacter(name))),
  ]);
  const deadline = typeof source.下次刷新时间 === 'string' && Number.isFinite(Date.parse(source.下次刷新时间))
    ? source.下次刷新时间
    : new Date(Date.now() + BOSS_RECRUIT_REFRESH_MS).toISOString();
  return {
    候选: candidates.filter(candidate => !hired.includes(candidate.姓名) && !employeeNames.includes(candidate.姓名)).slice(0, 2),
    下次刷新时间: deadline,
    刷新序号: Math.max(0, Math.round(Number(source.刷新序号) || 0)),
    上次刷新来源: ['initial', 'natural', 'paid'].includes(String(source.上次刷新来源))
      ? source.上次刷新来源 as BossRecruitmentState['上次刷新来源']
      : 'initial',
    已录用: hired,
    女性限定可见: femaleUser,
  };
}

function normalizeBossDailyReport(value: unknown): BossDailyReport | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Partial<BossDailyReport>;
  const text = (input: unknown, maxLength: number) => String(input ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  const title = text(source.标题, 60);
  const date = text(source.日期, 40);
  if (!title || !date) return null;
  const roles: BossEmployeeDayRole[] = ['接待', '值班', '清洁', '休息'];
  const projects = Array.isArray(source.项目日结)
    ? source.项目日结
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          项目: text(item.项目, 40),
          订单: Math.max(0, Math.round(Number(item.订单) || 0)),
          纪要: text(item.纪要, 180),
        }))
        .filter(item => item.项目 && item.纪要)
    : [];
  const employees = Array.isArray(source.员工纪要)
    ? source.员工纪要
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          员工: text(item.员工, 40),
          角色: roles.includes(item.角色 as BossEmployeeDayRole) ? (item.角色 as BossEmployeeDayRole) : '休息',
          纪要: text(item.纪要, 180),
        }))
        .filter(item => item.员工 && item.纪要)
    : [];
  const events = Array.isArray(source.事件纪要)
    ? source.事件纪要
        .filter(item => item && typeof item === 'object')
        .map(item => ({ id: text(item.id, 80), 纪要: text(item.纪要, 180) }))
        .filter(item => item.id && item.纪要)
    : [];
  return {
    version: 1,
    营业日: Math.max(1, Math.round(Number(source.营业日) || 1)),
    日期: date,
    来源: source.来源 === 'ai' ? 'ai' : 'fallback',
    标题: title,
    客人概况: text(source.客人概况, 300),
    收入说明: text(source.收入说明, 300),
    评价说明: text(source.评价说明, 240),
    项目日结: projects,
    员工纪要: employees,
    事件纪要: events,
    收束: text(source.收束, 180),
    问题: Array.isArray(source.问题) ? source.问题.map(item => text(item, 180)).filter(Boolean).slice(0, 12) : [],
  };
}

export function normalizeBossPageState(value: unknown): BossPageState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const source = value as Partial<BossPageState>;
  const base = makeBossPageState();
  const sourceEmployees = Array.isArray(source.员工)
    ? source.员工.filter(employee => !LEGACY_TEST_CHARACTER_NAMES.has(employee.姓名))
    : null;
  const sourceNominations = Array.isArray(source.指名)
    ? source.指名.filter(nomination => !LEGACY_TEST_CHARACTER_NAMES.has(nomination.员工))
    : null;
  const merged: BossPageState = {
    ...base,
    ...source,
    基建: normalizeInfrastructure({ ...base.基建, ...(source.基建 ?? {}) }),
    节假日: { ...base.节假日, ...(source.节假日 ?? {}) },
    结算: {
      ...base.结算,
      ...(source.结算 ?? {}),
      经营纪要: normalizeBossDailyReport(source.结算?.经营纪要),
    },
    员工: sourceEmployees
      ? dedupeBossEmployees(
          sourceEmployees.map(item => ({ ...makeEmployeeFromCandidate(item.姓名, item.评级, item.期望日薪), ...item })),
        )
      : base.员工,
    区域: Array.isArray(source.区域) ? source.区域 : base.区域,
    项目: Array.isArray(source.项目)
      ? source.项目.map(project => ({
          ...(base.项目.find(item => item.名称 === project.名称) ?? base.项目[0]),
          ...project,
        }))
      : base.项目,
    指名: sourceNominations ?? base.指名,
    人才市场: [],
    AI人才市场: normalizeBossAiTalentMarketState(
      source.AI人才市场,
      typeof source.日期 === 'string' ? source.日期 : base.日期,
      [
        ...(sourceEmployees?.map(employee => employee.姓名) ?? base.员工.map(employee => employee.姓名)),
        ...(source.招聘?.候选?.map(candidate => candidate.姓名) ?? []),
      ],
    ),
    招聘: normalizeRecruitment(source.招聘, sourceEmployees?.map(employee => employee.姓名) ?? base.员工.map(employee => employee.姓名)),
    建筑: Array.isArray(source.建筑) ? source.建筑 : base.建筑,
    工程: Array.isArray(source.工程) ? source.工程 : base.工程,
    宣传活动: Array.isArray(source.宣传活动) ? source.宣传活动 : base.宣传活动,
    品质投入: Array.isArray(source.品质投入) ? source.品质投入 : base.品质投入,
    员工福利: source.员工福利 ?? base.员工福利,
    时间控制: normalizeTangquanTimeControlState(source.时间控制),
    看板娘: base.看板娘,
    账本: Array.isArray(source.账本) ? source.账本 : base.账本,
    时间段: Array.isArray(source.时间段) ? source.时间段 : base.时间段,
    经营提醒: Array.isArray(source.经营提醒) ? source.经营提醒 : base.经营提醒,
  };
  const hasStoredHostess = Object.prototype.hasOwnProperty.call(source, '看板娘');
  if (!hasStoredHostess) {
    const atri = findTangquanCharacter('atri');
    let employee = merged.员工.find(item => item.姓名 === 'atri');
    if (!employee) {
      employee = makeBossStarterEmployee('atri', 'atri');
      merged.员工.unshift(employee);
    }
    employee.角色ID = atri?.id ?? 'atri';
    employee.头衔 = 'Linh vật đại diện';
    employee.是否看板娘 = true;
    merged.看板娘 = { version: 1, 已选择: true, 角色ID: atri?.id ?? 'atri', 姓名: 'atri', 来源: 'legacy' };
  } else {
    const stored = source.看板娘;
    const character = stored?.已选择 ? findTangquanCharacter(stored.角色ID || stored.姓名) : null;
    if (character) {
      let employee = merged.员工.find(item => item.姓名 === character.name);
      if (!employee) {
        employee = makeBossStarterEmployee(character.id, character.name);
        merged.员工.unshift(employee);
      }
      merged.员工.forEach(item => {
        item.是否看板娘 = item.姓名 === character.name;
        if (item.是否看板娘) {
          item.角色ID = character.id;
          item.头衔 = 'Linh vật đại diện';
        }
      });
      merged.看板娘 = {
        version: 1,
        已选择: true,
        角色ID: character.id,
        姓名: character.name,
        来源: stored?.来源 === 'legacy' ? 'legacy' : 'new',
      };
    } else {
      merged.看板娘 = { version: 1, 已选择: false, 角色ID: '', 姓名: '', 来源: 'new' };
    }
  }
  if (merged.看板娘.已选择) {
    merged.招聘.候选 = merged.招聘.候选.filter(candidate => candidate.姓名 !== merged.看板娘.姓名);
    merged.招聘.已录用 = _.uniq([...merged.招聘.已录用, merged.看板娘.姓名]);
  }
  return recalculateBossState(merged);
}

export function getBossAverageSatisfaction(state: BossPageState): number {
  return Math.round(
    average(
      state.员工.map(employee => employee.满意度),
      70,
    ),
  );
}

export function getBossInfrastructureCapacity(state: BossPageState): number {
  return storeCapacity(state);
}

export function getBossInfrastructureUpgradeCost(state: BossPageState, key: BossInfrastructureKey): number {
  const current = state.基建[key];
  return getInfrastructureUpgradeCostByLevel(key, current);
}

export function getBossInfrastructureLabel(key: BossInfrastructureKey): string {
  return INFRASTRUCTURE_LABELS[key];
}

export function getBossInfrastructureCatalog(state: BossPageState): BossInfrastructureCatalogItem[] {
  return (Object.keys(INFRASTRUCTURE_LABELS) as BossInfrastructureKey[]).map(key => ({
    key,
    label: INFRASTRUCTURE_LABELS[key],
    level: state.基建[key],
    maxLevel: INFRASTRUCTURE_MAX_LEVEL,
    cost: getInfrastructureUpgradeCostByLevel(key, state.基建[key]),
    days: makeConstructionDays(key, state.基建[key]),
    note: INFRASTRUCTURE_NOTES[key],
    nextUnlocks: getNextUnlocksForKey(state.基建, key),
    isMaxed: state.基建[key] >= INFRASTRUCTURE_MAX_LEVEL,
    inProgress: state.工程.some(project => project.类型 === '基建' && project.设施 === key),
  }));
}

export function getBossUnlockedInfrastructureItems(state: BossPageState): BossInfrastructureUnlock[] {
  return getUnlockedItems(state.建筑);
}

export function getBossUpcomingInfrastructureItems(state: BossPageState): BossInfrastructureUnlock[] {
  return getLockedItems(state.建筑)
    .filter(item =>
      (Object.entries(item.条件) as [BossInfrastructureKey, number][]).every(
        ([key, level]) => state.基建[key] >= level - 1,
      ),
    )
    .slice(0, 8);
}

export function getBossBuildingCatalog(state: BossPageState): BossBuildingCatalogItem[] {
  const prepared = recalculateBossState(state);
  return INFRASTRUCTURE_UNLOCKS.map(definition => {
    const building =
      prepared.建筑.find(item => item.id === definition.id) ??
      makeBuildingStateFromDefinition(definition, undefined, prepared.基建);
    const current = building.状态 === '已建成' ? building.等级 : 0;
    const missing = getMissingRequirements(prepared.基建, definition.条件);
    const inProgress = prepared.工程.some(project => project.类型 === '建筑' && project.建筑ID === definition.id);
    const canStart =
      (building.状态 === '可扩建' || building.状态 === '已建成') && !inProgress && current < BUILDING_MAX_LEVEL;
    return {
      ...definition,
      状态: inProgress
        ? (prepared.工程.find(project => project.类型 === '建筑' && project.建筑ID === definition.id)?.状态 ??
          building.状态)
        : building.状态,
      等级: building.等级,
      maxLevel: BUILDING_MAX_LEVEL,
      cost: getBuildingProjectCostByLevel(definition, current),
      days: makeBuildingProjectDays(definition, current),
      missing,
      canStart,
    };
  });
}

export function getBossMaintenanceCost(state: BossPageState): number {
  if (state.基建.维护度 >= 96) {
    return 0;
  }
  return money(
    (100 - state.基建.维护度) * 260 +
      infrastructureLevelTotal(state.基建) * 360 +
      builtBuildingLevelTotal(state.建筑) * 180,
  );
}

function makeEmployeeFromCandidate(name: string, grade: BossGrade, expectedSalary: number): BossEmployee {
  const character = findTangquanCharacter(name);
  return {
    ...(character ? { 角色ID: character.id } : {}),
    姓名: name,
    评级: grade,
    区域: '大堂',
    状态: '待命',
    日薪: money(expectedSalary),
    期望日薪: money(expectedSalary),
    评分: grade === 'A' ? 78 : grade === 'B' ? 68 : 54,
    满意度: 68,
    疲劳: 0,
    个人收入: 0,
    离职风险: 24,
    低满意天数: 0,
    服务次数: 0,
    指名次数: 0,
    额外结果次数: 0,
    排班: ['待命', '待命', '休息', '休息'],
  };
}

function makeBossStarterEmployee(characterId = 'atri', name = 'atri'): BossEmployee {
  return {
    ...makeEmployeeFromCandidate(name, 'D', 600),
    角色ID: characterId,
    头衔: 'Linh vật đại diện',
    是否看板娘: true,
  };
}
