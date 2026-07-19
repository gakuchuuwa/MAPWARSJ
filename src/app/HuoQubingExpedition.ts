/**
 * 霍去病封狼居胥脚本（2026-07-19）
 *
 * 汉武帝元狩四年（前119年），票骑将军霍去病率五万精骑出代郡，
 * 轻骑急进、取食于敌，大破匈奴左贤王，封狼居胥山、禅于姑衍、登临瀚海。
 *
 * 玩家点「⚔ 霍去病封狼居胥」按钮：
 *   · 场上尚无霍去病军 → 灵仙生成霍去病·骠骑郎卫（2 万），镜头跟拍，开北伐脚本；
 *   · 场上已有霍去病军 → 加兵 1 万，切跟随并继续北伐。
 * 按必打路标逐城远征：上都 → 应昌 → 狼居胥山 → 姑衍山 → 贝加尔。
 *
 * 两场脚本专属野战（不建据点，仅野战坐标）：
 *   · 祷余山之战（达里湖北）：逼近时刷左贤王 5 万，霍去病加至 5 万迎战；
 *   · 弓庐水之战（度难侯山后追歼）：逼近时刷左贤王 2 万残部，霍去病 5 万追击。
 *
 * 旗号：脚本运行期间旗面显示「汉」、势力名显示「大汉」；结束/覆没后恢复。
 * 取食于敌：战后兵力低于 2 万触发，补到 [22222, 29000] 随机（与忠义归顺同参数）。
 */

import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';
import { spawnMapFloatingText } from '../utils/MapFloatingText';

/** 起兵据点：灵仙（汉代代郡治所，蔚县） */
const START_CITY_ID = 'city_daixian';
const FACTION_ID = 'suzhou';
const GENERAL_ID = 'suzhou_huoqubing';
const ELITE_NAME = '骠骑郎卫';
/** 起兵 2 万 */
const TROOPS = 20000;
/** 已有霍去病军时，再点 UI 加兵量 */
const CLICK_REINFORCE_TROOPS = 10000;

/** 必打路标：逐城攻取，终点贝加尔 */
const ROUTE: { id: string; name: string }[] = [
    { id: 'city_shangdu',    name: '上都' },
    { id: 'city_yingchang',  name: '应昌' },
    { id: 'city_langjuxu',   name: '狼居胥山' },
    { id: 'city_guyanshan',  name: '姑衍山' },
    { id: 'city_xiaoyenisei', name: '贝加尔' },
];

/** 取食于敌：触发线（同忠义归顺） */
const QUISHI_TRIGGER = 20000;
/** 补到目标区间（同忠义归顺） */
const QUISHI_TARGET_MIN = 22222;
const QUISHI_TARGET_MAX = 29000;

/** ── 两场脚本专属野战 ── */

/** 祷余山之战：达里湖北，大破左贤王主力 */
const DAOYUSHAN = { lat: 43.4031, lng: 116.5182 };
/** 弓庐水之战：度难侯山后穷追残部 */
const GONGLUSHUI = { lat: 46.9146, lng: 109.7452 };
/** 逼近触发距离（欧氏，约 30–40 km 量级） */
const BATTLE_TRIGGER_DIST = 0.30;

/** 左贤王 */
const ZUOXIAN_FACTION = 'xiongnu';
const ZUOXIAN_NAME = '左贤王';
const ZUOXIAN_PORTRAIT = '/assets/STEPPE/xiongnu_maodun.png';
/** 祷余山：左贤王主力 8 万 */
const ZUOXIAN_TROOPS_DAOYU = 80000;
/** 弓庐水：左贤王残部 4 万 */
const ZUOXIAN_TROOPS_GONGLU = 40000;
/** 霍去病战前兵力加至 5 万 */
const BATTLE_TROOPS = 50000;

const TICK_INTERVAL_MS = 400;

type BattlePhase = 'pending' | 'spawned' | 'done';

/** 借用的军团实例最小接口 */
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
}

interface HuoQubingDeps {
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

export class HuoQubingExpedition {
    private deps: HuoQubingDeps;
    private armyId: string | null = null;
    private waypointIndex = 0;
    private timer: number | null = null;
    /** 上一 tick 是否在战斗中 */
    private wasInCombat = false;

