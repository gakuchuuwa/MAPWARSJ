/**
 * 剧本审核程序 · 按段版（2026-09-25 主人「给我重新审核前四片去」）
 *
 * 两关（播报那关先关掉，主人说以后再说）：
 *   ① 线：编辑器同一套 `checkRoute` 逐段实测（沿路公里 / 倍数 / 末段离路 / 红项）
 *   ② 方向：**按站判** —— 相邻两站之间取走线，看有没有「往回走了 40 公里以上再折回」；
 *      不再拿整趟经度倒折当依据（上一次就是这么误报的：第 5 场先东进萨蒂斯、再折回海岸的以弗所—米利都，
 *      那是史料路线本身，不是错）。
 *
 * 用法：node tools/script-audit.mjs 12        # 只审前 12 场（前四片）
 *       node tools/script-audit.mjs 1 2 3     # 只审指定场次
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';

const want = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n));
// 🔴 [2026-09-25 主人问「你的审查程序怎么写的」] 场次上限原来**写死 12**（`}, 12)`）——
//    于是第 13 场起根本没进过审核。现按参数走：给了场次就审到那一场，不给就全审。
const LIMIT = want.length ? Math.max(...want) : 999;

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true, defaultViewport: { width: 1200, height: 800 },
    protocolTimeout: 900000, args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
});
const page = await browser.newPage();
await page.goto('http://localhost:5173/battlefield-editor.html', { waitUntil: 'domcontentloaded', timeout: 180000 });
await new Promise((r) => setTimeout(r, 9000));

const data = await page.evaluate(async (limit) => {
    const urls = performance.getEntriesByType('resource').map((e) => e.name);
    const pick = (kw) => urls.filter((u) => u.includes(kw) && u.includes('/src/'))[0];
    const { checkRoute } = await import(pick('routeCheck') ?? '/src/battlefield-editor/routeCheck.ts');
    const { findPathFromPoint } = await import(pick('scriptMarchPath') ?? '/src/events/scriptMarchPath.ts');
    const { HISTORICAL_EVENT_SCRIPT } = await import(pick('HistoricalEventScript') ?? '/src/data/HistoricalEventScript.ts');
    const { CITIES_V2 } = await import(pick('cities_v2') ?? '/src/data/cities_v2.ts');
    const seg = await import('/src/battlefield-editor/scriptSegments.ts');
    const byId = new Map(CITIES_V2.map((c) => [c.id, c]));
    const km = (a, b) => Math.hypot((b.lng - a.lng) * 87.5, (b.lat - a.lat) * 111);

    const all = [...HISTORICAL_EVENT_SCRIPT].sort((a, b) => a.year - b.year || (a.season ?? 0) - (b.season ?? 0)).slice(0, limit);
    const out = [];
    for (const ev of all) {
        const d = ev.siegeData ?? ev.fieldBattleData;
        const city = d?.defenderCityId ? byId.get(d.defenderCityId) : null;
        const loc = d?.location ?? (city ? { lat: city.lat, lng: city.lng } : null);
        const draft = {
            type: ev.type, generalId: ev.generalId, lat: loc?.lat ?? 0, lng: loc?.lng ?? 0,
            marchWaypoints: d?.marchWaypoints ?? [],
            defenderCityId: ev.type === 'siege' ? (d?.defenderCityId ?? '') : '',
            bfTargetBattlefieldId: d?.targetBattlefieldId ?? '',
            attackerGeneralId: d?.attackerGeneralId ?? '', defenderGeneralId: d?.defenderGeneralId ?? '',
            attackerSourceCityId: d?.attackerSourceCityId ?? '', defenderSourceCityId: d?.defenderSourceCityId ?? '',
            cityUpdates: (ev.cityUpdates ?? []).map((u) => ({ cityId: u.cityId })),
            bfEventCityId: '', absentCities: ev.absentCities ?? [], startCityId: ev.startCityId ?? '',
            year: ev.year, season: ev.season ?? 0,
        };
        let rep = null;
        try { rep = checkRoute(draft); } catch (e) { rep = { error: String(e), legs: [], issues: [] }; }
        const legs = rep.legs ?? [];
        const roadKm = legs.reduce((s, l) => s + (l.roadKm || 0), 0);
        const reds = (rep.issues ?? []).filter((i) => i.level === 'error').length;

        // 方向：按站判 —— 相邻两站之间，有没有往回走超过 40 公里
        const pts = [];
        const src = d?.attackerSourceCityId ? byId.get(d.attackerSourceCityId) : null;
        const stops = [];
        if (src) stops.push({ name: src.name, lat: src.lat, lng: src.lng });
        for (const w of (d?.marchWaypoints ?? [])) { const c = byId.get(w); if (c) stops.push({ name: c.name, lat: c.lat, lng: c.lng }); }
        if (loc) stops.push({ name: '终点', lat: loc.lat, lng: loc.lng });
        // 方向尺子（修正版）：沿线逐点算「到这一腿终点的距离」，正常应一路变短；
        // 只有「先变短 → 又变长 40 公里以上 → 再变短」才算真折返。
        // detour = max over i<j ( d_j - d_i )：离终点最近过之后又退回去多少。
        const bad = [];
        for (let i = 1; i < stops.length; i++) {
            const a = stops[i - 1], b = stops[i];
            const p = findPathFromPoint({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
            if (!p || p.length < 3) continue;
            let minSoFar = Infinity, detour = 0;
            for (const q of p) {
                const dToB = km(q, b);
                if (dToB < minSoFar - 0.001) minSoFar = dToB;      // 又近了 → 更新最近记录
                else detour = Math.max(detour, dToB - minSoFar);    // 退回去了 → 记折返量
            }
            if (detour > 40) bad.push(`${a.name}→${b.name} 折返 ${Math.round(detour)} 公里`);
            pts.push(...p);
        }
        out.push({
            idx: all.indexOf(ev) + 1, title: String(ev.title).replace(/^公元前\d+年\s*/, ''),
            roadKm: Math.round(roadKm), reds, legs: legs.length, bad, stops: stops.length,
            // 逐腿明细（审核报告用）：起→止 / 直线 / 沿路 / 倍数 / 末段离路
            legList: legs.map((l) => ({
                from: l.from, to: l.to, straightKm: Math.round(l.straightKm || 0),
                roadKm: Math.round(l.roadKm || 0), ratio: +(l.ratio || 0).toFixed(2),
                offroadKm: Math.round(l.offroadKm || 0),
            })),
        });
    }
    return { rows: out, segs: seg.SCRIPT_SEGMENTS.map((s) => ({ id: s.id, part: s.part, from: s.from, to: s.to, events: s.events, hasBattle: s.hasBattle, briefedBy: s.briefedBy })) };
}, LIMIT);

