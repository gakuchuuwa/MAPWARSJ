/**
 * 战略技覆盖体检（只检不改）
 * 目标校验：① 所有名将都有战略技  ② 所有战略技都有名将佩戴
 * 附带：普将错配、悬空引用、超限、缺 aptitude、天赋对齐（软性）。
 * 运行：npx tsx tools/audit_strategic_coverage.ts
 */
import { GENERAL_PROFILES, STRATEGIC_SKILL_CATALOG } from '../src/data/GeneralSkills';
import { TACTICAL_SKILL_BY_ID } from '../src/data/TacticalSkillCatalog';
import { auditStrategicAssignment, STRATEGIC_LIMITED_CAPS } from '../src/data/GeneralSkillTags';

type Prof = (typeof GENERAL_PROFILES)[string];

const profiles = Object.values(GENERAL_PROFILES);
const famous = profiles.filter((p) => p.tier === 'famous');
const ordinary = profiles.filter((p) => p.tier === 'ordinary');

let errCount = 0;
const bar = (t: string) => console.log(`\n${'='.repeat(60)}\n${t}\n${'='.repeat(60)}`);
function report(title: string, rows: string[], isError = true) {
    if (rows.length === 0) {
        console.log(`✅ ${title}：无`);
        return;
    }
    if (isError) errCount += rows.length;
    console.log(`${isError ? '❌' : '⚠️ '} ${title}：${rows.length} 条`);
    rows.forEach((r) => console.log(`    ${r}`));
}

// note 文本里解析技能天赋（造/均/逆），代码无机读字段
function skillAptitude(id: string): 'create' | 'leverage' | 'reverse' | null {
    const note = STRATEGIC_SKILL_CATALOG[id]?.note ?? '';
    if (/造势|造\b/.test(note) || note.includes('造势')) return 'create';
    if (note.includes('均势')) return 'leverage';
    if (note.includes('逆势')) return 'reverse';
    return null;
}

console.log(`名将 ${famous.length}｜普将 ${ordinary.length}｜战略技目录 ${Object.keys(STRATEGIC_SKILL_CATALOG).length}`);

// ── 需求① 名将无战略技 ──
bar('需求① 所有名将都有战略技');
report(
    '名将缺战略技',
    famous.filter((p) => !p.strategicSkillId).map((p) => `${p.generalId}`),
);

// ── 需求② 战略技无人佩戴 ──
bar('需求② 所有战略技都有名将佩戴');
const audit = auditStrategicAssignment();
report(
    '空技（0 人佩戴）',
    audit.emptySkills.map((s) => `${s.skillId} ${s.displayName}`),
);

// ── 结构错误 ──
bar('结构错误');
report(
    '普将误挂战略技（应仅名将有）',
    ordinary.filter((p) => p.strategicSkillId).map((p) => `${p.generalId} → ${p.strategicSkillId}`),
);
report(
    '战略技指向不存在的 id',
    audit.unknownIds.slice(),
);

// 悬空引用：战术格 4 字段指向不存在的 ts_
const tacFields: (keyof Prof)[] = ['tacticalSkillId', 'advantageSkillId', 'balanceSkillId', 'disadvantageSkillId'];
const dangling: string[] = [];
for (const p of profiles) {
    for (const f of tacFields) {
        const id = p[f] as string | undefined;
        if (id && !TACTICAL_SKILL_BY_ID[id]) dangling.push(`${p.generalId}.${String(f)} → ${id}（不存在）`);
    }
}
report('战术技字段悬空引用', dangling);

// 重复 generalId 键（对象字面量后写覆盖前写，静默丢失）
// 注：JS 对象无法在运行时查重复键，改由文本层扫描
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const srcText = readFileSync(resolve(__dir, '../src/data/GeneralSkills.ts'), 'utf8');
const idSeen = new Map<string, number>();
for (const m of srcText.matchAll(/^\s{4}(\w+):\s*\{\s*generalId:/gm)) {
    const key = m[1];
    idSeen.set(key, (idSeen.get(key) ?? 0) + 1);
}
report(
    '重复 generalId 键（后者覆盖前者）',
    [...idSeen.entries()].filter(([, n]) => n > 1).map(([k, n]) => `${k} ×${n}`),
);

// ── 分布告警（软性，非硬错误）──
bar('分布告警（软性）');
const holders: Record<string, number> = {};
for (const p of famous) if (p.strategicSkillId) holders[p.strategicSkillId] = (holders[p.strategicSkillId] ?? 0) + 1;

// 超限（cap）
report(
    `超限技（STRATEGIC_LIMITED_CAPS）`,
    audit.capViolations.map((v) => `${v.skillId} ${v.displayName}: ${v.count} > ${v.max}`),
);

// 过度集中：占名将 >15%
const over = Object.entries(holders)
    .filter(([, n]) => n / famous.length > 0.15)
    .sort((a, b) => b[1] - a[1]);
report(
    '过度集中（>15% 名将）',
    over.map(([id, n]) => `${id} ${STRATEGIC_SKILL_CATALOG[id]?.displayName ?? '?'}: ${n} 人（${((n / famous.length) * 100).toFixed(1)}%）`),
    false,
);

// 名将缺 aptitude
report(
    '名将缺 aptitude 字段',
    famous.filter((p) => !p.aptitude).map((p) => p.generalId),
    false,
);

// 天赋不对齐（软性：note 解析，代码不强制）
const mismatch: string[] = [];
for (const p of famous) {
    if (!p.strategicSkillId || !p.aptitude) continue;
    const sa = skillAptitude(p.strategicSkillId);
    if (sa && sa !== p.aptitude) mismatch.push(`${p.generalId}: 将=${p.aptitude} ≠ 技=${sa}(${p.strategicSkillId})`);
}
report('天赋不对齐（将 aptitude ≠ 技 note 天赋）', mismatch, false);

// ── 全技佩戴分布一览 ──
bar('全 20 技佩戴分布一览（含空技）');
const cats: Record<string, string[]> = {};
for (const s of Object.values(STRATEGIC_SKILL_CATALOG)) {
    const c = s.category ?? '(无类)';
    (cats[c] ??= []).push(`${s.id} ${s.displayName.padEnd(6)} ${String(holders[s.id] ?? 0).padStart(3)} 人`);
}
for (const [c, rows] of Object.entries(cats)) {
    console.log(`【${c}】`);
    rows.forEach((r) => console.log(`    ${r}`));
}

bar(`结论`);
console.log(errCount === 0 ? '✅ 无硬错误' : `❌ 硬错误合计 ${errCount} 条（见上）`);
