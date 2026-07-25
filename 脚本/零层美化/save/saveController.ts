import type { LatestFloorBeautifier } from '../beautify/latestFloorBeautifier';
import type { TangquanLogger } from '../debug/logger';
import type { TangquanLoadingOverlay } from '../ui/loadingOverlay';
import {
  captureCurrentChatSnapshot,
  createEmptyChatSnapshot,
  restoreChatSnapshot,
  type TangquanChatSnapshot,
} from './chatSnapshot';
import { getSaveRuntime, patchSaveRuntime, type TangquanSaveRuntime } from './saveRuntime';
import type {
  TangquanUserGenderKey,
  TangquanUserProfileInput,
  TangquanUserProfileWorldbookService,
} from './userProfileWorldbook';
import {
  type TangquanLoadedSave,
  type TangquanPlayMode,
  type TangquanSaveExport,
  type TangquanSaveImport,
  type TangquanSaveInspection,
  type TangquanSavePayload,
  type TangquanSaveSlotMeta,
  type TangquanWorldbookSaveService,
} from './worldbookSave';

export type TangquanFullSaveController = {
  getRuntime: () => TangquanSaveRuntime;
  reconcileRuntime: () => Promise<{
    runtime: TangquanSaveRuntime;
    slotIds: string[];
    cleared: boolean;
  }>;
  listSlots: () => Promise<TangquanSaveSlotMeta[]>;
  saveActiveSlot: (dataPatch?: Record<string, unknown>) => Promise<TangquanSaveSlotMeta | null>;
  saveActiveData: (dataPatch: Record<string, unknown>) => Promise<TangquanSaveSlotMeta | null>;
  saveActiveDataQuiet: (dataPatch: Record<string, unknown>) => Promise<TangquanSaveSlotMeta | null>;
  saveCurrentToSlot: (
    slotId: string,
    payload: Omit<Partial<TangquanSavePayload>, 'version' | 'updatedAt'>,
  ) => Promise<TangquanSaveSlotMeta>;
  loadSlot: (slotId: string) => Promise<TangquanLoadedSave>;
  readSlotData: (slotId: string) => Promise<TangquanLoadedSave>;
  startNewSlot: (
    mode: Exclude<TangquanPlayMode, '未选择'>,
    label: string,
    data?: Record<string, unknown>,
    userProfile?: TangquanUserProfileInput,
  ) => Promise<TangquanSaveSlotMeta>;
  startSlot: (
    slotId: string,
    mode: Exclude<TangquanPlayMode, '未选择'>,
    label: string,
    data?: Record<string, unknown>,
    userProfile?: TangquanUserProfileInput,
  ) => Promise<TangquanSaveSlotMeta>;
  saveCurrentAsSlot: (
    slotId: string,
    label?: string,
    dataPatch?: Record<string, unknown>,
  ) => Promise<TangquanSaveSlotMeta>;
  inspectSlot: (slotId: string) => Promise<TangquanSaveInspection>;
  repairSlot: (slotId: string) => Promise<TangquanSaveSlotMeta>;
  exportSlot: (slotId: string) => Promise<TangquanSaveExport>;
  importSlot: (slotId: string, content: string) => Promise<TangquanSaveImport>;
  deleteSlot: (slotId: string) => Promise<void>;
};

type SaveControllerOptions = {
  worldbookSave: TangquanWorldbookSaveService;
  loading: TangquanLoadingOverlay;
  log: TangquanLogger;
  beautifier?: LatestFloorBeautifier;
  userProfileWorldbook?: TangquanUserProfileWorldbookService;
};

function makeSlotId(mode: TangquanPlayMode): string {
  const prefix = mode === '老板' ? 'boss' : mode === '游客' ? 'customer' : mode === '服务员' ? 'waiter' : 'save';
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractSnapshot(loaded: TangquanLoadedSave): TangquanChatSnapshot {
  const snapshot = loaded.payload.data.chatSnapshot;
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error(`Save thiếu snapshot chat: ${loaded.meta.slotId}`);
  }
  return snapshot as TangquanChatSnapshot;
}

