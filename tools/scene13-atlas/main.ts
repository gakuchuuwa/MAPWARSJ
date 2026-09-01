/**
 * ZOOM 13 战术模式「背景图总览」工具（2026-08-24 重做）。
 *
 * 目的：按**真实城池位置**出图，一眼看出洛阳、敦煌、拉萨各自长什么样。
 *
 * 🔴 [2026-08-24 主人定稿] 旧版枚举「18 主题 × 3 季节 × 4 海拔 × 4 水系 × 2 攻防 = 1728」
 *    种组合，那套 DE 主题是抽随机地图用的、**跟真实地理没关系**，
 *    看一堆不存在的排列没有意义。现在改成遍历 942 座真实城池，
 *    底图由 public/world/world-base.png 按真实气候数据查表决定。
 *
 * 铁律：渲染必须走 Scene13GroundPainter —— 和游戏实机是同一份代码。工具里看到什么，
 * 游戏里就是什么；在这里调好的参数，改的也是同一处常量。绝不在工具里另写一份渲染。
 *
 * 不画的东西：士兵、尸体、旗帜、水面动画（那些属于战斗层，与背景观感无关）。
 * 画的东西：铺底地形 + 高程抬升 + 地形斑块 + 高程方向光 + 全部自然装饰精灵。
 */
import {
    generateEnvironment,
    type Scene13EnvironmentPlan,
} from '../../src/ui/scene13/Scene13EnvironmentGenerator';
import { setWorldBaseData, queryBaseTile } from '../../src/ui/scene13/WorldBaseMap';
import { pickTree } from '../../src/ui/scene13/TreeAssignment';
import { CITIES_V2, type CityDataV2 } from '../../src/data/cities_v2';
import { Scene13GroundPainter, type GroundPatch, isWaterTile } from '../../src/ui/scene13/Scene13GroundPainter';
import { loadDeMaps } from './de-map';

const TERRAIN_BASE_URL = '/SUCAI_TERRAIN/';
const NATURE_BASE_URL = '/SUCAI_NATURE/';
const BUILDING_BASE_URL = '/SUCAI_BUILDING/';

type Season = 0 | 1 | 2;
type WaterKind = 'sea' | 'lake' | 'river' | 'none';
interface NatureMeta { box_w: number; box_h: number; anchor_x: number; anchor_y: number; frames: number }

const SEASON_NAME = ['春夏', '秋', '冬'];
const WATER_NAME: Record<WaterKind, string> = { none: '无水', sea: '海岸', lake: '湖', river: '河' };

/** 文化区建筑风格对应 */
const REGION_BUILDING_STYLE: Record<string, string> = {
    'zhongyuan': 'EAST', 'jiangnan': 'EAST', 'lingnan': 'EAST', 'sichuan': 'EAST',
    'guanzhong': 'EAST', 'shandong': 'EAST', 'hebei': 'EAST', 'shanxi': 'EAST',
    'hubian': 'EAST', 'dongnan': 'EAST', 'xinan': 'EAST', 'taiwan': 'EAST',
    'korea': 'EAST', 'japan': 'EAST',
    'west_europe': 'WEST', 'east_europe': 'EAST_EUROPE', 'mediterranean': 'MEDITERRANEAN',
    'middle_east': 'MESO', 'central_asia': 'CENTRAL_ASIA', 'south_asia': 'SOUTH_ASIA',
    'southeast_asia': 'SOUTHEAST_ASIA', 'africa': 'AFRI', 'steppe': 'STEPPE',
};

/** 素材缓存：整个工具共用，几十张图只加载一次 */
const imgCache = new Map<string, HTMLImageElement | null>();
const metaCache = new Map<string, NatureMeta | null>();

function loadImg(url: string): Promise<HTMLImageElement | null> {
    if (imgCache.has(url)) return Promise.resolve(imgCache.get(url) ?? null);
    return new Promise((res) => {
        const im = new Image();
        im.onload = () => { imgCache.set(url, im); res(im); };
        im.onerror = () => { imgCache.set(url, null); res(null); };
        im.src = url;
    });
}

