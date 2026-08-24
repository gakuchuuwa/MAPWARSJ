/**
 * 冬季积雪判定核对：有没有在不下雪的地方下雪。
 *
 * 🔴 起因（2026-08-24）：**罗得岛、克里特岛(诺索斯)、底比斯这些爱琴海城冬天结了冰**。
 *    地中海从不结冰。根因是旧的 `isSnowArea` 对「温带中高纬」一律返回 true，
 *    纯按纬度估，不看实际气温。
 *
 * 现在积雪只认 world-base 的冬季标志（WorldClim 实测气温），和底图同源。
 * 这个脚本核对结果符不符合史实/地理常识。
 *
 * 跑法：npx tsx tools/audit-winter-snow.mts
 */
import sharp from 'sharp';
import { setWorldBaseData } from '../src/ui/scene13/WorldBaseMap';
import { isSnowArea } from '../src/ui/scene13/Scene13DeMapThemes';
import { CITIES_V2 } from '../src/data/cities_v2';

/** 人工核对点：这些地方冬天到底下不下雪，是常识 */
const KNOWN: ReadonlyArray<{ name: string; lat: number; lng: number; snow: boolean; why: string }> = [
    // ── 不该有雪 ──
    { name: '罗得岛',   lat: 36.43, lng: 28.22, snow: false, why: '爱琴海，冬季均温 12°C' },
    { name: '克里特',   lat: 35.30, lng: 25.15, snow: false, why: '地中海最南，从不结冰' },
    { name: '雅典',     lat: 37.98, lng: 23.73, snow: false, why: '地中海，冬季均温 10°C' },
    { name: '亚历山大', lat: 31.20, lng: 29.92, snow: false, why: '埃及沿海' },
    { name: '广州',     lat: 23.13, lng: 113.26, snow: false, why: '岭南亚热带' },
    { name: '马六甲',   lat: 2.20, lng: 102.25, snow: false, why: '赤道' },
    { name: '巴格达',   lat: 33.31, lng: 44.36, snow: false, why: '两河流域低地' },
    { name: '开罗',     lat: 30.04, lng: 31.24, snow: false, why: '尼罗河三角洲' },
    { name: '里斯本',   lat: 38.72, lng: -9.14, snow: false, why: '大西洋沿岸海洋性' },
    // ── 该有雪 ──
    { name: '莫斯科',   lat: 55.75, lng: 37.62, snow: true, why: '俄罗斯内陆，冬季 -8°C' },
    { name: '哈尔滨',   lat: 45.80, lng: 126.53, snow: true, why: '东北，冬季 -18°C' },
    { name: '诺夫哥罗德', lat: 58.52, lng: 31.27, snow: true, why: '俄罗斯西北' },
    { name: '乌普萨拉', lat: 59.86, lng: 17.64, snow: true, why: '瑞典' },
    { name: '拉萨',     lat: 29.65, lng: 91.14, snow: true, why: '青藏高原 3650m' },
    { name: '和林',     lat: 47.20, lng: 102.84, snow: true, why: '蒙古高原' },
];

async function main(): Promise<void> {
    const raw = await sharp('public/world/world-base.png').ensureAlpha().raw()
        .toBuffer({ resolveWithObject: true });
    setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

    let fail = 0;
    console.log('人工核对点：');
    for (const k of KNOWN) {
        // biome 传一个中性值：现在判据只看气候数据，不该被 biome 左右
        const got = isSnowArea(k.lat, null, 'temperate_forest', k.lng);
        const ok = got === k.snow;
        if (!ok) fail++;
        console.log(`  ${ok ? '✅' : '🔴'} ${k.name.padEnd(6)} 期望${k.snow ? '有雪' : '无雪'} 实际${got ? '有雪' : '无雪'}   ${k.why}`);
    }

    // 全量分布：看看多少座城冬天有雪，比例是否合理
    let snowy = 0;
    const byLat = new Map<string, { n: number; snow: number }>();
    for (const c of CITIES_V2) {
        const s = isSnowArea(c.lat, null, 'temperate_forest', c.lng);
        if (s) snowy++;
        const band = c.lat >= 50 ? '50°N+' : c.lat >= 40 ? '40~50°N'
            : c.lat >= 30 ? '30~40°N' : c.lat >= 20 ? '20~30°N' : '20°N以下';
        const b = byLat.get(band) ?? { n: 0, snow: 0 };
        b.n++; if (s) b.snow++;
        byLat.set(band, b);
    }
    console.log(`\n全量 ${CITIES_V2.length} 座城：${snowy} 座冬天积雪（${(snowy / CITIES_V2.length * 100).toFixed(0)}%）`);
    for (const band of ['50°N+', '40~50°N', '30~40°N', '20~30°N', '20°N以下']) {
        const b = byLat.get(band);
        if (!b) continue;
        console.log(`  ${band.padEnd(10)} ${String(b.snow).padStart(3)}/${String(b.n).padStart(3)}  ${(b.snow / b.n * 100).toFixed(0)}%`);
    }

    if (fail) {
        console.log(`\n🔴 ${fail} 个核对点不符合地理常识`);
        process.exit(1);
    }
    console.log('\n✅ 全部核对点符合');
}

main().catch((e) => { console.error(e); process.exit(1); });
