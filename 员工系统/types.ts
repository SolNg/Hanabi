export type EmployeeId = string;
export type CustomerId = string;
export type ServiceOrderId = string;
export type StorySceneSessionId = string;

export type EmployeeOwnership = 'owned' | 'market' | 'talent_pool';

export type EmployeeMarketGrade = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | '隐藏';

export type EmployeeJobType = string;

export type EmployeeWorldbookBindings = {
  personaEntry: string;
  variableRuleEntry: string;
  initialVariableEntry?: string;
};

export type EmployeePersonalInfo = {
  age: number;
  height?: string;
  cupSize?: string;
  appearanceSummary?: string;
  bodySummary?: string;
  illustrationAsset?: string;
  generatedProfileData?: Record<string, unknown>;
};

export type SalaryMotivationLevel = '低薪敷衍' | '正常工作' | '积极卖力' | '高度投入';

export type StoreDayStatus = '未营业' | '营业中' | '已闭店';

export type ServiceOrderStatus = '等待接待' | '已报价' | '服务中' | '已完成' | '已评价' | '已取消';

export type CustomerVisitSource = '新客' | '老客';

export type StorySceneKind =
  | '查看工作'
  | '服务检查'
  | '老板介入'
  | '员工谈话'
  | '外出约会'
  | '私人体验'
  | '接客服务'
  | '老板巡查'
  | '老板谈话'
  | '同事互动'
  | '被指名陪伴'
  | '下班休息';

export type StoryScenePhase = string;

export type StorySceneParticipantRole = '老板' | '服务员' | '员工' | '客人' | '同事';

export type EmployeeProfile = {
  id: EmployeeId;
  name: string;
  ownership: EmployeeOwnership;
  workHistory: string;
  dailySalary: number;
  expectedDailySalary: number;
  marketGrade: EmployeeMarketGrade;
  marketPrice: number;
  nominationFee: number;
  specialPriceAdjustment: number;
  availableJobs: EmployeeJobType[];
  personalInfo: EmployeePersonalInfo;
  worldbook: EmployeeWorldbookBindings;
  initialVariables: Record<string, unknown>;
};

export type EmployeeRecord = {
  profile: EmployeeProfile;
  active: boolean;
  hiredAt?: string;
  introductionText?: string;
  lastIntroducedAt?: string;
};

export type TalentCandidateRecord = EmployeeRecord & {
  rejectionCount: number;
};

export type TalentMarketListing = {
  listingId: string;
  employeeId: EmployeeId;
  price: number;
  seller: 'player' | 'generated_market';
  createdAt: string;
  generatedByApi: boolean;
};

export type RecruitmentState = {
  currentCandidateId?: EmployeeId;
  refreshedAt?: string;
  nextRefreshAt?: string;
};

export type MvuTimeKey = string;

export type EmployeeShift = {
  shiftId: string;
  employeeId: EmployeeId;
  job: EmployeeJobType;
  sceneKey: string;
  startTime: MvuTimeKey;
  endTime: MvuTimeKey;
};

export type BusinessDailySummary = {
  businessDate: string;
  revenue: number;
  employeePersonalIncome: number;
  salaryExpense: number;
  otherExpense: number;
  grossProfit: number;
  grossMargin: number;
  serviceCount: number;
  totalSatisfaction: number;
  averageSatisfaction: number;
  serviceLogs: string[];
};

export type ServicePricingConfig = {
  gradeNominationFee: Record<EmployeeMarketGrade, number>;
  jobBasePrice: Record<EmployeeJobType, number>;
  scenePriceAdjustment: Record<string, number>;
  salaryMotivationSatisfactionAdjustment: Record<SalaryMotivationLevel, number>;
  defaultConsumableExpense: number;
  defaultTip: number;
};

export type ServiceOrderInput = {
  businessDate: string;
  employeeId: EmployeeId;
  customerName: string;
  job: EmployeeJobType;
  sceneKey: string;
  nominatedEmployeeId?: EmployeeId;
  customTip?: number;
  customEmployeeExtraIncome?: number;
  customConsumableExpense?: number;
  manualPriceAdjustment?: number;
  note?: string;
};

export type ServiceBill = {
  employeeId: EmployeeId;
  customerName: string;
  job: EmployeeJobType;
  sceneKey: string;
  nominatedEmployeeId?: EmployeeId;
  basePrice: number;
  nominationFee: number;
  sceneAdjustment: number;
  specialPriceAdjustment: number;
  manualPriceAdjustment: number;
  tip: number;
  extraServiceIncome: number;
  storeRevenue: number;
  employeePersonalIncome: number;
  customerPayment: number;
  revenue: number;
  consumableExpense: number;
  satisfaction: number;
};

