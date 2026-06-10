/**
 * 静态性能审计（不启动浏览器）— node scripts/perf-static-audit.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();

function countRe(file, re) {
    const t = fs.readFileSync(path.join(root, file), 'utf8');
    return [...t.matchAll(re)].length;
}

const cities = countRe('src/data/cities_v2.ts', /id:\s*'city_/g);
const factions = countRe('src/data/factions.ts', /id:\s*'/g);

// 模拟 LegionManager 每帧 getNearestCity 代价（全表扫描）
function benchNearestCity(nCities, nArmies, callsPerArmy, iterations) {
    const cities = Array.from({ length: nCities }, (_, i) => ({
        lat: 20 + (i % 50) * 0.5,
        lng: 100 + Math.floor(i / 50) * 0.5,
        factionId: 'f' + (i % factions),
    }));
    const armies = Array.from({ length: nArmies }, (_, i) => ({
        lat: 25 + (i % 20) * 0.3,
        lng: 110 + Math.floor(i / 20) * 0.3,
    }));

    const t0 = performance.now();
    for (let k = 0; k < iterations; k++) {
        for (const a of armies) {
            for (let c = 0; c < callsPerArmy; c++) {
                let min = Infinity;
                for (const city of cities) {
                    const dLat = city.lat - a.lat;
                    const dLon = city.lng - a.lng;
                    const d = dLat * dLat + dLon * dLon;
                    if (d < min) min = d;
                }
            }
        }
    }
    const ms = performance.now() - t0;
    const ops = iterations * nArmies * callsPerArmy * nCities;
    return { ms, ops, msPerFrame: ms / iterations };
}

console.log('════════ MAPWAR 静态性能审计 ════════\n');
console.log('数据规模:');
console.log(`  据点: ${cities}`);
console.log(`  势力 id 约: ${factions}`);
console.log('');

const scenarios = [
    { label: '10 军团 ×2 次最近城/帧', armies: 10, calls: 2 },
    { label: '30 军团 ×2 次最近城/帧', armies: 30, calls: 2 },
    { label: '80 军团 ×2 次最近城/帧', armies: 80, calls: 2 },
];

for (const s of scenarios) {
    const r = benchNearestCity(cities, s.armies, s.calls, 60);
    console.log(`${s.label} (模拟 60 帧):`);
    console.log(`  合计 ${r.ms.toFixed(1)}ms → 约 ${r.msPerFrame.toFixed(2)}ms/帧 (${(r.ops / 1e6).toFixed(2)}M 次距离比较)`);
}

console.log('\n代码热点（已核对源码）:');
console.log('  1. GlobalUnitRenderer: 独立 rAF，每帧 clearRect + 绘制全部单位（即使全静止）');
console.log('  2. LegionManager.update: 每军团最多 2× getNearestCity 全表 O(据点)');
console.log('  3. TerritorySystem: zoom 时 eachLayer 更新全部领土多边形样式');
console.log('  4. 双循环: GameApp.requestAnimationFrame + GlobalUnitRenderer.requestAnimationFrame');
console.log('  5. PerformanceMonitor 曾每秒 DEBUG 日志（已从沙盒路径移除）');
console.log('\n游戏内实测: Shift+` 打开监控 | Ctrl+Shift+T 隐藏领土/城市对比 FPS');
console.log('浏览器采样: npm run dev 后 node scripts/perf-profile.mjs http://localhost:5174\n');
