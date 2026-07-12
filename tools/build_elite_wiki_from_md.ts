import fs from 'fs';
import path from 'path';
import { GENERAL_PROFILES, STRATEGIC_SKILL_CATALOG } from '../src/data/GeneralSkills';
import { TACTICAL_SKILL_BY_ID } from '../src/data/TacticalSkillCatalog';

const content = fs.readFileSync('C:/Users/GAKU/Downloads/MAPWAR名册_2026-07-12 (1).md', 'utf-8');
const lines = content.split('\n');
const header = lines.findIndex(l => l.startsWith('| 势力 |'));

// Parse FactionGenerals.ts manually to extract generalId -> generalName mapping
const fgContent = fs.readFileSync(path.join(process.cwd(), 'src/data/FactionGenerals.ts'), 'utf-8');
const nameToGenId: Record<string, string> = {};
const regex = /generalId:\s*'([^']+)',\s*generalName:\s*'([^']+)'/g;
let match;
while ((match = regex.exec(fgContent)) !== null) {
    nameToGenId[match[2]] = match[1];
}

const dataLines = lines.slice(header + 2).filter(l => l.trim().startsWith('|'));

let elitesByTier: Record<string, any[]> = {
    'T0': [],
    'T1': [],
    'T2': [],
    'T3': [],
    'T4': []
};

for (const line of dataLines) {
    const parts = line.split('|').map(s => s.trim());
    if (parts.length >= 11) {
        const faction = parts[1];
        const city = parts[2];
        const flag = parts[4];
        const general = parts[5];
        const tacSkillRaw = parts[7];
        const elite = parts[9];
        const tier = parts[10];
        
        if (elite && elite !== '—' && tier && tier !== '—') {
            if (!elitesByTier[tier]) elitesByTier[tier] = [];
            elitesByTier[tier].push({ faction, city, flag, general, elite, tacSkillRaw });
        }
    }
}

const OUTPUT_DIR = path.join(process.cwd(), '乱斗游戏/04_精锐图鉴');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let indexContent = `# MAPWAR 精锐百科名录\n\n> 数据源自名册导出，按级别分卷记录。\n\n`;

for (const tier of ['T0', 'T1', 'T2', 'T3', 'T4']) {
    const arr = elitesByTier[tier];
    if (!arr || arr.length === 0) continue;
    
    let outContent = `# ${tier} 级精锐 (${arr.length} 支)\n\n`;
    outContent += `> 此卷收录所有 ${tier} 级别精锐部队。\n\n`;
    outContent += `| 势力 | 据点 | 旗号 | 武将 | 精锐部队 | 战略技 | 优势技 | 均势技 | 劣势技 |\n`;
    outContent += `|---|---|---|---|---|---|---|---|---|\n`;
    for (const e of arr) {
        let stratName = '—';
        let advName = '—';
        let balName = '—';
        let disName = '—';
        
        // Use nameToGenId to find the general ID
        const matchedGenId = nameToGenId[e.general];

        if (matchedGenId) {
            const profile = GENERAL_PROFILES[matchedGenId];
            if (profile) {
                if (profile.strategicSkillId && STRATEGIC_SKILL_CATALOG[profile.strategicSkillId]) {
                    const str = STRATEGIC_SKILL_CATALOG[profile.strategicSkillId];
                    stratName = `${str.grid} ${str.displayName}`;
                }
                if (profile.advantageSkillId && TACTICAL_SKILL_BY_ID[profile.advantageSkillId]) {
                    advName = TACTICAL_SKILL_BY_ID[profile.advantageSkillId].displayName;
                }
                if (profile.balanceSkillId && TACTICAL_SKILL_BY_ID[profile.balanceSkillId]) {
                    balName = TACTICAL_SKILL_BY_ID[profile.balanceSkillId].displayName;
                }
                if (profile.disadvantageSkillId && TACTICAL_SKILL_BY_ID[profile.disadvantageSkillId]) {
                    disName = TACTICAL_SKILL_BY_ID[profile.disadvantageSkillId].displayName;
                }
            }
        }
        
        outContent += `| ${e.faction} | ${e.city} | ${e.flag} | ${e.general} | ${e.elite} | ${stratName} | ${advName} | ${balName} | ${disName} |\n`;
    }
    
    const filename = `精锐_${tier}.md`;
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), outContent, 'utf-8');
    console.log(`Generated 乱斗游戏/04_精锐图鉴/${filename}`);
    
    indexContent += `- **[[${filename.replace('.md', '')}]]** : 共 ${arr.length} 支\n`;
}

// Write an index file
fs.writeFileSync(path.join(OUTPUT_DIR, '精锐百科_主目录.md'), indexContent, 'utf-8');
console.log('Generated 乱斗游戏/04_精锐图鉴/精锐百科_主目录.md');
