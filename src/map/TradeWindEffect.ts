/**
 * 信风航段特效（2026-11-09 主人令）：玩家「环球 / 航行」走马尼拉大帆船航线
 * 阿卡普尔科 → 关岛这一跳时，画面上一道道向西吹的风纹 + 持续风声，到站淡出。
 *
 * 史实：大帆船自阿卡普尔科西行，乘北纬 10~15° 的东北信风一路顺风约三个月抵关岛，
 * 海况平稳，西班牙人称这片海为「Mar de las Damas（贵妇之海）」。返程须北上借西风，艰苦得多。
 * 航速加成（×1.5）在 PlayerHero.syncMoveProfile，本模块只管画面和声音。
 *
 * 只在航段进行中跑 rAF；平时零开销。层级 646：低于天气(648)，高于飞鸟(645)与地面部队(620)。
 */
import L from 'leaflet';
import { audioManager } from '../audio/AudioManager';

const PANE = 'tradeWindPane';
const STREAKS = 70;
const FADE_IN_MS = 1500;
const FADE_OUT_MS = 2500;
const FRAME_MS = 1000 / 30;

interface Streak { u: number; v: number; speed: number; len: number; phase: number; alpha: number }

class TradeWindEffect {
    private map: L.Map | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private rafId: number | null = null;
    private active = false;
    /** 0~1 的整体强度：淡入淡出都靠它 */
    private level = 0;
    private lastAt = 0;
    private lastDrawAt = 0;
    private readonly streaks: Streak[] = [];

    constructor() {
        // 预分配，全程零 GC；用黄金分割散布避免成团
        for (let i = 0; i < STREAKS; i++) {
            this.streaks.push({
                u: (i * 0.61803398875) % 1,
                v: (i * 0.38196601125 + 0.05) % 1,
                speed: 0.75 + ((i * 17) % 19) / 30,
                len: 60 + ((i * 23) % 13) * 9,
                phase: (i * 1.37) % (Math.PI * 2),
                alpha: 0.10 + ((i * 7) % 11) / 70,
            });
        }
    }

    public isActive(): boolean { return this.active; }

    public start(): void {
        if (this.active) return;
        const map = (window as unknown as { game?: { map?: { getLeafletMap?: () => L.Map } } }).game?.map?.getLeafletMap?.();
        if (!map) return;
        this.active = true;
        this.ensureCanvas(map);
        audioManager.setTradeWindLoop(true);
        if (this.rafId === null) {
            this.lastAt = performance.now();
            this.rafId = requestAnimationFrame(this.tick);
        }
    }

    /** 到站 / 改走别处：风纹淡出、风声渐停（淡完自动停 rAF） */
    public stop(): void {
        if (!this.active) return;
        this.active = false;
        audioManager.setTradeWindLoop(false);
    }

    private ensureCanvas(map: L.Map): void {
        if (this.map === map && this.canvas) return;
        this.map = map;
        if (!map.getPane(PANE)) {
            map.createPane(PANE);
            const pane = map.getPane(PANE)!;
            pane.style.zIndex = '646';
            pane.style.pointerEvents = 'none';
        }
        const c = document.createElement('canvas');
        c.className = 'trade-wind-canvas';
        c.style.position = 'absolute';
        c.style.pointerEvents = 'none';
        map.getPane(PANE)!.appendChild(c);
        this.canvas = c;
        this.ctx = c.getContext('2d');
    }

    private tick = (now: number): void => {
        const dt = Math.min(0.1, (now - this.lastAt) / 1000);
        this.lastAt = now;
        const target = this.active ? 1 : 0;
        const rate = 1000 / (this.active ? FADE_IN_MS : FADE_OUT_MS);
        this.level = target > this.level
            ? Math.min(1, this.level + dt * rate)
            : Math.max(0, this.level - dt * rate);

        if (!this.active && this.level <= 0) {
            if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.rafId = null;
            return;
        }
        this.rafId = requestAnimationFrame(this.tick);
        if (now - this.lastDrawAt < FRAME_MS) return;
        this.lastDrawAt = now;
        this.draw(now / 1000);
    };

    private draw(t: number): void {
        const map = this.map, c = this.canvas, g = this.ctx;
        if (!map || !c || !g) return;
        // 战术演出在前景时不画（战略层整体冻结的设计），但保留淡入淡出状态
        const war = (window as unknown as { game?: { scene13War?: { active?: boolean } } }).game?.scene13War;
        if (war?.active) return;
        const size = map.getSize();
        if (c.width !== size.x || c.height !== size.y) {
            c.width = size.x; c.height = size.y;
            c.style.width = size.x + 'px'; c.style.height = size.y + 'px';
        }
        // 画布贴住视口：跟拍时地图面板在平移，这里每帧把画布挪回屏幕左上角
        L.DomUtil.setPosition(c, map.containerPointToLayerPoint([0, 0]));

        const cw = c.width, ch = c.height;
        g.clearRect(0, 0, cw, ch);
        const k = this.level;
        g.lineCap = 'round';
        g.lineWidth = 1.4;
        const span = cw + 260;
        for (const s of this.streaks) {
            // 东北信风：自右（东）向左（西）吹，略向南偏（屏幕下方）
            const x = cw + 130 - (((s.u * span) + t * 260 * s.speed) % span);
            const y = (s.v * (ch + 60) + t * 18 * s.speed) % (ch + 60) - 30;
            const wave = Math.sin(t * 1.6 + s.phase) * 5;
            const a = s.alpha * k * (0.55 + 0.45 * Math.sin(t * 0.9 + s.phase));
            if (a <= 0.01) continue;
            g.strokeStyle = `rgba(236, 246, 252, ${a.toFixed(3)})`;
            g.beginPath();
            g.moveTo(x, y);
            g.quadraticCurveTo(x - s.len * 0.5, y + wave, x - s.len, y + 4);
            g.stroke();
        }
    }
}

export const tradeWindEffect = new TradeWindEffect();
