import fs from 'fs';

const citiesTs = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const factionsTs = fs.readFileSync('src/data/factions.ts', 'utf8');
const cam = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
const gameApp = fs.readFileSync('src/app/GameApp.ts', 'utf8');
const sandbox = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');

const cityRe = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*factionId:\s*'([^']+)'/g;
const cities = [];
let m;
while ((m = cityRe.exec(citiesTs))) cities.push({ id: m[1], name: m[2], factionId: m[3] });

const facNames = {};
const facRe = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'\s*\}/g;
while ((m = facRe.exec(factionsTs))) facNames[m[1]] = m[2];

const flags = {};
const mapStart = cam.indexOf('factionFlagMap');
const mapSection = cam.slice(mapStart, mapStart + 80000);
const flagRe = /'([^']+)':\s*'([^']+)'/g;
while ((m = flagRe.exec(mapSection))) flags[m[1]] = m[2];

const caps = {};
const capMatch = gameApp.match(/STARTING_CAPITALS[^=]*=\s*\{([\s\S]*?)\n\};/);
if (capMatch) {
    const capRe = /'([^']+)':\s*'([^']+)'/g;
    while ((m = capRe.exec(capMatch[1]))) caps[m[1]] = m[2];
}

const sb = {};
const sbRe = /'([^']+)':\s*'([^']+)'/g;
while ((m = sbRe.exec(sandbox))) sb[m[1]] = m[2];

const byFaction = {};
for (const c of cities) {
    if (!byFaction[c.factionId]) byFaction[c.factionId] = [];
    byFaction[c.factionId].push(c);
}

const randomWithCity = [];
const missingFlag = [];
const wrongCap = [];
const flagMismatch = [];

for (const [fid, list] of Object.entries(byFaction)) {
    const flag = flags[fid];
    const expected = facNames[fid] || sb[fid];
    if (flag === undefined) missingFlag.push({ fid, expected, cities: list.map((c) => c.name) });
    else if (flag === 'RANDOM') randomWithCity.push({ fid, expected, cities: list.map((c) => `${c.name}(${c.id})`) });
    else if (expected && flag !== expected) flagMismatch.push({ fid, flag, expected, city: list[0].name });

    if (list.length === 1) {
        const cap = caps[fid];
        if (cap !== list[0].id) wrongCap.push({ fid, cap: cap ?? '(missing)', shouldBe: list[0].id, city: list[0].name });
    }
}

console.log('=== 有据点但旗号=RANDOM ===');
for (const r of randomWithCity) console.log(`${r.fid} 应「${r.expected}」→ ${r.cities.join(', ')}`);

console.log('\n=== 有据点但无 flag 映射 ===');
for (const r of missingFlag) console.log(`${r.fid} → ${r.cities.join(', ')}`);

console.log('\n=== 旗号与 factions.name 不一致 ===');
for (const r of flagMismatch) console.log(`${r.fid}: map「${r.flag}」 factions「${r.expected}」 @${r.city}`);

console.log('\n=== STARTING_CAPITALS 与唯一据点不符 ===');
for (const r of wrongCap) console.log(`${r.fid}: cap=${r.cap} 应为 ${r.shouldBe} (${r.city})`);

console.log(`\n合计: RANDOM=${randomWithCity.length} 缺失=${missingFlag.length} 不一致=${flagMismatch.length} 首都错=${wrongCap.length}`);
