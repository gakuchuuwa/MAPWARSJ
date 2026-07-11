/**
 * 岳飞北伐黄龙圆梦脚本（2026-07-11，v2 忠义归顺）
 *
 * 玩家点「⚔ 岳飞北伐黄龙」按钮 → 郾城生成岳飞·背嵬军（2 万兵，与常规军团同量级），
 * 镜头自动跟拍，按必打路标逐城远征：开封 → 北京 → 黄龙府；沿途经路网逐城攻城。
 * 打下一城即自动锁定下一城；直至拿下黄龙府（直捣黄龙）或全军覆没。
 *
 * 不改动任何常规游戏逻辑，仅借用现成远征机制（army.expeditionTargetCityId）：
 *   set target → 行为树锁死目标行军攻城（断粮不回）；
 *   target 变己方 → LegionBehaviors.resolveExpeditionState 自动清空 → 本脚本推进下一城。
 *
 * 忠义归顺 v2（脚本专属事件，数值与 tools/yuefei-huanglong-sim.ts 同步，勿单边改）：
 *   每克一城 / 每场战斗结束，河朔忠义即来投，一次性把兵力补齐到本程回填上限
 *   （31,750 − 0~3,000 随机浮动）→ 每场攻城处于略有优势/略有劣势的胶着区间。
 *   ⚠️ 补员必须在「战后结算」而非「沿途按真实时间涓流」：setInterval 按真实时间、
 *      行军按游戏时间且受倍速影响，短程/5 倍速下涓流严重补不够（曾致第二战败于开封）。
 *   仿真 500 局定稿：单次直捣黄龙 67.4%，两次至少一成 89.4%（主人定的悬念档）；
 *   宁远城（袁崇焕）为天然最终 Boss，黄龙府决战 ~94%。
 */

import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { gameLog } from '../utils/GameLogger';
import { spawnMapPulse, spawnMapFloatingText } from '../utils/MapFloatingText';

/** 起兵据点：郾城（岳飞·郾川势力都城） */
const START_CITY_ID = 'city_yancheng2';
const FACTION_ID = 'yanchuan_d';
const GENERAL_ID = 'yanchuan_d_yuefei';
const ELITE_NAME = '背嵬军';
/** 起兵 2 万（主人定：与常规军团同量级，靠忠义归顺徐徐补员） */
const TROOPS = 20000;

/** 必打路标：逐城攻取，终点黄龙府 */
const ROUTE: { id: string; name: string }[] = [
    { id: 'city_bianliang', name: '开封' },
    { id: 'city_beijing', name: '北京' },
    { id: 'city_fuyu', name: '黄龙府' },
];

/** 忠义归顺 v2：回填上限/浮动（须与 yuefei-huanglong-sim 同步，勿单边改） */
const ZHONGYI_REFILL_MAX = 31750;
const ZHONGYI_REFILL_JITTER = 3000;

/** 克大站演出（纯字幕/脉冲，不再直接加兵——补员由徐徐来投承担） */
const ZHONGYI_WAYPOINT_LABELS: Record<string, string> = {
    city_bianliang: '中原义军来投',
    city_beijing: '两河忠义蜂起',
};

const TICK_INTERVAL_MS = 400;

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
    getTroops(): number;
    setTroops(n: number): void;
    /** 战斗中禁补员（忠义归顺只在行军/待命时生效） */
    getIsInCombat?(): boolean;
    /** 军团当前位置（忠义归顺飘字用） */
    getPosition?(): { lat: number; lng: number };
}

interface ScriptCity {
    factionId: string;
    latitude: number;
    longitude: number;
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
    };
    cameraFollowUI: {
        setFollow(armyId: string, armyName: string): void;
    };
    /** 若游戏暂停则恢复运行（否则 AI/行军不推进） */
    ensureUnpaused?: () => void;
    /** 镜头立刻吸附到军团位置 */
    snapCameraToArmy?: (armyId: string) => void;
    /** 立刻跑一次该军团行为树（锁定远征目标后马上开拔） */
    kickLegionAi?: (armyId: string) => void;
    /** 玩家提示（可选，走 toast/console） */
    notify?: (msg: string) => void;
}

