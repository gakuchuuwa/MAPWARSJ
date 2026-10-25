/**
 * Scene13DeCampaignLoader — 236 张 AoE2 DE 战役地图加载与方式二（原样城防/关隘/城墙/城门/箭塔/城堡/建筑）落盘器
 *
 * 核心职责：
 *   1. 将 DE 剧情地图 JSON（`/de-maps/campaign/${id}.json`）的菱形瓦片网格（W × H）无损双射到
 *      `Scene13GroundLayerGL` 的屏幕矩形网格（N × N），使 WebGL 水体、岸线浪花、草沙林泥过渡、
 *      高程光影与 DE 原始物件 100% 像素级对齐（1:1 原生 96×48 比例）。
 *   2. 方式二（主人定「所有的建筑归属为防守方」）：
 *      将 DE 地图里预设好的城墙、木栅栏、城门、箭塔、火炮塔、城堡、城镇中心、兵营、靶场、马厩、
 *      攻城武器厂、铁匠铺、市场、修道院、大学、奇观、民居、蒙古包、行军帐、哨站、桥梁、树木、岩石
 *      按精确坐标与朝向原样搬进 `Scene13WarLayer`：
 *        - 城墙 / 木栅栏 / 城门 → `wallGates`（f = 1，带碰撞阻挡与破墙/破门坍塌链）
 *        - 箭塔 / 火炮塔 / 哨塔 → `arrowTowers` + `defBuildings`（f = 1，自动索敌射箭）
 *        - 城堡 → `castleTowers` + `cityBuildings` + `defBuildings`（f = 1，多箭齐发 + 重点打击目标）
 *        - 其余建筑 → 守方（f = 1，`trackCityBuilding`）或攻方营区内的营帐（f = 0，`registerDefBuilding`）
 *        - 桥梁 → 地面层装饰（`z: -5`，无碰撞阻挡、不可摧毁）
 */

import { Scene13GroundLayerGL, resolveNatureSprite } from './Scene13GroundLayerGL';
import { WALL_GATE_STATS } from './Scene13UnitTables';
import type { DecorSprite } from './Scene13Types';
import type { Scene13WarLayer } from '../Scene13WarLayer';

export interface DeCampaignSpriteMeta {
    w: number;
    h: number;
    ax: number;
    ay: number;
    layer?: string;
}

let spriteMetaPromise: Promise<Record<string, DeCampaignSpriteMeta>> | null = null;
let spriteMetaCache: Record<string, DeCampaignSpriteMeta> | null = null;

