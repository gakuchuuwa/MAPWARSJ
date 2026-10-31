import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import type { GameMap } from './GameMap';
import { LandSeaSystem } from '../world/land-sea';
import { CITIES_V2 } from '../data/cities_v2';
import { strategicSpriteScale } from './strategicSpriteScale';

/**
 * AnimalAmbientLayer — 战略地图「野生动物生态」环境层（2026-08-31 主人定稿）。
 *
 * 需求：
 *   · 按**真实世界分布**：动物散布在全图各文化区，镜头移到哪就看到哪里的动物。
 *   · 只放**野生动物 + 飞鸟**（不放家畜：牛/羊/猪/鸡/马/驴/骆驼/羊驼等）。
 *   · 陆上动物 8 向（idle 吃草/张望），飞鸟 16 向（hover 盘旋）。
 *
 * 实现：
 *   · 全图按 0.5° 网格确定性撒点（由 (列,行) 哈希决定是否有动物 + 哪种 + 偏移），
 *     动物位置固定不跳，只在视口内绘制。
 *   · 独立 canvas + Leaflet pane + rAF 循环，不碰现有渲染。
 *   · 素材来自 public/SUCAI_ANIMAL/，只画主图层 .png（原色）。
 */

type Pt = { lat: number; lng: number };

interface AnimalAsset {
    dir: string;
    action: string;      // 'idle'（陆）或 'fly'/'hover'（鸟）
    dirs16: boolean;
    nDir: number;
    frames: number;
    dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }>;
    sheets: (HTMLImageElement | null)[];
    ready: boolean;
    /** 最近一次被绘制用到的时刻（字节预算 LRU 淘汰用） */
    lastUsed: number;
}

type LandAction = 'idle' | 'walk' | 'run';

interface AnimalEntry {
    id: string;          // 网格标识（如 `${col},${row}`）
    dir: string;
    pos: Pt;
    facing: number;      // 方向索引（陆 0-7）
    phase: number;       // 动画相位
    alpha: number;       // 当前透明度 0.0 ~ 1.0（渐显/渐隐）
    fadingOut?: boolean; // 渐隐中
    // 🔴 2026-10-31 主人令「不定期随机朝不同方向跑动，军团或玩家过来时逃跑」：
    home: Pt;            // 出生格中心（不乱跑出活动范围）
    action: LandAction;  // 当前动作：吃草 / 走 / 奔跑
    timer: number;       // 距下次随机决策的秒数
    target: Pt | null;   // 走动目标点（null = 原地吃草）
    fleeTimer: number;   // 逃跑剩余秒数
    fleeDX: number;      // 逃跑方向（单位向量，经纬度空间）
    fleeDY: number;
    seaTimer: number;    // 距下次判海的秒数（每 0.25 秒一次，省查询）
    hibernating?: boolean; // 冬季蛰伏中（熊类；绘制端压低帧率）
}

/** 陆地动物的移动常量（zoom 9 下 0.00275°≈1px：走 ≈18px/s，逃 ≈60px/s） */
const LAND_WALK_SPEED_DEG = 0.05;   // 度/秒
const LAND_FLEE_SPEED_DEG = 0.165;  // 度/秒
const LAND_FLEE_RADIUS_DEG = 0.18;  // 军团/玩家进入 ≈65px 就受惊
const LAND_STEP_MIN_DEG = 0.055;    // 一次随机走动的最短距离 ≈20px
const LAND_STEP_MAX_DEG = 0.19;     // 最长 ≈70px
const LAND_LEASH_DEG = 0.42;        // 离出生格超过 ≈150px 就往回走
const LAND_SEA_CHECK_SEC = 0.25;

/**
 * 🔴 2026-10-31 主人令「动物不要出现在据点附近」：
 *   据点 0.30°（≈33 km，约 110 屏幕像素，恰好是城池图标 + 近郊农舍那一圈）以内不生成野生动物；
 *   走动/逃跑也不许踏进这个圈 —— 中途踏进去立刻停步回头（与「不下水」同一套处理）。
 */
const CITY_CLEAR_DEG = 0.30;
const CITY_INDEX_CELL_DEG = 0.5;

/** DE 巡航飞鸟：跨屏巡游 + 振翅/滑翔交替 + 渐显/渐隐 */
interface BirdAgent {
    dir: string;
    lat: number;
    lng: number;
    targetLat: number;
    targetLng: number;
    hovering: boolean;   // false = fly 振翅巡航, true = hover 展翅滑翔
    timer: number;      // 动作交替计时器（秒）
    phase: number;
    alpha: number;       // 当前透明度 0.0 ~ 1.0（渐显/渐隐）
    fadingOut?: boolean; // 渐隐中
}

// ── 可调参数 ──────────────────────────────────────────────────────────────
const CELL_DEG = 0.5;               // 撒点网格尺寸（度）
const LAND_DENSITY = 0.11;          // 陆地格出现动物的概率（🔴 2026-10-31 主人令「不要搞得永远都看不到」：0.07→0.11，zoom 9 一屏约 12 只）
const BIRD_DENSITY = 0.08;          // 格出现飞鸟的概率（稀疏点缀，视野内偶见 1~2 只翱翔，不喧宾夺主）
/** 🔴 2026-10-31 主人令「陆海空动物的显示比例统一，大小对齐 DE」：野生动物与飞鸟改用与军团/家畜同一 DE 基准
 *  （strategicSpriteScale，zoom 9 基准 0.7 ×2^(zoom-9)），不再单独写 0.6，否则同一只鹿在野外比猎人身旁大 25%。 */
const ANIMAL_MIN_ZOOM = 9;          // 🔴 [2026-09-01 主人定] 动物只在 9 和 10 这两级显示
const ANIMAL_MAX_ZOOM = 10;
// 🔴 [2026-08-31 修「攻城战只显示攻城武器」] 必须低于 UNITS_LOW(580)。
//    580 是攻城战里**画在城池背后**的那批士兵所在的层；本层原值压在它之上，
//    等于把攻城方的士兵整个涂掉，只剩画在主层(UNITS=620)的攻城器械还看得见。
const PANE_ZINDEX = 560;            // 陆地动物：最底（低于植被565/商队570/UNITS_LOW580）
// 🔴 [2026-10-15 主人报「飞行动物好像在建筑下层，这是不对的」]
//    据点建筑 cityPane 为 610、奇观 monumentPane 为 615、军团 unitsPane 为 620。
//    飞行动物（飞鸟）在空中翱翔，必须显示在建筑与地面部队之上！
const BIRD_PANE_ZINDEX = 635;       // 飞鸟高空层：高于据点(610)/奇观(615)/军团(620)
const CULL_MARGIN_DEG = 0.6;        // 视口外多算一圈，避免边缘弹入
const BIRD_DRIFT_RADIUS_PX = 70;    // 飞鸟盘旋半径（屏幕像素，与翼展匹配的高空开阔盘旋）
const BIRD_DRIFT_SPEED = 0.4;       // 飞鸟盘旋角速度（rad/s，约 15.7s 一圈）
// ──────────────────────────────────────────────────────────────────────────

