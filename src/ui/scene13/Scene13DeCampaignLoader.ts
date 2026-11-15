/**
 * Scene13DeCampaignLoader — 236 张 AoE2 DE 战役地图加载与方式二（原样城防/关隘/城墙/城门/箭塔/城堡/建筑）落盘器
 *
 * 核心职责：
 *   1. 将 DE 剧情地图 JSON（`/de-maps/campaign/${id}.json`）的菱形瓦片网格（W × H）无损双射到
 *      `Scene13GroundLayerGL` 的屏幕矩形网格（N × N），使 WebGL 水体、岸线浪花、草沙林泥过渡、
 *      高程光影与 DE 原始物件 100% 像素级对齐（1:1 原生 96×48 比例）。
 *   2. 方式二（主人定「所有的建筑归属为防守方」）：
 *      将 DE 地图里预设好的城墙、木栅栏、城门、箭塔、火炮塔、城堡、城镇中心、兵营、靶场、马厩、
 *      攻城武器厂、铁匠铺、市场、修道院、大学、奇观、民居、蒙古包、行军帐、哨站、桥梁、树木、岩石、悬崖
 *      按精确坐标与朝向原样搬进 `Scene13WarLayer`：
 *        - 城墙 / 木栅栏 / 城门 → `wallGates`（f = 1，带碰撞阻挡与破墙/破门坍塌链）
 *        - 箭塔 / 火炮塔 / 哨塔 → `arrowTowers` + `cityBuildings` + `defBuildings`（f = 1，自动索敌射箭）
 *        - 城堡 → `castleTowers` + `cityBuildings` + `defBuildings`（f = 1，多箭齐发 + 重点打击目标）
 *        - 其余建筑 → 守方（f = 1，`trackCityBuilding`）或攻方营区内的营帐（f = 0，`registerDefBuilding`）
 *        - 桥梁 → 地面层装饰（`z: -5`，无碰撞阻挡、不可摧毁）
 */

import type { Scene13GroundLayerGL } from './Scene13GroundLayerGL';
import { WALL_GATE_STATS } from './Scene13UnitTables';
import type { DecorSprite } from './Scene13Types';
import type { Scene13WarLayer } from '../Scene13WarLayer';

export interface DeCampaignSpriteMeta {
    w: number;
    h: number;
    ax: number;
    ay: number;
    unit?: number;
    name?: string;
    graphic?: number;
    frames5?: string[];
}

let spriteMetaPromise: Promise<Record<string, DeCampaignSpriteMeta>> | null = null;
let spriteMetaCache: Record<string, DeCampaignSpriteMeta> | null = null;

/** 异步加载并缓存 `/de-maps/campaign/sprites.json` */
export function ensureDeCampaignSpriteMeta(): Promise<Record<string, DeCampaignSpriteMeta>> {
    if (spriteMetaCache) return Promise.resolve(spriteMetaCache);
    if (!spriteMetaPromise) {
        spriteMetaPromise = fetch('/de-maps/campaign/sprites.json?v=2')
            .then((r) => (r.ok ? r.json() : {}))
            .then((json) => {
                spriteMetaCache = json || {};
                return spriteMetaCache!;
            })
            .catch(() => {
                spriteMetaCache = {};
                return spriteMetaCache!;
            });
    }
    return spriteMetaPromise;
}

/** 24 个中立（player: 0）跨护城河/河道实体桥精灵精确锚点表，常规战斗无需拉取整张 2MB sprites.json */
export const GAIA_BRIDGE_SPRITE_META: Readonly<Record<string, DeCampaignSpriteMeta>> = {
    // ── Medieval Cobblestone Arch Bridge (605..610) ──
    d7aca08e45c2: { w: 260, h: 172, ax: 130, ay: 70, unit: 605, name: 'BGAA' },
    '525e31115a05': { w: 264, h: 172, ax: 138, ay: 70, unit: 606, name: 'BGAB' },
    '5f12491a00d3': { w: 244, h: 136, ax: 118, ay: 70, unit: 607, name: 'BGAC' },
    de9f767564ef: { w: 240, h: 172, ax: 130, ay: 70, unit: 608, name: 'BGBA' },
    a23ab1014247: { w: 260, h: 172, ax: 146, ay: 70, unit: 609, name: 'BGBB' },
    e0beda99ad86: { w: 260, h: 136, ax: 146, ay: 70, unit: 610, name: 'BGBC' },
    // ── Wooden Pile Plank Bridge (904..909) ──
    bb24b7f339f8: { w: 116, h: 80, ax: 56, ay: 48, unit: 904, name: 'BGAA' },
    f2ab29bbf740: { w: 108, h: 76, ax: 64, ay: 36, unit: 905, name: 'BGAB' },
    '7cdbf4c261b7': { w: 108, h: 72, ax: 72, ay: 44, unit: 906, name: 'BGAC' },
    ec4a8c7f16f1: { w: 104, h: 80, ax: 60, ay: 48, unit: 907, name: 'BGBA' },
    '698866fc98aa': { w: 108, h: 76, ax: 52, ay: 36, unit: 908, name: 'BGBB' },
    c35fa5c5657c: { w: 112, h: 72, ax: 44, ay: 44, unit: 909, name: 'BGBC' },
    // ── Asian Carved-Balustrade Stone Arch Bridge (1204..1209) ──
    '2cd1eefd4889': { w: 268, h: 192, ax: 134, ay: 90, unit: 1204, name: 'BGCA' },
    '2d4cdd781bda': { w: 264, h: 188, ax: 138, ay: 86, unit: 1205, name: 'BGCB' },
    '08c578ead8e0': { w: 252, h: 156, ax: 126, ay: 86, unit: 1206, name: 'BGCC' },
    '3772e2eaeff2': { w: 252, h: 192, ax: 142, ay: 90, unit: 1207, name: 'BGDA' },
    '5c6142e06e14': { w: 256, h: 188, ax: 146, ay: 86, unit: 1208, name: 'BGDB' },
    '8b499e998ec7': { w: 264, h: 156, ax: 146, ay: 86, unit: 1209, name: 'BGDC' },
    // ── Roman / Mediterranean Brick-Arch Stone Bridge (1550..1555) ──
    '6fdd352c8209': { w: 276, h: 188, ax: 142, ay: 78, unit: 1550, name: 'BGEA' },
    '60f2dcbd0c48': { w: 288, h: 196, ax: 142, ay: 86, unit: 1551, name: 'BGEB' },
    '9180d0ca58d8': { w: 256, h: 148, ax: 110, ay: 86, unit: 1552, name: 'BGEC' },
    ab0028aa4db2: { w: 260, h: 188, ax: 142, ay: 78, unit: 1553, name: 'BGFA' },
    '287b98559724': { w: 288, h: 196, ax: 172, ay: 84, unit: 1554, name: 'BGFB' },
    '586a12c1134b': { w: 276, h: 148, ax: 172, ay: 84, unit: 1555, name: 'BGFC' },
};

