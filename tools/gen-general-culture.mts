/**
 * 生成「武将文化表」src/data/GeneralCulture.ts（generalId → 建筑文化）。
 * 🔴 [2026-10-19 主人令「必须给每个武将单独添加一个文化属性，才能对应上军团」]
 *
 * 军团 = 四时代 × 建筑文化；武将 = 时代（GENERAL_ERA）× 建筑文化（本表）→ 唯一二级军团。
 *
 * 🔴 [2026-10-23 主人改机制 + 挪据点] **按武将自己的 `cityId` 那座据点的 `buildingStyle` 取文化**：
 *   「武将的文化必须和据点建筑风格相符；不符就换据点」——挪将后重跑本脚本即可。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/gen-general-culture.mts
 */
import fs from 'node:fs';
import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import { FACTION_GENERALS } from '../src/data/FactionGenerals';

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
        const manual = MANUAL[g.generalId];
        const city: any = cityById.get(g.cityId);
        const style = manual?.style ?? city?.buildingStyle;
        if (!style) { missing.push(`${fid}｜${g.generalName ?? g.generalId}｜cityId=${g.cityId}`); continue; }
        const note = `${factionName(fid)}｜${g.generalName ?? g.generalId}｜据点 ${city?.name ?? ''}`;
        const prev = byId.get(g.generalId);
        if (prev && prev.style !== style) conflicts.push(`${g.generalName}(${g.generalId}) 两个据点风格不同：${prev.style} / ${style}`);
        if (!prev) byId.set(g.generalId, { style, note });
    }
}
const rows = [...byId.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => a.id.localeCompare(b.id));
const body = rows.map((r) => `    '${r.id}': '${r.style}',   // ${r.note}`).join('\n');
fs.writeFileSync('src/data/GeneralCulture.ts', `/**
 * 武将文化表（generalId → 建筑文化）。由 tools/gen-general-culture.mts 生成。
 *
 * 🔴 [2026-10-19 主人令「必须给每个武将单独添加一个文化属性，才能对应上军团」]
 *   · 军团 ＝ 四时代 × 建筑文化（二级军团表 \`age\` + \`buildingStyle\`，一个格子唯一一支）；
 *   · 武将 ＝ 时代（\`GENERAL_ERA\`）× 文化（本表）→ 他的军团。
 * 🔴 [2026-10-23 主人改机制] 文化按武将自己的 \`cityId\` 据点的 \`buildingStyle\` 取；
 *   挪将后重跑本脚本（「武将的文化必须和据点建筑风格相符」）。
 */
import type { BuildingStyle } from './cities_v2';

export const GENERAL_CULTURE: Record<string, BuildingStyle> = {
${body}
};

/** 武将的建筑文化；表里没有返回 undefined */
export function getGeneralCulture(generalId: string | null | undefined): BuildingStyle | undefined {
    return generalId ? GENERAL_CULTURE[generalId] : undefined;
}
`);
console.log(`写入 ${rows.length} 位武将；缺据点/风格 ${missing.length}：`, missing.slice(0, 10));
if (conflicts.length) console.log(`⚠ 同一武将在多个不同风格据点（文化只能取一个）：${conflicts.length}\n  ` + conflicts.join('\n  '));
