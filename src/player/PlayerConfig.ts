/**
 * 玩家（乱入者）配置 —— 2026-09-05 主人定：项目改为可玩游戏，骑马与砍杀式。
 *
 * 玩家一人闯入战略地图：点据点即前往，抵达后与城中武将对话接任务；
 * 接了任务就"入伍"到任务军团，随军进战术模式（13）亲自砍人攒功勋。
 * 功勋决定战术模式里能指挥多少人：斥候（只管自己）→ 探马（前排一个编队）→ 先锋（整个前排）→ 将军（前中后三排）。
 */

export type PlayerRankId = 'scout' | 'outrider' | 'vanguard' | 'general' | 'marshal';

export interface PlayerRank {
    id: PlayerRankId;
    name: string;
    /** 达到此功勋即晋升（功勋 = 玩家本人 + 玩家指挥编队的击杀精灵数，1 精灵 = 20 兵） */
    merit: number;
    /** 战术模式指挥范围：none 只管自己 / one 前排一个编队 / front 整个前排 / all 三排 */
    control: 'none' | 'one' | 'front' | 'all';
    /** 第九环·玩家官阶战力乘数（玩家入伍的军团整体战力 × 此值，1.1~1.5） */
    powerMult: number;
}

export const PLAYER_RANKS: readonly PlayerRank[] = [
    { id: 'scout', name: '风行斥候', merit: 0, control: 'none', powerMult: 1.1 },
    { id: 'outrider', name: '探马蓝旗', merit: 1000, control: 'one', powerMult: 1.2 },
    { id: 'vanguard', name: '陷阵先锋', merit: 5000, control: 'front', powerMult: 1.3 },
    { id: 'general', name: '百战将军', merit: 20000, control: 'all', powerMult: 1.4 },
    { id: 'marshal', name: '兵马元帅', merit: 60000, control: 'all', powerMult: 1.5 },
];

export function rankForMerit(merit: number): PlayerRank {
    let r = PLAYER_RANKS[0];
    for (const rank of PLAYER_RANKS) if (merit >= rank.merit) r = rank;
    return r;
}

export function nextRankAfter(rank: PlayerRank): PlayerRank | null {
    const idx = PLAYER_RANKS.findIndex((r) => r.id === rank.id);
    return PLAYER_RANKS[idx + 1] ?? null;
}

/** 玩家素材 key（UnitAssets.UNIT_ASSETS / Scene13 WAR_TYPES 同名） */
export const PLAYER_HERO_KEY = 'guanyu';
export const PLAYER_HERO_NAME = '乱入者';
/** 出生据点：长安（汉唐古都） */
export const PLAYER_START_CITY_ID = 'city_changan';
/** 单骑行军速度倍率（相对军团统一行军速度） */
export const PLAYER_HERO_SPEED_MULT = 1.5;
/** 任务军团起兵兵力（与远征脚本一致：起兵一律 2 万） */
export const PLAYER_QUEST_LEGION_TROOPS = 20000;
/** 玩家自带精锐编队的兵力（探马及以上，选了精锐才带） */
export const PLAYER_ELITE_SQUAD_TROOPS = 1500;
/** 历史任务目标搜索：沿路网最多几跳 */
export const PLAYER_QUEST_TARGET_MAX_HOPS = 5;
/** 抵达据点判定半径（度） */
export const PLAYER_CITY_ARRIVE_DIST = 0.06;