/** 同步读取已缓存的 DE 战役精灵元数据 */
export function getDeCampaignSpriteMetaSync(key: string): DeCampaignSpriteMeta | undefined {
    return (spriteMetaCache ? spriteMetaCache[key] : undefined) ?? GAIA_BRIDGE_SPRITE_META[key];
}

// ── 精灵图片优先级并发池（建筑/城墙/城门/箭塔优先加载，避免几百棵树同时并发占满浏览器连接池） ──
interface SpriteLoadJob {
    spKey: string;
    highPriority: boolean;
    onDone: (img: HTMLImageElement | null) => void;
}
const highQueue: SpriteLoadJob[] = [];
const lowQueue: SpriteLoadJob[] = [];
const highPriorityKeys = new Set<string>();
let activeLoads = 0;
const MAX_CONCURRENT_SPRITE_LOADS = 18;

export function markDeCampaignSpriteHighPriority(spKey: string): void {
    highPriorityKeys.add(spKey);
}

function pumpSpriteQueue(): void {
    while (activeLoads < MAX_CONCURRENT_SPRITE_LOADS && (highQueue.length > 0 || lowQueue.length > 0)) {
        const job = highQueue.length > 0 ? highQueue.shift()! : lowQueue.shift()!;
        activeLoads++;
        const im = new Image();
        const finish = (ok: boolean) => {
            activeLoads--;
            job.onDone(ok ? im : null);
            pumpSpriteQueue();
        };
        im.onload = () => finish(true);
        im.onerror = () => finish(false);
        im.src = `/de-maps/campaign/sprites/${job.spKey}.png`;
    }
}

export function loadDeCampaignSpriteQueued(spKey: string, onDone: (img: HTMLImageElement | null) => void): void {
    const high = highPriorityKeys.has(spKey);
    const job: SpriteLoadJob = { spKey, highPriority: high, onDone };
    if (high) highQueue.push(job);
    else lowQueue.push(job);
    pumpSpriteQueue();
}

/**
 * 归一化关卡 ID（兼容大小写与常见手误，如 `0_El_Scenario_1` → `0_E3_Scenario_1`）
 */
export async function resolveCanonicalDeMapId(rawId: string): Promise<string> {
    const clean = rawId.trim().replace(/\.json$/i, '');
    if (clean.toLowerCase() === '0_el_scenario_1') return '0_E3_Scenario_1';
    try {
        const idx: Array<{ id: string }> = await fetch('/de-maps/campaign/index.json').then((r) => (r.ok ? r.json() : []));
        const exact = idx.find((e) => e.id === clean);
        if (exact) return exact.id;
        const ci = idx.find((e) => e.id.toLowerCase() === clean.toLowerCase());
        if (ci) return ci.id;
    } catch {}
    return clean;
}

/**
 * 加载 `/de-maps/campaign/${deMapId}.json` 并将其从 DE 菱形网格 (tx, ty) 转换为
 * `Scene13GroundLayerGL` 直接消费的屏幕正交网格 (gx, gy)，标记 `noTranspose: true, isDeCampaign: true`。
 */
export async function loadDeCampaignMapForGround(deMapId: string): Promise<any> {
    const cleanId = await resolveCanonicalDeMapId(deMapId);
    const [raw] = await Promise.all([
        fetch(`/de-maps/campaign/${cleanId}.json`).then((r) => {
            if (!r.ok) throw new Error(`加载 DE 战役地图失败: ${cleanId}`);
            return r.json();
        }),
        ensureDeCampaignSpriteMeta(),
    ]);

    const W: number = raw.width || 120;
    const H: number = raw.height || W;
    const N = Math.max(W, H);
    const half = N * 0.5;

    const srcTerrain: number[] = raw.terrain || [];
    const srcLayer: number[] = raw.layer || [];
    const srcElev: number[] = raw.elev || [];

    const outTerrain = new Array<number>(N * N).fill(0);
    const outLayer = new Array<number>(N * N).fill(-1);
    const outElev = new Array<number>(N * N).fill(0);
    const outPassable = new Uint8Array(N * N).fill(1);
    const outSpeed = new Float32Array(N * N).fill(1);

    const isWaterTid = (tid: number): boolean =>
        tid === 1 || tid === 2 || tid === 4 || tid === 15 || tid === 22 || tid === 23 ||
        tid === 28 || tid === 54 || tid === 57 || tid === 58 || tid === 59 || tid === 95 || tid === 96;

    const isRoadOrBeachTid = (tid: number): boolean =>
        tid === 2 || tid === 24 || tid === 25 || tid === 38 || tid === 39 || tid === 75 || tid === 78;

    const sampleTile = (txF: number, tyF: number) => {
        const tx = Math.max(0, Math.min(W - 1, Math.floor(txF)));
        const ty = Math.max(0, Math.min(H - 1, Math.floor(tyF)));
        const idx = ty * W + tx;
        return {
            tid: srcTerrain[idx] ?? 0,
            lid: srcLayer[idx] ?? -1,
            el: srcElev[idx] ?? 0,
        };
    };

    // 双射变换：
    // Scene13GroundLayerGL 格 (gx, gy) 中心对应世界屏幕偏移：
    //   u = (gx + 0.5) - N * 0.5
    //   v = (gy + 0.5) - N * 0.5
    // 逆变换回 DE 瓦片坐标：
    //   tx = N * 0.5 + u - v
    //   ty = N * 0.5 + u + v
    for (let gy = 0; gy < N; gy++) {
        const v = (gy + 0.5) - half;
        for (let gx = 0; gx < N; gx++) {
            const u = (gx + 0.5) - half;
            const cTx = half + u - v;
            const cTy = half + u + v;

            const s0 = sampleTile(cTx, cTy);
            // 4 子点采样确保 1 格宽的河流/护城河/道路在奇偶交错格上绝不断裂
            const s1 = sampleTile(cTx - 0.35, cTy + 0.35);
            const s2 = sampleTile(cTx + 0.35, cTy - 0.35);
            const s3 = sampleTile(cTx - 0.35, cTy - 0.35);
            const s4 = sampleTile(cTx + 0.35, cTy + 0.35);

            let chosen = s0;
            if (!isWaterTid(chosen.tid)) {
                const waterSub = [s1, s2, s3, s4].find((s) => isWaterTid(s.tid));
                if (waterSub) {
                    chosen = waterSub;
                } else if (!isRoadOrBeachTid(chosen.tid)) {
                    const roadSub = [s1, s2, s3, s4].find((s) => isRoadOrBeachTid(s.tid));
                    if (roadSub) chosen = roadSub;
                }
            }

            const outIdx = gy * N + gx;
            outTerrain[outIdx] = chosen.tid;
            outLayer[outIdx] = chosen.lid;
            outElev[outIdx] = chosen.el;
        }
    }

    return {
        id: cleanId,
        name: raw.name || cleanId,
        width: N,
        height: N,
        terrain: outTerrain,
        layer: outLayer,
        elev: outElev,
        passable: outPassable,
        speed: outSpeed,
        objects: [],
        rawDeObjects: raw.objects || [],
        rawDeWidth: W,
        rawDeHeight: H,
        noTranspose: true,
        isDeCampaign: true,
    };
}

