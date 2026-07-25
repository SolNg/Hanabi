import type { TangquanLogger } from '../debug/logger';
import type { TangquanPlayMode } from '../save/worldbookSave';
import { makeBossPageState } from '../ui/app/bossEconomy';
import { CUSTOMER_INITIAL_FUNDS, makeCustomerPageState } from '../ui/app/customerGame';
import { makeWaiterPageState } from '../ui/app/waiterGame';

export type TangquanMode = Exclude<TangquanPlayMode, '未选择'>;

export type TangquanMvuWriteResult = {
  mode: TangquanMode;
  messageId: number;
  statKeys: string[];
  created: boolean;
};

export type TangquanMvuRuntimeService = {
  getInitialStatData: (mode: TangquanMode) => Record<string, unknown>;
  makeInitialFrontendData: (mode: TangquanMode) => Record<string, unknown>;
  registerInitialStatData: (mode: TangquanMode) => Promise<TangquanMvuWriteResult>;
  ensureCurrentStatData: (mode: TangquanMode) => Promise<TangquanMvuWriteResult>;
  resetCommonStatData: (mode: TangquanMode) => Promise<TangquanMvuWriteResult>;
  readCurrentStatData: () => Promise<Record<string, unknown>>;
  replaceCurrentStatData: (statData: Record<string, unknown>, mode: TangquanMode) => Promise<TangquanMvuWriteResult>;
  mergeCurrentStatData: (patch: Record<string, unknown>, mode: TangquanMode) => Promise<TangquanMvuWriteResult>;
  setInteractionScene: (scene: Record<string, unknown>, mode: TangquanMode) => Promise<TangquanMvuWriteResult>;
  clearInteractionScene: (mode: TangquanMode) => Promise<TangquanMvuWriteResult>;
};

type MvuRuntimeOptions = {
  log: TangquanLogger;
};

const MVU_WAIT_TIMEOUT_MS = 10_000;
const MVU_WRITE_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer = 0;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(`${label} timeout, vui lòng xác nhận character card hiện tại đã bật MVU.`)), timeoutMs);
    }),
  ]).finally(() => {
    window.clearTimeout(timer);
  });
}

