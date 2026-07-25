import { defaultServicePricingConfig } from './pricingConfig';
import type {
  BusinessDailySummary,
  EmployeeId,
  EmployeeProfile,
  EmployeeRecord,
  EmployeeShift,
  EmployeeSystemEffect,
  EmployeeSystemResult,
  EmployeeSystemState,
  MvuTimeContext,
  RandomSource,
  SalaryMotivationLevel,
  ServiceBill,
  ServiceOrderInput,
  ServicePricingConfig,
  TalentCandidateRecord,
  TalentMarketListing,
} from './types';

const DEFAULT_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 12;

function cloneState(state: EmployeeSystemState): EmployeeSystemState {
  return structuredClone(state);
}

function uniquePush<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}

function removeItem<T>(items: T[], item: T): T[] {
  return items.filter(current => current !== item);
}

function createEmployeeRecord(profile: EmployeeProfile): EmployeeRecord {
  return {
    profile,
    active: false,
  };
}

function createTalentCandidateRecord(profile: EmployeeProfile): TalentCandidateRecord {
  return {
    profile,
    active: false,
    rejectionCount: 0,
  };
}

function getEmployeeOrThrow(state: EmployeeSystemState, employeeId: EmployeeId): EmployeeRecord {
  const employee = state.employees[employeeId];
  if (!employee) {
    throw new Error(`Unknown owned employee: ${employeeId}`);
  }
  return employee;
}

function getTalentCandidateOrThrow(state: EmployeeSystemState, employeeId: EmployeeId): TalentCandidateRecord {
  const employee = state.talentPool[employeeId];
  if (!employee) {
    throw new Error(`Unknown talent candidate: ${employeeId}`);
  }
  return employee;
}

function getAnyEmployeeOrThrow(state: EmployeeSystemState, employeeId: EmployeeId): EmployeeRecord | TalentCandidateRecord {
  return state.employees[employeeId] ?? state.talentPool[employeeId] ?? (() => {
    throw new Error(`Unknown employee: ${employeeId}`);
  })();
}

function getRandomItem<T>(items: T[], random: RandomSource): T | undefined {
  if (items.length === 0) return undefined;
  const index = Math.floor(random() * items.length) % items.length;
  return items[index];
}

