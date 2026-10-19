/**
 * 生成「武将文化表」src/data/GeneralCulture.ts（generalId → 建筑文化）。
 * 🔴 [2026-10-19 主人令「必须给每个武将单独添加一个文化属性，才能对应上军团」]
 *
 * 军团 = 四时代 × 建筑文化；武将 = 时代（GENERAL_ERA）× 建筑文化（本表）→ 唯一二级军团。
 *
 * 取值依据：武将所在势力的据点建筑文化（该势力名下据点出现最多的 buildingStyle，并列取先出现的）。
 * 🔴 [2026-10-20 主人令「什么规则呀，哪有这个规则，删除，每个武将都要给安置据点」]
 *    **不再存在「没有据点的武将」**：科塞亚／乌克西亚两个无首府战役专用势力已删，
 *    其守将改挂有城势力（米底／埃兰），故本脚本不再需要任何手工兜底。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/gen-general-culture.mts
 * 之后新增武将：在表里补一行（或重跑本脚本）；`tools/verify-general-legion.mts` 会报缺文化的武将。
 */
import fs from 'node:fs';
import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import { FACTION_GENERALS } from '../src/data/FactionGenerals';

// 没有据点的武将（手工兜底）：已清零 —— 2026-10-20 主人令后全库武将都有据点，全按势力据点文化生成
const MANUAL: Record<string, { style: string; why: string }> = {};

const factionName = (id: string) => (FACTIONS as any[]).find((f) => f.id === id)?.name ?? '';
const rows: { id: string; style: string; note: string }[] = [];
const missing: string[] = [];
for (const [fid, entry] of Object.entries(FACTION_GENERALS as any)) {
    const list = (Array.isArray(entry) ? entry : [entry]) as any[];
    const styles: Record<string, number> = {};
    const cities = (CITIES_V2 as any[]).filter((c) => c.factionId === fid);
    for (const c of cities) if (c.buildingStyle) styles[c.buildingStyle] = (styles[c.buildingStyle] ?? 0) + 1;
    const style = Object.entries(styles).sort((a, b) => b[1] - a[1])[0]?.[0];
    for (const g of list) {
        const manual = MANUAL[g.generalId];
        if (manual) { rows.push({ id: g.generalId, style: manual.style, note: `${factionName(fid)}｜${g.generalName}｜${manual.why}` }); continue; }
        if (!style) { missing.push(`${fid}｜${g.generalName}`); continue; }
        rows.push({ id: g.generalId, style, note: `${factionName(fid)}｜${g.generalName}｜据点 ${cities[0]?.name ?? ''}` });
    }
}
rows.sort((a, b) => a.id.localeCompare(b.id));
const body = rows.map((r) => `    '${r.id}': '${r.style}',   // ${r.note}`).join('\n');
fs.writeFileSync('src/data/GeneralCulture.ts', `/**
 * 武将文化表（generalId → 建筑文化）。由 tools/gen-general-culture.mts 生成。
 *
 * 🔴 [2026-10-19 主人令「必须给每个武将单独添加一个文化属性，才能对应上军团」]
 *   · 军团 ＝ 四时代 × 建筑文化（二级军团表 \`age\` + \`buildingStyle\`，一个格子唯一一支）；
 *   · 武将 ＝ 时代（\`GENERAL_ERA\`）× 文化（本表）→ 他的军团。武将的文化是武将自己的属性，不再借势力的据点推。
 *   · 取值依据：所在势力据点的建筑文化（全库武将都有据点，见 2026-10-20 主人令）。
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
console.log(`写入 ${rows.length} 位武将；没有文化（势力无据点）${missing.length}：`, missing);
