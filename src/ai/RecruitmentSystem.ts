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
 *      每季最多组建 MAX_LEGIONS_SPAWN_PER_SEASON 支（默认 1）；REGION_ORDER（18 个文化区）
 *      轮流出兵，从上一季停下的区开始逐个尝试，在该区**随机**一座合格据点出兵
 *      （候选表已被 sortSpawnCandidates 洗牌，不是按驻军高低排序）。
 *      注意：这一步会被 trySpawnLegions 的「同屏保底」抢先——同屏军团 < 2 支时先在镜头内刷。
 */
import { CityManager } from '../core/CityManager';
import { LegionManager } from '../core/LegionManager';
import { GameConfig } from '../config/GameConfig';
import { CITY_CONFIG, clampCityTroops } from '../config/CityConfig';
import { GameTime } from '../core/GameTime';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { gameLog } from '../utils/GameLogger';
import { getCityRegion, REGION_ORDER, REGION_LABELS, RegionType, isRegionCenter } from '../systems/RegionSystem';
import type { SiegeManager } from '../combat/SiegeManager';
import { getCityAnchoredStrategicMagnitude, emitFollowedCityAnchoredDefensePulse } from '../combat/GeneralSkillCombat';
import { getFollowedArmyId } from '../utils/MapFloatingText';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { armDeploy } from '../legion/DeployGate';

type RecruitmentCity = ReturnType<CityManager['getCities']>[number];
type SpawnCandidate = {
    city: RecruitmentCity;
    armySize: number;
    region: RegionType;
    inViewport: boolean;
};

export class RecruitmentSystem {
    private cityManager: CityManager;
    private legionManager: LegionManager;
    private siegeManager: SiegeManager | null;
    private seasonTimer: number = 0;
    private hasRunInitialSpawn = false;
    /** 每季募兵后分批刷新城市标签，避免一帧更新 600+ DOM 卡顿 */
    private pendingLabelCityIds: Set<string> = new Set();
    private static readonly LABEL_UPDATES_PER_FRAME = 20;
    /** 18 文化区（REGION_ORDER）轮流出兵：记录下一季从哪个区开始找 */
    private nextSpawnRegionIndex = 0;

    constructor(
        cityManager: CityManager,
        legionManager: LegionManager,
        siegeManager?: SiegeManager
    ) {
        this.cityManager = cityManager;
        this.legionManager = legionManager;
        this.siegeManager = siegeManager ?? null;
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
    }

