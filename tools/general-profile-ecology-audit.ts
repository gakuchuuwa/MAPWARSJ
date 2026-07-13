/**
 * 在册武将生态审计。
 *
 * 口径：
 * - 在册武将只取 FactionGenerals.ts 的 generalId。
 * - profile 直接解析源码 AST，以便发现导入对象时会被静默覆盖的重复键。
 * - 现行覆盖只统计攻方/守方六槽；旧 tacticalSkillId 与旧三槽不参与。
 * - 长驱深入、据险而守、守土继绝是远征/据点系统技，不计武将技能覆盖。
 *
 * 运行：npm run general:ecology-audit
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';
import {
    TACTICAL_SKILL_ENTRIES_V1,
    type TacticalSkillEntry,
} from '../src/data/TacticalSkillCatalog';

const ROOT = process.cwd();
const ROSTER_PATH = path.join(ROOT, 'src/data/FactionGenerals.ts');
const PROFILE_PATH = path.join(ROOT, 'src/data/general-skills/profiles.ts');

const SLOT_FIELDS = [
    'atkAdvantageSkillId',
    'atkBalanceSkillId',
    'atkDisadvantageSkillId',
    'defAdvantageSkillId',
    'defBalanceSkillId',
    'defDisadvantageSkillId',
] as const;
type SlotField = typeof SLOT_FIELDS[number];

const SLOT_LABELS: Readonly<Record<SlotField, string>> = {
    atkAdvantageSkillId: '攻优',
    atkBalanceSkillId: '攻均',
    atkDisadvantageSkillId: '攻劣',
    defAdvantageSkillId: '守优',
    defBalanceSkillId: '守均',
    defDisadvantageSkillId: '守劣',
};

const APTITUDES = ['create', 'leverage', 'reverse'] as const;
const STYLES = ['attack', 'defense', 'balanced'] as const;
const SYSTEM_SKILL_NAMES = new Set(['长驱深入', '据险而守', '守土继绝']);

interface SourceEntry {
    key: string;
    line: number;
    fields: Record<string, string>;
}

function propertyNameText(name: ts.PropertyName): string | null {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
    return null;
}

function stringValue(node: ts.Expression): string | null {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    return null;
}

function findObjectEntries(filePath: string, variableName: string): SourceEntry[] {
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const source = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    let objectLiteral: ts.ObjectLiteralExpression | null = null;

    const visit = (node: ts.Node): void => {
        if (
            ts.isVariableDeclaration(node)
            && ts.isIdentifier(node.name)
            && node.name.text === variableName
            && node.initializer
        ) {
            let initializer: ts.Expression = node.initializer;
            if (ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer)) initializer = initializer.expression;
            if (ts.isObjectLiteralExpression(initializer)) objectLiteral = initializer;
        }
        if (!objectLiteral) ts.forEachChild(node, visit);
    };
    visit(source);
    if (!objectLiteral) throw new Error(`找不到 ${variableName}: ${filePath}`);

    const entries: SourceEntry[] = [];
    for (const property of (objectLiteral as ts.ObjectLiteralExpression).properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const key = propertyNameText(property.name);
        if (!key || !ts.isObjectLiteralExpression(property.initializer)) continue;
        const fields: Record<string, string> = {};
        for (const field of property.initializer.properties) {
            if (!ts.isPropertyAssignment(field)) continue;
            const fieldName = propertyNameText(field.name);
            const value = stringValue(field.initializer);
            if (fieldName && value !== null) fields[fieldName] = value;
        }
        entries.push({
            key,
            line: source.getLineAndCharacterOfPosition(property.getStart(source)).line + 1,
            fields,
        });
    }
    return entries;
}

function countBy(values: Iterable<string | undefined>): Map<string, number> {
    const counts = new Map<string, number>();
    for (const value of values) {
        const key = value ?? '未填写';
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
}

function formatCounts(counts: Map<string, number>, order: readonly string[] = []): string {
    const keys = [
        ...order.filter((key) => counts.has(key)),
        ...[...counts.keys()].filter((key) => !order.includes(key)).sort(),
    ];
    return keys.map((key) => `${key} ${counts.get(key)}`).join(' / ');
}

function topFrequency(
    counts: Map<string, number>,
    skills: ReadonlyMap<string, TacticalSkillEntry>,
    limit = 12,
): string {
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([id, count]) => `${id}${skills.get(id) ? `【${skills.get(id)!.displayName}】` : ''} ${count}`)
        .join(' / ');
}

function pct(numerator: number, denominator: number): string {
    return denominator === 0 ? '0.0%' : `${(numerator / denominator * 100).toFixed(1)}%`;
}

function main(): void {
    const rosterEntries = findObjectEntries(ROSTER_PATH, 'FACTION_GENERALS');
    const profileEntries = findObjectEntries(PROFILE_PATH, 'GENERAL_PROFILES');
    const rosterIds = new Set(rosterEntries.map((entry) => entry.fields.generalId).filter(Boolean));

    const profileKeyLines = new Map<string, number[]>();
    for (const entry of profileEntries) {
        const lines = profileKeyLines.get(entry.key) ?? [];
        lines.push(entry.line);
        profileKeyLines.set(entry.key, lines);
    }
    const duplicateProfileKeys = [...profileKeyLines]
        .filter(([, lines]) => lines.length > 1)
        .map(([key, lines]) => `${key}（行 ${lines.join(', ')}）`);
    const keyMismatches = profileEntries
        .filter((entry) => entry.fields.generalId !== entry.key)
        .map((entry) => `${entry.key}（行 ${entry.line}）→ generalId=${entry.fields.generalId ?? '缺失'}`);

    // 重复键按源码最后一条的运行时语义建统计，但重复本身仍是硬错误。
    const profiles = new Map<string, SourceEntry>();
    for (const entry of profileEntries) profiles.set(entry.key, entry);

    const registeredProfiles = [...rosterIds]
        .map((id) => profiles.get(id))
        .filter((entry): entry is SourceEntry => Boolean(entry));
    const missingProfiles = [...rosterIds].filter((id) => !profiles.has(id)).sort();
    const orphanProfiles = [...profiles.values()].filter((entry) => !rosterIds.has(entry.key));

    const skills = new Map(
        TACTICAL_SKILL_ENTRIES_V1
            .filter((entry) => !SYSTEM_SKILL_NAMES.has(entry.displayName))
            .map((entry) => [entry.id, entry] as const),
    );

    const incompleteSlots: string[] = [];
    const missingSkillRefs: string[] = [];
    for (const profile of registeredProfiles) {
        const missing = SLOT_FIELDS.filter((field) => !profile.fields[field]);
        if (missing.length > 0) {
            incompleteSlots.push(`${profile.key}: ${missing.map((field) => SLOT_LABELS[field]).join('、')}`);
        }
        for (const field of SLOT_FIELDS) {
            const skillId = profile.fields[field];
            if (skillId && !skills.has(skillId)) {
                missingSkillRefs.push(`${profile.key}.${field}=${skillId}`);
            }
        }
    }

    const tierCounts = countBy(registeredProfiles.map((entry) => entry.fields.tier));
    const aptitudeCounts = countBy(registeredProfiles.map((entry) => entry.fields.aptitude));
    const styleCounts = countBy(registeredProfiles.map((entry) => entry.fields.attackStyle));
    const styledCount = registeredProfiles.filter((entry) => entry.fields.attackStyle).length;

    const cross = new Map<string, number>();
    for (const aptitude of APTITUDES) {
        for (const style of STYLES) cross.set(`${aptitude}|${style}`, 0);
    }
    for (const profile of registeredProfiles) {
        const aptitude = profile.fields.aptitude;
        const style = profile.fields.attackStyle;
        const key = `${aptitude}|${style}`;
        if (cross.has(key)) cross.set(key, cross.get(key)! + 1);
    }

    const slotFrequencies = new Map<SlotField, Map<string, number>>();
    const allAssignments = new Map<string, number>();
    const holders = new Map<string, Set<string>>();
    const uniqueHistogram = new Map<string, number>();
    let samePositionPairs = 0;
    let comparablePositionPairs = 0;

    for (const field of SLOT_FIELDS) slotFrequencies.set(field, new Map());
    for (const profile of registeredProfiles) {
        const unique = new Set<string>();
        for (const field of SLOT_FIELDS) {
            const id = profile.fields[field];
            if (!id || !skills.has(id)) continue;
            unique.add(id);
            const bySlot = slotFrequencies.get(field)!;
            bySlot.set(id, (bySlot.get(id) ?? 0) + 1);
            allAssignments.set(id, (allAssignments.get(id) ?? 0) + 1);
            const skillHolders = holders.get(id) ?? new Set<string>();
            skillHolders.add(profile.key);
            holders.set(id, skillHolders);
        }
        uniqueHistogram.set(String(unique.size), (uniqueHistogram.get(String(unique.size)) ?? 0) + 1);
        for (const suffix of ['AdvantageSkillId', 'BalanceSkillId', 'DisadvantageSkillId'] as const) {
            const atk = profile.fields[`atk${suffix}`];
            const def = profile.fields[`def${suffix}`];
            if (!atk || !def) continue;
            comparablePositionPairs++;
            if (atk === def) samePositionPairs++;
        }
    }

    const usedSkillIds = new Set(allAssignments.keys());
    const unusedSkills = [...skills.values()]
        .filter((entry) => !usedSkillIds.has(entry.id))
        .sort((a, b) => a.id.localeCompare(b.id));
    const assignmentTotal = [...allAssignments.values()].reduce((sum, count) => sum + count, 0);
    const mostAssigned = [...allAssignments].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const mostHeld = [...holders].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))[0];

    console.log('══ 在册武将生态审计 ══\n');
    console.log('【统计口径】');
    console.log(`  FactionGenerals 源码条目: ${rosterEntries.length}`);
    console.log(`  在册 generalId（去重）: ${rosterIds.size}`);
    console.log(`  profile 源码条目: ${profileEntries.length}；运行时唯一键: ${profiles.size}`);
    console.log(`  在册档案: ${registeredProfiles.length}`);
    console.log(`  孤儿档案: ${orphanProfiles.length}`);
    console.log(`  在册缺档: ${missingProfiles.length}`);
    console.log('  现行覆盖仅含攻守六槽；不含 tacticalSkillId、旧三槽及三项系统技。\n');

    console.log('【在册生态】');
    console.log(`  名将/普将: ${formatCounts(tierCounts, ['famous', 'ordinary', '未填写'])}`);
    console.log(`  aptitude: ${formatCounts(aptitudeCounts, [...APTITUDES, '未填写'])}`);
    console.log(`  attackStyle 覆盖: ${styledCount}/${registeredProfiles.length}（${pct(styledCount, registeredProfiles.length)}）`);
    console.log(`  attackStyle 分布: ${formatCounts(styleCounts, [...STYLES, '未填写'])}`);
    console.log('  aptitude × attackStyle（3×3；缺值不塞入矩阵）:');
    console.log('                   attack  defense  balanced');
    for (const aptitude of APTITUDES) {
        const cells = STYLES.map((style) => String(cross.get(`${aptitude}|${style}`) ?? 0).padStart(8));
        console.log(`    ${aptitude.padEnd(10)} ${cells.join(' ')}`);
    }

    console.log('\n【六槽技能频次】');
    for (const field of SLOT_FIELDS) {
        const counts = slotFrequencies.get(field)!;
        const slotTotal = [...counts.values()].reduce((sum, count) => sum + count, 0);
        const max = [...counts.values()].reduce((value, count) => Math.max(value, count), 0);
        console.log(`  ${SLOT_LABELS[field]}: 有效 ${slotTotal}；不同技能 ${counts.size}；单技最高 ${max}/${slotTotal}（${pct(max, slotTotal)}）`);
        console.log(`    TOP12: ${topFrequency(counts, skills) || '无'}`);
    }

    console.log('\n【现行六槽覆盖与集中度】');
    console.log(`  可用战术技目录: ${skills.size}`);
    console.log(`  六槽已覆盖: ${usedSkillIds.size}/${skills.size}（${pct(usedSkillIds.size, skills.size)}）`);
    console.log(`  无人使用技能: ${unusedSkills.length}`);
    console.log(`    ${unusedSkills.map((entry) => `${entry.id}【${entry.displayName}】`).join(' / ') || '无'}`);
    if (mostAssigned) {
        console.log(`  单技最高槽位次数: ${mostAssigned[0]}【${skills.get(mostAssigned[0])?.displayName ?? '未知'}】 ${mostAssigned[1]}/${assignmentTotal}（${pct(mostAssigned[1], assignmentTotal)}）`);
    }
    if (mostHeld) {
        console.log(`  单技最高持有人数: ${mostHeld[0]}【${skills.get(mostHeld[0])?.displayName ?? '未知'}】 ${mostHeld[1].size}/${registeredProfiles.length}（${pct(mostHeld[1].size, registeredProfiles.length)}）`);
    }
    console.log(`  攻守同位重复: ${samePositionPairs}/${comparablePositionPairs}（${pct(samePositionPairs, comparablePositionPairs)}）`);
    console.log(`  每将六槽唯一技能数: ${formatCounts(uniqueHistogram, ['0', '1', '2', '3', '4', '5', '6'])}`);

    const hardErrorCount = duplicateProfileKeys.length
        + keyMismatches.length
        + missingProfiles.length
        + incompleteSlots.length
        + missingSkillRefs.length;
    console.log('\n【硬错误】');
    const printErrors = (label: string, errors: string[]): void => {
        console.log(`  ${errors.length === 0 ? '✅' : '❌'} ${label}: ${errors.length}`);
        for (const error of errors) console.log(`    - ${error}`);
    };
    printErrors('重复 profile 键', duplicateProfileKeys);
    printErrors('profile 键与 generalId 不同', keyMismatches);
    printErrors('在册将缺 profile', missingProfiles);
    printErrors('在册将六槽不全', incompleteSlots);
    printErrors('六槽引用不存在技能', missingSkillRefs);

    console.log(hardErrorCount === 0
        ? '\n✅ 在册武将生态审计通过（统计项不设闸门）'
        : `\n❌ 在册武将生态审计失败：${hardErrorCount} 项硬错误（完整统计已输出）`);
    process.exitCode = hardErrorCount === 0 ? 0 : 1;
}

try {
    main();
} catch (error) {
    console.error('❌ 审计工具执行失败:', error);
    process.exitCode = 1;
}
