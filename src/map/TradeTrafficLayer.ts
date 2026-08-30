import L from 'leaflet';
import { GameMap } from './GameMap';
import { getRegion, type RegionType } from '../systems/RegionSystem';
import { LandSeaSystem } from '../world/land-sea';
import { roadRegistry } from '../roads/RoadRegistry';
import { SEA_ROUTE_DATA } from '../data/VectorSeaRouteData';
import { OrientationSystem } from '../core/OrientationSystem';
import { gameLog } from '../utils/GameLogger';

/**
 * TradeTrafficLayer — 战略地图「商贸交通」环境层（2026-08-31 主人定稿）。
 *
 * 需求：
 *   · 跟随军团同屏出现，3-5 个车队；每队 3-6 个单位排成一排。
 *   · 行进路线从**屏幕外的据点**出发，走到屏幕外再结束（沿道路/海路，穿屏而过）。
 *   · 陆上是商队（车），进海是商船；不同区域不同文化；不要势力色；切镜头渐隐。
 *
 * 实现原则（铁律）：
 *   · 完全独立一层：自己的 canvas + Leaflet pane + 自己的 rAF 循环，不碰现有渲染。
 *   · 只读数据（跟拍军团、路网、海陆判定、文化区），不写回任何实体。
 *   · 素材来自 public/SUCAI_TRADE/，只画主图层 .png（原色，不染势力色）。
 *   · 6 个步行商人（MERCHANT_*）主人已定不需要，陆路池只用区域贸易车 + 骡车。
 */

type Pt = { lat: number; lng: number };

interface TradeAsset {
    dir: string;
    dirs16: boolean;
    nDir: number;
    action: 'move' | 'idle';
    frames: number;
    dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }>;
    sheets: (HTMLImageElement | null)[];
    ready: boolean;
}

interface Caravan {
    id: string;
    path: Pt[];
    cumLen: number[];
    totalLen: number;
    dist: number;          // 当前在折线上的累计距离（度）
    count: number;         // 3-6 个单位
    cartDir: string;       // 陆路商队皮肤目录
    shipDir: string;       // 商船皮肤目录
    alpha: number;
    fade: 1 | -1 | 0;
    phase: number;
    ageMs: number;
}

// ── 可调参数 ──────────────────────────────────────────────────────────────
const CARAVAN_MIN = 1;
const CARAVAN_MAX = 1;
const UNITS_MIN = 3;
const UNITS_MAX = 6;
const FADE_IN_MS = 1200;
const FADE_OUT_MS = 1200;
const SPEED_DEG_PER_SEC = 0.12;     // 行进速度（度/秒；zoom9 ≈ 44px/s）
const UNIT_SPACING_DEG = 0.22;      // 队内相邻单位间距（度）
const CART_ANIM_FPS = 18;           // 车 move 动画帧率
const PANE_ZINDEX = 595;            // 低于城市 marker(600)/军团(620)，高于道路(450)
const SCALE_BASE = 0.35;            // 渲染缩放（× 2^(zoom-9)，比军团小）
const OFFSCREEN_MARGIN = 0.4;       // 屏幕外起终点外推比例（× 视口宽）
const MULE_CART_CHANCE = 0.15;      // 陆路：骡车概率（其余 = 区域贸易车满/空）
const TRANSPORT_SHIP_CHANCE = 0.20; // 海上：运输船概率
const CANOE_CHANCE = 0.20;          // 海上：独木舟概率
// ──────────────────────────────────────────────────────────────────────────

