export type TangquanCommonMvuUpdate = {
  dateText?: string;
  time?: string;
  location?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function readTangquanCommonMvuUpdate(statData: Record<string, unknown>): TangquanCommonMvuUpdate {
  const currentTime = typeof statData.当前时间 === 'string' ? statData.当前时间.trim() : '';
  const dateMatch = currentTime.match(/\d{4}年\d{1,2}月\d{1,2}日\s+星期[^\s]+/);
  const timeMatch = currentTime.match(/(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)(?:\s|$)/);
  const user = isRecord(statData.用户) ? statData.用户 : null;
  const location = typeof user?.所在地 === 'string' ? user.所在地.trim().slice(0, 80) : '';
  return {
    ...(dateMatch ? { dateText: dateMatch[0] } : {}),
    ...(timeMatch ? { time: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` } : {}),
    ...(location ? { location } : {}),
  };
}
