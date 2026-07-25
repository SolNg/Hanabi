export type TangquanTimeVariant = 'day' | 'night';

export type TangquanCharacterMedia = {
  id: string;
  avatars: string[];
  standings: string[];
};

type TangquanBackgroundPair = {
  day: string;
  night: string;
};

export const TANGQUAN_LOGO_URL = 'https://i.postimg.cc/DymJj8H7/LOGO.png';

const CHARACTER_MEDIA_BASE_URL = 'https://sanmingyue-assets-origin.zeabur.app/sanmingyue-assets/assets/role-cards';

type TangquanCharacterMediaAsset = readonly [filename: string, hash: string];

function makeCharacterMediaUrl(
  collection: 'tangquan' | 'tangquan-dlc',
  kind: 'portraits' | 'avatars',
  [filename, hash]: TangquanCharacterMediaAsset,
): string {
  return `${CHARACTER_MEDIA_BASE_URL}/${collection}/characters/${kind}/${encodeURIComponent(filename)}.${hash}.png`;
}

const TANGQUAN_STANDING_ASSETS = [
  ['114', 'acd2f6798137168b'],
  ['1141', '1ce644d06a309d1a'],
  ['1142', '47c4cc9a1c3da076'],
  ['238', 'd8f4610e686a755e'],
  ['2381', 'f3fdfc6c71c50b58'],
  ['AET', 'f27cbfd8bc7d7eec'],
  ['AET1', '51c12d1b7a4e51b3'],
  ['atri', '55140ca42f6e17ce'],
  ['atri1', 'afe076ca960bb7df'],
  ['atri2', '37f56acceaf3984b'],
  ['catiemm', '095cf3acd117d695'],
  ['catiemm1', '1d4584eab36cb4d1'],
  ['coin', '78130a182c623eca'],
  ['coin1', 'a820950ccfede77a'],
  ['GG', 'e3036de2da9b6023'],
  ['GG1', '89ca219be1f6d38a'],
  ['GG2', 'f379148e70835e17'],
  ['IX', 'c35919690223b20b'],
  ['IX1', '9810d4f56dab689f'],
  ['mag', '50d2295496a31327'],
  ['mag1', '8f5ce668ff514d51'],
  ['mag2', '8faa7765d19ade9d'],
  ['mag3', 'c270f789cf6d7e7c'],
  ['ppp', '4ea78784da81f57c'],
  ['ppp1', 'a2222bfd04a02a01'],
  ['ruoyun', 'ac294371bae57203'],
  ['ruoyun1', '886ad99a0c234388'],
  ['tap', '68f4ba6d4448290b'],
  ['tap1', '2e01827173eb02f3'],
  ['valerie', 'ba19ae9308b13b32'],
  ['valerie1', '21c8a46cb43b335c'],
  ['valerie2', '7e58dcf1f04ce060'],
  ['哈姆', '3ab8cfe2b7b35ba2'],
  ['哈姆1', '32f5b02cce63c168'],
  ['地狱火', '56ace595b50b56f0'],
  ['地狱火1', '420e4837d52493fb'],
  ['奶酪鱼', '7e120f19550f6e98'],
  ['奶酪鱼1', 'e5d71e569c082a3c'],
  ['奶酪鱼2', 'f2117d647836ce70'],
  ['小索', 'fab9c1a0d8d15b18'],
  ['小索1', '1aaf222173966abc'],
  ['小索2', '1a86fc10e31642d9'],
  ['小索3', '21526dd8ef3c0eca'],
  ['忘却', 'b5fb59a0c7e508fe'],
  ['明月', '1a219a9937db206b'],
  ['明月1', '04e7e9a32c0c6aaa'],
  ['明月2', '7bffea12ae8c1fb8'],
  ['明月3', 'e6aa1123d784c38d'],
  ['星尘', '68e6ef47d843d5b8'],
  ['星尘1', '437519a1b1ae0a3c'],
  ['洋葱', '92b5d2166bf44621'],
  ['洋葱1', '125982f7dcf2923d'],
  ['洋葱2', 'e08d9dc22025ed66'],
  ['烁寒', '17c4c64b48beaefe'],
  ['烁寒1', 'fbd4828aacab448d'],
  ['烁寒2', '41190741211b1abd'],
  ['爱丽丝', 'fbb2503d8ffb2522'],
  ['爱丽丝1', '52c77d4f73cfae06'],
  ['爱丽丝2', '401f8572955ed5eb'],
  ['琥珀伞', '5b2711c0ef470d37'],
  ['琥珀伞1', '3deece252bbc6c52'],
  ['琴音', '2c0537fd60673e76'],
  ['琴音1', '280eebcc474cc18e'],
  ['琴音2', '5c77a19bc3d5597b'],
  ['白星', '4b28cc55baf4f612'],
  ['白星1', 'a27b7faa0142499c'],
  ['白星2', '7388de003c13327c'],
  ['白柠', '617d77fcc9be510e'],
  ['白柠1', '50f8bfc13cb8482c'],
  ['盖茨比', '2ecb23eeab3b84c2'],
  ['盖茨比1', '032fc0f4ffe30f62'],
  ['祝夕', '4745d898e6c6a7d6'],
  ['祝夕1', '0143a44ab2776d93'],
  ['祝夕2', '046f8d91b0530cec'],
  ['神父', '27691cd8dd9bf2c2'],
  ['神父1', '9dfdc4bb4ce868f7'],
  ['糯米鸡', 'd069a8fc25753087'],
  ['糯米鸡1', '74b8eb28ac07a28b'],
  ['芭丝特', '3be2159c9638fe4c'],
  ['芭丝特1', '78e5ff5770682bcc'],
  ['芭丝特2', 'cc565f4a3c9f006d'],
  ['茉莉', '8ae8020f7c677073'],
  ['茉莉1', '78de55bc9826ac80'],
  ['茉莉2', 'bb7306f559efb5d8'],
  ['莱姆', 'dacbc5047058dae1'],
  ['莱姆1', '0491aa8b170e8c59'],
  ['莱姆2', '6c22a6d7cf53de6a'],
  ['萝卜', 'd541a19ac7b4a051'],
  ['萝卜1', '5488174e19659786'],
  ['萝卜2', 'd10b72538a536675'],
  ['萝卜3', 'a71f133b0d4abc36'],
  ['警戒', '971dd6b47deafc4a'],
  ['警戒1', 'b0e1af458646ac73'],
  ['青空莉', '5e30bd32adce2d52'],
  ['青空莉1', 'dadf41aa8fea1df0'],
  ['青空莉2', 'fbaa8f50e5e2f948'],
  ['青空莉3', 'ceac68edc4062fdf'],
  ['鱼冰', 'bead0bf8d638fa43'],
  ['鱼冰1', '391eb3a3d2086611'],
  ['鱼冰2', 'db9f81bd163d58e3'],
] as const satisfies readonly TangquanCharacterMediaAsset[];

