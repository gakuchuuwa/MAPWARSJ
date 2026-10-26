import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import type { GameMap } from './GameMap';
import { CITIES_V2, type CityDataV2, type BuildingStyle } from '../data/cities_v2';
import { LandSeaSystem } from '../world/land-sea';
import { TREE_METAS } from './VegetationLayer';

/**
 * CityLifeAmbientLayer — 战略地图「67 文化据点民生生态 & 战火破坏/尸骸渐变」环境层（2026-10-26 主人定稿）。
 *
 * 功能特性：
 *   1. 覆盖全部 67 个文化（农耕稻作、农耕旱作、草原游牧、丝路绿洲驼牧、高原畜牧、山林渔猎、海洋水网渔业、矿冶采集）。
 *   2. 渔猎民族据点周围强制覆盖四季树林与灌丛浆果植被（猎人、樵夫、采集者与林间鹿/野猪在树林灌丛间劳作；
 *      战时树林渐变为倒伏断木 FELLED_GENERIC、树桩 STUMP_GENERIC 与焦枯死树 DEAD_TREE）。
 *   3. 渔业严格在海中（绝不在陆地放渔夫）：在沿海海域生成 DE 渔船（SHP_FISHING_SHIP 撒网/往返航行）与海鱼群
 *      （DORADO_FISH / SALMON_FISH / TUNA_FISH / SHORE_FISH 跃水游弋）；战时渐变为沉没破损渔船（SHP_FISHING_SHIP:sink + SHIP_SINK_SMALL）。
 *   4. 对应四季（春耕播种 seed、夏耘锄地/撒网 work、秋收归仓/渔船返港 carry/move、冬藏休耕/冬猎渐隐渐显）。
 *   5. 战火破坏与尸骸渐变：据点被围攻或周围半径 0.85° 内有军团交战时，通过 damageBlend (0 → 1) 平滑渐变为
 *      被破坏的农车/栅栏/断木废墟、倒地平民尸体、平民白骨、战死牲畜与沉没渔船；战后余波结束后平滑恢复。
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

interface StripStaticAsset {
    key: string;
    frames: number;
    boxW: number;
    boxH: number;
    anchorX: number;
    anchorY: number;
    sheet: HTMLImageElement | null;
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
    villagers: string[];       // SUCAI 下的目录名（仅陆地工种，渔业统一走海上渔船）
    animals: string[];         // SUCAI_ANIMAL 下的目录名
    winterRestAboveLat: number; // 高于此纬度的据点在冬季部分/全部休耕渐隐（90 表示冬季不休）
}

type WarDamagePreset =
    | 'corpse_and_fence'       // 倒地平民尸体 + 被毁木栅栏残骸
    | 'broken_cart_and_bones'  // 倾覆破损农车/辎重车 + 荷锄平民骸骨
    | 'rubble_and_corpse'      // 焦木石块废墟 + 倒地平民尸体
    | 'animal_loss'            // 牲畜白骨 + 破损牧场围栏
    | 'sea_shipwreck';         // 海上渔船被毁沉没 + 残骸水花

/** 渔猎民族据点周围伴生树林与灌丛植被节点 */
interface CityForestProp {
    id: string;
    cityId: string;
    pos: Pt;
    springTree: string;
    summerTree: string;
    autumnTree: string;
    winterTree: string;
    bushName: string;          // 伴生林下灌木/浆果丛（FORAGE_BUSH / UNDERBRUSH / BUSH_TREE_A）
    bushLib: 'SUCAI_NATURE' | 'SUCAI_RESOURCE';
    isBamboo: boolean;
    variant: number;
    scaleJitter: number;
}

interface CityLifeActor {
    id: string;
    cityId: string;
    cityPos: Pt;
    isAnimal: boolean;
    isSeaFishing: boolean;     // 是否为海上渔船 + 鱼群（严格在海中）
    fishResource: string;      // 海中伴生鱼群（DORADO_FISH / SALMON_FISH / TUNA_FISH / SHORE_FISH）
    lib: 'SUCAI' | 'SUCAI_ANIMAL';
    dir: string;
    homePos: Pt;               // 田间/牧场/林间/海上渔场劳作点
    gatePos: Pt;               // 靠近据点城门或近岸港湾的交接点（秋收搬运/渔船返港往返用）
    lastDrawPos: Pt;           // 最近一次绘制的实时坐标（供战火原地渐变倒下/沉没使用）
    facing: number;            // 0..7
    phase: number;
    slotIdx: number;           // 0..N-1
    winterActive: boolean;     // 冬季是否仍出勤
    viewAlpha: number;         // 视口可见度透明度 0..1
    peaceAlpha: number;        // 和平期季节出勤透明度 0..1
    actionAlpha: number;       // 换季动作切换淡入淡出系数 0..1
    damageBlend: number;       // 战火破坏渐变系数：0=和平劳作，1=战火被毁废墟/尸体/沉船
    combatStartSec: number;    // 本轮进入战火状态的起始秒数
    presentAtCombat: boolean;  // 本轮受袭瞬间是否实际出勤（冬季休耕角色不生成本轮战损）
    damagePreset: WarDamagePreset;
    damageVariant: number;     // 破损贴图帧索引
    displayedAction: string;   // 当前正在画的动作名
    desiredAction: string;     // 当前季节对应的目标动作名
}

const MIN_ZOOM = 9;
const MAX_ZOOM = 10;
const PANE_ZINDEX = 568;       // 高于陆地动物(560)/植被(565)，低于商队(570)/攻城底层军团(580)/据点(610)/主军团(620)
const VILLAGER_SCALE_BASE = 0.42;
const ANIMAL_SCALE_BASE = 0.48;
const SHIP_SCALE_BASE = 0.46;
const FISH_SCALE_BASE = 0.44;
const WRECK_SCALE_BASE = 0.44;
const HUNTING_TREE_BASE_PX = 27;
const CULL_MARGIN_DEG = 0.5;
const COMBAT_HIDE_RADIUS_DEG = 0.85;
const WAR_AFTERMATH_HOLD_MS = 8500;
const FADE_TO_DAMAGE_SEC = 1.1;
const FADE_RECOVER_PEACE_SEC = 2.4;
const FADE_SEASON_SEC = 1.4;

/** 67 文化 → 生计配置表（注意：陆地列表不含渔夫，所有渔业一律在海中生成渔船与海鱼群） */
const LIVELIHOOD_SPECS: Record<LivelihoodCategory, LivelihoodSpec> = {
    farming_rice: {
        category: 'farming_rice',
        villagers: ['VIL_MALE_FARMER', 'VIL_FEMALE_FARMER'],
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
        villagers: ['VIL_FEMALE_FARMER', 'VIL_MALE_LUMBERJACK', 'VIL_MALE_FORAGER'],
        animals: ['CHICKEN', 'GOAT'],
        winterRestAboveLat: 48,
    },
    mining_foraging: {
        category: 'mining_foraging',
        villagers: ['VIL_MALE_MINER', 'VIL_MALE_FORAGER', 'VIL_MALE_FARMER'],
        animals: ['GOAT', 'COW_BROWN'],
        winterRestAboveLat: 42,
    },
};

