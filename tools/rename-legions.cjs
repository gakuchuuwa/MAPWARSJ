/**
 * 二级军团批量改名：旧名 → 新名，全局同步所有引用并校验。
 * 🔴 [2026-10-19 主人令「按建议全部改名……写脚本全局同步所有引用并校验」「不要用古XXX军团」]
 *
 * 用法：node tools/rename-legions.cjs <改名表.json> [--write]
 *   不带 --write：只列出会改哪些文件、各改几处，并做改名表自检；
 *   带 --write：落盘；然后再扫一遍，旧名必须零残留。
 * 改名表：{ "旧全名": "新全名", ... }；新名必须以「军团」结尾、不以「古」开头（时代前缀之后）、
 *   不得与现有二级／三级／剧本军团重名，旧名必须是二级军团表里真实存在的名字。
 * 替换范围：src/、tools/、docs/、public/ 下的 ts/json/md 等文本文件；不碰 scratch/（历史备份与旧脚本）、node_modules、.git。
 * 两段式替换（旧名 → 占位符 → 新名），避免新名里含有别的旧名时被连环替换。
 */
const fs = require('fs');
const path = require('path');

const mapFile = process.argv[2];
const WRITE = process.argv.includes('--write');
if (!mapFile) { console.error('用法：node tools/rename-legions.cjs <改名表.json> [--write]'); process.exit(2); }
const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
const olds = Object.keys(map).sort((a, b) => b.length - a.length);

// ── 改名表自检 ──
const read = (f) => fs.readFileSync(f, 'utf8');
const l2src = read('src/data/level2Civ62Legions.ts');
const l2names = [...l2src.matchAll(/name: '([^']+)', civ: '([^']*)', age: '(\w+)'/g)].map((m) => m[1]);
const l2set = new Set(l2names);
const others = [];
for (const f of ['src/data/level3CustomLegions.ts', 'src/data/scriptLegions.ts']) for (const m of read(f).matchAll(/name: '([^']+)'/g)) others.push(m[1]);
const bad = [];
const news = Object.values(map);
for (const [o, n] of Object.entries(map)) {
    if (!l2set.has(o)) bad.push(`旧名不在二级军团表里：${o}`);
    if (!n.endsWith('军团')) bad.push(`新名不以「军团」结尾：${n}`);
    if (/^(古典|封建|城堡|帝国)时代古(?!吉拉特)/.test(n)) bad.push(`新名以「古」开头：${n}`);
    if (l2set.has(n) && !map[n]) bad.push(`新名与现有二级军团重名：${n}`);
    if (others.includes(n)) bad.push(`新名与三级／剧本军团重名：${n}`);
}
const dups = news.filter((x, i) => news.indexOf(x) !== i);
if (dups.length) bad.push(`新名之间重复：${[...new Set(dups)].join('、')}`);
if (bad.length) { console.error('改名表不合格：\n  ' + bad.join('\n  ')); process.exit(1); }

// ── 扫描并替换 ──
const SKIP_DIR = new Set(['node_modules', '.git', 'dist', 'scratch', '_scratch_trash_20261015', '.vite', 'coverage']);
const ROOTS = ['src', 'tools', 'docs', 'public'];
const EXT = /\.(ts|tsx|mts|mjs|cjs|js|json|md|html|py|csv|txt|yml|yaml)$/i;
const SELF = path.normalize('tools/rename-legions.cjs');
const changed = [];
function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (SKIP_DIR.has(e.name)) continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!EXT.test(e.name) || path.normalize(p) === SELF) continue;
        let st; try { st = fs.statSync(p); } catch { continue; }
        if (st.size > 30e6) continue;
        let raw; try { raw = fs.readFileSync(p, 'utf8'); } catch { continue; }
        const crlf = raw.includes('\r\n');
        let s = crlf ? raw.replace(/\r\n/g, '\n') : raw;
        let n = 0;
        olds.forEach((o, i) => { const c = s.split(o).length - 1; if (c) { n += c; s = s.split(o).join(`\u0000R${i}\u0000`); } });
        if (!n) continue;
        olds.forEach((o, i) => { s = s.split(`\u0000R${i}\u0000`).join(map[o]); });
        changed.push([p.split(path.sep).join('/'), n]);
        if (WRITE) fs.writeFileSync(p, crlf ? s.replace(/\n/g, '\r\n') : s);
    }
}
for (const r of ROOTS) if (fs.existsSync(r)) walk(r);
console.log(`改名表 ${olds.length} 条，自检通过；${WRITE ? '已改' : '将改'} ${changed.length} 个文件：`);
for (const [p, n] of changed) console.log(`  ${String(n).padStart(4)} 处  ${p}`);

// ── 校验：旧名零残留；新名都存在于二级表 ──
if (WRITE) {
    const left = [];
    const check = (d) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            if (SKIP_DIR.has(e.name)) continue;
            const p = path.join(d, e.name);
            if (e.isDirectory()) { check(p); continue; }
            if (!EXT.test(e.name) || path.normalize(p) === SELF) continue;
            let t; try { t = fs.readFileSync(p, 'utf8'); } catch { continue; }
            for (const o of olds) if (t.includes(o)) left.push(`${p}｜${o}`);
        }
    };
    for (const r of ROOTS) if (fs.existsSync(r)) check(r);
    const l2after = [...read('src/data/level2Civ62Legions.ts').matchAll(/name: '([^']+)', civ: '([^']*)', age: '(\w+)'/g)].map((m) => m[1]);
    const missing = news.filter((n) => !l2after.includes(n));
    const nonSuffix = l2after.filter((n) => !n.endsWith('军团'));
    const dupAfter = l2after.filter((x, i) => l2after.indexOf(x) !== i);
    console.log(left.length ? `❌ 旧名仍有残留 ${left.length} 处：\n  ${left.slice(0, 20).join('\n  ')}` : '✅ 旧名零残留');
    console.log(missing.length ? `❌ 新名没出现在二级表：${missing.join('、')}` : `✅ ${news.length} 个新名都在二级军团表里`);
    console.log(nonSuffix.length ? `❌ 仍有 ${nonSuffix.length} 支二级军团名不以「军团」结尾：${nonSuffix.join('、')}` : '✅ 257 支二级军团名全部以「军团」结尾');
    console.log(dupAfter.length ? `❌ 二级军团名重复：${[...new Set(dupAfter)].join('、')}` : '✅ 二级军团名无重复');
    if (left.length || missing.length || nonSuffix.length || dupAfter.length) process.exit(1);
}
