/**
 * 海军逐舰阵亡状态（2026-07-18；2026-08-19 改「兵力动态纵队舰队」）
 * 参照 LegionPhalanxStateManager 的 ALIVE→DYING→DEAD 三级，
 * 海军按兵力定船数（§3.1 档位表），战中按 troops 比例逐舰阵亡，且**从队尾往前沉**。
 */

export interface NavalShipSlot {
    state: 'ALIVE' | 'DYING' | 'DEAD';
    /** 进入 DYING 的 tick（用于驱动死亡动画帧） */
    stateStartTime: number;
    /** 随机死亡方向（0-7） */
    deathDirection: number;
}

export interface NavalUnitState {
    ships: NavalShipSlot[];
    /** 编队船数（建立时按兵力定，非硬编码 5） */
    shipCount: number;
    maxTroops: number;
    lastTroops: number;
    isFighting: boolean;
    /** 本帧新沉没的舰数（供音效触发，drawNaval 读后自清） */
    justSank: number;
    /** 航迹（旗舰走过的地理坐标，后随船沿此排开；存 lat/lng 不存屏幕坐标——屏幕坐标随地图平移缩放失效） */
    trail: { lat: number; lng: number }[];
}

/**
 * 船数档位（非线性，8 艘封顶）——2026-08-19 主人定。
 * 出兵 = 城池兵 × 0.9，开局 922 城统一 3 万 → 首发军团一律 27000 = 3 艘；
 * 10 艘要 9 万兵几乎见不到，故非线性：常见段（2~5 万）每 1 万加 1，中后段每 1.5 万加 1。
 */
export function shipCountForTroops(troops: number): number {
    if (troops < 10000) return 1;
    if (troops < 20000) return 2;
    if (troops < 30000) return 3;
    if (troops < 45000) return 4;
    if (troops < 60000) return 5;
    if (troops < 75000) return 6;
    if (troops < 90000) return 7;
    return 8;
}

export class NavalPhalanxStateManager {
    private static states = new Map<string, NavalUnitState>();

    public static getState(unitId: string): NavalUnitState | undefined {
        return this.states.get(unitId);
    }

    /**
     * 脱战重置：只清**舰船存活状态**（沉没的船恢复满编），**保留航迹**。
     * 🔴 [2026-08-19 修] 原实现是 `states.delete(unitId)` 连航迹一起删，而 drawNaval 在
     *    「非战斗」时每帧都调它 —— 军团航行时 state 恒为 MOVE、isFighting 恒 false，
     *    于是航迹每帧被删光：pushTrail 开头 `if (!state) return` 又不建 state，
     *    结果 trail 永远是空数组、后随船 100% 走退化直线排开，转弯照样穿岸。
     *    航迹是「舰队走过哪」，与「哪几艘还活着」是两回事，脱战不该清。
     *    真正要连航迹一起丢的场合用 dispose()（单位销毁/换跟拍）。
     */
    public static reset(unitId: string): void {
        const state = this.states.get(unitId);
        if (!state) return;
        state.ships = [];          // 置空 → 下次 update() 按当前兵力重建满编
        state.shipCount = 0;
        state.maxTroops = 0;
        state.lastTroops = 0;
        state.isFighting = false;
        state.justSank = 0;
    }

    public static dispose(unitId: string): void {
        this.states.delete(unitId);
    }

    /** 航迹最大保留点数（8 艘 × 0.8 中心距 = 6.4 船身长，40 点足够且有余量）。 */
    public static readonly TRAIL_MAX = 40;

    /** 推入一个航迹点（地理坐标）。采样间隔由调用方（GlobalUnitRenderer）按屏幕距离判断。 */
    public static pushTrail(unitId: string, lat: number, lng: number): void {
        // 🔴 懒建：军团下水后第一帧还没走过 update()，此时若直接 return 会丢掉航迹起点。
        //    只建壳（ships 留空，等 update() 按兵力填），保证航迹从下水第一步就开始积累。
        let state = this.states.get(unitId);
        if (!state) {
            state = { ships: [], shipCount: 0, maxTroops: 0, lastTroops: 0, isFighting: false, justSank: 0, trail: [] };
            this.states.set(unitId, state);
        }
        const st: NavalUnitState = state;
        const last = st.trail[st.trail.length - 1];
        if (last) {
            const dLat = lat - last.lat, dLng = lng - last.lng;
            if (dLat * dLat + dLng * dLng < 1e-10) return;   // 与上一点几乎重合，跳过
        }
        st.trail.push({ lat, lng });
        if (st.trail.length > this.TRAIL_MAX) st.trail.shift();
    }

