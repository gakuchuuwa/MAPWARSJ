/**
 * 🔴 [2026-10-23 主人「同意合并：百岁模式当世界，剧本作为跑在里面的主线」]
 * 探马主线的运行器（做法见 `.claude/skills/tanma-mainline/SKILL.md`）。
 *
 * 世界照百岁模式走；主线是一串按年排的事件（`MainlineEvent`），一件做完才轮到下一件：
 *   ① 年份（和季）到了、条件满足 → 这件事开始；
 *   ② 玩家不在这件事的点（据点，代表周围 50 公里）上 → 沿路网独自走过去，
 *      路上照剧本那套念 `briefing`（PlayerQuestSystem.startSoloJourney：挂点、一路一句、到点没念完就停下听完）；
 *   ③ 到了点、路上的话念完 → 念这件事的旁白 `lines`（每句至少挂 10 秒），再办这件事（`run`：小仗、给马、入伍…）；
 *   ④ 办完记进 `PlayerHero.storyDone`（随存档走），轮到下一件。
 * 不弹选择框、不做分支（主人 2026-10-23「这个有必要做选择吗」）；结果分支只由小仗胜负决定。
 */
import type { GameApp } from '../app/GameApp';
import type { PlayerHero } from '../player/PlayerHero';
import { MAINLINE_MIN_LINE_MS } from '../player/PlayerQuestSystem';
import { speechAnnouncer } from '../audio/SpeechAnnouncer';
import { getStoryCharacter } from '../story/storyCharacters';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { assign, createActor, fromCallback, setup } from 'xstate';

/** 一句旁白；speaker＝说话人表的键（有立绘就挂在左下角武将立绘框里），纯旁白不填 */
export interface MainlineLine {
    speaker?: string;
    text: string;
}

export interface MainlineApi {
    readonly app: GameApp;
    readonly hero: PlayerHero;
    /** 依次念几句（`{玩家}` 换成玩家的名字），念完回调 */
    say(lines: Array<string | MainlineLine>, onDone?: () => void): void;
    /** 加功勋（只在上方提示条提一句，不进旁白） */
    addMerit(n: number, why: string): void;
    /** 游戏操作提示（上方提示条，不念） */
    notice(msg: string): void;
    setFlag(flag: string): void;
    hasFlag(flag: string): boolean;
}

export interface MainlineEvent {
    /** 记进 storyDone 的 id（与旧故事块同号，旧块的条件照样认得） */
    id: string;
    title: string;
    /** 大事件＝史书有载、军团对军团；小事件＝玩家亲历的小事小仗 */
    kind: 'big' | 'small';
    year: number;
    /** 0 春 1 夏 2 秋 3 冬；不填＝这一年哪一季都行 */
    season?: number;
    /** 点：这件事发生在哪个据点（据点代表周围 50 公里） */
    cityId: string;
    /** 去这个点的路上念的旁白：一路一句，段落之间空一行，第 2 段起段首写【据点名】；不填＝安静走 */
    briefing?: string;
    /** 到了点念的旁白（每句 30 字以上） */
    lines: Array<string | MainlineLine>;
    /** 另加的条件（例：功勋够了才来征兵） */
    when?(api: MainlineApi): boolean;
    /** 念完之后办的事；办完调 done()。不填＝念完即办完 */
    run?(api: MainlineApi, done: () => void): void;
    /** 这件事等着的时候要不要把玩家留在主线上（不去别处找武将）；默认 true */
    holdsPlayer?: boolean;
}

/** 在点上：离据点这么近就算到了（与「一个据点代表周围 50 公里」同口径，主人 2026-10-23 定） */
const AT_POINT_KM = 50;
/** 走过去时，离据点这么近就算走到（再近的路网不一定到得了） */
const ARRIVE_KM = 5;
/** 每句旁白最少停多久：保底 10 秒，长句 2 秒＋每字 0.25 秒（主人 2026-10-23「起码一句话要保持在10秒以上吧」） */
const readMs = (text: string): number => Math.max(MAINLINE_MIN_LINE_MS, 2000 + text.length * 250);
/** 最后一句说完，立绘再留多久 */
const LINGER_MS = 1500;

type FlowContext = { ev: MainlineEvent | null };
type FlowEvent = { type: 'TICK' } | { type: 'SAID' } | { type: 'DONE' };

/**
 * 🔴 [2026-10-23 主人「好的，确定好了，没有问题再装，XState」] 流程写成 XState 状态图，不再用手写标记拼：
 *
 *   idle ──(到年份、条件满足、人在点上)──────────────▶ waitTalk
 *   idle ──(到年份、条件满足、人不在点上；开始赶路)──▶ travel
 *   travel ──(走到点)──▶ waitTalk        travel ──(半路被打断)──▶ idle（下一拍重新出发）
 *   waitTalk ──(路上的话念完、没在打仗)──▶ narrate
 *   narrate ──(到点旁白念完 SAID)──▶ act
 *   act ──(这件事办完 DONE；记进 storyDone)──▶ idle（轮到下一件）
 *
 * 每帧送一个 TICK，条件都写在 guards 里；改流程先改这张图。
 */
