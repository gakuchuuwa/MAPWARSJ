/**
 * 🔴 [2026-10-11 主人「城池在中心，样式和战略地图一致」「攻击方出现在地图的攻击方向，防守方在地图的中间」]
 *
 * 新战术模式（WebGL 地面）攻城战：守方城池 = 战略地图上该据点的**同一份**建筑栈（TerritorySystem.buildCityStackInnerHtml），
 * 只是 baseSize 放大到 DE 原尺寸（城墙段 = 素材原宽），摆在地图正中。
 *
 * 做法：把那段 HTML 真放进页面（屏外、隐藏）让浏览器排版，逐张 <img> 量出矩形 —— 位置、宽度、镜像都由浏览器按
 * 战略地图同一套 CSS 算，战术侧不另抄一遍几何。地基（SUCAI_TERRAIN 贴图 / 平铺底图 / clip-path 裁切）原样留在一层
 * DOM 里，叠在 WebGL 地面与士兵画布之间，跟着镜头平移缩放。
 */
import type { City } from '../../types/core';
import { cityStackParams, buildCityStackInnerHtml, type CityNativeSizes } from '../../systems/TerritorySystem';
import { resolveCastleAsset } from '../../config/deCastleAssets';
import { DE_STONE_ANCHORS_BY_STYLE, DE_PALISADE_ANCHORS, DE_DARK_PALISADE_ANCHORS, DE_ARCHAIC_PALISADE_ANCHORS } from '../../systems/cityWallShared';
import type { RegionType } from '../../systems/RegionSystem';

/** 城墙段（widthFactor 0.16）在战术里画成 **DE 一格** ⇒ baseSize = 107 / 0.16 = 668.75
 *  🔴 [2026-10-11 主人令「你先把所有都改为1.0」＋「DE 这么设定，一定是设计好的」]
 *     DE 城墙段素材盒宽 = **107px**（＝1.11 格；战术格 = 96×48px，与 DE 一格等大），锚点 `widthFactor = 0.16`
 *     ⇒ `pieceW = baseSize × 0.16`；要画到 107px，baseSize 必须 = 107/0.16。
 *     前一轮按「可见内容宽 77px」设成 77/0.16 —— 那是**把素材裁窄**，不是 DE 原尺寸；本轮按 DE 原尺寸改回。 */
export const TACTICAL_CITY_BASE_SIZE = 107 / 0.16;

export interface StrategicCityHtml {
    html: string;
    /** 战略地图里非险要据点整栈左右镜像（city.mirror） */
    mirror: boolean;
    /** 建筑栈根容器尺寸（px，战术尺度） */
    width: number;
    height: number;
    /** 城内建筑（非墙非门）锚点：相对城心的偏移（px），用作守方出兵口 */
    slots: Array<{ x: number; y: number }>;
}

export interface StrategicCityPiece {
    /** SUCAI_BUILDING 目录名 */
    dir: string;
    kind: 'wall' | 'gate' | 'building';
    /** 相对城心的矩形（px，战术尺度） */
    left: number;
    top: number;
    width: number;
    height: number;
    flip: boolean;
}

const BUILDING_RE = /\/SUCAI_BUILDING\/([^/]+)\/preview\.png/;

export function pieceKind(dir: string): 'wall' | 'gate' | 'building' {
    if (/GATE/.test(dir)) return 'gate';
    if (/WALL|PALISADE|FENCE/.test(dir)) return 'wall';
    return 'building';
}

/** translate(...) 某一轴的 px 分量（calc 里所有 ±Npx 之和） */
function pxOf(expr: string): number {
    let sum = 0;
    const re = /([+-])?\s*(-?[\d.]+)px/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(expr))) sum += (m[1] === '-' ? -1 : 1) * parseFloat(m[2]);
    return sum;
}

/** 生成战略地图同款建筑栈 HTML（同步）；该据点没有 DE 建筑栈（整图据点）返回 null */
/**
 * 🔴 [2026-10-11 主人令「你先把所有都改为1.0」＋「DE 这么设定，一定是设计好的」]
 * 战术侧取「DE 原生尺寸表」：逐件读素材 `_meta.json` 的 `box_w`（＝DE 原生素材像素宽），
 * 交给件表按**原生像素**定宽；**战略地图不传这张表，一个像素不动**。
 */
