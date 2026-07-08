/**
 * 三类六种审计（战术技分类 + 武将三格配对）
 * 运行：npm run tactical:triclass
 *
 * 检查项：
 *   1. 全目录逐条按 getTacticalSixSet / getTacticalTriClass 归类（分类只看
 *      baseEffect + 劣势 condition 覆盖，条文见 docs/02-design/武将技-分类逻辑说明.md）
 *   2. GENERAL_PROFILES 三格（advantage/balance/disadvantage SkillId）：
 *      引用必须存在于目录，且所配技的三类须与格子一致
 *   3. 输出当前真实分布（六种 / 三类 / 改判数），供同步进设计文档
 * 任一违规 → exit(1)，接入 CI / 手跑均可
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
import { GENERAL_PROFILES } from '../src/data/GeneralSkills';

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

// ── 2. 武将三格配对审计 ──
const SLOTS: Array<['advantageSkillId' | 'balanceSkillId' | 'disadvantageSkillId', TacticalTriClass, string]> = [
    ['advantageSkillId', 'advantage', '优势格'],
    ['balanceSkillId', 'balance', '均势格'],
    ['disadvantageSkillId', 'disadvantage', '劣势格'],
];
let profileTotal = 0;
let slotChecked = 0;
const wrong: string[] = [];
for (const [gid, p] of Object.entries(GENERAL_PROFILES)) {
    if (!p.advantageSkillId && !p.balanceSkillId && !p.disadvantageSkillId) continue;
    profileTotal++;
    for (const [field, expect, label] of SLOTS) {
        const skillId = p[field];
        if (!skillId) {
            wrong.push(`${gid}: 缺${label}`);
            continue;
        }
        const entry = byId.get(skillId);
        if (!entry) {
            wrong.push(`${gid}: ${label}=${skillId} 目录中不存在`);
            continue;
        }
        slotChecked++;
        const tri = getTacticalTriClass(entry);
        if (tri !== expect) {
            wrong.push(
                `${gid}: ${label}=${skillId}【${entry.displayName}】实为${TRI_CLASS_LABEL[tri]}` +
                `（${SIX_SET_LABEL[getTacticalSixSet(entry)]}, effect=${entry.baseEffect}, cond=${entry.condition}）`,
            );
        }
    }
}
console.log(`\n武将档案（含三格）: ${profileTotal}，已核对格数: ${slotChecked}`);
if (wrong.length > 0) {
    failed = true;
    console.error(`❌ 三格违规 ${wrong.length} 条:`);
    for (const w of wrong) console.error('  ' + w);
} else {
    console.log('✅ 三格配对全部正确');
}

process.exit(failed ? 1 : 0);