/** 文化区 → 区域贸易车皮肤（5 类：骆驼/马/牛/牛/羊驼） */
const CART_CAMEL: RegionType[] = ['ORIE', 'WEST_ASIA', 'CENTRAL_ASIA', 'PERSIAN', 'BERBER', 'CUMAN'];
const CART_HORSE: RegionType[] = [
    'LATIN', 'GERMANIC', 'SLAVIC', 'BRITONS', 'GOTHS', 'HUNS', 'TEUTONS', 'VIKINGS',
    'CELTS', 'ITALIANS', 'SICILIANS', 'BULGARIANS', 'MAGYAR', 'LITHUANIANS', 'POLES',
    'BOHEMIANS', 'BURGUNDIANS', 'SPANISH', 'PORTUGUESE', 'EAST', 'GREEK', 'THRACIAN',
];
const CART_OX_ASIA: RegionType[] = [
    'CENTRAL', 'NORTH', 'JIANGNAN', 'LINGNAN', 'BASHU', 'DIANQIAN', 'HEXI', 'WESTERN',
    'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN',
];
const CART_OX_AFRI: RegionType[] = [
    'AFRICA', 'ETHIOPIANS', 'INDIA', 'PURU', 'BENGALIS', 'GURJARAS', 'PORUS',
    'MALAY', 'VIETNAMESE', 'KHMER',
];
const CART_LLAMA: RegionType[] = ['AMERICA', 'ANDE', 'MAYANS', 'MAPUCHE', 'MUISCA', 'TUPI'];

function cartBaseDir(region: RegionType): string {
    if (CART_CAMEL.includes(region)) return 'TRADE_CART_ORIE';      // 丝路骆驼商队
    if (CART_HORSE.includes(region)) return 'TRADE_CART_WEST';      // 马拉车
    if (CART_OX_ASIA.includes(region)) return 'TRADE_CART_ASIA';    // 牛拉车（东亚）
    if (CART_OX_AFRI.includes(region)) return 'TRADE_CART_AFRI';    // 牛拉车（非洲/南亚）
    if (CART_LLAMA.includes(region)) return 'TRADE_CART_MESO';      // 羊驼/人拉车
    return 'TRADE_CART_WEST';
}

/** 陆路商队皮肤（多样性池）：区域贸易车(满/空) + 骡车 */
function landAssetDir(region: RegionType): string {
    if (Math.random() < MULE_CART_CHANCE) return 'MULE_CART';
    const base = cartBaseDir(region);
    return Math.random() < 0.5 ? base : `${base}_EMPTY`;
}

/** 文化区 → 商船皮肤（多样性池：3 商船 + 运输船 + 独木舟） */
const SHIP_JUNK: RegionType[] = [
    'CENTRAL', 'NORTH', 'JIANGNAN', 'LINGNAN', 'BASHU', 'DIANQIAN', 'HEXI', 'WESTERN',
    'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'VIETNAMESE', 'KHMER', 'MALAY',
    'INDIA', 'PURU', 'BENGALIS', 'GURJARAS', 'PORUS',
];
const SHIP_COG: RegionType[] = [
    'LATIN', 'GERMANIC', 'SLAVIC', 'BRITONS', 'GOTHS', 'HUNS', 'TEUTONS', 'VIKINGS',
    'CELTS', 'ITALIANS', 'SICILIANS', 'BULGARIANS', 'MAGYAR', 'LITHUANIANS', 'POLES',
    'BOHEMIANS', 'BURGUNDIANS', 'SPANISH', 'PORTUGUESE', 'EAST', 'GREEK', 'THRACIAN',
];
function shipDir(region: RegionType): string {
    const r = Math.random();
    if (r < TRANSPORT_SHIP_CHANCE) return 'TRANSPORT_SHIP';
    if (r < TRANSPORT_SHIP_CHANCE + CANOE_CHANCE) return 'CANOE';
    if (SHIP_JUNK.includes(region)) return 'JUNK';
    if (SHIP_COG.includes(region)) return 'TRADE_COG';
    return 'MERCHANT_SHIP';
}

export class TradeTrafficLayer {
    private map: L.Map;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private assets: Map<string, TradeAsset> = new Map();
    private caravans: Caravan[] = [];
    private lastFollowedId: string | null = null;
    private targetCount = 0;
    private running = false;
    private lastTime = 0;
    private nowMs = 0;
    private idSeq = 0;
    private cityIndex: Map<string, Pt> | null = null;

    constructor(map: L.Map) {
        this.map = map;
        this.canvas = document.createElement('canvas');
        this.canvas.style.pointerEvents = 'none';
        this.canvas.className = 'leaflet-zoom-animated';
        this.ctx = this.canvas.getContext('2d')!;
        this.setupPane();
        this.map.on('move', this.syncCanvas.bind(this));
        this.map.on('zoom', this.syncCanvas.bind(this));
        this.map.on('resize', this.resize.bind(this));
        this.resize();
        this.syncCanvas();
    }

