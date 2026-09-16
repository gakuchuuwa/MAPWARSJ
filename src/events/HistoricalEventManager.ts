import { TimeSystem } from '../app/TimeSystem';
import { CityManager } from '../world/CityManager';
import { GameMap } from '../map/GameMap';
import { CombatSystem } from '../combat/CombatSystem';
import { LegionManager } from '../legion/LegionManager';
import { SiegeManager } from '../combat/SiegeManager';
import { FieldBattleManager } from '../combat/FieldBattleManager';
import { BATTLE_OFFSET } from '../combat/MultiLegionFieldBattle';
import { EventVisualizer } from '../core/EventVisualizer';
import { GameTimeHUD } from '../ui/GameTimeHUD';
import type { Army } from '../legion/Army';
import type { FieldBattleData, HistoricalEvent, SiegeData } from '../types/core';
import { HISTORICAL_EVENT_SCRIPT } from '../data/HistoricalEventScript';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { getCultureLegionName } from '../types/CultureFormations';
import { getCityRegion } from '../systems/RegionSystem';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { markSpawnTierConsumed } from '../legion/LegionSpawnTier';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { joinStartToRoadPolyline } from '../core/DistanceUtils';
import { roadRegistry } from '../roads/RoadRegistry';
import { gameLog } from '../utils/GameLogger';
import { GameConfig } from '../config/GameConfig';
import { markBattlefieldFought } from './battlefieldState';
import { BATTLEFIELDS } from '../data/Battlefields';

/**
 * `ensureAttackerLegion` 的入参：**野战与攻城两种剧本数据共有的"攻方四件"**。
 * 🔴 [2026-09-12 主人令] 攻方军团的建立只有一套（起兵据点 / 主将 / 兵力 / 势力），
 *    野战 `FieldBattleData` 与攻城 `SiegeData` 的字段名完全一致 → 用这个交集类型共用，
 *    不复制第二份逻辑。
 */
type ScriptAttackerSpec = {
    attackerFactionId: string;
    attackerGeneralId?: string;
    attackerTroops?: number;
    attackerSourceCityId?: string;
};

export class HistoricalEventManager {
    private timeSystem: TimeSystem;
    private cityManager: CityManager;
    private map: GameMap;
    private combatSystem: CombatSystem;
    private gameTimeHUD?: GameTimeHUD;

    /** 开局点「播放」前为 true */
    private playbackPaused: boolean = true;

    private legionManager: LegionManager;
    private siegeManager: SiegeManager;
    private fieldBattleManager: FieldBattleManager;
    private eventVisualizer: EventVisualizer;

    public getLegionManager(): LegionManager { return this.legionManager; }
    public getSiegeManager(): SiegeManager { return this.siegeManager; }

    constructor(
        timeSystem: TimeSystem,
        cityManager: CityManager,
        map: GameMap,
        combatSystem: CombatSystem,
        gameTimeHUD?: GameTimeHUD
    ) {
        this.timeSystem = timeSystem;
        this.cityManager = cityManager;
        this.map = map;
        this.combatSystem = combatSystem;
        this.gameTimeHUD = gameTimeHUD;

        this.legionManager = new LegionManager(cityManager, map);
        this.eventVisualizer = new EventVisualizer(map);

        this.siegeManager = new SiegeManager(cityManager, this.legionManager, combatSystem, map, this.eventVisualizer);
        this.fieldBattleManager = new FieldBattleManager(cityManager, this.legionManager, combatSystem, map, this.eventVisualizer, this.siegeManager);

        this.legionManager.initContactEngine(combatSystem);
        this.legionManager.setSiegeManager(this.siegeManager);
        combatSystem.setReinforcementPollTargets(this.legionManager, this.siegeManager);
    }

    /** 开局点一次「播放」；再点则暂停推演 */
    public togglePlayback(): boolean {
        if (!this.playbackPaused) {
            this.playbackPaused = true;
            this.map.unlockCamera();
            this.timeSystem.setPaused(true);
            return false;
        }

        this.playbackPaused = false;
        this.timeSystem.setPaused(false);
        return true;
    }

    /** 军团移动 / 碰撞 / 增援（每帧） */
    public updateLegions(deltaTime: number): void {
        this.legionManager.update(deltaTime);
    }

    // ══════════════════════════════════════════════════════════════════
    // 历史脚本驱动器（2026-09-11 主人定「复活历史事件系统」）
    //
    // 铁律：**剧本独立于玩家发生**——不看玩家在不在、接不接任务。
    //   （现成的 `GeneralFirstExpeditionTargets` 走不通：那张表头定死了
    //    「仅跟拍军团会远征，AI 军团永不远征」，前提正是"玩家跟着他"。）
    //
    // 本片（第一片）只做：**把 -334 年事件的主角军团推出去、开赴战场**。
    //   尚未做（下一片）：抵达后刷野战、写死胜负、据点易主。
    //
    // ⚠️ 刻意**不挂** `GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS`：
    //    那个开关还兼管军事科技的年份门控，打开它会连带改变 13 的兵种五维口径
    //    （见 GameConfig 该字段注释）。故本驱动器恒定生效，与那个开关解耦。
    // ══════════════════════════════════════════════════════════════════

    /** 已触发的事件 key：同年同事件只跑一次（`updateEvents` 每帧都会被调） */
    private firedScriptEvents = new Set<string>();

    // [2026-09-12 撤] 我曾在这里另加一套「章节指针 + 间隔帧」的顺序链 —— 已删：
    //   项目里**早已有**顺序推进机制 `triggerNextScriptEvent()`（原注释就是主人那句
    //   「第一个事件结束直接去下一个地点，不等 year 递增」），我那套与它打架，
    //   还在完成回调里抢先清空 `scriptBattleCityUpdates` / `scriptBattleData`，
    //   导致**战后归属不上账、战场上不了图**。现全部回退，只保留 `updateEvents` 里
    //   "空闲时派下一条未触发事件"这一处改动。

    // [2026-09-11 删除] `scriptLegionIds` / `isScriptLegion()` 一并删除：
    //   它们只为上一版「玩家随剧本军 → 停募兵」判定而生，该判定已改为
    //   玩家面板开关 `PlayerHero.noLegionSpawn`（默认不出军团），此处再无消费者。

