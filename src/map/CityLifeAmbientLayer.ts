import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import type { GameMap } from './GameMap';
import { CITIES_V2, type CityDataV2, type CityBuildingStyle } from '../data/cities_v2';
import { LandSeaSystem } from '../world/land-sea';

/**
 * CityLifeAmbientLayer — 战略地图「67 文化据点民生生态」环境层（2026-10-26 主人定稿）。
 *
 * 功能特性：
 *   1. 覆盖全部 67 个文化（农耕稻作、农耕旱作、草原游牧、丝路绿洲驼牧、高原畜牧、山林渔猎、海洋水网渔业、矿冶采集）。
 *   2. 对应四季（春耕播种 seed、夏耘锄地 work、秋收挎篮归仓 carry、冬藏休耕/冬猎渐隐渐显）。
 *   3. 战斗渐隐：据点被围攻或周围半径 0.85° 内有军团交战时，周围农民与畜群在 1.0 秒内平滑淡出（避兵入城）；
 *      战火平息后 1.8 秒内平滑渐显恢复生机。
 *   4. 独立 Canvas + Leaflet pane (zIndex 568，低于军团与据点) + LRU 字节预算缓存。
 */

type Pt = { lat: number; lng: number };

interface SpriteSheetAsset {
    key: string;
    basePath: string;
    action: string;
    frames: number;
    dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }>;
    sheets: (HTMLImageElement | null)[];
    ready: boolean;
    lastUsed: number;
}

type LivelihoodCategory =
    | 'farming_rice'
    | 'farming_dry'
    | 'nomadic_steppe'
    | 'nomadic_oasis'
    | 'highland_pastoral'
    | 'forest_hunting'
    | 'maritime_fishing'
    | 'mining_foraging';

interface LivelihoodSpec {
    category: LivelihoodCategory;
    villagers: string[];       // SUCAI 下的目录名
    animals: string[];         // SUCAI_ANIMAL 下的目录名
    winterRestAboveLat: number; // 高于此纬度的据点在冬季部分/全部休耕渐隐（90 表示冬季不休）
}

interface CityLifeActor {
    id: string;
    cityId: string;
    cityPos: Pt;
    isAnimal: boolean;
    lib: 'SUCAI' | 'SUCAI_ANIMAL';
    dir: string;
    homePos: Pt;               // 田间/牧场/林间劳作点
    gatePos: Pt;               // 靠近据点城门的交接点（秋收搬运往返用）
    facing: number;            // 0..7
    phase: number;
    slotIdx: number;           // 0..N-1（决定冬季谁留守、谁归家）
    winterActive: boolean;     // 冬季是否仍出勤
    alpha: number;             // 当前实际透明度 0..1
    actionAlpha: number;       // 换季动作切换淡入淡出系数
    displayedAction: string;   // 当前正在画的动作名
    desiredAction: string;     // 当前季节对应的目标动作名
}

const MIN_ZOOM = 9;
const MAX_ZOOM = 10;
const PANE_ZINDEX = 568;       // 高于陆地动物(560)/植被(565)，低于商队(570)/攻城底层军团(580)/据点(610)/主军团(620)
const VILLAGER_SCALE_BASE = 0.42;
const ANIMAL_SCALE_BASE = 0.48;
const CULL_MARGIN_DEG = 0.5;
const COMBAT_HIDE_RADIUS_DEG = 0.85;
const FADE_OUT_COMBAT_SEC = 1.0;
const FADE_IN_PEACE_SEC = 1.8;
const FADE_SEASON_SEC = 1.4;

