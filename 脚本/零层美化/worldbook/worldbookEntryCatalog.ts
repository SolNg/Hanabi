import type { BossInfrastructureKey } from '../ui/app/bossEconomy';

type LeveledEntry = {
  id: string;
  name: string;
  label: string;
  level: number;
};

export const TANGQUAN_INFRASTRUCTURE_NAMES: readonly BossInfrastructureKey[] = [
  '占地规模',
  '前台接待',
  '更衣清洗',
  '汤池',
  '休息区',
  '理疗区',
  '包间',
  '餐饮区',
  '客房',
  '庭院',
  '员工休息室',
  '后勤',
];

export const TANGQUAN_BUILDING_NAMES = [
  '前台大厅',
  '更衣清洗区',
  '室内大浴场',
  '榻榻米休息室',
  '按摩室',
  '简易包间',
  '茶点角',
  '简易客房',
  '庭院小径',
  '员工休息室',
  '办公室与仓储',
  '药汤池',
  '精油理疗室',
  '香氛蒸房',
  '茶饮漫画休息区',
  '足汤茶亭',
  '包间汤池',
  '料理台',
  '洗衣仓储间',
  '露天风吕',
  '岩盘浴室',
  '和室客房',
  '静音书廊',
  '药草护理室',
  '美容护理间',
  '榻榻米餐饮包间',
  '排班管理室',
  '员工夜班宿舍',
  '会员休息廊',
  '集中补给间',
  '夜间休息厅',
  '季节汤庭',
  '会席厨房',
  'VIP庭院私汤',
  '长住客房',
  '员工培训室',
  '团体包场区',
  '天台观景汤',
  '私宅式客房',
  '别馆',
] as const;

export const TANGQUAN_PROJECT_NAMES = [
  '入浴休憩',
  '休息区陪同',
  '理疗按摩',
  '包间休憩',
  '药汤护理',
  '私汤包间',
  '精油理疗',
  '香氛蒸房',
  '足汤茶会',
  '露天夜汤',
  '岩盘热敷',
  '餐饮套餐',
  '静音长休',
  '美容护理',
  '会员夜茶',
  '季节限定汤',
  '会席料理',
  '住宿包场',
  'VIP庭院私汤',
  '团体包场',
  '私宅长住',
  '天台观景汤',
  '别馆整宿预约',
] as const;

export const TANGQUAN_AREA_TO_BUILDING: Record<string, string> = {
  大堂: '前台大厅',
  前台: '前台大厅',
  前台大厅: '前台大厅',
  更衣清洗: '更衣清洗区',
  更衣清洗区: '更衣清洗区',
  汤池: '室内大浴场',
  室内大浴场: '室内大浴场',
  休息室: '榻榻米休息室',
  休息区: '榻榻米休息室',
  榻榻米休息室: '榻榻米休息室',
  理疗区: '按摩室',
  按摩室: '按摩室',
  包间: '简易包间',
  简易包间: '简易包间',
  餐饮区: '茶点角',
  茶点角: '茶点角',
  客房: '简易客房',
  简易客房: '简易客房',
  庭院: '庭院小径',
  庭院小径: '庭院小径',
  员工休息室: '员工休息室',
  办公室: '办公室与仓储',
  后勤: '办公室与仓储',
  办公室与仓储: '办公室与仓储',
};

export const TANGQUAN_PROJECT_TO_BUILDING: Record<string, string> = {
  入浴休憩: '室内大浴场',
  休息区陪同: '榻榻米休息室',
  理疗按摩: '按摩室',
  包间休憩: '简易包间',
  药汤护理: '药汤池',
  私汤包间: '包间汤池',
  精油理疗: '精油理疗室',
  香氛蒸房: '香氛蒸房',
  足汤茶会: '足汤茶亭',
  露天夜汤: '露天风吕',
  岩盘热敷: '岩盘浴室',
  餐饮套餐: '料理台',
  静音长休: '静音书廊',
  美容护理: '美容护理间',
  会员夜茶: '会员休息廊',
  季节限定汤: '季节汤庭',
  会席料理: '会席厨房',
  住宿包场: '和室客房',
  VIP庭院私汤: 'VIP庭院私汤',
  团体包场: '团体包场区',
  私宅长住: '私宅式客房',
  天台观景汤: '天台观景汤',
  别馆整宿预约: '别馆',
};

export function makeTangquanInfrastructureEntryId(name: string, level: number): string {
  return `facility.infrastructure.${name}.lv${level}`;
}

export function makeTangquanBuildingEntryId(name: string, level: number): string {
  return `facility.building.${name}.lv${level}`;
}

export function makeTangquanProjectEntryId(name: string): string {
  return `project.lore.${name}`;
}

function makeLeveledEntries(
  names: readonly string[],
  kind: '基建' | '建筑',
  makeId: (name: string, level: number) => string,
): LeveledEntry[] {
  return names.flatMap(label =>
    [1, 2, 3, 4, 5].map(level => ({
      id: makeId(label, level),
      name: `[未开之花][${kind}] ${label} Lv${level}`,
      label,
      level,
    })),
  );
}

export function listTangquanInfrastructureEntries(): LeveledEntry[] {
  return makeLeveledEntries(TANGQUAN_INFRASTRUCTURE_NAMES, '基建', makeTangquanInfrastructureEntryId);
}

export function listTangquanBuildingEntries(): LeveledEntry[] {
  return makeLeveledEntries(TANGQUAN_BUILDING_NAMES, '建筑', makeTangquanBuildingEntryId);
}

export function listTangquanProjectEntries() {
  return TANGQUAN_PROJECT_NAMES.map(label => ({
    id: makeTangquanProjectEntryId(label),
    name: `[未开之花][项目] ${label}`,
    label,
  }));
}
