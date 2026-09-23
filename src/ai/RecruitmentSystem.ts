/**
 * RecruitmentSystem — 乱斗募兵
 *
 * 用户点「播放」后：执行一次出兵检查（runInitialSpawn，仅一次）
 * 每季（15 游戏秒 = 1 季度）：
 *   1. 据点驻军 + 大城200 / 中城150 / 小城100 / 关隘50（见 CityConfig.recruitPerSeason）
 *      【2026-06-12 主人裁定】产出**全进城防**——曾实装一日的「家城产出优先补自家军团」已删除
 *      （它关闭了"一城一军保护伞下家城囤积→军团死后爆发出大军"的通道，导致大军团绝迹）。
 *      军团兵力的恢复改为**战后恢复 30%**（CombatSystem.getPostBattleRecoveryRate）。
 *      家城失守仍强制回师（行为树 resolveRecaptureTarget，游戏原生行为，所有文化无豁免；
 *      例外：远征军团（shouldSkipHomeRecapture）不回师）。
 *   2. 大城/中城/小城/关隘检查是否可组建军团（总上限见 MAX_ACTIVE_LEGIONS）：
 *      每季最多组建 MAX_LEGIONS_SPAWN_PER_SEASON 支（默认 1）；16 母体地理与历史文化大区
 *      （BASE16_CULTURES）轮流出兵，从上一季停下的大区开始逐个尝试，在该大区随机一座合格据点出兵
 *      （候选表已被 sortSpawnCandidates 按名将与兵力排序）。
 *      注意：这一步会被 trySpawnLegions 的「同屏保底」抢先——同屏军团 < 2 支时先在镜头内刷。
 */
import { CityManager } from '../core/CityManager';
import { LegionManager } from '../core/LegionManager';
import { GameConfig } from '../config/GameConfig';
import { CITY_CONFIG, clampCityTroops } from '../config/CityConfig';
import { GameTime } from '../core/GameTime';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { gameLog } from '../utils/GameLogger';
import { getCityRegion, RegionType, isRegionCenter } from '../systems/RegionSystem';
import type { SiegeManager } from '../combat/SiegeManager';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { compareGeneralsByPriority } from '../data/generalSelection';
import { isGeneralOnCooldown } from '../legion/DefeatCooldown';
import { armDeploy } from '../legion/DeployGate';
import { toBase16, BASE16_CULTURES, BASE_16_LEGION_NAMES, STYLE_TO_BASE16, type Base16Culture } from '../systems/CultureBase16';
import { resolveCityBase16Style } from '../systems/cityDeStyle';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { getCultureLegionName } from '../types/CultureFormations';

type RecruitmentCity = ReturnType<CityManager['getCities']>[number];
type SpawnCandidate = {
    city: RecruitmentCity;
    armySize: number;
    region: RegionType;
    base16: Base16Culture;
    inViewport: boolean;
};

export class RecruitmentSystem {
    private cityManager: CityManager;
    private legionManager: LegionManager;
    private siegeManager: SiegeManager | null;
    private seasonTimer: number = 0;
    private hasRunInitialSpawn = false;
    /**
     * 开局首发因剧本期被跳过 → 剧本结束（闸门打开）后补跑一次。
     * 🔴 [2026-09-23] 主人定「剧本都结束后，自动切换到乱斗模式」：乱斗模式本来开局就有一批军团，
     *    不补跑的话切过去全图空着，要等季末才零星出兵。
     */
    private initialSpawnDeferred = false;
    /** 每季募兵后分批刷新城市标签，避免一帧更新 600+ DOM 卡顿 */
    private pendingLabelCityIds: Set<string> = new Set();
    private static readonly LABEL_UPDATES_PER_FRAME = 20;

    /**
     * 🔴 [2026-09-23 主人定] 历史剧本期闸门（`PlayerHero.autoPlan === 'script'`，默认）。
     * 主人原话：「既然是历史剧本，就不能出现不符合历史的事情，这个总功能中包括其他军团不能随机产生。」
     * （原面板「🚫 不出军团」勾选已并入剧本模式。）
     *
     * 返回 true = 不生军团，**两条路一起闸**（由 GameApp 注入）：
     *   · `runInitialSpawn`（播放时的开局首发）
     *   · `runSeasonTick` → `trySpawnLegions`（季末募兵）
     * **不闸**季初的 `recruitSeasonGarrison`（往城里补驻军，不产军团、也不把武将调出城）。
     * 剧本主角军团由剧本自己 `forceCreate`，不走本系统，**不受此闸影响**。
     */
    private readonly isLegionSpawnPaused: () => boolean;

