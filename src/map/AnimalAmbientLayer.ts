import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import type { GameMap } from './GameMap';
import { LandSeaSystem } from '../world/land-sea';
import { CITIES_V2 } from '../data/cities_v2';
import { strategicActorScale } from './strategicSpriteScale';
import { FAUNA_AREA_RATIO, WILD_LAND_PER_SQ_DEG, animalHerdSize, animalNeedsCoast, animalNeedsRiver, wildPoolAt } from '../world/environment/animalCatalog';
import { ENV_ZONE_FAUNA_DENSITY, envZoneAt } from '../world/environment/envZones';
import { collectHumanPresence } from './strategicPresence';
import { isNearStrategicRiver, nearestStrategicRiver } from './StrategicRiverProximity';

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
    id: string;          // 网格标识：`${col},${row},${物种}`，成群时再加 `,${群内序号}`
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
    /** 🔴 2026-10-31「大象进海了」：原地不动时也要复查脚下（走/跑才判海的话，搁浅那只永远不会挪） */
    recheck: number;
    /** 复查发现整只泡在海里、附近又找不到干地 → 渐隐退场 */
    doomed?: boolean;
    herd?: string;       // 所属群（成群物种同群共用；同群不互相惊散，拴在群中心 home 附近）
}

/** 陆地动物的移动常量（zoom 9 下 0.00275°≈1px：走 ≈18px/s，逃 ≈60px/s） */
const LAND_WALK_SPEED_DEG = 0.07;   // 度/秒（🔴 2026-10-31「野生尽量多动」：0.05→0.07）
const LAND_FLEE_SPEED_DEG = 0.165;  // 度/秒
/**
 * 🔴 2026-10-31 优化：素材只有 idle 的物种（盘羊 ARGALI 缺 walk）不参与随机走动，避免"滑步"；
 *   缺 run 的物种逃跑时用 walk 帧、速度降到 1.6 倍（否则 3.3 倍速的快走会明显打滑）。
 */
const NO_WALK_SPECIES: ReadonlySet<string> = new Set(['ARGALI']);
const NO_RUN_SPECIES: ReadonlySet<string> = new Set([
    'ALPACA', 'BUFFALO', 'CAMEL', 'CAPYBARA', 'CHICKEN', 'COW_BLACK', 'COW_BROWN', 'COW_BW', 'DONKEY',
    'DROMEDARY', 'GOAT', 'GOOSE', 'HORSE', 'KOMODO', 'LLAMA', 'MONKEY', 'PEACOCK', 'PENGUIN', 'PIG',
    'SEAL', 'SHEEP', 'SNAKE_GROUND', 'SNAKE_WATER', 'TURKEY', 'WALRUS', 'CAIMAN', 'CROCODILE',
    // run 素材过大（象 37MB、水怪 82MB 解码）也按无 run 处理，控内存
    'ELEPHANT', 'NESSIE',
]);
// 🔴 [2026-11-02 主人令「战略地图上，军团来了以后，动物会逃走，不是碰到后逃走，是看到就逃走」]
//    原 LAND_FLEE_RADIUS_DEG = 0.18°（zoom 9 下仅 ≈65px）只从军团中心点算，而 10 队军团的前排与主将队
//    本身就伸出中心前方 ≈100~125px（0.28°~0.34°），导致前锋士兵已经踩到动物身上才触发逃跑。
//    现改为「看到即逃」：拉大军团/玩家的视野受惊半径，并在 collectThreats 中同时把军团前锋探点与行军纵队纳入威胁源。
const LAND_FLEE_RADIUS_DEG = 0.65;  // 默认受惊视野半径（zoom 9 下 ≈240px，看到军团过来就逃走，不等碰到）
const LEGION_SIGHT_RADIUS_DEG = 0.72; // 军团大队人马旌旗醒目，动物老远（距前锋外缘 ≈180~220px）看到即逃
const LEGION_VANGUARD_OFFSET_DEG = 0.24; // 军团前锋（主将队+前排）在中心前方的偏移量
const PLAYER_SIGHT_RADIUS_DEG = 0.52; // 独行玩家单骑受惊视野半径（≈190px）
const LAND_STEP_MIN_DEG = 0.07;     // 一次随机走动的最短距离 ≈25px（🔴 多动：0.055→0.07）
const LAND_STEP_MAX_DEG = 0.24;     // 最长 ≈90px（原 0.19）
const LAND_LEASH_DEG = 0.46;        // 离出生格超过 ≈170px 就往回走（步长变大，圈同步放宽）
/** 成群物种（总表 herd）：群内间距 ≈15px、单步 7–26px、离群中心 ≈45px 就往回走 */
const HERD_SPREAD_DEG = 0.13;       // 🔴 2026-10-31 主人令「分散些」：0.08→0.13，一群摊开而不是挤成一坨
const HERD_STEP_MIN_DEG = 0.02;
const HERD_STEP_MAX_DEG = 0.09;
const HERD_LEASH_DEG = 0.22;        // 群圈同步放宽，免得摊开后一走动就被拽回中心
const LAND_SEA_CHECK_SEC = 0.25;

/**
 * 🔴 [2026-10-31 主人截图「大象进海了，请优化」] 判海要把**身体**算进去，不能只判脚下的落点。
 *
 *   精灵的锚点在脚下，但身子有半个屏那么宽（象 116×80px，zoom 9 缩放 0.7 后 ≈ 0.22° 宽）；
 *   只判一个点时，只要锚点的下一个像素是陆地，象身就能横跨岸线、半个身子泡在海里 —— 截图上那只就是这样。
 *   这里给每个物种一个「体型半径（度）」：中心 + 四向都要是干地才算站得住。
 *
 *   数值口径：按 zoom 9（基准缩放 0.7）的贴图宽度折算，取半个身宽，略收一点免得把海岸线动物全赶走。
 *   判据只用于**野生动物**；军团/据点/海陆形态一律仍走 LandSeaSystem（不许在这里改全局口径）。
 */
const BODY_HALF_DEG: Readonly<Record<string, number>> = {
    NESSIE: 0.12,
    ELEPHANT: 0.09,
    RHINO: 0.08,
    BUFFALO: 0.055, CROCODILE: 0.055, ELK: 0.05, WALRUS: 0.05, CAMEL: 0.05, DROMEDARY: 0.05,
    BEAR: 0.045, BEAR_POLAR: 0.045, BEAR_BLACK: 0.045, HORSE: 0.045, TIGER: 0.045, LION: 0.045,
};
const BODY_HALF_DEG_DEFAULT = 0.025;

/**
 * 🔴 2026-10-31 ~ 2026-11-01 主人令「据点周围不要放陆地动物」：
 *   每个据点代表周围 50 公里（≈0.45°~0.48°，涵盖城池图标 + 外围农田/牧场/民生圈），
 *   0.48° 以内一律不生成野生陆地动物（且不得把落入圈内的动物推到圈边聚拢）；
 *   走动/逃跑也不许踏进这个圈 —— 中途踏进去立刻停步回头（与「不下水」同一套处理）。
 */
const CITY_CLEAR_DEG = 0.48;
const CITY_INDEX_CELL_DEG = 0.6;

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
    flock: number;       // 所属鸟群编号（独飞的一群 1 只）
}

