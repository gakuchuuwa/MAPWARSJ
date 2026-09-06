import { CityType } from '../types/core';
import { getCityExclusiveIconPath } from './city-marker/CityExclusiveIcons';
import { CITIES_V2 } from '../data/cities_v2';
// import { resolvePath } from '../utils/PathUtils';

function resolvePath(path: string): string {
    return path;
}

// 1. Definition of Regions and Styles
// ============================================================
// [REFACTOR 2026-05-28] 15 文化区方案 (MIN 并入 LINGNAN)
// 福建并入岭南 — 闽据点少 (5个), 历史上五代闽国虽独立但语言/宗族与岭南互动密
// ----------
// 中国汉地核心 4: CENTRAL / NORTH / JIANGNAN / LINGNAN
// 中国西南     2: BASHU / DIANQIAN
// 中国西部边疆 3: HEXI / WESTERN / TIBET
// 塞外+邻邦 5: STEPPE / NORTHEAST / KOREA / JAPAN / CENTRAL_ASIA
// 西方         1: WEST_ASIA（2026-07-29 新增：安纳托利亚/黎凡特/阿拉伯/埃及/两河）
// ============================================================
export type RegionType =
    | 'SLAVIC'        // 斯拉夫
    | 'GERMANIC'      // 日耳曼
    | 'LATIN'         // 拉丁
    | 'CENTRAL'       // 中原 (豫、关中、晋南)
    | 'NORTH'         // 北方 (河北、山东、晋北)
    | 'JIANGNAN'      // 江南 (长江中下游、湘鄂赣浙)
    | 'LINGNAN'       // 岭南 (粤、桂、海南、福建)    ← 已含原 MIN
    | 'BASHU'         // 古蜀 (川渝古蜀文明)
    | 'DIANQIAN'      // 古滇 (云贵古滇文明)
    | 'HEXI'          // 河西陇右 (甘肃走廊、陇右)
    | 'WESTERN'       // 塞种 (西域塞克人文明)
    | 'TIBET'         // 吐蕃 (西藏、青海、川甘藏区)
    | 'STEPPE'        // 塞外 (蒙古高原、含西伯利亚)
    | 'NORTHEAST'     // 东北 (满洲、通古斯)
    | 'KOREA'         // 朝鲜
    | 'JAPAN'         // 日本
    | 'CENTRAL_ASIA' // 中亚伊斯兰 (粟特、河中、大食)
    | 'WEST_ASIA'   // 西亚 (安纳托利亚、黎凡特、阿拉伯、埃及、两河)
    | 'INDIA'       // 印度 (恒河平原、南亚次大陆)
    | 'BERBER'      // 柏柏尔 (马格里布、北非)
    | 'AMERICA'     // 美洲 (阿兹特克/玛雅/印加/马普切/穆伊斯卡/图皮)[2026-08-24 新增]
    | 'AFRICA'      // 非洲 (马里/埃塞俄比亚)[2026-08-24 新增]
    | 'MALAY'      // 马来 (马六甲/满剌加)[2026-08-24 新增]
    | 'ANDE'       // 安第斯 (印加/马普切/穆伊斯卡/图皮)[2026-08-27 拆美洲新增]
    | 'PURU'       // 南印度 (达罗毗荼/朱罗/潘地亚)[2026-08-27 拆印度新增]
    | 'ORIE'       // 阿拉伯 (埃及/阿拉伯半岛/黎凡特)[2026-08-27 拆西亚新增]
    | 'EAST'       // 东欧 (哥特/匈人/条顿/维京/罗斯)[2026-08-27 拆日耳曼/拉丁/斯拉夫/草原新增]
    | 'GREEK'      // 希腊 (古希腊城邦/大希腊)[2026-08-27 撤销并入拉丁，恢复独立]
    | 'THRACIAN'   // 色雷斯 (保加利亚/色雷斯)[2026-08-27 拆拉丁/斯拉夫新增]
    | 'PERSIAN'    // 波斯 (伊朗高原/呼罗珊/阿富汗)[2026-08-27 拆中亚新增]
    | 'CUMAN'  // 库曼[2026-08-27]
    | 'BRITONS'  // 不列颠[2026-08-28 补 DE 文明]
    | 'GOTHS'  // 哥特[2026-08-28 补 DE 文明]
    | 'HUNS'  // 匈人[2026-08-28 补 DE 文明]
    | 'TEUTONS'  // 条顿[2026-08-28 补 DE 文明]
    | 'VIKINGS'  // 维京[2026-08-28 补 DE 文明]
    | 'CELTS'  // 凯尔特[2026-08-28 补 DE 文明]
    | 'ITALIANS'  // 意大利[2026-08-28 补 DE 文明]
    | 'SICILIANS'  // 西西里[2026-08-28 补 DE 文明]
    | 'BULGARIANS'  // 保加利亚[2026-08-28 补 DE 文明]
    | 'MAGYAR'  // 马扎尔[2026-08-28 补 DE 文明]
    | 'LITHUANIANS'  // 立陶宛[2026-08-28 补 DE 文明]
    | 'POLES'  // 波兰[2026-08-28 补 DE 文明]
    | 'BOHEMIANS'  // 波希米亚[2026-08-28 补 DE 文明]
    | 'BURGUNDIANS'  // 勃艮第[2026-08-28 补 DE 文明]
    | 'SPANISH'  // 西班牙[2026-08-28 补 DE 文明]
    | 'PORTUGUESE'  // 葡萄牙[2026-08-28 补 DE 文明]
    | 'ETHIOPIANS'  // 埃塞俄比亚[2026-08-28 补 DE 文明]
    | 'BENGALIS'  // 孟加拉[2026-08-28 补 DE 文明]
    | 'GURJARAS'  // 瞿折罗[2026-08-28 补 DE 文明]
    | 'PORUS'  // 补噜[2026-08-28 补 DE 文明]
    | 'VIETNAMESE'  // 越南[2026-08-28 补 DE 文明]
    | 'KHMER'  // 高棉[2026-08-28 补 DE 文明]
    | 'MAYANS'  // 玛雅[2026-08-28 补 DE 文明]
    | 'MAPUCHE'  // 马普切[2026-08-28 补 DE 文明]
    | 'MUISCA'  // 穆伊斯卡[2026-08-28 补 DE 文明]
    | 'TUPI'  // 图皮[2026-08-28 补 DE 文明]
    | 'ARMENIANS'  // 亚美尼亚[2026-08-28 补 DE 文明]
    | 'GEORGIANS'  // 格鲁吉亚[2026-08-28 补 DE 文明]
    | 'ATHENIANS'  // 雅典[2026-08-28 补 DE 文明]
    | 'SPARTANS'  // 斯巴达[2026-08-28 补 DE 文明]
    | 'MACEDONIANS'  // 马其顿[2026-08-28 补 DE 文明]
    | 'ACHAEMENIDS'  // 阿契美尼德[2026-08-28 补 DE 文明];
    | 'BURMESE'      // 缅甸
    | 'WALLACHIA'    // 瓦拉几亚
    | 'EGYPT'        // 埃及（古埃及尼罗河法老文明）
    | 'CARTHAGE'     // 布匿（西地中海商业与军事帝国）
    | 'BABYLON'      // 巴比伦（两河流域美索不达米亚文明）
    | 'HITTITES'     // 赫梯（小亚细亚安纳托利亚铁器与战车强权）
    | 'ASSYRIAN'     // 亚述（两河流域铁血军事帝国）
    | 'PARTHIA'      // 安息（帕提亚帝国）
    | 'SCYTHIANS'    // 斯基泰（欧亚大草原游牧始祖文明）
    | 'BYZANTINE'    // 拜占庭（东罗马帝国、地中海封建灯塔与军区制）
    | 'FRANKS'       // 法兰克（加洛林帝国/法兰克王国、西欧封建骑士制度真正源头）
    | 'SASANIAN'     // 萨珊（第二波斯帝国、祆教拜火教巅峰与萨珊具装铁骑）
    | 'TURKS'        // 突厥（第一/第二突厥汗国、隋唐欧亚草原两万里大霸主）
    | 'NANZHAO'      // 南诏（西南第一军国、盛唐天宝之战六诏归一）
    | 'SRIVIJAYA'    // 三佛齐（室利佛逝、马六甲海峡海上佛教贸易帝国）
    | 'KUSHAN'       // 月氏（大月氏、犍陀罗佛法与欧亚商路文明）
    | 'KUSH'         // 努比亚（黑法老与麦罗埃黑金字塔文明）
    | 'KHITAN'       // 契丹（大辽皮室军具装铁骑与铁骨朵）
    | 'UIGHUR'       // 回鹘（漠北回鹘汗国金镞角弓与耐力突骑）
    | 'MOHE'         // 靺鞨（海东盛国渤海鹿角硬弓与雪原山城）
    | 'ANGLO_SAXON'  // 盎格鲁-撒克逊（双手大斧长矛步兵盾墙）
    | 'AVARS'        // 阿瓦尔（多瑙河双马镫装甲骑射鼻祖）
    | 'GHANA'        // 加纳（西非黄金之国索宁克长矛方阵）
    | 'KHAZARS';     // 可萨（高加索里海拉尔西亚锁甲铁骑）
// [2026-08-27 主人定·扩文化] GREEK 已从 LATIN 拆出恢复独立（撤销 08-19 收敛）。
//   NUERGAN 仍并入 NORTHEAST，勿再新增该枚举。

