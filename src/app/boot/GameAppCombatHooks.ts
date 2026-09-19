import { gameLog } from '../../utils/GameLogger';
import type { GameApp } from '../GameApp';
import type { LegionManager } from '../../legion/LegionManager';
import type { CityType } from '../../types/core';
import { getGlobalUnitRenderer } from '../../map/UnitRenderer';
import { GameConfig } from '../../config/GameConfig';
import { getFactionCultureRegion } from '../../config/portrait_defaults';
// 🔴 [2026-09-18 补] unitRegion() 里用到了这两个（城按所在地判文化区），原先漏了 import
//    —— 缺它俩会让 tsc 报 TS2304，运行到那行直接抛错。
import { getCityRegion, getRegion } from '../../systems/RegionSystem';
import { readSiegeGarrisonElite, readSiegeGarrisonEliteName } from '../../combat/SiegeGarrisonTier';
import { getLegionEliteLegionName, getCityEliteLegionName, getExpeditionEliteLegionName } from '../../data/ExpeditionLegions';
import {
    setGeneralSkillLegionManager,
    setOnTacticalSkillTriggered,
} from '../../combat/GeneralSkillCombat';

/** [2026-08-09 镜头定稿] 取攻击方将领编队实时位置作镜头落点（渲染中心 + 推进偏移），查不到退回逻辑坐标。
 * 🔴 [2026-08-10 主人铁律] 镜头永远跟随军团（跟拍军团将领编队）——禁止改成跟战场中点/中心点。 */
function battleSceneTarget(unit: { id: string; getPosition(): { lat: number; lng: number } }):
    { center: { lat: number; lng: number }; id: string } {
    const renderer = getGlobalUnitRenderer();
    const rendered = renderer?.getGeneralSquadCenter(unit.id)
        ?? renderer?.getRenderedCenter(unit.id);
    return { center: rendered ?? unit.getPosition(), id: unit.id };
}

/**
 * 取单位文化区：**城池永远按所在地判，军团按募兵城判**。
 *
 * 🔴 城池分支必须排在最前，不许先读实体字段、更不许绕势力（2026-08-19 修）：
 *    守城的文化属于**那座城所在的地方**，不属于此刻插在城头的旗号 —— 与本项目
 *    「锚定将随城、旗号易主不改变」是同一条原则，史实上也只有这一种讲得通：
 *    守洛阳用的是洛阳的城防工艺，不会因为守军换了旗就变成草原工艺。
 *
 *    改之前是「城池无 cultureRegion → 落到 getFactionCultureRegion(旗号)」，两个实锤错误：
 *      ① **城池易主后必错**：cities_v2 里 829 势力各恰好一座城，getFactionCultureRegion
 *         查的是该势力**老家那座城**的 region。中原势力打下草原城之后守这座草原城，
 *         科技按中原算。攻城占九成战斗，这个错在整局里持续发生。
 *      ② **叛军城 100% 判成草原**：panjun 在 cities_v2 中无城 → 返回 undefined →
 *         直接吃下游的 `?? 'STEPPE'` 兜底。叛军守江南城也按草原科技算。
 *
 *    走 getCityRegion 而不是直接读 entity.region：它带坐标兜底（region 缺失/未知值时
 *    按经纬度判），且与城池立绘（BattleUnitFactory）同源。
 *    注：曾有注释称 cities_v2 有 58 处 SOUTH/NOMADIC 等 legacy 旧值，2026-08-19 实测
 *    946 处 region 全部是 18 个合法值、legacy 已清零；getCityRegion 的翻译层现在是防未来用的。
 */
