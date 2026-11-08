/**
 * 战场形态（拒马 / 尸体 / 骨骸 / 火把 / 牲口骸骨 / 栅栏木堆 / 残破战旗）的**布局数学**。
 *
 * 🔴 本文件是从 `public/_citytest.html`（第 2015–2211 行）**逐行搬运**过来的，
 *    数学一字不改 —— 页面是主人 2026-09-12 亲自看定样式的评估页，
 *    游戏里必须画出**同一套**结果（`scratch/verify_bf_morphology_parity.mjs` 逐种子比对两者）。
 *    ⚠️ 因此 `hashString` 用的是**页面的 djb2**，不是 `src/ui/scene13/Random.ts` 的 FNV-1a ——
 *       换哈希会让同一个种子抽出不同的件、摆到不同的位置，页面与游戏就对不上了。
 *       **改这里必须同步改页面，反之亦然。**
 *
 * ── 定案（主人 2026-09-12） ────────────────────────────────────────────
 *   「战场现在有三个，挺好，三个位置随机下就行了，不要每个战场都一样。三个素材随机镜像」
 *   → **保底三件（拒马位 5 款随机 / 尸体 2 款 / 骨骸 3 款）＋ 随机补 1~2 件 ＝ 每场 4~5 件**
 *     （拒马位从「完好的拒马 + 4 款打烂的拒马残骸」里 5 款随机；
 *       补件池 = 火把 / 牲口骸骨 / 栅栏木堆 / 残破战旗，**不重种**抽 1~2 种）
 *
 * ── 摆位三铁律（全部实测踩过） ────────────────────────────────────────
 *   ① 每件**各自随机挪位（±jx/±jy 参考px）＋ 各自随机镜像**；镜像必须连锚点一起翻
 *      （`ax% → 100-ax%` ＋ `scaleX(-1)`），否则地面点会跑到另一侧；
 *   ② 种子 = 战场身份（**游戏里传战场 id**），走 `mulberry32(hashString(seed))`，
 *      **禁止 Math.random** → 同屏各战场各自独立、**刷新结果不变**；
 *   ③ 定尺用**抖动包络**（把 gx/gy 按 ±jx/±jy 推到四角取并集），**不能用某一次掷骰的实际包围盒**
 *      （否则每掷一次比例尺都变、战场忽大忽小）。
 *      包络 = **所有可能零件 × 5 个槽位**的并集（**常量**，与本场抽到哪些件无关）
 *      → 无论这场是 4 件还是 5 件、抽到大的还是小的，**所有战场同一个比例尺**。
 *
 * 锚点 `ax/ay` 不是手填的：由 `scratch/probe_part_anchors.py` 按像素实算 ——
 *   立着的（旗杆/火把/插桩尸体）取**杆脚** = 最底下 3 行不透明像素中点；
 *   趴平的（残骸/骸骨/破车/木堆）取内容包围盒中心；ay 一律 = 内容底边。
 */

import { BATTLEFIELDS } from '../data/Battlefields';
import { CITIES_V2 } from '../data/cities_v2';

/** 参考画布（所有槽位坐标与零件尺寸都以此为基准） */
export const BF_REF_W = 340;
export const BF_REF_H = 240;

export interface BfPart {
    key: string;
    label: string;
    path: string;
    /** 素材原始像素宽 */
    w: number;
    /** 素材原始像素高 */
    h: number;
    /** 锚点 x（素材像素） */
    ax: number;
    /** 锚点 y（素材像素） */
    ay: number;
    /** 素材相对缩放（默认 1.0；大图缩至与战场整体协调的尺寸） */
    scale?: number;
}

