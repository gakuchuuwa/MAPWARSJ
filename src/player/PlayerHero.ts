import { getFactionCultureRegion } from '../config/portrait_defaults';
import { getRegionLegionComposition, getFactionCompositionSlots } from '../types/CultureFormations';
import { WAR_TYPES } from '../data/WarTypes';
import { GameConfig } from '../config/GameConfig';
/**
 * PlayerHero —— 玩家单骑（乱入者）在战略地图上的本体。
 *
 * 设计（2026-09-05 主人定）：
 *   · 玩家是一个"乱入者"，不属于任何军团管理器：不进 LegionManager、不触发攻城/野战/AI/减兵，
 *     只借 Army 的道路行军与渲染注册（GlobalUnitRenderer 按 isPlayerHero 单独画一个精灵）。
 *   · 点据点 → 沿路网前往；抵达后由 PlayerQuestSystem 接管对话。
 *   · 接任务后"入伍"（attachTo）到任务军团：位置逐帧贴军团，镜头跟军团即跟玩家；
 *     军团开打进 13 时，Scene13WarLayer 通过 buildScene13Setup 把玩家放到本方前排前面。
 *   · 功勋只增不减；官阶由功勋推导（PlayerConfig.PLAYER_RANKS）。
 */
import { Army } from '../legion/Army';
import type { GameMap } from '../map/GameMap';
import { getCultureNavalShip } from '../types/NavalShipTiers';
import type { City } from '../types/core';
import { roadRegistry } from '../roads/RoadRegistry';
import { getEuclideanDistance, joinStartToRoadPolyline } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';
import {
    PLAYER_CITY_ARRIVE_DIST,
    PLAYER_DEFEAT_HOLD_MS,
    PLAYER_ELITE_SQUAD_TROOPS,
    heroKeyForRank,
    factionlessAppearancePriority,
    PLAYER_START_SHIP_KEY,
    moveClassForHeroKey,
    type PlayerRankId,
    PLAYER_HERO_NAME,
    PLAYER_HERO_SPEED_MULT,
    PLAYER_PLAIN_SPEED_SCALE,
    PLAYER_MOUNTAIN_SPEED_SCALE,
    PLAYER_RANKS,
    rankForMerit,
    rankFor,
    type PlayerRank,
} from './PlayerConfig';

/** 自动模式的两套玩法：剧本模式到年份优先去战场，乱斗模式完全不去战场（主人 2026-09-17 定）。 */
export type PlayerAutoPlan = 'script' | 'melee';

/** 从本势力文化军团三排里学到的兵种。 */
export interface LearnedUnit {
    /** 兵种 key（UNIT_ASSETS / WAR_TYPES 同名） */
    unitKey: string;
    /** 兵种中文名（面板显示） */
    unitName: string;
    /** 学到时所属势力 */
    factionId: string;
    /** 该兵种在本势力军团里的排号：0 前排 / 1 中坚 / 2 后排 / 3 将军兵模（主将队） */
    row: number;
}

export interface PlayerSaveState {
    merit: number;
    heroDowns: number;
    factionId: string | null;
    learnedUnits?: LearnedUnit[];
    /** 玩家亲手换过兵模：读档后不许再自动换装 */
    manualUnitPick?: boolean;
    /** 就近寻找武将（默认关 = 同档随机） */
    nearbyFirst?: boolean;
    /** 自动选择兵模（默认开） */
    autoPickUnit?: boolean;
    /** 已获海上兵模（战船 AssetId），终身保留 */
    learnedShips?: string[];
    /** 无势力时自选的战船下标；-1 = 独木舟 */
    selectedShip?: number;
    selectedUnit?: number;
    lat: number;
    lng: number;
}

/** Scene13 用的玩家布置（由 Scene13WarLayer.start 通过 window.game.playerHero 取） */
export interface Scene13PlayerSetup {
    /** 玩家所在一方：0 攻 / 1 守 */
    side: 0 | 1;
    heroKey: string;
    heroName: string;
    control: PlayerRank['control'];
    /* 🔴 [2026-09-18 主人定]「玩家永远不能改变军团的兵种」—— 原 `eliteLane`（玩家自带精锐编队）已删除。
     * 它曾被 Scene13WarLayer 用来**顶替**军团编制里的一口，那是 AI 从 12e「必须 9 支」反推出来的，
     * 主人原话（player-rules-verbatim 三·二）只有控制权四条 + 编队数一条，从未允许玩家带兵入场。
     * 玩家在 13 里只以 hero 身份出场，按官阶指挥军团**现有**部队。别再加回这个字段。 */
    /** 🔴 [2026-09-07 主人定] 玩家当前套用的本势力兵种 key。
     *  受控编队按它挑：探马 = 同兵种的**一队**，先锋 = 同兵种的**一排**。
     *  还没学到兵种时为 null → 退回旧口径（前排第一口 / 整个前排）。 */
    unitKey: string | null;
    onKill: (byHero: boolean) => void;
    onHeroDown: () => void;
}

export interface PlayerHeroDeps {
    map: GameMap;
    cityManager: {
        getCity(id: string): City | undefined;
        getCities(): City[];
        getFactionName(id: string): string;
    };
    getLegionById: (id: string) => Army | undefined;
    notify: (msg: string) => void;
    /** 主角开始移动（行军/入伍）→ 镜头跟随主角 */
    followCamera: () => void;
    /** 主角停止（到达/离队）→ 镜头释放，交给玩家自由移动 */
    releaseCamera: () => void;
}

export class PlayerHeroArmy extends Army {
    public readonly isPlayerHero = true;
}

export class PlayerHero {
    public readonly army: PlayerHeroArmy;
    public merit = 0;
    /** 战术模式里落马次数（只做统计，不扣功勋） */
    public heroDowns = 0;
    /** 当前效忠势力（接任务时加入；null = 独行） */
    public factionId: string | null = null;

    /** 🔴 [2026-09-07 主人定] 本势力已学兵种：斥候学 1 个、探马再 1 个、先锋再 1 个，
     *  到先锋集齐该势力文化军团的三排。学到的兵种即玩家自己的素材（可在面板里挑）。 */
    public learnedUnits: LearnedUnit[] = [];
    /**
     * 🔴 [2026-09-09 主人定] 海上兵模：**初始独木舟 CANOE，升到将军才可拥有所在军团的战船**。
     * 与陆上兵模同一套规矩：终身不回收，加入军团时若已到将军就把该军团的战船收进来并换上。
     * 没有任何一条时一律独木舟 —— 白身在海上就该是独木舟。
     */
    public learnedShips: string[] = [];
    /**
     * ⚠️ 已废弃（2026-09-10）：原「玩家亲手换过就不再自动换装」的隐式锁，
     * 已被面板上的显式开关 `autoPickUnit`（自动选择兵模）取代 —— 主人要的是一个看得见的功能，
     * 而不是"点过一次就永久变了脾气"。字段只为读旧存档保留，不再参与任何判据。
     */
    private manualUnitPick = false;
    /** 面板选中的已收兵模下标；-1 = 还没收到（用官阶兜底形象，白身=古典斥候骑兵） */
    public selectedUnit = -1;