    // ── 剧本行军路线（2026-09-11 主人定）─────────────────────────────
    // 主人原话：「先去安菲波利斯，然后到洋河，然后到终点，出发战斗。」
    //   · 格拉尼库斯河岸 `(40.23, 27.24)` 是**终点/野战场**，**不是据点**——
    //     先前拿 `city_gelanikusi` 当锚点是我硬塞的，已撤。
    //   · 前两段是据点（军团只能以据点为目标，见 MoveToTarget：必须有 strategicId）；
    //     最后一段的野战场坐标由 `FieldBattleManager` 自己把双方行军过去
    //     （`MultiLegionFieldBattle` 复用军团时「从当前位置出发，不瞬移」），
    //     所以**不需要给引擎加"坐标目标"能力**。

    /** 当前剧本的行军航点（来自事件数据 `marchWaypoints`，逐事件独立；最后一段是野战场坐标，由野战处理器接管，不在此列） */
    private get marchWaypoints(): readonly string[] {
        // 🔴 [2026-09-12] 攻城剧本的航点走 `siegeData.marchWaypoints`（野战、攻城二选一，互斥）
        return this.scriptBattleData?.marchWaypoints ?? this.scriptSiegeData?.marchWaypoints ?? [];
    }

    /**
     * 🔴 [2026-09-12 主人「不触发战斗，修复」] 已翻回 true —— 抵达野战场后**照常开战**：
     *    刷守方军团、交野战处理器、按 `result` 写死胜负、落实 `cityUpdates` 据点易主。
     *    （2026-09-11 曾按「不交战」暂设 false：只行军到终点停驻。此开关只控制
     *    「抵达后是否开战」这一环，不拦前面的行军/豁免，故翻回即恢复完整战斗链。）
     */
    private static readonly SCRIPT_BATTLE_ENABLED = true;

    /** 当前走在第几段 */
    private marchWaypointIndex = 0;
    /** 是否已抵达剧本终点（野战场坐标）；抵达后解除远征锁、停驻不开战 */
    private scriptDestinationReached = false;
    /** 剧本主角军团 id */
    private scriptArmyId: string | null = null;
    /** 待打的那场野战的原始数据（含 location / 双方 / 兵力 / result） */
    private scriptBattleData: FieldBattleData | null = null;
    /** 该野战的 cityUpdates（写死归属） */
    private scriptBattleCityUpdates: HistoricalEvent['cityUpdates'] = undefined;
    /**
     * 剧本野战是否**已交给**野战处理器（防每帧重复触发）。
     * 交出去后若处理器报「缺少参战军团」（回调 winner 为空串），会被置回 false 允许重试。
     */
    private scriptBattleLaunched = false;

    /* ── 剧本攻城（2026-09-12 主人「写呀，不写怎么继续？」）──────────────────────────
     * 在此之前 `runScriptEvent` 只有 `field_battle` 一条分支，`EventType` 里早就留着的
     * `'siege'` 只会打印「本片未实现，跳过」；而剧本行军机器人的终点也写死是**野战场坐标**。
     * 于是文档 §7 章节表里规划的「米利都围城」「哈利卡纳苏斯攻城」和第三段「推罗围城战」
     * 全都无法按剧本触发（引擎本身能打攻城战 —— AI 攻城与野战战后链 `afterBattle:'siege'`
     * 都在调 `SiegeManager.startSiegeWithArmy`，缺的只是剧本侧这一段分派）。
     * ⚠️ 本段**不改任何既有行为**：野战那条路（`scriptBattleData`）原样保留，只有
     *    `scriptSiegeData` 非空时才改走攻城，二者互斥。
     */
    /** 待打的那场攻城的原始数据（含 defenderCityId / 双方 / 兵力 / result / title） */
    private scriptSiegeData: SiegeData | null = null;
    /** 该攻城的 cityUpdates（写死归属，照野战同名字段） */
    private scriptSiegeCityUpdates: HistoricalEvent['cityUpdates'] = undefined;
    /** 攻方是否已抵达目标城下（抵达才开打，防半路误判） */
    private scriptSiegeArrived = false;
    /** 是否已把攻城交给 `SiegeManager`（防每帧重复触发） */
    private scriptSiegeLaunched = false;

    // [2026-09-11 删除] 原先这里有一套「剧本期自动停募兵」状态机
    //   （开局 10 秒 / 玩家随剧本军 → 停，玩家退出 → 恢复，`resolveSpawnSuppressed`）。
    //   主人实测「还是有其他军团来捣乱」，并改定为
    //   「在玩家面板添加一个功能选项，**默认不出军团**」——
    //   故整块删除，改由 `PlayerHero.noLegionSpawn`（面板「🚫 不出军团」勾选，默认开）
    //   经 `RecruitmentSystem.isLegionSpawnPaused` 驱动。别再写回来。

    // ══════════════════════════════════════════════════════════════════
    // 供玩家任务条读取的**剧本真实进度**（2026-09-11 主人定 A 方案）
    //
    // 主人原话：「真历史剧本，还用问吗」——玩家随剧本军时，任务条必须显示
    // **真实历史目标**（「随亚历山大进军格拉尼库斯」），
    // 而不是引擎默认那套「随某某攻【某城】」。
    // 起因：剧本拿 `expeditionTargetCityId` 当**行军航点**用，而玩家任务系统把它当
    // 「要攻占的目标城」，于是任务条把"路过安菲波利斯"显示成了"攻打安菲波利斯"。
    // ══════════════════════════════════════════════════════════════════

    /**
     * 剧本主角军团的当前目标（**只对剧本主角军团返回**，别的一律 null）。
     * @returns `label` = 任务条文案尾段（如「进军格拉尼库斯」）；
     *          `done` = 该目标是否已达成（当前 = 已抵达终点/野战场坐标）。
     */
    public getScriptObjective(armyId: string | null | undefined): { label: string; done: boolean } | null {
        if (!this.isHistoricalEventsEnabled()) return null;
        if (!armyId || armyId !== this.scriptArmyId) return null;
        const loc = this.scriptBattleData?.location;
        // 目标地名取「距终点最近的据点」（终点在路网外，故用最近据点为名）→ 格拉尼库斯
        const near = loc ? this.nearestCityIdTo(loc.lat, loc.lng) : null;
        const city = near ? this.cityManager.getCity(near) : null;
        const place = city?.name ?? this.scriptBattleData?.title ?? '交战地点';
        return { label: `进军${place}`, done: this.scriptDestinationReached };
    }

    /** 距给定坐标最近的据点 id（欧氏度距，与全项目同口径） */
    private nearestCityIdTo(lat: number, lng: number): string | null {
        let best: string | null = null;
        let bestD = Infinity;
        for (const c of this.cityManager.getCities()) {
            const d = getEuclideanDistance({ lat, lng }, { lat: c.latitude, lng: c.longitude });
            if (d < bestD) { bestD = d; best = c.id; }
        }
        return best;
    }