// ── 生态分区（按世界动物地理区划，坐标优先）────────────────────────────────
// 🔴 2026-10-31 主人令「优化动物的出现地，不要错乱……玩家主要在欧亚大陆、北非、美洲，不要搞得永远都看不到」：
//   旧实现只认 RegionSystem 的 19 个城环，环外一律 `return 'CENTRAL'` 兜底 ——
//   于是美洲、撒哈拉以南非洲、东南亚全被当成「东亚」，屏幕上出现的是梅花鹿/野猪/老虎；
//   而 MALAY / ANDE / AMERICA 三个桶永远走不到，科莫多、貘、美洲豹、美洲鸵、水豚、西貒、凯门鳄、
//   金刚鹦鹉、安第斯神鹰共 10 种在战略地图一次都不会出现。
//   现在改成：**先按经纬度判生物地理界（美洲/撒南非洲/东南亚/北极这些城环覆盖不到的地方），
//   判不出来的欧亚内陆才回落 19 个城环**，两套并存，谁也不会掉进 CENTRAL 兜底。
interface RealmPool { land: string[]; birds: string[] }
export type RealmKey =
    | 'ARCTIC' | 'BOREAL' | 'NEARCTIC' | 'NEOTROPIC' | 'ANDES' | 'PATAGONIA'
    | 'AFROTROPIC' | 'NORTH_AFRICA' | 'MIDEAST' | 'TIBET'
    | 'ORIENTAL_INDIA' | 'ORIENTAL_SEA' | 'ORIENTAL_CHINA' | 'EASTASIA' | 'JAPAN'
    | 'STEPPE' | 'NORTHEAST' | 'EUROPE';

/**
 * 18 个生物地理区 → 物种池（🔴 2026-10-31 主人令「所有动物都要套用，按真实的地理分布重新分布」）。
 * 每个物种都按**原生分布**放到它真正生活的区，绝不为了凑数跨洲借用：
 *   非洲区只出非洲种，美洲区只出美洲种，旧大陆的虎／孔雀／象／犀不进美洲，美洲豹／水豚／貘不进旧大陆。
 * 素材库里 72 种全部有落点（陆地野生 43 种 + 飞鸟 11 种 + 家畜 15 种走民生层 + 海洋 6 种走海洋层）。
 */
