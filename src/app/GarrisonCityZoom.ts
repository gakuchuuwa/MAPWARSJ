/**
 * GarrisonCityZoom — 跟拍军团在据点停驻时，把该据点的建筑放大到与攻城战同一尺寸。
 *
 * 判据（全部要满足才放大）：
 *   1. 被跟拍的军团已经停住 ≥ STILL_MS（真实毫秒；位置不再变化，行军中不放大）
 *   2. 不在战斗中、战术层（13）没激活 —— 那两种情形由攻城放大 / 13 自己管
 *   3. 离最近据点 ≤ NEAR_DEG（军团就站在那座城上）
 * 军团一动、或去了别处，立刻还原（放大用 CSS class city-garrisoned，缩放倍数与 city-under-siege 相同，
 * 但没有火光投影与蓝描边）。只动 class，不动据点数据、不动缩放级别、不动军团。
 */
import type { CityManager } from '../world/CityManager';

const STILL_MS = 1000;
/** 军团与据点的最大距离（度，≈5.5 km）：停在城上才算停驻，路过野外不放大 */
const NEAR_DEG = 0.05;
/** 位置变化小于它视为没动（度） */
const MOVE_EPS_DEG = 1e-5;

export class GarrisonCityZoom {
    private lastLat = NaN;
    private lastLng = NaN;
    private lastMoveMs = 0;
    private zoomedCityId: string | null = null;
    /** 已停稳时缓存的「所站据点」，位置没变就不重新扫全表 */
    private cachedCityId: string | null | undefined;

    constructor(private readonly cityManager: CityManager, private readonly now: () => number = () => Date.now()) {}

    public tick(army: any | null, suppressed: boolean): void {
        const pos = army && !suppressed && army.isDestroyed !== true && !army.getIsInCombat?.()
            ? army.getPosition?.() : null;
        if (!pos) { this.release(); this.lastLat = NaN; return; }

        const t = this.now();
        if (Math.abs(pos.lat - this.lastLat) > MOVE_EPS_DEG || Math.abs(pos.lng - this.lastLng) > MOVE_EPS_DEG || Number.isNaN(this.lastLat)) {
            this.lastLat = pos.lat; this.lastLng = pos.lng;
            this.lastMoveMs = t;
            this.cachedCityId = undefined;
        }
        if (t - this.lastMoveMs < STILL_MS) { this.release(); return; }

        if (this.cachedCityId === undefined) this.cachedCityId = this.findCityUnder(pos.lat, pos.lng);
        const cityId = this.cachedCityId;
        if (!cityId) { this.release(); return; }
        if (this.zoomedCityId && this.zoomedCityId !== cityId) this.release();
        this.zoomedCityId = cityId;
        // 每帧补一次 class：据点 marker 因别处占城重绘重建时 class 会丢
        this.cityManager.getTerritorySystem().setCityGarrisonZoom(cityId, true);
    }

    private release(): void {
        if (!this.zoomedCityId) return;
        this.cityManager.getTerritorySystem().setCityGarrisonZoom(this.zoomedCityId, false);
        this.zoomedCityId = null;
    }

    private findCityUnder(lat: number, lng: number): string | null {
        let best: string | null = null;
        let bestD = NEAR_DEG;
        for (const c of this.cityManager.getCities()) {
            const d = Math.hypot(c.latitude - lat, (c.longitude - lng) * Math.cos(lat * Math.PI / 180));
            if (d <= bestD) { bestD = d; best = c.id; }
        }
        return best;
    }
}
