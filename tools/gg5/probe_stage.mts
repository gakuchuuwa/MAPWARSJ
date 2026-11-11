/**
 * 百岁模式出场窗口复核：出场年不早于势力起始年。
 * 跑法：npx tsx --import ./tools/sim-preload.mjs tools/gg5/probe_stage.mts
 */
import { FACTION_GENERALS, getGeneralOwnFactionId, getFactionIdOfGeneral } from '../../src/data/FactionGenerals';
import { FACTION_SPAN } from '../../src/data/FactionLifeYears';
import { GENERAL_LIFE_YEARS, getGeneralDebutYear } from '../../src/data/GeneralLifeYears';
import { getCentenarianStageWindow } from '../../src/data/generalOnStage';

const all: { gid: string; fid: string }[] = [];
for (const [k, v] of Object.entries(FACTION_GENERALS as any)) {
    for (const g of (Array.isArray(v) ? v : [v]) as any[]) all.push({ gid: g.generalId, fid: g.factionId ?? k });
}

let early = 0, emptyWin = 0, inverted = 0, checked = 0;
const earlyList: string[] = [];
const emptyList: string[] = [];
const invertedList: string[] = [];
for (const { gid, fid } of all) {
    const span = (FACTION_SPAN as any)[fid];
    if (!span) continue;
    const w = getCentenarianStageWindow(gid);
    checked++;
    if (!w) { emptyWin++; emptyList.push(`${gid}(${fid}) 生卒=${(GENERAL_LIFE_YEARS as any)[gid]?.birth}/${(GENERAL_LIFE_YEARS as any)[gid]?.death} 势力起=${span.start}`); continue; }
    if (w.from > w.to) { inverted++; invertedList.push(`${gid}(${fid}) 窗口倒挂 [${w.from}, ${w.to}]`); }
    if (w.from < span.start) { early++; if (earlyList.length < 20) earlyList.push(`${gid}(${fid}) 窗口起${w.from} < 势力起${span.start}`); }
}
console.log(`核验武将 ${checked}｜出场年早于势力起年 ${early}（应为 0）｜窗口倒挂 ${inverted}（应为 0）｜无窗口（整场不出场） ${emptyWin}（应为 0）`);
for (const s of earlyList) console.log('  ! ' + s);
for (const s of invertedList) console.log('  ! ' + s);
for (const s of emptyList) console.log('  - ' + s);
if (early || inverted || emptyWin) process.exitCode = 1;

// provider 是否真的注入
const probe = 'gen_haci_giray';
const fid = getGeneralOwnFactionId(probe) ?? getFactionIdOfGeneral(probe);
console.log(`\n注入探针 ${probe}｜势力=${fid}｜登场=${getGeneralDebutYear(probe)}｜窗口=${JSON.stringify(getCentenarianStageWindow(probe))}｜势力起=${(FACTION_SPAN as any)[fid]?.start}`);
