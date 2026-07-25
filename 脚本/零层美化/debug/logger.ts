export type TangquanLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type TangquanLogEntry = {
  id: number;
  at: string;
  level: TangquanLogLevel;
  scope: string;
  message: string;
  detail?: unknown;
};

export type TangquanLogOperationStatus = 'running' | 'success' | 'error';

export type TangquanLogOperation = {
  id: number;
  label: string;
  startedAt: string;
  finishedAt?: string;
  status: TangquanLogOperationStatus;
  context?: unknown;
  entries: TangquanLogEntry[];
};

export type TangquanLogger = {
  debug: (scope: string, message: string, detail?: unknown) => void;
  info: (scope: string, message: string, detail?: unknown) => void;
  warn: (scope: string, message: string, detail?: unknown) => void;
  error: (scope: string, message: string, detail?: unknown) => void;
  beginOperation: (label: string, context?: unknown) => number;
  finishOperation: (operationId: number, status?: Exclude<TangquanLogOperationStatus, 'running'>, context?: unknown) => void;
  snapshot: () => TangquanLogEntry[];
  operationSnapshot: () => TangquanLogOperation[];
  exportJson: (context?: unknown) => string;
  clear: () => void;
  setConsoleEnabled: (enabled: boolean) => void;
  dispose: () => void;
};

const MAX_OPERATIONS = 5;
const MAX_ENTRIES_PER_OPERATION = 16;
const MAX_STRING_LENGTH = 700;
const MAX_ARRAY_ITEMS = 8;
const MAX_OBJECT_KEYS = 12;
const MAX_DEPTH = 3;
const RELEASE_VERSION = '1.0.0';

function nowText(): string {
  return new Date().toLocaleTimeString();
}

function nowIso(): string {
  return new Date().toISOString();
}

