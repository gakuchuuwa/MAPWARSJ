/**
 * ZoomController — 自动缩放控制
 *
 * 规则（2026-08-30 主人改，不可偏离）：
 *   1. 每次切换间隔 ≥15 秒。
 *   2. 新跟随军团 → zoom 8（手递手，2.5 秒后按兵种切）。
 *   3. 陆军（行军+陆战）→ zoom 9；海军（航行+海战）→ zoom 10。不因战斗切换 zoom。
 *   4. 战术模式（zoom13 微观战斗）激活时冻结（sceneActive）。
 */

import { GameMap } from '../map/GameMap';

const LAND_ZOOM = 9;     // 陆军 zoom（行军 + 陆战统一）
const NAVAL_ZOOM = 10;   // 海军 zoom（航行 + 海战统一）
const HANDOFF_ZOOM = 8;  // 新跟随军团手递手
const HANDOFF_HOLD_MS = 2500;
const MIN_INTERVAL_MS = 15000;

export class ZoomController {
    private map: GameMap;
    private getFollowedArmy: () => any;
    private currentZoom: number = LAND_ZOOM;
    private lastZoomChangeAt: number = 0;
    private handoffTimer: ReturnType<typeof setTimeout> | null = null;
    private lastArmyId: string | null = null;
    public enabled: boolean = true;

    constructor(map: GameMap, getFollowedArmy: () => any) {
        this.map = map;
        this.getFollowedArmy = getFollowedArmy;
    }

    public tick(): void {
        if (!this.enabled) return;
        // 战术模式（zoom13 独立战斗画布）激活时，战略地图自动缩放完全冻结。
        const sceneActive = (window as any).game?.battleScene?.isActive?.() === true;
        if (sceneActive) return;
        const army = this.getFollowedArmy();
        const armyId = army?.id ?? null;

        // ── 跟随目标换人 → 拉远到 8 ──
        if (armyId !== this.lastArmyId) {
            this.lastArmyId = armyId;
            if (armyId) { this.beginHandoff(); return; }
        }
        if (this.handoffTimer !== null) return;

        // ── 陆军 9 / 海军 10，不因战斗切换 ──
        this.trySwitch(army?.isOnSea ? NAVAL_ZOOM : LAND_ZOOM);
    }

    /** 切 zoom。≥15s 才执行。只在 zoom 实际变化时重置计时器。 */
    private trySwitch(zoom: number): void {
        if (performance.now() - this.lastZoomChangeAt < MIN_INTERVAL_MS) return;
        if (Math.abs(this.currentZoom - zoom) < 0.01) return;
        this.currentZoom = zoom;
        this.lastZoomChangeAt = performance.now();
        this.applyZoom(zoom);
    }

    private beginHandoff(): void {
        if (this.handoffTimer !== null) clearTimeout(this.handoffTimer);

        this.currentZoom = HANDOFF_ZOOM;
        this.lastZoomChangeAt = performance.now();
        this.applyZoom(HANDOFF_ZOOM);

        this.handoffTimer = setTimeout(() => {
            this.handoffTimer = null;
            this.currentZoom = HANDOFF_ZOOM;
        }, HANDOFF_HOLD_MS);
    }

    private applyZoom(zoom: number): void {
        const leaflet = this.map.getLeafletMap();
        if (Math.abs(leaflet.getZoom() - zoom) < 0.01) return;
        leaflet.setZoom(zoom, { animate: true });
    }
}
