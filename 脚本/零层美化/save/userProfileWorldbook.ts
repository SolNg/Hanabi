import type { TangquanLogger } from '../debug/logger';

export type TangquanUserGenderKey = '男' | '女' | '扶她' | '男娘' | '双性' | '无性' | '自定义';

export type TangquanUserProfileInput = {
  name: string;
  genderKey: TangquanUserGenderKey;
  genderText?: string;
  description: string;
};

export type TangquanUserProfile = TangquanUserProfileInput & {
  slotId: string;
  genderLabel: string;
  updatedAt: string;
};

export type TangquanUserProfileWorldbookService = {
  upsertProfile: (slotId: string, profile: TangquanUserProfileInput) => Promise<TangquanUserProfile>;
  activateSlot: (slotId: string) => Promise<{ slotId: string; hasProfile: boolean; enabledCount: number }>;
  cloneProfileToSlot: (sourceSlotId: string, targetSlotId: string) => Promise<boolean>;
  migrateFromWorldbook: (
    legacyWorldbookName: string,
    activeSlotId: string,
  ) => Promise<{ migratedCount: number; removedCount: number }>;
  syncSlots: (slotIds: string[], activeSlotId: string) => Promise<{ removedCount: number; enabledCount: number }>;
  deleteProfile: (slotId: string) => Promise<void>;
  disableAll: () => Promise<void>;
};

type UserProfileWorldbookOptions = {
  resolveWorldbookName: () => Promise<string>;
  log?: TangquanLogger;
};

const USER_PROFILE_SOURCE = 'tangquan-user-profile-v1';

function cleanText(value: string): string {
  return value.trim().replaceAll('</tag>', '< /tag>');
}

function resolveGenderLabel(profile: TangquanUserProfileInput): string {
  if (profile.genderKey === '自定义') {
    return cleanText(profile.genderText ?? '') || 'Tùy chỉnh';
  }
  return profile.genderKey;
}

function normalizeProfile(slotId: string, profile: TangquanUserProfileInput): TangquanUserProfile {
  return {
    slotId: slotId.trim(),
    name: cleanText(profile.name) || 'Chưa đặt tên',
    genderKey: profile.genderKey,
    genderText: cleanText(profile.genderText ?? ''),
    genderLabel: resolveGenderLabel(profile),
    description: cleanText(profile.description),
    updatedAt: new Date().toISOString(),
  };
}

function makeEntryName(slotId: string): string {
  return `[未开之花][${slotId}] Thông tin người dùng`;
}

function buildContent(profile: TangquanUserProfile): string {
  return `<tag>
Thông tin người dùng

Tên: ${profile.name}
Giới tính: ${profile.genderLabel}

Tự thiết lập:
${profile.description}
</tag>`;
}

function makeProfileEntry(profile: TangquanUserProfile, enabled: boolean): TypeFest.PartialDeep<WorldbookEntry> {
  return {
    name: makeEntryName(profile.slotId),
    enabled,
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'at_depth',
      role: 'system',
      depth: 0,
      order: 1,
    },
    content: buildContent(profile),
    probability: 100,
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
      source: USER_PROFILE_SOURCE,
      kind: 'user-profile',
      slotId: profile.slotId,
      profile: {
        name: profile.name,
        genderKey: profile.genderKey,
        genderText: profile.genderText,
        genderLabel: profile.genderLabel,
        updatedAt: profile.updatedAt,
      },
    },
  };
}

function isUserProfileEntry(entry: WorldbookEntry, slotId?: string): boolean {
  if (entry.extra?.source !== USER_PROFILE_SOURCE || entry.extra.kind !== 'user-profile') {
    return false;
  }
  if (slotId === undefined) {
    return true;
  }
  return entry.extra.slotId === slotId;
}

