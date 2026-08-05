// 量真实路网下 TargetEvaluator.pickTarget 的单次成本（判断能否接进 headless 推演）。
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/bench_picktarget_real.mts
import { CITIES_V2 } from '../src/data/cities_v2';
import { roadRegistry } from '../src/roads/RoadRegistry';
import { TargetEvaluator } from '../src/ai/TargetEvaluator';
import type { City } from '../src/types/core';

// ⚠️ 必须同时保留 lat/lng（roadRegistry.initialize 按这两个字段建图）
// 和 latitude/longitude（City 类型 / TargetEvaluator 用）。只给后者会建出空图，
// pickTarget 全返回 null，跑分变成量空转。
const cities: City[] = CITIES_V2.map((c: any) => ({
    ...c,
    latitude: c.lat,
    longitude: c.lng,
    troops: c.troops ?? 1000,
})) as City[];

roadRegistry.initialize(cities as any);
console.log(`路网初始化: ${roadRegistry.isInitialized() ? 'OK' : 'FAIL'}，城 ${cities.length} 座`);

// 随机锚点（模拟推演里锚点四处开花，LRU=24 会频繁失效）
const ids = cities.map((c) => c.id);
const N = 2000;

let ok = 0;
const t0 = performance.now();
for (let i = 0; i < N; i++) {
    const anchor = ids[Math.floor(Math.random() * ids.length)];
    const me = cities.find((c) => c.id === anchor)!.factionId;
    const p = TargetEvaluator.pickTarget(me, anchor, anchor, cities, {});
    if (p) ok++;
}
const ms = performance.now() - t0;
console.log(`随机锚点 ${N} 次: 总 ${ms.toFixed(0)} ms，单次 ${(ms / N).toFixed(3)} ms，成功 ${ok}`);

// 局部锚点（连续攻城的军团锚点在少数城之间跳，缓存命中率高）
const hot = ids.slice(0, 12);
const t1 = performance.now();
for (let i = 0; i < N; i++) {
    const anchor = hot[i % hot.length];
    const me = cities.find((c) => c.id === anchor)!.factionId;
    TargetEvaluator.pickTarget(me, anchor, anchor, cities, {});
}
const ms1 = performance.now() - t1;
console.log(`热点锚点 ${N} 次: 总 ${ms1.toFixed(0)} ms，单次 ${(ms1 / N).toFixed(3)} ms`);
