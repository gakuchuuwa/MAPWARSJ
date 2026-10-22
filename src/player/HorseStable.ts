/**
 * 🔴 [2026-10-22 主人令「接着做马系统：自己的马、马龄、疲劳受伤、谱系、存档，把『初马』变成真的马」]
 *
 * 《探马》的马厩：玩家自己的马。规则依据 docs/探马/骨架.md（主人定：马是第二主角，马会老会死，
 * 死前生小马，通灵的联系传给下一代，马的谱系必选）；下面的数字是 Claude 定的，见 docs/探马/马系统.md。
 *
 * - 马龄按游戏年份算（没有公元 0 年）；马会老死。
 * - 疲劳、受伤以「季」计，到期自动好；骑着累的马走得慢，没马可骑只能牵马步行，更慢。
 * - 通灵马一脉：到生育年龄生一匹小马；老死时通灵传给这匹小马（谱系记一代）。
 * - 生死只在百岁模式里发生；跳年时马的年龄不变（跳年是镜头工具，不是时间流逝）。
 */

export type HorseSex = 'mare' | 'stallion';
export type HorseStatus = 'ok' | 'tired' | 'injured' | 'foal';

export interface Horse {
    id: string;
    name: string;
    sex: HorseSex;
    /** 出生年（连续年序：公元前照旧为负，公元 n 年记作 n-1，跳过公元 0 年） */
    born: number;
    /** 寿限（岁） */
    deathAge: number;
    /** 通灵马一脉的第几代（初马＝1）；普通马为 0 */
    generation: number;
    /** 通灵马到这个岁数生小马（普通马不用） */
    foalAge: number;
    foaled: boolean;
    /** 来历（马厩里显示） */
    origin: string;
    /** 到这一季（连续季序）之前疲劳 / 受伤 */
    tiredUntil: number;
    injuredUntil: number;
    /** 这匹马记得的一场仗（通灵战役 id，见 src/story/horseMemories.ts）；没有就不填 */
    memoryId?: string;
    /** 通灵过的最好结果：sync 同步 / full 完全同步 */
    memoryBest?: 'sync' | 'full';
}

export interface PedigreeEntry {
    name: string;
    generation: number;
    bornYear: number;
    diedYear: number;
}

export interface HorseStableSave {
    horses: Horse[];
    mountId: string | null;
    spiritId: string | null;
    pedigree: PedigreeEntry[];
    nextId: number;
}

/** 能骑的最小岁数（军马三岁起调教） */
export const HORSE_RIDE_AGE = 3;
/** 骑着累的马：行军速度系数 */
export const HORSE_TIRED_SPEED = 0.85;
/** 没有能骑的马、只能牵马步行：行军速度系数 */
export const HORSE_ON_FOOT_SPEED = 0.6;

/** 通灵马寿限 22–27 岁、12–15 岁生小马；普通马寿限 18–25 岁 */
const SPIRIT_DEATH_AGE: [number, number] = [22, 27];
const SPIRIT_FOAL_AGE: [number, number] = [12, 15];
const COMMON_DEATH_AGE: [number, number] = [18, 25];

/** 毛色名：小马与缴获的马按这里取名（活着的马不重名） */
const COAT_NAMES = [
    '青骢', '赤骝', '乌骓', '黄骠', '紫骝', '铁骊', '花骢', '枣骝', '银鬃', '雪蹄',
    '踏雪', '照夜', '飞霜', '追风', '流星', '月白', '胭脂', '金鬃', '玉骢', '卷毛',
];

const SEX_LABEL: Record<HorseSex, string> = { mare: '母马', stallion: '公马' };
const STATUS_LABEL: Record<HorseStatus, string> = { ok: '健壮', tired: '疲劳', injured: '受伤', foal: '幼驹' };
const STATUS_RANK: Record<HorseStatus, number> = { ok: 0, tired: 1, injured: 2, foal: 3 };

