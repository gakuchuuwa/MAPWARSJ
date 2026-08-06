/**
 * 战术技分配审计（批量提交前必跑）：
 *   1. auditTacticalDistribution — 单技占同池比例 ≤ 25%
 *   2. auditAssignTierConstraints — gamble 名将 ≤ 5 + 空置 ready 技清单
 * 有硬违规则 exit(1)，接入 CI / 手跑均可：npm run tactical:assign-audit
 */


import {
    auditTacticalDistribution,
    auditAssignTierConstraints,
    auditStrategicAssignment,
} from '../src/data/GeneralSkillTags';

const dist = auditTacticalDistribution();
const tier = auditAssignTierConstraints();

console.log('══ 战术技分配审计 ══\n');

console.log('【占比闸门】单技 ≤ 25% 同池');
if (dist.ok) {
    console.log('  ✅ 无违规');
} else {
    for (const v of dist.violations) {
        console.log(`  ❌ ${v.tacticalId} [${v.tier}] ${v.count} 人，占比 ${(v.share * 100).toFixed(1)}% > ${v.maxShare * 100}%`);
    }
}

console.log(`\n【多样性警告】ready 但 0 人持有（${tier.emptyReadySkills.length} 个）`);
for (const s of tier.emptyReadySkills) {
    console.log(`  ⚠️ ${s.skillId} ${s.displayName}`);
}

const strat = auditStrategicAssignment();
console.log('\n【战略技闸门】限量上限 / 退役技清零 / 未知ID');
if (strat.ok) {
    console.log('  ✅ 无违规');
} else {
    for (const v of strat.capViolations) console.log(`  ❌ ${v.skillId} ${v.displayName}: ${v.count} > 上限 ${v.max}`);
    for (const v of strat.retiredHolders) console.log(`  ❌ 退役技 ${v.skillId} 仍有 ${v.count} 人`);
    for (const id of strat.unknownIds) console.log(`  ❌ 未知战略技 ID: ${id}`);
}
// 「空置战略技」提示已于 2026-08-07 删除：2026-08-03 起战略技全随机，不再写进武将档案
// （strategicSkillId 恒空），运行时从 GeneralSkillCombat.ACTIVE_STRATEGIC_SKILL_POOL 抽取。
// 该提示列出的正是这个活跃随机池本身，0 人持有是正常状态，判据是反的。

const ok = dist.ok && tier.ok && strat.ok;
console.log(ok ? '\n✅ 分配审计通过' : '\n❌ 分配审计不通过');
process.exit(ok ? 0 : 1);