function timeToMinutes(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return 0;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function isTimeInShift(currentTime: string, startTime: string, endTime: string): boolean {
  const current = timeToMinutes(currentTime);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (start <= end) {
    return current >= start && current < end;
  }
  return current >= start || current < end;
}

function buildEmployeeActivationEffects(employee: EmployeeRecord, reasonPrefix: string): EmployeeSystemEffect[] {
  const employeeId = employee.profile.id;
  return [
    {
      type: 'activate_worldbook_entry',
      employeeId,
      entryName: employee.profile.worldbook.personaEntry,
      reason: `${reasonPrefix}: kích hoạt entry thiết lập nhân vật của nhân viên`,
    },
    {
      type: 'activate_worldbook_entry',
      employeeId,
      entryName: employee.profile.worldbook.variableRuleEntry,
      reason: `${reasonPrefix}: kích hoạt entry quy tắc biến của nhân viên`,
    },
  ];
}

function createEmptyDailySummary(businessDate: string): BusinessDailySummary {
  return {
    businessDate,
    revenue: 0,
    employeePersonalIncome: 0,
    salaryExpense: 0,
    otherExpense: 0,
    grossProfit: 0,
    grossMargin: 0,
    serviceCount: 0,
    totalSatisfaction: 0,
    averageSatisfaction: 0,
    serviceLogs: [],
  };
}

function recalculateDailySummary(summary: BusinessDailySummary): BusinessDailySummary {
  const grossProfit = summary.revenue - summary.salaryExpense - summary.otherExpense;
  const averageSatisfaction = summary.serviceCount <= 0 ? 0 : summary.totalSatisfaction / summary.serviceCount;
  return {
    ...summary,
    grossProfit,
    grossMargin: summary.revenue <= 0 ? 0 : grossProfit / summary.revenue,
    averageSatisfaction,
  };
}

export function getSalaryMotivationLevel(employee: EmployeeRecord): SalaryMotivationLevel {
  const { dailySalary, expectedDailySalary } = employee.profile;
  if (expectedDailySalary <= 0) {
    return '正常工作';
  }

  const ratio = dailySalary / expectedDailySalary;
  if (ratio < 0.75) return '低薪敷衍';
  if (ratio < 1) return '正常工作';
  if (ratio < 1.35) return '积极卖力';
  return '高度投入';
}

export function calculateServiceBill(
  state: EmployeeSystemState,
  order: ServiceOrderInput,
  pricing: ServicePricingConfig = defaultServicePricingConfig,
): ServiceBill {
  const employee = getEmployeeOrThrow(state, order.employeeId);
  const motivation = getSalaryMotivationLevel(employee);
  const basePrice = pricing.jobBasePrice[order.job] ?? 0;
  const nominationFee =
    order.nominatedEmployeeId === order.employeeId
      ? employee.profile.nominationFee || pricing.gradeNominationFee[employee.profile.marketGrade] || 0
      : 0;
  const sceneAdjustment = pricing.scenePriceAdjustment[order.sceneKey] ?? 0;
  const specialPriceAdjustment = employee.profile.specialPriceAdjustment;
  const manualPriceAdjustment = order.manualPriceAdjustment ?? 0;
  const tip = order.customTip ?? pricing.defaultTip;
  const extraServiceIncome = order.customEmployeeExtraIncome ?? 0;
  const consumableExpense = order.customConsumableExpense ?? pricing.defaultConsumableExpense;
  const storeRevenue = Math.max(0, basePrice + sceneAdjustment + specialPriceAdjustment + manualPriceAdjustment);
  const employeePersonalIncome = Math.max(0, nominationFee + tip + extraServiceIncome);
  const customerPayment = storeRevenue + employeePersonalIncome;
  const satisfaction = Math.max(
    0,
    Math.min(100, 70 + pricing.salaryMotivationSatisfactionAdjustment[motivation]),
  );

  return {
    employeeId: order.employeeId,
    customerName: order.customerName,
    job: order.job,
    sceneKey: order.sceneKey,
    nominatedEmployeeId: order.nominatedEmployeeId,
    basePrice,
    nominationFee,
    sceneAdjustment,
    specialPriceAdjustment,
    manualPriceAdjustment,
    tip,
    extraServiceIncome,
    storeRevenue,
    employeePersonalIncome,
    customerPayment,
    revenue: customerPayment,
    consumableExpense,
    satisfaction,
  };
}

export function createEmployeeSystemState(params: {
  money: number;
  ownedEmployees?: EmployeeProfile[];
  talentPool?: EmployeeProfile[];
  marketListings?: TalentMarketListing[];
  shifts?: EmployeeShift[];
}): EmployeeSystemState {
  const employees: EmployeeSystemState['employees'] = {};
  const talentPool: EmployeeSystemState['talentPool'] = {};
  const ownedEmployeeIds: EmployeeId[] = [];

  for (const profile of params.ownedEmployees ?? []) {
    employees[profile.id] = createEmployeeRecord({ ...profile, ownership: 'owned' });
    ownedEmployeeIds.push(profile.id);
  }

  for (const profile of params.talentPool ?? []) {
    if (!employees[profile.id]) {
      talentPool[profile.id] = createTalentCandidateRecord({ ...profile, ownership: 'talent_pool' });
    }
  }

  return {
    money: params.money,
    ownedEmployeeIds,
    activeEmployeeIds: [],
    employees,
    talentPool,
    marketListings: params.marketListings ?? [],
    recruitment: {},
    shifts: params.shifts ?? [],
    customers: {},
    serviceOrders: {},
    storySceneSessions: {},
    dailySummaries: {},
    storeEvaluation: {
      reviewCount: 0,
      totalScore: 0,
      averageScore: 0,
      trafficMultiplier: 1,
    },
    projectEvaluations: {},
    employeeEvaluations: {},
    customerPreferences: {},
    registeredInitialVariableIds: [],
  };
}

export function activateEmployee(state: EmployeeSystemState, employeeId: EmployeeId): EmployeeSystemResult {
  const next = cloneState(state);
  const effects: EmployeeSystemEffect[] = [];
  const employee = getEmployeeOrThrow(next, employeeId);

  if (!next.ownedEmployeeIds.includes(employeeId)) {
    throw new Error(`Employee is not owned: ${employeeId}`);
  }

  employee.active = true;
  next.activeEmployeeIds = uniquePush(next.activeEmployeeIds, employeeId);
  effects.push(...buildEmployeeActivationEffects(employee, 'Bấm thủ công vào nhân viên'));

  if (!next.registeredInitialVariableIds.includes(employeeId)) {
    next.registeredInitialVariableIds.push(employeeId);
    effects.push({
      type: 'register_initial_variables',
      employeeId,
      variables: employee.profile.initialVariables,
      reason: 'Đăng ký biến ban đầu khi nhân viên kích hoạt lần đầu',
    });
  }

  return { state: next, effects };
}

export function deactivateEmployee(state: EmployeeSystemState, employeeId: EmployeeId): EmployeeSystemResult {
  const next = cloneState(state);
  const effects: EmployeeSystemEffect[] = [];
  const employee = getEmployeeOrThrow(next, employeeId);

  employee.active = false;
  next.activeEmployeeIds = removeItem(next.activeEmployeeIds, employeeId);

  effects.push({
    type: 'deactivate_worldbook_entry',
    employeeId,
    entryName: employee.profile.worldbook.personaEntry,
    reason: 'Tắt entry thiết lập nhân vật tương ứng sau khi nhân viên rời hiện trường',
  });
  effects.push({
    type: 'deactivate_worldbook_entry',
    employeeId,
    entryName: employee.profile.worldbook.variableRuleEntry,
    reason: 'Tắt entry quy tắc biến tương ứng sau khi nhân viên rời hiện trường',
  });

  return { state: next, effects };
}

export function assignEmployeeShift(state: EmployeeSystemState, shift: EmployeeShift): EmployeeSystemResult {
  const next = cloneState(state);
  const employee = getEmployeeOrThrow(next, shift.employeeId);

  if (!employee.profile.availableJobs.includes(shift.job)) {
    throw new Error(`${employee.profile.name} cannot work as ${shift.job}`);
  }

  next.shifts = next.shifts.filter(current => current.shiftId !== shift.shiftId);
  next.shifts.push(shift);

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Đã xếp ca cho ${employee.profile.name}: ${shift.startTime}-${shift.endTime} ${shift.sceneKey}/${shift.job}`,
      },
    ],
  };
}

export function removeEmployeeShift(state: EmployeeSystemState, shiftId: string): EmployeeSystemResult {
  const next = cloneState(state);
  next.shifts = next.shifts.filter(shift => shift.shiftId !== shiftId);
  return {
    state: next,
    effects: [{ type: 'note', message: `Đã xóa lịch xếp ca: ${shiftId}` }],
  };
}

export function activateScheduledEmployees(state: EmployeeSystemState, time: MvuTimeContext): EmployeeSystemResult {
  const next = cloneState(state);
  const effects: EmployeeSystemEffect[] = [];
  const activeShiftEmployeeIds = new Set<EmployeeId>();

  for (const shift of next.shifts) {
    const sceneMatched = time.currentSceneKey === undefined || shift.sceneKey === time.currentSceneKey;
    const timeMatched = isTimeInShift(time.currentTime, shift.startTime, shift.endTime);
    if (!sceneMatched || !timeMatched) {
      continue;
    }

    const employee = getEmployeeOrThrow(next, shift.employeeId);
    employee.active = true;
    activeShiftEmployeeIds.add(shift.employeeId);
    next.activeEmployeeIds = uniquePush(next.activeEmployeeIds, shift.employeeId);

    effects.push(...buildEmployeeActivationEffects(employee, 'Thời gian và cảnh MVU khớp lịch xếp ca'));
    effects.push({
      type: 'activate_employee_for_scene',
      employeeId: shift.employeeId,
      shiftId: shift.shiftId,
      sceneKey: shift.sceneKey,
      job: shift.job,
      reason: 'Đã đến thời gian và cảnh MVU tương ứng, kích hoạt nhân viên phụ trách công việc này',
    });
  }

  for (const employeeId of [...next.activeEmployeeIds]) {
    if (!activeShiftEmployeeIds.has(employeeId)) {
      const employee = getEmployeeOrThrow(next, employeeId);
      employee.active = false;
      next.activeEmployeeIds = removeItem(next.activeEmployeeIds, employeeId);
      effects.push({
        type: 'deactivate_worldbook_entry',
        employeeId,
        entryName: employee.profile.worldbook.personaEntry,
        reason: 'Thời gian hoặc cảnh MVU hiện tại không khớp lịch xếp ca, tắt entry thiết lập nhân vật',
      });
      effects.push({
        type: 'deactivate_worldbook_entry',
        employeeId,
        entryName: employee.profile.worldbook.variableRuleEntry,
        reason: 'Thời gian hoặc cảnh MVU hiện tại không khớp lịch xếp ca, tắt entry quy tắc biến nhân viên',
      });
    }
  }

  return { state: next, effects };
}

export function payDailySalaries(state: EmployeeSystemState, businessDate: string): EmployeeSystemResult {
  const next = cloneState(state);
  const summary = next.dailySummaries[businessDate] ?? createEmptyDailySummary(businessDate);
  const paidEmployeeIds = new Set<EmployeeId>();

  for (const shift of next.shifts) {
    if (paidEmployeeIds.has(shift.employeeId)) {
      continue;
    }
    const employee = getEmployeeOrThrow(next, shift.employeeId);
    summary.salaryExpense += employee.profile.dailySalary;
    next.money -= employee.profile.dailySalary;
    paidEmployeeIds.add(shift.employeeId);
  }

  next.dailySummaries[businessDate] = recalculateDailySummary(summary);

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Đã quyết toán lương ngày nhân viên ${businessDate}, chi ${summary.salaryExpense}`,
      },
    ],
  };
}