async function loadMeta(asset: string, isBuilding: boolean = false): Promise<NatureMeta | null> {
    const key = (isBuilding ? 'B:' : 'N:') + asset;
    if (metaCache.has(key)) return metaCache.get(key) ?? null;
    try {
        const base = isBuilding ? BUILDING_BASE_URL : NATURE_BASE_URL;
        const r = await fetch(base + asset + '/_meta.json');
        const m = r.ok ? ((await r.json()) as NatureMeta) : null;
        metaCache.set(key, m);
        return m;
    } catch {
        metaCache.set(key, null);
        return null;
    }
}

/** 用实机同一套渲染器把一个方案画成一张图 */
async function renderPlan(
    plan: Scene13EnvironmentPlan,
    W: number,
    H: number,
): Promise<HTMLCanvasElement> {
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    // willReadFrequently：末尾的 mood 调色要整幅回读，不带这个标志每张图都触发 GPU→CPU 回传
    const g = out.getContext('2d', { willReadFrequently: true })!;

    const painter = new Scene13GroundPainter();
    painter.setGrid(plan.grid.ox, plan.grid.oy, plan.grid.gw, plan.grid.gh, plan.elevation);

    // 1. 铺底（含高程抬升）。先把贴图预热进浏览器缓存，setTerrain 内部那次 new Image()
    //    才能同步命中，否则第一帧铺出来是空的。
    await loadImg(TERRAIN_BASE_URL + plan.baseTerrain + '.png');
    painter.setTerrain(plan.baseTerrain, W, H);
    await new Promise((r) => setTimeout(r, 0));
    painter.paintTerrain();
    if (painter.terrain) g.drawImage(painter.terrain, 0, 0);

    // 2. 地形斑块（走 paintPatch，撕边/缓存逻辑与实机完全一致）
    for (const p of plan.terrainPatches) {
        const img = await loadImg(TERRAIN_BASE_URL + p.tile + '.png');
        if (!img) continue;
        const patch: GroundPatch = {
            tile: p.tile,
            img,
            cells: p.cells,
            polygon: p.polygon,
            alpha: p.alpha,
            blur: p.blur,
            isWater: isWaterTile(p.tile),
        };
        painter.paintPatch(g, patch, W, H);
    }

    // 3. 地面贴花（ground 层精灵）
    const groundObjs = plan.objects
        .filter((o) => o.layer === 'ground')
        .sort((a, b) => (a.z - b.z) || (a.y - b.y));
    for (const o of groundObjs) await drawSprite(g, o, painter);

    // 4. 高程方向光（盖住地面与贴花，与实机同序）
    painter.paintShading(g, W, H);

    // 5. 世界对象（树/石/资源），按抬升后的脚点 y 排序
    const worldObjs = plan.objects
        .filter((o) => o.layer === 'world')
        .sort((a, b) =>
            (a.y - painter.elevationLiftAt(a.x, a.y)) - (b.y - painter.elevationLiftAt(b.x, b.y)));
    for (const o of worldObjs) await drawSprite(g, o, painter);

    return out;
}

async function drawSprite(
    g: CanvasRenderingContext2D,
    o: { asset: string; x: number; y: number; frame: number; flip: boolean; scale?: number },
    painter: Scene13GroundPainter,
): Promise<void> {
    const isBuilding = o.asset.startsWith('BUILDING:');
    const assetName = isBuilding ? o.asset.slice('BUILDING:'.length) : o.asset;
    const meta = await loadMeta(assetName, isBuilding);
    if (!meta) return;
    const base = isBuilding ? BUILDING_BASE_URL : NATURE_BASE_URL;
    const imgUrl = isBuilding ? base + assetName + '/preview.png' : base + assetName + '/frames.png';
    const img = await loadImg(imgUrl);
    if (!img) return;
    const fr = meta.frames > 0 && !isBuilding ? (o.frame % meta.frames) : 0;
    const sw = isBuilding ? (img.naturalWidth || meta.box_w) : meta.box_w;
    const sh = isBuilding ? (img.naturalHeight || meta.box_h) : meta.box_h;
    const sx = isBuilding ? 0 : fr * sw;
    const scale = o.scale ?? 1;
    const drawY = o.y - painter.elevationLiftAt(o.x, o.y);
    const dw = sw * scale;
    const dh = sh * scale;
    const ax = meta.anchor_x * scale;
    const ay = meta.anchor_y * scale;
    if (o.flip) {
        g.save();
        g.translate(o.x, drawY);
        g.scale(-1, 1);
        g.drawImage(img, sx, 0, sw, sh, -ax, -ay, dw, dh);
        g.restore();
    } else {
        g.drawImage(img, sx, 0, sw, sh, o.x - ax, drawY - ay, dw, dh);
    }
}

