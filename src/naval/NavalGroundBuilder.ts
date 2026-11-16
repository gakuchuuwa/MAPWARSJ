/**
 * 海战场面 · DE 地形与海岸生成（与陆战 Scene13 共用同一套 Scene13GroundLayerGL）
 *
 * 设计口径：
 *   1. 完全依据战略地图真实海陆绘制：外海/大洋开战为 100% 纯大海，绝不凭空造岛；
 *   2. 仅当战略地图该海域确有海岸或岛屿时才绘制陆地，且陆地最多保留 20%（保证水域 ≥ 80%，中心交战区净空）；
 *   3. 海岸按 DE 原版层次塑形：平滑岸线 → 1~2 格 Beach(2)/碎石滩(108) 高程 0 平缓入海
 *      → 浅水(1) → 中水(23) → 深海(22)，配合 Scene13GroundLayerGL 的浅滩折射与拍岸碎浪泡沫。
 */

import { TAC_MAP_HALF_W, TAC_MAP_HALF_H, TAC_MAP_N, TAC_TILE_W, TAC_TILE_H } from '../ui/scene13/Scene13GroundLayerGL';
import { resolveEnvironmentClimate, type Scene13GroundTiles } from '../ui/scene13/Scene13EnvironmentGenerator';
import { DE_MAP_THEMES } from '../ui/scene13/Scene13DeMapThemes';
import { NAVAL_WORLD_W, NAVAL_WORLD_H } from './NavalBattleSim';

/** DE 地形 ID（与 Scene13GroundLayerGL / Scene13DeGround 一致） */
const TID_SHALLOW_WATER = 1;
const TID_MED_WATER = 23;
const TID_DEEP_WATER = 22;
const TID_BEACH = 2;
const TID_GRAVEL_BEACH = 108;
const TID_LAND_BASE = 12;
const TID_DIRT_PATCH = 3;
const TID_FOREST_FLOOR = 10;

const TARGET_LAND_RATIO = 0.20;
const MAX_LAND_RATIO = 0.20;

export interface NavalDecorItem {
    /** DE 精灵键（如 PALM / PINE / OLIVE / ROCK_SEA1） */
    spriteName: string;
    /** 海战世界坐标 */
    x: number;
    y: number;
    scale: number;
}

export interface NavalGroundBuildResult {
    mapData: {
        N: number;
        width: number;
        height: number;
        terrain: number[];
        elevation: number[];
        noTranspose: true;
    };
    groundTiles: Partial<Scene13GroundTiles>;
    isSnowGround: boolean;
    lat: number;
    lng: number;
    decorItems: NavalDecorItem[];
    landRatio: number;
}

export interface NavalGroundBuildInput {
    lat: number;
    lng: number;
    seed: string;
    /** 可选：查询海战世界坐标 (wx, wy) 是否为水（真实地理） */
    isRealWaterAt?: (wx: number, wy: number) => boolean;
}

