// 城墙锚点字典 + 围墙判断（共享模块）：主游戏 TerritorySystem.ts 与测试页 _citytest.html 都 import 此文件。
// 改一处两边自动同步 —— 🔴 [2026-09-11 主人定「根治」，杜绝两处复制漂移]。

/** 确定性字符串哈希（**全项目唯一一份**）：TerritorySystem / Scene13WarLayer / 评估页 _citytest.html 共用。
 *  🔴 [2026-10-02 主人令「请把 4 种全部用上，可以增加城寨的多样性」] 由 TerritorySystem 移入本共享模块：
 *     城寨栅栏材质要按据点 id 落定，**战略地图、攻城战场、评估页必须是同一个种子同一个结果**；
 *     各写一份哈希必然漂移（本仓血训：小城石墙名单三处各判一次 → 三处不同步）。 */
export function deHashString(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h >>> 0;
}

/** 城墙/城门部件锚点（pct = anchor/box×100，widthFactor = 尺寸权重） */
export interface WallAnchor {
    pctX: number;
    pctY: number;
    widthFactor: number;
    path: string;
}

// 各类栅栏/城门部件的精准锚点百分比与尺寸权重（提取自 DE _meta.json anchor_x / anchor_y）
// 栅栏比例进一步调至 0.165x（高度约 15px），角楼与栅栏比例平衡，彻底展现村落全景通透感
// 【非草原小城/村民围栏】用 DE「硬木栅栏」HARDWOOD_WALL_PALISADE（b_scen_wall_palisade_fortified 参差尖桩丛）。
// 草原营地（YURT 大/中/小城）另用 DE「栅栏」ARCHAIC_WALL_PALISADE（见 DE_ARCHAIC_PALISADE_ANCHORS）。
export const DE_PALISADE_ANCHORS: Record<string, { pctX: number; pctY: number; widthFactor: number; path: string }> = {
    NE: {
        pctX: 53.8,
        pctY: 74.1,
        widthFactor: 0.165,
        path: '/SUCAI_BUILDING/HARDWOOD_WALL_PALISADE_NE/preview.png',
    },
    SE: {
        pctX: 56.0,
        pctY: 77.8,
        widthFactor: 0.165,
        path: '/SUCAI_BUILDING/HARDWOOD_WALL_PALISADE_SE/preview.png',
    },
    POST: {
        pctX: 60.0,
        pctY: 75.0,
        widthFactor: 0.23, // 2026-09-10 主人定：加高栅栏木垛
        path: '/SUCAI_BUILDING/HARDWOOD_WALL_PALISADE_POST/preview.png',
    },
    GATE: {
        pctX: 58.6,
        pctY: 75.9,
        widthFactor: 0.34,
        path: '/SUCAI_BUILDING/DARK_GATE_PALISADE_NE/preview.png', // 另一朝向双塔木城门（主人 2026-08-26 指定，弃正南 SE 款）
    },
};

// 🔴 [2026-09-10 主人定] 草原营地套系 1：DE 经典原木尖桩栅栏 DARK_WALL_PALISADE（b_dark_wall_palisade，垂直尖原木桩，无横梁不对称反面）
export const DE_DARK_PALISADE_ANCHORS: Record<string, { pctX: number; pctY: number; widthFactor: number; path: string }> = {
    NE: {
        pctX: 50.0,
        pctY: 72.7,
        widthFactor: 0.165,
        path: '/SUCAI_BUILDING/DARK_WALL_PALISADE_NE/preview.png',
    },
    SE: {
        pctX: 52.2,
        pctY: 72.7,
        widthFactor: 0.165,
        path: '/SUCAI_BUILDING/DARK_WALL_PALISADE_SE/preview.png',
    },
    POST: {
        pctX: 56.3,
        pctY: 75.9,
        widthFactor: 0.27, // 2026-09-10 主人定：加高栅栏木垛
        path: '/SUCAI_BUILDING/DARK_WALL_PALISADE_POST/preview.png',
    },
    GATE: {
        pctX: 58.6,
        pctY: 75.9,
        widthFactor: 0.34,
        path: '/SUCAI_BUILDING/DARK_GATE_PALISADE_NE/preview.png',
    },
};

// 🔴 [2026-09-10 主人定] 草原营地套系 2：DE 横木平切栅栏 ARCHAIC_WALL_PALISADE（b_archaic_wall_palisade，两端平切口横木加固栅栏）
export const DE_ARCHAIC_PALISADE_ANCHORS: Record<string, { pctX: number; pctY: number; widthFactor: number; path: string }> = {
    NE: {
        pctX: 60.0,
        pctY: 80.8,
        widthFactor: 0.165,
        path: '/SUCAI_BUILDING/ARCHAIC_WALL_PALISADE_NE/preview.png',
    },
    SE: {
        pctX: 60.0,
        pctY: 80.8,
        widthFactor: 0.165,
        path: '/SUCAI_BUILDING/ARCHAIC_WALL_PALISADE_SE/preview.png',
    },
    POST: {
        pctX: 56.3,
        pctY: 75.9,
        widthFactor: 0.27, // 2026-09-10 主人定：加高栅栏木垛
        path: '/SUCAI_BUILDING/DARK_WALL_PALISADE_POST/preview.png',
    },
    GATE: {
        pctX: 56.9,
        pctY: 73.0,
        widthFactor: 0.34,
        path: '/SUCAI_BUILDING/ARCHAIC_GATE_PALISADE_NE/preview.png',
    },
};

// 篱笆部件锚点（2026-09-03 主人定：城寨像小城一样围一圈，用 DE b_scen_fence 真·编织篱笆）
export const DE_FENCE_ANCHORS: Record<string, { pctX: number; pctY: number; widthFactor: number; path: string }> = {
    NE: {
        pctX: 58.3,
        pctY: 56.7,
        widthFactor: 0.13,
        path: '/SUCAI_BUILDING/FENCE_WALL_NE/preview.png',
    },
    SE: {
        pctX: 69.4,
        pctY: 65.6,
        widthFactor: 0.13,
        path: '/SUCAI_BUILDING/FENCE_WALL_SE/preview.png',
    },
    POST: {
        pctX: 68.8,
        pctY: 58.3,
        widthFactor: 0.08,
        path: '/SUCAI_BUILDING/FENCE_WALL_POST/preview.png',
    },
    GATE: {
        pctX: 53.7,
        pctY: 59.1,
        widthFactor: 0.26,
        path: '/SUCAI_BUILDING/FENCE_GATE_NE/preview.png',
    },
    // L形转角件（DE b_scen_fence f2）：无缝连接两段篱笆，放在四角替代单柱 f4
    CORNER: {
        pctX: 54.0,
        pctY: 58.3,
        widthFactor: 0.18,
        path: '/SUCAI_BUILDING/FENCE_CORNER/preview.png',
    },
};

export type StockadeFenceKey = 'HARDWOOD' | 'DARK' | 'ARCHAIC' | 'FENCE';

/* ============================================================================
 * 🔴 城寨曲线围栏（圆城 / 八角 / 椭圆）—— 唯一一份拼法（游戏 TerritorySystem 与评估页 _citytest.html 共用）
 *
 * 主人 2026-10-01 定「围栏三件套标准」（见 AGENTS.md §三之三）：
 *   · 一共三种件：**城门 GATE / 城垛 POST / 城墙 NE|SE**（城墙只有东北、东南两朝向，各含镜像）；
 *   · **城墙朝向一变就必须有一个城垛**；
 *   · **城门两边必须接城墙**（只开一扇，放在左下那条边上，正中）；
 *   · **城垛两边都必须是城墙**（两个城垛不许挨着，中间至少隔一段墙）。
 *
 * 🔴 2026-10-02 主人令「重设计下城寨的圆城，八角，椭圆」——实测病灶（真机量的）：
 *   圆城圈 105×61、八角圈 94×54，而直边形（正方/矩形）是 150×87；
 *   院里 9 栋仍按 0.32~0.42×baseSize 的圆环摆 → **圆城有 2 栋、八角有 5 栋顶到栏外**（椭圆只剩 1px 余量）。
 *   → 重设计：三个曲线形的圈**放大到与直边形同档**（圆城 144×85 / 八角 130×76 / 椭圆 150×57），
 *     件距同步放宽（1.12→1.5 格），件数仍与直边形同档（约 30~35 件），院内建筑留出 8px 以上余量。
 *   验收：`scratch/_measure_stockade_contain.mjs`（逐形制量「院内建筑全在栏内 + 最近余量」）、
 *        `scratch/verify_stockade_shape_parity.mts` 第 ⑦ 项（三件套逐条）、`scratch/_probe_stockade_game_render.mjs`。
 *
 * 「朝向一变就放城垛」的判定：沿轮廓等弧长取点 → 按走向定朝向（右上 NE／右下 SE／左下 SE 镜像／左上 NE 镜像），
 * 近水平、近竖直处（<0.3）沿用上一段朝向（否则曲线会被切成一堆碎朝向）→ 朝向变处放城垛。
 * ========================================================================== */