/** 中心主件全集（各文明断壁残垣 + 战车/攻城器械/辎重车残骸） */
export const BF_CENTERPIECES: BfPart[] = [
    { key: 'CHINESE_RUINS', label: '华夏飞檐残垣', path: '/SUCAI_BATTLEFIELD/CHINESE_RUINS/preview.png', w: 160, h: 152, ax: 78, ay: 151, scale: 0.90 },
    { key: 'ROMAN_RUINS', label: '古罗马石柱废墟', path: '/SUCAI_BATTLEFIELD/ROMAN_RUINS/preview.png', w: 200, h: 160, ax: 98, ay: 160, scale: 0.85 },
    { key: 'CASTLE_RUINS', label: '欧洲古堡残垣', path: '/SUCAI_BATTLEFIELD/CASTLE_RUINS/preview.png', w: 424, h: 492, ax: 209, ay: 482, scale: 0.34 },
    { key: 'MESOPOTAMIAN_RUINS', label: '两河泥砖废墟', path: '/SUCAI_BATTLEFIELD/MESOPOTAMIAN_RUINS/preview.png', w: 112, h: 104, ax: 52, ay: 90, scale: 1.15 },
    { key: 'MESOPOTAMIAN_TOMB', label: '两河古战陵冢', path: '/SUCAI_BATTLEFIELD/MESOPOTAMIAN_TOMB/preview.png', w: 116, h: 108, ax: 57, ay: 105, scale: 1.08 },
    { key: 'INDIAN_RUINS', label: '印度古塔残垣', path: '/SUCAI_BATTLEFIELD/INDIAN_RUINS/preview.png', w: 168, h: 164, ax: 70, ay: 163, scale: 0.90 },
    { key: 'ANDEAN_RUINS', label: '安第斯巨石废墟', path: '/SUCAI_BATTLEFIELD/ANDEAN_RUINS/preview.png', w: 152, h: 144, ax: 66, ay: 137, scale: 0.95 },
    { key: 'WAR_CHARIOT', label: '断辕战车与阵亡战马', path: '/SUCAI_BATTLEFIELD/DECAY_WAR_CHARIOT/preview.png', w: 244, h: 124, ax: 140, ay: 92, scale: 0.78 },
    { key: 'CART_BROKEN', label: '倾覆辎重大车', path: '/SUCAI_BATTLEFIELD/CART_BROKEN/preview.png', w: 128, h: 96, ax: 64, ay: 96, scale: 1.05 },
    { key: 'TREBUCHET', label: '倒塌巨型投石机', path: '/SUCAI_BATTLEFIELD/DECAY_TREBUCHET/preview.png', w: 288, h: 160, ax: 155, ay: 138, scale: 0.65 },
    { key: 'HUSSITE_WAGON', label: '战损装甲战车', path: '/SUCAI_BATTLEFIELD/DECAY_HUSSITE_WAGON/preview.png', w: 192, h: 104, ax: 87, ay: 92, scale: 0.90 },
    { key: 'SIEGE_BALLISTA', label: '倒毁大型床弩', path: '/SUCAI_BATTLEFIELD/DECAY_SIEGE_BALLISTA/preview.png', w: 168, h: 88, ax: 90, ay: 59, scale: 0.95 },
    { key: 'ONAGER', label: '倒毁重型投石车', path: '/SUCAI_BATTLEFIELD/DECAY_ONAGER/preview.png', w: 128, h: 76, ax: 59, ay: 66, scale: 1.05 },
];

const CENTERPIECE_BY_KEY = new Map<string, BfPart>(BF_CENTERPIECES.map((p) => [p.key, p]));

const EAST_ASIA_STYLES = new Set<string>([
    'CENTRAL', 'WEI', 'JIANGNAN', 'HUGUANG', 'BASHU', 'TIBET', 'NORTHEAST', 'KOREA', 'JAPAN', 'VIETNAMESE',
]);
const MED_STYLES = new Set<string>([
    'ROMA', 'BYZANTINE', 'GREECE', 'GREEK', 'ATHENIANS', 'SPARTANS', 'MACEDONIAN', 'THRACIAN', 'SICILIANS', 'ARMENIANS', 'GEORGIANS',
]);
const EUROPE_STYLES = new Set<string>([
    'LATIN', 'FRANKS', 'SPANISH', 'PORTUGUESE', 'BURGUNDIANS', 'GERMANIC', 'TEUTONS', 'SAXONS', 'BRITONS', 'CELTS',
    'DANES', 'VIKINGS', 'VARANGIANS', 'GOTHS', 'SLAVIC', 'POLES', 'LITHUANIANS', 'BOHEMIANS', 'BULGARIANS', 'MAGYAR', 'ITALIANS', 'EAST',
]);
const ME_STYLES = new Set<string>([
    'ORIE', 'WEST_ASIA', 'PERSIAN', 'SASANIAN', 'BERBER',
]);
const SOUTH_ASIA_STYLES = new Set<string>([
    'INDIA', 'PURU', 'BENGALIS', 'GURJARAS', 'MUGHAL', 'BURMESE', 'KHMER', 'MALAY',
]);
const AMERICAS_STYLES = new Set<string>([
    'AMERICA', 'ANDE', 'MAYANS', 'INCA', 'MUISCA', 'TUPI', 'MAPUCHE',
]);

