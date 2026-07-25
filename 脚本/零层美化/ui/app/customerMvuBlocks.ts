import {
  applyCustomerRelationshipUpdate,
  cloneCustomerPageState,
  getCustomerRelationshipStage,
  normalizeCustomerPageState,
  type CustomerEmployee,
  type CustomerPageState,
  type CustomerProject,
} from './customerGame';
import { readTangquanCommonMvuUpdate } from './mvuCommon';

export type CustomerMvuBlockId =
  | 'customer.employee'
  | 'customer.relationship'
  | 'customer.project'
  | 'customer.service'
  | 'customer.contact';

export type CustomerMvuBlockContext = {
  employeeName?: string;
  employeeNames?: string[];
  projectName?: string;
  contactName?: string;
};

export type CustomerMvuBlockStore = {
  activeBlockIds: CustomerMvuBlockId[];
  activeContext: CustomerMvuBlockContext;
  savedBlocks: Partial<Record<CustomerMvuBlockId, Record<string, unknown>>>;
  updatedAt: string;
};

const BLOCK_KEYS: Record<CustomerMvuBlockId, string[]> = {
  'customer.employee': ['当前员工', '相关员工'],
  'customer.relationship': ['当前关系', '相关关系'],
  'customer.project': ['当前项目'],
  'customer.service': ['当前服务'],
  'customer.contact': ['线上交流'],
};

const ALL_BLOCK_KEYS = [...new Set(Object.values(BLOCK_KEYS).flat())];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return _.cloneDeep(value);
}

function stripCustomerBlocks(statData: Record<string, unknown>): Record<string, unknown> {
  const next = clone(statData);
  ALL_BLOCK_KEYS.forEach(key => {
    delete next[key];
  });
  return next;
}

export function makeCustomerMvuBlockStore(): CustomerMvuBlockStore {
  return {
    activeBlockIds: [],
    activeContext: {},
    savedBlocks: {},
    updatedAt: new Date().toISOString(),
  };
}

export function cloneCustomerMvuBlockStore(store: CustomerMvuBlockStore): CustomerMvuBlockStore {
  return clone(store);
}

