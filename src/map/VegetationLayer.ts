import L from 'leaflet';
import { CITIES_V2 } from '../data/cities_v2';
import { resolveTerrainTile } from '../ui/Scene13Biome';
import { queryBaseTile } from '../ui/scene13/WorldBaseMap';
import { pickTree, type TreeSeason } from '../ui/scene13/TreeAssignment';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { lngToDemGlobalX, latToDemGlobalY } from '../world/land-sea/ElevationSampler';
import { perfDoctor } from '../debug/PerfDoctor';

const PANE = 'vegetationPane';
const SAMPLE_ZOOM = 9;
const SAMPLE_STEP = 112;
const MIN_ZOOM = 9;
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
/** 树贴图在 SAMPLE_ZOOM(9) 时的基准高度（px）。每偏离一级 zoom ×1.35。
 *  ⚠️ 22 太小，实测在 zoom 9 一屏里几乎看不见；30 才读得出是树。 */
const TREE_BASE_PX = 30;
/** 林区簇网格步长（投影px）：对应 DE 的 number_of_groups（"几簇"），每簇是一大片林区，
 *  stride 越大簇越稀、越"成带"。 */
const CLUSTER_STRIDE = SAMPLE_STEP * 1.6;
/** 簇内斑块散布半径（投影px）：对应 DE 的 group_placement_radius + set_loose_grouping。
 *  改小（×0.55）：让同簇斑块聚拢重叠成"一片"而非离散雀斑点；配合 count 增大填实簇内。 */
const CLUSTER_RADIUS = SAMPLE_STEP * 0.55;
/** 从现有林簇预算中抽出的孤树比例；只移动位置，不增加树木总数。 */
const STRAGGLER_SHARE = 0.15;
const STRAGGLER_RADIUS_MIN = CLUSTER_RADIUS * 1.8;
const STRAGGLER_RADIUS_MAX = CLUSTER_RADIUS * 3;

interface TreeDrawCommand {
    x: number;
    y: number;
    h: number;
    w: number;
    img: HTMLImageElement;
    imgNext: HTMLImageElement | null;
}

/**
 * 战略地图树贴图缓存：树名 → `public/SUCAI_NATURE/<树名>/preview.png`（DE 单棵成品图）。
 *
 * 🔴 [2026-08-31 主人：「植被只显示这种雀斑」] 本层原来画的是**径向渐变柔边色圆**，
 *    在地图上就是一团团模糊绿斑，既不像树也看不出植被类型 —— 而 DE 的树素材早就摆进
 *    `public/SUCAI_NATURE/` 了（133 个，每个都有 preview.png 单棵图，8~23KB）。
 *    改成直接画树。
 */
const TREE_IMG = new Map<string, HTMLImageElement>();
/** 已确认加载失败的树名（不再重试，免得每帧刷 404） */
const TREE_IMG_FAILED = new Set<string>();

function treeImage(asset: string, onReady: () => void): HTMLImageElement | null {
    if (TREE_IMG_FAILED.has(asset)) return null;
    const hit = TREE_IMG.get(asset);
    if (hit) return hit.complete && hit.naturalWidth > 0 ? hit : null;
    const img = new Image();
    img.onload = () => onReady();
    img.onerror = () => { TREE_IMG.delete(asset); TREE_IMG_FAILED.add(asset); };
    img.src = `/SUCAI_NATURE/${asset}/preview.png`;
    TREE_IMG.set(asset, img);
    return null;
}

// [2026-08-31] 按 PerfDoctor 的铁律登记：任何图片缓存都必须能报**字节数**。
//   这个缓存条数不多（≤133 个树种）且每张 preview 只有 8~23KB，但登记了才有据可查。
if (import.meta.env.DEV) {
    perfDoctor.registerCache({
        name: 'VegetationLayer:TREE_IMG(战略树贴图)',
        where: 'src/map/VegetationLayer.ts:TREE_IMG',
        entries: () => TREE_IMG.size,
        bytes: () => {
            let b = 0;
            for (const im of TREE_IMG.values()) b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            return b;
        },
        limitKind: 'count',
        limitValue: 133,
    });
}