async function buildNativeSizes(city: City, deStyle: string): Promise<CityNativeSizes | undefined> {
    const ages: Array<'AGE2' | 'AGE3'> = ['AGE2', 'AGE3'];
    const names = ['MILL', 'HOUSE', 'BARRACKS', 'BLACKSMITH', 'ARCHERY_RANGE', 'TOWN_CENTER', 'STABLE', 'MARKET', 'SIEGE_WORKSHOP', 'UNIVERSITY', 'MONASTERY', 'TOWER'];
    const dirs = new Set<string>();
    for (const age of ages) for (const n of names) dirs.add(`${deStyle}_${n}_${age}`);
    // 城寨/毡帐营地的建筑素材（棚屋 HUT_*、蒙古包 YURT_*、定居点等）：战术侧按原生宽画
    const stockadeNames = ['HUT_A', 'HUT_B', 'HUT_C', 'HUT_D', 'HUT_E', 'HUT_F', 'HUT_G',
        'YURT_A', 'YURT_B', 'YURT_C', 'YURT_D', 'YURT_E', 'YURT_F', 'YURT_G', 'YURT_H', 'YURT_I', 'YURT_J', 'YURT_K', 'YURT_L',
        'SETTLEMENT', 'DARK_SETTLEMENT_AGE1', 'DARK_BARRACKS_AGE1', 'DARK_HOUSE_AGE1', 'DARK_MILL_AGE1', 'DARK_TOWN_CENTER_AGE1',
        'OUTPOST', 'FORTIFIED_OUTPOST'];
    const extraDirs = new Set<string>();
    for (const n of stockadeNames) { dirs.add(`${deStyle}_${n}`); extraDirs.add(`${deStyle}_${n}`); extraDirs.add(n); }
    let castleDir: string | null = null;
    if (city.type !== 'small_city') {
        try { castleDir = resolveCastleAsset(deStyle, city.factionId, city.region, city.id); } catch { castleDir = null; }
        if (castleDir) dirs.add(castleDir);
    }
    const boxOf = new Map<string, number>();
    await Promise.all([...dirs].map(async (dir) => {
        try {
            const r = await fetch('/SUCAI_BUILDING/' + dir + '/_meta.json');
            if (!r.ok) return;
            const m: any = await r.json();
            if (m?.box_w > 0) boxOf.set(dir, m.box_w);
        } catch { /* 缺一件就少一件，回落到战略压缩值 */ }
    }));
    if (boxOf.size === 0) return undefined;
    const widths: Record<string, number> = {};
    for (const age of ages) for (const n of names) {
        const w = boxOf.get(`${deStyle}_${n}_${age}`);
        if (w) widths[`${age}:${n}`] = w;
    }
    // 墙体/城门/城垛/箭塔/中心城堡 逐件原生框宽（墙 107 / 门 307 / 垛 163 / 箭塔 AGE3 216 / AGE4 236 各不相同）
    const spriteW: Record<string, number> = {};
    const wallDirs = new Set<string>();
    const addAnchorDirs = (tbl: any) => {
        for (const a of Object.values(tbl ?? {})) {
            const m = /\/SUCAI_BUILDING\/([^/]+)\/preview\.png/.exec((a as any)?.path ?? '');
            if (m) wallDirs.add(m[1]);
        }
    };
    addAnchorDirs(DE_STONE_ANCHORS_BY_STYLE[deStyle]);
    addAnchorDirs(DE_PALISADE_ANCHORS);
    addAnchorDirs(DE_DARK_PALISADE_ANCHORS);
    addAnchorDirs(DE_ARCHAIC_PALISADE_ANCHORS);
    for (const d of extraDirs) wallDirs.add(d);
    if (castleDir) wallDirs.add(castleDir);
    await Promise.all([...wallDirs].map(async (dir) => {
        if (boxOf.has(dir)) { spriteW[dir] = boxOf.get(dir)!; return; }
        try {
            const r = await fetch('/SUCAI_BUILDING/' + dir + '/_meta.json');
            if (!r.ok) return;
            const m: any = await r.json();
            if (m?.box_w > 0) { boxOf.set(dir, m.box_w); spriteW[dir] = m.box_w; }
        } catch { /* 回落战略压缩值 */ }
    }));
    return { widths, castleW: castleDir ? boxOf.get(castleDir) : undefined, spriteW };
}

