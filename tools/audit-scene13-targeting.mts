/**
 * 13 士兵索敌（寻敌）行为的结构性验收。
 *
 * 🔴 [2026-08-25 起因：主人问「战术模式下士兵的寻敌模式需要优化吗」]
 *
 *    查出来一处真缺陷：keep（保持当前目标）里带着 `m.foe.claims < SPREAD_CAP`，
 *    与 search 的 `free ?? best` 兜底**自相矛盾** ——
 *      keep：「你的目标已被 4 人锁定，放手」
 *      search：「找不到空闲目标？那还打最近的这个」（就是刚放手那个）
 *    → 挤掉 → 重找 → 再挤掉。而被挤掉那一帧若 m.next 还没归零，走的是
 *      `else if (!keep) m.foe = null`，目标直接清空、**最多原地发呆 0.2 秒**。
 *
 *    实测（scratch/war_sim.mjs，500 对镜，SEED 7/11/23 三种子方向一致，
 *          口径已对齐游戏层：SPREAD=4 + 本帧实时 claims）：
 *      带闸 → 真·索敌失败 8.4~12.2%   打/走切换 0.83~1.24 次/人·秒
 *      去闸 → 3.1~3.2%              0.24~0.25 次/人·秒
 *      换目标次数几乎不变（0.26→0.24）——代价全在「丢目标后的空窗」，不在「换目标」。
 *
 *    SPREAD_CAP 只该在**分配新目标**时分流，不该驱赶已在交战的人（DE 同理：
 *    单位锁定目标后打到目标死）。
 *
 * 跑法：npx tsx tools/audit-scene13-targeting.mts
 */
import { readFileSync } from 'node:fs';

const SRC = readFileSync('src/ui/Scene13WarLayer.ts', 'utf8');
const SIM = readFileSync('scratch/war_sim.mjs', 'utf8');
let fail = 0;

const ok = (msg: string) => console.log(`  ✅ ${msg}`);
const bad = (msg: string) => { console.log(`  🔴 ${msg}`); fail++; };

console.log('索敌结构：');

// ① keep 里不得再有 claims 闸
const keepBlock = /const keep = m\.foe &&[\s\S]{0,400}?SIGHT \* SIGHT \* 1\.44;/.exec(SRC)?.[0] ?? '';
if (!keepBlock) bad('找不到 keep 的定义（结构变了，先看代码再改这个脚本）');
else if (/claims\s*<\s*SPREAD_CAP/.test(keepBlock)) {
    bad('keep 里又出现了 `claims < SPREAD_CAP` —— 会把交战中的兵挤掉、原地发呆 0.2 秒');
} else ok('keep 不带 claims 闸（交战中的兵不会被挤掉）');

// ② search 的兜底必须在：没有空闲目标时照旧返回最近的，绝不让人没目标
if (!/const chosen = free \?\? best;/.test(SRC)) {
    bad('search 丢了 `free ?? best` 兜底 —— 没有空闲目标时会返回 null，兵原地发呆');
} else ok('search 保留 `free ?? best` 兜底（视野内有敌人就一定有目标）');

// ③ SPREAD_CAP 仍在「分配新目标」时分流（去掉的是 keep，不是分流本身）
if (!/if \(o\.claims >= SPREAD_CAP\) continue;/.test(SRC)) {
    bad('search 里没有 `o.claims >= SPREAD_CAP` 分流 —— 第 5 个人白挤（围殴加成 4 人封顶）');
} else ok('search 仍按 SPREAD_CAP 分流新目标（第 5 个人去找次近的）');

// ④ 环形最近邻不得退化（2026-08-17「攻方白拿 10~15% 战力」的老毛病）
if (!/只走本环/.test(SRC) || !/环形/.test(SRC)) {
    bad('search 的环形最近邻结构不见了 —— 逮到就返回/截断都会重新引入方向偏袒');
} else ok('search 仍是环形最近邻（对双方对称，无扫描方向偏袒）');

console.log('\nwar_sim 口径（错了就会假报）：');
// ⑤ war_sim 默认值必须对齐游戏层，否则跑出来的不是游戏里的行为
const spread = /const SPREAD = \+\(process\.env\.SPREAD \?\? (\d+)\)/.exec(SIM)?.[1];
if (spread !== '4') bad(`war_sim SPREAD 默认 ${spread ?? '?'}，游戏层 SPREAD_CAP = GANG_CAP+1 = 4`);
else ok('war_sim SPREAD 默认 4（= 游戏层 SPREAD_CAP）');

const live = /const CLAIMS_LIVE = !!\+\(process\.env\.CLAIMS_LIVE \?\? (\d+)\)/.exec(SIM)?.[1];
if (live !== '1') bad(`war_sim CLAIMS_LIVE 默认 ${live ?? '?'} —— 上一帧结转会把挤压夸大（47.8% vs 实测 9.1%）`);
else ok('war_sim claims 默认本帧实时累计（= 游戏层口径）');

const kc = /const KEEP_CLAIMS = !!\+\(process\.env\.KEEP_CLAIMS \?\? (\d+)\)/.exec(SIM)?.[1];
if (kc !== '0') bad(`war_sim KEEP_CLAIMS 默认 ${kc ?? '?'} —— 游戏层已去掉这道闸，默认应为 0`);
else ok('war_sim KEEP_CLAIMS 默认 0（= 游戏层已去闸）');

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
