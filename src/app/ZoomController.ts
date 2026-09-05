/**
 * ZoomController — 自动缩放控制
 *
 * 规则（2026-09-01 主人重定，**旧规则已整套作废，勿参考历史注释**）：
 *   1. **开始跟随一支新军团 → zoom 8**。首次跟随是这一条，战败后换人也是这一条。
 *   2. **战略地图上一开打就按形态切**：海战（舰队 vs 舰队）→ zoom 10；
 *        陆地战 → zoom 9。**攻城战一律算陆地战**，舰队打据点也走 9。
 *        海战判据 = 跟随军团在海上**且**这场是野战（`currentBattleType === 'field'`）。
 *        不做边沿判定而是每帧对齐：开战那一帧 `currentBattleType` 未必已写好，
 *        每帧比对可以等它写好再切；`applyZoom` 本身幂等，已经到位就不动。
 *   3. **战术层（zoom13 独立画布）激活期间冻结**，一格都不动 —— 13 自己管镜头
 *        （进场 flyTo 13、退场 flyTo 回 8）。
 *   5. **陆/海行军连续 15 秒 → 切到目标 zoom**（2026-09-02 二修）：
 *        陆上行军 15 秒 → 9（除非已经在 9）；海上行军 15 秒 → 10（除非已经在 10）。
 *        **无论当前 zoom 是几**（8/9/10 都算），只看「是否已到目标 zoom」。
 *        计时口径 = **真实秒**（卡顿是真实时间现象，与游戏倍速无关）。
 *        计时器在这些时刻清零重来：开打、进 13、换人（规则 1 回 8）、军团停下
 *        （到站 / 受阻 / 战后休整）、陆↔海切换（换了 15 秒窗口重新计）、已到目标 zoom。
 *   4. **战斗结束不切**（2026-09-01 主人去掉）：开打那一下已经切到位了，
 *        打完再切一次纯属多余的缩放动作。战后保持当前 zoom，直到下一场开打或换人。
 *        战败的军团同理不切 —— 它马上要被换掉（CameraFollowUI 5 秒延迟），
 *        等换人那一下按规则 1 回 8。
 *
 * 🔴 与旧版的关键差别：
 *    · 旧版有个**全局永久锁** `everBattled`（一旦打过仗就永不再用 8），与规则 1 冲突，已删。
 *      现在状态**跟着「当前跟随对象」走**：换一支军团 = 一次全新的 8 → 9/10 循环。
 *    · 旧版靠「战斗结束边沿」切 9/10（需要 `wasInBattle`），现在改成开打即切，
 *      边沿和那个状态位一起删了。
 */
import { GameMap } from '../map/GameMap';

/** 陆军战后 zoom */
const LAND_ZOOM = 9;
/** 海军战后 zoom */
const NAVAL_ZOOM = 10;
/** 开始跟随一支新军团时的 zoom（首次跟随 / 战败换人都用它） */
const FOLLOW_START_ZOOM = 8;
/** 规则 5：陆/海行军连续多久（真实毫秒）后切到目标 zoom */
const MARCH_ZOOM_TIMEOUT_MS = 15_000;

export class ZoomController {
    private map: GameMap;
    private getFollowedArmy: () => any;
    private getIsInBattle: () => boolean;
    /** 战术层（zoom13 独立画布）是否激活 —— 激活期间规则 5 让位给规则 3 的冻结 */
    private getIsTacticalScene: () => boolean;
    /**
     * 当前跟随的是不是玩家（独行 或 入伍随军都算）。
     * 🔴 **只用来关规则 1**（跟随新目标 → 8）：玩家的镜头交给玩家自己。
     *    规则 5（行军 15 秒 → 陆 9 / 海 10）对玩家照常生效 ——
     *    2026-09-05 主人报「玩家行军 15 秒 ZOOM 不变」，根因就是当时把玩家整个排除在
     *    ZoomController 之外（getFollowedArmy 对玩家返回 null），连规则 5 一起关掉了。
     */
    private getIsPlayerHost: () => boolean;

    /** 上一帧跟随的军团 id —— 变了就说明「换人了」，触发规则 1 */
    private lastArmyId: string | null = null;
    /** 规则 5：陆/海行军连续行军的起始真实时刻；null = 没在计时 */
    private marchZoomSinceMs: number | null = null;
    /** 规则 5：当前行军是海(true)/陆(false)；切换时清零计时 */
    private marchSeaType: boolean | null = null;
    /** 时钟（可注入，便于验收脚本快进） */
    private now: () => number;

    public enabled = true;

