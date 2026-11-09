/**
 * 主角一生履历（军旅日记）。
 *
 * 🔴 [2026-11-09 主人定「军人一生履历记录器」] 从「可玩性」转「可看性」的第一步：
 *    把主角**真实发生过的事**按时间记下来——投奔、离队、每场亲身上阵的大战（胜负 / 兵力 / 斩敌）、
 *    升官 / 贬谪、获得兵模、被观众改名、封侯立国。不写剧本，只记事实；
 *    右侧面板「履历」页签显示它，之后的传记旁白、局后 AI 故事资料包都从这里取数。
 *
 * 年龄：一生从 16 岁起，按游戏年份增长；主人定「不老死」，所以年龄只记录、不触发任何结局。
 * 每条同时记游戏年份和现实时间（Date.now），后者用来换算直播录像里的时间点。
 */

export type LifeEventKind =
    | 'start'     // 白身起家
    | 'join'      // 投奔某武将麾下
    | 'leave'     // 离开军团
    | 'battle'    // 亲身上阵的一仗
    | 'promote'   // 晋升
    | 'demote'    // 功劳归零、官职回平民
    | 'unit'      // 获得新兵模
    | 'rename'    // 改名
    | 'title';    // 封侯、立国、称帝这类身份大事

export interface LifeEvent {
    /** 游戏年份（公元前为负） */
    year: number;
    /** 游戏季（0 春 1 夏 2 秋 3 冬） */
    season: number;
    /** 现实时间（毫秒时间戳），用于换算直播录像时间点 */
    realMs: number;
    /** 记这条时连着的 YouTube 直播（视频网址或编号；没连直播为空），用来认出是哪一场直播 */
    video?: string;
    /** 当时年龄 */
    age: number;
    /** 当时官职名 */
    rank: string;
    kind: LifeEventKind;
    /** 一句话事实，直接显示在面板上 */
    text: string;
    /** 结构化数据，留给传记旁白和 AI 资料包用 */
    data?: Record<string, string | number | boolean | null>;
}

export interface LifeLogSave {
    startYear: number | null;
    events: LifeEvent[];
}

/** 起始年龄 */
export const LIFE_START_AGE = 16;
/** 最多保留多少条（防止存档无限变大；超出时丢最早的非关键条目） */
const LIFE_MAX_EVENTS = 3000;

export class PlayerLifeLog {
    private startYear: number | null = null;
    private events: LifeEvent[] = [];
    private listeners = new Set<() => void>();
    /** 读档期间不记事（读档会重放改名等操作） */
    private muted = false;

    constructor(
        private readonly getYear: () => number,
        private readonly getSeason: () => number,
        private readonly getStreamVideo: () => string = () => '',
    ) {}

    /** 当前年龄（还没起家时按 16 岁算） */
    public getAge(): number {
        if (this.startYear === null) return LIFE_START_AGE;
        return LIFE_START_AGE + Math.max(0, Math.floor(this.getYear() - this.startYear));
    }

    public getStartYear(): number | null { return this.startYear; }

    public getEvents(): readonly LifeEvent[] { return this.events; }

    public onChange(fn: () => void): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    public setMuted(on: boolean): void { this.muted = on; }

    /** 记一条。第一次记事时自动补一条「白身起家」，并以当年为 16 岁。 */
    public record(kind: LifeEventKind, text: string, rank: string, data?: LifeEvent['data']): void {
        if (this.muted) return;
        if (this.startYear === null) {
            this.startYear = this.getYear();
            if (kind !== 'start') this.push('start', '白身起家，投身军旅', rank);
        }
        this.push(kind, text, rank, data);
        this.emit();
    }

    /** 恩主：跟随作战场次最多的武将（并列取先跟的） */
    public getPatron(): { generalId: string; name: string; battles: number } | null {
        return this.topBy('battle', 'patronId', 'patronName');
    }

    /** 宿敌：交手次数最多的敌将（并列取先遇到的） */
    public getRival(): { generalId: string; name: string; battles: number } | null {
        return this.topBy('battle', 'enemyGeneralId', 'enemyName');
    }

    /** 战绩汇总 */
    public getBattleTotals(): { battles: number; wins: number; losses: number; killed: number } {
        let battles = 0, wins = 0, losses = 0, killed = 0;
        for (const e of this.events) {
            if (e.kind !== 'battle') continue;
            battles++;
            if (e.data?.result === 'victory') wins++;
            else losses++;
            killed += Number(e.data?.enemyKilled ?? 0) || 0;
        }
        return { battles, wins, losses, killed };
    }

    public toSave(): LifeLogSave {
        return { startYear: this.startYear, events: this.events.map((e) => ({ ...e, data: e.data ? { ...e.data } : undefined })) };
    }

    public restore(s: LifeLogSave | null | undefined): void {
        this.startYear = typeof s?.startYear === 'number' && Number.isFinite(s.startYear) ? s.startYear : null;
        this.events = Array.isArray(s?.events)
            ? s.events.filter((e) => e && typeof e.text === 'string' && typeof e.year === 'number')
                .map((e) => ({ ...e, data: e.data ? { ...e.data } : undefined }))
            : [];
        this.emit();
    }

    private push(kind: LifeEventKind, text: string, rank: string, data?: LifeEvent['data']): void {
        this.events.push({
            year: this.getYear(),
            season: this.getSeason(),
            realMs: Date.now(),
            video: this.getStreamVideo() || undefined,
            age: this.getAge(),
            rank,
            kind,
            text,
            data: data ? { ...data } : undefined,
        });
        if (this.events.length > LIFE_MAX_EVENTS) {
            // 兵模、改名这类小事先丢；大事（起家/投奔/大战/升贬/封号）尽量留
            const minor = this.events.findIndex((e) => e.kind === 'unit' || e.kind === 'rename');
            this.events.splice(minor >= 0 ? minor : 1, 1);
        }
    }

    private topBy(kind: LifeEventKind, idKey: string, nameKey: string): { generalId: string; name: string; battles: number } | null {
        const counts = new Map<string, { name: string; battles: number; first: number }>();
        this.events.forEach((e, i) => {
            if (e.kind !== kind) return;
            const id = e.data?.[idKey];
            if (typeof id !== 'string' || !id) return;
            const name = String(e.data?.[nameKey] ?? id);
            const c = counts.get(id) ?? { name, battles: 0, first: i };
            c.battles++;
            counts.set(id, c);
        });
        let best: { generalId: string; name: string; battles: number; first: number } | null = null;
        for (const [generalId, c] of counts) {
            if (!best || c.battles > best.battles || (c.battles === best.battles && c.first < best.first)) {
                best = { generalId, ...c };
            }
        }
        return best ? { generalId: best.generalId, name: best.name, battles: best.battles } : null;
    }

    private emit(): void {
        for (const fn of this.listeners) fn();
    }
}
