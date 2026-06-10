import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./close_cities_report.json', 'utf-8'));

let citiesContent = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');

const GENERIC_FACTIONS = ['panjun', 'none'];

let singleFactions = [];
let noFactions = [];

data.forEach(pair => {
    const f1 = pair.city1.factionId;
    const f2 = pair.city2.factionId;
    const isGeneric1 = GENERIC_FACTIONS.includes(f1);
    const isGeneric2 = GENERIC_FACTIONS.includes(f2);
    
    if (!isGeneric1 && !isGeneric2) {
        // Double factions - do not touch
    } else if (isGeneric1 && isGeneric2) {
        noFactions.push(pair);
    } else {
        singleFactions.push(pair);
    }
});

const toRemoveIds = new Set<string>();

singleFactions.forEach(pair => {
    const remove = GENERIC_FACTIONS.includes(pair.city1.factionId) ? pair.city1 : pair.city2;
    toRemoveIds.add(remove.id);
});

noFactions.forEach(pair => {
    let remove;
    if (pair.city1.tier < pair.city2.tier) {
        remove = pair.city2;
    } else if (pair.city2.tier < pair.city1.tier) {
        remove = pair.city1;
    } else {
        remove = pair.city2; // Tie
    }
    toRemoveIds.add(remove.id);
});

console.log('Will remove ' + toRemoveIds.size + ' cities.');

// Read the cities file and extract city data
const regex = /\{\s*id:\s*['"]([^'"]+)['"][\s\S]*?\}(?:,\s*)?/g;

let match;
let newContent = '';
let lastIndex = 0;

let removedCount = 0;

while ((match = regex.exec(citiesContent)) !== null) {
    const id = match[1];
    
    if (toRemoveIds.has(id)) {
        // Skip this city
        newContent += citiesContent.substring(lastIndex, match.index);
        lastIndex = regex.lastIndex;
        removedCount++;
    }
}

newContent += citiesContent.substring(lastIndex);

fs.writeFileSync('./src/data/cities_v2.ts', newContent, 'utf-8');
console.log('Removed ' + removedCount + ' cities.');
