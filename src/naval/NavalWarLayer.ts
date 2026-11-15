/**
 * 海战场面 · 画面层（全屏画布，叠在战略地图上）
 *
 * 🔴 [2026-11-16 主人定「按这个方向做」] 舰队对舰队的海战不再只在战略地图上绕圈，单独进这个场面：
 *   每方 10 艘（九格三排 + 旗舰），自动打，靠风向、火攻、接舷夺船、旗舰决胜、逐舰沉没出看点。
 *   模拟在 NavalBattleSim（纯逻辑），这里只管画、播报、音效、镜头，以及打完把胜负交回战斗引擎。
 *
 * 生命周期与战术模式同一条路：GameAppCombatHooks 冻结战斗 + battleScene.enter()（暂停大地图），
 *   本层 start() → 每帧 tick() → 判出胜负调 onDecision（→ forceScene13Result 写回兵力）
 *   → 引擎结算 → battleScene.beginLingerAfterDefeat（残局停 3 秒）→ battleScene.exit() → 本层 stop()。
 */

import { LegionPhalanxDrawer } from '../map/legion/LegionPhalanxDrawer';
import { SpriteTinter } from '../systems/tinting/SpriteTinter';
import { FactionTintSystem } from '../systems/tinting/FactionTintSystem';
import { buildSailLayers } from '../data/NavalSails';
import { getNavalShipChineseName } from '../types/NavalShipTiers';
import { audioManager } from '../audio/AudioManager';
import {
    NavalBattleSim, NAVAL_WORLD_W, NAVAL_WORLD_H, NAVAL_TIME_LIMIT, windName,
    type NavalSide, type NavalShip, type NavalEvent, type NavalPhase,
} from './NavalBattleSim';

export interface NavalWarSideInit {
    factionId: string;
    troops: number;
    shipKey: string;
    /** 面板上的名字（武将名优先，其次军团名） */
    name: string;
    generalName?: string | null;
}

export interface NavalWarInit {
    attacker: NavalWarSideInit;
    defender: NavalWarSideInit;
    seed: string;
    /** 跟随军团在守方：画面左右对调，跟随的舰队固定在左边 */
    followedOnDefenderSide?: boolean;
    favored?: NavalSide | null;
    title?: string | null;
}

type Fx =
    | { k: 'splash'; x: number; y: number; t: number; big: boolean }
    | { k: 'spark'; x: number; y: number; t: number }
    | { k: 'muzzle'; x: number; y: number; t: number; ang: number }
    | { k: 'boom'; x: number; y: number; t: number; big: boolean }
    | { k: 'text'; x: number; y: number; t: number; text: string; color: string }
    | { k: 'ring'; x: number; y: number; t: number; color: string };

interface Toast { text: string; color: string; t: number }

const PHASE_LABEL: Record<NavalPhase, string> = {
    approach: '抢风接近',
    exchange: '远程对射',
    melee: '接舷混战',
    rout: '溃逃追击',
};

/** 船贴图 1 像素 = 多少世界单位 */
const SPRITE_WS = 0.85;
const SIM_STEP = 1 / 30;
const DEFAULT_COLOR: Record<NavalSide, string> = { attacker: '#d94a3a', defender: '#3a7bd9' };

export class NavalWarLayer {
    /** 判出胜负时回调（必须在 start 前赋值） */
    public onDecision: ((winner: NavalSide, survivors: { attacker: number; defender: number }) => void) | null = null;

    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private active = false;
    private lingering = false;
    private sim: NavalBattleSim | null = null;
    private init: NavalWarInit | null = null;
    private acc = 0;
    private decided = false;
    private fx: Fx[] = [];
    private toasts: Toast[] = [];
    private cam = { x: NAVAL_WORLD_W / 2, y: NAVAL_WORLD_H / 2, z: 0 };
    private focus: { x: number; y: number; until: number } | null = null;
    private colors: Record<NavalSide, string> = { ...DEFAULT_COLOR };
    private flip = false;
    private wallT = 0;
    private sfxAt: Record<string, number> = {};
    private lastPhase: NavalPhase = 'approach';
    private finalTroops: { attacker: number; defender: number } | null = null;
    private errorLogged = false;

    public attach(): void {
        if (this.canvas) return;
        const cv = document.createElement('canvas');
        cv.id = 'naval-war-canvas';
        cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:400;pointer-events:none;display:none;';
        document.body.appendChild(cv);
        this.canvas = cv;
        this.ctx = cv.getContext('2d');
    }

    public isActive(): boolean {
        return this.active || this.lingering;
    }

    /**
     * 战斗面板血槽用的实时兵力（引擎冻结期间数字要跟着船力走）：
     * 开战兵力 × 本方剩余船体比例（被夺的船算到夺船方）。残局待命期间也继续供数。
     */
    public getLiveTroops(): { attacker: number; defender: number } | null {
        if (!this.isActive() || !this.sim || !this.init) return null;
        // 判完胜负：与写回引擎的兵力一致（败方清零），残局停留时数字不再跳
        if (this.finalTroops) return { ...this.finalTroops };
        const hp: Record<NavalSide, number> = { attacker: 0, defender: 0 };
        const max: Record<NavalSide, number> = { attacker: 0, defender: 0 };
        for (const s of this.sim.ships) {
            max[s.origSide] += s.maxHp;
            if (s.state === 'alive' || s.state === 'fled') hp[s.side] += Math.max(0, s.hp);
        }
        const live = (side: NavalSide) => Math.round(this.init![side].troops * Math.min(1, hp[side] / (max[side] || 1)));
        return { attacker: live('attacker'), defender: live('defender') };
    }

