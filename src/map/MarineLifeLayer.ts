import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { getFollowedArmyId } from '../utils/MapFloatingText';
import { strategicActorScale } from './strategicSpriteScale';
import { FAUNA_AREA_RATIO, WILD_LAND_PER_SQ_DEG } from '../world/environment/animalCatalog';

/**
 * 战略地图「海洋生物」层（2026-09-17 优化升级）：
 * 1. 视口海面自然生态：玩家在 zoom 8~10 浏览开阔海域时，偶发海豚跃水、鲸鱼喷水或海龟游弋；
 * 2. 海军跟拍互动：跟拍海上舰队时，优先在舰队周边海域生成伴航海洋生物；
 * 3. 彻底修复 Canvas 平移漂移与每帧误杀 Bug，绝对经纬度固定，持续 16~26 秒后平滑自然消失。
 */
const PANE = 'marineLifePane';
/**
 * 🔴 2026-10-31 主人令「注意陆海空动物数量的比例」：同屏海洋动物数 = 画面面积 × 水面比例 × 陆地基准密度 × 海/陆比
 *    （DE 236 张原图实测：海豚 / 鲸 / 海龟每万水面格 6.5 只，同面积约为陆地野生动物的 0.44 倍）。
 *    原来固定「最多 2 只、10 秒补 1 只」，全是海的画面也只有 2 只，远低于 DE。
 *    每只存活约 21 秒，补充间隔 = 21 秒 ÷ 目标数，才能维持到目标数。
 */
const CREATURE_LIFE_MS = 21_000;
const MIN_TRIGGER_INTERVAL_MS = 2_000;
const MAX_TRIGGER_INTERVAL_MS = 10_000;
const MAX_CREATURES_CAP = 10;          // 封顶防满屏（zoom 9 全海面约 6–8 只，海战 zoom 10 画面更小、更少）
const SEA_FRACTION_SAMPLE_MS = 1_500;  // 水面比例每 1.5 秒重算一次（4×4 采样）
const FPS = 15;
const MIN_ZOOM = 8;
const MAX_ZOOM = 10;

interface CreatureAsset {
    url: string;
    frames: number;
    cols: number;
    boxW: number;
    boxH: number;
    anchorX: number;
    anchorY: number;
}

type CreatureKind = 'DOLPHIN' | 'WHALE' | 'BOX_TURTLES' | 'NESSIE' | 'TUNA_FISH' | 'MARLIN_FISH';

/**
 * 🔴 2026-10-31 主人令「陆海空动物的显示比例统一，大小对齐 DE」：海洋生物原先是「固定屏幕像素」
 *   （海豚 104px、不随缩放），于是 zoom 9 时比黄牛大 3 倍、zoom 10 世界翻倍它却不变。
 *   现在与陆地动物同一 DE 基准：**素材原尺寸 × strategicSpriteScale**（zoom 9 基准 0.7 ×2^(zoom-9)），
 *   锚点同比例换算，鲸／海豚／海龟／鱼与陆地动物的相对大小回到 DE 原样。
 */
const ASSETS: Record<CreatureKind, CreatureAsset> = {
    // 硬编码来自 _meta.json（DE 水下潜游层 + 水上破水层 + 白色跃水浪花/涟漪合成，加载时再 fetch 覆盖一次）
    DOLPHIN:     { url: '/SUCAI_RESOURCE/DOLPHIN/frames.png',     frames: 104, cols: 26, boxW: 126, boxH: 102, anchorX: 96,  anchorY: 55 },
    WHALE:       { url: '/SUCAI_RESOURCE/WHALE/frames.png',       frames: 241, cols: 25, boxW: 212, boxH: 115, anchorX: 113, anchorY: 59 },
    BOX_TURTLES: { url: '/SUCAI_RESOURCE/BOX_TURTLES/frames.png', frames: 180, cols: 30, boxW: 76,  boxH: 41,  anchorX: 35,  anchorY: 17 },
    NESSIE:      { url: '/SUCAI_RESOURCE/NESSIE/frames.png',      frames: 180, cols: 30, boxW: 256, boxH: 222, anchorX: 98,  anchorY: 58 },
    // 跃水鱼（DE a_fish_tuna / a_fish_marlin1，单行横条 cols = frames）
    TUNA_FISH:   { url: '/SUCAI_RESOURCE/TUNA_FISH/frames.png',   frames: 91,  cols: 91, boxW: 96,  boxH: 92,  anchorX: 56,  anchorY: 84 },
    MARLIN_FISH: { url: '/SUCAI_RESOURCE/MARLIN_FISH/frames.png', frames: 61,  cols: 61, boxW: 80,  boxH: 120, anchorX: 24,  anchorY: 120 },
};