// Valid region list for validation
export const REGION_ORDER: RegionType[] = [
    'SLAVIC', 'EAST', 'GERMANIC', 'LATIN', 'GREEK', 'THRACIAN', 'BERBER',
    'CENTRAL', 'JIANGNAN', 'BASHU', 'LINGNAN', 'STEPPE', 'CUMAN', 'JAPAN',
    'CENTRAL_ASIA', 'PERSIAN', 'NORTHEAST', 'TIBET', 'WESTERN',
    'KOREA', 'DIANQIAN', 'INDIA', 'PURU', 'WEST_ASIA', 'ORIE',
    'AMERICA', 'ANDE', 'AFRICA', 'MALAY',
    'BRITONS',
    'GOTHS',
    'HUNS',
    'TEUTONS',
    'VIKINGS',
    'CELTS',
    'ITALIANS',
    'SICILIANS',
    'BULGARIANS',
    'MAGYAR',
    'LITHUANIANS',
    'POLES',
    'BOHEMIANS',
    'BURGUNDIANS',
    'SPANISH',
    'PORTUGUESE',
    'ETHIOPIANS',
    'BENGALIS',
    'GURJARAS',
    'VIETNAMESE',
    'KHMER',
    'MAYANS',
    'MAPUCHE',
    'MUISCA',
    'TUPI',
    'ARMENIANS',
    'GEORGIANS',
    'ACHAEMENIDS',
    'BURMESE',
    'WALLACHIA',
    'EGYPT',
    'CARTHAGE',
    'BABYLON',
    'HITTITES',
    'SCYTHIANS',
    'BYZANTINE',
    'FRANKS',
    'SASANIAN',
    'TURKS',
    'NANZHAO',
    'SRIVIJAYA',
    'KUSHAN',
    'KUSH',
    'KHITAN',
    'UIGHUR',
    'MOHE',
    'ANGLO_SAXON',
    'AVARS',
    'GHANA',
    'KHAZARS',
];

// [UI] Display labels (Chinese + English code)
// 用于 CityEditor 等 UI 动态生成 region 下拉
export const REGION_LABELS: Record<RegionType, string> = {
    SLAVIC: '封建罗斯',
    GERMANIC: '古典日耳曼',
    LATIN: '古典罗马',
    CENTRAL: '古典华夏',
    NORTH: '古典华夏',
    JIANGNAN: '封建华夏',
    LINGNAN: '古典百越',
    BASHU: '古典古蜀',
    DIANQIAN: '古典古滇',
    HEXI: '古典华夏',
    WESTERN: '古典塞种',
    TIBET: '封建吐蕃',
    STEPPE: '城堡蒙古',
    NORTHEAST: '古典鲜卑',
    KOREA: '封建高句丽',
    JAPAN: '城堡日本',
    CENTRAL_ASIA: '封建突厥',
    WEST_ASIA: '封建拜占庭',
    INDIA: '古典印度',
    BERBER: '封建柏柏尔',
    AMERICA: '城堡阿兹特克',
    AFRICA: '城堡马里',
    MALAY: '封建马来',
    ANDE: '城堡印加',
    PURU: '封建达罗毗荼',
    ORIE: '封建阿拉伯',
    EAST: '封建罗斯',
    GREEK: '古典希腊',
    THRACIAN: '古典色雷斯',
    PERSIAN: '古典波斯',
    CUMAN: '城堡库曼',
    BRITONS: '城堡英格兰',
    GOTHS: '封建哥特',
    HUNS: '封建匈人',
    TEUTONS: '城堡条顿',
    VIKINGS: '封建维京',
    CELTS: '古典凯尔特',
    ITALIANS: '城堡拉丁',
    SICILIANS: '城堡诺曼',
    BULGARIANS: '封建保加利亚',
    MAGYAR: '城堡马扎尔',
    LITHUANIANS: '城堡立陶宛',
    POLES: '城堡波兰',
    BOHEMIANS: '城堡波希米亚',
    BURGUNDIANS: '城堡勃艮第',
    SPANISH: '帝王西班牙',
    PORTUGUESE: '帝王葡萄牙',
    ETHIOPIANS: '封建埃塞俄比亚',
    BENGALIS: '封建孟加拉',
    GURJARAS: '封建瞿折罗',
    PORUS: '古典印度',
    VIETNAMESE: '城堡大越',
    KHMER: '城堡高棉',
    MAYANS: '古典玛雅',
    MAPUCHE: '城堡马普切',
    MUISCA: '城堡穆伊斯卡',
    TUPI: '城堡图皮',
    ARMENIANS: '古典亚美尼亚',
    GEORGIANS: '封建格鲁吉亚',
    ATHENIANS: '古典希腊',
    SPARTANS: '古典希腊',
    MACEDONIANS: '古典希腊',
    ACHAEMENIDS: '古典波斯',
    BURMESE: '城堡缅甸',
    WALLACHIA: '封建瓦拉几亚',
    EGYPT: '古典埃及',
    CARTHAGE: '古典布匿',
    BABYLON: '古典巴比伦',
    HITTITES: '古典赫梯',
    ASSYRIAN: '古典亚述',
    PARTHIA: '古典波斯',
    SCYTHIANS: '古典斯基泰',
    BYZANTINE: '封建拜占庭',
    FRANKS: '封建法兰克',
    SASANIAN: '封建波斯',
    TURKS: '封建突厥',
    NANZHAO: '封建白蛮',
    SRIVIJAYA: '封建马来',
    KUSHAN: '古典月氏',
    KUSH: '古典努比亚',
    KHITAN: '封建契丹',
    UIGHUR: '封建回鹘',
    MOHE: '封建靺鞨',
    ANGLO_SAXON: '封建盎格鲁-撒克逊',
    AVARS: '封建阿瓦尔',
    GHANA: '封建加纳',
    KHAZARS: '封建可萨',
};

/**
 * [文化正式名] 战斗面板等玩家可见处显示的「文化」名称（2026-07-22 主人定案）。
 *
 * ⚠️ 与上面的 REGION_LABELS 是【两套独立的东西，勿混用、勿合并】：
 *   - REGION_LABELS：区域标签，供语音播报、据点编辑器下拉等既有用途，本表改动与之无关。
 *   - CULTURE_NAMES：文化正式名，仅供玩家可见的文化展示。
 * 改其中一套不影响另一套，这是主人明确要求的分离。
 */
export const CULTURE_NAMES: Record<RegionType, string> = {
    SLAVIC: '封建罗斯',
    GERMANIC: '古典日耳曼',
    LATIN: '古典罗马',
    CENTRAL: '古典华夏',
    NORTH: '古典华夏',
    JIANGNAN: '封建华夏',
    BASHU: '古典古蜀',
    HEXI: '古典华夏',
    LINGNAN: '古典百越',
    STEPPE: '城堡蒙古',
    NORTHEAST: '古典鲜卑',
    TIBET: '封建吐蕃',
    WESTERN: '古典塞种',
    CENTRAL_ASIA: '封建突厥',
    WEST_ASIA: '封建拜占庭',
    INDIA: '古典印度',
    BERBER: '封建柏柏尔',
    DIANQIAN: '古典古滇',
    KOREA: '封建高句丽',
    JAPAN: '城堡日本',
    AMERICA: '城堡阿兹特克',
    AFRICA: '城堡马里',
    MALAY: '封建马来',
    ANDE: '城堡印加',
    PURU: '封建达罗毗荼',
    ORIE: '封建阿拉伯',
    EAST: '封建罗斯',
    GREEK: '古典希腊',
    THRACIAN: '古典色雷斯',
    PERSIAN: '古典波斯',
    CUMAN: '城堡库曼',
    BRITONS: '城堡英格兰',
    GOTHS: '封建哥特',
    HUNS: '封建匈人',
    TEUTONS: '城堡条顿',
    VIKINGS: '封建维京',
    CELTS: '古典凯尔特',
    ITALIANS: '城堡拉丁',
    SICILIANS: '城堡诺曼',
    BULGARIANS: '封建保加利亚',
    MAGYAR: '城堡马扎尔',
    LITHUANIANS: '城堡立陶宛',
    POLES: '城堡波兰',
    BOHEMIANS: '城堡波希米亚',
    BURGUNDIANS: '城堡勃艮第',
    SPANISH: '帝王西班牙',
    PORTUGUESE: '帝王葡萄牙',
    ETHIOPIANS: '封建埃塞俄比亚',
    BENGALIS: '封建孟加拉',
    GURJARAS: '封建瞿折罗',
    PORUS: '古典印度',
    VIETNAMESE: '城堡大越',
    KHMER: '城堡高棉',
    MAYANS: '古典玛雅',
    MAPUCHE: '城堡马普切',
    MUISCA: '城堡穆伊斯卡',
    TUPI: '城堡图皮',
    ARMENIANS: '古典亚美尼亚',
    GEORGIANS: '封建格鲁吉亚',
    ATHENIANS: '古典希腊',
    SPARTANS: '古典希腊',
    MACEDONIANS: '古典希腊',
    ACHAEMENIDS: '古典波斯',
    BURMESE: '城堡缅甸',
    WALLACHIA: '封建瓦拉几亚',
    EGYPT: '古典埃及',
    CARTHAGE: '古典布匿',
    BABYLON: '古典巴比伦',
    HITTITES: '古典赫梯',
    ASSYRIAN: '古典亚述',
    PARTHIA: '古典波斯',
    SCYTHIANS: '古典斯基泰',
    BYZANTINE: '封建拜占庭',
    FRANKS: '封建法兰克',
    SASANIAN: '封建波斯',
    TURKS: '封建突厥',
    NANZHAO: '封建白蛮',
    SRIVIJAYA: '封建马来',
    KUSHAN: '古典月氏',
    KUSH: '古典努比亚',
    KHITAN: '封建契丹',
    UIGHUR: '封建回鹘',
    MOHE: '封建靺鞨',
    ANGLO_SAXON: '封建盎格鲁-撒克逊',
    AVARS: '封建阿瓦尔',
    GHANA: '封建加纳',
    KHAZARS: '封建可萨',
};

