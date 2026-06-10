const fs = require('fs');

// Read cities
const citiesFile = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const cityRegex = /{[\s\S]*?id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?type:\s*'([^']+)'[\s\S]*?}/g;
let match;
const cities = {};
while ((match = cityRegex.exec(citiesFile)) !== null) {
    cities[match[1]] = { name: match[2], type: match[3] };
}

// Check roads
const roadsFile = fs.readFileSync('src/data/VectorRoadData.ts', 'utf8');
const roadRegex = /startConnection:\s*"([^"]+)"[\s\S]*?endConnection:\s*"([^"]+)"/g;
let rMatch;
const connections = [];

while ((rMatch = roadRegex.exec(roadsFile)) !== null) {
    const c1 = rMatch[1];
    const c2 = rMatch[2];
    connections.push([c1, c2]);
}

const results = [];
for (const [c1, c2] of connections) {
    const city1 = cities[c1];
    const city2 = cities[c2];
    if (!city1 || !city2) continue;

    // Notice: cities_v2 type might be 'medium_city' or 'medium'
    const isMedium = (type) => type === 'medium_city' || type === 'medium';
    
    if (city1.type === 'big_city' && isMedium(city2.type)) {
        results.push(city1.name + ' (大城) <-> ' + city2.name + ' (中城)');
    }
    if (city2.type === 'big_city' && isMedium(city1.type)) {
        results.push(city2.name + ' (大城) <-> ' + city1.name + ' (中城)');
    }
}

console.log('Results:');
if (results.length === 0) {
    console.log('无连接');
} else {
    console.log([...new Set(results)].join('\n'));
}
