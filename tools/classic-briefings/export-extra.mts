/**
 * 导出「经典战补选·名将名单」CSV：交给 GG 为每位名将补选第二、第三场经典战（只收有名的大战，没有就不补）。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/classic-briefings/export-extra.mts <输出.csv> [每批人数=30]
 */
import { writeFileSync } from 'node:fs';
import { GENERAL_FIRST_BATTLES } from '../../src/data/GeneralFirstBattles';
import { GENERAL_EXTRA_CLASSIC_BATTLES } from '../../src/data/GeneralExtraClassicBattles';
import { GENERAL_LIFE_YEARS } from '../../src/data/GeneralLifeYears';
import { getRawGeneralByGeneralId } from '../../src/data/FactionGenerals';
import { FACTIONS } from '../../src/data/factions';

const out = process.argv[2];
const batchSize = Number(process.argv[3] ?? 30);
if (!out) { console.error('缺输出路径'); process.exit(1); }

const csvCell = (s: string | number) => {
    const t = String(s ?? '').replace(/\r?\n/g, ' ');
    return /[",]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const factionName = (id?: string | null) => (id ? FACTIONS.find((f) => f.id === id)?.name : undefined) ?? '';

const rows = Object.values(GENERAL_FIRST_BATTLES)
    .slice()
    .sort((a, b) => a.battleYear - b.battleYear || a.generalId.localeCompare(b.generalId));
const header = ['批次', '序号', 'generalId', '名将', '游戏势力', '生年', '卒年', '第一场经典战', '第一场年份', '已补选'];
const lines = [header.map(csvCell).join(',')];
rows.forEach((fb, i) => {
    const me = getRawGeneralByGeneralId(fb.generalId);
    const life = GENERAL_LIFE_YEARS[fb.generalId];
    const done = (GENERAL_EXTRA_CLASSIC_BATTLES[fb.generalId] ?? []).map((x) => `${x.battleName}${x.battleYear}`).join('；');
    lines.push([
        Math.floor(i / batchSize) + 1, i + 1, fb.generalId,
        me?.general.generalName ?? '', factionName(me?.general.factionId ?? me?.factionId),
        life?.birth ?? '', life?.death ?? '', fb.battleName, fb.battleYear, done,
    ].map(csvCell).join(','));
});
writeFileSync(out, '﻿' + lines.join('\n') + '\n', 'utf8');
console.log(`已导出 ${rows.length} 位名将，${Math.ceil(rows.length / batchSize)} 批 → ${out}`);
