/**
 * Scene13RealGeography — 战术战场的真实地理（2026-10-07 主人令「打仗的那块地就是地图上那个地方」，帝国时代 2 画风）
 *
 * 照帝国时代 2「真实世界地图」的做法：地理位置按真实地形摆，画面仍是 DE 贴图。
 * - 城池在画面里的位置不变；以城（野战以战场中心）为原点铺开真实地理。
 * - 可旋转地理（帝国时代地图本不分东南西北）：画面左边对着哪个真实方位由调用方挑（攻方在左的铁律不破）。
 * - 水：ESRI 晕渲 z12 水域掩膜（与战略地图海陆判定同源，约 30 m/像素）→ 深水 / 浅水 / 沙滩格。
 * - 山：Terrarium z12 高程（欧亚原始精度约 30 m）→ 去整片大斜面后分 DE 0~3 级丘陵。
 * - 画面比例：1 屏幕像素 ≈ REAL_GEO_M_PER_PX 米（1920 宽 ≈ 15 km）；等距地面纵向压一半，屏幕 y 1 像素 = 2 倍米数。
 *   城、兵仍按原尺寸画，只压缩城外地理 —— 与帝国时代 2 真实世界地图同一做法（实测 2.6 m/像素只看得到城外 3 km，多是平地）。
 * - 任何一块数据取不到就返回 null，调用方保留原生成器的战场，不影响开战。
 */
import {
    TERRARIUM_TILE_URL,
    TERRARIUM_TILE_SIZE,
    decodeTerrariumElevation,
} from '../../world/land-sea/TerrariumCodec';
import { LandSeaSystem } from '../../world/land-sea/LandSeaSystem';
import { latLngToTilePixel } from '../../world/land-sea/ElevationSampler';

export const REAL_GEO_M_PER_PX = 8;

const DEM_ZOOM = 12;
const WATER_ZOOM = 12;
const TILE_W = 64;
const TILE_H = 32;
const FETCH_TIMEOUT_MS = 4000;
const DEM_CACHE_MAX = 48;
const MAX_TILES_PER_AXIS = 8;
/** 全场起伏不足这么多米 = 平原，不起丘 */
const MIN_RELIEF_M = 12;
const MIN_STEP_M = 12;
const MAX_STEP_M = 60;
const MAX_LEVEL = 3;
/** 可起丘的格少于这么多就不起丘（样本太少，统计不稳） */
const MIN_HILL_CELLS = 30;

/** 地理锚点：屏幕 (ax, ay) 对应经纬度 (lat, lng)；bearingDeg = 画面左边对着的真实方位（正北 0、顺时针） */
export interface RealGeoFrame {
    lat: number;
    lng: number;
    ax: number;
    ay: number;
    bearingDeg: number;
}

const M_PER_DEG_LAT = 111320;

/** 屏幕坐标 → 经纬度 */
export function screenToGeo(f: RealGeoFrame, x: number, y: number): { lat: number; lng: number } {
    const r = (x - f.ax) * REAL_GEO_M_PER_PX;          // 画面右为正（米）
    const u = -(y - f.ay) * 2 * REAL_GEO_M_PER_PX;     // 画面上为正（米）
    // 画面左边对着 bearing：把（右,上）坐标系顺时针转 φ = bearing − 270° 得到（东,北）
    const phi = ((f.bearingDeg - 270) * Math.PI) / 180;
    const east = r * Math.cos(phi) + u * Math.sin(phi);
    const north = -r * Math.sin(phi) + u * Math.cos(phi);
    const mPerDegLng = M_PER_DEG_LAT * Math.cos((f.lat * Math.PI) / 180);
    return { lat: f.lat + north / M_PER_DEG_LAT, lng: f.lng + east / mPerDegLng };
}

/** 从 (lat1,lng1) 看 (lat2,lng2) 的方位角（正北 0、顺时针，度） */
export function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dE = (lng2 - lng1) * Math.cos((lat1 * Math.PI) / 180);
    const dN = lat2 - lat1;
    return ((Math.atan2(dE, dN) * 180) / Math.PI + 360) % 360;
}

// ── 高程瓦片（Terrarium） ────────────────────────────────────────

