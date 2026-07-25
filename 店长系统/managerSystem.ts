import { defaultEvaluationConfig } from '../员工系统/evaluationConfig';
import {
  getEmployeeNominationRate,
  getProjectCustomerTrafficMultiplier,
  getTotalCustomerTrafficMultiplier,
  recordCustomerEvaluation,
} from '../员工系统/evaluationSystem';
import {
  activateScheduledEmployees,
  calculateServiceBill,
  payDailySalaries,
  recordBusinessService,
} from '../员工系统/employeeSystem';
import { defaultServicePricingConfig } from '../员工系统/pricingConfig';
import type {
  StorySceneKind,
  StorySceneContextRequest,
  StoryScenePhase,
  StorySceneSession,
  BusinessOperationConfig,
  BusinessServiceProjectConfig,
  CustomerEvaluationInput,
  CustomerId,
  CustomerPreferenceStats,
  CustomerProfile,
  EmployeeId,
  EmployeeRecord,
  EmployeeSystemEffect,
  EmployeeSystemResult,
  EmployeeSystemState,
  MvuTimeContext,
  RandomSource,
  ServiceBill,
  ServiceOrderId,
  ServiceOrderInput,
  ServiceOrderRecord,
  ServicePricingConfig,
} from '../员工系统/types';
import { defaultBusinessOperationConfig } from './businessConfig';

type CustomerGenerationOptions = {
  count?: number;
  random?: RandomSource;
  config?: BusinessOperationConfig;
};

type ServiceOrderOptions = {
  config?: BusinessOperationConfig;
  pricing?: ServicePricingConfig;
  random?: RandomSource;
};

type StorySceneEntryParams = {
  currentTime: string;
  mode?: StorySceneKind;
  sceneTags?: string[];
  adultContent?: boolean;
  managerIntent?: string;
};

function cloneState(state: EmployeeSystemState): EmployeeSystemState {
  return structuredClone(state);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function uniquePush<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}

function removeItem<T>(items: T[], item: T): T[] {
  return items.filter(current => current !== item);
}

function sanitizeIdPart(value: string): string {
  return value.replace(/[^0-9A-Za-z]/g, '') || 'day';
}

function createSequentialId(prefix: string, businessDate: string, existingIds: string[]): string {
  const dateKey = sanitizeIdPart(businessDate);
  let index = existingIds.length + 1;
  let id = `${prefix}_${dateKey}_${index}`;
  while (existingIds.includes(id)) {
    index += 1;
    id = `${prefix}_${dateKey}_${index}`;
  }
  return id;
}