const REALMS: Readonly<Record<RealmKey, RealmPool>> = {
    /** 北极圈（lat ≥ 66）：北极熊、海象、海豹（冰海沿岸）、北极狼/狐/兔，驼鹿与猞猁的泰加林缘 */
    ARCTIC: {
        land: ['BEAR_POLAR', 'WALRUS', 'SEAL', 'WOLF_ARCTIC', 'FOX_ARCTIC', 'HARE_ARCTIC', 'ELK', 'LYNX', 'WOLF'],
        birds: ['RAVEN', 'OWL', 'FALCON'],
    },
    /** 寒温带泰加（lat 62–66）：驼鹿、猞猁、狼、棕熊、赤狐、雪兔、野猪、马鹿 */
    BOREAL: {
        land: ['ELK', 'LYNX', 'WOLF', 'BEAR', 'FOX_RED', 'HARE_BROWN', 'BOAR', 'DEER'],
        birds: ['RAVEN', 'OWL', 'FALCON', 'CRANE'],
    },
    /** 新北界·北美（西经 30 以西、lat ≥ 22）：白尾鹿、野火鸡、黑熊、棕熊、灰狼、赤狐、西貒、雪鞋兔、马鹿、加拿大猞猁 */
    NEARCTIC: {
        land: ['DEER', 'ELK', 'TURKEY', 'BEAR_BLACK', 'BEAR', 'WOLF', 'FOX_RED', 'JAVELINA', 'HARE_GREY', 'LYNX'],
        birds: ['VULTURE', 'HAWK', 'FALCON', 'OWL', 'RAVEN', 'CONDOR'],
    },
    /** 新热带界·中美—亚马孙—巴西：美洲豹、水豚、中美貘、凯门鳄、卷尾猴、美洲鳄、西貒、眼斑火鸡 */
    NEOTROPIC: {
        land: ['JAGUAR', 'CAPYBARA', 'TAPIR', 'CAIMAN', 'CROCODILE', 'MONKEY', 'JAVELINA', 'TURKEY'],
        birds: ['MACAW', 'VULTURE', 'HAWK', 'OWL', 'FALCON'],
    },
    /** 安第斯—潘帕斯（南美南部）：原驼、美洲鸵、山貘、欧洲野兔（近代引入且极盛） */
    ANDES: {
        land: ['GUANACO', 'RHEA', 'TAPIR', 'HARE_GREY'],
        birds: ['CONDOR', 'HAWK', 'FALCON', 'OWL'],
    },
    /** 巴塔哥尼亚—火地岛（南纬 35 以南、西经 55 以西）：原驼、美洲鸵、麦哲伦企鹅、欧洲野兔（南美无北方海豹，不放） */
    PATAGONIA: {
        land: ['GUANACO', 'RHEA', 'PENGUIN', 'HARE_GREY'],
        birds: ['CONDOR', 'HAWK', 'FALCON', 'OWL'],
    },
    /** 埃塞俄比亚界·撒哈拉以南非洲：狮、斑马、瞪羚、鸵鸟、象、犀、鳄、狒狒、非洲豹、非洲野犬、非洲蛇 */
    AFROTROPIC: {
        land: ['LION', 'ZEBRA', 'GAZELLE', 'OSTRICH', 'ELEPHANT', 'RHINO', 'CROCODILE', 'MONKEY', 'BLACK_PANTHER', 'WAR_DOG', 'SNAKE_GROUND'],
        birds: ['FLAMINGO', 'VULTURE', 'STORK', 'CRANE', 'FALCON', 'HAWK', 'OWL'],
    },
    /** 北非—撒哈拉—阿拉伯：巴巴里狮（历史）、瞪羚、阿拉伯狼、努比亚北山羊、角蝰、阿拉伯鸵鸟（1970 年代灭绝） */
    NORTH_AFRICA: {
        land: ['LION', 'GAZELLE', 'WOLF_ARABIAN', 'IBEX', 'SNAKE_GROUND', 'OSTRICH'],
        birds: ['FLAMINGO', 'VULTURE', 'FALCON', 'HAWK', 'OWL'],
    },
    /** 西亚（安纳托利亚、黎凡特、两河、伊朗）：波斯瞪羚、灰狼、北山羊、亚美尼亚盘羊、蛇 */
    MIDEAST: {
        land: ['GAZELLE', 'WOLF', 'IBEX', 'MOUFLON', 'SNAKE_GROUND'],
        birds: ['VULTURE', 'FALCON', 'HAWK', 'OWL', 'FLAMINGO'],
    },
    /** 青藏高原—帕米尔—兴都库什：雪豹、北山羊、盘羊、岩羊、藏棕熊、藏野驴、藏羚/鹅喉羚 */
    TIBET: {
        land: ['SNOWLEOPARD', 'IBEX', 'ARGALI', 'MOUFLON', 'WOLF', 'BEAR', 'DONKEY', 'GAZELLE'],
        birds: ['VULTURE', 'FALCON', 'HAWK', 'OWL'],
    },
    /** 东洋界·印度次大陆：虎、亚洲狮、象、印度犀、蓝孔雀、猕猴、沼鳄、水蛇、花鹿、豺 */
    ORIENTAL_INDIA: {
        land: ['TIGER', 'LION', 'ELEPHANT', 'RHINO', 'PEACOCK', 'MONKEY', 'CROCODILE', 'SNAKE_WATER', 'DEER', 'WAR_DOG'],
        birds: ['FLAMINGO', 'CRANE', 'VULTURE', 'FALCON', 'HAWK', 'OWL', 'STORK'],
    },
    /** 东洋界·东南亚（马来、苏门答腊、爪哇、婆罗洲、苏拉威西）：虎、马来貘、科莫多巨蜥、绿孔雀、象、犀、鳄、水蛇、豺 */
    ORIENTAL_SEA: {
        land: ['TIGER', 'TAPIR', 'KOMODO', 'PEACOCK', 'MONKEY', 'ELEPHANT', 'RHINO', 'CROCODILE', 'SNAKE_WATER', 'WAR_DOG'],
        birds: ['CRANE', 'HAWK', 'FALCON', 'OWL', 'FLAMINGO'],
    },
    /** 东洋界·华南（岭南、云贵、海南）：华南虎、亚洲象、中国犀、猕猴、水蛇、水鹿、野猪、豺 */
    ORIENTAL_CHINA: {
        land: ['TIGER', 'ELEPHANT', 'RHINO', 'MONKEY', 'SNAKE_WATER', 'DEER', 'BOAR', 'WAR_DOG'],
        birds: ['PHEASANT', 'CRANE', 'HAWK', 'FALCON', 'OWL'],
    },
    /** 东亚汉地（华北、中原、江淮、河西、朝鲜）：鹿、野猪、狼、棕熊、黑熊、赤狐、草兔、雉鸡、猕猴、虎、马鹿、猞猁 */
    EASTASIA: {
        land: ['DEER', 'BOAR', 'WOLF', 'BEAR', 'BEAR_BLACK', 'FOX_RED', 'HARE_BROWN', 'PHEASANT', 'MONKEY', 'TIGER', 'ELK', 'LYNX'],
        birds: ['CRANE', 'STORK', 'HAWK', 'FALCON', 'OWL', 'PHEASANT'],
    },
    /** 日本列岛：日本鹿、野猪、日本狼（已灭绝）、棕熊、亚洲黑熊、赤狐、日本野兔、日本猕猴（无虎豹） */
    JAPAN: {
        land: ['DEER', 'BOAR', 'WOLF', 'BEAR', 'BEAR_BLACK', 'FOX_RED', 'HARE_BROWN', 'MONKEY'],
        birds: ['CRANE', 'HAWK', 'FALCON', 'OWL'],
    },
    /** 欧亚草原（蒙古高原、哈萨克、伏尔加—顿河）：狼、马鹿、棕熊、赤狐、草兔、野猪、驼鹿、蒙古野驴、鹅喉羚、普氏野马 */
    STEPPE: {
        land: ['WOLF', 'DEER', 'BEAR', 'FOX_RED', 'HARE_BROWN', 'BOAR', 'ELK', 'DONKEY', 'GAZELLE', 'HORSE'],
        birds: ['FALCON', 'VULTURE', 'CRANE', 'HAWK', 'OWL'],
    },
    /** 北亚泰加（西伯利亚、远东）：驼鹿、猞猁、狼、棕熊、赤狐、雪兔、野猪、马鹿 */
    NORTHEAST: {
        land: ['ELK', 'LYNX', 'WOLF', 'BEAR', 'FOX_RED', 'HARE_BROWN', 'BOAR', 'DEER'],
        birds: ['RAVEN', 'CRANE', 'HAWK', 'FALCON', 'OWL'],
    },
    /** 欧洲（含地中海北岸、巴尔干、不列颠、北欧南部）：马鹿、野猪、灰狼、棕熊、赤狐、草兔、欧洲盘羊、北山羊、驼鹿、猞猁、蛇 */
    EUROPE: {
        land: ['DEER', 'BOAR', 'WOLF', 'BEAR', 'FOX_RED', 'HARE_BROWN', 'MOUFLON', 'IBEX', 'ELK', 'LYNX', 'SNAKE_GROUND'],
        birds: ['STORK', 'FALCON', 'HAWK', 'OWL', 'RAVEN'],
    },
};

/**
 * 经纬度 → 生物区键（**战略地图唯一入口**，纯坐标判定）。
 * 🔴 不再用 RegionSystem.getRegion：它只认 19 个城环，环外一律 'CENTRAL'，
 *    美洲/撒南非洲/东南亚/爱尔兰/埃及/印度全被当成中原出东亚动物，且城环本身留了大量空洞。
 * 顺序即优先级：极地 → 美洲 → 西亚 → 非洲 → 高原 → 南亚 → 日本 → 华南 → 东南亚 → 东亚 → 泰加 → 草原 → 欧洲。
 */
export function realmKeyAt(lat: number, lng: number): RealmKey {
    if (lat >= 66) return 'ARCTIC';
    if (lat >= 62) return 'BOREAL';
    if (lng <= -30) {
        if (lat <= -35) return 'PATAGONIA';
        if (lat <= -12) return 'ANDES';
        if (lat < 22) return 'NEOTROPIC';
        return 'NEARCTIC';
    }
    if (lat >= 12 && lat < 42 && lng >= 35 && lng < 62) return 'MIDEAST';
    if (lat < 19 && lng > -20 && lng < 52) {
        if (lng < 43 || lat < 10) return 'AFROTROPIC';
    }
    if (lat < 35 && lng > -20 && lng < 52) return 'NORTH_AFRICA';
    if (lat >= 33 && lat < 41 && lng >= 62 && lng < 80) return 'TIBET';   // 帕米尔—兴都库什
    if (lat >= 29 && lat < 38 && lng >= 80 && lng < 102) return 'TIBET';  // 青藏高原
    if (lat >= 5 && lat < 33 && lng >= 60 && lng < 92) return 'ORIENTAL_INDIA';
    if (lng >= 130 && lat >= 30 && lat < 50) return 'JAPAN';
    if (lat >= 18 && lat < 26 && lng >= 100 && lng < 122) return 'ORIENTAL_CHINA';
    if (lat >= -11 && lat < 26 && lng >= 92 && lng < 142) return 'ORIENTAL_SEA';
    if (lat >= 20 && lat < 50 && lng >= 100 && lng < 136) return 'EASTASIA';
    if (lat >= 50 && lng >= 45) return 'NORTHEAST';
    if (lat >= 36 && lat < 56 && lng >= 40 && lng < 115) return 'STEPPE';
    if (lat >= 33 && lat < 62 && lng >= -25 && lng < 45) return 'EUROPE';
    if (lat >= 20) return 'EUROPE';
    if (lat >= -12) return 'AFROTROPIC';
    return 'ANDES';
}

