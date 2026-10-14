/**
 * DE 官方科技树渲染器（按官方 UI 100% 原生还原）。
 *
 * 视觉特征：
 *   · 原生暗色木桌背景（自适应全屏宽屏，按用户屏幕分辨率铺满）
 *   · 左侧原生卷轴面板（techtree_panel.png，边缘真实自然撕边）
 *   · 标题花纹饰条（header_ornaments.png）
 *   · 文明详情卡（下拉切文明 + 势力徽章 + 文明分类 + 加成明细 + 独特单位/科技/团队加成）
 *   · 原生图例卡（3x3 DE 实体图标 + 不可用红木叉 + 需要升级蓝框）
 *   · 原生红底斜角返回按钮（button_red_*.png）+ 原生折叠箭头（collapse_button_*.png）
 *   · 时代徽章纵列（黑暗/封建/城堡/帝王 或 远古/古典/城邦/帝国 原生盾徽）
 *   · 科技树主体 4 时代温润羊皮纸交替色带 + 原生节点黑底彩框 + 原生木叉不可用覆盖
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

const indexCache: { data?: any[] } = {};
const treeCache = new Map<string, TreePackage>();
const stringsCache: Record<string, Record<string, string>> = {};
const metaCache: { data?: MetaBundle } = {};
const iconManifest: { data?: any } = {};
const xrefCache: { data?: Record<string, string[]> } = {};
const legionCache: { data?: { byNorm: Record<string, string>; unmatched: any[] } } = {};
const civInfoCache: { data?: Record<string, any> } = {};

/** public/de-techtree/civ-info.json */
async function loadCivInfo(): Promise<Record<string, any>> {
    if (civInfoCache.data) return civInfoCache.data;
    try {
        const r = await fetch('/de-techtree/civ-info.json');
        civInfoCache.data = await r.json();
    } catch { civInfoCache.data = {}; }
    return civInfoCache.data!;
}

/** public/de-techtree/legion-names.json */
async function loadLegionNames(): Promise<{ byNorm: Record<string, string>; unmatched: any[] }> {
    if (legionCache.data) return legionCache.data;
    try {
        const r = await fetch('/de-techtree/legion-names.json');
        legionCache.data = await r.json();
    } catch { legionCache.data = { byNorm: {}, unmatched: [] }; }
    return legionCache.data!;
}

const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** public/de-techtree/xref.json */
async function loadXref(): Promise<Record<string, string[]>> {
    if (xrefCache.data) return xrefCache.data;
    try {
        const r = await fetch('/de-techtree/xref.json');
        xrefCache.data = await r.json();
    } catch { xrefCache.data = {}; }
    return xrefCache.data!;
}

/** public/de-techtree/icons/manifest.json */
async function loadIconManifest(): Promise<any> {
    if (iconManifest.data) return iconManifest.data;
    try {
        const r = await fetch('/de-techtree/icons/manifest.json');
        iconManifest.data = await r.json();
    } catch { iconManifest.data = { counts: {} }; }
    return iconManifest.data;
}

function exportedIcons(manifest: any): Record<string, Set<number>> {
    const out: Record<string, Set<number>> = { Building: new Set(), Tech: new Set(), Unit: new Set() };
    for (const kind of Object.keys(out)) {
        const missing = new Set<number>(manifest?.missing?.[kind] ?? []);
        const frames = manifest?.sheets?.[kind]?.frames;
        const set = new Set<number>();
        if (Array.isArray(manifest?.exported?.[kind])) {
            for (const n of manifest.exported[kind]) set.add(Number(n));
        } else if (frames != null) {
            for (let n = 0; n < Number(frames); n++) if (!missing.has(n)) set.add(n);
        } else {
            const needMax = manifest?.counts?.[kind]?.needMax ?? 1000;
            for (let n = 0; n <= needMax; n++) if (!missing.has(n)) set.add(n);
        }
        out[kind] = set;
    }
    return out;
}

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
        let line = '';
        for (const word of seg.split(/\s+/)) {
            if (!line) { line = word; continue; }
            if ((line + ' ' + word).length <= per) line += ' ' + word;
            else { out.push(line + ' '); line = word; }
        }
        if (line) out.push(line);
    }
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