function chooseWeighted<T>(items: T[], weightOf: (item: T) => number, random: RandomSource): T {
  if (items.length === 0) {
    throw new Error('Cannot choose from empty items');
  }

  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0);
  if (totalWeight <= 0) {
    return items[0];
  }

  let cursor = random() * totalWeight;
  for (const item of items) {
    cursor -= Math.max(0, weightOf(item));
    if (cursor <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}

function assertStoreDayOpen(state: EmployeeSystemState, businessDate: string): void {
  if (!state.storeDay || state.storeDay.businessDate !== businessDate || state.storeDay.status !== '营业中') {
    throw new Error(`Store day is not open: ${businessDate}`);
  }
}

function buildServicePricing(
  config: BusinessOperationConfig,
  pricing: ServicePricingConfig = defaultServicePricingConfig,
): ServicePricingConfig {
  return {
    ...pricing,
    scenePriceAdjustment: {
      ...config.scenePriceAdjustment,
      ...pricing.scenePriceAdjustment,
    },
  };
}

function getProjectConfig(
  config: BusinessOperationConfig,
  order: Pick<ServiceOrderRecord, 'job'>,
): BusinessServiceProjectConfig {
  return config.serviceProjects[order.job];
}

function getEnabledProjectConfigs(config: BusinessOperationConfig): BusinessServiceProjectConfig[] {
  return Object.values(config.serviceProjects).filter(project => project.enabled && project.baseDemandWeight > 0);
}

function getOwnedEmployeeOrThrow(state: EmployeeSystemState, employeeId: EmployeeId): EmployeeRecord {
  const employee = state.employees[employeeId];
  if (!employee || !state.ownedEmployeeIds.includes(employeeId)) {
    throw new Error(`Employee is not owned: ${employeeId}`);
  }
  return employee;
}

function canEmployeeServeOrder(
  state: EmployeeSystemState,
  employeeId: EmployeeId,
  order: ServiceOrderRecord,
  config: BusinessOperationConfig,
): boolean {
  const employee = state.employees[employeeId];
  if (!employee || !state.ownedEmployeeIds.includes(employeeId)) {
    return false;
  }
  if (!employee.profile.availableJobs.includes(order.job)) {
    return false;
  }
  return !config.order.requireActiveEmployeeForService || state.activeEmployeeIds.includes(employeeId);
}

function calculateCustomerCount(
  state: EmployeeSystemState,
  config: BusinessOperationConfig,
  random: RandomSource,
): number {
  const rawCount = config.traffic.baseCustomerCount + Math.floor(random() * (config.traffic.randomCustomerCount + 1));
  const storeMultiplier = getTotalCustomerTrafficMultiplier(state);
  const adjustedMultiplier = 1 + (storeMultiplier - 1) * config.traffic.trafficMultiplierWeight;
  return Math.round(clamp(rawCount * adjustedMultiplier, 0, config.traffic.maxCustomerCount));
}

function chooseReturningCustomer(
  state: EmployeeSystemState,
  config: BusinessOperationConfig,
  random: RandomSource,
): CustomerPreferenceStats | undefined {
  const candidates = Object.values(state.customerPreferences);
  if (candidates.length === 0 || random() > config.traffic.returningCustomerChance) {
    return undefined;
  }
  return chooseWeighted(candidates, candidate => Math.max(1, candidate.visitCount), random);
}

function chooseDesiredProject(
  state: EmployeeSystemState,
  preference: CustomerPreferenceStats | undefined,
  config: BusinessOperationConfig,
  random: RandomSource,
): BusinessServiceProjectConfig {
  const projects = getEnabledProjectConfigs(config);
  return chooseWeighted(
    projects,
    project => {
      const preferenceCount = preference?.projectCounts[project.job] ?? 0;
      const preferenceMultiplier = 1 + Math.min(preferenceCount * 0.12, 0.72);
      return project.baseDemandWeight * getProjectCustomerTrafficMultiplier(state, project.job) * preferenceMultiplier;
    },
    random,
  );
}

function chooseNominatedEmployee(
  state: EmployeeSystemState,
  customerName: string,
  orderJob: ServiceOrderRecord['job'],
  config: BusinessOperationConfig,
  random: RandomSource,
): EmployeeId | undefined {
  const candidates = state.ownedEmployeeIds.filter(employeeId => {
    const employee = state.employees[employeeId];
    return employee?.profile.availableJobs.includes(orderJob);
  });
  if (candidates.length === 0 || random() > config.traffic.nominationChance) {
    return undefined;
  }

  const preference = state.customerPreferences[customerName];
  return chooseWeighted(
    candidates,
    employeeId => {
      const repeatedNominationCount = preference?.nominatedEmployeeCounts[employeeId] ?? 0;
      return 1 + repeatedNominationCount * 2 + getEmployeeNominationRate(state, employeeId) * 4;
    },
    random,
  );
}

function createCustomerProfile(
  state: EmployeeSystemState,
  businessDate: string,
  project: BusinessServiceProjectConfig,
  preference: CustomerPreferenceStats | undefined,
  index: number,
  config: BusinessOperationConfig,
  random: RandomSource,
): CustomerProfile {
  const customerId = createSequentialId('customer', businessDate, Object.keys(state.customers));
  const ageRange = Math.max(0, config.traffic.customerMaxAge - config.traffic.customerMinAge);
  const age = config.traffic.customerMinAge + Math.floor(random() * (ageRange + 1));
  const baseName =
    preference?.customerName ??
    config.customerNamePool[index % Math.max(1, config.customerNamePool.length)] ??
    '客人';
  const name = preference?.customerName ?? `${baseName}${index + 1}`;
  const nominatedEmployeeId = chooseNominatedEmployee(state, name, project.job, config, random);

  return {
    customerId,
    name,
    age,
    source: preference ? '老客' : '新客',
    preferredJobs: [project.job],
    desiredJob: project.job,
    sceneKey: project.defaultSceneKey,
    nominatedEmployeeId,
    expectedBudget: config.traffic.defaultExpectedBudget,
    patienceMinutes: config.traffic.defaultPatienceMinutes,
    visitCountBeforeToday: preference?.visitCount ?? 0,
  };
}

function createWaitingOrder(customer: CustomerProfile, businessDate: string, currentTime: string): ServiceOrderRecord {
  return {
    orderId: `order_${customer.customerId}`,
    businessDate,
    customerId: customer.customerId,
    customerName: customer.name,
    job: customer.desiredJob,
    sceneKey: customer.sceneKey,
    status: '等待接待',
    nominatedEmployeeId: customer.nominatedEmployeeId,
    createdAtMvuTime: currentTime,
  };
}

function buildOrderInputFromRecord(order: ServiceOrderRecord, employeeId: EmployeeId, bill?: ServiceBill): ServiceOrderInput {
  return {
    businessDate: order.businessDate,
    employeeId,
    customerName: order.customerName,
    job: order.job,
    sceneKey: order.sceneKey,
    nominatedEmployeeId: order.nominatedEmployeeId,
    customTip: bill?.tip,
    customConsumableExpense: bill?.consumableExpense,
    manualPriceAdjustment: bill?.manualPriceAdjustment,
    note: order.note,
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
        'Tiếp nhận chính văn hiện trường theo mode/phase/sceneKey/sceneTags',
        'Đọc biến đơn hàng, nhân viên, khách và dự án theo orderId/employeeId/customerId/job',
        'Sau khi trả về kết quả chính văn hoặc lời thoại, frontend chuyển đổi highlight nhân vật và văn bản hiển thị',
      ],
      promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định',
    },
  };
}