interface Creature {
    id: number;
    kind: CreatureKind;
    lat: number;
    lng: number;
    frame: number;
    spawnedAt: number;
    expiresAt: number;
    lastFrameAt: number;
}

/**
 * 🔴 [2026-10-13] 生成点必须「周围一圈大半也是海」（九点多数投票，半径 0.08° ≈ 9km），而不是单点判海：
 *   单点 isSeaAt（掩膜 AND 海拔<0）会把沙漠盆地/干涸湖床里零星的「掩膜水 + 低洼」像素当成海，海豚就生在沙地上。
 */
const MARINE_SPAWN_RADIUS_DEG = 0.08;

/**
 * 🔴 [2026-11-01 主人令「战略地图上，爱琴海是浅海区，还是深海区？这里有鲸鱼吗，如果没有的话，也不能有海怪。」]
 * 与 StrategicWaterMaterial.ts 的「离岸/离岛 26px（≈60~70km）以内压为浅海区（effD <= 0.50）」严格对齐：
 *   鲸鱼（WHALE）与海怪（NESSIE）只允许出现在真正的远岸深海区（水深 ≥ 200m，且周围 0.28°/0.55° 两圈八方无岛屿与浅滩）；
 *   爱琴海等群岛密布的浅海区（离岸/离岛均在 60km 内，战略图渲染为浅海浅蓝）无鲸鱼，也绝不刷海怪，统一换为海豚。
 */
const DEEP_SEA_RING_RADII_DEG = [0.28, 0.55] as const;
const DEEP_SEA_DIRS: ReadonlyArray< readonly [number, number]> = [
    [1, 0], [0.707, 0.707], [0, 1], [-0.707, 0.707],
    [-1, 0], [-0.707, -0.707], [0, -1], [0.707, -0.707],
];

export function canSpawnDeepSeaWhaleOrNessie(lat: number, lng: number): boolean {
    if (!isOpenOcean(lat, lng)) return false;
    const sampler = LandSeaSystem.getSampler();
    const centerElev = sampler.getElevationSync(lat, lng);
    if (centerElev === null || centerElev > -200) return false;
    const cosLat = Math.max(0.25, Math.cos(lat * Math.PI / 180));
    for (const r of DEEP_SEA_RING_RADII_DEG) {
        for (const [dy, dx] of DEEP_SEA_DIRS) {
            const la = lat + dy * r;
            const ln = lng + (dx * r) / cosLat;
            if (!LandSeaSystem.isSeaAt(L.latLng(la, ln))) return false;
            const e = sampler.getElevationSync(la, ln);
            if (e === null || e > -120) return false;
        }
    }
    return true;
}

/**
 * 🔴 [2026-10-13 主人令] 海洋生物（海豚/抹香鲸/海龟）只在大洋与边缘海生成：
 *    排除里海（Caspian Basin）、死海（Dead Sea）等海拔在 0 以下但与大洋不相通的内陆封闭咸水盆地。
 */
function isOpenOcean(lat: number, lng: number): boolean {
    // 里海盆地（36.5°N~47.5°N, 46.5°E~55.0°E）：内陆咸水湖，无鲸鱼/海豚/海龟
    if (lat >= 36.5 && lat <= 47.5 && lng >= 46.5 && lng <= 55.0) return false;
    // 死海（31.0°N~31.9°N, 35.2°E~35.7°E）：极咸内陆湖
    if (lat >= 31.0 && lat <= 31.9 && lng >= 35.2 && lng <= 35.7) return false;
    // 其余海拔在 0 以下、水体掩膜又是水、但不通大洋的内陆湖（同样会被 isSeaAt 误判成海）：
    if (lat >= 32.6 && lat <= 33.0 && lng >= 35.4 && lng <= 35.7) return false;       // 加利利海（−210m）
    if (lat >= 33.0 && lat <= 33.6 && lng >= -116.2 && lng <= -115.6) return false;   // 索尔顿湖（−70m，美国加州）
    if (lat >= 11.4 && lat <= 11.9 && lng >= 42.2 && lng <= 42.6) return false;       // 阿萨勒湖（−155m，吉布提）
    if (lat >= 18.3 && lat <= 18.7 && lng >= -71.9 && lng <= -71.4) return false;     // 恩里基略湖（−40m，多米尼加）
    return true;
}

