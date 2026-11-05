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
import { isGameAppBooted } from '../app/boot/GameAppBootUtils';

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

    constructor(private readonly app: GameApp) {
        this.generals = collectGenerals();
        this.generalById = new Map(this.generals.map((g) => [g.generalId, g]));
        for (const f of FACTIONS) this.factionName.set(f.id, f.name);
    }

    init(): void {
        this.quietWorld();
        this.clearWorldLegions();
        this.buildPanel();
        setInterval(() => this.watch(), 400);
    }

    private fname(id: string): string {
        return this.factionName.get(id) ?? this.app.cityManager.getFactionName(id) ?? id;
    }

    /** 只留这一仗：停 AI 寻敌、募兵、玩家乱入者与任务跟踪 */
    private quietWorld(): void {
        const app = this.app as unknown as Record<string, { update?: unknown; tick?: unknown } | null>;
        const noop = () => { /* 即时战斗：停用 */ };
        if (app.aiController) app.aiController.update = noop;
        if (app.recruitmentSystem) app.recruitmentSystem.update = noop;
        if (app.playerHero) app.playerHero.update = noop;
        if (app.playerQuests) app.playerQuests.tick = noop;
        this.app.timeSystem.setPaused(true);
    }

    private clearWorldLegions(): void {
        const lm = this.app.historicalEventManager.getLegionManager();
        for (const a of [...lm.getArmies()]) {
            if (a.isDestroyed) continue;
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
        if (!this.app.tacticalModeEnabled) this.say('⚠ 调试面板里「战术模式」开关是关的，开战后不会进战术画面。', true);

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

    private launch(): void {
        if (this.active) { this.say('上一仗还没打完。', true); return; }
        if (!isGameAppBooted()) { this.say('游戏还在加载，稍等。', true); return; }
        try {
            this.launchInner();
        } catch (e) {
            console.error('[即时战斗] 开战失败', e);
            this.say(`开战失败：${e instanceof Error ? e.message : String(e)}`, true);
            this.cleanup();
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

        this.clearWorldLegions();
        if (kind === 'siege') this.startSiege(att, def, city!);
        else this.startField(att, def);
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
        tag.isFirstBattleMarch = true;    // 按剧情战进战术模式（GameAppCombatHooks.isStoryOrFirstBattleUnit）
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
        for (let tries = 0; tries < 40; tries++) {
            const c = rand(pool);
            if (!c) return null;
            const ang = Math.random() * Math.PI * 2;
            const d = tries < 30 ? 0.15 + Math.random() * 0.2 : 0;
            const mid = { lat: c.latitude + Math.sin(ang) * d, lng: c.longitude + Math.cos(ang) * d };
            const a = { lat: mid.lat, lng: mid.lng - 0.03 };
            const b = { lat: mid.lat, lng: mid.lng + 0.03 };
            if (!isLand(a) || !isLand(b) || !isLand(mid)) continue;
            const rname = CULTURE_NAMES[getCityRegion(c)] ?? '';
            return { att: a, def: b, label: `${c.name}附近（${rname}）` };
        }
        return null;
    }

    private focus(army: Army, at: { lat: number; lng: number }): void {
        try { this.app.cameraFollowUI?.setFollow(army.id, army.name); } catch { /* 镜头失败不影响开战 */ }
        try { this.app.map.getLeafletMap().setView([at.lat, at.lng], 9, { animate: false }); } catch { /* 同上 */ }
    }

    private announce(): void {
        const a = this.active!;
        const kindLabel = a.kind === 'siege' ? '攻城战' : '野战';
        this.say(`${kindLabel}·${a.placeName}：${this.fname(a.att.factionId)} ${a.att.general.generalName}（${a.att.troops}）vs ${this.fname(a.def.factionId)} ${a.def.general.generalName}（${a.def.troops}）`);
        this.panel.classList.add('qb-hidden');
    }

    // ── 战况跟踪与收尾 ──

    private warActive(): boolean {
        return this.app.scene13War?.isActive?.() === true || this.app.battleScene?.isActive?.() === true;
    }

    private watch(): void {
        const a = this.active;
        if (!a) return;
        if (a.phase === 'engaging') {
            if (this.warActive()) { a.phase = 'fighting'; return; }
            if (performance.now() - a.startedAt > 45_000) {
                this.say('⚠ 45 秒内没进战术模式（可能战术模式开关没开，或这一仗没过进场判定）。已收场，可以重来。', true);
                this.finish(false);
            }
            return;
        }
        if (!this.warActive()) this.finish(true);
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
        }
        this.cleanup();
        if (fought) this.say(`上一仗结果：${result}。可以再选一场。`);
        this.panel.classList.remove('qb-hidden');
    }

    /** 撤掉本场军团、还原据点、暂停 */
    private cleanup(): void {
        const a = this.active;
        this.active = null;
        this.app.timeSystem.setPaused(true);
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

/** 等游戏本体初始化完（军团管理器、战斗钩子都就位）再挂面板 */
export function startQuickBattleMode(app: GameApp): void {
    document.title = 'MAPWAR·即时战斗';
    const timer = setInterval(() => {
        if (!isGameAppBooted() || !app.historicalEventManager || !app.cameraFollowUI) return;
        clearInterval(timer);
        const qb = new QuickBattle(app);
        qb.init();
        (window as unknown as { quickBattle?: QuickBattle }).quickBattle = qb;
    }, 300);
}
