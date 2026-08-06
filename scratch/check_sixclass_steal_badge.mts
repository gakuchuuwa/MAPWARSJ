// 复核 2026-08-06 报障局：攻方「夜渡袭城」/ 守方「壅水灌垒」角标双「胜」
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/check_sixclass_steal_badge.mts
import { getSkillSixClass, getOwnSixSetSkillId } from '../src/combat/GeneralSkillCombat';

const CN: Record<string, string> = {
  gongzhan: '攻战', shengzhan: '胜战', dizhan: '敌战',
  hunzhan: '混战', bingzhan: '并战', baizhan: '败战',
};
const att = 'ts_366'; // 夜渡袭城 (steal_enemy_skill)
const def = 'ts_293'; // 壅水灌垒 (enemy_sub_troops_opening)

console.log(`攻方 ${att} 夜渡袭城 → ${CN[getSkillSixClass(att) ?? ''] ?? '?'}`);
console.log(`守方 ${def} 壅水灌垒 → ${CN[getSkillSixClass(def) ?? ''] ?? '?'}`);
console.log(`分配层是否错开: ${getSkillSixClass(att) !== getSkillSixClass(def) ? '✅ 已错开' : '❌ 撞类'}`);

// 夺取发生后的两侧单位状态（照 applySkillCounters 的写法）
const attUnit: any = { generalId: 'x', battleOverriddenSkillId: att, stolenSkillId: def };
const defUnit: any = { generalId: 'y', battleOverriddenSkillId: null, negatedSkillId: def };
const chr = (id: string | null) => (id ? CN[getSkillSixClass(id) ?? ''] ?? '?' : '（空）');
console.log(`\n修复后角标: 攻=${chr(getOwnSixSetSkillId(attUnit))}  守=${chr(getOwnSixSetSkillId(defUnit))}`);