/**
 * 水陆判定的**纠偏层**：海拔说「低于海平面」时，再问一次 WaterMask 是不是其实是陆地。
 *
 * 🔴 为什么是这个组合（2026-08-31 走了两条弯路才定下来）：
 *   · 主判据必须用 `getElevationAtMapPixel` —— 它会**按需发起瓦片请求**，
 *     而 `createBlockProber` / `probeLandSea` 只读同步缓存、从不请求。
 *     我一度把整套判定换成探针，结果瓦片没人去拉、探针恒返回 'pending'，
 *     实测德意志 187 棵→5 棵、俄北 224→0（render 只剩 0.3ms，全卡在第一道闸）。
 *   · 但**只看海拔是错的**：里海(-27m)、吐鲁番(-51m) 是低于海平面的陆地，
 *     单看海拔那一带永远不长树。所以海拔说「水」时，用掩膜纠偏一次；
 *     掩膜没到（返回 null）就维持海拔的判断，宁可少画几棵也不要把树画进海。
 */
function maskSaysLand(lat: number, lng: number): boolean {
    return LandSeaSystem.getWaterSampler().isWaterSync(lat, lng) === false;
}

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

/**
 * 季节**渐变**（2026-08-31 主人要求）：季末的一段时间里，同一棵树同时画「本季」和「下季」两张，
 * 用透明度交叉淡出，而不是到点整片瞬间换装。
 *
 * 只在季末 `SEASON_BLEND_WINDOW` 这段窗口里混合，其余时间照旧只画一张 —— 平时零额外开销。
 * 游戏季节有 4 个（春夏秋冬）但树只有 3 态（春夏/秋/冬），所以真正会换装的过渡是
 * 夏→秋、秋→冬、冬→春 三处；春→夏两边都是 0 态，`pickTree` 结果相同，天然不触发混合。
 */
const SEASON_BLEND_WINDOW = 0.75;

function nextTreeSeason(s: TreeSeason): TreeSeason {
    // 游戏季推进 春→夏→秋→冬→春；映射到树态就是 0→0→1→2→0
    const gs = (window as any).game?.timeSystem?.getSeason?.() ?? 0;
    if (gs === 1) return 1;   // 夏 → 下一季是秋
    if (gs === 2) return 2;   // 秋 → 冬
    if (gs === 3) return 0;   // 冬 → 春
    return s;                 // 春 → 夏，树态不变
}

