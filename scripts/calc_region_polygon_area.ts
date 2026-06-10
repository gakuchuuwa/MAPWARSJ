/**
 * 按 RegionSystem.ts 中 14 区多边形顶点估算球面面积（万 km²）
 * 注意：各区多边形在地图上互相交叠，面积之和 > 实际覆盖；与 getRegion 判定顺序无关。
 */
import { REGION_LABELS, REGION_ORDER, RegionType } from '../src/systems/RegionSystem';

// 与 RegionSystem.ts REGIONS 同步
const REGIONS: { id: RegionType; polygon: { lat: number; lng: number }[] }[] = [
    { id: 'CENTRAL', polygon: [{ lat: 33.07, lng: 107.02 }, { lat: 32.01, lng: 112.12 }, { lat: 32.45, lng: 119.4 }, { lat: 37.51, lng: 122.12 }, { lat: 36.59, lng: 109.48 }, { lat: 36.04, lng: 103.82 }] },
    { id: 'NORTH', polygon: [{ lat: 37.51, lng: 122.12 }, { lat: 36.59, lng: 109.48 }, { lat: 40.84, lng: 111.68 }, { lat: 41.27, lng: 123.17 }] },
    { id: 'NORTHEAST', polygon: [{ lat: 41.27, lng: 123.17 }, { lat: 41.13, lng: 126.19 }, { lat: 41.8, lng: 140.1 }, { lat: 52.21, lng: 141.95 }, { lat: 49.25, lng: 118.26 }] },
    { id: 'KOREA', polygon: [{ lat: 41.27, lng: 123.17 }, { lat: 37.51, lng: 122.12 }, { lat: 32.45, lng: 119.4 }, { lat: 34.2, lng: 129.29 }, { lat: 41.8, lng: 140.1 }, { lat: 41.13, lng: 126.19 }] },
    { id: 'JAPAN', polygon: [{ lat: 41.8, lng: 140.1 }, { lat: 34.2, lng: 129.29 }, { lat: 32.45, lng: 119.4 }, { lat: 28.45, lng: 129.67 }, { lat: 35.68, lng: 139.76 }, { lat: 38.99, lng: 141.12 }, { lat: 40.5, lng: 141.46 }] },
    { id: 'WESTERN', polygon: [{ lat: 42.83, lng: 93.51 }, { lat: 38.99, lng: 88.95 }, { lat: 34.57, lng: 80.35 }, { lat: 37.77, lng: 75.23 }, { lat: 44.1, lng: 79.81 }] },
    { id: 'HEXI', polygon: [{ lat: 36.04, lng: 103.82 }, { lat: 37.93, lng: 102.64 }, { lat: 38.99, lng: 88.95 }, { lat: 42.83, lng: 93.51 }, { lat: 40.84, lng: 111.68 }, { lat: 36.59, lng: 109.48 }] },
    { id: 'STEPPE', polygon: [{ lat: 41.27, lng: 123.17 }, { lat: 40.84, lng: 111.68 }, { lat: 42.83, lng: 93.51 }, { lat: 44.1, lng: 79.81 }, { lat: 46.48, lng: 83.63 }, { lat: 47.79, lng: 88.12 }, { lat: 49.95, lng: 92.1 }, { lat: 49.66, lng: 95.77 }, { lat: 50.32, lng: 106.49 }, { lat: 49.25, lng: 118.26 }] },
    { id: 'BASHU', polygon: [{ lat: 32.01, lng: 112.12 }, { lat: 26.89, lng: 112.6 }, { lat: 28.08, lng: 104.25 }, { lat: 30.05, lng: 101.96 }, { lat: 36.04, lng: 103.82 }, { lat: 33.07, lng: 107.02 }] },
    { id: 'JIANGNAN', polygon: [{ lat: 32.45, lng: 119.4 }, { lat: 32.01, lng: 112.12 }, { lat: 26.89, lng: 112.6 }, { lat: 28.45, lng: 129.67 }] },
    { id: 'LINGNAN', polygon: [{ lat: 28.08, lng: 104.25 }, { lat: 26.89, lng: 112.6 }, { lat: 28.45, lng: 129.67 }, { lat: 26.22, lng: 127.72 }, { lat: 22.2, lng: 120.83 }, { lat: 13.93, lng: 109.11 }, { lat: 13.41, lng: 103.86 }] },
    { id: 'DIANQIAN', polygon: [{ lat: 30.05, lng: 101.96 }, { lat: 26.87, lng: 100.22 }, { lat: 27.72, lng: 85.19 }, { lat: 17.33, lng: 96.47 }, { lat: 16.53, lng: 97.63 }, { lat: 14.35, lng: 100.58 }, { lat: 13.41, lng: 103.86 }, { lat: 28.08, lng: 104.25 }] },
    { id: 'TIBET', polygon: [{ lat: 27.72, lng: 85.19 }, { lat: 36.73, lng: 71.61 }, { lat: 37.77, lng: 75.23 }, { lat: 34.57, lng: 80.35 }, { lat: 38.99, lng: 88.95 }, { lat: 37.93, lng: 102.64 }, { lat: 36.04, lng: 103.82 }, { lat: 30.05, lng: 101.96 }, { lat: 26.87, lng: 100.22 }] },
    { id: 'CENTRAL_ASIA', polygon: [{ lat: 37.77, lng: 75.23 }, { lat: 36.73, lng: 71.61 }, { lat: 35.58, lng: 63.31 }, { lat: 36, lng: 62.7 }, { lat: 37.62, lng: 62.23 }, { lat: 42.24, lng: 59.63 }, { lat: 43.3, lng: 68.27 }, { lat: 44.1, lng: 79.81 }] },
];

