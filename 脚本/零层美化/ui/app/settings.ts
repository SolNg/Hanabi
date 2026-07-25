import { klona } from 'klona';
import { z } from 'zod';

export type TangquanUiSettings = {
  fontSize: 'small' | 'standard' | 'large' | 'xlarge';
  fontFamily: 'default' | 'elegant' | 'clear';
  layout: 'auto' | 'compact' | 'wide';
  panel: 'clear' | 'standard' | 'soft';
};

const SETTINGS_KEY = 'tangquanUiSettings';

const SettingsSchema = z
  .object({
    fontSize: z.enum(['small', 'standard', 'large', 'xlarge']).catch('standard'),
    fontFamily: z.enum(['default', 'elegant', 'clear']).catch('default'),
    layout: z.enum(['auto', 'compact', 'wide']).catch('auto'),
    panel: z.enum(['clear', 'standard', 'soft']).catch('standard'),
  })
  .catch({
    fontSize: 'standard',
    fontFamily: 'default',
    layout: 'auto',
    panel: 'standard',
  });

export function getTangquanUiSettings(): TangquanUiSettings {
  const variables = getVariables({ type: 'script' });
  return SettingsSchema.parse(variables[SETTINGS_KEY]);
}

export function replaceTangquanUiSettings(settings: TangquanUiSettings): TangquanUiSettings {
  const normalized = SettingsSchema.parse(settings);
  const variables = getVariables({ type: 'script' });
  replaceVariables(
    {
      ...variables,
      [SETTINGS_KEY]: klona(normalized),
    },
    { type: 'script' },
  );
  return normalized;
}

export function patchTangquanUiSettings(patch: Partial<TangquanUiSettings>): TangquanUiSettings {
  return replaceTangquanUiSettings({
    ...getTangquanUiSettings(),
    ...patch,
  });
}
