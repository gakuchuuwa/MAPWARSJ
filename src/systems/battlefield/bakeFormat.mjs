/**
 * 战场骨架烘焙格式 v1 —— **纯模块（不依赖 Node）**，烘焙脚本与游戏共用这一份。
 * 布局（全部小端）：
 *   magic 'BK' (2B) | version=1 (1B) | headerLen (2B) | headerJSON (UTF-8, 见下) |
 *   levels  Uint8[14400]          高度级 0~7
 *   water   Uint8[1800]           陆/水**按位**（1=水），bit i = 字节 i>>3 的第 (i&7) 位
 *   cliffs  Uint16[n]             悬崖格下标（预计算落点），n 由 header.cliffCount 给出
 * header 字段：{ v, id, lat, lng, hmin, hmax, step, koppen, theme, water:boolean, cliffCount }
 * 压缩：本模块**不含 zlib**（浏览器侧用 DecompressionStream('deflate')，Node 侧用 zlib）——载荷先 deflate 再落盘。
 */
export const MAGIC = [0x42, 0x4b];   // 'B','K'
export const VERSION = 1;
export const CELLS = 120;
const LEVELS = CELLS * CELLS, WATER = (CELLS * CELLS + 7) >> 3;

export function encodeSkeleton({ header, levels, water, cliffs }) {
  const h = new TextEncoder().encode(JSON.stringify({ v: VERSION, ...header, cliffCount: cliffs.length }, (k, v) => (v === undefined ? null : v)));
  const out = new Uint8Array(2 + 1 + 2 + h.length + LEVELS + WATER + cliffs.length * 2);
  let o = 0; out[o++] = MAGIC[0]; out[o++] = MAGIC[1]; out[o++] = VERSION; out[o++] = h.length & 255; out[o++] = (h.length >> 8) & 255;
  out.set(h, o); o += h.length; out.set(levels.subarray(0, LEVELS), o); o += LEVELS; out.set(water.subarray(0, WATER), o); o += WATER;
  for (const c of cliffs) { out[o++] = c & 255; out[o++] = (c >> 8) & 255; }
  return out;
}
export function decodeSkeleton(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (b[0] !== MAGIC[0] || b[1] !== MAGIC[1]) throw new Error('bad magic');
  const ver = b[2]; if (ver !== VERSION) throw new Error('bad version ' + ver);
  const hlen = b[3] | (b[4] << 8);
  const header = JSON.parse(new TextDecoder().decode(b.subarray(5, 5 + hlen)));
  let o = 5 + hlen;
  const levels = b.slice(o, o + LEVELS); o += LEVELS;
  const water = b.slice(o, o + WATER); o += WATER;
  const cliffs = []; for (let i = 0; i < header.cliffCount; i++) { cliffs.push(b[o] | (b[o + 1] << 8)); o += 2; }
  return { header, levels, water, cliffs };
}
export const isWaterAt = (water, i) => ((water[i >> 3] >> (i & 7)) & 1) === 1;
export const setWaterAt = (water, i, v) => { if (v) water[i >> 3] |= 1 << (i & 7); else water[i >> 3] &= ~(1 << (i & 7)); };
