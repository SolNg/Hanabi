export type TangquanTimeControlState = {
  version: 1;
  lastCrossDayFromDate: string;
  lastCrossDayToDate: string;
  lastTargetTime: string;
};

export type TangquanTimeTravelPlan =
  | {
      ok: true;
      currentTime: string;
      targetTime: string;
      crossesMidnight: boolean;
      advanceMinutes: number;
    }
  | {
      ok: false;
      currentTime: string;
      targetTime: string;
      reason: string;
    };

export function makeTangquanTimeControlState(): TangquanTimeControlState {
  return {
    version: 1,
    lastCrossDayFromDate: '',
    lastCrossDayToDate: '',
    lastTargetTime: '',
  };
}

export function normalizeTangquanTimeControlState(value: unknown): TangquanTimeControlState {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Partial<TangquanTimeControlState>
    : {};
  return {
    version: 1,
    lastCrossDayFromDate: typeof source.lastCrossDayFromDate === 'string' ? source.lastCrossDayFromDate : '',
    lastCrossDayToDate: typeof source.lastCrossDayToDate === 'string' ? source.lastCrossDayToDate : '',
    lastTargetTime: normalizeTangquanClock(source.lastTargetTime) ?? '',
  };
}

export function normalizeTangquanClock(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

export function tangquanClockMinutes(value: string): number | null {
  const normalized = normalizeTangquanClock(value);
  if (!normalized) return null;
  const [hour, minute] = normalized.split(':').map(Number);
  return hour * 60 + minute;
}

export function planTangquanTimeTravel(currentValue: string, targetValue: string): TangquanTimeTravelPlan {
  const currentTime = normalizeTangquanClock(currentValue) ?? '';
  const targetTime = normalizeTangquanClock(targetValue) ?? '';
  if (!currentTime) {
    return { ok: false, currentTime, targetTime, reason: 'Thời gian game hiện tại không hợp lệ, không thể nhảy thời gian' };
  }
  if (!targetTime) {
    return { ok: false, currentTime, targetTime, reason: 'Thời gian mục tiêu không hợp lệ, vui lòng chọn lại' };
  }
  const currentMinutes = tangquanClockMinutes(currentTime) as number;
  const targetMinutes = tangquanClockMinutes(targetTime) as number;
  if (currentMinutes === targetMinutes) {
    return { ok: false, currentTime, targetTime, reason: 'Thời gian mục tiêu giống thời gian hiện tại' };
  }
  const crossesMidnight = targetMinutes < currentMinutes;
  return {
    ok: true,
    currentTime,
    targetTime,
    crossesMidnight,
    advanceMinutes: crossesMidnight
      ? 24 * 60 - currentMinutes + targetMinutes
      : targetMinutes - currentMinutes,
  };
}

export function recordTangquanTimeTravel(
  value: unknown,
  transition: {
    fromDate: string;
    toDate: string;
    targetTime: string;
    crossesMidnight: boolean;
  },
): TangquanTimeControlState {
  const next = normalizeTangquanTimeControlState(value);
  next.lastTargetTime = normalizeTangquanClock(transition.targetTime) ?? '';
  if (transition.crossesMidnight) {
    next.lastCrossDayFromDate = transition.fromDate;
    next.lastCrossDayToDate = transition.toDate;
  }
  return next;
}

export function isRecordedTangquanCrossDay(
  value: unknown,
  fromDate: string,
  toDate: string,
  targetTime: string,
): boolean {
  const state = normalizeTangquanTimeControlState(value);
  return Boolean(
    fromDate &&
      toDate &&
      state.lastCrossDayFromDate === fromDate &&
      state.lastCrossDayToDate === toDate &&
      state.lastTargetTime === normalizeTangquanClock(targetTime),
  );
}
