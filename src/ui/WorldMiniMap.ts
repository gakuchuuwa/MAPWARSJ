import L from 'leaflet';

/**
 * 世界小地图（2026-10-04 主人定「画全世界」「学文明 6，加 +- 按钮，默认 ZOOM1」「加展开收起按钮，默认展开」；
 * 2026-10-05 主人令「把小地图移至右下角，贴边，固定」→ 由右上角改挂**右下角、右/下都贴屏幕边**）。
 *
 * 🔴 贴右下角之后与右下角的**时间控制面板**（`#game-time-hud`：收起是「控制」按钮、展开是「坐标/播放」那一叠）
 *    撞车 —— 实测小图 301×217 会整块压住它（也就点不到「播放」）。处置（2026-10-05 主人选定）：
 *    小地图严格贴右下角，**时间面板整叠让到小地图左边**（`map-hud-theme.css` 的 `#game-time-hud`：
 *    `right: calc(301px + var(--feed-panel-w))`、`bottom: 0`），两者都不挡。
 *
 * - 级别 1 ～ 9（主人 2026-10-04 加到 9）：1 = 全世界（按小图宽度把整个世界装进框里，固定不跟随）；2 ～ 9 依次放大，以玩家为中心并跟着走。
 * - 画三样：大地图当前镜头范围框、玩家位置点（不闪动，主人定「会吸引视线」）、玩家走过的路线。
 * - 战术模式（13）里整块隐藏。
 * - 小图上的拖动、滚轮、双击一律关掉；单击 = 大地图镜头跳到点击处（只动镜头，主人 2026-10-04 定）。
 */
const MINI_W = 300;
const MINI_H = 190;
const LEVEL_MIN = 1;
const LEVEL_MAX = 9;
/** 默认级别（主人 2026-10-04 由 1 改为 4） */
const LEVEL_DEFAULT = 4;
/** 级别 1 的 Leaflet 缩放：世界宽 256·2^z = 小图宽 */
const FIT_ZOOM = Math.log2(MINI_W / 256);
const TICK_MS = 250;
/** 路线每隔这么远（度）记一个点；最多存这么多点 */
const TRAIL_STEP_DEG = 0.05;
const TRAIL_MAX = 6000;
/** 底图：Esri 世界自然地形图（陆地绿褐、海蓝，海陆分界清楚；最高到 8 级）。原用晕渲图，陆地粉灰、海陆不分明，主人 2026-10-04 嫌弃后换掉 */
const BASE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}';

export class WorldMiniMap {
    private root: HTMLDivElement;
    private body: HTMLDivElement;
    private levelEl: HTMLSpanElement;
    private plusBtn: HTMLButtonElement;
    private minusBtn: HTMLButtonElement;
    private toggleBtn: HTMLButtonElement;
    /** 🧭 行军线路开关按钮（主人 2026-10-05 令「添加一个按钮功能，显示线路和不显示线路」） */
    private trailBtn: HTMLButtonElement;
    private mini: L.Map;
    private viewRect: L.Rectangle;
    private trail: L.Polyline;
    private dot: L.Marker;
    private trailPts: L.LatLng[] = [];
    /** 线路是否显示（按钮切换；换军团时会被强制打开并清空重记） */
    private trailOn = true;
    /** 上一次记录的宿主军团 id：变了＝玩家换了军团 → 清空轨迹、重新显示线路 */
    private lastHostId: string | null = null;
    private level = LEVEL_MIN;
    private expanded = true;
    private timer: number;