    private hostLegionId: string | null = null;
    private travelCityId: string | null = null;
    /** 赶往特定坐标目标（如历史战场）的目标显示名 */
    private travelPointLabel: string | null = null;
    /**
     * 🔴 [2026-09-09 主人定]「到了城里总是没人就换武将，改成直接去找武将，无论在不在城中」。
     * 追的是**军团**（武将带着军团在外行军），不是据点。追击期间照常沿路网走，
     * 只是目的地锚点跟着军团走：军团换城/走远了就重新规划一段。
     */
    private chaseArmyId: string | null = null;
    /** 追击的那位武将名（HUD「追击武将【XXX】」显示用；追的是军团，但对话锚定的是人） */
    private chaseGeneralName: string | null = null;
    /** 自动模式：自动选据点（兵多 + 名将）、自动入伍、军团战败自动换下一个势力。
     *  🔴 [2026-09-15 主人定]「玩家找武将，改为兵多、名将，去掉其他的条件」——判据只剩这两条。
     *  🔴 [2026-09-09 主人定「玩家开局默认自动」] 默认开启，HUD 里可随时手动关掉。 */
    public autoMode = true;
    /**
     * 自动模式走哪套玩法（🔴 2026-09-17 主人定「剧本和乱斗模式分开。因为我还无法确定要不要做剧本。
     *   现在的自动模式分为两种，一种是剧本模式，到了年份，玩家优先去战场。乱斗模式的话，玩家不去战场。」）
     *
     *   · `'script'` 剧本模式 —— 到了年份优先奔赴历史战场，没有可打的战场才去找武将乱斗（9-16 定的那套）；
     *   · `'melee'`  乱斗模式 —— **完全不碰战场**，一直找武将入伍打乱斗。
     *
     * 🔴 [2026-09-23 主人定] 默认改回 `'script'` 剧本模式，且剧本模式是**整个世界的模式**：
     *   「既然是历史剧本，就不能出现不符合历史的事情，这个总功能中包括其他军团不能随机产生。
     *     军团在历史剧本期间，不能随意寻敌，只有等剧本都结束后，自动切换到乱斗模式。」
     *   · 剧本模式 → 募兵系统不生军团（开局首发 + 季末），AI 行为树不驱动非剧本军团；
     *   · 全部战场打完 → PlayerQuestSystem.tick 自动切到 `'melee'`，募兵与 AI 恢复。
     *   原面板「🚫 不出军团」勾选已并入本项（主人：把不出军团功能放到剧本模式中）。
     *   （9-17 曾定默认乱斗，已被本条取代。）
     */
    public autoPlan: PlayerAutoPlan = 'script';
    /**
     * 「就近寻将」开关，**默认关**。
     * 🔴 [2026-09-15 主人报障「就近太近只在一个势力找，全随机又一直在奔波」] 语义已改：
     *   它不再是「随机 / 取最近」的硬二选一，两头都被实测否掉了。
     *   现在同档候选一律走**距离加权随机**（PlayerQuestSystem.pickAutoCity 第③步），
     *   这个开关只决定软半径：开 = 500km（贴着身边一圈抽），关 = 1500km（一州之地）。
     *   两档都是在**一圈城里抽签**，不会锁死某一座，也不会横跨半个地球。
     */
    public nearbyFirst = false;
    /**
     * 🔴 [2026-09-10 主人定]「你在玩家面板添加一个功能，自动选择兵模」。
     * 开（默认）：
     *   · 有势力 → 按凑卡玩法走：加入军团时换成该军团的兵模；
     *   · 无势力 → 已获形象按 骑兵 → 战车 → 象兵 → 步兵 自动优选。
     * 关：一切自动换装停手，只用玩家在面板上选的那个。
     */
    public autoPickUnit = true;
    /** 玩家自定义名（改名功能写入；默认「乱入者」） */
    private playerName: string = PLAYER_HERO_NAME;
    private changeListeners = new Set<() => void>();
    /** 抵达据点回调（PlayerQuestSystem 接管对话） */
    public onArriveCity: ((city: City) => void) | null = null;
    /** 追上带着武将的军团（不在城中时的会面入口） */
    public onMeetArmy: ((army: Army) => void) | null = null;
    /** 入伍军团覆灭/解散回调 */
    public onHostLost: ((lastHostId: string) => void) | null = null;

    constructor(private deps: PlayerHeroDeps, startPos: { lat: number; lng: number }) {
        this.army = new PlayerHeroArmy(
            deps.map,
            startPos,
            null,
            1,
            '',
            () => { },
            undefined,
            undefined,
            PLAYER_HERO_NAME,
            'cavalry',
            undefined,
        );
        this.army.type = 'hero';
        // 🔴 [2026-09-07 主人定「海上用独木舟」] 玩家单骑无文化区，指定独木舟；
        //    随军时下面 update() 会按宿主舰队覆盖，这里只管一个人漂海。
        this.army.preferredNavalShip = 'CANOE';
        // 🔴 [2026-09-07 主人定「骑兵/步兵/船 移动速度要区分」] 按当前素材定行军大类；
        //    官阶变化会换素材，故 syncMoveProfile() 在升阶/入伙/脱离时都要再调一次。
        this.syncMoveProfile();
        this.army.setSpeedMultiplier(PLAYER_HERO_SPEED_MULT);
        // 开局集结闸门是给首发军团的开场仪式，玩家不受它约束（否则开局 5 秒内点据点没反应）
        this.army.exemptFromDeployHold = true;
        // 渲染包装器是在 super() 里建的，字段初始化晚于它 → 手动补上身份标记
        const r = this.army.getRenderer() as unknown as Record<string, unknown> | null;
        if (r) {
            r.type = 'hero';
            r.isPlayerHero = true;
            r.playerHero = this;
        }
    }

    public get id(): string { return this.army.id; }
    public get name(): string { return this.playerName; }
    /** 玩家素材：随官阶变（主人 2026-09-07 定「起始套用民兵」）。
     *  ⚠️ 同时决定 13 里的血/攻/防 —— Scene13 用 statsFor(heroKey) 取 WAR_TYPES。 */
    public get heroKey(): string {
        // 🔴 [2026-09-07 主人定「学到的兵种给玩家套用」] 优先用面板选中的本势力已学兵种；
        //    还没学到（平民/刚入伙那一瞬）才回落到官阶兜底素材（白身=古典斥候骑兵）。
        return this.getSelectedUnit()?.unitKey ?? heroKeyForRank(this.getRank().id);
    }
    public rename(newName: string): void {
        const trimmed = newName.trim();
        if (!trimmed) return;
        this.playerName = trimmed;
        this.army.name = trimmed;
        // renderer.name 是 getter（返回 army.name），改了 army.name 即自动生效，无需给 renderer 赋值
        this.emitChange();
    }

