/**
 * 审计 5 个文件的一致性 (势力编辑器写入对象)
 *
 * 1. src/data/factions.ts                  → FACTIONS
 * 2. src/data/cities_v2.ts                 → CITIES_V2 (含子数组的 factionId)
 * 3. src/data/StartingCapitals.ts         → STARTING_CAPITALS
 * 4. src/assets/CityAssetManager.ts          → factionFlagMap
 * 5. src/data/SandboxDisplayNames.ts       → SANDBOX_DISPLAY_NAMES
 *
 * 期望: 每个 factionId 应在 5 个文件里都注册;
 *       STARTING_CAPITALS[fId] 指向的 city_id 必须真实存在.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function read(p) {
    return fs.readFileSync(path.join(__dirname, '..', p), 'utf-8');
}

// === 1. FACTIONS ===
const factionsText = read('src/data/factions.ts');
const factionIds = new Set();
for (const m of factionsText.matchAll(/id:\s*'([^']+)'/g)) factionIds.add(m[1]);

// === 2. cities_v2 ===
const citiesText = read('src/data/cities_v2.ts');
const cityIds = new Set();
const cityFactionRefs = new Map();  // cityId -> factionId
for (const m of citiesText.matchAll(/id:\s*'(city_[^']+)'\s*,?\s*name:\s*'([^']+)'\s*,\s*factionId:\s*'([^']+)'/g)) {
    cityIds.add(m[1]);
    cityFactionRefs.set(m[1], { name: m[2], factionId: m[3] });
}

// === 3. STARTING_CAPITALS ===
const scText = read('src/data/StartingCapitals.ts');
const startingCapitals = new Map();
const scStart = scText.indexOf('STARTING_CAPITALS');
const scEnd = scText.indexOf('};', scStart);
const scBlock = scText.slice(scStart, scEnd);
for (const m of scBlock.matchAll(/'([^']+)':\s*'([^']+)'/g)) startingCapitals.set(m[1], m[2]);

// === 4. factionFlagMap ===
const camText = read('src/assets/CityAssetManager.ts');
const flagMap = new Map();
const ffStart = camText.indexOf('factionFlagMap');
const ffEnd = camText.indexOf('};', ffStart);
const ffBlock = camText.slice(ffStart, ffEnd);
for (const m of ffBlock.matchAll(/'([^']+)':\s*'([^']+)'/g)) flagMap.set(m[1], m[2]);

// === 5. SANDBOX_DISPLAY_NAMES ===
const sdnText = read('src/data/SandboxDisplayNames.ts');
const displayNames = new Map();
const dnStart = sdnText.indexOf('SANDBOX_DISPLAY_NAMES');
const dnEnd = sdnText.indexOf('};', dnStart);
const dnBlock = sdnText.slice(dnStart, dnEnd);
for (const m of dnBlock.matchAll(/'([^']+)':\s*'([^']+)'/g)) displayNames.set(m[1], m[2]);

console.log(`\n=== 注册量 ===`);
console.log(`  factions.ts FACTIONS:               ${factionIds.size}`);
console.log(`  cities_v2.ts 引用的 factionId:      ${new Set([...cityFactionRefs.values()].map(v => v.factionId)).size}`);
console.log(`  StartingCapitals.ts STARTING_CAPITALS: ${startingCapitals.size}`);
console.log(`  CityAssetManager factionFlagMap:    ${flagMap.size}`);
console.log(`  SandboxDisplayNames:                ${displayNames.size}`);
console.log(`  cities_v2.ts CITIES_V2 据点数:      ${cityIds.size}`);

// === 一致性检查 ===
const cityRefFactions = new Set([...cityFactionRefs.values()].map(v => v.factionId));
const allFactionIds = new Set([
    ...factionIds, ...startingCapitals.keys(), ...flagMap.keys(), ...displayNames.keys(), ...cityRefFactions
]);

console.log(`\n=== 1️⃣ FACTIONS 但据点引用不到 ===`);
const orphanFactions = [...factionIds].filter(f => !cityRefFactions.has(f));
if (orphanFactions.length === 0) console.log(`  ✅ 无残留`);
else {
    console.log(`  ⚠️ ${orphanFactions.length} 个: 注册了但没有任何城用它`);
    for (const f of orphanFactions.slice(0, 30)) console.log(`    - ${f}`);
    if (orphanFactions.length > 30) console.log(`    ... 还有 ${orphanFactions.length - 30}`);
}

console.log(`\n=== 2️⃣ 据点引用了 factionId, 但 FACTIONS 没注册 ===`);
const missingFactions = [...cityRefFactions].filter(f => !factionIds.has(f));
if (missingFactions.length === 0) console.log(`  ✅ 无缺失`);
else {
    console.log(`  ❌ ${missingFactions.length} 个: 城找不到对应的势力定义`);
    for (const f of missingFactions.slice(0, 30)) {
        const cities = [...cityFactionRefs.entries()].filter(([_, v]) => v.factionId === f).map(([id, v]) => `${v.name}(${id})`);
        console.log(`    - ${f}: 用此id的城 = ${cities.join(', ')}`);
    }
}

console.log(`\n=== 3️⃣ STARTING_CAPITALS 指向不存在的城 ===`);
const badCapitals = [...startingCapitals.entries()].filter(([_, cId]) => !cityIds.has(cId));
if (badCapitals.length === 0) console.log(`  ✅ 全部首都都真实存在`);
else {
    console.log(`  ❌ ${badCapitals.length} 个: 首都城找不到`);
    for (const [fId, cId] of badCapitals.slice(0, 30)) console.log(`    - ${fId} → ${cId} (城不存在)`);
}

console.log(`\n=== 4️⃣ STARTING_CAPITALS 缺势力 / 多余 ===`);
const scOnly = [...startingCapitals.keys()].filter(f => !factionIds.has(f));
const factionsOnly = [...factionIds].filter(f => !startingCapitals.has(f));
console.log(`  在 SC 但不在 FACTIONS (孤儿首都): ${scOnly.length} 个`);
for (const f of scOnly.slice(0, 20)) console.log(`    - ${f}: '${startingCapitals.get(f)}'`);
console.log(`  在 FACTIONS 但不在 SC (无首都势力): ${factionsOnly.length} 个`);
for (const f of factionsOnly.slice(0, 20)) console.log(`    - ${f}`);

console.log(`\n=== 5️⃣ factionFlagMap 缺/多 ===`);
const flagOnly = [...flagMap.keys()].filter(f => !factionIds.has(f));
const factionsWithoutFlag = [...factionIds].filter(f => !flagMap.has(f));
console.log(`  在 flagMap 但不在 FACTIONS: ${flagOnly.length} 个`);
for (const f of flagOnly.slice(0, 20)) console.log(`    - ${f}`);
console.log(`  在 FACTIONS 但无 flagMap: ${factionsWithoutFlag.length} 个`);
for (const f of factionsWithoutFlag.slice(0, 20)) console.log(`    - ${f}`);

console.log(`\n=== 6️⃣ SandboxDisplayNames 缺/多 ===`);
const dnOnly = [...displayNames.keys()].filter(f => !factionIds.has(f));
const factionsWithoutDN = [...factionIds].filter(f => !displayNames.has(f));
console.log(`  在 SDN 但不在 FACTIONS: ${dnOnly.length} 个`);
for (const f of dnOnly.slice(0, 20)) console.log(`    - ${f}`);
console.log(`  在 FACTIONS 但无 SDN: ${factionsWithoutDN.length} 个`);
for (const f of factionsWithoutDN.slice(0, 20)) console.log(`    - ${f}`);

console.log(`\n=== 7️⃣ 重复 factionId (FACTIONS 数组里) ===`);
const seenIds = new Map();
let dupCount = 0;
for (const m of factionsText.matchAll(/id:\s*'([^']+)'/g)) {
    seenIds.set(m[1], (seenIds.get(m[1]) || 0) + 1);
}
const dups = [...seenIds.entries()].filter(([_, n]) => n > 1);
if (dups.length === 0) console.log(`  ✅ 无重复`);
else {
    console.log(`  ❌ ${dups.length} 个 id 出现 ${'>'}1 次:`);
    for (const [id, n] of dups) console.log(`    - ${id}: ${n} 次`);
}

console.log(`\n=== 8️⃣ 重复 cityId (CITIES_V2 / 子数组) ===`);
const cityIdCount = new Map();
for (const m of citiesText.matchAll(/id:\s*'(city_[^']+)'/g)) {
    cityIdCount.set(m[1], (cityIdCount.get(m[1]) || 0) + 1);
}
const cityDups = [...cityIdCount.entries()].filter(([_, n]) => n > 1);
if (cityDups.length === 0) console.log(`  ✅ 无重复`);
else {
    console.log(`  ❌ ${cityDups.length} 个 cityId 出现 ${'>'}1 次:`);
    for (const [id, n] of cityDups.slice(0, 30)) console.log(`    - ${id}: ${n} 次`);
}

console.log('');