const EARTH_R_M = 6_371_000;

/** 球面多边形面积（m²），经纬度度数 */
function polygonAreaM2(ring: { lat: number; lng: number }[]): number {
    let sum = 0;
    const n = ring.length;
    for (let i = 0; i < n; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % n];
        const lat1 = (p1.lat * Math.PI) / 180;
        const lat2 = (p2.lat * Math.PI) / 180;
        const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
        sum += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs((sum * EARTH_R_M * EARTH_R_M) / 2);
}

function toWanKm2(m2: number): number {
    return m2 / 1e10; // 1 万 km² = 10^10 m²
}

const rows: { id: RegionType; label: string; wanKm2: number; km2: number }[] = [];

for (const r of REGIONS) {
    const m2 = polygonAreaM2(r.polygon);
    rows.push({
        id: r.id,
        label: REGION_LABELS[r.id],
        wanKm2: toWanKm2(m2),
        km2: m2 / 1e6,
    });
}

rows.sort((a, b) => b.wanKm2 - a.wanKm2);

const totalWan = rows.reduce((s, x) => s + x.wanKm2, 0);

console.log('14 文化区多边形球面面积估算（按 RegionSystem 顶点环）\n');
console.log('区名(代码)\t\t面积(万km²)\t面积(km²)\t占比*');
console.log('—'.repeat(60));
for (const x of rows) {
    const pct = ((x.wanKm2 / totalWan) * 100).toFixed(1);
    console.log(
        `${x.label}(${x.id})\t${x.wanKm2.toFixed(1)}\t\t${Math.round(x.km2).toLocaleString()}\t${pct}%`,
    );
}
console.log('—'.repeat(60));
console.log(`合计(含重叠)\t${totalWan.toFixed(1)} 万km²`);
console.log('\n* 占比为各环面积相加后的份额，因多边形互有交叠，合计远大于东亚—中亚地图实际覆盖。');
console.log('  游戏内以 getRegion 点-in-多边形 + 判定顺序为准，不是按面积切分。');

// 按 REGION_ORDER 再打一版方便对照
console.log('\n按 REGION_ORDER 顺序：');
for (const id of REGION_ORDER) {
    const x = rows.find((r) => r.id === id)!;
    console.log(`  ${REGION_LABELS[id]}: ${x.wanKm2.toFixed(1)} 万km²`);
}
