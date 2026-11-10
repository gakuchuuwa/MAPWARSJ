/**
 * 即时战斗（2026-11-05 主人令；2026-11-10 主人令加入全部 531 场名将经典战役）
 *
 * 「把项目中的战术模式单独运行，左右对战，可以选择双方势力、武将，可以选择攻城战还是野战，
 *   攻城战可以选择据点，野战可以选择地域。选择要带搜索功能，不选就是随机。总之和战术模式一模一样。」
 * 「完全添加到 http://localhost:5173/?quickbattle=1，即时战术模式中。
 *   标注好时间，地点，背景介绍。武将立绘。同时包含随机战斗。」
 *
 * 做法：不另起一套战术层，而是**在游戏本体里直接开一场仗**——
 *   起双方军团（与经典战同一口径：武将本据点起兵、精锐、文化编制）→ 摆到战场 → 走引擎原有的
 *   野战接战 / triggerSiege 攻城入口 → GameAppCombatHooks 判定进战术模式。
 *   所以战术画面、技能、面板、结算全是游戏原样，一行战术代码不碰。
 *
 * 入口：`/?quickbattle=1`（或 `/quick-battle.html`，它只是跳转到这里）。
 * 本模式下：AI 寻敌、募兵、玩家乱入者全部停掉，地图上只有这一仗的两支军团。
 */
import type { GameApp } from '../app/GameApp';
import type { Army } from '../legion/Army';
import type { City } from '../types/core';
import { FACTIONS } from '../data/factions';
import {
    getFactionGeneralsResolved,
    getGeneralRecordByGeneralId,
    type FactionGeneral,
} from '../data/FactionGenerals';
import { getAllBattlefieldCharacters } from '../data/BattlefieldCharacters';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getGeneralProfile } from '../data/general-skills/profiles';
import {
    getCityEliteLegionName,
    getGeneralEliteConfig,
    getFactionEliteConfig,
    getEliteTierDisplayName,
} from '../data/ExpeditionLegions';
import { GENERAL_FIRST_BATTLES, type GeneralFirstBattle } from '../data/GeneralFirstBattles';
import {
    FIRST_BATTLE_BACKGROUNDS,
    FIRST_BATTLE_KIND_LABEL,
    firstBattleKindOf,
    type FirstBattleKind,
} from '../data/GeneralFirstBattleBackgrounds';
import { clampFirstBattleTroops } from '../player/PlayerQuestSystem';
import { applyLegionCultureComposition } from '../types/CultureFormations';
import { CULTURE_NAMES, getCityRegion, type RegionType } from '../systems/RegionSystem';
import { TerrainSpeedSystem } from '../core/TerrainSpeedSystem';
import { GameConfig } from '../config/GameConfig';
import { releaseDeploy } from '../legion/DeployGate';
import {
    setGameModeProvider,
    setCentenarianYearProvider,
    setScriptYearProvider,
} from '../data/generalOnStage';
import { setWonderGateYearProvider } from '../data/wonderFoundedYears';
import {
    resolveGeneralPortraitPath,
} from '../config/portrait_defaults';

// ───────────────────────────── 数据 ─────────────────────────────

interface GeneralItem {
    generalId: string;
    generalName: string;
    factionId: string;
    cityId?: string;
    portrait: string;
    eliteLabel: string;
}

type BattleKind = 'siege' | 'field';
type PanelMode = 'classic' | 'random';
type ClassicKindFilter = 'all' | FirstBattleKind;

const CITY_TYPE_LABEL: Record<string, string> = {
    big_city: '大城', medium_city: '中城', small_city: '小城', pass: '险要', stockade: '城寨',
};

function rand<T>(arr: readonly T[]): T | undefined {
    return arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;
}

function randInt(lo: number, hi: number): number {
    return Math.round(lo + Math.random() * (hi - lo));
}

function formatYear(year: number): string {
    return year < 0 ? `公元前 ${Math.abs(year)} 年` : `公元 ${year} 年`;
}