/** 解析 DE 原始文明介绍字符串（含富文本与换行处理） */
function parseCivDescription(raw: string) {
    const text = String(raw || '')
        .replace(/<\/?[a-zA-Z][^>]*>/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\r/g, '')
        .trim();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let civClass = '';
    const bonuses: string[] = [];
    let uu = '', ut = '', tb = '';
    let section: 'bonuses' | 'uu' | 'ut' | 'tb' = 'bonuses';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 && !line.startsWith('•') && !line.includes('独特') && !line.includes('Unique')) {
            civClass = line;
            continue;
        }
        if (/^(独特单位|Unique Unit|Unique Units)[:：]?$/i.test(line)) {
            section = 'uu';
            continue;
        }
        if (/^(独特科技|Unique Tech|Unique Techs)[:：]?$/i.test(line)) {
            section = 'ut';
            continue;
        }
        if (/^(团队加成|Team Bonus)[:：]?$/i.test(line)) {
            section = 'tb';
            continue;
        }
        if (section === 'uu') {
            uu = uu ? (uu + '、' + line) : line;
        } else if (section === 'ut') {
            ut = ut ? (ut + '\n' + line) : line;
        } else if (section === 'tb') {
            tb = tb ? (tb + '\n' + line) : line;
        } else {
            bonuses.push(line.startsWith('•') ? line.slice(1).trim() : line);
        }
    }
    return { civClass, bonuses, uu, ut, tb };
}

/** 解析 DE 原始帮助与描述字符串，提取战术克制与升级路径 */
function parseHelpText(metaRec: any, T: (id: number | null | undefined) => string): { desc: string; upgrades: string } {
    if (!metaRec) return { desc: '', upgrades: '' };
    let raw = '';
    if (metaRec.nameId) {
        raw = T(21000 + metaRec.nameId) || T(20000 + metaRec.nameId);
    }
    if (!raw && metaRec.descId) {
        raw = T(20000 + metaRec.descId) || T(metaRec.descId);
    }
    if (!raw && metaRec.helpId) {
        raw = T(metaRec.helpId);
    }
    if (!raw) return { desc: '', upgrades: '' };

    let s = raw.replace(/\r/g, '').replace(/\\n/g, '\n').trim();
    // 清除开头的冗余 "生产<b>XX<b> (<cost>)" 头部
    s = s.replace(/^(?:生产|建造|创建|研究|升级为)?\s*<b>[^<]+<\/b>\s*(?:\([^)]*\))?\s*\n*/i, '');
    s = s.replace(/^(?:生产|建造|创建|研究|升级为)?\s*<b>[^<]+<b>\s*(?:\([^)]*\))?\s*\n*/i, '');
    s = s.replace(/<(?:cost|hp|attack|armor|piercearmor|range|garrison|DEFAULT)>/gi, '');

    let desc = s;
    let upgrades = '';
    const upgMatch = s.match(/(?:升级|Upgrades?)：([\s\S]+)/i);
    if (upgMatch) {
        desc = s.slice(0, upgMatch.index).trim();
        upgrades = upgMatch[1].trim();
    }
    desc = desc.replace(/<[^>]+>/g, '').trim();
    upgrades = upgrades.replace(/<[^>]+>/g, '').trim();
    return { desc, upgrades };
}

