/**
 * YouTube 单平台直播互动（公共玩家统一控制层）。
 * - 全体观众共同操作同一个公共玩家；原始弹幕先解析为结构化命令，经官职、状态、审核与积分仲裁后再驱动游戏。
 * - 积分（2026-10-29 主人「要有助于增加播放量，要让玩家一直在线就一直能玩」重定）：
 *     在场（10 分钟内说过话）每 3 分钟 +1 ⇒ 每场仗（约 10 分钟）够放一计；
 *     第一次来送 3、每天第一次来送 3；点赞一档 / 新订阅 / 在线新高，在场的人一起加。
 *     YouTube 不给观众名单，只能认在聊天里说过话的人（不说话的看客发不了分）。
 * - 真钱（Super Chat / Super Sticker）先放一边：只照原样记账并致谢，不放技、不换积分；玩法一律用积分。
 */
import type { GameApp } from '../app/GameApp';
import type { TacticalSixSet } from '../data/TacticalSkillCatalog';
import { speechAnnouncer } from '../audio/SpeechAnnouncer';
import {
    blockLiveName,
    getBlockedLiveNames,
    hydrateBlockedLiveNames,
    moderateLiveName,
} from './LiveNameModeration';
import { PLAYER_HERO_NAME, PLAYER_RANKS } from '../player/PlayerConfig';
import { CULTURE66_PORTRAIT_POOLS } from '../config/portrait_defaults';
import { style62OfCity } from '../player/PlayerQuestSystem';
import { PlayerHero } from '../player/PlayerHero';
import { mergePlayerPeakFromUnit } from '../player/PlayerGrowth';
import { CityAssetManager } from '../assets/CityAssetManager';
import { SANDBOX_DISPLAY_NAMES } from '../data/SandboxDisplayNames';
import { roadRegistry } from '../roads/RoadRegistry';
import { FACTION_GENERALS, getFactionGeneral, type FactionGeneral } from '../data/FactionGenerals';
import { getCityAnchoredGenerals } from '../data/CityGeneralBridge';
import { isGeneralOnStage } from '../data/generalOnStage';
import { getFactionLegionComposition } from '../types/CultureFormations';
import { WAR_TYPES } from '../data/WarTypes';
import { isShipUnitKey } from '../data/generalHeroUnits';
import { GameConfig } from '../config/GameConfig';

export const PRICE_PER_CAST = 100;
export const ORDERS_PER_CAST = 1;
/**
 * 🔴 [2026-11-07 主人令「积分筹码不要滥用，要给新人多一点机会，要让老玩家消耗更多，不要通胀」]
 *    积分库存封顶 40（原 9999）：老观众攒到这儿就不再涨，通胀被硬压住；
 *    放计一次 1 分，40 分够一个人在一晚上放 40 次，绰绰有余。
 */
export const ORDER_CAP = 40;
export const MAX_SKILL_BID = 100;
export const FREE_CAST_GAP_MS = 2000;
const PRESENT_MS = 20 * 60_000;
/** 在场发分：每隔这么久，在场的人各 +PRESENCE_PAY（原 2 分钟 → 5 分钟：光挂着不该比说话更值钱） */
const PRESENCE_PAY_MS = 5 * 60_000;
const PRESENCE_PAY = 1;
/** 发言参与加分冷却：每隔这么久在聊天室发言可得 +1 积分（原 1 分钟 → 3 分钟：一分钟一分等于一分钟一计） */
const CHAT_EARN_GAP_MS = 3 * 60_000;
/**
 * 🔴 [2026-11-07 主人令「不要通胀」] **每天**靠发言/在场/点赞/订阅/在线新高能挣的积分上限。
 *    新人礼包（首次来、每天回来）不计入；点赞订阅这些真实互动照给，但也算在这 15 分里。
 *    按现在的价：15 分 = 15 计，够一个观众一晚上放得很爽；不给它设上限，挂十小时就能攒几百。
 */
const DAILY_EARN_CAP = 15;
/** 战术模式战斗满这么久结束时，在场全员 +1 积分（过滤 10 秒非战术略过战） */
const TACTICAL_BATTLE_REWARD_MIN_MS = 30_000;
/** 战术战奖励的冷却：一局几分钟，每局都给等于每局白送一分（原每局都发） */
const TACTICAL_REWARD_GAP_MS = 10 * 60_000;
/** 第一次在本频道说话送的分（原 3 → 5：新来的人一句「押1 5」就够押一把、还剩两个计） */
const NEWCOMER_BONUS = 5;
/** 每天第一次说话送的分（老观众隔天回来） */
const RETURN_BONUS = 2;
/** 订阅涨 1，在场每人加的分（一计） */
const SUB_BONUS = 3;
const GOAL_BONUS_MAX = 3;
const HANDLED_CAP = 5000;
const TICK_MS = 250;
const STORE_KEY = 'mapwar-live-wallet';
const NAME_MAX = 6;
const STALE_BATTLE_CHAT_GRACE_MS = 2000;
/** 战斗结束前这么久内刚放出的技能视为被直播延迟坑在收尾，自动原数退回积分 */
const LATE_CAST_REFUND_WINDOW_MS = 6000;
/** 同一观众语音提示最小间隔（防刷屏口令把语音队列塞满） */
const VIEWER_VOICE_NOTICE_GAP_MS = 2500;
/** 隔这么久再说话也当新来的（弹「怎么玩」卡） */
const NEWCOMER_GAP_MS = 30 * 60_000;

const SIX_BY_WORD: Record<string, TacticalSixSet> = {
    攻: 'gongzhan', 胜: 'shengzhan', 敌: 'dizhan', 混: 'hunzhan', 并: 'bingzhan', 败: 'baizhan',
    攻战: 'gongzhan', 胜战: 'shengzhan', 敌战: 'dizhan', 混战: 'hunzhan', 并战: 'bingzhan', 败战: 'baizhan',
};
const SIX_WORDS = ['攻', '胜', '敌', '混', '并', '败'] as const;
/** 点名语音里念的六计全称 */
const SIX_FULL_NAME: Record<string, string> = {
    攻: '攻战计', 胜: '胜战计', 敌: '敌战计', 混: '混战计', 并: '并战计', 败: '败战计',
};
const TRAD_TO_SIMP: Record<string, string> = {
    勝: '胜', 敵: '敌', 並: '并', 併: '并', 敗: '败', 戰: '战', 選: '选', 號: '号',
    莊: '庄', 閒: '闲', 註: '注',
};
function normalizeCommand(text: string): string {
    return text.normalize('NFKC').trim().replace(/[勝敵並併敗戰選號莊閒註]/g, (c) => TRAD_TO_SIMP[c] ?? c);
}

/** 玩家改名竞拍口令：名 新名字 / 名 新名字 5 / 改名 新名字 10（省略积分时默认在当前最高价上 +1） */
export function parseRenameCommand(word: string): { rawName: string; bid: number | null } | null {
    const m = word.match(/^(?:改名|名)\s*([^\d\s]+?)\s*([1-9]\d*)?$/);
    if (!m) return null;
    const rawName = m[1].trim();
    if (!rawName) return null;
    const bid = m[2] !== undefined ? Number(m[2]) : null;
    if (bid !== null && (!Number.isSafeInteger(bid) || bid <= 0)) return null;
    return { rawName, bid };
}

/** 离职选投靠目标口令：投1 3 / 选2 4 / 投 大明 3 / 投岳飞4 / 投岳飞（省略积分时默认在当前最高价上 +1） */
export function parseJoinCommand(word: string): { index: number; query?: string; bid: number | null } | null {
    const mNum = word.match(/^(?:投|选)\s*([1-9]\d*)(?:\s+([1-9]\d*))?$/);
    if (mNum) {
        const index = Number(mNum[1]);
        const bid = mNum[2] !== undefined ? Number(mNum[2]) : null;
        if (!Number.isSafeInteger(index) || index <= 0) return null;
        if (bid !== null && (!Number.isSafeInteger(bid) || bid <= 0)) return null;
        return { index, bid };
    }
    const mName = word.match(/^(?:投|选)\s*([^\d\s]+?)\s*([1-9]\d*)?$/);
    if (!mName) return null;
    const query = mName[1].trim();
    const bid = mName[2] !== undefined ? Number(mName[2]) : null;
    if (!query) return null;
    if (bid !== null && (!Number.isSafeInteger(bid) || bid <= 0)) return null;
    return { index: 0, query, bid };
}

/**
 * 即时战斗（`?quickbattle=1`）＝只有战术模式的观战局（入口同 `app/UnattendedStream.isQuickBattleMode`）。
 * 🔴 [2026-11-07 主人令「观众起初可以选择攻击方或者是防守方」] 这个模式里没有公共玩家：
 *    观众各选一边、六字全开，只受积分与排队限制（见 onChat / playerSixBlockReason / tickCastQueue）。
 */
function quickBattleModeOn(): boolean {
    return new URLSearchParams(window.location.search).has('quickbattle');
}

/**
 * 🔴 [2026-11-07 主人令「添加一个下注积分，走百家乐的模式。和释放积分分开。一局定个时间，时间内战斗不结束，算和」]
 *    下注是**第二本账**（筹码 chips），与放计用的积分（orders）完全分开：放计不能花筹码，下注不能花积分。
 *    三门下注照百家乐：押攻方（庄）1 赔 0.95、押守方（闲）1 赔 1、押和 1 赔 8；
 *    开和局时押庄/押闲的本金原数退回（百家乐的和局规则），只有押和的收 8 倍。
 */
/**
 * 🔴 [2026-11-07 主人定·战术模式「乱入者 VS 维序者」统一积分押注]
 *    统一只用「积分」（orders）一本账：观众赢下押注的积分可直接用于战术模式放六计，或带回战略模式竞拍（选目标/封侯/立国）。
 *    不显眼展示「庄/闲/和」，界面与播报统一使用「乱入者 / 维序者 / 平局」；
 *    底层赔率沿用百家乐数学：押乱入者 1 赔 0.95、押维序者 1 赔 1、押平局 1 赔 8（平局时退还乱入者与维序者本金）。
 */
export type BetSide = 'att' | 'def' | 'draw';
export const BET_BANKER_MULT = 0.95;
export const BET_PLAYER_MULT = 1;
export const BET_TIE_MULT = 8;
/** 单场每位观众累计押注上限（防刷分通胀） */
export const BET_MAX_PER_BATTLE = 20;
/** 每局开窗时把快输光的人（<3分）补足到 3 积分 */
export const BET_START_CHIPS = 3;
export const BET_NEWCOMER_CHIPS = 10;
export const BET_CHIP_CAP = ORDER_CAP;
export const BET_SIDE_NAMES: Readonly<Record<BetSide, string>> = { att: '乱入者', def: '维序者', draw: '平局' };

/** 下注口令：押1 5 / 押乱 5 / 押2 5 / 押维 5 / 押平 3（不写数目＝1） */
export function parseBetCommand(word: string): { side: BetSide; amount: number } | null {
    const m = word.match(/^(?:押|下注|买)\s*(乱入者|乱入|乱|维序者|维序|维|攻|庄|守|闲|和|平局|平|[12])\s*([1-9]\d*)?$/);
    if (!m) return null;
    const k = m[1];
    const side: BetSide = (k === '1' || k.startsWith('乱') || k === '攻' || k === '庄') ? 'att'
        : (k === '2' || k.startsWith('维') || k === '守' || k === '闲') ? 'def' : 'draw';
    const amount = m[2] !== undefined ? Number(m[2]) : 1;
    if (!Number.isSafeInteger(amount) || amount <= 0) return null;
    return { side, amount };
}

/**
 * 🔴 [2026-11-07 主人令] 元帅两权（都按**资历曾达元帅**开启，不要求当前就是元帅）：
 *   ① 竞价选军队攻击目标：`目标3 30`（3＝目标编号，30＝出价；省略出价＝在现价上 +1）；
 *   ② 挑立绘：先选文化 `像3`（不花钱，选完由系统从该文化凑 10 张），再挑图 `图4 10`（竞价，高价先得）。
 * 立绘不足 10 张时按「同一 16 母体大区里、地理最近的、张数够的文化」补足；母体内凑不满再扩到全库最近
 * （现存唯一一例：THRACIAN 7 张 → 借最近的 GREEK）。
 */
export function parseTargetCommand(word: string): { index: number; bid: number | null } | null {
    const m = word.match(/^目标\s*([1-9]\d*)(?:\s+([1-9]\d*))?$/);
    if (!m) return null;
    const index = Number(m[1]);
    const bid = m[2] !== undefined ? Number(m[2]) : null;
    if (!Number.isSafeInteger(index) || index <= 0) return null;
    if (bid !== null && (!Number.isSafeInteger(bid) || bid <= 0)) return null;
    return { index, bid };
}
/** 元帅·先选文化（不花钱）：像3 */
export function parsePortraitCultureCommand(word: string): { index: number } | null {
    const m = word.match(/^像\s*([1-9]\d*)$/);
    if (!m) return null;
    const index = Number(m[1]);
    return Number.isSafeInteger(index) && index > 0 ? { index } : null;
}
/** 元帅·再从该文化凑出的 10 张里挑一张（竞价）：图4 10 / 图4 */
export function parsePortraitPickCommand(word: string): { index: number; bid: number | null } | null {
    const m = word.match(/^图\s*([1-9]\d*)(?:\s+([1-9]\d*))?$/);
    if (!m) return null;
    const index = Number(m[1]);
    const bid = m[2] !== undefined ? Number(m[2]) : null;
    if (!Number.isSafeInteger(index) || index <= 0) return null;
    if (bid !== null && (!Number.isSafeInteger(bid) || bid <= 0)) return null;
    return { index, bid };
}

/** 立绘候选张数：主人定的 10 张 */
export const MARSHAL_PORTRAIT_SLOTS = 10;
/** 选出 10 张立绘后的选图保护期（毫秒）：期间尚未有人买图时，禁止别人用 0 分「像N」把正在看的池子刷掉 */
export const MARSHAL_PORTRAIT_CULTURE_HOLD_MS = 45_000;
/** 元帅·选目标竞价区间（起步值，上播按数据调） */
export const MARSHAL_TARGET_MIN_BID = 30;
export const MARSHAL_TARGET_MAX_BID = 300;
/** 元帅·挑立绘竞价区间 */
export const MARSHAL_PORTRAIT_MIN_BID = 10;
export const MARSHAL_PORTRAIT_MAX_BID = 200;
/** 公侯/国王/皇帝（第 7～9 阶）竞价与众筹常量 */
export const DUKE_LEGION_MIN_BID = 10;
export const DUKE_LEGION_MAX_BID = 200;
export const DUKE_LEGION_NAME_MIN_BID = 5;
export const DUKE_LEGION_NAME_MAX_BID = 200;
export const DUKE_FIEF_MIN_BID = 30;
export const DUKE_FIEF_MAX_BID = 300;
export const KING_FACTION_NAME_MIN_BID = 15;
export const KING_FACTION_NAME_MAX_BID = 300;
export const KING_SUMMON_MIN_BID = 30;
export const KING_SUMMON_MAX_BID = 300;
export const EMPEROR_COERCE_MIN_CONTRIB = 5;
export const EMPEROR_COERCE_TARGET_POINTS = 100;
export const EMPEROR_COERCE_COOLDOWN_MS = 20 * 60_000;

/** 公侯·组建三排自定义军团口令：编 1 4 3 15 / 编 1 4 3（从已收兵模池中挑前/中/后三排） */
export function parseCustomFormationCommand(word: string): { rows: [number, number, number]; bid: number | null } | null {
    const m = word.match(/^编\s*([1-9]\d*)\s+([1-9]\d*)\s+([1-9]\d*)(?:\s+([1-9]\d*))?$/);
    if (!m) return null;
    const r0 = Number(m[1]), r1 = Number(m[2]), r2 = Number(m[3]);
    const bid = m[4] !== undefined ? Number(m[4]) : null;
    if (![r0, r1, r2].every((x) => Number.isSafeInteger(x) && x > 0)) return null;
    if (bid !== null && (!Number.isSafeInteger(bid) || bid <= 0)) return null;
    return { rows: [r0, r1, r2], bid };
}

/** 公侯·命名自定义军团口令：军 玄甲铁骑 10 / 军 玄甲铁骑 */
export function parseLegionNameCommand(word: string): { rawName: string; bid: number | null } | null {
    const m = word.match(/^军\s+([^\d\s]+?)\s*([1-9]\d*)?$/);
    if (!m) return null;
    const rawName = m[1].trim();
    if (!rawName) return null;
    const bid = m[2] !== undefined ? Number(m[2]) : null;
    if (bid !== null && (!Number.isSafeInteger(bid) || bid <= 0)) return null;
    return { rawName, bid };
}

/** 公侯·选定根据地据点（与主公结盟自立）口令：封2 30 / 封2 */
export function parseFiefCommand(word: string): { index: number; bid: number | null } | null {
    const m = word.match(/^封\s*([1-9]\d*)(?:\s+([1-9]\d*))?$/);
    if (!m) return null;
    const index = Number(m[1]);
    const bid = m[2] !== undefined ? Number(m[2]) : null;
    if (!Number.isSafeInteger(index) || index <= 0) return null;
    if (bid !== null && (!Number.isSafeInteger(bid) || bid <= 0)) return null;
    return { index, bid };
}

/** 国王·立国号与单字旗号口令：国 大秦 秦 20 / 国 大秦 20 / 国 大秦 秦 */
export function parseKingdomNameCommand(word: string): { rawName: string; flagChar: string; bid: number | null } | null {
    const m = word.match(/^国\s+([^\d\s]+)(?:\s+([^\d\s]))?(?:\s+([1-9]\d*))?$/);
    if (!m) return null;
    const rawName = m[1].trim();
    if (!rawName) return null;
    const flagChar = (m[2]?.trim() || Array.from(rawName)[0] || '探').slice(0, 1);
    const bid = m[3] !== undefined ? Number(m[3]) : null;
    if (bid !== null && (!Number.isSafeInteger(bid) || bid <= 0)) return null;
    return { rawName, flagChar, bid };
}

/** 国王·征召本势力/同盟主公武将领军合入本军口令：召2 30 / 召2 */
export function parseSummonGeneralCommand(word: string): { index: number; bid: number | null } | null {
    const m = word.match(/^召\s*([1-9]\d*)(?:\s+([1-9]\d*))?$/);
    if (!m) return null;
    const index = Number(m[1]);
    const bid = m[2] !== undefined ? Number(m[2]) : null;
    if (!Number.isSafeInteger(index) || index <= 0) return null;
    if (bid !== null && (!Number.isSafeInteger(bid) || bid <= 0)) return null;
    return { index, bid };
}

/** 皇帝·众筹圣旨威压小于己方十倍的接壤弱国臣服口令：威1 20 / 威1 */
export function parseCoerceFactionCommand(word: string): { index: number; amount: number } | null {
    const m = word.match(/^威\s*([1-9]\d*)(?:\s+([1-9]\d*))?$/);
    if (!m) return null;
    const index = Number(m[1]);
    const amount = m[2] !== undefined ? Number(m[2]) : EMPEROR_COERCE_MIN_CONTRIB;
    if (!Number.isSafeInteger(index) || index <= 0) return null;
    if (!Number.isSafeInteger(amount) || amount <= 0) return null;
    return { index, amount };
}

/** 常见直播聊天机器人：它们在聊天里发消息，但不是观众 */
const CHAT_BOT_NAMES = new Set(['nightbot', 'streamlabs', 'streamelements', 'moobot', 'fossabot', 'wizebot']);
export function isChatBot(raw: string | undefined | null): boolean {
    return CHAT_BOT_NAMES.has(String(raw ?? '').normalize('NFKC').trim().replace(/^@/, '').toLowerCase());
}

