const fs = require('fs');
const content = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const clean = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
const matches = clean.match(/T0_CAPITALS[\s\S]*?=\s*\[([\s\S]*?)\];[\s\S]*?T1_MEDIUM_CITIES[\s\S]*?=\s*\[([\s\S]*?)\];[\s\S]*?T2_STRATEGIC[\s\S]*?=\s*\[([\s\S]*?)\];[\s\S]*?PERIPHERY[\s\S]*?=\s*\[([\s\S]*?)\];/);
if (!matches) { console.log('PARSE ERROR'); process.exit(1); }
function extract(str) {
    const r = [];
    const re = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?factionId:\s*'([^']+)'[\s\S]*?lat:\s*([\d.-]+)\s*,\s*lng:\s*([\d.-]+)/g;
    let m;
    while ((m = re.exec(str))) r.push({ id: m[1], name: m[2], factionId: m[3], lat: +m[4], lng: +m[5] });
    return r;
}
const all = [...extract(matches[1]), ...extract(matches[2]), ...extract(matches[3]), ...extract(matches[4])];
console.log('Total cities:', all.length);

function hv(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const p = x => x * Math.PI / 180;
    const dL = p(lat2 - lat1);
    const dL2 = p(lng2 - lng1);
    const a = Math.sin(dL / 2) ** 2 + Math.cos(p(lat1)) * Math.cos(p(lat2)) * Math.sin(dL2 / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 1. 检查完全相同的坐标 (0km)
console.log('\n=== 完全相同坐标 (0km) ===');
const coordMap = {};
all.forEach(c => {
    const key = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
    if (!coordMap[key]) coordMap[key] = [];
    coordMap[key].push(c);
});
let dupCount = 0;
for (const [key, cities] of Object.entries(coordMap)) {
    if (cities.length > 1) {
        console.log(`\n📍 (${key}) - ${cities.length}个据点:`);
        cities.forEach(c => console.log(`   ${c.name}(id:${c.id}, faction:${c.factionId})`));
        dupCount++;
    }
}
if (dupCount === 0) console.log('✅ 无完全相同坐标的据点');

// 2. 检查非常接近的坐标 (<1km)
console.log('\n\n=== 非常接近的坐标 (<1km) ===');
const checked = new Set();
let closeCount = 0;
for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
        const d = hv(all[i].lat, all[i].lng, all[j].lat, all[j].lng);
        if (d > 0 && d < 1) {
            const key = `${all[i].id}-${all[j].id}`;
            const reverseKey = `${all[j].id}-${all[i].id}`;
            if (!checked.has(key) && !checked.has(reverseKey)) {
                checked.add(key);
                console.log(`${all[i].name}(${all[i].factionId}) ↔ ${all[j].name}(${all[j].factionId}): ${d.toFixed(2)}km`);
                closeCount++;
            }
        }
    }
}
if (closeCount === 0) console.log('✅ 无<1km的接近据点');
else console.log(`\n共 ${closeCount} 对 <1km 的接近据点`);

// 3. 检查重复id
console.log('\n\n=== 重复ID ===');
const idMap = {};
all.forEach(c => {
    if (!idMap[c.id]) idMap[c.id] = [];
    idMap[c.id].push(c);
});
let idDupCount = 0;
for (const [id, cities] of Object.entries(idMap)) {
    if (cities.length > 1) {
        console.log(`\n⚠️  id: ${id} - ${cities.length}个据点:`);
        cities.forEach(c => console.log(`   ${c.name}(faction:${c.factionId})`));
        idDupCount++;
    }
}
if (idDupCount === 0) console.log('✅ 无重复ID');
