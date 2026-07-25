import {
  BOSS_CURRENT_SHIFT_INDEX,
  cloneBossPageState,
  normalizeBossPageState,
  type BossArea,
  type BossEmployee,
  type BossMarketCandidate,
  type BossNomination,
  type BossPageState,
  type BossProject,
  type BossRecruitCandidate,
  type BossSettlement,
} from './bossEconomy';
import { readTangquanCommonMvuUpdate } from './mvuCommon';

export type TangquanMvuBlockId =
  | 'boss.overview'
  | 'boss.area'
  | 'boss.employee'
  | 'boss.guest'
  | 'boss.service'
  | 'boss.candidate'
  | 'boss.settlement';

export type TangquanMvuBlockStore = {
  activeBlockIds: TangquanMvuBlockId[];
  activeContext: BossMvuBlockContext;
  savedBlocks: Partial<Record<TangquanMvuBlockId, Record<string, unknown>>>;
  updatedAt: string;
};

export type BossMvuBlockContext = {
  areaName?: string;
  employeeName?: string;
  candidateName?: string;
  recruitCandidateName?: string;
  settlement?: boolean;
};

const BLOCK_KEYS: Record<TangquanMvuBlockId, string[]> = {
  'boss.overview': ['店铺概况'],
  'boss.area': ['当前区域'],
  'boss.employee': ['当前员工'],
  'boss.guest': ['当前客人'],
  'boss.service': ['当前服务'],
  'boss.candidate': ['当前候选人'],
  'boss.settlement': ['今日结算'],
};

const ALL_BLOCK_KEYS = _.uniq(Object.values(BLOCK_KEYS).flat());

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function appendBossReminder(state: BossPageState, note: string) {
  const clean = note.trim();
  const reminder = clean.startsWith('Hiện trường: ') ? clean : `Hiện trường: ${clean}`;
  if (!clean || state.经营提醒.includes(reminder)) return;
  state.经营提醒 = [reminder, ...state.经营提醒].slice(0, 16);
}

