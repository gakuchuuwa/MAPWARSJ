/**
 * 导出 scratch/faction_flag_template_by_tier.json（审计快照，可选）
 * 游戏内级别 = 运行时计算，见 factionTierClassify.ts
 */
import fs from 'fs';
import path from 'path';
import { classifyFactionTier, FACTION_FLAG_TEMPLATE_BY_TIER } from '../src/data/factionTierClassify.ts';

const root = path.resolve(import.meta.dirname, '..');

function loadFactions() {
    const src = fs.readFileSync(path.join(root, 'src/data/factions.ts'), 'utf8');
    return [...src.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)].map((m) => ({
        id: m[1],
        name: m[2],
    }));
}

function loadDisplay() {
    const src = fs.readFileSync(path.join(root, 'src/data/SandboxDisplayNames.ts'), 'utf8');
    const map: Record<string, string> = {};
    for (const m of src.matchAll(/^\s*'([^']+)':\s*'([^']+)'/gm)) map[m[1]] = m[2];
    return map;
}

const factions = loadFactions().filter((f) => f.id !== 'panjun');
const display = loadDisplay();
const entries = [];
const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, unclassified: 0 };

for (const f of factions) {
    const flag = display[f.id] || f.name;
    const { tier, category, note, flagLen } = classifyFactionTier(f.id, flag);
    if (note.includes('无审计')) stats.unclassified++;
    entries.push({
        id: f.id,
        flag,
        flagLen,
        tier,
        flagTemplate: FACTION_FLAG_TEMPLATE_BY_TIER[tier],
        category,
        note,
    });
    stats[tier]++;
}

entries.sort((a, b) => a.tier - b.tier || a.flag.localeCompare(b.flag, 'zh'));

const out = {
    updated: new Date().toISOString().slice(0, 10),
    scope: '正规势力 only；panjun 叛军据点不在此表',
    rule: '1政权一字/7, 2民族/43, 3政权二字/14, 4家族州郡二字/46, 5家族州郡一字/31, 6起义/22',
    note: '游戏内级别=运行时(SandboxDisplayNames+factionTierClassify)；本文件仅作审计快照',
    flagTemplates: FACTION_FLAG_TEMPLATE_BY_TIER,
    total: factions.length,
    stats: {
        tier1_regime_1char: stats[1],
        tier2_ethnic_all: stats[2],
        tier3_regime_2char: stats[3],
        tier4_family_place_2char: stats[4],
        tier5_family_place_1char: stats[5],
        tier6_uprising: stats[6],
        default_no_audit: stats.unclassified,
    },
    entries,
};

fs.writeFileSync(
    path.join(root, 'scratch/faction_flag_template_by_tier.json'),
    JSON.stringify(out, null, 2),
    'utf8',
);

console.log(JSON.stringify(out.stats, null, 2));
