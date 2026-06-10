import { CITIES_V2 } from '../src/data/cities_v2';
import { getRegion } from '../src/systems/RegionSystem';

const mediumCities = CITIES_V2.filter(c => c.type === 'medium_city');
const regions = [
    'CENTRAL', 'NORTH', 'SOUTH', 'BASHU', 'LINGNAN', 'HEXI', 
    'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'WESTERN', 
    'TIBET', 'DIANQIAN', 'CENTRAL_ASIA'
];

const counts: Record<string, number> = {};

for (const r of regions) {
    counts[r] = 0;
}

for (const c of mediumCities) {
    // some cities explicitly have region defined on them, use that first if exist, otherwise use getRegion
    const region = c.region || getRegion(c.lat, c.lng);
    if (counts[region] !== undefined) {
        counts[region]++;
    }
}

console.log('--- 各大区中城数量汇总 ---');
for (const r of regions) {
    console.log(`${r.padEnd(15)}: ${counts[r]} 个`);
}

// Optionally, let's also list the Bashu ones since they were heavily modified, and any region that's not exactly 5 just to be sure.
