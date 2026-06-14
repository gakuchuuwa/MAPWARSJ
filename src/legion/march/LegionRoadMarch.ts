import { GameConfig } from '../../config/GameConfig';
import { PerformanceMonitor } from '../../debug/PerformanceMonitor';
import { getEuclideanDistance, distanceAlongPolyline } from '../../core/DistanceUtils';
import { roadRegistry } from '../../roads/RoadRegistry';
import { City, LatLng } from '../../types/core';
import { gameLog } from '../../utils/GameLogger';
import { Army } from '../Army';
import {
    buildRoadMarchPath,
    findFirstHostileAlongPolyline,
    logSuspiciousMarchFirstLeg,
    resolveMarchTargetOnPath,
} from '../LegionMarchPath';
import { canResumeSavedMarch, marchPathPointsFromPreview } from './marchResumePolicy';
import type { CityManager } from '../../world/CityManager';
import { isCampaignLegion } from '../LegionSpawnPolicy';

export interface LegionRoadMarchDeps {
    cityManager: CityManager;
    roadFailureLogCooldown: Map<string, number>;
    marchDiagLogCooldown: Map<string, number>;
    triggerSiege: (army: Army, targetCity: City) => void;
}

function orderRoadMarchStartCandidates(
    army: Army,
    currentPos: LatLng,
    sourceCityId: string | undefined,
    nearestStartCityId: string | null | undefined,
    cityManager: CityManager
): string[] {
    const anchorId = sourceCityId ?? army.homeCityId ?? undefined;
    const raw = [sourceCityId, nearestStartCityId, army.homeCityId].filter(
        (id, idx, arr): id is string => !!id && arr.indexOf(id) === idx
    );

    if (!nearestStartCityId || !anchorId || anchorId === nearestStartCityId) {
        return raw;
    }

    const anchorCity = cityManager.getCity(anchorId);
    if (!anchorCity) {
        return raw;
    }

    const distToAnchor = getEuclideanDistance(currentPos, {
        lat: anchorCity.latitude,
        lng: anchorCity.longitude,
    });
    if (distToAnchor <= GameConfig.AI.MARCH_PREFER_NEAREST_START_DISTANCE) {
        return raw;
    }

    return [nearestStartCityId, sourceCityId, army.homeCityId].filter(
        (id, idx, arr): id is string => !!id && arr.indexOf(id) === idx
    );
}

function resolveMarchTarget(
    deps: LegionRoadMarchDeps,
    army: Army,
    factionId: string,
    startCityId: string | undefined,
    targetCityId: string,
    marchPath: { lat: number; lng: number }[],
    currentPos: LatLng,
): string {
    let marchTargetId = targetCityId;
    // 远征/剧本：直取战略目标，不从路网起点重扫身后敌城
    if (startCityId && !isCampaignLegion(army)) {
        marchTargetId = resolveMarchTargetOnPath(
            factionId,
            startCityId,
            targetCityId,
            marchPath,
            (id) => deps.cityManager.getCity(id)?.factionId,
            deps.cityManager,
            (fid, start, target, getFaction) =>
                roadRegistry.resolveFirstHostileCityOnPath(fid, start, target, getFaction)
        );
    }
    if (marchPath.length >= 2) {
        const polylineOpts = isCampaignLegion(army)
            ? { minAlong: Math.max(0, distanceAlongPolyline(currentPos, marchPath) - 0.02) }
            : undefined;
        marchTargetId = findFirstHostileAlongPolyline(
            factionId,
            marchPath,
            marchTargetId,
            deps.cityManager,
            polylineOpts,
        );
    }
    return marchTargetId;
}

/**
 * 战前保存的路径：目标未变时优先沿原道路折线继续（野战/攻城战后通用）。
 * 须在 resumeMovement 之前校验预览路径，避免先消费存档再发现 pathPoints 为空。
 */
function tryResumeRoadMarch(
    deps: LegionRoadMarchDeps,
    army: Army,
    targetCityId: string,
    marchHopId: string,
    currentPos: LatLng
): boolean {
    if (!army.hasSavedMarchState()) {
        return false;
    }

    const savedId = army.getSavedMarchTargetCityId();
    if (!canResumeSavedMarch(savedId, targetCityId, marchHopId)) {
        army.clearSavedMarchState();
        return false;
    }

    const targetCity =
        deps.cityManager.getCity(marchHopId) ?? deps.cityManager.getCity(targetCityId);
    const isHostile = !!(targetCity && targetCity.factionId !== army.getFactionId());
    const previewPath = army.buildMarchDisplayPath();
    const pathPoints = marchPathPointsFromPreview(previewPath, isHostile);

    if (previewPath.length < 2 || pathPoints.length === 0) {
        return false;
    }

    if (!army.resumeMovement()) {
        return false;
    }

    if (targetCity) {
        army.setTargetCity(targetCity);
    }

    logSuspiciousMarchFirstLeg(
        army,
        currentPos,
        previewPath,
        savedId,
        marchHopId,
        deps.cityManager,
        deps.marchDiagLogCooldown
    );
    army.lastPath = [...previewPath];

    const dest = targetCity?.name ?? marchHopId;
    gameLog('legionMarch', `🛤️ ${army.name} 恢复行军 →【${dest}】路径点 ${previewPath.length}`);
    army.moveAlongPath(pathPoints);
    return true;
}

