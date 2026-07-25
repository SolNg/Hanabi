import {
  applyWaiterGrowthFromMvu,
  applyWaiterTimeText,
  cloneWaiterPageState,
  normalizeWaiterGrowthRecord,
  type WaiterPageState,
} from './waiterGame';
import { readTangquanCommonMvuUpdate } from './mvuCommon';

export type WaiterMvuBlockId = 'waiter.service' | 'waiter.growth';

export type WaiterMvuBlockContext = {
  assignmentId?: string;
};

export type WaiterMvuBlockStore = {
  activeBlockIds: WaiterMvuBlockId[];
  activeContext: WaiterMvuBlockContext;
  savedBlocks: Partial<Record<WaiterMvuBlockId, Record<string, unknown>>>;
  updatedAt: string;
};

const BLOCK_KEYS: Record<WaiterMvuBlockId, string[]> = {
  'waiter.service': ['当前接客'],
  'waiter.growth': ['成长记录'],
};

const ALL_BLOCK_KEYS = [...new Set(Object.values(BLOCK_KEYS).flat())];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stripWaiterBlocks(statData: Record<string, unknown>): Record<string, unknown> {
  const next = clone(statData);
  ALL_BLOCK_KEYS.forEach(key => delete next[key]);
  return next;
}

export function makeWaiterMvuBlockStore(): WaiterMvuBlockStore {
  return {
    activeBlockIds: [],
    activeContext: {},
    savedBlocks: {},
    updatedAt: new Date().toISOString(),
  };
}

export function cloneWaiterMvuBlockStore(store: WaiterMvuBlockStore): WaiterMvuBlockStore {
  return clone(store);
}

export function normalizeWaiterMvuBlockStore(value: unknown): WaiterMvuBlockStore {
  if (!isRecord(value)) {
    return makeWaiterMvuBlockStore();
  }
  const validIds: WaiterMvuBlockId[] = ['waiter.service', 'waiter.growth'];
  const activeBlockIds = Array.isArray(value.activeBlockIds)
    ? value.activeBlockIds.filter(
        (id): id is WaiterMvuBlockId => typeof id === 'string' && validIds.includes(id as WaiterMvuBlockId),
      )
    : [];
  const activeContext = isRecord(value.activeContext) ? (clone(value.activeContext) as WaiterMvuBlockContext) : {};
  const savedSource = isRecord(value.savedBlocks) ? value.savedBlocks : {};
  const savedBlocks: WaiterMvuBlockStore['savedBlocks'] = {};
  validIds.forEach(id => {
    if (isRecord(savedSource[id])) {
      savedBlocks[id] = clone(savedSource[id] as Record<string, unknown>);
    }
  });
  return {
    activeBlockIds: [...new Set(activeBlockIds)],
    activeContext,
    savedBlocks,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
  };
}

export function makeWaiterCommonStatData(state: WaiterPageState): Record<string, unknown> {
  return {
    当前时间: `${state.dateText} ${state.time}`,
    用户: {
      所在地: state.location,
      _资金: state.balance,
      _评级: state.grade,
      _日薪: state.dailySalary,
      _岗位: state.shift.area,
      _工作状态: state.workStatus,
      _体力: state.stamina,
    },
  };
}

function resolveAssignment(state: WaiterPageState, context: WaiterMvuBlockContext) {
  const assignmentId = context.assignmentId || state.currentService?.assignmentId;
  return assignmentId ? state.assignments.find(item => item.id === assignmentId) : undefined;
}

function makeServiceBlock(state: WaiterPageState, context: WaiterMvuBlockContext): Record<string, unknown> {
  const assignment = resolveAssignment(state, context);
  if (!assignment) {
    return {};
  }
  const guest = state.guests[assignment.guestId];
  return {
    当前接客: {
      _客人ID: assignment.guestId,
      _客人: assignment.guest,
      _性别: guest?.gender ?? '未说明',
      _种族: guest?.species ?? '人类',
      _来源地: guest?.origin ?? '本地',
      _预算: guest?.budget ?? 0,
      _客人来源: guest?.source ?? assignment.source,
      _项目偏好: guest?.projectPreferences ?? [assignment.project],
      _是否回头客: guest?.returning ?? false,
      _是否指名: guest?.nominated ?? assignment.source === '指名客',
      _指名剩余天数: guest?.nominationRemainingDays ?? assignment.nominationDays,
      _特殊说明: guest?.notes ?? '',
      _项目: assignment.project,
      _地点: assignment.area,
      _指名状态: assignment.source === '指名客' ? '已指名' : '未指名',
      _服务状态: assignment.status,
    },
  };
}

