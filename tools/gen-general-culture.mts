/**
 * 生成「武将文化表」src/data/GeneralCulture.ts（generalId → 建筑文化）。
 * 🔴 [2026-10-19 主人令「必须给每个武将单独添加一个文化属性，才能对应上军团」]
 *
 * 军团 = 四时代 × 势力文化；武将 = 时代（GENERAL_ERA）× 文化（本表 / 注入的 FactionCulture）→ 唯一二级军团。
 *
 * 🔴 [2026-11-13 主人定] 武将文化＝势力文化（按所属政权查 FactionCulture，无则回落据点 buildingStyle）；
 *   保留文件末尾 `setGeneralFactionCultureProvider` / `getGeneralCulture` 运行时委托。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/gen-general-culture.mts
 */
import fs from 'node:fs';
import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import { FACTION_GENERALS } from '../src/data/FactionGenerals';
import { BATTLEFIELD_CHARACTERS } from '../src/data/BattlefieldCharacters';
import { getFactionCultureAt } from '../src/data/FactionCulture';
import { getGeneralDebutYear } from '../src/data/GeneralLifeYears';

// 没有据点/取不到风格的武将（手工兜底）：目前为空
const MANUAL: Record<string, { style: string; why: string }> = {};

const cityById = new Map<string, any>((CITIES_V2 as any[]).map((c) => [c.id, c]));
const factionName = (id: string) => (FACTIONS as any[]).find((f) => f.id === id)?.name ?? '';
const byId = new Map<string, { style: string; note: string }>();
const missing: string[] = [];
const conflicts: string[] = [];
for (const [fid, entry] of Object.entries(FACTION_GENERALS as any)) {
    const list = (Array.isArray(entry) ? entry : [entry]) as any[];
    for (const g of list) {
        if (!g?.generalId) continue;
        const ownFid = g.factionId ?? fid;
        const manual = MANUAL[g.generalId];
        const city: any = cityById.get(g.cityId);
        const fc = getFactionCultureAt(ownFid, getGeneralDebutYear(g.generalId));
        const style = manual?.style ?? fc ?? city?.buildingStyle;
        if (!style) { missing.push(`${ownFid}｜${g.generalName ?? g.generalId}｜cityId=${g.cityId}`); continue; }
        const note = `${factionName(ownFid)}｜${g.generalName ?? g.generalId}｜据点 ${city?.name ?? ''}`;
        const prev = byId.get(g.generalId);
        if (prev && prev.style !== style) conflicts.push(`${g.generalName}(${g.generalId}) 两个据点风格不同：${prev.style} / ${style}`);
        if (!prev) byId.set(g.generalId, { style, note });
    }
}
for (const b of Object.values(BATTLEFIELD_CHARACTERS)) {
    if (!b?.generalId || byId.has(b.generalId)) continue;
    const manual = MANUAL[b.generalId];
    const fc = b.factionId ? getFactionCultureAt(b.factionId, undefined) : undefined;
    const style = manual?.style ?? fc;
    if (!style) { missing.push(`${b.factionId}｜战场人物 ${b.generalName ?? b.generalId}`); continue; }
    byId.set(b.generalId, { style, note: `战场人物｜${b.generalName ?? b.generalId}` });
}
const rows = [...byId.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => a.id.localeCompare(b.id));
const body = rows.map((r) => `    '${r.id}': '${r.style}',   // ${r.note}`).join('\n');
fs.writeFileSync('src/data/GeneralCulture.ts', `/**
 * 武将文化表（generalId → 建筑文化）。由 tools/gen-general-culture.mts 生成。
 *
 * 🔴 [2026-10-19 主人令「必须给每个武将单独添加一个文化属性，才能对应上军团」]
 *   · 军团 ＝ 四时代 × 势力文化（二级军团表 \`age\` + \`buildingStyle\`，一个格子唯一一支）；
 *   · 武将 ＝ 时代（\`GENERAL_ERA\`）× 文化（本表 / 运行时 \`FactionCulture\` 注入）→ 他的军团。
 */
import type { BuildingStyle } from './cities_v2';

export const GENERAL_CULTURE: Record<string, BuildingStyle> = {
${body}
};

/** 武将所属势力的文化（由 FactionEra 注入，避免与武将名单循环引用） */
let factionCultureOfGeneral: ((generalId: string) => BuildingStyle | undefined) | null = null;
export function setGeneralFactionCultureProvider(fn: (generalId: string) => BuildingStyle | undefined): void {
    factionCultureOfGeneral = fn;
}

/** 武将的文化：🔴 [2026-11-13 主人定] 跟势力走（FactionCulture）；势力未定文化（叛军）才用本表 */
export function getGeneralCulture(generalId: string | null | undefined): BuildingStyle | undefined {
    if (!generalId) return undefined;
    return factionCultureOfGeneral?.(generalId) ?? GENERAL_CULTURE[generalId];
}
`);
console.log(`写入 ${rows.length} 位武将；缺据点/风格 ${missing.length}：`, missing.slice(0, 10));
if (conflicts.length) console.log(`⚠ 同一武将在多个不同风格据点（文化只能取一个）：${conflicts.length}\n  ` + conflicts.join('\n  '));