export class YuefeiExpedition {
    private deps: YuefeiDeps;
    private armyId: string | null = null;
    private waypointIndex = 0;
    private timer: number | null = null;
    /** 已演出过的忠义大站（防重复脉冲） */
    private appliedZhongyi = new Set<string>();
    /** 本程回填上限（每场战后在 MAX−JITTER~MAX 间重掷） */
    private refillCeiling = ZHONGYI_REFILL_MAX;
    /** 上一 tick 是否在战斗中（用于捕捉「战斗刚结束」这一帧做结算补员） */
    private wasInCombat = false;

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

    /** 点按钮：起兵北伐（已有岳飞军则切跟随并继续，不重复出兵） */
    public start(): void {
        const existing = this.findExistingYuefeiArmy();
        if (existing) {
            this.resumeOrStartScript(existing);
            this.notify('岳飞·背嵬军继续北伐');
            return;
        }

        const city = this.deps.cityManager.getCity(START_CITY_ID);
        if (!city) {
            this.notify('未找到起兵据点（郾城），无法北伐');
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
            return;
        }
        if (!this.deps.legionManager.getLegionById(army.id)) {
            this.notify('岳飞·背嵬军起兵失败（军团未注册）');
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
        this.rerollRefillCeiling();
        this.wasInCombat = false;

        gameLog('expedition', `🐎 [圆梦] 岳飞率背嵬军自郾城起兵，北伐黄龙：开封 → 北京 → 黄龙府，忠义归顺，众望所归`);
        this.notify('岳飞率背嵬军北伐——直捣黄龙！');

        this.attachFollowAndMarch(army);
    }

    /** 每 tick：推进路线、锁定当前目标城 */
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
            this.stop();
            return;
        }

        // 维持远征资格 & 精锐身份（防被常规逻辑改写）
        army.expeditionUnlocked = true;
        army.isElite = true;

        this.tickZhongyiTrickle(army);

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

    /** 重掷本程回填上限：MAX − 0~JITTER（与仿真同分布） */
    private rerollRefillCeiling(): void {
        this.refillCeiling =
            ZHONGYI_REFILL_MAX - Math.floor(Math.random() * (ZHONGYI_REFILL_JITTER + 1));
    }

    /**
     * 忠义归顺（脚本专属技）：捕捉「战斗刚结束」这一帧，重掷本程回填上限并一次性补齐。
     * 战后结算（非沿途涓流）→ 不依赖行军长短与倍速，与仿真「战后回填」完全对齐，
     * 保证下一场攻城处于 refillCeiling 的略优/略劣胶着区间。
     * 演出：白字绿光（与战略技脉冲同款配色），军团头顶飘四字技名「忠义归顺」。
     */
    private tickZhongyiTrickle(army: ScriptArmy): void {
        const inCombat = army.getIsInCombat?.() ?? false;
        if (inCombat) {
            this.wasInCombat = true;
            return;
        }
        if (!this.wasInCombat) return; // 只在「战斗刚结束」这一帧结算
        this.wasInCombat = false;
        this.rerollRefillCeiling();

        const troops = army.getTroops();
        if (troops <= 0 || troops >= this.refillCeiling) return;
        const added = this.refillCeiling - troops;
        army.setTroops(this.refillCeiling);

        const pos = army.getPosition?.();
        if (pos) spawnMapFloatingText(pos.lat, pos.lng, '忠义归顺', '#55ff55');
        gameLog(
            'expedition',
            `🐎 [圆梦] 忠义归顺 +${added.toLocaleString()}，背嵬军补至 ${this.refillCeiling.toLocaleString()} 众`,
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
        spawnMapPulse(city.latitude, city.longitude, '忠义归顺', '#55ff55');
    }

    /** 停止脚本推进（军团仍留在场上） */
    public stop(): void {
        if (this.timer != null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }

    private notify(msg: string): void {
        this.deps.notify?.(msg);
    }
}
