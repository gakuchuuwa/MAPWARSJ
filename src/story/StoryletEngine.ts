/**
 * 🔴 [2026-10-22 主人令「下一步做故事块引擎：按触发条件弹出、给选项、结算结果，先接上盗马贼这一仗」]
 *
 * 故事块（storylet）引擎：每个故事块＝内容 + 触发条件 + 选项（各自结算结果）。
 * 做法见 docs/探马/故事块样板_乌拉尔图开局.md 与 docs/探马/骨架.md「项目是游戏，不是小说」。
 *
 * - 只在百岁模式里跑；每到换季检查一次（游戏 15 秒一季），满足条件的按概率弹一个。
 * - 弹窗复用玩家对话面板（PlayerHUD.showDialogue：会暂停大战略；自动模式 3 秒后自动选主选项）。
 * - 已触发过的块 id、剧情标记存在 PlayerHero（storyDone / storyFlags），随存档走。
 * - 战术模式、战斗场景、别的对话在进行时不检查。
 * - 可选「留人」判定（holdPlayer）：为 true 时自动模式不去别处找武将（PlayerQuestSystem 的 storyHold），
 *   好让一段开局故事在当地演完。每到换季、每次选完选项重算一次，平时只读缓存。
 */
import type { GameApp } from '../app/GameApp';
import type { PlayerRankId } from '../player/PlayerConfig';

/** 触发条件判断时能看到的游戏状态 */
export interface StoryContext {
    year: number;
    /** 0 春 / 1 夏 / 2 秋 / 3 冬 */
    season: number;
    rank: PlayerRankId;
    merit: number;
    /** 是否随军（入伍） */
    attached: boolean;
    /** 玩家所在的据点（40 公里内最近的一座）；不在任何据点附近为 null */
    nearCityId: string | null;
    hasFlag(flag: string): boolean;
    isDone(id: string): boolean;
}

/** 选项结算时能做的事 */
export interface StoryApi {
    app: GameApp;
    playerName: string;
    addMerit(n: number): void;
    notify(msg: string): void;
    setFlag(flag: string): void;
}

export interface StoryOption {
    label: string;
    /** 主选项：自动模式 3 秒后自动选它 */
    accent?: boolean;
    pick(api: StoryApi): void;
}

export interface Storylet {
    id: string;
    /** 对话框抬头（说话的人） */
    speaker: string;
    /** 正文；`{玩家}` 会换成玩家的称呼 */
    text: string;
    /** 只触发一次（默认 true） */
    once?: boolean;
    /** 满足条件后，每次换季检查时弹出的概率（默认 1）；可按当时状态给不同概率 */
    chance?: number | ((ctx: StoryContext) => number);
    when(ctx: StoryContext): boolean;
    options: StoryOption[];
}

/** 「在某据点一带」的判定半径：与项目「一个据点代表周围 40 公里」同口径 */
const NEAR_CITY_KM = 40;

export class StoryletEngine {
    private lastSeasonKey: number | null = null;
    private holding = false;

    constructor(
        private readonly app: GameApp,
        private readonly storylets: readonly Storylet[],
        private readonly holdPlayer?: (ctx: StoryContext) => boolean,
    ) {}

    /** 故事要玩家留在当地：自动模式这时不去别处找武将 */
    public holdsPlayer(): boolean {
        return this.holding;
    }

    /** 每帧调用；只在换季那一帧真正检查 */
    public tick(): void {
        const hero = this.app.playerHero;
        if (!hero) return;
        if ((hero.autoPlan ?? 'centenarian') !== 'centenarian') return;
        const year = this.app.timeSystem.getYear();
        const season = this.app.timeSystem.getSeason() as number;
        const key = year * 4 + season;
        if (key === this.lastSeasonKey) return;
        this.lastSeasonKey = key;
        const ctx = this.buildContext(year, season);
        this.updateHold(ctx);
        if (this.isBusy()) return;
        for (const s of this.storylets) {
            if (!this.eligible(s, ctx)) continue;
            const chance = typeof s.chance === 'function' ? s.chance(ctx) : (s.chance ?? 1);
            if (Math.random() >= chance) continue;
            this.show(s);
            return;
        }
    }

