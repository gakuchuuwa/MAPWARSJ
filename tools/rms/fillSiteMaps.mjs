/**
 * 给据点补「真实地理战场图」（2026-10-13 主人令「做出一套干净、可靠的真实地理」）。
 * 三步，全按**据点自己的坐标**取料（水网格不再借几公里外的旧缓存）：
 *   ① 高程：缺的 z13 Terrarium 瓦片从 AWS 公开地形瓦片下载到 scratch/tiles_z13/fill_<x>_<y>.png；
 *   ② 水体：缺的 WorldCover 水网格照 tools/rms/bakeWater50.mjs 的办法，用 preview.html 生成到
 *           scratch/worldcover/site_cache/grid_<lat4>_<lng4>.json；
 *   ③ 烘图：调 scratch/_bake_site_maps.mjs（不改它）。
 * 用法：
 *   node tools/rms/fillSiteMaps.mjs --scenario          # 剧本各场守方据点
 *   node tools/rms/fillSiteMaps.mjs --all               # 全部据点（可断点续跑）
 *   node tools/rms/fillSiteMaps.mjs city_a city_b       # 指定据点
 *   加 --redo-offset 时，水网格离据点 >0.5 km 的旧图也重做
 * 据点挪过位置（图里记的坐标与据点表差 >0.5 km）一律重做。
 * 新增据点自动出图：tools/siteMapWatcher.mjs 随 npm run dev 启动，据点表一改就调本脚本 --all。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { cellLatLng, CELLS } from './skeleton.mjs';

const OUT = 'public/battlefields', TILES = 'scratch/tiles_z13', WC = 'scratch/worldcover/site_cache';
const Z = 13, TS = 256, PORT = 5181;
const argv = process.argv.slice(2);

const src = fs.readFileSync('src/data/cities_v2.ts', 'utf8') + fs.readFileSync('src/data/Battlefields.ts', 'utf8');
const ALL = [...new Map([...src.matchAll(/id:\s*'([^']+)'[\s\S]{0,200}?lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)/g)]
    .map((m) => [m[1], { id: m[1], lat: +m[2], lng: +m[3] }])).values()];
const byId = new Map(ALL.map((p) => [p.id, p]));

let ids;
if (argv.includes('--all')) ids = ALL.filter((p) => p.id.startsWith('city_')).map((p) => p.id);
else if (argv.includes('--scenario')) {
    const s = fs.readFileSync('src/data/HistoricalEventScript.ts', 'utf8');
    ids = [...new Set([...s.matchAll(/defenderCityId:\s*'([^']+)'/g)].map((m) => m[1]))];
} else ids = argv.filter((a) => !a.startsWith('--'));

const redoOffset = argv.includes('--redo-offset');
const kmBetween = (aLat, aLng, bLat, bLng) => Math.hypot((aLat - bLat) * 111.32, (aLng - bLng) * 111.32 * Math.cos((aLat * Math.PI) / 180));
const siteOk = (id) => {
    const f = path.join(OUT, `site_${id}.json`);
    if (!fs.existsSync(f)) return false;
    try {
        const sk = JSON.parse(fs.readFileSync(f, 'utf8')).header?.skeleton;
        const p = byId.get(id);
        if (!sk || kmBetween(sk.lat, sk.lng, p.lat, p.lng) > 0.5) return false;   // 据点挪过位置
        return !redoOffset || (sk.water === 'WorldCover' && (sk.waterOffsetKm ?? 99) <= 0.5);
    } catch { return false; }
};
const targets = ids.map((id) => byId.get(id)).filter(Boolean).filter((p) => !siteOk(p.id));
const unknown = ids.filter((id) => !byId.has(id));
if (unknown.length) console.log(`  ⚠ 据点表里找不到：${unknown.join(', ')}`);
console.log(`  待补 ${targets.length} 个据点`);
if (!targets.length) process.exit(0);

// 同一时间只许跑一份（看门程序与手动运行可能撞车）
const LOCK = 'scratch/out/fill_site_maps.lock';
fs.mkdirSync('scratch/out', { recursive: true });
if (fs.existsSync(LOCK)) {
    const pid = Number(fs.readFileSync(LOCK, 'utf8'));
    let alive = false;
    try { process.kill(pid, 0); alive = true; } catch {}
    if (alive) { console.log(`  已有一份在跑（pid ${pid}），本次退出`); process.exit(0); }
}
fs.writeFileSync(LOCK, String(process.pid));
process.on('exit', () => { try { if (fs.readFileSync(LOCK, 'utf8') === String(process.pid)) fs.unlinkSync(LOCK); } catch {} });

// ── ① 高程瓦片 ─────────────────────────────────────────
const have = new Set(fs.readdirSync(TILES).map((f) => /_(\d+)_(\d+)\.png$/.exec(f)).filter(Boolean).map((r) => `${r[1]}_${r[2]}`));
const webMerc = (lat, lng) => { const n = 2 ** Z * TS, r = (lat * Math.PI) / 180; return [(lng + 180) / 360 * n, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n]; };
const tileFails = [];
for (const p of targets) {
    const need = new Set();
    for (const [x, y] of [[0, 0], [CELLS - 1, 0], [0, CELLS - 1], [CELLS - 1, CELLS - 1], [CELLS >> 1, 0], [0, CELLS >> 1], [CELLS - 1, CELLS >> 1], [CELLS >> 1, CELLS - 1]]) {
        const [la, ln] = cellLatLng(x, y, p.lat, p.lng);
        const [gx, gy] = webMerc(la, ln);
        need.add(`${Math.floor(gx / TS)}_${Math.floor(gy / TS)}`);
    }
    for (const k of need) {
        if (have.has(k)) continue;
        const [tx, ty] = k.split('_');
        const u = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`;
        try {
            const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
            if (!r.ok) throw new Error(String(r.status));
            fs.writeFileSync(path.join(TILES, `fill_${tx}_${ty}.png`), Buffer.from(await r.arrayBuffer()));
            have.add(k);
        } catch (e) { tileFails.push(`${p.id} ${k} ${e.message}`); }
    }
}
console.log(`  ① 高程瓦片完成${tileFails.length ? `，失败 ${tileFails.length}：${tileFails.slice(0, 3).join(' ｜ ')}` : ''}`);

// ── ② WorldCover 水网格（照 bakeWater50.mjs）────────────────
const key = (p) => `grid_${p.lat.toFixed(4)}_${p.lng.toFixed(4)}.json`;
const needWater = targets.filter((p) => !fs.existsSync(path.join(WC, key(p))));
const waterFails = [];
if (needWater.length) {
    const srv = spawn(process.execPath, ['tools/rms/viewer/serve.mjs', String(PORT), '--strictPort'], { stdio: 'ignore' });
    await new Promise((r) => setTimeout(r, 2500));
    const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1400, height: 1000 } });
    try {
        const page = await b.newPage();
        await page.goto(`http://127.0.0.1:${PORT}/tools/rms/viewer/preview.html`, { waitUntil: 'load', timeout: 60000 });
        await new Promise((r) => setTimeout(r, 3000));
        // 代理会把半截下载存进 cog_cache，之后每次都读坏块（实测哈利卡纳苏斯 / 奥诺斯岩）⇒ 失败一次就把该瓦片的缓存挪进隔离目录再试
        const COG = 'scratch/worldcover/cog_cache', QUAR = 'scratch/worldcover/cog_cache_quarantine';
        const wcTile = (p) => { const a = Math.floor(p.lat / 3) * 3, o = Math.floor(p.lng / 3) * 3; return `${a < 0 ? 'S' : 'N'}${String(Math.abs(a)).padStart(2, '0')}${o < 0 ? 'W' : 'E'}${String(Math.abs(o)).padStart(3, '0')}`; };
        const queue = needWater.map((p) => ({ p, retried: false }));
        let n = 0;
        while (queue.length) {
            const { p, retried } = queue.shift();
            const f = path.join(WC, key(p));
            n++;
            try {
                await page.evaluate((v1, v2) => {
                    for (const [id, v] of [['inLat', v1], ['inLng', v2]]) {
                        const el = document.getElementById(id); if (!el) continue;
                        el.value = String(v);
                        for (const t of ['input', 'change', 'blur']) el.dispatchEvent(new Event(t, { bubbles: true }));
                    }
                }, p.lat, p.lng);
                await page.click('#btnGen');
                let waited = 0;
                while (waited < 45000 && !fs.existsSync(f)) { await new Promise((r) => setTimeout(r, 500)); waited += 500; }
                if (fs.existsSync(f)) console.log(`  ② [${n}/${needWater.length}] ✅ ${p.id}（${(waited / 1000).toFixed(1)} s）`);
                else if (!retried) {
                    fs.mkdirSync(QUAR, { recursive: true });
                    for (const c of fs.readdirSync(COG).filter((x) => x.includes(`_${wcTile(p)}_`))) fs.renameSync(path.join(COG, c), path.join(QUAR, c));
                    queue.push({ p, retried: true });
                    console.log(`  ② [${n}] ↻ ${p.id} 隔离 ${wcTile(p)} 缓存后重试`);
                }
                else { waterFails.push(p.id); console.log(`  ② [${n}/${needWater.length}] ❌ ${p.id} 45 s 无水网格`); }
            } catch (e) { waterFails.push(p.id); console.log(`  ② ❌ ${p.id} ${String(e.message).slice(0, 80)}`); }
            await new Promise((r) => setTimeout(r, 1500));
        }
    } finally {
        await b.close();
        try { srv.kill(); } catch {}
    }
}
console.log(`  ② 水网格完成${waterFails.length ? `，失败 ${waterFails.length}：${waterFails.join(', ')}` : ''}`);

// ── ③ 烘图（只烘水网格齐了的；缺水的不烘，免得出「只有高程」的假图）────
const ready = targets.filter((p) => fs.existsSync(path.join(WC, key(p)))).map((p) => p.id);
for (let i = 0; i < ready.length; i += 40) {
    const r = spawnSync('npx', ['tsx', 'scratch/_bake_site_maps.mjs', ...ready.slice(i, i + 40)], { stdio: 'inherit', shell: true });
    if (r.status !== 0) console.log(`  ③ 第 ${i / 40 + 1} 批退出码 ${r.status}`);
}
fs.mkdirSync('scratch/out', { recursive: true });
fs.writeFileSync('scratch/out/fill_site_maps_report.json', JSON.stringify({ at: new Date().toISOString(), targets: targets.length, baked: ready.length, tileFails, waterFails }, null, 1));
console.log(`  ==== 待补 ${targets.length} ｜ 烘图 ${ready.length} ｜ 缺水网格 ${waterFails.length} ｜ 缺高程 ${tileFails.length} ====`);
