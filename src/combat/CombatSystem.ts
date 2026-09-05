import { GameConfig } from '../config/GameConfig';
import { sumCultureAdjustedTroops } from '../systems/CultureCombat';
import {
    rollSideEffectivePowerWithOpeningFate,
    getBattleTerrainKind,
} from './GeneralSkillCombat';
import { gameLog, gameWarn } from '../utils/GameLogger';
import { readSiegeGarrisonElite } from './SiegeGarrisonTier';

const battleLog = (...args: unknown[]) => gameLog('battle', ...args);
const battleTickLog = (...args: unknown[]) => gameLog('battleTick', ...args);
import type { LegionManager } from '../legion/LegionManager';
import {
    createReinforcementPollState,
    pollFieldBattleReinforcements,
    tickBattleReinforcementPoll,
    type ReinforcementPollState,
} from '../legion/combat/BattleReinforcementPoll';

/** 攻城援军轮询（由 SiegeManager 实现） */
export interface ISiegeReinforcementPollSource {
    runReinforcementPoll(): void;
}

export type BattleType = 'siege' | 'field';

/** 战后恢复比例（遗留机制）：旧版 1v1 Battle 中武将+精锐恢复 50%，其余 30%。现主路径 BattleField 统一走 30%（+战术技加成） */
export function getPostBattleRecoveryRate(
    _battleType?: BattleType,
    _attacker?: IBattleUnit,
    _defender?: IBattleUnit,
): number {
    return GameConfig.COMBAT.POST_BATTLE_RECOVERY_RATE;
}

/** 检测胜方是否有武将+精锐，有则恢复 50%（注：此机制仅在旧 1v1 `Battle` 生效，`BattleField` 不走此逻辑） */
function getWinnerRecoveryRate(winner: IBattleUnit): number {
    const hasGeneral = !!winner.generalId;
    if (!hasGeneral) return GameConfig.COMBAT.POST_BATTLE_RECOVERY_RATE;

    const entity = winner.getEntity?.();
    const hasElite =
        entity?.isElite ||
        (winner.unitType === 'city' && readSiegeGarrisonElite(entity));

    return hasGeneral && hasElite ? 0.5 : GameConfig.COMBAT.POST_BATTLE_RECOVERY_RATE;
}

export type UnitType = 'player' | 'legion' | 'city' | 'bandit' | 'army' | 'npc';

export interface IBattleUnit {
    id: string;
    name: string;
    factionId: string | null;
    unitType: UnitType; // Refers to entity type (UnitType)
    legionType?: string; // [NEW] Refers to combat class (infantry, cavalry, etc.)
    troops: number;
    maxTroops: number;
    setTroops(count: number): void;
    isDestroyed: boolean;
    destroy(): void;
    getPosition(): { lat: number, lng: number };
    onBattleStart?(opponent: IBattleUnit, battleType: BattleType): void;
    onBattleEnd?(result: 'victory' | 'defeat', opponent: IBattleUnit, enemyKilled: number): void;
    // Visual feedback
    showDamage?(damage: number): void;
    isInvincible?: boolean;
    getEntity?(): any; // [NEW] Access to original entity
    playerParticipation?: { ratio: number }; // [ADDED] For player joining battles
    playerHostRankName?: string | null; // [ADDED] 玩家官阶标签名
    lastDamageTime?: number; // [ADDED] For visual feedback
    // [NEW] Morale System
    morale: number;
    maxMorale: number;
    setMorale(count: number): void;
    // [NEW] UI Avatar
    generalId?: string;
    /** 军队创建时随机固定；守城方留空则每次随机 */
    portraitPath?: string;
    // [NEW] V1 Tactical
    battleOverriddenSkillId?: string | null;
    /** 被对抗系(混战计)看破/夺走的原战术技id — 仅供卡片显示"技名·被看破",不参与战斗机制 */
    negatedSkillId?: string | null;
    /** 夺来的敌方战术技id — 战斗机制用此技，卡片仍显示本方原技名 */
    stolenSkillId?: string | null;
    isFirstSortieSinceDepart?: boolean;
}

