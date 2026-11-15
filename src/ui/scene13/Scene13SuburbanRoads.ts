/**
 * 战术模式（Scene13）城郊连续护城河门桥 + 蜿蜒残破石路（Road / Broken Road）与村落支路生成烘焙器：
 *   1. 按守方建筑风格与城门材质，选配 AoE2 DE 原版跨护城河实体石拱桥 / 原木栈桥（DECAMP:*）。
 *   2. 沿城门向外铺设自然微弯的主干官道，遇正对攻方大营的通途可顺势延至敌营外沿，遇天然水岸则收束止步。
 *   3. 为城郊落地的附郭农庄磨坊、关厢集市、名胜古刹、前哨军营、伐木场、采矿场与船坞生成斜向平滑分叉的残破乡道。
 *   4. 底层由 WebGL carveFoundation 刻出当地泥土路肩，上层按世界坐标平铺 DE 原版 rd1/rd2/sr2/rd5 碎石贴图并叠合
 *      masks/road_broken / road_gravel 碎石齿状蒙版，按高程抬升逐块烘焙成无接缝的「碎石板镶泥边」离线图块。
 */
import type { Scene13WarLayer } from '../Scene13WarLayer';
import type { Scene13GroundLayerGL } from './Scene13GroundLayerGL';
import { TAC_TILE_W, TAC_TILE_H } from './Scene13GroundLayerGL';
import { markDeCampaignSpriteHighPriority } from './Scene13DeCampaignLoader';

export type BridgeFamily = 'medieval_stone' | 'asian_stone' | 'roman_stone' | 'wood';
export type BridgeAxis = 'i' | 'j';

export interface MoatBridgeProfile {
    family: BridgeFamily;
    scale: number;
    pieceDistCells: readonly [number, number, number];
    bridgeDIn: number;
    bridgeDOut: number;
    footRadiusCells: number;
}

export interface GateDescriptor {
    x: number;
    y: number;
    axis: BridgeAxis;
    sign: 1 | -1;
    gi: number;
    gj: number;
    isWoodGate: boolean;
    stepX: number;
    stepY: number;
    bridgeProfile?: MoatBridgeProfile;
}

export interface RoadPoint {
    x: number;
    y: number;
    dist: number;
    u: number;
    halfW: number;
    brokenness: number;
    overMoat: boolean;
    dirX: number;
    dirY: number;
}