    constructor(
        cityManager: CityManager,
        legionManager: LegionManager,
        siegeManager?: SiegeManager,
        isLegionSpawnPaused?: () => boolean
    ) {
        this.cityManager = cityManager;
        this.legionManager = legionManager;
        this.siegeManager = siegeManager ?? null;
        this.isLegionSpawnPaused = isLegionSpawnPaused ?? (() => false);
    }

    /** 攻城进行中：驻军已作为 city 单位参战，禁止再募兵/季末补进驻军 */
    private isCityGarrisonCommitted(cityId: string): boolean {
        return this.siegeManager?.isCityUnderAttack(cityId) ?? false;
    }

    /**
     * 用户点击「播放」并开始运行后出兵（仅一次，不等第一个 15 秒季度）
     * 条件与 trySpawnLegions 相同：大城/中城/小城/关隘、无现役军、90% 兵力 ≥ MIN_ARMY_SIZE
     */
    /**
     * 读档后必须调用：世界已由存档恢复，禁止再执行「开局首次出兵」。
     * 否则 ① 会在已成型的中盘局面上从各无军据点批量刷新军团；
     *      ② runInitialSpawn 开头的 trimLegionsToCap() 会把读档强制加入（force）的军团削掉。
     */
    public markInitialSpawnDone(): void {
        this.hasRunInitialSpawn = true;
        this.initialSpawnDeferred = false;
    }

    public runInitialSpawn(): void {
        if (this.hasRunInitialSpawn) return;
        this.hasRunInitialSpawn = true;

        // 🔴 历史剧本期 → **连开局首发也不生**（主人实测「还是有其他军团来捣乱」，捣乱的正是这一批首发）。
        //    剧本结束转入乱斗后，由 update() 按 initialSpawnDeferred 补跑一次。
        if (this.isLegionSpawnPaused()) {
            this.initialSpawnDeferred = true;
            gameLog('recruitment', '💂 [募兵] 历史剧本期 → 开局首发推迟到剧本结束（全图不随机生军团）');
            return;
        }

        this.legionManager.trimLegionsToCap();

        const cities = this.cityManager.getCities();
        gameLog('recruitment', '💂 [募兵] 播放开始 — 首次出兵（分帧异步）');

        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        // [2026-09-19 主人定] 按 16 母体地理与历史文化大区均衡出兵（名将优先）。
        // 上限留给季末 trySpawnLegions 逐季增长。
        const candidates = this.buildInitialSpawnPlan(cities);

        // [2026-08-19 主人定] 开局集结：起闸，期间全军在都城列阵待命不移动，
        // 到点（按**游戏运行时间**计，见 DeployGate）自动「选跟随军团 + 全军同时拔营」。
        // 🔴 必须在生成**之前**起闸：先生成再起闸的话，最早那几支已经开拔了。
        const holdMs = GameConfig.LEGION.INITIAL_DEPLOY_HOLD_MS;
        armDeploy(holdMs, () => {
            gameLog('recruitment', `🚩 [募兵] 集结完毕，全军同时拔营（集结 ${holdMs}ms 游戏运行时间）`);
        });

        // 错峰生成：每隔 INITIAL_SPAWN_INTERVAL_MS 放行 INITIAL_SPAWN_PER_TICK 支，
        // 让军团陆续登场而非同帧爆出（直播观感 + 避免 INP 卡顿）。
        const perTick = Math.max(1, GameConfig.LEGION.INITIAL_SPAWN_PER_TICK);
        const intervalMs = GameConfig.LEGION.INITIAL_SPAWN_INTERVAL_MS;
        let idx = 0;

        const spawnTick = () => {
            let spawnedThisTick = 0;
            while (
                idx < candidates.length &&
                spawnedThisTick < perTick &&
                this.legionManager.getActiveLegionCount() < maxLegions
            ) {
                const { city, armySize } = candidates[idx++];
                if (this.cityHasActiveLegion(city.id)) continue; // 再次确认

                const newLegion = this.spawnCandidate(city, armySize);
                if (!newLegion) continue;
                spawnedThisTick++;
            }

            // 还有剩余候选且未达上限，错峰等待下一批
            if (idx < candidates.length && this.legionManager.getActiveLegionCount() < maxLegions) {
                setTimeout(spawnTick, intervalMs);
            } else {
                // 全部出完后再挂跟随，确保随机池包含全部文化区军团（名将优先随机）
                gameLog('recruitment', `💂 [募兵] 首次出兵完成，共 ${this.legionManager.getActiveLegionCount()} 支军团`);
                // 「选跟随 + 拔营」不在这里做：军团是在 boot 阶段（游戏暂停中）生成的，
                // 此刻主人还没点播放。交给 DeployGate 在游戏跑满 holdMs 后统一触发。
            }
        };

        spawnTick();
    }

