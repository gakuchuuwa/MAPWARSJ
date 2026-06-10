import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import { getRegion } from '../src/systems/RegionSystem';

const mediumCities = CITIES_V2.filter(c => c.type === 'medium_city');
const regions = [
    'CENTRAL', 'NORTH', 'BASHU', 'HEXI', 
    'NORTHEAST', 'KOREA', 'JAPAN', 
    'STEPPE', 'WESTERN', 'TIBET', 'CENTRAL_ASIA',
    'LINGNAN', 'DIANQIAN'
];

const counts: Record<string, typeof mediumCities> = {};
for (const r of regions) {
    counts[r] = [];
}

let unassignedCount = 0;

for (const c of mediumCities) {
    const region = c.region || getRegion(c.lat, c.lng);
    if (counts[region]) {
        counts[region].push(c);
    } else {
        if (!counts['OTHER']) counts['OTHER'] = [];
        counts['OTHER'].push(c);
    }
}

console.log('--- 80大中城旗号总览 ---');

let total = 0;

for (const r of Object.keys(counts)) {
    const cities = counts[r];
    if (cities.length === 0) continue;
    
    console.log(`\n【${r}】 (${cities.length} 城)`);
    for (const c of cities) {
        const faction = FACTIONS.find(f => f.id === c.factionId);
        const flag = faction ? faction.flag : '无';
        const factionName = faction ? faction.name : '未知';
        console.log(`  - ${c.name.padEnd(8)} | 旗号: [${flag}] (${factionName})`);
        total++;
    }
}

console.log(`\n总计列出 ${total} 座中城。`);
