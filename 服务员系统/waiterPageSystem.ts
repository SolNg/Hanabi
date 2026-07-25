import { defaultServicePricingConfig } from '../员工系统/pricingConfig';
import type {
  EmployeeMarketGrade,
  EmployeeSystemEffect,
  MvuTimeKey,
  RandomSource,
  StorySceneContextRequest,
  StorySceneParticipant,
  StorySceneSession,
  StorySceneSessionId,
} from '../员工系统/types';
import { defaultWaiterPageConfig } from './waiterConfig';
import type {
  WaiterCustomerId,
  WaiterCustomerProfile,
  WaiterId,
  WaiterIncomeRecord,
  WaiterIncomeRecordKind,
  WaiterPageConfig,
  WaiterPageState,
  WaiterServiceSession,
  WaiterServiceSessionId,
  WaiterShiftAssignment,
} from './types';

type WaiterPageResult = {
  state: WaiterPageState;
  effects: EmployeeSystemEffect[];
};

type CreateWaiterCustomerParams = {
  businessDate: string;
  currentTime: MvuTimeKey;
  job?: string;
  sceneKey?: string;
  name?: string;
  age?: number;
  budget?: number;
  nominated?: boolean;
  nominationDays?: number;
  generatedProfileData?: Record<string, unknown>;
  random?: RandomSource;
};

type StartWaiterServiceParams = {
  customerId: WaiterCustomerId;
  currentTime: MvuTimeKey;
  adultContent?: boolean;
  sceneTags?: string[];
  standardStoreRevenue?: number;
  nominationFee?: number;
};

type FinishWaiterServiceParams = {
  sessionId: WaiterServiceSessionId;
  currentTime: MvuTimeKey;
  customerScore: number;
  tip?: number;
  extraServiceIncome?: number;
};

type StartStandaloneSceneParams = {
  businessDate: string;
  currentTime: MvuTimeKey;
  sceneKey?: string;
  adultContent?: boolean;
  sceneTags?: string[];
};

function cloneState(state: WaiterPageState): WaiterPageState {
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

function getRandomItem<T>(items: T[], random: RandomSource): T {
  if (items.length === 0) {
    throw new Error('Cannot choose from empty waiter config list');
  }
  const index = Math.floor(random() * items.length) % items.length;
  return items[index];
}

function getActiveShiftOrThrow(state: WaiterPageState): WaiterShiftAssignment {
  if (!state.activeShift) {
    throw new Error('Waiter has no active shift');
  }
  return state.activeShift;
}

function getCustomerOrThrow(state: WaiterPageState, customerId: WaiterCustomerId): WaiterCustomerProfile {
  const customer = state.customers[customerId];
  if (!customer) {
    throw new Error(`Unknown waiter customer: ${customerId}`);
  }
  return customer;
}

function getServiceSessionOrThrow(state: WaiterPageState, sessionId: WaiterServiceSessionId): WaiterServiceSession {
  const session = state.serviceSessions[sessionId];
  if (!session) {
    throw new Error(`Unknown waiter service session: ${sessionId}`);
  }
  return session;
}

function recalculateIncome(state: WaiterPageState): void {
  state.income.totalPersonalIncome =
    state.income.dailySalary +
    state.income.tipIncome +
    state.income.extraServiceIncome +
    state.income.nominationIncome;
}

function addIncomeRecord(
  state: WaiterPageState,
  params: {
    businessDate: string;
    kind: WaiterIncomeRecordKind;
    amount: number;
    sessionId?: WaiterServiceSessionId;
    customerId?: WaiterCustomerId;
    note?: string;
  },
): WaiterIncomeRecord {
  const record: WaiterIncomeRecord = {
    recordId: createId('waiter_income', params.businessDate, state.income.records.map(item => item.recordId)),
    businessDate: params.businessDate,
    kind: params.kind,
    amount: params.amount,
    sessionId: params.sessionId,
    customerId: params.customerId,
    note: params.note,
  };
  state.income.records.push(record);
  return record;
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
        'Tiếp nhận thao tác hiện tại theo danh tính gameplay nhân viên',
        'Quyết định chủ tiệm, khách, đồng nghiệp hoặc nhân viên nào đang tại chỗ theo danh sách người tham gia',
        'Đẩy chính văn theo vị trí, cảnh, thu nhập và context đánh giá',
        'Chính văn do world book, preset hoặc tầng tiếp nhận Tavern sinh ra, script chỉ cung cấp context cấu trúc hóa',
      ],
      promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định',
    },
  };
}

