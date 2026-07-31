const fs = require('fs');
let content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const oldAngkor = "{ id: 'city_angkor', name: '吴哥', factionId: 'gaomian', lat: 13.41, lng: 103.86, type: 'small_city', troops: 5000 },";
const newAngkor = "{ id: 'city_angkor', name: '吴哥', factionId: 'gaomian', lat: 13.41, lng: 103.86, type: 'big_city', troops: 20000 },";
const oldDupan = "{ id: 'city_dupan', name: '阇槃', factionId: 'champa', lat: 13.93, lng: 109.11, type: 'small_city', troops: 5000 },";
const newDupan = "{ id: 'city_dupan', name: '阇槃', factionId: 'champa', lat: 13.93, lng: 109.11, type: 'medium_city', troops: 10000, tier: 1 },";

content = content.replace(oldAngkor, newAngkor);
content = content.replace(oldDupan, newDupan);

fs.writeFileSync('src/data/cities_v2.ts', content, 'utf-8');
console.log('Upgraded Angkor and Dupan');