    /** 同步玩家的地图行军大类（骑=CAVALRY 平原2.0 / 步=INFANTRY 平原1.4·山地1.1）。
     *  海上不归它管：登船后全军统一 SEA_SPEED_MULTIPLIER，兵种加成失效。 */
    private syncMoveProfile(): void {
        if (!this.factionId && this.autoPickUnit) {
            let picked = this.getSelectedUnit() ? this.selectedUnit : -1;
            for (let i = 0; i < this.learnedUnits.length; i++) {
                if (picked < 0 || factionlessAppearancePriority(this.learnedUnits[i].unitKey)
                    < factionlessAppearancePriority(this.learnedUnits[picked].unitKey)) picked = i;
            }
            // 🔴 修复（2026-09-10）：无势力自动换装里骑兵有保底（初始斥候 = 官阶兜底，优先级 0）。
            //    若学到的兵模里没有骑兵（最优优先级 > 0），回落到官阶兜底「古典斥候骑兵」，
            //    别套用步兵/战车/象兵——否则加入步兵势力解散后就停在步兵、回不到骑兵。
            if (picked >= 0 && factionlessAppearancePriority(this.learnedUnits[picked].unitKey) > 0) {
                picked = -1;
            }
            this.selectedUnit = picked;
        }
        this.army.preferredMoveClass = moveClassForHeroKey(this.heroKey);
        // 🔴 [2026-09-11 主人定]「平地慢一小点，山地快一小点」—— 只作用于玩家这一支，
        //    幅度见 PLAYER_PLAIN_SPEED_SCALE / PLAYER_MOUNTAIN_SPEED_SCALE 的头注。
        this.army.terrainSpeedScale = {
            plain: PLAYER_PLAIN_SPEED_SCALE,
            mountain: PLAYER_MOUNTAIN_SPEED_SCALE,
        };
    }

    public getPosition(): { lat: number; lng: number } { return this.army.getPosition(); }
    /** 已投效势力则保底斥候（主人 2026-09-07 定），否则按功勋 */
    public getRank(): PlayerRank { return rankFor(this.merit, this.factionId !== null); }
    public getHostLegionId(): string | null { return this.hostLegionId; }
    public setAutoMode(on: boolean): void {
        if (this.autoMode === on) return;
        this.autoMode = on;
        this.emitChange();
    }
    /**
     * 切换自动模式的玩法（剧本 / 乱斗）。
     * 🔴 切到乱斗时，若人正走在奔赴战场的路上，**必须把这趟行程掐掉** —— 否则「乱斗模式玩家不去战场」
     *    这条会被一趟已经出发的行程架空，玩家照样一路走到战场再触发。`travelPointLabel` 只在
     *    `travelToPoint` 里设，而全项目只有战场引导会调它，所以它非空就等于「正在奔赴战场」。
     */
    public setAutoPlan(plan: PlayerAutoPlan): void {
        if (this.autoPlan === plan) return;
        this.autoPlan = plan;
        if (plan === 'melee' && this.travelPointLabel !== null) this.cancelTravel();
        this.emitChange();
    }
    public setNearbyFirst(on: boolean): void {
        if (this.nearbyFirst === on) return;
        this.nearbyFirst = on;
        this.emitChange();
    }
    public setAutoPickUnit(on: boolean): void {
        if (this.autoPickUnit === on) return;
        this.autoPickUnit = on;
        if (on) this.syncMoveProfile();   // 打开即按当前状态重选一次
        this.emitChange();
    }
    public getHostLegion(): Army | undefined {
        return this.hostLegionId ? this.deps.getLegionById(this.hostLegionId) : undefined;
    }
    public isAttached(): boolean { return this.hostLegionId != null; }
    /** 🔴 [2026-09-18 主人定「玩家路过自家被围攻的据点，自动参战救援」]
     *  供外部系统（SiegeManager）向玩家播报一句（如"已随守军参战"）。
     *  玩家提示统一走 deps.notify，外部拿不到私有 deps，故开这个公开口。 */
    public notifyPlayer(msg: string): void { this.deps.notify(msg); }
    public isAttachedTo(armyId: string | null | undefined): boolean {
        return !!armyId && this.hostLegionId === armyId;
    }
    public isTraveling(): boolean {
        return this.travelCityId != null || this.chaseArmyId != null || this.travelPointLabel != null || this.army.isMarching();
    }
    /** 正在追某支军团找武将 */
    public isChasingArmy(): boolean { return this.chaseArmyId != null; }
    public getChaseArmyId(): string | null { return this.chaseArmyId; }
    public getChaseGeneralName(): string | null { return this.chaseGeneralName; }
    public getTravelCityId(): string | null { return this.travelCityId; }
    public getTravelPointLabel(): string | null { return this.travelPointLabel; }
    /**
     * 🔴 [2026-09-19 主人定] 由玩家任务系统设置/清除「正奔赴哪个战役」的标注。
     *
     * 与 `travelToPoint` 的分工：那条路是**玩家单骑**去战场，标注由它自己写、抵达回调自己清；
     * 而「跟随武将赴史实战役」这条链上玩家是**随军**（`hostLegionId` 非空、位置每帧跟着军团走），
     * 走不了 `travelToPoint`（它开头就挡「你正在军中」），标注只能由外部代写 ——
     * 写的是同一个字段，HUD 动向栏与赶路播报读的也是同一个字段，**不另造第二套状态**。
     */
    public setTravelPointLabel(label: string | null): void {
        if (this.travelPointLabel === label) return;
        this.travelPointLabel = label;
        this.emitChange();
    }

    public onChange(fn: () => void): void { this.changeListeners.add(fn); }
    private emitChange(): void { for (const fn of this.changeListeners) fn(); }

    // ── 功勋 ──────────────────────────────────────────────
    public addMerit(n: number): void {
        if (n <= 0) return;
        const before = this.getRank();
        this.merit += n;
        const after = this.getRank();
        if (after.id !== before.id) {
            this.syncLearnedUnits();  // 升阶 → 按配额补学本势力兵种（斥候1/探马2/先锋3）
            this.syncMoveProfile();   // 素材可能变 → 行军大类跟着变
            this.deps.notify(`🎖️ 功勋 ${this.merit}，${PLAYER_HERO_NAME}晋升为【${after.name}】`);
            gameLog('expedition', `[玩家] 晋升 ${before.name} → ${after.name}（功勋 ${this.merit}）`);
            // 晋升：入伍中则同步军团第九环战力乘数 + 官阶名
            const host = this.getHostLegion();
            if (host) {
                host.playerHostPowerMult = after.powerMult;
                host.playerHostRankName = after.name;
            }
        }
        this.emitChange();
    }

