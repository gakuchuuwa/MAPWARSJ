/**
 * 树种原产地核对：有没有把树种到它长不出来的大洲去。
 *
 * 🔴 起因（2026-08-24）：atlas 里一眼看到**阿克苏姆（埃塞俄比亚）长亚洲枫**。
 *    根因是地区覆盖表的 `bases` 只列了几张底图，漏掉的那些落到底图默认树，
 *    而底图默认树是全球通用的，不认大洲。
 *
 * 这里只做**大陆级**的硬检查——不是植物学考据，是拦「亚洲枫长在非洲」这种级别的错。
 * 通用树（橡、桦、松、棕榈、战役阔叶大树）不设限，它们本来就到处都有。
 */
import sharp from 'sharp';
import { setWorldBaseData, queryBaseTile } from '../src/ui/scene13/WorldBaseMap';
import { pickTree, type TreeSeason } from '../src/ui/scene13/TreeAssignment';
import { CITIES_V2 } from '../src/data/cities_v2';

/** 允许的经纬度范围 [南, 北, 西, 东]，可以有多块 */
type Range = ReadonlyArray<readonly [number, number, number, number]>;

const ORIGIN: Readonly<Record<string, Range>> = {
    // 东亚特有
    ASIAN_MAPLE_GREEN:  [[15, 58, 68, 150]],
    ASIAN_MAPLE_AUTUMN: [[15, 58, 68, 150]],
    PEACH_BLOSSOM:      [[15, 55, 90, 150]],
    BAMBOO:             [[-12, 40, 68, 150]],
    LUSH_BAMBOO:        [[-12, 40, 68, 150]],
    // 非洲 / 阿拉伯
    BAOBAB:             [[-35, 20, -20, 55]],
    ACACIA:             [[-35, 32, -20, 95]],   // 非洲 + 阿拉伯 + 印度干旱区
    // 美洲
    MONKEY_PUZZLE:      [[-56, 10, -110, -34]],
    BRAZILWOOD:         [[-35, 25, -110, -34], [-12, 30, 90, 150]],  // 南美 + 南洋(外观通用热带阔叶)
    // 地中海 / 西亚
    ITALIAN_PINE:       [[27, 50, -12, 45]],
    OLIVE:              [[24, 48, -14, 62]],
    CYPRESS:            [[20, 50, -12, 110]],   // 地中海到中亚，中式柏也在内
    CYPRESS_DEC:        [[20, 50, -12, 110]],
    // 亚洲针叶
    ASIAN_PINE:         [[-12, 70, 20, 155]],
    SNOW_PINE:          [[-60, 80, -180, 180]], // 针叶到处都有，不设限
    // 其余（橡/桦/柳/棕榈/枯树/红树/龙血树/战役大树）不设限
};

async function main(): Promise<void> {
    const raw = await sharp('public/world/world-base.png').ensureAlpha().raw()
        .toBuffer({ resolveWithObject: true });
    setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

    /** key = 树|底图，值 = 犯规的城 */
    const bad = new Map<string, string[]>();
    let checked = 0;

    for (const c of CITIES_V2) {
        for (const isSiege of [true, false]) {
            for (const season of [0, 1, 2] as TreeSeason[]) {
                const veg = queryBaseTile({
                    lat: c.lat, lng: c.lng, isSiege: false, isWinter: season === 2,
                });
                if (!veg) continue;
                const tree = pickTree({ baseTile: veg, lat: c.lat, lng: c.lng, season, isSiege });
                checked++;
                const ranges = ORIGIN[tree];
                if (!ranges) continue;
                const ok = ranges.some(([s, n, w, e]) =>
                    c.lat >= s && c.lat <= n && c.lng >= w && c.lng <= e);
                if (ok) continue;
                const k = tree + ' ← ' + veg;
                const arr = bad.get(k) ?? [];
                if (arr.length < 5) arr.push(`${c.name}(${c.lat.toFixed(1)},${c.lng.toFixed(1)})`);
                bad.set(k, arr);
            }
        }
    }

    console.log(`核对 ${checked} 个组合`);
    if (bad.size === 0) { console.log('✅ 没有把树种到长不出来的大洲去'); return; }
    console.log(`🔴 ${bad.size} 种错配：\n`);
    for (const [k, cities] of [...bad.entries()].sort()) {
        console.log(`  ${k.padEnd(34)} ${cities.join(' ')}`);
    }
    console.log('\n修法：给 TreeAssignment 的 REGION_TREES 补上漏掉的 bases，或加地区框。');
    process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
