const fs = require('fs');
const content = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const clean = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
const matches = clean.match(/T0_CAPITALS[\s\S]*?=\s*\[([\s\S]*?)\];[\s\S]*?T1_MEDIUM_CITIES[\s\S]*?=\s*\[([\s\S]*?)\];[\s\S]*?T2_STRATEGIC[\s\S]*?=\s*\[([\s\S]*?)\];[\s\S]*?PERIPHERY[\s\S]*?=\s*\[([\s\S]*?)\];/);
if (!matches) { console.log('PARSE ERROR: could not match array declarations'); process.exit(1); }
function extract(str) {
    const r = [];
    const re = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?lat:\s*([\d.-]+)\s*,\s*lng:\s*([\d.-]+)/g;
    let m;
    while ((m = re.exec(str))) r.push({ id: m[1], name: m[2], lat: +m[3], lng: +m[4] });
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

// 赐支河曲 (101.43, 36.04)
console.log('\n=== 赐支河曲 (101.43, 36.04) ===');
const cz = all.filter(c => { const d = hv(36.04, 101.43, c.lat, c.lng); return d < 50 && d > 0.1; });
if (cz.length === 0) console.log('✅ 50km内无其他据点，安全');
else cz.forEach(c => console.log(`⚠️  ${c.name}(${c.id}) d=${hv(36.04, 101.43, c.lat, c.lng).toFixed(1)}km`));

// 允吾 (102.82, 36.32)
console.log('\n=== 允吾 (102.82, 36.32) ===');
const yw = all.filter(c => { const d = hv(36.32, 102.82, c.lat, c.lng); return d < 50 && d > 0.1; });
if (yw.length === 0) console.log('✅ 50km内无其他据点，安全');
else yw.forEach(c => console.log(`⚠️  ${c.name}(${c.id}) d=${hv(36.32, 102.82, c.lat, c.lng).toFixed(1)}km`));

// 与青唐城的距离
console.log('\n=== 与青唐城的距离 ===');
console.log(`赐支河曲->青唐城: ${hv(36.04, 101.43, 36.625, 101.775).toFixed(1)}km`);
console.log(`允吾->青唐城: ${hv(36.32, 102.82, 36.625, 101.775).toFixed(1)}km`);
