const fs = require('fs');
const path = require('path');
const dataDir = './src/data';

const targetFactions = [
    'jiujiang', 'zaoyang_d', 'kang', 'wuzhumuqin', 'niang', 
    'qiong', 'wei2', 'fanyanna', 'xingxingxia'
];

const generalsContent = fs.readFileSync(path.join(dataDir, 'FactionGenerals.ts'), 'utf-8');
const legionsFiles = fs.readdirSync(dataDir).filter(f => f.includes('Legions.ts') || f === 'legions.ts');

const results = {};

for (const fId of targetFactions) {
    results[fId] = { general: '无', elite: '无' };
    
    // Find general
    const regex = new RegExp(`${fId}:\\s*{\\s*generalId:\\s*'[^']+',\\s*generalName:\\s*'([^']+)'`, 'm');
    const match = regex.exec(generalsContent);
    if (match) {
        results[fId].general = match[1];
    }
    
    // Find elite
    for (const file of legionsFiles) {
        const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
        // Match things like `jiujiang: { name: 'xxx', tier: x }`
        const eliteRegex = new RegExp(`${fId}:\\s*{\\s*name:\\s*'([^']+)'(?:.*?tier:\\s*(\\d))?`, 'm');
        const eliteMatch = eliteRegex.exec(content);
        if (eliteMatch) {
            results[fId].elite = eliteMatch[1] + (eliteMatch[2] ? ` (T${eliteMatch[2]})` : '');
            break;
        }
    }
}

console.log(JSON.stringify(results, null, 2));
