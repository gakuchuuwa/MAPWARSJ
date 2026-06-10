import { CITIES_V2 } from '../src/data/cities_v2';
import { getRegion } from '../src/systems/RegionSystem';

const smallCities = CITIES_V2.filter(c => c.type === 'small_city');

console.log('--- 草原 (STEPPE) 小城 ---');
for (const c of smallCities) {
    if (getRegion(c.lat, c.lng) === 'STEPPE') {
        console.log(`- ${c.name} (${c.id}) - ${c.note || ''}`);
    }
}

console.log('\n--- 西域 (WESTERN) 小城 ---');
for (const c of smallCities) {
    if (getRegion(c.lat, c.lng) === 'WESTERN') {
        console.log(`- ${c.name} (${c.id}) - ${c.note || ''}`);
    }
}