const TANGQUAN_DLC_STANDING_ASSETS = [
  ['ame', '6370a3c0f132e254'],
  ['ame1', 'ab7338bbe88309ab'],
  ['CC', '6305a3a5876d3068'],
  ['CC1', '1e747a8332ac5edf'],
  ['CC2', 'c4d5f17cdd253f6c'],
  ['DCD', 'c5daaa54622c8ab6'],
  ['DCD1', 'f810d344a13abdc9'],
  ['durvis', '4cec125c88a97cc7'],
  ['durvis1', '98e237711acb3ee1'],
  ['durvis2', 'beebd81221c233f4'],
  ['envysoul', '5792049bf2bf429c'],
  ['envysoul1', 'd734cab67cf12243'],
  ['envysoul2', '196008d1dc9af614'],
  ['E大魔', 'c9a61f7812366778'],
  ['E大魔1', 'c39fe1f30ad772a7'],
  ['karkarsu', '916686bab45773c3'],
  ['karkarsu1', 'fce2392b4a9bc870'],
  ['kcq', '1dcb5c1e33d4bec5'],
  ['kcq1', '2c5731d30759def7'],
  ['lirika', '3434f5c071bf498e'],
  ['lirika1', 'ff4e49ae44d66549'],
  ['po', 'b3ae6230be5a5a4f'],
  ['po1', '9522d28b1953ccc6'],
  ['ramiel', '7d85ef27f7138a3a'],
  ['ramiel1', '4e6c7b976c49d538'],
  ['samb', '3e3d4ac3c24208f6'],
  ['soliumbra', '312a23b5c3fdd2f2'],
  ['soliumbra1', '2e8bc2743cc2b175'],
  ['仙人', 'f97cb6967706ce0c'],
  ['仙人1', '16e912f613dca943'],
  ['仙人2', 'ba86fca4480ffe28'],
  ['兰辰', '64f6cfc2042ac874'],
  ['兰辰1', '771a10312532a444'],
  ['半疯', 'e81e07ea9b43e62c'],
  ['半疯1', '08fea5b90c5d7333'],
  ['半疯2', 'f6398c5b87e31b1a'],
  ['叶名字', 'ac27f718094ff591'],
  ['叶名字1', 'cbae0c8e76985406'],
  ['咖啡', '379a34c691608b62'],
  ['夏泠', 'dc1dfc182a278e52'],
  ['夏泠1', '6363eaaf52931dae'],
  ['夏泠2', 'db0177a62f1f1946'],
  ['天尊', 'd3ce5b1c917a5c67'],
  ['天尊1', 'd7d83bec44b118b2'],
  ['天秤', 'a63572342dcb6efb'],
  ['天秤1', '578d545f52ed2247'],
  ['天秤2', '46dbe9c7be551cbb'],
  ['太白', '21b6cf4832e99c49'],
  ['太白1', '59f173db280e56cd'],
  ['小琉璃', '379a34c691608b62'],
  ['小琉璃1', 'bec55660e4cd1e1e'],
  ['小花', '75b02bd0cfced02d'],
  ['小花2', '6af03272df6445c1'],
  ['小花3', 'c3ddceb8f4328ec8'],
  ['晴空', '0910cce68f83f25e'],
  ['晴空1', '29ab9a739975b411'],
  ['晴空2', 'c5ff9a8788fbd98f'],
  ['晴空3', '56c7136e8ad9a618'],
  ['果汁茶', '4028b2e7d771e5dc'],
  ['柚子', '62ca85a920916a00'],
  ['柚子1', 'a2496aa3cb921e22'],
  ['柚子2', '769a7f20fe1af580'],
  ['犹格', '8b2c317e65f963a7'],
  ['犹格1', '11c667a20450a98a'],
  ['珑', '4b3308f42b7a570b'],
  ['琥珀', 'dd327719cf90f87f'],
  ['琥珀1', 'b84018183ae0f34b'],
  ['琳可', '0ad0c8441e54ec30'],
  ['琳可1', '4376a979749b63a6'],
  ['琳可2', 'e0a4c7885d5053e6'],
  ['琳可3', 'ec0be4a3191563ab'],
  ['美玲', '4a180ce4b3b6defa'],
  ['美玲1', 'd748f9261d652e59'],
  ['蛋黄酱', '19128a8c2c769d08'],
  ['蛋黄酱1', '075dfcfa54230c12'],
  ['诗音', '7147815ce7c32ff2'],
  ['诗音1', 'a201a32f94f6ed09'],
  ['诗音2', '9de1108f25bbfa07'],
  ['豆泥', 'a90a14d3bd47de4f'],
  ['豆泥1', 'f29a4f39ba7b4030'],
  ['醒醒', 'e2c54d3a056b458c'],
  ['醒醒1', '4ea16301f94c25ca'],
  ['难道说', 'dd3dac98329dc5f4'],
  ['难道说1', '4555b3c5176773a3'],
] as const satisfies readonly TangquanCharacterMediaAsset[];

