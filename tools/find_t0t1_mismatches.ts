import { GENERAL_PROFILES } from '../src/data/GeneralSkills';
import { TACTICAL_SKILL_BY_ID, getTacticalTriClass, TRI_CLASS_LABEL } from '../src/data/TacticalSkillCatalog';
import fs from 'fs';

// 专属技能及其真正的历史主人
const EXCLUSIVE_MAPPING: Record<string, string[]> = {
    'ts_004': ['jin_zuti'], // 中流击楫
    'ts_012': ['xichu_xiangyu'], // 破釜沉舟
    'ts_020': ['jin_xianzhen'], // 济河焚舟
    'ts_052': ['suzhou_huoqubing'], // 封狼居胥
    'ts_078': ['wuwu_d_lvmeng'], // 白衣渡江
    'ts_092': ['yanchuan_d_yuefei'], // 痛饮黄龙
    'ts_129': ['elephant', 'zhenla', 'dongyu', 'zhancheng', 'xinxing'], // 象阵摧锋
    'ts_142': ['elephant', 'zhenla', 'dongyu', 'zhancheng', 'xinxing'], // 巨象蹈坚
    'ts_157': ['qianqin_fujian'], // 草木皆兵 (苻坚的恐惧)
    'ts_164': ['jiaodong_tiandan'], // 火牛奔冲
    'ts_165': ['dongxian_sunbin'], // 减灶诱歼
    'ts_171': ['kai_wutianxinxuan'], // 风林火山
    'ts_174': ['wang_d_liuyu'], // 却月破骑
    'ts_177': ['yue_goujian'], // 卧薪尝胆
    'ts_181': ['dingxiang_d_lijing'], // 雪夜奇袭
    'ts_523': ['elephant', 'pagan', 'dongyu'], // 象阵扰敌
    'ts_755': ['chu_guanyu'], // 刮骨疗毒
    'ts_756': ['chu_guanyu', 'wuwu_d_lusu'], // 单刀赴会
    'ts_764': ['dongxian_sunbin'], // 减灶诱敌
    'ts_770': ['shu_zhugeliang'], // 锦囊妙计
    'ts_771': ['zhao_kuo'], // 纸上谈兵
    'ts_029': ['jiaodong_tiandan'], // 肉薄骨并
};

// 1. 获取 T0 和 T1 武将ID
const content = fs.readFileSync('C:/Users/GAKU/Downloads/MAPWAR名册_2026-07-12 (1).md', 'utf-8');
const lines = content.split('\n');
const header = lines.findIndex(l => l.startsWith('| 势力 |'));

const fgContent = fs.readFileSync('src/data/FactionGenerals.ts', 'utf-8');
const nameToGenId: Record<string, string> = {};
const regex = /generalId:\s*'([^']+)',\s*generalName:\s*'([^']+)'/g;
let match;
while ((match = regex.exec(fgContent)) !== null) {
    nameToGenId[match[2]] = match[1];
}

const t0t1Generals = new Set<string>();
const genTier: Record<string, string> = {};

for (const line of lines.slice(header + 2)) {
    if (!line.trim().startsWith('|')) continue;
    const parts = line.split('|').map(s => s.trim());
    if (parts.length >= 10) {
        const genName = parts[5];
        const tier = parts[10];
        if (tier === 'T0' || tier === 'T1') {
            const genId = nameToGenId[genName];
            if (genId) {
                t0t1Generals.add(genId);
                genTier[genId] = tier;
            } else {
                console.log(`Warning: General ${genName} not found in FactionGenerals!`);
            }
        }
    }
}

// 2. 检查 T0/T1 的错配
let report = '# T0 & T1 专属典故错配清单\n\n';
for (const genId of Array.from(t0t1Generals)) {
    const profile = GENERAL_PROFILES[genId];
    if (!profile) continue;
    const tier = genTier[genId];
    const genName = Object.keys(nameToGenId).find(k => nameToGenId[k] === genId) || genId;
    
    const checkSkill = (skillId: string, slotName: string) => {
        if (!skillId) return;
        if (EXCLUSIVE_MAPPING[skillId]) {
            // Is this general allowed?
            // checking simple id match. Some elephant checks might need faction logic, but for simplicity we check if genId is in allowed list.
            const allowed = EXCLUSIVE_MAPPING[skillId].includes(genId) || EXCLUSIVE_MAPPING[skillId].some(a => genId.includes(a));
            if (!allowed) {
                const s = TACTICAL_SKILL_BY_ID[skillId];
                const tri = getTacticalTriClass(s);
                report += `- **${genName} (${tier})** 错误装备了【${s.displayName}】(${slotName})\n`;
                report += `  - 需替换为同类【${TRI_CLASS_LABEL[tri]}】\n`;
            }
        }
    };

    checkSkill(profile.advantageSkillId, '优势技');
    checkSkill(profile.balanceSkillId, '均势技');
    checkSkill(profile.disadvantageSkillId, '劣势技');
    checkSkill(profile.tacticalSkillId, '战术技');
}

fs.writeFileSync('tools/t0t1_mismatch.md', report);
console.log('T0/T1 mismatches dumped.');
