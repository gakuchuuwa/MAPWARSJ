import L from 'leaflet';
import { GridSystem } from '../systems/GridSystem';
import { HISTORICAL_FACTION_COLORS } from '../data/HistoricalFactionColors';
import { CityType } from '../types/core';

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
    private territoryDirty = true;
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
    /** 据点势力色圆点：id → 圆点；单独一个 canvas 渲染器，上千个点也不卡 */
    private cityDots = new Map<string, L.CircleMarker>();
    private cityDotColor = new Map<string, string>();
    private cityRenderer = L.canvas({ padding: 0.5 });
    /** 领土多边形单独一层 canvas，压在镜头框、行军线、据点圆点下面 */
    private territoryRenderer = L.canvas({ padding: 0.5, pane: "wm-territory" });
    private tickN = 0;

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
            worldCopyJump: false,
        });
        L.tileLayer(BASE_URL, { noWrap: true, minZoom: 0, maxZoom: 8 }).addTo(this.mini);
        this.mini.createPane("wm-territory").style.zIndex = "350";
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
        // 🔴 [2026-10-08 主人令] 势力色开关：显示 / 不显示
        this.colorBtn.addEventListener('click', () => this.setColorMode((this.colorMode + 1) % 4));

        this.setExpanded(true);
        this.setLevel(LEVEL_DEFAULT);
        this.setTrailOn(true);
        this.timer = window.setInterval(() => this.tick(), TICK_MS);
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
        this.syncTerritoryPolygons(true, res.marks);
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
            }
            return null;
        }
        if (id !== this.lastHostId) {
            this.lastHostId = id;
            this.trailPts.length = 0;
            this.trail.setLatLngs([]);
            if (!this.trailOn) this.setTrailOn(true);   // 换军团/重新加入势力 → 重新显示
            return null; // 本拍跳过采样，免得把上一军团/上一位置接进新线
        }
        return id;
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
        // 🔴 [2026-10-07 主人令] 仅加入势力军团期间记录与绘制行军线路，离开势力不画，再次加入再画
        const currentHostId = this.syncHostLegion();
        const p = this.getPlayerPos();
        if (currentHostId && p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
            const last = this.trailPts[this.trailPts.length - 1];
            if (!last || Math.hypot(last.lat - p.lat, last.lng - p.lng) >= TRAIL_STEP_DEG) {
                this.trailPts.push(L.latLng(p.lat, p.lng));
                if (this.trailPts.length > TRAIL_MAX) this.trailPts.shift();
            }
        }
        if (hide || !this.expanded) return;
        if (++this.tickN % 4 === 0) {
            const { colorChanged, citiesChanged, marks } = this.syncCityDots();
            this.syncTerritoryPolygons(colorChanged || citiesChanged, marks);
        }
        if (this.trailOn && currentHostId) this.trail.setLatLngs(this.trailPts);
        else this.trail.setLatLngs([]);
        if (p) this.dot.setLatLng([p.lat, p.lng]);
        this.viewRect.setBounds(this.mainMap.getBounds());
        if (this.level > LEVEL_MIN) this.applyView();
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
     * 🔴 [2026-10-09 主人令] 小地图独立分配六边形并合并势力领土多边形
     * 按城型占圈：big_city 3 圈，medium_city / pass 2 圈，其余 1 圈；
     * 一个格子被多座城占到时，归离它最近的那座城；
     * 满足任一条重算，否则不动：
     * ① 有据点换了颜色（colorChanged）
     * ② 可见据点集合变了（citiesChanged）
     * ③ 首次脏标记（this.territoryDirty）
     */
    private syncTerritoryPolygons(
        needsRecalc: boolean,
        marks: { id: string; lat: number; lng: number; color: string; type?: CityType; factionId?: string }[]
    ): void {
        if (!this.showTerritory) return;
        if (!needsRecalc && !this.territoryDirty) return;
        this.territoryDirty = false;

        // 格子归属表：hexKey -> { fid, color, distSq }
        const hexMap = new Map<number, { fid: string; color: string; distSq: number }>();

        for (const city of marks) {
            if (!city.factionId || city.factionId === 'panjun') continue;
            if (!Number.isFinite(city.lat) || !Number.isFinite(city.lng)) continue;
            const radius = city.type === 'big_city' ? 3 : (city.type === 'medium_city' || city.type === 'pass' ? 2 : 1);
            const centerHex = GridSystem.latLngToAxial(city.lat, city.lng);

            for (let dq = -radius; dq <= radius; dq++) {
                const drMin = Math.max(-radius, -dq - radius);
                const drMax = Math.min(radius, -dq + radius);
                for (let dr = drMin; dr <= drMax; dr++) {
                    const q = centerHex.q + dq;
                    const r = centerHex.r + dr;
                    const hexKey = GridSystem.getSpatialKey(q, r);
                    const hexCenter = GridSystem.axialToLatLng(q, r);
                    const dLat = hexCenter.lat - city.lat;
                    const dLng = hexCenter.lng - city.lng;
                    const distSq = dLat * dLat + dLng * dLng;

                    const cur = hexMap.get(hexKey);
                    if (!cur || distSq < cur.distSq) {
                        hexMap.set(hexKey, { fid: city.factionId, color: city.color, distSq });
                    }
                }
            }
        }

        // 按势力分组收集格子
        const factionHexes = new Map<string, { q: number; r: number; key: number }[]>();
        const factionColorMap = new Map<string, string>();
        for (const [key, item] of hexMap) {
            let list = factionHexes.get(item.fid);
            if (!list) {
                list = [];
                factionHexes.set(item.fid, list);
                factionColorMap.set(item.fid, item.color);
            }
            const { q, r } = GridSystem.getCoordsFromKey(key);
            list.push({ q, r, key });
        }

        const seenFactions = new Set<string>();
        for (const [fid, hexes] of factionHexes) {
            seenFactions.add(fid);
            const color = factionColorMap.get(fid) ?? HISTORICAL_FACTION_COLORS[fid] ?? '#888888';
            const checksum = hexes.map((h) => h.key).sort((a, b) => a - b).join('|');
            const existing = this.territoryPolygons.get(fid);
            const cached = this.territoryCache.get(fid);
            if (existing && cached && cached.checksum === checksum) {
                if (cached.color !== color) {
                    existing.setStyle({ fillColor: color });
                    cached.color = color;
                }
                continue;
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
                    fillOpacity: 0.35,
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
