import { defaultBusinessOperationConfig } from '../店长系统/businessConfig';
import { recordCustomerEvaluation } from '../员工系统/evaluationSystem';
import { calculateServiceBill, recordBusinessService } from '../员工系统/employeeSystem';
import { defaultEvaluationConfig } from '../员工系统/evaluationConfig';
import { defaultServicePricingConfig } from '../员工系统/pricingConfig';
import type {
  StorySceneContextRequest,
  StorySceneSession,
  BusinessOperationConfig,
  CustomerEvaluationInput,
  CustomerProfile,
  EmployeeId,
  EmployeeRecord,
  EmployeeSystemEffect,
  EmployeeSystemState,
  RandomSource,
  ServiceBill,
  ServiceOrderRecord,
  ServicePricingConfig,
} from '../员工系统/types';
import { defaultCustomerPageConfig } from './customerConfig';
import type {
  ContactDecision,
  CustomerMoneyRecord,
  CustomerMoneyRecordKind,
  CustomerPageConfig,
  CustomerPageState,
  CustomerEmployeeOption,
  CustomerPromotion,
  CustomerServiceBillPreview,
  CustomerServiceProjectOption,
  CustomerVisitSession,
  EmployeeContactRecord,
} from './types';

type CustomerPageResult = {
  systemState: EmployeeSystemState;
  customerState: CustomerPageState;
  effects: EmployeeSystemEffect[];
};

type CustomerContactResult = CustomerPageResult & {
  decision: ContactDecision;
};

type StartCustomerServiceParams = {
  businessDate: string;
  currentTime: string;
  job: string;
  employeeId: EmployeeId;
  sceneKey?: string;
  adultContent?: boolean;
  sceneTags?: string[];
};

type FinishCustomerServiceParams = {
  sessionId: string;
  currentTime: string;
  storeScore: number;
  projectScore: number;
  employeeScore: number;
  tip?: number;
  extraSpend?: number;
};

type CustomerMoneyParams = {
  businessDate: string;
  amount: number;
  note?: string;
};

function cloneCustomerState(state: CustomerPageState): CustomerPageState {
  return structuredClone(state);
}

