/**
 * 海军逐舰阵亡状态（2026-07-18；2026-08-19 改「兵力动态纵队舰队」）
 * 参照 LegionPhalanxStateManager 的 ALIVE→DYING→DEAD 三级，
 * 海军按兵力定船数（§3.1 档位表），战中按 troops 比例逐舰阵亡，且**从队尾往前沉**。
 * 🔴 例外（2026-10-31 主人令）：**海战（舰队 vs 舰队的野战）只显示旗舰一艘**——
 *    开打即裁成 1 艘（见 collapseToFlagship），行军 / 停泊照旧按兵力档位。
 */

export interface NavalShipSlot {
    state: 'ALIVE' | 'DYING' | 'DEAD';
    /** 进入 DYING 的 tick（用于驱动死亡动画帧） */
    stateStartTime: number;
    /** 随机死亡方向（0-15，船全 16 向素材 2026-08-21） */
    deathDirection: number;
    /** 非战斗减员（行军损耗等）：只做渐隐，不下沉、不放死亡帧（船队在移动，看不清动画） */
    fadeOnly?: boolean;
}

/** 非战斗减员渐隐时长（ms） */
export const NAVAL_FADE_ONLY_MS = 2000;

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

    /** 单位销毁/换跟拍 → 连航迹一起丢（唯一的清理入口）。脱战重建满编由 update() 非战斗分支负责。 */
    public static dispose(unitId: string): void {
        this.states.delete(unitId);
    }

    /** 只清航迹（军团上岸时调用），舰船状态保留 */
    public static clearTrail(unitId: string): void {
        const st = this.states.get(unitId);
        if (st) st.trail.length = 0;
    }

    /** 航迹最大保留点数。8 艘双列 = 4 段 × 1.15 船长 ≈ 4.6 船长，zoom10 下约 49 点（16px/点），
     *  取 64 点留足余量，避免航迹短于舰队 → 队尾被迫直线外推插岸。 */
    public static readonly TRAIL_MAX = 64;

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
     * 海战只留旗舰（🔴 2026-10-31 主人令「把海战改为只显示双方的旗舰对战，就是双方只显示一艘船；
     * 就是海战的时候，其他行驶的时候不要动」）。
     *
     * 把编队压成 1 艘：索引 0 的旗舰保留原状态（ALIVE/DYING 都照留，沉没动画不被截断），
     * 其余僚舰直接退出编队 —— 海战画面里双方各只有一艘旗舰。只在「刚进入海战」那一刻调一次；
     * 战斗中本来就不重建编队（见 update 里 `!isFighting` 那道门），所以 1 艘会一直保持到脱战。
     */
    private static collapseToFlagship(state: NavalUnitState, tick: number): void {
        if (state.shipCount === 1 && state.ships.length === 1) return;
        const flagship = state.ships[0];
        state.ships = [
            flagship && flagship.state !== 'DEAD'
                ? flagship
                : { state: 'ALIVE', stateStartTime: tick, deathDirection: Math.floor(Math.random() * 8) },
        ];
        state.shipCount = 1;
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
        /**
         * 🔴 [2026-10-31 主人令「海战只显示双方的旗舰对战，就是双方只显示一艘船」「其他行驶的时候不要动」]
         * 是不是海战（舰队 vs 舰队的野战，判据见 GlobalUnitRenderer.isNavalFleetBattle）。
         * 双将海战里渲染端会把 ATTACK 演成 MOVE 传进来，所以 isFighting 抓不到它，必须单独给标记。
         * 为 true 时整支舰队按「旗舰一艘」处理（见 collapseToFlagship）。
         */
        navalBattle = false,
    ): NavalUnitState {
        const inCombat = isFighting || navalBattle;
        let state = this.states.get(unitId);

        if (!state) {
            // 🔴 [2026-10-31] 若第一帧就是海战中建的 state，同样只给旗舰一艘。
            const shipCount = inCombat ? 1 : shipCountForTroops(troops);
            const ships: NavalShipSlot[] = [];
            for (let i = 0; i < shipCount; i++) {
                ships.push({
                    state: 'ALIVE',
                    stateStartTime: tick,
                    deathDirection: Math.floor(Math.random() * 16),
                });
            }
            state = {
                ships,
                shipCount,
                maxTroops: troops,
                lastTroops: troops,
                isFighting: inCombat,
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
        // 🔴 [2026-10-15 主人「等舰船被击毁消失后再退出海战」] 军团已覆灭（troops=0）也不重建：
        //   重建会把整支舰队压成 1 艘（shipCountForTroops(0)=1），其余船凭空消失、沉没动画被截断。
        //   覆灭要保留原舰队，交给 drawNaval 的全局 DEATH 分支逐艘沉完。
        // 🔴 [2026-10-27 主人「海上减员最后一艘船突然消失」] 非战斗减员（行军损耗/风暴）船数变少时，
        //   原来直接重建 → 队尾船凭空消失。现在多出来的队尾船走 DYING 渐隐（fadeOnly，不下沉；海战才下沉），
        //   淡完（DEAD）再重建；沉没期间不重建，编队长度保持不变。
        state.justSank = 0;
        // 🔴 [2026-10-31] 海战期间（inCombat）一律不重建：以「旗舰一艘」为准，
        //   否则每帧会被 shipCountForTroops 拉回 2~8 艘，海战画面又变回船队。
        if (!inCombat && troops > 0) {
            const want = shipCountForTroops(troops);
            const hasSunk = state.ships.some((sh) => sh.state !== 'ALIVE');
            const hasDying = state.ships.some((sh) => sh.state === 'DYING');
            const aliveCount = state.ships.filter((sh) => sh.state === 'ALIVE').length;
            if (!hasSunk && state.ships.length > 0 && want < aliveCount) {
                let stagger = 0;
                for (let i = state.ships.length - 1; i >= want; i--) {
                    const ship = state.ships[i];
                    if (ship.state !== 'ALIVE') continue;
                    ship.state = 'DYING';
                    ship.stateStartTime = tick + stagger * 400;   // 队尾先淡出，错开
                    ship.deathDirection = Math.floor(Math.random() * 8);
                    ship.fadeOnly = true;
                    stagger++;
                }
                state.lastTroops = troops;
            } else if (!hasDying && (state.ships.length === 0 || state.shipCount !== want || hasSunk)) {
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

        if (inCombat && !state.isFighting) {
            state.isFighting = true;
            state.maxTroops = troops;
        } else if (!inCombat && state.isFighting) {
            state.isFighting = false;
        }

        // 🔴 [2026-10-31 主人令「请把海战改为只显示双方的旗舰对战，就是双方只显示一艘船」
        //    「就是海战的时候。其他行驶的时候不要动。只是海战的时候。」]
        //   海战（navalBattle，判据由渲染端给）= 编队裁成**旗舰一艘**，此后编队间距、开火、
        //   沉没全部按 1 艘走：旗舰被击沉（兵力归零）= 全队覆没。幂等，每帧调用无副作用。
        //   ⚠️ 只认 navalBattle，不拿 isFighting 代替 —— 港口挨打之类的 ATTACK/DAMAGE 不算海战。
        if (navalBattle) {
            state.maxTroops = Math.max(state.maxTroops, troops);
            NavalPhalanxStateManager.collapseToFlagship(state, tick);
        }

        // 战中减员：按健康比计算应存活舰数
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

        }

        // DYING → DEAD：沉没渐隐播完（2026-08-23 主人定 5 秒；原 1200ms 太短像突然消失）。
        // 战斗内外都要推进（非战斗减员的沉没也靠它收尾）。
        const DEATH_ANIM_MS = 5000;
        state.ships.forEach((ship) => {
            if (ship.state === 'DYING' && tick - ship.stateStartTime >= (ship.fadeOnly ? NAVAL_FADE_ONLY_MS : DEATH_ANIM_MS)) {
                ship.state = 'DEAD';
            }
        });

        state.lastTroops = troops;
        return state;
    }
}