/** 0 = 不混合；>0 = 下一季占的权重 */
function seasonBlend(): number {
    const p = (window as any).game?.timeSystem?.getSeasonProgress?.();
    if (typeof p !== 'number') return 0;
    if (p <= 1 - SEASON_BLEND_WINDOW) return 0;
    return (p - (1 - SEASON_BLEND_WINDOW)) / SEASON_BLEND_WINDOW;
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
    /** 只挪画布位置，不重绘（连续平移每帧调用） */
    private readonly onCanvasFollow = () => {
        L.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]));
    };
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
        // 🔴 [2026-08-31 修「军团一动树也动」] 必须绑 `move`（连续平移中每帧都发），
        //    不能只绑 `moveend`。跟拍时 GameAppLoop 每帧 panBy 平移地图，而画布位置原来只在
        //    **停下来**才更新一次，于是树相对地形一路滑动 —— 看着就像树跟着军团跑。
        //    这里只做 setPosition（一次 transform，不重绘不重采样），开销可忽略。
        map.on('move zoom', this.onCanvasFollow);
        map.on('resize', this.onResize);
        window.addEventListener('land-sea-tiles-updated', this.onTerrainReady);
        this.resize();
        this.render();
        this.startSeasonBlendWatch();
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

    /**
     * 季节渐变心跳：过渡窗口里镜头可能完全不动，没人触发重画，渐变就会卡在某一档。
     * 每 600ms 敲一次 scheduleRender —— render() 开头会比对 key，档位没变就立刻返回，
     * 所以非过渡期这个心跳的实际开销约等于零（实测 render 平均 2.3ms，且大部分是 key 命中直接 return）。
     */
    private startSeasonBlendWatch(): void {
        if (this.seasonTimer !== null) return;
        this.seasonTimer = window.setInterval(() => {
            if (!this.visible) return;
            this.scheduleRender();
        }, 300);
    }
    private seasonTimer: number | null = null;

    /** 树贴图到货 → 重画本屏（贴图是异步的，首帧必然缺一批） */
    private onTreeImageReady = (): void => {
        this.lastRenderKey = '';
        this.scheduleRender(60);
    };

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
        if (!import.meta.env.DEV) { this.renderInner(); return; }
        // [2026-08-31] 接 PerfDoctor：树多了到底卡不卡，靠这条数说话，别靠感觉。
        // scanned 记本次画了多少棵树，便于把「棵数」和「耗时」对起来看。
        const t0 = performance.now();
        this.renderInner();
        perfDoctor.note('VegetationLayer.render', performance.now() - t0,
            'src/map/VegetationLayer.ts:render', this.lastTreeCount);
    }

    /** 本次 render 实际画了多少棵树（PerfDoctor 采样用） */
    private lastTreeCount = 0;

    private renderInner(): void {
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
        // 混合权重量化成 20 档进 key：过渡期每跨一档才重画一次（每档 5% 细腻过渡），
        // 配合 200ms 节流，一次过渡平滑均匀演进，绝无突然跳变感。
        const blend = seasonBlend();
        const nextSeason = nextTreeSeason(season);
        const blendStep = blend > 0 && nextSeason !== season ? Math.round(blend * 20) : 0;
        const key = `${zoom}|${xMin}|${xMax}|${yMin}|${yMax}|${season}|${blendStep}`;
        if (key === this.lastRenderKey) return;
        this.lastRenderKey = key;
        this.lastRenderAt = performance.now();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 屏幕半径 = 投影半径 × 2^(当前zoom−SAMPLE_ZOOM)：斑块地理范围恒定，缩放不跳
        const screenRadiusScale = Math.pow(2, zoom - SAMPLE_ZOOM);
        // DEM 瓦片是异步到的：这一轮有格子因为瓦片没到被跳过，就不能把这次当成「画完了」
        let missingTiles = 0;
        // 树贴图也是异步的：首帧一定有一批没到，同样不能算「画完了」
        let pendingImages = 0;
        let drawnTrees = 0;
        const drawCommands: TreeDrawCommand[] = [];
        // 与海陆分界线图层同款：整屏共用一个按瓦片缓存的探针（逐点查会踩 LRU 抖动）
        const probeLand = LandSeaSystem.createBlockProber();


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

                // 🔴 [2026-08-31 修「树长到海里」] 水陆判定必须走 probeLandSea（掩膜 AND 海拔），
                //    **不能用 `elev < 0`** —— 里海(-27m)、吐鲁番(-51m) 是低于海平面的**陆地**，
                //    单看海拔会把它们判成海、那一带永远不长树。判据只认 WaterMask 这一套。
                // 🔴 顺序不能反：`getElevationAtMapPixel` 会**按需发起瓦片请求**，
                //    而 `createBlockProber` 只读同步缓存、从不请求。
                //    我一度把水陆判定放在它前面，结果瓦片永远没人去拉 → 探针恒返回 'pending'
                //    → 整屏 continue，实测德意志 187 棵掉到 5 棵、俄北 224→0（render 只剩 0.4ms，
                //    全在第一道闸被拦掉）。先取高程把瓦片拉起来，再问水陆。
                const elev = LandSeaSystem.getElevationAtMapPixel(
                    cxJ, cyJ, SAMPLE_ZOOM, clusterLatLng.lat, clusterLatLng.lng,
                );
                if (elev === null) { missingTiles++; continue; }
                if (elev > 3600) continue;   // 雪线以上无乔木

                if (elev < 0 && !maskSaysLand(clusterLatLng.lat, clusterLatLng.lng)) continue;

                // 绑地形：簇核地表密度决定这是不是林区（沙漠/荒漠 → 无簇 → 留白），DE 的 terrain 类别绑定
                const tile = queryBaseTile({ lat: clusterLatLng.lat, lng: clusterLatLng.lng, isSiege: false, isWinter: season === 2 }) ?? resolveTerrainTile(clusterLatLng.lat, clusterLatLng.lng, season);
                const density = densityFor(tile);
                if (density < MIN_PATCH_DENSITY) continue;

                // 成簇：不是每格都长树，按"簇密度 × 随机扰动"决定这一簇成不成立（DE 密度分档 + percent_chance）。
                // 原来是 density×(0.55~1.45)，草地(0.28)只有 0.15~0.41、林地(0.42)也才 0.23~0.61，
                // 七成格子直接不长 —— 叠上 zoom 8 的半径缩水就成了「植被不显示」。
                // 现在放大到 ×2.2：林地 0.65~1.0、草地 0.43~0.75，稀树/半干旱仍然明显稀疏。
                // 🔴 [2026-08-31 主人「分布太多了」] 系数 2.2 → 1.0。
                //    2.2 是当初为了对抗「色斑太淡看不见」硬调上去的；现在画的是实体树，
                //    不需要靠铺满来刷存在感。⚠️ 一度砍到 1.0，实测一屏只剩 ~25 棵、地图基本是光的，
                //    过犹不及；1.6 是「成林看得出、又不糊屏」的档：林地 0.47~0.87、草地 0.31~0.58。
                const clusterChance = Math.min(1, density * 1.6 * (0.7 + hash(cx, cy, 43) * 0.6));
                if (hash(cx, cy, 44) >= clusterChance) continue;

                // 簇内斑块数：密林一簇更多、更实；稀树更少（DE number_of_objects 随档位）。
                // ×2 提高：斑块散布半径改小后靠叠数量把簇填实，连成一片而非稀疏点缀。
                // 同上：14/10/6 是「色斑要连成片」时代的数。画实体树用不了那么多，
                // 但也不能太少（6/4/2 实测太空）。10/7/4 一簇能看出是片林子。
                const baseCount = density >= 0.4 ? 10 : density >= 0.25 ? 7 : 4;
                const count = Math.max(1, Math.round(baseCount * (0.7 + hash(cx, cy, 45) * 0.7)));
                const stragglerCount = Math.floor(count * STRAGGLER_SHARE);
                const clusteredCount = count - stragglerCount;

                for (let i = 0; i < count; i++) {
                    const ang = hash(cx, cy, i + 50) * Math.PI * 2;
                    const radiusHash = hash(cx, cy, i + 60);
                    // 约 15% 的现有林簇树移到簇外成为孤树；其余仍按原规则填充林簇。
                    const rad = i >= clusteredCount
                        ? STRAGGLER_RADIUS_MIN + radiusHash * (STRAGGLER_RADIUS_MAX - STRAGGLER_RADIUS_MIN)
                        : Math.sqrt(radiusHash) * CLUSTER_RADIUS;
                    const px = cxJ + Math.cos(ang) * rad;
                    const py = cyJ + Math.sin(ang) * rad;
                    const ptLatLng = this.map.unproject([px, py], SAMPLE_ZOOM);

                    // 🔴 [2026-08-31 修「树长到海里」·真正的根因] **每一棵树都要单独判水陆**。
                    //    原来只有簇核判了，簇内的树是从簇核往外撒 CLUSTER_RADIUS 的，
                    //    簇核在岸上、树照样能被甩进海里 —— 希腊/爱琴海那种破碎海岸线一眼就露馅
                    //    （主人 2026-08-31 截图：满爱琴海都是树）。
                    //    queryBaseTile 查的是**气候底图**不是水陆掩膜，海上采样照样返回陆地贴图，
                    //    所以它挡不住这件事，必须显式问 probeLandSea。
                    // 🔴 [2026-08-31 修「树长到海里」] **每棵树都要单独判水陆**：
                    //    原来只有簇核判了，而簇内的树是从簇核往外撒 CLUSTER_RADIUS 的，
                    //    簇核在岸上、树照样被甩进海（主人截图：满爱琴海是树）。
                    //    queryBaseTile 查的是**气候底图**不是水陆掩膜，海上照样返回陆地贴图，挡不住。
                    // 🔴 每棵树单独挡海（主人截图：满爱琴海是树）。簇核在岸上，
                    //    但树是从簇核往外撒 CLUSTER_RADIUS 的，照样会被甩进海。
                    //    这里**只问掩膜、绝不查高程**：
                    //    树点散布在簇核之外，常落到还没加载的相邻高程瓦片，逐点查会大量返回 null
                    //    → 被当成「瓦片没到」跳过，实测德意志 187 棵→9 棵、俄北 224→0。
                    //    （这正是记忆里「批量采样别逐点查、会踩 LRU」那条的现场版。）
                    //    掩膜是同步只读的：明确说是水才丢弃；没加载(null)就照画，
                    //    宁可偶尔漏一棵在海边，也不要整片森林消失。
                    // 🔴 [2026-08-31] 用与「海陆分界线」调试图层**同一套探针**（主人提示的正解）：
                    //    createBlockProber 按瓦片缓存，整屏顺序采样命中同一块，比逐点查快得多。
                    //    这里**严格要求 'land'**：'sea' 丢弃，'pending' 也丢弃并计入 missingTiles，
                    //    等瓦片到了自动重画补上 —— 宁可晚几秒出树，也不要树浮在海面上。
                    //    （我一度改成宽松版「只有明确说是水才丢」，是因为被 0×0 视口测出的假数据
                    //      吓退；那批数字是垃圾，见记忆 never-ask-user-to-read-logs。）
                    const ptKind = probeLand(
                        lngToDemGlobalX(ptLatLng.lng), latToDemGlobalY(ptLatLng.lat),
                    );
                    if (ptKind !== 'land') { if (ptKind === 'pending') missingTiles++; continue; }

                    // 斑块再绑地形：落到林区外的斑块丢弃，保持林区边界干净
                    const ptTile = queryBaseTile({ lat: ptLatLng.lat, lng: ptLatLng.lng, isSiege: false, isWinter: season === 2 }) ?? resolveTerrainTile(ptLatLng.lat, ptLatLng.lng, season);
                    if (densityFor(ptTile) < MIN_PATCH_DENSITY * 0.6) continue;

                    const center = this.map.latLngToContainerPoint(ptLatLng);
                    if (visibleCities.some((p) => p.distanceTo(center) < CITY_CLEAR_PX)) continue;

                    const asset = pickTree({ baseTile: ptTile, lat: ptLatLng.lat, lng: ptLatLng.lng, season, isSiege: false });
                    const img = treeImage(asset, this.onTreeImageReady);
                    if (!img) { pendingImages++; continue; }
                    // 季末交叉淡出：下一季的同位置树种（换装了才混，没换装就当没这回事）
                    const assetNext = blendStep > 0
                        ? pickTree({ baseTile: ptTile, lat: ptLatLng.lat, lng: ptLatLng.lng, season: nextSeason, isSiege: false })
                        : asset;
                    const imgNext = assetNext !== asset ? treeImage(assetNext, this.onTreeImageReady) : null;
                    // 树高按 zoom 缩放：zoom 8 的一屏是整个东欧，树画太大就糊成一片。
                    // 高度基准 TREE_BASE_PX @zoom9，每级 ×1.35（比 2 倍温和，避免 zoom10 撑爆）。
                    const jitter = 0.85 + hash(cx, cy, i + 70) * 0.35;
                    const h = TREE_BASE_PX * Math.pow(1.35, zoom - SAMPLE_ZOOM) * jitter;
                    const w = h * (img.naturalWidth / img.naturalHeight);
                    drawCommands.push({ x: center.x, y: center.y, h, w, img, imgNext });
                }
            }
        }

        // 北侧先画、南侧后画：南侧树冠自然覆盖北侧树干。
        drawCommands.sort((a, b) => a.y - b.y || a.x - b.x);
        const blendAlpha = Math.min(1, Math.max(0, blend));
        for (const command of drawCommands) {
            const { x, y, h, w, img, imgNext } = command;
            if (imgNext) {
                this.ctx.globalAlpha = 1 - blendAlpha;
                this.ctx.drawImage(img, x - w / 2, y - h, w, h);
                const wNext = h * (imgNext.naturalWidth / imgNext.naturalHeight);
                this.ctx.globalAlpha = blendAlpha;
                this.ctx.drawImage(imgNext, x - wNext / 2, y - h, wNext, h);
                this.ctx.globalAlpha = 1;
            } else {
                this.ctx.drawImage(img, x - w / 2, y - h, w, h);
            }
        }
        drawnTrees = drawCommands.length;

        // DEM 瓦片异步到达：这轮被跳过的格子必须补画。
        // 只靠 land-sea-tiles-updated 不够 —— 瓦片可能在两次 render 的间隙就位，
        // 而 lastRenderKey 已经把这屏标成「画过了」，结果一屏空白一直留到下次跨格。
        this.lastTreeCount = drawnTrees;
        // 树贴图这一轮有没到的 → 把本屏标记为未画完，等 onTreeImageReady 触发重画
        if (pendingImages > 0) this.lastRenderKey = '';

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
