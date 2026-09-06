/**
 * 兵种时代归档铁律的验收脚本。   跑：npm run age:audit
 *
 * 铁律出处 = src/legion-editor/main.ts 里 AGE_YEARS 上方那段注释（2026-09-06 确立），
 * 核心准则「符合历史，游戏合理」。本脚本只读不改，退出码非 0 表示有违规。
 *
 *  铁律1 绝对断代：古典 –400 / 封建 400–1050 / 城堡 1050–1500 / 帝王 1500–1900
 *  铁律2 进阶跨度：基础形态与其精锐/高级/重装形态，必须同代或只差一代，不许跨两代
 *  铁律3 生态合理：封建是轻装交锋生态 —— 不许火器早产、不许重型攻城前置；
 *                  远洋帆船（盖伦/克拉克）属大航海，归帝王。
 *                  ⚠️ 火器本身不等于帝王：中国火箭车（宋–明）、葡萄牙风琴炮（15 世纪）
 *                     都在 1500 年以前，DE 里也都是城堡档，属于合规。
 */
import fs from 'fs';

const P = 'src/legion-editor/main.ts';
const src = fs.readFileSync(P, 'utf8');
const rows = [];
for (const L of src.split(/\r?\n/)) {
    const m = L.match(/\{ id: '([^']+)', name: '([^']+)', category: '(\w+)', age: '(\w+)'/);
    if (m) rows.push({ id: m[1], name: m[2], cat: m[3], age: m[4] });
}
if (rows.length === 0) { console.error('✗ 没解析到目录条目，检查 DE_UNITS_CATALOG 格式'); process.exit(2); }

const ORDER = ['antiquity', 'feudal', 'castle', 'imperial'];
const byName = new Map(rows.map(r => [r.name, r]));
let bad = 0;

console.log(`目录 ${rows.length} 条 | ` + ORDER.map(a => `${a}:${rows.filter(r => r.age === a).length}`).join('  '));

// 铁律1：不许有档外值
const outside = rows.filter(r => !ORDER.includes(r.age));
if (outside.length) { console.log('\n✗ 铁律1 档外值：'); outside.forEach(r => console.log('   ', r.id, r.age)); bad += outside.length; }

// 铁律2：基础 ↔ 进阶跨度
const v2 = [];
for (const r of rows) {
    const m = r.name.match(/^(.*?)(精锐|高级|重装)$/);
    if (!m) continue;
    const base = byName.get(m[1]);
    if (!base) continue;
    const d = ORDER.indexOf(r.age) - ORDER.indexOf(base.age);
    if (d < 0 || d > 1) v2.push(`${base.name}(${base.age}) → ${r.name}(${r.age}) 跨度${d}`);
}
if (v2.length) { console.log('\n✗ 铁律2 进阶跨度违规：'); v2.forEach(x => console.log('   ', x)); bad += v2.length; }

// 铁律3：生态合理
const GUN = /火炮|火枪|手炮|铳|榴弹|火门|臼炮|加农|掷弹/;
const HEAVY_SIEGE = /投石车|投石机|抛石|攻城槌|冲车|巨炮|攻城塔/;
const OCEAN = /盖伦|克拉克/;
const v3 = [];
for (const r of rows) {
    if (r.age === 'feudal' && GUN.test(r.name)) v3.push(`${r.name} 火器早产于封建`);
    if (r.age === 'feudal' && HEAVY_SIEGE.test(r.name)) v3.push(`${r.name} 重型攻城前置于封建`);
    if (OCEAN.test(r.name) && r.age !== 'imperial') v3.push(`${r.name} 远洋帆船应归帝王（现 ${r.age}）`);
}
if (v3.length) { console.log('\n✗ 铁律3 生态违规：'); v3.forEach(x => console.log('   ', x)); bad += v3.length; }

console.log(bad === 0 ? '\n✅ 三条铁律全部通过' : `\n共 ${bad} 条违规`);
process.exit(bad === 0 ? 0 : 1);
