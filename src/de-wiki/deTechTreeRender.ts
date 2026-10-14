/**
 * DE 官方科技树渲染器（自写，版式与官方 js/main.js 同构）。
 *
 * 用法：renderDeTechTree(host, civKey)
 *   · 数据取自 public/de-techtree/（由 tools/de-techtree-extract.py 从本机 DE 安装抽取）
 *   · 版式算法在 deTechTreeLayout.ts（与官方 generateTechTreeJsons.py 同构）
 *   · 配色/尺寸/文本位置照官方 js/techtree.js + js/main.js
 */
import {
    layoutTree,
    computeTreeView,
    nodeColour,
    formatName,
    normalizeItem,
    LAYOUT_CONST,
    type TreePackage,
    type TreeItem,
} from './deTechTreeLayout';

const AGE_NAMES_ZH = ['黑暗时代', '封建时代', '城堡时代', '帝王时代'];
const AGE_NAMES_EN = ['Dark Age', 'Feudal Age', 'Castle Age', 'Imperial Age'];
const AGE_KEY_ZH = ['黑暗', '封建', '城堡', '帝王'];

const indexCache: { data?: any[] } = {};
const treeCache = new Map<string, TreePackage>();
const stringsCache: Record<string, Record<string, string>> = {};
const metaCache: { data?: MetaBundle } = {};
const iconManifest: { data?: any } = {};
const xrefCache: { data?: Record<string, string[]> } = {};
const legionCache: { data?: { byNorm: Record<string, string>; unmatched: any[] } } = {};
const civInfoCache: { data?: Record<string, any> } = {};

/** public/de-techtree/civ-info.json：文明介绍（总述/独特单位/独特科技的字符串 id，按语言查表） */
async function loadCivInfo(): Promise<Record<string, any>> {
    if (civInfoCache.data) return civInfoCache.data;
    try {
        const r = await fetch('/de-techtree/civ-info.json');
        civInfoCache.data = await r.json();
    } catch { civInfoCache.data = {}; }
    return civInfoCache.data!;
}

/** public/de-techtree/legion-names.json：DE 英文名（规范化）→ 军团编辑器「兵种鉴赏」的番号 */
async function loadLegionNames(): Promise<{ byNorm: Record<string, string>; unmatched: any[] }> {
    if (legionCache.data) return legionCache.data;
    try {
        const r = await fetch('/de-techtree/legion-names.json');
        legionCache.data = await r.json();
    } catch { legionCache.data = { byNorm: {}, unmatched: [] }; }
    return legionCache.data!;
}

const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** public/de-techtree/xref.json：节点键 → 可用该节点的文明（官方悬停面板里那排徽章） */
async function loadXref(): Promise<Record<string, string[]>> {
    if (xrefCache.data) return xrefCache.data;
    try {
        const r = await fetch('/de-techtree/xref.json');
        xrefCache.data = await r.json();
    } catch { xrefCache.data = {}; }
    return xrefCache.data!;
}

/** public/de-techtree/icons/manifest.json：哪些图标已导出（缺图的走回退，不塞错图） */
async function loadIconManifest(): Promise<any> {
    if (iconManifest.data) return iconManifest.data;
    try {
        const r = await fetch('/de-techtree/icons/manifest.json');
        iconManifest.data = await r.json();
    } catch { iconManifest.data = { counts: {} }; }
    return iconManifest.data;
}

/**
 * 已导出的图标编号集合：'Building' | 'Tech' | 'Unit' → Set<number>
 * 判据以 manifest 的 **缺号清单** 为准（`missing`），而不是 sheets.frames —— 后者是旧结构，
 * 换导出源时曾导致整棵树图标全被判成缺图（实测踩过）。
 */
function exportedIcons(manifest: any): Record<string, Set<number>> {
    const out: Record<string, Set<number>> = { Building: new Set(), Tech: new Set(), Unit: new Set() };
    for (const kind of Object.keys(out)) {
        const missing = new Set<number>(manifest?.missing?.[kind] ?? []);
        const frames = manifest?.sheets?.[kind]?.frames;   // 兼容旧结构
        const set = new Set<number>();
        if (Array.isArray(manifest?.exported?.[kind])) {
            for (const n of manifest.exported[kind]) set.add(Number(n));
        } else if (frames != null) {
            for (let n = 0; n < Number(frames); n++) if (!missing.has(n)) set.add(n);
        } else {
            // 最后兜底：只凭缺号清单 + 需求上限
            const needMax = manifest?.counts?.[kind]?.needMax ?? 1000;
            for (let n = 0; n <= needMax; n++) if (!missing.has(n)) set.add(n);
        }
        out[kind] = set;
    }
    return out;
}

/** public/de-techtree/meta.json：悬停详情的成本/数值/说明 id（由 tools/de-techtree-meta.py 从本机 dat 抽） */
interface MetaBundle {
    units: Record<string, any>;
    techs: Record<string, any>;
    buildings: Record<string, any>;
}

async function loadMeta(): Promise<MetaBundle> {
    if (metaCache.data) return metaCache.data;
    const r = await fetch('/de-techtree/meta.json');
    metaCache.data = await r.json();
    return metaCache.data!;
}