function formatCoord(lat: number, lng: number): string {
    const ns = lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`;
    const ew = lng >= 0 ? `${lng.toFixed(2)}°E` : `${Math.abs(lng).toFixed(2)}°W`;
    return `${ns}, ${ew}`;
}

function resolveEliteLabel(generalId: string, factionId: string): string {
    const cfg = getGeneralEliteConfig(generalId) ?? getFactionEliteConfig(factionId);
    if (!cfg) return '常备精锐';
    const tierName = getEliteTierDisplayName(cfg.tier);
    return tierName ? `${cfg.name}（${tierName}）` : cfg.name;
}

/** 全部可上战术模式的武将（含战场人物）：保证所有经典战主帅与自由对战武将均在索引内 */
function collectGenerals(): GeneralItem[] {
    const seen = new Set<string>();
    const out: GeneralItem[] = [];
    for (const f of FACTIONS) {
        if (f.id === 'panshu') continue;
        for (const g of getFactionGeneralsResolved(f.id) as FactionGeneral[]) {
            if (!g.generalId || seen.has(g.generalId)) continue;
            if (!getGeneralProfile(g.generalId)) continue;
            seen.add(g.generalId);
            const fid = (g as { factionId?: string }).factionId ?? f.id;
            out.push({
                generalId: g.generalId,
                generalName: g.generalName,
                factionId: fid,
                cityId: g.cityId,
                portrait: resolveGeneralPortraitPath(g.portrait, {
                    factionId: fid,
                    generalId: g.generalId,
                    cityId: g.cityId,
                }),
                eliteLabel: resolveEliteLabel(g.generalId, fid),
            });
        }
    }
    for (const bf of getAllBattlefieldCharacters()) {
        if (!bf.generalId || seen.has(bf.generalId)) continue;
        const rec = getGeneralRecordByGeneralId(bf.generalId);
        const fid = rec?.factionId ?? bf.factionId;
        const cid = rec?.cityId;
        seen.add(bf.generalId);
        out.push({
            generalId: bf.generalId,
            generalName: rec?.generalName ?? bf.generalName,
            factionId: fid,
            cityId: cid,
            portrait: resolveGeneralPortraitPath(rec?.portrait ?? bf.portrait, {
                factionId: fid,
                generalId: bf.generalId,
                cityId: cid,
            }),
            eliteLabel: resolveEliteLabel(bf.generalId, fid),
        });
    }
    return out;
}

// ───────────────────────────── 带搜索的下拉框 ─────────────────────────────

interface Opt { value: string; label: string; sub?: string; search: string }

class SearchSelect {
    readonly root: HTMLDivElement;
    private readonly input: HTMLInputElement;
    private readonly list: HTMLDivElement;
    private options: Opt[] = [];
    private value: string | null = null;
    private readonly maxDisplay: number;
    onChange: ((v: string | null) => void) | null = null;

    constructor(label: string, placeholder = '不选＝随机（可输入搜索）', maxDisplay = 120) {
        this.maxDisplay = maxDisplay;
        this.root = document.createElement('div');
        this.root.className = 'qb-field';
        const cap = document.createElement('div');
        cap.className = 'qb-cap';
        cap.textContent = label;
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.placeholder = placeholder;
        this.list = document.createElement('div');
        this.list.className = 'qb-list';
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'qb-clear';
        clear.textContent = '×';
        clear.title = '清空＝随机';
        clear.addEventListener('click', () => { this.set(null); this.input.focus(); });
        const row = document.createElement('div');
        row.className = 'qb-row';
        row.append(this.input, clear);
        this.root.append(cap, row, this.list);

        this.input.addEventListener('focus', () => { this.input.select(); this.render(); });
        this.input.addEventListener('input', () => {
            if (this.input.value.trim() === '' && this.value !== null) this.commit(null);
            this.render();
        });
        this.input.addEventListener('blur', () => setTimeout(() => {
            this.list.style.display = 'none';
            this.input.value = this.labelOf(this.value);   // 敲了一半没选 → 还原成当前选中项
        }, 150));
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const first = this.list.querySelector<HTMLDivElement>('.qb-opt');
                first?.dispatchEvent(new MouseEvent('mousedown'));
            } else if (e.key === 'Escape') {
                this.input.blur();
            }
        });
    }

    setOptions(opts: Opt[], keepValue = true): void {
        this.options = opts;
        if (!keepValue || (this.value !== null && !opts.some((o) => o.value === this.value))) {
            this.set(null, true);
        } else {
            this.input.value = this.labelOf(this.value);
        }
    }

    get(): string | null { return this.value; }

    set(v: string | null, silent = false): void {
        this.commit(v, silent);
        this.input.value = this.labelOf(v);
    }

    private commit(v: string | null, silent = false): void {
        if (v === this.value) return;
        this.value = v;
        if (!silent) this.onChange?.(v);
    }

    private labelOf(v: string | null): string {
        if (v === null) return '';
        return this.options.find((o) => o.value === v)?.label ?? '';
    }

    private render(): void {
        const q = this.input.value.trim().toLowerCase();
        const shownLabel = this.labelOf(this.value).toLowerCase();
        const terms = q && q !== shownLabel ? q.split(/\s+/) : [];
        const hits = terms.length
            ? this.options.filter((o) => terms.every((t) => o.search.includes(t)))
            : this.options;
        this.list.innerHTML = '';
        const MAX = this.maxDisplay;
        for (const o of hits.slice(0, MAX)) {
            const d = document.createElement('div');
            d.className = 'qb-opt' + (o.value === this.value ? ' qb-on' : '');
            d.innerHTML = `<span>${escapeHtml(o.label)}</span>${o.sub ? `<small>${escapeHtml(o.sub)}</small>` : ''}`;
            d.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.set(o.value);
                this.list.style.display = 'none';
                this.input.blur();
            });
            this.list.appendChild(d);
        }
        const more = document.createElement('div');
        more.className = 'qb-more';
        more.textContent = hits.length === 0 ? '没有匹配项'
            : hits.length > MAX ? `共 ${hits.length} 项，只列前 ${MAX} 项，请继续输入缩小范围` : `共 ${hits.length} 项`;
        this.list.appendChild(more);
        this.list.style.display = 'block';
    }
}

function escapeHtml(s: string): string {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

// ───────────────────────────── 即时战斗主体 ─────────────────────────────

interface Side {
    factionId: string;
    displayFactionName?: string;
    general: GeneralItem;
    troops: number;
    isClassicHero?: boolean;
}

interface ClassicBattleEntry {
    key: string;
    fb: GeneralFirstBattle;
    kind: FirstBattleKind;
    kindLabel: string;
    yearText: string;
    placeText: string;
    background: string;
    att: Side;
    def: Side;
}

interface ActiveBattle {
    kind: BattleKind;
    attacker: Army;
    defender: Army | null;
    city: { id: string; factionId: string; troops: number } | null;
    att: Side;
    def: Side;
    placeName: string;
    classic?: ClassicBattleEntry;
    phase: 'engaging' | 'fighting';
    startedAt: number;
    /** 引擎结算的时刻（战术画面可能还在演残局） */
    resolvedAt?: number;
    lingerKicked?: boolean;
    /** 引擎里这一仗开打的时刻（用来判「开打了却没进战术画面」） */
    engineStartedAt?: number;
    /** 已经补调过一次开战入口 */
    retried?: boolean;
    /** 战术画布开始淡入（真正看得见）的时刻 */
    visibleAt?: number;
    /** 本局到点判和（防重复收场） */
    timedOut?: boolean;
}

interface LastBattleSpec {
    mode: PanelMode;
    kind: BattleKind;
    att: Side;
    def: Side;
    classic?: ClassicBattleEntry;
    cityId?: string;
    fieldSpot?: { att: { lat: number; lng: number }; def: { lat: number; lng: number }; label: string };
}

/** 盖住战略地图的深色底：即时战斗里只看得到选人面板和战术画面 */
class Backdrop {
    readonly el: HTMLDivElement;
    private readonly msg: HTMLDivElement;
    private readonly detail: HTMLDivElement;
    constructor() {
        this.el = document.createElement('div');
        this.el.id = 'quick-battle-backdrop';
        // z-index 在战术画布（400）与各 HUD 之上、即时战斗面板（20050）之下；打仗时整块隐藏
        this.el.style.cssText = 'position:fixed;inset:0;z-index:20040;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;'
            + 'background:radial-gradient(ellipse at center,#2a2216 0%,#0d0b08 70%);padding:24px;';
        this.detail = document.createElement('div');
        this.detail.style.cssText = 'max-width:760px;width:92vw;display:none';
        this.msg = document.createElement('div');
        this.msg.style.cssText = 'color:#f3d48a;font:600 20px "Noto Serif SC",serif;letter-spacing:2px;text-align:center;padding:0 24px';
        this.el.append(this.detail, this.msg);
        document.body.appendChild(this.el);
    }
    show(v: boolean): void {
        const d = v ? 'flex' : 'none';
        if (this.el.style.display !== d) this.el.style.display = d;
    }
    say(text: string): void { this.msg.textContent = text; }
    setBattleBriefCard(html: string | null): void {
        if (!html) {
            this.detail.style.display = 'none';
            this.detail.innerHTML = '';
        } else {
            this.detail.innerHTML = html;
            this.detail.style.display = 'block';
        }
    }
}

/** 战术模式开关（调试面板 chk-tactical-mode）：GameAppCombatHooks.tacticalModeOn 每次开战都读它 */
function tacticalCheckbox(): HTMLInputElement | null {
    return document.getElementById('chk-tactical-mode') as HTMLInputElement | null;
}

class QuickBattle {
    private readonly generals: GeneralItem[];
    private readonly generalById: Map<string, GeneralItem>;
    private readonly factionName = new Map<string, string>();
    private readonly classics: ClassicBattleEntry[];
    private readonly classicByKey: Map<string, ClassicBattleEntry>;

    private panel!: HTMLDivElement;
    private status!: HTMLDivElement;
    private mode: PanelMode = 'classic';
    private classicFilter: ClassicKindFilter = 'all';
    private classicSel!: SearchSelect;
    private metaCard!: HTMLDivElement;
    private attPortraitBox!: HTMLDivElement;
    private defPortraitBox!: HTMLDivElement;
    private customControlsWrap!: HTMLDivElement;
    private classicControlsWrap!: HTMLDivElement;

    private attFaction!: SearchSelect;
    private attGeneral!: SearchSelect;
    private defFaction!: SearchSelect;
    private defGeneral!: SearchSelect;
    private citySel!: SearchSelect;
    private regionSel!: SearchSelect;
    private kind: 'random' | BattleKind = 'random';
    private active: ActiveBattle | null = null;
    private lastBattleSpec: LastBattleSpec | null = null;
    private lastClassicKey: string | null = null;
    private lastRandomPairKey: string | null = null;
    private replayBtn: HTMLButtonElement | null = null;
    /** 最近一条报错（开打却没进战术画面时，面板上直接写出来） */
    private lastError: { at: number; text: string } | null = null;

    constructor(private readonly app: GameApp, private readonly backdrop: Backdrop) {
        this.generals = collectGenerals();
        this.generalById = new Map(this.generals.map((g) => [g.generalId, g]));
        for (const f of FACTIONS) this.factionName.set(f.id, f.name);
        this.classics = this.buildClassicEntries();
        this.classicByKey = new Map(this.classics.map((c) => [c.key, c]));
    }

    /** 构造全库 531 场名将经典战役条目（按历史发生年份由古及今排序） */
    private buildClassicEntries(): ClassicBattleEntry[] {
        const cm = this.app.cityManager;
        const list: ClassicBattleEntry[] = [];
        for (const fb of Object.values(GENERAL_FIRST_BATTLES)) {
            const hero = this.resolveGeneral(fb.generalId, undefined, fb.targetCityId);
            const enemy = this.resolveGeneral(fb.enemyGeneralId ?? '', fb.enemyFactionId, fb.targetCityId);
            if (!hero || !enemy) continue;

            const myFactionId = hero.factionId;
            const myFactionName = this.fname(myFactionId);
            const enemyRawFactionId = fb.enemyFactionId || enemy.factionId;
            const enemyFactionName = FACTIONS.find((f) => f.id === enemyRawFactionId)?.name
                ?? fb.enemyFactionName
                ?? this.fname(enemyRawFactionId);
            // 同势力内战时引擎用 panshu 保证双方可交战，显示仍用真实历史势力名
            const enemyEngineFactionId = enemyRawFactionId !== myFactionId ? enemyRawFactionId : 'panshu';

            const { myTroops, enemyTroops } = clampFirstBattleTroops(fb.myTroops, fb.enemyTroops);
            const role = fb.role ?? 'attacker';
            const heroSide: Side = {
                factionId: myFactionId,
                displayFactionName: myFactionName,
                general: hero,
                troops: myTroops,
                isClassicHero: true,
            };
            const enemySide: Side = {
                factionId: enemyEngineFactionId,
                displayFactionName: enemyFactionName,
                general: enemy,
                troops: enemyTroops,
                isClassicHero: false,
            };

            const att = role === 'defender' ? enemySide : heroSide;
            const def = role === 'defender' ? heroSide : enemySide;
            const kind = firstBattleKindOf(fb);
            const kindLabel = FIRST_BATTLE_KIND_LABEL[kind];
            const yearText = formatYear(fb.battleYear);

            const targetCity = fb.targetCityId ? cm.getCity(fb.targetCityId) : undefined;
            const cityNote = targetCity && targetCity.name !== fb.targetName ? `·${targetCity.name}` : '';
            const placeText = `${fb.targetName}${cityNote}（${formatCoord(fb.targetLat, fb.targetLng)}）`;
            const background = FIRST_BATTLE_BACKGROUNDS[fb.generalId]
                ?? fb.introLines.map((l) => l.text).join(' ');

            list.push({
                key: fb.generalId,
                fb,
                kind,
                kindLabel,
                yearText,
                placeText,
                background,
                att,
                def,
            });
        }
        list.sort((a, b) => a.fb.battleYear - b.fb.battleYear || a.fb.battleName.localeCompare(b.fb.battleName, 'zh'));
        return list;
    }

    private resolveGeneral(generalId: string, fallbackFactionId?: string, fallbackCityId?: string): GeneralItem | null {
        if (!generalId) return null;
        const hit = this.generalById.get(generalId);
        if (hit) return hit;
        const rec = getGeneralRecordByGeneralId(generalId);
        if (!rec) return null;
        const fid = rec.factionId || fallbackFactionId || 'panshu';
        const cid = rec.cityId ?? fallbackCityId;
        const item: GeneralItem = {
            generalId: rec.generalId,
            generalName: rec.generalName,
            factionId: fid,
            cityId: cid,
            portrait: resolveGeneralPortraitPath(rec.portrait, {
                factionId: fid,
                generalId: rec.generalId,
                cityId: cid,
            }),
            eliteLabel: resolveEliteLabel(rec.generalId, fid),
        };
        this.generalById.set(generalId, item);
        return item;
    }

    init(): void {
        this.quietWorld();
        this.clearWorldLegions();
        this.captureErrors();
        this.buildPanel();
        this.backdrop.say('');
        // 默认预抽一场经典战役，展示时间、地点、背景介绍与双方武将立绘
        this.pickRandomClassic();
        // 打开页面第一次出选择画面也倒计时 30 秒自动开局（主人：「不是让你设计30秒开局吗」）
        this.say(`已载入 ${this.classics.length} 场名将经典战役。${QuickBattle.AUTO_NEXT_SEC} 秒内可自由选择经典战役或切换随机战斗，到时自动开局。`);
        this.startCountdown();
        // 🔴 [2026-11-07] 下注窗口就在这 30 秒里开着（回到选择画面即开窗，开战封盘）
        this.app.live?.beginBetRound?.();
        setInterval(() => this.watch(), 400);
        // 遮罩跟着战术画面走：选人、等进场、战术素材载入中、收场都盖住战略地图；战术画面开始淡入才撤。
        setInterval(() => {
            const loading = this.warActive() && this.app.scene13War?.entryFadePending === true;
            if (loading) this.backdrop.say('正在载入战术画面…');
            this.backdrop.show(!this.warActive() || loading);
        }, 100);
    }

    /** 开发期把每一场的经过写进 scratch/scene13_probe_log.jsonl（why=quickBattle），进不去时不用主人看日志 */
    private report(stage: string, a: ActiveBattle | null, extra: Record<string, unknown> = {}): void {
        if (!import.meta.env.DEV) return;
        const cs = this.app.combatSystem;
        const ids = a ? [a.attacker.id, ...(a.defender ? [a.defender.id] : [])] : [];
        const body = {
            at: new Date().toISOString(),
            why: 'quickBattle',
            stage,
            kind: a?.kind,
            classicKey: a?.classic?.key ?? null,
            place: a?.placeName,
            att: a ? { g: a.att.general.generalId, f: a.att.factionId, troops: a.att.troops } : undefined,
            def: a ? { g: a.def.general.generalId, f: a.def.factionId, troops: a.def.troops } : undefined,
            chk: tacticalCheckbox()?.checked ?? null,
            tacticalFlag: this.app.tacticalModeEnabled,
            war: this.app.scene13War?.isActive?.() === true,
            scene: this.app.battleScene?.isActive?.() === true,
            followed: this.app.cameraFollowUI?.getFollowedArmyId?.() ?? null,
            fields: cs.getActiveBattleFields().map((bf) => ({
                type: bf.type, frozen: bf.scene13Frozen, over: bf.isOver,
                ours: ids.some((id) => bf.hasParticipant(id)),
            })),
            battles: cs.getActiveBattles().map((b) => ({ frozen: b.scene13Frozen, over: b.isOver })),
            lastError: this.lastError && a && this.lastError.at >= a.startedAt ? this.lastError.text : null,
            ...extra,
        };
        void fetch('/api/scene13-probe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).catch(() => { /* 诊断落盘失败不影响对战 */ });
    }

    /** 记下报错原文：战术画面没起来时，面板上要能说清楚是哪里错了 */
    private captureErrors(): void {
        const note = (text: string) => { this.lastError = { at: performance.now(), text: text.slice(0, 200) }; };
        window.addEventListener('error', (e) => note(String(e.error?.message ?? e.message ?? e.error)));
        window.addEventListener('unhandledrejection', (e) => note(String((e.reason as Error)?.message ?? e.reason)));
        const orig = console.error.bind(console);
        console.error = (...args: unknown[]) => {
            note(args.map((x) => (x instanceof Error ? x.message : String(x))).join(' '));
            orig(...args);
        };
    }

    /**
     * 即时战斗就是来打战术模式的：开战前把战术模式开关打开（只改本页这一刻的勾选，不写存档）。
     */
    private forceTacticalOn(): boolean {
        const chk = tacticalCheckbox();
        const wasOff = !!chk && !chk.checked;
        if (chk) chk.checked = true;
        this.app.tacticalModeEnabled = true;
        return wasOff;
    }

    private fname(id: string): string {
        return this.factionName.get(id) ?? this.app.cityManager.getFactionName(id) ?? id;
    }

    /** 只留这一仗：停 AI 寻敌、募兵、玩家乱入者与任务跟踪；全年代武将与据点城级全部解锁 */
    private quietWorld(): void {
        const app = this.app as unknown as Record<string, { update?: unknown; tick?: unknown } | null>;
        const noop = () => { /* 即时战斗：停用 */ };
        if (app.aiController) app.aiController.update = noop;
        if (app.recruitmentSystem) {
            app.recruitmentSystem.update = noop;
            (this.app.recruitmentSystem as unknown as { markInitialSpawnDone?: () => void }).markInitialSpawnDone?.();
            (app.recruitmentSystem as Record<string, unknown>).runInitialSpawn = noop;
        }
        if (app.playerHero) {
            (app.playerHero as Record<string, unknown>).autoPlan = 'melee';
            app.playerHero.update = noop;
        }
        if (app.playerQuests) app.playerQuests.tick = noop;
        // 解除百岁/剧本年份闸门：保证全库武将显示真名、武将技生效、据点保持真实城级与奇观
        setGameModeProvider(() => 'melee');
        setCentenarianYearProvider(() => null);
        setScriptYearProvider(() => null);
        setWonderGateYearProvider(() => null);
        (this.app as unknown as { syncCityFoundedTypes?: () => void }).syncCityFoundedTypes?.();
        releaseDeploy();
        this.app.timeSystem.setPaused(true);
    }

    /** 撤掉地图上的军团；keep 里的（本场双方）不动 */
    private clearWorldLegions(keep?: ReadonlySet<Army>): void {
        const lm = this.app.historicalEventManager.getLegionManager();
        for (const a of [...lm.getArmies()]) {
            if (a.isDestroyed || keep?.has(a)) continue;
            if (keep && a.getIsInCombat()) continue;
            try { a.disband(); } catch (e) { console.warn('[即时战斗] 解散军团失败', a.name, e); }
        }
    }

    // ── 界面 ──

    private buildPanel(): void {
        const style = document.createElement('style');
        style.textContent = PANEL_CSS;
        document.head.appendChild(style);

        const p = document.createElement('div');
        p.id = 'quick-battle-panel';
        this.panel = p;

        // 1. 顶部标题与模式切换栏（经典战役 531 场 vs 随机/自由战斗）
        const header = document.createElement('div');
        header.className = 'qb-header';
        header.innerHTML = `<div class="qb-title">MAPWAR · 即时战术对战</div>`;

        const modeTabs = document.createElement('div');
        modeTabs.className = 'qb-mode-tabs';
        const btnClassic = document.createElement('button');
        btnClassic.type = 'button';
        btnClassic.dataset.mode = 'classic';
        btnClassic.textContent = `📜 名将经典战役（${this.classics.length} 场）`;
        btnClassic.addEventListener('click', () => this.setMode('classic'));

        const btnRandom = document.createElement('button');
        btnRandom.type = 'button';
        btnRandom.dataset.mode = 'random';
        btnRandom.textContent = '🎲 随机 / 自由战斗';
        btnRandom.addEventListener('click', () => this.setMode('random'));

        modeTabs.append(btnClassic, btnRandom);
        header.appendChild(modeTabs);

        // 2. 经典战役专属选择栏（分类过滤 + 搜索下拉 + 随机抽取按钮）
        this.classicControlsWrap = document.createElement('div');
        this.classicControlsWrap.className = 'qb-classic-bar';

        const filterRow = document.createElement('div');
        filterRow.className = 'qb-classic-filters';
        const counts = {
            all: this.classics.length,
            field: this.classics.filter((c) => c.kind === 'field').length,
            siege_attack: this.classics.filter((c) => c.kind === 'siege_attack').length,
            siege_defend: this.classics.filter((c) => c.kind === 'siege_defend').length,
        };
        const filterDefs: [ClassicKindFilter, string][] = [
            ['all', `全部（${counts.all}）`],
            ['field', `野战（${counts.field}）`],
            ['siege_attack', `攻城战（${counts.siege_attack}）`],
            ['siege_defend', `防守战（${counts.siege_defend}）`],
        ];
        for (const [fk, flabel] of filterDefs) {
            const fb = document.createElement('button');
            fb.type = 'button';
            fb.dataset.cfilter = fk;
            fb.textContent = flabel;
            fb.addEventListener('click', () => {
                this.classicFilter = fk;
                this.syncClassicFilterButtons();
                this.classicSel.setOptions(this.classicOptions(fk), true);
                if (!this.classicSel.get()) this.pickRandomClassic();
                else this.refreshPreview();
            });
            filterRow.appendChild(fb);
        }

        const classicPickRow = document.createElement('div');
        classicPickRow.className = 'qb-classic-pick-row';
        this.classicSel = new SearchSelect(
            '选择名将经典战役（可搜战役名、年份、地点、双方名将、势力）',
            '输入关键词搜索 531 场经典战役（不选＝随机经典战役）',
            600,
        );
        this.classicSel.setOptions(this.classicOptions('all'));
        this.classicSel.onChange = () => {
            if (this.classicSel.get()) this.mode = 'classic';
            this.syncModeTabs();
            this.refreshPreview();
        };

        const btnRandClassic = document.createElement('button');
        btnRandClassic.type = 'button';
        btnRandClassic.className = 'qb-rand-classic-btn';
        btnRandClassic.textContent = '🎲 随机换一场经典战';
        btnRandClassic.addEventListener('click', () => {
            this.setMode('classic');
            this.pickRandomClassic();
        });

        classicPickRow.append(this.classicSel.root, btnRandClassic);
        this.classicControlsWrap.append(filterRow, classicPickRow);

        // 3. 时间 · 地点 · 背景介绍 信息卡
        this.metaCard = document.createElement('div');
        this.metaCard.className = 'qb-meta-card';

        // 4. 左右攻守双方卡片（含武将立绘 + 自由对战选择器）
        const facOpts: Opt[] = FACTIONS
            .filter((f) => this.generals.some((g) => g.factionId === f.id))
            .map((f) => ({ value: f.id, label: f.name, sub: f.id, search: `${f.name} ${f.id}`.toLowerCase() }));

        const mkSide = (
            title: string,
            cls: string,
        ): [SearchSelect, SearchSelect, HTMLDivElement, HTMLDivElement, HTMLDivElement] => {
            const box = document.createElement('div');
            box.className = `qb-side ${cls}`;
            box.innerHTML = `<div class="qb-side-title">${title}</div>`;

            const portraitBox = document.createElement('div');
            portraitBox.className = 'qb-portrait-card';

            const customWrap = document.createElement('div');
            customWrap.className = 'qb-side-custom';
            const fac = new SearchSelect('势力');
            const gen = new SearchSelect('武将');
            fac.setOptions(facOpts);
            const refreshGen = () => {
                gen.setOptions(this.generalOptions(fac.get()));
                this.refreshPreview();
            };
            fac.onChange = refreshGen;
            gen.onChange = () => this.refreshPreview();
            fac.setOptions(facOpts);
            gen.setOptions(this.generalOptions(null));
            customWrap.append(fac.root, gen.root);

            box.append(portraitBox, customWrap);
            return [fac, gen, portraitBox, customWrap, box];
        };
        const [af, ag, attPortrait, attCustom, attBox] = mkSide('⚔ 攻方（左）', 'qb-att');
        const [df, dg, defPortrait, defCustom, defBox] = mkSide('🛡 守方（右）', 'qb-def');
        this.attFaction = af;
        this.attGeneral = ag;
        this.defFaction = df;
        this.defGeneral = dg;
        this.attPortraitBox = attPortrait;
        this.defPortraitBox = defPortrait;

        const mid = document.createElement('div');
        mid.className = 'qb-mid';
        const midTitle = document.createElement('div');
        midTitle.className = 'qb-side-title qb-mid-title';
        midTitle.textContent = '🗺 战场设定';
        const kindRow = document.createElement('div');
        kindRow.className = 'qb-kind';
        const kinds: [typeof this.kind, string][] = [['random', '随机'], ['siege', '攻城战'], ['field', '野战']];
        for (const [k, label] of kinds) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.dataset.kind = k;
            b.addEventListener('click', () => {
                this.kind = k;
                this.syncKind();
                this.refreshPreview();
            });
            kindRow.appendChild(b);
        }
        this.citySel = new SearchSelect('据点（攻城战）');
        this.citySel.setOptions(this.cityOptions());
        this.citySel.onChange = () => this.refreshPreview();
        this.regionSel = new SearchSelect('地域（野战）');
        this.regionSel.setOptions(this.regionOptions());
        this.regionSel.onChange = () => this.refreshPreview();

        const randCustomBtn = document.createElement('button');
        randCustomBtn.type = 'button';
        randCustomBtn.className = 'qb-rand-custom-btn';
        randCustomBtn.textContent = '🎲 随机抽取攻守武将';
        randCustomBtn.addEventListener('click', () => this.pickRandomCustomPreview());

        mid.append(midTitle, kindRow, this.citySel.root, this.regionSel.root, randCustomBtn);

        this.customControlsWrap = document.createElement('div');
        this.customControlsWrap.className = 'qb-body';
        this.customControlsWrap.append(attBox, mid, defBox);
        // 把自定义下拉挂在数组里供模式切换显隐（立绘始终显示）
        (this.customControlsWrap as unknown as { _sideCustoms: HTMLElement[] })._sideCustoms = [attCustom, defCustom, mid];

        const actions = document.createElement('div');
        actions.className = 'qb-actions';
        const go = document.createElement('button');
        go.type = 'button';
        go.className = 'qb-go';
        go.textContent = '⚔ 开战';
        go.addEventListener('click', () => this.launch());
        this.goBtn = go;

        const nextClassicBtn = document.createElement('button');
        nextClassicBtn.type = 'button';
        nextClassicBtn.textContent = '📜 随机经典战';
        nextClassicBtn.addEventListener('click', () => {
            this.setMode('classic');
            this.pickRandomClassic();
        });

        const reset = document.createElement('button');
        reset.type = 'button';
        reset.textContent = '🎲 随机自由战';
        reset.addEventListener('click', () => {
            this.setMode('random');
            this.pickRandomCustomPreview();
        });

        const replayBtn = document.createElement('button');
        replayBtn.type = 'button';
        replayBtn.className = 'qb-replay';
        replayBtn.textContent = '🔄 重复上一局';
        replayBtn.disabled = true;
        replayBtn.title = '尚无上一局对战记录';
        replayBtn.addEventListener('click', () => this.replayLastBattle());
        this.replayBtn = replayBtn;

        actions.append(nextClassicBtn, reset, replayBtn, go);

        this.status = document.createElement('div');
        this.status.className = 'qb-status';

        p.append(header, this.classicControlsWrap, this.metaCard, this.customControlsWrap, actions, this.status);
        document.body.appendChild(p);
        this.syncModeTabs();
        this.syncClassicFilterButtons();
        this.syncKind();
    }

    private setMode(m: PanelMode): void {
        this.mode = m;
        this.syncModeTabs();
        if (m === 'classic' && !this.classicSel.get()) {
            this.pickRandomClassic();
        } else if (m === 'random' && !this.attGeneral.get() && !this.defGeneral.get()) {
            this.pickRandomCustomPreview();
        } else {
            this.refreshPreview();
        }
    }

    private syncModeTabs(): void {
        this.panel.querySelectorAll<HTMLButtonElement>('.qb-mode-tabs button')
            .forEach((b) => b.classList.toggle('qb-on', b.dataset.mode === this.mode));
        this.classicControlsWrap.style.display = this.mode === 'classic' ? '' : 'none';
        const sideCustoms = (this.customControlsWrap as unknown as { _sideCustoms?: HTMLElement[] })._sideCustoms ?? [];
        for (const el of sideCustoms) {
            el.style.display = this.mode === 'random' ? '' : 'none';
        }
        this.customControlsWrap.classList.toggle('qb-classic-dual', this.mode === 'classic');
    }

    private syncClassicFilterButtons(): void {
        this.classicControlsWrap.querySelectorAll<HTMLButtonElement>('.qb-classic-filters button')
            .forEach((b) => b.classList.toggle('qb-on', b.dataset.cfilter === this.classicFilter));
    }

    private syncKind(): void {
        this.panel.querySelectorAll<HTMLButtonElement>('.qb-kind button')
            .forEach((b) => b.classList.toggle('qb-on', b.dataset.kind === this.kind));
        this.citySel.root.style.display = this.kind === 'field' ? 'none' : '';
        this.regionSel.root.style.display = this.kind === 'siege' ? 'none' : '';
    }

    private classicOptions(filter: ClassicKindFilter): Opt[] {
        return this.classics
            .filter((c) => filter === 'all' || c.kind === filter)
            .map((c) => {
                const attText = `${c.att.displayFactionName ?? this.fname(c.att.factionId)}·${c.att.general.generalName}`;
                const defText = `${c.def.displayFactionName ?? this.fname(c.def.factionId)}·${c.def.general.generalName}`;
                const label = `【${c.yearText}·${c.kindLabel}】${c.fb.battleName}`;
                const sub = `${attText} vs ${defText} · ${c.fb.targetName}`;
                const search = `${c.fb.battleName} ${c.yearText} ${c.fb.battleYear} ${c.kindLabel} ${c.fb.targetName} ${c.placeText} ${attText} ${defText} ${c.key}`.toLowerCase();
                return { value: c.key, label, sub, search };
            });
    }

    /** 从当前经典战役分类池里随机抽一场并更新面板预览（排除当前与上一局，杜绝连续两场同样战役） */
    private pickRandomClassic(avoidKey?: string): void {
        const curKey = this.classicSel.get();
        const bannedKeys = new Set<string>();
        const bannedNames = new Set<string>();
        for (const k of [avoidKey, curKey, this.lastClassicKey]) {
            if (!k) continue;
            bannedKeys.add(k);
            const bName = this.classicByKey.get(k)?.fb.battleName;
            if (bName) bannedNames.add(bName);
        }
        const basePool = this.classics.filter(
            (c) => this.classicFilter === 'all' || c.kind === this.classicFilter,
        );
        const strictPool = basePool.filter(
            (c) => !bannedKeys.has(c.key) && !bannedNames.has(c.fb.battleName),
        );
        const keyOnlyPool = basePool.filter((c) => !bannedKeys.has(c.key));
        const picked = rand(strictPool) ?? rand(keyOnlyPool) ?? rand(basePool) ?? rand(this.classics);
        if (picked) {
            this.classicSel.set(picked.key, true);
        }
        this.refreshPreview();
    }

    /** 随机自由战斗：预抽一组攻守武将供面板信息预览（排除当前与上一局组合，杜绝连续两场相同对阵） */
    private pickRandomCustomPreview(): void {
        const curAtt = this.attGeneral.get();
        const curDef = this.defGeneral.get();
        const bannedPairs = new Set<string>();
        if (curAtt && curDef) {
            bannedPairs.add(`${curAtt}|${curDef}`);
            bannedPairs.add(`${curDef}|${curAtt}`);
        }
        if (this.lastRandomPairKey) {
            const [la, ld] = this.lastRandomPairKey.split('|');
            if (la && ld) {
                bannedPairs.add(`${la}|${ld}`);
                bannedPairs.add(`${ld}|${la}`);
            }
        }
        this.attFaction.set(null, true);
        this.defFaction.set(null, true);
        this.attGeneral.setOptions(this.generalOptions(null), false);
        this.defGeneral.setOptions(this.generalOptions(null), false);
        let attG: GeneralItem | null = null;
        let defG: GeneralItem | null = null;
        for (let tries = 0; tries < 24; tries++) {
            attG = this.pickGeneral(null, null, {});
            defG = attG ? this.pickGeneral(null, null, { generalId: attG.generalId, factionId: attG.factionId }) : null;
            if (!attG || !defG) break;
            if (!bannedPairs.has(`${attG.generalId}|${defG.generalId}`)) break;
        }
        this.attGeneral.set(attG?.generalId ?? null, true);
        this.defGeneral.set(defG?.generalId ?? null, true);
        this.refreshPreview();
    }

    /** 渲染单侧武将信息卡（不显示未调用缩放数据的小立绘，完整缩放立绘在战术战斗画面中展示） */
    private renderPortraitCard(
        box: HTMLDivElement,
        sideLabel: '攻方' | '守方',
        general: GeneralItem | null,
        factionLabel: string,
        troopsLabel: string,
        isClassicHero = false,
    ): void {
        if (!general) {
            box.innerHTML = `
                <div class="qb-portrait-meta">
                    <div class="qb-p-name">随机武将 <span class="qb-p-tag">${sideLabel}</span></div>
                    <div class="qb-p-line"><span>势力：</span>${escapeHtml(factionLabel || '随机势力')}</div>
                    <div class="qb-p-line"><span>精锐：</span>开战时按武将装配</div>
                    <div class="qb-p-line"><span>兵力：</span>${escapeHtml(troopsLabel)}</div>
                </div>
            `;
            return;
        }
        const heroBadge = isClassicHero
            ? `<span class="qb-p-hero-badge">★ 战役主角</span>`
            : `<span class="qb-p-tag">${sideLabel}主帅</span>`;
        box.innerHTML = `
            <div class="qb-portrait-meta">
                <div class="qb-p-name">${escapeHtml(general.generalName)} ${heroBadge}</div>
                <div class="qb-p-line"><span>势力：</span><b>${escapeHtml(factionLabel)}</b></div>
                <div class="qb-p-line"><span>精锐：</span>${escapeHtml(general.eliteLabel)}</div>
                <div class="qb-p-line"><span>兵力：</span>${escapeHtml(troopsLabel)}</div>
            </div>
        `;
    }

    /** 刷新面板上的「时间、地点、背景介绍」与「攻守双方武将立绘」 */
    private refreshPreview(): void {
        if (this.mode === 'classic') {
            const key = this.classicSel.get();
            const entry = (key ? this.classicByKey.get(key) : undefined) ?? this.classics[0];
            if (!entry) return;
            const attFacName = entry.att.displayFactionName ?? this.fname(entry.att.factionId);
            const defFacName = entry.def.displayFactionName ?? this.fname(entry.def.factionId);
            this.renderPortraitCard(
                this.attPortraitBox,
                '攻方',
                entry.att.general,
                attFacName,
                `${entry.att.troops.toLocaleString()} 人`,
                !!entry.att.isClassicHero,
            );
            this.renderPortraitCard(
                this.defPortraitBox,
                '守方',
                entry.def.general,
                defFacName,
                `${entry.def.troops.toLocaleString()} 人`,
                !!entry.def.isClassicHero,
            );
            this.metaCard.innerHTML = `
                <div class="qb-meta-head">
                    <span class="qb-meta-badge qb-badge-${entry.kind}">${escapeHtml(entry.kindLabel)}</span>
                    <span class="qb-meta-battle-title">${escapeHtml(entry.fb.battleName)}</span>
                    <span class="qb-meta-Chip">🕒 时间：<b>${escapeHtml(entry.yearText)}</b></span>
                    <span class="qb-meta-Chip">📍 地点：<b>${escapeHtml(entry.placeText)}</b></span>
                </div>
                <div class="qb-meta-bg">
                    <span class="qb-meta-bg-label">📖 背景介绍：</span>${escapeHtml(entry.background)}
                </div>
            `;
            return;
        }

        // 随机 / 自由战斗模式
        const attG = this.attGeneral.get() ? (this.generalById.get(this.attGeneral.get()!) ?? null) : null;
        const defG = this.defGeneral.get() ? (this.generalById.get(this.defGeneral.get()!) ?? null) : null;
        const attFacId = this.attFaction.get() ?? attG?.factionId ?? null;
        const defFacId = this.defFaction.get() ?? defG?.factionId ?? null;
        const { FIRST_BATTLE_MIN_TROOPS: lo, FIRST_BATTLE_MAX_TROOPS: hi } = GameConfig.COMBAT;
        const troopsRange = `${lo.toLocaleString()} ~ ${hi.toLocaleString()} 人（随机）`;

        this.renderPortraitCard(
            this.attPortraitBox,
            '攻方',
            attG,
            attFacId ? this.fname(attFacId) : '随机势力',
            troopsRange,
            false,
        );
        this.renderPortraitCard(
            this.defPortraitBox,
            '守方',
            defG,
            defFacId ? this.fname(defFacId) : '随机势力',
            troopsRange,
            false,
        );

        const kindText = this.kind === 'siege' ? '攻城战' : this.kind === 'field' ? '野战' : '随机（攻城战 / 野战）';
        const cityObj = this.citySel.get() ? this.app.cityManager.getCity(this.citySel.get()!) : undefined;
        const regKey = this.regionSel.get() as RegionType | null;
        const placeStr = this.kind === 'siege'
            ? (cityObj ? `${cityObj.name}（${formatCoord(cityObj.latitude, cityObj.longitude)}）` : '随机据点')
            : this.kind === 'field'
                ? (regKey ? `${CULTURE_NAMES[regKey] ?? regKey}（区域野战）` : '随机地域野外战场')
                : (cityObj ? `据点：${cityObj.name}` : regKey ? `地域：${CULTURE_NAMES[regKey] ?? regKey}` : '随机战场（据点或野外）');

        const attDesc = attG ? `${this.fname(attG.factionId)}·${attG.generalName}` : (attFacId ? `${this.fname(attFacId)}随机武将` : '随机武将');
        const defDesc = defG ? `${this.fname(defG.factionId)}·${defG.generalName}` : (defFacId ? `${this.fname(defFacId)}随机武将` : '随机武将');

        this.metaCard.innerHTML = `
            <div class="qb-meta-head">
                <span class="qb-meta-badge qb-badge-random">${escapeHtml(kindText)}</span>
                <span class="qb-meta-battle-title">自由 / 随机战术对战</span>
                <span class="qb-meta-Chip">🕒 时间：<b>跨时代乱斗（不限年份）</b></span>
                <span class="qb-meta-Chip">📍 地点：<b>${escapeHtml(placeStr)}</b></span>
            </div>
            <div class="qb-meta-bg">
                <span class="qb-meta-bg-label">📖 对战说明：</span>当前攻方为 <b>${escapeHtml(attDesc)}</b>，守方为 <b>${escapeHtml(defDesc)}</b>。未指定项将在开战时自动随机抽取；也可切回上方「📜 名将经典战役（${this.classics.length} 场）」体验真实历史名将对决。
            </div>
        `;
    }

    /** 构造载入遮罩上的战役简报卡（含时间、地点、背景介绍、双方武将信息；不显示未调用缩放数据的小立绘） */
    private buildBackdropBriefHtml(a: ActiveBattle): string {
        const c = a.classic;
        const kindLabel = c ? c.kindLabel : (a.kind === 'siege' ? '攻城战' : '野战');
        const battleTitle = c ? c.fb.battleName : `${a.placeName}之战`;
        const yearText = c ? c.yearText : '跨时代乱斗';
        const placeText = c ? c.placeText : a.placeName;
        const bgText = c
            ? c.background
            : `${this.fname(a.att.factionId)}名将${a.att.general.generalName}率军 ${a.att.troops.toLocaleString()} 人，与${this.fname(a.def.factionId)}名将${a.def.general.generalName}（${a.def.troops.toLocaleString()} 人）于${a.placeName}展开战术决战。`;
        const attFac = a.att.displayFactionName ?? this.fname(a.att.factionId);
        const defFac = a.def.displayFactionName ?? this.fname(a.def.factionId);
        return `
            <div class="qb-loading-card">
                <div class="qb-loading-top">
                    <span class="qb-meta-badge">${escapeHtml(kindLabel)}</span>
                    <span class="qb-loading-title">${escapeHtml(battleTitle)}</span>
                </div>
                <div class="qb-loading-sub">
                    <span>🕒 时间：<b>${escapeHtml(yearText)}</b></span>
                    <span>📍 地点：<b>${escapeHtml(placeText)}</b></span>
                </div>
                <div class="qb-loading-vs">
                    <div class="qb-loading-hero qb-lh-att">
                        <div>
                            <div class="qb-lh-role">⚔ 攻方 · ${escapeHtml(attFac)}</div>
                            <div class="qb-lh-name">${escapeHtml(a.att.general.generalName)}</div>
                            <div class="qb-lh-meta">${escapeHtml(a.att.general.eliteLabel)} · ${a.att.troops.toLocaleString()} 人</div>
                        </div>
                    </div>
                    <div class="qb-loading-vs-tag">VS</div>
                    <div class="qb-loading-hero qb-lh-def">
                        <div>
                            <div class="qb-lh-role">🛡 守方 · ${escapeHtml(defFac)}</div>
                            <div class="qb-lh-name">${escapeHtml(a.def.general.generalName)}</div>
                            <div class="qb-lh-meta">${escapeHtml(a.def.general.eliteLabel)} · ${a.def.troops.toLocaleString()} 人</div>
                        </div>
                    </div>
                </div>
                <div class="qb-loading-bg">📖 <b>背景介绍：</b>${escapeHtml(bgText)}</div>
            </div>
        `;
    }

    private say(msg: string, warn = false): void {
        this.status.textContent = msg;
        this.status.classList.toggle('qb-warn', warn);
    }

    private generalOptions(factionId: string | null): Opt[] {
        return this.generals
            .filter((g) => !factionId || g.factionId === factionId)
            .map((g) => {
                const fn = this.fname(g.factionId);
                return { value: g.generalId, label: g.generalName, sub: `${fn}·${g.eliteLabel}`, search: `${g.generalName} ${g.generalId} ${fn} ${g.eliteLabel}`.toLowerCase() };
            });
    }

    private cityOptions(): Opt[] {
        return this.app.cityManager.getCities().map((c) => {
            const t = CITY_TYPE_LABEL[c.type] ?? c.type;
            const fn = this.fname(c.factionId);
            return { value: c.id, label: c.name, sub: `${t}·${fn}`, search: `${c.name} ${c.id} ${t} ${fn}`.toLowerCase() };
        });
    }

    private regionOptions(): Opt[] {
        const count = new Map<RegionType, number>();
        for (const c of this.app.cityManager.getCities()) {
            const r = getCityRegion(c);
            count.set(r, (count.get(r) ?? 0) + 1);
        }
        return [...count.entries()].map(([r, n]) => {
            const label = CULTURE_NAMES[r] ?? r;
            return { value: r, label, sub: `${r}·${n} 座据点`, search: `${label} ${r}`.toLowerCase() };
        });
    }

    // ── 选人（不选＝随机） ──

    private pickGeneral(factionId: string | null, generalId: string | null, avoid: { generalId?: string; factionId?: string }): GeneralItem | null {
        if (generalId) return this.generalById.get(generalId) ?? null;
        const pool = this.generals.filter((g) =>
            (!factionId || g.factionId === factionId)
            && g.generalId !== avoid.generalId
            && (factionId || g.factionId !== avoid.factionId));
        return rand(pool) ?? null;
    }

    // ── 循环播放：打完回选择画面，30 秒后自动再开一局 ──

    private static readonly AUTO_NEXT_SEC = 30;
    private static readonly ROUND_LIMIT_MS = 300_000;
    private goBtn: HTMLButtonElement | null = null;
    private countdownTimer: number | null = null;

    private startCountdown(): void {
        this.stopCountdown();
        let left = QuickBattle.AUTO_NEXT_SEC;
        const paint = () => { if (this.goBtn) this.goBtn.textContent = `⚔ 开战（${left} 秒后自动开战）`; };
        paint();
        this.countdownTimer = window.setInterval(() => {
            left--;
            if (left > 0) { paint(); return; }
            this.stopCountdown();
            this.launch();
            if (!this.active) this.startCountdown();
        }, 1000);
    }

    private stopCountdown(): void {
        if (this.countdownTimer !== null) window.clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        if (this.goBtn) this.goBtn.textContent = '⚔ 开战';
    }

    private launch(): void {
        this.stopCountdown();
        if (this.active) { this.say('上一仗还没打完。', true); return; }
        if (!appReady(this.app)) { this.say('游戏还在加载，稍等。', true); return; }
        try {
            if (this.mode === 'classic') {
                this.launchClassicInner();
            } else {
                this.launchRandomInner();
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('[即时战斗] 开战失败', e);
            this.report('launchError', this.active, { error: msg, stack: e instanceof Error ? e.stack?.slice(0, 1500) : undefined });
            this.say(`开战失败：${msg}`, true);
            this.cleanup();
            this.panel.classList.remove('qb-hidden');
            this.app.live?.refundBetRound?.();
            this.app.live?.beginBetRound?.();
            this.startCountdown();
        }
    }

    /** 重复上一局：完全还原上一局的战役、双方主帅、兵力与战场并立即开战 */
    private replayLastBattle(): void {
        const spec = this.lastBattleSpec;
        if (!spec) { this.say('尚无上一局对战记录。', true); return; }
        this.stopCountdown();
        if (this.active) { this.say('上一仗还没打完。', true); return; }
        if (!appReady(this.app)) { this.say('游戏还在加载，稍等。', true); return; }

        try {
            if (spec.classic) {
                this.mode = 'classic';
                this.classicSel.set(spec.classic.key, true);
                this.syncModeTabs();
                this.refreshPreview();
            } else {
                this.mode = 'random';
                this.kind = spec.kind;
                this.syncKind();
                this.attFaction.set(spec.att.factionId, true);
                this.defFaction.set(spec.def.factionId, true);
                this.attGeneral.setOptions(this.generalOptions(spec.att.factionId), false);
                this.defGeneral.setOptions(this.generalOptions(spec.def.factionId), false);
                this.attGeneral.set(spec.att.general.generalId, true);
                this.defGeneral.set(spec.def.general.generalId, true);
                if (spec.cityId) this.citySel.set(spec.cityId, true);
                this.syncModeTabs();
                this.refreshPreview();
            }

            this.app.live?.sealBetRound?.();
            this.clearWorldLegions();
            const switchedOn = this.forceTacticalOn();
            const cm = this.app.cityManager;

            if (spec.kind === 'siege') {
                const targetCity = (spec.cityId ? cm.getCity(spec.cityId) : undefined)
                    ?? (spec.classic?.fb.targetCityId ? cm.getCity(spec.classic.fb.targetCityId) : undefined)
                    ?? (spec.classic ? cm.getNearestCity(null, { latitude: spec.classic.fb.targetLat, longitude: spec.classic.fb.targetLng }) : undefined);
                if (!targetCity) throw new Error('找不到上一局的据点');
                this.startSiege({ ...spec.att }, { ...spec.def }, targetCity, spec.classic);
            } else {
                this.startField({ ...spec.att }, { ...spec.def }, spec.classic, spec.fieldSpot);
            }

            if (switchedOn) {
                console.info('[即时战斗] 调试面板的「战术模式」开关原来是关的，本页已临时打开（不改存档设置）');
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('[即时战斗] 重复上一局失败', e);
            this.say(`重复上一局失败：${msg}`, true);
            this.cleanup();
            this.panel.classList.remove('qb-hidden');
            this.app.live?.refundBetRound?.();
            this.app.live?.beginBetRound?.();
            this.startCountdown();
        }
    }

    private syncReplayButton(): void {
        if (!this.replayBtn) return;
        const spec = this.lastBattleSpec;
        if (!spec) {
            this.replayBtn.disabled = true;
            this.replayBtn.title = '尚无上一局对战记录';
            return;
        }
        this.replayBtn.disabled = false;
        const battleLabel = spec.classic
            ? spec.classic.fb.battleName
            : `${spec.att.general.generalName} vs ${spec.def.general.generalName}`;
        this.replayBtn.title = `重复上一局：${battleLabel}`;
    }

    /** 启动一场名将经典战役（531 场之一） */
    private launchClassicInner(): void {
        let key = this.classicSel.get();
        if (!key || !this.classicByKey.has(key)) {
            this.pickRandomClassic();
            key = this.classicSel.get();
        }
        const entry = (key ? this.classicByKey.get(key) : undefined) ?? rand(this.classics);
        if (!entry) { this.say('找不到经典战役条目。', true); return; }

        const { fb, att, def } = entry;
        const cm = this.app.cityManager;

        this.app.live?.sealBetRound?.();
        this.clearWorldLegions();
        const switchedOn = this.forceTacticalOn();

        if (fb.battleType === 'siege') {
            const targetCity = (fb.targetCityId ? cm.getCity(fb.targetCityId) : undefined)
                ?? cm.getNearestCity(null, { latitude: fb.targetLat, longitude: fb.targetLng });
            if (!targetCity) throw new Error(`找不到经典战役据点：${fb.targetName}`);
            this.startSiege(att, def, targetCity, entry);
        } else {
            this.startField(att, def, entry);
        }
        if (switchedOn) {
            console.info('[即时战斗] 调试面板的「战术模式」开关原来是关的，本页已临时打开（不改存档设置）');
        }
    }

    /** 启动一场自由 / 随机战斗 */
    private launchRandomInner(): void {
        const cm = this.app.cityManager;
        const kind: BattleKind = this.kind === 'random' ? (Math.random() < 0.5 ? 'siege' : 'field') : this.kind;

        const attFac = this.attFaction.get();
        const defFac = this.defFaction.get();
        if (attFac && defFac && attFac === defFac) { this.say('双方势力不能相同。', true); return; }

        const attG = this.pickGeneral(attFac, this.attGeneral.get(), {});
        if (!attG) { this.say('攻方找不到可用武将。', true); return; }
        const attFactionId = attFac ?? attG.factionId;

        let city: City | undefined;
        if (kind === 'siege') {
            const cid = this.citySel.get();
            city = cid ? cm.getCity(cid) : rand(cm.getCities().filter((c) => c.factionId !== attFactionId)) ?? rand(cm.getCities());
            if (!city) { this.say('找不到据点。', true); return; }
        }

        let defG: GeneralItem | null = null;
        if (this.defGeneral.get()) {
            defG = this.pickGeneral(null, this.defGeneral.get(), {});
        } else if (kind === 'siege' && city && !defFac) {
            const anchored = getCityAnchoredGeneral(city.id);
            const item = anchored ? this.generalById.get(anchored.generalId) : undefined;
            if (item && item.generalId !== attG.generalId && item.factionId !== attFactionId) defG = item;
        }
        if (!defG) defG = this.pickGeneral(defFac, null, { generalId: attG.generalId, factionId: attFactionId });
        if (!defG) { this.say('守方找不到可用武将。', true); return; }
        // 若用户未手动锁死双方武将且抽到了与上一局相同的对阵，重抽一次守将避免连续两场相同
        if (
            (!this.attGeneral.get() || !this.defGeneral.get())
            && this.lastRandomPairKey
            && (`${attG.generalId}|${defG.generalId}` === this.lastRandomPairKey
                || `${defG.generalId}|${attG.generalId}` === this.lastRandomPairKey)
        ) {
            for (let tries = 0; tries < 12; tries++) {
                const alt = this.pickGeneral(defFac, null, { generalId: attG.generalId, factionId: attFactionId });
                if (alt && alt.generalId !== defG.generalId) {
                    defG = alt;
                    break;
                }
            }
        }
        if (defG.generalId === attG.generalId) { this.say('双方不能是同一位武将。', true); return; }
        const defFactionId = defFac ?? defG.factionId;
        if (defFactionId === attFactionId) {
            this.say(`双方势力相同（${this.fname(attFactionId)}），换一位武将或指定势力。`, true);
            return;
        }

        const { FIRST_BATTLE_MIN_TROOPS: lo, FIRST_BATTLE_MAX_TROOPS: hi } = GameConfig.COMBAT;
        const att: Side = { factionId: attFactionId, general: attG, troops: randInt(lo, hi) };
        const def: Side = { factionId: defFactionId, general: defG, troops: randInt(lo, hi) };

        this.app.live?.sealBetRound?.();
        this.clearWorldLegions();
        const switchedOn = this.forceTacticalOn();
        if (kind === 'siege') this.startSiege(att, def, city!);
        else this.startField(att, def);
        if (switchedOn) {
            console.info('[即时战斗] 调试面板的「战术模式」开关原来是关的，本页已临时打开（不改存档设置）');
        }
    }

    /** 与经典战起兵同一口径：武将本据点起兵（定文化编制）、精锐番号、立绘；再摆到战场 */
    private raiseLegion(side: Side, pos: { lat: number; lng: number }, fallbackCityId?: string): Army {
        const cm = this.app.cityManager;
        const lm = this.app.historicalEventManager.getLegionManager();
        const g = side.general;
        const home = (g.cityId ? cm.getCity(g.cityId) : undefined)
            ?? cm.getCitiesByFaction(side.factionId)[0]
            ?? (fallbackCityId ? cm.getCity(fallbackCityId) : undefined);
        const name = getCityEliteLegionName(home?.id ?? g.cityId, g.generalId) ?? `${g.generalName}部`;
        const army = lm.createLegion(pos, side.troops, side.factionId, name, undefined, undefined, home?.id, g.generalId, true);
        if (!army) throw new Error(`${g.generalName} 起兵失败`);
        army.setTroops(side.troops);
        army.isElite = true;
        army.name = name;
        const eliteCfg = getGeneralEliteConfig(g.generalId) ?? getFactionEliteConfig(side.general.factionId);
        if (eliteCfg) army.eliteOverride = eliteCfg;
        if (!army.generalId) army.generalId = g.generalId;
        const rec = getGeneralRecordByGeneralId(g.generalId);
        if (rec?.portrait) army.portraitPath = rec.portrait;
        else if (g.portrait) army.portraitPath = g.portrait;
        applyLegionCultureComposition(army, army.cultureRegion ?? undefined);
        const tag = army as Army & Record<string, unknown>;
        tag.__scriptPinned = true;        // 行为树不接管
        tag.isFirstBattleMarch = true;    // 剧情战口径：开战圈不并入第三方、行军不减兵
        tag.__quickBattle = true;         // 开打即进战术模式，不过进场门槛（GameAppCombatHooks.isQuickBattleUnit）
        return army;
    }

    private startSiege(att: Side, def: Side, city: City, classic?: ClassicBattleEntry): void {
        const cm = this.app.cityManager;
        const lm = this.app.historicalEventManager.getLegionManager();
        const saved = { id: city.id, factionId: city.factionId, troops: city.troops };
        cm.updateCity(city.id, { factionId: def.factionId, troops: def.troops }, { skipCaptureLog: true });
        const target = cm.getCity(city.id)!;
        (target as City & { _firstBattleDefenderGeneralId?: string })._firstBattleDefenderGeneralId = def.general.generalId;

        // 攻方摆在城西 → 战术画面里攻方在左
        const ring = Math.min(0.08, GameConfig.SIEGE.COMBAT_RADIUS * 0.6);
        const attacker = this.raiseLegion(att, { lat: target.latitude, lng: target.longitude - ring }, target.id);
        const tag = attacker as Army & Record<string, unknown>;
        tag.isFirstBattleHero = true;               // 攻城不并入第三方军团
        tag.firstBattleRole = 'attacker';
        tag.firstBattleTargetCityId = target.id;
        if (classic) {
            tag.firstBattleTitle = classic.fb.battleName;
            tag.classicBattleGeneralId = classic.key;
        } else {
            tag.__quickBattleRandom = true;
        }

        if (classic) {
            this.lastClassicKey = classic.key;
        } else {
            this.lastRandomPairKey = `${att.general.generalId}|${def.general.generalId}`;
        }
        this.lastBattleSpec = {
            mode: classic ? 'classic' : 'random',
            kind: 'siege',
            att: { ...att },
            def: { ...def },
            classic,
            cityId: target.id,
        };
        this.syncReplayButton();

        this.active = {
            kind: 'siege', attacker, defender: null, city: saved, att, def,
            placeName: classic ? classic.fb.battleName : target.name,
            classic,
            phase: 'engaging', startedAt: performance.now(),
        };
        this.focus(attacker, { lat: target.latitude, lng: target.longitude });
        this.app.timeSystem.setPaused(false);
        const r = lm.triggerSiege(attacker, target);
        if (r === 'skipped') throw new Error('引擎拒绝了这次攻城');
        this.announce();
    }

    private startField(
        att: Side,
        def: Side,
        classic?: ClassicBattleEntry,
        fixedSpot?: { att: { lat: number; lng: number }; def: { lat: number; lng: number }; label: string },
    ): void {
        const regionKey = (this.regionSel.get() as RegionType | null) ?? null;
        const spot = fixedSpot ?? (classic
            ? this.resolveClassicFieldSpot(classic)
            : this.pickFieldSpot(regionKey));
        if (!spot) throw new Error('该地域找不到可用的陆地战场');
        const fallbackCityId = classic?.fb.targetCityId;
        const attacker = this.raiseLegion(att, spot.att, fallbackCityId);
        const defender = this.raiseLegion(def, spot.def, fallbackCityId);
        const at = attacker as Army & Record<string, unknown>;
        const dt = defender as Army & Record<string, unknown>;
        at.isFirstBattleHero = true;
        at.firstBattleRole = 'attacker';
        at.forceFirstBattleField = true;            // 靠近据点也打野战，不转攻城
        at.firstBattlePairEnemyId = defender.id;     // 只和对方接战
        dt.isFirstBattleFieldEnemy = true;
        dt.firstBattlePairHeroId = attacker.id;
        if (classic) {
            at.firstBattleTitle = classic.fb.battleName;
            at.classicBattleGeneralId = classic.key;
            dt.firstBattleTitle = classic.fb.battleName;
            dt.classicBattleGeneralId = classic.key;
            this.lastClassicKey = classic.key;
        } else {
            at.__quickBattleRandom = true;
            dt.__quickBattleRandom = true;
            this.lastRandomPairKey = `${att.general.generalId}|${def.general.generalId}`;
        }
        this.lastBattleSpec = {
            mode: classic ? 'classic' : 'random',
            kind: 'field',
            att: { ...att },
            def: { ...def },
            classic,
            fieldSpot: spot,
        };
        this.syncReplayButton();

        this.active = {
            kind: 'field', attacker, defender, city: null, att, def,
            placeName: spot.label,
            classic,
            phase: 'engaging', startedAt: performance.now(),
        };
        this.focus(attacker, spot.att);
        this.app.timeSystem.setPaused(false);
        const defPos = defender.getPosition();
        attacker.moveAlongPath([{ lat: defPos.lat, lng: defPos.lng, sea: false }]);
        this.announce();
    }

    /** 经典战役野战坐标：按史实 targetLat/targetLng 落位；若恰贴海面则就近微调至陆地内侧以免误出海上图 */
    private resolveClassicFieldSpot(classic: ClassicBattleEntry): { att: { lat: number; lng: number }; def: { lat: number; lng: number }; label: string } {
        const { fb } = classic;
        const isLand = (p: { lat: number; lng: number }) => TerrainSpeedSystem.isLandAt(p);
        const RING_DIST = [0, 0.005, 0.015, 0.035, 0.08, 0.14, 0.20, 0.25];
        const seaNear = (p: { lat: number; lng: number }): boolean => {
            for (const d of RING_DIST) {
                for (let k = 0; k < 8; k++) {
                    const ang = (k * Math.PI) / 4;
                    if (!isLand({ lat: p.lat + d * Math.cos(ang), lng: p.lng + d * Math.sin(ang) })) return true;
                    if (d === 0) break;
                }
            }
            return false;
        };

        let mid = { lat: fb.targetLat, lng: fb.targetLng };
        const checkSpot = (m: { lat: number; lng: number }) => {
            const a = { lat: m.lat, lng: m.lng - 0.03 };
            const b = { lat: m.lat, lng: m.lng + 0.03 };
            return isLand(a) && isLand(b) && !seaNear(m);
        };

        if (!checkSpot(mid)) {
            let found: { lat: number; lng: number } | null = null;
            for (const r of [0.06, 0.12, 0.2, 0.3, 0.45, 0.6]) {
                for (let k = 0; k < 16; k++) {
                    const ang = (k * Math.PI * 2) / 16;
                    const cand = { lat: fb.targetLat + r * Math.sin(ang), lng: fb.targetLng + r * Math.cos(ang) };
                    if (checkSpot(cand)) {
                        found = cand;
                        break;
                    }
                }
                if (found) break;
            }
            if (!found && fb.targetCityId) {
                const c = this.app.cityManager.getCity(fb.targetCityId);
                if (c) found = { lat: c.latitude, lng: c.longitude };
            }
            if (found) mid = found;
        }

        return {
            att: { lat: mid.lat, lng: mid.lng - 0.03 },
            def: { lat: mid.lat, lng: mid.lng + 0.03 },
            label: `${fb.battleName}（${fb.targetName}）`,
        };
    }

    /** 野战战场：该地域随机一座据点附近的陆地；攻方在西、守方在东（战术画面左右） */
    private pickFieldSpot(region: RegionType | null): { att: { lat: number; lng: number }; def: { lat: number; lng: number }; label: string } | null {
        const cities = this.app.cityManager.getCities();
        const pool = region ? cities.filter((c) => getCityRegion(c) === region) : cities;
        const isLand = (p: { lat: number; lng: number }) => TerrainSpeedSystem.isLandAt(p);
        const RING_DIST = [0, 0.005, 0.015, 0.035, 0.08, 0.14, 0.20, 0.25];
        const seaNear = (p: { lat: number; lng: number }): boolean => {
            for (const d of RING_DIST) {
                for (let k = 0; k < 8; k++) {
                    const ang = (k * Math.PI) / 4;
                    if (!isLand({ lat: p.lat + d * Math.cos(ang), lng: p.lng + d * Math.sin(ang) })) return true;
                    if (d === 0) break;
                }
            }
            return false;
        };
        const cm = this.app.cityManager;
        const minGapSteps = [0.5, 0.4, 0.3];
        for (const minGap of minGapSteps) {
            for (let tries = 0; tries < 150; tries++) {
                const c = rand(pool);
                if (!c) return null;
                const ang = Math.random() * Math.PI * 2;
                const d = minGap + Math.random() * 0.6;
                const mid = { lat: c.latitude + Math.sin(ang) * d, lng: c.longitude + Math.cos(ang) * d };
                const a = { lat: mid.lat, lng: mid.lng - 0.03 };
                const b = { lat: mid.lat, lng: mid.lng + 0.03 };
                if (!isLand(a) || !isLand(b) || seaNear(mid)) continue;
                const near = cm.getNearestCity(null, { latitude: mid.lat, longitude: mid.lng });
                if (near && Math.hypot(near.latitude - mid.lat, near.longitude - mid.lng) < minGap) continue;
                const rname = CULTURE_NAMES[getCityRegion(c)] ?? '';
                return { att: a, def: b, label: `${c.name}一带野外（${rname}）` };
            }
        }
        return null;
    }

    private focus(army: Army, at: { lat: number; lng: number }): void {
        const hero = this.app.playerHero;
        if (hero?.getHostLegionId()) {
            try { hero.detach(); } catch (e) { console.warn('[即时战斗] 探马者离队失败', e); }
        }
        try { this.app.audioManager?.unlock?.(); } catch { /* ignore */ }
        try { this.app.audioManager?.setGamePaused?.(false); } catch { /* ignore */ }
        try { this.app.combatUI?.setPortraitMinimized?.(false); } catch { /* ignore */ }
        try { this.app.cameraFollowUI?.setFollow(army.id, army.name); } catch { /* 镜头失败不影响开战 */ }
        try { this.app.map.getLeafletMap().setView([at.lat, at.lng], 9, { animate: false }); } catch { /* 同上 */ }
    }

    private releaseHero(): void {
        const hero = this.app.playerHero;
        if (!hero?.getHostLegionId()) return;
        try { hero.detach(); } catch (e) { console.warn('[即时战斗] 探马者离队失败', e); }
    }

    private announce(): void {
        const a = this.active!;
        const c = a.classic;
        const kindLabel = c ? c.kindLabel : (a.kind === 'siege' ? '攻城战' : '野战');
        const attFac = a.att.displayFactionName ?? this.fname(a.att.factionId);
        const defFac = a.def.displayFactionName ?? this.fname(a.def.factionId);
        this.say(`${kindLabel}·${a.placeName}：${attFac} ${a.att.general.generalName}（${a.att.troops}）vs ${defFac} ${a.def.general.generalName}（${a.def.troops}）`);
        this.panel.classList.add('qb-hidden');
        this.backdrop.setBattleBriefCard(this.buildBackdropBriefHtml(a));
        this.backdrop.say('正在进入战术模式…');
    }

    /** 本场在引擎里的战场（区域战优先，其次 1v1） */
    private findEngineBattle(a: ActiveBattle) {
        const ids = [a.attacker.id, ...(a.defender ? [a.defender.id] : [])];
        const cs = this.app.combatSystem;
        const field = cs.getActiveBattleFields().find((bf) => !bf.isOver && ids.some((id) => bf.hasParticipant(id)));
        const duel = field ? undefined : cs.getActiveBattles().find((b) => !b.isOver && ids.some((id) => b.attacker.id === id || b.defender.id === id));
        return { field, duel };
    }

    /** 开打了却没进战术画面：按援军赶到同一条路，把开战入口对这一仗再调一次 */
    private retryEnter(a: ActiveBattle): void {
        const cs = this.app.combatSystem;
        const { field, duel } = this.findEngineBattle(a);
        try {
            if (field) {
                const att = field.getAttackerUnits();
                const def = field.getDefenderUnits();
                const title = a.classic?.fb.battleName
                    ?? field.customTitle
                    ?? (field.type === 'siege' ? `${a.placeName} 攻防战` : `${this.fname(a.att.factionId)} 大战 ${this.fname(a.def.factionId)}`);
                cs.onRegionalBattleStart?.(att, def, undefined, undefined, title, '', false, field);
            } else if (duel) {
                cs.onBattleStart?.(duel);
            }
        } catch (e) {
            console.error('[即时战斗] 补调开战入口失败', e);
        }
    }

    // ── 战况跟踪与收尾 ──

    private warActive(): boolean {
        return this.app.scene13War?.isActive?.() === true || this.app.battleScene?.isActive?.() === true;
    }

    private keepSceneClock(): void {
        if (!this.warActive()) return;
        try { this.app.audioManager?.setGamePaused?.(false); } catch { /* ignore */ }
        if (this.app.battleScene?.isStrategyPausedByScene?.() !== true) return;
        const ts = this.app.timeSystem;
        if (ts.isGamePaused()) return;
        ts.setPaused(true);
        const a = this.active;
        this.report('reTakePause', a);
        console.warn('[即时战斗] 战术演出期间暂停被解开，已按回场景接管态（否则战术层不 tick、画面会卡在载入）');
    }

    private watch(): void {
        const a = this.active;
        if (!a) {
            this.clearWorldLegions();
            return;
        }
        this.keepSceneClock();
        this.clearWorldLegions(new Set([a.attacker, ...(a.defender ? [a.defender] : [])]));
        if (a.phase === 'engaging') {
            if (this.warActive()) {
                a.phase = 'fighting';
                this.report('entered', a, { afterMs: Math.round(performance.now() - a.startedAt), retried: !!a.retried });
                return;
            }
            if (this.battleStillRunning(a)) {
                a.engineStartedAt ??= performance.now();
                const waited = performance.now() - a.engineStartedAt;
                if (waited > 1200 && !a.retried) {
                    a.retried = true;
                    this.report('retry', a);
                    this.retryEnter(a);
                } else if (waited > 4000) {
                    const why = this.diagnose(a);
                    console.warn('[即时战斗] 开打了但没进战术画面：', why);
                    this.report('stuck', a, { why });
                    this.say(`⚠ 这一仗已经开打，但没进战术画面：${why}。已收场，可以重来。`, true);
                    this.finish(false);
                }
                return;
            }
            if (performance.now() - a.startedAt > 45_000) {
                const err = this.lastError && this.lastError.at >= a.startedAt ? `（开战后最近一条报错：${this.lastError.text}）` : '';
                this.report('noContact', a);
                this.say(`⚠ 45 秒内两军没接上战${err}。已收场，可以重来。`, true);
                this.finish(false);
            }
            return;
        }
        if (!this.warActive()) { this.finish(true); return; }
        if (!a.visibleAt && this.app.scene13War?.entryFadePending !== true) {
            a.visibleAt = performance.now();
            this.report('visible', a, { afterMs: Math.round(a.visibleAt - a.startedAt) });
        }
        if (!a.timedOut && a.visibleAt && this.battleStillRunning(a)
            && performance.now() - a.visibleAt > QuickBattle.ROUND_LIMIT_MS) {
            this.endByTimeLimit(a);
            return;
        }
        if (!this.battleStillRunning(a)) {
            a.resolvedAt ??= performance.now();
            const waited = performance.now() - a.resolvedAt;
            if (!a.lingerKicked) {
                a.lingerKicked = true;
                this.app.battleScene?.beginLingerAfterDefeat();
            } else if (waited > 20000) {
                try { this.app.scene13War?.stop('即时战斗收场'); } catch { /* 收场失败也要退出 */ }
                try { this.app.battleScene?.exit(); } catch { /* 同上 */ }
            }
        }
    }

    /** 开打了却没进战术画面：逐条查是哪一关没过 */
    private diagnose(a: ActiveBattle): string {
        const reasons: string[] = [];
        const chk = tacticalCheckbox();
        if (chk && !chk.checked) reasons.push('调试面板「战术模式」开关是关的');
        const ids = [a.attacker.id, ...(a.defender ? [a.defender.id] : [])];
        const cs = this.app.combatSystem;
        const frozen = cs.getActiveBattleFields().some((bf) => bf.scene13Frozen && ids.some((id) => bf.hasParticipant(id)))
            || cs.getActiveBattles().some((b) => b.scene13Frozen && ids.some((id) => b.attacker.id === id || b.defender.id === id));
        reasons.push(frozen ? '游戏已判定进战术模式，但战术画面没启动起来' : '开战入口没有接手这一仗');
        if (this.lastError && this.lastError.at >= a.startedAt) reasons.push(`开战后最近一条报错：${this.lastError.text}`);
        return reasons.join('；');
    }

    /** 引擎里这一仗是否还没结算（区域战 / 1v1 任一还挂着本场军团） */
    private battleStillRunning(a: ActiveBattle): boolean {
        const ids = [a.attacker.id, ...(a.defender ? [a.defender.id] : [])];
        const cs = this.app.combatSystem;
        return cs.getActiveBattleFields().some((bf) => !bf.isOver && ids.some((id) => bf.hasParticipant(id)))
            || cs.getActiveBattles().some((b) => !b.isOver && ids.some((id) => b.attacker.id === id || b.defender.id === id));
    }

    /** 本局的赢家（下注结算用）：攻城看据点归谁，野战看谁还活着，都没了算和 */
    private resultSide(a: ActiveBattle): 'att' | 'def' | 'draw' {
        if (a.kind === 'siege') {
            const owner = this.app.cityManager.getCity(a.city!.id)?.factionId;
            return owner === a.att.factionId ? 'att' : 'def';
        }
        const attAlive = !a.attacker.isDestroyed && a.attacker.getTroops() > 0;
        const defAlive = !!a.defender && !a.defender.isDestroyed && a.defender.getTroops() > 0;
        if (attAlive && !defAlive) return 'att';
        if (defAlive && !attAlive) return 'def';
        return 'draw';
    }

    private endByTimeLimit(a: ActiveBattle): void {
        const prevClassicKey = a.classic?.key;
        a.timedOut = true;
        this.report('timeout', a, { limitMs: QuickBattle.ROUND_LIMIT_MS });
        this.app.live?.settleBetRound?.('draw');
        try { this.app.scene13War?.stop('本局时间到'); } catch { /* 收场失败也要退出 */ }
        try { if (this.app.battleScene?.isActive?.()) this.app.battleScene.exit(); } catch { /* 同上 */ }
        this.cleanup();
        if (this.mode === 'classic') this.pickRandomClassic(prevClassicKey);
        else this.pickRandomCustomPreview();
        this.say(`本局时间到（${Math.round(QuickBattle.ROUND_LIMIT_MS / 60_000)} 分钟）未分胜负，算和。${QuickBattle.AUTO_NEXT_SEC} 秒内可以重选，到时自动开下一局。`);
        this.backdrop.setBattleBriefCard(null);
        this.backdrop.say('');
        this.panel.classList.remove('qb-hidden');
        this.app.live?.beginBetRound?.();
        this.startCountdown();
    }

    private finish(fought: boolean): void {
        const a = this.active;
        if (!a) return;
        const prevClassicKey = a.classic?.key;
        let result = '';
        if (fought) {
            const attAlive = !a.attacker.isDestroyed && a.attacker.getTroops() > 0;
            if (a.kind === 'siege') {
                const owner = this.app.cityManager.getCity(a.city!.id)?.factionId;
                result = owner === a.att.factionId ? `攻方 ${a.att.general.generalName} 攻下了 ${a.placeName}` : `守方 ${a.def.general.generalName} 守住了 ${a.placeName}`;
            } else {
                const defAlive = !!a.defender && !a.defender.isDestroyed && a.defender.getTroops() > 0;
                result = attAlive && !defAlive ? `攻方 ${a.att.general.generalName} 胜`
                    : defAlive && !attAlive ? `守方 ${a.def.general.generalName} 胜` : '胜负未分';
            }
            this.app.live?.settleBetRound?.(this.resultSide(a));
        }
        if (fought) this.report('finished', a, { result });
        this.cleanup();
        if (this.mode === 'classic') {
            this.pickRandomClassic(prevClassicKey);
        } else {
            this.pickRandomCustomPreview();
        }
        if (fought) this.say(`上一仗结果：${result}。${QuickBattle.AUTO_NEXT_SEC} 秒内可以重选，到时自动开下一局。`);
        this.backdrop.setBattleBriefCard(null);
        this.backdrop.say('');
        this.panel.classList.remove('qb-hidden');
        if (!fought) this.app.live?.refundBetRound?.();
        this.app.live?.beginBetRound?.();
        this.startCountdown();
    }

    /** 撤掉本场军团、还原据点、暂停 */
    private cleanup(): void {
        const a = this.active;
        this.active = null;
        this.app.timeSystem.setPaused(true);
        this.releaseHero();
        this.clearWorldLegions();
        if (a?.city) {
            const cm = this.app.cityManager;
            cm.updateCity(a.city.id, { factionId: a.city.factionId, troops: a.city.troops }, { skipCaptureLog: true });
            const c = cm.getCity(a.city.id) as (City & Record<string, unknown>) | undefined;
            if (c) {
                delete c._firstBattleDefenderGeneralId;
                delete c._firstBattleLockedForHero;
            }
        }
    }
}

const PANEL_CSS = `
#quick-battle-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:20050;width:min(1080px,95vw);max-height:94vh;overflow-y:auto;
  background:rgba(18,16,12,.96);border:1px solid #b08d4a;border-radius:12px;padding:16px 22px;color:#eadfc8;
  font-family:'Noto Serif SC',serif;box-shadow:0 12px 48px rgba(0,0,0,.75)}