function assertStorySceneAllowed(project: BusinessServiceProjectConfig | undefined): void {
  if (!project) {
    return;
  }
  if (!project.allowsStoryScene) {
    throw new Error(`Story scene entry is not enabled for project: ${project.job}`);
  }
}

function assertAdultStorySceneParticipants(
  state: EmployeeSystemState,
  employeeId: EmployeeId | undefined,
  customerId: CustomerId | undefined,
  adultContent: boolean,
): void {
  if (!adultContent) {
    return;
  }

  if (employeeId !== undefined) {
    const employee = getOwnedEmployeeOrThrow(state, employeeId);
    if (employee.profile.personalInfo.age < 18) {
      throw new Error(`Employee is not adult: ${employeeId}`);
    }
  }

  if (customerId !== undefined) {
    const customer = state.customers[customerId];
    if (!customer || customer.age < 18) {
      throw new Error(`Customer is not adult: ${customerId}`);
    }
  }
}

export function openStoreDay(
  state: EmployeeSystemState,
  time: MvuTimeContext,
  config: BusinessOperationConfig = defaultBusinessOperationConfig,
): EmployeeSystemResult {
  const next = cloneState(state);
  if (next.storeDay?.status === '营业中') {
    throw new Error(`Store day is already open: ${next.storeDay.businessDate}`);
  }

  next.storeDay = {
    businessDate: time.businessDate,
    status: '营业中',
    openedAtMvuTime: time.currentTime,
    generatedCustomerIds: [],
    openOrderIds: [],
    completedOrderIds: [],
    salariesPaid: false,
  };

  const activation = activateScheduledEmployees(next, time);

  return {
    state: activation.state,
    effects: [
      {
        type: 'note',
        message: `Suối nước nóng bắt đầu kinh doanh: ${time.businessDate}`,
      },
      ...activation.effects,
      {
        type: 'note',
        message: `Dự án kinh doanh khả dụng hôm nay: ${getEnabledProjectConfigs(config)
          .map(project => project.displayName)
          .join('、')}`,
      },
    ],
  };
}