const demCache = new Map<string, Promise<Float32Array | null>>();

function loadDemTile(z: number, x: number, y: number): Promise<Float32Array | null> {
    const key = `${z}/${x}/${y}`;
    const hit = demCache.get(key);
    if (hit) return hit;
    const p = (async (): Promise<Float32Array | null> => {
        const ctrl = new AbortController();
        const timer = window.setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
        try {
            const url = TERRARIUM_TILE_URL
                .replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
            const res = await fetch(url, { signal: ctrl.signal });
            if (!res.ok) return null;
            const bmp = await createImageBitmap(await res.blob());
            const cv = document.createElement('canvas');
            cv.width = TERRARIUM_TILE_SIZE;
            cv.height = TERRARIUM_TILE_SIZE;
            const g = cv.getContext('2d', { willReadFrequently: true });
            if (!g) { bmp.close(); return null; }
            g.drawImage(bmp, 0, 0);
            bmp.close();
            const px = g.getImageData(0, 0, TERRARIUM_TILE_SIZE, TERRARIUM_TILE_SIZE).data;
            const out = new Float32Array(TERRARIUM_TILE_SIZE * TERRARIUM_TILE_SIZE);
            for (let i = 0; i < out.length; i++) out[i] = decodeTerrariumElevation(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
            return out;
        } catch {
            return null;
        } finally {
            window.clearTimeout(timer);
        }
    })();
    demCache.set(key, p);
    if (demCache.size > DEM_CACHE_MAX) demCache.delete(demCache.keys().next().value!);
    void p.then((v) => { if (!v && demCache.get(key) === p) demCache.delete(key); });
    return p;
}

// ── 数据源：取齐一块战场的高程与水域 ─────────────────────────────

export interface RealGeoSource {
    /** 海拔（米），双线性 */
    elevAt(lat: number, lng: number): number;
    /** 是不是水（ESRI 掩膜） */
    waterAt(lat: number, lng: number): boolean;
}

function tileRange(lats: number[], lngs: number[], z: number) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const lat of lats) for (const lng of lngs) {
        const t = latLngToTilePixel(lat, lng, z);
        x0 = Math.min(x0, t.tileX); x1 = Math.max(x1, t.tileX);
        y0 = Math.min(y0, t.tileY); y1 = Math.max(y1, t.tileY);
    }
    return { x0, x1, y0, y1 };
}

/**
 * 取齐以锚点为圆心、能盖住画面任意旋转的范围内的高程 + 水域瓦片（方位要在几个候选里挑，所以按圆取）；
 * 任何一块取不到返回 null
 */
