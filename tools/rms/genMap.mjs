/**
 * 跑一张 DE 随机地图并出图 + 统计。
 *   node tools/rms/genMap.mjs <脚本名，如 Arabia.rms> [种子=1] [边长=120] [输出png]
 * 输出：PNG 俯视图（地形着色 + 高程明暗 + 物件点）与地形占比统计（对照 public/de-maps 的 DE 真图）。
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { DE_RMS_DIR, loadScript } from './rmsParse.mjs';
import { MapEngine } from './rmsEngine.mjs';

const [, , scriptName = 'Arabia.rms', seedArg = '1', sizeArg = '120', outArg] = process.argv;
const seed = Number(seedArg), size = Number(sizeArg);

/** random_map.def → { terrain: Map<值,名>, object: Map<值,名> } */
function buildNames() {
    const text = fs.readFileSync(path.join(DE_RMS_DIR, 'random_map.def'), 'utf8');
    const terrain = new Map(), object = new Map();
    let mode = 'object';
    for (const line of text.split(/\r?\n/)) {
        const h = line.match(/^\s*\/\*\s*([A-Za-z][^*]*?)\s*\*\/\s*$/);
        if (h) { mode = /^Terrain Types$/i.test(h[1]) ? 'terrain' : /Cliff|Colour|Water Def|Random Map|Standard|Capture/i.test(h[1]) ? 'other' : mode === 'terrain' ? 'other' : mode; continue; }
        const m = line.match(/^#const\s+(\w+)\s+(-?\d+)/);
        if (!m) continue;
        const v = Number(m[2]);
        const target = mode === 'terrain' ? terrain : mode === 'object' ? object : null;
        if (target && !target.has(v)) target.set(v, m[1]);
    }
    return { terrain, object };
}
const { terrain: tNames, object: oNames } = buildNames();

const { sections, pre } = loadScript(scriptName, { seed, defines: [] });
const eng = new MapEngine(sections, { size, players: 2, seed, names: tNames }).run();

// ── 统计 ──
const N = size, total = N * N;
const hist = new Map();
for (const t of eng.terrain) hist.set(t, (hist.get(t) ?? 0) + 1);
const pct = (n) => (100 * n / total).toFixed(1) + '%';
console.log(`脚本 ${scriptName}  种子 ${seed}  边长 ${N}  物件 ${eng.objects.length}`);
console.log('地形占比：', [...hist.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${tNames.get(t) ?? t} ${pct(n)}`).join(' · '));
let elevated = 0; for (const e of eng.elev) if (e > 0) elevated++;
console.log(`有高度的格子：${pct(elevated)}  最高 ${Math.max(...eng.elev)}`);
const cat = (id) => { const n = oNames.get(id) ?? ''; return /TREE|FOREST|PINE|PALM|OAK|BIRCH|BAOBAB|BAMBOO|CYPRESS|MANGROVE/.test(n) ? '树' : /GOLD/.test(n) ? '金' : /STONE/.test(n) ? '石' : /BERRY|BUSH|FORAGE/.test(n) ? '浆果' : /DEER|BOAR|SHEEP|LLAMA|ZEBRA|ELEPHANT|OSTRICH|GAZELLE|IBEX|TURKEY|COW|GOAT|WOLF|LION|RHINO|CAMEL|BEAR/.test(n) ? '动物' : '其他'; };
const ocount = new Map();
for (const o of eng.objects) ocount.set(cat(o.id), (ocount.get(cat(o.id)) ?? 0) + 1);
const top = new Map();
for (const o of eng.objects) { const k = oNames.get(o.id) ?? o.id; top.set(k, (top.get(k) ?? 0) + 1); }
console.log('物件前 10：', [...top.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, n]) => `${k}:${n}`).join(' '));
console.log('物件分类：', [...ocount.entries()].map(([k, n]) => `${k} ${n}`).join(' · '));
if (eng.unsupported.size) console.log('未实现的指令（按次数）：', [...eng.unsupported.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, n]) => `${k}×${n}`).join(' '));
if (pre.missingIncludes) console.log('本机缺少的 include：', [...pre.missingIncludes].join(', '));

// ── 渲染 ──
const PX = 6, W = N * PX;
const px = Buffer.alloc(W * W * 3);
const colorOf = (t) => {
    const n = tNames.get(t) ?? '';
    if (/WATER|SHALLOW|OCEAN|SEA/.test(n)) return [58, 110, 180];
    if (/BEACH|SAND/.test(n)) return [222, 205, 150];
    if (/SNOW|ICE/.test(n)) return [235, 240, 245];
    if (/FOREST|JUNGLE|BAMBOO|PINE|OAK|SPRUCE/.test(n)) return [40, 92, 44];
    if (/DESERT|DUNE/.test(n)) return [214, 184, 116];
    if (/DIRT|MUD|ROAD|PATH|CRACKS|BASALT|ROCK/.test(n)) return [150, 112, 74];
    if (/GRASS|MEADOW|LEAVES|WEEDS|PLACEHOLDER/.test(n)) return [112, 160, 72];
    const h = (t * 2654435761) >>> 0; return [80 + (h & 63), 80 + ((h >> 6) & 63), 80 + ((h >> 12) & 63)];
};
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    let [r, g, b] = colorOf(eng.terrain[i]);
    const e = eng.elev[i];
    const shade = 1 + e * 0.07;
    r = Math.min(255, r * shade); g = Math.min(255, g * shade); b = Math.min(255, b * shade);
    for (let dy = 0; dy < PX; dy++) for (let dx = 0; dx < PX; dx++) {
        const o = ((y * PX + dy) * W + x * PX + dx) * 3;
        px[o] = r; px[o + 1] = g; px[o + 2] = b;
    }
}
const dot = (cx, cy, rad, c) => {
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (dx * dx + dy * dy > rad * rad) continue;
        const x = Math.round(cx * PX) + dx, y = Math.round(cy * PX) + dy;
        if (x < 0 || y < 0 || x >= W || y >= W) continue;
        const o = (y * W + x) * 3; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
    }
};
const COL = { 树: [14, 54, 20], 金: [255, 215, 0], 石: [120, 120, 130], 浆果: [200, 40, 90], 动物: [140, 90, 40], 其他: [255, 255, 255] };
for (const o of eng.objects) dot(o.x, o.y, cat(o.id) === '树' ? 2 : 3, COL[cat(o.id)]);
for (const s of eng.starts) dot(s.x + 0.5, s.y + 0.5, 9, [220, 30, 30]);

function png(width, height, rgb) {
    const raw = Buffer.alloc((width * 3 + 1) * height);
    for (let y = 0; y < height; y++) { raw[y * (width * 3 + 1)] = 0; rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3); }
    const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
    const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cr]); };
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const out = outArg ?? `claudedocs/rms-spike/${path.basename(scriptName, '.rms')}_${seed}.png`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png(W, W, px));
console.log('已输出', out);