async function loadIndex(): Promise<any[]> {
    if (indexCache.data) return indexCache.data;
    const r = await fetch('/de-techtree/index.json');
    indexCache.data = await r.json();
    return indexCache.data!;
}

async function loadTree(key: string): Promise<TreePackage> {
    if (treeCache.has(key)) return treeCache.get(key)!;
    const r = await fetch(`/de-techtree/trees/${key}.json`);
    const pkg = (await r.json()) as TreePackage;
    layoutTree(pkg);
    treeCache.set(key, pkg);
    return pkg;
}

/** 本机 DE 实装的 17 个语言包（与官方网页 locale 数一致） */
export type DeLng = 'en' | 'zh' | 'tw' | 'jp' | 'ko' | 'fr' | 'de' | 'es' | 'mx' | 'br' | 'it' | 'pl' | 'ru' | 'tr' | 'vi' | 'hi' | 'ms';
export const DE_LANGS: Array<{ code: DeLng; label: string }> = [
    { code: 'zh', label: '简体中文' }, { code: 'tw', label: '繁體中文' }, { code: 'en', label: 'English' },
    { code: 'jp', label: '日本語' }, { code: 'ko', label: '한국어' }, { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' }, { code: 'es', label: 'Español (ES)' }, { code: 'mx', label: 'Español (MX)' },
    { code: 'br', label: 'Português (BR)' }, { code: 'it', label: 'Italiano' }, { code: 'pl', label: 'Polski' },
    { code: 'ru', label: 'Русский' }, { code: 'tr', label: 'Türkçe' }, { code: 'vi', label: 'Tiếng Việt' },
    { code: 'hi', label: 'हिन्दी' }, { code: 'ms', label: 'Bahasa Melayu' },
];

async function loadStrings(lng: DeLng): Promise<Record<string, string>> {
    if (stringsCache[lng]) return stringsCache[lng];
    const r = await fetch(`/de-techtree/strings-${lng}.json`);
    stringsCache[lng] = await r.json();
    return stringsCache[lng];
}

/** 折行：中日韩按字数硬切（每行 7 字）；拉丁字母**按单词折**，不把单词从中间切断 */
function splitLines(text: string, lng: DeLng): string[] {
    const raw = formatName(text).split('\n').filter(Boolean);
    const cjk = lng === 'zh' || lng === 'tw' || lng === 'jp' || lng === 'ko';
    const per = cjk ? 7 : 9;
    const out: string[] = [];
    for (const seg of raw) {
        if (cjk || seg.length <= per) {
            for (let i = 0; i < seg.length; i += per) out.push(seg.slice(i, i + per));
            continue;
        }
        // 拉丁：按空格折行；单个超长词才硬切。**行尾保留空格**，否则拼接时会粘成一个词
        let line = '';
        for (const word of seg.split(/\s+/)) {
            if (!line) { line = word; continue; }
            if ((line + ' ' + word).length <= per) line += ' ' + word;
            else { out.push(line + ' '); line = word; }
        }
        if (line) out.push(line);
    }
    // 单个仍超长的行（如 Man-at-Arms 折叠后）再按字数硬切
    const wrapped: string[] = [];
    for (const l of out) {
        if (l.length <= per || cjk) { wrapped.push(l); continue; }
        for (let i = 0; i < l.length; i += per) wrapped.push(l.slice(i, i + per));
    }
    if (wrapped.length <= 3) return wrapped;
    const clipped = wrapped.slice(0, 3);
    clipped[2] = clipped[2].slice(0, Math.max(1, per - 1)) + '…';
    return clipped;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface TechTreeHandle {
    destroy(): void;
}

export async function renderDeTechTree(
    host: HTMLElement,
    civKey: string,
    opts: { lng?: DeLng; nameSrc?: 'de' | 'legion'; onCiv?: (key: string) => void; onLng?: (l: DeLng) => void; onNameSrc?: (s: 'de' | 'legion') => void } = {},
): Promise<TechTreeHandle> {
    const lng = opts.lng ?? 'zh';
    const isZh = lng === 'zh' || lng === 'tw';
    const [index, pkg, strings, meta, iconManifest, xref, legionNames, civInfo] = await Promise.all([
        loadIndex(), loadTree(civKey), loadStrings(lng), loadMeta(), loadIconManifest(), loadXref(), loadLegionNames(), loadCivInfo(),
    ]);
    // 命名来源：'de' = DE 官方中文串（默认）；'legion' = 与 legion-editor 兵种鉴赏一致
    // （主人 2026-10-14 令；两边是两套命名体系，故做成可切换，不覆盖任一侧数据）
    let nameSrc: 'de' | 'legion' = opts.nameSrc ?? 'de';
    /** 取该节点显示用名 */
    const labelOf = (it: TreeItem): string => {
        if (nameSrc === 'legion' && isZh) {
            const m = legionNames.byNorm[normName(it.name ?? '')];
            if (m) return m;
        }
        return (isZh ? (it.name_zh || it.name) : it.name) ?? '';
    };
    const haveIcon = exportedIcons(iconManifest);
    const iconDirOf = (item: TreeItem): 'Building' | 'Tech' | 'Unit' =>
        item.use_type === 'Building' || /Building/.test(item.node_type ?? '') ? 'Building'
            : item.use_type === 'Tech' ? 'Tech' : 'Unit';
    const T = (id: number | null | undefined): string => (id == null || id < 0 ? '' : (strings[String(id)] ?? ''));
    /** 游戏富文本 → 纯文本（去掉 <b>/<i>/<GREY>/<cost> 之类标记；字面 \n 与真换行都折成真换行） */
    const plain = (s: string): string => formatName(String(s)
        .replace(/<\/?[a-zA-Z][^>]*>/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\r/g, ''));
    const view = computeTreeView(pkg, window.innerHeight);
    const { rowHeight } = view;
    const TOP_PADDING = LAYOUT_CONST.TOP_PADDING;
    const EHh = view.elementHeight;

    host.innerHTML = '';
    host.style.cssText = 'display:flex;align-items:flex-start;gap:0;background:#e8dcc2;border:1px solid #4a3e2b;border-radius:4px;overflow:hidden;position:relative';
    const canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'flex:1 1 auto;min-width:0;overflow:auto;max-height:calc(100vh - 110px)';
    host.appendChild(canvasWrap);
    const canvas = document.createElement('div');
    canvas.style.cssText = 'position:relative;width:100%';
    canvasWrap.appendChild(canvas);
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(view.width));
    svg.setAttribute('height', String(view.height));
    svg.setAttribute('viewBox', `0 0 ${view.width} ${view.height}`);
    svg.style.display = 'block';
    svg.style.background = '#e8dcc2';
    canvas.appendChild(svg);

    // ── 宽屏自适应：整棵树按比例缩放到铺满窗口宽度（不再只看到一小段）──
    //    官方网页是 1:1 逐像素画、靠横向滚动；这里改成「先适配整宽」，另给缩放档位。
    //    ⚠️ 隐藏面板（本页签未激活）时 clientWidth=0，此时不动，留到 ResizeObserver / 激活时再算。
    let zoom: number | 'fit' = 1;   // 默认 1:1（与官方一致，字清楚）；「适配宽度」只作为可选档
    let lastScale = 1;
    const currentScale = () => lastScale;
    const applyZoom = () => {
        const avail = canvasWrap.clientWidth;
        if (!avail || !view.width) return;
        const s = zoom === 'fit' ? Math.min(1.6, avail / view.width) : zoom;
        lastScale = s;
        svg.style.transformOrigin = '0 0';
        svg.style.transform = `scale(${s})`;
        canvas.style.height = `${Math.ceil(view.height * s)}px`;
        canvas.style.width = `${Math.ceil(view.width * s)}px`;
        if (zoom !== 'fit') canvas.style.width = `${Math.ceil(Math.max(view.width * s, avail))}px`;
    };
    applyZoom();
    const ro = new ResizeObserver(() => applyZoom());
    ro.observe(canvasWrap);

    // ── 8 行格线 + 4 个时代名 ──
    for (let r = 0; r < 8; r++) {
        const y = r * (rowHeight / 2) + TOP_PADDING;
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', '0'); line.setAttribute('x2', String(view.width));
        line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
        line.setAttribute('stroke', r % 2 === 0 ? '#00000018' : '#0000000c');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
    }
    for (let age = 0; age < 4; age++) {
        const t = document.createElementNS(SVG_NS, 'text');
        t.setAttribute('x', '14');
        t.setAttribute('y', String(age * rowHeight * 0.5 + rowHeight + 8));
        t.setAttribute('font-size', '15');
        t.setAttribute('font-weight', 'bold');
        t.setAttribute('fill', '#4d3617');
        t.textContent = (isZh ? AGE_NAMES_ZH : AGE_NAMES_EN)[age];
        svg.appendChild(t);
        // 时代分隔带
        const band = document.createElementNS(SVG_NS, 'rect');
        band.setAttribute('x', '0');
        band.setAttribute('y', String(age * rowHeight + TOP_PADDING - 4));
        band.setAttribute('width', String(view.width));
        band.setAttribute('height', String(rowHeight));
        band.setAttribute('fill', age % 2 ? '#00000008' : '#00000000');
        svg.insertBefore(band, svg.firstChild);
    }

    // ── 建筑列分隔线 ──
    for (const lane of view.lanes) {
        const l = document.createElementNS(SVG_NS, 'line');
        l.setAttribute('x1', String(lane.x - LAYOUT_CONST.PADDING / 2));
        l.setAttribute('x2', String(lane.x - LAYOUT_CONST.PADDING / 2));
        l.setAttribute('y1', String(TOP_PADDING));
        l.setAttribute('y2', String(view.height - 30));
        l.setAttribute('stroke', '#4d361733');
        l.setAttribute('stroke-width', '1');
        svg.appendChild(l);
    }

    // ── 连线（先画线后画块，线与块同层但块会盖住线头）──
    for (const [from, to] of view.connections) {
        const a = view.pos.get(from), b = view.pos.get(to);
        if (!a || !b) continue;
        const path = document.createElementNS(SVG_NS, 'path');
        const x1 = a.x + EHh / 2, y1 = a.y + EHh;
        const x2 = b.x + EHh / 2, y2 = b.y;
        const d = Math.abs(x1 - x2) < 2
            ? `M${x1},${y1} L${x2},${y2}`
            : `M${x1},${y1} L${x1},${(y1 + y2) / 2} L${x2},${(y1 + y2) / 2} L${x2},${y2}`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#4d3617');
        path.setAttribute('stroke-width', '1.6');
        path.setAttribute('opacity', '0.75');
        svg.appendChild(path);
    }

    const allItems: TreeItem[] = [...pkg.buildings, ...pkg.units_techs];
    allItems.forEach(normalizeItem);   // 与布局模块同一口径（官方字段名 → 蛇形）

    // ── 悬停面板（官方 #helptext 的对应物）──
    // ⚠️ 必须挂在 host 上（host 是 position:relative 的定位上下文）；曾经挂进滚动容器里，
    //    结果 left/top 不生效、面板被挤在滚动内容中看不见（实测踩过）。
    const tip = document.createElement('div');
    tip.style.cssText = 'position:absolute;display:none;z-index:50;max-width:360px;background:#f7f1e3;border:2px solid #8a7448;' +
        'border-radius:4px;padding:8px 10px;font-size:12px;line-height:1.55;color:#2b2013;box-shadow:0 4px 14px #0006';
    host.appendChild(tip);
    // 鼠标进面板时取消「即将隐藏」，否则徽章点不到
    tip.addEventListener('mouseenter', () => { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } });
    tip.addEventListener('mouseleave', () => hideTip());
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const TYPE_ZH: Record<string, string> = {
        Unit: '单位', UnitUpgrade: '单位（升级）', UniqueUnit: '城堡特色兵',
        Research: '科技', UniqueTech: '特色科技', RegionalTech: '区域科技',
        BuildingTech: '建筑', BuildingNonTech: '建筑', UniqueBuilding: '特色建筑',
        RegionalBuilding: '区域建筑', RegionalUnit: '区域单位',
    };
    const showTip = (g: SVGGElement) => {
        const d = (g as any)._tip;
        if (!d) return;
        const st = (g as any)._pos ?? { x: 0, y: 0 };
        const txt = (t: any) => document.createTextNode(String(t ?? ''));
        tip.innerHTML = '';
        const h = document.createElement('div');
        h.style.cssText = 'font-weight:bold;font-size:13px;color:#4d3617;white-space:pre-line';
        h.appendChild(txt(d.name));
        tip.appendChild(h);
        const sub = document.createElement('div');
        sub.style.cssText = 'opacity:.8;font-size:11px;margin-top:2px';
        sub.textContent = `${TYPE_ZH[d.type] ?? d.type} · ${d.age}${d.status === 'NotAvailable' ? ' · 本文明无' : ''}`;
        tip.appendChild(sub);
        if (d.status === 'NotAvailable') {
            const na = document.createElement('div');
            na.style.cssText = 'color:#a33;font-weight:bold;margin-top:4px';
            na.textContent = '该文明不能研发 / 训练';
            tip.appendChild(na);
        }
        for (const [k, v] of [['成本', d.cost], ['数值', d.stats]] as const) {
            if (!v) continue;
            const row = document.createElement('div');
            row.style.marginTop = '4px';
            const b = document.createElement('b');
            b.textContent = k + '：';
            row.appendChild(b);
            row.appendChild(txt(v));
            tip.appendChild(row);
        }
        if (d.help) {
            const p = document.createElement('div');
            p.style.cssText = 'margin-top:6px;padding-top:6px;border-top:1px solid #cbb98f;color:#3b2d1a';
            p.textContent = d.help.slice(0, 320) + (d.help.length > 320 ? '…' : '');
            tip.appendChild(p);
        }
        // ── 跨文明交叉引用（官方面板里的徽章排）：哪些文明有这个节点 ──
        const avail = xref[d.nodeKey] ?? [];
        if (avail.length) {
            const sep = document.createElement('div');
            sep.style.cssText = 'margin-top:6px;padding-top:6px;border-top:1px solid #cbb98f;font-size:11px;opacity:.75';
            sep.textContent = `${d.typeLabel} · ${avail.length} 个文明可用`;
            tip.appendChild(sep);
            const grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:4px';
            for (const k of avail) {
                const c = index.find((x) => x.key === k);
                const b = document.createElement('img');
                b.src = `/de-techtree/emblems/${k}.png`;
                b.title = (c ? (isZh ? (c.name_zh || c.name) : c.name) : k) + (k === civKey ? '（本文明）' : '');
                b.style.cssText = 'width:100%;aspect-ratio:16/10;object-fit:contain;cursor:pointer;background:#00000008;border-radius:2px';
                b.addEventListener('error', () => b.remove());
                b.addEventListener('click', () => { hideTip(); opts.onCiv?.(k); });
                grid.appendChild(b);
            }
            tip.appendChild(grid);
        }
        tip.style.display = 'block';
        // 面板挂在 host（定位上下文）上 → 节点坐标要**乘缩放**再减滚动量
        const s = currentScale();
        const vx = (g as any)._pos.x * s - canvasWrap.scrollLeft;
        const vy = (g as any)._pos.y * s - canvasWrap.scrollTop;
        const left = Math.max(4, Math.min(vx + 12, host.clientWidth - tip.offsetWidth - 8));
        const top = Math.max(4, Math.min(vy, host.clientHeight - tip.offsetHeight - 8));
        tip.style.left = `${left}px`;
        tip.style.top = `${Math.max(4, top)}px`;
    };
    const hideTip = () => {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        tip.style.display = 'none';
    };
    /** 出节点区后延迟隐藏，给鼠标留出移到面板上点徽章的时间 */
    const scheduleHide = () => {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { tip.style.display = 'none'; hideTimer = null; }, 280);
    };
    canvasWrap.addEventListener('mouseleave', hideTip);

    // ── 节点 ──
    for (const item of allItems) {
        const p = view.pos.get(item.id);
        if (!p) continue;
        const colour = nodeColour(item.node_type);
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('transform', `translate(${p.x},${p.y})`);

        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('width', String(EHh));
        rect.setAttribute('height', String(EHh));
        rect.setAttribute('rx', '3');
        rect.setAttribute('fill', '#f5efdf');
        rect.setAttribute('stroke', colour);
        rect.setAttribute('stroke-width', '2');
        (rect as any).style.cursor = 'pointer';
        g.appendChild(rect);

        // 图标：有素材就用（官方 0.6 倍，居中在上部）；没导出的编号走回退，绝不塞错图
        const dir = iconDirOf(item);
        const pi = item.picture_index ?? -1;
        if (pi >= 0 && haveIcon[dir]?.has(pi)) {
            const img = document.createElementNS(SVG_NS, 'image');
            // 官方是 0.6 倍且名字从 EH/1.5 起排；实测两者会叠，故缩到 0.5 倍并上移，
            // 给名字留出下半格（版式差异属「能看清」优先，节点尺寸仍照官方）
            img.setAttribute('href', `/de-techtree/icons/${dir}/${pi}.png`);
            img.setAttribute('width', String(EHh * 0.5));
            img.setAttribute('height', String(EHh * 0.5));
            img.setAttribute('x', String(EHh * 0.25));
            img.setAttribute('y', String(-EHh * 0.06));
            img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            img.addEventListener('error', () => img.remove());
            g.appendChild(img);
        } else {
            const ph = document.createElementNS(SVG_NS, 'rect');
            ph.setAttribute('x', String(EHh * 0.25));
            ph.setAttribute('y', String(-EHh * 0.06));
            ph.setAttribute('width', String(EHh * 0.5));
            ph.setAttribute('height', String(EHh * 0.5));
            ph.setAttribute('fill', colour);
            ph.setAttribute('opacity', '0.10');
            ph.setAttribute('rx', '2');
            g.appendChild(ph);
        }

        // 名字（居中，y = EH/1.5，向下排）
        const label = labelOf(item);
        const lines = splitLines(label ?? '', lng);
        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(EHh / 2));
        text.setAttribute('y', String(EHh * 0.72));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', String(Math.max(9, Math.round(EHh * 0.17))));
        text.setAttribute('fill', '#20180c');
        (text as any).style.pointerEvents = 'none';
        lines.forEach((ln, i) => {
            const ts = document.createElementNS(SVG_NS, 'tspan');
            ts.setAttribute('x', String(EHh / 2));
            ts.setAttribute('dy', i === 0 ? '0' : String(Math.round(EHh * 0.20)));
            ts.textContent = ln;
            text.appendChild(ts);
        });
        g.appendChild(text);

        // 不可用：叠灰罩＋**叉号**（DE 游戏里「不可用」就是这个叉；图例里也有）
        if (item.node_status === 'NotAvailable') {
            const grey = document.createElementNS(SVG_NS, 'rect');
            grey.setAttribute('width', String(EHh));
            grey.setAttribute('height', String(EHh));
            grey.setAttribute('rx', '3');
            grey.setAttribute('fill', '#555555');
            grey.setAttribute('opacity', '0.55');
            (grey as any).style.pointerEvents = 'none';
            g.appendChild(grey);
            for (const [x1, y1, x2, y2] of [[0.18, 0.18, 0.82, 0.82], [0.82, 0.18, 0.18, 0.82]] as const) {
                const ln = document.createElementNS(SVG_NS, 'line');
                ln.setAttribute('x1', String(EHh * x1)); ln.setAttribute('y1', String(EHh * y1));
                ln.setAttribute('x2', String(EHh * x2)); ln.setAttribute('y2', String(EHh * y2));
                ln.setAttribute('stroke', '#2b2b2b');
                ln.setAttribute('stroke-width', '3');
                ln.setAttribute('stroke-linecap', 'round');
                (ln as any).style.pointerEvents = 'none';
                g.appendChild(ln);
            }
        } else if (item.node_status === 'ResearchRequired') {
            // 需要升级/研发：蓝框（DE 图例里的「需要升级」）
            const bd = document.createElementNS(SVG_NS, 'rect');
            bd.setAttribute('width', String(EHh));
            bd.setAttribute('height', String(EHh));
            bd.setAttribute('rx', '3');
            bd.setAttribute('fill', 'none');
            bd.setAttribute('stroke', '#3a7bd5');
            bd.setAttribute('stroke-width', '3');
            (bd as any).style.pointerEvents = 'none';
            g.appendChild(bd);
        }

        // 悬停详情：把节点信息汇总好，绑在 group 上（鼠标移入时显示面板）
        const itemDir = iconDirOf(item);
        const metaRec = itemDir === 'Building' ? meta.buildings[String(item.node_id)]
            : itemDir === 'Tech' ? meta.techs[String(item.node_id)]
            : meta.units[String(item.node_id)];
        const helptext = T(metaRec?.helpId) || T(metaRec?.descId) || '';
        const costTxt = metaRec?.cost
            ? Object.entries(metaRec.cost).map(([k, v]) => `${v} ${({ food: '食物', wood: '木材', gold: '黄金', stone: '石头' } as any)[k] ?? k}`).join('　')
            : '';
        const statsTxt = metaRec ? [
            metaRec.hp != null ? `血量 ${metaRec.hp}` : '',
            metaRec.atk != null ? `攻击 ${metaRec.atk}` : '',
            metaRec.ma != null ? `近防 ${metaRec.ma}` : '',
            metaRec.pa != null ? `远防 ${metaRec.pa}` : '',
            metaRec.range ? `射程 ${metaRec.range}` : '',
            metaRec.speed != null ? `速度 ${metaRec.speed}` : '',
            metaRec.trainTime != null ? `训练 ${metaRec.trainTime}s` : '',
            metaRec.researchTime != null ? `研发 ${metaRec.researchTime}s` : '',
        ].filter(Boolean).join('　') : '';
        (g as any)._tip = {
            name: formatName(label ?? ''),
            type: item.node_type ?? '',
            typeLabel: TYPE_ZH[item.node_type ?? ''] ?? (item.node_type ?? ''),
            nodeKey: `${item.use_type}_${item.node_id}`,
            avail: (xref[`${item.use_type}_${item.node_id}`] ?? []).length,
            status: item.node_status ?? '',
            age: (isZh ? AGE_KEY_ZH : ['Dark', 'Feudal', 'Castle', 'Imperial'])[(item.age_id ?? 1) - 1],
            cost: costTxt,
            stats: statsTxt,
            help: helptext.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        };
        g.addEventListener('mouseenter', () => showTip(g));
        g.addEventListener('focus', () => showTip(g));
        g.addEventListener('mouseleave', () => scheduleHide());
        (g as any)._pos = p;

        svg.appendChild(g);
    }

    // ── 侧栏：文明下拉（62 个）＋ 本文明信息 ──
    const side = document.createElement('div');
    side.style.cssText = 'width:240px;flex:0 0 auto;padding:10px;border-left:1px solid #4a3e2b;background:#15110d;color:#e8dcc2;font-size:12px;overflow:auto;max-height:100%';
    const sel = document.createElement('select');
    sel.style.cssText = 'width:100%;padding:4px;font-size:13px;background:#2a2116;color:#e8dcc2;border:1px solid #5a4b32';
    for (const c of index) {
        const o = document.createElement('option');
        o.value = c.key;
        o.textContent = `${isZh ? (c.name_zh || c.name) : c.name}${c.era === 'antiquity' ? '（古典）' : ''}`;
        if (c.key === civKey) o.selected = true;
        sel.appendChild(o);
    }
    const onSel = () => opts.onCiv?.(sel.value);
    sel.addEventListener('change', onSel);
    side.appendChild(sel);

    // ── 文明介绍（对应 DE 游戏科技树左栏那块面板）──
    //    文案直接取本机 civilizations.json 的 tech_tree_description_string_id 正文
    //    （含加成／独特单位／独特科技／团队加成），按当前语言查 strings-<lng>.json。
    const civData = civInfo[civKey];
    if (civData) {
        const box = document.createElement('div');
        box.style.cssText = 'margin-top:8px;background:#efe3c8;color:#2b2013;border:2px solid #8a7448;border-radius:4px;padding:8px;line-height:1.5';
        const head = document.createElement('div');
        head.style.cssText = 'display:flex;align-items:center;gap:6px;border-bottom:1px solid #c9b48a;padding-bottom:6px;margin-bottom:6px';
        const em = document.createElement('img');
        em.src = `/de-techtree/emblems/${civKey}.png`;
        em.style.cssText = 'width:26px;height:18px;object-fit:contain';
        em.addEventListener('error', () => em.remove());
        const nm = document.createElement('b');
        nm.textContent = isZh ? (index.find((c) => c.key === civKey)?.name_zh || civKey) : civKey;
        nm.style.fontSize = '14px';
        head.appendChild(em);
        head.appendChild(nm);
        box.appendChild(head);

        /** 把「独特单位: X」这类行拆出来单列，其余整段照贴 */
        const desc = plain(T(civData.descId));
        const lines = desc.split('\n');
        const UNITS: Record<string, string> = { 'Unique Unit:': '独特单位', 'Unique Units:': '独特单位', 'Unique Tech:': '独特科技', 'Unique Techs:': '独特科技', 'Team Bonus:': '团队加成' };
        let cur = '';
        const unitNames = civData.uniqueUnitNameIds.map((i: number) => plain(T(i))).filter(Boolean);
        const techNames = civData.uniqueTechIds.map((i: number) => plain(T(meta.techs[String(i)]?.nameId))).filter(Boolean);
        for (const raw of lines) {
            const ln = raw.trim();
            const label = UNITS[ln.replace(/\s+/g, ' ')];
            if (label) { cur = label; continue; }
            if (!ln) { cur = ''; continue; }
            const p = document.createElement('div');
            p.style.cssText = 'margin:1px 0';
            if (cur === '独特单位' && unitNames.length) p.innerHTML = `<b>独特单位：</b>${unitNames.join('、')}`;
            else if (cur === '独特科技' && techNames.length) p.innerHTML = `<b>独特科技：</b>${techNames.join('、')}`;
            else p.textContent = ln;
            box.appendChild(p);
            if (cur) cur = '';   // 标题行后只吃第一行内容，后续照常
        }
        box.style.maxHeight = '240px';
        box.style.overflowY = 'auto';
        side.appendChild(box);
    }

    // ── 图例（对应游戏左下角「图例」框）──
    const legend = document.createElement('div');
    legend.style.cssText = 'margin-top:8px;background:#efe3c8;color:#2b2013;border:2px solid #8a7448;border-radius:4px;padding:6px 8px;font-size:11px;line-height:1.7';
    const chip = (c: string, label: string) => `<span style="display:inline-block;width:10px;height:10px;background:${c};border:1px solid #1c1c1c55;vertical-align:-1px"></span> ${label}`;
    legend.innerHTML = `<b>图例</b><div style="margin-top:4px">
      ${chip('#00739c', '单位')}　${chip('#b54e18', '建筑')}　${chip('#397139', '科技')}<br>
      ${chip('#515ae3', '区域')}　${chip('#5965d8', '区域建筑')}　${chip('#059945', '区域科技')}<br>
      ${chip('#703b7a', '独特单位')}　${chip('#d43652', '独特建筑')}　${chip('#009700', '独特科技')}<br>
      <span style="font-weight:bold">✕</span> 不可用　<span style="display:inline-block;width:10px;height:10px;border:2px solid #3a7bd5;vertical-align:-1px"></span> 需要升级
    </div>`;
    side.appendChild(legend);

    // ── 语言切换（本机 17 个语言包；选择存 localStorage）──
    const lngRow = document.createElement('div');
    lngRow.style.cssText = 'display:flex;gap:4px;align-items:center;margin-top:6px';
    const lngLabel = document.createElement('span');
    lngLabel.textContent = '语言';
    lngLabel.style.cssText = 'opacity:.7;font-size:11px';
    const lngSel = document.createElement('select');
    lngSel.style.cssText = 'flex:1;padding:3px;font-size:12px;background:#2a2116;color:#e8dcc2;border:1px solid #5a4b32';
    for (const l of DE_LANGS) {
        const o = document.createElement('option');
        o.value = l.code;
        o.textContent = l.label;
        if (l.code === lng) o.selected = true;
        lngSel.appendChild(o);
    }
    const onLng = () => {
        try { localStorage.setItem('de-techtree-lng', lngSel.value); } catch { /* 忽略隐私模式 */ }
        opts.onLng?.(lngSel.value as DeLng);
    };
    lngSel.addEventListener('change', onLng);
    lngRow.appendChild(lngLabel);
    lngRow.appendChild(lngSel);
    side.appendChild(lngRow);

    // ── 缩放（默认「适配全宽」：整棵树铺满窗口宽度）──
    const zoomRow = document.createElement('div');
    zoomRow.style.cssText = 'display:flex;gap:4px;align-items:center;margin-top:6px';
    const zLabel = document.createElement('span');
    zLabel.textContent = '缩放';
    zLabel.style.cssText = 'opacity:.7;font-size:11px';
    const zSel = document.createElement('select');
    zSel.style.cssText = 'flex:1;padding:3px;font-size:12px;background:#2a2116;color:#e8dcc2;border:1px solid #5a4b32';
    for (const [val, label] of [['1', '100%（默认）'], ['fit', '适配宽度'], ['0.5', '50%'], ['0.75', '75%'], ['1.5', '150%'], ['2', '200%']] as const) {
        const o = document.createElement('option');
        o.value = val;
        o.textContent = label;
        zSel.appendChild(o);
    }
    const onZoom = () => {
        zoom = zSel.value === 'fit' ? 'fit' : Number(zSel.value);
        applyZoom();
    };
    zSel.addEventListener('change', onZoom);
    zoomRow.appendChild(zLabel);
    zoomRow.appendChild(zSel);
    side.appendChild(zoomRow);

    // ── 命名来源：与 legion-editor 兵种鉴赏一致 / DE 官方名（默认）──
    const nameRow = document.createElement('div');
    nameRow.style.cssText = 'display:flex;gap:4px;align-items:center;margin-top:6px';
    const nLabel = document.createElement('span');
    nLabel.textContent = '兵种名';
    nLabel.style.cssText = 'opacity:.7;font-size:11px';
    const nSel = document.createElement('select');
    nSel.style.cssText = 'flex:1;padding:3px;font-size:12px;background:#2a2116;color:#e8dcc2;border:1px solid #5a4b32';
    for (const [val, label] of [['de', 'DE 官方名'], ['legion', '兵种鉴赏名']] as const) {
        const o = document.createElement('option');
        o.value = val;
        o.textContent = label;
        if (val === nameSrc) o.selected = true;
        nSel.appendChild(o);
    }
    const onNameSrc = () => {
        nameSrc = nSel.value as 'de' | 'legion';
        opts.onNameSrc?.(nameSrc);   // 交给页面整体重渲染（名字要重画所有节点）
    };
    nSel.addEventListener('change', onNameSrc);
    nameRow.appendChild(nLabel);
    nameRow.appendChild(nSel);
    side.appendChild(nameRow);
    const nameNote = document.createElement('div');
    nameNote.style.cssText = 'margin-top:4px;font-size:10px;opacity:.55;line-height:1.4';
    nameNote.textContent = '兵种鉴赏名对号 247/288；41 个未对号者仍显示 DE 名（见 legion-names.json）';
    side.appendChild(nameNote);
    const info = document.createElement('div');
    info.style.marginTop = '8px';
    const cur = index.find((c) => c.key === civKey);
    info.innerHTML = `<div style="color:#d4af37;font-weight:bold;font-size:14px">${isZh ? (cur?.name_zh || cur?.name) : cur?.name}</div>
        <div style="opacity:.75;margin-top:4px">建筑 ${cur?.buildings ?? 0} 类 · 节点 ${cur?.nodes ?? 0} 个</div>
        <div style="opacity:.75;margin-top:4px">共 ${index.length} 个文明</div>
        <div style="margin-top:10px;line-height:1.8">
          <span style="color:#b54e18">■</span> 建筑　<span style="color:#00739c">■</span> 单位<br>
          <span style="color:#703b7a">■</span> 城堡特色兵　<span style="color:#397139">■</span> 科技<br>
          <span style="color:#009700">■</span> 特色科技　<span style="color:#777">■</span> 本文明无
        </div>`;
    side.appendChild(info);

    // ── 建筑索引（官方 #buildingindex__table 的对应物）：点一下跳到那列 ──
    const idxTitle = document.createElement('div');
    idxTitle.style.cssText = 'margin:12px 0 6px;padding-top:8px;border-top:1px solid #4a3e2b;color:#d4af37;font-weight:bold';
    idxTitle.textContent = isZh ? '建筑索引' : 'Buildings';
    side.appendChild(idxTitle);
    const idxList = document.createElement('div');
    idxList.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:4px';
    for (const b of pkg.buildings) {
        const cell = document.createElement('div');
        cell.title = formatName(isZh ? (b.name_zh || b.name) : b.name);
        cell.style.cssText = 'background:#241c12;border:1px solid #5a4b32;border-radius:3px;padding:2px;text-align:center;cursor:pointer';
        const ic = document.createElement('img');
        const bpi = b.picture_index ?? -1;
        if (bpi >= 0 && haveIcon.Building?.has(bpi)) {
            ic.src = `/de-techtree/icons/Building/${bpi}.png`;
            ic.style.cssText = 'width:28px;height:28px;object-fit:contain;display:block;margin:0 auto';
        } else {
            ic.style.cssText = 'display:none';
        }
        ic.addEventListener('error', () => { ic.replaceWith(Object.assign(document.createElement('span'), { textContent: '▦', style: 'font-size:16px;opacity:.5' })); });
        cell.appendChild(ic);
        cell.addEventListener('click', () => {
            const lane = view.lanes.find((l) => l.building.id === b.id);
            if (lane) canvasWrap.scrollTo({ left: Math.max(0, lane.x - LAYOUT_CONST.START_X), behavior: 'smooth' });
        });
        idxList.appendChild(cell);
    }
    side.appendChild(idxList);
    host.appendChild(side);

    const ret: TechTreeHandle = {
        destroy() {
            sel.removeEventListener('change', onSel);
            zSel.removeEventListener('change', onZoom);
            lngSel.removeEventListener('change', onLng);
            nSel.removeEventListener('change', onNameSrc);
            ro.disconnect();
            host.innerHTML = '';
        },
    };
    return ret;
}

/** 便捷入口：找到容器就渲染；供 de-wiki 页面调用 */
export async function mountDeTechTree(containerId: string, civKey: string, opts?: { lng?: DeLng; nameSrc?: 'de' | 'legion'; onCiv?: (k: string) => void; onLng?: (l: DeLng) => void; onNameSrc?: (s: 'de' | 'legion') => void }) {
    const host = document.getElementById(containerId);
    if (!host) return null;
    return renderDeTechTree(host, civKey, opts);
}
