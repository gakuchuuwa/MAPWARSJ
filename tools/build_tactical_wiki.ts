import fs from 'fs';
import path from 'path';
import {
    TACTICAL_SKILL_ENTRIES_V1,
    getTacticalSixSet,
    SIX_SET_LABEL,
    getTacticalTriClass,
    TRI_CLASS_LABEL,
    UNDERDOG_CONDITIONS,
    VARIANCE_EFFECTS
} from '../src/data/TacticalSkillCatalog';

const OUTPUT_DIR = path.join(process.cwd(), '乱斗游戏/03_武将技');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const skillsBySet = new Map<string, typeof TACTICAL_SKILL_ENTRIES_V1>();
for (const skill of TACTICAL_SKILL_ENTRIES_V1) {
    let sixSet = getTacticalSixSet(skill);
    
    // 应用 getTacticalTriClass 中的强制归劣势规则，统一放入【败战计】分类中
    if (UNDERDOG_CONDITIONS.has(skill.condition) || VARIANCE_EFFECTS.has(skill.baseEffect)) {
        sixSet = 'baizhan';
    }

    if (!skillsBySet.has(sixSet)) {
        skillsBySet.set(sixSet, []);
    }
    skillsBySet.get(sixSet)!.push(skill);
}

const SET_FILES: Record<string, string> = {
    'gongzhan': '战术技_1_攻战计.md',
    'shengzhan': '战术技_2_胜战计.md',
    'dizhan': '战术技_3_敌战计.md',
    'hunzhan': '战术技_4_混战计.md',
    'bingzhan': '战术技_5_并战计.md',
    'baizhan': '战术技_6_败战计.md',
};

// Generate 6 files
for (const [sixSet, skills] of skillsBySet.entries()) {
    const filename = SET_FILES[sixSet] || `战术技_未知_${sixSet}.md`;
    const label = SIX_SET_LABEL[sixSet as keyof typeof SIX_SET_LABEL] || sixSet;
    let content = `# MAPWAR 战术武将技百科：${label}\n\n`;
    content += `当前分类共收录了 **${skills.length}** 个武将技能。\n\n`;

    // Group by TriClass
    const byTri = new Map<string, typeof TACTICAL_SKILL_ENTRIES_V1>();
    for (const s of skills) {
        const tri = getTacticalTriClass(s);
        if (!byTri.has(tri)) byTri.set(tri, []);
        byTri.get(tri)!.push(s);
    }

    const order = ['advantage', 'balance', 'disadvantage'];
    for (const tri of order) {
        if (!byTri.has(tri)) continue;
        const triSkills = byTri.get(tri)!;
        const triLabel = TRI_CLASS_LABEL[tri as keyof typeof TRI_CLASS_LABEL] || tri;
        content += `## ${triLabel} (${triSkills.length} 技)\n\n`;

        for (const s of triSkills) {
            content += `### ${s.displayName} (\`${s.id}\`)\n`;
            if (s.sourceQuote) content += `> ${s.sourceQuote}\n\n`;
            content += `- **触发条件**: \`${s.condition}\`\n`;
            content += `- **底层效果**: \`${s.baseEffect}\`\n`;
            content += `- **生效阶段**: \`${s.phase}\`\n`;
            content += `- **效果量级**: \`${s.magnitude}\`\n`;
            if (s.legacyTacId) content += `- **继承自旧版ID**: \`${s.legacyTacId}\`\n`;
            content += `\n---\n\n`;
        }
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, filename), content, 'utf-8');
    console.log(`Generated ${filename}`);
}

// Generate Index
const total = TACTICAL_SKILL_ENTRIES_V1.length;
let indexContent = `# MAPWAR 全武将技名录 (General Skills Roster)\n\n`;
indexContent += `本百科包含了游戏最新引擎驱动下收录的 **${total} 个战术武将技**。\n`;
indexContent += `所有的技能判定、效果和分类均由底层代码（\`TacticalSkillCatalog.ts\` 和 \`TacticalSkillResolver.ts\`）严格驱动。\n\n`;
indexContent += `## 战术技能（三类六种体系）\n`;
indexContent += `根据底层的 \`getTacticalSixSet\` 和 \`getTacticalTriClass\` 判定逻辑，战术技能的归属采用了“三势六计”判定系统。\n\n`;

const order = ['gongzhan', 'shengzhan', 'dizhan', 'hunzhan', 'bingzhan', 'baizhan'];
for (const key of order) {
    if (!skillsBySet.has(key)) continue;
    const label = SIX_SET_LABEL[key as keyof typeof SIX_SET_LABEL];
    const filename = SET_FILES[key];
    const count = skillsBySet.get(key)!.length;
    indexContent += `- **[[${filename.replace('.md', '')}]]** : ${label} (${count} 技)\n`;
}

fs.writeFileSync(path.join(OUTPUT_DIR, '全武将技名录.md'), indexContent, 'utf-8');
console.log('Generated 全武将技名录.md');