export function recordBusinessService(
  state: EmployeeSystemState,
  order: ServiceOrderInput,
  pricing: ServicePricingConfig = defaultServicePricingConfig,
): EmployeeSystemResult {
  const next = cloneState(state);
  const employee = getEmployeeOrThrow(next, order.employeeId);
  const bill = calculateServiceBill(next, order, pricing);
  const summary = next.dailySummaries[order.businessDate] ?? createEmptyDailySummary(order.businessDate);

  summary.revenue += bill.storeRevenue;
  summary.employeePersonalIncome += bill.employeePersonalIncome;
  summary.otherExpense += bill.consumableExpense;
  summary.serviceCount += 1;
  summary.totalSatisfaction += bill.satisfaction;
  summary.serviceLogs.push(
    `${employee.profile.name} đã tiếp đón ${order.customerName}, dự án: ${order.job}, thu nhập tiệm: ${bill.storeRevenue}, thu nhập cá nhân: ${bill.employeePersonalIncome}${
      order.note ? `, ghi chú: ${order.note}` : ''
    }`,
  );
  next.money += bill.storeRevenue - bill.consumableExpense;
  next.dailySummaries[order.businessDate] = recalculateDailySummary(summary);

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Đã ghi tiểu mục kinh doanh: ${employee.profile.name} / ${order.customerName} / ${order.job}`,
      },
    ],
  };
}

export function requestMarketEmployeeGeneration(state: EmployeeSystemState): EmployeeSystemResult {
  return {
    state: cloneState(state),
    effects: [
      {
        type: 'request_market_employee_generation',
        request: {
          requestKind: 'market_employee_profile',
          fieldPlan: 'pending_user_definition',
        },
        reason: 'Khi chợ nhân tài cần hồ sơ nhân viên không có sẵn, logic cốt lõi chỉ đánh dấu cần hồ sơ nhân viên, trường cụ thể chờ người dùng xác định',
      },
    ],
  };
}

export function addGeneratedMarketEmployee(
  state: EmployeeSystemState,
  profile: EmployeeProfile,
  now = new Date(),
): EmployeeSystemResult {
  const next = cloneState(state);
  const employeeId = profile.id;
  next.employees[employeeId] = createEmployeeRecord({ ...profile, ownership: 'market' });
  next.marketListings.push({
    listingId: `generated_${employeeId}_${now.getTime()}`,
    employeeId,
    price: profile.marketPrice,
    seller: 'generated_market',
    createdAt: now.toISOString(),
    generatedByApi: true,
  });

  return {
    state: next,
    effects: [{ type: 'note', message: `Đã thêm nhân viên chợ nhân tài do API sinh ra: ${profile.name}` }],
  };
}

export function sellOwnedEmployee(state: EmployeeSystemState, employeeId: EmployeeId, now = new Date()): EmployeeSystemResult {
  const next = cloneState(state);
  const employee = getEmployeeOrThrow(next, employeeId);

  if (!next.ownedEmployeeIds.includes(employeeId)) {
    throw new Error(`Employee is not owned: ${employeeId}`);
  }

  const listing: TalentMarketListing = {
    listingId: `player_${employeeId}_${now.getTime()}`,
    employeeId,
    price: Math.max(1, Math.floor(employee.profile.marketPrice * 0.65)),
    seller: 'player',
    createdAt: now.toISOString(),
    generatedByApi: false,
  };

  employee.active = false;
  employee.profile.ownership = 'market';
  next.ownedEmployeeIds = removeItem(next.ownedEmployeeIds, employeeId);
  next.activeEmployeeIds = removeItem(next.activeEmployeeIds, employeeId);
  next.marketListings.push(listing);

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Đã rao bán ${employee.profile.name} lên chợ nhân tài, giá ${listing.price}`,
      },
    ],
  };
}