    /**
     * 剧本推进（每帧，由 GameAppLoop 调用）。
     *
     * 🔴 [2026-09-12 主人「**不用看年月，一个脚本完成后，直接下一个，看年干什么**」]
     *    推进**只看数组顺序**：空闲时派「第一条还没触发过的事件」；
     *    一章打完（战后归属落定）由 `triggerNextScriptEvent` 立即接下一章 —— 那条早就有了，
     *    原注释就是主人的原话。此处**不再按 `ev.year === 当前年份` 匹配**：
     *    那样同一年只能跑一章，而推罗（前332年1–7月）与加沙（前332年9–10月）同属前 332 年，
     *    会被同一帧一起触发、互相顶掉状态。
     *    `year` / `season` 自此只作标题与展示。
     */
    public updateEvents(_deltaTime: number): void {
        if (!this.isHistoricalEventsEnabled()) return;
        // 有军团在行军 / 有野战待打 / 有攻城待打 → 只推进当前这一章，不派新的
        if (!this.scriptArmyId && !this.scriptBattleData && !this.scriptSiegeData) {
            this.triggerNextScriptEvent();
        }
        this.tickScriptRoute();
    }

    /** 剧本行军：逐段推进 → 走完据点航点即停（是否开战见 SCRIPT_BATTLE_ENABLED） */
    private tickScriptRoute(): void {
        const armyId = this.scriptArmyId;
        if (!armyId) return;
        const army = this.legionManager.getLegionById(armyId);
        if (!army || army.isDestroyed || army.getTroops() <= 0) {
            this.scriptArmyId = null;   // 主角军团没了，路线终止（续章规则待主人定）
            return;
        }
        const waypointId = this.marchWaypoints[this.marchWaypointIndex];
        if (waypointId) {
            const wp = this.cityManager.getCity(waypointId);
            if (!wp) { this.marchWaypointIndex++; return; }

            // 抵达判定沿用引擎自己的"到城半径"，不自造阈值
            const d = getEuclideanDistance(army.getPosition(), { lat: wp.latitude, lng: wp.longitude });
            if (d > GameConfig.SIEGE.COMBAT_RADIUS) {
                // 还没到本航点：确保它真的在往这儿走（战后停在野战场时行为树寻不到路，见 marchScriptArmyToWaypoint）
                if (army.isIdle()) this.marchScriptArmyToWaypoint(army, wp);
                return;
            }

            this.marchWaypointIndex++;
            const nextId = this.marchWaypoints[this.marchWaypointIndex];
            if (nextId) {
                army.expeditionTargetCityId = nextId;
                const next = this.cityManager.getCity(nextId);
                gameLog('expedition', `📜 [剧本] ${army.name} 过【${wp.name}】，续行【${next?.name ?? nextId}】`);
                return;
            }
            gameLog('expedition', `📜 [剧本] ${army.name} 抵【${wp.name}】（最后一个据点航点）`);
            // 走完据点航点：解除远征锁，改由本类直接驱车赶赴终点（野战场坐标）
            army.expeditionTargetCityId = null;
            army.setTargetCity(null);
            army.stopMovement(true);
        }

        // 赶赴终点（野战场坐标）：抵达即停，本阶段不交战。
        // 🔴 [2026-09-11 主人定「不交战」] 即便 SCRIPT_BATTLE_ENABLED=true（下一阶段），
        //    也先确保"抵达"再谈开战；此处只管把军团送到终点并停驻。
        // 🔴 [2026-09-12] 攻城的终点不是野战场坐标，而是**目标城本身** → 走另一条路，互斥。
        if (this.scriptSiegeData) { this.tickScriptSiege(army); return; }
        this.marchToScriptDestination(army);

        // 已抵达终点才轮到"是否开战"的裁决。
        if (!this.scriptDestinationReached || this.scriptBattleLaunched) return;
        if (!HistoricalEventManager.SCRIPT_BATTLE_ENABLED) {
            this.scriptBattleLaunched = true;   // 只作"已停驻"标记，防逐帧重复播报
            return;
        }
        this.launchScriptBattle(army);
    }

    /**
     * 把剧本军送去**当前据点航点**。
     *
     * 🔴 [2026-09-12 主人报障「打完第一仗后不去下一个目标」] 根因实测（puppeteer 跑完整条剧本链）：
     *    上一场野战的战场坐标（格拉尼库斯河岸）**不在路网上**——它是本类自己用
     *    `findPathOnRoad` + 就近贴路把军团送过去的。仗打完、战后驻留 5 秒结束后，
     *    行为树照常锁定下一个目标（`expeditionTargetCityId = city_tarsus`），但它走的是
     *    城际寻路 `moveLegionToCity`，**从路网外的战场起步必然失败**：
     *      · 控制台：`[LegionManager] 无法找到 伙伴骑兵 到城市 city_tarsus 的道路`
     *      · 行为树上下文：`lastMoveResult='failure'`、`recentFailedTargets=['city_tarsus']`
     *    寻路一失败 `giveUpUnreachable` 就把目标清了，下一帧远征锁又把它设回来，
     *    如此空转 —— 军团永远钉在上一个战场上（实测静止 70 秒以上仍不动）。
     *
     * 解法：先照常走城际寻路（路网内的正常情况，与原行为**完全一致**）；只有它失败时，
     * 才用赶赴战场那一套（`findPathOnRoad` → 贴路 → 落位）把军团接回路网。
     * ⚠️ 战后那 5 秒停留不在这里做：胜方 `startPostBattleRest`（乱斗模式战后驻留 5 秒，
     *    `GameConfig.TIME.POST_BATTLE_REST`）本来就会拦住移动，与乱斗军团同一条规矩。
     */
    private marchScriptArmyToWaypoint(army: Army, wp: { id: string; latitude: number; longitude: number }): void {
        /* 🔴 [2026-09-12 第二根因·实测] 光看 `moveLegionToCity` 的返回值**不够**：它会「谎报成功」。
         *   野战场紧挨敌城（格拉尼库斯河岸距敌城格拉尼库斯仅 0.201°，在 COMBAT_RADIUS+0.1 的攻城圈内），
         *   城际寻路解析出的首段落在那座敌城上，于是走进这条分支（LegionRoadMarch.moveLegionToCity）：
         *       if (distToCity <= siegeReach && army.isIdle()) { deps.triggerSiege(...); return true; }
         *   而剧本军团带着 `scriptMarchExempt`（主人定的「赶路期间不攻城」）→ triggerSiege 直接 'skipped'，
         *   什么也没发生，函数却照样 return true。
         *   卡死态实测：ret=true，调用前后都是 idle=true / pathQueue=0，只把 targetCity 写成了那座敌城。
         *   → 判据必须是「军团是不是真的动起来了」，不是那句返回值。
         */
        if (this.legionManager.moveLegionToCity(army, wp.id) && !army.isIdle()) return;

        const pos = army.getPosition();
        const dest = { lat: wp.latitude, lng: wp.longitude };
        const path = roadRegistry.findPathOnRoad(pos, dest);
        if (path && path.length >= 2) {
            const marchPath = joinStartToRoadPolyline(pos, path, GameConfig.ROAD.JOIN_EPS);
            army.moveAlongPath(marchPath.slice(1));
            gameLog('expedition', `📜 [剧本] ${army.name} 离开野战场，接回路网续行【${wp.id}】`);
            return;
        }
        // 连贴路都贴不上：就近落到路网上，下一帧由上面两条接手（与赶赴战场的兜底同一套）
        const snap = roadRegistry.findNearestRoadPoint(pos.lat, pos.lng, 50);
        if (snap) {
            army.setPosition(snap.lat, snap.lng);
        } else {
            // 🔴 [2026-09-12 主人报障「第一仗打完又不动了」] 战场 50 km 内无路（如格拉尼库斯河岸），
            //    就近贴路也贴不上：直接落位到航点坐标（阿达纳），下一帧正常接城际寻路续行。
            //    与「赶赴战场」贴不上就落位到终点同一口径（marchToScriptDestination 末尾）。
            army.setPosition(wp.latitude, wp.longitude);
        }
    }