export class Battle {
    public attacker: IBattleUnit;
    public defender: IBattleUnit;
    public elapsed: number = 0;
    public isOver: boolean = false;
    public type: BattleType;
    private presetResult?: 'attacker_win' | 'defender_win';

    private initialAttackerTroops: number;
    private initialDefenderTroops: number;

    // [NEW] Time-driven combat parameters
    private targetDuration: number;
    private loserDPS: number;  // Damage per second to loser
    private winnerDPS: number; // Damage per second to winner
    private predictedLoser: IBattleUnit;
    private predictedWinner: IBattleUnit;

    /**
     * [2026-08-10 13 战术层固定时长] 进 13 的 1v1 野战同样打满固定时长（主人定：1 分钟）。
     * DPS 按剩余时间反推（update 里的 troops/timeLeft），拉长时长不会让谁提前打光。
     */
    public applySceneFixedDuration(sec: number): void {
        this.targetDuration = sec;
    }

    /**
     * [2026-08-11 13 v2 出兵口互攻] 13 期间引擎冻结标志。
     * true = 本场战斗完全由 13 演出（Scene13WarLayer）接管：update 不推进、不结算，
     * 胜负等演出判负后经 forceScene13Result 写回。8/9/10 永不置位，行为不变。
     */
    public scene13Frozen = false;

    /**
     * [2026-08-11 13 v2] 演出判负 → 写死胜负并立即结算（跳过八环推演）。
     * @param winnerTroops 演出里胜方实际剩下的人数；传了就写回，让大地图与 13 里看到的一致。
     */
    public forceScene13Result(winner: 'attacker' | 'defender', winnerTroops?: number): void {
        this.scene13Frozen = false;
        this.presetResult = winner === 'attacker' ? 'attacker_win' : 'defender_win';
        const win = winner === 'attacker' ? this.attacker : this.defender;
        const lose = winner === 'attacker' ? this.defender : this.attacker;
        if (winnerTroops !== undefined && winnerTroops < win.troops) {
            win.setTroops(Math.max(1, Math.round(winnerTroops)));
        }
        this.resolve(win, lose);
    }

    constructor(attacker: IBattleUnit, defender: IBattleUnit, presetResult?: 'attacker_win' | 'defender_win') {
        this.attacker = attacker;
        this.defender = defender;
        this.initialAttackerTroops = attacker.troops;
        this.initialDefenderTroops = defender.troops;
        this.presetResult = presetResult;

        // 使用 unitType 判断战斗类型
        const isDefenderImmobile = defender.unitType === 'city' || defender.unitType === 'npc';
        this.type = isDefenderImmobile ? 'siege' : 'field';

        // [NEW] Calculate target duration based on troop ratio
        const { targetDuration, loserDPS, winnerDPS, predictedLoser, predictedWinner } =
            this.calculateBattleParameters();
        this.targetDuration = targetDuration;
        this.loserDPS = loserDPS;
        this.winnerDPS = winnerDPS;
        this.predictedLoser = predictedLoser;
        this.predictedWinner = predictedWinner;

        battleLog(`⚔️ Battle Parameters: Duration=${targetDuration.toFixed(1)}s, LoserDPS=${loserDPS.toFixed(1)}, WinnerDPS=${winnerDPS.toFixed(1)}`);

        this.attacker.onBattleStart?.(defender, this.type);
        this.defender.onBattleStart?.(attacker, this.type);
    }

