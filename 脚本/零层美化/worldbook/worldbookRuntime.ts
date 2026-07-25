import type { TangquanLogger } from '../debug/logger';
import type { TangquanPlayMode } from '../save/worldbookSave';
import { TANGQUAN_CHARACTER_DEFINITIONS } from '../ui/app/characterCatalog';
import {
  listTangquanBuildingEntries,
  listTangquanInfrastructureEntries,
  listTangquanProjectEntries,
} from './worldbookEntryCatalog';

type TangquanMode = Exclude<TangquanPlayMode, '未选择'>;

type RuntimeEntryActivation = 'always' | 'mode' | 'manual';

export type TangquanRuntimeWorldbookEntry = {
  id: string;
  name: string;
  activation: RuntimeEntryActivation;
  mode?: TangquanMode;
};

export type TangquanWorldbookSyncResult = {
  worldbookName: string;
  mode: TangquanMode;
  slotId: string;
  touchedCount: number;
  enabledCount: number;
  disabledCount: number;
  missingIds: string[];
};

export type TangquanRuntimeWorldbookContentMap = Record<string, string>;

export type TangquanGeneratedCharacterEntry = {
  worldbookName: string;
  entryId: string;
  entryName: string;
  candidateId: string;
  enabled: boolean;
  uid: number;
};

export type TangquanWorldbookSnapshot = {
  worldbookName: string;
  entries: WorldbookEntry[];
};

export type TangquanGeneratedCharacterEntryInput = {
  entryId: string;
  entryName: string;
  candidateId: string;
  content: string;
};

export type TangquanWorldbookRuntimeService = {
  listEntryDefinitions: () => TangquanRuntimeWorldbookEntry[];
  syncModeEntries: (mode: TangquanMode, slotId: string) => Promise<TangquanWorldbookSyncResult>;
  enableEntries: (
    entryIds: string[],
    reason: string,
    contentMap?: TangquanRuntimeWorldbookContentMap,
  ) => Promise<{ worldbookName: string; enabledIds: string[]; missingIds: string[] }>;
  disableEntries: (entryIds: string[], reason: string) => Promise<{ worldbookName: string; disabledIds: string[] }>;
  inspectGeneratedCharacterEntry: (
    entryId: string,
  ) => Promise<{ worldbookName: string; exists: boolean; generated: boolean; entry: TangquanGeneratedCharacterEntry | null }>;
  listGeneratedCharacterEntries: () => Promise<TangquanGeneratedCharacterEntry[]>;
  snapshot: () => Promise<TangquanWorldbookSnapshot>;
  createGeneratedCharacterEntry: (input: TangquanGeneratedCharacterEntryInput) => Promise<TangquanGeneratedCharacterEntry>;
  deleteGeneratedCharacterEntry: (
    entryId: string,
    reason: string,
  ) => Promise<{ worldbookName: string; deletedCount: number }>;
  restoreSnapshot: (snapshot: TangquanWorldbookSnapshot, reason: string) => Promise<void>;
};

type WorldbookRuntimeOptions = {
  resolveWorldbookName: () => Promise<string>;
  log: TangquanLogger;
};

const RUNTIME_SOURCE = 'tangquan-runtime-worldbook-v1';
const GENERATED_CHARACTER_SOURCE = 'tangquan-ai-talent';

