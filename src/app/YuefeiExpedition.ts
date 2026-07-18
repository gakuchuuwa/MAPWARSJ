/**
 * 岳飞北伐黄龙圆梦脚本（2026-07-11，v3 忠义归顺；2026-07-18 朱仙镇拦路）
 *
 * 玩家点「⚔ 岳飞北伐黄龙」按钮：
 *   · 场上尚无岳飞军 → 郾城生成岳飞·背嵬军（2 万），镜头跟拍，开北伐脚本；
 *   · 场上已有岳飞军 → 加兵 1 万（吸引重复点击），切跟随并继续北伐。
 * 按必打路标逐城远征：开封 → 北京 → 黄龙府；沿途经路网逐城攻城。
 * 打下一城即自动锁定下一城；直至拿下黄龙府（直捣黄龙）或全军覆没。
 *
 * 朱仙镇（脚本专属，不新建据点）：
 *   逼近开封时，于朱仙镇附近「最近道路点」刷完颜宗弼·铁浮图（3 万）；
 *   岳飞仍沿路远征开封，路上撞上即野战——禁止直线拉离路网；
 *   胜后开封直接易主给岳家，不再攻打开封城，再北上北京。
 *
 * 旗号：北伐脚本运行期间岳家旗面显示「岳」，结束/覆没后恢复。
 *
 * 不改动任何常规游戏逻辑，仅借用现成远征机制（army.expeditionTargetCityId）：
 *   set target → 行为树锁死目标行军攻城（断粮不回）；
 *   target 变己方 → LegionBehaviors.resolveExpeditionState 自动清空 → 本脚本推进下一城。
 *
 * 忠义归顺 v3（脚本专属事件，数值与 tools/yuefei-huanglong-sim.ts 同步，勿单边改）：
 *   每场战斗胜利后，河朔忠义来投 +5,000~10,000（随机），兵力可自然累积。
 *   ⚠️ 补员必须在「战后结算」而非「沿途涓流」：setInterval 按真实时间、
 *      行军按游戏时间且受倍速影响，短程/5 倍速下涓流严重补不够。
 */

import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { roadRegistry } from '../roads/RoadRegistry';
import { gameLog } from '../utils/GameLogger';
import { spawnMapFloatingText } from '../utils/MapFloatingText';

/** 起兵据点：郾城（岳飞·岳家势力都城） */
const START_CITY_ID = 'city_yancheng2';
const FACTION_ID = 'yanchuan_d';
const GENERAL_ID = 'yanchuan_d_yuefei';
const ELITE_NAME = '背嵬军';
/** 起兵 2 万（主人定：与常规军团同量级，靠忠义归顺徐徐补员） */
const TROOPS = 20000;
/** 已有岳飞军时，再点 UI 加兵量（吸引重复点击） */
const CLICK_REINFORCE_TROOPS = 10000;

/** 开封路标 id（朱仙镇拦路与易主共用） */
const KAIFENG_ID = 'city_bianliang';

/**
 * 朱仙镇落点（仅野战坐标，不建 city_*）
 * 维基 WGS84：34°36′40″N 114°15′32″E ≈ 34.61103, 114.25893
 */
const ZHUXIANZHEN = { lat: 34.61103, lng: 114.25893 };
/** 逼近朱仙镇 / 开封时触发拦路（欧氏，约 30–40 km 量级） */
const ZHUXIAN_TRIGGER_DIST = 0.28;
const KAIFENG_NEAR_DIST = 0.40;

/** 完颜宗弼·铁浮图 */
const WANYAN_FACTION = 'jurchen';
const WANYAN_GENERAL = 'jurchen_wanyanzongbi';
const WANYAN_ELITE = '铁浮图';
const WANYAN_TROOPS = 30000;

/** 必打路标：逐城攻取，终点黄龙府 */
const ROUTE: { id: string; name: string }[] = [
    { id: KAIFENG_ID, name: '开封' },
    { id: 'city_beijing', name: '北京' },
    { id: 'city_fuyu', name: '黄龙府' },
];

