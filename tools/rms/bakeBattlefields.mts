/** 战场骨架烘焙（手动运行：npx tsx --import ./tools/sim-preload.mjs tools/rms/bakeBattlefields.mjs）
 *  只读：scratch/worldcover/site_cache/grid_*.json（AA 的 WorldCover 10m 去桥网格，键 waterGrid = 120×120）
 *        scratch/tiles_z13/*.png（z13 Terrarium 高程）
 *  Köppen/主题：用**游戏源码**的 resolveClimateRegion ＋ tools/rms/theme.mjs 的 pickTheme（不另写判定）
 *  格式：高度级(0~7, 14400 B) + 陆水位(14400 bit → 1800 B) + 悬崖(Uint16) + 头(JSON) ⇒ zlib
 */
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib';
import sharp from 'sharp';
import { pickTheme } from './theme.mjs';
import { encodeSkeleton } from '../src/systems/battlefield/bakeFormat.mjs';
import { resolveClimateRegion } from '../../src/ui/Scene13Biome';
const Z = 13, NT = 2 ** Z, TS = 256, S = 25, C = 120, C0 = 59.5;
const OUT = 'scratch/out/battlefields'; fs.mkdirSync(OUT, { recursive: true });
const WC = 'scratch/worldcover/site_cache';
const wcFiles = fs.existsSync(WC) ? fs.readdirSync(WC).filter((f) => f.startsWith('grid_')) : [];
function wcLoad(lat, lng) { let best = null, bd = 9e9; for (const f of wcFiles) { const m = /grid_(-?[\d.]+)_(-?[\d.]+)\.json/.exec(f); if (!m) continue; const d = Math.hypot(+m[1] - lat, +m[2] - lng); if (d < bd) { bd = d; best = f; } } return bd < 0.05 ? JSON.parse(fs.readFileSync(path.join(WC, best), 'utf8')) : null; }
const PLACES = [['city_vienna',48.2260,16.4100],['city_wuhan',30.5367,114.2645],['city_heze',35.2400,115.4400],['city_zermatt',46.0200,7.7500],['city_rome',41.9,12.5],['city_cairo',30.04,31.24],['city_lhasa',29.65,91.14],['city_guangzhou',23.13,113.26],['city_moscow',55.75,37.62],['bf_ulaanbaatar',47.92,106.92]];
const tp = (lat, lng) => { const r = lat * Math.PI / 180; return [(lng + 180) / 360 * NT * TS, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * NT * TS]; };
const res = [];
for (const [id, lat0, lng0] of PLACES) {
  const xs = [], ys = [];
  for (const [xi, yi] of [[0,0],[C-1,0],[0,C-1],[C-1,C-1]]) { const u = xi - C0, v = yi - C0, k = Math.SQRT2/2; const [px,py] = tp(lat0 + (-(u+v)*S*k)/111320, lng0 + ((v-u)*S*k)/(111320*Math.cos(lat0*Math.PI/180))); xs.push(px); ys.push(py); }
  const blocks = new Map();
  for (let tx = Math.floor(Math.min(...xs)/TS); tx <= Math.floor(Math.max(...xs)/TS); tx++) for (let ty = Math.floor(Math.min(...ys)/TS); ty <= Math.floor(Math.max(...ys)/TS); ty++) {
    const f = path.join('scratch/tiles_z13', tx + '_' + ty + '.png'); if (!fs.existsSync(f)) continue;
    const { data } = await sharp(f).raw().toBuffer({ resolveWithObject: true }); blocks.set(tx + '_' + ty, data);
  }
  const H = new Float32Array(C*C).fill(NaN);
  for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) {
    const u = x - C0, v = y - C0, k = Math.SQRT2/2;
    const [px,py] = tp(lat0 + (-(u+v)*S*k)/111320, lng0 + ((v-u)*S*k)/(111320*Math.cos(lat0*Math.PI/180)));
    const tx = Math.floor(px/TS), ty = Math.floor(py/TS), data = blocks.get(tx + '_' + ty); if (!data) continue;
    const fx = px-tx*TS, fy = py-ty*TS, ix = Math.min(TS-2,Math.floor(fx)), iy = Math.min(TS-2,Math.floor(fy)), a = fx-ix, b = fy-iy;
    const g = (m, n) => { const o = ((iy+n)*TS+(ix+m))*3; return data[o]*256 + data[o+1] + data[o+2]/256 - 32768; };
    H[y*C+x] = g(0,0)*(1-a)*(1-b)+g(1,0)*a*(1-b)+g(0,1)*(1-a)*b+g(1,1)*a*b;
  }
  let hmin = Infinity, hmax = -Infinity; for (let i = 0; i < C*C; i++) if (!Number.isNaN(H[i])) { if (H[i] < hmin) hmin = H[i]; if (H[i] > hmax) hmax = H[i]; }
  const relief = hmax - hmin, step = relief < 25 ? 25 : (relief <= 175 ? 25 : relief/7);
  const lv = new Uint8Array(C*C); for (let i = 0; i < C*C; i++) { const v0 = Number.isNaN(H[i]) ? hmin : H[i]; lv[i] = relief < 25 ? 0 : Math.max(0, Math.min(7, Math.floor((v0-hmin)/step))); }
  const wc = wcLoad(lat0, lng0);
  const waterMask = new Uint8Array((C*C + 7) >> 3);
  if (wc && Array.isArray(wc.waterGrid)) for (let i = 0; i < C*C; i++) if (wc.waterGrid[i]) waterMask[i >> 3] |= 1 << (i & 7);
  const slope = new Float32Array(C*C);
  for (let y = 1; y < C-1; y++) for (let x = 1; x < C-1; x++) { const i = y*C+x, v0 = H[i]; if (Number.isNaN(v0) || Number.isNaN(H[i-1]) || Number.isNaN(H[i+1]) || Number.isNaN(H[i-C]) || Number.isNaN(H[i+C])) continue; slope[i] = Math.max(Math.abs(v0-H[i-1]), Math.abs(v0-H[i+1]), Math.abs(v0-H[i-C]), Math.abs(v0-H[i+C])); }
  const bnd = new Uint8Array(C*C);
  for (let y = 1; y < C-1; y++) for (let x = 1; x < C-1; x++) { const i = y*C+x; if (slope[i] < 25) continue; if (lv[i] !== lv[i-1] || lv[i] !== lv[i+1] || lv[i] !== lv[i-C] || lv[i] !== lv[i+C]) bnd[i] = 1; }
  const cliffs = []; for (let i = 0; i < C*C; i++) if (bnd[i] && !Number.isNaN(H[i])) cliffs.push(i);
  const kcode = resolveClimateRegion(lat0, lng0); const th = pickTheme(lat0, lng0, kcode);
  const theme = (th && th.theme) ? th.theme : String(th);
  const raw = encodeSkeleton({ header: { id, lat: lat0, lng: lng0, hmin: Math.round(hmin), hmax: Math.round(hmax), step: Math.round(step), koppen: kcode, theme, water: !!wc }, levels: lv, water: waterMask, cliffs });
  const z = zlib.deflateSync(raw, { level: 9 });
  fs.writeFileSync(path.join(OUT, id + '.bin'), z);
  res.push({ id, koppen: kcode, theme, water: !!wc, cliffs: cliffs.length, raw: raw.length, zip: z.length });
  console.log('  ' + id.padEnd(15) + ' Köppen ' + String(kcode).padEnd(4) + ' ｜ ' + String(theme).padEnd(32) + ' ｜ 水 ' + (wc ? 'WorldCover ✅' : '**无缓存（报缺）**') + ' ｜ 悬崖 ' + String(cliffs.length).padStart(3) + ' ｜ 裸 ' + String(raw.length).padStart(6) + ' B → zlib ' + String(z.length).padStart(5) + ' B');
}
const sum = res.reduce((a, r) => a + r.zip, 0);
console.log('  ==== 10 点 zlib 合计 ' + sum + ' B（均 ' + Math.round(sum/10) + ' B）｜ ≤5 KB/点 ' + (res.every((r) => r.zip <= 5120) ? '✅ 达标' : '⚠️ 未达标') + ' ====');
console.log('  ⇒ 推算 1137 个：' + (sum/10*1137/1024/1024).toFixed(2) + ' MB');
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ records: res, totalZip: sum }, null, 1));