const CHARACTER_STANDING_URLS = [
  ...TANGQUAN_STANDING_ASSETS.map(asset => makeCharacterMediaUrl('tangquan', 'portraits', asset)),
  ...TANGQUAN_DLC_STANDING_ASSETS.map(asset => makeCharacterMediaUrl('tangquan-dlc', 'portraits', asset)),
];

const TANGQUAN_AVATAR_ASSETS = [
  ['114', '82f8269adf543506'],
  ['238', '3091a520ecc00dba'],
  ['AET', '645b734b41ad3ac5'],
  ['atri', '16cc1a28767d35b5'],
  ['catiemm', 'fe27f9928ce41aca'],
  ['coin', 'dc09518840d3af2f'],
  ['GG', 'd564971d06c8b978'],
  ['IX', '087cee388248499b'],
  ['mag', 'f450199ea78b003e'],
  ['mag1', 'b62d279ac3f5e149'],
  ['PPP', '27352492311ffafb'],
  ['ruoyun', 'bb0e38ba7c746504'],
  ['tap', 'b1e0287e814c8706'],
  ['valerie', '89058951e21d1c40'],
  ['哈姆', 'a9b4021a4f19f75a'],
  ['地狱火', 'd1ec957e90f401c9'],
  ['奶酪鱼', 'e23dcc6b06eb941e'],
  ['小索', '2295084c0f5d2de9'],
  ['小索1', '2a7d80d6799a3bce'],
  ['忘却', '5979af7f0506970a'],
  ['明月', '41ac7d10fcb5d788'],
  ['明月1', '3d4a0d58788d719a'],
  ['星尘', '1ffe216877462e69'],
  ['洋葱', '7e502f02443c6fa6'],
  ['烁寒', 'f4963336a3df14fd'],
  ['爱丽丝', 'a3d5ca9f3fc8e468'],
  ['琥珀伞', 'e49ff1d368eb2750'],
  ['琴音', 'd127253c91131b1f'],
  ['白星', 'b17f07a18ee06fe6'],
  ['白柠', 'aea045f183cc3a93'],
  ['白柠1', '26726cebb5aff7d3'],
  ['盖茨比', 'a9c0c888999c9d28'],
  ['祝夕', '19a867107529afa8'],
  ['神父', 'a8096cdb2c6015f0'],
  ['糯米鸡', '9d10dfebce52ec4a'],
  ['芭丝特', 'a05eeb416feda06a'],
  ['茉莉', '43dbd69b642bb212'],
  ['莱姆', '90bdd35a9d59d6ae'],
  ['萝卜', '2d11d180db0f3164'],
  ['警戒', '304098f0c1b24bd0'],
  ['青空莉', '0239473cd4599d8d'],
  ['鱼冰', '31be9832d833e5ac'],
] as const satisfies readonly TangquanCharacterMediaAsset[];