/** 忠义归顺 v4：按城型分级加兵（须与 yuefei-huanglong-sim 同步，勿单边改） */
function zhongyiBonusRange(cityType: string): { min: number; max: number } {
    if (cityType === 'big_city' || cityType === 'pass') return { min: 5000, max: 10000 };
    if (cityType === 'medium_city') return { min: 3000, max: 5000 };
    return { min: 1000, max: 3000 }; // small_city
}

/** 克大站演出（纯字幕/脉冲，不再直接加兵——补员由徐徐来投承担） */
const ZHONGYI_WAYPOINT_LABELS: Record<string, string> = {
    city_bianliang: '中原义军来投',
    city_beijing: '两河忠义蜂起',
};

const TICK_INTERVAL_MS = 400;

type ZhuxianPhase = 'pending' | 'spawned' | 'done';

/** 借用的军团实例最小接口（避免耦合 Army 全量类型） */
interface ScriptArmy {
    id: string;
    name: string;
    isDestroyed: boolean;
    isElite: boolean;
    generalId?: string;
    portraitPath?: string | null;
    homeCityId?: string | null;
    expeditionTargetCityId: string | null;
    expeditionSavedName: string | null;
    expeditionUnlocked: boolean;
    ignoreCityCollision?: boolean;
    /** 脚本钉死：AI 行为树跳过（完颜宗弼拦路军） */
    __scriptPinned?: boolean;
    getTroops(): number;
    setTroops(n: number): void;
    getIsInCombat?(): boolean;
    getPosition?(): { lat: number; lng: number };
    stopMovement?(saveState?: boolean): void;
    setPosition?(lat: number, lng: number): void;
    setTargetCity?(city: unknown): void;
}

interface ScriptCity {
    factionId: string;
    latitude: number;
    longitude: number;
    type?: string;
}

interface YuefeiDeps {
    legionManager: {
        createLegion(
            pos: { lat: number; lng: number },
            troops: number,
            factionId: string,
            name?: string,
            onArrive?: (army: unknown) => void,
            legionType?: unknown,
            sourceCityId?: string,
            generalId?: string,
            forceCreate?: boolean,
        ): ScriptArmy | null;
        getLegionById(id: string): ScriptArmy | undefined;
        getArmies(): ScriptArmy[];
    };
    cityManager: {
        getCity(id: string): ScriptCity | undefined;
        updateCity?(
            id: string,
            data: { factionId: string },
            options?: {
                captorLegionName?: string;
                captorLegionId?: string;
                captorGeneralId?: string;
                defenderHadNamedForce?: boolean;
                defenderGeneralId?: string;
            },
        ): void;
        refreshFactionFlagText?(factionId: string): void;
    };
    cameraFollowUI: {
        setFollow(armyId: string, armyName: string): void;
    };
    ensureUnpaused?: () => void;
    snapCameraToArmy?: (armyId: string) => void;
    kickLegionAi?: (armyId: string) => void;
    notify?: (msg: string) => void;
}

export class YuefeiExpedition {
    private deps: YuefeiDeps;
    private armyId: string | null = null;
    private waypointIndex = 0;
    private timer: number | null = null;
    /** 已演出过的忠义大站（防重复脉冲） */
    private appliedZhongyi = new Set<string>();
    /** 上一 tick 是否在战斗中（用于捕捉「战斗刚结束」这一帧做结算补员） */
    private wasInCombat = false;

    /** 朱仙镇拦路阶段 */
    private zhuxianPhase: ZhuxianPhase = 'pending';
    private wanyanArmyId: string | null = null;
    /** 宗弼钉点：朱仙镇吸附到最近道路后的坐标（禁止离路） */
    private zhuxianRoadPos = { ...ZHUXIANZHEN };

    constructor(deps: YuefeiDeps) {
        this.deps = deps;
    }

    /** 脚本 tick 是否在跑 */
    public isRunning(): boolean {
        return this.timer != null && !!this.findExistingYuefeiArmy();
    }