function makeGrowthBlock(state: WaiterPageState): Record<string, unknown> {
  return {
    成长记录: clone(state.growth),
  };
}

function makeBlockData(
  id: WaiterMvuBlockId,
  state: WaiterPageState,
  context: WaiterMvuBlockContext,
): Record<string, unknown> {
  if (id === 'waiter.service') {
    return makeServiceBlock(state, context);
  }
  return makeGrowthBlock(state);
}

export function saveActiveWaiterBlocksFromStatData(
  store: WaiterMvuBlockStore,
  statData: Record<string, unknown>,
): WaiterMvuBlockStore {
  const next = cloneWaiterMvuBlockStore(store);
  next.activeBlockIds.forEach(id => {
    const block: Record<string, unknown> = {};
    BLOCK_KEYS[id].forEach(key => {
      if (Object.prototype.hasOwnProperty.call(statData, key)) {
        block[key] = clone(statData[key]);
      }
    });
    if (Object.keys(block).length > 0) {
      next.savedBlocks[id] = block;
    }
  });
  next.updatedAt = new Date().toISOString();
  return next;
}

export function composeWaiterStatDataWithBlocks(
  currentStatData: Record<string, unknown>,
  state: WaiterPageState,
  store: WaiterMvuBlockStore,
  blockIds: WaiterMvuBlockId[],
  context: WaiterMvuBlockContext,
): { statData: Record<string, unknown>; store: WaiterMvuBlockStore } {
  const savedStore = saveActiveWaiterBlocksFromStatData(store, currentStatData);
  const clean = stripWaiterBlocks(currentStatData);
  const statData = _.merge({}, clean, makeWaiterCommonStatData(state));
  const uniqueIds = [...new Set(blockIds)];
  uniqueIds.forEach(id => _.merge(statData, makeBlockData(id, state, context)));
  return {
    statData,
    store: {
      ...savedStore,
      activeBlockIds: uniqueIds,
      activeContext: clone(context),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function deactivateWaiterStatDataBlocks(
  currentStatData: Record<string, unknown>,
  state: WaiterPageState,
  store: WaiterMvuBlockStore,
): { statData: Record<string, unknown>; store: WaiterMvuBlockStore } {
  const savedStore = saveActiveWaiterBlocksFromStatData(store, currentStatData);
  const clean = stripWaiterBlocks(currentStatData);
  return {
    statData: _.merge({}, clean, makeWaiterCommonStatData(state), { 互动现场: {} }),
    store: {
      ...savedStore,
      activeBlockIds: [],
      activeContext: {},
      updatedAt: new Date().toISOString(),
    },
  };
}

export function applyWaiterStatDataToState(
  state: WaiterPageState,
  store: WaiterMvuBlockStore,
  statData: Record<string, unknown>,
  allowRollback = false,
): { state: WaiterPageState; store: WaiterMvuBlockStore; statData: Record<string, unknown> } {
  let nextState = cloneWaiterPageState(state);
  if (isRecord(statData.成长记录)) {
    nextState = applyWaiterGrowthFromMvu(nextState, normalizeWaiterGrowthRecord(statData.成长记录), allowRollback);
  }
  const common = readTangquanCommonMvuUpdate(statData);
  if (common.dateText) nextState.dateText = common.dateText;
  if (common.time) nextState = applyWaiterTimeText(nextState, common.time);
  if (common.location) {
    nextState.location = common.location;
    const assignmentId = store.activeContext.assignmentId;
    const assignment = assignmentId ? nextState.assignments.find(item => item.id === assignmentId) : undefined;
    if (assignment && store.activeBlockIds.includes('waiter.service')) {
      assignment.area = common.location;
      const nominations = nextState.activeNominations.filter(item => item.guestId === assignment.guestId);
      nominations.forEach(item => {
        item.area = common.location;
      });
      if (nextState.activeNomination?.guestId === assignment.guestId) nextState.activeNomination.area = common.location;
    }
  }
  const normalizedStatData = _.merge({}, clone(statData), makeWaiterCommonStatData(nextState));
  if (store.activeBlockIds.length > 0) {
    const scene = isRecord(normalizedStatData.互动现场) ? clone(normalizedStatData.互动现场) : {};
    scene.地点 = nextState.location;
    normalizedStatData.互动现场 = scene;
  }
  const composed = composeWaiterStatDataWithBlocks(
    normalizedStatData,
    nextState,
    store,
    store.activeBlockIds,
    store.activeContext,
  );
  return { state: nextState, store: composed.store, statData: composed.statData };
}
