import { CITIES_V2 } from './src/data/cities_v2';
import { VECTOR_ROAD_DATA } from './src/data/VectorRoadData';

const bigCities = CITIES_V2.filter(c => c.type === 'big_city');
const mediumCities = new Set(CITIES_V2.filter(c => c.type === 'medium_city').map(c => c.id));
const cityMap = new Map(CITIES_V2.map(c => [c.id, c]));

// Build adjacency list for cities
const adj = new Map<string, Set<string>>();

for (const feature of VECTOR_ROAD_DATA.features) {
    const start = feature.properties.startConnection;
    const end = feature.properties.endConnection;
    if (start && end) {
        if (!adj.has(start)) adj.set(start, new Set());
        if (!adj.has(end)) adj.set(end, new Set());
        adj.get(start)!.add(end);
        adj.get(end)!.add(start);
    }
}

console.log('大城数量:', bigCities.length);
console.log('\n--- 20个大城，以及与它们【有道路直接相连】的中城 ---');

let noMediumCityBigCities = [];

for (const bc of bigCities) {
    const neighbors = Array.from(adj.get(bc.id) || []);
    
    // Filter for medium cities
    const mediumNeighbors = neighbors
        .filter(nid => mediumCities.has(nid))
        .map(nid => cityMap.get(nid)!.name);

    if (mediumNeighbors.length > 0) {
        console.log(`✅ [${bc.name}] 直接相连的中城有 ${mediumNeighbors.length} 个: ${mediumNeighbors.join(', ')}`);
    } else {
        noMediumCityBigCities.push(bc.name);
        
        // Let's also print ALL neighbors to see what it connects to
        const allNeighbors = neighbors.map(nid => {
            const city = cityMap.get(nid);
            return city ? `${city.name}(${city.type})` : nid;
        });
        console.log(`❌ [${bc.name}] 周围没有直连的中城。 (它的所有直连城市: ${allNeighbors.join(', ') || '无'})`);
    }
}

console.log('\n================================');
console.log(`总结：这 ${noMediumCityBigCities.length} 个大城周围【没有】中城与其直接相连：`);
console.log(noMediumCityBigCities.join(', '));