    /** 场上是否已有岳飞·背嵬军（不论脚本是否在跑） */
    private isYuefeiArmy(army: ScriptArmy): boolean {
        if (army.isDestroyed || army.getTroops() <= 0) return false;
        if (army.generalId === GENERAL_ID) return true;
        if (army.homeCityId === START_CITY_ID && army.name === ELITE_NAME) return true;
        return false;
    }

    /** 查找已有岳飞军团（优先缓存 id，否则扫全场） */
    private findExistingYuefeiArmy(): ScriptArmy | undefined {
        if (this.armyId) {
            const cached = this.deps.legionManager.getLegionById(this.armyId);
            if (cached && this.isYuefeiArmy(cached)) return cached;
        }
        const candidates = this.deps.legionManager
            .getArmies()
            .filter((a) => this.isYuefeiArmy(a));
        if (candidates.length === 0) return undefined;
        return candidates.sort((a, b) => b.getTroops() - a.getTroops())[0];
    }

    /** 切跟随、开镜、锁目标并 kick AI */
    private attachFollowAndMarch(army: ScriptArmy): void {
        this.deps.ensureUnpaused?.();
        this.deps.cameraFollowUI.setFollow(army.id, army.name || ELITE_NAME);
        this.deps.snapCameraToArmy?.(army.id);

        if (this.timer == null) {
            this.tick();
            this.timer = window.setInterval(() => this.tick(), TICK_INTERVAL_MS);
        } else {
            this.tick();
        }
        this.deps.kickLegionAi?.(army.id);
    }

    /** 切跟随并恢复/启动北伐脚本 */
    private resumeOrStartScript(army: ScriptArmy): void {
        this.armyId = army.id;
        army.expeditionUnlocked = true;
        army.isElite = true;
        if (!army.generalId) army.generalId = GENERAL_ID;
        this.attachFollowAndMarch(army);
    }

    /** 北伐期间势力名→「岳家」、旗号→「岳」；结束恢复。 */
    private applyExpeditionOverride(): void {
        // 旗号刷新（CityAssetManager 已有 __yuefeiExpeditionActive 检查）
        this.deps.cityManager.refreshFactionFlagText?.(FACTION_ID);
        // 语音播报用「岳家」而非 factions.ts 里的原名（不改游戏数据，仅脚本内覆盖）
        this.overrideFactionName();
    }

    private _origGetFactionName: ((id: string) => string) | null = null;

    /** 临时覆盖 FactionManager.getFactionName：yanchuan_d → 「岳家」 */
    private overrideFactionName(): void {
        const fm = (window as any).game?.factionManager;
        if (!fm || this._origGetFactionName) return;
        this._origGetFactionName = fm.getFactionName.bind(fm);
        const self = this;
        fm.getFactionName = function (id: string): string {
            if (id === FACTION_ID) return '岳家';
            return self._origGetFactionName!(id);
        };
    }

    private restoreFactionName(): void {
        const fm = (window as any).game?.factionManager;
        if (!fm || !this._origGetFactionName) return;
        fm.getFactionName = this._origGetFactionName;
        this._origGetFactionName = null;
    }

    /** 起兵失败时回滚覆盖（旗号+势力名），避免泄漏 */
    private rollbackExpeditionOverride(): void {
        (window as any).__yuefeiExpeditionActive = false;
        this.deps.cityManager.refreshFactionFlagText?.(FACTION_ID);
        this.restoreFactionName();
    }

