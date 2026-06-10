/**
 * 战后道路恢复策略（纯函数，便于单测与代码审查）
 *
 * 流程：moveLegionToCity → tryResumeRoadMarch → 失败才 getFullPathToCity 重算接路
 * 重算时若距路网 > joinEps，首段为直线接入，野战后观感差。
 */

/** 战前目标与当前战略/跳城是否一致，才允许 resume（否则清存档并重算） */
export function canResumeSavedMarch(
    savedTargetCityId: string | undefined,
    strategicTargetId: string,
    marchHopId: string
): boolean {
    return (
        !savedTargetCityId ||
        savedTargetCityId === strategicTargetId ||
        savedTargetCityId === marchHopId
    );
}

/** 从战前预览折线得到 moveAlongPath 所需路点（须在 resumeMovement 之前计算） */
export function marchPathPointsFromPreview(
    previewPath: { lat: number; lng: number }[],
    hostileTarget: boolean
): { lat: number; lng: number }[] {
    if (previewPath.length < 2) return [];
    return hostileTarget ? previewPath.slice(1) : previewPath.slice(1, -1);
}
