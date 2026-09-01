/**
 * 实时开战圈援军：周期性扫描 BATTLE_JOIN_RADIUS 内同旗军团并加入进行中的区域战。
 */
import { BattleField } from '../../combat/BattleField';
import { BattleUnitFactory } from '../../combat/BattleUnitFactory';
import { CombatSystem } from '../../combat/CombatSystem';
import { GameConfig } from '../../config/GameConfig';
import { getEuclideanDistance } from '../../core/DistanceUtils';
import { Army } from '../Army';
import { LatLng } from '../../types/core';
import { SpatialRegistry } from '../../world/SpatialRegistry';
import { LandSeaSystem } from '../../world/land-sea/LandSeaSystem';
import type { LegionManager } from '../LegionManager';
import { markLegionAnnihilationFeed } from '../LegionAnnihilationFeed';
import { speechAnnouncer, type CaptureJu } from '../../audio/SpeechAnnouncer';
import { getGeneralRecordByGeneralId } from '../../data/FactionGenerals';
import { getLegionEliteLegionName } from '../../data/ExpeditionLegions';

export const BATTLE_REINFORCEMENT_POLL_INTERVAL_SEC = 0.2;

export interface ReinforcementPollState {
    remainingSec: number;
}

export function createReinforcementPollState(): ReinforcementPollState {
    return { remainingSec: 0 };
}

export interface ReinforcementJoinDeps {
    spatialRegistry: SpatialRegistry;
    removeArmy: (army: Army) => void;
    isArmyWaitingSiege?: (armyId: string) => boolean;
    resolveBattleCityName?: (center: LatLng) => string;
    /** 编入攻城战前城周错开（仅攻城注入，野战不传） */
    beforeJoinLegion?: (legion: Army, center: LatLng) => void;
    /**
     * 攻城城 id：有值时不拉攻方「路过/奔他城」军团入战。
     * 野战不传（短距接触战，路过同旗仍可协战）。
     */
    siegeCityId?: string;
}

export function isEligibleReinforcement(
    legion: Army,
    factionId: string,
    battleField: BattleField,
    center: LatLng,
    deps: ReinforcementJoinDeps,
    isAttacker: boolean,
): boolean {
    if (legion.getFactionId() !== factionId) return false;
    if (legion.type !== 'legion' || legion.isDestroyed) return false;
    if (legion.getIsInCombat()) return false;
    if (legion.getTroops() < GameConfig.COMBAT.MIN_SURVIVAL_TROOPS) return false;
    if (battleField.hasUnit(legion.id)) return false;
    if (deps.isArmyWaitingSiege?.(legion.id)) return false;

    const dist = getEuclideanDistance(legion.getPosition(), center);
    if (dist > GameConfig.COMBAT.BATTLE_JOIN_RADIUS) return false;

    // 攻城援军：守方同旗路过也强制参战；攻方不拉路过者
    if (deps.siegeCityId && isAttacker) {
        const targetId = legion.getTargetCity?.()?.id;
        if (!legion.isIdle()) {
            if (targetId && targetId !== deps.siegeCityId) return false;
            if (!targetId) return false;
        }
    }

    return true;
}

/**
 * 海军舰队参加攻城战：强制登陆（船→陆）。
 * 🔴 攻城战里没有船（主人定：舰队打据点=陆战），但**绝不因为找不到岸就拒绝参战**。
 *    城心必然是陆地，所以从当前位置朝城心推进一定踩得到陆地 —— 登陆永远成功。
 *    改前是沿「舰队→城」方向按 7 个定长档试探，0.22° 内没陆地就放弃：
 *    早期放弃后照常编入 → 船停在城墙下打攻城；后来改成放弃就不编入 → 整支水军干等着不参战。
 *    两个都不对，正解是「一定能上岸」。
 * 落点：沿「舰队→城心」取**第一个**陆地点 = 离舰队最近的滩头，位移尽量小。
 *    （beforeJoinLegion / repositionAllLegionsNearSiegeCity 只统一转向面城、不改坐标，
 *      所以上岸这一步必须自己挪位，指望它把船摆到陆地上是错的。）
 */
