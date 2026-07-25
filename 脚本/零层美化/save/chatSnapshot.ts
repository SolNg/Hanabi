import type { TangquanLogger } from '../debug/logger';
import {
  TANGQUAN_ZERO_PLACEHOLDER_EXTRA_KEY,
  TANGQUAN_ZERO_PLACEHOLDER_NAME,
  TANGQUAN_ZERO_PLACEHOLDER_TEXT,
} from '../runtime/zeroPlaceholder';
import type { TangquanLoadingOverlay } from '../ui/loadingOverlay';

export type TangquanChatSnapshotMessage = {
  message_id: number;
  role: 'system' | 'assistant' | 'user';
  name: string;
  is_hidden: boolean;
  message: string;
  data: Record<string, unknown>;
  extra: Record<string, unknown>;
  swipe_id: number;
  swipes: string[];
  swipes_data: Record<string, unknown>[];
  swipes_info: Record<string, unknown>[];
};

export type TangquanChatSnapshot = {
  version: 1;
  capturedAt: string;
  chatId: string;
  messageCount: number;
  lastMessageId: number;
  checksum: string;
  messages: TangquanChatSnapshotMessage[];
};

type SnapshotOptions = {
  loading?: TangquanLoadingOverlay;
  log?: TangquanLogger;
};

const CHAT_RESTORE_BATCH_SIZE = 50;

function cloneRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return _.cloneDeep(value) as Record<string, unknown>;
}

function normalizeRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(item => cloneRecord(item));
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(item => String(item ?? ''));
}

