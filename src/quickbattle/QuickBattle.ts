/**
 * 即时战斗（2026-11-05 主人令）
 *
 * 「把项目中的战术模式单独运行，左右对战，可以选择双方势力、武将，可以选择攻城战还是野战，
 *   攻城战可以选择据点，野战可以选择地域。选择要带搜索功能，不选就是随机。总之和战术模式一模一样。」
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
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { getCityEliteLegionName } from '../data/ExpeditionLegions';
import { applyLegionCultureComposition } from '../types/CultureFormations';
import { CULTURE_NAMES, getCityRegion, type RegionType } from '../systems/RegionSystem';
import { TerrainSpeedSystem } from '../core/TerrainSpeedSystem';
import { GameConfig } from '../config/GameConfig';
import { releaseDeploy } from '../legion/DeployGate';

// ───────────────────────────── 数据 ─────────────────────────────

interface GeneralItem {
    generalId: string;
    generalName: string;
    factionId: string;
    cityId?: string;
    portrait: string;
}

type BattleKind = 'siege' | 'field';

const CITY_TYPE_LABEL: Record<string, string> = {
    big_city: '大城', medium_city: '中城', small_city: '小城', pass: '险要', stockade: '城寨',
};

function rand<T>(arr: readonly T[]): T | undefined {
    return arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;
}

function randInt(lo: number, hi: number): number {
    return Math.round(lo + Math.random() * (hi - lo));
}

/** 全部可上战术模式的武将：有武将档案（否则武将技不触发）、不是叛军 */
function collectGenerals(): GeneralItem[] {
    const seen = new Set<string>();
    const out: GeneralItem[] = [];
    for (const f of FACTIONS) {
        if (f.id === 'panshu') continue;
        for (const g of getFactionGeneralsResolved(f.id) as FactionGeneral[]) {
            if (!g.generalId || seen.has(g.generalId)) continue;
            if (!getGeneralProfile(g.generalId)) continue;
            seen.add(g.generalId);
            out.push({
                generalId: g.generalId,
                generalName: g.generalName,
                factionId: (g as { factionId?: string }).factionId ?? f.id,
                cityId: g.cityId,
                portrait: g.portrait,
            });
        }
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
    onChange: ((v: string | null) => void) | null = null;

    constructor(label: string) {
        this.root = document.createElement('div');
        this.root.className = 'qb-field';
        const cap = document.createElement('div');
        cap.className = 'qb-cap';
        cap.textContent = label;
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.placeholder = '不选＝随机（可输入搜索）';
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

    setOptions(opts: Opt[]): void {
        this.options = opts;
        if (this.value !== null && !opts.some((o) => o.value === this.value)) this.set(null);
    }

    get(): string | null { return this.value; }

    set(v: string | null): void {
        this.commit(v);
        this.input.value = this.labelOf(v);
    }

    private commit(v: string | null): void {
        if (v === this.value) return;
        this.value = v;
        this.onChange?.(v);
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
        const MAX = 80;
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

interface Side { factionId: string; general: GeneralItem; troops: number }

interface ActiveBattle {
    kind: BattleKind;
    attacker: Army;
    defender: Army | null;
    city: { id: string; factionId: string; troops: number } | null;
    att: Side;
    def: Side;
    placeName: string;
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

/** 盖住战略地图的深色底：即时战斗里只看得到选人面板和战术画面 */
class Backdrop {
    readonly el: HTMLDivElement;
    private readonly msg: HTMLDivElement;
    constructor() {
        this.el = document.createElement('div');
        this.el.id = 'quick-battle-backdrop';
        // z-index 在战术画布（400）与各 HUD 之上、即时战斗面板（20050）之下；打仗时整块隐藏
        this.el.style.cssText = 'position:fixed;inset:0;z-index:20040;display:flex;align-items:center;justify-content:center;'
            + 'background:radial-gradient(ellipse at center,#2a2216 0%,#0d0b08 70%);';
        this.msg = document.createElement('div');
        this.msg.style.cssText = 'color:#f3d48a;font:600 20px "Noto Serif SC",serif;letter-spacing:2px;text-align:center;padding:0 24px';
        this.el.appendChild(this.msg);
        document.body.appendChild(this.el);
    }
    show(v: boolean): void {
        const d = v ? 'flex' : 'none';
        if (this.el.style.display !== d) this.el.style.display = d;
    }
    say(text: string): void { this.msg.textContent = text; }
}

/** 战术模式开关（调试面板 chk-tactical-mode）：GameAppCombatHooks.tacticalModeOn 每次开战都读它 */
function tacticalCheckbox(): HTMLInputElement | null {
    return document.getElementById('chk-tactical-mode') as HTMLInputElement | null;
}

class QuickBattle {
    private readonly generals: GeneralItem[];
    private readonly generalById: Map<string, GeneralItem>;
    private readonly factionName = new Map<string, string>();
    private panel!: HTMLDivElement;
    private status!: HTMLDivElement;
    private attFaction!: SearchSelect;
    private attGeneral!: SearchSelect;
    private defFaction!: SearchSelect;
    private defGeneral!: SearchSelect;
    private citySel!: SearchSelect;
    private regionSel!: SearchSelect;
    private kind: 'random' | BattleKind = 'random';
    private active: ActiveBattle | null = null;
    /** 最近一条报错（开打却没进战术画面时，面板上直接写出来） */
    private lastError: { at: number; text: string } | null = null;

    constructor(private readonly app: GameApp, private readonly backdrop: Backdrop) {
        this.generals = collectGenerals();
        this.generalById = new Map(this.generals.map((g) => [g.generalId, g]));
        for (const f of FACTIONS) this.factionName.set(f.id, f.name);
    }

    init(): void {
        this.quietWorld();
        this.clearWorldLegions();
        this.captureErrors();
        this.buildPanel();
        this.backdrop.say('');
        // 打开页面第一次出选择画面也倒计时 30 秒自动开局（主人：「不是让你设计30秒开局吗」）
        this.say(`${QuickBattle.AUTO_NEXT_SEC} 秒内可以选择，到时自动开局（不选＝随机）。`);
        this.startCountdown();
        // 🔴 [2026-11-07] 下注窗口就在这 30 秒里开着（回到选择画面即开窗，开战封盘）
        this.app.live?.beginBetRound?.();
        setInterval(() => this.watch(), 400);
        // 遮罩跟着战术画面走：选人、等进场、战术素材载入中、收场都盖住战略地图；战术画面开始淡入才撤。
        // 🔴 战术画布进场先全透明，等第一帧真正画出来（最多 10 秒）才淡入（Scene13WarLayer.entryFadePending）；
        //    只看「战术模式激活」就撤遮罩，载入这几秒露出的就是战略地图（2026-11-05 主人：「又回到战略了」）。
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
     * 🔴 调试面板会把开关状态存进 localStorage（mapwar.debugPanel.options），平时关过一次就一直是关的；
     *    GameAppCombatHooks.tacticalModeOn 每场仗都直接读这个勾选 → 开打了也只在战略地图上打（2026-11-05 主人实机卡住）。
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

    /** 只留这一仗：停 AI 寻敌、募兵、玩家乱入者与任务跟踪 */
    private quietWorld(): void {
        const app = this.app as unknown as Record<string, { update?: unknown; tick?: unknown } | null>;
        const noop = () => { /* 即时战斗：停用 */ };
        if (app.aiController) app.aiController.update = noop;
        if (app.recruitmentSystem) {
            app.recruitmentSystem.update = noop;
            // 开局首发（点播放时错峰分批生成）也停：标记已做 + 入口置空
            (this.app.recruitmentSystem as unknown as { markInitialSpawnDone?: () => void }).markInitialSpawnDone?.();
            (app.recruitmentSystem as Record<string, unknown>).runInitialSpawn = noop;
        }
        if (app.playerHero) app.playerHero.update = noop;
        if (app.playerQuests) app.playerQuests.tick = noop;
        releaseDeploy();   // 开局集结待命（只闸移动）也放掉，野战两军不被拦在原地
        this.app.timeSystem.setPaused(true);
    }

    /** 撤掉地图上的军团；keep 里的（本场双方）不动。开局首发是 setTimeout 错峰生成的，开战后还可能冒出来，watch 里持续清 */
    private clearWorldLegions(keep?: ReadonlySet<Army>): void {
        const lm = this.app.historicalEventManager.getLegionManager();
        for (const a of [...lm.getArmies()]) {
            if (a.isDestroyed || keep?.has(a)) continue;
            if (keep && a.getIsInCombat()) continue;   // 开战中别动正在打的单位
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
        p.innerHTML = `<div class="qb-title">即时战斗</div>`;
        this.panel = p;

        const facOpts: Opt[] = FACTIONS
            .filter((f) => this.generals.some((g) => g.factionId === f.id))
            .map((f) => ({ value: f.id, label: f.name, sub: f.id, search: `${f.name} ${f.id}`.toLowerCase() }));

        const mkSide = (title: string, cls: string): [SearchSelect, SearchSelect, HTMLDivElement] => {
            const box = document.createElement('div');
            box.className = `qb-side ${cls}`;
            box.innerHTML = `<div class="qb-side-title">${title}</div>`;
            const fac = new SearchSelect('势力');
            const gen = new SearchSelect('武将');
            fac.setOptions(facOpts);
            const refreshGen = () => gen.setOptions(this.generalOptions(fac.get()));
            fac.onChange = refreshGen;
            refreshGen();
            box.append(fac.root, gen.root);
            return [fac, gen, box];
        };
        const [af, ag, attBox] = mkSide('攻方（左）', 'qb-att');
        const [df, dg, defBox] = mkSide('守方（右）', 'qb-def');
        this.attFaction = af; this.attGeneral = ag; this.defFaction = df; this.defGeneral = dg;

        const mid = document.createElement('div');
        mid.className = 'qb-mid';
        const kindRow = document.createElement('div');
        kindRow.className = 'qb-kind';
        const kinds: [typeof this.kind, string][] = [['random', '随机'], ['siege', '攻城战'], ['field', '野战']];
        for (const [k, label] of kinds) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.dataset.kind = k;
            b.addEventListener('click', () => { this.kind = k; this.syncKind(); });
            kindRow.appendChild(b);
        }
        this.citySel = new SearchSelect('据点（攻城战）');
        this.citySel.setOptions(this.cityOptions());
        this.regionSel = new SearchSelect('地域（野战）');
        this.regionSel.setOptions(this.regionOptions());
        mid.append(kindRow, this.citySel.root, this.regionSel.root);

        const body = document.createElement('div');
        body.className = 'qb-body';
        body.append(attBox, mid, defBox);

        const actions = document.createElement('div');
        actions.className = 'qb-actions';
        const go = document.createElement('button');
        go.type = 'button';
        go.className = 'qb-go';
        go.textContent = '⚔ 开战';
        go.addEventListener('click', () => this.launch());
        this.goBtn = go;
        const reset = document.createElement('button');
        reset.type = 'button';
        reset.textContent = '全部清空（随机）';
        reset.addEventListener('click', () => {
            for (const s of [this.attFaction, this.attGeneral, this.defFaction, this.defGeneral, this.citySel, this.regionSel]) s.set(null);
            this.kind = 'random';
            this.syncKind();
        });
        actions.append(reset, go);

        this.status = document.createElement('div');
        this.status.className = 'qb-status';

        p.append(body, actions, this.status);
        document.body.appendChild(p);
        this.syncKind();
    }

    private syncKind(): void {
        this.panel.querySelectorAll<HTMLButtonElement>('.qb-kind button')
            .forEach((b) => b.classList.toggle('qb-on', b.dataset.kind === this.kind));
        this.citySel.root.style.display = this.kind === 'field' ? 'none' : '';
        this.regionSel.root.style.display = this.kind === 'siege' ? 'none' : '';
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
                return { value: g.generalId, label: g.generalName, sub: fn, search: `${g.generalName} ${g.generalId} ${fn}`.toLowerCase() };
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
    // 🔴 [2026-11-05 主人令「战斗结束后，回到选择画面，给30秒选择时间，30秒后自动再开一局，循环播放」]

    private static readonly AUTO_NEXT_SEC = 30;
    /**
     * 🔴 [2026-11-07 主人令「一局定个时间，时间内战斗不结束，算和」]
     *    本局时限 5 分钟，从战术画面真正看得见算起；到点还没分出胜负就收场、判和（押和赔 8 倍）。
     *    定 300 秒的依据：本机实测 74 局即时战斗，平均 106 秒，超过 300 秒的约一成——
     *    正好让「和」有真实概率，赔率 8 倍既不过分也不至于永远开不出来。
     */
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
            if (!this.active) this.startCountdown();   // 这一局没开成（选择冲突等）：继续倒计时，循环不断
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
            this.launchInner();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('[即时战斗] 开战失败', e);
            this.report('launchError', this.active, { error: msg, stack: e instanceof Error ? e.stack?.slice(0, 1500) : undefined });
            this.say(`开战失败：${msg}`, true);
            this.cleanup();
            this.panel.classList.remove('qb-hidden');
            // 押在这一局上的筹码原数退回（这一仗没打成，不该白吃注），再把下一局的下注窗口打开
            this.app.live?.refundBetRound?.();
            this.app.live?.beginBetRound?.();
            this.startCountdown();
        }
    }

    private launchInner(): void {
        const cm = this.app.cityManager;
        const kind: BattleKind = this.kind === 'random' ? (Math.random() < 0.5 ? 'siege' : 'field') : this.kind;

        const attFac = this.attFaction.get();
        const defFac = this.defFaction.get();
        if (attFac && defFac && attFac === defFac) { this.say('双方势力不能相同。', true); return; }

        const attG = this.pickGeneral(attFac, this.attGeneral.get(), {});
        if (!attG) { this.say('攻方找不到可用武将。', true); return; }
        const attFactionId = attFac ?? attG.factionId;

        // 攻城战：先定据点（守将不选时，按「谁占城谁得将」取该城守将）
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
        if (defG.generalId === attG.generalId) { this.say('双方不能是同一位武将。', true); return; }
        const defFactionId = defFac ?? defG.factionId;
        if (defFactionId === attFactionId) {
            this.say(`双方势力相同（${this.fname(attFactionId)}），换一位武将或指定势力。`, true);
            return;
        }

        const { FIRST_BATTLE_MIN_TROOPS: lo, FIRST_BATTLE_MAX_TROOPS: hi } = GameConfig.COMBAT;
        const att: Side = { factionId: attFactionId, general: attG, troops: randInt(lo, hi) };
        const def: Side = { factionId: defFactionId, general: defG, troops: randInt(lo, hi) };

        // 🔴 [2026-11-07] 真正开打这一刻封盘：之后不再接注，等本局结算（攻/守/和）
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
    private raiseLegion(side: Side, pos: { lat: number; lng: number }): Army {
        const cm = this.app.cityManager;
        const lm = this.app.historicalEventManager.getLegionManager();
        const g = side.general;
        const home = (g.cityId ? cm.getCity(g.cityId) : undefined) ?? cm.getCitiesByFaction(side.factionId)[0];
        const name = getCityEliteLegionName(home?.id ?? g.cityId, g.generalId) ?? `${g.generalName}部`;
        // 🔴 直接在战场上建军团：先在本据点建再 setPosition 瞬移，空间索引仍记在本据点，
        //    野战接战查「附近敌军」查不到 → 两军走到一起也不开打（2026-11-05 实测）。
        //    文化编制照样按本据点：createLegion 的文化区取 sourceCityId 那座城的 region。
        const army = lm.createLegion(pos, side.troops, side.factionId, name, undefined, undefined, home?.id, g.generalId, true);
        if (!army) throw new Error(`${g.generalName} 起兵失败`);
        army.setTroops(side.troops);
        army.isElite = true;
        army.name = name;
        if (!army.generalId) army.generalId = g.generalId;
        const rec = getGeneralRecordByGeneralId(g.generalId);
        if (rec?.portrait) army.portraitPath = rec.portrait;
        applyLegionCultureComposition(army, army.cultureRegion ?? undefined);
        const tag = army as Army & Record<string, unknown>;
        tag.__scriptPinned = true;        // 行为树不接管
        tag.isFirstBattleMarch = true;    // 剧情战口径：开战圈不并入第三方、行军不减兵
        tag.__quickBattle = true;         // 开打即进战术模式，不过进场门槛（GameAppCombatHooks.isQuickBattleUnit）
        return army;
    }

    private startSiege(att: Side, def: Side, city: City): void {
        const cm = this.app.cityManager;
        const lm = this.app.historicalEventManager.getLegionManager();
        const saved = { id: city.id, factionId: city.factionId, troops: city.troops };
        cm.updateCity(city.id, { factionId: def.factionId, troops: def.troops }, { skipCaptureLog: true });
        const target = cm.getCity(city.id)!;
        (target as City & { _firstBattleDefenderGeneralId?: string })._firstBattleDefenderGeneralId = def.general.generalId;

        // 攻方摆在城西 → 战术画面里攻方在左
        const ring = Math.min(0.08, GameConfig.SIEGE.COMBAT_RADIUS * 0.6);
        const attacker = this.raiseLegion(att, { lat: target.latitude, lng: target.longitude - ring });
        const tag = attacker as Army & Record<string, unknown>;
        tag.isFirstBattleHero = true;               // 攻城不并入第三方军团
        tag.firstBattleRole = 'attacker';
        tag.firstBattleTargetCityId = target.id;

        this.active = {
            kind: 'siege', attacker, defender: null, city: saved, att, def,
            placeName: target.name, phase: 'engaging', startedAt: performance.now(),
        };
        this.focus(attacker, { lat: target.latitude, lng: target.longitude });
        this.app.timeSystem.setPaused(false);
        const r = lm.triggerSiege(attacker, target);
        if (r === 'skipped') throw new Error('引擎拒绝了这次攻城');
        this.announce();
    }

    private startField(att: Side, def: Side): void {
        const regionKey = (this.regionSel.get() as RegionType | null) ?? null;
        const spot = this.pickFieldSpot(regionKey);
        if (!spot) throw new Error('该地域找不到可用的陆地战场');
        const attacker = this.raiseLegion(att, spot.att);
        const defender = this.raiseLegion(def, spot.def);
        const at = attacker as Army & Record<string, unknown>;
        const dt = defender as Army & Record<string, unknown>;
        at.isFirstBattleHero = true;
        at.firstBattleRole = 'attacker';
        at.forceFirstBattleField = true;            // 靠近据点也打野战，不转攻城
        at.firstBattlePairEnemyId = defender.id;     // 只和对方接战
        dt.isFirstBattleFieldEnemy = true;
        dt.firstBattlePairHeroId = attacker.id;

        this.active = {
            kind: 'field', attacker, defender, city: null, att, def,
            placeName: spot.label, phase: 'engaging', startedAt: performance.now(),
        };
        this.focus(attacker, spot.att);
        this.app.timeSystem.setPaused(false);
        attacker.moveAlongPath([{ lat: spot.def.lat, lng: spot.def.lng }]);
        this.announce();
    }

    /** 野战战场：该地域随机一座据点附近的陆地；攻方在西、守方在东（战术画面左右） */
    private pickFieldSpot(region: RegionType | null): { att: { lat: number; lng: number }; def: { lat: number; lng: number }; label: string } | null {
        const cities = this.app.cityManager.getCities();
        const pool = region ? cities.filter((c) => getCityRegion(c) === region) : cities;
        const isLand = (p: { lat: number; lng: number }) => TerrainSpeedSystem.isLandAt(p);
        // 🔴 [2026-11-05 主人令「野战不要选址到海上」] 战术层判水（Scene13EnvironmentGenerator.probeWater）
        //    扫的是战场中心 8 个方向、最远 0.20° 的同心圆环：圈内只要一点是海，整张战场就按海岸图出。
        //    只查两军与中点三个点不够，这里按同一套环扫（放宽到 0.25°），圈内有海就换地方。
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
        // 🔴 [2026-11-05 主人令「野战不要放大据点附近」] 野战离任何据点都要够远（约 50 公里），
        //    战场上不出现据点；找不到才逐步放宽（仍不贴城）
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

    /**
     * 🔴 [2026-11-07 主人令「观众起初可以选择攻击方或者是防守方」]
     *    即时战斗里探马者**不再入伍**。原做法（2026-11-05「把探马者加入到攻击方」）会把玩家钉死在攻方：
     *    Scene13WarLayer.getPlayerSide() 返回攻方 → ViewerLive 用 playerSide 覆盖观众自己的选边
     *    （`playerSideInBattle() ?? sides.get(id) ?? 0`，以及口令里的「只能为玩家所在的攻方放计」），
     *    守方观众一个字都放不出去；没有玩家的线上构建更是一条计都放不出（castViewerSkill 直接 closed）。
     *    现在观众就是选边放计的看客，镜头照旧跟拍攻方军团。
     */
    private focus(army: Army, at: { lat: number; lng: number }): void {
        const hero = this.app.playerHero;
        if (hero?.getHostLegionId()) {
            try { hero.detach(); } catch (e) { console.warn('[即时战斗] 探马者离队失败', e); }
        }
        try { this.app.cameraFollowUI?.setFollow(army.id, army.name); } catch { /* 镜头失败不影响开战 */ }
        try { this.app.map.getLeafletMap().setView([at.lat, at.lng], 9, { animate: false }); } catch { /* 同上 */ }
    }

    /** 打完：探马者离队（军团马上要撤）。2026-11-07 起探马者不入伍了，这里通常已是空操作，留着防旧状态残留 */
    private releaseHero(): void {
        const hero = this.app.playerHero;
        if (!hero?.getHostLegionId()) return;
        try { hero.detach(); } catch (e) { console.warn('[即时战斗] 探马者离队失败', e); }
    }

    private announce(): void {
        const a = this.active!;
        const kindLabel = a.kind === 'siege' ? '攻城战' : '野战';
        this.say(`${kindLabel}·${a.placeName}：${this.fname(a.att.factionId)} ${a.att.general.generalName}（${a.att.troops}）vs ${this.fname(a.def.factionId)} ${a.def.general.generalName}（${a.def.troops}）`);
        this.panel.classList.add('qb-hidden');
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
                const title = field.customTitle
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

    /**
     * 战术画面在演的时候，大战略必须是「场景接管暂停」的状态。
     *
     * 🔴 [2026-11-05 进不去] GameAppLoop 只有在 `timeSystem.isGamePaused()` 为真、
     *    且 `battleScene.isStrategyPausedByScene()` 为真时才会调 `scene13War.tick()`。
     *    暂停一旦被别处解开（实测：无人值守直播的自动开播 togglePlayback），
     *    主循环立刻改走战略分支 → tick/render 全线停摆 → 画布一直是全透明、
     *    `entryFadePending` 永远是 true → 屏幕就停在「正在载入战术画面…」。
     *    这里每 400ms 巡检一次，暂停被解开就按回场景接管态（BattleSceneLayer.tick 正常也做这件事）。
     *    只动本页这一刻的暂停位，不写存档、不改大战略行为。
     */
    private keepSceneClock(): void {
        if (!this.warActive()) return;
        if (this.app.battleScene?.isStrategyPausedByScene?.() !== true) return;   // 场景自己没接管，不掺和
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
            // 引擎已经开打，正常同一帧就进战术画面：1.2 秒还没进 → 把开战入口再调一次；
            // 4 秒还没进 → 收场，面板上写清原因（同时落盘 scratch，供排查）
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
        // 🔴 [2026-11-07 主人令「一局定个时间，时间内战斗不结束，算和」]
        //    从战术画面真正看得见算起，满 5 分钟还没分胜负 → 收场判和（下注按和局结算）。
        //    只判「引擎里这一仗还没结算」的情形：已经结算、正在演残局的，交给下面的正常收场。
        if (!a.timedOut && a.visibleAt && this.battleStillRunning(a)
            && performance.now() - a.visibleAt > QuickBattle.ROUND_LIMIT_MS) {
            this.endByTimeLimit(a);
            return;
        }
        // 引擎已结算：统一走 BattleSceneLayer.beginLingerAfterDefeat() 的 3 秒战场停留收场（20 秒兜底强退）
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

    /** 🔴 [2026-11-07] 本局时间到还没分胜负：收场判和（押攻/押守退本金，押和赔 8 倍） */
    private endByTimeLimit(a: ActiveBattle): void {
        a.timedOut = true;
        this.report('timeout', a, { limitMs: QuickBattle.ROUND_LIMIT_MS });
        this.app.live?.settleBetRound?.('draw');
        try { this.app.scene13War?.stop('本局时间到'); } catch { /* 收场失败也要退出 */ }
        try { if (this.app.battleScene?.isActive?.()) this.app.battleScene.exit(); } catch { /* 同上 */ }
        this.cleanup();
        this.say(`本局时间到（${Math.round(QuickBattle.ROUND_LIMIT_MS / 60_000)} 分钟）未分胜负，算和。${QuickBattle.AUTO_NEXT_SEC} 秒内可以重选，到时自动开下一局（不选＝随机）。`);
        this.backdrop.say('');
        this.panel.classList.remove('qb-hidden');
        this.app.live?.beginBetRound?.();
        this.startCountdown();
    }

    private finish(fought: boolean): void {
        const a = this.active;
        if (!a) return;
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
            // 🔴 [2026-11-07] 有结果的局按下注结算；「胜负未分」（双方都还在）算和
            this.app.live?.settleBetRound?.(this.resultSide(a));
        }
        if (fought) this.report('finished', a, { result });
        this.cleanup();
        if (fought) this.say(`上一仗结果：${result}。${QuickBattle.AUTO_NEXT_SEC} 秒内可以重选，到时自动开下一局（不选＝随机）。`);
        this.backdrop.say('');
        this.panel.classList.remove('qb-hidden');
        // 回到选人画面＝下一局的下注窗口打开（这一局没打成时，settle 没跑，注单要退）
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
#quick-battle-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:20050;width:min(980px,94vw);
  background:rgba(18,16,12,.94);border:1px solid #b08d4a;border-radius:10px;padding:18px 22px;color:#eadfc8;
  font-family:'Noto Serif SC',serif;box-shadow:0 10px 40px rgba(0,0,0,.6)}
#quick-battle-panel.qb-hidden{display:none}
#quick-battle-panel .qb-title{font-size:24px;font-weight:700;text-align:center;letter-spacing:6px;color:#f3d48a;margin-bottom:14px}
#quick-battle-panel .qb-body{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px}
#quick-battle-panel .qb-side,#quick-battle-panel .qb-mid{background:rgba(255,255,255,.04);border-radius:8px;padding:12px}
#quick-battle-panel .qb-side-title{font-size:17px;font-weight:700;margin-bottom:8px}
#quick-battle-panel .qb-att .qb-side-title{color:#ff9b8a}
#quick-battle-panel .qb-def .qb-side-title{color:#8ac4ff}
#quick-battle-panel .qb-field{position:relative;margin-bottom:10px}
#quick-battle-panel .qb-cap{font-size:13px;color:#b9a988;margin-bottom:4px}
#quick-battle-panel .qb-row{display:flex;gap:4px}
#quick-battle-panel input{flex:1;min-width:0;background:#0d0c0a;border:1px solid #6b5a38;color:#f5ead2;border-radius:5px;padding:7px 9px;font-size:15px;font-family:inherit}
#quick-battle-panel .qb-clear{background:#2a2419;border:1px solid #6b5a38;color:#d8c49a;border-radius:5px;width:30px;cursor:pointer}
#quick-battle-panel .qb-list{display:none;position:absolute;left:0;right:0;top:100%;z-index:5;max-height:300px;overflow:auto;background:#14120e;border:1px solid #8a7444;border-radius:5px;margin-top:2px}
#quick-battle-panel .qb-opt{padding:6px 9px;cursor:pointer;display:flex;justify-content:space-between;gap:8px;font-size:14px}
#quick-battle-panel .qb-opt small{color:#9a8b6c;font-size:12px;white-space:nowrap}
#quick-battle-panel .qb-opt:hover,#quick-battle-panel .qb-opt.qb-on{background:#3a3020}
#quick-battle-panel .qb-more{padding:5px 9px;font-size:12px;color:#8a7c60}
#quick-battle-panel .qb-kind{display:flex;gap:6px;margin-bottom:12px}
#quick-battle-panel button{font-family:inherit}
#quick-battle-panel .qb-kind button{flex:1;padding:8px 0;background:#2a2419;border:1px solid #6b5a38;color:#d8c49a;border-radius:5px;cursor:pointer;font-size:15px}
#quick-battle-panel .qb-kind button.qb-on{background:#8a6a2c;color:#fff;border-color:#e0bb6a}
#quick-battle-panel .qb-actions{display:flex;justify-content:center;gap:14px;margin-top:16px}
#quick-battle-panel .qb-actions button{padding:9px 22px;border-radius:6px;cursor:pointer;font-size:16px;background:#2a2419;border:1px solid #6b5a38;color:#d8c49a}
#quick-battle-panel .qb-actions .qb-go{background:#9a2f22;border-color:#e07a5a;color:#fff;font-weight:700;padding:9px 40px}
#quick-battle-panel .qb-status{margin-top:12px;text-align:center;font-size:14px;color:#cdbf9f;min-height:20px}
#quick-battle-panel .qb-status.qb-warn{color:#ffb366}
`;

/** 游戏本体是否已就位：直接看实例上的对象（延后初始化里最后才建的几样）。
 *  🔴 不用 isGameAppBooted()：dev 服务跑久了经多次热更新，动态 import 进来的 GameAppBootUtils
 *     可能是另一份模块实例，标志永远是 false → 面板永远不出来（2026-11-05 主人实机卡住）。 */
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
            const qb = new QuickBattle(app, backdrop);
            qb.init();
            (window as unknown as { quickBattle?: QuickBattle }).quickBattle = qb;
        } catch (e) {
            console.error('[即时战斗] 面板初始化失败', e);
            backdrop.say(`即时战斗初始化失败：${e instanceof Error ? e.message : String(e)}`);
        }
    }, 300);
}
