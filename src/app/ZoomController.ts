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

export class ZoomController {
    private map: GameMap;
    private getFollowedArmy: () => any;
    private getIsInBattle: () => boolean;
    /** 战术层（zoom13 独立画布）是否激活 —— 激活期间规则 5 让位给规则 3 的冻结 */
    private getIsTacticalScene: () => boolean;

    /** 上一帧跟随的军团 id —— 变了就说明「换人了」，触发规则 1 */
    private lastArmyId: string | null = null;

    public enabled = true;

    constructor(
        map: GameMap,
        getFollowedArmy: () => any,
        getIsInBattle: () => boolean,
        getIsTacticalScene: () => boolean = () => false,
    ) {
        this.map = map;
        this.getFollowedArmy = getFollowedArmy;
        this.getIsInBattle = getIsInBattle;
        this.getIsTacticalScene = getIsTacticalScene;
    }

    public tick(): void {
        if (!this.enabled) return;

        const inBattle = this.getIsInBattle();
        const army = this.getFollowedArmy();
        const armyId: string | null = army?.id ?? null;
        const armyAlive = !!army && army.isDestroyed !== true && (army.getTroops?.() ?? 0) > 0;

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
            if (armyId && armyAlive) this.applyZoom(FOLLOW_START_ZOOM);
        }
        // 其余情况：保持当前 zoom 不动（行军途中、战后待命都锁定）
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