    public runInitialSpawn(): void {
        if (this.hasRunInitialSpawn) return;
        this.hasRunInitialSpawn = true;

        this.legionManager.trimLegionsToCap();

        const cities = this.cityManager.getCities();
        gameLog('recruitment', '💂 [募兵] 播放开始 — 首次出兵（分帧异步）');

        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        // [2026-08-14 主人定] 开局每文化区 1 支（名将优先），不填满 MAX_ACTIVE_LEGIONS(99)、
        // 也不是旧 30 支——上限留给季末 trySpawnLegions 逐季增长。
        // 支数 = REGION_ORDER.length = **18 大文化**（2026-08-19 主人定：希腊并入拉丁、
        // 奴儿干并入东北，其余支文化/子文化并入所属主干，开局一文化一军团）。
        const candidates = this.buildInitialSpawnPlan(cities);

        // [2026-08-19 主人定] 开局集结：起闸，期间全军在都城列阵待命不移动，
        // 到点（按**游戏运行时间**计，见 DeployGate）自动「选跟随军团 + 全军同时拔营」。
        // 🔴 必须在生成**之前**起闸：先生成再起闸的话，最早那几支已经开拔了。
        const holdMs = GameConfig.LEGION.INITIAL_DEPLOY_HOLD_MS;
        armDeploy(holdMs, () => {
            (window as any).game?.cameraFollowUI?.tryAutoFollowOnStart();
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
        this.trySpawnLegions(cities);
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

            const cfg = CITY_CONFIG[city.type];
            if (!cfg) continue;

            // 攻城战中驻军兵力由 BattleUnitFactory 适配器缓存驱动，勿直接改 city.troops
            if (!this.isCityGarrisonCommitted(city.id)) {
                const region = this.getCityRegion(city as RecruitmentCity);
                const recruitMult = GameConfig.CULTURE_COMBAT.RECRUIT_TABLE[region] ?? 1.0;
                
                // D类据点系：S⑭足食足兵（招兵买马 recruit_cooldown_mult 另有独立管线）
                const skillMult = getCityAnchoredStrategicMagnitude(city.id, 'city_growth_mult');
                
                const baseAdded = Math.floor(cfg.recruitPerSeason * recruitMult);
                const added = Math.floor(baseAdded * skillMult);
                city.troops = clampCityTroops(city.type, (city.troops || 0) + added, region);
                
                // S⑭足食足兵：跟拍军团出身城季度补兵 ×2
                if (skillMult > 1.0 && added > baseAdded) {
                    const followedId = getFollowedArmyId();
                    const followedArmy = followedId ? this.legionManager.getLegionById(followedId) : null;
                    if (followedArmy) {
                        emitFollowedCityAnchoredDefensePulse(
                            city.id,
                            city.latitude,
                            city.longitude,
                            'city_growth_mult',
                            followedArmy,
                        );
                    }
                }
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
     * 候选城排序：优先让「擅攻/双行」的武将（所在据点）出兵形成军团（2026-08-07 主人定）。
     *
     * 优先级（档越小越先出兵，档内随机洗牌保持画面多样性）：
     *   名将 > 普将（无锚定将殿后）
     *   擅攻/双行 > 擅守
     *   造势 > 借势 > 逆势
     * 即：名将·擅攻双行·造势 最先出兵；普将·擅守·逆势 最后出兵。
     */
    private static sortSpawnCandidates(candidates: SpawnCandidate[]): void {
        const priorityOf = (c: SpawnCandidate): number => {
            const general = getCityAnchoredGeneral(c.city.id);
            const profile = general ? getGeneralProfile(general.generalId) : null;
            // 无将（未录入档案）一律殿后：tier 取 2，整档 200+ 排在所有有将档之后。
            // [2026-08-07 修] 原写法 `profile?.tier === 'famous' ? 0 : 1` 把无将当普将（tier=1），
            // 又因 attackStyle 判空落到「擅攻」(style=0)，实际排进 102 档、插在 110/111/112 前面，
            // 与本注释「殿后」矛盾。当前 922 城全部有将走不到，但新增未录入将的城会插队。
            if (!profile) return 222;
            // 名将 0 / 普将 1
            const tier = profile.tier === 'famous' ? 0 : 1;
            // 擅攻/双行 0 / 擅守 1
            const style = profile.attackStyle === 'defense' ? 1 : 0;
            // 造势 0 / 借势 1 / 逆势 2
            const apt = profile.aptitude === 'create' ? 0
                : profile.aptitude === 'leverage' ? 1 : 2;
            return tier * 100 + style * 10 + apt;
        };

        // 分档：同档内 Fisher-Yates 洗牌（随机），档间按优先级（小→大）
        const buckets = new Map<number, SpawnCandidate[]>();
        for (const c of candidates) {
            const p = priorityOf(c);
            let arr = buckets.get(p);
            if (!arr) { arr = []; buckets.set(p, arr); }
            arr.push(c);
        }
        const keys = [...buckets.keys()].sort((a, b) => a - b);
        const out: SpawnCandidate[] = [];
        for (const k of keys) {
            const arr = buckets.get(k)!;
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            out.push(...arr);
        }
        candidates.length = 0;
        candidates.push(...out);
    }

    private getCityRegion(city: RecruitmentCity): RegionType {
        return getCityRegion({
            latitude: city.latitude,
            longitude: city.longitude,
            region: city.region,
        });
    }

    private getActiveLegionRegions(): Map<RegionType, number> {
        const counts = new Map<RegionType, number>();
        for (const army of this.legionManager.getArmies()) {
            if (army.isDestroyed || army.type !== 'legion') continue;
            const region = army.cultureRegion;
            if (!region) continue;
            counts.set(region, (counts.get(region) ?? 0) + 1);
        }
        return counts;
    }

    private getCurrentViewportBounds(): { contains(latlng: [number, number]): boolean } | null {
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
            // 计算征兵兵力（城市兵力的90%）
            const baseArmySize = Math.floor((city.troops || 0) * 0.9);
            // 调兵遣将：征兵时出征兵力 +10%
            const recruitMult = getCityAnchoredStrategicMagnitude(city.id, 'recruit_troops_mult');
            let armySize = Math.floor(baseArmySize * (recruitMult > 1 ? recruitMult : 1));
            const minTroops = this.getCityMinSpawnTroops(city);
            // 屯兵经略：可征兵力不得超过城防减留兵保底
            const reserveMag = getCityAnchoredStrategicMagnitude(city.id, 'garrison_reserve_troops');
            if (reserveMag > 0) {
                armySize = Math.min(armySize, Math.max(0, Math.floor((city.troops || 0) - reserveMag)));
            }
            if (armySize < minTroops) continue;

            candidates.push({
                city,
                armySize,
                region: this.getCityRegion(city),
                inViewport: bounds?.contains([city.latitude, city.longitude]) ?? false,
            });
        }

        RecruitmentSystem.sortSpawnCandidates(candidates);
        return candidates;
    }

    /**
     * 开局首发出兵计划（2026-08-14 主人定）：18 文化区各 1 支，共 18 支。
     * 不再按 MAX_ACTIVE_LEGIONS（99）填满，也不再是旧 30 支——上限留给季末 trySpawnLegions 逐季增长。
     * 「优先出名将」= 每区取 sortSpawnCandidates 排序后第一个（名将·擅攻双行·造势优先），
     * 与 buildSpawnPlan 的 find 语义一致；同档内已有 Fisher-Yates 洗牌保证随机。
     */
    private buildInitialSpawnPlan(cities: RecruitmentCity[]): SpawnCandidate[] {
        const candidates = this.collectSpawnCandidates(cities);
        if (candidates.length === 0) return [];

        // 每区取排序后第一个（名将优先），共 18 支
        const selected: SpawnCandidate[] = [];
        const used = new Set<string>();
        for (const region of REGION_ORDER) {
            const candidate = candidates.find(
                (c) => c.region === region && !used.has(c.city.id)
            );
            if (!candidate) continue;
            selected.push(candidate);
            used.add(candidate.city.id);
        }
        return selected;
    }

    private buildSpawnPlan(cities: RecruitmentCity[]): SpawnCandidate[] {
        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        const remaining = maxLegions - this.legionManager.getActiveLegionCount();
        if (remaining <= 0) return [];

        const candidates = this.collectSpawnCandidates(cities);
        if (candidates.length === 0) return [];

        // 各区已有活跃军团数
        const regionLegionCounts = this.getActiveLegionRegions();
        // 18 区是否全有至少 1 支（全有则允许第二轮）
        const allRegionsHaveLegion = REGION_ORDER.every(
            (r) => (regionLegionCounts.get(r) ?? 0) >= 1
        );

        // 18 文化区轮流出兵：从上次停下的区开始，逐区找候选直到用完配额
        const selected: SpawnCandidate[] = [];
        const selectedCityIds = new Set<string>();
        const nRegions = REGION_ORDER.length;

        for (let attempt = 0; attempt < nRegions * remaining; attempt++) {
            if (selected.length >= remaining) break;
            const region = REGION_ORDER[(this.nextSpawnRegionIndex + attempt) % nRegions];

            // 该区已有军团且非全有 → 跳过
            if (!allRegionsHaveLegion && (regionLegionCounts.get(region) ?? 0) >= 1) continue;

            const candidate = candidates.find(
                (c) => c.region === region && !selectedCityIds.has(c.city.id)
            );
            if (!candidate) continue;

            selected.push(candidate);
            selectedCityIds.add(candidate.city.id);
        }
        // 轮转到下一个区（从命中的下一个开始）
        if (selected.length > 0) {
            const lastRegion = selected[selected.length - 1].region;
            const lastIdx = REGION_ORDER.indexOf(lastRegion);
            this.nextSpawnRegionIndex = (lastIdx + 1) % nRegions;
        }

        return selected;
    }

    private spawnCandidate(city: RecruitmentCity, armySize: number) {
        const region = this.getCityRegion(city);
        const cultureName = REGION_LABELS[region] || '中原';
        const newLegion = this.legionManager.createArmy({
            name: `${cultureName}军团`,
            factionId: city.factionId,
            position: { lat: city.latitude, lng: city.longitude },
            troops: armySize,
            sourceCityId: city.id,
        });

        if (!newLegion) return null;

        // 屯兵经略：征兵后据点最低留兵（限制征用量）
        const reserveMag = getCityAnchoredStrategicMagnitude(city.id, 'garrison_reserve_troops');
        const minTroops = this.getCityMinSpawnTroops(city);
        if (reserveMag > 0) {
            const maxDeduction = Math.max(0, (city.troops || 0) - reserveMag);
            const actualDeduction = Math.min(newLegion.getTroops(), maxDeduction);
            if (actualDeduction < minTroops) {
                newLegion.destroy();
                return null;
            }
            city.troops = (city.troops || 0) - actualDeduction;
            if (actualDeduction < newLegion.getTroops()) {
                newLegion.setTroops(actualDeduction);
            }
        } else {
            city.troops = (city.troops || 0) - newLegion.getTroops();
        }

        this.queueCityLabel(city.id);

        const followedId = getFollowedArmyId();
        const followedArmy = followedId ? this.legionManager.getLegionById(followedId) : null;
        if (followedArmy) {
            if (getCityAnchoredStrategicMagnitude(city.id, 'recruit_cooldown_mult') < 1) {
                emitFollowedCityAnchoredDefensePulse(
                    city.id,
                    city.latitude,
                    city.longitude,
                    'recruit_cooldown_mult',
                    followedArmy,
                );
            }
            if (reserveMag > 0) {
                emitFollowedCityAnchoredDefensePulse(
                    city.id,
                    city.latitude,
                    city.longitude,
                    'garrison_reserve_troops',
                    followedArmy,
                );
            }
        }

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
     *   2. 文化轮转：同屏已 ≥ 2 支军团 → 18 区轮转扶贫（buildSpawnPlan）
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
            // 同屏不足 2 支 → 优先在屏内刷兵；屏内无合格城池才回落轮转
            // 【2026-07-02 主人裁定】同屏优先出的军团不能是跟随军团（自己方）的势力，
            //   保证镜头内刷出的是敌方军团，避免自己人扎堆、缺乏对抗观赏性。
            const followedFactionId = this.getFollowedFactionId();
            const allCandidates = this.collectSpawnCandidates(cities);
            const viewportCandidates = allCandidates.filter(
                (c) => c.inViewport && (!followedFactionId || c.city.factionId !== followedFactionId)
            );
            candidates = viewportCandidates.length > 0
                ? viewportCandidates
                : this.buildSpawnPlan(cities);
        } else {
            // 同屏已 ≥ 2 支 → 18 区文化轮转（区内随机取一座合格城）
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
