/**
 * BattleSceneLayer — 独立战斗场景层（空壳 v0）
 *
 * 2026-08-09 主人定稿：战斗不进 ZOOM13，改独立战斗场景。
 *   上层 = 战斗画布（独立 canvas，屏幕坐标系，双方自由摆位）
 *   下层 = 地图（冻结，只当背景，不跟拍不重投影）
 *
 * 空壳验证目标：战斗触发时地图冻住 + 上层盖画布 + 两个色块代表两军，
 * 能进能出、过渡（淡入淡出）不难看。**不接任何游戏数据、不画一个兵。**
 *
 * 设计：
 *   - 全屏 fixed canvas（z-index 5000，位于地图之上、CombatUI 面板 9000 之下）
 *   - enter()：淡入（0.4s）→ 画两个色块（攻红 / 守蓝，屏幕坐标左右对称）
 *   - exit()：淡出（0.4s）→ 隐藏
 *   - 纯屏幕坐标系，不认经纬度——双方摆位由构图决定，不受地理比例约束
 *   - 空壳期间不接数据：色块是固定构图，等 P1 再接真实双方位置/兵力
 */

export class BattleSceneLayer {
    private container: HTMLDivElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    /** 场景是否处于「激活」状态（进入中 / 演出中 / 退出中） */
    private active = false;
    private opacity = 0;
    private fadeDir: 1 | -1 | 0 = 0;
    private rafId = 0;
    private lastT = 0;

    private static readonly Z_INDEX = 5000;
    private static readonly FADE_MS = 400;

    /** 战斗开始（跟拍军团参与）→ 进场景 */
    public enter(): void {
        this.ensureDom();
        this.active = true;
        this.fadeDir = 1;
        if (this.container) this.container.style.display = 'block';
        if (this.rafId === 0) {
            this.lastT = performance.now();
            this.rafId = requestAnimationFrame((t) => this.loop(t));
        }
    }

    /** 战斗结束 → 退场景（淡出后隐藏） */
    public exit(): void {
        if (!this.active) return;
        this.fadeDir = -1;
    }

    public isActive(): boolean {
        return this.active;
    }

    private ensureDom(): void {
        if (this.container) return;

        const container = document.createElement('div');
        container.id = 'battle-scene-layer';
        container.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: ${BattleSceneLayer.Z_INDEX};
            pointer-events: none;
            display: none;
            background: transparent;
        `;
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; display:block;';
        container.appendChild(canvas);
        document.body.appendChild(container);

        this.container = container;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', this.resize);
    }

    private resize = (): void => {
        if (!this.canvas || !this.container) return;
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = Math.max(1, Math.floor(w * dpr));
        this.canvas.height = Math.max(1, Math.floor(h * dpr));
        this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    private loop(t: number): void {
        const dt = t - this.lastT;
        this.lastT = t;

        if (this.fadeDir !== 0) {
            const step = dt / BattleSceneLayer.FADE_MS;
            this.opacity = Math.min(1, Math.max(0, this.opacity + this.fadeDir * step));
            if (this.opacity <= 0 && this.fadeDir === -1) {
                // 淡出完成 → 隐藏并停帧
                this.opacity = 0;
                this.fadeDir = 0;
                this.active = false;
                if (this.container) this.container.style.display = 'none';
                this.rafId = 0;
                return;
            }
            if (this.opacity >= 1 && this.fadeDir === 1) {
                this.fadeDir = 0;
            }
        }

        this.draw();
        if (this.rafId !== 0 || this.active) {
            this.rafId = requestAnimationFrame((nt) => this.loop(nt));
        }
    }

    private draw(): void {
        const ctx = this.ctx;
        const canvas = this.canvas;
        if (!ctx || !canvas) return;

        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, w, h);
        if (this.opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // ── 空壳：两个色块代表两军（屏幕坐标构图，攻左守右对称）──
        const blockW = Math.min(200, w * 0.14);
        const blockH = Math.min(120, h * 0.14);
        const y = h * 0.44;
        const leftX = w * 0.28 - blockW / 2;
        const rightX = w * 0.72 - blockW / 2;

        // 攻方（红）
        this.drawBlock(leftX, y - blockH / 2, blockW, blockH, 'rgba(214, 69, 55, 0.82)', '攻');
        // 守方（蓝）
        this.drawBlock(rightX, y - blockH / 2, blockW, blockH, 'rgba(74, 118, 214, 0.82)', '守');

        // 对垒中轴线（淡，帮助确认构图对称）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.moveTo(w / 2, h * 0.30);
        ctx.lineTo(w / 2, h * 0.62);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }

    private drawBlock(
        x: number,
        y: number,
        w: number,
        h: number,
        fill: string,
        label: string
    ): void {
        const ctx = this.ctx;
        if (!ctx) return;
        const r = 10;

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();

        // 边框（细金边，接近项目古风 UI）
        ctx.strokeStyle = 'rgba(212, 170, 60, 0.55)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标签
        ctx.fillStyle = 'rgba(255, 246, 230, 0.95)';
        ctx.font = '700 34px "Noto Serif SC", "SimSun", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + h / 2);
    }

    /** 销毁（当前未使用；预留） */
    public dispose(): void {
        if (this.rafId !== 0) cancelAnimationFrame(this.rafId);
        this.rafId = 0;
        window.removeEventListener('resize', this.resize);
        this.container?.remove();
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.active = false;
    }
}
