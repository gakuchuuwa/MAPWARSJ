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
import { getGeneralRecordByGeneralId, getFactionIdOfGeneral } from '../data/FactionGenerals';
import { markSpawnTierConsumed } from '../legion/LegionSpawnTier';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { joinStartToRoadPolyline } from '../core/DistanceUtils';
import { roadRegistry } from '../roads/RoadRegistry';
import { gameLog } from '../utils/GameLogger';
import { GameConfig } from '../config/GameConfig';
import { markBattlefieldFought, isBattlefieldFought, setActiveBattleTitle } from './battlefieldState';
import { BATTLEFIELDS, matchesBattlefield } from '../data/Battlefields';
// 🔴 [2026-09-19 主人令「精锐凭什么不能挂战场」] 精锐**按势力**取番号与档位：
//    表就是 `factionId → { name, tier }`（各区 ExpeditionLegions），与据点无关。
import { getExpeditionEliteConfig } from '../data/ExpeditionLegions';

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

    /**
     * 🔴 [2026-09-12 主人「不触发战斗，修复」] 已翻回 true —— 抵达野战场后**照常开战**：
     *    刷守方军团、交野战处理器、按 `result` 写死胜负、落实 `cityUpdates` 据点易主。
     *    （2026-09-11 曾按「不交战」暂设 false：只行军到终点停驻。此开关只控制
     *    「抵达后是否开战」这一环，不拦前面的行军/豁免，故翻回即恢复完整战斗链。）
     */
    /** 当前走在第几段 */
    /** 是否已抵达剧本终点（野战场坐标）；抵达后解除远征锁、停驻不开战 */
    /** 剧本主角军团 id */
    /** 待打的那场野战的原始数据（含 location / 双方 / 兵力 / result） */
    /** 该野战的 cityUpdates（写死归属） */
    /**
     * 剧本野战是否**已交给**野战处理器（防每帧重复触发）。
     * 交出去后若处理器报「缺少参战军团」（回调 winner 为空串），会被置回 false 允许重试。
     */
    /* ── 剧本攻城（2026-09-12 主人「写呀，不写怎么继续？」）──────────────────────────
     * 在此之前 `runScriptEvent` 只有 `field_battle` 一条分支，`EventType` 里早就留着的
     * `'siege'` 只会打印「本片未实现，跳过」；而剧本行军机器人的终点也写死是**野战场坐标**。
     * 于是文档 §7 章节表里规划的「米利都围城」「哈利卡纳苏斯攻城」和第三段「推罗战役」
     * 全都无法按剧本触发（引擎本身能打攻城战 —— AI 攻城与野战战后链 `afterBattle:'siege'`
     * 都在调 `SiegeManager.startSiegeWithArmy`，缺的只是剧本侧这一段分派）。
     * ⚠️ 本段**不改任何既有行为**：野战那条路（`scriptBattleData`）原样保留，只有
     *    `scriptSiegeData` 非空时才改走攻城，二者互斥。
     */
    /** 待打的那场攻城的原始数据（含 defenderCityId / 双方 / 兵力 / result / title） */
    /** 该攻城的 cityUpdates（写死归属，照野战同名字段） */
    /** 攻方是否已抵达目标城下（抵达才开打，防半路误判） */
    /** 是否已把攻城交给 `SiegeManager`（防每帧重复触发） */
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
     * 🔴 [2026-09-14 主人定]「删除之前的剧本开关设定，以后没有剧本了，就是乱斗模式中加战场玩法。」
     *    逐年剧本事件链（航点行军 / 按年推进 / 战后写死据点归属）已整套删除，共 665 行。
     *    保留的是**战场玩法**（见下方 startBattlefieldBattle）与军团行军 `updateLegions`。
     *    本方法只剩空壳：GameAppLoop 仍每帧调它，留个入口免得四处改调用方。
     */
    public updateEvents(_deltaTime: number): void { /* 剧本已删除，战场玩法不需要每帧推进 */ }

    // ══════════════════════════════════════════════════════════════════
    // 战场玩法（2026-09-14 主人定，取代已删除的剧本系统）
    //
    // 主人原话逐条：
    //   ·「武将如果出征，说明不能套用，哪能东边打仗西边也打仗，必须是武将在城，再能触发战场事件。」
    //   ·「一个战场只能打一次，打完出现遗址据点样式。」
    //   ·「双方武将，兵力，地点，必须符合历史。」（数据在 Battlefields/战役表里，此处只负责照搬）
    //   ·「玩家可以选择加入哪一方。玩家要抵达战场才能触发。」
    // ══════════════════════════════════════════════════════════════════

    /** 正在打的那个战场 id：防连点刷出多支军团 */
    private battlefieldBattleRunning: string | null = null;

    /** 玩家要走到这么近（km）才算「抵达战场」，可以触发 */
    public static readonly BATTLEFIELD_TRIGGER_KM = 30;

    /**
     * 战役打完 → 双方军团**撤场**（不留在乱斗棋盘上）。
     *
     * 🔴 [2026-09-14 主人问「是继续随军参战呢，还是直接消失呢」] 选择「撤场」，硬理由有三条：
     *   ① **主帅必须回城，否则下一个战场永远打不开。** 按主人自己定的规矩「必须武将在城，
     *      再能触发战场事件」，亚历山大要是打完格拉尼库斯就一直挂在场上带兵，
     *      伊苏斯（同样由他主战）就永远触发不了 —— 两个战场直接废掉一个。
     *   ② 这两支军团是**为这一仗凭空生成的史实兵力**（4 万 / 8 万），而乱斗里一座城才 3 万、
     *      出兵门槛 2 万。留下等于白送一支超规格大军，棋盘立刻被扰乱。
     *   ③ 历史痕迹已经由**战场遗址**留在图上了，不需要军团继续杵在那儿。
     *
     * 停 8 秒再撤：让 13 打完的结算画面走完，观众看清战果，不至于一结束就凭空蒸发。
     */
    private withdrawBattlefieldLegions(bfName: string, ...armies: Army[]): void {
        setTimeout(() => {
            for (const army of armies) {
                if (!army || !this.legionManager.getLegionById(army.id)) continue;   // 已经没了就别重复清
                // 🔴 [2026-09-16 主人报障「战役结束后亚历山大军团不消失」]
                //    原来直接 removeArmy —— 整支军团连人带旗**凭空瞬消**，很突兀。
                //    改走 disband()：它触发 beginDespawnFade()，与尸体同一套渐隐
                //    （DESPAWN_FADE_OUT_MS 5s，LegionManager 在 CORPSE_DISPLAY_MS 15s 后才真正移出，
                //     渐隐播得完）。disband 还会标 wasDisbanded —— 班师不算战败，
                //    不给锚点城挂将/精锐冷却，下一场战役照常出将。
                army.disband();
            }
            gameLog('expedition', `⚔️ [战场]【${bfName}】双方班师，主帅归城（下一个战场方可触发）`);
        }, 8000);
    }

    /** 战场坐标（玩家赶路用） */
    public locateBattlefield(bfId: string): { lat: number; lng: number } | null {
        const bf = BATTLEFIELDS.find((b) => b.id === bfId);
        return bf ? { lat: bf.lat, lng: bf.lng } : null;
    }

    /** 战场对应的战役数据（按坐标就近匹配，支持野战与攻城战） */
    public findBattleForBattlefield(bfId: string): (FieldBattleData & {
        defenderCityId?: string;
        /** 战场要塞：攻城目标就是这块战场本身（一之谷），不是据点 */
        targetBattlefieldId?: string;
        type?: 'field_battle' | 'siege';
        cityUpdates?: Array<{ cityId: string; factionId?: string; troops?: number }>;
    }) | null {
        const bf = BATTLEFIELDS.find((b) => b.id === bfId);
        if (!bf) return null;
        for (const ev of HISTORICAL_EVENT_SCRIPT) {
            if (ev.type === 'field_battle') {
                const fb = ev.fieldBattleData;
                if (!fb?.location) continue;
                // 🔴 [2026-09-17] 配对判据统一到 matchesBattlefield（同年 + 坐标接近）。
                //    改之前这里不看年份，同一地点第二场战役必配错；且容差与编辑器不一致。见该函数长注释。
                if (matchesBattlefield(bf, ev.year, fb.location)) {
                    return { ...fb, type: 'field_battle', cityUpdates: ev.cityUpdates };
                }
            } else if (ev.type === 'siege') {
                const sd = ev.siegeData;
                if (!sd) continue;
                // 🔴 [2026-09-19 主人定「建立一个一之谷战场」] **战场要塞**（`targetBattlefieldId`）：
                //    一之谷是战场不是据点，攻城目标就是它自己 —— 守方势力从守将反查，坐标取战场。
                if (sd.targetBattlefieldId) {
                    if (bf.id !== sd.targetBattlefieldId) continue;
                    return {
                        title: sd.title ?? ev.title,
                        description: sd.description ?? ev.description,
                        location: { lat: bf.lat, lng: bf.lng },
                        attackerFactionId: sd.attackerFactionId,
                        attackerGeneralId: sd.attackerGeneralId,
                        attackerTroops: sd.attackerTroops,
                        attackerSourceCityId: sd.attackerSourceCityId ?? sd.attackerCityId,
                        attackerLegionName: sd.attackerLegionName,
                        defenderFactionId: getFactionIdOfGeneral(sd.defenderGeneralId) ?? 'panjun',
                        defenderGeneralId: sd.defenderGeneralId,
                        defenderTroops: sd.defenderTroops ?? 10000,
                        defenderSourceCityId: bf.id,
                        defenderCityId: bf.id,          // 攻城链的目标 id（合成目标用它）
                        defenderLegionName: sd.defenderLegionName,
                        type: 'siege',
                        targetBattlefieldId: bf.id,
                        cityUpdates: ev.cityUpdates,
                        result: sd.result,
                        autoEnterRTS: sd.autoEnterRTS,
                    };
                }
                if (!sd.defenderCityId) continue;
                const city = this.cityManager.getCity(sd.defenderCityId);
                if (!city) continue;
                if (matchesBattlefield(bf, ev.year, { lat: city.latitude, lng: city.longitude })) {
                    return {
                        title: sd.title ?? ev.title,
                        description: sd.description ?? ev.description,
                        location: { lat: city.latitude, lng: city.longitude },
                        attackerFactionId: sd.attackerFactionId,
                        attackerGeneralId: sd.attackerGeneralId,
                        attackerTroops: sd.attackerTroops,
                        attackerSourceCityId: sd.attackerSourceCityId ?? sd.attackerCityId,
                        attackerLegionName: sd.attackerLegionName,
                        defenderFactionId: city.factionId,
                        defenderGeneralId: sd.defenderGeneralId,
                        defenderTroops: sd.defenderTroops ?? city.troops ?? 10000,
                        defenderSourceCityId: city.id,
                        defenderCityId: city.id,
                        defenderLegionName: sd.defenderLegionName,
                        type: 'siege',
                        cityUpdates: ev.cityUpdates,
                        result: sd.result,
                        autoEnterRTS: sd.autoEnterRTS,
                    };
                }
            }
        }
        return null;
    }

    /**
     * 该武将此刻是否**在城**（没有带兵在外）。
     *
     * 🔴 [2026-09-14 主人定]「武将如果出征，说明不能套用，哪能东边打仗西边也打仗」——
     *    主帅正带着军团在别处打仗时，这场战役就是不可用的，**既不复用他的军团、也不另建一个他**。
     *    （我上一版写的「复用在场军团挪到对阵位」正是主人否掉的做法，已删。）
     */
    public isGeneralAvailable(generalId: string | null | undefined, ignoreArmyId?: string): boolean {
        if (!generalId) return true;   // 没指定主帅的一方不受此限
        return !this.legionManager.getArmies().some(
            (a) => !a.isDestroyed && a.getTroops() > 0 && a.generalId === generalId && a.id !== ignoreArmyId,
        );
    }

    /** 战场此刻能不能打；返回 null = 能打，否则是给玩家看的原因 */
    /**
     * @param ignoreArmyId 🔴 [2026-09-23 修「亚历山大军团无法进入战术模式」] 玩家随武将赶来的那支**赶路军团**：
     *   它正是这位主帅本人率领、专为这一仗赶路的军团，不算「主帅率军在外」。
     *   不排除它，随武将赶到的这一仗永远被「XX正率军在外，战事无从谈起」挡住，开不起来。
     */
    public checkBattlefieldReady(bfId: string, playerPos?: { lat: number; lng: number }, ignoreArmyId?: string): string | null {
        const bf = BATTLEFIELDS.find((b) => b.id === bfId);
        if (!bf) return '没有这个战场';
        // 一个战场只能打一次
        if (isBattlefieldFought(bfId)) return `【${bf.name}】已经打过了`;
        // 🔴 [2026-09-19 主人定] **取消年份闸门**。
        //    主人原话：「现在游戏是乱斗，所有先不要时间这个限定条件了，但是再写事件的时候，
        //    还要写上时间，万一以后还要用，就不要再写了。」
        //    改之前这里有一条「未到发生年份不可触发」（2026-09-16 定），
        //    改为**武将触发**之后，玩家与谁相遇是他的自由，战役不该再被游戏年份锁住；
        //    `bf.scriptYear` 与事件 `year` 字段**全部保留**（数据里照旧填），只是不再拦触发。
        if (this.battlefieldBattleRunning) {
            return this.battlefieldBattleRunning === bfId
                ? `【${bf.name}】正在交战中`
                : '已有一场战役正在进行，打完再来';
        }
        const fb = this.findBattleForBattlefield(bfId);
        if (!fb) return `【${bf.name}】还没有配战役数据`;
        // 玩家必须抵达战场
        if (playerPos) {
            const d = getEuclideanDistance(playerPos, { lat: bf.lat, lng: bf.lng }) * 111;
            if (d > HistoricalEventManager.BATTLEFIELD_TRIGGER_KM) {
                return `离【${bf.name}】还有 ${Math.round(d)} 公里，须亲临战场`;
            }
        }
        // 双方主帅都必须在城
        if (!this.isGeneralAvailable(fb.attackerGeneralId, ignoreArmyId)) {
            const rec = getGeneralRecordByGeneralId(fb.attackerGeneralId!);
            return `${rec?.generalName ?? '攻方主帅'}正率军在外，战事无从谈起`;
        }
        if (!this.isGeneralAvailable(fb.defenderGeneralId, ignoreArmyId)) {
            const rec = getGeneralRecordByGeneralId(fb.defenderGeneralId!);
            return `${rec?.generalName ?? '守方主帅'}正率军在外，战事无从谈起`;
        }
        return null;
    }

    /**
     * 为战役备一方军团，就地摆在对阵位上。
     * 攻城战：攻方在城外陆侧（稍偏东），守方在城内驻守；
     * 野战：攻守双方东西对阵。
     */
    private spawnBattlefieldSide(
        fb: FieldBattleData & { defenderCityId?: string; type?: 'field_battle' | 'siege' },
        side: 'attacker' | 'defender'
    ): Army | null {
        const loc = fb.location;
        if (!loc) return null;
        const isAtk = side === 'attacker';
        const generalId = (isAtk ? fb.attackerGeneralId : fb.defenderGeneralId) ?? null;
        const factionId = isAtk ? fb.attackerFactionId : fb.defenderFactionId;
        const troops = (isAtk ? fb.attackerTroops : fb.defenderTroops) ?? 10000;
        const sourceCityId = (isAtk ? fb.attackerSourceCityId : fb.defenderSourceCityId) ?? undefined;

        // 站位：攻城战攻方在城外东侧（长堤陆地连接部），守方在城内原点；野战东西对阵
        let stand: { lat: number; lng: number };
        if (fb.type === 'siege') {
            stand = isAtk
                ? { lat: loc.lat, lng: loc.lng + 0.025 }
                : { lat: loc.lat, lng: loc.lng };
        } else {
            stand = { lat: loc.lat, lng: loc.lng + (isAtk ? -BATTLE_OFFSET : BATTLE_OFFSET) };
        }

        // 🔴 [2026-09-16 修「战场事件攻城战进不去战术模式」]
        //    攻城战的守方是**城**（走 SiegeManager.startSiegeWithArmy 打 targetCity），
        //    13 准入读的 `battle.defender.generalId` 来自城的 `_siegeGarrisonGeneralId`
        //    （BattleUnitFactory 的 city 分支）。若把守将挂到这支随场守军上，
        //    `assignSiegeGarrisonTier` 的 `hasLegionGeneral` 会判定「城内已有自家军团带着这个将」
        //    → needGeneral=false → 城拿不到守将 → `!!battle.defender.generalId` 不成立
        //    → **攻城战永远进不了 13**（野战的 defender 是军团本身，将挂军团上，所以野战照进）。
        //    故攻城战守方军团不占将位，让守将正常落到城上；锚定将＝该城势力的将，与剧本守将一致
        //    （推罗 anchorFaction=kanan → 阿泽米尔，正是剧本 defenderGeneralId）。
        const isSiegeDefender = fb.type === 'siege' && !isAtk;
        const legionGeneralId = isSiegeDefender ? null : generalId;

        // 🔴 [2026-09-19 主人怒斥「谁说的精锐是随据点挂的？？？凭什么不能挂战场？？？
        //    「你别给我乱弄行不行」] **精锐挂在「势力」上，不是挂在据点上** —— 我之前
        //    把「势力→番号」硬拐成「势力→首都城→番号」，还去给势力建据点当锚点，全是瞎弄。
        //
        //    读代码（不是读注释）得到的事实：
        //      · `getExpeditionEliteLegionName(factionId)` / `getExpeditionEliteConfig(factionId)`
        //        —— **直接按势力查番号**，表就是 `factionId → { name, tier }`（各区 ExpeditionLegions）。
        //      · `getLegionEliteConfig(army)`（`ExpeditionLegions.ts:216`）只是**军营地上那条便捷路**：
        //        `army.homeCityId ?? army.getSourceCityId()` → `getCityEliteConfig(cityId)`，
        //        而 `CITY_ELITE_LEGIONS` 本身也是由 `STARTING_CAPITALS` 从**势力表**倒推出来的。
        //        所以「按城查」与「按势力查」是同一张表的两个入口，城只是行军时的顺手指针。
        //
        //    → 战场军团**不走城这条路**：`sourceCityId` 一律留空，让 `getLegionEliteConfig`
        //      返回 null，再由下面按**势力**把番号与档位直接写到这支军团上。
        //      这样既不吃任何据点、也不牵动募兵（`markSpawnTierConsumed` 对守方本就不调）。
        const city = sourceCityId ? this.cityManager.getCity(sourceCityId) : null;
        const legionName = this.sideBaseLegionName(fb, side);
        // 🔴 不挂 `homeCityId`、不设 `sourceCityId`：军团只为这一仗而生、打完就班师，
        //    既不该有本城（牵扯募兵/驻军口径），也不该借任何城去查番号（番号按势力给，见下）。
        const army = this.legionManager.createLegion(
            stand, troops, factionId, legionName,
            undefined, undefined, undefined, legionGeneralId ?? undefined,
            true,   // forceCreate：这一仗不受军团上限卡住
        );
        if (!army || !this.legionManager.getLegionById(army.id)) return null;

        army.setTroops(troops);
        army.isElite = true;   // 13 战术层准入要求双方都有将 + 都有精锐
        // 🔴 [2026-09-19 主人令「精锐凭什么不能挂战场」] **番号按势力挂到这支战场军团上**：
        //    `getExpeditionEliteConfig(factionId)` 的表就是 `factionId → { name, tier }`，
        //    与据点毫无关系。名字写进军团名后缀，13 面板的番号标签读的就是它
        //    （`CombatUI.getLegionEliteBadgeName` 优先取 `army.name`）；
        //    档位（战力第三环）由 `getUnitEliteTier` → `getLegionEliteConfig(army)` 取不到时，
        //    回落到名字匹配（`CultureCombat.ts:136` 有这条兜底：名字等于某番号名即按其 tier）。
        // 🔴 [2026-09-23 主人定「军团只显示马其顿军就行了」] 军团名只写军团名；番号按势力挂到 eliteOverride
        army.name = legionName;
        army.eliteOverride = getExpeditionEliteConfig(factionId) ?? null;
        if (legionGeneralId && !army.generalId) army.generalId = legionGeneralId;
        const rec = legionGeneralId ? getGeneralRecordByGeneralId(legionGeneralId) : null;
        if (rec?.portrait) army.portraitPath = rec.portrait;
        // 只为这一仗而生：不自行行军、不另寻目标、不掉兵
        army.scriptMarchExempt = true;
        army.isScriptArmy = true;
        // 🔴 [2026-09-16 修「推罗守将不是阿泽米尔」] 攻城战守方军团不占将位（legionGeneralId=null），
        //    守将/精锐本该由 SiegeManager 的 assignSiegeGarrisonTier 挂到**城**上；若这里照旧消耗城的
        //    将/精名额，assignSiegeGarrisonTier 的 needGeneral 会因 spawnGeneralUsed=true 而跳过
        //    → 城拿不到守将 → 守方只显示军团名、不显示阿泽米尔。故攻城战守方不得在此消耗名额。
        if (city && !isSiegeDefender) markSpawnTierConsumed(city, { general: true, elite: true });
        return army;
    }

    /** 战役一方的军团名（不含番号）。⚠️ 军团名 ≠ 精锐番号（项目铁律）：军团名走「时代+文化+军团」，
     *  番号（如「不死军」「背嵬军」）是另一回事，只显示在战力倍率词语标签里。 */
    private sideBaseLegionName(fb: FieldBattleData, side: 'attacker' | 'defender'): string {
        const isAtk = side === 'attacker';
        const factionId = isAtk ? fb.attackerFactionId : fb.defenderFactionId;
        const sourceCityId = (isAtk ? fb.attackerSourceCityId : fb.defenderSourceCityId) ?? undefined;
        const city = sourceCityId ? this.cityManager.getCity(sourceCityId) : null;
        return (isAtk ? fb.attackerLegionName : fb.defenderLegionName)
            || FACTION_COMPOSITIONS[factionId]?.legionName
            || getCultureLegionName(city ? getCityRegion(city) : null);
    }

    /**
     * 🔴 [2026-09-23 主人定「路上就显示史实兵力和军团名」] 主角赶路军团用：
     * 某战场这一仗里、某位武将那一方的**史实兵力与军团名**（与战场上生成的史实军团同源）。
     * 该武将不是本仗攻守主帅 → null。
     */
    public getBattlefieldSideOfGeneral(bfId: string, generalId: string):
        { troops: number; legionName: string } | null {
        const fb = this.findBattleForBattlefield(bfId);
        if (!fb || !generalId) return null;
        const side = fb.attackerGeneralId === generalId ? 'attacker'
            : fb.defenderGeneralId === generalId ? 'defender' : null;
        if (!side) return null;
        const troops = (side === 'attacker' ? fb.attackerTroops : fb.defenderTroops) ?? 10000;
        return { troops, legionName: this.sideBaseLegionName(fb, side) };
    }

    /**
     * 开打。调用前必须先过 `checkBattlefieldReady`。
     * @param onSpawned 双方军团就位后回调（玩家选了边就在这里入伍）
     * @returns 给玩家看的失败原因；null = 打起来了
     */
    public startBattlefieldBattle(
        bfId: string,
        onSpawned?: (sides: { attacker: Army; defender: Army }) => void,
        onFinished?: (sides: { attacker: Army; defender: Army }) => void,
        ignoreArmyId?: string,
    ): string | null {
        const blocked = this.checkBattlefieldReady(bfId, undefined, ignoreArmyId);
        if (blocked) return blocked;
        const bf = BATTLEFIELDS.find((b) => b.id === bfId)!;
        const fb = this.findBattleForBattlefield(bfId)!;

        const attacker = this.spawnBattlefieldSide(fb, 'attacker');
        if (!attacker) return `【${bf.name}】攻方军团没能建起来`;
        const defender = this.spawnBattlefieldSide(fb, 'defender');
        if (!defender) return `【${bf.name}】守方军团没能建起来`;

        this.battlefieldBattleRunning = bfId;
        // 13 顶部玩家面板要显示「XXX战役」，名字从这里传出去
        setActiveBattleTitle(fb.title ?? `${bf.name}战役`);
        onSpawned?.({ attacker, defender });
        gameLog('expedition',
            `⚔️ [战场]【${fb.title ?? bf.name}】开打：${attacker.name} vs ${defender.name}`
            + ` @(${fb.location?.lat}, ${fb.location?.lng}) [${fb.type ?? 'field_battle'}]`);

        // 🔴 [2026-09-16 主人定]「必须严格符合历史，该攻城就是攻城，该野战就野战。如果是攻城战，战斗要改据点归属。一切按历史，无论输赢。」
        // 🔴 [2026-09-19 主人定「建立一个一之谷战场」] 判定补上**战场要塞**那一路：
        //    一之谷这种攻城战没有 `defenderCityId`（打的是战场不是据点），
        //    若照旧只判 `fb.defenderCityId`，它会掉进下面的**野战**分支，攻城被降格成野战。
        if (fb.type === 'siege' && (fb.defenderCityId || fb.targetBattlefieldId)) {
            const siegeData: SiegeData = {
                title: fb.title,
                description: fb.description,
                attackerFactionId: fb.attackerFactionId,
                attackerGeneralId: fb.attackerGeneralId,
                attackerTroops: fb.attackerTroops,
                defenderCityId: fb.defenderCityId,
                // 🔴 [2026-09-19 主人定] 战场要塞（一之谷）：攻城目标是**战场本身**，不是据点。
                //    引擎据此用战场记录合成目标，不会去碰任何真实城池。
                targetBattlefieldId: fb.targetBattlefieldId,
                defenderGeneralId: fb.defenderGeneralId,
                defenderTroops: fb.defenderTroops,
                result: fb.result ?? 'attacker_win',
                autoEnterRTS: fb.autoEnterRTS ?? true,
            };

            this.siegeManager.startSiegeWithArmy(attacker, siegeData, () => {
                this.battlefieldBattleRunning = null;
                setActiveBattleTitle(null);
                // 🔴 攻城战改据点归属（历史结算）：推罗易主归马其顿
                if (fb.cityUpdates && fb.cityUpdates.length > 0) {
                    for (const u of fb.cityUpdates) {
                        if (u.factionId) {
                            this.cityManager.updateCity(u.cityId, { factionId: u.factionId });
                            gameLog('siege', `🚩 [攻城战史实结算] 据点【${u.cityId}】易主归【${u.factionId}】`);
                        }
                    }
                }
                // 打完了才叫战场：从这一刻起显示遗址形态，且这个战场此后不能再打
                markBattlefieldFought(bfId);
                gameLog('expedition', `⚔️ [战场]【${bf.name}】战毕，遗址上图，此战场不再重开`);
                onFinished?.({ attacker, defender });
                this.withdrawBattlefieldLegions(bf.name, attacker, defender);
            });
        } else {
            // 野战推演
            this.fieldBattleManager.handleFieldBattleEvent(
                { ...fb, attackerLegionName: attacker.name, defenderLegionName: defender.name },
                () => {
                    this.battlefieldBattleRunning = null;
                    setActiveBattleTitle(null);
                    if (fb.cityUpdates && fb.cityUpdates.length > 0) {
                        for (const u of fb.cityUpdates) {
                            if (u.factionId) {
                                this.cityManager.updateCity(u.cityId, { factionId: u.factionId });
                                gameLog('expedition', `🚩 [野战史实结算] 据点【${u.cityId}】易主归【${u.factionId}】`);
                            }
                        }
                    }
                    // 打完了才叫战场：从这一刻起显示遗址形态，且这个战场此后不能再打
                    markBattlefieldFought(bfId);
                    gameLog('expedition', `⚔️ [战场]【${bf.name}】战毕，遗址上图，此战场不再重开`);
                    onFinished?.({ attacker, defender });
                    this.withdrawBattlefieldLegions(bf.name, attacker, defender);
                },
            );
        }
        return null;
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
