import { WAR_TYPES, type WarType } from '../data/WarTypes';
import { PLAYER_FALLBACK_HERO_KEY } from './PlayerConfig';

/** 玩家陆战基础属性的历史峰值；科技、势力与军团加成不写入这里。 */
export interface PlayerPeakStats {
    hp: number;
    atk: number;
    meleeArmor: number;
    pierceArmor: number;
    rng: number;
    /** 装填时间越低越好，因此成长时取历史最低值。 */
    reload: number;
    spd: number;
    /** 按护甲类别分别取历史最高攻击加成。 */
    bonus: Record<number, number>;
}

function peakOf(unit: WarType): PlayerPeakStats {
    return {
        hp: unit.hp,
        atk: unit.atk,
        meleeArmor: unit.meleeArmor,
        pierceArmor: unit.pierceArmor,
        rng: unit.rng,
        reload: unit.reload,
        spd: unit.spd,
        bonus: { ...(unit.bonus ?? {}) },
    };
}

export function clonePlayerPeakStats(stats: PlayerPeakStats): PlayerPeakStats {
    return { ...stats, bonus: { ...stats.bonus } };
}

/** 当前兵模只保留外观对应的行为类别；数值来自峰值，且绝不原地改 WAR_TYPES。 */
export function withPlayerPeakStats(current: WarType, peak: PlayerPeakStats): WarType {
    return { ...current, ...peak, bonus: { ...peak.bonus } };
}

/** 新游戏只以初始斥候兵模的属性开局。 */
export function createInitialPlayerPeakStats(): PlayerPeakStats {
    return peakOf(WAR_TYPES[PLAYER_FALLBACK_HERO_KEY]);
}

function mergeValues(current: PlayerPeakStats, incoming: Partial<PlayerPeakStats>): PlayerPeakStats {
    const numberOr = (value: number | undefined, fallback: number) =>
        value !== undefined && Number.isFinite(value) ? value : fallback;
    const currentReload = current.reload > 0 ? current.reload : Infinity;
    const incomingReload = incoming.reload !== undefined && Number.isFinite(incoming.reload) && incoming.reload > 0
        ? incoming.reload
        : Infinity;
    const bonus: Record<number, number> = { ...current.bonus };
    for (const [tag, value] of Object.entries(incoming.bonus ?? {})) {
        if (!Number.isFinite(value)) continue;
        const key = Number(tag);
        bonus[key] = Math.max(bonus[key] ?? 0, value);
    }
    return {
        hp: Math.max(current.hp, numberOr(incoming.hp, current.hp)),
        atk: Math.max(current.atk, numberOr(incoming.atk, current.atk)),
        meleeArmor: Math.max(current.meleeArmor, numberOr(incoming.meleeArmor, current.meleeArmor)),
        pierceArmor: Math.max(current.pierceArmor, numberOr(incoming.pierceArmor, current.pierceArmor)),
        rng: Math.max(current.rng, numberOr(incoming.rng, current.rng)),
        reload: Math.min(currentReload, incomingReload),
        spd: Math.max(current.spd, numberOr(incoming.spd, current.spd)),
        bonus,
    };
}

/** 获得兵模时只提升基础属性；换装本身不调用，因此不会因换成弱兵模而下降。 */
export function mergePlayerPeakFromUnit(current: PlayerPeakStats, unitKey: string): PlayerPeakStats {
    const unit = WAR_TYPES[unitKey];
    return unit ? mergeValues(current, peakOf(unit)) : clonePlayerPeakStats(current);
}

/** 读档恢复峰值；旧存档没有该字段时，按已获陆战兵模补齐。 */
export function restorePlayerPeakStats(saved: PlayerPeakStats | undefined, learnedUnitKeys: readonly string[]): PlayerPeakStats {
    let peak = createInitialPlayerPeakStats();
    if (saved) peak = mergeValues(peak, saved);
    for (const key of learnedUnitKeys) peak = mergePlayerPeakFromUnit(peak, key);
    return peak;
}