export class MarineLifeLayer extends L.Layer {
    private map: L.Map | null = null;
    private canvas = document.createElement('canvas');
    private ctx = this.canvas.getContext('2d');
    private imgs = new Map<string, HTMLImageElement>();
    private ready = false;
    private lastTriggerAt = 0;
    private creatures: Creature[] = [];
    private nextCreatureId = 1;
    private rafId: number | null = null;

    constructor() {
        super();
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
    }

    public onAdd(map: L.Map): this {
        this.map = map;
        if (!map.getPane(PANE)) map.createPane(PANE);
        const pane = map.getPane(PANE)!;
        pane.style.zIndex = '578'; // 装饰层，低于 UNITS_LOW(580)
        pane.style.pointerEvents = 'none';
        pane.appendChild(this.canvas);

        this.resize();
        this.syncCanvas();
        void this.ensureAssets();

        this.map.on('move', this.syncCanvas);
        this.map.on('zoom', this.syncCanvas);
        this.map.on('resize', this.resize);
        this.rafId = requestAnimationFrame(this.tick);
        return this;
    }

    public onRemove(map: L.Map): this {
        this.map?.off('move', this.syncCanvas);
        this.map?.off('zoom', this.syncCanvas);
        this.map?.off('resize', this.resize);
        this.map = null;
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.canvas.remove();
        this.creatures = [];
        return this;
    }

