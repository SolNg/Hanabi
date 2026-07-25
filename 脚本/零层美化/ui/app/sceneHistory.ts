export type TangquanSceneMode = '老板' | '游客' | '服务员';
export type TangquanSceneKind = 'dialogue' | 'story' | 'message';
export type TangquanSceneHistoryRole = 'system' | 'user' | 'assistant';

export type TangquanSceneIdentity = {
  sceneId: string;
  mode: TangquanSceneMode;
  kind: TangquanSceneKind;
  speakerId: string;
  participantIds: string[];
  locationId: string;
  serviceId: string;
  projectId: string;
  assignmentId: string;
  startedAfterMessageId: number;
  legacySceneKey: string;
};

export type TangquanSceneHistoryMessage = {
  messageId: number;
  role: TangquanSceneHistoryRole;
  content: string;
  hidden?: boolean;
  sceneId?: string;
  legacySceneKey?: string;
};

export type TangquanSceneHistoryPrompt = {
  role: TangquanSceneHistoryRole;
  content: string;
};

export type TangquanSceneHistoryBuildOptions = {
  identity: TangquanSceneIdentity;
  messages: TangquanSceneHistoryMessage[];
  beforeMessageId?: number;
};

function normalizeIdPart(value: string): string {
  const normalized = value
    .trim()
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'unknown';
}

export function makeTangquanSceneEntityId(prefix: string, value: string): string {
  return `${normalizeIdPart(prefix)}:${normalizeIdPart(value)}`;
}

export function makeTangquanRuntimeSceneId(prefix = 'scene'): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${normalizeIdPart(prefix)}-${Date.now().toString(36)}-${random}`;
}

export function makeTangquanContactSceneId(participantId: string): string {
  return `contact-${normalizeIdPart(participantId)}`;
}

export function normalizeTangquanParticipantIds(ids: string[]): string[] {
  return [...new Set(ids.map(id => id.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function belongsToScene(message: TangquanSceneHistoryMessage, identity: TangquanSceneIdentity): boolean {
  if (message.sceneId) {
    return message.sceneId === identity.sceneId;
  }
  return Boolean(message.legacySceneKey && identity.legacySceneKey && message.legacySceneKey === identity.legacySceneKey);
}

/**
 * Chỉ lắp ráp các tin nhắn lịch sử đã ghi vào đĩa của hiện trường tương tác mục tiêu.
 * Input hiện tại không thêm ở đây, mà chỉ gửi một lần duy nhất qua generate.user_input.
 */
export function buildTangquanSceneHistoryPrompts({
  identity,
  messages,
  beforeMessageId = Number.POSITIVE_INFINITY,
}: TangquanSceneHistoryBuildOptions): TangquanSceneHistoryPrompt[] {
  return messages
    .filter(message => Number.isInteger(message.messageId))
    .filter(message => message.messageId > identity.startedAfterMessageId && message.messageId < beforeMessageId)
    .filter(message => !message.hidden && belongsToScene(message, identity))
    .filter(message => ['system', 'user', 'assistant'].includes(message.role))
    .map(message => ({ ...message, content: message.content.trim() }))
    .filter(message => message.content.length > 0)
    .sort((a, b) => a.messageId - b.messageId)
    .map(message => ({ role: message.role, content: message.content }));
}
