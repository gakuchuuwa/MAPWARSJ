/**
 * 生成「武将文化表」src/data/GeneralCulture.ts（generalId → 建筑文化）。
 * 🔴 [2026-10-19 主人令「必须给每个武将单独添加一个文化属性，才能对应上军团」]
 *
 * 军团 = 四时代 × 建筑文化；武将 = 时代（GENERAL_ERA）× 建筑文化（本表）→ 唯一二级军团。
 *
 * 取值依据：武将所在势力的据点建筑文化（该势力名下据点出现最多的 buildingStyle，并列取先出现的）。
 * 战役专用守方势力没有据点（科塞亚、乌克西亚是战场守方），文化在下面 MANUAL 里逐个定，写明依据。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/gen-general-culture.mts
 * 之后新增武将：在表里补一行（或重跑本脚本）；`tools/verify-general-legion.mts` 会报缺文化的武将。
 */
import fs from 'node:fs';
import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import { FACTION_GENERALS } from '../src/data/FactionGenerals';

// 没有据点的武将（战场守方）：文化按史实定
const MANUAL: Record<string, { style: string; why: string }> = {
    kesaiya_kashtiliash: { style: 'PERSIAN', why: '科塞亚人：扎格罗斯山地部落，居波斯帝国（阿契美尼德）境内，按波斯文化' },
    wukexiya_madates: { style: 'PERSIAN', why: '乌克西亚人：扎格罗斯山地部落，向波斯王纳贡，按波斯文化' },
};

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
 *   · 取值依据：所在势力据点的建筑文化；战场守方（科塞亚、乌克西亚）无据点，按史实逐个定，见各行注释。
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
