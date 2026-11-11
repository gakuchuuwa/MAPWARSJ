/**
 * GG 第五轮落地核验（2026-11-11）
 * 逐项对照 docs/AGENTS/势力全表-GG核定结果-2026-11-11.csv：
 *   ① 并入/删除的势力是否已从全部数据表消失
 *   ② 新起止年是否已写入 FACTION_SPAN
 *   ③ 武将改挂（35 位）是否已生效
 *   ④ 势力时代分段（长时代按年代分段）
 *   ⑤ 全库重复 generalId（同人双 ID）
 *   ⑥ 武将在自己势力成立之前登场（登场年 < 势力起始年）
 *   ⑦ 挂错/不存在的 factionId、cityId
 *
 * 跑法：npx tsx --import ./tools/sim-preload.mjs tools/gg5/verify.mts
 */
import { FACTIONS } from '../../src/data/factions';
import { FACTION_ERA } from '../../src/data/FactionEra';
import { FACTION_SPAN } from '../../src/data/FactionLifeYears';
import { FACTION_GENERALS } from '../../src/data/FactionGenerals';
import { GENERAL_LIFE_YEARS, getGeneralDebutYear } from '../../src/data/GeneralLifeYears';
import { loadGG } from './gg_lib.mjs';

const { gg, move, gap, life, root } = loadGG();
const factions = FACTIONS as Array<{ id: string; name: string }>;
const factionIds = new Set(factions.map(f => f.id));

type G = any;
const allGenerals: Array<{ fid: string; g: G }> = [];
for (const [k, entry] of Object.entries(FACTION_GENERALS as Record<string, any>)) {
    for (const g of (Array.isArray(entry) ? entry : [entry]) as G[]) allGenerals.push({ fid: (g.factionId ?? k) as string, g });
}
const byGid = new Map<string, Array<{ fid: string; g: G }>>();
for (const r of allGenerals) {
    const id = r.g.generalId;
    if (!byGid.has(id)) byGid.set(id, []);
    byGid.get(id)!.push(r);
}

const out: string[] = [];
const P = (s: string) => out.push(s);

P(`# GG 第五轮核验  ${new Date().toISOString()}`);
P(`势力总数（当前 FACTIONS）= ${factions.length}｜GG 表行数 = ${gg.size}`);
P(`武将条目 = ${allGenerals.length}｜唯一 generalId = ${byGid.size}`);

// ① 已删/已并势力残留
const toDrop = new Set<string>();
for (const [fid, v] of gg) if (/并入|删除/.test(v.act) && root(fid) !== fid) toDrop.add(fid);
P(`\n## ① 应消失势力（并入/删除）＝ ${toDrop.size}`);
const residue: string[] = [];
for (const fid of toDrop) {
    if (factionIds.has(fid)) residue.push(`FACTIONS:${fid}`);
    if ((FACTION_ERA as any)[fid]) residue.push(`FACTION_ERA:${fid}`);
    if ((FACTION_SPAN as any)[fid]) residue.push(`FACTION_SPAN:${fid}`);
    if ((FACTION_GENERALS as any)[fid]) residue.push(`FACTION_GENERALS:${fid}`);
    if (allGenerals.some(r => r.fid === fid)) residue.push(`FACTION_GENERALS(factionId):${fid}`);
}
P(residue.length ? `残留 ${residue.length}：\n  ` + residue.join('\n  ') : '无残留 ✅');

// ② 新起止年
P(`\n## ② 起止年写入情况`);
let spanMissing = 0, spanDiff = 0, spanOk = 0;
const spanBad: string[] = [];
for (const [fid, v] of gg) {
    if (root(fid) !== fid) continue;
    if (!Number.isFinite(v.s) || !Number.isFinite(v.e)) continue;
    const cur = (FACTION_SPAN as any)[fid];
    if (!cur) { spanMissing++; spanBad.push(`缺失 ${fid}`); continue; }
    if (cur.start !== v.s || cur.end !== v.e) { spanDiff++; spanBad.push(`不符 ${fid} 现=${cur.start}–${cur.end} GG=${v.s}–${v.e}`); }
    else spanOk++;
}
P(`一致 ${spanOk}｜缺登记 ${spanMissing}｜数值不符 ${spanDiff}`);
for (const s of spanBad.slice(0, 40)) P('  ' + s);
if (spanBad.length > 40) P(`  …另 ${spanBad.length - 40} 条`);

