const fs = require('fs');

const EXCLUSIVE_MAPPING = {
    'ts_004': ['jin_zuti'],
    'ts_012': ['xichu_xiangyu'],
    'ts_020': ['jin_xianzhen'],
    'ts_052': ['suzhou_huoqubing'],
    'ts_078': ['wuwu_d_lvmeng'],
    'ts_092': ['yanchuan_d_yuefei'],
    'ts_129': ['elephant', 'zhenla', 'dongyu', 'zhancheng', 'xinxing'],
    'ts_142': ['elephant', 'zhenla', 'dongyu', 'zhancheng', 'xinxing', 'hantawadi'],
    'ts_157': ['qianqin_fujian', 'shou_xiexuan'],
    'ts_164': ['jiaodong_tiandan'],
    'ts_165': ['dongxian_sunbin'],
    'ts_171': ['kai_wutianxinxuan'],
    'ts_174': ['wang_d_liuyu'],
    'ts_177': ['yue_goujian'],
    'ts_181': ['dingxiang_d_lijing'],
    'ts_523': ['elephant', 'pagan', 'dongyu', 'hantawadi'],
    'ts_755': ['chu_guanyu'],
    'ts_756': ['chu_guanyu', 'wuwu_d_lusu'],
    'ts_764': ['dongxian_sunbin'],
    'ts_770': ['shu_zhugeliang'],
    'ts_771': ['zhao_kuo'],
    'ts_029': ['jiaodong_tiandan'],
};

const tsContent = fs.readFileSync('src/data/TacticalSkillCatalog.ts', 'utf-8');
const skillNames = {};
const skillDescs = {};
const skillRegex = /id:\s*'([^']+)',.*?displayName:\s*'([^']+)',.*?description:\s*'([^']+)'/gs;
let match2;
while ((match2 = skillRegex.exec(tsContent)) !== null) {
    skillNames[match2[1]] = match2[2];
    skillDescs[match2[1]] = match2[3];
}

const fgContent = fs.readFileSync('src/data/FactionGenerals.ts', 'utf-8');
const nameToGenId = {};
const regex = /generalId:\s*'([^']+)',\s*generalName:\s*'([^']+)'/g;
let match;
while ((match = regex.exec(fgContent)) !== null) {
    nameToGenId[match[2]] = match[1];
}
const idToName = {};
for (const k in nameToGenId) {
    idToName[nameToGenId[k]] = k;
}

const content = fs.readFileSync('C:/Users/GAKU/Downloads/MAPWAR名册_2026-07-12 (1).md', 'utf-8');
const lines = content.split('\n');
const header = lines.findIndex(l => l.startsWith('| 势力 |'));

const t4Generals = new Set();
const t4Names = {};
for (const line of lines.slice(header + 2)) {
    if (!line.trim().startsWith('|')) continue;
    const parts = line.split('|').map(s => s.trim());
    if (parts.length >= 10 && parts[10] === 'T4') {
        const genName = parts[5];
        const genId = nameToGenId[genName];
        if (genId) {
            t4Generals.add(genId);
            t4Names[genId] = genName;
        }
    }
}

const gsContent = fs.readFileSync('src/data/GeneralSkills.ts', 'utf-8');
const gsRegex = /([a-zA-Z0-9_]+):\s*{.*?tacticalSkillId:\s*'([^']+)'.*?(?:advantageSkillId:\s*'([^']+)'.*?)?(?:balanceSkillId:\s*'([^']+)'.*?)?(?:disadvantageSkillId:\s*'([^']+)'.*?)?}/gs;
const profiles = {};
let match3;
while ((match3 = gsRegex.exec(gsContent)) !== null) {
    profiles[match3[1]] = {
        tac: match3[2],
        adv: match3[3],
        bal: match3[4],
        dis: match3[5]
    };
}

let out = '# T4 武将专属神装越权查处报告\n\n';
let mismatches = 0;

for (const genId of Array.from(t4Generals)) {
    const profile = profiles[genId];
    if (!profile) continue;
    
    const checkSkill = (skillId, slot) => {
        if (!skillId) return;
        const sName = skillNames[skillId];
        const desc = skillDescs[skillId];
        if (!sName) return;
        
        let isMismatch = false;
        if (EXCLUSIVE_MAPPING[skillId]) {
            const allowed = EXCLUSIVE_MAPPING[skillId].includes(genId) || EXCLUSIVE_MAPPING[skillId].some(a => genId.includes(a));
            if (!allowed) isMismatch = true;
        } else if (desc && (desc.includes('专属') || desc.includes('典故'))) {
            if (!desc.includes(t4Names[genId]) && !desc.includes(genId)) {
                isMismatch = true;
            }
        }
        
        if (isMismatch) {
            out += `- **${t4Names[genId]}** (T4) 错误持有了: 【${sName}】 (${slot}) -> 描述: ${desc || '无'}\n`;
            mismatches++;
        }
    };
    
    checkSkill(profile.adv, '优势技');
    checkSkill(profile.bal, '均势技');
    checkSkill(profile.dis, '劣势技');
    checkSkill(profile.tac, '战术技');
}

out += `\n总计发现 ${mismatches} 处 T4 级别越权配置。\n`;
fs.writeFileSync('C:/Users/GAKU/.gemini/antigravity/brain/28d1eb5e-ad88-45e0-806c-3cb19e09c128/t4_mismatches_report.md', out, 'utf-8');
console.log('T4 扫描完成，发现疑点:', mismatches);