const CULTURE_TO_CATEGORY: Readonly<Record<string, LivelihoodCategory>> = {
    // 1. 农耕稻作与水网（8）
    JIANGNAN: 'farming_rice',
    HUGUANG: 'farming_rice',
    VIETNAMESE: 'farming_rice',
    BENGALIS: 'farming_rice',
    BURMESE: 'farming_rice',
    KHMER: 'farming_rice',
    PURU: 'farming_rice',
    INDIA: 'farming_rice',

    // 2. 农耕旱作与庄园（26）
    CENTRAL: 'farming_dry',
    WEI: 'farming_dry',
    BASHU: 'farming_dry',
    KOREA: 'farming_dry',
    FRANKS: 'farming_dry',
    BURGUNDIANS: 'farming_dry',
    BRITONS: 'farming_dry',
    CELTS: 'farming_dry',
    EAST: 'farming_dry',
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

    // 3. 草原游牧（9）
    MONGOL: 'nomadic_steppe',
    MOBEI_MONGOL: 'nomadic_steppe',
    YURT: 'nomadic_steppe',
    XIANBEI: 'nomadic_steppe',
    HUNS: 'nomadic_steppe',
    CUMAN: 'nomadic_steppe',
    TURKS: 'nomadic_steppe',
    GOTHS: 'nomadic_steppe',
    THRACIAN: 'nomadic_steppe',

    // 4. 丝路绿洲与荒原驼牧（8）
    KHITAN: 'nomadic_oasis',
    CENTRAL_ASIA: 'nomadic_oasis',
    WESTERN: 'nomadic_oasis',
    PERSIAN: 'nomadic_oasis',
    SASANIAN: 'nomadic_oasis',
    ORIE: 'nomadic_oasis',
    BERBER: 'nomadic_oasis',
    GURJARAS: 'nomadic_oasis',

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

    // 8. 山地矿冶与热带采金（5）
    BOHEMIANS: 'mining_foraging',
    ARMENIANS: 'mining_foraging',
    MUISCA: 'mining_foraging',
    AFRICA: 'mining_foraging',
    ETHIOPIANS: 'mining_foraging',
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
    const deg = ((Math.atan2(dLat, dLng) * 180) / Math.PI + 360) % 360;
    const idx = Math.round(((270 - deg + 360) % 360) / 45) % 8;
    return idx;
}

/** 根据渔猎民族文化与纬度返回四季对应的树种组合 [春, 夏, 秋, 冬] 与伴生灌木 */
function pickHuntingForestPalette(style: string, lat: number, idx: number): {
    springTree: string;
    summerTree: string;
    autumnTree: string;
    winterTree: string;
    bushName: string;
    bushLib: 'SUCAI_NATURE' | 'SUCAI_RESOURCE';
    isBamboo: boolean;
} {
    if (style === 'DIANQIAN') {
        const bamboo = idx % 2 === 0;
        return {
            springTree: bamboo ? 'LUSH_BAMBOO' : 'ASIAN_MAPLE_GREEN',
            summerTree: bamboo ? 'LUSH_BAMBOO' : 'GREEN_OAK',
            autumnTree: bamboo ? 'LUSH_BAMBOO' : 'ASIAN_MAPLE_AUTUMN',
            winterTree: bamboo ? 'BAMBOO' : 'ASIAN_PINE',
            bushName: idx % 3 === 0 ? 'FORAGE_BUSH' : 'UNDERBRUSH_JUNGLE',
            bushLib: idx % 3 === 0 ? 'SUCAI_RESOURCE' : 'SUCAI_NATURE',
            isBamboo: bamboo,
        };
    }
    if (style === 'TUPI' || style === 'MAYANS') {
        const trees = ['RAINFOREST', 'BRAZILWOOD', 'MANGROVE', 'PALM'];
        const t = trees[idx % trees.length];
        return {
            springTree: t,
            summerTree: t,
            autumnTree: t,
            winterTree: t,
            bushName: idx % 2 === 0 ? 'FORAGE_PAPAYA' : 'UNDERBRUSH_JUNGLE',
            bushLib: idx % 2 === 0 ? 'SUCAI_RESOURCE' : 'SUCAI_NATURE',
            isBamboo: false,
        };
    }
    if (style === 'MAPUCHE') {
        const araucaria = idx % 2 === 0;
        return {
            springTree: araucaria ? 'MONKEY_PUZZLE' : 'GREEN_OAK',
            summerTree: araucaria ? 'MONKEY_PUZZLE' : 'PINE',
            autumnTree: araucaria ? 'MONKEY_PUZZLE' : 'AUTUMN_OAK',
            winterTree: araucaria ? 'MONKEY_PUZZLE' : (Math.abs(lat) > 36 ? 'SNOW_PINE' : 'PINE'),
            bushName: idx % 2 === 0 ? 'FORAGE_BUSH' : 'BUSH_TREE_A',
            bushLib: idx % 2 === 0 ? 'SUCAI_RESOURCE' : 'SUCAI_NATURE',
            isBamboo: false,
        };
    }
    if (style === 'NORTHEAST' || style === 'VARANGIANS') {
        const pine = idx % 2 === 0;
        const mainPine = style === 'NORTHEAST' ? 'ASIAN_PINE' : 'PINE';
        return {
            springTree: pine ? mainPine : 'BIRCH_GREEN',
            summerTree: pine ? mainPine : 'BIRCH_GREEN',
            autumnTree: pine ? mainPine : 'BIRCH_AUTUMN',
            winterTree: pine ? 'SNOW_PINE' : 'SNOW_AUTUMN_OAK',
            bushName: idx % 2 === 0 ? 'FORAGE_BUSH' : 'UNDERBRUSH',
            bushLib: idx % 2 === 0 ? 'SUCAI_RESOURCE' : 'SUCAI_NATURE',
            isBamboo: false,
        };
    }
    // AMERICA / GEORGIANS 等温带山林渔猎
    const isPine = idx % 3 === 0;
    const cold = Math.abs(lat) > 38;
    return {
        springTree: isPine ? 'PINE' : 'GREEN_OAK',
        summerTree: isPine ? 'PINE' : 'GREEN_OAK',
        autumnTree: isPine ? 'PINE' : 'AUTUMN_OAK',
        winterTree: isPine ? (cold ? 'SNOW_PINE' : 'PINE') : (cold ? 'SNOW_AUTUMN_OAK' : 'AUTUMN_OAK'),
        bushName: idx % 2 === 0 ? 'FORAGE_BUSH' : 'BUSH_TREE_A',
        bushLib: idx % 2 === 0 ? 'SUCAI_RESOURCE' : 'SUCAI_NATURE',
        isBamboo: false,
    };
}