export type CorralXY = { x: number; y: number };
export interface StockadeRingPiece { x: number; y: number; type: 'NE' | 'SE' | 'POST' | 'GATE' | 'CORNER'; flipX?: boolean }

/* ── 直边形三款（正方 / 矩形 / 梯形）的拼法 ──────────────────────────────────
 * 与曲线三形一样收进共享模块：**六形制只有这一份**，游戏 / 评估页 / 围栏编辑器都调它。
 * （纯搬迁，逐行照搬原实现，不改一个数 —— 见 `scratch/_audit_stockade_page_vs_game.mjs` 逐件对账。） */

/** 绕城一圈：四角城垛 + 四条边（每边 AX−1 段）+ 中部城门（`fourGates` 时四边皆门）。
 *  小城 / 中城 / 大城 / 城寨「正方」都用它（S 不同）。 */
export function buildRingWallAndGate(baseSize: number, S: number = 5, fourGates: boolean = false): StockadeRingPiece[] {
    const stepX = baseSize * 0.075;
    const stepY = stepX * 0.58;
    const AX = 2 * S;
    const pieces: StockadeRingPiece[] = [];

    const westX = -AX * stepX;
    const eastX = AX * stepX;
    const northY = -AX * stepY;
    const southY = AX * stepY;

    // 四角木碉楼/角楼（城垛）
    pieces.push({ x: westX, y: 0, type: 'POST' });
    pieces.push({ x: 0, y: northY, type: 'POST' });
    pieces.push({ x: eastX, y: 0, type: 'POST' });
    pieces.push({ x: 0, y: southY, type: 'POST' });

    // 西北边：西角→北角（右上 = NE 段），k=S-1..S+1 让给城门（嵌墙中部）
    for (let k = 1; k < AX; k++) {
        if (k >= S - 1 && k <= S + 1) continue;
        pieces.push({ x: westX + k * stepX, y: -k * stepY, type: 'NE' });
    }
    pieces.push({ x: westX + S * stepX, y: -S * stepY, type: 'GATE' });   // 西北墙中部城门

    // 东北边：北角→东角（右下 = SE 段），fourGates 为 true 时添加镜像城门
    for (let k = 1; k < AX; k++) {
        if (fourGates && k >= S - 1 && k <= S + 1) continue;
        pieces.push({ x: k * stepX, y: northY + k * stepY, type: 'SE' });
    }
    if (fourGates) {
        pieces.push({ x: S * stepX, y: northY + S * stepY, type: 'GATE', flipX: true });
    }

    // 东南边：东角→南门（左下 = SE 镜像），k=S-1..S+1 让给城门
    for (let k = 1; k < AX; k++) {
        if (k >= S - 1 && k <= S + 1) continue;
        pieces.push({ x: eastX - k * stepX, y: k * stepY, type: 'SE', flipX: true });
    }
    pieces.push({ x: eastX - S * stepX, y: S * stepY, type: 'GATE' });    // 东南墙中部城门

    // 西南边：南门→西角（左上 = NE 镜像），fourGates 为 true 时添加镜像城门
    for (let k = 1; k < AX; k++) {
        if (fourGates && k >= S - 1 && k <= S + 1) continue;
        pieces.push({ x: -k * stepX, y: southY - k * stepY, type: 'NE', flipX: true });
    }
    if (fourGates) {
        pieces.push({ x: -S * stepX, y: southY - S * stepY, type: 'GATE', flipX: true });
    }

    return pieces;
}

/** 城寨「矩形围栏」：长 12 段 × 宽 8 段（3:2），两长边各一门居中，四角 L 形转角件（纯搬迁自 TerritorySystem）。 */
export function buildStockadeRectRing(baseSize: number): StockadeRingPiece[] {
    const sx = baseSize * 0.075;
    const sy = sx * 0.58;
    const L = 12, WSeg = 8;
    const P = (u: number, v: number) => ({ x: (u + v) * sx, y: (u - v) * sy });
    const P0 = P(-L / 2, -WSeg / 2);
    const P1 = P(L / 2, -WSeg / 2);
    const P2 = P(L / 2, WSeg / 2);
    const P3 = P(-L / 2, WSeg / 2);
    const cx = (P0.x + P1.x + P2.x + P3.x) / 4;
    const cy = (P0.y + P1.y + P2.y + P3.y) / 4;
    const pieces: StockadeRingPiece[] = [];
    const put = (p: CorralXY, type: StockadeRingPiece['type'], flipX?: boolean) =>
        pieces.push({ x: p.x - cx, y: p.y - cy, type, flipX: !!flipX });
    const lerp = (A: CorralXY, B: CorralXY, t: number) => ({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t });

    put(P0, 'CORNER'); put(P1, 'CORNER'); put(P2, 'CORNER'); put(P3, 'CORNER');

    const halfL = Math.floor(L / 2);
    for (let k = 1; k < L; k++) {
        if (k >= halfL - 1 && k <= halfL + 1) continue;
        put(lerp(P0, P1, k / L), 'SE');
    }
    put(lerp(P0, P1, halfL / L), 'GATE', true);
    for (let k = 1; k < L; k++) {
        if (k >= halfL - 1 && k <= halfL + 1) continue;
        put(lerp(P2, P3, k / L), 'NE', true);
    }
    put(lerp(P2, P3, halfL / L), 'GATE', true);
    for (let k = 1; k < WSeg; k++) put(lerp(P1, P2, k / WSeg), 'NE');
    for (let k = 1; k < WSeg; k++) put(lerp(P3, P0, k / WSeg), 'SE', true);
    return pieces;
}

/** 城寨「梯形隘口寨」：背窄前阔（背 6 段 / 前 12 段 / 两斜边各 8 段），正面长门，四角立垛（纯搬迁）。 */
export function buildStockadeTrapezoidRing(baseSize: number): StockadeRingPiece[] {
    const sx = baseSize * 0.075;
    const sy = sx * 0.58;
    const P = (u: number, v: number) => ({ x: (u + v) * sx, y: (u - v) * sy });
    const P_fl = P(-6, -4), P_fr = P(6, -4), P_br = P(3, 4), P_bl = P(-3, 4);
    const cx = (P_fl.x + P_fr.x + P_br.x + P_bl.x) / 4;
    const cy = (P_fl.y + P_fr.y + P_br.y + P_bl.y) / 4;
    const pieces: StockadeRingPiece[] = [];
    const put = (p: CorralXY, type: StockadeRingPiece['type'], flipX?: boolean) =>
        pieces.push({ x: p.x - cx, y: p.y - cy, type, flipX: !!flipX });
    const lerp = (A: CorralXY, B: CorralXY, t: number) => ({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t });

    put(P_fl, 'CORNER'); put(P_fr, 'CORNER'); put(P_br, 'CORNER'); put(P_bl, 'CORNER');

    const N_front = 12, halfF = Math.floor(N_front / 2);
    for (let k = 1; k < N_front; k++) {
        if (k >= halfF - 1 && k <= halfF + 1) continue;
        put(lerp(P_fl, P_fr, k / N_front), 'SE');
    }
    put(lerp(P_fl, P_fr, halfF / N_front), 'GATE', true);
    const N_back = 6;
    for (let k = 1; k < N_back; k++) put(lerp(P_br, P_bl, k / N_back), 'NE', true);
    const N_side = 8;
    for (let k = 1; k < N_side; k++) put(lerp(P_fr, P_br, k / N_side), 'NE');
    for (let k = 1; k < N_side; k++) put(lerp(P_bl, P_fl, k / N_side), 'SE', true);
    return pieces;
}