function createStoryScene(
  state: WaiterPageState,
  params: {
    sessionId: StorySceneSessionId;
    businessDate: string;
    mode: StorySceneSession['mode'];
    sceneKey: string;
    sceneTags?: string[];
    adultContent?: boolean;
    participants: StorySceneParticipant[];
    customerId?: WaiterCustomerId;
    job?: string;
    currentTime: MvuTimeKey;
  },
): StorySceneSession {
  const scene: StorySceneSession = {
    sessionId: params.sessionId,
    businessDate: params.businessDate,
    mode: params.mode,
    phase: '进行中',
    sceneKey: params.sceneKey,
    sceneTags: params.sceneTags ?? [],
    adultContent: params.adultContent ?? false,
    participants: params.participants,
    employeeId: state.waiterId,
    customerId: params.customerId,
    job: params.job,
    startedAtMvuTime: params.currentTime,
  };
  state.storySceneSessions[params.sessionId] = scene;
  state.currentStorySceneSessionId = params.sessionId;
  return scene;
}

function buildWaiterParticipant(state: WaiterPageState): StorySceneParticipant {
  return {
    role: '服务员',
    id: state.waiterId,
    name: state.waiterName,
  };
}

function calculateNominationIncome(
  grade: EmployeeMarketGrade,
  nominationDays: number,
  nominationFee: number | undefined,
  config: WaiterPageConfig,
): number {
  const baseFee = nominationFee ?? defaultServicePricingConfig.gradeNominationFee[grade] ?? 0;
  return Math.max(0, Math.round(baseFee * nominationDays * config.income.nominationShareRate));
}

export function createWaiterPageState(params: {
  waiterId?: WaiterId;
  waiterName: string;
  age: number;
  marketGrade?: EmployeeMarketGrade;
}): WaiterPageState {
  return {
    waiterId: params.waiterId ?? 'player_waiter',
    waiterName: params.waiterName,
    age: params.age,
    marketGrade: params.marketGrade ?? 'D',
    status: '未上班',
    customers: {},
    serviceSessions: {},
    storySceneSessions: {},
    income: {
      dailySalary: 0,
      tipIncome: 0,
      extraServiceIncome: 0,
      nominationIncome: 0,
      totalPersonalIncome: 0,
      settled: false,
      records: [],
    },
    evaluation: {
      reviewCount: 0,
      totalScore: 0,
      averageScore: 0,
      nominationCount: 0,
    },
    logs: [],
  };
}