#quick-battle-panel.qb-hidden{display:none}
#quick-battle-panel .qb-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px;border-bottom:1px solid rgba(176,141,74,.28);padding-bottom:10px}
#quick-battle-panel .qb-title{font-size:22px;font-weight:700;letter-spacing:4px;color:#f3d48a}
#quick-battle-panel .qb-mode-tabs{display:flex;gap:8px}
#quick-battle-panel .qb-mode-tabs button{padding:7px 18px;border-radius:6px;background:#241e14;border:1px solid #6b5a38;color:#d8c49a;cursor:pointer;font-size:15px;font-weight:600;transition:all .15s}
#quick-battle-panel .qb-mode-tabs button.qb-on{background:linear-gradient(180deg,#9c7428,#6e4f16);color:#fff;border-color:#f0ca78;box-shadow:0 0 12px rgba(240,202,120,.3)}

#quick-battle-panel .qb-classic-bar{background:rgba(255,255,255,.03);border:1px solid rgba(176,141,74,.25);border-radius:8px;padding:10px 12px;margin-bottom:12px}
#quick-battle-panel .qb-classic-filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
#quick-battle-panel .qb-classic-filters button{padding:4px 12px;border-radius:4px;background:#1e1911;border:1px solid #594a2e;color:#c7b48b;cursor:pointer;font-size:13px}
#quick-battle-panel .qb-classic-filters button.qb-on{background:#7a5c22;color:#fff;border-color:#e0bb6a}
#quick-battle-panel .qb-classic-pick-row{display:flex;align-items:flex-end;gap:10px}
#quick-battle-panel .qb-classic-pick-row .qb-field{flex:1;margin-bottom:0}
#quick-battle-panel .qb-rand-classic-btn{padding:8px 16px;border-radius:6px;background:#3a2d18;border:1px solid #a88642;color:#f3d48a;cursor:pointer;font-size:14px;font-weight:600;white-space:nowrap;height:36px}
#quick-battle-panel .qb-rand-classic-btn:hover{background:#523f21}

