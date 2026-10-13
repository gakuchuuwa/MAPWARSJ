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
    action: string;      // 'idle'（陆）或 'fly'/'hover'（鸟）
    dirs16: boolean;
    nDir: number;
    frames: number;
    dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }>;
    sheets: (HTMLImageElement | null)[];
    ready: boolean;
    /** 最近一次被绘制用到的时刻（字节预算 LRU 淘汰用） */
    lastUsed: number;
}

interface AnimalEntry {
    id: string;          // 网格标识（如 `${col},${row}`）
    dir: string;
    pos: Pt;
    facing: number;      // 方向索引（陆 0-7）
    phase: number;       // 动画相位
    alpha: number;       // 当前透明度 0.0 ~ 1.0（渐显/渐隐）
    fadingOut?: boolean; // 渐隐中
}

/** DE 巡航飞鸟：跨屏巡游 + 振翅/滑翔交替 + 渐显/渐隐 */
interface BirdAgent {
    dir: string;
    lat: number;
    lng: number;
    targetLat: number;
    targetLng: number;
    hovering: boolean;   // false = fly 振翅巡航, true = hover 展翅滑翔
    timer: number;      // 动作交替计时器（秒）
    phase: number;
    alpha: number;       // 当前透明度 0.0 ~ 1.0（渐显/渐隐）
    fadingOut?: boolean; // 渐隐中
}

// ── 可调参数 ──────────────────────────────────────────────────────────────
const CELL_DEG = 0.5;               // 撒点网格尺寸（度）
const LAND_DENSITY = 0.07;          // 陆地格出现动物的概率
const BIRD_DENSITY = 0.08;          // 格出现飞鸟的概率（稀疏点缀，视野内偶见 1~2 只翱翔，不喧宾夺主）
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
const BIRD_DRIFT_RADIUS_PX = 70;    // 飞鸟盘旋半径（屏幕像素，与翼展匹配的高空开阔盘旋）
const BIRD_DRIFT_SPEED = 0.4;       // 飞鸟盘旋角速度（rad/s，约 15.7s 一圈）
// ──────────────────────────────────────────────────────────────────────────

// ── 生态分区（真实世界分布）───────────────────────────────────────────────
const RG_AFRICA: RegionType[] = ['AFRICA', 'BERBER'];
const RG_INDIA: RegionType[] = ['INDIA', 'PURU'];
const RG_SEASIA: RegionType[] = ['MALAY'];
const RG_EASTASIA: RegionType[] = [
    'CENTRAL', 'NORTH', 'JIANGNAN', 'HEXI', 'KOREA',
];
const RG_JAPAN: RegionType[] = ['JAPAN'];
const RG_TIBET_CENTRALASIA: RegionType[] = ['CENTRAL_ASIA', 'TIBET', 'WESTERN', 'PERSIAN'];
const RG_STEPPE: RegionType[] = ['STEPPE', 'NORTHEAST', 'CUMAN'];
const RG_MIDEAST: RegionType[] = ['ORIE', 'WEST_ASIA', 'WEST_ASIA_ANTIQUITY', 'WEST_ASIA_CASTLE'];
const RG_EUROPE: RegionType[] = [
    'LATIN', 'LATIN_CASTLE', 'LATIN_IMPERIAL',
    'GERMANIC', 'GERMANIC_FEUDAL', 'GERMANIC_CASTLE', 'GERMANIC_IMPERIAL',
    'SLAVIC', 'SLAVIC_FEUDAL', 'SLAVIC_CASTLE', 'SLAVIC_IMPERIAL',
    'BRITONS', 'EAST', 'GREEK', 'THRACIAN',
];
const RG_AMERICA_ANDE: RegionType[] = ['ANDE'];
const RG_AMERICA_TROPICAL: RegionType[] = ['AMERICA'];

