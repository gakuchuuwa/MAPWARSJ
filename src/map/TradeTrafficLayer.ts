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
 * 需求（主人原话归纳）：
 *   · 跟随军团同屏渐显出现，1-2 个商队；每个商队 3-6 个单位排成一排。
 *   · 从东边据点往西走 / 从西边据点往东走，沿道路；陆地上是商队，进海是商船。
 *   · 不同区域显示不同文化的商队；不要势力色（用原色）；切换跟随军团镜头后渐隐。
 *
 * 实现原则（铁律）：
 *   · 完全独立的一层：自己的 canvas + Leaflet pane + 自己的 rAF 循环，
 *     **不碰** GlobalUnitRenderer / LegionPhalanxDrawer / 8/9/10 任何现有渲染逻辑。
 *   · 只读数据（跟拍军团位置、道路/海路折线、海陆判定、文化区），不写回任何实体。
 *   · 素材来自 public/SUCAI_TRADE/（本会话已提取），只画主图层 .png（原色，不染势力色）。
 *
 * 所有可调参数集中在下方常量块，改观感只动这里。
 */

type Pt = { lat: number; lng: number };

/** 已加载的单个素材目录（对应 SUCAI_TRADE 下一个子目录） */
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
    cumLen: number[];      // 各折点累计长度（度），cumLen[0]=0
    totalLen: number;      // 折线总长（度）
    dist: number;          // 当前在折线上的累计距离（度）
    count: number;         // 3-6 个单位
    cartDir: string;       // 陆路商队皮肤目录
    shipDir: string;       // 商船皮肤目录
    seaRoute: boolean;     // 本路线本质是海路（isSeaAt 兜底用）
    alpha: number;         // 0..1
    fade: 1 | -1 | 0;      // 1 渐入 / -1 渐出 / 0 稳定
    phase: number;         // 动画相位（帧偏移，避免各单位同步）
    prev: Pt;              // 上一帧位置（算朝向）
    ageMs: number;
}

// ── 可调参数 ──────────────────────────────────────────────────────────────
const MAX_CARAVANS = 2;
const UNITS_MIN = 3;
const UNITS_MAX = 6;
const FADE_IN_MS = 1200;
const FADE_OUT_MS = 1200;
const SPEED_DEG_PER_SEC = 0.07;      // 商队/商船行进速度（度/秒；zoom9 ≈ 25px/s）
const UNIT_SPACING_DEG = 0.22;       // 队伍内相邻单位间距（度；≈ 一个车身的屏幕间距）
const RESPAWN_DIST_DEG = 2.6;        // 离跟拍军团超过此距离 → 渐隐换新（保持同屏）
const ROAD_SCAN_DEG = 1.4;           // 找最近道路/海路的搜索半径（度）
const CART_ANIM_FPS = 18;            // 车 move 动画帧率（30 帧/循环）
const PANE_ZINDEX = 595;             // 低于城市 marker(600)/军团(620)，高于道路(450)
const SCALE_BASE = 0.5;              // 渲染缩放（× 2^(zoom-9)）
// 多样性混入概率（陆路车池 + 商船池）：0~1，其余概率走「文化区常规皮肤」
const MULE_CART_CHANCE = 0.15;       // 陆路：骡车
const MERCHANT_CHANCE = 0.20;        // 陆路：徒步商人（与骡车叠加判定）
const TRANSPORT_SHIP_CHANCE = 0.20;  // 海上：运输船/渡船
const CANOE_CHANCE = 0.20;           // 海上：独木舟（与运输船叠加判定）
// ──────────────────────────────────────────────────────────────────────────

/** 文化区 → 陆路商队皮肤（对应 SUCAI_TRADE 里 5 个区域贸易车：骆驼/马/牛/牛/羊驼） */
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

/** 文化区 → 徒步商人皮肤（6 文化圈；希腊/色雷斯归古典） */
function merchantDir(region: RegionType): string {
    if (CART_CAMEL.includes(region)) return 'MERCHANT_ORIE';
    if (region === 'GREEK' || region === 'THRACIAN') return 'MERCHANT_ANT';
    if (CART_HORSE.includes(region)) return 'MERCHANT_WEST';
    if (CART_OX_ASIA.includes(region)) return 'MERCHANT_ASIA';
    if (CART_OX_AFRI.includes(region)) return 'MERCHANT_AFRI';
    if (CART_LLAMA.includes(region)) return 'MERCHANT_MESO';
    return 'MERCHANT_WEST';
}

/** 陆路商队皮肤（多样性池）：区域贸易车(满/空) + 骡车 + 徒步商人 */
function landAssetDir(region: RegionType): string {
    const r = Math.random();
    if (r < MULE_CART_CHANCE) return 'MULE_CART';
    if (r < MULE_CART_CHANCE + MERCHANT_CHANCE) return merchantDir(region);
    const base = cartBaseDir(region);
    return Math.random() < 0.5 ? base : `${base}_EMPTY`;
}