    /**
     * 遗留 1v1 Battle（当前无活跃调用路径，主战斗走 BattleField 区域战）。
     * 双将战时长请读 BattleField.ratioBasedDurationSec：兵力比动态 10–30 秒 + 援军加时。
     */
    private calculateBattleParameters(): {
        targetDuration: number;
        loserDPS: number;
        winnerDPS: number;
        predictedLoser: IBattleUnit;
        predictedWinner: IBattleUnit;
    } {
        const terrain = getBattleTerrainKind([this.attacker, this.defender], this.type);
        const attPower = rollSideEffectivePowerWithOpeningFate(
            [this.attacker],
            [this.defender],
            this.type,
            terrain,
            true,
            { emitUi: false },
        );
        const defPower = rollSideEffectivePowerWithOpeningFate(
            [this.defender],
            [this.attacker],
            this.type,
            terrain,
            false,
            { emitUi: false },
        );
        const attAdj = sumCultureAdjustedTroops([this.attacker]);
        const defAdj = sumCultureAdjustedTroops([this.defender]);

        battleLog(
            `[Battle] ${this.attacker.name} vs ${this.defender.name}: ` +
            `有效战力 ${attPower.toFixed(0)} vs ${defPower.toFixed(0)} ` +
            `(文化修正后 ${attAdj.toFixed(0)} vs ${defAdj.toFixed(0)}，再 ×[LUCK] 掷一次)`
        );

        // 2. Determine Winner/Loser
        let predictedWinner: IBattleUnit;
        let predictedLoser: IBattleUnit;
        let winnerPower: number;
        let loserPower: number;

        if (attPower >= defPower) {
            predictedWinner = this.attacker;
            predictedLoser = this.defender;
            winnerPower = attPower;
            loserPower = defPower;
        } else {
            predictedWinner = this.defender;
            predictedLoser = this.attacker;
            winnerPower = defPower;
            loserPower = attPower;
        }

        // 3. Calculate Combat Duration (Physics Pacing)
        const bothHaveGeneral = !!(this.attacker.generalId && this.defender.generalId);
        // 双将战固定 30 秒；其余固定 9 秒（不存在双方纯兵对打——守城城防必然带将）
        let calculatedDuration = bothHaveGeneral
            ? GameConfig.COMBAT.BATTLE_DURATION_BOTH_GENERALS_SEC
            : GameConfig.COMBAT.BATTLE_DURATION_PARTIAL_GENERAL_SEC;



        // 4. Calculate DPS (Damage Per Second) to achieve this duration
        // Loser must die (or rout) in [calculatedDuration] seconds.
        // Loser DPS = LoserCurrentHP / Duration
        const loserDPS = predictedLoser.troops / calculatedDuration;

        // Winner also takes damage proportional to power ratio
        // WinnerLoss = LoserLoss * (LoserPower / WinnerPower)
        // WinnerDPS = LoserDPS * (LoserPower / WinnerPower)
        const powerRatio = loserPower / Math.max(1, winnerPower);
        const winnerDPS = loserDPS * powerRatio;

        return {
            targetDuration: calculatedDuration,
            loserDPS,
            winnerDPS,
            predictedLoser,
            predictedWinner
        };
    }


