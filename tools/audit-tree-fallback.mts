/**
 * 全量排查：942 座城 × 野战植被底图，区分「地区框覆盖」vs「掉回底图默认」。
 * 输出「掉回默认」的城清单（按底图分组），用于找漏网之鱼。
 * 跑法：npx tsx tools/audit-tree-fallback.mts
 */
import sharp from 'sharp';
import { setWorldBaseData, queryBaseTile } from '../src/ui/scene13/WorldBaseMap';
import { treeTables } from '../src/ui/scene13/TreeAssignment';
import { CITIES_V2 } from '../src/data/cities_v2';

async function main(): Promise<void> {
    const raw = await sharp('public/world/world-base.png').ensureAlpha().raw()
        .toBuffer({ resolveWithObject: true });
    setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

    const { byBase, regions } = treeTables();

    /** 掉回底图默认/兜底的城，按底图分组 */
    const fallbackByBase = new Map<string, { tree: string; cities: string[] }>();
    let covered = 0;
    let fallback = 0;

    for (const c of CITIES_V2) {
        // 🔴 植被看自然环境，用野战底图（vegetationTile），不用攻城底图
        const veg = queryBaseTile({ lat: c.lat, lng: c.lng, isSiege: false, isWinter: false });
        if (!veg) continue;

        // 手动匹配地区框（顺序敏感，先匹配先用）
        let hit = false;
        for (const r of regions) {
            const [s, n, w, e] = r.box;
            if (c.lat < s || c.lat > n || c.lng < w || c.lng > e) continue;
            if (r.bases && !r.bases.includes(veg)) continue;
            hit = true;
            break;
        }

        if (hit) {
            covered++;
            continue;
        }

        // 掉回底图默认（或兜底）
        fallback++;
        const tree = byBase[veg] ?? 'OAK(兜底)';
        const rec = fallbackByBase.get(veg) ?? { tree, cities: [] };
        rec.cities.push(`${c.name}(${c.lat.toFixed(1)},${c.lng.toFixed(1)})`);
        fallbackByBase.set(veg, rec);
    }

    console.log(`城池 ${CITIES_V2.length} 座`);
    console.log(`地区框覆盖 ${covered} 座 / 掉回底图默认 ${fallback} 座\n`);

    console.log('=== 掉回底图默认的城（按底图分组）===');
    for (const [base, rec] of [...fallbackByBase.entries()].sort((a, b) => b[1].cities.length - a[1].cities.length)) {
        console.log(`\n[${base}] 默认树=${rec.tree}  (${rec.cities.length} 座)`);
        // 每行最多 8 个城，太长换行
        for (let i = 0; i < rec.cities.length; i += 8) {
            console.log('  ' + rec.cities.slice(i, i + 8).join(' '));
        }
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
