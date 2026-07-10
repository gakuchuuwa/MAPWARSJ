/**
 * 名册武将名 → generalId / aptitude / 技能 id（模拟器共用；名将优先读 GENERAL_PROFILES）
 */
import { FACTION_GENERALS } from '../src/data/FactionGenerals';
import { GENERAL_PROFILES, STRATEGIC_SKILL_CATALOG, getTacticalSkillDef } from '../src/data/GeneralSkills';

const GENERAL_ID_BY_NAME: Record<string, string> = {};
for (const entry of Object.values(FACTION_GENERALS)) {
    GENERAL_ID_BY_NAME[entry.generalName] = entry.generalId;
}

export function resolveGeneralIdByName(name: string): string | null {
    return GENERAL_ID_BY_NAME[name] ?? null;
}

export function resolveAptitudeByGeneralName(name: string): 'create' | 'leverage' | 'reverse' {
    const gid = resolveGeneralIdByName(name);
    if (!gid) return 'create';
    const apt = GENERAL_PROFILES[gid]?.aptitude;
    if (apt === 'leverage' || apt === 'reverse') return apt;
    return 'create';
}

/** 名册载入后统计：名将无 generalId 或 GENERAL_PROFILES 档案 */
export function auditRosterGenerals(
    entries: ReadonlyArray<{ generalName: string; tier: string }>,
): { missingId: string[]; missingProfile: string[] } {
    const missingId: string[] = [];
    const missingProfile: string[] = [];
    for (const e of entries) {
        if (e.tier !== '名将') continue;
        const gid = resolveGeneralIdByName(e.generalName);
        if (!gid) {
            missingId.push(e.generalName);
            continue;
        }
        if (!GENERAL_PROFILES[gid]) missingProfile.push(e.generalName);
    }
    return { missingId, missingProfile };
}

const CIRC: Record<string, string> = {
    '①': '01', '②': '02', '③': '03', '④': '04', '⑤': '05',
    '⑥': '06', '⑦': '07', '⑧': '08', '⑨': '09', '⑩': '10',
    '⑪': '11', '⑫': '12', '⑬': '13', '⑭': '14', '⑮': '15',
    '⑯': '16', '⑰': '17', '⑱': '18', '⑲': '19', '⑳': '20',
};

/** 名册战术列 → ts_xxx（普将/无档案 fallback） */
export function rosterTacticalId(n: string): string | null {
    const m = n.match(/^(\d+)\s/);
    if (m) return `ts_${m[1].padStart(3, '0')}`;
    const cm = n.match(/^([①-⑳])/);
    if (cm) return `tac_${CIRC[cm[0][0]] || '01'}`;
    return null;
}

/** 名册战略列 → str_xx（普将/无档案 fallback） */
export function rosterStrategicId(n: string): string | null {
    const m = n.match(/S([①-⑮])\s/);
    if (!m) return null;
    const map: Record<string, string> = {
        '①': '01', '②': '02', '③': '03', '④': '04', '⑤': '05',
        '⑥': '06', '⑦': '07', '⑧': '08', '⑨': '09', '⑩': '10',
        '⑪': '11', '⑫': '12', '⑬': '13', '⑭': '14', '⑮': '15',
    };
    return `str_${map[m[1]] || '01'}`;
}

const STRAT_GRID: Record<string, string> = {
    str_01: 'S①', str_02: 'S②', str_03: 'S③', str_04: 'S④', str_05: 'S⑤',
    str_06: 'S⑥', str_07: 'S⑦', str_08: 'S⑧', str_09: 'S⑨', str_10: 'S⑩',
    str_11: 'S⑪', str_12: 'S⑫', str_13: 'S⑬', str_14: 'S⑭', str_15: 'S⑮',
};

function formatTacticalLabel(id: string | null): string {
    if (!id) return '—';
    const def = getTacticalSkillDef(id);
    if (!def) return id;
    const idx = def.index ?? parseInt(id.replace(/\D/g, ''), 10);
    return `${idx} ${def.displayName}`;
}

function formatStrategicLabel(id: string | null): string {
    if (!id) return '—';
    const def = STRATEGIC_SKILL_CATALOG[id];
    if (!def) return id;
    return `${STRAT_GRID[id] ?? id} ${def.displayName}`;
}

/** 名将优先 GENERAL_PROFILES；否则回退名册解析 */
export function resolveCombatSkillIds(
    generalName: string,
    tier: string,
    rosterTactical: string,
    rosterStrategic: string,
): { tacticalSkillId: string | null; strategicSkillId: string | null } {
    if (tier === '名将') {
        const gid = resolveGeneralIdByName(generalName);
        const p = gid ? GENERAL_PROFILES[gid] : null;
        if (p) {
            return {
                tacticalSkillId: p.tacticalSkillId || null,
                strategicSkillId: p.strategicSkillId ?? null,
            };
        }
    }
    return {
        tacticalSkillId: rosterTacticalId(rosterTactical),
        strategicSkillId: rosterStrategicId(rosterStrategic),
    };
}

/** 模拟输出用：与 resolveCombatSkillIds 同源的标签 */
export function resolveCombatSkillLabels(
    generalName: string,
    tier: string,
    rosterTactical: string,
    rosterStrategic: string,
): { tacticalName: string; strategicName: string } {
    const ids = resolveCombatSkillIds(generalName, tier, rosterTactical, rosterStrategic);
    const gid = tier === '名将' ? resolveGeneralIdByName(generalName) : null;
    if (gid && GENERAL_PROFILES[gid]) {
        return {
            tacticalName: formatTacticalLabel(ids.tacticalSkillId),
            strategicName: formatStrategicLabel(ids.strategicSkillId),
        };
    }
    return { tacticalName: rosterTactical, strategicName: rosterStrategic };
}

/** 名册 eliteTier 列（T0–T4）→ combat-model 0..4；无番号/非法 → null */
export function parseRosterEliteTier(raw: string | undefined | null): number | null {
    const s = (raw ?? '').trim();
    if (!s || s === '—' || s === '-') return null;
    const m = s.match(/^T?\s*([0-4])$/i);
    if (!m) return null;
    return parseInt(m[1], 10);
}
