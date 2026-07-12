import fs from 'fs';
import { GENERAL_PROFILES } from '../src/data/GeneralSkills';
import { TACTICAL_SKILL_BY_ID } from '../src/data/TacticalSkillCatalog';

const EXCLUSIVE_MAPPING: Record<string, string[]> = {
    'ts_004': ['jin_zuti'], // 中流击楫
    'ts_012': ['xichu_xiangyu'], // 破釜沉舟
    'ts_020': ['jin_xianzhen'], // 济河焚舟
    'ts_052': ['suzhou_huoqubing'], // 封狼居胥
    'ts_078': ['wuwu_d_lvmeng'], // 白衣渡江
    'ts_092': ['yanchuan_d_yuefei'], // 痛饮黄龙
    'ts_129': ['elephant', 'zhenla', 'dongyu', 'zhancheng', 'xinxing'], // 象阵摧锋
    'ts_142': ['elephant', 'zhenla', 'dongyu', 'zhancheng', 'xinxing', 'hantawadi'], // 巨象蹈坚
    'ts_157': ['qianqin_fujian', 'shou_xiexuan'], // 草木皆兵 
    'ts_164': ['jiaodong_tiandan'], // 火牛奔冲
    'ts_165': ['dongxian_sunbin'], // 减灶诱歼
    'ts_171': ['kai_wutianxinxuan'], // 风林火山
    'ts_174': ['wang_d_liuyu'], // 却月破骑
    'ts_177': ['yue_goujian'], // 卧薪尝胆
    'ts_181': ['dingxiang_d_lijing'], // 雪夜奇袭
    'ts_523': ['elephant', 'pagan', 'dongyu', 'hantawadi'], // 象阵扰敌
    'ts_755': ['chu_guanyu'], // 刮骨疗毒
    'ts_756': ['chu_guanyu', 'wuwu_d_lusu'], // 单刀赴会
    'ts_764': ['dongxian_sunbin'], // 减灶诱敌
    'ts_770': ['shu_zhugeliang'], // 锦囊妙计
    'ts_771': ['zhao_kuo'], // 纸上谈兵
    'ts_029': ['jiaodong_tiandan'], // 肉薄骨并
};

// Also load the recent T0-specific skills just to be thorough
const txt = fs.readFileSync('tools/all_skills.txt', 'utf-8');
const lines = txt.split('\n');
for (const line of lines) {
    if (line.includes('专属') || line.includes('典故')) {
        const parts = line.split('|');
        if (parts.length > 0) {
            const skillId = parts[0].trim();
            if (!EXCLUSIVE_MAPPING[skillId] && skillId.startsWith('ts_')) {
                // If we don't have it explicitly mapped, it might be heavily exclusive.
                // We'll skip auto-adding to mapping for now to avoid false positives,
                // but we know EXCLUSIVE_MAPPING above covers the most famous ones.
            }
        }
    }
}

const content = fs.readFileSync('C:/Users/GAKU/Downloads/MAPWAR名册_2026-07-12 (1).md', 'utf-8');
const mdLines = content.split('\n');
const header = mdLines.findIndex(l => l.startsWith('| 势力 |'));

const fgContent = fs.readFileSync('src/data/FactionGenerals.ts', 'utf-8');
const nameToGenId: Record<string, string> = {};
const regex = /generalId:\s*'([^']+)',\s*generalName:\s*'([^']+)'/g;
let match;
while ((match = regex.exec(fgContent)) !== null) {
    nameToGenId[match[2]] = match[1];
}

const t0t1Generals = new Set<string>();

for (const line of mdLines.slice(header + 2)) {
    if (!line.trim().startsWith('|')) continue;
    const parts = line.split('|').map(s => s.trim());
    if (parts.length >= 10) {
        const genName = parts[5];
        const tier = parts[10];
        
        if (tier === 'T0' || tier === 'T1') {
            const genId = nameToGenId[genName];
            if (genId) {
                t0t1Generals.add(genId);
            }
        }
    }
}

let mismatches = 0;
let output = '# 越权专属技能分析报告（T2-T4及普通武将）\n\n';

for (const [genId, profile] of Object.entries(GENERAL_PROFILES)) {
    // Skip T0/T1
    if (t0t1Generals.has(genId)) continue;
    
    const genName = Object.keys(nameToGenId).find(k => nameToGenId[k] === genId) || genId;
    
    const checkSkill = (skillId: string | undefined, slotName: string) => {
        if (!skillId) return;
        if (EXCLUSIVE_MAPPING[skillId]) {
            const allowed = EXCLUSIVE_MAPPING[skillId].includes(genId) || EXCLUSIVE_MAPPING[skillId].some(a => genId.includes(a));
            if (!allowed) {
                const s = TACTICAL_SKILL_BY_ID[skillId];
                output += `- **${genName}** 错误持有了神装：【${s ? s.displayName : skillId}】 (${slotName})\n`;
                mismatches++;
            }
        }
    };

    checkSkill(profile.advantageSkillId, '优势技');
    checkSkill(profile.balanceSkillId, '均势技');
    checkSkill(profile.disadvantageSkillId, '劣势技');
    checkSkill(profile.tacticalSkillId, '战术技');
}

output += `\n总计发现 ${mismatches} 处越权配置。`;
fs.writeFileSync('C:/Users/GAKU/.gemini/antigravity/brain/28d1eb5e-ad88-45e0-806c-3cb19e09c128/exclusive_skills_mismatches_report.md', output, 'utf-8');
console.log(`分析完成，发现 ${mismatches} 处错误，已写入报告。`);
