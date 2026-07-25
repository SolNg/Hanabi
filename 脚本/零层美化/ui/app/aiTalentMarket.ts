export type BossAiTalentGrade = 'B' | 'A' | 'S';

export type BossAiTalentCandidate = {
  id: string;
  姓名: string;
  性别: string;
  种族: string;
  年龄段: string;
  来源地: string;
  评级: BossAiTalentGrade;
  期望日薪: number;
  市场签约价格: number;
  擅长项目: string[];
  性格关键词: string[];
  经历简介: string;
  应聘动机: string;
  特殊说明: string;
  生成日期: string;
  来源标记: 'ai-market';
};

export type BossAiTalentProfile = {
  基础身份: string;
  外貌特征: string;
  性格核心: string[];
  经历: string;
  应聘动机: string;
  擅长与短板: string;
  服务风格: string;
  说话方式: string;
  边界与禁忌: string;
  关系发展原则: string;
  日常习惯: string;
  可持续剧情钩子: string[];
};

export type BossAiTalentWorldbookEntry = {
  entryId: string;
  entryName: string;
  activation: 'manual';
  enabled: false;
  content: string;
};

export type BossAiTalentFullProfile = {
  version: 1;
  candidateId: string;
  姓名: string;
  profile: BossAiTalentProfile;
  worldbook: BossAiTalentWorldbookEntry;
};

export type BossAiTalentMarketState = {
  version: 1;
  生成日期: string;
  已尝试生成: boolean;
  来源: 'ai' | 'fallback';
  候选: BossAiTalentCandidate[];
  问题: string[];
};

export type BossAiTalentParseResult = {
  ok: boolean;
  candidates: BossAiTalentCandidate[];
  issues: string[];
};

export type BossAiTalentFullProfileParseResult = {
  ok: boolean;
  value: BossAiTalentFullProfile | null;
  issues: string[];
};

const LOCAL_NAMES = ['Vũ Thiết', 'Trăn Vụ', 'Trừng Ca', 'Yuunagi', 'Huyền Đăng', 'Thiển Quỳ', 'Đông Di', 'Hạc Kiến'];
const LOCAL_GENDERS = ['Nữ', 'Nam', 'Phi nhị nguyên'];
const LOCAL_SPECIES = ['Con người', 'Bán tinh linh', 'Thú nhân', 'Hậu duệ mặt trăng'];
const LOCAL_ORIGINS = ['Ôn Tuyền Hương Bắc Lục', 'Thành Tự Do Vịnh Biển', 'Phố Cũ Vụ Lĩnh', 'Sơn Thành Viễn Đông'];
const LOCAL_PROJECTS = ['Ngâm tắm nghỉ ngơi', 'Xoa bóp trị liệu', 'Chăm sóc bồn tắm hương bưởi', 'Nghỉ ngơi phòng riêng', 'Trò chuyện đêm sân vườn'];
const LOCAL_TRAITS = ['Điềm đạm', 'Tỉ mỉ', 'Biết lắng nghe', 'Phản ứng nhanh nhạy', 'Rõ ràng giới hạn', 'Kiên nhẫn'];
const CANDIDATE_FIELDS = [
  'id',
  '姓名',
  '性别',
  '种族',
  '年龄段',
  '来源地',
  '评级',
  '期望日薪',
  '市场签约价格',
  '擅长项目',
  '性格关键词',
  '经历简介',
  '应聘动机',
  '特殊说明',
] as const;
const PROFILE_FIELDS = [
  '基础身份',
  '外貌特征',
  '性格核心',
  '经历',
  '应聘动机',
  '擅长与短板',
  '服务风格',
  '说话方式',
  '边界与禁忌',
  '关系发展原则',
  '日常习惯',
  '可持续剧情钩子',
] as const;
const WORLDBOOK_FIELDS = ['entryId', 'entryName', 'activation', 'enabled', 'content'] as const;
const PROFILE_STRING_LIMITS: Record<Exclude<(typeof PROFILE_FIELDS)[number], '性格核心' | '可持续剧情钩子'>, number> = {
  基础身份: 800,
  外貌特征: 800,
  经历: 1200,
  应聘动机: 600,
  擅长与短板: 800,
  服务风格: 600,
  说话方式: 600,
  边界与禁忌: 600,
  关系发展原则: 600,
  日常习惯: 600,
};
const PROFILE_TRANSACTION_TERMS = ['nhân viên chính thức', 'đã nhập chức', 'đã bị trừ tiền', 'đã trừ tiền', 'tuyển dụng thành công', 'đã ghi vào world book', 'hoàn tất giao dịch'];
const WORLDBOOK_ENGINEERING_TERMS = ['TODO', 'debug', 'console', 'giao diện sẽ'];

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function cleanText(value: unknown, limit: number): string {
  return typeof value === 'string'
    ? [...value.trim()].map(character => (character.charCodeAt(0) < 32 ? ' ' : character)).join('').slice(0, limit)
    : '';
}