function unitRegion(unit: {
    factionId: string | null;
    unitType?: string;
    getEntity?(): any;
}): string | null {
    const entity = unit.getEntity?.();
    // 城池判据用「实体带经纬度」：City 有 latitude/longitude，Army 没有（它只有 getPosition()）。
    if (entity && typeof entity.latitude === 'number' && typeof entity.longitude === 'number') {
        return getCityRegion({ latitude: entity.latitude, longitude: entity.longitude, region: entity.region });
    }
    const region = entity?.cultureRegion ?? entity?.getRegion?.() ?? null;
    if (region) return region;
    if (unit.factionId) {
        const r = getFactionCultureRegion(unit.factionId);
        if (r) return r;
    }
    return null;
}

/**
 * 进 13 的「精锐」判据（两条路径共用）。
 * 🔴 必须带城池分支：攻城战守方是 city 单位，它的精锐挂在 `_siegeGarrisonElite` 上，
 *    不是 `entity.isElite` —— 只读后者的话**攻城战永远进不了 13**，而攻城占战斗的九成。
 *    判据与引擎战利恢复表同源（CombatSystem 的 readSiegeGarrisonElite）。
 */
function unitHasElite(u: { unitType?: string; getEntity?(): any }): boolean {
    const e = u.getEntity?.();
    return !!e?.isElite || (u.unitType === 'city' && readSiegeGarrisonElite(e));
}

function unitIsNaval(u: { getEntity?(): any }): boolean {
    return u.getEntity?.()?.isOnSea === true;
}

function unitIsFortress(u: { unitType?: string }): boolean {
    return u.unitType === 'city';
}

/**
 * [2026-09-19] 解析参战单位史实精锐番号（城池守军 > 军团精锐 > 势力精锐兜底）
 */
function resolveUnitEliteName(unit: {
    factionId: string | null;
    unitType?: string;
    getEntity?(): any;
} | null | undefined): string | null {
    if (!unit) return null;
    const entity = unit.getEntity?.();
    if (unit.unitType === 'city') {
        const garrison = readSiegeGarrisonEliteName(entity);
        if (garrison) return garrison;
        const cityId = entity?.id ?? (typeof entity?.getCityId === 'function' ? entity.getCityId() : null);
        if (cityId) {
            const byCity = getCityEliteLegionName(cityId);
            if (byCity) return byCity;
        }
    }
    const fromLegion = entity ? getLegionEliteLegionName(entity) : null;
    if (fromLegion) return fromLegion;
    if (unit.factionId) {
        const fromFaction = getExpeditionEliteLegionName(unit.factionId);
        if (fromFaction) return fromFaction;
    }
    return null;
}

/**
 * [2026-08-11 13 v2] 启动出兵口互攻演出（Scene13WarLayer）。
 * 攻守双方文化区 + 兵力 + 势力 id 传给演出层（势力 id 用于势力本色染色）；
 * 演出判负 → onDecision 回调写回引擎。
 */