// ── 先用已知答案的腿校验尺子（尺子不对，后面所有结果都不许信）──
const ruler = await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map((e) => e.name);
    const pick = (kw) => urls.filter((u) => u.includes(kw) && u.includes('/src/'))[0];
    const { findPathFromPoint } = await import(pick('scriptMarchPath') ?? '/src/events/scriptMarchPath.ts');
    const { CITIES_V2 } = await import(pick('cities_v2') ?? '/src/data/cities_v2.ts');
    const byId = new Map(CITIES_V2.map((c) => [c.id, c]));
    const km = (a, b) => Math.hypot((b.lng - a.lng) * 87.5, (b.lat - a.lat) * 111);
    const test = (aId, bId) => {
        const a = byId.get(aId), b = byId.get(bId);
        if (!a || !b) return { name: `${aId}→${bId}`, detour: -1, note: '缺城' };
        const p = findPathFromPoint({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
        if (!p || p.length < 3) return { name: `${a.name}→${b.name}`, detour: -1, note: '无路' };
        let minSoFar = Infinity, detour = 0;
        for (const q of p) {
            const d = km(q, b);
            if (d < minSoFar - 0.001) minSoFar = d;
            else detour = Math.max(detour, d - minSoFar);
        }
        return { name: `${a.name}→${b.name}`, detour: Math.round(detour), note: '' };
    };
    // 🔴 [2026-09-25] 原反例「波斯波利斯→伊斯法罕」的折返已从 >40 掉到 10 公里 —— 那条路被主人修直了，
    //    反例失效。改为在若干「实测绕远」的腿里取折返最大的一条当反例（找不到 >40 的就说明尺子抓不到折返）。
    const cands = [
        ['city_halikanasu', 'city_geerdiweng'],   // 哈利卡纳苏斯→戈尔迪乌姆（实测 854 公里）
        ['city_fala', 'city_bam_citadel'],        // 法拉→巴姆古城（实测 695 公里）
        ['city_kandaha', 'city_fala'],            // 坎大哈→法拉（实测 398 公里）
        ['city_bosibolisi', 'city_yisifahan'],    // 旧反例（已被主人修直，留作对照）
    ].map(([a, b]) => test(a, b));
    const worst = cands.slice().sort((x, y) => (y.detour ?? -1) - (x.detour ?? -1))[0];
    // 🔴 [2026-09-26] 上面这批**真实数据反例**如今全部 ≤40 公里（路都被主人修直了），
    //    于是旧的 rulerOk（要求反例 >40）永远为 false、报告里那条自校等于天天误报「结果作废」。
    //    改为**合成折线**做硬自校（跑的是同一段算法，不碰路网）：一路靠近应 0，退回 50 公里再靠近应 >40。
    //    真实反例仍逐条打印出来供参考，但它只作参考、不再决定合格与否。
    const detourOf = (pts, target) => {
        let min = Infinity, det = 0;
        for (const q of pts) { const d = km(q, target); if (d < min - 0.001) min = d; else det = Math.max(det, d - min); }
        return Math.round(det);
    };
    const B = { lat: 0, lng: 0 };
    const synth = {
        good: detourOf([{ lat: 1, lng: 0 }, { lat: 0.6, lng: 0 }, { lat: 0.2, lng: 0 }, { lat: 0.05, lng: 0 }], B),
        bad: detourOf([{ lat: 1, lng: 0 }, { lat: 0.6, lng: 0 }, { lat: 0.2, lng: 0 }, { lat: 0.7, lng: 0 }, { lat: 0.1, lng: 0 }], B),
    };
    return {
        good: test('city_salonica', 'city_anfeibolisi'),   // 正例：一路向东，应 0
        bad: worst,                                        // 真实数据里的最大折返（只作参考）
        cands,
        synth,
    };
});
console.log('=== 先校验尺子 ===');
console.log(`  正例（一路向东）${ruler.good.name}：折返 ${ruler.good.detour} 公里 → ${ruler.good.detour === 0 ? '✅ 对' : '❌ 尺子错'}`);
console.log(`  合成反例（人为折返 50 公里）：${ruler.synth.bad} 公里 → ${ruler.synth.bad > 40 ? '✅ 抓到了' : '❌ 尺子漏'}`);
console.log(`  （参考）真实数据里折返最大的一条　${ruler.bad.name}：${ruler.bad.detour} 公里 —— 路已修直，只作参考`);
const rulerOk = ruler.good.detour === 0 && ruler.synth.bad > 40;
console.log(rulerOk ? '  → 尺子合格，下面的方向结果可用\n' : '  → 尺子不合格，方向结果一律作废\n');