    constructor(
        private readonly mainMap: L.Map,
        private readonly getPlayerPos: () => { lat: number; lng: number } | null,
        private readonly isTactical: () => boolean,
        /** 点小地图时先松开镜头跟随，不然跟随会马上把镜头拉回军团 */
        private readonly releaseCamera: () => void,
        /**
         * 🔴 [2026-10-05 主人令「玩家如果换了军团，就要重新显示行军线路」]
         * 玩家当前所随军团 id（`playerHero.getHostLegionId()`）。它一变就说明换了军团：
         * **清空旧轨迹 + 重新打开线路**，从新军团的当前位置重新记。
         * 不传时该功能自动失效（与加此参数前行为一致）。
         */
        private readonly getHostLegionId?: () => string | null,
    ) {
        this.injectStyle();
        this.root = document.createElement('div');
        this.root.className = 'world-minimap';
        this.root.innerHTML = `
            <div class="wm-head">
                <span class="wm-title">🌍 世界</span>
                <span class="wm-zoom">
                    <button class="wm-btn wm-minus" title="缩小">−</button>
                    <span class="wm-level"></span>
                    <button class="wm-btn wm-plus" title="放大">+</button>
                </span>
                <button class="wm-btn wm-trail" title="隐藏行军线路">🧭</button>
                <button class="wm-btn wm-toggle" title="收起"></button>
            </div>
            <div class="wm-body"></div>`;
        document.body.appendChild(this.root);
        this.body = this.root.querySelector('.wm-body') as HTMLDivElement;
        this.levelEl = this.root.querySelector('.wm-level') as HTMLSpanElement;
        this.plusBtn = this.root.querySelector('.wm-plus') as HTMLButtonElement;
        this.minusBtn = this.root.querySelector('.wm-minus') as HTMLButtonElement;
        this.toggleBtn = this.root.querySelector('.wm-toggle') as HTMLButtonElement;
        this.trailBtn = this.root.querySelector('.wm-trail') as HTMLButtonElement;

        this.mini = L.map(this.body, {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            touchZoom: false,
            zoomSnap: 0,
            zoomAnimation: false,
            fadeAnimation: false,
            worldCopyJump: false,
        });
        L.tileLayer(BASE_URL, { noWrap: true, minZoom: 0, maxZoom: 8 }).addTo(this.mini);
        this.viewRect = L.rectangle([[0, 0], [0, 0]], { color: '#f5d77a', weight: 1.5, fill: false, interactive: false }).addTo(this.mini);
        this.trail = L.polyline([], { color: '#e8452c', weight: 2, opacity: 0.9, interactive: false }).addTo(this.mini);
        this.dot = L.marker([0, 0], {
            interactive: false,
            icon: L.divIcon({ className: 'wm-dot', html: '<span></span>', iconSize: [12, 12], iconAnchor: [6, 6] }),
        }).addTo(this.mini);

        // 🔴 [2026-10-04 主人定「只移动镜头」] 点小地图：大地图镜头跳到点击处（缩放级别不变），军团与玩家都不动
        this.mini.on('click', (e: L.LeafletMouseEvent) => {
            this.releaseCamera();
            this.mainMap.setView(e.latlng, this.mainMap.getZoom(), { animate: false });
            this.viewRect.setBounds(this.mainMap.getBounds());
        });
        this.plusBtn.addEventListener('click', () => this.setLevel(this.level + 1));
        this.minusBtn.addEventListener('click', () => this.setLevel(this.level - 1));
        this.toggleBtn.addEventListener('click', () => this.setExpanded(!this.expanded));
        // 🔴 [2026-10-05 主人令] 线路开关：显示 / 不显示
        this.trailBtn.addEventListener('click', () => this.setTrailOn(!this.trailOn));

        this.setExpanded(true);
        this.setLevel(LEVEL_DEFAULT);
        this.setTrailOn(true);
        this.timer = window.setInterval(() => this.tick(), TICK_MS);
    }

    /** 线路显示开关（🧭 按钮）：关＝把折线从图上撤掉，采样照常记着，再打开即恢复 */
    private setTrailOn(on: boolean): void {
        this.trailOn = on;
        this.trailBtn.classList.toggle('is-off', !on);
        this.trailBtn.title = on ? '隐藏行军线路' : '显示行军线路';
        if (on) this.trail.setLatLngs(this.trailPts);
        else this.trail.setLatLngs([]);
    }

    /**
     * 🔴 [2026-10-05 主人令「玩家如果换了军团，就要重新显示行军线路」]
     * 换军团侦测：宿主军团 id 变了（入伍新军团／离队／军团覆灭后改投）→
     * **清空旧轨迹**（那是上一支军团走过的路）→ **强制把线路重新打开** → 从此刻起重新记。
     * 返回 true 表示这一拍刚换了军团（调用方据此跳过本拍采样，免得把旧位置记进新线）。
     */
    private syncHostLegion(): boolean {
        if (!this.getHostLegionId) return false;
        const id = this.getHostLegionId() ?? null;
        if (id === this.lastHostId) return false;
        this.lastHostId = id;
        this.trailPts.length = 0;
        this.trail.setLatLngs([]);
        if (!this.trailOn) this.setTrailOn(true);   // 换了军团 → 重新显示
        return true;
    }

    private setExpanded(on: boolean): void {
        this.expanded = on;
        this.root.classList.toggle('is-collapsed', !on);
        this.toggleBtn.textContent = on ? '▼' : '▲';
        this.toggleBtn.title = on ? '收起' : '展开';
        if (on) { this.mini.invalidateSize(); this.applyView(); }
    }

    private setLevel(lv: number): void {
        this.level = Math.max(LEVEL_MIN, Math.min(LEVEL_MAX, lv));
        this.levelEl.textContent = String(this.level);
        this.minusBtn.disabled = this.level <= LEVEL_MIN;
        this.plusBtn.disabled = this.level >= LEVEL_MAX;
        this.applyView();
    }

    /** 级别 1 固定显示全世界；2～9 以玩家为中心 */
    private applyView(): void {
        if (this.level <= LEVEL_MIN) {
            this.mini.setView([20, 0], FIT_ZOOM, { animate: false });
            return;
        }
        const p = this.getPlayerPos() ?? this.mainMap.getCenter();
        this.mini.setView([p.lat, p.lng], this.level - 1, { animate: false });
    }