function cloneSystemState(state: EmployeeSystemState): EmployeeSystemState {
  return structuredClone(state);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeIdPart(value: string): string {
  return value.replace(/[^0-9A-Za-z]/g, '') || 'record';
}

function createId(prefix: string, businessDate: string, existingIds: string[]): string {
  const dateKey = sanitizeIdPart(businessDate);
  let index = existingIds.length + 1;
  let id = `${prefix}_${dateKey}_${index}`;
  while (existingIds.includes(id)) {
    index += 1;
    id = `${prefix}_${dateKey}_${index}`;
  }
  return id;
}

function getOwnedEmployeeOrThrow(systemState: EmployeeSystemState, employeeId: EmployeeId): EmployeeRecord {
  const employee = systemState.employees[employeeId];
  if (!employee || !systemState.ownedEmployeeIds.includes(employeeId)) {
    throw new Error(`Employee is not available for customer page: ${employeeId}`);
  }
  return employee;
}

function getCustomerContactRecord(state: CustomerPageState, employeeId: EmployeeId): EmployeeContactRecord {
  return (
    state.contacts[employeeId] ?? {
      employeeId,
      status: '未请求',
      requestCount: 0,
      totalNominations: 0,
      totalTip: 0,
      totalSpent: 0,
      ratingTotal: 0,
      ratingCount: 0,
    }
  );
}

function getProjectConfig(config: BusinessOperationConfig, job: string) {
  const project = config.serviceProjects[job];
  if (!project) {
    throw new Error(`Unknown customer service project: ${job}`);
  }
  return project;
}

function calculatePromotionAdjustment(promotions: CustomerPromotion[], job: string, sceneKey: string, baseRevenue: number): number {
  const activePromotions = promotions.filter(promotion => {
    if (!promotion.enabled) return false;
    if (promotion.job && promotion.job !== job) return false;
    if (promotion.sceneKey && promotion.sceneKey !== sceneKey) return false;
    return true;
  });

  return activePromotions.reduce((adjustment, promotion) => {
    const rateDiscount = Math.max(0, baseRevenue * promotion.discountRate);
    const flatDiscount = Math.max(0, promotion.flatDiscount);
    return adjustment - rateDiscount - flatDiscount;
  }, 0);
}

function createMoneyRecord(
  state: CustomerPageState,
  params: {
    businessDate: string;
    kind: CustomerMoneyRecordKind;
    amount: number;
    employeeId?: EmployeeId;
    orderId?: string;
    note?: string;
  },
): CustomerMoneyRecord {
  return {
    recordId: createId('money', params.businessDate, state.moneyRecords.map(record => record.recordId)),
    businessDate: params.businessDate,
    kind: params.kind,
    amount: params.amount,
    cashAfter: state.cash,
    savingsAfter: state.savings,
    employeeId: params.employeeId,
    orderId: params.orderId,
    note: params.note,
  };
}

function addMoneyRecord(
  state: CustomerPageState,
  params: {
    businessDate: string;
    kind: CustomerMoneyRecordKind;
    amount: number;
    employeeId?: EmployeeId;
    orderId?: string;
    note?: string;
  },
): void {
  state.moneyRecords.push(createMoneyRecord(state, params));
}

function deductCustomerMoney(
  state: CustomerPageState,
  amount: number,
  config: CustomerPageConfig,
): void {
  if (amount <= 0) {
    return;
  }
  if (state.cash >= amount) {
    state.cash -= amount;
    return;
  }
  if (!config.payment.allowSavingsFallback) {
    throw new Error(`Not enough cash: ${amount}`);
  }

  const remaining = amount - state.cash;
  if (state.savings < remaining) {
    throw new Error(`Not enough customer money: ${amount}`);
  }
  state.cash = 0;
  state.savings -= remaining;
}

function createPlayerCustomerProfile(state: CustomerPageState, params: StartCustomerServiceParams, sceneKey: string): CustomerProfile {
  return {
    customerId: 'player_customer',
    name: state.customerName,
    age: state.age,
    source: '老客',
    preferredJobs: [params.job],
    desiredJob: params.job,
    sceneKey,
    nominatedEmployeeId: params.employeeId,
    expectedBudget: state.cash + state.savings,
    patienceMinutes: 0,
    visitCountBeforeToday: 0,
  };
}

function createStorySceneContextRequest(session: StorySceneSession): StorySceneContextRequest {
  return {
    sessionId: session.sessionId,
    mode: session.mode,
    phase: session.phase,
    sceneKey: session.sceneKey,
    sceneTags: session.sceneTags,
    adultContent: session.adultContent,
    participants: session.participants,
    orderId: session.orderId,
    employeeId: session.employeeId,
    customerId: session.customerId,
    job: session.job,
    narrativeBridgePlaceholder: {
      target: '正文剧情',
      shouldProvide: [
        'Quyết định nhân vật đang tại chỗ và người nói hiện tại theo participants',
        'Tiếp nhận chính văn dịch vụ hoặc lời thoại trang chính theo mode/phase/sceneKey/sceneTags',
        'Đọc biến dịch vụ, nhân viên, khách và dự án theo orderId/employeeId/customerId/job',
        'Sau khi trả về kết quả chính văn hoặc lời thoại, frontend chuyển đổi highlight nhân vật và văn bản hiển thị',
      ],
      promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định',
    },
  };
}

function buildEvaluationInput(
  order: ServiceOrderRecord,
  params: FinishCustomerServiceParams,
): CustomerEvaluationInput {
  if (!order.assignedEmployeeId) {
    throw new Error(`Customer order has no assigned employee: ${order.orderId}`);
  }

  return {
    businessDate: order.businessDate,
    customerName: order.customerName,
    storeScore: clamp(params.storeScore, 0, 100),
    projectEvaluations: [
      {
        job: order.job,
        score: clamp(params.projectScore, 0, 100),
      },
    ],
    employeeEvaluations: [
      {
        employeeId: order.assignedEmployeeId,
        score: clamp(params.employeeScore, 0, 100),
        nominated: order.nominatedEmployeeId === order.assignedEmployeeId,
      },
    ],
  };
}

function buildPricingWithBusinessConfig(
  businessConfig: BusinessOperationConfig,
  pricing: ServicePricingConfig,
): ServicePricingConfig {
  return {
    ...pricing,
    scenePriceAdjustment: {
      ...businessConfig.scenePriceAdjustment,
      ...pricing.scenePriceAdjustment,
    },
  };
}

export function createCustomerPageState(params: {
  customerName: string;
  age: number;
  cash: number;
  savings?: number;
}): CustomerPageState {
  return {
    customerName: params.customerName,
    age: params.age,
    cash: params.cash,
    savings: params.savings ?? 0,
    totalEarned: 0,
    totalSpent: 0,
    sessions: {},
    contacts: {},
    moneyRecords: [],
  };
}

export function listCustomerServiceProjects(
  businessConfig: BusinessOperationConfig = defaultBusinessOperationConfig,
): CustomerServiceProjectOption[] {
  return Object.values(businessConfig.serviceProjects).map(project => ({
    job: project.job,
    displayName: project.displayName,
    sceneKey: project.defaultSceneKey,
    enabled: project.enabled,
  }));
}

export function listCustomerSelectableEmployees(
  systemState: EmployeeSystemState,
  job?: string,
): CustomerEmployeeOption[] {
  return systemState.ownedEmployeeIds
    .map(employeeId => systemState.employees[employeeId])
    .filter(employee => employee && (!job || employee.profile.availableJobs.includes(job)))
    .map(employee => ({
      employeeId: employee.profile.id,
      name: employee.profile.name,
      marketGrade: employee.profile.marketGrade,
      nominationFee: employee.profile.nominationFee,
      availableJobs: employee.profile.availableJobs,
      illustrationAsset: employee.profile.personalInfo.illustrationAsset,
    }));
}

export function getActiveCustomerPromotions(
  job: string,
  sceneKey: string,
  config: CustomerPageConfig = defaultCustomerPageConfig,
): CustomerPromotion[] {
  return config.promotions.filter(promotion => {
    if (!promotion.enabled) return false;
    if (promotion.job && promotion.job !== job) return false;
    if (promotion.sceneKey && promotion.sceneKey !== sceneKey) return false;
    return true;
  });
}

export function previewCustomerServiceBill(
  systemState: EmployeeSystemState,
  customerState: CustomerPageState,
  params: {
    businessDate: string;
    job: string;
    employeeId: EmployeeId;
    sceneKey?: string;
  },
  options: {
    businessConfig?: BusinessOperationConfig;
    customerConfig?: CustomerPageConfig;
    pricing?: ServicePricingConfig;
  } = {},
): CustomerServiceBillPreview {
  const businessConfig = options.businessConfig ?? defaultBusinessOperationConfig;
  const customerConfig = options.customerConfig ?? defaultCustomerPageConfig;
  const pricing = buildPricingWithBusinessConfig(businessConfig, options.pricing ?? defaultServicePricingConfig);
  const employee = getOwnedEmployeeOrThrow(systemState, params.employeeId);
  const project = getProjectConfig(businessConfig, params.job);
  const sceneKey = params.sceneKey ?? project.defaultSceneKey;
  if (!employee.profile.availableJobs.includes(params.job)) {
    throw new Error(`Employee cannot serve selected project: ${params.employeeId} / ${params.job}`);
  }

  const baseBill = calculateServiceBill(
    systemState,
    {
      businessDate: params.businessDate,
      employeeId: params.employeeId,
      customerName: customerState.customerName,
      job: params.job,
      sceneKey,
      nominatedEmployeeId: params.employeeId,
      customTip: 0,
      customConsumableExpense: project.defaultConsumableExpense,
    },
    pricing,
  );
  const promotionAdjustment = calculatePromotionAdjustment(customerConfig.promotions, params.job, sceneKey, baseBill.storeRevenue);
  const storeRevenue = Math.max(0, baseBill.storeRevenue + promotionAdjustment);
  const employeePersonalIncome = baseBill.employeePersonalIncome;
  const finalRevenue = storeRevenue + employeePersonalIncome;

  return {
    job: params.job,
    employeeId: params.employeeId,
    sceneKey,
    baseRevenue: baseBill.revenue,
    storeRevenue,
    employeePersonalIncome,
    customerPayment: finalRevenue,
    promotionAdjustment,
    finalRevenue,
    canAfford: customerState.cash + (customerConfig.payment.allowSavingsFallback ? customerState.savings : 0) >= finalRevenue,
    cash: customerState.cash,
    savings: customerState.savings,
  };
}

export function workCustomerDay(
  customerState: CustomerPageState,
  params: CustomerMoneyParams & {
    random?: RandomSource;
  },
  config: CustomerPageConfig = defaultCustomerPageConfig,
): CustomerPageState {
  const next = cloneCustomerState(customerState);
  const random = params.random ?? Math.random;
  const randomIncome = Math.round((random() * 2 - 1) * config.work.randomIncomeRange);
  const income = clamp(params.amount || config.work.defaultDailyIncome + randomIncome, config.work.minDailyIncome, config.work.maxDailyIncome);

  next.cash += income;
  next.totalEarned += income;
  addMoneyRecord(next, {
    businessDate: params.businessDate,
    kind: '打工收入',
    amount: income,
    note: params.note,
  });

  return next;
}

export function depositCustomerMoney(customerState: CustomerPageState, params: CustomerMoneyParams): CustomerPageState {
  const next = cloneCustomerState(customerState);
  if (params.amount <= 0) {
    throw new Error('Deposit amount must be positive');
  }
  if (next.cash < params.amount) {
    throw new Error(`Not enough cash to deposit: ${params.amount}`);
  }
  next.cash -= params.amount;
  next.savings += params.amount;
  addMoneyRecord(next, {
    businessDate: params.businessDate,
    kind: '存款',
    amount: params.amount,
    note: params.note,
  });
  return next;
}

export function withdrawCustomerMoney(customerState: CustomerPageState, params: CustomerMoneyParams): CustomerPageState {
  const next = cloneCustomerState(customerState);
  if (params.amount <= 0) {
    throw new Error('Withdraw amount must be positive');
  }
  if (next.savings < params.amount) {
    throw new Error(`Not enough savings to withdraw: ${params.amount}`);
  }
  next.savings -= params.amount;
  next.cash += params.amount;
  addMoneyRecord(next, {
    businessDate: params.businessDate,
    kind: '取款',
    amount: params.amount,
    note: params.note,
  });
  return next;
}

export function spendCustomerMoney(
  customerState: CustomerPageState,
  params: CustomerMoneyParams & {
    kind?: CustomerMoneyRecordKind;
  },
  config: CustomerPageConfig = defaultCustomerPageConfig,
): CustomerPageState {
  const next = cloneCustomerState(customerState);
  if (params.amount <= 0) {
    throw new Error('Spend amount must be positive');
  }
  deductCustomerMoney(next, params.amount, config);
  next.totalSpent += params.amount;
  addMoneyRecord(next, {
    businessDate: params.businessDate,
    kind: params.kind ?? '日常消费',
    amount: params.amount,
    note: params.note,
  });
  return next;
}

export function startCustomerServiceScene(
  systemState: EmployeeSystemState,
  customerState: CustomerPageState,
  params: StartCustomerServiceParams,
  options: {
    businessConfig?: BusinessOperationConfig;
    customerConfig?: CustomerPageConfig;
    pricing?: ServicePricingConfig;
  } = {},
): CustomerPageResult {
  const businessConfig = options.businessConfig ?? defaultBusinessOperationConfig;
  const customerConfig = options.customerConfig ?? defaultCustomerPageConfig;
  const pricing = buildPricingWithBusinessConfig(businessConfig, options.pricing ?? defaultServicePricingConfig);
  const nextSystem = cloneSystemState(systemState);
  const nextCustomer = cloneCustomerState(customerState);
  const employee = getOwnedEmployeeOrThrow(nextSystem, params.employeeId);
  const project = getProjectConfig(businessConfig, params.job);
  const sceneKey = params.sceneKey ?? project.defaultSceneKey;
  const adultContent = params.adultContent ?? false;

  if (adultContent && (nextCustomer.age < 18 || employee.profile.personalInfo.age < 18)) {
    throw new Error('Adult story scene requires adult participants');
  }
  if (!employee.profile.availableJobs.includes(params.job)) {
    throw new Error(`Employee cannot serve selected project: ${params.employeeId} / ${params.job}`);
  }

  const baseBill = calculateServiceBill(
    nextSystem,
    {
      businessDate: params.businessDate,
      employeeId: params.employeeId,
      customerName: nextCustomer.customerName,
      job: params.job,
      sceneKey,
      nominatedEmployeeId: params.employeeId,
      customTip: 0,
      customConsumableExpense: project.defaultConsumableExpense,
    },
    pricing,
  );
  const promotionAdjustment = calculatePromotionAdjustment(customerConfig.promotions, params.job, sceneKey, baseBill.storeRevenue);
  const bill = calculateServiceBill(
    nextSystem,
    {
      businessDate: params.businessDate,
      employeeId: params.employeeId,
      customerName: nextCustomer.customerName,
      job: params.job,
      sceneKey,
      nominatedEmployeeId: params.employeeId,
      customTip: 0,
      customConsumableExpense: project.defaultConsumableExpense,
      manualPriceAdjustment: promotionAdjustment,
    },
    pricing,
  );

  if (nextCustomer.cash + (customerConfig.payment.allowSavingsFallback ? nextCustomer.savings : 0) < bill.revenue) {
    throw new Error(`Not enough money to start service: ${bill.revenue}`);
  }

  const sessionId = createId('customer_session', params.businessDate, Object.keys(nextCustomer.sessions));
  const orderId = createId('customer_order', params.businessDate, Object.keys(nextSystem.serviceOrders));
  const storySceneSessionId = createId('customer_scene', params.businessDate, Object.keys(nextSystem.storySceneSessions));
  const customerProfile = createPlayerCustomerProfile(nextCustomer, params, sceneKey);
  const order: ServiceOrderRecord = {
    orderId,
    businessDate: params.businessDate,
    customerId: customerProfile.customerId,
    customerName: customerProfile.name,
    job: params.job,
    sceneKey,
    status: '服务中',
    nominatedEmployeeId: params.employeeId,
    assignedEmployeeId: params.employeeId,
    bill,
    createdAtMvuTime: params.currentTime,
    quotedAtMvuTime: params.currentTime,
    startedAtMvuTime: params.currentTime,
    storySceneSessionId,
  };
  const storyScene: StorySceneSession = {
    sessionId: storySceneSessionId,
    businessDate: params.businessDate,
    mode: '私人体验',
    phase: '进行中',
    sceneKey,
    sceneTags: params.sceneTags ?? [],
    adultContent,
    participants: [
      { role: '客人', id: customerProfile.customerId, name: customerProfile.name },
      { role: '员工', id: params.employeeId, name: employee.profile.name },
    ],
    orderId,
    employeeId: params.employeeId,
    customerId: customerProfile.customerId,
    job: params.job,
    startedAtMvuTime: params.currentTime,
  };
  const customerSession: CustomerVisitSession = {
    sessionId,
    businessDate: params.businessDate,
    status: '剧情中',
    selectedJob: params.job,
    selectedEmployeeId: params.employeeId,
    selectedSceneKey: sceneKey,
    orderId,
    storySceneSessionId,
    estimatedPrice: bill.revenue,
  };

  nextSystem.customers[customerProfile.customerId] = customerProfile;
  nextSystem.serviceOrders[orderId] = order;
  nextSystem.storySceneSessions[storySceneSessionId] = storyScene;
  nextCustomer.sessions[sessionId] = customerSession;

  return {
    systemState: nextSystem,
    customerState: nextCustomer,
    effects: [
      {
        type: 'enter_story_scene',
        sessionId: storySceneSessionId,
        reason: 'Sau khi khách xác nhận dịch vụ thì bắt đầu chính văn cốt truyện',
      },
      {
        type: 'request_story_scene_context',
        request: createStorySceneContextRequest(storyScene),
        reason: 'Context cốt truyện dịch vụ đã tạo, giao cho chính văn Tavern tiếp nhận',
      },
    ],
  };
}

export function finishCustomerService(
  systemState: EmployeeSystemState,
  customerState: CustomerPageState,
  params: FinishCustomerServiceParams,
  options: {
    businessConfig?: BusinessOperationConfig;
    customerConfig?: CustomerPageConfig;
    pricing?: ServicePricingConfig;
  } = {},
): CustomerPageResult {
  const businessConfig = options.businessConfig ?? defaultBusinessOperationConfig;
  const customerConfig = options.customerConfig ?? defaultCustomerPageConfig;
  const pricing = buildPricingWithBusinessConfig(businessConfig, options.pricing ?? defaultServicePricingConfig);
  const nextSystem = cloneSystemState(systemState);
  const nextCustomer = cloneCustomerState(customerState);
  const session = nextCustomer.sessions[params.sessionId];
  if (!session) {
    throw new Error(`Unknown customer session: ${params.sessionId}`);
  }
  if (session.status !== '剧情中' && session.status !== '待评价') {
    throw new Error(`Customer session cannot be finished from status: ${session.status}`);
  }

  const order = nextSystem.serviceOrders[session.orderId];
  if (!order || !order.assignedEmployeeId || !order.bill) {
    throw new Error(`Customer order cannot be finished: ${session.orderId}`);
  }

  const tip = Math.max(0, params.tip ?? 0);
  const extraSpend = Math.max(0, params.extraSpend ?? 0);
  const manualAdjustment = order.bill.manualPriceAdjustment;
  const finalBillInput = {
    businessDate: order.businessDate,
    employeeId: order.assignedEmployeeId,
    customerName: order.customerName,
    job: order.job,
    sceneKey: order.sceneKey,
    nominatedEmployeeId: order.nominatedEmployeeId,
    customTip: tip,
    customEmployeeExtraIncome: extraSpend,
    customConsumableExpense: order.bill.consumableExpense,
    manualPriceAdjustment: manualAdjustment,
  };
  const businessResult = recordBusinessService(
    nextSystem,
    finalBillInput,
    pricing,
  );
  const paidOrder = businessResult.state.serviceOrders[session.orderId];
  const finalBill: ServiceBill = calculateServiceBill(businessResult.state, finalBillInput, pricing);
  paidOrder.status = '已完成';
  paidOrder.completedAtMvuTime = params.currentTime;
  paidOrder.bill = finalBill;

  const evaluationResult = recordCustomerEvaluation(
    businessResult.state,
    buildEvaluationInput(paidOrder, params),
    defaultEvaluationConfig,
  );
  const evaluatedOrder = evaluationResult.state.serviceOrders[session.orderId];
  evaluatedOrder.status = '已评价';
  evaluatedOrder.evaluatedAtMvuTime = params.currentTime;
  evaluatedOrder.bill = finalBill;

  const storyScene = evaluationResult.state.storySceneSessions[session.storySceneSessionId];
  if (storyScene) {
    storyScene.phase = '已结束';
    storyScene.endedAtMvuTime = params.currentTime;
  }

  deductCustomerMoney(nextCustomer, finalBill.revenue, customerConfig);
  nextCustomer.totalSpent += finalBill.revenue;
  session.status = '已完成';
  session.finalCost = finalBill.revenue;
  session.tip = tip;
  session.extraSpend = extraSpend;
  session.storeScore = clamp(params.storeScore, 0, 100);
  session.projectScore = clamp(params.projectScore, 0, 100);
  session.employeeScore = clamp(params.employeeScore, 0, 100);

  addMoneyRecord(nextCustomer, {
    businessDate: order.businessDate,
    kind: '服务消费',
    amount: finalBill.revenue - tip - extraSpend,
    employeeId: order.assignedEmployeeId,
    orderId: order.orderId,
  });
  if (tip > 0) {
    addMoneyRecord(nextCustomer, {
      businessDate: order.businessDate,
      kind: '打赏',
      amount: tip,
      employeeId: order.assignedEmployeeId,
      orderId: order.orderId,
    });
  }
  if (extraSpend > 0) {
    addMoneyRecord(nextCustomer, {
      businessDate: order.businessDate,
      kind: '额外消费',
      amount: extraSpend,
      employeeId: order.assignedEmployeeId,
      orderId: order.orderId,
    });
  }

  const contact = getCustomerContactRecord(nextCustomer, order.assignedEmployeeId);
  contact.totalNominations += order.nominatedEmployeeId === order.assignedEmployeeId ? 1 : 0;
  contact.totalTip += tip;
  contact.totalSpent += finalBill.revenue;
  contact.ratingTotal += clamp(params.employeeScore, 0, 100);
  contact.ratingCount += 1;
  nextCustomer.contacts[order.assignedEmployeeId] = contact;

  return {
    systemState: evaluationResult.state,
    customerState: nextCustomer,
    effects: [
      ...businessResult.effects,
      ...evaluationResult.effects,
      {
        type: 'exit_story_scene',
        sessionId: session.storySceneSessionId,
        reason: 'Dịch vụ của khách kết thúc, đóng chính văn cốt truyện',
      },
    ],
  };
}

export function requestEmployeeContact(
  systemState: EmployeeSystemState,
  customerState: CustomerPageState,
  params: {
    employeeId: EmployeeId;
    businessDate: string;
  },
  config: CustomerPageConfig = defaultCustomerPageConfig,
): CustomerContactResult {
  getOwnedEmployeeOrThrow(systemState, params.employeeId);
  const nextCustomer = cloneCustomerState(customerState);
  const contact = getCustomerContactRecord(nextCustomer, params.employeeId);
  const averageRating = contact.ratingCount <= 0 ? 0 : contact.ratingTotal / contact.ratingCount;
  const score =
    contact.totalNominations * config.contact.nominationScore +
    contact.totalTip * config.contact.tipScorePerCurrency +
    contact.totalSpent * config.contact.spendingScorePerCurrency +
    averageRating * config.contact.ratingScoreWeight -
    contact.requestCount * config.contact.repeatedRequestPenalty;
  const accepted = score >= config.contact.acceptScoreThreshold;

  contact.requestCount += 1;
  contact.lastRequestedAt = params.businessDate;
  contact.status = accepted ? '已同意' : '已拒绝';
  if (accepted) {
    contact.acceptedAt = params.businessDate;
  } else {
    contact.rejectedAt = params.businessDate;
  }
  nextCustomer.contacts[params.employeeId] = contact;

  return {
    systemState,
    customerState: nextCustomer,
    effects: [
      {
        type: 'note',
        message: accepted ? `Yêu cầu liên hệ đã được đồng ý: ${params.employeeId}` : `Yêu cầu liên hệ chưa được đồng ý: ${params.employeeId}`,
      },
    ],
    decision: {
      employeeId: params.employeeId,
      accepted,
      score,
      threshold: config.contact.acceptScoreThreshold,
      factors: {
        nominations: contact.totalNominations,
        totalTip: contact.totalTip,
        totalSpent: contact.totalSpent,
        averageRating,
        requestCount: contact.requestCount,
      },
    },
  };
}

export function startPrivateDateScene(
  systemState: EmployeeSystemState,
  customerState: CustomerPageState,
  params: {
    employeeId: EmployeeId;
    businessDate: string;
    currentTime: string;
    sceneKey?: string;
    adultContent?: boolean;
    sceneTags?: string[];
  },
): CustomerPageResult {
  const nextSystem = cloneSystemState(systemState);
  const nextCustomer = cloneCustomerState(customerState);
  const employee = getOwnedEmployeeOrThrow(nextSystem, params.employeeId);
  const contact = getCustomerContactRecord(nextCustomer, params.employeeId);
  if (contact.status !== '已同意') {
    throw new Error(`Employee contact is not accepted: ${params.employeeId}`);
  }
  const adultContent = params.adultContent ?? false;
  if (adultContent && (nextCustomer.age < 18 || employee.profile.personalInfo.age < 18)) {
    throw new Error('Adult story scene requires adult participants');
  }

  const storySceneSessionId = createId('private_scene', params.businessDate, Object.keys(nextSystem.storySceneSessions));
  const storyScene: StorySceneSession = {
    sessionId: storySceneSessionId,
    businessDate: params.businessDate,
    mode: '外出约会',
    phase: '进行中',
    sceneKey: params.sceneKey ?? '外出',
    sceneTags: params.sceneTags ?? [],
    adultContent,
    participants: [
      { role: '客人', id: 'player_customer', name: nextCustomer.customerName },
      { role: '员工', id: params.employeeId, name: employee.profile.name },
    ],
    employeeId: params.employeeId,
    customerId: 'player_customer',
    startedAtMvuTime: params.currentTime,
  };
  nextSystem.storySceneSessions[storySceneSessionId] = storyScene;

  return {
    systemState: nextSystem,
    customerState: nextCustomer,
    effects: [
      {
        type: 'enter_story_scene',
        sessionId: storySceneSessionId,
        reason: 'Liên hệ đã được đồng ý, bắt đầu cốt truyện hẹn riêng',
      },
      {
        type: 'request_story_scene_context',
        request: createStorySceneContextRequest(storyScene),
        reason: 'Context cốt truyện hẹn riêng đã tạo, giao cho chính văn Tavern tiếp nhận',
      },
    ],
  };
}
