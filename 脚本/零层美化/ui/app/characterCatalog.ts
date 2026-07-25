export type TangquanCharacterDefinition = {
  id: string;
  name: string;
  femaleUserOnly?: boolean;
};

export const TANGQUAN_CHARACTER_DEFINITIONS: readonly TangquanCharacterDefinition[] = [
  { id: '114', name: '114' },
  { id: '238', name: '238' },
  { id: 'aet', name: 'AET' },
  { id: 'atri', name: 'atri' },
  { id: 'catiemm', name: 'catiemm' },
  { id: 'coin', name: 'coin' },
  { id: 'gg', name: 'GG' },
  { id: 'ix', name: 'IX' },
  { id: 'mag', name: 'mag' },
  { id: 'ppp', name: 'PPP' },
  { id: 'ruoyun', name: 'ruoyun' },
  { id: 'tap', name: 'tap' },
  { id: 'valerie', name: 'valerie' },
  { id: 'ha-mu', name: 'Cáp Mẫu' },
  { id: 'de-yu-huo', name: 'Địa Ngục Hỏa' },
  { id: 'nai-lao-yu', name: 'Cá Phô Mai' },
  { id: 'xiao-suo', name: 'Tiểu Sách' },
  { id: 'wang-que', name: 'Vong Khước' },
  { id: 'ming-yue', name: 'Minh Nguyệt' },
  { id: 'xing-chen', name: 'Tinh Trần' },
  { id: 'yang-cong', name: 'Hành Tây' },
  { id: 'shuo-han', name: 'Thước Hàn' },
  { id: 'ai-li-si', name: 'Alice' },
  { id: 'hu-po-san', name: 'Hổ Phách Tán' },
  { id: 'qin-yin', name: 'Cầm Âm' },
  { id: 'bai-xing', name: 'Bạch Tinh', femaleUserOnly: true },
  { id: 'bai-ning', name: 'Bạch Ninh' },
  { id: 'gai-ci-bi', name: 'Gatsby' },
  { id: 'zhu-xi', name: 'Chúc Tịch' },
  { id: 'shen-fu', name: 'Thần Phụ' },
  { id: 'nuo-mi-ji', name: 'Xôi Gà' },
  { id: 'ba-si-te', name: 'Bastet' },
  { id: 'mo-li', name: 'Mạt Lị' },
  { id: 'lai-mu', name: 'Lime' },
  { id: 'luo-bo', name: 'Củ Cải' },
  { id: 'jing-jie', name: 'Cảnh Giới' },
  { id: 'qing-kong-li', name: 'Thanh Không Lị' },
  { id: 'yu-bing', name: 'Ngư Băng' },
  { id: 'ame', name: 'ame' },
  { id: 'cc', name: 'CC' },
  { id: 'dcd', name: 'DCD' },
  { id: 'durvis', name: 'durvis' },
  { id: 'envysoul', name: 'envysoul' },
  { id: 'e-da-mo', name: 'E Đại Ma' },
  { id: 'karkarsu', name: 'karkarsu' },
  { id: 'kcq', name: 'kcq' },
  { id: 'lirika', name: 'lirika' },
  { id: 'po', name: 'po' },
  { id: 'ramiel', name: 'ramiel' },
  { id: 'samb', name: 'samb' },
  { id: 'soliumbra', name: 'soliumbra' },
  { id: 'xian-ren', name: 'Tiên Nhân' },
  { id: 'lan-chen', name: 'Lan Thần' },
  { id: 'ban-feng', name: 'Bán Phong' },
  { id: 'ye-ming-zi', name: 'Diệp Danh Tự' },
  { id: 'ka-fei', name: 'Cà Phê' },
  { id: 'xia-ling', name: 'Hạ Linh' },
  { id: 'tian-zun', name: 'Thiên Tôn' },
  { id: 'tian-cheng', name: 'Thiên Xứng' },
  { id: 'tai-bai', name: 'Thái Bạch' },
  { id: 'xiao-liu-li', name: 'Tiểu Lưu Ly' },
  { id: 'xiao-hua', name: 'Tiểu Hoa' },
  { id: 'qing-kong', name: 'Tình Không' },
  { id: 'guo-zhi-cha', name: 'Trà Hoa Quả' },
  { id: 'you-zi', name: 'Bưởi' },
  { id: 'you-ge', name: 'Do Cách' },
  { id: 'long', name: 'Long' },
  { id: 'hu-po', name: 'Hổ Phách' },
  { id: 'lin-ke', name: 'Lâm Khả' },
  { id: 'mei-ling', name: 'Mỹ Linh' },
  { id: 'dan-huang-jiang', name: 'Mayonnaise' },
  { id: 'shi-yin', name: 'Thi Âm' },
  { id: 'dou-ni', name: 'Đậu Nghiền' },
  { id: 'xing-xing', name: 'Tỉnh Tỉnh' },
  { id: 'nan-dao-shuo', name: 'Chẳng Lẽ' },
  { id: 'huang-dou-fen', name: 'Bột Đậu Nành' },
] as const;

const CHARACTER_BY_ID = new Map(TANGQUAN_CHARACTER_DEFINITIONS.map(character => [character.id, character]));
const CHARACTER_BY_NAME = new Map(TANGQUAN_CHARACTER_DEFINITIONS.map(character => [character.name, character]));

export function findTangquanCharacter(nameOrId: string): TangquanCharacterDefinition | null {
  const normalizedId = nameOrId.trim().toLowerCase();
  return CHARACTER_BY_NAME.get(nameOrId.trim()) ?? CHARACTER_BY_ID.get(normalizedId) ?? null;
}

export function isTangquanCharacterAllowed(nameOrId: string, femaleUser: boolean): boolean {
  const character = findTangquanCharacter(nameOrId);
  return !character || !character.femaleUserOnly || femaleUser;
}

export function listTangquanCharacters(femaleUser: boolean): TangquanCharacterDefinition[] {
  return TANGQUAN_CHARACTER_DEFINITIONS.filter(character => !character.femaleUserOnly || femaleUser).map(character => ({
    ...character,
  }));
}

export function makeTangquanCharacterEntryId(nameOrId: string): string {
  const character = findTangquanCharacter(nameOrId);
  return character ? `character.profile.${character.id}` : '';
}

export function makeTangquanCharacterEntryName(nameOrId: string): string {
  const character = findTangquanCharacter(nameOrId);
  return character ? `[未开之花][角色] ${character.name}` : '';
}