function restoreBossSnapshotBlocks(state: BossPageState, statData: Record<string, unknown>) {
  const currentEmployee = isRecord(statData.当前员工) ? statData.当前员工 : null;
  const employeeName = typeof currentEmployee?.姓名 === 'string' ? currentEmployee.姓名 : '';
  const employee = employeeName ? state.员工.find(item => item.姓名 === employeeName) : undefined;
  if (employee && currentEmployee) {
    const assignment = typeof currentEmployee.所在地 === 'string' ? currentEmployee.所在地.trim() : '';
    if (assignment && (state.区域.some(area => area.名称 === assignment) || ['休息', '清洁', '待命'].includes(assignment))) {
      employee.排班[BOSS_CURRENT_SHIFT_INDEX] = assignment;
    }
    if (typeof currentEmployee.评级 === 'string' && currentEmployee.评级.trim()) employee.评级 = currentEmployee.评级.trim();
    if (typeof currentEmployee.当前状态 === 'string' && currentEmployee.当前状态.trim()) {
      employee.状态 = currentEmployee.当前状态.trim().slice(0, 80);
    }
    const numberFields = [
      ['日薪', '日薪', 100_000],
      ['期望日薪', '期望日薪', 100_000],
      ['评分', '评分', 100],
      ['满意度', '满意度', 100],
      ['疲劳', '疲劳', 100],
      ['服务次数', '服务次数', 1_000_000],
      ['指名次数', '指名次数', 1_000_000],
      ['额外结果次数', '额外结果次数', 1_000_000],
    ] as const;
    numberFields.forEach(([sourceKey, targetKey, max]) => {
      const value = Number(currentEmployee[sourceKey]);
      if (Number.isFinite(value)) employee[targetKey] = _.clamp(Math.round(value), 0, max);
    });
  }

  const currentGuest = isRecord(statData.当前客人) ? statData.当前客人 : null;
  const nominationEmployee = typeof currentGuest?.指名员工 === 'string' ? currentGuest.指名员工 : '';
  const nomination = nominationEmployee ? state.指名.find(item => item.员工 === nominationEmployee) : undefined;
  if (nomination && currentGuest) {
    if (typeof currentGuest.称呼 === 'string' && currentGuest.称呼.trim()) nomination.客人 = currentGuest.称呼.trim().slice(0, 80);
    const remainingDays = Number(currentGuest.指名剩余天数);
    if (Number.isFinite(remainingDays)) nomination.剩余天数 = _.clamp(Math.round(remainingDays), 0, 365);
  }

  const currentService = isRecord(statData.当前服务) ? statData.当前服务 : null;
  const serviceEmployee = typeof currentService?.员工 === 'string' ? currentService.员工 : '';
  const serviceNomination = serviceEmployee ? state.指名.find(item => item.员工 === serviceEmployee) : undefined;
  if (serviceNomination && currentService) {
    const remainingDays = Number(currentService.指名剩余天数);
    if (Number.isFinite(remainingDays)) serviceNomination.剩余天数 = _.clamp(Math.round(remainingDays), 0, 365);
    if (typeof currentService.地点 === 'string' && currentService.地点.trim()) {
      serviceNomination.区域 = currentService.地点.trim().slice(0, 80);
    }
  }

  const currentCandidate = isRecord(statData.当前候选人) ? statData.当前候选人 : null;
  const candidateName = typeof currentCandidate?.姓名 === 'string' ? currentCandidate.姓名 : '';
  const market = candidateName ? state.人才市场.find(item => item.姓名 === candidateName) : undefined;
  const recruit = candidateName ? state.招聘.候选.find(item => item.姓名 === candidateName) : undefined;
  if ((market || recruit) && currentCandidate) {
    const salary = Number(currentCandidate.期望日薪);
    if (Number.isFinite(salary)) {
      const cleanSalary = _.clamp(Math.round(salary), 0, 100_000);
      if (market) market.期望日薪 = cleanSalary;
      if (recruit) recruit.期望日薪 = cleanSalary;
    }
    if (typeof currentCandidate.简介 === 'string') {
      const note = currentCandidate.简介.trim().slice(0, 500);
      if (market) market.说明 = note;
      if (recruit) recruit.说明 = note;
    }
  }
}

export function makeAreaEntryContent(area: BossArea): string {
  return `<当前区域>
名称: ${area.名称}
客人数: ${area.客人}
在岗员工: ${area.员工.join(', ')}
说明: ${area.说明}
</当前区域>`;
}

export function makeProjectEntryContent(project: BossProject): string {
  return `<当前项目>
名称: ${project.名称}
价格: ${project.基础价格}
评分: ${project.评分}
推荐值: ${project.推荐值}
热度: ${project.热度}
今日订单: ${project.今日订单}
</当前项目>`;
}

export function makeEmployeeEntryContent(employee: BossEmployee): string {
  return `<当前员工>
姓名: ${employee.姓名}
评级: ${employee.评级}
所在地: ${employee.区域}
当前状态: ${employee.状态}
日薪: ${employee.日薪}
期望日薪: ${employee.期望日薪}
评分: ${employee.评分}
满意度: ${employee.满意度}
疲劳: ${employee.疲劳}
服务次数: ${employee.服务次数}
指名次数: ${employee.指名次数}
额外结果次数: ${employee.额外结果次数}
</当前员工>`;
}

export function makeGuestEntryContent(nomination: BossNomination): string {
  return `<当前客人>
称呼: ${nomination.客人}
指名员工: ${nomination.员工}
指名剩余天数: ${nomination.剩余天数}
</当前客人>`;
}

export function makeCandidateEntryContent(
  candidate: BossMarketCandidate | BossRecruitCandidate,
  source: '人才市场' | '招聘',
): string {
  if (source === '人才市场') {
    const marketCandidate = candidate as BossMarketCandidate;
    return `<当前候选人>
姓名: ${marketCandidate.姓名}
来源: 人才市场
评级: ${marketCandidate.评级}
期望日薪: ${marketCandidate.期望日薪}
简介: ${marketCandidate.说明}
</当前候选人>`;
  }
  return `<当前候选人>
姓名: ${candidate.姓名}
来源: 招聘
期望日薪: ${candidate.期望日薪}
简介: ${candidate.说明}
</当前候选人>`;
}