console.log('段号   场次      有仗   起 → 止');
for (const s of data.segs) {
    if (s.part > 4) continue;
    const rows = data.rows.filter((r) => s.events.includes(r.idx));
    const kmSum = rows.reduce((a, r) => a + r.roadKm, 0);
    const reds = rows.reduce((a, r) => a + r.reds, 0);
    const bad = rows.flatMap((r) => r.bad);
    console.log(`${s.id.padEnd(5)} ${s.events.join('、').padEnd(8)} ${(s.hasBattle ? '有' : '纯行军').padEnd(5)} ${s.from} → ${s.to}`);
    console.log(`      里程 ${kmSum} km　红 ${reds}　方向疑点 ${bad.length ? '✗ ' + bad.join('；') : '0'}`);
}
console.log('\n=== 场表（逐场）===');
console.log('场次  路线   红 站数  方向疑点');
for (const r of data.rows) {
    console.log(`${String(r.idx).padStart(3)}  ${String(r.roadKm).padStart(5)}km  ${String(r.reds).padStart(2)} ${String(r.stops).padStart(4)}  ${r.bad.length ? '✗ ' + r.bad.join('；') : '0'}`);
}
console.log('\n=== 对账行（防「工具坏了却不知道」）===');
{
    const totalScenes = data.rows.length;
    const totalLegs = data.rows.reduce((a, r) => a + r.legList.length, 0);
    console.log(`  审了 ${totalScenes} 场 / ${totalLegs} 条腿；红项 ${data.rows.reduce((a, r) => a + r.reds, 0)}；方向疑点 ${data.rows.reduce((a, r) => a + r.bad.length, 0)}`);
    if (totalScenes < 20) console.log(`  🔴 只审到 ${totalScenes} 场 —— 剧本共 20 场，**没审全**，这次结论不许用（旧版就是写死 12 场瞒了很久）`);
    if (!rulerOk) console.log('  🔴 尺子没过校验 —— 本次结果作废');
    writeFileSync('scratch/route_audit_report.json', JSON.stringify({ at: new Date().toISOString(), rulerOk, scenes: data.rows, segments: data.segs }, null, 2));
    console.log('  逐腿明细已落盘 → scratch/route_audit_report.json');
}

const badAll = data.rows.reduce((a, r) => a + r.reds + r.bad.length, 0);
console.log(badAll ? `\n❌ 前四片共 ${badAll} 处要处理` : '\n✅ 前四片的线、方向两关全过');
await browser.close();
process.exit(badAll ? 1 : 0);
