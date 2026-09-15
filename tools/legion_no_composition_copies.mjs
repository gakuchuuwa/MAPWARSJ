/**
 * 闸门：军团编制**不许有第二份权威**。  npm run legion:no-composition-copies
 *
 * 🔴 [2026-09-15 主人「不要给我修复，你要治根治本」] 「城堡时代女真军团有两个」的根因：
 *    同一个军团名有两处存编制 —— 军团自己那条记录（一级16/二级59/三级）是权威，
 *    而 FactionCompositions.ts 的势力条目里**又存了一份副本**。两份一旦不同步，
 *    表格里同名军团就裂成两种编制，界面弹「军团编制冲突」。
 *
 * 本闸门查两件事，任一命中即红：
 *   ① 势力表条目里出现 slots / formationMode —— 落盘的副本；
 *   ② 编辑器源码里出现「读势力条目的 slots 当编制」的取数路 —— 内存里的副本。
 * 势力表只许存指针：legionName / legionType / navalFormation。
 */
import fs from 'fs';
const P = 'src/data/FactionCompositions.ts';
const text = fs.readFileSync(P, 'utf-8');
const start = text.indexOf('{', text.indexOf('FACTION_COMPOSITIONS'));
const body = text.slice(start);
const re = /"([a-zA-Z_0-9]+)"\s*:\s*\{/g;
let m, entries = [];
while ((m = re.exec(body))) {
  const open = body.indexOf('{', m.index + m[0].length - 1);
  let d = 0, end = -1;
  for (let i = open; i < body.length; i++) {
    if (body[i] === '{') d++;
    else if (body[i] === '}') { d--; if (d === 0) { end = i; break; } }
  }
  if (end < 0) break;
  entries.push({ id: m[1], src: body.slice(open, end + 1) });
  re.lastIndex = end;
}
const withSlots = entries.filter(e => /\bslots\s*:/.test(e.src));
const withMode  = entries.filter(e => /\bformationMode\s*:/.test(e.src));
const ptrOnly   = entries.filter(e => !/\bslots\s*:/.test(e.src) && !/\bformationMode\s*:/.test(e.src));
console.log(`势力条目总数 ${entries.length}`);
console.log(`  只存指针（合规） ${ptrOnly.length}`);
console.log(`  存了 slots 副本  ${withSlots.length}`);
console.log(`  存了 formationMode 副本 ${withMode.length}`);
if (withSlots.length) console.log('  副本势力：' + withSlots.map(e => e.id).join(', '));
const bad = new Set([...withSlots, ...withMode].map(e => e.id));
console.log(bad.size ? `  \u2717 ${bad.size} 个势力在势力表里存了军团编制副本 —— 第二份权威，必漂移`
                     : '  \u2705 势力表只存指针，没有编制副本');

// ② 编辑器源码：不许再出现「拿势力条目的 slots 当编制」的取数路
const ED = 'src/legion-editor/main.ts';
// 去掉注释再匹配：注释里引用这些写法是在解释为什么删掉它，不该算违规
const ed = fs.readFileSync(ED, 'utf-8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split(String.fromCharCode(10))
  .filter((l) => !l.trim().startsWith('//'))
  .join(String.fromCharCode(10));
const banned = [
  { re: /custom\?\.slots\s*\n?\s*\?\?/, why: 'buildRows 拿势力快照的 slots 当编制，应按军团名实时解析' },
  { re: /entry\.slots\s*=\s*custom\.slots/, why: '冲突检测里让势力表副本压过军团记录' },
];
const hits = [];
for (const b of banned) {
  const m = b.re.exec(ed);
  if (m) hits.push(b.why + '　\u2192 命中 "' + m[0].replace(/\s+/g, ' ') + '"');
}
console.log('\n编辑器取数路检查');
console.log(hits.length ? hits.map(h => '  \u2717 ' + h).join('\n')
                        : '  \u2705 编制一律按军团名实时解析，没有第二条取数路');

const fail = bad.size + hits.length;
console.log(fail ? `\n\u2717 ${fail} 处违反「一个军团名一种编制」的单一权威`
                 : '\n\u2705 单一权威成立：编制只存在军团自己那条记录里');
process.exit(fail ? 1 : 0);
