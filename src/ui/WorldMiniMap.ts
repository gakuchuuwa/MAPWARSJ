import L from 'leaflet';

/**
 * 右下角世界小地图（2026-10-04 主人定「画全世界」「学文明 6，加 +- 按钮，默认 ZOOM1」「右下角，加展开收起按钮，默认展开」）。
 *
 * - 级别 1 ～ 4：1 = 全世界（按小图宽度把整个世界装进框里，固定不跟随）；2 ～ 4 依次放大，以玩家为中心并跟着走。
 * - 画三样：大地图当前镜头范围框、玩家位置闪动点、玩家走过的路线。
 * - 战术模式（13）里整块隐藏。
 * - 只看不点：小图上的拖动、滚轮、双击一律关掉。
 */
const MINI_W = 300;
const MINI_H = 190;
const LEVEL_MIN = 1;
const LEVEL_MAX = 4;
/** 级别 1 的 Leaflet 缩放：世界宽 256·2^z = 小图宽 */
const FIT_ZOOM = Math.log2(MINI_W / 256);
const TICK_MS = 250;
/** 路线每隔这么远（度）记一个点；最多存这么多点 */
const TRAIL_STEP_DEG = 0.05;
const TRAIL_MAX = 6000;
const ESRI_SHADED_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';

export class WorldMiniMap {
    private root: HTMLDivElement;
    private body: HTMLDivElement;
    private levelEl: HTMLSpanElement;
    private plusBtn: HTMLButtonElement;
    private minusBtn: HTMLButtonElement;
    private toggleBtn: HTMLButtonElement;
    private mini: L.Map;
    private viewRect: L.Rectangle;
    private trail: L.Polyline;
    private dot: L.Marker;
    private trailPts: L.LatLng[] = [];
    private level = LEVEL_MIN;
    private expanded = true;
    private timer: number;

    constructor(
        private readonly mainMap: L.Map,
        private readonly getPlayerPos: () => { lat: number; lng: number } | null,
        private readonly isTactical: () => boolean,
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
                <button class="wm-btn wm-toggle" title="收起"></button>
            </div>
            <div class="wm-body"></div>`;
        document.body.appendChild(this.root);
        this.body = this.root.querySelector('.wm-body') as HTMLDivElement;
        this.levelEl = this.root.querySelector('.wm-level') as HTMLSpanElement;
        this.plusBtn = this.root.querySelector('.wm-plus') as HTMLButtonElement;
        this.minusBtn = this.root.querySelector('.wm-minus') as HTMLButtonElement;
        this.toggleBtn = this.root.querySelector('.wm-toggle') as HTMLButtonElement;

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
        L.tileLayer(ESRI_SHADED_URL, { noWrap: true, minZoom: 0, maxZoom: 8 }).addTo(this.mini);
        this.viewRect = L.rectangle([[0, 0], [0, 0]], { color: '#f5d77a', weight: 1.5, fill: false, interactive: false }).addTo(this.mini);
        this.trail = L.polyline([], { color: '#e8452c', weight: 2, opacity: 0.9, interactive: false }).addTo(this.mini);
        this.dot = L.marker([0, 0], {
            interactive: false,
            icon: L.divIcon({ className: 'wm-dot', html: '<span></span>', iconSize: [12, 12], iconAnchor: [6, 6] }),
        }).addTo(this.mini);

        this.plusBtn.addEventListener('click', () => this.setLevel(this.level + 1));
        this.minusBtn.addEventListener('click', () => this.setLevel(this.level - 1));
        this.toggleBtn.addEventListener('click', () => this.setExpanded(!this.expanded));

        this.setExpanded(true);
        this.setLevel(LEVEL_MIN);
        this.timer = window.setInterval(() => this.tick(), TICK_MS);
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

    /** 级别 1 固定显示全世界；2～4 以玩家为中心 */
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
        const p = this.getPlayerPos();
        if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
            const last = this.trailPts[this.trailPts.length - 1];
            if (!last || Math.hypot(last.lat - p.lat, last.lng - p.lng) >= TRAIL_STEP_DEG) {
                this.trailPts.push(L.latLng(p.lat, p.lng));
                if (this.trailPts.length > TRAIL_MAX) this.trailPts.shift();
            }
        }
        if (hide || !this.expanded) return;
        this.trail.setLatLngs(this.trailPts);
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
                position: fixed; right: 12px; z-index: 10002;
                /* 贴在行军字幕条上方（字幕条 bottom 为 clamp(46px,7.8vh,84px)、两行约 90px 高），三者互不遮挡 */
                bottom: calc(clamp(46px, 7.8vh, 84px) + 104px);
                width: ${MINI_W}px;
                background: rgba(25, 20, 14, 0.92);
                border: 1px solid rgba(212, 175, 55, 0.55); border-radius: 6px;
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
            .world-minimap .wm-body {
                width: ${MINI_W}px; height: ${MINI_H}px; background: #6395b8;
                border-top: 1px solid rgba(212, 175, 55, 0.35); border-radius: 0 0 6px 6px;
            }
            .world-minimap .wm-body .leaflet-tile-pane { filter: saturate(1.7) contrast(1.15) brightness(0.92); }
            /* 全局给瓦片加宽了半像素（GameMap.installTileSeamFix，给大地图堵缝用），在小图里反而画出一道白线（实测），小图里改回正好 256 */
            .world-minimap .wm-body img.leaflet-tile { width: 256px !important; height: 256px !important; }
            .world-minimap.is-collapsed .wm-body { display: none; }
            .world-minimap.is-collapsed .wm-zoom { display: none; }
            .world-minimap .wm-dot span {
                display: block; width: 12px; height: 12px; border-radius: 50%;
                background: #ff3b1f; border: 2px solid #fff; box-sizing: border-box;
                animation: wm-pulse 1s ease-in-out infinite;
            }
            @keyframes wm-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.6; } }
        `;
        document.head.appendChild(st);
    }
}