function cleanDateKey(value: unknown): string {
  return cleanText(value, 32);
}

function dateIdPart(date: string): string {
  return date.replace(/\D/g, '').slice(0, 8) || 'unknown';
}

function codePointLength(value: string): number {
  return [...value].length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseStrictJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function assertExactFields(
  value: Record<string, unknown>,
  fields: readonly string[],
  context: string,
  issues: string[],
): void {
  const expected = new Set(fields);
  fields.forEach(field => {
    if (!Object.prototype.hasOwnProperty.call(value, field)) issues.push(`${context} thiếu trường ${field}`);
  });
  Object.keys(value).forEach(field => {
    if (!expected.has(field)) issues.push(`${context} chứa trường không xác định ${field}`);
  });
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readStrictStringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) return null;
  return value.map(item => item.trim());
}

function hasUniqueNonEmptyStrings(values: string[]): boolean {
  return values.every(Boolean) && new Set(values).size === values.length;
}

function makeCandidateContractValue(candidate: Partial<BossAiTalentCandidate>): Record<string, unknown> {
  return Object.fromEntries(CANDIDATE_FIELDS.map(field => [field, candidate[field]]));
}

function collectProfileText(profile: BossAiTalentProfile): string {
  return PROFILE_FIELDS.flatMap(field => {
    const value = profile[field];
    return Array.isArray(value) ? value : [value];
  }).join('\n');
}

export function makeLocalBossAiTalentCandidates(
  date: string,
  excludedNames: string[] = [],
  excludedIds: string[] = [],
): BossAiTalentCandidate[] {
  const excludedNameSet = new Set(excludedNames.map(name => name.trim().toLowerCase()).filter(Boolean));
  const excludedIdSet = new Set(excludedIds.map(id => id.trim().toLowerCase()).filter(Boolean));
  const seed = stableHash(date);
  const count = 1 + (seed % 3);
  const candidates: BossAiTalentCandidate[] = [];
  for (let offset = 0; offset < LOCAL_NAMES.length && candidates.length < count; offset += 1) {
    const index = (seed + offset * 3) % LOCAL_NAMES.length;
    const name = LOCAL_NAMES[index];
    const id = `ai-market-${dateIdPart(date)}-${String(candidates.length + 1).padStart(2, '0')}-${stableHash(`${date}:${name}`).toString(36).slice(0, 5)}`;
    if (excludedNameSet.has(name.toLowerCase()) || excludedIdSet.has(id.toLowerCase())) continue;
    const grade = (['B', 'A', 'S'] as const)[(seed + offset) % 3];
    const salary = { B: 980, A: 1480, S: 2180 }[grade] + ((seed >>> (offset % 8)) % 5) * 60;
    candidates.push({
      id,
      姓名: name,
      性别: LOCAL_GENDERS[(seed + offset) % LOCAL_GENDERS.length],
      种族: LOCAL_SPECIES[(seed + offset * 2) % LOCAL_SPECIES.length],
      年龄段: `${22 + ((seed + offset * 7) % 16)} tuổi`,
      来源地: LOCAL_ORIGINS[(seed + offset) % LOCAL_ORIGINS.length],
      评级: grade,
      期望日薪: salary,
      市场签约价格: Math.round((salary * ({ B: 24, A: 30, S: 38 }[grade])) / 100) * 100,
      擅长项目: [
        LOCAL_PROJECTS[(seed + offset) % LOCAL_PROJECTS.length],
        LOCAL_PROJECTS[(seed + offset + 2) % LOCAL_PROJECTS.length],
      ],
      性格关键词: [
        LOCAL_TRAITS[(seed + offset) % LOCAL_TRAITS.length],
        LOCAL_TRAITS[(seed + offset + 3) % LOCAL_TRAITS.length],
      ],
      经历简介: 'Có hồ sơ phục vụ đăng ký độc lập, chi tiết kinh nghiệm sẽ được bổ sung khi ký hợp đồng nhân vật chính thức.',
      应聘动机: 'Mong muốn tìm một môi trường làm việc lâu dài, ổn định và có ranh giới trách nhiệm rõ ràng.',
      特殊说明: 'NPC thuần dự phòng cục bộ, không liên quan đến bất kỳ OC hay tư liệu nào hiện có.',
      生成日期: date,
      来源标记: 'ai-market',
    });
  }
  return candidates;
}

