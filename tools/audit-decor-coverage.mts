/**
 * 装饰**覆盖面积**验收 —— 这才是「配比」该有的判据。
 *
 * 🔴 [2026-08-24 主人：「这个有必要这么多草吗？素材的配比现在完全是按 DE 的比例
 *    进行的分配吗？全面检查」]
 *
 *    此前只核对**数量**（石头 DE 68/20736 格 → 我们 9.8/屏），漏了**单体尺寸**。
 *    实测（一格 = 64×32 px）：
 *      GRASS_GREEN_PATCH 320×192 = 30 格  ×59 个 → 铺满 85%
 *      UNDERBRUSH_JUNGLE 156×96  = 7.3 格 ×59 个 → 21%（丛林图满屏就是它）
 *      FLOWER_1          580×200 = 57 格
 *      GRASS_GREEN       108×60  = 3.2 格
 *
 *    **覆盖面积 = 单体尺寸 × 数量。写死数量必然翻车**——换个素材覆盖率差十倍。
 *    现在数量按目标覆盖率反推（DecorFit.countForCover）。
 *
 * 跑法：npx tsx tools/audit-decor-coverage.mts
 */
import sharp from 'sharp';
import { setWorldBaseData, queryBaseTile } from '../src/ui/scene13/WorldBaseMap';
import { generateEnvironment } from '../src/ui/scene13/Scene13EnvironmentGenerator';
import { assetTiles, SCATTER_COVER, FLAT_COVER } from '../src/ui/scene13/DecorFit';
import { CITIES_V2 } from '../src/data/cities_v2';

const VW = 2000, VH = 1080, TW = 64, TH = 32;
/** 屏内格数，与 audit-decor-density-vs-de 同源 */
const ON_SCREEN = 2111;
/** 地面装饰（草花）总覆盖上限：主人两次说草太多，超了就报警 */
const MAX_PLANT_COVER = 0.16;

async function main(): Promise<void> {
  const raw = await sharp('public/world/world-base.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

  const byBase = new Map<string, { n: number; plant: number; rock: number; worst: string; worstV: number }>();
  for (const c of CITIES_V2.filter((_, i) => i % 7 === 0)) {
    for (const isSiege of [true, false]) {
      const base = queryBaseTile({ lat: c.lat, lng: c.lng, isSiege, isWinter: false });
      if (!base) continue;
      const p = generateEnvironment({
        width: VW, height: VH, lat: c.lat, lng: c.lng,
        seed: c.id + '-cov', isSiege, getCalendarSeason: () => 0,
      });
      let plant = 0, rock = 0;
      for (const o of p.objects) {
        const t = assetTiles(o.asset);
        if (/^(ROCK|MINE_|CLIFF|SHORT_CLIFF)/.test(o.asset)) rock += t;
        else if (o.layer === 'ground' || /GRASS|FLOWER|PLANT|BUSH|SHRUB|WEED|FERN|UNDERBRUSH|JUNGLE|RAINFOREST|CACTUS|REEDS|LILY/.test(o.asset)) plant += t;
      }
      const e = byBase.get(base) ?? { n: 0, plant: 0, rock: 0, worst: '', worstV: 0 };
      e.n++; e.plant += plant / ON_SCREEN; e.rock += rock / ON_SCREEN;
      if (plant / ON_SCREEN > e.worstV) { e.worstV = plant / ON_SCREEN; e.worst = c.name; }
      byBase.set(base, e);
    }
  }

  console.log('目标：草花 ' + ((SCATTER_COVER + FLAT_COVER) * 100).toFixed(0) + '%（散布 '
    + (SCATTER_COVER * 100).toFixed(0) + '% + 成簇 ' + (FLAT_COVER * 100).toFixed(0) + '%），上限 '
    + (MAX_PLANT_COVER * 100).toFixed(0) + '%\n');
  console.log('底图'.padEnd(20) + '草花覆盖'.padEnd(12) + '岩石覆盖'.padEnd(12) + '最高的城');
  const rows = [...byBase.entries()].map(([b, e]) => ({
    b, plant: e.plant / e.n, rock: e.rock / e.n, worst: e.worst, worstV: e.worstV,
  })).sort((a, b) => b.plant - a.plant);
  let fail = 0;
  for (const r of rows) {
    // 平均和**单张最高**都要卡：平均达标但单张糊屏，主人一样看得见
    const bad = r.plant > MAX_PLANT_COVER || r.worstV > MAX_PLANT_COVER * 1.5;
    if (bad) fail++;
    console.log((bad ? '🔴 ' : '   ') + r.b.padEnd(18)
      + (r.plant * 100).toFixed(1).padStart(6) + '%     '
      + (r.rock * 100).toFixed(1).padStart(6) + '%     '
      + r.worst + '(' + (r.worstV * 100).toFixed(0) + '%)');
  }
  const avg = rows.reduce((a, r) => a + r.plant, 0) / rows.length;
  console.log('\n草花平均覆盖 ' + (avg * 100).toFixed(1) + '%');
  if (fail) { console.log('🔴 ' + fail + ' 张底图的草花覆盖超上限'); process.exit(1); }
  console.log('✅ 所有底图的草花覆盖都在上限内');
}
main().catch((e) => { console.error(e); process.exit(1); });
