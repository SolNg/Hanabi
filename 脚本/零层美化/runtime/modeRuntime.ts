import type { TangquanLogger } from '../debug/logger';
import type { TangquanLoadingOverlay } from '../ui/loadingOverlay';
import type { TangquanPlayMode } from '../save/worldbookSave';
import type { TangquanMvuRuntimeService } from './mvuRuntime';
import type { TangquanWorldbookRuntimeService } from '../worldbook/worldbookRuntime';

export type TangquanMode = Exclude<TangquanPlayMode, '未选择'>;

export type TangquanModeRuntimeService = {
  makeInitialSaveData: (mode: TangquanMode, userInfo: Record<string, unknown>) => Record<string, unknown>;
  prepareNewGame: (mode: TangquanMode, slotId: string) => Promise<void>;
  activateLoadedMode: (mode: TangquanMode, slotId: string) => Promise<void>;
  getInitialStatData: (mode: TangquanMode) => Record<string, unknown>;
};

type ModeRuntimeOptions = {
  loading: TangquanLoadingOverlay;
  log: TangquanLogger;
  mvu: TangquanMvuRuntimeService;
  worldbook: TangquanWorldbookRuntimeService;
};

export function createTangquanModeRuntimeService(options: ModeRuntimeOptions): TangquanModeRuntimeService {
  function getInitialStatData(mode: TangquanMode) {
    return options.mvu.getInitialStatData(mode);
  }

  function makeInitialSaveData(mode: TangquanMode, userInfo: Record<string, unknown>): Record<string, unknown> {
    return {
      店名: 'Hoa Chưa Nở',
      创建时间: new Date().toISOString(),
      用户信息: userInfo,
      前端数据: options.mvu.makeInitialFrontendData(mode),
    };
  }

  async function prepareNewGame(mode: TangquanMode, slotId: string): Promise<void> {
    await options.loading.run('Vào Hoa Chưa Nở', async overlay => {
      overlay.update(12, 'Vào Hoa Chưa Nở', 'Đang sắp xếp khai cảnh');
      const statData = getInitialStatData(mode);
      options.log.info('Khởi tạo gameplay', 'Chuẩn bị đăng ký biến ban đầu', { mode, slotId, statData });
      overlay.update(42, 'Vào Hoa Chưa Nở', 'Đang đăng ký trạng thái hiện tại');
      const mvuResult = await options.mvu.registerInitialStatData(mode);
      overlay.update(76, 'Vào Hoa Chưa Nở', 'Đang chuẩn bị nội dung gameplay');
      const worldbookResult = await options.worldbook.syncModeEntries(mode, slotId);
      overlay.update(100, 'Vào Hoa Chưa Nở', 'Hoàn thành');
      options.log.info('Khởi tạo gameplay', 'Chuẩn bị nội dung chạy game mới hoàn tất', { mode, slotId, mvuResult, worldbookResult });
    });
  }

  async function activateLoadedMode(mode: TangquanMode, slotId: string): Promise<void> {
    await options.loading.run('Vào Hoa Chưa Nở', async overlay => {
      overlay.update(28, 'Vào Hoa Chưa Nở', 'Đang sắp xếp cổng vào save');
      const mvuResult = await options.mvu.ensureCurrentStatData(mode);
      overlay.update(62, 'Vào Hoa Chưa Nở', 'Đang chuẩn bị nội dung gameplay');
      const worldbookResult = await options.worldbook.syncModeEntries(mode, slotId);
      overlay.update(100, 'Vào Hoa Chưa Nở', 'Hoàn thành');
      options.log.info('Khởi tạo gameplay', 'Chuẩn bị nội dung chạy khi load save hoàn tất', { mode, slotId, mvuResult, worldbookResult });
    });
  }

  return {
    makeInitialSaveData,
    prepareNewGame,
    activateLoadedMode,
    getInitialStatData,
  };
}
