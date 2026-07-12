import { GENERAL_PROFILES } from '../src/data/GeneralSkills';
import { TACTICAL_SKILL_BY_ID } from '../src/data/TacticalSkillCatalog';
import { ALL_GENERALS } from '../src/data/FactionGenerals';
import fs from 'fs';

const EXCLUSIVE_SKILL_IDS = [
    'ts_004', // 中流击楫
    'ts_012', // 破釜沉舟
    'ts_020', // 济河焚舟
    'ts_052', // 封狼居胥
    'ts_078', // 白衣渡江
    'ts_092', // 痛饮黄龙
    'ts_129', // 象阵摧锋
    'ts_142', // 巨象蹈坚
    'ts_157', // 草木皆兵
    'ts_164', // 火牛奔冲
    'ts_165', // 减灶诱歼
    'ts_171', // 风林火山
    'ts_174', // 却月破骑
    'ts_177', // 卧薪尝胆
    'ts_181', // 雪夜奇袭
    'ts_523', // 象阵扰敌
    'ts_755', // 刮骨疗毒
    'ts_756', // 单刀赴会
    'ts_764', // 减灶诱敌
    'ts_770', // 锦囊妙计
    'ts_771', // 纸上谈兵
    'ts_029', // 肉薄骨并 (火牛陷阵)
    'ts_030', // 借风纵火
];

const results: Record<string, string[]> = {};

// Map general names
const genNameMap: Record<string, string> = {};
// Read FactionGenerals.ts manually to avoid ESM issues
const fgContent = fs.readFileSync('src/data/FactionGenerals.ts', 'utf-8');
const regex = /generalId:\s*'([^']+)',\s*generalName:\s*'([^']+)'/g;
let match;
while ((match = regex.exec(fgContent)) !== null) {
    genNameMap[match[1]] = match[2];
}

for (const skillId of EXCLUSIVE_SKILL_IDS) {
    const skillName = TACTICAL_SKILL_BY_ID[skillId]?.displayName || skillId;
    results[skillName] = [];
    
    for (const [genId, profile] of Object.entries(GENERAL_PROFILES)) {
        if (profile.advantageSkillId === skillId || 
            profile.balanceSkillId === skillId || 
            profile.disadvantageSkillId === skillId || 
            profile.tacticalSkillId === skillId) {
            
            const genName = genNameMap[genId] || genId;
            results[skillName].push(`${genName} (${genId})`);
        }
    }
}

let report = '# 专属历史典故技能核查报告\n\n';
for (const [skillName, generals] of Object.entries(results)) {
    if (generals.length > 0) {
        report += `### 【${skillName}】\n`;
        for (const g of generals) {
            report += `- ${g}\n`;
        }
        report += '\n';
    }
}

fs.writeFileSync('tools/audit_report.md', report);
console.log('Audit completed. Report written to tools/audit_report.md');