/** 异步加载并缓存 `/de-maps/campaign/sprites.json` */
export function ensureDeCampaignSpriteMeta(): Promise<Record<string, DeCampaignSpriteMeta>> {
    if (spriteMetaCache) return Promise.resolve(spriteMetaCache);
    if (!spriteMetaPromise) {
        spriteMetaPromise = fetch('/de-maps/campaign/sprites.json')
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

/** 同步读取已缓存的 DE 战役精灵元数据 */
export function getDeCampaignSpriteMetaSync(key: string): DeCampaignSpriteMeta | undefined {
    return spriteMetaCache ? spriteMetaCache[key] : undefined;
}

/**
 * 加载 `/de-maps/campaign/${deMapId}.json` 并将其从 DE 菱形网格 (tx, ty) 转换为
 * `Scene13GroundLayerGL` 直接消费的屏幕正交网格 (gx, gy)，标记 `noTranspose: true, isDeCampaign: true`。
 */
export async function loadDeCampaignMapForGround(deMapId: string): Promise<any> {
    const cleanId = deMapId.replace(/\.json$/i, '');
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

const WALL_IDS = new Set([
    72, 117, 119, 155, 231, 370, 788, 1062, 1090, 1218, 1219, 1220, 1396, 1397, 1398, 1399,
]);

const GATE_MAIN_IDS = new Set([
    63, 64, 78, 85, 88, 487, 490, 659, 667, 668, 789, 793, 797, 801,
    1379, 1383, 1387, 1391, 1579, 1583, 1587,
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
const TC_ANNEX_IDS = new Set([618, 619, 620, 621]);

const RUBBLE_OR_DECOR_SKIP_OBSTRUCTION = new Set([
    143, 144, 145, 146, 147, 148, 154, 192, 863, 864, 865,
    1182, 1183, 1184, 1185, 1493, 1494, 1495,
]);

/** 根据 DE 精灵名前缀与建筑类别映射我方坍塌动画族名（确保打爆后播放对应尺寸与风格的 DE 坍塌动画与残骸） */
function resolveDestrFamilyName(spriteKey: string, kind: string, fallbackStyle: string): string {
    const m = /^b_([a-z]+)_/i.exec(spriteKey || '');
    const rawPrefix = m ? m[1].toUpperCase() : '';
    const validStyles = new Set(['WEST', 'EAST', 'ASIA', 'ORIE', 'MESO', 'MEDI', 'SLAV', 'AFRI', 'INDI', 'SEAS', 'CEAS']);
    const style = validStyles.has(rawPrefix) ? rawPrefix : (validStyles.has(fallbackStyle) ? fallbackStyle : 'WEST');

    if (spriteKey.includes('yurt')) return 'YURT_E';
    if (spriteKey.includes('hut')) return 'HUT_A';
    if (spriteKey.includes('tent')) return 'GREEK_WAR_TENT';
    switch (kind) {
        case 'CASTLE': return `${style}_CASTLE`;
        case 'TOWER': return `${style}_TOWER_AGE3`;
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
function classifyDeBuilding(uid: number, name: string, spriteKey: string): { kind: string; footprint: number; shootCapable: boolean } | null {
    const up = (name || '').toUpperCase();
    const sp = (spriteKey || '').toLowerCase();

    if (TC_MAIN_IDS.has(uid) || up.startsWith('TWNC') || sp.includes('town_center')) {
        return { kind: 'TOWN_CENTER', footprint: 1.8, shootCapable: true };
    }
    if (uid === 12 || uid === 498 || up.startsWith('BRKS') || sp.includes('barracks')) {
        return { kind: 'BARRACKS', footprint: 1.4, shootCapable: true };
    }
    if (uid === 87 || up.startsWith('ARRG') || sp.includes('archery_range')) {
        return { kind: 'ARCHERY_RANGE', footprint: 1.4, shootCapable: true };
    }
    if (uid === 101 || up.startsWith('STBL') || sp.includes('stable')) {
        return { kind: 'STABLE', footprint: 1.4, shootCapable: true };
    }
    if (uid === 49 || up.startsWith('ulp') || up.startsWith('SGWS') || sp.includes('siege_workshop')) {
        return { kind: 'SIEGE_WORKSHOP', footprint: 1.4, shootCapable: true };
    }
    if (uid === 103 || up.startsWith('BLAC') || sp.includes('blacksmith')) {
        return { kind: 'BLACKSMITH', footprint: 1.3, shootCapable: true };
    }
    if (uid === 84 || uid === 110 || uid === 45 || uid === 805 || uid === 1189 || uid === 1754 ||
        up.startsWith('MRKT') || up.startsWith('DOCK') || sp.includes('market') || sp.includes('dock') || sp.includes('trade_workshop') || sp.includes('caravanserai')) {
        return { kind: 'MARKET', footprint: 1.5, shootCapable: true };
    }
    if (uid === 104 || uid === 31 || uid === 445 || uid === 655 || uid === 872 || uid === 1216 || uid === 1264 || uid === 1712 ||
        up.startsWith('MNST') || sp.includes('monastery') || sp.includes('church') || sp.includes('mosque') || sp.includes('pagoda') || sp.includes('temple') || sp.includes('shrine') || sp.includes('cathedral')) {
        return { kind: 'MONASTERY', footprint: 1.4, shootCapable: true };
    }
    if (uid === 209 || uid === 599 || up.startsWith('UNIV') || sp.includes('university')) {
        return { kind: 'UNIVERSITY', footprint: 1.5, shootCapable: true };
    }
    if (uid === 276 || uid === 251 || uid === 263 || uid === 689 || uid === 690 || uid === 696 || uid === 899 || uid === 1369 || uid === 1622 ||
        up.startsWith('WOND') || sp.includes('wonder') || sp.includes('pyramid') || sp.includes('amphitheatre') || sp.includes('colosseum') || sp.includes('monument') || sp.includes('palace')) {
        return { kind: 'WONDER', footprint: 2.0, shootCapable: true };
    }
    if (uid === 68 || uid === 130 || uid === 562 || uid === 584 || uid === 1081 || uid === 1711 || uid === 1734 ||
        up.startsWith('MILL') || sp.includes('mill') || sp.includes('lumber_camp') || sp.includes('mining_camp') || sp.includes('folwark') || sp.includes('pasture')) {
        return { kind: 'MILL', footprint: 1.1, shootCapable: true };
    }
    if (uid === 598 || up.startsWith('OUTP') || sp.includes('outpost')) {
        return { kind: 'OUTPOST', footprint: 0.9, shootCapable: false };
    }
    if (uid === 70 || uid === 191 || uid === 463 || uid === 464 ||
        (uid >= 624 && uid <= 626) || (uid >= 712 && uid <= 719) ||
        (uid >= 1082 && uid <= 1088) || (uid >= 1097 && uid <= 1101) ||
        (uid >= 1196 && uid <= 1200) || (uid >= 1832 && uid <= 1835) ||
        up.startsWith('HOUS') || up.startsWith('YURT') || sp.includes('house') || sp.includes('yurt') || sp.includes('hut') || sp.includes('tent') || sp.includes('pavilion')) {
        const isCampTent = sp.includes('tent') || sp.includes('yurt') || sp.includes('hut');
        return { kind: 'HOUSE', footprint: 1.0, shootCapable: !isCampTent };
    }
    // 兜底：凡是 b_ 开头且不是废墟/桥梁/墙门的建筑精灵，一律归入可攻击建筑
    if (sp.startsWith('b_') && !sp.includes('rubble') && !sp.includes('wall') && !sp.includes('gate') && !sp.includes('bridge')) {
        return { kind: 'HOUSE', footprint: 1.1, shootCapable: true };
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

    // 预扫描城门立柱附属件 (GATE_POST_IDS) 与城镇中心附属件 (TC_ANNEX_IDS)，以便挂到主件上同步坍塌
    const gatePosts: Array<{ ob: any; pos: { x: number; y: number }; used: boolean }> = [];
    const tcAnnexes: Array<{ ob: any; pos: { x: number; y: number }; sp: DecorSprite }> = [];

    for (const ob of rawObjects) {
        if (!ob || !ob.sprite) continue;
        const uid: number = ob.unit;
        if (GATE_POST_IDS.has(uid)) {
            gatePosts.push({ ob, pos: toScreen(ob.x, ob.y), used: false });
        }
    }

    for (const ob of rawObjects) {
        if (!ob || !ob.sprite) continue;
        const uid: number = ob.unit;
        const name: string = ob.name || '';
        const spriteKey: string = ob.sprite;
        const pos = toScreen(ob.x, ob.y);

        // 城门立柱由城门主件统一挂载进 extraSprites，此处不单独重复落盘
        if (GATE_POST_IDS.has(uid)) continue;

        const assetKey = `DECAMP:${spriteKey}`;

        // 1. 桥梁：地面层装饰（z = -5，无阻挡、不可摧毁）
        if (BRIDGE_IDS.has(uid) || spriteKey.includes('bridge')) {
            layer.ensureNatureAsset(assetKey);
            layer.decorSprites.push({
                asset: assetKey,
                frame: ob.frame ?? 0,
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
        if ((GATE_MAIN_IDS.has(uid) || spriteKey.includes('gate')) && !ob.annex) {
            layer.ensureNatureAsset(assetKey);
            const isWoodGate = spriteKey.includes('palisade') || spriteKey.includes('fence');
            const st = isWoodGate ? WALL_GATE_STATS.WOOD_WALL : WALL_GATE_STATS.STONE_GATE;
            const mainSp: DecorSprite = {
                asset: assetKey,
                frame: ob.frame ?? 0,
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
                    const postAsset = `DECAMP:${gp.ob.sprite}`;
                    layer.ensureNatureAsset(postAsset);
                    const postSp: DecorSprite = {
                        asset: postAsset,
                        frame: gp.ob.frame ?? 0,
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
            const isNE = spriteKey.includes('_ne') || uid === 63 || uid === 64 || uid === 85 || uid === 659 || uid === 667 ||
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

        // 3. 城墙 / 木栅栏 / 海墙：注册进 wallGates (f = 1)
        if (WALL_IDS.has(uid) || (spriteKey.includes('wall') && !spriteKey.includes('rubble'))) {
            layer.ensureNatureAsset(assetKey);
            const isWood = uid === 72 || uid === 119 || spriteKey.includes('palisade') || spriteKey.includes('fence');
            const isFortified = uid === 155 || uid === 370 || spriteKey.includes('fortified');
            const wKey: 'WOOD_WALL' | 'STONE_WALL' | 'FORTIFIED_WALL' = isWood
                ? 'WOOD_WALL'
                : isFortified
                    ? 'FORTIFIED_WALL'
                    : 'STONE_WALL';
            const st = WALL_GATE_STATS[wKey];
            const wallSp: DecorSprite = {
                asset: assetKey,
                frame: ob.frame ?? 0,
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

        // 4. 箭塔 / 火炮塔 / 哨塔：注册进 arrowTowers + defBuildings (f = 1)
        if (TOWER_IDS.has(uid) || (spriteKey.includes('tower') && !spriteKey.includes('siege_tower') && !spriteKey.includes('bell_tower'))) {
            layer.ensureNatureAsset(assetKey);
            const towerSp: DecorSprite = {
                asset: assetKey,
                frame: ob.frame ?? 0,
                x: pos.x,
                y: pos.y,
                flip: false,
                layer: 'world',
                z: 1,
                obstruction: { x: 1.0, y: 1.0 },
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: false,
            };
            layer.decorSprites.push(towerSp);

            const towerKind = uid === 236 ? 'BOMBARD_TOWER' : uid === 235 ? 'KEEP' : uid === 234 ? 'GUARD_TOWER' : 'TOWER';
            const famName = resolveDestrFamilyName(spriteKey, 'TOWER', defStyle);
            layer.ensureDestrAssetsFor(famName);
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
            layer.registerDefBuilding(towerSp, famName, towerObj, towerKind, 1);
            continue;
        }

        // 5. 城堡 / 堡垒：注册进 castleTowers + trackCityBuilding (f = 1)
        if (CASTLE_IDS.has(uid) || spriteKey.includes('castle') || spriteKey.includes('krepost') || spriteKey.includes('donjon')) {
            layer.ensureNatureAsset(assetKey);
            const castleSp: DecorSprite = {
                asset: assetKey,
                frame: ob.frame ?? 0,
                x: pos.x,
                y: pos.y,
                flip: false,
                layer: 'world',
                z: 2,
                obstruction: { x: 2.0, y: 2.0 },
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: false,
            };
            layer.decorSprites.push(castleSp);

            const famName = resolveDestrFamilyName(spriteKey, 'CASTLE', defStyle);
            layer.ensureDestrAssetsFor(famName);
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

        // 6. 城镇中心附属件 (618..621)：先落盘为世界精灵，随后绑定到最近的城镇中心主件上同步坍塌
        if (TC_ANNEX_IDS.has(uid) || ob.annex) {
            layer.ensureNatureAsset(assetKey);
            const annexSp: DecorSprite = {
                asset: assetKey,
                frame: ob.frame ?? 0,
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
        const bldInfo = classifyDeBuilding(uid, name, spriteKey);
        if (bldInfo) {
            layer.ensureNatureAsset(assetKey);
            const bldSp: DecorSprite = {
                asset: assetKey,
                frame: ob.frame ?? 0,
                x: pos.x,
                y: pos.y,
                flip: false,
                layer: 'world',
                z: bldInfo.kind === 'WONDER' ? 2 : 1,
                obstruction: { x: bldInfo.footprint, y: bldInfo.footprint },
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: false,
            };
            layer.decorSprites.push(bldSp);

            const famName = resolveDestrFamilyName(spriteKey, bldInfo.kind, defStyle);
            layer.ensureDestrAssetsFor(famName);

            if (isInsideAttackerCamp(pos.x, pos.y)) {
                layer.registerDefBuilding(bldSp, famName, undefined, bldInfo.kind, 0);
            } else if (bldInfo.shootCapable) {
                layer.trackCityBuilding(bldSp, bldInfo.kind, famName);
            } else {
                layer.registerDefBuilding(bldSp, famName, undefined, bldInfo.kind, 1);
            }
            continue;
        }

        // 8. 树木 / 岩石 / 自然点缀 / 废墟道具
        const nat = resolveNatureSprite(name);
        if (nat) {
            const [type, dir] = nat;
            if (type === 'NATURE') {
                const natAsset = dir;
                layer.ensureNatureAsset(natAsset);
                const isTree = !dir.startsWith('GRASS') && !dir.startsWith('PLANT') && !dir.startsWith('FLOWER') &&
                    !dir.startsWith('FERN') && !dir.startsWith('UNDERBRUSH') && !dir.startsWith('WEED') && !dir.startsWith('REEDS');
                layer.decorSprites.push({
                    asset: natAsset,
                    frame: ob.frame ?? 0,
                    x: pos.x,
                    y: pos.y,
                    flip: false,
                    layer: 'world',
                    z: isTree ? 0 : -5,
                    indestructible: true,
                    obstruction: isTree ? { x: 0.45, y: 0.45 } : undefined,
                    obstructionContactSec: 0,
                    obstructionTouched: false,
                    obstructionDisabled: !isTree,
                });
                continue;
            }
        }

        // 其余场景道具（旗帜、雕像、火炬、路牌、废墟、帐篷饰物等）直接使用 DECAMP 精灵渲染
        layer.ensureNatureAsset(assetKey);
        const isGroundFlat = RUBBLE_OR_DECOR_SKIP_OBSTRUCTION.has(uid) ||
            spriteKey.includes('rubble') || spriteKey.includes('rug') || spriteKey.includes('crater') ||
            spriteKey.includes('skeleton') || spriteKey.includes('grave') || spriteKey.includes('plant') ||
            spriteKey.includes('grass') || spriteKey.includes('flower') || spriteKey.includes('bush');
        layer.decorSprites.push({
            asset: assetKey,
            frame: ob.frame ?? 0,
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

    // 将未配对的城门立柱作为普通装饰落盘，避免缺失门柱画面
    for (const gp of gatePosts) {
        if (gp.used) continue;
        const postAsset = `DECAMP:${gp.ob.sprite}`;
        layer.ensureNatureAsset(postAsset);
        layer.decorSprites.push({
            asset: postAsset,
            frame: gp.ob.frame ?? 0,
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
        const tcBuildings = layer.defBuildings.filter((b) => b.key === 'TOWN_CENTER' || b.bld?.name?.includes('TOWN_CENTER'));
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
}
