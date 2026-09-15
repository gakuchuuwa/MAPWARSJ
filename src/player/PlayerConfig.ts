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
    /** 战术模式指挥范围：none 单枪匹马 / one 率队前驱 / front 独当一面 / all 节制三军 */
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

/**
 * 玩家兜底素材 key（UnitAssets.UNIT_ASSETS / Scene13 WAR_TYPES 同名）。
 *
 * 🔴 [2026-09-09 主人定「玩家怎么显示成关羽了，赶紧删除」] 这里原本是 `'guanyu'`
 *    —— DE 的关羽英雄素材（绿袍赤兔），玩家一升到斥候、在还没收到兵模的那段时间里
 *    就会顶着关羽在地图上跑。**玩家任何时候都不许显示成关羽**，已改为古典斥候骑兵。
 *    `guanyu` 素材本身留在 UNIT_ASSETS（别处可能用），但**玩家系统不再引用它**。
 */
export const PLAYER_FALLBACK_HERO_KEY = 'antiquity_scout_cavalry';

/** 官阶 → 玩家在地图与 13 里的素材 key。**没有任何一档是关羽。**
 *
 *  🔴 [2026-09-09 主人定「玩家陆军初始形象改为古典斥候骑兵」] 开局是 antiquity_scout_cavalry。
 *     升上去之后穿什么由**收到的兵模**决定（凑卡玩法），不是靠这张表升级形象。
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

/**
 * 🔴 [2026-09-09 主人定]「玩家初始的海上兵模是独木舟 canoe」。
 * 船是所在军团四种兵模里的第四种，按官阶档位随机抽到即入 PlayerHero.learnedShips（终身保留）。
 * 有势力时海上一律画势力舰队兵模，无势力时才用自己这条。
 */
export const PLAYER_START_SHIP_KEY = 'CANOE';

export function heroKeyForRank(rankId: PlayerRankId): string {
    return PLAYER_RANK_HERO_KEYS[rankId] ?? PLAYER_FALLBACK_HERO_KEY;
}

