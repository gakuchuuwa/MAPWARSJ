import { LatLng } from '../../types/core';

export interface MarchSaveSnapshot {
    savedPathQueue: LatLng[];
    savedDestination: LatLng | null;
    savedTargetCity: unknown;
}

/**
 * 开战停步时写入战前道路存档。
 *
 * 规则：
 * - pathQueue 非空 → 用当前在途路径覆盖存档
 * - pathQueue 已空且已有存档 → 保留（避免野战/攻城二次 stopMovement 清空 savedPathQueue）
 * - 否则 → 记录空存档（idle 军团被开战圈卷入等）
 *
 * saveState=true 合法调用点：
 * - LegionFieldBattle.startFieldBattleBetween（每军团一次）
 * - LegionManager.triggerSiege
 * - SiegeManager 攻城第三方排队 / 区域协同参战
 */
export function captureMarchSaveSnapshot(
    pathQueue: LatLng[],
    destination: LatLng,
    targetCity: unknown,
    existing: MarchSaveSnapshot
): MarchSaveSnapshot {
    const hasExisting =
        existing.savedPathQueue.length > 0 || existing.savedDestination !== null;

    if (pathQueue.length > 0) {
        return {
            savedPathQueue: pathQueue.map((p) => ({ ...p })),
            savedDestination: { ...destination },
            savedTargetCity: targetCity,
        };
    }

    if (!hasExisting) {
        return {
            savedPathQueue: [],
            savedDestination: { ...destination },
            savedTargetCity: targetCity,
        };
    }

    const savedTargetCity =
        targetCity && !existing.savedTargetCity ? targetCity : existing.savedTargetCity;

    return {
        savedPathQueue: existing.savedPathQueue.map((p) => ({ ...p })),
        savedDestination: existing.savedDestination
            ? { ...existing.savedDestination }
            : null,
        savedTargetCity,
    };
}

export function emptyMarchSaveSnapshot(): MarchSaveSnapshot {
    return {
        savedPathQueue: [],
        savedDestination: null,
        savedTargetCity: null,
    };
}