/** 战术用：按 DE 原生像素生成建筑栈（战略地图走下面那个不传原生表的版本） */
export async function strategicCityHtmlNative(city: City): Promise<StrategicCityHtml | null> {
    const p = cityStackParams(city);
    if (!p.deStyle) return null;
    const native = await buildNativeSizes(city, p.deStyle);
    return strategicCityHtmlWith(city, p, native);
}

export function strategicCityHtml(city: City): StrategicCityHtml | null {
    const p = cityStackParams(city);
    if (!p.deStyle) return null;
    return strategicCityHtmlWith(city, p, undefined);
}

function strategicCityHtmlWith(
    city: City,
    p: { cityRegion: RegionType; centerCastle: boolean; deStyle: string | null; useStoneWall: boolean },
    native?: CityNativeSizes,
): StrategicCityHtml | null {
    if (!p.deStyle) return null;
    const html = buildCityStackInnerHtml(city, TACTICAL_CITY_BASE_SIZE, p.deStyle, p.centerCastle, p.useStoneWall, p.cityRegion, native);
    const mirror = city.type !== 'pass' && !!city.mirror;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const root = doc.body.firstElementChild as HTMLElement | null;
    const width = root ? parseFloat(root.style.width) || 0 : 0;
    const height = root ? parseFloat(root.style.height) || 0 : 0;
    const slots: Array<{ x: number; y: number }> = [];
    for (const img of Array.from(doc.querySelectorAll('img'))) {
        const m = BUILDING_RE.exec(img.getAttribute('src') ?? '');
        if (!m || pieceKind(m[1]) !== 'building') continue;
        const t = /translate\((.*)\)/.exec(img.style.transform ?? '');
        if (!t) continue;
        // 两个参数用最外层逗号分开（calc 里没有逗号）
        const [ax, ay] = t[1].split(',');
        let x = pxOf(ax ?? '');
        const y = pxOf(ay ?? '') + pxOf(img.style.top ?? '');
        if (mirror) x = -x;
        slots.push({ x, y });
    }
    return { html, mirror, width, height, slots };
}

/** 把 HTML 套上战略地图同款镜像外壳 */
export function wrapMirror(c: StrategicCityHtml, inner: string): string {
    const body = c.mirror ? `<div style="display:inline-block;transform:scaleX(-1);">${inner}</div>` : inner;
    return `<div style="display:inline-block;">${body}</div>`;
}

/** 屏外排版、等图加载，逐张量出建筑 / 城墙 / 城门的矩形（相对城心） */
export async function measureStrategicCity(c: StrategicCityHtml): Promise<StrategicCityPiece[]> {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-30000px;top:0;visibility:hidden;pointer-events:none;';
    host.innerHTML = wrapMirror(c, c.html);
    document.body.appendChild(host);
    try {
        const imgs = Array.from(host.querySelectorAll('img'));
        await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : new Promise<void>((res) => {
            im.addEventListener('load', () => res(), { once: true });
            im.addEventListener('error', () => res(), { once: true });
        }))));
        // host > 外壳 > [镜像层 >] 建筑栈根（position:relative，宽高 = 战略地图同款）
        const shell = host.firstElementChild as HTMLElement | null;
        const stack = (c.mirror ? shell?.firstElementChild?.firstElementChild : shell?.firstElementChild) as HTMLElement | null;
        const r0 = (stack ?? host).getBoundingClientRect();
        const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
        const out: StrategicCityPiece[] = [];
        for (const im of imgs) {
            const m = BUILDING_RE.exec(im.getAttribute('src') ?? '');
            if (!m) continue;
            const r = im.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) continue;
            const ownFlip = /scaleX\(-1\)/.test(im.style.transform ?? '');
            out.push({
                dir: m[1], kind: pieceKind(m[1]),
                left: r.left - cx, top: r.top - cy, width: r.width, height: r.height,
                flip: ownFlip !== c.mirror,
            });
        }
        return out;
    } finally {
        host.remove();
    }
}

/** 地基层：同一段 HTML 去掉建筑 / 城墙 / 城门，只留 SUCAI_TERRAIN 贴图与平铺底图（含 clip-path 裁切） */
export function strategicCityGroundElement(c: StrategicCityHtml): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:0;top:0;z-index:395;pointer-events:none;transform-origin:0 0;display:none;';
    el.innerHTML = wrapMirror(c, c.html);
    for (const im of Array.from(el.querySelectorAll('img'))) {
        if (BUILDING_RE.test(im.getAttribute('src') ?? '')) im.remove();
    }
    document.body.appendChild(el);
    return el;
}
