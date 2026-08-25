/**
 * 势力旗号唯一性验收。
 *
 * 🔴 [2026-08-26 主人：「全面检查，旗号没有。」]
 *
 *    实际渲染的旗号口径（`CityAssetManager.getProcessedFlagText`）：
 *      SANDBOX_DISPLAY_NAMES 登记优先 → 未登记则用势力名 → **一律截前两字**。
 *    所以「没登记」不等于「没旗号」，但**截出来撞车**就等于两面旗分不清。
 *
 *    ⚠️ 解析这张表必须同时认 `xxx: '..'` 和 `'xxx': '..'` 两种 key 写法 ——
 *    我第一版正则只认不带引号的，954 条只读出 146 条，凭空误报了 8 组假重复。
 *
 * 跑法：npx tsx tools/audit-faction-flags.mts
 */
import { readFileSync } from 'node:fs';

let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

const FA = readFileSync('src/data/factions.ts', 'utf8');
const SD = readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
const CI = readFileSync('src/data/cities_v2.ts', 'utf8');

const names = new Map([...FA.matchAll(/id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)].map((m) => [m[1], m[2]]));
const bodyM = /export const SANDBOX_DISPLAY_NAMES[^{]*\{([\s\S]*?)\n\};/.exec(SD);
if (!bodyM) throw new Error('找不到 SANDBOX_DISPLAY_NAMES');
// 🔴 两种 key 写法都要认
const flags = new Map([...bodyM[1].matchAll(/^\s*'?([A-Za-z_]\w*)'?\s*:\s*'([^']+)'/gm)].map((m) => [m[1], m[2]]));
const used = [...new Set([...CI.matchAll(/factionId:\s*'([^']+)'/g)].map((m) => m[1]))].sort();

const flagOf = (f: string): string => [...(flags.get(f) ?? names.get(f) ?? f)].slice(0, 2).join('');

console.log(`势力表 ${names.size} 个 / 有城 ${used.length} 个 / 旗号登记 ${flags.size} 条\n`);
console.log('旗号唯一性（与渲染同口径：登记优先 → 势力名 → 截前两字）：');

const byFlag = new Map<string, string[]>();
for (const f of used) {
    if (f === 'panjun') continue;   // 叛军不显示旗号
    const g = flagOf(f);
    byFlag.set(g, [...(byFlag.get(g) ?? []), names.get(f) ?? f]);
}
const dup = [...byFlag].filter(([, v]) => v.length > 1);
if (dup.length) {
    for (const [g, v] of dup) bad(`「${g}」被 ${v.length} 个势力共用：${v.join('、')}`);
} else ok(`${byFlag.size} 个势力旗号全部唯一`);

// 旗号长度：AGENTS.md §4.4 旗面 1–2 汉字
const tooLong = [...flags].filter(([, g]) => [...g].length > 2);
if (tooLong.length) bad(`这些登记旗号超过 2 字：${tooLong.map(([f, g]) => `${names.get(f) ?? f}=${g}`).join(', ')}`);
else ok('登记旗号均为 1–2 字');

// 登记了却没有城的势力：不是错，但提示一下（可能是删城遗留）
const ghost = [...flags.keys()].filter((f) => !used.includes(f) && f !== 'panjun');
if (ghost.length) console.log(`  ⚪ ${ghost.length} 条登记的势力当前没有城（删城遗留，无害）`);

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
