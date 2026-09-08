import { getFactionCultureRegion } from '../config/portrait_defaults';
import { CULTURE_TIERS_MAP } from '../types/CultureFormations';
import { WAR_TYPES } from '../data/WarTypes';
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
import { getEuclideanDistance } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';
import {
    PLAYER_CITY_ARRIVE_DIST,
    PLAYER_ELITE_SQUAD_TROOPS,
    PLAYER_HERO_KEY,
    heroKeyForRank,
    moveClassForHeroKey,
    type PlayerRankId,
    PLAYER_HERO_NAME,
    PLAYER_HERO_SPEED_MULT,
    PLAYER_RANKS,
    rankForMerit,
    rankFor,
    type PlayerRank,
} from './PlayerConfig';

/** 从本势力文化军团三排里学到的兵种（≠ 打城拿到的精锐番号 LearnedElite）。 */
export interface LearnedUnit {
    /** 兵种 key（UNIT_ASSETS / WAR_TYPES 同名） */
    unitKey: string;
    /** 兵种中文名（面板显示） */
    unitName: string;
    /** 学到时所属势力 */
    factionId: string;
    /** 该兵种在本势力军团里的排号：0 前排 / 1 中坚 / 2 后排 */
    row: number;
}

export interface LearnedElite {
    /** 精锐番号（如「福建水师」） */
    name: string;
    /** 兵种 key（UNIT_ASSETS / WAR_TYPES 同名） */
    unitKey: string;
    factionId: string;
    factionName: string;
}

export interface PlayerSaveState {
    merit: number;
    heroDowns: number;
    factionId: string | null;
    learnedElites: LearnedElite[];
    learnedUnits?: LearnedUnit[];
    selectedUnit?: number;
    selectedElite: number;
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
    /** 玩家自选精锐编队（探马及以上且已选精锐才有） */
    eliteLane: { key: string; troops: number; name: string } | null;
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
    public learnedElites: LearnedElite[] = [];

    /** 🔴 [2026-09-07 主人定] 本势力已学兵种：斥候学 1 个、探马再 1 个、先锋再 1 个，
     *  到先锋集齐该势力文化军团的三排。学到的兵种即玩家自己的素材（可在面板里挑）。 */
    public learnedUnits: LearnedUnit[] = [];
    /** 面板选中的已学兵种下标；-1 = 还没学到（用近东民兵） */
    public selectedUnit = -1;
    /** 选中带入战术模式的精锐下标（-1 = 不带） */
    public selectedElite = -1;

