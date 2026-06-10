import { CITIES_V2 } from './src/data/cities_v2';

const bigCities = CITIES_V2.filter(c => c.type === 'big_city');
const mediumCities = CITIES_V2.filter(c => c.type === 'medium_city');

console.log('大城数量:', bigCities.length);
console.log('中城数量:', mediumCities.length);

console.log('\n大城周围最近的3个中城（直线距离估算）：');
for (const bc of bigCities) {
    const nearby = mediumCities
        .map(mc => {
            const dx = mc.lat - bc.lat;
            const dy = mc.lng - bc.lng;
            // 简单估算：1度约111公里
            const dist = Math.sqrt(dx*dx + dy*dy) * 111; 
            return { city: mc, dist };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3); // 取最近的3个

    const nearbyStr = nearby.map(n => `${n.city.name}(${n.dist.toFixed(0)}km)`).join(', ');
    console.log(`- ${bc.name}: ${nearbyStr}`);
}

const nearbyThresholdKm = 200; // 定义“周围”的半径，例如200公里
console.log(`\n\n大城周围 ${nearbyThresholdKm}km 以内的中城：`);
for (const bc of bigCities) {
    const nearby = mediumCities
        .map(mc => {
            const dx = mc.lat - bc.lat;
            const dy = mc.lng - bc.lng;
            const dist = Math.sqrt(dx*dx + dy*dy) * 111; 
            return { city: mc, dist };
        })
        .filter(n => n.dist <= nearbyThresholdKm)
        .sort((a, b) => a.dist - b.dist);

    if (nearby.length > 0) {
        const nearbyStr = nearby.map(n => `${n.city.name}(${n.dist.toFixed(0)}km)`).join(', ');
        console.log(`- ${bc.name}: 有 ${nearby.length} 个 -> ${nearbyStr}`);
    } else {
        console.log(`- ${bc.name}: 无（最近的是 ${mediumCities.map(mc => { const dx = mc.lat - bc.lat; const dy = mc.lng - bc.lng; return { city: mc, dist: Math.sqrt(dx*dx + dy*dy) * 111 }; }).sort((a,b)=>a.dist-b.dist)[0].city.name}, 距离 ${(Math.sqrt(Math.pow(mediumCities.map(mc => { const dx = mc.lat - bc.lat; const dy = mc.lng - bc.lng; return { city: mc, dist: Math.sqrt(dx*dx + dy*dy) * 111 }; }).sort((a,b)=>a.dist-b.dist)[0].city.lat - bc.lat, 2) + Math.pow(mediumCities.map(mc => { const dx = mc.lat - bc.lat; const dy = mc.lng - bc.lng; return { city: mc, dist: Math.sqrt(dx*dx + dy*dy) * 111 }; }).sort((a,b)=>a.dist-b.dist)[0].city.lng - bc.lng, 2)) * 111).toFixed(0)}km)`);
    }
}