/**
 * 依据 `empires2_x2_p1.dat` 严格导出的移动单位/士兵/村民/战船/攻城车/动物/鱼群 ID 集合：
 * 战术模式中两军由 `Scene13WarLayer` 动态生成并推演，场景中预设的静态兵人/村民/船只/鱼群一律剔除，不作为静态贴图摆在地上。
 */
const SKIP_MOBILE_UNIT_IDS = new Set([
    1, 4, 5, 6, 7, 8, 11, 13, 17, 21, 24, 25, 26, 35, 36, 38, 39, 40, 41, 42, 46, 48, 52, 53, 61, 65, 69,
    73, 74, 75, 77, 83, 89, 93, 96, 111, 118, 121, 125, 126, 128, 139, 156, 160, 161, 167, 168, 169, 171,
    172, 177, 178, 180, 185, 188, 193, 195, 197, 199, 204, 205, 207, 223, 232, 239, 250, 262, 275, 279,
    280, 281, 282, 283, 286, 291, 293, 299, 305, 329, 330, 331, 358, 359, 361, 420, 422, 424, 425, 427,
    430, 432, 434, 437, 439, 440, 441, 442, 448, 449, 450, 451, 453, 455, 456, 457, 458, 459, 473, 474,
    486, 492, 493, 501, 527, 528, 529, 530, 531, 532, 534, 539, 542, 545, 546, 547, 548, 550, 553, 554,
    555, 556, 557, 558, 559, 560, 561, 567, 569, 588, 594, 629, 632, 634, 636, 638, 639, 640, 642, 644,
    646, 648, 650, 652, 678, 680, 683, 686, 691, 692, 694, 698, 700, 702, 703, 704, 705, 706, 707, 725,
    726, 729, 731, 733, 749, 751, 752, 753, 755, 757, 763, 765, 771, 773, 775, 777, 778, 779, 781, 783,
    812, 814, 815, 816, 822, 824, 831, 833, 835, 838, 840, 842, 844, 845, 846, 849, 866, 868, 869, 871,
    873, 875, 876, 878, 879, 882, 884, 892, 893, 894, 897, 917, 925, 927, 929, 930, 931, 932, 936, 943,
    944, 1001, 1004, 1007, 1009, 1010, 1012, 1013, 1015, 1016, 1018, 1019, 1023, 1026, 1028, 1029, 1031,
    1034, 1035, 1036, 1037, 1039, 1040, 1056, 1060, 1070, 1072, 1074, 1080, 1103, 1104, 1105, 1106, 1109,
    1120, 1123, 1125, 1126, 1128, 1129, 1131, 1132, 1134, 1135, 1137, 1139, 1141, 1142, 1155, 1157, 1158,
    1160, 1162, 1163, 1164, 1165, 1166, 1178, 1180, 1181, 1183, 1184, 1186, 1225, 1227, 1228, 1230, 1231,
    1233, 1234, 1236, 1237, 1239, 1241, 1243, 1245, 1247, 1252, 1254, 1255, 1258, 1260, 1262, 1263, 1265,
    1266, 1267, 1268, 1269, 1271, 1273, 1275, 1276, 1281, 1292, 1295, 1298, 1299, 1301, 1303, 1304, 1305,
    1338, 1356, 1370, 1372, 1374, 1572, 1574, 1596, 1598, 1600, 1602, 1655, 1658, 1669, 1671, 1673, 1675,
    1677, 1679, 1681, 1683, 1685, 1687, 1701, 1703, 1704, 1707, 1709, 1713, 1715, 1718, 1721, 1723, 1725,
    1727, 1730, 1731, 1732, 1735, 1737, 1738, 1741, 1743, 1744, 1746, 1747, 1749, 1750, 1751, 1753, 1755,
    1759, 1763, 1764, 1766, 1768, 1769, 1790, 1792, 1793, 1795, 1800, 1803, 1904, 1907, 1948, 1963, 2026,
    2089, 2550, 2552, 2564, 2579, 2586, 2587, 2589, 2591, 2593, 2594, 2595, 2625, 2626, 2627, 2628, 2700,
    2703, 2704, 2705, 2706,
]);

const WALL_IDS = new Set([
    72, 117, 119, 155, 231, 370, 788, 1062, 1090, 1218, 1219, 1220, 1396, 1397, 1398, 1399,
]);

const GATE_MAIN_IDS = new Set([
    63, 64, 78, 85, 88, 487, 490, 659, 667, 668, 789, 793, 797, 801,
    1176, 1379, 1383, 1387, 1391, 1579, 1583, 1587,
]);

const GATE_POST_IDS = new Set([
    80, 81, 92, 95, 663, 671, 672, 791, 795, 799, 803,
    1381, 1385, 1389, 1393, 1581, 1585, 1589,
]);

const TOWER_IDS = new Set([
    79, 190, 234, 235, 236, 684, 685, 785, 1102, 1665,
]);

const CASTLE_IDS = new Set([
    33, 82, 1251,
]);

const BRIDGE_IDS = new Set([
    605, 606, 607, 608, 609, 610,
    738, 739, 740, 741, 742, 743,
    904, 905, 906, 907, 908, 909,
    1204, 1205, 1206, 1207, 1208, 1209, 1210, 1211, 1212, 1213, 1214, 1215,
    1309, 1310, 1311, 1312, 1313, 1314,
    1550, 1551, 1552, 1553, 1554, 1555, 1556, 1557, 1558, 1559, 1560, 1561,
    1839, 1840, 1841, 1842, 1843, 1844, 1845, 1846, 1847,
]);

const TC_MAIN_IDS = new Set([109, 142, 481, 482, 483, 597, 2556, 2560]);
const TC_ANNEX_IDS = new Set([618, 619, 620, 621, 1890]);

const RUBBLE_OR_DECOR_SKIP_OBSTRUCTION = new Set([
    143, 144, 145, 146, 147, 148, 154, 192, 241, 301, 306,
    334, 335, 336, 337, 338, 339, 340, 341, 345, 389, 396,
    710, 711, 723, 728, 758, 818, 820, 859, 863, 864, 865,
    1033, 1091, 1175, 1351, 1352, 1353, 1354, 1355, 1358, 1359,
    1360, 1362, 1364, 1365, 1366, 1497, 1498, 2031, 2536,
]);