    /** 点按钮：无岳飞军则起兵；已有则加兵一万并继续北伐 */
    public start(): void {
        (window as any).__yuefeiExpeditionActive = true;
        this.applyExpeditionOverride();
        const existing = this.findExistingYuefeiArmy();
        if (existing) {
            const before = existing.getTroops();
            existing.setTroops(before + CLICK_REINFORCE_TROOPS);
            this.resumeOrStartScript(existing);
            const pos = existing.getPosition?.();
            if (pos) spawnMapFloatingText(pos.lat, pos.lng, '+一万', '#55ff55');
            gameLog(
                'expedition',
                `🐎 [圆梦] 再点增援 +${CLICK_REINFORCE_TROOPS.toLocaleString()}，背嵬军 ${(before + CLICK_REINFORCE_TROOPS).toLocaleString()} 众`,
            );
            this.notify('岳飞·背嵬军增兵一万');
            return;
        }

        const city = this.deps.cityManager.getCity(START_CITY_ID);
        if (!city) {
            this.notify('未找到起兵据点（郾城），无法北伐');
            this.rollbackExpeditionOverride();
            return;
        }

        const army = this.deps.legionManager.createLegion(
            { lat: city.latitude, lng: city.longitude },
            TROOPS,
            FACTION_ID,
            ELITE_NAME,
            undefined,
            undefined,
            START_CITY_ID,
            GENERAL_ID,
            true,
        );
        if (!army) {
            this.notify('岳飞·背嵬军起兵失败');
            this.rollbackExpeditionOverride();
            return;
        }
        if (!this.deps.legionManager.getLegionById(army.id)) {
            this.notify('岳飞·背嵬军起兵失败（军团未注册）');
            this.rollbackExpeditionOverride();
            return;
        }

        // 2 万起兵（常规军团量级）+ 精锐背嵬军 + 岳飞立绘 + 解锁远征资格
        army.setTroops(TROOPS);
        army.isElite = true;
        army.name = ELITE_NAME;
        army.expeditionUnlocked = true;
        if (!army.generalId) army.generalId = GENERAL_ID;
        const rec = getGeneralRecordByGeneralId(GENERAL_ID);
        if (rec?.portrait) army.portraitPath = rec.portrait;

        this.armyId = army.id;
        this.waypointIndex = 0;
        this.appliedZhongyi.clear();
        this.wasInCombat = false;
        this.zhuxianPhase = 'pending';
        this.wanyanArmyId = null;
        this.zhuxianRoadPos = { ...ZHUXIANZHEN };

        gameLog('expedition', `🐎 [圆梦] 岳飞率背嵬军自郾城起兵，北伐黄龙：开封 → 北京 → 黄龙府，忠义归顺，众望所归`);
        this.notify('岳飞率背嵬军北伐——直捣黄龙！');

        this.attachFollowAndMarch(army);
    }

    /** 每 tick：推进路线、锁定当前目标城；朱仙镇拦路优先于开封攻城 */
    private tick(): void {
        if (!this.armyId) {
            this.stop();
            return;
        }
        const army = this.deps.legionManager.getLegionById(this.armyId);
        if (!army || army.isDestroyed || army.getTroops() <= 0) {
            this.armyId = null;
            const reached = ROUTE[Math.max(0, this.waypointIndex - 1)]?.name ?? '开封';
            gameLog('expedition', `🐎 [圆梦] 岳飞·背嵬军覆没，北伐止步于 ${reached} 一线，壮志未酬`);
            this.notify(`岳飞·背嵬军覆没，北伐止步于 ${reached} 一线`);
            this.cleanupWanyanArmy();
            this.stop();
            return;
        }

        // 维持远征资格 & 精锐身份（防被常规逻辑改写）
        army.expeditionUnlocked = true;
        army.isElite = true;

        this.tickZhongyiTrickle(army);

        // 朱仙镇拦路（开封路标未克前；岳飞始终沿路远征，不直线离路）
        if (this.waypointIndex === 0 && this.zhuxianPhase !== 'done') {
            const kaifeng = this.deps.cityManager.getCity(KAIFENG_ID);
            if (kaifeng && kaifeng.factionId === FACTION_ID) {
                this.zhuxianPhase = 'done';
                this.cleanupWanyanArmy();
                army.ignoreCityCollision = false;
            } else {
                this.tickZhuxianIntercept(army);
            }
        }

        // 跳过已攻克的路线城
        while (this.waypointIndex < ROUTE.length) {
            const wp = ROUTE[this.waypointIndex];
            const c = this.deps.cityManager.getCity(wp.id);
            if (c && c.factionId === FACTION_ID) {
                gameLog('expedition', `🐎 [圆梦] 岳飞·背嵬军已克 ${wp.name}`);
                this.celebrateZhongyiWaypoint(wp.id, wp.name, c);
                this.waypointIndex++;
                continue;
            }
            break;
        }

        // 全线打通 → 直捣黄龙功成
        if (this.waypointIndex >= ROUTE.length) {
            army.expeditionTargetCityId = null;
            gameLog('expedition', `🐎 [圆梦] 直捣黄龙！岳飞·背嵬军攻克黄龙府，北伐功成`);
            this.notify('直捣黄龙！岳飞攻克黄龙府，北伐功成 🎉');
            this.stop();
            return;
        }

        // 锁定当前目标城（覆盖任何被自动远征逻辑塞入的其它目标）
        const desired = ROUTE[this.waypointIndex];
        if (army.expeditionTargetCityId !== desired.id) {
            if (army.name !== ELITE_NAME) army.name = ELITE_NAME;
            army.expeditionTargetCityId = desired.id;
            gameLog('expedition', `🐎 [圆梦] 岳飞·背嵬军锁定目标：${desired.name}`);
        }
    }

