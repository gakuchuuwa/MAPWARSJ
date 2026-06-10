import { VECTOR_ROAD_DATA } from '../src/data/VectorRoadData';

let total = 0;
let straight = 0;
const straightRoads: string[] = [];

for (const feature of VECTOR_ROAD_DATA.features) {
    total++;
    if (feature.geometry.coordinates.length === 2) {
        straight++;
        straightRoads.push(feature.properties.name);
    }
}

console.log(`Total roads: ${total}`);
console.log(`Straight roads (2 points): ${straight}`);
console.log(`Names: ${straightRoads.join(', ')}`);
