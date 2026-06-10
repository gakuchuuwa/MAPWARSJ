import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';

const proposals = [
    '黄', '绿林',
    '鲜卑', '代',
    '安', '黔',
    '春申', '松江',
    '庐江', '李', '雷',
    '燕', '淮',
    '仲', '淮南',
    '西楚'
];

console.log('--- 校验推荐旗号是否被占用 ---');

for (const prop of proposals) {
    // 1. 查 factions.ts 中是否有这个 flag
    const faction = FACTIONS.find(f => f.name === prop);
    
    if (faction) {
        // 2. 查 cities_v2.ts 中是否有据点正在使用这个 faction
        const usingCities = CITIES_V2.filter(c => c.factionId === faction.id);
        if (usingCities.length > 0) {
            console.log(`❌ [${prop}] 已被占用！使用者: ${usingCities.map(c => c.name).join(', ')}`);
        } else {
            console.log(`⚠️ [${prop}] 存在于阵营库中 (ID: ${faction.id})，但目前无据点使用。可用！`);
        }
    } else {
        console.log(`✅ [${prop}] 全新旗号，完全可用！`);
    }
}
