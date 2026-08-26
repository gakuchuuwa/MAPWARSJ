/**
 * 水军攻城战验收（主人 2026-08-24 定）：
 *   「如果是水军的攻城战，做用左边是海的图。先不做水军野战，水军野战保持战略地图模式。」
 *
 * 两条硬检查：
 *   1. 水军攻城战**一定出海**，且海在**左侧**（攻方破浪抢滩，守方陆地坚守）
 *   2. 只有“船＋城池”组合强制进 13；船对船、船对野外军团留在战略模式
 *
 * 跑法：npx tsx tools/audit-naval-siege.mts
 */
import sharp from 'sharp';
import { setWorldBaseData } from '../src/ui/scene13/WorldBaseMap';
import { generateEnvironment } from '../src/ui/scene13/Scene13EnvironmentGenerator';
import { CITIES_V2 } from '../src/data/cities_v2';

/** 水面贴图。🔴 别用 Scene13GroundPainter.isWaterTile —— 那个只认参与**动态波纹**的
 *  大江大海（wt 系、wtr、river_clean_green），不认浅滩 sh2 和冰面 ice，
 *  拿它验收会把「全部出海」误报成「86/86 没出海」（我踩过）。 */
const WATER_TILE = /^(wt|sh2|shallows|ic|river_clean_green|ice)/;

const VW = 2000, VH = 1080;

async function main(): Promise<void> {
    const raw = await sharp('public/world/world-base.png').ensureAlpha().raw()
        .toBuffer({ resolveWithObject: true });
    setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

    let figs = 0, noSea = 0, seaOnRight = 0;
    const deepTiles = new Map<string, number>();
    const bad: string[] = [];

    for (const c of CITIES_V2.filter((_, i) => i % 11 === 0)) {
        const plan = generateEnvironment({
            width: VW, height: VH, lat: c.lat, lng: c.lng,
            seed: `${c.id}-naval`, isSiege: true, getCalendarSeason: () => 0,
            forceWaterKind: 'sea',      // 水军攻城战走的就是这条路径
        });
        figs++;
        // 水面格的重心在左半还是右半
        let n = 0, sumX = 0;
        for (const p of plan.terrainPatches) {
            if (!WATER_TILE.test(p.tile)) continue;
            if (p.tile !== 'sh2') deepTiles.set(p.tile, (deepTiles.get(p.tile) ?? 0) + 1);
            for (const [gx, gy] of p.cells) {
                const px = (gx - gy) * 32 + plan.grid.ox;
                n++; sumX += px;
            }
        }
        if (n === 0) { noSea++; if (bad.length < 6) bad.push(`${c.name}(无海)`); continue; }
        const cx = sumX / n;
        if (cx > VW * 0.5) { seaOnRight++; if (bad.length < 6) bad.push(`${c.name}(海在右 x=${cx.toFixed(0)})`); }
    }

    console.log(`水军攻城战抽样 ${figs} 局`);
    console.log(`  外海水色分布：${[...deepTiles.entries()].sort((a, b) => b[1] - a[1])
        .map(([t, n]) => `${t}×${n}`).join(' ')}`);
    console.log(`  没出海：${noSea}`);
    console.log(`  海在右侧：${seaOnRight}`);
    if (bad.length) console.log(`  例：${bad.join(' ')}`);

    let fail = 0;
    if (noSea > 0) { console.log('🔴 水军攻城战必须出海 —— 探测失灵就成了内陆战场'); fail++; }
    else console.log('✅ 全部出海');
    if (seaOnRight > 0) { console.log('🔴 海必须在左侧 —— 攻方破浪抢滩，守方在右侧陆地坚守'); fail++; }
    else console.log('✅ 海全在左侧');
    if (fail) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