    /**
     * 每帧更新：按 troops 比例计算存活舰数，逐舰转入 DYING。
     * 与陆军一致：每帧最多 1 艘。逐舰阵亡从**队尾（最大索引）往前**——
     * 旗舰（索引 0）最后沉，对应「只剩旗舰浴血苦战」。
     */
    public static update(
        unitId: string,
        troops: number,
        isFighting: boolean,
        tick: number,
    ): NavalUnitState {
        let state = this.states.get(unitId);

        if (!state) {
            const shipCount = shipCountForTroops(troops);
            const ships: NavalShipSlot[] = [];
            for (let i = 0; i < shipCount; i++) {
                ships.push({
                    state: 'ALIVE',
                    stateStartTime: tick,
                    deathDirection: Math.floor(Math.random() * 8),
                });
            }
            state = {
                ships,
                shipCount,
                maxTroops: troops,
                lastTroops: troops,
                isFighting,
                justSank: 0,
                trail: [],
            };
            this.states.set(unitId, state);
            return state;
        }

        // 🔴 [2026-08-19] 非战斗时按当前兵力**实时重建满编**，两件事一起解决：
        //   ① reset() 现在只置空 ships（保留航迹，见上），靠这里重建 —— 不重建就一艘船都不画；
        //   ② 补兵/合兵后船数要跟着涨。原实现 shipCount 只在首次创建时算一次，
        //      27000 兵出港的军团合兵到 9 万，海上仍然只有 3 艘船。
        //   战斗中绝不重建：那会把已沉的船凭空变回来。
        if (!isFighting) {
            const want = shipCountForTroops(troops);
            const hasSunk = state.ships.some((sh) => sh.state !== 'ALIVE');
            if (state.ships.length === 0 || state.shipCount !== want || hasSunk) {
                const ships: NavalShipSlot[] = [];
                for (let i = 0; i < want; i++) {
                    ships.push({ state: 'ALIVE', stateStartTime: tick, deathDirection: Math.floor(Math.random() * 8) });
                }
                state.ships = ships;
                state.shipCount = want;
                state.maxTroops = troops;
                state.lastTroops = troops;
            }
        }

        if (isFighting && !state.isFighting) {
            state.isFighting = true;
            state.maxTroops = troops;
        } else if (!isFighting && state.isFighting) {
            state.isFighting = false;
        }

        // 战中减员：按健康比计算应存活舰数
        state.justSank = 0;
        if (state.isFighting && troops < state.lastTroops) {
            const healthRatio = Math.max(0, troops / Math.max(1, state.maxTroops));
            const targetAlive = Math.ceil(state.shipCount * healthRatio);
            let currentAlive = 0;
            state.ships.forEach(s => { if (s.state === 'ALIVE') currentAlive++; });

            let killNeeded = currentAlive - targetAlive;
            // 单帧最多沉 1 艘
            if (killNeeded > 1) killNeeded = 1;

            if (killNeeded > 0) {
                const candidates: number[] = [];
                state.ships.forEach((s, i) => {
                    if (s.state === 'ALIVE') candidates.push(i);
                });
                // 队尾优先（大索引先沉），旗舰（索引 0）最后沉
                candidates.sort((a, b) => b - a);

                for (let i = 0; i < candidates.length && killNeeded > 0; i++) {
                    const idx = candidates[i];
                    const ship = state.ships[idx];
                    ship.state = 'DYING';
                    ship.stateStartTime = tick;
                    ship.deathDirection = Math.floor(Math.random() * 8);
                    state.justSank++;
                    killNeeded--;
                }
            }

            // DYING → DEAD：死亡动画播完（约 1200ms = 8帧×150ms）
            const DEATH_ANIM_MS = 1200;
            state.ships.forEach((ship) => {
                if (ship.state === 'DYING' && tick - ship.stateStartTime >= DEATH_ANIM_MS) {
                    ship.state = 'DEAD';
                }
            });
        }

        state.lastTroops = troops;
        return state;
    }
}
