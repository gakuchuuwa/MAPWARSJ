/**
 * YouTube 单平台直播互动。
 * 免费积分只来自频道增长目标；普通弹幕只证明在场，不直接发积分。
 * 真钱只来自 Super Chat / Super Sticker，与积分分账；未释放的付费技能原数退回。
 * 官方事件由本地服务持久排队，本类同步记账后由桥接器 ACK，重复事件不重复入账。
 */
import type { GameApp } from '../app/GameApp';
import type { TacticalSixSet } from '../data/TacticalSkillCatalog';
import { speechAnnouncer } from '../audio/SpeechAnnouncer';

/** 一次六计的美元价格（美分）。其他币种只作游戏内固定折算，原始付款由服务端另存。 */
export const PRICE_PER_CAST = 100;
export const ORDERS_PER_CAST = 3;
export const ORDER_CAP = 10;
export const FREE_CAST_GAP_MS = 10_000;
const PRESENT_MS = 10 * 60_000;
const SUB_BONUS = 2;
const GOAL_BONUS_MAX = 3;
const HANDLED_CAP = 5000;
const TICK_MS = 250;
const STORE_KEY = 'mapwar-live-wallet';
const NAME_MAX = 6;

const SIX_BY_WORD: Record<string, TacticalSixSet> = {
    攻: 'gongzhan', 胜: 'shengzhan', 敌: 'dizhan', 混: 'hunzhan', 并: 'bingzhan', 败: 'baizhan',
    攻战: 'gongzhan', 胜战: 'shengzhan', 敌战: 'dizhan', 混战: 'hunzhan', 并战: 'bingzhan', 败战: 'baizhan',
};
const TRAD_TO_SIMP: Record<string, string> = { 勝: '胜', 敵: '敌', 並: '并', 併: '并', 敗: '败', 戰: '战' };
function normalizeCommand(text: string): string {
    return text.normalize('NFKC').trim().replace(/[勝敵並併敗戰]/g, (c) => TRAD_TO_SIMP[c]);
}

/** 斥候玩家技口令：技3 / 技 3；数字就是这次出的积分。 */
export function scoutBidOf(word: string): number | null {
    const m = word.match(/^技\s*([1-9]\d*)$/);
    if (!m) return null;
    const bid = Number(m[1]);
    return Number.isSafeInteger(bid) && bid > 0 ? bid : null;
}
export function scoutBidCents(bid: number): number {
    return Math.ceil(bid * PRICE_PER_CAST / ORDERS_PER_CAST);
}

export function cleanViewerName(raw: string): string {
    const s = raw.normalize('NFKC')
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
}
export interface ViewerQueuedScoutCast {
    uid: string;
    viewer: string;
    bid: number;
    seq: number;
    ordersCost: number;
    centsCost: number;
}
export interface ViewerLedger {
    version: 1;
    day: string;
    wallets: Record<string, { name: string; cents: number }>;
    orders: Record<string, { name: string; n: number }>;
    handled: string[];
    /** 已扣款队列也必须持久化：ACK 后刷新不能把观众付费技能弄丢。 */
    queue?: ViewerQueuedCast[];
    scoutQueue?: ViewerQueuedScoutCast[];
    sides?: [string, 0 | 1][];
    wanted?: [string, string][];
    scoutSeq?: number;
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
}
const CN_NUM = ['零', '一', '两', '三', '四', '五', '六'];

/** 游戏内固定折算率，只用于决定技能余额，不代表 YouTube 实际结算汇率。 */
const USD_RATE: Record<string, number> = {
    USD: 1, CNY: 0.14, TWD: 0.031, HKD: 0.128, CAD: 0.73, AUD: 0.66,
    SGD: 0.74, MYR: 0.21, EUR: 1.08, GBP: 1.27, JPY: 0.0067, KRW: 0.00073,
};
export function youTubePaymentCents(payment: YouTubePayment): number {
    const micros = Number(payment.amountMicros);
    const rate = USD_RATE[payment.currency.toUpperCase()];
    if (!Number.isSafeInteger(micros) || micros <= 0 || rate === undefined) return 0;
    return Math.max(0, Math.round(micros / 10_000 * rate));
}