/** 经纬度 → 该地野生动物池（陆地 + 飞鸟） */
export function realmAt(lat: number, lng: number): RealmPool {
    return REALMS[realmKeyAt(lat, lng)];
}

/** 危险源（军团 / 玩家）*/
export interface LandThreat { lat: number; lng: number }

/**
 * 真正会冬眠的物种（按真实生物学习性，素材库里只有熊类）：
 *   · 棕熊 BEAR、黑熊／亚洲黑熊 BEAR_BLACK —— 冬季进洞蛰伏，不吃不走、外敌来了也不逃；
 *   · **不冬眠的雪地动物**（有意不列）：北极熊（只有怀孕母熊产仔期蛰伏，公熊冬季照常巡猎）、
 *     北极狐／北极狼／北极兔／雪兔（只换白毛，全年活动）、驼鹿／马鹿（冬季啃树皮）、
 *     海豹／海象（冰下捕食）、猞猁／赤狐／狼（冬季照常狩猎）、企鹅（南半球繁殖季活动）。
 */
export const HIBERNATORS: ReadonlySet<string> = new Set(['BEAR', 'BEAR_BLACK']);

/** 该物种在冬季（season 3 = 冬）且纬度够冷时是否蛰伏 */
export function isHibernating(species: string, lat: number, season: number): boolean {
    return season === 3 && Math.abs(lat) >= 30 && HIBERNATORS.has(species);
}

/** 8 向朝向（与据点民生层 dirFromDelta 同一套：0 东北 1 东 2 东南 3 南 4 西南 5 西 6 西北 7 北） */
export function landDir8(dLat: number, dLng: number): number {
    const deg = ((Math.atan2(dLat, dLng) * 180) / Math.PI + 360) % 360;   // 0 东、90 北
    return (((1 - Math.round(deg / 45)) % 8) + 8) % 8;
}

export interface LandStepOptions {
    isSea: (p: Pt) => boolean;
    rand: () => number;
    /** 🔴 2026-10-31「雪地动物要冬眠」：冬季蛰伏中 —— 不吃不走、外敌来了也不逃 */
    hibernating?: boolean;
    /** 🔴 2026-10-31「动物不要出现在据点附近」：落在据点 0.30° 圈内视同障碍 */
    nearCity?: (p: Pt) => boolean;
}

/**
 * 陆地动物一步行为（2026-10-31 主人令「要不定期，随机朝不同的方向跑动；军团或者玩家过来的时候也要逃跑」）：
 *   ① 没有威胁时：吃草几十秒 → 随机挑一个方向走 20~70px → 再吃草，周而复始（不定时、不定向）；
 *   ② 军团/玩家进入 ≈65px（0.18°）：立刻锁定「远离威胁」的方向奔跑 1.6~3.2 秒，速度是走动的 3 倍；
 *   ③ 一律不下水：选点先判海，跑动中每 0.25 秒复查一次，踩到海面就停步回头；
 *   ④ 离出生格超过 ≈150px（0.42°）就往回走，绝不整场跑丢。
 * 纯函数、无 DOM 依赖，便于离线核查。
 */
export function stepLandEntry(e: AnimalEntry, dt: number, threats: readonly LandThreat[], opts: LandStepOptions): void {
    const { isSea, rand } = opts;
    // 水面与据点圈一律当作走不进去的障碍
    const blocked = (p: Pt): boolean => isSea(p) || (opts.nearCity ? opts.nearCity(p) : false);

    // ⓪ 冬眠（熊类）：不决策、不移动、不逃跑，动作定在 idle；绘制端同时把帧率压到 3 帧/秒，像在伏着喘气
    if (opts.hibernating) {
        e.action = 'idle';
        e.target = null;
        e.fleeTimer = 0;
        return;
    }

    // ① 找最近的威胁
    let threat: LandThreat | null = null;
    let threatDist = Infinity;
    for (const t of threats) {
        const d = Math.hypot(t.lat - e.pos.lat, t.lng - e.pos.lng);
        if (d < threatDist) { threatDist = d; threat = t; }
    }
    if (threat && threatDist < LAND_FLEE_RADIUS_DEG) {
        let dx = e.pos.lng - threat.lng;
        let dy = e.pos.lat - threat.lat;
        const len = Math.hypot(dx, dy);
        if (len < 1e-6) {
            const a = rand() * Math.PI * 2;
            dx = Math.cos(a); dy = Math.sin(a);
        } else {
            dx /= len; dy /= len;
        }
        e.fleeDX = dx;
        e.fleeDY = dy;
        e.fleeTimer = 1.6 + rand() * 1.6;
        e.target = null;
    }

    // ② 动作与目标
    if (e.fleeTimer > 0) {
        e.action = 'run';
    } else if (e.target) {
        e.action = 'walk';
    } else {
        e.action = 'idle';
        e.timer -= dt;
        if (e.timer <= 0) {
            e.timer = 1.6 + rand() * 3.2;
            if (rand() < 0.78) {
                const ang = rand() * Math.PI * 2;
                const step = LAND_STEP_MIN_DEG + rand() * (LAND_STEP_MAX_DEG - LAND_STEP_MIN_DEG);
                let tx = e.pos.lng + Math.cos(ang) * step;
                let ty = e.pos.lat + Math.sin(ang) * step;
                if (Math.hypot(tx - e.home.lng, ty - e.home.lat) > LAND_LEASH_DEG) {
                    tx = e.home.lng + (rand() - 0.5) * 0.1;
                    ty = e.home.lat + (rand() - 0.5) * 0.1;
                }
                const cand = { lat: ty, lng: tx };
                if (!blocked(cand)) {
                    e.target = cand;
                    e.action = 'walk';
                } else if (rand() < 0.5) {
                    // 挑到的方向是海，下次决策提早重试
                    e.timer = 0.6 + rand() * 0.8;
                }
            }
        }
    }

    // ③ 位移
    let vx = 0, vy = 0, speed = 0;
    if (e.action === 'run' && e.fleeTimer > 0) {
        vx = e.fleeDX;
        vy = e.fleeDY;
        speed = LAND_FLEE_SPEED_DEG;
    } else if (e.action === 'walk' && e.target) {
        const dx = e.target.lng - e.pos.lng;
        const dy = e.target.lat - e.pos.lat;
        const len = Math.hypot(dx, dy);
        speed = LAND_WALK_SPEED_DEG;
        if (len <= speed * dt) {
            e.pos = { lat: e.target.lat, lng: e.target.lng };
            e.target = null;
            e.action = 'idle';
            e.timer = 1.2 + rand() * 2.5;
            speed = 0;
        } else {
            vx = dx / len;
            vy = dy / len;
        }
    }

    if (speed > 0) {
        const next = { lat: e.pos.lat + vy * speed * dt, lng: e.pos.lng + vx * speed * dt };
        e.seaTimer -= dt;
        const check = e.seaTimer <= 0;
        if (check) e.seaTimer = LAND_SEA_CHECK_SEC;
        // 据点圈每帧都判（走 O(9) 个桶，代价极低），保证一只也踏不进去；水面仍按 0.25 秒复查
        const intoCity = opts.nearCity ? opts.nearCity(next) : false;
        if (!intoCity && (!check || !isSea(next))) {
            e.pos = next;
            e.facing = landDir8(vy, vx);
        } else {
            // 踩到水面、或走进据点 0.30° 圈：停步、清目标、回头
            e.target = null;
            e.fleeTimer = 0;
            e.action = 'idle';
            e.timer = 1 + rand() * 2;
        }
    }

    // ④ 逃跑计时
    if (e.fleeTimer > 0) {
        e.fleeTimer -= dt;
        if (e.fleeTimer <= 0) {
            e.fleeTimer = 0;
            e.action = 'idle';
            e.timer = 1.5 + rand() * 3;
        }
    }
}

