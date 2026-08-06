/**
 * 三类六种审计（战术技分类）
 * 运行：npm run tactical:triclass
 *
 * 检查项：
 *   1. 全目录逐条按 getTacticalSixSet / getTacticalTriClass 归类（分类只看
 *      baseEffect + 劣势 condition 覆盖，条文见 docs/02-design/武将技-分类逻辑说明.md）
 *   2. 输出当前真实分布（六种 / 三类 / 改判数），供同步进设计文档
 * 任一违规 → exit(1)，接入 CI / 手跑均可
 *
 * 原「武将三格配对」检查已于 2026-08-07 删除，理由见文件末尾。
 */
import {
    TACTICAL_SKILL_ENTRIES_V1,
    getTacticalSixSet,
    getTacticalTriClass,
    UNDERDOG_CONDITIONS,
    SIX_SET_LABEL,
    TRI_CLASS_LABEL,
    SIX_SET_TO_TRI_CLASS,
    type TacticalSkillEntry,
    type TacticalTriClass,
    type TacticalSixSet,
} from '../src/data/TacticalSkillCatalog';

let failed = false;

// ── 1. 全目录归类 + 分布统计 ──
const byId = new Map<string, TacticalSkillEntry>();
const sixCount = new Map<TacticalSixSet, number>();
const triCount = new Map<TacticalTriClass, number>();
let overrideCount = 0;
for (const entry of TACTICAL_SKILL_ENTRIES_V1) {
    if (byId.has(entry.id)) {
        console.error(`❌ 重复技 id: ${entry.id}`);
        failed = true;
    }
    byId.set(entry.id, entry);
    const six = getTacticalSixSet(entry);
    const tri = getTacticalTriClass(entry);
    sixCount.set(six, (sixCount.get(six) ?? 0) + 1);
    triCount.set(tri, (triCount.get(tri) ?? 0) + 1);
    // 第3步改判：condition 属劣势集，且六种推导本不是劣势
    if (UNDERDOG_CONDITIONS.has(entry.condition) && SIX_SET_TO_TRI_CLASS[six] !== 'disadvantage') {
        overrideCount++;
    }
}
console.log('══ 三类六种审计 ══\n');
console.log(`目录技数: ${byId.size}`);
console.log('六种分布: ' + [...sixCount].map(([k, v]) => `${SIX_SET_LABEL[k]}${v}`).join(' / '));
console.log('三类分布: ' + [...triCount].map(([k, v]) => `${TRI_CLASS_LABEL[k]}${v}`).join(' / '));
console.log(`劣势 condition 改判数: ${overrideCount}`);

// ── 2. 武将三格配对审计（2026-08-07 删除）──
// 原先逐将核对 advantage/balance/disadvantageSkillId 是否与三类一致。
// 2026-08-04 起选技改为「三势选池」：优势=攻战/胜战/敌战/混战、劣势=并战/败战/敌战/混战、
// 均势=全六计，池子直接由六计 + 本人专属技构成（见 GeneralSkillCombat.getSituationalSkillPool），
// 档案里的三格/六槽字段不再驱动选技，只剩 batch-manager 编辑器在读。
// 对着不影响战斗的字段判 exit(1) 只会长期误报，故删除；
// 槽位引用是否存在于目录仍由 general:ecology-audit 兜底。

process.exit(failed ? 1 : 0);
