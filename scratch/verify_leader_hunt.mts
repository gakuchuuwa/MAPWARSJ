// 验证 2026-08-05「枪打出头鸟」确定性改造：
//   ① 候选池（方向池）有全图据点最多的势力 → 100% 必打（确定性）
//   ② 无 40 城门槛（领头势力仅 3 城也触发）
//   ③ 候选池没有领头势力的城 → 正常随机，不回头打远处的领头城（anywhere 兜底已删）
//   ④ 自己就是据点最多 → 不打自己
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_leader_hunt.mts
import { TargetEvaluator } from '../src/ai/TargetEvaluator';
import { roadRegistry } from '../src/roads/RoadRegistry';
import type { City } from '../src/types/core';

const mk = (id: string, factionId: string): City => ({
    id, name: id, factionId, latitude: 0, longitude: 0, type: 'small_city', troops: 1000,
});

const rr: any = roadRegistry;
rr.isInitialized = () => true;
rr.getNearestCityId = () => 'city_a';

function mockRoad(reachableIds: string[]): void {
    const dist = new Map<string, number>();
    reachableIds.forEach((id, i) => dist.set(id, (i + 1) * 100));
    rr.getRoadDistancesKmFrom = () => dist;
    rr.getConnectedCities = (anchor: string) => (anchor === 'city_a' ? ['city_b', 'city_c', 'city_d'] : []);
    rr.findCityPath = (a: string, b: string): string[] | null => {
        if (a === b) return [a];
        const direct: Record<string, string[]> = {
            city_a: ['city_b', 'city_c', 'city_d'],
            city_d: ['city_e'],
            city_e: ['city_f'],
        };
        if (direct[a]?.includes(b)) return [a, b];
        if (a === 'city_a' && b === 'city_e') return ['city_a', 'city_d', 'city_e'];
        if (a === 'city_a' && b === 'city_f') return ['city_a', 'city_d', 'city_e', 'city_f'];
        if (a === 'city_a' && b === 'city_g') return ['city_a', 'city_d', 'city_e', 'city_g'];
        if (a === 'city_d' && b === 'city_f') return ['city_d', 'city_e', 'city_f'];
        return null;
    };
}

function run(factionId: string, cities: City[], N = 1000): Map<string, number> {
    const counts = new Map<string, number>();
    for (let i = 0; i < N; i++) {
        const picked = TargetEvaluator.pickTarget(factionId, 'city_a', 'city_a', cities, {});
        if (!picked) { counts.set('__null__', (counts.get('__null__') ?? 0) + 1); continue; }
        counts.set(picked.targetId, (counts.get(picked.targetId) ?? 0) + 1);
    }
    return counts;
}

const fmt = (m: Map<string, number>, N: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${(v / N * 100).toFixed(1)}%`).join('  ');

// ===== 场景 1：方向池里有领头势力（city_d），且领头仅 3 城（<40 = 无门槛） =====
{
    const cities = [
        mk('city_a', 'self_f'),
        mk('city_b', 'self_f'),
        mk('city_c', 'enemy_x'),
        mk('city_d', 'leader_f'),   // 方向池内，领头势力
        mk('city_e', 'leader_f'),   // 远处可达（不挨着）
        mk('city_f', 'leader_f'),   // 远处可达（不挨着）
    ];
    mockRoad(['city_c', 'city_d', 'city_e', 'city_f']);
    const N = 1000;
    const m = run('self_f', cities, N);
    console.log(`① 方向池有领头城（leader_f 仅 3 城）: ${fmt(m, N)}`);
    console.log(`   ✅ 100% 打 city_d（leader_f 最近） ${m.get('city_d') === N ? 'PASS' : 'FAIL'}`);
}

// ===== 场景 2：方向池没有领头城（leader_f 在远处，不挨着） → 正常随机、不回头 =====
{
    const cities = [
        mk('city_a', 'self_f'),
        mk('city_b', 'self_f'),
        mk('city_c', 'enemy_x'),
        mk('city_d', 'enemy_x'),    // 方向池内，非领头
        mk('city_e', 'leader_f'),   // 远处（不挨着，但可达）
        mk('city_f', 'leader_f'),
        mk('city_g', 'leader_f'),
    ];
    mockRoad(['city_c', 'city_d', 'city_e', 'city_f', 'city_g']);
    const N = 1000;
    const m = run('self_f', cities, N);
    const leaderHits = (m.get('city_e') ?? 0) + (m.get('city_f') ?? 0) + (m.get('city_g') ?? 0);
    console.log(`② 方向池无领头城（leader_f 3 城在远处）: ${fmt(m, N)}`);
    console.log(`   ✅ 只随机打挨着的 city_c/city_d，回头率 ${(leaderHits / N * 100).toFixed(1)}%（应为 0%） ${leaderHits === 0 ? 'PASS' : 'FAIL'}`);
}

// ===== 场景 3：自己就是据点最多的势力 → 跳过反雪球，正常随机 =====
{
    const cities = [
        mk('city_a', 'self_f'),
        mk('city_b', 'self_f'),
        mk('city_c', 'self_f'),     // self_f 3 城 = 全图最多
        mk('city_d', 'enemy_x'),
        mk('city_e', 'enemy_x'),
    ];
    mockRoad(['city_d', 'city_e']);
    rr.getConnectedCities = (anchor: string) => (anchor === 'city_a' ? ['city_b', 'city_c', 'city_d', 'city_e'] : []);
    rr.findCityPath = (a: string, b: string): string[] | null => {
        if (a === b) return [a];
        if (a === 'city_a' && ['city_b', 'city_c', 'city_d', 'city_e'].includes(b)) return [a, b];
        return null;
    };
    const N = 1000;
    const m = run('self_f', cities, N);
    console.log(`③ 自己=全图最多（3 城）: ${fmt(m, N)}`);
    console.log(`   ✅ 正常随机打敌城（50/50），不因自己是领头而异常 ${m.get('city_d')! > 300 && m.get('city_e')! > 300 ? 'PASS' : 'FAIL'}`);
}
