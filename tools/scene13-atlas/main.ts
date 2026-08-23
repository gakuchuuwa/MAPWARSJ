/**
 * ZOOM 13 战术模式「背景图总览」工具（2026-08-24）。
 *
 * 目的：把生成器能产出的所有战场背景一次性铺开，方便肉眼比对、挑毛病、定优化方向。
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
import { DE_MAP_THEMES, type DeMapThemeId } from '../../src/ui/scene13/Scene13DeMapThemes';
import { Scene13GroundPainter, type GroundPatch, isWaterTile } from '../../src/ui/scene13/Scene13GroundPainter';
import type { Biome, ElevationBand } from '../../src/ui/Scene13Biome';

const TERRAIN_BASE_URL = '/SUCAI_TERRAIN/';
const NATURE_BASE_URL = '/SUCAI_NATURE/';

type Season = 0 | 1 | 2;
type WaterKind = 'sea' | 'lake' | 'river' | 'none';
interface NatureMeta { box_w: number; box_h: number; anchor_x: number; anchor_y: number; frames: number }

/** 每个海拔档给一个代表性米数 + 纬度（喂雪线/树种判定，和实机同一批判据） */
const BANDS: Record<ElevationBand, { m: number; lat: number }> = {
    lowland: { m: 60, lat: 34 },
    hill: { m: 420, lat: 36 },
    plateau: { m: 1600, lat: 38 },
    alpine: { m: 3600, lat: 40 },
};
/**
 * 主题 → 代表性 biome。
 *
 * ⚠ 这张表是**工具侧的假设**，不是引擎权威：实机的 biome 由 detectBiomeAtElevation
 * 按真实经纬度判定，和主题是两条独立的线。工具要定点枚举 18 套主题，就得给每套配一个
 * 说得通的 biome，否则会出现「非洲雨林主题 + 温带森林 biome」这种实机不会有的组合。
 * 如果哪一条你觉得配错了，直接改这里，不影响引擎。
 */
const THEME_BIOME: Record<DeMapThemeId, Biome> = {
    afrotropical_tropical: 'tropical_rainforest',
    neotropical_temperate: 'temperate_forest',
    neotropical_tropical: 'tropical_rainforest',
    nearctic_temperate: 'temperate_forest',
    indomalayan_tropical: 'tropical_rainforest',
    palaearctic_asia_temperate: 'temperate_forest',
    palaearctic_asia_steppe: 'cold_steppe',
    palaearctic_asia_desert: 'desert',
    palaearctic_tibetan_plateau: 'cold_steppe',
    palaearctic_middle_east_desert: 'desert',
    palaearctic_salt_desert: 'desert',
    palaearctic_middle_east_highland: 'mediterranean',
    palaearctic_europe_taiga: 'boreal',
    palaearctic_europe_temperate: 'temperate_forest',
    palaearctic_europe_mediterranean: 'mediterranean',
    australasian_temperate: 'temperate_forest',
    serengeti: 'savanna',
    palustrine_swamp: 'temperate_forest',
};

const SEASON_NAME = ['春夏', '秋', '冬'];
const BAND_NAME: Record<ElevationBand, string> = { lowland: '低地', hill: '丘陵', plateau: '高原', alpine: '雪线' };
const WATER_NAME: Record<WaterKind, string> = { none: '无水', sea: '海岸', lake: '湖', river: '河' };

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

async function loadMeta(asset: string): Promise<NatureMeta | null> {
    if (metaCache.has(asset)) return metaCache.get(asset) ?? null;
    try {
        const r = await fetch(NATURE_BASE_URL + asset + '/_meta.json');
        const m = r.ok ? ((await r.json()) as NatureMeta) : null;
        metaCache.set(asset, m);
        return m;
    } catch {
        metaCache.set(asset, null);
        return null;
    }
}

/** 用实机同一套渲染器把一个方案画成一张图 */
async function renderPlan(plan: Scene13EnvironmentPlan, W: number, H: number): Promise<HTMLCanvasElement> {
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const g = out.getContext('2d')!;

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
    o: { asset: string; x: number; y: number; frame: number; flip: boolean },
    painter: Scene13GroundPainter,
): Promise<void> {
    const meta = await loadMeta(o.asset);
    if (!meta) return;
    const img = await loadImg(NATURE_BASE_URL + o.asset + '/frames.png');
    if (!img) return;
    const fr = meta.frames > 0 ? (o.frame % meta.frames) : 0;
    const sw = meta.box_w;
    const sh = meta.box_h;
    const sx = fr * sw;
    const drawY = o.y - painter.elevationLiftAt(o.x, o.y);
    if (o.flip) {
        g.save();
        g.translate(o.x, drawY);
        g.scale(-1, 1);
        g.drawImage(img, sx, 0, sw, sh, -meta.anchor_x, -meta.anchor_y, sw, sh);
        g.restore();
    } else {
        g.drawImage(img, sx, 0, sw, sh, o.x - meta.anchor_x, drawY - meta.anchor_y, sw, sh);
    }
}