export class ViewerLive {
    private sides = new Map<string, 0 | 1>();
    private orders = new Map<string, OrderAcct>();
    private wallets = new Map<string, { name: string; cents: number }>();
    private wanted = new Map<string, string>();
    private handled = new Set<string>();
    private queue: QueuedCast[] = [];
    private scoutQueue: QueuedScoutCast[] = [];
    private scoutSeq = 0;
    private lastFreeCastAt = 0;
    private wasActive = false;
    private day = '';
    private log: string[] = [];
    private likeMax = -1;
    private subMax = -1;
    private viewerPeak = -1;
    private likeProg = 0;
    private likeTotal = 0;
    private subTotal = 0;
    private viewers = 0;
    public onResult: ((r: ViewerCastResult) => void) | null = null;
    public onLedgerChange: ((ledger: ViewerLedger) => void) | null = null;
    public platformStatus = '';
    public ytStatus = '';
    public lastChatAt = 0;

    constructor(private readonly app: GameApp) {
        this.load();
        window.setInterval(() => this.tick(), TICK_MS);
    }

    /** 普通聊天不加分，只刷新最近发言时间；站队、六计与玩家技仍走原队列。 */
    public onChat(viewer: string, text: string, paid = false, uid?: string): string {
        const name = cleanViewerName(viewer);
        const id = uid || viewer.trim() || '观众';
        let word = normalizeCommand(text);
        this.acct(id, name).seen = Date.now();
        const scoutBid = scoutBidOf(word);
        if (scoutBid !== null) {
            const blocked = this.scoutBlockReason();
            if (blocked) return this.note(`${name}：${blocked}`);
            if (paid) this.credit(id, name, PRICE_PER_CAST);
            return this.requestScout(id, name, scoutBid);
        }
        if (paid) this.credit(id, name, PRICE_PER_CAST);
        const combo = word.match(/^([12])\s*(\S+)$/);
        if (combo && SIX_BY_WORD[combo[2]]) {
            if (!this.battleOn()) return this.note(`${name}：现在没在打仗，等下一仗`);
            this.joinSide(id, combo[1] === '1' ? 0 : 1);
            word = combo[2];
        }
        if (word === '1' || word === '2') {
            if (!this.battleOn()) return this.note(`${name}：现在没在打仗，等下一仗`);
            const side: 0 | 1 = word === '1' ? 0 : 1;
            this.joinSide(id, side);
            return this.note(`${name} 站了${this.sideName(side)}`);
        }
        if (!SIX_BY_WORD[word]) return '';
        if (!this.battleOn()) return this.note(`${name}：现在没在打仗，等下一仗`);
        return this.request(id, name, word);
    }

    /** F9 本地测试入口；正式付款只从 handleYouTubeEvent 进入。 */
    public onPayment(uid: string, viewer: string, cents: number, what: string): void {
        if (!(cents > 0)) return;
        const name = cleanViewerName(viewer);
        const w = this.credit(uid, name, cents);
        this.acct(uid, name).seen = Date.now();
        this.note(`感谢 ${name} 的${what}！可放 ${Math.floor(w.cents / PRICE_PER_CAST)} 计`);
        this.fulfillWanted(uid, name);
    }

    /** 官方事件幂等入口：先处理付款，再处理同条留言里的口令。 */
    public handleYouTubeEvent(event: YouTubeLiveEvent): void {
        if (!event.id || this.handled.has(event.id)) return;
        const name = cleanViewerName(event.viewer);
        if (event.payment) {
            const cents = youTubePaymentCents(event.payment);
            // 无法折算时绝不 ACK：原始付款留在服务端待处理，不能假装已给观众入账。
            if (cents <= 0) throw new Error(`付款 ${event.payment.display || event.id} 的金额或币种暂未支持，等待处理`);
            this.onPayment(event.uid, name, cents, `${event.payment.kind} ${event.payment.display}`);
        }
        if (event.text) this.onChat(name, event.text, false, event.uid);
        this.handled.add(event.id);
        if (this.handled.size > HANDLED_CAP) this.handled = new Set([...this.handled].slice(-HANDLED_CAP));
        this.save();
    }

