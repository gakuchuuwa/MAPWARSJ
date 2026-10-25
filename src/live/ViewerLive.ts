/**
 * 🔴 [2026-10-23 主人「技能槽保持原定不动。既然观众花钱了，就可以直接释放。想放多少次放多少次，放一次就一次钱，第一次免费。」]
 * 直播观众互动：观众在直播间发字，替自己那一方在战术模式里放计。
 *
 * 规矩：
 *   · 站队：发「1」站攻方，发「2」站守方；每一仗重新站（攻守每仗都换）。也认「1攻」这种一条带完。
 *   · 放计：发「攻 / 胜 / 敌 / 混 / 并 / 败」之一（也认「攻战」这类写法），替自己那方马上放这一计，不等技能槽。
 *   · 排队：两计不许同时放（战术模式那道闸），观众的计按先后排队；付费的排在军令放的前面。
 *   · 这一仗打完还没轮到的：作废；军令退回，付费的钱退回观众余额，下一仗照样能用。
 *
 * 🔴 [2026-10-24 主人「全面进行直播挣钱模式」] 接上直播间（`SocialStreamBridge`，B 站要粉丝量上不了，不接）：
 *   · 打赏（YouTube 超级留言、Twitch Bits、TikTok 礼物、Ko-fi）折合美元记进观众余额（美分），满一次的钱就能放一计；
 *     零头留着攒，下次打赏凑够了照样算。
 *   · 钱不够时发了计：记住他想放哪一计，等他打赏凑够钱马上替他放，不用再发一遍。
 *   · 打赏留言里带了计（如「1攻」）：钱进余额后直接按留言放。
 *   · 余额与军令存 localStorage：直播中刷新页面，观众付过的钱、攒的令不丢。
 *
 * 🔴 [2026-10-25 主人「直播功能先走免费模式，不是白玩，要有小付出」] 免费模式改成「军令」，取代「每天第一次免费」：
 *   · 军令是免费的付出换来的：打仗时站队 +1（每仗一次）；打仗时发有效弹幕 +1（每人 20 秒内只算一条，
 *     与上一条相同、纯表情 / 标点的不算）。放一计花 ORDERS_PER_CAST 令，最多攒 ORDER_CAP 令，隔天清零。
 *   · 全场目标：YouTube 只给点赞总数、订阅总数，认不出是谁点的——所以做成大家共享的目标：
 *     每满一档点赞（档位随在线人数），最近 PRESENT_MS 内说过话的每个人 +1 令；订阅数每涨 1，在场每人 +2 令。
 *   · 军令放的计排在付费的后面；钱和军令都够时先花军令（钱留着）。
 */
import type { GameApp } from '../app/GameApp';
import type { TacticalSixSet } from '../data/TacticalSkillCatalog';
import { speechAnnouncer } from '../audio/SpeechAnnouncer';

/** 放一计要多少钱（美分）。100＝1 美元：YouTube 超级留言、Ko-fi 的最低额都在这一档 */
export const PRICE_PER_CAST = 100;
/** 放一计要多少军令 */
export const ORDERS_PER_CAST = 3;
/** 一个人最多攒多少军令（防止攒一大堆一次放完） */
export const ORDER_CAP = 10;
/** 同一个人两条弹幕之间至少隔多久才再算军令（毫秒） */
const CHAT_COOLDOWN_MS = 20_000;
/** 说过话多久内算「在场」（毫秒）：全场目标奖励只发给在场的人 */
const PRESENT_MS = 10 * 60_000;
/** 订阅每涨 1，在场每人加多少令 */
const SUB_BONUS = 2;
/** 一次更新里全场奖励最多发几份，防止接口抽风一下发爆 */
const GOAL_BONUS_MAX = 3;

/** 观众发的字 → 六计 */
const SIX_BY_WORD: Record<string, TacticalSixSet> = {
    攻: 'gongzhan', 胜: 'shengzhan', 敌: 'dizhan', 混: 'hunzhan', 并: 'bingzhan', 败: 'baizhan',
    攻战: 'gongzhan', 胜战: 'shengzhan', 敌战: 'dizhan', 混战: 'hunzhan', 并战: 'bingzhan', 败战: 'baizhan',
};