export interface RoadCurve {
    id: string;
    kind: 'trunk' | 'branch';
    gateIndex?: number;
    points: RoadPoint[];
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export interface SuburbanRoadTarget {
    kind: 'hamlet' | 'dock' | 'lumber' | 'mine' | 'outpost' | 'trade' | 'shrine';
    x: number;
    y: number;
}

export interface SuburbanRoadChunk {
    cv: HTMLCanvasElement;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface RoadPavingStyle {
    mode: 'none' | 'cobble' | 'mossy' | 'gravel';
    primaryUrl: string;
    secondaryUrl: string;
    maskUrl: string;
    winterFrost: number;
    baseBrokenness: number;
}

const ROAD_TILE_SIZE = 512;
const CHUNK_W = 192;
const CHUNK_H = 96;

/** 中立桥件三段组合表：按 [A(SW↙→NE↗), B(NW↖→SE↘)] 的 [近端, 中段, 远端] 精灵键排列 */
export const GAIA_BRIDGE_SEQUENCES: Readonly<Record<BridgeFamily, {
    aSwToNe: readonly [string, string, string];
    bNwToSe: readonly [string, string, string];
}>> = {
    medieval_stone: {
        aSwToNe: ['5f12491a00d3', '525e31115a05', 'd7aca08e45c2'],
        bNwToSe: ['de9f767564ef', 'a23ab1014247', 'e0beda99ad86'],
    },
    asian_stone: {
        aSwToNe: ['08c578ead8e0', '2d4cdd781bda', '2cd1eefd4889'],
        bNwToSe: ['3772e2eaeff2', '5c6142e06e14', '8b499e998ec7'],
    },
    roman_stone: {
        aSwToNe: ['9180d0ca58d8', '60f2dcbd0c48', '6fdd352c8209'],
        bNwToSe: ['ab0028aa4db2', '287b98559724', '586a12c1134b'],
    },
    wood: {
        aSwToNe: ['7cdbf4c261b7', 'f2ab29bbf740', 'bb24b7f339f8'],
        bNwToSe: ['ec4a8c7f16f1', '698866fc98aa', 'c35fa5c5657c'],
    },
};

/** 依守方文化与城墙材质决定跨护城河桥梁风格、缩放与河岸收束参数 */
export function resolveMoatBridgeProfile(opts: {
    moatW: number;
    isWoodGate: boolean;
    deStyle: string;
    cultStyle: string;
}): MoatBridgeProfile {
    let family: BridgeFamily;
    if (opts.isWoodGate) {
        family = 'wood';
    } else if (
        opts.deStyle === 'ASIA' || opts.deStyle === 'SEAS' || opts.deStyle === 'INDI' || opts.deStyle === 'PURU'
        || /^(CENTRAL|WEI|JIANGNAN|HUGUANG|BASHU|NORTHEAST|KOREA|JAPAN|HEXI|TIBET|TIBET_CASTLE|TIBET_IMPERIAL|YARLUNG|INDIA|PURU|BENGALIS|GURJARAS|BURMESE|KHMER|VIETNAMESE|MALAY|CHAMPA|JAVANESE|SIAMESE|MON|DIANQIAN|CHAOXIAN)$/.test(opts.cultStyle)
    ) {
        family = 'asian_stone';
    } else if (
        opts.deStyle === 'GREEK' || opts.deStyle === 'THRACIAN' || opts.deStyle === 'MEDI'
        || opts.deStyle === 'ORIE' || opts.deStyle === 'PERSIAN' || opts.deStyle === 'CEAS'
        || /^(ROMA|BYZANTINE|GREECE|GREEK|ATHENIANS|SPARTANS|MACEDONIAN|THRACIAN|SICILIANS|ITALIANS|ORIE|WEST_ASIA|PERSIAN|SASANIAN|CENTRAL_ASIA|ARMENIANS|GEORGIANS)$/.test(opts.cultStyle)
    ) {
        family = 'roman_stone';
    } else {
        family = 'medieval_stone';
    }

    if (opts.moatW >= 3) {
        return {
            family,
            scale: 0.88,
            pieceDistCells: [1.68, 3.44, 5.20],
            bridgeDIn: 1.85,
            bridgeDOut: 5.03,
            footRadiusCells: 1.15,
        };
    }
    if (opts.moatW === 2) {
        return {
            family,
            scale: 0.76,
            pieceDistCells: [1.54, 3.06, 4.58],
            bridgeDIn: 1.82,
            bridgeDOut: 4.30,
            footRadiusCells: 1.05,
        };
    }
    if (family === 'wood') {
        return {
            family: 'wood',
            scale: 1.18,
            pieceDistCells: [1.46, 2.64, 3.82],
            bridgeDIn: 1.78,
            bridgeDOut: 3.50,
            footRadiusCells: 0.92,
        };
    }
    return {
        family,
        scale: 0.64,
        pieceDistCells: [1.36, 2.64, 3.92],
        bridgeDIn: 1.78,
        bridgeDOut: 3.50,
        footRadiusCells: 0.96,
    };
}

/** 按桥朝向 [axis, outwardSign] 严格排定从内岸向外观外岸的三段精灵键 */
export function bridgePieceSequence(
    family: BridgeFamily,
    axis: BridgeAxis,
    sign: 1 | -1,
): readonly [string, string, string] {
    const seq = GAIA_BRIDGE_SEQUENCES[family];
    if (axis === 'j') {
        // j=-1 为东北向 (+48,-24)，即 SW↙ → NE↗；j=+1 为西南向 (-48,+24)，反序
        return sign < 0 ? seq.aSwToNe : [seq.aSwToNe[2], seq.aSwToNe[1], seq.aSwToNe[0]];
    }
    // i=+1 为东南向 (+48,+24)，即 NW↖ → SE↘；i=-1 为西北向 (-48,-24)，反序
    return sign > 0 ? seq.bNwToSe : [seq.bNwToSe[2], seq.bNwToSe[1], seq.bNwToSe[0]];
}

/** 按气候、城型与建筑文化选配 DE 道路干净无缝贴图与蒙版（绝不触碰带水印 o_rd* / o_sr*） */
export function resolveRoadPavingStyle(opts: {
    cityType: string;
    isWallLessYurt: boolean;
    isSnow: boolean;
    isArid: boolean;
    isHumidForest?: boolean;
    deStyle: string;
    cultStyle: string;
}): RoadPavingStyle {
    if (opts.isWallLessYurt) {
        return {
            mode: 'none',
            primaryUrl: '',
            secondaryUrl: '',
            maskUrl: '',
            winterFrost: 0,
            baseBrokenness: 1,
        };
    }
    const isLushSubtropical = opts.isHumidForest
        || opts.deStyle === 'SEAS' || opts.deStyle === 'PURU' || opts.deStyle === 'INDI'
        || opts.deStyle === 'MESO' || opts.deStyle === 'ANDE'
        || /^(JIANGNAN|HUGUANG|BASHU|LINGNAN|VIETNAMESE|KHMER|MALAY|CHAMPA|JAVANESE|SIAMESE|MON|BENGALIS|DIANQIAN)$/.test(opts.cultStyle);

    if (opts.isSnow || opts.isArid || opts.cityType === 'stockade' || opts.cityType === 'pass') {
        return {
            mode: 'gravel',
            primaryUrl: (opts.isSnow || opts.cityType === 'stockade') ? '/SUCAI_TERRAIN/rd5.png' : '/SUCAI_TERRAIN/rd1.png',
            secondaryUrl: '/SUCAI_TERRAIN/rd5.png',
            maskUrl: '/SUCAI_TERRAIN/masks/road_gravel.png',
            winterFrost: opts.isSnow ? 0.24 : 0,
            baseBrokenness: opts.cityType === 'stockade' ? 0.56 : opts.cityType === 'pass' ? 0.28 : 0.24,
        };
    }
    if (isLushSubtropical) {
        return {
            mode: 'mossy',
            primaryUrl: '/SUCAI_TERRAIN/rd1.png',
            secondaryUrl: '/SUCAI_TERRAIN/sr2.png',
            maskUrl: '/SUCAI_TERRAIN/masks/road_broken.png',
            winterFrost: 0,
            baseBrokenness: opts.cityType === 'small_city' ? 0.30 : (opts.cityType === 'medium_city' ? 0.20 : 0.14),
        };
    }
    return {
        mode: 'cobble',
        primaryUrl: '/SUCAI_TERRAIN/rd1.png',
        secondaryUrl: '/SUCAI_TERRAIN/rd2.png',
        maskUrl: '/SUCAI_TERRAIN/masks/road_broken.png',
        winterFrost: 0,
        baseBrokenness: opts.cityType === 'big_city' ? 0.10 : (opts.cityType === 'medium_city' ? 0.18 : 0.28),
    };
}

/** 从守方 wallGates 提取城门描述：险要双圈优先取外圈每边代表门，避免内墙穿线和同边双干道并行 */
export function selectPrimaryOuterGates(
    wallGates: ReadonlyArray<{ f: number; key: string; x: number; y: number; rubbleAsset?: string; sprite?: { asset: string } }>,
    cx: number,
    cy: number,
    cityType: string,
    atkCen?: { x: number; y: number } | null,
): GateDescriptor[] {
    const raw = wallGates.filter((b) => b.f === 1 && /GATE/.test(b.key));
    if (raw.length === 0) return [];

    const mapped = raw.map((gt) => {
        const gu = (gt.x - cx) / (TAC_TILE_W / 2);
        const gv = (gt.y - cy) / (TAC_TILE_H / 2);
        const gi = (gu + gv) / 2 - 0.5;
        const gj = (gv - gu) / 2 - 0.5;
        const spAsset = gt.sprite?.asset ?? '';
        const isWoodGate = /PALISADE|FENCE/.test(spAsset) || gt.rubbleAsset === 'BATTLEFIELD:FENCE_RUBBLE';
        return { x: gt.x, y: gt.y, gi, gj, isWoodGate };
    });

    const maxI = Math.max(1, ...mapped.map((g) => Math.abs(g.gi)));
    const maxJ = Math.max(1, ...mapped.map((g) => Math.abs(g.gj)));
    let candidates = mapped;
    if (cityType === 'pass' && mapped.length > 4) {
        const outerOnly = mapped.filter((g) => Math.max(Math.abs(g.gi) / maxI, Math.abs(g.gj) / maxJ) >= 0.84);
        if (outerOnly.length >= 2) candidates = outerOnly;
    }

    const withAxis: GateDescriptor[] = candidates.map((g) => {
        const ni = Math.abs(g.gi) / maxI;
        const nj = Math.abs(g.gj) / maxJ;
        const axis: BridgeAxis = ni >= nj ? 'i' : 'j';
        const sign: 1 | -1 = (axis === 'i' ? g.gi : g.gj) >= 0 ? 1 : -1;
        const outDi = axis === 'i' ? sign : 0;
        const outDj = axis === 'j' ? sign : 0;
        return {
            ...g,
            axis,
            sign,
            stepX: (outDi - outDj) * (TAC_TILE_W / 2),
            stepY: (outDi + outDj) * (TAC_TILE_H / 2),
        };
    });

    if (cityType === 'pass' && withAxis.length > 4) {
        // 每条边若开两扇门（8 门外圈），仅取面向攻方或更开阔侧的一扇作为主官道出口
        const bySide = new Map<string, GateDescriptor[]>();
        for (const gd of withAxis) {
            const sk = `${gd.axis}_${gd.sign}`;
            const arr = bySide.get(sk);
            if (arr) arr.push(gd);
            else bySide.set(sk, [gd]);
        }
        const chosen: GateDescriptor[] = [];
        const ax = atkCen ? atkCen.x - cx : 0;
        const ay = atkCen ? (atkCen.y - cy) * 2 : 0;
        for (const group of bySide.values()) {
            if (group.length === 1) {
                chosen.push(group[0]);
                continue;
            }
            group.sort((a, b) => {
                const da = atkCen ? Math.hypot(a.x - atkCen.x, (a.y - atkCen.y) * 2) : Math.hypot(a.x - cx, (a.y - cy) * 2);
                const db = atkCen ? Math.hypot(b.x - atkCen.x, (b.y - atkCen.y) * 2) : Math.hypot(b.x - cx, (b.y - cy) * 2);
                return (ax === 0 && ay === 0) ? (da - db) : (da - db);
            });
            chosen.push(group[0]);
        }
        return chosen;
    }

    return withAxis;
}

/** 在护城河各门架设 AoE2 DE 实体石拱桥 / 原木栈桥并标记桥梁可行走通行格 */
export function spawnMoatGateBridges(
    layer: Scene13WarLayer,
    gl: Scene13GroundLayerGL,
    gates: readonly GateDescriptor[],
    moatW: number,
    deStyle: string,
    cultStyle: string,
    W: number,
    H: number,
): void {
    gl.clearBridgeFootprints();
    for (const gt of gates) {
        const prof = resolveMoatBridgeProfile({
            moatW,
            isWoodGate: gt.isWoodGate,
            deStyle,
            cultStyle,
        });
        gt.bridgeProfile = prof;
        const seq = bridgePieceSequence(prof.family, gt.axis, gt.sign);
        const gateLift = layer.elevationLiftAt(gt.x, gt.y);

        for (let pi = 0; pi < 3; pi++) {
            const spKey = seq[pi];
            const distCells = prof.pieceDistCells[pi];
            const bx = gt.x + gt.stepX * distCells;
            const by = gt.y + gt.stepY * distCells;
            markDeCampaignSpriteHighPriority(spKey);
            layer.ensureNatureAsset('DECAMP:' + spKey);
            const sp: any = {
                asset: 'DECAMP:' + spKey,
                frame: 0,
                x: bx,
                y: by,
                flip: false,
                layer: 'world' as const,
                z: -5,
                lift: gateLift,
                scale: prof.scale,
                indestructible: true,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
                moatBridge: true,
            };
            layer.decorSprites.push(sp);
        }

        // 沿整座桥面密集登记桥面足迹格（从内岸边到外岸边），保持移速=1.0且消除涉水涟漪与沉尸
        const sStart = prof.bridgeDIn - 0.35;
        const sEnd = prof.bridgeDOut + 0.35;
        for (let s = sStart; s <= sEnd; s += 0.32) {
            const px = gt.x + gt.stepX * s;
            const py = gt.y + gt.stepY * s;
            gl.markBridgeFootprint(px, py, W, H, prof.footRadiusCells);
        }
    }
}

function createRoadCurve(id: string, kind: 'trunk' | 'branch', pts: RoadPoint[], gateIndex?: number): RoadCurve {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(pts.length - 1, i + 1)];
        const dx = next.x - prev.x;
        const dy = (next.y - prev.y) * 2;
        const len = Math.hypot(dx, dy) || 1;
        p.dirX = dx / len;
        p.dirY = dy / len;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    return { id, kind, gateIndex, points: pts, minX, maxX, minY, maxY };
}

/** 生成从城门过桥、沿地形平滑微弯延伸至城郊与攻方大营外沿的主干官道 */
export function buildCurvedGateTrunkRoads(opts: {
    gates: readonly GateDescriptor[];
    cityType: string;
    moatOn: boolean;
    ringLm: number;
    hash: number;
    cx: number;
    cy: number;
    atkCen?: { x: number; y: number } | null;
    gl: Pick<Scene13GroundLayerGL, 'screenToCell' | 'getWaterDensityAt' | 'elevationLevelAt'>;
    inMoat: ((x: number, y: number) => boolean) | null;
    W: number;
    H: number;
    baseBrokenness: number;
}): RoadCurve[] {
    const { gates, cityType, moatOn, ringLm, hash, cx, cy, atkCen, gl, inMoat, W, H, baseBrokenness } = opts;
    if (gates.length === 0) return [];

    const unitGroundPx = Math.hypot(TAC_TILE_W / 2, TAC_TILE_H); // 1 格对应地平面像素 (≈67.88px)
    const postBridgeTiles = cityType === 'big_city'
        ? 18.0
        : cityType === 'medium_city'
            ? 15.2
            : cityType === 'small_city'
                ? 13.0
                : cityType === 'pass'
                    ? 14.0
                    : 10.5;
    const postBridgeLenGround = postBridgeTiles * unitGroundPx;
    const startOffsetGround = -0.35 * unitGroundPx;
    const stepGround = 26;

    const atkDx = atkCen ? (atkCen.x - cx) : 0;
    const atkDy = atkCen ? (atkCen.y - cy) * 2 : 0;
    const atkDist = Math.hypot(atkDx, atkDy);
    const atkUx = atkDist > 1 ? atkDx / atkDist : 0;
    const atkUy = atkDist > 1 ? atkDy / atkDist : 0;

    const curves: RoadCurve[] = [];

    for (let gi = 0; gi < gates.length; gi++) {
        const gt = gates[gi];
        const stepGroundLen = Math.hypot(gt.stepX, gt.stepY * 2) || unitGroundPx;
        const ux = gt.stepX / stepGroundLen;
        const uy = (gt.stepY * 2) / stepGroundLen;
        const nx = -uy;
        const ny = ux;

        const prof = gt.bridgeProfile;
        const moatWaterMinG = (moatOn && ringLm > 0 && prof) ? ((prof.bridgeDIn + 0.10) * stepGroundLen) : 999999;
        const moatWaterMaxG = (moatOn && ringLm > 0 && prof) ? ((prof.bridgeDOut - 0.10) * stepGroundLen) : -999999;
        const bridgeBankClearG = (moatOn && ringLm > 0 && prof) ? ((prof.bridgeDOut + 1.45) * stepGroundLen) : 0;
        const bridgeOutG = (moatOn && ringLm > 0 && prof)
            ? ((prof.bridgeDOut + 0.35) * stepGroundLen)
            : stepGroundLen * 0.85;
        const bridgeClearG = (moatOn && ringLm > 0 && prof)
            ? ((prof.bridgeDOut + 1.05) * stepGroundLen)
            : stepGroundLen * 1.15;

        const baseLenGround = bridgeOutG + postBridgeLenGround;
        const alignToAtk = atkDist > 400 ? (ux * atkUx + uy * atkUy) : 0;
        const reachesAtkApproach = alignToAtk > 0.52;
        const atkTargetGroundDist = atkDist - Math.hypot(gt.x - cx, (gt.y - cy) * 2) - 340;
        const totalLenGround = reachesAtkApproach && atkTargetGroundDist > baseLenGround
            ? Math.min(baseLenGround * 1.50, atkTargetGroundDist)
            : baseLenGround;
        const effectivePostBridgeLen = Math.max(unitGroundPx * 4, totalLenGround - bridgeOutG);

        const seed = (Math.imul(hash ^ (gi * 0x9e3779b9), 0x85ebca6b) >>> 0) / 4294967296;
        const phase = seed * Math.PI * 2 + gi * 1.91;
        const curveSign = ((hash >> gi) & 1) === 0 ? 1 : -1;
        const amp1 = (68 + seed * 42) * curveSign;
        const amp2 = 28 * Math.sin(phase * 1.7);

        const baseHalfW = cityType === 'big_city'
            ? 86
            : cityType === 'medium_city'
                ? 78
                : cityType === 'pass'
                    ? 76
                    : cityType === 'small_city'
                        ? 70
                        : 58;
        const endHalfW = cityType === 'big_city'
            ? 54
            : cityType === 'medium_city'
                ? 48
                : cityType === 'pass'
                    ? 46
                    : cityType === 'small_city'
                        ? 44
                        : 36;

        // 计算面向攻方营前汇聚点，平滑向敌方来向转弯靠拢
        let atkDriftMax = 0;
        if (reachesAtkApproach && atkCen) {
            const perpToAtk = ((atkCen.x - gt.x) * nx + (atkCen.y - gt.y) * 2 * ny);
            atkDriftMax = Math.max(-280, Math.min(280, perpToAtk * 0.45));
        }

        const pts: RoadPoint[] = [];
        let curLat = 0;

        for (let gDist = startOffsetGround; gDist <= totalLenGround; gDist += stepGround) {
            const u = gDist <= bridgeOutG
                ? 0
                : Math.min(1, (gDist - bridgeOutG) / effectivePostBridgeLen);
            const ramp = gDist <= bridgeClearG
                ? 0
                : Math.min(1, (gDist - bridgeClearG) / Math.max(1, totalLenGround - bridgeClearG));
            const smoothRamp = Math.pow(ramp, 1.35);

            const targetWave = (
                Math.sin(ramp * Math.PI * 1.45 + phase) * amp1
                + Math.sin(ramp * Math.PI * 3.1 + phase * 0.6) * amp2
            ) * smoothRamp + atkDriftMax * smoothRamp * smoothRamp;

            // 沿地形斜坡微避陡峭高地
            const baseX = gt.x + ux * gDist + nx * curLat;
            const baseY = gt.y + (uy * gDist + ny * curLat) * 0.5;
            let slopeNudge = 0;
            if (ramp > 0.05) {
                const elL = gl.elevationLevelAt(baseX + nx * 64, baseY + ny * 32, W, H);
                const elR = gl.elevationLevelAt(baseX - nx * 64, baseY - ny * 32, W, H);
                if (Math.abs(elL - elR) > 0.32) {
                    slopeNudge = (elR - elL) * 24;
                }
            }
            curLat = curLat * 0.62 + (targetWave + slopeNudge) * 0.38;
            if (gDist <= bridgeClearG) curLat = 0;

            const px = gt.x + ux * gDist + nx * curLat;
            const py = gt.y + (uy * gDist + ny * curLat) * 0.5;
            const cell = gl.screenToCell(px, py, W, H);
            if (!cell) break;

            const overMoat = gDist >= moatWaterMinG && gDist <= moatWaterMaxG;
            if (!overMoat && gDist > bridgeBankClearG) {
                const wDens = gl.getWaterDensityAt(cell.gx, cell.gy);
                const moatNow = !!(inMoat && inMoat(px, py));
                if (moatNow || wDens >= 0.18) break;
            }

            const halfW = gDist < 0
                ? baseHalfW * 1.04
                : baseHalfW * (1 - u) + endHalfW * u;
            const brokenness = Math.min(0.88, baseBrokenness + 0.48 * Math.pow(u, 1.05));

            pts.push({
                x: px,
                y: py,
                dist: Math.max(0, gDist),
                u,
                halfW,
                brokenness,
                overMoat,
                dirX: ux,
                dirY: uy,
            });
        }

        if (pts.length >= 4) {
            curves.push(createRoadCurve(`trunk_${gi}`, 'trunk', pts, gi));
        }
    }

    return curves;
}

/** 将城郊已落地的村落磨坊、市集、古刹、前哨与营地用平滑斜向 Y 字分叉的碎石乡道接入官道网 */
export function buildSuburbanBranchRoads(opts: {
    trunkCurves: readonly RoadCurve[];
    targets: readonly SuburbanRoadTarget[];
    farmPlots: ReadonlyArray<{ x: number; y: number }>;
    gl: Pick<Scene13GroundLayerGL, 'screenToCell' | 'getWaterDensityAt'>;
    inMoat: ((x: number, y: number) => boolean) | null;
    inCity: (x: number, y: number) => boolean;
    W: number;
    H: number;
    hash: number;
}): RoadCurve[] {
    const { trunkCurves, targets, farmPlots, gl, inMoat, inCity, W, H, hash } = opts;
    if (trunkCurves.length === 0 || targets.length === 0) return [];

    // 优先连接主要据点村镇与商市古刹
    const priority: Record<SuburbanRoadTarget['kind'], number> = {
        hamlet: 0,
        trade: 1,
        shrine: 2,
        outpost: 3,
        lumber: 4,
        mine: 5,
        dock: 6,
    };
    const sortedTargets = [...targets].sort((a, b) => priority[a.kind] - priority[b.kind]);
    const allCurves: RoadCurve[] = [...trunkCurves];
    const branchCurves: RoadCurve[] = [];

    const checkPointSafe = (px: number, py: number, skipFarmCheck: boolean): boolean => {
        if (inCity(px, py) || (inMoat && inMoat(px, py))) return false;
        const c = gl.screenToCell(px, py, W, H);
        if (!c || gl.getWaterDensityAt(c.gx, c.gy) >= 0.14) return false;
        if (!skipFarmCheck) {
            for (const fp of farmPlots) {
                if (Math.hypot(px - fp.x, (py - fp.y) * 1.65) < 105) return false;
            }
        }
        return true;
    };

    for (let ti = 0; ti < sortedTargets.length; ti++) {
        const tgt = sortedTargets[ti];
        let bestCurve: RoadCurve | null = null;
        let bestAnchor: RoadPoint | null = null;
        let bestScore = Infinity;

        for (const cv of allCurves) {
            for (const pt of cv.points) {
                if (pt.overMoat || pt.u < 0.08 || pt.u > 0.90) continue;
                const ac = gl.screenToCell(pt.x, pt.y, W, H);
                if (!ac || gl.getWaterDensityAt(ac.gx, ac.gy) >= 0.12 || (inMoat && inMoat(pt.x, pt.y))) continue;
                const d = Math.hypot(tgt.x - pt.x, (tgt.y - pt.y) * 2);
                if (d < 145 || d > 1750) continue;
                const vx = (tgt.x - pt.x) / d;
                const vy = ((tgt.y - pt.y) * 2) / d;
                const dot = Math.abs(pt.dirX * vx + pt.dirY * vy);
                // 惩罚接近正交 90° 的分叉，鼓励斜向 Y 字自然分岔
                const anglePenalty = dot < 0.24 ? (0.24 - dot) * 650 : 0;
                const score = d + anglePenalty + (cv.kind === 'branch' ? 120 : 0);
                if (score < bestScore) {
                    bestScore = score;
                    bestCurve = cv;
                    bestAnchor = pt;
                }
            }
        }
        if (!bestCurve || !bestAnchor) continue;

        const totalDx = tgt.x - bestAnchor.x;
        const totalDyG = (tgt.y - bestAnchor.y) * 2;
        const totalG = Math.hypot(totalDx, totalDyG) || 1;
        const endUx = totalDx / totalG;
        const endUy = totalDyG / totalG;

        // 对正反向选与当前走线一致的切向（平滑叉出）
        const tangentSign = (bestAnchor.dirX * endUx + bestAnchor.dirY * endUy) >= -0.15 ? 1 : -1;
        const t1x = bestAnchor.dirX * tangentSign;
        const t1y = bestAnchor.dirY * tangentSign;
        const stopDistG = Math.min(72, Math.max(46, totalG * 0.14));
        const endX = tgt.x - endUx * stopDistG;
        const endY = tgt.y - endUy * stopDistG * 0.5;
        const spanG = Math.hypot(endX - bestAnchor.x, (endY - bestAnchor.y) * 2);
        if (spanG < 95) continue;

        const latX = -endUy;
        const latY = endUx;
        const baseSeed = ((hash ^ (ti * 0x517cc1b7)) >>> 0) / 4294967296;
        const baseBow = (0.14 + baseSeed * 0.10) * spanG;

        // 尝试原弧、反弧与加大绕行避水避农田
        const bowAttempts = [baseBow, -baseBow, baseBow * 1.9, -baseBow * 1.9];
        let builtPts: RoadPoint[] | null = null;

        for (const bow of bowAttempts) {
            const p0x = bestAnchor.x, p0yG = bestAnchor.y * 2;
            const p3x = endX, p3yG = endY * 2;
            const p1x = p0x + t1x * spanG * 0.34 + latX * bow * 0.30;
            const p1yG = p0yG + t1y * spanG * 0.34 + latY * bow * 0.30;
            const p2x = p3x - endUx * spanG * 0.30 + latX * bow * 0.72;
            const p2yG = p3yG - endUy * spanG * 0.30 + latY * bow * 0.72;

            const steps = Math.max(8, Math.ceil(spanG / 26));
            const candidate: RoadPoint[] = [];
            let blocked = false;
            for (let si = 0; si <= steps; si++) {
                const t = si / steps;
                const mt = 1 - t;
                const x = mt * mt * mt * p0x + 3 * mt * mt * t * p1x + 3 * mt * t * t * p2x + t * t * t * p3x;
                const yG = mt * mt * mt * p0yG + 3 * mt * mt * t * p1yG + 3 * mt * t * t * p2yG + t * t * t * p3yG;
                const y = yG * 0.5;
                // 起终点 10% 范围内允许擦过庭院或农庄邻近边，中间严格避水避农田
                if (si > 1 && !checkPointSafe(x, y, si >= steps - 1)) {
                    blocked = true;
                    break;
                }
                const wStart = Math.min(bestAnchor.halfW * 0.85, 56);
                const wEnd = tgt.kind === 'hamlet' || tgt.kind === 'trade' ? 42 : 36;
                const halfW = wStart * (1 - t) + wEnd * t;
                const brokenness = Math.min(0.86, Math.max(bestAnchor.brokenness, 0.36) + 0.32 * t);
                candidate.push({
                    x,
                    y,
                    dist: t * spanG,
                    u: t,
                    halfW,
                    brokenness,
                    overMoat: false,
                    dirX: 0,
                    dirY: 0,
                });
            }
            if (!blocked && candidate.length >= 4) {
                builtPts = candidate;
                break;
            }
        }

        if (builtPts) {
            const curve = createRoadCurve(`branch_${ti}_${tgt.kind}`, 'branch', builtPts);
            branchCurves.push(curve);
            allCurves.push(curve);
        }
    }

    return branchCurves;
}

/** 查询点到路网的最小地平面距离（未命中或超距返回 Infinity），用于清树、防重与避让 */
export function distanceToRoadNetworkGround(
    curves: readonly RoadCurve[],
    x: number,
    y: number,
    maxCheckMarginPx = 220,
): { distPx: number; halfW: number } {
    let bestD = Infinity;
    let bestHW = 0;
    const yG = y * 2;
    for (const cv of curves) {
        if (x < cv.minX - maxCheckMarginPx || x > cv.maxX + maxCheckMarginPx || y < cv.minY - maxCheckMarginPx || y > cv.maxY + maxCheckMarginPx) {
            continue;
        }
        const pts = cv.points;
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i + 1];
            if (a.overMoat && b.overMoat) continue;
            const ax = a.x, ay = a.y * 2;
            const bx = b.x, by = b.y * 2;
            const vx = bx - ax, vy = by - ay;
            const len2 = vx * vx + vy * vy || 1;
            const t = Math.max(0, Math.min(1, ((x - ax) * vx + (yG - ay) * vy) / len2));
            const px = ax + vx * t, py = ay + vy * t;
            const d = Math.hypot(x - px, yG - py);
            const hw = a.halfW + (b.halfW - a.halfW) * t;
            if (d < bestD) {
                bestD = d;
                bestHW = hw;
            }
        }
    }
    return { distPx: bestD, halfW: bestHW };
}

