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

        const title = battleField.type === 'siege' ? '攻城战' : '正在交战';
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
        app.combatUI.flashTacticalSkill(info.displayName);
        gameLog('battle', `✨ [CombatUI] 战术技展示: 【${info.displayName}】 (${info.generalId})`);
    });
}
