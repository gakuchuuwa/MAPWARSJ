import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import type { GameMap } from './GameMap';
import { getRegion, type RegionType } from '../systems/RegionSystem';
import { LandSeaSystem } from '../world/land-sea';

/**
 * AnimalAmbientLayer — 战略地图「野生动物生态」环境层（2026-08-31 主人定稿）。
 *
 * 需求：
 *   · 按**真实世界分布**：动物散布在全图各文化区，镜头移到哪就看到哪里的动物。
 *   · 只放**野生动物 + 飞鸟**（不放家畜：牛/羊/猪/鸡/马/驴/骆驼/羊驼等）。
 *   · 陆上动物 8 向（idle 吃草/张望），飞鸟 16 向（hover 盘旋）。
 *
 * 实现：
 *   · 全图按 0.5° 网格确定性撒点（由 (列,行) 哈希决定是否有动物 + 哪种 + 偏移），
 *     动物位置固定不跳，只在视口内绘制。
 *   · 独立 canvas + Leaflet pane + rAF 循环，不碰现有渲染。
 *   · 素材来自 public/SUCAI_ANIMAL/，只画主图层 .png（原色）。
 */

type Pt = { lat: number; lng: number };

interface AnimalAsset {
    dir: string;
    dirs16: boolean;
    nDir: number;
    action: string;      // 'idle'（陆）或 'hover'（鸟）
    frames: number;
    dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }>;
    sheets: (HTMLImageElement | null)[];
    ready: boolean;
    /** 最近一次被绘制用到的时刻（字节预算 LRU 淘汰用） */
    lastUsed: number;
}

interface AnimalEntry {
    dir: string;
    pos: Pt;
    isBird: boolean;
    facing: number;      // 方向索引（陆 0-7 / 鸟 0-15）
    phase: number;       // 动画相位
}

// ── 可调参数 ──────────────────────────────────────────────────────────────
const CELL_DEG = 0.5;               // 撒点网格尺寸（度）
const LAND_DENSITY = 0.07;          // 陆地格出现动物的概率
const BIRD_DENSITY = 0.015;         // 格出现飞鸟的概率（稀疏点缀，视野内偶见数只翱翔，不喧宾夺主）
/** 🔴 [2026-09-01 主人定] 动物只在这两个缩放层显示：9 和 10 */
const ANIMAL_MIN_ZOOM = 9;
const ANIMAL_MAX_ZOOM = 10;
const SCALE_BASE = 0.6;             // 渲染缩放（× 2^(zoom-9)）
// 🔴 [2026-08-31 修「攻城战只显示攻城武器」] 必须低于 UNITS_LOW(580)。
//    580 是攻城战里**画在城池背后**的那批士兵所在的层；本层原值压在它之上，
//    等于把攻城方的士兵整个涂掉，只剩画在主层(UNITS=620)的攻城器械还看得见。
//    地面氛围层（植被/动物/商队）一律排在 CONNECTIONS(450) 与 UNITS_LOW(580) 之间。
const PANE_ZINDEX = 560;            // 动物：最底（低于植被565/商队570/UNITS_LOW580）
const CULL_MARGIN_DEG = 0.6;        // 视口外多算一圈，避免边缘弹入
const BIRD_DRIFT_RADIUS_PX = 18;    // 飞鸟盘旋半径（屏幕像素）
const BIRD_DRIFT_SPEED = 0.4;       // 飞鸟盘旋角速度（rad/s，约 15.7s 一圈）
// ──────────────────────────────────────────────────────────────────────────

// ── 生态分区（真实世界分布）───────────────────────────────────────────────
const RG_AFRICA: RegionType[] = ['AFRICA', 'BERBER', 'ETHIOPIANS'];
const RG_INDIA: RegionType[] = ['INDIA', 'PURU', 'BENGALIS', 'GURJARAS'];
const RG_SEASIA: RegionType[] = ['MALAY', 'VIETNAMESE', 'KHMER'];
const RG_EASTASIA: RegionType[] = [
    'CENTRAL', 'NORTH', 'JIANGNAN', 'LINGNAN', 'BASHU', 'DIANQIAN', 'HEXI', 'KOREA', 'JAPAN',
];
const RG_CENTRALASIA: RegionType[] = ['CENTRAL_ASIA', 'TIBET', 'WESTERN', 'PERSIAN'];
const RG_STEPPE: RegionType[] = ['STEPPE', 'NORTHEAST', 'CUMAN'];
const RG_MIDEAST: RegionType[] = ['ORIE', 'WEST_ASIA'];
const RG_EUROPE: RegionType[] = [
    'LATIN', 'GERMANIC', 'SLAVIC', 'BRITONS', 'GOTHS', 'HUNS', 'TEUTONS', 'VIKINGS',
    'CELTS', 'ITALIANS', 'SICILIANS', 'BULGARIANS', 'MAGYAR', 'LITHUANIANS', 'POLES',
    'BOHEMIANS', 'BURGUNDIANS', 'SPANISH', 'PORTUGUESE', 'EAST', 'GREEK', 'THRACIAN',
];
const RG_AMERICA: RegionType[] = ['AMERICA', 'ANDE', 'MAYANS', 'MAPUCHE', 'MUISCA', 'TUPI'];