/** 根据建筑类别与守方默认风格映射我方坍塌动画族名（确保打爆后播放对应尺寸与风格的 DE 坍塌动画与残骸） */
function resolveDestrFamilyName(unitCode: string, kind: string, fallbackStyle: string): string {
    const validStyles = new Set(['WEST', 'EAST', 'ASIA', 'ORIE', 'MESO', 'MEDI', 'SLAV', 'AFRI', 'INDI', 'SEAS', 'CEAS']);
    const style = validStyles.has(fallbackStyle) ? fallbackStyle : 'WEST';
    const up = (unitCode || '').toUpperCase();

    if (up.includes('YURT')) return 'YURT_E';
    if (up.includes('AHUT') || up.includes('HUT')) return 'HUT_A';
    if (up.includes('TENT')) return 'GREEK_WAR_TENT';
    switch (kind) {
        case 'CASTLE': return `${style}_CASTLE`;
        case 'KEEP':
        case 'BOMBARD_TOWER':
            return `${style}_TOWER_AGE4`;
        case 'GUARD_TOWER':
            return `${style}_TOWER_AGE3`;
        case 'TOWER':
            return `${style}_TOWER_AGE2`;
        case 'OUTPOST': return 'OUTPOST';
        case 'TOWN_CENTER': return `${style}_TOWN_CENTER_AGE3`;
        case 'BARRACKS': return `${style}_BARRACKS_AGE3`;
        case 'ARCHERY_RANGE': return `${style}_ARCHERY_RANGE_AGE3`;
        case 'STABLE': return `${style}_STABLE_AGE3`;
        case 'SIEGE_WORKSHOP': return `${style}_SIEGE_WORKSHOP_AGE3`;
        case 'MARKET': return `${style}_MARKET_AGE3`;
        case 'MONASTERY': return `${style}_MONASTERY_AGE3`;
        case 'UNIVERSITY': return `${style}_UNIVERSITY_AGE3`;
        case 'BLACKSMITH': return `${style}_BLACKSMITH_AGE3`;
        case 'MILL': return `${style}_MILL_AGE3`;
        case 'WONDER': return `${style}_WONDER`;
        case 'HOUSE':
        default:
            return `${style}_HOUSE_AGE3_A`;
    }
}

/** 识别普通可攻击建筑的类别与默认占地半径（格） */
function classifyDeBuilding(uid: number, unitCode: string): { kind: string; footprint: number; shootCapable: boolean } | null {
    const up = (unitCode || '').toUpperCase();

    if (TC_MAIN_IDS.has(uid) || up === 'RTWC' || up.startsWith('TWNC') || up.startsWith('SETTL')) {
        return { kind: 'TOWN_CENTER', footprint: 1.8, shootCapable: true };
    }
    if (uid === 12 || uid === 498 || up.startsWith('BARRACKS') || up.startsWith('BRKS')) {
        return { kind: 'BARRACKS', footprint: 1.4, shootCapable: true };
    }
    if (uid === 87 || up.startsWith('ARRG')) {
        return { kind: 'ARCHERY_RANGE', footprint: 1.4, shootCapable: true };
    }
    if (uid === 101 || up.startsWith('STBL')) {
        return { kind: 'STABLE', footprint: 1.4, shootCapable: true };
    }
    if (uid === 49 || up === 'SIWS' || up.startsWith('SGWS')) {
        return { kind: 'SIEGE_WORKSHOP', footprint: 1.4, shootCapable: true };
    }
    if (uid === 103 || up.startsWith('BLAC')) {
        return { kind: 'BLACKSMITH', footprint: 1.3, shootCapable: true };
    }
    if (uid === 84 || uid === 110 || uid === 45 || uid === 805 || uid === 1021 || uid === 1189 || uid === 1754 ||
        up.startsWith('MRKT') || up.startsWith('DOCK') || up === 'SDOC' || up === 'HARBOR' || up === 'CARAVANSERAI' || up === 'FEITO' || up === 'TDWS') {
        return { kind: 'MARKET', footprint: 1.5, shootCapable: true };
    }
    if (uid === 104 || uid === 31 || uid === 445 || uid === 655 || uid === 872 || uid === 1191 || uid === 1201 || uid === 1202 || uid === 1203 ||
        uid === 1216 || uid === 1264 || uid === 1562 || uid === 1563 || uid === 1567 || uid === 1712 || uid === 1778 ||
        up.startsWith('CRCH') || up.startsWith('MNST') || up === 'CATH' || up === 'MSQUE' || up === 'QCAT' ||
        up.startsWith('PAGODA') || up.startsWith('SHRINE') || up.startsWith('STUPA') || up === 'SASTUPA' || up === 'REKHADEUL') {
        return { kind: 'MONASTERY', footprint: 1.4, shootCapable: true };
    }
    if (uid === 209 || uid === 599 || up.startsWith('UNIV') || up === 'SPECR') {
        return { kind: 'UNIVERSITY', footprint: 1.5, shootCapable: true };
    }
    if (uid === 276 || uid === 251 || uid === 263 || uid === 689 || uid === 690 || uid === 696 || uid === 899 || uid === 1369 || uid === 1622 ||
        up.startsWith('WNDR') || up.startsWith('WOND') || up === 'AMPHI' || up === 'COLOSS' || up === 'HPYR' || up === 'HDOR' || up === 'HGPR' || up === 'ARCHCON') {
        return { kind: 'WONDER', footprint: 2.0, shootCapable: true };
    }
    if (uid === 68 || uid === 130 || uid === 562 || uid === 584 || uid === 1081 || uid === 1089 || uid === 1711 || uid === 1734 ||
        up.startsWith('MILL') || up === 'SMIL' || up === 'MINE' || up === 'STORAGE' || up === 'GRANARY' || up.startsWith('FOLWARK')) {
        return { kind: 'MILL', footprint: 1.1, shootCapable: true };
    }
    if (uid === 598 || up === 'WCTWX' || up.startsWith('OUTP')) {
        return { kind: 'OUTPOST', footprint: 0.9, shootCapable: false };
    }
    if (uid === 70 || uid === 191 || uid === 463 || uid === 464 ||
        (uid >= 624 && uid <= 626) || (uid >= 712 && uid <= 719) ||
        (uid >= 1082 && uid <= 1088) || (uid >= 1097 && uid <= 1101) ||
        (uid >= 1196 && uid <= 1200) || (uid >= 1832 && uid <= 1835) ||
        up.startsWith('HOUS') || up.startsWith('YURT') || up.startsWith('AHUT') || up.startsWith('TENT') || up.startsWith('ARMTENT') || up.startsWith('PAV')) {
        const isCampTent = up.includes('TENT') || up.startsWith('YURT') || up.startsWith('AHUT');
        return { kind: 'HOUSE', footprint: 1.0, shootCapable: !isCampTent };
    }
    return null;
}