// ── 可调参数 ──────────────────────────────────────────────────────────────
const CELL_DEG = 0.5;               // 撒点网格尺寸（度）
const LAND_DENSITY = 0.09;          // 陆地格出现动物的概率（🔴 2026-10-31 主人令「陆地动物有点多。分散些」：配合下面的哈希修正，线上实测一屏从 12~17 只降到 4~8 只；再稀就 0.06）
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
/** 鸟群队形间距（≈15px） */
const BIRD_FLOCK_SPACING_DEG = 0.04;
/** 飞鸟从屏幕边外多远起飞、飞到对面边外多远为目标、飞出边外多远才渐隐移除（度） */
const BIRD_ENTRY_OUTSIDE_DEG = 0.1;
const BIRD_EXIT_BEYOND_DEG = 0.6;
const BIRD_LEAVE_MARGIN_DEG = 0.45;
const BIRD_DRIFT_SPEED = 0.4;       // 飞鸟盘旋角速度（rad/s，约 15.7s 一圈）
// ──────────────────────────────────────────────────────────────────────────

// ── 生态分区 ──────────────────────────────────────────────────────────────
// 🔴 2026-10-31 主人令「按专业的游戏设计管理」：物种出现地统一查 src/world/environment/animalCatalog.ts，
//    本层不再自写生物区和物种池（原 18 区经纬度框已删）。战术战查同一张表，两边天然一致。
/** 海岸物种（北极熊、海象、海豹、企鹅）落点四向 0.2° 内要有海 */
const COAST_PROBE_DEG = 0.2;
/** 淡水河岸物种（鳄鱼、凯门鳄、水蛇、水豚）：在格内 35km 找矢量河流并吸附到距河心约 4.5km 的干岸上，活动范围不离河 12km、且不去海边 */
const RIVER_SEARCH_KM = 35;
const RIVER_BANK_OFFSET_KM = 4.5;
const RIVER_KEEP_KM = 12;

/** 危险源（军团 / 玩家）*/
export interface LandThreat { lat: number; lng: number; /** 受惊半径（度），不写 = LAND_FLEE_RADIUS_DEG */ r?: number }

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
    /** 🔴 2026-10-31「动物不要出现在据点附近」：落在据点 0.30° 圈内视同障碍 */
    nearCity?: (p: Pt) => boolean;
    /** 该物种素材是否有 walk（无 walk 的如盘羊：只原地张望，不做位移，避免滑步） */
    canWalk?: boolean;
    /** 该物种素材是否有 run（无 run：逃跑改用 walk 帧、速度 1.6 倍） */
    canRun?: boolean;
    /** 🔴 2026-10-31「动物碰到动物也要分头逃跑」：同屏其它动物的实时位置 */
    neighbors?: readonly LandNeighbor[];
}

/** 同屏其它动物（用于"碰到动物分头逃跑"） */
export interface LandNeighbor { id: string; lat: number; lng: number; herd?: string }

/** 两只动物靠得比这更近（0.06°≈22px）就互相受惊、分头跑开 */
const LAND_SCATTER_RADIUS_DEG = 0.06;

/**
 * 陆地动物一步行为（2026-10-31 主人令「要不定期，随机朝不同的方向跑动；军团或者玩家过来的时候也要逃跑」）：
 *   ① 没有威胁时：吃草几十秒 → 随机挑一个方向走 20~70px → 再吃草，周而复始（不定时、不定向）；
 *   ② 军团/玩家进入 ≈65px（0.18°）：立刻锁定「远离威胁」的方向奔跑 1.6~3.2 秒，速度是走动的 3 倍；
 *   ③ 一律不下水：选点先判海，跑动中每 0.25 秒复查一次，踩到海面就停步回头；
 *   ④ 离出生格超过 ≈150px（0.42°）就往回走，绝不整场跑丢。
 * 纯函数、无 DOM 依赖，便于离线核查。
 */
/** 逃跑遇水或据点禁区时的绕行偏转角（弧度：±25°、±50°、±75°、±105°、±135°、±160°） */
const FLEE_STEER_ANGLES = [
    0.436, -0.436, 0.873, -0.873, 1.309, -1.309,
    1.833, -1.833, 2.356, -2.356, 2.793, -2.793,
] as const;

