/**
 * 西藏据点专项检查:
 *   1) 列出所有 lat ∈ [26, 37], lng ∈ [78, 100] 范围据点
 *   2) 列出它们的 BFS 辐射连接
 *   3) 检查两两间距 ≥ 50km
 *   4) 检查每条边 ≤ 333km
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 引入和 audit 同样的 strip 逻辑
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

function distKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const s = Math.sin(dLat / 2) ** 2 +
              Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

const cities = loadCities();
const network = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/assets/radial_network.geojson'), 'utf8'));

// 西藏 bbox: lat 26-37, lng 78-100
const tibet = cities.filter(c => c.lat >= 26 && c.lat <= 37 && c.lng >= 78 && c.lng <= 100);
tibet.sort((a, b) => a.lng - b.lng);

console.log(`\n📍 西藏区据点 (lat 26-37, lng 78-100): ${tibet.length} 个\n`);
console.log('  名称              坐标                  factionId       tier');
console.log('  ────────────────────────────────────────────────────────────');
for (const c of tibet) {
    console.log(`  ${c.name.padEnd(10, '　')}  (${c.lat.toFixed(2)}, ${c.lng.toFixed(2)})  ${(c.factionId||'').padEnd(14)} t${c.tier ?? '-'}`);
}

// BFS 连接 (仅西藏区两端)
const tibetIds = new Set(tibet.map(c => c.id));
const tibetEdges = network.features.filter(f =>
    tibetIds.has(f.properties.from) || tibetIds.has(f.properties.to)
);

console.log(`\n🔗 涉及西藏的 BFS 连接: ${tibetEdges.length} 条\n`);
console.log('  起 → 终                                距离   类型');
console.log('  ────────────────────────────────────────────────────');
const sorted = [...tibetEdges].sort((a, b) => b.properties.length_km - a.properties.length_km);
for (const f of sorted) {
    const fromInside = tibetIds.has(f.properties.from);
    const toInside = tibetIds.has(f.properties.to);
    const type = fromInside && toInside ? '区内' : '出/入西藏';
    const km = f.properties.length_km;
    const warn = km > 333 ? ' ❌ 超 333' : km > 280 ? ' ⚠️ 接近极限' : '';
    console.log(`  ${f.properties.fromName.padEnd(8, '　')} → ${f.properties.toName.padEnd(8, '　')}  ${km.toFixed(0).padStart(4)}km  ${type}${warn}`);
}

// 间距检查
console.log(`\n📏 两两间距检查 (< 50km 视为违规):\n`);
const tooClose = [];
for (let i = 0; i < tibet.length; i++) {
    for (let j = i + 1; j < tibet.length; j++) {
        const d = distKm(tibet[i], tibet[j]);
        if (d < 50) tooClose.push({ a: tibet[i], b: tibet[j], d });
    }
}
if (tooClose.length === 0) {
    console.log('  ✅ 所有西藏据点间距 ≥ 50km, 无违规\n');
} else {
    for (const v of tooClose) {
        console.log(`  ⚠️ ${v.a.name.padEnd(8)} ↔ ${v.b.name.padEnd(8)}  ${v.d.toFixed(0)}km`);
    }
}

// 最短/最长边
const inKms = tibetEdges.map(f => f.properties.length_km).sort((a, b) => a - b);
console.log(`\n📊 西藏区 BFS 边距离:`);
console.log(`   最短: ${inKms[0].toFixed(0)}km   最长: ${inKms[inKms.length-1].toFixed(0)}km`);
console.log(`   中位: ${inKms[Math.floor(inKms.length/2)].toFixed(0)}km   平均: ${(inKms.reduce((s,d)=>s+d,0)/inKms.length).toFixed(0)}km`);