    public onViewers(n: number): void {
        if (!Number.isFinite(n) || n < 0) return;
        const total = Math.floor(n);
        this.viewers = total;
        if (this.viewerPeak < 0) { this.viewerPeak = total; return; }
        if (total <= this.viewerPeak) return;
        this.viewerPeak = total;
        const k = this.grantPresent(1);
        this.note(`本场在线人数创新高 ${total}！在场 ${k} 人各 +1 积分`);
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
        this.likeProg = 0;
        this.likeTotal = 0;
    }

    public pricePerCast(): number { return PRICE_PER_CAST; }

    public snapshot(): {
        on: boolean; names: [string, string]; counts: [number, number];
        queue: string[]; log: string[]; price: number; platform: string;
        goal: { likes: number; likeProg: number; likeStep: number; subs: number; viewers: number; present: number };
        top: { name: string; n: number }[];
        yt: string;
        lastChatAgo: number;
        queueBrief: { name: string; paid: boolean; label?: string }[];
    } {
        const top = [...this.orders.values()]
            .filter((a) => a.lastEarn > 0)
            .sort((x, y) => y.lastEarn - x.lastEarn)
            .slice(0, 6)
            .map((a) => ({ name: a.name, n: a.n }));
        let a = 0, d = 0;
        for (const s of this.sides.values()) { if (s === 0) a++; else d++; }
        return {
            on: this.battleOn(),
            names: [this.sideName(0), this.sideName(1)],
            counts: [a, d],
            queue: [
                ...this.scoutQueue.map((q) => `${q.viewer} 玩家技 ${q.bid}分`),
                ...this.queue.map((q) => `${q.viewer} ${this.sideName(q.side)} ${q.paid ? '付费' : '积分'}`),
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
                ...this.scoutQueue.map((q) => ({ name: q.viewer, paid: q.centsCost > 0, label: `技${q.bid}` })),
                ...this.queue.map((q) => ({ name: q.viewer, paid: q.paid })),
            ],
        };
    }

