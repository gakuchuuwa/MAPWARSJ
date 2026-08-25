/**
 * 地表变体的色差核对。
 *
 * 🔴 [2026-08-24 主人拿 DE 真图对比：「图1 是你画的，图2 是 DE 的」]
 *    DE 的地面变化是**同色系、低对比、边界看不出**；我们是深褐斑铺在浅黄底上，
 *    一眼就是几块补丁。实测 149 种「底图×变体」组合里 **63 种 RGB 色差 >45**，
 *    最夸张 `pal → sr2` 色差 132、`ds2 → gr4`（黄土上铺黑土）色差 78 共 698 格。
 *
 * 判据：底图与变体贴图的平均 RGB 距离。
 *   ≤30  DE 那种「看不出边」的同色系变化
 *   ≤45  还能接受
 *   >45  一眼看出是块补丁
 *
 * 冬季雪原除外：DE 的冬季地面就是「雪 + 露土枯草斑块」，高对比是有意的。
 *
 * 跑法：npx tsx tools/audit-ground-variation.mts
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { setWorldBaseData } from '../src/ui/scene13/WorldBaseMap';
import { generateEnvironment } from '../src/ui/scene13/Scene13EnvironmentGenerator';
import { CITIES_V2 } from '../src/data/cities_v2';

const SNOW = new Set(['snd', 'sno', 'sn2', 'snf']);
const cache = new Map<string, [number, number, number] | null>();

async function color(t: string): Promise<[number, number, number] | null> {
  if (cache.has(t)) return cache.get(t)!;
  const f = 'public/SUCAI_TERRAIN/' + t + '.png';
  if (!existsSync(f)) { cache.set(t, null); return null; }
  const { data, info } = await sharp(f).resize(48, 48).raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += info.channels) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  const c: [number, number, number] = [r / n, g / n, b / n];
  cache.set(t, c); return c;
}

async function main(): Promise<void> {
  const raw = await sharp('public/world/world-base.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

  const pairs = new Map<string, number>();
  for (const c of CITIES_V2.filter((_, i) => i % 13 === 0)) {
    for (const isSiege of [true, false]) {
      const p = generateEnvironment({
        width: 2000, height: 1080, lat: c.lat, lng: c.lng,
        seed: c.id + '-gv', isSiege, getCalendarSeason: () => 0,
      });
      for (const t of p.terrainPatches) {
        if (t.category !== 'ground-variation') continue;
        const k = p.baseTerrain + '|' + t.tile;
        pairs.set(k, (pairs.get(k) ?? 0) + t.cells.length);
      }
    }
  }

  const rows: Array<[string, string, number, number]> = [];
  for (const [k, cells] of pairs) {
    const [b, v] = k.split('|');
    if (SNOW.has(b)) continue;                 // 冬季雪原高对比是有意的
    const cb = await color(b), cv = await color(v);
    if (!cb || !cv) continue;
    rows.push([b, v, Math.hypot(cb[0] - cv[0], cb[1] - cv[1], cb[2] - cv[2]), cells]);
  }
  rows.sort((a, b) => b[2] - a[2]);

  console.log('底图 → 变体，按 RGB 色差降序（前 12）：');
  for (const [b, v, d, n] of rows.slice(0, 12)) {
    console.log('  ' + (d > 45 ? '🔴' : d > 30 ? '⚠ ' : '✅') + ' '
      + b.padEnd(18) + '→ ' + v.padEnd(18) + '色差 ' + d.toFixed(0).padStart(3) + '   ' + n + ' 格');
  }
  const bad = rows.filter((r) => r[2] > 45);
  const warn = rows.filter((r) => r[2] > 30 && r[2] <= 45);
  const worstCells = bad.reduce((a, r) => a + r[3], 0);
  console.log('\n共 ' + rows.length + ' 种组合：色差>45 ' + bad.length + ' 种（' + worstCells + ' 格）  30~45 ' + warn.length + ' 种');
  if (bad.length) { console.log('🔴 有一眼看出是补丁的组合 —— 变体必须同色系，见 DecorFit.GROUND_VARIATION_BY_BASE'); process.exit(1); }
  console.log('✅ 没有色差>45 的组合');
}
main().catch((e) => { console.error(e); process.exit(1); });
