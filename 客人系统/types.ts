import type { StorySceneSessionId, EmployeeId, EmployeeJobType, ServiceOrderId } from '../员工系统/types';

export type CustomerPageSessionId = string;

export type CustomerPageSessionStatus = '浏览中' | '剧情中' | '待评价' | '已完成' | '已取消';

export type CustomerMoneyRecordKind = '打工收入' | '服务消费' | '打赏' | '额外消费' | '存款' | '取款' | '日常消费';

export type EmployeeContactStatus = '未请求' | '已同意' | '已拒绝';

export type CustomerPageState = {
  customerName: string;
  age: number;
  cash: number;
  savings: number;
  totalEarned: number;
  totalSpent: number;
  sessions: Record<CustomerPageSessionId, CustomerVisitSession>;
  contacts: Record<EmployeeId, EmployeeContactRecord>;
  moneyRecords: CustomerMoneyRecord[];
};

export type CustomerVisitSession = {
  sessionId: CustomerPageSessionId;
  businessDate: string;
  status: CustomerPageSessionStatus;
  selectedJob: EmployeeJobType;
  selectedEmployeeId: EmployeeId;
  selectedSceneKey: string;
  orderId: ServiceOrderId;
  storySceneSessionId: StorySceneSessionId;
  estimatedPrice: number;
  finalCost?: number;
  tip?: number;
  extraSpend?: number;
  storeScore?: number;
  projectScore?: number;
  employeeScore?: number;
};

export type EmployeeContactRecord = {
  employeeId: EmployeeId;
  status: EmployeeContactStatus;
  requestCount: number;
  totalNominations: number;
  totalTip: number;
  totalSpent: number;
  ratingTotal: number;
  ratingCount: number;
  acceptedAt?: string;
  rejectedAt?: string;
  lastRequestedAt?: string;
};

export type CustomerMoneyRecord = {
  recordId: string;
  businessDate: string;
  kind: CustomerMoneyRecordKind;
  amount: number;
  cashAfter: number;
  savingsAfter: number;
  employeeId?: EmployeeId;
  orderId?: ServiceOrderId;
  note?: string;
};

export type CustomerPromotion = {
  promotionId: string;
  enabled: boolean;
  job?: EmployeeJobType;
  sceneKey?: string;
  discountRate: number;
  flatDiscount: number;
};

export type CustomerServiceProjectOption = {
  job: EmployeeJobType;
  displayName: string;
  sceneKey: string;
  enabled: boolean;
};

export type CustomerEmployeeOption = {
  employeeId: EmployeeId;
  name: string;
  marketGrade: string;
  nominationFee: number;
  availableJobs: EmployeeJobType[];
  illustrationAsset?: string;
};

export type CustomerServiceBillPreview = {
  job: EmployeeJobType;
  employeeId: EmployeeId;
  sceneKey: string;
  baseRevenue: number;
  storeRevenue: number;
  employeePersonalIncome: number;
  customerPayment: number;
  promotionAdjustment: number;
  finalRevenue: number;
  canAfford: boolean;
  cash: number;
  savings: number;
};

export type CustomerPageConfig = {
  work: {
    defaultDailyIncome: number;
    randomIncomeRange: number;
    minDailyIncome: number;
    maxDailyIncome: number;
  };
  payment: {
    allowSavingsFallback: boolean;
  };
  contact: {
    acceptScoreThreshold: number;
    nominationScore: number;
    tipScorePerCurrency: number;
    spendingScorePerCurrency: number;
    ratingScoreWeight: number;
    repeatedRequestPenalty: number;
  };
  promotions: CustomerPromotion[];
};

export type ContactDecision = {
  employeeId: EmployeeId;
  accepted: boolean;
  score: number;
  threshold: number;
  factors: {
    nominations: number;
    totalTip: number;
    totalSpent: number;
    averageRating: number;
    requestCount: number;
  };
};