/** 城寨六形制的统一入口（🔴 游戏 / 评估页 / 围栏编辑器**只许调这一个**）。 */
export const STOCKADE_SHAPE_KEYS = ['square', 'round', 'octagon', 'rect', 'oval', 'trapezoid'] as const;
export type StockadeShapeKey = typeof STOCKADE_SHAPE_KEYS[number];
export const STOCKADE_SHAPE_LABELS: Record<StockadeShapeKey, string> = {
    square: '正方', round: '圆城', octagon: '八角', rect: '矩形围栏', oval: '椭圆山脊堡', trapezoid: '梯形隘口寨',
};
export function buildStockadeShapeRing(shape: StockadeShapeKey, baseSize: number): StockadeRingPiece[] {
    switch (shape) {
        case 'square': return buildRingWallAndGate(baseSize, 5);
        case 'rect': return buildStockadeRectRing(baseSize);
        case 'trapezoid': return buildStockadeTrapezoidRing(baseSize);
        case 'round': case 'octagon': case 'oval': return buildStockadeCurveRing(shape, baseSize);
    }
}

/** 曲线围栏的三种轮廓参数（唯一一份：游戏与评估页都从这里取，地面裁切也跟着这几个数） */
export interface StockadeCurveShape {
    /** 轮廓点（px，闭合环；顺序即环的走向） */
    loop: CorralXY[];
    /** 取点步距（px）——同时决定件数 */
    step: number;
    /** 城门在「左下那条边」上的位置（0~1，0.5 = 正中） */
    gateFrac: number;
    /** 地面裁切：椭圆半轴（px） */
    clipRx: number;
    clipRy: number;
}

/** 按形制+baseSize 生成曲线围栏的轮廓参数。**游戏与评估页必须都调这一个函数。** */
export function stockadeCurveShape(shape: 'round' | 'octagon' | 'oval', baseSize: number): StockadeCurveShape {
    const sx = baseSize * 0.075;
    const sy = sx * 0.58;
    const step = sx * 1.5;           // 件距（🔴 2026-10-02：圈放大后同步放宽，件数仍与直边形同档）
    if (shape === 'round') {
        // 圆城：等轴正圆（屏幕 1.72:1 的等轴椭圆）——圈 144×85px，与正方同档
        const Rx = 9.6 * sx, Ry = 9.6 * sx * 0.58;
        const loop: CorralXY[] = [];
        for (let i = 0; i < 96; i++) { const a = (-90 + i * 3.75) * Math.PI / 180; loop.push({ x: Rx * Math.cos(a), y: Ry * Math.sin(a) }); }
        return { loop, step, gateFrac: 0.5, clipRx: Rx * 0.94, clipRy: Ry * 0.94 };
    }
    if (shape === 'octagon') {
        // 八角：世界格切角八边形（半边 H、切角 c）——圈 130×76px
        const H = 5.2, c = 1.7;
        const P = (u: number, v: number) => ({ x: u * sx, y: v * sy });
        const loop = [P(-c, c - 2 * H), P(c, c - 2 * H), P(2 * H - c, -c), P(2 * H - c, c),
            P(c, 2 * H - c), P(-c, 2 * H - c), P(-2 * H + c, c), P(-2 * H + c, -c)];
        return { loop, step, gateFrac: 0.45, clipRx: 0, clipRy: 0 };
    }
    // 椭圆：山脊长椭圆（顺山脊走，能铺 7 栋）——圈 150×57px
    const Rx = 10.0 * sx, Ry = 6.6 * sy;
    const loop: CorralXY[] = [];
    for (let i = 0; i < 96; i++) { const a = (-90 + i * 3.75) * Math.PI / 180; loop.push({ x: Rx * Math.cos(a), y: Ry * Math.sin(a) }); }
    return { loop, step, gateFrac: 0.5, clipRx: Rx * 0.94, clipRy: Ry * 0.94 };
}

/** 沿轮廓等弧长取点 → 按走向定朝向 → **朝向一变就放城垛** → 左下边正中开一扇门（门两边各留墙）。
 *  返回的数组**按环的顺序**排列（验收脚本据此检查相邻关系）。 */
export function corralPiecesFromLoop(loop: CorralXY[], step: number, gateFrac: number): StockadeRingPiece[] {
    const m = loop.length;
    const segLen: number[] = [];
    let total = 0;
    for (let i = 0; i < m; i++) { const a = loop[i], b = loop[(i + 1) % m]; const d = Math.hypot(b.x - a.x, b.y - a.y); segLen.push(d); total += d; }
    const n = Math.max(12, Math.round(total / step));
    const st = total / n;
    const samples: Array<CorralXY & { dx: number; dy: number; s: number }> = [];
    let seg = 0, segStart = 0;
    for (let k = 0; k < n; k++) {
        const s = k * st;
        while (seg < m - 1 && s >= segStart + segLen[seg] - 1e-9) { segStart += segLen[seg]; seg++; }
        const a = loop[seg], b = loop[(seg + 1) % m];
        const t = segLen[seg] > 0 ? (s - segStart) / segLen[seg] : 0;
        samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: b.x - a.x, dy: b.y - a.y, s });
    }
    // 朝向：0 右上(NE) 1 右下(SE) 2 左下(SE 镜像) 3 左上(NE 镜像)；近水平／近竖直（<0.3）不能定，沿用上一段
    const orient = (dx: number, dy: number): number | null => {
        const len = Math.hypot(dx, dy);
        if (len === 0 || Math.abs(dx) < 0.3 * len || Math.abs(dy) < 0.3 * len) return null;
        return dx > 0 ? (dy < 0 ? 0 : 1) : (dy > 0 ? 2 : 3);
    };
    const raw = samples.map((p) => orient(p.dx, p.dy));
    const f = raw.findIndex((v) => v !== null);
    let prev = raw[f] as number;
    const oo: number[] = new Array(n);
    for (let j = 0; j < n; j++) { const k = (f + j) % n; if (raw[k] !== null) prev = raw[k] as number; oo[k] = prev; }
    const KIND: Array<['NE' | 'SE', boolean]> = [['NE', false], ['SE', false], ['SE', true], ['NE', true]];
    let pieces: StockadeRingPiece[] = samples.map((p, k) => (oo[k] !== oo[(k - 1 + n) % n]
        ? { x: p.x, y: p.y, type: 'POST' as const, flipX: false }
        : { x: p.x, y: p.y, type: KIND[oo[k]][0], flipX: KIND[oo[k]][1] }));
    // 城门：左下（朝向 2）那一边，按 gateFrac 取位置；🔴 **门位固定占 3 个槽位**（1 扇门 + 左右各让 1 格），
    //   这样「件数」只由轮廓与件距决定，**与 baseSize 无关** —— 否则评估页（baseSize≈188）与游戏（=100）
    //   会因采样相位不同而差 1 件（实测 30/31/32 漂），两边永远对不齐。
    let first = -1, last = -1;
    for (let k = 0; k < n; k++) if (oo[k] === 2) { if (first < 0) first = k; last = k; }
    if (first >= 0) {
        const sg = samples[first].s + (samples[last].s - samples[first].s) * gateFrac;
        const pointAt = (s0: number) => {
            let acc = 0;
            for (let i = 0; i < m; i++) {
                if (s0 <= acc + segLen[i] + 1e-9) {
                    const t = segLen[i] > 0 ? (s0 - acc) / segLen[i] : 0;
                    const a = loop[i], b = loop[(i + 1) % m];
                    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
                }
                acc += segLen[i];
            }
            return { x: loop[0].x, y: loop[0].y };
        };
        // 门位：离 sg 最近的**墙件**槽位；若它左右第 2 件不是墙（是城垛/另一扇门），顺次往外挪，保证门两边接城墙
        let gi = -1;
        const isWallAt = (k: number) => { const p = pieces[((k % n) + n) % n]; return p.type === 'NE' || p.type === 'SE'; };
        let best = Infinity;
        for (let k = 0; k < n; k++) {
            if (!isWallAt(k)) continue;
            const d = Math.abs(samples[k].s - sg);
            if (d < best) {
                // 门占 k-1/k/k+1，门两侧最近的墙在 k-2 与 k+2
                let works = true;
                for (const off of [-2, 2]) if (!isWallAt(k + off)) works = false;
                if (works) { best = d; gi = k; }
            }
        }
        if (gi >= 0) {
            const gp = pointAt(samples[gi].s);
            const out: StockadeRingPiece[] = [];
            for (let k = 0; k < n; k++) {
                const off = ((k - gi) % n + n) % n;
                if (off === 0) { out.push({ x: gp.x, y: gp.y, type: 'GATE', flipX: false }); continue; }
                if (off === 1 || off === n - 1) continue;   // 门左右各让 1 格
                out.push(pieces[k]);
            }
            pieces = out;
        }
    }
    return pieces;
}

