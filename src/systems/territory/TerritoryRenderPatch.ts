import * as L from 'leaflet';
import { City } from '../../types/core';
import { FactionManager } from '../../core/FactionManager';
import { GridSystem } from '../GridSystem';

export type HexOwnershipMap = Map<number, City>;
export type HexCell = { q: number; r: number; key: number };

/** 从 hex 所有权收集需重绘的势力 groupKey（叛军按城分） */
export function collectGroupKeysForFactions(
    hexOwnership: HexOwnershipMap,
    factionIds: Set<string>
): Set<string> {
    const groups = new Set<string>();
    hexOwnership.forEach((city) => {
        const fid = city.factionId || 'neutral';
        if (!factionIds.has(fid)) return;
        const groupKey = fid === 'panjun' ? `panjun_${city.id}` : fid;
        groups.add(groupKey);
    });
    return groups;
}

export function hexOwnershipToFactionHexes(
    hexOwnership: HexOwnershipMap,
    groupKeys: Set<string>
): Map<string, HexCell[]> {
    const factionHexes = new Map<string, HexCell[]>();
    hexOwnership.forEach((city, key) => {
        const fid = city.factionId || 'neutral';
        const groupKey = fid === 'panjun' ? `panjun_${city.id}` : fid;
        if (!groupKeys.has(groupKey)) return;
        const { q, r } = GridSystem.getCoordsFromKey(key);
        if (!factionHexes.has(groupKey)) factionHexes.set(groupKey, []);
        factionHexes.get(groupKey)!.push({ q, r, key });
    });
    return factionHexes;
}