/** 判点是否落在路网净空带内（给树林剔除、城郊选址与大山避让使用） */
export function isPointOnRoadNetwork(
    curves: readonly RoadCurve[],
    x: number,
    y: number,
    extraPadPx = 38,
): boolean {
    if (curves.length === 0) return false;
    const res = distanceToRoadNetworkGround(curves, x, y, extraPadPx + 96);
    return res.distPx <= res.halfW + extraPadPx;
}

/** 为主干道外段与乡间支路清出路面树林，并在地表底层刻出泥土路基镶边（preserveWater=true 绝不侵水） */
export function carveRoadNetworkOnGround(
    curves: readonly RoadCurve[],
    gl: Pick<Scene13GroundLayerGL, 'carveFoundation'>,
    W: number,
    H: number,
    clearTreesAt: (x: number, y: number, radPx: number) => void,
): void {
    for (const cv of curves) {
        const isTrunk = cv.kind === 'trunk';
        const pts = cv.points;
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            if (p.overMoat) continue;
            // 每隔 1 个采样点刻 1 次（步距 ~26-52px），保持连续平滑土边又不冗余耗时
            if (i % 2 === 1 && i < pts.length - 1) continue;
            const radCells = isTrunk ? (2.10 - 0.55 * p.u) : (1.42 - 0.32 * p.u);
            const str = isTrunk ? (0.90 - 0.36 * p.u * p.u) : (0.78 - 0.30 * p.u);
            gl.carveFoundation(p.x, p.y, W, H, radCells, str, true);
            clearTreesAt(p.x, p.y, isTrunk ? 118 : 88);
        }
    }
}

