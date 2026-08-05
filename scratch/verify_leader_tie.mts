// 验证「开局全员 1 城」时 findLeaderFaction 的取值行为。
// 背景：cities_v2.ts 922 座城 = 922 个势力，开局人人恰好 1 城，不存在真正的领先者。
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_leader_tie.mts
import { TargetEvaluator } from '../src/ai/TargetEvaluator';
import { roadRegistry } from '../src/roads/RoadRegistry';
import type { City } from '../src/types/core';

const mk = (id: string, factionId: string): City => ({
    id, name: id, factionId, latitude: 0, longitude: 0, type: 'small_city', troops: 1000,
});

const rr: any = roadRegistry;
rr.isInitialized = () => true;

// 锚点 city_a 直连 b/c/d，三个方向各一座敌城，三家各 1 城（完全平局）
// 注意数组顺序：cities_v2.ts 里锚点城不一定排在最前，这里让 f_beta 的城排首位
// （若把自己的城排首位，自己会被选成「领头」，leader.factionId === factionId 直接跳过，测不到问题）
const cities: City[] = [
    mk('city_b', 'f_beta'),
    mk('city_a', 'f_self'),
    mk('city_c', 'f_gamma'),
    mk('city_d', 'f_delta'),
];

const dist = new Map([['city_b', 100], ['city_c', 200], ['city_d', 300]]);
rr.getRoadDistancesKmFrom = () => dist;
rr.getConnectedCities = (a: string) => (a === 'city_a' ? ['city_b', 'city_c', 'city_d'] : []);
rr.findCityPath = (a: string, b: string) =>
    a === b ? [a] : (a === 'city_a' && b !== 'city_a' ? [a, b] : null);

const N = 3000;
const counts = new Map<string, number>();
for (let i = 0; i < N; i++) {
    const p = TargetEvaluator.pickTarget('f_self', 'city_a', 'city_a', cities, {});
    const k = p?.targetId ?? '__null__';
    counts.set(k, (counts.get(k) ?? 0) + 1);
}

const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
console.log('平局（三家各 1 城）下的目标分布：');
for (const [id, n] of rows) console.log(`  ${id}: ${(n / N * 100).toFixed(1)}%`);

const top = rows[0];
const isDeterministic = top[1] === N;
console.log(
    isDeterministic
        ? `\n❌ 平局被当成「领头势力」：100% 锁死【${top[0]}】（数组首个），三方向抽签失效`
        : `\n✅ 平局不触发合击，三方向正常随机`
);

// 对照：只要有人拿到第 2 城，立刻成为全图领头
const cities2 = [...cities, mk('city_e', 'f_delta')];
rr.getRoadDistancesKmFrom = () => new Map([...dist, ['city_e', 400]]);
const counts2 = new Map<string, number>();
for (let i = 0; i < N; i++) {
    const p = TargetEvaluator.pickTarget('f_self', 'city_a', 'city_a', cities2, {});
    const k = p?.targetId ?? '__null__';
    counts2.set(k, (counts2.get(k) ?? 0) + 1);
}
const rows2 = [...counts2.entries()].sort((a, b) => b[1] - a[1]);
console.log('\n对照：f_delta 拿到第 2 城（2 城 vs 1 城）后的分布：');
for (const [id, n] of rows2) console.log(`  ${id}: ${(n / N * 100).toFixed(1)}%`);
