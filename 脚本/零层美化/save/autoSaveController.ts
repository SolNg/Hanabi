export type TangquanAutoSaveMeta = {
  slotId: string;
  chunkCount: number;
  byteLength: number;
  checksum: string;
};

export type TangquanAutoSaveBlockState = {
  blocked: boolean;
  reasons: string[];
};

export type TangquanAutoSaveTrigger = 'interval' | 'idle' | 'force';

export type TangquanAutoSaveContext = {
  trigger: TangquanAutoSaveTrigger;
  reasons: string[];
  dirtyRevision: number;
};

export type TangquanAutoSaveResult = {
  status: 'saved' | 'skipped' | 'deferred' | 'failed';
  trigger: TangquanAutoSaveTrigger;
  reasons: string[];
  blockers: string[];
  elapsedMs: number;
  meta: TangquanAutoSaveMeta | null;
  error: string;
};

export type TangquanAutoSaveSnapshot = {
  dirty: boolean;
  dirtyRevision: number;
  dirtySince: number;
  reasons: string[];
  requestPending: boolean;
  forcePending: boolean;
  saving: boolean;
  lastSavedAt: number;
  lastActivityAt: number;
  nextAttemptAt: number;
  retryNotBefore: number;
  lastResult: TangquanAutoSaveResult | null;
};

export type TangquanAutoSaveEvent =
  | { type: 'dirty'; snapshot: TangquanAutoSaveSnapshot; reason: string }
  | { type: 'scheduled'; snapshot: TangquanAutoSaveSnapshot; delayMs: number }
  | { type: 'blocked'; snapshot: TangquanAutoSaveSnapshot; result: TangquanAutoSaveResult }
  | { type: 'start'; snapshot: TangquanAutoSaveSnapshot; context: TangquanAutoSaveContext }
  | { type: 'saved'; snapshot: TangquanAutoSaveSnapshot; result: TangquanAutoSaveResult }
  | { type: 'failed'; snapshot: TangquanAutoSaveSnapshot; result: TangquanAutoSaveResult }
  | { type: 'clean'; snapshot: TangquanAutoSaveSnapshot; reason: string }
  | { type: 'disposed'; snapshot: TangquanAutoSaveSnapshot };

export type TangquanAutoSaveController = {
  markDirty: (reason: string) => void;
  noteActivity: () => void;
  request: (reason: string, options?: { force?: boolean }) => Promise<TangquanAutoSaveResult>;
  markClean: (reason: string, savedAt?: number) => void;
  inspect: () => TangquanAutoSaveSnapshot;
  dispose: () => void;
};

type TangquanAutoSaveControllerOptions = {
  hasActiveSlot: () => boolean;
  getBlockState: () => TangquanAutoSaveBlockState;
  save: (context: TangquanAutoSaveContext) => Promise<TangquanAutoSaveMeta | null>;
  onEvent?: (event: TangquanAutoSaveEvent) => void;
  minIntervalMs?: number;
  idleDelayMs?: number;
  blockedRetryMs?: number;
  failureRetryMs?: number;
  now?: () => number;
  setTimer?: (task: () => void, delayMs: number) => number;
  clearTimer?: (timer: number) => void;
};

export const TANGQUAN_AUTOSAVE_MIN_INTERVAL_MS = 90_000;
export const TANGQUAN_AUTOSAVE_IDLE_DELAY_MS = 180_000;
export const TANGQUAN_AUTOSAVE_BLOCKED_RETRY_MS = 15_000;
export const TANGQUAN_AUTOSAVE_FAILURE_RETRY_MS = 60_000;

function cleanReason(reason: string): string {
  return reason.trim() || 'Chưa ghi rõ thay đổi';
}

function makeResult(
  status: TangquanAutoSaveResult['status'],
  trigger: TangquanAutoSaveTrigger,
  reasons: string[],
  detail: Partial<Omit<TangquanAutoSaveResult, 'status' | 'trigger' | 'reasons'>> = {},
): TangquanAutoSaveResult {
  return {
    status,
    trigger,
    reasons,
    blockers: detail.blockers ?? [],
    elapsedMs: detail.elapsedMs ?? 0,
    meta: detail.meta ?? null,
    error: detail.error ?? '',
  };
}

