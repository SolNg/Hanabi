import { klona } from 'klona';
import { z } from 'zod';

export const DEFAULT_CUSTOM_CSS = `#chat.tangquan-zero-lock[data-tq-hide="true"] > .mes[data-tq-visual-zero="true"] {
  border: 1px solid rgba(232, 213, 154, 0.24);
  border-radius: 8px;
  background: rgba(8, 11, 13, 0.72);
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.28), 0 0 24px rgba(232, 213, 154, 0.08);
}

#chat.tangquan-zero-lock[data-tq-hide="true"] > .mes[data-tq-visual-zero="true"] .mes_text {
  color: rgba(245, 242, 232, 0.94);
  line-height: 1.75;
}

#chat.tangquan-zero-lock[data-tq-hide="true"] > .mes[data-tq-visual-zero="true"] .name_text {
  color: #e8d59a;
}

#chat.tangquan-zero-lock[data-tq-hide="true"] > .mes[data-tq-visual-zero="true"][data-tq-preview="user"] {
  border-color: rgba(103, 201, 189, 0.32);
}

#chat.tangquan-zero-lock[data-tq-hide="true"] > .mes[data-tq-visual-zero="true"][data-tq-preview="user"] .mes_text {
  color: rgba(227, 250, 247, 0.94);
}`;

const MirrorModeSchema = z.enum(['latest_assistant', 'latest_message']);

export type MirrorMode = z.infer<typeof MirrorModeSchema>;

export type ZeroSettings = {
  enabled: boolean;
  hideNonZero: boolean;
  debugShowHidden: boolean;
  streamPreview: boolean;
  previewUserInput: boolean;
  mirrorMode: MirrorMode;
  mirrorDelayMs: number;
  customCss: string;
};

export type ZeroStatus = {
  ready: boolean;
  isGenerating: boolean;
  lastMirroredId: number | null;
  lastMirrorRole: 'system' | 'assistant' | 'user' | null;
  lastMirrorAt: string;
  totalFloors: number;
  lastReason: string;
  lastError: string;
  manualReveal: boolean;
};

const SettingsSchema = z
  .object({
    enabled: z.boolean().default(true),
    hideNonZero: z.boolean().default(true),
    debugShowHidden: z.boolean().default(false),
    streamPreview: z.boolean().default(true),
    previewUserInput: z.boolean().default(true),
    mirrorMode: MirrorModeSchema.default('latest_assistant'),
    mirrorDelayMs: z.coerce.number().min(0).max(5000).default(450),
    customCss: z.string().default(DEFAULT_CUSTOM_CSS),
  })
  .catch({
    enabled: true,
    hideNonZero: true,
    debugShowHidden: false,
    streamPreview: true,
    previewUserInput: true,
    mirrorMode: 'latest_assistant',
    mirrorDelayMs: 450,
    customCss: DEFAULT_CUSTOM_CSS,
  });

function loadSettings(): ZeroSettings {
  const variables = getVariables({ type: 'script' });
  return SettingsSchema.parse(variables.settings);
}

function saveSettings(settings: ZeroSettings): void {
  const variables = getVariables({ type: 'script' });
  replaceVariables({ ...variables, settings: klona(settings) }, { type: 'script' });
}

export const useZeroStore = defineStore('tangquan-zero-layer-store', () => {
  const settings = reactive<ZeroSettings>(loadSettings());
  const status = reactive<ZeroStatus>({
    ready: false,
    isGenerating: false,
    lastMirroredId: null,
    lastMirrorRole: null,
    lastMirrorAt: '',
    totalFloors: 0,
    lastReason: 'Đang khởi tạo',
    lastError: '',
    manualReveal: false,
  });

  function patchSettings(patch: Partial<ZeroSettings>) {
    Object.assign(settings, SettingsSchema.parse({ ...klona(settings), ...patch }));
    saveSettings(settings);
  }

  function resetCustomCss() {
    patchSettings({ customCss: DEFAULT_CUSTOM_CSS });
  }

  function markStatus(patch: Partial<ZeroStatus>) {
    Object.assign(status, patch);
  }

  return {
    settings,
    status,
    patchSettings,
    resetCustomCss,
    markStatus,
  };
});