#quick-battle-panel .qb-meta-card{background:linear-gradient(180deg,rgba(42,34,22,.85),rgba(24,20,14,.9));border:1px solid rgba(196,158,84,.42);border-radius:8px;padding:11px 14px;margin-bottom:12px}
#quick-battle-panel .qb-meta-head{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:7px}
#quick-battle-panel .qb-meta-badge{display:inline-block;padding:2px 9px;border-radius:4px;font-size:12px;font-weight:700;background:#7a3b1e;color:#ffd9b3;border:1px solid #d48455}
#quick-battle-panel .qb-badge-field{background:#2d5236;color:#d6f5dc;border-color:#68a878}
#quick-battle-panel .qb-badge-siege_attack{background:#6e2820;color:#ffd4cc;border-color:#d46a5a}
#quick-battle-panel .qb-badge-siege_defend{background:#244466;color:#cce6ff;border-color:#5a94d4}
#quick-battle-panel .qb-badge-random{background:#4f3d66;color:#e8d9ff;border-color:#9678bd}
#quick-battle-panel .qb-meta-battle-title{font-size:18px;font-weight:700;color:#f7dfa0;letter-spacing:1px;margin-right:6px}
#quick-battle-panel .qb-meta-Chip{font-size:13px;color:#d4c39e;background:rgba(0,0,0,.35);padding:3px 9px;border-radius:4px;border:1px solid rgba(176,141,74,.22)}
#quick-battle-panel .qb-meta-Chip b{color:#fff3d1}
#quick-battle-panel .qb-meta-bg{font-size:14px;line-height:1.65;color:#e8dec8;background:rgba(0,0,0,.28);padding:8px 11px;border-radius:6px;border-left:3px solid #c9a050}
#quick-battle-panel .qb-meta-bg-label{color:#f3d48a;font-weight:700}