const ENTRY_DEFINITIONS: readonly TangquanRuntimeWorldbookEntry[] = [
  { id: 'common.worldview', name: '[未开之花][通用] Tổng cương thế giới quan', activation: 'always' },
  { id: 'common.holiday', name: '[未开之花][通用] Thiết lập dịp lễ', activation: 'always' },
  { id: 'common.facility', name: '[未开之花][通用] Bố cục cơ sở vật chất', activation: 'always' },
  { id: 'common.staff-service', name: '[未开之花][通用] Vị trí công việc và dịch vụ tiêu chuẩn', activation: 'always' },
  { id: 'common.nomination', name: '[未开之花][通用] Chế độ chỉ định', activation: 'always' },
  { id: 'common.narrative', name: '[未开之花][通用] Quy tắc trần thuật', activation: 'always' },
  { id: 'common.variable-list', name: '[未开之花][变量] Danh sách biến', activation: 'always' },
  { id: 'common.variable-format', name: '[未开之花][变量] Định dạng xuất', activation: 'always' },
  { id: 'common.variable-rule', name: '[未开之花][变量规则] Chung', activation: 'always' },

  { id: 'boss.rules.management', name: '[未开之花][规则] Kinh doanh thường trực', activation: 'mode', mode: '老板' },
  { id: 'boss.rules.scene', name: '[未开之花][规则] Hiện trường kinh doanh', activation: 'mode', mode: '老板' },
  { id: 'boss.variable-rule', name: '[未开之花][变量规则] Hiện trường kinh doanh', activation: 'manual' },

  { id: 'customer.rules.visit', name: '[未开之花][规则] Trải nghiệm đến tuyền', activation: 'mode', mode: '游客' },
  { id: 'customer.rules.relationship', name: '[未开之花][规则] Quan hệ và liên lạc', activation: 'mode', mode: '游客' },
  { id: 'customer.variable-rule', name: '[未开之花][变量规则] Hiện trường đến tuyền', activation: 'manual' },

  { id: 'waiter.rules.work', name: '[未开之花][规则] Dịch vụ tại tiệm', activation: 'mode', mode: '服务员' },
  { id: 'waiter.rules.growth', name: '[未开之花][规则] Kết quả trưởng thành', activation: 'mode', mode: '服务员' },
  { id: 'waiter.variable-rule', name: '[未开之花][变量规则] Hiện trường phục vụ', activation: 'manual' },

  { id: 'area.current', name: '[未开之花][区域] Khu vực hiện tại', activation: 'manual' },
  { id: 'project.current', name: '[未开之花][项目] Dự án hiện tại', activation: 'manual' },
  { id: 'character.current-employee', name: '[未开之花][角色] Nhân viên hiện tại', activation: 'manual' },
  { id: 'character.current-guest', name: '[未开之花][角色] Khách hiện tại', activation: 'manual' },
  { id: 'character.current-candidate', name: '[未开之花][角色] Ứng viên hiện tại', activation: 'manual' },

  ...TANGQUAN_CHARACTER_DEFINITIONS.map(character => ({
    id: `character.profile.${character.id}`,
    name: `[未开之花][角色] ${character.name}`,
    activation: 'manual' as const,
  })),

  ...listTangquanInfrastructureEntries().map(entry => ({
    id: entry.id,
    name: entry.name,
    activation: 'manual' as const,
  })),
  ...listTangquanBuildingEntries().map(entry => ({
    id: entry.id,
    name: entry.name,
    activation: 'manual' as const,
  })),
  ...listTangquanProjectEntries().map(entry => ({
    id: entry.id,
    name: entry.name,
    activation: 'manual' as const,
  })),
];

const DEFINITIONS_BY_ID = new Map(ENTRY_DEFINITIONS.map(definition => [definition.id, definition]));
const DEFINITIONS_BY_NAME = new Map(ENTRY_DEFINITIONS.map(definition => [definition.name, definition]));
const CONTENT_MUTABLE_ENTRY_IDS = new Set([
  'area.current',
  'project.current',
  'character.current-employee',
  'character.current-guest',
  'character.current-candidate',
]);

function getRuntimeEntryId(entry: WorldbookEntry): string {
  if (entry.extra?.source === RUNTIME_SOURCE && typeof entry.extra.id === 'string') {
    return entry.extra.id;
  }
  if (typeof entry.extra?.tangquanEntryId === 'string') {
    return entry.extra.tangquanEntryId;
  }
  return '';
}

function isGeneratedCharacterEntry(entry: WorldbookEntry): boolean {
  if (entry.extra?.source !== GENERATED_CHARACTER_SOURCE) return false;
  const candidateId = typeof entry.extra.candidateId === 'string' ? entry.extra.candidateId : '';
  const entryId = getRuntimeEntryId(entry);
  return /^ai-market-[a-z0-9-]{8,70}$/.test(candidateId) && entryId === `character.profile.${candidateId}`;
}

