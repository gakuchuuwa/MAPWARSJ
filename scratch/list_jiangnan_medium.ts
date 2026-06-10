import { CITIES_V2 } from '../src/data/cities_v2';
import { getCityRegion } from '../src/systems/RegionSystem';

const jiangnanMediumCities = CITIES_V2.filter(c => {
    if (c.type !== 'medium_city') return false;
    const region = getCityRegion({
        latitude: c.lat,
        longitude: c.lng,
        region: c.region
    });
    return region === 'JIANGNAN';
});

console.log(`=== 江南文化区 (JIANGNAN) 中城列表 ===`);
console.log(`总计：${jiangnanMediumCities.length} 座\n`);

// Sort by latitude (North to South) or some other criteria, here just id
jiangnanMediumCities.sort((a, b) => b.lat - a.lat).forEach(c => {
    console.log(`- ${c.name} (id: ${c.id}, lat: ${c.lat.toFixed(2)}, lng: ${c.lng.toFixed(2)}) - ${c.note || ''}`);
});
