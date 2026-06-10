/**
 * 快速校验 TargetAnchorResolver（非沙盒全流程）
 * 运行: npx tsx scripts/verify_ai_target_anchor.ts
 */
import { isHomeCityLost, resolveForwardAnchor } from '../src/ai/TargetAnchorResolver';
import type { City } from '../src/types/core';

const cities = new Map<string, City>([
    [
        'city_a',
        {
            id: 'city_a',
            name: '甲',
            factionId: 'f1',
            latitude: 34,
            longitude: 108,
            type: 'big_city',
            troops: 10000,
        },
    ],
    [
        'city_b',
        {
            id: 'city_b',
            name: '乙',
            factionId: 'f1',
            latitude: 35,
            longitude: 110,
            type: 'medium_city',
            troops: 5000,
        },
    ],
    [
        'city_c',
        {
            id: 'city_c',
            name: '丙',
            factionId: 'f2',
            latitude: 34.5,
            longitude: 109,
            type: 'small_city',
            troops: 5000,
        },
    ],
]);

const mgr = {
    getCity: (id: string) => cities.get(id),
    getCitiesByFaction: (fid: string) =>
        [...cities.values()].filter((c) => c.factionId === fid),
};

// 丢失：home 属敌
cities.get('city_a')!.factionId = 'f2';
console.assert(isHomeCityLost('city_a', 'f1', mgr), 'home lost when enemy holds');

// 未丢失
cities.get('city_a')!.factionId = 'f1';
console.assert(!isHomeCityLost('city_a', 'f1', mgr), 'home ok when friendly');

// 锚点：靠近乙
const anchor = resolveForwardAnchor({ lat: 34.9, lng: 109.9 }, 'f1', 'city_a', mgr);
console.assert(anchor === 'city_b', `anchor should be city_b, got ${anchor}`);

console.log('verify_ai_target_anchor: OK');