function truncateText(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}... [đã cắt bớt ${value.length - MAX_STRING_LENGTH} ký tự]`;
}

function sanitizeDetail(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return truncateText(value);
  if (typeof value === 'bigint') return String(value);
  if (typeof value === 'function' || typeof value === 'symbol') return String(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateText(value.message),
      stack: value.stack ? truncateText(value.stack) : undefined,
    };
  }
  if (typeof value !== 'object') return truncateText(String(value));
  if (seen.has(value)) return '[tham chiếu vòng]';
  if (depth >= MAX_DEPTH) return `[đã bỏ qua ${Array.isArray(value) ? 'mảng' : 'object'}]`;
  seen.add(value);

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_ITEMS).map(item => sanitizeDetail(item, depth + 1, seen));
    if (value.length > MAX_ARRAY_ITEMS) items.push(`[còn ${value.length - MAX_ARRAY_ITEMS} mục khác]`);
    return items;
  }

  const source = value as Record<string, unknown>;
  const keys = Object.keys(source);
  const output: Record<string, unknown> = {};
  keys.slice(0, MAX_OBJECT_KEYS).forEach(key => {
    output[key] = sanitizeDetail(source[key], depth + 1, seen);
  });
  if (keys.length > MAX_OBJECT_KEYS) output.__omittedKeys = keys.length - MAX_OBJECT_KEYS;
  return output;
}

function cloneOperation(operation: TangquanLogOperation): TangquanLogOperation {
  return {
    ...operation,
    entries: operation.entries.map(entry => ({ ...entry })),
  };
}

export function createTangquanLogger(): TangquanLogger {
  let nextEntryId = 1;
  let nextOperationId = 1;
  let consoleEnabled = false;
  const operations: TangquanLogOperation[] = [];
  const activeOperationIds: number[] = [];

  function trimOperations() {
    if (operations.length <= MAX_OPERATIONS) return;
    const removedIds = operations.splice(0, operations.length - MAX_OPERATIONS).map(operation => operation.id);
    for (let index = activeOperationIds.length - 1; index >= 0; index -= 1) {
      if (removedIds.includes(activeOperationIds[index])) activeOperationIds.splice(index, 1);
    }
  }

  function createOperation(label: string, context?: unknown): TangquanLogOperation {
    const operation: TangquanLogOperation = {
      id: nextOperationId,
      label: truncateText(label),
      startedAt: nowIso(),
      status: 'running',
      context: context === undefined ? undefined : sanitizeDetail(context),
      entries: [],
    };
    nextOperationId += 1;
    operations.push(operation);
    trimOperations();
    return operation;
  }

  function getFallbackOperation(): TangquanLogOperation {
    return operations.at(-1) ?? createOperation('Khởi động và chạy nền');
  }

  function push(level: TangquanLogLevel, scope: string, message: string, detail?: unknown) {
    const activeId = activeOperationIds.at(-1);
    let operation = activeId === undefined ? undefined : operations.find(item => item.id === activeId);
    let standaloneError = false;
    if (!operation && (level === 'warn' || level === 'error')) {
      operation = createOperation(`${level === 'error' ? 'Lỗi' : 'Cảnh báo'}: ${scope}`);
      standaloneError = true;
    }
    operation ??= getFallbackOperation();

    const entry: TangquanLogEntry = {
      id: nextEntryId,
      at: nowText(),
      level,
      scope: truncateText(scope),
      message: truncateText(message),
      detail: detail === undefined ? undefined : sanitizeDetail(detail),
    };
    nextEntryId += 1;
    operation.entries.push(entry);
    if (operation.entries.length > MAX_ENTRIES_PER_OPERATION) {
      const removableIndex = operation.entries.findIndex(item => item.level !== 'error');
      operation.entries.splice(removableIndex >= 0 ? removableIndex : 0, 1);
    }
    if (standaloneError) {
      operation.status = level === 'error' ? 'error' : 'success';
      operation.finishedAt = nowIso();
    }

    if (!consoleEnabled && level !== 'warn' && level !== 'error') return;
    const prefix = `[Hoa Chưa Nở:${scope}] ${message}`;
    const safeDetail = entry.detail ?? '';
    if (level === 'error') console.error(prefix, safeDetail);
    else if (level === 'warn') console.warn(prefix, safeDetail);
    else if (level === 'debug') console.debug(prefix, safeDetail);
    else console.info(prefix, safeDetail);
  }

  function beginOperation(label: string, context?: unknown): number {
    const operation = createOperation(label, context);
    activeOperationIds.push(operation.id);
    return operation.id;
  }

  function finishOperation(
    operationId: number,
    status: Exclude<TangquanLogOperationStatus, 'running'> = 'success',
    context?: unknown,
  ) {
    const operation = operations.find(item => item.id === operationId);
    if (operation) {
      operation.status = status;
      operation.finishedAt = nowIso();
      if (context !== undefined) operation.context = sanitizeDetail(context);
    }
    const stackIndex = activeOperationIds.lastIndexOf(operationId);
    if (stackIndex >= 0) activeOperationIds.splice(stackIndex, 1);
  }

  return {
    debug: (scope, message, detail) => push('debug', scope, message, detail),
    info: (scope, message, detail) => push('info', scope, message, detail),
    warn: (scope, message, detail) => push('warn', scope, message, detail),
    error: (scope, message, detail) => push('error', scope, message, detail),
    beginOperation,
    finishOperation,
    snapshot: () => operations.flatMap(operation => operation.entries.map(entry => ({ ...entry }))),
    operationSnapshot: () => operations.map(cloneOperation),
    exportJson: context =>
      JSON.stringify(
        {
          format: 'Ghi nhận vấn đề Hoa Chưa Nở',
          version: 1,
          release: RELEASE_VERSION,
          exportedAt: nowIso(),
          browser: typeof navigator === 'undefined' ? '' : navigator.userAgent,
          context: context === undefined ? undefined : sanitizeDetail(context),
          operations: operations.map(cloneOperation),
        },
        null,
        2,
      ),
    clear: () => {
      operations.splice(0, operations.length);
      activeOperationIds.splice(0, activeOperationIds.length);
    },
    setConsoleEnabled: enabled => {
      consoleEnabled = enabled;
    },
    dispose: () => {
      operations.splice(0, operations.length);
      activeOperationIds.splice(0, activeOperationIds.length);
      consoleEnabled = false;
    },
  };
}
