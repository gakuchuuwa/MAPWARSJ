/** 批量取水 v2（CC 第 102 轮）：像人一样操作 preview.html。
 *  关键修正：① 填值后同时派发 input+change+blur（页面若只听 change 也能生效）；
 *           ② 判完成按真实文件名 grid_<lat4>_<lng4>.json（preview.html:319 siteKey 规则），500 ms 轮询、最多 30 s；
 *           ③ 失败时把页面信息栏/控制台文本一起记下来。
 *  用法：node tools/rms/bakeWater50.mjs [点数]    可断点续跑（缓存已有则跳过）
 */
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
const PORT = 5181, CACHE = 'scratch/worldcover/site_cache', LIMIT = Number(process.argv[2] ?? 50);
fs.mkdirSync(CACHE, { recursive: true });
const src = fs.readFileSync('src/data/cities_v2.ts', 'utf8') + fs.readFileSync('src/data/Battlefields.ts', 'utf8');
const all = [...src.matchAll(/id:\s*'([^']+)'[\s\S]{0,200}?lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)/g)].map((m) => ({ id: m[1], lat: +m[2], lng: +m[3] }));
const have = fs.existsSync('scratch/out/battlefields50') ? fs.readdirSync('scratch/out/battlefields50').filter((f) => f.endsWith('.bin')).map((f) => f.replace('.bin', '')) : [];
const picked = all.filter((p) => have.includes(p.id));
const seen = new Set(picked.map((p) => `${Math.round(p.lat / 20)}_${Math.round(p.lng / 30)}`));
for (const p of all) { if (picked.length >= LIMIT) break; if (picked.some((q) => q.id === p.id)) continue; const k = `${Math.round(p.lat / 20)}_${Math.round(p.lng / 30)}`; if (seen.has(k)) continue; seen.add(k); picked.push(p); }
const key = (p) => `grid_${p.lat.toFixed(4)}_${p.lng.toFixed(4)}.json`;
const srv = spawn(process.execPath, ['tools/rms/viewer/serve.mjs', String(PORT), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--window-size=1400,1000'], defaultViewport: { width: 1400, height: 1000 } });
const page = await b.newPage();
const logs = []; page.on('console', (m) => logs.push(m.text().slice(0, 120))); page.on('pageerror', (e) => logs.push('ERR ' + String(e.message).slice(0, 120)));
await page.goto(`http://127.0.0.1:${PORT}/tools/rms/viewer/preview.html`, { waitUntil: 'load', timeout: 60000 });
await new Promise((r) => setTimeout(r, 3000));
// CC 第 103 轮：删去点击 #bwaterSource——页面默认就是 WorldCover，点一下反而切成 125 米掩膜，永远不取 WorldCover（45/45 失败的根因）
let ok = 0, skip = 0; const fails = []; const t0 = Date.now();
for (const p of picked) {
  const f = path.join(CACHE, key(p));
  if (fs.existsSync(f)) { skip++; continue; }
  try {
    await page.evaluate((la, ln, v1, v2) => {
      const a = document.getElementById(la), c = document.getElementById(ln);
      for (const [el, v] of [[a, v1], [c, v2]]) { if (!el) continue; el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.dispatchEvent(new Event('blur', { bubbles: true })); }
    }, 'inLat', 'inLng', p.lat, p.lng);
    await page.click('#btnGen');
    let waited = 0, done = false;
    while (waited < 30000) { await new Promise((r) => setTimeout(r, 500)); waited += 500; if (fs.existsSync(f)) { done = true; break; } }
    if (done) { ok++; console.log(`  ✅ ${p.id} ${key(p)}（${(waited / 1000).toFixed(1)} s）`); }
    else { const info = await page.evaluate(() => (document.querySelector('.stat-bar, #stats, #info')?.textContent || '').slice(0, 160)); fails.push(`${p.id}: 30 s 无缓存 ｜ 信息栏「${info}」｜ 最后日志「${logs.slice(-1)[0] ?? ''}」`); console.log(`  ❌ ${p.id} 超时`); }
  } catch (e) { fails.push(`${p.id}: ${String(e.message).slice(0, 80)}`); }
  await new Promise((r) => setTimeout(r, 2000));
  fs.writeFileSync('scratch/out/water50_progress.json', JSON.stringify({ ok, skip, fails: fails.length, ms: Date.now() - t0, last: p.id }, null, 1));
}
fs.writeFileSync('scratch/out/water50_fails.json', JSON.stringify(fails, null, 1));
console.log(`  ==== 成功 ${ok} ｜ 跳过 ${skip} ｜ 失败 ${fails.length} ｜ 用时 ${((Date.now() - t0) / 1000).toFixed(0)} s ====`);
fails.slice(0, 5).forEach((x) => console.log('   ' + x));
await b.close(); try { srv.kill(); } catch {}
console.log('  ✅ 已关掉自己 spawn 的 5181');
