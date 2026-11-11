import { readFileSync } from 'node:fs';
export const ERA_CN: Record<string, string> = { '古典': 'antiquity', '封建': 'feudal', '城堡': 'castle', '帝国': 'imperial' };
export function parseCsv(path: string): string[][] {
  const txt = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const rows: string[][] = []; let cur: string[] = [], f = '', q = false;
  for (let i = 0; i < txt.length; i++) { const c = txt[i];
    if (q) { if (c === '"') { if (txt[i+1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { cur.push(f); f = ''; } else if (c === '\n') { cur.push(f.replace(/\r$/, '')); rows.push(cur); cur = []; f = ''; } else f += c; }
  if (f || cur.length) { cur.push(f); rows.push(cur); }
  return rows;
}
export function loadGG() {
  const rows = parseCsv('docs/AGENTS/势力全表-GG核定结果-2026-11-11.csv'); const H = rows.shift()!;
  const ix = (n: string) => H.findIndex(h => h.startsWith(n));
  const gg = new Map<string, any>();
  for (const r of rows) if (r[0]) gg.set(r[0], { id: r[0], name: r[1], kind: r[ix('GG:定性')], act: r[ix('GG:处理')], s: Number(r[ix('GG:新起始年')]), e: Number(r[ix('GG:新结束年')]), era: r[ix('GG:新时代')], fix: r[ix('GG:挂错')] ?? '', src: r[ix('GG:史料出处')] ?? '', conf: r[ix('GG:确证')] ?? '', oldS: r[4], oldE: r[5] });
  const move = new Map<string, string>(), gap = new Map<string, string>(), life = new Map<string, [number, number]>();
  for (const [fid, v] of gg) {
    for (const m of v.fix.matchAll(/([a-z][a-z0-9_]*)\s*→\s*([a-z][a-z0-9_]*)/g)) move.set(m[1], m[2]);
    for (const m of v.fix.matchAll(/史实缺口[：:]\s*([a-z][a-z0-9_]*)([^；;]*)/g)) gap.set(m[1], fid + '｜' + m[2]);
    for (const m of v.fix.matchAll(/([a-z][a-z0-9_]*)\s+(-?\d+)\s*\/\s*(-?\d+)/g)) life.set(m[1], [Number(m[2]), Number(m[3])]);
  }
  const root = (fid: string) => { let x = fid; for (let i = 0; i < 6; i++) { const m = (gg.get(x)?.act ?? '').match(/并入\s*([a-z][a-z0-9_]*)/); if (!m) break; x = m[1]; } return x; };
  return { gg, move, gap, life, root };
}
const BOUNDS = [[-1e9, 476, 'antiquity'], [476, 1050, 'feudal'], [1050, 1500, 'castle'], [1500, 1900, 'imperial']] as const;
/** 主人 2026-11-11：长时代势力按年代分段；前期很短（如大夏）不分段 */
export const LONG_SPAN = 500, MIN_SEG = 150;
export function segmentsFor(s: number, e: number): { from: number; era: string }[] {
  const end = Math.min(e, 1900);
  const parts = BOUNDS.map(([a, b, era]) => ({ era, from: Math.max(a, s), years: Math.max(0, Math.min(b, end) - Math.max(a, s)) })).filter(p => p.years > 0);
  if (!parts.length) return [{ from: -9999, era: e >= 1500 ? 'imperial' : 'castle' }];
  const major = [...parts].sort((a, b) => b.years - a.years || (BOUNDS.findIndex(x => x[2] === b.era) - BOUNDS.findIndex(x => x[2] === a.era)))[0].era;
  if (end - s < LONG_SPAN) return [{ from: -9999, era: major }];
  // 长时代：短于 MIN_SEG 的段并入相邻段
  let segs = parts.filter(p => p.years >= MIN_SEG);
  if (!segs.length) return [{ from: -9999, era: major }];
  return segs.map((p, i) => ({ from: i === 0 ? -9999 : p.from, era: p.era }));
}