export type StoreEvaluationStats = {
  reviewCount: number;
  totalScore: number;
  averageScore: number;
  trafficMultiplier: number;
};

export type EmployeeEvaluationStats = {
  employeeId: EmployeeId;
  reviewCount: number;
  totalScore: number;
  averageScore: number;
  nominationCount: number;
  nominationRate: number;
  marketGrade: EmployeeMarketGrade;
  lastGradeChangedReviewCount: number;
  lastGradeChangedAt?: string;
};

export type ServiceProjectEvaluationStats = {
  job: EmployeeJobType;
  reviewCount: number;
  totalScore: number;
  averageScore: number;
  trafficMultiplier: number;
};

export type CustomerPreferenceStats = {
  customerName: string;
  visitCount: number;
  nominatedEmployeeCounts: Partial<Record<EmployeeId, number>>;
  projectCounts: Partial<Record<EmployeeJobType, number>>;
  lastVisitedAt?: string;
};

export type CustomerProfile = {
  customerId: CustomerId;
  name: string;
  age: number;
  source: CustomerVisitSource;
  preferredJobs: EmployeeJobType[];
  desiredJob: EmployeeJobType;
  sceneKey: string;
  nominatedEmployeeId?: EmployeeId;
  expectedBudget: number;
  patienceMinutes: number;
  visitCountBeforeToday: number;
};

export type ServiceOrderRecord = {
  orderId: ServiceOrderId;
  businessDate: string;
  customerId: CustomerId;
  customerName: string;
  job: EmployeeJobType;
  sceneKey: string;
  status: ServiceOrderStatus;
  nominatedEmployeeId?: EmployeeId;
  assignedEmployeeId?: EmployeeId;
  bill?: ServiceBill;
  createdAtMvuTime: MvuTimeKey;
  quotedAtMvuTime?: MvuTimeKey;
  startedAtMvuTime?: MvuTimeKey;
  completedAtMvuTime?: MvuTimeKey;
  evaluatedAtMvuTime?: MvuTimeKey;
  storySceneSessionId?: StorySceneSessionId;
  note?: string;
};

export type StoreDaySession = {
  businessDate: string;
  status: StoreDayStatus;
  openedAtMvuTime?: MvuTimeKey;
  closedAtMvuTime?: MvuTimeKey;
  generatedCustomerIds: CustomerId[];
  openOrderIds: ServiceOrderId[];
  completedOrderIds: ServiceOrderId[];
  currentStorySceneSessionId?: StorySceneSessionId;
  salariesPaid: boolean;
};

export type StorySceneParticipant = {
  role: StorySceneParticipantRole;
  id?: string;
  name: string;
};

export type StorySceneSession = {
  sessionId: StorySceneSessionId;
  businessDate: string;
  mode: StorySceneKind;
  phase: StoryScenePhase;
  sceneKey: string;
  sceneTags: string[];
  adultContent: boolean;
  participants: StorySceneParticipant[];
  orderId?: ServiceOrderId;
  employeeId?: EmployeeId;
  customerId?: CustomerId;
  job?: EmployeeJobType;
  startedAtMvuTime: MvuTimeKey;
  endedAtMvuTime?: MvuTimeKey;
  managerIntent?: string;
};

export type StorySceneContextRequest = {
  sessionId: StorySceneSessionId;
  mode: StorySceneKind;
  phase: StoryScenePhase;
  sceneKey: string;
  sceneTags: string[];
  adultContent: boolean;
  participants: StorySceneParticipant[];
  orderId?: ServiceOrderId;
  employeeId?: EmployeeId;
  customerId?: CustomerId;
  job?: EmployeeJobType;
  narrativeBridgePlaceholder: {
    target: '首页台词' | '正文剧情';
    shouldProvide: string[];
    promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định';
  };
};

export type BusinessServiceProjectConfig = {
  job: EmployeeJobType;
  displayName: string;
  enabled: boolean;
  baseDemandWeight: number;
  defaultSceneKey: string;
  baseDurationMinutes: number;
  baseSatisfaction: number;
  defaultConsumableExpense: number;
  allowsStoryScene: boolean;
};

export type CustomerTrafficConfig = {
  baseCustomerCount: number;
  randomCustomerCount: number;
  maxCustomerCount: number;
  customerMinAge: number;
  customerMaxAge: number;
  returningCustomerChance: number;
  nominationChance: number;
  trafficMultiplierWeight: number;
  defaultPatienceMinutes: number;
  defaultExpectedBudget: number;
};

