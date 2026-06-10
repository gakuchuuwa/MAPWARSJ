import { FACTIONS } from '../src/data/factions';
import { CITIES_V2 } from '../src/data/cities_v2';
import { SANDBOX_DISPLAY_NAMES } from '../src/data/SandboxDisplayNames';
import * as fs from 'fs';

const gameApp = fs.readFileSync('c:\\MAPWARSJ\\src\\core\\GameApp.ts', 'utf8');
const assetMgr = fs.readFileSync('c:\\MAPWARSJ\\src\\core\\CityAssetManager.ts', 'utf8');

// Collect all unique factionIds actually used by cities (excluding panjun)
const usedFactionIds = new Set<string>();
CITIES_V2.forEach(c => {
    if (c.factionId && c.factionId !== 'panjun') {
        usedFactionIds.add(c.factionId);
    }
});

const factionMap = new Map(FACTIONS.map(f => [f.id, f.name]));

let errors = 0;

console.log('=== 全面一致性检查 ===');
console.log(`共 ${usedFactionIds.size} 个活跃势力（排除叛军）\n`);

// Check 1: Every used factionId must exist in FACTIONS
console.log('--- 检查1: factions.ts 是否包含所有活跃势力 ---');
usedFactionIds.forEach(id => {
    if (!factionMap.has(id)) {
        console.log(`  ❌ ${id} 被城市引用但在 FACTIONS 中不存在！`);
        errors++;
    }
});
if (errors === 0) console.log('  ✅ 全部通过');

// Check 2: SandboxDisplayNames
let e2 = 0;
console.log('\n--- 检查2: SandboxDisplayNames.ts ---');
usedFactionIds.forEach(id => {
    if (!SANDBOX_DISPLAY_NAMES[id]) {
        const name = factionMap.get(id) || '???';
        const city = CITIES_V2.find(c => c.factionId === id);
        console.log(`  ❌ ${id} (${name}) -> city: ${city?.name} 缺失！`);
        e2++;
        errors++;
    }
});
if (e2 === 0) console.log('  ✅ 全部通过');

// Check 3: GameApp STARTING_CAPITALS
let e3 = 0;
console.log('\n--- 检查3: GameApp.ts STARTING_CAPITALS ---');
usedFactionIds.forEach(id => {
    if (!gameApp.includes(`'${id}':`)) {
        const name = factionMap.get(id) || '???';
        const city = CITIES_V2.find(c => c.factionId === id);
        console.log(`  ❌ ${id} (${name}) -> city: ${city?.name} 缺失！`);
        e3++;
        errors++;
    }
});
if (e3 === 0) console.log('  ✅ 全部通过');

// Check 4: CityAssetManager _legacy_sandbox_dict
let e4 = 0;
console.log('\n--- 检查4: CityAssetManager.ts _legacy_sandbox_dict ---');
usedFactionIds.forEach(id => {
    if (!assetMgr.includes(`'${id}':`)) {
        const name = factionMap.get(id) || '???';
        const city = CITIES_V2.find(c => c.factionId === id);
        console.log(`  ❌ ${id} (${name}) -> city: ${city?.name} 缺失！`);
        e4++;
        errors++;
    }
});
if (e4 === 0) console.log('  ✅ 全部通过');

// Check 5: SandboxDisplayNames vs factions.ts name mismatch
let e5 = 0;
console.log('\n--- 检查5: SandboxDisplayNames 旗号文字与 factions.ts name 是否一致 ---');
usedFactionIds.forEach(id => {
    const sandboxName = SANDBOX_DISPLAY_NAMES[id];
    const factionName = factionMap.get(id);
    if (sandboxName && factionName && sandboxName !== factionName) {
        // Allow truncated names (sandbox may use shorter display names for 2+ char names)
        // Only flag if they're completely different
        if (!factionName.startsWith(sandboxName) && !sandboxName.startsWith(factionName.substring(0, 2))) {
            const city = CITIES_V2.find(c => c.factionId === id);
            console.log(`  ⚠️  ${id}: Sandbox="${sandboxName}" vs Faction="${factionName}" (city: ${city?.name})`);
            e5++;
        }
    }
});
if (e5 === 0) console.log('  ✅ 全部通过');

// Check 6: Duplicate faction names (旗号重复)
let e6 = 0;
console.log('\n--- 检查6: 旗号重复检查 ---');
const nameCount = new Map<string, string[]>();
FACTIONS.forEach(f => {
    const arr = nameCount.get(f.name) || [];
    arr.push(f.id);
    nameCount.set(f.name, arr);
});
nameCount.forEach((ids, name) => {
    if (ids.length > 1) {
        console.log(`  ❌ 旗号 "${name}" 被 ${ids.length} 个势力使用: ${ids.join(', ')}`);
        e6++;
        errors++;
    }
});
if (e6 === 0) console.log('  ✅ 全部通过');

// Check 7: 旗号与据点名 2字以上重叠
let e7 = 0;
console.log('\n--- 检查7: 旗号与据点名 2字以上重叠冲突 ---');
CITIES_V2.forEach(c => {
    if (!c.factionId || c.factionId === 'panjun') return;
    const faction = FACTIONS.find(f => f.id === c.factionId);
    if (!faction) return;
    const flagName = faction.name;
    const cityName = c.name;
    if (flagName.length >= 2 && cityName.includes(flagName)) {
        console.log(`  ❌ 旗号 "${flagName}" (${c.factionId}) 与据点 "${cityName}" 存在2字以上重叠！`);
        e7++;
        errors++;
    }
    if (cityName.length >= 2 && flagName.includes(cityName)) {
        console.log(`  ❌ 据点 "${cityName}" 与旗号 "${flagName}" (${c.factionId}) 存在2字以上重叠！`);
        e7++;
        errors++;
    }
});
if (e7 === 0) console.log('  ✅ 全部通过');

console.log(`\n=== 检查完毕：共 ${errors} 个错误 ===`);