export function generateCustomerOrders(
  state: EmployeeSystemState,
  time: MvuTimeContext,
  options: CustomerGenerationOptions = {},
): EmployeeSystemResult {
  const config = options.config ?? defaultBusinessOperationConfig;
  const random = options.random ?? Math.random;
  const next = cloneState(state);
  assertStoreDayOpen(next, time.businessDate);

  const count = options.count ?? calculateCustomerCount(next, config, random);
  const effects: EmployeeSystemEffect[] = [];

  for (let index = 0; index < count; index += 1) {
    const preference = chooseReturningCustomer(next, config, random);
    const project = chooseDesiredProject(next, preference, config, random);
    const customer = createCustomerProfile(next, time.businessDate, project, preference, index, config, random);
    const order = createWaitingOrder(customer, time.businessDate, time.currentTime);

    next.customers[customer.customerId] = customer;
    next.serviceOrders[order.orderId] = order;
    next.storeDay!.generatedCustomerIds.push(customer.customerId);
    next.storeDay!.openOrderIds = uniquePush(next.storeDay!.openOrderIds, order.orderId);

    effects.push({
      type: 'note',
      message: `${customer.source} ${customer.name} đến tiệm, dự án dự định: ${project.displayName}${
        customer.nominatedEmployeeId ? `, chỉ định: ${customer.nominatedEmployeeId}` : ''
      }`,
    });
  }

  return { state: next, effects };
}

export function quoteServiceOrder(
  state: EmployeeSystemState,
  orderId: ServiceOrderId,
  employeeId: EmployeeId,
  time: MvuTimeContext,
  options: ServiceOrderOptions = {},
): EmployeeSystemResult {
  const config = options.config ?? defaultBusinessOperationConfig;
  const pricing = buildServicePricing(config, options.pricing);
  const next = cloneState(state);
  assertStoreDayOpen(next, time.businessDate);

  const order = next.serviceOrders[orderId];
  if (!order) {
    throw new Error(`Unknown service order: ${orderId}`);
  }
  if (order.status !== '等待接待' && order.status !== '已报价') {
    throw new Error(`Service order cannot be quoted from status: ${order.status}`);
  }
  if (!canEmployeeServeOrder(next, employeeId, order, config)) {
    throw new Error(`Employee cannot serve order: ${employeeId} / ${orderId}`);
  }

  const project = getProjectConfig(config, order);
  const bill = calculateServiceBill(
    next,
    {
      ...buildOrderInputFromRecord(order, employeeId),
      customConsumableExpense: project.defaultConsumableExpense,
    },
    pricing,
  );

  order.assignedEmployeeId = employeeId;
  order.status = '已报价';
  order.quotedAtMvuTime = time.currentTime;
  order.bill = bill;

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Đơn hàng đã báo giá: ${order.customerName} / ${order.job} / nhân viên ${employeeId} / tổng thanh toán khách ${bill.revenue} / thu nhập tiệm ${bill.storeRevenue}`,
      },
    ],
  };
}

export function autoAssignServiceOrder(
  state: EmployeeSystemState,
  orderId: ServiceOrderId,
  time: MvuTimeContext,
  options: ServiceOrderOptions = {},
): EmployeeSystemResult {
  const config = options.config ?? defaultBusinessOperationConfig;
  const order = state.serviceOrders[orderId];
  if (!order) {
    throw new Error(`Unknown service order: ${orderId}`);
  }

  const candidateIds = state.ownedEmployeeIds.filter(employeeId => canEmployeeServeOrder(state, employeeId, order, config));
  if (candidateIds.length === 0) {
    throw new Error(`No available employee for order: ${orderId}`);
  }

  const employeeId =
    config.order.autoAssignNominatedEmployeeFirst &&
    order.nominatedEmployeeId &&
    candidateIds.includes(order.nominatedEmployeeId)
      ? order.nominatedEmployeeId
      : chooseWeighted(candidateIds, id => 1 + getEmployeeNominationRate(state, id) * 4, options.random ?? Math.random);

  return quoteServiceOrder(state, orderId, employeeId, time, options);
}

export function startServiceOrder(
  state: EmployeeSystemState,
  orderId: ServiceOrderId,
  time: MvuTimeContext,
): EmployeeSystemResult {
  const next = cloneState(state);
  assertStoreDayOpen(next, time.businessDate);

  const order = next.serviceOrders[orderId];
  if (!order) {
    throw new Error(`Unknown service order: ${orderId}`);
  }
  if (order.status !== '已报价' || !order.assignedEmployeeId || !order.bill) {
    throw new Error(`Service order is not ready to start: ${orderId}`);
  }

  order.status = '服务中';
  order.startedAtMvuTime = time.currentTime;

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Dịch vụ bắt đầu: ${order.customerName} / ${order.job} / nhân viên ${order.assignedEmployeeId}`,
      },
    ],
  };
}