/** 陆上野生动物（8 向；只野生，不含家畜与极地物种） */
const LAND_AFRICA = ['LION', 'ZEBRA', 'GAZELLE', 'OSTRICH', 'ELEPHANT', 'RHINO', 'CROCODILE', 'MONKEY', 'BLACK_PANTHER'];
const LAND_INDIA = ['TIGER', 'PEACOCK', 'ELEPHANT', 'RHINO', 'MONKEY', 'CROCODILE', 'SNAKE_WATER'];
const LAND_SEASIA = ['TIGER', 'PEACOCK', 'MONKEY', 'TAPIR', 'CROCODILE', 'KOMODO'];
const LAND_EASTASIA = ['DEER', 'BOAR', 'WOLF', 'BEAR', 'BEAR_BLACK', 'FOX_RED', 'HARE_BROWN', 'MONKEY', 'TIGER'];
const LAND_JAPAN = ['DEER', 'BOAR', 'WOLF', 'BEAR', 'BEAR_BLACK', 'FOX_RED', 'HARE_BROWN', 'MONKEY'];
const LAND_CENTRALASIA = ['SNOWLEOPARD', 'IBEX', 'ARGALI', 'MOUFLON', 'WOLF', 'BEAR'];
const LAND_STEPPE = ['WOLF', 'DEER', 'BEAR', 'FOX_RED', 'HARE_BROWN', 'BOAR'];
const LAND_MIDEAST = ['GAZELLE', 'WOLF_ARABIAN', 'SNAKE_GROUND', 'IBEX'];
const LAND_EUROPE = ['DEER', 'BOAR', 'WOLF', 'BEAR', 'FOX_RED', 'HARE_BROWN', 'MOUFLON', 'IBEX'];
const LAND_AMERICA = ['JAGUAR', 'GUANACO', 'RHEA', 'CAPYBARA', 'JAVELINA', 'TAPIR', 'CAIMAN', 'HARE_GREY', 'BLACK_PANTHER'];

/** 空中飞鸟（16 向；严格按世界自然动物地理学分布） */
const BIRD_AFRICA = ['FLAMINGO', 'VULTURE', 'FALCON', 'HAWK', 'OWL'];               // 非洲：大裂谷盐湖红鹳、热带草原兀鹫、游隼
const BIRD_MIDEAST = ['FLAMINGO', 'VULTURE', 'FALCON', 'HAWK', 'OWL'];              // 中东/埃及/波斯：红海波斯湾火烈鸟、沙漠兀鹫、阿拉伯猎隼
const BIRD_INDIA = ['FLAMINGO', 'CRANE', 'VULTURE', 'FALCON', 'HAWK', 'OWL'];      // 印度：卡奇大盐沼火烈鸟、印度圣鸟赤颈鹤、印度兀鹫
const BIRD_SEASIA = ['CRANE', 'HAWK', 'FALCON', 'OWL'];                            // 东南亚：湄公河湿地赤颈鹤、林栖苍鹰、游隼
const BIRD_EASTASIA = ['CRANE', 'STORK', 'HAWK', 'FALCON', 'OWL'];                 // 东亚汉地/朝鲜：松鹤延年丹顶鹤、江淮东方白鹳、游隼
const BIRD_JAPAN = ['CRANE', 'HAWK', 'FALCON', 'OWL'];                             // 日本：北海道钏路丹顶鹤、苍鹰、游隼（岛屿无秃鹫白鹳）
const BIRD_TIBET_CENTRALASIA = ['VULTURE', 'FALCON', 'HAWK', 'OWL'];               // 青藏高原/中亚/西域：高山天葬兀鹫、高原猎隼（无白鹳）
const BIRD_STEPPE = ['FALCON', 'VULTURE', 'CRANE', 'HAWK', 'OWL'];                // 欧亚草原/东北：海东青猎隼、草原兀鹫、湿地迁徙鹤
const BIRD_EUROPE = ['STORK', 'FALCON', 'HAWK', 'OWL'];                            // 欧洲全境：欧洲标志白鹳（送子鸟）、欧洲游隼、苍鹰
const BIRD_AMERICA_ANDE = ['CONDOR', 'HAWK', 'FALCON', 'OWL'];                     // 南美安第斯高地：安第斯神鹰（CONDOR 独占）、高山猛禽
const BIRD_AMERICA_TROPICAL = ['MACAW', 'HAWK', 'OWL', 'FALCON'];                  // 中美/热带雨林低地：金刚鹦鹉（MACAW 独占）、林区猛禽