interface LoadedTilePixels {
    w: number;
    h: number;
    data: Uint8ClampedArray;
}

const tilePixelCache = new Map<string, Promise<LoadedTilePixels | null>>();

function loadTilePixels(url: string): Promise<LoadedTilePixels | null> {
    if (!url || typeof document === 'undefined' || typeof Image === 'undefined') {
        return Promise.resolve(null);
    }
    let p = tilePixelCache.get(url);
    if (!p) {
        p = new Promise<LoadedTilePixels | null>((resolve) => {
            const im = new Image();
            im.onload = () => {
                const w = im.naturalWidth || ROAD_TILE_SIZE;
                const h = im.naturalHeight || ROAD_TILE_SIZE;
                const cv = document.createElement('canvas');
                cv.width = w;
                cv.height = h;
                const ctx = cv.getContext('2d');
                if (!ctx) { resolve(null); return; }
                ctx.drawImage(im, 0, 0, w, h);
                resolve({ w, h, data: ctx.getImageData(0, 0, w, h).data });
            };
            im.onerror = () => resolve(null);
            im.src = url;
        });
        tilePixelCache.set(url, p);
    }
    return p;
}

interface SegRecord {
    ax: number;
    ayG: number;
    bx: number;
    byG: number;
    vx: number;
    vy: number;
    len2: number;
    halfWA: number;
    halfWB: number;
    maxHW: number;
    brkA: number;
    brkB: number;
    fadeA: number;
    fadeB: number;
    minDrawX: number;
    maxDrawX: number;
    minDrawY: number;
    maxDrawY: number;
}