    public update(deltaTime: number): void {
        if (this.isOver) {
            battleTickLog(`[Battle] Skipping update - battle already over`);
            return;
        }

        // [2026-08-11 13 v2] 13 演出接管：引擎不推进不结算（胜负由演出判负写回）。
        // 🔴 [2026-08-16 主人取消时间限制] 去掉 120s 看门狗——演出自然打到全军覆没才判负，
        //    引擎一直冻结，直到 forceScene13Result 解冻结算。永久冻结的兜底仍在：
        //    BattleSceneLayer.unfreezeScene13Battle（退场解冻）+ Scene13WarLayer 自身防死锁。
        if (this.scene13Frozen) {
            return;
        }

        // [STABILITY] Check if units were destroyed externally
        if (this.attacker.isDestroyed || this.defender.isDestroyed) {
            gameWarn('battle', `[Battle] Unit destroyed externally, force-resolving battle.`);
            if (!this.attacker.isDestroyed && this.defender.isDestroyed) {
                this.resolve(this.attacker, this.defender);
            } else {
                this.resolve(this.defender, this.attacker);
            }
            return;
        }

        // Sample log to trace updates
        if (Math.random() < 0.02) {
            battleTickLog(`[Battle Update] Att: ${this.attacker.name}(${this.attacker.troops.toFixed(1)}) vs Def: ${this.defender.name}(${this.defender.troops.toFixed(1)})`);
        }

        this.elapsed += deltaTime;

        if (this.elapsed >= this.targetDuration) {
            this.resolve(this.predictedWinner, this.predictedLoser);
            return;
        }

        // deltaTime = gameDelta（= 真实秒，倍速已删）
        const timeLeft = Math.max(0.05, this.targetDuration - this.elapsed);
        let damageToLoser = Math.max(
            this.loserDPS * deltaTime,
            (this.predictedLoser.troops / timeLeft) * deltaTime
        );
        let damageToWinner = this.winnerDPS * deltaTime;

        // Identify which is attacker/defender
        let damageToDefender: number;
        let damageToAttacker: number;

        if (this.predictedLoser === this.defender) {
            damageToDefender = damageToLoser;
            damageToAttacker = damageToWinner;
        } else {
            damageToDefender = damageToWinner;
            damageToAttacker = damageToLoser;
        }

        // Ensure winner keeps at least 10% troops (floor protection)
        const minWinnerTroops = this.predictedWinner === this.attacker
            ? this.initialAttackerTroops * 0.1
            : this.initialDefenderTroops * 0.1;

        if (this.predictedWinner === this.attacker) {
            if (this.attacker.troops - damageToAttacker < minWinnerTroops) {
                damageToAttacker = Math.max(0, this.attacker.troops - minWinnerTroops);
            }
        } else {
            if (this.defender.troops - damageToDefender < minWinnerTroops) {
                damageToDefender = Math.max(0, this.defender.troops - minWinnerTroops);
            }
        }

        // Apply Invincibility
        if (this.attacker.isInvincible) damageToAttacker = 0;
        if (this.defender.isInvincible) damageToDefender = 0;

        // Apply Damage
        const newDefenderTroops = Math.max(0, this.defender.troops - damageToDefender);
        const newAttackerTroops = Math.max(0, this.attacker.troops - damageToAttacker);

        // Update visual damage state
        if (damageToDefender > 0) this.defender.lastDamageTime = Date.now();
        if (damageToAttacker > 0) this.attacker.lastDamageTime = Date.now();

        // Update visuals only if significant change (optimization)
        if (Math.floor(newDefenderTroops) !== Math.floor(this.defender.troops)) {
            this.defender.showDamage?.(damageToDefender);
        }
        if (Math.floor(newAttackerTroops) !== Math.floor(this.attacker.troops)) {
            this.attacker.showDamage?.(damageToAttacker);
        }

        this.defender.setTroops(newDefenderTroops);
        this.attacker.setTroops(newAttackerTroops);

        // Debug Logs
        if (Math.random() < 0.05) { // Sample logs
            battleTickLog(`[Combat Debug] Atk: ${this.attacker.troops.toFixed(0)}, Def: ${this.defender.troops.toFixed(0)}`);
        }

        // Resolve Battle
        // [FIX] Use < 1.0 check to avoid "0.5 troops" keeping battle alive
        if (this.defender.troops < GameConfig.COMBAT.MIN_SURVIVAL_TROOPS) {
            battleLog(`[Combat] Defender troops < ${GameConfig.COMBAT.MIN_SURVIVAL_TROOPS} (${this.defender.troops}), resolving...`);
            this.resolve(this.attacker, this.defender);
        } else if (this.attacker.troops < GameConfig.COMBAT.MIN_SURVIVAL_TROOPS) {
            battleLog(`[Combat] Attacker troops < ${GameConfig.COMBAT.MIN_SURVIVAL_TROOPS} (${this.attacker.troops}), resolving...`);
            this.resolve(this.defender, this.attacker);
        }
    }