function formatCurrentDate() {
  const date = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日 星期${week}`;
}

function makeCommonInitialStatData(): Record<string, unknown> {
  return {
    当前时间: formatCurrentDate(),
    用户: {
      所在地: '未开之花汤泉',
    },
    互动现场: {},
  };
}

const MODE_INITIAL_STAT_DATA: Record<TangquanMode, Record<string, unknown>> = {
  老板: {
    未开之花汤泉: {
      _资金: 0,
      _店铺评分: 0,
      _好评率: 0,
    },
  },
  游客: {
    用户: {
      _资金: CUSTOMER_INITIAL_FUNDS,
      _当前指名服务员: '',
      _当前指名状态: '未指名',
    },
  },
  服务员: {
    用户: {
      _资金: 1200,
      _评级: 'D',
      _日薪: 600,
      _岗位: '室内大浴场',
      _工作状态: '未上班',
      _体力: 100,
    },
  },
};

function makeInitialFrontendData(mode: TangquanMode) {
  if (mode === '老板') {
    return {
      老板页面: makeBossPageState(),
    };
  }
  if (mode === '游客') {
    return {
      游客页面: makeCustomerPageState(),
    };
  }
  return { 服务员页面: makeWaiterPageState() };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function isTangquanMvuAvailable(): boolean {
  return (
    typeof Mvu !== 'undefined' &&
    typeof Mvu.getMvuData === 'function' &&
    typeof Mvu.replaceMvuData === 'function' &&
    typeof Mvu.parseMessage === 'function'
  );
}

function waitForMvuByPolling(): Promise<void> {
  return new Promise(resolve => {
    const check = () => {
      if (isTangquanMvuAvailable()) {
        resolve();
        return;
      }
      window.setTimeout(check, 100);
    };

    check();
  });
}

function waitForMvuGlobalSignal(): Promise<void> {
  try {
    return Promise.resolve(waitGlobalInitialized('Mvu'))
      .then(() => undefined)
      .catch(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

export async function waitForTangquanMvu(): Promise<void> {
  if (isTangquanMvuAvailable()) {
    return;
  }

  const polling = waitForMvuByPolling();
  await withTimeout(
    Promise.race([waitForMvuGlobalSignal(), polling]).then(async () => {
      if (!isTangquanMvuAvailable()) {
        await polling;
      }
    }),
    MVU_WAIT_TIMEOUT_MS,
    'Chờ MVU khởi tạo',
  );
}

function makeCurrentMvuDataFromVariables(): Mvu.MvuData {
  const variables = _.cloneDeep(getVariables(currentMessageOption()) ?? {}) as Mvu.MvuData;
  if (!isRecord(variables.initialized_lorebooks)) {
    variables.initialized_lorebooks = {};
  }
  if (!isRecord(variables.stat_data)) {
    variables.stat_data = {};
  }
  return variables;
}

export async function readCurrentTangquanMvuData(): Promise<Mvu.MvuData> {
  if (isTangquanMvuAvailable()) {
    await waitForTangquanMvu();
    return _.cloneDeep(Mvu.getMvuData(currentMessageOption()) ?? {}) as Mvu.MvuData;
  }

  return makeCurrentMvuDataFromVariables();
}

async function replaceCurrentTangquanMvuData(mvuData: Mvu.MvuData): Promise<void> {
  if (isTangquanMvuAvailable()) {
    await waitForTangquanMvu();
    await withTimeout(
      Promise.resolve(Mvu.replaceMvuData(mvuData, currentMessageOption())),
      MVU_WRITE_TIMEOUT_MS,
      'Ghi biến MVU',
    );
    return;
  }

  replaceVariables(mvuData as Record<string, unknown>, currentMessageOption());
}

function currentMessageOption(): VariableOption & { type: 'message'; message_id: number } {
  return { type: 'message', message_id: Math.max(0, getLastMessageId()) };
}

export function createTangquanMvuRuntimeService(options: MvuRuntimeOptions): TangquanMvuRuntimeService {
  function getInitialStatData(mode: TangquanMode) {
    return _.merge({}, makeCommonInitialStatData(), MODE_INITIAL_STAT_DATA[mode]);
  }

  async function readCurrentStatData(): Promise<Record<string, unknown>> {
    const variables = await readCurrentTangquanMvuData();
    const statData = _.get(variables, 'stat_data');
    return isRecord(statData) ? (_.cloneDeep(statData) as Record<string, unknown>) : {};
  }

  async function replaceCurrentStatData(
    statData: Record<string, unknown>,
    mode: TangquanMode,
    created = true,
  ): Promise<TangquanMvuWriteResult> {
    options.log.info('MVU', 'Chờ MVU khởi tạo', { mode, created });
    if (isTangquanMvuAvailable()) {
      await waitForTangquanMvu();
    } else {
      options.log.warn('MVU', 'MVU không khả dụng, dùng biến tin nhắn ghi trực tiếp trạng thái hiện tại', { mode, created });
    }
    options.log.info('MVU', 'Chuẩn bị ghi biến hiện tại', { mode, created, statKeys: Object.keys(statData) });
    const mvuData = await readCurrentTangquanMvuData();
    if (!mvuData.initialized_lorebooks) {
      mvuData.initialized_lorebooks = {};
    }
    mvuData.stat_data = _.cloneDeep(statData);
    await replaceCurrentTangquanMvuData(mvuData);

    const result = {
      mode,
      messageId: getLastMessageId(),
      statKeys: Object.keys(statData),
      created,
    };
    options.log.info('MVU', created ? 'Đã ghi trạng thái ban đầu hiện tại' : 'Đã cập nhật trạng thái hiện tại', result);
    return result;
  }

  async function registerInitialStatData(mode: TangquanMode): Promise<TangquanMvuWriteResult> {
    const statData = getInitialStatData(mode);
    return replaceCurrentStatData(statData, mode, true);
  }

  async function mergeCurrentStatData(
    patch: Record<string, unknown>,
    mode: TangquanMode,
  ): Promise<TangquanMvuWriteResult> {
    const current = await readCurrentStatData();
    const next = _.merge({}, current, patch);
    return replaceCurrentStatData(next, mode, false);
  }

  async function ensureCurrentStatData(mode: TangquanMode): Promise<TangquanMvuWriteResult> {
    const current = await readCurrentStatData();
    if (Object.keys(current).length > 0) {
      const result = {
        mode,
        messageId: getLastMessageId(),
        statKeys: Object.keys(current),
        created: false,
      };
      options.log.info('MVU', 'Trạng thái hiện tại đã tồn tại, giữ nguyên nội dung save', result);
      return result;
    }
    return registerInitialStatData(mode);
  }

  async function resetCommonStatData(mode: TangquanMode): Promise<TangquanMvuWriteResult> {
    return replaceCurrentStatData(makeCommonInitialStatData(), mode, false);
  }

  async function setInteractionScene(
    scene: Record<string, unknown>,
    mode: TangquanMode,
  ): Promise<TangquanMvuWriteResult> {
    const current = await readCurrentStatData();
    const next = _.cloneDeep(current);
    next.互动现场 = _.cloneDeep(scene);
    return replaceCurrentStatData(next, mode, false);
  }

  async function clearInteractionScene(mode: TangquanMode): Promise<TangquanMvuWriteResult> {
    const current = await readCurrentStatData();
    const next = _.cloneDeep(current);
    next.互动现场 = {};
    return replaceCurrentStatData(next, mode, false);
  }

  return {
    getInitialStatData,
    makeInitialFrontendData,
    registerInitialStatData,
    ensureCurrentStatData,
    resetCommonStatData,
    readCurrentStatData,
    replaceCurrentStatData,
    mergeCurrentStatData,
    setInteractionScene,
    clearInteractionScene,
  };
}