export interface ViewerCastResult {
    viewer: string;
    side: 0 | 1;
    six: TacticalSixSet;
    /** true＝花的是钱；false＝花的是军令 */
    paid: boolean;
    /** cast＝放成了；void＝这一仗打完没轮到，作废（钱 / 军令已退回） */
    outcome: 'cast' | 'void';
    skillName?: string;
}

interface QueuedCast {
    uid: string;
    viewer: string;
    side: 0 | 1;
    six: TacticalSixSet;
    word: string;
    paid: boolean;
}

/** 一位观众的军令账户；seen / lastText / lastAt 只在内存，刷新页面就没了 */
interface OrderAcct {
    name: string;
    n: number;
    seen: number;
    lastText: string;
    lastAt: number;
}

/** 多久试一次放排队的计（毫秒） */
const TICK_MS = 250;
const STORE_KEY = 'mapwar-live-wallet';

export class ViewerLive {
    /** 这一仗谁站哪一方（键＝观众 id） */
    private sides = new Map<string, 0 | 1>();
    /** 观众军令账户（键＝观众 id） */
    private orders = new Map<string, OrderAcct>();
    /** 观众余额（美分），name 是最近一次的昵称 */
    private wallets = new Map<string, { name: string; cents: number }>();
    /** 钱 / 军令不够没放成的那一计：攒够就替他放 */
    private wanted = new Map<string, string>();
    private queue: QueuedCast[] = [];
    private wasActive = false;
    private day = '';
    /** 最近几条记录（面板显示） */
    private log: string[] = [];
    /** 全场目标：点赞 / 订阅总数的基线（-1＝还没收到过，第一次只记基线不发奖） */
    private likeBase = -1;
    private subBase = -1;
    private likeProg = 0;
    private likeTotal = 0;
    private subTotal = 0;
    private viewers = 0;
    /** 放成功 / 作废都通知 */
    public onResult: ((r: ViewerCastResult) => void) | null = null;
    /** 直播间连接状态（面板显示）；空＝没接平台，只用 F9 测试 */
    public platformStatus = '';
    /** YouTube 点赞 / 订阅接口状态（面板显示）；空＝没配 */
    public ytStatus = '';

    constructor(private readonly app: GameApp) {
        this.load();
        window.setInterval(() => this.tick(), TICK_MS);
    }

    /**
     * 收到一条直播间文字（聊天 / 打赏留言 / F9 测试）。
     * paid＝这条消息本身带了一次的钱（F9 测试的「付费」勾、控制台调试）；平台打赏走 onPayment。
     * uid＝平台给的观众唯一标识（平台名:用户 id），没有就按昵称认人。
     * 返回给观众看的一句回应（面板记录用）。
     */
    public onChat(viewer: string, text: string, paid = false, uid?: string): string {
        const name = viewer.trim() || '观众';
        const id = uid || name;
        let word = text.trim();
        this.acct(id, name).seen = Date.now();
        if (paid) this.credit(id, name, PRICE_PER_CAST);
        // 「1攻」「2 败」：一条消息里先站队再放计
        const combo = word.match(/^([12])\s*(\S+)$/);
        if (combo && SIX_BY_WORD[combo[2]]) {
            if (!this.battleOn()) return this.note(`${name}：现在没在打仗，等下一仗`);
            this.joinSide(id, name, combo[1] === '1' ? 0 : 1);
            word = combo[2];
        }
        if (word === '1' || word === '2') {
            if (!this.battleOn()) return this.note(`${name}：现在没在打仗，等下一仗`);
            const side: 0 | 1 = word === '1' ? 0 : 1;
            this.joinSide(id, name, side);
            return this.note(`${name} 站了${this.sideName(side)}`);
        }
        if (!SIX_BY_WORD[word]) {
            this.earnByChat(id, name, word);
            return '';
        }
        if (!this.battleOn()) return this.note(`${name}：现在没在打仗，等下一仗`);
        return this.request(id, name, word);
    }

