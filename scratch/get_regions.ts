import { CITIES_V2 } from '../src/data/cities_v2';
import { getRegion, REGION_LABELS } from '../src/systems/RegionSystem';

const bigCities = CITIES_V2.filter(c => c.type === 'big_city');
for (const c of bigCities) {
    const r = getRegion(c.lat, c.lng);
    console.log(`${c.name}: ${REGION_LABELS[r]} (${r})`);
}