    public getInitialTroops(): { attacker: number; defender: number; total: number } | null {
        if (!this.isActive() || !this.init) return null;
        const a = this.init.attacker.troops, d = this.init.defender.troops;
        return { attacker: a, defender: d, total: a + d };
    }

    /** 演出还在打（没判胜负） */
    public isFighting(): boolean {
        return this.active && !this.decided;
    }

    public start(init: NavalWarInit): void {
        this.attach();
        this.init = init;
        this.sim = new NavalBattleSim({
            attacker: { factionId: init.attacker.factionId, troops: init.attacker.troops, shipKey: init.attacker.shipKey },
            defender: { factionId: init.defender.factionId, troops: init.defender.troops, shipKey: init.defender.shipKey },
            seed: init.seed,
            favored: init.favored ?? null,
        });
        this.flip = !!init.followedOnDefenderSide;
        this.colors = {
            attacker: FactionTintSystem.getTintHex(init.attacker.factionId) ?? DEFAULT_COLOR.attacker,
            defender: FactionTintSystem.getTintHex(init.defender.factionId) ?? DEFAULT_COLOR.defender,
        };
        if (this.colors.attacker.toLowerCase() === this.colors.defender.toLowerCase()) this.colors.defender = DEFAULT_COLOR.defender;
        this.acc = 0;
        this.decided = false;
        this.fx = [];
        this.toasts = [];
        this.focus = null;
        this.wallT = 0;
        this.sfxAt = {};
        this.lastPhase = 'approach';
        this.finalTroops = null;
        this.errorLogged = false;
        this.cam = { x: NAVAL_WORLD_W / 2, y: NAVAL_WORLD_H / 2, z: 0 };
        this.active = true;
        this.lingering = false;
        // 预载双方船型素材（第一帧没到就先画剪影，到了自动换上）
        LegionPhalanxDrawer.ensureUnitTypeLoading(init.attacker.shipKey);
        LegionPhalanxDrawer.ensureUnitTypeLoading(init.defender.shipKey);
        if (this.canvas) this.canvas.style.display = 'block';
        (window as any).game?.combatUI?.applyScene13Layout?.(true);
        const wind = windName(this.sim.windAng);
        this.toast(init.title || `${init.attacker.name} 迎战 ${init.defender.name}`, '#ffe9b0');
        this.toast(`海上${wind}，${getNavalShipChineseName(init.attacker.shipKey)} 对 ${getNavalShipChineseName(init.defender.shipKey)}`, '#cfe6ff');
        this.render();
    }

    /** 判完胜负后的残局：船停在原地继续漂、火继续烧，等场景退场 */
    public beginLinger(): void {
        if (!this.active) return;
        this.active = false;
        this.lingering = true;
    }

    public stop(): void {
        this.active = false;
        this.lingering = false;
        this.sim = null;
        this.fx = [];
        this.toasts = [];
        if (this.canvas) this.canvas.style.display = 'none';
    }

    public tick(dt: number): void {
        if (!this.isActive() || !this.sim) return;
        try {
            this.tickInner(dt);
        } catch (e) {
            // 画面层出错绝不能卡住主循环：记一次错，按当前船力直接判胜负，交还引擎收场
            if (!this.errorLogged) {
                this.errorLogged = true;
                console.error('[NavalWar] 海战场面出错，按当前船力判定胜负', e);
            }
            if (!this.decided && this.sim && this.init) {
                const live = this.getLiveTroops() ?? { attacker: this.init.attacker.troops, defender: this.init.defender.troops };
                const winner: NavalSide = live.attacker >= live.defender ? 'attacker' : 'defender';
                this.sim.result = { winner, winnerStrength: Math.max(0.05, live[winner] / Math.max(1, this.init[winner].troops)), loserStrength: 0 };
                this.decide();
            }
        }
    }

    private tickInner(dt: number): void {
        if (!this.sim) return;
        const realDt = Math.max(0, Math.min(0.1, dt));
        this.wallT += realDt;
        if (this.active && !this.decided) {
            this.acc += realDt;
            while (this.acc >= SIM_STEP) {
                this.acc -= SIM_STEP;
                this.sim.step(SIM_STEP);
                this.handleEvents(this.sim.drainEvents());
                if (this.sim.result) break;
            }
            if (this.sim.result) this.decide();
        }
        this.updateFx(realDt);
        this.render();
    }

    private decide(): void {
        if (this.decided || !this.sim?.result || !this.init) return;
        this.decided = true;
        const r = this.sim.result;
        const winSide = r.winner;
        const loseSide: NavalSide = winSide === 'attacker' ? 'defender' : 'attacker';
        const winName = this.init[winSide].name;
        this.toast(`${winName} 大胜！`, this.colors[winSide]);
        const survivors = {
            attacker: 0,
            defender: 0,
        };
        survivors[winSide] = Math.max(1, Math.round(this.init[winSide].troops * Math.min(1, r.winnerStrength)));
        survivors[loseSide] = 0;
        this.finalTroops = { ...survivors };
        try {
            this.onDecision?.(winSide, survivors);
        } catch (e) {
            console.error('[NavalWar] 胜负写回失败', e);
        }
    }

    // ─────────────────────────── 事件 → 特效 / 播报 / 音效 ───────────────────────────

    private sideName(side: NavalSide): string {
        return this.init?.[side].name ?? (side === 'attacker' ? '攻方' : '守方');
    }

