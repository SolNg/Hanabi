import type { TangquanLogger } from '../debug/logger';

export type TangquanPresetOutputFormat = 'none' | 'galgame' | 'airp' | 'customerDaily' | 'waiterDaily' | 'bossDaily';

type OutputFormatKey = Exclude<TangquanPresetOutputFormat, 'none'>;

export type TangquanPresetOutputFormatInspection = {
  presetName: string;
  available: boolean;
  dailyAvailable: boolean;
  bossDailyAvailable: boolean;
  format: TangquanPresetOutputFormat;
  enabled: Record<OutputFormatKey, boolean>;
  baseThoughtEnabled: boolean;
  dailyThoughtEnabled: boolean;
  bossThoughtEnabled: boolean;
  counts: Record<OutputFormatKey | 'baseThought' | 'dailyThought' | 'bossThought', number>;
};

export type TangquanPresetOutputFormatService = {
  inspect: () => TangquanPresetOutputFormatInspection;
  setFormat: (format: TangquanPresetOutputFormat, reason?: string) => Promise<boolean>;
  dispose: () => Promise<void>;
};

const OUTPUT_PROMPT_NAMES: Record<OutputFormatKey, string> = {
  galgame: '🎯 未开之花·Galgame输出',
  airp: '🎯 未开之花·AIRP正文输出',
  customerDaily: '🎯 未开之花·游客每日安排输出',
  waiterDaily: '🎯 未开之花·服务员每日安排输出',
  bossDaily: '🎯 未开之花·老板经营日报输出',
};

const THOUGHT_PROMPT_NAMES = {
  baseThought: '💭 思维链',
  dailyThought: '💭 未开之花·每日安排思维',
  bossThought: '💭 未开之花·经营日报思维',
} as const;

const OUTPUT_KEYS = Object.keys(OUTPUT_PROMPT_NAMES) as OutputFormatKey[];

function isDailyFormat(format: TangquanPresetOutputFormat): format is 'customerDaily' | 'waiterDaily' {
  return format === 'customerDaily' || format === 'waiterDaily';
}