    /**
     * 朱仙镇史地坐标 → 可贴路接战点（禁止离路）
     * 优先取「当前军 → 开封」路网折线上距朱仙镇最近的点；否则全网最近道路投影。
     */
    private resolveZhuxianRoadPos(armyPos?: { lat: number; lng: number }): { lat: number; lng: number } {
        if (armyPos) {
            const route = roadRegistry.getFullPathToCity(armyPos, KAIFENG_ID);
            if (route.length >= 2) {
                let best = route[0];
                let bestD = getEuclideanDistance(best, ZHUXIANZHEN);
                for (let i = 1; i < route.length; i++) {
                    const d = getEuclideanDistance(route[i], ZHUXIANZHEN);
                    if (d < bestD) {
                        bestD = d;
                        best = route[i];
                    }
                }
                // 折线顶点之外：再在相邻段上投影，取更贴近朱仙镇的道路点
                let bestSeg = { ...best };
                for (let i = 0; i < route.length - 1; i++) {
                    const a = route[i];
                    const b = route[i + 1];
                    const abLat = b.lat - a.lat;
                    const abLng = b.lng - a.lng;
                    const len2 = abLat * abLat + abLng * abLng;
                    if (len2 < 1e-12) continue;
                    let t =
                        ((ZHUXIANZHEN.lat - a.lat) * abLat + (ZHUXIANZHEN.lng - a.lng) * abLng) / len2;
                    t = Math.max(0, Math.min(1, t));
                    const p = { lat: a.lat + t * abLat, lng: a.lng + t * abLng };
                    const d = getEuclideanDistance(p, ZHUXIANZHEN);
                    if (d < bestD) {
                        bestD = d;
                        bestSeg = p;
                    }
                }
                return bestSeg;
            }
        }
        const snapped = roadRegistry.findNearestRoadPoint(ZHUXIANZHEN.lat, ZHUXIANZHEN.lng, 80);
        if (snapped) {
            return { lat: snapped.lat, lng: snapped.lng };
        }
        return { ...ZHUXIANZHEN };
    }