// ③ 改挂武将
P(`\n## ③ 武将改挂（GG:挂错）＝ ${move.size}`);
const moveBad: string[] = [];
for (const [gid, to] of move) {
    const recs = byGid.get(gid);
    if (!recs) { moveBad.push(`缺武将 ${gid} → ${to}`); continue; }
    const target = root(to);
    if (!recs.some(r => r.fid === target)) moveBad.push(`${gid} 当前=${[...new Set(recs.map(r => r.fid))].join('/')} 期望=${target}`);
}
P(moveBad.length ? `未生效 ${moveBad.length}：\n  ` + moveBad.join('\n  ') : '全部已生效 ✅');

// ④ 时代分段
P(`\n## ④ 势力时代分段`);
const segs = Object.entries(FACTION_ERA as Record<string, readonly { from: number; era: string }[]>);
const multi = segs.filter(([, s]) => s.length > 1);
P(`FACTION_ERA 登记 ${segs.length} 家｜多段 ${multi.length} 家｜段总数 ${segs.reduce((a, [, s]) => a + s.length, 0)}`);
const noEra = factions.filter(f => f.id !== 'panshu' && !(FACTION_ERA as any)[f.id]).map(f => f.id);
P(noEra.length ? `缺时代 ${noEra.length}：${noEra.slice(0, 30).join(', ')}` : '缺时代：无 ✅');

// ⑤ 重复 generalId
P(`\n## ⑤ 同人双 ID / 重复挂载`);
const dupes = [...byGid.entries()].filter(([, rs]) => rs.length > 1);
P(`重复 generalId ${dupes.length} 条`);
for (const [gid, rs] of dupes.slice(0, 40)) {
    P(`  ${gid} ×${rs.length}：${rs.map(r => `${r.fid}/${r.g.cityId ?? '-'}/${r.g.generalName}`).join('  |  ')}`);
}
if (dupes.length > 40) P(`  …另 ${dupes.length - 40} 条`);

// ⑥ 武将早于势力登场
P(`\n## ⑥ 武将登场年 < 势力起始年`);
let early = 0;
const earlyList: string[] = [];
for (const { fid, g } of allGenerals) {
    const span = (FACTION_SPAN as any)[fid];
    if (!span || !Number.isFinite(span.start)) continue;
    const debut = getGeneralDebutYear(g.generalId);
    if (debut == null) continue;
    if (debut < span.start) { early++; if (earlyList.length < 25) earlyList.push(`${g.generalId}(${g.generalName}) 登场${debut} < ${fid} 起${span.start}`); }
}
P(`早登场 ${early} 位（clamp 生效后运行时出场年取较晚值）`);
for (const s of earlyList) P('  ' + s);

// ⑦ 挂错 factionId / cityId
P(`\n## ⑦ 悬空引用`);
const badFid = allGenerals.filter(r => !factionIds.has(r.fid));
P(`factionId 不存在：${badFid.length}` + (badFid.length ? '：' + badFid.slice(0, 15).map(r => `${r.g.generalId}→${r.fid}`).join(', ') : ' ✅'));
const ids = new Set(Object.keys(FACTION_GENERALS as any));
P(`FACTION_GENERALS 外层键 ${ids.size}｜不在 FACTIONS：${[...ids].filter(k => !factionIds.has(k)).slice(0, 20).join(', ') || '无 ✅'}`);

// ⑧ 武将生卒年（GG 修正）
P(`\n## ⑧ 生卒年（GG:挂错 内 x/y）＝ ${life.size}`);
const lifeBad: string[] = [];
for (const [gid, [b, d]] of life) {
    const cur = (GENERAL_LIFE_YEARS as any)[gid];
    if (!cur) { lifeBad.push(`缺档案 ${gid}`); continue; }
    if (cur.birth !== b || cur.death !== d) lifeBad.push(`${gid} 现=${cur.birth}/${cur.death} GG=${b}/${d}`);
}
P(lifeBad.length ? `不符 ${lifeBad.length}：\n  ` + lifeBad.join('\n  ') : '全部一致 ✅');

// ⑨ 史实缺口（库里没政权可挂的武将）
P(`\n## ⑨ 史实缺口 ＝ ${gap.size}`);
for (const [gid, info] of gap) {
    const recs = byGid.get(gid);
    const fid = recs?.[0]?.fid ?? '(未挂载)';
    P(`  ${gid} → 现挂 ${fid}｜GG: ${info}`);
}

console.log(out.join('\n'));
