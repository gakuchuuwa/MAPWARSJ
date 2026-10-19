/**
 * 武将 ↔ 军团 对应校验：每位武将必须有 时代（GENERAL_ERA）+ 文化（GENERAL_CULTURE），
 * 且他的军团（武将自己的 → 势力挂的）＝ 二级军团表里「该文化 × 该时代」那一支。
 * 🔴 [2026-10-19 主人令]「一个武将要有一个对应的军团」「必须给每个武将单独添加一个文化属性，才能对应上军团」
 *
 * 三级军团的武将不查（主人：不用管三级军团）。
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/verify-general-legion.mts
 */
import { FACTION_GENERALS, getGeneralOwnLegionName } from '../src/data/FactionGenerals';
import { FACTIONS } from '../src/data/factions';
import { GENERAL_ERA } from '../src/data/GeneralEra';
import { GENERAL_CULTURE } from '../src/data/GeneralCulture';
import { FACTION_COMPOSITIONS } from '../src/data/FactionCompositions';
import { LEVEL_2_CIV_62_LEGIONS } from '../src/data/level2Civ62Legions';
import { LEVEL_3_LEGIONS } from '../src/data/level3CustomLegions';
import { getFactionLegionComposition } from '../src/types/CultureFormations';

const L2 = LEVEL_2_CIV_62_LEGIONS as any[];
const byKey = new Map<string, string>(L2.map((l) => [`${l.buildingStyle}|${l.age}`, l.name]));
const l3 = new Set((LEVEL_3_LEGIONS as any[]).map((l) => l.name));
const fname = (id: string) => (FACTIONS as any[]).find((f) => f.id === id)?.name ?? '';

const problems: string[] = [];
let total = 0, ok = 0, skippedL3 = 0;
for (const [fid, entry] of Object.entries(FACTION_GENERALS as any)) {
    for (const g of (Array.isArray(entry) ? entry : [entry]) as any[]) {
        total++;
        const era = (GENERAL_ERA as any)[g.generalId];
        const culture = (GENERAL_CULTURE as any)[g.generalId];
        const legion = getGeneralOwnLegionName(g.generalId) ?? (FACTION_COMPOSITIONS as any)[fid]?.legionName;
        const who = `${fid}｜${fname(fid)}｜${g.generalName}`;
        if (l3.has(legion)) { skippedL3++; continue; }
        if (!era) { problems.push(`${who}｜缺时代`); continue; }
        if (!culture) { problems.push(`${who}｜缺文化`); continue; }
        const want = byKey.get(`${culture}|${era}`);
        if (!want) { problems.push(`${who}｜${culture}×${era} 没有二级军团`); continue; }
        if (legion !== want) { problems.push(`${who}｜现「${legion}」应「${want}」（${culture}×${era}）`); continue; }
        if (!getFactionLegionComposition(fid, g.generalId)) { problems.push(`${who}｜「${legion}」取不到编制`); continue; }
        ok++;
    }
}
console.log({ 武将总数: total, 对应上: ok, 三级军团不查: skippedL3, 有问题: problems.length });
for (const p of problems) console.log('  ', p);
process.exit(problems.length ? 1 : 0);
