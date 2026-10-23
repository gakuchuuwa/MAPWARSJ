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
 * - 跑腿（StoryErrand，2026-10-22 补 URT-02/03 时加）：故事带着玩家去一个或几个地方，到了可以再弹抉择、
 *   原地停一会儿，全部走完再结算；可限「本季之内办完」（太阳落山前）。跑腿期间留人、不弹别的故事块。
 *   自动、手动模式都由故事领路（战略地图上玩家点不了任意坐标）。跑腿进度不进存档（读档后这一趟作废）。
 */
import type { GameApp } from '../app/GameApp';
import type { PlayerRankId } from '../player/PlayerConfig';
import type { PlayerHero } from '../player/PlayerHero';
import { seasonIndex } from '../player/HorseStable';
import { HORSE_MEMORIES, memoryLabel, startMemoryBattle } from './horseMemories';
import { getHorseLore } from './horseLore';
import { storyNarrator } from './storyNarrator';

/** 旁白念之前去掉开头的表情符号（🐎、📖 这类，念出来是乱码） */
function stripLeadingSymbols(s: string): string {
    return s.replace(/^[^\p{L}\p{N}]+/u, '');
}

/** 通灵失步后，等战术模式收场再弹「再进去一次」（毫秒） */
const MEMORY_ASK_DELAY_MS = 2500;

/** 触发条件判断时能看到的游戏状态 */
export interface StoryContext {
    year: number;
    /** 0 春 / 1 夏 / 2 秋 / 3 冬 */
    season: number;
    rank: PlayerRankId;
    merit: number;
    /** 是否随军（入伍） */
    attached: boolean;
    /** 投效的势力（没投效为 null） */
    factionId: string | null;
    /** 自动模式开着没有 */
    autoMode: boolean;
    /** 马厩里有几匹马 */
    horseCount: number;
    /** 玩家所在的据点（40 公里内最近的一座）；不在任何据点附近为 null */
    nearCityId: string | null;
    /** 那座据点的名字（不在据点附近为 null） */
    nearCityName: string | null;
    /** 玩家所在坐标 */
    lat: number;
    lng: number;
    hasFlag(flag: string): boolean;
    isDone(id: string): boolean;
}

/** 选项结算时能做的事 */
export interface StoryApi {
    app: GameApp;
    /** 玩家本人（马厩 hero.horses 等） */
    hero: PlayerHero;
    playerName: string;
    addMerit(n: number): void;
    notify(msg: string): void;
    setFlag(flag: string): void;
    /** 故事中途再弹一次抉择（例：跑腿到了地方问怎么办） */
    ask(speaker: string, text: string, options: StoryOption[]): void;
    /** 让玩家去跑一趟（见 StoryErrand） */
    startErrand(errand: StoryErrand): void;
    /** 摸马读记忆：进这匹马记得的那一仗（通灵战役） */
    readHorseMemory(horseId: string): void;
}

/** 跑腿的一站 */
export interface ErrandStop {
    lat: number;
    lng: number;
    /** 地名（玩家面板「奔赴【…】」） */
    label: string;
    /**
     * 到了先办的事（弹抉择等），办完调 next() 走下一站；next(秒) ＝ 先在这里停这么多游戏秒再走。
     * 不填＝到了直接走下一站。
     */
    onArrive?(api: StoryApi, next: (stayGameSeconds?: number) => void): void;
}

/** 跑腿：依次走完各站再结算 */
export interface StoryErrand {
    stops: ErrandStop[];
    /** 行军快慢系数（例：赶着马群走不快 0.5）；走完恢复 */
    pace?: number;
    /** 要在第几个季末之前办完（1＝本季之内，即「太阳落山前」）；不填＝不限时 */
    deadlineSeasons?: number;
    /** 只在自动模式里走（故事领路）：半路关了自动就停下，交还给玩家 */
    onlyInAuto?: boolean;
    onDone(api: StoryApi, onTime: boolean): void;
}

export interface StoryOption {
    label: string;
    /** 主选项：自动模式 3 秒后自动选它 */
    accent?: boolean;
    /** 选它不算「这个故事块演过了」：以后条件满足还会再弹（例：看牙口选「改天再学」） */
    keepOpen?: boolean;
    pick(api: StoryApi): void;
}

