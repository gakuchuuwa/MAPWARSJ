/**
 * 🔴 [2026-10-23 主人「技能槽保持原定不动。既然观众花钱了，就可以直接释放。想放多少次放多少次，放一次就一次钱，第一次免费。」]
 * 直播观众互动：观众在直播间发字，替自己那一方在战术模式里放计。
 *
 * 规矩：
 *   · 站队：发「1」站攻方，发「2」站守方；每一仗重新站（攻守每仗都换）。也认「1攻」这种一条带完。
 *   · 放计：发「攻 / 胜 / 敌 / 混 / 并 / 败」之一（也认「攻战」这类写法），替自己那方马上放这一计，不等技能槽。
 *   · 一次一付：每放一次付一次（PRICE_PER_CAST）；每位观众一天第一次免费。
 *   · 排队：两计不许同时放（战术模式那道闸），观众的计按先后排队；付费的排在免费的前面。
 *   · 这一仗打完还没轮到的：作废；免费那次退还资格，付费的钱退回观众余额，下一仗照样能用。
 *
 * 🔴 [2026-10-24 主人「全面进行直播挣钱模式」] 接上直播间（`SocialStreamBridge`，B 站要粉丝量上不了，不接）：
 *   · 打赏（YouTube 超级留言、Twitch Bits、TikTok 礼物、Ko-fi）折合美元记进观众余额（美分），满一次的钱就能放一计；
 *     零头留着攒，下次打赏凑够了照样算。
 *   · 钱不够时发了计：记住他想放哪一计，等他打赏凑够钱马上替他放，不用再发一遍。
 *   · 打赏留言里带了计（如「1攻」）：钱进余额后直接按留言放。
 *   · 余额与免费资格存 localStorage：直播中刷新页面，观众付过的钱不丢。
 */
import type { GameApp } from '../app/GameApp';
import type { TacticalSixSet } from '../data/TacticalSkillCatalog';
import { speechAnnouncer } from '../audio/SpeechAnnouncer';

/** 放一计要多少钱（美分）。100＝1 美元：YouTube 超级留言、Ko-fi 的最低额都在这一档 */
export const PRICE_PER_CAST = 100;

/** 观众发的字 → 六计 */
const SIX_BY_WORD: Record<string, TacticalSixSet> = {
    攻: 'gongzhan', 胜: 'shengzhan', 敌: 'dizhan', 混: 'hunzhan', 并: 'bingzhan', 败: 'baizhan',
    攻战: 'gongzhan', 胜战: 'shengzhan', 敌战: 'dizhan', 混战: 'hunzhan', 并战: 'bingzhan', 败战: 'baizhan',
};

export interface ViewerCastResult {
    viewer: string;
    side: 0 | 1;
    six: TacticalSixSet;
    paid: boolean;
    /** cast＝放成了；void＝这一仗打完没轮到，作废（付费的钱已退回余额） */
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

/** 多久试一次放排队的计（毫秒） */
const TICK_MS = 250;
const STORE_KEY = 'mapwar-live-wallet';

export class ViewerLive {
    /** 这一仗谁站哪一方（键＝观众 id） */
    private sides = new Map<string, 0 | 1>();
    /** 今天已经用过免费那一次的观众 */
    private freeUsed = new Set<string>();
    /** 观众余额（美分），name 是最近一次的昵称 */
    private wallets = new Map<string, { name: string; cents: number }>();
    /** 钱不够没放成的那一计：等他送礼凑够钱就替他放 */
    private wanted = new Map<string, string>();
    private queue: QueuedCast[] = [];
    private wasActive = false;
    private day = '';
    /** 最近几条记录（面板显示） */
    private log: string[] = [];
    /** 放成功 / 作废都通知 */
    public onResult: ((r: ViewerCastResult) => void) | null = null;
    /** 直播间连接状态（面板显示）；空＝没接平台，只用 F9 测试 */
    public platformStatus = '';

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
        if (paid) this.credit(id, name, PRICE_PER_CAST);
        // 「1攻」「2 败」：一条消息里先站队再放计
        const combo = word.match(/^([12])\s*(\S+)$/);
        if (combo && SIX_BY_WORD[combo[2]]) {
            if (!this.battleOn()) return this.note(`${name}：现在没在打仗，等下一仗`);
            this.sides.set(id, combo[1] === '1' ? 0 : 1);
            word = combo[2];
        }
        if (word === '1' || word === '2') {
            if (!this.battleOn()) return this.note(`${name}：现在没在打仗，等下一仗`);
            const side: 0 | 1 = word === '1' ? 0 : 1;
            this.sides.set(id, side);
            return this.note(`${name} 站了${this.sideName(side)}`);
        }
        if (!SIX_BY_WORD[word]) return '';
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
        this.note(`感谢 ${name} 的${what}！可放 ${Math.floor(w.cents / PRICE_PER_CAST)} 计`);
        const word = this.wanted.get(uid);
        if (word && this.battleOn() && this.sides.has(uid) && w.cents >= PRICE_PER_CAST) {
            this.wanted.delete(uid);
            this.request(uid, name, word);
        }
    }

