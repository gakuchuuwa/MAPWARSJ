/**
 * BattleField - 区域战斗管理器（N 对 N 援军混战）
 *
 * 攻方一旗 vs 守方一旗（乱斗 1 势力 = 1 旗，无联军）；每侧可有多支**同旗**军团
 * （多见于：后期占多城的大势力、或回师救城的防守方），各单位独立计兵力。
 *
 * 设计原则：
 * 1. 一侧 = 一 factionId；同旗援军经 BattleReinforcementPoll 在 30km 圈内实时编入
 * 2. 独立兵力：每个单位独立受损，「谁带的兵死谁的」
 * 3. 伤害分配：一侧总伤害按各单位兵力比例分摊（兵多的扛更多）
 * 4. 援军编入后重算强弱（refreshPredictedSidesFromTotals，按文化修正兵力、不重掷 luck——
 *    刻意为之：避免每 0.2s 轮询重掷导致胜方闪烁，详见 GAME_DIRECTION 战斗审计）
 */

import { IBattleUnit, BattleType, UnitType } from './CombatSystem';
import { gameLog } from '../utils/GameLogger';
import {
    calculateBattleDurationSec,
    clampBattleDurationSec,
    GameConfig,
    rollCombatLuckMultiplier,
} from '../config/GameConfig';
import { rollSideEffectivePower, sumCultureAdjustedTroops, getUnitCultureCombatMultiplier } from '../systems/CultureCombat';
import { restoreScriptedQinTroopsInBattle } from '../legion/ScriptedQinLegion';

// ==================== 类型定义 ====================

export interface BattleFieldUnit {
    unit: IBattleUnit;
    initialTroops: number;
    isDefeated: boolean;
    /** 编入顺序：0 = 初始主力（军团/驻军），1+ = 援军波次 */
    waveIndex: number;
}

export interface FactionGroup {
    factionId: string;
    units: BattleFieldUnit[];
    totalTroops: number;
    initialTotalTroops: number; // [NEW] 初始总兵力，用于计算战斗时长
    totalDamageOutput: number;
}

// ==================== 战场类 ====================

export class BattleField {
    public id: string;
    public isOver: boolean = false;
    public onBattleComplete?: (winnerFactionId: string) => void; // [NEW] Callback for event sequencing
    /** 援军编入本场区域战（用于跟随军团 UI） */
    public onReinforcementJoined?: (unit: IBattleUnit, isAttacker: boolean) => void;

    public elapsed: number = 0;
    public type: BattleType;
    public targetDuration: number = 0; // [NEW] Public property

    private attackerGroup: FactionGroup;
    private defenderGroup: FactionGroup;
    /** 开战掷定：弱方 DPS 拉满、强方按比例承伤，至时长结束弱方必败 */
    private predictedStrongerGroup!: FactionGroup;
    private predictedWeakerGroup!: FactionGroup;
    private presetResult?: 'attacker_win' | 'defender_win';
    private customDuration?: number; // [NEW] Director-controlled duration override
    private nextReinforcementWave = 1; // 下一波援军编号，从 1 开始
    /** 援军编入时掷定的有效战力系数（waveIndex≥1），不重掷 */
    private readonly reinforcementLuckByUnitId = new Map<string, number>();

    // 伤害系数现在从 GameConfig 读取