export interface Storylet {
    id: string;
    /** 对话框抬头（说话的人） */
    speaker: string;
    /** 正文；`{玩家}` 会换成玩家的称呼；可按当时状态写（例：带上所在据点名） */
    text: string | ((ctx: StoryContext) => string);
    /** 只触发一次（默认 true） */
    once?: boolean;
    /** 满足条件后，每次换季检查时弹出的概率（默认 1）；可按当时状态给不同概率 */
    chance?: number | ((ctx: StoryContext) => number);
    when(ctx: StoryContext): boolean;
    options: StoryOption[];
}

/** 「在某据点一带」的判定半径：与项目「一个据点代表周围 40 公里」同口径 */
const NEAR_CITY_KM = 40;
/** 不换季时，隔多少游戏秒再查一次故事块（一季 15 游戏秒） */
const RECHECK_GAME_SEC = 3;
/** 跑腿到站判定（公里） */
const ERRAND_ARRIVE_KM = 3;
/**
 * 🔴 [2026-10-23 主人「玩家都到了，第一句话还没结束呢，能不能让话和路差不多？」]
 * 跑腿赶路时旁白还在念：按「剩下的路 ÷ 剩下的话」把脚步放慢，让人和话差不多同时到；
 * 只放慢不加快（话短就照常走完，后半段不说话）；最慢放到原速的 PACE_MIN。到站时话还没念完，原地等念完再办事。
 */
const PACE_MIN = 0.25;
/** 量一次实际走速的间隔（真实毫秒） */
const PACE_SAMPLE_MS = 500;

interface ActiveErrand {
    def: StoryErrand;
    api: StoryApi;
    stop: number;
    /** travel 赶路中；busy 到站办事（等 next）；stay 原地停留 */
    phase: 'travel' | 'busy' | 'stay';
    stayUntil: number;
    deadlineKey: number | null;
    /** 按旁白放慢脚步：上次量走速的位置、时刻与当时的放慢系数 */
    probe: { lat: number; lng: number; t: number; mult: number } | null;
    talkMult: number;
}

export class StoryletEngine {
    private lastSeasonKey: number | null = null;
    private holding = false;
    private errand: ActiveErrand | null = null;
    /** 领路的提示只飘一次 */
    private leadNoticeShown = false;
    /** 上次查故事块时的游戏秒 */
    private lastCheckSec = -Infinity;

    constructor(
        private readonly app: GameApp,
        private readonly storylets: readonly Storylet[],
        private readonly holdPlayer?: (ctx: StoryContext) => boolean,
        /** 故事要把玩家领到某处（例：开局醒来先走到岩壁）：返回要去的地方，没有就 null */
        private readonly leadPlayer?: (ctx: StoryContext) => { stop: ErrandStop; notice?: string } | null,
    ) {}

    /** 故事要玩家留在当地：自动模式这时不去别处找武将 */
    public holdsPlayer(): boolean {
        return this.holding || this.errand !== null;
    }

    /** 正在跑腿（开发期查看用） */
    public errandInfo(): { stop: string; phase: string } | null {
        const e = this.errand;
        return e ? { stop: e.def.stops[e.stop]?.label ?? '', phase: e.phase } : null;
    }

