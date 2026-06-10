import { GameConfig } from '../config/GameConfig';

/** 控制台日志频道 — 在 GameConfig.LOG 中开关，默认关闭高频噪音 */
export type GameLogChannel =
    | 'performance'
    | 'battleTick'
    | 'battle'
    | 'siege'
    | 'siegeEffect'
    | 'recruitment'
    | 'unit'
    | 'legionMarch'
    | 'legionSiege'
    | 'ai'
    | 'army'
    | 'world'
    | 'startup'
    | 'editorDebug'
    | 'followResupply';

function isEnabled(channel: GameLogChannel): boolean {
    const L = GameConfig.LOG;
    switch (channel) {
        case 'performance': return L.PERFORMANCE_CONSOLE;
        case 'battleTick': return L.BATTLE_TICK;
        case 'battle': return L.BATTLE;
        case 'siege': return L.SIEGE;
        case 'siegeEffect': return L.SIEGE_EFFECT;
        case 'recruitment': return L.RECRUITMENT;
        case 'unit': return L.UNIT_REGISTER;
        case 'legionMarch': return L.LEGION_MARCH;
        case 'legionSiege': return L.LEGION_SIEGE;
        case 'ai': return L.AI;
        case 'army': return L.ARMY;
        case 'world': return L.WORLD;
        case 'startup': return L.STARTUP;
        case 'editorDebug': return L.EDITOR_DEBUG;
        case 'followResupply': return L.FOLLOW_RESUPPLY;
        default: return false;
    }
}

export function gameLog(channel: GameLogChannel, ...args: unknown[]): void {
    if (isEnabled(channel)) console.log(...args);
}

export function gameWarn(channel: GameLogChannel, ...args: unknown[]): void {
    if (isEnabled(channel)) console.warn(...args);
}

/** 运行时开关（控制台：gameLog.set({ SIEGE: true })） */
export function setGameLogFlags(flags: Partial<typeof GameConfig.LOG>): void {
    Object.assign(GameConfig.LOG, flags);
}

export function getGameLogFlags(): Readonly<typeof GameConfig.LOG> {
    return GameConfig.LOG;
}

export function setQuietMode(): void {
    setGameLogFlags({
        PERFORMANCE_CONSOLE: false,
        BATTLE_TICK: false,
        BATTLE: false,
        SIEGE: false,
        SIEGE_EFFECT: false,
        RECRUITMENT: false,
        UNIT_REGISTER: false,
        LEGION_MARCH: false,
        LEGION_SIEGE: false,
        AI: false,
        ARMY: false,
        WORLD: false,
        STARTUP: false,
        EDITOR_DEBUG: false,
        FOLLOW_RESUPPLY: false,
    });
}

/** 只开“军团不动”排查最小日志集 */
export function setDebugMoveMode(): void {
    setQuietMode();
    setGameLogFlags({
        AI: true,
        LEGION_MARCH: true,
        LEGION_SIEGE: true,
        ARMY: true,
    });
}

declare global {
    interface Window {
        gameLog?: {
            set: typeof setGameLogFlags;
            get: typeof getGameLogFlags;
            quiet: typeof setQuietMode;
            debugMove: typeof setDebugMoveMode;
            flags: typeof GameConfig.LOG;
        };
    }
}

if (typeof window !== 'undefined') {
    window.gameLog = {
        set: setGameLogFlags,
        get: getGameLogFlags,
        quiet: setQuietMode,
        debugMove: setDebugMoveMode,
        flags: GameConfig.LOG,
    };
}
