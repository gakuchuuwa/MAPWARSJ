/**
 * 玩家（乱入者）配置 —— 骑马与砍杀式成长体系。
 *
 * 玩家一人闯入战略地图：点据点即前往，抵达后与城中武将对话接任务；
 * 接了任务就"入伍"到任务军团，随军进战术模式（13）亲自砍人攒功勋。
 * 九阶段官阶体系：
 *   平民(1.1) → 斥候(1.2) → 探马(1.3) → 先锋(1.4) → 将军(1.5) → 元帅(1.6) → 公侯(1.7) → 国王(1.8) → 皇帝(1.9)。
 *   九阶段管「权」（指挥编队与出兵决定权），战力环管「力」（第九环战力倍率，打多狠）。
 */

export type PlayerRankId =
    | 'civilian'
    | 'scout'
    | 'outrider'
    | 'vanguard'
    | 'general'
    | 'marshal'
    | 'duke'
    | 'king'
    | 'emperor';

export interface PlayerRank {
    id: PlayerRankId;
    /** 阶段阶位简称（平民 / 斥候 / 探马 / 先锋 / 将军 / 元帅 / 公侯 / 国王 / 皇帝） */
    title: string;
    /** 四字词语标签（布衣平民 / 风行斥候 / 探马蓝旗 / 陷阵先锋 / 百战将军 / 兵马元帅 / 列土封侯 / 一国之主 / 九五至尊） */
    name: string;
    /** 达到此功勋即晋升（功勋 = 玩家本人 + 玩家指挥编队的击杀精灵数，1 精灵 = 20 兵） */
    merit: number;
    /** 战术模式指挥范围：none 只管自己 / one 前排一个编队 / front 整个前排 / all 三排 */
    control: 'none' | 'one' | 'front' | 'all';
    /** 第九环·玩家官阶战力乘数（1.1 ~ 1.9，九阶段各配一档战力） */
    powerMult: number;
    /** 职权说明（管「权」：指挥什么、决定谁出兵） */
    authority: string;
    /** 大地图战略战斗战功分成比例 */
    meritShare: number;
}

export const PLAYER_RANKS: readonly PlayerRank[] = [
    { id: 'civilian', title: '平民', name: '布衣平民', merit: 0, control: 'none', powerMult: 1.1, authority: '单骑独行，随军出征（只管自己）', meritShare: 0.02 },
    { id: 'scout', title: '斥候', name: '风行斥候', merit: 1000, control: 'none', powerMult: 1.2, authority: '刺探军情，独战游击（机动牵制）', meritShare: 0.03 },
    { id: 'outrider', title: '探马', name: '探马蓝旗', merit: 3000, control: 'one', powerMult: 1.3, authority: '先头前哨，指挥前排 1 队（可领精锐）', meritShare: 0.05 },
    { id: 'vanguard', title: '先锋', name: '陷阵先锋', merit: 8000, control: 'front', powerMult: 1.4, authority: '陷阵冲锋，统率突击前排全体编队', meritShare: 0.08 },
    { id: 'general', title: '将军', name: '百战将军', merit: 20000, control: 'all', powerMult: 1.5, authority: '临阵决机，调度前中后全军 3 排编队', meritShare: 0.12 },
    { id: 'marshal', title: '元帅', name: '兵马元帅', merit: 50000, control: 'all', powerMult: 1.6, authority: '执掌帅印，节制三军主力，全军提振', meritShare: 0.16 },
    { id: 'duke', title: '公侯', name: '列土封侯', merit: 120000, control: 'all', powerMult: 1.7, authority: '裂土分封，自领精锐军府，威震方镇', meritShare: 0.20 },
    { id: 'king', title: '国王', name: '一国之主', merit: 280000, control: 'all', powerMult: 1.8, authority: '一国之主，裁夺本国诸军出战与围攻', meritShare: 0.25 },
    { id: 'emperor', title: '皇帝', name: '九五至尊', merit: 600000, control: 'all', powerMult: 1.9, authority: '九五至尊，号令四海诸王，天下兵马尽归驱策', meritShare: 0.30 },
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