const TANGQUAN_DLC_AVATAR_ASSETS = [
  ['ame', 'bb7a16a983226a78'],
  ['ame1', 'ecdb9672214a5713'],
  ['ame2', 'a5378885d7ce0b90'],
  ['CC', '7a288141f4433774'],
  ['CC1', '47fe882f2aa0feab'],
  ['DCD', 'e6f150ea1eae924b'],
  ['DCD1', '067eb1cb2d7e11ba'],
  ['durvis', '8683a79427bb4d9b'],
  ['durvis1', '4d2332e324115b56'],
  ['envysoul', '434af1d62637ead7'],
  ['envysoul1', '70b555f03129723d'],
  ['envysoul2', '34f96e28156908b2'],
  ['E大魔', '9c2292732add85a7'],
  ['E大魔1', 'e3982ce8384ebac3'],
  ['E大魔2', '8dd82afd339e5eeb'],
  ['karkarsu', '1219508bc9a7b7ac'],
  ['karkarsu1', '9d7bd36eaaa4470a'],
  ['kcq', '67667b76cc754f65'],
  ['kcq1', 'e72c590a8164d9c7'],
  ['lirika', 'cbe772b8c82bbe97'],
  ['lirika1', '45d7c922b7f6429f'],
  ['lirika2', '7d98425ce18973e3'],
  ['lirika3', 'd7fb7a2a78aefd7d'],
  ['po', '1b46d4a9b64c8ef5'],
  ['po1', '1e3f83db166e76b1'],
  ['ramiel', '1300db146d3a7eaa'],
  ['ramiel1', '1d4b24b1f26edb25'],
  ['ramiel2', '3218ba8b95b6f448'],
  ['samb1', '6351412abaa0ff89'],
  ['samb2', '9708d94728fb9146'],
  ['sambR', 'e1b04197a2a5d914'],
  ['soliumbra', '42194c0a78301f70'],
  ['soliumbra1', 'd7d440b141d4f21a'],
  ['仙人', '6bc7e655692c7bdb'],
  ['仙人1', 'ed24758299400bb1'],
  ['兰辰', '71b94534dd8f9a7b'],
  ['兰辰1', 'f4a40efeef99b2ec'],
  ['半疯', '4ffd0a2bae683a36'],
  ['半疯1', '2c7878014ab345ca'],
  ['叶名字', '355c1da29246a117'],
  ['叶名字1', 'f375fe97393da78b'],
  ['咖啡', '9fada423e817bd59'],
  ['咖啡1', 'cc38617c69712ead'],
  ['夏泠', '3d47d2a2c1dca0b6'],
  ['夏泠1', '19400b83b40eb607'],
  ['天尊', 'dd4525dea019a887'],
  ['天尊1', '12b2894dc09cd7d1'],
  ['天尊2', '31de3707410f331b'],
  ['天秤', 'ade6fe38f20c8398'],
  ['天秤1', '2a531e55ea0632b0'],
  ['太白', '27d56d9ae1a2cbc5'],
  ['太白1', '48f37c7d086eda62'],
  ['小琉璃', 'dd638ad1115c4b6a'],
  ['小琉璃1', '0bbbfaa3a67a006d'],
  ['小花', '9ec8ab7ffc2b5f03'],
  ['小花1', '424a5f0cf58da4e3'],
  ['晴空', 'f3dcdf8ddc7263c6'],
  ['晴空1', 'e83b776b2d0cc89e'],
  ['果汁茶', '2b39b8b87efd1c16'],
  ['果汁茶1', '9ef64ce2f5eb728c'],
  ['柚子', '1890598ad7749b00'],
  ['柚子1', '9013bac3c623f377'],
  ['柚子2', 'f10d22fb0c520261'],
  ['犹格', '2869048f8ecc3b1c'],
  ['犹格1', '2f382e88a4d02e41'],
  ['珑', 'db3f7129eb8555ba'],
  ['珑1', '921bd301b5ddd795'],
  ['琥珀', '844ae19dc4ccff0b'],
  ['琥珀2', 'dc40672e6b5a60b3'],
  ['琳可', 'e036bb72943caac8'],
  ['琳可1', '400f201bd778a68b'],
  ['美玲', '88d1d243cb9d00ac'],
  ['美玲1', 'b1b76d5203beff48'],
  ['蛋黄酱', '6d9b1cac45daec85'],
  ['蛋黄酱1', '03e085fe9c429eef'],
  ['豆泥', 'e4c2f1ae152f4ead'],
  ['豆泥1', '5589db93b46cb8aa'],
  ['豆泥2', '425877df63610829'],
  ['醒醒', 'd363e77a08d0e9c3'],
  ['醒醒1', '4764db2a5a42030c'],
  ['难道说', '88a6adb6fa8f3ced'],
  ['难道说1', '64be677588c6e76b'],
  ['黄豆粉', '38f5fe76e7bbdf3b'],
  ['黄豆粉1', 'ce29b5afc8dda68b'],
  ['黄豆粉2', '831de4b0cb02426c'],
  ['黄豆粉3', 'cb7954c312107d0c'],
] as const satisfies readonly TangquanCharacterMediaAsset[];

