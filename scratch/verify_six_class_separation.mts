// 验证 2026-08-05「六计硬分开」需求：
//   ① 三势选池 4/4/6（优势不含并/败、劣势不含攻/胜）
//   ② 在册武将池 = 专属 + 不在册通用池；无专属武将 = 纯通用池
//   ③ 攻守双方六计类别强制错开（劣势先放、均势随机）
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_six_class_separation.mts
import { getSituationalSkillPool, getSkillSixClass } from '../src/combat/GeneralSkillCombat';

const gidOwn = 'tiemuer_tiemuer'; // 帖木儿：有专属技（ts_115/ts_680）
const unitOwn: any = { generalId: gidOwn };

const SIX = ['gongzhan', 'shengzhan', 'dizhan', 'hunzhan', 'bingzhan', 'baizhan'] as const;
const SIX_CN: Record<string, string> = {
  gongzhan: '攻战', shengzhan: '胜战', dizhan: '敌战',
  hunzhan: '混战', bingzhan: '并战', baizhan: '败战',
};

console.log('===== ① 三势选池 4/4/6（帖木儿） =====');
for (const sit of ['advantage', 'balance', 'disadvantage'] as const) {
  const pool = getSituationalSkillPool(unitOwn, sit, []);
  const classes = new Set(pool.map(id => getSkillSixClass(id) ?? '?'));
  const clsStr = [...classes].map(c => SIX_CN[c] ?? c).join('、');
  const ownIds = pool.filter(id => id === 'ts_115' || id === 'ts_680');
  const expect = sit === 'advantage'
    ? '攻战/胜战/敌战/混战（禁 并战/败战）'
    : sit === 'disadvantage'
      ? '并战/败战/敌战/混战（禁 攻战/胜战）'
      : '全六计';
  console.log(`[${sit}] 池大小=${pool.length}  六计类别={${clsStr}}  期望=${expect}`);
  console.log(`        专属在池=${ownIds.join(',') || '（无）'}`);
  const bad = [...classes].filter(c => c !== '?' && !expect.includes(SIX_CN[c] ?? ''));
  if (bad.length > 0) console.log(`  ❌ 违规类别: ${bad.join(',')}`);
  else console.log('  ✅ 类别合法');
}

console.log('\n===== ② 在册/不在册池构成 =====');
// 帖木儿专属应进池；找一个 FactionGenerals 中在册但无专属技的武将
const { TACTICAL_SKILL_ENTRIES_V1 } = await import('../src/data/TacticalSkillCatalog');
const ownGids = new Set(TACTICAL_SKILL_ENTRIES_V1.filter(e => e.ownerGeneralId).map(e => e.ownerGeneralId));
const { FACTION_GENERALS } = await import('../src/data/FactionGenerals');
const noOwnGid = Object.values(FACTION_GENERALS).find(g => g.generalId && !ownGids.has(g.generalId))?.generalId;
console.log(`无专属在册武将示例: ${noOwnGid}`);
if (noOwnGid) {
  const poolNoOwn = getSituationalSkillPool({ generalId: noOwnGid } as any, 'balance', []);
  const poolOwn = getSituationalSkillPool(unitOwn, 'balance', []);
  const poolOwnExclOwn = poolOwn.filter(id => id !== 'ts_115' && id !== 'ts_680');
  console.log(`无专属武将均势池大小=${poolNoOwn.length}`);
  console.log(`帖木儿 均势池大小=${poolOwn.length}（含专属 ${poolOwn.length - poolOwnExclOwn.length} 个）`);
  console.log(`去掉专属后=${poolOwnExclOwn.length}，与无专属武将池 ${poolNoOwn.length === poolOwnExclOwn.length ? '✅ 一致' : '❌ 不一致'}`);
}

console.log('\n===== ③ 攻守六计强制错开（劣势先放 / 均势随机） =====');
function simulate(sitAtt: 'advantage' | 'balance' | 'disadvantage') {
  const sitDef = sitAtt === 'advantage' ? 'disadvantage' : sitAtt === 'disadvantage' ? 'advantage' : 'balance';
  // 先放侧：劣势先放；均势随机
  let first: 'att' | 'def';
  if (sitAtt === 'disadvantage') first = 'att';
  else if (sitDef === 'disadvantage') first = 'def';
  else first = Math.random() < 0.5 ? 'att' : 'def';

  const usedIds = new Set<string>();
  const usedCls = new Set<string>();
  const clsOf = (id: string) => getSkillSixClass(id) ?? `__nocls__${id}`;

  const pickFor = (sit: 'advantage' | 'balance' | 'disadvantage') => {
    const pool = getSituationalSkillPool(unitOwn, sit, [...usedIds]);
    const candidates = pool.filter(id => !usedCls.has(clsOf(id)));
    if (candidates.length === 0) {
      // 兜底：池内全撞车（理论不可达，池大）
      const p = pool[Math.floor(Math.random() * pool.length)];
      return { id: p, cls: clsOf(p), fallback: true };
    }
    const p = candidates[Math.floor(Math.random() * candidates.length)];
    usedIds.add(p);
    usedCls.add(clsOf(p));
    return { id: p, cls: clsOf(p), fallback: false };
  };

  const firstPick = pickFor(first === 'att' ? sitAtt : sitDef);
  const secondPick = pickFor(first === 'att' ? sitDef : sitAtt);
  return {
    firstSide: first,
    attCls: first === 'att' ? firstPick.cls : secondPick.cls,
    defCls: first === 'def' ? firstPick.cls : secondPick.cls,
    collision: firstPick.cls === secondPick.cls,
    fallback: firstPick.fallback || secondPick.fallback,
  };
}

for (const sit of ['advantage', 'balance', 'disadvantage'] as const) {
  const N = 5000;
  let collisions = 0, fallbacks = 0, attFirst = 0;
  for (let i = 0; i < N; i++) {
    const r = simulate(sit);
    if (r.collision) collisions++;
    if (r.fallback) fallbacks++;
    if (r.firstSide === 'att') attFirst++;
  }
  console.log(`[攻方${sit}] ${N} 次: 六计冲突=${collisions} (${(collisions / N * 100).toFixed(2)}%)  兜底触发=${fallbacks}  攻方先放=${(attFirst / N * 100).toFixed(1)}%`);
}