export function startWaiterWork(
  state: WaiterPageState,
  shift: WaiterShiftAssignment,
): WaiterPageResult {
  const next = cloneState(state);
  next.status = '已上班';
  next.activeShift = shift;
  next.income.businessDate = shift.businessDate;
  next.income.dailySalary = shift.dailySalary;
  next.income.settled = false;
  recalculateIncome(next);
  next.logs.unshift(`Đi làm: ${shift.businessDate} ${shift.startTime}-${shift.endTime} ${shift.sceneKey}/${shift.job}`);

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Nhân viên đi làm: ${shift.sceneKey}/${shift.job}`,
      },
    ],
  };
}

export function markWaiterOnDuty(state: WaiterPageState): WaiterPageResult {
  const next = cloneState(state);
  const shift = getActiveShiftOrThrow(next);
  next.status = '待岗';
  next.logs.unshift(`Đến ca chờ: ${shift.sceneKey}/${shift.job}`);
  return {
    state: next,
    effects: [{ type: 'note', message: `Nhân viên đã đến ca chờ: ${shift.sceneKey}` }],
  };
}

export function takeWaiterRest(state: WaiterPageState): WaiterPageResult {
  const next = cloneState(state);
  next.status = '休息中';
  next.logs.unshift('Vào giờ nghỉ ngơi');
  return {
    state: next,
    effects: [{ type: 'note', message: 'Nhân viên vào trạng thái nghỉ ngơi' }],
  };
}

export function generateWaiterCustomer(
  state: WaiterPageState,
  params: CreateWaiterCustomerParams,
  config: WaiterPageConfig = defaultWaiterPageConfig,
): WaiterPageResult {
  const next = cloneState(state);
  const random = params.random ?? Math.random;
  const shift = next.activeShift;
  const job = params.job ?? shift?.job ?? '服务项目占位';
  const sceneKey = params.sceneKey ?? shift?.sceneKey ?? '场景占位';
  const nominated = params.nominated ?? random() < config.customer.nominationChance;
  const source = nominated ? '指名客' : random() < config.customer.returningCustomerChance ? '回头客' : '新客';
  const ageRange = Math.max(0, config.customer.customerMaxAge - config.customer.customerMinAge);
  const age = params.age ?? config.customer.customerMinAge + Math.floor(random() * (ageRange + 1));
  const budgetSwing = Math.round((random() * 2 - 1) * config.customer.randomBudgetRange);
  const budget = Math.max(0, params.budget ?? config.customer.defaultBudget + budgetSwing);
  const customerId = createId('waiter_customer', params.businessDate, Object.keys(next.customers));
  const customer: WaiterCustomerProfile = {
    customerId,
    name: params.name ?? `${getRandomItem(config.customer.customerNamePool, random)}${Object.keys(next.customers).length + 1}`,
    age,
    source,
    desiredJob: job,
    sceneKey,
    budget,
    nominated,
    nominationDays: params.nominationDays ?? (nominated ? 1 : 0),
    generatedProfileData: params.generatedProfileData,
  };

  next.customers[customerId] = customer;
  next.logs.unshift(`Khách đến: ${customer.name} / ${customer.desiredJob}`);

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Đã sinh dữ liệu cơ bản khách gameplay nhân viên: ${customer.customerId}`,
      },
    ],
  };
}

export function applyWaiterNomination(
  state: WaiterPageState,
  params: {
    customerId: WaiterCustomerId;
    nominationDays?: number;
  },
): WaiterPageResult {
  const next = cloneState(state);
  const customer = getCustomerOrThrow(next, params.customerId);
  customer.nominated = true;
  customer.source = '指名客';
  customer.nominationDays = Math.max(1, params.nominationDays ?? (customer.nominationDays || 1));
  next.status = '被指名';
  next.evaluation.nominationCount += 1;
  next.logs.unshift(`Được chỉ định: ${customer.name} / ${customer.nominationDays} ngày`);

  return {
    state: next,
    effects: [{ type: 'note', message: `Nhân viên được khách chỉ định: ${customer.customerId}` }],
  };
}

