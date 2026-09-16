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
}

/** ① 拒马位：完好的拒马 + 4 款打烂的拒马残骸，**5 款随机**
 *  （主人：「打烂的拒马残骸替换拒马」→「**拒马残骸和拒马随机**」） */
export const BF_BARRICADES: BfPart[] = [
    { key: 'STAKE', label: '拒马 · 鹿角完好', path: '/SUCAI_BATTLEFIELD/STAKE_BARRICADE/preview.png', w: 96, h: 76, ax: 57, ay: 73 },
    { key: 'A', label: '拒马残骸 A · 长条散架', path: '/SUCAI_BATTLEFIELD/BARRICADE_RUBBLE_A/preview.png', w: 228, h: 56, ax: 113, ay: 56 },
    { key: 'B', label: '拒马残骸 B · 斜倒', path: '/SUCAI_BATTLEFIELD/BARRICADE_RUBBLE_B/preview.png', w: 164, h: 96, ax: 80, ay: 95 },
    { key: 'C', label: '拒马残骸 C · 堆成一堆', path: '/SUCAI_BATTLEFIELD/BARRICADE_RUBBLE_C/preview.png', w: 100, h: 120, ax: 66, ay: 118 },
    { key: 'D', label: '拒马残骸 D · 散开', path: '/SUCAI_BATTLEFIELD/BARRICADE_RUBBLE_D/preview.png', w: 176, h: 88, ax: 89, ay: 88 },
];

/** ② 尸体 —— 2 款随机（主人指的「木棍插着一个尸体」两版） */
export const BF_CORPSES: BfPart[] = [
    { key: 'IMPALED_ANT', label: '尸体 · 木棍插着·古典', path: '/SUCAI_BATTLEFIELD/IMPALED_CORPSE_ANT/preview.png', w: 24, h: 116, ax: 16, ay: 114 },
    { key: 'IMPALED', label: '尸体 · 木棍插着·通用', path: '/SUCAI_BATTLEFIELD/IMPALED_CORPSE/preview.png', w: 24, h: 112, ax: 12, ay: 112 },
];

/** ③ 骨骸 —— 3 款随机（放大逐张比对过，确实是三件不同的东西） */
export const BF_BONES: BfPart[] = [
    { key: 'BONES_PLAIN', label: '骨骸 · 白骨（旁落一矛）', path: '/SUCAI_BATTLEFIELD/SKELETON_BATTLEFIELD/preview.png', w: 76, h: 44, ax: 31, ay: 36 },
    { key: 'BONES_CIVILIAN', label: '骨骸 · 带腐肉（旁落一剑）', path: '/SUCAI_BATTLEFIELD/SKELETON_CIVILIAN/preview.png', w: 80, h: 44, ax: 33, ay: 38 },
    { key: 'BONES_SOLDIER', label: '骨骸 · 阵亡甲士（带圆盾）', path: '/SUCAI_BATTLEFIELD/SKELETON_SOLDIER/preview.png', w: 84, h: 68, ax: 28, ay: 68 },
];

export interface BfExtraKind {
    key: string;
    label: string;
    variants: BfPart[];
}