export function createUserProfileWorldbookService(
  options: UserProfileWorldbookOptions,
): TangquanUserProfileWorldbookService {
  async function upsertProfile(slotId: string, input: TangquanUserProfileInput): Promise<TangquanUserProfile> {
    const profile = normalizeProfile(slotId, input);
    if (!profile.slotId) {
      throw new Error('Vui lòng chọn một save');
    }

    const worldbookName = await options.resolveWorldbookName();
    await updateWorldbookWith(
      worldbookName,
      worldbook => [
        ...worldbook
          .filter(entry => !isUserProfileEntry(entry, profile.slotId))
          .map(entry => (isUserProfileEntry(entry) ? { ...entry, enabled: false } : entry)),
        makeProfileEntry(profile, true),
      ],
      { render: 'immediate' },
    );
    options.log?.info('Thông tin người dùng', 'Entry thông tin người dùng đã ghi và bật', {
      slotId: profile.slotId,
      name: profile.name,
      gender: profile.genderLabel,
    });
    return profile;
  }

  async function activateSlot(slotId: string): Promise<{ slotId: string; hasProfile: boolean; enabledCount: number }> {
    const cleanSlotId = slotId.trim();
    const worldbookName = await options.resolveWorldbookName();
    let hasProfile = false;
    let enabledCount = 0;
    await updateWorldbookWith(
      worldbookName,
      worldbook =>
        worldbook.map(entry => {
          if (!isUserProfileEntry(entry)) {
            return entry;
          }
          const shouldEnable = entry.extra.slotId === cleanSlotId;
          hasProfile ||= shouldEnable;
          if (shouldEnable) {
            enabledCount += 1;
          }
          return { ...entry, enabled: shouldEnable };
        }),
      { render: 'immediate' },
    );
    options.log?.info('Thông tin người dùng', 'Trạng thái bật entry thông tin người dùng đã đồng bộ', { slotId: cleanSlotId, hasProfile, enabledCount });
    return { slotId: cleanSlotId, hasProfile, enabledCount };
  }

  async function cloneProfileToSlot(sourceSlotId: string, targetSlotId: string): Promise<boolean> {
    const cleanSourceSlotId = sourceSlotId.trim();
    const cleanTargetSlotId = targetSlotId.trim();
    if (!cleanSourceSlotId || !cleanTargetSlotId) {
      return false;
    }

    const worldbookName = await options.resolveWorldbookName();
    const worldbook = await getWorldbook(worldbookName);
    const source = worldbook.find(entry => isUserProfileEntry(entry, cleanSourceSlotId));
    if (!source) {
      await activateSlot(cleanTargetSlotId);
      return false;
    }

    await updateWorldbookWith(
      worldbookName,
      entries => [
        ...entries
          .filter(entry => !isUserProfileEntry(entry, cleanTargetSlotId))
          .map(entry => (isUserProfileEntry(entry) ? { ...entry, enabled: false } : entry)),
        {
          ...source,
          uid: undefined,
          name: makeEntryName(cleanTargetSlotId),
          enabled: true,
          extra: {
            ...source.extra,
            source: USER_PROFILE_SOURCE,
            kind: 'user-profile',
            slotId: cleanTargetSlotId,
          },
        },
      ],
      { render: 'immediate' },
    );
    options.log?.info('Thông tin người dùng', 'Entry thông tin người dùng đã sao chép sang save mới', {
      from: cleanSourceSlotId,
      to: cleanTargetSlotId,
    });
    return true;
  }

  async function migrateFromWorldbook(
    legacyWorldbookName: string,
    activeSlotId: string,
  ): Promise<{ migratedCount: number; removedCount: number }> {
    const cleanLegacyName = legacyWorldbookName.trim();
    const targetWorldbookName = await options.resolveWorldbookName();
    if (!cleanLegacyName || cleanLegacyName === targetWorldbookName) {
      return { migratedCount: 0, removedCount: 0 };
    }

    const legacyWorldbook = await getWorldbook(cleanLegacyName);
    const legacyProfiles = legacyWorldbook.filter(entry => isUserProfileEntry(entry));
    if (legacyProfiles.length === 0) {
      return { migratedCount: 0, removedCount: 0 };
    }

    const migratedSlotIds = new Set(legacyProfiles.map(entry => String(entry.extra.slotId ?? '')));
    await updateWorldbookWith(
      targetWorldbookName,
      entries => [
        ...entries.filter(entry => !isUserProfileEntry(entry) || !migratedSlotIds.has(String(entry.extra.slotId ?? ''))),
        ...legacyProfiles.map(entry => ({
          ...entry,
          uid: undefined,
          enabled: entry.extra.slotId === activeSlotId,
        })),
      ],
      { render: 'immediate' },
    );
    await updateWorldbookWith(
      cleanLegacyName,
      entries => entries.filter(entry => !isUserProfileEntry(entry)),
      { render: 'immediate' },
    );
    options.log?.warn('Thông tin người dùng', 'Thông tin người dùng phiên bản cũ đã chuyển sang world book nhân vật', {
      from: cleanLegacyName,
      to: targetWorldbookName,
      activeSlotId,
      count: legacyProfiles.length,
    });
    return { migratedCount: legacyProfiles.length, removedCount: legacyProfiles.length };
  }

  async function deleteProfile(slotId: string): Promise<void> {
    const cleanSlotId = slotId.trim();
    const worldbookName = await options.resolveWorldbookName();
    await updateWorldbookWith(
      worldbookName,
      worldbook => worldbook.filter(entry => !isUserProfileEntry(entry, cleanSlotId)),
      { render: 'immediate' },
    );
    options.log?.warn('Thông tin người dùng', 'Entry thông tin người dùng đã xóa', { slotId: cleanSlotId });
  }

  async function syncSlots(
    slotIds: string[],
    activeSlotId: string,
  ): Promise<{ removedCount: number; enabledCount: number }> {
    const validSlotIds = new Set(slotIds.map(slotId => slotId.trim()).filter(Boolean));
    const cleanActiveSlotId = activeSlotId.trim();
    const worldbookName = await options.resolveWorldbookName();
    let removedCount = 0;
    let enabledCount = 0;
    await updateWorldbookWith(
      worldbookName,
      worldbook =>
        worldbook.flatMap(entry => {
          if (!isUserProfileEntry(entry)) {
            return [entry];
          }
          const slotId = String(entry.extra.slotId ?? '').trim();
          if (!validSlotIds.has(slotId)) {
            removedCount += 1;
            return [];
          }
          const enabled = Boolean(cleanActiveSlotId) && slotId === cleanActiveSlotId;
          if (enabled) {
            enabledCount += 1;
          }
          return [{ ...entry, enabled }];
        }),
      { render: 'immediate' },
    );
    options.log?.info('Thông tin người dùng', 'Entry thông tin người dùng đã đồng bộ với save thật', {
      slotCount: validSlotIds.size,
      activeSlotId: cleanActiveSlotId,
      removedCount,
      enabledCount,
    });
    return { removedCount, enabledCount };
  }

  async function disableAll(): Promise<void> {
    const worldbookName = await options.resolveWorldbookName();
    await updateWorldbookWith(
      worldbookName,
      worldbook => worldbook.map(entry => (isUserProfileEntry(entry) ? { ...entry, enabled: false } : entry)),
      { render: 'immediate' },
    );
    options.log?.warn('Thông tin người dùng', 'Toàn bộ entry thông tin người dùng đã tắt');
  }

  return {
    upsertProfile,
    activateSlot,
    cloneProfileToSlot,
    migrateFromWorldbook,
    syncSlots,
    deleteProfile,
    disableAll,
  };
}
