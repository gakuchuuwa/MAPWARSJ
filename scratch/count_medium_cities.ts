import { CITIES_V2 } from '../src/data/cities_v2';
import { getRegion, REGION_LABELS } from '../src/systems/RegionSystem';

const mediumCities = CITIES_V2.filter(c => c.type === 'medium_city');
const regionCounts: Record<string, number> = {};

for (const c of mediumCities) {
    const r = getRegion(c.lat, c.lng);
    const label = REGION_LABELS[r];
    if (!regionCounts[label]) {
        regionCounts[label] = 0;
    }
    regionCounts[label]++;
}

console.log(`Total Medium Cities: ${mediumCities.length}`);
for (const [label, count] of Object.entries(regionCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`${label}: ${count}`);
}
