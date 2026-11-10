/**
 * PlayerScene13Control —— 战术模式（13）里的玩家输入与指挥条（玩家面板）。
 *
 *   · 🔴 [2026-10-08 主人定] 玩家不能点击移动、也不能 WASD，只有「自动 / 待命」两态
 *   · Q：受控编队全军攻击（自动索敌）；E：待命（不移动，够得着照打）
 *   · 退出战斗：按当前战况自动结算战果并退出
 *   · 指挥条/玩家面板（顶部居中）：官阶 / 本场击杀 / 攻击·待命·退出战斗按钮 / 受控编队数
 */
import type { PlayerHero } from './PlayerHero';

export interface Scene13PlayerApi {
    isActive(): boolean;
    hasPlayerHero(): boolean;
    setHeroInput(v: { dx: number; dy: number } | null): void;
    setHeroMoveToScreen(x: number, y: number): void;
    setPlayerCommand(cmd: 'attack' | 'hold'): void;
    requestExitWithResult(): void;
    getRemainingSec(): number;
    getPlayerBattleState(): {
        heroAlive: boolean;
        heroHp: number;
        heroMaxHp: number;
        heroRespawnSec?: number;
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
    private countdownEl: HTMLSpanElement | null = null;
    private btnAttack: HTMLButtonElement | null = null;
    private btnHold: HTMLButtonElement | null = null;
    private btnExit: HTMLButtonElement | null = null;
    private btnVeto: HTMLButtonElement | null = null;
    private hint: HTMLSpanElement | null = null;
    private zoomSlider: HTMLInputElement | null = null;
    private zoomLabel: HTMLSpanElement | null = null;
    private keys = new Set<string>();
    private timer: number | null = null;

    constructor(
        private hero: PlayerHero,
        private scene: Scene13PlayerApi,
        /** 直播观众改名的主播一键否决（战略地图 HUD 在打仗时隐藏，战术顶栏也要有）；
         *  🔴 [2026-11-10 主人令「乱入者前面有一个旗帜旗号，请删除，改为玩家加入的势力名」]
         *     顶栏不再画旗，改显示玩家所属势力全名 —— 名字从 CityManager/FactionManager 取 */
        private hud?: {
            hasViewerRename(): boolean;
            vetoViewerRename(): void;
            getFactionName?(id: string): string;
        },
    ) {
        this.createBar();
        document.addEventListener('keydown', (e) => this.onKey(e, true));
        document.addEventListener('keyup', (e) => this.onKey(e, false));
        window.addEventListener('blur', () => { this.keys.clear(); this.pushInput(); });
        document.addEventListener('mousedown', (e) => this.onMouseDown(e), true);
        this.timer = window.setInterval(() => this.refresh(), 200);
    }

    private getZoomBounds(): { min: number; max: number } {
        const s = this.scene as any;
        return { min: s?.useGroundGL ? 0.45 : 0.5, max: 2.5 };
    }

    private getTacticalZoom(): number {
        const s = this.scene as any;
        return typeof s?.tacticalZoom === 'number' ? s.tacticalZoom : 1.0;
    }

    private setTacticalZoom(nextZoom: number): void {
        const s = this.scene as any;
        if (!s) return;
        const { min, max } = this.getZoomBounds();
        const clamped = Math.max(min, Math.min(max, nextZoom));
        s.setTacticalZoomKeepCenter(clamped);
        if (typeof s.syncDeCityGround === 'function') s.syncDeCityGround();
        this.syncZoomUI();
    }

    private syncZoomUI(): void {
        const z = this.getTacticalZoom();
        const { min, max } = this.getZoomBounds();
        if (this.zoomSlider) {
            this.zoomSlider.min = String(min);
            this.zoomSlider.max = String(max);
            this.zoomSlider.value = String(z);
        }
        if (this.zoomLabel) {
            this.zoomLabel.textContent = `${Math.round(z * 100)}%`;
        }
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
        const k = (e.key ?? '').toLowerCase();   // 自动填充 / 扩展的假按键没有 key，见 GameMap.initKeyboardNavigation
        const moveKeys: Record<string, string> = {
            w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down',
            a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right',
        };
        if (moveKeys[k]) {
            // 🔴 [2026-10-08 主人「玩家不能点击移动，也不能WASD，只能自动和待命」] 只拦截按键（免得平移底下的地图），不再驱动玩家移动
            e.preventDefault();
            e.stopImmediatePropagation();
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
        e.stopPropagation();   // 🔴 [2026-10-08] 点地面不再前往，只吞掉点击
    }

    // ── 指挥条 / 战术模式玩家面板 ────────────────────────────
    private createBar(): void {
        const bar = document.createElement('div');
        bar.id = 'player-scene13-bar';
        // 🔴 [2026-10-29 主人令「还是改为两行吧，把弹幕控将开始，为第二行」]
        // 采用 flex-wrap:wrap：第一行容纳 CombatUI 插入的 battleTitle + 玩家信息与操作按钮，
        // 第二行由 ViewerLivePanel（flex-basis:100%）独占一行
        bar.style.cssText = `
            position:fixed; top:0; left:50%; transform:translateX(-50%); z-index:10055; display:none;
            flex-wrap:nowrap; justify-content:center; align-items:center; gap:6px; width:max-content; max-width:96vw;
            padding:3px 10px; font-family:${FONT}; font-size:12.5px; color:#f5e6c8;
            background:linear-gradient(180deg, rgba(28,22,16,0.94) 0%, rgba(12,10,8,0.96) 100%);
            border:1px solid rgba(212,175,55,0.6); border-radius:0 0 10px 10px; pointer-events:auto; user-select:none;
            box-shadow:0 2px 12px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,215,0,0.25); white-space:nowrap;`;
        const info = document.createElement('span');
        bar.appendChild(info);
        const btnVeto = document.createElement('button');
        btnVeto.textContent = '否决';
        btnVeto.title = '一键否决观众改名，恢复上一个名字，出价积分不退';
        btnVeto.style.cssText = 'display:none; cursor:pointer; background:rgba(120,32,32,0.85); border:1px solid rgba(235,110,110,0.65); color:#ffd8d8; font-family:inherit; font-size:12px; padding:2px 8px; border-radius:4px;';
        btnVeto.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hud?.vetoViewerRename();
            this.refresh();
        });
        bar.appendChild(btnVeto);
        this.btnVeto = btnVeto;
        const countdown = document.createElement('span');
        countdown.title = '战术模式 9 分钟倒计时（到时未攻下城池则算打平）';
        countdown.style.cssText = `
            padding:2px 7px; font-weight:900; font-size:12.5px; color:#ffd27a;
            background:rgba(212,175,55,0.14); border:1px solid rgba(212,175,55,0.55); border-radius:5px;`;
        countdown.textContent = '⏳ 9:00';
        bar.appendChild(countdown);
        this.countdownEl = countdown;
        const mk = (label: string, cmd: 'attack' | 'hold') => {
            const b = document.createElement('button');
            b.textContent = label;
            b.style.cssText = `
                padding:2px 8px; cursor:pointer; font-family:inherit; font-weight:900; font-size:12px; color:#f5e6c8;
                background:rgba(255,255,255,0.06); border:1px solid rgba(212,175,55,0.5); border-radius:5px;`;
            b.addEventListener('click', () => { this.scene.setPlayerCommand(cmd); this.refresh(); });
            bar.appendChild(b);
            return b;
        };
        // 🔴 [2026-09-09 主人定「设置两个选项，自动和待命」「默认自动」]
        //    自动 = 玩家本人与受控编队一起索敌开打；待命 = 都不主动动，够得着才还手。
        this.btnAttack = mk('Q 自动', 'attack');
        this.btnHold = mk('E 待命', 'hold');

        // 🔴 [2026-10-11 主人令「在上方的玩家面板中，给战术模式添加一个地图缩放功能」]
        const zoomWrap = document.createElement('div');
        zoomWrap.style.cssText = `
            display:inline-flex; align-items:center; gap:5px; padding:2px 8px;
            background:rgba(255,255,255,0.04); border:1px solid rgba(212,175,55,0.45); border-radius:6px;`;
        const mkZoomBtn = (txt: string, title: string, delta: number) => {
            const b = document.createElement('button');
            b.textContent = txt;
            b.title = title;
            b.style.cssText = `
                width:22px; height:22px; line-height:20px; padding:0; cursor:pointer;
                font-family:inherit; font-weight:900; font-size:14px; color:#ffd27a;
                background:rgba(255,255,255,0.08); border:1px solid rgba(212,175,55,0.5); border-radius:4px;`;
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setTacticalZoom(this.getTacticalZoom() + delta);
            });
            return b;
        };
        const btnZoomOut = mkZoomBtn('−', '缩小战场画面', -0.15);
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0.45';
        slider.max = '2.5';
        slider.step = '0.05';
        slider.value = '1';
        slider.title = '拖动缩放战术地图视角';
        slider.style.cssText = 'width:54px; height:14px; cursor:pointer; accent-color:#d4af37; margin:0;';
        slider.addEventListener('input', (e) => {
            e.stopPropagation();
            this.setTacticalZoom( parseFloat(slider.value) || 1.0 );
        });
        const btnZoomIn = mkZoomBtn('+', '放大战场画面', 0.15);
        const zoomLabel = document.createElement('span');
        zoomLabel.textContent = '100%';
        zoomLabel.title = '点击重置为 100% 默认缩放';
        zoomLabel.style.cssText = 'min-width:38px; text-align:right; font-size:12px; font-weight:700; color:#ffd27a; cursor:pointer;';
        zoomLabel.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setTacticalZoom(1.0);
        });
        zoomWrap.appendChild(btnZoomOut);
        zoomWrap.appendChild(slider);
        zoomWrap.appendChild(btnZoomIn);
        zoomWrap.appendChild(zoomLabel);
        bar.appendChild(zoomWrap);
        this.zoomSlider = slider;
        this.zoomLabel = zoomLabel;

        // 🔴 [2026-09-10 主人定] 战术模式退出战斗按钮移入战术模式玩家面板
        const btnExit = document.createElement('button');
        btnExit.textContent = '退出';
        btnExit.title = '点击后按当前战况自动结算战果并退出';
        btnExit.style.cssText = `
            padding:2px 8px; cursor:pointer; font-family:inherit; font-weight:900; font-size:12px; color:#f5e6c8;
            background:linear-gradient(180deg, rgba(60,20,20,0.85) 0%, rgba(30,10,10,0.9) 100%);
            border:1px solid rgba(212,175,55,0.6); border-radius:5px; transition:all 0.2s ease;
            box-shadow:0 1px 4px rgba(0,0,0,0.4);`;
        btnExit.addEventListener('mouseenter', () => {
            btnExit.style.borderColor = '#ffd700';
            btnExit.style.color = '#ffffff';
            btnExit.style.boxShadow = '0 0 8px rgba(255,215,0,0.4)';
        });
        btnExit.addEventListener('mouseleave', () => {
            btnExit.style.borderColor = 'rgba(212,175,55,0.6)';
            btnExit.style.color = '#f5e6c8';
            btnExit.style.boxShadow = '0 1px 4px rgba(0,0,0,0.4)';
        });
        btnExit.addEventListener('click', (e) => {
            e.stopPropagation();
            btnExit.disabled = true;
            this.scene.requestExitWithResult();
        });
        bar.appendChild(btnExit);
        this.btnExit = btnExit;

        const hint = document.createElement('span');
        hint.style.cssText = 'font-size:11px; color:#c9b58a;';
        hint.textContent = 'Q 自动 · E 待命（原地可攻击）';
        bar.appendChild(hint);
        this.hint = hint;

        document.body.appendChild(bar);
        this.bar = bar;
        this.info = info;
    }

    public refresh(): void {
        if (!this.bar || !this.info) return;
        if (!this.scene.isActive()) {
            this.bar.style.display = 'none';
            if (this.btnExit) this.btnExit.disabled = false;
            return;
        }
        this.bar.style.display = 'flex';
        this.syncZoomUI();
        if (this.countdownEl) {
            const rem = this.scene.getRemainingSec();
            this.countdownEl.textContent = `⏳ ${Math.floor(rem / 60)}:${String(rem % 60).padStart(2, '0')}`;
            this.countdownEl.style.color = rem <= 60 ? '#ff6b6b' : '#ffd27a';
            this.countdownEl.style.borderColor = rem <= 60 ? 'rgba(255,107,107,0.75)' : 'rgba(212,175,55,0.55)';
        }
        // 🔴 [2026-11-10 主人令「乱入者前面有一个旗帜旗号，请删除。改为玩家加入的势力名」]
        //    原来这里画一面势力旗（旗面＋旗号字），现已删除，只显示玩家所属势力的名字。
        let factionHtml = '';
        if (this.hero.factionId) {
            const factionName = this.hud?.getFactionName?.(this.hero.factionId) ?? '';
            if (factionName) {
                factionHtml = `<span style="color:#7cd4a0; font-weight:700; margin-right:4px;">${factionName}</span>`;
            }
        }
        const st = this.isControlling() ? this.scene.getPlayerBattleState() : null;
        if (st) {
            const rank = this.hero.getRank();
            const hp = Math.max(0, Math.round(st.heroHp));
            const ctlMap: Record<'none' | 'one' | 'front' | 'all', string> = {
                none: '单枪匹马',
                one: '率队前驱',
                front: '独当一面',
                all: '节制三军',
            };
            const ctl = ctlMap[rank.control] || '单枪匹马';
            const respawnSec = Math.ceil(st.heroRespawnSec ?? 0);
            const hpText = st.heroAlive
                ? `血 ${hp}/${Math.round(st.heroMaxHp)}`
                : (respawnSec > 0
                    ? `<span style="color:#ff6b6b; font-weight:900;">阵亡（${respawnSec}秒后复活）</span>`
                    : '<span style="color:#ff8585; font-weight:900;">阵亡复活中</span>');
            this.info.title = `统率权限：${ctl}`;
            this.info.innerHTML =
                `${factionHtml}<b style="color:#ffd27a;">${this.hero.name}</b>·${rank.title}·`
                + `${hpText}·`
                + `斩<b>${st.kills}</b>·功${this.hero.merit}`;
            const on = 'rgba(212,175,55,0.35)';
            const off = 'rgba(255,255,255,0.06)';
            if (this.btnAttack) {
                this.btnAttack.style.display = 'inline-block';
                this.btnAttack.style.background = st.command === 'attack' ? on : off;
                this.btnAttack.disabled = false;
            }
            if (this.btnHold) {
                this.btnHold.style.display = 'inline-block';
                this.btnHold.style.background = st.command === 'hold' ? on : off;
                this.btnHold.disabled = false;
            }
            if (this.hint) this.hint.style.display = 'none';
        } else {
            this.info.innerHTML =
                `${factionHtml}<b style="color:#ffd27a;">${this.hero.name}</b> · 观战中`;
            if (this.btnAttack) this.btnAttack.style.display = 'none';
            if (this.btnHold) this.btnHold.style.display = 'none';
            if (this.hint) this.hint.style.display = 'none';
        }
        if (this.btnExit) this.btnExit.style.display = 'inline-block';
        if (this.btnVeto) this.btnVeto.style.display = this.hud?.hasViewerRename() ? 'inline-block' : 'none';
    }

    public dispose(): void {
        if (this.timer) window.clearInterval(this.timer);
        this.bar?.remove();
    }
}