    private hostLegionId: string | null = null;
    private travelCityId: string | null = null;
    /** 自动模式：自动选据点（优先名将+双行）、自动入伍、军团战败自动换下一个势力。
     *  🔴 [2026-09-09 主人定「玩家开局默认自动」] 默认开启，HUD 里可随时手动关掉。 */
    public autoMode = true;
    /** 玩家自定义名（改名功能写入；默认「乱入者」） */
    private playerName: string = PLAYER_HERO_NAME;
    private changeListeners = new Set<() => void>();
    /** 抵达据点回调（PlayerQuestSystem 接管对话） */
    public onArriveCity: ((city: City) => void) | null = null;
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
        //    还没学到（平民/刚入伙那一瞬）才回落到官阶兜底素材（平民=近东民兵）。
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
        this.army.preferredMoveClass = moveClassForHeroKey(this.heroKey);
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
    public getHostLegion(): Army | undefined {
        return this.hostLegionId ? this.deps.getLegionById(this.hostLegionId) : undefined;
    }
    public isAttached(): boolean { return this.hostLegionId != null; }
    public isAttachedTo(armyId: string | null | undefined): boolean {
        return !!armyId && this.hostLegionId === armyId;
    }
    public isTraveling(): boolean { return this.travelCityId != null; }
    public getTravelCityId(): string | null { return this.travelCityId; }

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
        const after = this.getRank();
        this.syncLearnedUnits();  // 降阶：收回超额已学兵种
        this.syncMoveProfile();
        const host = this.getHostLegion();
        if (host) {
            host.playerHostPowerMult = after.powerMult;
            host.playerHostRankName = after.name;
        }
        if (prevMerit > 0 || before.id !== after.id) {
            this.deps.notify(`💥 ${reason}！功勋已归零，官阶降为【${after.name}】`);
            gameLog('expedition', `[玩家] ${reason}，功勋 ${prevMerit} 归零，从【${before.name}】降为【${after.name}】`);
        }
        this.emitChange();
    }

    public noteHeroDown(): void {
        this.heroDowns++;
        this.emitChange();
    }

    /** 大地图战略战斗结算：随军军团战胜时，按歼敌兵力与官阶指挥分成获得战略战功；战败则功勋归零降职 */
    public onHostBattleEnd(result: 'victory' | 'defeat', enemyKilled: number): void {
        if (result === 'defeat') {
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
        this.addMerit(gained);
        this.deps.notify(`🚩 大捷！随军斩敌 ${enemyKilled.toLocaleString()}，按【${rank.name}】军职记战功 ${gained.toLocaleString()}`);
    }

    // ── 本势力兵种（按官阶学） ──────────────────────────────
    /** 该官阶应当已学会几个本势力兵种：斥候1 / 探马2 / 先锋及以上3。 */
    private learnQuotaForRank(rankId: PlayerRankId): number {
        const idx = PLAYER_RANKS.findIndex((r) => r.id === rankId);
        const q = (id: PlayerRankId) => PLAYER_RANKS.findIndex((r) => r.id === id);
        if (idx >= q('vanguard')) return 3;   // 先锋起：集齐三排
        if (idx >= q('outrider')) return 2;   // 探马：两个
        if (idx >= q('scout')) return 1;      // 斥候：一个
        return 0;                              // 平民：还没入伙，用近东民兵
    }

    /**
     * 按当前官阶补齐应学的本势力兵种。
     * 🔴 [2026-09-07 主人定]「斥候学一个（三排随机）→ 探马再一个 → 先锋再一个，集齐三排」。
     *    随机只在**还没学过的排**里抽，所以到先锋必然三排各一个，不会重复。
     *    学到即可套用：玩家素材 = 选中的已学兵种（见 heroKey）。
     */
    public syncLearnedUnits(): void {
        // 🔴 [2026-09-09 主人定「这种是玩家奖励，终身获取的」]
        //    已学兵种**永不回收**：军团战败、脱离势力、改投他家、掉阶，一律保留。
        //    改前有三处会把它清光——① factionId 为空就清空（军团战败 → detach 清 factionId，
        //    奖励当场蒸发）；② 换势力清空重学；③ 掉阶按总数截断。全部去掉。
        //    配额只约束「本势力还能再学几个」，按**当前势力已学数**算，不看历史总数，
        //    所以改投新势力后照样能从头学三排，旧势力学的也还留着能选。
        const want = this.learnQuotaForRank(this.getRank().id);
        if (!this.factionId) return;               // 独行期：不新学，但旧的原样保留
        const region = getFactionCultureRegion(this.factionId);
        const slots = region ? (CULTURE_TIERS_MAP[region]?.[0]?.slots ?? []) : [];
        if (!slots.length) return;

        const mineCount = () => this.learnedUnits.filter((u) => u.factionId === this.factionId).length;
        while (mineCount() < want && mineCount() < slots.length) {
            // 只在「本势力还没学过的排」里抽，历史上别家学的不占本势力的排
            const taken = new Set(
                this.learnedUnits.filter((u) => u.factionId === this.factionId).map((u) => u.row),
            );
            const pool = (slots as Array<{ type: string; count: number }>)
                .map((sl, row) => ({ sl, row })).filter((x) => !taken.has(x.row));
            if (!pool.length) break;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            const name = WAR_TYPES[pick.sl.type]?.name ?? pick.sl.type;
            this.learnedUnits.push({ unitKey: pick.sl.type, unitName: name, factionId: this.factionId, row: pick.row });
            if (this.selectedUnit < 0) this.selectedUnit = this.learnedUnits.length - 1;
            this.deps.notify(`🗡️ 学会本势力兵种【${name}】`);
        }
    }

    /** 面板选兵种素材（探马及以上才开放，见 PlayerHUD） */
    public selectUnit(idx: number): void {
        this.selectedUnit = idx >= 0 && idx < this.learnedUnits.length ? idx : -1;
        this.syncMoveProfile();
        this.emitChange();
    }

    public getSelectedUnit(): LearnedUnit | null {
        return this.learnedUnits[this.selectedUnit] ?? null;
    }

    // ── 精锐 ──────────────────────────────────────────────
    public learnElite(e: LearnedElite): boolean {
        if (this.learnedElites.some((x) => x.unitKey === e.unitKey && x.factionId === e.factionId)) return false;
        this.learnedElites.push(e);
        if (this.selectedElite < 0) this.selectedElite = this.learnedElites.length - 1;
        this.emitChange();
        return true;
    }

    public selectElite(idx: number): void {
        this.selectedElite = idx >= 0 && idx < this.learnedElites.length ? idx : -1;
        this.emitChange();
    }

    public getSelectedElite(): LearnedElite | null {
        return this.learnedElites[this.selectedElite] ?? null;
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
        this.cancelTravel();
        this.hostLegionId = host.id;
        // 第九环·玩家官阶：入伍时把官阶战力乘数 + 4 字官阶名写到军团
        host.playerHostPowerMult = this.getRank().powerMult;
        host.playerHostRankName = this.getRank().name;
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
        this.syncLearnedUnits();  // 退出势力：清空已学兵种（学的是「该势力的兵」）
        this.syncMoveProfile();   // 素材回近东民兵（步）
        const rr = this.army.getRenderer();
        if (rr) rr.factionId = undefined;
        this.deps.releaseCamera();
        this.emitChange();
    }

    // ── 行军 ──────────────────────────────────────────────
    /** 点据点：沿路网前往。入伍中不可单独行动。 */
    public travelToCity(cityId: string): boolean {
        if (this.hostLegionId) {
            this.deps.notify('你正在军中，随军出征，军团覆灭前不可离开');
            return false;
        }
        const city = this.deps.cityManager.getCity(cityId);
        if (!city) return false;
        const pos = this.army.getPosition();
        const target = { lat: city.latitude, lng: city.longitude };
        if (getEuclideanDistance(pos, target) <= PLAYER_CITY_ARRIVE_DIST) {
            this.cancelTravel();
            this.onArriveCity?.(city);
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
        this.army.setTargetCity(city);
        this.army.setOnArriveCallback(() => this.handleArrive(cityId));
        this.army.moveAlongPath(path.map((p) => ({ lat: p.lat, lng: p.lng, sea: (p as any).sea })));
        this.deps.followCamera();
        this.emitChange();
        return true;
    }

    public cancelTravel(): void {
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
                // 🔴 不清 hostLegionId：让 onHostLost → finishQuest(false)/detach() 统一「清军团+退出势力+归零」。
                //    ⚠️ [2026-09-08] onHostLost 现在**无论有没有任务都会 detach**（见 PlayerQuestSystem.onHostLost），
                //    否则这里每帧重入、玩家被钉在死军团上动不了、自动模式也永不触发。
                this.resetMerit('随军军团覆灭');
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
                const hostShip = host.navalShipAssetLock ?? getCultureNavalShip(host.cultureRegion, host.getFactionId());
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
        this.army.update(dt);
        if (this.army.isOnSea) {
            this.army.navalShipAssetLock = 'MERCHANT_SHIP';
            if (r) (r as any).navalShipAssetLock = 'MERCHANT_SHIP';
        } else {
            this.army.navalShipAssetLock = null;
            if (r) (r as any).navalShipAssetLock = null;
        }
        if (r) {
            r.isOnSea = this.army.isOnSea;
            r.isMoving = this.army.isMarching();
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
        const elite = rank.control === 'none' ? null : this.getSelectedElite();
        return {
            side: followedOnDefenderSide ? 1 : 0,
            heroKey: this.heroKey,
            heroName: this.name,
            control: rank.control,
            eliteLane: elite ? { key: elite.unitKey, troops: PLAYER_ELITE_SQUAD_TROOPS, name: elite.name } : null,
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
            learnedElites: this.learnedElites.map((e) => ({ ...e })),
            learnedUnits: this.learnedUnits.map((u) => ({ ...u })),
            selectedUnit: this.selectedUnit,
            selectedElite: this.selectedElite,
            lat: p.lat,
            lng: p.lng,
        };
    }

    public restoreSaveState(s: PlayerSaveState): void {
        this.hostLegionId = null;
        this.cancelTravel();
        this.merit = s.merit ?? 0;
        this.heroDowns = s.heroDowns ?? 0;
        this.learnedElites = (s.learnedElites ?? []).map((e) => ({ ...e }));
        this.learnedUnits = (s.learnedUnits ?? []).map((u) => ({ ...u }));
        this.selectedUnit = s.selectedUnit ?? -1;
        this.selectedElite = Math.min(this.learnedElites.length - 1, s.selectedElite ?? -1);
        if (s.factionId) this.joinFaction(s.factionId);
        if (Number.isFinite(s.lat) && Number.isFinite(s.lng)) this.army.setPosition(s.lat, s.lng);
        this.emitChange();
    }

    public static rankLabel(id: PlayerRank['id']): string {
        return PLAYER_RANKS.find((r) => r.id === id)?.name ?? id;
    }
}