function hash2i(x: number, y: number, seedNum: number): number {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seedNum, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothNoise2D(x: number, y: number, seedNum: number): number {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash2i(ix, iy, seedNum);
    const b = hash2i(ix + 1, iy, seedNum);
    const c = hash2i(ix, iy + 1, seedNum);
    const d = hash2i(ix + 1, iy + 1, seedNum);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm2D(x: number, y: number, seedNum: number): number {
    return (
        smoothNoise2D(x, y, seedNum) * 0.58 +
        smoothNoise2D(x * 2.03 + 17.3, y * 2.03 + 9.1, seedNum + 1) * 0.28 +
        smoothNoise2D(x * 4.11 + 41.7, y * 4.11 + 27.9, seedNum + 2) * 0.14
    );
}

function strHash(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** 海战世界坐标 (wx, wy) → 120×120 格坐标 (gx, gy) */
export function navalWorldToCell(wx: number, wy: number): { gx: number; gy: number } {
    const glX = TAC_MAP_HALF_W + (wx - NAVAL_WORLD_W / 2);
    const glY = TAC_MAP_HALF_H + (wy - NAVAL_WORLD_H / 2);
    const gx = (glX - TAC_MAP_HALF_W) / TAC_TILE_W + TAC_MAP_N * 0.5;
    const gy = (glY - TAC_MAP_HALF_H) / TAC_TILE_H + TAC_MAP_N * 0.5;
    return { gx, gy };
}

/** 120×120 格坐标 (gx, gy) → 海战世界坐标 (wx, wy) */
export function cellToNavalWorld(gx: number, gy: number): { x: number; y: number } {
    const glX = TAC_MAP_HALF_W + (gx - TAC_MAP_N * 0.5) * TAC_TILE_W;
    const glY = TAC_MAP_HALF_H + (gy - TAC_MAP_N * 0.5) * TAC_TILE_H;
    return {
        x: NAVAL_WORLD_W / 2 + (glX - TAC_MAP_HALF_W),
        y: NAVAL_WORLD_H / 2 + (glY - TAC_MAP_HALF_H),
    };
}

/**
 * 判断格子是否落在中心交战净空区（双方舰队出生阵位与主航道，100% 必须为开阔水域）
 * 椭圆中心在 (NAVAL_WORLD_W/2, NAVAL_WORLD_H/2)，半轴覆盖两军排阵与交锋主水域
 */
function coreWaterClearance(wx: number, wy: number): number {
    const dx = (wx - NAVAL_WORLD_W * 0.5) / (NAVAL_WORLD_W * 0.46);
    const dy = (wy - NAVAL_WORLD_H * 0.5) / (NAVAL_WORLD_H * 0.40);
    return Math.hypot(dx, dy);
}

/**
 * 构建海战 DE 地形、海岸线、浅水深海层次与岸边自然物件。
 */
export function buildNavalGroundData(input: NavalGroundBuildInput): NavalGroundBuildResult {
    const N = TAC_MAP_N;
    const seedNum = strHash(input.seed || 'naval');
    const climate = resolveEnvironmentClimate({
        lat: input.lat,
        lng: input.lng,
        seed: input.seed,
        forceWaterKind: 'sea',
    });

    const baseTerrain = climate.baseTerrain || 'gr2';
    const isSnowGround = /^(sno|sn2|snf|snd|snr|ic2|ic3|ice)/.test(baseTerrain);
    const groundTiles: Partial<Scene13GroundTiles> = {
        ...climate.groundTiles,
        grass: climate.groundTiles.grass || baseTerrain,
        sand: climate.groundTiles.sand || (isSnowGround ? 'ice_beach' : 'bch'),
        water: climate.groundTiles.water || 'wt2',
    };

    // 1. 严格依据战略地图真实海陆采样决定是否有陆地（外海开战 = 100% 纯大海，绝不凭空造岛）
    const landMask = new Uint8Array(N * N);
    const canBeLand = new Uint8Array(N * N);
    const landScore = new Float32Array(N * N);
    let realLandCount = 0;

    if (input.isRealWaterAt) {
        for (let gy = 0; gy < N; gy++) {
            for (let gx = 0; gx < N; gx++) {
                const idx = gy * N + gx;
                const { x: wx, y: wy } = cellToNavalWorld(gx + 0.5, gy + 0.5);
                const clearD = coreWaterClearance(wx, wy);
                if (clearD < 1.0) {
                    canBeLand[idx] = 0;
                    continue;
                }
                canBeLand[idx] = 1;
                if (!input.isRealWaterAt(wx, wy)) {
                    const n = fbm2D(gx * 0.16, gy * 0.16, seedNum);
                    // 优先保留离中心航道较远、且属于真实陆地的部分
                    landScore[idx] = clearD + n * 0.35;
                    landMask[idx] = 1;
                    realLandCount++;
                }
            }
        }
    }

    // 真实海岸没有陆地（外海大洋）：直接返回 100% 纯深海，不放任何岛屿和陆地
    if (realLandCount === 0) {
        return {
            mapData: {
                N,
                width: N,
                height: N,
                terrain: new Array<number>(N * N).fill(TID_DEEP_WATER),
                elevation: new Array<number>(N * N).fill(0),
                noTranspose: true,
            },
            groundTiles,
            isSnowGround,
            lat: input.lat,
            lng: input.lng,
            decorItems: [],
            landRatio: 0,
        };
    }

    // 若战略地图此处真实陆地超过 20%，按离战场中心远近退缩，最多保留 20% 陆地（确保水域 ≥ 80%）
    const maxLandCells = Math.floor(N * N * TARGET_LAND_RATIO);
    if (realLandCount > maxLandCells) {
        const candidates: Array<{ idx: number; score: number }> = [];
        for (let i = 0; i < N * N; i++) {
            if (landMask[i] === 1) candidates.push({ idx: i, score: landScore[i] });
        }
        candidates.sort((a, b) => b.score - a.score);
        landMask.fill(0);
        for (let k = 0; k < maxLandCells; k++) {
            landMask[candidates[k].idx] = 1;
        }
    }

    // 2. 形态学平滑（去除孤立 1 格毛刺与单格水坑，保证海岸圆滑，同时严守 ≤ MAX_LAND_RATIO）
    const smoothed = new Uint8Array(landMask);
    for (let pass = 0; pass < 2; pass++) {
        const src = pass === 0 ? landMask : smoothed;
        const dst = new Uint8Array(src);
        for (let gy = 1; gy < N - 1; gy++) {
            for (let gx = 1; gx < N - 1; gx++) {
                const idx = gy * N + gx;
                if (!canBeLand[idx]) { dst[idx] = 0; continue; }
                let nb = 0;
                for (let oy = -1; oy <= 1; oy++) {
                    for (let ox = -1; ox <= 1; ox++) {
                        if (ox === 0 && oy === 0) continue;
                        if (src[(gy + oy) * N + (gx + ox)]) nb++;
                    }
                }
                if (src[idx] === 1 && nb <= 2) dst[idx] = 0;
                else if (src[idx] === 0 && nb >= 6) dst[idx] = 1;
            }
        }
        smoothed.set(dst);
    }

    // 3. 计算水格到最近陆地的距离 & 陆格到最近水体的距离（用于 DE 浅水/中水/深海分层与沙滩带）
    const distToLand = new Float32Array(N * N).fill(99);
    const distToWater = new Float32Array(N * N).fill(99);
    const maxR = 7;

    for (let gy = 0; gy < N; gy++) {
        for (let gx = 0; gx < N; gx++) {
            const idx = gy * N + gx;
            if (smoothed[idx] === 1) {
                distToLand[idx] = 0;
                let minDw = 99;
                for (let oy = -3; oy <= 3; oy++) {
                    const ny = gy + oy;
                    if (ny < 0 || ny >= N) { minDw = Math.min(minDw, Math.abs(oy)); continue; }
                    for (let ox = -3; ox <= 3; ox++) {
                        const nx = gx + ox;
                        if (nx < 0 || nx >= N || smoothed[ny * N + nx] === 0) {
                            minDw = Math.min(minDw, Math.hypot(ox, oy));
                        }
                    }
                }
                distToWater[idx] = minDw;
            } else {
                distToWater[idx] = 0;
                let minDl = 99;
                for (let oy = -maxR; oy <= maxR; oy++) {
                    const ny = gy + oy;
                    if (ny < 0 || ny >= N) continue;
                    for (let ox = -maxR; ox <= maxR; ox++) {
                        const nx = gx + ox;
                        if (nx < 0 || nx >= N) continue;
                        if (smoothed[ny * N + nx] === 1) {
                            const d = Math.hypot(ox, oy);
                            if (d < minDl) minDl = d;
                        }
                    }
                }
                distToLand[idx] = minDl;
            }
        }
    }

    // 4. 填充 DE 地形数组与高程数组
    const terrain = new Array<number>(N * N);
    const elevation = new Array<number>(N * N).fill(0);
    const beachId = isSnowGround ? TID_GRAVEL_BEACH : TID_BEACH;
    let landCells = 0;

    for (let gy = 0; gy < N; gy++) {
        for (let gx = 0; gx < N; gx++) {
            const idx = gy * N + gx;
            if (smoothed[idx] === 1 && landCells < N * N * MAX_LAND_RATIO) {
                landCells++;
                const dw = distToWater[idx];
                const n = fbm2D(gx * 0.18 + 5.2, gy * 0.18 + 8.7, seedNum + 29);
                if (dw <= 1.65) {
                    // 紧邻海岸的 1~2 格为沙滩/碎石滩，高程保持 0 平缓入海
                    terrain[idx] = beachId;
                    elevation[idx] = 0;
                } else {
                    // 岛屿内陆：混入少量林地底色与泥土斑块，并做平缓 1~2 级台地丘陵
                    if (n > 0.60) terrain[idx] = TID_FOREST_FLOOR;
                    else if (n < 0.32) terrain[idx] = TID_DIRT_PATCH;
                    else terrain[idx] = TID_LAND_BASE;

                    if (dw > 4.8 && n > 0.56) elevation[idx] = 2;
                    else if (dw > 2.6 && n > 0.42) elevation[idx] = 1;
                    else elevation[idx] = 0;
                }
            } else {
                const dl = distToLand[idx];
                if (dl <= 2.3) terrain[idx] = TID_SHALLOW_WATER;
                else if (dl <= 5.2) terrain[idx] = TID_MED_WATER;
                else terrain[idx] = TID_DEEP_WATER;
                elevation[idx] = 0;
            }
        }
    }

    // 5. 生成 DE 海岸自然物件（岛屿树木 + 近岸浅水海礁）
    const decorItems: NavalDecorItem[] = [];
    const themeObj = climate.deMapTheme ? DE_MAP_THEMES[climate.deMapTheme] : null;
    const treePool = themeObj?.trees?.length ? themeObj.trees : (isSnowGround ? ['SNOW_PINE'] : ['OAK', 'PINE']);
    const isDesert = baseTerrain === 'pal' || baseTerrain === 'des' || baseTerrain === 'qs';
    const rockPool = ['ROCK_SEA1', 'ROCK_SEA2'];

    for (let gy = 2; gy < N - 2; gy++) {
        for (let gx = 2; gx < N - 2; gx++) {
            const idx = gy * N + gx;
            const tid = terrain[idx];
            const r = hash2i(gx, gy, seedNum + 97);
            if (smoothed[idx] === 1 && tid !== beachId) {
                // 岛屿内陆树林点缀
                const prob = tid === TID_FOREST_FLOOR ? 0.24 : (isDesert ? 0.03 : 0.07);
                if (r < prob) {
                    const { x, y } = cellToNavalWorld(
                        gx + 0.25 + hash2i(gx, gy, seedNum + 101) * 0.5,
                        gy + 0.25 + hash2i(gx, gy, seedNum + 103) * 0.5,
                    );
                    const tree = isDesert ? 'PALM' : treePool[Math.floor(hash2i(gx, gy, seedNum + 107) * treePool.length)];
                    decorItems.push({ spriteName: tree, x, y, scale: 0.72 + hash2i(gx, gy, seedNum + 109) * 0.22 });
                }
            } else if (tid === TID_SHALLOW_WATER && distToLand[idx] >= 1.1 && distToLand[idx] <= 2.1) {
                // 近岸浅水少量海礁点缀（远离中心交战区）
                const { x, y } = cellToNavalWorld(gx + 0.5, gy + 0.5);
                if (coreWaterClearance(x, y) >= 1.08 && r < 0.035) {
                    const rock = rockPool[Math.floor(hash2i(gx, gy, seedNum + 113) * rockPool.length)];
                    decorItems.push({ spriteName: rock, x, y, scale: 0.68 + hash2i(gx, gy, seedNum + 119) * 0.25 });
                }
            }
        }
    }

    return {
        mapData: {
            N,
            width: N,
            height: N,
            terrain,
            elevation,
            noTranspose: true,
        },
        groundTiles,
        isSnowGround,
        lat: input.lat,
        lng: input.lng,
        decorItems,
        landRatio: landCells / (N * N),
    };
}