    /**
     * 🔴 [2026-09-12 主人令「写呀，不写怎么继续？」] **剧本攻城**：把攻方军团送到**目标城**，
     * 抵达城下即把这一仗交给引擎现成的攻城入口（`SiegeManager.startSiegeWithArmy`）——
     * 就是 AI 攻城与野战战后链 `afterBattle:'siege'` 在用的同一个入口，不新写任何攻城逻辑。
     *
     * 抵达判定沿用引擎自己的「到城半径」`GameConfig.SIEGE.COMBAT_RADIUS`（与航点抵达同口径）。
     */
    private tickScriptSiege(army: Army): void {
        const sd = this.scriptSiegeData;
        if (!sd) return;
        const city = this.cityManager.getCity(sd.defenderCityId);
        if (!city) {
            gameLog('expedition', `📜 [剧本] 攻城目标城不存在：${sd.defenderCityId}，本片放弃`);
            this.scriptSiegeData = null;
            return;
        }
        const target = { lat: city.latitude, lng: city.longitude };

        if (getEuclideanDistance(army.getPosition(), target) <= GameConfig.SIEGE.COMBAT_RADIUS) {
            if (!this.scriptSiegeArrived) {
                this.scriptSiegeArrived = true;
                army.stopMovement(true);
                gameLog('expedition', `📜 [剧本] ${army.name} 已抵【${city.name}】城下`);
            }
            if (this.scriptSiegeLaunched) return;
            if (!HistoricalEventManager.SCRIPT_BATTLE_ENABLED) { this.scriptSiegeLaunched = true; return; }
            this.launchScriptSiege(army, city);
            return;
        }

        // 还没到：远征锁指向目标城；静止才重新规划，避免与正在走的路径打架
        army.expeditionTargetCityId = sd.defenderCityId;
        if (!army.isIdle()) return;
        this.marchScriptArmyToWaypoint(army, { id: city.id, latitude: city.latitude, longitude: city.longitude });
    }

    /**
     * 把攻城交给 `SiegeManager`（与野战 `launchScriptBattle` 同口径：先备齐双方，再交出去）。
     * ⚠️ 此处**解除** `scriptMarchExempt` —— 与野战开战时同一条规矩：行军期豁免、开打即恢复完整战斗链。
     */
    private launchScriptSiege(army: Army, city: { id: string; name: string }): void {
        const sd = this.scriptSiegeData;
        if (!sd) return;
        this.scriptSiegeLaunched = true;
        army.scriptMarchExempt = false;

        const siegeData: SiegeData = {
            ...sd,
            legionName: army.name,                              // 军团名以实际军团为准（命名铁律）
            attackerTroops: sd.attackerTroops ?? army.getTroops(),
        };
        gameLog('expedition',
            `📜 [剧本] 【${sd.title ?? '攻城'}】开战：${army.name} 攻【${city.name}】`
            + `（守将 ${sd.defenderGeneralId ?? '—'}，结果锁定 ${sd.result ?? '—'}）`);
        this.siegeManager.startSiegeWithArmy(army, siegeData, () => this.applyScriptSiegeCityUpdates());
    }

    /** 攻城战后的据点归属（**照野战 `applyScriptCityUpdates` 逐字同口径**：只写真城、走 cityManager.updateCity） */
    private applyScriptSiegeCityUpdates(): void {
        const updates = this.scriptSiegeCityUpdates;
        /* 🔴 [2026-09-13 主人报障「打完推罗，不打了」] 这里原来是 `if (!updates?.length) return;`，
         *   而且**从头到尾没有接下一章** —— 与野战那个孪生函数 `applyScriptCityUpdates`
         *   （末尾一句 `this.triggerNextScriptEvent()`）不对称，于是推罗打完整条链就断在这儿。
         *   更糟的是 `updateEvents` 的兜底派发条件是
         *     `!scriptArmyId && !scriptBattleData && !scriptSiegeData`
         *   而本章的 `scriptSiegeData` 一直挂着没人清 → 连那条兜底也永远进不来，双保险全焊死。
         *   现在：先落实归属（没有归属也照走），再照野战同一口径接下一章。 */
        for (const u of updates ?? []) {
            const city = this.cityManager.getCity(u.cityId);
            if (!city) continue;
            const data: { factionId?: string; troops?: number } = {};
            if (u.factionId) data.factionId = u.factionId;
            if (u.troops !== undefined) data.troops = u.troops;
            if (Object.keys(data).length === 0) continue;
            const from = city.factionId;
            this.cityManager.updateCity(u.cityId, data);
            gameLog('expedition',
                `📜 [剧本] 据点【${city.name}】归属写定：${from} → ${u.factionId ?? from}`);
        }
        // 与野战同一口径：本章收尾即接下一章（见本函数头注）
        this.triggerNextScriptEvent();
    }

