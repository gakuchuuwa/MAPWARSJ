const fs = require('fs');
let content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const cityString = "    { id: 'city_pennuli', name: '盆奴里', factionId: 'nifuhe', lat: 47.650566, lng: 130.957031, type: 'small_city', troops: 5000 }\n];";
content = content.replace(/\n\s*\];\s*$/, '\n' + cityString);
fs.writeFileSync('src/data/cities_v2.ts', content, 'utf-8');
console.log('Restored Pennuli and added nifuhe!');
