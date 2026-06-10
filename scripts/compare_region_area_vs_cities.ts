/**
 * 文化区：多边形面积占比 vs 据点数量占比 → 找出偏密/偏疏
 */
import { CITIES_V2 } from '../src/data/cities_v2';
import { getCityRegion, REGION_LABELS, REGION_ORDER, RegionType } from '../src/systems/RegionSystem';

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

const R = 6_371_000;
function polygonAreaM2(ring: { lat: number; lng: number }[]): number {
    let sum = 0;
    for (let i = 0; i < ring.length; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % ring.length];
        const lat1 = (p1.lat * Math.PI) / 180;
        const lat2 = (p2.lat * Math.PI) / 180;
        const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
        sum += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs((sum * R * R) / 2);
}

const areaWan = new Map<RegionType, number>();
let totalArea = 0;
for (const r of REGIONS) {
    const w = polygonAreaM2(r.polygon) / 1e10;
    areaWan.set(r.id, w);
    totalArea += w;
}

const cityCount = new Map<RegionType, number>();
for (const id of REGION_ORDER) cityCount.set(id, 0);
for (const c of CITIES_V2) {
    const r = getCityRegion({ latitude: c.lat, longitude: c.lng, region: c.region });
    cityCount.set(r, (cityCount.get(r) ?? 0) + 1);
}
const totalCities = CITIES_V2.length;

interface Row {
    id: RegionType;
    label: string;
    cities: number;
    cityPct: number;
    areaPct: number;
    density: number; // 城/万km²
    avgDensity: number;
    ratio: number; // cityPct/areaPct
    deltaCities: number; // 若按面积比例应有的城数 - 实际
}

const avgDensity = totalCities / totalArea;

const rows: Row[] = REGION_ORDER.map((id) => {
    const cities = cityCount.get(id) ?? 0;
    const area = areaWan.get(id) ?? 0;
    const cityPct = (cities / totalCities) * 100;
    const areaPct = (area / totalArea) * 100;
    const density = cities / area;
    const expectedCities = (area / totalArea) * totalCities;
    return {
        id,
        label: REGION_LABELS[id],
        cities,
        cityPct,
        areaPct,
        density,
        avgDensity,
        ratio: areaPct > 0 ? cityPct / areaPct : 0,
        deltaCities: expectedCities - cities,
    };
});

rows.sort((a, b) => b.ratio - a.ratio);

console.log(`全图 ${totalCities} 据点 · 多边形面积合计 ${totalArea.toFixed(0)} 万km²（含重叠）`);
console.log(`平均密度 ${avgDensity.toFixed(2)} 城/万km²\n`);
console.log('文化区\t据点\t据点%\t面积%\t城/万km²\t密度比*\t按面积应有±城');
console.log('—'.repeat(72));

for (const x of rows) {
    const densityRatio = (x.density / avgDensity).toFixed(2);
    const delta = x.deltaCities >= 0 ? `+${x.deltaCities.toFixed(0)}` : x.deltaCities.toFixed(0);
    let tag = '';
    if (x.ratio >= 1.35) tag = ' 【偏多】';
    else if (x.ratio <= 0.65) tag = ' 【偏少】';
    console.log(
        `${x.label}\t${x.cities}\t${x.cityPct.toFixed(1)}%\t${x.areaPct.toFixed(1)}%\t` +
            `${x.density.toFixed(2)}\t${densityRatio}\t${delta}${tag}`,
    );
}

console.log('\n* 密度比 = (城/万km²) ÷ 全图平均；据点%/面积% >1.35 为偏多，<0.65 为偏少');
console.log('  「按面积应有±城」= 若据点按面积占比均匀分布时的差额（整数约数，仅供参考）');

const over = rows.filter((x) => x.ratio >= 1.35).map((x) => x.label);
const under = rows.filter((x) => x.ratio <= 0.65).map((x) => x.label);
console.log('\n建议优先考虑：');
console.log('  减据点或不再增密 → ' + (over.length ? over.join('、') : '无'));
console.log('  增据点 → ' + (under.length ? under.join('、') : '无'));
