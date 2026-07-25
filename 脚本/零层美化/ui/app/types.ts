import type { LatestFloorBeautifier } from '../../beautify/latestFloorBeautifier';
import type { ZeroLockController } from '../../core/zeroLock';
import type { TangquanLogger } from '../../debug/logger';
import type { TangquanPresetOutputFormatService } from '../../preset/outputFormatRuntime';
import type { TangquanModeRuntimeService } from '../../runtime/modeRuntime';
import type { TangquanMvuRuntimeService } from '../../runtime/mvuRuntime';
import type { TangquanFullSaveController } from '../../save/saveController';
import type { TangquanAutoSaveResult, TangquanAutoSaveSnapshot } from '../../save/autoSaveController';
import type { TangquanWorldbookRuntimeService } from '../../worldbook/worldbookRuntime';
import type { TangquanLoadingOverlay } from '../loadingOverlay';

export type TangquanGameUiServices = {
  save: TangquanFullSaveController;
  loading: TangquanLoadingOverlay;
  log: TangquanLogger;
  presetOutputFormat: TangquanPresetOutputFormatService;
  runtime: TangquanModeRuntimeService;
  mvuRuntime: TangquanMvuRuntimeService;
  worldbookRuntime: TangquanWorldbookRuntimeService;
  zeroLock: Pick<ZeroLockController, 'mirrorNow' | 'applyAll' | 'getUiMountElement' | 'releaseUiMountElement'>;
  beautifier: Pick<LatestFloorBeautifier, 'applyNow'>;
  uiMemory?: {
    read: () => Record<string, unknown> | null;
    write: (snapshot: Record<string, unknown>) => void;
    clear: () => void;
  };
};

export type TangquanGameUiController = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isVisible: () => boolean;
  inspectAutoSave: () => TangquanAutoSaveSnapshot | null;
  markAutoSaveDirty: (reason: string) => boolean;
  requestAutoSave: (reason: string, force?: boolean) => Promise<TangquanAutoSaveResult | null>;
  dispose: () => void;
};
