const fs = require('fs');
const content = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const cities = [];
const blocks = content.split(/id:\s*['"]/);
for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const nameMatch = block.match(/name:\s*['"]([^'"]+)['"]/);
    const latMatch = block.match(/lat:\s*([-\d.]+)/);
    const lngMatch = block.match(/lng:\s*([-\d.]+)/);
    const factionMatch = block.match(/factionId:\s*['"]([^'"]+)['"]/);
    if (nameMatch && latMatch && lngMatch) {
        cities.push({
            name: nameMatch[1],
            lat: parseFloat(latMatch[1]),
            lng: parseFloat(lngMatch[1]),
            faction: factionMatch ? factionMatch[1] : ''
        });
    }
}

// Korea regions
const koreanFactions = ['goguryeo', 'goryeo', 'joseon', 'silla', 'baekje'];
const koreaCities = cities.filter(c => koreanFactions.includes(c.faction) || (c.lng > 124 && c.lng < 130 && c.lat > 33));

console.log("=== 潜在的朝鲜最西端城市 ===");
koreaCities.sort((a, b) => a.lng - b.lng).slice(0, 10).forEach(c => {
    console.log(`${c.name} (Faction: ${c.faction}, Lng: ${c.lng}, Lat: ${c.lat})`);
});

console.log("\n=== 潜在的中国最东端城市 (辽东/山东) ===");
const chinaCities = cities.filter(c => !koreanFactions.includes(c.faction) && c.lng > 118 && c.lng <= 126 && c.lat > 34 && c.lat < 43);
chinaCities.sort((a, b) => b.lng - a.lng).slice(0, 15).forEach(c => {
    console.log(`${c.name} (Faction: ${c.faction}, Lng: ${c.lng}, Lat: ${c.lat})`);
});