/** 取文化正式名（未知区兜底中原） */
export function getCultureName(region: RegionType | null | undefined): string {
    return (region && CULTURE_NAMES[region]) || CULTURE_NAMES.CENTRAL;
}

// [LEGACY] 向后兼容旧 region 字符串
// cities_v2.ts 里有 58 处旧 region 字段。此映射只处理 "纯改名" 情况
// （旧区和新区的地理范围完全一致，只是名字变了）。
//
// ⚠️ 已被"拆分"的旧名（如 CHU_SHU → BASHU/DIANQIAN 两个）不放在这里！
//    那种情况下：把翻译留空 → 走到下面的 REGION_ORDER 检查 → fail
//    → 自动 fallthrough 到 getRegion(lat, lng) 坐标判定 → 自动得到正确的新区。
//
// 新数据请直接用新枚举值，不要再用旧名。
const LEGACY_REGION_MAP: Record<string, RegionType> = {
    'SOUTH': 'JIANGNAN',            // 纯改名 (boundary 完全一致)
    // 'CHU_SHU': 不放！让坐标自动判定走 getRegion() 分到 BASHU 或 DIANQIAN
    'NORTHWEST': 'HEXI',            // 纯改名
    'NOMADIC': 'STEPPE',            // 纯改名
    'CENTRAL_WORLD': 'CENTRAL_ASIA',// 纯改名
    'WEST_WORLD': 'CENTRAL_ASIA',   // 合并 (老 WEST_WORLD 范围已被 getRegion 自动归中亚)
    'TROPICS': 'LINGNAN',           // 合并 (老 TROPICS 范围已被 getRegion 自动归岭南)
    'SIBERIA': 'STEPPE',            // 合并 (老 SIBERIA 已被 getRegion 自动归塞外)
    'MIN': 'LINGNAN',               // [2026-05-28] 合并: 14 区方案, 福建归岭南
    'NUERGAN': 'NORTHEAST',         // [2026-08-19] 合并: 18 大文化收敛, 奴儿干归东北
    'SOUTH_HEMISPHERE': 'CENTRAL',  // fallback (不该出现)
    'NEW_WORLD': 'CENTRAL',         // fallback (不该出现)

    // ── [2026-08-31] 五个混进来的 AoE2 文明名 → 正式文化区 ──────────────
    // 🔴 这不只是编辑器的事：这些值不在 REGION_ORDER 里，`getCityRegion` 会**静默回落到坐标判定**，
    //    而坐标判定不覆盖美洲/南亚/伊朗 —— 实测马丘比丘、戈尔康达、巴姆古城**全被判成「中原」**，
    //    也就是印加帝国在游戏里按中原文化出兵。加进别名表后游戏与编辑器一起修好。
    //    归属按史实定，且与这些势力**已经在用的军团**互相印证：
    'PERSIANS': 'PERSIAN',          // 克尔曼(巴姆古城, 伊朗) —— 单复数写错而已，本来就在用【波斯军团】
    'THRACIANS': 'THRACIAN',        // 奥德里西亚(塞乌托波利) —— 同上，本来就在用【色雷斯军团】
    'INCAS': 'ANDE',                // 塔万廷苏尤(马丘比丘) = 印加帝国，本来就在用【安第斯军团】
    'INDIANS': 'PURU',              // 库特布朝(戈尔康达, 17.4°N 德干) —— 泰卢固语区，属达罗毗荼南印度。
                                    //   注意别写成 PORUS(补噜)：那是旁遮普的波鲁斯王，在印度西北，方位相反。
    'FRANKS': 'LATIN',              // 瓦卢瓦(香波堡, 卢瓦尔河谷) —— 法兰西王室；本表无 FRANCE，
                                    //   拉丁基督教世界是最贴的现有归属（坐标自动判定也给 LATIN，互相印证）。
};

export type CityScale = 'big' | 'medium' | 'small' | 'pass';

// 2. Polygon Definitions (Approximate Geographic Boundaries)
interface Point { lat: number; lng: number; }
type Polygon = Point[];

// === Region Definitions (Polygons DELETED) ===
// Legacy polygon data removed to enforce strict Latitude/Longitude logic.

