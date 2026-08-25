/**
 * 攻城武器配兵验收。
 *
 * 🔴 [2026-08-24 主人两次指出：「西域的攻城战中竟然出现了大象？」
 *     「大象作为攻城武器在西域登场。是不对的。」]
 *
 *    根因是两处都开着战象：
 *      ① `SIEGE_ELEPHANT_BY_CULTURE` 挂了 `WESTERN: 'war_elephant'`，注释写「波斯战象」
 *         —— **挂错区了**。实测 WESTERN 的 43 座城全是塔里木盆地 + 河中的绿洲城邦
 *         （高昌、于阗、精绝、怛罗斯、浩罕、柘折城…），太干旱、无象源，兵力主体是骑射。
 *         波斯（波斯波利斯、苏萨、伊斯法罕）在 `CENTRAL_ASIA` 区，根本不在这儿。
 *      ② 科技树门控表 `SIEGE_TECH_BY_CULTURE` 里 WESTERN 也开着 `war_elephant: true`。
 *
 *    也没有把战象补给 CENTRAL_ASIA：那区 52 座城里波斯本土只有几座，
 *    主体是中亚（木鹿、布哈拉、撒马尔罕——粟特人不用象）。
 *    判据是「这地方**什么最多**」，不是「有没有用过」。
 *
 * 跑法：npx tsx tools/audit-siege-weapons.mts
 */
import { readFileSync } from 'node:fs';

const SRC = readFileSync('src/ui/Scene13WarLayer.ts', 'utf8');

/** 真正大量使用战象的文化区（史实）：南亚 + 东南亚 */
const ELEPHANT_OK = new Set(['INDIA', 'DIANQIAN', 'LINGNAN', 'MALAY']);

function block(name: string): string {
  const i = SRC.indexOf('const ' + name);
  if (i < 0) throw new Error('找不到 ' + name);
  const j = SRC.indexOf('};', i);
  return SRC.slice(i, j);
}

function main(): void {
  let fail = 0;

  // ① 战象替代表
  const ele = block('SIEGE_ELEPHANT_BY_CULTURE');
  const eleRegions = [...ele.matchAll(/^\s*([A-Z_]+):\s*'/gm)].map((m) => m[1]);
  console.log('战象替代表的文化区：' + (eleRegions.join(' ') || '（空）'));
  for (const r of eleRegions) {
    if (!ELEPHANT_OK.has(r)) { console.log(`  🔴 ${r} 不该有战象`); fail++; }
    else console.log(`  ✅ ${r}`);
  }

  // ② 科技树门控表
  const tech = block('SIEGE_TECH_BY_CULTURE');
  console.log('\n科技树门控表里开了象的文化区：');
  const rows = [...tech.matchAll(/^\s*([A-Z_]+):\s*\{([^}]*)\}/gm)];
  let any = false;
  for (const [, region, body] of rows) {
    if (!/elephant/.test(body)) continue;
    any = true;
    const kinds = [...body.matchAll(/(\w*elephant\w*):\s*true/g)].map((m) => m[1]);
    if (!ELEPHANT_OK.has(region)) { console.log(`  🔴 ${region}: ${kinds.join(',')} —— 不该有`); fail++; }
    else console.log(`  ✅ ${region}: ${kinds.join(',')}`);
  }
  if (!any) console.log('  （无）');

  // ③ 音效接线
  console.log('\n攻城武器音效：');
  const hasKeys = /siege_impact/.test(readFileSync('src/audio/AudioManager.ts', 'utf8'))
    && /siege_launch/.test(readFileSync('src/audio/AudioManager.ts', 'utf8'));
  const wired = /m\.siegeW\)\s*\{[\s\S]{0,200}?audioManager\.play\(/.test(SRC);
  if (!hasKeys) { console.log('  🔴 AudioManager 里没有 siege_impact / siege_launch'); fail++; }
  else console.log('  ✅ AudioManager 已定义 siege_impact / siege_launch');
  if (!wired) { console.log('  🔴 攻城武器出手时没有播放音效'); fail++; }
  else console.log('  ✅ 攻城武器出手已接线（凿墙那 30~40 秒不再静音）');

  if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
  console.log('\n✅ 全部符合');
}
main();