    private setupPane(): void {
        const name = 'tradeTrafficPane';
        if (!this.map.getPane(name)) {
            this.map.createPane(name);
            const pane = this.map.getPane(name)!;
            pane.style.zIndex = String(PANE_ZINDEX);
            pane.style.pointerEvents = 'none';
        }
        this.map.getPane(name)!.appendChild(this.canvas);
    }

    private resize(): void {
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
    }

    private syncCanvas(): void {
        const topLeft = this.map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);
    }

    public start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        gameLog('startup', '🚚 TradeTrafficLayer started');
        requestAnimationFrame(this.tick.bind(this));
    }

    public stop(): void {
        this.running = false;
    }

    // ── 素材加载 ────────────────────────────────────────────────────────
    private loadAsset(dir: string): void {
        if (this.assets.has(dir)) return;
        const asset: TradeAsset = {
            dir, dirs16: false, nDir: 8, action: 'idle', frames: 1,
            dirs: {}, sheets: [], ready: false,
        };
        this.assets.set(dir, asset);
        const base = `/SUCAI_TRADE/${dir}`;
        fetch(`${base}/_meta.json`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`meta ${r.status}`))))
            .then((meta) => {
                asset.dirs16 = meta.dirs16 === true;
                asset.nDir = meta.nDir ?? (asset.dirs16 ? 16 : 8);
                const act = meta.move ? 'move' : 'idle';
                asset.action = act;
                asset.frames = meta[act]?.frames ?? 1;
                asset.dirs = meta[act]?.dirs ?? {};
                const nDir = asset.nDir;
                asset.sheets = new Array(nDir).fill(null);
                let loaded = 0;
                for (let d = 0; d < nDir; d++) {
                    const img = new Image();
                    img.onload = () => { loaded++; if (loaded === nDir) asset.ready = true; };
                    img.onerror = () => { loaded++; if (loaded === nDir) asset.ready = true; };
                    img.src = `${base}/${act}_${d}.png`;
                    asset.sheets[d] = img;
                }
            })
            .catch((e) => console.warn(`[TradeTraffic] 加载 ${dir} 失败:`, e));
    }

    private assetFor(dir: string): TradeAsset | undefined {
        const a = this.assets.get(dir);
        return a && a.ready ? a : undefined;
    }

    // ── 几何工具（度作单位，本地小范围足够）────────────────────────────
    private static segDist(a: Pt, b: Pt): number {
        return Math.hypot(b.lat - a.lat, b.lng - a.lng);
    }

    private static buildCum(pts: Pt[]): { cum: number[]; total: number } {
        const cum = [0];
        for (let i = 1; i < pts.length; i++) {
            cum.push(cum[i - 1] + TradeTrafficLayer.segDist(pts[i - 1], pts[i]));
        }
        return { cum, total: cum[cum.length - 1] };
    }

    private static pointAt(pts: Pt[], cum: number[], d: number): Pt {
        if (pts.length === 1) return pts[0];
        const dd = Math.max(0, Math.min(d, cum[cum.length - 1]));
        let lo = 0, hi = cum.length - 1;
        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1;
            if (cum[mid] <= dd) lo = mid; else hi = mid;
        }
        const seg = cum[hi] - cum[lo];
        const t = seg === 0 ? 0 : (dd - cum[lo]) / seg;
        const a = pts[lo], b = pts[hi];
        return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
    }

    // ── 据点索引（道路/海路端点 → 坐标），用于找屏幕外起终点 ────────────
    private buildCityIndex(): Map<string, Pt> {
        if (this.cityIndex) return this.cityIndex;
        const idx = new Map<string, Pt>();
        const addFeat = (props: any, coords: [number, number][] | undefined) => {
            if (!coords || coords.length < 2) return;
            const s = props?.startConnection, e = props?.endConnection;
            if (s) idx.set(s, { lat: coords[0][1], lng: coords[0][0] });
            if (e) idx.set(e, { lat: coords[coords.length - 1][1], lng: coords[coords.length - 1][0] });
        };
        for (const f of roadRegistry.getVectorRoads()) addFeat(f.properties, f.geometry?.coordinates);
        for (const f of SEA_ROUTE_DATA.features) addFeat(f.properties, f.geometry?.coordinates);
        this.cityIndex = idx;
        return idx;
    }

    /** 造一条「屏幕外西城 → 最近城(跟拍附近) → 屏幕外东城」的穿屏道路折线（东→西或西→东随机）。 */
    private buildCrossRoute(anchor: Pt): Pt[] | null {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        const viewW = Math.max(0.5, ne.lng - sw.lng);
        const westLng = sw.lng - viewW * OFFSCREEN_MARGIN;
        const eastLng = ne.lng + viewW * OFFSCREEN_MARGIN;

        const idx = this.buildCityIndex();
        const nearestId = roadRegistry.getNearestCityId(anchor.lat, anchor.lng, 3.0);
        if (!nearestId) return null;

        const westIds: string[] = [];
        const eastIds: string[] = [];
        for (const [id, p] of idx) {
            if (p.lng < westLng) westIds.push(id);
            else if (p.lng > eastLng) eastIds.push(id);
        }
        if (westIds.length === 0 || eastIds.length === 0) return null;

        const walkEast = Math.random() < 0.5;
        const startId = walkEast
            ? westIds[Math.floor(Math.random() * westIds.length)]
            : eastIds[Math.floor(Math.random() * eastIds.length)];
        const endId = walkEast
            ? eastIds[Math.floor(Math.random() * eastIds.length)]
            : westIds[Math.floor(Math.random() * westIds.length)];

        // 两段：起点 → 最近城 → 终点（保证穿过屏幕/跟拍附近）
        const p1 = roadRegistry.findPath(startId, nearestId);
        const p2 = roadRegistry.findPath(nearestId, endId);
        if (!p1 || !p2) return null;
        const seg1 = roadRegistry.pathToLatLngs(p1);
        const seg2 = roadRegistry.pathToLatLngs(p2);
        const full = [...seg1, ...seg2.slice(1)];
        return full.length >= 2 ? full : null;
    }

    private spawnTraffic(anchor: Pt): void {
        if (this.caravans.length >= this.targetCount) return;
        const path = this.buildCrossRoute(anchor);
        if (!path) return;
        const { cum, total } = TradeTrafficLayer.buildCum(path);
        if (total <= 0) return;

        const region = getRegion(anchor.lat, anchor.lng);
        const cartDir = landAssetDir(region);
        const shipDirName = shipDir(region);
        this.loadAsset(cartDir);
        this.loadAsset(shipDirName);

        const count = UNITS_MIN + Math.floor(Math.random() * (UNITS_MAX - UNITS_MIN + 1));
        // 从屏幕外起点（西/东据点）发车：渐显在屏外完成，进屏即全不透明（不出现屏内渐隐）
        const startDist = 0;
        this.caravans.push({
            id: `trade_${this.idSeq++}`,
            path, cumLen: cum, totalLen: total,
            dist: startDist, count, cartDir, shipDir: shipDirName,
            alpha: 0, fade: 1, phase: Math.floor(Math.random() * 30),
            ageMs: 0,
        });
    }

    // ── 每帧 ────────────────────────────────────────────────────────────
    private tick(now: number): void {
        if (!this.running) return;
        const dt = Math.min(0.1, Math.max(0, (now - this.lastTime) / 1000));
        this.lastTime = now;
        this.nowMs = now;

        const followed = (window as any).game?.legionManager?.getFollowedLegion?.();
        const followedId: string | null = followed?.id ?? null;
        const followedPos: Pt | null = followed ? followed.getPosition() : null;

        if (followedId !== this.lastFollowedId) {
            this.lastFollowedId = followedId;
            for (const c of this.caravans) c.fade = -1;
            this.targetCount = 0;
        }

        if (!followedId || !followedPos) {
            this.stepCaravans(dt);
            this.draw();
            requestAnimationFrame(this.tick.bind(this));
            return;
        }

        // 有跟拍 → 维持 3-5 个车队
        if (this.targetCount === 0) {
            this.targetCount = CARAVAN_MIN + Math.floor(Math.random() * (CARAVAN_MAX - CARAVAN_MIN + 1));
        }
        if (this.caravans.length < this.targetCount) {
            this.spawnTraffic(followedPos);
        }

        this.stepCaravans(dt);
        this.draw();
        requestAnimationFrame(this.tick.bind(this));
    }

    private stepCaravans(dt: number): void {
        for (let i = this.caravans.length - 1; i >= 0; i--) {
            const c = this.caravans[i];
            c.ageMs += dt * 1000;

            if (c.fade !== 0) {
                const step = dt * 1000 / (c.fade > 0 ? FADE_IN_MS : FADE_OUT_MS);
                c.alpha += c.fade * step;
                if (c.alpha >= 1) { c.alpha = 1; c.fade = 0; }
                if (c.alpha <= 0) {
                    this.caravans.splice(i, 1);
                    continue;
                }
            }

            c.dist += SPEED_DEG_PER_SEC * dt;

            // 走到屏幕外终点 → 渐隐（下一帧补新车）
            if (c.fade === 0 && c.dist >= c.totalLen) {
                c.fade = -1;
            }
        }
    }

    private draw(): void {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.caravans.length === 0) return;

        const zoom = this.map.getZoom();
        const scale = Math.pow(2, zoom - 9) * SCALE_BASE;

        for (const c of this.caravans) {
            if (c.alpha <= 0.01) continue;
            const cartAsset = this.assetFor(c.cartDir);
            const shipAsset = this.assetFor(c.shipDir);

            ctx.globalAlpha = c.alpha;
            for (let u = 0; u < c.count; u++) {
                const ud = c.dist - u * UNIT_SPACING_DEG;
                const pos = TradeTrafficLayer.pointAt(c.path, c.cumLen, Math.max(0, ud));

                // 陆上商队 / 进海商船：逐单位按海陆判定（渡海路段自动换船）
                let sea = false;
                try {
                    sea = LandSeaSystem.isSeaAt(pos);
                } catch {
                    /* 采样器未就绪 → 按陆路 */
                }
                const asset = sea ? shipAsset : cartAsset;
                if (!asset) continue;

                const frames = asset.frames;
                const frame = asset.action === 'move'
                    ? Math.floor(this.nowMs / 1000 * CART_ANIM_FPS + c.phase) % frames
                    : 0;

                const prevPos = TradeTrafficLayer.pointAt(c.path, c.cumLen, Math.max(0, ud - 0.001));
                const dirIdx = this.dirIndex(asset, prevPos, pos);
                const box = asset.dirs[String(dirIdx)];
                if (!box) continue;
                const sheet = asset.sheets[dirIdx];
                if (!sheet || !sheet.complete || !sheet.naturalWidth) continue;

                const pt = this.map.latLngToContainerPoint([pos.lat, pos.lng]);
                const fw = box.fw, fh = box.fh, hx = box.hx, hy = box.hy;
                const dx = pt.x - hx * scale;
                const dy = pt.y - hy * scale;
                ctx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
            }
        }
        ctx.globalAlpha = 1;
    }

    private dirIndex(asset: TradeAsset, from: Pt, to: Pt): number {
        if (asset.dirs16) {
            const rad = Math.atan2(to.lng - from.lng, to.lat - from.lat);
            const deg = rad * 180 / Math.PI;
            return ((Math.round((deg - 45) / 22.5) % 16) + 16) % 16;
        }
        return OrientationSystem.get8DirectionIndex(from, to);
    }
}

let singleton: TradeTrafficLayer | null = null;

export function initializeTradeTrafficLayer(gameMap: GameMap): TradeTrafficLayer {
    if (singleton) return singleton;
    singleton = new TradeTrafficLayer(gameMap.getLeafletMap());
    return singleton;
}

export function getTradeTrafficLayer(): TradeTrafficLayer | null {
    return singleton;
}