/** 生成攻城战城防城墙与建筑群 */
function generateSiegeBuildings(city: CityDataV2, W: number, H: number): Array<{ asset: string; x: number; y: number; frame: number; flip: boolean; layer: string; z: number; scale?: number }> {
    const objs: Array<{ asset: string; x: number; y: number; frame: number; flip: boolean; layer: string; z: number; scale?: number }> = [];
    const style = REGION_BUILDING_STYLE[city.region ?? ''] ?? 'EAST';
    const wallMat = city.tier === 0 ? 'FORTIFIED' : (city.tier === 4 ? 'PALISADE' : 'STONE');
    const wBase = wallMat === 'PALISADE' ? 'ARCHAIC_WALL_PALISADE' : `${style}_WALL_${wallMat}`;
    const gBase = wallMat === 'PALISADE' ? 'DARK_GATE_PALISADE' : `${style}_GATE_${wallMat}`;
    const wallPost = wallMat === 'STONE' ? `${style}_WALL_POST` : (wallMat === 'PALISADE' ? 'DARK_WALL_PALISADE_POST' : `${wBase}_POST`);

    const wallFrontX = Math.round(W * 0.62);
    const midY = H * 0.50;
    const pitch = 36 * (H / 1080);
    const pitchDx = 48 * (W / 1920);
    const pitchDy = 24 * (H / 1080);
    const topWallY = midY - 8.5 * pitch;
    const botWallY = midY + 8.5 * pitch;

    // 1. 北翼城门及斜墙
    objs.push({ asset: 'BUILDING:' + gBase + '_NE', x: wallFrontX + 65, y: topWallY - 32, frame: 0, flip: false, layer: 'world', z: 1, scale: 0.9 });
    for (let k = 1; k <= 10; k++) {
        objs.push({ asset: 'BUILDING:' + wBase + '_NE', x: wallFrontX + 130 + k * pitchDx, y: topWallY - 64 - k * pitchDy, frame: 0, flip: false, layer: 'world', z: 1, scale: 0.9 });
    }
    objs.push({ asset: 'BUILDING:' + wallPost, x: wallFrontX + 130 + 11 * pitchDx, y: topWallY - 64 - 11 * pitchDy, frame: 0, flip: false, layer: 'world', z: 1, scale: 0.9 });

    // 2. 正面主城墙
    for (let i = -8.5; i <= 8.5; i += 1.0) {
        objs.push({ asset: 'BUILDING:' + wBase + '_N', x: wallFrontX, y: midY + i * pitch, frame: 0, flip: false, layer: 'world', z: 1, scale: 0.9 });
    }

    // 3. 南翼城门及斜墙
    objs.push({ asset: 'BUILDING:' + gBase + '_SE', x: wallFrontX + 65, y: botWallY + 32, frame: 0, flip: false, layer: 'world', z: 1, scale: 0.9 });
    for (let k = 1; k <= 10; k++) {
        objs.push({ asset: 'BUILDING:' + wBase + '_SE', x: wallFrontX + 130 + k * pitchDx, y: botWallY + 64 + k * pitchDy, frame: 0, flip: false, layer: 'world', z: 1, scale: 0.9 });
    }
    objs.push({ asset: 'BUILDING:' + wallPost, x: wallFrontX + 130 + 11 * pitchDx, y: botWallY + 64 + 11 * pitchDy, frame: 0, flip: false, layer: 'world', z: 1, scale: 0.9 });

    // 4. 4座并列箭塔
    const towerAsset = city.tier === 0 ? `${style}_TOWER_AGE4` : (city.tier === 4 ? `${style}_TOWER_AGE2` : `${style}_TOWER_AGE3`);
    const towerX = wallFrontX + 55;
    for (const frac of [0.125, 0.375, 0.625, 0.875]) {
        objs.push({ asset: 'BUILDING:' + towerAsset, x: towerX, y: topWallY + (botWallY - topWallY) * frac, frame: 0, flip: false, layer: 'world', z: 1, scale: 0.8 });
    }

    // 5. 城内建筑群
    const bTypes = ['TOWN_CENTER_AGE4', 'BARRACKS_AGE3', 'BLACKSMITH_AGE3', 'MARKET_AGE3', 'HOUSE_AGE3', 'STABLE_AGE3', 'ARCHERY_RANGE_AGE3', 'HOUSE_AGE3'];
    const spots = [
        { x: W * 0.76, y: H * 0.30 }, { x: W * 0.86, y: H * 0.32 },
        { x: W * 0.74, y: H * 0.50 }, { x: W * 0.84, y: H * 0.52 },
        { x: W * 0.75, y: H * 0.70 }, { x: W * 0.85, y: H * 0.72 },
        { x: W * 0.92, y: H * 0.42 }, { x: W * 0.92, y: H * 0.60 },
    ];
    for (let i = 0; i < Math.min(bTypes.length, spots.length); i++) {
        const aName = `${style}_${bTypes[i]}`;
        objs.push({ asset: 'BUILDING:' + aName, x: spots[i].x, y: spots[i].y, frame: 0, flip: false, layer: 'world', z: 1, scale: 0.75 });
    }

    return objs;
}
// ── 城池枚举 & 页面 ──────────────────────────────────────────