export function stepLandEntry(e: AnimalEntry, dt: number, threats: readonly LandThreat[], opts: LandStepOptions): void {
    const { isSea, rand } = opts;
    const canWalk = opts.canWalk !== false;
    // 有 run 素材：3.3 倍速真跑；只有 walk：1.6 倍速快走；连 walk 都没有（盘羊）：1.2 倍速缓慢挪开
    const fleeSpeed = opts.canRun === false
        ? (canWalk ? LAND_WALK_SPEED_DEG * 1.6 : LAND_WALK_SPEED_DEG * 1.2)
        : LAND_FLEE_SPEED_DEG;
    // 水面与据点圈一律当作走不进去的障碍
    const blocked = (p: Pt): boolean => isSea(p) || (opts.nearCity ? opts.nearCity(p) : false);

    // 给定理想逃跑单位向量 (dx, dy)，若前方受阻则向两侧偏转寻找干地逃跑方向
    const pickClearFleeDir = (dx: number, dy: number, probeDist: number): { dx: number; dy: number } | null => {
        const directPt = { lat: e.pos.lat + dy * probeDist, lng: e.pos.lng + dx * probeDist };
        if (!blocked(directPt)) return { dx, dy };
        const preferSign = (Math.floor(e.phase) % 2 === 0) ? 1 : -1;
        for (const baseAng of FLEE_STEER_ANGLES) {
            const ang = baseAng * preferSign;
            const ca = Math.cos(ang), sa = Math.sin(ang);
            const rdx = dx * ca - dy * sa;
            const rdy = dx * sa + dy * ca;
            const cand = { lat: e.pos.lat + rdy * probeDist, lng: e.pos.lng + rdx * probeDist };
            if (!blocked(cand)) return { dx: rdx, dy: rdy };
        }
        return null;
    };

    // ① 找最近的威胁（看到即逃：自身或所属兽群中心进入视野半径即受惊）
    let threat: LandThreat | null = null;
    let threatDist = Infinity;
    for (const t of threats) {
        const r = t.r ?? LAND_FLEE_RADIUS_DEG;
        const dSelf = Math.hypot(t.lat - e.pos.lat, t.lng - e.pos.lng);
        const dHerd = e.herd ? Math.hypot(t.lat - e.home.lat, t.lng - e.home.lng) : Infinity;
        const d = Math.min(dSelf, dHerd);
        if (d < r && dSelf < threatDist) { threatDist = dSelf; threat = t; }
    }
    if (threat) {
        let dx = e.pos.lng - threat.lng;
        let dy = e.pos.lat - threat.lat;
        const len = Math.hypot(dx, dy);
        if (len < 1e-6) {
            const a = rand() * Math.PI * 2;
            dx = Math.cos(a); dy = Math.sin(a);
        } else {
            dx /= len; dy /= len;
        }
        const probe = Math.max(0.05, fleeSpeed * Math.max(dt, 0.05) * 2);
        // 若已在绕岸/绕城逃跑且直逃方向被挡，而当前逃跑方向畅通，则保持当前绕行方向继续跑，不在岸边原地卡死
        const curClear = e.fleeTimer > 0 && (e.fleeDX !== 0 || e.fleeDY !== 0)
            && !blocked({ lat: e.pos.lat + e.fleeDY * probe, lng: e.pos.lng + e.fleeDX * probe })
            && (e.fleeDX * dx + e.fleeDY * dy > -0.35);
        if (!curClear) {
            const steered = pickClearFleeDir(dx, dy, probe);
            if (steered) {
                e.fleeDX = steered.dx;
                e.fleeDY = steered.dy;
            } else {
                e.fleeDX = dx;
                e.fleeDY = dy;
            }
        }
        e.fleeTimer = Math.max(e.fleeTimer, 1.8 + rand() * 1.4);
        e.target = null;
    }

    // ①-b 动物碰到动物：互相受惊、分头跑开（军团/玩家优先，已在上一步锁方向的这里不再改）
    if (opts.neighbors && e.fleeTimer <= 0) {
        let nb: LandNeighbor | null = null;
        let nbDist = Infinity;
        for (const n of opts.neighbors) {
            if (n.id === e.id) continue;
            if (e.herd && n.herd === e.herd) continue;   // 同群不互相惊散
            const d = Math.hypot(n.lat - e.pos.lat, n.lng - e.pos.lng);
            if (d < nbDist) { nbDist = d; nb = n; }
        }
        if (nb && nbDist < LAND_SCATTER_RADIUS_DEG) {
            let dx = e.pos.lng - nb.lng;
            let dy = e.pos.lat - nb.lat;
            const len = Math.hypot(dx, dy);
            if (len < 1e-6) {
                const a = rand() * Math.PI * 2;
                dx = Math.cos(a); dy = Math.sin(a);
            } else {
                dx /= len; dy /= len;
            }
            // 分头：先朝远离对方的方向，再按自身相位左/右偏一个角 —— 两只对撞时各自拐向两侧，不会顺着同一条线跑
            const side = (Math.floor(e.phase) % 2 === 0 ? 1 : -1) * (0.6 + rand() * 0.45);
            const ca = Math.cos(side), sa = Math.sin(side);
            e.fleeDX = dx * ca - dy * sa;
            e.fleeDY = dx * sa + dy * ca;
            e.fleeTimer = 0.9 + rand() * 1.1;
            e.target = null;
        }
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
            // 🔴 2026-10-31「野生尽量多动」：决策间隔 1.6–4.8s → 0.6–2.0s，起走概率 0.78 → 0.92
            e.timer = 0.6 + rand() * 1.4;
            if (canWalk && rand() < 0.92) {
                const ang = rand() * Math.PI * 2;
                // 成群个体步子小、拴在群中心附近（DE 鹿群「松散成群、绝不走散」）；独行的照旧大范围走
                const stepMin = e.herd ? HERD_STEP_MIN_DEG : LAND_STEP_MIN_DEG;
                const stepMax = e.herd ? HERD_STEP_MAX_DEG : LAND_STEP_MAX_DEG;
                const leash = e.herd ? HERD_LEASH_DEG : LAND_LEASH_DEG;
                const step = stepMin + rand() * (stepMax - stepMin);
                let tx = e.pos.lng + Math.cos(ang) * step;
                let ty = e.pos.lat + Math.sin(ang) * step;
                if (Math.hypot(tx - e.home.lng, ty - e.home.lat) > leash) {
                    const back = e.herd ? HERD_SPREAD_DEG : 0.1;
                    tx = e.home.lng + (rand() - 0.5) * back;
                    ty = e.home.lat + (rand() - 0.5) * back;
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
        speed = fleeSpeed;
    } else if (e.action === 'walk' && e.target) {
        const dx = e.target.lng - e.pos.lng;
        const dy = e.target.lat - e.pos.lat;
        const len = Math.hypot(dx, dy);
        speed = LAND_WALK_SPEED_DEG;
        if (len <= speed * dt) {
            e.pos = { lat: e.target.lat, lng: e.target.lng };
            e.target = null;
            e.action = 'idle';
            e.timer = 0.4 + rand() * 1.0;   // 走到目标后只歇 0.4–1.4 秒又走（原来 1.2–3.7 秒）
            speed = 0;
        } else {
            vx = dx / len;
            vy = dy / len;
        }
    }

    if (speed > 0) {
        const stepDist = speed * dt;
        const next = { lat: e.pos.lat + vy * stepDist, lng: e.pos.lng + vx * stepDist };
        e.seaTimer -= dt;
        const check = e.action === 'run' || e.seaTimer <= 0;
        if (e.seaTimer <= 0) e.seaTimer = LAND_SEA_CHECK_SEC;
        // 据点圈每帧都判（走 O(9) 个桶，代价极低），逃跑中也实时判海并在岸边自动偏转绕跑
        const intoCity = opts.nearCity ? opts.nearCity(next) : false;
        if (!intoCity && (!check || !isSea(next))) {
            e.pos = next;
            e.facing = landDir8(vy, vx);
            // 逃跑离开原位后同步更新落脚点 home，避免逃完又回头往军团怀里走
            if (e.action === 'run') {
                e.home = { lat: next.lat, lng: next.lng };
            }
        } else if (e.action === 'run') {
            // 逃跑途中碰到岸线或据点禁区：尝试偏转方向沿岸/沿圈外继续跑，不停在原地发呆
            const steered = pickClearFleeDir(vx, vy, Math.max(stepDist, 0.04));
            if (steered) {
                e.fleeDX = steered.dx;
                e.fleeDY = steered.dy;
                const altNext = { lat: e.pos.lat + steered.dy * stepDist, lng: e.pos.lng + steered.dx * stepDist };
                if (!blocked(altNext)) {
                    e.pos = altNext;
                    e.facing = landDir8(steered.dy, steered.dx);
                    e.home = { lat: altNext.lat, lng: altNext.lng };
                }
            } else {
                e.target = null;
                e.fleeTimer = 0;
                e.action = 'idle';
                e.timer = 0.6 + rand() * 1.0;
            }
        } else {
            // 闲逛踩到水面、或走进据点圈：停步、清目标、回头
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
            e.timer = 0.5 + rand() * 1.2;   // 逃完马上接着活动
        }
    }
}

/**
 * 确定性整数哈希 → [0,1)。同 (col,row,salt) 恒同值，保证动物位置不跳。
 *
 * 🔴 2026-10-31 主人令「陆地动物有点多。分散些」——查到**分布本身是偏的**：
 *   旧写法 `h = (h ^ (h >> 13)) * 1274126177` 的结果会超过 2^53（双精度整数上限），
 *   乘法丢精度后低位全歪，实测把 6% 的撒点概率放大成 **11.8%**，而且列与列之间命中率在
 *   5%~17.5% 之间起伏 —— 于是有的地方挤一堆、有的地方一只没有。
 *   改成全程 32 位整数（Math.imul + murmur3 收尾），命中率回到理论值（6%→6.1%，列间波动就是纯抽样误差）。
 */
function hash01(col: number, row: number, salt: number): number {
    let h = 2166136261 >>> 0;
    h = Math.imul(h ^ (col | 0), 16777619) >>> 0;
    h = Math.imul(h ^ (row | 0), 16777619) >>> 0;
    h = Math.imul(h ^ (salt | 0), 16777619) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
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
    private flockSeq = 0;
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
        // 🔴 2026-10-31「大象进海了」：海陆瓦片/掩膜到位时 LandSeaSystem 会清缓存重算，
        //    场上每一只立刻复查一遍脚下，别让「按未知地放行」的那只永远站在水里。
        window.addEventListener('land-sea-tiles-updated', this.onLandSeaTilesUpdated);
    }

    /** 海陆数据订正 → 全场上动物下一帧复查脚下 */
    private readonly onLandSeaTilesUpdated = (): void => {
        for (const e of this.entries) e.recheck = 0;
    };

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
        // 🔴 [2026-11-06 修「玩家移动卡顿」] 这道预算守卫原来**每帧**跑一遍 totalAssetBytes()：
        //    83 种素材 × 各自方向图逐张读 naturalWidth/naturalHeight —— 每秒 60 次全表扫描，
        //    而淘汰只在「跨大洲平移、素材累计超预算」时才真的发生。改成 1Hz 检查，行为不变。
        const now = performance.now();
        if (now - this.lastEvictAt < AnimalAmbientLayer.EVICT_INTERVAL_MS) return;
        this.lastEvictAt = now;
        let bytes = this.totalAssetBytes();
        if (bytes <= AnimalAmbientLayer.ASSET_BUDGET_BYTES) return;
        const inUse = new Set<string>();
        for (const e of this.entries) {
            inUse.add(`${e.dir}:idle`);
            if (!NO_WALK_SPECIES.has(e.dir)) inUse.add(`${e.dir}:walk`);
            if (!NO_RUN_SPECIES.has(e.dir)) inUse.add(`${e.dir}:run`);
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

    /**
     * 🔴 2026-10-31 优化：动物多了「走/跑」两套动作（一屏 12 只最坏要同时驻留 idle+walk+run ≈150MB 解码），
     *   原 120MB 会边用边淘汰、导致走两步又重下的抖动；提到 256MB。
     *   仍有上限：跨洲平移会淘汰久未用的物种，重下只是一次 HTTP。
     */
    private static readonly ASSET_BUDGET_BYTES = 256 * 1024 * 1024;
    /** 预算检查间隔（ms）：淘汰是「跨区域才发生」的粗粒度动作，1Hz 完全够（见 evictAssets） */
    private static readonly EVICT_INTERVAL_MS = 1000;
    private lastEvictAt = 0;
    /** 撒点扫描节流：结果只随「视口格范围 / 季节 / 年」变化，最快 SPAWN_SCAN_MS 重扫一次 */
    private static readonly SPAWN_SCAN_MS = 200;
    private spawnScanKey = '';
    private spawnScanAt = 0;
    /** 上一次扫描得出的「本屏应有哪些动物」（id 集合）；两次扫描之间沿用 */
    private activeIds = new Set<string>();

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

        // 🔴 [2026-11-06 修「玩家在战略地图上移动有点卡顿」] 撒点扫描按「视口格范围 + 季节 + 年」缓存，
        //   最快 SPAWN_SCAN_MS 一次。这段原来**每帧**把整屏格子扫一遍（每格 envZoneAt + wildPoolAt +
        //   多次 isNearCity + 河/海岸吸附 + 逐只查重），实测动物层 2.7ms/帧（主人实机 perf_doctor，占一帧预算六分之一）
        //   绝大部分在这里，而它的结果只随「镜头挪到新格子 / 换季 / 跨年」变化。
        //   动物自己的走动、逃跑、渐显渐隐仍在下面逐帧推进，观感不变。
        const scanKey = `${colMin},${colMax},${rowMin},${rowMax}|${this.getSeason()}|${this.getYear()}`;
        const now = performance.now();
        const needScan = scanKey !== this.spawnScanKey || now - this.spawnScanAt >= AnimalAmbientLayer.SPAWN_SCAN_MS;
        if (needScan) {
            this.spawnScanKey = scanKey;
            this.spawnScanAt = now;
            this.activeIds = this.collectActiveIds(colMin, colMax, rowMin, rowMax);
        }
        const activeIds = this.activeIds;

        const FADE_DUR = 1.0; // 渐显/渐隐时长（秒）
        // 🔴 2026-10-31 主人令「军团或者玩家过来的时候也要逃跑」：每帧取一次威胁点（军团 + 跟随的玩家军团），
        //    30 只以内动物共用这一份，不必逐只查军团。
        const threats = this.collectThreats();
        const season = this.getSeason();
        // 🔴 2026-10-31「动物碰到动物也要分头逃跑」：本帧同屏动物的位置快照，供逐只判定碰头
        const neighbors: LandNeighbor[] = this.entries.map((e) => ({ id: e.id, lat: e.pos.lat, lng: e.pos.lng, herd: e.herd }));
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
                // 🔴 2026-10-31「大象进海了，请优化」：不动也要判海。
                //   原来只在 speed>0 时才判 —— 出生时海陆瓦片还没到（按陆放行）、或逃跑一步踏进浅滩的那只，
                //   一旦停下就再也不会判海，于是整场站在水里不动（截图那只就是这样）。
                e.recheck -= dt;
                if (e.recheck <= 0) {
                    e.recheck = LAND_SEA_CHECK_SEC;
                    if (this.isWetBody(e.pos, e.dir)) this.rescueFromWater(e);
                }
                if (e.doomed) {
                    // 整只泡在水里、附近又没有干地 → 原地渐隐退场（不再走/跑，也不再恢复透明度）
                    e.alpha = Math.max(0, e.alpha - dt / FADE_DUR);
                    if (e.alpha <= 0) this.entries.splice(i, 1);
                    continue;
                }
                e.alpha = Math.min(1, e.alpha + dt / FADE_DUR);
                const riverBound = animalNeedsRiver(e.dir);
                const coastBound = animalNeedsCoast(e.dir);
                stepLandEntry(e, dt, threats, {
                    // 判海一律按体型（身体任何一段沾水都算不能去），走动目标与逃跑同一条口径；海岸物种不远离海岸，淡水河岸物种不离河、不去海边
                    isSea: (p) => this.isWetBody(p, e.dir)
                        || (coastBound && !this.isNearCoast(p))
                        || (riverBound && (this.isNearCoast(p) || !isNearStrategicRiver(p.lat, p.lng, RIVER_KEEP_KM))),
                    rand: Math.random,
                    nearCity: (p) => this.isNearCity(p),
                    canWalk: !NO_WALK_SPECIES.has(e.dir),
                    canRun: !NO_RUN_SPECIES.has(e.dir),
                    neighbors,
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

        // 同群警报联动：群内只要有一只看到军团开始奔逃，同群其余个体立即同步朝同一方向逃离，并对齐群中心 home
        const herdFlee = new Map<string, { dx: number; dy: number; timer: number; sumLat: number; sumLng: number; count: number }>();
        for (const e of this.entries) {
            if (!e.herd || e.fadingOut || e.doomed) continue;
            const info = herdFlee.get(e.herd);
            if (!info) {
                herdFlee.set(e.herd, {
                    dx: e.fleeTimer > 0 ? e.fleeDX : 0,
                    dy: e.fleeTimer > 0 ? e.fleeDY : 0,
                    timer: e.fleeTimer,
                    sumLat: e.pos.lat,
                    sumLng: e.pos.lng,
                    count: 1,
                });
            } else {
                info.sumLat += e.pos.lat;
                info.sumLng += e.pos.lng;
                info.count++;
                if (e.fleeTimer > info.timer) {
                    info.timer = e.fleeTimer;
                    info.dx = e.fleeDX;
                    info.dy = e.fleeDY;
                }
            }
        }
        for (const e of this.entries) {
            if (!e.herd || e.fadingOut || e.doomed) continue;
            const info = herdFlee.get(e.herd);
            if (!info) continue;
            if (info.timer > 0 && e.fleeTimer <= 0 && (info.dx !== 0 || info.dy !== 0)) {
                e.fleeDX = info.dx;
                e.fleeDY = info.dy;
                e.fleeTimer = info.timer;
                e.target = null;
                e.action = 'run';
                e.facing = landDir8(info.dy, info.dx);
            }
            if (info.count > 1) {
                e.home = { lat: info.sumLat / info.count, lng: info.sumLng / info.count };
            }
        }
    }

    /**
     * 扫视口内所有格子，决定「本屏该有哪些动物」（按格子哈希确定性生成，顺带懒加载素材）。
     * 🔴 [2026-11-06 修「玩家移动卡顿」] 由 updateLandEntries 按需调用 —— 视口格范围 / 季节 / 年 变了，
     *    或距上次已 ≥ SPAWN_SCAN_MS。原来这段**每帧**跑，动物层 2.7ms/帧 绝大部分在这里。
     */
    private collectActiveIds(colMin: number, colMax: number, rowMin: number, rowMax: number): Set<string> {
        const ids = new Set<string>();
        const existingIds = new Set<string>();
        for (const e of this.entries) existingIds.add(e.id);
        if (this.landVisible) {
            for (let col = colMin; col <= colMax; col++) {
                for (let row = rowMin; row <= rowMax; row++) {
                    const lh = hash01(col, row, 1);
                    const clat = (row + 0.5) * CELL_DEG;
                    const clng = (col + 0.5) * CELL_DEG;
                    // 🔴 2026-10-31 主人令「注意每个区域动物的数量」：出群概率乘环境区多寡系数（荒漠少、草原林地多）
                    if (lh < LAND_DENSITY * ENV_ZONE_FAUNA_DENSITY[envZoneAt(clat, clng)]) {
                        // 冬毛物种（白狼、雪兔）只在冬季进池：物种编进 id，换季时旧的渐隐、新的渐显
                        const { land } = wildPoolAt(clat, clng, this.getSeason() === 3);
                        if (land.length === 0) continue;
                        let dir = land[Math.floor(hash01(col, row, 5) * land.length) % land.length];
                        // 🔴 2026-10-31 主人令「冬眠动物到期不显示，来年随机换个位置渐显，一年一次」：
                        //   熊类的落点按「年」取哈希 —— 每年春天都在**新位置**从透明渐显；冬季则整只渐隐退场。
                        let yearSalt = HIBERNATORS.has(dir) ? this.getYear() * 131 : 0;
                        const offLat = (hash01(col, row, 3 + yearSalt) - 0.5) * CELL_DEG * 0.8;
                        const offLng = (hash01(col, row, 4 + yearSalt) - 0.5) * CELL_DEG * 0.8;
                        const rawAnchor: Pt = { lat: clat + offLat, lng: clng + offLng };
                        // 🔴 [2026-10-31 主人令「能不能只在所在屏幕显示」] 取消「只在道路/海路/据点 30km 内」的可达掩膜，按视口显示
                        // 🔴 2026-11-01 主人令「据点周围不要放陆地动物」：出生点落在据点周围禁区内直接跳过，严禁挪到据点边缘聚拢
                        if (this.isNearCity(rawAnchor, dir)) continue;
                        // 🔴 冬眠物种在冬季连"活跃"都不算：不进 activeIds，场上那只就会自动渐隐消失
                        if (isHibernating(dir, rawAnchor.lat, this.getSeason())) continue;
                        let needsRiver = animalNeedsRiver(dir);
                        let needsCoast = animalNeedsCoast(dir);
                        let anchor: Pt | null = rawAnchor;
                        const snapSeed = hash01(col, row, 13);
                        if (needsRiver) {
                            anchor = this.snapToRiverBank(rawAnchor, dir, snapSeed);
                        } else if (needsCoast) {
                            anchor = this.snapToCoast(rawAnchor, dir, snapSeed);
                        }
                        if (!anchor && (needsRiver || needsCoast)) {
                            // 内陆无河／无海岸的格子抽到河岸或海岸物种时：若海陆瓦片已就绪且该格并非纯外海，改抽本区陆生物种，避免北极内陆苔原等平白少一半动物
                            if (needsCoast && this.hasUnloadedTileNear(rawAnchor)) continue;
                            const inland = land.filter((sp) => !animalNeedsCoast(sp) && !animalNeedsRiver(sp));
                            if (inland.length === 0) continue;
                            const fb = inland[Math.floor(hash01(col, row, 15) * inland.length) % inland.length];
                            if (isHibernating(fb, rawAnchor.lat, this.getSeason())) continue;
                            dir = fb;
                            if (this.isNearCity(rawAnchor, dir)) continue;
                            yearSalt = HIBERNATORS.has(dir) ? this.getYear() * 131 : 0;
                            needsRiver = false;
                            needsCoast = false;
                            anchor = rawAnchor;
                        }
                        if (!needsRiver && !needsCoast && anchor) {
                            if (this.isNearCity(anchor, dir)) continue;
                            if (this.isWetBody(anchor, dir)) {
                                anchor = this.snapToDryLand(anchor, dir, snapSeed);
                            }
                        }
                        if (!anchor || this.isNearCity(anchor, dir)) continue;
                        // 🔴 2026-10-31 主人令「群体成群出现，学习 DE」：一格抽中一种后按总表 herd 生成一整群，
                        //    群员围着同一个群中心（home）错开站位；独行物种 herd 缺省 = 1 只，与原来一样。
                        const herdSize = animalHerdSize(dir, hash01(col, row, 11));
                        const herdKey = `${col},${row},${dir}`;
                        const cosAnchor = Math.max(0.2, Math.cos((anchor.lat * Math.PI) / 180));
                        for (let k = 0; k < herdSize; k++) {
                            // 群员绕群中心错开：第 0 只站中心，其余按金角螺旋排开（间距约 HERD_SPREAD_DEG 的一半）
                            const ang = k * 2.39996 + hash01(col, row, 12) * Math.PI * 2;
                            const spread = (needsRiver || needsCoast) ? HERD_SPREAD_DEG * 0.45 : HERD_SPREAD_DEG;
                            const rad = k === 0 ? 0 : spread * (0.35 + 0.25 * Math.sqrt(k));
                            let pos: Pt | null = {
                                lat: anchor.lat + Math.sin(ang) * rad * 0.7,
                                lng: anchor.lng + (Math.cos(ang) * rad) / cosAnchor,
                            };
                            if (k > 0 && needsCoast && (this.isWetBody(pos, dir) || !this.isNearCoast(pos) || this.isNearCity(pos, dir))) {
                                pos = this.snapToCoast(pos, dir, hash01(col, row, 13 + k));
                            }
                            if (!pos) continue;
                            // 🔴 2026-10-31「大象进海了」：按体型判海（中心 + 四向），象身不许跨在岸线上
                            // 🔴 淡水河岸物种（鳄鱼/凯门鳄/水蛇/水豚）：只放矢量河流岸边，不去海边
                            if (
                                this.isWetBody(pos, dir)
                                || this.isNearCity(pos, dir)
                                || (needsCoast && !this.isNearCoast(pos))
                                || (needsRiver && (this.isNearCoast(pos) || !isNearStrategicRiver(pos.lat, pos.lng, RIVER_KEEP_KM)))
                            ) continue;
                            const id = herdSize > 1 ? `${herdKey},${k}` : herdKey;
                            ids.add(id);
                            // 若尚未在 entries 中，则新生成一只并从 alpha = 0 开始渐显
                            if (existingIds.has(id)) continue;
                            const salt = yearSalt + k * 17;
                            const facing = Math.floor(hash01(col, row, 6 + salt) * 8) % 8;
                            const phase = Math.floor(hash01(col, row, 7 + salt) * 1000);
                            this.loadAsset(dir, 'idle', false);
                            if (!NO_WALK_SPECIES.has(dir)) this.loadAsset(dir, 'walk', false);
                            if (!NO_RUN_SPECIES.has(dir)) this.loadAsset(dir, 'run', false);
                            // 起始相位错开：不让整屏动物同时起步（决策计时器 0~3 秒随机）
                            const seed = hash01(col, row, 9 + k * 17);
                            existingIds.add(id);
                            this.entries.push({
                                id, dir, pos, facing, phase, alpha: 0, fadingOut: false,
                                home: herdSize > 1 ? { lat: anchor.lat, lng: anchor.lng } : { lat: pos.lat, lng: pos.lng },
                                action: 'idle',
                                timer: seed * 3,
                                target: null,
                                fleeTimer: 0,
                                fleeDX: 0,
                                fleeDY: 0,
                                seaTimer: 0,
                                recheck: 0,
                                herd: herdSize > 1 ? herdKey : undefined,
                            });
                        }
                    }
                }
            }
        }
        return ids;
    }

    /** 危机来源：所有军团（含前锋与队尾探点）及玩家、商队、村民。60ms 缓存一次，行军靠近时零延迟触发受惊。 */
    private threatCache: LandThreat[] = [];
    private threatCacheAt = 0;
    private collectThreats(): LandThreat[] {
        const now = performance.now();
        if (now - this.threatCacheAt < 60) return this.threatCache;
        this.threatCacheAt = now;
        const out: LandThreat[] = [];
        const game = (window as any).game;
        const armies = game?.legionManager?.getArmies?.() ?? [];
        for (const a of armies) {
            if (!a || a.isDestroyed || a.visible === false) continue;
            const p = a.getPosition?.();
            if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
            out.push({ lat: p.lat, lng: p.lng, r: LEGION_SIGHT_RADIUS_DEG });
            // 军团 10 队方阵/纵队的前锋（主将队+前排）与队尾各自伸出中心约 0.24°，一并作为视野威胁源，确保前锋还没靠近动物就已被看见
            const dirRad = typeof a.lastDirection === 'number' && Number.isFinite(a.lastDirection) ? a.lastDirection : 0;
            const fLat = Math.cos(dirRad) * LEGION_VANGUARD_OFFSET_DEG;
            const fLng = Math.sin(dirRad) * LEGION_VANGUARD_OFFSET_DEG;
            out.push({ lat: p.lat + fLat, lng: p.lng + fLng, r: LEGION_SIGHT_RADIUS_DEG });
            out.push({ lat: p.lat - fLat, lng: p.lng - fLng, r: LEGION_SIGHT_RADIUS_DEG * 0.85 });
        }
        // 🔴 2026-10-31 主人令「动物碰到人和军团经过的时候要逃跑」：
        //    玩家脱离大军单独行动时不在军团列表里，单独加；村民、商队从人类活动登记取（半径各自带）
        const hero = game?.playerHero?.getPosition?.();
        if (hero && Number.isFinite(hero.lat) && Number.isFinite(hero.lng)) {
            out.push({ lat: hero.lat, lng: hero.lng, r: PLAYER_SIGHT_RADIUS_DEG });
        }
        for (const p of collectHumanPresence()) out.push(p);
        this.threatCache = out;
        return out;
    }

    /**
     * 是不是动物不能去的地方（海，或掩膜与海拔瓦片都还没到的未知地）。
     * 🔴 2026-10-31 主人截图「北极海面上站着白狼、北极狐、雪兔，没看到北极熊」：
     *    LandSeaSystem 在海拔瓦片未到时按「陆」返回（为了不卡军团行军），野生动物一进画面就按格生成，
     *    瓦片还在路上时海面被当成陆地 → 陆兽生在海上；取瓦片失败要冷却 60 秒，这期间一直站在海上。
     *    这里只改野生动物：
     *      · 水域掩膜明确是水（water === true）→ 是水，不能去；
     *      · 水域掩膜明确是陆（water === false）→ 是干地，立即放行（不必再等 S3 高程瓦片）；
     *      · 掩膜尚未到（water === null）→ 回退查高程瓦片，都未到时暂作未知水体拦住，到齐后按真实海陆生成。
     */
    private isSea(pos: Pt): boolean {
        try {
            const water = LandSeaSystem.getWaterSampler().isWaterSync(pos.lat, pos.lng);
            if (water === true) return true;
            if (water === false) return false;
            if (LandSeaSystem.isSeaAt(pos)) return true;
            return LandSeaSystem.getSampler().getElevationSync(pos.lat, pos.lng) === null;
        } catch {
            return false;
        }
    }

    /**
     * 🔴 [2026-10-31 主人截图「大象进海了，请优化」] 按**体型**判海：中心 + 四向 bodyHalfDeg 都要是干地。
     *   精灵锚点在脚下、身子却有约 0.22°（象）宽，只判落点时象身会横跨岸线泡在海里。
     */
    private isWetBody(pos: Pt, dir: string): boolean {
        if (this.isSea(pos)) return true;
        const r = BODY_HALF_DEG[dir] ?? BODY_HALF_DEG_DEFAULT;
        if (r <= 0) return false;
        const cosLat = Math.cos((pos.lat * Math.PI) / 180) || 1;
        const dLat = r;
        const dLng = r / cosLat;   // 经度按纬度缩放，四个方向的实际距离一致
        return this.isSea({ lat: pos.lat + dLat, lng: pos.lng })
            || this.isSea({ lat: pos.lat - dLat, lng: pos.lng })
            || this.isSea({ lat: pos.lat, lng: pos.lng + dLng })
            || this.isSea({ lat: pos.lat, lng: pos.lng - dLng });
    }

    /**
     * 搁浅补救：脚下的海陆数据后来才到位（瓦片迟到、掩膜订正 → LandSeaSystem 清缓存重算），
     * 或逃跑时一步踩进浅滩 —— 就地就近找一块干地挪过去；附近没有干地（礁石、小岛）就渐隐退场。
     * 只挪野生动物，不改它的出生格以外的任何状态（动作、群、朝向全部重置成吃草）。
     */
    private rescueFromWater(e: AnimalEntry): void {
        const cosLat = Math.cos((e.pos.lat * Math.PI) / 180) || 1;
        for (const ring of [0.05, 0.1, 0.18, 0.3, 0.45, 0.65]) {
            for (let k = 0; k < 8; k++) {
                const a = (k / 8) * Math.PI * 2 + (e.phase % 360) * (Math.PI / 180);
                const p = {
                    lat: e.pos.lat + Math.sin(a) * ring,
                    lng: e.pos.lng + (Math.cos(a) * ring) / cosLat,
                };
                if (this.isWetBody(p, e.dir) || this.isNearCity(p)) continue;
                e.pos = p;
                e.home = { lat: p.lat, lng: p.lng };
                e.target = null;
                e.fleeTimer = 0;
                e.action = 'idle';
                e.timer = 0.6 + Math.random() * 1.4;
                return;
            }
        }
        e.doomed = true;   // 整座岛都泡在水里：让它在原地渐隐退场，下一帧不再重生（出生点同一套判海会拒掉）
    }

    /**
     * 陆地点八向 COAST_PROBE_DEG 内有海（海岸物种用，经度按 1/cos(lat) 缩放，避免高纬海岸被漏判）。
     * 同时兼容高纬峡湾／浅海（掩膜是水且近岸海拔 ≤ 8m），并排除内陆高海拔湖河。
     */
    private isNearCoast(pos: Pt): boolean {
        const dLat = COAST_PROBE_DEG;
        const cosLat = Math.max(0.2, Math.cos((pos.lat * Math.PI) / 180));
        const dLng = dLat / cosLat;
        const diagLat = dLat * 0.7071;
        const diagLng = dLng * 0.7071;
        const sea = (p: Pt): boolean => {
            try {
                if (LandSeaSystem.isSeaAt(p)) return true;
                if (LandSeaSystem.getWaterSampler().isWaterSync(p.lat, p.lng) === true) {
                    const elev = LandSeaSystem.getSampler().getElevationSync(p.lat, p.lng)
                        ?? LandSeaSystem.getSampler().getElevationSync(pos.lat, pos.lng);
                    if (elev !== null && elev <= 8) return true;
                }
                return false;
            } catch {
                return false;
            }
        };
        return sea({ lat: pos.lat + dLat, lng: pos.lng })
            || sea({ lat: pos.lat - dLat, lng: pos.lng })
            || sea({ lat: pos.lat, lng: pos.lng + dLng })
            || sea({ lat: pos.lat, lng: pos.lng - dLng })
            || sea({ lat: pos.lat + diagLat, lng: pos.lng + diagLng })
            || sea({ lat: pos.lat + diagLat, lng: pos.lng - diagLng })
            || sea({ lat: pos.lat - diagLat, lng: pos.lng + diagLng })
            || sea({ lat: pos.lat - diagLat, lng: pos.lng - diagLng });
    }

    /** 附近海陆瓦片是否仍在加载中（避免海岸格在瓦片未到齐时提前回退成内陆物种） */
    private hasUnloadedTileNear(pos: Pt): boolean {
        const ws = LandSeaSystem.getWaterSampler();
        const es = LandSeaSystem.getSampler();
        return ws.isWaterSync(pos.lat, pos.lng) === null && es.getElevationSync(pos.lat, pos.lng) === null;
    }

    /**
     * 将海岸物种（北极熊、海象、海豹、企鹅）吸附到格内及邻近海岸的干岸线上：
     *   · 原落点已在干海岸上 → 直接采用；
     *   · 原落点偏入近海或偏入内陆 → 沿同心环搜索最近的干海岸线（避免北极格抽中北极熊/海象后因差半格全部作废）。
     */
    private snapToCoast(anchor: Pt, dir: string, seed: number): Pt | null {
        if (!this.isWetBody(anchor, dir) && this.isNearCoast(anchor) && !this.isNearCity(anchor, dir)) {
            return anchor;
        }
        const cosLat = Math.max(0.2, Math.cos((anchor.lat * Math.PI) / 180));
        const baseAng = seed * Math.PI * 2;
        for (const ring of [0.06, 0.12, 0.2, 0.3, 0.42, 0.56, 0.72]) {
            for (let k = 0; k < 12; k++) {
                const a = baseAng + (k / 12) * Math.PI * 2;
                const cand = {
                    lat: anchor.lat + Math.sin(a) * ring,
                    lng: anchor.lng + (Math.cos(a) * ring) / cosLat,
                };
                if (!this.isWetBody(cand, dir) && this.isNearCoast(cand) && !this.isNearCity(cand, dir)) {
                    return cand;
                }
            }
        }
        return null;
    }

    /**
     * 内陆物种若格内随机点恰好踩在湖泊、峡湾，在本格邻域内就近挪到干地（外海格附近无干地或触碰据点圈仍返回 null）。
     */
    private snapToDryLand(anchor: Pt, dir: string, seed: number): Pt | null {
        const cosLat = Math.max(0.2, Math.cos((anchor.lat * Math.PI) / 180));
        const baseAng = seed * Math.PI * 2;
        for (const ring of [0.06, 0.12, 0.2, 0.28]) {
            for (let k = 0; k < 8; k++) {
                const a = baseAng + (k / 8) * Math.PI * 2;
                const cand = {
                    lat: anchor.lat + Math.sin(a) * ring,
                    lng: anchor.lng + (Math.cos(a) * ring) / cosLat,
                };
                if (!this.isWetBody(cand, dir) && !this.isNearCity(cand, dir)) {
                    return cand;
                }
            }
        }
        return null;
    }

    /**
     * 将淡水河岸物种（鳄鱼、凯门鳄、水蛇、水豚）吸附到格内最近的矢量河流干岸边：
     *   · 35km 内无矢量河流 → 返回 null（不生成在无河荒漠或内陆干山）；
     *   · 沿河道法向偏移约 4.5km 落岸，且避开海边、水面与据点圈。
     */
    private snapToRiverBank(anchor: Pt, dir: string, sidePick: number): Pt | null {
        const riv = nearestStrategicRiver(anchor.lat, anchor.lng, RIVER_SEARCH_KM);
        if (!riv) return null;
        const cosLat = Math.max(0.01, Math.cos((anchor.lat * Math.PI) / 180));
        const rLat = anchor.lat + (riv.distKm * riv.sideN) / 111.32;
        const rLng = anchor.lng + (riv.distKm * riv.sideE) / (111.32 * cosLat);
        const nE = -riv.dirN;
        const nN = riv.dirE;
        const signs = sidePick < 0.5 ? [1, -1] : [-1, 1];
        for (const s of signs) {
            const cand = {
                lat: rLat + (s * RIVER_BANK_OFFSET_KM * nN) / 111.32,
                lng: rLng + (s * RIVER_BANK_OFFSET_KM * nE) / (111.32 * cosLat),
            };
            if (!this.isWetBody(cand, dir) && !this.isNearCity(cand, dir) && !this.isNearCoast(cand)) {
                return cand;
            }
        }
        return null;
    }

    /** 季节（0 春 / 1 夏 / 2 秋 / 3 冬），与据点民生层同一源 */
    private getSeason(): number {
        const s = (window as any).game?.timeSystem?.getSeason?.();
        return typeof s === 'number' && s >= 0 && s <= 3 ? s : 0;
    }

    /** 年号（冬眠动物"来年换个位置"按它取随机种子） */
    private getYear(): number {
        const y = (window as any).game?.timeSystem?.getYear?.();
        return typeof y === 'number' && Number.isFinite(y) ? y : 0;
    }

    // ── 据点圈避让（2026-10-31 ~ 2026-11-01 主人令「据点周围不要放陆地动物」）────────────────
    private cityBuckets: Map<string, Pt[]> | null = null;

    /** 网格索引：把 1175 个据点按 0.6° 分桶，查一只动物是否落在据点 0.48° 圈内只算 9 个桶 */
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

    /** 该点是否在任一据点 0.48°（+ 动物体型半径）圈内（城池图标 + 周围 50km 城郊与民生圈不出野生动物） */
    private isNearCity(p: Pt, dir?: string): boolean {
        const buckets = this.ensureCityIndex();
        const row = Math.floor(p.lat / CITY_INDEX_CELL_DEG);
        const col = Math.floor(p.lng / CITY_INDEX_CELL_DEG);
        const clearR = CITY_CLEAR_DEG + (dir ? (BODY_HALF_DEG[dir] ?? BODY_HALF_DEG_DEFAULT) : 0);
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const arr = buckets.get(`${row + dr},${col + dc}`);
                if (!arr) continue;
                for (const c of arr) {
                    if (Math.hypot(c.lat - p.lat, c.lng - p.lng) < clearR) return true;
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

    /** 生成一只（一群）DE 巡航飞鸟：从屏幕外飞入、横穿屏幕、从对面飞出 */
    private spawnBirdInBounds(sw: L.LatLng, ne: L.LatLng): void {
        // 🔴 2026-10-31 主人令「所有素材都要从屏幕外进入屏幕内，再出屏幕，在屏幕期间不要无缘无故消失」：
        //    原来在视口内随机一点凭空渐显。现在在四条边中随机一条外侧 BIRD_ENTRY_OUTSIDE_DEG 处起飞，
        //    目标定在对面那条边外 BIRD_EXIT_BEYOND_DEG 处，必然横穿屏幕；鸟种按起飞点所在区取。
        const h = ne.lat - sw.lat, w = ne.lng - sw.lng;
        const edge = Math.floor(Math.random() * 4);   // 0 南 1 北 2 西 3 东
        const u = Math.random(), v = Math.random();
        const out = BIRD_ENTRY_OUTSIDE_DEG, far = BIRD_EXIT_BEYOND_DEG;
        const [lat, lng, tLat, tLng] =
            edge === 0 ? [sw.lat - out, sw.lng + u * w, ne.lat + far, sw.lng + v * w]
            : edge === 1 ? [ne.lat + out, sw.lng + u * w, sw.lat - far, sw.lng + v * w]
            : edge === 2 ? [sw.lat + u * h, sw.lng - out, sw.lat + v * h, ne.lng + far]
            : [sw.lat + u * h, ne.lng + out, sw.lat + v * h, sw.lng - far];
        const { birds } = wildPoolAt(lat, lng, this.getSeason() === 3);
        if (birds.length === 0) return;
        const dir = birds[Math.floor(Math.random() * birds.length)];
        this.loadAsset(dir, 'fly', true);
        this.loadAsset(dir, 'hover', true);

        const angle = Math.atan2(tLat - lat, tLng - lng);
        // 🔴 2026-10-31 主人令「群体成群出现」：鹤、火烈鸟等按总表 herd 成群飞，鹰隼秃鹫独飞（DE 原图实测）。
        //    群员按「人」字错开排在领头鸟身后，目标同向平移，振翅 / 滑翔同步切换，整群平行巡航。
        const size = animalHerdSize(dir, Math.random());
        const flock = ++this.flockSeq;
        const hovering = Math.random() < 0.5;
        const timer = 3.0 + Math.random() * 4.0; // 3~7 秒交替
        for (let k = 0; k < size; k++) {
            const row = Math.ceil(k / 2);
            const side = k % 2 === 1 ? 1 : -1;
            const back = row * BIRD_FLOCK_SPACING_DEG;
            const across = k === 0 ? 0 : side * row * BIRD_FLOCK_SPACING_DEG * 0.8;
            const dLat = -Math.sin(angle) * back + Math.cos(angle) * across;
            const dLng = -Math.cos(angle) * back - Math.sin(angle) * across;
            this.birds.push({
                dir,
                lat: lat + dLat,
                lng: lng + dLng,
                targetLat: tLat + dLat,
                targetLng: tLng + dLng,
                hovering,
                timer,
                phase: Math.random() * 1000,
                alpha: 0.0,       // 初始透明度 0（渐显）
                fadingOut: false,
                flock,
            });
        }
    }

    /** 飞鸟长途巡航更新：长距直线巡游 + fly 振翅 ⇄ hover 滑翔交替 + 渐显/渐隐 */
    private updateBirds(dt: number): void {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        const FADE_DUR = 1.2; // 渐显/渐隐时长（秒）

        // 维持视口内 2~3 只活跃飞鸟（渐隐中的飞鸟不计入配额，确保渐显平滑补位）
        // 🔴 2026-10-31 主人令「注意陆海空动物数量的比例」：同屏鸟群数 = 画面面积 × 陆地基准密度 × 空/陆比（DE 实测 0.18）
        //    × 画面中心所在区的多寡系数；按「群」计，独飞 1 只算一群，至少 1 群
        const viewArea = Math.abs(ne.lat - sw.lat) * Math.abs(ne.lng - sw.lng);
        const center = bounds.getCenter();
        const MAX_BIRDS = Math.max(1, Math.round(viewArea * WILD_LAND_PER_SQ_DEG * FAUNA_AREA_RATIO.air
            * ENV_ZONE_FAUNA_DENSITY[envZoneAt(center.lat, center.lng)]));
        if (this.birdsVisible) {
            const activeCount = new Set(this.birds.filter((b) => !b.fadingOut).map((b) => b.flock)).size;
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
                b.timer = 3.0 + ((b.flock * 7919) % 400) / 100;   // 按鸟群固定：同群同步切换振翅 / 滑翔
            }

            // 飞鸟渐隐判定：不可见状态、或已飞出视口外缓冲带时触发渐隐
            // （缓冲带要大于「起飞点在边外 + 整群队尾」的距离，否则队尾一出生就被判离开）
            const margin = BIRD_LEAVE_MARGIN_DEG;
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
                // 到达目标（已在屏幕外）仍沿原方向直飞，不在屏幕里转向打转；离开缓冲带后由上面渐隐移除
                const back = Math.hypot(b.targetLat - b.lat + 1e-9, b.targetLng - b.lng);
                b.targetLat = b.lat + (b.targetLat - b.lat) / back * 2;
                b.targetLng = b.lng + (b.targetLng - b.lng) / back * 2;
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
        const scale = strategicActorScale(zoom);
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

            const frame = Math.floor((this.nowMs / 1000) * 14 + e.phase) % asset.frames;
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
            limitValue: 256 * 1024 * 1024,
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
