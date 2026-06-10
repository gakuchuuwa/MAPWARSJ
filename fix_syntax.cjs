const fs = require('fs');
let content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');

// Ensure pennuli exists
if (!content.includes('city_pennuli')) {
    const pennuliCity = "    { id: 'city_pennuli', name: '盆奴里', factionId: 'nifuhe', lat: 47.650566, lng: 130.957031, type: 'small_city', troops: 5000 },\n];";
    content = content.replace(/];\s*$/, pennuliCity);
}

// Ensure proper commas between ALL closing braces before another opening brace
content = content.replace(/}([\s]*){ id:/g, '},$1{ id:');

fs.writeFileSync('src/data/cities_v2.ts', content, 'utf-8');
console.log('Fixed pennuli and ALL commas!');
