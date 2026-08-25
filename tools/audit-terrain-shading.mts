/**
 * 地面明暗（高程方向光）强度核对。
 *
 * 🔴 [2026-08-24 主人：「上方一道暗色渐变带，下方一道亮色渐变带」]
 *
 *    根因不是贴图自带渐变（那条诊断实测不成立：84 张地形贴图顶底总落差全部 <14，
 *    `des` 顶 154/底 153、`pal` 168/167），而是 **`ELEV_SHADE_DARK` 拉满**。
 *
 *    `addMicroRelief` 是 20~50 格的**低频波**，一个波峰就横跨整屏，
 *    整条坡同时把 m 拉到 1 → 屏幕上是一道贯穿的暗带 + 一道亮带。
 *    实测（atlas 34 张里 17 张中招）：`ds2 配 OAK` 中段 146 → 顶部 **88**
 *    （146×0.60=87.6，正是 ELEV_SHADE_DARK=0.40 拉满）。
 *
 *    改成 0.24 后：同一张 146 → 112，明暗差超 25 的从 17/34 降到 3/38。
 *
 * 这个脚本算高程梯度的分布，报告有多少格会把光照拉满。
 * 跑法：npx tsx tools/audit-terrain-shading.mts
 */
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { setWorldBaseData } from '../src/ui/scene13/WorldBaseMap';
import { generateEnvironment } from '../src/ui/scene13/Scene13EnvironmentGenerator';
import { CITIES_V2 } from '../src/data/cities_v2';

/** 与 Scene13GroundPainter 同源，改那边必须同步这里 */
function readConst(name: string): number {
  const src = readFileSync('src/ui/scene13/Scene13GroundPainter.ts', 'utf8');
  const m = new RegExp('const ' + name + ' = ([0-9.]+)').exec(src);
  if (!m) throw new Error('读不到常量 ' + name);
  return parseFloat(m[1]);
}

async function main(): Promise<void> {
  const DIR_X = readConst('ELEV_LIGHT_DIR_X');
  const DIR_Y = readConst('ELEV_LIGHT_DIR_Y');
  const K = readConst('ELEV_LIGHT_K');
  const DARK = readConst('ELEV_SHADE_DARK');
  const LIGHT = readConst('ELEV_SHADE_LIGHT');
  console.log(`光照常量：DIR(${DIR_X}, ${DIR_Y})  K=${K}  DARK=${DARK}  LIGHT=${LIGHT}`);
  console.log(`  → 背光面最暗压到底色的 ${((1 - DARK) * 100).toFixed(0)}%，迎光面最亮 ${((1 + LIGHT) * 100).toFixed(0)}%\n`);

  const raw = await sharp('public/world/world-base.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

  let cells = 0, satur = 0, sumM = 0;
  for (const c of CITIES_V2.filter((_, i) => i % 29 === 0)) {
    const p = generateEnvironment({
      width: 2000, height: 1080, lat: c.lat, lng: c.lng,
      seed: c.id + '-sh', isSiege: true, getCalendarSeason: () => 0,
    });
    const el = p.elevation, gh = el.length, gw = el[0].length;
    const at = (x: number, y: number): number =>
      el[Math.max(0, Math.min(gh - 1, y))][Math.max(0, Math.min(gw - 1, x))];
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      // 与 paintShading 同口径：±2 格宽基线中心差分
      const dhx = (at(x + 2, y) - at(x - 2, y)) * 0.25;
      const dhy = (at(x, y + 2) - at(x, y - 2)) * 0.25;
      const s = dhx * DIR_X + dhy * DIR_Y;
      const m = Math.min(1, Math.abs(s) * K);
      cells++; sumM += m;
      if (m >= 0.999) satur++;
    }
  }
  const pct = satur / cells * 100;
  console.log(`高程梯度：${cells} 格，平均强度 m=${(sumM / cells).toFixed(3)}`);
  console.log(`  拉满（m=1）的格：${satur}（${pct.toFixed(1)}%）`);
  const maxDrop = DARK * 100;
  console.log(`  拉满处压暗 ${maxDrop.toFixed(0)}%：底色 145 → ${Math.round(145 * (1 - DARK))}`);

  let fail = 0;
  if (DARK > 0.30) {
    console.log(`\n🔴 ELEV_SHADE_DARK=${DARK} 过大：低频坡会整条拉满，屏幕上是一道贯穿的暗带`);
    fail++;
  } else console.log(`\n✅ ELEV_SHADE_DARK=${DARK} 在 0.30 以内`);
  if (LIGHT > 0.24) {
    console.log(`🔴 ELEV_SHADE_LIGHT=${LIGHT} 过大：会出一道贯穿的亮带`);
    fail++;
  } else console.log(`✅ ELEV_SHADE_LIGHT=${LIGHT} 在 0.24 以内`);
  if (fail) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
