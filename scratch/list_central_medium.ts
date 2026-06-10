import { CITIES_V2 } from '../src/data/cities_v2';
import { getRegion } from '../src/systems/RegionSystem';
import { FACTIONS } from '../src/data/factions';

const mediumCities = CITIES_V2.filter(c => c.type === 'medium_city');
const centralMediumCities = mediumCities.filter(c => getRegion(c.lat, c.lng) === 'CENTRAL');

const factionMap = new Map();
for (const f of FACTIONS) {
    factionMap.set(f.id, f.name);
}

for (const c of centralMediumCities) {
    const flag = factionMap.get(c.factionId) || '未知';
    console.log(`- **${c.name}** (faction: \`${c.factionId}\`) —— 旗号：**【${flag}】**`);
}