/** 确定性整数哈希 → [0,1)。同 (col,row,salt) 恒同值，保证动物位置不跳。 */
function hash01(col: number, row: number, salt: number): number {
    let h = (col * 374761393 + row * 668265263 + salt * 1274126177) | 0;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return (h >>> 0) / 4294967295;
}

export class AnimalAmbientLayer {
    private map: L.Map;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private birdCanvas: HTMLCanvasElement;
    private birdCtx: CanvasRenderingContext2D;
    private assets: Map<string, AnimalAsset> = new Map();
    private entries: AnimalEntry[] = [];
    private birds: BirdAgent[] = [];
    private lastCellRange: string | null = null;
    private running = false;
    private lastTime = 0;
    private nowMs = 0;

    constructor(map: L.Map) {
        this.map = map;
        this.canvas = document.createElement('canvas');
        this.canvas.style.pointerEvents = 'none';
        this.canvas.className = 'leaflet-zoom-animated';
        this.ctx = this.canvas.getContext('2d')!;

        this.birdCanvas = document.createElement('canvas');
        this.birdCanvas.style.pointerEvents = 'none';
        this.birdCanvas.className = 'leaflet-zoom-animated';
        this.birdCtx = this.birdCanvas.getContext('2d')!;

        this.setupPane();
        // 🔴 [2026-10-28 修复镜头跟随颤抖] 不在 move/zoom 事件里挪动画布，只在 draw() 绘制那一刻统一对齐
        // 不在事件里单独挪动画布，统一在 draw() 绘制那一刻 syncCanvas
        this.map.on('resize', this.resize.bind(this));
        this.resize();
        this.syncCanvas();
    }

    private setupPane(): void {
        const name = 'animalPane';
        if (!this.map.getPane(name)) {
            this.map.createPane(name);
            const pane = this.map.getPane(name)!;
            pane.style.zIndex = String(PANE_ZINDEX);
            pane.style.pointerEvents = 'none';
        }
        this.map.getPane(name)!.appendChild(this.canvas);

        const birdPaneName = 'birdPane';
        if (!this.map.getPane(birdPaneName)) {
            this.map.createPane(birdPaneName);
            const bPane = this.map.getPane(birdPaneName)!;
            bPane.style.zIndex = String(BIRD_PANE_ZINDEX);
            bPane.style.pointerEvents = 'none';
        }
        this.map.getPane(birdPaneName)!.appendChild(this.birdCanvas);
    }

    private resize(): void {
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.birdCanvas.width = size.x;
        this.birdCanvas.height = size.y;
    }