/** 游戏年份 ↔ 连续年序（跳过公元 0 年） */
export function yearToIndex(year: number): number { return year > 0 ? year - 1 : year; }
export function indexToYear(i: number): number { return i >= 0 ? i + 1 : i; }
/** 季序起点：从公元前 10000 年算起，保证季序恒为正（疲劳受伤期用 0 表示「没有」） */
const SEASON_INDEX_BASE_YEARS = 10000;
/** 连续季序（0 春 … 3 冬），恒为正 */
export function seasonIndex(year: number, season: number): number {
    return (yearToIndex(year) + SEASON_INDEX_BASE_YEARS) * 4 + season;
}

function randInt([lo, hi]: [number, number]): number {
    return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export interface HorseStableDeps {
    /** 当前游戏年份、季（0 春 … 3 冬） */
    getYear(): number;
    getSeason(): number;
    notify(msg: string): void;
    /** 骑乘或状态变了（行军速度、面板要跟着变） */
    onChange(): void;
}

export class HorseStable {
    private horses: Horse[] = [];
    private mountId: string | null = null;
    private spiritId: string | null = null;
    private pedigree: PedigreeEntry[] = [];
    private nextId = 1;
    /** 最近一次换季检查时的季序（未检查过为 null） */
    private lastKey: number | null = null;
    private skipLifeOnce = false;

    constructor(private readonly deps: HorseStableDeps) {}

    // ── 查询 ─────────────────────────────────────────────
    public list(): readonly Horse[] { return this.horses; }
    public isEmpty(): boolean { return this.horses.length === 0; }
    public getMount(): Horse | null { return this.horses.find((h) => h.id === this.mountId) ?? null; }
    public getSpirit(): Horse | null { return this.horses.find((h) => h.id === this.spiritId) ?? null; }
    public isSpirit(h: Horse): boolean { return h.id === this.spiritId; }
    public isMount(h: Horse): boolean { return h.id === this.mountId; }
    public getPedigree(): readonly PedigreeEntry[] { return this.pedigree; }

    public ageOf(h: Horse, year = this.deps.getYear()): number {
        return Math.max(0, yearToIndex(year) - h.born);
    }

    public statusOf(h: Horse): HorseStatus {
        if (this.ageOf(h) < HORSE_RIDE_AGE) return 'foal';
        const now = this.nowKey();
        if (h.injuredUntil > now) return 'injured';
        if (h.tiredUntil > now) return 'tired';
        return 'ok';
    }

    public static sexLabel(h: Horse): string { return SEX_LABEL[h.sex]; }
    public static statusLabel(s: HorseStatus): string { return STATUS_LABEL[s]; }

    /** 行军速度系数：马厩空（还没得到马）＝1，不罚 */
    public speedFactor(): number {
        if (this.horses.length === 0) return 1;
        const mount = this.getMount();
        const s = mount ? this.statusOf(mount) : 'injured';
        if (s === 'ok') return 1;
        if (s === 'tired') return HORSE_TIRED_SPEED;
        return HORSE_ON_FOOT_SPEED;
    }

    // ── 改动 ─────────────────────────────────────────────
    /** 得到一匹马。spirit＝它是通灵马（谱系起点），马厩里只能有一匹 */
    public addHorse(spec: { name?: string; sex?: HorseSex; age: number; origin: string; spirit?: boolean; memoryId?: string }): Horse {
        const year = this.deps.getYear();
        const spirit = spec.spirit === true && !this.spiritId;
        const h: Horse = {
            id: `horse_${this.nextId++}`,
            name: spec.name ?? this.freshName(),
            sex: spec.sex ?? (Math.random() < 0.5 ? 'mare' : 'stallion'),
            born: yearToIndex(year) - spec.age,
            deathAge: randInt(spirit ? SPIRIT_DEATH_AGE : COMMON_DEATH_AGE),
            generation: spirit ? 1 : 0,
            foalAge: spirit ? randInt(SPIRIT_FOAL_AGE) : 0,
            foaled: false,
            origin: spec.origin,
            memoryId: spec.memoryId,
            tiredUntil: 0,
            injuredUntil: 0,
        };
        this.horses.push(h);
        if (spirit) this.spiritId = h.id;
        this.repickMount(true);
        this.deps.onChange();
        return h;
    }

    /** 让一匹马疲劳若干季（默认坐骑） */
    public tire(seasons: number, horse: Horse | null = this.getMount()): void {
        if (!horse) return;
        horse.tiredUntil = Math.max(horse.tiredUntil, this.nowKey() + seasons);
        this.repickMount(true);
        this.deps.onChange();
    }

    /** 让一匹马受伤若干季（默认坐骑） */
    public injure(seasons: number, horse: Horse | null = this.getMount()): void {
        if (!horse) return;
        horse.injuredUntil = Math.max(horse.injuredUntil, this.nowKey() + seasons);
        this.repickMount(true);
        this.deps.onChange();
    }

    /** 失去一匹普通马（被抢、卖掉）；通灵马不会失去。返回失去的那匹 */
    /** 记下一次通灵的结果（只往好里记：完全同步 > 同步） */
    public recordMemory(horse: Horse, result: 'sync' | 'full'): void {
        if (horse.memoryBest === 'full') return;
        horse.memoryBest = result;
        this.deps.onChange();
    }

    public loseCommonHorse(): Horse | null {
        const h = this.horses.find((x) => x.id !== this.spiritId);
        if (!h) return null;
        this.horses = this.horses.filter((x) => x !== h);
        if (this.mountId === h.id) this.mountId = null;
        this.repickMount(true);
        this.deps.onChange();
        return h;
    }

    /** 玩家亲手换坐骑；幼驹不能骑 */
    public setMount(id: string): boolean {
        const h = this.horses.find((x) => x.id === id);
        if (!h || this.statusOf(h) === 'foal') return false;
        this.mountId = id;
        this.deps.onChange();
        return true;
    }

    /**
     * 跳年：所有马的出生年、疲劳受伤期跟着平移，年龄与剩余天数不变。
     * （跳年是控制台/面板的年代跳转，不是时间流逝，不让马一跳就老死。）
     */
    public shiftYears(fromYear: number, toYear: number): void {
        const d = yearToIndex(toYear) - yearToIndex(fromYear);
        if (d === 0) return;
        for (const h of this.horses) {
            h.born += d;
            if (h.tiredUntil > 0) h.tiredUntil += d * 4;
            if (h.injuredUntil > 0) h.injuredUntil += d * 4;
        }
        // 跳到的这一季不算「换季」：不在这里发生生老病死
        this.lastKey = null;
        this.skipLifeOnce = true;
    }

    /**
     * 每帧调用；只在换季时做事。lifeEvents＝是否发生生老病死（只有百岁模式为 true）。
     */
    public tick(lifeEvents: boolean): void {
        const key = this.nowKey();
        if (key === this.lastKey) return;
        const first = this.lastKey === null || this.skipLifeOnce;
        this.lastKey = key;
        this.skipLifeOnce = false;
        if (lifeEvents && !first && this.horses.length > 0) this.runLifeEvents(this.deps.getYear());
        this.repickMount(false);
        this.deps.onChange();
    }

    private runLifeEvents(year: number): void {
        const spirit = this.getSpirit();
        // 通灵马到生育年龄生小马（下一代）
        if (spirit && !spirit.foaled && this.ageOf(spirit, year) >= spirit.foalAge) {
            this.bearFoal(spirit, year);
        }
        // 老死：通灵马把通灵传给它的小马；普通马就此离开
        for (const h of [...this.horses]) {
            if (this.ageOf(h, year) < h.deathAge) continue;
            if (h.id === this.spiritId) {
                if (!h.foaled) this.bearFoal(h, year);
                const heir = this.horses.find((x) => x.generation === h.generation + 1);
                this.pedigree.push({ name: h.name, generation: h.generation, bornYear: indexToYear(h.born), diedYear: year });
                this.spiritId = heir?.id ?? null;
                this.removeHorse(h);
                this.deps.notify(heir
                    ? `🐎 ${h.name}老死了，${this.ageOf(h, year)} 岁。通灵传给了它的小马「${heir.name}」（第 ${heir.generation} 代）`
                    : `🐎 ${h.name}老死了`);
            } else {
                this.removeHorse(h);
                this.deps.notify(`🐎 ${h.name}老死了，${this.ageOf(h, year)} 岁`);
            }
        }
    }

    private bearFoal(parent: Horse, year: number): void {
        parent.foaled = true;
        const foal: Horse = {
            id: `horse_${this.nextId++}`,
            name: this.freshName(),
            sex: Math.random() < 0.5 ? 'mare' : 'stallion',
            born: yearToIndex(year),
            deathAge: randInt(SPIRIT_DEATH_AGE),
            generation: parent.generation + 1,
            foalAge: randInt(SPIRIT_FOAL_AGE),
            foaled: false,
            origin: `${parent.name}所生`,
            tiredUntil: 0,
            injuredUntil: 0,
        };
        this.horses.push(foal);
        this.deps.notify(parent.sex === 'mare'
            ? `🐎 ${parent.name}生下一匹小马「${foal.name}」——通灵的联系会传给它`
            : `🐎 ${parent.name}配种得了一匹小马「${foal.name}」——通灵的联系会传给它`);
    }

    private removeHorse(h: Horse): void {
        this.horses = this.horses.filter((x) => x !== h);
        if (this.mountId === h.id) this.mountId = null;
    }

    /**
     * 坐骑没了、受伤、还是幼驹 → 换一匹能骑的；force＝状态刚变，连「疲劳」也换成更好的。
     * 同等状态优先通灵马。
     */
    private repickMount(force: boolean): void {
        const cur = this.getMount();
        const curRank = cur ? STATUS_RANK[this.statusOf(cur)] : 99;
        if (!force && curRank <= STATUS_RANK.tired) return;
        let best: Horse | null = cur;
        let bestRank = curRank;
        for (const h of this.horses) {
            const r = STATUS_RANK[this.statusOf(h)];
            if (r === STATUS_RANK.foal) continue;
            if (r < bestRank || (r === bestRank && h.id === this.spiritId && best?.id !== this.spiritId)) {
                best = h;
                bestRank = r;
            }
        }
        this.mountId = best && STATUS_RANK[this.statusOf(best)] !== STATUS_RANK.foal ? best.id : null;
    }

    private nowKey(): number {
        return seasonIndex(this.deps.getYear(), this.deps.getSeason());
    }

    private freshName(): string {
        const used = new Set(this.horses.map((h) => h.name));
        const free = COAT_NAMES.filter((n) => !used.has(n));
        const pool = free.length > 0 ? free : COAT_NAMES;
        const base = pool[Math.floor(Math.random() * pool.length)];
        return used.has(base) ? `${base}${this.nextId}` : base;
    }

    // ── 存档 ─────────────────────────────────────────────
    public toSave(): HorseStableSave {
        return {
            horses: this.horses.map((h) => ({ ...h })),
            mountId: this.mountId,
            spiritId: this.spiritId,
            pedigree: this.pedigree.map((p) => ({ ...p })),
            nextId: this.nextId,
        };
    }

    public restore(s: HorseStableSave | undefined): void {
        this.horses = (s?.horses ?? []).map((h) => ({ ...h }));
        this.mountId = s?.mountId ?? null;
        this.spiritId = s?.spiritId ?? null;
        this.pedigree = (s?.pedigree ?? []).map((p) => ({ ...p }));
        this.nextId = s?.nextId ?? this.horses.length + 1;
        this.deps.onChange();
    }
}