/** 无势力自动换装顺序：骑兵 → 战车 → 象兵 → 步兵。 */
export function factionlessAppearancePriority(unitKey: string): number {
    const unit = WAR_TYPES[unitKey];
    // 战车与象兵也可能挂骑兵分类，须先分离，弓骑则仍算骑兵。
    if (/chariot|wagon|ratha/.test(unitKey)) return 1;
    if (unit?.armorTags?.includes(5)) return 2;
    if (unit?.cls === 'cav' || unit?.armorTags?.includes(8)) return 0;
    if (unit && !unit.armorTags?.includes(20)) return 3;
    return 4;
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
/**
 * 出生据点：**长安**（十三朝国都；关中核心）。
 *  🔴 [2026-09-15 主人定「开局画面改回长安」] 由佩拉改回长安。
 *     （沿革：原为长安 → 2026-09-11 因亚历山大剧本改到佩拉 → 本次改回。）
 *     镜头同源：`GameApp.setupPlayer()` 用它做 `setView`，
 *     改这一个常量，玩家出生点与开局画面一起走，不要再各写一份坐标。
 */
export const PLAYER_START_CITY_ID = 'city_changan';

/**
 * 出生点相对出生据点的**偏移**（度），让玩家落在城外一段距离、需要自己走过去，
 * 而不是站在城点正上方（否则点一下城就立刻触发城中对话，等于没有"面见"这一步）。
 *
 * 🔴 [2026-09-11 主人定「留一段距离」] —— 主人只给了"留一段距离"这条要求，**未指定数值**。
 *     下列数值与方向是 **AI 自行选定的**（可按主人一句话随时改；这是实现上绕不开的选择，
 *     按 player-rules-verbatim 的 AI 铁律第 2 条单列声明）：
 *     · 取值依据：长安→潼关官道 `road_city_changan_city_tongguan_1781725344308`
 *       自长安起**第 9 个节点** `[109.762344, 34.51982]`，即东行 0.8323° 经度、北 0.2498° 纬度。
 *       **实测球面距离 81.3 km**（haversine, R=6371；脚本 `scratch/find_changan_spawn_node.cjs`），
 *       与改回前的佩拉偏移（84.1 km）基本等距，出生"走一趟"的体感不变。
 *     · 为什么选潼关方向：潼关道是关中**东出中原**的经典驿道，与长安的史地身份相称；
 *       该向 60~100 km 区间节点齐全（68.0 / 75.9 / 81.3 / 90.6 km），取中段最稳。
 *     · 为什么取路网节点而不用随手数值：玩家是沿**路网**行军的，落在无路处会「无路可达」；
 *       取现成道路节点 = 出生点必定在路网上，`travelToCity` 必定规划得出路径。
 *     · 与抵达判定半径的关系：`PLAYER_CITY_ARRIVE_DIST` = 0.06°，本偏移远大于它，
 *       故出生时不会被判为"已在城下"，必须真的走一趟。
 *
 * ⚠️ 本偏移是**相对长安**选的。若将来再改 `PLAYER_START_CITY_ID`，必须一并复核此偏移
 *    （换城后同方向偏移可能落进海里或无路区）。
 */
export const PLAYER_START_OFFSET = { lat: 0.2498, lng: 0.8323 };

/** 单骑行军速度倍率（相对军团统一行军速度） */
export const PLAYER_HERO_SPEED_MULT = 1.5;
/** 玩家自带精锐编队的兵力（探马及以上，选了精锐才带） */
export const PLAYER_ELITE_SQUAD_TROOPS = 1500;
/** 历史任务目标搜索：沿路网最多几跳 */
export const PLAYER_QUEST_TARGET_MAX_HOPS = 5;
/** 抵达据点判定半径（度） */
export const PLAYER_CITY_ARRIVE_DIST = 0.06;

/**
 * 🔴 [2026-09-11 主人定]「玩家军团战败后，玩家要停留 3 秒再移动去下个目标。」
 * （同日先定 5 秒，当天改 3 秒，以本行为准。）
 *
 * 随军军团在大地图战败、玩家脱离军团之后，玩家原地停留这么久（毫秒）才允许再移动。
 *
 * 实现口径（2026-09-11 核对后改准，别照旧注释理解）：闸门只有一道 —— `PlayerHero.update` 里
 * `if (!this.isHeld())` 跳过 `army.update(dt)` 与 `stepChase()`，所以**坐标钉死**、走路动画也不播。
 * `travelToCity` / `travelToArmy` 本身**没有**停顿闸，指令照常受理、army 照常进 marching 状态，
 * 只是没人推进它，停顿一结束就自然出发。
 *
 * 🔴 停顿要落在**两条**路上，缺一条就等于没有（2026-09-11 主人报「一战败就移动，不等」的根因）：
 *   ① `onHostBattleEnd('defeat')` —— 军团战败但还活着；
 *   ② `update()` 里 `!host || isDestroyed || troops<=0` —— 军团被打光，这条更常见，
 *      而且它 detach 后会让 ① 的触发条件 `getHostLegionId() === this.id` 失效，① 根本轮不上。
 */
export const PLAYER_DEFEAT_HOLD_MS = 3000;

/**
 * 🔴 [2026-09-11 主人定]「调整下玩家移动速度，平地慢一小点，山地快一小点。」
 *
 * 这两个系数**只乘在玩家身上**，乘在 MOVEMENT_MATRIX 查出来的地形倍率上（见 PlayerHero 设置处）。
 * 为什么不直接改 MOVEMENT_MATRIX：那张表是**全体军团共用**的，改 CAVALRY 那一行
 * 等于把全世界骑兵军团的战略机动一起改了 —— 主人要的是玩家一个人。
 *
 * 为什么做成系数而不是写死「平原 1.8 / 山地 1.05」：玩家的行军大类会随身上兵模变
 * （骑兵 2.0/0.9、步兵 1.4/1.1、象兵 1.2/0.7，见 moveClassForHeroKey），
 * 写死数值等于把凑到的兵模差别抹平；系数则让「平地略慢、山地略快」这条对每种形象一致成立。
 *
 * ⚠️ 幅度 0.90 / 1.15 是我按「一小点」定的，主人没给具体数字 —— 嫌不够/过头直接调这两行。
 *    当前玩家是古典斥候骑兵：平原 2.0 → 1.80，山地 0.90 → 1.035（两者都还要再乘
 *    PLAYER_HERO_SPEED_MULT = 1.5）。海上不受影响：上船走 SEA_SPEED_MULTIPLIER，兵种/地形加成整个失效。
 */
export const PLAYER_PLAIN_SPEED_SCALE = 0.90;
export const PLAYER_MOUNTAIN_SPEED_SCALE = 1.15;
