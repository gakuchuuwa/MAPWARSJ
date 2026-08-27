import L from 'leaflet';
import { CITIES_V2 } from '../data/cities_v2';
import { resolveTerrainTile } from '../ui/Scene13Biome';
import { pickTree, type TreeSeason } from '../ui/scene13/TreeAssignment';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';

const PANE = 'vegetationPane';
const SAMPLE_ZOOM = 9;
const SAMPLE_STEP = 112;
const MIN_ZOOM = 8;
const MAX_ZOOM = 10;
const CITY_CLEAR_PX = 42;
/** 两次重建之间的最小间隔（ms）。跟拍军团时 GameAppLoop 每帧 setView → 每帧 moveend，
 *  不节流的话整层色块每帧重画。 */
const MIN_RENDER_INTERVAL_MS = 200;
/** 单块林区斑块在 SAMPLE_ZOOM 投影空间的半径（投影 px）。屏幕半径 = 此值 × 2^(当前zoom−SAMPLE_ZOOM)，
 *  保证斑块的地理范围恒定、缩放不跳位。 */
const PATCH_RADIUS_PROJ = 26;

function hash(x: number, y: number, salt = 0): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453123;
    return n - Math.floor(n);
}

function densityFor(tile: string): number {
    if (tile === 'for' || tile === 'fo2' || tile === 'underbrush_leaves' || tile === 'gr6') return 0.42;
    if (tile === 'grs' || tile === 'gr2' || tile === 'gr3' || tile === 'gr4' || tile === 'sh4' || tile === 'qs2') return 0.28;
    if (tile === 'gr5' || tile === 'gr7' || tile === 'ds2' || tile === 'ds4') return 0.16;
    if (tile === 'snd' || tile === 'sno' || tile === 'sn2' || tile === 'snf') return 0.08;
    if (tile === 'des' || tile === 'pal' || tile === 'pal1' || tile === 'qs' || tile === 'ds5' || tile === 'rck') return 0.045;
    return 0.18;
}

/** 低于此密度的地表（沙漠/荒漠/岩/雪）战略尺度视为无林，不画色块 */
const MIN_PATCH_DENSITY = 0.16;

function currentTreeSeason(): TreeSeason {
    const season = (window as any).game?.timeSystem?.getSeason?.() ?? 0;
    if (season === 2) return 1;
    if (season === 3) return 2;
    return 0;
}

/** 树种 → 林区色相类别（用于色调随植被类型变化） */
function hueClass(asset: string): 'conifer' | 'broadleaf' | 'arid' | 'dead' {
    if (/PINE|CYPRESS|SNOW_|BAMBOO|CEDAR/i.test(asset)) return 'conifer';
    if (/PALM|ACACIA|BAOBAB|OLIVE|DRAGON_TREE/i.test(asset)) return 'arid';
    if (/DEAD_TREE/i.test(asset)) return 'dead';
    return 'broadleaf';
}

/** 色相表：季节(0绿/1橙/2白) × 类别 → 林区块基色（可调，主人看观感后微调） */
const PATCH_COLOR: Record<'conifer' | 'broadleaf' | 'arid' | 'dead', [number, number, number]> = {
    conifer:   [36, 86, 52],   // 针叶偏冷深绿
    broadleaf: [72, 110, 52],  // 阔叶暖绿
    arid:      [130, 128, 58], // 棕榈/旱生偏黄绿
    dead:      [112, 104, 90], // 枯树灰褐
};
const PATCH_COLOR_AUTUMN: Record<'conifer' | 'broadleaf' | 'arid' | 'dead', [number, number, number]> = {
    conifer:   [88, 104, 52],
    broadleaf: [168, 108, 42], // 阔叶秋橙
    arid:      [150, 128, 58],
    dead:      [136, 116, 92],
};
const PATCH_COLOR_WINTER: Record<'conifer' | 'broadleaf' | 'arid' | 'dead', [number, number, number]> = {
    conifer:   [118, 138, 122],
    broadleaf: [176, 172, 160], // 阔叶冬灰白
    arid:      [160, 154, 138],
    dead:      [150, 140, 124],
};

function colorFor(asset: string, season: TreeSeason): [number, number, number] {
    const c = hueClass(asset);
    if (season === 1) return PATCH_COLOR_AUTUMN[c];
    if (season === 2) return PATCH_COLOR_WINTER[c];
    return PATCH_COLOR[c];
}

export class VegetationLayer {
    private readonly map: L.Map;
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private visible = true;
    private renderTimer: number | null = null;
    /** 上次重画时的采样格窗口指纹：没跨格 = 林区斑块集合一模一样，canvas 跟随平移即可，不必重画 */
    private lastRenderKey = '';
    private lastRenderAt = 0;

    private readonly onViewportChanged = () => this.scheduleRender();
    private readonly onResize = () => { this.resize(); this.scheduleRender(); };
    private readonly onTerrainReady = () => { this.lastRenderKey = ''; this.scheduleRender(200); };

    constructor(map: L.Map) {
        this.map = map;
        if (!map.getPane(PANE)) map.createPane(PANE);
        const pane = map.getPane(PANE)!;
        pane.style.zIndex = '590';
        pane.style.pointerEvents = 'none';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'strategic-vegetation leaflet-zoom-animated';
        this.canvas.style.pointerEvents = 'none';
        this.ctx = this.canvas.getContext('2d')!;
        pane.appendChild(this.canvas);

        map.on('moveend zoomend', this.onViewportChanged);
        map.on('resize', this.onResize);
        window.addEventListener('land-sea-tiles-updated', this.onTerrainReady);
        this.resize();
        this.render();
    }