    private resolve(winner: IBattleUnit, loser: IBattleUnit): void {
        this.isOver = true;

        // Calculate stats
        const winnerInitial = winner === this.attacker ? this.initialAttackerTroops : this.initialDefenderTroops;
        const loserInitial = loser === this.attacker ? this.initialAttackerTroops : this.initialDefenderTroops;

        // 战后恢复：武将+精锐 50%，其余 30%
        const recoveryRate = getWinnerRecoveryRate(winner);
        const winnerLost = Math.max(0, winnerInitial - winner.troops);
        const recovery = Math.floor(winnerLost * recoveryRate);
        if (recovery > 0) {
            winner.setTroops(winner.troops + recovery);
            battleLog(`[Combat] Winner ${winner.name} recovered ${recovery} wounded troops (rate=${recoveryRate}).`);
        }

        // [FIX] If winner also has 0 or less troops after recovery, destroy them too
        if (winner.troops <= 0) {
            battleLog(`[Combat] Winner ${winner.name} also has 0 troops, destroying...`);
            winner.setTroops(0);
            winner.destroy();
        }

        // Loser destroyed
        const winnerKilled = loserInitial;
        const loserKilled = Math.max(0, winnerInitial - winner.troops);

        winner.onBattleEnd?.('victory', loser, winnerKilled);

        loser.onBattleEnd?.('defeat', winner, loserKilled);

        if (!loser.isDestroyed) {
            loser.setTroops(0);
            loser.destroy();
        }

        battleLog(`Battle ended. Winner: ${winner.name}, Loser: ${loser.name}`);
    }
}

// ==================== 导入区域战斗模块 ====================
import { BattleField } from './BattleField';

export class CombatSystem {
    // [NEW] Global event for RTS trigger
    public onBattleStart?: (battle: Battle) => void;
    /** 沙盒 1v1 野战结束（用于第三方排队接战） */
    public onFieldBattleEnd?: (battle: Battle) => void;
    // [NEW] Global event for regional battles (multi-unit)
    public onRegionalBattleStart?: (
        attackers: IBattleUnit[],
        defenders: IBattleUnit[],
        attackerPortrait?: string,
        defenderPortrait?: string,
        title?: string,
        description?: string,
        isNarrative?: boolean, // [NEW] 叙事模式标志
        battleField?: import('./BattleField').BattleField
    ) => void;

    public onRegionalBattleEnd?: (endedFields: BattleField[]) => void;
    /** 援军编入进行中的区域战（跟随军团中途参战时弹 UI） */
    public onRegionalBattleReinforcement?: (
        battleField: BattleField,
        joinedUnit: IBattleUnit,
        isAttacker: boolean
    ) => void;

    private battles: Battle[] = [];
    private battleFields: BattleField[] = [];

    // Dependencies
    private cityManager: any;
    private npcManager: any;
    private player: any;

    private legionManagerForPoll: LegionManager | null = null;
    private siegePollSource: ISiegeReinforcementPollSource | null = null;
    private reinforcementPollState: ReinforcementPollState = createReinforcementPollState();

    constructor(cityManager: any, npcManager: any, player: any) {
        this.cityManager = cityManager;
        this.npcManager = npcManager;
        this.player = player;
    }

    /** 注册实时开战圈援军轮询（HistoricalEventManager 初始化后调用） */
    public setReinforcementPollTargets(
        legionManager: LegionManager,
        siegePollSource: ISiegeReinforcementPollSource
    ): void {
        this.legionManagerForPoll = legionManager;
        this.siegePollSource = siegePollSource;
    }

    /**
     * 启动 1v1 战斗 (向后兼容)
     */
    public startBattle(attacker: IBattleUnit, defender: IBattleUnit, presetResult?: 'attacker_win' | 'defender_win'): Battle {
        const battle = new Battle(attacker, defender, presetResult);
        this.battles.push(battle);

        battleLog(`⚔️ [CombatSystem] Battle Started: ${attacker.name} vs ${defender.name}`);

        // [RTS TRIGGER] Global notification
        if (this.onBattleStart) {
            this.onBattleStart(battle);
        }

        return battle;
    }