export function makeBossAiTalentMarketState(
  date: string,
  excludedNames: string[] = [],
  excludedIds: string[] = [],
): BossAiTalentMarketState {
  return {
    version: 1,
    生成日期: date,
    已尝试生成: false,
    来源: 'fallback',
    候选: makeLocalBossAiTalentCandidates(date, excludedNames, excludedIds),
    问题: [],
  };
}

export function parseBossAiTalentCandidates(
  raw: string,
  options: {
    date: string;
    excludedNames?: string[];
    excludedIds?: string[];
    allowedProjects?: string[];
  },
): BossAiTalentParseResult {
  const parsed = parseStrictJson(raw);
  const issues: string[] = [];
  if (!isRecord(parsed)) {
    return { ok: false, candidates: [], issues: ['Đầu ra ứng viên AI phải là một đối tượng JSON hoàn chỉnh'] };
  }
  assertExactFields(parsed, ['candidates'], 'Đối tượng cấp cao nhất', issues);
  const rows = Array.isArray(parsed.candidates) ? parsed.candidates : [];
  if (!Array.isArray(parsed.candidates)) issues.push('candidates phải là một mảng');
  if (rows.length < 1 || rows.length > 3) issues.push('Số lượng ứng viên phải từ 1～3');
  const excludedNames = new Set((options.excludedNames ?? []).map(item => item.trim().toLowerCase()).filter(Boolean));
  const excludedIds = new Set((options.excludedIds ?? []).map(item => item.trim().toLowerCase()).filter(Boolean));
  const seenNames = new Set<string>();
  const seenIds = new Set<string>();
  const allowedProjects = new Set(options.allowedProjects ?? LOCAL_PROJECTS);
  const candidates: BossAiTalentCandidate[] = [];

  rows.forEach((row, index) => {
    const context = `Ứng viên thứ ${index + 1}`;
    const issueCountBefore = issues.length;
    if (!isRecord(row)) {
      issues.push(`${context} không phải là đối tượng`);
      return;
    }
    assertExactFields(row, CANDIDATE_FIELDS, context, issues);
    const id = readString(row.id);
    const name = readString(row.姓名);
    const gender = readString(row.性别);
    const species = readString(row.种族);
    const ageGroup = readString(row.年龄段);
    const origin = readString(row.来源地);
    const grade = readString(row.评级) as BossAiTalentGrade;
    const salary = row.期望日薪;
    const signingPrice = row.市场签约价格;
    const projects = readStrictStringList(row.擅长项目);
    const traits = readStrictStringList(row.性格关键词);
    const experience = typeof row.经历简介 === 'string' ? row.经历简介.trim() : '';
    const motivation = typeof row.应聘动机 === 'string' ? row.应聘动机.trim() : '';
    const note = typeof row.特殊说明 === 'string' ? row.特殊说明.trim() : '';

    if (!/^ai-market-[a-z0-9-]{8,70}$/.test(id)) issues.push(`${context} ID không hợp lệ`);
    if (!name) issues.push(`${context} thiếu tên`);
    if (!gender) issues.push(`${context} thiếu giới tính`);
    if (!species) issues.push(`${context} thiếu chủng tộc`);
    if (!ageGroup) issues.push(`${context} thiếu độ tuổi`);
    if (!origin) issues.push(`${context} thiếu nơi xuất thân`);
    if (!['B', 'A', 'S'].includes(grade)) issues.push(`${context} đánh giá không hợp lệ`);
    if (typeof salary !== 'number' || !Number.isInteger(salary) || salary < 300 || salary > 20_000) {
      issues.push(`${context} lương ngày kỳ vọng không hợp lệ`);
    }
    if (typeof signingPrice !== 'number' || !Number.isInteger(signingPrice) || signingPrice < 1_000 || signingPrice > 2_000_000) {
      issues.push(`${context} giá ký hợp đồng thị trường không hợp lệ`);
    }
    if (!projects || projects.length < 1 || !hasUniqueNonEmptyStrings(projects) || projects.some(project => !allowedProjects.has(project))) {
      issues.push(`${context} hạng mục sở trường không hợp lệ`);
    }
    if (
      !traits ||
      traits.length < 1 ||
      traits.length > 6 ||
      !hasUniqueNonEmptyStrings(traits) ||
      traits.some(trait => codePointLength(trait) > 24)
    ) {
      issues.push(`${context} từ khóa tính cách không hợp lệ`);
    }
    if (typeof row.经历简介 !== 'string' || codePointLength(experience) > 360) issues.push(`${context} tóm tắt kinh nghiệm không hợp lệ`);
    if (typeof row.应聘动机 !== 'string' || codePointLength(motivation) > 240) issues.push(`${context} động cơ ứng tuyển không hợp lệ`);
    if (typeof row.特殊说明 !== 'string' || codePointLength(note) > 240) issues.push(`${context} ghi chú đặc biệt không hợp lệ`);
    const normalizedName = name.toLowerCase();
    const normalizedId = id.toLowerCase();
    if (excludedNames.has(normalizedName) || seenNames.has(normalizedName)) issues.push(`Tên ứng viên trùng lặp: ${name}`);
    if (excludedIds.has(normalizedId) || seenIds.has(normalizedId)) issues.push(`ID ứng viên trùng lặp: ${id}`);
    if (issues.length > issueCountBefore) return;

    seenNames.add(normalizedName);
    seenIds.add(normalizedId);
    candidates.push({
      id,
      姓名: name,
      性别: gender,
      种族: species,
      年龄段: ageGroup,
      来源地: origin,
      评级: grade,
      期望日薪: salary as number,
      市场签约价格: signingPrice as number,
      擅长项目: projects as string[],
      性格关键词: traits as string[],
      经历简介: experience,
      应聘动机: motivation,
      特殊说明: note,
      生成日期: options.date,
      来源标记: 'ai-market',
    });
  });

  return { ok: issues.length === 0 && candidates.length === rows.length, candidates, issues };
}

