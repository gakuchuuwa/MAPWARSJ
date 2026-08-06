// 验证 2026-08-06「行军惯性」：半路重抽时，方向池里更近但在**身后**的城不该被选。
// 用真实 TargetEvaluator.pickTarget，只把 roadRegistry 换成几何布置好的桩。
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_march_inertia.mts
import { TargetEvaluator } from '../src/ai/TargetEvaluator';
import { roadRegistry } from '../src/roads/RoadRegistry';
import type { City } from '../src/types/core';

// 布局：老家(0,0) — 锚点/前线城(0,5) — 军团已推进到 (0,5)
//   F 正前方 (0,6.0)   离军团 1.00   投影 >0
//   B 正后方 (0,4.5)   离军团 0.50   投影 <0   ← 更近，旧「全池最近」会选它 = 折返
//   L 侧翼   (1,5.2)   离军团 1.02   投影 >0
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

const armyPos = { lat: 0, lng: 5 }; // 军团站在锚点上，已离家 5°

// —— 方向池内容自检（B 必须真的在池里，否则这个用例测不到东西）——
const pool = TargetEvaluator.evaluate('me', ANCHOR, cities, {});
console.log(`可达敌城: ${pool.map(p => p.targetId).join(', ')}`);

// —— 无 fromPosition：等概率随机（旧行为）——
const counts = new Map<string, number>();
for (let i = 0; i < 3000; i++) {
  const p = TargetEvaluator.pickTarget('me', ANCHOR, HOME, cities, {});
  if (p) counts.set(p.targetId, (counts.get(p.targetId) ?? 0) + 1);
}
console.log('\n[无惯性] 3000 次抽签分布:');
counts.forEach((n, id) => console.log(`  ${id}: ${(n / 30).toFixed(1)}%`));
const behindPct = (counts.get('B_behind') ?? 0) / 30;
console.log(`  → 抽到身后城 B 的概率 ${behindPct.toFixed(1)}%（这就是折返来源）`);

// —— 有 fromPosition：应恒定选朝前的最近一座 F ——
const picks = new Set<string>();
for (let i = 0; i < 3000; i++) {
  const p = TargetEvaluator.pickTarget('me', ANCHOR, HOME, cities, { fromPosition: armyPos });
  if (p) picks.add(p.targetId);
}
console.log(`\n[有惯性] 3000 次结果集合: {${[...picks].join(', ')}}`);
console.log(`  期望 = {F_front}（B 更近但在身后，须被推进轴滤掉）→ ${picks.size === 1 && picks.has('F_front') ? '✅ PASS' : '❌ FAIL'}`);

// —— 边界：军团还在老家（无轴）→ 退回全池最近，不应崩 ——
const atHome = TargetEvaluator.pickTarget('me', ANCHOR, HOME, cities, { fromPosition: { lat: 0, lng: 0 } });
console.log(`\n[边界·军团在老家无推进轴] 选中 ${atHome?.targetId}（退回全池最近，不崩即可）`);

// —— 边界：全池都在身后 → 退回全池最近 ——
const behindOnly: City[] = [mk(HOME, 0, 0, 'me'), mk(ANCHOR, 0, 5, 'me'), mk('B1', 0, 4.6, 'f2'), mk('B2', 0, 4.8, 'f3')];
rr.getConnectedCities = (a: string) => (a === ANCHOR ? ['B1', 'B2'] : []);
rr.getRoadDistancesKmFrom = () => new Map([['B1', 60], ['B2', 40]]);
const allBehind = TargetEvaluator.pickTarget('me', ANCHOR, HOME, behindOnly, { fromPosition: armyPos });
console.log(`[边界·全池在身后] 选中 ${allBehind?.targetId ?? 'null'}（应为离军团最近的 B2，不能返回 null）→ ${allBehind?.targetId === 'B2' ? '✅ PASS' : '❌ FAIL'}`);