    /**
     * 收到一笔打赏，cents 单位美分（100＝1 美元）。
     * 钱进余额；他之前钱不够没放成的那一计，现在够了就马上排上。
     */
    public onPayment(uid: string, viewer: string, cents: number, what: string): void {
        if (!(cents > 0)) return;
        const name = viewer.trim() || '观众';
        const w = this.credit(uid, name, cents);
        this.acct(uid, name).seen = Date.now();
        this.note(`感谢 ${name} 的${what}！可放 ${Math.floor(w.cents / PRICE_PER_CAST)} 计`);
        this.fulfillWanted(uid, name);
    }

    /** 直播间在线人数（YouTube 接口 / SSN 的 viewer_update）；决定点赞一档多少个 */
    public onViewers(n: number): void {
        if (Number.isFinite(n) && n >= 0) this.viewers = Math.floor(n);
    }

    /** 直播当前的点赞总数。第一次只记基线；之后涨多少算多少，满一档全场发令 */
    public onLikeTotal(total: number): void {
        if (!Number.isFinite(total) || total < 0) return;
        const first = this.likeBase < 0;
        const d = total - this.likeBase;
        this.likeBase = total;
        this.likeTotal = total;
        if (!first && d > 0) this.addLikes(d);
    }

    /** 直接加几个赞（TikTok 的 liked 事件，一条＝一份） */
    public onLikes(d = 1): void {
        this.likeTotal += d;
        this.addLikes(d);
    }

    /** 频道当前的订阅总数。第一次只记基线；涨了就感谢并全场发令 */
    public onSubTotal(total: number): void {
        if (!Number.isFinite(total) || total < 0) return;
        const first = this.subBase < 0;
        const d = total - this.subBase;
        this.subBase = total;
        this.subTotal = total;
        if (first || d <= 0) return;
        const each = Math.min(d, GOAL_BONUS_MAX) * SUB_BONUS;
        const k = this.grantPresent(each);
        this.note(`感谢 ${d} 位新入营的将士！在场 ${k} 人各 +${each} 令`);
    }

    /** 某观众关注了主播（TikTok 的 followed 事件）：个人直接 +SUB_BONUS 令 */
    public onFollow(uid: string, viewer: string): void {
        const name = viewer.trim() || '观众';
        this.acct(uid, name).seen = Date.now();
        this.addOrders(uid, name, SUB_BONUS);
        this.note(`感谢 ${name} 入营！+${SUB_BONUS} 令`);
    }

    public pricePerCast(): number { return PRICE_PER_CAST; }

    /** 面板用：两边人数、排队、最近记录、价目、全场目标 */
    public snapshot(): {
        on: boolean; names: [string, string]; counts: [number, number];
        queue: string[]; log: string[]; price: number; platform: string;
        goal: { likes: number; likeProg: number; likeStep: number; subs: number; viewers: number; present: number };
        yt: string;
    } {
        let a = 0, d = 0;
        for (const s of this.sides.values()) { if (s === 0) a++; else d++; }
        return {
            on: this.battleOn(),
            names: [this.sideName(0), this.sideName(1)],
            counts: [a, d],
            queue: this.queue.map((q) => `${q.viewer}（${this.sideName(q.side)}）${q.paid ? '付费' : '军令'}`),
            log: [...this.log],
            price: PRICE_PER_CAST,
            platform: this.platformStatus,
            goal: {
                likes: this.likeTotal, likeProg: this.likeProg, likeStep: this.likeStep(),
                subs: this.subTotal, viewers: this.viewers, present: this.presentIds().length,
            },
            yt: this.ytStatus,
        };
    }

    // ── 内部 ───────────────────────────────────────────
    private war() {
        return this.app.scene13War;
    }