export function landNavalLegionForSiege(legion: Army, center: LatLng): void {
    if (!legion.isOnSea) return;
    const pos = legion.getPosition();
    const dLat = center.lat - pos.lat;
    const dLng = center.lng - pos.lng;
    // 当前位置 → 城心等分推进，第一个陆地点即滩头（i=0 就是陆地则原地上岸，不挪位）
    const STEPS = 24;
    for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        const lat = pos.lat + dLat * t;
        const lng = pos.lng + dLng * t;
        if (!LandSeaSystem.isLandAt({ lat, lng } as any)) continue;
        if (i > 0) legion.setPosition(lat, lng);
        legion.isOnSea = false; // 强制上岸（绕过迟滞，下一帧 updateTerrainSpeed 清零累积）
        return;
    }
    // 整条线都判成水（掩膜异常）→ 仍旧上岸，原地不挪位。
    // 宁可贴图从船变步兵，也不要让水军漂在圈里干等着不参战。
    legion.isOnSea = false;
}

function createLegionAdapter(
    legion: Army,
    deps: ReinforcementJoinDeps,
    side: 'attacker' | 'defender',
    battleCityName: string
) {
    const adapter = BattleUnitFactory.createAdapter(
        legion.id,
        legion.name || '军团',
        legion.getFactionId(),
        legion,
        'legion',
        legion.getTroops(),
        () => {
            legion.setCombatState(false);
        },
        () => {
            markLegionAnnihilationFeed(legion, side, battleCityName, 'siege', adapter.battleOverriddenSkillId);
            // 尸体由 Army.destroy + LegionManager 延迟 removeArmy（CORPSE_DISPLAY_MS）统一处理
            legion.destroy();
        }
    );
    return adapter;
}

/** 将单支军团加入进行中的区域战；成功返回 true */
export function tryJoinLegionToBattle(
    battleField: BattleField,
    legion: Army,
    isAttacker: boolean,
    center: LatLng,
    deps: ReinforcementJoinDeps
): boolean {
    if (battleField.isOver) return false;

    const factionId = isAttacker
        ? battleField.getAttackerFactionId()
        : battleField.getDefenderFactionId();

    if (!isEligibleReinforcement(legion, factionId, battleField, center, deps, isAttacker)) {
        return false;
    }

    deps.beforeJoinLegion?.(legion, center);

    legion.stopMovement(true);

    // 海军舰队成为攻城援军：登陆（船→陆），否则船停在海上打攻城。登陆必定成功，
    // 绝不会因此拒收援军 —— 见 landNavalLegionForSiege 注释。
    // 🔴 必须排在 stopMovement(true) **之后**：登陆走 setPosition，对行军中军团会清空路径，
    //    先登陆会把战前航线存档一起毁掉，战后舰队无法续航。
    if (legion.isOnSea && battleField.type === 'siege') {
        landNavalLegionForSiege(legion, center);
    }
    legion.setCombatState(true, battleField.type, center);
    legion.isSiegeAttacker = isAttacker; // 援军按攻守方正确设置器械标记
    // 攻方增援也挂攻城目标城 id：GlobalUnitRenderer 攻城外推反查城图用（2026-08-04 修复——
    // 漏设则增援军团不外推，渲染停在 JOIN_RADIUS 圈内逻辑位置，离城图边缘很远/压城，主人截图实锤）
    const siegeCityId = deps.siegeCityId ?? battleField.siegeCityId ?? null;
    if (battleField.type === 'siege' && isAttacker && siegeCityId) {
        legion.siegeTargetCityId = siegeCityId;
    }

    const side: 'attacker' | 'defender' = isAttacker ? 'attacker' : 'defender';
    const battleCityName = deps.resolveBattleCityName?.(center) ?? '未知';
    const adapter = createLegionAdapter(legion, deps, side, battleCityName);
    battleField.addReinforcement(adapter, isAttacker);

    // [语音播报] 跟随军团作为援军参战
    const followedId = (window as any).game?.cameraFollowUI?.getFollowedArmyId?.();
    if (followedId === legion.id) {
        const genRec = legion.generalId ? getGeneralRecordByGeneralId(legion.generalId) : null;
        const brR = battleField.getInitialAttDefRatio();
        const brFollowerR = isAttacker ? brR : (1 / Math.max(brR, 0.001));
        const brJu: CaptureJu = brFollowerR > 1.5 ? 'advantage' : brFollowerR < 0.67 ? 'disadvantage' : 'balance';
        speechAnnouncer.announceReinforcementJoin({
            factionId: legion.getFactionId(),
            generalId: legion.generalId ?? null,
            generalName: genRec?.generalName ?? null,
            eliteName: getLegionEliteLegionName(legion),
            side,
            cityName: battleCityName,
            ju: brJu,
            battleSkillId: adapter.battleOverriddenSkillId ?? null,
        });
        // 跟拍作为援军中途入场：补开据点放大（开战时跟拍不在则未放大）
        if (battleField.type === 'siege' && siegeCityId) {
            (window as any).game?.cityManager?.enableSiegeCityZoom?.(siegeCityId);
        }
    }

    return true;
}