export function completeServiceOrder(
  state: EmployeeSystemState,
  orderId: ServiceOrderId,
  time: MvuTimeContext,
  options: ServiceOrderOptions = {},
): EmployeeSystemResult {
  const config = options.config ?? defaultBusinessOperationConfig;
  const pricing = buildServicePricing(config, options.pricing);
  const next = cloneState(state);
  assertStoreDayOpen(next, time.businessDate);

  const order = next.serviceOrders[orderId];
  if (!order) {
    throw new Error(`Unknown service order: ${orderId}`);
  }
  if (order.status !== '服务中' || !order.assignedEmployeeId || !order.bill) {
    throw new Error(`Service order is not in service: ${orderId}`);
  }

  const businessResult = recordBusinessService(
    next,
    buildOrderInputFromRecord(order, order.assignedEmployeeId, order.bill),
    pricing,
  );
  const completed = businessResult.state.serviceOrders[orderId];
  completed.status = '已完成';
  completed.completedAtMvuTime = time.currentTime;
  completed.bill = order.bill;

  if (businessResult.state.storeDay) {
    businessResult.state.storeDay.openOrderIds = removeItem(businessResult.state.storeDay.openOrderIds, orderId);
    businessResult.state.storeDay.completedOrderIds = uniquePush(businessResult.state.storeDay.completedOrderIds, orderId);
  }

  return {
    state: businessResult.state,
    effects: [
      ...businessResult.effects,
      {
        type: 'note',
        message: `Dịch vụ hoàn thành: ${completed.customerName} / ${completed.job} / tổng thanh toán khách ${completed.bill.revenue} / thu nhập tiệm ${completed.bill.storeRevenue}`,
      },
    ],
  };
}

export function createAutomaticCustomerEvaluationInput(
  state: EmployeeSystemState,
  orderId: ServiceOrderId,
  options: {
    config?: BusinessOperationConfig;
    random?: RandomSource;
  } = {},
): CustomerEvaluationInput {
  const config = options.config ?? defaultBusinessOperationConfig;
  const random = options.random ?? Math.random;
  const order = state.serviceOrders[orderId];
  if (!order || !order.bill || !order.assignedEmployeeId) {
    throw new Error(`Order cannot be evaluated automatically: ${orderId}`);
  }

  const project = getProjectConfig(config, order);
  const randomSwing = () => (random() * 2 - 1) * config.evaluation.randomScoreSwing;
  const nominated = order.nominatedEmployeeId === order.assignedEmployeeId;
  const storeScore = clamp(
    Math.round(
      config.evaluation.baseStoreScore +
        (order.bill.satisfaction - 70) * config.evaluation.satisfactionScoreWeight +
        randomSwing(),
    ),
    0,
    100,
  );
  const projectScore = clamp(Math.round((project.baseSatisfaction + order.bill.satisfaction) / 2 + randomSwing()), 0, 100);
  const employeeScore = clamp(
    Math.round(order.bill.satisfaction + (nominated ? config.evaluation.nominatedEmployeeBonus : 0) + randomSwing()),
    0,
    100,
  );

  return {
    businessDate: order.businessDate,
    customerName: order.customerName,
    storeScore,
    projectEvaluations: [
      {
        job: order.job,
        score: projectScore,
      },
    ],
    employeeEvaluations: [
      {
        employeeId: order.assignedEmployeeId,
        score: employeeScore,
        nominated,
      },
    ],
  };
}