export function parseBossAiTalentFullProfile(
  raw: string,
  options: {
    candidate: BossAiTalentCandidate;
    excludedNames?: string[];
  },
): BossAiTalentFullProfileParseResult {
  const parsed = parseStrictJson(raw);
  const issues: string[] = [];
  if (!isRecord(parsed)) return { ok: false, value: null, issues: ['Đầu ra hồ sơ nhân vật đầy đủ phải là một đối tượng JSON hoàn chỉnh'] };
  assertExactFields(parsed, ['version', 'candidateId', '姓名', 'profile', 'worldbook'], 'Đối tượng cấp cao nhất', issues);
  if (parsed.version !== 1) issues.push('version phải chính xác là 1');
  if (parsed.candidateId !== options.candidate.id) issues.push('candidateId không khớp với ứng viên');
  if (parsed.姓名 !== options.candidate.姓名) issues.push('Tên không khớp với ứng viên');

  const profileSource = isRecord(parsed.profile) ? parsed.profile : null;
  const worldbookSource = isRecord(parsed.worldbook) ? parsed.worldbook : null;
  if (!profileSource) issues.push('profile phải là một đối tượng');
  if (!worldbookSource) issues.push('worldbook phải là một đối tượng');
  if (!profileSource || !worldbookSource) return { ok: false, value: null, issues };
  assertExactFields(profileSource, PROFILE_FIELDS, 'profile', issues);
  assertExactFields(worldbookSource, WORLDBOOK_FIELDS, 'worldbook', issues);

  const profile = {} as BossAiTalentProfile;
  (Object.entries(PROFILE_STRING_LIMITS) as Array<[keyof typeof PROFILE_STRING_LIMITS, number]>).forEach(([field, limit]) => {
    const value = readString(profileSource[field]);
    if (!value || codePointLength(value) > limit) issues.push(`profile.${field} phải dài từ 1～${limit} ký tự Unicode`);
    profile[field] = value;
  });
  const personality = readStrictStringList(profileSource.性格核心);
  if (!personality || personality.length < 2 || personality.length > 8 || !hasUniqueNonEmptyStrings(personality)) {
    issues.push('profile.性格核心 phải có 2～8 mục chuỗi không trùng lặp và không rỗng');
  }
  profile.性格核心 = personality ?? [];
  const hooks = readStrictStringList(profileSource.可持续剧情钩子);
  if (!hooks || hooks.length < 2 || !hasUniqueNonEmptyStrings(hooks)) {
    issues.push('profile.可持续剧情钩子 phải có ít nhất 2 mục chuỗi không trùng lặp và không rỗng');
  }
  profile.可持续剧情钩子 = hooks ?? [];

  const expectedEntryId = `character.profile.${options.candidate.id}`;
  const expectedEntryName = `[未开之花][AI角色] ${options.candidate.姓名}`;
  const content = readString(worldbookSource.content);
  if (worldbookSource.entryId !== expectedEntryId) issues.push(`worldbook.entryId phải chính xác bằng ${expectedEntryId}`);
  if (worldbookSource.entryName !== expectedEntryName) issues.push(`worldbook.entryName phải chính xác bằng ${expectedEntryName}`);
  if (worldbookSource.activation !== 'manual') issues.push('worldbook.activation phải chính xác là manual');
  if (worldbookSource.enabled !== false) issues.push('worldbook.enabled phải chính xác là false');
  const contentLength = codePointLength(content);
  if (contentLength < 200 || contentLength > 4000) issues.push('worldbook.content phải dài từ 200～4000 ký tự Unicode');

  const profileText = collectProfileText(profile);
  PROFILE_TRANSACTION_TERMS.forEach(term => {
    if (profileText.includes(term)) issues.push(`profile không được chứa tuyên bố giao dịch: ${term}`);
    if (content.includes(term)) issues.push(`worldbook.content không được chứa tuyên bố giao dịch hoặc kỹ thuật: ${term}`);
  });
  WORLDBOOK_ENGINEERING_TERMS.forEach(term => {
    if (content.toLowerCase().includes(term.toLowerCase())) issues.push(`worldbook.content không được chứa từ ngữ kỹ thuật: ${term}`);
  });
  const combinedText = `${profileText}\n${content}`.toLowerCase();
  (options.excludedNames ?? [])
    .map(name => name.trim())
    .filter(Boolean)
    .forEach(name => {
      if (combinedText.includes(name.toLowerCase())) issues.push(`Hồ sơ nhân vật đầy đủ trùng với tên nhân vật bị loại trừ: ${name}`);
    });

  if (issues.length > 0) return { ok: false, value: null, issues };
  return {
    ok: true,
    issues: [],
    value: {
      version: 1,
      candidateId: options.candidate.id,
      姓名: options.candidate.姓名,
      profile,
      worldbook: {
        entryId: expectedEntryId,
        entryName: expectedEntryName,
        activation: 'manual',
        enabled: false,
        content,
      },
    },
  };
}