    public setVisible(visible: boolean): void {
        this.visible = visible;
        this.canvas.style.display = visible ? 'block' : 'none';
        this.lastRenderKey = '';
        if (visible) this.scheduleRender();
        else this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private resize(): void {
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        L.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]));
    }

    private scheduleRender(delay = 0): void {
        if (!this.visible) return;
        if (this.renderTimer !== null) window.clearTimeout(this.renderTimer);
        // 跟拍时 moveend 每帧都来：距上次重画不足 MIN_RENDER_INTERVAL_MS 就把这次往后推，
        // 保证「连续平移」期间最多 5 次/秒重画，而不是 60 次/秒。
        const since = performance.now() - this.lastRenderAt;
        const wait = Math.max(delay, since >= MIN_RENDER_INTERVAL_MS ? 0 : MIN_RENDER_INTERVAL_MS - since);
        this.renderTimer = window.setTimeout(() => {
            this.renderTimer = null;
            this.render();
        }, wait);
    }

    private render(): void {
        if (!this.visible) { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); return; }

        const zoom = Math.floor(this.map.getZoom());
        const inRange = zoom >= MIN_ZOOM && zoom <= MAX_ZOOM;
        this.canvas.style.display = inRange ? 'block' : 'none';
        if (!inRange) { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.lastRenderKey = ''; return; }

        // canvas 跟随图层平移（含缩放动画期间的对齐）
        L.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]));

        const bounds = this.map.getBounds();
        const nw = this.map.project(bounds.getNorthWest(), SAMPLE_ZOOM);
        const se = this.map.project(bounds.getSouthEast(), SAMPLE_ZOOM);
        const xMin = Math.floor(nw.x / SAMPLE_STEP) * SAMPLE_STEP;
        const xMax = Math.ceil(se.x / SAMPLE_STEP) * SAMPLE_STEP;
        const yMin = Math.floor(nw.y / SAMPLE_STEP) * SAMPLE_STEP;
        const yMax = Math.ceil(se.y / SAMPLE_STEP) * SAMPLE_STEP;

        // 采样窗口没跨格 → 这一屏的林区与上次逐格相同（canvas 按 position 跟随平移），直接返回省掉整屏重采样
        const season = currentTreeSeason();
        const key = `${zoom}|${xMin}|${xMax}|${yMin}|${yMax}|${season}`;
        if (key === this.lastRenderKey) return;
        this.lastRenderKey = key;
        this.lastRenderAt = performance.now();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 屏幕半径 = 投影半径 × 2^(当前zoom−SAMPLE_ZOOM)：斑块地理范围恒定，缩放不跳
        const screenRadiusScale = Math.pow(2, zoom - SAMPLE_ZOOM);

        const paddedBounds = bounds.pad(0.08);
        const visibleCities = CITIES_V2
            .filter((city) => paddedBounds.contains([city.lat, city.lng]))
            .map((city) => this.map.latLngToContainerPoint([city.lat, city.lng]));

        for (let wy = yMin; wy <= yMax; wy += SAMPLE_STEP) {
            for (let wx = xMin; wx <= xMax; wx += SAMPLE_STEP) {
                const chance = hash(wx, wy);
                const latLng = this.map.unproject([wx + SAMPLE_STEP * 0.5, wy + SAMPLE_STEP * 0.5], SAMPLE_ZOOM);
                if (latLng.lat < -58 || latLng.lat > 75) continue;

                const elev = LandSeaSystem.getElevationAtMapPixel(
                    wx + SAMPLE_STEP * 0.5,
                    wy + SAMPLE_STEP * 0.5,
                    SAMPLE_ZOOM,
                    latLng.lat,
                    latLng.lng,
                );
                if (elev === null || elev < 0 || elev > 3600) continue;

                const tile = resolveTerrainTile(latLng.lat, latLng.lng, season);
                const density = densityFor(tile);
                if (density < MIN_PATCH_DENSITY) continue; // 沙漠/荒漠/岩/雪：战略尺度无林
                if (chance >= density) continue;

                const center = this.map.latLngToContainerPoint(latLng);
                if (visibleCities.some((p) => p.distanceTo(center) < CITY_CLEAR_PX)) continue;

                const asset = pickTree({ baseTile: tile, lat: latLng.lat, lng: latLng.lng, season, isSiege: false });
                const [r, g, b] = colorFor(asset, season);
                // 密度越高块越大、越实；越稀越淡、越小。加轻微随机扰动避免呆板。
                const densityBoost = density >= 0.4 ? 1.25 : density >= 0.25 ? 1.0 : 0.7;
                const jitter = 0.8 + hash(wx, wy, 31) * 0.45;
                const radius = PATCH_RADIUS_PROJ * screenRadiusScale * densityBoost * jitter;
                this.drawPatch(center.x, center.y, radius, r, g, b, density >= 0.25 ? 0.4 : 0.28);
            }
        }
    }

    /** 径向渐变柔边斑块：中心实色 → 外缘透明，模拟林地边缘柔化 */
    private drawPatch(x: number, y: number, radius: number, r: number, g: number, b: number, alpha: number): void {
        const ctx = this.ctx;
        const grad = ctx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.7, `rgba(${r},${g},${b},${alpha * 0.55})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
