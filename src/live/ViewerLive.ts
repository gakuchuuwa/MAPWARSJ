/**
 * 🔴 [2026-10-23 主人「技能槽保持原定不动。既然观众花钱了，就可以直接释放。想放多少次放多少次，放一次就一次钱，第一次免费。」]
 * 直播观众互动：观众在直播间发字，替自己那一方在战术模式里放计。
 *
 * 规矩：
 *   · 站队：发「1」站攻方，发「2」站守方；每一仗重新站（攻守每仗都换）。
 *   · 放计：发「攻 / 胜 / 敌 / 混 / 并 / 败」之一（也认「攻战」这类写法），替自己那方马上放这一计，不等技能槽。
 *   · 一次一付：每放一次付一次；每位观众一场直播第一次免费。
 *   · 排队：两计不许同时放（战术模式那道闸），观众的计按先后排队；付费的排在免费的前面。
 *   · 这一仗打完还没轮到的：作废；免费那次退还资格，付费的回报「没放成」（以后接平台时据此退款）。
 *
 * 消息从哪来：现在用本地测试面板（F9）模拟；以后接 Social Stream Ninja / Crowd Control，调 `onChat` 即可。
 */
import type { GameApp } from '../app/GameApp';
import type { TacticalSixSet } from '../data/TacticalSkillCatalog';
import { speechAnnouncer } from '../audio/SpeechAnnouncer';

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
    /** cast＝放成了；void＝这一仗打完没轮到，作废 */
    outcome: 'cast' | 'void';
    skillName?: string;
}

interface QueuedCast {
    viewer: string;
    side: 0 | 1;
    six: TacticalSixSet;
    paid: boolean;
    onResult?: (r: ViewerCastResult) => void;
}

/** 多久试一次放排队的计（毫秒） */
const TICK_MS = 250;

export class ViewerLive {
    /** 这一仗谁站哪一方 */
    private sides = new Map<string, 0 | 1>();
    /** 这一场直播里已经用过免费那一次的观众 */
    private freeUsed = new Set<string>();
    private queue: QueuedCast[] = [];
    private wasActive = false;
    /** 最近几条记录（面板显示） */
    private log: string[] = [];
    /** 放成功 / 作废都通知（以后接付费平台：据此确认扣费或退款） */
    public onResult: ((r: ViewerCastResult) => void) | null = null;

    constructor(private readonly app: GameApp) {
        window.setInterval(() => this.tick(), TICK_MS);
    }

    /**
     * 收到一条直播间消息。paid＝这条消息带了付费（礼物、超级留言、Crowd Control 金币）。
     * 返回给观众看的一句回应（面板记录用）。
     */
    public onChat(viewer: string, text: string, paid = false): string {
        const name = viewer.trim() || '观众';
        const word = text.trim();
        if (!this.battleOn()) return this.note(`${name}：现在没在打仗，等下一仗`);
        if (word === '1' || word === '2') {
            const side: 0 | 1 = word === '1' ? 0 : 1;
            this.sides.set(name, side);
            return this.note(`${name} 站了${this.sideName(side)}`);
        }
        const six = SIX_BY_WORD[word];
        if (!six) return '';
        const side = this.sides.get(name);
        if (side === undefined) return this.note(`${name}：先发 1 或 2 站队，再放计`);
        if (!paid && this.freeUsed.has(name)) return this.note(`${name}：免费那次用过了，再放需要付费`);
        if (!paid) this.freeUsed.add(name);
        const item: QueuedCast = { viewer: name, side, six, paid };
        // 付费的排在免费的前面（同类按先后）
        if (paid) {
            const firstFree = this.queue.findIndex((q) => !q.paid);
            if (firstFree < 0) this.queue.push(item); else this.queue.splice(firstFree, 0, item);
        } else {
            this.queue.push(item);
        }
        return this.note(`${name} 替${this.sideName(side)}点了【${word}】${paid ? '（付费）' : '（免费）'}，排第 ${this.queue.indexOf(item) + 1}`);
    }

    /** 面板用：两边人数、排队、最近记录 */
    public snapshot(): { on: boolean; names: [string, string]; counts: [number, number]; queue: string[]; log: string[] } {
        let a = 0, d = 0;
        for (const s of this.sides.values()) { if (s === 0) a++; else d++; }
        return {
            on: this.battleOn(),
            names: [this.sideName(0), this.sideName(1)],
            counts: [a, d],
            queue: this.queue.map((q) => `${q.viewer}（${this.sideName(q.side)}）${q.paid ? '付费' : '免费'}`),
            log: [...this.log],
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
    }

    private voidCast(q: QueuedCast): void {
        if (!q.paid) this.freeUsed.delete(q.viewer);   // 免费那次退还资格
        this.note(`${q.viewer} 的计没轮到，这一仗结束了${q.paid ? '（付费，待退）' : '（免费次数已退还）'}`);
        this.report({ viewer: q.viewer, side: q.side, six: q.six, paid: q.paid, outcome: 'void' });
    }

    private report(r: ViewerCastResult): void {
        this.onResult?.(r);
    }
}
