const fs = require('fs');

const cityToAdd = { id: 'city_juyansai', name: '居延塞', factionId: 'weiming', lat: 41.8942, lng: 101.0440, type: 'small_city', troops: 5000 };

let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const cityAddStr = `    { id: '${cityToAdd.id}', name: '${cityToAdd.name}', factionId: '${cityToAdd.factionId}', lat: ${cityToAdd.lat}, lng: ${cityToAdd.lng}, type: '${cityToAdd.type}', troops: ${cityToAdd.troops} },`;

citiesStr = citiesStr.replace(/];\s*$/, `,\n${cityAddStr}\n];`);
// Fix any potential missing commas just in case
citiesStr = citiesStr.replace(/}([\s]*){ id:/g, '},$1{ id:');
citiesStr = citiesStr.replace(/},\r?\n,\r?\n\s*{/g, '},\n    {');

fs.writeFileSync('src/data/cities_v2.ts', citiesStr, 'utf-8');
console.log('Successfully added 居延塞!');
