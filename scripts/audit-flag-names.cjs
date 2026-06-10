const fs = require('fs');

const facSrc = fs.readFileSync('src/data/factions.ts', 'utf8');
const sdnSrc = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
const camSrc = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
const citiesSrc = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

const facRe = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'\s*\}/g;
const factions = [];
let m;
while ((m = facRe.exec(facSrc)) !== null) factions.push({ id: m[1], name: m[2] });

const sdn = {};
const sdnRe = /^\s*'([^']+)':\s*'([^']+)'/gm;
while ((m = sdnRe.exec(sdnSrc)) !== null) sdn[m[1]] = m[2];

const flagBlock = camSrc.match(/factionFlagMap:\s*\{[\s\S]*?\n\s*\}/)[0];
const flagMap = {};
for (const mm of flagBlock.matchAll(/'([^']+)':\s*'([^']+)'/g)) flagMap[mm[1]] = mm[2];

const len = (s) => [...s].length;
const isRandom = (s) => !s || s === 'RANDOM' || String(s).includes('RANDOM');
const facIds = new Set(factions.map((f) => f.id));

console.log('=== 旗号超过 2 字 (factions.ts name) ===');
const over2Fac = factions.filter((f) => f.id !== 'panjun' && len(f.name) > 2);
over2Fac.forEach((f) => console.log(`${f.id}: [${f.name}] (${len(f.name)}字)`));
console.log('共', over2Fac.length);

console.log('\n=== 旗号超过 2 字 (SandboxDisplayNames) ===');
const over2Sdn = Object.entries(sdn).filter(([, v]) => len(v) > 2);
over2Sdn.forEach(([id, v]) => console.log(`${id}: [${v}] (${len(v)}字)`));
console.log('共', over2Sdn.length);

console.log('\n=== 旗号超过 2 字 (factionFlagMap, 非 RANDOM) ===');
const over2Fm = Object.entries(flagMap).filter(([id, v]) => !isRandom(v) && len(v) > 2);
over2Fm.forEach(([id, v]) => console.log(`${id}: [${v}] (${len(v)}字)`));
console.log('共', over2Fm.length);

console.log('\n=== factions name 与 SDN 不一致 ===');
const nameSdnMismatch = [];
for (const f of factions) {
    if (f.id === 'panjun') continue;
    const s = sdn[f.id];
    if (s && s !== f.name && !isRandom(s)) nameSdnMismatch.push({ id: f.id, name: f.name, sdn: s });
}
nameSdnMismatch.forEach((x) => console.log(`${x.id}: factions=[${x.name}] SDN=[${x.sdn}]`));
console.log('共', nameSdnMismatch.length);

console.log('\n=== factions name 与 flagMap 不一致 (非 RANDOM) ===');
const nameFmMismatch = [];
for (const f of factions) {
    if (f.id === 'panjun') continue;
    const fm = flagMap[f.id];
    if (fm && !isRandom(fm) && fm !== f.name) nameFmMismatch.push({ id: f.id, name: f.name, fm });
}
nameFmMismatch.forEach((x) => console.log(`${x.id}: factions=[${x.name}] flagMap=[${x.fm}]`));
console.log('共', nameFmMismatch.length);

console.log('\n=== 旗号汉字重复 (factions.ts name) ===');
const nameToIds = {};
for (const f of factions) {
    if (f.id === 'panjun' || isRandom(f.name)) continue;
    if (!nameToIds[f.name]) nameToIds[f.name] = [];
    nameToIds[f.name].push(f.id);
}
const dup = Object.entries(nameToIds).filter(([, ids]) => ids.length > 1);
dup.forEach(([n, ids]) => console.log(`[${n}]: ${ids.join(', ')}`));
console.log('共', dup.length);

console.log('\n=== 有据点: 无 SDN ===');
const used = new Set();
const cityRe = /factionId:\s*'([^']+)'/g;
while ((m = cityRe.exec(citiesSrc)) !== null) {
    if (m[1] !== 'panjun') used.add(m[1]);
}
const noSdn = [...used].filter((id) => facIds.has(id) && !sdn[id]).sort();
noSdn.forEach((id) => console.log(id));
console.log('共', noSdn.length);

console.log('\n=== 有据点: 无 flagMap (非 RANDOM) ===');
const noFm = [...used].filter((id) => facIds.has(id) && !(id in flagMap)).sort();
noFm.forEach((id) => console.log(id));
console.log('共', noFm.length);

console.log('\n=== flagMap 有值但 factions 不存在 ===');
const deadFm = Object.keys(flagMap).filter((id) => !facIds.has(id)).sort();
console.log('共', deadFm.length);
