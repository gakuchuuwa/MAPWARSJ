/**
 * 把所有据点跑一遍 getRegion(lat, lng), 按区分组列出
 * 用户扫一眼找误分类: 东北有塞外的城吗? 西藏有云南的城吗? 等等
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

// === 与 RegionSystem.ts 同步 (14 区 v4, 2026-05-29) ===
function getRegion(lat, lng) {
    if (lat > 50.0) {
        if (lng > 120.0) return 'NORTHEAST';
        return 'STEPPE';
    }
    if (lat > 26.0 && lat <= 37.0 && lng >= 76.0 && lng < 103.0) return 'TIBET';
    if (lat > 36.0 && lat <= 41.0 && lng >= 93.0 && lng < 111.0) return 'HEXI';
    if (lat >= 35.0 && lat <= 44.0 && lng >= 75.0 && lng < 93.0) return 'WESTERN';
    if (lng < 75.0) return 'CENTRAL_ASIA';
    if (lat > 41.0 && lng <= 120.0) return 'STEPPE';
    if (lat > 40.0 && lng > 120.0) return 'NORTHEAST';
    if (lng > 127.0) return 'JAPAN';
    if (lat > 33.0 && lng > 123.0 && lng <= 127.0) return 'KOREA';
    if (lat > 36.0 && lat <= 41.0 && lng > 108.0 && lng <= 123.0) return 'NORTH';
    if (lat > 32.0 && lat <= 34.0 && lng > 106.0 && lng <= 108.0) return 'CENTRAL';
    if (lat > 32.0 && lat <= 36.0 && lng > 108.0 && lng <= 123.0) return 'CENTRAL';
    if (lat > 23.5 && lat <= 28.0 && lng > 116.0 && lng <= 120.5) return 'LINGNAN'; // 福建
    if (lat > 26.0 && lat <= 32.0 && lng > 111.0 && lng <= 123.0) return 'JIANGNAN';
    if (lat <= 26.0 && lng >= 92.0 && lng < 102.0) return 'DIANQIAN';  // 泰缅
    if (lat <= 26.0 && lng >= 102.0) return 'LINGNAN';  // 越南/柬+粤桂海
    if (lat <= 32.0 && lng > 98.0 && lng <= 111.0) {
        if (lat > 28.0 && lng > 103.0 && lng <= 110.0) return 'BASHU';
        return 'DIANQIAN';
    }
    if (lat > 35.0) return 'NORTH';
    if (lat > 33.0) return 'CENTRAL';
    return 'JIANGNAN';
}

const cities = loadCities();
const grouped = {};
const cityRegionMap = {};
for (const c of cities) {
    // 优先读取 city 本身带的 region 覆盖，否则走坐标判定
    const r = c.region || getRegion(c.lat, c.lng);
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(c);
    cityRegionMap[c.id] = r;
}

// 加载 radial_network.geojson 统计跨区边
let geojson = null;
const crossEdges = {}; // { [region]: count }
try {
    const geojsonPath = path.join(__dirname, '../public/assets/radial_network.geojson');
    if (fs.existsSync(geojsonPath)) {
        geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
        for (const f of geojson.features) {
            const p = f.properties;
            const r1 = cityRegionMap[p.from];
            const r2 = cityRegionMap[p.to];
            if (r1 && r2 && r1 !== r2) {
                crossEdges[r1] = (crossEdges[r1] || 0) + 1;
                crossEdges[r2] = (crossEdges[r2] || 0) + 1;
            }
        }
    }
} catch (e) {
    console.warn("⚠️ 读取 radial_network.geojson 失败，跨区边统计将跳过");
}

const REGION_ORDER = ['CENTRAL','NORTH','JIANGNAN','LINGNAN','BASHU','DIANQIAN','HEXI','WESTERN','TIBET','STEPPE','NORTHEAST','KOREA','JAPAN','CENTRAL_ASIA'];

console.log(`\n📍 ${cities.length} 据点分区 (按 getRegion 自动判定 + 人工覆盖, 14 区)\n`);
console.log('═'.repeat(70));

for (const r of REGION_ORDER) {
    const list = grouped[r] || [];
    list.sort((a, b) => a.lng - b.lng);
    const crossCount = crossEdges[r] || 0;
    console.log(`\n▼ ${r}  (${list.length} 个)  | 🔗 跨区边界: ${crossCount} 条`);
    console.log('-'.repeat(70));
    // 4 列布局
    const cols = 3;
    for (let i = 0; i < list.length; i += cols) {
        const row = list.slice(i, i + cols).map(c => {
            const coord = `(${c.lat.toFixed(1)},${c.lng.toFixed(1)})`;
            return `${c.name.padEnd(8, '　')} ${coord.padEnd(14)}`;
        }).join(' │ ');
        console.log('  ' + row);
    }
}
console.log('\n═'.repeat(70));
console.log(`\n总计: ${cities.length}\n`);