    public resetMerit(reason: string = '随军战败'): void {
        const before = this.getRank();
        const prevMerit = this.merit;
        this.merit = 0;
        // 🔴 [2026-09-17 主人定] 军团解散/战败/脱离后，玩家已离开军团恢复单骑，
        //    身份重归「布衣平民」，绝非在军中的「风行斥候」，且平民无官阶。
        //    重置功勋即脱离势力，确保 after 必为布衣平民（civilian）。
        this.factionId = null;
        this.army.setFactionId('');
        const rr = this.army.getRenderer();
        if (rr) rr.factionId = undefined;

        const after = this.getRank();
        this.syncLearnedUnits();  // 降阶：收回超额已学兵种
        this.syncMoveProfile();
        const host = this.getHostLegion();
        if (host) {
            host.playerHostPowerMult = null;
            host.playerHostRankName = null;
        }
        if (prevMerit > 0 || before.id !== after.id) {
            if (after.id === 'civilian') {
                this.deps.notify(`💥 ${reason}！功勋已归零，重归【${after.name}】`);
                gameLog('expedition', `[玩家] ${reason}，功勋 ${prevMerit} 归零，从【${before.name}】重归【${after.name}】`);
            } else {
                this.deps.notify(`💥 ${reason}！功勋已归零，官阶降为【${after.name}】`);
                gameLog('expedition', `[玩家] ${reason}，功勋 ${prevMerit} 归零，从【${before.name}】降为【${after.name}】`);
            }
        }
        this.emitChange();
    }

    public noteHeroDown(): void {
        this.heroDowns++;
        this.emitChange();
    }

    // ── 战败停顿：立即回战略地图，然后原地等待 5 秒再移动 ──
    /** 停顿截止时刻（Date.now() 口径）；≤ 现在 = 没在停顿 */
    private holdUntilMs = 0;

    /** 随军战败 → 落地停顿（时长见 PLAYER_DEFEAT_HOLD_MS） */
    private holdAfterDefeat(): void {
        // 先退战术场景，避免残局停留消耗玩家在战略地图上的等待时间。
        (window as any).game?.battleScene?.exit();
        this.holdUntilMs = Date.now() + PLAYER_DEFEAT_HOLD_MS;
    }

    /** 是否正处在战败停顿中（停顿期玩家不动） */
    public isHeld(): boolean {
        return Date.now() < this.holdUntilMs;
    }

    /** 大地图战略战斗结算：随军军团战胜时，按歼敌兵力与官阶指挥分成获得战略战功；战败则功勋归零降职 */
    public onHostBattleEnd(result: 'victory' | 'defeat', enemyKilled: number): void {
        if (result === 'defeat') {
            // 战败立即回战略地图，从退场完成开始等待 5 秒，再走脱军清场流程。
            this.holdAfterDefeat();
            // 战败 = 脱离军团：清势力（信息栏不再显示旧势力）+ 清任务 + 关自动模式。
            // 走 onHostLost → finishQuest(false) → detach() 统一清场（含 factionId / host / 权限乘数 / 自动模式）。
            this.resetMerit('随军战败');
            if (this.onHostLost) {
                this.onHostLost(this.hostLegionId ?? '');
            } else {
                this.detach();
            }
            return;
        }
        if (enemyKilled <= 0) return;
        const rank = this.getRank();
        // 官阶指挥分成：平民2% / 斥候3% / 探马5% / 先锋8% / 将军12% / 元帅16% / 公侯20% / 国王25% / 皇帝30%
        const ratio = rank.meritShare ?? (rank.control === 'none' ? 0.02
            : rank.control === 'one' ? 0.05
            : rank.control === 'front' ? 0.1 : 0.2);
        const gained = Math.max(20, Math.round(enemyKilled * ratio));
        this.addMerit(gained);   // 🔴 [2026-09-24 主人「删除这种无聊信息」] 只记战功，不弹「大捷！随军斩敌…记战功」
    }

    // ── 兵模收集（凑卡玩法核心，见 docs/AGENTS/player-rules-verbatim.md 第零节）──
    /**
     * 该官阶在**当前军团这 5 种兵模**（三排 + 将军 + 舰队）里应当已收到几种。
     * 🔴 [2026-09-09 主人定]「每个军团有四种兵模，三排 + 船；斥候/探马/先锋/将军几个级别随机奖励；
     *    加入一个军团就可以获得一个兵模，升级到探马、先锋、将军，该军团获得齐全。」
     */
    private learnQuotaForRank(rankId: PlayerRankId): number {
        const idx = PLAYER_RANKS.findIndex((r) => r.id === rankId);
        const q = (id: PlayerRankId) => PLAYER_RANKS.findIndex((r) => r.id === id);
        // 🔴 [2026-09-24 主人定「每个军团都有三兵模，然后还有一个将军兵模，还有一个舰队兵模…正好5个官阶，5个兵模」]
        //    斥候/探马/先锋 → 三排各一；将军/元帅 → 将军兵模、舰队兵模（两者随机先后）。
        if (idx >= q('marshal')) return 5;    // 元帅起：五种齐全
        if (idx >= q('general')) return 4;    // 将军：四种
        if (idx >= q('vanguard')) return 3;   // 先锋：三种
        if (idx >= q('outrider')) return 2;   // 探马：两种
        if (idx >= q('scout')) return 1;      // 斥候：一种
        return 0;                              // 平民：还没入伙，用官阶兜底形象（古典斥候骑兵）
    }

    /**
     * 当前该按谁的三排学：入伍了就看**所在军团实际编成**（`army.cultureSlots` 是运行时真值，
     * 势力专属番号编制/文化军团都已在里面），独行期回落到文化区默认表。
     * 返回按首次出现顺序去重后的兵种 key —— 就是这支军团的「三排兵模」。
     */
    private legionUnitKeys(): string[] {
        const host = this.getHostLegion();
        // 只取编制 9 队（三排）；第 10 队是主将队 = 将军兵模，另算（见 legionCommanderKey）
        const expanded = host?.cultureSlots?.slice(0, 9);
        if (expanded && expanded.length) {
            const seen: string[] = [];
            for (const k of expanded) if (k && !seen.includes(k)) seen.push(k);
            if (seen.length) return seen;
        }
        // 还没入伍（joinFaction 先于 attachTo）：按势力专属番号编制 → 文化区默认表，
        // 与他马上要加入的那支军团同源（铁律「一势力一军团一种编制」）
        const region = this.factionId ? getFactionCultureRegion(this.factionId) : null;
        const slots = (this.factionId ? getFactionCompositionSlots(this.factionId) : null)
            ?? (region ? (getRegionLegionComposition(region)?.slots ?? []) : []);
        const seen: string[] = [];
        for (const sl of slots as Array<{ type: string }>) if (sl.type && !seen.includes(sl.type)) seen.push(sl.type);
        return seen;
    }