// 3. Region Deterministic Logic
// ============================================================
// [REFACTOR 2026-05-29 v4] 15 文化区判定流程
//
// v4 修正:
//   - TIBET lat 上限 38→37 (让出武威 37.93 给 HEXI)
//   - HEXI 大扩: lng 93-111 (西吃玉门关/敦煌, 东吃陕北延安/统万/河套)
//   - WESTERN lng 收到 75-93 (让 HEXI 优先)
//   视觉设计（立绘）：
//   - HEXI 视觉风格 = 黄土高原建筑（窑洞、夯土城墙、塬上堡寨）
//   - 皋兰（兰州）和肤施（延安）虽在环线上被中原/北方/河西/川蜀/青藏共用，
//     但建筑立绘和人物立绘均与 HEXI（河西）一致——因其同属黄土高原地貌
// v3 (2026-05-28):
//   - 福建 → LINGNAN (取消独立 MIN, 14 区)
//   - 东南亚: 越南柬+粤桂海 → LINGNAN, 泰缅 → DIANQIAN
//   - 岭南南海界（不经过占城据点）: 牡丹社 → 阇槃(必 LINGNAN) → 吴哥(岭南环线西南锚点，文化 LINGNAN)
//   - 藏南/尼泊尔/列城 → TIBET
//   - 远北/远东 → NORTHEAST (东北扩大)
//   - 中亚收紧 lng < 75
//   - 琉球 → JAPAN
//
// 个别据点 explicit override (cities_v2.ts region 字段):
//   - 归化城 → STEPPE (蒙古土默特部都城)
//   - 伊犁固尔札 → STEPPE (准噶尔汗国都城)
//   - 松州 → TIBET (川西藏羌)
//   - 特尔门 → STEPPE (库苏古尔/土拉河，草原)
//   - 饶乐水 → NORTHEAST (西拉木伦河/昌黎郡旧境)
//   - 钓鱼岛 → JAPAN (江南/日本环线锚)
//   - 扜泥城 → WESTERN (罗布泊西楼兰故地)
// ============================================================
// ── 2026-06-11 文化区界城环线（zoom=6 绘线 + 多边形锚点）──
//
// 环线代称（据点名已删或异写时，锚点 cityId 不变）:
//   威海卫 → city_wendeng 文登（胶东，文化 NORTH）
//   钓鱼岛城 → city_diaoyudao 钓鱼岛（琉球海界，文化 JAPAN）
//   也迷离 → city_emil 也迷里（草原环线锚点，文化 STEPPE）
//   弓月 → city_almaliq 弓月城；江户 → city_edo 江户城
//
// 界城 region 标准（环线锚点 vs 实际文化，主人 2026-06-11 拍板）:
//   据点          cityId              region      说明
//   石门关        city_shimenguan     BASHU       岭南环线西北锚，文化川蜀门户
//   临烝          city_linzheng       JIANGNAN    岭南/江南共用
//   牡丹社        city_mudan          LINGNAN
//   邦敦/三菩     city_bangdun/sanpu  LINGNAN
//   吴哥          city_angkor         LINGNAN     岭南环线西南锚（非滇缅）
//   广陵/襄阳     city_yangzhou/xiangyang JIANGNAN
//   钓鱼岛        city_diaoyudao      JAPAN       江南/日本环线共用
//   宫古岛        city_gugudao        JAPAN
//   江户城        city_edo            JAPAN
//   根城/宗谷     city_genjo/zonggu   JAPAN       宗谷界城兼东北/朝鲜/日本锚
//   星主厅        city_xingzhuting    KOREA       江南/日本/朝鲜共用（济州）
//   文登          city_wendeng        NORTH       代威海卫，朝鲜环线锚
//   襄平          city_liaoyang       NORTH       东北/朝鲜/草原三圈共用
//   白主~尼布楚   city_baizhu…nibuchu NORTHEAST   东北环线
//   尼布楚        city_nibuchu        NORTHEAST   兼草原环线锚（文化东北）
//   归化城        city_guihua         STEPPE
//   哈密卫        city_hamiwei        WESTERN     草原环线锚，文化西域（非草原）
//   弓月城/也迷里 city_almaliq/emil   STEPPE
//   乌布萨泊~赤塔 city_wubusabo/chita STEPPE
//   特尔门        city_temermen       STEPPE      土拉河/漠北牧地
//   饶乐水        city_raoleshui      NORTHEAST   西拉木伦河/昌黎旧境
//   扜泥城        city_loulan         WESTERN     楼兰故城（罗布泊西）
//
// 15 区环线标准（主人 2026-06-11 定稿，zoom=6 绘线唯一来源；2026-07-29 补西亚）:
//   1 中原  汉中→襄阳→广陵→威海卫→肤施→皋兰
//   2 北方  威海卫→肤施→归化→襄平
//   3 东北  襄平→宗谷→白主→诺托罗→囊哈儿→奴儿干→雅克萨→格尔必齐→尼布楚
//   4 朝鲜  襄平→威海卫→广陵→星主厅→宗谷
//   5 日本  钓鱼岛→宫古岛→首里→江户→根城→宗谷→星主厅
//   6 草原  襄平→归化→哈密卫→弓月城→塔城→乌布萨泊→贝加尔→赤塔→尼布楚
//   7 河西  皋兰→姑臧→卡克里克→楼兰→哈密→归化→肤施
//   8 川蜀  襄阳→临烝→石门关→打箭炉→皋兰→汉中
//   9 江南  广陵→襄阳→临烝→牡丹社→钓鱼岛城→星主厅
//  10 岭南  石门关→临烝→牡丹社→邦敦→三菩→吴哥
//  11 滇缅  打箭炉→大研→加德满都→勃固→直通→阿瑜陀耶→吴哥→石门关
//  12 青藏  加德满都→阿托克→塔什库尔干→龙木错→卡克里克→姑臧→兰州→打箭炉→大研
//  13 中亚  石头城→阿托克→坎大哈→博斯特→法拉→尼沙布尔→玉龙杰赤→养吉干→石头城
//  14 西域  哈密→楼兰→卡克里克→龙木错→养吉干→弓月
//  15 西亚  苏萨→库塔伊西→君士坦丁堡→佩尔加蒙→以弗所→亚历山大→瓦塞特→麦加→苏萨
//
// 绘线: RegionBoundaryLayer @ zoom=6（REGION_BOUNDARY_ZOOM），共 15 区
// ============================================================
export const REGION_BOUNDARY_LOOPS: { region: RegionType; cityIds: string[] }[] = [
    { region: 'SLAVIC', cityIds: ['city_xianuofugeerdede', 'city_daerban', 'city_junshitandingbao', 'city_plovdiv', 'city_belgrade', 'city_budapeisi', 'city_bulage', 'city_talin', 'city_nuofugeerdede', 'city_xianuofugeerdede'] },
    { region: 'GERMANIC', cityIds: ['city_budapeisi', 'city_bulage', 'city_talin', 'city_wupusala', 'city_aidingbao', 'city_dublin', 'city_basaier', 'city_budapeisi'] },
    { region: 'LATIN', cityIds: ['city_junshitandingbao', 'city_plovdiv', 'city_belgrade', 'city_budapeisi', 'city_basaier', 'city_dublin', 'city_lisiben', 'city_jiadisi', 'city_malta', 'city_rhodes', 'city_yadian', 'city_junshitandingbao'] },

    { region: 'CENTRAL', cityIds: ['city_hanzhong', 'city_xiangyang', 'city_yangzhou', 'city_wendeng', 'city_fushi', 'city_lanzhou', 'city_hanzhong'] },
    { region: 'NORTH', cityIds: ['city_wendeng', 'city_fushi', 'city_guihua', 'city_liaoyang', 'city_wendeng'] },
    { region: 'NORTHEAST', cityIds: ['city_liaoyang', 'city_zonggu', 'city_baizhu', 'city_nuotuoluo', 'city_nanghar', 'city_nuergan', 'city_yakesa', 'city_geerbiqi', 'city_nibuchu', 'city_liaoyang'] },
    { region: 'KOREA', cityIds: ['city_liaoyang', 'city_wendeng', 'city_yangzhou', 'city_xingzhuting', 'city_zonggu', 'city_liaoyang'] },
    { region: 'CUMAN', cityIds: ['city_daerban', 'city_chalijin', 'city_kashan', 'city_wufa', 'city_salaichuke', 'city_mangshilake', 'city_daerban'] },
    { region: 'STEPPE', cityIds: ['city_liaoyang', 'city_guihua', 'city_hamiwei', 'city_almaliq', 'city_urgench', 'city_daerban', 'city_xianuofugeerdede', 'city_xiaoyenisei', 'city_chita', 'city_nibuchu', 'city_liaoyang'] },
    { region: 'HEXI', cityIds: ['city_lanzhou', 'city_wuwei', 'city_ruoqiang', 'city_loulan', 'city_hamiwei', 'city_guihua', 'city_fushi', 'city_lanzhou'] },
    { region: 'BASHU', cityIds: ['city_xiangyang', 'city_linzheng', 'city_shimenguan', 'city_dajianlu', 'city_lanzhou', 'city_hanzhong', 'city_xiangyang'] },
    { region: 'JIANGNAN', cityIds: ['city_yangzhou', 'city_xiangyang', 'city_linzheng', 'city_mudan', 'city_gugudao', 'city_xingzhuting', 'city_yangzhou'] },
    { region: 'JAPAN', cityIds: ['city_gugudao', 'city_shuri', 'city_edo', 'city_moyoro', 'city_zonggu', 'city_xingzhuting', 'city_gugudao'] },
    { region: 'LINGNAN', cityIds: ['city_shimenguan', 'city_linzheng', 'city_mudan', 'city_bangdun', 'city_piyetuo', 'city_shimenguan'] },
    { region: 'DIANQIAN', cityIds: ['city_dajianlu', 'city_dayan', 'city_kathmandu', 'city_geergang', 'city_mizhina', 'city_shwebo', 'city_pagan', 'city_srikshetra', 'city_bago', 'city_thaton', 'city_ayutthaya', 'city_piyetuo', 'city_shimenguan', 'city_dajianlu'] },
    { region: 'TIBET', cityIds: ['city_kathmandu', 'city_laheer', 'city_hepancheng', 'city_longmucuo', 'city_ruoqiang', 'city_wuwei', 'city_lanzhou', 'city_dajianlu', 'city_dayan', 'city_kathmandu'] },
    { region: 'PERSIAN', cityIds: ['city_dabulishi', 'city_susa', 'city_feiluzhabade', 'city_kandaha', 'city_gaofu', 'city_merv', 'city_nisa', 'city_dabulishi'] },
    { region: 'CENTRAL_ASIA', cityIds: ['city_hepancheng', 'city_laheer', 'city_bosibolisi', 'city_susa', 'city_niniwei', 'city_daerban', 'city_urgench', 'city_hepancheng'] },
    { region: 'WEST_ASIA', cityIds: ['city_susa', 'city_maijia', 'city_beileinisi', 'city_wasaite', 'city_yalishanda', 'city_yadian', 'city_junshitandingbao', 'city_daerban', 'city_niniwei', 'city_susa'] },
    { region: 'WESTERN', cityIds: ['city_hamiwei', 'city_loulan', 'city_ruoqiang', 'city_longmucuo', 'city_hepancheng', 'city_urgench', 'city_almaliq', 'city_hamiwei'] },
    { region: 'INDIA', cityIds: ['city_laheer', 'city_deli', 'city_agela', 'city_qunvcheng', 'city_walanaxi', 'city_huashicheng', 'city_wangshecheng', 'city_gaodacheng', 'city_danmoledi', 'city_laheer'] },
    { region: 'BERBER', cityIds: ['city_feisi', 'city_malajiashen', 'city_teleimusen', 'city_aerjier', 'city_bujiaya', 'city_jiataji', 'city_kailuwan', 'city_deliboli', 'city_banjiaxi', 'city_feisi'] },
];

