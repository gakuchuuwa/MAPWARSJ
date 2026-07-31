/**
 * audit_region.cjs — 检查 cities_v2.ts 中手动标注的 region 值，
 * 看哪些在 RegionSystem.ts 的 REGION_ORDER 中有效，哪些无效。
 */

const fs = require('fs');
const path = require('path');

const citiesV2 = fs.readFileSync(path.join(__dirname, 'src/data/cities_v2.ts'), 'utf8');
const regionSystem = fs.readFileSync(path.join(__dirname, 'src/systems/RegionSystem.ts'), 'utf8');

// 提取 REGION_ORDER 数组
const regionOrderMatch = regionSystem.match(/REGION_ORDER:\s*RegionType\[\]\s*=\s*\[([\s\S]*?)\];/);
if (!regionOrderMatch) {
    console.error('Cannot find REGION_ORDER');
    process.exit(1);
}
const validRegions = regionOrderMatch[1]
    .split(/['",\s]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.includes('//') && !s.includes('|'));

console.log('Valid RegionType values from REGION_ORDER:');
console.log(validRegions);
console.log(`Count: ${validRegions.length}\n`);

// 提取所有 region: 'XXX' 或 region: "XXX"
const regionRegex = /region:\s*['"]([^'"]+)['"]/g;
const foundRegions = {};
let match;

while ((match = regionRegex.exec(citiesV2)) !== null) {
    const region = match[1];
    if (!foundRegions[region]) foundRegions[region] = 0;
    foundRegions[region]++;
}

console.log('All manually-set region values in cities_v2.ts:');
for (const [region, count] of Object.entries(foundRegions).sort((a, b) => b[1] - a[1])) {
    const isValid = validRegions.includes(region);
    console.log(`  ${isValid ? '✅' : '❌'} '${region}' × ${count}${isValid ? '' : ' ← 无效，被自动判定覆盖'}`);
}

console.log('\n--- 需要修正的 city ID 列表 ---');
const cityBlockRegex = /\{\s*id:\s*['"]([^'"]+)['"][\s\S]*?region:\s*['"]([^'"]+)['"][\s\S]*?\}/g;
let cityMatch;
const invalidCities = [];

while ((cityMatch = cityBlockRegex.exec(citiesV2)) !== null) {
    const cityId = cityMatch[1];
    const region = cityMatch[2];
    if (!validRegions.includes(region)) {
        invalidCities.push({ id: cityId, region });
    }
}

// 也匹配单行格式的 city
const oneLineCityRegex = /id:\s*['"]([^'"]+)['"][^}]*?region:\s*['"]([^'"]+)['"]/g;
while ((cityMatch = oneLineCityRegex.exec(citiesV2)) !== null) {
    const cityId = cityMatch[1];
    const region = cityMatch[2];
    if (!validRegions.includes(region) && !invalidCities.find(c => c.id === cityId)) {
        invalidCities.push({ id: cityId, region });
    }
}

console.log(`\nFound ${invalidCities.length} cities with invalid region values:`);
for (const c of invalidCities) {
    console.log(`  ${c.id} — region: '${c.region}'`);
}
