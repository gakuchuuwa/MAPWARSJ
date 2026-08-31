/**
 * ZoomController — 自动缩放控制
 *
 * 规则（2026-08-31 主人重定，**旧规则已整套作废，勿参考历史注释**）：
 *   1. **开始跟随一支新军团 → zoom 8**。首次跟随是这一条，战败后换人也是这一条。
 *   2. **该军团每打完一场仗（战略区域战 / 战术 zoom13 都算）→ 按形态切**：
 *        陆军 → zoom 9；海军 → zoom 10。切完保持到下一场仗。
 *   3. **战斗中冻结**，一格都不动。
 *   4. 跟随军团战败时**不切 9/10** —— 它马上就要被换掉（CameraFollowUI 的 5 秒延迟），
 *      等换人那一下按规则 1 直接回 8，避免 5 秒内连切两次（主人：不要频繁缩放）。
 *
 * 🔴 与旧版的关键差别：旧版有个**全局永久锁** `everBattled`（一旦打过仗就永不再用 8），
 *    那条与规则 1 直接冲突 —— 战败换新军团时回不到 8。已删除，改为**跟着「当前跟随对象」走**：
 *    换一支军团就是一次全新的 8 → 9/10 循环。
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

    /** 上一帧跟随的军团 id —— 变了就说明「换人了」，触发规则 1 */
    private lastArmyId: string | null = null;
    /** 上一帧是否在战斗中 —— 用来识别「战斗结束」这个边沿 */
    private wasInBattle = false;

    public enabled = true;

    constructor(
        map: GameMap,
        getFollowedArmy: () => any,
        getIsInBattle: () => boolean,
    ) {
        this.map = map;
        this.getFollowedArmy = getFollowedArmy;
        this.getIsInBattle = getIsInBattle;
    }

    public tick(): void {
        if (!this.enabled) return;

        const inBattle = this.getIsInBattle();
        const army = this.getFollowedArmy();
        const armyId: string | null = army?.id ?? null;
        const armyAlive = !!army && army.isDestroyed !== true && (army.getTroops?.() ?? 0) > 0;

        // ── 规则 2：战斗结束的那一帧（上一帧在打、这一帧不打了）──
        //    只有军团还活着才切 9/10；战败的不切（规则 4），等换人时回 8。
        const battleJustEnded = this.wasInBattle && !inBattle;
        this.wasInBattle = inBattle;
        if (battleJustEnded && armyId && armyAlive) {
            this.applyZoom(army?.isOnSea ? NAVAL_ZOOM : LAND_ZOOM);
            this.lastArmyId = armyId;   // 同步，免得下面又当成「换人」再切一次
            return;
        }

        // ── 规则 3：战斗中冻结 ──
        //    注意要放在「战斗结束」之后：结束边沿那一帧 inBattle 已经是 false，不会被这里拦掉。
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

    private applyZoom(zoom: number): void {
        const leaflet = this.map.getLeafletMap();
        if (Math.abs(leaflet.getZoom() - zoom) < 0.01) return;
        leaflet.setZoom(zoom, { animate: true });
    }
}
