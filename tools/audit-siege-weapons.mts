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
import { readFileSync, existsSync } from 'node:fs';

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
  //   🔴 [2026-08-24] 两条硬标准：
  //     a) 撞击声必须挂在**命中相位**（ph>=3 + 本轮一次），不得每帧调用——
  //        写在 `if (m.lock <= 0)` 块外会让攻城武器**走向城墙的路上**就一直响（第一版就是这么错的）。
  //     b) siege_impact 必须是 DE 原声文件（主人 2026-08-24「必须和 DE 一样」）。
  console.log('\n攻城武器音效：');
  const AM = readFileSync('src/audio/AudioManager.ts', 'utf8');
  if (!/siege_impact/.test(AM) || !/siege_launch/.test(AM)) {
    console.log('  🔴 AudioManager 里没有 siege_impact / siege_launch'); fail++;
  } else console.log('  ✅ AudioManager 已定义 siege_impact / siege_launch');

  const deSrc = /siege_impact:\s*sound\('battle',\s*'(\w+)'/.exec(AM)?.[1] ?? null;
  if (deSrc !== 'siege_impact_de') {
    console.log(`  🔴 siege_impact 不是 DE 原声（当前 ${deSrc ?? '多源/借用'}）`); fail++;
  } else {
    const f = 'public/sfx/siege_impact_de.aud';
    if (!existsSync(f)) { console.log(`  🔴 ${f} 不存在`); fail++; }
    else {
      const head = readFileSync(f).subarray(0, 4).toString('latin1');
      if (head !== 'OggS') { console.log(`  🔴 ${f} 不是 ogg（头部 ${head}）`); fail++; }
      else console.log(`  ✅ siege_impact = DE 原声 ${f}（ogg, ${readFileSync(f).length} 字节）`);
    }
  }

  // 撞击：重械（冲车/攻城锤/装甲象）在命中相位出声
  if (!/m\.siegeW && isHeavyNonBlade && !m\.slashed && m\.ph >= 3[\s\S]{0,160}?audioManager\.play\('siege_impact'\)/.test(SRC)) {
    console.log('  🔴 撞击声没挂在命中相位（应为 m.siegeW && isHeavyNonBlade && !m.slashed && m.ph >= 3）'); fail++;
  } else console.log('  ✅ 冲车/攻城锤/装甲象：撞击声在命中相位（与刀光同相 ph>=3，本轮一次）');

  // 发射：远程攻城器械与弹丸同相位
  if (!/m\.shot = true;[\s\S]{0,400}?if \(m\.siegeW\) audioManager\.play\('siege_launch'\)/.test(SRC)) {
    console.log('  🔴 发射声没挂在弹丸相位（应紧跟 m.shot = true）'); fail++;
  } else console.log('  ✅ 投石车/弩炮/火箭车：发射声与弹丸同相位射出');

  // 防回归：不得回到每帧调用
  if (/m\.atkSt = m\.st;[^;]*?if \(m\.siegeW\)/.test(SRC)) {
    console.log('  🔴 音效又写回了 m.atkSt = m.st 后面（块外每帧调用）'); fail++;
  } else console.log('  ✅ 没有每帧调用（走向城墙的路上不会响）');

  // ④ 中国系攻城投石槽 = 牵引抛石机（主人 2026-08-26 定）
  //   依据：砲是中国战国到宋元的攻城主力；火箭车是明代的，且 rng 280、对建筑仅 +5，砸不动墙。
  //   非中国区不得被误改（高丽的火箭车线是史实，别顺手一起换了）。
  console.log('\n中国系攻城投石槽：');
  const tableOf = (name: string): string => {
    const i = SRC.indexOf(`const ${name}`);
    return SRC.slice(i, SRC.indexOf('\n};', i));
  };
  const techSrc = tableOf('SIEGE_TECH_BY_CULTURE');
  const techMap = new Map<string, Set<string>>();
  for (const m of techSrc.matchAll(/^\s{4}(\w+):\s*\{(.*)\}/gm)) {
    techMap.set(m[1], new Set([...m[2].matchAll(/(\w+):\s*true/g)].map((x) => x[1])));
  }
  const lineSrc = tableOf('SIEGE_MANGONEL_LINE');
  const lineMap = new Map<string, string[]>();
  for (const m of lineSrc.matchAll(/^\s{4}(\w+):\s*\[([^\]]+)\]/gm)) {
    lineMap.set(m[1], m[2].split(',').map((x) => x.trim().replace(/'/g, '')));
  }
  const DEFAULT_LINE = ['mangonel', 'onager', 'siege_onager'];
  const pickFor = (reg: string, tier: number): string | null => {
    const ln = lineMap.get(reg) ?? DEFAULT_LINE;
    const have = techMap.get(reg) ?? new Set<string>();
    for (let i = tier; i >= 0; i--) if (have.has(ln[i])) return ln[i];
    return null;
  };
  const CN_REGIONS = ['CENTRAL', 'NORTH', 'JIANGNAN', 'LINGNAN', 'BASHU', 'HEXI', 'NORTHEAST'];
  let cnBad = 0;
  for (const reg of CN_REGIONS) {
    const picks = [0, 1, 2].map((t) => pickFor(reg, t));
    if (picks.some((p) => p !== 'traction_trebuchet')) {
      console.log(`  🔴 ${reg}: ${picks.join(' / ')} —— 应三档全是 traction_trebuchet`);
      cnBad++; fail++;
    }
  }
  if (cnBad === 0) console.log(`  ✅ 中国系 ${CN_REGIONS.length} 区三档全是牵引抛石机（砲）`);
  // 高丽的火箭车线是史实（신기전 火车），不许被顺手换掉
  const korea = pickFor('KOREA', 2);
  if (korea !== 'heavy_rocket_cart') {
    console.log(`  🔴 KOREA 大城档变成 ${korea} —— 高丽的火箭车线是史实，别跟着中国一起换`);
    fail++;
  } else console.log('  ✅ 高丽仍是火箭车线（신기전 火车，史实）');

  if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
  console.log('\n✅ 全部符合');
}
main();