    public pricePerCast(): number { return PRICE_PER_CAST; }

    /** 面板用：两边人数、排队、最近记录、价目 */
    public snapshot(): {
        on: boolean; names: [string, string]; counts: [number, number];
        queue: string[]; log: string[]; price: number; platform: string;
    } {
        let a = 0, d = 0;
        for (const s of this.sides.values()) { if (s === 0) a++; else d++; }
        return {
            on: this.battleOn(),
            names: [this.sideName(0), this.sideName(1)],
            counts: [a, d],
            queue: this.queue.map((q) => `${q.viewer}（${this.sideName(q.side)}）${q.paid ? '付费' : '免费'}`),
            log: [...this.log],
            price: PRICE_PER_CAST,
            platform: this.platformStatus,
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

    /** 观众要放一计：先用免费那次，再扣余额；钱不够就记下等他送礼 */
    private request(id: string, name: string, word: string): string {
        const side = this.sides.get(id);
        if (side === undefined) return this.note(`${name}：先发 1 或 2 站队，再放计`);
        this.rollDay();
        let paid: boolean;
        if (!this.freeUsed.has(id)) {
            this.freeUsed.add(id);
            paid = false;
        } else {
            const w = this.wallets.get(id);
            if (!w || w.cents < PRICE_PER_CAST) {
                this.wanted.set(id, word);
                return this.note(`${name}：免费那次用过了，打赏 $${PRICE_PER_CAST / 100} 马上替你放【${word}】`);
            }
            w.cents -= PRICE_PER_CAST;
            paid = true;
        }
        this.save();
        const item: QueuedCast = { uid: id, viewer: name, side, six: SIX_BY_WORD[word], word, paid };
        // 付费的排在免费的前面（同类按先后）
        if (paid) {
            const firstFree = this.queue.findIndex((q) => !q.paid);
            if (firstFree < 0) this.queue.push(item); else this.queue.splice(firstFree, 0, item);
        } else {
            this.queue.push(item);
        }
        return this.note(`${name} 替${this.sideName(side)}点了【${word}】${paid ? '（付费）' : '（免费）'}，排第 ${this.queue.indexOf(item) + 1}`);
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
        if (q.paid) this.credit(q.uid, q.viewer, PRICE_PER_CAST);   // 钱退回余额
        else this.freeUsed.delete(q.uid);                            // 免费那次退还资格
        this.note(`${q.viewer} 的计没轮到，这一仗结束了${q.paid ? '（钱已退回，下一仗还能放）' : '（免费次数已退还）'}`);
        this.report({ viewer: q.viewer, side: q.side, six: q.six, paid: q.paid, outcome: 'void' });
    }

    private report(r: ViewerCastResult): void {
        this.onResult?.(r);
    }

    // ── 存档：余额永久留着，免费资格按天 ─────────────────
    private today(): string {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    private rollDay(): void {
        const t = this.today();
        if (this.day !== t) { this.day = t; this.freeUsed.clear(); }
    }

    private load(): void {
        this.day = this.today();
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as { day?: string; wallets?: Record<string, { name: string; cents: number }>; freeUsed?: string[] };
            for (const [id, w] of Object.entries(s.wallets ?? {})) if (w.cents > 0) this.wallets.set(id, w);
            if (s.day === this.day) for (const id of s.freeUsed ?? []) this.freeUsed.add(id);
        } catch { /* 隐私模式 / 坏数据：当作没有 */ }
    }

    private save(): void {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify({
                day: this.day,
                wallets: Object.fromEntries([...this.wallets].filter(([, w]) => w.cents > 0)),
                freeUsed: [...this.freeUsed],
            }));
        } catch { /* 隐私模式 */ }
    }
}
