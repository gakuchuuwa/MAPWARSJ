import { CITIES_V2 } from '../src/data/cities_v2';
import { getRegion } from '../src/systems/RegionSystem';

const mediumCities = CITIES_V2.filter(c => c.type === 'medium_city');
const regions = ['STEPPE', 'WESTERN', 'TIBET', 'CENTRAL_ASIA'];

regions.forEach(region => {
    console.log(`\n--- ${region} 中城 ---`);
    const citiesInRegion = mediumCities.filter(c => getRegion(c.lat, c.lng) === region);
    console.log(`总数: ${citiesInRegion.length}`);
    for (const c of citiesInRegion) {
        console.log(`- ${c.name} (${c.id})`);
    }
});