    constructor(
        attackerFactionId: string,
        attackerUnits: IBattleUnit[],
        defenderFactionId: string,
        defenderUnits: IBattleUnit[],
        presetResult?: 'attacker_win' | 'defender_win',
        customDuration?: number // [NEW] Director-controlled duration in seconds
    ) {
        this.id = `bf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.presetResult = presetResult;
        this.customDuration = customDuration;

        // 初始化攻击方编组
        const attackerInitialTotal = attackerUnits.reduce((sum, u) => sum + u.troops, 0);
        this.attackerGroup = {
            factionId: attackerFactionId,
            units: attackerUnits.map(u => ({
                unit: u,
                initialTroops: u.troops,
                isDefeated: false,
                waveIndex: 0,
            })),
            totalTroops: attackerInitialTotal,
            initialTotalTroops: attackerInitialTotal,
            totalDamageOutput: 0
        };

        // 初始化防守方编组
        const defenderInitialTotal = defenderUnits.reduce((sum, u) => sum + u.troops, 0);
        this.defenderGroup = {
            factionId: defenderFactionId,
            units: defenderUnits.map(u => ({
                unit: u,
                initialTroops: u.troops,
                isDefeated: false,
                waveIndex: 0,
            })),
            totalTroops: defenderInitialTotal,
            initialTotalTroops: defenderInitialTotal,
            totalDamageOutput: 0
        };

        // 判断战斗类型
        const hasCity = defenderUnits.some(u => u.unitType === 'city');
        this.type = hasCity ? 'siege' : 'field';

        // [NEW] Calculate Duration immediately
        this.calculateTargetDuration();
        this.pickPredictedSides();

        // 触发战斗开始回调
        this.notifyBattleStart();

        gameLog('battle', `🏟️ [BattleField] 区域战斗开始!${presetResult ? ` [预设结果: ${presetResult}]` : ''}`);
        gameLog('battle', `   攻方 (${attackerFactionId}): ${attackerUnits.map(u => `${u.name}(${u.troops})`).join(', ')}`);
        gameLog('battle', `   守方 (${defenderFactionId}): ${defenderUnits.map(u => `${u.name}(${u.troops})`).join(', ')}`);
        gameLog('battle', `   ⏱️ 预计战斗时长: ${this.targetDuration.toFixed(1)}秒`);
    }

    private calculateTargetDuration() {
        // [NEW] If customDuration is specified, use it directly (director control)
        if (this.customDuration !== undefined && this.customDuration > 0) {
            this.targetDuration = clampBattleDurationSec(this.customDuration);
            gameLog('battle', `🎬 [BattleField] 导演时长: ${this.targetDuration.toFixed(1)}s (钳制 5–60)`);
            return;
        }

        const totalTroops =
            this.attackerGroup.initialTotalTroops + this.defenderGroup.initialTotalTroops;
        this.targetDuration = calculateBattleDurationSec(totalTroops);
    }

    /** 预设结果或「初始兵力 × 随机系数」一次定胜负走向 */
    private pickPredictedSides(): void {
        if (this.presetResult === 'attacker_win') {
            this.predictedStrongerGroup = this.attackerGroup;
            this.predictedWeakerGroup = this.defenderGroup;
            return;
        }
        if (this.presetResult === 'defender_win') {
            this.predictedStrongerGroup = this.defenderGroup;
            this.predictedWeakerGroup = this.attackerGroup;
            return;
        }
        const attUnits = this.attackerGroup.units.map((bu) => bu.unit);
        const defUnits = this.defenderGroup.units.map((bu) => bu.unit);
        const attAdj = sumCultureAdjustedTroops(attUnits);
        const defAdj = sumCultureAdjustedTroops(defUnits);
        const attRoll = rollSideEffectivePower(attUnits);
        const defRoll = rollSideEffectivePower(defUnits);
        gameLog(
            'battle',
            `[BattleField] 掷色: 攻有效 ${attRoll.toFixed(0)} vs 守有效 ${defRoll.toFixed(0)} ` +
            `(文化修正后 ${attAdj.toFixed(0)} vs ${defAdj.toFixed(0)}，` +
            `原兵力 ${this.attackerGroup.initialTotalTroops} vs ${this.defenderGroup.initialTotalTroops}，再 ×[0.8,1.2])`
        );
        this.applyPredictedSidesFromRoll(attRoll, defRoll);
    }

    private applyPredictedSidesFromRoll(attRoll: number, defRoll: number): void {
        if (attRoll >= defRoll) {
            this.predictedStrongerGroup = this.attackerGroup;
            this.predictedWeakerGroup = this.defenderGroup;
        } else {
            this.predictedStrongerGroup = this.defenderGroup;
            this.predictedWeakerGroup = this.attackerGroup;
        }
    }

    /**
     * 一侧文化修正战力 + 援军系数：兵力 × 文化关隘系数 × 援军编入 luck。
     * 援军 = waveIndex≥1，编入时掷 [LUCK_MIN,LUCK_MAX] 一次；主力 waveIndex=0 恒 ×1。
     */
    private adjustedPowerWithReinforcement(group: FactionGroup): number {
        let sum = 0;
        for (const bu of group.units) {
            if (bu.isDefeated || bu.unit.troops <= 0) continue;
            const mult =
                bu.waveIndex >= 1
                    ? (this.reinforcementLuckByUnitId.get(bu.unit.id) ?? 1)
                    : 1;
            sum += bu.unit.troops * getUnitCultureCombatMultiplier(bu.unit) * mult;
        }
        return sum;
    }

    /**
     * 援军编入后按当前文化修正兵力（含援军加成）重算强弱（不重新掷色）。
     * 开战时的 pickPredictedSides 不会随 initialTotalTroops 更新，会导致
     * 「兵力已逆转却仍按旧强弱承伤」的 NvN 异常。
     */
    private refreshPredictedSidesFromTotals(): void {
        if (this.presetResult) return;

        const attAdj = this.adjustedPowerWithReinforcement(this.attackerGroup);
        const defAdj = this.adjustedPowerWithReinforcement(this.defenderGroup);

        const prevStronger = this.predictedStrongerGroup.factionId;
        this.applyPredictedSidesFromRoll(attAdj, defAdj);

        if (this.predictedStrongerGroup.factionId !== prevStronger) {
            gameLog(
                'battle',
                `[BattleField] 援军编入后强弱重算: ${this.predictedStrongerGroup.factionId} 占优 ` +
                `(文化修正 ${attAdj.toFixed(0)} vs ${defAdj.toFixed(0)})`
            );
        }
    }

    private notifyBattleStart(): void {
        // 通知所有单位战斗开始；同一侧多军团都必须指向敌方代表单位。
        this.attackerGroup.units.forEach(bu => {
            const opponent = this.defenderGroup.units[0]?.unit;
            if (opponent) {
                bu.unit.onBattleStart?.(opponent, this.type);
            }
        });
        this.defenderGroup.units.forEach(bu => {
            const opponent = this.attackerGroup.units[0]?.unit;
            if (opponent) {
                bu.unit.onBattleStart?.(opponent, this.type);
            }
        });
    }

    /**
     * 每帧更新战斗
     */
    public update(deltaTime: number): void {
        if (this.isOver) return;

        // deltaTime = gameDelta（GameApp 已乘 timeScale）
        this.elapsed += deltaTime;

        // 更新各组总兵力
        this.updateGroupStats();

        if (this.attackerGroup.totalTroops < 1) {
            this.resolve(this.defenderGroup, this.attackerGroup);
            return;
        }
        if (this.defenderGroup.totalTroops < 1) {
            this.resolve(this.attackerGroup, this.defenderGroup);
            return;
        }

        // [FIX] Mid-combat Faction Alignment Check
        // If the main defender (usually the city) has changed faction to match the attacker, end battle.
        // This handles cases where the city is captured by an external force or a bug causes faction flip.
        const attackerFactionId = this.attackerGroup.factionId;
        const mainDefender = this.defenderGroup.units.find(u => u.unit.unitType === 'city');
        if (mainDefender && mainDefender.unit.factionId === attackerFactionId) {
            gameLog('battle', `🏰 [BattleField] Siege target ${mainDefender.unit.name} is now friendly to attackers. Ending battle.`);
            this.resolve(this.attackerGroup, this.defenderGroup); // Attacker wins (city already flipped)
            return;
        }


        // 时间驱动 DPS：开战掷定的强/弱方，弱方在 targetDuration 内被磨光
        const strongerGroup = this.predictedStrongerGroup;
        const weakerGroup = this.predictedWeakerGroup;
        const strongerInitial = strongerGroup.initialTotalTroops;
        const weakerInitial = weakerGroup.initialTotalTroops;
        const ratio = Math.max(1, strongerInitial / Math.max(1, weakerInitial));

        // [MOD] Use pre-calculated targetDuration
        const targetDuration = this.targetDuration;

        // [FIX] DPS is constant based on initial troops
        const weakerDPS = weakerInitial / targetDuration;

        // Stronger side loses fixed percentage (50% at 1:1, 5% at 10:1)
        const strongerLossPercent = Math.max(0.05, 0.5 / ratio);
        const strongerTotalLoss = strongerInitial * strongerLossPercent;
        const strongerDPS = strongerTotalLoss / targetDuration;

        // [FIX] Assign damage based on strongerGroup/weakerGroup (respects presetResult)
        let damageToAttackers: number;
        let damageToDefenders: number;

        const timeLeft = Math.max(0.05, targetDuration - this.elapsed);
        const minWeakerDamage = (weakerGroup.totalTroops / timeLeft) * deltaTime;

        if (strongerGroup === this.attackerGroup) {
            damageToDefenders = Math.max(weakerDPS * deltaTime, minWeakerDamage);
            damageToAttackers = strongerDPS * deltaTime;
        } else {
            damageToAttackers = Math.max(weakerDPS * deltaTime, minWeakerDamage);
            damageToDefenders = strongerDPS * deltaTime;
        }

        this.distributeDamage(this.defenderGroup, damageToDefenders);
        this.distributeDamage(this.attackerGroup, damageToAttackers);

        // 采样日志（BATTLE_TICK 频道，默认关）
        if (Math.random() < 0.03) {
            gameLog('battleTick', `[BattleField] 攻方: ${this.attackerGroup.totalTroops.toFixed(0)} | 守方: ${this.defenderGroup.totalTroops.toFixed(0)} | 目标时长: ${targetDuration.toFixed(1)}s`);
        }
    }

    /**
     * 更新各组的总兵力统计
     */
    private updateGroupStats(): void {
        this.attackerGroup.totalTroops = this.attackerGroup.units
            .filter(u => !u.isDefeated)
            .reduce((sum, u) => sum + u.unit.troops, 0);

        this.defenderGroup.totalTroops = this.defenderGroup.units
            .filter(u => !u.isDefeated)
            .reduce((sum, u) => sum + u.unit.troops, 0);
    }

    /**
     * 将总伤害分配给一个编组中的各单位
     * 
     * 分配策略：按兵力比例分配（兵多的扛更多伤害）
     * 这模拟了"前线接战"的概念
     */
    private distributeDamage(group: FactionGroup, totalDamage: number): void {
        const aliveUnits = group.units.filter(u => !u.isDefeated && u.unit.troops > 0);
        if (aliveUnits.length === 0) return;

        const totalTroops = aliveUnits.reduce((sum, u) => sum + u.unit.troops, 0);
        // [STABILITY] 防止除以零或 NaN
        if (totalTroops <= 0 || isNaN(totalTroops)) return;

        aliveUnits.forEach(bu => {
            // 按兵力比例分配伤害（兵多的扛更多）
            const ratio = bu.unit.troops / totalTroops;
            let damage = totalDamage * ratio;

            // 无敌状态（武将技「临时不掉血」等可用，见 IBattleUnit.isInvincible）
            if (bu.unit.isInvincible) {
                damage = 0;
            }

            const newTroops = Math.max(0, bu.unit.troops - damage);
            bu.unit.setTroops(newTroops);

            // 显示伤害
            if (damage > 0.5) {
                bu.unit.showDamage?.(damage);
            }

            // 检查是否被击败
            if (newTroops < 1) {
                bu.isDefeated = true;
                gameLog('battle', `💀 [BattleField] ${bu.unit.name} 被击败!`);
            }
        });
    }

    /**
     * 战斗结束处理
     */
    private resolve(winnerGroup: FactionGroup, loserGroup: FactionGroup): void {
        this.isOver = true;


        gameLog('battle', `🏆 [BattleField] 战斗结束! 胜者: ${winnerGroup.factionId}`);

        // 处理失败方（先 onBattleEnd 再 destroy，避免败军误触发战胜驻留）
        loserGroup.units.forEach(bu => {
            bu.unit.setTroops(0);
            const opponent = winnerGroup.units[0]?.unit;
            if (opponent) {
                bu.unit.onBattleEnd?.('defeat', opponent, 0);
            }
            if (!bu.unit.isDestroyed) {
                bu.unit.destroy();
            }
        });

        // 分级战后恢复（2026-06-12）：战场含城则按该城等级（关10%/小20%/中30%/大40%），纯野战 50%
        const cityUnit =
            [...winnerGroup.units, ...loserGroup.units].find(u => u.unit.unitType === 'city')?.unit ?? null;
        const cityType = (cityUnit?.getEntity?.() as { type?: string } | undefined)?.type;
        const recoveryTable = GameConfig.COMBAT.POST_BATTLE_RECOVERY;
        const recoveryRate =
            cityType && recoveryTable[cityType] !== undefined ? recoveryTable[cityType] : recoveryTable.field;

        // 处理胜利方
        winnerGroup.units.filter(u => !u.isDefeated).forEach(bu => {
            const lost = bu.initialTroops - bu.unit.troops;
            const recovery = Math.floor(lost * recoveryRate);
            if (recovery > 0) {
                bu.unit.setTroops(bu.unit.troops + recovery);
                gameLog('battle', `🩹 [BattleField] ${bu.unit.name} 恢复 ${recovery} 伤兵（恢复率 ${recoveryRate}）`);
            }

            // 找一个失败方单位作为对手
            const opponent = loserGroup.units[0]?.unit;
            if (opponent) {
                bu.unit.onBattleEnd?.('victory', opponent, 0);
            }
        });

        // 处理胜利方中被击败的单位
        winnerGroup.units.filter(u => u.isDefeated).forEach(bu => {
            bu.unit.setTroops(0);
            const opponent = loserGroup.units[0]?.unit;
            if (opponent) {
                bu.unit.onBattleEnd?.('defeat', opponent, 0);
            }
            if (!bu.unit.isDestroyed) {
                bu.unit.destroy();
            }
        });

        // 防止个别单位未收到 onBattleEnd 而长期停在战斗姿态
        this.releaseAllMobileCombatStates();
        restoreScriptedQinTroopsInBattle([
            ...this.attackerGroup.units.map((bu) => bu.unit),
            ...this.defenderGroup.units.map((bu) => bu.unit),
        ]);
        this.onBattleComplete?.(winnerGroup.factionId); // [NEW] Notify System after settlement callbacks
    }

    /** 区域战结束：强制解除战斗姿态（不重复触发战胜驻留） */
    private releaseAllMobileCombatStates(): void {
        const all = [...this.attackerGroup.units, ...this.defenderGroup.units];
        for (const bu of all) {
            const u = bu.unit;
            if (u.unitType !== 'legion' && u.unitType !== 'army') continue;
            const army = u as IBattleUnit & { clearExternalCombatState?: () => void };
            army.clearExternalCombatState?.();
        }
    }

    // ==================== 辅助方法 ====================

    /**
     * [NEW] 瞬间结束战斗 (跳过模拟)
     * 计算胜者并将败方兵力清零，直接进入结算
     */
    public forceResolve(): void {
        if (this.isOver) return;

        gameLog('battle', `⏭️ [BattleField] 被强制结束!`);

        let winnerGroup: FactionGroup;
        let loserGroup: FactionGroup;

        if (this.presetResult === 'attacker_win') {
            winnerGroup = this.attackerGroup;
            loserGroup = this.defenderGroup;
        } else if (this.presetResult === 'defender_win') {
            winnerGroup = this.defenderGroup;
            loserGroup = this.attackerGroup;
        } else {
            winnerGroup = this.predictedStrongerGroup;
            loserGroup = this.predictedWeakerGroup;
        }

        // 瞬间将败方兵力清零
        loserGroup.units.forEach(u => {
            u.unit.setTroops(0);
            u.isDefeated = true;
        });

        // 调用原有结算
        this.resolve(winnerGroup, loserGroup);
    }

    /** 复国/政变等外部事件：终止战场但不结算胜负、不销毁单位 */
    public abortWithoutSettlement(): void {
        if (this.isOver) return;
        this.isOver = true;
        this.onBattleComplete = undefined;
        this.releaseAllMobileCombatStates();
    }

    public getAttackerFactionId(): string {
        return this.attackerGroup.factionId;
    }

    public getDefenderFactionId(): string {
        return this.defenderGroup.factionId;
    }

    /** 战场参考坐标（未溃败单位的重心，用于邻近增援判定） */
    public getReferencePosition(): { lat: number; lng: number } {
        let lat = 0;
        let lng = 0;
        let count = 0;
        const all = [...this.attackerGroup.units, ...this.defenderGroup.units];
        for (const entry of all) {
            if (entry.isDefeated) continue;
            const p = entry.unit.getPosition();
            lat += p.lat;
            lng += p.lng;
            count++;
        }
        if (count === 0) {
            const fallback = all[0]?.unit.getPosition();
            return fallback ? { lat: fallback.lat, lng: fallback.lng } : { lat: 0, lng: 0 };
        }
        return { lat: lat / count, lng: lng / count };
    }

    /** 该军团是否已在本战场中 */
    public hasUnit(armyId: string): boolean {
        return [...this.attackerGroup.units, ...this.defenderGroup.units].some(
            (u) => u.unit.id === armyId && !u.isDefeated
        );
    }

    /** 攻/守编组中的军团数（不含城池等非军团单位） */
    public getSideLegionCounts(): { attackerLegions: number; defenderLegions: number } {
        const countLegions = (group: FactionGroup): number =>
            group.units.filter(
                (u) =>
                    !u.isDefeated &&
                    (u.unit.unitType === 'legion' || u.unit.unitType === 'army')
            ).length;

        return {
            attackerLegions: countLegions(this.attackerGroup),
            defenderLegions: countLegions(this.defenderGroup),
        };
    }

    /** 剧本预设胜负（事件写死或秦军援军介入后锁定） */
    public getPresetResult(): 'attacker_win' | 'defender_win' | undefined {
        return this.presetResult;
    }

    /** 中途改预设（如秦军作为援军加入）并重算强弱 */
    public applyPresetResult(result: 'attacker_win' | 'defender_win'): void {
        if (this.isOver) return;
        if (this.presetResult === result) return;
        this.presetResult = result;
        this.pickPredictedSides();
        gameLog('battle', `📜 [BattleField] 预设结果更新为: ${result}`);
    }

    /** 添加援军到战场 */
    public addReinforcement(unit: IBattleUnit, isAttacker: boolean): void {
        const group = isAttacker ? this.attackerGroup : this.defenderGroup;

        // 检查是否已在战场
        if (group.units.some(u => u.unit.id === unit.id)) {
            console.warn(`[BattleField] ${unit.name} 已在战场中`);
            return;
        }

        const joinedTroops = unit.troops;
        const wave = this.nextReinforcementWave++;
        const joinLuck = rollCombatLuckMultiplier();
        this.reinforcementLuckByUnitId.set(unit.id, joinLuck);
        group.units.push({
            unit,
            initialTroops: joinedTroops,
            isDefeated: false,
            waveIndex: wave,
        });
        group.initialTotalTroops += joinedTroops;

        // 通知战斗开始
        const opponent = isAttacker
            ? this.defenderGroup.units[0]?.unit
            : this.attackerGroup.units[0]?.unit;
        if (opponent) {
            unit.onBattleStart?.(opponent, this.type);
        }

        const prevDuration = this.targetDuration;
        if (!this.customDuration) {
            this.calculateTargetDuration();
        }
        this.refreshPredictedSidesFromTotals();

        gameLog(
            'battle',
            `📯 [BattleField] ${unit.name}(${joinedTroops}) 加入${isAttacker ? '攻方' : '守方'}! ` +
            `有效战力×${joinLuck.toFixed(2)}, 编组兵力→${group.initialTotalTroops}` +
            (this.customDuration ? '' : `, 目标时长 ${prevDuration.toFixed(1)}s→${this.targetDuration.toFixed(1)}s`)
        );

        this.updateGroupStats();
        this.onReinforcementJoined?.(unit, isAttacker);
    }

    /** 当前存活攻方参战单位 */
    public getAttackerUnits(): IBattleUnit[] {
        return this.attackerGroup.units
            .filter((bu) => !bu.isDefeated && !bu.unit.isDestroyed)
            .map((bu) => bu.unit);
    }

    /** 当前存活守方参战单位 */
    public getDefenderUnits(): IBattleUnit[] {
        return this.defenderGroup.units
            .filter((bu) => !bu.isDefeated && !bu.unit.isDestroyed)
            .map((bu) => bu.unit);
    }

    /** 是否包含指定参战单位（用于战斗 UI 跟随判断） */
    public hasParticipant(unitId: string): boolean {
        const all = [...this.attackerGroup.units, ...this.defenderGroup.units];
        return all.some((p) => p.unit.id === unitId);
    }

    /** 查询单位在战场中的波次编号（0 = 主力，1+ = 援军波次） */
    public getUnitWaveIndex(unitId: string): number {
        const all = [...this.attackerGroup.units, ...this.defenderGroup.units];
        const found = all.find((p) => p.unit.id === unitId);
        return found?.waveIndex ?? 0;
    }

    /**
     * 获取战场信息
     */
    public getInfo(): {
        attackerTroops: number;
        defenderTroops: number;
        attackerInitial: number;
        defenderInitial: number;
        elapsed: number;
    } {
        return {
            attackerTroops: this.attackerGroup.totalTroops,
            defenderTroops: this.defenderGroup.totalTroops,
            attackerInitial: this.attackerGroup.initialTotalTroops,
            defenderInitial: this.defenderGroup.initialTotalTroops,
            elapsed: this.elapsed
        };
    }
}
