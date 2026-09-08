import { WAR_TYPES } from '../data/WarTypes';
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
    /** 四字词语标签（布衣平民 / 风行斥候 / 探马蓝旗 / 破阵先锋 / 百战将军 / 兵马元帅 / 列土封侯 / 一国之主 / 九五至尊） */
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
    { id: 'civilian', title: '平民', name: '布衣平民', merit: 0, control: 'none', powerMult: 1.1, authority: '单骑独行，随军出征', meritShare: 0.02 },
    { id: 'scout', title: '斥候', name: '风行斥候', merit: 1000, control: 'none', powerMult: 1.2, authority: '刺探军情，独战游击', meritShare: 0.03 },
    { id: 'outrider', title: '探马', name: '探马蓝旗', merit: 3000, control: 'one', powerMult: 1.3, authority: '先头前哨，指挥前排 1 队', meritShare: 0.05 },
    { id: 'vanguard', title: '先锋', name: '破阵先锋', merit: 8000, control: 'front', powerMult: 1.4, authority: '破阵冲锋，统率突击前排全体编队', meritShare: 0.08 },
    { id: 'general', title: '将军', name: '百战将军', merit: 20000, control: 'all', powerMult: 1.5, authority: '临阵决机，调度前中后全军 3 排编队', meritShare: 0.12 },
    { id: 'marshal', title: '元帅', name: '兵马元帅', merit: 50000, control: 'all', powerMult: 1.6, authority: '执掌帅印，节制三军主力，全军提振', meritShare: 0.16 },
    { id: 'duke', title: '公侯', name: '列土封侯', merit: 120000, control: 'all', powerMult: 1.7, authority: '裂土分封，自领精锐军府，威震方镇', meritShare: 0.20 },
    { id: 'king', title: '国王', name: '一国之主', merit: 280000, control: 'all', powerMult: 1.8, authority: '一国之主，裁夺本国诸军出战与围攻', meritShare: 0.25 },
    { id: 'emperor', title: '皇帝', name: '九五至尊', merit: 600000, control: 'all', powerMult: 1.9, authority: '九五至尊，号令四海诸王，天下兵马尽归驱策', meritShare: 0.30 },
];

/** 加入势力后的**保底官阶**：白身投效即为斥候，不必先攒功勋。
 *  🔴 [2026-09-07 主人定「加入势力后，即可变为斥候，无需功绩」]
 *     平民(civilian) 是「还没投任何势力的独行客」这一状态；一旦入伍，
 *     人已在军中，再挂「布衣平民」不合身份。功勋只决定**斥候以上**怎么升。 */
export const JOINED_FACTION_MIN_RANK: PlayerRankId = 'scout';

export function rankForMerit(merit: number): PlayerRank {
    let r = PLAYER_RANKS[0];
    for (const rank of PLAYER_RANKS) if (merit >= rank.merit) r = rank;
    return r;
}

/** 玩家实际官阶：功勋算一档，已入势力再兜底到 [[JOINED_FACTION_MIN_RANK]]，取高者。 */
export function rankFor(merit: number, joinedFaction: boolean): PlayerRank {
    const byMerit = rankForMerit(merit);
    if (!joinedFaction) return byMerit;
    const floorIdx = PLAYER_RANKS.findIndex((r) => r.id === JOINED_FACTION_MIN_RANK);
    const meritIdx = PLAYER_RANKS.findIndex((r) => r.id === byMerit.id);
    return meritIdx >= floorIdx ? byMerit : PLAYER_RANKS[floorIdx];
}

export function nextRankAfter(rank: PlayerRank): PlayerRank | null {
    const idx = PLAYER_RANKS.findIndex((r) => r.id === rank.id);
    return PLAYER_RANKS[idx + 1] ?? null;
}

/** 玩家素材 key（UnitAssets.UNIT_ASSETS / Scene13 WAR_TYPES 同名）。
 *  🔴 [2026-09-07] 这是「乱入者」的默认/顶层形象；**开局不是它**，见下面的 heroKeyForRank。 */
export const PLAYER_HERO_KEY = 'guanyu';

/** 官阶 → 玩家在地图与 13 里的素材 key。
 *
 *  🔴 [2026-09-09 主人定「玩家陆军初始形象改为古典斥候骑兵」] 开局是 antiquity_scout_cavalry，
 *     不是关羽（关羽是投效势力、升上去之后的乱入者本尊）。
 *     ⚠️ 这个 key 同时决定 **13 里的血/攻/防**（Scene13 用 statsFor(heroKey) 取 WAR_TYPES）：
 *        古典斥候骑兵 hp45 / atk3 / 近防0 远防2 / 速130，所以换 key = 连外观带数值一起换。
 *     ⚠️ 它还决定**地图行军速度大类**：cls='cav' → moveClassForHeroKey 返回 CAVALRY
 *        （平原 2.0 / 山地 0.9），比原来的民兵（步兵档 1.4/1.1）平原更快、山地更慢。
 *     ⚠️ 素材必须在 UNIT_ASSETS 登记过（HeroSpriteDrawer 直接读它）：
 *        antiquity_scout_cavalry 已于 2026-08-18 接线。
 *     （前身：2026-09-07 曾定「起始套用民兵 levy」，本行已取代它。） */
export const PLAYER_RANK_HERO_KEYS: Readonly<Partial<Record<PlayerRankId, string>>> = {
    civilian: 'antiquity_scout_cavalry',
};

export function heroKeyForRank(rankId: PlayerRankId): string {
    return PLAYER_RANK_HERO_KEYS[rankId] ?? PLAYER_HERO_KEY;
}

/** 玩家素材 → 地图行军大类。
 *  🔴 [2026-09-07 主人定「玩家是骑兵和步兵，还是船，在地图上的移动速度要区分」]
 *     骑兵走 CAVALRY（平原 2.0 / 山地 0.9），步兵与远程走 INFANTRY（平原 1.4 / 山地 1.1，山地之王）。
 *     船不在这里：上船后全军统一 SEA_SPEED_MULTIPLIER=1.2，兵种加成失效（既有规则，别在这补）。
 *     这三档乘在 PLAYER_HERO_SPEED_MULT 之上 → 民兵约 2.1、乱入者约 3.0、海上约 1.8。 */
export function moveClassForHeroKey(heroKey: string): 'CAVALRY' | 'INFANTRY' | 'ELEPHANT' {
    // 象兵单列：MOVEMENT_MATRIX 里 ELEPHANT 是平原 1.2 / 山地 0.7（战略机动笨重），
    // 光看 cls 会把战象当步兵（cls='melee'）、把象弓骑当远程，速度全给高了。
    if (/elephant/.test(heroKey)) return 'ELEPHANT';
    return WAR_TYPES[heroKey]?.cls === 'cav' ? 'CAVALRY' : 'INFANTRY';
}
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