const sel = (id: string) => document.getElementById(id) as HTMLSelectElement;
let seedSalt = 0;
/** 每次 run() 领一个号；上一批看到号变了就自己退出，避免两批交叉写进网格 */
let runToken = 0;

/**
 * 全部据点。id 天然唯一，直接当稳定编号用。
 *
 * 🔴 必须用 CITIES_V2（942 座 / 23 个文化区）这个全量导出。
 *    曾错拼 T0_CAPITALS+T1_MEDIUM_CITIES+T2_STRATEGIC+PERIPHERY，
 *    那只有 362 座、**全是东亚 14 区**——欧洲、西亚、非洲、美洲一座都没有，
 *    工具打开一看清一色中国城，等于白做（主人连着点了两次）。
 */
const RAW_CITIES: CityDataV2[] = CITIES_V2;

/**
 * 按文化区轮转重排。
 *
 * 🔴 数据文件里中原/江南的城排在最前，直接取前 N 张会**全是中国城**，
 *    看不到全世界长什么样——这正是这个工具存在的意义。
 *    轮转后第一屏就能铺开尽可能多的地区。
 */
function interleaveByRegion(list: CityDataV2[]): CityDataV2[] {
    const buckets = new Map<string, CityDataV2[]>();
    for (const c of list) {
        const k = c.region ?? '?';
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k)!.push(c);
    }
    // 🔴 区的顺序也要打散：18 个文化区里 14 个在东亚，
    //    照数据文件顺序轮转，第一屏依然清一色东亚（主人实测点出）。
    //    按各区的平均经度排序，从东亚一路铺到欧洲，第一屏就横跨欧亚。
    const queues = [...buckets.entries()]
        .map(([k, v]) => ({
            k, v,
            lng: v.reduce((a, c) => a + c.lng, 0) / v.length,
        }))
        .sort((a, b) => b.lng - a.lng)
        .map((e) => e.v);
    const out: CityDataV2[] = [];
    for (let i = 0; out.length < list.length; i++) {
        let moved = false;
        for (const q of queues) {
            if (i < q.length) { out.push(q[i]); moved = true; }
        }
        if (!moved) break;
    }
    return out;
}

const ALL_CITIES: CityDataV2[] = interleaveByRegion(RAW_CITIES);

const TIER_NAME: Record<number, string> = { 0: '大城', 1: '中城', 2: '关隘', 4: '周边' };

