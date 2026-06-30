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
 * 4. 援军编入后重算强弱（refreshPredictedSidesFromTotals：文化修正兵力 + 援军编入 luck + 武将技侧乘区，不重掷侧 luck）
 */

import { IBattleUnit, BattleType, UnitType } from './CombatSystem';
import { gameLog } from '../utils/GameLogger';
import { audioManager } from '../audio/AudioManager';

function getFollowedArmyId(): string | null {
    try {
        return (window as any).game?.cameraFollowUI?.getFollowedArmyId?.() ?? null;
    } catch {
        return null;
    }
}
import {
    calculateBattleDurationSec,
    clampBattleDurationSec,
    GameConfig,
    rollCombatLuckMultiplier,
} from '../config/GameConfig';
import { rollSideEffectivePower, sumCultureAdjustedTroops, getUnitBattlePowerMultiplier, getUnitEliteTier } from '../systems/CultureCombat';
import { getGeneralProfile } from '../data/GeneralSkills';
import {
    applyGeneralSkillSideRollMultipliers,
    applyOpeningTacticalPreRoll,
    applyPostBattleStrategicBonus,
    applyStrategicRollMultipliersOnly,
    applyComebackRollMultipliersForSide,
    tryApplyComebackTacticalForSide,
    tryEmitOpeningTacticalOnReinforcementJoin,
} from './GeneralSkillCombat';
import { BattleUnitFactory } from './BattleUnitFactory';
import {
    reconcileSiegeGarrisonBoostWithLegion,
    reconcileSiegeGarrisonBoostWithLegions,
    type SiegeGarrisonBoostFields,
} from './SiegeGarrisonTier';
import type { Army } from '../legion/Army';
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
    /** 攻城战守方 cityId（构造时锁定，结算后仍可读） */
    public readonly siegeCityId: string | null;
    /** 由 SiegeManager 注册：区域战 resolve 时必停火焰/齐射，不依赖 onBattleComplete 赋值时机 */
    private static siegeVisualStopHandler: ((cityId: string) => void) | null = null;

    public static setSiegeVisualStopHandler(handler: ((cityId: string) => void) | null): void {
        BattleField.siegeVisualStopHandler = handler;
    }
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
    /** 每侧已触发的战术技 id（①–⑩ 每场一次类） */
    private readonly attackerTacticalTriggered = new Set<string>();
    private readonly defenderTacticalTriggered = new Set<string>();
    /** 名将开局战术 UI 是否已展示 */
    private readonly openingTacticalUiShown = { attacker: false, defender: false };
    /** unitId → 免伤窗口（游戏内 elapsed） */
    private readonly invincibleWindowByUnitId = new Map<string, { start: number; until: number }>();
    /** 战局动量（-1~+1），正=强方冲击，负=弱方反击；纯视觉，不改胜负 */
    private momentumValue: number = 0;
    private momentumTarget: number = 0;
    private momentumTimer: number = 0;
    /** 威慑系统：强方战损减免 0~0.8（保命），与战斗节奏时长系数（碾压短/巅峰长） */
    private fearLossReduction: number = 0;
    private fearDurationMult: number = 1;

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
        this.siegeCityId = hasCity
            ? (defenderUnits.find(u => u.unitType === 'city')?.id ?? null)
            : null;

        // [NEW] Calculate Duration immediately
        this.calculateTargetDuration();
        this.pickPredictedSides();
        // 威慑系统：定强弱后算战损减免 + 节奏时长系数
        this.applyIntimidationModifiers();
        this.targetDuration = clampBattleDurationSec(this.targetDuration * this.fearDurationMult);
        this.reconcileSiegeGarrisonBoostWithDefenders();
        
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

    /**
     * 三阶段包络：开局渐入(0→1) → 中段满幅(1) → 末段衰减(1→0)
     * 按 elapsed/targetDuration 比例，短战和长战都自适应
     */
    private getPhaseEnvelope(): number {
        const p = Math.min(1, this.elapsed / Math.max(1, this.targetDuration));
        if (p < 0.33) return p / 0.33;
        if (p < 0.67) return 1;
        return Math.max(0, (1 - p) / 0.33);
    }

    /**
     * OU 过程更新动量：每 ~targetDuration×10% 秒掷新随机目标，帧间 lerp 平滑
     */
    private updateMomentum(deltaTime: number): void {
        this.momentumTimer -= deltaTime;
        if (this.momentumTimer <= 0) {
            this.momentumTarget = Math.random() * 2 - 1;
            const interval = Math.max(1.5, this.targetDuration * 0.1);
            this.momentumTimer = interval * (0.7 + Math.random() * 0.6);
        }
        const lerpSpeed = 2.5;
        this.momentumValue += (this.momentumTarget - this.momentumValue)
            * Math.min(1, lerpSpeed * deltaTime);
    }

    /** 单位威慑值（0~4）= 将领分(名将2/普将1/无0) + 精锐分(T0~T3 = 2/1.5/1/0.5，无0) */
    private unitIntimidation(unit: IBattleUnit): number {
        const genTier = getGeneralProfile(unit.generalId)?.tier;
        const gen = genTier === 'famous' ? 2 : genTier === 'ordinary' ? 1 : 0;
        const eliteTier = getUnitEliteTier(unit);
        const elite = eliteTier === null ? 0 : [2, 1.5, 1, 0.5][eliteTier];
        return gen + elite;
    }

    /** 一侧威慑 = 存活单位最强威慑（最猛的将/精锐定调） */
    private sideIntimidation(group: FactionGroup): number {
        let max = 0;
        for (const bu of group.units) {
            if (bu.isDefeated || bu.unit.troops <= 0) continue;
            const v = this.unitIntimidation(bu.unit);
            if (v > max) max = v;
        }
        return max;
    }

    /**
     * 威慑系统：按双方将领+精锐质量差，
     *  ① 减免强方战损（保命核心）；② 调节战斗节奏（碾压压短、巅峰拉长）。
     * 不改胜负判定。事件战斗（presetResult）整套跳过。
     */
    private applyIntimidationModifiers(): void {
        if (this.presetResult) {
            this.fearLossReduction = 0;
            this.fearDurationMult = 1;
            return;
        }
        const MAX = 4;
        const strongerIntim = this.sideIntimidation(this.predictedStrongerGroup);
        const weakerIntim = this.sideIntimidation(this.predictedWeakerGroup);

        // 保命：强方威慑越压制弱方，战损减免越多（最高 80%）
        const adv = Math.max(0, Math.min(1, (strongerIntim - weakerIntim) / MAX));
        this.fearLossReduction = 0.8 * adv;

        // 节奏：两边都强且接近 → 精彩 → 拉长；碾压或菜鸡互啄 → 压短
        const minIntim = Math.min(strongerIntim, weakerIntim);
        const gap = Math.abs(strongerIntim - weakerIntim);
        const excitement = (minIntim / MAX) * (1 - gap / MAX);
        this.fearDurationMult = 0.5 + (1.6 - 0.5) * excitement;
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

        applyOpeningTacticalPreRoll(
            attUnits,
            defUnits,
            this.elapsed,
            (unit, startElapsed, durationSec) => this.scheduleInvincible(unit, startElapsed, durationSec),
            {
                attacker: this.attackerTacticalTriggered,
                defender: this.defenderTacticalTriggered,
            },
            true,
            this.openingTacticalUiShown,
        );
        this.updateGroupStats();
        this.attackerGroup.initialTotalTroops = this.attackerGroup.totalTroops;
        this.defenderGroup.initialTotalTroops = this.defenderGroup.totalTroops;

        const attRoll = rollSideEffectivePower(attUnits);
        const defRoll = rollSideEffectivePower(defUnits);
        const strategic = applyGeneralSkillSideRollMultipliers(
            attUnits,
            defUnits,
            attRoll,
            defRoll,
            this.type,
            { openingUiShown: this.openingTacticalUiShown },
        );
        gameLog(
            'battle',
            `[BattleField] 掷色: 攻有效 ${strategic.attRoll.toFixed(0)} vs 守有效 ${strategic.defRoll.toFixed(0)} ` +
            `(文化修正后 ${attAdj.toFixed(0)} vs ${defAdj.toFixed(0)}，` +
            `原兵力 ${this.attackerGroup.initialTotalTroops} vs ${this.defenderGroup.initialTotalTroops}，再 ×[0.8,1.2])`
        );
        this.applyPredictedSidesFromRoll(strategic.attRoll, strategic.defRoll);
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
            sum += bu.unit.troops * getUnitBattlePowerMultiplier(bu.unit) * mult;
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

        const attUnits = this.attackerGroup.units
            .filter((bu) => !bu.isDefeated && bu.unit.troops > 0)
            .map((bu) => bu.unit);
        const defUnits = this.defenderGroup.units
            .filter((bu) => !bu.isDefeated && bu.unit.troops > 0)
            .map((bu) => bu.unit);

        const attAdj = this.adjustedPowerWithReinforcement(this.attackerGroup);
        const defAdj = this.adjustedPowerWithReinforcement(this.defenderGroup);
        let withSkills = applyStrategicRollMultipliersOnly(
            attUnits,
            defUnits,
            attAdj,
            defAdj,
            this.type,
        );
        const attComeback = applyComebackRollMultipliersForSide(
            attUnits,
            defUnits,
            withSkills.attRoll,
            withSkills.defRoll,
            this.attackerTacticalTriggered,
        );
        withSkills = {
            attRoll: attComeback.sideRoll,
            defRoll: attComeback.opponentRoll,
        };
        const defComeback = applyComebackRollMultipliersForSide(
            defUnits,
            attUnits,
            withSkills.defRoll,
            withSkills.attRoll,
            this.defenderTacticalTriggered,
        );
        withSkills = {
            attRoll: defComeback.opponentRoll,
            defRoll: defComeback.sideRoll,
        };

        const prevStronger = this.predictedStrongerGroup.factionId;
        this.applyPredictedSidesFromRoll(withSkills.attRoll, withSkills.defRoll);
        // 强弱可能翻转，威慑减免/节奏需跟随重算
        this.applyIntimidationModifiers();

        if (this.predictedStrongerGroup.factionId !== prevStronger) {
            gameLog(
                'battle',
                `[BattleField] 援军编入后强弱重算: ${this.predictedStrongerGroup.factionId} 占优 ` +
                `(有效战力 ${withSkills.attRoll.toFixed(0)} vs ${withSkills.defRoll.toFixed(0)}，` +
                `文化修正 ${attAdj.toFixed(0)} vs ${defAdj.toFixed(0)})`
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


        // ── 实时收敛 DPS + 动量拉锯 ──
        // 每帧按「(当前兵力 − 目标存活) / 剩余时间」算掉血：数学上保证时限内平滑收敛，
        // 无 60% 断崖；弱方目标=0，强方目标=存活地板，胜者仍锁定在 t=0。
        const strongerGroup = this.predictedStrongerGroup;
        const weakerGroup = this.predictedWeakerGroup;
        const strongerInitial = strongerGroup.initialTotalTroops;
        const weakerInitial = weakerGroup.initialTotalTroops;
        const ratio = Math.max(1, strongerInitial / Math.max(1, weakerInitial));

        const targetDuration = this.targetDuration;
        const timeLeft = Math.max(0.05, targetDuration - this.elapsed);

        // 强方存活地板：1:1 留 50%，10:1 留 95%；威慑优势再减免战损（保命核心）
        const strongerLossPercent = Math.max(0.05, 0.5 / ratio) * (1 - this.fearLossReduction);
        const strongerFloor = strongerInitial * (1 - strongerLossPercent);

        // 实时收敛速率：弱方→0，强方→存活地板
        const weakerBaseDPS = weakerGroup.totalTroops / timeLeft;
        const strongerBaseDPS = Math.max(0, strongerGroup.totalTroops - strongerFloor) / timeLeft;

        // 动量拉锯：三阶段包络 × 随机动量 → 对峙条来回晃（事件战斗跳过）
        if (!this.presetResult) {
            this.updateMomentum(deltaTime);
        }
        const envelope = this.presetResult ? 0 : this.getPhaseEnvelope();
        const swing = this.presetResult ? 0 : this.momentumValue * envelope * 0.55;
        // swing>0 强方冲击（弱方多掉、强方少掉）；swing<0 弱方反击。
        // 末段 envelope→0，swing 自然归零，与收敛加速不冲突。
        const weakerDamageBase = Math.max(0, weakerBaseDPS * deltaTime * (1 + swing));
        const strongerDamageBase = Math.max(0, strongerBaseDPS * deltaTime * (1 - swing * 0.4));

        const progress = this.elapsed / Math.max(1, targetDuration);

        let damageToAttackers: number;
        let damageToDefenders: number;

        if (strongerGroup === this.attackerGroup) {
            damageToDefenders = weakerDamageBase;
            damageToAttackers = strongerDamageBase;
        } else {
            damageToAttackers = weakerDamageBase;
            damageToDefenders = strongerDamageBase;
        }

        this.distributeDamage(this.defenderGroup, damageToDefenders);
        this.distributeDamage(this.attackerGroup, damageToAttackers);

        this.tickInvincibleStates();
        this.tryComebackTacticalSkills();

        if (Math.random() < 0.03) {
            gameLog('battleTick',
                `[BattleField] 攻方: ${this.attackerGroup.totalTroops.toFixed(0)} | ` +
                `守方: ${this.defenderGroup.totalTroops.toFixed(0)} | ` +
                `动量: ${swing.toFixed(2)} | 阶段: ${(progress * 100).toFixed(0)}%`);
        }
    }

    /**
     * 更新各组的总兵力统计
     */
    private scheduleInvincible(
        unit: IBattleUnit,
        startElapsed: number,
        durationSec: number,
    ): void {
        this.invincibleWindowByUnitId.set(unit.id, {
            start: startElapsed,
            until: startElapsed + durationSec,
        });
    }

    private tickInvincibleStates(): void {
        const all = [...this.attackerGroup.units, ...this.defenderGroup.units];
        for (const bu of all) {
            const win = this.invincibleWindowByUnitId.get(bu.unit.id);
            if (!win) continue;
            bu.unit.isInvincible = this.elapsed >= win.start && this.elapsed < win.until;
            if (this.elapsed >= win.until) {
                bu.unit.isInvincible = false;
                this.invincibleWindowByUnitId.delete(bu.unit.id);
            }
        }
    }

    private tryComebackTacticalSkills(): void {
        if (this.presetResult) return;

        const attUnits = this.attackerGroup.units
            .filter((bu) => !bu.isDefeated && bu.unit.troops > 0)
            .map((bu) => bu.unit);
        const defUnits = this.defenderGroup.units
            .filter((bu) => !bu.isDefeated && bu.unit.troops > 0)
            .map((bu) => bu.unit);

        const ctxBase = {
            battleElapsed: this.elapsed,
            scheduleInvincible: (unit: IBattleUnit, start: number, dur: number) =>
                this.scheduleInvincible(unit, start, dur),
            onSidesChanged: () => this.refreshPredictedSidesFromTotals(),
            emitUi: true,
        };

        tryApplyComebackTacticalForSide(
            attUnits,
            defUnits,
            this.attackerGroup.totalTroops,
            this.attackerGroup.initialTotalTroops,
            '攻方',
            {
                ...ctxBase,
                triggeredSkillIds: this.attackerTacticalTriggered,
            },
        );
        tryApplyComebackTacticalForSide(
            defUnits,
            attUnits,
            this.defenderGroup.totalTroops,
            this.defenderGroup.initialTotalTroops,
            '守方',
            {
                ...ctxBase,
                triggeredSkillIds: this.defenderTacticalTriggered,
            },
        );
    }

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

        // 跟拍军团胜负音效
        const followedId = getFollowedArmyId();
        if (followedId) {
            const isWinner = winnerGroup.units.some(u => u.unit.id === followedId);
            const isLoser = loserGroup.units.some(u => u.unit.id === followedId);
            if (isWinner) {
                audioManager.play('battle_victory');
            } else if (isLoser) {
                audioManager.play('battle_defeat');
            }
        }

        if (this.siegeCityId && BattleField.siegeVisualStopHandler) {
            BattleField.siegeVisualStopHandler(this.siegeCityId);
        }

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

        const recoveryRate = GameConfig.COMBAT.POST_BATTLE_RECOVERY_RATE;

        // 处理胜利方
        winnerGroup.units.filter(u => !u.isDefeated).forEach(bu => {
            const lost = bu.initialTroops - bu.unit.troops;
            const recovery = Math.floor(lost * recoveryRate);
            if (recovery > 0) {
                bu.unit.setTroops(bu.unit.troops + recovery);
                gameLog('battle', `🩹 [BattleField] ${bu.unit.name} 恢复 ${recovery} 伤兵（恢复率 ${recoveryRate}）`);
            }

            const strategicBonus = applyPostBattleStrategicBonus(bu.unit, this.type);
            if (strategicBonus > 0) {
                gameLog('battle', `🌾 [BattleField] ${bu.unit.name} 战略增兵 +${strategicBonus}`);
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
        if (this.siegeCityId && BattleField.siegeVisualStopHandler) {
            BattleField.siegeVisualStopHandler(this.siegeCityId);
        }
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

    /** 事件链预设胜负（事件写死或援军介入后锁定） */
    public getPresetResult(): 'attacker_win' | 'defender_win' | undefined {
        return this.presetResult;
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
        // refreshPredictedSidesFromTotals 已重算 fearDurationMult，重新套用节奏系数
        if (!this.customDuration) {
            this.targetDuration = clampBattleDurationSec(this.targetDuration * this.fearDurationMult);
        }

        tryEmitOpeningTacticalOnReinforcementJoin(
            unit,
            isAttacker,
            this.getAttackerUnits(),
            this.getDefenderUnits(),
            this.openingTacticalUiShown,
        );

        this.reconcileSiegeGarrisonBoostForJoinedUnit(unit, isAttacker);

        gameLog(
            'battle',
            `📯 [BattleField] ${unit.name}(${joinedTroops}) 加入${isAttacker ? '攻方' : '守方'}! ` +
            `【合兵一处】有效战力×${joinLuck.toFixed(2)}, 编组兵力→${group.initialTotalTroops}` +
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

    private getSiegeGarrisonCityEntity(): SiegeGarrisonBoostFields | null {
        if (!this.siegeCityId) return null;
        const cityUnit = this.defenderGroup.units.find((bu) => bu.unit.unitType === 'city')?.unit;
        return (cityUnit?.getEntity?.() as SiegeGarrisonBoostFields | undefined) ?? null;
    }

    private listDefenderLegionEntities(): Army[] {
        const out: Army[] = [];
        for (const bu of this.defenderGroup.units) {
            if (bu.unit.unitType !== 'legion' && bu.unit.unitType !== 'army') continue;
            const army = bu.unit.getEntity?.() as Army | undefined;
            if (army) out.push(army);
        }
        return out;
    }

    private reconcileSiegeGarrisonBoostWithDefenders(): void {
        const city = this.getSiegeGarrisonCityEntity();
        if (!city) return;
        reconcileSiegeGarrisonBoostWithLegions(city, this.listDefenderLegionEntities());
    }

    private reconcileSiegeGarrisonBoostForJoinedUnit(unit: IBattleUnit, isAttacker: boolean): void {
        if (isAttacker || !this.siegeCityId) return;
        if (unit.unitType !== 'legion' && unit.unitType !== 'army') return;
        const city = this.getSiegeGarrisonCityEntity();
        const army = unit.getEntity?.() as Army | undefined;
        if (!city || !army) return;
        if (!army.generalId && !army.isElite) return;
        reconcileSiegeGarrisonBoostWithLegion(city, army);
        gameLog(
            'battle',
            `🛡️ [BattleField] 守方援军 ${unit.name} 编入，城防临时将/精锐已与军团去重`,
        );
    }

    /**
     * 援军合兵一处：waveIndex≥1 时返回编入时掷定的 luck [0.8, 1.2]；主力返回 null。
     */
    public getReinforcementJoinLuck(unitId: string): number | null {
        if (this.getUnitWaveIndex(unitId) < 1) return null;
        const luck = this.reinforcementLuckByUnitId.get(unitId);
        return luck ?? null;
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