    private handleEvents(events: NavalEvent[]): void {
        const sim = this.sim!;
        for (const e of events) {
            switch (e.type) {
                case 'fire':
                    if (e.weapon === 'cannon') {
                        const s = sim.getShip(e.shipId);
                        this.fx.push({ k: 'muzzle', x: e.x, y: e.y, t: 0, ang: s ? s.heading : 0 });
                        this.sfx('naval_cannon_fire', 0.35);
                    } else if (e.weapon === 'arrow') {
                        this.sfx('naval_arrow_fire', 0.45);
                    } else if (e.weapon === 'trebuchet') {
                        this.sfx('naval_cannon_fire', 0.9);
                    }
                    break;
                case 'impact':
                    if (e.hit) this.fx.push({ k: 'spark', x: e.x, y: e.y, t: 0 });
                    else {
                        this.fx.push({ k: 'splash', x: e.x, y: e.y, t: 0, big: e.weapon !== 'arrow' });
                        if (e.weapon !== 'arrow') this.sfx('naval_cannon_splash', 0.4);
                    }
                    break;
                case 'ignite':
                    if (e.isFlag) {
                        this.toast(`${this.sideName(e.side)} 旗舰起火！`, '#ffb060');
                        this.focusOn(e.x, e.y, 3);
                    }
                    break;
                case 'ram':
                    this.fx.push({ k: 'boom', x: e.x, y: e.y, t: 0, big: false });
                    this.fx.push({ k: 'text', x: e.x, y: e.y - 40, t: 0, text: '冲撞！', color: '#ffffff' });
                    this.sfx('naval_explode', 0.6);
                    break;
                case 'boardStart':
                    this.fx.push({ k: 'text', x: e.x, y: e.y - 50, t: 0, text: '接舷！', color: '#ffe9b0' });
                    break;
                case 'capture':
                    this.fx.push({ k: 'ring', x: e.x, y: e.y, t: 0, color: this.colors[e.side] });
                    this.fx.push({ k: 'text', x: e.x, y: e.y - 60, t: 0, text: e.isFlag ? '夺下敌旗舰！' : '夺船！', color: this.colors[e.side] });
                    if (e.isFlag) {
                        this.toast(`${this.sideName(e.side)} 跳帮夺下敌方旗舰！`, this.colors[e.side]);
                        this.focusOn(e.x, e.y, 4);
                    } else {
                        this.toast(`${this.sideName(e.side)} 接舷夺下一艘敌船，换上自家旗号`, this.colors[e.side]);
                        this.focusOn(e.x, e.y, 2.5);
                    }
                    break;
                case 'sink':
                    this.fx.push({ k: 'boom', x: e.x, y: e.y, t: 0, big: e.explode || e.isFlag });
                    this.sfx(e.explode || e.isFlag ? 'naval_explode' : 'naval_sink', 0.2);
                    if (e.isFlag) {
                        this.toast(`${this.sideName(e.side)} 旗舰沉没！`, '#ff7b6b');
                        this.focusOn(e.x, e.y, 4);
                    } else if (e.explode) {
                        this.fx.push({ k: 'text', x: e.x, y: e.y - 60, t: 0, text: '殉爆！', color: '#ffb060' });
                    }
                    break;
                case 'windShift': {
                    const wn = windName(sim.windAng);
                    this.toast(e.windward ? `风向转为${wn}，${this.sideName(e.windward)} 占了上风` : `风向转为${wn}`, '#cfe6ff');
                    break;
                }
                case 'rout':
                    this.toast(e.reason === 'flag'
                        ? `${this.sideName(e.side)} 帅旗已倒，全军溃散`
                        : `${this.sideName(e.side)} 船队折损殆尽，掉头溃逃`, '#ff9a8a');
                    break;
                case 'phase':
                    if (e.phase !== this.lastPhase) {
                        this.lastPhase = e.phase;
                        if (e.phase === 'exchange') this.toast('进入射程，双方开始对射', '#e8e8e8');
                        else if (e.phase === 'melee') this.toast('两军船队绞在一起，接舷肉搏', '#e8e8e8');
                    }
                    break;
            }
        }
    }

    private sfx(key: string, minGap: number): void {
        const last = this.sfxAt[key] ?? -99;
        if (this.wallT - last < minGap) return;
        this.sfxAt[key] = this.wallT;
        try { audioManager.play(key as any); } catch { /* 音效失败不影响演出 */ }
    }

    private toast(text: string, color: string): void {
        this.toasts.push({ text, color, t: 0 });
        if (this.toasts.length > 4) this.toasts.shift();
    }

    private focusOn(x: number, y: number, secs: number): void {
        this.focus = { x, y, until: this.wallT + secs };
    }

    private updateFx(dt: number): void {
        for (let i = this.fx.length - 1; i >= 0; i--) {
            const f = this.fx[i];
            f.t += dt;
            const life = f.k === 'text' ? 1.8 : f.k === 'boom' ? (f.big ? 2.2 : 1.0) : f.k === 'ring' ? 1.4 : f.k === 'muzzle' ? 0.35 : 0.8;
            if (f.t > life) this.fx.splice(i, 1);
        }
        if (this.fx.length > 400) this.fx.splice(0, this.fx.length - 400);
        for (let i = this.toasts.length - 1; i >= 0; i--) {
            this.toasts[i].t += dt;
            if (this.toasts[i].t > 4.5) this.toasts.splice(i, 1);
        }
    }

    // ─────────────────────────── 镜头 ───────────────────────────

