import L from 'leaflet';
import { GridSystem } from '../systems/GridSystem';
import { HISTORICAL_FACTION_COLORS } from '../data/HistoricalFactionColors';
import { isBlankRebelFaction } from '../data/RebelFaction';
import { CityType } from '../types/core';
import { ESRI_SHADED_RELIEF_URL, buildWaterMask } from '../world/land-sea/WaterMask';

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
/** 默认级别（主人 2026-10-04 由 1 改为 4；2026-10-09 主人定改为 5） */
const LEVEL_DEFAULT = 5;
/** 级别 1 的 Leaflet 缩放：世界宽 256·2^z = 小图宽 */
const FIT_ZOOM = Math.log2(MINI_W / 256);
const TICK_MS = 250;
/** 🔴 [2026-10-09 主人定] 小地图势力范围：每座据点占它周围这么远（公里）以内的格子，重叠归最近的城 */
const TERRITORY_CAP_KM = 150;
/** 判水用的 ESRI 瓦片级别：3 级全世界 64 块，里海／咸海／贝加尔湖／五大湖都认得出 */
const WATER_MASK_ZOOM = 3;
/** 路线每隔这么远（度）记一个点；最多存这么多点 */
const TRAIL_STEP_DEG = 0.05;
const TRAIL_MAX = 6000;
/** 底图：Esri 世界自然地形图（陆地绿褐、海蓝，海陆分界清楚；最高到 8 级）。原用晕渲图，陆地粉灰、海陆不分明，主人 2026-10-04 嫌弃后换掉 */
const BASE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}';

/**
 * 🔴 [2026-10-29 主人令「势力色和行军路线色为反差色」]
 * 根据所属势力色计算高对比互补反差色：
 * 1. 色相相反（+180° 互补色，红色变青天蓝，黄色变深宝蓝，蓝色变亮橙金）；
 * 2. 明暗反差（暗底配亮线，亮底配深线）；
 * 3. 饱和度增强（保证在小地图上鲜艳夺目）；
 * 4. 黑白灰特判（暗底金黄，浅底深朱红）。
 */
export function computeContrastColor(hex: string): string {
    const clean = hex.replace('#', '').trim();
    if (!clean) return '#e8452c';
    let r = 0, g = 0, b = 0;
    if (clean.length === 3) {
        r = parseInt(clean[0] + clean[0], 16);
        g = parseInt(clean[1] + clean[1], 16);
        b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length >= 6) {
        r = parseInt(clean.slice(0, 2), 16);
        g = parseInt(clean.slice(2, 4), 16);
        b = parseInt(clean.slice(4, 6), 16);
    } else {
        return '#e8452c';
    }
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '#e8452c';

    const rf = r / 255, gf = g / 255, bf = b / 255;
    const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;

    if (d > 0.001) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rf: h = (gf - bf) / d + (gf < bf ? 6 : 0); break;
            case gf: h = (bf - rf) / d + 2; break;
            case bf: h = (rf - gf) / d + 4; break;
        }
        h *= 60;
    }

    if (s < 0.15) {
        return l < 0.5 ? '#ffd700' : '#c02c38';
    }

    const targetH = (h + 180) % 360;
    const targetS = Math.max(0.9, s);
    const targetL = l < 0.55 ? 0.65 : 0.35;

    const q = targetL < 0.5 ? targetL * (1 + targetS) : targetL + targetS - targetL * targetS;
    const p = 2 * targetL - q;
    const h2rgb = (t: number) => {
        let tc = t;
        if (tc < 0) tc += 1;
        if (tc > 1) tc -= 1;
        if (tc < 1 / 6) return p + (q - p) * 6 * tc;
        if (tc < 1 / 2) return q;
        if (tc < 2 / 3) return p + (q - p) * (2 / 3 - tc) * 6;
        return p;
    };
    const normH = targetH / 360;
    const ro = Math.round(h2rgb(normH + 1 / 3) * 255);
    const go = Math.round(h2rgb(normH) * 255);
    const bo = Math.round(h2rgb(normH - 1 / 3) * 255);

    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return `#${toHex(ro)}${toHex(go)}${toHex(bo)}`;
}