export function makeMvuBlockStore(): TangquanMvuBlockStore {
  return {
    activeBlockIds: [],
    activeContext: {},
    savedBlocks: {},
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeMvuBlockStore(value: unknown): TangquanMvuBlockStore {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return makeMvuBlockStore();
  }
  const source = value as Partial<TangquanMvuBlockStore>;
  return {
    activeBlockIds: Array.isArray(source.activeBlockIds)
      ? source.activeBlockIds.filter((id): id is TangquanMvuBlockId => isMvuBlockId(id))
      : [],
    activeContext: normalizeBlockContext(source.activeContext),
    savedBlocks: normalizeSavedBlocks(source.savedBlocks),
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : new Date().toISOString(),
  };
}

export function cloneMvuBlockStore(store: TangquanMvuBlockStore): TangquanMvuBlockStore {
  return _.cloneDeep(store);
}

export function saveActiveBlocksFromStatData(
  store: TangquanMvuBlockStore,
  statData: Record<string, unknown>,
): TangquanMvuBlockStore {
  const next = cloneMvuBlockStore(store);
  for (const blockId of next.activeBlockIds) {
    const block = pickBlock(statData, blockId);
    if (Object.keys(block).length > 0) {
      next.savedBlocks[blockId] = block;
    }
  }
  next.updatedAt = new Date().toISOString();
  return next;
}

export function stripMvuBlocks(statData: Record<string, unknown>): Record<string, unknown> {
  const next = _.cloneDeep(statData);
  for (const key of ALL_BLOCK_KEYS) {
    _.unset(next, key);
  }
  return next;
}

export function makeBossCommonStatData(state: BossPageState): Record<string, unknown> {
  return {
    当前时间: `${state.日期} ${state.时间}`,
    用户: {
      所在地: state.地点,
    },
    未开之花汤泉: {
      _资金: state.资金,
      _店铺评分: state.店铺评分,
      _好评率: state.好评率,
      看板娘: state.看板娘.已选择
        ? { ID: state.看板娘.角色ID, 姓名: state.看板娘.姓名 }
        : { ID: '', 姓名: '待选择' },
    },
  };
}

export function buildBossMvuBlocks(
  state: BossPageState,
  blockIds: TangquanMvuBlockId[],
  context: BossMvuBlockContext = {},
): Partial<Record<TangquanMvuBlockId, Record<string, unknown>>> {
  const result: Partial<Record<TangquanMvuBlockId, Record<string, unknown>>> = {};
  const area = findArea(state, context.areaName ?? state.地点);
  const employee = context.employeeName ? findEmployee(state, context.employeeName) : undefined;
  const nomination = employee ? findNomination(state, employee.姓名) : undefined;
  const currentProject = nomination ? findProject(state, nomination.区域) : undefined;
  const candidate = context.candidateName ? findMarketCandidate(state, context.candidateName) : undefined;
  const recruit = context.recruitCandidateName
    ? state.招聘.候选.find(candidate => candidate.姓名 === context.recruitCandidateName)
    : undefined;

  for (const blockId of blockIds) {
    if (blockId === 'boss.overview') {
      result[blockId] = makeOverviewBlock(state);
    } else if (blockId === 'boss.area') {
      result[blockId] = makeAreaBlock(area);
    } else if (blockId === 'boss.employee') {
      result[blockId] = makeEmployeeBlock(employee);
    } else if (blockId === 'boss.guest') {
      result[blockId] = makeGuestBlock(nomination);
    } else if (blockId === 'boss.service') {
      result[blockId] = makeServiceBlock(nomination, employee, currentProject);
    } else if (blockId === 'boss.candidate') {
      result[blockId] = makeCandidateBlock(candidate, recruit);
    } else if (blockId === 'boss.settlement') {
      result[blockId] = makeSettlementBlock(state.结算);
    }
  }

  return result;
}

export function composeStatDataWithBlocks(
  currentStatData: Record<string, unknown>,
  state: BossPageState,
  store: TangquanMvuBlockStore,
  blockIds: TangquanMvuBlockId[],
  context: BossMvuBlockContext = {},
): { statData: Record<string, unknown>; store: TangquanMvuBlockStore } {
  const savedStore = saveActiveBlocksFromStatData(store, currentStatData);
  const cleaned = stripMvuBlocks(currentStatData);
  const generatedBlocks = buildBossMvuBlocks(state, blockIds, context);
  const nextStatData = _.merge({}, cleaned, makeBossCommonStatData(state));
  const canReuseSavedBlocks = isSameBlockContext(savedStore.activeContext, context);

  for (const blockId of blockIds) {
    const savedBlock = canReuseSavedBlocks ? (savedStore.savedBlocks[blockId] ?? {}) : {};
    const generatedBlock = generatedBlocks[blockId] ?? {};
    _.merge(nextStatData, savedBlock, generatedBlock);
  }

  return {
    statData: nextStatData,
    store: {
      ...savedStore,
      activeBlockIds: _.uniq(blockIds),
      activeContext: { ...context },
      updatedAt: new Date().toISOString(),
    },
  };
}

export function deactivateStatDataBlocks(
  currentStatData: Record<string, unknown>,
  state: BossPageState,
  store: TangquanMvuBlockStore,
): { statData: Record<string, unknown>; store: TangquanMvuBlockStore } {
  const savedStore = saveActiveBlocksFromStatData(store, currentStatData);
  const statData = _.merge({}, stripMvuBlocks(currentStatData), makeBossCommonStatData(state));
  statData.互动现场 = {};
  return {
    statData,
    store: {
      ...savedStore,
      activeBlockIds: [],
      activeContext: {},
      updatedAt: new Date().toISOString(),
    },
  };
}

export function applyBossStatDataToState(
  state: BossPageState,
  store: TangquanMvuBlockStore,
  statData: Record<string, unknown>,
  allowRollback = false,
): { state: BossPageState; store: TangquanMvuBlockStore; statData: Record<string, unknown> } {
  const next = cloneBossPageState(state);
  if (allowRollback) {
    next.经营提醒 = next.经营提醒.filter(item => !item.startsWith('现场：'));
    restoreBossSnapshotBlocks(next, statData);
  }
  const common = readTangquanCommonMvuUpdate(statData);
  if (common.dateText) next.日期 = common.dateText;
  if (common.time) next.时间 = common.time;
  if (common.location) next.地点 = common.location;

  const scene = isRecord(statData.互动现场) ? statData.互动现场 : {};
  const cleanScene: Record<string, unknown> = {};
  if (typeof scene.地点 === 'string' && scene.地点.trim()) {
    cleanScene.地点 = scene.地点.trim().slice(0, 80);
    next.地点 = cleanScene.地点 as string;
  }

  const employeeScene = isRecord(scene.员工) ? scene.员工 : {};
  const cleanEmployees: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(employeeScene)) {
    if (!isRecord(value)) continue;
    const employee = next.员工.find(item => item.姓名 === name);
    if (!employee) continue;
    const clean: Record<string, unknown> = {};
    if (typeof value.状态 === 'string' && value.状态.trim()) {
      employee.状态 = value.状态.trim().slice(0, 80);
      clean.状态 = employee.状态;
    }
    if (typeof value.当前状态 === 'string' && value.当前状态.trim()) {
      employee.状态 = value.当前状态.trim().slice(0, 80);
      clean.当前状态 = employee.状态;
    }
    if (typeof value.当前安排 === 'string' && value.当前安排.trim()) {
      const arrangement = value.当前安排.trim().slice(0, 80);
      clean.当前安排 = arrangement;
      const validAssignment =
        next.区域.some(area => area.名称 === arrangement) || ['休息', '清洁', '待命'].includes(arrangement);
      if (validAssignment) {
        employee.排班[BOSS_CURRENT_SHIFT_INDEX] = arrangement;
      }
    }
    if (Number.isFinite(Number(value.日薪))) {
      employee.日薪 = _.clamp(Math.round(Number(value.日薪)), 0, 100_000);
      clean.日薪 = employee.日薪;
    }
    if (typeof value.备注 === 'string' && value.备注.trim()) {
      const note = value.备注.trim().slice(0, 240);
      clean.备注 = note;
      appendBossReminder(next, `${name}: ${note}`);
    }
    cleanEmployees[name] = clean;
  }
  if (Object.keys(cleanEmployees).length > 0) cleanScene.员工 = cleanEmployees;

  const nominationScene = isRecord(scene.指名关系) ? scene.指名关系 : {};
  const cleanNominations: Record<string, unknown> = {};
  for (const [employeeName, value] of Object.entries(nominationScene)) {
    if (!isRecord(value)) continue;
    const nomination = next.指名.find(item => item.员工 === employeeName);
    const employee = next.员工.find(item => item.姓名 === employeeName);
    if (!nomination && !employee) continue;
    const clean: Record<string, unknown> = {};
    if (nomination && Number.isFinite(Number(value.指名剩余天数))) {
      nomination.剩余天数 = _.clamp(Math.round(Number(value.指名剩余天数)), 0, 365);
      clean.指名剩余天数 = nomination.剩余天数;
    }
    if (nomination && typeof value.客人 === 'string' && value.客人.trim()) {
      nomination.客人 = value.客人.trim().slice(0, 80);
      clean.客人 = nomination.客人;
    }
    if (nomination && typeof value.当前项目 === 'string' && value.当前项目.trim()) {
      const project = value.当前项目.trim().slice(0, 80);
      clean.当前项目 = project;
      const matchedProject = next.项目.find(item => item.名称 === project);
      const matchedArea = next.区域.find(item => item.名称 === project);
      if (matchedProject) nomination.区域 = matchedProject.设施需求;
      else if (matchedArea) nomination.区域 = matchedArea.名称;
    }
    if (typeof value.指名状态 === 'string' && value.指名状态.trim()) {
      const status = value.指名状态.trim().slice(0, 40);
      clean.指名状态 = status;
      if (nomination && /结束|取消|终止|kết thúc|hủy bỏ|chấm dứt/.test(status)) nomination.剩余天数 = 0;
    }
    if (employee && typeof value.员工状态 === 'string' && value.员工状态.trim()) {
      employee.状态 = value.员工状态.trim().slice(0, 80);
      clean.员工状态 = employee.状态;
    }
    if (employee && typeof value.服务状态 === 'string' && value.服务状态.trim()) {
      employee.状态 = value.服务状态.trim().slice(0, 80);
      clean.服务状态 = employee.状态;
    }
    if (typeof value.备注 === 'string' && value.备注.trim()) {
      const note = value.备注.trim().slice(0, 240);
      clean.备注 = note;
      appendBossReminder(next, `Chỉ định của ${employeeName}: ${note}`);
    }
    cleanNominations[employeeName] = clean;
  }
  if (Object.keys(cleanNominations).length > 0) cleanScene.指名关系 = cleanNominations;

  const candidateScene = isRecord(scene.候选人) ? scene.候选人 : {};
  const cleanCandidates: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(candidateScene)) {
    if (!isRecord(value)) continue;
    const market = next.人才市场.find(item => item.姓名 === name);
    const recruit = next.招聘.候选.find(candidate => candidate.姓名 === name) ?? null;
    if (!market && !recruit) continue;
    const clean: Record<string, unknown> = {};
    if (Number.isFinite(Number(value.期望日薪))) {
      const salary = _.clamp(Math.round(Number(value.期望日薪)), 0, 100_000);
      if (market) market.期望日薪 = salary;
      if (recruit) recruit.期望日薪 = salary;
      clean.期望日薪 = salary;
    }
    if (typeof value.状态 === 'string' && value.状态.trim()) {
      const status = value.状态.trim().slice(0, 80);
      clean.状态 = status;
      appendBossReminder(next, `${name}: ${status}`);
    }
    if (typeof value.备注 === 'string' && value.备注.trim()) {
      const note = value.备注.trim().slice(0, 240);
      clean.备注 = note;
      if (market && !market.说明.includes(note)) market.说明 = `${market.说明}；${note}`.slice(0, 500);
      if (recruit && !recruit.说明.includes(note)) recruit.说明 = `${recruit.说明}；${note}`.slice(0, 500);
    }
    cleanCandidates[name] = clean;
  }
  if (Object.keys(cleanCandidates).length > 0) cleanScene.候选人 = cleanCandidates;

  if (typeof scene.现场结果 === 'string' && scene.现场结果.trim()) {
    cleanScene.现场结果 = scene.现场结果.trim().slice(0, 300);
    appendBossReminder(next, cleanScene.现场结果 as string);
  } else if (isRecord(scene.现场结果)) {
    cleanScene.现场结果 = _.cloneDeep(scene.现场结果);
  }

  const normalizedState = normalizeBossPageState(next) ?? next;
  if (store.activeBlockIds.length > 0 || Object.keys(cleanScene).length > 0) {
    cleanScene.地点 = normalizedState.地点;
  }
  const normalizedStatData = _.cloneDeep(statData);
  normalizedStatData.互动现场 = cleanScene;
  const nextContext = {
    ...store.activeContext,
    ...(store.activeBlockIds.includes('boss.area') ? { areaName: normalizedState.地点 } : {}),
  };
  const composed = composeStatDataWithBlocks(
    normalizedStatData,
    normalizedState,
    store,
    store.activeBlockIds,
    nextContext,
  );
  composed.statData.互动现场 = cleanScene;
  return { state: normalizedState, store: composed.store, statData: composed.statData };
}

