// 【2026-08-07 更新】「行军惯性」（pickByMarchInertia）已按 GAKU 要求简化移除：
// 目标选择 = 方向池/候选池均匀随机，无「推进轴投影」判断。行为简单可预测。
// 本脚本改验简化后的均匀随机分布（身后城与前方城等概率，不再被强行滤掉）。
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_march_inertia.mts
import { TargetEvaluator } from '../src/ai/TargetEvaluator';
import { roadRegistry } from '../src/roads/RoadRegistry';
import type { City } from '../src/types/core';

// 布局：老家(0,0) — 锚点/前线城(0,5) — 军团站在 (0,5)
//   F 正前方 (0,6.0)   离军团 1.00
//   B 正后方 (0,4.5)   离军团 0.50  ← 更近（简化前惯性的「身后滤除」对象）
//   L 侧翼   (1,5.2)   离军团 1.02
const mk = (id: string, lat: number, lng: number, faction: string): City =>
  ({ id, name: id, factionId: faction, latitude: lat, longitude: lng, type: 'small_city', troops: 1000 } as City);

const HOME = 'home';
const ANCHOR = 'anchor';
const cities: City[] = [
  mk(HOME, 0, 0, 'me'),
  mk(ANCHOR, 0, 5, 'me'),
  mk('F_front', 0, 6.0, 'f1'),
  mk('B_behind', 0, 4.5, 'f2'),
  mk('L_flank', 1, 5.2, 'f3'),
];

const NEIGHBORS = ['F_front', 'B_behind', 'L_flank'];
const roadKm = new Map<string, number>([
  ['F_front', 110], ['B_behind', 55], ['L_flank', 120],
]);

const rr: any = roadRegistry;
rr.isInitialized = () => true;
rr.getRoadDistancesKmFrom = () => roadKm;
rr.getConnectedCities = (a: string) => (a === ANCHOR ? NEIGHBORS : []);
rr.findCityPath = (a: string, b: string): string[] | null => (a === b ? [a] : [a, b]);

console.log('===== 简化后：方向池均匀随机（无行军惯性） =====');
const counts = new Map<string, number>();
for (let i = 0; i < 3000; i++) {
  const p = TargetEvaluator.pickTarget('me', ANCHOR, HOME, cities, {});
  if (p) counts.set(p.targetId, (counts.get(p.targetId) ?? 0) + 1);
}
counts.forEach((n, id) => console.log(`  ${id}: ${(n / 30).toFixed(1)}%`));
const behindPct = (counts.get('B_behind') ?? 0) / 30;
const pass = behindPct > 25 && behindPct < 42; // 均匀随机 ≈ 33%，身后/前方等概率
console.log(`  → 身后城 B 概率 ${behindPct.toFixed(1)}%（均匀随机 ≈33%，不再被强行导向/滤除）→ ${pass ? '✅ PASS' : '❌ FAIL'}`);