function mergeSnapshotIntoPayload(
  payload: Omit<Partial<TangquanSavePayload>, 'version' | 'updatedAt'>,
  snapshot: TangquanChatSnapshot,
) {
  return {
    ...payload,
    data: {
      ...(payload.data ?? {}),
      chatSnapshot: snapshot,
    },
  };
}

function mergeSaveData(
  previousData: Record<string, unknown> | undefined,
  dataPatch: Record<string, unknown>,
): Record<string, unknown> {
  return _.mergeWith({}, previousData ?? {}, dataPatch, (_oldValue, newValue) => {
    if (Array.isArray(newValue)) {
      return _.cloneDeep(newValue);
    }
    return undefined;
  });
}

const USER_GENDER_KEYS: readonly TangquanUserGenderKey[] = ['男', '女', '扶她', '男娘', '双性', '无性', '自定义'];

function isUserGenderKey(value: unknown): value is TangquanUserGenderKey {
  return typeof value === 'string' && USER_GENDER_KEYS.includes(value as TangquanUserGenderKey);
}

function textFromRecord(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function extractUserProfileFromPayload(payload: TangquanSavePayload): TangquanUserProfileInput | null {
  const userInfo = payload.data['用户信息'];
  if (!userInfo || typeof userInfo !== 'object' || Array.isArray(userInfo)) {
    return null;
  }

  const record = userInfo as Record<string, unknown>;
  const name = textFromRecord(record, '姓名');
  const genderLabel = textFromRecord(record, '性别');
  const genderOption = record['性别选项'];
  const description = textFromRecord(record, '自设') || textFromRecord(record, '人物设定');

  if (!name) {
    return null;
  }

  if (isUserGenderKey(genderOption)) {
    return {
      name,
      genderKey: genderOption,
      genderText: genderOption === '自定义' ? genderLabel : '',
      description,
    };
  }

  if (isUserGenderKey(genderLabel)) {
    return {
      name,
      genderKey: genderLabel,
      genderText: '',
      description,
    };
  }

  return {
    name,
    genderKey: '自定义',
    genderText: genderLabel || 'Tùy chỉnh',
    description,
  };
}

export function createFullSaveController(options: SaveControllerOptions): TangquanFullSaveController {
  let saveQueue: Promise<void> = Promise.resolve();
  let saveSequence = 0;
  let savePending = 0;

  function enqueueSave<T>(label: string, task: () => Promise<T>): Promise<T> {
    const sequence = ++saveSequence;
    const queuedAt = Date.now();
    savePending += 1;
    options.log.info('Hàng đợi save đầy đủ', 'Đã đưa nhiệm vụ lưu vào hàng đợi', { sequence, label, pending: savePending });
    const operation = saveQueue.then(async () => {
      options.log.info('Hàng đợi save đầy đủ', 'Nhiệm vụ lưu bắt đầu', {
        sequence,
        label,
        pending: savePending,
        waitMs: Date.now() - queuedAt,
      });
      return task();
    });
    saveQueue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation.finally(() => {
      savePending = Math.max(0, savePending - 1);
      options.log.info('Hàng đợi save đầy đủ', 'Nhiệm vụ lưu kết thúc', {
        sequence,
        label,
        pending: savePending,
        elapsedMs: Date.now() - queuedAt,
      });
    });
  }

  async function reconcileRuntime(): Promise<{
    runtime: TangquanSaveRuntime;
    slotIds: string[];
    cleared: boolean;
  }> {
    return options.loading.run('Kiểm tra save', async overlay => {
      overlay.update(8, 'Kiểm tra save', 'Đang đối chiếu save hiện tại');
      const slots = await options.worldbookSave.listSlots();
      const slotIds = slots.map(slot => slot.slotId);
      const current = getSaveRuntime();
      if (!current.activeSlotId) {
        overlay.update(100, 'Kiểm tra save', 'Trạng thái save bình thường');
        return { runtime: current, slotIds, cleared: false };
      }

      const activeSlot = slots.find(slot => slot.slotId === current.activeSlotId);
      if (!activeSlot) {
        const runtime = patchSaveRuntime({
          activeSlotId: '',
          activeMode: '未选择',
          lastSwitchAt: new Date().toISOString(),
        });
        options.log.warn('Save đầy đủ', 'Save đang chạy hiện tại không còn tồn tại, đã xóa trạng thái không hợp lệ', {
          activeSlotId: current.activeSlotId,
          slotIds,
        });
        overlay.update(100, 'Kiểm tra save', 'Đã xóa trạng thái save không hợp lệ');
        return { runtime, slotIds, cleared: true };
      }

      if (current.activeMode !== activeSlot.mode) {
        const runtime = patchSaveRuntime({
          activeMode: activeSlot.mode,
          lastSwitchAt: new Date().toISOString(),
        });
        options.log.warn('Save đầy đủ', 'Chế độ chơi hiện tại đã được sửa theo thông tin save', {
          activeSlotId: current.activeSlotId,
          from: current.activeMode,
          to: activeSlot.mode,
        });
        overlay.update(100, 'Kiểm tra save', 'Đã sửa chế độ chơi hiện tại');
        return { runtime, slotIds, cleared: false };
      }

      overlay.update(100, 'Kiểm tra save', 'Trạng thái save bình thường');
      return { runtime: current, slotIds, cleared: false };
    });
  }

  async function listSlots(): Promise<TangquanSaveSlotMeta[]> {
    return options.loading.run('Xem save', async overlay => {
      options.log.info('Save đầy đủ', 'Bắt đầu đọc danh sách save');
      overlay.update(12, 'Xem save', 'Đang xác nhận các save hiện có');
      const slots = await options.worldbookSave.listSlots();
      overlay.update(100, 'Xem save', `Tìm thấy ${slots.length} save`);
      options.log.info('Save đầy đủ', 'Đọc danh sách save hoàn tất', { count: slots.length, slots });
      return slots;
    });
  }

  async function writeCurrentToSlot(
    slotId: string,
    payload: Omit<Partial<TangquanSavePayload>, 'version' | 'updatedAt'>,
    quiet: boolean,
  ): Promise<TangquanSaveSlotMeta> {
    options.log.warn('Save đầy đủ', 'Chuẩn bị lưu chat hiện tại vào save', {
      slotId,
      mode: payload.mode,
      label: payload.label,
      quiet,
    });
    const snapshot = captureCurrentChatSnapshot({ loading: quiet ? undefined : options.loading, log: options.log });
    if (!quiet) {
      options.loading.update(34, 'Lưu save', 'Đang chuẩn bị snapshot chat hiện tại');
    }
    const mergedPayload = mergeSnapshotIntoPayload(payload, snapshot);
    if (!quiet) {
      options.loading.update(56, 'Lưu save', 'Đang ghi dữ liệu save');
    }
    const meta = quiet
      ? await options.worldbookSave.saveSlotQuiet(slotId, mergedPayload)
      : await options.worldbookSave.saveSlot(slotId, mergedPayload);
    options.log.info('Save đầy đủ', 'Chat hiện tại đã được lưu vào save', {
      slotId,
      messageCount: snapshot.messageCount,
      checksum: snapshot.checksum,
      meta,
    });
    return meta;
  }

  async function saveCurrentToSlot(
    slotId: string,
    payload: Omit<Partial<TangquanSavePayload>, 'version' | 'updatedAt'>,
  ): Promise<TangquanSaveSlotMeta> {
    return enqueueSave(`Lưu ${slotId}`, () => writeCurrentToSlot(slotId, payload, false));
  }

  async function saveRuntimeActiveSlot(
    runtime: TangquanSaveRuntime,
    dataPatch: Record<string, unknown> = {},
    quiet = false,
  ): Promise<TangquanSaveSlotMeta | null> {
    if (!runtime.activeSlotId) {
      options.log.warn('Save đầy đủ', 'Hiện không có save nào đang kích hoạt, bỏ qua lưu save hiện tại');
      return null;
    }

    if (!quiet) {
      options.loading.update(8, 'Lưu save hiện tại', 'Đang xác nhận save hiện tại');
    }
    let previous: TangquanLoadedSave | null = null;
    try {
      previous = quiet
        ? await options.worldbookSave.readSlotData(runtime.activeSlotId)
        : await options.worldbookSave.loadSlot(runtime.activeSlotId);
    } catch (error) {
      options.log.warn('Save đầy đủ', 'Đọc dữ liệu cũ của save hiện tại thất bại, sẽ lưu theo trạng thái đang chạy', {
        activeSlotId: runtime.activeSlotId,
        error: String(error),
      });
    }

    const label = previous?.payload.label || previous?.meta.label || `Save ${runtime.activeMode}`;
    const mode = previous?.payload.mode || runtime.activeMode;
    const data = mergeSaveData(previous?.payload.data, dataPatch);
    return writeCurrentToSlot(runtime.activeSlotId, { mode, label, data }, quiet);
  }

  async function saveActiveSlot(dataPatch: Record<string, unknown> = {}): Promise<TangquanSaveSlotMeta | null> {
    return enqueueSave('Lưu save hiện tại', () =>
      options.loading.run('Lưu save hiện tại', async () => saveRuntimeActiveSlot(getSaveRuntime(), dataPatch)),
    );
  }

  async function saveActiveData(dataPatch: Record<string, unknown>): Promise<TangquanSaveSlotMeta | null> {
    return enqueueSave('Lưu dữ liệu hiện tại', () =>
      options.loading.run('Lưu save hiện tại', async () => saveRuntimeActiveSlot(getSaveRuntime(), dataPatch)),
    );
  }

  async function saveActiveDataQuiet(dataPatch: Record<string, unknown>): Promise<TangquanSaveSlotMeta | null> {
    return enqueueSave('Tự động lưu dữ liệu hiện tại', () => saveRuntimeActiveSlot(getSaveRuntime(), dataPatch, true));
  }

  async function loadSlot(slotId: string): Promise<TangquanLoadedSave> {
    return options.loading.run('Nạp save', async overlay => {
      const runtime = getSaveRuntime();
      options.log.warn('Save đầy đủ', 'Bắt đầu chuyển save', {
        from: runtime.activeSlotId || 'Chưa kích hoạt',
        to: slotId,
      });

      overlay.update(8, 'Nạp save', 'Đang đọc save mục tiêu');
      const loaded = await options.worldbookSave.loadSlot(slotId);
      const snapshot = extractSnapshot(loaded);
      options.log.info('Save đầy đủ', 'Đọc save mục tiêu hoàn tất', {
        slotId,
        mode: loaded.meta.mode,
        messageCount: snapshot.messageCount,
        checksum: snapshot.checksum,
      });

      await restoreChatSnapshot(snapshot, { loading: overlay, log: options.log });
      overlay.update(92, 'Nạp save', 'Đang đồng bộ thông tin người dùng');
      const userProfile = extractUserProfileFromPayload(loaded.payload);
      if (userProfile) {
        await options.userProfileWorldbook?.upsertProfile(loaded.meta.slotId, userProfile);
      } else {
        await options.userProfileWorldbook?.activateSlot(loaded.meta.slotId);
      }
      patchSaveRuntime({
        activeSlotId: loaded.meta.slotId,
        activeMode: loaded.meta.mode,
        lastSwitchAt: new Date().toISOString(),
      });
      options.beautifier?.applyNow('Nạp save hoàn tất');
      overlay.update(100, 'Nạp save', 'Hoàn tất');
      options.log.info('Save đầy đủ', 'Chuyển save hoàn tất', {
        activeSlotId: loaded.meta.slotId,
        mode: loaded.meta.mode,
      });
      return loaded;
    });
  }

  async function readSlotData(slotId: string): Promise<TangquanLoadedSave> {
    options.log.info('Save đầy đủ', 'Đọc dữ liệu save âm thầm', { slotId });
    return options.worldbookSave.readSlotData(slotId);
  }

  async function startNewSlot(
    mode: Exclude<TangquanPlayMode, '未选择'>,
    label: string,
    data: Record<string, unknown> = {},
    userProfile?: TangquanUserProfileInput,
  ): Promise<TangquanSaveSlotMeta> {
    return enqueueSave('Tạo save mới', () =>
      options.loading.run('Bắt đầu trò chơi', async overlay => {
        const runtime = getSaveRuntime();
        options.log.warn('Save đầy đủ', 'Chuẩn bị bắt đầu save mới', {
          previousSlotId: runtime.activeSlotId || 'Chưa kích hoạt',
          mode,
          label,
        });

        const slotId = makeSlotId(mode);
        const snapshot = createEmptyChatSnapshot();
        overlay.update(42, 'Bắt đầu trò chơi', 'Đang tạo save mới');
        const meta = await options.worldbookSave.saveSlot(slotId, {
          mode,
          label,
          data: {
            ...data,
            chatSnapshot: snapshot,
          },
        });
        overlay.update(58, 'Bắt đầu trò chơi', 'Đang ghi thông tin người dùng');
        if (userProfile) {
          await options.userProfileWorldbook?.upsertProfile(slotId, userProfile);
        } else {
          await options.userProfileWorldbook?.activateSlot(slotId);
        }

        overlay.update(66, 'Bắt đầu trò chơi', 'Đang xóa chat cũ');
        await restoreChatSnapshot(snapshot, { loading: overlay, log: options.log });
        patchSaveRuntime({
          activeSlotId: slotId,
          activeMode: mode,
          lastSwitchAt: new Date().toISOString(),
        });
        options.beautifier?.applyNow('Save mới bắt đầu');
        overlay.update(100, 'Bắt đầu trò chơi', 'Hoàn tất');
        options.log.info('Save đầy đủ', 'Tạo save mới hoàn tất', { slotId, mode, label, meta });
        return meta;
      }),
    );
  }

  async function startSlot(
    slotId: string,
    mode: Exclude<TangquanPlayMode, '未选择'>,
    label: string,
    data: Record<string, unknown> = {},
    userProfile?: TangquanUserProfileInput,
  ): Promise<TangquanSaveSlotMeta> {
    return enqueueSave(`Tạo save cố định ${slotId}`, () =>
      options.loading.run('Bắt đầu trò chơi', async overlay => {
        const runtime = getSaveRuntime();
        options.log.warn('Save đầy đủ', 'Chuẩn bị tạo save cố định mới', {
          previousSlotId: runtime.activeSlotId || 'Chưa kích hoạt',
          slotId,
          mode,
          label,
        });

        const snapshot = createEmptyChatSnapshot();
        overlay.update(38, 'Bắt đầu trò chơi', 'Đang ghi save');
        const meta = await options.worldbookSave.saveSlot(slotId, {
          mode,
          label,
          data: {
            ...data,
            chatSnapshot: snapshot,
          },
        });
        overlay.update(58, 'Bắt đầu trò chơi', 'Đang ghi thông tin người dùng');
        if (userProfile) {
          await options.userProfileWorldbook?.upsertProfile(slotId, userProfile);
        } else {
          await options.userProfileWorldbook?.activateSlot(slotId);
        }

        overlay.update(68, 'Bắt đầu trò chơi', 'Đang xóa chat cũ');
        await restoreChatSnapshot(snapshot, { loading: overlay, log: options.log });
        patchSaveRuntime({
          activeSlotId: slotId,
          activeMode: mode,
          lastSwitchAt: new Date().toISOString(),
        });
        options.beautifier?.applyNow('Save cố định bắt đầu');
        overlay.update(100, 'Bắt đầu trò chơi', 'Hoàn tất');
        options.log.info('Save đầy đủ', 'Tạo save cố định hoàn tất', { slotId, mode, label, meta });
        return meta;
      }),
    );
  }

  async function saveCurrentAsSlot(
    slotId: string,
    label?: string,
    dataPatch: Record<string, unknown> = {},
  ): Promise<TangquanSaveSlotMeta> {
    return enqueueSave(`Lưu thành ${slotId}`, () =>
      options.loading.run('Lưu save', async overlay => {
        const runtime = getSaveRuntime();
        if (runtime.activeMode === '未选择') {
          throw new Error('Hiện chưa bắt đầu trò chơi, không thể lưu');
        }

        overlay.update(8, 'Lưu save', 'Đang đọc thông tin save gốc');
        let previous: TangquanLoadedSave | null = null;
        try {
          previous = await options.worldbookSave.loadSlot(slotId);
        } catch (error) {
          options.log.warn('Save đầy đủ', 'Save mục tiêu không có dữ liệu kế thừa, sẽ tạo save mới', { slotId, error: String(error) });
        }

        const meta = await writeCurrentToSlot(
          slotId,
          {
            mode: runtime.activeMode,
            label: label || previous?.payload.label || previous?.meta.label || `Save ${runtime.activeMode}`,
            data: mergeSaveData(previous?.payload.data, dataPatch),
          },
          false,
        );
        if (runtime.activeSlotId && runtime.activeSlotId !== slotId) {
          overlay.update(82, 'Lưu save', 'Đang đồng bộ thông tin người dùng');
          await options.userProfileWorldbook?.cloneProfileToSlot(runtime.activeSlotId, slotId);
        } else {
          await options.userProfileWorldbook?.activateSlot(slotId);
        }
        patchSaveRuntime({
          activeSlotId: slotId,
          activeMode: runtime.activeMode,
          lastSwitchAt: new Date().toISOString(),
        });
        overlay.update(100, 'Lưu save', 'Hoàn tất');
        options.log.info('Save đầy đủ', 'Save hiện tại đã được lưu thành save cố định', { slotId, meta });
        return meta;
      }),
    );
  }

  async function inspectSlot(slotId: string): Promise<TangquanSaveInspection> {
    return options.worldbookSave.inspectSlot(slotId);
  }

  async function repairSlot(slotId: string): Promise<TangquanSaveSlotMeta> {
    const meta = await options.worldbookSave.repairSlot(slotId);
    options.log.warn('Save đầy đủ', 'Save đã được sửa chữa', { slotId, meta });
    return meta;
  }

  async function exportSlot(slotId: string): Promise<TangquanSaveExport> {
    return options.worldbookSave.exportSlot(slotId);
  }

  async function importSlot(slotId: string, content: string): Promise<TangquanSaveImport> {
    const imported = await options.worldbookSave.importSlot(slotId, content);
    const userProfile = extractUserProfileFromPayload(imported.payload);
    if (userProfile) {
      await options.userProfileWorldbook?.upsertProfile(slotId, userProfile);
    }
    await options.userProfileWorldbook?.activateSlot(getSaveRuntime().activeSlotId || '');
    options.log.warn('Save đầy đủ', 'Save đã được nhập vào save cố định', {
      slotId,
      mode: imported.meta.mode,
      label: imported.meta.label,
      hasUserProfile: Boolean(userProfile),
    });
    return imported;
  }

  async function deleteSlot(slotId: string): Promise<void> {
    return options.loading.run('Xóa save', async overlay => {
      overlay.update(28, 'Xóa save', 'Đang xóa dữ liệu save');
      await options.worldbookSave.deleteSlot(slotId);
      overlay.update(62, 'Xóa save', 'Đang xóa thông tin người dùng');
      await options.userProfileWorldbook?.deleteProfile(slotId);
      const runtime = getSaveRuntime();
      if (runtime.activeSlotId === slotId) {
        patchSaveRuntime({
          activeSlotId: '',
          activeMode: '未选择',
          lastSwitchAt: new Date().toISOString(),
        });
        await options.userProfileWorldbook?.disableAll();
      }
      overlay.update(100, 'Xóa save', 'Hoàn tất');
      options.log.warn('Save đầy đủ', 'Save đã bị xóa', { slotId });
    });
  }

  return {
    getRuntime: getSaveRuntime,
    reconcileRuntime,
    listSlots,
    saveActiveSlot,
    saveActiveData,
    saveActiveDataQuiet,
    saveCurrentToSlot,
    loadSlot,
    readSlotData,
    startNewSlot,
    startSlot,
    saveCurrentAsSlot,
    inspectSlot,
    repairSlot,
    exportSlot,
    importSlot,
    deleteSlot,
  };
}
