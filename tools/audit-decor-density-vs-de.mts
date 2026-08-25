/**
 * 装饰密度 vs DE 实算比例。
 *
 * 🔴 [2026-08-24 主人质问「为什么石头这么多？你看了 DE 的比例了吗，
 *     你是按 DE 的底图大小设计的，还是按我们项目底图大小设计的？」]
 *
 *    我当时**两边都没按**——是从主人发的一张 DE 截图上目测「一屏 18~22 处岩石」
 *    直接改的数字。而那张是**战役地图（手工摆放）**，不是随机地图，密度本来就高得多。
 *    结果石头飙到 34 个/屏，超 DE 密度 5~10 倍。
 *
 * 权威口径 = AoE2DE/resources/_common/drs/gamedata_x2/Arabia.rms：
 *
 *   create_object SOLID_OBJECT   { number_of_objects 4  }   主岩石
 *   create_object SOLID_SURROUND { number_of_objects 32 }×2  环绕碎石
 *   → 全图 68 个石头
 *
 *   地图尺寸见 EnlargeMap.inc：TINY 144 / SMALL 168 / MEDIUM 200 / LARGE 220 / HUGE 240
 *   → TINY 144×144 = 20736 格，密度 68/20736 = 0.0033 个/格
 *
 *   ⚠️ Arabia.rms 里 11 组 `#const` 是**按 percent_chance 随机选一组**，
 *      create_object 只执行一次——不是 11 组各来一遍，别把总量乘以 11。
 *
 *   ⚠️ AESTHETIC_SCATTER 写 `number_of_objects 1024`，但带
 *      `temp_min_distance_group_placement 42`。间距约束才是真正的密度上限，
 *      1024 只是「想放这么多」，不能当依据。所以草纹不设 DE 硬指标，只设经验上限。
 *
 * 跑法：npx tsx tools/audit-decor-density-vs-de.mts
 */
import sharp from 'sharp';
import { setWorldBaseData } from '../src/ui/scene13/WorldBaseMap';
import { generateEnvironment } from '../src/ui/scene13/Scene13EnvironmentGenerator';
import { CITIES_V2 } from '../src/data/cities_v2';

const VW = 2000, VH = 1080, TW = 64, TH = 32;

/** DE Arabia.rms 实算 */
const DE_MAP_TILES = 144 * 144;
const DE_ROCKS = 4 + 32 * 2;
const DE_ROCK_PER_TILE = DE_ROCKS / DE_MAP_TILES;

/** 草纹没有可靠的 DE 硬指标（见文件头），设经验上限防失控 */
const GROUND_DECOR_MAX = 130;

async function main(): Promise<void> {
  const raw = await sharp('public/world/world-base.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

  let rockSum = 0, groundSum = 0, n = 0, rockMax = 0, groundMax = 0;
  let onScreenTiles = 0;
  for (const c of CITIES_V2.filter((_, i) => i % 17 === 0)) {
    for (const isSiege of [true, false]) {
      const p = generateEnvironment({
        width: VW, height: VH, lat: c.lat, lng: c.lng,
        seed: c.id + '-dd', isSiege, getCalendarSeason: () => 0,
      });
      if (!onScreenTiles) {
        const { gw, gh, ox, oy } = p.grid;
        for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
          const px = (gx - gy) * (TW / 2) + ox, py = (gx + gy) * (TH / 2) + oy;
          if (px >= 0 && px <= VW && py >= 0 && py <= VH) onScreenTiles++;
        }
      }
      const r = p.objects.filter((o) => /^(ROCK|MINE_)/.test(o.asset)).length;
      const g = p.objects.filter((o) => o.layer === 'ground').length;
      rockSum += r; groundSum += g; n++;
      rockMax = Math.max(rockMax, r); groundMax = Math.max(groundMax, g);
    }
  }

  const rockAvg = rockSum / n, groundAvg = groundSum / n;
  const deTarget = DE_ROCK_PER_TILE * onScreenTiles;
  console.log('抽样 ' + n + ' 张战场，屏内 ' + onScreenTiles + ' 格\n');
  console.log('DE 口径（Arabia.rms）：' + DE_ROCKS + ' 石头 / ' + DE_MAP_TILES + ' 格 = '
    + DE_ROCK_PER_TILE.toFixed(5) + ' 个/格');
  console.log('  → 我们一屏应有 ' + deTarget.toFixed(1) + ' 个石头');
  console.log('  实际 均 ' + rockAvg.toFixed(1) + ' / 最多 ' + rockMax);
  console.log('地面贴花  实际 均 ' + groundAvg.toFixed(1) + ' / 最多 ' + groundMax
    + '（经验上限 ' + GROUND_DECOR_MAX + '）');

  let fail = 0;
  // 允许 2 倍宽容：我们是一屏定格演出，全空会不好看；但不许再翻 5 倍
  if (rockAvg > deTarget * 2) {
    console.log('\n🔴 石头 ' + rockAvg.toFixed(1) + ' 个，超 DE 密度 '
      + (rockAvg / deTarget).toFixed(1) + ' 倍 —— 别再照截图目测往上调');
    fail++;
  } else console.log('\n✅ 石头密度在 DE 口径的 2 倍以内（' + (rockAvg / deTarget).toFixed(1) + '×）');

  if (groundMax > GROUND_DECOR_MAX) {
    console.log('🔴 地面贴花最多 ' + groundMax + '，超经验上限');
    fail++;
  } else console.log('✅ 地面贴花在经验上限内');

  if (fail) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