    private tick(): void {
        const hide = this.isTactical();
        this.root.style.display = hide ? 'none' : '';
        // 🔴 [2026-10-05] 先看有没有换军团：换了就清空轨迹 + 重新显示线路（本拍不再采样，免得把旧位置续进新线）
        const hostChanged = this.syncHostLegion();
        const p = this.getPlayerPos();
        if (!hostChanged && p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
            const last = this.trailPts[this.trailPts.length - 1];
            if (!last || Math.hypot(last.lat - p.lat, last.lng - p.lng) >= TRAIL_STEP_DEG) {
                this.trailPts.push(L.latLng(p.lat, p.lng));
                if (this.trailPts.length > TRAIL_MAX) this.trailPts.shift();
            }
        }
        if (hide || !this.expanded) return;
        if (this.trailOn) this.trail.setLatLngs(this.trailPts);
        if (p) this.dot.setLatLng([p.lat, p.lng]);
        this.viewRect.setBounds(this.mainMap.getBounds());
        if (this.level > LEVEL_MIN) this.applyView();
    }

    public destroy(): void {
        window.clearInterval(this.timer);
        this.mini.remove();
        this.root.remove();
    }

    private injectStyle(): void {
        if (document.getElementById('world-minimap-style')) return;
        const st = document.createElement('style');
        st.id = 'world-minimap-style';
        st.textContent = `
            .world-minimap {
                /* 右下角：右、下都贴屏幕边（不随任何面板伸缩移动，也不随镜头动） */
                /* 🔴 [2026-10-05 主人令「小地图要在立绘下面」] 层级压到**立绘与所有 HUD 面板之下**：
                   立绘 = PlayerHUD 的对话覆盖层（position:fixed; inset:0; z-index:10060；立绘贴屏幕左下、
                   对话框在它右边）；玩家条 10003、字幕 10003、顶栏 10002、时间控制面板 5000/5001。
                   本图原为 10002（与顶栏同层、比玩家条只低 1）→ 改 **5000**：仍高于地图本体，但一律在本图
                   之上的任何 HUD／立绘之下（收起态的时间面板按钮 5001 同高，但它在左下角，与本图不相交）。
                   ⚠️ 本段在 JS 模板字符串内部：注释里**不许写反引号**，会把模板提前截断、整个模块 500。 */
                position: fixed; right: 0; bottom: 0; z-index: 5000;
                width: ${MINI_W}px;
                /* 高度写死 = 头 24 + 体 190 + 上边框 1（+ 2 为余量）＝217：
                   下边贴屏幕边，头与体就能完整露出（不写死会被屏幕底裁掉一截） */
                height: ${24 + MINI_H + 3}px; box-sizing: border-box;
                background: rgba(25, 20, 14, 0.92);
                border: 1px solid rgba(212, 175, 55, 0.55); border-right: none; border-bottom: none; border-radius: 6px 0 0 0;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
                font-family: inherit; color: #f5e6c8; user-select: none;
            }
            .world-minimap .wm-head {
                display: flex; align-items: center; gap: 6px; height: 24px; padding: 0 6px;
                font-size: 12px; font-weight: 700;
            }
            .world-minimap .wm-title { flex: 1; color: #f5d77a; }
            .world-minimap .wm-zoom { display: flex; align-items: center; gap: 4px; }
            .world-minimap .wm-level { min-width: 12px; text-align: center; color: #f5e6c8; }
            .world-minimap .wm-btn {
                width: 20px; height: 18px; padding: 0; line-height: 16px; font-size: 13px; cursor: pointer;
                background: rgba(35, 28, 20, 0.95); color: #f5e6c8;
                border: 1px solid rgba(212, 175, 55, 0.45); border-radius: 3px;
            }
            .world-minimap .wm-btn:disabled { opacity: 0.35; cursor: default; }
            /* 🧭 线路开关：亮＝显示中，暗＝已隐藏（主人 2026-10-05 令） */
            .world-minimap .wm-btn.wm-trail.is-off { opacity: 0.4; color: #8a7f6a; }
            .world-minimap .wm-body {
                width: ${MINI_W}px; height: ${MINI_H}px; background: #6395b8; cursor: pointer;
                border-top: 1px solid rgba(212, 175, 55, 0.35);
            }
            /* 全局给瓦片加宽了半像素（GameMap.installTileSeamFix，给大地图堵缝用），在小图里反而画出一道白线（实测），小图里改回正好 256 */
            .world-minimap .wm-body img.leaflet-tile { width: 256px !important; height: 256px !important; }
            .world-minimap.is-collapsed { height: auto; width: auto; }
            .world-minimap.is-collapsed .wm-body { display: none; }
            .world-minimap.is-collapsed .wm-zoom { display: none; }
            .world-minimap .wm-dot span {
                display: block; width: 12px; height: 12px; border-radius: 50%;
                background: #ff3b1f; border: 2px solid #fff; box-sizing: border-box;
            }
        `;
        document.head.appendChild(st);
    }
}