    private syncCanvas(): void {
        const topLeft = this.map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);
        L.DomUtil.setPosition(this.birdCanvas, topLeft);
    }

    public start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.tick.bind(this));
    }

    public stop(): void {
        this.running = false;
    }

    private landVisible = false;
    private birdsVisible = true;

    public setVisible(visible: boolean): void {
        const display = visible ? 'block' : 'none';
        this.canvas.style.display = display;
        this.birdCanvas.style.display = display;
    }

    public setLandVisible(visible: boolean): void {
        if (this.landVisible === visible) return;
        this.landVisible = visible;
        if (!visible) {
            for (const e of this.entries) e.fadingOut = true;
        }
    }

    public setBirdsVisible(visible: boolean): void {
        if (this.birdsVisible === visible) return;
        this.birdsVisible = visible;
        if (!visible) {
            for (const b of this.birds) b.fadingOut = true;
        }
    }

    // ── 素材加载 ────────────────────────────────────────────────────────
    private loadAsset(dir: string, action: string, isBird: boolean): void {
        const key = `${dir}:${action}`;
        if (this.assets.has(key)) return;
        const asset: AnimalAsset = {
            dir, action, dirs16: isBird, nDir: isBird ? 16 : 8,
            frames: 1, dirs: {}, sheets: [], ready: false,
            lastUsed: performance.now(),
        };
        this.assets.set(key, asset);
        const base = `/SUCAI_ANIMAL/${dir}`;
        fetch(`${base}/_meta.json`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`meta ${r.status}`))))
            .then((meta) => {
                asset.dirs16 = meta.dirs16 === true;
                asset.nDir = meta.nDir ?? (asset.dirs16 ? 16 : 8);
                const act = meta[action] ? action : (asset.dirs16 ? 'fly' : 'walk');
                asset.frames = meta[act]?.frames ?? 1;
                asset.dirs = meta[act]?.dirs ?? {};
                const nDir = asset.nDir;
                asset.sheets = new Array(nDir).fill(null);
                let loaded = 0;
                for (let d = 0; d < nDir; d++) {
                    const img = new Image();
                    img.onload = () => { loaded++; if (loaded === nDir) asset.ready = true; };
                    img.onerror = () => { loaded++; if (loaded === nDir) asset.ready = true; };
                    img.src = `${base}/${act}_${d}.png`;
                    asset.sheets[d] = img;
                }
            })
            .catch((e) => console.warn(`[Animal] 加载 ${key} 失败:`, e));
    }

    private assetFor(key: string): AnimalAsset | undefined {
        const a = this.assets.get(key);
        if (a) a.lastUsed = performance.now();   // LRU 时间戳
        return a && a.ready ? a : undefined;
    }

    /** 一种动物已解码占多少字节（w×h×4，逐张方向图累加） */
    private assetBytes(a: AnimalAsset): number {
        let b = 0;
        for (const im of a.sheets) {
            if (im) b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
        }
        return b;
    }

    private totalAssetBytes(): number {
        let b = 0;
        for (const a of this.assets.values()) b += this.assetBytes(a);
        return b;
    }

    /**
     * 🔴 [2026-08-31] 按**字节预算**淘汰最久未用的动物素材。
     *    实测 65 种动物全部解码后 **635MB**（大象一种就 68MB、犀牛 22MB），
     *    而原实现 `assets` Map **无上限、从不淘汰** —— 玩家在世界各地平移，
     *    各区域的动物会逐步全量驻留，叠上战术模式单场约 1.3GB 的素材工作集，
     *    直奔浏览器 4096MB 天花板（scene13 就是这么撞上去的，见记忆 scene13-lag-is-heap-ceiling）。
     *    120MB 够同时装十几种（中位单种 9MB），跨大洲平移才会淘汰，重新加载也只是一次 HTTP。
     */
    private evictAssets(): void {
        let bytes = this.totalAssetBytes();
        if (bytes <= AnimalAmbientLayer.ASSET_BUDGET_BYTES) return;
        const inUse = new Set<string>();
        for (const e of this.entries) {
            inUse.add(`${e.dir}:idle`);
            if (e.action !== 'idle') inUse.add(`${e.dir}:${e.action}`);
        }
        for (const b of this.birds) {
            inUse.add(`${b.dir}:fly`);
            inUse.add(`${b.dir}:hover`);
        }
        const cands = [...this.assets.entries()]
            .filter(([k]) => !inUse.has(k))               // 当前屏上在用的不淘汰
            .sort((a, b) => (a[1].lastUsed ?? 0) - (b[1].lastUsed ?? 0));
        for (const [k, a] of cands) {
            if (bytes <= AnimalAmbientLayer.ASSET_BUDGET_BYTES) break;
            bytes -= this.assetBytes(a);
            this.assets.delete(k);
        }
    }

    private static readonly ASSET_BUDGET_BYTES = 120 * 1024 * 1024;

    /** PerfDoctor 体检口子（private 在类外读不到） */
    public debugAssetCount(): number { return this.assets.size; }
    public debugAssetBytes(): number { return this.totalAssetBytes(); }

    // ── 陆地动物更新与撒点（含渐显与渐隐） ────────────────────────────────
    private updateLandEntries(dt: number): void {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        const colMin = Math.floor((sw.lng - CULL_MARGIN_DEG) / CELL_DEG);
        const colMax = Math.floor((ne.lng + CULL_MARGIN_DEG) / CELL_DEG);
        const rowMin = Math.floor((sw.lat - CULL_MARGIN_DEG) / CELL_DEG);
        const rowMax = Math.floor((ne.lat + CULL_MARGIN_DEG) / CELL_DEG);

        const activeIds = new Set<string>();

        if (this.landVisible) {
            for (let col = colMin; col <= colMax; col++) {
                for (let row = rowMin; row <= rowMax; row++) {
                    const id = `${col},${row}`;
                    const lh = hash01(col, row, 1);
                    if (lh < LAND_DENSITY) {
                        const clat = (row + 0.5) * CELL_DEG;
                        const clng = (col + 0.5) * CELL_DEG;
                        const offLat = (hash01(col, row, 3) - 0.5) * CELL_DEG * 0.8;
                        const offLng = (hash01(col, row, 4) - 0.5) * CELL_DEG * 0.8;
                        const pos = { lat: clat + offLat, lng: clng + offLng };
                        // 🔴 [2026-10-31 主人令「能不能只在所在屏幕显示」] 取消「只在道路/海路/据点 30km 内」的可达掩膜，按视口显示
                        // 🔴 2026-10-31 主人令「动物不要出现在据点附近」：据点 0.30° 圈内不生成
                        if (!this.isSea(pos) && !this.isNearCity(pos)) {
                            activeIds.add(id);
                            // 若尚未在 entries 中，则新生成一只并从 alpha = 0 开始渐显
                            let entry = this.entries.find((e) => e.id === id);
                            if (!entry) {
                                const { land } = realmAt(clat, clng);
                                const dir = land[Math.floor(hash01(col, row, 5) * land.length) % land.length];
                                const facing = Math.floor(hash01(col, row, 6) * 8) % 8;
                                const phase = Math.floor(hash01(col, row, 7) * 1000);
                                this.loadAsset(dir, 'idle', false);
                                // 起始相位错开：不让整屏动物同时起步（决策计时器 0~3 秒随机）
                                const seed = hash01(col, row, 9);
                                this.entries.push({
                                    id, dir, pos, facing, phase, alpha: 0, fadingOut: false,
                                    home: { lat: pos.lat, lng: pos.lng },
                                    action: 'idle',
                                    timer: seed * 3,
                                    target: null,
                                    fleeTimer: 0,
                                    fleeDX: 0,
                                    fleeDY: 0,
                                    seaTimer: 0,
                                });
                            }
                        }
                    }
                }
            }
        }

        const FADE_DUR = 1.0; // 渐显/渐隐时长（秒）
        // 🔴 2026-10-31 主人令「军团或者玩家过来的时候也要逃跑」：每帧取一次威胁点（军团 + 跟随的玩家军团），
        //    30 只以内动物共用这一份，不必逐只查军团。
        const threats = this.collectThreats();
        const season = this.getSeason();
        for (let i = this.entries.length - 1; i >= 0; i--) {
            const e = this.entries[i];
            if (activeIds.has(e.id)) {
                // 🔴 2026-10-31「动物不要出现在据点附近」：万一被挤进据点圈（新增据点/旧位置），立刻渐隐退场
                if (this.isNearCity(e.pos)) {
                    e.fadingOut = true;
                    e.alpha = Math.max(0, e.alpha - dt / FADE_DUR);
                    if (e.alpha <= 0) this.entries.splice(i, 1);
                    continue;
                }
                // 处于可见区：渐显 + 走动/逃跑行为
                e.fadingOut = false;
                e.alpha = Math.min(1, e.alpha + dt / FADE_DUR);
                // 🔴 2026-10-31「雪地动物要冬眠」：冬季（season 3）且纬度高时，熊类原地蛰伏
                e.hibernating = isHibernating(e.dir, e.pos.lat, season);
                stepLandEntry(e, dt, threats, {
                    isSea: (p) => this.isSea(p),
                    rand: Math.random,
                    hibernating: e.hibernating,
                    nearCity: (p) => this.isNearCity(p),
                });
                if (e.action !== 'idle') this.loadAsset(e.dir, e.action, false);   // walk/run 懒加载（素材无 run 时自动回落 walk）
            } else {
                // 移出可见区或关闭：渐隐
                e.fadingOut = true;
                e.alpha = Math.max(0, e.alpha - dt / FADE_DUR);
                if (e.alpha <= 0) {
                    this.entries.splice(i, 1);
                }
            }
        }
    }

    /** 危机来源：所有军团（玩家跟随的那支也在其中）。0.3 秒缓存一次，平移地图时不重复取。 */
    private threatCache: LandThreat[] = [];
    private threatCacheAt = 0;
    private collectThreats(): LandThreat[] {
        const now = performance.now();
        if (now - this.threatCacheAt < 300) return this.threatCache;
        this.threatCacheAt = now;
        const out: LandThreat[] = [];
        const game = (window as any).game;
        const armies = game?.legionManager?.getArmies?.() ?? [];
        for (const a of armies) {
            if (!a || a.isDestroyed) continue;
            const p = a.getPosition?.();
            if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) out.push({ lat: p.lat, lng: p.lng });
        }
        this.threatCache = out;
        return out;
    }

    private isSea(pos: Pt): boolean {
        try {
            return LandSeaSystem.isSeaAt(pos);
        } catch {
            return false;
        }
    }

    /** 季节（0 春 / 1 夏 / 2 秋 / 3 冬），与据点民生层同一源 */
    private getSeason(): number {
        const s = (window as any).game?.timeSystem?.getSeason?.();
        return typeof s === 'number' && s >= 0 && s <= 3 ? s : 0;
    }

    // ── 据点圈避让（2026-10-31 主人令「动物不要出现在据点附近」）────────────────
    private cityBuckets: Map<string, Pt[]> | null = null;

    /** LLC 网格索引：把 1175 个据点按 0.5° 分桶，查一只动物是否落在据点 0.30° 圈内只算 9 个桶 */
    private ensureCityIndex(): Map<string, Pt[]> {
        if (this.cityBuckets) return this.cityBuckets;
        const buckets = new Map<string, Pt[]>();
        for (const c of CITIES_V2) {
            if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) continue;
            const key = `${Math.floor(c.lat / CITY_INDEX_CELL_DEG)},${Math.floor(c.lng / CITY_INDEX_CELL_DEG)}`;
            const arr = buckets.get(key);
            if (arr) arr.push({ lat: c.lat, lng: c.lng });
            else buckets.set(key, [{ lat: c.lat, lng: c.lng }]);
        }
        this.cityBuckets = buckets;
        return buckets;
    }

    /** 该点是否在任一据点 0.30° 圈内（城池图标 + 近郊那一圈不出野生动物） */
    private isNearCity(p: Pt): boolean {
        const buckets = this.ensureCityIndex();
        const row = Math.floor(p.lat / CITY_INDEX_CELL_DEG);
        const col = Math.floor(p.lng / CITY_INDEX_CELL_DEG);
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const arr = buckets.get(`${row + dr},${col + dc}`);
                if (!arr) continue;
                for (const c of arr) {
                    if (Math.hypot(c.lat - p.lat, c.lng - p.lng) < CITY_CLEAR_DEG) return true;
                }
            }
        }
        return false;
    }

    // ── DE 飞鸟系统（与战术模式 Scene13 及 DE 原作完全一致） ────────────────
    /** AoE2 DE 16 方向索引转换（逆时针/顺时针与资产帧完全对齐） */
    private birdDir(dx: number, dy: number): number {
        let a = (Math.atan2(-dy, dx) * 180) / Math.PI;
        a = ((a % 360) + 360) % 360;
        return (18 - Math.floor(((a + 11.25) % 360) / 22.5)) % 16;
    }

    /** 在视口内生成一只 DE 巡航飞鸟（跨屏直线长途巡游） */
    private spawnBirdInBounds(sw: L.LatLng, ne: L.LatLng): void {
        // 在视口内随机生成起始点，严格以此处真实经纬度确定地理生态区
        // 🔴 [2026-10-31 主人令「只在所在屏幕显示」] 视口内任意处起飞（取消道路可达掩膜）
        const lat = sw.lat + Math.random() * (ne.lat - sw.lat);
        const lng = sw.lng + Math.random() * (ne.lng - sw.lng);
        const { birds } = realmAt(lat, lng);
        const dir = birds[Math.floor(Math.random() * birds.length)];
        this.loadAsset(dir, 'fly', true);
        this.loadAsset(dir, 'hover', true);

        const angle = Math.random() * Math.PI * 2;
        const distFly = 1.5 + Math.random() * 2.5; // 目标跨越 1.5~4.0 度（大范围长途巡航）

        this.birds.push({
            dir,
            lat,
            lng,
            targetLat: lat + Math.sin(angle) * distFly,
            targetLng: lng + Math.cos(angle) * distFly,
            hovering: Math.random() < 0.5,
            timer: 3.0 + Math.random() * 4.0, // 3~7 秒交替
            phase: Math.random() * 1000,
            alpha: 0.0,       // 初始透明度 0（渐显）
            fadingOut: false,
        });
    }

    /** 飞鸟长途巡航更新：长距直线巡游 + fly 振翅 ⇄ hover 滑翔交替 + 渐显/渐隐 */
    private updateBirds(dt: number): void {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        const FADE_DUR = 1.2; // 渐显/渐隐时长（秒）

        // 维持视口内 2~3 只活跃飞鸟（渐隐中的飞鸟不计入配额，确保渐显平滑补位）
        const MAX_BIRDS = 3;
        if (this.birdsVisible) {
            const activeCount = this.birds.filter((b) => !b.fadingOut).length;
            if (activeCount < MAX_BIRDS) {
                this.spawnBirdInBounds(sw, ne);
            }
        }

        const speedDeg = 0.09; // 战略巡航速度（度/秒，约 70~100 屏幕像素/秒）
        for (let i = this.birds.length - 1; i >= 0; i--) {
            const b = this.birds[i];
            b.timer -= dt;
            // 🔴 [DE 原生机制] fly 振翅巡航 ⇄ hover 展翅滑翔交替（每 3~7 秒切换一次）
            if (b.timer <= 0) {
                b.hovering = !b.hovering;
                b.timer = 3.0 + Math.random() * 4.0;
            }

            // 飞鸟渐隐判定：不可见状态、或飞临视口边缘缓冲带时触发渐隐
            const margin = 0.3;
            const nearEdge = b.lat < sw.lat - margin || b.lat > ne.lat + margin || b.lng < sw.lng - margin || b.lng > ne.lng + margin;
            if (!this.birdsVisible || nearEdge) {
                b.fadingOut = true;
            }

            // 透明度更新（渐显 / 渐隐）
            if (b.fadingOut) {
                b.alpha = Math.max(0, b.alpha - dt / FADE_DUR);
                if (b.alpha <= 0) {
                    this.birds.splice(i, 1);
                    continue;
                }
            } else {
                b.alpha = Math.min(1, b.alpha + dt / FADE_DUR);
            }

            const dLat = b.targetLat - b.lat;
            const dLng = b.targetLng - b.lng;
            const dist = Math.hypot(dLat, dLng);

            if (dist < 0.05) {
                // 到达当前目标点，选一个新远方目标继续巡航
                const angle = Math.random() * Math.PI * 2;
                const distFly = 1.5 + Math.random() * 2.5;
                b.targetLat = b.lat + Math.sin(angle) * distFly;
                b.targetLng = b.lng + Math.cos(angle) * distFly;
            } else {
                b.lat += (dLat / dist) * speedDeg * dt;
                b.lng += (dLng / dist) * speedDeg * dt;
            }
        }
    }

    // ── 每帧 ────────────────────────────────────────────────────────────
    private tick(now: number): void {
        if (!this.running) return;
        const dt = Math.min(0.1, this.lastTime > 0 ? (now - this.lastTime) / 1000 : 0.016);
        this.lastTime = now;
        this.nowMs = now;
        if (this.isHiddenNow()) {
            if (!this.clearedWhileHidden) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.birdCtx.clearRect(0, 0, this.birdCanvas.width, this.birdCanvas.height);
                this.clearedWhileHidden = true;
            }
            requestAnimationFrame(this.tick.bind(this));
            return;
        }
        this.clearedWhileHidden = false;
        const _t0 = performance.now();
        this.updateLandEntries(dt);
        this.updateBirds(dt);
        this.evictAssets();
        this.draw();
        perfDoctor.note('AnimalAmbientLayer.tick(动物层)', performance.now() - _t0, 'src/map/AnimalAmbientLayer.ts:tick');
        requestAnimationFrame(this.tick.bind(this));
    }

    private clearedWhileHidden = false;

    /**
     * 本帧要不要整层跳过（不重算、不重画，只清一次屏）。
     * 🔴 [2026-09-01 主人定] 动物只在 **zoom 9 / 10** 两层出现：
     *    8 是全局俯瞰（动物变成满屏小点），11+ 已是战场尺度，都不该有野生动物。
     *    在这里拦掉而不是只藏画布 —— 顺带省掉 recomputeEntries + draw 的每帧开销。
     */
    private isHiddenNow(): boolean {
        if (this.isObscured()) return true;
        const z = Math.round(this.map.getZoom());
        return z < ANIMAL_MIN_ZOOM || z > ANIMAL_MAX_ZOOM;
    }

    /** 战略地图此刻是否被战术演出盖住（或视口尺寸为 0） */
    private isObscured(): boolean {
        if ((window as any).game?.scene13War?.isActive?.() === true) return true;
        const s = this.map.getSize();
        return s.x === 0 || s.y === 0;
    }

    private draw(): void {
        this.syncCanvas();
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const birdCtx = this.birdCtx;
        birdCtx.clearRect(0, 0, this.birdCanvas.width, this.birdCanvas.height);

        const zoom = this.map.getZoom();
        const scale = strategicSpriteScale(zoom);
        const m = 40; // 屏幕裁剪余量

        // 1. 绘制陆地动物（吃草／走动／逃跑三态，位置随行为实时变化，渐显/渐隐）
        for (const e of this.entries) {
            if (e.alpha <= 0) continue;
            // 走动/逃跑时用对应动作贴图；素材没有 run 的（家畜、火鸡）自动回落 walk
            const asset = this.assetFor(`${e.dir}:${e.action}`) ?? this.assetFor(`${e.dir}:idle`);
            if (!asset) continue;
            const pt = this.map.latLngToContainerPoint([e.pos.lat, e.pos.lng]);
            if (pt.x < -m || pt.x > this.canvas.width + m || pt.y < -m || pt.y > this.canvas.height + m) continue;
            const box = asset.dirs[String(e.facing)];
            if (!box) continue;
            const sheet = asset.sheets[e.facing];
            if (!sheet || !sheet.complete || !sheet.naturalWidth) continue;

            // 冬眠中把动作帧率压到 3 帧/秒，看起来只是伏着缓慢喘气，不是站在那儿机械踏步
            const fps = e.hibernating ? 3 : 14;
            const frame = Math.floor((this.nowMs / 1000) * fps + e.phase) % asset.frames;
            const fw = box.fw, fh = box.fh, hx = box.hx, hy = box.hy;
            const dx = pt.x - hx * scale;
            const dy = pt.y - hy * scale;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, e.alpha));
            ctx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
            ctx.restore();
        }

        // 2. 绘制 DE 巡航飞鸟（跨屏直线长途巡游 + fly 振翅 ⇄ hover 滑翔交替 + 渐显/渐隐，高空 birdCtx 绘制在建筑上层）
        for (const b of this.birds) {
            if (b.alpha <= 0) continue;
            const act = b.hovering ? 'hover' : 'fly';
            const asset = this.assetFor(`${b.dir}:${act}`);
            if (!asset) continue;

            const pt = this.map.latLngToContainerPoint([b.lat, b.lng]);
            if (pt.x < -m || pt.x > this.birdCanvas.width + m || pt.y < -m || pt.y > this.birdCanvas.height + m) continue;

            const targetPt = this.map.latLngToContainerPoint([b.targetLat, b.targetLng]);
            const curDx = targetPt.x - pt.x;
            const curDy = targetPt.y - pt.y;
            const facing = this.birdDir(curDx, curDy);

            const box = asset.dirs[String(facing)];
            if (!box) continue;
            const sheet = asset.sheets[facing];
            if (!sheet || !sheet.complete || !sheet.naturalWidth) continue;

            const frame = Math.floor((this.nowMs / 1000) * 14 + b.phase) % asset.frames;
            const fw = box.fw, fh = box.fh, hx = box.hx, hy = box.hy;
            const dx = pt.x - hx * scale;
            const dy = pt.y - hy * scale;
            birdCtx.save();
            birdCtx.globalAlpha = Math.max(0, Math.min(1, b.alpha));
            birdCtx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
            birdCtx.restore();
        }
    }
}