function toGeneratedCharacterEntry(worldbookName: string, entry: WorldbookEntry): TangquanGeneratedCharacterEntry {
  return {
    worldbookName,
    entryId: getRuntimeEntryId(entry),
    entryName: entry.name,
    candidateId: String(entry.extra?.candidateId ?? ''),
    enabled: entry.enabled,
    uid: entry.uid,
  };
}

function resolveDefinition(entry: WorldbookEntry): TangquanRuntimeWorldbookEntry | null {
  const byId = DEFINITIONS_BY_ID.get(getRuntimeEntryId(entry));
  if (byId) {
    return byId;
  }
  if (isGeneratedCharacterEntry(entry)) {
    return {
      id: getRuntimeEntryId(entry),
      name: entry.name,
      activation: 'manual',
    };
  }
  return DEFINITIONS_BY_NAME.get(entry.name) ?? null;
}

function shouldEnableForMode(definition: TangquanRuntimeWorldbookEntry, mode: TangquanMode): boolean {
  if (definition.activation === 'always') {
    return true;
  }
  if (definition.activation === 'mode') {
    return definition.mode === mode;
  }
  return false;
}

function listExpectedIdsForMode(mode: TangquanMode): string[] {
  return ENTRY_DEFINITIONS.filter(definition => shouldEnableForMode(definition, mode)).map(definition => definition.id);
}

function collectPresentIds(worldbook: WorldbookEntry[]): Set<string> {
  return new Set(
    worldbook
      .map(resolveDefinition)
      .filter((definition): definition is TangquanRuntimeWorldbookEntry => Boolean(definition))
      .map(definition => definition.id),
  );
}

function listMissingIds(worldbook: WorldbookEntry[], expectedIds: string[]): string[] {
  const presentIds = collectPresentIds(worldbook);
  return expectedIds.filter(id => !presentIds.has(id));
}

function hasContentForId(contentMap: TangquanRuntimeWorldbookContentMap, id: string): boolean {
  return Object.prototype.hasOwnProperty.call(contentMap, id);
}

function canReplaceRuntimeContent(id: string): boolean {
  return CONTENT_MUTABLE_ENTRY_IDS.has(id);
}

