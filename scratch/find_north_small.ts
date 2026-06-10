import { CITIES_V2 } from '../src/data/cities_v2';
import { getRegion } from '../src/systems/RegionSystem';

const smallCities = CITIES_V2.filter(c => c.type === 'small_city');

console.log('--- 北方 (NORTH) 小城 ---');
for (const c of smallCities) {
    if (getRegion(c.lat, c.lng) === 'NORTH') {
        console.log(`- ${c.name} (${c.id}) - ${c.note || ''}`);
    }
}
