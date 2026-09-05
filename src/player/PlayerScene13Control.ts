/**
 * PlayerScene13Control —— 战术模式（13）里的玩家输入与指挥条。
 *
 *   · WASD / 方向键：移动玩家（屏幕方向，左右对调由 Scene13WarLayer 自己换算）
 *   · 点战场地面：玩家前往该点
 *   · Q：受控编队全军攻击（自动索敌）；E：待命（不移动，够得着照打）
 *   · 指挥条（底部居中）：官阶 / 本场击杀 / 攻击·待命按钮 / 受控编队数
 */
import type { PlayerHero } from './PlayerHero';

export interface Scene13PlayerApi {
    isActive(): boolean;
    hasPlayerHero(): boolean;
    setHeroInput(v: { dx: number; dy: number } | null): void;
    setHeroMoveToScreen(x: number, y: number): void;
    setPlayerCommand(cmd: 'attack' | 'hold'): void;
    getPlayerBattleState(): {
        heroAlive: boolean;
        heroHp: number;
        heroMaxHp: number;
        controlledLanes: number;
        controlledMen: number;
        command: 'attack' | 'hold';
        kills: number;
    } | null;
}

const FONT = "'Noto Serif SC', 'SimSun', 'Songti SC', serif";

export class PlayerScene13Control {
    private bar: HTMLDivElement | null = null;
    private info: HTMLSpanElement | null = null;
    private btnAttack: HTMLButtonElement | null = null;
    private btnHold: HTMLButtonElement | null = null;
    private keys = new Set<string>();
    private timer: number | null = null;

    constructor(private hero: PlayerHero, private scene: Scene13PlayerApi) {
        this.createBar();
        document.addEventListener('keydown', (e) => this.onKey(e, true));
        document.addEventListener('keyup', (e) => this.onKey(e, false));
        window.addEventListener('blur', () => { this.keys.clear(); this.pushInput(); });
        document.addEventListener('mousedown', (e) => this.onMouseDown(e), true);
        this.timer = window.setInterval(() => this.refresh(), 200);
    }

    /** 玩家是否正在战术模式里操作（GameInputManager 据此让出 WASD） */
    public isControlling(): boolean {
        return this.scene.isActive() && this.scene.hasPlayerHero();
    }

    private inTextInput(): boolean {
        const tag = document.activeElement?.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    }

    private onKey(e: KeyboardEvent, down: boolean): void {
        if (!this.isControlling() || this.inTextInput()) {
            if (this.keys.size) { this.keys.clear(); this.pushInput(); }
            return;
        }
        const k = e.key.toLowerCase();
        const moveKeys: Record<string, string> = {
            w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down',
            a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right',
        };
        if (moveKeys[k]) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (down) this.keys.add(moveKeys[k]); else this.keys.delete(moveKeys[k]);
            this.pushInput();
            return;
        }
        if (!down) return;
        if (k === 'q') { this.scene.setPlayerCommand('attack'); this.refresh(); e.preventDefault(); }
        else if (k === 'e') { this.scene.setPlayerCommand('hold'); this.refresh(); e.preventDefault(); }
    }

    private pushInput(): void {
        if (!this.keys.size) { this.scene.setHeroInput(null); return; }
        let dx = 0, dy = 0;
        if (this.keys.has('left')) dx -= 1;
        if (this.keys.has('right')) dx += 1;
        if (this.keys.has('up')) dy -= 1;
        if (this.keys.has('down')) dy += 1;
        if (!dx && !dy) { this.scene.setHeroInput(null); return; }
        const l = Math.hypot(dx, dy) || 1;
        this.scene.setHeroInput({ dx: dx / l, dy: dy / l });
    }

    private onMouseDown(e: MouseEvent): void {
        if (e.button !== 0 || !this.isControlling()) return;
        const t = e.target as HTMLElement | null;
        // 只认战场地面（13 画布 pointer-events:none，点击落到底下的地图容器上）；按钮/面板照常
        if (!t || !(t.id === 'map' || t.closest('#map') || t.tagName === 'CANVAS')) return;
        e.preventDefault();
        e.stopPropagation();
        this.scene.setHeroMoveToScreen(e.clientX, e.clientY);
    }

    // ── 指挥条 ────────────────────────────────────────────
    private createBar(): void {
        const bar = document.createElement('div');
        bar.id = 'player-scene13-bar';
        bar.style.cssText = `
            position:fixed; bottom:18px; left:50%; transform:translateX(-50%); z-index:10055; display:none;
            align-items:center; gap:10px; padding:8px 14px; font-family:${FONT}; font-size:13px; color:#f5e6c8;
            background:linear-gradient(180deg, rgba(28,22,16,0.94) 0%, rgba(12,10,8,0.96) 100%);
            border:1px solid rgba(212,175,55,0.6); border-radius:10px; pointer-events:auto; user-select:none;
            box-shadow:0 2px 12px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,215,0,0.25); white-space:nowrap;`;
        const info = document.createElement('span');
        bar.appendChild(info);
        const mk = (label: string, cmd: 'attack' | 'hold') => {
            const b = document.createElement('button');
            b.textContent = label;
            b.style.cssText = `
                padding:4px 12px; cursor:pointer; font-family:inherit; font-weight:900; font-size:13px; color:#f5e6c8;
                background:rgba(255,255,255,0.06); border:1px solid rgba(212,175,55,0.5); border-radius:6px;`;
            b.addEventListener('click', () => { this.scene.setPlayerCommand(cmd); this.refresh(); });
            bar.appendChild(b);
            return b;
        };
        this.btnAttack = mk('Q 攻击', 'attack');
        this.btnHold = mk('E 待命', 'hold');
        const hint = document.createElement('span');
        hint.style.cssText = 'font-size:11px; color:#c9b58a;';
        hint.textContent = 'WASD 移动 · 点地面前往';
        bar.appendChild(hint);
        document.body.appendChild(bar);
        this.bar = bar;
        this.info = info;
    }

    private refresh(): void {
        if (!this.bar || !this.info) return;
        const st = this.isControlling() ? this.scene.getPlayerBattleState() : null;
        if (!st) {
            this.bar.style.display = 'none';
            return;
        }
        this.bar.style.display = 'flex';
        const rank = this.hero.getRank();
        const hp = Math.max(0, Math.round(st.heroHp));
        const ctl = st.controlledLanes > 0
            ? `指挥 ${st.controlledLanes} 队 ${st.controlledMen} 人`
            : '只管自己';
        this.info.innerHTML =
            `<b style="color:#ffd27a;">${this.hero.name}</b> · ${rank.name} · `
            + `血 ${st.heroAlive ? `${hp}/${Math.round(st.heroMaxHp)}` : '落马'} · `
            + `本场斩 <b>${st.kills}</b> · 功勋 ${this.hero.merit} · ${ctl}`;
        const on = 'rgba(212,175,55,0.35)';
        const off = 'rgba(255,255,255,0.06)';
        if (this.btnAttack) this.btnAttack.style.background = st.command === 'attack' ? on : off;
        if (this.btnHold) this.btnHold.style.background = st.command === 'hold' ? on : off;
        const disabled = st.controlledLanes === 0;
        if (this.btnAttack) this.btnAttack.disabled = disabled;
        if (this.btnHold) this.btnHold.disabled = disabled;
    }

    public dispose(): void {
        if (this.timer) window.clearInterval(this.timer);
        this.bar?.remove();
    }
}