function normalizeBlockContext(value: unknown): BossMvuBlockContext {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const source = value as BossMvuBlockContext;
  return {
    areaName: typeof source.areaName === 'string' ? source.areaName : undefined,
    employeeName: typeof source.employeeName === 'string' ? source.employeeName : undefined,
    candidateName: typeof source.candidateName === 'string' ? source.candidateName : undefined,
    recruitCandidateName: typeof source.recruitCandidateName === 'string' ? source.recruitCandidateName : undefined,
    settlement: source.settlement === true,
  };
}

function isSameBlockContext(left: BossMvuBlockContext, right: BossMvuBlockContext): boolean {
  return (
    left.areaName === right.areaName &&
    left.employeeName === right.employeeName &&
    left.candidateName === right.candidateName &&
    left.recruitCandidateName === right.recruitCandidateName &&
    left.settlement === right.settlement
  );
}

function normalizeSavedBlocks(value: unknown): TangquanMvuBlockStore['savedBlocks'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const result: TangquanMvuBlockStore['savedBlocks'] = {};
  for (const [key, block] of Object.entries(value)) {
    if (isMvuBlockId(key) && block && typeof block === 'object' && !Array.isArray(block)) {
      result[key] = _.cloneDeep(block as Record<string, unknown>);
    }
  }
  return result;
}