    /**
     * 把剧本军沿路赶到**终点坐标**（`fieldBattleData.location`，格拉尼库斯河岸），
     * 抵达即解除远征锁、停驻待命。**不刷敌军、不开战。**
     *
     * 走法照抄野战处理器 `moveArmiesToBattleParallel` 的口径：`findPathOnRoad` 有路就沿路走，
     * 无路（终点在路网外约 10 km）就就近贴路；贴不上就**直接落位到终点精确坐标**。
     */
    private marchToScriptDestination(army: Army): void {
        const loc = this.scriptBattleData?.location;
        if (!loc) return;
        const pos = army.getPosition();

        if (getEuclideanDistance(pos, loc) <= GameConfig.SIEGE.COMBAT_RADIUS) {
            if (!this.scriptDestinationReached) {
                this.scriptDestinationReached = true;
                army.stopMovement(true);
                gameLog('expedition',
                    `📜 [剧本] ${army.name} 已抵达终点 (${loc.lat}, ${loc.lng})，本阶段不交战，原地待命`);
            }
            return;
        }

        // 还没到：只在军团静止时重新规划，避免与它正在走的路径打架
        if (!army.isIdle()) return;
        const path = roadRegistry.findPathOnRoad(pos, loc);
        if (path && path.length >= 2) {
            const marchPath = joinStartToRoadPolyline(pos, path, GameConfig.ROAD.JOIN_EPS);
            army.moveAlongPath(marchPath.slice(1));
            return;
        }
        // 无路直达终点：就近贴路（50 km 内），贴不上就落位到终点精确坐标
        const snap = roadRegistry.findNearestRoadPoint(loc.lat, loc.lng, 50);
        const finalPos = snap ? { lat: snap.lat, lng: snap.lng } : loc;
        army.setPosition(finalPos.lat, finalPos.lng);
    }

    /**
     * 走完据点航点 → 交给现成野战处理器：双方行军到野战场坐标、开打、**按 result 锁定胜负**。
     * 军团名在运行时取真源解析（不在脚本数据里再写一份，免得与 FactionCompositions 打架）。
     *
     * 🔴 [2026-09-11 主人报障「剧本军团擅自攻击洋河」] **本函数此前有一处致命漏洞**：
     *    它在「还没确认野战打得起来」之前就执行了 `army.scriptMarchExempt = false`。
     *    一旦野战因故没打成（例如守方军团没建起来 → 处理器报「缺少参战军团」而静默收场），
     *    剧本军就变成「**挂着远征目标 = 羊河这座敌城**、却已没有豁免」的普通军团
     *    → 行为树立刻按「攻占该城」办 → **擅自攻打洋河**（主人截图实锤）。
     *
     *    现在的铁律：**豁免只在剧本自己决定时解除，永不因"要去开打"而提前解除**；
     *    只要还有一丝没打成的可能，豁免就一直挂着（军团顶多原地待命，绝不自行开战）。
     */
    private launchScriptBattle(army: Army): void {
        const fb = this.scriptBattleData;
        if (!fb) return;
        const defenderCity = fb.defenderSourceCityId
            ? this.cityManager.getCity(fb.defenderSourceCityId)
            : null;
        const defenderLegionName = FACTION_COMPOSITIONS[fb.defenderFactionId]?.legionName
            || getCultureLegionName(defenderCity ? getCityRegion(defenderCity) : null);

        // 先把守方建出来（挂将），再交野战处理器——理由见 ensureDefenderLegion 注释
        if (!this.ensureDefenderLegion(fb, defenderLegionName)) {
            gameLog('expedition',
                `📜 [剧本] ⚠️ 守方军团【${defenderLegionName}】未能建立，本帧不开战；`
                + `豁免保持有效，军团原地待命（不会自行攻打任何目标），下帧重试`);
            return;   // scriptBattleLaunched 仍为 false → 下一帧重试
        }

        // ⚠️ 此处**刻意不解除 `army.scriptMarchExempt`**：解除时机见本函数注释与回调。
        this.scriptBattleLaunched = true;

        gameLog('expedition',
            `📜 [剧本] 【${fb.title ?? '野战'}】开战：${army.name} vs ${defenderLegionName}`
            + ` @(${fb.location?.lat}, ${fb.location?.lng})，结果锁定 ${fb.result}`);

        this.fieldBattleManager.handleFieldBattleEvent(
            {
                ...fb,
                attackerLegionName: army.name,
                defenderLegionName,
            },
            // ⚠️ 回调签名是 `() => void`（**无参**，不是 `(winner, armies)`——那是内层
            //    `handleMultiLegionBattle` 的回调签名，别混）。这里只用来落实写死的据点归属。
            //    成败不靠它判断：**双方军团已在上面备齐**（守方建不出来就直接 return、不打），
            //    故处理器那条「缺少参战军团」错误路径不可能再走到。
            () => this.applyScriptCityUpdates(),
        );
    }

