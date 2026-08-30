/**
 * ZoomController — 自动缩放控制
 *
 * 规则（2026-08-30 主人改）：
 *   1. 只有第一次跟随一支军团 → zoom 8；此后永不再用 8。
 *   2. 只要经过战斗（战术模式 zoom13 或 战略地图区域战），战斗结束就切：
 *        陆军 → zoom 9；海军 → zoom 10。
 *   3. 战败转移（FOLLOW_SWITCH_DELAY_MS 后切下一支）时，zoom 切换与转移同步，
 *      不在「战斗结束」与「转移」之间切两次（主人：不要频繁缩放）。
 *   4. 战斗中冻结（不切换）。
 */

import { GameMap } from '../map/GameMap';

const LAND_ZOOM = 9;     // 陆军 zoom
const NAVAL_ZOOM = 10;   // 海军 zoom
const HANDOFF_ZOOM = 8;  // 仅第一次跟随军团

export class ZoomController {
    private map: GameMap;
    private getFollowedArmy: () => any;
    private getIsInBattle: () => boolean;
    private lastArmyId: string | null = null;
    private wasInBattle: boolean = false;
    /** 是否经历过战斗（全局，一旦 true 永远 true）——战斗过后永不再用 zoom 8 */
    private everBattled: boolean = false;
    public enabled: boolean = true;

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
        const armyId = army?.id ?? null;
        const armyAlive = !!army && army.isDestroyed !== true && (army.getTroops?.() ?? 0) > 0;

        // ── 战斗结束边沿 ──
        if (this.wasInBattle && !inBattle) {
            this.everBattled = true;   // 战斗过就标记（无论胜负）
            // 军团存活（胜利，不转移）→ 立即切 9/10；
            // 军团阵亡（失败，5 秒后转移）→ 不切，等下方换人检测，避免 5 秒内切两次
            if (armyId && armyAlive) {
                this.applyZoom(army?.isOnSea ? NAVAL_ZOOM : LAND_ZOOM);
                this.lastArmyId = armyId;
            }
        }
        this.wasInBattle = inBattle;

        // 战斗中冻结
        if (inBattle) return;

        // ── 换人跟随（或首次跟随）──
        if (armyId !== this.lastArmyId) {
            this.lastArmyId = armyId;
            if (armyId && armyAlive) {
                // 战斗过 → 按兵种 9/10；没战斗过 → 第一次跟随 8
                this.applyZoom(
                    this.everBattled ? (army?.isOnSea ? NAVAL_ZOOM : LAND_ZOOM) : HANDOFF_ZOOM,
                );
            }
        }
        // 稳定状态：锁定，不再自动切换
    }

    private applyZoom(zoom: number): void {
        const leaflet = this.map.getLeafletMap();
        if (Math.abs(leaflet.getZoom() - zoom) < 0.01) return;
        leaflet.setZoom(zoom, { animate: true });
    }
}
