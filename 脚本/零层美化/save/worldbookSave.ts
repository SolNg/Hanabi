import { z } from 'zod';
import type { TangquanLogger } from '../debug/logger';
import type { TangquanLoadingOverlay } from '../ui/loadingOverlay';
import { createEmptyChatSnapshot } from './chatSnapshot';

export type TangquanPlayMode = '未选择' | '老板' | '游客' | '服务员';

export type TangquanSavePayload = {
  version: 1;
  mode: TangquanPlayMode;
  label: string;
  updatedAt: string;
  data: Record<string, unknown>;
};

export type TangquanSaveSlotMeta = {
  slotId: string;
  label: string;
  mode: TangquanPlayMode;
  updatedAt: string;
  version: 1;
  chunkCount: number;
  byteLength: number;
  checksum: string;
};

export type TangquanLoadedSave = {
  worldbookName: string;
  meta: TangquanSaveSlotMeta;
  payload: TangquanSavePayload;
};

export type TangquanSaveInspectionIssue = {
  level: 'info' | 'warn' | 'error';
  message: string;
  detail?: unknown;
};

export type TangquanSaveInspection = {
  slotId: string;
  ok: boolean;
  repairable: boolean;
  worldbookName: string;
  meta: TangquanSaveSlotMeta | null;
  chunkCount: number;
  byteLength: number;
  checksum: string;
  messageCount: number;
  issues: TangquanSaveInspectionIssue[];
};

export type TangquanSaveExport = {
  filename: string;
  mime: 'application/json';
  content: string;
  meta: TangquanSaveSlotMeta;
};

export type TangquanSaveImport = {
  meta: TangquanSaveSlotMeta;
  payload: TangquanSavePayload;
};

export type TangquanWorldbookSaveService = {
  resolveWorldbookName: () => Promise<string>;
  listSlots: () => Promise<TangquanSaveSlotMeta[]>;
  saveSlot: (
    slotId: string,
    payload: Omit<Partial<TangquanSavePayload>, 'version' | 'updatedAt'>,
  ) => Promise<TangquanSaveSlotMeta>;
  saveSlotQuiet: (
    slotId: string,
    payload: Omit<Partial<TangquanSavePayload>, 'version' | 'updatedAt'>,
  ) => Promise<TangquanSaveSlotMeta>;
  loadSlot: (slotId: string) => Promise<TangquanLoadedSave>;
  readSlotData: (slotId: string) => Promise<TangquanLoadedSave>;
  inspectSlot: (slotId: string) => Promise<TangquanSaveInspection>;
  repairSlot: (slotId: string) => Promise<TangquanSaveSlotMeta>;
  exportSlot: (slotId: string) => Promise<TangquanSaveExport>;
  importSlot: (slotId: string, content: string) => Promise<TangquanSaveImport>;
  deleteSlot: (slotId: string) => Promise<void>;
};

type SaveServiceOptions = {
  loading?: TangquanLoadingOverlay;
  log?: TangquanLogger;
  worldbookName?: string;
};

const SAVE_SOURCE = 'tangquan-save-v1';
const SAVE_STAGING_SOURCE = 'tangquan-save-v1-staging';
const DEFAULT_WORLDBOOK_NAME = 'Hoa_Chưa_Nở_Lưu_trữ';
const CHUNK_SIZE = 22000;

const PlayModeSchema = z.enum(['未选择', '老板', '游客', '服务员']).catch('未选择');

const SaveSlotMetaSchema = z.object({
  slotId: z.string(),
  label: z.string(),
  mode: PlayModeSchema,
  updatedAt: z.string(),
  version: z.literal(1),
  chunkCount: z.coerce.number(),
  byteLength: z.coerce.number(),
  checksum: z.string(),
});

const SavePayloadSchema = z.object({
  version: z.literal(1),
  mode: PlayModeSchema,
  label: z.string(),
  updatedAt: z.string(),
  data: z.record(z.string(), z.unknown()),
});

const ExportedSaveSchema = z.object({
  payload: SavePayloadSchema,
});

function makeEntryName(slotId: string, kind: 'meta' | 'chunk', part?: number): string {
  if (kind === 'meta') {
    return `[Save Hoa Chưa Nở] ${slotId} chỉ mục`;
  }
  return `[Save Hoa Chưa Nở] ${slotId} phân đoạn ${String(part ?? 0).padStart(3, '0')}`;
}

function makeChecksum(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function makeChatSnapshotChecksum(messages: unknown[]): string {
  return makeChecksum(
    JSON.stringify(
      messages.map(message => {
        const record = typeof message === 'object' && message !== null ? (message as Record<string, unknown>) : {};
        return {
          role: record.role,
          name: record.name,
          hidden: record.is_hidden,
          swipe_id: record.swipe_id,
          swipes: record.swipes,
          data: record.data,
          extra: record.extra,
          swipes_data: record.swipes_data,
          swipes_info: record.swipes_info,
        };
      }),
    ),
  );
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function splitText(text: string): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += CHUNK_SIZE) {
    chunks.push(text.slice(index, index + CHUNK_SIZE));
  }
  return chunks.length > 0 ? chunks : [''];
}