/** 67 文化 → 生计配置表 */
const LIVELIHOOD_SPECS: Record<LivelihoodCategory, LivelihoodSpec> = {
    farming_rice: {
        category: 'farming_rice',
        villagers: ['VIL_MALE_FARMER', 'VIL_FEMALE_FARMER', 'VIL_MALE_FISHERMAN'],
        animals: ['BUFFALO', 'GOOSE', 'CHICKEN'],
        winterRestAboveLat: 29,
    },
    farming_dry: {
        category: 'farming_dry',
        villagers: ['VIL_MALE_FARMER', 'VIL_FEMALE_FARMER', 'VIL_MALE_LUMBERJACK'],
        animals: ['COW_BROWN', 'SHEEP', 'PIG'],
        winterRestAboveLat: 27,
    },
    nomadic_steppe: {
        category: 'nomadic_steppe',
        villagers: ['VIL_MALE_SHEPHERD', 'VIL_MALE_HUNTER'],
        animals: ['HORSE', 'SHEEP', 'GOAT'],
        winterRestAboveLat: 36,
    },
    nomadic_oasis: {
        category: 'nomadic_oasis',
        villagers: ['VIL_MALE_SHEPHERD', 'VIL_MALE_FORAGER', 'VIL_MALE_FARMER'],
        animals: ['CAMEL', 'DROMEDARY', 'GOAT', 'HORSE'],
        winterRestAboveLat: 35,
    },
    highland_pastoral: {
        category: 'highland_pastoral',
        villagers: ['VIL_MALE_SHEPHERD', 'VIL_FEMALE_FARMER'],
        animals: ['COW_BLACK', 'LLAMA', 'ALPACA', 'SHEEP'],
        winterRestAboveLat: 32,
    },
    forest_hunting: {
        category: 'forest_hunting',
        villagers: ['VIL_MALE_HUNTER', 'VIL_MALE_LUMBERJACK', 'VIL_MALE_FORAGER'],
        animals: ['DEER', 'BOAR', 'TURKEY', 'GUANACO'],
        winterRestAboveLat: 90, // 渔猎民族支持冬猎踏雪
    },
    maritime_fishing: {
        category: 'maritime_fishing',
        villagers: ['VIL_MALE_FISHERMAN', 'VIL_FEMALE_FARMER', 'VIL_MALE_LUMBERJACK'],
        animals: ['CHICKEN', 'GOAT'],
        winterRestAboveLat: 45,
    },
    mining_foraging: {
        category: 'mining_foraging',
        villagers: ['VIL_MALE_MINER', 'VIL_MALE_FORAGER', 'VIL_MALE_FARMER'],
        animals: ['GOAT', 'COW_BROWN'],
        winterRestAboveLat: 42,
    },
};

const CULTURE_TO_CATEGORY: Record<CityBuildingStyle, LivelihoodCategory> = {
    // 1. 农耕稻作与水网（8）
    JIANGNAN: 'farming_rice',
    HUGUANG: 'farming_rice',
    VIETNAMESE: 'farming_rice',
    BENGALIS: 'farming_rice',
    BURMESE: 'farming_rice',
    KHMER: 'farming_rice',
    PURU: 'farming_rice',
    INDIA: 'farming_rice',

    // 2. 农耕旱作与庄园（24）
    CENTRAL: 'farming_dry',
    WEI: 'farming_dry',
    BASHU: 'farming_dry',
    KOREA: 'farming_dry',
    FRANKS: 'farming_dry',
    BURGUNDIANS: 'farming_dry',
    BRITONS: 'farming_dry',
    SAXONS: 'farming_dry',
    GERMANIC: 'farming_dry',
    POLES: 'farming_dry',
    LITHUANIANS: 'farming_dry',
    SLAVIC: 'farming_dry',
    BULGARIANS: 'farming_dry',
    MAGYAR: 'farming_dry',
    LATIN: 'farming_dry',
    SICILIANS: 'farming_dry',
    SPANISH: 'farming_dry',
    ROMA: 'farming_dry',
    BYZANTINE: 'farming_dry',
    GREECE: 'farming_dry',
    ATHENIANS: 'farming_dry',
    SPARTANS: 'farming_dry',
    MACEDONIAN: 'farming_dry',
    MUGHAL: 'farming_dry',

    // 3. 草原游牧（7）
    MONGOL: 'nomadic_steppe',
    XIANBEI: 'nomadic_steppe',
    HUNS: 'nomadic_steppe',
    CUMAN: 'nomadic_steppe',
    TURKS: 'nomadic_steppe',
    GOTHS: 'nomadic_steppe',
    THRACIAN: 'nomadic_steppe',

    // 4. 丝路绿洲与荒原驼牧（7）
    KHITAN: 'nomadic_oasis',
    CENTRAL_ASIA: 'nomadic_oasis',
    WESTERN: 'nomadic_oasis',
    PERSIAN: 'nomadic_oasis',
    SASANIAN: 'nomadic_oasis',
    ORIE: 'nomadic_oasis',
    BERBER: 'nomadic_oasis',

    // 5. 雪域高原与安第斯农牧（2）
    TIBET: 'highland_pastoral',
    INCA: 'highland_pastoral',

    // 6. 山林渔猎与寒带林海（8）
    NORTHEAST: 'forest_hunting',
    VARANGIANS: 'forest_hunting',
    DIANQIAN: 'forest_hunting',
    MAPUCHE: 'forest_hunting',
    TUPI: 'forest_hunting',
    AMERICA: 'forest_hunting',
    MAYANS: 'forest_hunting',
    GEORGIANS: 'forest_hunting',

    // 7. 海洋渔业与峡湾群岛（5）
    JAPAN: 'maritime_fishing',
    MALAY: 'maritime_fishing',
    VIKINGS: 'maritime_fishing',
    DANES: 'maritime_fishing',
    PORTUGUESE: 'maritime_fishing',

    // 8. 山地矿冶与热带采金（6）
    BOHEMIANS: 'mining_foraging',
    ARMENIANS: 'mining_foraging',
    MUISCA: 'mining_foraging',
    AFRICA: 'mining_foraging',
    ETHIOPIANS: 'mining_foraging',
    GURJARAS: 'nomadic_oasis',
};