export function evaluateServiceOrder(
  state: EmployeeSystemState,
  orderId: ServiceOrderId,
  time: MvuTimeContext,
  input?: CustomerEvaluationInput,
  options: {
    config?: BusinessOperationConfig;
    random?: RandomSource;
  } = {},
): EmployeeSystemResult {
  const next = cloneState(state);
  assertStoreDayOpen(next, time.businessDate);

  const order = next.serviceOrders[orderId];
  if (!order) {
    throw new Error(`Unknown service order: ${orderId}`);
  }
  if (order.status !== '已完成') {
    throw new Error(`Service order is not completed: ${orderId}`);
  }

  const evaluationInput = input ?? createAutomaticCustomerEvaluationInput(next, orderId, options);
  const evaluationResult = recordCustomerEvaluation(next, evaluationInput, defaultEvaluationConfig);
  const evaluated = evaluationResult.state.serviceOrders[orderId];
  evaluated.status = '已评价';
  evaluated.evaluatedAtMvuTime = time.currentTime;

  return {
    state: evaluationResult.state,
    effects: [
      ...evaluationResult.effects,
      {
        type: 'note',
        message: `Đánh giá đơn hàng hoàn thành: ${evaluated.customerName} / ${evaluated.job}`,
      },
    ],
  };
}

export function closeStoreDay(state: EmployeeSystemState, time: MvuTimeContext): EmployeeSystemResult {
  let next = cloneState(state);
  assertStoreDayOpen(next, time.businessDate);

  if (next.storeDay!.openOrderIds.length > 0) {
    throw new Error(`Cannot close store with open orders: ${next.storeDay!.openOrderIds.join(', ')}`);
  }

  const effects: EmployeeSystemEffect[] = [];
  if (!next.storeDay!.salariesPaid) {
    const salaryResult = payDailySalaries(next, time.businessDate);
    next = salaryResult.state;
    next.storeDay!.salariesPaid = true;
    effects.push(...salaryResult.effects);
  }

  next.storeDay!.status = '已闭店';
  next.storeDay!.closedAtMvuTime = time.currentTime;
  effects.push({
    type: 'note',
    message: `Suối nước nóng đóng cửa: ${time.businessDate}`,
  });

  return { state: next, effects };
}

export function openServiceStoryScene(
  state: EmployeeSystemState,
  orderId: ServiceOrderId,
  params: StorySceneEntryParams,
  config: BusinessOperationConfig = defaultBusinessOperationConfig,
): EmployeeSystemResult {
  const next = cloneState(state);
  const order = next.serviceOrders[orderId];
  if (!order || !order.assignedEmployeeId) {
    throw new Error(`Order is not assigned for story scene entry: ${orderId}`);
  }
  if (order.status !== '服务中' && order.status !== '已完成') {
    throw new Error(`Order is not in a story-visible status: ${orderId}`);
  }

  const customer = next.customers[order.customerId];
  const employee = getOwnedEmployeeOrThrow(next, order.assignedEmployeeId);
  const project = getProjectConfig(config, order);
  const mode = params.mode ?? '查看工作';
  const adultContent = params.adultContent ?? false;
  assertStorySceneAllowed(project);
  assertAdultStorySceneParticipants(next, order.assignedEmployeeId, order.customerId, adultContent);

  const sessionId = createSequentialId('story_scene', order.businessDate, Object.keys(next.storySceneSessions));
  const session: StorySceneSession = {
    sessionId,
    businessDate: order.businessDate,
    mode,
    phase: '进行中',
    sceneKey: order.sceneKey,
    sceneTags: params.sceneTags ?? [],
    adultContent,
    participants: [
      { role: '老板', name: '店长' },
      { role: '员工', id: order.assignedEmployeeId, name: employee.profile.name },
      { role: '客人', id: order.customerId, name: customer?.name ?? order.customerName },
    ],
    orderId,
    employeeId: order.assignedEmployeeId,
    customerId: order.customerId,
    job: order.job,
    startedAtMvuTime: params.currentTime,
    managerIntent: params.managerIntent,
  };

  next.storySceneSessions[sessionId] = session;
  order.storySceneSessionId = sessionId;
  if (next.storeDay) {
    next.storeDay.currentStorySceneSessionId = sessionId;
  }

  return {
    state: next,
    effects: [
      {
        type: 'enter_story_scene',
        sessionId,
        reason: 'Hiện trường dịch vụ được xem hoặc can thiệp, chuyển sang tầng biểu diễn cốt truyện',
      },
      {
        type: 'request_story_scene_context',
        request: createStorySceneContextRequest(session),
        reason: 'Context cốt truyện hiện trường đơn hàng đã tạo, giao cho chính văn Tavern tiếp nhận',
      },
    ],
  };
}