export function buyMarketEmployee(state: EmployeeSystemState, listingId: string, now = new Date()): EmployeeSystemResult {
  const next = cloneState(state);
  const listing = next.marketListings.find(item => item.listingId === listingId);
  if (!listing) {
    throw new Error(`Unknown market listing: ${listingId}`);
  }
  if (next.money < listing.price) {
    throw new Error(`Not enough money for listing: ${listingId}`);
  }

  const employee = getAnyEmployeeOrThrow(next, listing.employeeId);
  next.money -= listing.price;
  employee.profile.ownership = 'owned';
  next.employees[listing.employeeId] = {
    ...createEmployeeRecord(employee.profile),
    hiredAt: now.toISOString(),
  };
  delete next.talentPool[listing.employeeId];
  next.ownedEmployeeIds = uniquePush(next.ownedEmployeeIds, listing.employeeId);
  next.marketListings = next.marketListings.filter(item => item.listingId !== listingId);

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Đã mua vào ${employee.profile.name} từ chợ nhân tài`,
      },
    ],
  };
}

export function refreshRecruitmentCandidate(
  state: EmployeeSystemState,
  options: {
    now?: Date;
    random?: RandomSource;
    refreshIntervalMs?: number;
  } = {},
): EmployeeSystemResult {
  const now = options.now ?? new Date();
  const random = options.random ?? Math.random;
  const refreshIntervalMs = options.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS;
  const next = cloneState(state);
  const effects: EmployeeSystemEffect[] = [];

  const nextRefreshTime = next.recruitment.nextRefreshAt ? Date.parse(next.recruitment.nextRefreshAt) : 0;
  if (nextRefreshTime > now.getTime() && next.recruitment.currentCandidateId) {
    return { state: next, effects };
  }

  const candidates = Object.values(next.talentPool).filter(employee => {
    return employee.profile.ownership === 'talent_pool' && !next.ownedEmployeeIds.includes(employee.profile.id);
  });
  const candidate = getRandomItem(candidates, random);

  if (!candidate) {
    next.recruitment = {
      refreshedAt: now.toISOString(),
      nextRefreshAt: new Date(now.getTime() + refreshIntervalMs).toISOString(),
    };
    effects.push({ type: 'note', message: 'Kho nhân tài hiện chưa có ứng viên để làm mới' });
    return { state: next, effects };
  }

  next.recruitment = {
    currentCandidateId: candidate.profile.id,
    refreshedAt: now.toISOString(),
    nextRefreshAt: new Date(now.getTime() + refreshIntervalMs).toISOString(),
  };
  candidate.lastIntroducedAt = now.toISOString();

  effects.push({
    type: 'request_employee_intro_generation',
    employeeId: candidate.profile.id,
    rejectionCount: candidate.rejectionCount,
    request: {
      employeeId: candidate.profile.id,
      rejectionCount: candidate.rejectionCount,
    },
    reason: 'Sau khi kho nhân tài làm mới ứng viên, logic cốt lõi chỉ cung cấp context cấu trúc hóa cần thiết cho lời tự giới thiệu',
  });

  return { state: next, effects };
}

export function acceptRecruitmentCandidate(state: EmployeeSystemState, now = new Date()): EmployeeSystemResult {
  const next = cloneState(state);
  const employeeId = next.recruitment.currentCandidateId;
  if (!employeeId) {
    throw new Error('No recruitment candidate to accept');
  }

  const employee = getTalentCandidateOrThrow(next, employeeId);
  if (next.money < employee.profile.marketPrice) {
    throw new Error(`Not enough money to hire: ${employeeId}`);
  }

  next.money -= employee.profile.marketPrice;
  employee.profile.ownership = 'owned';
  next.employees[employeeId] = {
    ...createEmployeeRecord(employee.profile),
    hiredAt: now.toISOString(),
  };
  delete next.talentPool[employeeId];
  next.ownedEmployeeIds = uniquePush(next.ownedEmployeeIds, employeeId);
  next.recruitment.currentCandidateId = undefined;

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Đã tuyển dụng ${employee.profile.name}`,
      },
    ],
  };
}

export function rejectRecruitmentCandidate(state: EmployeeSystemState): EmployeeSystemResult {
  const next = cloneState(state);
  const employeeId = next.recruitment.currentCandidateId;
  if (!employeeId) {
    throw new Error('No recruitment candidate to reject');
  }

  const employee = getTalentCandidateOrThrow(next, employeeId);
  employee.rejectionCount += 1;
  employee.profile.ownership = 'talent_pool';
  next.recruitment.currentCandidateId = undefined;

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `${employee.profile.name} đã quay lại kho nhân tài, số lần từ chối tuyển dụng +1`,
      },
    ],
  };
}

export function applyGeneratedIntroduction(
  state: EmployeeSystemState,
  employeeId: EmployeeId,
  introductionText: string,
): EmployeeSystemResult {
  const next = cloneState(state);
  const employee = getTalentCandidateOrThrow(next, employeeId);
  employee.introductionText = introductionText;

  return {
    state: next,
    effects: [
      {
        type: 'note',
        message: `Đã ghi lời tự giới thiệu tuyển dụng của ${employee.profile.name}`,
      },
    ],
  };
}
