import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import { getRegion } from '../src/systems/RegionSystem';

const mediumCities = CITIES_V2.filter(c => c.type === 'medium_city');
const counts: Record<string, typeof mediumCities> = {};
const flagMap = new Map<string, string[]>();

let total = 0;
for (const c of mediumCities) {
    const r = c.region || getRegion(c.lat, c.lng);
    if (!counts[r]) counts[r] = [];
    counts[r].push(c);

    const f = FACTIONS.find(x => x.id === c.factionId);
    const flag = f ? f.name : '未知';
    if (!flagMap.has(flag)) {
        flagMap.set(flag, []);
    }
    flagMap.get(flag)!.push(c.name);
    total++;
}

console.log('--- 80座大军区中城 最终阵列 ---');

Object.keys(counts).forEach(r => {
    console.log(`\n【${r}】 (${counts[r].length} 城)`);
    counts[r].forEach(c => {
        const f = FACTIONS.find(x => x.id === c.factionId);
        const flag = f ? f.name : '未知';
        console.log(`  - 据点: ${c.name.padEnd(8, ' ')} | 旗号: [${flag}]`);
    });
});

console.log(`\n总计统计 ${total} 座中城。`);

console.log('\n--- 重复旗号检测 ---');
let hasDup = false;
for (const [flag, cities] of flagMap.entries()) {
    if (cities.length > 1) {
        console.log(`⚠️ 发现重复旗号 [${flag}]，使用者: ${cities.join(', ')}`);
        hasDup = true;
    }
}

if (!hasDup) {
    console.log('✅ 检测通过：80座中城内部【零重复】！每一个据点都有独一无二的旗号。');
}
