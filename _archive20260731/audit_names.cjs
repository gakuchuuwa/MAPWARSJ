const fs = require('fs');
const path = require('path');
const dataDir = './src/data';

// 1. Load Factions
const factionsContent = fs.readFileSync(path.join(dataDir, 'factions.ts'), 'utf-8');
const factionIdToName = {};
const regexFactions = /id:\s*'([^']+)',\s*name:\s*'([^']+)'/g;
let match;
while ((match = regexFactions.exec(factionsContent)) !== null) {
    factionIdToName[match[1]] = match[2];
}

// 2. Load Cities
const citiesContent = fs.readFileSync(path.join(dataDir, 'cities_v2.ts'), 'utf-8');
const cityIdToName = {};
const regexCities = /id:\s*'([^']+)',\s*name:\s*'([^']+)'/g;
while ((match = regexCities.exec(citiesContent)) !== null) {
    cityIdToName[match[1]] = match[2];
}

// 3. Load Capitals mapping (factionId -> cityId)
const capitalsContent = fs.readFileSync(path.join(dataDir, 'StartingCapitals.ts'), 'utf-8');
const factionToCity = {};
const regexCapitals = /'([^']+)':\s*'([^']+)'/g;
while ((match = regexCapitals.exec(capitalsContent)) !== null) {
    factionToCity[match[1]] = match[2];
}

console.log('--- 势力名称与据点名称重复检查 ---');
let duplicateCount = 0;
for (const [factionId, cityId] of Object.entries(factionToCity)) {
    if (factionId === 'panjun') continue;
    
    const factionName = factionIdToName[factionId];
    const cityName = cityIdToName[cityId];
    
    if (factionName && cityName && factionName === cityName) {
        console.log(`[冲突违规] 底层ID: ${factionId} | 势力名: [${factionName}] == 据点名: [${cityName}]`);
        duplicateCount++;
    }
}

console.log(`\n总计发现 ${duplicateCount} 处势力名与据点名完全重复的违规项。`);