#quick-battle-panel .qb-body{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
#quick-battle-panel .qb-body.qb-classic-dual{grid-template-columns:1fr 1fr}
#quick-battle-panel .qb-side,#quick-battle-panel .qb-mid{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:12px}
#quick-battle-panel .qb-side-title{font-size:16px;font-weight:700;margin-bottom:8px}
#quick-battle-panel .qb-att .qb-side-title{color:#ff9b8a}
#quick-battle-panel .qb-def .qb-side-title{color:#8ac4ff}
#quick-battle-panel .qb-mid-title{color:#e6c983}

#quick-battle-panel .qb-portrait-card{display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.38);border:1px solid rgba(176,141,74,.32);border-radius:8px;padding:9px 11px;margin-bottom:8px}
#quick-battle-panel .qb-portrait-wrap{width:72px;height:90px;flex-shrink:0;border-radius:6px;overflow:hidden;border:1px solid #b8934b;background:#1a1610;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.5)}
#quick-battle-panel .qb-portrait-empty span{font-size:28px;opacity:.65}
#quick-battle-panel .qb-portrait-img{width:100%;height:100%;object-fit:cover;display:block}
#quick-battle-panel .qb-portrait-meta{flex:1;min-width:0}
#quick-battle-panel .qb-p-name{font-size:17px;font-weight:700;color:#fff2d6;margin-bottom:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
#quick-battle-panel .qb-p-hero-badge{font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px;background:linear-gradient(180deg,#b88928,#7d5910);color:#fff8dc;border:1px solid #f5d27a}
#quick-battle-panel .qb-p-tag{font-size:11px;font-weight:600;padding:1px 6px;border-radius:4px;background:rgba(255,255,255,.1);color:#cbbba0}
#quick-battle-panel .qb-p-line{font-size:13px;color:#d6c7a9;line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#quick-battle-panel .qb-p-line span{color:#9e8e6e}
#quick-battle-panel .qb-p-line b{color:#f5dfb0}

