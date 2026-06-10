import { CITIES_V2 } from '../src/data/cities_v2';
import { getCityRegion } from '../src/systems/RegionSystem';

const jiangnanSmallCities = CITIES_V2.filter(c => {
    if (c.type !== 'small_city') return false;
    const region = getCityRegion({
        latitude: c.lat,
        longitude: c.lng,
        region: c.region
    });
    return region === 'JIANGNAN';
});

console.log(`=== 江南文化区 (JIANGNAN) 小城列表 ===`);
console.log(`总计：${jiangnanSmallCities.length} 座\n`);

jiangnanSmallCities.sort((a, b) => b.lat - a.lat).forEach(c => {
    console.log(`- ${c.name} (id: ${c.id}, lat: ${c.lat.toFixed(2)}, lng: ${c.lng.toFixed(2)}) - ${c.note || ''}`);
});
