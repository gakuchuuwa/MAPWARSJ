/**
 * ZoomController — 自动缩放控制
 *
 * 规则（不可偏离）：
 *   1. 每次切换间隔 ≥15 秒。
 *   2. 只在战斗边界切换：进入战斗时 / 退出战斗 5 秒后。
 *   3. 新跟随军团 → zoom 8。
 *   4. 8 只切 10，不切 9。链路：8 → 10 → 9 → 10 → 9 …
 *   5. 进入战斗 + 满足 15 秒 → 立刻切 10。
 *   6. 退出战斗 + 满足 15 秒 + 停留 5 秒 → 切 9。
 *
 * 【2026-08-09】仅把战斗档的数值由 10 改为 13（千军万马微观演出，
 * GlobalUnitRenderer 的 microFormation 闸门是 zoom >= 13）。
 * 上述六条规则与全部切换时序**一律未动**。回退：把 COMBAT_ZOOM 改回 10。
 */

import { GameMap } from '../map/GameMap';

const MARCH_ZOOM = 9;
/**
 * 战斗 zoom。原为 10；2026-08-09 改 13 = 千军万马微观演出档
 * （GlobalUnitRenderer 的 microFormation 闸门是 zoom >= 13）。
 * 想退回旧观感：把这里改回 10 即可，8/9 两档与下面的切换规则均未改动。
 */
const COMBAT_ZOOM = 13;
const HANDOFF_ZOOM = 8;
const HANDOFF_HOLD_MS = 2500;
const MIN_INTERVAL_MS = 15000;
const COMBAT_COOLDOWN_MS = 5000;

function isFighting(army: any): boolean {
    return !!(
        army && !army.isDestroyed &&
        typeof army.getIsInCombat === 'function' &&
        army.getIsInCombat()
    );
}

export class ZoomController {
    private map: GameMap;
    private getFollowedArmy: () => any;
    private mode: 'march' | 'combat' = 'march';
    private currentZoom: number = MARCH_ZOOM;
    private lastZoomChangeAt: number = 0;
    private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
    private handoffTimer: ReturnType<typeof setTimeout> | null = null;
    private lastArmyId: string | null = null;
    public enabled: boolean = true;

    constructor(map: GameMap, getFollowedArmy: () => any) {
        this.map = map;
        this.getFollowedArmy = getFollowedArmy;
    }

    public tick(): void {
        if (!this.enabled) return;
        const army = this.getFollowedArmy();
        const armyId = army?.id ?? null;

        // ── 跟随目标换人 → 拉远到 8 ──
        if (armyId !== this.lastArmyId) {
            this.lastArmyId = armyId;
            if (armyId) { this.beginHandoff(); return; }
        }
        if (this.handoffTimer !== null) return;

        const fighting = isFighting(army);
        const newMode = fighting ? 'combat' as const : 'march' as const;

        if (fighting && this.cooldownTimer !== null) {
            clearTimeout(this.cooldownTimer);
            this.cooldownTimer = null;
        }

        // ── 手递手 zoom 8：只在战斗开始时试切 10，绝不切 9 ──
        if (this.currentZoom === HANDOFF_ZOOM) {
            if (newMode === this.mode) return;
            if (newMode === 'combat') {
                this.mode = 'combat';
                this.trySwitch(COMBAT_ZOOM);
            } else {
                this.mode = 'march';
            }
            return;
        }

        // ── 常态 9/10 ──
        if (newMode === this.mode) return;

        // 行军 → 战斗
        if (newMode === 'combat') {
            this.mode = 'combat';
            this.trySwitch(COMBAT_ZOOM);
            return;
        }

        // 战斗 → 行军：等 5s
        this.mode = 'march';
        if (this.cooldownTimer !== null) return;
        this.cooldownTimer = setTimeout(() => {
            this.cooldownTimer = null;
            if (this.handoffTimer !== null) return;
            if (isFighting(this.getFollowedArmy())) return;
            this.trySwitch(MARCH_ZOOM);
        }, COMBAT_COOLDOWN_MS);
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
        if (this.cooldownTimer !== null) { clearTimeout(this.cooldownTimer); this.cooldownTimer = null; }

        this.currentZoom = HANDOFF_ZOOM;
        this.lastZoomChangeAt = performance.now();
        this.applyZoom(HANDOFF_ZOOM);

        this.handoffTimer = setTimeout(() => {
            this.handoffTimer = null;
            this.mode = isFighting(this.getFollowedArmy()) ? 'combat' : 'march';
            this.currentZoom = HANDOFF_ZOOM;
        }, HANDOFF_HOLD_MS);
    }

    public getMode() { return this.mode; }
    public getCurrentZoom() { return this.currentZoom; }

    private applyZoom(zoom: number): void {
        const leaflet = this.map.getLeafletMap();
        if (Math.abs(leaflet.getZoom() - zoom) < 0.01) return;
        leaflet.setZoom(zoom, { animate: true });
    }
}