// ── 底图 × 树 组合枚举 ────────────────────────────────────────
//
// 主人 2026-08-24：「每张底图配了哪些树，都要做出图，相同的素材搭配设计一张图」。
// 所以这里按 (底图, 树, 攻城/野战) 去重，每种搭配只出一张，取第一座命中的城当代表点。
//
// 🔴 树查的是**当地野战底图**，不是脚下这张——和引擎的 vegetationTile 同口径。
//    攻城战底图是「城郊被踩踏的裸土」，不代表这里能长什么，
//    照它查树会让 149/942 座城的攻城战树比野战还多（实测过）。

interface Combo {
    /** 脚下这张底图 */
    base: string;
    /** 这张图上长的树 */
    tree: string;
    isSiege: boolean;
    /** 代表城（出图用它的坐标） */
    city: CityDataV2;
}

function enumerateCombos(season: Season, sieges: boolean[]): Combo[] {
    const seen = new Map<string, Combo>();
    for (const city of ALL_CITIES) {
        for (const isSiege of sieges) {
            const base = queryBaseTile({
                lat: city.lat, lng: city.lng, isSiege, isWinter: season === 2,
            });
            if (!base) continue;
            const veg = queryBaseTile({
                lat: city.lat, lng: city.lng, isSiege: false, isWinter: season === 2,
            }) ?? base;
            const tree = pickTree({ baseTile: veg, lat: city.lat, lng: city.lng, season, isSiege });
            const key = base + '|' + tree + '|' + (isSiege ? 'S' : 'F');
            if (!seen.has(key)) seen.set(key, { base, tree, isSiege, city });
        }
    }
    // 同一张底图的搭配排在一起，攻城在前，树名字典序
    return [...seen.values()].sort((a, b) =>
        a.base.localeCompare(b.base)
        || Number(b.isSiege) - Number(a.isSiege)
        || a.tree.localeCompare(b.tree));
}

// ── 世界底图查找表：浏览器侧加载并注入 ────────────────────────
// 不注入的话 generateEnvironment 会回退到旧的主题逻辑，底图就不是按真实地理选的了，
// 卡片上会标「未走真实地理表」提醒。
let worldBaseReady = false;
async function loadWorldBase(): Promise<void> {
    if (worldBaseReady) return;
    const img = await loadImg('/world/world-base.png');
    if (!img) { console.warn('[atlas] world-base.png 加载失败，底图回退到旧逻辑'); return; }
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const g = cv.getContext('2d', { willReadFrequently: true })!;
    g.drawImage(img, 0, 0);
    const id = g.getImageData(0, 0, cv.width, cv.height);
    setWorldBaseData(id.data, cv.width, cv.height);
    worldBaseReady = true;
    console.log('[atlas] world-base 已载入 ' + cv.width + 'x' + cv.height);
    fillBases();   // 底图列表要查表才知道，必须等这里载完
}

// ── 标记（据点黑名单）──────────────────────────────────────
// 标记的是「这座城的底图配得不合适」这条意见，不是删城，更不是删素材文件。
// 只写 localStorage，随时可恢复，导出的 JSON 才是产物。

const BLACKLIST_KEY = 'scene13-atlas-city-blacklist-v2';

interface DeletedEntry {
    id: string; name: string; region: string;
    lat: number; lng: number; base: string;
    season: number; siege: boolean; at: string;
}

function loadBlacklist(): Map<string, DeletedEntry> {
    try {
        const raw = localStorage.getItem(BLACKLIST_KEY);
        if (!raw) return new Map();
        return new Map((JSON.parse(raw) as DeletedEntry[]).map((e) => [e.id, e]));
    } catch { return new Map(); }
}
const blacklist = loadBlacklist();

function saveBlacklist(): void {
    try { localStorage.setItem(BLACKLIST_KEY, JSON.stringify([...blacklist.values()])); }
    catch { /* 存不下也不影响本轮 */ }
}

function refreshDeletedUI(): void {
    const n = blacklist.size;
    const el = document.getElementById('delstat');
    if (el) el.textContent = n === 0 ? '未标记任何据点' : '已标记 ' + n + ' 座';
    for (const id of ['undel', 'export']) {
        const b = document.getElementById(id) as HTMLButtonElement | null;
        if (b) b.disabled = n === 0;
    }
}