    /**
     * 所在军团的将军兵模 = 主将队（第 10 队）兵种；与三排重复（主将无专属英雄、用前排兵种兜底）时返回 null。
     * 独行期没有军团，也返回 null。
     */
    private legionCommanderKey(): string | null {
        const slots = this.getHostLegion()?.cultureSlots;
        if (!slots || slots.length < 10) return null;
        const key = slots[9];
        return key && !slots.slice(0, 9).includes(key) ? key : null;
    }

    /** 所在军团的战船（舰队兵模）；独行期按势力文化区取，取不到返回 null */
    private legionShipKey(): string | null {
        const host = this.getHostLegion();
        if (host) return host.navalShipAssetLock ?? getCultureNavalShip(host.cultureRegion, host.getFactionId());
        if (!this.factionId) return null;
        return getCultureNavalShip(getFactionCultureRegion(this.factionId), this.factionId) ?? null;
    }

    /**
     * 🔴 [2026-09-09 主人定]「加入哪个军团，就变成此军团三排兵模的其中一种」。
     * 入伍时调用：先按官阶配额从**该军团**三排里补学，再自动换上该军团的兵模。
     * 关掉面板的「自动选择兵模」→ 只获得、不换装。
     */
    public onJoinLegion(): void {
        this.syncLearnedUnits();
        if (!this.autoPickUnit) return;   // 关掉自动选择 = 只用玩家手选的那个
        const keys = this.legionUnitKeys();
        if (!keys.length) return;
        // 只在「该军团三排里、他已经拥有的」兵模中随机换一件（配额没到就换不了新的那件，属正常）
        const owned = this.learnedUnits
            .map((u, i) => ({ u, i }))
            .filter((x) => keys.includes(x.u.unitKey));
        if (!owned.length) return;
        const pick = owned[Math.floor(Math.random() * owned.length)];
        if (pick.i === this.selectedUnit) return;
        this.selectedUnit = pick.i;
        this.syncMoveProfile();
        this.deps.notify(`🛡️ 换上本军团兵模【${pick.u.unitName}】`);
        this.emitChange();
    }

    /**
     * 按当前官阶补齐应学的兵模。
     * 🔴 [2026-09-07 主人定]「斥候学一个（三排随机）→ 探马再一个 → 先锋再一个，集齐三排」。
     *    随机只在**还没学过的排**里抽，所以到先锋必然三排各一个，不会重复。
     *    学到即可套用：玩家素材 = 选中的已学兵模（见 heroKey）。
     * 规则全文见 docs/AGENTS/player-hero.md。
     */
    public syncLearnedUnits(): void {
        // 🔴 [2026-09-09 主人定「这种是玩家奖励，终身获取的」]
        //    已学兵种**永不回收**：军团战败、脱离势力、改投他家、掉阶，一律保留。
        //    改前有三处会把它清光——① factionId 为空就清空（军团战败 → detach 清 factionId，
        //    奖励当场蒸发）；② 换势力清空重学；③ 掉阶按总数截断。全部去掉。
        //    配额只约束「本势力还能再学几个」，按**当前势力已学数**算，不看历史总数，
        //    所以改投新势力后照样能从头学三排，旧势力学的也还留着能选。
        const want = this.learnQuotaForRank(this.getRank().id);
        if (!this.factionId) return;               // 独行期：不新收，但旧的原样保留
        // 🔴 [2026-09-24 主人定] 池子 = 所加入那支军团的五种兵模：三排 + 将军兵模 + 舰队兵模。
        //    斥候/探马/先锋三阶先把三排随机收齐；三排齐了，将军/元帅两阶再在「将军兵模、舰队」里随机收。
        //    （取代 2026-09-10「首抽只给陆地三排」那条：现在三排收齐之前，船和将军都不进池。）
        const landKeys = this.legionUnitKeys();
        const cmdKey = this.legionCommanderKey();
        const shipKeyOfLegion = this.legionShipKey();
        type Pick = { key: string; row: number; ship: boolean };
        const landPool: Pick[] = landKeys.map((key, row) => ({ key, row, ship: false }));
        const highPool: Pick[] = [
            ...(cmdKey ? [{ key: cmdKey, row: 3, ship: false }] : []),
            ...(shipKeyOfLegion ? [{ key: shipKeyOfLegion, row: -1, ship: true }] : []),
        ];
        const pool = [...landPool, ...highPool];
        if (!pool.length) return;

        // 「已收到几种」只数**这个池子里的**，与别处收的互不干扰
        const owns = (p: { key: string; ship: boolean }) => p.ship
            ? this.learnedShips.includes(p.key)
            : this.learnedUnits.some((u) => u.unitKey === p.key);
        const got = () => pool.filter(owns).length;
        while (got() < want) {
            const landRest = landPool.filter((p) => !owns(p));
            const rest = landRest.length ? landRest : highPool.filter((p) => !owns(p));
            if (!rest.length) break;               // 这个军团的五种已收齐
            const pick = rest[Math.floor(Math.random() * rest.length)];
            if (pick.ship) {
                this.learnedShips.push(pick.key);
            } else {
                const name = WAR_TYPES[pick.key]?.name ?? pick.key;
                this.learnedUnits.push({ unitKey: pick.key, unitName: name, factionId: this.factionId, row: pick.row });
                if (this.selectedUnit < 0) this.selectedUnit = this.learnedUnits.length - 1;
            }
        }
    }

    /** 面板选兵种素材（探马及以上才开放，见 PlayerHUD） */
    public selectUnit(idx: number): void {
        this.selectedUnit = idx >= 0 && idx < this.learnedUnits.length ? idx : -1;
        this.syncMoveProfile();
        this.emitChange();
    }

    /** 无势力时玩家自选的战船下标（指向 learnedShips）；-1 = 独木舟 */
    public selectedShip = -1;

    /**
     * 当前海上兵模。🔴 [2026-09-09 主人定] 分两种情况，别混：
     *   · **有势力** → 一律画**该势力的舰队兵模**，玩家自己那条不显示、也不可选。
     *     入伍了就用所在军团的船（同一支舰队），没入伍就按势力文化区取舰队船。
     *   · **无势力**（单骑独行）→ 才轮到玩家自己挑：已获战船里选一条，没有就独木舟。
     * 已获战船（learnedShips，随军团四种兵模的档位随机抽到）只在**无势力**时才用得上，
     * 有势力时它只是收藏，不影响画面。
     */
    public get shipKey(): string {
        if (this.factionId) {
            const host = this.getHostLegion();
            if (host) return host.navalShipAssetLock ?? getCultureNavalShip(host.cultureRegion, host.getFactionId());
            return getCultureNavalShip(getFactionCultureRegion(this.factionId), this.factionId);
        }
        return this.learnedShips[this.selectedShip] ?? PLAYER_START_SHIP_KEY;
    }