    /**
     * 朱仙镇拦路：逼近时在道路上刷完颜宗弼·铁浮图；胜后开封易主。
     * 岳飞不改道、不直线接敌——继续锁开封沿路行军，路上撞上即野战。
     */
    private tickZhuxianIntercept(army: ScriptArmy): void {
        if (this.zhuxianPhase === 'done') return;

        const pos = army.getPosition?.();
        if (!pos) return;

        if (this.zhuxianPhase === 'pending') {
            const kaifeng = this.deps.cityManager.getCity(KAIFENG_ID);
            const nearZhuxian = getEuclideanDistance(pos, ZHUXIANZHEN) <= ZHUXIAN_TRIGGER_DIST;
            const nearKaifeng =
                !!kaifeng &&
                getEuclideanDistance(pos, { lat: kaifeng.latitude, lng: kaifeng.longitude }) <=
                    KAIFENG_NEAR_DIST;
            if (!nearZhuxian && !nearKaifeng) return;

            if (!this.spawnWanyanArmy(pos)) {
                this.zhuxianPhase = 'done';
                return;
            }
            this.zhuxianPhase = 'spawned';
            // 防未战先开封攻城；远征目标仍由 tick 锁开封，保持贴路
            army.ignoreCityCollision = true;
            gameLog(
                'expedition',
                `🐎 [圆梦] 朱仙镇道路一线遭遇完颜宗弼·铁浮图（${WANYAN_TROOPS.toLocaleString()}），背嵬军沿路迎战`,
            );
            this.notify('朱仙镇——完颜宗弼率铁浮图拦路！');
            return;
        }

        // spawned：钉死宗弼于道路点；岳飞继续沿路；判胜负
        this.pinWanyanArmy();

        const wanyan = this.wanyanArmyId
            ? this.deps.legionManager.getLegionById(this.wanyanArmyId)
            : undefined;
        const wanyanAlive = !!wanyan && !wanyan.isDestroyed && wanyan.getTroops() > 0;
        const inCombat = army.getIsInCombat?.() ?? false;

        if (wanyanAlive) {
            army.ignoreCityCollision = true;
            return;
        }

        if (!inCombat) {
            this.grantKaifengToYuefei(army);
            this.zhuxianPhase = 'done';
            this.wanyanArmyId = null;
            army.ignoreCityCollision = false;
        }
    }

    private spawnWanyanArmy(armyPos?: { lat: number; lng: number }): boolean {
        this.zhuxianRoadPos = this.resolveZhuxianRoadPos(armyPos);
        const enemy = this.deps.legionManager.createLegion(
            { ...this.zhuxianRoadPos },
            WANYAN_TROOPS,
            WANYAN_FACTION,
            WANYAN_ELITE,
            undefined,
            undefined,
            'city_wuguo',
            WANYAN_GENERAL,
            true,
        );
        if (!enemy) {
            gameLog('expedition', '🐎 [圆梦] 朱仙镇刷完颜宗弼失败，改攻打开封');
            return false;
        }
        // createLegion 可能抖动偏移 → 强制落回道路点
        enemy.setPosition?.(this.zhuxianRoadPos.lat, this.zhuxianRoadPos.lng);
        enemy.setTroops(WANYAN_TROOPS);
        enemy.isElite = true;
        enemy.name = WANYAN_ELITE;
        enemy.generalId = WANYAN_GENERAL;
        enemy.__scriptPinned = true;
        enemy.ignoreCityCollision = true;
        enemy.stopMovement?.(false);
        enemy.setTargetCity?.(null);
        enemy.expeditionTargetCityId = null;
        const rec = getGeneralRecordByGeneralId(WANYAN_GENERAL);
        if (rec?.portrait) enemy.portraitPath = rec.portrait;

        this.wanyanArmyId = enemy.id;
        spawnMapFloatingText(this.zhuxianRoadPos.lat, this.zhuxianRoadPos.lng, '铁浮图', '#ffcc66');
        return true;
    }

    /** 钉在朱仙镇最近道路点，防 AI 拉走 / 离路 */
    private pinWanyanArmy(): void {
        if (!this.wanyanArmyId) return;
        const w = this.deps.legionManager.getLegionById(this.wanyanArmyId);
        if (!w || w.isDestroyed || w.getTroops() <= 0) return;
        w.__scriptPinned = true;
        w.ignoreCityCollision = true;
        w.expeditionTargetCityId = null;
        w.setTargetCity?.(null);
        if (w.getIsInCombat?.()) return;
        w.stopMovement?.(false);
        const p = w.getPosition?.();
        if (p && getEuclideanDistance(p, this.zhuxianRoadPos) > 0.05) {
            w.setPosition?.(this.zhuxianRoadPos.lat, this.zhuxianRoadPos.lng);
        }
    }

    private cleanupWanyanArmy(): void {
        if (!this.wanyanArmyId) return;
        const w = this.deps.legionManager.getLegionById(this.wanyanArmyId);
        if (w && !w.isDestroyed) {
            w.__scriptPinned = false;
        }
        this.wanyanArmyId = null;
    }