function restoreAll(): void {
    if (blacklist.size === 0) return;
    blacklist.clear(); saveBlacklist(); refreshDeletedUI(); void run();
}

function exportBlacklist(): void {
    const entries = [...blacklist.values()].sort((a, b) => a.id.localeCompare(b.id));
    const blob = new Blob([JSON.stringify({
        note: '在 atlas 里被标记「底图不合适」的据点。id 对应 cities_v2.ts。',
        exportedAt: new Date().toISOString(), count: entries.length, entries,
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scene13-city-blacklist-' + entries.length + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ── 单图放大层 ────────────────────────────────────────────────

const box = () => document.getElementById('box')!;
const boxImg = () => document.getElementById('boximg') as HTMLImageElement;
const boxMeta = () => document.getElementById('boxmeta')!;
let zoomIndex = -1;

function openZoom(i: number): void {
    const cards = [...document.querySelectorAll('.card')] as HTMLElement[];
    if (i < 0 || i >= cards.length) return;
    zoomIndex = i;
    const canvas = cards[i].querySelector('canvas') as HTMLCanvasElement;
    boxImg().src = canvas.toDataURL('image/png');
    const metaHtml = (cards[i].querySelector('.meta') as HTMLElement).innerHTML
        .split('<div').join('<span').split('</div>').join('</span>');
    boxMeta().innerHTML = '<span class="k">' + (i + 1) + ' / ' + cards.length + '</span>　' + metaHtml;
    box().classList.add('on');
}
function closeZoom(): void { box().classList.remove('on'); zoomIndex = -1; }
function initZoom(): void {
    box().addEventListener('click', closeZoom);
    window.addEventListener('keydown', (e) => {
        if (zoomIndex < 0) return;
        if (e.key === 'Escape') { closeZoom(); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); openZoom(zoomIndex + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); openZoom(zoomIndex - 1); }
    });
}

// ── 卡片 ──────────────────────────────────────────────────────

function buildCard(
    canvas: HTMLCanvasElement,
    city: CityDataV2,
    plan: Scene13EnvironmentPlan,
    season: Season,
    siege: boolean,
    /** 组合模式：这张图代表的「底图 × 树」搭配 */
    combo?: Combo,
): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cityId = city.id;

    const shell = document.createElement('div');
    shell.className = 'shot';
    shell.appendChild(canvas);
    canvas.addEventListener('click', () => {
        openZoom([...document.querySelectorAll('.card')].indexOf(card));
    });
    const del = document.createElement('button');
    del.className = 'del';
    del.title = '标记「' + city.name + '」底图不合适（只记意见，可恢复，不删任何文件）';
    del.textContent = '×';
    del.addEventListener('click', (e) => {
        e.stopPropagation();
        blacklist.set(city.id, {
            id: city.id, name: city.name, region: city.region ?? '?',
            lat: city.lat, lng: city.lng, base: plan.baseTerrain,
            season, siege, at: new Date().toISOString(),
        });
        saveBlacklist(); refreshDeletedUI();
        for (const el of [...document.querySelectorAll('.card')] as HTMLElement[]) {
            if (el.dataset.cityId === city.id) el.remove();
        }
    });
    shell.appendChild(del);
    const copy = document.createElement('button');
    copy.className = 'copy';
    copy.title = '复制图片到剪贴板';
    copy.textContent = '📋';
    copy.addEventListener('click', (e) => {
        e.stopPropagation();
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                copy.textContent = '✓';
                setTimeout(() => { copy.textContent = '📋'; }, 1200);
            } catch {
                copy.textContent = '✗';
                setTimeout(() => { copy.textContent = '📋'; }, 1200);
            }
        }, 'image/png');
    });
    shell.appendChild(copy);
    card.appendChild(shell);

    const kinds = new Set(plan.objects.filter((o) => o.layer === 'world').map((o) => o.asset));
    const tiles = new Set(plan.terrainPatches.map((p) => p.tile));
    const warnBase = worldBaseReady ? '' : ' <span class="warn">(未走真实地理表)</span>';
    const meta = document.createElement('div');
    meta.className = 'meta';
    // 组合模式下标题是「底图 + 树」，城只是代表点；城池模式下标题是城名
    const head = combo
        ? '<div class="t"><code style="color:#ffd76a">' + combo.base + '</code>'
            + ' <span style="color:#9a917f">配</span> '
            + '<code style="color:#8fe08f">' + combo.tree + '</code>'
            + '　<span style="color:#7fd18b">' + (siege ? '攻防战' : '野战') + '</span>　'
            + SEASON_NAME[season] + '</div>'
            + '<div class="k">代表点 ' + city.name + '（' + (city.region ?? '?') + '） · '
            + city.lat.toFixed(2) + ', ' + city.lng.toFixed(2) + '</div>'
        : '<div class="t">' + city.name + '　<span style="color:#8fb4d9">' + (TIER_NAME[city.tier ?? 4] ?? '') + '</span>'
            + '　<span style="color:#7fd18b">' + (siege ? '攻防战' : '野战') + '</span>　' + SEASON_NAME[season] + '</div>'
            + '<div class="k">' + (city.region ?? '?') + ' · ' + city.lat.toFixed(2) + ', ' + city.lng.toFixed(2) + '</div>';
    meta.innerHTML =
        head
        + '<div class="k">底图 <code>' + plan.baseTerrain + '</code>' + warnBase + '</div>'
        + '<div class="k">斑块 <code>' + ([...tiles].join(' ') || '无') + '</code></div>'
        + '<div class="k">物件 ' + plan.objects.length + ' 个 / ' + kinds.size + ' 种</div>'
        + (plan.objects.length === 0 ? '<div class="warn">⚠ 一个物件都没有</div>' : '');
    card.appendChild(meta);
    return card;
}