export class MainlineDirector {
    private speaking = false;
    private lingerTimer = 0;
    /** 路网到不了这一站：当已到（免得卡死） */
    private journeyFailed = false;
    private readonly actor;

    constructor(
        private readonly app: GameApp,
        private readonly events: readonly MainlineEvent[],
    ) {
        this.actor = createActor(this.buildFlow());
        this.actor.start();
    }

    /** 主线要玩家（不让自动模式去别处找武将、不赶战场） */
    public holdsPlayer(): boolean {
        const hero = this.app.playerHero;
        if (!hero || (hero.autoPlan ?? 'melee') !== 'centenarian') return false;
        if (this.actor.getSnapshot().value !== 'idle') return true;
        const ev = this.nextEvent(hero);
        return !!ev && ev.holdsPlayer !== false && !hero.isAttached() && hero.factionId === null;
    }

    /** 每帧调用 */
    public tick(): void {
        const hero = this.app.playerHero;
        if (!hero || (hero.autoPlan ?? 'melee') !== 'centenarian') return;
        // 🔴 [2026-10-23 主人「主角军团会自己去打别的据点，既然是漏洞为什么不修复呢」] 主角军团不按自己的路走：
        //    行为树已不给它派仗（AIController.tickArmy），这里再每帧按住它入伍前就在走的那趟路，免得走到地方自己开打。
        const hostId = hero.getHostLegionId();
        const host = hostId ? this.app.legionManager?.getLegionById(hostId) : null;
        if (host && !host.isDestroyed && !host.isScriptArmy) host.setMarchHold(true);
        this.actor.send({ type: 'TICK' });
    }

    /** 当前走到哪一步（排查用：控制台 game.mainline.state()） */
    public state(): { step: string; event: string | null } {
        const snap = this.actor.getSnapshot();
        return { step: String(snap.value), event: snap.context.ev?.id ?? null };
    }

    // ── 状态图 ─────────────────────────────────────────
    private buildFlow() {
        const d = this;
        const heroOf = () => d.app.playerHero!;
        return setup({
            types: { context: {} as FlowContext, events: {} as FlowEvent },
            guards: {
                readyAtPoint: () => { const ev = d.readyEvent(); return !!ev && d.kmTo(heroOf(), ev.cityId) <= AT_POINT_KM; },
                ready: () => d.readyEvent() !== null,
                arrived: ({ context }) => !!context.ev && d.arrived(context.ev),
                travelLost: ({ context }) => !heroOf().isTraveling() && !(context.ev && d.arrived(context.ev)),
                talkDone: () => !d.app.playerQuests?.isJourneyBriefingBusy() && !d.isBusy(),
            },
            actions: {
                pick: assign({ ev: () => d.readyEvent() }),
                clear: assign({ ev: () => null }),
                startJourney: ({ context }) => {
                    const ev = context.ev;
                    const city = ev ? d.app.cityManager.getCity(ev.cityId) : undefined;
                    heroOf().cancelChase();
                    d.journeyFailed = !ev || !city
                        || !d.app.playerQuests?.startSoloJourney(ev.title, { lat: city.latitude, lng: city.longitude }, ev.briefing ?? '');
                },
                stopTravel: () => { heroOf().cancelTravel(); d.journeyFailed = false; },
                endJourney: () => { d.app.playerQuests?.endSoloJourney(); },
                markDone: ({ context }) => {
                    const hero = heroOf();
                    if (context.ev && !hero.storyDone.includes(context.ev.id)) hero.storyDone.push(context.ev.id);
                },
            },
            actors: {
                narrate: fromCallback<FlowEvent, { ev: MainlineEvent }>(({ sendBack, input }) => {
                    d.say(heroOf(), input.ev.lines, () => sendBack({ type: 'SAID' }));
                }),
                act: fromCallback<FlowEvent, { ev: MainlineEvent }>(({ sendBack, input }) => {
                    const done = () => sendBack({ type: 'DONE' });
                    if (input.ev.run) input.ev.run(d.makeApi(heroOf()), done);
                    else done();
                }),
            },
        }).createMachine({
            id: 'tanmaMainline',
            initial: 'idle',
            context: { ev: null },
            states: {
                idle: {
                    on: {
                        TICK: [
                            { guard: 'readyAtPoint', target: 'waitTalk', actions: 'pick' },
                            { guard: 'ready', target: 'travel', actions: ['pick', 'startJourney'] },
                        ],
                    },
                },
                travel: {
                    on: {
                        TICK: [
                            { guard: 'arrived', target: 'waitTalk', actions: 'stopTravel' },
                            { guard: 'travelLost', target: 'idle', actions: ['endJourney', 'clear'] },
                        ],
                    },
                },
                // 路上的话没念完就在点上听完（主人 2026-10-23「到了点话没念完，就在点上停下听完再办事」）
                waitTalk: {
                    on: { TICK: { guard: 'talkDone', target: 'narrate', actions: 'endJourney' } },
                },
                narrate: {
                    invoke: { src: 'narrate', input: ({ context }) => ({ ev: context.ev! }) },
                    on: { SAID: 'act' },
                },
                act: {
                    invoke: { src: 'act', input: ({ context }) => ({ ev: context.ev! }) },
                    on: { DONE: { target: 'idle', actions: ['markDone', 'clear'] } },
                },
            },
        });
    }