export type OrderLifecycleConfig = {
  requireActiveEmployeeForService: boolean;
  autoAssignNominatedEmployeeFirst: boolean;
};

export type AutoEvaluationConfig = {
  baseStoreScore: number;
  satisfactionScoreWeight: number;
  nominatedEmployeeBonus: number;
  randomScoreSwing: number;
};

export type BusinessOperationConfig = {
  traffic: CustomerTrafficConfig;
  serviceProjects: Record<EmployeeJobType, BusinessServiceProjectConfig>;
  scenePriceAdjustment: Record<string, number>;
  customerNamePool: string[];
  order: OrderLifecycleConfig;
  evaluation: AutoEvaluationConfig;
};

export type CustomerEvaluationInput = {
  businessDate: string;
  customerName: string;
  storeScore: number;
  projectEvaluations: Array<{
    job: EmployeeJobType;
    score: number;
  }>;
  employeeEvaluations: Array<{
    employeeId: EmployeeId;
    score: number;
    nominated: boolean;
  }>;
};

export type EvaluationConfig = {
  storeTrafficRules: Array<{
    minAverageScore: number;
    trafficMultiplier: number;
  }>;
  projectTrafficRules: Array<{
    minAverageScore: number;
    trafficMultiplier: number;
  }>;
  employeeGradeRules: Array<{
    grade: EmployeeMarketGrade;
    minAverageScore: number;
    minReviewCount: number;
    minNominationRate: number;
  }>;
  employeeGradeChangeCooldownReviews: number;
  repeatedNominationPreferenceStep: number;
  repeatedNominationPreferenceCap: number;
};

export type EmployeeSystemState = {
  money: number;
  ownedEmployeeIds: EmployeeId[];
  activeEmployeeIds: EmployeeId[];
  employees: Record<EmployeeId, EmployeeRecord>;
  talentPool: Record<EmployeeId, TalentCandidateRecord>;
  marketListings: TalentMarketListing[];
  recruitment: RecruitmentState;
  shifts: EmployeeShift[];
  customers: Record<CustomerId, CustomerProfile>;
  serviceOrders: Record<ServiceOrderId, ServiceOrderRecord>;
  storeDay?: StoreDaySession;
  storySceneSessions: Record<StorySceneSessionId, StorySceneSession>;
  dailySummaries: Record<string, BusinessDailySummary>;
  storeEvaluation: StoreEvaluationStats;
  projectEvaluations: Partial<Record<EmployeeJobType, ServiceProjectEvaluationStats>>;
  employeeEvaluations: Record<EmployeeId, EmployeeEvaluationStats>;
  customerPreferences: Record<string, CustomerPreferenceStats>;
  registeredInitialVariableIds: EmployeeId[];
};

export type EmployeeSystemEffect =
  | {
      type: 'activate_worldbook_entry';
      employeeId: EmployeeId;
      entryName: string;
      reason: string;
    }
  | {
      type: 'deactivate_worldbook_entry';
      employeeId: EmployeeId;
      entryName: string;
      reason: string;
    }
  | {
      type: 'register_initial_variables';
      employeeId: EmployeeId;
      variables: Record<string, unknown>;
      reason: string;
    }
  | {
      type: 'activate_employee_for_scene';
      employeeId: EmployeeId;
      shiftId: string;
      sceneKey: string;
      job: EmployeeJobType;
      reason: string;
    }
  | {
      type: 'request_market_employee_generation';
      request: {
        requestKind: 'market_employee_profile';
        fieldPlan: 'pending_user_definition';
      };
      reason: string;
    }
  | {
      type: 'request_employee_intro_generation';
      employeeId: EmployeeId;
      rejectionCount: number;
      request: {
        employeeId: EmployeeId;
        rejectionCount: number;
      };
      reason: string;
    }
  | {
      type: 'enter_story_scene';
      sessionId: StorySceneSessionId;
      reason: string;
    }
  | {
      type: 'exit_story_scene';
      sessionId: StorySceneSessionId;
      reason: string;
    }
  | {
      type: 'request_story_scene_context';
      request: StorySceneContextRequest;
      reason: string;
    }
  | {
      type: 'note';
      message: string;
    };

export type EmployeeSystemResult = {
  state: EmployeeSystemState;
  effects: EmployeeSystemEffect[];
};

export type RandomSource = () => number;

export type MvuTimeContext = {
  currentTime: MvuTimeKey;
  currentSceneKey?: string;
  businessDate: string;
};
