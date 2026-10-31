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
    /** 编入前移出攻城第三方排队（野战轮询不排除排队者，编入时须出队，同开战瞬间的野战编入） */
    dequeueFromSiegeQueue?: (armyId: string) => void;
    resolveBattleCityName?: (center: LatLng) => string;
    /** 编入攻城战前城周错开（仅攻城注入，野战不传） */
    beforeJoinLegion?: (legion: Army, center: LatLng) => void;
    /**
     * 攻城城 id：有值时不拉攻方「路过/奔他城」军团入战。
     * 野战不传（短距接触战，路过同旗仍可协战）。
     */
    siegeCityId?: string;
}

/** 军团是否属于该势力（认 getFactionId 与显示势力） */
export function legionMatchesFaction(legion: Army, fId: string | null | undefined): boolean {
    if (!fId) return false;
    const displayFaction = legion.getDisplayFactionId?.();
    return legion.getFactionId() === fId || (!!displayFaction && displayFaction === fId);
}

/**
 * 同势力合并的唯一判据：开战瞬间（攻城/野战）与战斗中途轮询共用这一个函数。
 * 规则：同势力、在开战圈内、没在别的战斗里 → 合并；只豁免剧本/成名战专属军团。
 * @param battleField 中途轮询时传入（防重复编入、守方按在场守军认旗）；开战瞬间战场未建，不传
 */
export function isEligibleReinforcement(
    legion: Army,
    factionId: string,
    center: LatLng,
    isAttacker: boolean,
    battleField?: BattleField | null,
): boolean {
    let isSameFaction = legionMatchesFaction(legion, factionId);
    if (!isSameFaction && !isAttacker && battleField) {
        // 守方额外兼容：若城内守军单位的势力与路过军团相同，亦视为同阵营守军
        const defUnits = battleField.getDefenderUnits?.() ?? [];
        isSameFaction = defUnits.some(u => legionMatchesFaction(legion, u.factionId));
    }
    if (!isSameFaction) return false;

    if (legion.type !== 'legion' || legion.isDestroyed) return false;
    if (legion.getIsInCombat()) return false;
    if (legion.getTroops() < GameConfig.COMBAT.MIN_SURVIVAL_TROOPS) return false;
    if (battleField?.hasUnit(legion.id)) return false;
    const lAny = legion as any;
    if (
        legion.scriptMarchExempt ||
        lAny.isFirstBattleMarch ||
        lAny.isFirstBattleHero ||
        lAny.isFirstBattleFieldEnemy ||
        lAny.isFirstBattleSiegeEnemy ||
        (isAttacker && legion.isScriptArmy)
    ) {
        return false;
    }

    const dist = getEuclideanDistance(legion.getPosition(), center);
    if (dist > GameConfig.COMBAT.BATTLE_JOIN_RADIUS) return false;

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
    // 进了战术模式（13 冻结）合并到此为止，与轮询一致
    if (battleField.isOver || battleField.scene13Frozen) return false;

    const factionId = isAttacker
        ? battleField.getAttackerFactionId()
        : battleField.getDefenderFactionId();

    if (!isEligibleReinforcement(legion, factionId, center, isAttacker, battleField)) {
        return false;
    }

    // 先出队（会重置战斗态并触发排队回调），再由下面设成真实在战
    deps.dequeueFromSiegeQueue?.(legion.id);
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
    // 🔴 [2026-09-24] 战斗形态锁：对面全是舰队才算海战，否则援军整场纯陆军
    {
        const foeUnits: Array<{ getEntity?: () => unknown }> = (isAttacker
            ? battleField.getDefenderUnits?.() : battleField.getAttackerUnits?.()) ?? [];
        legion.lockBattleSeaForm(foeUnits.map((u) => u.getEntity?.() ?? u));
    }
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
    const followedId = (window as any).game?.cameraFollowUI?.getFollowedArmyId?.()
        ?? (window as any).game?.playerHero?.getHostLegionId?.();
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
    if (battleField.isOver || battleField.scene13Frozen) return 0;

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
            .filter((legion) => isEligibleReinforcement(legion, factionId, center, isAttacker, battleField))
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
    beforeJoinLegion?: (legion: Army, center: LatLng) => void,
): ReinforcementJoinDeps {
    const cityManager = legionManager.getCityManager();
    return {
        spatialRegistry: legionManager.getSpatialRegistry(),
        removeArmy: (army) => legionManager.removeArmy(army),
        dequeueFromSiegeQueue: (armyId) => { legionManager.dequeueArmyFromThirdPartyWaiters(armyId); },
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
    beforeJoinLegion?: (legion: Army, center: LatLng) => void,
): number {
    let joined = 0;

    for (const [cityId, battleField] of activeSieges) {
        if (battleField.isOver) continue;
        const center = getCityPosition(cityId);
        if (!center) continue;
        const deps = buildJoinDeps(legionManager, beforeJoinLegion);
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
