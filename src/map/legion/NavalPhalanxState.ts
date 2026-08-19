/**
 * 海军逐舰阵亡状态（2026-07-18）
 * 参照 LegionPhalanxStateManager 的 ALIVE→DYING→DEAD 三级，
 * 海军五船编队按 troops 比例逐艘阵亡，而非战斗结束后统一播放 DEATH。
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
    maxTroops: number;
    lastTroops: number;
    isFighting: boolean;
    /** 本帧新沉没的舰数（供音效触发，drawNaval 读后自清） */
    justSank: number;
}

const NAVAL_SHIP_COUNT = 5;

export class NavalPhalanxStateManager {
    private static states = new Map<string, NavalUnitState>();

    public static getState(unitId: string): NavalUnitState | undefined {
        return this.states.get(unitId);
    }

    public static reset(unitId: string): void {
        this.states.delete(unitId);
    }

    public static dispose(unitId: string): void {
        this.states.delete(unitId);
    }

    /**
     * 每帧更新：按 troops 比例计算存活舰数，逐舰转入 DYING。
     * 与陆军一致：每帧最多 1 艘（5 艘的 5%≈0.25 艘，取 min=1）。
     */
    public static update(
        unitId: string,
        troops: number,
        isFighting: boolean,
        tick: number,
    ): NavalUnitState {
        let state = this.states.get(unitId);

        if (!state) {
            const ships: NavalShipSlot[] = [];
            for (let i = 0; i < NAVAL_SHIP_COUNT; i++) {
                ships.push({
                    state: 'ALIVE',
                    stateStartTime: tick,
                    deathDirection: Math.floor(Math.random() * 8),
                });
            }
            state = {
                ships,
                maxTroops: troops,
                lastTroops: troops,
                isFighting,
                justSank: 0,
            };
            this.states.set(unitId, state);
            return state;
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
            const targetAlive = Math.ceil(NAVAL_SHIP_COUNT * healthRatio);
            let currentAlive = 0;
            state.ships.forEach(s => { if (s.state === 'ALIVE') currentAlive++; });

            let killNeeded = currentAlive - targetAlive;
            // 5 艘船，单帧最多沉 1 艘
            if (killNeeded > 1) killNeeded = 1;

            if (killNeeded > 0) {
                const candidates: number[] = [];
                state.ships.forEach((s, i) => {
                    if (s.state === 'ALIVE') candidates.push(i);
                });
                // 随机选（非外圈优先——舰队无内外之分）
                candidates.sort(() => Math.random() - 0.5);

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
