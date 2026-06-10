import fs from 'fs';
const citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

const regex = /\{\s*id:\s*['"\`]?([a-zA-Z0-9_]+)['"\`]?[^}]*?name:\s*['"\`]([^'"\`]+)['"\`][^}]*?factionId:\s*['"\`]([a-zA-Z0-9_]+)['"\`]/g;

let match;
const panjunCities = [];
const allCities = [];

const lines = citiesStr.split('\n');

// simpler parser
for (const line of lines) {
    if (line.includes('{') && line.includes('id:') && line.includes('factionId:')) {
        const idMatch = line.match(/id:\s*['"]([^'"]+)['"]/);
        const nameMatch = line.match(/name:\s*['"]([^'"]+)['"]/);
        const factionMatch = line.match(/factionId:\s*['"]([^'"]+)['"]/);
        
        if (idMatch && nameMatch && factionMatch) {
            allCities.push({ id: idMatch[1], name: nameMatch[1], factionId: factionMatch[1] });
            if (factionMatch[1] === 'panjun') {
                panjunCities.push(nameMatch[1]);
            }
        }
    }
}

console.log('Total Cities Parsed:', allCities.length);
console.log('Panjun Cities count:', panjunCities.length);
console.log('List of cities without a specific faction (rebel/panjun):');
console.log(panjunCities.join(', '));