    /**
     * 确保守方军团存在（剧本写死：谁、从哪出、多少兵）。
     *
     * ⚠️ 为什么不等 `MultiLegionFieldBattle` 自动创建：
     *   那条路创建军团时，**主将取自 `HISTORICAL_LEGIONS`（按军团名索引的旧事件表）**，
     *   而 `FieldBattleData.attackerGeneralId / defenderGeneralId` 在该文件里**零引用**
     *   （全文 grep 实测）。照那条路，**阿尔西提斯不会被挂上**，而 13 战术模式准入要求
     *   「双方都有将 + 都有精锐」，等于这场仗连 13 都进不去。
     *   所以这里自己把守方建出来（主将/兵力/精锐齐全），野战处理器按名找到现成军团时会
     *   **复用**（`army.setTroops(troops)` 写死兵力、保留主将）。
     *
     * 🔴 [2026-09-11 主人报障「**敌军又开始攻击其他据点了**」] **本函数此前也设计错了**：
     *    原来把守方**建在达斯基利翁**（波斯总督治所）当一支"出阵军团"——
     *    那是一支**活的 AI 军团**，野战一旦没打成（见 §15.9.3 那两条根因），它就自由了，
     *    立刻转头去攻打别的据点。主人原话：「**你为什么要刷敌军呢**，
     *    你让剧本军团抵达目的地后，**在野外直接刷兵开战**可以吗？」
     *
     *    现在的做法（照主人指示）：**守方不在开局/路途中刷**，只在
     *    「剧本军已抵达目的地、要开打的那一刻」**在野战场当场刷出来**，
     *    并且**立刻打上 `scriptMarchExempt`** —— 它是一支只为这一仗而生的部队，
     *    **永远不许自行行军、攻城或与其他军团交战**。
     *    （它随即被野战处理器接管：`collectArmies` 会 `stopMovement()`，
     *      且因它就在战场原地 → 走"极短距离即时抵达"分支，战斗立刻开始。）
     *
     * 兵力以剧本数为准（25000）；**这一仗的敌军是"野战当场刷出来"的，不从达斯基利翁抽调**，
     * 故**不再动该城驻军**（原先把城池驻军清零属多余副作用）。
     */
    private ensureDefenderLegion(fb: FieldBattleData, legionName: string): Army | null {
        const generalId = fb.defenderGeneralId ?? null;
        if (generalId) {
            const existing = this.legionManager.getArmies().find(
                (a) => !a.isDestroyed && a.getTroops() > 0 && a.generalId === generalId,
            );
            if (existing) {
                // 🔴 [2026-09-12 主人报障「敌军抵达战争点还移动」] 复用的乱斗军团也必须静止：
                //    打上豁免 + 停步，让它不再自主行军/攻城，老老实实等亚历山大抵达开打。
                existing.scriptMarchExempt = true;
                existing.isScriptArmy = true;
                existing.stopMovement(true);
                return existing;
            }
        }
        const loc = fb.location;
        if (!loc) return null;
        const cityId = fb.defenderSourceCityId ?? null;

        const troops = fb.defenderTroops ?? 10000;
        const army = this.legionManager.createLegion(
            // 🔴 **野战场原地刷兵**（不是从达斯基利翁出阵）。
            // 🔴 [2026-09-12 主人报障「抵达伊苏斯后守军也跟着动、还要转圈圈」] 刷兵点直接取
            //    野战处理器给守方定的**对阵位**（location.lng + BATTLE_OFFSET）：
            //    原来刷在 location 正中，开战时 MultiLegionFieldBattle 会把它往东拽 0.14°(≈12 km)。
            //    伊苏斯的战场坐标正好压在据点伊苏斯上（在路网里），`findPathOnRoad` 给得出路，
            //    守军就真的沿着路绕过去 = 主人看到的「跟着动、转圈圈」；格拉尼库斯那场战场离路网
            //    10 km、无路可走，走的是「直接落位」分支，所以那一场看不出来。
            //    （海陆掩膜实测两处战场都是 land，与海路无关。）
            //    刷在对阵位上 → 距离 0 → 走「即时抵达」分支，守军一步不挪，原地等攻方压上来。
            //    ⚠️ 偏移量只许从 MultiLegionFieldBattle 导入，别在这儿写第二个 0.14。
            { lat: loc.lat, lng: loc.lng + BATTLE_OFFSET },
            troops,
            fb.defenderFactionId,
            legionName,
            undefined,          // onArrive
            undefined,          // legionType（按文化区定）
            cityId ?? undefined,   // sourceCityId：仅作文化区/编制判定用，不作行军起点
            generalId ?? undefined,
            true,               // forceCreate：剧本不受军团上限卡住
        );
        if (!army || !this.legionManager.getLegionById(army.id)) return null;

        army.setTroops(troops);
        army.isElite = true;
        if (generalId && !army.generalId) army.generalId = generalId;
        const rec = generalId ? getGeneralRecordByGeneralId(generalId) : null;
        if (rec?.portrait) army.portraitPath = rec.portrait;
        // 🔴 **不许它自行去打仗**：与剧本军同一套豁免（不交战 / 不攻城 / 不掉兵）。
        //    它只为这一仗而生，打完由剧本处置，绝不放到地图上乱跑。
        army.scriptMarchExempt = true;
        army.isScriptArmy = true;   // 🔴 [2026-09-12 主人定] 剧本军团身份（与行军豁免分开）
        if (cityId) {
            const city = this.cityManager.getCity(cityId);
            // 只标记"该城的将/精已用于剧本"，防同将被重复用到别处；**不动城池驻军**。
            if (city) markSpawnTierConsumed(city, { general: true, elite: true });
        }
        gameLog('expedition',
            `📜 [剧本] 野战场就地刷出【${legionName}】${troops} 兵，主将 ${generalId ?? '无'}`
            + ` @(${loc.lat}, ${(loc.lng + BATTLE_OFFSET).toFixed(4)})（守方对阵位；已上豁免：不会自行行军或攻城）`);
        return army;
    }

    /**
     * 野战结束后落实写死的据点归属（`HistoricalEvent.cityUpdates`）。
     *
     * 走 `CityManager.updateCity` —— 这是全项目唯一正规的易主接口，它会一并处理
     * 旗号刷新（`applyFactionChangeVisual`）、`fallenAtYear`、将/精名额重置与占城播报回调；
     * **不自己写 `city.factionId = ...`**（那样旗号与领土色块不会更新）。
     */
    private applyScriptCityUpdates(): void {
        console.error('[剧本] applyScriptCityUpdates 触发, 本场=', this.scriptBattleData?.title);
        const updates = this.scriptBattleCityUpdates;
        if (updates?.length) {
            for (const u of updates) {
                const city = this.cityManager.getCity(u.cityId);
                if (!city) continue;
                const data: { factionId?: string; troops?: number } = {};
                if (u.factionId) data.factionId = u.factionId;
                if (u.troops !== undefined) data.troops = u.troops;
                if (Object.keys(data).length === 0) continue;
                const from = city.factionId;
                this.cityManager.updateCity(u.cityId, data);
                gameLog('expedition',
                    `📜 [剧本] 据点【${city.name}】归属写定：${from} → ${u.factionId ?? from}`);
            }
        }
        // 🔴 [2026-09-12 主人定] 打完了才叫战场：按本场剧本坐标找到**对应的战场**，标记它上图。
        //    ⚠️ 战场已**独立于据点体系**（`src/data/Battlefields.ts` 的 `bf_*`，不是 `city_*`），
        //       所以这里查的是战场表，**不再去 `cityManager` 里找同坐标据点**（那是旧架构）。
        const loc = this.scriptBattleData?.location;
        if (loc) {
            for (const bf of BATTLEFIELDS) {
                if (getEuclideanDistance(loc, { lat: bf.lat, lng: bf.lng })
                    <= GameConfig.SIEGE.COMBAT_RADIUS) {
                    markBattlefieldFought(bf.id);   // 触发 BattlefieldLayer 重绘：地名 + 战场形态
                    gameLog('expedition', `📜 [剧本] 战场【${bf.name}】战斗结束，上图（地名 + 战场形态）`);
                }
            }
        }
        // 🔴 [2026-09-12 主人定「第一个事件结束直接去下一个地点」]
        //    战斗打完立即触发下一条剧本事件，不等 year 递增（原「按年匹配」会让军团原地等一年）。
        this.triggerNextScriptEvent();
    }