const CHARACTER_AVATAR_URLS = [
  ...TANGQUAN_AVATAR_ASSETS.map(asset => makeCharacterMediaUrl('tangquan', 'avatars', asset)),
  ...TANGQUAN_DLC_AVATAR_ASSETS.map(asset => makeCharacterMediaUrl('tangquan-dlc', 'avatars', asset)),
];

const BACKGROUNDS: Record<string, TangquanBackgroundPair> = {
  'area-annex': {
    day: 'https://i.postimg.cc/s1FT0Fjb/area-annex-day.png',
    night: 'https://i.postimg.cc/0QBWDML5/area-annex-night.png',
  },
  'area-beauty-care': {
    day: 'https://i.postimg.cc/ydbQcgw1/area-beauty-care-day.png',
    night: 'https://i.postimg.cc/W3HWgFQ2/area-beauty-care-night.png',
  },
  'area-bedrock-bath': {
    day: 'https://i.postimg.cc/CLk0MSqk/area-bedrock-bath-day.png',
    night: 'https://i.postimg.cc/sD7zfshS/area-bedrock-bath-night.png',
  },
  'area-changing': {
    day: 'https://i.postimg.cc/4NVG4s9z/area-changing-day.png',
    night: 'https://i.postimg.cc/4NVG4s9p/area-changing-night.png',
  },
  'area-comic-tea': {
    day: 'https://i.postimg.cc/gk8pcmZH/area-comic-tea-day.png',
    night: 'https://i.postimg.cc/yYcK6sZP/area-comic-tea-night.png',
  },
  'area-foot-bath-bar': {
    day: 'https://i.postimg.cc/PrYHfTwM/area-foot-bath-bar-day.png',
    night: 'https://i.postimg.cc/tCWbRpx2/area-foot-bath-bar-night.png',
  },
  'area-garden': {
    day: 'https://i.postimg.cc/CLk0MSqr/area-garden-day.png',
    night: 'https://i.postimg.cc/HkmgVRwt/area-garden-night.png',
  },
  'area-group-reservation': {
    day: 'https://i.postimg.cc/Bn30XkTg/area-group-reservation-day.png',
    night: 'https://i.postimg.cc/CLTyQXQ1/area-group-reservation-night.png',
  },
  'area-guest-room': {
    day: 'https://i.postimg.cc/L6Kdbwb8/area-guest-room-day.png',
    night: 'https://i.postimg.cc/rFX6P3PF/area-guest-room-night.png',
  },
  'area-herbal-bath': {
    day: 'https://i.postimg.cc/jd0VFmFj/area-herbal-bath-day.png',
    night: 'https://i.postimg.cc/YqKcsZsm/area-herbal-bath-night.png',
  },
  'area-herbal-care': {
    day: 'https://i.postimg.cc/NfqhzSzT/area-herbal-care-day.png',
    night: 'https://i.postimg.cc/02RgBFBY/area-herbal-care-night.png',
  },
  'area-indoor-bath': {
    day: 'https://i.postimg.cc/sDdFNqNP/area-indoor-bath-day.png',
    night: 'https://i.postimg.cc/jd0VFmF4/area-indoor-bath-night.png',
  },
  'area-kaiseki-kitchen': {
    day: 'https://i.postimg.cc/pXbN646B/area-kaiseki-kitchen-day.png',
    night: 'https://i.postimg.cc/xTDr4h4R/area-kaiseki-kitchen-night.png',
  },
  'area-kitchen': {
    day: 'https://i.postimg.cc/SN60FdBz/area-kitchen-day.png',
    night: 'https://i.postimg.cc/SN60FdBc/area-kitchen-night.png',
  },
  'area-lobby': {
    day: 'https://i.postimg.cc/DyrVk69Q/area-lobby-day.png',
    night: 'https://i.postimg.cc/bNxXcg7H/area-lobby-night.png',
  },
  'area-long-stay': {
    day: 'https://i.postimg.cc/rF16XjB9/area-long-stay-day.png',
    night: 'https://i.postimg.cc/ZK8ktHGc/area-long-stay-night.png',
  },
  'area-massage': {
    day: 'https://i.postimg.cc/QxQLGm2f/area-massage-day.png',
    night: 'https://i.postimg.cc/HswGDzqh/area-massage-night.png',
  },
  'area-member-lounge': {
    day: 'https://i.postimg.cc/sDYFdmkL/area-member-lounge-day.png',
    night: 'https://i.postimg.cc/tC30QkK8/area-member-lounge-night.png',
  },
  'area-night-lounge': {
    day: 'https://i.postimg.cc/bwp7zbP4/area-night-lounge-day.png',
    night: 'https://i.postimg.cc/4xsDJtGr/area-night-lounge-night.png',
  },
  'area-office': {
    day: 'https://i.postimg.cc/JzMf1J8f/area-office-day.png',
    night: 'https://i.postimg.cc/VkmxYM1w/area-office-night.png',
  },
  'area-oil-therapy': {
    day: 'https://i.postimg.cc/13sk96Py/area-oil-therapy-day.png',
    night: 'https://i.postimg.cc/P5TgtZht/area-oil-therapy-night.png',
  },
  'area-open-air': {
    day: 'https://i.postimg.cc/MpqCWRxZ/area-open-air-day.png',
    night: 'https://i.postimg.cc/dVwbqdvV/area-open-air-night.png',
  },
  'area-private-bath': {
    day: 'https://i.postimg.cc/13sk96P4/area-private-bath-day.png',
    night: 'https://i.postimg.cc/qv4Pkn0z/area-private-bath-night.png',
  },
  'area-private-lodging': {
    day: 'https://i.postimg.cc/g2mCYRdL/area-private-lodging-day.png',
    night: 'https://i.postimg.cc/Mp5hXTKW/area-private-lodging-night.png',
  },
  'area-private-room': {
    day: 'https://i.postimg.cc/Z5H10RKY/area-private-room-day.png',
    night: 'https://i.postimg.cc/Mp5hXTKT/area-private-room-night.png',
  },
  'area-quiet-library': {
    day: 'https://i.postimg.cc/dV6zD1t7/area-quiet-library-day.png',
    night: 'https://i.postimg.cc/8z4qs5P7/area-quiet-library-night.png',
  },
  'area-rest-hall': {
    day: 'https://i.postimg.cc/7Z9pb6Yf/area-rest-hall-day.png',
    night: 'https://i.postimg.cc/bwgKdJN6/area-rest-hall-night.png',
  },
  'area-seasonal-bath': {
    day: 'https://i.postimg.cc/cJJP3SrB/area-seasonal-bath-day.png',
    night: 'https://i.postimg.cc/mrrK9stj/area-seasonal-bath-night.png',
  },
  'area-shift-office': {
    day: 'https://i.postimg.cc/tgg86jYv/area-shift-office-day.png',
    night: 'https://i.postimg.cc/Pqq0DjCn/area-shift-office-night.png',
  },
  'area-sky-bath': {
    day: 'https://i.postimg.cc/HLLFMgrm/area-sky-bath-day.png',
    night: 'https://i.postimg.cc/nLwgYPm8/area-sky-bath-night.png',
  },
  'area-staff-dorm': {
    day: 'https://i.postimg.cc/W4fC6HZc/area-staff-dorm-day.png',
    night: 'https://i.postimg.cc/jjkmQFfr/area-staff-dorm-night.png',
  },
  'area-staff-room': {
    day: 'https://i.postimg.cc/5tkTqRzV/area-staff-room-day.png',
    night: 'https://i.postimg.cc/7LQdMWzD/area-staff-room-night.png',
  },
  'area-steam-room': {
    day: 'https://i.postimg.cc/vmSkLNnG/area-steam-room-day.png',
    night: 'https://i.postimg.cc/SKt37v9S/area-steam-room-night.png',
  },
  'area-supply-center': {
    day: 'https://i.postimg.cc/q7ZSX5KM/area-supply-center-day.png',
    night: 'https://i.postimg.cc/W4fC6HZ3/area-supply-center-night.png',
  },
  'area-tatami-dining': {
    day: 'https://i.postimg.cc/FKn8gBSk/area-tatami-dining-day.png',
    night: 'https://i.postimg.cc/zfP6SchR/area-tatami-dining-night.png',
  },
  'area-tea-corner': {
    day: 'https://i.postimg.cc/xdFhy4mz/area-tea-corner-day.png',
    night: 'https://i.postimg.cc/R0byQDtf/area-tea-corner-night.png',
  },
  'area-training': {
    day: 'https://i.postimg.cc/rpY3CP4x/area-training-day.png',
    night: 'https://i.postimg.cc/j5w9846C/area-training-night.png',
  },
  'area-vip-private-bath': {
    day: 'https://i.postimg.cc/B6LyhB5L/area-vip-private-bath-day.png',
    night: 'https://i.postimg.cc/mDzqdy31/area-vip-private-bath-night.png',
  },
  'area-wash-storage': {
    day: 'https://i.postimg.cc/nzj5dGKD/area-wash-storage-day.png',
    night: 'https://i.postimg.cc/HxcKS90X/area-wash-storage-night.png',
  },
  'area-washitsu-room': {
    day: 'https://i.postimg.cc/4d7M8Qv6/area-washitsu-room-day.png',
    night: 'https://i.postimg.cc/j5w98466/area-washitsu-room-night.png',
  },
  'boss-lobby': {
    day: 'https://i.postimg.cc/NM9VNk8k/boss-lobby-day.png',
    night: 'https://i.postimg.cc/76GcBn1V/boss-lobby-night.png',
  },
  'customer-private-bath': {
    day: 'https://i.postimg.cc/DZJDCPQ5/customer-private-bath-day.png',
    night: 'https://i.postimg.cc/wvyPWQ50/customer-private-bath-night.png',
  },
  'external-city-street': {
    day: 'https://i.postimg.cc/W1rchCw0/external-city-street-day.png',
    night: 'https://i.postimg.cc/wjJY7ZQy/external-city-street-night.png',
  },
  'external-private-suite': {
    day: 'https://i.postimg.cc/pL8Mp4JF/external-private-suite-day.png',
    night: 'https://i.postimg.cc/pX3tVR8g/external-private-suite-night.png',
  },
  'external-riverside-park': {
    day: 'https://i.postimg.cc/6QfshZS9/external-riverside-park-day.png',
    night: 'https://i.postimg.cc/mryxS9qZ/external-riverside-park-night.png',
  },
  'loading-background': {
    day: 'https://i.postimg.cc/76GcBn1t/loading-background-day.png',
    night: 'https://i.postimg.cc/3Rsqz09t/loading-background-night.png',
  },
  'title-entrance': {
    day: 'https://i.postimg.cc/852Yxfww/title-entrance-day.png',
    night: 'https://i.postimg.cc/HxqNF83P/title-entrance-night.png',
  },
  'waiter-staff-room': {
    day: 'https://i.postimg.cc/fLGP1S5q/waiter-staff-room-day.png',
    night: 'https://i.postimg.cc/JnfFSHK2/waiter-staff-room-night.png',
  },
};

