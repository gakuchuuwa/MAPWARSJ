// 删除势力工具（2026-10-23 主人「删除多余势力，适用于所有模式」）
// 用法：node tools/faction-edit.mjs remove <旧势力id> <改后方案.json> [--write]
//   方案.json：{
//     "cityTo": "tang",                      // 旧势力名下的据点改归谁（据点锚定势力）
//     "generals": { "<generalId>": "<势力id>" },   // 旧势力名单里没自带 factionId 的武将，逐个定他的真实政权
//     "refTo": "tang"                        // 其他表里写着旧势力的地方（首战敌方等）改指谁；不写＝同 cityTo
//   }
// 不加 --write 只打印会改什么（预演）。改的表：factions／据点／武将名单／军团编制／旗号字／颜色／首府／精锐／立绘池／文化名单。
import fs from 'node:fs';
import path from 'node:path';

const [, , cmd, from, planFile, ...flags] = process.argv;
const WRITE = flags.includes('--write');
if (cmd !== 'remove' || !from || !planFile) { console.log('用法：node tools/faction-edit.mjs remove <旧势力id> <方案.json> [--write]'); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const cityTo = plan.cityTo; const refTo = plan.refTo ?? plan.cityTo;
if (!cityTo) throw new Error('方案里要写 cityTo');
const ROOT = path.resolve(import.meta.dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const writes = new Map();
const report = [];
const put = (f, text, note) => { writes.set(f, text); report.push(`${f}：${note}`); };

const ID = `['"]?${from}['"]?`;
// ① 单行表项：整行删除
for (const f of ['src/data/factions.ts', 'src/assets/CityAssetManager.ts', 'src/data/SandboxDisplayNames.ts', 'src/data/StartingCapitals.ts',
  'src/config/portrait_defaults.ts', 'src/data/HistoricalFactionColors.ts', 'src/data/NorthExpeditionLegions.ts',
  'src/data/SteppeExpeditionLegions.ts', 'src/data/PersianExpeditionLegions.ts', 'src/data/ExpeditionLegions.ts']) {
  if (!fs.existsSync(path.join(ROOT, f))) continue;
  const lines = read(f).split('\n'); let n = 0;
  const re = f.endsWith('factions.ts') ? new RegExp(`^\\s*\\{\\s*id:\\s*'${from}'`) : new RegExp(`^\\s*${ID}\\s*:.*,\\s*(//.*)?\\r?$`);
  const kept = lines.filter((l) => { if (re.test(l)) { n++; return false; } return true; });
  if (n) put(f, kept.join('\n'), `删 ${n} 行`);
}
// ② 军团编制：整块删（花括号配平）
{
  const f = 'src/data/FactionCompositions.ts';
  let t = read(f); const m = new RegExp(`^[ \\t]*"${from}"\\s*:\\s*\\{`, 'm').exec(t);
  if (m) {
    let i = m.index + m[0].length, depth = 1;
    while (depth > 0 && i < t.length) { if (t[i] === '{') depth++; else if (t[i] === '}') depth--; i++; }
    while (t[i] === ',' || t[i] === ' ') i++;
    if (t[i] === '\r') i++; if (t[i] === '\n') i++;
    t = t.slice(0, m.index) + t.slice(i); put(f, t, '删军团编制块');
  }
}
// ③ 文化名单里的 'id', 记号
{
  const f = 'src/types/CultureFormations.ts'; const t = read(f);
  const re = new RegExp(`'${from}',[ \\t]*`, 'g'); const n = (t.match(re) ?? []).length;
  if (n) put(f, t.replace(re, ''), `去 ${n} 处名单记号`);
}
// ④ 据点：factionId 改归 cityTo
{
  const f = 'src/data/cities_v2.ts'; const t = read(f);
  const re = new RegExp(`factionId:\\s*'${from}'`, 'g'); const n = (t.match(re) ?? []).length;
  if (n) put(f, t.replace(re, `factionId: '${cityTo}'`), `${n} 个据点改归 ${cityTo}`);
}
// ⑤ 其他表里的引用（首战敌方、远征目标…）
for (const f of ['src/data/GeneralFirstBattles.ts', 'src/data/GeneralFirstExpeditionTargets.ts', 'src/data/GeneralCenturies.ts']) {
  if (!fs.existsSync(path.join(ROOT, f))) continue;
  const t = read(f); const re = new RegExp(`(Faction(?:Id)?:\\s*)'${from}'`, 'g'); const n = (t.match(re) ?? []).length;
  if (n) put(f, t.replace(re, `$1'${refTo}'`), `${n} 处引用改指 ${refTo}`);
}
// ⑥ 武将名单：旧势力那一块 → 逐个武将带上真实政权，并入 cityTo 那一块
{
  const f = 'src/data/FactionGenerals.ts'; let t = read(f);
  const m = new RegExp(`^    ${from}:\\s*\\[`, 'm').exec(t);
  if (m) {
    const start = m.index; let i = m.index + m[0].length, depth = 1;
    while (depth > 0 && i < t.length) { if (t[i] === '[') depth++; else if (t[i] === ']') depth--; i++; }
    const bodyStart = m.index + m[0].length; const body = t.slice(bodyStart, i - 1);
    let end = i; while (t[end] === ',' || t[end] === ' ') end++; if (t[end] === '\r') end++; if (t[end] === '\n') end++;
    const objs = body.split('\n').filter((l) => /generalId:/.test(l));
    const missing = [];
    const fixed = objs.map((l) => {
      const gid = /generalId:\s*'([^']+)'/.exec(l)[1];
      const own = /factionId:\s*'([^']+)'/.exec(l);
      if (own && own[1] !== from) return l;
      const want = plan.generals?.[gid];
      if (!want) { missing.push(gid); return l; }
      return own ? l.replace(/factionId:\s*'[^']+'/, `factionId: '${want}'`) : l.replace(/generalId:\s*'[^']+',?/, (x) => `${x.endsWith(',') ? x : x + ','} factionId: '${want}',`);
    });
    if (missing.length) { console.log(`❌ 这些武将没定政权，请补进方案 generals：${missing.join('、')}`); process.exit(2); }
    t = t.slice(0, start) + t.slice(end);
    const dest = new RegExp(`^    ${cityTo}:\\s*\\[`, 'm').exec(t);
    if (!dest) { console.log(`❌ ${cityTo} 在武将名单里不是数组写法，请手动并入`); process.exit(3); }
    let j = dest.index + dest[0].length, d2 = 1;
    while (d2 > 0 && j < t.length) { if (t[j] === '[') d2++; else if (t[j] === ']') d2--; j++; }
    const insertAt = j - 1;
    t = t.slice(0, insertAt) + '\n' + fixed.join('\n') + '\n    ' + t.slice(insertAt);
    put(f, t, `${objs.length} 位武将并入 ${cityTo}，各带真实政权`);
  }
}
for (const r of report) console.log(r);
if (!report.length) console.log('没找到这个势力');
if (WRITE) { for (const [f, t] of writes) fs.writeFileSync(path.join(ROOT, f), t); console.log(`✅ 已写入 ${writes.size} 个文件`); }
else console.log('（预演，没写盘；确认后加 --write）');