    private updateCamera(cw: number, ch: number): void {
        const sim = this.sim!;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const s of sim.ships) {
            if (s.state !== 'alive' && s.state !== 'sinking') continue;
            // 溃逃出场的船不再拖着镜头走
            if (s.routing && (s.x < 0 || s.x > NAVAL_WORLD_W || s.y < 0 || s.y > NAVAL_WORLD_H)) continue;
            minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x);
            minY = Math.min(minY, s.y); maxY = Math.max(maxY, s.y);
        }
        if (!isFinite(minX)) { minX = 0; maxX = NAVAL_WORLD_W; minY = 0; maxY = NAVAL_WORLD_H; }
        let tx = (minX + maxX) / 2;
        let ty = (minY + maxY) / 2;
        const bw = maxX - minX + 700;
        const bh = maxY - minY + 600;
        let tz = Math.min(cw / bw, ch / bh);
        tz = Math.max(cw / 3600, Math.min(cw / 1500, tz));
        if (this.focus && this.wallT < this.focus.until) {
            tx = tx * 0.45 + this.focus.x * 0.55;
            ty = ty * 0.45 + this.focus.y * 0.55;
            tz *= 1.12;
        }
        if (this.cam.z === 0) { this.cam = { x: tx, y: ty, z: tz }; return; }
        const k = 0.035;
        this.cam.x += (tx - this.cam.x) * k;
        this.cam.y += (ty - this.cam.y) * k;
        this.cam.z += (tz - this.cam.z) * k * 0.7;
    }

    private sx(x: number, cw: number): number {
        const wx = this.flip ? NAVAL_WORLD_W - x : x;
        const cx = this.flip ? NAVAL_WORLD_W - this.cam.x : this.cam.x;
        return (wx - cx) * this.cam.z + cw / 2;
    }

    private sy(y: number, ch: number): number {
        return (y - this.cam.y) * this.cam.z + ch / 2;
    }

    /** 世界航向 → 屏幕航向（左右对调时镜像） */
    private screenHeading(h: number): number {
        return this.flip ? Math.PI - h : h;
    }

    // ─────────────────────────── 绘制 ───────────────────────────

    private render(): void {
        const cv = this.canvas, ctx = this.ctx, sim = this.sim;
        if (!cv || !ctx || !sim) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cw = Math.round(window.innerWidth * dpr);
        const ch = Math.round(window.innerHeight * dpr);
        if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
        this.updateCamera(cw, ch);
        this.drawSea(ctx, cw, ch);
        // 尾浪在船下面
        for (const s of sim.ships) if (s.state === 'alive' || s.state === 'fled') this.drawWake(ctx, s, cw, ch);
        const order = sim.ships.filter((s) => s.state !== 'sunk' && s.state !== 'fled').sort((a, b) => a.y - b.y);
        for (const s of order) this.drawBoardingLink(ctx, s, cw, ch);
        for (const s of order) this.drawShip(ctx, s, cw, ch);
        this.drawProjectiles(ctx, cw, ch);
        this.drawFx(ctx, cw, ch);
        for (const s of order) this.drawShipBadge(ctx, s, cw, ch);
        this.drawHud(ctx, cw, ch, dpr);
    }

    private drawSea(ctx: CanvasRenderingContext2D, cw: number, ch: number): void {
        const g = ctx.createLinearGradient(0, 0, 0, ch);
        g.addColorStop(0, '#0c3550');
        g.addColorStop(0.5, '#0f4566');
        g.addColorStop(1, '#0b3049');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
        // 浪纹：按世界网格摆，随风漂；每格一道短弧，明暗起伏
        const sim = this.sim!;
        const z = this.cam.z;
        const cell = 120;
        const drift = this.wallT * 18 * sim.windStrength;
        const wdx = Math.cos(sim.windAng) * drift, wdy = Math.sin(sim.windAng) * drift;
        const halfW = cw / 2 / z, halfH = ch / 2 / z;
        const camX = this.flip ? NAVAL_WORLD_W - this.cam.x : this.cam.x;
        const x0 = Math.floor((camX - halfW - wdx * (this.flip ? -1 : 1)) / cell) - 1;
        const x1 = Math.ceil((camX + halfW - wdx * (this.flip ? -1 : 1)) / cell) + 1;
        const y0 = Math.floor((this.cam.y - halfH - wdy) / cell) - 1;
        const y1 = Math.ceil((this.cam.y + halfH - wdy) / cell) + 1;
        ctx.lineWidth = Math.max(1, 2.2 * z);
        ctx.lineCap = 'round';
        for (let gx = x0; gx <= x1; gx++) {
            for (let gy = y0; gy <= y1; gy++) {
                let h = (gx * 73856093) ^ (gy * 19349663);
                h = (h ^ (h >>> 13)) * 1274126177;
                const r1 = ((h >>> 0) % 1000) / 1000;
                const r2 = (((h >>> 10) >>> 0) % 1000) / 1000;
                const wx = gx * cell + r1 * cell + wdx * (this.flip ? -1 : 1);
                const wy = gy * cell + r2 * cell + wdy;
                const px = (wx - camX) * z + cw / 2;
                const py = (wy - this.cam.y) * z + ch / 2;
                const a = 0.10 + 0.10 * Math.sin(this.wallT * 1.3 + r1 * 12);
                if (a <= 0.02) continue;
                const len = (18 + r2 * 22) * z;
                ctx.strokeStyle = `rgba(200,230,255,${a.toFixed(3)})`;
                ctx.beginPath();
                ctx.moveTo(px - len, py);
                ctx.quadraticCurveTo(px, py - len * 0.35, px + len, py);
                ctx.stroke();
            }
        }
    }

    private drawWake(ctx: CanvasRenderingContext2D, s: NavalShip, cw: number, ch: number): void {
        const tr = s.trail;
        if (tr.length < 2) return;
        const z = this.cam.z;
        for (let i = 1; i < tr.length; i++) {
            const a = (i / tr.length) * 0.35;
            ctx.strokeStyle = `rgba(235,248,255,${a.toFixed(3)})`;
            ctx.lineWidth = Math.max(1, (4 + (tr.length - i) * 0.9) * z);
            ctx.beginPath();
            ctx.moveTo(this.sx(tr[i - 1].x, cw), this.sy(tr[i - 1].y, ch));
            ctx.lineTo(this.sx(tr[i].x, cw), this.sy(tr[i].y, ch));
            ctx.stroke();
        }
    }

    private drawBoardingLink(ctx: CanvasRenderingContext2D, s: NavalShip, cw: number, ch: number): void {
        if (s.boardingWith === null || s.state !== 'alive') return;
        const o = this.sim!.getShip(s.boardingWith);
        if (!o || s.id > o.id) return;
        const ax = this.sx(s.x, cw), ay = this.sy(s.y, ch), bx = this.sx(o.x, cw), by = this.sy(o.y, ch);
        ctx.strokeStyle = 'rgba(80,55,30,0.9)';
        ctx.lineWidth = Math.max(2, 5 * this.cam.z);
        for (let k = -1; k <= 1; k++) {
            const nx = -(by - ay), ny = bx - ax;
            const nl = Math.hypot(nx, ny) || 1;
            const off = k * 18 * this.cam.z;
            ctx.beginPath();
            ctx.moveTo(ax + nx / nl * off, ay + ny / nl * off);
            ctx.lineTo(bx + nx / nl * off, by + ny / nl * off);
            ctx.stroke();
        }
    }

    private drawShip(ctx: CanvasRenderingContext2D, s: NavalShip, cw: number, ch: number): void {
        const sim = this.sim!;
        const z = this.cam.z;
        const px = this.sx(s.x, cw);
        const py = this.sy(s.y, ch);
        if (px < -400 || px > cw + 400 || py < -400 || py > ch + 400) return;
        const sinkT = s.state === 'sinking' ? sim.time - s.sinkAt : 0;
        const alpha = s.state === 'sinking' ? Math.max(0, 1 - sinkT / 6) : 1;
        const bob = Math.sin(this.wallT * 1.6 + s.id * 1.7) * 2.5 * z;
        const sinkY = s.state === 'sinking' ? sinkT / 6 * 60 * z : 0;
        const roll = Math.sin(this.wallT * 1.1 + s.id) * 0.03 + (s.state === 'sinking' ? sinkT * 0.05 : 0);

        // 屏幕航向（北=0 顺时针）→ DE 16 向帧 + 残差角（与 LegionPhalanxDrawer.drawNaval 同一套换算）
        const h = this.screenHeading(s.heading);
        let shipDeg = (Math.atan2(Math.cos(h), -Math.sin(h)) * 180 / Math.PI);
        shipDeg = ((shipDeg % 360) + 360) % 360;
        const shipRad = shipDeg * Math.PI / 180;
        const worldDeg = ((Math.atan2(Math.sin(shipRad), 2 * Math.cos(shipRad)) * 180 / Math.PI) % 360 + 360) % 360;
        const dir = ((Math.round((worldDeg - 45) / 22.5) % 16) + 16) % 16;
        const frameRad = (45 + 22.5 * dir) * Math.PI / 180;
        let resDeg = shipDeg - Math.atan2(Math.sin(frameRad), 0.5 * Math.cos(frameRad)) * 180 / Math.PI;
        while (resDeg > 180) resDeg -= 360;
        while (resDeg < -180) resDeg += 360;
        const rot = resDeg * Math.PI / 180 + roll;

        const set: any = LegionPhalanxDrawer.getUnitAssets(s.shipKey);
        const scale = SPRITE_WS * z * (s.role === 'flag' ? 1.18 : 1);
        let drawn = false;
        if (set) {
            const attacking = sim.time - s.lastFireAt < 0.6 && s.state === 'alive';
            const deathFrames: HTMLImageElement[] = set.DEATH ?? [];
            let anim: 'MOVE' | 'ATTACK' | 'IDLE' | 'DEATH' = attacking && set.ATTACK?.length ? 'ATTACK' : (set.MOVE?.length ? 'MOVE' : 'IDLE');
            let useDeath = false;
            if (s.state === 'sinking' && deathFrames.length > 0) { anim = 'DEATH'; useDeath = true; }
            const arr: HTMLImageElement[] = set[anim] ?? set.IDLE ?? [];
            const raw = arr[dir] || arr[0];
            if (raw && raw.complete && raw.naturalWidth > 0) {
                const img = (SpriteTinter.getTintedSprite(raw, s.factionId) ?? raw) as CanvasImageSource;
                const dyn = set.dyn?.[anim] ?? set.dyn?.IDLE;
                // 战船是 16 向素材：帧框键就是 16 向下标（同 LegionPhalanxDrawer.metaDirFor(…, true)）
                const meta = dyn?.dirs ? dyn.dirs[String(dir)] : undefined;
                const frames = dyn?.frames ?? Math.max(1, Math.round(raw.naturalWidth / raw.naturalHeight));
                let fi: number;
                if (useDeath) fi = Math.min(frames - 1, Math.floor(sinkT / 0.15));
                else fi = Math.floor((this.wallT + s.id * 0.13) * frames / 1.5) % frames;
                ctx.save();
                ctx.globalAlpha = useDeath ? Math.min(1, alpha + 0.4) : alpha;
                ctx.translate(px, py + bob + (useDeath ? 0 : sinkY));
                ctx.rotate(rot);
                if (meta) {
                    ctx.drawImage(img, fi * meta.fw, 0, meta.fw, meta.fh, -meta.hx * scale, -meta.hy * scale, meta.fw * scale, meta.fh * scale);
                    if (!useDeath) {
                        const sails = buildSailLayers(s.shipKey, dir, scale, LegionPhalanxDrawer.sailGroupOf(s.factionId));
                        if (sails) for (const sl of sails) ctx.drawImage(sl.img, sl.ox, sl.oy, sl.w, sl.h);
                    }
                } else {
                    const fw = raw.naturalWidth / frames;
                    const fh = raw.naturalHeight;
                    ctx.drawImage(img, fi * fw, 0, fw, fh, -fw * scale / 2, -fh * scale / 2, fw * scale, fh * scale);
                }
                ctx.restore();
                drawn = true;
            }
        } else {
            LegionPhalanxDrawer.ensureUnitTypeLoading(s.shipKey);
        }
        if (!drawn) this.drawHullSilhouette(ctx, s, px, py + bob + sinkY, h, alpha);

        // 火：船上跳动的火舌 + 往下风飘的烟
        if (s.burnT > 0 && s.state !== 'sunk') this.drawFire(ctx, s, px, py + bob + sinkY);
        if (s.state === 'sinking') this.drawBubbles(ctx, px, py, sinkT);
    }

    /** 素材还没到时的剪影：势力色船身，免得第一帧空海 */
    private drawHullSilhouette(ctx: CanvasRenderingContext2D, s: NavalShip, px: number, py: number, h: number, alpha: number): void {
        const z = this.cam.z * (s.role === 'flag' ? 1.18 : 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(px, py);
        ctx.rotate(h);
        ctx.fillStyle = '#5a3d22';
        ctx.beginPath();
        ctx.moveTo(70 * z, 0);
        ctx.quadraticCurveTo(20 * z, -24 * z, -60 * z, -20 * z);
        ctx.lineTo(-60 * z, 20 * z);
        ctx.quadraticCurveTo(20 * z, 24 * z, 70 * z, 0);
        ctx.fill();
        ctx.fillStyle = this.colors[s.side];
        ctx.fillRect(-14 * z, -30 * z, 28 * z, 60 * z);
        ctx.restore();
    }

    private drawFire(ctx: CanvasRenderingContext2D, s: NavalShip, px: number, py: number): void {
        const z = this.cam.z;
        const sim = this.sim!;
        const wx = Math.cos(this.screenHeading(sim.windAng)), wy = Math.sin(sim.windAng);
        for (let i = 0; i < 9; i++) {
            const ph = this.wallT * 6 + i * 1.9 + s.id;
            const ox = Math.sin(i * 2.3 + s.id) * 34 * z;
            const oy = (-20 - Math.abs(Math.sin(ph)) * 34) * z;
            const r = (10 + 7 * Math.sin(ph * 1.3)) * z;
            ctx.fillStyle = i % 3 === 0 ? 'rgba(255,230,120,0.85)' : 'rgba(255,120,30,0.75)';
            ctx.beginPath();
            ctx.arc(px + ox, py + oy, Math.max(1, r), 0, Math.PI * 2);
            ctx.fill();
        }
        for (let i = 0; i < 6; i++) {
            const k = ((this.wallT * 0.5 + i / 6) % 1);
            const sx = px + wx * k * 160 * z + Math.sin(i * 3.1) * 12 * z;
            const sy = py - 50 * z - k * 110 * z + wy * k * 60 * z;
            ctx.fillStyle = `rgba(60,60,60,${(0.45 * (1 - k)).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(sx, sy, (16 + k * 40) * z, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawBubbles(ctx: CanvasRenderingContext2D, px: number, py: number, t: number): void {
        const z = this.cam.z;
        ctx.strokeStyle = `rgba(230,245,255,${Math.max(0, 0.6 - t * 0.08).toFixed(3)})`;
        ctx.lineWidth = Math.max(1, 2 * z);
        for (let i = 0; i < 3; i++) {
            const r = ((t * 30 + i * 25) % 90) * z;
            ctx.beginPath();
            ctx.ellipse(px, py + 10 * z, r * 1.6, r * 0.6, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    private drawProjectiles(ctx: CanvasRenderingContext2D, cw: number, ch: number): void {
        const z = this.cam.z;
        for (const p of this.sim!.projectiles) {
            const u = Math.min(1, p.t / p.dur);
            const dist = Math.hypot(p.x1 - p.x0, p.y1 - p.y0);
            const x = p.x0 + (p.x1 - p.x0) * u;
            const y = p.y0 + (p.y1 - p.y0) * u - p.arc * dist * 4 * u * (1 - u);
            const px = this.sx(x, cw), py = this.sy(y, ch);
            if (p.kind === 'arrow') {
                const u2 = Math.max(0, u - 0.06);
                const x2 = p.x0 + (p.x1 - p.x0) * u2;
                const y2 = p.y0 + (p.y1 - p.y0) * u2 - p.arc * dist * 4 * u2 * (1 - u2);
                ctx.strokeStyle = p.ignite ? 'rgba(255,170,60,0.95)' : 'rgba(40,30,20,0.85)';
                ctx.lineWidth = Math.max(1, 1.8 * z);
                ctx.beginPath();
                ctx.moveTo(this.sx(x2, cw), this.sy(y2, ch));
                ctx.lineTo(px, py);
                ctx.stroke();
            } else if (p.kind === 'cannon') {
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.arc(px, py, Math.max(2, 5 * z), 0, Math.PI * 2);
                ctx.fill();
            } else if (p.kind === 'trebuchet') {
                // 石弹 + 海面上的影子（拱得越高影子越远）
                ctx.fillStyle = 'rgba(0,0,0,0.25)';
                const shx = this.sx(p.x0 + (p.x1 - p.x0) * u, cw), shy = this.sy(p.y0 + (p.y1 - p.y0) * u, ch);
                ctx.beginPath();
                ctx.ellipse(shx, shy, 9 * z, 4 * z, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#8a8378';
                ctx.beginPath();
                ctx.arc(px, py, Math.max(3, 9 * z), 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 希腊火：火球拖尾
                for (let k = 0; k < 4; k++) {
                    const uk = Math.max(0, u - k * 0.05);
                    const xk = p.x0 + (p.x1 - p.x0) * uk;
                    const yk = p.y0 + (p.y1 - p.y0) * uk - p.arc * dist * 4 * uk * (1 - uk);
                    ctx.fillStyle = k === 0 ? 'rgba(255,235,140,0.95)' : `rgba(255,${120 - k * 20},30,${(0.7 - k * 0.15).toFixed(2)})`;
                    ctx.beginPath();
                    ctx.arc(this.sx(xk, cw), this.sy(yk, ch), Math.max(2, (9 - k * 1.6) * z), 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    private drawFx(ctx: CanvasRenderingContext2D, cw: number, ch: number): void {
        const z = this.cam.z;
        for (const f of this.fx) {
            const px = this.sx(f.x, cw), py = this.sy(f.y, ch);
            switch (f.k) {
                case 'splash': {
                    const k = f.t / 0.8;
                    const big = f.big ? 1.8 : 1;
                    ctx.strokeStyle = `rgba(240,250,255,${(0.8 * (1 - k)).toFixed(3)})`;
                    ctx.lineWidth = Math.max(1, 2.5 * z);
                    ctx.beginPath();
                    ctx.ellipse(px, py, (8 + k * 30) * z * big, (3 + k * 12) * z * big, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    if (f.big) {
                        // 水柱
                        const hgt = Math.sin(Math.min(1, k * 1.4) * Math.PI) * 70 * z;
                        ctx.fillStyle = `rgba(235,248,255,${(0.75 * (1 - k)).toFixed(3)})`;
                        ctx.beginPath();
                        ctx.ellipse(px, py - hgt / 2, 9 * z, hgt / 2 + 1, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                }
                case 'spark': {
                    const k = f.t / 0.8;
                    for (let i = 0; i < 5; i++) {
                        const a = i * 1.26 + f.x;
                        const r = k * 30 * z;
                        ctx.fillStyle = i % 2 ? `rgba(255,200,90,${(1 - k).toFixed(3)})` : `rgba(110,75,40,${(1 - k).toFixed(3)})`;
                        ctx.fillRect(px + Math.cos(a) * r, py + Math.sin(a) * r - 20 * z * k, 4 * z, 4 * z);
                    }
                    break;
                }
                case 'muzzle': {
                    const k = f.t / 0.35;
                    ctx.fillStyle = `rgba(255,220,120,${(1 - k).toFixed(3)})`;
                    ctx.beginPath();
                    ctx.arc(px, py - 10 * z, (14 + k * 10) * z, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = `rgba(200,200,200,${(0.5 * (1 - k)).toFixed(3)})`;
                    ctx.beginPath();
                    ctx.arc(px, py - 20 * z - k * 30 * z, (20 + k * 30) * z, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'boom': {
                    const life = f.big ? 2.2 : 1.0;
                    const k = f.t / life;
                    const R = (f.big ? 130 : 55) * z;
                    ctx.fillStyle = `rgba(255,170,60,${(0.85 * (1 - k)).toFixed(3)})`;
                    ctx.beginPath();
                    ctx.arc(px, py - 20 * z, R * (0.3 + k * 0.7), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = `rgba(70,60,55,${(0.6 * (1 - k)).toFixed(3)})`;
                    ctx.beginPath();
                    ctx.arc(px, py - 40 * z - k * 60 * z, R * (0.4 + k), 0, Math.PI * 2);
                    ctx.fill();
                    // 碎木
                    for (let i = 0; i < (f.big ? 12 : 6); i++) {
                        const a = i * 0.9 + f.y;
                        const r = k * R * 1.4;
                        ctx.fillStyle = `rgba(90,60,30,${(1 - k).toFixed(3)})`;
                        ctx.fillRect(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.6 - Math.sin(k * Math.PI) * 50 * z, 6 * z, 3 * z);
                    }
                    break;
                }
                case 'ring': {
                    const k = f.t / 1.4;
                    ctx.strokeStyle = f.color;
                    ctx.globalAlpha = 1 - k;
                    ctx.lineWidth = Math.max(2, 6 * z);
                    ctx.beginPath();
                    ctx.ellipse(px, py, (60 + k * 80) * z, (30 + k * 40) * z, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                    break;
                }
                case 'text': {
                    const k = f.t / 1.8;
                    const size = Math.max(22, 40 * Math.max(z, 0.6));
                    ctx.font = `bold ${size}px "Microsoft YaHei","PingFang SC",sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.lineWidth = size / 7;
                    ctx.strokeStyle = `rgba(0,0,0,${(0.8 * (1 - k)).toFixed(3)})`;
                    ctx.globalAlpha = 1 - k * k;
                    ctx.strokeText(f.text, px, py - k * 50 * z);
                    ctx.fillStyle = f.color;
                    ctx.fillText(f.text, px, py - k * 50 * z);
                    ctx.globalAlpha = 1;
                    break;
                }
            }
        }
    }

    /** 船顶血条；旗舰挂将旗名 */
    private drawShipBadge(ctx: CanvasRenderingContext2D, s: NavalShip, cw: number, ch: number): void {
        if (s.state !== 'alive' || !this.init) return;
        const z = this.cam.z;
        const px = this.sx(s.x, cw), py = this.sy(s.y, ch);
        const w = (s.role === 'flag' ? 120 : 84) * z;
        const y = py - 110 * z;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(px - w / 2 - 2, y - 2, w + 4, Math.max(5, 10 * z) + 4);
        ctx.fillStyle = this.colors[s.side];
        ctx.fillRect(px - w / 2, y, w * Math.max(0, s.hp / s.maxHp), Math.max(5, 10 * z));
        if (s.boardingWith !== null) {
            // 接舷中：显示船上剩多少人
            ctx.fillStyle = '#f2e6c8';
            ctx.fillRect(px - w / 2, y + 12 * z, w * Math.max(0, s.crew / s.maxCrew), Math.max(3, 5 * z));
        }
        if (s.role === 'flag') {
            const size = Math.max(22, 34 * Math.max(z, 0.65));
            ctx.font = `bold ${size}px "Microsoft YaHei","PingFang SC",sans-serif`;
            ctx.textAlign = 'center';
            const label = `帅·${this.init[s.side].generalName || this.init[s.side].name}`;
            ctx.lineWidth = size / 6;
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.strokeText(label, px, y - 12 * z);
            ctx.fillStyle = this.colors[s.side];
            ctx.fillText(label, px, y - 12 * z);
        }
    }

    private drawHud(ctx: CanvasRenderingContext2D, cw: number, ch: number, dpr: number): void {
        const sim = this.sim!;
        const init = this.init!;
        const u = Math.max(0.6, Math.min(2, (ch / dpr) / 1440)) * dpr;   // 主人 2560×1440 为基准
        const left: NavalSide = this.flip ? 'defender' : 'attacker';
        const right: NavalSide = this.flip ? 'attacker' : 'defender';
        const font = (px: number) => `bold ${Math.round(px * u)}px "Microsoft YaHei","PingFang SC",sans-serif`;

        // 顶栏：双方名 + 船数 + 船力条
        const barW = 620 * u, barH = 26 * u, top = 36 * u;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(cw / 2 - barW - 60 * u, top - 10 * u, barW * 2 + 120 * u, 150 * u);
        const total = (side: NavalSide) => {
            let hp = 0, max = 0;
            for (const s of sim.ships) {
                if (s.origSide === side) max += s.maxHp;
                if (s.side === side && s.state === 'alive') hp += s.hp;
            }
            return max > 0 ? Math.min(1, hp / max) : 0;
        };
        for (const side of [left, right]) {
            const isLeft = side === left;
            const x0 = isLeft ? cw / 2 - 40 * u - barW : cw / 2 + 40 * u;
            ctx.font = font(44);
            ctx.textAlign = isLeft ? 'left' : 'right';
            ctx.fillStyle = this.colors[side];
            ctx.fillText(init[side].name, isLeft ? x0 : x0 + barW, top + 38 * u);
            ctx.font = font(36);
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = isLeft ? 'right' : 'left';
            ctx.fillText(`⛵ ${sim.countAlive(side)}`, isLeft ? x0 + barW : x0, top + 38 * u);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(x0, top + 58 * u, barW, barH);
            ctx.fillStyle = this.colors[side];
            const f = total(side);
            if (isLeft) ctx.fillRect(x0 + barW * (1 - f), top + 58 * u, barW * f, barH);
            else ctx.fillRect(x0, top + 58 * u, barW * f, barH);
        }
        ctx.font = font(48);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe9b0';
        ctx.fillText('VS', cw / 2, top + 50 * u);
        ctx.font = font(32);
        ctx.fillStyle = '#e6e6e6';
        const remain = Math.max(0, NAVAL_TIME_LIMIT - sim.time);
        ctx.fillText(`${PHASE_LABEL[sim.phase]} · ${Math.floor(remain / 60)}:${String(Math.floor(remain % 60)).padStart(2, '0')}`, cw / 2, top + 122 * u);

        // 风向罗盘（右上）
        const cx = cw - 150 * u, cy = 150 * u, R = 80 * u;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath(); ctx.arc(cx, cy, R + 14 * u, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2 * u;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        ctx.font = font(24);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('北', cx, cy - R + 26 * u);
        const wa = this.screenHeading(sim.windAng);
        const ax = Math.cos(wa), ay = Math.sin(wa);
        ctx.strokeStyle = '#9fd4ff';
        ctx.fillStyle = '#9fd4ff';
        ctx.lineWidth = 8 * u;
        ctx.beginPath();
        ctx.moveTo(cx - ax * R * 0.7, cy - ay * R * 0.7);
        ctx.lineTo(cx + ax * R * 0.55, cy + ay * R * 0.55);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + ax * R * 0.85, cy + ay * R * 0.85);
        ctx.lineTo(cx + ax * R * 0.45 - ay * R * 0.28, cy + ay * R * 0.45 + ax * R * 0.28);
        ctx.lineTo(cx + ax * R * 0.45 + ay * R * 0.28, cy + ay * R * 0.45 - ax * R * 0.28);
        ctx.closePath();
        ctx.fill();
        const ww = sim.windwardSide();
        ctx.font = font(32);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(windName(sim.windAng), cx, cy + R + 50 * u);
        if (ww) {
            ctx.font = font(26);
            ctx.fillStyle = this.colors[ww];
            ctx.fillText(`上风：${init[ww].name}`, cx, cy + R + 86 * u);
        }

        // 播报字幕（顶栏下方，新的在下）
        let ty = top + 210 * u;
        for (const t of this.toasts) {
            const a = t.t < 0.25 ? t.t / 0.25 : t.t > 3.8 ? Math.max(0, 1 - (t.t - 3.8) / 0.7) : 1;
            ctx.globalAlpha = a;
            ctx.font = font(50);
            ctx.textAlign = 'center';
            ctx.lineWidth = 9 * u;
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.strokeText(t.text, cw / 2, ty);
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, cw / 2, ty);
            ctx.globalAlpha = 1;
            ty += 66 * u;
        }
    }
}