const LOCATION_BACKGROUND_KEYS: Record<string, string> = {
  大堂: 'area-lobby',
  前台: 'area-lobby',
  前台大厅: 'area-lobby',
  更衣清洗: 'area-changing',
  更衣清洗区: 'area-changing',
  汤池: 'area-indoor-bath',
  室内大浴场: 'area-indoor-bath',
  休息室: 'area-rest-hall',
  休息区: 'area-rest-hall',
  榻榻米休息室: 'area-rest-hall',
  理疗区: 'area-massage',
  按摩室: 'area-massage',
  包间: 'area-private-room',
  简易包间: 'area-private-room',
  餐饮区: 'area-tea-corner',
  茶点角: 'area-tea-corner',
  客房: 'area-guest-room',
  简易客房: 'area-guest-room',
  庭院: 'area-garden',
  庭院小径: 'area-garden',
  员工休息室: 'area-staff-room',
  办公室: 'area-office',
  后勤: 'area-office',
  办公室与仓储: 'area-office',
  药汤池: 'area-herbal-bath',
  精油理疗室: 'area-oil-therapy',
  香氛蒸房: 'area-steam-room',
  茶饮漫画休息区: 'area-comic-tea',
  足汤茶亭: 'area-foot-bath-bar',
  包间汤池: 'area-private-bath',
  料理台: 'area-kitchen',
  洗衣仓储间: 'area-wash-storage',
  露天风吕: 'area-open-air',
  岩盘浴室: 'area-bedrock-bath',
  和室客房: 'area-washitsu-room',
  静音书廊: 'area-quiet-library',
  药草护理室: 'area-herbal-care',
  美容护理间: 'area-beauty-care',
  榻榻米餐饮包间: 'area-tatami-dining',
  排班管理室: 'area-shift-office',
  员工夜班宿舍: 'area-staff-dorm',
  会员休息廊: 'area-member-lounge',
  集中补给间: 'area-supply-center',
  夜间休息厅: 'area-night-lounge',
  季节汤庭: 'area-seasonal-bath',
  会席厨房: 'area-kaiseki-kitchen',
  VIP庭院私汤: 'area-vip-private-bath',
  长住客房: 'area-long-stay',
  员工培训室: 'area-training',
  团体包场区: 'area-group-reservation',
  天台观景汤: 'area-sky-bath',
  私宅式客房: 'area-private-lodging',
  别馆: 'area-annex',
  城市街道: 'external-city-street',
  店外街道: 'external-city-street',
  私人套房: 'external-private-suite',
  河畔公园: 'external-riverside-park',
};

