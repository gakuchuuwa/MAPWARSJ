const fs = require('fs');

const gameAppSrc = fs.readFileSync('c:/MAPWARSJ/src/app/GameApp.ts', 'utf8');
const capitalsMatch = [...gameAppSrc.matchAll(/'([^']+)':\s*'([^']+)'/g)];
const capitals = capitalsMatch.filter(m => m[1] !== 'panjun').map(m => ({ factionId: m[1], cityId: m[2] }));

const citiesSrc = fs.readFileSync('c:/MAPWARSJ/src/data/cities_v2.ts', 'utf8');
const citiesRegex = /id:\s*'([^']+)',\s*name:\s*'[^']+',\s*factionId:\s*'([^']+)'/g;
const citiesMatch = [...citiesSrc.matchAll(citiesRegex)];
const cityFactionMap = {};
citiesMatch.forEach(m => {
    cityFactionMap[m[1]] = m[2];
});

// For cities that don't match the regex (maybe properties in different order)
// we'll try a fallback
const cityRegex2 = /id:\s*'([^']+)'[\s\S]*?factionId:\s*'([^']+)'/g;
const citiesMatch2 = [...citiesSrc.matchAll(cityRegex2)];
citiesMatch2.forEach(m => {
    // Only set if not already set, to avoid cross-object matching if possible, though [\s\S]*? is risky
    if (!cityFactionMap[m[1]]) {
        // Validate it's within the same object
        const textBetween = m[0];
        if (!textBetween.includes('}')) {
            cityFactionMap[m[1]] = m[2];
        }
    }
});

const mismatches = [];

capitals.forEach(cap => {
    const cityFaction = cityFactionMap[cap.cityId];
    if (cityFaction && cityFaction !== cap.factionId) {
        // Only report if it's explicitly 'panjun' in cities_v2 but has a real faction in GameApp
        // Or if they are completely different valid factions
        mismatches.push(cap.cityId + ': STARTING_CAPITALS has ' + cap.factionId + ', cities_v2 has ' + cityFaction);
    }
    if (!cityFaction) {
        // Find manually in file
        const idx = citiesSrc.indexOf(cap.cityId);
        if (idx !== -1) {
            const block = citiesSrc.substring(idx, idx + 200);
            const facMatch = block.match(/factionId:\s*'([^']+)'/);
            if (facMatch) {
                const foundFac = facMatch[1];
                if (foundFac !== cap.factionId) {
                    mismatches.push(cap.cityId + ' (manual search): STARTING_CAPITALS has ' + cap.factionId + ', cities_v2 has ' + foundFac);
                }
            } else {
                 mismatches.push(cap.cityId + ' (manual search): factionId NOT FOUND in block: ' + block.replace(/\n/g, ' '));
            }
        } else {
             mismatches.push(cap.cityId + ': CITY NOT FOUND in cities_v2.ts');
        }
    }
});
console.log('--- START MISMATCHES ---');
console.log(mismatches.join('\n'));
console.log('--- END MISMATCHES ---');