/** 文化区 → 商船皮肤 */
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
    // 多样性池：运输船/独木舟 + 文化区 3 商船
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
    private running = false;
    private lastTime = 0;
    private nowMs = 0;
    private idSeq = 0;

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
                // 车 = move，船 = idle
                const act = meta.move ? 'move' : 'idle';
                asset.action = act;
                asset.frames = (meta[act]?.frames ?? 1);
                asset.dirs = meta[act]?.dirs ?? {};
                const nDir = asset.nDir;
                asset.sheets = new Array(nDir).fill(null);
                let loaded = 0;
                for (let d = 0; d < nDir; d++) {
                    const img = new Image();
                    img.onload = () => {
                        loaded++;
                        if (loaded === nDir) asset.ready = true;
                    };
                    img.onerror = () => {
                        loaded++;
                        if (loaded === nDir) asset.ready = true;
                    };
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
        const dLat = b.lat - a.lat, dLng = b.lng - a.lng;
        return Math.hypot(dLat, dLng);
    }

    private static pointToSegDist(p: Pt, a: Pt, b: Pt): number {
        const abx = b.lng - a.lng, aby = b.lat - a.lat;
        const apx = p.lng - a.lng, apy = p.lat - a.lat;
        const len2 = abx * abx + aby * aby;
        let t = len2 === 0 ? 0 : (apx * abx + apy * aby) / len2;
        t = Math.max(0, Math.min(1, t));
        const qx = a.lng + abx * t, qy = a.lat + aby * t;
        return Math.hypot(p.lng - qx, p.lat - qy);
    }

    private static featureDist(p: Pt, coords: [number, number][]): number {
        let best = Infinity;
        for (let i = 1; i < coords.length; i++) {
            const a: Pt = { lat: coords[i - 1][1], lng: coords[i - 1][0] };
            const b: Pt = { lat: coords[i][1], lng: coords[i][0] };
            best = Math.min(best, TradeTrafficLayer.pointToSegDist(p, a, b));
        }
        return best;
    }

    private static coordsToPts(coords: [number, number][]): Pt[] {
        return coords.map((c) => ({ lat: c[1], lng: c[0] }));
    }

    private static buildCum(pts: Pt[]): { cum: number[]; total: number } {
        const cum = [0];
        for (let i = 1; i < pts.length; i++) {
            cum.push(cum[i - 1] + TradeTrafficLayer.segDist(pts[i - 1], pts[i]));
        }
        return { cum, total: cum[cum.length - 1] };
    }

    /** 折线上距离 d 处的位置（度）；d 夹在 [0,total] */
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

    // ── 生成 ────────────────────────────────────────────────────────────
    private spawnNear(anchor: Pt): void {
        // 收集附近道路 + 海路（尽量东西向）
        const roadCands: { pts: Pt[]; isSea: boolean; region: RegionType }[] = [];
        const roads = roadRegistry.isInitialized() ? roadRegistry.getVectorRoads() : [];
        for (const f of roads) {
            const coords = f.geometry?.coordinates;
            if (!coords || coords.length < 2) continue;
            if (TradeTrafficLayer.featureDist(anchor, coords) > ROAD_SCAN_DEG) continue;
            const pts = TradeTrafficLayer.coordsToPts(coords);
            if (!TradeTrafficLayer.isMostlyEastWest(pts)) continue;
            roadCands.push({ pts, isSea: false, region: getRegion(anchor.lat, anchor.lng) });
        }
        const seaCands: { pts: Pt[]; isSea: boolean; region: RegionType }[] = [];
        for (const f of SEA_ROUTE_DATA.features) {
            const coords = f.geometry?.coordinates;
            if (!coords || coords.length < 2) continue;
            if (TradeTrafficLayer.featureDist(anchor, coords) > ROAD_SCAN_DEG) continue;
            seaCands.push({ pts: TradeTrafficLayer.coordsToPts(coords), isSea: true, region: getRegion(anchor.lat, anchor.lng) });
        }

        // 优先 1 陆 + 1 海（都近才有）；否则有什么用什么
        const picks: { pts: Pt[]; isSea: boolean; region: RegionType }[] = [];
        if (roadCands.length && seaCands.length) {
            picks.push(TradeTrafficLayer.pick(roadCands), TradeTrafficLayer.pick(seaCands));
        } else {
            const pool = roadCands.length ? roadCands : seaCands;
            if (pool.length) {
                picks.push(TradeTrafficLayer.pick(pool));
                if (pool.length > 1) picks.push(TradeTrafficLayer.pick(pool));
            }
        }

        for (const p of picks) this.spawnCaravan(p.pts, p.isSea, p.region);
    }

    private static pick<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    private static isMostlyEastWest(pts: Pt[]): boolean {
        const first = pts[0], last = pts[pts.length - 1];
        return Math.abs(last.lng - first.lng) >= 0.7 * Math.abs(last.lat - first.lat);
    }

    private spawnCaravan(pts: Pt[], seaRoute: boolean, region: RegionType): void {
        if (this.caravans.length >= MAX_CARAVANS) return;

        // 东→西 或 西→东：随机定方向（主人：两种都行）
        const eastFirst = pts[0].lng <= pts[pts.length - 1].lng;
        const walkEast = Math.random() < 0.5;
        const path = eastFirst === walkEast ? pts : [...pts].reverse();

        const { cum, total } = TradeTrafficLayer.buildCum(path);

        // 皮肤：陆路多样性池（区域车满/空 + 骡车 + 徒步商人）+ 商船池（3 商船 + 渡船 + 独木舟）。
        // 商队走到海面（渡海道路的海段）时逐单位切成船 —— 见 draw() 里的 isSeaAt。
        const cartDir = landAssetDir(region);
        const shipDirName = shipDir(region);
        this.loadAsset(cartDir);
        this.loadAsset(shipDirName);

        const count = UNITS_MIN + Math.floor(Math.random() * (UNITS_MAX - UNITS_MIN + 1));
        const start: Pt = path[0];
        this.caravans.push({
            id: `trade_${this.idSeq++}`,
            path, cumLen: cum, totalLen: total,
            dist: 0, count, cartDir, shipDir: shipDirName, seaRoute,
            alpha: 0, fade: 1, phase: Math.floor(Math.random() * 30),
            prev: start, ageMs: 0,
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

        // 跟拍切换 / 停止 → 全体渐隐
        if (followedId !== this.lastFollowedId) {
            this.lastFollowedId = followedId;
            for (const c of this.caravans) c.fade = -1;
            // 换人后立刻按新位置补一批
            if (followedId && followedPos && this.caravans.length === 0) {
                this.spawnNear(followedPos);
            }
        }

        // 无跟拍 → 什么都不生成，等旧的淡出完
        if (!followedId || !followedPos) {
            this.stepCaravans(dt, now, null);
            this.draw();
            requestAnimationFrame(this.tick.bind(this));
            return;
        }

        // 有跟拍 → 维持 1-2 个商队
        if (this.caravans.length < MAX_CARAVANS) {
            this.spawnNear(followedPos);
        }

        this.stepCaravans(dt, now, followedPos);
        this.draw();
        requestAnimationFrame(this.tick.bind(this));
    }

    private stepCaravans(dt: number, now: number, anchor: Pt | null): void {
        for (let i = this.caravans.length - 1; i >= 0; i--) {
            const c = this.caravans[i];
            c.ageMs += dt * 1000;

            // 渐入 / 渐出
            if (c.fade !== 0) {
                const step = dt * 1000 / (c.fade > 0 ? FADE_IN_MS : FADE_OUT_MS);
                c.alpha += c.fade * step;
                if (c.alpha >= 1) { c.alpha = 1; c.fade = 0; }
                if (c.alpha <= 0) {
                    this.caravans.splice(i, 1);
                    continue;
                }
            }

            // 前进
            c.dist += SPEED_DEG_PER_SEC * dt;
            const head = TradeTrafficLayer.pointAt(c.path, c.cumLen, c.dist);
            c.prev = head;

            // 走到头 / 离跟拍太远 → 渐隐（下一帧由生成逻辑补新的）
            const tooFar = anchor && TradeTrafficLayer.segDist(head, anchor) > RESPAWN_DIST_DEG;
            if (c.fade === 0 && (c.dist >= c.totalLen || tooFar)) {
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

                // 陆上商队 / 进海商船：海路商队恒为船；陆路商队只在确实踩到海面（渡海道路）时换船。
                // 只升不降 —— isSeaAt 采样器未就绪时不得把海路船错画成车。
                let sea = c.seaRoute;
                if (!sea) {
                    try {
                        sea = LandSeaSystem.isSeaAt(pos);
                    } catch {
                        /* 采样器未就绪 → 保持陆路 */
                    }
                }
                const asset = sea ? shipAsset : cartAsset;
                if (!asset) continue;

                const frames = asset.frames;
                const frame = asset.action === 'move'
                    ? Math.floor(this.nowMs / 1000 * CART_ANIM_FPS + c.phase) % frames
                    : 0;

                // 朝向：用本单位沿路径的切线方向
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
                ctx.drawImage(
                    sheet,
                    frame * fw, 0, fw, fh,
                    dx, dy, fw * scale, fh * scale,
                );
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