// Ánh xạ cố định giữa ID nhân vật ổn định và ID tư liệu tên tệp trên server mới.
const CHARACTER_ASSET_ASSIGNMENTS: Record<string, string> = {
  'ha-mu': '哈姆',
  'de-yu-huo': '地狱火',
  'nai-lao-yu': '奶酪鱼',
  'xiao-suo': '小索',
  'wang-que': '忘却',
  'ming-yue': '明月',
  'xing-chen': '星尘',
  'yang-cong': '洋葱',
  'shuo-han': '烁寒',
  'ai-li-si': '爱丽丝',
  'hu-po-san': '琥珀伞',
  'qin-yin': '琴音',
  'bai-xing': '白星',
  'bai-ning': '白柠',
  'gai-ci-bi': '盖茨比',
  'zhu-xi': '祝夕',
  'shen-fu': '神父',
  'nuo-mi-ji': '糯米鸡',
  'ba-si-te': '芭丝特',
  'mo-li': '茉莉',
  'lai-mu': '莱姆',
  'luo-bo': '萝卜',
  'jing-jie': '警戒',
  'qing-kong-li': '青空莉',
  'yu-bing': '鱼冰',
  'e-da-mo': 'E大魔',
  'xian-ren': '仙人',
  'lan-chen': '兰辰',
  'ban-feng': '半疯',
  'ye-ming-zi': '叶名字',
  'ka-fei': '咖啡',
  'xia-ling': '夏泠',
  'tian-zun': '天尊',
  'tian-cheng': '天秤',
  'tai-bai': '太白',
  'xiao-liu-li': '小琉璃',
  'xiao-hua': '小花',
  'qing-kong': '晴空',
  'guo-zhi-cha': '果汁茶',
  'you-zi': '柚子',
  'you-ge': '犹格',
  long: '珑',
  'hu-po': '琥珀',
  'lin-ke': '琳可',
  'mei-ling': '美玲',
  'dan-huang-jiang': '蛋黄酱',
  'shi-yin': '诗音',
  'dou-ni': '豆泥',
  'xing-xing': '醒醒',
  'nan-dao-shuo': '难道说',
  'huang-dou-fen': '黄豆粉',
};

