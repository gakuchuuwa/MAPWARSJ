// 城墙锚点字典 + 围墙判断（共享模块）：主游戏 TerritorySystem.ts 与测试页 _citytest.html 都 import 此文件。
// 改一处两边自动同步 —— 🔴 [2026-09-11 主人定「根治」，杜绝两处复制漂移]。

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
        pctX: 58.6,
        pctY: 75.9,
        widthFactor: 0.34,
        path: '/SUCAI_BUILDING/DARK_GATE_PALISADE_NE/preview.png',
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
