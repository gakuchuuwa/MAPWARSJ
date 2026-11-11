/**
 * 导出「经典战播报·任务表」CSV（交给只能读谷歌云盘的 AI 写历史资料、战略播报、战术播报）。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/classic-briefings/export.mts <输出.csv> [每批场数=30]
 *
 * 一行一场名将经典战，按年份排序、分批。同名同年的攻守两方（如卡迭石）各占一行，
 * 但「同场标记」列写同一个编号——两行的战略、战术播报应当写同一场仗，只是站在各自一方。
 */
import { writeFileSync } from 'node:fs';
import { GENERAL_FIRST_BATTLES, getGeneralClassicBattles, battleIdOf } from '../../src/data/GeneralFirstBattles';
import { FIRST_BATTLE_BACKGROUNDS, firstBattleKindOf } from '../../src/data/GeneralFirstBattleBackgrounds';
import { FIRST_BATTLE_STRATEGIC_BACKGROUNDS } from '../../src/data/GeneralFirstBattleStrategicBackgrounds';
import { getRawGeneralByGeneralId } from '../../src/data/FactionGenerals';
import { FACTIONS } from '../../src/data/factions';
import { CLASSIC_BATTLE_BRIEFINGS } from '../../src/data/ClassicBattleBriefings.generated';
import { len } from './briefingLib.mts';

const out = process.argv[2];
const batchSize = Number(process.argv[3] ?? 30);
if (!out) { console.error('缺输出路径'); process.exit(1); }

const KIND = { field: '野战', siege_attack: '攻城', siege_defend: '守城' } as const;
const factionName = (id?: string | null) => (id ? FACTIONS.find((f) => f.id === id)?.name : undefined) ?? '';
const yearText = (y: number) => (y < 0 ? `前${-y}` : `${y}`);
const csvCell = (s: string | number) => {
    const t = String(s ?? '').replace(/\r?\n/g, ' ');
    return /[",]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

// 🔴 [2026-11-11 主人令「把1000+的经典战，全部重写」] 任务表收**全部经典战**：第一场 ＋ 补选的后几场（编号 `<generalId>@<年份>`）
const rows = Object.keys(GENERAL_FIRST_BATTLES)
    .flatMap((gid) => getGeneralClassicBattles(gid))
    .sort((a, b) => a.battleYear - b.battleYear || a.battleName.localeCompare(b.battleName) || battleIdOf(a).localeCompare(battleIdOf(b)));

/** 已按新口径（目标 89~144，一段一屏）重写并导入的场次：两段都只有一屏 */
const meetsNewLength = (id: string): boolean => {
    const b = CLASSIC_BATTLE_BRIEFINGS[id];
    return !!b && b.strategic.length === 1 && b.tactical.length === 1;
};

const sameBattle = new Map<string, number>();
let sameSeq = 0;
const header = ['批次', '序号', 'generalId', '战役', '年份', '类型', '我方统帅', '我方势力', '敌方势力', '敌将', '战场或目标', '同场标记', '新规已导入', '现有战略播报(参考)', '现有战术播报(参考)'];
const lines = [header.map(csvCell).join(',')];
rows.forEach((fb, i) => {
    const id = battleIdOf(fb);
    const me = getRawGeneralByGeneralId(fb.generalId);
    const foe = fb.enemyGeneralId ? getRawGeneralByGeneralId(fb.enemyGeneralId) : null;
    const key = `${fb.battleName}|${fb.battleYear}`;
    const count = rows.filter((r) => `${r.battleName}|${r.battleYear}` === key).length;
    let mark = '';
    if (count > 1) {
        if (!sameBattle.has(key)) sameBattle.set(key, ++sameSeq);
        mark = `S${sameBattle.get(key)}`;
    }
    const cur = CLASSIC_BATTLE_BRIEFINGS[id];
    lines.push([
        Math.floor(i / batchSize) + 1,
        i + 1,
        id,
        fb.battleName,
        yearText(fb.battleYear),
        KIND[firstBattleKindOf(fb)],
        me?.general.generalName ?? '',
        factionName(me?.general.factionId ?? me?.factionId),
        factionName(fb.enemyFactionId) || fb.enemyFactionName,
        foe?.general.generalName ?? '',
        fb.targetName,
        mark,
        meetsNewLength(id) ? '是' : '',
        cur ? cur.strategic.join('') : (FIRST_BATTLE_STRATEGIC_BACKGROUNDS[id] ?? ''),
        cur ? cur.tactical.join('') : (FIRST_BATTLE_BACKGROUNDS[id] ?? ''),
    ].map(csvCell).join(','));
});
// 加 BOM，Excel / 云盘都按 UTF-8 认中文
writeFileSync(out, '﻿' + lines.join('\n') + '\n', 'utf8');
console.log(`已导出 ${rows.length} 场，${Math.ceil(rows.length / batchSize)} 批（每批 ${batchSize}），同场成对 ${sameSeq} 组 → ${out}`);