    private battleOn(): boolean {
        return this.war()?.isActive?.() === true;
    }

    private sideName(side: 0 | 1): string {
        const war = this.war();
        const fid = war?.sideDisplayFactionId?.(side);
        const name = fid ? this.app.cityManager?.getFactionName(fid) : '';
        return `${name || (side === 0 ? '攻方' : '守方')}${side === 0 ? '（攻）' : '（守）'}`;
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
            a = { name, n: 0, seen: 0, lastText: '', lastAt: 0 };
            this.orders.set(id, a);
        }
        a.name = name;
        return a;
    }

    /** 站队：这一仗第一次站队 +1 令 */
    private joinSide(id: string, name: string, side: 0 | 1): void {
        const first = !this.sides.has(id);
        this.sides.set(id, side);
        if (first) this.addOrders(id, name, 1);
    }

    /** 打仗时的有效弹幕 +1 令：隔够冷却、跟上一条不同、去掉空白标点表情后至少两个字 */
    private earnByChat(id: string, name: string, text: string): void {
        if (!this.battleOn()) return;
        const a = this.acct(id, name);
        const now = Date.now();
        const core = text.replace(/[\s\p{P}\p{S}]/gu, '');
        if (core.length < 2 || core === a.lastText || now - a.lastAt < CHAT_COOLDOWN_MS) return;
        a.lastText = core;
        a.lastAt = now;
        this.addOrders(id, name, 1);
    }

    /** 给一个人加军令（封顶）；刚攒够一计的数就提示，并把他之前没放成的那一计放出去 */
    private addOrders(id: string, name: string, n: number): void {
        const a = this.acct(id, name);
        const before = a.n;
        a.n = Math.min(ORDER_CAP, a.n + n);
        if (before < ORDERS_PER_CAST && a.n >= ORDERS_PER_CAST) {
            this.note(`${name} 攒够 ${ORDERS_PER_CAST} 令，可以放计了`);
        }
        this.save();
        this.fulfillWanted(id, name);
    }

    /** 最近说过话的人（在场） */
    private presentIds(): string[] {
        const cut = Date.now() - PRESENT_MS;
        const ids: string[] = [];
        for (const [id, a] of this.orders) if (a.seen > cut) ids.push(id);
        return ids;
    }

    /** 全场每个在场的人各 +n 令；返回在场人数 */
    private grantPresent(n: number): number {
        const ids = this.presentIds();
        for (const id of ids) {
            const a = this.orders.get(id)!;
            this.addOrders(id, a.name, n);
        }
        return ids.length;
    }

    /** 点赞一档要多少个：在线人数的五分之一，夹在 5~50（还不知道人数按 10） */
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
        this.note(`点赞满 ${step}！全军擂鼓，在场 ${k} 人各 +${each} 令`);
    }

    /** 他之前想放却不够的那一计，现在够了就马上放 */
    private fulfillWanted(id: string, name: string): void {
        const word = this.wanted.get(id);
        if (!word || !this.battleOn() || !this.sides.has(id)) return;
        if (!this.canAfford(id)) return;
        this.wanted.delete(id);
        this.request(id, name, word);
    }

    private canAfford(id: string): boolean {
        return (this.orders.get(id)?.n ?? 0) >= ORDERS_PER_CAST || (this.wallets.get(id)?.cents ?? 0) >= PRICE_PER_CAST;
    }

    /** 观众要放一计：先花军令，不够再扣余额；都不够就记下等他攒够 */
    private request(id: string, name: string, word: string): string {
        const side = this.sides.get(id);
        if (side === undefined) return this.note(`${name}：先发 1 或 2 站队，再放计`);
        const a = this.acct(id, name);
        let paid: boolean;
        if (a.n >= ORDERS_PER_CAST) {
            a.n -= ORDERS_PER_CAST;
            paid = false;
        } else {
            const w = this.wallets.get(id);
            if (!w || w.cents < PRICE_PER_CAST) {
                this.wanted.set(id, word);
                return this.note(`${name}：军令 ${a.n}/${ORDERS_PER_CAST}，多发弹幕攒令，或打赏 $${PRICE_PER_CAST / 100} 马上替你放【${word}】`);
            }
            w.cents -= PRICE_PER_CAST;
            paid = true;
        }
        this.save();
        const item: QueuedCast = { uid: id, viewer: name, side, six: SIX_BY_WORD[word], word, paid };
        // 付费的排在军令放的前面（同类按先后）
        if (paid) {
            const firstFree = this.queue.findIndex((q) => !q.paid);
            if (firstFree < 0) this.queue.push(item); else this.queue.splice(firstFree, 0, item);
        } else {
            this.queue.push(item);
        }
        return this.note(`${name} 替${this.sideName(side)}点了【${word}】${paid ? '（付费）' : '（军令）'}，排第 ${this.queue.indexOf(item) + 1}`);
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
        // 一仗打完：没轮到的作废，站队清空
        if (this.wasActive && !active) this.endBattle();
        this.wasActive = active;
        if (!active || this.queue.length === 0) return;
        const head = this.queue[0];
        const r = this.war()!.castViewerSkill(head.side, head.six, head.viewer);
        // 布阵中（还没开打）也算「等一下」；真正打完由 endBattle 统一作废
        if (r === 'wait' || r === 'closed') return;
        this.queue.shift();
        const skillName = this.war()!.lastSkillNameOf(head.side);
        speechAnnouncer.announceViewerSkill(head.viewer, this.sideName(head.side).replace(/（.）$/, ''), skillName);
        this.note(`${head.viewer} 替${this.sideName(head.side)}放了【${skillName}】`);
        this.report({ viewer: head.viewer, side: head.side, six: head.six, paid: head.paid, outcome: 'cast', skillName });
    }

    private endBattle(): void {
        for (const q of this.queue) this.voidCast(q);
        this.queue = [];
        this.sides.clear();
        this.wanted.clear();
        this.save();
    }

    private voidCast(q: QueuedCast): void {
        if (q.paid) {
            this.credit(q.uid, q.viewer, PRICE_PER_CAST);   // 钱退回余额
        } else {
            const a = this.acct(q.uid, q.viewer);            // 军令退回
            a.n = Math.min(ORDER_CAP, a.n + ORDERS_PER_CAST);
        }
        this.note(`${q.viewer} 的计没轮到，这一仗结束了${q.paid ? '（钱已退回，下一仗还能放）' : '（军令已退回）'}`);
        this.report({ viewer: q.viewer, side: q.side, six: q.six, paid: q.paid, outcome: 'void' });
    }

    private report(r: ViewerCastResult): void {
        this.onResult?.(r);
    }

    // ── 存档：余额永久留着，军令按天 ─────────────────
    private today(): string {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    private rollDay(): void {
        const t = this.today();
        if (this.day !== t) { this.day = t; this.orders.clear(); }
    }

    private load(): void {
        this.day = this.today();
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as {
                day?: string; wallets?: Record<string, { name: string; cents: number }>;
                orders?: Record<string, { name: string; n: number }>;
            };
            for (const [id, w] of Object.entries(s.wallets ?? {})) if (w.cents > 0) this.wallets.set(id, w);
            if (s.day === this.day) {
                for (const [id, o] of Object.entries(s.orders ?? {})) {
                    if (o.n > 0) this.orders.set(id, { name: o.name, n: Math.min(ORDER_CAP, o.n), seen: 0, lastText: '', lastAt: 0 });
                }
            }
        } catch { /* 隐私模式 / 坏数据：当作没有 */ }
    }

    private save(): void {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify({
                day: this.day,
                wallets: Object.fromEntries([...this.wallets].filter(([, w]) => w.cents > 0)),
                orders: Object.fromEntries([...this.orders].filter(([, a]) => a.n > 0).map(([id, a]) => [id, { name: a.name, n: a.n }])),
            }));
        } catch { /* 隐私模式 */ }
    }
}
