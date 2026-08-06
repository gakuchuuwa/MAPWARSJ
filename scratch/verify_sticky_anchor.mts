// 【2026-08-07 更新】「推进锚点迟滞」（resolveStickyAnchor）已按 GAKU 要求简化移除：
// 锚点 = resolveForwardAnchor 直接取「离军团道路距离最近的己方城」，无跨帧状态、行为确定性。
// 本脚本改验简化后的锚点选择 + 飞地排除。
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_sticky_anchor.mts
import { CITIES_V2 } from '../src/data/cities_v2';
import { roadRegistry } from '../src/roads/RoadRegistry';
import { resolveForwardAnchor } from '../src/ai/TargetAnchorResolver';
import type { City } from '../src/types/core';

roadRegistry.initialize(CITIES_V2 as any);

const ME = 'yilihanguo';
const ZANJAN = 'city_zanzhan';       // 老家（阿杰姆首都）
const ISFAHAN = 'city_yisifahan';    // 刚打下的前线城
const PERSEPOLIS = 'city_bosibolisi';

const allCities: City[] = (CITIES_V2 as any[]).map((c) => ({ ...c, latitude: c.lat, longitude: c.lng } as City));
const toCity = (id: string) => allCities.find((c) => c.id === id)!;

// 阿杰姆占 [赞詹, 波斯波利斯, 伊斯法罕]
const owned = new Set([ZANJAN, PERSEPOLIS, ISFAHAN]);
const cm = {
    getCity: (id: string) => {
        const c = toCity(id);
        return owned.has(c.id) ? { ...c, factionId: ME } : c;
    },
    getCitiesByFaction: (fid: string) => allCities.filter((c) => fid === ME ? owned.has(c.id) : c.factionId === fid),
};

console.log('===== 简化后锚点选择（resolveForwardAnchor 直接取最近，无迟滞） =====');

// 1. 军团在伊斯法罕（刚打下）→ 锚点应为伊斯法罕（0km）
{
    const pos = { lat: toCity(ISFAHAN).latitude, lng: toCity(ISFAHAN).longitude };
    const stand = roadRegistry.getNearestCityId(pos.lat, pos.lng)!;
    const rd = roadRegistry.getRoadDistancesKmFrom(stand);
    const anchor = resolveForwardAnchor(pos, ME, ZANJAN, cm as any, rd);
    console.log(`${anchor === ISFAHAN ? '✅' : '❌'} 军团在伊斯法罕 → 锚点=${toCity(anchor).name}（期望 伊斯法罕）`);
}

// 2. 军团在波斯波利斯 → 锚点应为波斯波利斯（0km）
{
    const pos = { lat: toCity(PERSEPOLIS).latitude, lng: toCity(PERSEPOLIS).longitude };
    const stand = roadRegistry.getNearestCityId(pos.lat, pos.lng)!;
    const rd = roadRegistry.getRoadDistancesKmFrom(stand);
    const anchor = resolveForwardAnchor(pos, ME, ZANJAN, cm as any, rd);
    console.log(`${anchor === PERSEPOLIS ? '✅' : '❌'} 军团在波斯波利斯 → 锚点=${toCity(anchor).name}（期望 波斯波利斯）`);
}

// 3. 深入敌境（伊斯法罕→雷伊路上，离所有己方城远）→ 锚点 = 道路距离最近的己方城 = 伊斯法罕
{
    const pos = { lat: 34.0, lng: 50.6 }; // 雷伊与伊斯法罕之间
    const stand = roadRegistry.getNearestCityId(pos.lat, pos.lng)!;
    const rd = roadRegistry.getRoadDistancesKmFrom(stand);
    const anchor = resolveForwardAnchor(pos, ME, ZANJAN, cm as any, rd);
    console.log(`${anchor === ISFAHAN ? '✅' : '❌'} 深入敌境(34.0,50.6) → 锚点=${toCity(anchor).name}（期望 伊斯法罕=最近己方城）`);
}

// 4. 飞地排除：若己方有隔海飞地（如日本方向城），道路距离表不含它 → 不被选为锚点
{
    const pos = { lat: 32.65, lng: 51.66 }; // 伊斯法罕
    const stand = roadRegistry.getNearestCityId(pos.lat, pos.lng)!;
    const rd = roadRegistry.getRoadDistancesKmFrom(stand);
    // 把一座日本方向的城临时加入己方（模拟飞地）
    const fly = allCities.find((c) => c.id === 'city_jianghu' || c.id === 'city_edo' || c.id === 'city_heian' || c.id === 'city_kyoto') ?? allCities.find((c) => c.lng > 135)!;
    const rdClone = new Map(rd);
    const flyKm = rdClone.get(fly.id);
    console.log(`  飞地候选 ${fly.name}: ${flyKm === undefined ? '路网不可达（正确排除）' : `道路可达 ${flyKm.toFixed(0)}km（会参与比较）`}`);
}
