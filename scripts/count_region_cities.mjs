/**
 * 按地理 bbox 粗分区, 统计各区据点数 + 面积比
 * 让用户判断"福建该不该独立"的真正依据
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadCities() {
    let src = fs.readFileSync(path.join(__dirname, '../src/data/cities_v2.ts'), 'utf8');
    src = src.replace(/^\s*import\b[^;]*;\s*$/gm, '');
    src = src.replace(/^export\s+interface\s+\w+\s*\{[\s\S]*?^\}/gm, '');
    src = src.replace(/^export\s+type\s+[^;]+;\s*$/gm, '');
    src = src.replace(/\bexport\s+(const|let|var|function)\b/g, '$1');
    src = src.replace(/(const\s+\w+)\s*:\s*[^=]+=/g, '$1 =');
    src += '\nreturn CITIES_V2;';
    return new Function(src)();
}

// 用 bbox 粗分区 (中国部分按现代省划)
// (latMin, latMax, lngMin, lngMax)
const REGIONS = [
    { name: '中原',   latMin: 32.5, latMax: 36.5, lngMin: 105, lngMax: 115 },   // 河南+陕西关中
    { name: '北方',   latMin: 36.5, latMax: 42,   lngMin: 110, lngMax: 120 },   // 河北+京津
    { name: '山西',   latMin: 35,   latMax: 41,   lngMin: 110, lngMax: 114 },   // 山西
    { name: '江苏',   latMin: 30,   latMax: 35,   lngMin: 117, lngMax: 122 },   // 江苏+上海
    { name: '浙江',   latMin: 27,   latMax: 31,   lngMin: 118, lngMax: 122 },   // 浙江
    { name: '安徽',   latMin: 30,   latMax: 35,   lngMin: 114, lngMax: 119 },   // 安徽
    { name: '江西',   latMin: 24,   latMax: 30,   lngMin: 113, lngMax: 118 },   // 江西
    { name: '湖北',   latMin: 29,   latMax: 33,   lngMin: 108, lngMax: 116 },   // 湖北
    { name: '湖南',   latMin: 24,   latMax: 30,   lngMin: 108, lngMax: 114 },   // 湖南
    { name: '福建',   latMin: 23,   latMax: 28,   lngMin: 116, lngMax: 121 },   // 福建
    { name: '广东',   latMin: 20,   latMax: 25,   lngMin: 109.5, lngMax: 117 }, // 广东+海南
    { name: '广西',   latMin: 20,   latMax: 26,   lngMin: 105, lngMax: 112 },   // 广西
    { name: '四川',   latMin: 28,   latMax: 34,   lngMin: 102, lngMax: 108 },   // 四川+重庆
    { name: '云南',   latMin: 21,   latMax: 29,   lngMin: 97,  lngMax: 105 },   // 云南
    { name: '贵州',   latMin: 24,   latMax: 29,   lngMin: 103, lngMax: 110 },   // 贵州
    { name: '甘肃',   latMin: 32,   latMax: 42,   lngMin: 92,  lngMax: 108 },   // 甘肃宁夏
    { name: '新疆',   latMin: 33,   latMax: 49,   lngMin: 73,  lngMax: 95 },    // 新疆
    { name: '西藏',   latMin: 26,   latMax: 37,   lngMin: 78,  lngMax: 100 },   // 西藏青海
    { name: '内蒙',   latMin: 38,   latMax: 52,   lngMin: 95,  lngMax: 122 },   // 内蒙古+外蒙古
    { name: '东北',   latMin: 40,   latMax: 53,   lngMin: 120, lngMax: 135 },   // 辽吉黑
    { name: '朝鲜',   latMin: 33,   latMax: 43,   lngMin: 124, lngMax: 131 },   // 朝鲜半岛
    { name: '日本',   latMin: 26,   latMax: 46,   lngMin: 127, lngMax: 146 },   // 日本
    { name: '中亚',   latMin: 30,   latMax: 50,   lngMin: 55,  lngMax: 75 },    // 中亚
    { name: '其他',   latMin: -90,  latMax: 90,   lngMin: -180, lngMax: 180 },  // 兜底
];

function classify(c) {
    for (const r of REGIONS) {
        if (c.lat >= r.latMin && c.lat <= r.latMax &&
            c.lng >= r.lngMin && c.lng <= r.lngMax) return r.name;
    }
    return '未分类';
}

// 简化地理面积估算 (基于 bbox)
function bboxAreaKm2(r) {
    const latKm = (r.latMax - r.latMin) * 111;
    const avgLat = (r.latMax + r.latMin) / 2;
    const lngKm = (r.lngMax - r.lngMin) * 111 * Math.cos(avgLat * Math.PI / 180);
    return latKm * lngKm;
}

const cities = loadCities();
const buckets = {};
for (const c of cities) {
    const r = classify(c);
    if (!buckets[r]) buckets[r] = [];
    buckets[r].push(c);
}

console.log('\n=== 按现代省 / 区域分桶 (529+ 据点) ===\n');
console.log('  区域       据点数   bbox面积(万km²)   据点/万km²');
console.log('  ─────────────────────────────────────────────');
const rows = REGIONS.map(r => ({
    name: r.name,
    count: (buckets[r.name] || []).length,
    area: bboxAreaKm2(r) / 10000,
}));
rows.sort((a, b) => b.count - a.count);

for (const r of rows) {
    if (r.count === 0 && r.name !== '其他') continue;
    const density = r.area > 0 ? (r.count / r.area).toFixed(2) : '-';
    console.log(`  ${r.name.padEnd(8, '　')}  ${String(r.count).padStart(4)}    ${r.area.toFixed(1).padStart(8)}        ${density.padStart(5)}`);
}

console.log(`\n  合计: ${cities.length} 个据点\n`);

// 重点对比
console.log('=== 关键对比 ===');
const fujian = (buckets['福建'] || []).length;
const guizhou = (buckets['贵州'] || []).length;
const shanxi = (buckets['山西'] || []).length;
const hunan = (buckets['湖南'] || []).length;
const hubei = (buckets['湖北'] || []).length;
const jiangxi = (buckets['江西'] || []).length;
const henan = (buckets['中原'] || []).length;
console.log(`  福建: ${fujian} 据点`);
console.log(`  贵州: ${guizhou} 据点`);
console.log(`  山西: ${shanxi} 据点`);
console.log(`  湖南: ${hunan} 据点`);
console.log(`  湖北: ${hubei} 据点`);
console.log(`  江西: ${jiangxi} 据点`);
console.log(`  中原(河南+陕西): ${henan} 据点 (双锚区)`);