let singleton: AnimalAmbientLayer | null = null;
let visible = true;
let landVisible = true;   // 🔴 2026-10-31 主人令「不要搞得永远都看不到」：陆地野生动物默认开启（原默认关，开局一只都看不到）
let birdsVisible = true;

export function initializeAnimalAmbientLayer(gameMap: GameMap): AnimalAmbientLayer {
    if (singleton) return singleton;
    singleton = new AnimalAmbientLayer(gameMap.getLeafletMap());
    // [2026-08-31] 按 PerfDoctor 铁律登记：任何图片缓存都必须能报**字节数**。
    //   实测 65 种动物全部解码 635MB，是必须盯住的一块。
    if (import.meta.env.DEV) {
        perfDoctor.registerCache({
            name: 'AnimalAmbientLayer:assets(动物素材)',
            where: 'src/map/AnimalAmbientLayer.ts:ASSET_BUDGET_BYTES',
            entries: () => singleton!.debugAssetCount(),
            bytes: () => singleton!.debugAssetBytes(),
            limitKind: 'bytes',
            limitValue: 120 * 1024 * 1024,
        });
    }
    singleton.setVisible(visible);
    singleton.setLandVisible(landVisible);
    singleton.setBirdsVisible(birdsVisible);
    return singleton;
}

export function getAnimalAmbientLayer(): AnimalAmbientLayer | null {
    return singleton;
}

export function setAnimalAmbientLayerVisible(nextVisible: boolean): void {
    visible = nextVisible;
    singleton?.setVisible(visible);
}

export function setLandAnimalVisible(nextVisible: boolean): void {
    landVisible = nextVisible;
    singleton?.setLandVisible(landVisible);
}

export function setFlyingAnimalVisible(nextVisible: boolean): void {
    birdsVisible = nextVisible;
    singleton?.setBirdsVisible(birdsVisible);
}