/** 曲线围栏（圆城／八角／椭圆）成品：轮廓 + 拼法一步到位。游戏与评估页都调这一个。 */
export function buildStockadeCurveRing(shape: 'round' | 'octagon' | 'oval', baseSize: number): StockadeRingPiece[] {
    const cfg = stockadeCurveShape(shape, baseSize);
    return corralPiecesFromLoop(cfg.loop, cfg.step, cfg.gateFrac);
}

/**
 * 🔴 **把一堆件按「环的顺序」串起来**（编辑器 / 校验器用）：从最左的件起，每次跳到最近的未用件；
 * 走不动了（最近件超过 `2.8 格`）或末件接不回首件 → 如实报「断口」，不假装成环。
 * ⚠️ 为什么不能直接用数组顺序：现成的直边形（正方/矩形/梯形）是**先推四角、再逐边走**，
 *    数组顺序并不是环序；早期校验器按数组比，把四个角垛误报成「两个城垛挨着」。
 */
export function ringOrderOf(pieces: StockadeRingPiece[], baseSize: number = 100): { order: number[]; breakAt: number | null } {
    const n = pieces.length;
    const maxLink = baseSize * 0.075 * 2.8;
    if (n < 2) return { order: pieces.map((_, i) => i), breakAt: null };
    let start = 0;
    for (let i = 1; i < n; i++) {
        if (pieces[i].x < pieces[start].x - 1e-6 || (Math.abs(pieces[i].x - pieces[start].x) < 1e-6 && pieces[i].y < pieces[start].y)) start = i;
    }
    const used = new Array(n).fill(false);
    const order = [start];
    used[start] = true;
    for (let k = 1; k < n; k++) {
        const cur = pieces[order[order.length - 1]];
        let best = -1, bd = Infinity;
        for (let i = 0; i < n; i++) {
            if (used[i]) continue;
            const d = Math.hypot(pieces[i].x - cur.x, pieces[i].y - cur.y);
            if (d < bd) { bd = d; best = i; }
        }
        if (best < 0 || bd > maxLink) return { order, breakAt: order[order.length - 1] };
        order.push(best);
        used[best] = true;
    }
    const a = pieces[order[n - 1]], b = pieces[order[0]];
    if (Math.hypot(a.x - b.x, a.y - b.y) > maxLink) return { order, breakAt: order[n - 1] };
    return { order, breakAt: null };
}

/**
 * 🔴 **围栏三件套标准 · 唯一校验器**（AGENTS.md §三之三）—— 游戏、围栏编辑器、验收脚本共用这一份。
 *
 * 规矩（主人 2026-10-01 定）：
 *   ① 只有三种件：**城门 GATE / 城垛 POST / 城墙 NE·SE**（城墙只有东北、东南两朝向，各含镜像）；
 *   ② **城墙朝向一变就必须有城垛**；
 *   ③ **城门两边必须接城墙**（一个围栏只开一扇门）；
 *   ④ **城垛两边必须接城墙**，两个城垛不许挨着。
 * 件表**按环的顺序**检查（`corralPiecesFromLoop` 直接是环序；其它来源先用 `ringOrderOf` 串环）。
 * 返回违规清单（空数组 = 合格）；`baseSize` 给了就顺手查「环没断」。
 */
export function validateStockadeRing(pieces: StockadeRingPiece[], baseSize?: number): string[] {
    const errs: string[] = [];
    const n = pieces.length;
    if (n < 4) return [`件数太少（${n} 件）：围栏至少要 4 件`];
    const { order, breakAt } = ringOrderOf(pieces, baseSize || 100);
    if (breakAt !== null) {
        const p = pieces[breakAt];
        errs.push(`环在 (${p.x.toFixed(0)},${p.y.toFixed(0)}) 处**断口**：找不到下一件（或末件接不回首件）——围栏要闭合成环`);
    }
    const isWall = (p: StockadeRingPiece | undefined) => !!p && (p.type === 'NE' || p.type === 'SE');
    const kind = (p: StockadeRingPiece | undefined) => (p ? `${p.type}${p.flipX ? '~' : ''}` : '（空）');
    const ringOk = breakAt === null && order.length === n;
    const at = (i: number) => pieces[order[((i % n) + n) % n]];
    const gates = pieces.filter((p) => p.type === 'GATE').length;
    if (gates !== 1) errs.push(`城门 ${gates} 扇：一个围栏**只许开一扇**（放在左下边正中）`);
    if (!ringOk) return errs;   // 环断了就不再报逐件相邻关系（否则全是假警），先把它接成环
    for (let i = 0; i < n; i++) {
        const a = at(i), b = at(i + 1), pa = at(i - 1);
        if (a.type === 'POST' && b.type === 'POST') errs.push(`第${i}、${i + 1} 件：**两个城垛挨着**（中间至少要隔一段城墙）`);
        if (a.type === 'POST' && !(isWall(pa) && isWall(b))) errs.push(`第${i}件：**城垛两边不全是城墙**（左${kind(pa)}/右${kind(b)}）`);
        if (a.type === 'GATE' && !(isWall(pa) && isWall(b))) errs.push(`第${i}件：**城门两边不全是城墙**（左${kind(pa)}/右${kind(b)}）`);
        if (isWall(a) && isWall(b) && kind(a) !== kind(b)) {
            errs.push(`第${i}→${i + 1} 件：**城墙朝向变了（${kind(a)}→${kind(b)}）中间没有城垛**`);
        }
    }
    return errs;
}

/** 🔴 编辑器「自动补垛」：把每一处**朝向变了却没城垛**的接头补上城垛。
 *  落法按游戏拼法：**朝向在「新方向的第一件」处变** → 就把那一件换成城垛（整数格点上，不插半格）。
 *  ⚠️ 必须**按环序**走（`ringOrderOf`）：现成的直边形是「先四角、再逐边」的数组顺序，
 *     按数组走会把角垛旁边的墙也换成垛 → 补出「两个城垛挨着」。
 *  返回**新数组**（输入不改）；补完后仍不合规的，交给 `validateStockadeRing` 报。 */
export function autoInsertStockadePosts(pieces: StockadeRingPiece[]): StockadeRingPiece[] {
    const out = pieces.map((p) => ({ ...p }));
    const n = out.length;
    if (n < 3) return out;
    const { order, breakAt } = ringOrderOf(out, 100);
    if (breakAt !== null || order.length !== n) return out;   // 环断了先别补（补了也是错的）
    const isWall = (p: StockadeRingPiece) => p.type === 'NE' || p.type === 'SE';
    const kind = (p: StockadeRingPiece) => `${p.type}${p.flipX ? '~' : ''}`;
    const changes: number[] = [];
    for (let k = 0; k < n; k++) {
        const a = out[order[k]], b = out[order[(k + 1) % n]];
        if (isWall(a) && isWall(b) && kind(a) !== kind(b)) changes.push(order[(k + 1) % n]);
    }
    for (const i of changes) {
        out[i].type = 'POST';   // 新方向的第一件 → 城垛
        out[i].flipX = false;
    }
    return out;
}