function isMvuBlockId(value: unknown): value is TangquanMvuBlockId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BLOCK_KEYS, value);
}

function pickBlock(statData: Record<string, unknown>, blockId: TangquanMvuBlockId): Record<string, unknown> {
  const block: Record<string, unknown> = {};
  for (const key of BLOCK_KEYS[blockId]) {
    if (_.has(statData, key)) {
      _.set(block, key, _.cloneDeep(_.get(statData, key)));
    }
  }
  return block;
}

function makeOverviewBlock(state: BossPageState): Record<string, unknown> {
  const hotProject = [...state.项目].sort((a, b) => b.推荐值 - a.推荐值)[0];
  return {
    店铺概况: {
      营业状态: state.营业状态,
      店铺评分: state.店铺评分,
      好评率: state.好评率,
      今日客流: state.客流,
      热门项目: hotProject
        ? {
            名称: hotProject.名称,
            评分: hotProject.评分,
            推荐值: hotProject.推荐值,
          }
        : {},
      员工满意均值: average(state.员工.map(employee => employee.满意度), 70),
      维护度: state.基建.维护度,
    },
  };
}

function makeAreaBlock(area?: BossArea): Record<string, unknown> {
  if (!area) {
    return {};
  }
  return {
    当前区域: {
      名称: area.名称,
      客人数: area.客人,
      在岗员工: area.员工,
      说明: area.说明,
    },
  };
}