export class WorldMiniMap {
    private root: HTMLDivElement;
    private body: HTMLDivElement;
    private levelEl: HTMLSpanElement;
    private plusBtn: HTMLButtonElement;
    private minusBtn: HTMLButtonElement;
    private toggleBtn: HTMLButtonElement;
    /** 🧭 行军线路开关按钮（主人 2026-10-05 令「添加一个按钮功能，显示线路和不显示线路」） */
    private trailBtn: HTMLButtonElement;
    /** 🎨 势力色开关按钮（主人 2026-10-08 令「显示势力色，不显示势力色」） */
    private colorBtn: HTMLButtonElement;
    /** 🔴 [2026-10-09 主人令] 🎨 按钮四态循环：0 据点＋势力色 / 1 只显示势力色 / 2 只显示据点 / 3 都不显示 */
    private colorMode = 0;
    private get showDots(): boolean { return this.colorMode === 0 || this.colorMode === 2; }
    private get showTerritory(): boolean { return this.colorMode === 0 || this.colorMode === 1; }
    /** 🔴 [2026-10-09 主人令] 领土多边形：势力 id -> L.Polygon；小地图独立合并与绘制 */
    private territoryPolygons = new Map<string, L.Polygon>();
    /** 势力 id -> 上次合并时的格子校验串与颜色：没变就不重合并、不重画 */
    private territoryCache = new Map<string, { checksum: string; color: string }>();
    private lastCityIds = new Set<string>();
    /** 占格结果：据点 id → 格子 key 列表；claimsKey 是算它时的可见据点清单 */
    private cityHexes = new Map<string, number[]>();
    private claimsKey = '';
    /** 水域掩膜（1＝水）；null＝还没拉到，不画色块 */
    private waterMask: Uint8Array | null = null;
    private waterMaskW = 0;
    private territoryDirty = true;
    private mini: L.Map;
    private viewRect: L.Rectangle;
    private trail: L.Polyline;
    /** 当前行军路线颜色（默认鲜红，加入势力后自动切换为与所属势力色高对比的反差色） */
    private currentTrailColor = '#e8452c';
    private dot: L.Marker;
    private trailPts: L.LatLng[] = [];
    /** 线路是否显示（按钮切换；换军团时会被强制打开并清空重记） */
    private trailOn = true;
    /** 上一次记录的宿主军团 id：变了＝玩家换了军团 → 清空轨迹、重新显示线路 */
    private lastHostId: string | null = null;
    private level = LEVEL_MIN;
    private expanded = true;
    private timer: number;
    /** 据点势力色圆点：id → 圆点；单独一个 canvas 渲染器，上千个点也不卡 */
    private cityDots = new Map<string, L.CircleMarker>();
    private cityDotColor = new Map<string, string>();
    private cityRenderer = L.canvas({ padding: 0.5 });
    /** 领土多边形单独一层 canvas，压在镜头框、行军线、据点圆点下面 */
    private territoryRenderer = L.canvas({ padding: 0.5, pane: "wm-territory" });
    private tickN = 0;

    /**
     * 🔴 [PERF 2026-10-26 主人令「小地图 0.25 秒重算」] 每拍都做的三笔重活，改成「变了才做」。
     *
     * 原来的 `tick()`（250ms 一拍）无条件做：
     *   ① `trail.setLatLngs(trailPts)` —— 轨迹最多 6000 点，每拍都全量重投影一遍；
     *   ② `dot.setLatLng([p.lat, p.lng])` —— 每拍新造 LatLng，即使玩家没动；
     *   ③ `viewRect.setBounds(mainMap.getBounds())` —— 每拍重画视野框矩形。
     * 据点/领土那半（`syncCityDots` + `syncTerritoryPolygons`）还把 1s 一拍降到 2s，
     * 并且「据点集合没变就不重算占格、领土没变就不重合并」。
     */
    private trailDirty = false;
    private trailShown = false;
    private lastDotPos: { lat: number; lng: number } | null = null;
    private lastViewRectKey = '';
    /** `cityHexes` 是否对当前水域图/据点集合有效（水域图换了要重算） */
    private hexesValid = false;

