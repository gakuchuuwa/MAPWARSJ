/**
 * 模拟器花名册（基础版第一步）：列出全部【名将】与【T0 精锐】
 * 运行：npm run sim:roster
 *
 * 用途：作为战斗/推演模拟器的「可参战单位池」清单，供后续选将/选精锐对战。
 * 只读数据，不改任何文件。
 */
import {
    GENERAL_PROFILES,
    TACTICAL_SKILL_CATALOG,
    STRATEGIC_SKILL_CATALOG,
} from '../src/data/GeneralSkills';
import { FACTION_GENERALS } from '../src/data/FactionGenerals';
// 注：FactionGenerals 间接 import portrait_defaults（virtual:portrait-manifest），
// 由 tools/sim-preload.mjs 桩空后可在命令行加载。
// FactionGeneralPools（N+1 出征池）已搁置为占位，不使用；现行「一势力一武将」= FACTION_GENERALS。
import { FACTIONS } from '../src/data/factions';
import { STARTING_CAPITALS } from '../src/data/StartingCapitals';
import { CITIES_V2 } from '../src/data/cities_v2';

// 14 文化区精锐表
import { JAPAN_EXPEDITION_ELITE_LEGIONS } from '../src/data/JapanExpeditionLegions';
import { KOREA_EXPEDITION_ELITE_LEGIONS } from '../src/data/KoreaExpeditionLegions';
import { NORTHEAST_EXPEDITION_ELITE_LEGIONS } from '../src/data/NortheastExpeditionLegions';
import { STEPPE_EXPEDITION_ELITE_LEGIONS } from '../src/data/SteppeExpeditionLegions';
import { WESTERN_EXPEDITION_ELITE_LEGIONS } from '../src/data/WesternExpeditionLegions';
import { CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS } from '../src/data/CentralAsiaExpeditionLegions';
import { TIBET_EXPEDITION_ELITE_LEGIONS } from '../src/data/TibetExpeditionLegions';
import { DIANQIAN_EXPEDITION_ELITE_LEGIONS } from '../src/data/DianQianExpeditionLegions';
import { LINGNAN_EXPEDITION_ELITE_LEGIONS } from '../src/data/LingnanExpeditionLegions';
import { JIANGNAN_EXPEDITION_ELITE_LEGIONS } from '../src/data/JiangnanExpeditionLegions';
import { NORTH_EXPEDITION_ELITE_LEGIONS } from '../src/data/NorthExpeditionLegions';
import { CENTRAL_EXPEDITION_ELITE_LEGIONS } from '../src/data/CentralExpeditionLegions';
import { BASHU_EXPEDITION_ELITE_LEGIONS } from '../src/data/BashuExpeditionLegions';
import { HEXI_EXPEDITION_ELITE_LEGIONS } from '../src/data/HexiExpeditionLegions';

type EliteEntry = { name: string; tier: 0 | 1 | 2 | 3 | 4 };

const ALL_ELITE: Record<string, EliteEntry> = {
    ...JAPAN_EXPEDITION_ELITE_LEGIONS,
    ...KOREA_EXPEDITION_ELITE_LEGIONS,
    ...NORTHEAST_EXPEDITION_ELITE_LEGIONS,
    ...STEPPE_EXPEDITION_ELITE_LEGIONS,
    ...WESTERN_EXPEDITION_ELITE_LEGIONS,
    ...CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS,
    ...TIBET_EXPEDITION_ELITE_LEGIONS,
    ...DIANQIAN_EXPEDITION_ELITE_LEGIONS,
    ...LINGNAN_EXPEDITION_ELITE_LEGIONS,
    ...JIANGNAN_EXPEDITION_ELITE_LEGIONS,
    ...NORTH_EXPEDITION_ELITE_LEGIONS,
    ...CENTRAL_EXPEDITION_ELITE_LEGIONS,
    ...BASHU_EXPEDITION_ELITE_LEGIONS,
    ...HEXI_EXPEDITION_ELITE_LEGIONS,
};