/** 按战场 id 查最近据点建筑文化，返回该战场区域对应的中心主件候选池 */
function centerpiecesForBattlefield(seedKey: string): BfPart[] {
    const bf = BATTLEFIELDS.find((b) => b.id === seedKey);
    let style = '';
    if (bf) {
        let bestD2 = Infinity;
        for (const c of CITIES_V2) {
            const dLat = c.lat - bf.lat;
            const dLng = ((((c.lng - bf.lng) % 360) + 540) % 360) - 180;
            const d2 = dLat * dLat + dLng * dLng;
            if (d2 < bestD2) {
                bestD2 = d2;
                style = c.buildingStyle ?? '';
            }
        }
    }
    const pickKeys = (keys: string[]): BfPart[] =>
        keys.map((k) => CENTERPIECE_BY_KEY.get(k)).filter((p): p is BfPart => !!p);

    if (EAST_ASIA_STYLES.has(style)) return pickKeys(['CHINESE_RUINS', 'WAR_CHARIOT', 'CART_BROKEN']);
    if (MED_STYLES.has(style)) return pickKeys(['ROMAN_RUINS', 'WAR_CHARIOT', 'SIEGE_BALLISTA']);
    if (EUROPE_STYLES.has(style)) return pickKeys(['CASTLE_RUINS', 'TREBUCHET', 'HUSSITE_WAGON', 'CART_BROKEN']);
    if (ME_STYLES.has(style)) return pickKeys(['MESOPOTAMIAN_RUINS', 'MESOPOTAMIAN_TOMB', 'WAR_CHARIOT']);
    if (SOUTH_ASIA_STYLES.has(style)) return pickKeys(['INDIAN_RUINS', 'WAR_CHARIOT', 'CART_BROKEN']);
    if (AMERICAS_STYLES.has(style)) return pickKeys(['ANDEAN_RUINS', 'CART_BROKEN']);
    // 草原 / 西域 / 非洲 / 野地：断辕大车、战车残骸、攻城车残骸
    return pickKeys(['CART_BROKEN', 'WAR_CHARIOT', 'ONAGER', 'SIEGE_BALLISTA']);
}

/** ① 前排防线：造型立体的完好鹿角拒马（BARRICADE_A~D + 防骑尖木桩 STAKE_BARRICADE） */
export const BF_BARRICADES: BfPart[] = [
    { key: 'STAKE', label: '防骑尖木桩阵', path: '/SUCAI_BATTLEFIELD/STAKE_BARRICADE/preview.png', w: 96, h: 76, ax: 56, ay: 73, scale: 1.0 },
    { key: 'A', label: '行军木栅鹿角 A', path: '/SUCAI_BATTLEFIELD/BARRICADE_A/preview.png', w: 236, h: 104, ax: 118, ay: 103, scale: 0.72 },
    { key: 'B', label: '行军木栅鹿角 B', path: '/SUCAI_BATTLEFIELD/BARRICADE_B/preview.png', w: 204, h: 132, ax: 102, ay: 132, scale: 0.72 },
    { key: 'C', label: '重型十字木拒马 C', path: '/SUCAI_BATTLEFIELD/BARRICADE_C/preview.png', w: 152, h: 132, ax: 76, ay: 131, scale: 0.75 },
    { key: 'D', label: '双层交叉拒马 D', path: '/SUCAI_BATTLEFIELD/BARRICADE_D/preview.png', w: 196, h: 116, ax: 98, ay: 116, scale: 0.72 },
];