function strHash01(s: string, salt: number): number {
    let h = (salt * 2654435761) | 0;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 1597334677);
    }
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

function dirFromDelta(dLat: number, dLng: number): number {
    // 8 方向索引（0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE）
    const deg = ((Math.atan2(dLat, dLng) * 180) / Math.PI + 360) % 360;
    // deg: 0=E(6), 90=N(4), 180=W(2), 270=S(0)
    const idx = Math.round(((270 - deg + 360) % 360) / 45) % 8;
    return idx;
}

export class CityLifeAmbientLayer {
    private map: L.Map;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private running = false;
    private lastTime = 0;
    private nowMs = 0;
    private assets = new Map<string, SpriteSheetAsset>();
    private actorsByCity = new Map<string, CityLifeActor[]>();
    private activeActors = new Map<string, CityLifeActor>();
    private endangeredCities = new Set<string>();
    private lastCombatScanMs = 0;
    private clearedWhileHidden = false;
    private layerVisible = true;

    private static readonly ASSET_BUDGET_BYTES = 64 * 1024 * 1024;

    constructor(map: L.Map) {
        this.map = map;
        let pane = map.getPane('cityLifePane');
        if (!pane) {
            pane = map.createPane('cityLifePane');
            pane.style.zIndex = String(PANE_ZINDEX);
            pane.style.pointerEvents = 'none';
        }
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'leaflet-zoom-animated';
        this.canvas.style.pointerEvents = 'none';
        pane.appendChild(this.canvas);
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('CityLifeAmbientLayer: 2d context unavailable');
        this.ctx = ctx;

        this.resize();
        map.on('resize', () => this.resize());
        map.on('move zoom viewreset moveend zoomend', () => this.reposition());
    }

    private resize(): void {
        const s = this.map.getSize();
        this.canvas.width = s.x;
        this.canvas.height = s.y;
        this.reposition();
    }