// ── 枚举 & 页面 ────────────────────────────────────────────────

const sel = (id: string) => document.getElementById(id) as HTMLSelectElement;
let seedSalt = 0;

function pick<T extends string>(s: HTMLSelectElement, all: T[]): T[] {
    return s.value === 'all' ? all : [s.value as T];
}

interface Combo {
    theme: DeMapThemeId;
    season: Season;
    band: ElevationBand;
    water: WaterKind;
    siege: boolean;
}

function buildCard(canvas: HTMLCanvasElement, c: Combo, plan: Scene13EnvironmentPlan): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card';
    el.appendChild(canvas);
    const kinds = new Set(plan.objects.filter((o) => o.layer === 'world').map((o) => o.asset));
    const tiles = new Set(plan.terrainPatches.map((p) => p.tile));
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML =
        `<div class="t">${c.theme}</div>` +
        `<div class="k">${SEASON_NAME[c.season]} · ${BAND_NAME[c.band]} · ${WATER_NAME[c.water]} · ${c.siege ? '攻防战' : '野战'}</div>` +
        `<div class="k">拓扑 <code>${plan.topology ?? '-'}</code> · biome <code>${plan.biome}</code></div>` +
        `<div class="k">底图 <code>${plan.baseTerrain}</code> · 斑块 <code>${[...tiles].join(' ') || '无'}</code></div>` +
        `<div class="k">物件 ${plan.objects.length} 个 / ${kinds.size} 种：<code>${[...kinds].slice(0, 8).join(' ')}</code></div>` +
        (plan.objects.length === 0 ? '<div class="warn">⚠ 这张图一个物件都没有</div>' : '');
    el.appendChild(meta);
    return el;
}

async function run(): Promise<void> {
    const grid = document.getElementById('grid')!;
    const stat = document.getElementById('stat')!;
    grid.innerHTML = '';

    const W = parseInt(sel('size').value, 10);
    const H = Math.round(W * 1080 / 2000);
    const themes = Object.keys(DE_MAP_THEMES) as DeMapThemeId[];
    const seasons = (sel('season').value === 'all'
        ? [0, 1, 2]
        : [parseInt(sel('season').value, 10)]) as Season[];
    const bands = pick<ElevationBand>(sel('band'), ['lowland', 'hill', 'plateau', 'alpine']);
    const waters = pick<WaterKind>(sel('water'), ['none', 'sea', 'lake', 'river']);
    const sieges = sel('siege').value === 'all' ? [false, true] : [sel('siege').value === 'siege'];

    const combos: Combo[] = [];
    for (const theme of themes) {
        for (const season of seasons) {
            for (const band of bands) {
                for (const water of waters) {
                    for (const siege of sieges) {
                        combos.push({ theme, season, band, water, siege });
                    }
                }
            }
        }
    }

    stat.textContent = `共 ${combos.length} 张，生成中…`;
    let done = 0;
    for (const c of combos) {
        const { m, lat } = BANDS[c.band];
        const plan = generateEnvironment({
            width: W,
            height: H,
            lat,
            lng: 108,
            seed: `atlas:${c.theme}:${c.season}:${c.band}:${c.water}:${c.siege}:${seedSalt}`,
            forceTheme: c.theme,
            forceElevationBand: c.band,
            forceElevationM: m,
            forceBiome: THEME_BIOME[c.theme],
            forceWaterKind: c.water,
            getCalendarSeason: () => c.season,
            isSiege: c.siege,
        });
        const canvas = await renderPlan(plan, W, H);
        grid.appendChild(buildCard(canvas, c, plan));
        stat.textContent = `共 ${combos.length} 张，已完成 ${++done}`;
        // 用 setTimeout 让出主线程，不用 rAF —— 标签页在后台时 rAF 会被浏览器冻结，
        // 批量生成会卡在第一张不动。
        await new Promise((r) => setTimeout(r, 0));
    }
    stat.textContent = `共 ${combos.length} 张，全部完成`;
}

document.getElementById('run')!.addEventListener('click', () => { void run(); });
document.getElementById('reseed')!.addEventListener('click', () => { seedSalt++; void run(); });
void run();