// ── 主流程 ────────────────────────────────────────────────────

async function run(): Promise<void> {
    const token = ++runToken;
    const grid = document.getElementById('grid')!;
    const stat = document.getElementById('stat')!;
    grid.innerHTML = '';
    closeZoom();
    stat.textContent = '载入世界底图表…';
    await loadWorldBase();
    if (token !== runToken) return;

    const W = parseInt(sel('size').value, 10);
    const H = Math.round(W * 1080 / 2000);
    const season = parseInt(sel('season').value, 10) as Season;
        const siegeSel = sel('siege').value;
    const regionSel = sel('region').value;
    const tierSel = sel('tier').value;
    const baseSel = sel('base').value;
    const limit = parseInt(sel('limit').value, 10);
    const query = (document.getElementById('search') as HTMLInputElement)?.value?.trim().toLowerCase() ?? '';
    const showBuildings = (document.getElementById('buildings') as HTMLInputElement)?.checked ?? true;

    const sieges = siegeSel === 'all' ? [true, false] : [siegeSel === 'siege'];

    // ── 组合模式：按「底图 × 树」去重，每种搭配一张 ──
    if (sel('mode').value === 'combo') {
        let combos = enumerateCombos(season, sieges);
        if (baseSel !== 'all') combos = combos.filter((c) => c.base === baseSel);
        if (limit > 0) combos = combos.slice(0, limit);

        const baseCount = new Set(combos.map((c) => c.base)).size;
        stat.textContent = baseCount + ' 张底图 / ' + combos.length + ' 种搭配，生成中…';
        let n = 0;
                for (const combo of combos) {
            const { city, isSiege } = combo;
            const plan = generateEnvironment({
                width: W, height: H,
                lat: city.lat, lng: city.lng,
                seed: 'atlas:' + city.id + ':' + season + ':' + isSiege + ':' + seedSalt,
                getCalendarSeason: () => season,
                isSiege,
            });
            if (isSiege && showBuildings) {
                const bObjs = generateSiegeBuildings(city, W, H);
                (plan.objects as any).push(...bObjs);
            }
            const canvas = await renderPlan(plan, W, H);
            if (token !== runToken) return;
            grid.appendChild(buildCard(canvas, city, plan, season, isSiege, combo));
            stat.textContent = baseCount + ' 张底图 / ' + combos.length
                + ' 种搭配，已完成 ' + (++n);
            await new Promise((r) => setTimeout(r, 0));
        }
        if (token === runToken) {
            stat.textContent = baseCount + ' 张底图 / ' + combos.length + ' 种搭配，全部完成';
        }
        return;
    }

        // ── 城池模式 ──
    let cities = ALL_CITIES.filter((c) => !blacklist.has(c.id));
    if (query) {
        cities = cities.filter((c) => 
            c.name.toLowerCase().includes(query) || 
            c.id.toLowerCase().includes(query) || 
            (c.pinyin && c.pinyin.toLowerCase().includes(query)) ||
            (c.region && c.region.toLowerCase().includes(query))
        );
    } else {
        if (regionSel !== 'all') cities = cities.filter((c) => c.region === regionSel);
        if (tierSel !== 'all') cities = cities.filter((c) => String(c.tier ?? 4) === tierSel);
        if (limit > 0) cities = cities.slice(0, limit);
    }

    const total = cities.length * sieges.length;
    stat.textContent = '共 ' + total + ' 张，生成中…';
    let done = 0;

    for (const city of cities) {
        for (const siege of sieges) {
            const plan = generateEnvironment({
                width: W, height: H,
                lat: city.lat, lng: city.lng,
                seed: 'atlas:' + city.id + ':' + season + ':' + siege + ':' + seedSalt,
                getCalendarSeason: () => season,
                isSiege: siege,
            });
            if (siege && showBuildings) {
                const bObjs = generateSiegeBuildings(city, W, H);
                (plan.objects as any).push(...bObjs);
            }
            const canvas = await renderPlan(plan, W, H);
            if (token !== runToken) return;
            grid.appendChild(buildCard(canvas, city, plan, season, siege));
            stat.textContent = '共 ' + total + ' 张，已完成 ' + (++done);
            // setTimeout 而非 rAF：标签页在后台时 rAF 会被冻结，批量生成会卡住
            await new Promise((r) => setTimeout(r, 0));
        }
    }
    if (token === runToken) stat.textContent = '共 ' + total + ' 张，全部完成';
}

