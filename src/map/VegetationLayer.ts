import L from 'leaflet';
import { CITIES_V2 } from '../data/cities_v2';
import { resolveTerrainTile } from '../ui/Scene13Biome';
import { queryBaseTile } from '../ui/scene13/WorldBaseMap';
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
const PATCH_RADIUS_PROJ = 32;
/** 斑块屏幕半径下限（px）。zoom 8 时缩放系数是 0.5，26 会缩成 13px，一屏十几个 13px 的淡斑
 *  肉眼基本看不出来 —— 战略地图默认就在 zoom 8，所以给个下限保证「看得见」。 */
const PATCH_MIN_SCREEN_RADIUS = 24;
/** 林区簇网格步长（投影px）：对应 DE 的 number_of_groups（"几簇"），每簇是一大片林区，
 *  stride 越大簇越稀、越"成带"。 */
const CLUSTER_STRIDE = SAMPLE_STEP * 1.6;
/** 簇内斑块散布半径（投影px）：对应 DE 的 group_placement_radius + set_loose_grouping。
 *  改小（×0.55）：让同簇斑块聚拢重叠成"一片"而非离散雀斑点；配合 count 增大填实簇内。 */
const CLUSTER_RADIUS = SAMPLE_STEP * 0.55;

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
    private visible = false;
    private renderTimer: number | null = null;
    /** 上次重画时的采样格窗口指纹：没跨格 = 林区斑块集合一模一样，canvas 跟随平移即可，不必重画 */
    private lastRenderKey = '';
    private lastRenderAt = 0;
    /** 瓦片没到时的补画计数（按视口指纹计），封顶防止离线时无限空转 */
    private retryKey = '';
    private retryCount = 0;

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

        // 尺寸兜底：构造时地图容器还没布局出来（0×0）的话 canvas 会一直是 0×0，
        // 之后没人再触发 resize 就永远画不出东西。每次画之前对一下尺寸。
        const size = this.map.getSize();
        if (size.x > 0 && (this.canvas.width !== size.x || this.canvas.height !== size.y)) this.resize();

        // canvas 跟随图层平移（含缩放动画期间的对齐）
        L.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]));

        const bounds = this.map.getBounds();
        const nw = this.map.project(bounds.getNorthWest(), SAMPLE_ZOOM);
        const se = this.map.project(bounds.getSouthEast(), SAMPLE_ZOOM);
        const xMin = Math.floor(nw.x / CLUSTER_STRIDE) * CLUSTER_STRIDE;
        const xMax = Math.ceil(se.x / CLUSTER_STRIDE) * CLUSTER_STRIDE;
        const yMin = Math.floor(nw.y / CLUSTER_STRIDE) * CLUSTER_STRIDE;
        const yMax = Math.ceil(se.y / CLUSTER_STRIDE) * CLUSTER_STRIDE;

        // 采样窗口没跨格 → 这一屏的林区与上次逐格相同（canvas 按 position 跟随平移），直接返回省掉整屏重采样
        const season = currentTreeSeason();
        const key = `${zoom}|${xMin}|${xMax}|${yMin}|${yMax}|${season}`;
        if (key === this.lastRenderKey) return;
        this.lastRenderKey = key;
        this.lastRenderAt = performance.now();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 屏幕半径 = 投影半径 × 2^(当前zoom−SAMPLE_ZOOM)：斑块地理范围恒定，缩放不跳
        const screenRadiusScale = Math.pow(2, zoom - SAMPLE_ZOOM);
        // DEM 瓦片是异步到的：这一轮有格子因为瓦片没到被跳过，就不能把这次当成「画完了」
        let missingTiles = 0;

        const paddedBounds = bounds.pad(0.08);
        const visibleCities = CITIES_V2
            .filter((city) => paddedBounds.contains([city.lat, city.lng]))
            .map((city) => this.map.latLngToContainerPoint([city.lat, city.lng]));

        // DE 式成簇采样：按簇网格撒"林区簇核"，簇核地表密度决定成不成林，簇内斑块数随密度分档。
        // 对应 DE 的 number_of_groups(几簇) + group_placement_radius(簇半径) + set_loose_grouping(松散成簇)。
        for (let cy = yMin; cy <= yMax; cy += CLUSTER_STRIDE) {
            for (let cx = xMin; cx <= xMax; cx += CLUSTER_STRIDE) {
                // 簇核：落在簇格中央并随机抖动，避免机械网格感
                const cxJ = cx + CLUSTER_STRIDE * 0.5 + (hash(cx, cy, 41) - 0.5) * CLUSTER_STRIDE * 0.5;
                const cyJ = cy + CLUSTER_STRIDE * 0.5 + (hash(cx, cy, 42) - 0.5) * CLUSTER_STRIDE * 0.5;
                const clusterLatLng = this.map.unproject([cxJ, cyJ], SAMPLE_ZOOM);
                if (clusterLatLng.lat < -58 || clusterLatLng.lat > 75) continue;

                const elev = LandSeaSystem.getElevationAtMapPixel(
                    cxJ, cyJ, SAMPLE_ZOOM, clusterLatLng.lat, clusterLatLng.lng,
                );
                if (elev === null) { missingTiles++; continue; }
                if (elev < 0 || elev > 3600) continue;

                // 绑地形：簇核地表密度决定这是不是林区（沙漠/荒漠 → 无簇 → 留白），DE 的 terrain 类别绑定
                const tile = queryBaseTile({ lat: clusterLatLng.lat, lng: clusterLatLng.lng, isSiege: false, isWinter: season === 2 }) ?? resolveTerrainTile(clusterLatLng.lat, clusterLatLng.lng, season);
                const density = densityFor(tile);
                if (density < MIN_PATCH_DENSITY) continue;

                // 成簇：不是每格都长树，按"簇密度 × 随机扰动"决定这一簇成不成立（DE 密度分档 + percent_chance）。
                // 原来是 density×(0.55~1.45)，草地(0.28)只有 0.15~0.41、林地(0.42)也才 0.23~0.61，
                // 七成格子直接不长 —— 叠上 zoom 8 的半径缩水就成了「植被不显示」。
                // 现在放大到 ×2.2：林地 0.65~1.0、草地 0.43~0.75，稀树/半干旱仍然明显稀疏。
                const clusterChance = Math.min(1, density * 2.2 * (0.7 + hash(cx, cy, 43) * 0.6));
                if (hash(cx, cy, 44) >= clusterChance) continue;

                // 簇内斑块数：密林一簇更多、更实；稀树更少（DE number_of_objects 随档位）。
                // ×2 提高：斑块散布半径改小后靠叠数量把簇填实，连成一片而非稀疏点缀。
                const baseCount = density >= 0.4 ? 14 : density >= 0.25 ? 10 : 6;
                const count = Math.max(1, Math.round(baseCount * (0.7 + hash(cx, cy, 45) * 0.7)));

                for (let i = 0; i < count; i++) {
                    const ang = hash(cx, cy, i + 50) * Math.PI * 2;
                    // 盘面均匀分布：sqrt 偏置让斑块铺满簇圆而非挤中心
                    const rad = Math.sqrt(hash(cx, cy, i + 60)) * CLUSTER_RADIUS;
                    const px = cxJ + Math.cos(ang) * rad;
                    const py = cyJ + Math.sin(ang) * rad;
                    const ptLatLng = this.map.unproject([px, py], SAMPLE_ZOOM);

                    // 斑块再绑地形：落到林区外的斑块丢弃，保持林区边界干净
                    const ptTile = queryBaseTile({ lat: ptLatLng.lat, lng: ptLatLng.lng, isSiege: false, isWinter: season === 2 }) ?? resolveTerrainTile(ptLatLng.lat, ptLatLng.lng, season);
                    if (densityFor(ptTile) < MIN_PATCH_DENSITY * 0.6) continue;

                    const center = this.map.latLngToContainerPoint(ptLatLng);
                    if (visibleCities.some((p) => p.distanceTo(center) < CITY_CLEAR_PX)) continue;

                    const asset = pickTree({ baseTile: ptTile, lat: ptLatLng.lat, lng: ptLatLng.lng, season, isSiege: false });
                    const [r, g, b] = colorFor(asset, season);
                    const densityBoost = density >= 0.4 ? 1.25 : density >= 0.25 ? 1.0 : 0.7;
                    const jitter = 0.8 + hash(cx, cy, i + 70) * 0.45;
                    const radius = Math.max(
                        PATCH_MIN_SCREEN_RADIUS * densityBoost * jitter,
                        PATCH_RADIUS_PROJ * screenRadiusScale * densityBoost * jitter,
                    );
                    this.drawPatch(center.x, center.y, radius, r, g, b, density >= 0.25 ? 0.72 : 0.55);
                }
            }
        }

        // DEM 瓦片异步到达：这轮被跳过的格子必须补画。
        // 只靠 land-sea-tiles-updated 不够 —— 瓦片可能在两次 render 的间隙就位，
        // 而 lastRenderKey 已经把这屏标成「画过了」，结果一屏空白一直留到下次跨格。
        if (missingTiles > 0) {
            if (this.retryKey !== key) { this.retryKey = key; this.retryCount = 0; }
            // 高程瓦片是 S3 上的 Mapzen Terrarium，冷启动一屏几十片、十几秒才齐。
            // 实测印度那一屏：等 5 秒画出来 0%，等到瓦片齐了是 8.1%。所以补画要等得够久，
            // 用退避拉长间隔（0.6s 起、每次 +0.3s，共 15 次≈40 秒），拉不到就收手不空转。
            if (this.retryCount < 15) {
                this.retryCount++;
                this.lastRenderKey = '';
                this.scheduleRender(600 + this.retryCount * 300);
            }
        }
    }

    /** 径向渐变柔边斑块：中心实色 → 外缘透明，模拟林地边缘柔化 */
    private drawPatch(x: number, y: number, radius: number, r: number, g: number, b: number, alpha: number): void {
        const ctx = this.ctx;
        const grad = ctx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.7, `rgba(${r},${g},${b},${alpha * 0.7})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