function makeChecksum(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function makeSnapshotChecksum(messages: TangquanChatSnapshotMessage[]): string {
  return makeChecksum(
    JSON.stringify(
      messages.map(message => ({
        role: message.role,
        name: message.name,
        hidden: message.is_hidden,
        swipe_id: message.swipe_id,
        swipes: message.swipes,
        data: message.data,
        extra: message.extra,
        swipes_data: message.swipes_data,
        swipes_info: message.swipes_info,
      })),
    ),
  );
}

function normalizeMessage(raw: ChatMessage | ChatMessageSwiped): TangquanChatSnapshotMessage {
  const record = raw as ChatMessage & ChatMessageSwiped & Record<string, unknown>;
  const swipes = normalizeStringArray(record.swipes);
  const swipeId = Number.isInteger(record.swipe_id) ? record.swipe_id : 0;
  const activeMessage = String(record.message ?? swipes[swipeId] ?? swipes[0] ?? '');
  const normalizedSwipes = swipes.length > 0 ? swipes : [activeMessage];
  return {
    message_id: Number(record.message_id),
    role: record.role,
    name: String(record.name ?? ''),
    is_hidden: Boolean(record.is_hidden),
    message: activeMessage,
    data: cloneRecord(record.data),
    extra: cloneRecord(record.extra),
    swipe_id: _.clamp(swipeId, 0, Math.max(0, normalizedSwipes.length - 1)),
    swipes: normalizedSwipes,
    swipes_data: normalizeRecordArray(record.swipes_data),
    swipes_info: normalizeRecordArray(record.swipes_info),
  };
}

function countCurrentMessages(): { lastMessageId: number; count: number } {
  const lastMessageId = getLastMessageId();
  return {
    lastMessageId,
    count: Math.max(0, lastMessageId + 1),
  };
}

export function captureCurrentChatSnapshot(options: SnapshotOptions = {}): TangquanChatSnapshot {
  const { lastMessageId, count } = countCurrentMessages();
  options.log?.info('Snapshot chat', 'Bắt đầu đọc tầng chat hiện tại', { lastMessageId, count });
  options.loading?.update(16, 'Lưu save hiện tại', `Đang đọc tầng chat hiện tại: ${count} tầng`);

  const messages =
    lastMessageId >= 0
      ? getChatMessages(`0-${lastMessageId}`, {
          role: 'all',
          hide_state: 'all',
          include_swipes: true,
        }).map(normalizeMessage)
      : [];

  const checksum = makeSnapshotChecksum(messages);
  const snapshot: TangquanChatSnapshot = {
    version: 1,
    capturedAt: new Date().toISOString(),
    chatId: String(SillyTavern.getCurrentChatId() ?? ''),
    messageCount: messages.length,
    lastMessageId,
    checksum,
    messages,
  };

  options.log?.info('Snapshot chat', 'Đã đọc xong tầng chat hiện tại', {
    messageCount: snapshot.messageCount,
    checksum,
  });
  return snapshot;
}

async function clearCurrentChat(options: SnapshotOptions = {}): Promise<void> {
  const { lastMessageId, count } = countCurrentMessages();
  options.log?.warn('Khôi phục chat', 'Chuẩn bị xóa tầng chat hiện tại', { lastMessageId, count });
  options.loading?.update(48, 'Load save', `Đang xóa tầng chat hiện tại: ${count} tầng`);
  if (lastMessageId < 0) {
    return;
  }
  const messageIds = _.range(lastMessageId + 1).reverse();
  let deleted = 0;
  for (let index = 0; index < messageIds.length; index += CHAT_RESTORE_BATCH_SIZE) {
    const batch = messageIds.slice(index, index + CHAT_RESTORE_BATCH_SIZE);
    await deleteChatMessages(batch, { refresh: 'none' });
    deleted += batch.length;
    options.loading?.update(
      48 + Math.round((deleted / messageIds.length) * 12),
      'Load save',
      `Đang xóa tầng chat hiện tại: ${deleted}/${count} tầng`,
    );
  }
}

function makeCreatingMessage(message: TangquanChatSnapshotMessage): ChatMessageCreating {
  return {
    role: message.role,
    name: message.name,
    is_hidden: message.is_hidden,
    message: message.message,
    data: _.cloneDeep(message.data),
    extra: _.cloneDeep(message.extra),
  };
}

function makeRestoredSwipeRecords(
  records: Record<string, unknown>[],
  swipeCount: number,
  activeSwipeId: number,
  activeFallback: Record<string, unknown>,
) {
  const restored = _.cloneDeep(records);
  while (restored.length < swipeCount) {
    restored.push({});
  }
  if (records.length === 0 && Object.keys(activeFallback).length > 0) {
    restored[activeSwipeId] = _.cloneDeep(activeFallback);
  }
  return restored.slice(0, swipeCount);
}

function makeSettingMessageCore(message: TangquanChatSnapshotMessage, index: number) {
  return {
    message_id: index,
    name: message.name,
    role: message.role,
    is_hidden: message.is_hidden,
    message: message.message,
    swipe_id: message.swipe_id,
    swipes: _.cloneDeep(message.swipes),
  };
}

function makeSettingMessageMetadata(message: TangquanChatSnapshotMessage, index: number) {
  const swipeCount = Math.max(1, message.swipes.length);
  const activeSwipeId = _.clamp(message.swipe_id, 0, swipeCount - 1);
  return {
    message_id: index,
    swipes_data: makeRestoredSwipeRecords(message.swipes_data, swipeCount, activeSwipeId, message.data),
    swipes_info: makeRestoredSwipeRecords(message.swipes_info, swipeCount, activeSwipeId, message.extra),
  };
}

export async function restoreChatSnapshot(
  snapshot: TangquanChatSnapshot,
  options: SnapshotOptions = {},
): Promise<void> {
  options.log?.warn('Khôi phục chat', 'Bắt đầu khôi phục snapshot chat', {
    messageCount: snapshot.messageCount,
    checksum: snapshot.checksum,
  });
  options.loading?.update(38, 'Load save', 'Đang chuẩn bị khôi phục tầng chat');

  const actualChecksum = makeSnapshotChecksum(snapshot.messages);
  if (actualChecksum !== snapshot.checksum) {
    options.log?.error('Khôi phục chat', 'Kiểm tra snapshot thất bại', {
      expected: snapshot.checksum,
      actual: actualChecksum,
    });
    throw new Error('Kiểm tra snapshot chat thất bại, đã dừng khôi phục');
  }

  await clearCurrentChat(options);

  options.loading?.update(66, 'Load save', `Đang xây lại tầng chat: ${snapshot.messages.length} tầng`);
  if (snapshot.messages.length > 0) {
    let created = 0;
    for (let index = 0; index < snapshot.messages.length; index += CHAT_RESTORE_BATCH_SIZE) {
      const batch = snapshot.messages.slice(index, index + CHAT_RESTORE_BATCH_SIZE);
      await createChatMessages(batch.map(makeCreatingMessage), {
        insert_before: 'end',
        refresh: 'none',
      });
      created += batch.length;
      options.loading?.update(
        66 + Math.round((created / snapshot.messages.length) * 10),
        'Load save',
        `Đang xây lại tầng chat: ${created}/${snapshot.messages.length} tầng`,
      );
    }

    options.loading?.update(78, 'Load save', 'Đang khôi phục dữ liệu đính kèm tầng');
    let restored = 0;
    for (let index = 0; index < snapshot.messages.length; index += CHAT_RESTORE_BATCH_SIZE) {
      const batch = snapshot.messages.slice(index, index + CHAT_RESTORE_BATCH_SIZE);
      await setChatMessages(batch.map((message, offset) => makeSettingMessageCore(message, index + offset)), {
        refresh: 'none',
      });
      await setChatMessages(batch.map((message, offset) => makeSettingMessageMetadata(message, index + offset)), {
        refresh: 'none',
      });
      const visibleMessageIds = batch
        .map((_, offset) => index + offset)
        .filter(messageId => messageId > 0)
        .map(message_id => ({ message_id }));
      if (visibleMessageIds.length > 0) {
        await setChatMessages(visibleMessageIds, { refresh: 'affected' });
      }
      restored += batch.length;
      options.loading?.update(
        78 + Math.round((restored / snapshot.messages.length) * 10),
        'Load save',
        `Đang khôi phục dữ liệu đính kèm tầng: ${restored}/${snapshot.messages.length} tầng`,
      );
    }
  } else {
    await SillyTavern.reloadCurrentChat();
  }

  options.loading?.update(90, 'Load save', 'Đang làm mới hiển thị chat hiện tại');
  options.log?.info('Khôi phục chat', 'Khôi phục snapshot chat hoàn thành', {
    messageCount: snapshot.messageCount,
    checksum: snapshot.checksum,
  });
}

export function createEmptyChatSnapshot(): TangquanChatSnapshot {
  const messages: TangquanChatSnapshotMessage[] = [
    {
      message_id: 0,
      role: 'system',
      name: TANGQUAN_ZERO_PLACEHOLDER_NAME,
      is_hidden: true,
      message: TANGQUAN_ZERO_PLACEHOLDER_TEXT,
      data: {},
      extra: {
        [TANGQUAN_ZERO_PLACEHOLDER_EXTRA_KEY]: true,
      },
      swipe_id: 0,
      swipes: [TANGQUAN_ZERO_PLACEHOLDER_TEXT],
      swipes_data: [{}],
      swipes_info: [{}],
    },
  ];
  return {
    version: 1,
    capturedAt: new Date().toISOString(),
    chatId: String(SillyTavern.getCurrentChatId() ?? ''),
    messageCount: messages.length,
    lastMessageId: 0,
    checksum: makeSnapshotChecksum(messages),
    messages,
  };
}