    public update(gameDelta: number): void {
        if (gameDelta <= 0) return;

        this.flushPendingCityLabels();

        // 剧本结束、转入乱斗：补跑那次被推迟的开局首发
        if (this.initialSpawnDeferred && !this.isLegionSpawnPaused()) {
            this.initialSpawnDeferred = false;
            this.hasRunInitialSpawn = false;
            this.runInitialSpawn();
        }

        this.seasonTimer += gameDelta;
        if (this.seasonTimer < GameTime.SEASON_DURATION) return;

        // 保留溢出，避免丢帧累积误差
        this.seasonTimer -= GameTime.SEASON_DURATION;
        this.runSeasonTick();
    }

    private runSeasonTick(): void {
        const t0 = performance.now();
        const cities = this.cityManager.getCities();
        this.recruitSeasonGarrison(cities);
        // 季初重算据点将/精名额：上季覆灭或解散的军团所占名额在此释放（方案A）
        this.legionManager.syncCitySpawnTierConsumption();
        // 🔴 历史剧本期 → 季末也不生军团。
        if (!this.isLegionSpawnPaused()) {
            this.trySpawnLegions(cities);
        }
        this.legionManager.tickLegionTiers(); // 兵力长到 4万的军团晋升精锐（含名将）
        PerformanceMonitor.getInstance().noteAsyncWork('recruitSeason', performance.now() - t0);
    }

    /**
     * 每季：按据点等级补驻军（大200 / 中150 / 小100 / 关50），产出全进城防。
     * 【2026-06-12 主人裁定】「家城产出优先补自家军团」已删除；军团恢复改为战后统一 30%。
     */
    private recruitSeasonGarrison(cities: ReturnType<CityManager['getCities']>): void {
        for (const city of cities) {
            if (!city.factionId || city.factionId === '' || city.factionId === 'panjun') continue;
            // 🔴 [2026-09-12 主人定] 战场已独立出据点体系（`src/data/Battlefields.ts`）→
            //    据点一律是驻军据点、一律参与每季募兵。（原「战场不补驻军」的特判已撤销。）

            const cfg = CITY_CONFIG[city.type];
            if (!cfg) continue;

            // 攻城战中驻军兵力由 BattleUnitFactory 适配器缓存驱动，勿直接改 city.troops
            if (!this.isCityGarrisonCommitted(city.id)) {
                const region = this.getCityRegion(city as RecruitmentCity);
                // 🔴 [2026-09-15] RECRUIT_TABLE 只在 16 母体上开键，先归母体再取值
                const recruitMult = GameConfig.CULTURE_COMBAT.RECRUIT_TABLE[toBase16(region)] ?? 1.0;
                const added = Math.floor(cfg.recruitPerSeason * recruitMult);
                city.troops = clampCityTroops(city.type, (city.troops || 0) + added, region);
            }
            this.pendingLabelCityIds.add(city.id);
        }
    }

    private queueCityLabel(cityId: string): void {
        this.pendingLabelCityIds.add(cityId);
    }

    private flushPendingCityLabels(): void {
        if (this.pendingLabelCityIds.size === 0) return;

        let n = 0;
        for (const cityId of this.pendingLabelCityIds) {
            if (n >= RecruitmentSystem.LABEL_UPDATES_PER_FRAME) break;
            this.cityManager.updateCityLabel(cityId);
            this.pendingLabelCityIds.delete(cityId);
            n++;
        }
    }

    /** 该军团是否名将军团（与 CameraFollowUI.isFamousGeneralLegion 同口径） */
    private static isFamousGeneralArmy(army: { generalId?: string }): boolean {
        const gid = army.generalId;
        return !!gid && getGeneralProfile(gid)?.tier === 'famous';
    }

    /**
     * 候选城排序（2026-09-19 主人定「军团刷新只看兵多，谁兵多谁组建军团」）：
     *   绝对兵力（armySize）从大到小降序排列；兵力完全相同时名将优先。
     */
    private static sortSpawnCandidates(candidates: SpawnCandidate[]): void {
        candidates.sort((a, b) => {
            if (b.armySize !== a.armySize) {
                return b.armySize - a.armySize;
            }
            return compareGeneralsByPriority(
                { troops: a.armySize, cityId: a.city.id },
                { troops: b.armySize, cityId: b.city.id },
            );
        });
    }


