/** zoom ≤ 7：仅势力色，隐藏据点 */
export const FACTION_ONLY_MAX_ZOOM = 7;

/** zoom ≤ 8：宏观视图（zoom 8 = 据点 + 势力色；隐藏军队/道路/河流） */
export const MACRO_VIEW_MAX_ZOOM = 8;

export function isFactionOnlyZoom(zoom: number): boolean {
    return Math.floor(zoom) <= FACTION_ONLY_MAX_ZOOM;
}

export function isMacroMapZoom(zoom: number): boolean {
    return Math.floor(zoom) <= MACRO_VIEW_MAX_ZOOM;
}

/** @deprecated 使用 isFactionOnlyZoom */
export function isStrategicMapZoom(zoom: number): boolean {
    return isFactionOnlyZoom(zoom);
}

/** zoom ≤ 8 时隐藏：军队、河流、植被、战斗特效等 */
export const MACRO_HIDDEN_INFRA_PANES = [
    'npcPane',
    'siege-battle-pane',
    'field-battle-pane',
    'player-pane',
    'markerPane',
    'popupPane',
    'tooltipPane',
    'unitsPane',
    'unitsLowPane',
    'effectsPane',
    'riverPane',
    'vectorRiverPane',
    'treePane',
] as const;

/** 仅 zoom ≤ 7 时额外隐藏据点与城名 */
export const FACTION_ONLY_HIDDEN_PANES = [
    'cityPane',
    'labelsPane',
] as const;
