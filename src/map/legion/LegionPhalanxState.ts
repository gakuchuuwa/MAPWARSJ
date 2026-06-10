
export interface LegionSlotInfo {
    state: 'ALIVE' | 'DYING' | 'DEAD';
    stateStartTime: number;
    type: 'infantry' | 'archer';
    deathDirection?: number;
    deadOffsetX?: number;
    deadOffsetY?: number;
    deadLat?: number;
    deadLng?: number;
}

export interface LegionUnitState {
    slots: LegionSlotInfo[];
    maxTroops: number;
    lastTroops: number;
    rows: number; // [NEW] Square Grid
    cols: number; // [NEW] Square Grid
    vitalitySeed: number;
    isFighting: boolean;
    lastDirection: number;
    spawnTick: number; // [NEW] Track creation time for animation
}

/**
 * Manages state for AI LEGIONS.
 * Features: Mixed Formation (Infantry Front / Archer Rear).
 */
export class LegionPhalanxStateManager {
    private static states: Map<string, LegionUnitState> = new Map();

    private static seenUnits: Set<string> = new Set(); // [NEW] Track seen units to prevent re-spawn animation

    public static getState(unitId: string): LegionUnitState | undefined {
        return this.states.get(unitId);
    }

    public static reset(unitId: string) {
        this.states.delete(unitId);
        // Do NOT remove from seenUnits here, so if it's re-added (e.g. after battle reset), it won't play spawn anim again.
    }

    /** 军团彻底移除时释放状态，避免 seenUnits/states 无限增长导致长时间运行 OOM */
    public static dispose(unitId: string): void {
        this.states.delete(unitId);
        this.seenUnits.delete(unitId);
    }

    /**
     * Recalculates unit types (Infantry vs Archer).
     * Rule: Low Index (Center) = Archers. High Index (Outer) = Infantry.
     */
    private static recalculateTypes(state: LegionUnitState, totalCount: number) {
        if (totalCount === 9) {
            // [USER REQUEST] 3x3 Grid: Front 2 rows (0-5) Infantry, Back 1 row (6-8) Archers
            state.slots.forEach((slot, index) => {
                if (index >= 6) {
                    slot.type = 'archer';
                } else {
                    slot.type = 'infantry';
                }
            });
        } else {
            // Legacy / Default Logic (Inner 30% are archers)
            const archerCount = Math.floor(totalCount * 0.3);
            state.slots.forEach((slot, index) => {
                if (index < archerCount) {
                    slot.type = 'archer';
                } else {
                    slot.type = 'infantry';
                }
            });
        }
    }

    public static update(
        unitId: string,
        troops: number,
        rows: number,
        cols: number,
        count: number,
        direction: number,
        tick: number,
        isFighting: boolean,
        center?: { x: number, y: number },
        unprojectFn?: (x: number, y: number) => { lat: number, lng: number },
        getOffsetFn?: (index: number) => { x: number, y: number }
    ): LegionUnitState {
        let state = this.states.get(unitId);

        if (!state) {
            const slots: LegionSlotInfo[] = [];
            for (let i = 0; i < count; i++) {
                slots.push({ state: 'ALIVE', stateStartTime: tick, type: 'infantry' });
            }

            // [FIX] Check if we've seen this unit before
            // If seen, set spawnTick to way in the past so animation is skipped
            const hasSeen = this.seenUnits.has(unitId);
            this.seenUnits.add(unitId);
            const initialSpawnTick = hasSeen ? (tick - 99999) : tick;

            state = {
                slots,
                maxTroops: troops,
                lastTroops: troops,
                rows: rows,
                cols: cols,
                vitalitySeed: Math.floor(Math.random() * 1000),
                isFighting: isFighting,
                lastDirection: direction,
                spawnTick: initialSpawnTick // [NEW] Set spawn time (skip if seen)
            };
            this.states.set(unitId, state);
            this.recalculateTypes(state, count);
            return state;
        }

        // Check Resize
        if (state.rows !== rows || state.cols !== cols) {
            state.rows = rows;
            state.cols = cols;
            // Regenerate
            state.slots = [];
            for (let i = 0; i < count; i++) {
                state.slots.push({ state: 'ALIVE', stateStartTime: tick, type: 'infantry' });
            }
            state.lastTroops = troops;
            state.maxTroops = troops;
            state.lastDirection = direction;
            this.recalculateTypes(state, count);
            return state;
        }

        if (state.lastDirection !== direction) {
            state.lastDirection = direction;
        }

        if (isFighting && !state.isFighting) {
            state.isFighting = true;
            state.maxTroops = troops;
        } else if (!isFighting && state.isFighting) {
            state.isFighting = false;
        }

        // Erosion Logic
        if (state.isFighting && troops < state.lastTroops) {
            const healthRatio = Math.max(0, troops / Math.max(1, state.maxTroops));
            const totalSlots = state.slots.length;
            const targetAlive = Math.ceil(totalSlots * healthRatio);

            let currentAlive = 0;
            state.slots.forEach(s => { if (s.state === 'ALIVE') currentAlive++; });

            let killNeeded = currentAlive - targetAlive;
            const frameCap = Math.max(1, Math.floor(totalSlots * 0.05));
            if (killNeeded > frameCap) killNeeded = frameCap;

            if (killNeeded > 0) {
                // Kill Outer Ring First (High Index)
                const candidates: number[] = [];
                state.slots.forEach((s, i) => {
                    if (s.state === 'ALIVE') candidates.push(i);
                });
                // [USER REQUEST] Randomize casualties instead of outer ring first
                // candidates.sort((a, b) => b - a); // OLD: High to Low (Outer Ring)
                candidates.sort(() => Math.random() - 0.5); // NEW: Random Shuffle

                for (let i = 0; i < candidates.length && killNeeded > 0; i++) {
                    const idx = candidates[i];
                    const slot = state.slots[idx];
                    slot.state = 'DYING';
                    slot.stateStartTime = tick;
                    slot.deathDirection = Math.floor(Math.random() * 8); // Random death dir

                    if (getOffsetFn) {
                        const offset = getOffsetFn(idx);
                        slot.deadOffsetX = offset.x;
                        slot.deadOffsetY = offset.y;
                        if (center && unprojectFn) {
                            const world = unprojectFn(center.x + offset.x, center.y + offset.y);
                            slot.deadLat = world.lat;
                            slot.deadLng = world.lng;
                        }
                    }
                    killNeeded--;
                }
            }
        }

        state.lastTroops = troops;
        return state;
    }

    public static isVisualFrontline(state: LegionUnitState, index: number, direction: number): boolean {
        // [SIMPLIFIED] Outer 30% are frontline
        const total = state.slots.length;
        return index > total * 0.6;
    }
}