    /** 不看条件、不看概率，直接弹出某个故事块（开发期测试用：控制台 `game.story.trigger('URT-04')`） */
    public trigger(id: string): boolean {
        const s = this.storylets.find((x) => x.id === id);
        if (!s || this.isBusy()) return false;
        this.show(s);
        return true;
    }

    /** 当前满足触发条件的故事块 id（开发期查看用） */
    public eligibleIds(): string[] {
        const ctx = this.buildContext(this.app.timeSystem.getYear(), this.app.timeSystem.getSeason() as number);
        return this.storylets.filter((s) => this.eligible(s, ctx)).map((s) => s.id);
    }

    private updateHold(ctx: StoryContext): void {
        const hold = this.holdPlayer?.(ctx) === true;
        // 刚开始留人：掐掉自动模式已经出发的行程（开局第一帧它可能已经动身去找武将了）
        if (hold && !this.holding && this.app.playerHero?.autoMode) {
            this.app.playerHero.cancelChase();
            this.app.playerHero.cancelTravel();
        }
        this.holding = hold;
    }

    private eligible(s: Storylet, ctx: StoryContext): boolean {
        if ((s.once ?? true) && ctx.isDone(s.id)) return false;
        return s.when(ctx);
    }

    private isBusy(): boolean {
        return this.app.scene13War?.isActive?.() === true
            || this.app.battleScene?.isActive?.() === true
            || !!document.getElementById('player-dialogue-overlay');
    }

    private buildContext(year: number, season: number): StoryContext {
        const hero = this.app.playerHero!;
        const done = new Set(hero.storyDone);
        const flags = new Set(hero.storyFlags);
        return {
            year,
            season,
            rank: hero.getRank().id,
            merit: hero.merit,
            attached: hero.isAttached(),
            nearCityId: this.nearestCityId(),
            hasFlag: (f) => flags.has(f),
            isDone: (id) => done.has(id),
        };
    }

    private nearestCityId(): string | null {
        const p = this.app.playerHero?.getPosition();
        if (!p) return null;
        let best: string | null = null;
        let bestKm = NEAR_CITY_KM;
        const cosLat = Math.cos((p.lat * Math.PI) / 180);
        for (const c of this.app.cityManager?.getCities() ?? []) {
            const km = Math.hypot((c.latitude - p.lat) * 111.32, (c.longitude - p.lng) * 111.32 * cosLat);
            if (km <= bestKm) { bestKm = km; best = c.id; }
        }
        return best;
    }

    private show(s: Storylet): void {
        const hero = this.app.playerHero!;
        const playerName = hero.name;
        const api: StoryApi = {
            app: this.app,
            playerName,
            addMerit: (n) => hero.addMerit(n),
            notify: (msg) => hero.notifyPlayer(msg),
            setFlag: (f) => { if (!hero.storyFlags.includes(f)) hero.storyFlags.push(f); },
        };
        this.app.playerHUD?.showDialogue({
            speaker: s.speaker,
            portrait: null,
            factionName: '',
            text: s.text.split('{玩家}').join(playerName),
            // 自动模式（直播挂机）3 秒后自动选主选项；玩家自己玩时等他选
            noAutoPick: !hero.autoMode,
            options: s.options.map((o) => ({
                label: o.label,
                accent: o.accent,
                onPick: () => {
                    this.app.playerHUD?.closeDialogue();
                    if (!hero.storyDone.includes(s.id)) hero.storyDone.push(s.id);
                    o.pick(api);
                    this.updateHold(this.buildContext(this.app.timeSystem.getYear(), this.app.timeSystem.getSeason() as number));
                },
            })),
        });
    }
}