    /** 触发下一条未触发的剧本事件（顺序驱动） */
    private triggerNextScriptEvent(): void {
        if (!this.isHistoricalEventsEnabled()) return;
        console.error('[剧本] triggerNextScriptEvent, 已触发=', [...this.firedScriptEvents]);
        for (const ev of HISTORICAL_EVENT_SCRIPT) {
            const key = `${ev.year}#${ev.title ?? ev.description}`;
            if (this.firedScriptEvents.has(key)) continue;
            console.error('[剧本] 触发下一条=', ev.title);
            this.firedScriptEvents.add(key);
            this.runScriptEvent(ev);
            return;
        }
        console.error('[剧本] 没有下一条了');
    }

    /** 单条事件的执行入口（按 type 分派） */
    private runScriptEvent(ev: HistoricalEvent): void {
        if (ev.type === 'field_battle' && ev.fieldBattleData) {
            this.dispatchAttackerToBattlefield(ev, ev.fieldBattleData);
            return;
        }
        // 🔴 [2026-09-12] 剧本攻城分支（`EventType` 里一直有 `'siege'`，此前未实现）
        if (ev.type === 'siege' && ev.siegeData) {
            this.dispatchAttackerToSiege(ev, ev.siegeData);
            return;
        }
        gameLog('startup', `📜 [剧本] ${ev.title ?? ev.year} type=${ev.type} 本片未实现，跳过`);
    }

    /**
     * 把事件攻方推上战场：确保主角有军团 → 起第一段行军 → 交给路线推进器。
     *
     * 🔴 [2026-09-11 主人定] 终点是**野战场坐标**，不是据点。
     *   先前我把 `city_gelanikusi`（距战场 10.9 km 的城寨）当"行军锚点"硬塞进来，
     *   是错的、已撤——那座城在剧本里不承担任何胜负与归属（归属翻的是达斯基利翁）。
     */
    private dispatchAttackerToBattlefield(ev: HistoricalEvent, fb: FieldBattleData): void {
        const army = this.ensureAttackerLegion(fb);
        if (!army) {
            gameLog('startup', `📜 [剧本] ${ev.title ?? ev.year} 攻方军团未能建立，本片放弃`);
            return;
        }
        const firstWaypointId = (fb.marchWaypoints ?? [])[0];
        console.error('[剧本] dispatchAttackerToBattlefield, army=', army.name,
            'troops=', army.getTroops(), 'generalId=', fb.attackerGeneralId, '航点=', firstWaypointId);
        if (!firstWaypointId) {
            gameLog('startup', `📜 [剧本] ${ev.title ?? ev.year} 未配行军航点，放弃`);
            return;
        }
        // 记下本场剧本的"主角军团 + 待打野战 + 战后归属"，交给 tickScriptRoute 逐段推进
        this.scriptArmyId = army.id;
        this.scriptBattleData = fb;
        this.scriptBattleCityUpdates = ev.cityUpdates;
        // 🔴 [2026-09-13] 清掉上一章的攻城状态（理由见 dispatchAttackerToSiege 同位置注释：两条通道互斥）
        this.scriptSiegeData = null;
        this.scriptSiegeCityUpdates = undefined;
        this.scriptSiegeArrived = false;
        this.scriptSiegeLaunched = false;
        this.marchWaypointIndex = 0;
        // 🔴 [2026-09-12] 每事件重置两个瞬态标志，防上一场（-334）的「已抵达/已开战」残留卡死本场（-333）。
        this.scriptDestinationReached = false;
        this.scriptBattleLaunched = false;

        army.expeditionUnlocked = true;
        army.expeditionTargetCityId = firstWaypointId;   // 目标锁死：断粮不回师（LegionSpawnPolicy）
        // 🔴 [2026-09-11 主人定]「赶赴战场期间不予其他任何人交战」＋「剧本军团没有 15 秒兵力消耗」——
        //    详见 Army.scriptMarchExempt（野战两边 / 敌城 ZOC / 攻城总咽喉 / **行军减兵** 四处）。
        //    抵达野战场、按剧本开打时由 launchScriptBattle 解除。
        army.scriptMarchExempt = true;
        army.isScriptArmy = true;   // 🔴 [2026-09-12 主人定] 剧本军团身份（与行军豁免分开）

        const wp = this.cityManager.getCity(firstWaypointId);
        gameLog('expedition',
            `📜 [剧本] ${ev.title ?? ev.year}：${army.name}【${army.generalId ?? '无将'}】自佩拉启程，首赴【${wp?.name ?? firstWaypointId}】`);
    }

    /**
     * 🔴 [2026-09-12 主人令] **剧本攻城**：与野战同一条路，只有「终点」不同——
     * 野战终点是野战场坐标（由野战处理器接管），攻城终点是**目标城本身**（抵达即交给 `SiegeManager`）。
     * 攻方军团的建立、行军航点、行军豁免、剧本军团身份，全部与野战共用同一套（`ensureAttackerLegion`）。
     */
    private dispatchAttackerToSiege(ev: HistoricalEvent, sd: SiegeData): void {
        const army = this.ensureAttackerLegion(sd);
        if (!army) {
            gameLog('startup', `📜 [剧本] ${ev.title ?? ev.year} 攻方军团未能建立，本片放弃`);
            return;
        }
        const firstWaypointId = (sd.marchWaypoints ?? [])[0];
        if (!firstWaypointId) {
            // 未配航点时退化为"直接奔目标城"（唯一航点 = 目标城），仍是合法行军
            gameLog('startup', `📜 [剧本] ${ev.title ?? ev.year} 未配行军航点 → 直接奔目标城 ${sd.defenderCityId}`);
        }
        this.scriptArmyId = army.id;
        this.scriptSiegeData = sd;
        this.scriptSiegeCityUpdates = ev.cityUpdates;
        /* 🔴 [2026-09-13] 开新章必须把**上一章**的野战状态清干净。
         *   `marchWaypoints` 取的是 `scriptBattleData?.marchWaypoints ?? scriptSiegeData?.marchWaypoints`
         *   —— 野战优先。上一章（伊苏斯）的 fieldBattleData 若不清，本章（推罗）走的就是
         *   **伊苏斯那串航点**；而 tickScriptRoute 里「赶赴野战场 / 开野战」两段也会照旧成立。
         *   两章都是攻城时同理。互斥的两条通道，任何时刻只许有一条挂着数据。 */
        this.scriptBattleData = null;
        this.scriptBattleCityUpdates = undefined;
        this.scriptDestinationReached = false;
        this.scriptBattleLaunched = false;
        this.marchWaypointIndex = 0;
        this.scriptSiegeArrived = false;
        this.scriptSiegeLaunched = false;

        army.expeditionUnlocked = true;
        army.expeditionTargetCityId = firstWaypointId ?? sd.defenderCityId;
        army.scriptMarchExempt = true;   // 行军期豁免（抵达城下、开打时由 launchScriptSiege 解除）
        army.isScriptArmy = true;

        const wp = firstWaypointId ? this.cityManager.getCity(firstWaypointId) : null;
        const target = this.cityManager.getCity(sd.defenderCityId);
        gameLog('expedition',
            `📜 [剧本] ${ev.title ?? ev.year}：${army.name}【${army.generalId ?? '无将'}】启程，首赴`
            + `【${wp?.name ?? firstWaypointId ?? target?.name ?? sd.defenderCityId}】，目标【${target?.name ?? sd.defenderCityId}】`);
    }