/**
 * 方式二核心落盘：将 DE 战役地图里的全部城墙、城门、箭塔、城堡、建筑、桥梁、自然树木原样注册进 `Scene13WarLayer`。
 * 归属规则（主人确认）：
 *   - 所有城防、关隘、城墙、城门、箭塔、城堡、城内建筑归属防守方 (`f = 1`)；
 *   - 唯独落在进攻方出兵营地 (`f = 0`) 范围内的军帐/营房归进攻方 (`f = 0`)，避免攻方砸毁自家营地。
 */
export function populateDeCampaignObjects(
    layer: Scene13WarLayer,
    rawObjects: any[],
    N: number,
    _glLayer: Scene13GroundLayerGL,
    VW: number,
    VH: number,
): void {
    if (!rawObjects || !rawObjects.length) return;

    const half = N * 0.5;
    const worldCX = VW * 0.5;
    const worldCY = VH * 0.5;
    const defStyle = layer.buildingStyleFor(1);

    const toScreen = (tx: number, ty: number) => ({
        x: worldCX + ((tx - half) + (ty - half)) * 48,
        y: worldCY + ((ty - half) - (tx - half)) * 24,
    });

    // 计算攻方 (f=0) 与守方 (f=1) 出兵点中心，用于区分攻方营区内的军帐
    const atkSpawns = layer.spawns.filter((s) => s.f === 0);
    const defSpawns = layer.spawns.filter((s) => s.f === 1);
    let atkCX = -Infinity, atkCY = -Infinity;
    let defCX = Infinity, defCY = Infinity;
    if (atkSpawns.length > 0) {
        atkCX = atkSpawns.reduce((s, p) => s + p.x, 0) / atkSpawns.length;
        atkCY = atkSpawns.reduce((s, p) => s + p.y, 0) / atkSpawns.length;
    }
    if (defSpawns.length > 0) {
        defCX = defSpawns.reduce((s, p) => s + p.x, 0) / defSpawns.length;
        defCY = defSpawns.reduce((s, p) => s + p.y, 0) / defSpawns.length;
    }
    const isInsideAttackerCamp = (sx: number, sy: number): boolean => {
        if (!Number.isFinite(atkCX)) return false;
        const dAtk = Math.hypot(sx - atkCX, sy - atkCY);
        const dDef = Math.hypot(sx - defCX, sy - defCY);
        return dAtk < 720 && dAtk + 180 < dDef;
    };

    // 预扫描城门立柱附属件 (GATE_POST_IDS)、城镇中心附属件 (TC_ANNEX_IDS)、城墙连通格网，
    // 以及「墙走到这里就收头」的建筑格（城门主体/门柱/箭塔/城堡），
    // 城墙按邻格连通性自动选取 DE 5 向精灵
    //（0 = 沿 tx 轴 ↗↙，1 = 沿 ty 轴 ↘↖，2 = 方柱（垛墙），3 = 沿 (1,1) 对角 —，4 = 沿 (1,-1) 对角 |；
    //  方向由这 5 帧的 SLD 影子层实测：影子长轴分别为 -18°、+25°、正方形、+5°、+85°）。
    // 🔴 城门主体/门柱/箭塔/城堡不进墙线格网：它们是独立建筑，墙走到跟前就收头；
    //    把门柱当「墙邻格」会让贴门的墙件被判成转角，生成一个被城门塔压住、只露出一条竖棱的方柱（主人报的「竖梯」）。
    const gatePosts: Array<{ ob: any; pos: { x: number; y: number }; used: boolean }> = [];
    const tcAnnexes: Array<{ ob: any; pos: { x: number; y: number }; sp: DecorSprite }> = [];
    const wgTileSet = new Set<string>();
    const wallAttachTileSet = new Set<string>();

    for (const ob of rawObjects) {
        if (!ob || !ob.name) continue;
        const uid: number = ob.id;
        const tileKey = `${Math.floor(ob.x)},${Math.floor(ob.y)}`;
        if (GATE_POST_IDS.has(uid)) {
            markDeCampaignSpriteHighPriority(ob.name);
            gatePosts.push({ ob, pos: toScreen(ob.x, ob.y), used: false });
            wallAttachTileSet.add(tileKey);
            continue;
        }
        if (WALL_IDS.has(uid)) {
            wgTileSet.add(tileKey);
        } else if (GATE_MAIN_IDS.has(uid) || TOWER_IDS.has(uid) || CASTLE_IDS.has(uid)) {
            wallAttachTileSet.add(tileKey);
        }
    }

    // 🔴 [2026-10-25 主人令「这个城墙没有摆放对朝向，请修复」「两边要用垛墙，垛墙和垛墙不能挨着，你看看 DE 是怎么计算这块的」「这里没有城垛呀」]
    //    DE 剧本里存的城墙 rotation 只是编辑器放置时留下的角度（实测：同一段直墙里 5 个角度值混着出现，与邻格怎么连无关），
    //    不能按 rotation 取帧——原导出按 round(rot)%5 取帧，144°/216°/288° 三档全取错（144°→3、216°→4、288°→0），
    //    整圈墙才「一块块各朝各的」。DE 运行时是按邻格连通性自动选帧的，照它算：
    //    ① 先认「整条对穿的直墙」（±x / ±y / 两条斜线）：有对穿就用该方向的直墙帧——直墙优先，
    //       免得旁边一条擦着角的墙把直墙格误判成方柱（两件垛墙挨着就是这么来的）。
    //    ② 没有对穿时数连通方向：连两个以上不同方向（转角/丁字/十字）→ 方柱帧（垛墙）；孤立单节也是方柱。
    //    ③ 只连一个方向 = 墙端头 → 也落垛墙（DE 的墙两头是方柱收头）；但墙端头顶着城门/箭塔/城堡时改直墙，
    //       因为那里由建筑本身收头，再叠一个垛墙会跟城门塔挤成两件。
    //    ④ 斜邻格只有在「对面的斜邻格也接着」时才算一条墙线（两条斜墙成一条线）；单纯擦着角的不算。
    type WallTileKind = 'straight' | 'corner' | 'end' | 'solo';
    const resolveWallTile = (gx: number, gy: number): { idx: number; kind: WallTileKind } => {
        const has = (x: number, y: number) => wgTileSet.has(`${x},${y}`);
        const xp = has(gx + 1, gy), xm = has(gx - 1, gy);
        const yp = has(gx, gy + 1), ym = has(gx, gy - 1);
        const dp = has(gx + 1, gy + 1), dm = has(gx - 1, gy - 1);
        const vp = has(gx + 1, gy - 1), vm = has(gx - 1, gy + 1);
        const xPair = xp && xm, yPair = yp && ym, dPair = dp && dm, vPair = vp && vm;
        if ((xPair ? 1 : 0) + (yPair ? 1 : 0) + (dPair ? 1 : 0) + (vPair ? 1 : 0) >= 2) return { idx: 2, kind: 'corner' };   // 十字交汇
        if (xPair) return { idx: 0, kind: 'straight' };
        if (yPair) return { idx: 1, kind: 'straight' };
        if (dPair) return { idx: 3, kind: 'straight' };
        if (vPair) return { idx: 4, kind: 'straight' };
        const dConn = (dp && has(gx + 2, gy + 2)) || (dm && has(gx - 2, gy - 2));
        const vConn = (vp && has(gx + 2, gy - 2)) || (vm && has(gx - 2, gy + 2));
        const dirs: number[] = [];
        if (xp || xm) dirs.push(0);
        if (yp || ym) dirs.push(1);
        if (dConn) dirs.push(3);
        if (vConn) dirs.push(4);
        if (dirs.length === 1) return { idx: 2, kind: 'end' };        // 墙端头：方柱收头
        if (dirs.length === 0) {
            if (dp || dm) return { idx: 3, kind: 'straight' };       // 斜墙线的一节（含只有两格长的斜墙端头）
            if (vp || vm) return { idx: 4, kind: 'straight' };
            return { idx: 2, kind: 'solo' };                          // 孤立单节
        }
        return { idx: 2, kind: 'corner' };                            // 转角 / 丁字 → 方柱（垛墙）
    };

    // 预先把每格城墙的帧号算好，再做两轮收尾：
    //   ① 墙端头顶着城门/箭塔/城堡 → 改直墙（由建筑收头）；
    //   ② 「两件垛墙挨着」必须消掉（主人令）：转角垛墙优先保留，端头垛墙让位，降成直墙帧。
    const wallTileInfo = new Map<string, { idx: number; kind: WallTileKind }>();
    const wallTileKeys = [...wgTileSet];
    for (const key of wallTileKeys) {
        const [gx, gy] = key.split(',').map(Number);
        wallTileInfo.set(key, resolveWallTile(gx, gy));
    }
    const straightFallback = (gx: number, gy: number): number => {
        const has = (x: number, y: number) => wgTileSet.has(`${x},${y}`);
        if (has(gx - 1, gy) || has(gx + 1, gy)) return 0;
        if (has(gx, gy - 1) || has(gx, gy + 1)) return 1;
        if (has(gx - 1, gy - 1) || has(gx + 1, gy + 1)) return 3;
        if (has(gx + 1, gy - 1) || has(gx - 1, gy + 1)) return 4;
        return 2;
    };
    const touchesAttachTile = (gx: number, gy: number): boolean => {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                if (wallAttachTileSet.has(`${gx + dx},${gy + dy}`)) return true;
            }
        }
        return false;
    };
    for (const key of wallTileKeys) {
        const info = wallTileInfo.get(key)!;
        if (info.kind !== 'end') continue;
        const [gx, gy] = key.split(',').map(Number);
        if (touchesAttachTile(gx, gy)) {
            info.idx = straightFallback(gx, gy);
            info.kind = 'straight';
        }
    }
    const keptCaps = new Set<string>();
    // 🔴 [2026-10-25 主人令「C段和B的垛城垛应该挨着吧」] 只禁「正着挨」（边相邻，两件垛墙排成一条线），
    //    斜着相邻（45° 弯的两侧各一件垛墙）是 DE 的样子，要保留——弯两侧的垛墙本来就该挨着。
    const hasKeptCapNear = (gx: number, gy: number): boolean =>
        keptCaps.has(`${gx + 1},${gy}`) || keptCaps.has(`${gx - 1},${gy}`) ||
        keptCaps.has(`${gx},${gy + 1}`) || keptCaps.has(`${gx},${gy - 1}`);
    for (const pass of [0, 1] as const) {
        for (const key of wallTileKeys) {
            const info = wallTileInfo.get(key)!;
            if (info.idx !== 2) continue;
            if (pass === 0 && info.kind !== 'corner' && info.kind !== 'solo') continue;   // 第一轮：转角/孤立先占位
            if (pass === 1 && info.kind === 'corner') continue;                            // 第二轮：端头让位
            const [gx, gy] = key.split(',').map(Number);
            if (hasKeptCapNear(gx, gy)) {
                info.idx = straightFallback(gx, gy);
                info.kind = 'straight';
            } else {
                keptCaps.add(key);
            }
        }
    }
    const wallAngleByIdx = new Map<string, number>();
    for (const [key, info] of wallTileInfo) wallAngleByIdx.set(key, info.idx);

    for (const ob of rawObjects) {
        if (!ob || !ob.name) continue;
        const spriteKey: string = ob.name;
        const uid: number = ob.id;
        const unitCode: string = ob.unit || '';

        // 跳过场景预设的移动士兵/村民/船只/攻城车/动物/鱼群
        if (SKIP_MOBILE_UNIT_IDS.has(uid) || unitCode.endsWith('_D')) continue;

        // 城门立柱由城门主件统一挂载进 extraSprites，此处不单独重复落盘
        if (GATE_POST_IDS.has(uid)) continue;

        const pos = toScreen(ob.x, ob.y);
        const assetKey = `DECAMP:${spriteKey}`;

        // 1. 桥梁：地面层装饰（z = -5，无阻挡、不可摧毁）
        if (BRIDGE_IDS.has(uid) || unitCode.startsWith('BG') || unitCode.startsWith('Bridge')) {
            markDeCampaignSpriteHighPriority(spriteKey);
            layer.ensureNatureAsset(assetKey);
            layer.decorSprites.push({
                asset: assetKey,
                frame: 0,
                x: pos.x,
                y: pos.y,
                flip: false,
                layer: 'world',
                z: -5,
                indestructible: true,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
            });
            continue;
        }

        // 2. 城门主件：注册进 wallGates (STONE_GATE, f = 1)，附带两侧门柱与 6 点跨度碰撞体
        if (GATE_MAIN_IDS.has(uid) && !ob.annex) {
            markDeCampaignSpriteHighPriority(spriteKey);
            layer.ensureNatureAsset(assetKey);
            const isWoodGate = (uid >= 789 && uid <= 803) || unitCode.startsWith('PGT');
            const st = isWoodGate ? WALL_GATE_STATS.WOOD_WALL : WALL_GATE_STATS.STONE_GATE;
            const mainSp: DecorSprite = {
                asset: assetKey,
                frame: 0,
                x: pos.x,
                y: pos.y,
                flip: false,
                layer: 'world',
                z: 1,
                obstruction: { x: 0.95, y: 0.95 },
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: false,
            };
            layer.decorSprites.push(mainSp);

            const extraSprites: DecorSprite[] = [];
            // 挂载附近 260px 内的门柱附属件（破门时一起隐藏/坍塌）
            for (const gp of gatePosts) {
                if (gp.used) continue;
                if (Math.hypot(gp.pos.x - pos.x, gp.pos.y - pos.y) <= 260) {
                    gp.used = true;
                    const postAsset = `DECAMP:${gp.ob.name}`;
                    layer.ensureNatureAsset(postAsset);
                    const postSp: DecorSprite = {
                        asset: postAsset,
                        frame: 0,
                        x: gp.pos.x,
                        y: gp.pos.y,
                        flip: false,
                        layer: 'world',
                        z: 1,
                        obstruction: { x: 0.95, y: 0.95 },
                        obstructionContactSec: 0,
                        obstructionTouched: false,
                        obstructionDisabled: false,
                    };
                    layer.decorSprites.push(postSp);
                    extraSprites.push(postSp);
                }
            }

            // 沿城门轴向铺 6 点隐形碰撞体封死城门跨度
            const isNE = uid === 63 || uid === 64 || uid === 85 || uid === 659 || uid === 667 ||
                uid === 789 || uid === 797 || uid === 1379 || uid === 1387 || uid === 1579;
            const dSign = isNE ? -1 : 1;
            for (let step = -3; step <= 3; step++) {
                if (step === 0) continue;
                const extra: DecorSprite = {
                    asset: '',
                    frame: 0,
                    x: pos.x + step * 24,
                    y: pos.y + step * 12 * dSign,
                    flip: false,
                    layer: 'world',
                    z: 1,
                    obstruction: { x: 0.95, y: 0.95 },
                    obstructionContactSec: 0,
                    obstructionTouched: false,
                    obstructionDisabled: false,
                };
                layer.decorSprites.push(extra);
                extraSprites.push(extra);
            }

            const rubbleAsset = isWoodGate ? 'BATTLEFIELD:FENCE_RUBBLE' : 'FOUNDATION_1X1_RUBBLE';
            if (isWoodGate) {
                layer.ensureNatureAsset('BATTLEFIELD:FENCE_RUBBLE');
            } else {
                layer.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_DESTR');
                layer.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_RUBBLE');
            }

            layer.wallGates.push({
                f: 1,
                key: 'STONE_GATE',
                x: pos.x,
                y: pos.y,
                hp: st.hp,
                maxHp: st.hp,
                claims: 0,
                claimsNext: 0,
                atkNext: 0,
                atkers: 0,
                sprite: mainSp,
                extraSprites,
                linked: true,
                rubbleAsset,
            });
            continue;
        }

        // 3. 城墙 / 木栅栏 / 海墙 / 拒马：注册进 wallGates (f = 1)，并按邻格连通性自动选取 DE 5 向精灵
        if (WALL_IDS.has(uid)) {
            const meta = getDeCampaignSpriteMetaSync(spriteKey);
            let wallSpriteKey = spriteKey;
            if (meta?.frames5 && meta.frames5.length === 5) {
                const angleIdx = wallAngleByIdx.get(`${Math.floor(ob.x)},${Math.floor(ob.y)}`);
                if (angleIdx !== undefined) wallSpriteKey = meta.frames5[angleIdx] || spriteKey;
            }
            const wallAssetKey = `DECAMP:${wallSpriteKey}`;
            markDeCampaignSpriteHighPriority(wallSpriteKey);
            layer.ensureNatureAsset(wallAssetKey);
            const isWood = uid === 72 || uid === 119 || uid === 1062 || uid === 1090 || (uid >= 1218 && uid <= 1220);
            const isFortified = uid === 155 || uid === 370 || uid === 788;
            const wKey: 'WOOD_WALL' | 'STONE_WALL' | 'FORTIFIED_WALL' = isWood
                ? 'WOOD_WALL'
                : isFortified
                    ? 'FORTIFIED_WALL'
                    : 'STONE_WALL';
            const st = WALL_GATE_STATS[wKey];
            const wallSp: DecorSprite = {
                asset: wallAssetKey,
                frame: 0,
                x: pos.x,
                y: pos.y,
                flip: false,
                layer: 'world',
                z: 1,
                obstruction: { x: 0.95, y: 0.95 },
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: false,
            };
            layer.decorSprites.push(wallSp);

            const rubbleAsset = isWood ? 'BATTLEFIELD:FENCE_RUBBLE' : 'FOUNDATION_1X1_RUBBLE';
            if (isWood) {
                layer.ensureNatureAsset('BATTLEFIELD:FENCE_RUBBLE');
            } else {
                layer.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_DESTR');
                layer.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_RUBBLE');
            }

            layer.wallGates.push({
                f: 1,
                key: wKey,
                x: pos.x,
                y: pos.y,
                hp: st.hp,
                maxHp: st.hp,
                claims: 0,
                claimsNext: 0,
                atkNext: 0,
                atkers: 0,
                sprite: wallSp,
                linked: false,
                rubbleAsset,
            });
            continue;
        }

        // 4. 箭塔 / 火炮塔 / 哨塔 / 顿존：注册进 arrowTowers + trackCityBuilding (f = 1)
        if (TOWER_IDS.has(uid)) {
            markDeCampaignSpriteHighPriority(spriteKey);
            layer.ensureNatureAsset(assetKey);
            const towerSp: DecorSprite = {
                asset: assetKey,
                frame: 0,
                x: pos.x,
                y: pos.y,
                flip: false,
                layer: 'world',
                z: 1,
                obstruction: { x: 0.95, y: 0.95 },
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: false,
            };
            layer.decorSprites.push(towerSp);

            const towerKind = uid === 236 ? 'BOMBARD_TOWER' : uid === 235 ? 'KEEP' : uid === 234 ? 'GUARD_TOWER' : 'TOWER';
            const famName = resolveDestrFamilyName(unitCode, towerKind, defStyle);
            const towerProfile = uid === 236
                ? { range: 400, reload: 3.0, atk: 12 }
                : uid === 235
                    ? { range: 400, reload: 1.8, atk: 7 }
                    : uid === 234
                        ? { range: 360, reload: 2.0, atk: 6 }
                        : { range: 320, reload: 2.2, atk: 5 };
            const towerObj = {
                sprite: towerSp,
                x: pos.x,
                y: pos.y,
                cd: Math.random() * 1.5,
                range: towerProfile.range,
                reload: towerProfile.reload,
                atk: towerProfile.atk,
                rubbleAsset: `BUILDINGANIM:${famName}_RUBBLE`,
                down: false,
            };
            layer.arrowTowers.push(towerObj);
            layer.trackCityBuilding(towerSp, 'TOWER', famName);
            const lastDef = layer.defBuildings[layer.defBuildings.length - 1];
            if (lastDef && lastDef.sprite === towerSp && lastDef.bld) {
                lastDef.bld.tower = towerObj;
            }
            continue;
        }

        // 5. 城堡 / 堡垒：注册进 castleTowers + trackCityBuilding (f = 1)
        if (CASTLE_IDS.has(uid)) {
            markDeCampaignSpriteHighPriority(spriteKey);
            layer.ensureNatureAsset(assetKey);
            const castleSp: DecorSprite = {
                asset: assetKey,
                frame: 0,
                x: pos.x,
                y: pos.y,
                flip: false,
                layer: 'world',
                z: 2,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
            };
            layer.decorSprites.push(castleSp);

            const famName = resolveDestrFamilyName(unitCode, 'CASTLE', defStyle);
            layer.castleTowers.push({
                sprite: castleSp,
                x: pos.x,
                y: pos.y,
                cd: Math.random() * 1.2,
                range: 440,
                reload: 1.6,
                atk: 11,
                rubbleAsset: `BUILDINGANIM:${famName}_RUBBLE`,
                down: false,
            });
            layer.trackCityBuilding(castleSp, 'CASTLE', famName);
            continue;
        }

        // 6. 城镇中心附属件 (618..621, 1890)：先落盘为世界精灵，随后绑定到最近的城镇中心主件上同步坍塌
        if (TC_ANNEX_IDS.has(uid) || ob.annex) {
            markDeCampaignSpriteHighPriority(spriteKey);
            layer.ensureNatureAsset(assetKey);
            const annexSp: DecorSprite = {
                asset: assetKey,
                frame: 0,
                x: pos.x,
                y: pos.y,
                flip: false,
                layer: 'world',
                z: 1,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
            };
            layer.decorSprites.push(annexSp);
            tcAnnexes.push({ ob, pos, sp: annexSp });
            continue;
        }

        // 7. 其它城内/营地建筑（城镇中心、兵营、靶场、马厩、攻城厂、市场、修道院、大学、奇观、民居、蒙古包、军帐、哨站）
        const bldInfo = classifyDeBuilding(uid, unitCode);
        if (bldInfo) {
            markDeCampaignSpriteHighPriority(spriteKey);
            layer.ensureNatureAsset(assetKey);
            const bldSp: DecorSprite = {
                asset: assetKey,
                frame: 0,
                x: pos.x,
                y: pos.y,
                flip: false,
                layer: 'world',
                z: bldInfo.kind === 'WONDER' ? 2 : 1,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
            };
            layer.decorSprites.push(bldSp);

            const famName = resolveDestrFamilyName(unitCode, bldInfo.kind, defStyle);

            if (isInsideAttackerCamp(pos.x, pos.y)) {
                layer.registerDefBuilding(bldSp, famName, undefined, bldInfo.kind, 0);
                layer.ensureDestrAssetsFor(famName);
            } else {
                // 🔴 [2026-11-04 主人令「所有据点的建筑都可以射击」] 守方一侧的建筑一律登记为射击建筑
                //    （原来 shootCapable=false 的哨站 / 营帐只挨打不射）。
                layer.trackCityBuilding(bldSp, bldInfo.kind, famName);
            }
            continue;
        }

        // 8. 其余场景物件（树木、岩石、悬崖、金矿、石矿、灌木、草花、旗帜、雕像、火炬、废墟、路牌等）
        // 直接使用 DE 原版提取的 DECAMP 精灵按精确锚点与朝向渲染
        if (unitCode.startsWith('FLAG') || unitCode.startsWith('TORCH') || unitCode.includes('Statue') || unitCode.includes('STATUE') || unitCode.includes('RUIN') || unitCode.includes('PAIFANG')) {
            markDeCampaignSpriteHighPriority(spriteKey);
        }
        layer.ensureNatureAsset(assetKey);
        const isGroundFlat = RUBBLE_OR_DECOR_SKIP_OBSTRUCTION.has(uid) ||
            unitCode.includes('RUBL') || unitCode.includes('Grass') || unitCode.includes('PLANT') ||
            unitCode.includes('Plan ') || unitCode.includes('Plant');
        layer.decorSprites.push({
            asset: assetKey,
            frame: 0,
            x: pos.x,
            y: pos.y,
            flip: false,
            layer: 'world',
            z: isGroundFlat ? -5 : 0,
            indestructible: true,
            obstructionContactSec: 0,
            obstructionTouched: false,
            obstructionDisabled: true,
        });
    }

    // 将未配对的城门立柱作为普通城墙阻挡落盘，避免缺失门柱画面
    for (const gp of gatePosts) {
        if (gp.used) continue;
        const postAsset = `DECAMP:${gp.ob.name}`;
        layer.ensureNatureAsset(postAsset);
        layer.decorSprites.push({
            asset: postAsset,
            frame: 0,
            x: gp.pos.x,
            y: gp.pos.y,
            flip: false,
            layer: 'world',
            z: 1,
            indestructible: true,
            obstructionContactSec: 0,
            obstructionTouched: false,
            obstructionDisabled: false,
        });
    }

    // 将城镇中心附属件绑定到最近的城镇中心主件上，主件坍塌时同步隐藏附属件
    if (tcAnnexes.length > 0) {
        const tcBuildings = layer.defBuildings.filter((b) => b.key.includes('TOWN_CENTER') || b.bld?.name?.includes('TOWN_CENTER'));
        for (const ax of tcAnnexes) {
            let bestTc: any = null;
            let bestDist = 260;
            for (const tc of tcBuildings) {
                const d = Math.hypot(tc.x - ax.pos.x, tc.y - ax.pos.y);
                if (d < bestDist) {
                    bestDist = d;
                    bestTc = tc;
                }
            }
            if (bestTc && bestTc.sprite) {
                const arr: DecorSprite[] = (bestTc.sprite as any).annexSprites ?? ((bestTc.sprite as any).annexSprites = []);
                arr.push(ax.sp);
            }
        }
    }

    // 重置城门/城墙索引缓存，使 ensureGateInfo() 与 blockedWall() 立即感知新注册的 DE 城墙与城门
    (layer as any).gateSpriteSet = null;
    (layer as any).ringBox = undefined;

    // 若当前地图中心 (worldCX, worldCY) 视野内没有城墙/城门（例如 acam2_4 地图正中心是宽阔河面，城墙与城门在北岸/西岸城池），
    // 自动将初始镜头对准离中心最近的主城门或石墙，确保打开即见城防与城墙
    if (layer.wallGates.length > 0 && layer.tacticalPanX === 0 && layer.tacticalPanY === 0) {
        const hasWallNearCenter = layer.wallGates.some(
            (w) => Math.abs(w.x - worldCX) < 720 && Math.abs(w.y - worldCY) < 420
        );
        if (!hasWallNearCenter) {
            const gates = layer.wallGates.filter((w) => w.key === 'STONE_GATE');
            const stoneWalls = layer.wallGates.filter((w) => w.key === 'STONE_WALL' || w.key === 'FORTIFIED_WALL');
            const pool = gates.length > 0 ? gates : (stoneWalls.length > 0 ? stoneWalls : layer.wallGates);
            let best = pool[0];
            let bestD = Math.hypot(best.x - worldCX, best.y - worldCY);
            for (const w of pool) {
                const d = Math.hypot(w.x - worldCX, w.y - worldCY);
                if (d < bestD) {
                    bestD = d;
                    best = w;
                }
            }
            if (best) {
                const z = layer.tacticalZoom || 1;
                layer.tacticalPanX = (worldCX - best.x) * z;
                layer.tacticalPanY = (worldCY - best.y) * z;
            }
        }
    }
}