function startScene13War(
    app: GameApp,
    attacker: { factionId: string | null; troops: number; generalId?: string | null; unitType?: string; getEntity?(): any },
    defender: { factionId: string | null; troops: number; generalId?: string | null; unitType?: string; getEntity?(): any },
    onDecision: (winner: 'attacker' | 'defender', survivors: { attacker: number; defender: number }) => void,
    bonus?: { attacker: number; defender: number },
    center?: { lat: number; lng: number },
    environmentSeed?: string,
    battleType?: 'siege' | 'field',
    /** 水军攻城战 —— 战场左侧强制出海（主人 2026-08-24 定） */
    isNaval?: boolean,
    /** [2026-08-31 主人定] 跟随军团在守方侧（回援守城）→ 攻守两侧左右对调，跟随军团固定左边 */
    followedOnDefenderSide?: boolean,
    /** [2026-09-12] 剧本战斗标题（`fieldBattleData.title`），战斗面板大标题直接用它 */
    title?: string | null,
): void {
    // 🔴 [2026-08-19] 兜底不许再用「攻方 CENTRAL / 守方 STEPPE」这种凭空指定的常量：
    //    那等于让查不到文化区的守方平白换一套科技树（叛军城曾因此全部按草原算）。
    //    查不到就按**这场仗打在哪**判——战场坐标落在哪个文化区，双方就都用哪个，
    //    至少保证「同一块地上打的仗，攻守兜底口径一致」。再查不到才落中原。
    const terrainRegion = center ? getRegion(center.lat, center.lng) : 'CENTRAL';
    const attRegion = unitRegion(attacker) ?? terrainRegion;
    const defRegion = unitRegion(defender) ?? terrainRegion;
    // [2026-08-22] 攻城战守方城等级：从守方实体读 type（City 有 type 字段），决定守城建筑池时代
    const defenderCityType: CityType | null = battleType === 'siege'
        ? (defender.getEntity?.()?.type as CityType | undefined) ?? null
        : null;
    // [2026-08-24] 攻城战守方据点 cityId（名城挂世界奇观：守方城中央立奇观地标）
    const defenderCityId: string | null = battleType === 'siege'
        ? (defender.getEntity?.()?.id as string | undefined) ?? null
        : null;
    const defenderCityEntity = battleType === 'siege' ? defender.getEntity?.() : null;
    const defenderCityLat = typeof defenderCityEntity?.latitude === 'number' ? defenderCityEntity.latitude : undefined;
    const defenderCityLng = typeof defenderCityEntity?.longitude === 'number' ? defenderCityEntity.longitude : undefined;
    const attackerEliteName = resolveUnitEliteName(attacker);
    let defenderEliteName = resolveUnitEliteName(defender);
    if (!defenderEliteName && defenderCityId) {
        defenderEliteName = getCityEliteLegionName(defenderCityId);
    }
    app.scene13War.onDecision = onDecision;   // 🔴 必须先于 start 赋值：start 失败走 forceResultByRatio 判负需要回调
    app.scene13War?.start({
        attackerRegion: attRegion,
        defenderRegion: defRegion,
        attackerFactionId: attacker.factionId,
        defenderFactionId: defender.factionId,
        // 武将 id 传给编制层：武将专属编制（秦及先秦雁行阵等）在 13 里也要生效
        attackerGeneralId: attacker.generalId ?? null,
        defenderGeneralId: defender.generalId ?? null,
        attackerTroops: attacker.troops,
        defenderTroops: defender.troops,
        attackerBonus: bonus?.attacker,
        defenderBonus: bonus?.defender,
        // [2026-09-19] 双方史实精锐番号传递给战术演出及 CombatUI 战术布局展示
        attackerEliteName,
        defenderEliteName,
        // 战场中心坐标 → 树/湖季节按真实海拔判定（2026-08-12 主人定「应该根据海拔」）
        centerLat: center?.lat,
        centerLng: center?.lng,
        // 环境唯一种子（Hook 战斗开始时生成一次，同场可复现、不同场不重复）
        environmentSeed,
        // [2026-08-21] 战斗类型（野战双方都布出兵口建筑、攻城只攻方布）
        battleType,
        // [2026-08-24] 水军攻城战：左侧强制出海（攻方破浪抢滩），不靠地形探测碰运气
        isNaval,
        // [2026-08-22] 攻城战守方城等级（决定守城建筑池时代）
        defenderCityType,
        // [2026-08-24] 攻城战守方据点 cityId（名城挂世界奇观 → 守方城中央立奇观地标）
        defenderCityId,
        defenderCityLat,
        defenderCityLng,
        // [2026-08-31 主人定] 跟随军团在守方侧 → 攻守两侧左右对调
        followedOnDefenderSide,
        // [2026-09-12] 剧本战斗标题（fieldBattleData.title），战斗面板大标题直接用它
        title,
        // [军事科技] 年份 getter：战斗跨年时演出层据此刷新科技分表 + 播报新解锁
        getYear: () => app.timeSystem.getYear(),
    });
    gameLog('battle', `🎬 [Scene13War] 出兵口互攻启动: ${attRegion} vs ${defRegion}`);
}