    /**
     * 确保事件攻方有军团可用：
     *   ① 已有该武将的军团（开局募兵恰好出了他）→ 直接用，不动城防；
     *   ② 没有 → 从出兵据点**起兵**：本城驻军全部转入军团，城防归零（兵力守恒）。
     *
     * 与 `PlayerQuestSystem.raiseLegion` 同口径（那是玩家对话触发的版本，绑在对话流程上），
     * 此处是**剧本侧不依赖玩家**的版本。两处刻意并存，不去抽公共函数——
     * 抽了就要改玩家系统的既有逻辑，超出本片范围。
     *
     * 军团名取 `FACTION_COMPOSITIONS[势力].legionName || getCultureLegionName(文化区)`
     *   （马其顿 =「古典时代马其顿军团」）。**不学玩家侧拿精锐番号当军团名**——
     *   命名铁律：军团名是「时代+文化+军团」，精锐番号只进战力标签。
     */
    private ensureAttackerLegion(fb: ScriptAttackerSpec): Army | null {
        const generalId = fb.attackerGeneralId ?? null;

        if (generalId) {
            const existing = this.legionManager.getArmies().find(
                (a) => !a.isDestroyed && a.getTroops() > 0 && a.generalId === generalId,
            );
            if (existing) {
                // 🔴 [2026-09-12 主人定「按历史」] 复用军团时兵力重置到史料值：
                //    每场战役按史料兵力（attackerTroops）开战，不继承上一场的战损。
                if (fb.attackerTroops) existing.setTroops(fb.attackerTroops);
                return existing;
            }
        }

        const cityId = fb.attackerSourceCityId;
        if (!cityId) return null;
        const city = this.cityManager.getCity(cityId);
        if (!city) return null;

        // 🔴 [2026-09-11 主人报障「**马其顿的兵力也不对呀**，刚才不是告诉你剧本兵力了」]
        //    **原写法只取佩拉驻军（`city.troops` = 10000），把剧本写死的
        //      `fieldBattleData.attackerTroops`（35000）整个丢了** —— 马其顿军一路只有 1 万，
        //    与剧本兵数差了三倍半，纯粹是 AI 没照剧本做。
        //    行军/驻守阶段的兵力**必须以剧本为准**；驻军数只作为"剧本没写"时的兜底。
        const troops = fb.attackerTroops ?? Math.max(1, city.troops || 0);
        const region = getCityRegion(city);
        const legionName = FACTION_COMPOSITIONS[fb.attackerFactionId]?.legionName
            || getCultureLegionName(region);

        const army = this.legionManager.createLegion(
            { lat: city.latitude, lng: city.longitude },
            troops,
            fb.attackerFactionId,
            legionName,
            undefined,          // onArrive
            undefined,          // legionType（由 applyLegionCultureComposition 按文化区定）
            city.id,            // sourceCityId
            generalId ?? undefined,
            true,               // forceCreate：剧本不受 MAX_ACTIVE_LEGIONS 上限卡住
        );
        if (!army || !this.legionManager.getLegionById(army.id)) return null;

        army.setTroops(troops);
        // 兵力守恒：首都驻军随军出征、城防归零（与玩家起兵同口径）。
        // 注：剧本兵数（35000）可高于驻军（10000），高出的部分是剧本写死的，
        //     与引擎自身那条「征兵不足则系统强制补给」同口径。
        city.troops = 0;
        army.isElite = true;
        army.homeCityId = city.id;
        if (generalId && !army.generalId) army.generalId = generalId;
        const rec = generalId ? getGeneralRecordByGeneralId(generalId) : null;
        if (rec?.portrait) army.portraitPath = rec.portrait;
        // 将/精随军离城：据点档位标记消耗，城防不再影分身（与募兵/玩家起兵同口径）
        markSpawnTierConsumed(city, { general: true, elite: true });

        gameLog('expedition',
            `📜 [剧本] ${city.name} 起兵【${army.name}】${troops} 兵（剧本写死 ${fb.attackerTroops ?? '—'}），主将 ${generalId ?? '无'}`);
        return army;
    }

    public isHistoricalEventsEnabled(): boolean { return GameConfig.SYSTEM.ENABLE_SCRIPT_EVENTS; }

    public setScriptModeEnabled(enabled: boolean): void {
        if (this.isHistoricalEventsEnabled() === enabled) return;
        GameConfig.SYSTEM.ENABLE_SCRIPT_EVENTS = enabled;
        if (enabled) return;

        // 已交给战斗系统的交战继续结算，但不再派发下一章。
        const battleLaunched = this.scriptBattleLaunched || this.scriptSiegeLaunched;
        for (const army of this.legionManager.getArmies()) {
            if (!army.isScriptArmy) continue;
            army.isScriptArmy = false;
            army.scriptMarchExempt = false;
            army.expeditionTargetCityId = null;
            army.clearSavedMarchState();
            if (!battleLaunched && !army.getIsInCombat()) {
                army.stopMovement();
                army.setTargetCity(null);
            }
        }
        if (!battleLaunched) {
            this.scriptArmyId = null;
            this.scriptBattleData = null;
            this.scriptSiegeData = null;
            this.scriptBattleCityUpdates = undefined;
            this.scriptSiegeCityUpdates = undefined;
        }
    }

    /** @deprecated 历史事件系统已移除 */
    public reloadEvents(): void {}

    /** @deprecated 历史事件系统已移除 */
    public onEventTriggered(): void {}

    /** @deprecated 历史事件系统已移除 */
    public skipCurrentEvent(): void {}

    /** @deprecated 历史事件系统已移除 */
    public getEventHistory(): never[] { return []; }
}