export async function loadRealGeography(f: RealGeoFrame, VW: number, VH: number): Promise<RealGeoSource | null> {
    const pad = 96;
    let radiusM = 0;
    for (const [x, y] of [[-pad, -pad], [VW + pad, -pad], [-pad, VH + pad], [VW + pad, VH + pad]]) {
        radiusM = Math.max(radiusM, Math.hypot((x - f.ax) * REAL_GEO_M_PER_PX, (y - f.ay) * 2 * REAL_GEO_M_PER_PX));
    }
    const dLat = radiusM / M_PER_DEG_LAT;
    const dLng = radiusM / (M_PER_DEG_LAT * Math.cos((f.lat * Math.PI) / 180));
    const latMin = f.lat - dLat, latMax = f.lat + dLat;
    const lngMin = f.lng - dLng, lngMax = f.lng + dLng;
    const dem = tileRange([latMin, latMax], [lngMin, lngMax], DEM_ZOOM);
    const wat = tileRange([latMin, latMax], [lngMin, lngMax], WATER_ZOOM);
    if (dem.x1 - dem.x0 + 1 > MAX_TILES_PER_AXIS || dem.y1 - dem.y0 + 1 > MAX_TILES_PER_AXIS) return null;
    if (wat.x1 - wat.x0 + 1 > MAX_TILES_PER_AXIS || wat.y1 - wat.y0 + 1 > MAX_TILES_PER_AXIS) return null;

    const demTiles = new Map<string, Float32Array>();
    const jobs: Promise<boolean>[] = [];
    for (let ty = dem.y0; ty <= dem.y1; ty++) for (let tx = dem.x0; tx <= dem.x1; tx++) {
        jobs.push(loadDemTile(DEM_ZOOM, tx, ty).then((t) => { if (t) demTiles.set(`${tx},${ty}`, t); return !!t; }));
    }
    const sampler = LandSeaSystem.getWaterSampler();
    for (let ty = wat.y0; ty <= wat.y1; ty++) for (let tx = wat.x0; tx <= wat.x1; tx++) {
        jobs.push((async () => {
            // ensureTile 遇到「别人正在取」会立刻返回 false —— 等它进缓存（最多 FETCH_TIMEOUT_MS）
            const t0 = performance.now();
            while (performance.now() - t0 < FETCH_TIMEOUT_MS) {
                if (sampler.getTileMaskSync(WATER_ZOOM, tx, ty)?.mask) return true;
                if (sampler.getTileMaskSync(WATER_ZOOM, tx, ty)) return false;   // 已知坏瓦片
                if (await sampler.ensureTile(WATER_ZOOM, tx, ty)) continue;
                await new Promise((r) => setTimeout(r, 120));
            }
            return false;
        })());
    }
    const ok = await Promise.all(jobs);
    if (ok.some((v) => !v)) return null;

    // 水域瓦片按值拷一份：采样器是 LRU，后面别的查询可能把它挤掉
    const waterTiles = new Map<string, Uint8Array>();
    for (let ty = wat.y0; ty <= wat.y1; ty++) for (let tx = wat.x0; tx <= wat.x1; tx++) {
        const m = sampler.getTileMaskSync(WATER_ZOOM, tx, ty)?.mask;
        if (!m) return null;
        waterTiles.set(`${tx},${ty}`, m);
    }

    const S = TERRARIUM_TILE_SIZE;
    const demAt = (gx: number, gy: number): number => {
        const tx = Math.floor(gx / S), ty = Math.floor(gy / S);
        const t = demTiles.get(`${tx},${ty}`);
        if (!t) return 0;
        const ix = Math.min(S - 1, Math.max(0, gx - tx * S));
        const iy = Math.min(S - 1, Math.max(0, gy - ty * S));
        return t[iy * S + ix];
    };
    const globalPx = (lat: number, lng: number, z: number) => {
        const n = Math.pow(2, z) * S;
        const latRad = (lat * Math.PI) / 180;
        return {
            x: ((lng + 180) / 360) * n,
            y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
        };
    };
    return {
        elevAt(lat, lng) {
            const p = globalPx(lat, lng, DEM_ZOOM);
            const x0 = Math.floor(p.x - 0.5), y0 = Math.floor(p.y - 0.5);
            const fx = p.x - 0.5 - x0, fy = p.y - 0.5 - y0;
            const h00 = demAt(x0, y0), h10 = demAt(x0 + 1, y0), h01 = demAt(x0, y0 + 1), h11 = demAt(x0 + 1, y0 + 1);
            return (h00 * (1 - fx) + h10 * fx) * (1 - fy) + (h01 * (1 - fx) + h11 * fx) * fy;
        },
        waterAt(lat, lng) {
            const t = latLngToTilePixel(lat, lng, WATER_ZOOM);
            const m = waterTiles.get(`${t.tileX},${t.tileY}`);
            return !!m && m[t.pixelY * S + t.pixelX] === 1;
        },
    };
}

// ── 方案：逐格水陆 + 丘陵 ───────────────────────────────────────

export interface RealGeoPlan {
    /** 深水格（四邻全是水）、浅水格（水的边缘 + 窄河浅滩）、沙滩格（挨着水的陆地） */
    deep: Array<[number, number]>;
    shallow: Array<[number, number]>;
    sand: Array<[number, number]>;
    /** 水域谓词（屏幕坐标；深水 + 浅水） */
    isWater: (x: number, y: number) => boolean;
    /** 0~3 级丘陵 */
    elevation: number[][];
    /** 水格里有没有海（海拔 ≤ 0 的水 = 海；其余 = 河湖） */
    hasSea: boolean;
    waterCells: number;
    reliefM: number;
    raisedCells: number;
}

