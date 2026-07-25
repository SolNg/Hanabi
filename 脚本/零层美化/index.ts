/**
 * Làm đẹp tầng 0 của Suối nước nóng
 *
 * Script khóa hình ảnh tầng 0 chung:
 * - Giữ tầng chat thật làm context
 * - Về mặt hình ảnh ẩn các tầng ngoài tầng 0
 * - Mirror tầng mới nhất để hiển thị ở tầng 0, và giữ regex hiển thị hoạt động bình thường
 */
import { createLatestFloorBeautifier, type LatestFloorBeautifier } from './beautify/latestFloorBeautifier';
import { createZeroLockController, type ZeroLockController } from './core/zeroLock';
import { createTangquanLogger, type TangquanLogger } from './debug/logger';
import { createTangquanModeRuntimeService, type TangquanModeRuntimeService } from './runtime/modeRuntime';
import { createTangquanMvuRuntimeService, type TangquanMvuRuntimeService } from './runtime/mvuRuntime';
import {
  createTangquanPresetOutputFormatService,
  type TangquanPresetOutputFormatService,
} from './preset/outputFormatRuntime';
import { createFullSaveController, type TangquanFullSaveController } from './save/saveController';
import {
  createUserProfileWorldbookService,
  type TangquanUserProfileWorldbookService,
} from './save/userProfileWorldbook';
import { createWorldbookSaveService, type TangquanWorldbookSaveService } from './save/worldbookSave';
import { useZeroStore } from './stores/zeroStore';
import { createTangquanGameUi, type TangquanGameUiController } from './ui/app/gameUi';
import { createTangquanLoadingOverlay, type TangquanLoadingOverlay } from './ui/loadingOverlay';
import {
  createTangquanWorldbookRuntimeService,
  type TangquanWorldbookRuntimeService,
} from './worldbook/worldbookRuntime';

type TangquanFrontendController = {
  loading: TangquanLoadingOverlay;
  save: TangquanFullSaveController;
  worldbookSave: TangquanWorldbookSaveService;
  userProfileWorldbook: TangquanUserProfileWorldbookService;
  worldbookRuntime: TangquanWorldbookRuntimeService;
  mvuRuntime: TangquanMvuRuntimeService;
  presetOutputFormat: TangquanPresetOutputFormatService;
  runtime: TangquanModeRuntimeService;
  beautifier: LatestFloorBeautifier;
  gameUi: TangquanGameUiController;
  log: TangquanLogger;
  dispose: () => void;
};

// jsDelivr's external Pinia ESM evaluates this Vue compile-time flag when createPinia() runs.
// A fresh Tavern Helper iframe does not necessarily define it, so establish the browser fallback
// before the DOM-ready bootstrap without overwriting a host-provided value.
const vueRuntimeGlobals = globalThis as typeof globalThis & Record<string, unknown>;
if (typeof vueRuntimeGlobals['__VUE_PROD_DEVTOOLS__'] === 'undefined') {
  vueRuntimeGlobals['__VUE_PROD_DEVTOOLS__'] = false;
}

const MVU_BUNDLE_URL = 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';

async function ensureMvuRuntimeAvailable(): Promise<void> {
  const parentWindow = window.parent as Window & { Mvu?: typeof Mvu };
  if (!parentWindow.Mvu) {
    await import(/* webpackIgnore: true */ MVU_BUNDLE_URL);
  }
  await waitGlobalInitialized('Mvu');
}

async function resolveCharacterWorldbookName(): Promise<string> {
  const charWorldbooks = getCharWorldbookNames('current');
  const worldbookName = charWorldbooks.primary ?? charWorldbooks.additional[0];
  if (!worldbookName) {
    throw new Error('Character card hiện tại chưa gắn world book nhân vật, không thể bật entry Hoa Chưa Nở');
  }
  return worldbookName;
}

$(() => {
  void initializeTangquanFrontend();
});