    private war() { return this.app.scene13War; }
    private battleOn(): boolean { return this.war()?.isActive?.() === true; }
    private scoutBlockReason(): string | null {
        if (!this.battleOn()) return '现在没在打仗，等下一仗';
        const rank = this.app.playerHero?.getRank().id;
        if (!rank || rank === 'civilian') return '平民不能释放玩家技，投靠武将成为斥候后开放';
        if (!this.war()?.hasPlayerHero()) return '玩家本人没有参加这一仗';
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
        this.log.push(msg);
        if (this.log.length > 8) this.log.shift();
        return msg;
    }
    private acct(id: string, name: string): OrderAcct {
        this.rollDay();
        let a = this.orders.get(id);
        if (!a) {
            a = { name, n: 0, seen: 0, lastEarn: 0 };
            this.orders.set(id, a);
        }
        a.name = name;
        return a;
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
    private likeStep(): number {
        return this.viewers > 0 ? Math.min(50, Math.max(5, Math.ceil(this.viewers / 5))) : 10;
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
            if (this.scoutBlockReason()) return;
            const affordable = (this.orders.get(id)?.n ?? 0) >= scoutBid
                || (this.wallets.get(id)?.cents ?? 0) >= scoutBidCents(scoutBid);
            if (!affordable) return;
            this.wanted.delete(id);
            this.requestScout(id, name, scoutBid);
            return;
        }
        if (!this.sides.has(id) || !this.canAfford(id)) return;
        this.wanted.delete(id);
        this.request(id, name, word);
    }
    private canAfford(id: string): boolean {
        const freeOk = (this.orders.get(id)?.n ?? 0) >= ORDERS_PER_CAST && !this.hasFreeQueued(id);
        return freeOk || (this.wallets.get(id)?.cents ?? 0) >= PRICE_PER_CAST;
    }
    private requestScout(id: string, name: string, bid: number): string {
        const a = this.acct(id, name);
        let ordersCost = 0;
        let centsCost = 0;
        if (a.n >= bid) {
            a.n -= bid;
            ordersCost = bid;
        } else {
            const cost = scoutBidCents(bid);
            const w = this.wallets.get(id);
            if (!w || w.cents < cost) {
                this.wanted.set(id, `技${bid}`);
                this.save();
                return this.note(`${name}：这次要 ${bid} 积分；现有积分 ${a.n}/${bid}，或付费 $${(cost / 100).toFixed(2)} 放玩家技`);
            }
            w.cents -= cost;
            centsCost = cost;
        }
        const item: QueuedScoutCast = { uid: id, viewer: name, bid, seq: ++this.scoutSeq, ordersCost, centsCost };
        const beforeLowerBid = this.scoutQueue.findIndex((q) => q.bid < bid);
        if (beforeLowerBid < 0) this.scoutQueue.push(item);
        else this.scoutQueue.splice(beforeLowerBid, 0, item);
        this.save();
        return this.note(`${name} 出 ${bid} 积分放玩家技，排第 ${this.scoutQueue.indexOf(item) + 1}`);
    }
    private hasFreeQueued(id: string): boolean {
        return this.queue.some((q) => q.uid === id && !q.paid);
    }
    private request(id: string, name: string, word: string): string {
        const side = this.sides.get(id);
        if (side === undefined) return this.note(`${name}：先发 1 或 2 站队，再放计`);
        const a = this.acct(id, name);
        const queuedFree = this.hasFreeQueued(id);
        let paid: boolean;
        if (a.n >= ORDERS_PER_CAST && !queuedFree) {
            a.n -= ORDERS_PER_CAST;
            paid = false;
        } else {
            const w = this.wallets.get(id);
            if (!w || w.cents < PRICE_PER_CAST) {
                this.wanted.set(id, word);
                this.save();
                if (queuedFree && a.n >= ORDERS_PER_CAST) return this.note(`${name}：已有一计在排队，放完接着替你放【${word}】`);
                return this.note(`${name}：积分 ${a.n}/${ORDERS_PER_CAST}，靠频道增长目标攒积分，或付费 $${PRICE_PER_CAST / 100} 放【${word}】`);
            }
            w.cents -= PRICE_PER_CAST;
            paid = true;
        }
        const item: QueuedCast = { uid: id, viewer: name, side, six: SIX_BY_WORD[word], word, paid };
        if (paid) {
            const firstFree = this.queue.findIndex((q) => !q.paid);
            if (firstFree < 0) this.queue.push(item); else this.queue.splice(firstFree, 0, item);
        } else this.queue.push(item);
        this.save();
        return this.note(`${name} 替${this.sideName(side)}点了【${word}】，${paid ? '付费' : '花积分'}，排第 ${this.queue.indexOf(item) + 1}`);
    }
    private credit(id: string, name: string, cents: number) {
        this.rollDay();
        const w = this.wallets.get(id) ?? { name, cents: 0 };
        w.name = name;
        w.cents += cents;
        this.wallets.set(id, w);
        this.save();
        return w;
    }

