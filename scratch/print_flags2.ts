import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import { getRegion } from '../src/systems/RegionSystem';

const mediumCities = CITIES_V2.filter(c => c.type === 'medium_city');
const counts: Record<string, typeof mediumCities> = {};

for (const c of mediumCities) {
    const r = c.region || getRegion(c.lat, c.lng);
    if (!counts[r]) counts[r] = [];
    counts[r].push(c);
}

Object.keys(counts).forEach(r => {
    console.log(`\n【${r}】 (${counts[r].length} 城)`);
    counts[r].forEach(c => {
        const f = FACTIONS.find(x => x.id === c.factionId);
        console.log(`  - ${c.name.padEnd(8, ' ')} | 旗号: [${f ? f.name : '未知'}]`);
    });
});
