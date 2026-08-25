/**
 * 零星残雪（冬季状态标志 4）验收。
 *
 * 🔴 主人 2026-08-24：「冬天是不是应该给其他背景添加一点雪地地基作为二层？」
 *
 *    最冷月 **-3~+2°C** 的地方会下雪但存不住：江南北部、华北南部、地中海北岸、
 *    中欧、日本西南、朝鲜南部。此前只有「有雪／无雪」两态，这一带被判成完全无雪，
 *    冬天和夏天长得一模一样。
 *
 *    现在 world-base 的 B 通道加了标志 **4**：底图**不换**（还是当地的土/草），
 *    只在上面铺少量 `sn2` 雪斑（覆盖约 9%，alpha 0.62 让土色透出来）。
 *
 *    ⚠️ 标志 4 **不算雪区**：树不换雪松、装饰不进冰、攻城战不换雪地地基。
 *
 * 跑法：npx tsx tools/audit-sparse-snow.mts
 */
import sharp from 'sharp';
import { setWorldBaseData, queryWinterSnow, queryBaseTile } from '../src/ui/scene13/WorldBaseMap';
import { isSnowArea } from '../src/ui/scene13/Scene13DeMapThemes';
import { generateEnvironment } from '../src/ui/scene13/Scene13EnvironmentGenerator';
import { CITIES_V2 } from '../src/data/cities_v2';

/** 人工核对：这些地方冬天该是「下雪但存不住」 */
const EXPECT_SPARSE = [
  { name: '建康(南京)', lat: 32.06, lng: 118.80 },
  { name: '洛阳', lat: 34.62, lng: 112.45 },   // bio6 约 -5：会下雪，但地面大部分时间是土
  { name: '京都', lat: 35.01, lng: 135.77 },
];
/** 这些该是真雪区（标志 1/2/3） */
const EXPECT_SNOW = [
  { name: '莫斯科', lat: 55.75, lng: 37.62 },
  { name: '哈尔滨', lat: 45.80, lng: 126.53 },
  { name: '乌普萨拉', lat: 59.86, lng: 17.64 },
];
/** 这些冬天完全无雪 */
const EXPECT_NONE = [
  { name: '广州', lat: 23.13, lng: 113.26 },
  { name: '罗马', lat: 41.90, lng: 12.50 },   // 一月均温 8°C，极少下雪
  { name: '雅典', lat: 37.98, lng: 23.73 },
];

async function main(): Promise<void> {
  const raw = await sharp('public/world/world-base.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

  let fail = 0;
  const check = (list: typeof EXPECT_SPARSE, want: string, ok: (f: number | null) => boolean): void => {
    for (const c of list) {
      const f = queryWinterSnow(c.lat, c.lng);
      const good = ok(f);
      if (!good) fail++;
      console.log(`  ${good ? '✅' : '🔴'} ${c.name.padEnd(10)} 标志=${f}  期望${want}`);
    }
  };
  console.log('人工核对点：');
  check(EXPECT_SPARSE, '零星残雪(4)', (f) => f === 4);
  check(EXPECT_SNOW, '真雪区(1/2/3)', (f) => f !== null && f > 0 && f !== 4);
  check(EXPECT_NONE, '无雪(0)', (f) => f === 0);

  // 标志 4 不算雪区
  console.log('\n标志 4 不该被当成雪区：');
  for (const c of EXPECT_SPARSE) {
    const snowy = isSnowArea(c.lat, null, 'temperate_forest', c.lng);
    if (snowy) fail++;
    console.log(`  ${snowy ? '🔴' : '✅'} ${c.name.padEnd(10)} isSnowArea=${snowy}（该是 false）`);
  }

  // 底图不换 + 确实铺了雪斑
  console.log('\n冬季实际效果：');
  for (const c of EXPECT_SPARSE) {
    const summer = queryBaseTile({ lat: c.lat, lng: c.lng, isSiege: false, isWinter: false });
    const winter = queryBaseTile({ lat: c.lat, lng: c.lng, isSiege: false, isWinter: true });
    const plan = generateEnvironment({
      width: 2000, height: 1080, lat: c.lat, lng: c.lng,
      seed: c.name + '-sparse', isSiege: false, getCalendarSeason: () => 2,
    });
    const snowCells = plan.terrainPatches.filter((t) => t.tile === 'sn2')
      .reduce((a, t) => a + t.cells.length, 0);
    const pct = snowCells / 2111 * 100;
    const good = summer === winter && snowCells > 0;
    if (!good) fail++;
    console.log(`  ${good ? '✅' : '🔴'} ${c.name.padEnd(10)} 夏=${summer} 冬=${winter}（该相同）  雪斑 ${pct.toFixed(0)}%`);
  }

  // 全量：多少城属于这一档
  let n4 = 0, n123 = 0, n0 = 0;
  for (const c of CITIES_V2) {
    const f = queryWinterSnow(c.lat, c.lng);
    if (f === 4) n4++; else if (f !== null && f > 0) n123++; else n0++;
  }
  console.log(`\n全量 ${CITIES_V2.length} 座城：真雪区 ${n123}  零星残雪 ${n4}  无雪 ${n0}`);
  if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
  console.log('\n✅ 全部符合');
}
main().catch((e) => { console.error(e); process.exit(1); });