    /**
     * 🔴 [PERF 2026-10-26 主人令「战略地图卡」] 小地图同步**不能每帧真做**。
     *
     * `move` 在跟拍/拖动时逐帧触发，而每次真同步都要：
     *   `viewRect.setBounds()`（重画视野框）+ `mini.setView()`（小图整层重算）——
     * 小图上 1082 个据点圆点 + 势力领土多边形 + 视野框全部走 Leaflet 的
     * `_updatePaths → _clipPoints / _simplifyDP / _updateCircle`。
     * 2026-10-26 实测：12s CPU 采样里 `applyView` 自己占 7.82%，连带 Leaflet 裁剪/简化约 6%；
     * 分配采样同一来源约 1000MB/25s（占总分配 55%），是 major GC 掉帧的一大来源。
     *
     * 改法：`move/zoom` 合并到 **最多 10Hz**，`moveend/zoomend/resize` 立即同步一次
     *（松手即准，跟随观感不变）；中心/级别没变时连 `setView` 都不发。
     */
    private static readonly MINI_SYNC_MIN_INTERVAL_MS = 100;
    private miniSyncAt = 0;
    private miniSyncTimer = 0;
    private miniSyncPending = false;
    /** 上次真正发出的 mini 视口（中心 + 缩放级别），用于「没变就不 setView」 */
    private lastMiniView: { lat: number; lng: number; zoom: number } | null = null;
    /** 上一拍是否处于战术模式隐藏状态（从隐藏切回显示时必须 invalidateSize + 强制重绘） */
    private wasHidden = false;

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
        /**
         * 🔴 [2026-10-08 主人「小地图是不是可以添加上势力色」] 据点圆点：每座可见据点一个点，填当前所属势力的势力色（易主即换色）。
         * 🔴 [2026-10-09 主人令] 增加 type（城型定圈）与 factionId（势力归属）供小地图独立圈地。
         * 不传时不画（与加此参数前行为一致）。
         */
        private readonly getCityMarks?: () => { id: string; lat: number; lng: number; color: string; type?: CityType; factionId?: string }[],
        /**
         * 🔴 [2026-10-29 主人令「势力色和行军路线色为反差色」]
         * 当前宿主军团/玩家所在势力颜色（用于动态计算行军路线的反差色，避免红势力与红路线重叠看不清）。
         */
        private readonly getHostFactionColor?: () => string | null,
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
                <button class="wm-btn wm-color" title="当前：据点＋势力色（点击切换）">🎨</button>
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
        this.colorBtn = this.root.querySelector('.wm-color') as HTMLButtonElement;

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
            // 小地图容器固定 220×140，关闭 Leaflet 默认的 window resize 监听：
            // 否则在战术模式（display:none）或收起态期间一旦发生窗口/全屏/OBS 尺寸变化，
            // Leaflet 会把小地图尺寸重算成 0×0 并偏移 _mapPane，退回大地图后只剩左侧一格残片且圆点/色块全空。
            trackResize: false,
            // 🔴 [2026-10-11 主人报「小地图不循环，请修复」] 小地图自己那份瓦片层此前是
            //    `worldCopyJump:false` + 瓦片 `noWrap:true` ⇒ 过了 180° 经线就是空白
            //    （截图里右下角那块「map data not available」）。与大地图同款：开循环、去 noWrap。
            worldCopyJump: true,
        });
        L.tileLayer(BASE_URL, { minZoom: 0, maxZoom: 8 }).addTo(this.mini);
        this.mini.createPane("wm-territory").style.zIndex = "350";
        this.territoryRenderer.addTo(this.mini);
        this.cityRenderer.addTo(this.mini);
        this.viewRect = L.rectangle([[0, 0], [0, 0]], { color: '#f5d77a', weight: 1.5, fill: false, interactive: false }).addTo(this.mini);
        this.trail = L.polyline([], { color: this.currentTrailColor, weight: 2, opacity: 0.95, interactive: false }).addTo(this.mini);
        this.dot = L.marker([0, 0], {
            interactive: false,
            icon: L.divIcon({ className: 'wm-dot', html: '<span></span>', iconSize: [12, 12], iconAnchor: [6, 6] }),
        }).addTo(this.mini);

        // 🔴 [2026-10-11 主人令「小地图显示的比例和位置应该和大地图一直保持一致」]
        //    改前：视口框只在「展开」且**每 4 拍**才更新一次（tick 里早退在更新之前）⇒ 收起时是旧框、
        //    拖动/缩放大地图时框滞后。现改为**跟随大地图的 move/zoom 事件实时同步**，与是否展开无关。
        // 🔴 [PERF 2026-10-26] 但「实时」不等于「每帧」：见 requestMiniSync 上方说明。
        //    move/zoom 合并到最多 10Hz，moveend/zoomend/resize 立即同步（松手即准）。
        this.mainMap.on('move zoom', () => this.requestMiniSync());
        this.mainMap.on('moveend zoomend resize', () => this.requestMiniSync(true));
        this.requestMiniSync(true);

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
        // 🔴 [2026-10-08 主人令] 势力色开关：显示 / 不显示
        this.colorBtn.addEventListener('click', () => this.setColorMode((this.colorMode + 1) % 4));

        this.setLevel(LEVEL_DEFAULT);
        this.setTrailOn(true);
        this.setExpanded(true);
        this.timer = window.setInterval(() => this.tick(), TICK_MS);
        void this.loadWaterMask();
    }

    /** 🎨 按钮四态：据点＋势力色 → 只显示势力色 → 只显示据点 → 都不显示 */
    private setColorMode(mode: number): void {
        this.colorMode = mode;
        const names = ['据点＋势力色', '只显示势力色', '只显示据点', '都不显示'];
        this.colorBtn.classList.toggle('is-off', mode === 3);
        this.colorBtn.title = `当前：${names[mode]}（点击切换）`;
        if (!this.showTerritory) {
            for (const poly of this.territoryPolygons.values()) poly.remove();
            this.territoryPolygons.clear();
            this.territoryCache.clear();
        }
        if (mode === 3) {
            for (const dot of this.cityDots.values()) dot.remove();
            this.cityDots.clear();
            this.cityDotColor.clear();
            return;
        }
        for (const dot of this.cityDots.values()) {
            if (this.showDots) dot.addTo(this.mini);
            else dot.remove();
        }
        this.territoryDirty = true;
        const res = this.syncCityDots();
        this.syncTerritoryPolygons(true, true, res.marks);
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
     * 🔴 [2026-10-29 主人令「势力色和行军路线色为反差色」]
     * 动态同步行军路线颜色：使路线与当前势力色呈互补反差色，避免重叠混淆
     */
    private updateTrailColor(factionColor: string | null): void {
        const targetColor = factionColor ? computeContrastColor(factionColor) : '#e8452c';
        if (this.currentTrailColor !== targetColor) {
            this.currentTrailColor = targetColor;
            this.trail.setStyle({ color: targetColor });
        }
    }

    /**
     * 🔴 [2026-10-07 主人令「小地图行军线路是用来画军团的行军线路，玩家加入一个势力后，这个军团的行军线路，如果离开势力就不画，再次加入势力再画」]
     * 宿主军团状态侦测：
     * 1. 离开势力（id == null）：不画军团线路，清空已有折线与采样点；
     * 2. 加入势力（id != null）：若换了军团或刚从无势力加入，清空旧轨迹 + 重新打开线路，本拍不采样；
     * 返回当前有效军团 id（非空表示在势力军团中，null 表示离开势力不画）。
     */
    private syncHostLegion(): string | null {
        if (!this.getHostLegionId) return null;
        const id = this.getHostLegionId() ?? null;
        if (id === null) {
            if (this.lastHostId !== null || this.trailPts.length > 0) {
                this.trailPts.length = 0;
                this.trail.setLatLngs([]);
                this.lastHostId = null;
                this.updateTrailColor(null);
            }
            return null;
        }
        if (id !== this.lastHostId) {
            this.lastHostId = id;
            this.trailPts.length = 0;
            this.trail.setLatLngs([]);
            if (!this.trailOn) this.setTrailOn(true);   // 换军团/重新加入势力 → 重新显示
            this.updateTrailColor(this.getHostFactionColor?.() ?? null);
            return null; // 本拍跳过采样，免得把上一军团/上一位置接进新线
        }
        return id;
    }

    private setExpanded(on: boolean): void {
        this.expanded = on;
        this.root.classList.toggle('is-collapsed', !on);
        this.toggleBtn.textContent = on ? '▼' : '▲';
        this.toggleBtn.title = on ? '收起' : '展开';
        if (on && !this.isTactical()) {
            this.recoverMiniSizeAndRedraw();
        }
    }

    /**
     * 从隐藏态（战术模式 display:none / 收起态）恢复可见，或检测到容器缓存尺寸异常（< 220×140）时：
     * 重置缓存视口 → invalidateSize(false) 校准 220×140 → 立即重设视口、视野框与据点/领土画布。
     */
    private recoverMiniSizeAndRedraw(): void {
        this.lastMiniView = null;
        this.lastViewRectKey = '';
        this.mini.invalidateSize({ animate: false });
        this.applyView();
        const { colorChanged, citiesChanged, marks } = this.syncCityDots();
        this.syncTerritoryPolygons(true, citiesChanged || colorChanged, marks);
        if ((this.cityRenderer as any)._map) {
            (this.cityRenderer as any)._update?.();
        }
        if ((this.territoryRenderer as any)._map) {
            (this.territoryRenderer as any)._update?.();
        }
    }

    private setLevel(lv: number): void {
        this.level = Math.max(LEVEL_MIN, Math.min(LEVEL_MAX, lv));
        this.levelEl.textContent = String(this.level);
        this.minusBtn.disabled = this.level <= LEVEL_MIN;
        this.plusBtn.disabled = this.level >= LEVEL_MAX;
        this.applyView();
    }

    /**
     * 🔴 [PERF 2026-10-26] 小地图同步节流入口：`move/zoom` 期间合并到最多 10Hz；
     * `moveend/zoomend/resize` 传 true 立即同步。
     */
    private requestMiniSync(immediate = false): void {
        if (immediate) {
            this.flushMiniSync();
            return;
        }
        if (this.miniSyncPending) return;
        if (performance.now() - this.miniSyncAt >= WorldMiniMap.MINI_SYNC_MIN_INTERVAL_MS) {
            this.flushMiniSync();
            return;
        }
        this.miniSyncPending = true;
        this.miniSyncTimer = window.setTimeout(() => this.flushMiniSync(), WorldMiniMap.MINI_SYNC_MIN_INTERVAL_MS);
    }

    private flushMiniSync(): void {
        this.miniSyncPending = false;
        if (this.miniSyncTimer !== 0) {
            window.clearTimeout(this.miniSyncTimer);
            this.miniSyncTimer = 0;
        }
        this.miniSyncAt = performance.now();
        // 战术模式或容器仍处于 display:none / 收起态时，绝不对 0×0 容器调 setBounds / setView，
        // 否则 Leaflet 会按 0×0 视口重算瓦片与画布范围，导致退回大地图后小地图残缺空白。
        if (this.isTactical() || !this.expanded || this.root.style.display === 'none') return;
        // [PERF 2026-10-26] 视野框只在主图范围真的变了才 setBounds（每拍都设 → 每拍重画一次矩形）。
        // 量化到 0.002°（约主图 0.7px、小图 0.02px）：肉眼无感，但能挡掉镜头慢漂时的无谓重画。
        const bounds = this.mainMap.getBounds();
        const key = `${Math.round(bounds.getSouth() * 500)},${Math.round(bounds.getWest() * 500)},${Math.round(bounds.getNorth() * 500)},${Math.round(bounds.getEast() * 500)}`;
        if (key !== this.lastViewRectKey) {
            this.lastViewRectKey = key;
            this.viewRect.setBounds(bounds);
        }
        this.applyView();
    }

    /**
     * 级别 1 固定显示全世界；2～9 **以大地图当前视野为中心**。
     * 🔴 [2026-10-11 主人报「我用鼠标拖拽战略大地图，小地图不跟着动」]
     *    改前：这里用 `getPlayerPos()`（以玩家为中心）⇒ 拖大地图时小地图纹丝不动。
     *    改后：中心取 `mainMap.getCenter()` ⇒ 大地图拖到哪，小地图就跟到哪；
     *    拿不到大地图中心时（极端兜底）才退回玩家位置。
     * 🔴 [PERF 2026-10-26] 中心/级别没变就不发 `setView` —— 每次 setView 都会让小图整层矢量重算。
     */
    private applyView(): void {
        if (this.isTactical() || !this.expanded || this.root.style.display === 'none') return;
        if (this.level <= LEVEL_MIN) {
            const lastWorld = this.lastMiniView;
            if (!lastWorld || lastWorld.zoom !== FIT_ZOOM) {
                this.lastMiniView = { lat: 20, lng: 0, zoom: FIT_ZOOM };
                this.mini.setView([20, 0], FIT_ZOOM, { animate: false });
            }
            return;
        }
        const c = (() => { try { return this.mainMap.getCenter(); } catch { return null; } })() ?? this.getPlayerPos();
        if (!c) return;
        const zoom = this.level - 1;
        const last = this.lastMiniView;
        // [PERF 2026-10-26] 0.02° ≈ 小图 0.18px（级别 5 时 1px≈0.09°）：低于这个量不重设视口，
        // 否则镜头一有微小漂移就每拍 setView 一次，小图整层矢量跟着重算。
        if (last && last.zoom === zoom && Math.abs(last.lat - c.lat) < 0.02 && Math.abs(last.lng - c.lng) < 0.02) return;
        this.lastMiniView = { lat: c.lat, lng: c.lng, zoom };
        this.mini.setView([c.lat, c.lng], zoom, { animate: false });
    }

    private tick(): void {
        const hide = this.isTactical();
        if (hide) {
            if (!this.wasHidden) {
                this.wasHidden = true;
                this.root.style.display = 'none';
            }
        } else if (this.wasHidden) {
            this.wasHidden = false;
            this.root.style.display = '';
            if (this.expanded) {
                this.recoverMiniSizeAndRedraw();
            }
        } else if (this.expanded) {
            const sz = this.mini.getSize();
            if (sz.x < MINI_W || sz.y < MINI_H) {
                this.recoverMiniSizeAndRedraw();
            }
        }
        // 🔴 [2026-10-07 主人令] 仅加入势力军团期间记录与绘制行军线路，离开势力不画，再次加入再画
        const currentHostId = this.syncHostLegion();
        const p = this.getPlayerPos();
        if (currentHostId && p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
            const last = this.trailPts[this.trailPts.length - 1];
            if (!last || Math.hypot(last.lat - p.lat, last.lng - p.lng) >= TRAIL_STEP_DEG) {
                this.trailPts.push(L.latLng(p.lat, p.lng));
                if (this.trailPts.length > TRAIL_MAX) this.trailPts.shift();
                // [PERF 2026-10-26] 只有真记了新点才需要重设折线
                this.trailDirty = true;
            }
        }
        if (hide || !this.expanded) return;
        // [PERF 2026-10-26] 据点/领土同步 1s（4 拍）→ 2s（8 拍）：占领变化最慢 2 秒内反映，
        // 但每秒重建的据点标记对象、seen 集合、claimsKey 字符串全部减半。
        if (++this.tickN % 8 === 0) {
            const { colorChanged, citiesChanged, marks } = this.syncCityDots();
            this.syncTerritoryPolygons(colorChanged || citiesChanged, citiesChanged, marks);
            if (currentHostId) {
                this.updateTrailColor(this.getHostFactionColor?.() ?? null);
            }
        }
        const showTrail = this.trailOn && !!currentHostId;
        if (showTrail !== this.trailShown || this.trailDirty) {
            this.trailShown = showTrail;
            this.trailDirty = false;
            this.trail.setLatLngs(showTrail ? this.trailPts : []);
        }
        // [PERF 2026-10-26] 玩家没动就不重设圆点（原来每拍新造一个 LatLng）
        if (p && (!this.lastDotPos || Math.abs(this.lastDotPos.lat - p.lat) > 1e-5 || Math.abs(this.lastDotPos.lng - p.lng) > 1e-5)) {
            this.lastDotPos = { lat: p.lat, lng: p.lng };
            this.dot.setLatLng([p.lat, p.lng]);
        }
        // [PERF 2026-10-26] 统一走同步入口：中心/级别/视野框没变就什么都不做，
        // 避免每拍让小地图整层矢量重算（原来这两行是无条件 setBounds + applyView）。
        this.requestMiniSync(true);
    }

    /** 据点势力色圆点：新增 / 换色 / 不再可见的撤掉；返回是否有据点换色或集合变动 */
    private syncCityDots(): {
        colorChanged: boolean;
        citiesChanged: boolean;
        marks: { id: string; lat: number; lng: number; color: string; type?: CityType; factionId?: string }[];
    } {
        if (!this.getCityMarks || this.colorMode === 3) return { colorChanged: false, citiesChanged: false, marks: [] };
        let colorChanged = false;
        const marks = this.getCityMarks();
        const seen = new Set<string>();
        for (const m of marks) {
            if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) continue;
            seen.add(m.id);
            const dot = this.cityDots.get(m.id);
            if (!dot) {
                const c = L.circleMarker([m.lat, m.lng], {
                    renderer: this.cityRenderer, radius: 2.5, weight: 0.8, color: '#1a1a1a', opacity: 0.85,
                    fillColor: m.color, fillOpacity: 1, interactive: false,
                });
                if (this.showDots) c.addTo(this.mini);
                this.cityDots.set(m.id, c);
                this.cityDotColor.set(m.id, m.color);
            } else if (this.cityDotColor.get(m.id) !== m.color) {
                dot.setStyle({ fillColor: m.color });
                this.cityDotColor.set(m.id, m.color);
                colorChanged = true;
            }
        }
        for (const [id, dot] of this.cityDots) {
            if (seen.has(id)) continue;
            dot.remove();
            this.cityDots.delete(id);
            this.cityDotColor.delete(id);
            colorChanged = true;
        }

        let citiesChanged = seen.size !== this.lastCityIds.size;
        if (!citiesChanged) {
            for (const id of seen) {
                if (!this.lastCityIds.has(id)) {
                    citiesChanged = true;
                    break;
                }
            }
        }
        if (citiesChanged) {
            this.lastCityIds = seen;
        }

        return { colorChanged, citiesChanged, marks };
    }

    /**
     * 🔴 [2026-10-09 主人令「就用150公里」「不应该把海洋的格子算进去」] 小地图独立分配六边形并合并势力领土多边形
     * 每座可见据点占它周围 TERRITORY_CAP_KM 以内的格子，一个格子被多座城占到时归最近的那座城；
     * 海、湖上的格子不算（据点自己脚下那一格除外）；水域图没拉到之前不画色块。
     * 格子归哪座城只与据点位置有关 → 只在可见据点集合变了或水域图到了时重新占格；
     * 换主只按城重新分组，势力的城没变就不重合并、不重画。
     */
    private syncTerritoryPolygons(
        needsRecalc: boolean,
        citiesChanged: boolean,
        marks: { id: string; lat: number; lng: number; color: string; type?: CityType; factionId?: string }[]
    ): void {
        if (!this.showTerritory || !this.waterMask) return;
        if (!needsRecalc && !this.territoryDirty) return;
        this.territoryDirty = false;

        // [PERF 2026-10-26] 只有「据点集合变了」或「水域图换了（hexesValid=false）」才重算占格。
        // 原来每次都要把 1082 个 id 拼成一条 claimsKey 字符串再比对；现在大多数拍子直接跳过。
        if (citiesChanged || !this.hexesValid) {
            const claimsKey = marks.map((m) => m.id).join('|');
            if (claimsKey !== this.claimsKey || !this.hexesValid) {
                this.claimsKey = claimsKey;
                this.cityHexes = this.computeCityHexes(marks);
                this.hexesValid = true;
            }
        }

        // 按势力分组收集据点，跳过叛军 panshu（无势力色；旧 panjun 占位势力已于 2026-10-25 删除）
        const factionCities = new Map<string, string[]>();
        const factionColorMap = new Map<string, string>();
        for (const m of marks) {
            if (!m.factionId || m.factionId === 'panjun' || isBlankRebelFaction(m.factionId) || !this.cityHexes.has(m.id)) continue;
            let list = factionCities.get(m.factionId);
            if (!list) {
                list = [];
                factionCities.set(m.factionId, list);
                factionColorMap.set(m.factionId, m.color);
            }
            list.push(m.id);
        }

        const seenFactions = new Set<string>();
        for (const [fid, cityIds] of factionCities) {
            seenFactions.add(fid);
            const color = factionColorMap.get(fid) ?? HISTORICAL_FACTION_COLORS[fid] ?? '#888888';
            const checksum = cityIds.slice().sort().join('|');
            const existing = this.territoryPolygons.get(fid);
            const cached = this.territoryCache.get(fid);
            if (existing && cached && cached.checksum === checksum) {
                if (cached.color !== color) {
                    existing.setStyle({ fillColor: color });
                    cached.color = color;
                }
                continue;
            }
            const hexes: { q: number; r: number; key: number }[] = [];
            for (const id of cityIds) {
                for (const key of this.cityHexes.get(id)!) {
                    const { q, r } = GridSystem.getCoordsFromKey(key);
                    hexes.push({ q, r, key });
                }
            }
            const paths = this.getMergedPaths(hexes);
            if (paths.length === 0) continue;
            this.territoryCache.set(fid, { checksum, color });

            if (existing) {
                existing.setLatLngs(paths);
                existing.setStyle({ fillColor: color });
            } else {
                const poly = L.polygon(paths, {
                    renderer: this.territoryRenderer,
                    fillColor: color,
                    fillOpacity: 0.65,
                    color: '#1a1a1a',
                    weight: 1,
                    opacity: 0.85,
                    interactive: false,
                }).addTo(this.mini);
                this.territoryPolygons.set(fid, poly);
            }
        }

        for (const [fid, poly] of this.territoryPolygons) {
            if (!seenFactions.has(fid)) {
                poly.remove();
                this.territoryPolygons.delete(fid);
                this.territoryCache.delete(fid);
            }
        }
    }

    /** 占格：每座据点 TERRITORY_CAP_KM 以内、不在水上的格子归最近的城；返回 据点 id → 格子 key 列表 */
    private computeCityHexes(marks: { id: string; lat: number; lng: number }[]): Map<string, number[]> {
        const best = new Map<number, { id: string; d: number }>();
        const rings = Math.ceil(TERRITORY_CAP_KM / 28) + 1;
        for (const city of marks) {
            if (!Number.isFinite(city.lat) || !Number.isFinite(city.lng)) continue;
            const center = GridSystem.latLngToAxial(city.lat, city.lng);
            const cosLat = Math.cos((city.lat * Math.PI) / 180);
            for (let dq = -rings; dq <= rings; dq++) {
                const drMin = Math.max(-rings, -dq - rings);
                const drMax = Math.min(rings, -dq + rings);
                for (let dr = drMin; dr <= drMax; dr++) {
                    const q = center.q + dq;
                    const r = center.r + dr;
                    const p = GridSystem.axialToLatLng(q, r);
                    const d = Math.hypot(p.lat - city.lat, (p.lng - city.lng) * cosLat) * 111;
                    if (d > TERRITORY_CAP_KM) continue;
                    if ((dq !== 0 || dr !== 0) && this.isWater(p.lat, p.lng)) continue;
                    const key = GridSystem.getSpatialKey(q, r);
                    const cur = best.get(key);
                    if (!cur || d < cur.d) best.set(key, { id: city.id, d });
                }
            }
        }
        const out = new Map<string, number[]>();
        for (const [key, { id }] of best) {
            let list = out.get(id);
            if (!list) {
                list = [];
                out.set(id, list);
            }
            list.push(key);
        }
        return out;
    }

    /** 水域图（ESRI 晕渲 WATER_MASK_ZOOM 级全世界瓦片 → 判水掩膜，与海岸线描边同一判据）；拉完重新占格 */
    private async loadWaterMask(): Promise<void> {
        const n = 1 << WATER_MASK_ZOOM;
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = n * size;
        canvas.height = n * size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        await Promise.all(Array.from({ length: n * n }, (_, k) => new Promise<void>((resolve) => {
            const x = k % n;
            const y = Math.floor(k / n);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => { ctx.drawImage(img, x * size, y * size); resolve(); };
            img.onerror = () => resolve();
            img.src = ESRI_SHADED_RELIEF_URL.replace('{z}', String(WATER_MASK_ZOOM)).replace('{y}', String(y)).replace('{x}', String(x));
        })));
        const w = n * size;
        this.waterMaskW = w;
        this.waterMask = buildWaterMask(ctx.getImageData(0, 0, w, w).data, w * w);
        this.claimsKey = '';
        // [PERF 2026-10-26] 水域图换了 → 占格必须重算（原来的判据是「claimsKey 变了」，现在独立标脏）
        this.hexesValid = false;
        this.territoryDirty = true;
    }

    private isWater(lat: number, lng: number): boolean {
        const w = this.waterMaskW;
        const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
        const px = Math.min(w - 1, Math.max(0, Math.floor(((lng + 180) / 360) * w)));
        const py = Math.min(w - 1, Math.max(0, Math.floor((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * w)));
        return this.waterMask![py * w + px] === 1;
    }

    /**
     * 🔴 [2026-10-09 主人令] 小地图独立六边形合并算法（不改动大地图代码）：
     * 消除相邻公共内边，保留外轮廓段并拼接成闭合路径。
     */
    private getMergedPaths(hexList: { q: number; r: number; key: number }[]): L.LatLng[][] {
        if (hexList.length === 0) return [];
        const segments = new Set<string>();
        const coordMap = new Map<string, { lat: number; lng: number }>();
        const pKey = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

        for (const h of hexList) {
            const center = GridSystem.axialToLatLng(h.q, h.r);
            const corners = GridSystem.getHexagonCorners(center);
            for (let i = 0; i < 6; i++) {
                const c1 = corners[i];
                const c2 = corners[(i + 1) % 6];
                const k1 = pKey(c1.lat, c1.lng);
                const k2 = pKey(c2.lat, c2.lng);
                const forward = `${k1}|${k2}`;
                const backward = `${k2}|${k1}`;
                if (segments.has(backward)) segments.delete(backward);
                else {
                    segments.add(forward);
                    coordMap.set(k1, c1);
                    coordMap.set(k2, c2);
                }
            }
        }

        const paths: L.LatLng[][] = [];
        const nextMap = new Map<string, string>();
        for (const seg of segments) {
            const [k1, k2] = seg.split('|');
            nextMap.set(k1, k2);
        }
        while (nextMap.size > 0) {
            const loop: L.LatLng[] = [];
            const startKey = nextMap.keys().next().value!;
            let curr = startKey;
            let safety = 0;
            while (nextMap.has(curr) && safety++ < 5000) {
                loop.push(L.latLng(coordMap.get(curr)!));
                const next = nextMap.get(curr)!;
                nextMap.delete(curr);
                curr = next;
                if (curr === startKey) break;
            }
            if (loop.length > 0) paths.push(loop);
        }
        return paths;
    }

    public destroy(): void {
        window.clearInterval(this.timer);
        for (const poly of this.territoryPolygons.values()) poly.remove();
        this.territoryPolygons.clear();
        this.territoryCache.clear();
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
            .world-minimap .wm-btn.wm-color.is-off { opacity: 0.4; color: #8a7f6a; }
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