/** 将整张战场的城郊石路离线烘焙为 192×96 屏幕分块（与山坡 terrainLiftAt 严丝合缝且零接缝） */
export async function bakeSuburbanRoadChunks(
    curves: readonly RoadCurve[],
    style: RoadPavingStyle,
    elevationLiftAt: (x: number, y: number) => number,
    isStillValid: () => boolean,
): Promise<SuburbanRoadChunk[]> {
    if (curves.length === 0 || style.mode === 'none' || typeof document === 'undefined') {
        return [];
    }

    const [priTile, secTile, mskTile] = await Promise.all([
        loadTilePixels(style.primaryUrl),
        loadTilePixels(style.secondaryUrl),
        loadTilePixels(style.maskUrl),
    ]);
    if (!isStillValid() || !priTile || !secTile || !mskTile) return [];

    // 整理有效绘制线段，计算精确屏幕绘制包围盒
    const segs: SegRecord[] = [];
    for (const cv of curves) {
        const pts = cv.points;
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i + 1];
            if (a.overMoat && b.overMoat) continue;
            const ax = a.x, ayG = a.y * 2;
            const bx = b.x, byG = b.y * 2;
            const vx = bx - ax, vy = byG - ayG;
            const maxHW = Math.max(a.halfW, b.halfW) + 18;
            const liftA = elevationLiftAt(a.x, a.y);
            const liftB = elevationLiftAt(b.x, b.y);
            const padY = Math.ceil(maxHW * 0.5) + 42;
            segs.push({
                ax, ayG, bx, byG, vx, vy,
                len2: vx * vx + vy * vy || 1,
                halfWA: a.halfW,
                halfWB: b.halfW,
                maxHW,
                brkA: a.brokenness,
                brkB: b.brokenness,
                fadeA: a.u > 0.82 ? Math.max(0, 1 - (a.u - 0.82) / 0.18) : 1,
                fadeB: b.u > 0.82 ? Math.max(0, 1 - (b.u - 0.82) / 0.18) : 1,
                minDrawX: Math.min(a.x, b.x) - maxHW,
                maxDrawX: Math.max(a.x, b.x) + maxHW,
                minDrawY: Math.min(a.y - liftA, b.y - liftB) - padY,
                maxDrawY: Math.max(a.y - liftA, b.y - liftB) + padY,
            });
        }
    }
    if (segs.length === 0) return [];

    // 将线段挂入相交的 192×96 分块桶
    const chunkMap = new Map<string, { gx: number; gy: number; list: SegRecord[] }>();
    for (const s of segs) {
        const cx0 = Math.floor(s.minDrawX / CHUNK_W);
        const cx1 = Math.floor(s.maxDrawX / CHUNK_W);
        const cy0 = Math.floor(s.minDrawY / CHUNK_H);
        const cy1 = Math.floor(s.maxDrawY / CHUNK_H);
        for (let cy = cy0; cy <= cy1; cy++) {
            for (let cx = cx0; cx <= cx1; cx++) {
                const k = `${cx},${cy}`;
                let entry = chunkMap.get(k);
                if (!entry) {
                    entry = { gx: cx, gy: cy, list: [] };
                    chunkMap.set(k, entry);
                }
                entry.list.push(s);
            }
        }
    }

    const priData = priTile.data;
    const secData = secTile.data;
    const mskData = mskTile.data;
    const frost = style.winterFrost;
    const chunks: SuburbanRoadChunk[] = [];
    const blockSize = 4;

    const queryLocalDist = (
        localSegs: readonly SegRecord[],
        wx: number,
        wyG: number,
    ): { dist: number; halfW: number; brk: number; fade: number } => {
        let bestD = Infinity;
        let bestHW = 0;
        let bestBrk = 0;
        let bestFade = 0;
        for (let i = 0; i < localSegs.length; i++) {
            const s = localSegs[i];
            const t = Math.max(0, Math.min(1, ((wx - s.ax) * s.vx + (wyG - s.ayG) * s.vy) / s.len2));
            const px = s.ax + s.vx * t;
            const py = s.ayG + s.vy * t;
            const d = Math.hypot(wx - px, wyG - py);
            if (d < bestD) {
                bestD = d;
                bestHW = s.halfWA + (s.halfWB - s.halfWA) * t;
                bestBrk = s.brkA + (s.brkB - s.brkA) * t;
                bestFade = s.fadeA + (s.fadeB - s.fadeA) * t;
            }
        }
        return { dist: bestD, halfW: bestHW, brk: bestBrk, fade: bestFade };
    };

    for (const bucket of chunkMap.values()) {
        if (!isStillValid()) return [];
        const x0 = bucket.gx * CHUNK_W;
        const y0 = bucket.gy * CHUNK_H;
        const cv = document.createElement('canvas');
        cv.width = CHUNK_W;
        cv.height = CHUNK_H;
        const ctx = cv.getContext('2d');
        if (!ctx) continue;

        const imgData = ctx.createImageData(CHUNK_W, CHUNK_H);
        const out = imgData.data;
        let hasAnyPixel = false;
        const localSegs = bucket.list;

        for (let by = 0; by < CHUNK_H; by += blockSize) {
            for (let bx = 0; bx < CHUNK_W; bx += blockSize) {
                const cX = x0 + bx + 2;
                const cYDraw = y0 + by + 2;
                // 块中心 2 步不动点求世界 Y，误差 <0.2px
                const yBlk1 = cYDraw + elevationLiftAt(cX, cYDraw);
                const yBlk = cYDraw + elevationLiftAt(cX, yBlk1);
                const blkRes = queryLocalDist(localSegs, cX, yBlk * 2);
                if (blkRes.dist > blkRes.halfW + 18 || blkRes.fade <= 0.02) continue;

                const yEnd = Math.min(CHUNK_H, by + blockSize);
                const xEnd = Math.min(CHUNK_W, bx + blockSize);

                for (let py = by; py < yEnd; py++) {
                    const drawY = y0 + py;
                    for (let px = bx; px < xEnd; px++) {
                        const worldX = x0 + px;
                        const yApprox = drawY + elevationLiftAt(worldX, yBlk);
                        const worldY = drawY + elevationLiftAt(worldX, yApprox);
                        const hit = queryLocalDist(localSegs, worldX, worldY * 2);
                        if (hit.dist > hit.halfW + 10 || hit.fade <= 0.02) continue;

                        const wob = 0.13 * Math.sin(worldX * 0.029 + worldY * 0.043)
                            + 0.07 * Math.sin(worldX * 0.067 - worldY * 0.051);
                        const effHalfW = Math.max(12, hit.halfW * (1 + wob));
                        const rNorm = hit.dist / effHalfW;
                        if (rNorm >= 1.05) continue;

                        const tx = (Math.round(worldX) | 0) & 511;
                        const ty = (Math.round(worldY) | 0) & 511;
                        const tidx = (ty * 512 + tx) * 4;
                        // 蒙版偏移与微转相，避开长路段重复感
                        const mx = (Math.round(worldX + 137) | 0) & 511;
                        const my = (Math.round(worldY + 293) | 0) & 511;
                        const midx = (my * 512 + mx) * 4;

                        // DE 蒙版：white(1)=完整石块，black(0)=凹陷泥缺口
                        const maskVal = mskData[midx] / 255;
                        const shoulder = Math.max(0, (rNorm - 0.58) / 0.42);
                        const coreErode = Math.max(0, (hit.brk - 0.26) * 0.68);
                        const threshold = shoulder * 0.68 + coreErode * 0.52;
                        const stoneScore = maskVal - threshold;
                        if (stoneScore <= 0) continue;

                        const a = Math.min(1, stoneScore * 4.5) * hit.fade * 0.96;
                        if (a <= 0.03) continue;

                        const brkMix = Math.max(0, Math.min(1, hit.brk));
                        const invMix = 1 - brkMix;
                        let r = priData[tidx] * invMix + secData[tidx] * brkMix;
                        let g = priData[tidx + 1] * invMix + secData[tidx + 1] * brkMix;
                        let b = priData[tidx + 2] * invMix + secData[tidx + 2] * brkMix;

                        if (frost > 0) {
                            r = r * (1 - frost) + 216 * frost;
                            g = g * (1 - frost) + 224 * frost;
                            b = b * (1 - frost) + 230 * frost;
                        }

                        const oIdx = (py * CHUNK_W + px) * 4;
                        out[oIdx] = r;
                        out[oIdx + 1] = g;
                        out[oIdx + 2] = b;
                        out[oIdx + 3] = Math.round(a * 255);
                        hasAnyPixel = true;
                    }
                }
            }
        }

        if (hasAnyPixel) {
            ctx.putImageData(imgData, 0, 0);
            chunks.push({ cv, x: x0, y: y0, w: CHUNK_W, h: CHUNK_H });
        }
    }

    return chunks;
}