export function normalizeBossAiTalentMarketState(
  value: unknown,
  date: string,
  excludedNames: string[] = [],
  excludedIds: string[] = [],
): BossAiTalentMarketState {
  const fallback = makeBossAiTalentMarketState(date, excludedNames, excludedIds);
  if (!isRecord(value)) return fallback;
  const source = value as Partial<BossAiTalentMarketState>;
  if (cleanDateKey(source.生成日期) !== date) return fallback;
  if (source.已尝试生成 === true && Array.isArray(source.候选) && source.候选.length === 0) {
    return {
      version: 1,
      生成日期: date,
      已尝试生成: true,
      来源: source.来源 === 'ai' ? 'ai' : 'fallback',
      候选: [],
      问题: Array.isArray(source.问题) ? source.问题.map(item => cleanText(item, 180)).filter(Boolean).slice(0, 12) : [],
    };
  }
  const runtimeCandidates = Array.isArray(source.候选)
    ? source.候选.map(candidate => isRecord(candidate) ? makeCandidateContractValue(candidate) : candidate)
    : [];
  const parsed = parseBossAiTalentCandidates(JSON.stringify({ candidates: runtimeCandidates }), {
    date,
    excludedNames,
    excludedIds,
  });
  return {
    version: 1,
    生成日期: date,
    已尝试生成: source.已尝试生成 === true,
    来源: source.来源 === 'ai' && parsed.ok ? 'ai' : 'fallback',
    候选: parsed.ok ? parsed.candidates : fallback.候选,
    问题: Array.isArray(source.问题) ? source.问题.map(item => cleanText(item, 180)).filter(Boolean).slice(0, 12) : parsed.issues,
  };
}

export function markBossAiTalentMarketFallback(
  state: BossAiTalentMarketState,
  issues: string[] = [],
): BossAiTalentMarketState {
  return {
    ...state,
    已尝试生成: true,
    来源: 'fallback',
    问题: issues.map(item => cleanText(item, 180)).filter(Boolean).slice(0, 12),
  };
}

export function applyBossAiTalentMarketResponse(
  state: BossAiTalentMarketState,
  raw: string,
  options: Omit<Parameters<typeof parseBossAiTalentCandidates>[1], 'date'>,
): BossAiTalentMarketState {
  const parsed = parseBossAiTalentCandidates(raw, { ...options, date: state.生成日期 });
  if (!parsed.ok) return markBossAiTalentMarketFallback(state, parsed.issues);
  return {
    version: 1,
    生成日期: state.生成日期,
    已尝试生成: true,
    来源: 'ai',
    候选: parsed.candidates,
    问题: [],
  };
}
