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
import { sixUnlockBlockReason } from '../player/PlayerLiveSkill';
import { CULTURE66_PORTRAIT_POOLS } from '../config/portrait_defaults';
import { style62OfCity } from '../player/PlayerQuestSystem';

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
const TRAD_TO_SIMP: Record<string, string> = {
    勝: '胜', 敵: '敌', 並: '并', 併: '并', 敗: '败', 戰: '战', 選: '选', 號: '号',
    莊: '庄', 閒: '闲', 註: '注',
};
function normalizeCommand(text: string): string {
    return text.normalize('NFKC').trim().replace(/[勝敵並併敗戰選號莊閒註]/g, (c) => TRAD_TO_SIMP[c] ?? c);
}

/** 玩家爆发技口令：技3 / 技 3；数字就是这次出的积分。 */
export function scoutBidOf(word: string): number | null {
    const m = word.match(/^技\s*([1-9]\d*)$/);
    if (!m) return null;
    const bid = Number(m[1]);
    return Number.isSafeInteger(bid) && bid > 0 ? bid : null;
}

/** 预留折算函数（供后续付费实验扩展与兼容校验使用；初期不参与技能扣款）。 */
export function scoutBidCents(bid: number): number {
    return Math.ceil(bid * PRICE_PER_CAST / ORDERS_PER_CAST);
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
export type BetSide = 'att' | 'def' | 'draw';
export const BET_BANKER_MULT = 0.95;
export const BET_PLAYER_MULT = 1;
export const BET_TIE_MULT = 8;
/** 每局开窗时把**快输光的人**补足到这个数（原「补足到 10」：每局白送 10 = 老观众永远输不完，筹码彻底通胀） */
export const BET_START_CHIPS = 3;
/** 第一次下注的新人本金（给足一局能押几把，输光了靠每局补的 3 慢慢回） */
export const BET_NEWCOMER_CHIPS = 10;
/** 筹码库存封顶：赢到 60 就到顶，剩下的留给下注去消耗 */
export const BET_CHIP_CAP = 60;
export const BET_SIDE_NAMES: Readonly<Record<BetSide, string>> = { att: '攻方', def: '守方', draw: '和' };

/** 下注口令：押1 10 / 押2 5 / 押和 3 / 押攻 10 / 押守 5（不写数目＝1） */
export function parseBetCommand(word: string): { side: BetSide; amount: number } | null {
    const m = word.match(/^(?:押|下注|买)\s*(攻|庄|守|闲|和|平|[12])\s*([1-9]\d*)?$/);
    if (!m) return null;
    const k = m[1];
    const side: BetSide = (k === '攻' || k === '庄' || k === '1') ? 'att'
        : (k === '守' || k === '闲' || k === '2') ? 'def' : 'draw';
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
export interface ViewerQueuedScoutCast {
    uid: string;
    viewer: string;
    bid: number;
    seq: number;
    ordersCost: number;
    centsCost: number;
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
    commandType: 'skill_burst' | 'skill_six' | 'rename' | 'join_choice' | 'bet' | 'pick_target' | 'pick_portrait';
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
    scoutQueue?: ViewerQueuedScoutCast[];
    sides?: [string, 0 | 1][];
    wanted?: [string, string][];
    scoutSeq?: number;
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
type QueuedScoutCast = ViewerQueuedScoutCast;
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
    private recentBattleCasts: { uid: string; viewer: string; cost: number; label: string; castAtMs: number }[] = [];
    private wallets = new Map<string, { name: string; cents: number }>();
    private wanted = new Map<string, string>();
    private handled = new Set<string>();
    private queue: QueuedCast[] = [];
    private scoutQueue: QueuedScoutCast[] = [];
    private scoutSeq = 0;
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
        if (this.activeJoinBid) {
            this.acct(this.activeJoinBid.uid, this.activeJoinBid.viewer).n = Math.min(
                ORDER_CAP,
                this.acct(this.activeJoinBid.uid, this.activeJoinBid.viewer).n + this.activeJoinBid.bid,
            );
            this.activeJoinBid = null;
        }
        this.save();
    }

    /** 普通聊天刷新在场（在场才吃每 3 分钟的分）；统一命令层解析查分、改名、投靠、玩家爆发技与玩家六计。 */
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

        // 0. 查自己的积分（聊天机器人看不到游戏账本，只能在画面上回 + 晓晓语音播报）
        if (word === '积分' || word === '查分') {
            const chips = this.chips.get(id)?.n ?? 0;
            this.notifyViewerVoice(id, `${name}，你现有${acc.n}积分、${chips}筹码`);
            return this.note(`${name} 现有 ${acc.n} 积分、${chips} 筹码（积分放计、筹码下注，两本账分开）`);
        }

        // 0.5 下注（百家乐式三门：押攻方/押守方/押和；用筹码，与放计积分分开）
        const betCmd = parseBetCommand(word);
        if (betCmd) {
            return this.handleBetCommand(id, name, betCmd.side, betCmd.amount, eventId, pubMs);
        }
        if (/^(?:押|下注|买)\s*\S*$/.test(word)) {
            this.notifyViewerVoice(id, `${name}，下注写法「押1 10」「押2 10」「押和 5」`);
            return this.note(`${name}：下注写法「押1 10」（攻方）/「押2 10」（守方）/「押和 5」`);
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

        // 2. 离职后战略地图投靠竞价（择落点永远是武将：斥候＝同文化势力→武将随机、探马＝同文化武将、
        //    先锋＝同文化武将＋全势力武将随机、将军起＝全图武将）
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
            const lines = list.map((t) => `目标${t.index}${t.name}(${t.factionName}·${t.distKm}km·兵${t.troops})`).join(' ');
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
        if (word === '像' || word === '图') {
            return this.note(this.portraitHint(name));
        }

        // 3. 玩家爆发技（技3 / 技4…，高价先放，同价 FIFO）
        const scoutBid = scoutBidOf(word);
        if (scoutBid !== null) {
            if (meta?.staleForBattle) {
                this.recordCmd(eventId, id, name, 'skill_burst', `技${scoutBid}`, scoutBid, pubMs, now, 'rejected', '迟到于上一场战斗');
                this.notifyViewerVoice(id, `${name}，上一仗刚结束，未扣积分`, true);
                return this.note(`${name}：上一仗迟到口令已忽略，未扣积分`);
            }
            const blocked = this.playerSkillBlockReason();
            if (blocked) {
                this.recordCmd(eventId, id, name, 'skill_burst', `技${scoutBid}`, scoutBid, pubMs, now, 'rejected', blocked);
                this.notifyViewerVoice(id, `${name}，${blocked}，未扣积分`);
                return this.note(`${name}：${blocked}`);
            }
            return this.requestScout(id, name, scoutBid, eventId, pubMs);
        }

        // 4. 玩家六计（固定 1 积分，不涨价，按先后顺序 FIFO；按官职阶梯解锁：斥候攻胜 / 探马+敌混 / 先锋将军+并败）
        const combo = word.match(/^([12])\s*(\S+)$/);
        if (combo && SIX_BY_WORD[combo[2]]) {
            if (meta?.staleForBattle) {
                this.recordCmd(eventId, id, name, 'skill_six', combo[2], ORDERS_PER_CAST, pubMs, now, 'rejected', '迟到于上一场战斗');
                this.notifyViewerVoice(id, `${name}，上一仗刚结束，未扣积分`, true);
                return this.note(`${name}：上一仗迟到口令已忽略，未扣积分`);
            }
            const blocked = this.playerSixBlockReason(SIX_BY_WORD[combo[2]]);
            if (blocked) {
                this.recordCmd(eventId, id, name, 'skill_six', combo[2], ORDERS_PER_CAST, pubMs, now, 'rejected', blocked);
                this.notifyViewerVoice(id, `${name}，${blocked}，未扣积分`);
                return this.note(`${name}：${blocked}`);
            }
            const reqSide: 0 | 1 = combo[1] === '1' ? 0 : 1;
            const playerSide = this.duel ? null : this.playerSideInBattle();
            if (playerSide !== null && reqSide !== playerSide) {
                return this.note(`${name}：全体观众共同操作玩家，只能为玩家所在的${this.sideName(playerSide)}放计`);
            }
            this.joinSide(id, playerSide ?? reqSide);
            word = combo[2];
        }
        if (word === '1' || word === '2') {
            // 🔴 [2026-11-07] 即时战斗：选边随时可发（选人画面那 30 秒没在打仗也算），下一仗按选的边生效
            if (!this.battleOn() && !this.duel) return this.note(`${name}：现在没在打仗，等下一仗`);
            const playerSide = this.duel ? null : this.playerSideInBattle();
            const side: 0 | 1 = playerSide ?? (word === '1' ? 0 : 1);
            this.joinSide(id, side);
            return this.note(this.duel
                ? `${name} 已站到${word === '1' ? '攻方' : '守方'}，发六字（攻 胜 敌 混 并 败）放计`
                : `${name} 已随玩家站在${this.sideName(side)}，直接发六计或 技3 即可`);
        }
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
            targets: { index: number; name: string; factionName: string; distKm: number; troops: number }[];
            targetBid: number;
            targetLabel: string;
            targetLocked: boolean;
            cultureList: { index: number; culture: string; count: number }[];
            pool: string[];
            culture: string | null;
            pickBid: number;
            pickIndex: number;
        };
    } {
        // 排行只排在场的人（10 分钟内说过话）：不让几天前来过的人一直占着榜
        const presentCut = Date.now() - PRESENT_MS;
        const top = [...this.orders.values()]
            .filter((a) => a.seen > presentCut && (a.n > 0 || a.lastEarn > 0))
            .sort((x, y) => (y.n - x.n) || (y.lastEarn - x.lastEarn))
            .slice(0, 6)
            .map((a) => ({ name: a.name, n: a.n }));
        let a = 0, d = 0;
        for (const s of this.sides.values()) { if (s === 0) a++; else d++; }
        const joinCandidates = (this.app.playerQuests?.getLiveJoinCandidates?.() ?? [])
            .map((c) => ({ index: c.index, label: c.label, kind: c.kind }));
        const rankId = this.app.playerHero?.getPeakRank().id;
        const joinScope = rankId === 'scout' ? '同文化势力（武将随机）'
            : rankId === 'outrider' ? '同文化武将（指定）'
                : rankId === 'vanguard' ? '同文化武将（指定）＋全部势力（武将随机）'
                    : '全图武将（指定）';
        return {
            on: this.battleOn(),
            names: [this.sideName(0), this.sideName(1)],
            counts: [a, d],
            queue: [
                ...this.scoutQueue.map((q) => `${q.viewer} 玩家技 ${q.bid}分`),
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
                ...this.scoutQueue.map((q) => ({ name: q.viewer, paid: false, label: `技${q.bid}` })),
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
                targets: this.marshalUnlocked()
                    ? this.marshalTargetList().map((t) => ({ index: t.index, name: t.name, factionName: t.factionName, distKm: t.distKm, troops: t.troops }))
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
        };
    }

    private notifyViewerVoice(uid: string, text: string, force = false): void {
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
        for (const q of this.scoutQueue) {
            if (q.uid === uid && q.deducted === false) sum += q.ordersCost;
        }
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
        hero.rename(mod.name);
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
            this.recordCmd(eventId, id, name, 'pick_portrait', `图${index}`, 0, pubMs, now, 'rejected', '还没选文化');
            return this.note(this.portraitHint(name));
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
        return this.note(`${name} 出 ${bid} 积分，军团下一个攻击目标定为【${hit.name}】（${hit.factionName}·${hit.distKm}km·驻军${hit.troops}）${refund}`);
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

    private war() { return this.app.scene13War; }
    private battleOn(): boolean { return this.war()?.isActive?.() === true; }
    private playerSideInBattle(): 0 | 1 | null {
        const w = this.war();
        if (!w || !this.battleOn()) return null;
        if (typeof w.getPlayerSide === 'function') return w.getPlayerSide();
        return w.hasPlayerHero?.() ? 0 : null;
    }
    private playerSkillBlockReason(): string | null {
        if (!this.battleOn()) return '现在没在打仗，等下一仗';
        // 🔴 [2026-11-07] 即时战斗没有公共玩家，「技N」爆发技是玩家本人的技，这一局不开
        if (this.duel) return '即时战斗里没有玩家技，直接发六字（攻 胜 敌 混 并 败）';
        const rank = this.app.playerHero?.getRank().id;
        if (!rank || rank === 'civilian') return '平民不能释放玩家技能，投靠武将成为斥候后开放';
        if (!this.war()?.hasPlayerHero()) return '玩家本人没有参加这一仗';
        return null;
    }
    private playerSixBlockReason(six: TacticalSixSet): string | null {
        if (!this.battleOn()) return '现在没在打仗，等下一仗';
        // 🔴 [2026-11-07 主人令「然后通过胜攻敌并混败六个字来释放技能」] 即时战斗里六字全开：
        //    没有公共玩家，也就没有官阶阶梯（斥候攻胜 / 探马敌混 / 先锋将军并败），只受积分与排队限制。
        if (this.duel) return null;
        const base = this.playerSkillBlockReason();
        if (base) return base;
        return sixUnlockBlockReason(this.app.playerHero?.getRank().id, six);
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
    private joinSide(id: string, side: 0 | 1): void { this.sides.set(id, side); this.save(); }

    // ── 下注（百家乐式，第二本账） ──────────────────────────
    /** 筹码账：第一次来下注的人给一份新人本金（之后只能靠每局补的 3 和赢回来的） */
    private chipAcct(id: string, name: string): { name: string; n: number } {
        let c = this.chips.get(id);
        if (!c) {
            c = { name, n: BET_NEWCOMER_CHIPS };
            this.chips.set(id, c);
        }
        c.name = name;
        return c;
    }

    /**
     * 每局开窗（回到选人画面时调）：清掉上一局注单。
     * 🔴 [2026-11-07 主人令「让老玩家消耗更多，不要通胀」] 只给**快输光的人**补到 3：
     *    原先是每局把每个在场者都补满 10 —— 等于每局白送 10，赢的留下、输的补满，筹码永远涨。
     *    现在带着库存来的老观众一分不补，输掉的只能靠下一局那 3 点慢慢回，长期下注必定缩水（赔率本身就带抽水）。
     */
    public beginBetRound(): void {
        this.betOpen = true;
        this.betStakes = [0, 0, 0];
        this.bets.clear();
        if (this.isAccountingPage()) {
            for (const [id, name] of this.presentIds()) {
                const c = this.chipAcct(id, name);
                if (c.n < BET_START_CHIPS) c.n = BET_START_CHIPS;
            }
        }
        this.save();
        this.note(`本局下注开着：押1 / 押2 / 押和（用筹码，和放计积分分开算），开战封盘`);
    }

    /** 开战封盘：之后不接注，等这一局结算 */
    public sealBetRound(): void {
        if (!this.betOpen) return;
        this.betOpen = false;
        const [a, d, t] = this.betStakes;
        this.save();
        if (a + d + t <= 0) return;
        this.note(`封盘：攻方 ${a} / 守方 ${d} / 和 ${t} 筹码`);
        speechAnnouncer.announceViewerNotice(`封盘，攻方${a}注，守方${d}注，和${t}注`);
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
            this.notifyViewerVoice(id, `${name}，本局已封盘，下一局开战前再押`);
            return this.note(`${name}：本局已封盘，等下一局开窗`);
        }
        const c = this.chipAcct(id, name);
        if (c.n < amount) {
            this.recordCmd(eventId, id, name, 'bet', `${sideName}${amount}`, amount, pubMs, now, 'rejected', '筹码不足');
            this.notifyViewerVoice(id, `${name}，只剩${c.n}筹码，下不了${amount}`);
            return this.note(`${name}：押${sideName}要 ${amount} 筹码，现有 ${c.n}`);
        }
        c.n -= amount;
        const list = this.bets.get(id) ?? [];
        list.push({ name, side, amount });
        this.bets.set(id, list);
        this.betStakes[side === 'att' ? 0 : side === 'def' ? 1 : 2] += amount;
        this.recordCmd(eventId, id, name, 'bet', `${sideName}${amount}`, amount, pubMs, now, 'queued');
        this.save();
        this.note(`${name} 押${sideName} ${amount} 筹码（余 ${c.n}）`);
        return `${name} 押${sideName} ${amount} 筹码，余 ${c.n}（攻方赔 0.95、守方赔 1、和赔 8）`;
    }

    /**
     * 结算本局：开攻方 / 开守方 / 开和。
     * 百家乐的和局规则：押攻/押守的本金原数退回，只有押和收 8 倍（本金另退）。
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
                        ? b.amount + Math.floor(b.amount * BET_TIE_MULT)   // 押和：本金 + 8 倍
                        : b.amount;                                        // 押庄/押闲：和局退本金
                } else if (b.side === result) {
                    back += b.amount + Math.floor(b.amount * (result === 'att' ? BET_BANKER_MULT : BET_PLAYER_MULT));
                }
            }
            if (back <= 0) continue;
            const c = this.chipAcct(id, list[0].name);
            c.n = Math.min(BET_CHIP_CAP, c.n + back);
            winners++;
            payout += back;
        }
        const label = BET_SIDE_NAMES[result];
        this.bets.clear();
        this.betStakes = [0, 0, 0];
        this.betOpen = false;
        this.save();
        if (stakes <= 0) return;
        this.note(`本局开${label}：${winners} 人中注，共得 ${payout} 筹码`);
        speechAnnouncer.announceViewerNotice(`本局开${label}，${winners}人中注`);
    }

    /** 这一局没打成（开战入口拒绝、两军没接上）：注单原数退回，不算输赢 */
    public refundBetRound(): void {
        let back = 0;
        for (const [id, list] of this.bets) {
            const total = list.reduce((s, b) => s + b.amount, 0);
            if (total <= 0) continue;
            const c = this.chipAcct(id, list[0].name);
            c.n = Math.min(BET_CHIP_CAP, c.n + total);
            back += total;
        }
        this.bets.clear();
        this.betStakes = [0, 0, 0];
        this.betOpen = false;
        this.save();
        if (back > 0) this.note(`这一局没打成，${back} 筹码已原数退回`);
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
        const scoutBid = scoutBidOf(word);
        if (scoutBid !== null) {
            if (this.playerSkillBlockReason()) return;
            if ((this.orders.get(id)?.n ?? 0) < scoutBid) return;
            this.wanted.delete(id);
            this.requestScout(id, name, scoutBid, `wanted:${++this.commandSeq}`, Date.now());
            return;
        }
        if (this.playerSixBlockReason(SIX_BY_WORD[word]) || !this.canAffordSix(id)) return;
        this.wanted.delete(id);
        this.request(id, name, word, `wanted:${++this.commandSeq}`, Date.now());
    }
    private canAffordSix(id: string): boolean {
        const avail = (this.orders.get(id)?.n ?? 0) - this.reservedOrders(id);
        return avail >= ORDERS_PER_CAST && !this.hasFreeQueued(id);
    }
    private requestScout(id: string, name: string, rawBid: number, eventId = '', pubMs = Date.now()): string {
        const now = Date.now();
        // 超过单次上限直接拒绝、分文不扣（原先悄悄按上限扣：手滑打「技999」会一下扣掉 100 积分）
        if (rawBid > MAX_SKILL_BID) {
            this.recordCmd(eventId, id, name, 'skill_burst', `技${rawBid}`, rawBid, pubMs, now, 'rejected', `超过单次上限${MAX_SKILL_BID}`);
            this.notifyViewerVoice(id, `${name}，单次最多出${MAX_SKILL_BID}积分，未扣积分`);
            return this.note(`${name}：单次最多出 ${MAX_SKILL_BID} 积分，未扣积分`);
        }
        const bid = rawBid;
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (avail < bid) {
            this.wanted.set(id, `技${bid}`);
            this.recordCmd(eventId, id, name, 'skill_burst', `技${bid}`, bid, pubMs, now, 'rejected', '积分不足，已挂起等待积分到账');
            this.save();
            this.notifyViewerVoice(id, `${name}，放玩家技需要${bid}积分，现有${avail}分，攒够自动释放`);
            return this.note(`${name}：这次要 ${bid} 积分，现有积分 ${avail}/${bid}（在场每 ${PRESENCE_PAY_MS / 60_000} 分钟 +1，够了自动放）`);
        }
        // 入队时不提前扣分，等技能真正释放时再扣，避免排队等待或战斗收尾白扣积分
        const item: QueuedScoutCast = { uid: id, viewer: name, bid, seq: ++this.scoutSeq, ordersCost: bid, centsCost: 0, deducted: false };
        const beforeLowerBid = this.scoutQueue.findIndex((q) => q.bid < bid);
        if (beforeLowerBid < 0) this.scoutQueue.push(item);
        else this.scoutQueue.splice(beforeLowerBid, 0, item);
        this.recordCmd(eventId, id, name, 'skill_burst', `技${bid}`, bid, pubMs, now, 'queued');
        this.save();
        // 当场尝试释放一次：若因冷却/重整尚在排队，立即用晓晓语音告知观众「已排队，释放时再扣积分」
        this.tickScoutQueue();
        if (this.scoutQueue.includes(item)) {
            const pos = this.scoutQueue.indexOf(item) + 1;
            this.notifyViewerVoice(id, `${name}，玩家技已排第${pos}位，冷却结束后释放再扣积分`, true);
        }
        return this.note(`${name} 出 ${bid} 积分放玩家技，排第 ${Math.max(1, this.scoutQueue.indexOf(item) + 1)}`);
    }
    private hasFreeQueued(id: string): boolean {
        return this.queue.some((q) => q.uid === id);
    }
    private request(id: string, name: string, word: string, eventId = '', pubMs = Date.now()): string {
        const now = Date.now();
        // 🔴 [2026-11-07 主人令「观众起初可以选择攻击方或者是防守方」] 即时战斗里按**观众自己选的边**入队，
        //    不再被 playerSide 覆盖（这一局压根没有玩家）；没选过边的第一句话默认攻方，并回一句怎么选边。
        const side: 0 | 1 = this.duel ? (this.sides.get(id) ?? 0) : (this.playerSideInBattle() ?? this.sides.get(id) ?? 0);
        const unsubscribed = this.duel && !this.sides.has(id);
        this.sides.set(id, side);
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
        if (unsubscribed) this.notifyViewerVoice(id, `${name}，按攻方算，发 1 选攻方、2 选守方`);
        if (avail < ORDERS_PER_CAST) {
            this.wanted.set(id, word);
            this.recordCmd(eventId, id, name, 'skill_six', word, ORDERS_PER_CAST, pubMs, now, 'rejected', '积分不足');
            this.save();
            this.notifyViewerVoice(id, `${name}，放${word}计需要${ORDERS_PER_CAST}积分，攒够自动释放`);
            return this.note(`${name}：放【${word}】需 ${ORDERS_PER_CAST} 积分，现有 ${avail}/${ORDERS_PER_CAST}`);
        }
        // 入队时不提前扣分，等技能真正释放时再扣
        const item: QueuedCast = { uid: id, viewer: name, side, six: SIX_BY_WORD[word], word, paid: false, deducted: false };
        // 六计固定积分、不涨价，严格按先后顺序（FIFO）入队
        this.queue.push(item);
        this.recordCmd(eventId, id, name, 'skill_six', word, ORDERS_PER_CAST, pubMs, now, 'queued');
        this.save();
        // 排位按**本边队列**算（即时战斗两边各排各的）；普通模式就是整条队列
        const laneQueue = this.duel ? this.queue.filter((q) => q.side === side) : this.queue;
        const lastAt = this.duel ? this.lastFreeCastAtBySide[side] : this.lastFreeCastAt;
        if (laneQueue.length > 1 || Date.now() - lastAt < FREE_CAST_GAP_MS) {
            const pos = laneQueue.indexOf(item) + 1;
            this.notifyViewerVoice(id, `${name}，${word}计已排队第${pos}位，释放时再扣积分`);
        }
        return this.note(`${name} 花 ${ORDERS_PER_CAST} 积分点了【${word}】，按先后排第 ${laneQueue.indexOf(item) + 1}`);
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
            return true;
        }
        const hasBattleState = this.wasActive || this.queue.length > 0 || this.scoutQueue.length > 0 || this.wanted.size > 0
            // 🔴 [2026-11-07] 即时战斗里观众在**选人画面那 30 秒**就能选边（此时还没开打）；
            //    sides 若算作「战斗状态」，这一选边就会被当成「上一仗收尾」立刻清掉（实测：选完就丢）。
            || (!this.duel && this.sides.size > 0);
        if (hasBattleState && !active) {
            this.endBattle();
        }
        this.wasActive = active;
        return active;
    }

    private tick(): void {
        this.payPresence();
        this.checkMarshalTargetValidity();
        const active = this.syncBattleLifecycle();
        if (!active) return;
        this.tickScoutQueue();
        this.tickCastQueue();
    }
    /**
     * 六计队列出队。
     * 🔴 [2026-11-07 主人令「观众起初可以选择攻击方或者是防守方」] 即时战斗里**两边各排各的队、各自 2 秒一计**：
     *    原来是一条全局队列 + 一个全局 2 秒闸，一边人多的观众刷起来会把另一边的计全堵在队里进不去。
     *    普通模式（战略局里公共玩家那一套）仍是原来的单队列 + 全局闸，行为不变。
     */
    private tickCastQueue(): void {
        if (this.queue.length === 0) return;
        const duel = this.duel;
        const lanes: (0 | 1)[] = duel ? [0, 1] : [this.queue[0].side];
        for (const lane of lanes) {
            const idx = duel ? this.queue.findIndex((q) => q.side === lane) : 0;
            if (idx < 0) continue;
            const head = this.queue[idx];
            const lastAt = duel ? this.lastFreeCastAtBySide[lane] : this.lastFreeCastAt;
            if (Date.now() - lastAt < FREE_CAST_GAP_MS) continue;
            const side: 0 | 1 = duel ? head.side : (this.playerSideInBattle() ?? head.side);
            const r = this.war()!.castViewerSkill(side, head.six, head.viewer, false);
            if (r === 'wait' || r === 'closed') continue;   // 演出闸同时只放一计：另一边等下一 tick
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
            if (duel) this.lastFreeCastAtBySide[lane] = now;
            else this.lastFreeCastAt = now;
            const skillName = this.war()!.lastSkillNameOf(side);
            speechAnnouncer.announceViewerSkill(head.viewer, this.sideFaction(side) || this.sideName(side), skillName, { syncNow: true });
            this.note(duel
                ? `${head.viewer} 助${this.sideName(side)}施展【${skillName}】`
                : `${head.viewer} 助玩家施展【${skillName}】`);
            this.report({ viewer: head.viewer, side, six: head.six, paid: false, outcome: 'cast', skillName });
            this.fulfillWanted(head.uid, head.viewer);
        }
    }
    private tickScoutQueue(): void {
        const head = this.scoutQueue[0];
        if (!head) return;
        const r = this.war()!.castPlayerLiveSkill();
        if (r === 'wait' || r === 'closed') return;
        this.scoutQueue.shift();
        if (head.ordersCost > 0 && head.deducted === false) {
            const a = this.acct(head.uid, head.viewer);
            a.n = Math.max(0, a.n - head.ordersCost);
            head.deducted = true;
        }
        this.recentBattleCasts.push({
            uid: head.uid,
            viewer: head.viewer,
            cost: head.ordersCost,
            label: '玩家技',
            castAtMs: Date.now(),
        });
        this.save();
        speechAnnouncer.announceViewerSkill(head.viewer, '玩家', '玩家技');
        this.note(`${head.viewer} 出 ${head.bid} 积分，玩家技已释放`);
        this.fulfillWanted(head.uid, head.viewer);
    }
    private endBattle(): void {
        const now = Date.now();
        const foughtMs = this.battleStartedAtMs > 0 ? now - this.battleStartedAtMs : 0;
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
        for (const q of this.scoutQueue) this.voidScoutCast(q);
        this.scoutQueue = [];
        for (const q of this.queue) this.voidCast(q);
        this.queue = [];
        this.lastFreeCastAt = 0;
        this.lastFreeCastAtBySide = [0, 0];
        this.lastBattleEndedAtMs = now;
        this.battleStartedAtMs = 0;
        this.sides.clear();
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
    private voidScoutCast(q: QueuedScoutCast): void {
        if (q.centsCost > 0) this.credit(q.uid, q.viewer, q.centsCost);
        if (q.ordersCost > 0 && q.deducted !== false) {
            const a = this.acct(q.uid, q.viewer);
            a.n = Math.min(ORDER_CAP, a.n + q.ordersCost);
        }
        this.note(`${q.viewer} 的玩家技没轮到，${q.bid} 积分未扣`);
        this.notifyViewerVoice(q.uid, `${q.viewer}，战斗结束，排队的玩家技未扣积分`, true);
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
            scoutQueue: this.scoutQueue.map((q) => ({ ...q })),
            sides: [...this.sides],
            wanted: [...this.wanted],
            scoutSeq: this.scoutSeq,
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
        this.scoutQueue = (Array.isArray(ledger.scoutQueue) ? ledger.scoutQueue : []).filter((q) =>
            q && typeof q.uid === 'string' && Number.isSafeInteger(q.bid) && q.bid > 0
            && ((q.ordersCost > 0) !== (q.centsCost > 0)),
        ).slice(0, 1000).map((q) => ({
            uid: q.uid, viewer: cleanViewerName(String(q.viewer || '观众')), bid: q.bid,
            seq: Number.isSafeInteger(q.seq) ? q.seq : 0,
            ordersCost: q.ordersCost > 0 ? q.bid : 0,
            centsCost: q.centsCost > 0 ? scoutBidCents(q.bid) : 0,
            ...(typeof q.deducted === 'boolean' ? { deducted: q.deducted } : {}),
        }));
        this.sides = new Map((Array.isArray(ledger.sides) ? ledger.sides : []).filter((x) =>
            Array.isArray(x) && typeof x[0] === 'string' && (x[1] === 0 || x[1] === 1),
        ));
        this.wanted = new Map((Array.isArray(ledger.wanted) ? ledger.wanted : []).filter((x) =>
            Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string'
            && (SIX_BY_WORD[x[1]] || scoutBidOf(x[1]) !== null),
        ));
        this.scoutSeq = Number.isSafeInteger(ledger.scoutSeq) ? Math.max(0, Number(ledger.scoutSeq)) : 0;
        // 下注筹码（第二本账）：跨页/刷新保留；注单只在本局有效，不进账本
        this.chips.clear();
        for (const [id, c] of Object.entries(ledger.chips ?? {})) {
            const n = Number(c?.n);
            if (Number.isFinite(n) && n > 0) {
                this.chips.set(id, { name: String(c?.name || '观众'), n: Math.min(BET_CHIP_CAP, Math.floor(n)) });
            }
        }
        const topRename = this.renameHistory[this.renameHistory.length - 1];
        if (topRename) {
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