async function initializeTangquanFrontend() {
  const pinia = createPinia();
  const log = createTangquanLogger();
  log.info('Khởi động', 'Script bắt đầu load');
  try {
    await ensureMvuRuntimeAvailable();
    log.info('MVU', 'Framework MVU đã sẵn sàng');
  } catch (error) {
    log.warn('MVU', 'Load framework MVU thất bại, sẽ giữ đường giảm cấp biến tin nhắn', String(error));
  }
  const store = useZeroStore(pinia);
  const controller = createZeroLockController(store);
  const loading = createTangquanLoadingOverlay(log);
  const beautifier = createLatestFloorBeautifier();
  const worldbookSave = createWorldbookSaveService({ loading, log });
  const userProfileWorldbook = createUserProfileWorldbookService({
    resolveWorldbookName: resolveCharacterWorldbookName,
    log,
  });
  const worldbookRuntime = createTangquanWorldbookRuntimeService({
    resolveWorldbookName: resolveCharacterWorldbookName,
    log,
  });
  const mvuRuntime = createTangquanMvuRuntimeService({ log });
  const presetOutputFormat = createTangquanPresetOutputFormatService({ log });
  const runtime = createTangquanModeRuntimeService({
    loading,
    log,
    mvu: mvuRuntime,
    worldbook: worldbookRuntime,
  });
  const save = createFullSaveController({
    worldbookSave,
    loading,
    log,
    beautifier,
    userProfileWorldbook,
  });
  try {
    const reconciliation = await save.reconcileRuntime();
    await userProfileWorldbook.migrateFromWorldbook(
      await worldbookSave.resolveWorldbookName(),
      reconciliation.runtime.activeSlotId,
    );
    await userProfileWorldbook.syncSlots(reconciliation.slotIds, reconciliation.runtime.activeSlotId);
  } catch (error) {
    log.warn('Save hoàn chỉnh', 'Đối chiếu khởi động thất bại, khi mở trang save sẽ đọc lại save thật', String(error));
  }
  const gameUi = createTangquanGameUi({
    save,
    loading,
    log,
    runtime,
    mvuRuntime,
    presetOutputFormat,
    worldbookRuntime,
    zeroLock: controller,
    beautifier,
  });
  appendInexistentScriptButtons([{ name: 'Mở Hoa Chưa Nở', visible: true }]);
  const openUiButton = eventOn(getButtonEvent('Mở Hoa Chưa Nở'), () => {
    log.info('Nút', 'Mở Hoa Chưa Nở');
    gameUi.open();
  });
  const frontend: TangquanFrontendController = {
    loading,
    save,
    worldbookSave,
    userProfileWorldbook,
    worldbookRuntime,
    mvuRuntime,
    presetOutputFormat,
    runtime,
    beautifier,
    gameUi,
    log,
    dispose: () => {
      log.info('Gỡ cài đặt', 'Đang gỡ controller frontend');
      openUiButton.stop();
      updateScriptButtonsWith(buttons => buttons.filter(button => button.name !== 'Mở Hoa Chưa Nở'));
      gameUi.dispose();
      void presetOutputFormat.dispose().finally(() => log.dispose());
      beautifier.dispose();
      loading.dispose();
    },
  };
  const parentWindow = window.parent as Window & {
    tangquanZeroLayerEmergencyDisable?: () => void;
    tangquanZeroLayer?: ZeroLockController;
    tangquanFrontend?: TangquanFrontendController;
  };
  let disposed = false;

  function disposeAll() {
    if (disposed) {
      return;
    }
    disposed = true;
    frontend.dispose();
    controller.dispose();
  }

  parentWindow.tangquanZeroLayer = controller;
  parentWindow.tangquanFrontend = frontend;
  parentWindow.tangquanZeroLayerEmergencyDisable = () => {
    log.warn('Gỡ khẩn cấp', 'Người dùng kích hoạt gỡ khẩn cấp');
    disposeAll();
    console.info('[Làm đẹp tầng 0 Suối nước nóng] Đã gỡ khẩn cấp');
  };
  gameUi.open();

  $(window).on('pagehide', () => {
    disposeAll();
    delete parentWindow.tangquanFrontend;
    delete parentWindow.tangquanZeroLayer;
    delete parentWindow.tangquanZeroLayerEmergencyDisable;
  });

  log.info('Khởi động', 'Script đã load xong');
}