    /** 无势力时才允许换船（有势力一律随势力舰队） */
    public canPickShip(): boolean { return !this.factionId; }

    public selectShip(idx: number): void {
        if (!this.canPickShip()) return;
        this.selectedShip = idx >= 0 && idx < this.learnedShips.length ? idx : -1;
        this.emitChange();
    }

    public getSelectedUnit(): LearnedUnit | null {
        return this.learnedUnits[this.selectedUnit] ?? null;
    }

    // ── 势力 ──────────────────────────────────────────────
    public joinFaction(factionId: string): void {
        this.factionId = factionId;
        this.army.setFactionId(factionId);
        this.syncLearnedUnits();  // 入伙即斥候 → 立刻从该势力三排随机学一个
        this.syncMoveProfile();   // 素材换成学到的兵 → 行军大类跟着变
        const r = this.army.getRenderer();
        if (r) r.factionId = factionId;
        this.emitChange();
    }

    // ── 入伍 / 离队 ──────────────────────────────────────
    public attachTo(host: Army): void {
        this.cancelChase();
        this.cancelTravel();
        this.hostLegionId = host.id;
        // 第九环·玩家官阶：入伍时把官阶战力乘数 + 4 字官阶名写到军团
        host.playerHostPowerMult = this.getRank().powerMult;
        host.playerHostRankName = this.getRank().name;
        // 🔴 [2026-09-09 主人定] 加入军团即从该军团三排里取兵模并换上（见 docs/AGENTS/player-hero.md）
        this.onJoinLegion();
        const p = host.getPosition();
        this.army.setPosition(p.lat, p.lng);
        this.deps.followCamera();
        this.emitChange();
    }

    public detach(): void {
        if (!this.hostLegionId) return;
        // 统一铁律：玩家脱离军团 = 功勋归零降职（无论战败覆灭还是主动离队，一律清零）
        this.resetMerit('脱离军团');
        const host = this.getHostLegion();
        if (host) {
            host.playerHostPowerMult = null;   // 离队：清第九环加成
            host.playerHostRankName = null;
            const p = host.getPosition();
            this.army.setPosition(p.lat, p.lng);
        }
        this.hostLegionId = null;
        // [2026-09-05 玩家] 退出势力：离队后不再属于该势力，不挂势力旗帜
        this.factionId = null;
        this.army.setFactionId('');
        this.syncLearnedUnits();  // 退出势力：已学兵模**不回收**（终身奖励），这里只是刷新配额口径
        this.syncMoveProfile();   // 素材回官阶兜底形象（古典斥候骑兵，骑兵档）
        const rr = this.army.getRenderer();
        if (rr) rr.factionId = undefined;
        this.deps.releaseCamera();
        this.emitChange();
    }

    // ── 行军 ──────────────────────────────────────────────
    /**
     * 点据点：沿路网前往。入伍中不可单独行动。
     * @param keepChase 追击续航内部调用时为 true —— 这段路只是追人的一程，不算玩家改主意。
     *   玩家手点据点时为 false（默认），会放弃正在进行的追击。
     */
    public travelToCity(cityId: string, keepChase = false): boolean {
        if (!keepChase) this.cancelChase();
        this.travelPointLabel = null;
        if (this.hostLegionId) {
            this.deps.notify('你正在军中，随军出征，军团解散前不可离开');
            return false;
        }
        const city = this.deps.cityManager.getCity(cityId);
        if (!city) return false;
        const pos = this.army.getPosition();
        const target = { lat: city.latitude, lng: city.longitude };
        if (getEuclideanDistance(pos, target) <= PLAYER_CITY_ARRIVE_DIST) {
            this.cancelTravel();
            // 追人途中锚点城正好在脚下：只是路过，不触发城中对话（同 handleArrive 的闸门）
            if (!this.chaseArmyId) this.onArriveCity?.(city);
            return true;
        }
        if (!roadRegistry.isInitialized()) return false;
        const nearest = roadRegistry.getNearestCityId(pos.lat, pos.lng);
        let path = roadRegistry.getFullPathToCity(pos, cityId, nearest);
        if (!path || path.length < 2) path = roadRegistry.getFullPathToCity(pos, cityId, undefined);
        if (!path || path.length < 2) {
            this.deps.notify(`无路可达【${city.name}】`);
            return false;
        }
        this.travelCityId = cityId;
        this.travelPointLabel = null;
        this.army.setTargetCity(city);
        this.army.setOnArriveCallback(() => this.handleArrive(cityId));
        this.army.moveAlongPath(path.map((p) => ({ lat: p.lat, lng: p.lng, sea: (p as any).sea })));
        this.deps.followCamera();
        this.emitChange();
        return true;
    }

    /**
     * 去找带着武将的那支军团（在不在城中都能找）。每帧由 stepChase 续航：
     * 军团走了就重新规划，够近了就触发会面。入伍中不可单独行动。
     */
    /** 彻底放弃追击（玩家改点别处、入伍、离队） */
    public cancelChase(): void { this.chaseArmyId = null; this.chaseGeneralName = null; }