    /** 克城后休整截止时间戳 */
    private pauseUntilMs = 0;

    /** 临时覆盖：势力名 → 大汉 */
    private _origGetFactionName: ((id: string) => string) | null = null;

    /** 祷余山之战 */
    private daoyuPhase: BattlePhase = 'pending';
    private daoyuEnemyId: string | null = null;

    /** 弓庐水之战 */
    private gongluPhase: BattlePhase = 'pending';
    private gongluEnemyId: string | null = null;

    constructor(deps: HuoQubingDeps) {
        this.deps = deps;
    }

    /** 脚本 tick 是否在跑 */
    public isRunning(): boolean {
        return this.timer != null && !!this.findExistingArmy();
    }

    /** 场上是否已有霍去病·骠骑郎卫 */
    private isHuoQubingArmy(army: ScriptArmy): boolean {
        if (army.isDestroyed || army.getTroops() <= 0) return false;
        if (army.generalId === GENERAL_ID) return true;
        if (army.homeCityId === START_CITY_ID && army.name === ELITE_NAME) return true;
        return false;
    }

    /** 查找已有霍去病军团 */
    private findExistingArmy(): ScriptArmy | undefined {
        if (this.armyId) {
            const cached = this.deps.legionManager.getLegionById(this.armyId);
            if (cached && this.isHuoQubingArmy(cached)) return cached;
        }
        const candidates = this.deps.legionManager
            .getArmies()
            .filter((a) => this.isHuoQubingArmy(a));
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

    /** 脚本期间势力名→「大汉」、旗号→「汉」 */
    private applyExpeditionOverride(): void {
        this.deps.cityManager.refreshFactionFlagText?.(FACTION_ID);
        this.overrideFactionName();
    }

    /** 临时覆盖 FactionManager.getFactionName：suzhou → 「大汉」 */
    private overrideFactionName(): void {
        const fm = (window as any).game?.factionManager;
        if (!fm || this._origGetFactionName) return;
        this._origGetFactionName = fm.getFactionName.bind(fm);
        const self = this;
        fm.getFactionName = function (id: string): string {
            if (id === FACTION_ID) return '大汉';
            return self._origGetFactionName!(id);
        };
    }

    private restoreFactionName(): void {
        const fm = (window as any).game?.factionManager;
        if (!fm || !this._origGetFactionName) return;
        fm.getFactionName = this._origGetFactionName;
        this._origGetFactionName = null;
    }

    /** 起兵失败时回滚覆盖 */
    private rollbackExpeditionOverride(): void {
        (window as any).__huoqubingExpeditionActive = false;
        this.deps.cityManager.refreshFactionFlagText?.(FACTION_ID);
        this.restoreFactionName();
    }

    /** 点按钮：无霍去病军则起兵；已有则加兵一万 */
    public start(): void {
        (window as any).__huoqubingExpeditionActive = true;
        this.applyExpeditionOverride();
        const existing = this.findExistingArmy();
        if (existing) {
            const before = existing.getTroops();
            existing.setTroops(before + CLICK_REINFORCE_TROOPS);
            this.resumeOrStartScript(existing);
            gameLog(
                'expedition',
                `🐎 [封狼居胥] 再点增援 +${CLICK_REINFORCE_TROOPS.toLocaleString()}，骠骑郎卫 ${(before + CLICK_REINFORCE_TROOPS).toLocaleString()} 众`,
            );
            this.notify('霍去病·骠骑郎卫增兵一万');
            return;
        }

        const city = this.deps.cityManager.getCity(START_CITY_ID);
        if (!city) {
            this.notify('未找到起兵据点（灵仙），无法北伐');
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
            this.notify('霍去病·骠骑郎卫起兵失败');
            this.rollbackExpeditionOverride();
            return;
        }
        if (!this.deps.legionManager.getLegionById(army.id)) {
            this.notify('霍去病·骠骑郎卫起兵失败（军团未注册）');
            this.rollbackExpeditionOverride();
            return;
        }

        army.setTroops(TROOPS);
        army.isElite = true;
        army.name = ELITE_NAME;
        army.expeditionUnlocked = true;
        if (!army.generalId) army.generalId = GENERAL_ID;
        const rec = getGeneralRecordByGeneralId(GENERAL_ID);
        if (rec?.portrait) army.portraitPath = rec.portrait;

        this.armyId = army.id;
        this.waypointIndex = 0;
        this.wasInCombat = false;
        this.pauseUntilMs = 0;
        this.daoyuPhase = 'pending';
        this.daoyuEnemyId = null;
        this.gongluPhase = 'pending';
        this.gongluEnemyId = null;

        gameLog('expedition', `🐎 [封狼居胥] 霍去病率骠骑郎卫自灵仙起兵：上都 → 应昌 → 狼居胥山 → 姑衍山 → 贝加尔`);
        this.notify('霍去病率骠骑郎卫北伐——封狼居胥！');

        this.attachFollowAndMarch(army);
    }

    /** 每 tick：推进路线、锁定当前目标城；两场野战优先于攻城 */
    private tick(): void {
        if (!this.armyId) {
            this.stop();
            return;
        }
        const army = this.deps.legionManager.getLegionById(this.armyId);
        if (!army || army.isDestroyed || army.getTroops() <= 0) {
            this.armyId = null;
            const reached = ROUTE[Math.max(0, this.waypointIndex - 1)]?.name ?? '灵仙';
            gameLog('expedition', `🐎 [封狼居胥] 霍去病·骠骑郎卫覆没，北伐止步于 ${reached} 一线`);
            this.notify(`霍去病·骠骑郎卫覆没，止步于 ${reached}`);
            this.cleanupAllEnemies();
            this.stop();
            return;
        }

        // 维持远征资格 & 精锐身份
        army.expeditionUnlocked = true;
        army.isElite = true;

        // 攻城战预设必胜
        if (!(army as any).siegeMissionData) (army as any).siegeMissionData = {};
        (army as any).siegeMissionData.result = 'attacker_win';

        // 任何战斗必胜
        this.enforceAlwaysWin();

        this.tickQushi(army);

        // 克城休整
        if (Date.now() < this.pauseUntilMs) {
            army.__scriptPinned = true;
            return;
        }
        army.__scriptPinned = false;

        // ── 两场野战 ──
        this.tickDaoyushan(army);
        this.tickGonglushui(army);

        // 跳过已攻克的路线城
        while (this.waypointIndex < ROUTE.length) {
            const wp = ROUTE[this.waypointIndex];
            const c = this.deps.cityManager.getCity(wp.id);
            if (c && c.factionId === FACTION_ID) {
                gameLog('expedition', `🐎 [封狼居胥] 霍去病·骠骑郎卫已克 ${wp.name}`);
                this.waypointIndex++;
                continue;
            }
            break;
        }

        // 全线打通 → 封狼居胥功成
        if (this.waypointIndex >= ROUTE.length) {
            army.expeditionTargetCityId = null;
            gameLog('expedition', `🐎 [封狼居胥] 霍去病·骠骑郎卫登临贝加尔，封狼居胥功成`);
            this.notify('登临瀚海，封狼居胥！霍去病北伐功成 🎉');
            this.stop();
            return;
        }

        // 锁定当前目标城
        if (Date.now() < this.pauseUntilMs) return;
        const desired = ROUTE[this.waypointIndex];
        if (army.expeditionTargetCityId !== desired.id) {
            if (army.name !== ELITE_NAME) army.name = ELITE_NAME;
            army.expeditionTargetCityId = desired.id;
            gameLog('expedition', `🐎 [封狼居胥] 霍去病·骠骑郎卫锁定目标：${desired.name}`);
        }
    }

    // ═══════════════════════════════════════════
    // 祷余山之战
    // ═══════════════════════════════════════════

    private tickDaoyushan(army: ScriptArmy): void {
        if (this.daoyuPhase === 'done') return;

        const pos = army.getPosition?.();
        if (!pos) return;

        if (this.daoyuPhase === 'pending') {
            if (getEuclideanDistance(pos, DAOYUSHAN) > BATTLE_TRIGGER_DIST) return;

            if (!this.spawnZuoxian('daoyu', DAOYUSHAN, ZUOXIAN_TROOPS_DAOYU)) {
                this.daoyuPhase = 'done';
                return;
            }
            this.daoyuPhase = 'spawned';
            // 霍去病兵力加至 5 万
            army.setTroops(BATTLE_TROOPS);
            gameLog(
                'expedition',
                `🐎 [封狼居胥] 祷余山遭遇匈奴左贤王主力（${ZUOXIAN_TROOPS_DAOYU.toLocaleString()}），骠骑郎卫 ${BATTLE_TROOPS.toLocaleString()} 迎战`,
            );
            this.notify('祷余山——左贤王主力拦路！');
            return;
        }

        // spawned：钉死左贤王；等战斗结束
        this.pinZuoxian(this.daoyuEnemyId, DAOYUSHAN);
        const enemy = this.daoyuEnemyId
            ? this.deps.legionManager.getLegionById(this.daoyuEnemyId)
            : undefined;
        const enemyAlive = !!enemy && !enemy.isDestroyed && enemy.getTroops() > 0;

        if (enemyAlive) return;

        const inCombat = army.getIsInCombat?.() ?? false;
        if (!inCombat) {
            this.daoyuPhase = 'done';
            this.cleanupZuoxian(this.daoyuEnemyId);
            this.daoyuEnemyId = null;
            gameLog('expedition', `🐎 [封狼居胥] 祷余山大捷——左贤王主力溃败`);
        }
    }

    // ═══════════════════════════════════════════
    // 弓庐水之战
    // ═══════════════════════════════════════════

    private tickGonglushui(army: ScriptArmy): void {
        if (this.gongluPhase === 'done') return;

        const pos = army.getPosition?.();
        if (!pos) return;

        if (this.gongluPhase === 'pending') {
            if (getEuclideanDistance(pos, GONGLUSHUI) > BATTLE_TRIGGER_DIST) return;

            if (!this.spawnZuoxian('gonglu', GONGLUSHUI, ZUOXIAN_TROOPS_GONGLU)) {
                this.gongluPhase = 'done';
                return;
            }
            this.gongluPhase = 'spawned';
            army.setTroops(BATTLE_TROOPS);
            gameLog(
                'expedition',
                `🐎 [封狼居胥] 弓庐水遭遇左贤王残部（${ZUOXIAN_TROOPS_GONGLU.toLocaleString()}），骠骑郎卫 ${BATTLE_TROOPS.toLocaleString()} 追击`,
            );
            this.notify('弓庐水——左贤王残部再战！');
            return;
        }

        this.pinZuoxian(this.gongluEnemyId, GONGLUSHUI);
        const enemy = this.gongluEnemyId
            ? this.deps.legionManager.getLegionById(this.gongluEnemyId)
            : undefined;
        const enemyAlive = !!enemy && !enemy.isDestroyed && enemy.getTroops() > 0;

        if (enemyAlive) return;

        const inCombat = army.getIsInCombat?.() ?? false;
        if (!inCombat) {
            this.gongluPhase = 'done';
            this.cleanupZuoxian(this.gongluEnemyId);
            this.gongluEnemyId = null;
            gameLog('expedition', `🐎 [封狼居胥] 弓庐水再捷——左贤王残部覆灭`);
        }
    }

    // ═══════════════════════════════════════════
    // 左贤王 刷兵 / 钉死 / 清理
    // ═══════════════════════════════════════════

    private spawnZuoxian(
        battle: 'daoyu' | 'gonglu',
        pos: { lat: number; lng: number },
        troops: number,
    ): boolean {
        const enemy = this.deps.legionManager.createLegion(
            { ...pos },
            troops,
            ZUOXIAN_FACTION,
            ZUOXIAN_NAME,
            undefined,
            undefined,
            'city_toumancheng',
            undefined, // 不绑游戏内武将
            true,
        );
        if (!enemy) {
            gameLog('expedition', `🐎 [封狼居胥] 刷左贤王失败（${battle}）`);
            return false;
        }
        enemy.setPosition?.(pos.lat, pos.lng);
        enemy.setTroops(troops);
        enemy.name = ZUOXIAN_NAME;
        enemy.portraitPath = ZUOXIAN_PORTRAIT;
        enemy.__scriptPinned = true;
        enemy.ignoreCityCollision = true;
        enemy.stopMovement?.(false);
        enemy.setTargetCity?.(null);
        enemy.expeditionTargetCityId = null;

        if (battle === 'daoyu') {
            this.daoyuEnemyId = enemy.id;
        } else {
            this.gongluEnemyId = enemy.id;
        }
        return true;
    }

    private pinZuoxian(enemyId: string | null, homePos: { lat: number; lng: number }): void {
        if (!enemyId) return;
        const e = this.deps.legionManager.getLegionById(enemyId);
        if (!e || e.isDestroyed || e.getTroops() <= 0) return;
        e.__scriptPinned = true;
        e.ignoreCityCollision = true;
        e.expeditionTargetCityId = null;
        e.setTargetCity?.(null);
        if (e.getIsInCombat?.()) return;
        e.stopMovement?.(false);
        const p = e.getPosition?.();
        if (p && getEuclideanDistance(p, homePos) > 0.05) {
            e.setPosition?.(homePos.lat, homePos.lng);
        }
    }

    private cleanupZuoxian(enemyId: string | null): void {
        if (!enemyId) return;
        const e = this.deps.legionManager.getLegionById(enemyId);
        if (e && !e.isDestroyed) {
            e.__scriptPinned = false;
        }
    }

    private cleanupAllEnemies(): void {
        this.cleanupZuoxian(this.daoyuEnemyId);
        this.daoyuEnemyId = null;
        this.cleanupZuoxian(this.gongluEnemyId);
        this.gongluEnemyId = null;
    }

    // ═══════════════════════════════════════════
    // 必胜 / 取食于敌 / stop
    // ═══════════════════════════════════════════

    /** 霍去病任何战斗必胜 */
    private enforceAlwaysWin(): void {
        const armyId = this.armyId;
        if (!armyId) return;
        const fields = (window as any).game?.combatSystem?.getActiveBattleFields?.() as
            | any[]
            | undefined;
        if (!fields?.length) return;

        for (const bf of fields) {
            if (!bf || bf.isOver) continue;

            const inAttacker = (bf.getAttackerUnits?.() ?? []).some((u: any) => u?.id === armyId);
            const inDefender = inAttacker
                ? false
                : (bf.getDefenderUnits?.() ?? []).some((u: any) => u?.id === armyId);
            if (!inAttacker && !inDefender) continue;

            const want = inAttacker ? 'attacker_win' : 'defender_win';
            if (bf.presetResult === want) continue;

            bf.presetResult = want;
            bf.pickPredictedSides?.();
            bf.strongerCasualtyReduction = 0;
            gameLog(
                'expedition',
                `⚔️ [封狼居胥] 霍去病参战，本战改判${inAttacker ? '攻方' : '守方'}必胜`,
            );
        }
    }

    /**
     * 取食于敌：战后兵力低于 2 万触发，补到 [22222, 29000] 随机。
     * 战后结算（非涓流），与忠义归顺同参数。
     */
    private tickQushi(army: ScriptArmy): void {
        const inCombat = army.getIsInCombat?.() ?? false;
        if (inCombat) {
            this.wasInCombat = true;
            return;
        }
        if (!this.wasInCombat) return;
        this.wasInCombat = false;

        const troops = army.getTroops();
        if (troops <= 0) return;
        if (troops >= QUISHI_TRIGGER) return;

        const target =
            QUISHI_TARGET_MIN +
            Math.floor(Math.random() * (QUISHI_TARGET_MAX - QUISHI_TARGET_MIN + 1));
        const added = target - troops;
        if (added <= 0) return;
        army.setTroops(target);

        const pos = army.getPosition?.();
        if (pos) spawnMapFloatingText(pos.lat, pos.lng, '取食于敌', '#ffcc44');
        gameLog(
            'expedition',
            `🐎 [封狼居胥] 取食于敌 +${added.toLocaleString()}，骠骑郎卫补至 ${target.toLocaleString()} 众`,
        );
    }

    /** 停止脚本推进（军团仍留在场上） */
    public stop(): void {
        (window as any).__huoqubingExpeditionActive = false;
        const army = this.armyId ? this.deps.legionManager.getLegionById(this.armyId) : undefined;
        if (army) (army as any).siegeMissionData = null;
        this.deps.cityManager.refreshFactionFlagText?.(FACTION_ID);
        this.restoreFactionName();
        this.cleanupAllEnemies();
        if (this.timer != null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }

    private notify(msg: string): void {
        this.deps.notify?.(msg);
    }
}