/** ④ 随机补件池 —— 每场抽 **1~2 种**（不重种），每种再随机抽一款 */
export const BF_EXTRA_KINDS: BfExtraKind[] = [
    {
        key: 'torch', label: '火把', variants: [
            { key: 'TORCH_A', label: '火把 · 细', path: '/SUCAI_BATTLEFIELD/TORCH_A/preview.png', w: 16, h: 68, ax: 8, ay: 68 },
            { key: 'TORCH_B', label: '火把', path: '/SUCAI_BATTLEFIELD/TORCH_B/preview.png', w: 28, h: 92, ax: 16, ay: 92 },
        ],
    },
    {
        key: 'animal', label: '牲口骸骨', variants: [
            { key: 'ANIMAL', label: '牲口骸骨（战马/驮畜）', path: '/SUCAI_BATTLEFIELD/ANIMAL_SKELETON/preview.png', w: 80, h: 60, ax: 39, ay: 60 },
        ],
    },
    {
        key: 'fence', label: '栅栏木堆', variants: [
            { key: 'FENCE', label: '栅栏木堆', path: '/SUCAI_BATTLEFIELD/FENCE_RUBBLE/preview.png', w: 100, h: 60, ax: 53, ay: 56 },
        ],
    },
    // 残破战旗：主人 2026-09-12 早先亲自挑的 8 面，编进随机池 —— 有的战场插旗、有的不插
    {
        key: 'flag', label: '残破战旗', variants: [
            { key: 'N', label: '旗 N · 深灰破布（边缘撕裂）', path: '/SUCAI_BUILDING/SCEN_FLAG_N/preview.png', w: 80, h: 96, ax: 60, ay: 95 },
            { key: 'R', label: '旗 R · 深色破旗（带白色兽纹）', path: '/SUCAI_BUILDING/SCEN_FLAG_R/preview.png', w: 80, h: 96, ax: 68, ay: 92 },
            { key: 'S', label: '旗 S · 白底十字破旗', path: '/SUCAI_BUILDING/SCEN_FLAG_S/preview.png', w: 92, h: 96, ax: 72, ay: 95 },
            { key: 'D', label: '旗 D · 白旗破边', path: '/SUCAI_BUILDING/SCEN_FLAG_D/preview.png', w: 72, h: 84, ax: 64, ay: 81 },
            { key: 'E', label: '旗 E · 白旗垂落破边', path: '/SUCAI_BUILDING/SCEN_FLAG_E/preview.png', w: 92, h: 104, ax: 58, ay: 101 },
            { key: 'U', label: '旗 U · 白旗破边（小）', path: '/SUCAI_BUILDING/SCEN_FLAG_U/preview.png', w: 80, h: 96, ax: 60, ay: 95 },
            { key: 'RITUAL_A', label: '旗 · 只剩旗杆（布没了）', path: '/SUCAI_BUILDING/SCEN_FLAG_RITUAL_A/preview.png', w: 76, h: 136, ax: 50, ay: 132 },
            { key: 'MACEDONIAN', label: '旗 · 马其顿维吉纳太阳（完好·对照）', path: '/SUCAI_BUILDING/SCEN_FLAG_MACEDONIAN/preview.png', w: 76, h: 80, ax: 58, ay: 78 },
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
    /** 前后遮挡顺序（尸体压最前） */
    z: number;
}

/** 5 个槽位（参考画布 340×240 上的比例坐标）：前 3 个 = 保底三件，后 2 个 = 随机补件 */
export const BF_SLOTS: BfSlot[] = [
    { gx: 0.34, gy: 0.62, jx: 13, jy: 8, z: 200 },   // ① 拒马残骸（偏左，横向铺开）
    { gx: 0.20, gy: 0.79, jx: 11, jy: 7, z: 330 },   // ② 尸体（立着，最左最前，不被残骸堆压住）
    { gx: 0.58, gy: 0.78, jx: 12, jy: 8, z: 300 },   // ③ 骨骸（右前方，露出）
    { gx: 0.44, gy: 0.88, jx: 13, jy: 7, z: 270 },   // ④ 随机补件 1（正前）
    { gx: 0.71, gy: 0.58, jx: 13, jy: 9, z: 250 },   // ⑤ 随机补件 2（右后）
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
    const plan: BfPlan = {
        barricade: BF_BARRICADES[Math.floor(rnd() * BF_BARRICADES.length)],
        corpse: BF_CORPSES[Math.floor(rnd() * BF_CORPSES.length)],
        bones: BF_BONES[Math.floor(rnd() * BF_BONES.length)],
        extraKinds: [], extraVariants: [], flips: [], jx: [], jy: [],
    };
    const n = rnd() < 0.5 ? 1 : 2;                       // 补 1 件还是 2 件 → 每场 4~5 件
    // 5 种补件各抽一个随机键排序后取前 n 种 = **不重种**的随机组合
    const order = BF_EXTRA_KINDS.map((k) => ({ k, r: rnd() }))
        .sort((a, b) => a.r - b.r);
    plan.extraKinds = order.slice(0, n).map((o) => o.k);
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
            path: chosen.path, w: chosen.w, h: chosen.h, ax: chosen.ax, ay: chosen.ay, scale: 1.0,
            z: s.z, flip: plan.flips[slotIdx],
            gx: s.gx + plan.jx[slotIdx] * s.jx / BF_REF_W,
            gy: s.gy + plan.jy[slotIdx] * s.jy / BF_REF_H,
        });
    };
    add(bfPick(BF_BARRICADES, s0.barricade !== undefined ? s0.barricade : plan.barricade.key), 0);
    add(bfPick(BF_CORPSES, s0.corpse !== undefined ? s0.corpse : plan.corpse.key), 1);
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
    const perSlot: BfPart[][] = [BF_BARRICADES, BF_CORPSES, BF_BONES, extrasAll, extrasAll];
    let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    perSlot.forEach((list, i) => {
        const s = BF_SLOTS[i];
        for (const p of list) {
            for (const sx of [-1, 1]) {
                for (const sy of [-1, 1]) {
                    const gx = BF_REF_W * s.gx + sx * s.jx;
                    const gy = BF_REF_H * s.gy + sy * s.jy;
                    bx0 = Math.min(bx0, gx - p.ax); bx1 = Math.max(bx1, gx - p.ax + p.w);
                    by0 = Math.min(by0, gy - p.ay); by1 = Math.max(by1, gy - p.ay + p.h);
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
