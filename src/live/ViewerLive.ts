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
 *   · 防刷：点赞 / 订阅只认超过历史最高的那部分（取消再点、退订再订不重复发）；TikTok 关注一人一天只奖一次。
 *   · 作废退回的令不受上限：那是他自己花出去的。
 *
 * 🔴 [2026-10-25 主人「我不懂，还是你来定吧。我只希望项目可以有人看，慢慢的有钱挣就行」] 免费计限量（我定的）：
 *   · 为什么：武将 45 秒集满一计；免费军令下，一个积极观众约每分钟一计，十个人就是武将的四倍——胜负变成比人数、
 *     大字刷屏分不清谁放的、每句「感谢某某」都让战斗音效停（主人 10-02 定「播报时不放战斗音效」）。
 *   · 免费计（花军令）全场每 FREE_CAST_GAP_MS 最多放一计；每人同时只排一计，排着时又点的那一计等前一计放完自动接上。
 *   · 付费计不受这两条限，只守战术模式「两计不许同时放」那道闸——花钱的就是能马上放，这才值得花钱。
 *   · 语音：付费计每次都念「感谢某某」；免费计只在语音空闲时念，不排队（排起来会越拖越晚，还一直压着战斗音效）。
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
export const CHAT_COOLDOWN_MS = 20_000;
/** 免费计（花军令放的）全场至少隔多久放一计（毫秒）；付费计不受这个限 */
export const FREE_CAST_GAP_MS = 10_000;
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

/** 港台观众打繁体「勝 敵 並 敗」也认；输入法全角的「１」「２」由 NFKC 折成半角 */
const TRAD_TO_SIMP: Record<string, string> = { 勝: '胜', 敵: '敌', 並: '并', 併: '并', 敗: '败', 戰: '战' };
function normalizeCommand(text: string): string {
    return text.normalize('NFKC').trim().replace(/[勝敵並併敗戰]/g, (c) => TRAD_TO_SIMP[c]);
}

/** 这条字是不是站队 / 放计的口令（站外打赏留言只认口令，闲聊不攒令） */
function isCommand(word: string): boolean {
    const combo = word.match(/^([12])\s*(\S+)$/);
    return word === '1' || word === '2' || !!SIX_BY_WORD[word] || (!!combo && !!SIX_BY_WORD[combo[2]]);
}

/** 昵称上屏、进语音最多几个字：大字和语音都短，长英文名也不至于念半天 */
const NAME_MAX = 6;

/**
 * 昵称上屏、进语音前的清洗：昵称会被放成大字、被语音念出来，等于主播替他广播。
 * 去掉网址和 5 位以上的连串数字（广告、QQ、微信号最常见的样子），再截到 NAME_MAX 个字。
 */
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

/** 站外打赏按名字认人用：不截断，只去大小写、多余空白和开头的 @ */
function nameKey(raw: string): string {
    return raw.normalize('NFKC').trim().replace(/^@/, '').replace(/\s+/g, ' ').toLowerCase();
}

/** 站外打赏一时认不出是谁：钱先挂在「pay:名字」这个户头上，等同名的人来发弹幕时认领 */
const PENDING_PREFIX = 'pay:';

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

/** 一位观众的军令账户；seen / lastText / lastAt / lastEarn 只在内存，刷新页面就没了 */
interface OrderAcct {
    name: string;
    n: number;
    seen: number;
    lastText: string;
    lastAt: number;
    /** 最近一次自己挣到令的时刻（面板「军令」一行按它排，全场奖励不算） */
    lastEarn: number;
    /** 今天关注奖励领过了（TikTok） */
    followed: boolean;
}