    public setVisible(visible: boolean): void {
        this.canvas.style.display = visible ? 'block' : 'none';
        if (!visible) {
            this.creatures = [];
            if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    private resize = (): void => {
        if (!this.map) return;
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.canvas.style.width = size.x + 'px';
        this.canvas.style.height = size.y + 'px';
        this.syncCanvas();
    };

    private syncCanvas = (): void => {
        if (!this.map) return;
        const topLeft = this.map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);
    };

    private async ensureAssets(): Promise<void> {
        await Promise.all((Object.keys(ASSETS) as CreatureKind[]).map(async (kind) => {
            const a = ASSETS[kind];
            const im = new Image();
            await new Promise<void>((resolve) => {
                im.onload = () => resolve();
                im.onerror = () => resolve();
                im.src = a.url;
            });
            this.imgs.set(kind, im);
            try {
                const r = await fetch(a.url.replace('frames.png', '_meta.json'));
                if (r.ok) {
                    const m = await r.json();
                    if (m) {
                        a.frames = m.frames ?? a.frames;
                        a.cols = m.cols ?? a.cols;
                        a.boxW = m.box_w ?? a.boxW;
                        a.boxH = m.box_h ?? a.boxH;
                        a.anchorX = m.anchor_x ?? a.anchorX;
                        a.anchorY = m.anchor_y ?? a.anchorY;
                    }
                }
            } catch { /* 用硬编码兜底 */ }
        }));
        this.ready = true;
    }

    private tick = (now: number): void => {
        this.rafId = requestAnimationFrame(this.tick);
        if (!this.map || !this.ctx || !this.ready) return;
        const _t0 = performance.now();
        try {
            this.tickBody(now);
        } finally {
            perfDoctor.note('MarineLifeLayer.tick(海洋生物层)', performance.now() - _t0, 'src/map/MarineLifeLayer.ts:tick');
        }
    };

    private tickBody(now: number): void {
        if (!this.map || !this.ctx) return;
        const zoom = this.map.getZoom();
        if (zoom < MIN_ZOOM || zoom > MAX_ZOOM) {
            this.render(now);
            return;
        }

        // 清理过期生物
        if (this.creatures.length > 0) {
            // 🔴 [2026-10-13 主人报「沙地中出现海洋生物」] 存活期内点位若不再是海（或位于内陆盆地里海/死海）就立刻撤掉
            // 🔴 2026-10-31 主人令「在屏幕期间不要无缘无故消失」：海拔瓦片暂时不在缓存时 isSeaAt 按「陆」返回，
            //    原来会把正在跃水的海豚当场删掉（无渐隐）；现在只有海拔已知且确实不是海才撤，到期的走渲染里的 1.5 秒渐隐。
            this.creatures = this.creatures.filter(c => now <= c.expiresAt && isOpenOcean(c.lat, c.lng)
                && (LandSeaSystem.isSeaAt(L.latLng(c.lat, c.lng)) || LandSeaSystem.getSampler().getElevationSync(c.lat, c.lng) === null));
        }

        // 尝试生成新生物
        const target = this.targetCreatureCount(now);
        const interval = Math.min(MAX_TRIGGER_INTERVAL_MS, Math.max(MIN_TRIGGER_INTERVAL_MS, CREATURE_LIFE_MS / Math.max(1, target)));
        if (this.creatures.length < target && now - this.lastTriggerAt >= interval) {
            this.tryTrigger(now);
        }

        // 推进各生物动画帧
        const frameInterval = 1000 / FPS;
        for (const c of this.creatures) {
            if (now - c.lastFrameAt > frameInterval) {
                c.lastFrameAt = now;
                const a = ASSETS[c.kind];
                c.frame = (c.frame + 1) % a.frames;
            }
        }

        this.render(now);
    }

    private seaFraction = 0;
    private seaFractionAt = -Infinity;

    /** 同屏海洋动物目标数（开阔海面比例 × 画面面积 × 陆地基准密度 × 海/陆比） */
    private targetCreatureCount(now: number): number {
        if (!this.map) return 0;
        const b = this.map.getBounds();
        if (now - this.seaFractionAt >= SEA_FRACTION_SAMPLE_MS) {
            this.seaFractionAt = now;
            let sea = 0;
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    const lat = b.getSouth() + (i + 0.5) / 4 * (b.getNorth() - b.getSouth());
                    const lng = b.getWest() + (j + 0.5) / 4 * (b.getEast() - b.getWest());
                    if (isOpenOcean(lat, lng) && LandSeaSystem.isSeaAt(L.latLng(lat, lng))) sea++;
                }
            }
            this.seaFraction = sea / 16;
        }
        if (this.seaFraction <= 0) return 0;
        const area = Math.abs(b.getNorth() - b.getSouth()) * Math.abs(b.getEast() - b.getWest());
        const n = Math.round(area * this.seaFraction * WILD_LAND_PER_SQ_DEG * FAUNA_AREA_RATIO.sea);
        return Math.min(MAX_CREATURES_CAP, Math.max(1, n));
    }

    private tryTrigger(now: number): void {
        if (!this.map) return;
        this.lastTriggerAt = now;

        let spawnLat = 0;
        let spawnLng = 0;
        let found = false;

        // 优先 1：检查是否有正在跟拍且航行在大洋海面上的舰队
        const followedId = getFollowedArmyId();
        const game = (window as any).game as { legionManager?: { getLegionById(id: string): { getPosition(): { lat: number; lng: number } } | undefined } } | undefined;
        const army = followedId ? game?.legionManager?.getLegionById(followedId) : null;
        const armyPos = army?.getPosition();

        if (armyPos && Number.isFinite(armyPos.lat) && Number.isFinite(armyPos.lng) && isOpenOcean(armyPos.lat, armyPos.lng) && LandSeaSystem.isSeaAt(L.latLng(armyPos.lat, armyPos.lng))) {
            for (let i = 0; i < 12; i++) {
                const ang = Math.random() * Math.PI * 2;
                const d = 0.04 + Math.random() * 0.08;
                const tLat = armyPos.lat + Math.sin(ang) * d;
                const tLng = armyPos.lng + Math.cos(ang) * d;
                if (isOpenOcean(tLat, tLng) && LandSeaSystem.isSeaAtMajority(tLat, tLng, MARINE_SPAWN_RADIUS_DEG)) {
                    spawnLat = tLat;
                    spawnLng = tLng;
                    found = true;
                    break;
                }
            }
        }

        // 优先 2：视野内的大洋开阔海面自然撒点
        if (!found) {
            const bounds = this.map.getBounds();
            const minLat = bounds.getSouth();
            const maxLat = bounds.getNorth();
            const minLng = bounds.getWest();
            const maxLng = bounds.getEast();

            for (let i = 0; i < 16; i++) {
                const rLat = minLat + Math.random() * (maxLat - minLat);
                const rLng = minLng + Math.random() * (maxLng - minLng);
                if (isOpenOcean(rLat, rLng) && LandSeaSystem.isSeaAtMajority(rLat, rLng, MARINE_SPAWN_RADIUS_DEG)) {
                    spawnLat = rLat;
                    spawnLng = rLng;
                    found = true;
                    break;
                }
            }
        }

        if (!found) return;

        // 暖温海域（|lat| < 42°，如地中海、南洋、红海、波斯湾、加勒比、东海）支持海龟；全海域支持抹香鲸、尼斯湖水怪与海豚
        const isWarmSea = Math.abs(spawnLat) < 42;
        let kind: CreatureKind;
        const r = Math.random();
        if (isWarmSea) {
            if (r < 0.24) kind = 'WHALE';
            else if (r < 0.36) kind = 'NESSIE';
            else if (r < 0.60) kind = 'DOLPHIN';
            else if (r < 0.70) kind = 'MARLIN_FISH';   // 剑鱼：暖海
            else if (r < 0.80) kind = 'TUNA_FISH';
            else kind = 'BOX_TURTLES'; // 20% 概率出现海龟游弋
        } else {
            // 高纬寒温带海域（含北海/苏格兰外海等）：抹香鲸、尼斯湖水怪、海豚与金枪鱼
            if (r < 0.38) kind = 'WHALE';
            else if (r < 0.55) kind = 'NESSIE';
            else if (r < 0.80) kind = 'DOLPHIN';
            else kind = 'TUNA_FISH';
        }
        // 🔴 [2026-11-01 主人令] 鲸鱼与海怪只出现在远岸深海区（水深 ≥200m 且周围 ~60km 无岛屿/浅滩）；
        //    爱琴海等群岛浅海区无鲸鱼，也绝不出现海怪，统一换成海豚。
        if (kind === 'WHALE' || kind === 'NESSIE') {
            if (!canSpawnDeepSeaWhaleOrNessie(spawnLat, spawnLng)) kind = 'DOLPHIN';
        }

        this.creatures.push({
            id: this.nextCreatureId++,
            kind,
            lat: spawnLat,
            lng: spawnLng,
            frame: Math.floor(Math.random() * ASSETS[kind].frames),
            spawnedAt: now,
            expiresAt: now + 16000 + Math.random() * 10000,
            lastFrameAt: now,
        });
    }

    private render(now = performance.now()): void {
        if (!this.map || !this.ctx) return;
        const g = this.ctx;
        g.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.creatures.length === 0) return;

        const bounds = this.map.getBounds();
        // 🔴 [2026-11-02 主人令「既然陆地动物是0.6，那么所有陆地，空中，海洋动物都应该是0.6」]
        //    海洋生物与陆地动物、飞鸟完全统一使用 strategicActorScale（基准 0.60），随地图缩放
        const spriteScale = strategicActorScale(this.map.getZoom());
        for (const c of this.creatures) {
            // 视口粗筛（留 0.1° 边距防边缘截断）
            if (c.lat < bounds.getSouth() - 0.1 || c.lat > bounds.getNorth() + 0.1 ||
                c.lng < bounds.getWest() - 0.1 || c.lng > bounds.getEast() + 0.1) {
                continue;
            }

            const a = ASSETS[c.kind];
            const img = this.imgs.get(c.kind);
            if (!img) continue;

            const p = this.map.latLngToContainerPoint(L.latLng(c.lat, c.lng));
            const w = a.boxW * spriteScale;
            const h = a.boxH * spriteScale;
            const cols = a.cols || Math.max(1, Math.round(img.naturalWidth / a.boxW));
            const sx = (c.frame % cols) * a.boxW;
            const sy = Math.floor(c.frame / cols) * a.boxH;
            const ax = (a.anchorX / a.boxW) * w;
            const ay = (a.anchorY / a.boxH) * h;

            // 生成与消失平滑淡入淡出
            const fadeIn = Math.min(1, Math.max(0, (now - c.spawnedAt) / 1200));
            const fadeOut = Math.min(1, Math.max(0, (c.expiresAt - now) / 1500));
            g.save();
            g.globalAlpha = fadeIn * fadeOut;
            g.drawImage(img, sx, sy, a.boxW, a.boxH, p.x - ax, p.y - ay, w, h);
            g.restore();
        }
    }
}

let marineSingleton: MarineLifeLayer | null = null;

export function registerMarineLifeLayer(layer: MarineLifeLayer): void {
    marineSingleton = layer;
}

export function setMarineAnimalVisible(nextVisible: boolean): void {
    marineSingleton?.setVisible(nextVisible);
}
