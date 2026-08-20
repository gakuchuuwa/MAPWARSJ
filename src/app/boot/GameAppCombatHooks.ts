import { gameLog } from '../../utils/GameLogger';
import type { GameApp } from '../GameApp';
import type { LegionManager } from '../../legion/LegionManager';
import { getGlobalUnitRenderer } from '../../map/UnitRenderer';
import { GameConfig } from '../../config/GameConfig';
import { getFactionCultureRegion } from '../../config/portrait_defaults';
import { getCityRegion, getRegion } from '../../systems/RegionSystem';
import { readSiegeGarrisonElite } from '../../combat/SiegeGarrisonTier';
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

/**
 * [2026-08-11 13 v2] 启动出兵口互攻演出（Scene13WarLayer）。
 * 攻守双方文化区 + 兵力 + 势力 id 传给演出层（势力 id 用于势力本色染色）；
 * 演出判负 → onDecision 回调写回引擎。
 */
function startScene13War(
    app: GameApp,
    attacker: { factionId: string | null; troops: number; generalId?: string | null; getEntity?(): any },
    defender: { factionId: string | null; troops: number; generalId?: string | null; getEntity?(): any },
    onDecision: (winner: 'attacker' | 'defender', survivors: { attacker: number; defender: number }) => void,
    bonus?: { attacker: number; defender: number },
    center?: { lat: number; lng: number },
    environmentSeed?: string,
): void {
    // 🔴 [2026-08-19] 兜底不许再用「攻方 CENTRAL / 守方 STEPPE」这种凭空指定的常量：
    //    那等于让查不到文化区的守方平白换一套科技树（叛军城曾因此全部按草原算）。
    //    查不到就按**这场仗打在哪**判——战场坐标落在哪个文化区，双方就都用哪个，
    //    至少保证「同一块地上打的仗，攻守兜底口径一致」。再查不到才落中原。
    const terrainRegion = center ? getRegion(center.lat, center.lng) : 'CENTRAL';
    const attRegion = unitRegion(attacker) ?? terrainRegion;
    const defRegion = unitRegion(defender) ?? terrainRegion;
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
        // 战场中心坐标 → 树/湖季节按真实海拔判定（2026-08-12 主人定「应该根据海拔」）
        centerLat: center?.lat,
        centerLng: center?.lng,
        // 环境唯一种子（Hook 战斗开始时生成一次，同场可复现、不同场不重复）
        environmentSeed,
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
        // [2026-08-09 独立战斗场景] 进 13 条件（主人 2026-08-11 定稿，勿改）：
        //   ① 双方都有武将  ② 双方都有精锐  ③ 双方兵力都 ≥ 1 万
        // [2026-08-10 兵力门槛] 再加一条：任一方不足 SCENE13_MIN_TROOPS 的小仗不进战术层
        const minTroops = GameConfig.COMBAT.SCENE13_MIN_TROOPS;
        const bigEnough = battle.attacker.troops >= minTroops && battle.defender.troops >= minTroops;
        // 🔴 用共用判据：1v1 也可能是「军团打城池」（CombatSystem 的 isDefenderImmobile 分支），
        //    只读 entity.isElite 会让 1v1 攻城战永远进不了 13。
        const attHasElite = unitHasElite(battle.attacker);
        const defHasElite = unitHasElite(battle.defender);
        if (bigEnough
            && battle.attacker.generalId && battle.defender.generalId
            && attHasElite && defHasElite) {
            const centerUnit = battle.attacker.id === followedId ? battle.attacker : battle.defender;
            const t = battleSceneTarget(centerUnit);
            // [2026-08-10] 进 13 = 战术层：时长钉死 1 分钟（真实秒），覆盖引擎的动态时长
            battle.applySceneFixedDuration(GameConfig.COMBAT.SCENE13_BATTLE_DURATION_SEC);
            // [2026-08-11 13 v2] 13 演出接管：冻结引擎（不推进不结算），胜负由出兵口互攻判负写回
            battle.scene13Frozen = true;
            app.battleScene?.setFrozenBattle(battle);   // 退场未判负时据此解冻（见 BattleSceneLayer.unfreezeScene13Battle）
            startScene13War(app, battle.attacker, battle.defender, (winner, sv) => {
                battle.forceScene13Result(winner, winner === 'attacker' ? sv.attacker : sv.defender);
            }, undefined, t.center,
                `${battle.attacker.id}|${battle.defender.id}|${app.timeSystem.getElapsedGameSeconds()}|${app.timeSystem.getYear()}`);
            app.battleScene?.enter(t.center, t.id);
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
        const scale = app.timeSystem.getSpeed();
        // [2026-08-09 独立战斗场景] 进 13 演出条件（主人 2026-08-11 定稿，勿改）：
        //   ① 双方都有武将  ② 双方都有精锐  ③ 双方兵力都 ≥ SCENE13_MIN_TROOPS（1 万）
        //   （攻城战守方 city 的 generalId = 守将 readSiegeGarrisonGeneralId，同样按此三条判定）
        const attHasGen = attackers.some((u) => !!u.generalId);
        const defHasGen = defenders.some((u) => !!u.generalId);
        const attHasElite = attackers.some(unitHasElite);
        const defHasElite = defenders.some(unitHasElite);
        // [2026-08-16 主人改·含援军] 兵力门槛看每方**合计**（含所有已编入的援军），
        //   不再是「每个单位单独 ≥1万」。因为 13 冻结引擎暂停游戏，开战时编入的援军
        //   就是全部、不会有中途加入的援军——开战时看双方总兵力即可。
        const minTroops = GameConfig.COMBAT.SCENE13_MIN_TROOPS;
        const attTroops = attackers.reduce((s, u) => s + (u.troops ?? 0), 0); // 攻方合计（含援军）
        const defTroops = defenders.reduce((s, u) => s + (u.troops ?? 0), 0); // 守方合计（含援军）
        const attBigEnough = attTroops >= minTroops;
        const defBigEnough = defTroops >= minTroops;
        const bigEnough = attBigEnough && defBigEnough;
        // 🔴 三条件全满足才进 13（主人 2026-08-11 定稿）：武将 + 精锐 + 兵力
        if (bigEnough && attHasGen && defHasGen && attHasElite && defHasElite) {
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
                if (att && def) {
                    startScene13War(
                        app,
                        { factionId: att.factionId, troops: attTroops, getEntity: () => att.getEntity?.() },
                        { factionId: def.factionId, troops: defTroops, getEntity: () => def.getEntity?.() },
                        (winner, sv) => {
                            battleField.forceScene13Result(winner, winner === 'attacker' ? sv.attacker : sv.defender);
                        },
                        battleField.getScene13PowerBonus(),
                        t.center,
                        `${battleField.id}|${app.timeSystem.getElapsedGameSeconds()}|${app.timeSystem.getYear()}`
                    );
                }
            }
            app.battleScene?.enter(t.center, t.id);
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
        if (app.combatUI.isBoundToBattleField(battleField)) {
            app.combatUI.syncRegionalParticipantsFromBattleField(battleField);
            return;
        }

        const followedId = app.cameraFollowUI?.getFollowedArmyId();
        if (!followedId || joinedUnit.id !== followedId) return;
        if (battleField.isOver) return;

        const attackers = battleField.getAttackerUnits();
        const defenders = battleField.getDefenderUnits();
        if (attackers.length === 0 || defenders.length === 0) return;

        gameLog(
            'startup',
            `⚔️ [GameApp] Followed army joined battle as reinforcement - showing Combat UI`
        );

        const title = (window as any).__huoqubingBattleTitle ?? battleField.customTitle ?? (battleField.type === 'siege' ? (battleField.siegeCityId ? `${app.cityManager.getCity(battleField.siegeCityId)?.name ?? ''} 攻防战` : '攻城战') : `${app.cityManager.getFactionName(battleField.getAttackerFactionId())} 大战 ${app.cityManager.getFactionName(battleField.getDefenderFactionId())}`);
        const dur = battleField.targetDuration;
        const scale = app.timeSystem.getSpeed();
        try {
            app.combatUI.showRegional(
                attackers,
                defenders,
                undefined,
                undefined,
                title,
                '',
                false,
                dur,
                scale,
                battleField
            );
        } catch (err) {
            console.error('[GameApp] 援军加入战斗 UI 展示失败（战斗仍继续）:', err);
        }
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