// ── 查询表 ──
const factionName = new Map<string, string>();
for (const f of FACTIONS) factionName.set(f.id, f.name);

const cityById = new Map<string, { name: string; region: string }>();
for (const c of CITIES_V2) cityById.set(c.id, { name: c.name, region: c.region ?? '—' });

/** generalId → factionId / 显示名 反查（现行一势力一武将，源 FACTION_GENERALS） */
const generalFaction = new Map<string, string>();
const generalNameById = new Map<string, string>();
for (const [fid, g] of Object.entries(FACTION_GENERALS)) {
    generalFaction.set(g.generalId, fid);
    generalNameById.set(g.generalId, g.generalName);
}

function fname(fid: string | undefined): string {
    if (!fid) return '—';
    return factionName.get(fid) ?? fid;
}

function tacName(id: string): string {
    return TACTICAL_SKILL_CATALOG[id]?.displayName ?? id ?? '—';
}
function strName(id: string | undefined): string {
    if (!id) return '—';
    return STRATEGIC_SKILL_CATALOG[id]?.displayName ?? id;
}
function displayName(generalId: string): string {
    return generalNameById.get(generalId) ?? generalId;
}

function pad(s: string, width: number): string {
    // 中文按 2 宽计
    let w = 0;
    for (const ch of s) w += ch.charCodeAt(0) > 255 ? 2 : 1;
    return s + ' '.repeat(Math.max(0, width - w));
}

// ══ 名将清单 ══
type GRow = { general: string; gid: string; faction: string; tac: string; str: string };
const generals: GRow[] = [];
for (const p of Object.values(GENERAL_PROFILES)) {
    if (p.tier !== 'famous') continue;
    const fid = generalFaction.get(p.generalId);
    generals.push({
        general: displayName(p.generalId),
        gid: p.generalId,
        faction: fname(fid),
        tac: tacName(p.tacticalSkillId),
        str: strName(p.strategicSkillId),
    });
}
generals.sort((a, b) => a.faction.localeCompare(b.faction, 'zh') || a.general.localeCompare(b.general, 'zh'));

console.log('\n══════════════ 名将清单（tier: famous） ══════════════');
console.log(`共 ${generals.length} 名\n`);
console.log(`${pad('#', 4)}${pad('名将', 12)}${pad('势力', 12)}${pad('战术技', 12)}${pad('战略技', 12)}${'generalId'}`);
console.log('─'.repeat(78));
generals.forEach((g, i) => {
    console.log(
        `${pad(String(i + 1), 4)}${pad(g.general, 12)}${pad(g.faction, 12)}${pad(g.tac, 12)}${pad(g.str, 12)}${g.gid}`,
    );
});

// ══ T0 精锐清单 ══
type ERow = { legion: string; faction: string; capital: string; region: string; fid: string };
const elites: ERow[] = [];
for (const [fid, cfg] of Object.entries(ALL_ELITE)) {
    if (cfg.tier !== 0) continue;
    const capId = STARTING_CAPITALS[fid];
    const cap = capId ? cityById.get(capId) : undefined;
    elites.push({
        legion: cfg.name,
        faction: fname(fid),
        capital: cap?.name ?? (capId ?? '—'),
        region: cap?.region ?? '—',
        fid,
    });
}
elites.sort((a, b) => a.region.localeCompare(b.region) || a.faction.localeCompare(b.faction, 'zh'));

console.log('\n\n══════════════ T0 精锐清单（tier: 0 传奇之兵 ×1.5） ══════════════');
console.log(`共 ${elites.length} 支\n`);
console.log(`${pad('#', 4)}${pad('番号', 12)}${pad('势力', 12)}${pad('锚点据点', 12)}${pad('文化区', 12)}${'factionId'}`);
console.log('─'.repeat(78));
elites.forEach((e, i) => {
    console.log(
        `${pad(String(i + 1), 4)}${pad(e.legion, 12)}${pad(e.faction, 12)}${pad(e.capital, 12)}${pad(e.region, 12)}${e.fid}`,
    );
});

console.log('');
