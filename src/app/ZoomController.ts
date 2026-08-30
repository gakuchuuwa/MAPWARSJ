/**
 * ZoomController — 自动缩放控制
 *
 * 规则（2026-08-30 主人改）：
 *   1. 第一次跟随一支军团 → zoom 8（手递手），之后锁定，不再自动切换。
 *   2. 战术模式（zoom13 微观战斗）退出时，按兵种切换一次：
 *        陆军 → zoom 9；海军 → zoom 10。切换后再次锁定，直至下次战术模式退出。
 *   3. 战术模式激活期间完全冻结（sceneActive）。
 */

import { GameMap } from '../map/GameMap';

const LAND_ZOOM = 9;     // 陆军 zoom
const NAVAL_ZOOM = 10;   // 海军 zoom
const HANDOFF_ZOOM = 8;  // 第一次跟随军团手递手

export class ZoomController {
    private map: GameMap;
    private getFollowedArmy: () => any;
    private lastArmyId: string | null = null;
    private wasSceneActive: boolean = false;
    public enabled: boolean = true;

    constructor(map: GameMap, getFollowedArmy: () => any) {
        this.map = map;
        this.getFollowedArmy = getFollowedArmy;
    }

    public tick(): void {
        if (!this.enabled) return;
        const sceneActive = (window as any).game?.battleScene?.isActive?.() === true;
        const army = this.getFollowedArmy();
        const armyId = army?.id ?? null;

        // ── 战术模式退出边沿：按兵种切换一次（陆军 9 / 海军 10）──
        if (this.wasSceneActive && !sceneActive && armyId) {
            const zoom = army?.isOnSea ? NAVAL_ZOOM : LAND_ZOOM;
            this.applyZoom(zoom);
            this.lastArmyId = armyId;   // 视作已跟随，避免下方换人检测再切回 8
        }
        this.wasSceneActive = sceneActive;

        // 战术模式激活期间冻结
        if (sceneActive) return;

        // ── 第一次跟随（或换人）→ zoom 8，之后锁定 ──
        if (armyId !== this.lastArmyId) {
            this.lastArmyId = armyId;
            if (armyId) {
                this.applyZoom(HANDOFF_ZOOM);
            }
        }
        // 之后不再自动切换 zoom（锁定）。
    }

    private applyZoom(zoom: number): void {
        const leaflet = this.map.getLeafletMap();
        if (Math.abs(leaflet.getZoom() - zoom) < 0.01) return;
        leaflet.setZoom(zoom, { animate: true });
    }
}