export function createTangquanPresetOutputFormatService({
  log,
}: {
  log: TangquanLogger;
}): TangquanPresetOutputFormatService {
  let operationQueue: Promise<void> = Promise.resolve();
  let lastUnavailableSignature = '';

  function inspect(): TangquanPresetOutputFormatInspection {
    const preset = getPreset('in_use');
    const outputPrompts = Object.fromEntries(
      OUTPUT_KEYS.map(key => [key, preset.prompts.filter(prompt => prompt.name === OUTPUT_PROMPT_NAMES[key])]),
    ) as Record<OutputFormatKey, PresetPrompt[]>;
    const baseThoughtPrompts = preset.prompts.filter(prompt => prompt.name === THOUGHT_PROMPT_NAMES.baseThought);
    const dailyThoughtPrompts = preset.prompts.filter(prompt => prompt.name === THOUGHT_PROMPT_NAMES.dailyThought);
    const bossThoughtPrompts = preset.prompts.filter(prompt => prompt.name === THOUGHT_PROMPT_NAMES.bossThought);
    const enabled = Object.fromEntries(
      OUTPUT_KEYS.map(key => [key, outputPrompts[key].length === 1 && outputPrompts[key][0].enabled]),
    ) as Record<OutputFormatKey, boolean>;
    const enabledKeys = OUTPUT_KEYS.filter(key => enabled[key]);
    const baseAvailable = outputPrompts.galgame.length === 1 && outputPrompts.airp.length === 1;
    const dailyAvailable =
      baseAvailable &&
      outputPrompts.customerDaily.length === 1 &&
      outputPrompts.waiterDaily.length === 1 &&
      baseThoughtPrompts.length === 1 &&
      dailyThoughtPrompts.length === 1;
    const bossDailyAvailable =
      baseAvailable &&
      outputPrompts.bossDaily.length === 1 &&
      baseThoughtPrompts.length === 1 &&
      bossThoughtPrompts.length === 1;
    return {
      presetName: getLoadedPresetName(),
      available: baseAvailable,
      dailyAvailable,
      bossDailyAvailable,
      format: enabledKeys.length === 1 ? enabledKeys[0] : 'none',
      enabled,
      baseThoughtEnabled: baseThoughtPrompts.length === 1 && baseThoughtPrompts[0].enabled,
      dailyThoughtEnabled: dailyThoughtPrompts.length === 1 && dailyThoughtPrompts[0].enabled,
      bossThoughtEnabled: bossThoughtPrompts.length === 1 && bossThoughtPrompts[0].enabled,
      counts: {
        galgame: outputPrompts.galgame.length,
        airp: outputPrompts.airp.length,
        customerDaily: outputPrompts.customerDaily.length,
        waiterDaily: outputPrompts.waiterDaily.length,
        bossDaily: outputPrompts.bossDaily.length,
        baseThought: baseThoughtPrompts.length,
        dailyThought: dailyThoughtPrompts.length,
        bossThought: bossThoughtPrompts.length,
      },
    };
  }

  async function applyFormat(format: TangquanPresetOutputFormat, reason: string): Promise<boolean> {
    let before: TangquanPresetOutputFormatInspection;
    try {
      before = inspect();
    } catch (error) {
      log.warn('Output preset', 'Không đọc được preset hiện tại, bỏ qua chuyển đổi định dạng output', { reason, error: String(error) });
      return false;
    }

    const formatAvailable = format === 'bossDaily'
      ? before.bossDailyAvailable
      : isDailyFormat(format)
        ? before.dailyAvailable
        : before.available;
    if (!formatAvailable) {
      const signature = `${before.presetName}:${format}:${Object.values(before.counts).join(':')}`;
      if (signature !== lastUnavailableSignature) {
        lastUnavailableSignature = signature;
        log.warn('Output preset', 'Preset hiện tại thiếu entry output chuyên dụng Hoa Chưa Nở, tạm không chuyển đổi', {
          presetName: before.presetName,
          format,
          counts: before.counts,
        });
      }
      return false;
    }
    lastUnavailableSignature = '';

    const daily = isDailyFormat(format);
    const bossDaily = format === 'bossDaily';
    const outputAlreadyExpected = OUTPUT_KEYS.every(key => before.enabled[key] === (format === key));
    const thoughtAlreadyExpected =
      before.baseThoughtEnabled === (!daily && !bossDaily) &&
      (!before.dailyAvailable || before.dailyThoughtEnabled === daily) &&
      (!before.bossDailyAvailable || before.bossThoughtEnabled === bossDaily);
    if (outputAlreadyExpected && thoughtAlreadyExpected) {
      return true;
    }

    try {
      await updatePresetWith(
        'in_use',
        preset => {
          preset.prompts.forEach(prompt => {
            const outputKey = OUTPUT_KEYS.find(key => prompt.name === OUTPUT_PROMPT_NAMES[key]);
            if (outputKey) {
              prompt.enabled = format === outputKey;
            } else if (prompt.name === THOUGHT_PROMPT_NAMES.dailyThought) {
              prompt.enabled = daily;
            } else if (prompt.name === THOUGHT_PROMPT_NAMES.bossThought) {
              prompt.enabled = bossDaily;
            } else if (prompt.name === THOUGHT_PROMPT_NAMES.baseThought) {
              prompt.enabled = !daily && !bossDaily;
            }
          });
          return preset;
        },
        { render: 'none' },
      );
      log.info('Output preset', 'Đã chuyển đổi định dạng output Hoa Chưa Nở', {
        presetName: before.presetName,
        format,
        reason,
      });
      return true;
    } catch (error) {
      log.error('Output preset', 'Chuyển đổi định dạng output Hoa Chưa Nở thất bại', { format, reason, error: String(error) });
      return false;
    }
  }

  function setFormat(format: TangquanPresetOutputFormat, reason = 'Chưa ghi rõ nguyên nhân'): Promise<boolean> {
    const operation = operationQueue.then(() => applyFormat(format, reason));
    operationQueue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  return {
    inspect,
    setFormat,
    dispose: async () => {
      await setFormat('none', 'Script gỡ cài đặt');
    },
  };
}