/** 陆上野生动物（8 向；只野生，不含家畜与极地物种） */
const LAND_AFRICA = ['LION', 'ZEBRA', 'GAZELLE', 'OSTRICH', 'ELEPHANT', 'RHINO', 'CROCODILE', 'MONKEY', 'BLACK_PANTHER'];
const LAND_INDIA = ['TIGER', 'PEACOCK', 'ELEPHANT', 'RHINO', 'MONKEY', 'CROCODILE', 'SNAKE_WATER'];
const LAND_SEASIA = ['TIGER', 'PEACOCK', 'MONKEY', 'TAPIR', 'CROCODILE', 'KOMODO'];
const LAND_EASTASIA = ['DEER', 'BOAR', 'WOLF', 'BEAR', 'BEAR_BLACK', 'FOX_RED', 'HARE_BROWN', 'MONKEY', 'TIGER'];
const LAND_CENTRALASIA = ['SNOWLEOPARD', 'IBEX', 'ARGALI', 'MOUFLON', 'WOLF', 'BEAR'];
const LAND_STEPPE = ['WOLF', 'DEER', 'BEAR', 'FOX_RED', 'HARE_BROWN', 'BOAR'];
const LAND_MIDEAST = ['GAZELLE', 'WOLF_ARABIAN', 'SNAKE_GROUND', 'IBEX'];
const LAND_EUROPE = ['DEER', 'BOAR', 'WOLF', 'BEAR', 'FOX_RED', 'HARE_BROWN', 'MOUFLON', 'IBEX'];
const LAND_AMERICA = ['JAGUAR', 'GUANACO', 'RHEA', 'CAPYBARA', 'JAVELINA', 'TAPIR', 'CAIMAN', 'HARE_GREY', 'BLACK_PANTHER'];

/** 空中飞鸟（16 向）；基础 = 全球常见猛禽，加各生态区特有鸟 */
const BIRD_BASE = ['HAWK', 'FALCON', 'OWL'];
const BIRD_AFRICA = [...BIRD_BASE, 'VULTURE', 'FLAMINGO'];
const BIRD_MIDEAST = [...BIRD_BASE, 'VULTURE'];
const BIRD_EASTASIA = [...BIRD_BASE, 'CRANE', 'STORK'];
const BIRD_EUROPE = [...BIRD_BASE, 'STORK'];
const BIRD_AMERICA = [...BIRD_BASE, 'CONDOR', 'MACAW'];
const BIRD_OTHER = [...BIRD_BASE, 'STORK'];

function animalsForRegion(region: RegionType): { land: string[]; birds: string[] } {
    if (RG_AFRICA.includes(region)) return { land: LAND_AFRICA, birds: BIRD_AFRICA };
    if (RG_INDIA.includes(region)) return { land: LAND_INDIA, birds: BIRD_OTHER };
    if (RG_SEASIA.includes(region)) return { land: LAND_SEASIA, birds: BIRD_OTHER };
    if (RG_EASTASIA.includes(region)) return { land: LAND_EASTASIA, birds: BIRD_EASTASIA };
    if (RG_CENTRALASIA.includes(region)) return { land: LAND_CENTRALASIA, birds: BIRD_OTHER };
    if (RG_STEPPE.includes(region)) return { land: LAND_STEPPE, birds: BIRD_OTHER };
    if (RG_MIDEAST.includes(region)) return { land: LAND_MIDEAST, birds: BIRD_MIDEAST };
    if (RG_EUROPE.includes(region)) return { land: LAND_EUROPE, birds: BIRD_EUROPE };
    if (RG_AMERICA.includes(region)) return { land: LAND_AMERICA, birds: BIRD_AMERICA };
    return { land: LAND_EUROPE, birds: BIRD_OTHER };
}