#quick-battle-panel .qb-field{position:relative;margin-bottom:9px}
#quick-battle-panel .qb-cap{font-size:12px;color:#b9a988;margin-bottom:3px}
#quick-battle-panel .qb-row{display:flex;gap:4px}
#quick-battle-panel input{flex:1;min-width:0;background:#0d0c0a;border:1px solid #6b5a38;color:#f5ead2;border-radius:5px;padding:7px 9px;font-size:14px;font-family:inherit}
#quick-battle-panel .qb-clear{background:#2a2419;border:1px solid #6b5a38;color:#d8c49a;border-radius:5px;width:30px;cursor:pointer}
#quick-battle-panel .qb-list{display:none;position:absolute;left:0;right:0;top:100%;z-index:30;max-height:320px;overflow:auto;background:#14120e;border:1px solid #8a7444;border-radius:5px;margin-top:2px;box-shadow:0 8px 24px rgba(0,0,0,.7)}
#quick-battle-panel .qb-opt{padding:6px 9px;cursor:pointer;display:flex;justify-content:space-between;gap:8px;font-size:13.5px}
#quick-battle-panel .qb-opt small{color:#9a8b6c;font-size:12px;white-space:nowrap}
#quick-battle-panel .qb-opt:hover,#quick-battle-panel .qb-opt.qb-on{background:#3a3020}
#quick-battle-panel .qb-more{padding:5px 9px;font-size:12px;color:#8a7c60}
#quick-battle-panel .qb-kind{display:flex;gap:6px;margin-bottom:10px}
#quick-battle-panel button{font-family:inherit}
#quick-battle-panel .qb-kind button{flex:1;padding:7px 0;background:#2a2419;border:1px solid #6b5a38;color:#d8c49a;border-radius:5px;cursor:pointer;font-size:14px}
#quick-battle-panel .qb-kind button.qb-on{background:#8a6a2c;color:#fff;border-color:#e0bb6a}
#quick-battle-panel .qb-rand-custom-btn{width:100%;padding:7px 10px;margin-top:4px;border-radius:5px;background:#332818;border:1px solid #7d6536;color:#ead49c;cursor:pointer;font-size:13px}
#quick-battle-panel .qb-rand-custom-btn:hover{background:#463720}
#quick-battle-panel .qb-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:14px}
#quick-battle-panel .qb-actions button{padding:8px 20px;border-radius:6px;cursor:pointer;font-size:15px;background:#2a2419;border:1px solid #6b5a38;color:#d8c49a}
#quick-battle-panel .qb-actions button:disabled{opacity:.42;cursor:not-allowed}
#quick-battle-panel .qb-actions .qb-replay{border-color:#9e7d3b;color:#f3d48a}
#quick-battle-panel .qb-actions .qb-go{background:#9a2f22;border-color:#e07a5a;color:#fff;font-weight:700;padding:8px 36px}
#quick-battle-panel .qb-status{margin-top:10px;text-align:center;font-size:13.5px;color:#cdbf9f;min-height:18px}
#quick-battle-panel .qb-status.qb-warn{color:#ffb366}