export function normalizeCustomerMvuBlockStore(value: unknown): CustomerMvuBlockStore {
  if (!isRecord(value)) {
    return makeCustomerMvuBlockStore();
  }
  const validIds: CustomerMvuBlockId[] = ['customer.employee', 'customer.relationship', 'customer.project', 'customer.service', 'customer.contact'];
  const activeBlockIds = Array.isArray(value.activeBlockIds)
    ? value.activeBlockIds.filter((id): id is CustomerMvuBlockId => typeof id === 'string' && validIds.includes(id as CustomerMvuBlockId))
    : [];
  const activeContext = isRecord(value.activeContext) ? clone(value.activeContext) as CustomerMvuBlockContext : {};
  activeContext.employeeNames = Array.isArray(activeContext.employeeNames)
    ? activeContext.employeeNames.filter((name): name is string => typeof name === 'string')
    : undefined;
  const savedSource = isRecord(value.savedBlocks) ? value.savedBlocks : {};
  const savedBlocks: CustomerMvuBlockStore['savedBlocks'] = {};
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

export function makeCustomerCommonStatData(state: CustomerPageState): Record<string, unknown> {
  return {
    当前时间: `${state.日期} ${state.时间}`,
    用户: {
      所在地: state.地点,
      _资金: state.资金,
      _当前指名服务员: state.指名.map(nomination => nomination.员工).join('、'),
      _当前指名状态: state.指名.length ? `指名中（${state.指名.length}人）` : '未指名',
    },
  };
}

function resolveEmployee(state: CustomerPageState, context: CustomerMvuBlockContext): CustomerEmployee | undefined {
  const name = context.employeeName || context.contactName || state.当前服务?.员工 || state.当前指名?.员工;
  return name ? state.员工[name] : undefined;
}

function resolveEmployees(state: CustomerPageState, context: CustomerMvuBlockContext): CustomerEmployee[] {
  const names = [...(context.employeeNames ?? []), context.employeeName ?? '', context.contactName ?? ''].filter(Boolean);
  const employees = [...new Set(names)].map(name => state.员工[name]).filter(Boolean);
  const primary = resolveEmployee(state, context);
  if (primary && !employees.some(employee => employee.姓名 === primary.姓名)) employees.unshift(primary);
  return employees;
}

function resolveProject(state: CustomerPageState, context: CustomerMvuBlockContext): CustomerProject | undefined {
  const name = context.projectName || state.当前服务?.项目;
  return name ? state.项目[name] : undefined;
}

function makeEmployeeBlock(employee?: CustomerEmployee, employees: CustomerEmployee[] = []): Record<string, unknown> {
  if (!employee) return {};
  const related = Object.fromEntries(
    employees
      .filter(item => item.姓名 !== employee.姓名)
      .map(item => [item.姓名, { _评级: item.评级, _所在地: item.区域, _当前状态: item.状态, _标签: item.标签 }]),
  );
  return {
    当前员工: {
      _姓名: employee.姓名,
      _评级: employee.评级,
      _所在地: employee.区域,
      _当前状态: employee.状态,
      _标签: employee.标签,
    },
    ...(Object.keys(related).length ? { 相关员工: related } : {}),
  };
}

function makeRelationshipBlock(employee?: CustomerEmployee, employees: CustomerEmployee[] = []): Record<string, unknown> {
  if (!employee) return {};
  const related = Object.fromEntries(
    employees
      .filter(item => item.姓名 !== employee.姓名)
      .map(item => [item.姓名, {
        好感度: item.好感度,
        信任度: item.信任度,
        联系状态: item.联系状态,
        互动次数: item.互动次数,
        服务次数: item.服务次数,
        额外服务次数: item.额外服务次数,
        私下邀约次数: item.私下邀约次数,
        最近互动: item.最近互动,
      }]),
  );
  return {
    当前关系: {
      _员工: employee.姓名,
      好感度: employee.好感度,
      信任度: employee.信任度,
      联系状态: employee.联系状态,
      互动次数: employee.互动次数,
      服务次数: employee.服务次数,
      额外服务次数: employee.额外服务次数,
      私下邀约次数: employee.私下邀约次数,
      最近互动: employee.最近互动,
    },
    ...(Object.keys(related).length ? { 相关关系: related } : {}),
  };
}

function makeProjectBlock(project?: CustomerProject): Record<string, unknown> {
  if (!project) return {};
  return {
    当前项目: {
      _名称: project.名称,
      _价格: project.价格,
      _时长分钟: project.时长分钟,
      _地点: project.区域,
      _说明: project.说明,
    },
  };
}

function makeServiceBlock(state: CustomerPageState): Record<string, unknown> {
  const service = state.当前服务;
  if (!service) return {};
  return {
    当前服务: {
      _项目: service.项目,
      _员工: service.员工,
      _地点: service.区域,
      _价格: service.价格,
      _时长分钟: service.时长分钟,
      _当前状态: service.状态,
      _开始时间: service.开始时间,
    },
  };
}

function makeContactBlock(state: CustomerPageState, employee?: CustomerEmployee): Record<string, unknown> {
  if (!employee) return {};
  const conversation = state.联系人[employee.姓名];
  const messages = conversation?.消息.slice(-8).map(message => `${message.发送者}: ${message.内容}`) ?? [];
  return {
    线上交流: {
      _员工: employee.姓名,
      _在线状态: employee.在线状态,
      _关系阶段: getCustomerRelationshipStage(employee),
      _最近消息: messages,
    },
  };
}

function makeBlockData(
  id: CustomerMvuBlockId,
  state: CustomerPageState,
  context: CustomerMvuBlockContext,
): Record<string, unknown> {
  const employee = resolveEmployee(state, context);
  const employees = resolveEmployees(state, context);
  if (id === 'customer.employee') return makeEmployeeBlock(employee, employees);
  if (id === 'customer.relationship') return makeRelationshipBlock(employee, employees);
  if (id === 'customer.project') return makeProjectBlock(resolveProject(state, context));
  if (id === 'customer.service') return makeServiceBlock(state);
  return makeContactBlock(state, employee);
}

export function saveActiveCustomerBlocksFromStatData(
  store: CustomerMvuBlockStore,
  statData: Record<string, unknown>,
): CustomerMvuBlockStore {
  const next = cloneCustomerMvuBlockStore(store);
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

export function composeCustomerStatDataWithBlocks(
  currentStatData: Record<string, unknown>,
  state: CustomerPageState,
  store: CustomerMvuBlockStore,
  blockIds: CustomerMvuBlockId[],
  context: CustomerMvuBlockContext,
): { statData: Record<string, unknown>; store: CustomerMvuBlockStore } {
  const savedStore = saveActiveCustomerBlocksFromStatData(store, currentStatData);
  const clean = stripCustomerBlocks(currentStatData);
  const statData = _.merge({}, clean, makeCustomerCommonStatData(state));
  const uniqueIds = [...new Set(blockIds)];
  uniqueIds.forEach(id => {
    _.merge(statData, makeBlockData(id, state, context));
  });
  const nextStore: CustomerMvuBlockStore = {
    ...savedStore,
    activeBlockIds: uniqueIds,
    activeContext: clone(context),
    updatedAt: new Date().toISOString(),
  };
  return { statData, store: nextStore };
}

export function deactivateCustomerStatDataBlocks(
  currentStatData: Record<string, unknown>,
  state: CustomerPageState,
  store: CustomerMvuBlockStore,
): { statData: Record<string, unknown>; store: CustomerMvuBlockStore } {
  const savedStore = saveActiveCustomerBlocksFromStatData(store, currentStatData);
  const clean = stripCustomerBlocks(currentStatData);
  const statData = _.merge({}, clean, makeCustomerCommonStatData(state), { 互动现场: {} });
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

export function applyCustomerStatDataToState(
  state: CustomerPageState,
  store: CustomerMvuBlockStore,
  statData: Record<string, unknown>,
  allowRollback = false,
): { state: CustomerPageState; store: CustomerMvuBlockStore; statData: Record<string, unknown> } {
  let nextState = cloneCustomerPageState(state);
  const relation = isRecord(statData.当前关系) ? statData.当前关系 : null;
  const relationEmployee = typeof relation?._员工 === 'string' ? relation._员工 : '';
  const employeeName = relationEmployee || store.activeContext.employeeName || store.activeContext.contactName;
  if (relation && employeeName) {
    nextState = applyCustomerRelationshipUpdate(nextState, employeeName, relation, allowRollback);
  }
  const relatedRelationships = isRecord(statData.相关关系) ? statData.相关关系 : {};
  Object.entries(relatedRelationships).forEach(([name, update]) => {
    if (isRecord(update) && nextState.员工[name]) {
      nextState = applyCustomerRelationshipUpdate(nextState, name, update, allowRollback);
    }
  });
  const common = readTangquanCommonMvuUpdate(statData);
  if (common.dateText) nextState.日期 = common.dateText;
  if (common.time) nextState.时间 = common.time;
  if (common.location) {
    nextState.地点 = common.location;
    const scene = isRecord(statData.互动现场) ? statData.互动现场 : {};
    const isOnline = scene.交流方式 === '线上';
    if (!isOnline && employeeName && store.activeBlockIds.includes('customer.employee') && nextState.员工[employeeName]) {
      nextState.员工[employeeName].区域 = common.location;
      if (nextState.当前服务?.员工 === employeeName) nextState.当前服务.区域 = common.location;
    }
  }
  nextState = normalizeCustomerPageState(nextState);

  const normalizedStatData = _.merge({}, clone(statData), makeCustomerCommonStatData(nextState));
  if (store.activeBlockIds.length > 0) {
    const scene = isRecord(normalizedStatData.互动现场) ? clone(normalizedStatData.互动现场) : {};
    scene.地点 = nextState.地点;
    const employee = employeeName ? nextState.员工[employeeName] : undefined;
    if (employee && store.activeBlockIds.includes('customer.relationship')) {
      scene.员工 = store.activeContext.employeeNames?.length ? [...store.activeContext.employeeNames] : employee.姓名;
      scene.当前关系 = {
        好感度: employee.好感度,
        信任度: employee.信任度,
        联系状态: employee.联系状态,
      };
    }
    normalizedStatData.互动现场 = scene;
  }
  const composed = composeCustomerStatDataWithBlocks(
    normalizedStatData,
    nextState,
    store,
    store.activeBlockIds,
    store.activeContext,
  );
  return { state: nextState, store: composed.store, statData: composed.statData };
}