/** 确定性整数哈希 → [0,1)。同 (col,row,salt) 恒同值，保证动物位置不跳。 */
function hash01(col: number, row: number, salt: number): number {
    let h = (col * 374761393 + row * 668265263 + salt * 1274126177) | 0;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return (h >>> 0) / 4294967295;
}

export class AnimalAmbientLayer {
    private map: L.Map;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private assets: Map<string, AnimalAsset> = new Map();
    private entries: AnimalEntry[] = [];
    private lastCellRange: string | null = null;
    private running = false;
    private lastTime = 0;
    private nowMs = 0;

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
        const name = 'animalPane';
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

    private landVisible = false;
    private birdsVisible = true;

    public setVisible(visible: boolean): void {
        this.canvas.style.display = visible ? 'block' : 'none';
    }

    public setLandVisible(visible: boolean): void {
        if (this.landVisible === visible) return;
        this.landVisible = visible;
        this.lastCellRange = null; // 触发重新撒点
    }

    public setBirdsVisible(visible: boolean): void {
        if (this.birdsVisible === visible) return;
        this.birdsVisible = visible;
        this.lastCellRange = null; // 触发重新撒点
    }

    // ── 素材加载 ────────────────────────────────────────────────────────
    private loadAsset(dir: string, isBird: boolean): void {
        if (this.assets.has(dir)) return;
        const asset: AnimalAsset = {
            dir, dirs16: isBird, nDir: isBird ? 16 : 8,
            action: isBird ? 'hover' : 'idle', frames: 1, dirs: {}, sheets: [], ready: false,
            lastUsed: performance.now(),
        };
        this.assets.set(dir, asset);
        const base = `/SUCAI_ANIMAL/${dir}`;
        fetch(`${base}/_meta.json`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`meta ${r.status}`))))
            .then((meta) => {
                asset.dirs16 = meta.dirs16 === true;
                asset.nDir = meta.nDir ?? (asset.dirs16 ? 16 : 8);
                const act = meta[asset.action] ? asset.action : (asset.dirs16 ? 'fly' : 'walk');
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
            .catch((e) => console.warn(`[Animal] 加载 ${dir} 失败:`, e));
    }

    private assetFor(dir: string): AnimalAsset | undefined {
        const a = this.assets.get(dir);
        if (a) a.lastUsed = performance.now();   // LRU 时间戳
        return a && a.ready ? a : undefined;
    }

    /** 一种动物已解码占多少字节（w×h×4，逐张方向图累加） */
    private assetBytes(a: AnimalAsset): number {
        let b = 0;
        for (const im of a.sheets) {
            if (im) b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
        }
        return b;
    }

    private totalAssetBytes(): number {
        let b = 0;
        for (const a of this.assets.values()) b += this.assetBytes(a);
        return b;
    }

    /**
     * 🔴 [2026-08-31] 按**字节预算**淘汰最久未用的动物素材。
     *    实测 65 种动物全部解码后 **635MB**（大象一种就 68MB、犀牛 22MB），
     *    而原实现 `assets` Map **无上限、从不淘汰** —— 玩家在世界各地平移，
     *    各区域的动物会逐步全量驻留，叠上战术模式单场约 1.3GB 的素材工作集，
     *    直奔浏览器 4096MB 天花板（scene13 就是这么撞上去的，见记忆 scene13-lag-is-heap-ceiling）。
     *    120MB 够同时装十几种（中位单种 9MB），跨大洲平移才会淘汰，重新加载也只是一次 HTTP。
     */
    private evictAssets(): void {
        let bytes = this.totalAssetBytes();
        if (bytes <= AnimalAmbientLayer.ASSET_BUDGET_BYTES) return;
        const inUse = new Set(this.entries.map((e) => e.dir));
        const cands = [...this.assets.entries()]
            .filter(([dir]) => !inUse.has(dir))               // 当前屏上在用的不淘汰
            .sort((a, b) => (a[1].lastUsed ?? 0) - (b[1].lastUsed ?? 0));
        for (const [dir, a] of cands) {
            if (bytes <= AnimalAmbientLayer.ASSET_BUDGET_BYTES) break;
            bytes -= this.assetBytes(a);
            this.assets.delete(dir);
        }
    }

    private static readonly ASSET_BUDGET_BYTES = 120 * 1024 * 1024;

    /** PerfDoctor 体检口子（private 在类外读不到） */
    public debugAssetCount(): number { return this.assets.size; }
    public debugAssetBytes(): number { return this.totalAssetBytes(); }

    // ── 撒点 ────────────────────────────────────────────────────────────
    private recomputeEntries(): void {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        const colMin = Math.floor((sw.lng - CULL_MARGIN_DEG) / CELL_DEG);
        const colMax = Math.floor((ne.lng + CULL_MARGIN_DEG) / CELL_DEG);
        const rowMin = Math.floor((sw.lat - CULL_MARGIN_DEG) / CELL_DEG);
        const rowMax = Math.floor((ne.lat + CULL_MARGIN_DEG) / CELL_DEG);

        const key = `${colMin},${colMax},${rowMin},${rowMax}`;
        if (key === this.lastCellRange) return;
        this.lastCellRange = key;

        const next: AnimalEntry[] = [];
        for (let col = colMin; col <= colMax; col++) {
            for (let row = rowMin; row <= rowMax; row++) {
                const clat = (row + 0.5) * CELL_DEG;
                const clng = (col + 0.5) * CELL_DEG;
                const region = getRegion(clat, clng);
                const { land, birds } = animalsForRegion(region);

                // 陆上动物
                const lh = hash01(col, row, 1);
                if (this.landVisible && lh < LAND_DENSITY) {
                    const offLat = (hash01(col, row, 3) - 0.5) * CELL_DEG * 0.8;
                    const offLng = (hash01(col, row, 4) - 0.5) * CELL_DEG * 0.8;
                    const pos = { lat: clat + offLat, lng: clng + offLng };
                    if (!this.isSea(pos)) {
                        const dir = land[Math.floor(hash01(col, row, 5) * land.length) % land.length];
                        const facing = Math.floor(hash01(col, row, 6) * 8) % 8;
                        const phase = Math.floor(hash01(col, row, 7) * 1000);
                        this.loadAsset(dir, false);
                        next.push({ dir, pos, isBird: false, facing, phase });
                    }
                }

                // 飞鸟
                const bh = hash01(col, row, 2);
                if (this.birdsVisible && bh < BIRD_DENSITY) {
                    const offLat = (hash01(col, row, 8) - 0.5) * CELL_DEG * 0.8;
                    const offLng = (hash01(col, row, 9) - 0.5) * CELL_DEG * 0.8;
                    const pos = { lat: clat + offLat, lng: clng + offLng };
                    if (!this.isSea(pos)) {
                        const dir = birds[Math.floor(hash01(col, row, 10) * birds.length) % birds.length];
                        const facing = Math.floor(hash01(col, row, 11) * 16) % 16;
                        const phase = Math.floor(hash01(col, row, 12) * 1000);
                        this.loadAsset(dir, true);
                        next.push({ dir, pos, isBird: true, facing, phase });
                    }
                }
            }
        }
        this.entries = next;
    }

    private isSea(pos: Pt): boolean {
        try {
            return LandSeaSystem.isSeaAt(pos);
        } catch {
            return false;
        }
    }

    // ── 每帧 ────────────────────────────────────────────────────────────
    private tick(now: number): void {
        if (!this.running) return;
        this.lastTime = now;
        this.nowMs = now;
        // 🔴 [2026-08-31] 战术模式（scene13）下战略地图被整屏盖住，这一层每帧清屏重画纯属白烧。
        //    原实现的 rAF 无条件永久运行，既不看缩放也不看可见性。
        //    画布已经清空过一次就不必再清，直接跳过本帧。
        if (this.isHiddenNow()) {
            if (!this.clearedWhileHidden) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.clearedWhileHidden = true;
            }
            requestAnimationFrame(this.tick.bind(this));
            return;
        }
        this.clearedWhileHidden = false;
        const _t0 = performance.now();
        this.recomputeEntries();
        this.evictAssets();
        this.draw();
        perfDoctor.note('AnimalAmbientLayer.tick(动物层)', performance.now() - _t0, 'src/map/AnimalAmbientLayer.ts:tick');
        requestAnimationFrame(this.tick.bind(this));
    }

    private clearedWhileHidden = false;

    /**
     * 本帧要不要整层跳过（不重算、不重画，只清一次屏）。
     * 🔴 [2026-09-01 主人定] 动物只在 **zoom 9 / 10** 两层出现：
     *    8 是全局俯瞰（动物变成满屏小点），11+ 已是战场尺度，都不该有野生动物。
     *    在这里拦掉而不是只藏画布 —— 顺带省掉 recomputeEntries + draw 的每帧开销。
     */
    private isHiddenNow(): boolean {
        if (this.isObscured()) return true;
        const z = Math.round(this.map.getZoom());
        return z < ANIMAL_MIN_ZOOM || z > ANIMAL_MAX_ZOOM;
    }

    /** 战略地图此刻是否被战术演出盖住（或视口尺寸为 0） */
    private isObscured(): boolean {
        if ((window as any).game?.scene13War?.isActive?.() === true) return true;
        const s = this.map.getSize();
        return s.x === 0 || s.y === 0;
    }

    private draw(): void {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.entries.length === 0) return;

        const zoom = this.map.getZoom();
        const scale = Math.pow(2, zoom - 9) * SCALE_BASE;
        const b = this.map.getBounds();
        const m = 40; // 屏幕裁剪余量

        for (const e of this.entries) {
            const asset = this.assetFor(e.dir);
            if (!asset) continue;
            const pt = this.map.latLngToContainerPoint([e.pos.lat, e.pos.lng]);

            // 飞鸟缓速盘旋：以锚点为中心做圆周漂移 + 朝向随切向转（不再"钉在空中"）
            let drawX = pt.x;
            let drawY = pt.y;
            let facing = e.facing;
            if (e.isBird) {
                const theta = BIRD_DRIFT_SPEED * (this.nowMs / 1000) + e.phase * 0.01;
                drawX = pt.x + BIRD_DRIFT_RADIUS_PX * Math.cos(theta);
                drawY = pt.y + BIRD_DRIFT_RADIUS_PX * Math.sin(theta);
                // 切向 (vx,vy)=(-sinθ,cosθ)；世界方向 dLng=vx、dLat=-vy（屏幕 y 朝下）
                const rad = Math.atan2(-Math.sin(theta), -Math.cos(theta));
                const deg = rad * 180 / Math.PI;
                facing = ((Math.round((deg - 45) / 22.5) % 16) + 16) % 16;
            }

            if (drawX < -m || drawX > this.canvas.width + m || drawY < -m || drawY > this.canvas.height + m) continue;

            const box = asset.dirs[String(facing)];
            if (!box) continue;
            const sheet = asset.sheets[facing];
            if (!sheet || !sheet.complete || !sheet.naturalWidth) continue;

            const frame = Math.floor(this.nowMs / 1000 * 14 + e.phase) % asset.frames;
            const fw = box.fw, fh = box.fh, hx = box.hx, hy = box.hy;
            const dx = drawX - hx * scale;
            const dy = drawY - hy * scale;
            ctx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
        }
    }
}