    /**
     * 🔴 [2026-09-14 主人定]「玩家要抵达战场才能触发」—— 战场**不是据点**，不在路网里，
     *    所以 `travelToCity` 用不上（它只认 city id）。
     *
     *    走法：沿路网走到离战场最近的路点，最后一段直接走过去。实测两个战场分别距现成道路
     *    10.2 km 与 0.2 km，所以**不需要给战场画任何专用道路**。
     *    抵达后回调，由任务系统弹选边对话。
     */
    public travelToPoint(
        target: { lat: number; lng: number },
        label: string,
        onArrive?: () => void,
    ): boolean {
        this.cancelChase();
        if (this.hostLegionId) {
            this.deps.notify('你正在军中，随军出征，军团解散前不可离开');
            return false;
        }
        const pos = this.army.getPosition();
        if (getEuclideanDistance(pos, target) * 111 <= 2) {
            this.travelPointLabel = null;
            onArrive?.();       // 已经站在跟前了
            return true;
        }
        let path = roadRegistry.findPathOnRoad(pos, target);
        if (!path || path.length < 2) {
            // 🔴 [2026-09-16 主人报障「无路可达【波斯门战役】」]
            //    战场**不是据点、不在路网上**（见 Battlefields.ts）。`findPathOnRoad` 要求
            //    起终点各自 1.0° 内有据点，而波斯门深在扎格罗斯山里，最近的波斯波利斯都有
            //    167km（1.508°），够不着就直接判无路 —— 玩家于是永远到不了那个战场。
            //    山里没城是**史实**（正是它「一夫当关」的前提），不能为了让路通就往山里塞城。
            //    所以回落：沿路网走到离战场最近的那座城，最后一段直奔战场。
            const anchor = roadRegistry.getNearestCityPos(target.lat, target.lng, 5);
            if (anchor) {
                const viaAnchor = roadRegistry.findPathOnRoad(pos, anchor);
                if (viaAnchor && viaAnchor.length >= 2) path = [...viaAnchor, target];
            }
        }
        if (!path || path.length < 2) {
            this.travelPointLabel = null;
            this.deps.notify(`无路可达【${label}】`);
            return false;
        }
        const marchPath = joinStartToRoadPolyline(pos, path, GameConfig.ROAD.JOIN_EPS);
        this.travelCityId = null;
        this.travelPointLabel = label;
        this.army.setTargetCity(null);
        let fired = false;
        this.army.setOnArriveCallback(() => {
            if (fired) return;   // 到达回调只认一次，避免停步抖动重复触发
            fired = true;
            this.travelPointLabel = null;
            this.deps.releaseCamera();
            this.emitChange();
            onArrive?.();
        });
        this.army.moveAlongPath(marchPath.slice(1).map((p: any) => ({ lat: p.lat, lng: p.lng, sea: p.sea })));
        this.deps.followCamera();
        this.emitChange();
        return true;
    }

    public travelToArmy(armyId: string, generalName?: string): boolean {
        if (this.hostLegionId) {
            this.deps.notify('你正在军中，随军出征，军团解散前不可离开');
            return false;
        }
        const army = this.deps.getLegionById(armyId);
        if (!army || army.isDestroyed || army.getTroops() <= 0) return false;
        this.chaseArmyId = armyId;
        this.chaseGeneralName = generalName ?? null;
        this.stepChase(true);
        return this.chaseArmyId != null;
    }

    /**
     * 追击续航（每帧，未入伍时调）：
     *   ① 军团没了 → 放弃，交回自动模式重新选目标
     *   ② 够近了 → 停下会面
     *   ③ 否则：锚点城 = 军团正在去的城 ?? 军团脚下最近的城；锚点变了或自己停下了就重新规划
     * 🔴 重新规划走的还是 travelToCity（沿路网），只是抵达锚点城时**不触发城中对话**
     *    —— 见 handleArrive 里的 chaseArmyId 闸门，追人途中路过的城不算数。
     */
    private stepChase(force = false): void {
        const id = this.chaseArmyId;
        if (!id) return;
        const army = this.deps.getLegionById(id);
        if (!army || army.isDestroyed || army.getTroops() <= 0) {
            this.chaseArmyId = null;
            this.chaseGeneralName = null;
            this.cancelTravel();
            this.deps.notify('要找的将领所部已覆灭，另寻他人');
            this.emitChange();
            return;
        }
        const me = this.army.getPosition();
        const it = army.getPosition();
        if (getEuclideanDistance(me, it) <= PLAYER_CITY_ARRIVE_DIST) {
            this.chaseArmyId = null;
            this.chaseGeneralName = null;
            this.cancelTravel();
            this.deps.followCamera();
            this.emitChange();
            this.onMeetArmy?.(army);
            return;
        }
        // 锚点：军团正在去的城优先（追它的落脚点比追它的当前坐标更省路）
        const anchor: string | null = army.getTargetCity()?.id
            ?? roadRegistry.getNearestCityId(it.lat, it.lng)
            ?? null;
        if (!anchor) return;
        if (force || this.travelCityId !== anchor || this.army.isIdle()) {
            const keep = this.chaseArmyId;
            const ok = this.travelToCity(anchor, true);
            this.chaseArmyId = keep;   // travelToCity 内部可能触发到达清理，追击标记要留住
            // 🔴 规划失败（无路可达/路网未就绪）就放弃追击：不放弃的话下一帧还会走到这儿，
            //    「无路可达」的提示会每帧刷屏，玩家也永远停在原地。
            if (!ok) {
                this.chaseArmyId = null;
                this.chaseGeneralName = null;
                this.emitChange();
            }
        }
    }

    /** 停止行军。⚠️ 不清 chaseArmyId —— 追击靠它续航，停的只是当前这一段路。
     *  要彻底放弃追击请用 cancelChase()。 */
    public cancelTravel(): void {
        this.travelPointLabel = null;
        if (!this.travelCityId && this.army.isIdle()) return;
        this.travelCityId = null;
        this.army.stopMovement(false);
        this.army.setTargetCity(null);
        this.deps.releaseCamera();
    }

    private handleArrive(cityId: string): void {
        if (this.travelCityId !== cityId) return;
        this.travelCityId = null;
        this.army.setTargetCity(null);
        // 追人途中：锚点城只是路上的一站，不谈事；下一帧 stepChase 会继续往军团那边走
        if (this.chaseArmyId) { this.emitChange(); return; }
        const city = this.deps.cityManager.getCity(cityId);
        this.deps.releaseCamera();
        this.emitChange();
        if (city) this.onArriveCity?.(city);
    }