    /** 朱仙镇大捷 → 开封归岳家（不再攻城） */
    private grantKaifengToYuefei(army: ScriptArmy): void {
        const city = this.deps.cityManager.getCity(KAIFENG_ID);
        if (!city) return;
        if (city.factionId === FACTION_ID) return;
        if (!this.deps.cityManager.updateCity) {
            gameLog('expedition', '🐎 [圆梦] cityManager.updateCity 不可用，无法移交开封');
            return;
        }
        this.deps.cityManager.updateCity(
            KAIFENG_ID,
            { factionId: FACTION_ID },
            {
                captorLegionName: army.name || ELITE_NAME,
                captorLegionId: army.id,
                captorGeneralId: GENERAL_ID,
                defenderHadNamedForce: true,
                defenderGeneralId: WANYAN_GENERAL,
            },
        );
        const pos = army.getPosition?.() ?? ZHUXIANZHEN;
        spawnMapFloatingText(pos.lat, pos.lng, '克复开封', '#55ff55');
        gameLog('expedition', `🐎 [圆梦] 朱仙镇大捷——十二道金牌无效，岳家军挺进汴梁`);
        this.notify('朱仙镇大捷——十二道金牌无效，岳家军挺进汴梁');
    }

    /**
     * 忠义归顺 v4（脚本专属技）：捕捉「战斗刚结束」这一帧，按城型分级加兵。
     * 战后结算（非沿途涓流）→ 不依赖行军长短与倍速。
     * 演出：白字绿光，军团头顶飘四字技名「忠义归顺」。
     */
    private tickZhongyiTrickle(army: ScriptArmy): void {
        const inCombat = army.getIsInCombat?.() ?? false;
        if (inCombat) {
            this.wasInCombat = true;
            return;
        }
        if (!this.wasInCombat) return;
        this.wasInCombat = false;

        const troops = army.getTroops();
        if (troops <= 0) return;

        // 朱仙镇野战无远征目标城：按大城档补员
        let cityType = 'small_city';
        const targetCityId = army.expeditionTargetCityId;
        if (targetCityId) {
            const city = this.deps.cityManager.getCity(targetCityId);
            if (city) cityType = city.type ?? 'small_city';
        } else if (this.zhuxianPhase === 'spawned' || this.waypointIndex === 0) {
            cityType = 'big_city';
        } else {
            return;
        }

        const r = zhongyiBonusRange(cityType);
        const added = r.min + Math.floor(Math.random() * (r.max - r.min + 1));
        army.setTroops(troops + added);

        const pos = army.getPosition?.();
        if (pos) spawnMapFloatingText(pos.lat, pos.lng, '忠义归顺', '#55ff55');
        gameLog(
            'expedition',
            `🐎 [圆梦] 忠义归顺 +${added.toLocaleString()}，背嵬军增至 ${(troops + added).toLocaleString()} 众`,
        );
    }

    /**
     * 克大站演出（纯字幕/脉冲，不加兵）：白字绿光脉冲飘四字技名「忠义归顺」，
     * 播报走六字史实文案。每站只演一次（appliedZhongyi 防重）。
     */
    private celebrateZhongyiWaypoint(cityId: string, cityName: string, city: ScriptCity): void {
        const label = ZHONGYI_WAYPOINT_LABELS[cityId];
        if (!label || this.appliedZhongyi.has(cityId)) return;
        this.appliedZhongyi.add(cityId);

        gameLog('expedition', `🐎 [圆梦] 克 ${cityName}，${label}`);
        this.notify(`克 ${cityName}——${label}！`);
    }

    /** 停止脚本推进（军团仍留在场上） */
    public stop(): void {
        (window as any).__yuefeiExpeditionActive = false;
        this.deps.cityManager.refreshFactionFlagText?.(FACTION_ID);
        this.restoreFactionName();
        if (this.timer != null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }

    private notify(msg: string): void {
        this.deps.notify?.(msg);
    }
}