/** 🔴 [2026-10-01 主人定案] 16 大建筑风格与 4 套城寨栅栏材质历史军事分配表（4 × 4）
 *  - HARDWOOD（硬木粗桩）：东亚 (ASIA) / 印度 (INDI) / 波斯 (PERSIAN) / 中东 (ORIE)
 *  - DARK（原木尖桩）：东北欧 (SLAV) / 西欧 (WEST) / 普鲁 (PURU) / 色雷斯 (THRACIAN)
 *  - ARCHAIC（横木平切）：地中海 (MEDI) / 希腊 (GREEK) / 东南欧 (EAST) / 中亚 (CEAS)
 *  - FENCE（密编荆篱）：中美 (MESO) / 安第斯 (ANDE) / 非洲 (AFRI) / 东南亚 (SEAS)
 */
export const STYLE_TO_STOCKADE_FENCE: Record<string, StockadeFenceKey> = {
    // ① 硬木粗桩（HARDWOOD）
    ASIA: 'HARDWOOD',
    INDI: 'HARDWOOD',
    PERSIAN: 'HARDWOOD',
    ORIE: 'HARDWOOD',
    // ② 原木尖桩（DARK）
    SLAV: 'DARK',
    WEST: 'DARK',
    PURU: 'DARK',
    THRACIAN: 'DARK',
    // ③ 横木平切（ARCHAIC）
    MEDI: 'ARCHAIC',
    GREEK: 'ARCHAIC',
    EAST: 'ARCHAIC',
    CEAS: 'ARCHAIC',
    // ④ 密编荆篱（FENCE）
    MESO: 'FENCE',
    ANDE: 'FENCE',
    AFRI: 'FENCE',
    SEAS: 'FENCE',
};

export interface StockadeFenceSet {
    key: StockadeFenceKey;
    label: string;
    anchors: Record<string, { pctX: number; pctY: number; widthFactor: number; path: string }>;
}

export const STOCKADE_FENCE_SETS: Record<StockadeFenceKey, StockadeFenceSet> = {
    HARDWOOD: {
        key: 'HARDWOOD',
        label: '硬木粗桩',
        anchors: DE_PALISADE_ANCHORS,
    },
    DARK: {
        key: 'DARK',
        label: '原木尖桩',
        anchors: DE_DARK_PALISADE_ANCHORS,
    },
    ARCHAIC: {
        key: 'ARCHAIC',
        label: '横木平切',
        anchors: DE_ARCHAIC_PALISADE_ANCHORS,
    },
    FENCE: {
        key: 'FENCE',
        label: '密编荆篱',
        anchors: DE_FENCE_ANCHORS,
    },
};

export function getStockadeFenceSetByStyle(style: string | undefined | null): StockadeFenceSet {
    const key: StockadeFenceKey = (style && STYLE_TO_STOCKADE_FENCE[style]) ? STYLE_TO_STOCKADE_FENCE[style] : 'HARDWOOD';
    return STOCKADE_FENCE_SETS[key];
}

export function normalizeStockadeCorner(pieces: Array<{ type: string }>, fenceKey: StockadeFenceKey): void {
    if (fenceKey !== 'FENCE') {
        for (const p of pieces) {
            if (p.type === 'CORNER') p.type = 'POST';
        }
    }
}


