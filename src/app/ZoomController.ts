/**
 * ZoomController — 自动缩放控制
 *
 * 规则（2026-08-30 主人改）：
 *   1. 只有第一次跟随一支军团 → zoom 8；此后永不再用 8。
 *   2. 只要经过战斗（战术模式 zoom13 或 战略地图区域战），战斗结束就切：
 *        陆军 → zoom 9；海军 → zoom 10。
 *   3. 切过后锁定 9/10，换跟随军团也不回 8。
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

        // ── 战斗结束边沿：切 9/10，标记「已战斗」──
        if (this.wasInBattle && !inBattle && armyId) {
            const zoom = army?.isOnSea ? NAVAL_ZOOM : LAND_ZOOM;
            this.applyZoom(zoom);
            this.everBattled = true;
            this.lastArmyId = armyId;   // 避免下方换人检测再切回 8
        }
        this.wasInBattle = inBattle;

        // 战斗中冻结
        if (inBattle) return;

        // ── 换人跟随（或首次跟随）──
        if (armyId !== this.lastArmyId) {
            this.lastArmyId = armyId;
            if (armyId) {
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