/** 语音里的令数：「加两令」比「加二令」顺 */
const CN_NUM = ['零', '一', '两', '三', '四', '五', '六'];

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
    /** 今天在直播间说过话的人：名字 → 观众 id（站外打赏按名字找人；同名可能不止一个） */
    private nameIndex = new Map<string, Set<string>>();
    private queue: QueuedCast[] = [];
    /** 上一次放出免费计的时刻（Date.now）；一仗打完归零 */
    private lastFreeCastAt = 0;
    private wasActive = false;
    private day = '';
    /** 最近几条记录（面板显示） */
    private log: string[] = [];
    /** 全场目标：点赞 / 订阅总数的历史最高（-1＝还没收到过，第一次只记下不发奖） */
    private likeMax = -1;
    private subMax = -1;
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
    /** 最近一次从直播间收到消息的时刻（Bridge 写）；F9 里看弹幕还通不通——SSN 连着不等于聊天窗口还开着 */
    public lastChatAt = 0;

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
        const name = cleanViewerName(viewer);
        const id = uid || viewer.trim() || '观众';
        let word = normalizeCommand(text);
        // 站外打赏的临时户头不算「在场」，也不进名字索引（它本身就是按名字等人认领的）
        if (!id.startsWith(PENDING_PREFIX)) {
            this.acct(id, name).seen = Date.now();
            this.linkName(id, name, viewer);
        }
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
        const name = cleanViewerName(viewer);
        const w = this.credit(uid, name, cents);
        if (!uid.startsWith(PENDING_PREFIX)) this.acct(uid, name).seen = Date.now();
        this.note(`感谢 ${name} 的${what}！可放 ${Math.floor(w.cents / PRICE_PER_CAST)} 计`);
        this.fulfillWanted(uid, name);
    }

    /**
     * 站外打赏（Ko-fi / Stripe 等经 SSN webhook 进来）：那边只有打赏者自己填的名字，跟 YouTube 聊天里的观众 id 对不上，
     * 直接按 webhook 的 id 记账，钱就落进一个没人能用的户头。所以按名字找人：
     *   · 今天在直播间说过话、名字相同的只有一位 → 直接记给他，留言里带的口令（如「1攻」）也替他执行；
     *   · 找不到或同名不止一位 → 先挂在「pay:名字」户头上，等这个名字的人来发弹幕时认领。
     * 别人故意改成同名能冒领——为一两美元这么做的可能很小，先这样；要更稳得让打赏者留言里写一个暗号。
     */
    public onExternalPayment(payer: string, cents: number, what: string, message: string): void {
        if (!(cents > 0)) return;
        const ids = [...(this.nameIndex.get(nameKey(payer)) ?? [])];
        const word = normalizeCommand(message);
        if (ids.length === 1) {
            this.onPayment(ids[0], payer, cents, what);
            if (word) this.onChat(payer, word, false, ids[0]);
            return;
        }
        const pid = PENDING_PREFIX + nameKey(payer);
        this.onPayment(pid, payer, cents, what);
        this.note(`${cleanViewerName(payer)}：在直播间用同一个名字发一条弹幕，这笔就记到你名下`);
        // 口令照样认（打仗时留言「1攻」能直接放）；闲聊留言不给这个临时户头攒令
        if (isCommand(word)) this.onChat(payer, word, false, pid);
    }

    /** 直播间在线人数（YouTube 接口 / SSN 的 viewer_update）；决定点赞一档多少个 */
    public onViewers(n: number): void {
        if (Number.isFinite(n) && n >= 0) this.viewers = Math.floor(n);
    }

    /** 直播当前的点赞总数。第一次只记下；之后超过历史最高多少算多少，满一档全场发令 */
    public onLikeTotal(total: number): void {
        if (!Number.isFinite(total) || total < 0) return;
        this.likeTotal = total;
        if (this.likeMax < 0) { this.likeMax = total; return; }
        if (total <= this.likeMax) return;
        const d = total - this.likeMax;
        this.likeMax = total;
        this.addLikes(d);
    }

    /** 直接加几个赞（TikTok 的 liked 事件，一条＝一份） */
    public onLikes(d = 1): void {
        this.likeTotal += d;
        this.addLikes(d);
    }

    /**
     * 频道当前的订阅总数。第一次只记下；超过历史最高就感谢并全场发令。
     * YouTube 接口的订阅数只保留三位有效数字（1000 以上一跳 10 个），所以不报「几位」，只报涨到多少。
     */
    public onSubTotal(total: number): void {
        if (!Number.isFinite(total) || total < 0) return;
        this.subTotal = total;
        if (this.subMax < 0) { this.subMax = total; return; }
        if (total <= this.subMax) return;
        const d = total - this.subMax;
        this.subMax = total;
        const each = Math.min(d, GOAL_BONUS_MAX) * SUB_BONUS;
        const k = this.grantPresent(each);
        this.note(`订阅涨到 ${total}！感谢新入营的将士，在场 ${k} 人各 +${each} 令`);
        speechAnnouncer.announceViewerThanks(`感谢新入营的将士，在场每人加${CN_NUM[each] ?? each}令`);
    }

    /** 换了一场直播（视频 ID 变了）：点赞 / 订阅重新记起，免得拿上一场的最高值卡住这一场 */
    public resetGoals(): void {
        this.likeMax = -1;
        this.subMax = -1;
        this.likeProg = 0;
        this.likeTotal = 0;
    }

    /** 某观众关注了主播（TikTok 的 followed 事件）：个人 +SUB_BONUS 令，一人一天一次（防取关再关注） */
    public onFollow(uid: string, viewer: string): void {
        const name = cleanViewerName(viewer);
        const a = this.acct(uid, name);
        a.seen = Date.now();
        if (a.followed) return;
        a.followed = true;
        this.addOrders(uid, name, SUB_BONUS);
        this.note(`感谢 ${name} 入营！+${SUB_BONUS} 令`);
    }

    public pricePerCast(): number { return PRICE_PER_CAST; }

    /** 面板用：两边人数、排队、最近记录、价目、全场目标 */
    public snapshot(): {
        on: boolean; names: [string, string]; counts: [number, number];
        queue: string[]; log: string[]; price: number; platform: string;
        goal: { likes: number; likeProg: number; likeStep: number; subs: number; viewers: number; present: number };
        /** 最近自己挣到令的几个人和他们现有的令（让观众看见自己那条弹幕算上了） */
        top: { name: string; n: number }[];
        yt: string;
        /** 离上一条直播间消息过了多少秒；-1＝还没收到过 */
        lastChatAgo: number;
        /** 排队的人（面板只列名字，付费的标出来） */
        queueBrief: { name: string; paid: boolean }[];
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
            queue: this.queue.map((q) => `${q.viewer} ${this.sideName(q.side)} ${q.paid ? '付费' : '军令'}`),
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
            queueBrief: this.queue.map((q) => ({ name: q.viewer, paid: q.paid })),
        };
    }

    // ── 内部 ───────────────────────────────────────────
    private war() {
        return this.app.scene13War;
    }

    private battleOn(): boolean {
        return this.war()?.isActive?.() === true;
    }

    /** 这一方叫什么：「攻方大秦」，没有势力名就「攻方」（界面文字不用括号，主人 2026-09-07 定） */
    private sideName(side: 0 | 1): string {
        return `${side === 0 ? '攻方' : '守方'}${this.sideFaction(side)}`;
    }

    /** 这一方的势力名，没有就空串（语音只念势力名） */
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
            a = { name, n: 0, seen: 0, lastText: '', lastAt: 0, lastEarn: 0, followed: false };
            this.orders.set(id, a);
        }
        a.name = name;
        return a;
    }

    /** 记下「这个名字今天是这位观众」，并认领挂在这个名字上的站外打赏 */
    private linkName(id: string, name: string, raw: string): void {
        const key = nameKey(raw);
        if (!key) return;
        const set = this.nameIndex.get(key) ?? new Set<string>();
        set.add(id);
        this.nameIndex.set(key, set);
        const pid = PENDING_PREFIX + key;
        const pending = this.wallets.get(pid);
        if (!pending || pending.cents <= 0) return;
        this.wallets.delete(pid);
        const w = this.credit(id, name, pending.cents);
        this.note(`${name} 的站外打赏到账！可放 ${Math.floor(w.cents / PRICE_PER_CAST)} 计`);
    }

    /** 站队：这一仗第一次站队 +1 令 */
    private joinSide(id: string, name: string, side: 0 | 1): void {
        const first = !this.sides.has(id);
        this.sides.set(id, side);
        if (first) this.addOrders(id, name, 1);
    }

    /**
     * 打仗时的有效弹幕 +1 令：隔够冷却、跟上一条不同、去掉空白标点表情后至少两个字。
     * 表情：Unicode 表情（含肤色、❤️ 后面的变体符、组合表情的连接符）和 YouTube 纯文字模式下的 `:face-blue-smiling:` 都去掉。
     */
    private earnByChat(id: string, name: string, text: string): void {
        if (!this.battleOn()) return;
        const a = this.acct(id, name);
        const now = Date.now();
        const core = text.replace(/:[\w-]+:/g, '').replace(/[\s\p{P}\p{S}\p{M}\p{C}]/gu, '');
        if (core.length < 2 || core === a.lastText || now - a.lastAt < CHAT_COOLDOWN_MS) return;
        a.lastText = core;
        a.lastAt = now;
        this.addOrders(id, name, 1);
    }

    /**
     * 给一个人加军令（封顶；已经超过上限的——作废退回的——不往下砍）；把他之前没放成的那一计放出去。
     * bulk＝全场奖励：不逐人刷「攒够」记录、不逐人存档（由调用方存一次），也不算他自己挣的。
     */
    private addOrders(id: string, name: string, n: number, bulk = false): void {
        const a = this.acct(id, name);
        const before = a.n;
        a.n = Math.max(a.n, Math.min(ORDER_CAP, a.n + n));
        if (!bulk) {
            a.lastEarn = Date.now();
            if (before < ORDERS_PER_CAST && a.n >= ORDERS_PER_CAST) {
                this.note(`${name} 攒够 ${ORDERS_PER_CAST} 令，可以放计了`);
            }
            this.save();
        }
        this.fulfillWanted(id, name);
    }

    /** 最近说过话的人（在场）：[观众 id, 昵称] */
    private presentIds(): [string, string][] {
        const cut = Date.now() - PRESENT_MS;
        const ids: [string, string][] = [];
        for (const [id, a] of this.orders) if (a.seen > cut) ids.push([id, a.name]);
        return ids;
    }

    /** 全场每个在场的人各 +n 令；返回在场人数。名单先抄下来——发令途中跨了零点会清空账户表 */
    private grantPresent(n: number): number {
        const ids = this.presentIds();
        for (const [id, name] of ids) this.addOrders(id, name, n, true);
        this.save();
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

    /** 现在能不能替他排一计：军令够、而且他没有免费计在排；或者钱够（付费不受「每人只排一计」限） */
    private canAfford(id: string): boolean {
        const freeOk = (this.orders.get(id)?.n ?? 0) >= ORDERS_PER_CAST && !this.hasFreeQueued(id);
        return freeOk || (this.wallets.get(id)?.cents ?? 0) >= PRICE_PER_CAST;
    }

    private hasFreeQueued(id: string): boolean {
        return this.queue.some((q) => q.uid === id && !q.paid);
    }

    /**
     * 观众要放一计：先花军令（他没有免费计在排时），不行再扣余额；都不行就记下，攒够 / 前一计放完再替他排。
     */
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
                if (queuedFree && a.n >= ORDERS_PER_CAST) {
                    return this.note(`${name}：已有一计在排队，放完接着替你放【${word}】`);
                }
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
        return this.note(`${name} 替${this.sideName(side)}点了【${word}】，${paid ? '付费' : '花军令'}，排第 ${this.queue.indexOf(item) + 1}`);
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
        // 免费计全场限速（付费的都排在免费的前面，排头是免费的就说明眼下没有付费计在等）
        if (!head.paid && Date.now() - this.lastFreeCastAt < FREE_CAST_GAP_MS) return;
        const r = this.war()!.castViewerSkill(head.side, head.six, head.viewer, head.paid);
        // 布阵中（还没开打）也算「等一下」；真正打完由 endBattle 统一作废
        if (r === 'wait' || r === 'closed') return;
        this.queue.shift();
        if (!head.paid) this.lastFreeCastAt = Date.now();
        const skillName = this.war()!.lastSkillNameOf(head.side);
        speechAnnouncer.announceViewerSkill(head.viewer, this.sideFaction(head.side) || this.sideName(head.side), skillName, { onlyIfIdle: !head.paid });
        this.note(`${head.viewer} 替${this.sideName(head.side)}放了【${skillName}】`);
        this.report({ viewer: head.viewer, side: head.side, six: head.six, paid: head.paid, outcome: 'cast', skillName });
        // 他排着时又点的那一计，现在接着排
        this.fulfillWanted(head.uid, head.viewer);
    }

    private endBattle(): void {
        for (const q of this.queue) this.voidCast(q);
        this.queue = [];
        this.lastFreeCastAt = 0;
        this.sides.clear();
        this.wanted.clear();
        this.save();
    }

    private voidCast(q: QueuedCast): void {
        if (q.paid) {
            this.credit(q.uid, q.viewer, PRICE_PER_CAST);   // 钱退回余额
        } else {
            this.acct(q.uid, q.viewer).n += ORDERS_PER_CAST; // 军令原数退回，不受上限
        }
        this.note(`${q.viewer} 的计没轮到，这一仗结束了，${q.paid ? '钱已退回，下一仗还能放' : '军令已退回'}`);
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
        if (this.day !== t) { this.day = t; this.orders.clear(); this.nameIndex.clear(); }
    }

    private load(): void {
        this.day = this.today();
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as {
                day?: string; wallets?: Record<string, { name: string; cents: number }>;
                orders?: Record<string, { name: string; n: number; f?: 1 }>;
            };
            for (const [id, w] of Object.entries(s.wallets ?? {})) if (w.cents > 0) this.wallets.set(id, w);
            if (s.day === this.day) {
                for (const [id, o] of Object.entries(s.orders ?? {})) {
                    if (o.n > 0 || o.f) {
                        this.orders.set(id, { name: o.name, n: Math.max(0, o.n), seen: 0, lastText: '', lastAt: 0, lastEarn: 0, followed: !!o.f });
                    }
                }
            }
        } catch { /* 隐私模式 / 坏数据：当作没有 */ }
    }

    private save(): void {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify({
                day: this.day,
                wallets: Object.fromEntries([...this.wallets].filter(([, w]) => w.cents > 0)),
                orders: Object.fromEntries([...this.orders]
                    .filter(([, a]) => a.n > 0 || a.followed)
                    .map(([id, a]) => [id, a.followed ? { name: a.name, n: a.n, f: 1 } : { name: a.name, n: a.n }])),
            }));
        } catch { /* 隐私模式 */ }
    }
}