    /** 每帧调用；跑腿每帧推进，故事块只在换季那一帧检查 */
    public tick(): void {
        const hero = this.app.playerHero;
        if (!hero) return;
        if ((hero.autoPlan ?? 'melee') !== 'centenarian') return;
        this.tickErrand();
        const year = this.app.timeSystem.getYear();
        const season = this.app.timeSystem.getSeason() as number;
        const key = year * 4 + season;
        // 🔴 [2026-10-22 主人「经常卡很久才动」] 原来只在换季那一帧查，上一件事办完要干等到下一季（最多 15 游戏秒）。
        //    现在除了换季，每隔 RECHECK_GAME_SEC 游戏秒也查一次；带概率的故事块只在换季时掷，免得每几秒掷一次
        const nowSec = this.app.timeSystem.getElapsedGameSeconds();
        const seasonChanged = key !== this.lastSeasonKey;
        if (!seasonChanged && nowSec - this.lastCheckSec < RECHECK_GAME_SEC) return;
        this.lastSeasonKey = key;
        this.lastCheckSec = nowSec;
        const ctx = this.buildContext(year, season);
        this.updateHold(ctx);
        if (this.isBusy()) return;
        // 🔴 [2026-10-22 主人「怎么还是上来就接任务呀，我把自动都关了」] 领路只在自动模式：
        //    自动关着时故事不替玩家走路，玩家自己走到那一带才弹故事块（醒来的提示照样飘一次）。
        const lead = this.leadPlayer?.(ctx);
        if (lead) {
            const api = this.makeApi();
            // 只飘提示、不弹框：领路这一段不暂停游戏
            if (lead.notice && !this.leadNoticeShown) {
                this.leadNoticeShown = true;
                // 🔴 [2026-10-22 主人「没有语音介绍」] 醒来那句：故事旁白念出来，底部字幕同步显示（不弹框、不暂停）
                api.notify(lead.notice.split('{玩家}').join(hero.name));
            }
            if (hero.autoMode) {
                this.startErrand(api, { stops: [lead.stop], onlyInAuto: true, onDone: () => {} });
                return;
            }
        }
        for (const s of this.storylets) {
            if (!this.eligible(s, ctx)) continue;
            const chance = typeof s.chance === 'function' ? s.chance(ctx) : (s.chance ?? 1);
            if (!seasonChanged && chance < 1) continue;
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
        return this.errand !== null
            // 旁白还在念（上一件事的交代没念完）就不弹下一件，节奏一件一件来
            || storyNarrator.isBusy()
            || this.app.scene13War?.isActive?.() === true
            || this.app.battleScene?.isActive?.() === true
            || !!document.getElementById('player-dialogue-overlay');
    }

    private buildContext(year: number, season: number): StoryContext {
        const hero = this.app.playerHero!;
        const done = new Set(hero.storyDone);
        const flags = new Set(hero.storyFlags);
        const nearCityId = this.nearestCityId();
        const pos = hero.getPosition();
        return {
            year,
            season,
            rank: hero.getRank().id,
            merit: hero.merit,
            attached: hero.isAttached(),
            factionId: hero.factionId,
            autoMode: hero.autoMode,
            horseCount: hero.horses.list().length,
            nearCityId,
            nearCityName: nearCityId ? (this.app.cityManager?.getCity(nearCityId)?.name ?? null) : null,
            lat: pos.lat,
            lng: pos.lng,
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
        const text = typeof s.text === 'function'
            ? s.text(this.buildContext(this.app.timeSystem.getYear(), this.app.timeSystem.getSeason() as number))
            : s.text;
        this.showOptions(this.makeApi(), s.speaker, text, s.options, () => {
            if (!hero.storyDone.includes(s.id)) hero.storyDone.push(s.id);
        });
    }

    // ── 通灵 ─────────────────────────────────────────────
    /**
     * 摸马读记忆：以这匹马当年骑手的身份把那一仗再打一遍（horseMemories.ts）。
     * 同步 → 学到马经；完全同步 → 再把那一仗的一种兵放进兵模收藏；失步 → 可以再进去一次。
     * 马厩里点「通灵」、故事块里摸到马都走这里。返回 false＝这匹马没有记忆或现在进不去。
     */
    public readHorseMemory(horseId: string): boolean {
        const hero = this.app.playerHero;
        const horse = hero?.horses.list().find((h) => h.id === horseId);
        const mem = horse?.memoryId ? HORSE_MEMORIES[horse.memoryId] : undefined;
        if (!hero || !horse || !mem || this.isBusy()) return false;
        const api = this.makeApi();
        let attempts = 0;
        const enter = (): boolean => {
            attempts += 1;
            return startMemoryBattle(this.app, mem, (r) => {
                if (r === 'desync') {
                    // 战术模式收场后再问，免得对话框压在战场上
                    window.setTimeout(() => api.ask('通灵', `记忆断开了。${memoryLabel(mem)}不是这样打的——${horse.name}记得的是${mem.spec.attackerName}赢了。`, [
                        // 自动模式（直播挂机）只自动重进一次，免得一直输一直进
                        { label: '再进去一次', accent: attempts < 2, pick: () => enterWhenFree() },
                        { label: '先松开手', accent: attempts >= 2, pick: (a) => a.notify(`👁 松开了手。想再看，到马厩里对${horse.name}点「通灵」`) },
                    ]), MEMORY_ASK_DELAY_MS);
                    return;
                }
                const first = !horse.memoryBest;
                hero.horses.recordMemory(horse, r);
                api.setFlag(mem.loreFlag);
                const parts = [`👁 通灵·${memoryLabel(mem)}：${r === 'full' ? '完全同步' : '同步'}。`];
                const lore = getHorseLore(mem.loreFlag);
                if (first && lore) parts.push(`📖 马经：${lore.text}。`);
                if (r === 'full') {
                    const learned = hero.learnUnitFromMemory(mem.unit.key, mem.unit.factionId);
                    if (learned) parts.push(`🛡️ 兵模收藏多了一种：${learned}。`);
                } else {
                    parts.push(`${hero.name}整场落过马——不落马打赢才算完全同步，还能学到一种兵模。`);
                }
                api.notify(parts.join(''));
            });
        };
        // 上一场战术模式还在收场时进不去：每半秒再试，最多等 20 秒
        const enterWhenFree = (tries = 0): void => {
            if (enter()) return;
            attempts -= 1;
            if (tries < 40) window.setTimeout(() => enterWhenFree(tries + 1), 500);
        };
        return enter();
    }

    private refreshHold(): void {
        this.updateHold(this.buildContext(this.app.timeSystem.getYear(), this.app.timeSystem.getSeason() as number));
    }

    private makeApi(): StoryApi {
        const hero = this.app.playerHero!;
        const api: StoryApi = {
            app: this.app,
            hero,
            playerName: hero.name,
            addMerit: (n) => hero.addMerit(n),
            // 🔴 [2026-10-22 主人同意「以旁白为主」] 故事里交代结果，一律旁白念出来 + 底部字幕，不再飘提示框
            notify: (msg) => storyNarrator.say(null, stripLeadingSymbols(msg)),
            setFlag: (f) => {
                if (!hero.storyFlags.includes(f)) hero.storyFlags.push(f);
                // 结果标记可能在选项之后才到（例：一仗打完才记胜负），留人判定跟着重算
                this.refreshHold();
            },
            ask: (speaker, text, options) => this.showOptions(api, speaker, text, options),
            startErrand: (def) => this.startErrand(api, def),
            readHorseMemory: (id) => { this.readHorseMemory(id); },
        };
        return api;
    }

    private showOptions(api: StoryApi, speaker: string, text: string, options: StoryOption[], beforePick?: () => void): void {
        const hero = this.app.playerHero!;
        const line = text.split('{玩家}').join(hero.name);
        // 🔴 [2026-10-23 主人「这个有必要做选择吗？能不能简单点，做的还不如剧本模式呢」「怎么不做成统一的模式呀」]
        //    故事一律跟剧本模式一个样：旁白念出来 + 底部字幕（说话人立绘显示在左下角），不弹选择框、不等玩家点；
        //    念完照主选项（accent，没有就第一个）往下走。旧的「不理它 / 推说不去」这类分支都不再走到。
        const chosen = options.find((o) => o.accent) ?? options[0];
        if (!chosen) return;
        if (!chosen.keepOpen) beforePick?.();   // 先记「演过了」，免得念的工夫里又被弹一次
        storyNarrator.say(speaker, line, {
            onDone: () => {
                chosen.pick(api);
                this.refreshHold();
            },
        });
    }

    // ── 跑腿 ─────────────────────────────────────────────
    private nowSeasonKey(): number {
        return seasonIndex(this.app.timeSystem.getYear(), this.app.timeSystem.getSeason() as number);
    }

    private startErrand(api: StoryApi, def: StoryErrand): void {
        const hero = this.app.playerHero!;
        hero.cancelChase();
        hero.cancelTravel();
        if (def.pace !== undefined) hero.setStoryPace(def.pace);
        this.errand = {
            def,
            api,
            stop: 0,
            phase: 'travel',
            stayUntil: 0,
            deadlineKey: def.deadlineSeasons ? this.nowSeasonKey() + def.deadlineSeasons : null,
            probe: null,
            talkMult: 1,
        };
    }

    private tickErrand(): void {
        const e = this.errand;
        const hero = this.app.playerHero;
        if (!e || !hero) return;
        if (e.def.onlyInAuto && !hero.autoMode) {
            this.errand = null;
            hero.cancelTravel();
            hero.setStoryPace(1);
            this.refreshHold();
            return;
        }
        if (e.phase === 'busy') return;
        if (e.phase === 'stay') {
            if (this.app.timeSystem.getElapsedGameSeconds() >= e.stayUntil) this.nextStop(e);
            return;
        }
        const stop = e.def.stops[e.stop];
        const p = hero.getPosition();
        const cosLat = Math.cos((p.lat * Math.PI) / 180);
        const km = Math.hypot((stop.lat - p.lat) * 111.32, (stop.lng - p.lng) * 111.32 * cosLat);
        if (km <= ERRAND_ARRIVE_KM) {
            hero.cancelTravel();
            // 到了话还没念完：原地等这几句念完再办事，免得新的话叠在旧话上
            if (storyNarrator.isBusy()) return;
            this.setTalkMult(e, hero, 1);
            e.phase = 'busy';
            const next = (stay?: number) => {
                if (this.errand !== e) return;
                if (stay && stay > 0) {
                    e.phase = 'stay';
                    e.stayUntil = this.app.timeSystem.getElapsedGameSeconds() + stay;
                } else {
                    this.nextStop(e);
                }
            };
            if (stop.onArrive) stop.onArrive(e.api, next);
            else next();
            return;
        }
        // 故事领路：没在走就沿路网往这一站去；到不了（无路）就当已到，免得卡死
        if (!hero.isTraveling() && !hero.travelToPoint({ lat: stop.lat, lng: stop.lng }, stop.label)) {
            hero.army.setPosition(stop.lat, stop.lng);
        }
        this.matchPaceToTalk(e, hero, p, km);
    }

    /** 旁白还在念时，按剩下的路和剩下的话放慢脚步（见 PACE_MIN 头注） */
    private matchPaceToTalk(e: ActiveErrand, hero: PlayerHero, p: { lat: number; lng: number }, kmLeft: number): void {
        const talkMs = storyNarrator.remainingMs();
        const now = performance.now();
        if (talkMs <= 0 || !hero.isTraveling()) {
            e.probe = null;
            this.setTalkMult(e, hero, 1);
            return;
        }
        const pr = e.probe;
        if (!pr) { e.probe = { lat: p.lat, lng: p.lng, t: now, mult: e.talkMult }; return; }
        if (now - pr.t < PACE_SAMPLE_MS) return;
        const cosLat = Math.cos((p.lat * Math.PI) / 180);
        const moved = Math.hypot((p.lat - pr.lat) * 111.32, (p.lng - pr.lng) * 111.32 * cosLat);
        const dtSec = (now - pr.t) / 1000;
        e.probe = { lat: p.lat, lng: p.lng, t: now, mult: e.talkMult };
        if (moved < 0.01) return;   // 暂停或卡住，这一回不算
        // 不放慢时每真实秒能走多少公里
        const freeKmPerSec = moved / dtSec / Math.max(0.05, pr.mult);
        const wantKmPerSec = kmLeft / (talkMs / 1000);
        const target = Math.max(PACE_MIN, Math.min(1, wantKmPerSec / freeKmPerSec));
        this.setTalkMult(e, hero, e.talkMult * 0.5 + target * 0.5);
    }

    private setTalkMult(e: ActiveErrand, hero: PlayerHero, mult: number): void {
        if (Math.abs(mult - e.talkMult) < 0.02 && mult !== 1) return;
        e.talkMult = mult;
        hero.setStoryPace((e.def.pace ?? 1) * mult);
    }

    private nextStop(e: ActiveErrand): void {
        e.stop += 1;
        e.phase = 'travel';
        e.probe = null;
        if (e.stop < e.def.stops.length) return;
        this.errand = null;
        this.app.playerHero?.setStoryPace(1);
        const onTime = e.deadlineKey === null || this.nowSeasonKey() < e.deadlineKey;
        e.def.onDone(e.api, onTime);
        this.refreshHold();
        // 跑完一趟不等下一季：下一帧就重新看有没有该弹的故事块（例：领路走到岩壁 → 马上梦醒）
        this.lastSeasonKey = null;
    }
}
