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
 * 4. 援军编入后重算强弱（refreshPredictedSidesFromTotals：文化修正兵力 + 援军编入 luck + 武将技侧乘区）
 *    - 援军编入触发：不重掷侧 luck（确定性）
 *    - 逆局技触发（rollLuckOnRecompute=true）：每侧重掷一次 luck，使逆局翻盘概率化、与开局技平衡
 */

import { IBattleUnit, BattleType, UnitType } from './CombatSystem';
import type { CityType } from '../types/core';
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
    clampBattleDurationSec,
    GameConfig,
    rollCombatLuckMultiplier,
} from '../config/GameConfig';
import { sumCultureAdjustedTroops, getUnitBattlePowerMultiplier, getUnitEliteTier } from '../systems/CultureCombat';
import { getGeneralProfile, POST_BATTLE_RECOVERY_SKILL } from '../data/GeneralSkills';
import { COMEBACK_LUCK_RANGE, COMEBACK_LUCK_RANGE_GENERIC } from './TacticalConstants';
import {
    applyGeneralSkillSideRollMultipliers,
    applyOpeningTacticalPreRoll,
    applyOpeningTacticalToRolls,
    applyPostBattleStrategicBonus,
    applyPostBattleConscription,
    applyStrategicRollMultipliersOnly,
    applyComebackRollMultipliersForSide,
    tryApplyComebackTacticalForSide,
    tryEmitOpeningTacticalOnReinforcementJoin,
    resolveSideOpeningFateLuck,
    sideBasePower,
    getBattleTerrainKind,
    resolveSideMidBattleCasualtyReduction,
    resolvePostBattleCasualtyOutcome,
    applySkillCountersToUnits,
    setBattleTargetDurationForSkillUi,
    getSituationalSkillPool,
    getSkillSixClass,
    scheduleStalemateSkillShowcasePulses,
    setActiveOpeningPulseSink,
    resolveStalemateUiThresholdSec,
    dispatchOpeningSkillPulse,
    PHASE_STALEMATE_START,
    PHASE_COLLAPSE_START,
    type IOpeningPulseSink,
    type TacticalSkillTrigger,
    pickSideSkillGeneralUnit,
    canUnitUseGeneralSkills,
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

export class BattleField implements IOpeningPulseSink {
    public id: string;
    public isOver: boolean = false;
    /** 结算后的胜方势力（CombatUI 战报定格卡读取；未结算时为 null） */
    public winnerFactionId: string | null = null;
    public onBattleComplete?: (winnerFactionId: string) => void; // [NEW] Callback for event sequencing
    /** 攻城战守方 cityId（构造时锁定，结算后仍可读） */
    public readonly siegeCityId: string | null;
    /** 由 SiegeManager 注册：区域战 resolve 时必停火焰/齐射，不依赖 onBattleComplete 赋值时机。
     *  immediate=true 立刻清场（中止/换场/复国）；false 火焰淡出 + 据点延迟后渐变缩回（正常分出胜负）。
     *  restoreDelayMs：据点开始缩回的等待——跟拍战胜 0（立刻渐变）、跟拍战败 5s（切镜头，2026-08-04） */
    private static siegeVisualStopHandler: ((cityId: string, immediate: boolean, restoreDelayMs?: number) => void) | null = null;

    public static setSiegeVisualStopHandler(handler: ((cityId: string, immediate: boolean, restoreDelayMs?: number) => void) | null): void {
        BattleField.siegeVisualStopHandler = handler;
    }
    /** 援军编入本场区域战（用于跟随军团 UI） */
    public onReinforcementJoined?: (unit: IBattleUnit, isAttacker: boolean) => void;
    /** 脚本预设：覆盖战斗面板标题（如「祷余山之战」替代「汉大战匈奴」） */
    public customTitle?: string;

    public elapsed: number = 0;
    public type: BattleType;
    public targetDuration: number = 0; // [NEW] Public property
    /**
     * [2026-08-10 13 战术层固定时长] 非 null = 本场进了 13 战术层，时长固定为此值（秒），
     * 覆盖兵力比动态(10–30)、援军加时、导演时长。战术层的 delta 走**真实秒**（见 GameAppLoop），
     * 所以这里填 60 就是墙钟整 1 分钟，与游戏倍速无关。
     * 血条/三幕火/脉冲全部按 elapsed÷targetDuration 的比例算，自动铺满 60 秒，无需另调。
     */
    public sceneFixedDurationSec: number | null = null;

    /** 进 13 战术层时调用：把本场时长钉死为 sec 秒（立即生效，援军重算也改不动） */
    public applySceneFixedDuration(sec: number): void {
        this.sceneFixedDurationSec = sec;
        this.targetDuration = sec;
    }

    /**
     * [2026-08-11 13 v2 出兵口互攻] 13 期间引擎冻结标志。
     * true = 本场战斗完全由 13 演出（Scene13WarLayer）接管：update 不推进、不结算，
     * 胜负等演出判负后经 forceScene13Result 写回。8/9/10 永不置位，行为不变。
     */
    public scene13Frozen = false;

    /**
     * [2026-08-11 13 v2] 演出判负 → 写死胜负并立即结算（跳过八环推演，走 presetResult + forceResolve 通道）。
     * @param winnerTroops 演出里胜方**实际剩下的人数**。传了就写回胜方单位 ——
     *   🔴 不传的话 forceResolve 只清零败方、**胜方兵力原封不动**，
     *      于是屏幕上打到只剩两成、回大地图却还是满编（主人 2026-08-11 实锤「剩余兵力应该和战略地图一致」）。
     */
    public forceScene13Result(winner: 'attacker' | 'defender', winnerTroops?: number): void {
        this.scene13Frozen = false;
        this.presetResult = winner === 'attacker' ? 'attacker_win' : 'defender_win';
        this.scene13WinnerTroops = winnerTroops ?? null;
        this.forceResolve();
    }

    /** 演出胜方实际残兵（人）；null = 不写回（非 13 路径） */
    private scene13WinnerTroops: number | null = null;

    /**
     * [2026-08-11 13 v2] 给 13 演出的**每兵总加成**（攻/守各一个乘数，作用在伤害上）。
     *
     * 来源 = 八环有效战力比（`effectivePowerRatio`，在构造函数的 pickPredictedSides 里就算好了，
     * 冻结只挡 update 所以拿得到），**再把兵力除掉**——八环里已经含兵力，
     * 而 13 里兵力已经体现为精灵数量，不除就算两遍。
     * 除完剩下的是纯「非兵力优势」：将领、精锐、武将技、文化、命运运气。
     *
     * 🔴 [2026-08-13 修「名将优势兑现不了」，最终方案] k = sqrt(nonTroop) + 钳制 [0.85, 1.35]。
     *    sqrt 是**精确还原**：k² = nonTroop = 八环非兵力比（攻 ×k、守 ×1/k，实际伤害比 = k²）。
     *    病史：耶律大石（面板总×2.59 vs 1.48，非兵力优势 1.75）打十箭（STEPPE 纯骑 1 虎豹 + 5 突骑）输。
     *    ① 原钳制 ±15% 把 k 1.32 压到 1.15（白扔真实优势）；② 且 sqrt 真值 1.32 也赢不了纯突骑
     *    风筝守方（6 口三角 5 口突骑克制混编攻方，实测要 k≥1.5）——**根因是突骑风筝无解，不是公式**。
     *    曾试 ^0.75 超发（k² = nonTroop^1.5，1.75 兑现成 2.25）——全局拉大强弱差补单单位超模，
     *    被否：八环不诚实、悬念变少、突骑调平后超发残留。最终分两层修：
     *    ① 钳制放宽到 1.35（不再白扔真实优势；1.35² = 1.82，nonTroop ≤ 1.82 的仗全部精确兑现）；
     *    ② 突骑 kite 100→60（Scene13WarLayer，kite < 接战 65 = 被贴脸不能再后撤）——纯突骑守军
     *    不再能无视名将优势。实测 kite 60 不破坏「弓骑略强」：突骑打步兵照赢（损 ~75-82%）、
     *    被骑兵克照旧；混编攻 vs 纯突骑守 k=1.32 → 攻方 3/3 赢。纯 13 层，8/9/10 不读本函数。
     *
     * 🔴 [2026-08-19 主人改判：kite 60→70] 主人要「弓骑放一点风筝，不要站撸」。
     *    kite 60 的代价是弓骑**完全不放风筝**——60 < 接战 65，敌人先进近战开砍、弓骑才退，
     *    等于挨打后才后撤，观感上就是站着对砍。
     *    war_sim 实测（PAIR=cav,horse_archer / melee,horse_archer，BONUS=1.32，5 种子）：
     *      kite  60 → 骑兵克突骑余兵 24510 ｜ 步兵打突骑·突骑余兵 22232
     *      kite  66 → 18108 ｜ 27150      （← 断崖就在这里）
     *      kite  68 → 17752 ｜ 25830
     *      kite  70 → 18522 ｜ 27178
     *      kite  75 → 18866 ｜ 26636
     *    🔴 **60→66 是断崖，66 往上全是平的**：65 是近战接战距离，kite 越过它，风筝就从
     *    「完全不生效」变成「生效」，这是个二元开关；越过之后再往上加几乎不再变强。
     *    所以「只加一点点」和「加到位」代价完全一样，没有折中档 —— 取 70（与原型 __war.html 一致，
     *    风筝带更宽、观感更明显）。
     *    代价：骑兵克突骑的优势下降约 26%（克制方向不变，骑兵仍 5/5 赢）。
     *    要退回站撸把 Scene13WarLayer + scratch/war_sim.mjs 的 kite 全改回 60（两处必须同步）。
     */
    public getScene13PowerBonus(): { attacker: number; defender: number } {
        const attT = Math.max(1, this.attackerGroup.initialTotalTroops);
        const defT = Math.max(1, this.defenderGroup.initialTotalTroops);
        const nonTroop = this.effectivePowerRatio / (attT / defT);
        const k = Math.min(1.35, Math.max(0.85, Math.sqrt(Math.max(0.01, nonTroop))));
        return { attacker: k, defender: 1 / k };
    }

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
    /** 当前实际使用的 luck（开场 = 开局掷值；败战翻盘重掷后 = COMEBACK_LUCK_RANGE 区间值） */
    private attackerCurrentFateLuck = 1;
    private defenderCurrentFateLuck = 1;
    /** 引擎滚点时的兵力缓存（徽章用此算比，防战中兵力改变导致条件漂移） */
    private cachedAttackerTroops = 0;
    private cachedDefenderTroops = 0;
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
    // ── 战损系：强方战损减免，开战锁死 + 跟随强弱翻转重算 ──
    //  值随「谁是强方」在 recomputeStrongerCasualtyReduction 里更新，
    //  穷寇勿迫另在 update 里按弱方跌破 20% 锁存触发。
    private strongerCasualtyReduction: number = 0;
    /** 穷寇勿迫：弱方已跌破 20% 初始并触发过一次减损重算（锁存防抖，翻转时清） */
    private poorBanditLatched: boolean = false;
    attackerCommander: IBattleUnit | null = null;
    defenderCommander: IBattleUnit | null = null;
    /** 相持段（≈40% 时长）前排队、之后统一释放的开局战术脉冲 */
    private readonly openingPulseQueue: Array<{ trigger: TacticalSkillTrigger; audioUnitId?: string }> = [];
    private stalemateSkillUiReleased = false;
    /**
     * 开局定势时锁定的攻/守兵力比（削兵前），专供技能脉冲释放顺序。
     * 勿用释放时的 initialTotalTroops——开局削兵后会把均势误判成优劣。
     */
    private situationalAttDefRatio = 1;
    /**
     * 本场技能先放侧（开局锁定）：优劣→劣势方；均势→随机攻/守一侧。
     * 抽技顺序与亮相顺序共用，避免两处各掷一次不一致。
     */
    private skillPulseFirstSide: 'attacker' | 'defender' = 'attacker';
    /** 开战有效战力比（攻/守，六环乘完）；在 pickPredictedSides 中写入，供时长判定 */
    private effectivePowerRatio = 1;
    /** 最近一次逆局触发技是否在册——败战翻盘重掷按此选区间 */
    private comebackTriggerOwnerSkill = false;
    /** 本场是否由导演/剧本指定时长（指定则不套固定 30/9） */
    private hasDirectorDuration = false;
    /** [防重] 本场已用掉的技能 ID / 六计类别，开局与援军共用，保证攻守不撞技 */
    private usedBattleSkillIds: Set<string> = new Set();
    private usedBattleSixClasses: Set<string> = new Set();

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
        // 开局脉冲按本场时长比例后移：须在 pickPredictedSides（内部同步 emit 开局技能 UI）之前注入。
        // 注入估算最终时长供开局技能脉冲对齐（第一幕末 ≈40%）。
        // 注入与发射同 tick 同步完成，多场战斗并发也不会互相污染。
        setBattleTargetDurationForSkillUi(this.estimateSkillUiTargetDuration());
        // 三势适性：须在 pickPredictedSides 之前——先按兵力比给带将单位选局技，让开局脉冲/战力/卡片都用局技(否则局技未设,三处不一致且战力用招牌)
        this.assignSituationalSkills();
        // 锁定指挥官：assignSituationalSkills 已设局技，此后 pickSideSkillGeneralUnit 选的将是带着局技的单位
        this.attackerCommander = pickSideSkillGeneralUnit(attackerUnits);
        this.defenderCommander = pickSideSkillGeneralUnit(defenderUnits);
        this.pickPredictedSides();
        // 定强弱后重算战损减免
        this.recomputeStrongerCasualtyReduction();
        this.targetDuration = this.resolveFinalTargetDuration();
        // [2026-08-06 撤回挪位] 城防剥离保留在原时序（选技→锁将→定胜负→算时长之后）：
        //   挪到前面会改变 pickPredictedSides 与战斗时长看到的守方阵容（城防将/精提前被剥）= 改战斗结果，未量过，撤。
        //   治「守方只剩文化卡」由 UI 侧两道闸负责，不碰引擎时序：
        //   ① CombatUI.resolvePowerBadgeUnit 的 canUnitUseGeneralSkills 校验 ② BattleField.replaceCommanderIfInvalidated（援军入场后指挥官失效才补选）。
        //   ⚠️ 城防此时带着选技阶段写入的 battleOverriddenSkillId 残留——UI 选角被①挡住不会显示，引擎侧行为与修复前一致。
        this.reconcileSiegeGarrisonBoostWithDefenders();

        this.notifyBattleStart();

        gameLog('battle', `🏟️ [BattleField] 区域战斗开始!${presetResult ? ` [预设结果: ${presetResult}]` : ''}`);
        gameLog('battle', `   攻方 (${attackerFactionId}): ${attackerUnits.map(u => `${u.name}(${u.troops})`).join(', ')}`);
        gameLog('battle', `   守方 (${defenderFactionId}): ${defenderUnits.map(u => `${u.name}(${u.troops})`).join(', ')}`);
        gameLog('battle', `   ⏱️ 预计战斗时长: ${this.targetDuration.toFixed(1)}秒`);
    }

    /** 攻守双方各至少一侧有 generalId */
    public bothSidesHaveGeneral(): boolean {
        const attHasGen = this.attackerGroup.units.some((bu) => !!bu.unit.generalId);
        const defHasGen = this.defenderGroup.units.some((bu) => !!bu.unit.generalId);
        return attHasGen && defHasGen;
    }

    private durationFloorSec(): number {
        return this.bothSidesHaveGeneral()
            ? GameConfig.COMBAT.BATTLE_DURATION_MIN_RATIO_SEC
            : GameConfig.COMBAT.BATTLE_DURATION_PARTIAL_GENERAL_SEC;
    }

    /** 本场已编入的援军只数（waveIndex ≥ 1 = 援军波次，0 是初始主力） */
    private reinforcementCount(): number {
        let n = 0;
        for (const bu of this.attackerGroup.units) if (bu.waveIndex >= 1) n++;
        for (const bu of this.defenderGroup.units) if (bu.waveIndex >= 1) n++;
        return n;
    }

    /**
     * 双将战时长上限（钳制用）：30 秒基础 + 每只援军 10 秒（攻守双方都算），封顶 60 秒。
     * 实际时长走 ratioBasedDurationSec（兵力比动态 10–30s + 援军加时）。
     */
    private bothGeneralsDurationSec(): number {
        const c = GameConfig.COMBAT;
        const raw = c.BATTLE_DURATION_BOTH_GENERALS_SEC
            + this.reinforcementCount() * c.BATTLE_DURATION_REINFORCEMENT_BONUS_SEC;
        return Math.min(c.BATTLE_DURATION_MAX_SEC, raw);
    }

    /**
     * 双将战时长（2026-08-04 主人定：按兵力比动态 10–30 秒，取代固定 30 秒）：
     *   兵力比 1:1 → 30 秒（均势拉锯满时长）
     *   兵力每翻一倍 → −6.7 秒；≥8:1 → 贴 10 秒地板
     *   再叠加援军加时（每只 +10s），封顶 60 秒
     */
    private ratioBasedDurationSec(): number {
        const c = GameConfig.COMBAT;
        const att = this.attackerGroup.totalTroops;
        const def = this.defenderGroup.totalTroops;
        const ratio = Math.max(att, def) / Math.max(1, Math.min(att, def));
        const span = c.BATTLE_DURATION_BOTH_GENERALS_SEC - c.BATTLE_DURATION_MIN_RATIO_SEC;
        const base = c.BATTLE_DURATION_BOTH_GENERALS_SEC
            - span * Math.min(1, Math.log2(Math.max(1, ratio)) / 3);
        const raw = base + this.reinforcementCount() * c.BATTLE_DURATION_REINFORCEMENT_BONUS_SEC;
        return Math.min(c.BATTLE_DURATION_MAX_SEC, raw);
    }

    /** 开局脉冲用：双将按基础时长、否则固定 9 秒 */
    private estimateSkillUiTargetDuration(): number {
        if (!this.bothSidesHaveGeneral()) {
            return GameConfig.COMBAT.BATTLE_DURATION_PARTIAL_GENERAL_SEC;
        }
        return this.clampDuration(this.targetDuration);
    }

    /**
     * 定强弱后敲定时长：
     *   双将战   → 兵力比动态 30–60 秒 + 每只援军 10 秒（攻守双方都算），封顶 90 秒
     *   其余一切 → 固定 9 秒
     *   导演指定 → 尊重剧本，只钳制（上限跟着援军放宽，不强行抬高剧本时长）
     */
    private resolveFinalTargetDuration(): number {
        // [2026-08-10 13 战术层固定时长] 主人定：进 13 的战斗固定打满 1 分钟。
        // 放在最前面拦截，援军入场重算（enrollUnit 里的 resolveFinalTargetDuration）也钉不动它。
        if (this.sceneFixedDurationSec !== null) return this.sceneFixedDurationSec;
        if (!this.bothSidesHaveGeneral()) {
            return GameConfig.COMBAT.BATTLE_DURATION_PARTIAL_GENERAL_SEC;
        }
        if (this.hasDirectorDuration) {
            return this.clampDuration(this.targetDuration);
        }
        const seconds = this.ratioBasedDurationSec();
        const c = GameConfig.COMBAT;
        const att = this.attackerGroup.totalTroops;
        const def = this.defenderGroup.totalTroops;
        const ratio = Math.max(att, def) / Math.max(1, Math.min(att, def));
        const reinforcements = this.reinforcementCount();
        gameLog(
            'battle',
            reinforcements > 0
                ? `⚔️ [BattleField] 双将战 → ${seconds}s（兵力比 ${ratio.toFixed(2)}:1 基础 ${(seconds - reinforcements * c.BATTLE_DURATION_REINFORCEMENT_BONUS_SEC).toFixed(1)}s + 援军 ${reinforcements} 只 ×${c.BATTLE_DURATION_REINFORCEMENT_BONUS_SEC}s）`
                : `⚔️ [BattleField] 双将战 → ${seconds}s（兵力比 ${ratio.toFixed(2)}:1，10–30s 动态）`,
        );
        return seconds;
    }

    private clampDuration(seconds: number): number {
        return clampBattleDurationSec(seconds, this.durationFloorSec(), this.bothGeneralsDurationSec());
    }

    private calculateTargetDuration() {
        // 导演时长：尊重事件配置，只钳制（不强制有将地板，避免剧本短战被抬）
        if (this.customDuration !== undefined && this.customDuration > 0) {
            this.hasDirectorDuration = true;
            const ceil = this.bothGeneralsDurationSec();
            this.targetDuration = clampBattleDurationSec(this.customDuration, undefined, ceil);
            gameLog('battle', `🎬 [BattleField] 导演时长: ${this.targetDuration.toFixed(1)}s (钳制 ${GameConfig.COMBAT.BATTLE_DURATION_PARTIAL_GENERAL_SEC}–${ceil})`);
            return;
        }

        // 并非双方都有将（纯兵 / 一方有将）→ 固定 9 秒
        if (!this.bothSidesHaveGeneral()) {
            this.targetDuration = GameConfig.COMBAT.BATTLE_DURATION_PARTIAL_GENERAL_SEC;
            gameLog('battle', `⚔️ [BattleField] 非双将战 → ${this.targetDuration}s`);
            return;
        }

        this.targetDuration = this.bothGeneralsDurationSec();
        gameLog('battle', `⚔️ [BattleField] 双将战 → ${this.targetDuration}s`);
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





    /**
     * 重算强方战损减免（战损系 win_casualty_reduction / elite_casualty_reduction）。
     * 用实时兵力求值以支持穷寇勿迫（弱方跌破 20% 初始）；由强弱重算 + update 锁存触发，
     * 与 strongerCasualtyReduction 叠乘作用于 update 的 strongerLossPercent。
     */
    private recomputeStrongerCasualtyReduction(): void {
        if (this.presetResult) { this.strongerCasualtyReduction = 0; return; }
        const stronger = this.predictedStrongerGroup;
        const weaker = this.predictedWeakerGroup;
        const strongerUnits = stronger.units
            .filter(bu => !bu.isDefeated && bu.unit.troops > 0)
            .map(bu => bu.unit);
        const weakerUnits = weaker.units
            .filter(bu => !bu.isDefeated && bu.unit.troops > 0)
            .map(bu => bu.unit);
        if (strongerUnits.length === 0) { this.strongerCasualtyReduction = 0; return; }
        const terrain = getBattleTerrainKind([...strongerUnits, ...weakerUnits], this.type);
        const res = resolveSideMidBattleCasualtyReduction(
            strongerUnits,
            weakerUnits,
            this.type,
            terrain,
            stronger === this.attackerGroup,
            { enemyTroops: weaker.totalTroops, enemyInitialTroops: Math.max(1, weaker.initialTotalTroops) },
            stronger === this.attackerGroup ? this.attackerCommander : this.defenderCommander,
        );
        // 并战计·劣势方获胜：初始兵力少的一方赢了，减己损翻倍
        let reduction = res.lossReduction;
        if (reduction > 0 && stronger.initialTotalTroops < weaker.initialTotalTroops) {
            reduction = Math.min(0.9, reduction * 2.0);
            gameLog('battle', `[并战计] 劣势方获胜！减己损翻倍 ${(res.lossReduction*100).toFixed(0)}%→${(reduction*100).toFixed(0)}%`);
        }
        this.strongerCasualtyReduction = reduction;
    }

    /**
     * 从候选池抽一技：全场六计硬分开（一边已是败战，另一边不得再败战；胜战等同理）。
     * pool 已由上游 getSituationalSkillPool 排除过已用技能 ID，此处只需避让已用六计类别。
     */
    private pickSkillAvoidingUsedSixClass(
        pool: string[],
        usedSixClasses: Set<string>,
        logLabel: string,
    ): string | undefined {
        if (pool.length === 0) return undefined;
        const clsOf = (id: string) => getSkillSixClass(id) ?? `__nocls__${id}`;
        const roll = (ids: string[]) => ids[Math.floor(Math.random() * ids.length)];

        // 优先：六计类别没被用过的候选
        const candidates = pool.filter(id => !usedSixClasses.has(clsOf(id)));
        if (candidates.length > 0) return roll(candidates);

        // 兜底：池里剩下的技能都会六计撞车，随便抽一个并打警告
        const pick = roll(pool);
        gameLog('battle', `⚠️ [六计] ${logLabel} 池内无剩余六计可错开，只能与已出场计撞车：${pick}（${clsOf(pick)}）`);
        return pick;
    }

    /**
     * 六计随机：开局定强弱后，给每个带将单位从**三势选池**随机抽一个局技，写入 battleOverriddenSkillId。
     * [2026-08-06 改注释] 原写「从攻/守三槽随机抽」——六槽 2026-08-04 起已不驱动选技（AGENTS.md 铁律一），
     * 现在的池 = 当前势对应六计的全部不在册通用技 + 本人专属在册技，见 getSituationalSkillPool。
     * 阈值：文化修正后有效兵力比 >1.5 优势 / <0.67 劣势 / 其间均势。
     * 同时锁定 situationalAttDefRatio 与 skillPulseFirstSide（劣先；均势随机）。
     */
    private assignSituationalSkills(): void {
        // 【2026-08-16 用户指令】单方有将不放技能：仅双方都有武将才分配战术技能
        if (!this.bothSidesHaveGeneral()) {
            return;
        }

        const attUnits = this.attackerGroup.units.filter(bu => !bu.isDefeated && bu.unit.troops > 0).map(bu => bu.unit);
        const defUnits = this.defenderGroup.units.filter(bu => !bu.isDefeated && bu.unit.troops > 0).map(bu => bu.unit);
        const at = sumCultureAdjustedTroops(attUnits) || this.attackerGroup.initialTotalTroops;
        const dt = sumCultureAdjustedTroops(defUnits) || this.defenderGroup.initialTotalTroops;
        this.situationalAttDefRatio = at / Math.max(1, dt);

        // [防重 2026-07-27；六计硬分开 2026-08-05] 全场带将依次挑技：后挑避已用技能 ID + 六计类别。
        // 不再「次选允许六计撞车」——避免攻守双方都出败战/胜战。
        const situationOf = (self: number, other: number): 'advantage' | 'balance' | 'disadvantage' => {
            const r = self / Math.max(1, other);
            return r > 1.5 ? 'advantage' : r < 0.67 ? 'disadvantage' : 'balance';
        };
        const attSit = situationOf(at, dt);
        const defSit = situationOf(dt, at);

        // 先放侧：优劣→劣势；均势→随机（与亮相同锁）
        if (attSit === 'disadvantage') {
            this.skillPulseFirstSide = 'attacker';
        } else if (defSit === 'disadvantage') {
            this.skillPulseFirstSide = 'defender';
        } else {
            this.skillPulseFirstSide = Math.random() < 0.5 ? 'attacker' : 'defender';
        }

        const usedSkillIds = new Set<string>();
        const usedSixClasses = new Set<string>();

        const assignSide = (units: typeof this.attackerGroup.units, sit: 'advantage' | 'balance' | 'disadvantage', sideName: string) => {
            for (const bu of units) {
                const u = bu.unit;
                if (!u.generalId) continue;

                const pool = getSituationalSkillPool(u, sit as any, [...usedSkillIds]);
                const pick = this.pickSkillAvoidingUsedSixClass(
                    pool,
                    usedSixClasses,
                    `${sideName} ${u.generalId}`,
                );
                if (!pick) continue;

                u.battleOverriddenSkillId = pick;
                usedSkillIds.add(pick);
                usedSixClasses.add(getSkillSixClass(pick) ?? `__nocls__${pick}`);
            }
        };

        // 与脉冲亮相顺序一致：先放侧先抽技（六计选择面更广）
        if (this.skillPulseFirstSide === 'attacker') {
            assignSide(this.attackerGroup.units, attSit, '攻方');
            assignSide(this.defenderGroup.units, defSit, '守方');
        } else {
            assignSide(this.defenderGroup.units, defSit, '守方');
            assignSide(this.attackerGroup.units, attSit, '攻方');
        }

        this.usedBattleSkillIds = usedSkillIds;
        this.usedBattleSixClasses = usedSixClasses;
    }

    /** 技能脉冲先放哪一侧：开局已锁定（劣先；均势随机） */
    private resolveSkillPulseFirstSide(): 'attacker' | 'defender' {
        return this.skillPulseFirstSide;
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
        setActiveOpeningPulseSink(this);
        try {
            const attAdj = sumCultureAdjustedTroops(attUnits);
            const defAdj = sumCultureAdjustedTroops(defUnits);
            const terrain = getBattleTerrainKind([...attUnits, ...defUnits], this.type);

            // [对抗系] 战前拦截：否决或夺取敌方战术技
            applySkillCountersToUnits(attUnits, defUnits, this.type, terrain);

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
                { battleType: this.type, terrain },
            );
            this.updateGroupStats();
            this.attackerGroup.initialTotalTroops = this.attackerGroup.totalTroops;
            this.defenderGroup.initialTotalTroops = this.defenderGroup.totalTroops;
            // 缓存滚点时的总兵力，供徽章计算势比（防战中兵力改变导致条件漂移）
            this.cachedAttackerTroops = this.attackerGroup.totalTroops;
            this.cachedDefenderTroops = this.defenderGroup.totalTroops;

            const attFate = resolveSideOpeningFateLuck(
                attUnits, defUnits, this.type, terrain, true,
                { emitUi: true, openingUiShown: this.openingTacticalUiShown },
            );
            const defFate = resolveSideOpeningFateLuck(
                defUnits, attUnits, this.type, terrain, false,
                { emitUi: true, openingUiShown: this.openingTacticalUiShown },
            );
            this.attackerCurrentFateLuck = attFate.luck;
            this.defenderCurrentFateLuck = defFate.luck;
            const attRoll = sideBasePower(attUnits) * attFate.luck;
            const defRoll = sideBasePower(defUnits) * defFate.luck;
            const strategic = applyGeneralSkillSideRollMultipliers(
                attUnits,
                defUnits,
                attRoll,
                defRoll,
                this.type,
                { openingUiShown: this.openingTacticalUiShown },
                this.attackerCommander,
                this.defenderCommander,
            );
            gameLog(
                'battle',
                `[BattleField] 掷色: 攻有效 ${strategic.attRoll.toFixed(0)} vs 守有效 ${strategic.defRoll.toFixed(0)} ` +
                `(文化修正后 ${attAdj.toFixed(0)} vs ${defAdj.toFixed(0)}，` +
                `原兵力 ${this.attackerGroup.initialTotalTroops} vs ${this.defenderGroup.initialTotalTroops}，含命运系 luck)`
            );
            this.applyPredictedSidesFromRoll(strategic.attRoll, strategic.defRoll);
        } finally {
            setActiveOpeningPulseSink(null);
        }
    }

    private applyPredictedSidesFromRoll(attRoll: number, defRoll: number): void {
        // 八环乘完后的有效战力比，供时长判定用（兵力比不够准：兵力只是八环之一）
        this.effectivePowerRatio = attRoll / Math.max(1, defRoll);
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
    private refreshPredictedSidesFromTotals(rollLuckOnRecompute = false): void {
        if (this.presetResult) return;

        const attUnits = this.attackerGroup.units
            .filter((bu) => !bu.isDefeated && bu.unit.troops > 0)
            .map((bu) => bu.unit);
        const defUnits = this.defenderGroup.units
            .filter((bu) => !bu.isDefeated && bu.unit.troops > 0)
            .map((bu) => bu.unit);

        // 缓存当前滚点用的总兵力（refresh 时用当前值，徽章保持一致）
        this.cachedAttackerTroops = attUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
        this.cachedDefenderTroops = defUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);

        const terrain = getBattleTerrainKind([...attUnits, ...defUnits], this.type);
        // 翻盘重掷：区间按触发技在册/不在册分档（在册 [0.25,0.45] 更宽，通用 [0.30,0.40] 更平庸）
        const rollComebackLuck = (): number => {
            const range = COMEBACK_LUCK_RANGE; // 统一区间，不再分在册/不在册
            return range[0] + Math.random() * (range[1] - range[0]);
        };
        const attFateLuck = rollLuckOnRecompute
            ? rollComebackLuck()
            : this.attackerCurrentFateLuck;
        const defFateLuck = rollLuckOnRecompute
            ? rollComebackLuck()
            : this.defenderCurrentFateLuck;
        // 同步当前 luck，供战斗面板 badge 读取（败战翻盘后不再是开局值）
        this.attackerCurrentFateLuck = attFateLuck;
        this.defenderCurrentFateLuck = defFateLuck;

        const attAdj = this.adjustedPowerWithReinforcement(this.attackerGroup) * attFateLuck;
        const defAdj = this.adjustedPowerWithReinforcement(this.defenderGroup) * defFateLuck;
        // [修复] 名将开局掷点 ③④⑤ 在 refresh 时也要保留（emitUi=false 不重发徽章）。
        // 否则普将逆局触发后重判强弱时，名将的掷点优势被抹掉，③④⑤ 对 ⑥ 沦为五五开。
        const reopened = applyOpeningTacticalToRolls(
            attUnits,
            defUnits,
            attAdj,
            defAdj,
            false,
            undefined,
            { battleType: this.type, terrain },
            this.attackerCommander,
            this.defenderCommander,
        );
        let withSkills = applyStrategicRollMultipliersOnly(
            attUnits,
            defUnits,
            reopened.attRoll,
            reopened.defRoll,
            this.type,
        );
        const attComeback = applyComebackRollMultipliersForSide(
            attUnits,
            defUnits,
            withSkills.attRoll,
            withSkills.defRoll,
            this.attackerTacticalTriggered,
            this.attackerCommander,
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
            this.defenderCommander,
        );
        withSkills = {
            attRoll: defComeback.opponentRoll,
            defRoll: defComeback.sideRoll,
        };

        // 【2026-07-03】逆局翻盘的重掷 luck 已上移到 base（attAdj/defAdj 已乘 attFateLuck/defFateLuck）：
        //   rollLuckOnRecompute=true 时按命运技区间重掷、否则回放开战值，此处不再二次掷 luck。

        const prevStronger = this.predictedStrongerGroup.factionId;
        this.applyPredictedSidesFromRoll(withSkills.attRoll, withSkills.defRoll);
        // 强弱可能翻转，战损减免需跟随重算
        this.recomputeStrongerCasualtyReduction();

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

    /** 开战战术脉冲入队：等游戏内 elapsed 达相持段阈值再统一释放 */
    public queueOpeningSkillPulse(trigger: TacticalSkillTrigger, audioUnitId?: string): void {
        if (!this.bothSidesHaveGeneral()) return;
        this.openingPulseQueue.push({ trigger, audioUnitId });
    }

    /**
     * 相持第二幕（≈ targetDuration×40%）释放已排队脉冲；战斗 UI 晚开时由 showRegional 补调。
     */
    public tryReleaseStalemateSkillUi(): void {
        if (!this.bothSidesHaveGeneral()) return;
        if (this.stalemateSkillUiReleased || this.isOver) return;
        const threshold = resolveStalemateUiThresholdSec(this.targetDuration);
        if (this.elapsed < threshold) return;

        this.stalemateSkillUiReleased = true;
        const firstSide = this.resolveSkillPulseFirstSide();
        // 一将一战一技：该侧已有存活武将的机制/援军脉冲在队 → 不再排保底亮相
        // （防援军换将后同侧双 Cut-in；已阵亡武将的脉冲会被 CombatUI 按异场丢弃，不占名额）
        const queuedSides = { attacker: false, defender: false };
        for (const item of this.openingPulseQueue) {
            const uid = item.audioUnitId;
            if (!uid) continue;
            const attBu = this.attackerGroup.units.find((bu) => bu.unit.id === uid);
            const defBu = attBu
                ? undefined
                : this.defenderGroup.units.find((bu) => bu.unit.id === uid);
            const bu = attBu ?? defBu;
            if (!bu || bu.isDefeated || bu.unit.isDestroyed) continue;
            if (attBu) queuedSides.attacker = true;
            else queuedSides.defender = true;
        }
        setActiveOpeningPulseSink(this);
        // 保底亮相也按「先放侧」入队，与下方排序一致
        scheduleStalemateSkillShowcasePulses(
            this.getAttackerUnits(),
            this.getDefenderUnits(),
            firstSide,
            queuedSides,
            this.openingTacticalUiShown,
        );
        setActiveOpeningPulseSink(null);

        // 脉冲/播报顺序：开局锁定（劣先；均势随机）；勿用削兵后兵力重判
        const attGeneralIds = new Set(
            this.getAttackerUnits().map((u) => u.generalId).filter((id): id is string => !!id),
        );
        const sideRank = (generalId: string): number => {
            const isAtt = !!generalId && attGeneralIds.has(generalId);
            const side: 'attacker' | 'defender' = isAtt ? 'attacker' : 'defender';
            return side === firstSide ? 0 : 1;
        };
        const ordered = [...this.openingPulseQueue].sort(
            (a, b) => sideRank(a.trigger.generalId) - sideRank(b.trigger.generalId),
        );
        const sitLabel =
            this.situationalAttDefRatio > 1.5 || this.situationalAttDefRatio < 0.67
                ? '劣先'
                : '均势随机';
        gameLog(
            'battle',
            `✨ [SkillPulse] 释放顺序: ${firstSide === 'attacker' ? '攻方' : '守方'}先` +
                `（开局兵力比攻/守=${this.situationalAttDefRatio.toFixed(2)}，${sitLabel}）` +
                ` → ${ordered.map((o) => o.trigger.generalId || '?').join(' → ')}`,
        );
        for (const item of ordered) {
            dispatchOpeningSkillPulse(item.trigger, item.audioUnitId);
        }
        this.openingPulseQueue.length = 0;
    }

    /**
     * 每帧更新战斗
     */
    public update(deltaTime: number): void {
        if (this.isOver) return;

        // [2026-08-11 13 v2] 13 演出接管：引擎不推进不结算（胜负由演出判负写回）。
        // 🔴 [2026-08-16 主人取消时间限制] 去掉 120s 看门狗——演出自然打到全军覆没才判负，
        //    引擎一直冻结，直到 forceScene13Result 解冻结算。永久冻结的兜底仍在：
        //    BattleSceneLayer.unfreezeScene13Battle（退场解冻）+ Scene13WarLayer 自身防死锁（素材 10s/无回调）。
        if (this.scene13Frozen) {
            return;
        }

        // deltaTime = gameDelta（GameApp 已乘 timeScale）
        this.elapsed += deltaTime;
        this.tryReleaseStalemateSkillUi();

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
            gameLog('battle', `🏯 [BattleField] Siege target ${mainDefender.unit.name} is now friendly to attackers. Ending battle.`);
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

        // 穷寇勿迫（战损系）：弱方跌破 20% 初始 → 触发一次强方减损重算并锁存（防每帧重算）
        if (!this.poorBanditLatched && weakerInitial > 0 && weakerGroup.totalTroops < 0.2 * weakerInitial) {
            this.poorBanditLatched = true;
            this.recomputeStrongerCasualtyReduction();
        }

        // 强方存活地板：1:1 留 50%，10:1 留 95%；战损系减损再抬高存活
        const strongerLossPercent =
            Math.max(0.05, 0.5 / ratio) * (1 - this.strongerCasualtyReduction);
        const strongerFloor = strongerInitial * (1 - strongerLossPercent);

        // 实时收敛速率：弱方→0，强方→存活地板
        const weakerBaseDPS = weakerGroup.totalTroops / timeLeft;
        const strongerBaseDPS = Math.max(0, strongerGroup.totalTroops - strongerFloor) / timeLeft;

        const progress = this.elapsed / Math.max(1, targetDuration);

        // 动量拉锯（用户 2026-07-08 定，对峙条来回晃，纯视觉不改胜负；事件战斗跳过）：
        //   摆动包络「前期最大 → 末期收窄」——一开打就大幅拉锯、胜负难料（= 相持）；
        //   随进度天平定向、摆动收窄（= 胜负渐明）。与 getPhaseEnvelope 的「开局渐入」相反：
        //   观众要开局就摇摆，不要慢慢起。末期 (1-progress)^0.7 → 0，与收敛加速不冲突。
        if (!this.presetResult) {
            this.updateMomentum(deltaTime);
        }
        const clampedProgress = Math.min(1, Math.max(0, progress));
        const swingEnvelope = this.presetResult ? 0 : Math.pow(1 - clampedProgress, 0.7);
        const swing = this.presetResult ? 0 : this.momentumValue * swingEnvelope * 0.85;

        // 三阶段战损节奏（12+12+6 @ 30s，40/40/20）：
        //   第一阶段(<40%)：胶着慢打 → 开战播报；
        //   第二阶段(40%~80%)：技能脉冲 + 战损加速；
        //   第三阶段(最后20%)：溃败收敛。
        //   总时长与胜负不受影响。
        const phase2Span = PHASE_COLLAPSE_START - PHASE_STALEMATE_START;
        const pacing = this.presetResult
            ? 1
            : progress < PHASE_STALEMATE_START
                ? 0.45
                : progress < PHASE_COLLAPSE_START
                    ? 0.45 + 0.55 * ((progress - PHASE_STALEMATE_START) / phase2Span)
                    : 1;

        // swing>0 强方冲击（弱方多掉、强方少掉）；swing<0 弱方反击。
        // 末段 envelope→0，swing 自然归零，与收敛加速不冲突。
        const weakerDamageBase = Math.max(0, weakerBaseDPS * deltaTime * pacing * (1 + swing));
        const strongerDamageBase = Math.max(0, strongerBaseDPS * deltaTime * pacing * (1 - swing * 0.4));

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
            onSidesChanged: (opts?: { ownerSkill?: boolean }) => {
                // 败战翻盘重掷区间按触发技在册/不在册分档
                this.comebackTriggerOwnerSkill = opts?.ownerSkill ?? false;
                this.refreshPredictedSidesFromTotals(true);
            },
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
            this.attackerCommander,
            this.defenderCommander,
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
            this.defenderCommander,
            this.attackerCommander,
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
        this.winnerFactionId = winnerGroup.factionId;

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

        // 攻城据点缩回（仅跟拍场会放大，故以跟拍胜负为准）：
        // 跟拍战胜 → 立刻开始 CSS 渐变缩小；跟拍战败 → 干等 5s 再缩（切镜头，2026-08-04）
        if (this.siegeCityId && BattleField.siegeVisualStopHandler) {
            const followedLost = !!followedId
                && loserGroup.units.some(u => u.unit.id === followedId);
            BattleField.siegeVisualStopHandler(this.siegeCityId, false, followedLost ? 5000 : 0);
        }

        gameLog('battle', `🏆 [BattleField] 战斗结束! 胜者: ${winnerGroup.factionId}`);

        // ── 战损系（Step2）：清零败方【之前】捕获战损结算（败方 destroy 后残兵归零，判据用开战兵）──
        //   契约顺序：①斩根(恢复归零) → ②恢复 → ③咬人 → ④胜方保底 10% 初始兵。
        //   事件战斗（presetResult）与开局/逆局/威慑一致：整套战损技跳过，走默认恢复率。
        let casualtyOutcome: ReturnType<typeof resolvePostBattleCasualtyOutcome> = {
            recoveryRate: GameConfig.COMBAT.POST_BATTLE_RECOVERY_RATE,
            biteWinnerLossMult: 1,
            recoveryBlocked: false,
        };
        if (!this.presetResult) {
            const casualtyTerrain = getBattleTerrainKind(
                [...winnerGroup.units, ...loserGroup.units].map(bu => bu.unit),
                this.type,
            );
            casualtyOutcome = resolvePostBattleCasualtyOutcome(
                winnerGroup.units.map(bu => bu.unit),
                loserGroup.units.map(bu => bu.unit),
                this.type,
                casualtyTerrain,
                winnerGroup === this.attackerGroup,
                GameConfig.COMBAT.POST_BATTLE_RECOVERY_RATE,
                Math.max(1, winnerGroup.initialTotalTroops),
                Math.max(1, loserGroup.initialTotalTroops),
                winnerGroup === this.attackerGroup ? this.attackerCommander : this.defenderCommander,
                winnerGroup === this.attackerGroup ? this.defenderCommander : this.attackerCommander,
            );
        }
        if (casualtyOutcome.recoveryBlocked) {
            gameLog('battle', `🥀 [战损] ${casualtyOutcome.blockEntry?.displayName ?? '斩草除根'}：${winnerGroup.factionId} 胜方战后恢复归零`);
        }
        if (casualtyOutcome.biteWinnerLossMult > 1) {
            gameLog('battle', `🦂 [战损] ${casualtyOutcome.biteEntry?.displayName ?? '咬人'}：胜方本场战损 ×${casualtyOutcome.biteWinnerLossMult}`);
        }

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

        const recoveryRate = casualtyOutcome.recoveryRate;
        const biteMult = casualtyOutcome.biteWinnerLossMult;

        // 处理胜利方
        winnerGroup.units.filter(u => !u.isDefeated).forEach(bu => {
            const lost = Math.max(0, bu.initialTroops - bu.unit.troops); // 本场战损（恢复/咬人前）
            const recovery = Math.floor(lost * recoveryRate);           // ②恢复（斩根时 rate=0）
            const extraBite = biteMult > 1 ? Math.floor(lost * (biteMult - 1)) : 0; // ③咬人追加扣兵
            const survivalFloor = Math.floor(bu.initialTroops * 0.10);  // ④胜方保底 10% 初始兵
            let finalTroops = bu.unit.troops + recovery - extraBite;
            // 保底只防「被咬穿」；无咬人时不得白送兵（自然战损低于 10% 是收敛模型的事）
            if (extraBite > 0 && finalTroops < survivalFloor) finalTroops = survivalFloor;
            if (finalTroops !== bu.unit.troops) {
                bu.unit.setTroops(finalTroops);
            }
            if (recovery > 0) {
                gameLog('battle', `🩹 [${POST_BATTLE_RECOVERY_SKILL.displayName}] ${bu.unit.name} 伤兵归队 ${recovery}（恢复率 ${recoveryRate}）`);
            }
            if (extraBite > 0) {
                gameLog('battle', `🦂 [BattleField] ${bu.unit.name} 被咬 -${extraBite}（保底存活 ${survivalFloor}）`);
            }

            const siegeCity = this.getSiegeGarrisonCityEntity();
            const defenderCityType = (siegeCity as { type?: CityType } | null)?.type ?? null;
            const strategicBonus = applyPostBattleStrategicBonus(
                bu.unit,
                this.type,
                loserGroup.initialTotalTroops,
                defenderCityType,
                winnerGroup === this.attackerGroup,
            );
            if (strategicBonus > 0) {
                gameLog('battle', `🌾 [BattleField] ${bu.unit.name} 战略增兵 +${strategicBonus}`);
            }

            // 找一个失败方单位作为对手
            const opponent = loserGroup.units[0]?.unit;
            if (opponent) {
                bu.unit.onBattleEnd?.('victory', opponent, 0);
            }
        });

        // 整编归伍（全员通用，静默）：收编败军，以少胜多×2；全侧分摊 + 统一封顶军团上限
        // （封顶同时兜底上面招降纳叛等逐将加兵的溢出）。以少胜多按开战兵力口径判定。
        if (!this.presetResult) {
            const isUnderdogWin =
                winnerGroup.initialTotalTroops < loserGroup.initialTotalTroops;
            const conscripted = applyPostBattleConscription(
                winnerGroup.units.filter(bu => !bu.isDefeated).map(bu => bu.unit),
                loserGroup.initialTotalTroops,
                isUnderdogWin,
            );
            if (conscripted > 0) {
                gameLog('battle', `🪖 [整编归伍] ${winnerGroup.factionId} 收编败军 ${conscripted}${isUnderdogWin ? '（以少胜多×2）' : ''}`);
            }
        }

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

        // [2026-08-11 13 v2] 胜方按演出实际残兵写回，让大地图和你在 13 里看到的一致。
        // 多支部队（含援军）按各自当前兵力**等比例**分摊，至少留 1 人不至于把胜方也抹掉。
        if (this.scene13WinnerTroops !== null) {
            const alive = winnerGroup.units.filter(u => !u.isDefeated && u.unit.troops > 0);
            const before = alive.reduce((sum, u) => sum + u.unit.troops, 0);
            const target = Math.max(1, Math.round(this.scene13WinnerTroops));
            if (before > 0 && target < before) {
                const k = target / before;
                let given = 0;
                alive.forEach((u, i) => {
                    const t = (i === alive.length - 1)
                        ? Math.max(1, target - given)             // 最后一支吃掉取整误差
                        : Math.max(1, Math.round(u.unit.troops * k));
                    given += t;
                    u.unit.setTroops(t);
                });
                gameLog('battle', `🩸 [BattleField] 13 演出残兵写回：胜方 ${before} → ${target}`);
            }
            this.scene13WinnerTroops = null;
        }

        // 调用原有结算
        this.resolve(winnerGroup, loserGroup);
    }

    /** 复国/政变等外部事件：终止战场但不结算胜负、不销毁单位 */
    public abortWithoutSettlement(): void {
        if (this.isOver) return;
        this.isOver = true;
        if (this.siegeCityId && BattleField.siegeVisualStopHandler) {
            BattleField.siegeVisualStopHandler(this.siegeCityId, true);
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

    /**
     * 开局攻守兵力比（attacker / defender）——刚接战、任何武将技生效前锁定，全程不变。
     * 所有播报与优劣均判势统一读此值：一场战斗只按开局兵力定一次势，直至结束。
     */
    public getInitialAttDefRatio(): number {
        return this.situationalAttDefRatio;
    }

    /** 引擎判定的占优方是否攻方（开战掷色锁定；援军编入/败战翻盘重掷后随 refreshPredictedSidesFromTotals 翻转）。
     *  标尺方向单一真理：八环有效战力比 > 兵力比，避免「兵力少但名将局打赢、标尺却向输家倾斜」。 */
    public isAttackerPredictedStronger(): boolean {
        return this.predictedStrongerGroup === this.attackerGroup;
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
            if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
            lat += p.lat;
            lng += p.lng;
            count++;
        }
        if (count === 0) {
            for (const entry of all) {
                const fallback = entry.unit.getPosition();
                if (Number.isFinite(fallback.lat) && Number.isFinite(fallback.lng)) {
                    return { lat: fallback.lat, lng: fallback.lng };
                }
            }
            return { lat: 0, lng: 0 };
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
        // refreshPredictedSidesFromTotals 后重新套用目标时长
        // 有将地板：不得把时长压破 WITH_GENERAL（否则开战语音仍不够）
        if (!this.customDuration) {
            this.targetDuration = this.resolveFinalTargetDuration();
        }

        // 三势适性：援军新将补指派局技（仅未被开局/counter设过的新单位，避免覆盖counter、不重复施加）
        if (unit.generalId && unit.battleOverriddenSkillId === undefined) {
            const rs = this.predictedStrongerGroup, rw = this.predictedWeakerGroup;
            if (rs && rw) {
                const rr = rs.initialTotalTroops / Math.max(1, rw.initialTotalTroops);
                const rsit = rr < 1.5 ? 'balance' : ((isAttacker ? this.attackerGroup : this.defenderGroup) === rs ? 'advantage' : 'disadvantage');
                // [防重] 与开局同一套避让：现场重扫一遍已用技能（开局那份可能还没建/已过期）
                const usedIds = new Set<string>(this.usedBattleSkillIds);
                for (const bu of [...this.attackerGroup.units, ...this.defenderGroup.units]) {
                    if (bu.unit.battleOverriddenSkillId) usedIds.add(bu.unit.battleOverriddenSkillId);
                }
                const usedClasses = new Set<string>(this.usedBattleSixClasses);
                for (const id of usedIds) usedClasses.add(getSkillSixClass(id) ?? `__nocls__${id}`);

                const pool = getSituationalSkillPool(unit, rsit as any, [...usedIds]);
                const pick = this.pickSkillAvoidingUsedSixClass(
                    pool,
                    usedClasses,
                    `援军 ${unit.generalId}`,
                );
                if (pick) {
                    unit.battleOverriddenSkillId = pick;
                    this.usedBattleSkillIds.add(pick);
                    this.usedBattleSixClasses.add(getSkillSixClass(pick) ?? `__nocls__${pick}`);
                }
            }
        }

        // 指挥官开战即锁定、援军入场不改（掷点/乘区全读指挥官）：
        // 亮相权同样锁给指挥官，否则高分援军会抢到 Cut-in，放一个机制上从未生效的技能。
        tryEmitOpeningTacticalOnReinforcementJoin(
            unit,
            isAttacker,
            this.getAttackerUnits(),
            this.getDefenderUnits(),
            this.openingTacticalUiShown,
            this,
            this.stalemateSkillUiReleased,
            isAttacker ? this.attackerCommander : this.defenderCommander,
            isAttacker ? this.defenderCommander : this.attackerCommander,
        );

        this.reconcileSiegeGarrisonBoostForJoinedUnit(unit, isAttacker);
        // 剥离可能把当前指挥官（城防）掏空 → 只在它「已失效」时补选，不是每来一支援军就改选
        if (!(globalThis as any).__HOLLOW_NULL__) this.replaceCommanderIfInvalidated(isAttacker); // 仅无头 A/B 测试钩子，生产恒不设置

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

    /**
     * [2026-08-06] 指挥官**失效**时才补选一次；有效就绝不动。
     *
     * 「指挥官开战即锁定、援军入场不改」的铁律照旧（掷点/乘区/亮相权全读它，改选会让高分援军抢 Cut-in）。
     * 但援军带将入场会触发 reconcileSiegeGarrisonBoostForJoinedUnit 删掉城防的 `_siegeGarrisonGeneralId`，
     * 而 city 的 generalId 是动态 getter —— 锁着的城防指挥官当场变无将，整侧技能卡/角标/三势全空。
     * 空壳指挥官比换人更糟，故只在 canUnitUseGeneralSkills 已经判否时补选。
     */
    private replaceCommanderIfInvalidated(isAttacker: boolean): void {
        const cur = isAttacker ? this.attackerCommander : this.defenderCommander;
        if (cur && canUnitUseGeneralSkills(cur)) return; // 仍有效 → 铁律优先，不动
        const units = isAttacker ? this.getAttackerUnits() : this.getDefenderUnits();
        const next = pickSideSkillGeneralUnit(units);
        if (!next || next === cur) return;
        if (isAttacker) this.attackerCommander = next;
        else this.defenderCommander = next;
        gameLog(
            'battle',
            `🎖️ [BattleField] ${isAttacker ? '攻方' : '守方'}指挥官已失效（城防将被剥离），补选 → ${next.name}`,
        );
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
     * （与 GameConfig.COMBAT.LUCK_MULTIPLIER_RANGE 保持一致）
     */
    public getReinforcementJoinLuck(unitId: string): number | null {
        if (this.getUnitWaveIndex(unitId) < 1) return null;
        const luck = this.reinforcementLuckByUnitId.get(unitId);
        return luck ?? null;
    }

    /** 当前实际使用的 luck（开场=开局值，败战翻盘后=重掷值），供战斗面板 badge */
    public getAttackerCurrentFateLuck(): number { return this.attackerCurrentFateLuck; }
    /** 当前实际使用的 luck */
    public getDefenderCurrentFateLuck(): number { return this.defenderCurrentFateLuck; }
    /** 开战时锁定的指挥官（此后援军入场/阵亡不改变），供战斗面板徽章同源 */
    public getAttackerCommander(): IBattleUnit | null { return this.attackerCommander; }
    public getDefenderCommander(): IBattleUnit | null { return this.defenderCommander; }
    /** 引擎滚点时的总兵力缓存（徽章用此算势比，防战中条件漂移） */
    public getCachedAttackerTroops(): number { return this.cachedAttackerTroops; }
    public getCachedDefenderTroops(): number { return this.cachedDefenderTroops; }

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
