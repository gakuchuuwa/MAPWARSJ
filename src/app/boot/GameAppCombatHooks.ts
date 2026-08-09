import { gameLog } from '../../utils/GameLogger';
import type { GameApp } from '../GameApp';
import type { LegionManager } from '../../legion/LegionManager';
import {
    setGeneralSkillLegionManager,
    setOnTacticalSkillTriggered,
} from '../../combat/GeneralSkillCombat';

/** 战斗 UI：仅在镜头跟随军团参战时才弹出。 */
export function wireGameAppCombatUiHooks(app: GameApp): void {
    app.combatSystem.onBattleStart = (battle) => {
        const followedId = app.cameraFollowUI?.getFollowedArmyId();
        if (!followedId) return;
        const isInvolved = battle.attacker.id === followedId || battle.defender.id === followedId;
        if (!isInvolved) return;
        gameLog('startup', '⚔️ [GameApp] Battle Started (followed army involved) - showing Combat UI');
        app.combatUI.show(battle);
        // [2026-08-09 独立战斗场景空壳] 战斗开始 → 进场景（地图冻结 + 上层画布）
        app.battleScene?.enter();
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
        const dur = battleField?.targetDuration ?? 17;
        const scale = app.timeSystem.getSpeed();
        // [2026-08-09 独立战斗场景空壳] 区域战开始 → 进场景（地图冻结 + 上层画布）
        app.battleScene?.enter();
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
        // [2026-08-09 独立战斗场景空壳] 战斗结束 → 退场景（淡出后恢复地图）
        app.battleScene?.exit();
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
