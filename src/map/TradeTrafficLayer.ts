import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import type { GameMap } from './GameMap';
import { getRegion, type RegionType } from '../systems/RegionSystem';
import { LandSeaSystem } from '../world/land-sea';
import { roadRegistry } from '../roads/RoadRegistry';
import { SEA_ROUTE_DATA } from '../data/VectorSeaRouteData';
import { OrientationSystem } from '../core/OrientationSystem';

/**
 * TradeTrafficLayer — 战略地图「商贸交通」环境层（2026-08-31 主人定稿）。
 *
 * 需求：
 *   · 跟随军团同屏出现，1 个车队（同屏一队）；每队 3-6 个单位排成一排。
 *   · 路线从屏幕外据点出发、走到屏幕外再结束（沿道路/海路穿屏）；屏内不渐隐，出屏即消失。
 *   · 陆上商队（车），进海商船；不同区域不同文化；不要势力色；比军团小。
 *
 * 实现原则（铁律）：
 *   · 完全独立一层（自己的 canvas + Leaflet pane + rAF 循环），不碰现有渲染。
 *   · 只读数据（跟拍军团、路网、海陆判定、文化区），不写回任何实体。
 *   · 素材来自 public/SUCAI_TRADE/，只画主图层 .png（原色，不染势力色）。
 *   · 发车即全不透明（不做渐显渐隐），走到屏幕外终点直接移除。
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
    phase: number;         // 动画相位（帧偏移）
    ageMs: number;
    lastDirIdx: number[];  // 每单位上一帧朝向 index（迟滞用）
    lastDirDeg: number[];  // 每单位上一帧朝向角度（迟滞用）
}

// ── 可调参数 ──────────────────────────────────────────────────────────────
// 🔴 [2026-08-31] 1 → 3。全图同时只有一支车队、还只生成在跟拍军团附近，
//    再叠上「进场要等一段」和「切跟拍就清空」，实际观感就是几乎看不到。
//    3 支 × 每支 3~6 个单位 = 9~18 个精灵，对渲染仍是噪音级（实测本层 0.51ms/秒）。
// [2026-08-31 主人定] 保持 1 支：3 支同屏太吵。
// 真正让商队"看不见"的是另外两条（取跟拍军团的路径写错、切跟拍一刀清空），已分别修掉，
// 所以 1 支也能稳定看到，不必靠堆数量。
const CARAVAN_MIN = 1;
const CARAVAN_MAX = 1;
/** 切跟拍时保留车队的半径（度）：超出这个距离的旧车队才丢弃 */
const KEEP_RADIUS_DEG = 8;
const UNITS_MIN = 3;
const UNITS_MAX = 6;
const SPEED_DEG_PER_SEC = 0.18;     // 行进速度（度/秒；zoom9 ≈ 66px/s）
const UNIT_SPACING_DEG = 0.22;      // 队内相邻单位间距（度）
const CART_ANIM_FPS = 18;           // 车 move 动画帧率
// 🔴 [2026-08-31 修「攻城战只显示攻城武器」] 必须低于 UNITS_LOW(580)。
//    580 是攻城战里**画在城池背后**的那批士兵所在的层；本层原值压在它之上，
//    等于把攻城方的士兵整个涂掉，只剩画在主层(UNITS=620)的攻城器械还看得见。
//    地面氛围层（植被/动物/商队）一律排在 CONNECTIONS(450) 与 UNITS_LOW(580) 之间。
const PANE_ZINDEX = 570;            // 商队：地面氛围层最高，仍低于 UNITS_LOW(580)
const SCALE_BASE = 0.35;            // 渲染缩放（× 2^(zoom-9)，比军团小）
const OFFSCREEN_MARGIN = 0.25;      // 屏幕外起终点外推比例（× 视口宽；须大于车队展开长度）
// 🔴 [2026-08-31] 30 → 8 秒。这个数是「车队生成在视口外多远」——原值意味着
//    最长要等 30 秒它才走进画面，而镜头常常撑不到 30 秒就切走了。
const MAX_ENTRY_WAIT_SEC = 8;       // 生成后最迟 8 秒进入当前视口
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

    /** PerfDoctor 体检口子 */
    public debugAssetCount(): number { return this.assets.size; }
    public debugAssetBytes(): number {
        let b = 0;
        for (const a of this.assets.values()) {
            for (const im of (a as unknown as { sheets?: (HTMLImageElement | null)[] }).sheets ?? []) {
                if (im) b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            }
        }
        return b;
    }
    private caravans: Caravan[] = [];
    private lastFollowedId: string | null = null;
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
        requestAnimationFrame(this.tick.bind(this));
    }

    public stop(): void {
        this.running = false;
    }

    public setVisible(visible: boolean): void {
        this.canvas.style.display = visible ? 'block' : 'none';
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

    /** 造一条「屏幕外某侧城 → 最近城(跟拍附近) → 屏幕外对侧城」的穿屏道路折线（东西/南北随机）。 */
    private buildCrossRoute(anchor: Pt): Pt[] | null {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        const viewW = Math.max(0.5, ne.lng - sw.lng);
        const viewH = Math.max(0.5, ne.lat - sw.lat);
        const westLng = sw.lng - viewW * OFFSCREEN_MARGIN;
        const eastLng = ne.lng + viewW * OFFSCREEN_MARGIN;
        const southLat = sw.lat - viewH * OFFSCREEN_MARGIN;
        const northLat = ne.lat + viewH * OFFSCREEN_MARGIN;

        const idx = this.buildCityIndex();
        const nearestId = roadRegistry.getNearestCityId(anchor.lat, anchor.lng, 3.0);
        if (!nearestId) return null;

        // 随机轴：东西 / 南北；起终点各在屏外两侧（哪边来都可以）
        const horizontal = Math.random() < 0.5;
        const startIds: string[] = [];
        const endIds: string[] = [];
        for (const [id, p] of idx) {
            if (horizontal) {
                if (p.lng < westLng) startIds.push(id);
                else if (p.lng > eastLng) endIds.push(id);
            } else {
                if (p.lat < southLat) startIds.push(id);
                else if (p.lat > northLat) endIds.push(id);
            }
        }
        if (startIds.length === 0 || endIds.length === 0) return null;

        const forward = Math.random() < 0.5;
        const startId = forward
            ? startIds[Math.floor(Math.random() * startIds.length)]
            : endIds[Math.floor(Math.random() * endIds.length)];
        const endId = forward
            ? endIds[Math.floor(Math.random() * endIds.length)]
            : startIds[Math.floor(Math.random() * startIds.length)];

        const p1 = roadRegistry.findPath(startId, nearestId);
        const p2 = roadRegistry.findPath(nearestId, endId);
        if (!p1 || !p2) return null;
        const seg1 = roadRegistry.pathToLatLngs(p1);
        const seg2 = roadRegistry.pathToLatLngs(p2);
        const full = [...seg1, ...seg2.slice(1)];
        return full.length >= 2 ? full : null;
    }

    /** 兜底：寻路失败时，沿跟拍位置拉一条横穿屏幕的直线（东西/南北随机）。 */
    private buildStraightRoute(anchor: Pt): Pt[] {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        const viewW = Math.max(0.5, ne.lng - sw.lng);
        const viewH = Math.max(0.5, ne.lat - sw.lat);
        const westLng = sw.lng - viewW * OFFSCREEN_MARGIN;
        const eastLng = ne.lng + viewW * OFFSCREEN_MARGIN;
        const southLat = sw.lat - viewH * OFFSCREEN_MARGIN;
        const northLat = ne.lat + viewH * OFFSCREEN_MARGIN;
        const forward = Math.random() < 0.5;
        if (Math.random() < 0.5) {
            const a = forward ? westLng : eastLng;
            const b = forward ? eastLng : westLng;
            return [{ lat: anchor.lat, lng: a }, { lat: anchor.lat, lng: b }];
        }
        const a = forward ? southLat : northLat;
        const b = forward ? northLat : southLat;
        return [{ lat: a, lng: anchor.lng }, { lat: b, lng: anchor.lng }];
    }

    private initialDistForEntry(path: Pt[], cum: number[]): number {
        const viewport = L.bounds(L.point(0, 0), this.map.getSize());
        for (let i = 1; i < path.length; i++) {
            const from = this.map.latLngToContainerPoint([path[i - 1].lat, path[i - 1].lng]);
            const to = this.map.latLngToContainerPoint([path[i].lat, path[i].lng]);
            const clipped = L.LineUtil.clipSegment(from, to, viewport, false);
            if (!clipped) continue;

            const pixelLength = from.distanceTo(to);
            const entryFraction = pixelLength > 0
                ? Math.min(1, from.distanceTo(clipped[0]) / pixelLength)
                : 0;
            const segmentLength = cum[i] - cum[i - 1];
            const entryDist = cum[i - 1] + segmentLength * entryFraction;
            return Math.max(0, entryDist - SPEED_DEG_PER_SEC * MAX_ENTRY_WAIT_SEC);
        }
        return 0;
    }

    private spawnTraffic(anchor: Pt): void {
        if (this.caravans.length >= CARAVAN_MAX) return;
        const path = this.buildCrossRoute(anchor) ?? this.buildStraightRoute(anchor);
        const { cum, total } = TradeTrafficLayer.buildCum(path);
        if (total <= 0) return;

        const region = getRegion(anchor.lat, anchor.lng);
        const cartDir = landAssetDir(region);
        const shipDirName = shipDir(region);
        this.loadAsset(cartDir);
        this.loadAsset(shipDirName);

        const count = UNITS_MIN + Math.floor(Math.random() * (UNITS_MAX - UNITS_MIN + 1));
        const initialDist = this.initialDistForEntry(path, cum);
        this.caravans.push({
            id: `trade_${this.idSeq++}`,
            path, cumLen: cum, totalLen: total,
            dist: initialDist, count, cartDir, shipDir: shipDirName,
            phase: Math.floor(Math.random() * 30), ageMs: 0,
            lastDirIdx: new Array(count).fill(-1), lastDirDeg: new Array(count).fill(NaN),
        });
    }

    // ── 每帧 ────────────────────────────────────────────────────────────
    private tick(now: number): void {
        // 🔴 [2026-08-31] 战术模式（scene13）下战略地图被整屏盖住，这层每帧重画是白烧。
        //    原实现 rAF 无条件永久运行。视口 0×0（面板隐藏）时同样跳过。
        if ((window as any).game?.scene13War?.isActive?.() === true
            || this.map.getSize().x === 0) {
            requestAnimationFrame(this.tick.bind(this));
            return;
        }
        if (!this.running) return;
        const dt = Math.min(0.1, Math.max(0, (now - this.lastTime) / 1000));
        this.lastTime = now;
        this.nowMs = now;

        // 🔴 [2026-08-31 修「商队总是看不到」] 原来写的是 `game.legionManager`，
        //    但 **GameApp 上根本没有 legionManager 这个属性** —— LegionManager 挂在
        //    `historicalEventManager.getLegionManager()` 下面（GameAppLoop 一直是这么取的）。
        //    结果 `followed` 恒为 undefined → followedId 恒为 null → spawnTraffic **一次都没被调用**，
        //    商队从上线起就没生成过。不是概率低看不到，是根本没有。
        const legionMgr = (window as any).game?.historicalEventManager?.getLegionManager?.();
        const followed = legionMgr?.getFollowedLegion?.();
        const followedId: string | null = followed?.id ?? null;
        const followedPos: Pt | null = followed ? followed.getPosition() : null;

        if (followedId !== this.lastFollowedId) {
            this.lastFollowedId = followedId;
            // 🔴 [2026-08-31 修「商队总是看不到」之二] 原来切跟拍**一刀清空所有车队**。
            //    而车队是生成在视口外、要走一段才进画面的（见 initialDistForEntry），
            //    镜头只要在这段时间内切走，车队就被删掉 —— 于是一辈子也看不到它进画面。
            //    改成只丢「离新镜头太远、这辈子也走不过来」的，近处的继续走完它的路。
            if (followedPos) {
                this.caravans = this.caravans.filter((c) => {
                    const at = TradeTrafficLayer.pointAt(c.path, c.cumLen, c.dist);
                    const dLat = at.lat - followedPos.lat, dLng = at.lng - followedPos.lng;
                    return Math.sqrt(dLat * dLat + dLng * dLng) <= KEEP_RADIUS_DEG;
                });
            } else {
                this.caravans.length = 0;   // 完全没有跟拍目标时才清空
            }
        }

        if (followedId && followedPos) {
            // 一帧内补满到 CARAVAN_MIN（原来一帧只补一支，配合 MAX=1 时没差别，
            // 现在 MIN=3 就必须循环，否则要三帧才铺满）
            while (this.caravans.length < CARAVAN_MIN) {
                const before = this.caravans.length;
                this.spawnTraffic(followedPos);
                if (this.caravans.length === before) break;   // 生成失败就别死循环
            }
        }

        const _t0 = performance.now();
        this.stepCaravans(dt);
        this.draw();
        perfDoctor.note('TradeTrafficLayer.tick(商队层)', performance.now() - _t0, 'src/map/TradeTrafficLayer.ts:tick');
        requestAnimationFrame(this.tick.bind(this));
    }

    private stepCaravans(dt: number): void {
        for (let i = this.caravans.length - 1; i >= 0; i--) {
            const c = this.caravans[i];
            c.ageMs += dt * 1000;
            c.dist += SPEED_DEG_PER_SEC * dt;
            // 走到屏幕外终点 → 直接移除（屏外，无需渐隐）
            if (c.dist >= c.totalLen) {
                this.caravans.splice(i, 1);
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
            const cartAsset = this.assetFor(c.cartDir);
            const shipAsset = this.assetFor(c.shipDir);

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
                const dirRes = this.dirIndex(asset, prevPos, pos, c.lastDirIdx[u], c.lastDirDeg[u]);
                const dirIdx = dirRes.idx;
                c.lastDirIdx[u] = dirRes.idx;
                c.lastDirDeg[u] = dirRes.deg;
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
    }

    private dirIndex(asset: TradeAsset, from: Pt, to: Pt, lastIdx: number, lastDeg: number): { idx: number; deg: number } {
        // 🔴 [2026-09-01 修「商队频繁更换朝向」] 朝向量化加迟滞（死区 10°）：
        //    折线方向停在扇区边界时，微小角度波动不再让贴图来回跳。
        // 🔴 [2026-09-01] 走 Mercator 屏幕轴，不用原始经纬度差（高纬斜向会整档打偏）
        const deg = asset.dirs16
            ? OrientationSystem.getScreenCompassDeg(from, to)
            : OrientationSystem.getScreenAngleDeg(from, to);
        const half = asset.dirs16 ? 11.25 : 22.5;
        if (Number.isFinite(lastDeg)) {
            let diff = ((deg - lastDeg) % 360 + 360) % 360;
            if (diff > 180) diff -= 360;
            if (Math.abs(diff) <= half + 10) return { idx: lastIdx, deg: lastDeg };
        }
        const idx = asset.dirs16
            ? ((Math.round((deg - 45) / 22.5) % 16) + 16) % 16
            : OrientationSystem.get8DirectionFromAngle(deg);
        return { idx, deg };
    }
}

let singleton: TradeTrafficLayer | null = null;
let visible = true;

export function initializeTradeTrafficLayer(gameMap: GameMap): TradeTrafficLayer {
    if (singleton) return singleton;
    singleton = new TradeTrafficLayer(gameMap.getLeafletMap());
    // [2026-08-31] 同动物层登记。本层 CARAVAN_MAX=1、素材少，暂不设预算，先看得见。
    if (import.meta.env.DEV) {
        perfDoctor.registerCache({
            name: 'TradeTrafficLayer:assets(商队/商船素材)',
            where: 'src/map/TradeTrafficLayer.ts:assets',
            entries: () => singleton!.debugAssetCount(),
            bytes: () => singleton!.debugAssetBytes(),
            limitKind: 'none',
        });
    }
    singleton.setVisible(visible);
    return singleton;
}

export function getTradeTrafficLayer(): TradeTrafficLayer | null {
    return singleton;
}

export function setTradeTrafficLayerVisible(nextVisible: boolean): void {
    visible = nextVisible;
    singleton?.setVisible(visible);
}
