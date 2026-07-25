import type {
  EmployeeJobType,
  EmployeeMarketGrade,
  MvuTimeKey,
  StorySceneSession,
  StorySceneSessionId,
} from '../员工系统/types';

export type WaiterId = string;
export type WaiterCustomerId = string;
export type WaiterServiceSessionId = string;

export type WaiterWorkStatus = '未上班' | '已上班' | '待岗' | '接客中' | '休息中' | '被指名' | '已下班';

export type WaiterServiceSessionStatus = '服务中' | '待结算' | '已完成' | '已取消';

export type WaiterCustomerSource = '新客' | '回头客' | '指名客';

export type WaiterIncomeRecordKind = '日薪' | '打赏' | '额外服务收入' | '指名费收入';

export type WaiterShiftAssignment = {
  shiftId: string;
  businessDate: string;
  job: EmployeeJobType;
  sceneKey: string;
  startTime: MvuTimeKey;
  endTime: MvuTimeKey;
  dailySalary: number;
};

export type WaiterCustomerProfile = {
  customerId: WaiterCustomerId;
  name: string;
  age: number;
  source: WaiterCustomerSource;
  desiredJob: EmployeeJobType;
  sceneKey: string;
  budget: number;
  nominated: boolean;
  nominationDays: number;
  generatedProfileData?: Record<string, unknown>;
};

export type WaiterServiceSession = {
  sessionId: WaiterServiceSessionId;
  businessDate: string;
  status: WaiterServiceSessionStatus;
  customerId: WaiterCustomerId;
  job: EmployeeJobType;
  sceneKey: string;
  storySceneSessionId: StorySceneSessionId;
  standardStoreRevenue: number;
  nominationIncome: number;
  tip: number;
  extraServiceIncome: number;
  customerScore?: number;
  startedAtMvuTime: MvuTimeKey;
  endedAtMvuTime?: MvuTimeKey;
};

export type WaiterIncomeRecord = {
  recordId: string;
  businessDate: string;
  kind: WaiterIncomeRecordKind;
  amount: number;
  sessionId?: WaiterServiceSessionId;
  customerId?: WaiterCustomerId;
  note?: string;
};

export type WaiterIncomeSummary = {
  businessDate?: string;
  dailySalary: number;
  tipIncome: number;
  extraServiceIncome: number;
  nominationIncome: number;
  totalPersonalIncome: number;
  settled: boolean;
  records: WaiterIncomeRecord[];
};

export type WaiterEvaluationSummary = {
  reviewCount: number;
  totalScore: number;
  averageScore: number;
  nominationCount: number;
};

export type WaiterPageState = {
  waiterId: WaiterId;
  waiterName: string;
  age: number;
  marketGrade: EmployeeMarketGrade;
  status: WaiterWorkStatus;
  activeShift?: WaiterShiftAssignment;
  currentSessionId?: WaiterServiceSessionId;
  currentStorySceneSessionId?: StorySceneSessionId;
  customers: Record<WaiterCustomerId, WaiterCustomerProfile>;
  serviceSessions: Record<WaiterServiceSessionId, WaiterServiceSession>;
  storySceneSessions: Record<StorySceneSessionId, StorySceneSession>;
  income: WaiterIncomeSummary;
  evaluation: WaiterEvaluationSummary;
  logs: string[];
};

export type WaiterCustomerGenerationConfig = {
  customerNamePool: string[];
  customerMinAge: number;
  customerMaxAge: number;
  defaultBudget: number;
  randomBudgetRange: number;
  returningCustomerChance: number;
  nominationChance: number;
};

export type WaiterIncomeConfig = {
  defaultDailySalary: number;
  defaultStandardStoreRevenue: number;
  defaultTip: number;
  defaultExtraServiceIncome: number;
  nominationShareRate: number;
};

export type WaiterPageConfig = {
  customer: WaiterCustomerGenerationConfig;
  income: WaiterIncomeConfig;
};