export async function renderDeTechTree(
    host: HTMLElement,
    civKey: string,
    opts: {
        lng?: DeLng;
        nameSrc?: 'de' | 'legion';
        onCiv?: (key: string) => void;
        onLng?: (l: DeLng) => void;
        onNameSrc?: (s: 'de' | 'legion') => void;
        onBack?: () => void;
    } = {},
): Promise<TechTreeHandle> {
    const lng = opts.lng ?? 'zh';
    const isZh = lng === 'zh' || lng === 'tw';
    const [index, pkg, strings, meta, iconManifestData, xref, legionNames, civInfo] = await Promise.all([
        loadIndex(), loadTree(civKey), loadStrings(lng), loadMeta(), loadIconManifest(), loadXref(), loadLegionNames(), loadCivInfo(),
    ]);

    let nameSrc: 'de' | 'legion' = opts.nameSrc ?? 'de';
    const labelOf = (it: TreeItem): string => {
        if (nameSrc === 'legion' && isZh) {
            const m = legionNames.byNorm[normName(it.name ?? '')];
            if (m) return m;
        }
        return (isZh ? (it.name_zh || it.name) : it.name) ?? '';
    };

    const haveIcon = exportedIcons(iconManifestData);
    const iconDirOf = (item: TreeItem): 'Building' | 'Tech' | 'Unit' =>
        item.use_type === 'Building' || /Building/.test(item.node_type ?? '') ? 'Building'
            : item.use_type === 'Tech' ? 'Tech' : 'Unit';
    const T = (id: number | null | undefined): string => (id == null || id < 0 ? '' : (strings[String(id)] ?? ''));

    const curCivMeta = index.find((c) => c.key === civKey);
    const isAntiquity = curCivMeta?.era === 'antiquity';

    // 时代信息
    const AGE_INFO = isAntiquity ? [
        { key: 'archaic_age', label_zh: '远古时代', label_en: 'Archaic Age', icon: '/de-techtree/ui/age_archaic_age.png' },
        { key: 'classical_age', label_zh: '古典时代', label_en: 'Classical Age', icon: '/de-techtree/ui/age_classical_age.png' },
        { key: 'civic_age', label_zh: '城邦时代', label_en: 'Civic Age', icon: '/de-techtree/ui/age_civic_age.png' },
        { key: 'ant_imperial_age', label_zh: '帝国时代', label_en: 'Imperial Age', icon: '/de-techtree/ui/age_ant_imperial_age.png' },
    ] : [
        { key: 'dark_age', label_zh: '黑暗时代', label_en: 'Dark Age', icon: '/de-techtree/ui/age_dark_age.png' },
        { key: 'feudal_age', label_zh: '封建时代', label_en: 'Feudal Age', icon: '/de-techtree/ui/age_feudal_age.png' },
        { key: 'castle_age', label_zh: '城堡时代', label_en: 'Castle Age', icon: '/de-techtree/ui/age_castle_age.png' },
        { key: 'imperial_age', label_zh: '帝王时代', label_en: 'Imperial Age', icon: '/de-techtree/ui/age_imperial_age.png' },
    ];

    host.innerHTML = '';
    host.className = 'de-tt-root';

    // ─────────────────────────────────────────────────────────────
    // 1. 左侧羊皮纸面板（techtree_panel.png）
    // ─────────────────────────────────────────────────────────────
    const panel = document.createElement('div');
    panel.className = 'de-tt-panel';

    // 标题花纹
    const header = document.createElement('div');
    header.className = 'de-tt-header';
    header.innerHTML = `<div class="de-tt-header-text">${isZh ? '科技树' : 'Technology Tree'}</div>`;
    panel.appendChild(header);

    // 文明卡片
    const civBox = document.createElement('div');
    civBox.className = 'de-tt-civ-box';

    // 顶部下拉 + 徽章
    const civTop = document.createElement('div');
    civTop.className = 'de-tt-civ-top';

    const civSelect = document.createElement('select');
    civSelect.className = 'de-tt-civ-select';
    for (const c of index) {
        const o = document.createElement('option');
        o.value = c.key;
        o.textContent = `${isZh ? (c.name_zh || c.name) : c.name}${c.era === 'antiquity' ? (isZh ? '（古典）' : ' (Ant)') : ''}`;
        if (c.key === civKey) o.selected = true;
        civSelect.appendChild(o);
    }
    civSelect.addEventListener('change', () => opts.onCiv?.(civSelect.value));
    civTop.appendChild(civSelect);

    const emblemImg = document.createElement('img');
    emblemImg.className = 'de-tt-civ-emblem';
    emblemImg.src = `/de-techtree/emblems/${civKey}.png`;
    emblemImg.alt = civKey;
    emblemImg.addEventListener('error', () => { emblemImg.style.display = 'none'; });
    civTop.appendChild(emblemImg);
    civBox.appendChild(civTop);

    // 解析并填充文明详情
    const info = civInfo[civKey];
    if (info) {
        const rawDesc = T(info.descId);
        const parsed = parseCivDescription(rawDesc);

        if (parsed.civClass) {
            const clsEl = document.createElement('div');
            clsEl.className = 'de-tt-civ-class';
            clsEl.textContent = parsed.civClass;
            civBox.appendChild(clsEl);
        }

        if (parsed.bonuses.length) {
            const bonusWrap = document.createElement('div');
            bonusWrap.className = 'de-tt-civ-bonuses';
            parsed.bonuses.forEach(b => {
                const bEl = document.createElement('div');
                bEl.className = 'de-tt-bonus-line';
                bEl.textContent = `• ${b}`;
                bonusWrap.appendChild(bEl);
            });
            civBox.appendChild(bonusWrap);
        }

        if (parsed.uu) {
            const uuHead = document.createElement('div');
            uuHead.className = 'de-tt-subheading';
            uuHead.textContent = isZh ? '独特单位：' : 'Unique Unit:';
            const uuBody = document.createElement('div');
            uuBody.className = 'de-tt-desc-item';
            uuBody.textContent = parsed.uu;
            civBox.appendChild(uuHead);
            civBox.appendChild(uuBody);
        }

        if (parsed.ut) {
            const utHead = document.createElement('div');
            utHead.className = 'de-tt-subheading';
            utHead.textContent = isZh ? '独特科技：' : 'Unique Tech:';
            const utBody = document.createElement('div');
            utBody.className = 'de-tt-desc-item';
            utBody.textContent = parsed.ut;
            civBox.appendChild(utHead);
            civBox.appendChild(utBody);
        }

        if (parsed.tb) {
            const tbHead = document.createElement('div');
            tbHead.className = 'de-tt-subheading';
            tbHead.textContent = isZh ? '团队加成：' : 'Team Bonus:';
            const tbBody = document.createElement('div');
            tbBody.className = 'de-tt-desc-item';
            tbBody.textContent = parsed.tb;
            civBox.appendChild(tbHead);
            civBox.appendChild(tbBody);
        }
    }
    panel.appendChild(civBox);

    // 图例框（3x3 官方实体表）
    const legendBox = document.createElement('div');
    legendBox.className = 'de-tt-legend-box';
    legendBox.innerHTML = `
        <div class="de-tt-legend-title">${isZh ? '图例' : 'Legend'}</div>
        <table class="de-tt-legend-table">
            <thead>
                <tr>
                    <th></th>
                    <th>${isZh ? '单位' : 'Unit'}</th>
                    <th>${isZh ? '建筑' : 'Building'}</th>
                    <th>${isZh ? '科技' : 'Tech'}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${isZh ? '普通' : 'Standard'}</td>
                    <td><img src="/de-techtree/ui/techtree_key_unit_active.png" alt="单位"></td>
                    <td><img src="/de-techtree/ui/techtree_key_building.png" alt="建筑"></td>
                    <td><img src="/de-techtree/ui/techtree_key_tech.png" alt="科技"></td>
                </tr>
                <tr>
                    <td>${isZh ? '区域' : 'Regional'}</td>
                    <td><img src="/de-techtree/ui/techtree_key_regional_unit.png" alt="区域单位"></td>
                    <td><img src="/de-techtree/ui/techtree_key_regional_building.png" alt="区域建筑"></td>
                    <td><img src="/de-techtree/ui/techtree_key_regional_tech.png" alt="区域科技"></td>
                </tr>
                <tr>
                    <td>${isZh ? '独特' : 'Unique'}</td>
                    <td><img src="/de-techtree/ui/techtree_key_unique_unit.png" alt="独特单位"></td>
                    <td><img src="/de-techtree/ui/techtree_key_unique_building.png" alt="独特建筑"></td>
                    <td><img src="/de-techtree/ui/techtree_key_unique_tech.png" alt="独特科技"></td>
                </tr>
            </tbody>
        </table>
        <div class="de-tt-legend-status">
            <span><img src="/de-techtree/ui/techtree_key_unit_active_notavailable.png" alt="不可用"> ${isZh ? '不可用' : 'Unavailable'}</span>
            <span><img src="/de-techtree/ui/techtree_key_unit_active_requiresupgrade.png" alt="需要升级"> ${isZh ? '需要升级' : 'Requires Upgrade'}</span>
        </div>
    `;
    panel.appendChild(legendBox);

    // 底部栏（红色返回按钮 + 语言与名称源选项）
    const bottomBar = document.createElement('div');
    bottomBar.className = 'de-tt-panel-bottom';

    const backBtn = document.createElement('button');
    backBtn.className = 'de-tt-btn-red';
    backBtn.textContent = isZh ? '返回' : 'Back';
    backBtn.addEventListener('click', () => {
        if (opts.onBack) opts.onBack();
        else history.back();
    });
    bottomBar.appendChild(backBtn);

    const optsWrap = document.createElement('div');
    optsWrap.className = 'de-tt-options-wrap';

    // 语言选择
    const lngSel = document.createElement('select');
    lngSel.className = 'de-tt-opt-select';
    lngSel.title = '语言 / Language';
    for (const l of DE_LANGS) {
        const o = document.createElement('option');
        o.value = l.code;
        o.textContent = l.label;
        if (l.code === lng) o.selected = true;
        lngSel.appendChild(o);
    }
    lngSel.addEventListener('change', () => {
        try { localStorage.setItem('de-techtree-lng', lngSel.value); } catch {}
        opts.onLng?.(lngSel.value as DeLng);
    });
    optsWrap.appendChild(lngSel);

    // 兵种命名来源
    const nameSel = document.createElement('select');
    nameSel.className = 'de-tt-opt-select';
    nameSel.title = '兵种名口径';
    for (const [val, label] of [['de', isZh ? '官方名' : 'DE Names'], ['legion', isZh ? '军团鉴赏名' : 'Legion Names']] as const) {
        const o = document.createElement('option');
        o.value = val;
        o.textContent = label;
        if (val === nameSrc) o.selected = true;
        nameSel.appendChild(o);
    }
    nameSel.addEventListener('change', () => {
        nameSrc = nameSel.value as 'de' | 'legion';
        try { localStorage.setItem('de-techtree-namesrc', nameSrc); } catch {}
        opts.onNameSrc?.(nameSrc);
    });
    optsWrap.appendChild(nameSel);

    bottomBar.appendChild(optsWrap);
    panel.appendChild(bottomBar);
    host.appendChild(panel);

    // ─────────────────────────────────────────────────────────────
    // 2. 时代徽章纵列（4 个时代 shield 图标垂直对齐）
    // ─────────────────────────────────────────────────────────────
    const agesCol = document.createElement('div');
    agesCol.className = 'de-tt-ages-col';

    for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        slot.className = 'de-tt-age-slot';
        const img = document.createElement('img');
        img.src = AGE_INFO[i].icon;
        img.alt = AGE_INFO[i].key;
        const lbl = document.createElement('div');
        lbl.className = 'de-tt-age-label';
        lbl.textContent = isZh ? AGE_INFO[i].label_zh : AGE_INFO[i].label_en;
        slot.appendChild(img);
        slot.appendChild(lbl);
        agesCol.appendChild(slot);
    }

    // 底部折叠/展开按钮
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'de-tt-collapse-btn';
    collapseBtn.title = isZh ? '收起 / 展开侧栏' : 'Collapse / Expand Sidebar';
    collapseBtn.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        collapseBtn.classList.toggle('collapsed');
    });
    agesCol.appendChild(collapseBtn);
    host.appendChild(agesCol);

    // ─────────────────────────────────────────────────────────────
    // 3. 科技树主画布区域
    // ─────────────────────────────────────────────────────────────
    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'de-tt-canvas-wrap';
    // 鼠标滚轮横向滚动支持
    const onCanvasWheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            canvasWrap.scrollLeft += e.deltaY;
        }
    };
    canvasWrap.addEventListener('wheel', onCanvasWheel, { passive: false });
    host.appendChild(canvasWrap);

    // 动态计算高度：占满整个可视区
    const availH = host.clientHeight || (window.innerHeight - 32);
    const view = computeTreeView(pkg, availH, 28);
    const { rowHeight, elementHeight: EHh } = view;
    const TOP_PADDING = LAYOUT_CONST.TOP_PADDING;

    const canvas = document.createElement('div');
    canvas.style.cssText = `position:relative;width:${view.width}px;height:${view.height}px`;
    canvasWrap.appendChild(canvas);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(view.width));
    svg.setAttribute('height', String(view.height));
    svg.setAttribute('viewBox', `0 0 ${view.width} ${view.height}`);
    svg.style.display = 'block';
    canvas.appendChild(svg);

    // 4 个时代交替温润羊皮纸背景色带
    for (let age = 0; age < 4; age++) {
        const band = document.createElementNS(SVG_NS, 'rect');
        band.setAttribute('x', '0');
        band.setAttribute('y', String(age * rowHeight));
        band.setAttribute('width', String(view.width));
        band.setAttribute('height', String(rowHeight));
        band.setAttribute('fill', age % 2 === 0 ? 'rgba(238, 226, 204, 0.45)' : 'rgba(224, 210, 184, 0.35)');
        svg.appendChild(band);

        // 时代分隔横线
        if (age > 0) {
            const hline = document.createElementNS(SVG_NS, 'line');
            hline.setAttribute('x1', '0');
            hline.setAttribute('x2', String(view.width));
            hline.setAttribute('y1', String(age * rowHeight));
            hline.setAttribute('y2', String(age * rowHeight));
            hline.setAttribute('stroke', 'rgba(90, 65, 30, 0.45)');
            hline.setAttribute('stroke-width', '1.5');
            svg.appendChild(hline);
        }
    }

    // 建筑列分隔纵线
    for (const lane of view.lanes) {
        const l = document.createElementNS(SVG_NS, 'line');
        l.setAttribute('x1', String(lane.x - LAYOUT_CONST.PADDING / 2));
        l.setAttribute('x2', String(lane.x - LAYOUT_CONST.PADDING / 2));
        l.setAttribute('y1', '0');
        l.setAttribute('y2', String(view.height));
        l.setAttribute('stroke', 'rgba(90, 65, 30, 0.22)');
        l.setAttribute('stroke-width', '1');
        svg.appendChild(l);
    }

    // 树分支连线
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
        path.setAttribute('stroke', '#2e1d0d');
        path.setAttribute('stroke-width', '2.2');
        path.setAttribute('opacity', '0.85');
        svg.appendChild(path);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. 浮动悬停面板（#helptext，DE 经典暗金尊贵风格）
    // ─────────────────────────────────────────────────────────────
    const tip = document.createElement('div');
    tip.className = 'de-tt-tooltip';
    host.appendChild(tip);

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

        // 组装成本 HTML
        let costHtml = '';
        if (d.costs && d.costs.length) {
            const pills = d.costs.map((c: any) => `<span class="de-tt-cost-pill ${c.cls}">${c.icon} ${c.val} ${c.label}</span>`).join('');
            costHtml = `<div class="de-tt-cost-row"><b>${isZh ? '成本：' : 'Cost: '}</b>${pills}</div>`;
        }

        // 组装攻防护甲属性 HTML
        let statsHtml = '';
        if (d.stats && d.stats.length) {
            const chips = d.stats.map((s: any) => `<div class="de-tt-stat-chip">${s.icon} ${s.label}: <b>${s.val}</b></div>`).join('');
            statsHtml = `<div class="de-tt-stats-grid">${chips}</div>`;
        }

        // 组装可用文明徽章 HTML
        let xrefHtml = '';
        const avail = xref[d.nodeKey] ?? [];
        if (avail.length) {
            const emblems = avail.map((k: string) => {
                const c = index.find((x) => x.key === k);
                const title = (c ? (isZh ? (c.name_zh || c.name) : c.name) : k) + (k === civKey ? (isZh ? '（本文明）' : ' (Current)') : '');
                return `<img class="de-tt-xref-emblem" src="/de-techtree/emblems/${k}.png" data-civ="${k}" title="${title}">`;
            }).join('');
            xrefHtml = `
                <div class="de-tt-xref-wrap">
                    <div class="de-tt-xref-title">${isZh ? `${d.typeLabel} · ${avail.length} 个文明可用` : `${avail.length} Civilizations Available`}</div>
                    <div class="de-tt-xref-grid">${emblems}</div>
                </div>
            `;
        }

        tip.innerHTML = `
            <div class="de-tt-tip-header">
                <div class="de-tt-tip-title">${d.name}</div>
                <div class="de-tt-tip-badge ${d.status === 'NotAvailable' ? 'na' : ''}">
                    ${d.typeLabel} · ${d.age}
                </div>
            </div>
            ${d.status === 'NotAvailable' ? `<div class="de-tt-na-banner">✕ ${isZh ? '本文明不可研发 / 无法训练' : 'Not Available for this Civilization'}</div>` : ''}
            ${costHtml}
            ${statsHtml}
            ${d.desc ? `<div class="de-tt-tip-desc">${d.desc}</div>` : ''}
            ${d.upgrades ? `<div class="de-tt-tip-upgrades"><b>${isZh ? '升级加成：' : 'Upgrades: '}</b>${d.upgrades}</div>` : ''}
            ${xrefHtml}
        `;

        // 徽章点击快速切换文明
        tip.querySelectorAll('.de-tt-xref-emblem').forEach((img) => {
            img.addEventListener('click', () => {
                const k = (img as HTMLElement).dataset.civ;
                if (k) { hideTip(); opts.onCiv?.(k); }
            });
        });

        // ── 智能避让定位：绝不覆盖鼠标悬停的节点，彻底杜绝闪烁 ──
        tip.style.display = 'block';
        const tipW = tip.offsetWidth || 360;
        const tipH = tip.offsetHeight || 220;

        const gRect = g.getBoundingClientRect();
        const hostRect = host.getBoundingClientRect();
        const nodeLeft = gRect.left - hostRect.left;
        const nodeTop = gRect.top - hostRect.top;
        const nodeWidth = gRect.width;

        // 优先放右侧；若右侧超出屏幕则放置于左侧
        let targetLeft = nodeLeft + nodeWidth + 14;
        if (targetLeft + tipW > host.clientWidth - 12) {
            targetLeft = Math.max(12, nodeLeft - tipW - 14);
        }

        // 垂直方向：居中微调并限制在可视区域
        let targetTop = Math.max(10, Math.min(nodeTop - 8, host.clientHeight - tipH - 12));

        tip.style.left = `${Math.round(targetLeft)}px`;
        tip.style.top = `${Math.round(targetTop)}px`;
    };

    const hideTip = () => {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        tip.style.display = 'none';
    };

    const scheduleHide = () => {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { tip.style.display = 'none'; hideTimer = null; }, 260);
    };

    canvasWrap.addEventListener('mouseleave', hideTip);

    // ─────────────────────────────────────────────────────────────
    // 5. 科技树节点绘制
    // ─────────────────────────────────────────────────────────────
    const allItems: TreeItem[] = [...pkg.buildings, ...pkg.units_techs];
    allItems.forEach(normalizeItem);

    for (const item of allItems) {
        const p = view.pos.get(item.id);
        if (!p) continue;
        const colour = nodeColour(item.node_type);
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('transform', `translate(${p.x},${p.y})`);

        // 节点黑底框
        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('width', String(EHh));
        rect.setAttribute('height', String(EHh));
        rect.setAttribute('rx', '3');
        rect.setAttribute('fill', '#11100e');
        rect.setAttribute('stroke', colour);
        rect.setAttribute('stroke-width', '2');
        (rect as any).style.cursor = 'pointer';
        g.appendChild(rect);

        // 实体图标
        const dir = iconDirOf(item);
        const pi = item.picture_index ?? -1;
        if (pi >= 0 && haveIcon[dir]?.has(pi)) {
            const img = document.createElementNS(SVG_NS, 'image');
            img.setAttribute('href', `/de-techtree/icons/${dir}/${pi}.png`);
            img.setAttribute('width', String(EHh * 0.52));
            img.setAttribute('height', String(EHh * 0.52));
            img.setAttribute('x', String(EHh * 0.24));
            img.setAttribute('y', String(EHh * 0.05));
            img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            img.addEventListener('error', () => img.remove());
            g.appendChild(img);
        } else {
            const ph = document.createElementNS(SVG_NS, 'rect');
            ph.setAttribute('x', String(EHh * 0.24));
            ph.setAttribute('y', String(EHh * 0.05));
            ph.setAttribute('width', String(EHh * 0.52));
            ph.setAttribute('height', String(EHh * 0.52));
            ph.setAttribute('fill', colour);
            ph.setAttribute('opacity', '0.15');
            ph.setAttribute('rx', '2');
            g.appendChild(ph);
        }

        // 节点文字名称
        const label = labelOf(item);
        const lines = splitLines(label ?? '', lng);
        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(EHh / 2));
        text.setAttribute('y', String(EHh * 0.72));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', String(Math.max(9, Math.round(EHh * 0.16))));
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-family', '"Noto Serif SC", sans-serif');

        // 文字按类型高亮：单位浅蓝、建筑金黄、科技浅绿、独特淡紫
        let textColor = '#e8dec8';
        if (dir === 'Building') textColor = '#f8c278';
        else if (dir === 'Tech') textColor = '#88f088';
        else if (item.node_type === 'UniqueUnit' || item.node_type === 'UniqueTech') textColor = '#e0aaff';
        else if (item.node_type === 'RegionalUnit') textColor = '#a8b4fc';
        else textColor = '#7ee0ff';

        text.setAttribute('fill', textColor);
        (text as any).style.pointerEvents = 'none';

        lines.forEach((ln, i) => {
            const ts = document.createElementNS(SVG_NS, 'tspan');
            ts.setAttribute('x', String(EHh / 2));
            ts.setAttribute('dy', i === 0 ? '0' : String(Math.round(EHh * 0.19)));
            ts.textContent = ln;
            text.appendChild(ts);
        });
        g.appendChild(text);

        // 不可用：官方木板交叉遮罩（notavailable_cross.png）覆盖
        if (item.node_status === 'NotAvailable') {
            const darkCover = document.createElementNS(SVG_NS, 'rect');
            darkCover.setAttribute('width', String(EHh));
            darkCover.setAttribute('height', String(EHh));
            darkCover.setAttribute('rx', '3');
            darkCover.setAttribute('fill', '#000000');
            darkCover.setAttribute('opacity', '0.42');
            (darkCover as any).style.pointerEvents = 'none';
            g.appendChild(darkCover);

            const cross = document.createElementNS(SVG_NS, 'image');
            cross.setAttribute('href', '/de-techtree/ui/notavailable_cross.png');
            cross.setAttribute('width', String(EHh));
            cross.setAttribute('height', String(EHh));
            cross.setAttribute('x', '0');
            cross.setAttribute('y', '0');
            cross.setAttribute('preserveAspectRatio', 'none');
            (cross as any).style.pointerEvents = 'none';
            g.appendChild(cross);
        } else if (item.node_status === 'ResearchRequired') {
            // 需要升级/研发：蓝框高亮
            const bd = document.createElementNS(SVG_NS, 'rect');
            bd.setAttribute('width', String(EHh));
            bd.setAttribute('height', String(EHh));
            bd.setAttribute('rx', '3');
            bd.setAttribute('fill', 'none');
            bd.setAttribute('stroke', '#2a8fff');
            bd.setAttribute('stroke-width', '3');
            (bd as any).style.pointerEvents = 'none';
            g.appendChild(bd);
        }

        // 绑定悬停面板详情
        const itemDir = iconDirOf(item);
        const metaRec = itemDir === 'Building' ? meta.buildings[String(item.node_id)]
            : itemDir === 'Tech' ? meta.techs[String(item.node_id)]
            : meta.units[String(item.node_id)];

        const { desc: helpDesc, upgrades: helpUpgrades } = parseHelpText(metaRec, T);

        const costs: Array<{ label: string; val: number; cls: string; icon: string }> = [];
        if (metaRec?.cost) {
            if (metaRec.cost.food) costs.push({ label: isZh ? '食物' : 'Food', val: metaRec.cost.food, cls: 'de-tt-cost-food', icon: '🥩' });
            if (metaRec.cost.wood) costs.push({ label: isZh ? '木材' : 'Wood', val: metaRec.cost.wood, cls: 'de-tt-cost-wood', icon: '🪵' });
            if (metaRec.cost.gold) costs.push({ label: isZh ? '黄金' : 'Gold', val: metaRec.cost.gold, cls: 'de-tt-cost-gold', icon: '🪙' });
            if (metaRec.cost.stone) costs.push({ label: isZh ? '石头' : 'Stone', val: metaRec.cost.stone, cls: 'de-tt-cost-stone', icon: '🧱' });
        }

        const stats: Array<{ label: string; val: any; icon: string }> = [];
        if (metaRec?.hp != null) stats.push({ label: isZh ? '生命' : 'HP', val: metaRec.hp, icon: '❤️' });
        if (metaRec?.atk != null) stats.push({ label: isZh ? '攻击' : 'Atk', val: metaRec.atk, icon: '⚔️' });
        if (metaRec?.ma != null || metaRec?.pa != null) stats.push({ label: isZh ? '护甲' : 'Armor', val: `${metaRec?.ma ?? 0}/${metaRec?.pa ?? 0}`, icon: '🛡️' });
        if (metaRec?.range) stats.push({ label: isZh ? '射程' : 'Range', val: metaRec.range, icon: '🏹' });
        if (metaRec?.speed != null) stats.push({ label: isZh ? '速度' : 'Speed', val: metaRec.speed, icon: '🐎' });
        if (metaRec?.trainTime != null) stats.push({ label: isZh ? '训练' : 'Time', val: `${metaRec.trainTime}s`, icon: '⏱️' });
        if (metaRec?.researchTime != null) stats.push({ label: isZh ? '研发' : 'Time', val: `${metaRec.researchTime}s`, icon: '⏳' });

        (g as any)._tip = {
            name: formatName(label ?? ''),
            type: item.node_type ?? '',
            typeLabel: TYPE_ZH[item.node_type ?? ''] ?? (item.node_type ?? ''),
            nodeKey: `${item.use_type}_${item.node_id}`,
            avail: (xref[`${item.use_type}_${item.node_id}`] ?? []).length,
            status: item.node_status ?? '',
            age: (isZh ? ['黑暗时代', '封建时代', '城堡时代', '帝王时代'] : ['Dark Age', 'Feudal Age', 'Castle Age', 'Imperial Age'])[(item.age_id ?? 1) - 1],
            costs,
            stats,
            desc: helpDesc,
            upgrades: helpUpgrades,
        };
        (g as any)._pos = p;

        g.addEventListener('mouseenter', () => showTip(g));
        g.addEventListener('focus', () => showTip(g));
        g.addEventListener('mouseleave', () => scheduleHide());

        svg.appendChild(g);
    }

    const ret: TechTreeHandle = {
        destroy() {
            canvasWrap.removeEventListener('wheel', onCanvasWheel);
            civSelect.removeEventListener('change', () => {});
            lngSel.removeEventListener('change', () => {});
            nameSel.removeEventListener('change', () => {});
            backBtn.removeEventListener('click', () => {});
            host.innerHTML = '';
            host.className = '';
        },
    };
    return ret;
}

export async function mountDeTechTree(
    containerId: string,
    civKey: string,
    opts?: {
        lng?: DeLng;
        nameSrc?: 'de' | 'legion';
        onCiv?: (k: string) => void;
        onLng?: (l: DeLng) => void;
        onNameSrc?: (s: 'de' | 'legion') => void;
        onBack?: () => void;
    },
) {
    const host = document.getElementById(containerId);
    if (!host) return null;
    return renderDeTechTree(host, civKey, opts);
}