let singleton: AnimalAmbientLayer | null = null;
let visible = true;
let landVisible = false;
let birdsVisible = true;

export function initializeAnimalAmbientLayer(gameMap: GameMap): AnimalAmbientLayer {
    if (singleton) return singleton;
    singleton = new AnimalAmbientLayer(gameMap.getLeafletMap());
    // [2026-08-31] 按 PerfDoctor 铁律登记：任何图片缓存都必须能报**字节数**。
    //   实测 65 种动物全部解码 635MB，是必须盯住的一块。
    if (import.meta.env.DEV) {
        perfDoctor.registerCache({
            name: 'AnimalAmbientLayer:assets(动物素材)',
            where: 'src/map/AnimalAmbientLayer.ts:ASSET_BUDGET_BYTES',
            entries: () => singleton!.debugAssetCount(),
            bytes: () => singleton!.debugAssetBytes(),
            limitKind: 'bytes',
            limitValue: 120 * 1024 * 1024,
        });
    }
    singleton.setVisible(visible);
    singleton.setLandVisible(landVisible);
    singleton.setBirdsVisible(birdsVisible);
    return singleton;
}

export function getAnimalAmbientLayer(): AnimalAmbientLayer | null {
    return singleton;
}

export function setAnimalAmbientLayerVisible(nextVisible: boolean): void {
    visible = nextVisible;
    singleton?.setVisible(visible);
}

export function setLandAnimalVisible(nextVisible: boolean): void {
    landVisible = nextVisible;
    singleton?.setLandVisible(landVisible);
}

export function setFlyingAnimalVisible(nextVisible: boolean): void {
    birdsVisible = nextVisible;
    singleton?.setBirdsVisible(birdsVisible);
}
