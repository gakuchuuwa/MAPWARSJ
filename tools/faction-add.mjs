// 新建势力工具（2026-10-23）：把一个 new-factions.json 里的势力逐项补进 9 张表
// 用法：node tools/faction-add.mjs <new-factions.json> [--write]
//   spec: [{ key, name, flag, capitalCityId, legionName, color, eliteName?, eliteTier?, portraitPool?, expeditionFile? }]
import fs from 'node:fs';
import path from 'node:path';

const [, , specFile, ...flags] = process.argv;
const WRITE = flags.includes('--write');
if (!specFile) { console.log('用法：node tools/faction-add.mjs <new-factions.json> [--write]'); process.exit(1); }
const ROOT = path.resolve(import.meta.dirname, '..');
const spec = JSON.parse(fs.readFileSync(path.resolve(ROOT, specFile), 'utf8'));
const files = new Map();
const read = (f) => { if (!files.has(f)) files.set(f, fs.readFileSync(path.join(ROOT, f), 'utf8')); return files.get(f); };
const put = (f, t) => files.set(f, t);
const notes = [];
let errors = 0;

/** 在 startMarker 之后、第一个 closeMarker 之前插入行 */
function insertBefore(f, startMarker, closeMarker, rows, note) {
    if (!rows.length) return;
    const t = read(f);
    const i = t.indexOf(startMarker);
    if (i < 0) { notes.push(`❌ ${f} 找不到起点 ${startMarker}`); errors++; return; }
    const j = t.indexOf(closeMarker, i + startMarker.length);
    if (j < 0) { notes.push(`❌ ${f} 找不到终点 ${closeMarker}`); errors++; return; }
    put(f, t.slice(0, j) + '\n' + rows.join('\n') + t.slice(j));
    notes.push(`${f}：+${rows.length} 行`);
}

const q = (s) => `'${String(s).replace(/'/g, "\\'")}'`;
const facRows = [], camRows = [], sbRows = [], capRows = [], colorRows = [], poolRows = [], compRows = [];
const genRows = [];
const expByFile = new Map();

for (const n of spec) {
    if (!n.key || !n.name || !n.flag || !n.capitalCityId) { notes.push(`❌ 条目缺字段：${JSON.stringify(n)}`); errors++; continue; }
    facRows.push(`  { id: ${q(n.key)}, name: ${q(n.name)} },`);
    camRows.push(`${q(n.key)}: ${q(n.flag)},`);
    sbRows.push(`${q(n.key)}: ${q(n.flag)},`);
    capRows.push(`${q(n.key)}: ${q(n.capitalCityId)},`);
    if (n.color) colorRows.push(`    ${n.key}: ${q(n.color)}, // ${n.name}`);
    if (n.portraitPool) poolRows.push(`    ${q(n.key)}: ${n.portraitPool},`);
    if (n.legionName) compRows.push(`    "${n.key}": {\n        legionName: "${n.legionName}",\n        legionType: "sub",\n    },`);
    else { notes.push(`⚠ ${n.key} 没有 legionName，未写军团编制`); }
    genRows.push(`    ${n.key}: [],`);
    if (n.eliteName) {
        const ef = `src/data/${n.expeditionFile || 'CentralExpeditionLegions.ts'}`;
        const arr = expByFile.get(ef) ?? [];
        arr.push(`    ${n.key}: { name: ${q(n.eliteName)}, tier: ${Number(n.eliteTier ?? 4)} },`);
        expByFile.set(ef, arr);
    }
}

insertBefore('src/data/factions.ts', 'export const FACTIONS', '\n];', facRows, 'factions');
insertBefore('src/assets/CityAssetManager.ts', 'factionFlagMap', '\n};', camRows, 'CityAssetManager 旗号');
insertBefore('src/data/SandboxDisplayNames.ts', 'export const SANDBOX_DISPLAY_NAMES', '\n};', sbRows, 'SandboxDisplayNames');
insertBefore('src/data/StartingCapitals.ts', 'export const STARTING_CAPITALS', '\n};', capRows, 'StartingCapitals');
insertBefore('src/data/HistoricalFactionColors.ts', 'const _FIXED', '\n};', colorRows, '颜色');
insertBefore('src/config/portrait_defaults.ts', 'const FACTION_PORTRAIT_POOLS', '\n};', poolRows, '立绘池');
insertBefore('src/data/FactionCompositions.ts', 'export const FACTION_COMPOSITIONS', '\n};', compRows, '军团编制');
insertBefore('src/data/FactionGenerals.ts', 'export const FACTION_GENERALS', '\n};', genRows, 'FactionGenerals 空块');
for (const [ef, rows] of expByFile) insertBefore(ef, 'ELITE_LEGIONS', '\n};', rows, `精锐 ${path.basename(ef)}`);

for (const n of notes) console.log(n);
if (errors) { console.log(`❌ ${errors} 个错误，未写盘`); process.exit(2); }
console.log(`共 ${spec.length} 个势力`);
if (WRITE) {
    for (const [f, t] of files) fs.writeFileSync(path.join(ROOT, f), t);
    console.log(`✅ 已写入 ${files.size} 个文件`);
} else console.log('（预演，没写盘；确认后加 --write）');