export function createTangquanWorldbookRuntimeService(
  options: WorldbookRuntimeOptions,
): TangquanWorldbookRuntimeService {
  function listEntryDefinitions() {
    return ENTRY_DEFINITIONS.map(definition => ({ ...definition }));
  }

  async function syncModeEntries(mode: TangquanMode, slotId: string): Promise<TangquanWorldbookSyncResult> {
    const worldbookName = await options.resolveWorldbookName();
    const worldbook = await getWorldbook(worldbookName);
    const expectedIds = listExpectedIdsForMode(mode);
    const missingIds = listMissingIds(worldbook, expectedIds);
    let touchedCount = 0;
    let enabledCount = 0;
    let disabledCount = 0;

    await updateWorldbookWith(
      worldbookName,
      entries =>
        entries.map(entry => {
          const definition = resolveDefinition(entry);
          if (!definition) {
            return entry;
          }
          touchedCount += 1;
          const enabled = shouldEnableForMode(definition, mode);
          if (enabled) {
            enabledCount += 1;
          } else {
            disabledCount += 1;
          }
          const shouldClearContent = !enabled && canReplaceRuntimeContent(definition.id);
          return {
            ...entry,
            enabled,
            content: shouldClearContent ? '' : entry.content,
            extra: {
              ...entry.extra,
              source: entry.extra?.source ?? RUNTIME_SOURCE,
              tangquanEntryId: definition.id,
            },
          };
        }),
      { render: 'immediate' },
    );

    const result = {
      worldbookName,
      mode,
      slotId,
      touchedCount,
      enabledCount,
      disabledCount,
      missingIds,
    };
    options.log.info('Vận hành world book', 'Đã đồng bộ trạng thái bật entry của save hiện tại', result);
    if (missingIds.length > 0) {
      options.log.warn('Vận hành world book', 'Entry chính thức chưa được ghi, hiện chỉ ghi nhận danh sách thiếu', { worldbookName, missingIds });
    }
    return result;
  }

  async function enableEntries(
    entryIds: string[],
    reason: string,
    contentMap: TangquanRuntimeWorldbookContentMap = {},
  ) {
    const requestedIds = _.uniq(entryIds);
    const worldbookName = await options.resolveWorldbookName();
    const worldbook = await getWorldbook(worldbookName);
    const missingIds = listMissingIds(worldbook, requestedIds);
    const enabledIds: string[] = [];
    const contentUpdatedIds: string[] = [];
    await updateWorldbookWith(
      worldbookName,
      entries =>
        entries.map(entry => {
          const definition = resolveDefinition(entry);
          if (!definition || !requestedIds.includes(definition.id)) {
            return entry;
          }
          enabledIds.push(definition.id);
          const canWriteContent = canReplaceRuntimeContent(definition.id);
          const shouldWriteContent = canWriteContent && hasContentForId(contentMap, definition.id);
          if (shouldWriteContent) {
            contentUpdatedIds.push(definition.id);
          }
          return {
            ...entry,
            enabled: true,
            content: canWriteContent ? (shouldWriteContent ? contentMap[definition.id] : '') : entry.content,
            extra: {
              ...entry.extra,
              source: entry.extra?.source ?? RUNTIME_SOURCE,
              tangquanEntryId: definition.id,
            },
          };
        }),
      { render: 'immediate' },
    );
    options.log.info('Vận hành world book', 'Đã bật entry tạm thời', { reason, enabledIds, missingIds, contentUpdatedIds });
    return { worldbookName, enabledIds, missingIds };
  }

  async function disableEntries(entryIds: string[], reason: string) {
    const requestedIds = _.uniq(entryIds);
    const worldbookName = await options.resolveWorldbookName();
    const disabledIds: string[] = [];
    const contentClearedIds: string[] = [];
    await updateWorldbookWith(
      worldbookName,
      entries =>
        entries.map(entry => {
          const definition = resolveDefinition(entry);
          if (!definition || !requestedIds.includes(definition.id)) {
            return entry;
          }
          disabledIds.push(definition.id);
          const shouldClearContent = canReplaceRuntimeContent(definition.id);
          if (shouldClearContent && entry.content) {
            contentClearedIds.push(definition.id);
          }
          return {
            ...entry,
            enabled: false,
            content: shouldClearContent ? '' : entry.content,
            extra: {
              ...entry.extra,
              source: entry.extra?.source ?? RUNTIME_SOURCE,
              tangquanEntryId: definition.id,
            },
          };
        }),
      { render: 'immediate' },
    );
    options.log.info('Vận hành world book', 'Đã tắt entry tạm thời', { reason, disabledIds, contentClearedIds });
    return { worldbookName, disabledIds };
  }

  async function inspectGeneratedCharacterEntry(entryId: string) {
    const worldbookName = await options.resolveWorldbookName();
    const worldbook = await getWorldbook(worldbookName);
    const matches = worldbook.filter(entry => getRuntimeEntryId(entry) === entryId);
    const generatedEntry = matches.find(isGeneratedCharacterEntry) ?? null;
    return {
      worldbookName,
      exists: matches.length > 0,
      generated: Boolean(generatedEntry),
      entry: generatedEntry ? toGeneratedCharacterEntry(worldbookName, generatedEntry) : null,
    };
  }

  async function listGeneratedCharacterEntries() {
    const worldbookName = await options.resolveWorldbookName();
    const worldbook = await getWorldbook(worldbookName);
    return worldbook
      .filter(isGeneratedCharacterEntry)
      .map(entry => toGeneratedCharacterEntry(worldbookName, entry));
  }

  async function snapshot(): Promise<TangquanWorldbookSnapshot> {
    const worldbookName = await options.resolveWorldbookName();
    return {
      worldbookName,
      entries: _.cloneDeep(await getWorldbook(worldbookName)),
    };
  }

  async function createGeneratedCharacterEntry(
    input: TangquanGeneratedCharacterEntryInput,
  ): Promise<TangquanGeneratedCharacterEntry> {
    const expectedEntryId = `character.profile.${input.candidateId}`;
    if (!/^ai-market-[a-z0-9-]{8,70}$/.test(input.candidateId) || input.entryId !== expectedEntryId) {
      throw new Error('entryId và candidateId của world book nhân vật vừa sinh không khớp nhau');
    }
    if (!input.entryName.trim() || !input.content.trim()) {
      throw new Error('Tên hoặc nội dung world book nhân vật vừa sinh đang trống');
    }
    const worldbookName = await options.resolveWorldbookName();
    const before = await getWorldbook(worldbookName);
    if (before.some(entry => getRuntimeEntryId(entry) === input.entryId)) {
      throw new Error(`Entry world book nhân vật vừa sinh đã tồn tại: ${input.entryId}`);
    }
    const result = await createWorldbookEntries(
      worldbookName,
      [
        {
          name: input.entryName,
          enabled: false,
          strategy: {
            type: 'constant',
            keys: [],
            keys_secondary: { logic: 'and_any', keys: [] },
            scan_depth: 'same_as_global',
          },
          position: {
            type: 'after_character_definition',
            role: 'system',
            depth: 0,
            order: 100,
          },
          content: input.content,
          probability: 100,
          recursion: { prevent_incoming: true, prevent_outgoing: true, delay_until: null },
          effect: { sticky: null, cooldown: null, delay: null },
          extra: {
            source: GENERATED_CHARACTER_SOURCE,
            candidateId: input.candidateId,
            tangquanEntryId: input.entryId,
          },
        },
      ],
      { render: 'immediate' },
    );
    const created = result.new_entries.find(
      entry => getRuntimeEntryId(entry) === input.entryId && isGeneratedCharacterEntry(entry),
    );
    if (!created) throw new Error(`Không thể xác nhận entry world book nhân vật vừa sinh sau khi tạo: ${input.entryId}`);
    options.log.info('Vận hành world book', 'Đã tạo entry nhân vật AI nhân tài', {
      worldbookName,
      entryId: input.entryId,
      candidateId: input.candidateId,
      uid: created.uid,
    });
    return toGeneratedCharacterEntry(worldbookName, created);
  }

  async function deleteGeneratedCharacterEntry(entryId: string, reason: string) {
    const worldbookName = await options.resolveWorldbookName();
    const result = await deleteWorldbookEntries(
      worldbookName,
      entry => getRuntimeEntryId(entry) === entryId && isGeneratedCharacterEntry(entry),
      { render: 'immediate' },
    );
    options.log.info('Vận hành world book', 'Đã xóa entry nhân vật AI nhân tài', {
      reason,
      worldbookName,
      entryId,
      deletedCount: result.deleted_entries.length,
    });
    return { worldbookName, deletedCount: result.deleted_entries.length };
  }

  async function restoreSnapshot(snapshotValue: TangquanWorldbookSnapshot, reason: string): Promise<void> {
    await replaceWorldbook(snapshotValue.worldbookName, _.cloneDeep(snapshotValue.entries), { render: 'immediate' });
    options.log.warn('Vận hành world book', 'Đã khôi phục world book từ snapshot', {
      reason,
      worldbookName: snapshotValue.worldbookName,
      entryCount: snapshotValue.entries.length,
    });
  }

  return {
    listEntryDefinitions,
    syncModeEntries,
    enableEntries,
    disableEntries,
    inspectGeneratedCharacterEntry,
    listGeneratedCharacterEntries,
    snapshot,
    createGeneratedCharacterEntry,
    deleteGeneratedCharacterEntry,
    restoreSnapshot,
  };
}
