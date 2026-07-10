/**
 * 名册武将名 → generalId / aptitude（模拟器共用）
 */
import { FACTION_GENERALS } from '../src/data/FactionGenerals';
import { GENERAL_PROFILES } from '../src/data/GeneralSkills';

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

/** 名册 eliteTier 列（T0–T4）→ combat-model 0..4；无番号/非法 → null */
export function parseRosterEliteTier(raw: string | undefined | null): number | null {
    const s = (raw ?? '').trim();
    if (!s || s === '—' || s === '-') return null;
    const m = s.match(/^T?\s*([0-4])$/i);
    if (!m) return null;
    return parseInt(m[1], 10);
}