    // ── 内部 ───────────────────────────────────────────
    private nextEvent(hero: PlayerHero): MainlineEvent | null {
        return this.events.find((e) => !hero.storyDone.includes(e.id)) ?? null;
    }

    /** 下一件事现在能开始吗：年份到了、条件满足、手上没别的事 */
    private readyEvent(): MainlineEvent | null {
        const hero = this.app.playerHero;
        if (!hero || this.isBusy()) return null;
        const ev = this.nextEvent(hero);
        if (!ev || !this.reached(ev)) return null;
        if (ev.when && !ev.when(this.makeApi(hero))) return null;
        return ev;
    }

    private arrived(ev: MainlineEvent): boolean {
        const hero = this.app.playerHero!;
        const km = this.kmTo(hero, ev.cityId);
        return this.journeyFailed || km <= ARRIVE_KM || (!hero.isTraveling() && km <= AT_POINT_KM);
    }

    private reached(ev: MainlineEvent): boolean {
        const year = this.app.timeSystem.getYear();
        if (year < ev.year) return false;
        if (year > ev.year || ev.season === undefined) return true;
        return (this.app.timeSystem.getSeason() as number) >= ev.season;
    }

    private kmTo(hero: PlayerHero, cityId: string): number {
        const c = this.app.cityManager.getCity(cityId);
        if (!c) return Infinity;
        return getEuclideanDistance(hero.getPosition(), { lat: c.latitude, lng: c.longitude }) * 111;
    }

    private isBusy(): boolean {
        return this.speaking
            || this.app.scene13War?.isActive?.() === true
            || this.app.battleScene?.isActive?.() === true
            || !!document.getElementById('player-dialogue-overlay');
    }

    private makeApi(hero: PlayerHero): MainlineApi {
        return {
            app: this.app,
            hero,
            say: (lines, onDone) => this.say(hero, lines, onDone),
            addMerit: (n, why) => {
                hero.addMerit(n);
                this.app.playerHUD?.notify(`${why}，功勋 +${n}`);
            },
            notice: (msg) => this.app.playerHUD?.notify(msg),
            setFlag: (f) => { if (!hero.storyFlags.includes(f)) hero.storyFlags.push(f); },
            hasFlag: (f) => hero.storyFlags.includes(f),
        };
    }

    /** 一句一句念：每句等语音念完、也等够最少停留时间，再念下一句（同一条语音＋字幕路，和行军旁白一样） */
    private say(hero: PlayerHero, lines: Array<string | MainlineLine>, onDone?: () => void): void {
        const queue = lines.map((l) => (typeof l === 'string' ? { text: l } : l))
            .map((l) => ({ ...l, text: l.text.split('{玩家}').join(hero.name).trim() }))
            .filter((l) => l.text);
        const ui = (this.app as unknown as { combatUI?: { showStoryPortrait?(p: string, n: string, r: string): void; hideStoryPortrait?(): void } }).combatUI;
        this.speaking = true;
        window.clearTimeout(this.lingerTimer);
        const next = (): void => {
            const line = queue.shift();
            if (!line) {
                this.speaking = false;
                this.lingerTimer = window.setTimeout(() => ui?.hideStoryPortrait?.(), LINGER_MS);
                onDone?.();
                return;
            }
            const who = line.speaker ? getStoryCharacter(line.speaker) : undefined;
            if (who?.portrait) ui?.showStoryPortrait?.(who.portrait, who.name, who.role);
            const minMs = readMs(line.text);
            let voiceDone = false;
            let readDone = false;
            let moved = false;
            const go = () => { if (!moved && voiceDone && readDone) { moved = true; next(); } };
            window.setTimeout(() => { readDone = true; go(); }, minMs);
            // 语音引擎卡住的兜底
            window.setTimeout(() => { voiceDone = true; go(); }, minMs * 3);
            speechAnnouncer.announceBriefing(line.text, () => { voiceDone = true; go(); }, undefined, minMs);
        };
        next();
    }
}