/** ② 中心主件导出别名（兼容旧外部引用 BF_CORPSES；已移除固定必出的木棍穿尸） */
export const BF_CORPSES: BfPart[] = BF_CENTERPIECES;

/** ③ 披甲遗骸与战马骨骸 —— 3 款随机 */
export const BF_BONES: BfPart[] = [
    { key: 'BONES_SOLDIER', label: '阵亡甲士（带圆盾立矛）', path: '/SUCAI_BATTLEFIELD/SKELETON_SOLDIER/preview.png', w: 84, h: 68, ax: 38, ay: 68, scale: 1.0 },
    { key: 'BONES_PLAIN', label: '战地白骨（旁落长矛）', path: '/SUCAI_BATTLEFIELD/SKELETON_BATTLEFIELD/preview.png', w: 76, h: 44, ax: 31, ay: 36, scale: 1.0 },
    { key: 'ANIMAL', label: '战马/巨兽骸骨', path: '/SUCAI_BATTLEFIELD/ANIMAL_SKELETON/preview.png', w: 80, h: 60, ax: 38, ay: 60, scale: 0.95 },
];

export interface BfExtraKind {
    key: string;
    label: string;
    variants: BfPart[];
}

/** ④ 点缀补件池（战地火炬 + 攻城器械残骸 + 战马骸骨）—— 每场抽 1~2 种（不重种） */
export const BF_EXTRA_KINDS: BfExtraKind[] = [
    {
        key: 'torch', label: '战地火炬', variants: [
            { key: 'TORCH_A', label: '战地插地火炬 A', path: '/SUCAI_BATTLEFIELD/TORCH_A/preview.png', w: 16, h: 68, ax: 7, ay: 68, scale: 1.0 },
            { key: 'TORCH_B', label: '战地长杆烽火架 B', path: '/SUCAI_BATTLEFIELD/TORCH_B/preview.png', w: 28, h: 92, ax: 14, ay: 92, scale: 1.0 },
        ],
    },
    {
        key: 'siege_wreck', label: '攻城器械残骸', variants: [
            { key: 'MANGONEL', label: '倒毁轻型投石车', path: '/SUCAI_BATTLEFIELD/DECAY_MANGONEL/preview.png', w: 120, h: 68, ax: 60, ay: 63, scale: 0.95 },
            { key: 'SCORPION', label: '倒毁弩炮残骸', path: '/SUCAI_BATTLEFIELD/DECAY_SCORPION/preview.png', w: 88, h: 52, ax: 46, ay: 50, scale: 1.0 },
            { key: 'RAM', label: '倒毁冲车残骸', path: '/SUCAI_BATTLEFIELD/DECAY_BATTERING_RAM/preview.png', w: 136, h: 76, ax: 69, ay: 68, scale: 0.90 },
        ],
    },
    {
        key: 'animal', label: '战马骸骨', variants: [
            { key: 'ANIMAL', label: '战马/驮畜骸骨', path: '/SUCAI_BATTLEFIELD/ANIMAL_SKELETON/preview.png', w: 80, h: 60, ax: 38, ay: 60, scale: 0.95 },
            { key: 'SOLDIER', label: '披甲阵亡士兵', path: '/SUCAI_BATTLEFIELD/SKELETON_SOLDIER/preview.png', w: 84, h: 68, ax: 38, ay: 68, scale: 1.0 },
        ],
    },
];

export interface BfSlot {
    /** 参考画布上的比例 x */
    gx: number;
    /** 参考画布上的比例 y */
    gy: number;
    /** 随机挪位幅度（参考 px） */
    jx: number;
    jy: number;
    /** 前后遮挡顺序 */
    z: number;
}

