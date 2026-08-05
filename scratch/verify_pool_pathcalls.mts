// 量方向池的 findCityPath 调用次数（提前退出优化前后对比）。
// 模拟开局规模：锚点 3 条直连道路，全图 900 座敌城全部可达。
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_pool_pathcalls.mts
import { TargetEvaluator } from '../src/ai/TargetEvaluator';
import { roadRegistry } from '../src/roads/RoadRegistry';
import type { City } from '../src/types/core';

const N_CITIES = 900;
const NEIGHBORS = ['hop_0', 'hop_1', 'hop_2'];

const cities: City[] = [
    { id: 'anchor', name: 'anchor', factionId: 'me', latitude: 0, longitude: 0, type: 'small_city', troops: 1000 },
];
const dist = new Map<string, number>();
for (let i = 0; i < N_CITIES; i++) {
    const id = `c_${i}`;
    // 每家 1 城，避免触发枪打出头鸟（平局守卫），测的是纯方向池路径
    cities.push({ id, name: id, factionId: `f_${i}`, latitude: 0, longitude: 0, type: 'small_city', troops: 1000 });
    dist.set(id, 100 + i); // 已升序
}
// 三个 hop 城本身也是敌城，排在最前
NEIGHBORS.forEach((h, i) => {
    cities.push({ id: h, name: h, factionId: `hf_${i}`, latitude: 0, longitude: 0, type: 'small_city', troops: 1000 });
    dist.set(h, 10 + i);
});

let calls = 0;
const rr: any = roadRegistry;
rr.isInitialized = () => true;
rr.getRoadDistancesKmFrom = () => dist;
rr.getConnectedCities = (a: string) => (a === 'anchor' ? NEIGHBORS : []);
rr.findCityPath = (a: string, b: string): string[] | null => {
    calls++;
    if (a === b) return [a];
    if (NEIGHBORS.includes(b)) return [a, b];
    const hop = NEIGHBORS[Number(b.slice(2)) % NEIGHBORS.length];
    return [a, hop, b];
};

const t0 = performance.now();
const picked = TargetEvaluator.pickTarget('me', 'anchor', 'anchor', cities, {});
const ms = performance.now() - t0;

console.log(`可达敌城 ${dist.size} 座、直连方向 ${NEIGHBORS.length} 条`);
console.log(`findCityPath 调用次数: ${calls}（优化前 = 每座敌城各一次 = ${dist.size}）`);
console.log(`单次 pickTarget 耗时: ${ms.toFixed(2)} ms，选中 ${picked?.targetId}`);
console.log(calls <= NEIGHBORS.length + 1 ? '✅ 各方向定案即收工' : `❌ 未提前退出（${calls} 次）`);