function applyCols(): void {
    const grid = document.getElementById('grid')!;
    const v = sel('cols').value;
    grid.className = v === 'auto' ? '' : 'c' + v;
}

/** 文化区下拉：从据点数据里现取，不另维护一张表 */
function fillRegions(): void {
    const s = sel('region');
    const regions = [...new Set(ALL_CITIES.map((c) => c.region).filter(Boolean))].sort() as string[];
    for (const r of regions) {
        const o = document.createElement('option');
        o.value = r; o.textContent = r;
        s.appendChild(o);
    }
}

/** 底图下拉：把 26 张底图现枚举出来，不另维护一张表 */
function fillBases(): void {
    const s = sel('base');
    const bases = new Set<string>();
    for (const c of ALL_CITIES) {
        for (const isSiege of [true, false]) {
            for (const w of [false, true]) {
                const b = queryBaseTile({ lat: c.lat, lng: c.lng, isSiege, isWinter: w });
                if (b) bases.add(b);
            }
        }
    }
    for (const b of [...bases].sort()) {
        const o = document.createElement('option');
        o.value = b; o.textContent = b;
        s.appendChild(o);
    }
}

/**
 * 切模式时把过滤条件调到该模式该有的默认值。
 * 组合模式的意义就是**看全**——主人要的是「每张底图配了哪些树都要出图」，
 * 被「24 张」和「只攻防战」截掉就白做了。
 */
function applyModeDefaults(): void {
    if (sel('mode').value === 'combo') {
        sel('siege').value = 'all';
        sel('limit').value = '0';
    }
}
sel('mode').addEventListener('change', () => { applyModeDefaults(); void run(); });
applyModeDefaults();

document.getElementById('run')!.addEventListener('click', () => { void run(); });
document.getElementById('search')?.addEventListener('input', () => { void run(); });
document.getElementById('buildings')?.addEventListener('change', () => { void run(); });
document.getElementById('reseed')!.addEventListener('click', () => { seedSalt++; void run(); });
document.getElementById('undel')!.addEventListener('click', restoreAll);
document.getElementById('export')!.addEventListener('click', exportBlacklist);
sel('cols').addEventListener('change', applyCols);
fillRegions();
// 底图下拉要等 world-base 载入后才有数据，run() 里首次载入完再填
refreshDeletedUI();
applyCols();
initZoom();
void run();