    /** 每帧（大战略未暂停时）：入伍则贴军团，否则自己走路 */
    public update(dt: number): void {
        const r = this.army.getRenderer();
        if (this.hostLegionId) {
            const host = this.getHostLegion();
            if (!host || host.isDestroyed || host.getTroops() <= 0) {
                const lastId = this.hostLegionId;
                // 🔴 [2026-09-11 修「玩家依然是军团一战败就移动，不等」] 停顿必须**也**落在这条路上。
                //    原来只有 onHostBattleEnd('defeat') 里落停顿，而那个回调的触发条件是
                //    `game.playerHero.getHostLegionId() === this.id`（见 Army.onBattleEnd）——
                //    军团被打光时，玩家 update 往往**先**跑到这里检测到 isDestroyed / troops<=0，
                //    detach() 把 hostLegionId 清成 null，等 Army.onBattleEnd 再回调时条件已不成立，
                //    onHostBattleEnd 根本不会执行，停顿也就从没落过 —— 主人看到的就是「一战败就走」。
                //    两条路都落一次，holdAfterDefeat 是幂等的（只改截止时刻），重复调用无害。
                this.holdAfterDefeat();
                // 🔴 不清 hostLegionId：让 onHostLost → finishQuest(false)/detach() 统一「清军团+退出势力+归零」。
                //    ⚠️ [2026-09-08] onHostLost 现在**无论有没有任务都会 detach**（见 PlayerQuestSystem.onHostLost），
                //    否则这里每帧重入、玩家被钉在死军团上动不了、自动模式也永不触发。
                this.resetMerit('随军军团解散');
                this.emitChange();
                this.onHostLost?.(lastId);
                // 兜底：回调没接线或它没解绑时自己清掉，绝不让这个分支空转
                if (this.hostLegionId === lastId) this.detach();
                return;
            }
            const p = host.getPosition();
            this.army.setPosition(p.lat, p.lng);
            this.army.isOnSea = host.isOnSea;
            const hr = host.getRenderer();
            if (host.isOnSea) {
                // 🔴 [2026-09-09 主人定] 有势力 → 画势力舰队兵模（shipKey 内部已按势力/军团取），
                //    玩家自己那条船在有势力时不显示。
                const hostShip = this.shipKey;
                this.army.navalShipAssetLock = hostShip;
                if (r) (r as any).navalShipAssetLock = hostShip;
            } else {
                this.army.navalShipAssetLock = null;
                if (r) (r as any).navalShipAssetLock = null;
            }
            if (r) {
                r.isOnSea = hr?.isOnSea ?? host.isOnSea;
                r.isMoving = hr?.isMoving ?? host.isMarching();
                r.isAttacking = hr?.isAttacking ?? false;
                r.currentBattleType = hr?.currentBattleType ?? null;
                r.targetPos = hr?.targetPos ?? null;
                // lastDirection 由 GlobalUnitRenderer 写在 IAnimatedUnit 上（UnitRenderer 类型未声明）
                const hd = (hr as unknown as { lastDirection?: number } | null)?.lastDirection;
                if (hd !== undefined) (r as unknown as { lastDirection?: number }).lastDirection = hd;
            }
            return;
        }
        // 🔴 [2026-09-11 主人定]「军团战败，玩家停留 5 秒再移动」：
        //    停顿期内不吃 dt、不续航追击 —— 坐标就钉在战败那一刻，5 秒后照令继续赶路。
        //    指令本身照常受理（没有加「停顿期不许下令」这条额外约束）：
        //    这 5 秒里自动模式重新选的目标、玩家手点的城，都会在停顿结束后自然出发。
        if (!this.isHeld()) {
            this.army.update(dt);
            // 追将领：每帧续航（军团在动，锚点跟着变；够近了就会面）
            if (this.chaseArmyId) this.stepChase();
        }
        if (this.army.isOnSea) {
            // 🔴 [2026-09-09 修] 原来写死 MERCHANT_SHIP（商船），与「初始海上兵模是独木舟」的定案不符。
            //    改成走 shipKey：有势力 = 势力舰队船，无势力 = 玩家自选（默认独木舟）。
            const ship = this.shipKey;
            this.army.navalShipAssetLock = ship;
            if (r) (r as any).navalShipAssetLock = ship;
        } else {
            this.army.navalShipAssetLock = null;
            if (r) (r as any).navalShipAssetLock = null;
        }
        if (r) {
            r.isOnSea = this.army.isOnSea;
            // 停顿期内人是钉住的：即便这 5 秒里已受理了新的行军指令（army 处于 marching），
            // 也不能播走路动画，否则会看到「原地踏步」
            r.isMoving = !this.isHeld() && this.army.isMarching();
            r.isAttacking = false;
            r.currentBattleType = null;
        }
    }

    /** 离玩家最近的据点（对话/HUD 用） */
    public nearestCity(): City | null {
        const pos = this.army.getPosition();
        let best: City | null = null;
        let bd = Infinity;
        for (const c of this.deps.cityManager.getCities()) {
            const d = getEuclideanDistance(pos, { lat: c.latitude, lng: c.longitude });
            if (d < bd) { bd = d; best = c; }
        }
        return bd <= PLAYER_CITY_ARRIVE_DIST ? best : null;
    }

    // ── 战术模式布置 ──────────────────────────────────────
    /** 军团进 13 时由 Scene13WarLayer 调：玩家不在军中返回 null（不布置） */
    public buildScene13Setup(followedOnDefenderSide: boolean): Scene13PlayerSetup | null {
        if (!this.hostLegionId) return null;
        const rank = this.getRank();
        // 🔴 [2026-09-18 主人定]「玩家永远不能改变军团的兵种」—— 不再下发 eliteLane。
        //    原先把玩家自选精锐传进 13、顶替编制里的一口，那是 AI 从「必须 9 支」反推的，
        //    主人原话（player-rules-verbatim 三·二 12a~12e）只讲控制权，没有一条允许玩家带兵改编制。
        return {
            side: followedOnDefenderSide ? 1 : 0,
            heroKey: this.heroKey,
            heroName: this.name,
            control: rank.control,
            unitKey: this.getSelectedUnit()?.unitKey ?? null,
            onKill: () => this.addMerit(20),
            onHeroDown: () => this.noteHeroDown(),
        };
    }

    // ── 存档 ──────────────────────────────────────────────
    public toSaveState(): PlayerSaveState {
        const p = this.army.getPosition();
        return {
            merit: this.merit,
            heroDowns: this.heroDowns,
            factionId: this.factionId,
            learnedUnits: this.learnedUnits.map((u) => ({ ...u })),
            selectedUnit: this.selectedUnit,
            manualUnitPick: this.manualUnitPick,
            nearbyFirst: this.nearbyFirst,
            autoPickUnit: this.autoPickUnit,
            learnedShips: [...this.learnedShips],
            selectedShip: this.selectedShip,
            lat: p.lat,
            lng: p.lng,
        };
    }

    public restoreSaveState(s: PlayerSaveState): void {
        this.hostLegionId = null;
        this.cancelChase();
        this.cancelTravel();
        this.merit = s.merit ?? 0;
        this.heroDowns = s.heroDowns ?? 0;
        this.learnedUnits = (s.learnedUnits ?? []).map((u) => ({ ...u }));
        this.selectedUnit = s.selectedUnit ?? -1;
        this.manualUnitPick = s.manualUnitPick ?? false;
        this.nearbyFirst = s.nearbyFirst ?? false;
        this.autoPickUnit = s.autoPickUnit ?? true;
        this.learnedShips = [...(s.learnedShips ?? [])];
        this.selectedShip = s.selectedShip ?? -1;
        if (s.factionId) this.joinFaction(s.factionId);
        else {
            this.factionId = null;
            this.army.setFactionId('');
            const renderer = this.army.getRenderer();
            if (renderer) renderer.factionId = '';
            this.syncMoveProfile();
        }
        if (Number.isFinite(s.lat) && Number.isFinite(s.lng)) this.army.setPosition(s.lat, s.lng);
        this.emitChange();
    }

    public static rankLabel(id: PlayerRank['id']): string {
        return PLAYER_RANKS.find((r) => r.id === id)?.name ?? id;
    }
}
