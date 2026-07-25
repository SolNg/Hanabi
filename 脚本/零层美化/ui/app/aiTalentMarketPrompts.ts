import promptContract from '../../prompts/aiTalentMarketPrompts.md?raw';
import type { BossAiTalentCandidate } from './aiTalentMarket';

type InjectItem = Omit<InjectionPrompt, 'id'>;

export type BossAiTalentCandidatePromptInput = {
  task: 'generateAiTalentCandidates';
  date: string;
  businessDay: number;
  businessPhase: string;
  shopLevel: number;
  shopRating: number;
  currentFunds: number;
  recruitPressure: string;
  allowedProjects: string[];
  excludedNames: string[];
  excludedIds: string[];
};

export type BossAiTalentFullProfilePromptInput = {
  task: 'generateAiTalentFullProfile';
  candidate: Omit<BossAiTalentCandidate, '生成日期' | '来源标记'>;
  shopContext: {
    shopName: '未开之花';
    businessDay: number;
    businessPhase: string;
    shopLevel: number;
    currentProjects: string[];
  };
  userProfile: {
    name: string;
    gender: string;
  };
  excludedNames: string[];
  excludedIds: string[];
  worldRules: string;
};

export type BossAiTalentGenerationRequest = {
  userInput: string;
  injects: InjectItem[];
};

function extractFencedBlock(heading: string, language = 'text'): string {
  const headingIndex = promptContract.indexOf(heading);
  if (headingIndex < 0) throw new Error(`Prompt chợ nhân tài AI thiếu chương: ${heading}`);
  const sectionEnd = promptContract.indexOf('\n### ', headingIndex + heading.length);
  const section = promptContract.slice(headingIndex, sectionEnd < 0 ? promptContract.length : sectionEnd);
  const match = new RegExp('```' + language + '\\r?\\n([\\s\\S]*?)```').exec(section);
  const content = match?.[1]?.trim();
  if (!content) throw new Error(`Chương prompt chợ nhân tài AI không có khối code ${language}: ${heading}`);
  return content;
}

const DAILY_SYSTEM_PROMPT = extractFencedBlock('### 1.1 系统提示词正文');
const DAILY_RETRY_PROMPT = extractFencedBlock('### 1.5 重试提示词');
const FULL_PROFILE_SYSTEM_PROMPT = extractFencedBlock('### 2.1 系统提示词正文');
const FULL_PROFILE_RETRY_PROMPT = extractFencedBlock('### 2.4 校验失败重试提示词');

function makeSystemInject(content: string): InjectItem {
  return {
    position: 'in_chat',
    depth: 0,
    role: 'system',
    content,
    should_scan: false,
  };
}

function formatIssues(issues: string[]): string {
  return issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n');
}

function makeCandidateContractValue(candidate: BossAiTalentCandidate): BossAiTalentFullProfilePromptInput['candidate'] {
  return {
    id: candidate.id,
    姓名: candidate.姓名,
    性别: candidate.性别,
    种族: candidate.种族,
    年龄段: candidate.年龄段,
    来源地: candidate.来源地,
    评级: candidate.评级,
    期望日薪: candidate.期望日薪,
    市场签约价格: candidate.市场签约价格,
    擅长项目: [...candidate.擅长项目],
    性格关键词: [...candidate.性格关键词],
    经历简介: candidate.经历简介,
    应聘动机: candidate.应聘动机,
    特殊说明: candidate.特殊说明,
  };
}

export function makeBossAiTalentCandidateGenerationRequest(
  input: BossAiTalentCandidatePromptInput,
  retryIssues: string[] = [],
): BossAiTalentGenerationRequest {
  const retry = retryIssues.length > 0
    ? DAILY_RETRY_PROMPT.replace('{issues}', formatIssues(retryIssues))
    : '';
  return {
    userInput: JSON.stringify(input, null, 2),
    injects: [makeSystemInject([DAILY_SYSTEM_PROMPT, retry].filter(Boolean).join('\n\n'))],
  };
}

export function makeBossAiTalentFullProfilePromptInput({
  candidate,
  businessDay,
  businessPhase,
  shopLevel,
  currentProjects,
  userName,
  userGender,
  excludedNames,
  excludedIds,
}: {
  candidate: BossAiTalentCandidate;
  businessDay: number;
  businessPhase: string;
  shopLevel: number;
  currentProjects: string[];
  userName: string;
  userGender: string;
  excludedNames: string[];
  excludedIds: string[];
}): BossAiTalentFullProfilePromptInput {
  return {
    task: 'generateAiTalentFullProfile',
    candidate: makeCandidateContractValue(candidate),
    shopContext: {
      shopName: '未开之花',
      businessDay,
      businessPhase,
      shopLevel,
      currentProjects,
    },
    userProfile: {
      name: userName,
      gender: userGender,
    },
    excludedNames,
    excludedIds,
    worldRules: 'Cảnh kinh doanh suối nước nóng đô thị hiện đại. Chủng tộc kỳ ảo hợp lý tồn tại nhưng không phá vỡ tông sinh hoạt đời thường. Nhân viên có ranh giới nghề nghiệp và ý chí cá nhân rõ ràng.',
  };
}

export function makeBossAiTalentFullProfileGenerationRequest(
  input: BossAiTalentFullProfilePromptInput,
  retryIssues: string[] = [],
): BossAiTalentGenerationRequest {
  const retry = retryIssues.length > 0
    ? FULL_PROFILE_RETRY_PROMPT
        .replace('{issues}', formatIssues(retryIssues))
        .replaceAll('{candidateId}', input.candidate.id)
        .replaceAll('{candidateName}', input.candidate.姓名)
    : '';
  return {
    userInput: JSON.stringify(input, null, 2),
    injects: [makeSystemInject([FULL_PROFILE_SYSTEM_PROMPT, retry].filter(Boolean).join('\n\n'))],
  };
}