export function startWaiterServiceScene(
  state: WaiterPageState,
  params: StartWaiterServiceParams,
  config: WaiterPageConfig = defaultWaiterPageConfig,
): WaiterPageResult {
  const next = cloneState(state);
  const customer = getCustomerOrThrow(next, params.customerId);
  if ((params.adultContent ?? false) && (customer.age < 18 || next.age < 18)) {
    throw new Error('Waiter service scene requires adult participants');
  }

  const businessDate = next.activeShift?.businessDate ?? '未设定营业日';
  const sessionId = createId('waiter_service', businessDate, Object.keys(next.serviceSessions));
  const storySceneSessionId = createId('waiter_scene', businessDate, Object.keys(next.storySceneSessions));
  const nominationIncome = customer.nominated
    ? calculateNominationIncome(next.marketGrade, customer.nominationDays, params.nominationFee, config)
    : 0;
  const serviceSession: WaiterServiceSession = {
    sessionId,
    businessDate,
    status: '服务中',
    customerId: customer.customerId,
    job: customer.desiredJob,
    sceneKey: customer.sceneKey,
    storySceneSessionId,
    standardStoreRevenue: params.standardStoreRevenue ?? config.income.defaultStandardStoreRevenue,
    nominationIncome,
    tip: 0,
    extraServiceIncome: 0,
    startedAtMvuTime: params.currentTime,
  };
  const storyScene = createStoryScene(next, {
    sessionId: storySceneSessionId,
    businessDate,
    mode: customer.nominated ? '被指名陪伴' : '接客服务',
    sceneKey: customer.sceneKey,
    sceneTags: params.sceneTags ?? [],
    adultContent: params.adultContent ?? false,
    participants: [
      buildWaiterParticipant(next),
      {
        role: '客人',
        id: customer.customerId,
        name: customer.name,
      },
    ],
    customerId: customer.customerId,
    job: customer.desiredJob,
    currentTime: params.currentTime,
  });

  next.serviceSessions[sessionId] = serviceSession;
  next.currentSessionId = sessionId;
  next.status = customer.nominated ? '被指名' : '接客中';
  next.logs.unshift(`Bắt đầu tiếp khách: ${customer.name} / ${customer.desiredJob}`);

  return {
    state: next,
    effects: [
      {
        type: 'enter_story_scene',
        sessionId: storySceneSessionId,
        reason: customer.nominated ? 'Khách chỉ định đến, bắt đầu cốt truyện đồng hành chuyên biệt' : 'Khách đến, bắt đầu cốt truyện tiếp khách',
      },
      {
        type: 'request_story_scene_context',
        request: createStorySceneContextRequest(storyScene),
        reason: 'Context cốt truyện tiếp khách của nhân viên đã tạo, giao cho chính văn Tavern tiếp nhận',
      },
    ],
  };
}

export function startBossInspectionScene(
  state: WaiterPageState,
  params: StartStandaloneSceneParams,
): WaiterPageResult {
  const next = cloneState(state);
  const currentSession = next.currentSessionId ? next.serviceSessions[next.currentSessionId] : undefined;
  const customer = currentSession ? next.customers[currentSession.customerId] : undefined;
  const sceneKey = params.sceneKey ?? currentSession?.sceneKey ?? next.activeShift?.sceneKey ?? '工作区域';
  const businessDate = params.businessDate;
  const storySceneSessionId = createId('waiter_boss_scene', businessDate, Object.keys(next.storySceneSessions));
  const participants: StorySceneParticipant[] = [
    buildWaiterParticipant(next),
    { role: '老板', name: '老板' },
  ];
  if (customer) {
    participants.push({ role: '客人', id: customer.customerId, name: customer.name });
  }
  const storyScene = createStoryScene(next, {
    sessionId: storySceneSessionId,
    businessDate,
    mode: '老板巡查',
    sceneKey,
    sceneTags: params.sceneTags ?? [],
    adultContent: params.adultContent ?? false,
    participants,
    customerId: customer?.customerId,
    job: currentSession?.job ?? next.activeShift?.job,
    currentTime: params.currentTime,
  });

  return {
    state: next,
    effects: [
      {
        type: 'enter_story_scene',
        sessionId: storySceneSessionId,
        reason: 'Thao tác chủ tiệm tuần tra được kích hoạt, chuyển sang tầng biểu diễn cốt truyện',
      },
      {
        type: 'request_story_scene_context',
        request: createStorySceneContextRequest(storyScene),
        reason: 'Context cốt truyện chủ tiệm tuần tra đã tạo, giao cho chính văn Tavern tiếp nhận',
      },
    ],
  };
}

