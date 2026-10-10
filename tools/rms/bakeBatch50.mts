/** 50 点高程批量（限速 2 请求/秒；可续跑；失败单独记录）—— CC 第 98 轮第 2 项（高程侧） */
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib';
const Z = 13, NT = 2 ** Z, TS = 256, S = 25, C = 120, C0 = 59.5;
const TILES = 'scratch/tiles_z13', OUT = 'scratch/out/battlefields50'; fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TILES, { recursive: true });
const src = fs.readFileSync('src/data/cities_v2.ts', 'utf8') + fs.readFileSync('src/data/Battlefields.ts', 'utf8');
const all = [...src.matchAll(/id:\s*'([^']+)'[\s\S]{0,200}?lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)/g)].map((m) => ({ id: m[1], lat: +m[2], lng: +m[3] }));
const inChina = (p) => p.lat >= 18 && p.lat <= 54 && p.lng >= 73 && p.lng <= 135;
const cn = all.filter(inChina).sort((a, b) => (a.lat - b.lat) || (a.lng - b.lng)).filter((_, i) => i % Math.max(1, Math.floor(all.filter(inChina).length / 16)) === 0).slice(0, 16);
const rest = all.filter((p) => !inChina(p));
const bucket = new Map(); for (const p of rest) { const k = `${Math.round(p.lat / 20)}_${Math.round(p.lng / 30)}`; if (!bucket.has(k)) bucket.set(k, p); }
const picked = [...cn, ...[...bucket.values()].slice(0, 34)];
console.log(`  选中 ${picked.length} 个（中国 ${cn.length} ｜ 其他 ${picked.length - cn.length}，覆盖 ${bucket.size} 个 20°×30° 区块）`);
const tp = (lat, lng) => { const r = lat * Math.PI / 180; return [(lng + 180) / 360 * NT * TS, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * NT * TS]; };
let dl = 0, bytes = 0, made = 0, skipped = 0; const fails = [];
const t0 = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const p of picked) {
  const out = path.join(OUT, p.id + '.bin');
  if (fs.existsSync(out)) { skipped++; continue; }
  try {
    const xs = [], ys = [];
    for (const [xi, yi] of [[0,0],[C-1,0],[0,C-1],[C-1,C-1]]) { const u = xi - C0, v = yi - C0, k = Math.SQRT2/2; const [px,py] = tp(p.lat + (-(u+v)*S*k)/111320, p.lng + ((v-u)*S*k)/(111320*Math.cos(p.lat*Math.PI/180))); xs.push(px); ys.push(py); }
    const H = new Float32Array(C*C).fill(NaN); let got = 0;
    const sharp = (await import('sharp')).default;
    for (let tx = Math.floor(Math.min(...xs)/TS); tx <= Math.floor(Math.max(...xs)/TS); tx++) for (let ty = Math.floor(Math.min(...ys)/TS); ty <= Math.floor(Math.max(...ys)/TS); ty++) {
      const f = path.join(TILES, `${tx}_${ty}.png`);
      if (!fs.existsSync(f)) {
        const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`;
        const r = await fetch(url);
        if (r.status === 429) { await sleep(5000); continue; }
        if (!r.ok) { fails.push(`${p.id}: tile ${r.status}`); continue; }
        const b = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(f, b); dl++; bytes += b.length; await sleep(500);
      }
      const { data } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
      for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) {
        const u = x - C0, v = y - C0, k = Math.SQRT2/2;
        const [px,py] = tp(p.lat + (-(u+v)*S*k)/111320, p.lng + ((v-u)*S*k)/(111320*Math.cos(p.lat*Math.PI/180)));
        if (Math.floor(px/TS) !== tx || Math.floor(py/TS) !== ty) continue;
        const fx = px-tx*TS, fy = py-ty*TS, ix = Math.min(TS-2,Math.floor(fx)), iy = Math.min(TS-2,Math.floor(fy)), a = fx-ix, b2 = fy-iy;
        const g = (m,n) => { const o = ((iy+n)*TS+(ix+m))*3; return data[o]*256+data[o+1]+data[o+2]/256-32768; };
        H[y*C+x] = g(0,0)*(1-a)*(1-b2)+g(1,0)*a*(1-b2)+g(0,1)*(1-a)*b2+g(1,1)*a*b2; got++;
      }
    }
    const nan = [...H].filter(Number.isNaN).length;
    if (nan) { fails.push(`${p.id}: NaN ${nan} 格（瓦片不全）`); continue; }
    let hmin = Infinity, hmax = -Infinity; for (const v of H) { if (v < hmin) hmin = v; if (v > hmax) hmax = v; }
    const relief = hmax - hmin, step = relief < 25 ? 25 : (relief <= 175 ? 25 : relief/7);
    const lv = new Uint8Array(C*C); for (let i = 0; i < C*C; i++) lv[i] = relief < 25 ? 0 : Math.max(0, Math.min(7, Math.floor((H[i]-hmin)/step)));
    const water = new Uint8Array((C*C+7)>>3);
    const raw = Buffer.concat([Buffer.from(JSON.stringify({ id: p.id, lat: p.lat, lng: p.lng, hmin: Math.round(hmin), hmax: Math.round(hmax), step: Math.round(step), water: false }) + '\n'), Buffer.from(lv.buffer), Buffer.from(water.buffer), Buffer.from(new Uint8Array(0))]);
    fs.writeFileSync(out, zlib.deflateSync(raw, { level: 9 })); made++;
    fs.writeFileSync(path.join(OUT, '_progress.json'), JSON.stringify({ made, skipped, dl, fails }, null, 1));
  } catch (e) { fails.push(`${p.id}: ${String(e.message).slice(0,60)}`); }
}
const ms = Date.now() - t0;
const sizes = fs.readdirSync(OUT).filter((f) => f.endsWith('.bin')).map((f) => fs.statSync(path.join(OUT, f)).size);
console.log(`  ==== 成功 ${made} ｜ 续跑跳过 ${skipped} ｜ 失败 ${fails.length} ｜ 新下瓦片 ${dl} 张 ${(bytes/1024).toFixed(0)} KB ｜ 用时 ${(ms/1000).toFixed(1)} s ｜ 均 ${sizes.length ? Math.round(sizes.reduce((a,b)=>a+b,0)/sizes.length) : 0} B/点 ====`);
if (fails.length) { console.log('  失败原因：'); fails.slice(0, 6).forEach((f) => console.log('   ' + f)); }
fs.writeFileSync(path.join(OUT, '_fails.json'), JSON.stringify(fails, null, 1));