function makeDisabledEntry(
  name: string,
  content: string,
  extra: Record<string, unknown>,
  source = SAVE_SOURCE,
): TypeFest.PartialDeep<WorldbookEntry> {
  return {
    name,
    enabled: false,
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'after_author_note',
      role: 'system',
      depth: 0,
      order: 10000,
    },
    content,
    probability: 0,
    recursion: {
      prevent_incoming: true,
      prevent_outgoing: true,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
    extra: {
      source,
      ...extra,
    },
  };
}

function isStagingEntry(entry: WorldbookEntry, slotId?: string, transactionId?: string): boolean {
  if (entry.extra?.source !== SAVE_STAGING_SOURCE) {
    return false;
  }
  if (slotId !== undefined && entry.extra.slotId !== slotId) {
    return false;
  }
  if (transactionId !== undefined && entry.extra.transactionId !== transactionId) {
    return false;
  }
  return true;
}

function isSlotStorageEntry(entry: WorldbookEntry, slotId: string): boolean {
  return isSaveEntry(entry, slotId) || isStagingEntry(entry, slotId);
}

function isSaveEntry(entry: WorldbookEntry, slotId?: string): boolean {
  if (entry.extra?.source !== SAVE_SOURCE) {
    return false;
  }
  if (slotId === undefined) {
    return true;
  }
  return entry.extra.slotId === slotId;
}

function parseMeta(entry: WorldbookEntry): TangquanSaveSlotMeta | null {
  try {
    return SaveSlotMetaSchema.parse(JSON.parse(entry.content));
  } catch {
    return null;
  }
}

function formatDateForFilename(value: string): string {
  return value.replaceAll(/[^0-9]/g, '').slice(0, 14) || String(Date.now());
}

