/**
 * 草 / 花 / 石的底图配置验收。
 *
 * 🔴 [2026-08-24 照 DE 的 RMS 建的表] DE 用 `terrain_to_place_on` 把装饰绑定到**地形**
 *    （179 个 .rms 里 246 次 BASE_TERRAIN），不是按气候 biome 挑。
 *    我们改成按底图取，与树同源。这个脚本核对每张底图实际长出了什么。
 *
 * 硬检查：
 *   1. 每张底图的 scatter（满地草）必须真的落地——被 GROUND_COVER_ASSETS 滤空会导致光秃
 *   2. 每张底图的 solid（岩石）必须真的落地
 *   3. 同一场里 scatter 只能有一种（DE 的 #const AESTHETIC_SCATTER 是单个常量）
 *
 * 跑法：npx tsx tools/audit-ground-decor.mts
 */
import sharp from 'sharp';
import { setWorldBaseData, queryBaseTile } from '../src/ui/scene13/WorldBaseMap';
import { generateEnvironment } from '../src/ui/scene13/Scene13EnvironmentGenerator';
import { groundDecorTable } from '../src/ui/scene13/DecorFit';
import { CITIES_V2 } from '../src/data/cities_v2';

const ROCKS = /^(ROCK|MINE_)/;

async function main(): Promise<void> {
  const raw = await sharp('public/world/world-base.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

  const table = groundDecorTable();
  // 每张底图找一座代表城
  const rep = new Map<string, { name: string; lat: number; lng: number; isSiege: boolean; winter: boolean }>();
  for (const c of CITIES_V2) {
    for (const isSiege of [true, false]) {
      for (const winter of [false, true]) {
        const b = queryBaseTile({ lat: c.lat, lng: c.lng, isSiege, isWinter: winter });
        if (b && !rep.has(b)) rep.set(b, { name: c.name, lat: c.lat, lng: c.lng, isSiege, winter });
      }
    }
  }

  console.log('底图'.padEnd(20) + '草(scatter)'.padEnd(26) + '石'.padEnd(22) + '代表城');
  let fail = 0;
  const multiScatter: string[] = [];
  for (const [base, r] of [...rep.entries()].sort()) {
    const plan = generateEnvironment({
      width: 2000, height: 1080, lat: r.lat, lng: r.lng,
      seed: base + '-gd', isSiege: r.isSiege, getCalendarSeason: () => (r.winter ? 2 : 0),
    });
    const scatter = new Map<string, number>();
    const rocks = new Map<string, number>();
    for (const o of plan.objects) {
      if (o.layer === 'ground') scatter.set(o.asset, (scatter.get(o.asset) ?? 0) + 1);
      if (ROCKS.test(o.asset)) rocks.set(o.asset, (rocks.get(o.asset) ?? 0) + 1);
    }
    const want = table[base];
    const sTop = [...scatter.entries()].sort((a, b) => b[1] - a[1]);
    // scatter 只看该底图登记的那些（地面层还有花簇等）
    const sMine = sTop.filter(([a]) => want?.scatter.includes(a));
    const rTop = [...rocks.entries()].sort((a, b) => b[1] - a[1]);
    const sTxt = sMine.map(([a, n]) => a + '×' + n).join(' ') || '（无）';
    const rTxt = rTop.slice(0, 3).map(([a, n]) => a + '×' + n).join(' ') || '（无）';
    const bad = sMine.length === 0 || rTop.length === 0;
    if (bad) fail++;
    if (sMine.length > 1) multiScatter.push(base + ':' + sMine.map(([a]) => a).join('+'));
    console.log((bad ? '🔴 ' : '   ') + base.padEnd(18) + sTxt.padEnd(26) + rTxt.padEnd(22) + r.name);
  }

  console.log('');
  if (fail) { console.log('🔴 ' + fail + ' 张底图的草或石一个都没落地'); }
  else console.log('✅ 每张底图的草和石都落地了');
  if (multiScatter.length) { console.log('🔴 同一场出现多种散布草（DE 是单个 #const）：' + multiScatter.join(' ')); }
  else console.log('✅ 每场只有一种散布草');
  if (fail || multiScatter.length) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