function makeEmployeeBlock(employee?: BossEmployee): Record<string, unknown> {
  if (!employee) {
    return {};
  }
  return {
    当前员工: {
      姓名: employee.姓名,
      评级: employee.评级,
      所在地: employee.区域,
      当前状态: employee.状态,
      日薪: employee.日薪,
      期望日薪: employee.期望日薪,
      评分: employee.评分,
      满意度: employee.满意度,
      疲劳: employee.疲劳,
      服务次数: employee.服务次数,
      指名次数: employee.指名次数,
      额外结果次数: employee.额外结果次数,
    },
  };
}

function makeGuestBlock(nomination?: BossNomination): Record<string, unknown> {
  if (!nomination) {
    return {};
  }
  return {
    当前客人: {
      称呼: nomination.客人,
      指名员工: nomination.员工,
      指名剩余天数: nomination.剩余天数,
    },
  };
}

function makeServiceBlock(
  nomination?: BossNomination,
  employee?: BossEmployee,
  project?: BossProject,
): Record<string, unknown> {
  if (!nomination && !employee) {
    return {};
  }
  return {
    当前服务: {
      地点: nomination?.区域 ?? employee?.区域,
      员工: employee?.姓名 ?? nomination?.员工,
      客人: nomination?.客人,
      项目: project?.名称 ?? nomination?.区域,
      项目评分: project?.评分,
      项目推荐值: project?.推荐值,
      指名剩余天数: nomination?.剩余天数,
      员工个人收入预估: nomination?.预计收入,
    },
  };
}