function parseImportedPayload(content: string): TangquanSavePayload {
  const parsed = JSON.parse(content);
  const exported = ExportedSaveSchema.safeParse(parsed);
  if (exported.success) {
    return exported.data.payload;
  }
  return SavePayloadSchema.parse(parsed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOwnKey(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function inspectPayloadData(payload: TangquanSavePayload, issues: TangquanSaveInspectionIssue[]) {
  if (!isRecord(payload.data['用户信息'])) {
    issues.push({ level: 'warn', message: 'Thiếu thiết lập nhân vật, sau khi nhập có thể không xây dựng lại được entry thông tin người dùng.' });
  }

  if (payload.mode !== '老板') {
    return;
  }

  const frontendData = payload.data['前端数据'];
  if (!isRecord(frontendData)) {
    issues.push({ level: 'error', message: 'Thiếu tiến độ chơi.' });
    return;
  }

  const bossPage = frontendData['老板页面'];
  if (!isRecord(bossPage)) {
    issues.push({ level: 'error', message: 'Thiếu tiến độ kinh doanh.' });
  } else {
    const requiredBossKeys = [
      '资金',
      '员工',
      '项目',
      '人才市场',
      '招聘',
      '基建',
      '建筑',
      '工程',
      '宣传活动',
      '品质投入',
      '员工福利',
      '结算',
      '账本',
    ];
    const missingBossKeys = requiredBossKeys.filter(key => !hasOwnKey(bossPage, key));
    if (missingBossKeys.length > 0) {
      issues.push({
        level: 'warn',
        message: 'Tiến độ kinh doanh thiếu một phần nội dung, sau khi nạp sẽ dùng giá trị mặc định để bổ sung.',
        detail: { missing: missingBossKeys },
      });
    }
  }

  if (!isRecord(frontendData['变量块仓库'])) {
    issues.push({ level: 'warn', message: 'Thiếu bộ nhớ hiện trường, sau khi nạp sẽ sắp xếp lại theo trang hiện tại.' });
  }
}

function normalizePayload(payload: Omit<Partial<TangquanSavePayload>, 'version' | 'updatedAt'>): TangquanSavePayload {
  return SavePayloadSchema.parse({
    version: 1,
    mode: payload.mode ?? '未选择',
    label: payload.label?.trim() || 'Save chưa đặt tên',
    updatedAt: new Date().toISOString(),
    data: payload.data ?? {},
  });
}

export function createWorldbookSaveService(options: SaveServiceOptions = {}): TangquanWorldbookSaveService {
  let resolvingWorldbook: Promise<string> | null = null;
  let writeQueue: Promise<void> = Promise.resolve();
  let writeSequence = 0;
  let writePending = 0;

  function enqueueWrite<T>(label: string, task: () => Promise<T>): Promise<T> {
    const sequence = ++writeSequence;
    const queuedAt = Date.now();
    writePending += 1;
    options.log?.info('Hàng đợi save world book', 'Nhiệm vụ ghi đã đưa vào hàng đợi', { sequence, label, pending: writePending });
    const operation = writeQueue.then(async () => {
      options.log?.info('Hàng đợi save world book', 'Nhiệm vụ ghi bắt đầu', {
        sequence,
        label,
        pending: writePending,
        waitMs: Date.now() - queuedAt,
      });
      return task();
    });
    writeQueue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation.finally(() => {
      writePending = Math.max(0, writePending - 1);
      options.log?.info('Hàng đợi save world book', 'Nhiệm vụ ghi kết thúc', {
        sequence,
        label,
        pending: writePending,
        elapsedMs: Date.now() - queuedAt,
      });
    });
  }

  async function persistWorldbookImmediately(worldbookName: string, reason: string): Promise<void> {
    const rawWorldbook = await SillyTavern.loadWorldInfo(worldbookName);
    if (!rawWorldbook) {
      throw new Error(`Không thể đọc kho save "${worldbookName}"`);
    }
    await SillyTavern.saveWorldInfo(worldbookName, rawWorldbook, true);
    SillyTavern.reloadWorldInfoEditor(worldbookName, false);
    await SillyTavern.updateWorldInfoList();
    options.log?.debug('Save world book', 'Kho save đã ghi ngay xuống ổ đĩa', { worldbookName, reason });
  }

  function getBoundWorldbookName(): string {
    return getChatWorldbookName('current')?.trim() ?? '';
  }

  async function bindAndVerifyWorldbook(worldbookName: string): Promise<string> {
    await rebindChatWorldbook('current', worldbookName);
    const bound = getBoundWorldbookName();
    if (bound !== worldbookName) {
      throw new Error('Kho save đã được tạo, nhưng không thể gắn vào cuộc trò chuyện hiện tại');
    }
    return bound;
  }

  async function resolveWorldbookNameOnce(): Promise<string> {
    const existing = getBoundWorldbookName();
    if (existing) {
      options.log?.debug('Save world book', 'Dùng world book đã gắn với cuộc trò chuyện hiện tại', { worldbookName: existing });
      return existing;
    }

    const preferredName = options.worldbookName?.trim() || DEFAULT_WORLDBOOK_NAME;
    try {
      const created = await getOrCreateChatWorldbook('current', preferredName);
      const bound = getBoundWorldbookName();
      if (bound) {
        options.log?.info('Save world book', 'Đã tạo hoặc gắn world book cho cuộc trò chuyện', { worldbookName: bound });
        return bound;
      }
      const verified = await bindAndVerifyWorldbook(created || preferredName);
      options.log?.info('Save world book', 'Đã bổ sung gắn world book cho cuộc trò chuyện', { worldbookName: verified });
      return verified;
    } catch (primaryError) {
      options.log?.warn('Save world book', 'Tự động tạo kho save thất bại, thử tạo và gắn tường minh', String(primaryError));
    }

    const rebound = getBoundWorldbookName();
    if (rebound) {
      options.log?.info('Save world book', 'Lệnh gọi khác đã hoàn tất gắn kho save', { worldbookName: rebound });
      return rebound;
    }

    try {
      if (!getWorldbookNames().includes(preferredName)) {
        await createWorldbook(preferredName, []);
      }
      const verified = await bindAndVerifyWorldbook(preferredName);
      options.log?.info('Save world book', 'Đã tạo và gắn world book cho cuộc trò chuyện tường minh', { worldbookName: verified });
      return verified;
    } catch (fallbackError) {
      options.log?.error('Save world book', 'Tạo và gắn kho save thất bại', String(fallbackError));
      throw new Error(`Không thể tạo kho save cho cuộc trò chuyện hiện tại: ${String(fallbackError)}`);
    }
  }

  async function resolveWorldbookName(): Promise<string> {
    if (!resolvingWorldbook) {
      resolvingWorldbook = resolveWorldbookNameOnce().finally(() => {
        resolvingWorldbook = null;
      });
    }
    return resolvingWorldbook;
  }

  async function listSlots(): Promise<TangquanSaveSlotMeta[]> {
    const worldbookName = await resolveWorldbookName();
    const worldbook = await getWorldbook(worldbookName);
    const slots = worldbook
      .filter(entry => entry.extra?.source === SAVE_SOURCE && entry.extra.kind === 'meta')
      .map(parseMeta)
      .filter((meta): meta is TangquanSaveSlotMeta => meta !== null)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    options.log?.info('Save world book', 'Đọc danh sách save hoàn tất', { worldbookName, count: slots.length });
    return slots;
  }

  async function saveSlot(
    slotId: string,
    payload: Omit<Partial<TangquanSavePayload>, 'version' | 'updatedAt'>,
  ): Promise<TangquanSaveSlotMeta> {
    return enqueueWrite(
      `Lưu ${slotId}`,
      () =>
        options.loading?.run('Đang lưu', async overlay => {
          overlay.update(12, 'Đang lưu', 'Đang xác nhận vị trí save');
          return writeSlot(slotId, payload, overlay);
        }) ?? writeSlot(slotId, payload),
    );
  }

  async function saveSlotQuiet(
    slotId: string,
    payload: Omit<Partial<TangquanSavePayload>, 'version' | 'updatedAt'>,
  ): Promise<TangquanSaveSlotMeta> {
    return enqueueWrite(`Lưu âm thầm ${slotId}`, () => writeSlot(slotId, payload));
  }

  async function writeSlot(
    slotId: string,
    payload: Omit<Partial<TangquanSavePayload>, 'version' | 'updatedAt'>,
    overlay?: TangquanLoadingOverlay,
  ): Promise<TangquanSaveSlotMeta> {
    const startedAt = Date.now();
    const cleanSlotId = slotId.trim();
    if (!cleanSlotId) {
      throw new Error('Vui lòng chọn một save');
    }

    const worldbookName = await resolveWorldbookName();
    const normalized = normalizePayload(payload);
    const raw = JSON.stringify(normalized);
    const chunks = splitText(raw);
    const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const meta: TangquanSaveSlotMeta = {
      slotId: cleanSlotId,
      label: normalized.label,
      mode: normalized.mode,
      updatedAt: normalized.updatedAt,
      version: 1,
      chunkCount: chunks.length,
      byteLength: byteLength(raw),
      checksum: makeChecksum(raw),
    };
    options.log?.info('Save world book', 'Chuẩn bị ghi save', {
      slotId: cleanSlotId,
      mode: meta.mode,
      chunkCount: meta.chunkCount,
      byteLength: meta.byteLength,
      checksum: meta.checksum,
      transactionId,
    });

    const stagingEntries: TypeFest.PartialDeep<WorldbookEntry>[] = [
      makeDisabledEntry(
        `[Tạm lưu save Hoa Chưa Nở] ${cleanSlotId} ${transactionId} chỉ mục`,
        JSON.stringify(meta),
        {
          kind: 'meta',
          slotId: cleanSlotId,
          transactionId,
        },
        SAVE_STAGING_SOURCE,
      ),
      ...chunks.map((chunk, index) =>
        makeDisabledEntry(
          `[Tạm lưu save Hoa Chưa Nở] ${cleanSlotId} ${transactionId} phân đoạn ${index + 1}`,
          chunk,
          {
            kind: 'chunk',
            slotId: cleanSlotId,
            part: index + 1,
            transactionId,
          },
          SAVE_STAGING_SOURCE,
        ),
      ),
    ];
    let previousWorldbook: WorldbookEntry[] | null = null;
    let phase = 'Đọc save cũ';

    try {
      overlay?.update(30, 'Đang lưu', 'Đang giữ lại save cũ và chuẩn bị phân đoạn mới');
      previousWorldbook = _.cloneDeep(await getWorldbook(worldbookName));

      phase = 'Ghi phân đoạn tạm';
      overlay?.update(46, 'Đang lưu', 'Đang chuẩn bị đầy đủ phân đoạn save mới');
      const entries = stagingEntries;
      const batchSize = 25;
      let written = 0;
      for (let index = 0; index < entries.length; index += batchSize) {
        const batch = entries.slice(index, index + batchSize);
        written += batch.length;
        overlay?.update(
          46 + Math.round((written / entries.length) * 24),
          'Đang lưu',
          `Đang chuẩn bị phân đoạn save mới: ${written}/${entries.length}`,
        );
        await createWorldbookEntries(worldbookName, batch, { render: 'debounced' });
      }

      phase = 'Kiểm tra phân đoạn tạm';
      const stagedWorldbook = await getWorldbook(worldbookName);
      const stagedEntries = stagedWorldbook
        .filter(entry => isStagingEntry(entry, cleanSlotId, transactionId))
        .sort((left, right) => {
          if (left.extra?.kind === 'meta') return -1;
          if (right.extra?.kind === 'meta') return 1;
          return Number(left.extra?.part ?? 0) - Number(right.extra?.part ?? 0);
        });
      if (stagedEntries.length !== stagingEntries.length) {
        throw new Error(`Phân đoạn tạm của save "${cleanSlotId}" không đầy đủ`);
      }

      const stagedChunks = stagedEntries.filter(entry => entry.extra?.kind === 'chunk');
      if (stagedChunks.map(entry => entry.content).join('') !== raw) {
        throw new Error(`Kiểm tra nội dung tạm của save "${cleanSlotId}" thất bại`);
      }

      phase = 'Thay thế nguyên tử save cũ';
      overlay?.update(76, 'Đang lưu', 'Đang thay thế toàn bộ save trong một lần');
      const promotedEntries = stagedEntries.map(entry => {
        const kind = entry.extra?.kind === 'meta' ? 'meta' : 'chunk';
        const part = kind === 'chunk' ? Number(entry.extra?.part ?? 0) : undefined;
        const nextExtra = { ...(entry.extra ?? {}) } as Record<string, unknown>;
        delete nextExtra.transactionId;
        return {
          ...entry,
          name: makeEntryName(cleanSlotId, kind, part),
          extra: {
            ...nextExtra,
            source: SAVE_SOURCE,
            slotId: cleanSlotId,
            kind,
            ...(part === undefined ? {} : { part }),
          },
        } satisfies TypeFest.PartialDeep<WorldbookEntry>;
      });
      const nextWorldbook: TypeFest.PartialDeep<WorldbookEntry>[] = [
        ...stagedWorldbook.filter(entry => !isSlotStorageEntry(entry, cleanSlotId)),
        ...promotedEntries,
      ];
      await replaceWorldbook(worldbookName, nextWorldbook, { render: 'immediate' });

      phase = 'Ghi xuống ổ đĩa';
      overlay?.update(92, 'Đang lưu', 'Đang xác nhận ghi xuống ổ đĩa');
      await persistWorldbookImmediately(worldbookName, `Lưu ${cleanSlotId}`);

      phase = 'Kiểm tra cuối cùng';
      const persisted = await getWorldbook(worldbookName);
      const persistedMetaEntries = persisted.filter(
        entry => isSaveEntry(entry, cleanSlotId) && entry.extra?.kind === 'meta',
      );
      const persistedChunks = persisted
        .filter(entry => isSaveEntry(entry, cleanSlotId) && entry.extra?.kind === 'chunk')
        .sort((left, right) => Number(left.extra?.part ?? 0) - Number(right.extra?.part ?? 0));
      const persistedMeta = persistedMetaEntries.length === 1 ? parseMeta(persistedMetaEntries[0]) : null;
      const persistedRaw = persistedChunks.map(entry => entry.content).join('');
      if (
        !persistedMeta ||
        persistedChunks.length !== chunks.length ||
        persistedRaw !== raw ||
        persistedMeta.checksum !== meta.checksum ||
        makeChecksum(persistedRaw) !== meta.checksum ||
        persisted.some(entry => isStagingEntry(entry, cleanSlotId))
      ) {
        throw new Error(`Kiểm tra ghi save "${cleanSlotId}" thất bại`);
      }

      overlay?.update(100, 'Đang lưu', 'Hoàn tất');
      options.log?.info('Save world book', 'Ghi save hoàn tất', {
        ...meta,
        elapsedMs: Date.now() - startedAt,
        transactionId,
      });
      return meta;
    } catch (error) {
      options.log?.error('Save world book', 'Ghi save thất bại, chuẩn bị khôi phục nội dung trước khi lưu', {
        slotId: cleanSlotId,
        phase,
        chunkCount: meta.chunkCount,
        byteLength: meta.byteLength,
        transactionId,
        elapsedMs: Date.now() - startedAt,
        error: String(error),
      });
      if (previousWorldbook) {
        try {
          await replaceWorldbook(worldbookName, previousWorldbook, { render: 'immediate' });
          await persistWorldbookImmediately(worldbookName, `Rollback lưu thất bại ${cleanSlotId}`);
          options.log?.warn('Save world book', 'Lưu thất bại đã được rollback, save cũ giữ nguyên', {
            slotId: cleanSlotId,
            transactionId,
          });
        } catch (rollbackError) {
          options.log?.error('Save world book', 'Xảy ra lỗi khi khôi phục save cũ', {
            slotId: cleanSlotId,
            transactionId,
            rollbackError: String(rollbackError),
          });
        }
      }
      throw error;
    }
  }

  async function loadSlot(slotId: string): Promise<TangquanLoadedSave> {
    return options.loading?.run('Nạp save', async overlay => readSlot(slotId, overlay)) ?? readSlot(slotId);
  }

  async function readSlotData(slotId: string): Promise<TangquanLoadedSave> {
    return readSlot(slotId);
  }

  async function readSlot(slotId: string, overlay?: TangquanLoadingOverlay): Promise<TangquanLoadedSave> {
    const cleanSlotId = slotId.trim();
    if (!cleanSlotId) {
      throw new Error('Vui lòng chọn một save');
    }

    overlay?.update(12, 'Nạp save', 'Đang tìm kho save');
    const worldbookName = await resolveWorldbookName();

    overlay?.update(28, 'Nạp save', 'Đang xác nhận thông tin save');
    const worldbook = await getWorldbook(worldbookName);
    const slotEntries = worldbook.filter(entry => isSaveEntry(entry, cleanSlotId));
    const metaEntry = slotEntries.find(entry => entry.extra?.kind === 'meta');
    if (!metaEntry) {
      throw new Error(`Không tìm thấy save: ${cleanSlotId}`);
    }

    const meta = parseMeta(metaEntry);
    if (!meta) {
      throw new Error(`Chỉ mục save bị hỏng: ${cleanSlotId}`);
    }

    overlay?.update(48, 'Nạp save', 'Đang chuẩn bị dữ liệu save');
    const chunks = slotEntries
      .filter(entry => entry.extra?.kind === 'chunk')
      .sort((left, right) => Number(left.extra?.part ?? 0) - Number(right.extra?.part ?? 0))
      .map(entry => entry.content);

    if (chunks.length !== meta.chunkCount) {
      throw new Error(`Số lượng phân đoạn save không đúng: cần ${meta.chunkCount}, thực tế ${chunks.length}`);
    }

    overlay?.update(68, 'Nạp save', `Đang kiểm tra phân đoạn: ${chunks.length}/${meta.chunkCount}`);
    const raw = chunks.join('');
    if (makeChecksum(raw) !== meta.checksum) {
      throw new Error(`Kiểm tra save thất bại: ${cleanSlotId}`);
    }

    overlay?.update(84, 'Nạp save', 'Đang phân tích dữ liệu');
    const payload = SavePayloadSchema.parse(JSON.parse(raw));
    overlay?.update(96, 'Nạp save', 'Đang khôi phục tiến độ màn hình');
    options.log?.info('Save world book', 'Nạp save hoàn tất', {
      slotId: meta.slotId,
      mode: meta.mode,
      chunkCount: meta.chunkCount,
      byteLength: meta.byteLength,
      checksum: meta.checksum,
    });
    return {
      worldbookName,
      meta,
      payload,
    };
  }

  async function inspectSlot(slotId: string): Promise<TangquanSaveInspection> {
    return (
      options.loading?.run('Kiểm tra save', async overlay => {
        const cleanSlotId = slotId.trim();
        if (!cleanSlotId) {
          throw new Error('Vui lòng chọn một save');
        }

        const issues: TangquanSaveInspectionIssue[] = [];
        overlay.update(8, 'Kiểm tra save', 'Đang tìm kho save');
        const worldbookName = await resolveWorldbookName();
        overlay.update(20, 'Kiểm tra save', 'Đang đọc entry save');
        const worldbook = await getWorldbook(worldbookName);
        const slotEntries = worldbook.filter(entry => isSaveEntry(entry, cleanSlotId));
        const metaEntries = slotEntries.filter(entry => entry.extra?.kind === 'meta');
        const chunkEntries = slotEntries
          .filter(entry => entry.extra?.kind === 'chunk')
          .sort((left, right) => Number(left.extra?.part ?? 0) - Number(right.extra?.part ?? 0));

        if (slotEntries.length === 0) {
          issues.push({ level: 'error', message: 'Không tìm thấy save này.' });
        }
        if (metaEntries.length === 0) {
          issues.push({ level: 'error', message: 'Thiếu chỉ mục save.' });
        }
        if (metaEntries.length > 1) {
          issues.push({
            level: 'warn',
            message: 'Tồn tại chỉ mục trùng lặp, khi đọc chỉ dùng cái đầu tiên.',
            detail: { count: metaEntries.length },
          });
        }

        overlay.update(38, 'Kiểm tra save', `Đang kiểm tra phân đoạn: ${chunkEntries.length} đoạn`);
        const meta = metaEntries[0] ? parseMeta(metaEntries[0]) : null;
        if (metaEntries[0] && !meta) {
          issues.push({ level: 'error', message: 'JSON chỉ mục save bị hỏng.' });
        }

        const partList = chunkEntries.map(entry => Number(entry.extra?.part ?? 0));
        const duplicateParts = partList.filter((part, index) => partList.indexOf(part) !== index);
        if (duplicateParts.length > 0) {
          issues.push({
            level: 'error',
            message: 'Tồn tại số hiệu phân đoạn trùng lặp.',
            detail: { duplicateParts: _.uniq(duplicateParts) },
          });
        }
        if (meta && chunkEntries.length !== meta.chunkCount) {
          issues.push({
            level: 'error',
            message: 'Số lượng phân đoạn không nhất quán.',
            detail: { expected: meta.chunkCount, actual: chunkEntries.length },
          });
        }
        if (meta) {
          const missingParts = _.range(1, meta.chunkCount + 1).filter(part => !partList.includes(part));
          if (missingParts.length > 0) {
            issues.push({ level: 'error', message: 'Tồn tại phân đoạn bị thiếu.', detail: { missingParts } });
          }
        }

        overlay.update(58, 'Kiểm tra save', 'Đang gộp và kiểm tra nội dung');
        const raw = chunkEntries.map(entry => entry.content).join('');
        const actualChecksum = makeChecksum(raw);
        const actualByteLength = byteLength(raw);
        if (meta && actualChecksum !== meta.checksum) {
          issues.push({
            level: 'error',
            message: 'Mã kiểm tra không khớp.',
            detail: { expected: meta.checksum, actual: actualChecksum },
          });
        }
        if (meta && actualByteLength !== meta.byteLength) {
          issues.push({
            level: 'warn',
            message: 'Độ dài byte không khớp.',
            detail: { expected: meta.byteLength, actual: actualByteLength },
          });
        }

        let messageCount = 0;
        let repairable = false;
        overlay.update(76, 'Kiểm tra save', 'Đang phân tích nội dung save');
        try {
          const payload = SavePayloadSchema.parse(JSON.parse(raw));
          inspectPayloadData(payload, issues);
          const snapshot = payload.data.chatSnapshot as
            | { messageCount?: unknown; lastMessageId?: unknown; messages?: unknown }
            | undefined;
          const messages = Array.isArray(snapshot?.messages) ? snapshot.messages : [];
          messageCount = messages.length;
          if (!snapshot || typeof snapshot !== 'object') {
            issues.push({ level: 'error', message: 'Thiếu snapshot chat.' });
            repairable = true;
          } else if (!Array.isArray(snapshot.messages)) {
            issues.push({ level: 'error', message: 'Danh sách tầng chat bị hỏng, có thể tự động xây dựng lại snapshot trống.' });
            repairable = true;
          } else {
            if (Number(snapshot.messageCount ?? 0) !== messages.length) {
              issues.push({
                level: 'warn',
                message: 'Ghi nhận số lượng tầng không nhất quán, có thể tự động xây dựng lại chỉ mục.',
                detail: { expected: snapshot.messageCount, actual: messages.length },
              });
              repairable = true;
            }
            if (Number(snapshot.lastMessageId ?? -1) !== messages.length - 1) {
              issues.push({
                level: 'warn',
                message: 'Số hiệu tầng cuối cùng không nhất quán, có thể tự động xây dựng lại chỉ mục.',
                detail: { expected: snapshot.lastMessageId, actual: messages.length - 1 },
              });
              repairable = true;
            }
          }
          if (meta && (actualChecksum !== meta.checksum || actualByteLength !== meta.byteLength)) {
            repairable = true;
          }
        } catch (error) {
          issues.push({ level: 'error', message: 'Không thể phân tích nội dung save.', detail: String(error) });
        }

        if (issues.length === 0) {
          issues.push({ level: 'info', message: 'Kiểm tra save đã đạt.' });
        }

        const ok = issues.every(issue => issue.level !== 'error');
        overlay.update(100, 'Kiểm tra save', ok ? 'Kiểm tra đạt' : 'Phát hiện bất thường');
        const result: TangquanSaveInspection = {
          slotId: cleanSlotId,
          ok,
          repairable,
          worldbookName,
          meta,
          chunkCount: chunkEntries.length,
          byteLength: actualByteLength,
          checksum: actualChecksum,
          messageCount,
          issues,
        };
        options.log?.info('Save world book', 'Kiểm tra save hoàn tất', result);
        return result;
      }) ?? Promise.reject(new Error('Lớp phủ tải chưa được khởi tạo'))
    );
  }

  async function exportSlot(slotId: string): Promise<TangquanSaveExport> {
    return (
      options.loading?.run('Xuất save', async overlay => {
        overlay.update(12, 'Xuất save', 'Đang đọc save');
        const loaded = await readSlot(slotId, overlay);
        overlay.update(86, 'Xuất save', 'Đang tạo tệp xuất');
        const content = JSON.stringify(
          {
            exportedBy: 'Hoa Chưa Nở',
            exportedAt: new Date().toISOString(),
            meta: loaded.meta,
            payload: loaded.payload,
          },
          null,
          2,
        );
        const filename = `hoa-chua-no-save-${loaded.meta.slotId}-${loaded.meta.mode}-${formatDateForFilename(loaded.meta.updatedAt)}.json`;
        overlay.update(100, 'Xuất save', 'Hoàn tất');
        options.log?.info('Save world book', 'Xuất save hoàn tất', {
          slotId: loaded.meta.slotId,
          byteLength: byteLength(content),
        });
        return {
          filename,
          mime: 'application/json',
          content,
          meta: loaded.meta,
        };
      }) ?? Promise.reject(new Error('Lớp phủ tải chưa được khởi tạo'))
    );
  }

  async function importSlot(slotId: string, content: string): Promise<TangquanSaveImport> {
    return enqueueWrite(
      `Nhập ${slotId}`,
      () =>
        options.loading?.run('Nhập save', async overlay => {
          const cleanSlotId = slotId.trim();
          if (!cleanSlotId) {
            throw new Error('Vui lòng chọn một save');
          }

          overlay.update(12, 'Nhập save', 'Đang đọc tệp nhập');
          const importedPayload = parseImportedPayload(content);
          overlay.update(42, 'Nhập save', 'Đang kiểm tra nội dung save');
          const meta = await writeSlot(
            cleanSlotId,
            {
              mode: importedPayload.mode,
              label: importedPayload.label,
              data: importedPayload.data,
            },
            overlay,
          );
          const payload: TangquanSavePayload = {
            version: 1,
            mode: importedPayload.mode,
            label: importedPayload.label,
            updatedAt: meta.updatedAt,
            data: importedPayload.data,
          };
          overlay.update(100, 'Nhập save', 'Hoàn tất');
          options.log?.warn('Save world book', 'Nhập save hoàn tất', { slotId: cleanSlotId, meta });
          return { meta, payload };
        }) ?? Promise.reject(new Error('Lớp phủ tải chưa được khởi tạo')),
    );
  }

  async function repairSlot(slotId: string): Promise<TangquanSaveSlotMeta> {
    return enqueueWrite(
      `Sửa chữa ${slotId}`,
      () =>
        options.loading?.run('Sửa chữa save', async overlay => {
          const cleanSlotId = slotId.trim();
          if (!cleanSlotId) {
            throw new Error('Vui lòng chọn một save');
          }

          overlay.update(10, 'Sửa chữa save', 'Đang đọc phân đoạn save');
          const worldbookName = await resolveWorldbookName();
          const worldbook = await getWorldbook(worldbookName);
          const chunkEntries = worldbook
            .filter(entry => isSaveEntry(entry, cleanSlotId) && entry.extra?.kind === 'chunk')
            .sort((left, right) => Number(left.extra?.part ?? 0) - Number(right.extra?.part ?? 0));

          if (chunkEntries.length === 0) {
            throw new Error('Không có phân đoạn save nào để sửa chữa');
          }

          overlay.update(32, 'Sửa chữa save', `Đang gộp phân đoạn: ${chunkEntries.length} đoạn`);
          const raw = chunkEntries.map(entry => entry.content).join('');
          const payload = SavePayloadSchema.parse(JSON.parse(raw));

          overlay.update(54, 'Sửa chữa save', 'Đang xây dựng lại chỉ mục snapshot chat');
          const snapshot = payload.data.chatSnapshot;
          if (
            !snapshot ||
            typeof snapshot !== 'object' ||
            !Array.isArray((snapshot as Record<string, unknown>).messages)
          ) {
            payload.data.chatSnapshot = createEmptyChatSnapshot();
          } else {
            const snapshotRecord = snapshot as Record<string, unknown>;
            const messages = snapshotRecord.messages as unknown[];
            snapshotRecord.version = 1;
            snapshotRecord.messageCount = messages.length;
            snapshotRecord.lastMessageId = messages.length - 1;
            snapshotRecord.checksum = makeChatSnapshotChecksum(messages);
          }

          overlay.update(76, 'Sửa chữa save', 'Đang ghi save đã sửa chữa');
          const meta = await writeSlot(cleanSlotId, payload, overlay);
          overlay.update(100, 'Sửa chữa save', 'Hoàn tất');
          options.log?.warn('Save world book', 'Sửa chữa save hoàn tất', { slotId: cleanSlotId, meta });
          return meta;
        }) ?? Promise.reject(new Error('Lớp phủ tải chưa được khởi tạo')),
    );
  }

  async function deleteSlot(slotId: string): Promise<void> {
    return enqueueWrite(`Xóa ${slotId}`, async () => {
      const cleanSlotId = slotId.trim();
      if (!cleanSlotId) {
        throw new Error('Vui lòng chọn một save');
      }
      const worldbookName = await resolveWorldbookName();
      await updateWorldbookWith(
        worldbookName,
        worldbook => worldbook.filter(entry => !isSlotStorageEntry(entry, cleanSlotId)),
        {
          render: 'immediate',
        },
      );
      await persistWorldbookImmediately(worldbookName, `Xóa ${cleanSlotId}`);
      const persisted = await getWorldbook(worldbookName);
      if (persisted.some(entry => isSlotStorageEntry(entry, cleanSlotId))) {
        throw new Error(`Kiểm tra xóa save "${cleanSlotId}" thất bại`);
      }
    });
  }

  return {
    resolveWorldbookName,
    listSlots,
    saveSlot,
    saveSlotQuiet,
    loadSlot,
    readSlotData,
    inspectSlot,
    repairSlot,
    exportSlot,
    importSlot,
    deleteSlot,
  };
}