/** 界城环线配色（与 REGION_LABELS 对应，zoom=6 虚线） */
export const REGION_BOUNDARY_COLORS: Record<RegionType, string> = {
    SLAVIC: '封建罗斯',
    GERMANIC: '#455a64',
    LATIN: '#6a1b9a',
    CENTRAL: '#8d6e63',
    NORTH: '#5d4037',
    JIANGNAN: '封建华夏',
    LINGNAN: '#e65100',
    BASHU: '#2e7d32',
    DIANQIAN: '#6a1b9a',
    HEXI: '#bf360c',
    WESTERN: '#f9a825',
    TIBET: '封建吐蕃',
    STEPPE: '#c0a050',
    NORTHEAST: '封建东斯拉夫',
    KOREA: '封建高句丽',
    JAPAN: '封建日本',
    CENTRAL_ASIA: '封建中亚',
    WEST_ASIA: '封建安纳托利亚', // 深靛；原 #8d6e63 与 CENTRAL 完全撞色，zoom=6 界线分不出来
    INDIA: '#d84315',   // 深橙红（印度香料）
    BERBER: '封建柏柏尔',  // 青绿（地中海/绿洲）
    AMERICA: '封建阿兹特克', // 棕（美洲）[2026-08-24]
    AFRICA: '封建马里',  // 橄榄（非洲）[2026-08-24]
    MALAY: '封建南洋',   // 青（马来）[2026-08-24]
    ANDE: '封建印加',  // 琥珀（安第斯金）[2026-08-27]
    PURU: '封建达罗毗荼',  // 深红（达罗毗荼）[2026-08-27]
    ORIE: '封建阿拉伯',  // 深绿（伊斯兰绿）[2026-08-27]
    EAST: '封建东斯拉夫',  // 深蓝灰（东欧蛮族钢铁）[2026-08-27]
    GREEK: '#1e88e5',  // 蓝（希腊爱琴海）[2026-08-27]
    THRACIAN: '#ad1457',  // 深品红（色雷斯巴尔干）[2026-08-27]
    PERSIAN: '封建波斯',  // 深紫（阿契美尼德波斯王紫）[2026-08-27]
    CUMAN: '封建库曼',  // 灰褐（库曼钦察草原）[2026-08-27]
    BRITONS: '封建英格兰',  // 不列颠[2026-08-28]
    GOTHS: '封建哥特',  // 哥特[2026-08-28]
    HUNS: '封建匈人',  // 匈人[2026-08-28]
    TEUTONS: '封建条顿',  // 条顿[2026-08-28]
    VIKINGS: '封建维京',  // 维京[2026-08-28]
    CELTS: '#2e7d32',  // 凯尔特[2026-08-28]
    ITALIANS: '封建意大利',  // 意大利[2026-08-28]
    SICILIANS: '封建西西里',  // 西西里[2026-08-28]
    BULGARIANS: '封建保加利亚',  // 保加利亚[2026-08-28]
    MAGYAR: '封建马扎尔',  // 马扎尔[2026-08-28]
    LITHUANIANS: '封建立陶宛',  // 立陶宛[2026-08-28]
    POLES: '封建波兰',  // 波兰[2026-08-28]
    BOHEMIANS: '封建波希米亚',  // 波希米亚[2026-08-28]
    BURGUNDIANS: '封建勃艮第',  // 勃艮第[2026-08-28]
    SPANISH: '封建西班牙',  // 西班牙[2026-08-28]
    PORTUGUESE: '封建葡萄牙',  // 葡萄牙[2026-08-28]
    ETHIOPIANS: '封建埃塞俄比亚',  // 埃塞俄比亚[2026-08-28]
    BENGALIS: '封建孟加拉',  // 孟加拉[2026-08-28]
    GURJARAS: '封建瞿折罗',  // 瞿折罗[2026-08-28]
    PORUS: '#c62828',  // 补噜[2026-08-28]
    VIETNAMESE: '封建大越',  // 越南[2026-08-28]
    KHMER: '封建高棉',  // 高棉[2026-08-28]
    MAYANS: '#6d4c41',  // 玛雅[2026-08-28]
    MAPUCHE: '封建马普切',  // 马普切[2026-08-28]
    MUISCA: '封建穆伊斯卡',  // 穆伊斯卡[2026-08-28]
    TUPI: '封建图皮',  // 图皮[2026-08-28]
    ARMENIANS: '#3949ab',  // 亚美尼亚[2026-08-28]
    GEORGIANS: '封建格鲁吉亚',  // 格鲁吉亚[2026-08-28]
    ATHENIANS: '#1565c0',  // 雅典[2026-08-28]
    SPARTANS: '#5d4037',  // 斯巴达[2026-08-28]
    MACEDONIANS: '#455a64',  // 马其顿[2026-08-28]
    ACHAEMENIDS: '#4527a0',  // 阿契美尼德[2026-08-28]
    BURMESE: '封建缅甸',
    WALLACHIA: '封建瓦拉几亚',
    EGYPT: '#d4af37',      // 埃及（金字塔黄金）
    CARTHAGE: '#800020',   // 迦太基（布匿紫红）
    BABYLON: '#1a237e',    // 巴比伦（伊什塔尔门青金石蓝）
    HITTITES: '#795548',   // 赫梯（铁器青铜棕）
    ASSYRIAN: '#b71c1c',   // 亚述（铁血战神赤红）
    PARTHIA: '#6a1b9a',    // 安息（帕提亚皇室深紫）
    SCYTHIANS: '#fbc02d',  // 斯基泰（大草原黄金色）
    BYZANTINE: '封建拜占庭',  // 拜占庭（拜占庭皇室深紫）
    FRANKS: '封建法兰克',     // 法兰克（加洛林皇家蓝）
    SASANIAN: '封建波斯',   // 萨珊（波斯祆教烈火深绯红）
    TURKS: '封建突厥',      // 突厥（草原苍狼天青蓝）
    NANZHAO: '封建白蛮',    // 南诏（苍山洱海玄木褐）
    SRIVIJAYA: '封建马来',  // 三佛齐（南洋海洋碧青）
    KUSHAN: '#d97706',     // 贵霜（犍陀罗佛陀金赭）
    KUSH: '#78350f',       // 库施（努比亚黑金赤檀）
    KHITAN: '#5c4033',
    UIGHUR: '#b8860b',
    MOHE: '#2e8b57',
    ANGLO_SAXON: '#4682b4',
    AVARS: '#8b0000',
    GHANA: '#ffd700',
    KHAZARS: '#4b0082',
};

let REGIONS_CACHE: { id: RegionType; polygon: {lat:number,lng:number}[] }[] | null = null;

function getDynamicRegions() {
    if (REGIONS_CACHE) return REGIONS_CACHE;
    const CITIES_V2_DATA = CITIES_V2;
    if (!CITIES_V2_DATA) return [];
    const cityMap = new Map<string, { lat: number, lng: number }>();
    for (const city of CITIES_V2_DATA) {
        cityMap.set(city.id, { lat: city.lat, lng: city.lng });
    }
    REGIONS_CACHE = REGION_BOUNDARY_LOOPS.map(loop => {
        const polygon: {lat:number,lng:number}[] = [];
        for (const id of loop.cityIds) {
            const city = cityMap.get(id);
            if (city) {
                polygon.push({ lat: city.lat, lng: city.lng });
            } else {
                console.warn(`[RegionSystem] City ${id} not found for region boundary ${loop.region}`);
            }
        }
        return { id: loop.region, polygon };
    });
    return REGIONS_CACHE || [];
}