function makeCandidateBlock(
  candidate?: BossMarketCandidate,
  recruit?: BossRecruitCandidate,
): Record<string, unknown> {
  if (candidate) {
    return {
      当前候选人: {
        姓名: candidate.姓名,
        来源: '人才市场',
        类型: candidate.类型,
        评级: candidate.评级,
        市场价格: candidate.市场价格,
        期望日薪: candidate.期望日薪,
        简介: candidate.说明,
      },
    };
  }
  if (recruit) {
    return {
      当前候选人: {
        姓名: recruit.姓名,
        来源: '招聘',
        期望日薪: recruit.期望日薪,
        拒绝记录: recruit.拒绝记录,
        简介: recruit.说明,
      },
    };
  }
  return {};
}

function makeSettlementBlock(settlement: BossSettlement): Record<string, unknown> {
  return {
    今日结算: {
      营业日: settlement.营业日,
      状态: settlement.状态,
      收入: settlement.收入,
      支出: settlement.支出,
      毛利: settlement.毛利,
      员工收入合计: settlement.员工收入合计,
      明日预测: settlement.明日预测,
      经营纪要: settlement.经营纪要
        ? {
            来源: settlement.经营纪要.来源,
            标题: settlement.经营纪要.标题,
            客人概况: settlement.经营纪要.客人概况,
            收入说明: settlement.经营纪要.收入说明,
            评价说明: settlement.经营纪要.评价说明,
            收束: settlement.经营纪要.收束,
          }
        : null,
    },
  };
}

function findArea(state: BossPageState, areaName?: string): BossArea | undefined {
  return state.区域.find(area => area.名称 === areaName);
}

function findEmployee(state: BossPageState, employeeName: string): BossEmployee | undefined {
  return state.员工.find(employee => employee.姓名 === employeeName);
}

function findNomination(state: BossPageState, employeeName: string): BossNomination | undefined {
  return state.指名.find(item => item.员工 === employeeName && item.剩余天数 > 0);
}

function findProject(state: BossPageState, name: string): BossProject | undefined {
  return state.项目.find(project => project.名称 === name || project.设施需求 === name);
}

function findMarketCandidate(state: BossPageState, candidateName: string): BossMarketCandidate | undefined {
  return state.人才市场.find(candidate => candidate.姓名 === candidateName);
}

function average(values: number[], fallback: number): number {
  if (values.length === 0) {
    return fallback;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
