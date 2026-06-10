const fs = require('fs');
const citiesSrc = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const factionsSrc = fs.readFileSync('src/data/factions.ts', 'utf8');
const gameAppSrc = fs.readFileSync('src/app/GameApp.ts', 'utf8');
const camSrc = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');

const altRe =
    /id:\s*'([^']+)'[\s\S]{0,800}?name:\s*'([^']+)'[\s\S]{0,200}?factionId:\s*'([^']+)'[\s\S]{0,400}?type:\s*'([^']+)'/g;
const cities = [];
let m;
while ((m = altRe.exec(citiesSrc)) !== null) {
    cities.push({ id: m[1], name: m[2], factionId: m[3], type: m[4] });
}
const byId = new Map();
for (const c of cities) byId.set(c.id, c);
const cityList = [...byId.values()];

const facRe = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'\s*\}/g;
const factions = [];
while ((m = facRe.exec(factionsSrc)) !== null) factions.push({ id: m[1], name: m[2] });

const facToCities = {};
for (const c of cityList) {
    if (!facToCities[c.factionId]) facToCities[c.factionId] = [];
    facToCities[c.factionId].push(c);
}
const multiFac = Object.entries(facToCities).filter(([f, arr]) => arr.length > 1 && f !== 'panjun');

const facNameToIds = {};
for (const f of factions) {
    if (!facNameToIds[f.name]) facNameToIds[f.name] = [];
    facNameToIds[f.name].push(f.id);
}
const dupNames = Object.entries(facNameToIds).filter(([, ids]) => ids.length > 1);

const facIds = new Set(factions.map((f) => f.id));
const missingFac = [...new Set(cityList.map((c) => c.factionId))].filter((f) => !facIds.has(f) && f !== 'panjun');

const usedFacs = new Set(cityList.map((c) => c.factionId));
const orphanFacs = factions.filter((f) => !usedFacs.has(f.id) && f.id !== 'panjun');

const passes = cityList.filter((c) => c.type === 'pass');

const capStart = gameAppSrc.indexOf('STARTING_CAPITALS');
const capEnd = gameAppSrc.indexOf('};', capStart);
const capBlock = gameAppSrc.slice(capStart, capEnd);
const capitals = [...capBlock.matchAll(/'([^']+)':\s*'([^']+)'/g)]
    .map((x) => ({ factionId: x[1], cityId: x[2] }))
    .filter((c) => c.factionId !== 'panjun');
const cityFacMap = Object.fromEntries(cityList.map((c) => [c.id, c.factionId]));

const capMismatch = [];
for (const cap of capitals) {
    const cf = cityFacMap[cap.cityId];
    if (!cf) capMismatch.push(`${cap.cityId}: 据点不存在于 cities_v2`);
    else if (cf !== cap.factionId)
        capMismatch.push(`${cap.cityId}: STARTING=${cap.factionId} cities_v2=${cf}`);
}

const cityToCaps = {};
for (const cap of capitals) {
    if (!cityToCaps[cap.cityId]) cityToCaps[cap.cityId] = [];
    cityToCaps[cap.cityId].push(cap.factionId);
}
const multiCap = Object.entries(cityToCaps).filter(([, fs]) => fs.length > 1);

// factionFlagMap vs factions name
const flagMapRe = /'([^']+)':\s*'([^']+)'/g;
const flagBlock = camSrc.match(/factionFlagMap:\s*\{[\s\S]*?\n\s*\}/);
const flagMap = {};
if (flagBlock) {
    const inner = flagBlock[0];
    while ((m = flagMapRe.exec(inner)) !== null) flagMap[m[1]] = m[2];
}
const flagMismatch = [];
for (const f of factions) {
    if (f.id === 'panjun') continue;
    const mapped = flagMap[f.id];
    if (mapped && mapped !== f.name)
        flagMismatch.push(`${f.id}: factions.ts「${f.name}」≠ flagMap「${mapped}」`);
}
const flagMapNoFaction = Object.keys(flagMap).filter((id) => !facIds.has(id));
const cityFacNoFlag = [...usedFacs].filter((id) => id !== 'panjun' && !flagMap[id]);

console.log('Parsed cities:', cityList.length);
console.log('\n=== 一势力多据点 ===');
multiFac.sort((a, b) => b[1].length - a[1].length).forEach(([f, arr]) => {
    const fn = factions.find((x) => x.id === f)?.name || '?';
    console.log(`${f}(${fn}): ${arr.map((c) => `${c.name}(${c.id})`).join(', ')}`);
});
console.log('Count:', multiFac.length);

console.log('\n=== 旗号汉字重复 (不同 factionId 同名) ===');
dupNames.forEach(([n, ids]) => console.log(`「${n}」: ${ids.join(', ')}`));
console.log('Count:', dupNames.length);

console.log('\n=== cities 无效 factionId ===');
console.log(missingFac.join(', ') || '(none)');

console.log('\n=== STARTING_CAPITALS 与 cities_v2 不一致 ===');
capMismatch.forEach((x) => console.log(x));
console.log('Count:', capMismatch.length);

console.log('\n=== 同一据点多条 STARTING_CAPITALS ===');
multiCap.forEach(([c, fs]) => console.log(`${c}: ${fs.join(', ')}`));

console.log('\n=== factions.ts name ≠ factionFlagMap ===');
flagMismatch.forEach((x) => console.log(x));
console.log('Count:', flagMismatch.length);

console.log('\n=== flagMap 无对应势力 ===', flagMapNoFaction.length);
flagMapNoFaction.slice(0, 15).forEach((x) => console.log(x));

console.log('\n=== 有据点但 flagMap 缺失 ===', cityFacNoFlag.length);
cityFacNoFlag.slice(0, 25).forEach((x) => {
    const fn = factions.find((f) => f.id === x)?.name;
    console.log(`${x} (${fn || '?'})`);
});

console.log('\n=== 仍为 pass ===', passes.length);
passes.forEach((c) => console.log(`${c.name} ${c.id} ${c.factionId}`));
