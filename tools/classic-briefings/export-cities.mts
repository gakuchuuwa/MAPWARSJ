/**
 * 导出「据点名单」CSV（给 GG：新增势力的都城、攻城/守城的目标城只能用游戏里已有的据点名）。
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/classic-briefings/export-cities.mts <输出.csv>
 */
import { writeFileSync } from 'node:fs';
import { CITIES_V2 } from '../../src/data/cities_v2';
import { FACTIONS } from '../../src/data/factions';

const out = process.argv[2];
if (!out) { console.error('缺输出路径'); process.exit(1); }
const csv = (s: string | number) => { const t = String(s ?? ''); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
const TYPE: Record<string, string> = { big_city: '大城', medium_city: '中城', small_city: '小城', pass: '关隘', stockade: '城寨' };
const rows = CITIES_V2.slice().sort((a, b) => a.lng - b.lng);
const lines = [['据点名', '纬度', '经度', '城型', '游戏势力'].join(',')];
for (const c of rows) lines.push([c.name, c.lat.toFixed(3), c.lng.toFixed(3), TYPE[c.type] ?? c.type, FACTIONS.find((f) => f.id === c.factionId)?.name ?? ''].map(csv).join(','));
writeFileSync(out, '﻿' + lines.join('\n') + '\n', 'utf8');
console.log(`已导出 ${rows.length} 个据点 → ${out}`);