    private reposition(): void {
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

    public setVisible(v: boolean): void {
        this.layerVisible = v;
        this.canvas.style.display = v ? 'block' : 'none';
    }

    public debugAssetCount(): number {
        return this.assets.size;
    }

    public debugAssetBytes(): number {
        let b = 0;
        for (const a of this.assets.values()) {
            for (const im of a.sheets) {
                if (im) b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            }
        }
        return b;
    }

    private getSeason(): number {
        const s = (window as any).game?.timeSystem?.getSeason?.();
        return typeof s === 'number' && s >= 0 && s <= 3 ? s : 0;
    }

    private isHiddenNow(): boolean {
        if (!this.layerVisible) return true;
        if ((window as any).game?.scene13War?.isActive?.() === true) return true;
        if ((window as any).game?.battleScene?.isLingering?.() === true) return true;
        const s = this.map.getSize();
        if (s.x === 0 || s.y === 0) return true;
        const z = Math.round(this.map.getZoom());
        return z < MIN_ZOOM || z > MAX_ZOOM;
    }

    private isSea(pos: Pt): boolean {
        try {
            return LandSeaSystem.isSeaAt(pos);
        } catch {
            return false;
        }
    }

    /** 根据据点生成确定性的民生角色列表（每个据点 3~5 个） */
    private getOrCreateCityActors(city: CityDataV2): CityLifeActor[] {
        let list = this.actorsByCity.get(city.id);
        if (list) return list;
        list = [];

        const style: CityBuildingStyle = city.buildingStyle ?? 'CENTRAL';
        const cat = CULTURE_TO_CATEGORY[style] ?? 'farming_dry';
        const spec = LIVELIHOOD_SPECS[cat];

        const isPass = city.type === 'Pass';
        const totalSlots = isPass ? 2 : city.type === 'huge_city' ? 5 : city.type === 'large_city' ? 4 : 3;

        // 特定文化微调动物池（如青藏只用牛羊不用羊驼，印加只用羊驼，河西/西域用双峰驼，阿拉伯/柏柏尔用单峰驼）
        let animalPool = spec.animals;
        if (style === 'TIBET') animalPool = ['COW_BLACK', 'SHEEP', 'ARGALI'];
        else if (style === 'INCA') animalPool = ['LLAMA', 'ALPACA'];
        else if (style === 'KHITAN' || style === 'WESTERN' || style === 'CENTRAL_ASIA') animalPool = ['CAMEL', 'HORSE', 'SHEEP'];
        else if (style === 'ORIE' || style === 'BERBER') animalPool = ['DROMEDARY', 'GOAT', 'HORSE'];
        else if (style === 'MAPUCHE') animalPool = ['GUANACO', 'HORSE'];
        else if (style === 'AMERICA' || style === 'MAYANS' || style === 'TUPI') animalPool = ['TURKEY', 'DEER'];

        const cLat = city.lat;
        const cLng = city.lng;
        const isColdWinter = Math.abs(cLat) >= spec.winterRestAboveLat;

        for (let i = 0; i < totalSlots; i++) {
            const h1 = strHash01(city.id, i * 17 + 1);
            const h2 = strHash01(city.id, i * 17 + 2);
            const h3 = strHash01(city.id, i * 17 + 3);
            const h4 = strHash01(city.id, i * 17 + 4);

            // 前面槽位放村民，后面 1~2 个槽位放伴生家畜/猎物（游牧民族家畜比例更高）
            const animalRatio = (cat === 'nomadic_steppe' || cat === 'nomadic_oasis' || cat === 'highland_pastoral') ? 0.55 : 0.34;
            const isAnimal = !isPass && i >= 1 && h1 < animalRatio && animalPool.length > 0;

            const dir = isAnimal
                ? animalPool[Math.floor(h2 * animalPool.length) % animalPool.length]
                : spec.villagers[Math.floor(h2 * spec.villagers.length) % spec.villagers.length];

            // 环绕据点在 0.13° ~ 0.25° 半径内寻找陆地落点（渔夫可贴水岸）
            const baseAngle = (i / totalSlots) * Math.PI * 2 + (h3 - 0.5) * 0.7;
            const distDeg = 0.14 + h4 * 0.11;
            let homePos: Pt | null = null;
            for (let attempt = 0; attempt < 8; attempt++) {
                const ang = baseAngle + attempt * (Math.PI / 4);
                const cand = {
                    lat: cLat + Math.sin(ang) * distDeg * 0.85,
                    lng: cLng + Math.cos(ang) * distDeg,
                };
                if (!this.isSea(cand)) {
                    homePos = cand;
                    break;
                }
            }
            if (!homePos) continue;

            const gatePos = {
                lat: cLat + (homePos.lat - cLat) * 0.38,
                lng: cLng + (homePos.lng - cLng) * 0.38,
            };

            const facing = Math.floor(strHash01(city.id, i * 17 + 5) * 8) % 8;
            const phase = Math.floor(strHash01(city.id, i * 17 + 6) * 1000);

            // 冬季是否出勤：高纬农耕冬季仅留 1 人（樵夫/巡守），其余归家休耕；渔猎冬季不休
            const winterActive = !isColdWinter || dir === 'VIL_MALE_LUMBERJACK' || dir === 'VIL_MALE_HUNTER' || i === 0;

            list.push({
                id: `${city.id}_life_${i}`,
                cityId: city.id,
                cityPos: { lat: cLat, lng: cLng },
                isAnimal,
                lib: isAnimal ? 'SUCAI_ANIMAL' : 'SUCAI',
                dir,
                homePos,
                gatePos,
                facing,
                phase,
                slotIdx: i,
                winterActive,
                alpha: 0,
                actionAlpha: 1,
                displayedAction: isAnimal ? 'idle' : 'work',
                desiredAction: isAnimal ? 'idle' : 'work',
            });
        }

        this.actorsByCity.set(city.id, list);
        return list;
    }

    /** 计算某个角色在当前季节应当执行的动作名 */
    private resolveSeasonalAction(actor: CityLifeActor, season: number): string {
        if (actor.isAnimal) {
            // 家畜：春夏季吃草与慢走交替，秋冬季安静吃草
            if (season === 1 && actor.slotIdx % 2 === 1) return 'walk';
            return 'idle';
        }
        const isFarmer = actor.dir === 'VIL_MALE_FARMER' || actor.dir === 'VIL_FEMALE_FARMER';
        if (season === 0) {
            // 春：农夫春耕播种（seed 与 work 交织），其余工种开始劳作
            if (isFarmer) return actor.slotIdx % 2 === 0 ? 'seed' : 'work';
            return 'work';
        }
        if (season === 1) {
            // 夏：全力劳作（锄地/放牧/捕鱼/采矿/狩猎）
            return 'work';
        }
        if (season === 2) {
            // 秋：秋收归仓（挎篮/扛物往返据点 carry，部分继续收割 work）
            return actor.slotIdx % 3 === 2 ? 'work' : 'carry';
        }
        // 冬：北地冬藏休整（留守者巡视 move/idle，樵夫/猎人继续冬猎伐木 work）
        if (actor.dir === 'VIL_MALE_LUMBERJACK' || actor.dir === 'VIL_MALE_HUNTER') {
            return 'work';
        }
        return actor.slotIdx % 2 === 0 ? 'idle' : 'move';
    }

    /** 扫描当前处于战斗波及中的据点集合（攻城战或周围 0.85° 有交战军团） */
    private scanEndangeredCities(nowMs: number, visibleCities: CityDataV2[]): void {
        if (nowMs - this.lastCombatScanMs < 250) return;
        this.lastCombatScanMs = nowMs;
        this.endangeredCities.clear();

        const game = (window as any).game;
        if (!game) return;

        const armies: any[] = game.legionManager?.getArmies?.() ?? [];
        const combatPositions: Pt[] = [];

        for (const a of armies) {
            if (!a || a.isDestroyed) continue;
            if (a.siegeTargetCityId) {
                this.endangeredCities.add(a.siegeTargetCityId);
            }
            const inFight = a.isAttacking || a.isBattling || a.inCombat || a.state === 'COMBAT' || a.state === 'SIEGE';
            if (inFight && typeof a.getPosition === 'function') {
                const pos = a.getPosition();
                if (pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lng)) {
                    combatPositions.push(pos);
                }
            }
        }

        if (combatPositions.length > 0) {
            const r2 = COMBAT_HIDE_RADIUS_DEG * COMBAT_HIDE_RADIUS_DEG;
            for (const c of visibleCities) {
                if (this.endangeredCities.has(c.id)) continue;
                for (const cp of combatPositions) {
                    const dLat = c.lat - cp.lat;
                    const dLng = c.lng - cp.lng;
                    if (dLat * dLat + dLng * dLng <= r2) {
                        this.endangeredCities.add(c.id);
                        break;
                    }
                }
            }
        }
    }

