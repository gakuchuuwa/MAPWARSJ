/**
 * 复现 docs/02-design/de-map-algorithm.md 里的全部统计。
 *
 * 🔴 主人 2026-08-24：「你去看 DE 的制图算法是什么样的」「全部学习，不要一会石头有问题，
 *    一会儿草有问题」。这个脚本把 DE 的 179 个 .rms 全量统计一遍，
 *    DE 更新后直接重跑，就能看出文档里的数字还成不成立。
 *
 * 🔴 别再凭截图目测定参数——那是战役地图（手工摆放），不是随机地图。
 *
 * 跑法：npx tsx tools/audit-de-map-algorithm.mts
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RMS = 'C:/Program Files (x86)/Steam/steamapps/common/AoE2DE/resources/_common/drs/gamedata_x2';

/** 我们一屏的格数（2000×1080，TILE 64×32），与 audit-decor-density-vs-de 同源 */
const OUR_ON_SCREEN = 2111;
const OUR_USABLE = 1066;
const DE_TINY = 144 * 144;

const SECTIONS = ['PLAYER_SETUP', 'LAND_GENERATION', 'ELEVATION_GENERATION',
  'CLIFF_GENERATION', 'TERRAIN_GENERATION', 'OBJECTS_GENERATION', 'CONNECTION_GENERATION'];
/** 这些参数的取值分布决定地面观感，逐个打出来 */
const KEY_PARAMS = ['land_percent', 'number_of_clumps', 'clumping_factor',
  'spacing_to_other_terrain_types', 'height_limits',
  'number_of_objects', 'group_placement_radius', 'temp_min_distance_group_placement'];

function main(): void {
  if (!existsSync(RMS)) {
    console.log('🔴 找不到 DE 的 rms 目录，跳过：' + RMS);
    console.log('   （只有装了 AoE2DE 的机器能跑这个脚本）');
    return;
  }
  const files = readdirSync(RMS).filter((f) => f.endsWith('.rms'));
  const cmds = new Map<string, Map<string, number>>();
  const vals = new Map<string, Map<string, number>>();

  for (const f of files) {
    const s = readFileSync(join(RMS, f), 'utf8');
    const marks = [...s.matchAll(/<([A-Z_]+)>/g)].map((m) => ({ i: m.index!, name: m[1] }));
    for (let i = 0; i < marks.length; i++) {
      const { i: pos, name } = marks[i];
      if (!SECTIONS.includes(name)) continue;
      const body = s.slice(pos, i + 1 < marks.length ? marks[i + 1].i : s.length);
      for (let line of body.split('\n')) {
        line = line.split('/*')[0].trim();
        if (!line || /^(#|<|if|elseif|else|endif|start_random|percent_chance|end_random|\{|\})/.test(line)) continue;
        const parts = line.split(/\s+/);
        const c = parts[0];
        if (!cmds.has(name)) cmds.set(name, new Map());
        const m = cmds.get(name)!;
        m.set(c, (m.get(c) ?? 0) + 1);
        if (parts.length > 1) {
          if (!vals.has(c)) vals.set(c, new Map());
          const v = vals.get(c)!;
          const key = parts.slice(1).join(' ').slice(0, 28);
          v.set(key, (v.get(key) ?? 0) + 1);
        }
      }
    }
  }

  console.log('共 ' + files.length + ' 个 .rms\n');
  for (const sec of SECTIONS) {
    const m = cmds.get(sec);
    if (!m) continue;
    console.log('── <' + sec + '> ── 指令 ' + m.size + ' 种');
    for (const [c, n] of [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
      console.log('   ' + c.padEnd(34) + String(n).padStart(6));
    }
    console.log('');
  }

  console.log('── 关键参数取值分布 ──');
  for (const k of KEY_PARAMS) {
    const v = vals.get(k);
    if (!v) continue;
    const flat: number[] = [];
    for (const [val, cnt] of v) {
      const num = /^\(?\s*(-?\d+)/.exec(val);
      if (num) for (let i = 0; i < cnt; i++) flat.push(parseInt(num[1], 10));
    }
    flat.sort((a, b) => a - b);
    const tot = [...v.values()].reduce((a, b) => a + b, 0);
    let line = '  ' + k.padEnd(34) + '共 ' + String(tot).padStart(5);
    if (flat.length) line += '  中位 ' + String(flat[Math.floor(flat.length / 2)]).padStart(5);
    console.log(line);
    console.log('      ' + [...v.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([a, b]) => a + '×' + b).join('  '));
  }

  console.log('\n── 面积换算（引用 DE 数量前必做）──');
  console.log('  DE TINY 图 144×144 = ' + DE_TINY + ' 格');
  console.log('  我们一屏 屏内 ' + OUR_ON_SCREEN + ' 格 / 走廊外可用 ' + OUR_USABLE + ' 格');
  console.log('  面积比 1 : ' + (DE_TINY / OUR_ON_SCREEN).toFixed(1) + '（对屏内）');
  const conv = (deN: number): string =>
    (deN / DE_TINY * OUR_ON_SCREEN).toFixed(1) + ' (屏内) / '
    + (deN / DE_TINY * OUR_USABLE).toFixed(1) + ' (可用)';
  console.log('  DE 512 clumps  → 我们 ' + conv(512));
  console.log('  DE 68 石头     → 我们 ' + conv(68));
  console.log('  DE 4 主岩石    → 我们 ' + conv(4));
}
main();