export function getRegion(lat: number, lng: number): RegionType {
    const REGIONS = getDynamicRegions();
    for (const region of REGIONS) {
        const poly = region.polygon;
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].lng, yi = poly[i].lat;
            const xj = poly[j].lng, yj = poly[j].lat;
            const d = Math.sqrt((lat - yi) ** 2 + (lng - xi) ** 2);
            if (d < 0.01) return region.id;
            if (((yi >= lat) !== (yj >= lat)) && (lng <= (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
        }
        if (inside) return region.id;
    }
    return 'CENTRAL';
}
// 4. Hybrid City Region Detection (Explicit Override + Auto-detection)
export function getCityRegion(city: { latitude: number; longitude: number; region?: string }): RegionType {
    // Priority 1: Explicit region override (含旧名翻译)
    if (city.region) {
        // 旧名 → 新名 翻译 (向后兼容 cities_v2.ts 里 58 处遗留值)
        const translated = LEGACY_REGION_MAP[city.region] ?? city.region;
        if (REGION_ORDER.includes(translated as RegionType)) {
            return translated as RegionType;
        }
        // 未知 region 字符串 → 落入坐标自动判定
    }
    // Priority 2: Auto-detect from coordinates
    return getRegion(city.latitude, city.longitude);
}

// 4. Style Mapping Table — 15 文化区
// ============================================================
// 注释 ✅ = 已有自己的 PNG；⚠️ = 暂用兜底 PNG（待美术补图）
// 暂用兜底的 region 后续补图只需把路径里的旧名替换成新名即可。
// ============================================================
const STYLE_MAP: Record<RegionType, { small: string, medium: string, big: string, pass: string }> = {
    // === 中国汉地核心 ===
    CENTRAL: { // ✅ 已有
        small: resolvePath('/cities/central_small.png'),
        medium: resolvePath('/cities/central_medium.png'),
        big: resolvePath('/cities/central_big.png'),
        pass: resolvePath('/cities/central_pass.png')
    },
    NORTH: { // ✅ 已有
        small: resolvePath('/cities/north_small.png'),
        medium: resolvePath('/cities/north_medium.png'),
        big: resolvePath('/cities/north_big.png'),
        pass: resolvePath('/cities/north_pass.png')
    },
    JIANGNAN: { // ✅ 继承原 SOUTH 全部 PNG (south_*.png)
        small: resolvePath('/cities/south_small.png'),
        medium: resolvePath('/cities/south_medium.png'),
        big: resolvePath('/cities/south_big.png'),
        pass: resolvePath('/cities/south_pass.png')
    },
    LINGNAN: { // ✅ 已有 (范围收窄，福建剥离到 MIN)
        small: resolvePath('/cities/lingnan_small.png'),
        medium: resolvePath('/cities/lingnan_medium.png'),
        big: resolvePath('/cities/lingnan_big.png'),
        pass: resolvePath('/cities/lingnan_pass.png')
    },

    // === 中国江南/西南 ===
    BASHU: { // ✅ 继承原 CHU_SHU 全部 PNG (chushu_*.png) - 川渝盆地素材
        small: resolvePath('/cities/chushu_small.png'),
        medium: resolvePath('/cities/chushu_medium.png'),
        big: resolvePath('/cities/chushu_big.png'),
        pass: resolvePath('/cities/chushu_pass.png')
    },
    DIANQIAN: { // ✅ 已有
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },

    // === 中国西部边疆 ===
    HEXI: { // ✅ 继承原 NORTHWEST 全部 PNG (northwest_*.png)
        small: resolvePath('/cities/northwest_small.png'),
        medium: resolvePath('/cities/northwest_medium.png'),
        big: resolvePath('/cities/northwest_big.png'),
        pass: resolvePath('/cities/northwest_pass.png')
    },
    WESTERN: { // ✅ 已有
        small: resolvePath('/cities/western_small.png'),
        medium: resolvePath('/cities/western_medium.png'),
        big: resolvePath('/cities/western_big.png'),
        pass: resolvePath('/cities/western_pass.png')
    },
    TIBET: { // ✅ 已有 (范围扩到含青海+川西甘孜)
        small: resolvePath('/cities/tibet_small.png'),
        medium: resolvePath('/cities/tibet_medium.png'),
        big: resolvePath('/cities/tibet_big.png'),
        pass: resolvePath('/cities/tibet_pass.png')
    },

    // === 塞外 + 邻邦 ===
    STEPPE: { // ✅ 继承原 NOMADIC 全部 PNG (nomadic_*.png)，吞掉原 SIBERIA
        small: resolvePath('/cities/nomadic_small.png'),
        medium: resolvePath('/cities/nomadic_medium.png'),
        big: resolvePath('/cities/nomadic_big.png'),
        pass: resolvePath('/cities/nomadic_pass.png')
    },
    NORTHEAST: { // ✅ 已有
        small: resolvePath('/cities/northeast_small.png'),
        medium: resolvePath('/cities/northeast_medium.png'),
        big: resolvePath('/cities/northeast_big.png'),
        pass: resolvePath('/cities/northeast_pass.png')
    },
    KOREA: { // ✅ 已有
        small: resolvePath('/cities/korea_small.png'),
        medium: resolvePath('/cities/korea_medium.png'),
        big: resolvePath('/cities/korea_big.png'),
        pass: resolvePath('/cities/korea_pass.png')
    },
    JAPAN: { // ✅ 已有
        small: resolvePath('/cities/japan_small.png'),
        medium: resolvePath('/cities/japan_medium.png'),
        big: resolvePath('/cities/japan_big.png'),
        pass: resolvePath('/cities/japan_pass.png')
    },
    CENTRAL_ASIA: {
        small: resolvePath('/cities/central_asia_small.png'),
        medium: resolvePath('/cities/central_asia_medium.png'),
        big: resolvePath('/cities/central_asia_big.png'),
        pass: resolvePath('/cities/central_asia_pass.png')
    },
    WEST_ASIA: {
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },

    // === 欧洲三区（2026-08-01 新增；专属据点图已就位） ===
    SLAVIC: { // ✅ 斯拉夫
        small: resolvePath('/cities/slavic_small.png'),
        medium: resolvePath('/cities/slavic_medium.png'),
        big: resolvePath('/cities/slavic_big.png'),
        pass: resolvePath('/cities/slavic_pass.png')
    },
    GERMANIC: { // ✅ 日耳曼
        small: resolvePath('/cities/germanic_small.png'),
        medium: resolvePath('/cities/germanic_medium.png'),
        big: resolvePath('/cities/germanic_big.png'),
        pass: resolvePath('/cities/germanic_pass.png')
    },
    LATIN: { // ✅ 拉丁
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    INDIA: { // ⚠️ 暂借滇缅图标（南亚，待专属素材）
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    BERBER: { // ⚠️ 暂借拉丁图标（北非地中海，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    AMERICA: { // ⚠️ [2026-08-24 新增] 暂借拉丁图标（美洲石造建筑，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    AFRICA: { // ⚠️ [2026-08-24 新增] 暂借拉丁图标（非洲，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    MALAY: { // ⚠️ [2026-08-24 新增] 暂借滇缅图标（马来东南亚，待专属素材）
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    ANDE: { // ⚠️ [2026-08-27 新增] 暂借拉丁图标（安第斯石造，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    PURU: { // ⚠️ [2026-08-27 新增] 暂借印度图标（南印度，待专属素材）
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    ORIE: { // ⚠️ [2026-08-27 新增] 暂借西亚图标（中东阿拉伯，待专属素材）
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    EAST: { // ⚠️ [2026-08-27 新增] 暂借日耳曼图标（东欧蛮族，待专属素材）
        small: resolvePath('/cities/germanic_small.png'),
        medium: resolvePath('/cities/germanic_medium.png'),
        big: resolvePath('/cities/germanic_big.png'),
        pass: resolvePath('/cities/germanic_pass.png')
    },
    GREEK: { // ⚠️ [2026-08-27 新增] 暂借拉丁图标（希腊石造，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    THRACIAN: { // ⚠️ [2026-08-27 新增] 暂借斯拉夫图标（色雷斯巴尔干，待专属素材）
        small: resolvePath('/cities/slavic_small.png'),
        medium: resolvePath('/cities/slavic_medium.png'),
        big: resolvePath('/cities/slavic_big.png'),
        pass: resolvePath('/cities/slavic_pass.png')
    },
    PERSIAN: { // ⚠️ [2026-08-27 新增] 暂借西亚图标（波斯中东，待专属素材）
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    CUMAN: { // ⚠️ [2026-08-27 新增] 暂借草原图标（库曼游牧，待专属素材）
        small: resolvePath('/cities/nomadic_small.png'),
        medium: resolvePath('/cities/nomadic_medium.png'),
        big: resolvePath('/cities/nomadic_big.png'),
        pass: resolvePath('/cities/nomadic_pass.png')
    },
    BRITONS: { // 继承 GERMANIC 城市素材 // ✅ 日耳曼
        small: resolvePath('/cities/germanic_small.png'),
        medium: resolvePath('/cities/germanic_medium.png'),
        big: resolvePath('/cities/germanic_big.png'),
        pass: resolvePath('/cities/germanic_pass.png')
    },
    GOTHS: { // 继承 GERMANIC 城市素材 // ✅ 日耳曼
        small: resolvePath('/cities/germanic_small.png'),
        medium: resolvePath('/cities/germanic_medium.png'),
        big: resolvePath('/cities/germanic_big.png'),
        pass: resolvePath('/cities/germanic_pass.png')
    },
    HUNS: { // 继承 STEPPE 城市素材 // ✅ 继承原 NOMADIC 全部 PNG (nomadic_*.png)，吞掉原 SIBERIA
        small: resolvePath('/cities/nomadic_small.png'),
        medium: resolvePath('/cities/nomadic_medium.png'),
        big: resolvePath('/cities/nomadic_big.png'),
        pass: resolvePath('/cities/nomadic_pass.png')
    },
    TEUTONS: { // 继承 GERMANIC 城市素材 // ✅ 日耳曼
        small: resolvePath('/cities/germanic_small.png'),
        medium: resolvePath('/cities/germanic_medium.png'),
        big: resolvePath('/cities/germanic_big.png'),
        pass: resolvePath('/cities/germanic_pass.png')
    },
    VIKINGS: { // 继承 SLAVIC 城市素材 // ✅ 斯拉夫
        small: resolvePath('/cities/slavic_small.png'),
        medium: resolvePath('/cities/slavic_medium.png'),
        big: resolvePath('/cities/slavic_big.png'),
        pass: resolvePath('/cities/slavic_pass.png')
    },
    CELTS: { // 继承 GERMANIC 城市素材 // ✅ 日耳曼
        small: resolvePath('/cities/germanic_small.png'),
        medium: resolvePath('/cities/germanic_medium.png'),
        big: resolvePath('/cities/germanic_big.png'),
        pass: resolvePath('/cities/germanic_pass.png')
    },
    ITALIANS: { // 继承 LATIN 城市素材 // ✅ 拉丁
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    SICILIANS: { // 继承 LATIN 城市素材 // ✅ 拉丁
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    BULGARIANS: { // 继承 SLAVIC 城市素材 // ✅ 斯拉夫
        small: resolvePath('/cities/slavic_small.png'),
        medium: resolvePath('/cities/slavic_medium.png'),
        big: resolvePath('/cities/slavic_big.png'),
        pass: resolvePath('/cities/slavic_pass.png')
    },
    MAGYAR: { // 继承 STEPPE 城市素材 // ✅ 继承原 NOMADIC 全部 PNG (nomadic_*.png)，吞掉原 SIBERIA
        small: resolvePath('/cities/nomadic_small.png'),
        medium: resolvePath('/cities/nomadic_medium.png'),
        big: resolvePath('/cities/nomadic_big.png'),
        pass: resolvePath('/cities/nomadic_pass.png')
    },
    LITHUANIANS: { // 继承 SLAVIC 城市素材 // ✅ 斯拉夫
        small: resolvePath('/cities/slavic_small.png'),
        medium: resolvePath('/cities/slavic_medium.png'),
        big: resolvePath('/cities/slavic_big.png'),
        pass: resolvePath('/cities/slavic_pass.png')
    },
    POLES: { // 继承 SLAVIC 城市素材 // ✅ 斯拉夫
        small: resolvePath('/cities/slavic_small.png'),
        medium: resolvePath('/cities/slavic_medium.png'),
        big: resolvePath('/cities/slavic_big.png'),
        pass: resolvePath('/cities/slavic_pass.png')
    },
    BOHEMIANS: { // 继承 SLAVIC 城市素材 // ✅ 斯拉夫
        small: resolvePath('/cities/slavic_small.png'),
        medium: resolvePath('/cities/slavic_medium.png'),
        big: resolvePath('/cities/slavic_big.png'),
        pass: resolvePath('/cities/slavic_pass.png')
    },
    BURGUNDIANS: { // 继承 LATIN 城市素材 // ✅ 拉丁
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    SPANISH: { // 继承 LATIN 城市素材 // ✅ 拉丁
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    PORTUGUESE: { // 继承 LATIN 城市素材 // ✅ 拉丁
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    ETHIOPIANS: { // 继承 AFRICA 城市素材 // ⚠️ [2026-08-24 新增] 暂借拉丁图标（非洲，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    BENGALIS: { // 继承 INDIA 城市素材 // ⚠️ 暂借滇缅图标（南亚，待专属素材）
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    GURJARAS: { // 继承 INDIA 城市素材 // ⚠️ 暂借滇缅图标（南亚，待专属素材）
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    PORUS: { // 继承 PURU 城市素材 // ⚠️ [2026-08-27 新增] 暂借印度图标（南印度，待专属素材）
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    VIETNAMESE: { // 继承 DIANQIAN 城市素材 // ✅ 已有
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    KHMER: { // 继承 DIANQIAN 城市素材 // ✅ 已有
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    MAYANS: { // 继承 AMERICA 城市素材 // ⚠️ [2026-08-24 新增] 暂借拉丁图标（美洲石造建筑，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    MAPUCHE: { // 继承 ANDE 城市素材 // ⚠️ [2026-08-27 新增] 暂借拉丁图标（安第斯石造，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    MUISCA: { // 继承 ANDE 城市素材 // ⚠️ [2026-08-27 新增] 暂借拉丁图标（安第斯石造，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    TUPI: { // 继承 ANDE 城市素材 // ⚠️ [2026-08-27 新增] 暂借拉丁图标（安第斯石造，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    ARMENIANS: { // 继承 CENTRAL_ASIA 城市素材
        small: resolvePath('/cities/central_asia_small.png'),
        medium: resolvePath('/cities/central_asia_medium.png'),
        big: resolvePath('/cities/central_asia_big.png'),
        pass: resolvePath('/cities/central_asia_pass.png')
    },
    GEORGIANS: { // 继承 CENTRAL_ASIA 城市素材
        small: resolvePath('/cities/central_asia_small.png'),
        medium: resolvePath('/cities/central_asia_medium.png'),
        big: resolvePath('/cities/central_asia_big.png'),
        pass: resolvePath('/cities/central_asia_pass.png')
    },
    ATHENIANS: { // 继承 GREEK 城市素材 // ⚠️ [2026-08-27 新增] 暂借拉丁图标（希腊石造，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    SPARTANS: { // 继承 GREEK 城市素材 // ⚠️ [2026-08-27 新增] 暂借拉丁图标（希腊石造，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    MACEDONIANS: { // 继承 GREEK 城市素材 // ⚠️ [2026-08-27 新增] 暂借拉丁图标（希腊石造，待专属素材）
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    ACHAEMENIDS: { // 继承 PERSIAN 城市素材 // ⚠️ [2026-08-27 新增] 暂借西亚图标（波斯中东，待专属素材）
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    BURMESE: {
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    WALLACHIA: {
        small: resolvePath('/cities/slavic_small.png'),
        medium: resolvePath('/cities/slavic_medium.png'),
        big: resolvePath('/cities/slavic_big.png'),
        pass: resolvePath('/cities/slavic_pass.png')
    },
    EGYPT: {
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    CARTHAGE: {
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    BABYLON: {
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    HITTITES: {
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    ASSYRIAN: {
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    PARTHIA: {
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    SCYTHIANS: {
        small: resolvePath('/cities/nomadic_small.png'),
        medium: resolvePath('/cities/nomadic_medium.png'),
        big: resolvePath('/cities/nomadic_big.png'),
        pass: resolvePath('/cities/nomadic_pass.png')
    },
    BYZANTINE: {
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    FRANKS: {
        small: resolvePath('/cities/germanic_small.png'),
        medium: resolvePath('/cities/germanic_medium.png'),
        big: resolvePath('/cities/germanic_big.png'),
        pass: resolvePath('/cities/germanic_pass.png')
    },
    SASANIAN: {
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    TURKS: {
        small: resolvePath('/cities/nomadic_small.png'),
        medium: resolvePath('/cities/nomadic_medium.png'),
        big: resolvePath('/cities/nomadic_big.png'),
        pass: resolvePath('/cities/nomadic_pass.png')
    },
    NANZHAO: {
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    SRIVIJAYA: {
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },
    KUSHAN: {
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    KUSH: {
        small: resolvePath('/cities/west_asia_small.png'),
        medium: resolvePath('/cities/west_asia_medium.png'),
        big: resolvePath('/cities/west_asia_big.png'),
        pass: resolvePath('/cities/west_asia_pass.png')
    },
    KHITAN: {
        small: resolvePath('/cities/north_small.png'),
        medium: resolvePath('/cities/north_medium.png'),
        big: resolvePath('/cities/north_big.png'),
        pass: resolvePath('/cities/north_pass.png')
    },
    UIGHUR: {
        small: resolvePath('/cities/central_asia_small.png'),
        medium: resolvePath('/cities/central_asia_medium.png'),
        big: resolvePath('/cities/central_asia_big.png'),
        pass: resolvePath('/cities/central_asia_pass.png')
    },
    MOHE: {
        small: resolvePath('/cities/north_small.png'),
        medium: resolvePath('/cities/north_medium.png'),
        big: resolvePath('/cities/north_big.png'),
        pass: resolvePath('/cities/north_pass.png')
    },
    ANGLO_SAXON: {
        small: resolvePath('/cities/latin_small.png'),
        medium: resolvePath('/cities/latin_medium.png'),
        big: resolvePath('/cities/latin_big.png'),
        pass: resolvePath('/cities/latin_pass.png')
    },
    AVARS: {
        small: resolvePath('/cities/slavic_small.png'),
        medium: resolvePath('/cities/slavic_medium.png'),
        big: resolvePath('/cities/slavic_big.png'),
        pass: resolvePath('/cities/slavic_pass.png')
    },
    GHANA: {
        small: resolvePath('/cities/africa_small.png'),
        medium: resolvePath('/cities/africa_medium.png'),
        big: resolvePath('/cities/africa_big.png'),
        pass: resolvePath('/cities/africa_pass.png')
    },
    KHAZARS: {
        small: resolvePath('/cities/central_asia_small.png'),
        medium: resolvePath('/cities/central_asia_medium.png'),
        big: resolvePath('/cities/central_asia_big.png'),
        pass: resolvePath('/cities/central_asia_pass.png')
    },
};

// 5. Main Accessor
export function getCityImage(city: { lat?: number; lng?: number; latitude?: number; longitude?: number; type: CityType; id: string; region?: string }): string {
    // Resolve Coordinates (Support both CityData and Runtime City)
    const lat = city.lat ?? city.latitude;
    const lng = city.lng ?? city.longitude;

    if (lat === undefined || lng === undefined) {
        console.warn(`[RegionSystem] City ${city.id} missing coordinates!`);
        return resolvePath('/cities/city_small.png');
    }

    const exclusiveIcon = getCityExclusiveIconPath(city.id);
    if (exclusiveIcon) {
        return resolvePath(exclusiveIcon);
    }

    // 其它 zhiding 专属（西方等）
    if (city.id === 'city_rome') return resolvePath('/cities/zhiding/luoma.png');
    if (city.id === 'city_alexandria') return resolvePath('/cities/zhiding/yalishanda.png');
    if (city.id === 'city_antioch') return resolvePath('/cities/zhiding/antiaoke.png');
    if (city.id === 'city_damascus') return resolvePath('/cities/zhiding/damashige.png');
    if (city.id === 'city_jerusalem') return resolvePath('/cities/zhiding/yelusaleng.png');
    if (city.id === 'city_baghdad') return resolvePath('/cities/zhiding/bageda.png');
    if (city.id === 'city_constantinople') return resolvePath('/cities/zhiding/junshitanding.png');
    if (city.id === 'city_venice') return resolvePath('/cities/zhiding/weinisi.png');
    if (city.id === 'city_ctesiphon') return resolvePath('/cities/zhiding/taixifeng.png');
    if (city.id === 'city_rayy') return resolvePath('/cities/zhiding/leiyi.png');

    // const config = CITY_CONFIG[city.type]; // Removed dependency
    let scale: CityScale = 'small';

    if (city.type === 'big_city') {
        scale = 'big';
    } else if (city.type === 'medium_city') {
        scale = 'medium';
    } else if (city.type === 'pass') {
        scale = 'pass';
    } else {
        // 小城 + 城寨都走 small 图。
        // 🔴 [2026-09-03 主人定] 城寨**暂时复用本区小城图**，等专属立绘出来再给 STYLE_MAP 加第 5 档
        //    （命名建议 <区名>_zhai.png）。在那之前城寨和小城长得一样，是有意为之，不是漏配。
        scale = 'small';
    }

    // 3. Identify Region (Hybrid: Explicit Override + Auto-detection)
    const region = getCityRegion({ latitude: lat as number, longitude: lng as number, region: city.region });

    // 4. Map to Image
    const styleSet = STYLE_MAP[region];
    let image = styleSet[scale];

    // Fallback if specific scale is missing in some sparse sets
    if (!image) image = styleSet.small;

    return image;
}




// ═══════════════════════════════════════════════════════════════
// 【15 区中心 — 2026-05-30 立（2026-06-28 中原改单核洛阳）】
//
// 15 文化区 = 14 个中心。
//
// 用途:
//   1. 道路骨架: 同区据点向中心连接 (build_region_skeleton.mjs 待写)
//   2. AI 战略目标: 占领区中心 = 控制全区
//   3. UI: 区中心可高亮 / 渲染特殊符号
//
// ⚠️ 此处的"中心" ≠ big_city
//    - 区中心是 "文化-政治意义的核心"
//    - big_city 是 "累计国都年 ≥ 92 或人口 ≥ 50万"
//    - 二者独立: 例: 姑臧 是 HEXI 中心, 但等级 medium_city
//                    临淄 可为 medium_city, 但不是 NORTH 中心 (北京才是)
//
// ⚠️ 任何 AI 不许擅自改变这 15 个 cityId
//    增减需项目主人 (人类) 显式同意 + 同步更新 AGENTS.md §七
// ═══════════════════════════════════════════════════════════════

export const REGION_CENTERS: Record<RegionType, string[]> = {
    CENTRAL:      ['city_luoyang'],                // 洛阳
    NORTH:        ['city_beijing'],                  // 北京
    JIANGNAN:     ['city_nanjing'],                  // 南京
    LINGNAN:      ['city_panyu'],                    // 番禺 (古名, 即广州)
    BASHU:        ['city_chengdu'],                  // 成都
    DIANQIAN:     ['city_dianchi'],                // 滇池 (古滇王国都城)              // 羊苴咩（缅甸拆为独立文化区后，滇缅余区中心回归大理）
    HEXI:         ['city_wuwei'],                    // 姑臧 (古名, 即凉州/武威)
    WESTERN:      ['city_yiluolucheng'],             // 伊逻卢城 (龟兹国都; 延城)
    TIBET:        ['city_luoxie'],                   // 逻些 (古名, 即拉萨)
    STEPPE:       ['city_karakorum'],                // 哈拉和林
    NORTHEAST:    ['city_gaxian'],                   // 嘎仙洞 (拓跋鲜卑发祥圣地)
    KOREA:        ['city_kaesong'],                  // 开城 (高丽都)
    JAPAN:        ['city_kyoto'],                    // 京都 (平安京)
    CENTRAL_ASIA: ['city_urgench'],                  // 玉龙杰赤 (花剌子模都城; 主人 2026-07-05 改, 原撒马尔罕)
    WEST_ASIA:    ['city_bageda'],                     // 巴格达 (阿拔斯王朝都城; 2026-08-18 改: 原君士坦丁堡的 region 字段与坐标判定均落在 LATIN,
                                                     //          吃拉丁系数却享西亚中心加成,故换回本区内的城)
    SLAVIC:       ['city_mosike'],                       // 莫斯科 (莫斯科公国/东斯拉夫核心; 2026-08-27 原基辅迁东欧改)
    EAST:         ['city_jifu'],                         // 基辅 (基辅罗斯都城; 2026-08-27 新增东欧区)
    GERMANIC:     ['city_kelong'],                       // 科隆 (罗马日耳曼尼亚行省首府→法兰克重镇→德意志最大城市; 2026-08-02 原巴黎归拉丁改)
    LATIN:        ['city_luoma'],                      // 罗马 (罗马帝国都城)
    INDIA:        ['city_huashicheng'],               // 华氏城 (孔雀帝国都城/古典印度核心)
    BERBER:       ['city_malajiashen'],               // 马拉喀什 (穆拉比特/穆瓦希德柏柏尔帝国核心)
    AMERICA:      ['city_tenochtitlan'],              // 特诺奇提特兰 (阿兹特克都; 2026-08-24 新增美洲区)
    AFRICA:       ['city_aksum'],                     // 阿克苏姆 (阿克苏姆帝国都; 2026-08-24 新增非洲区)
    MALAY:        ['city_malacca'],                   // 马六甲 (满剌加苏丹国都; 2026-08-24 新增马来区)
    ANDE:         ['city_cusco'],                     // 库斯科 (印加帝都; 2026-08-27 新增安第斯区)
    PURU:         ['city_tanjiawuer'],                // 坦贾武尔 (朱罗帝都; 2026-08-27 新增南印度区)
    ORIE:         ['city_maijia'],                    // 麦加 (伊斯兰圣城; 2026-08-27 新增阿拉伯区)
    GREEK:        ['city_yadian'],                    // 雅典 (希腊文明圣城)                    // 底比斯 (爱琴海城邦核心; 2026-08-27 撤销并入拉丁)
    THRACIAN:     ['city_teernuowo'],                 // 特尔诺沃 (第二保加利亚帝国都城; 2026-08-27 新增色雷斯区)
    PERSIAN:      ['city_yisifahan'],                 // 伊斯法罕 (萨法维波斯帝都; 2026-08-27 新增波斯区)
    CUMAN:        ['city_salai'],                     // 萨莱 (金帐汗国帝都; 2026-08-27 新增库曼区)
    BRITONS: ['city_lundun'],  // 英格兰（中心据点已挂）
    GOTHS: ['city_toulouse'],  // 哥特（中心据点已挂）
    HUNS: ['city_saigede'],  // 匈人（中心据点已挂）
    TEUTONS: ['city_kenisibao'],  // 条顿（中心据点已挂）
    VIKINGS: ['city_gebenhagen'],  // 维京（中心据点已挂）
    CELTS: ['city_aidingbao'],  // 凯尔特（中心据点已挂）
    ITALIANS: ['city_genoa'],  // 意大利（中心据点已挂）
    SICILIANS: ['city_palermo'],  // 西西里（中心据点已挂）
    BULGARIANS: ['city_puleisilafu'],  // 保加利亚（中心据点已挂）
    MAGYAR: ['city_budapeisi'],  // 马扎尔（中心据点已挂）
    LITHUANIANS: ['city_weierniwusi'],  // 立陶宛（中心据点已挂）
    POLES: ['city_kelakefu'],  // 波兰（中心据点已挂）
    BOHEMIANS: ['city_bulage'],  // 波希米亚（中心据点已挂）
    BURGUNDIANS: ['city_dijon'],  // 勃艮第（中心据点已挂）
    SPANISH: ['city_toledo'],  // 西班牙（中心据点已挂）
    PORTUGUESE: ['city_lisiben'],  // 葡萄牙（中心据点已挂）
    ETHIOPIANS: ['city_lalibeila'],  // 埃塞俄比亚（中心据点已挂）
    BENGALIS: ['city_gaodacheng'],  // 孟加拉（中心据点已挂）
    GURJARAS: ['city_patan'],  // 瞿折罗（中心据点已挂）
    PORUS: ['city_atuoke'],  // 补噜（中心据点已挂）
    VIETNAMESE: ['city_shenglong'],  // 越南（中心据点已挂）
    KHMER: ['city_angkor'],  // 高棉（中心据点已挂）
    MAYANS: ['city_tikal'],  // 玛雅（中心据点已挂）
    MAPUCHE: ['city_tucapel'],  // 马普切（中心据点已挂）
    MUISCA: ['city_bacata'],  // 穆伊斯卡（中心据点已挂）
    TUPI: ['city_guanabara'],  // 图皮（中心据点已挂）
    ARMENIANS: ['city_ailiwen'],  // 亚美尼亚（中心据点已挂）
    GEORGIANS: ['city_dibilisi'],  // 格鲁吉亚（中心据点已挂）
    ATHENIANS: ['city_yadian'],  // 雅典（中心据点已挂）
    SPARTANS: ['city_sparta'],  // 斯巴达（中心据点已挂）
    MACEDONIANS: ['city_salonica'],  // 马其顿-佩拉（中心据点已挂）
    ACHAEMENIDS: ['city_bosibolisi'],  // 波斯波利斯（阿契美尼德帝都）
    BURMESE: ['city_pagan'],  // 缅甸（蒲甘王朝都）
    WALLACHIA: ['city_teergewishite'],  // 瓦拉几亚（特尔戈维什泰）
    EGYPT: ['city_mengfeisi'],          // 埃及（孟菲斯，古王国都城）
    CARTHAGE: ['city_jiataji'],          // 迦太基（迦太基都城）
    BABYLON: ['city_babilun'],          // 巴比伦（巴比伦帝都）
    HITTITES: ['city_hatusha'],          // 赫梯（哈图沙都城）
    ASSYRIAN: ['city_niniwei'],         // 亚述（尼尼微帝都）
    PARTHIA: ['city_nisa'],             // 安息（尼萨王都）
    SCYTHIANS: ['city_asu'],            // 斯基泰（阿速城/塔纳伊斯游牧贸易王庭）
    BYZANTINE: ['city_junshitandingbao'], // 拜占庭（君士坦丁堡帝都）
    FRANKS: ['city_kelong', 'city_yachen'], // 法兰克（科隆加洛林重镇、亚琛帝都）
    SASANIAN: ['city_feiluzhabade'],     // 萨珊（菲鲁扎巴德开国帝都）
    TURKS: ['city_otuken', 'city_suiye'], // 突厥（于都斤山神圣牙帐、碎叶重镇）
    NANZHAO: ['city_mengshe', 'city_dali_city'], // 南诏（蒙舍诏故都、羊苴咩城大理都城）
    SRIVIJAYA: ['city_sanfoqi'],        // 三佛齐（室利佛逝巨港都城）
    KUSHAN: ['city_baishawa', 'city_lanshi'], // 贵霜（白沙瓦帝都、蓝氏城故都）
    KUSH: ['city_mailuoe'],             // 库施（麦罗埃黑金字塔都城）
    KHITAN:      ['city_shangjing'],
    UIGHUR:      ['city_woluoduobali'],
    MOHE:        ['city_shangjing_longquan'],
    ANGLO_SAXON: ['city_winchester'],
    AVARS:       ['city_pannonia'],
    GHANA:       ['city_kumbi_saleh'],
    KHAZARS:     ['city_itil'],
};

/** 辅助: 判断某城是否为某区的核心城 */
export function isRegionCenter(cityId: string): boolean {
    return Object.values(REGION_CENTERS).some(arr => arr.includes(cityId));
}

/** 辅助: 取某区的中心 cityId 列表 (所有区返回 1 个) */
export function getRegionCenters(region: RegionType): string[] {
    return REGION_CENTERS[region] || [];
}