    /**
     * 启动区域战斗 (多单位混战)
     * 
     * @param attackerFactionId 攻击方势力ID
     * @param attackerUnits 攻击方单位列表
     * @param defenderFactionId 防守方势力ID
     * @param defenderUnits 防守方单位列表
     * @param presetResult 预设结果（可选）
     * @param customDuration 导演指定战斗时长（可选，秒）
     * @param attackerPortrait 攻击方立绘（可选）
     * @param defenderPortrait 防守方立绘（可选）
     * @param title 战斗标题（可选）
     * @returns 创建的战场对象 (可用于后续添加援军)
     */
    public startRegionalBattle(
        attackerFactionId: string,
        attackerUnits: IBattleUnit[],
        defenderFactionId: string,
        defenderUnits: IBattleUnit[],
        presetResult?: 'attacker_win' | 'defender_win',
        customDuration?: number,
        attackerPortrait?: string,
        defenderPortrait?: string,
        title?: string,
        description?: string
    ): BattleField {
        const battleField = new BattleField(
            attackerFactionId,
            attackerUnits,
            defenderFactionId,
            defenderUnits,
            presetResult,
            customDuration
        );
        battleField.onReinforcementJoined = (unit, isAttacker) => {
            this.onRegionalBattleReinforcement?.(battleField, unit, isAttacker);
        };

        this.battleFields.push(battleField);

        gameLog('battle', `⚔️ [CombatSystem] Regional Battle Started: ${attackerUnits.length} attackers vs ${defenderUnits.length} defenders`);

        // [NEW] Fire regional battle callback for UI
        if (this.onRegionalBattleStart) {
            this.onRegionalBattleStart(
                attackerUnits,
                defenderUnits,
                attackerPortrait,
                defenderPortrait,
                title,
                description,
                undefined,
                battleField
            );
        }

        return battleField;
    }

    /**
     * 获取所有活跃战场
     */
    public getActiveBattleFields(): BattleField[] {
        return this.battleFields.filter(bf => !bf.isOver);
    }

    /** 进行中的 1v1 野战（沙盒碰撞战） */
    public getActiveBattles(): Battle[] {
        return this.battles.filter((b) => !b.isOver);
    }

    /**
     * [NEW] 强制瞬间结束所有活跃战斗
     */
    public forceResolveAll(): void {
        this.battleFields.forEach(bf => bf.forceResolve());
        this.battles.forEach(b => {
            // 对1v1战斗临时借用原逻辑瞬间清零兵力 (通常已经弃用1v1)
            if (!b.isOver) {
                b.defender.setTroops(0);
            }
        });
        // [NEW] 通知外部系统（如事件管理器）跳过当前事件
        this.onForceResolve?.();
    }

    /** [NEW] 跳过按钮回调，供 HistoricalEventManager 注册 */
    public onForceResolve?: () => void;

    /**
     * @param focusUnitId [2026-08-10 13 独立时钟] 传军团 id = **只推进它参与的那场战斗**，
     *   其余战场本帧原地冻结。13 战术层期间（大战略已暂停）用，让镜头里这一场按自己的
     *   时钟打完，天下其他战斗不跟着偷跑。不传 = 照常推进全部（8/9/10 与平时行为不变）。
     */
    public update(deltaTime: number, focusUnitId?: string | null): void {
        // Update all 1v1 battles
        this.battles.forEach(battle => {
            if (focusUnitId
                && battle.attacker.id !== focusUnitId
                && battle.defender.id !== focusUnitId) return;
            battle.update(deltaTime);
        });

        // Update all regional battles
        this.battleFields.forEach(bf => {
            if (focusUnitId && !bf.hasParticipant(focusUnitId)) return;
            bf.update(deltaTime);
        });

        // Remove finished battles (notify once per battle)
        this.battles = this.battles.filter(battle => {
            if (battle.isOver) {
                this.onFieldBattleEnd?.(battle);
                return false;
            }
            return true;
        });
        const endedRegional = this.battleFields.filter((bf) => bf.isOver);
        if (endedRegional.length > 0 && this.onRegionalBattleEnd) {
            this.onRegionalBattleEnd(endedRegional);
        }
        this.battleFields = this.battleFields.filter((bf) => !bf.isOver);

        this.tickReinforcementPolls(deltaTime);
    }

    private tickReinforcementPolls(deltaTime: number): void {
        const legionManager = this.legionManagerForPoll;
        if (!legionManager) return;

        const siegeSource = this.siegePollSource;
        tickBattleReinforcementPoll(this.reinforcementPollState, deltaTime, () => {
            siegeSource?.runReinforcementPoll();
            pollFieldBattleReinforcements(this, legionManager);
        });
    }
}