/** 扫描开战圈并将符合条件的援军编入战场 */
export function pollBattleFieldReinforcements(
    battleField: BattleField,
    center: LatLng,
    deps: ReinforcementJoinDeps
): number {
    if (battleField.isOver) return 0;

    const nearby = deps.spatialRegistry.getArmiesInRadius(
        center.lat,
        center.lng,
        GameConfig.COMBAT.BATTLE_JOIN_RADIUS
    );

    let joined = 0;

    for (const isAttacker of [true, false] as const) {
        const factionId = isAttacker
            ? battleField.getAttackerFactionId()
            : battleField.getDefenderFactionId();

        const eligible = nearby
            .filter((legion) => isEligibleReinforcement(legion, factionId, battleField, center, deps, isAttacker))
            .sort((a, b) => (b.getTroops() || 0) - (a.getTroops() || 0));

        for (const legion of eligible) {
            if (tryJoinLegionToBattle(battleField, legion, isAttacker, center, deps)) {
                joined++;
            }
        }
    }

    return joined;
}

function buildJoinDeps(
    legionManager: LegionManager,
    siegeWaiter?: (id: string) => boolean,
    beforeJoinLegion?: (legion: Army, center: LatLng) => void,
): ReinforcementJoinDeps {
    const cityManager = legionManager.getCityManager();
    return {
        spatialRegistry: legionManager.getSpatialRegistry(),
        removeArmy: (army) => legionManager.removeArmy(army),
        isArmyWaitingSiege: siegeWaiter,
        beforeJoinLegion,
        resolveBattleCityName: (center) => {
            const nearest = cityManager.getNearestCity(null, {
                latitude: center.lat,
                longitude: center.lng,
            });
            return nearest?.name ?? '未知';
        },
    };
}

/** 攻城：轮询 activeSieges */
export function pollSiegeReinforcements(
    activeSieges: Map<string, BattleField>,
    getCityPosition: (cityId: string) => LatLng | null,
    legionManager: LegionManager,
    isArmyWaitingSiege?: (armyId: string) => boolean,
    beforeJoinLegion?: (legion: Army, center: LatLng) => void,
): number {
    let joined = 0;

    for (const [cityId, battleField] of activeSieges) {
        if (battleField.isOver) continue;
        const center = getCityPosition(cityId);
        if (!center) continue;
        const deps = buildJoinDeps(legionManager, isArmyWaitingSiege, beforeJoinLegion);
        deps.siegeCityId = cityId;
        joined += pollBattleFieldReinforcements(battleField, center, deps);
    }

    return joined;
}

/** 野战：轮询 CombatSystem 中 type=field 的战场 */
export function pollFieldBattleReinforcements(
    combatSystem: CombatSystem,
    legionManager: LegionManager
): number {
    const deps = buildJoinDeps(legionManager);
    let joined = 0;

    for (const battleField of combatSystem.getActiveBattleFields()) {
        if (battleField.isOver || battleField.type !== 'field') continue;
        const center = battleField.getReferencePosition();
        joined += pollBattleFieldReinforcements(battleField, center, deps);
    }

    return joined;
}

/** 节流：每 BATTLE_REINFORCEMENT_POLL_INTERVAL_SEC 游戏秒执行一次 */
export function tickBattleReinforcementPoll(
    state: ReinforcementPollState,
    deltaTime: number,
    poll: () => void
): void {
    state.remainingSec -= deltaTime;
    if (state.remainingSec > 0) return;
    state.remainingSec = BATTLE_REINFORCEMENT_POLL_INTERVAL_SEC;
    poll();
}