/** 战斗 UI：仅在镜头跟随军团参战时才弹出。 */
export function wireGameAppCombatUiHooks(app: GameApp): void {
    app.combatSystem.onBattleStart = (battle) => {
        const followedId = app.cameraFollowUI?.getFollowedArmyId();
        if (!followedId) return;
        const isInvolved = battle.attacker.id === followedId || battle.defender.id === followedId;
        if (!isInvolved) return;
        gameLog('startup', '⚔️ [GameApp] Battle Started (followed army involved) - showing Combat UI');
        app.combatUI.show(battle);
        // [2026-08-30 主人改｜2026-09-15 门槛下调] 进 13 条件：开关开 + 双方兵力都 ≥5000 + 双方不能都是海军 + 双方都有武将+精锐。
        //   （海军 vs 要塞仍按 siege 类型进 13）
        const minTroops = GameConfig.COMBAT.SCENE13_MIN_TROOPS;
        const bigEnough = battle.attacker.troops >= minTroops && battle.defender.troops >= minTroops;
        const bothNaval = unitIsNaval(battle.attacker) && unitIsNaval(battle.defender);
        const isNavalBattle = unitIsNaval(battle.attacker) || unitIsNaval(battle.defender);
        const isNavalVsFortress = (unitIsNaval(battle.attacker) || unitIsNaval(battle.defender))
            && (unitIsFortress(battle.attacker) || unitIsFortress(battle.defender));
        const attHasElite = unitHasElite(battle.attacker);
        const defHasElite = unitHasElite(battle.defender);
        // 🔴 [2026-09-09 主人报障「游戏不进入战术模式」] 去掉 2026-09-05 加的 `!playerIn`。
        //    那条写的是「玩家入伍的仗不进 13，改弹大地图战斗面板观战」，但玩家开自动模式后
        //    基本一直在伍，等于战术模式永远进不去；与「随军必进 13」的定案也相冲。
        //    现在玩家入伍的仗照常进 13，其余门槛（双方兵力 ≥5000 / 不都是海军 / 双方都有将+精锐）不变。
        const eligible = app.tacticalModeEnabled && bigEnough && !bothNaval
            && (!!battle.attacker.generalId && !!battle.defender.generalId
                && attHasElite && defHasElite);
        // 🔴 [2026-09-16] 「进不去战术模式」闸门归因：六道闸哪道拦的，直接落盘，别再靠猜。
        //    文档铁律：数字反常先加计数器问「每道闸各拦掉多少」。落 scene13_probe_log.jsonl（why=gateBlocked）。
        if (import.meta.env.DEV) {
            const gate = {
                tacticalModeEnabled: !!app.tacticalModeEnabled,
                bigEnough, minTroops,
                attTroops: battle.attacker.troops, defTroops: battle.defender.troops,
                bothNaval, isNavalBattle, isNavalVsFortress,
                attGeneralId: battle.attacker.generalId ?? null,
                defGeneralId: battle.defender.generalId ?? null,
                attHasElite, defHasElite,
                attUnitType: (battle.attacker as { unitType?: string }).unitType ?? null,
                defUnitType: (battle.defender as { unitType?: string }).unitType ?? null,
                battleType: battle.type,
                defenderId: (battle.defender.getEntity?.() as { id?: string } | undefined)?.id ?? null,
                // 🔴 [2026-09-16 主人问「推罗守将为什么不是阿泽米尔」] 守方到底是谁，别再靠读代码猜：
                eligible,
                defName: (battle.defender as { name?: string }).name ?? null,
                defPortrait: (battle.defender as { portraitPath?: string }).portraitPath ?? null,
                defEntityType: (battle.defender.getEntity?.() as { type?: string } | undefined)?.type ?? null,
                defGarrisonGeneral: (battle.defender.getEntity?.() as { _siegeGarrisonGeneralId?: string } | undefined)?._siegeGarrisonGeneralId ?? null,
                defGarrisonPortrait: (battle.defender.getEntity?.() as { _siegeGarrisonPortrait?: string } | undefined)?._siegeGarrisonPortrait ?? null,
                attName: (battle.attacker as { name?: string }).name ?? null,
            };
            console.warn(eligible ? '✅ [Scene13 闸门] 进战术模式：' : '🚫 [Scene13 闸门] 未进战术模式：', gate);
            void fetch('/api/scene13-probe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ at: new Date().toISOString(), why: 'gateBlocked', gate }),
            }).catch(() => { /* 诊断落盘失败不影响对局 */ });
        }
        if (eligible) {
            const centerUnit = battle.attacker.id === followedId ? battle.attacker : battle.defender;
            const t = battleSceneTarget(centerUnit);
            // [2026-08-10] 进 13 = 战术层：时长钉死 1 分钟（真实秒），覆盖引擎的动态时长
            battle.applySceneFixedDuration(GameConfig.COMBAT.SCENE13_BATTLE_DURATION_SEC);
            // [2026-08-11 13 v2] 13 演出接管：冻结引擎（不推进不结算），胜负由出兵口互攻判负写回
            battle.scene13Frozen = true;
            app.battleScene?.setFrozenBattle(battle);   // 退场未判负时据此解冻（见 BattleSceneLayer.unfreezeScene13Battle）
            startScene13War(app, battle.attacker, battle.defender, (winner, sv) => {
                // 🔴 [2026-09-12 主人报障「第一仗打完不动」] 剧本写死胜负的战斗，演出判负不得覆盖写死结果
                //   （否则演出里守方打赢 → 主角攻方被销毁 → 下一场衔接直接断）。
                const scripted = battle.getScriptedWinner();
                const finalWinner = scripted ?? winner;
                battle.forceScene13Result(finalWinner, finalWinner === 'attacker' ? sv.attacker : sv.defender);
            }, undefined, t.center,
                `${battle.attacker.id}|${battle.defender.id}|${app.timeSystem.getElapsedGameSeconds()}|${app.timeSystem.getYear()}`,
                isNavalVsFortress ? 'siege' : battle.type, isNavalBattle,
                battle.defender.id === followedId);
            app.battleScene?.enter(t.id);
        }
    };


    app.combatSystem.onRegionalBattleStart = (
        attackers,
        defenders,
        attackerPortrait,
        defenderPortrait,
        title,
        description,
        isNarrative,
        battleField
    ) => {
        const followedId = app.cameraFollowUI?.getFollowedArmyId();
        if (!followedId) return;
        const allIds = [...attackers.map((u) => u.id), ...defenders.map((u) => u.id)];
        if (!allIds.includes(followedId)) return;
        gameLog(
            'startup',
            `⚔️ [GameApp] Regional Battle (followed army involved) - ${attackers.length} vs ${defenders.length}`
        );
        const scale = 1;
        // [2026-08-30 主人改｜2026-09-15 门槛下调] 进 13 条件：开关开 + 双方兵力都 ≥5000（含援军合计）+ 双方不能都是海军 + 双方都有武将+精锐。
        // 兵力门槛看每方当前合计（含所有已编入的援军）；跟随军团中途加入也复用此入口。
        // 进入 13 后冻结战略行军，不再有在途援军赶到。
        const minTroops = GameConfig.COMBAT.SCENE13_MIN_TROOPS;
        const attTroops = attackers.reduce((s, u) => s + (u.troops ?? 0), 0); // 攻方合计（含援军）
        const defTroops = defenders.reduce((s, u) => s + (u.troops ?? 0), 0); // 守方合计（含援军）
        const bigEnough = attTroops >= minTroops && defTroops >= minTroops;
        const isNavalBattle = [...attackers, ...defenders].some(unitIsNaval);
        const bothNaval = attackers.every(unitIsNaval) && defenders.every(unitIsNaval);
        const isNavalVsFortress = isNavalBattle
            && [...attackers, ...defenders].some(unitIsFortress);
        const attHasGen = attackers.some((u) => !!u.generalId);
        const defHasGen = defenders.some((u) => !!u.generalId);
        const attHasElite = attackers.some(unitHasElite);
        const defHasElite = defenders.some(unitHasElite);
        // 战场事件必须进战术模式：HistoricalEventManager 为双方军团设置 isScriptArmy。
        // 攻城和野战共用此入口，不受普通战斗的兵力、将领、精锐及调试开关门槛阻挡。
        const isBattlefieldEvent = [...attackers, ...defenders]
            .some((u) => u.getEntity?.()?.isScriptArmy === true);
        const eligible = isBattlefieldEvent || (app.tacticalModeEnabled && bigEnough && !bothNaval
            && attHasGen && defHasGen && attHasElite && defHasElite);
        if (eligible && !battleField?.scene13Frozen) {
            const followedUnit = [...attackers, ...defenders].find((u) => u.id === followedId);
            const centerUnit = followedUnit ?? attackers[0] ?? defenders[0];
            const t = battleSceneTarget(centerUnit);
            // 🔴 [2026-08-10 主人铁律] 镜头永远跟随军团——进场落点 = 跟拍军团将领编队，
            // 禁止改成两军中点（曾擅改被主人怒斥）。
            // [2026-08-10] 进 13 = 战术层：时长钉死 1 分钟（真实秒），覆盖动态时长/援军加时
            battleField?.applySceneFixedDuration(GameConfig.COMBAT.SCENE13_BATTLE_DURATION_SEC);
            // [2026-08-11 13 v2] 13 演出接管：冻结引擎（不推进不结算），胜负由出兵口互攻判负写回
            if (battleField) {
                battleField.scene13Frozen = true;
                app.battleScene?.setFrozenBattle(battleField);   // 同上
                // 🔴 攻守各取第一个单位（attHasGen/defHasGen 已保证两侧非空）
                const att = attackers[0];
                const def = defenders[0];
                // 攻城战守方城等级：从 defenders 里找 city 单位读 type（读的是守城城的等级，不是守军军团的）
                const defEntity = (battleField.type === 'siege' || isNavalVsFortress)
                    ? (defenders.find((u) => u.unitType === 'city') ?? def)
                    : def;
                if (att && def) {
                    startScene13War(
                        app,
                        { factionId: att.factionId, troops: attTroops, generalId: att.generalId, unitType: att.unitType, getEntity: () => att.getEntity?.() },
                        { factionId: def.factionId, troops: defTroops, generalId: def.generalId, unitType: defEntity?.unitType, getEntity: () => defEntity?.getEntity?.() },
                        (winner, sv) => {
                            // 🔴 [2026-09-12 主人报障「第一仗打完不动」] 剧本写死胜负，演出判负不得覆盖。
                            const scripted = battleField.getScriptedWinner();
                            const finalWinner = scripted ?? winner;
                            battleField.forceScene13Result(finalWinner, finalWinner === 'attacker' ? sv.attacker : sv.defender);
                        },
                        battleField.getScene13PowerBonus(),
                        t.center,
                        `${battleField.id}|${app.timeSystem.getElapsedGameSeconds()}|${app.timeSystem.getYear()}`,
                        isNavalVsFortress ? 'siege' : battleField.type,
                        isNavalBattle,
                        defenders.some((u) => u.id === followedId),
                        title
                    );
                }
            }
            app.battleScene?.enter(t.id);
        }
        // 🔴 dur 必须在钉死时长**之后**取：战斗 UI 的进度条/倒计时按它铺，
        //    先取就会拿到引擎原来的动态时长（30s），UI 走完了战斗还在打。
        const dur = battleField?.targetDuration ?? 17;
        try {
            app.combatUI.showRegional(
                attackers,
                defenders,
                attackerPortrait,
                defenderPortrait,
                title,
                description,
                isNarrative,
                dur,
                scale,
                battleField
            );
        } catch (err) {
            console.error('[GameApp] 战斗 UI 展示失败（战斗仍继续）:', err);
        }
    };

    app.combatSystem.onRegionalBattleEnd = (endedFields) => {
        const followedId = app.cameraFollowUI?.getFollowedArmyId();
        if (!followedId || !app.combatUI.isRegionalVisible()) return;
        const oursEnded = endedFields.some((bf) => bf.hasParticipant(followedId));
        if (!oursEnded) return;
        // [2026-08-11 战败停留] 跟拍军团战败/战斗结束：
        //   🔴 不立即 exit（那会先切回 ZOOM8 干等 5 秒——主人 2026-08-11 实锤不要）。
        //   改为：停演出但**保留最后一帧**（keepFrame：战场残局冻结在 13，尸体烙图仍在）
        //   + beginLingerAfterDefeat(5s)：5 秒内镜头留在 13 战场残局，到期 tick 统一 exit 回 zoom8；
        //   期间 CameraFollowUI 的延迟切换（FOLLOW_SWITCH_DELAY_MS）由 GameAppLoop 放行驱动，
        //   「停留 5 秒 → 直接切新军团」一气呵成。
        const battleScene = app.battleScene;
        app.scene13War?.beginLinger();   // 同上
        if (battleScene?.isActive?.()) {
            battleScene.beginLingerAfterDefeat(
                GameConfig.LEGION.FOLLOW_SWITCH_DELAY_MS
            );
        } else {
            battleScene?.exit();
        }
        app.combatUI.notifyRegionalBattlesEnded(endedFields);
    };

    app.combatSystem.onRegionalBattleReinforcement = (battleField, joinedUnit) => {
        const followedId = app.cameraFollowUI?.getFollowedArmyId();
        if (app.combatUI.isBoundToBattleField(battleField)) {
            app.combatUI.syncRegionalParticipantsFromBattleField(battleField);
            if (joinedUnit.id !== followedId || battleField.scene13Frozen) return;
        }

        if (!followedId || joinedUnit.id !== followedId) return;
        if (battleField.isOver) return;

        const attackers = battleField.getAttackerUnits();
        const defenders = battleField.getDefenderUnits();
        if (attackers.length === 0 || defenders.length === 0) return;

        gameLog(
            'startup',
            `⚔️ [GameApp] Followed army joined battle as reinforcement - showing Combat UI`
        );

        const title = battleField.customTitle ?? (battleField.type === 'siege' ? (battleField.siegeCityId ? `${app.cityManager.getCity(battleField.siegeCityId)?.name ?? ''} 攻防战` : '攻城战') : `${app.cityManager.getFactionName(battleField.getAttackerFactionId())} 大战 ${app.cityManager.getFactionName(battleField.getDefenderFactionId())}`);
        // 中途赶到的跟随援军与开战时共用门槛、攻守侧判定及战术结算入口。
        app.combatSystem.onRegionalBattleStart?.(
            attackers,
            defenders,
            undefined,
            undefined,
            title,
            '',
            false,
            battleField
        );
    };
}

/** 武将技：绑定 LegionManager 与战术技 UI 闪光 */
export function wireGeneralSkillCombat(app: GameApp, legionManager: LegionManager): void {
    setGeneralSkillLegionManager(legionManager);
    setOnTacticalSkillTriggered((info) => {
        if (!app.combatUI.isRegionalVisible()) return;
        // 战略技只在大地图展示，不进战斗面板
        if (info.skillId?.startsWith('str_')) return;
        // 全图多战并行：异场技能事件不得上面板/进语音（曾借同名技能标签冒名顶替，把人名念成别场武将）
        if (!app.combatUI.isTacticalEventForBoundBattle(info)) return;
        app.combatUI.flashTacticalSkill(info.displayName, info.generalId, info.skillId);
        gameLog('battle', `✨ [CombatUI] 战术技展示: 【${info.displayName}】 (${info.generalId})`);
    });
}