export function startBossTalkScene(
  state: WaiterPageState,
  params: StartStandaloneSceneParams,
): WaiterPageResult {
  const next = cloneState(state);
  const businessDate = params.businessDate;
  const storySceneSessionId = createId('waiter_boss_talk', businessDate, Object.keys(next.storySceneSessions));
  const storyScene = createStoryScene(next, {
    sessionId: storySceneSessionId,
    businessDate,
    mode: '老板谈话',
    sceneKey: params.sceneKey ?? '办公室',
    sceneTags: params.sceneTags ?? [],
    adultContent: params.adultContent ?? false,
    participants: [buildWaiterParticipant(next), { role: '老板', name: '老板' }],
    currentTime: params.currentTime,
  });

  return {
    state: next,
    effects: [
      {
        type: 'enter_story_scene',
        sessionId: storySceneSessionId,
        reason: 'Thao tác chủ tiệm trò chuyện được kích hoạt, chuyển sang tầng biểu diễn cốt truyện',
      },
      {
        type: 'request_story_scene_context',
        request: createStorySceneContextRequest(storyScene),
        reason: 'Context cốt truyện chủ tiệm trò chuyện đã tạo, giao cho chính văn Tavern tiếp nhận',
      },
    ],
  };
}

export function startCoworkerScene(
  state: WaiterPageState,
  params: StartStandaloneSceneParams & {
    coworkerId?: string;
    coworkerName?: string;
  },
): WaiterPageResult {
  const next = cloneState(state);
  const businessDate = params.businessDate;
  const storySceneSessionId = createId('waiter_coworker_scene', businessDate, Object.keys(next.storySceneSessions));
  const storyScene = createStoryScene(next, {
    sessionId: storySceneSessionId,
    businessDate,
    mode: '同事互动',
    sceneKey: params.sceneKey ?? '员工休息室',
    sceneTags: params.sceneTags ?? [],
    adultContent: params.adultContent ?? false,
    participants: [
      buildWaiterParticipant(next),
      {
        role: '同事',
        id: params.coworkerId,
        name: params.coworkerName ?? '同事',
      },
    ],
    currentTime: params.currentTime,
  });

  return {
    state: next,
    effects: [
      {
        type: 'enter_story_scene',
        sessionId: storySceneSessionId,
        reason: 'Thao tác tương tác đồng nghiệp được kích hoạt, chuyển sang tầng biểu diễn cốt truyện',
      },
      {
        type: 'request_story_scene_context',
        request: createStorySceneContextRequest(storyScene),
        reason: 'Context cốt truyện tương tác đồng nghiệp đã tạo, giao cho chính văn Tavern tiếp nhận',
      },
    ],
  };
}