// 中城石墙（STONE_WALL）部件锚点：按建筑风格取各自素材与锚点（2026-08-27 从 DE _meta.json 提取，pct = anchor/box×100）
// 每个风格用自己风格的城墙/城门素材（非统一 ASIA），锚点各风格独立（否则错位）
export const DE_STONE_ANCHORS_BY_STYLE: Record<string, Record<string, { pctX: number; pctY: number; widthFactor: number; path: string }>> = {
    AFRI: {
        NE: { pctX: 58.9, pctY: 75.5, widthFactor: 0.16, path: '/SUCAI_BUILDING/AFRI_WALL_STONE_NE/preview.png' },
        SE: { pctX: 57.5, pctY: 76.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/AFRI_WALL_STONE_SE/preview.png' },
        POST: { pctX: 65.1, pctY: 82.4, widthFactor: 0.18, path: '/SUCAI_BUILDING/AFRI_WALL_POST/preview.png' },
        GATE: { pctX: 58.1, pctY: 73.2, widthFactor: 0.34, path: '/SUCAI_BUILDING/AFRI_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 72.2, pctY: 87.9, widthFactor: 0.26, path: '/SUCAI_BUILDING/AFRI_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 72.7, pctY: 89.4, widthFactor: 0.26, path: '/SUCAI_BUILDING/AFRI_TOWER_AGE4/preview.png' },
    },
    ANDE: {
        NE: { pctX: 60.2, pctY: 78.5, widthFactor: 0.16, path: '/SUCAI_BUILDING/ANDE_WALL_STONE_NE/preview.png' },
        SE: { pctX: 57.3, pctY: 75.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/ANDE_WALL_STONE_SE/preview.png' },
        POST: { pctX: 64.9, pctY: 85.2, widthFactor: 0.18, path: '/SUCAI_BUILDING/ANDE_WALL_POST/preview.png' },
        GATE: { pctX: 57.7, pctY: 75.0, widthFactor: 0.34, path: '/SUCAI_BUILDING/ANDE_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 65.3, pctY: 85.5, widthFactor: 0.26, path: '/SUCAI_BUILDING/ANDE_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 66.0, pctY: 86.6, widthFactor: 0.26, path: '/SUCAI_BUILDING/ANDE_TOWER_AGE4/preview.png' },
    },
    ASIA: {
        NE: { pctX: 60.6, pctY: 78.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/ASIA_WALL_STONE_NE/preview.png' },
        SE: { pctX: 61.0, pctY: 78.5, widthFactor: 0.16, path: '/SUCAI_BUILDING/ASIA_WALL_STONE_SE/preview.png' },
        POST: { pctX: 66.9, pctY: 84.4, widthFactor: 0.18, path: '/SUCAI_BUILDING/ASIA_WALL_POST/preview.png' },
        GATE: { pctX: 58.8, pctY: 74.3, widthFactor: 0.34, path: '/SUCAI_BUILDING/ASIA_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 66.7, pctY: 88.1, widthFactor: 0.26, path: '/SUCAI_BUILDING/ASIA_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 66.1, pctY: 87.1, widthFactor: 0.26, path: '/SUCAI_BUILDING/ASIA_TOWER_AGE4/preview.png' },
    },
    CEAS: {
        // 🔴 [2026-09-11 主人令「全部修复」] NE/SE 0.16 → 0.20：真机量「墙身区透背景」由 4px 归 0（垛口以上不计）。
        NE: { pctX: 60.0, pctY: 77.6, widthFactor: 0.20, path: '/SUCAI_BUILDING/CEAS_WALL_STONE_NE/preview.png' },
        SE: { pctX: 59.6, pctY: 77.6, widthFactor: 0.20, path: '/SUCAI_BUILDING/CEAS_WALL_STONE_SE/preview.png' },
        POST: { pctX: 68.6, pctY: 85.5, widthFactor: 0.18, path: '/SUCAI_BUILDING/CEAS_WALL_POST/preview.png' },
        GATE: { pctX: 59.6, pctY: 75.1, widthFactor: 0.34, path: '/SUCAI_BUILDING/CEAS_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 72.3, pctY: 87.9, widthFactor: 0.26, path: '/SUCAI_BUILDING/CEAS_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 72.9, pctY: 89.2, widthFactor: 0.26, path: '/SUCAI_BUILDING/CEAS_TOWER_AGE4/preview.png' },
    },
    EAST: {
        NE: { pctX: 60.7, pctY: 77.2, widthFactor: 0.16, path: '/SUCAI_BUILDING/EAST_WALL_STONE_NE/preview.png' },
        SE: { pctX: 60.2, pctY: 78.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/EAST_WALL_STONE_SE/preview.png' },
        POST: { pctX: 68.5, pctY: 86.0, widthFactor: 0.18, path: '/SUCAI_BUILDING/EAST_WALL_POST/preview.png' },
        GATE: { pctX: 59.9, pctY: 75.6, widthFactor: 0.34, path: '/SUCAI_BUILDING/EAST_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 71.2, pctY: 88.5, widthFactor: 0.26, path: '/SUCAI_BUILDING/EAST_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 68.5, pctY: 88.1, widthFactor: 0.26, path: '/SUCAI_BUILDING/EAST_TOWER_AGE4/preview.png' },
    },
    INDI: {
        NE: { pctX: 60.7, pctY: 78.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/INDI_WALL_STONE_NE/preview.png' },
        SE: { pctX: 60.9, pctY: 78.2, widthFactor: 0.16, path: '/SUCAI_BUILDING/INDI_WALL_STONE_SE/preview.png' },
        POST: { pctX: 67.8, pctY: 84.6, widthFactor: 0.18, path: '/SUCAI_BUILDING/INDI_WALL_POST/preview.png' },
        GATE: { pctX: 59.1, pctY: 74.3, widthFactor: 0.34, path: '/SUCAI_BUILDING/INDI_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 71.2, pctY: 89.1, widthFactor: 0.26, path: '/SUCAI_BUILDING/INDI_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 73.6, pctY: 89.1, widthFactor: 0.26, path: '/SUCAI_BUILDING/INDI_TOWER_AGE4/preview.png' },
    },
    MEDI: {
        NE: { pctX: 62.1, pctY: 79.8, widthFactor: 0.16, path: '/SUCAI_BUILDING/MEDI_WALL_STONE_NE/preview.png' },
        SE: { pctX: 62.1, pctY: 79.8, widthFactor: 0.16, path: '/SUCAI_BUILDING/MEDI_WALL_STONE_SE/preview.png' },
        POST: { pctX: 69.7, pctY: 85.5, widthFactor: 0.18, path: '/SUCAI_BUILDING/MEDI_WALL_POST/preview.png' },
        GATE: { pctX: 59.8, pctY: 75.4, widthFactor: 0.34, path: '/SUCAI_BUILDING/MEDI_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 70.2, pctY: 87.0, widthFactor: 0.26, path: '/SUCAI_BUILDING/MEDI_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 72.0, pctY: 87.5, widthFactor: 0.26, path: '/SUCAI_BUILDING/MEDI_TOWER_AGE4/preview.png' },
    },
    MESO: {
        NE: { pctX: 59.0, pctY: 76.3, widthFactor: 0.16, path: '/SUCAI_BUILDING/MESO_WALL_STONE_NE/preview.png' },
        SE: { pctX: 59.8, pctY: 76.5, widthFactor: 0.16, path: '/SUCAI_BUILDING/MESO_WALL_STONE_SE/preview.png' },
        POST: { pctX: 67.7, pctY: 84.8, widthFactor: 0.18, path: '/SUCAI_BUILDING/MESO_WALL_POST/preview.png' },
        GATE: { pctX: 59.5, pctY: 75.1, widthFactor: 0.34, path: '/SUCAI_BUILDING/MESO_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 69.2, pctY: 86.6, widthFactor: 0.26, path: '/SUCAI_BUILDING/MESO_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 66.7, pctY: 84.1, widthFactor: 0.26, path: '/SUCAI_BUILDING/MESO_TOWER_AGE4/preview.png' },
    },
    ORIE: {
        NE: { pctX: 61.0, pctY: 78.5, widthFactor: 0.16, path: '/SUCAI_BUILDING/ORIE_WALL_STONE_NE/preview.png' },
        SE: { pctX: 62.6, pctY: 77.7, widthFactor: 0.16, path: '/SUCAI_BUILDING/ORIE_WALL_STONE_SE/preview.png' },
        POST: { pctX: 69.9, pctY: 86.4, widthFactor: 0.18, path: '/SUCAI_BUILDING/ORIE_WALL_POST/preview.png' },
        GATE: { pctX: 60.5, pctY: 75.4, widthFactor: 0.34, path: '/SUCAI_BUILDING/ORIE_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 69.1, pctY: 87.1, widthFactor: 0.26, path: '/SUCAI_BUILDING/ORIE_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 66.7, pctY: 90.3, widthFactor: 0.26, path: '/SUCAI_BUILDING/ORIE_TOWER_AGE4/preview.png' },
    },
    PERSIAN: {
        // 🔴 [2026-09-11 主人令「全部修复」] NE/SE 0.16 → 0.19：真机量「墙身区透背景」由 8px 归 0。
        NE: { pctX: 63.3, pctY: 79.7, widthFactor: 0.19, path: '/SUCAI_BUILDING/PERSIAN_WALL_STONE_NE/preview.png' },
        SE: { pctX: 60.8, pctY: 80.3, widthFactor: 0.19, path: '/SUCAI_BUILDING/PERSIAN_WALL_STONE_SE/preview.png' },
        POST: { pctX: 66.7, pctY: 84.4, widthFactor: 0.18, path: '/SUCAI_BUILDING/PERSIAN_WALL_POST/preview.png' },
        GATE: { pctX: 58.9, pctY: 74.6, widthFactor: 0.34, path: '/SUCAI_BUILDING/PERSIAN_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 70.2, pctY: 86.4, widthFactor: 0.26, path: '/SUCAI_BUILDING/PERSIAN_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 69.0, pctY: 86.8, widthFactor: 0.26, path: '/SUCAI_BUILDING/PERSIAN_TOWER_AGE4/preview.png' },
    },
    PURU: {
        NE: { pctX: 60.9, pctY: 77.2, widthFactor: 0.16, path: '/SUCAI_BUILDING/PURU_WALL_STONE_NE/preview.png' },
        SE: { pctX: 60.4, pctY: 77.2, widthFactor: 0.16, path: '/SUCAI_BUILDING/PURU_WALL_STONE_SE/preview.png' },
        POST: { pctX: 68.3, pctY: 86.2, widthFactor: 0.18, path: '/SUCAI_BUILDING/PURU_WALL_POST/preview.png' },
        GATE: { pctX: 57.9, pctY: 76.2, widthFactor: 0.34, path: '/SUCAI_BUILDING/PURU_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 69.6, pctY: 85.5, widthFactor: 0.26, path: '/SUCAI_BUILDING/PURU_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 72.7, pctY: 88.1, widthFactor: 0.26, path: '/SUCAI_BUILDING/PURU_TOWER_AGE4/preview.png' },
    },
    SEAS: {
        NE: { pctX: 56.1, pctY: 77.4, widthFactor: 0.16, path: '/SUCAI_BUILDING/SEAS_WALL_STONE_NE/preview.png' },
        SE: { pctX: 57.6, pctY: 76.6, widthFactor: 0.16, path: '/SUCAI_BUILDING/SEAS_WALL_STONE_SE/preview.png' },
        POST: { pctX: 67.3, pctY: 85.9, widthFactor: 0.18, path: '/SUCAI_BUILDING/SEAS_WALL_POST/preview.png' },
        GATE: { pctX: 59.0, pctY: 76.4, widthFactor: 0.34, path: '/SUCAI_BUILDING/SEAS_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 68.0, pctY: 87.3, widthFactor: 0.26, path: '/SUCAI_BUILDING/SEAS_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 69.8, pctY: 88.7, widthFactor: 0.26, path: '/SUCAI_BUILDING/SEAS_TOWER_AGE4/preview.png' },
    },
    SLAV: {
        NE: { pctX: 62.8, pctY: 80.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/SLAV_WALL_STONE_NE/preview.png' },
        SE: { pctX: 62.6, pctY: 80.9, widthFactor: 0.16, path: '/SUCAI_BUILDING/SLAV_WALL_STONE_SE/preview.png' },
        POST: { pctX: 67.5, pctY: 86.7, widthFactor: 0.18, path: '/SUCAI_BUILDING/SLAV_WALL_POST/preview.png' },
        GATE: { pctX: 59.7, pctY: 77.3, widthFactor: 0.34, path: '/SUCAI_BUILDING/SLAV_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 65.4, pctY: 89.4, widthFactor: 0.26, path: '/SUCAI_BUILDING/SLAV_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 68.5, pctY: 89.0, widthFactor: 0.26, path: '/SUCAI_BUILDING/SLAV_TOWER_AGE4/preview.png' },
    },
    WEST: {
        NE: { pctX: 60.7, pctY: 78.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/WEST_WALL_STONE_NE/preview.png' },
        SE: { pctX: 60.6, pctY: 78.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/WEST_WALL_STONE_SE/preview.png' },
        POST: { pctX: 68.1, pctY: 85.7, widthFactor: 0.18, path: '/SUCAI_BUILDING/WEST_WALL_POST/preview.png' },
        GATE: { pctX: 59.9, pctY: 75.6, widthFactor: 0.34, path: '/SUCAI_BUILDING/WEST_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 70.8, pctY: 87.5, widthFactor: 0.26, path: '/SUCAI_BUILDING/WEST_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 69.6, pctY: 87.7, widthFactor: 0.26, path: '/SUCAI_BUILDING/WEST_TOWER_AGE4/preview.png' },
    },
    GREEK: {
        // 🔴 [2026-09-11 主人令「全部修复」] 希腊石墙 NE/SE 0.16 → 0.20：
        //    希腊素材的画身只占自己框的 ~73%（东亚 77%），同样 0.16 下墙片偏小，按 0.075 步长平铺时
        //    墙身会露出背景（真机量：33px 缝 → 0.20 时 7px、且肉眼已是连续墙）。锚点数值未动。
        NE: { pctX: 60.6, pctY: 78.8, widthFactor: 0.20, path: '/SUCAI_BUILDING/GREEK_WALL_STONE_NE/preview.png' },
        SE: { pctX: 60.0, pctY: 78.1, widthFactor: 0.20, path: '/SUCAI_BUILDING/GREEK_WALL_STONE_SE/preview.png' },
        POST: { pctX: 66.7, pctY: 84.4, widthFactor: 0.18, path: '/SUCAI_BUILDING/GREEK_WALL_POST/preview.png' },
        GATE: { pctX: 59.7, pctY: 74.1, widthFactor: 0.34, path: '/SUCAI_BUILDING/GREEK_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 68.4, pctY: 86.4, widthFactor: 0.26, path: '/SUCAI_BUILDING/GREEK_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 69.0, pctY: 86.8, widthFactor: 0.26, path: '/SUCAI_BUILDING/GREEK_TOWER_AGE4/preview.png' },
    },
    THRACIAN: {
        NE: { pctX: 55.8, pctY: 72.9, widthFactor: 0.16, path: '/SUCAI_BUILDING/THRACIAN_WALL_STONE_NE/preview.png' },
        SE: { pctX: 57.4, pctY: 74.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/THRACIAN_WALL_STONE_SE/preview.png' },
        POST: { pctX: 64.1, pctY: 83.3, widthFactor: 0.18, path: '/SUCAI_BUILDING/THRACIAN_WALL_POST/preview.png' },
        GATE: { pctX: 57.2, pctY: 73.3, widthFactor: 0.34, path: '/SUCAI_BUILDING/THRACIAN_GATE_STONE_NE/preview.png' },
        TOWER_AGE3: { pctX: 70.8, pctY: 87.3, widthFactor: 0.26, path: '/SUCAI_BUILDING/THRACIAN_TOWER_AGE3/preview.png' },
        TOWER_AGE4: { pctX: 71.2, pctY: 87.7, widthFactor: 0.26, path: '/SUCAI_BUILDING/THRACIAN_TOWER_AGE4/preview.png' },
    },
};

// 大城帝国时代加固墙（垛墙）锚点：2026-08-27 主人定「大城城墙用垛墙」，素材 WALL_FORTIFIED_* / GATE_FORTIFIED_NE
// 锚点从 _meta.json 提取（全文化标准关闭状态双塔大城门 closed + corner，widthFactor: 0.34，各风格独立锚点）
export const DE_FORTIFIED_ANCHORS_BY_STYLE: Record<string, Record<string, { pctX: number; pctY: number; widthFactor: number; path: string }>> = {
    AFRI: {
        NE: { pctX: 62.4, pctY: 79.5, widthFactor: 0.16, path: '/SUCAI_BUILDING/AFRI_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 62.1, pctY: 79.5, widthFactor: 0.16, path: '/SUCAI_BUILDING/AFRI_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 66.7, pctY: 85.1, widthFactor: 0.20, path: '/SUCAI_BUILDING/AFRI_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 59.5, pctY: 75.7, widthFactor: 0.34, path: '/SUCAI_BUILDING/AFRI_GATE_FORTIFIED_NE/preview.png' },
    },
    ANDE: {
        NE: { pctX: 59.4, pctY: 77.2, widthFactor: 0.16, path: '/SUCAI_BUILDING/ANDE_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 59.0, pctY: 78.3, widthFactor: 0.16, path: '/SUCAI_BUILDING/ANDE_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 65.9, pctY: 85.1, widthFactor: 0.20, path: '/SUCAI_BUILDING/ANDE_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 59.1, pctY: 75.6, widthFactor: 0.34, path: '/SUCAI_BUILDING/ANDE_GATE_FORTIFIED_NE/preview.png' },
    },
    ASIA: {
        NE: { pctX: 60.0, pctY: 77.9, widthFactor: 0.16, path: '/SUCAI_BUILDING/ASIA_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 59.5, pctY: 77.9, widthFactor: 0.16, path: '/SUCAI_BUILDING/ASIA_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 66.7, pctY: 85.4, widthFactor: 0.20, path: '/SUCAI_BUILDING/ASIA_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 60.1, pctY: 75.7, widthFactor: 0.34, path: '/SUCAI_BUILDING/ASIA_GATE_FORTIFIED_NE/preview.png' },
    },
    CEAS: {
        NE: { pctX: 63.4, pctY: 81.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/CEAS_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 62.8, pctY: 81.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/CEAS_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 68.3, pctY: 85.4, widthFactor: 0.20, path: '/SUCAI_BUILDING/CEAS_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 60.1, pctY: 76.3, widthFactor: 0.34, path: '/SUCAI_BUILDING/CEAS_GATE_FORTIFIED_NE/preview.png' },
    },
    EAST: {
        NE: { pctX: 60.9, pctY: 77.7, widthFactor: 0.16, path: '/SUCAI_BUILDING/EAST_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 61.7, pctY: 77.7, widthFactor: 0.16, path: '/SUCAI_BUILDING/EAST_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 67.4, pctY: 84.3, widthFactor: 0.20, path: '/SUCAI_BUILDING/EAST_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 60.0, pctY: 76.2, widthFactor: 0.34, path: '/SUCAI_BUILDING/EAST_GATE_FORTIFIED_NE/preview.png' },
    },
    GREEK: {
        // 🔴 [2026-09-11 主人令「全部修复」] 这三行原是**美地（MEDI）的占位值**（69.8/85.4 恰是 MEDI 的值），
        //    与希腊自家素材热点不符（自家应为 61.8/78.8、61.8/79.4、64.3/82.6，POST 差 5.5%）。
        //    现按自家素材 _meta.json 的 anchor/box 还原。真机量：改前改后大城墙身缝均为 0px，无回退。
        NE: { pctX: 61.8, pctY: 78.8, widthFactor: 0.16, path: '/SUCAI_BUILDING/GREEK_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 61.8, pctY: 79.4, widthFactor: 0.16, path: '/SUCAI_BUILDING/GREEK_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 64.3, pctY: 82.6, widthFactor: 0.20, path: '/SUCAI_BUILDING/GREEK_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 58.9, pctY: 73.7, widthFactor: 0.34, path: '/SUCAI_BUILDING/GREEK_GATE_FORTIFIED_NE/preview.png' },
    },
    INDI: {
        NE: { pctX: 60.0, pctY: 79.7, widthFactor: 0.16, path: '/SUCAI_BUILDING/INDI_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 60.7, pctY: 79.7, widthFactor: 0.16, path: '/SUCAI_BUILDING/INDI_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 65.8, pctY: 84.4, widthFactor: 0.19, path: '/SUCAI_BUILDING/INDI_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 58.4, pctY: 75.2, widthFactor: 0.34, path: '/SUCAI_BUILDING/INDI_GATE_FORTIFIED_NE/preview.png' },
    },
    MEDI: {
        NE: { pctX: 61.8, pctY: 76.9, widthFactor: 0.16, path: '/SUCAI_BUILDING/MEDI_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 61.5, pctY: 78.7, widthFactor: 0.16, path: '/SUCAI_BUILDING/MEDI_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 69.8, pctY: 85.4, widthFactor: 0.20, path: '/SUCAI_BUILDING/MEDI_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 60.8, pctY: 76.1, widthFactor: 0.34, path: '/SUCAI_BUILDING/MEDI_GATE_FORTIFIED_NE/preview.png' },
    },
    MESO: {
        NE: { pctX: 58.9, pctY: 78.9, widthFactor: 0.16, path: '/SUCAI_BUILDING/MESO_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 58.1, pctY: 78.9, widthFactor: 0.16, path: '/SUCAI_BUILDING/MESO_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 68.3, pctY: 85.4, widthFactor: 0.20, path: '/SUCAI_BUILDING/MESO_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 59.4, pctY: 76.0, widthFactor: 0.34, path: '/SUCAI_BUILDING/MESO_GATE_FORTIFIED_NE/preview.png' },
    },
    ORIE: {
        NE: { pctX: 61.9, pctY: 78.4, widthFactor: 0.16, path: '/SUCAI_BUILDING/ORIE_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 61.5, pctY: 78.8, widthFactor: 0.16, path: '/SUCAI_BUILDING/ORIE_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 69.2, pctY: 84.4, widthFactor: 0.19, path: '/SUCAI_BUILDING/ORIE_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 60.1, pctY: 75.4, widthFactor: 0.34, path: '/SUCAI_BUILDING/ORIE_GATE_FORTIFIED_NE/preview.png' },
    },
    PERSIAN: {
        NE: { pctX: 63.6, pctY: 80.5, widthFactor: 0.16, path: '/SUCAI_BUILDING/PERSIAN_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 64.1, pctY: 81.1, widthFactor: 0.16, path: '/SUCAI_BUILDING/PERSIAN_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 68.2, pctY: 83.7, widthFactor: 0.20, path: '/SUCAI_BUILDING/PERSIAN_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 59.4, pctY: 74.2, widthFactor: 0.34, path: '/SUCAI_BUILDING/PERSIAN_GATE_FORTIFIED_NE/preview.png' },
    },
    PURU: {
        NE: { pctX: 59.2, pctY: 78.3, widthFactor: 0.16, path: '/SUCAI_BUILDING/PURU_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 60.3, pctY: 79.3, widthFactor: 0.16, path: '/SUCAI_BUILDING/PURU_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 65.9, pctY: 85.1, widthFactor: 0.20, path: '/SUCAI_BUILDING/PURU_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 58.0, pctY: 75.5, widthFactor: 0.34, path: '/SUCAI_BUILDING/PURU_GATE_FORTIFIED_NE/preview.png' },
    },
    SEAS: {
        NE: { pctX: 60.0, pctY: 81.2, widthFactor: 0.16, path: '/SUCAI_BUILDING/SEAS_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 59.7, pctY: 80.6, widthFactor: 0.16, path: '/SUCAI_BUILDING/SEAS_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 67.4, pctY: 86.8, widthFactor: 0.20, path: '/SUCAI_BUILDING/SEAS_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 59.7, pctY: 77.5, widthFactor: 0.34, path: '/SUCAI_BUILDING/SEAS_GATE_FORTIFIED_NE/preview.png' },
    },
    SLAV: {
        NE: { pctX: 65.0, pctY: 81.6, widthFactor: 0.16, path: '/SUCAI_BUILDING/SLAV_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 64.2, pctY: 81.6, widthFactor: 0.16, path: '/SUCAI_BUILDING/SLAV_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 66.0, pctY: 86.9, widthFactor: 0.21, path: '/SUCAI_BUILDING/SLAV_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 59.3, pctY: 79.2, widthFactor: 0.34, path: '/SUCAI_BUILDING/SLAV_GATE_FORTIFIED_NE/preview.png' },
    },
    THRACIAN: {
        // 🔴 [2026-09-11 主人令「全部修复」] 同希腊：这三行原是美地（MEDI）占位值，
        //    按色雷斯自家素材 _meta.json 还原（自家应为 61.8/80.6、60.6/81.3、67.4/84.8）。
        NE: { pctX: 61.8, pctY: 80.6, widthFactor: 0.16, path: '/SUCAI_BUILDING/THRACIAN_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 60.6, pctY: 81.3, widthFactor: 0.16, path: '/SUCAI_BUILDING/THRACIAN_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 67.4, pctY: 84.8, widthFactor: 0.20, path: '/SUCAI_BUILDING/THRACIAN_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 58.5, pctY: 75.2, widthFactor: 0.34, path: '/SUCAI_BUILDING/THRACIAN_GATE_FORTIFIED_NE/preview.png' },
    },
    WEST: {
        NE: { pctX: 62.7, pctY: 79.0, widthFactor: 0.16, path: '/SUCAI_BUILDING/WEST_WALL_FORTIFIED_NE/preview.png' },
        SE: { pctX: 62.6, pctY: 80.5, widthFactor: 0.16, path: '/SUCAI_BUILDING/WEST_WALL_FORTIFIED_SE/preview.png' },
        POST: { pctX: 69.8, pctY: 85.1, widthFactor: 0.20, path: '/SUCAI_BUILDING/WEST_WALL_FORTIFIED_POST/preview.png' },
        GATE: { pctX: 60.4, pctY: 75.9, widthFactor: 0.34, path: '/SUCAI_BUILDING/WEST_GATE_FORTIFIED_NE/preview.png' },
    },
};

/** 小城是否套用石墙（中城同款）：默认硬木栅栏；中原/北方/江南/希腊/中东文明古国套石墙。
 *  🔴 [2026-09-03 主人] 中原/北方/江南；[2026-09-11 主人] 加希腊。
 *  🔴 [2026-09-12 主人「中东的小城，也应该是石墙，对吧」→ 对，史实如此] 加**中东近东（ORIE 建筑风格）**：
 *     黎凡特/两河的大城，城防自青铜时代起就是**石构或土坯砖**（耶路撒冷/哈措尔/美吉多的巨石城墙与护坡、
 *     巴比伦的砖石城墙、推罗那座高约 45 m 的海岛石墙）；**木栅栏**只属于村落围栏、营地与行军木栅，
 *     本地区木材稀缺，主城防不可能用栅栏。
 *  ⚠️ 判据按**建筑风格**、不逐个 region 列名单：凡解析到 ORIE / PERSIAN 的 region 一律套石墙，
 *     以后新增中东/波斯 region 不必再来改这里（耶路撒冷 HEBREWS、阿尔贝拉 ASSYRIAN、波斯波利斯 ACHAEMENIDS
 *     全靠这条自动覆盖）。
 *  🔴 [2026-09-12 主人「好的」] 再加**波斯（PERSIAN 建筑风格）**：波斯本土城市同样是砖石城防
 *     （波斯波利斯/苏萨的砖石台地与城墙），木栅栏同样不对。 */
import { REGION_TO_DE_STYLE } from './cityDeStyle';
export function shouldUseStoneWall(region: string | undefined | null): boolean {
    if (region === 'CENTRAL' || region === 'NORTH' || region === 'JIANGNAN' || region === 'GREEK') return true;
    if (!region) return false;
    const style = (REGION_TO_DE_STYLE as Record<string, string>)[region];
    return style === 'ORIE' || style === 'PERSIAN';
}
