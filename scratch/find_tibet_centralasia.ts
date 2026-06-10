import { CITIES_V2 } from '../src/data/cities_v2';
import { getRegion } from '../src/systems/RegionSystem';

const smallCities = CITIES_V2.filter(c => c.type === 'small_city');

console.log('--- 青藏 (TIBET) 小城 ---');
for (const c of smallCities) {
    if (getRegion(c.lat, c.lng) === 'TIBET') {
        console.log(`- ${c.name} (${c.id}) - ${c.note || ''}`);
    }
}

console.log('\n--- 中亚 (CENTRAL_ASIA) 小城 ---');
for (const c of smallCities) {
    // Note: getRegion might return CENTRAL for Merv due to bug, but let's check what it returns
    if (getRegion(c.lat, c.lng) === 'CENTRAL_ASIA') {
        console.log(`- ${c.name} (${c.id}) - ${c.note || ''}`);
    }
}
