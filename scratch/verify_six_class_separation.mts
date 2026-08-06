// 验证 2026-08-05「六计硬分开」需求：
//   ① 三势选池 4/4/6（优势不含并/败、劣势不含攻/胜）
//   ② 在册武将池 = 专属 + 不在册通用池；无专属武将 = 纯通用池
//   ③ 攻守双方六计类别强制错开（劣势先放、均势随机）
//
// [2026-08-06 修脚本] 原版有两处**脚本自身**的假报错，会误导后来者以为引擎坏了：
//   · ①：用 `expect.includes(中文类名)` 判合规，而均势的 expect 串是「全六计」，
//        任何类名都不在里面 ⇒ 均势必然全红。改为按类别集合判定。
//   · ②：把帖木儿的专属技硬写成 ts_115/ts_680，实际有**三个**（还有 ts_681 佯退伏截），
//        于是「去掉专属后 190 ≠ 通用池 189」假报不一致。改为从目录按 ownerGeneralId 现取。
// 引擎两处都没问题，别再照旧结论下判断。
//
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_six_class_separation.mts
import { getSituationalSkillPool, getSkillSixClass } from '../src/combat/GeneralSkillCombat';

const gidOwn = 'tiemuer_tiemuer'; // 帖木儿：有专属技（数量从目录现取，勿硬写）
const unitOwn: any = { generalId: gidOwn };

const SIX_CN: Record<string, string> = {
  gongzhan: '攻战', shengzhan: '胜战', dizhan: '敌战',
  hunzhan: '混战', bingzhan: '并战', baizhan: '败战',
};

const { TACTICAL_SKILL_ENTRIES_V1 } = await import('../src/data/TacticalSkillCatalog');
const ownIdsOfTimur = TACTICAL_SKILL_ENTRIES_V1
  .filter(e => e.ownerGeneralId === gidOwn)
  .map(e => e.id);
console.log(`帖木儿专属技（现取）: ${ownIdsOfTimur.join(', ')}  共 ${ownIdsOfTimur.length} 个\n`);

console.log('===== ① 三势选池 4/4/6（帖木儿） =====');
const ALLOWED: Record<string, string[]> = {
  advantage: ['gongzhan', 'shengzhan', 'dizhan', 'hunzhan'],
  disadvantage: ['bingzhan', 'baizhan', 'dizhan', 'hunzhan'],
  balance: ['gongzhan', 'shengzhan', 'dizhan', 'hunzhan', 'bingzhan', 'baizhan'],
};
for (const sit of ['advantage', 'balance', 'disadvantage'] as const) {
  const pool = getSituationalSkillPool(unitOwn, sit, []);
  const classes = [...new Set(pool.map(id => getSkillSixClass(id) ?? '?'))];
  const allowed = ALLOWED[sit];
  const bad = classes.filter(c => !allowed.includes(c));
  const inPool = pool.filter(id => ownIdsOfTimur.includes(id));
  console.log(`[${sit}] 池大小=${pool.length}  类别={${classes.map(c => SIX_CN[c] ?? c).join('、')}}`);
  console.log(`        允许={${allowed.map(c => SIX_CN[c]).join('、')}}  专属在池=${inPool.join(',') || '（无）'}`);
  console.log(bad.length > 0 ? `  ❌ 违规类别: ${bad.join(',')}` : '  ✅ 类别合法');
}

console.log('\n===== ② 在册/不在册池构成 =====');
const ownGids = new Set(TACTICAL_SKILL_ENTRIES_V1.filter(e => e.ownerGeneralId).map(e => e.ownerGeneralId));
const { FACTION_GENERALS } = await import('../src/data/FactionGenerals');
const noOwnGid = Object.values(FACTION_GENERALS).find(g => g.generalId && !ownGids.has(g.generalId))?.generalId;
console.log(`无专属在册武将示例: ${noOwnGid}`);
if (noOwnGid) {
  const poolNoOwn = getSituationalSkillPool({ generalId: noOwnGid } as any, 'balance', []);
  const poolOwn = getSituationalSkillPool(unitOwn, 'balance', []);
  const poolOwnExclOwn = poolOwn.filter(id => !ownIdsOfTimur.includes(id));
  console.log(`无专属武将均势池大小=${poolNoOwn.length}`);
  console.log(`帖木儿 均势池大小=${poolOwn.length}（含专属 ${poolOwn.length - poolOwnExclOwn.length} 个）`);
  console.log(`去掉专属后=${poolOwnExclOwn.length}，与无专属武将池 ${poolNoOwn.length === poolOwnExclOwn.length ? '✅ 一致' : '❌ 不一致'}`);
}

console.log('\n===== ③ 攻守六计强制错开（劣势先放 / 均势随机） =====');
// 注意：本节是**离线模拟**，复刻 BattleField.assignSituationalSkills 的挑技规则，
// 不是跑引擎本体。引擎实装见 BattleField.assignSituationalSkills + pickSkillAvoidingUsedSixClass。
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

console.log('\n⚠️ 角标提醒：分配层错开 ≠ 战斗面板两枚角标必不同字。');
console.log('   夺取系（混战计）夺来敌技后，角标若跟着夺来技走就会双方同字——');
console.log('   故角标走 getOwnSixSetSkillId（跳过 stolenSkillId），与引擎结算的 getActiveTacticalSkillId 故意不同源。');