/** 5 个槽位（参考画布 340×240 上的比例坐标）：①中心遗迹/战车残骸 ＋ ②前排鹿角拒马 ＋ ③披甲遗骸 ＋ ④⑤火炬/器械点缀 */
export const BF_SLOTS: BfSlot[] = [
    { gx: 0.48, gy: 0.58, jx: 9, jy: 6, z: 180 },    // ① 中心主件（断壁残垣 / 战车残骸，坐镇后方视觉中心）
    { gx: 0.30, gy: 0.74, jx: 10, jy: 6, z: 240 },   // ② 前排左翼：立体鹿角拒马防线
    { gx: 0.66, gy: 0.78, jx: 10, jy: 6, z: 300 },   // ③ 前排右翼：披甲遗骸 / 战马骨骸
    { gx: 0.44, gy: 0.86, jx: 10, jy: 5, z: 320 },   // ④ 正前点缀：战地火炬 / 器械残骸
    { gx: 0.72, gy: 0.62, jx: 10, jy: 6, z: 260 },   // ⑤ 右后侧翼点缀
];

/* ── 确定性随机（**与页面同一套**，见文件头警告） ───────────────────── */

/** mulberry32：与页面第 1469 行逐字一致 */
function mulberry32(a: number): () => number {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** djb2：与页面第 1478 行逐字一致（**故意不用** scene13 的 FNV-1a，理由见文件头） */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

/** 重掷一轮用的种子偏移（页面上的 🎲 按钮 = 这个数 ++）。游戏里默认 0 = 每局稳定 */
let bfSeedOffset = 0;

/** 让整个战场形态重掷一轮（等价于页面点 🎲） */
export function rerollBattlefieldSeed(): void {
    bfSeedOffset++;
}

/**
 * 🔴 [2026-09-12 主人令「战略地图上，战场的样式每次不随机吗，请改为随机+随机镜像，一定要多样化」]
 *    **开局随机一个种子偏移** → 每一局载入都抽到新的一版：件种（拒马 5 款 / 尸体 2 款 / 骨骸 3 款 /
 *    补件 1~2 种）、**每件各自的镜像**、每件各自的挪位全部跟着重掷。
 *
 *    ⚠️ 随机的是「**这一局用哪个 offset**」，**抽签规则一字未改**（仍是 mulberry32 + hashString）：
 *       · 同一局内稳定 —— 战场不会中途变样（offset 只在开局设一次）；
 *       · 对照脚本 `verify_bf_morphology_parity` 与页面 🎲 只要 `setBattlefieldSeedOffset(n)`
 *         钉住同一个数，仍逐件一致，验收口径不受影响。
 *    调用点：`BattlefieldLayer` 构造时（每局一次）。
 */
export function randomizeBattlefieldSeed(): void {
    bfSeedOffset = Math.floor(Math.random() * 1_000_000);
}

/** 仅供测试/对照：设死种子偏移 */
export function setBattlefieldSeedOffset(offset: number): void {
    bfSeedOffset = offset;
}

/* ── 抽签 ───────────────────────────────────────────────────────────── */

export interface BfPlan {
    barricade: BfPart;
    corpse: BfPart;
    bones: BfPart;
    extraKinds: BfExtraKind[];
    extraVariants: BfPart[];
    flips: boolean[];
    jx: number[];
    jy: number[];
}

/** 一个战场抽到「哪些件、什么镜像、挪到哪」。
 *  🔴 一次抽签**固定消耗同样多的随机数**（不管 spec 后不后覆盖），
 *     这样逐款对照时只换那一件、**其余件的位置与镜像完全不动**，才比得出来。
 *  🔴 必须走 mulberry32 + hashString(seed)，**禁止 Math.random** —— 刷新不变。 */
export function bfRollPlan(seedKey: string): BfPlan {
    // 🔴 种子串与页面第 2097 行**逐字同式**：`'bf_' + seedKey + '_' + randomSeedOffset`
    //    （游戏里 seedKey 传战场 id `bf_xxx`、offset 恒 0 → 与页面 `?seed=0&key=bf_xxx` 完全同种子，
    //     故同一个战场在页面与游戏里画出**一模一样**的一版；见 verify_bf_morphology_parity.mjs）
    const rnd = mulberry32(hashString(`bf_${seedKey}_${bfSeedOffset}`));
    const centerPool = centerpiecesForBattlefield(seedKey);
    const plan: BfPlan = {
        barricade: BF_BARRICADES[Math.floor(rnd() * BF_BARRICADES.length)],
        corpse: centerPool[Math.floor(rnd() * centerPool.length)],
        bones: BF_BONES[Math.floor(rnd() * BF_BONES.length)],
        extraKinds: [], extraVariants: [], flips: [], jx: [], jy: [],
    };
    const n = rnd() < 0.5 ? 1 : 2;                       // 补 1 件还是 2 件 → 每场 4~5 件
    // 补件池各抽一个随机键排序后取前 n 种 = **不重种**的随机组合
    const order = BF_EXTRA_KINDS.map((k) => ({ k, r: rnd() }))
        .sort((a, b) => a.r - b.r);
    plan.extraKinds = order.filter((o) => o.k.key !== 'flag').slice(0, n).map((o) => o.k);
    plan.extraVariants = plan.extraKinds.map((k) => k.variants[Math.floor(rnd() * k.variants.length)]);
    for (let i = 0; i < BF_SLOTS.length; i++) {
        plan.flips.push(rnd() < 0.5);                    // 🔴 各自随机镜像
        plan.jx.push(rnd() * 2 - 1);                     // 🔴 各自随机挪位
        plan.jy.push(rnd() * 2 - 1);
    }
    return plan;
}

export interface BfPlacedPart {
    path: string;
    w: number;
    h: number;
    ax: number;
    ay: number;
    scale: number;
    z: number;
    flip: boolean;
    /** 参考画布上的比例坐标（已含本场挪位） */
    gx: number;
    gy: number;
}

/** 逐款对照用的强制指定（不传 = 全随机）。⚠️ spec 只改「抽到哪件」，位置/镜像仍来自抽签 */
export interface BfSpec {
    barricade?: string;
    corpse?: string;
    bones?: string;
    extras?: string[];
}

/** 按 key 取款式；key 传 null = 该槽位不放东西；找不到 = 取第一款 */
function bfPick(list: BfPart[], key: string | null): BfPart | null {
    if (key === null) return null;
    for (const p of list) {
        if (p.key === key) return p;
    }
    return list[0];
}

/** 取「本场要画的零件表」。seedKey = 战场身份（**游戏里传战场 id**） */
export function bfPropsFor(seedKey: string, spec?: BfSpec): BfPlacedPart[] {
    const s0 = spec ?? {};
    const plan = bfRollPlan(seedKey);
    const parts: BfPlacedPart[] = [];
    const add = (chosen: BfPart | null, slotIdx: number) => {
        if (!chosen) return;
        const s = BF_SLOTS[slotIdx];
        parts.push({
            path: chosen.path, w: chosen.w, h: chosen.h, ax: chosen.ax, ay: chosen.ay, scale: chosen.scale ?? 1.0,
            z: s.z, flip: plan.flips[slotIdx],
            gx: s.gx + plan.jx[slotIdx] * s.jx / BF_REF_W,
            gy: s.gy + plan.jy[slotIdx] * s.jy / BF_REF_H,
        });
    };
    add(bfPick(BF_CENTERPIECES, s0.corpse !== undefined ? s0.corpse : plan.corpse.key), 0);
    add(bfPick(BF_BARRICADES, s0.barricade !== undefined ? s0.barricade : plan.barricade.key), 1);
    add(bfPick(BF_BONES, s0.bones !== undefined ? s0.bones : plan.bones.key), 2);
    let extras: (BfPart | null)[];
    if (s0.extras !== undefined) {
        extras = s0.extras.map((key) => {
            const hit = BF_EXTRA_KINDS.find((k) => k.key === key);
            return hit ? hit.variants[0] : null;         // 对照时取该种第一款，确定不再抽
        });
    } else {
        extras = plan.extraVariants;
    }
    extras.slice(0, 2).forEach((v, i) => add(v, 3 + i));
    return parts;
}

/* ── 抖动包络（上界包围盒）：**常量** ────────────────────────────────── */

export interface BfEnvelope { x0: number; x1: number; y0: number; y1: number; w: number; h: number; }

let bfEnvCache: BfEnvelope | null = null;

/** 把**每个槽位上所有可能出现**的零件的 gx/gy 都按 ±jx/±jy 推到四角取并集。
 *  🔴 与「本场抽到哪些件」**无关** —— 4 件场和 5 件场、抽到大残骸还是小火把，
 *     比例尺全都一样，不会忽大忽小；且掷到任何一边都跑不出包络 → 永远不会越界。 */
export function bfEnvelope(): BfEnvelope {
    if (bfEnvCache) return bfEnvCache;
    const extrasAll: BfPart[] = [];
    for (const k of BF_EXTRA_KINDS) {
        for (const v of k.variants) extrasAll.push(v);
    }
    const perSlot: BfPart[][] = [BF_CENTERPIECES, BF_BARRICADES, BF_BONES, extrasAll, extrasAll];
    let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    perSlot.forEach((list, i) => {
        const s = BF_SLOTS[i];
        for (const p of list) {
            const sc = p.scale ?? 1.0;
            const pw = p.w * sc, ph = p.h * sc, pax = p.ax * sc, pay = p.ay * sc;
            for (const sx of [-1, 1]) {
                for (const sy of [-1, 1]) {
                    const gx = BF_REF_W * s.gx + sx * s.jx;
                    const gy = BF_REF_H * s.gy + sy * s.jy;
                    bx0 = Math.min(bx0, gx - pax); bx1 = Math.max(bx1, gx - pax + pw);
                    by0 = Math.min(by0, gy - pay); by1 = Math.max(by1, gy - pay + ph);
                }
            }
        }
    });
    bfEnvCache = { x0: bx0, x1: bx1, y0: by0, y1: by1, w: bx1 - bx0, h: by1 - by0 };
    return bfEnvCache;
}

/** 包络摆到画布正中所需的偏移（常量）+ 包络自身尺寸 */
export function bfLayout(): { offX: number; offY: number; artW: number; artH: number } {
    const env = bfEnvelope();
    return {
        offX: BF_REF_W * 0.50 - (env.x0 + env.x1) / 2,
        offY: BF_REF_H * 0.50 - (env.y0 + env.y1) / 2,
        artW: env.w,
        artH: env.h,
    };
}

/** 按**包络**算出「在 boxW × boxH 的容器里最多能画多大」（同时卡宽与卡高，各留边距） */
export function bfFitArtW(boxW: number, boxH: number): number {
    const L = bfLayout();
    return Math.min(boxW - 40, (boxH - 24) * L.artW / L.artH);
}

/* ── 出图 ───────────────────────────────────────────────────────────── */

/** 单个零件的 HTML（镜像时锚点百分比要一起翻，否则地面点会跑到另一侧） */
export function bfPropHtml(p: BfPlacedPart, gxPx: number, gyPx: number, k: number, z: number): string {
    const axPct = (p.flip ? 100 - p.ax / p.w * 100 : p.ax / p.w * 100).toFixed(2);
    const ayPct = (p.ay / p.h * 100).toFixed(2);
    return '<img src="' + p.path + '" style="position:absolute;left:' + (gxPx * k).toFixed(1) + 'px;top:' + (gyPx * k).toFixed(1) +
        'px;width:' + (p.w * p.scale * k).toFixed(1) + 'px;transform:translate(-' + axPct + '%,-' + ayPct + '%)' +
        (p.flip ? ' scaleX(-1)' : '') + ';z-index:' + z +
        ';filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45));pointer-events:none;" />';
}

/**
 * 返回一个「包络宽度 = artW 像素」的战场形态盒子（绝对定位于父容器正中）。
 * seedKey = 战场身份（**游戏里传战场 id**）→ 决定它抽到哪些件、挪到哪、翻不翻。
 */
export function renderBattlefieldBoxHtml(artW: number, seedKey: string, spec?: BfSpec): string {
    const L = bfLayout();
    const k = artW / L.artW;                       // 参考画布 px → 屏幕 px
    const canvasW = BF_REF_W * k;
    const canvasH = BF_REF_H * k;
    const parts = bfPropsFor(seedKey, spec).map((p) =>
        bfPropHtml(p, BF_REF_W * p.gx + L.offX, BF_REF_H * p.gy + L.offY, k, p.z));
    return '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:' + canvasW.toFixed(0) +
        'px;height:' + canvasH.toFixed(0) + 'px;">' + parts.join('') + '</div>';
}