    private getCityRegion(city: RecruitmentCity): RegionType {
        return getCityRegion({
            latitude: city.latitude,
            longitude: city.longitude,
            region: city.region,
        });
    }

    private getCityBase16(city: RecruitmentCity): Base16Culture {
        const s16 = resolveCityBase16Style(
            city.id,
            city.type,
            city.region,
            city.latitude ?? (city as any).lat,
            city.longitude ?? (city as any).lng,
            city.buildingStyle,
        );
        if (s16 && STYLE_TO_BASE16[s16]) {
            return STYLE_TO_BASE16[s16];
        }
        return toBase16(city.region);
    }


    private getCurrentViewportBounds(): { contains(latlng: [number, number]): boolean } | null {
        if (typeof window === 'undefined') return null;
        const map = (window as any).game?.map?.getLeafletMap?.();
        return map?.getBounds?.() ?? null;
    }

    private getFollowedFactionId(): string | null {
        return this.legionManager.getFollowedLegion()?.getFactionId?.() ?? null;
    }

    /** 按据点类型 + 是否文化中心，返回最低出兵阈值（armySize 须 ≥ 此值） */
    private getCityMinSpawnTroops(city: RecruitmentCity): number {
        if (isRegionCenter(city.id)) {
            return GameConfig.LEGION.CITY_MIN_SPAWN_TROOPS.region_center;
        }
        const map = GameConfig.LEGION.CITY_MIN_SPAWN_TROOPS as Record<string, number>;
        return map[city.type] ?? 10000;
    }

    private collectSpawnCandidates(cities: RecruitmentCity[]): SpawnCandidate[] {
        const spawnTypes = GameConfig.LEGION.SPAWN_CITY_TYPES as readonly string[];
        const bounds = this.getCurrentViewportBounds();
        const candidates: SpawnCandidate[] = [];

        for (const city of cities) {
            if (!city.factionId || city.factionId === 'panjun') continue;
            if (!spawnTypes.includes(city.type)) continue;
            if (this.cityHasActiveLegion(city.id)) continue;
            if (this.isCityGarrisonCommitted(city.id)) continue;
            // 锚定将战败冷却中：该城暂不出兵。
            if (isGeneralOnCooldown(city.id)) continue;
            // 计算征兵兵力（城市兵力的90%，据点保留 10% 驻军）
            const baseArmySize = Math.floor((city.troops || 0) * 0.9);
            let armySize = baseArmySize;
            const minTroops = this.getCityMinSpawnTroops(city);
            if (armySize < minTroops) continue;

            const region = this.getCityRegion(city);
            const base16 = this.getCityBase16(city);
            candidates.push({
                city,
                armySize,
                region,
                base16,
                inViewport: bounds?.contains([city.latitude, city.longitude]) ?? false,
            });
        }

        RecruitmentSystem.sortSpawnCandidates(candidates);
        return candidates;
    }

    /**
     * [2026-09-19 主人定] 开局第一轮出兵：只在第一轮让 16 区各出一个军团（各区内兵多者/名将优先），刚好首发 16 支。
     */
    private buildInitialSpawnPlan(cities: RecruitmentCity[]): SpawnCandidate[] {
        const candidates = this.collectSpawnCandidates(cities);
        if (candidates.length === 0) return [];

        const selected: SpawnCandidate[] = [];
        const usedCityIds = new Set<string>();

        // 只在第一轮让 16 区各出一个军团
        for (const cult of BASE16_CULTURES) {
            const candidate = candidates.find(
                (c) => c.base16 === cult && !usedCityIds.has(c.city.id)
            );
            if (!candidate) continue;
            selected.push(candidate);
            usedCityIds.add(candidate.city.id);
        }

        return selected;
    }


    /**
     * [2026-09-19 主人定] 季度出兵计划：取消 16 区限制，只看兵多，谁兵多谁组建军团，补充至上限 16 支。
     */
    private buildSpawnPlan(cities: RecruitmentCity[]): SpawnCandidate[] {
        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        const remaining = maxLegions - this.legionManager.getActiveLegionCount();
        if (remaining <= 0) return [];

        const candidates = this.collectSpawnCandidates(cities);
        if (candidates.length === 0) return [];

        return candidates.slice(0, remaining);
    }


