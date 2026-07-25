import { klona } from 'klona';
import { z } from 'zod';

export type TangquanSaveRuntime = {
  activeSlotId: string;
  activeMode: '未选择' | '老板' | '游客' | '服务员';
  lastSwitchAt: string;
};

const RuntimeSchema = z
  .object({
    activeSlotId: z.string().default(''),
    activeMode: z.enum(['未选择', '老板', '游客', '服务员']).default('未选择'),
    lastSwitchAt: z.string().default(''),
  })
  .catch({
    activeSlotId: '',
    activeMode: '未选择',
    lastSwitchAt: '',
  });

const RUNTIME_KEY = 'tangquanSaveRuntime';

export function getSaveRuntime(): TangquanSaveRuntime {
  const variables = getVariables({ type: 'script' });
  return RuntimeSchema.parse(variables[RUNTIME_KEY]);
}

export function replaceSaveRuntime(runtime: TangquanSaveRuntime): TangquanSaveRuntime {
  const normalized = RuntimeSchema.parse(runtime);
  const variables = getVariables({ type: 'script' });
  replaceVariables(
    {
      ...variables,
      [RUNTIME_KEY]: klona(normalized),
    },
    { type: 'script' },
  );
  return normalized;
}

export function patchSaveRuntime(patch: Partial<TangquanSaveRuntime>): TangquanSaveRuntime {
  return replaceSaveRuntime({
    ...getSaveRuntime(),
    ...patch,
  });
}