#quick-battle-backdrop .qb-loading-card{background:rgba(20,17,12,.92);border:1px solid #b08d4a;border-radius:10px;padding:18px 22px;color:#eadfc8;font-family:'Noto Serif SC',serif;box-shadow:0 10px 36px rgba(0,0,0,.65)}
#quick-battle-backdrop .qb-loading-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
#quick-battle-backdrop .qb-loading-title{font-size:22px;font-weight:700;color:#f3d48a;letter-spacing:2px}
#quick-battle-backdrop .qb-loading-sub{display:flex;flex-wrap:wrap;gap:16px;font-size:14px;color:#d4c39e;margin-bottom:14px}
#quick-battle-backdrop .qb-loading-sub b{color:#fff3d1}
#quick-battle-backdrop .qb-loading-vs{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}
#quick-battle-backdrop .qb-loading-hero{flex:1;display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.4);border:1px solid rgba(176,141,74,.32);border-radius:8px;padding:10px}
#quick-battle-backdrop .qb-loading-hero img{width:64px;height:80px;object-fit:cover;border-radius:5px;border:1px solid #b8934b;background:#1a1610;flex-shrink:0}
#quick-battle-backdrop .qb-lh-role{font-size:12px;color:#bfa97a}
#quick-battle-backdrop .qb-lh-att .qb-lh-role{color:#ff9b8a}
#quick-battle-backdrop .qb-lh-def .qb-lh-role{color:#8ac4ff}
#quick-battle-backdrop .qb-lh-name{font-size:18px;font-weight:700;color:#fff2d6;margin:2px 0}
#quick-battle-backdrop .qb-lh-meta{font-size:12px;color:#c9ba9b}
#quick-battle-backdrop .qb-loading-vs-tag{font-size:20px;font-weight:800;color:#e0b458;padding:0 4px}
#quick-battle-backdrop .qb-loading-bg{font-size:14px;line-height:1.65;color:#e8dec8;background:rgba(0,0,0,.32);padding:10px 12px;border-radius:6px;border-left:3px solid #c9a050}
`;

function appReady(app: GameApp): boolean {
    const a = app as unknown as Record<string, unknown>;
    return !!(app.cityManager && app.combatSystem && app.historicalEventManager
        && a.aiController && a.recruitmentSystem && app.cameraFollowUI && a.saveManager);
}

/** 等游戏本体初始化完（军团管理器、战斗钩子都就位）再挂面板；从一打开就用深色底盖住战略地图 */
export function startQuickBattleMode(app: GameApp): void {
    document.title = 'MAPWAR·即时战斗';
    const backdrop = new Backdrop();
    backdrop.say('即时战斗：等游戏加载完…');
    const t0 = performance.now();
    const timer = setInterval(() => {
        if (!appReady(app)) {
            if (performance.now() - t0 > 120_000) backdrop.say('即时战斗：游戏两分钟还没加载完，请刷新页面');
            return;
        }
        clearInterval(timer);
        try {
            // 先解除百岁/剧本年份闸门，再采集武将（否则开局默认百岁前 800 年会把未登场名将名字改称「XX将军」）
            if (app.playerHero) (app.playerHero as unknown as Record<string, unknown>).autoPlan = 'melee';
            setGameModeProvider(() => 'melee');
            setCentenarianYearProvider(() => null);
            setScriptYearProvider(() => null);
            setWonderGateYearProvider(() => null);
            (app as unknown as { syncCityFoundedTypes?: () => void }).syncCityFoundedTypes?.();

            const qb = new QuickBattle(app, backdrop);
            qb.init();
            (window as unknown as { quickBattle?: QuickBattle }).quickBattle = qb;
        } catch (e) {
            console.error('[即时战斗] 面板初始化失败', e);
            backdrop.say(`即时战斗初始化失败：${e instanceof Error ? e.message : String(e)}`);
        }
    }, 300);
}