/** 通过道路系统移动军团到目标城市 */
export function moveLegionToCity(
    deps: LegionRoadMarchDeps,
    army: Army,
    targetCityId: string,
    sourceCityId?: string
): boolean {
    const pathfindingStart = performance.now();
    const notePathfinding = () => {
        PerformanceMonitor.getInstance().noteAsyncWork('pathfinding', performance.now() - pathfindingStart);
    };

    if (!roadRegistry.isInitialized()) {
        console.warn('[LegionManager] RoadRegistry 尚未初始化，禁止离路行军');
        notePathfinding();
        return false;
    }

    const currentPos = army.getPosition();
    const factionId = army.getFactionId();

    const nearestStartCityId = roadRegistry.getNearestCityId(currentPos.lat, currentPos.lng);
    const pathPreviewForResume = nearestStartCityId
        ? roadRegistry.getFullPathToCity(currentPos, targetCityId, nearestStartCityId)
        : [];
    const hopForResume = resolveMarchTarget(
        deps,
        army,
        factionId,
        nearestStartCityId ?? undefined,
        targetCityId,
        pathPreviewForResume,
        currentPos,
    );
    if (tryResumeRoadMarch(deps, army, targetCityId, hopForResume, currentPos)) {
        notePathfinding();
        return true;
    }

    const startCandidates = orderRoadMarchStartCandidates(
        army,
        currentPos,
        sourceCityId,
        nearestStartCityId,
        deps.cityManager
    );

    let selectedStartCityId: string | undefined;
    let selectedPath: { lat: number; lng: number }[] | null = null;
    let marchTargetId = targetCityId;

    for (const candidateStartId of startCandidates) {
        const pathPreview = roadRegistry.getFullPathToCity(currentPos, targetCityId, candidateStartId);
        const candidateMarchTargetId = resolveMarchTarget(
            deps,
            army,
            factionId,
            candidateStartId,
            targetCityId,
            pathPreview ?? [],
            currentPos,
        );
        const candidatePath = roadRegistry.getFullPathToCity(
            currentPos,
            candidateMarchTargetId,
            candidateStartId
        );
        if (candidatePath && candidatePath.length >= 2) {
            selectedStartCityId = candidateStartId;
            selectedPath = candidatePath;
            marchTargetId = candidateMarchTargetId;
            break;
        }
    }

    if (marchTargetId !== targetCityId) {
        const hop = deps.cityManager.getCity(marchTargetId);
        const final = deps.cityManager.getCity(targetCityId);
        gameLog(
            'legionMarch',
            `🛤️ ${army.name} 路径：先【${hop?.name ?? marchTargetId}】→ 再【${final?.name ?? targetCityId}】`
        );
    }

    if (!selectedPath || selectedPath.length < 2) {
        const key = `${army.id}:${marchTargetId}`;
        const now = performance.now();
        const lastLogAt = deps.roadFailureLogCooldown.get(key) ?? 0;
        if (now - lastLogAt >= 10_000) {
            console.warn(
                `[LegionManager] 无法找到 ${army.name} 到城市 ${marchTargetId} 的道路（10s 节流）`
            );
            deps.roadFailureLogCooldown.set(key, now);
        }
        notePathfinding();
        return false;
    }

    const targetCity = deps.cityManager.getCity(marchTargetId);
    if (targetCity) {
        army.setTargetCity(targetCity);
    }

    const isHostile = targetCity && targetCity.factionId !== factionId;
    const siegeReach = GameConfig.SIEGE.COMBAT_RADIUS + 0.1;
    if (targetCity && isHostile) {
        const distToCity = getEuclideanDistance(currentPos, {
            lat: targetCity.latitude,
            lng: targetCity.longitude,
        });
        if (distToCity <= siegeReach && army.isIdle()) {
            deps.triggerSiege(army, targetCity);
            notePathfinding();
            return true;
        }
    }

    const finalPath = buildRoadMarchPath(currentPos, selectedPath, !!isHostile);
    logSuspiciousMarchFirstLeg(
        army,
        currentPos,
        finalPath,
        selectedStartCityId,
        marchTargetId,
        deps.cityManager,
        deps.marchDiagLogCooldown
    );

    const dest = deps.cityManager.getCity(marchTargetId)?.name ?? marchTargetId;
    gameLog('legionMarch', `🛤️ ${army.name} →【${dest}】路径点 ${finalPath.length}`);

    const pathPoints = isHostile ? finalPath.slice(1) : finalPath.slice(1, -1);

    if (pathPoints.length > 0) {
        army.lastPath = [...finalPath];
        army.moveAlongPath(pathPoints);
        notePathfinding();
        return true;
    }

    if (targetCity && isHostile) {
        const distToCity = getEuclideanDistance(currentPos, {
            lat: targetCity.latitude,
            lng: targetCity.longitude,
        });
        if (distToCity <= siegeReach) {
            army.stopMovement(true);
            army.setTargetCity(targetCity);
            deps.triggerSiege(army, targetCity);
            notePathfinding();
            return true;
        }
    }

    notePathfinding();
    return false;
}
