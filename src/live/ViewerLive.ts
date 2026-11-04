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
import { PLAYER_HERO_NAME } from '../player/PlayerConfig';
import { sixUnlockBlockReason } from '../player/PlayerLiveSkill';

export const PRICE_PER_CAST = 100;
export const ORDERS_PER_CAST = 1;
export const ORDER_CAP = 9999;
export const MAX_SKILL_BID = 100;
export const FREE_CAST_GAP_MS = 2000;
const PRESENT_MS = 20 * 60_000;
/** 在场发分：每隔这么久，在场的人各 +PRESENCE_PAY */
const PRESENCE_PAY_MS = 2 * 60_000;
const PRESENCE_PAY = 1;
/** 发言参与加分冷却：每隔这么久在聊天室发言可得 +1 积分 */
const CHAT_EARN_GAP_MS = 60_000;
/** 战术模式战斗满这么久结束时，在场全员 +1 积分（过滤 10 秒非战术略过战） */
const TACTICAL_BATTLE_REWARD_MIN_MS = 30_000;
/** 第一次在本频道说话送的分（聊天只许订阅者发言 ⇒ 等于奖励新订阅的人马上能放一计） */
const NEWCOMER_BONUS = 3;
/** 每天第一次说话送的分（老观众隔天回来） */
const RETURN_BONUS = 3;
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
};
function normalizeCommand(text: string): string {
    return text.normalize('NFKC').trim().replace(/[勝敵並併敗戰選號]/g, (c) => TRAD_TO_SIMP[c] ?? c);
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
    commandType: 'skill_burst' | 'skill_six' | 'rename' | 'join_choice';
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
    /** seen：最近一次说话（刷新页面后在场不断）；day：最近一次说话是哪天（每天第一次来送分） */
    orders: Record<string, { name: string; n: number; seen?: number; day?: string }>;
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
    private lastFreeCastAt = 0;
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
            this.notifyViewerVoice(id, `${name}，你现有${acc.n}积分`);
            return this.note(`${name} 现有 ${acc.n} 积分`);
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

        // 2. 离职后战略地图投靠竞价（斥候＝同文化势力，探马＝同文化武将）
        const joinCmd = parseJoinCommand(word);
        if (joinCmd) {
            return this.handleJoinCommand(id, name, joinCmd.query ?? joinCmd.index, joinCmd.bid, eventId, pubMs);
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
            const playerSide = this.playerSideInBattle();
            if (playerSide !== null && reqSide !== playerSide) {
                return this.note(`${name}：全体观众共同操作玩家，只能为玩家所在的${this.sideName(playerSide)}放计`);
            }
            this.joinSide(id, playerSide ?? reqSide);
            word = combo[2];
        }
        if (word === '1' || word === '2') {
            if (!this.battleOn()) return this.note(`${name}：现在没在打仗，等下一仗`);
            const playerSide = this.playerSideInBattle();
            const side: 0 | 1 = playerSide ?? (word === '1' ? 0 : 1);
            this.joinSide(id, side);
            return this.note(`${name} 已随玩家站在${this.sideName(side)}，直接发六计或 技3 即可`);
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
        const joinScope = rankId === 'scout' ? '同文化势力'
            : rankId === 'outrider' ? '同文化名将'
                : rankId === 'vanguard' ? '全图势力(同文化·将多优先)'
                    : '全图武将(同文化·名将优先)';
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
        this.notifyViewerVoice(id, `感谢${name}出${bid}积分，投奔${applied.candidate.label}${destVoice}`, true);
        const refundNote = prev ? `（已退回 ${prev.viewer} 的 ${prev.bid} 积分）` : '';
        return this.note(`${name} 出 ${bid} 积分，投奔【${applied.candidate.label}】${destCity ? `，目标【${destCity}】` : ''}（下次改投需 ${bid + 1} 分起）${refundNote}`);
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
        const rank = this.app.playerHero?.getRank().id;
        if (!rank || rank === 'civilian') return '平民不能释放玩家技能，投靠武将成为斥候后开放';
        if (!this.war()?.hasPlayerHero()) return '玩家本人没有参加这一仗';
        return null;
    }
    private playerSixBlockReason(six: TacticalSixSet): string | null {
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
            a = { name, n: 0, seen: 0, lastEarn: 0, day: '' };
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
        this.addOrders(id, name, bonus, true);
        this.note(isNew ? `欢迎 ${name} 入营，送 ${bonus} 积分` : `${name} 今日回营，送 ${bonus} 积分`);
        this.save();
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

    private addOrders(id: string, name: string, n: number, bulk = false): void {
        const a = this.acct(id, name);
        const before = a.n;
        a.n = Math.max(a.n, Math.min(ORDER_CAP, a.n + n));
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
        const side: 0 | 1 = this.playerSideInBattle() ?? this.sides.get(id) ?? 0;
        this.sides.set(id, side);
        const a = this.acct(id, name);
        const avail = a.n - this.reservedOrders(id);
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
        if (this.queue.length > 1 || Date.now() - this.lastFreeCastAt < FREE_CAST_GAP_MS) {
            const pos = this.queue.indexOf(item) + 1;
            this.notifyViewerVoice(id, `${name}，${word}计已排队第${pos}位，释放时再扣积分`);
        }
        return this.note(`${name} 花 ${ORDERS_PER_CAST} 积分点了【${word}】，按先后排第 ${this.queue.indexOf(item) + 1}`);
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
        const hasBattleState = this.wasActive || this.queue.length > 0 || this.scoutQueue.length > 0 || this.wanted.size > 0 || this.sides.size > 0;
        if (hasBattleState && !active) {
            this.endBattle();
        }
        this.wasActive = active;
        return active;
    }

    private tick(): void {
        this.payPresence();
        const active = this.syncBattleLifecycle();
        if (!active) return;
        this.tickScoutQueue();
        if (this.queue.length === 0) return;
        const head = this.queue[0];
        if (Date.now() - this.lastFreeCastAt < FREE_CAST_GAP_MS) return;
        const side: 0 | 1 = this.playerSideInBattle() ?? head.side;
        const r = this.war()!.castViewerSkill(side, head.six, head.viewer, false);
        if (r === 'wait' || r === 'closed') return;
        this.queue.shift();
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
        this.lastFreeCastAt = now;
        const skillName = this.war()!.lastSkillNameOf(side);
        speechAnnouncer.announceViewerSkill(head.viewer, this.sideFaction(side) || this.sideName(side), skillName, { syncNow: true });
        this.note(`${head.viewer} 助玩家施展【${skillName}】`);
        this.report({ viewer: head.viewer, side, six: head.six, paid: false, outcome: 'cast', skillName });
        this.fulfillWanted(head.uid, head.viewer);
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
        this.lastBattleEndedAtMs = now;
        this.battleStartedAtMs = 0;
        this.sides.clear();
        this.wanted.clear();
        if (foughtMs >= TACTICAL_BATTLE_REWARD_MIN_MS && this.isAccountingPage()) {
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
                this.orders.set(id, { name: String(o.name || '观众'), n: Math.min(ORDER_CAP, Math.max(0, Math.floor(o.n))), seen, lastEarn: 0, day });
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