export class CityLifeAmbientLayer {
    private map: L.Map;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private running = false;
    private lastTime = 0;
    private nowMs = 0;
    private assets = new Map<string, SpriteSheetAsset>();
    private stripAssets = new Map<string, StripStaticAsset>();
    private actorsByCity = new Map<string, CityLifeActor[]>();
    private forestByCity = new Map<string, CityForestProp[]>();
    private activeActors = new Map<string, CityLifeActor>();
    private cityLastCombatMs = new Map<string, number>();
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

        // 当陆海掩膜/高程瓦片加载完成时，清空据点缓存以重新精确计算海中渔场与陆地落点
        window.addEventListener('land-sea-tiles-updated', () => {
            this.actorsByCity.clear();
            this.forestByCity.clear();
            this.activeActors.clear();
        });
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
        return this.assets.size + this.stripAssets.size;
    }

    public debugAssetBytes(): number {
        let b = 0;
        for (const a of this.assets.values()) {
            for (const im of a.sheets) {
                if (im) b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            }
        }
        for (const st of this.stripAssets.values()) {
            if (st.sheet) b += (st.sheet.naturalWidth || 0) * (st.sheet.naturalHeight || 0) * 4;
        }
        return b;
    }

    private getSeason(): number {
        const s = (window as any).game?.timeSystem?.getSeason?.();
        return typeof s === 'number' && s >= 0 && s <= 3 ? s : 0;
    }

    private getSeasonBlend(): number {
        const rem = (window as any).game?.timeSystem?.getTimeToNextSeason?.();
        if (typeof rem !== 'number' || !Number.isFinite(rem)) return 0;
        if (rem >= 2.0) return 0;
        return Math.max(0, Math.min(1, 1 - rem / 2.0));
    }

    private isHiddenNow(): boolean {
        if (!this.layerVisible) return true;
        // scene13War 在自动乱斗时也会短暂激活；只有真正进入 13 战术画面才遮挡战略民生层。
        const tacticalCovered = this.map.getZoom() >= 13 && (
            (window as any).game?.scene13War?.isActive?.() === true
            || (window as any).game?.battleScene?.isLingering?.() === true
        );
        if (tacticalCovered) return true;
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

    /** 严格判定某点处于真实海域（中心点及周围至少 3 个邻点均为海，防止渔船搁浅在岸线陆地上） */
    private isDeepEnoughSea(pos: Pt): boolean {
        if (!this.isSea(pos)) return false;
        const d = 0.024;
        let seaCount = 0;
        if (this.isSea({ lat: pos.lat + d, lng: pos.lng })) seaCount++;
        if (this.isSea({ lat: pos.lat - d, lng: pos.lng })) seaCount++;
        if (this.isSea({ lat: pos.lat, lng: pos.lng + d })) seaCount++;
        if (this.isSea({ lat: pos.lat, lng: pos.lng - d })) seaCount++;
        return seaCount >= 3;
    }

    /** 在据点周边搜寻真实海域渔场点（0.10° ~ 0.68°），并同时返回近岸港湾海域点（全在海中） */
    private findSeaFishingSpot(cLat: number, cLng: number, baseAngle: number, distBias: number): { homePos: Pt; gatePos: Pt } | null {
        const radii = [0.14, 0.20, 0.27, 0.35, 0.44, 0.54, 0.64];
        const angleSteps = 20;
        for (const r of radii) {
            const actualR = r + distBias * 0.05;
            for (let step = 0; step < angleSteps; step++) {
                const offset = (step % 2 === 0 ? 1 : -1) * Math.ceil(step / 2) * ((Math.PI * 2) / angleSteps);
                const ang = baseAngle + offset;
                const cand: Pt = {
                    lat: cLat + Math.sin(ang) * actualR * 0.85,
                    lng: cLng + Math.cos(ang) * actualR,
                };
                if (this.isDeepEnoughSea(cand)) {
                    // 寻找从外海渔场朝据点方向推进的近岸港湾海域点（同样必须在海中）
                    let gatePos = cand;
                    for (const f of [0.55, 0.68, 0.80]) {
                        const nearCand = {
                            lat: cLat + (cand.lat - cLat) * f,
                            lng: cLng + (cand.lng - cLng) * f,
                        };
                        if (this.isSea(nearCand)) {
                            gatePos = nearCand;
                            break;
                        }
                    }
                    return { homePos: cand, gatePos };
                }
            }
        }
        return null;
    }

    /** 为渔猎民族（forest_hunting）据点生成环抱四周的树林与林下灌丛浆果植被 */
    private getOrCreateCityForest(city: CityDataV2): CityForestProp[] {
        let list = this.forestByCity.get(city.id);
        if (list) return list;
        list = [];

        const style: BuildingStyle = city.buildingStyle ?? 'CENTRAL';
        const cat = CULTURE_TO_CATEGORY[style] ?? 'farming_dry';
        if (cat !== 'forest_hunting') {
            this.forestByCity.set(city.id, list);
            return list;
        }

        const cLat = city.lat;
        const cLng = city.lng;
        const groveCount = 9; // 环绕据点生成 9 簇高低错落的四季树木与灌丛

        for (let i = 0; i < groveCount; i++) {
            const h1 = strHash01(city.id, i * 31 + 101);
            const h2 = strHash01(city.id, i * 31 + 102);
            const h3 = strHash01(city.id, i * 31 + 103);

            const baseAngle = (i / groveCount) * Math.PI * 2 + (h1 - 0.5) * 0.45;
            const distDeg = 0.095 + h2 * 0.165;
            let pos: Pt | null = null;
            for (let attempt = 0; attempt < 8; attempt++) {
                const ang = baseAngle + attempt * (Math.PI / 4);
                const cand = {
                    lat: cLat + Math.sin(ang) * distDeg * 0.85,
                    lng: cLng + Math.cos(ang) * distDeg,
                };
                if (!this.isSea(cand)) {
                    pos = cand;
                    break;
                }
            }
            if (!pos) continue;

            const pal = pickHuntingForestPalette(style, cLat, i);
            list.push({
                id: `${city.id}_forest_${i}`,
                cityId: city.id,
                pos,
                springTree: pal.springTree,
                summerTree: pal.summerTree,
                autumnTree: pal.autumnTree,
                winterTree: pal.winterTree,
                bushName: pal.bushName,
                bushLib: pal.bushLib,
                isBamboo: pal.isBamboo,
                variant: Math.floor(h3 * 100),
                scaleJitter: 0.86 + h1 * 0.30,
            });
        }

        this.forestByCity.set(city.id, list);
        return list;
    }

    /** 根据据点生成确定性的民生角色列表（每个据点 2~5 个） */
    private getOrCreateCityActors(city: CityDataV2): CityLifeActor[] {
        let list = this.actorsByCity.get(city.id);
        if (list) return list;
        list = [];

        const style: BuildingStyle = city.buildingStyle ?? 'CENTRAL';
        const cat = CULTURE_TO_CATEGORY[style] ?? 'farming_dry';
        const spec = LIVELIHOOD_SPECS[cat];

        const cityType = String(city.type);
        const isPass = cityType === 'pass' || cityType === 'Pass';
        const totalSlots = isPass ? 2 : cityType === 'big_city' || cityType === 'huge_city' ? 5 : cityType === 'medium_city' || cityType === 'large_city' ? 4 : 3;

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

        const villagerPresets: WarDamagePreset[] = [
            'corpse_and_fence',
            'broken_cart_and_bones',
            'rubble_and_corpse',
        ];
        const fishPool = Math.abs(cLat) > 42
            ? ['SALMON_FISH', 'SHORE_FISH', 'TUNA_FISH']
            : ['DORADO_FISH', 'TUNA_FISH', 'SHORE_FISH', 'SALMON_FISH'];

        // 渔猎民族先生成周围的树林植被节点，让猎人/樵夫/采集者围绕树林劳作
        const forestNodes = cat === 'forest_hunting' ? this.getOrCreateCityForest(city) : [];

        for (let i = 0; i < totalSlots; i++) {
            const h1 = strHash01(city.id, i * 17 + 1);
            const h2 = strHash01(city.id, i * 17 + 2);
            const h3 = strHash01(city.id, i * 17 + 3);
            const h4 = strHash01(city.id, i * 17 + 4);

            const baseAngle = (i / totalSlots) * Math.PI * 2 + (h3 - 0.5) * 0.7;

            // 判断本槽位是否应当尝试在海中生成渔业（海洋渔业文化前 3 个槽位优先下海，水网稻作文化第 2 个槽位若靠海也下海捕鱼）
            const wantsSeaFishing = !isPass && (
                (cat === 'maritime_fishing' && i <= 2) ||
                (cat === 'farming_rice' && i === totalSlots - 1)
            );

            if (wantsSeaFishing) {
                const seaSpot = this.findSeaFishingSpot(cLat, cLng, baseAngle, h4);
                if (seaSpot) {
                    const facing = Math.floor(strHash01(city.id, i * 17 + 5) * 8) % 8;
                    const phase = Math.floor(strHash01(city.id, i * 17 + 6) * 1000);
                    const damageVariant = Math.floor(strHash01(city.id, i * 17 + 7) * 100);
                    const fishResource = fishPool[Math.floor(h2 * fishPool.length) % fishPool.length];
                    const winterActive = !isColdWinter || i === 0;

                    list.push({
                        id: `${city.id}_life_${i}`,
                        cityId: city.id,
                        cityPos: { lat: cLat, lng: cLng },
                        isAnimal: false,
                        isSeaFishing: true,
                        fishResource,
                        lib: 'SUCAI',
                        dir: 'SHP_FISHING_SHIP',
                        homePos: seaSpot.homePos,
                        gatePos: seaSpot.gatePos,
                        lastDrawPos: { lat: seaSpot.homePos.lat, lng: seaSpot.homePos.lng },
                        facing,
                        phase,
                        slotIdx: i,
                        winterActive,
                        viewAlpha: 0,
                        peaceAlpha: 0,
                        actionAlpha: 1,
                        damageBlend: 0,
                        combatStartSec: 0,
                        presentAtCombat: false,
                        damagePreset: 'sea_shipwreck',
                        damageVariant,
                        displayedAction: 'work',
                        desiredAction: 'work',
                    });
                    continue;
                }
            }

            // 陆地槽位：前面槽位放村民，后面槽位放伴生家畜/猎物
            const animalRatio = (cat === 'nomadic_steppe' || cat === 'nomadic_oasis' || cat === 'highland_pastoral') ? 0.55 : 0.34;
            const isAnimal = !isPass && i >= 1 && h1 < animalRatio && animalPool.length > 0;

            const dir = isAnimal
                ? animalPool[Math.floor(h2 * animalPool.length) % animalPool.length]
                : spec.villagers[Math.floor(h2 * spec.villagers.length) % spec.villagers.length];

            let homePos: Pt | null = null;
            // 若是渔猎民族且周围已有树林节点，将樵夫/猎人/采集者/林鹿直接安置在树林节点旁劳作
            if (cat === 'forest_hunting' && forestNodes.length > 0) {
                const fn = forestNodes[(i * 2) % forestNodes.length];
                const cand = {
                    lat: fn.pos.lat + (h3 - 0.5) * 0.022,
                    lng: fn.pos.lng + (h4 - 0.5) * 0.026,
                };
                if (!this.isSea(cand)) {
                    homePos = cand;
                }
            }

            if (!homePos) {
                const distDeg = 0.14 + h4 * 0.11;
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
            }
            if (!homePos) continue;

            const gatePos = {
                lat: cLat + (homePos.lat - cLat) * 0.38,
                lng: cLng + (homePos.lng - cLng) * 0.38,
            };

            const facing = Math.floor(strHash01(city.id, i * 17 + 5) * 8) % 8;
            const phase = Math.floor(strHash01(city.id, i * 17 + 6) * 1000);
            const damageVariant = Math.floor(strHash01(city.id, i * 17 + 7) * 100);
            const winterActive = !isColdWinter || dir === 'VIL_MALE_LUMBERJACK' || dir === 'VIL_MALE_HUNTER' || i === 0;

            const damagePreset: WarDamagePreset = isAnimal
                ? 'animal_loss'
                : villagerPresets[i % villagerPresets.length];

            list.push({
                id: `${city.id}_life_${i}`,
                cityId: city.id,
                cityPos: { lat: cLat, lng: cLng },
                isAnimal,
                isSeaFishing: false,
                fishResource: '',
                lib: isAnimal ? 'SUCAI_ANIMAL' : 'SUCAI',
                dir,
                homePos,
                gatePos,
                lastDrawPos: { lat: homePos.lat, lng: homePos.lng },
                facing,
                phase,
                slotIdx: i,
                winterActive,
                viewAlpha: 0,
                peaceAlpha: 0,
                actionAlpha: 1,
                damageBlend: 0,
                combatStartSec: 0,
                presentAtCombat: false,
                damagePreset,
                damageVariant,
                displayedAction: isAnimal ? 'idle' : 'work',
                desiredAction: isAnimal ? 'idle' : 'work',
            });
        }

        this.actorsByCity.set(city.id, list);
        return list;
    }

    /** 计算某个角色在当前季节应当执行的动作名 */
    private resolveSeasonalAction(actor: CityLifeActor, season: number): string {
        if (actor.isSeaFishing) {
            // 海中渔船：春夏季在海鱼群上方撒网捕鱼（work），秋季满载往返渔场与近岸港湾（move），冬季作业或泊船
            if (season === 2) return actor.slotIdx % 2 === 0 ? 'move' : 'work';
            if (season === 3) return actor.slotIdx % 2 === 0 ? 'work' : 'idle';
            return 'work';
        }
        if (actor.isAnimal) {
            if (season === 1 && actor.slotIdx % 2 === 1) return 'walk';
            return 'idle';
        }
        const isFarmer = actor.dir === 'VIL_MALE_FARMER' || actor.dir === 'VIL_FEMALE_FARMER';
        if (season === 0) {
            if (isFarmer) return actor.slotIdx % 2 === 0 ? 'seed' : 'work';
            return 'work';
        }
        if (season === 1) {
            return 'work';
        }
        if (season === 2) {
            return actor.slotIdx % 3 === 2 ? 'work' : 'carry';
        }
        if (actor.dir === 'VIL_MALE_LUMBERJACK' || actor.dir === 'VIL_MALE_HUNTER') {
            return 'work';
        }
        return actor.slotIdx % 2 === 0 ? 'idle' : 'move';
    }

    /** 扫描当前处于战斗波及中的据点集合 */
    private scanEndangeredCities(nowMs: number, visibleCities: CityDataV2[]): void {
        if (nowMs - this.lastCombatScanMs < 200) return;
        this.lastCombatScanMs = nowMs;
        this.endangeredCities.clear();

        const game = (window as any).game;
        if (!game) return;

        const armies: any[] = game.legionManager?.getArmies?.() ?? [];
        const combatPositions: Pt[] = [];

        for (const a of armies) {
            if (!a || a.isDestroyed) continue;
            const inFight = a.getIsInCombat?.() === true
                || a.isAttacking
                || a.isBattling
                || a.inCombat
                || a.state === 'COMBAT'
                || a.state === 'SIEGE';
            // siegeTargetCityId 在战后仍会保留用于城图外推，只有真实交战时才能作为攻城依据。
            if (inFight && a.siegeTargetCityId) {
                this.cityLastCombatMs.set(a.siegeTargetCityId, nowMs);
                this.endangeredCities.add(a.siegeTargetCityId);
            }
            if (inFight && typeof a.getPosition === 'function') {
                const pos = a.getPosition();
                if (pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lng)) {
                    combatPositions.push(pos);
                }
            }
        }

        const activeBattles: any[] = game.combatSystem?.getActiveBattleFields?.() ?? [];
        for (const bf of activeBattles) {
            if (!bf || bf.isOver) continue;
            if (bf.siegeCityId) {
                this.cityLastCombatMs.set(bf.siegeCityId, nowMs);
                this.endangeredCities.add(bf.siegeCityId);
            }
            const p = bf.getReferencePosition?.()
                ?? bf.position
                ?? bf.center
                ?? (Number.isFinite(bf.lat) ? { lat: bf.lat, lng: bf.lng } : null);
            if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
                combatPositions.push(p);
            }
        }

        if (combatPositions.length > 0) {
            const r2 = COMBAT_HIDE_RADIUS_DEG * COMBAT_HIDE_RADIUS_DEG;
            for (const c of visibleCities) {
                for (const cp of combatPositions) {
                    const dLat = c.lat - cp.lat;
                    const dLng = c.lng - cp.lng;
                    if (dLat * dLat + dLng * dLng <= r2) {
                        this.cityLastCombatMs.set(c.id, nowMs);
                        this.endangeredCities.add(c.id);
                        break;
                    }
                }
            }
        }

        for (const c of visibleCities) {
            const lastMs = this.cityLastCombatMs.get(c.id);
            if (lastMs !== undefined) {
                if (nowMs - lastMs <= WAR_AFTERMATH_HOLD_MS) {
                    this.endangeredCities.add(c.id);
                } else {
                    this.cityLastCombatMs.delete(c.id);
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
                const dirKeys = Object.keys(asset.dirs);
                const numDirs = dirKeys.length === 1 ? 1 : 8;
                asset.sheets = new Array(8).fill(null);
                let loaded = 0;
                for (let d = 0; d < numDirs; d++) {
                    const img = new Image();
                    img.onload = () => {
                        loaded++;
                        if (loaded === numDirs) {
                            if (numDirs === 1) {
                                for (let k = 1; k < 8; k++) asset.sheets[k] = img;
                            }
                            asset.ready = true;
                        }
                    };
                    img.onerror = () => {
                        loaded++;
                        if (loaded === numDirs) asset.ready = true;
                    };
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

    /** 加载单行精灵条资产（支持 SUCAI_BATTLEFIELD / SUCAI_NATURE / SUCAI_RESOURCE） */
    private loadStripAsset(folder: 'SUCAI_BATTLEFIELD' | 'SUCAI_NATURE' | 'SUCAI_RESOURCE', name: string): void {
        const key = `${folder}/${name}`;
        if (this.stripAssets.has(key)) return;
        const basePath = `/${folder}/${name}`;
        const treeMeta = folder === 'SUCAI_NATURE' ? TREE_METAS[name] : undefined;
        const st: StripStaticAsset = {
            key,
            frames: 1,
            boxW: treeMeta?.boxW ?? 64,
            boxH: treeMeta?.boxH ?? 64,
            anchorX: treeMeta?.anchorX ?? 32,
            anchorY: treeMeta?.anchorY ?? 32,
            sheet: null,
            ready: false,
            lastUsed: performance.now(),
        };
        this.stripAssets.set(key, st);

        fetch(`${basePath}/_meta.json`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`strip meta ${r.status}`))))
            .then((meta) => {
                st.frames = Math.max(1, meta.frames ?? 1);
                st.boxW = treeMeta?.boxW ?? meta.box_w ?? 64;
                st.boxH = treeMeta?.boxH ?? meta.box_h ?? 64;
                st.anchorX = treeMeta?.anchorX ?? meta.anchor_x ?? Math.floor(st.boxW / 2);
                st.anchorY = treeMeta?.anchorY ?? meta.anchor_y ?? Math.floor(st.boxH / 2);
                const img = new Image();
                img.onload = () => { st.ready = true; };
                img.onerror = () => { st.ready = false; };
                img.src = `${basePath}/frames.png`;
                st.sheet = img;
            })
            .catch(() => {});
    }

    private stripAssetFor(folder: 'SUCAI_BATTLEFIELD' | 'SUCAI_NATURE' | 'SUCAI_RESOURCE', name: string): StripStaticAsset | undefined {
        const key = `${folder}/${name}`;
        let st = this.stripAssets.get(key);
        if (!st) {
            this.loadStripAsset(folder, name);
            return undefined;
        }
        st.lastUsed = performance.now();
        return st.ready ? st : undefined;
    }

    /** 预热战时所需的破坏残骸、沉船与尸体贴图 */
    private preloadWarDamageAssetsForActor(actor: CityLifeActor): void {
        if (actor.isSeaFishing) {
            this.loadAsset('SUCAI', 'SHP_FISHING_SHIP', 'sink');
            this.loadAsset('SUCAI', 'SHIP_SINK_SMALL', 'idle');
            return;
        }
        if (actor.isAnimal) {
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'ANIMAL_SKELETON');
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'FENCE_RUBBLE');
        } else {
            this.loadAsset('SUCAI', 'VIL_MALE_VILLAGER', 'death');
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'FENCE_RUBBLE');
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'CART_BROKEN');
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'SKELETON_CIVILIAN');
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'BARRICADE_RUBBLE_A');
        }
    }

    private evictAssets(): void {
        let bytes = this.debugAssetBytes();
        if (bytes <= CityLifeAmbientLayer.ASSET_BUDGET_BYTES) return;
        const inUse = new Set<string>();
        for (const a of this.activeActors.values()) {
            inUse.add(`${a.lib}/${a.dir}:${a.displayedAction}`);
            inUse.add(`${a.lib}/${a.dir}:${a.desiredAction}`);
            if (a.damageBlend > 0) {
                inUse.add('SUCAI/VIL_MALE_VILLAGER:death');
                inUse.add('SUCAI/SHP_FISHING_SHIP:sink');
                inUse.add('SUCAI/SHIP_SINK_SMALL:idle');
            }
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
        const tSec = this.nowMs / 1000;

        for (const city of visibleCities) {
            const actors = this.getOrCreateCityActors(city);
            const forestProps = this.getOrCreateCityForest(city);
            const cityInWar = this.endangeredCities.has(city.id);

            // 预热渔猎民族据点树林与灌丛资源
            for (const fp of forestProps) {
                const curTree = season === 0 ? fp.springTree : season === 1 ? fp.summerTree : season === 2 ? fp.autumnTree : fp.winterTree;
                const nextS = (season + 1) % 4;
                const nextTree = nextS === 0 ? fp.springTree : nextS === 1 ? fp.summerTree : nextS === 2 ? fp.autumnTree : fp.winterTree;
                this.loadStripAsset('SUCAI_NATURE', curTree);
                if (nextTree !== curTree) this.loadStripAsset('SUCAI_NATURE', nextTree);
                this.loadStripAsset(fp.bushLib, fp.bushName);
                if (cityInWar) {
                    this.loadStripAsset('SUCAI_NATURE', fp.isBamboo ? 'FELLED_LUSH_BAMBOO' : 'FELLED_GENERIC');
                    this.loadStripAsset('SUCAI_NATURE', fp.isBamboo ? 'STUMP_LUSH_BAMBOO' : 'STUMP_GENERIC');
                    this.loadStripAsset('SUCAI_NATURE', 'DEAD_TREE');
                }
            }

            for (const actor of actors) {
                inViewActorIds.add(actor.id);
                if (!this.activeActors.has(actor.id)) {
                    this.activeActors.set(actor.id, actor);
                }
                actor.desiredAction = this.resolveSeasonalAction(actor, season);
                this.loadAsset(actor.lib, actor.dir, actor.desiredAction);
                if (actor.isSeaFishing && actor.fishResource) {
                    this.loadStripAsset('SUCAI_RESOURCE', actor.fishResource);
                }
                if (cityInWar || actor.damageBlend > 0) {
                    this.preloadWarDamageAssetsForActor(actor);
                }
            }
        }

        for (const [id, actor] of this.activeActors.entries()) {
            const inView = inViewActorIds.has(id);
            const inCombat = this.endangeredCities.has(actor.cityId);
            const winterSleep = season === 3 && !actor.winterActive;

            if (inView) {
                actor.viewAlpha = Math.min(1, actor.viewAlpha + dt / 0.8);
            } else {
                actor.viewAlpha = Math.max(0, actor.viewAlpha - dt / 0.8);
                if (actor.viewAlpha <= 0) {
                    this.activeActors.delete(id);
                    continue;
                }
            }

            if (!winterSleep) {
                actor.peaceAlpha = Math.min(1, actor.peaceAlpha + dt / FADE_SEASON_SEC);
            } else {
                actor.peaceAlpha = Math.max(0, actor.peaceAlpha - dt / FADE_SEASON_SEC);
            }

            if (inCombat) {
                if (actor.damageBlend <= 0.01) {
                    actor.combatStartSec = tSec;
                    actor.presentAtCombat = !winterSleep;
                }
                actor.damageBlend = Math.min(1, actor.damageBlend + dt / FADE_TO_DAMAGE_SEC);
            } else if (actor.damageBlend > 0) {
                actor.damageBlend = Math.max(0, actor.damageBlend - dt / FADE_RECOVER_PEACE_SEC);
            }

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

    /** 绘制单行精灵条中的指定帧（破坏残骸、灌丛浆果、海鱼群、砍伐树桩等） */
    private drawStripSprite(
        folder: 'SUCAI_BATTLEFIELD' | 'SUCAI_NATURE' | 'SUCAI_RESOURCE',
        name: string,
        frameIdx: number,
        px: number,
        py: number,
        scale: number,
        alpha: number
    ): void {
        if (alpha <= 0.01) return;
        const st = this.stripAssetFor(folder, name);
        if (!st || !st.sheet || !st.sheet.complete || !st.sheet.naturalWidth) return;

        const frame = frameIdx % Math.max(1, st.frames);
        const sx = frame * st.boxW;
        const dx = px - st.anchorX * scale;
        const dy = py - st.anchorY * scale;

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        this.ctx.drawImage(
            st.sheet,
            sx,
            0,
            st.boxW,
            st.boxH,
            dx,
            dy,
            st.boxW * scale,
            st.boxH * scale
        );
        this.ctx.restore();
    }

    /** 绘制渔猎据点的单棵季节性树木（严格对齐树根锚点） */
    private drawHuntingTree(treeName: string, variant: number, px: number, py: number, targetH: number, alpha: number): void {
        if (alpha <= 0.01) return;
        const st = this.stripAssetFor('SUCAI_NATURE', treeName);
        if (!st || !st.sheet || !st.sheet.complete || !st.sheet.naturalWidth) return;

        const treeMeta = TREE_METAS[treeName];
        const validFrames = treeMeta?.frames;
        const frame = validFrames && validFrames.length > 0
            ? validFrames[variant % validFrames.length]
            : (variant % Math.max(1, st.frames));

        const w = targetH * (st.boxW / st.boxH);
        const dx = px - w * (st.anchorX / st.boxW);
        const dy = py - targetH * (st.anchorY / st.boxH);

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.95));
        this.ctx.drawImage(st.sheet, frame * st.boxW, 0, st.boxW, st.boxH, dx, dy, w, targetH);
        this.ctx.restore();
    }

    /** 绘制 8 方向死亡倒地/沉没并定格的精灵（村民或沉没渔船） */
    private drawDirectionalCorpse(
        lib: 'SUCAI',
        dir: string,
        action: string,
        facing: number,
        elapsedCombatSec: number,
        px: number,
        py: number,
        scale: number,
        alpha: number
    ): void {
        if (alpha <= 0.01) return;
        const deathAsset = this.assetFor(lib, dir, action);
        if (!deathAsset) return;

        const box = deathAsset.dirs[String(facing)] ?? deathAsset.dirs['0'];
        if (!box) return;
        const sheet = deathAsset.sheets[facing] ?? deathAsset.sheets[0];
        if (!sheet || !sheet.complete || !sheet.naturalWidth) return;

        const totalFrames = Math.max(1, deathAsset.frames);
        const animFrame = Math.floor(Math.max(0, elapsedCombatSec) * 16);
        const frame = Math.min(totalFrames - 1, animFrame);

        const fw = box.fw;
        const fh = box.fh;
        const dx = px - box.hx * scale;
        const dy = py - box.hy * scale;

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        this.ctx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
        this.ctx.restore();
    }

    /** 绘制战时被破坏的图、尸体、沉船与牲畜损失（随 damageBlend 0->1 渐显） */
    private drawWarDamageForActor(
        actor: CityLifeActor,
        pt: L.Point,
        facing: number,
        zoomFactor: number,
        tSec: number,
        damageAlpha: number
    ): void {
        const wreckScale = WRECK_SCALE_BASE * zoomFactor;
        const elapsed = Math.max(0, tSec - actor.combatStartSec);

        if (actor.isSeaFishing || actor.damagePreset === 'sea_shipwreck') {
            // 海中渔船战损：播放 DE 原版渔船破裂沉没动画（SHP_FISHING_SHIP:sink）+ 海面漂浮沉船残骸水花（SHIP_SINK_SMALL）
            const shipScale = SHIP_SCALE_BASE * zoomFactor;
            this.drawDirectionalCorpse('SUCAI', 'SHIP_SINK_SMALL', 'idle', 0, elapsed * 0.7, pt.x, pt.y + 2 * zoomFactor, shipScale * 0.95, damageAlpha * 0.85);
            this.drawDirectionalCorpse('SUCAI', 'SHP_FISHING_SHIP', 'sink', facing, elapsed, pt.x, pt.y, shipScale, damageAlpha);
            return;
        }

        const corpseScale = VILLAGER_SCALE_BASE * zoomFactor;
        const ox = ((actor.damageVariant % 7) - 3) * 4.5 * zoomFactor;
        const oy = (((actor.damageVariant >> 2) % 5) - 2) * 3.5 * zoomFactor;

        if (actor.damagePreset === 'animal_loss') {
            // 当前 SUCAI_ANIMAL 没有 death 动作，不能用 walk 回退冒充死畜，只画既有白骨与牧场损失。
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'FENCE_RUBBLE', actor.damageVariant, pt.x - 10 * zoomFactor, pt.y - 5 * zoomFactor, wreckScale * 0.9, damageAlpha * 0.92);
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'ANIMAL_SKELETON', actor.damageVariant, pt.x + 12 * zoomFactor + ox * 0.4, pt.y + 6 * zoomFactor + oy * 0.4, wreckScale * 0.88, damageAlpha * 0.95);
            return;
        }

        if (actor.damagePreset === 'broken_cart_and_bones') {
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'CART_BROKEN', actor.damageVariant, pt.x - 6 * zoomFactor, pt.y - 3 * zoomFactor, wreckScale, damageAlpha);
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'SKELETON_CIVILIAN', actor.damageVariant, pt.x + 14 * zoomFactor, pt.y + 7 * zoomFactor, wreckScale * 0.95, damageAlpha);
            this.drawDirectionalCorpse('SUCAI', 'VIL_MALE_VILLAGER', 'death', facing, elapsed, pt.x + ox, pt.y + oy, corpseScale, damageAlpha * 0.95);
            return;
        }

        if (actor.damagePreset === 'rubble_and_corpse') {
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'BARRICADE_RUBBLE_A', actor.damageVariant, pt.x, pt.y - 2 * zoomFactor, wreckScale * 0.82, damageAlpha * 0.92);
            this.drawDirectionalCorpse('SUCAI', 'VIL_MALE_VILLAGER', 'death', facing, elapsed, pt.x + 8 * zoomFactor, pt.y + 5 * zoomFactor, corpseScale, damageAlpha);
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'SKELETON_CIVILIAN', actor.damageVariant + 3, pt.x - 12 * zoomFactor, pt.y + 6 * zoomFactor, wreckScale * 0.9, damageAlpha * 0.9);
            return;
        }

        this.drawStripSprite('SUCAI_BATTLEFIELD', 'FENCE_RUBBLE', actor.damageVariant, pt.x - 8 * zoomFactor, pt.y - 4 * zoomFactor, wreckScale, damageAlpha);
        this.drawDirectionalCorpse('SUCAI', 'VIL_MALE_VILLAGER', 'death', facing, elapsed, pt.x + 5 * zoomFactor, pt.y + 3 * zoomFactor, corpseScale, damageAlpha);
    }

    private draw(): void {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const zoom = this.map.getZoom();
        const zoomFactor = Math.pow(2, zoom - 9);
        const m = 64;
        const tSec = this.nowMs / 1000;
        const season = this.getSeason();
        const nextSeason = (season + 1) % 4;
        const sBlend = this.getSeasonBlend();

        // 收集当前激活据点的状态（viewAlpha 与 damageBlend）以驱动渔猎民族周围树林植被的绘制与战损渐变
        const cityState = new Map<string, { viewAlpha: number; damageBlend: number }>();
        for (const a of this.activeActors.values()) {
            const prev = cityState.get(a.cityId);
            if (!prev || a.viewAlpha > prev.viewAlpha) {
                cityState.set(a.cityId, { viewAlpha: a.viewAlpha, damageBlend: a.damageBlend });
            }
        }

        // 1. 先绘制渔猎民族据点周围的四季树林、灌丛浆果与战时砍伐/焚毁断木树桩
        const treeBaseH = HUNTING_TREE_BASE_PX * Math.pow(1.35, zoom - 9);
        for (const [cityId, st] of cityState.entries()) {
            if (st.viewAlpha <= 0.01) continue;
            const forestProps = this.forestByCity.get(cityId);
            if (!forestProps || forestProps.length === 0) continue;

            for (const fp of forestProps) {
                const pt = this.map.latLngToContainerPoint([fp.pos.lat, fp.pos.lng]);
                if (pt.x < -m || pt.x > this.canvas.width + m || pt.y < -m || pt.y > this.canvas.height + m) continue;

                const peaceAlpha = st.viewAlpha * (1 - st.damageBlend);
                const damageAlpha = st.viewAlpha * st.damageBlend;
                const bushScale = 0.36 * zoomFactor;

                // 战火破坏态：树林渐变为被砍倒的断木（FELLED_GENERIC）、树桩（STUMP_GENERIC）与焦枯死树（DEAD_TREE）
                if (damageAlpha > 0.01) {
                    const felledName = fp.isBamboo ? 'FELLED_LUSH_BAMBOO' : 'FELLED_GENERIC';
                    const stumpName = fp.isBamboo ? 'STUMP_LUSH_BAMBOO' : 'STUMP_GENERIC';
                    this.drawStripSprite('SUCAI_NATURE', stumpName, fp.variant, pt.x - 10 * zoomFactor, pt.y + 3 * zoomFactor, 0.48 * zoomFactor, damageAlpha);
                    this.drawStripSprite('SUCAI_NATURE', felledName, fp.variant, pt.x + 4 * zoomFactor, pt.y + 2 * zoomFactor, 0.42 * zoomFactor, damageAlpha);
                    if (fp.variant % 2 === 0) {
                        this.drawHuntingTree('DEAD_TREE', fp.variant, pt.x - 6 * zoomFactor, pt.y - 2 * zoomFactor, treeBaseH * fp.scaleJitter * 0.85, damageAlpha * 0.88);
                    }
                }

                // 和平四季态：绘制林下浆果灌丛 + 主树 + 伴生小树（支持四季渐变切换）
                if (peaceAlpha > 0.01) {
                    this.drawStripSprite(fp.bushLib, fp.bushName, fp.variant, pt.x + 11 * zoomFactor, pt.y + 5 * zoomFactor, bushScale, peaceAlpha * 0.92);

                    const curTree = season === 0 ? fp.springTree : season === 1 ? fp.summerTree : season === 2 ? fp.autumnTree : fp.winterTree;
                    const nextTree = nextSeason === 0 ? fp.springTree : nextSeason === 1 ? fp.summerTree : nextSeason === 2 ? fp.autumnTree : fp.winterTree;
                    const mainH = treeBaseH * fp.scaleJitter;
                    const subH = mainH * 0.78;

                    if (sBlend > 0.01 && nextTree !== curTree) {
                        this.drawHuntingTree(curTree, fp.variant, pt.x, pt.y, mainH, peaceAlpha * (1 - sBlend));
                        this.drawHuntingTree(nextTree, fp.variant, pt.x, pt.y, mainH, peaceAlpha * sBlend);
                        this.drawHuntingTree(curTree, fp.variant + 2, pt.x - 12 * zoomFactor, pt.y + 4 * zoomFactor, subH, peaceAlpha * (1 - sBlend));
                        this.drawHuntingTree(nextTree, fp.variant + 2, pt.x - 12 * zoomFactor, pt.y + 4 * zoomFactor, subH, peaceAlpha * sBlend);
                    } else {
                        this.drawHuntingTree(curTree, fp.variant, pt.x, pt.y, mainH, peaceAlpha);
                        this.drawHuntingTree(curTree, fp.variant + 2, pt.x - 12 * zoomFactor, pt.y + 4 * zoomFactor, subH, peaceAlpha);
                    }
                }
            }
        }

        // 2. 按纬度从北到南排序绘制民生角色、海中渔船鱼群与战损尸骸
        const list = [...this.activeActors.values()].filter(
            (a) => a.viewAlpha > 0.01 && (a.peaceAlpha * (1 - a.damageBlend) > 0.01 || a.damageBlend > 0.01)
        );
        list.sort((a, b) => b.homePos.lat - a.homePos.lat);

        for (const actor of list) {
            const act = actor.displayedAction;
            let drawLat = actor.homePos.lat;
            let drawLng = actor.homePos.lng;
            let facing = actor.facing;

            if (actor.damageBlend <= 0.05) {
                if (act === 'carry' || act === 'move') {
                    const speed = actor.isSeaFishing ? 0.10 : 0.14;
                    const cycle = (tSec * speed + (actor.phase % 100) / 100) % 2;
                    const u = cycle <= 1 ? cycle : 2 - cycle;
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
                    const turnOffset = Math.floor((tSec + actor.phase) / 8) % 2;
                    facing = (actor.facing + turnOffset) % 8;
                }
                actor.lastDrawPos.lat = drawLat;
                actor.lastDrawPos.lng = drawLng;
            } else {
                drawLat = actor.lastDrawPos.lat;
                drawLng = actor.lastDrawPos.lng;
            }

            const pt = this.map.latLngToContainerPoint([drawLat, drawLng]);
            if (pt.x < -m || pt.x > this.canvas.width + m || pt.y < -m || pt.y > this.canvas.height + m) continue;

            // 战火破坏层（破损农车/栅栏废墟、平民尸体、牲畜尸骨、沉没渔船），随 damageBlend (0 -> 1) 渐显
            const damageAlpha = actor.presentAtCombat ? actor.viewAlpha * actor.damageBlend : 0;
            if (damageAlpha > 0.01) {
                this.drawWarDamageForActor(actor, pt, facing, zoomFactor, tSec, damageAlpha);
            }

            // 和平民生层（春耕、夏耘、秋收、冬猎、牧群、海中渔船与鱼群），随 (1 - damageBlend) 渐隐
            const peaceFinalAlpha = actor.viewAlpha * actor.peaceAlpha * actor.actionAlpha * (1 - actor.damageBlend);
            if (peaceFinalAlpha > 0.01) {
                // 若是海上渔业，先在渔场海面上绘制跃水游弋的海鱼群（DORADO_FISH / SALMON_FISH / TUNA_FISH / SHORE_FISH）
                if (actor.isSeaFishing && actor.fishResource) {
                    const fishPt = this.map.latLngToContainerPoint([actor.homePos.lat, actor.homePos.lng]);
                    const fishFrame = Math.floor(tSec * 15 + actor.phase);
                    this.drawStripSprite(
                        'SUCAI_RESOURCE',
                        actor.fishResource,
                        fishFrame,
                        fishPt.x + 12 * zoomFactor,
                        fishPt.y + 6 * zoomFactor,
                        FISH_SCALE_BASE * zoomFactor,
                        peaceFinalAlpha * 0.92
                    );
                }

                const asset = this.assetFor(actor.lib, actor.dir, act);
                if (!asset) continue;
                const box = asset.dirs[String(facing)] ?? asset.dirs['0'];
                if (!box) continue;
                const sheet = asset.sheets[facing] ?? asset.sheets[0];
                if (!sheet || !sheet.complete || !sheet.naturalWidth) continue;

                const fps = act === 'idle' ? 10 : 14;
                const frame = Math.floor(tSec * fps + actor.phase) % Math.max(1, asset.frames);
                const baseScale = actor.isSeaFishing
                    ? SHIP_SCALE_BASE
                    : actor.isAnimal
                        ? ANIMAL_SCALE_BASE
                        : VILLAGER_SCALE_BASE;
                const scale = baseScale * zoomFactor;

                const fw = box.fw;
                const fh = box.fh;
                const dx = pt.x - box.hx * scale;
                const dy = pt.y - box.hy * scale;

                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, peaceFinalAlpha));
                ctx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
                ctx.restore();
            }
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
            name: 'CityLifeAmbientLayer:assets(据点民生与战损素材)',
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