function animalsForRegion(region: RegionType): { land: string[]; birds: string[] } {
    if (RG_AFRICA.includes(region)) return { land: LAND_AFRICA, birds: BIRD_AFRICA };
    if (RG_INDIA.includes(region)) return { land: LAND_INDIA, birds: BIRD_INDIA };
    if (RG_SEASIA.includes(region)) return { land: LAND_SEASIA, birds: BIRD_SEASIA };
    if (RG_JAPAN.includes(region)) return { land: LAND_JAPAN, birds: BIRD_JAPAN };
    if (RG_EASTASIA.includes(region)) return { land: LAND_EASTASIA, birds: BIRD_EASTASIA };
    if (RG_TIBET_CENTRALASIA.includes(region)) return { land: LAND_CENTRALASIA, birds: BIRD_TIBET_CENTRALASIA };
    if (RG_STEPPE.includes(region)) return { land: LAND_STEPPE, birds: BIRD_STEPPE };
    if (RG_MIDEAST.includes(region)) return { land: LAND_MIDEAST, birds: BIRD_MIDEAST };
    if (RG_EUROPE.includes(region)) return { land: LAND_EUROPE, birds: BIRD_EUROPE };
    if (RG_AMERICA_ANDE.includes(region)) return { land: LAND_AMERICA, birds: BIRD_AMERICA_ANDE };
    if (RG_AMERICA_TROPICAL.includes(region)) return { land: LAND_AMERICA, birds: BIRD_AMERICA_TROPICAL };
    return { land: LAND_EUROPE, birds: BIRD_EUROPE };
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
    private birds: BirdAgent[] = [];
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
        if (!visible) {
            for (const e of this.entries) e.fadingOut = true;
        }
    }

    public setBirdsVisible(visible: boolean): void {
        if (this.birdsVisible === visible) return;
        this.birdsVisible = visible;
        if (!visible) {
            for (const b of this.birds) b.fadingOut = true;
        }
    }

    // ── 素材加载 ────────────────────────────────────────────────────────
    private loadAsset(dir: string, action: string, isBird: boolean): void {
        const key = `${dir}:${action}`;
        if (this.assets.has(key)) return;
        const asset: AnimalAsset = {
            dir, action, dirs16: isBird, nDir: isBird ? 16 : 8,
            frames: 1, dirs: {}, sheets: [], ready: false,
            lastUsed: performance.now(),
        };
        this.assets.set(key, asset);
        const base = `/SUCAI_ANIMAL/${dir}`;
        fetch(`${base}/_meta.json`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`meta ${r.status}`))))
            .then((meta) => {
                asset.dirs16 = meta.dirs16 === true;
                asset.nDir = meta.nDir ?? (asset.dirs16 ? 16 : 8);
                const act = meta[action] ? action : (asset.dirs16 ? 'fly' : 'walk');
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
            .catch((e) => console.warn(`[Animal] 加载 ${key} 失败:`, e));
    }

    private assetFor(key: string): AnimalAsset | undefined {
        const a = this.assets.get(key);
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
        const inUse = new Set<string>();
        for (const e of this.entries) inUse.add(`${e.dir}:idle`);
        for (const b of this.birds) {
            inUse.add(`${b.dir}:fly`);
            inUse.add(`${b.dir}:hover`);
        }
        const cands = [...this.assets.entries()]
            .filter(([k]) => !inUse.has(k))               // 当前屏上在用的不淘汰
            .sort((a, b) => (a[1].lastUsed ?? 0) - (b[1].lastUsed ?? 0));
        for (const [k, a] of cands) {
            if (bytes <= AnimalAmbientLayer.ASSET_BUDGET_BYTES) break;
            bytes -= this.assetBytes(a);
            this.assets.delete(k);
        }
    }

    private static readonly ASSET_BUDGET_BYTES = 120 * 1024 * 1024;

    /** PerfDoctor 体检口子（private 在类外读不到） */
    public debugAssetCount(): number { return this.assets.size; }
    public debugAssetBytes(): number { return this.totalAssetBytes(); }

    // ── 陆地动物更新与撒点（含渐显与渐隐） ────────────────────────────────
    private updateLandEntries(dt: number): void {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        const colMin = Math.floor((sw.lng - CULL_MARGIN_DEG) / CELL_DEG);
        const colMax = Math.floor((ne.lng + CULL_MARGIN_DEG) / CELL_DEG);
        const rowMin = Math.floor((sw.lat - CULL_MARGIN_DEG) / CELL_DEG);
        const rowMax = Math.floor((ne.lat + CULL_MARGIN_DEG) / CELL_DEG);

        const activeIds = new Set<string>();

        if (this.landVisible) {
            for (let col = colMin; col <= colMax; col++) {
                for (let row = rowMin; row <= rowMax; row++) {
                    const id = `${col},${row}`;
                    const lh = hash01(col, row, 1);
                    if (lh < LAND_DENSITY) {
                        const clat = (row + 0.5) * CELL_DEG;
                        const clng = (col + 0.5) * CELL_DEG;
                        const offLat = (hash01(col, row, 3) - 0.5) * CELL_DEG * 0.8;
                        const offLng = (hash01(col, row, 4) - 0.5) * CELL_DEG * 0.8;
                        const pos = { lat: clat + offLat, lng: clng + offLng };
                        if (!this.isSea(pos)) {
                            activeIds.add(id);
                            // 若尚未在 entries 中，则新生成一只并从 alpha = 0 开始渐显
                            let entry = this.entries.find((e) => e.id === id);
                            if (!entry) {
                                const region = getRegion(clat, clng);
                                const { land } = animalsForRegion(region);
                                const dir = land[Math.floor(hash01(col, row, 5) * land.length) % land.length];
                                const facing = Math.floor(hash01(col, row, 6) * 8) % 8;
                                const phase = Math.floor(hash01(col, row, 7) * 1000);
                                this.loadAsset(dir, 'idle', false);
                                this.entries.push({ id, dir, pos, facing, phase, alpha: 0, fadingOut: false });
                            }
                        }
                    }
                }
            }
        }

        const FADE_DUR = 1.0; // 渐显/渐隐时长（秒）
        for (let i = this.entries.length - 1; i >= 0; i--) {
            const e = this.entries[i];
            if (activeIds.has(e.id)) {
                // 处于可见区：渐显
                e.fadingOut = false;
                e.alpha = Math.min(1, e.alpha + dt / FADE_DUR);
            } else {
                // 移出可见区或关闭：渐隐
                e.fadingOut = true;
                e.alpha = Math.max(0, e.alpha - dt / FADE_DUR);
                if (e.alpha <= 0) {
                    this.entries.splice(i, 1);
                }
            }
        }
    }

    private isSea(pos: Pt): boolean {
        try {
            return LandSeaSystem.isSeaAt(pos);
        } catch {
            return false;
        }
    }

    // ── DE 飞鸟系统（与战术模式 Scene13 及 DE 原作完全一致） ────────────────
    /** AoE2 DE 16 方向索引转换（逆时针/顺时针与资产帧完全对齐） */
    private birdDir(dx: number, dy: number): number {
        let a = (Math.atan2(-dy, dx) * 180) / Math.PI;
        a = ((a % 360) + 360) % 360;
        return (18 - Math.floor(((a + 11.25) % 360) / 22.5)) % 16;
    }

    /** 在视口内生成一只 DE 巡航飞鸟（跨屏直线长途巡游） */
    private spawnBirdInBounds(sw: L.LatLng, ne: L.LatLng): void {
        // 在视口内随机生成起始点，严格以此处真实经纬度确定地理生态区
        const lat = sw.lat + Math.random() * (ne.lat - sw.lat);
        const lng = sw.lng + Math.random() * (ne.lng - sw.lng);
        const region = getRegion(lat, lng);
        const { birds } = animalsForRegion(region);
        const dir = birds[Math.floor(Math.random() * birds.length)];
        this.loadAsset(dir, 'fly', true);
        this.loadAsset(dir, 'hover', true);

        const angle = Math.random() * Math.PI * 2;
        const distFly = 1.5 + Math.random() * 2.5; // 目标跨越 1.5~4.0 度（大范围长途巡航）

        this.birds.push({
            dir,
            lat,
            lng,
            targetLat: lat + Math.sin(angle) * distFly,
            targetLng: lng + Math.cos(angle) * distFly,
            hovering: Math.random() < 0.5,
            timer: 3.0 + Math.random() * 4.0, // 3~7 秒交替
            phase: Math.random() * 1000,
            alpha: 0.0,       // 初始透明度 0（渐显）
            fadingOut: false,
        });
    }

    /** 飞鸟长途巡航更新：长距直线巡游 + fly 振翅 ⇄ hover 滑翔交替 + 渐显/渐隐 */
    private updateBirds(dt: number): void {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        const FADE_DUR = 1.2; // 渐显/渐隐时长（秒）

        // 维持视口内 2~3 只活跃飞鸟（渐隐中的飞鸟不计入配额，确保渐显平滑补位）
        const MAX_BIRDS = 3;
        if (this.birdsVisible) {
            const activeCount = this.birds.filter((b) => !b.fadingOut).length;
            if (activeCount < MAX_BIRDS) {
                this.spawnBirdInBounds(sw, ne);
            }
        }

        const speedDeg = 0.09; // 战略巡航速度（度/秒，约 70~100 屏幕像素/秒）
        for (let i = this.birds.length - 1; i >= 0; i--) {
            const b = this.birds[i];
            b.timer -= dt;
            // 🔴 [DE 原生机制] fly 振翅巡航 ⇄ hover 展翅滑翔交替（每 3~7 秒切换一次）
            if (b.timer <= 0) {
                b.hovering = !b.hovering;
                b.timer = 3.0 + Math.random() * 4.0;
            }

            // 飞鸟渐隐判定：不可见状态、或飞临视口边缘缓冲带时触发渐隐
            const margin = 0.3;
            const nearEdge = b.lat < sw.lat - margin || b.lat > ne.lat + margin || b.lng < sw.lng - margin || b.lng > ne.lng + margin;
            if (!this.birdsVisible || nearEdge) {
                b.fadingOut = true;
            }

            // 透明度更新（渐显 / 渐隐）
            if (b.fadingOut) {
                b.alpha = Math.max(0, b.alpha - dt / FADE_DUR);
                if (b.alpha <= 0) {
                    this.birds.splice(i, 1);
                    continue;
                }
            } else {
                b.alpha = Math.min(1, b.alpha + dt / FADE_DUR);
            }

            const dLat = b.targetLat - b.lat;
            const dLng = b.targetLng - b.lng;
            const dist = Math.hypot(dLat, dLng);

            if (dist < 0.05) {
                // 到达当前目标点，选一个新远方目标继续巡航
                const angle = Math.random() * Math.PI * 2;
                const distFly = 1.5 + Math.random() * 2.5;
                b.targetLat = b.lat + Math.sin(angle) * distFly;
                b.targetLng = b.lng + Math.cos(angle) * distFly;
            } else {
                b.lat += (dLat / dist) * speedDeg * dt;
                b.lng += (dLng / dist) * speedDeg * dt;
            }
        }
    }

    // ── 每帧 ────────────────────────────────────────────────────────────
    private tick(now: number): void {
        if (!this.running) return;
        const dt = Math.min(0.1, this.lastTime > 0 ? (now - this.lastTime) / 1000 : 0.016);
        this.lastTime = now;
        this.nowMs = now;
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
        this.updateLandEntries(dt);
        this.updateBirds(dt);
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

        const zoom = this.map.getZoom();
        const scale = Math.pow(2, zoom - 9) * SCALE_BASE;
        const m = 40; // 屏幕裁剪余量

        // 1. 绘制陆地动物（idle 吃草/张望，位置固定，渐显/渐隐）
        for (const e of this.entries) {
            if (e.alpha <= 0) continue;
            const asset = this.assetFor(`${e.dir}:idle`);
            if (!asset) continue;
            const pt = this.map.latLngToContainerPoint([e.pos.lat, e.pos.lng]);
            if (pt.x < -m || pt.x > this.canvas.width + m || pt.y < -m || pt.y > this.canvas.height + m) continue;
            const box = asset.dirs[String(e.facing)];
            if (!box) continue;
            const sheet = asset.sheets[e.facing];
            if (!sheet || !sheet.complete || !sheet.naturalWidth) continue;

            const frame = Math.floor((this.nowMs / 1000) * 14 + e.phase) % asset.frames;
            const fw = box.fw, fh = box.fh, hx = box.hx, hy = box.hy;
            const dx = pt.x - hx * scale;
            const dy = pt.y - hy * scale;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, e.alpha));
            ctx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
            ctx.restore();
        }

        // 2. 绘制 DE 巡航飞鸟（跨屏直线长途巡游 + fly 振翅 ⇄ hover 滑翔交替 + 渐显/渐隐）
        for (const b of this.birds) {
            if (b.alpha <= 0) continue;
            const act = b.hovering ? 'hover' : 'fly';
            const asset = this.assetFor(`${b.dir}:${act}`);
            if (!asset) continue;

            const pt = this.map.latLngToContainerPoint([b.lat, b.lng]);
            if (pt.x < -m || pt.x > this.canvas.width + m || pt.y < -m || pt.y > this.canvas.height + m) continue;

            const targetPt = this.map.latLngToContainerPoint([b.targetLat, b.targetLng]);
            const curDx = targetPt.x - pt.x;
            const curDy = targetPt.y - pt.y;
            const facing = this.birdDir(curDx, curDy);

            const box = asset.dirs[String(facing)];
            if (!box) continue;
            const sheet = asset.sheets[facing];
            if (!sheet || !sheet.complete || !sheet.naturalWidth) continue;

            const frame = Math.floor((this.nowMs / 1000) * 14 + b.phase) % asset.frames;
            const fw = box.fw, fh = box.fh, hx = box.hx, hy = box.hy;
            const dx = pt.x - hx * scale;
            const dy = pt.y - hy * scale;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, b.alpha));
            ctx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
            ctx.restore();
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