    private loadAsset(lib: 'SUCAI' | 'SUCAI_ANIMAL', dir: string, action: string): void {
        const key = `${lib}/${dir}:${action}`;
        if (this.assets.has(key)) return;
        const basePath = `/${lib}/${dir}`;
        const asset: SpriteSheetAsset = {
            key,
            basePath,
            action,
            frames: 1,
            dirs: {},
            sheets: [],
            ready: false,
            lastUsed: performance.now(),
        };
        this.assets.set(key, asset);

        fetch(`${basePath}/_meta.json`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`meta ${r.status}`))))
            .then((meta) => {
                const act = meta[action] ? action : meta['work'] ? 'work' : meta['move'] ? 'move' : meta['walk'] ? 'walk' : 'idle';
                const actBlock = meta[act];
                if (!actBlock) return;
                asset.frames = actBlock.frames ?? 1;
                asset.dirs = actBlock.dirs ?? {};
                asset.sheets = new Array(8).fill(null);
                let loaded = 0;
                for (let d = 0; d < 8; d++) {
                    const img = new Image();
                    img.onload = () => { loaded++; if (loaded === 8) asset.ready = true; };
                    img.onerror = () => { loaded++; if (loaded === 8) asset.ready = true; };
                    img.src = `${basePath}/${act}_${d}.png`;
                    asset.sheets[d] = img;
                }
            })
            .catch(() => {});
    }

    private assetFor(lib: 'SUCAI' | 'SUCAI_ANIMAL', dir: string, action: string): SpriteSheetAsset | undefined {
        const key = `${lib}/${dir}:${action}`;
        let a = this.assets.get(key);
        if (!a) {
            this.loadAsset(lib, dir, action);
            return undefined;
        }
        a.lastUsed = performance.now();
        return a.ready ? a : undefined;
    }

    private evictAssets(): void {
        let bytes = this.debugAssetBytes();
        if (bytes <= CityLifeAmbientLayer.ASSET_BUDGET_BYTES) return;
        const inUse = new Set<string>();
        for (const a of this.activeActors.values()) {
            inUse.add(`${a.lib}/${a.dir}:${a.displayedAction}`);
            inUse.add(`${a.lib}/${a.dir}:${a.desiredAction}`);
        }
        const cands = [...this.assets.entries()]
            .filter(([k]) => !inUse.has(k))
            .sort((x, y) => x[1].lastUsed - y[1].lastUsed);
        for (const [k, a] of cands) {
            if (bytes <= CityLifeAmbientLayer.ASSET_BUDGET_BYTES) break;
            for (const im of a.sheets) {
                if (im) bytes -= (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            }
            this.assets.delete(k);
        }
    }

    private update(dt: number): void {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const minLat = sw.lat - CULL_MARGIN_DEG;
        const maxLat = ne.lat + CULL_MARGIN_DEG;
        const minLng = sw.lng - CULL_MARGIN_DEG;
        const maxLng = ne.lng + CULL_MARGIN_DEG;

        const visibleCities: CityDataV2[] = [];
        for (const c of CITIES_V2) {
            if (c.lat >= minLat && c.lat <= maxLat && c.lng >= minLng && c.lng <= maxLng) {
                visibleCities.push(c);
            }
        }

        this.scanEndangeredCities(this.nowMs, visibleCities);
        const season = this.getSeason();
        const inViewActorIds = new Set<string>();

        for (const city of visibleCities) {
            const actors = this.getOrCreateCityActors(city);
            for (const actor of actors) {
                inViewActorIds.add(actor.id);
                if (!this.activeActors.has(actor.id)) {
                    this.activeActors.set(actor.id, actor);
                }
                actor.desiredAction = this.resolveSeasonalAction(actor, season);
                this.loadAsset(actor.lib, actor.dir, actor.desiredAction);
            }
        }

        for (const [id, actor] of this.activeActors.entries()) {
            const inView = inViewActorIds.has(id);
            const inCombat = this.endangeredCities.has(actor.cityId);
            const winterSleep = season === 3 && !actor.winterActive;

            const shouldShow = inView && !inCombat && !winterSleep;
            if (shouldShow) {
                actor.alpha = Math.min(1, actor.alpha + dt / FADE_IN_PEACE_SEC);
            } else {
                const fadeSec = inCombat ? FADE_OUT_COMBAT_SEC : FADE_SEASON_SEC;
                actor.alpha = Math.max(0, actor.alpha - dt / fadeSec);
                if (actor.alpha <= 0 && !inView) {
                    this.activeActors.delete(id);
                    continue;
                }
            }

            // 换季动作渐隐渐显平滑切换
            if (actor.displayedAction !== actor.desiredAction) {
                actor.actionAlpha = Math.max(0, actor.actionAlpha - dt / (FADE_SEASON_SEC * 0.5));
                if (actor.actionAlpha <= 0) {
                    actor.displayedAction = actor.desiredAction;
                }
            } else if (actor.actionAlpha < 1) {
                actor.actionAlpha = Math.min(1, actor.actionAlpha + dt / (FADE_SEASON_SEC * 0.5));
            }
        }
    }

    private draw(): void {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const zoom = this.map.getZoom();
        const zoomFactor = Math.pow(2, zoom - 9);
        const m = 48;
        const tSec = this.nowMs / 1000;

        // 按纬度从北到南排序，保证正确的 2.5D 前后遮挡
        const list = [...this.activeActors.values()].filter((a) => a.alpha > 0.01);
        list.sort((a, b) => b.homePos.lat - a.homePos.lat);

        for (const actor of list) {
            const finalAlpha = actor.alpha * actor.actionAlpha;
            if (finalAlpha <= 0.01) continue;

            const act = actor.displayedAction;
            const asset = this.assetFor(actor.lib, actor.dir, act);
            if (!asset) continue;

            // 计算实时位置与朝向：
            //   · carry（秋收归仓）或 move：在田间 homePos 与城门 gatePos 之间往返走动
            //   · walk（夏季牧群漫步）：围绕 homePos 小幅游走
            //   · work / seed / idle：在 homePos 原地劳作（每隔几秒轻微转身）
            let drawLat = actor.homePos.lat;
            let drawLng = actor.homePos.lng;
            let facing = actor.facing;

            if (act === 'carry' || act === 'move') {
                const cycle = (tSec * 0.14 + (actor.phase % 100) / 100) % 2;
                const u = cycle <= 1 ? cycle : 2 - cycle; // 0->1->0 往返
                drawLat = actor.homePos.lat + (actor.gatePos.lat - actor.homePos.lat) * u;
                drawLng = actor.homePos.lng + (actor.gatePos.lng - actor.homePos.lng) * u;
                const dLat = cycle <= 1
                    ? actor.gatePos.lat - actor.homePos.lat
                    : actor.homePos.lat - actor.gatePos.lat;
                const dLng = cycle <= 1
                    ? actor.gatePos.lng - actor.homePos.lng
                    : actor.homePos.lng - actor.gatePos.lng;
                facing = dirFromDelta(dLat, dLng);
            } else if (act === 'walk') {
                const ang = tSec * 0.45 + actor.phase;
                drawLat = actor.homePos.lat + Math.sin(ang) * 0.018;
                drawLng = actor.homePos.lng + Math.cos(ang) * 0.022;
                facing = dirFromDelta(Math.cos(ang) * 0.018, -Math.sin(ang) * 0.022);
            } else {
                // 原地耕作/播种/捕鱼/放牧：每 8 秒轻微换个朝向角度，更显自然生动
                const turnOffset = Math.floor((tSec + actor.phase) / 8) % 2;
                facing = (actor.facing + turnOffset) % 8;
            }

            const pt = this.map.latLngToContainerPoint([drawLat, drawLng]);
            if (pt.x < -m || pt.x > this.canvas.width + m || pt.y < -m || pt.y > this.canvas.height + m) continue;

            const box = asset.dirs[String(facing)];
            if (!box) continue;
            const sheet = asset.sheets[facing];
            if (!sheet || !sheet.complete || !sheet.naturalWidth) continue;

            const fps = act === 'idle' ? 10 : 14;
            const frame = Math.floor(tSec * fps + actor.phase) % Math.max(1, asset.frames);
            const scale = (actor.isAnimal ? ANIMAL_SCALE_BASE : VILLAGER_SCALE_BASE) * zoomFactor;

            const fw = box.fw;
            const fh = box.fh;
            const hx = box.hx;
            const hy = box.hy;
            const dx = pt.x - hx * scale;
            const dy = pt.y - hy * scale;

            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, finalAlpha));
            ctx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
            ctx.restore();
        }
    }

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

        const t0 = performance.now();
        this.update(dt);
        this.evictAssets();
        this.draw();
        perfDoctor.note('CityLifeAmbientLayer.tick(据点民生层)', performance.now() - t0, 'src/map/CityLifeAmbientLayer.ts:tick');
        requestAnimationFrame(this.tick.bind(this));
    }
}

let singleton: CityLifeAmbientLayer | null = null;
let visible = true;

export function initializeCityLifeAmbientLayer(gameMap: GameMap): CityLifeAmbientLayer {
    if (singleton) return singleton;
    singleton = new CityLifeAmbientLayer(gameMap.getLeafletMap());
    if (import.meta.env.DEV) {
        perfDoctor.registerCache({
            name: 'CityLifeAmbientLayer:assets(据点民生素材)',
            where: 'src/map/CityLifeAmbientLayer.ts:ASSET_BUDGET_BYTES',
            entries: () => singleton!.debugAssetCount(),
            bytes: () => singleton!.debugAssetBytes(),
            limitKind: 'bytes',
            limitValue: 64 * 1024 * 1024,
        });
    }
    singleton.setVisible(visible);
    return singleton;
}

export function getCityLifeAmbientLayer(): CityLifeAmbientLayer | null {
    return singleton;
}

export function setCityLifeAmbientLayerVisible(nextVisible: boolean): void {
    visible = nextVisible;
    singleton?.setVisible(nextVisible);
}
