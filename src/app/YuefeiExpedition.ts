/**
 * 岳飞北伐黄龙圆梦脚本（2026-07-11）
 *
 * 玩家点「⚔ 岳飞北伐黄龙」按钮 → 郾城生成岳飞·背嵬军（10 万兵），
 * 镜头自动跟拍，按固定路线逐城远征：开封 → 北京 → 沈阳 → 黄龙府。
 * 打下一城即自动锁定下一城；直至拿下黄龙府（直捣黄龙）或全军覆没。
 *
 * 不改动任何常规游戏逻辑，仅借用现成远征机制（army.expeditionTargetCityId）：
 *   set target → 行为树锁死目标行军攻城（断粮不回）；
 *   target 变己方 → LegionBehaviors.resolveExpeditionState 自动清空 → 本脚本推进下一城。
 */

import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { gameLog } from '../utils/GameLogger';

/** 起兵据点：郾城（岳飞·郾川势力都城） */
const START_CITY_ID = 'city_yancheng2';
const FACTION_ID = 'yanchuan_d';
const GENERAL_ID = 'yanchuan_d_yuefei';
const ELITE_NAME = '背嵬军';
const TROOPS = 100000;

/** 圆梦路线：逐城攻取，终点黄龙府 */
const ROUTE: { id: string; name: string }[] = [
    { id: 'city_bianliang', name: '开封' },
    { id: 'city_beijing', name: '北京' },
    { id: 'city_shenyang', name: '沈阳' },
    { id: 'city_fuyu', name: '黄龙府' },
];

const TICK_INTERVAL_MS = 400;

/** 借用的军团实例最小接口（避免耦合 Army 全量类型） */
interface ScriptArmy {
    id: string;
    name: string;
    isDestroyed: boolean;
    isElite: boolean;
    generalId?: string;
    portraitPath?: string | null;
    expeditionTargetCityId: string | null;
    expeditionSavedName: string | null;
    expeditionUnlocked: boolean;
    getTroops(): number;
    setTroops(n: number): void;
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
        ): ScriptArmy | null;
        getLegionById(id: string): ScriptArmy | undefined;
    };
    cityManager: {
        getCity(id: string): ScriptCity | undefined;
    };
    cameraFollowUI: {
        setFollow(armyId: string, armyName: string): void;
    };
    /** 玩家提示（可选，走 toast/console） */
    notify?: (msg: string) => void;
}

export class YuefeiExpedition {
    private deps: YuefeiDeps;
    private armyId: string | null = null;
    private waypointIndex = 0;
    private timer: number | null = null;

    constructor(deps: YuefeiDeps) {
        this.deps = deps;
    }

    /** 是否已有一支在途的岳飞军团 */
    public isRunning(): boolean {
        if (this.timer == null || !this.armyId) return false;
        const army = this.deps.legionManager.getLegionById(this.armyId);
        return !!army && !army.isDestroyed;
    }

    /** 点按钮：起兵北伐（已在途则重新聚焦，不重复出兵） */
    public start(): void {
        if (this.isRunning()) {
            const army = this.deps.legionManager.getLegionById(this.armyId!);
            if (army) this.deps.cameraFollowUI.setFollow(army.id, army.name);
            this.notify('岳飞·背嵬军正在北伐途中');
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
        );
        if (!army) {
            this.notify('军团数已达上限，无法起兵（可先精简军团）');
            return;
        }

        // 强制 10 万兵（越过文化兵力上限）+ 精锐背嵬军 + 岳飞立绘 + 解锁远征资格
        army.setTroops(TROOPS);
        army.isElite = true;
        army.name = ELITE_NAME;
        army.expeditionUnlocked = true;
        if (!army.generalId) army.generalId = GENERAL_ID;
        const rec = getGeneralRecordByGeneralId(GENERAL_ID);
        if (rec?.portrait) army.portraitPath = rec.portrait;

        this.armyId = army.id;
        this.waypointIndex = 0;
        this.deps.cameraFollowUI.setFollow(army.id, army.name);

        gameLog('expedition', `🐎 [圆梦] 岳飞率背嵬军十万自郾城起兵，北伐黄龙：开封 → 北京 → 沈阳 → 黄龙府`);
        this.notify('岳飞率背嵬军十万北伐——直捣黄龙！');

        this.tick(); // 立刻锁定开封
        this.timer = window.setInterval(() => this.tick(), TICK_INTERVAL_MS);
    }

    /** 每 tick：推进路线、锁定当前目标城 */
    private tick(): void {
        if (!this.armyId) {
            this.stop();
            return;
        }
        const army = this.deps.legionManager.getLegionById(this.armyId);
        if (!army || army.isDestroyed || army.getTroops() <= 0) {
            const reached = ROUTE[Math.max(0, this.waypointIndex - 1)]?.name ?? '开封';
            gameLog('expedition', `🐎 [圆梦] 岳飞·背嵬军覆没，北伐止步于 ${reached} 一线，壮志未酬`);
            this.notify(`岳飞·背嵬军覆没，北伐止步于 ${reached} 一线`);
            this.stop();
            return;
        }

        // 维持远征资格 & 精锐身份（防被常规逻辑改写）
        army.expeditionUnlocked = true;
        army.isElite = true;

        // 跳过已攻克的路线城
        while (this.waypointIndex < ROUTE.length) {
            const wp = ROUTE[this.waypointIndex];
            const c = this.deps.cityManager.getCity(wp.id);
            if (c && c.factionId === FACTION_ID) {
                gameLog('expedition', `🐎 [圆梦] 岳飞·背嵬军已克 ${wp.name}`);
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