export function finishWaiterService(
  state: WaiterPageState,
  params: FinishWaiterServiceParams,
  config: WaiterPageConfig = defaultWaiterPageConfig,
): WaiterPageResult {
  const next = cloneState(state);
  const session = getServiceSessionOrThrow(next, params.sessionId);
  if (session.status !== '服务中' && session.status !== '待结算') {
    throw new Error(`Waiter service session cannot be finished from status: ${session.status}`);
  }

  const tip = Math.max(0, params.tip ?? config.income.defaultTip);
  const extraServiceIncome = Math.max(0, params.extraServiceIncome ?? config.income.defaultExtraServiceIncome);
  session.status = '已完成';
  session.endedAtMvuTime = params.currentTime;
  session.tip = tip;
  session.extraServiceIncome = extraServiceIncome;
  session.customerScore = clamp(params.customerScore, 0, 100);

  next.income.tipIncome += tip;
  next.income.extraServiceIncome += extraServiceIncome;
  next.income.nominationIncome += session.nominationIncome;
  recalculateIncome(next);

  if (tip > 0) {
    addIncomeRecord(next, {
      businessDate: session.businessDate,
      kind: '打赏',
      amount: tip,
      sessionId: session.sessionId,
      customerId: session.customerId,
    });
  }
  if (extraServiceIncome > 0) {
    addIncomeRecord(next, {
      businessDate: session.businessDate,
      kind: '额外服务收入',
      amount: extraServiceIncome,
      sessionId: session.sessionId,
      customerId: session.customerId,
    });
  }
  if (session.nominationIncome > 0) {
    addIncomeRecord(next, {
      businessDate: session.businessDate,
      kind: '指名费收入',
      amount: session.nominationIncome,
      sessionId: session.sessionId,
      customerId: session.customerId,
    });
  }

  next.evaluation.reviewCount += 1;
  next.evaluation.totalScore += session.customerScore;
  next.evaluation.averageScore = next.evaluation.totalScore / next.evaluation.reviewCount;
  const storyScene = next.storySceneSessions[session.storySceneSessionId];
  if (storyScene) {
    storyScene.phase = '已结束';
    storyScene.endedAtMvuTime = params.currentTime;
  }
  const customer = next.customers[session.customerId];
  next.status = customer?.nominated ? '被指名' : '待岗';
  next.currentSessionId = undefined;
  next.currentStorySceneSessionId = undefined;
  next.logs.unshift(`Kết thúc dịch vụ: ${session.customerId} / đánh giá ${session.customerScore}`);

  return {
    state: next,
    effects: [
      {
        type: 'exit_story_scene',
        sessionId: session.storySceneSessionId,
        reason: 'Nhân viên kết thúc tiếp khách, đóng chính văn cốt truyện',
      },
      {
        type: 'note',
        message: `Nhân viên đã hoàn thành quyết toán dịch vụ: ${session.sessionId}`,
      },
    ],
  };
}

export function settleWaiterDay(
  state: WaiterPageState,
  params: {
    businessDate: string;
    currentTime: MvuTimeKey;
  },
): WaiterPageResult {
  const next = cloneState(state);
  if (!next.income.settled && next.income.dailySalary > 0) {
    addIncomeRecord(next, {
      businessDate: params.businessDate,
      kind: '日薪',
      amount: next.income.dailySalary,
    });
  }
  next.income.settled = true;
  recalculateIncome(next);
  next.status = '已下班';
  next.logs.unshift(`Quyết toán tan ca: ${params.currentTime} / thu nhập hôm nay ${next.income.totalPersonalIncome}`);

  return {
    state: next,
    effects: [{ type: 'note', message: `Nhân viên đã hoàn thành quyết toán tan ca: ${next.income.totalPersonalIncome}` }],
  };
}

export function startAfterWorkScene(
  state: WaiterPageState,
  params: StartStandaloneSceneParams,
): WaiterPageResult {
  const next = cloneState(state);
  const businessDate = params.businessDate;
  const storySceneSessionId = createId('waiter_after_work', businessDate, Object.keys(next.storySceneSessions));
  const storyScene = createStoryScene(next, {
    sessionId: storySceneSessionId,
    businessDate,
    mode: '下班休息',
    sceneKey: params.sceneKey ?? '员工休息室',
    sceneTags: params.sceneTags ?? [],
    adultContent: params.adultContent ?? false,
    participants: [buildWaiterParticipant(next)],
    currentTime: params.currentTime,
  });

  return {
    state: next,
    effects: [
      {
        type: 'enter_story_scene',
        sessionId: storySceneSessionId,
        reason: 'Hoạt động sau giờ làm được kích hoạt, chuyển sang tầng biểu diễn cốt truyện',
      },
      {
        type: 'request_story_scene_context',
        request: createStorySceneContextRequest(storyScene),
        reason: 'Context cốt truyện nghỉ ngơi sau tan ca đã tạo, giao cho chính văn Tavern tiếp nhận',
      },
    ],
  };
}
