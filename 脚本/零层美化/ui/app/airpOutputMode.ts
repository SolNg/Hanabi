export type TangquanAirpOutputMode = 'dialogue' | 'story';

export function normalizeTangquanAirpOutputMode(
  value: unknown,
  legacyKind: unknown = 'dialogue',
): TangquanAirpOutputMode {
  if (value === 'dialogue' || value === 'story') return value;
  return legacyKind === 'story' ? 'story' : 'dialogue';
}

export function toggleTangquanAirpOutputMode(value: unknown, legacyKind: unknown = 'dialogue'): TangquanAirpOutputMode {
  return normalizeTangquanAirpOutputMode(value, legacyKind) === 'story' ? 'dialogue' : 'story';
}

export function withTangquanAirpOutputMode<T extends object>(
  scene: T,
  outputMode: TangquanAirpOutputMode,
): T & { outputMode: TangquanAirpOutputMode } {
  return { ...scene, outputMode };
}