export function cleanViewerName(raw: string | undefined | null): string {
    const s = String(raw ?? '').normalize('NFKC')
        .replace(/(?:https?:\/\/|www\.)\S+/gi, '')
        .replace(/\S+\.(?:com|net|org|cn|io|me|gg|tv|top|xyz)\b\S*/gi, '')
        .replace(/\d{5,}/g, '')
        .replace(/\p{C}/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
    const chars = Array.from(s);
    if (chars.length === 0) return '观众';
    return chars.length > NAME_MAX ? `${chars.slice(0, NAME_MAX).join('')}…` : s;
}

export interface YouTubePayment {
    amountMicros: string;
    currency: string;
    display: string;
    kind: 'Super Chat' | 'Super Sticker';
}
export interface YouTubeLiveEvent {
    id: string;
    platform: 'youtube';
    uid: string;
    viewer: string;
    text: string;
    publishedAt: string;
    payment?: YouTubePayment;
}
export interface ViewerQueuedCast {
    uid: string;
    viewer: string;
    side: 0 | 1;
    six: TacticalSixSet;
    word: string;
    paid: boolean;
    /** 是否已在入队时预扣积分（false＝释放时再扣，未放出不扣分） */
    deducted?: boolean;
}
export interface ViewerRenameRecord {
    uid: string;
    viewer: string;
    bid: number;
    prevName: string;
    appliedName: string;
    at: number;
}
export interface ViewerActiveJoinBid {
    uid: string;
    viewer: string;
    bid: number;
    index: number;
    targetId: string;
    label: string;
}
export interface ExperimentalSupportStats {
    count: number;
    totalCents: number;
    lastDonor: string;
    lastWhat: string;
}
export interface LiveCommandRecord {
    seq: number;
    eventId: string;
    uid: string;
    viewer: string;
    commandType:
        | 'skill_six'
        | 'rename'
        | 'join_choice'
        | 'bet'
        | 'pick_target'
        | 'pick_portrait'
        | 'custom_legion'
        | 'legion_name'
        | 'pick_fief'
        | 'kingdom_name'
        | 'summon_general'
        | 'coerce_faction'
        | 'duke_formation'
        | 'duke_legion_name'
        | 'duke_fief'
        | 'king_faction_name'
        | 'king_summon'
        | 'emperor_coerce';
    params: string;
    pointsBid: number;
    publishedAtMs: number;
    receivedAtMs: number;
    sessionId: string;
    battleId: number;
    status: 'queued' | 'executed' | 'rejected' | 'refunded';
    reason?: string;
}
export interface ViewerLedger {
    version: 1;
    revision?: number;
    day: string;
    wallets: Record<string, { name: string; cents: number }>;
    /** seen：最近一次说话（刷新页面后在场不断）；day：最近一次说话是哪天（每天第一次来送分）；earned/earnDay：当天已挣的分（每日上限） */
    orders: Record<string, { name: string; n: number; seen?: number; day?: string; earned?: number; earnDay?: string }>;
    handled: string[];
    queue?: ViewerQueuedCast[];
    sides?: [string, 0 | 1][];
    wanted?: [string, string][];
    renameHighestBid?: number;
    renameHistory?: ViewerRenameRecord[];
    blockedNames?: string[];
    activeJoinBid?: ViewerActiveJoinBid | null;
    joinHighestBid?: number;
    joinLastLabel?: string;
    experimentalSupport?: ExperimentalSupportStats;
    /** 下注筹码（第二本账，与 orders 分开）：每局开窗补足、赢下的留着 */
    chips?: Record<string, { name: string; n: number }>;
}

export interface ViewerCastResult {
    viewer: string;
    side: 0 | 1;
    six: TacticalSixSet;
    paid: boolean;
    outcome: 'cast' | 'void';
    skillName?: string;
}
type QueuedCast = ViewerQueuedCast;
interface OrderAcct {
    name: string;
    n: number;
    seen: number;
    lastEarn: number;
    /** 最近一次说话的日期（today() 格式）；空＝还没在聊天里说过话 */
    day: string;
    /** 当天靠发言/在场/点赞等挣到的分（每日上限用） */
    earned?: number;
    /** earned 是哪天的（跨天清零） */
    earnDay?: string;
}
const CN_NUM = ['零', '一', '两', '三', '四', '五', '六'];

const USD_RATE: Record<string, number> = {
    USD: 1, CNY: 0.14, TWD: 0.031, HKD: 0.128, CAD: 0.73, AUD: 0.66,
    SGD: 0.74, MYR: 0.21, EUR: 1.08, GBP: 1.27, JPY: 0.0067, KRW: 0.00073,
};
/**
 * 在线新高的里程碑：10 人以下每多 1 人算一档，50 人以下每 5 人一档，再往上每 10 人一档。
 * 🔴 [2026-10-27] 新频道常年只有个位数观众，原先固定「每 5 人一档」在 2~4 人的直播间永远触发不了。
 */
function viewerPeakMilestone(n: number): number {
    if (n < 10) return n;
    if (n < 50) return Math.floor(n / 5) * 5;
    return Math.floor(n / 10) * 10;
}

export function youTubePaymentCents(payment: YouTubePayment): number {
    const micros = Number(payment.amountMicros);
    const rate = USD_RATE[payment.currency.toUpperCase()];
    if (!Number.isSafeInteger(micros) || micros <= 0 || rate === undefined) return 0;
    return Math.max(0, Math.round(micros / 10_000 * rate));
}

export class ViewerLive {
    private sides = new Map<string, 0 | 1>();
    private orders = new Map<string, OrderAcct>();
    private lastChatEarnAt = new Map<string, number>();
    private lastVoiceNoticeAt = new Map<string, number>();
    /** 🔴 [2026-11-09 主人令「做点名语音」] 本场（这次打开游戏页起）已点过名的观众：每人只在第一次参战时念一次 */
    private greetedThisSession = new Set<string>();
    private recentBattleCasts: { uid: string; viewer: string; cost: number; label: string; castAtMs: number }[] = [];
    private wallets = new Map<string, { name: string; cents: number }>();
    private wanted = new Map<string, string>();
    private handled = new Set<string>();
    private queue: QueuedCast[] = [];
    private commandSeq = 0;
    private revision = 0;
    private readonly sessionId = `live-${Date.now()}`;
    private battleId = 0;
    private battleStartedAtMs = 0;
    private lastBattleEndedAtMs = 0;
    /** 上一次发「战术战结束在场 +1」的时刻（10 分钟冷却，防每局白送） */
    private lastTacticalRewardAt = 0;
    private lastFreeCastAt = 0;
    /** 即时战斗两边各自的放出时刻（攻=0 / 守=1）；普通模式不用 */
    private lastFreeCastAtBySide: [number, number] = [0, 0];
    /** 本页是不是即时战斗观战局（构造时看一次 URL，免得每 tick 解析） */
    private readonly duel = quickBattleModeOn();
    // ── 下注（百家乐式，第二本账）──
    private chips = new Map<string, { name: string; n: number }>();
    /** 本局下注窗口是否还开着（选人画面那 30 秒开着，开战封盘） */
    private betOpen = false;
    /** 本局三门的注额合计，仅用于播报与面板 */
    private betStakes: [number, number, number] = [0, 0, 0];
    /** 本局每人押了什么（uid → 注单，可多笔累加） */
    private bets = new Map<string, { name: string; side: BetSide; amount: number }[]>();
    // ── 元帅两权（2026-11-07 主人令；按资历曾达元帅开启）──
    /** 已竞价成交的攻击目标（等着军团执行；engaged=true 表示已实际发起对该城的攻城战） */
    private marshalTarget: { uid: string; viewer: string; bid: number; cityId: string; cityName: string; armyId: string; enemyFactionId: string; engaged?: boolean } | null = null;
    /** 立绘：第一步选定的文化（不花钱，先到先改） */
    private portraitCulture: string | null = null;
    /** 该文化凑出的 10 张候选（路径） */
    private portraitPool: string[] = [];
    /** 抽出 10 张候选的时刻（用于未成交前的选图保护期，防路人 0 分刷掉别人正在看的图） */
    private portraitPoolAt = 0;
    /** 第二步成交的立绘（已生效） */
    private portraitPicked: { uid: string; viewer: string; bid: number; index: number; path: string; culture: string } | null = null;
    // ── 公侯 / 国王 / 皇帝（第 7～9 阶，按资历开启）──
    private dukeFormationPicked: { uid: string; viewer: string; bid: number; rows: [number, number, number]; names: [string, string, string] } | null = null;
    private dukeLegionNameBid = 0;
    private dukeFiefPicked: { uid: string; viewer: string; bid: number; cityId: string; cityName: string } | null = null;
    private kingFactionNameBid = 0;
    private kingSummonPicked: { uid: string; viewer: string; bid: number; generalId: string; generalName: string } | null = null;
    private emperorCoercePool: {
        factionId: string;
        factionName: string;
        total: number;
        contributors: Map<string, { name: string; amount: number }>;
    } | null = null;
    private lastCoerceSuccessAt = 0;
    private wasActive = false;
    private day = '';
    private log: string[] = [];
    private recentCommands: LiveCommandRecord[] = [];
    private renameHighestBid = 0;
    private renameHistory: ViewerRenameRecord[] = [];
    private activeJoinBid: ViewerActiveJoinBid | null = null;
    private joinHighestBid = 0;
    private joinLastLabel = '';
    private prevJoinHighestBid = 0;
    private experimentalSupport: ExperimentalSupportStats = { count: 0, totalCents: 0, lastDonor: '', lastWhat: '' };
    private likeMax = -1;
    private subMax = -1;
    private viewerPeak = -1;
    private viewerPeakMilestone = 0;
    private likeProg = 0;
    private likeTotal = 0;
    private subTotal = 0;
    private viewers = 0;
    private lastPresencePayAt = Date.now();
    /** 有新观众进来（在线人数涨了 / 有人本场第一次说话）；面板挂「怎么玩」卡 */
    public onNewcomer: (() => void) | null = null;
    public onResult: ((r: ViewerCastResult) => void) | null = null;
    public onLedgerChange: ((ledger: ViewerLedger) => void) | null = null;
    /** 这一页是不是唯一记账页（由 YouTubeOfficialBridge 接上）；在场发分只在记账页做 */
    public isAccountingPage: () => boolean = () => true;
    public platformStatus = '';
    public ytStatus = '';
    public lastChatAt = 0;

    constructor(private readonly app: GameApp) {
        this.load();
        window.setInterval(() => this.tick(), TICK_MS);
    }

    public getRevision(): number { return this.revision; }
    public getRecentCommands(): readonly LiveCommandRecord[] { return this.recentCommands; }

    /** 新开一局（一天一局）时重置本局改名最高价与选主状态。 */
    public resetGameSession(): void {
        this.renameHighestBid = 0;
        this.renameHistory = [];
        this.joinHighestBid = 0;
        this.joinLastLabel = '';
        this.prevJoinHighestBid = 0;
        // 新一局：本局注单作废、窗口关掉（开战时会重开），筹码保留
        this.bets.clear();
        this.betStakes = [0, 0, 0];
        this.betOpen = false;
        // 元帅两权按「本局」重来：新开一局才回到未使用
        if (this.marshalTarget) this.app.aiController?.clearViewerTargetLock?.(this.marshalTarget.armyId);
        this.marshalTarget = null;
        this.portraitCulture = null;
        this.portraitPool = [];
        this.portraitPoolAt = 0;
        this.portraitPicked = null;
        this.dukeFormationPicked = null;
        this.dukeLegionNameBid = 0;
        this.dukeFiefPicked = null;
        this.kingFactionNameBid = 0;
        this.kingSummonPicked = null;
        this.refundEmperorCoercePool('新开一局');
        this.lastCoerceSuccessAt = 0;
        if (this.activeJoinBid) {
            this.acct(this.activeJoinBid.uid, this.activeJoinBid.viewer).n = Math.min(
                ORDER_CAP,
                this.acct(this.activeJoinBid.uid, this.activeJoinBid.viewer).n + this.activeJoinBid.bid,
            );
            this.activeJoinBid = null;
        }
        this.save();
    }

    /** 普通聊天刷新在场（在场才吃每 3 分钟的分）；统一命令层解析查分、改名、投靠与玩家六计。 */
    public onChat(
        viewer: string,
        text: string,
        paid = false,
        uid?: string,
        meta?: { eventId?: string; publishedAtMs?: number; staleForBattle?: boolean },
    ): string {
        this.syncBattleLifecycle();
        const name = cleanViewerName(viewer);
        const id = uid || viewer.trim() || '观众';
        const now = Date.now();
        const eventId = meta?.eventId || `local:${++this.commandSeq}`;
        const pubMs = meta?.publishedAtMs && Number.isFinite(meta.publishedAtMs) ? meta.publishedAtMs : now;
        let word = normalizeCommand(text);
        const isNewViewer = !this.orders.has(id);
        const acc = this.acct(id, name);
        const prevSeen = acc.seen;
        acc.seen = now;
        // 本场第一次说话（或隔了半小时回来）＝新来的人 → 画面弹「怎么玩」
        if (!prevSeen || now - prevSeen > NEWCOMER_GAP_MS) this.onNewcomer?.();
        // 送分在口令之前：新来的人第一句就发「攻」也够分；老观众每满 1 分钟发言参与再 +1 分
        this.welcome(id, name, acc, isNewViewer);
        const lastChatEarn = this.lastChatEarnAt.get(id) ?? 0;
        if (now - lastChatEarn >= CHAT_EARN_GAP_MS) {
            this.lastChatEarnAt.set(id, now);
            this.addOrders(id, name, 1, true);
            this.save();
        }
        if (paid) {
            this.onPayment(id, name, PRICE_PER_CAST, '测试打赏');
        }

        // 0. 查自己的积分（统一只用积分一本账）
        if (word === '积分' || word === '查分') {
            this.notifyViewerVoice(id, `${name}，你现有${acc.n}积分`);
            return this.note(`${name} 现有 ${acc.n} 积分（押注、放计与战略竞拍通用）`);
        }

        // 0.5 押注（开局 9 秒窗口：押1/押乱、押2/押维、押平；统一用积分，战术局通用，不控将）
        const betCmd = parseBetCommand(word);
        if (betCmd) {
            return this.handleBetCommand(id, name, betCmd.side, betCmd.amount, eventId, pubMs);
        }
        if (/^(?:押|下注|买)\s*\S*$/.test(word)) {
            this.notifyViewerVoice(id, `${name}，押注写法「押1 5」「押2 5」「押平 2」`);
            return this.note(`${name}：押注写法「押1 5」（乱入者）/「押2 5」（维序者）/「押平 2」（单场上限 ${BET_MAX_PER_BATTLE} 分）`);
        }

        // 🔴 [2026-11-13 主人令] 历史推演只受理战术放计（可定输赢，不改势力走势）；其余控将口令只在乱斗受理
        const skillCmd = !!SIX_BY_WORD[word]
            || !!SIX_BY_WORD[word.match(/^(?:投|选)?\s*(?:1|2|乱入者|乱入|乱|维序者|维序|维)\s*(\S+)$/)?.[1] ?? '']
            || /^(?:投|选)?\s*(?:1|2|乱入者|乱入|乱|维序者|维序|维)$/.test(word);
        if (!skillCmd && !this.duel && (!this.app.playerHero || this.app.playerHero.autoPlan !== 'melee')) {
            return `${name}：历史推演中不受理控将口令`;
        }

        // 1. 玩家改名竞拍（平民起全阶段可用，整局持续抬价）
        const renameCmd = parseRenameCommand(word);
        if (renameCmd) {
            return this.handleRenameCommand(id, name, renameCmd.rawName, renameCmd.bid, eventId, pubMs);
        }
        if (/^(?:改名|名)\s+\S+$/.test(word)) {
            this.notifyViewerVoice(id, `${name}，改名需在名字后加积分，至少${this.renameFloor() + 1}分`);
            return this.note(`${name}：改名格式为「名 新名字 积分」，当前需出 ${this.renameFloor() + 1} 积分以上`);
        }

        // 1.5 🔴 [2026-11-09 主人定「按1，加入乱入者，随机放六计，按2，加入维序者，随机放六计」]
        //   · 发「1 / 2」（或 投1 / 乱入者 / 维序者）＝ 加入该阵营（投一次以后都是）；打仗时同时随机放一计（1 积分）
        //   · 发「1攻 / 2混」＝ 加入该阵营并放指定的那一计
        const campCombo = word.match(/^(?:投|选)?\s*(1|2|乱入者|乱入|乱|维序者|维序|维)\s*(\S+)$/);
        if (campCombo && SIX_BY_WORD[campCombo[2]]) {
            if (meta?.staleForBattle) {
                this.recordCmd(eventId, id, name, 'skill_six', campCombo[2], ORDERS_PER_CAST, pubMs, now, 'rejected', '迟到于上一场战斗');
                this.notifyViewerVoice(id, `${name}，上一仗刚结束，未扣积分`, true);
                return this.note(`${name}：上一仗迟到口令已忽略，未扣积分`);
            }
            const blocked = this.playerSixBlockReason(SIX_BY_WORD[campCombo[2]]);
            if (blocked) {
                this.recordCmd(eventId, id, name, 'skill_six', campCombo[2], ORDERS_PER_CAST, pubMs, now, 'rejected', blocked);
                this.notifyViewerVoice(id, `${name}，${blocked}，未扣积分`);
                return this.note(`${name}：${blocked}`);
            }
            const choice: '1' | '2' = (campCombo[1] === '1' || campCombo[1].startsWith('乱')) ? '1' : '2';
            this.setViewerCampChoice(id, choice);
            word = campCombo[2];
        } else if (/^(?:投|选)?\s*(1|2|乱入者|乱入|乱|维序者|维序|维)$/.test(word)) {
            const choice: '1' | '2' = /^(?:投|选)?\s*(?:1|乱)/.test(word) ? '1' : '2';
            this.setViewerCampChoice(id, choice);
            const repLabel = choice === '1' ? '乱入者' : '维序者';
            // 打仗时：加入阵营的同时随机放一计（积分不够、排队等都交给 request 照常处理）
            if (this.battleOn() && !meta?.staleForBattle) {
                const randWord = SIX_WORDS[Math.floor(Math.random() * SIX_WORDS.length)];
                return this.request(id, name, randWord, eventId, pubMs);
            }
            this.greetFirstJoin(id, name, choice);
            this.notifyViewerVoice(id, `${name}，已成为${repLabel}，以后每场自动助${repLabel}`);
            return this.note(`${name} 已成为【${repLabel}】（投一次以后都是，打仗时发 ${choice} 随机放一计）`);
        }

        // 2. 离职后战略地图投靠竞价
        const joinCmd = parseJoinCommand(word);
        if (joinCmd) {
            return this.handleJoinCommand(id, name, joinCmd.query ?? joinCmd.index, joinCmd.bid, eventId, pubMs);
        }

        // 2.5 元帅两权：竞价选攻击目标 / 挑立绘（按资历曾达元帅开启）
        const targetCmd = parseTargetCommand(word);
        if (targetCmd) {
            return this.handleMarshalTarget(id, name, targetCmd.index, targetCmd.bid, eventId, pubMs);
        }
        if (/^目标\s*\S*$/.test(word)) {
            const list = this.marshalTargetList();
            if (list.length === 0) return this.note(`${name}：当前没有可选的敌方目标（要先随军、且身边有敌城）`);
            const lines = list.map((t) => `目标${t.index}${t.name}(${t.factionName})`).join(' ');
            return this.note(`${name}：发「目标编号 出价」选定军团下一个攻击目标（${MARSHAL_TARGET_MIN_BID}分起，整场只准改一次）。${lines}`);
        }
        const portraitCultureCmd = parsePortraitCultureCommand(word);
        if (portraitCultureCmd) {
            return this.handlePortraitCulture(id, name, portraitCultureCmd.index, eventId, pubMs);
        }
        const portraitPickCmd = parsePortraitPickCommand(word);
        if (portraitPickCmd) {
            return this.handlePortraitPick(id, name, portraitPickCmd.index, portraitPickCmd.bid, eventId, pubMs);
        }
        // 2.6 公侯三权（列土封侯·自建三排亲军·战利品收兵模；按资历曾达公侯开启）
        if (word === '兵' || word === '编') {
            return this.note(this.dukeUnitsHint(name));
        }
        const formCmd = parseCustomFormationCommand(word);
        if (formCmd) {
            return this.handleDukeCustomFormation(id, name, formCmd.rows, formCmd.bid, eventId, pubMs);
        }
        const legionNameCmd = parseLegionNameCommand(word);
        if (legionNameCmd) {
            return this.handleDukeLegionName(id, name, legionNameCmd.rawName, legionNameCmd.bid, eventId, pubMs);
        }
        if (word === '军') {
            const need = Math.max(DUKE_LEGION_NAME_MIN_BID, this.dukeLegionNameBid + 1);
            return this.note(`${name}：公侯命名军团写法「军 军团名 积分」（需 ${need} 分起）`);
        }
        const fiefCmd = parseFiefCommand(word);
        if (fiefCmd) {
            return this.handleDukeFief(id, name, fiefCmd.index, fiefCmd.bid, eventId, pubMs);
        }
        if (/^封\s*\S*$/.test(word)) {
            return this.note(this.dukeFiefHint(name));
        }

        // 2.7 国王两权（立国号旗字 ＋ 实力超主公三倍征召武将合军；按资历曾达国王开启）
        const kingdomCmd = parseKingdomNameCommand(word);
        if (kingdomCmd) {
            return this.handleKingFactionName(id, name, kingdomCmd.rawName, kingdomCmd.flagChar, kingdomCmd.bid, eventId, pubMs);
        }
        if (word === '国') {
            const need = Math.max(KING_FACTION_NAME_MIN_BID, this.kingFactionNameBid + 1);
            return this.note(`${name}：国王立国号与旗字写法「国 势力名 旗字 积分」（如「国 大秦 秦 ${need}」，需 ${need} 分起）`);
        }
        const summonCmd = parseSummonGeneralCommand(word);
        if (summonCmd) {
            return this.handleKingSummonGeneral(id, name, summonCmd.index, summonCmd.bid, eventId, pubMs);
        }
        if (/^召\s*\S*$/.test(word)) {
            return this.note(this.kingSummonHint(name));
        }

        // 2.8 皇帝特权（众筹圣旨威压小于己方十倍的接壤弱国臣服并合军；按资历曾达皇帝开启）
        const coerceCmd = parseCoerceFactionCommand(word);
        if (coerceCmd) {
            return this.handleEmperorCoerce(id, name, coerceCmd.index, coerceCmd.amount, eventId, pubMs);
        }
        if (/^威\s*\S*$/.test(word)) {
            return this.note(this.emperorCoerceHint(name));
        }

        if (word === '像' || word === '图') { return this.note(this.portraitHint(name));
        }
        // 4. 战术模式六计释放（固定 1 积分，按观众所属阵营：默认维序者，投过 1 则为乱入者，两边独立队列 FIFO）
        if (!SIX_BY_WORD[word]) return '';
        if (meta?.staleForBattle) {
            this.recordCmd(eventId, id, name, 'skill_six', word, ORDERS_PER_CAST, pubMs, now, 'rejected', '迟到于上一场战斗');
            this.notifyViewerVoice(id, `${name}，上一仗刚结束，未扣积分`, true);
            return this.note(`${name}：上一仗迟到口令已忽略，未扣积分`);
        }
        const blocked = this.playerSixBlockReason(SIX_BY_WORD[word]);
        if (blocked) {
            this.recordCmd(eventId, id, name, 'skill_six', word, ORDERS_PER_CAST, pubMs, now, 'rejected', blocked);
            this.notifyViewerVoice(id, `${name}，${blocked}，未扣积分`);
            return this.note(`${name}：${blocked}`);
        }
        return this.request(id, name, word, eventId, pubMs);
    }

    /** Super Chat 先放一边：只记账和致谢，不放技、不换积分。 */
    public onPayment(uid: string, viewer: string, cents: number, what: string): void {
        const name = cleanViewerName(viewer);
        this.acct(uid, name).seen = Date.now();
        const safeCents = Number.isFinite(cents) && cents > 0 ? Math.floor(cents) : 0;
        if (safeCents > 0) this.credit(uid, name, safeCents);
        this.experimentalSupport = {
            count: this.experimentalSupport.count + 1,
            totalCents: this.experimentalSupport.totalCents + safeCents,
            lastDonor: name,
            lastWhat: what,
        };
        this.save();
        this.note(`感谢 ${name} 的 ${what}`);
    }

    /** 官方事件幂等入口：付款只记账，并对跨场迟到的战术口令做场次隔离。 */
    public handleYouTubeEvent(event: YouTubeLiveEvent): void {
        if (!event.id || this.handled.has(event.id)) return;
        // 聊天机器人（Nightbot 定时发玩法）不是观众：不算在场、不发分、不认口令
        if (isChatBot(event.viewer)) {
            this.handled.add(event.id);
            return;
        }
        this.syncBattleLifecycle();
        const name = cleanViewerName(event.viewer);
        if (event.payment) {
            const cents = youTubePaymentCents(event.payment);
            this.onPayment(event.uid, name, cents, `${event.payment.kind} ${event.payment.display}`.trim());
        }
        const pubMs = Date.parse(event.publishedAt);
        const staleForBattle = this.battleOn()
            && Number.isFinite(pubMs)
            && this.lastBattleEndedAtMs > 0
            && pubMs < this.lastBattleEndedAtMs - STALE_BATTLE_CHAT_GRACE_MS;
        if (event.text) {
            this.onChat(name, event.text, false, event.uid, {
                eventId: event.id,
                publishedAtMs: Number.isFinite(pubMs) ? pubMs : Date.now(),
                staleForBattle,
            });
        }
        this.handled.add(event.id);
        if (this.handled.size > HANDLED_CAP) this.handled = new Set([...this.handled].slice(-HANDLED_CAP));
        this.save();
    }

    public onViewers(n: number): void {
        if (!Number.isFinite(n) || n < 0) return;
        const total = Math.floor(n);
        const prevViewers = this.viewers;
        this.viewers = total;
        // 在线人数涨了＝有人进来 → 画面弹「怎么玩」（首次读数只记底，不弹）
        if (this.viewerPeak >= 0 && total > prevViewers) this.onNewcomer?.();
        if (this.viewerPeak < 0) {
            this.viewerPeak = total;
            this.viewerPeakMilestone = viewerPeakMilestone(total);
            return;
        }
        if (total <= this.viewerPeak) return;
        this.viewerPeak = total;
        const nextMilestone = viewerPeakMilestone(total);
        if (nextMilestone <= this.viewerPeakMilestone || nextMilestone <= 0) return;
        this.viewerPeakMilestone = nextMilestone;
        const k = this.grantPresent(1);
        this.note(`本场在线人数突破 ${nextMilestone}（新高 ${total}）！在场 ${k} 人各 +1 积分`);
    }

    public onLikeTotal(total: number): void {
        if (!Number.isFinite(total) || total < 0) return;
        this.likeTotal = total;
        if (this.likeMax < 0) { this.likeMax = total; return; }
        if (total <= this.likeMax) return;
        const d = total - this.likeMax;
        this.likeMax = total;
        this.addLikes(d);
    }

    public onSubTotal(total: number): void {
        if (!Number.isFinite(total) || total < 0) return;
        this.subTotal = total;
        if (this.subMax < 0) { this.subMax = total; return; }
        if (total <= this.subMax) return;
        const d = total - this.subMax;
        this.subMax = total;
        const each = Math.min(d, GOAL_BONUS_MAX) * SUB_BONUS;
        const k = this.grantPresent(each);
        this.note(`订阅涨到 ${total}！在场 ${k} 人各 +${each} 积分`);
        speechAnnouncer.announceViewerThanks(`感谢新入营的将士，在场每人加${CN_NUM[each] ?? each}积分`);
    }

    public resetGoals(): void {
        this.likeMax = -1;
        this.subMax = -1;
        this.viewerPeak = -1;
        this.viewerPeakMilestone = 0;
        this.likeProg = 0;
        this.likeTotal = 0;
    }

    public pricePerCast(): number { return PRICE_PER_CAST; }

    /**
     * 改名要压过的价：画面上挂的还是观众买的那个名字，才要比它出得高；
     * 新开一局（刷新页面主角名回到默认）、主播手动改名或否决后，名字已不是买来的，从 1 分起。
     * 🔴 [2026-10-29 主人「本局没人改名，改名成了 2 分」] 原先最高价按天存在账本里，刷新开新局也不清。
     */
    private renameFloor(): number {
        return this.hasActiveViewerRename() ? this.renameHighestBid : 0;
    }

    /** 当前是否存在可由主播一键否决的观众竞拍改名 */
    public hasActiveViewerRename(): boolean {
        const top = this.renameHistory[this.renameHistory.length - 1];
        if (!top) return false;
        const curName = this.app.playerHero?.name;
        return !curName || curName === top.appliedName;
    }

    /**
     * 主播一键否决违规改名：立即撤下画面上的违规名、封禁该词、回退最高价。
     * 🔴 [2026-10-27] 出价的积分不退（原先全额退回）：恶意改名只亏不赚，才不会反复来试。
     */
    public vetoPlayerName(): string {
        const top = this.renameHistory.pop();
        if (!top) return '当前没有观众竞拍改名记录';
        blockLiveName(top.appliedName);
        const fallbackName = this.renameHistory.length > 0
            ? this.renameHistory[this.renameHistory.length - 1].appliedName
            : (top.prevName || PLAYER_HERO_NAME);
        this.renameHighestBid = this.renameHistory.length > 0
            ? this.renameHistory[this.renameHistory.length - 1].bid
            : 0;
        this.app.playerHero?.rename(fallbackName);
        this.save();
        const msg = `已否决违规名「${top.appliedName}」，恢复为「${fallbackName}」，${top.viewer} 出的 ${top.bid} 积分不退`;
        this.note(msg);
        return msg;
    }

    /** PlayerQuestSystem 入伍或选主失效回调：成功入伍即结算（保留本局最高投靠竞价），目标失效则原数退回观众积分并回退竞价 */
    public onJoinResolved(res: { ok: boolean; factionId: string | null; generalId: string | null; reason?: string }): void {
        const cur = this.activeJoinBid;
        if (!cur) return;
        this.activeJoinBid = null;
        if (res.ok) {
            this.joinHighestBid = Math.max(this.joinHighestBid, cur.bid);
            this.joinLastLabel = cur.label;
            this.note(`${cur.viewer} 竞选的【${cur.label}】已成功投效`);
        } else {
            this.joinHighestBid = this.prevJoinHighestBid;
            const a = this.acct(cur.uid, cur.viewer);
            a.n = Math.min(ORDER_CAP, a.n + cur.bid);
            this.note(`${cur.viewer} 竞选的【${cur.label}】未能成行（${res.reason || '目标变动'}），${cur.bid} 积分已退回`);
        }
        this.save();
    }

    public snapshot(): {
        on: boolean; names: [string, string]; counts: [number, number];
        queue: string[]; log: string[]; price: number; platform: string;
        goal: { likes: number; likeProg: number; likeStep: number; subs: number; viewers: number; present: number };
        top: { name: string; n: number }[];
        yt: string;
        lastChatAgo: number;
        queueBrief: { name: string; paid: boolean; label?: string }[];
        renameHighestBid: number;
        hasViewerRename: boolean;
        joinCandidates: { index: number; label: string; kind: 'faction' | 'general' }[];
        /** 这一阶离队后能选的范围（面板标题用）：斥候同文化势力 / 探马同文化武将 / 先锋任一势力 / 将军起任一武将 */
        joinScope: string;
        activeJoinBid: ViewerActiveJoinBid | null;
        joinHighestBid: number;
        joinLastLabel: string;
        experimental: ExperimentalSupportStats;
        /** 主角现在的官职、资历（离队后选去处按它）、是否随军、离队停留倒计时秒数 —— 面板据此写「现在能做什么」 */
        hero: { rankId: string; rankTitle: string; peakRankId: string; peakRankTitle: string; attached: boolean; holdSec: number };
        /** 元帅两权（2026-11-07 主人令）：按资历曾达元帅开启；目标竞价、立绘两段候选 */
        marshal: {
            unlocked: boolean;
            targets: { index: number; name: string; factionName: string }[];
            targetBid: number;
            targetLabel: string;
            targetLocked: boolean;
            cultureList: { index: number; culture: string; count: number }[];
            pool: string[];
            culture: string | null;
            pickBid: number;
            pickIndex: number;
        };
        /** 公侯（第7阶）：三排亲军编成、亲军命名、择城封侯 */
        duke: {
            unlocked: boolean;
            units: { index: number; unitKey: string; unitName: string }[];
            customRows: [string, string, string] | null;
            formationBid: number;
            legionName: string;
            legionNameBid: number;
            fiefCityName: string;
            fiefBid: number;
            fiefCandidates: { index: number; name: string; factionName: string; troops: number }[];
        };
        /** 国王（第8阶）：立国号旗字、据点兵力逾主公3倍征召本国名将合军 */
        king: {
            unlocked: boolean;
            factionName: string;
            flagChar: string;
            factionNameBid: number;
            threeTimesOk: boolean;
            threeTimesText: string;
            summonCandidates: { index: number; generalName: string; troops: number; cityName: string }[];
            summonBid: number;
            mergedCount: number;
        };
        /** 皇帝（第9阶）：众筹圣旨威压接壤且弱于自己10倍的势力臣服合军 */
        emperor: {
            unlocked: boolean;
            cooldownSec: number;
            coerceCandidates: { index: number; factionId: string; factionName: string; cities: number; troops: number }[];
            activePool: { factionName: string; totalPoints: number; targetPoints: number } | null;
        };
        /** 战术模式 9 秒选阵/押注状态（乱入者 VS 维序者 / 平局） */
        bet: {
            open: boolean;
            remainSec: number;
            stakes: [number, number, number];
        };
        _marshalDummy?: {
            _unused?: number;
        };
    } {
        // 排行只排在场的人（10 分钟内说过话）：不让几天前来过的人一直占着榜
        const presentCut = Date.now() - PRESENT_MS;
        const top = [...this.orders.values()]
            .filter((a) => a.seen > presentCut && (a.n > 0 || a.lastEarn > 0))
            .sort((x, y) => (y.n - x.n) || (y.lastEarn - x.lastEarn))
            .slice(0, 6)
            .map((a) => ({ name: a.name, n: a.n }));
        const pSide: 0 | 1 = this.playerSideInBattle() ?? 0;
        const kSide: 0 | 1 = (1 - pSide) as 0 | 1;
        let a = 0, d = 0;
        const countIds = new Set<string>(this.presentIds().map(([id]) => id));
        for (const id of this.sides.keys()) countIds.add(id);
        for (const id of countIds) {
            if (this.viewerCampChoice(id) === '1') a++;
            else d++;
        }
        const joinCandidates = (this.app.playerQuests?.getLiveJoinCandidates?.() ?? [])
            .map((c) => ({ index: c.index, label: c.label, kind: c.kind }));
        const rankId = this.app.playerHero?.getPeakRank().id;
        const joinScope = rankId === 'scout' ? '同文化势力（武将随机）'
            : rankId === 'outrider' ? '同文化武将（指定）'
                : rankId === 'vanguard' ? '同文化武将（指定）＋全部势力（武将随机）'
                    : '全图武将（指定）';
        const deployRem = Math.ceil(this.war()?.getDeployRemainingSec?.() ?? 0);
        return {
            on: this.battleOn(),
            names: [this.sideName(pSide), this.sideName(kSide)],
            counts: [a, d],
            queue: [
                ...this.queue.map((q) => `${q.viewer} 【${q.word}】 ${ORDERS_PER_CAST}分`),
            ],
            log: [...this.log],
            price: PRICE_PER_CAST,
            platform: this.platformStatus,
            goal: {
                likes: this.likeTotal, likeProg: this.likeProg, likeStep: this.likeStep(),
                subs: this.subTotal, viewers: this.viewers, present: this.presentIds().length,
            },
            top,
            yt: this.ytStatus,
            lastChatAgo: this.lastChatAt > 0 ? Math.floor((Date.now() - this.lastChatAt) / 1000) : -1,
            queueBrief: [
                ...this.queue.map((q) => ({ name: q.viewer, paid: false, label: q.word })),
            ],
            renameHighestBid: this.renameFloor(),
            hasViewerRename: this.hasActiveViewerRename(),
            joinCandidates,
            joinScope,
            activeJoinBid: this.activeJoinBid ? { ...this.activeJoinBid } : null,
            joinHighestBid: Math.max(this.joinHighestBid, this.activeJoinBid?.bid ?? 0),
            joinLastLabel: this.activeJoinBid?.label || this.joinLastLabel,
            experimental: { ...this.experimentalSupport },
            hero: {
                rankId: this.app.playerHero?.getRank().id ?? 'civilian',
                rankTitle: this.app.playerHero?.getRank().title ?? '平民',
                peakRankId: rankId ?? 'civilian',
                peakRankTitle: this.app.playerHero?.getPeakRank().title ?? '平民',
                attached: this.app.playerHero?.isAttached() ?? false,
                holdSec: this.app.playerHero?.getHoldRemainingSec?.() ?? 0,
            },
            marshal: {
                unlocked: this.marshalUnlocked(),
                // 🔴 [2026-11-09 主人令] 选攻击目标只在战略地图显示；战术模式不显示目标面板，候选也不必每帧排序
                targets: this.marshalUnlocked() && !this.battleOn()
                    ? this.marshalTargetList().map((t) => ({ index: t.index, name: t.name, factionName: t.factionName }))
                    : [],
                targetBid: this.marshalTarget?.bid ?? 0,
                targetLabel: this.marshalTarget?.cityName ?? '',
                targetLocked: this.marshalTargetLocked(),
                cultureList: this.marshalUnlocked()
                    ? this.portraitCultureList().map((c) => ({ index: c.index, culture: c.culture, count: c.count }))
                    : [],
                pool: [...this.portraitPool],
                culture: this.portraitCulture,
                pickBid: this.portraitPicked?.bid ?? 0,
                pickIndex: this.portraitPicked?.index ?? 0,
            },
            duke: {
                unlocked: this.dukeUnlocked(),
                units: (this.app.playerHero?.learnedUnits ?? []).map((u, i) => ({ index: i + 1, unitKey: u.unitKey, unitName: u.unitName })),
                customRows: this.app.playerHero?.customRowUnits ? [...this.app.playerHero.customRowUnits] : null,
                formationBid: this.dukeFormationPicked?.bid ?? 0,
                legionName: this.app.playerHero?.customLegionName ?? '',
                legionNameBid: this.dukeLegionNameBid,
                fiefCityName: (this.app.playerHero?.fiefCityId && this.app.cityManager?.getCity(this.app.playerHero.fiefCityId)?.name) || this.dukeFiefPicked?.cityName || '',
                fiefBid: this.dukeFiefPicked?.bid ?? 0,
                fiefCandidates: this.dukeUnlocked()
                    ? this.dukeFiefCandidates().map((c) => ({ index: c.index, name: c.name, factionName: c.factionName, troops: c.troops }))
                    : [],
            },
            king: (() => {
                const three = this.checkKingThreeTimesLiege();
                return {
                    unlocked: this.kingUnlocked(),
                    factionName: this.app.playerHero?.ownFactionName || '',
                    flagChar: this.app.playerHero?.ownFlagChar || '',
                    factionNameBid: this.kingFactionNameBid,
                    threeTimesOk: three.ok,
                    threeTimesText: three.text,
                    summonCandidates: this.kingUnlocked() && three.ok
                        ? this.kingSummonCandidates().map((g) => ({ index: g.index, generalName: g.generalName, troops: g.troops, cityName: g.cityName }))
                        : [],
                    summonBid: this.kingSummonPicked?.bid ?? 0,
                    mergedCount: this.app.playerHero?.mergedGenerals?.length ?? 0,
                };
            })(),
            emperor: {
                unlocked: this.emperorUnlocked(),
                cooldownSec: this.lastCoerceSuccessAt > 0
                    ? Math.max(0, Math.ceil((this.lastCoerceSuccessAt + EMPEROR_COERCE_COOLDOWN_MS - Date.now()) / 1000))
                    : 0,
                coerceCandidates: this.emperorUnlocked()
                    ? this.emperorCoerceCandidates().map((f) => ({ index: f.index, factionId: f.factionId, factionName: f.factionName, cities: f.cities, troops: f.troops }))
                    : [],
                activePool: this.emperorCoercePool
                    ? { factionName: this.emperorCoercePool.factionName, totalPoints: this.emperorCoercePool.total, targetPoints: EMPEROR_COERCE_TARGET_POINTS }
                    : null,
            },
            bet: {
                open: this.betOpen,
                remainSec: deployRem,
                stakes: [...this.betStakes] as [number, number, number],
            },
            _marshalDummy: {
                _unused: 0,
            },
        };
    }

    /**
     * 🔴 [2026-11-09 主人令「做点名语音」] 观众本场第一次参战（放计、押注、选阵营）时，晓晓念一句他的名字。
     *    只念第一次，之后照旧只走底栏文字；排在技能播报队列里，不与战况播报叠在一起。
     */
    private greetFirstJoin(uid: string, name: string, choice: '1' | '2', sixWord?: string): void {
        if (this.greetedThisSession.has(uid)) return;
        this.greetedThisSession.add(uid);
        const camp = choice === '1' ? '乱入者' : '维序者';
        const plot = sixWord ? SIX_FULL_NAME[sixWord.slice(0, 1)] : undefined;
        speechAnnouncer.announceViewerNotice(plot ? `欢迎${name}加入${camp}，施展${plot}` : `欢迎${name}加入${camp}`);
    }

    private notifyViewerVoice(uid: string, text: string, force = false): void {
        // 仅保留战略地图高价值竞价成交感谢语音（改名/选将/高阶竞价成交），日常口令回执、报错、查分、排队全部只走底栏文字，不播女声
        if (!text.startsWith('感谢') && !text.startsWith('天子诏书达成')) return;
        const now = Date.now();
        if (!force) {
            const prev = this.lastVoiceNoticeAt.get(uid) ?? 0;
            if (now - prev < VIEWER_VOICE_NOTICE_GAP_MS) return;
        }
        this.lastVoiceNoticeAt.set(uid, now);
        speechAnnouncer.announceViewerNotice(text);
    }

    /** 统计该观众已在队列中排队、尚未扣分的预留积分（避免连点刷队列超支，同时保证没放出前不扣账面积分） */
    private reservedOrders(uid: string): number {
        let sum = 0;
        for (const q of this.queue) {
            if (q.uid === uid && !q.paid && q.deducted === false) sum += ORDERS_PER_CAST;
        }
        return sum;
    }

    private handleRenameCommand(id: string, name: string, rawNewName: string, explicitBid: number | null, eventId: string, pubMs: number): string {
        const now = Date.now();
        const hero = this.app.playerHero;
        if (!hero) return this.note(`${name}：玩家尚未就绪`);
        const floor = this.renameFloor();
        const need = floor + 1;
        const bid = explicitBid ?? need;
        if (bid < need) {
            this.recordCmd(eventId, id, name, 'rename', rawNewName, bid, pubMs, now, 'rejected', `低于最低竞价${need}`);
            this.notifyViewerVoice(id, `${name}，改名至少需要${need}积分`);
            return this.note(`${name}：现在的名字是出 ${floor} 积分买的，需出 ${need} 积分以上`);
        }
        if (bid > MAX_SKILL_BID) {
            return this.note(`${name}：单次出价上限为 ${MAX_SKILL_BID} 积分`);
        }
        const mod = moderateLiveName(rawNewName);
        if (!mod.ok) {
            // 违规名字前置拦截：绝不上屏白嫖，也不扣观众积分（若已预扣则等价原数退回）
            this.recordCmd(eventId, id, name, 'rename', rawNewName, bid, pubMs, now, 'rejected', mod.reason);
            this.notifyViewerVoice(id, `${name}，名字不合规范，未扣积分`);
            return this.note(`${name}：${mod.reason}（未扣积分）`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < bid) {
            this.recordCmd(eventId, id, name, 'rename', mod.name, bid, pubMs, now, 'rejected', '积分不足');
            this.notifyViewerVoice(id, `${name}，改名需要${bid}积分，你现有${avail}积分`);
            return this.note(`${name}：改名需 ${bid} 积分，现有积分 ${avail}/${bid}`);
        }
        const prevName = hero.name;
        a.n -= bid;
        this.renameHighestBid = bid;
        this.renameHistory.push({ uid: id, viewer: name, bid, prevName, appliedName: mod.name, at: now });
        if (this.renameHistory.length > 50) this.renameHistory.shift();
        hero.rename(mod.name, name);
        this.recordCmd(eventId, id, name, 'rename', mod.name, bid, pubMs, now, 'executed');
        this.save();
        this.notifyViewerVoice(id, `感谢${name}，主角改名为${mod.name}`, true);
        return this.note(`${name} 出 ${bid} 积分，将玩家改名为「${mod.name}」（下次改名需 ${bid + 1} 分起）`);
    }

    private handleJoinCommand(id: string, name: string, target: number | string, explicitBid: number | null, eventId: string, pubMs: number): string {
        const now = Date.now();
        const quests = this.app.playerQuests;
        const hero = this.app.playerHero;
        if (!quests || !hero) return this.note(`${name}：当前尚无法选择投靠目标`);
        if (this.battleOn()) {
            this.recordCmd(eventId, id, name, 'join_choice', String(target), explicitBid ?? 0, pubMs, now, 'rejected', '战斗进行中');
            this.notifyViewerVoice(id, `${name}，正在打仗中，战后再选投奔目标`);
            return this.note(`${name}：正在交战中，脱离势力回到战略地图后再选投靠`);
        }
        const curFloor = Math.max(this.joinHighestBid, this.activeJoinBid?.bid ?? 0);
        const minNeed = curFloor + 1;
        const bid = explicitBid ?? minNeed;
        if (bid < minNeed) {
            const curLabel = this.activeJoinBid?.label || this.joinLastLabel || '上一目标';
            this.recordCmd(eventId, id, name, 'join_choice', String(target), bid, pubMs, now, 'rejected', `需出${minNeed}分以上`);
            this.notifyViewerVoice(id, `${name}，当前投奔竞价已到${curFloor}分，改选至少需要${minNeed}积分`);
            return this.note(`${name}：当前已有人出 ${curFloor} 积分选【${curLabel}】，改选需 ${minNeed} 积分以上`);
        }
        if (bid > MAX_SKILL_BID) {
            return this.note(`${name}：单次出价上限为 ${MAX_SKILL_BID} 积分`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < bid) {
            this.recordCmd(eventId, id, name, 'join_choice', String(target), bid, pubMs, now, 'rejected', '积分不足');
            this.notifyViewerVoice(id, `${name}，选将需要${bid}积分，你现有${avail}积分`);
            return this.note(`${name}：选目标需 ${bid} 积分，现有积分 ${avail}/${bid}`);
        }
        const prev = this.activeJoinBid;
        this.prevJoinHighestBid = this.joinHighestBid;
        this.joinHighestBid = bid;
        const applied = quests.applyLiveJoinChoice(target);
        if (!applied.ok) {
            this.joinHighestBid = this.prevJoinHighestBid;
            this.recordCmd(eventId, id, name, 'join_choice', String(target), bid, pubMs, now, 'rejected', applied.reason);
            this.notifyViewerVoice(id, `${name}，${applied.reason}`);
            return this.note(`${name}：${applied.reason}`);
        }
        // 反超尚未入伍的上一位出价者时，当场原数退回上一位积分
        if (prev) {
            const prevAcct = this.acct(prev.uid, prev.viewer);
            prevAcct.n = Math.min(ORDER_CAP, prevAcct.n + prev.bid);
        }
        a.n -= bid;
        this.joinLastLabel = applied.candidate.label;
        if (!hero.isAttached()) {
            this.activeJoinBid = {
                uid: id,
                viewer: name,
                bid,
                index: applied.candidate.index,
                targetId: applied.candidate.id,
                label: applied.candidate.label,
            };
        }
        this.recordCmd(eventId, id, name, 'join_choice', applied.candidate.id, bid, pubMs, now, 'executed');
        this.save();
        const destCity = applied.candidate.cityName;
        const destVoice = destCity ? `，目标${destCity}` : '';
        // 🔴 [2026-11-07 主人令] 选势力＝随机点名武将：播报写清点到了谁，观众才知道自己花的分变成了什么
        const pickedGeneral = applied.candidate.randomPick && applied.candidate.generalName
            ? `·${applied.candidate.generalName}`
            : '';
        const head = `${applied.candidate.label}${pickedGeneral}`;
        this.notifyViewerVoice(id, `感谢${name}出${bid}积分，投奔${head}${destVoice}`, true);
        const refundNote = prev ? `（已退回 ${prev.viewer} 的 ${prev.bid} 积分）` : '';
        const randomNote = applied.candidate.randomPick ? '（势力内武将随机点名）' : '';
        return this.note(`${name} 出 ${bid} 积分，投奔【${head}】${destCity ? `，目标【${destCity}】` : ''}${randomNote}（下次改投需 ${bid + 1} 分起）${refundNote}`);
    }

    // ── 元帅两权（2026-11-07 主人令）：按**资历曾达元帅**开启 ──────────────
    /** 资历是否已达元帅（不要求当前就是元帅：官职本身就按资历走） */
    public marshalUnlocked(): boolean {
        const id = this.app.playerHero?.getPeakRank().id;
        if (!id) return false;
        const idx = PLAYER_RANKS.findIndex((r) => r.id === id);
        const need = PLAYER_RANKS.findIndex((r) => r.id === 'marshal');
        return need >= 0 && idx >= need;
    }

    private haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
        const R = 6371;
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLng = (b.lng - a.lng) * Math.PI / 180;
        const s = Math.sin(dLat / 2) ** 2
            + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
    }

    /** 军团下一个可选的攻击目标：离主角所在军团最近的敌方据点（最多 8 个） */
    public marshalTargetList(): Array<{ index: number; cityId: string; name: string; factionName: string; distKm: number; troops: number }> {
        const hero = this.app.playerHero;
        const cm = this.app.cityManager;
        if (!hero || !cm) return [];
        const army = hero.getHostLegion();
        const pos = army ? army.getPosition() : hero.getPosition();
        if (!pos || !Number.isFinite(pos.lat)) return [];
        const myFaction = (army?.getFactionId?.() || hero.factionId || '') as string;
        const out: Array<{ index: number; cityId: string; name: string; factionName: string; distKm: number; troops: number }> = [];
        for (const c of cm.getCities()) {
            if (!c.factionId || c.factionId === myFaction) continue;
            out.push({
                index: 0,
                cityId: c.id,
                name: c.name,
                factionName: cm.getFactionName(c.factionId) || c.factionId,
                distKm: Math.round(this.haversineKm(pos, { lat: c.latitude, lng: c.longitude })),
                troops: Math.floor(c.troops || 0),
            });
        }
        out.sort((a, b) => a.distKm - b.distKm);
        return out.slice(0, 8).map((t, i) => ({ ...t, index: i + 1 }));
    }

    /** 一个 67 文化的地质心（该文化全部据点的经纬度均值）——「相近文化」按它排距离 */
    private cultureCentroidCache = new Map<string, { lat: number; lng: number } | null>();
    private cultureCentroid(culture: string): { lat: number; lng: number } | null {
        const cached = this.cultureCentroidCache.get(culture);
        if (cached !== undefined) return cached;
        const cm = this.app.cityManager;
        let n = 0, lat = 0, lng = 0;
        if (cm) {
            for (const c of cm.getCities()) {
                if (style62OfCity(c) !== culture) continue;
                if (!Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) continue;
                lat += c.latitude; lng += c.longitude; n++;
            }
        }
        const out = n > 0 ? { lat: lat / n, lng: lng / n } : null;
        this.cultureCentroidCache.set(culture, out);
        return out;
    }

    /** 可选文化：离主角所在文化最近的、有立绘夹的文化（当前文化固定第 1 号） */
    public portraitCultureList(): Array<{ index: number; culture: string; count: number; distKm: number }> {
        const hero = this.app.playerHero;
        const keys = Object.keys(CULTURE66_PORTRAIT_POOLS)
            .filter((k) => (CULTURE66_PORTRAIT_POOLS[k]?.length ?? 0) > 0);
        const here = hero?.getPosition() ?? null;
        const homeCulture = this.currentCultureOfHero();
        const scored = keys.map((k) => {
            const c = this.cultureCentroid(k);
            const distKm = here && c ? this.haversineKm(here, c) : Infinity;
            return { culture: k, count: CULTURE66_PORTRAIT_POOLS[k].length, distKm: Math.round(distKm) };
        });
        scored.sort((a, b) => {
            if (homeCulture) {
                const aHome = a.culture === homeCulture ? 0 : 1;
                const bHome = b.culture === homeCulture ? 0 : 1;
                if (aHome !== bHome) return aHome - bHome;
            }
            return a.distKm - b.distKm;
        });
        return scored.slice(0, 9).map((s, i) => ({ index: i + 1, ...s }));
    }

    /** 主角现在所在据点的文化（随军看军团的出发城；否则看最近的据点） */
    private currentCultureOfHero(): string | null {
        const hero = this.app.playerHero;
        const cm = this.app.cityManager;
        if (!hero || !cm) return null;
        const pos = hero.getPosition();
        if (!pos || !Number.isFinite(pos.lat)) return null;
        let best: { c: string; d: number } | null = null;
        for (const city of cm.getCities()) {
            const ck = style62OfCity(city);
            if (!ck) continue;
            const d = this.haversineKm(pos, { lat: city.latitude, lng: city.longitude });
            if (!best || d < best.d) best = { c: ck, d };
        }
        return best?.c ?? null;
    }

    /**
     * 该文化的 10 张立绘：本文化先给；**不足 10 张就从相近文化补**（按文化质心地理距离由近到远，
     * 张数够的整批补），凑满 10 为止。现存唯一必须跨很远的一例：THRACIAN 7 张 → 借最近的有图文化。
     */
    public portraitPoolFor(culture: string): string[] {
        const shuffle = (arr: string[]): string[] => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };
        const out = shuffle([...(CULTURE66_PORTRAIT_POOLS[culture] ?? [])]).slice(0, MARSHAL_PORTRAIT_SLOTS);
        if (out.length >= MARSHAL_PORTRAIT_SLOTS) return out;
        const mine = this.cultureCentroid(culture);
        const others = Object.keys(CULTURE66_PORTRAIT_POOLS)
            .filter((k) => k !== culture && (CULTURE66_PORTRAIT_POOLS[k]?.length ?? 0) > 0)
            .map((k) => {
                const c = this.cultureCentroid(k);
                return { k, d: mine && c ? this.haversineKm(mine, c) : Infinity };
            })
            .sort((a, b) => a.d - b.d);
        for (const { k } of others) {
            if (out.length >= MARSHAL_PORTRAIT_SLOTS) break;
            for (const p of shuffle([...(CULTURE66_PORTRAIT_POOLS[k] ?? [])])) {
                if (out.length >= MARSHAL_PORTRAIT_SLOTS) break;
                if (!out.includes(p)) out.push(p);
            }
        }
        return out;
    }

    private portraitHint(name: string): string {
        if (!this.marshalUnlocked()) return `${name}：挑立绘要资历达到元帅才开放`;
        const cultures = this.portraitCultureList();
        if (cultures.length === 0) return `${name}：没有可用的立绘池`;
        if (this.portraitPool.length === 0) {
            const list = cultures.map((c) => `像${c.index}${c.culture}(${c.count}张)`).join(' ');
            return `${name}：先选文化（不花钱）「像编号」，可选：${list}`;
        }
        const list = this.portraitPool.map((p, i) => `图${i + 1}`).join(' ');
        return `${name}：文化【${this.portraitCulture}】候选已出，发「图编号 出价」挑一张（${MARSHAL_PORTRAIT_MIN_BID}分起，高价先得）。${list}`;
    }

    /** 第一步：选文化（不花钱，先到先改），当场由系统凑出 10 张候选 */
    private handlePortraitCulture(id: string, name: string, index: number, eventId: string, pubMs: number): string {
        const now = Date.now();
        if (!this.marshalUnlocked()) {
            this.recordCmd(eventId, id, name, 'pick_portrait', `像${index}`, 0, pubMs, now, 'rejected', '资历未达元帅');
            return this.note(`${name}：挑立绘要资历达到元帅才开放`);
        }
        // 本局已经成交过一张 → 候选池冻结：不许用 0 分的「像N」把别人正在看、正在出价的池子刷掉
        if (this.portraitPicked) {
            this.recordCmd(eventId, id, name, 'pick_portrait', `像${index}`, 0, pubMs, now, 'rejected', '立绘已定，候选池冻结');
            return this.note(`${name}：本局的立绘已经定过，候选池冻结。要换就发「图编号 出价」（当前 ${this.portraitPicked.bid} 分，出更高价可改）`);
        }
        // 刚抽出 10 张候选但还没人买图的保护期内，也不许用 0 分刷掉别人正在挑的图
        if (this.portraitPool.length > 0 && now - this.portraitPoolAt < MARSHAL_PORTRAIT_CULTURE_HOLD_MS) {
            const leftSec = Math.ceil((MARSHAL_PORTRAIT_CULTURE_HOLD_MS - (now - this.portraitPoolAt)) / 1000);
            this.recordCmd(eventId, id, name, 'pick_portrait', `像${index}`, 0, pubMs, now, 'rejected', '选图保护期中');
            return this.note(`${name}：文化【${this.portraitCulture}】10 张候选正在选图中（${leftSec}秒内无人出价才可换文化），直接发「图编号 出价」挑一张`);
        }
        const list = this.portraitCultureList();
        const hit = list.find((c) => c.index === index);
        if (!hit) {
            this.recordCmd(eventId, id, name, 'pick_portrait', `像${index}`, 0, pubMs, now, 'rejected', '文化编号不存在');
            return this.note(`${name}：没有这个文化编号，发「像」看可选：${list.map((c) => `像${c.index}${c.culture}`).join(' ')}`);
        }
        this.portraitCulture = hit.culture;
        this.portraitPool = this.portraitPoolFor(hit.culture);
        this.portraitPoolAt = now;
        this.recordCmd(eventId, id, name, 'pick_portrait', `像${index}${hit.culture}`, 0, pubMs, now, 'executed');
        const note = this.portraitPool.length >= MARSHAL_PORTRAIT_SLOTS
            ? `（本文化 ${hit.count} 张，取 10 张）`
            : `（本文化只有 ${hit.count} 张，已从相近文化补齐到 ${this.portraitPool.length} 张）`;
        return this.note(`${name} 选了文化【${hit.culture}】${note}：发「图编号 出价」挑立绘，${MARSHAL_PORTRAIT_MIN_BID}分起`);
    }

    /** 第二步：从 10 张里挑一张（竞价，高价先得，被改者原数退回） */
    private handlePortraitPick(id: string, name: string, index: number, bidRaw: number | null, eventId: string, pubMs: number): string {
        const now = Date.now();
        if (!this.marshalUnlocked()) {
            this.recordCmd(eventId, id, name, 'pick_portrait', `图${index}`, 0, pubMs, now, 'rejected', '资历未达元帅');
            return this.note(`${name}：挑立绘要资历达到元帅才开放`);
        }
        if (!this.portraitCulture || this.portraitPool.length === 0) {
            this.recordCmd(eventId, id, name, 'pick_portrait', `图${index}`, 0, pubMs, now, 'rejected', '还没选文化'); return this.note(this.portraitHint(name));
        }
        if (false) {
            return this.note(this.portraitHint(name));
        }
        if (false) {
        }
        const path = this.portraitPool[index - 1];
        if (!path) {
            this.recordCmd(eventId, id, name, 'pick_portrait', `图${index}`, 0, pubMs, now, 'rejected', '候选编号不存在');
            return this.note(`${name}：候选只有 1~${this.portraitPool.length} 号`);
        }
        const floor = Math.max(MARSHAL_PORTRAIT_MIN_BID, (this.portraitPicked?.bid ?? 0) + 1);
        const bid = bidRaw ?? floor;
        if (bid < floor) {
            this.recordCmd(eventId, id, name, 'pick_portrait', `图${index}`, bid, pubMs, now, 'rejected', `需出${floor}分以上`);
            return this.note(`${name}：当前立绘竞价已到 ${floor - 1} 分，改选需 ${floor} 分以上`);
        }
        if (bid > MARSHAL_PORTRAIT_MAX_BID) {
            return this.note(`${name}：挑立绘单次上限 ${MARSHAL_PORTRAIT_MAX_BID} 分`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < bid) {
            this.recordCmd(eventId, id, name, 'pick_portrait', `图${index}`, bid, pubMs, now, 'rejected', '积分不足');
            return this.note(`${name}：挑立绘需 ${bid} 积分，现有 ${avail}/${bid}`);
        }
        const prev = this.portraitPicked;
        if (prev) {
            const pa = this.acct(prev.uid, prev.viewer);
            pa.n = Math.min(ORDER_CAP, pa.n + prev.bid);
        }
        a.n -= bid;
        this.portraitPicked = { uid: id, viewer: name, bid, index, path, culture: this.portraitCulture };
        this.app.playerHero?.setLivePortrait?.(path);
        this.recordCmd(eventId, id, name, 'pick_portrait', `图${index}`, bid, pubMs, now, 'executed');
        this.save();
        const refund = prev ? `（已退回 ${prev.viewer} 的 ${prev.bid} 积分）` : '';
        this.notifyViewerVoice(id, `感谢${name}出${bid}积分，为主角选定了【${this.portraitCulture}】文化立绘`, true);
        return this.note(`${name} 出 ${bid} 积分，主角立绘换成【${this.portraitCulture}】第 ${index} 张${refund}`);
    }

    /** 竞价选攻击目标：先到起价，高价可改（被改者原数退回）；军团锁定后本场不再受理 */
    private handleMarshalTarget(id: string, name: string, index: number, bidRaw: number | null, eventId: string, pubMs: number): string {
        const now = Date.now();
        if (!this.marshalUnlocked()) {
            this.recordCmd(eventId, id, name, 'pick_target', `目标${index}`, 0, pubMs, now, 'rejected', '资历未达元帅');
            return this.note(`${name}：选攻击目标要资历达到元帅才开放`);
        }
        if (this.battleOn()) {
            this.recordCmd(eventId, id, name, 'pick_target', `目标${index}`, 0, pubMs, now, 'rejected', '战斗进行中');
            return this.note(`${name}：正在打仗，打完再选下一个攻击目标`);
        }
        const armyId = this.app.playerHero?.getHostLegionId?.() ?? null;
        if (!armyId) {
            this.recordCmd(eventId, id, name, 'pick_target', `目标${index}`, 0, pubMs, now, 'rejected', '主角未随军');
            return this.note(`${name}：要主角随军（在某支军团里）才能指定攻击目标`);
        }
        if (this.marshalTargetLocked()) {
            this.recordCmd(eventId, id, name, 'pick_target', `目标${index}`, 0, pubMs, now, 'rejected', '本场目标已锁定');
            return this.note(`${name}：本场直播的攻击目标已经定下并执行，本场不再改`);
        }
        const list = this.marshalTargetList();
        const hit = list.find((t) => t.index === index);
        if (!hit) {
            this.recordCmd(eventId, id, name, 'pick_target', `目标${index}`, 0, pubMs, now, 'rejected', '目标编号不存在');
            return this.note(`${name}：没有这个目标编号，先发「目标」看可选列表（共 ${list.length} 个）`);
        }
        const floor = Math.max(MARSHAL_TARGET_MIN_BID, (this.marshalTarget?.bid ?? 0) + 1);
        const bid = bidRaw ?? floor;
        if (bid < floor) {
            this.recordCmd(eventId, id, name, 'pick_target', `目标${index}`, bid, pubMs, now, 'rejected', `需出${floor}分以上`);
            return this.note(`${name}：当前目标竞价已到 ${floor - 1} 分，改选需 ${floor} 分以上`);
        }
        if (bid > MARSHAL_TARGET_MAX_BID) {
            return this.note(`${name}：选目标单次上限 ${MARSHAL_TARGET_MAX_BID} 分`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < bid) {
            this.recordCmd(eventId, id, name, 'pick_target', `目标${index}`, bid, pubMs, now, 'rejected', '积分不足');
            return this.note(`${name}：选目标需 ${bid} 积分，现有 ${avail}/${bid}`);
        }
        const prev = this.marshalTarget;
        if (prev) {
            const pa = this.acct(prev.uid, prev.viewer);
            pa.n = Math.min(ORDER_CAP, pa.n + prev.bid);
        }
        a.n -= bid;
        const enemyFactionId = this.app.cityManager?.getCity(hit.cityId)?.factionId ?? '';
        this.marshalTarget = { uid: id, viewer: name, bid, cityId: hit.cityId, cityName: hit.name, armyId, enemyFactionId };
        this.app.aiController?.lockViewerTarget?.(armyId, hit.cityId);
        this.recordCmd(eventId, id, name, 'pick_target', hit.cityId, bid, pubMs, now, 'executed');
        this.save();
        const refund = prev ? `（已退回 ${prev.viewer} 的 ${prev.bid} 积分）` : '';
        this.notifyViewerVoice(id, `感谢${name}出${bid}积分，军团下一个攻打${hit.name}`, true);
        return this.note(`${name} 出 ${bid} 积分，军团下一个攻击目标定为【${hit.name}】（${hit.factionName}）${refund}`);
    }

    /** 开战后才锁定：军团**到达该目标城发起攻城**后不再受理改选；半路野战或尚未抵达前允许更高价改选 */
    private marshalTargetLocked(): boolean {
        const t = this.marshalTarget;
        if (!t) return false;
        if (t.engaged) return true;
        const army = this.app.playerHero?.getHostLegion?.() ?? null;
        return !!army && army.id === t.armyId && army.getIsInCombat() && army.siegeTargetCityId === t.cityId;
    }

    /**
     * 目标结算：
     *   · 军团已到达该目标城发起攻城（engaged），待攻城结束（或城被本军拿下）→ **竞拍执行成功**，积分不退，解锁，可接着指定下一个目标；
     *   · 尚未抵达开打前，城被第三方抢走／消失／军团半路解散或主角离队 → 原数退回。
     */
    private checkMarshalTargetValidity(): void {
        const t = this.marshalTarget;
        if (!t) return;
        const city = this.app.cityManager?.getCity(t.cityId);
        const army = this.app.playerHero?.getHostLegion?.() ?? null;
        const armyGone = !army || army.id !== t.armyId;
        const myFaction = army?.getFactionId?.() ?? '';

        // 一旦军团正在围攻这座目标城，记下「已交战执行」
        if (!armyGone && army.getIsInCombat() && army.siegeTargetCityId === t.cityId) {
            t.engaged = true;
            return;
        }

        // 1. 城已归我方
        if (!armyGone && city?.factionId && myFaction && city.factionId === myFaction) {
            this.app.aiController?.clearViewerTargetLock(t.armyId);
            this.marshalTarget = null;
            this.save();
            this.note(`${t.viewer} 指定的目标【${t.cityName}】已拿下，${t.bid} 分不退；可以接着竞价指定下一个攻击目标`);
            this.notifyViewerVoice(t.uid, `你指定的【${t.cityName}】已攻下，${t.bid}积分不退`, true);
            return;
        }

        // 2. 已经对目标城发起过攻城战，现战斗已结束（即便攻城未克/撤退/全军覆没，指令也已实际执行，不退积分）
        if (t.engaged) {
            this.app.aiController?.clearViewerTargetLock(t.armyId);
            this.marshalTarget = null;
            this.save();
            this.note(`${t.viewer} 指定的目标【${t.cityName}】攻城战已结束（指令已执行，${t.bid} 分不退）；可继续指定下一个目标`);
            return;
        }

        const stillTarget = !armyGone && city?.factionId === t.enemyFactionId;
        if (stillTarget) return;
        const a = this.acct(t.uid, t.viewer);
        a.n = Math.min(ORDER_CAP, a.n + t.bid);
        this.app.aiController?.clearViewerTargetLock(t.armyId);
        this.marshalTarget = null;
        this.save();
        const why = armyGone ? '未抵达目标前军团解散／主角离队' : !city ? '目标城已不存在' : '目标城已被其他势力抢先攻占';
        this.note(`${t.viewer} 指定的目标【${t.cityName}】未及开战即失效（${why}），${t.bid} 积分原数退回`);
        this.notifyViewerVoice(t.uid, `你指定的目标【${t.cityName}】未开战即失效，${t.bid}积分已退回`, true);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 七～九阶战略权限：公侯（duke）· 国王（king）· 皇帝（emperor）
    // ═══════════════════════════════════════════════════════════════════════════

    private dukeUnlocked(): boolean {
        return !!this.app.playerHero?.hasRankPrivilege('duke');
    }

    private kingUnlocked(): boolean {
        return !!this.app.playerHero?.hasRankPrivilege('king');
    }

    private emperorUnlocked(): boolean {
        return !!this.app.playerHero?.hasRankPrivilege('emperor');
    }

    /** 确保玩家自建独立势力（player_own）已在 FactionManager / 旗号表中注册并刷新地图旗字 */
    private ensurePlayerOwnFactionRegistered(): void {
        const hero = this.app.playerHero;
        if (!hero) return;
        const fid = PlayerHero.OWN_FACTION_ID;
        const fname = hero.ownFactionName || `${hero.name}军`;
        const flagChar = (hero.ownFlagChar || fname.slice(0, 1) || '将').slice(0, 1);
        hero.ownFactionName = fname;
        hero.ownFlagChar = flagChar;

        const fm = (this.app as any).factionManager;
        if (fm) {
            if (!fm.getFaction(fid)) {
                fm.addFaction({ id: fid, name: fname, color: '#FFD700' });
            }
            const fac = fm.getFaction(fid);
            if (fac) {
                fac.name = fname;
                fac.color = '#FFD700';
            }
        }
        SANDBOX_DISPLAY_NAMES[fid] = flagChar;
        CityAssetManager.factionFlagMap[fid] = flagChar;
        CityAssetManager.invalidateFlagTextCache(fid);
        void CityAssetManager.ensureFactionFlag(fid);
        this.app.cityManager?.getTerritorySystem?.()?.patchFactionFlagText?.(fid);
    }

    private dukeUnitsHint(name: string): string {
        if (!this.dukeUnlocked()) {
            return this.note(`${name}：组建三排亲军要资历达到公侯（52 胜）才开放`);
        }
        const hero = this.app.playerHero;
        const list = hero?.learnedUnits ?? [];
        if (list.length === 0) {
            return this.note(`${name}：当前尚未收集到陆地兵模，升官或公侯击败新兵种军团后即可收集`);
        }
        const brief = list.slice(0, 12).map((u, i) => `${i + 1}.${u.unitName}`).join(' / ');
        const more = list.length > 12 ? ` 等共${list.length}种` : '';
        const floor = Math.max(DUKE_LEGION_MIN_BID, (this.dukeFormationPicked?.bid ?? 0) + 1);
        const nameFloor = Math.max(DUKE_LEGION_NAME_MIN_BID, this.dukeLegionNameBid + 1);
        return this.note(`已收兵模：${brief}${more}｜发「编 前排编号 中排编号 后排编号 ${floor}」组建三排军团；发「军 军团名 ${nameFloor}」命名亲军`);
    }

    private handleDukeCustomFormation(
        id: string,
        name: string,
        rows: [number, number, number],
        bidRaw: number | null,
        eventId: string,
        pubMs: number,
    ): string {
        const now = Date.now();
        const cmdStr = `编 ${rows[0]} ${rows[1]} ${rows[2]}`;
        if (!this.dukeUnlocked()) {
            this.recordCmd(eventId, id, name, 'duke_formation', cmdStr, 0, pubMs, now, 'rejected', '资历未达公侯');
            return this.note(`${name}：组建三排亲军要资历达到公侯才开放`);
        }
        if (this.battleOn()) {
            this.recordCmd(eventId, id, name, 'duke_formation', cmdStr, 0, pubMs, now, 'rejected', '战斗进行中');
            return this.note(`${name}：正在打仗，战后再调整三排亲军编成`);
        }
        const hero = this.app.playerHero;
        const list = hero?.learnedUnits ?? [];
        if (!hero || list.length === 0) {
            return this.note(`${name}：当前还没有已收集的兵模`);
        }
        const [r1, r2, r3] = rows;
        if (r1 < 1 || r1 > list.length || r2 < 1 || r2 > list.length || r3 < 1 || r3 > list.length) {
            this.recordCmd(eventId, id, name, 'duke_formation', cmdStr, 0, pubMs, now, 'rejected', '兵模编号超出范围');
            return this.note(`${name}：兵模编号须在 1~${list.length} 之间（发「兵」查看编号）`);
        }
        const floor = Math.max(DUKE_LEGION_MIN_BID, (this.dukeFormationPicked?.bid ?? 0) + 1);
        const bid = bidRaw ?? floor;
        if (bid < floor) {
            this.recordCmd(eventId, id, name, 'duke_formation', cmdStr, bid, pubMs, now, 'rejected', `需出${floor}分以上`);
            return this.note(`${name}：当前三排编成竞价已到 ${floor - 1} 分，改编需 ${floor} 分以上`);
        }
        if (bid > DUKE_LEGION_MAX_BID) {
            return this.note(`${name}：编成单次出价上限 ${DUKE_LEGION_MAX_BID} 分`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < bid) {
            this.recordCmd(eventId, id, name, 'duke_formation', cmdStr, bid, pubMs, now, 'rejected', '积分不足');
            return this.note(`${name}：组建三排军团需 ${bid} 积分，现有 ${avail}/${bid}`);
        }
        const prev = this.dukeFormationPicked;
        if (prev) {
            const pa = this.acct(prev.uid, prev.viewer);
            pa.n = Math.min(ORDER_CAP, pa.n + prev.bid);
        }
        a.n -= bid;
        const u1 = list[r1 - 1];
        const u2 = list[r2 - 1];
        const u3 = list[r3 - 1];
        hero.customRowUnits = [u1.unitKey, u2.unitKey, u3.unitKey];
        for (const u of [u1, u2, u3]) {
            hero.peakStats = mergePlayerPeakFromUnit(hero.peakStats, u.unitKey);
        }
        hero.applyCustomLegionToArmy();
        this.dukeFormationPicked = { uid: id, viewer: name, bid, rows: [r1, r2, r3], names: [u1.unitName, u2.unitName, u3.unitName] };
        this.recordCmd(eventId, id, name, 'duke_formation', `${u1.unitName}/${u2.unitName}/${u3.unitName}`, bid, pubMs, now, 'executed');
        this.save();
        const refund = prev ? `（已退回 ${prev.viewer} 的 ${prev.bid} 积分）` : '';
        this.notifyViewerVoice(id, `感谢${name}出${bid}积分，亲军三排编为${u1.unitName}、${u2.unitName}、${u3.unitName}`, true);
        return this.note(`${name} 出 ${bid} 积分，组建三排亲军：前排【${u1.unitName}】·中排【${u2.unitName}】·后排【${u3.unitName}】${refund}`);
    }

    private handleDukeLegionName(
        id: string,
        name: string,
        rawName: string,
        bidRaw: number | null,
        eventId: string,
        pubMs: number,
    ): string {
        const now = Date.now();
        if (!this.dukeUnlocked()) {
            this.recordCmd(eventId, id, name, 'duke_legion_name', rawName, 0, pubMs, now, 'rejected', '资历未达公侯');
            return this.note(`${name}：命名亲军军团要资历达到公侯才开放`);
        }
        const hero = this.app.playerHero;
        if (!hero) return this.note(`${name}：玩家尚未就绪`);
        const floor = Math.max(DUKE_LEGION_NAME_MIN_BID, this.dukeLegionNameBid + 1);
        const bid = bidRaw ?? floor;
        if (bid < floor) {
            this.recordCmd(eventId, id, name, 'duke_legion_name', rawName, bid, pubMs, now, 'rejected', `需出${floor}分以上`);
            return this.note(`${name}：当前军团名竞价已到 ${floor - 1} 分，改名需 ${floor} 分以上`);
        }
        if (bid > DUKE_LEGION_MAX_BID) {
            return this.note(`${name}：单次出价上限 ${DUKE_LEGION_MAX_BID} 分`);
        }
        const mod = moderateLiveName(rawName);
        if (!mod.ok) {
            this.recordCmd(eventId, id, name, 'duke_legion_name', rawName, bid, pubMs, now, 'rejected', mod.reason);
            return this.note(`${name}：${mod.reason}（未扣积分）`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < bid) {
            this.recordCmd(eventId, id, name, 'duke_legion_name', mod.name, bid, pubMs, now, 'rejected', '积分不足');
            return this.note(`${name}：命名军团需 ${bid} 积分，现有 ${avail}/${bid}`);
        }
        a.n -= bid;
        this.dukeLegionNameBid = bid;
        hero.customLegionName = mod.name;
        hero.applyCustomLegionToArmy();
        this.recordCmd(eventId, id, name, 'duke_legion_name', mod.name, bid, pubMs, now, 'executed');
        this.save();
        this.notifyViewerVoice(id, `感谢${name}出${bid}积分，亲军军团命名为${mod.name}`, true);
        return this.note(`${name} 出 ${bid} 积分，将玩家亲军命名为【${mod.name}】（下次改名需 ${bid + 1} 分起）`);
    }

    private dukeFiefCandidates(): { index: number; cityId: string; name: string; factionId: string; factionName: string; troops: number; distKm: number }[] {
        const cm = this.app.cityManager;
        const hero = this.app.playerHero;
        if (!cm || !hero) return [];
        const pos = hero.getPosition();
        const liegeFid = (hero.factionId && hero.factionId !== PlayerHero.OWN_FACTION_ID)
            ? hero.factionId
            : hero.alliedFactionId;
        const allCities = cm.getCities().filter((c) => cm.isCityVisible(c) && c.factionId !== PlayerHero.OWN_FACTION_ID);
        const withDist = allCities.map((c) => {
            const dLat = (c.latitude - pos.lat) * 111;
            const dLng = (c.longitude - pos.lng) * 111 * Math.cos((pos.lat * Math.PI) / 180);
            const distKm = Math.max(1, Math.round(Math.hypot(dLat, dLng)));
            return {
                cityId: c.id,
                name: c.name,
                factionId: c.factionId,
                factionName: cm.getFactionName(c.factionId) || c.factionId,
                troops: Math.round(c.troops || 0),
                distKm,
                isLiege: !!liegeFid && c.factionId === liegeFid,
            };
        });
        const liegeList = withDist.filter((c) => c.isLiege).sort((a, b) => a.distKm - b.distKm);
        const otherList = withDist.filter((c) => !c.isLiege).sort((a, b) => a.distKm - b.distKm);
        const merged = [...(liegeList.length >= 2 ? liegeList.slice(0, 5) : []), ...otherList].slice(0, 8);
        return merged.map((c, idx) => ({
            index: idx + 1,
            cityId: c.cityId,
            name: c.name,
            factionId: c.factionId,
            factionName: c.factionName,
            troops: c.troops,
            distKm: c.distKm,
        }));
    }

    private dukeFiefHint(name: string): string {
        if (!this.dukeUnlocked()) {
            return this.note(`${name}：选择根据地封邑要资历达到公侯（52 胜）才开放`);
        }
        const list = this.dukeFiefCandidates();
        if (list.length === 0) return this.note(`${name}：当前没有可选的根据地据点`);
        const floor = Math.max(DUKE_FIEF_MIN_BID, (this.dukeFiefPicked?.bid ?? 0) + 1);
        const brief = list.map((c) => `${c.index}.${c.name}(${c.factionName}·${c.distKm}km)`).join(' / ');
        return this.note(`可选根据地：${brief} —— 发「封1 ${floor}」竞拍封地（与原主公同盟立藩）`);
    }

    private handleDukeFief(
        id: string,
        name: string,
        index: number,
        bidRaw: number | null,
        eventId: string,
        pubMs: number,
    ): string {
        const now = Date.now();
        if (!this.dukeUnlocked()) {
            this.recordCmd(eventId, id, name, 'duke_fief', `封${index}`, 0, pubMs, now, 'rejected', '资历未达公侯');
            return this.note(`${name}：择城封侯要资历达到公侯才开放`);
        }
        if (this.battleOn()) {
            this.recordCmd(eventId, id, name, 'duke_fief', `封${index}`, 0, pubMs, now, 'rejected', '战斗进行中');
            return this.note(`${name}：正在交战，战后再选择根据地`);
        }
        const list = this.dukeFiefCandidates();
        const hit = list.find((c) => c.index === index);
        if (!hit) {
            this.recordCmd(eventId, id, name, 'duke_fief', `封${index}`, 0, pubMs, now, 'rejected', '编号不存在');
            return this.note(`${name}：没有这个根据地编号，先发「封」看可选列表（1~${list.length}）`);
        }
        const floor = Math.max(DUKE_FIEF_MIN_BID, (this.dukeFiefPicked?.bid ?? 0) + 1);
        const bid = bidRaw ?? floor;
        if (bid < floor) {
            this.recordCmd(eventId, id, name, 'duke_fief', `封${index}`, bid, pubMs, now, 'rejected', `需出${floor}分以上`);
            return this.note(`${name}：当前根据地竞价已到 ${floor - 1} 分，改选需 ${floor} 分以上`);
        }
        if (bid > DUKE_FIEF_MAX_BID) {
            return this.note(`${name}：选根据地单次上限 ${DUKE_FIEF_MAX_BID} 分`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < bid) {
            this.recordCmd(eventId, id, name, 'duke_fief', `封${index}`, bid, pubMs, now, 'rejected', '积分不足');
            return this.note(`${name}：竞拍根据地需 ${bid} 积分，现有 ${avail}/${bid}`);
        }
        const prev = this.dukeFiefPicked;
        if (prev) {
            const pa = this.acct(prev.uid, prev.viewer);
            pa.n = Math.min(ORDER_CAP, pa.n + prev.bid);
        }
        a.n -= bid;

        const hero = this.app.playerHero!;
        const cm = this.app.cityManager!;
        if (hero.factionId && hero.factionId !== PlayerHero.OWN_FACTION_ID) {
            hero.alliedFactionId = hero.factionId;
        } else if (!hero.alliedFactionId && hit.factionId !== 'panshu') {
            hero.alliedFactionId = hit.factionId;
        }
        this.ensurePlayerOwnFactionRegistered();
        hero.fiefCityId = hit.cityId;
        const targetCity = cm.getCity(hit.cityId);
        if (targetCity) {
            cm.updateCity(
                hit.cityId,
                {
                    factionId: PlayerHero.OWN_FACTION_ID,
                    troops: Math.max(targetCity.troops || 0, 20000),
                },
                { skipCaptureLog: true },
            );
        }
        hero.factionId = PlayerHero.OWN_FACTION_ID;
        const host = hero.getHostLegion();
        if (host) {
            host.setFactionId(PlayerHero.OWN_FACTION_ID);
            hero.applyCustomLegionToArmy(host);
        }
        this.dukeFiefPicked = { uid: id, viewer: name, bid, cityId: hit.cityId, cityName: hit.name };
        this.recordCmd(eventId, id, name, 'duke_fief', hit.cityId, bid, pubMs, now, 'executed');
        this.save();
        const allyName = hero.alliedFactionId ? (cm.getFactionName(hero.alliedFactionId) || hero.alliedFactionId) : '原主公';
        hero.recordLife('title', `以【${hit.name}】为根据地封侯建藩【${hero.ownFactionName}】，与${allyName}结盟`,
            { titleKind: 'fief', cityId: hit.cityId, cityName: hit.name, byViewer: name });
        const refund = prev ? `（已退回 ${prev.viewer} 的 ${prev.bid} 积分）` : '';
        this.notifyViewerVoice(id, `感谢${name}出${bid}积分，以${hit.name}为根据地封侯建藩，与${allyName}结盟`, true);
        return this.note(`${name} 出 ${bid} 积分，择【${hit.name}】为根据地，立独立同盟藩镇【${hero.ownFactionName}】（与【${allyName}】同盟互不侵犯）${refund}`);
    }

    private handleKingFactionName(
        id: string,
        name: string,
        rawName: string,
        flagChar: string,
        bidRaw: number | null,
        eventId: string,
        pubMs: number,
    ): string {
        const now = Date.now();
        if (!this.kingUnlocked()) {
            this.recordCmd(eventId, id, name, 'king_faction_name', rawName, 0, pubMs, now, 'rejected', '资历未达国王');
            return this.note(`${name}：建立势力名字与旗字要资历达到国王（82 胜）才开放`);
        }
        const hero = this.app.playerHero;
        if (!hero) return this.note(`${name}：玩家尚未就绪`);
        const floor = Math.max(KING_FACTION_NAME_MIN_BID, this.kingFactionNameBid + 1);
        const bid = bidRaw ?? floor;
        if (bid < floor) {
            this.recordCmd(eventId, id, name, 'king_faction_name', rawName, bid, pubMs, now, 'rejected', `需出${floor}分以上`);
            return this.note(`${name}：当前国号竞价已到 ${floor - 1} 分，改国号需 ${floor} 分以上`);
        }
        if (bid > KING_FACTION_NAME_MAX_BID) {
            return this.note(`${name}：单次出价上限 ${KING_FACTION_NAME_MAX_BID} 分`);
        }
        const modName = moderateLiveName(rawName);
        if (!modName.ok) {
            this.recordCmd(eventId, id, name, 'king_faction_name', rawName, bid, pubMs, now, 'rejected', modName.reason);
            return this.note(`${name}：${modName.reason}（未扣积分）`);
        }
        const modFlag = moderateLiveName(flagChar);
        if (!modFlag.ok) {
            this.recordCmd(eventId, id, name, 'king_faction_name', flagChar, bid, pubMs, now, 'rejected', modFlag.reason);
            return this.note(`${name}：旗号文字不合规范（未扣积分）`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < bid) {
            this.recordCmd(eventId, id, name, 'king_faction_name', modName.name, bid, pubMs, now, 'rejected', '积分不足');
            return this.note(`${name}：立国号需 ${bid} 积分，现有 ${avail}/${bid}`);
        }
        a.n -= bid;
        this.kingFactionNameBid = bid;
        const oneChar = [...modFlag.name.trim()][0] || [...modName.name][0] || '王';
        hero.ownFactionName = modName.name;
        hero.ownFlagChar = oneChar;
        hero.recordLife('title', `立国号【${modName.name}】，旗号「${oneChar}」`, { titleKind: 'kingdom', factionName: modName.name, flagChar: oneChar, byViewer: name });
        this.ensurePlayerOwnFactionRegistered();
        this.recordCmd(eventId, id, name, 'king_faction_name', `${modName.name}(${oneChar})`, bid, pubMs, now, 'executed');
        this.save();
        this.notifyViewerVoice(id, `感谢${name}出${bid}积分，立国号为${modName.name}，旗号${oneChar}`, true);
        return this.note(`${name} 出 ${bid} 积分，立国号【${modName.name}】、旗号【${oneChar}】（下次改国号需 ${bid + 1} 分起）`);
    }

    private getFactionCitiesAndTroops(factionId: string | null): { cities: number; troops: number } {
        if (!factionId) return { cities: 0, troops: 0 };
        const cm = this.app.cityManager;
        const lm = this.app.legionManager;
        const cities = cm?.getCitiesByFaction(factionId) ?? [];
        const cityTroops = cities.reduce((s, c) => s + Math.max(0, c.troops || 0), 0);
        const armies = (lm?.getArmies?.() ?? []).filter((a) => a.getFactionId() === factionId);
        const armyTroops = armies.reduce((s, a) => s + Math.max(0, a.getTroops() || 0), 0);
        return { cities: cities.length, troops: Math.round(cityTroops + armyTroops) };
    }

    /** 国王征召条件：本势力据点与总兵力均大于原主公势力的 3 倍（若主公已无城则自动满足） */
    private checkKingThreeTimesLiege(): {
        ok: boolean;
        myCities: number;
        myTroops: number;
        liegeCities: number;
        liegeTroops: number;
        liegeName: string;
        text: string;
    } {
        const hero = this.app.playerHero;
        const cm = this.app.cityManager;
        const myFid = hero?.fiefCityId ? PlayerHero.OWN_FACTION_ID : (hero?.factionId || PlayerHero.OWN_FACTION_ID);
        const liegeFid = hero?.alliedFactionId && hero.alliedFactionId !== myFid ? hero.alliedFactionId : null;
        const my = this.getFactionCitiesAndTroops(myFid);
        const liege = this.getFactionCitiesAndTroops(liegeFid);
        const liegeName = liegeFid ? (cm?.getFactionName(liegeFid) || liegeFid) : '旧主';
        const ok = liege.cities === 0
            ? (my.cities > 0 || my.troops > 0)
            : (my.cities > liege.cities * 3 && my.troops > liege.troops * 3);
        const text = liege.cities === 0
            ? `本国 ${my.cities} 城/${my.troops} 兵（旧主已灭，满足条件）`
            : `本国 ${my.cities} 城/${my.troops} 兵 vs ${liegeName} ${liege.cities} 城/${liege.troops} 兵（需 >3 倍）`;
        return { ok, myCities: my.cities, myTroops: my.troops, liegeCities: liege.cities, liegeTroops: liege.troops, liegeName, text };
    }

    private kingSummonCandidates(): {
        index: number;
        generalId: string;
        generalName: string;
        cityId: string;
        cityName: string;
        troops: number;
        activeArmyId: string | null;
    }[] {
        const hero = this.app.playerHero;
        const cm = this.app.cityManager;
        const lm = this.app.legionManager;
        if (!hero || !cm) return [];
        const host = hero.getHostLegion();
        const myFid = hero.fiefCityId ? PlayerHero.OWN_FACTION_ID : (hero.factionId || PlayerHero.OWN_FACTION_ID);
        const allowFactions = new Set<string>([myFid]);
        if (hero.alliedFactionId) allowFactions.add(hero.alliedFactionId);
        if (hero.factionId) allowFactions.add(hero.factionId);

        const mergedSet = new Set(hero.mergedGenerals);
        const armies = lm?.getArmies?.() ?? [];
        const out: {
            generalId: string;
            generalName: string;
            cityId: string;
            cityName: string;
            troops: number;
            activeArmyId: string | null;
        }[] = [];

        // 1. 已在野外领兵且非主角当前所在军团的本势力/同盟名将
        for (const a of armies) {
            if (!allowFactions.has(a.getFactionId())) continue;
            if (host && a.id === host.id) continue;
            if (a.getIsInCombat()) continue;
            const gid = a.generalId;
            if (!gid || mergedSet.has(gid) || gid === host?.generalId) continue;
            const g = getFactionGeneral(gid);
            if (!g || !isGeneralOnStage(g.generalId)) continue;
            if (a.getTroops() < GameConfig.LEGION.MIN_ARMY_SIZE) continue;
            out.push({
                generalId: g.generalId,
                generalName: g.generalName,
                cityId: (a as any).sourceCityId || g.cityId || '',
                cityName: a.name,
                troops: Math.round(a.getTroops()),
                activeArmyId: a.id,
            });
        }

        // 2. 在本国/同盟据点内驻守且满足出兵兵力条件（驻军 >= MIN_ARMY_SIZE + MIN_GARRISON）的在世武将
        for (const city of cm.getCities()) {
            if (!allowFactions.has(city.factionId)) continue;
            const availTroops = Math.floor((city.troops || 0) - GameConfig.CITY.MIN_GARRISON);
            if (availTroops < GameConfig.LEGION.MIN_ARMY_SIZE) continue;
            const anchored = getCityAnchoredGenerals(city.id);
            for (const g of anchored) {
                if (!isGeneralOnStage(g.generalId)) continue;
                if (mergedSet.has(g.generalId) || g.generalId === host?.generalId) continue;
                if (out.some((x) => x.generalId === g.generalId)) continue;
                const takeTroops = Math.max(GameConfig.LEGION.MIN_ARMY_SIZE, Math.min(availTroops, Math.floor((city.troops || 0) * 0.5)));
                out.push({
                    generalId: g.generalId,
                    generalName: g.generalName,
                    cityId: city.id,
                    cityName: city.name,
                    troops: takeTroops,
                    activeArmyId: null,
                });
            }
        }

        return out.slice(0, 8).map((item, idx) => ({ index: idx + 1, ...item }));
    }

    private kingSummonHint(name: string): string {
        if (!this.kingUnlocked()) {
            return this.note(`${name}：征召武将合军要资历达到国王（82 胜）才开放`);
        }
        const three = this.checkKingThreeTimesLiege();
        if (!three.ok) {
            return this.note(`${name}：征召需据点与兵力均大于主公 3 倍（当前：${three.text}）`);
        }
        const list = this.kingSummonCandidates();
        if (list.length === 0) {
            return this.note(`${name}：当前没有符合出兵条件（据点可出征兵力≥${GameConfig.LEGION.MIN_ARMY_SIZE}）的本国武将可征召`);
        }
        const floor = Math.max(KING_SUMMON_MIN_BID, (this.kingSummonPicked?.bid ?? 0) + 1);
        const brief = list.map((g) => `${g.index}.${g.generalName}(${g.cityName}·${g.troops}兵)`).join(' / ');
        return this.note(`可征召合军武将：${brief} —— 发「召1 ${floor}」让该将领军并入主角军团（兵力相加）`);
    }

    private handleKingSummonGeneral(
        id: string,
        name: string,
        index: number,
        bidRaw: number | null,
        eventId: string,
        pubMs: number,
    ): string {
        const now = Date.now();
        if (!this.kingUnlocked()) {
            this.recordCmd(eventId, id, name, 'king_summon', `召${index}`, 0, pubMs, now, 'rejected', '资历未达国王');
            return this.note(`${name}：征召武将合军要资历达到国王才开放`);
        }
        if (this.battleOn()) {
            this.recordCmd(eventId, id, name, 'king_summon', `召${index}`, 0, pubMs, now, 'rejected', '战斗进行中');
            return this.note(`${name}：正在打仗，战后再征召武将合军`);
        }
        const hero = this.app.playerHero;
        const host = hero?.getHostLegion() ?? null;
        if (!hero || !host) {
            this.recordCmd(eventId, id, name, 'king_summon', `召${index}`, 0, pubMs, now, 'rejected', '主角未随军');
            return this.note(`${name}：主角须在军团中才能接纳其他武将合军`);
        }
        const three = this.checkKingThreeTimesLiege();
        if (!three.ok) {
            this.recordCmd(eventId, id, name, 'king_summon', `召${index}`, 0, pubMs, now, 'rejected', '未满主公3倍');
            return this.note(`${name}：尚未满足据点与兵力大于主公 3 倍（${three.text}）`);
        }
        const list = this.kingSummonCandidates();
        const hit = list.find((g) => g.index === index);
        if (!hit) {
            this.recordCmd(eventId, id, name, 'king_summon', `召${index}`, 0, pubMs, now, 'rejected', '武将编号不存在');
            return this.note(`${name}：没有这个编号，先发「召」看可征召武将列表`);
        }
        const floor = Math.max(KING_SUMMON_MIN_BID, (this.kingSummonPicked?.bid ?? 0) + 1);
        const bid = bidRaw ?? floor;
        if (bid < floor) {
            this.recordCmd(eventId, id, name, 'king_summon', `召${index}`, bid, pubMs, now, 'rejected', `需出${floor}分以上`);
            return this.note(`${name}：当前征召竞价需 ${floor} 分以上`);
        }
        if (bid > KING_SUMMON_MAX_BID) {
            return this.note(`${name}：征召单次出价上限 ${KING_SUMMON_MAX_BID} 分`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < bid) {
            this.recordCmd(eventId, id, name, 'king_summon', `召${index}`, bid, pubMs, now, 'rejected', '积分不足');
            return this.note(`${name}：征召武将需 ${bid} 积分，现有 ${avail}/${bid}`);
        }
        a.n -= bid;

        let addedTroops = hit.troops;
        if (hit.activeArmyId) {
            const activeArmy = (this.app.legionManager?.getArmies?.() ?? []).find((x) => x.id === hit.activeArmyId);
            if (activeArmy) {
                addedTroops = Math.max(1000, Math.round(activeArmy.getTroops()));
                this.app.legionManager?.removeArmy?.(activeArmy);
            }
        } else if (hit.cityId) {
            const city = this.app.cityManager?.getCity(hit.cityId);
            if (city) {
                const maxTake = Math.max(0, (city.troops || 0) - GameConfig.CITY.MIN_GARRISON);
                addedTroops = Math.min(hit.troops, maxTake);
                this.app.cityManager?.updateCity(city.id, { troops: Math.max(GameConfig.CITY.MIN_GARRISON, (city.troops || 0) - addedTroops) });
            }
        }

        const beforeTroops = Math.round(host.getTroops());
        host.setTroops(beforeTroops + addedTroops);
        if (!hero.mergedGenerals.includes(hit.generalId)) {
            hero.mergedGenerals.push(hit.generalId);
        }
        hero.recordLife('title', `征召名将【${hit.generalName}】率${addedTroops}兵合入大军`, { titleKind: 'summon', generalId: hit.generalId, generalName: hit.generalName, troops: addedTroops, byViewer: name });
        this.kingSummonPicked = { uid: id, viewer: name, bid, generalId: hit.generalId, generalName: hit.generalName };
        this.recordCmd(eventId, id, name, 'king_summon', `${hit.generalName}(+${addedTroops})`, bid, pubMs, now, 'executed');
        this.save();
        this.notifyViewerVoice(id, `感谢${name}出${bid}积分，征召${hit.generalName}率${addedTroops}兵合入大军`, true);
        return this.note(`${name} 出 ${bid} 积分，征召名将【${hit.generalName}】率 ${addedTroops} 兵合入主角大军，总兵力升至 ${Math.round(host.getTroops())}`);
    }

    /** 皇帝威压候选：与本势力直接道路接壤、且据点与总兵力均小于本势力 1/10 的势力 */
    private emperorCoerceCandidates(): {
        index: number;
        factionId: string;
        factionName: string;
        cities: number;
        troops: number;
    }[] {
        const hero = this.app.playerHero;
        const cm = this.app.cityManager;
        if (!hero || !cm) return [];
        const myFid = hero.fiefCityId ? PlayerHero.OWN_FACTION_ID : (hero.factionId || PlayerHero.OWN_FACTION_ID);
        const my = this.getFactionCitiesAndTroops(myFid);
        if (my.cities < 10 || my.troops < 10000) return [];

        const myCities = cm.getCitiesByFaction(myFid);
        const neighborFactions = new Set<string>();
        for (const c of myCities) {
            const connected = roadRegistry.getConnectedCities(c.id);
            for (const cid of connected) {
                const nb = cm.getCity(cid);
                if (!nb || !nb.factionId) continue;
                if (nb.factionId === myFid || nb.factionId === 'panshu' || nb.factionId === 'panjun') continue;
                neighborFactions.add(nb.factionId);
            }
        }

        const out: { factionId: string; factionName: string; cities: number; troops: number }[] = [];
        for (const fid of neighborFactions) {
            const st = this.getFactionCitiesAndTroops(fid);
            if (st.cities <= 0) continue;
            if (my.cities >= st.cities * 10 && my.troops >= st.troops * 10) {
                out.push({
                    factionId: fid,
                    factionName: cm.getFactionName(fid) || fid,
                    cities: st.cities,
                    troops: st.troops,
                });
            }
        }
        out.sort((a, b) => a.troops - b.troops);
        return out.slice(0, 8).map((f, idx) => ({ index: idx + 1, ...f }));
    }

    private emperorCoerceHint(name: string): string {
        if (!this.emperorUnlocked()) {
            return this.note(`${name}：威压邻国臣服要资历达到皇帝（120 胜）才开放`);
        }
        const now = Date.now();
        if (this.lastCoerceSuccessAt > 0 && now - this.lastCoerceSuccessAt < EMPEROR_COERCE_COOLDOWN_MS) {
            const leftMin = Math.ceil((this.lastCoerceSuccessAt + EMPEROR_COERCE_COOLDOWN_MS - now) / 60_000);
            return this.note(`${name}：天子威压冷却中，还需约 ${leftMin} 分钟才能再次颁旨威压`);
        }
        if (this.emperorCoercePool) {
            const p = this.emperorCoercePool;
            return this.note(`正在众筹威压【${p.factionName}】进度 ${p.total}/${EMPEROR_COERCE_TARGET_POINTS} 分 —— 发「威1 10」追加积分`);
        }
        const list = this.emperorCoerceCandidates();
        if (list.length === 0) {
            return this.note(`${name}：当前没有「与本国领土直接接壤、且据点与兵力均小于我方 1/10」的势力可威压`);
        }
        const brief = list.map((f) => `${f.index}.${f.factionName}(${f.cities}城·${f.troops}兵)`).join(' / ');
        return this.note(`可威压臣服邻国：${brief} —— 发「威1 20」众筹天子诏书（满 ${EMPEROR_COERCE_TARGET_POINTS} 分即刻臣服合军）`);
    }

    private refundEmperorCoercePool(reason: string): void {
        const pool = this.emperorCoercePool;
        if (!pool) return;
        this.emperorCoercePool = null;
        for (const [uid, c] of pool.contributors.entries()) {
            const a = this.acct(uid, c.name);
            a.n = Math.min(ORDER_CAP, a.n + c.amount);
        }
        this.save();
        this.note(`威压【${pool.factionName}】未完成即中止（${reason}），已向 ${pool.contributors.size} 位观众全额退回 ${pool.total} 积分`);
    }

    private checkEmperorCoerceValidity(): void {
        const pool = this.emperorCoercePool;
        if (!pool) return;
        const list = this.emperorCoerceCandidates();
        const stillValid = list.some((f) => f.factionId === pool.factionId);
        if (!stillValid) {
            this.refundEmperorCoercePool('目标势力已灭亡或不再满足接壤/十倍差距条件');
        }
    }

    private handleEmperorCoerce(
        id: string,
        name: string,
        index: number,
        amountRaw: number | null,
        eventId: string,
        pubMs: number,
    ): string {
        const now = Date.now();
        if (!this.emperorUnlocked()) {
            this.recordCmd(eventId, id, name, 'emperor_coerce', `威${index}`, 0, pubMs, now, 'rejected', '资历未达皇帝');
            return this.note(`${name}：天子威压臣服要资历达到皇帝（120 胜）才开放`);
        }
        if (this.battleOn()) {
            this.recordCmd(eventId, id, name, 'emperor_coerce', `威${index}`, 0, pubMs, now, 'rejected', '战斗进行中');
            return this.note(`${name}：正在打仗，战后再颁旨威压`);
        }
        if (this.lastCoerceSuccessAt > 0 && now - this.lastCoerceSuccessAt < EMPEROR_COERCE_COOLDOWN_MS) {
            const leftMin = Math.ceil((this.lastCoerceSuccessAt + EMPEROR_COERCE_COOLDOWN_MS - now) / 60_000);
            this.recordCmd(eventId, id, name, 'emperor_coerce', `威${index}`, 0, pubMs, now, 'rejected', '威压冷却中');
            return this.note(`${name}：天子威压冷却中（距上次不足 20 分钟），还需约 ${leftMin} 分钟`);
        }
        const list = this.emperorCoerceCandidates();
        const hit = list.find((f) => f.index === index);
        if (!hit && !this.emperorCoercePool) {
            this.recordCmd(eventId, id, name, 'emperor_coerce', `威${index}`, 0, pubMs, now, 'rejected', '编号不存在');
            return this.note(`${name}：没有这个候选编号，先发「威」查看可威压的接壤弱小势力`);
        }
        if (this.emperorCoercePool && hit && hit.factionId !== this.emperorCoercePool.factionId) {
            this.recordCmd(eventId, id, name, 'emperor_coerce', `威${index}`, 0, pubMs, now, 'rejected', '已有正在威压的目标');
            return this.note(`${name}：一次只能威压一个势力，当前正在众筹威压【${this.emperorCoercePool.factionName}】（${this.emperorCoercePool.total}/${EMPEROR_COERCE_TARGET_POINTS} 分）`);
        }
        const target = this.emperorCoercePool
            ? { factionId: this.emperorCoercePool.factionId, factionName: this.emperorCoercePool.factionName }
            : { factionId: hit!.factionId, factionName: hit!.factionName };

        const needLeft = EMPEROR_COERCE_TARGET_POINTS - (this.emperorCoercePool?.total ?? 0);
        const amount = Math.min(needLeft, amountRaw ?? EMPEROR_COERCE_MIN_CONTRIB);
        if (amount < Math.min(EMPEROR_COERCE_MIN_CONTRIB, needLeft)) {
            return this.note(`${name}：单次助力威压至少投 ${Math.min(EMPEROR_COERCE_MIN_CONTRIB, needLeft)} 积分`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < amount) {
            this.recordCmd(eventId, id, name, 'emperor_coerce', `威${index}`, amount, pubMs, now, 'rejected', '积分不足');
            return this.note(`${name}：助力威压需 ${amount} 积分，现有 ${avail}/${amount}`);
        }
        a.n -= amount;
        if (!this.emperorCoercePool) {
            this.emperorCoercePool = {
                factionId: target.factionId,
                factionName: target.factionName,
                total: 0,
                contributors: new Map(),
            };
        }
        const pool = this.emperorCoercePool!;
        pool.total += amount;
        const prevC = pool.contributors.get(id);
        pool.contributors.set(id, { name, amount: (prevC?.amount ?? 0) + amount });
        this.recordCmd(eventId, id, name, 'emperor_coerce', `${target.factionName}(+${amount})`, amount, pubMs, now, 'executed');

        if (pool.total < EMPEROR_COERCE_TARGET_POINTS) {
            this.save();
            this.notifyViewerVoice(id, `感谢${name}投${amount}积分助威，威压${target.factionName}进度${pool.total}分`);
            return this.note(`${name} 投 ${amount} 积分威压【${target.factionName}】，当前众筹 ${pool.total}/${EMPEROR_COERCE_TARGET_POINTS} 分`);
        }

        // 众筹满 100 分：目标势力全境臣服，符合出兵条件的武将与军团合入主角大军
        const hero = this.app.playerHero!;
        const cm = this.app.cityManager!;
        const lm = this.app.legionManager;
        const myFid = hero.fiefCityId ? PlayerHero.OWN_FACTION_ID : (hero.factionId || PlayerHero.OWN_FACTION_ID);
        if (myFid === PlayerHero.OWN_FACTION_ID) {
            this.ensurePlayerOwnFactionRegistered();
        }
        const host = hero.getHostLegion();
        let mergedTroops = 0;
        const mergedGenNames: string[] = [];

        // 1. 野外该势力军团就地并入主角大军
        for (const army of [...(lm?.getArmies?.() ?? [])]) {
            if (army.getFactionId() !== target.factionId) continue;
            if (host && army.id !== host.id) {
                mergedTroops += Math.max(0, Math.round(army.getTroops()));
                if (army.generalId && !hero.mergedGenerals.includes(army.generalId)) {
                    hero.mergedGenerals.push(army.generalId);
                    const g = getFactionGeneral(army.generalId);
                    if (g) mergedGenNames.push(g.generalName);
                }
                lm?.removeArmy?.(army);
            } else {
                army.setFactionId(myFid);
            }
        }

        // 2. 该势力所有据点归附，驻城符合出兵条件的在世武将率军合入主角大军
        const targetCities = cm.getCitiesByFaction(target.factionId);
        for (const c of targetCities) {
            const anchored = getCityAnchoredGenerals(c.id).filter((g) => isGeneralOnStage(g.generalId));
            const availTroops = Math.max(0, Math.floor((c.troops || 0) - GameConfig.CITY.MIN_GARRISON));
            let cityDeduct = 0;
            if (host && anchored.length > 0 && availTroops >= GameConfig.LEGION.MIN_ARMY_SIZE) {
                cityDeduct = Math.max(GameConfig.LEGION.MIN_ARMY_SIZE, Math.floor(availTroops * 0.5));
                mergedTroops += cityDeduct;
                for (const g of anchored) {
                    if (!hero.mergedGenerals.includes(g.generalId)) {
                        hero.mergedGenerals.push(g.generalId);
                        mergedGenNames.push(g.generalName);
                    }
                }
            }
            cm.updateCity(
                c.id,
                {
                    factionId: myFid,
                    troops: Math.max(GameConfig.CITY.MIN_GARRISON, (c.troops || 0) - cityDeduct),
                },
                { skipCaptureLog: true, noBattleSurrender: true },
            );
        }

        if (host && mergedTroops > 0) {
            host.setTroops(Math.round(host.getTroops()) + mergedTroops);
        }

        hero.recordLife('title', `天子诏书威压，${target.factionName}举国${targetCities.length}城臣服归附`,
            { titleKind: 'coerce', factionId: target.factionId, factionName: target.factionName, cities: targetCities.length, troops: mergedTroops });
        this.lastCoerceSuccessAt = now;
        this.emperorCoercePool = null;
        this.save();
        const genStr = mergedGenNames.length > 0 ? `，名将【${mergedGenNames.slice(0, 4).join('、')}】率 ${mergedTroops} 兵合入主角大军` : (mergedTroops > 0 ? `，合入兵力 ${mergedTroops}` : '');
        this.notifyViewerVoice(id, `天子诏书达成！邻国${target.factionName}举国臣服${genStr}`, true);
        return this.note(`【天子威压达成】众筹满 ${EMPEROR_COERCE_TARGET_POINTS} 分，邻国【${target.factionName}】（${targetCities.length} 城）举国臣服归附${genStr}！`);
    }

    private _afterEmperorCoerceDummy(): void {
    }

    private recordCmd(
        eventId: string,
        uid: string,
        viewer: string,
        commandType: LiveCommandRecord['commandType'],
        params: string,
        pointsBid: number,
        publishedAtMs: number,
        receivedAtMs: number,
        status: LiveCommandRecord['status'],
        reason?: string,
    ): void {
        this.recentCommands.push({
            seq: ++this.commandSeq,
            eventId,
            uid,
            viewer,
            commandType,
            params,
            pointsBid,
            publishedAtMs,
            receivedAtMs,
            sessionId: this.sessionId,
            battleId: this.battleId,
            status,
            ...(reason ? { reason } : {}),
        });
        if (this.recentCommands.length > 50) this.recentCommands.shift();
    }

    private war(): any {
        if (this.app.scene13War?.isActive?.()) return this.app.scene13War;
        if ((this.app as any).navalWar?.isActive?.()) return (this.app as any).navalWar;
        return this.app.scene13War;
    }
    private battleOn(): boolean { return this.war()?.isActive?.() === true; }
    private playerSideInBattle(): 0 | 1 | null {
        const w = this.war();
        if (!w || !this.battleOn()) return null;
        if (typeof w.getPlayerSide === 'function') return w.getPlayerSide();
        return w.hasPlayerHero?.() ? 0 : null;
    }
    /** 1(乱入者) / 2(维序者) 映射到本场战术模式的 0(攻方) / 1(守方) */
    private repSideOfChoice(choice: '1' | '2'): 0 | 1 {
        const pSide: 0 | 1 = this.playerSideInBattle() ?? 0;
        return choice === '1' ? pSide : ((1 - pSide) as 0 | 1);
    }
    /** 本场战术模式的 0(攻方) / 1(守方) 对应的是乱入者还是维序者 */
    private repNameOfSide(side: 0 | 1): string {
        const pSide: 0 | 1 = this.playerSideInBattle() ?? 0;
        return side === pSide ? '乱入者' : '维序者';
    }
    private playerSixBlockReason(_six: TacticalSixSet): string | null {
        if (!this.battleOn()) return '现在没在打仗，等下一仗';
        // 🔴 [2026-11-07 主人定·战术模式「乱入者 VS 维序者」] 双方观众皆可用 1 积分释放六计（攻 胜 敌 混 并 败）
        return null;
    }
    private sideName(side: 0 | 1): string {
        return `${side === 0 ? '攻方' : '守方'}${this.sideFaction(side)}`;
    }
    private sideFaction(side: 0 | 1): string {
        const fid = this.war()?.sideDisplayFactionId?.(side);
        return (fid ? this.app.cityManager?.getFactionName(fid) : '') || '';
    }
    private note(msg: string): string {
        if (this.log[this.log.length - 1] !== msg) {
            this.log.push(msg);
            if (this.log.length > 8) this.log.shift();
        }
        return msg;
    }
    private acct(id: string, name: string): OrderAcct {
        this.rollDay();
        let a = this.orders.get(id);
        if (!a) {
            a = { name, n: 0, seen: 0, lastEarn: 0, day: '', earned: 0, earnDay: '' };
            this.orders.set(id, a);
        }
        a.name = name;
        return a;
    }
    /** 第一次在本频道说话送 NEWCOMER_BONUS；之后每天第一次说话送 RETURN_BONUS（老观众隔天回来的理由） */
    private welcome(id: string, name: string, a: OrderAcct, isNew: boolean): void {
        const t = this.today();
        if (a.day === t) return;
        a.day = t;
        this.lastChatEarnAt.set(id, Date.now());
        const bonus = isNew ? NEWCOMER_BONUS : RETURN_BONUS;
        this.addGift(id, name, bonus);   // 礼包不计每日上限：新人进门就能玩
        this.note(isNew ? `欢迎 ${name} 入营，送 ${bonus} 积分` : `${name} 今日回营，送 ${bonus} 积分`);
        this.save();
    }
    /** 礼包加分：绕开每日上限（首次来 / 每天回来），但库存照样封在 ORDER_CAP */
    private addGift(id: string, name: string, n: number): void {
        const a = this.acct(id, name);
        const before = a.n;
        a.n = Math.max(a.n, Math.min(ORDER_CAP, a.n + n));
        a.lastEarn = Date.now();
        if (before < ORDERS_PER_CAST && a.n >= ORDERS_PER_CAST) this.note(`${name} 有 ${a.n} 积分，可以放计了`);
        this.fulfillWanted(id, name);
    }
    /** 在场发分：每 PRESENCE_PAY_MS 一次，只在唯一记账页发（别的页面拿到的是账本副本） */
    private payPresence(): void {
        const now = Date.now();
        if (now - this.lastPresencePayAt < PRESENCE_PAY_MS) return;
        this.lastPresencePayAt = now;
        if (!this.isAccountingPage() || this.presentIds().length === 0) return;
        const k = this.grantPresent(PRESENCE_PAY);
        this.note(`在场 ${k} 人各 +${PRESENCE_PAY} 积分（每 ${PRESENCE_PAY_MS / 60_000} 分钟）`);
    }
    /**
     * 观众所属阵营（持久化在 `this.sides`：1＝乱入者，0 或未设置＝维序者）：
     * 🔴 [2026-11-07 主人定「把观众默认改为维序者，除非投1，才能成为乱入者，而且不用次次投，投一次，以后都是」]
     */
    private viewerCampChoice(id: string): '1' | '2' {
        return this.sides.get(id) === 1 ? '1' : '2';
    }
    private setViewerCampChoice(id: string, choice: '1' | '2'): void {
        this.sides.set(id, choice === '1' ? 1 : 0);
        this.save();
    }

    // ── 押注（统一只用「积分」orders 一本账：乱入者 VS 维序者 / 平局） ──
    /**
     * 每局开窗（进入战术模式开场 9 秒选阵/押注窗口，或快速对决选人期）：清掉上一局注单。
     * 🔴 [2026-11-07 主人定·统一积分一本账] 只给在场积分不足 3 分的人保底补足到 3 积分，有余粮的老观众不补，杜绝刷分通胀。
     */
    public beginBetRound(): void {
        this.betOpen = true;
        this.betStakes = [0, 0, 0];
        this.bets.clear();
        if (this.isAccountingPage()) {
            for (const [id, name] of this.presentIds()) {
                const a = this.acct(id, name);
                if (a.n < BET_START_CHIPS) a.n = BET_START_CHIPS;
            }
        }
        this.save();
        this.note(`⚔️ 乱入者 VS 维序者（发「1」助乱入者、「2」助维序者，每发一次随机放一计；9秒押注：发「押1 分」「押2 分」「押平 分」）`);
    }

    /** 9 秒倒计时结束，开战封盘：之后不再接注，进入交战放计阶段 */
    public sealBetRound(): void {
        if (!this.betOpen) return;
        this.betOpen = false;
        const [a, d, t] = this.betStakes;
        this.save();
        if (a + d + t <= 0) return;
        this.note(`押注截止：乱入者 ${a} / 维序者 ${d} / 平局 ${t} 积分，发「1」「2」或六字（攻 胜 敌 混 并 败）放计助阵！`);
        speechAnnouncer.announceViewerNotice(`押注截止，乱入者${a}分，维序者${d}分，平局${t}分`);
    }

    /** 下注窗口是否开着（面板用） */
    public isBetOpen(): boolean { return this.betOpen; }
    public getBetStakes(): [number, number, number] { return [...this.betStakes] as [number, number, number]; }

    private handleBetCommand(
        id: string, name: string, side: BetSide, amount: number, eventId: string, pubMs: number,
    ): string {
        const now = Date.now();
        const sideName = BET_SIDE_NAMES[side];
        if (!this.betOpen) {
            this.recordCmd(eventId, id, name, 'bet', `${sideName}${amount}`, amount, pubMs, now, 'rejected', '已封盘');
            this.notifyViewerVoice(id, `${name}，开局9秒押注已截止，请发六字放计或等下一仗`);
            return this.note(`${name}：开局9秒押注已截止，当前可发 攻 胜 敌 混 并 败（1分）助阵`);
        }
        const list = this.bets.get(id) ?? [];
        const myStaked = list.reduce((sum, b) => sum + b.amount, 0);
        if (myStaked + amount > BET_MAX_PER_BATTLE) {
            this.recordCmd(eventId, id, name, 'bet', `${sideName}${amount}`, amount, pubMs, now, 'rejected', `超过单场押注上限${BET_MAX_PER_BATTLE}`);
            this.notifyViewerVoice(id, `${name}，单场最多押${BET_MAX_PER_BATTLE}积分`);
            return this.note(`${name}：单场最多押 ${BET_MAX_PER_BATTLE} 积分（已押 ${myStaked} 分）`);
        }
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < amount) {
            this.recordCmd(eventId, id, name, 'bet', `${sideName}${amount}`, amount, pubMs, now, 'rejected', '积分不足');
            this.notifyViewerVoice(id, `${name}，可用积分${avail}，不够押${amount}分`);
            return this.note(`${name}：押【${sideName}】需 ${amount} 积分，现有可用 ${avail} 积分`);
        }
        if (side === 'att') this.sides.set(id, 1);
        else if (side === 'def') this.sides.set(id, 0);
        a.n -= amount;
        list.push({ name, side, amount });
        this.bets.set(id, list);
        this.betStakes[side === 'att' ? 0 : side === 'def' ? 1 : 2] += amount;
        this.recordCmd(eventId, id, name, 'bet', `${sideName}${amount}`, amount, pubMs, now, 'queued');
        if (side !== 'draw') this.greetFirstJoin(id, name, side === 'att' ? '1' : '2');
        this.save();
        this.note(`${name} 押【${sideName}】${amount} 积分（余 ${a.n} 分）`);
        return `${name} 押【${sideName}】${amount} 积分，余 ${a.n} 分`;
    }

    /**
     * 战术模式分出胜负回调（由 GameAppCombatHooks.startScene13War 的 onDecision 触发）：
     * 将攻/守/平结果映射为 乱入者('att') / 维序者('def') / 平局('draw') 并结算积分。
     */
    public onTacticalBattleDecision(winner: 'attacker' | 'defender' | 'draw'): void {
        if (this.duel) return; // 快速对决由 QuickBattle.ts 自行调用 settleBetRound
        if (!this.betOpen && this.bets.size === 0) return;
        let result: BetSide;
        if (winner === 'draw') {
            result = 'draw';
        } else {
            const winSide: 0 | 1 = winner === 'attacker' ? 0 : 1;
            const pSide: 0 | 1 = this.playerSideInBattle() ?? 0;
            result = winSide === pSide ? 'att' : 'def';
        }
        this.settleBetRound(result);
    }

    /**
     * 结算本局：开乱入者('att') / 开维序者('def') / 开平局('draw')。
     * 平局时：押乱入者与押维序者的本金全额退回，押平局按 1 赔 8 派彩（含退本金）。
     */
    public settleBetRound(result: BetSide): void {
        const stakes = this.betStakes[0] + this.betStakes[1] + this.betStakes[2];
        let winners = 0;
        let payout = 0;
        for (const [id, list] of this.bets) {
            let back = 0;
            for (const b of list) {
                if (result === 'draw') {
                    back += b.side === 'draw'
                        ? b.amount + Math.floor(b.amount * BET_TIE_MULT)   // 押平局：本金 + 8 倍
                        : b.amount;                                        // 押乱入者/维序者：平局退本金
                } else if (b.side === result) {
                    back += b.amount + Math.floor(b.amount * (result === 'att' ? BET_BANKER_MULT : BET_PLAYER_MULT));
                }
            }
            if (back <= 0) continue;
            const a = this.acct(id, list[0].name);
            a.n = Math.min(ORDER_CAP, a.n + back);
            winners++;
            payout += back;
        }
        const label = BET_SIDE_NAMES[result];
        this.bets.clear();
        this.betStakes = [0, 0, 0];
        this.betOpen = false;
        this.save();
        if (stakes <= 0) return;
        this.note(`战局揭晓【${label}】：${winners} 人中注，共赢回 ${payout} 积分`);
        speechAnnouncer.announceViewerNotice(`战局揭晓，${label}获胜，${winners}人赢得积分`);
    }

    /** 这一局中途退出未分胜负：注单原数退回积分，不算输赢 */
    public refundBetRound(): void {
        let back = 0;
        for (const [id, list] of this.bets) {
            const total = list.reduce((s, b) => s + b.amount, 0);
            if (total <= 0) continue;
            const a = this.acct(id, list[0].name);
            a.n = Math.min(ORDER_CAP, a.n + total);
            back += total;
        }
        this.bets.clear();
        this.betStakes = [0, 0, 0];
        this.betOpen = false;
        this.save();
        if (back > 0) this.note(`本场未分胜负提前结束，${back} 押注积分已原数退回`);
    }

    /**
     * 挣积分（发言 / 在场 / 点赞 / 订阅 / 在线新高）。
     * 🔴 [2026-11-07 主人令「积分筹码不要滥用…不要通胀」] 每天最多挣 DAILY_EARN_CAP：
     *    老观众挂一天也只能多 15 分，剩下的靠每天登录礼包和真实互动；新人礼包另走 addGift，不受此限。
     */
    private addOrders(id: string, name: string, n: number, bulk = false): void {
        const a = this.acct(id, name);
        const t = this.today();
        if (a.earnDay !== t) { a.earnDay = t; a.earned = 0; }
        const left = Math.max(0, DAILY_EARN_CAP - (a.earned ?? 0));
        if (left <= 0) return;                       // 今天的份已经挣满，不再加
        const give = Math.min(n, left);
        const before = a.n;
        a.n = Math.max(a.n, Math.min(ORDER_CAP, a.n + give));
        a.earned = (a.earned ?? 0) + give;
        a.lastEarn = Date.now();
        if (!bulk && before < ORDERS_PER_CAST && a.n >= ORDERS_PER_CAST) this.note(`${name} 攒够 ${ORDERS_PER_CAST} 积分，可以放计了`);
        this.fulfillWanted(id, name);
    }
    private presentIds(): [string, string][] {
        const cut = Date.now() - PRESENT_MS;
        const ids: [string, string][] = [];
        for (const [id, a] of this.orders) if (a.seen > cut) ids.push([id, a.name]);
        return ids;
    }
    private grantPresent(n: number): number {
        const ids = this.presentIds();
        for (const [id, name] of ids) this.addOrders(id, name, n, true);
        this.save();
        return ids.length;
    }
    /**
     * 点赞一档要多少个：在线人数的十分之一，夹在 1~50；还不知道人数时按 5。
     * 🔴 [2026-10-27] 原先最少 5 个一档：个位数观众的直播间一场也凑不满一档，谁都拿不到积分、什么都放不了。
     *    每个账号只能点一次赞（只认超过历史最高的部分），小直播间一赞一分不会被刷。
     */
    private likeStep(): number {
        // 在线人数读不到（小直播间 YouTube 常报 0）按小直播间算：一个赞一档
        return this.viewers > 0 ? Math.min(50, Math.max(1, Math.ceil(this.viewers / 10))) : 1;
    }
    private addLikes(d: number): void {
        const step = this.likeStep();
        this.likeProg += d;
        let fires = 0;
        while (this.likeProg >= step) { this.likeProg -= step; fires++; }
        if (fires <= 0) return;
        const each = Math.min(fires, GOAL_BONUS_MAX);
        const k = this.grantPresent(each);
        this.note(`点赞新增 ${step} 个！在场 ${k} 人各 +${each} 积分`);
    }

    private fulfillWanted(id: string, name: string): void {
        const word = this.wanted.get(id);
        if (!word || !this.battleOn()) return;
        if (this.playerSixBlockReason(SIX_BY_WORD[word]) || !this.canAffordSix(id)) return;
        this.wanted.delete(id);
        this.request(id, name, word, `wanted:${++this.commandSeq}`, Date.now());
    }
    private canAffordSix(id: string): boolean {
        const avail = (this.orders.get(id)?.n ?? 0) - this.reservedOrders(id);
        return avail >= ORDERS_PER_CAST && !this.hasFreeQueued(id);
    }
    private hasFreeQueued(id: string): boolean {
        return this.queue.some((q) => q.uid === id);
    }
    private request(id: string, name: string, word: string, eventId = '', pubMs = Date.now()): string {
        const now = Date.now();
        // 🔴 [2026-11-07 主人定「把观众默认改为维序者，除非投1，才能成为乱入者，而且不用次次投，投一次，以后都是」]
        //    观众未投过 1 时一律按「维序者」入队；投过一次 1（投1/1/乱入者）后永久按「乱入者」入队。
        const unsubscribed = !this.sides.has(id);
        const choice = this.viewerCampChoice(id);
        if (unsubscribed) this.sides.set(id, 0);
        const side: 0 | 1 = this.repSideOfChoice(choice);
        const repLabel = choice === '1' ? '乱入者' : '维序者';
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (unsubscribed) this.notifyViewerVoice(id, `${name}，默认属维序者，发 投1 可成为乱入者`);
        if (avail < ORDERS_PER_CAST) {
            this.wanted.set(id, word);
            this.recordCmd(eventId, id, name, 'skill_six', word, ORDERS_PER_CAST, pubMs, now, 'rejected', '积分不足');
            this.save();
            this.notifyViewerVoice(id, `${name}，放${word}计需要${ORDERS_PER_CAST}积分，攒够自动释放`);
            return this.note(`${name}：放【${word}】需 ${ORDERS_PER_CAST} 积分，现有 ${avail}/${ORDERS_PER_CAST}`);
        }
        // 入队时不提前扣分，等技能真正释放时再扣
        const item: QueuedCast = { uid: id, viewer: name, side, six: SIX_BY_WORD[word], word, paid: false, deducted: false };
        this.queue.push(item);
        this.recordCmd(eventId, id, name, 'skill_six', word, ORDERS_PER_CAST, pubMs, now, 'queued');
        this.greetFirstJoin(id, name, choice, word);
        this.save();
        // 排位按本阵营队列算（乱入者与维序者各排各的）
        const laneQueue = this.queue.filter((q) => q.side === side);
        const lastAt = this.lastFreeCastAtBySide[side];
        if (laneQueue.length > 1 || Date.now() - lastAt < FREE_CAST_GAP_MS || (this.war()?.getDeployRemainingSec?.() ?? 0) > 0) {
            const pos = laneQueue.indexOf(item) + 1;
            this.notifyViewerVoice(id, `${name}，${word}计已排队第${pos}位，开战释放时再扣积分`);
        }
        return this.note(`${name} 花 ${ORDERS_PER_CAST} 积分助【${repLabel}】点【${word}】，本阵排第 ${laneQueue.indexOf(item) + 1}`);
    }
    private credit(id: string, name: string, cents: number) {
        this.rollDay();
        const w = this.wallets.get(id) ?? { name, cents: 0 };
        w.name = name;
        w.cents += cents;
        this.wallets.set(id, w);
        return w;
    }

    private syncBattleLifecycle(): boolean {
        const active = this.battleOn();
        if (!this.wasActive && active) {
            this.battleId++;
            this.battleStartedAtMs = Date.now();
            this.recentBattleCasts = [];
            this.wasActive = true;
            // 进入战术模式立即开启 9 秒选阵/押注窗口（快速对决在选人阶段已提前开启）
            if (!this.duel) {
                this.beginBetRound();
            }
            return true;
        }
        const hasBattleState = this.wasActive || this.queue.length > 0 || this.wanted.size > 0;
        if (hasBattleState && !active) {
            this.endBattle();
        }
        this.wasActive = active;
        return active;
    }

    private tick(): void {
        this.payPresence();
        this.checkMarshalTargetValidity();
        this.checkEmperorCoerceValidity();
        const active = this.syncBattleLifecycle();
        if (!active) return;
        // 战术模式开局 9 秒列阵倒计时结束时自动封盘，进入交战放计阶段
        if (!this.duel && this.betOpen && (this.war()?.getDeployRemainingSec?.() ?? 0) <= 0) {
            this.sealBetRound();
        }
        this.tickCastQueue();
    }
    /**
     * 六计队列出队（乱入者与维序者两边各排各的队、各自 2 秒一计）。
     */
    private tickCastQueue(): void {
        if (this.queue.length === 0) return;
        const lanes: (0 | 1)[] = [0, 1];
        for (const lane of lanes) {
            const idx = this.queue.findIndex((q) => q.side === lane);
            if (idx < 0) continue;
            const head = this.queue[idx];
            const lastAt = this.lastFreeCastAtBySide[lane];
            if (Date.now() - lastAt < FREE_CAST_GAP_MS) continue;
            const side: 0 | 1 = head.side;
            const r = this.war()!.castViewerSkill(side, head.six, head.viewer, false);
            if (r === 'wait' || r === 'closed') continue;   // 演出闸同时只放一计或开局9秒尚未结束：等下一 tick
            this.queue.splice(idx, 1);
            if (!head.paid && head.deducted === false) {
                const a = this.acct(head.uid, head.viewer);
                a.n = Math.max(0, a.n - ORDERS_PER_CAST);
                head.deducted = true;
            }
            const now = Date.now();
            this.recentBattleCasts.push({
                uid: head.uid,
                viewer: head.viewer,
                cost: ORDERS_PER_CAST,
                label: `${head.word}计`,
                castAtMs: now,
            });
            this.save();
            this.lastFreeCastAtBySide[lane] = now;
            this.lastFreeCastAt = now;
            const skillName = this.war()!.lastSkillNameOf(side);
            const repLabel = this.repNameOfSide(side);
            this.note(`${head.viewer} 助【${repLabel}】（${this.sideName(side)}）施展【${skillName}】`);
            this.report({ viewer: head.viewer, side, six: head.six, paid: false, outcome: 'cast', skillName });
            this.fulfillWanted(head.uid, head.viewer);
        }
    }
    private endBattle(): void {
        const now = Date.now();
        const foughtMs = this.battleStartedAtMs > 0 ? now - this.battleStartedAtMs : 0;
        // 若战斗未经过正常胜负回调而中途退出，原数退回本场尚未结算的押注积分
        if (!this.duel && (this.betOpen || this.bets.size > 0)) {
            this.refundBetRound();
        }
        // 战斗收尾 6 秒内刚放出的技能（受直播画面延迟影响）：自动原数退回积分并语音告知
        for (const c of this.recentBattleCasts) {
            if (c.cost > 0 && now - c.castAtMs <= LATE_CAST_REFUND_WINDOW_MS) {
                const a = this.acct(c.uid, c.viewer);
                a.n = Math.min(ORDER_CAP, a.n + c.cost);
                this.note(`${c.viewer} 的【${c.label}】赶上战斗收尾，${c.cost} 积分已自动退回`);
                this.notifyViewerVoice(c.uid, `${c.viewer}，刚放的${c.label}赶上战斗结束，${c.cost}积分已退回`, true);
            }
        }
        this.recentBattleCasts = [];
        for (const q of this.queue) this.voidCast(q);
        this.queue = [];
        this.lastFreeCastAt = 0;
        this.lastFreeCastAtBySide = [0, 0];
        this.lastBattleEndedAtMs = now;
        this.battleStartedAtMs = 0;
        this.wanted.clear();
        // 🔴 [2026-11-07 主人令「不要通胀」] 战术战奖励加了 10 分钟冷却：
        //    即时战斗每局 3～5 分钟，原来「每局结束在场各 +1」＝每局白送一分，一天能送出几百。
        if (foughtMs >= TACTICAL_BATTLE_REWARD_MIN_MS && this.isAccountingPage()
            && now - this.lastTacticalRewardAt >= TACTICAL_REWARD_GAP_MS) {
            this.lastTacticalRewardAt = now;
            const k = this.grantPresent(1);
            if (k > 0) this.note(`本场战术战结束，在场 ${k} 人各 +1 积分`);
        }
        this.save();
    }
    private voidCast(q: QueuedCast): void {
        if (q.paid) this.credit(q.uid, q.viewer, PRICE_PER_CAST);
        else if (q.deducted !== false) {
            const a = this.acct(q.uid, q.viewer);
            a.n = Math.min(ORDER_CAP, a.n + ORDERS_PER_CAST);
        }
        this.note(`${q.viewer} 的【${q.word}】没轮到，这一仗结束了，积分未扣`);
        this.notifyViewerVoice(q.uid, `${q.viewer}，战斗结束，排队的${q.word}计未扣积分`, true);
        this.report({ viewer: q.viewer, side: q.side, six: q.six, paid: q.paid, outcome: 'void' });
    }
    private report(r: ViewerCastResult): void { this.onResult?.(r); }

    private today(): string {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }
    /**
     * 跨天只重置改名起拍价和投靠竞价，**积分不清**。
     * 🔴 [2026-10-27] 原先零点清空积分：晚上开播常跨零点，在场观众会当场丢光积分；
     *    积分现在只来自点赞/订阅/在线新高，攒下来的积分正是老观众下次再来的理由。
     *    跨天时还挂着的投靠出价原数退回（原先直接丢掉，积分白扣）。
     */
    private rollDay(): void {
        const t = this.today();
        if (this.day !== t) {
            this.day = t;
            this.renameHighestBid = 0;
            this.renameHistory = [];
            this.joinHighestBid = 0;
            this.joinLastLabel = '';
            this.prevJoinHighestBid = 0;
            const jb = this.activeJoinBid;
            this.activeJoinBid = null;
            if (jb) {
                const a = this.acct(jb.uid, jb.viewer);
                a.n = Math.min(ORDER_CAP, a.n + jb.bid);
            }
        }
    }

    public exportLedger(): ViewerLedger {
        return {
            version: 1,
            revision: this.revision,
            day: this.day,
            wallets: Object.fromEntries([...this.wallets].filter(([, w]) => w.cents > 0)),
            // 0 分但说过话的也留着：认得出「第一次来」，刷新页面后在场不断
            orders: Object.fromEntries([...this.orders].filter(([, a]) => a.n > 0 || a.day).map(([id, a]) => [id, {
                name: a.name, n: a.n, ...(a.seen > 0 ? { seen: a.seen } : {}), ...(a.day ? { day: a.day } : {}),
                ...(a.earned ? { earned: a.earned } : {}), ...(a.earnDay ? { earnDay: a.earnDay } : {}),
            }])),
            handled: [...this.handled],
            queue: this.queue.map((q) => ({ ...q })),
            sides: [...this.sides],
            wanted: [...this.wanted],
            renameHighestBid: this.renameHighestBid,
            renameHistory: this.renameHistory.map((r) => ({ ...r })),
            blockedNames: getBlockedLiveNames(),
            activeJoinBid: this.activeJoinBid ? { ...this.activeJoinBid } : null,
            joinHighestBid: this.joinHighestBid,
            joinLastLabel: this.joinLastLabel,
            experimentalSupport: { ...this.experimentalSupport },
            chips: Object.fromEntries([...this.chips]
                .filter(([, c]) => c.n > 0)
                .map(([id, c]) => [id, { name: c.name, n: c.n }])),
        };
    }

    /** 服务端账本是唯一权威副本；带单调 revision 防旧快照倒灌，导入时不回传避免保存死循环。 */
    public hydrateLedger(ledger: ViewerLedger): void {
        if (!ledger || ledger.version !== 1) return;
        const incomingRev = typeof ledger.revision === 'number' && Number.isSafeInteger(ledger.revision) ? ledger.revision : 0;
        if (this.revision > 0 && ledger.day === this.day && incomingRev > 0 && incomingRev < this.revision) {
            return;
        }
        this.revision = Math.max(this.revision, incomingRev);
        this.wallets.clear();
        this.orders.clear();
        this.handled = new Set(Array.isArray(ledger.handled) ? ledger.handled.slice(-HANDLED_CAP) : []);
        hydrateBlockedLiveNames(ledger.blockedNames);
        for (const [id, w] of Object.entries(ledger.wallets ?? {})) {
            if (Number.isFinite(w.cents) && w.cents > 0) this.wallets.set(id, { name: String(w.name || '观众'), cents: Math.floor(w.cents) });
        }
        // 积分跨天保留（见 rollDay）
        const nowMs = Date.now();
        for (const [id, o] of Object.entries(ledger.orders ?? {})) {
            const day = typeof o.day === 'string' ? o.day : '';
            if (isChatBot(o.name)) continue;   // 修复前混进账本的机器人账号，读账本时清掉
            if (Number.isFinite(o.n) && (o.n > 0 || day)) {
                const seen = Number.isFinite(o.seen) && Number(o.seen) > 0 ? Math.min(nowMs, Number(o.seen)) : 0;
                const earned = Number.isFinite(o.earned) ? Math.max(0, Math.floor(Number(o.earned))) : 0;
                const earnDay = typeof o.earnDay === 'string' ? o.earnDay : '';
                this.orders.set(id, { name: String(o.name || '观众'), n: Math.min(ORDER_CAP, Math.max(0, Math.floor(o.n))), seen, lastEarn: 0, day, earned, earnDay });
            }
        }
        // 投靠目标只存在于这一页的游戏里：刷新或换页接管后，游戏里已没有这趟行程，账上挂着的出价原数退回
        // （原先照样挂着，玩家之后随便投了谁都会把这笔积分算成「已成功投效」）
        const jb = ledger.activeJoinBid;
        this.activeJoinBid = null;
        if (jb && typeof jb.uid === 'string' && Number.isSafeInteger(jb.bid) && jb.bid > 0) {
            const prev = this.orders.get(jb.uid);
            this.orders.set(jb.uid, {
                name: prev?.name ?? cleanViewerName(String(jb.viewer || '观众')),
                n: Math.min(ORDER_CAP, (prev?.n ?? 0) + jb.bid),
                seen: prev?.seen ?? 0,
                lastEarn: 0,
                day: prev?.day ?? '',
                earned: prev?.earned,
                earnDay: prev?.earnDay,
            });
        }
        if (ledger.day === this.today()) {
            this.day = ledger.day;
            this.renameHighestBid = Number.isSafeInteger(ledger.renameHighestBid) ? Math.max(0, Number(ledger.renameHighestBid)) : 0;
            this.joinHighestBid = Number.isSafeInteger(ledger.joinHighestBid) ? Math.max(0, Number(ledger.joinHighestBid)) : 0;
            this.joinLastLabel = typeof ledger.joinLastLabel === 'string' ? ledger.joinLastLabel : '';
            this.renameHistory = (Array.isArray(ledger.renameHistory) ? ledger.renameHistory : [])
                .filter((r) => r && typeof r.uid === 'string' && typeof r.appliedName === 'string' && Number.isSafeInteger(r.bid) && r.bid > 0)
                .slice(-50)
                .map((r) => ({
                    uid: r.uid,
                    viewer: cleanViewerName(String(r.viewer || '观众')),
                    bid: r.bid,
                    prevName: String(r.prevName || PLAYER_HERO_NAME),
                    appliedName: String(r.appliedName),
                    at: Number.isFinite(r.at) ? r.at : 0,
                }));
        } else {
            this.day = this.today();
            this.renameHighestBid = 0;
            this.joinHighestBid = 0;
            this.joinLastLabel = '';
            this.renameHistory = [];
        }
        if (ledger.experimentalSupport && typeof ledger.experimentalSupport === 'object') {
            const ex = ledger.experimentalSupport;
            this.experimentalSupport = {
                count: Math.max(0, Math.floor(Number(ex.count) || 0)),
                totalCents: Math.max(0, Math.floor(Number(ex.totalCents) || 0)),
                lastDonor: String(ex.lastDonor || ''),
                lastWhat: String(ex.lastWhat || ''),
            };
        }
        this.queue = (Array.isArray(ledger.queue) ? ledger.queue : []).filter((q) =>
            q && typeof q.uid === 'string' && (q.side === 0 || q.side === 1)
            && typeof q.word === 'string' && SIX_BY_WORD[q.word] === q.six && typeof q.paid === 'boolean',
        ).slice(0, 1000).map((q) => ({ ...q, viewer: cleanViewerName(String(q.viewer || '观众')) }));
        this.sides = new Map((Array.isArray(ledger.sides) ? ledger.sides : []).filter((x) =>
            Array.isArray(x) && typeof x[0] === 'string' && (x[1] === 0 || x[1] === 1),
        ));
        this.wanted = new Map((Array.isArray(ledger.wanted) ? ledger.wanted : []).filter((x) =>
            Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string'
            && !!SIX_BY_WORD[x[1]],
        ));
        // 下注筹码（第二本账）：跨页/刷新保留；注单只在本局有效，不进账本
        this.chips.clear();
        for (const [id, c] of Object.entries(ledger.chips ?? {})) {
            const n = Number(c?.n);
            if (Number.isFinite(n) && n > 0) {
                this.chips.set(id, { name: String(c?.name || '观众'), n: Math.min(BET_CHIP_CAP, Math.floor(n)) });
            }
        }
        const topRename = this.renameHistory[this.renameHistory.length - 1];
        if (topRename && this.app.playerHero?.autoPlan === 'melee') {
            const mod = moderateLiveName(topRename.appliedName);
            if (mod.ok) this.app.playerHero?.rename(mod.name);
        }
        this.writeCache();
    }

    private load(): void {
        this.day = this.today();
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as Partial<ViewerLedger>;
            this.hydrateLedger({
                ...s, version: 1, day: s.day || '', wallets: s.wallets || {}, orders: s.orders || {}, handled: s.handled || [],
            });
        } catch { /* 隐私模式或旧缓存损坏：等待服务端正式账本 */ }
    }
    private writeCache(): void {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(this.exportLedger())); } catch { /* 隐私模式 */ }
    }
    private save(): void {
        this.revision++;
        this.writeCache();
        this.onLedgerChange?.(this.exportLedger());
    }
}
