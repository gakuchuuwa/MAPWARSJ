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

async function loadStrings(lng: 'en' | 'zh'): Promise<Record<string, string>> {
    if (stringsCache[lng]) return stringsCache[lng];
    const r = await fetch(`/de-techtree/strings-${lng}.json`);
    stringsCache[lng] = await r.json();
    return stringsCache[lng];
}

/** 折行：先按原始换行切；中文每行 ~7 字、英文 ~11 字符；最多 3 行，超出加省略号 */
function splitLines(text: string, lng: 'en' | 'zh'): string[] {
    const raw = formatName(text).split('\n').filter(Boolean);
    const per = lng === 'zh' ? 7 : 11;
    const out: string[] = [];
    for (const seg of raw) {
        if (seg.length <= per) { out.push(seg); continue; }
        for (let i = 0; i < seg.length; i += per) out.push(seg.slice(i, i + per));
    }
    if (out.length <= 3) return out;
    const clipped = out.slice(0, 3);
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
    opts: { lng?: 'en' | 'zh'; onCiv?: (key: string) => void } = {},
): Promise<TechTreeHandle> {
    const lng = opts.lng ?? 'zh';
    const [index, pkg, strings, meta, iconManifest] = await Promise.all([
        loadIndex(), loadTree(civKey), loadStrings(lng), loadMeta(), loadIconManifest(),
    ]);
    const haveIcon = exportedIcons(iconManifest);
    const iconDirOf = (item: TreeItem): 'Building' | 'Tech' | 'Unit' =>
        item.use_type === 'Building' || /Building/.test(item.node_type ?? '') ? 'Building'
            : item.use_type === 'Tech' ? 'Tech' : 'Unit';
    const T = (id: number | null | undefined): string => (id == null || id < 0 ? '' : (strings[String(id)] ?? ''));
    const view = computeTreeView(pkg, window.innerHeight);
    const { rowHeight } = view;
    const TOP_PADDING = LAYOUT_CONST.TOP_PADDING;
    const EHh = view.elementHeight;

    host.innerHTML = '';
    host.style.cssText = 'display:flex;align-items:flex-start;gap:0;background:#e8dcc2;border:1px solid #4a3e2b;border-radius:4px;overflow:hidden;position:relative';
    const canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'flex:1 1 auto;overflow:auto;max-height:calc(100vh - 120px)';
    host.appendChild(canvasWrap);
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(view.width));
    svg.setAttribute('height', String(view.height));
    svg.setAttribute('viewBox', `0 0 ${view.width} ${view.height}`);
    svg.style.display = 'block';
    svg.style.background = '#e8dcc2';
    canvasWrap.appendChild(svg);

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
        t.textContent = (lng === 'zh' ? AGE_NAMES_ZH : AGE_NAMES_EN)[age];
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
    tip.style.cssText = 'position:absolute;display:none;z-index:50;max-width:340px;background:#f7f1e3;border:2px solid #8a7448;' +
        'border-radius:4px;padding:8px 10px;font-size:12px;line-height:1.55;color:#2b2013;box-shadow:0 4px 14px #0006;pointer-events:none';
    host.appendChild(tip);
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
        tip.style.display = 'block';
        // 面板挂在 host（定位上下文）上，不是滚动容器里 → 要减去画布的滚动量
        const vx = (g as any)._pos.x - canvasWrap.scrollLeft;
        const vy = (g as any)._pos.y - canvasWrap.scrollTop;
        const left = Math.max(4, Math.min(vx + 12, host.clientWidth - tip.offsetWidth - 8));
        const top = Math.max(4, Math.min(vy, host.clientHeight - tip.offsetHeight - 8));
        tip.style.left = `${left}px`;
        tip.style.top = `${Math.max(4, top)}px`;
    };
    const hideTip = () => { tip.style.display = 'none'; };
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
        const label = lng === 'zh' ? (item.name_zh || item.name) : item.name;
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

        // 不可用：叠灰罩（官方 rect_disabled_gray）
        if (item.node_status === 'NotAvailable') {
            const grey = document.createElementNS(SVG_NS, 'rect');
            grey.setAttribute('width', String(EHh));
            grey.setAttribute('height', String(EHh));
            grey.setAttribute('rx', '3');
            grey.setAttribute('fill', '#777777');
            grey.setAttribute('opacity', '0.62');
            grey.setAttribute('stroke', colour);
            grey.setAttribute('stroke-width', '2');
            (grey as any).style.pointerEvents = 'none';
            g.appendChild(grey);
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
            status: item.node_status ?? '',
            age: (lng === 'zh' ? AGE_KEY_ZH : ['Dark', 'Feudal', 'Castle', 'Imperial'])[(item.age_id ?? 1) - 1],
            cost: costTxt,
            stats: statsTxt,
            help: helptext.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        };
        g.addEventListener('mouseenter', () => showTip(g));
        g.addEventListener('focus', () => showTip(g));
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
        o.textContent = `${lng === 'zh' ? (c.name_zh || c.name) : c.name}${c.era === 'antiquity' ? '（古典）' : ''}`;
        if (c.key === civKey) o.selected = true;
        sel.appendChild(o);
    }
    const onSel = () => opts.onCiv?.(sel.value);
    sel.addEventListener('change', onSel);
    side.appendChild(sel);
    const info = document.createElement('div');
    info.style.marginTop = '8px';
    const cur = index.find((c) => c.key === civKey);
    info.innerHTML = `<div style="color:#d4af37;font-weight:bold;font-size:14px">${lng === 'zh' ? (cur?.name_zh || cur?.name) : cur?.name}</div>
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
    idxTitle.textContent = lng === 'zh' ? '建筑索引' : 'Buildings';
    side.appendChild(idxTitle);
    const idxList = document.createElement('div');
    idxList.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:4px';
    for (const b of pkg.buildings) {
        const cell = document.createElement('div');
        cell.title = formatName(lng === 'zh' ? (b.name_zh || b.name) : b.name);
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
        destroy() { sel.removeEventListener('change', onSel); host.innerHTML = ''; side.remove(); },
    };
    return ret;
}

/** 便捷入口：找到容器就渲染；供 de-wiki 页面调用 */
export async function mountDeTechTree(containerId: string, civKey: string, opts?: { lng?: 'en' | 'zh'; onCiv?: (k: string) => void }) {
    const host = document.getElementById(containerId);
    if (!host) return null;
    return renderDeTechTree(host, civKey, opts);
}
