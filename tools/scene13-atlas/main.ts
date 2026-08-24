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
import { loadDeMaps } from './de-map';
import type { Biome, ElevationBand } from '../../src/ui/Scene13Biome';

const TERRAIN_BASE_URL = '/SUCAI_TERRAIN/';
const NATURE_BASE_URL = '/SUCAI_NATURE/';

type Season = 0 | 1 | 2;
type WaterKind = 'sea' | 'lake' | 'river' | 'none';
interface NatureMeta { box_w: number; box_h: number; anchor_x: number; anchor_y: number; frames: number }

/** 每个海拔档给一个代表性米数 + 纬度（喂雪线/树种判定，和实机同一批判据） */
const BANDS: Record<ElevationBand, { m: number; lat: number }> = {
    lowland: { m: 60, lat: 34 },
    upland: { m: 420, lat: 36 },
    mountain: { m: 1600, lat: 38 },
    alpine: { m: 3600, lat: 40 },
    high_alpine: { m: 4600, lat: 40 },
    snow: { m: 5400, lat: 42 },
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
// 🔴 键名必须用引擎的 ElevationBand 合法值。曾误写成 hill/plateau，那两个不在引擎表里，
//    treeFactor 之类按 band 查表全落 undefined，丘陵/高原两档的林木预算直接算成 0。
const BAND_NAME: Record<ElevationBand, string> = { lowland: '低地', upland: '丘陵', mountain: '高原', alpine: '雪线', high_alpine: '高山', snow: '雪原' };
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
/** 每次 run() 领一个号；上一批看到号变了就自己退出，避免两批交叉写进网格 */
let runToken = 0;

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

// ── 删除（组合黑名单）────────────────────────────────────────
//
// 「删除」删的是**组合**，不是图片文件——底图是现场算出来的，磁盘上没有对应文件可删。
// 删掉一个组合 = 记下它的稳定编号，以后 atlas 不再生成它。
//
// 🔴 只写 localStorage，不碰任何素材、不碰引擎。随时可恢复，导出的 JSON 才是产物。
//    绝不允许改成真去删 public/SUCAI_* 里的素材。

const BLACKLIST_KEY = 'scene13-atlas-blacklist-v1';

interface DeletedEntry {
    id: number;
    theme: DeMapThemeId;
    season: Season;
    band: ElevationBand;
    water: WaterKind;
    siege: boolean;
    /** 删除时那张图的随机种子——同一组合换种子长相完全不同，记下来才能复现当时看到的画面 */
    seed: number;
    at: string;
}

function loadBlacklist(): Map<number, DeletedEntry> {
    try {
        const raw = localStorage.getItem(BLACKLIST_KEY);
        if (!raw) return new Map();
        const arr = JSON.parse(raw) as DeletedEntry[];
        return new Map(arr.map((e) => [e.id, e]));
    } catch {
        return new Map();
    }
}

const blacklist = loadBlacklist();

function saveBlacklist(): void {
    try {
        localStorage.setItem(BLACKLIST_KEY, JSON.stringify([...blacklist.values()]));
    } catch { /* 存不下就算了，本轮内存里的删除仍然有效 */ }
}

function refreshDeletedUI(): void {
    const n = blacklist.size;
    const el = document.getElementById('delstat');
    if (el) el.textContent = n === 0 ? '未删除任何组合' : `已删 ${n} 个组合`;
    const btn = document.getElementById('undel') as HTMLButtonElement | null;
    if (btn) btn.disabled = n === 0;
    const exp = document.getElementById('export') as HTMLButtonElement | null;
    if (exp) exp.disabled = n === 0;
}

function deleteCombo(c: Combo, card: HTMLElement): void {
    const id = stableComboId(c);
    blacklist.set(id, {
        id, theme: c.theme, season: c.season, band: c.band, water: c.water, siege: c.siege,
        seed: seedSalt, at: new Date().toISOString(),
    });
    saveBlacklist();
    refreshDeletedUI();
    // A/B 模式一个组合有两张卡（a/b），一起撤掉，否则会留下半张孤儿
    for (const el of [...document.querySelectorAll('.card')] as HTMLElement[]) {
        if (el.dataset.comboId === String(id)) el.remove();
    }
    void card;
}

function restoreAll(): void {
    if (blacklist.size === 0) return;
    blacklist.clear();
    saveBlacklist();
    refreshDeletedUI();
    void run();
}

function exportBlacklist(): void {
    const entries = [...blacklist.values()].sort((a, b) => a.id - b.id);
    const payload = {
        note: 'ZOOM13 atlas 手工剔除的战场组合。id = 完整笛卡尔积（18 主题 × 3 季节 × 4 海拔 × 4 水系 × 2 攻防）中的稳定序号。',
        exportedAt: new Date().toISOString(),
        count: entries.length,
        entries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scene13-combo-blacklist-${entries.length}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ── 单图放大层 ────────────────────────────────────────────────

const box = () => document.getElementById('box')!;
const boxImg = () => document.getElementById('boximg') as HTMLImageElement;
const boxMeta = () => document.getElementById('boxmeta')!;
/** 当前放大的是第几张（供 ← → 翻页） */
let zoomIndex = -1;

function openZoom(i: number): void {
    const cards = [...document.querySelectorAll('.card')] as HTMLElement[];
    if (i < 0 || i >= cards.length) return;
    zoomIndex = i;
    const canvas = cards[i].querySelector('canvas') as HTMLCanvasElement;
    // 用 toDataURL 而不是把 canvas 搬进放大层：搬走会让网格里空一格，
    // 而且关掉时还得原样放回去，容易出错。
    boxImg().src = canvas.toDataURL('image/png');
    boxMeta().innerHTML =
        `<span class="k">${i + 1} / ${cards.length}</span>　` +
        (cards[i].querySelector('.meta') as HTMLElement).innerHTML.replace(/<div/g, '<span').replace(/<\/div>/g, '</span>　');
    box().classList.add('on');
}

function closeZoom(): void {
    box().classList.remove('on');
    zoomIndex = -1;
}

function initZoom(): void {
    box().addEventListener('click', closeZoom);
    window.addEventListener('keydown', (e) => {
        if (zoomIndex < 0) return;
        if (e.key === 'Escape') { closeZoom(); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); openZoom(zoomIndex + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); openZoom(zoomIndex - 1); }
    });
}

/**
 * 组合的**稳定编号**：在完整笛卡尔积（18 主题 × 3 季节 × 4 海拔 × 4 水系 × 2 攻防 = 1728）
 * 里的固定序号，与当前筛选条件、A/B 开关、渲染顺序全都无关。
 *
 * 🔴 别改回循环递增。递增号会随筛选条件漂移——今天的 #37 明天指向另一张图，
 *    主人拿它指认「第 37 张不对」就会定位到错误的组合。编号的唯一用途就是稳定指认。
 *
 * 注意：编号只锁定「组合」，不锁定「那一张具体的图」。同一组合换随机种子会长成
 * 完全不同的样子，所以指认时必须连种子一起报（卡片上的 seed 就是干这个的）。
 */
const ALL_SEASONS: Season[] = [0, 1, 2];
const ALL_BANDS: ElevationBand[] = ['lowland', 'upland', 'mountain', 'alpine'];
const ALL_WATERS: WaterKind[] = ['none', 'sea', 'lake', 'river'];

function stableComboId(c: Combo): number {
    const themes = Object.keys(DE_MAP_THEMES) as DeMapThemeId[];
    const ti = themes.indexOf(c.theme);
    const si = ALL_SEASONS.indexOf(c.season);
    const bi = ALL_BANDS.indexOf(c.band);
    const wi = ALL_WATERS.indexOf(c.water);
    return ((((ti * 3 + si) * 4 + bi) * 4 + wi) * 2 + (c.siege ? 1 : 0)) + 1;
}

function stampIndex(canvas: HTMLCanvasElement, label: string): void {
    const g = canvas.getContext('2d');
    if (!g) return;
    const fontSize = Math.max(12, Math.round(canvas.height * 0.06));
    g.font = `bold ${fontSize}px sans-serif`;
    const tm = g.measureText(label);
    const padX = 6, padY = 4;
    const tw = tm.width + padX * 2;
    const th = fontSize + padY * 2;
    const x = canvas.width - tw - 4;
    const y = canvas.height - th - 4;
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(x, y, tw, th);
    g.fillStyle = '#fff';
    g.textBaseline = 'top';
    g.fillText(label, x + padX, y + padY);
}

function buildCard(
    canvas: HTMLCanvasElement,
    c: Combo,
    plan: Scene13EnvironmentPlan,
    moodLabel: string,
    suffix: string = '',
): HTMLElement {
    // 右下角打稳定编号水印。suffix 用于 A/B 模式的 a/b 区分，不参与编号本身。
    const id = stableComboId(c);
    stampIndex(canvas, `#${id}${suffix}`);
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.comboId = String(id);   // 删除时靠它把 A/B 两张卡一起撤掉
    canvas.addEventListener('click', () => {
        const cards = [...document.querySelectorAll('.card')];
        openZoom(cards.indexOf(el));
    });
    const shell = document.createElement('div');
    shell.className = 'shot';
    shell.appendChild(canvas);
    const del = document.createElement('button');
    del.className = 'del';
    del.title = `删除组合 #${id}（只是拉黑不再生成，随时可恢复，不删任何文件）`;
    del.textContent = '×';
    del.addEventListener('click', (e) => {
        e.stopPropagation();   // 别让点击穿透到 canvas 触发放大
        deleteCombo(c, el);
    });
    shell.appendChild(del);
    el.appendChild(shell);
    const kinds = new Set(plan.objects.filter((o) => o.layer === 'world').map((o) => o.asset));
    const tiles = new Set(plan.terrainPatches.map((p) => p.tile));
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML =
        `<div class="t">#${id}${suffix}　${c.theme}　<span style="color:#8fb4d9">${moodLabel}</span></div>` +
        `<div class="k">${SEASON_NAME[c.season]} · ${BAND_NAME[c.band]} · ${WATER_NAME[c.water]} · ${c.siege ? '攻防战' : '野战'}</div>` +
        // 编号只锁组合，种子决定这一次长成什么样——指认问题时两个都要报
        `<div class="k">种子 <code>seed ${seedSalt}</code></div>` +
        `<div class="k">拓扑 <code>${plan.topology ?? '-'}</code> · biome <code>${plan.biome}</code></div>` +
        `<div class="k">底图 <code>${plan.baseTerrain}</code> · 斑块 <code>${[...tiles].join(' ') || '无'}</code></div>` +
        `<div class="k">物件 ${plan.objects.length} 个 / ${kinds.size} 种：<code>${[...kinds].slice(0, 8).join(' ')}</code></div>` +
        (plan.objects.length === 0 ? '<div class="warn">⚠ 这张图一个物件都没有</div>' : '');
    el.appendChild(meta);
    return el;
}

async function run(): Promise<void> {
    const token = ++runToken;
    const grid = document.getElementById('grid')!;
    const stat = document.getElementById('stat')!;
    grid.innerHTML = '';
    closeZoom();

    const W = parseInt(sel('size').value, 10);
    const H = Math.round(W * 1080 / 2000);
    const themes = Object.keys(DE_MAP_THEMES) as DeMapThemeId[];
    const seasons = (sel('season').value === 'all'
        ? [0, 1, 2]
        : [parseInt(sel('season').value, 10)]) as Season[];
    const bands = pick<ElevationBand>(sel('band'), ['lowland', 'upland', 'mountain', 'alpine']);
    const waters = pick<WaterKind>(sel('water'), ['none', 'sea', 'lake', 'river']);
    const sieges = sel('siege').value === 'all' ? [false, true] : [sel('siege').value === 'siege'];

    const combos: Combo[] = [];
    let skipped = 0;
    for (const theme of themes) {
        for (const season of seasons) {
            for (const band of bands) {
                for (const water of waters) {
                    for (const siege of sieges) {
                        const c: Combo = { theme, season, band, water, siege };
                        // 已删组合直接不生成——省掉整张渲染，不是画完再藏
                        if (blacklist.has(stableComboId(c))) { skipped++; continue; }
                        combos.push(c);
                    }
                }
            }
        }
    }

    const skipNote = skipped > 0 ? `（跳过已删 ${skipped}）` : '';
    stat.textContent = `共 ${combos.length} 张${skipNote}，生成中…`;

    // ── DE 真图排在最前 ──
    // 这些是 AoE2 DE 自己跑官方 RMS 生成的地图，用实机同一套渲染器画出来。
    // 放在最前面就是为了让「DE 算的」和「我们算的」一眼能对上。
    console.log('[DE] loading…');
    const deMaps = await loadDeMaps(W, H);
    console.log('[DE] loaded', deMaps.length, deMaps.map(d => ({
        base: d.plan.baseTerrain, patches: d.plan.terrainPatches.length,
        cells: d.plan.terrainPatches.reduce((n, p) => n + p.cells.length, 0),
        objs: d.plan.objects.length, grid: d.plan.grid })));
    for (const de of deMaps) {
        console.log('[DE] rendering', de.label);
        if (token !== runToken) return;
        const t0 = performance.now();
        const canvas = await renderPlan(de.plan, W, H);
        console.log('[DE] rendered in', Math.round(performance.now() - t0), 'ms');
        const card = document.createElement('div');
        card.className = 'card';
        const shell = document.createElement('div');
        shell.className = 'shot';
        shell.appendChild(canvas);
        card.appendChild(shell);
        canvas.addEventListener('click', () => {
            const cards = [...document.querySelectorAll('.card')];
            openZoom(cards.indexOf(card));
        });
        const skippedTop = Object.entries(de.stats.skipped)
            .sort((a, b) => b[1] - a[1]).slice(0, 4)
            .map(([k, v]) => `${k}×${v}`).join(' ');
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML =
            `<div class="t" style="color:#7fd18b">★ DE 原图　${de.label}</div>` +
            `<div class="k">AoE2 DE 场景编辑器跑官方 RMS 生成，原样导出，无任何近似</div>` +
            `<div class="k">地形 ${de.stats.terrainKinds} 种 · 底图 <code>${de.plan.baseTerrain}</code> · 斑块 ${de.plan.terrainPatches.length} 片</div>` +
            `<div class="k">物件 ${de.stats.objects} 个，已画 ${de.stats.drawn}</div>` +
            (skippedTop ? `<div class="k">未画：<code>${skippedTop}</code></div>` : '');
        card.appendChild(meta);
        grid.appendChild(card);
        await new Promise((r) => setTimeout(r, 0));
    }
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
        if (token !== runToken) return;   // 已被新的一批接管，立刻收手
        grid.appendChild(buildCard(canvas, c, plan, ''));
        stat.textContent = `共 ${combos.length} 张${skipNote}，已完成 ${++done}`;
        // 用 setTimeout 让出主线程，不用 rAF —— 标签页在后台时 rAF 会被浏览器冻结，
        // 批量生成会卡在第一张不动。
        await new Promise((r) => setTimeout(r, 0));
    }
    if (token === runToken) stat.textContent = `共 ${combos.length} 张${skipNote}，全部完成`;
}

function applyCols(): void {
    const grid = document.getElementById('grid')!;
    const v = sel('cols').value;
    grid.className = v === 'auto' ? '' : 'c' + v;
}

document.getElementById('run')!.addEventListener('click', () => { void run(); });
document.getElementById('undel')!.addEventListener('click', restoreAll);
document.getElementById('export')!.addEventListener('click', exportBlacklist);
refreshDeletedUI();
document.getElementById('reseed')!.addEventListener('click', () => { seedSalt++; void run(); });
// 换列数只改 CSS，不必重新生成
sel('cols').addEventListener('change', applyCols);
applyCols();
initZoom();
void run();
