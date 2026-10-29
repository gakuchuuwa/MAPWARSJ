import type { TacticalSixSet } from '../data/TacticalSkillCatalog';

/**
 * 直播观众共同操作的玩家技能：与武将六计、集气槽和主将光环完全分开。
 * 作用范围跟随玩家官职：斥候本人，探马本人和本队，先锋本人和本排，将军本人和本军；不改兵种基础属性。
 */
export type PlayerLiveControl = 'none' | 'one' | 'front' | 'all';

/**
 * 🔴 [2026-10-30 主人定] 按官职阶梯逐级解锁玩家计策：
 *   · 斥候（scout）：只开放【攻 · 胜】（强化/恢复主角自身）
 *   · 探马（outrider）：解锁【敌 · 混】（共 4 计：攻 胜 敌 混；敌/混非作用在自身，效果与将军一致）
 *   · 先锋（vanguard）/ 将军（general）及以上：解锁【并 · 败】（全开 6 计：攻 胜 敌 混 并 败；并/败效果与将军一致）
 */
export function allowedSixSetsForRank(rankId: string | undefined | null): readonly TacticalSixSet[] {
    if (!rankId || rankId === 'civilian') return [];
    if (rankId === 'scout') return ['gongzhan', 'shengzhan'];
    if (rankId === 'outrider') return ['gongzhan', 'shengzhan', 'dizhan', 'hunzhan'];
    return ['gongzhan', 'shengzhan', 'dizhan', 'hunzhan', 'bingzhan', 'baizhan'];
}

export function allowedSixWordsForRank(rankId: string | undefined | null): { words: string; label: string } {
    if (rankId === 'scout') return { words: '攻胜', label: '玩家两计' };
    if (rankId === 'outrider') return { words: '攻胜敌混', label: '玩家四计' };
    return { words: '攻胜敌混并败', label: '玩家六计' };
}

export function sixUnlockBlockReason(rankId: string | undefined | null, six: TacticalSixSet): string | null {
    const allowed = allowedSixSetsForRank(rankId);
    if (allowed.includes(six)) return null;
    if (six === 'dizhan' || six === 'hunzhan') {
        return '斥候只能释放【攻·胜】，升为探马后解锁【敌·混】';
    }
    return rankId === 'scout'
        ? '斥候只能释放【攻·胜】，升为先锋后解锁【并·败】'
        : '探马只能释放【攻·胜·敌·混】，升为先锋后解锁【并·败】';
}

export interface PlayerLiveSkillTier {
    /** 一发生效的秒数 */
    durationSec: number;
    /** 一发放完后要歇几秒才能放下一发（排队的观众照常排着） */
    restSec: number;
    /** 范围内单位的伤害倍率 */
    damageMult: number;
    /** 范围内单位的攻击频率倍率 */
    attackSpeedMult: number;
    /** 范围内单位的受伤倍率 */
    damageTakenMult: number;
    /** 释放瞬间回血，占满血的比例（1＝满血） */
    healFrac: number;
}

/**
 * 玩家本人这一档：不论官职，主角本人始终是一骑当千（满血、伤害×4、攻速×2、受伤只剩四分之一）。
 * 斥候、探马的范围小（本人 / 本队约九分之一的兵），整队也用这一档。
 */
export const PLAYER_LIVE_SKILL: PlayerLiveSkillTier = {
    durationSec: 12,
    restSec: 0,
    damageMult: 4,
    attackSpeedMult: 2,
    damageTakenMult: 0.25,
    healFrac: 1,
};

/**
 * 主角身边的兵按官职取这一档：范围越大，一发的倍率越小，两发之间还要歇。
 * 🔴 [2026-10-27 主人令「现在只做到将军先跑通」] 原先先锋、将军也套「×4 伤害、×2 攻速、受伤×0.25、满血」：
 *    整排整军这么强、又能一发接一发，等于开打就赢。按兵力平方律粗算一发期间本方相当于多出的兵力：
 *    探马约 1.5 倍、先锋约 1.7 倍、将军约 1.8 倍（武将自己放的【攻】是全军伤害×1.5、攻速×1.5，约 1.5 倍）。
 *    这些是起步值，开播后按实际战报再调。
 */
export const PLAYER_LIVE_SKILL_BY_CONTROL: Readonly<Record<PlayerLiveControl, PlayerLiveSkillTier>> = {
    none: PLAYER_LIVE_SKILL,
    one: PLAYER_LIVE_SKILL,
    front: { durationSec: 12, restSec: 6, damageMult: 2.5, attackSpeedMult: 1.5, damageTakenMult: 0.4, healFrac: 0.5 },
    all: { durationSec: 12, restSec: 12, damageMult: 1.5, attackSpeedMult: 1.25, damageTakenMult: 0.6, healFrac: 0.3 },
};

/** 某个单位这一发吃哪一档：主角本人永远是本人档，其余按官职范围档。 */
export function playerLiveSkillTier(control: PlayerLiveControl, isPlayerHero: boolean): PlayerLiveSkillTier {
    if (isPlayerHero) return PLAYER_LIVE_SKILL;
    return PLAYER_LIVE_SKILL_BY_CONTROL[control] ?? PLAYER_LIVE_SKILL;
}

/** 官职技能范围的唯一判定：本人始终包含；其他单位必须同方且在既有指挥范围内。 */
export function playerLiveSkillAffects(
    control: PlayerLiveControl,
    playerSide: number,
    unitSide: number,
    isPlayerHero: boolean,
    inControlledLane: boolean,
): boolean {
    if (unitSide !== playerSide) return false;
    if (isPlayerHero) return true;
    if (control === 'none') return false;
    if (control === 'all') return true;
    return inControlledLane;
}