export function createTangquanAutoSaveController(
  options: TangquanAutoSaveControllerOptions,
): TangquanAutoSaveController {
  const now = options.now ?? (() => Date.now());
  const setTimer = options.setTimer ?? ((task, delayMs) => window.setTimeout(task, delayMs));
  const clearTimer = options.clearTimer ?? (timer => window.clearTimeout(timer));
  const minIntervalMs = Math.max(0, options.minIntervalMs ?? TANGQUAN_AUTOSAVE_MIN_INTERVAL_MS);
  const idleDelayMs = Math.max(0, options.idleDelayMs ?? TANGQUAN_AUTOSAVE_IDLE_DELAY_MS);
  const blockedRetryMs = Math.max(100, options.blockedRetryMs ?? TANGQUAN_AUTOSAVE_BLOCKED_RETRY_MS);
  const failureRetryMs = Math.max(100, options.failureRetryMs ?? TANGQUAN_AUTOSAVE_FAILURE_RETRY_MS);

  let dirty = false;
  let dirtyRevision = 0;
  let dirtySince = 0;
  const dirtyReasons = new Set<string>();
  let requestPending = false;
  let forcePending = false;
  let lastSavedAt = 0;
  let lastActivityAt = now();
  let nextAttemptAt = 0;
  let retryNotBefore = 0;
  let timer = 0;
  let disposed = false;
  let running: Promise<TangquanAutoSaveResult> | null = null;
  let lastResult: TangquanAutoSaveResult | null = null;

  function inspect(): TangquanAutoSaveSnapshot {
    return {
      dirty,
      dirtyRevision,
      dirtySince,
      reasons: [...dirtyReasons],
      requestPending,
      forcePending,
      saving: running !== null,
      lastSavedAt,
      lastActivityAt,
      nextAttemptAt,
      retryNotBefore,
      lastResult: lastResult
        ? { ...lastResult, reasons: [...lastResult.reasons], blockers: [...lastResult.blockers] }
        : null,
    };
  }

  function emit(event: TangquanAutoSaveEvent) {
    options.onEvent?.(event);
  }

  function clearScheduledTimer() {
    if (timer) {
      clearTimer(timer);
      timer = 0;
    }
    nextAttemptAt = 0;
  }

  function scheduleAt(targetAt: number) {
    if (disposed || !dirty || !options.hasActiveSlot()) {
      clearScheduledTimer();
      return;
    }
    const current = now();
    const safeTarget = Math.max(current + 25, targetAt);
    if (timer && nextAttemptAt <= safeTarget) {
      return;
    }
    clearScheduledTimer();
    nextAttemptAt = safeTarget;
    const delayMs = Math.max(25, safeTarget - current);
    timer = setTimer(() => {
      timer = 0;
      nextAttemptAt = 0;
      void flush(false);
    }, delayMs);
    emit({ type: 'scheduled', snapshot: inspect(), delayMs });
  }

  function scheduleNext() {
    if (disposed || !dirty || !options.hasActiveSlot()) {
      clearScheduledTimer();
      return;
    }
    const current = now();
    if (retryNotBefore > current) {
      scheduleAt(retryNotBefore);
      return;
    }
    if (forcePending) {
      scheduleAt(current + 25);
      return;
    }
    const intervalReadyAt = lastSavedAt > 0 ? lastSavedAt + minIntervalMs : current;
    const targetAt = requestPending ? intervalReadyAt : Math.max(intervalReadyAt, lastActivityAt + idleDelayMs);
    scheduleAt(targetAt);
  }

  function ensureDirty(reason: string) {
    const cleaned = cleanReason(reason);
    dirtyRevision += 1;
    if (!dirty) {
      dirty = true;
      dirtySince = now();
    }
    dirtyReasons.add(cleaned);
    emit({ type: 'dirty', snapshot: inspect(), reason: cleaned });
  }

  function markDirty(reason: string) {
    if (disposed || !options.hasActiveSlot()) return;
    ensureDirty(reason);
    scheduleNext();
  }

  function noteActivity() {
    if (disposed) return;
    lastActivityAt = now();
    if (dirty && !requestPending && !forcePending) {
      scheduleNext();
    }
  }

  function markClean(reason: string, savedAt = now()) {
    dirtyRevision += 1;
    dirty = false;
    dirtySince = 0;
    dirtyReasons.clear();
    requestPending = false;
    forcePending = false;
    retryNotBefore = 0;
    lastSavedAt = Math.max(0, savedAt);
    clearScheduledTimer();
    emit({ type: 'clean', snapshot: inspect(), reason: cleanReason(reason) });
  }

  function resolveTrigger(force: boolean): TangquanAutoSaveTrigger {
    if (force || forcePending) return 'force';
    return requestPending ? 'interval' : 'idle';
  }

  function isEligible(trigger: TangquanAutoSaveTrigger, current: number): boolean {
    if (trigger === 'force') return true;
    const intervalReady = lastSavedAt === 0 || current - lastSavedAt >= minIntervalMs;
    if (!intervalReady) return false;
    if (trigger === 'interval') return requestPending;
    return !requestPending && current - lastActivityAt >= idleDelayMs;
  }

  async function flush(force: boolean): Promise<TangquanAutoSaveResult> {
    if (disposed) {
      return makeResult('skipped', force ? 'force' : 'idle', [...dirtyReasons], { error: 'Controller đã gỡ cài đặt' });
    }
    if (running) {
      const activeRun = running;
      const result = await activeRun;
      if (forcePending && dirty) {
        return flush(true);
      }
      return result;
    }
    const trigger = resolveTrigger(force);
    const reasons = [...dirtyReasons];
    if (!dirty || !options.hasActiveSlot()) {
      const result = makeResult('skipped', trigger, reasons);
      lastResult = result;
      if (!options.hasActiveSlot()) {
        dirty = false;
        dirtySince = 0;
        dirtyReasons.clear();
        requestPending = false;
        forcePending = false;
        clearScheduledTimer();
      }
      return result;
    }

    const current = now();
    if (retryNotBefore > current || !isEligible(trigger, current)) {
      scheduleNext();
      const result = makeResult('deferred', trigger, reasons);
      lastResult = result;
      return result;
    }

    const blockState = options.getBlockState();
    if (blockState.blocked) {
      retryNotBefore = current + blockedRetryMs;
      scheduleNext();
      const result = makeResult('deferred', trigger, reasons, { blockers: [...blockState.reasons] });
      lastResult = result;
      emit({ type: 'blocked', snapshot: inspect(), result });
      return result;
    }

    clearScheduledTimer();
    retryNotBefore = 0;
    const targetRevision = dirtyRevision;
    const context: TangquanAutoSaveContext = { trigger, reasons, dirtyRevision: targetRevision };
    const startedAt = now();
    const requestAtStart = requestPending;
    const forceAtStart = force || forcePending;
    requestPending = false;
    forcePending = false;
    emit({ type: 'start', snapshot: inspect(), context });

    running = (async () => {
      try {
        const meta = await options.save(context);
        const elapsedMs = Math.max(0, now() - startedAt);
        if (!meta) {
          const result = makeResult('skipped', trigger, reasons, { elapsedMs });
          lastResult = result;
          return result;
        }
        lastSavedAt = now();
        retryNotBefore = 0;
        if (dirtyRevision === targetRevision && dirty) {
          dirty = false;
          dirtySince = 0;
          dirtyReasons.clear();
        }
        const result = makeResult('saved', trigger, reasons, { elapsedMs, meta });
        lastResult = result;
        emit({ type: 'saved', snapshot: inspect(), result });
        return result;
      } catch (error) {
        const elapsedMs = Math.max(0, now() - startedAt);
        dirty = true;
        requestPending = requestPending || requestAtStart || forceAtStart;
        retryNotBefore = now() + failureRetryMs;
        const result = makeResult('failed', trigger, reasons, { elapsedMs, error: String(error) });
        lastResult = result;
        emit({ type: 'failed', snapshot: inspect(), result });
        return result;
      } finally {
        running = null;
        if (dirty) scheduleNext();
      }
    })();

    const result = await running;
    if (forcePending && dirty) {
      return flush(true);
    }
    return result;
  }

  async function request(reason: string, requestOptions: { force?: boolean } = {}) {
    if (disposed || !options.hasActiveSlot()) {
      return makeResult('skipped', requestOptions.force ? 'force' : 'interval', [cleanReason(reason)]);
    }
    ensureDirty(reason);
    requestPending = true;
    if (requestOptions.force) forcePending = true;
    if (running) {
      const activeRun = running;
      await activeRun;
      return flush(Boolean(requestOptions.force));
    }
    return flush(Boolean(requestOptions.force));
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clearScheduledTimer();
    emit({ type: 'disposed', snapshot: inspect() });
  }

  return { markDirty, noteActivity, request, markClean, inspect, dispose };
}