export function openEmployeeStoryScene(
  state: EmployeeSystemState,
  employeeId: EmployeeId,
  params: StorySceneEntryParams & {
    businessDate: string;
    sceneKey?: string;
    job?: ServiceOrderRecord['job'];
  },
): EmployeeSystemResult {
  const next = cloneState(state);
  const employee = getOwnedEmployeeOrThrow(next, employeeId);
  const mode = params.mode ?? '员工谈话';
  const adultContent = params.adultContent ?? false;
  assertAdultStorySceneParticipants(next, employeeId, undefined, adultContent);

  const sessionId = createSequentialId('story_scene', params.businessDate, Object.keys(next.storySceneSessions));
  const session: StorySceneSession = {
    sessionId,
    businessDate: params.businessDate,
    mode,
    phase: '进行中',
    sceneKey: params.sceneKey ?? (mode === '外出约会' ? '外出' : '办公室'),
    sceneTags: params.sceneTags ?? [],
    adultContent,
    participants: [
      { role: '老板', name: '店长' },
      { role: '员工', id: employeeId, name: employee.profile.name },
    ],
    employeeId,
    job: params.job,
    startedAtMvuTime: params.currentTime,
    managerIntent: params.managerIntent,
  };

  next.storySceneSessions[sessionId] = session;
  if (next.storeDay) {
    next.storeDay.currentStorySceneSessionId = sessionId;
  }

  return {
    state: next,
    effects: [
      {
        type: 'enter_story_scene',
        sessionId,
        reason: 'Thao tác tương tác nhân viên đã kích hoạt, chuyển sang tầng biểu diễn cốt truyện',
      },
      {
        type: 'request_story_scene_context',
        request: createStorySceneContextRequest(session),
        reason: 'Context cốt truyện tương tác nhân viên đã tạo, giao cho chính văn Tavern tiếp nhận',
      },
    ],
  };
}

export function updateStorySceneProgress(
  state: EmployeeSystemState,
  sessionId: string,
  updates: {
    phase?: StoryScenePhase;
    sceneTags?: string[];
    adultContent?: boolean;
  },
  config: BusinessOperationConfig = defaultBusinessOperationConfig,
): EmployeeSystemResult {
  const next = cloneState(state);
  const session = next.storySceneSessions[sessionId];
  if (!session) {
    throw new Error(`Unknown story scene session: ${sessionId}`);
  }
  if (session.phase === '已结束') {
    throw new Error(`Story scene session already ended: ${sessionId}`);
  }

  if (updates.adultContent !== undefined) {
    const project = session.job ? config.serviceProjects[session.job] : undefined;
    assertStorySceneAllowed(project);
    assertAdultStorySceneParticipants(next, session.employeeId, session.customerId, updates.adultContent);
    session.adultContent = updates.adultContent;
  }
  if (updates.phase) {
    session.phase = updates.phase;
  }
  if (updates.sceneTags) {
    session.sceneTags = updates.sceneTags;
  }

  return {
    state: next,
    effects: [
      {
        type: 'request_story_scene_context',
        request: createStorySceneContextRequest(session),
        reason: 'Trạng thái cảnh cốt truyện đã cập nhật, trả về context hiện trường hiện tại',
      },
    ],
  };
}

export function exitStoryScene(
  state: EmployeeSystemState,
  sessionId: string,
  currentTime: string,
): EmployeeSystemResult {
  const next = cloneState(state);
  const session = next.storySceneSessions[sessionId];
  if (!session) {
    throw new Error(`Unknown story scene session: ${sessionId}`);
  }

  session.phase = '已结束';
  session.endedAtMvuTime = currentTime;
  if (next.storeDay?.currentStorySceneSessionId === sessionId) {
    next.storeDay.currentStorySceneSessionId = undefined;
  }

  return {
    state: next,
    effects: [
      {
        type: 'exit_story_scene',
        sessionId,
        reason: 'Cảnh cốt truyện kết thúc, quay về thao tác kinh doanh',
      },
    ],
  };
}