    private spawnCandidate(city: RecruitmentCity, armySize: number) {
        const region = this.getCityRegion(city);
        const base16 = this.getCityBase16(city);
        const factionLegion = FACTION_COMPOSITIONS[city.factionId]?.legionName?.trim();
        // 优先势力专属军团，无则使用该母体大区代表军团（如 东亚军团 / 西欧军团）
        const legionName = factionLegion || BASE_16_LEGION_NAMES[base16] || getCultureLegionName(region);
        const newLegion = this.legionManager.createArmy({
            name: legionName,
            factionId: city.factionId,
            position: { lat: city.latitude, lng: city.longitude },
            troops: armySize,
            sourceCityId: city.id,
        });

        if (!newLegion) return null;

        // 🔴 [2026-09-17 主人定] 据点保留 10% 兵力：征 90%，据点永留 10% 驻军。
        //    （删「屯兵经略留兵」str_27 已封印 + 「招兵买马」「屯兵经略」死脉冲，防务技系已整体退役）
        const minTroops = this.getCityMinSpawnTroops(city);
        if (newLegion.getTroops() < minTroops) {
            newLegion.destroy();
            return null;
        }
        city.troops = (city.troops || 0) - newLegion.getTroops();

        this.queueCityLabel(city.id);

        return newLegion;
    }

    private cityHasActiveLegion(cityId: string): boolean {
        const activeFromCity = this.legionManager.getArmies().filter((a) => {
            if (a.isDestroyed || a.type !== 'legion') return false;
            return a.homeCityId === cityId || a.getSourceCityId() === cityId;
        });
        if (activeFromCity.length === 0) return false;

        // 2026-08-03 档案战略技删除：str_26 招兵买马（recruit_cooldown_mult）已退役封印，
        // 无任何持有者，「军团离城可再募」豁免不复存在，有活跃军团即视为不可再募
        return true;
    }

    /**
     * 季度出兵逻辑（每季最多 1 支，见 MAX_LEGIONS_SPAWN_PER_SEASON）
     *
     * 优先级：
     *   1. 同屏保底：跟随镜头内活跃军团 < 2 支时，优先在同屏城池刷兵
     *      （保持跟随军团 + 至少 1 支其他军团的观赏性）
     *   2. 文化轮转：同屏已 ≥ 2 支军团 → 63 区轮转扶贫（buildSpawnPlan）
     *   3. 同组内**随机**取（sortSpawnCandidates 是 Fisher-Yates 洗牌，不按驻军排序）
     */
    private trySpawnLegions(cities: ReturnType<CityManager['getCities']>): void {
        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        const perSeasonCap = Math.max(1, GameConfig.LEGION.MAX_LEGIONS_SPAWN_PER_SEASON);

        if (this.legionManager.getActiveLegionCount() >= maxLegions) {
            return;
        }

        // ── 统计同屏活跃军团数（含跟随军团自身） ──
        const bounds = this.getCurrentViewportBounds();
        let visibleLegionCount = 0;
        if (bounds) {
            for (const army of this.legionManager.getArmies()) {
                if (army.isDestroyed || army.type !== 'legion') continue;
                const pos = army.getPosition();
                if (bounds.contains([pos.lat, pos.lng])) {
                    visibleLegionCount++;
                }
            }
        }

        // ── 决定候选来源 ──
        let candidates: SpawnCandidate[];

        if (visibleLegionCount < 2) {
            // 同屏不足 2 支 → 优先在屏内挑选兵多的敌对据点刷兵；屏内无合格据点才回落全图
            const followedFactionId = this.getFollowedFactionId();
            const allCandidates = this.collectSpawnCandidates(cities);
            const viewportCandidates = allCandidates.filter(
                (c) => c.inViewport && (!followedFactionId || c.city.factionId !== followedFactionId)
            );
            candidates = viewportCandidates.length > 0
                ? viewportCandidates
                : this.buildSpawnPlan(cities);
        } else {
            // 全图谁兵多谁组建军团
            candidates = this.buildSpawnPlan(cities);
        }


        let spawnedThisSeason = 0;

        for (const { city, armySize } of candidates) {
            if (spawnedThisSeason >= perSeasonCap) break;
            if (this.legionManager.getActiveLegionCount() >= maxLegions) {
                break;
            }

            const newLegion = this.spawnCandidate(city, armySize);
            if (!newLegion) continue;

            spawnedThisSeason++;
            const n = this.legionManager.getActiveLegionCount();
            gameLog(
                'recruitment',
                `💂 [募兵] 据点【${city.name}】组建【${newLegion.name}】(${newLegion.getTroops()} 兵，本季 ${spawnedThisSeason}/${perSeasonCap}，场上 ${n}/${maxLegions})`
            );
        }
    }

}