export interface RealGeoPlanInput {
    source: RealGeoSource;
    frame: RealGeoFrame;
    grid: { gw: number; gh: number; ox: number; oy: number };
    width: number;
    height: number;
    /** 必须是陆地且保持平地的屏幕点（城池、攻方营地） */
    keepDryFlat: (x: number, y: number) => boolean;
}

export function buildRealGeoPlan(input: RealGeoPlanInput): RealGeoPlan {
    const { source, frame, width: VW, height: VH, keepDryFlat } = input;
    const { gw, gh, ox, oy } = input.grid;
    const cellX = (gx: number, gy: number) => (gx - gy) * (TILE_W / 2) + ox;
    const cellY = (gx: number, gy: number) => (gx + gy) * (TILE_H / 2) + oy;

    // 1) 逐格判水：菱形内 5×5 采样。过半是水 = 水；占到 FORD_MIN/25 = 浅滩（窄河，能涉水）。
    //    一格约 500 m，只采几个点会把几百米宽的河整条漏掉（实测巴比伦幼发拉底河只剩 3 格）。
    const SUB = 5, FORD_MIN = 3, WATER_MIN = 13;
    const water: boolean[][] = Array.from({ length: gh }, () => new Array(gw).fill(false));
    const ford: boolean[][] = Array.from({ length: gh }, () => new Array(gw).fill(false));
    let hasSea = false;
    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const px = cellX(gx, gy), py = cellY(gx, gy);
            if (keepDryFlat(px, py)) continue;
            let n = 0;
            for (let i = 0; i < SUB; i++) for (let j = 0; j < SUB; j++) {
                const s = (i - (SUB - 1) / 2) / SUB, t = (j - (SUB - 1) / 2) / SUB;
                const g = screenToGeo(frame, px + (s - t) * (TILE_W / 2), py + (s + t) * (TILE_H / 2));
                if (source.waterAt(g.lat, g.lng)) n++;
            }
            if (n >= WATER_MIN) {
                water[gy][gx] = true;
                if (!hasSea) {
                    const g = screenToGeo(frame, px, py);
                    if (source.elevAt(g.lat, g.lng) <= 0) hasSea = true;
                }
            } else if (n >= FORD_MIN) {
                ford[gy][gx] = true;
            }
        }
    }
    const isW = (gx: number, gy: number) => gx >= 0 && gy >= 0 && gx < gw && gy < gh && water[gy][gx];
    const isWF = (gx: number, gy: number) => isW(gx, gy) || (gx >= 0 && gy >= 0 && gx < gw && gy < gh && ford[gy][gx]);
    const deep: Array<[number, number]> = [];
    const shallow: Array<[number, number]> = [];
    const sand: Array<[number, number]> = [];
    let waterCells = 0;
    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            if (water[gy][gx]) {
                waterCells++;
                if (isW(gx - 1, gy) && isW(gx + 1, gy) && isW(gx, gy - 1) && isW(gx, gy + 1)) deep.push([gx, gy]);
                else shallow.push([gx, gy]);
            } else if (ford[gy][gx]) {
                waterCells++;
                shallow.push([gx, gy]);
            } else {
                let near = false;
                for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (isWF(gx + dx, gy + dy)) { near = true; break; }
                if (near && !keepDryFlat(cellX(gx, gy), cellY(gx, gy))) sand.push([gx, gy]);
            }
        }
    }
    const isWater = (x: number, y: number): boolean => {
        const a = (x - ox) * 2 / TILE_W, b = (y - oy) * 2 / TILE_H;
        return isWF(Math.round((a + b) / 2), Math.round((b - a) / 2));
    };

    // 2) 丘陵：只在原生成器同一包络（x 18%~82%、y 20%~80%）内、非水非保平的格起丘
    const room = (px: number, py: number): number => Math.min(
        (px - VW * 0.18) / (TILE_W / 2), (VW * 0.82 - px) / (TILE_W / 2),
        (py - VH * 0.20) / (TILE_H / 2), (VH * 0.80 - py) / (TILE_H / 2),
    );
    // 海里给的是海底深度（负数），按 0 米截平；城本身低于海平面（吐鲁番、死海）时不截
    const floorM = Math.min(0, source.elevAt(frame.lat, frame.lng));
    const cells: Array<{ gx: number; gy: number; e: number; r: number; u: number; room: number }> = [];
    for (let gy = 3; gy <= gh - 4; gy++) {
        for (let gx = 3; gx <= gw - 4; gx++) {
            const px = cellX(gx, gy), py = cellY(gx, gy);
            const rm = room(px, py);
            if (rm < 0 || water[gy][gx] || ford[gy][gx] || keepDryFlat(px, py)) continue;
            const g = screenToGeo(frame, px, py);
            cells.push({ gx, gy, e: Math.max(floorM, source.elevAt(g.lat, g.lng)), r: px, u: -py * 2, room: rm });
        }
    }
    // 去掉整片的大斜面（最小二乘平面）：DE 丘陵表现局部山包与谷地，整场都在山坡上时按绝对海拔会抬成一块方台
    let a = 0, b = 0, c = 0;
    if (cells.length >= 3) {
        let sR = 0, sU = 0, se = 0, sRR = 0, sUU = 0, sRU = 0, sRe = 0, sUe = 0;
        for (const p of cells) {
            sR += p.r; sU += p.u; se += p.e; sRR += p.r * p.r; sUU += p.u * p.u; sRU += p.r * p.u; sRe += p.r * p.e; sUe += p.u * p.e;
        }
        const n = cells.length;
        const mR = sR / n, mU = sU / n, me = se / n;
        const vRR = sRR / n - mR * mR, vUU = sUU / n - mU * mU, vRU = sRU / n - mR * mU;
        const cRe = sRe / n - mR * me, cUe = sUe / n - mU * me;
        const det = vRR * vUU - vRU * vRU;
        if (Math.abs(det) > 1e-9) { b = (cRe * vUU - cUe * vRU) / det; c = (cUe * vRR - cRe * vRU) / det; }
        a = me - b * mR - c * mU;
    }
    const resid = (p: { e: number; r: number; u: number }) => p.e - (a + b * p.r + c * p.u);
    const rs = cells.map(resid).sort((x, y) => x - y);
    const pick = (q: number) => rs.length ? rs[Math.min(rs.length - 1, Math.floor(q * rs.length))] : 0;
    const base = pick(0.20);
    const reliefM = pick(0.95) - pick(0.05);
    const stepM = Math.min(MAX_STEP_M, Math.max(MIN_STEP_M, (pick(0.95) - base) / MAX_LEVEL));
    const elevation: number[][] = Array.from({ length: gh }, () => new Array(gw).fill(0));
    if (reliefM >= MIN_RELIEF_M && cells.length >= MIN_HILL_CELLS) {
        for (const p of cells) {
            const lv = Math.max(0, Math.min(MAX_LEVEL, Math.floor((resid(p) - base) / stepM)));
            // 越靠包络边整体往下减得越多（每 2 格 1 级）：边上是缓坡，等高线顺着原地形走而不是平行于边框
            elevation[p.gy][p.gx] = Math.max(0, lv - Math.max(0, MAX_LEVEL - Math.floor(p.room / 2)));
        }
        // 相邻格高差 ≤ 1：只削高不填低，与 DE 缓坡一致
        for (let changed = true, guard = 0; changed && guard < 8; guard++) {
            changed = false;
            for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
                const h = elevation[gy][gx];
                if (h <= 0) continue;
                let lo = h;
                if (gx > 0) lo = Math.min(lo, elevation[gy][gx - 1]);
                if (gx < gw - 1) lo = Math.min(lo, elevation[gy][gx + 1]);
                if (gy > 0) lo = Math.min(lo, elevation[gy - 1][gx]);
                if (gy < gh - 1) lo = Math.min(lo, elevation[gy + 1][gx]);
                if (h > lo + 1) { elevation[gy][gx] = lo + 1; changed = true; }
            }
        }
    }
    let raisedCells = 0;
    for (const row of elevation) for (const h of row) if (h > 0) raisedCells++;
    return { deep, shallow, sand, isWater, elevation, hasSea, waterCells, reliefM, raisedCells };
}