function filenameStem(url: string): string {
  return decodeURIComponent(url.split('/').at(-1) ?? '')
    .replace(/\.[0-9a-f]{16}(?=\.[^.]+$)/i, '')
    .replace(/\.[^.]+$/, '');
}

function normalizeMediaId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'sambr') return 'samb';
  if (/^\d+$/.test(normalized)) {
    if (normalized.startsWith('114')) return '114';
    if (normalized.startsWith('238')) return '238';
    return normalized;
  }
  return normalized.replace(/\d+$/, '');
}

function groupUrls(urls: readonly string[]): Record<string, string[]> {
  return urls.reduce<Record<string, string[]>>((result, url) => {
    const id = normalizeMediaId(filenameStem(url));
    (result[id] ??= []).push(url);
    return result;
  }, {});
}

const groupedAvatars = groupUrls(CHARACTER_AVATAR_URLS);
const groupedStandings = groupUrls(CHARACTER_STANDING_URLS);

export const TANGQUAN_CHARACTER_MEDIA: Record<string, TangquanCharacterMedia> = Object.fromEntries(
  [...new Set([...Object.keys(groupedAvatars), ...Object.keys(groupedStandings)])].map(id => [
    id,
    { id, avatars: groupedAvatars[id] ?? [], standings: groupedStandings[id] ?? [] },
  ]),
);

export const TANGQUAN_CHARACTER_ASSET_IDS = Object.keys(TANGQUAN_CHARACTER_MEDIA);

export function getTangquanTimeVariant(timeText?: string): TangquanTimeVariant {
  const hour = Number.parseInt(timeText?.match(/(?:^|\s)(\d{1,2}):\d{2}/)?.[1] ?? `${new Date().getHours()}`, 10);
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

export function resolveTangquanBackground(location: string, timeText?: string, fallbackKey = 'boss-lobby'): string {
  const key = BACKGROUNDS[location] ? location : (LOCATION_BACKGROUND_KEYS[location] ?? fallbackKey);
  const pair = BACKGROUNDS[key] ?? BACKGROUNDS[fallbackKey] ?? BACKGROUNDS['title-entrance'];
  return pair[getTangquanTimeVariant(timeText)];
}

export function resolveCharacterAssetId(nameOrId: string): string {
  const assigned = CHARACTER_ASSET_ASSIGNMENTS[nameOrId];
  const candidate = normalizeMediaId(assigned ?? nameOrId);
  return TANGQUAN_CHARACTER_MEDIA[candidate] ? candidate : '114';
}

export function resolveKnownCharacterAssetId(nameOrId: string): string | null {
  const assigned = CHARACTER_ASSET_ASSIGNMENTS[nameOrId];
  const candidate = normalizeMediaId(assigned ?? nameOrId);
  return TANGQUAN_CHARACTER_MEDIA[candidate] ? candidate : null;
}

export function resolveCharacterAvatar(nameOrId: string, variant = 0): string {
  const media = TANGQUAN_CHARACTER_MEDIA[resolveCharacterAssetId(nameOrId)];
  return media.avatars[variant] ?? media.avatars[0] ?? media.standings[0] ?? '';
}

export function resolveCharacterStanding(nameOrId: string, variant = 0): string {
  const media = TANGQUAN_CHARACTER_MEDIA[resolveCharacterAssetId(nameOrId)];
  return media.standings[variant] ?? media.standings[0] ?? media.avatars[0] ?? '';
}

export function resolveKnownCharacterStanding(nameOrId: string, variant = 0): string {
  const assetId = resolveKnownCharacterAssetId(nameOrId);
  if (!assetId) return '';
  const media = TANGQUAN_CHARACTER_MEDIA[assetId];
  return media.standings[variant] ?? media.standings[0] ?? media.avatars[0] ?? '';
}

export function normalizeCharacterStandingSuppression(nameOrId: string, requested: unknown): boolean {
  return requested === true && !resolveKnownCharacterAssetId(nameOrId);
}