    constructor(
        map: GameMap,
        getFollowedArmy: () => any,
        getIsInBattle: () => boolean,
        getIsTacticalScene: () => boolean = () => false,
        getIsPlayerHost: () => boolean = () => false,
        now: () => number = () => Date.now(),
    ) {
        this.map = map;
        this.getFollowedArmy = getFollowedArmy;
        this.getIsInBattle = getIsInBattle;
        this.getIsTacticalScene = getIsTacticalScene;
        this.getIsPlayerHost = getIsPlayerHost;
        this.now = now;
    }

    public tick(): void {
        if (!this.enabled) return;

        const inBattle = this.getIsInBattle();
        const army = this.getFollowedArmy();
        const armyId: string | null = army?.id ?? null;
        const armyAlive = !!army && army.isDestroyed !== true && (army.getTroops?.() ?? 0) > 0;

        // 开打 / 进 13 一律清零规则 5 的计时器：这两种情况下 zoom 由规则 2、3 接管
        if (inBattle || this.getIsTacticalScene()) this.marchZoomSinceMs = null;

        // ── 规则 2：战略地图上一开打就按形态切（海战 10 / 陆地战 9，攻城=陆地战）──
        //    战术层（13 独立画布）自己管镜头，激活期间让位给规则 3 的冻结。
        if (inBattle && armyId && armyAlive && !this.getIsTacticalScene()) {
            this.applyZoom(ZoomController.isNavalBattle(army) ? NAVAL_ZOOM : LAND_ZOOM);
            this.lastArmyId = armyId;
            return;
        }

        // ── 规则 3：战术层期间冻结（也兜住「军团已战败」等切不了的情形）──
        if (inBattle) {
            this.lastArmyId = armyId;   // 战斗中换人（援军接管跟拍等）不切镜头，但要记住
            return;
        }

        // ── 规则 1：开始跟随一支新军团 → 8 ──
        //    首次跟随、战败后换人，走的都是这一条。
        if (armyId !== this.lastArmyId) {
            this.lastArmyId = armyId;
            this.marchZoomSinceMs = null;   // 换人 = 规则 5 重新计时
            // 玩家入伍的军团：不缩放到 8（玩家镜头手动控制），但 lastArmyId 照常更新
            if (armyId && armyAlive && !this.getIsPlayerHost()) this.applyZoom(FOLLOW_START_ZOOM);
        }

        // ── 规则 5：陆/海行军连续 15 秒 → 切到目标 zoom（陆 9 / 海 10）──
        this.tickMarchZoomSwitch(army, armyId, armyAlive);

        // 其余情况：保持当前 zoom 不动（行军途中、战后待命都锁定）
    }

    /**
     * 规则 5：陆/海行军连续 15 秒 → 切到目标 zoom（陆→9、海→10），除非已经到目标。
     * **不看当前 zoom 是几**（8/9/10 都触发），只看「是否已到目标」。
     * 军团一停 / 陆↔海切换 / 已到目标，计时清零重来。
     */
    private tickMarchZoomSwitch(army: any, armyId: string | null, armyAlive: boolean): void {
        const marching = typeof army?.isMarching === 'function' ? army.isMarching() === true : false;
        const isOnSea = army?.isOnSea === true;
        const targetZoom = isOnSea ? NAVAL_ZOOM : LAND_ZOOM;
        const atTarget = Math.abs(this.map.getLeafletMap().getZoom() - targetZoom) < 0.01;
        if (!armyId || !armyAlive || !marching || atTarget || this.marchSeaType !== isOnSea) {
            this.marchZoomSinceMs = null;
            this.marchSeaType = isOnSea;
            return;
        }
        const t = this.now();
        if (this.marchZoomSinceMs === null) {
            this.marchZoomSinceMs = t;
            return;
        }
        if (t - this.marchZoomSinceMs < MARCH_ZOOM_TIMEOUT_MS) return;
        // 行军途中没有战斗类型，海军判据只看 isOnSea（勿照抄规则 2 的 field 条件）
        this.applyZoom(targetZoom);
        this.marchZoomSinceMs = null;
    }

    /**
     * 这场仗是不是海战。海战 = **舰队 vs 舰队**，只在战略地图上打（没有 zoom13 战术层）。
     * **攻城战一律算陆地战**（主人 2026-09-01 明确）——`currentBattleType === 'siege'`
     * 一律不算海战，哪怕打的人是舰队。
     */
    private static isNavalBattle(army: any): boolean {
        return army?.isOnSea === true && army?.currentBattleType === 'field';
    }

    private applyZoom(zoom: number): void {
        const leaflet = this.map.getLeafletMap();
        if (Math.abs(leaflet.getZoom() - zoom) < 0.01) return;
        leaflet.setZoom(zoom, { animate: true });
    }
}
