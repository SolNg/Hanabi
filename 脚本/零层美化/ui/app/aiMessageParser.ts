export type TangquanParsedAiMessage = {
  rawText: string;
  displayText: string;
  contentText: string;
  timeText: string;
  dialoguePages: TangquanDialoguePage[];
  usedContentTag: boolean;
  contentTagCount: number;
};

export type TangquanDialoguePage = {
  speaker: string;
  text: string;
};

const CONTENT_TAG_PATTERN = /(?:^|\r?\n)\s*<content\b[^>]*>\s*\r?\n?([\s\S]*?)\r?\n?\s*<\/content>\s*(?=\r?\n|$)/gi;
const TIME_TAG_PATTERNS = [
  /(?:^|\r?\n)\s*<time\b[^>]*>\s*\r?\n?([\s\S]*?)\r?\n?\s*<\/time>\s*(?=\r?\n|$)/gi,
  /(?:^|\r?\n)\s*<时间\b[^>]*>\s*\r?\n?([\s\S]*?)\r?\n?\s*<\/时间>\s*(?=\r?\n|$)/gi,
];
const SPEAKER_LINE_PATTERN = /^\s*([^：:\n]{1,24})[：:]\s*(.+?)\s*$/;
const HIDDEN_TAG_KEYWORDS = [
  '信息判定',
  '行为逻辑',
  '心里话',
  '思维链',
  '思考',
  '分析',
  '元认知',
  'metacognition',
  'thinking',
  'analysis',
  'reasoning',
  'UpdateVariable',
  '变量更新',
  'mvu',
  'status_update',
  'variables',
];
const NON_DIALOGUE_SPEAKERS = new Set(['利益判断', '情绪反应', '行动选择', '台词预演', '信息判定', '心里话']);

export function parseTangquanAiMessage(rawText: string): TangquanParsedAiMessage {
  const normalizedRaw = rawText.trim();
  const contentMatches = extractStandaloneTags(normalizedRaw, CONTENT_TAG_PATTERN);
  const rawContentText = contentMatches.at(-1) ?? '';
  const fallbackText = contentMatches.length === 0 ? sanitizeFallbackText(normalizedRaw) : '';
  const contentText = rawContentText ? sanitizeFallbackText(rawContentText) : fallbackText;
  const displayText = contentText || 'Đối phương tạm thời không có phản hồi thêm.';
  const timeText = extractTimeText(normalizedRaw);

  return {
    rawText: normalizedRaw,
    displayText,
    contentText,
    timeText,
    dialoguePages: extractDialoguePages(displayText),
    usedContentTag: contentMatches.length === 1,
    contentTagCount: contentMatches.length,
  };
}

function sanitizeFallbackText(rawText: string): string {
  let result = rawText;
  for (const keyword of HIDDEN_TAG_KEYWORDS) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`<([^<>/\\s]*${escaped}[^<>/\\s]*)[^>]*>[\\s\\S]*?<\\/\\1\\s*>`, 'gi'), '');
    result = result.replace(
      new RegExp(`\\[([^\\]/\\s]*${escaped}[^\\]/\\s]*)[^\\]]*\\][\\s\\S]*?\\[\\/\\1\\s*\\]`, 'gi'),
      '',
    );
  }
  for (const pattern of TIME_TAG_PATTERNS) {
    result = result.replace(new RegExp(pattern.source, pattern.flags), '');
  }
  for (const keyword of HIDDEN_TAG_KEYWORDS) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`<[^<>/\\s]*${escaped}[^<>/\\s]*[^>]*>[\\s\\S]*$`, 'gi'), '');
    result = result.replace(new RegExp(`\\[[^\\]/\\s]*${escaped}[^\\]/\\s]*[^\\]]*\\][\\s\\S]*$`, 'gi'), '');
  }
  return result
    .replace(/<[^>]+>/g, '')
    .replace(/^\s*[-–—>*`]+\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTimeText(rawText: string): string {
  for (const pattern of TIME_TAG_PATTERNS) {
    const value = extractLastStandaloneTag(rawText, pattern);
    if (value) {
      return value;
    }
  }
  return '';
}

function extractLastStandaloneTag(rawText: string, pattern: RegExp): string {
  return extractStandaloneTags(rawText, pattern).at(-1) ?? '';
}

function extractStandaloneTags(rawText: string, pattern: RegExp): string[] {
  return Array.from(rawText.matchAll(new RegExp(pattern.source, pattern.flags))).map(match => (match[1] ?? '').trim());
}

function extractDialoguePages(displayText: string): TangquanDialoguePage[] {
  const speakerLines = displayText
    .split(/\r?\n/)
    .map(line => line.match(SPEAKER_LINE_PATTERN))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .filter(match => !NON_DIALOGUE_SPEAKERS.has(match[1].trim()))
    .map(match => ({
      speaker: match[1].trim(),
      text: match[2].trim(),
    }));

  if (speakerLines.length > 0) {
    return speakerLines;
  }

  return Array.from(displayText.matchAll(/“([^”\n]+)”([^\n]{0,16})/g))
    .filter(match => !/^\s*(?:我|<user>)(?:问|说|答|回应|补充|笑|低声|轻声|开口)/i.test(match[2] ?? ''))
    .map(match => match[1].trim())
    .filter(Boolean)
    .map(text => ({ speaker: '', text }));
}