    private tick(): void {
        const active = this.battleOn();
        const hasBattleState = this.wasActive || this.queue.length > 0 || this.scoutQueue.length > 0 || this.wanted.size > 0 || this.sides.size > 0;
        if (hasBattleState && !active) this.endBattle();
        this.wasActive = active;
        if (!active) return;
        this.tickScoutQueue();
        if (this.queue.length === 0) return;
        const head = this.queue[0];
        if (!head.paid && Date.now() - this.lastFreeCastAt < FREE_CAST_GAP_MS) return;
        const r = this.war()!.castViewerSkill(head.side, head.six, head.viewer, head.paid);
        if (r === 'wait' || r === 'closed') return;
        this.queue.shift();
        this.save();
        if (!head.paid) this.lastFreeCastAt = Date.now();
        const skillName = this.war()!.lastSkillNameOf(head.side);
        speechAnnouncer.announceViewerSkill(head.viewer, this.sideFaction(head.side) || this.sideName(head.side), skillName, { onlyIfIdle: !head.paid });
        this.note(`${head.viewer} 替${this.sideName(head.side)}放了【${skillName}】`);
        this.report({ viewer: head.viewer, side: head.side, six: head.six, paid: head.paid, outcome: 'cast', skillName });
        this.fulfillWanted(head.uid, head.viewer);
    }
    private tickScoutQueue(): void {
        const head = this.scoutQueue[0];
        if (!head) return;
        const r = this.war()!.castPlayerLiveSkill();
        if (r === 'wait' || r === 'closed') return;
        this.scoutQueue.shift();
        this.save();
        speechAnnouncer.announceViewerSkill(head.viewer, '玩家', '玩家技', { onlyIfIdle: head.centsCost === 0 });
        this.note(`${head.viewer} 出 ${head.bid} 积分，玩家技已释放`);
        this.fulfillWanted(head.uid, head.viewer);
    }
    private endBattle(): void {
        for (const q of this.scoutQueue) this.voidScoutCast(q);
        this.scoutQueue = [];
        for (const q of this.queue) this.voidCast(q);
        this.queue = [];
        this.lastFreeCastAt = 0;
        this.sides.clear();
        this.wanted.clear();
        this.save();
    }
    private voidScoutCast(q: QueuedScoutCast): void {
        if (q.centsCost > 0) this.credit(q.uid, q.viewer, q.centsCost);
        if (q.ordersCost > 0) this.acct(q.uid, q.viewer).n += q.ordersCost;
        this.note(`${q.viewer} 的玩家技没轮到，${q.bid} 积分已退回`);
    }
    private voidCast(q: QueuedCast): void {
        if (q.paid) this.credit(q.uid, q.viewer, PRICE_PER_CAST);
        else this.acct(q.uid, q.viewer).n += ORDERS_PER_CAST;
        this.note(`${q.viewer} 的计没轮到，这一仗结束了，${q.paid ? '钱已退回，下一仗还能放' : '积分已退回'}`);
        this.report({ viewer: q.viewer, side: q.side, six: q.six, paid: q.paid, outcome: 'void' });
    }
    private report(r: ViewerCastResult): void { this.onResult?.(r); }

    private today(): string {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }
    private rollDay(): void {
        const t = this.today();
        if (this.day !== t) { this.day = t; this.orders.clear(); }
    }

    public exportLedger(): ViewerLedger {
        return {
            version: 1,
            day: this.day,
            wallets: Object.fromEntries([...this.wallets].filter(([, w]) => w.cents > 0)),
            orders: Object.fromEntries([...this.orders].filter(([, a]) => a.n > 0).map(([id, a]) => [id, { name: a.name, n: a.n }])),
            handled: [...this.handled],
            queue: this.queue.map((q) => ({ ...q })),
            scoutQueue: this.scoutQueue.map((q) => ({ ...q })),
            sides: [...this.sides],
            wanted: [...this.wanted],
            scoutSeq: this.scoutSeq,
        };
    }

    /** 服务端账本是正式副本；导入时不回传，避免形成保存循环。 */
    public hydrateLedger(ledger: ViewerLedger): void {
        if (!ledger || ledger.version !== 1) return;
        this.wallets.clear();
        this.orders.clear();
        this.handled = new Set(Array.isArray(ledger.handled) ? ledger.handled.slice(-HANDLED_CAP) : []);
        for (const [id, w] of Object.entries(ledger.wallets ?? {})) {
            if (Number.isFinite(w.cents) && w.cents > 0) this.wallets.set(id, { name: String(w.name || '观众'), cents: Math.floor(w.cents) });
        }
        if (ledger.day === this.today()) {
            for (const [id, o] of Object.entries(ledger.orders ?? {})) {
                if (Number.isFinite(o.n) && o.n > 0) this.orders.set(id, { name: String(o.name || '观众'), n: Math.floor(o.n), seen: 0, lastEarn: 0 });
            }
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
        }));
        this.sides = new Map((Array.isArray(ledger.sides) ? ledger.sides : []).filter((x) =>
            Array.isArray(x) && typeof x[0] === 'string' && (x[1] === 0 || x[1] === 1),
        ));
        this.wanted = new Map((Array.isArray(ledger.wanted) ? ledger.wanted : []).filter((x) =>
            Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string'
            && (SIX_BY_WORD[x[1]] || scoutBidOf(x[1]) !== null),
        ));
        this.scoutSeq = Number.isSafeInteger(ledger.scoutSeq) ? Math.max(0, Number(ledger.scoutSeq)) : 0;
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
        this.writeCache();
        this.onLedgerChange?.(this.exportLedger());
    }
}
