/**
 * GarrisonCityZoom — 跟拍军团在据点停驻时，把该据点建筑放大到与攻城战同一尺寸；
 * 并接管「攻城战结束后的缩回」：跟拍那场放大的据点，要等跟拍军团**开始行军**才缩回（2026-10-01 主人定）。
 *
 * 停驻放大判据（全部满足才放大）：
 *   1. 被跟拍的军团停住 ≥ STILL_MS（真实毫秒）
 *   2. 不在战斗中、战术层（13）没激活 —— 那两种情形由攻城放大 / 13 自己管
 *   3. 离最近据点 ≤ NEAR_DEG（约 16.6 km，与攻城开战圈同）
 * 军团一动、或去了别处，立刻还原。放大用 CSS class city-garrisoned（倍数与 city-under-siege 相同）。
 * 只动 class，不动据点数据、缩放级别、军团。
 */
import type { CityManager } from '../world/CityManager';

const STILL_MS = 1000;
/**
 * 军团与据点的最大距离（度，≈16.6 km，= 攻城开战圈 SIEGE.COMBAT_RADIUS 0.15°）。
 * 🔴 [2026-10-01 主人报「索非亚不大」] 原 0.05°（5.5 km）不够：行军播报没念完时，军团在离挂点 **15 km 内**
 *    就驻足（PlayerQuestSystem：`距离 × 111 > 15` 才不触发），停的地方常在城外 5~15 km，旧阈值一律不放大。
 */
const NEAR_DEG = 0.15;
/** 位置变化小于它视为没动（度，≈55 米；与行军音效的「真的在走」同口径） */
const MOVE_EPS_DEG = 0.0005;
/** 战后「开始行军」判据：离开战后停下的位置超过它（度，≈1 km） */
const MARCH_AWAY_DEG = 0.01;

interface SiegeHold { release: () => void; armyId: string | null; lat: number; lng: number; }

export class GarrisonCityZoom {
    private lastLat = NaN;
    private lastLng = NaN;
    private lastMoveMs = 0;
    private zoomedCityId: string | null = null;
    private cachedCityId: string | null | undefined;
    private readonly holds = new Map<string, SiegeHold>();

    constructor(private readonly cityManager: CityManager, private readonly now: () => number = () => Date.now()) {
        cityManager.siegeZoomHoldUntilMarch = (cityId, release) => {
            this.holds.get(cityId)?.release();
            this.holds.set(cityId, { release, armyId: null, lat: NaN, lng: NaN });
            return true;
        };
        cityManager.siegeZoomHoldCancel = (cityId) => { this.holds.delete(cityId); };
    }

    public tick(army: any | null, suppressed: boolean): void {
        this.tickHolds(army);

        const pos = army && !suppressed && army.isDestroyed !== true && !army.getIsInCombat?.()
            ? army.getPosition?.() : null;
        if (!pos) { this.release(); this.lastLat = NaN; return; }

        const t = this.now();
        if (Number.isNaN(this.lastLat) || Math.abs(pos.lat - this.lastLat) > MOVE_EPS_DEG || Math.abs(pos.lng - this.lastLng) > MOVE_EPS_DEG) {
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

    /** 战后等行军：跟拍对象换了/没了，或离开战后停下的位置 ≥1 km（且不在战斗中）→ 缩回 */
    private tickHolds(army: any | null): void {
        if (this.holds.size === 0) return;
        const id: string | null = army?.id ?? null;
        const pos = army && army.isDestroyed !== true ? army.getPosition?.() : null;
        for (const [cityId, h] of this.holds) {
            if (h.armyId === null && Number.isNaN(h.lat)) {
                if (!id || !pos) { this.holds.delete(cityId); h.release(); continue; }
                h.armyId = id; h.lat = pos.lat; h.lng = pos.lng;
                continue;
            }
            const gone = !id || id !== h.armyId || !pos;
            const marched = !gone && !army.getIsInCombat?.()
                && Math.hypot(pos.lat - h.lat, pos.lng - h.lng) > MARCH_AWAY_DEG;
            if (gone || marched) { this.holds.delete(cityId); h.release(); }
        }
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
