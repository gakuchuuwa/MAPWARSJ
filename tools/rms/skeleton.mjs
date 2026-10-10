/**
 * 骨架原型（DD）—— 真实地理 → 120×120 战场骨架的两个取样函数。
 * **只读** 数据：高程瓦片从 `scratch/tiles_z13/`（z13 Terrarium，已批准拉取）读；**缺瓦片返回 null 并报缺哪些，不自动联网**。
 * 方向公式（CC 第 68 轮更正，含 transposeMapData 对调）：北 = 格(−1,−1)、东 = 格(x−1,y+1)：
 *   Δ東 = (v − u)·s/√2 ，  Δ北 = −(u + v)·s/√2      （u = x − 59.5, v = y − 59.5, s = 25 m）
 * 反解：u = −(Δ東+Δ北)·√2/(2s)，v = (Δ東−Δ北)·√2/(2s)
 */
import fs from 'node:fs';
import path from 'node:path';

export const CELLS = 120, CELL_M = 25, C0 = 59.5, DEM_ZOOM = 13, TILE = 256;
const DIR = 'scratch/tiles_z13';

/** 已下载瓦片索引：tx_ty → 文件（文件名任意，取 `_<tx>_<ty>.png` 尾部） */
export function tileIndex(dir = DIR) {
  const m = new Map();
  if (!fs.existsSync(dir)) return m;
  for (const f of fs.readdirSync(dir)) {
    const r = /_(\d+)_(\d+)\.png$/.exec(f);
    if (r) m.set(`${r[1]}_${r[2]}`, path.join(dir, f));
  }
  return m;
}
const webMerc = (lat, lng, z = DEM_ZOOM) => {
  const n = 2 ** z * TILE, r = (lat * Math.PI) / 180;
  return [(lng + 180) / 360 * n, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n];
};

/** 格 → 经纬度（战场中心 lat0/lng0，边长 3 km） */
export function cellLatLng(x, y, lat0, lng0) {
  const u = x - C0, v = y - C0, s = CELL_M, k = Math.SQRT2 / 2;
  const dE = (v - u) * s * k, dN = -(u + v) * s * k;
  return [lat0 + dN / 111320, lng0 + dE / (111320 * Math.cos((lat0 * Math.PI) / 180))];
}

/**
 * sampleElevation(lat, lng) → { elev: number[120][120] | null, missing: string[], stats }
 * 分级（CC 第 68 轮）：高差<25 m ⇒ 全 0 级；否则 step = 高差≤175 ? 25 : 高差/7；level = clamp(floor((h−hmin)/step),0,7)
 * **推断**：25 m/级、"本地最低点为 0 级"未由 DE 数据验证。
 */
export function sampleElevation(lat0, lng0, { dir = DIR, decodeCache = new Map() } = {}) {
  const idx = tileIndex(dir);
  const need = new Set(), out = [], px = [], py = [];
  for (let y = 0; y < CELLS; y++) for (let x = 0; x < CELLS; x++) {
    const [la, ln] = cellLatLng(x, y, lat0, lng0);
    const [gx, gy] = webMerc(la, ln);
    need.add(`${Math.floor(gx / TILE)}_${Math.floor(gy / TILE)}`);
    px.push(gx); py.push(gy);
  }
  const missing = [...need].filter((k) => !idx.has(k));
  if (missing.length) return { elev: null, missing, stats: null };
  const raw = new Map();
  for (const k of need) {
    if (!decodeCache.has(k)) {
      const buf = fs.readFileSync(idx.get(k));
      decodeCache.set(k, { buf, w: TILE, h: TILE });
    }
    raw.set(k, decodeCache.get(k));
  }
  // 最小 PNG 解码：本模块不引第三方库 ⇒ 用 sharp 若可用，否则报错（调用方可传 decodeCache 预解码）
  let sharp = null;
  try { sharp = require('sharp'); } catch { /* 由调用方预解码 */ }
  const h = new Float64Array(CELLS * CELLS).fill(NaN);
  for (let i = 0; i < px.length; i++) {
    const tx = Math.floor(px[i] / TILE), ty = Math.floor(py[i] / TILE), k = `${tx}_${ty}`;
    const tile = raw.get(k);
    if (!tile.pixels) return { elev: null, missing: ['(需先解码：' + k + ')'], stats: null };
    const fx = px[i] - tx * TILE, fy = py[i] - ty * TILE;
    const ix = Math.min(TILE - 2, Math.floor(fx)), iy = Math.min(TILE - 2, Math.floor(fy));
    const tx2 = fx - ix, ty2 = fy - iy, W = TILE;
    const g = (a, b) => { const o = ((iy + b) * W + (ix + a)) * 3; return tile.pixels[o] * 256 + tile.pixels[o + 1] + tile.pixels[o + 2] / 256 - 32768; };
    h[i] = g(0, 0) * (1 - tx2) * (1 - ty2) + g(1, 0) * tx2 * (1 - ty2) + g(0, 1) * (1 - tx2) * ty2 + g(1, 1) * tx2 * ty2;
  }
  const valid = [...h].filter((v) => !Number.isNaN(v));
  const hmin = Math.min(...valid), hmax = Math.max(...valid), relief = hmax - hmin;
  const step = relief < 25 ? 25 : (relief <= 175 ? 25 : relief / 7);
  const elev = Array.from({ length: CELLS }, (_, y) => Array.from({ length: CELLS }, (_, x) => {
    const v = h[y * CELLS + x];
    if (Number.isNaN(v)) return 0;
    return 0 === 0 && relief < 25 ? 0 : Math.max(0, Math.min(7, Math.floor((v - hmin) / step)));
  }));
  const hist = new Array(8).fill(0);
  for (const row of elev) for (const v of row) hist[v]++;
  return { elev, missing: [], stats: { hmin: +hmin.toFixed(1), hmax: +hmax.toFixed(1), relief: +relief.toFixed(1), step: +step.toFixed(1), hist } };
}

export { pickTheme } from './theme.mjs';

