/**
 * MAPWAR 实体批量管理工具
 * 访问：http://localhost:5173/batch-manager.html
 *
 * 功能：查看/新增/校验 据点、势力、旗号、武将、武将技、精锐
 */

import { pinyin } from 'pinyin-pro';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { GENERAL_ERA, type GeneralEra } from '../data/GeneralEra';
import { getCityRegion, REGION_ORDER } from '../systems/RegionSystem';
import { resolveCityDeBuildingStyle } from '../systems/cityDeStyle';
import { getCultureLegionName } from '../types/CultureFormations';
import {
    BASE16_STYLES,
    BASE16_NAMES,
    CULTURE_59_GROUPS,
    LAYER3_CUSTOM_GROUPS,
    ALL_BRANCHES_MAP,
    resolveCityHierarchy,
    type Base16StyleKey,
    type CityBase16Resolution,
} from '../systems/CultureHierarchy';

export const ERA_LABELS: Record<GeneralEra, string> = {
    antiquity: '古典时代',
    feudal: '封建时代',
    castle: '城堡时代',
    imperial: '帝王时代',
};

export const ERA_ORDER: Record<GeneralEra, number> = {
    antiquity: 1,
    feudal: 2,
    castle: 3,
    imperial: 4,
};

interface FactionRow {
    id: string;
    name: string;
    flagText?: string;
    cityId?: string;
    cityName?: string;
    lat?: number;
    lng?: number;
    cityType?: string;
    mirror?: boolean;
    generalId?: string;
    generalName?: string;
    portrait?: string;
    tier?: string;
    era?: GeneralEra;
    eraLabel?: string;
    tacticalSkillId?: string;
    strategicSkillId?: string;
    advantageSkillId?: string;
    balanceSkillId?: string;
    disadvantageSkillId?: string;
    atkAdvantageSkillId?: string;
    atkBalanceSkillId?: string;
    atkDisadvantageSkillId?: string;
    defAdvantageSkillId?: string;
    defBalanceSkillId?: string;
    defDisadvantageSkillId?: string;
    aptitude?: string;
    attackStyle?: 'attack' | 'defense' | 'balanced';
    eliteName?: string;
    eliteTier?: number;
    eliteRegion?: string;
    cityRegion?: string;
    legionName?: string;
    completeness: number;
}

interface EntityData {
    factions: Array<{ id: string; name: string }>;
    cities: Array<{
        id: string; name: string; factionId: string; lat: number; lng: number;
        type: string; troops: number; region?: string; tier?: number; mirror?: boolean;
        /** 2026-09-11 加：据点编辑器要显示/编辑这三项（服务端 /api/entity-data 已同步返回） */
        buildingStyle?: string; note?: string;
    }>;
    flags: Record<string, string>;
    capitals: Record<string, string>;
    generals: Record<string, { generalId: string; generalName: string; portrait: string }>;
    profiles: Record<string, {
        tier: string; tacticalSkillId: string; strategicSkillId?: string;
        advantageSkillId?: string; balanceSkillId?: string; disadvantageSkillId?: string;
        atkAdvantageSkillId?: string; atkBalanceSkillId?: string; atkDisadvantageSkillId?: string;
        defAdvantageSkillId?: string; defBalanceSkillId?: string; defDisadvantageSkillId?: string;
        aptitude?: string;
        attackStyle?: 'attack' | 'defense' | 'balanced';
    }>;
    elites: Record<string, { name: string; tier: number; region: string }>;
    eras?: Record<string, string>;
    tacticalSkills: Array<{ id: string; grid: string; displayName: string; assignTier?: string; triClass?: string; sixClass?: string }>;
    strategicSkills: Array<{ id: string; grid: string; displayName: string; effect: string; magnitude: number }>;
    regions: string[];
}

interface ValidationIssue {
    level: string;
    msg: string;
    factionId?: string;
}


interface SkillCoverageReport {
    ok: boolean;
    tactical: { total: number; used: number };
    strategic: { total: number; used: number };
    unusedTactical: Array<{ id: string; displayName: string }>;
    unusedStrategic: Array<{ id: string; displayName: string }>;
    error?: string;
}

// ── Pinyin helpers ──

function toPinyinId(chinese: string): string {
    return pinyin(chinese, { toneType: 'none', type: 'array' })
        .map(s => s.replace(/\s+/g, ''))
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

/** 归一化立绘路径：反斜杠→正斜杠、去盘符/public 前缀、补前导斜杠 → /assets/.../x.png。
 *  兼容直接粘贴 Windows 路径（C:\...\public\assets\X\y.png、assets\X\y.png 等）。 */
function normalizePortraitPath(p: string): string {
    if (!p) return p;
    const s = p.replace(/\\/g, '/');
    const i = s.toLowerCase().indexOf('/assets/');
    if (i >= 0) return s.slice(i);
    const j = s.toLowerCase().indexOf('assets/');
    if (j >= 0) return '/' + s.slice(j);
    return s;
}

function makeUniqueId(base: string, existingIds: Set<string>): string {
    if (!existingIds.has(base)) return base;
    if (!existingIds.has(base + '_d')) return base + '_d';
    for (let i = 2; i < 100; i++) {
        const candidate = `${base}_d${i}`;
        if (!existingIds.has(candidate)) return candidate;
    }
    return base + '_' + Date.now();
}

let entityData: EntityData | null = null;
let rows: FactionRow[] = [];
let filteredRows: FactionRow[] = [];
let issues: ValidationIssue[] = [];
let searchQuery = '';
let filterMode: 'all' | 'incomplete' | 'no-general' | 'no-portrait' | 'no-elite' | 'no-legion' | 'no-skill' | 'errors'
    | 'era-antiquity' | 'era-feudal' | 'era-castle' | 'era-imperial' | 'no-era' = 'all';
let sortCol = 'id';
let sortAsc = true;
let editingFactionId: string | null = null;

const app = document.getElementById('app')!;
app.innerHTML = `
<header class="bm-header">
  <div class="bm-title">MAPWAR 实体批量管理</div>
  <div class="bm-header-actions">
    <a href="/" class="bm-link">← 返回游戏</a>
    <a href="/legion-editor.html" class="bm-link">军团方阵</a>
    <a href="/portrait-tuner.html" class="bm-link">立绘调校</a>
    <button type="button" id="bm-reload" class="bm-btn">刷新数据</button>
    <button type="button" id="bm-export" class="bm-btn">导出名册</button>
    <button type="button" id="bm-skill-coverage" class="bm-btn bm-btn-warn" title="只检查武将可佩戴技能；不含长驱深入、据险而守">检查技能覆盖</button>
    <button type="button" id="bm-name-audit" class="bm-btn bm-btn-warn" title="精锐 ≤5 字、武将/势力/据点 ≤9 字且全局不重名；武将名本名优先，重名用称呼">名称审计</button>
    <button type="button" id="bm-validate" class="bm-btn bm-btn-warn">运行校验</button>
  </div>
</header>
<div class="bm-viewbar">
  <button type="button" id="bm-view-entities" class="bm-btn bm-btn-primary">🧩 实体录入（现有）</button>
  <button type="button" id="bm-view-cities" class="bm-btn">🏙️ 据点编辑（全部据点）</button>
</div>
<div class="bm-toolbar" id="bm-toolbar-entities">
  <input id="bm-search" class="bm-input" type="search" placeholder="搜索 ID / 名称 / 旗号 / 时代…" />
  <select id="bm-filter" class="bm-select">
    <option value="all">全部</option>
    <option value="era-antiquity">古典时代</option>
    <option value="era-feudal">封建时代</option>
    <option value="era-castle">城堡时代</option>
    <option value="era-imperial">帝王时代</option>
    <option value="no-era">缺时代</option>
    <option value="incomplete">不完整</option>
    <option value="no-general">缺武将</option>
    <option value="no-portrait">缺立绘</option>
    <option value="no-elite">缺精锐</option>
    <option value="no-legion">缺军团</option>
    <option value="no-skill">缺武将技</option>
    <option value="errors">有错误</option>
  </select>
  <span id="bm-stats" class="bm-stats"></span>
  <button type="button" id="bm-add-new" class="bm-btn bm-btn-primary">+ 新增实体</button>
</div>
<div class="bm-body" id="bm-body-entities">
  <main class="bm-main">
    <div id="bm-table-wrap" class="bm-table-wrap"></div>
  </main>
  <aside id="bm-panel" class="bm-panel" style="display:none">
    <div id="bm-panel-content"></div>
  </aside>
</div>

<!-- 🔴 [2026-09-11 主人需求] 据点编辑视图：全部据点列出 + 编辑属性（含建筑风格下拉） -->
<div class="bm-toolbar" id="bm-toolbar-cities" style="display:none">
  <input id="bm-city-search" class="bm-input" type="search" placeholder="搜索 据点名 / ID / 势力 / 备注…" />
  <select id="bm-city-type" class="bm-select">
    <option value="all">全部等级</option>
    <option value="big_city">大城 big_city</option>
    <option value="medium_city">中城 medium_city</option>
    <option value="small_city">小城 small_city</option>
    <option value="pass">险要 pass</option>
    <option value="stockade">城寨 stockade</option>
  </select>
  <select id="bm-city-style" class="bm-select"><option value="all">全部建筑风格</option></select>
  <span id="bm-city-stats" class="bm-stats"></span>
</div>
<div class="bm-body" id="bm-body-cities" style="display:none">
  <main class="bm-main">
    <div id="bm-city-table-wrap" class="bm-table-wrap"></div>
  </main>
  <aside id="bm-city-panel" class="bm-panel" style="display:none">
    <div id="bm-city-panel-content"></div>
  </aside>
</div>
<div id="bm-validation" class="bm-validation" style="display:none">
  <div class="bm-validation-header">
    <span id="bm-validation-title">校验结果</span>
    <button type="button" id="bm-close-validation" class="bm-btn bm-btn-sm">关闭</button>
  </div>
  <div id="bm-validation-list"></div>
</div>
<div id="bm-toast" class="bm-toast"></div>
`;

injectStyles();

const els = {
    search: document.getElementById('bm-search') as HTMLInputElement,
    filter: document.getElementById('bm-filter') as HTMLSelectElement,
    stats: document.getElementById('bm-stats')!,
    tableWrap: document.getElementById('bm-table-wrap')!,
    panel: document.getElementById('bm-panel')!,
    panelContent: document.getElementById('bm-panel-content')!,
    validation: document.getElementById('bm-validation')!,
    validationTitle: document.getElementById('bm-validation-title')!,
    validationList: document.getElementById('bm-validation-list')!,
    toast: document.getElementById('bm-toast')!,
    // 据点编辑视图
    viewEntities: document.getElementById('bm-view-entities') as HTMLButtonElement,
    viewCities: document.getElementById('bm-view-cities') as HTMLButtonElement,
    toolbarEntities: document.getElementById('bm-toolbar-entities')!,
    toolbarCities: document.getElementById('bm-toolbar-cities')!,
    bodyEntities: document.getElementById('bm-body-entities')!,
    bodyCities: document.getElementById('bm-body-cities')!,
    citySearch: document.getElementById('bm-city-search') as HTMLInputElement,
    cityType: document.getElementById('bm-city-type') as HTMLSelectElement,
    cityStyle: document.getElementById('bm-city-style') as HTMLSelectElement,
    cityStats: document.getElementById('bm-city-stats')!,
    cityTableWrap: document.getElementById('bm-city-table-wrap')!,
    cityPanel: document.getElementById('bm-city-panel')!,
    cityPanelContent: document.getElementById('bm-city-panel-content')!,
};

function injectStyles(): void {
    const s = document.createElement('style');
    s.textContent = `
      .bm-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 16px; border-bottom:1px solid #2a2620; background:#141210;
      }
      .bm-title { font-size:18px; font-weight:700; color:#f5e6c8; }
      .bm-header-actions { display:flex; gap:12px; align-items:center; }
      .bm-link { color:#8ab4c4; font-size:13px; text-decoration:none; }
      .bm-toolbar {
        display:flex; gap:12px; align-items:center; padding:8px 16px;
        border-bottom:1px solid #2a2620; background:#12100e;
      }
      .bm-input, .bm-select {
        background:#1c1916; border:1px solid #3a342c; color:#eee;
        border-radius:4px; padding:6px 10px; font-size:13px;
      }
      .bm-input { width:260px; }
      .bm-stats { font-size:12px; color:#a89f8f; flex:1; text-align:right; }
      .bm-btn {
        background:#2a2620; color:#e8e0d0; border:1px solid #4a4238;
        border-radius:4px; padding:6px 14px; cursor:pointer; font-size:13px;
        font-weight:600; white-space:nowrap;
      }
      .bm-btn:hover { background:#3a342c; }
      .bm-btn-primary { background:#5a4a28; border-color:#8a7038; color:#fff8e8; }
      .bm-btn-warn { background:#5a2828; border-color:#8a3838; }
      .bm-btn-sm { padding:3px 8px; font-size:12px; }
      .bm-btn-success { background:#285a28; border-color:#388a38; }
      .bm-body { flex:1; display:flex; min-height:0; overflow:hidden; }
      .bm-main { flex:1; overflow:auto; }
      .bm-panel {
        width:460px; border-left:1px solid #2a2620; background:#12100e;
        overflow-y:auto; padding:16px; flex-shrink:0;
      }
      .bm-table-wrap { padding:0; }
      table.bm-table {
        width:100%; border-collapse:collapse; font-size:12px;
      }
      .bm-table th {
        background:#1a1816; color:#a89f8f; padding:6px 8px; text-align:left;
        border-bottom:1px solid #2a2620; cursor:pointer; user-select:none;
        position:sticky; top:0; z-index:2; white-space:nowrap;
      }
      .bm-table th:hover { color:#f5e6c8; }
      .bm-table th.sorted { color:#f5d78e; }
      .bm-table td {
        padding:5px 8px; border-bottom:1px solid #1e1c18; white-space:nowrap;
        max-width:140px; overflow:hidden; text-overflow:ellipsis;
      }
      .bm-table tr:hover td { background:#1e1c18; }
      .bm-table tr.selected td { background:#2a2418; }
      .bm-table .cell-ok { color:#7cb87c; }
      .bm-table .cell-miss { color:#b87c7c; }
      .bm-table .cell-id { color:#8ab4c4; font-family:monospace; }
      .bm-table .cell-flag { font-size:15px; font-weight:bold; }
      .bm-table .cell-region { font-size:10px; color:#a89f8f; font-family:monospace; }
      .bm-table .cell-bar {
        display:inline-block; height:6px; border-radius:3px;
        background:#3a342c; width:60px; position:relative; vertical-align:middle;
      }
      .bm-table .cell-bar-fill {
        position:absolute; left:0; top:0; height:100%; border-radius:3px;
      }
      .bar-100 { background:#7cb87c; }
      .bar-75 { background:#b8b87c; }
      .bar-50 { background:#b8a07c; }
      .bar-25 { background:#b87c7c; }
      .badge-era {
        display:inline-block; padding:1px 6px; border-radius:3px;
        font-size:11px; font-weight:600; line-height:1.4; letter-spacing:0.5px;
      }
      .badge-era-antiquity { background:#2a2210; color:#e5c158; border:1px solid #6b5320; }
      .badge-era-feudal { background:#142614; color:#78c878; border:1px solid #286028; }
      .badge-era-castle { background:#142036; color:#8ab4f8; border:1px solid #284478; }
      .badge-era-imperial { background:#301414; color:#f08080; border:1px solid #782828; }

      .bm-form label { display:block; margin-bottom:10px; font-size:12px; color:#a89f8f; }
      .bm-form label span { display:block; margin-bottom:3px; }
      .bm-form input, .bm-form select {
        width:100%; background:#1c1916; border:1px solid #3a342c; color:#eee;
        border-radius:4px; padding:6px 8px; font-size:13px;
      }
      .bm-form input[readonly] { opacity:0.6; }
      .bm-form .form-row { display:flex; gap:8px; }
      .bm-form .form-row label { flex:1; }
      .bm-form .form-actions { display:flex; gap:8px; margin-top:16px; }
      .bm-form h3 { color:#f5e6c8; font-size:14px; margin:16px 0 8px; border-bottom:1px solid #2a2620; padding-bottom:4px; }
      .bm-form h3:first-child { margin-top:0; }
      .bm-id-preview {
        font-family:monospace; font-size:11px; color:#8ab4c4;
        background:#1a1816; padding:6px 10px; border-radius:4px;
        margin:8px 0; border:1px solid #2a2620; line-height:1.6;
      }
      .bm-id-preview .id-label { color:#a89f8f; }
      .bm-id-preview .id-value { color:#f5d78e; }
      .bm-id-preview .id-dup { color:#ff9a8a; font-size:10px; }
      .bm-portrait-preview {
        margin:6px 0 10px; padding:8px; background:#1a1816; border:1px solid #2a2620;
        border-radius:4px; display:flex; gap:10px; align-items:flex-start;
      }
      .bm-portrait-preview img {
        width:96px; height:128px; object-fit:cover; object-position:center top;
        background:#0e0d0c; border-radius:3px; border:1px solid #3a342c;
      }
      .bm-portrait-preview .portrait-empty {
        width:96px; height:128px; background:#0e0d0c; border:1px dashed #3a342c;
        border-radius:3px; display:flex; align-items:center; justify-content:center;
        color:#5a5040; font-size:11px;
      }
      .bm-portrait-preview .portrait-info { flex:1; font-size:11px; color:#8a7f6f; }
      .bm-portrait-preview .portrait-info b { color:#c8bda8; }
      .bm-portrait-search-wrap { position:relative; }
      .bm-portrait-suggest {
        position:absolute; left:0; right:0; top:100%; z-index:30;
        max-height:260px; overflow-y:auto; background:#1c1916;
        border:1px solid #5a5040; border-radius:0 0 4px 4px;
        box-shadow:0 6px 16px #000a;
      }
      .bm-portrait-suggest:empty { display:none; }
      .bm-portrait-suggest .suggest-item {
        display:flex; align-items:center; gap:8px; padding:4px 8px;
        font-size:12px; color:#c8bda8; cursor:pointer; white-space:nowrap;
        overflow:hidden; text-overflow:ellipsis;
      }
      .bm-portrait-suggest .suggest-item:hover { background:#2e2a22; color:#f5d78e; }
      .bm-portrait-suggest .suggest-item img {
        width:28px; height:36px; object-fit:cover; object-position:center top;
        background:#0e0d0c; border-radius:2px; flex:none;
      }
      .bm-portrait-suggest .suggest-item .hl { color:#f5d78e; font-weight:bold; }
      .bm-portrait-suggest .suggest-more { padding:4px 8px; font-size:11px; color:#8a7f6f; }
      .bm-checkbox-label { display:flex; align-items:center; gap:8px; cursor:pointer; margin:6px 0; }
      .bm-checkbox-label input[type="checkbox"] { width:15px; height:15px; accent-color:#c8a84b; cursor:pointer; }
      .bm-checkbox-label span { font-size:13px; color:#c8bda8; }

      .bm-validation {
        position:fixed; bottom:0; left:0; right:0; max-height:40vh;
        background:#12100e; border-top:2px solid #5a2828;
        overflow-y:auto; padding:12px 16px; z-index:10;
      }
      .bm-validation-header {
        display:flex; justify-content:space-between; align-items:center;
        margin-bottom:8px; font-weight:bold; color:#f5e6c8;
      }
      .bm-copy-btn { background:none; border:1px solid #555; border-radius:3px; cursor:pointer; padding:1px 4px; font-size:12px; opacity:0.5; }
      .bm-copy-btn:hover { opacity:1; border-color:#c89b3c; }
      .bm-validation .issue { padding:3px 0; font-size:12px; }
      .bm-validation .issue[data-fid]:hover { text-decoration:underline; background:#ffffff10; }
      .bm-validation .issue-error { color:#ff9a8a; }
      .bm-validation .issue-warn { color:#f5d78e; }
      .bm-validation .issue-info { color:#8ab4c4; }

      .bm-toast {
        position:fixed; bottom:20px; right:20px; padding:10px 18px;
        border-radius:6px; font-size:13px; z-index:20;
        background:#1a3020; color:#9fd4a8; border:1px solid #3a6a48;
        transition: opacity 0.3s;
      }
      .bm-toast:empty { display:none; }
      .bm-toast.is-error { background:#301a1a; color:#ffb4a8; border-color:#6a3a3a; }
    `;
    document.head.appendChild(s);
}

// ── 立绘搜索（/api/portrait-catalog 全清单 + 输入即时筛选，大小写不敏感） ──

let portraitCatalogPaths: string[] | null = null;
let portraitCatalogLoading: Promise<string[]> | null = null;

async function loadPortraitCatalog(): Promise<string[]> {
    if (portraitCatalogPaths) return portraitCatalogPaths;
    if (!portraitCatalogLoading) {
        portraitCatalogLoading = fetch('/api/portrait-catalog')
            .then(r => r.json())
            .then((folders: Array<{ folder: string; images: Array<{ path: string }> }>) => {
                portraitCatalogPaths = (folders ?? []).flatMap(f => f.images.map(img => img.path));
                return portraitCatalogPaths;
            })
            .catch(() => {
                portraitCatalogLoading = null; // 失败允许下次重试
                return [];
            });
    }
    return portraitCatalogLoading;
}

/** 给立绘路径输入框挂即时筛选下拉：输入 ≥2 字符按子串匹配（忽略大小写），点选后回填并触发 input 事件刷新预览 */
function attachPortraitSearch(input: HTMLInputElement): void {
    const wrap = input.parentElement;
    if (!wrap) return;
    wrap.classList.add('bm-portrait-search-wrap');
    const dropdown = document.createElement('div');
    dropdown.className = 'bm-portrait-suggest';
    wrap.appendChild(dropdown);

    const MAX_SHOWN = 30;
    let suppressOnce = false; // 点选回填触发的 input 事件不再弹下拉

    const render = (paths: string[], query: string) => {
        if (paths.length === 0) { dropdown.innerHTML = ''; return; }
        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        const q = query.toLowerCase();
        const hl = (p: string) => {
            const i = p.toLowerCase().indexOf(q);
            if (i < 0) return esc(p);
            return `${esc(p.slice(0, i))}<span class="hl">${esc(p.slice(i, i + q.length))}</span>${esc(p.slice(i + q.length))}`;
        };
        dropdown.innerHTML = paths.slice(0, MAX_SHOWN).map(p =>
            `<div class="suggest-item" data-path="${esc(p)}"><img src="${esc(p)}" loading="lazy" alt="" />${hl(p)}</div>`
        ).join('') + (paths.length > MAX_SHOWN ? `<div class="suggest-more">… 共 ${paths.length} 个匹配，继续输入缩小范围</div>` : '');
        dropdown.querySelectorAll('.suggest-item').forEach(el => {
            // mousedown 先于 input 的 blur，保证点选生效
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                input.value = (el as HTMLElement).dataset.path!;
                dropdown.innerHTML = '';
                suppressOnce = true;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });
    };

    input.addEventListener('input', async () => {
        if (suppressOnce) { suppressOnce = false; return; }
        const q = input.value.trim().toLowerCase();
        if (q.length < 2) { dropdown.innerHTML = ''; return; }
        const all = await loadPortraitCatalog();
        if (input.value.trim().toLowerCase() !== q) return; // 已过期的异步结果
        render(all.filter(p => p.toLowerCase().includes(q)), q);
    });
    input.addEventListener('blur', () => { setTimeout(() => { dropdown.innerHTML = ''; }, 150); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') dropdown.innerHTML = ''; });
}

// ── Data Loading ──

async function loadData(): Promise<void> {
    const res = await fetch('/api/entity-data', { cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    entityData = await res.json();
    buildRows();
    applyFilter();
    renderTable();
    updateStats();
}

function buildRows(): void {
    if (!entityData) return;
    const capitalReverse = new Map<string, string>();
    for (const [fId, cId] of Object.entries(entityData.capitals)) {
        capitalReverse.set(fId, cId);
    }
    const cityMap = new Map(entityData.cities.map(c => [c.id, c]));

    rows = entityData.factions.map(f => {
        const cId = capitalReverse.get(f.id);
        const city = cId ? cityMap.get(cId) : undefined;
        const gen = entityData!.generals[f.id];
        const profile = gen ? entityData!.profiles[gen.generalId] : undefined;
        const elite = entityData!.elites[f.id];
        const flag = entityData!.flags[f.id];

        // 🔴 与 legion-editor 保持一致：势力没有专属军团名时，回退显示所属文化区的军团名
        //    （一个文化 = 一个军团，人人都有；否则这里会误报「缺军团」）
        const region = city
            ? getCityRegion({ latitude: city.lat, longitude: city.lng, region: city.region })
            : 'CENTRAL';
        const legionName = FACTION_COMPOSITIONS[f.id]?.legionName || getCultureLegionName(region);

        let completeness = 0;
        if (flag) completeness++;
        if (cId && city) completeness++;
        if (gen) completeness++;
        if (profile?.tacticalSkillId) completeness++;
        else if (gen) { /* 有武将无战术技：不计入技能完整度 */ }
        if (elite) completeness++;
        if (legionName) completeness++;
        completeness = Math.round(completeness / 6 * 100);

        const era = gen
            ? ((entityData!.eras?.[gen.generalId] || GENERAL_ERA[gen.generalId]) as GeneralEra | undefined)
            : undefined;
        const eraLabel = era ? ERA_LABELS[era] : undefined;

        return {
            id: f.id,
            name: f.name,
            flagText: flag,
            cityId: cId,
            cityName: city?.name,
            lat: city?.lat,
            lng: city?.lng,
            cityType: city?.type,
            mirror: city?.mirror,
            generalId: gen?.generalId,
            generalName: gen?.generalName,
            portrait: gen?.portrait,
            tier: profile?.tier,
            era,
            eraLabel,
            tacticalSkillId: profile?.tacticalSkillId,
            advantageSkillId: profile?.advantageSkillId,
            balanceSkillId: profile?.balanceSkillId,
            disadvantageSkillId: profile?.disadvantageSkillId,
            atkAdvantageSkillId: profile?.atkAdvantageSkillId,
            atkBalanceSkillId: profile?.atkBalanceSkillId,
            atkDisadvantageSkillId: profile?.atkDisadvantageSkillId,
            defAdvantageSkillId: profile?.defAdvantageSkillId,
            defBalanceSkillId: profile?.defBalanceSkillId,
            defDisadvantageSkillId: profile?.defDisadvantageSkillId,
            aptitude: profile?.aptitude,
            attackStyle: profile?.attackStyle,
            eliteName: elite?.name,
            eliteTier: elite?.tier,
            eliteRegion: elite?.region,
            cityRegion: city?.region,
            legionName,
            completeness,
        };
    });
}

function rowHasSkillError(r: FactionRow): boolean {
    return !!r.generalId && !r.tacticalSkillId;
}

/** 六槽 id → 存档用 tacticalSkillId（优先攻·优势，与战斗回退一致） */
type SixSlotIds = {
    atkAdvantageSkillId?: string;
    atkBalanceSkillId?: string;
    atkDisadvantageSkillId?: string;
    defAdvantageSkillId?: string;
    defBalanceSkillId?: string;
    defDisadvantageSkillId?: string;
};

function deriveTacticalSkillIdFromSix(slots: SixSlotIds, fallback?: string): string {
    return slots.atkAdvantageSkillId || slots.atkBalanceSkillId || slots.atkDisadvantageSkillId
        || slots.defAdvantageSkillId || slots.defBalanceSkillId || slots.defDisadvantageSkillId
        || fallback || '';
}

function readSixSlotsFromForm(form: HTMLFormElement): SixSlotIds {
    const get = (n: string) => (form.querySelector(`[name="${n}"]`) as HTMLSelectElement | null)?.value ?? '';
    return {
        atkAdvantageSkillId: get('atkAdvantageSkillId'),
        atkBalanceSkillId: get('atkBalanceSkillId'),
        atkDisadvantageSkillId: get('atkDisadvantageSkillId'),
        defAdvantageSkillId: get('defAdvantageSkillId'),
        defBalanceSkillId: get('defBalanceSkillId'),
        defDisadvantageSkillId: get('defDisadvantageSkillId'),
    };
}

function applyFilter(): void {
    const errorFactionIds = new Set(issues.filter(i => i.level === 'error' && i.factionId).map(i => i.factionId));
    filteredRows = rows.filter(r => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const haystack = `${r.id} ${r.name} ${r.flagText ?? ''} ${r.cityName ?? ''} ${r.generalName ?? ''} ${r.eraLabel ?? ''} ${r.eliteName ?? ''}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        switch (filterMode) {
            case 'era-antiquity': return r.era === 'antiquity';
            case 'era-feudal': return r.era === 'feudal';
            case 'era-castle': return r.era === 'castle';
            case 'era-imperial': return r.era === 'imperial';
            case 'no-era': return !!r.generalId && !r.era;
            case 'incomplete': return r.completeness < 100;
            case 'no-general': return !r.generalId;
            case 'no-portrait': return !!r.generalId && !(r.portrait ?? '').trim();
            case 'no-elite': return !r.eliteName;
            case 'no-legion': return !r.legionName;
            case 'no-skill': return rowHasSkillError(r);
            case 'errors': return errorFactionIds.has(r.id) || rowHasSkillError(r);
        }
        return true;
    });
    sortRows();
}

function sortRows(): void {
    filteredRows.sort((a, b) => {
        if (sortCol === 'era') {
            const oa = a.era ? (ERA_ORDER[a.era] ?? 99) : 99;
            const ob = b.era ? (ERA_ORDER[b.era] ?? 99) : 99;
            return sortAsc ? oa - ob : ob - oa;
        }
        let va: any = (a as any)[sortCol] ?? '';
        let vb: any = (b as any)[sortCol] ?? '';
        if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va;
        va = String(va); vb = String(vb);
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
}

function updateStats(): void {
    const total = rows.length;
    const complete = rows.filter(r => r.completeness === 100).length;
    const noGen = rows.filter(r => !r.generalId).length;
    const noPortrait = rows.filter(r => !!r.generalId && !(r.portrait ?? '').trim()).length;
    const noSkill = rows.filter(r => rowHasSkillError(r)).length;
    const noElite = rows.filter(r => !r.eliteName).length;
    const noLegion = rows.filter(r => !r.legionName).length;
    const famous = rows.filter(r => r.tier === 'famous').length;
    const ordinary = rows.filter(r => r.tier === 'ordinary').length;
    const t = [0, 0, 0, 0, 0];
    for (const r of rows) if (r.eliteTier != null && r.eliteTier >= 0 && r.eliteTier <= 4) t[r.eliteTier]++;
    const eraCounts: Record<GeneralEra, number> = { antiquity: 0, feudal: 0, castle: 0, imperial: 0 };
    let noEra = 0;
    for (const r of rows) {
        if (r.generalId) {
            if (r.era && eraCounts[r.era] !== undefined) eraCounts[r.era]++;
            else noEra++;
        }
    }
    els.stats.innerHTML =
        `共 ${total} 势力 | 完整 ${complete} | 缺武将 ${noGen} | 缺武将技 ${noSkill} | 缺立绘 ${noPortrait} | 缺精锐 ${noElite} | 缺军团 ${noLegion} | 显示 ${filteredRows.length}`
        + `<br><span style="color:#c8a868">名将 ${famous} | 普将 ${ordinary}</span>`
        + `<span style="margin-left:12px;color:#8ab4c4">T0:<b>${t[0]}</b> T1:<b>${t[1]}</b> T2:<b>${t[2]}</b> T3:<b>${t[3]}</b> T4:<b>${t[4]}</b></span>`
        + `<span style="margin-left:12px;color:#e5c158">古典:<b>${eraCounts.antiquity}</b></span> <span style="color:#78c878">封建:<b>${eraCounts.feudal}</b></span> <span style="color:#8ab4f8">城堡:<b>${eraCounts.castle}</b></span> <span style="color:#f08080">帝王:<b>${eraCounts.imperial}</b></span>`
        + (noEra > 0 ? ` <span style="color:#b87c7c">缺时代:<b>${noEra}</b></span>` : '');
}

// ── Table Rendering ──

const COLUMNS: Array<{ key: string; label: string; width?: string }> = [
    { key: '_actions', label: '', width: '36px' },
    { key: 'id', label: 'ID', width: '120px' },
    { key: 'name', label: '势力' },
    { key: 'cityRegion', label: '文化区', width: '90px' },
    { key: 'flagText', label: '旗号', width: '50px' },
    { key: 'cityName', label: '据点' },
    { key: 'lat', label: '纬度', width: '60px' },
    { key: 'lng', label: '经度', width: '60px' },
    { key: 'generalName', label: '武将' },
    { key: 'era', label: '时代', width: '85px' },
    { key: 'tacticalSkillId', label: '战术技', width: '70px' },
    { key: 'strategicSkillId', label: '战略技', width: '120px' },
    { key: 'eliteName', label: '精锐' },
    { key: 'eliteTier', label: 'T', width: '30px' },
    { key: 'legionName', label: '军团', width: '130px' },
    { key: 'completeness', label: '完整度', width: '80px' },
];

function renderTable(): void {
    const thead = COLUMNS.map(c => {
        const cls = sortCol === c.key ? ' class="sorted"' : '';
        const arrow = sortCol === c.key ? (sortAsc ? ' ↑' : ' ↓') : '';
        const w = c.width ? ` style="width:${c.width}"` : '';
        return `<th${cls}${w} data-col="${c.key}">${c.label}${arrow}</th>`;
    }).join('');

    const tbody = filteredRows.map(r => {
        const selected = r.id === editingFactionId ? ' class="selected"' : '';
        return `<tr${selected} data-fid="${r.id}">
            <td><button class="bm-copy-btn" data-copy-fid="${r.id}" title="复制为快速录入格式">📋</button></td>
            <td class="cell-id">${r.id}</td>
            <td>${r.name}</td>
            <td class="cell-region">${r.cityRegion ?? ''}</td>
            <td class="cell-flag">${r.flagText ?? '<span class="cell-miss">✗</span>'}</td>
            <td>${r.cityName ?? '<span class="cell-miss">✗</span>'}</td>
            <td>${r.lat != null ? r.lat.toFixed(1) : ''}</td>
            <td>${r.lng != null ? r.lng.toFixed(1) : ''}</td>
            <td>${r.generalName ? `<span class="cell-ok">${r.generalName}</span>` : '<span class="cell-miss">✗</span>'}</td>
            <td class="cell-era">${r.era ? `<span class="badge-era badge-era-${r.era}">${r.eraLabel}</span>` : (r.generalName ? '<span class="cell-miss">✗</span>' : '—')}</td>
            <td>${r.tacticalSkillId ? formatSkill(r.tacticalSkillId) : (r.generalName ? '<span class="cell-miss">✗</span>' : '')}</td>
            <td>${r.strategicSkillId ? formatSkill(r.strategicSkillId) : '—'}</td>
            <td>${r.eliteName ? `<span class="cell-ok">${r.eliteName}</span>` : '<span class="cell-miss">✗</span>'}</td>
            <td>${r.eliteTier != null ? `T${r.eliteTier}` : ''}</td>
            <td>${r.legionName ? `<span class="cell-ok">${r.legionName}</span>` : '<span class="cell-miss">✗</span>'}</td>
            <td>${renderBar(r.completeness)}</td>
        </tr>`;
    }).join('');

    els.tableWrap.innerHTML = `<table class="bm-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;

    els.tableWrap.querySelectorAll('th').forEach(th => {
        th.addEventListener('click', () => {
            const col = (th as HTMLElement).dataset.col!;
            if (col === '_actions') return; // 操作列无数据，不参与排序
            if (sortCol === col) sortAsc = !sortAsc;
            else { sortCol = col; sortAsc = true; }
            sortRows();
            renderTable();
        });
    });
    els.tableWrap.querySelectorAll('tr[data-fid]').forEach(tr => {
        tr.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).closest('.bm-copy-btn')) return;
            editingFactionId = (tr as HTMLElement).dataset.fid!;
            openEditPanel(editingFactionId);
            renderTable();
        });
    });
    els.tableWrap.querySelectorAll('.bm-copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fid = (btn as HTMLElement).dataset.copyFid!;
            const r = rows.find(row => row.id === fid);
            if (!r) return;
            const parts: string[] = [];
            if (r.cityName) parts.push(`据点：${r.cityName}（坐标：${r.lat?.toFixed(2) ?? '?'}, ${r.lng?.toFixed(2) ?? '?'}）`);
            if (r.name) parts.push(`势力：${r.name}`);
            if (r.flagText) parts.push(`旗号：${r.flagText}`);
            if (r.generalName) parts.push(`武将：${r.generalName}`);
            if (r.eliteName) parts.push(`精锐：${r.eliteName}，T${r.eliteTier ?? '?'}`);
            const text = parts.join('，') + '。';
            const copyFallback = (s: string) => {
                const ta = document.createElement('textarea');
                ta.value = s; ta.style.cssText = 'position:fixed;opacity:0';
                document.body.appendChild(ta); ta.select(); document.execCommand('copy');
                document.body.removeChild(ta);
            };
            try {
                navigator.clipboard.writeText(text).then(() => showToast('已复制')).catch(() => { copyFallback(text); showToast('已复制'); });
            } catch { copyFallback(text); showToast('已复制'); }
        });
    });
}

const EFFECT_CN: Record<string, string> = {
    march_speed_mult: '行军加速',
    mountain_march_immunity: '山地不减速',
    ignore_small_city_zoc: '无视小城',
    skip_post_battle_rest: '免休整',
    field_resupply: '野外回血',
    march_attrition_immunity: '行军减兵全免',
    post_battle_troop_pct: '胜后补兵',
    city_growth_mult: '城市增长',
    recruit_cooldown_mult: '离城可募',
    equal_power_mult: '均势×',
};

function formatSkill(id?: string): string {
    if (!id) return '';
    if (!entityData) return id;
    const tac = entityData.tacticalSkills.find(s => s.id === id);
    if (tac) return `<span title="${tac.displayName}">${tac.grid}</span>`;
    const str = entityData.strategicSkills.find(s => s.id === id);
    if (str) {
        const cn = EFFECT_CN[str.effect] ?? str.effect;
        const mag = str.magnitude !== 1 && str.magnitude !== 0 ? (str.magnitude > 1 ? `×${str.magnitude}` : `${(str.magnitude * 100).toFixed(0)}%`) : '';
        const tip = `${str.displayName}｜${cn}${mag ? ' ' + mag : ''}`;
        return `<span title="${tip}">${str.grid}${str.displayName}</span>`;
    }
    return id;
}

function renderBar(pct: number): string {
    const cls = pct === 100 ? 'bar-100' : pct >= 75 ? 'bar-75' : pct >= 50 ? 'bar-50' : 'bar-25';
    return `<span class="cell-bar"><span class="cell-bar-fill ${cls}" style="width:${pct}%"></span></span> ${pct}%`;
}

// ── ID generation helpers ──

function getAllExistingIds(): { factionIds: Set<string>; cityIds: Set<string>; generalIds: Set<string> } {
    if (!entityData) return { factionIds: new Set(), cityIds: new Set(), generalIds: new Set() };
    return {
        factionIds: new Set(entityData.factions.map(f => f.id)),
        cityIds: new Set(entityData.cities.map(c => c.id)),
        generalIds: new Set(Object.values(entityData.generals).map(g => g.generalId)),
    };
}

function computeIds(factionName: string, cityName: string, generalName: string): {
    factionId: string; cityId: string; generalId: string;
    factionDup: boolean; cityDup: boolean; generalDup: boolean;
} {
    const existing = getAllExistingIds();
    const factionBase = toPinyinId(factionName);
    const cityBase = 'city_' + toPinyinId(cityName);
    const factionId = factionBase ? makeUniqueId(factionBase, existing.factionIds) : '';
    const cityId = cityBase !== 'city_' ? makeUniqueId(cityBase, existing.cityIds) : '';
    const generalBase = factionId + '_' + toPinyinId(generalName);
    const generalId = generalName ? makeUniqueId(generalBase, existing.generalIds) : '';
    return {
        factionId, cityId, generalId,
        factionDup: factionBase !== '' && factionBase !== factionId,
        cityDup: cityBase !== 'city_' && cityBase !== cityId,
        generalDup: generalName !== '' && generalBase !== generalId,
    };
}

function checkNameDuplicates(cityName: string, factionName: string, generalName: string, eliteName: string): string[] {
    const warnings: string[] = [];
    const check = (newName: string, label: string, field: keyof FactionRow, existLabel: string, exactOnly = false) => {
        if (!newName || newName.length < 2) return;
        for (const row of rows) {
            const exist = row[field] as string | undefined;
            if (!exist || exist.length < 2) continue;
            if (newName === exist) {
                warnings.push(`${label}"${newName}" 与已有${existLabel}"${exist}"(${row.name}) 完全同名`);
            }
        }
    };
    check(cityName, '据点', 'cityName', '据点');
    check(factionName, '势力', 'name', '势力');
    check(generalName, '武将', 'generalName', '武将', true);
    check(eliteName, '精锐', 'eliteName', '精锐');
    // 跨类型：势力名 vs 已有据点名
    check(factionName, '势力', 'cityName', '据点');
    // 跨类型：据点名 vs 已有势力名
    check(cityName, '据点', 'name', '势力');
    return warnings;
}

/** 🔴 [2026-09-11 主人定] 势力、武将重名报错（阻止提交）。返回错误信息，null=通过。 */
function checkFactionGeneralNameConflict(factionName: string, generalName: string, excludeFactionId?: string): string | null {
    for (const row of rows) {
        if (excludeFactionId && row.id === excludeFactionId) continue; // 编辑自身时排除自己
        if (factionName && factionName.length >= 2 && row.name === factionName) {
            return `势力名重名："${factionName}" 与已有势力"${row.name}"(${row.id}) 完全同名`;
        }
        if (generalName && generalName.length >= 2 && row.generalName === generalName) {
            return `武将名重名："${generalName}" 与已有武将"${row.generalName}"(${row.name}) 完全同名`;
        }
    }
    return null;
}

// ── Edit / Add Panel ──

/** 文化区代码 → 中文名（下拉显示用；option value 仍存代码，与 cities_v2 的 region 字段一致，不影响保存/解析） */
const REGION_LABELS: Record<string, string> = {
    SLAVIC: '斯拉夫', GERMANIC: '日耳曼', LATIN: '拉丁',
    CENTRAL: '中原', NORTH: '北方', JIANGNAN: '江南', LINGNAN: '岭南',
    TIBET: '青藏', STEPPE: '草原', NORTHEAST: '东北', KOREA: '朝鲜',
    JAPAN: '日本', CENTRAL_ASIA: '中亚', WEST_ASIA: '西亚',
    INDIA: '印度', BERBER: '柏柏尔', AMERICA: '美洲', AFRICA: '非洲',
    MALAY: '马来', ANDE: '安第斯', PURU: '南印度', ORIE: '阿拉伯',
    EAST: '东欧', GREEK: '希腊', THRACIAN: '色雷斯', PERSIAN: '波斯', CUMAN: '库曼',
    BRITONS: '英格兰', GOTHS: '哥特', HUNS: '匈人', TEUTONS: '条顿',
    VIKINGS: '维京', ITALIANS: '意大利', SICILIANS: '西西里',
    BULGARIANS: '保加利亚', MAGYAR: '马扎尔', LITHUANIANS: '立陶宛', POLES: '波兰',
    BOHEMIANS: '波希米亚', BURGUNDIANS: '勃艮第', SPANISH: '西班牙', PORTUGUESE: '葡萄牙',
    ETHIOPIANS: '埃塞俄比亚', BENGALIS: '孟加拉', GURJARAS: '瞿折罗', PORUS: '补噜',
    VIETNAMESE: '越南', KHMER: '高棉', MAYANS: '玛雅', MAPUCHE: '马普切',
    MUISCA: '穆伊斯卡', TUPI: '图皮', ARMENIANS: '亚美尼亚', GEORGIANS: '格鲁吉亚',
    ACHAEMENIDS: '阿契美尼德',
    BURMESE: '缅甸', WALLACHIA: '瓦拉几亚',
};

async function openEditPanel(factionId: string | null): Promise<void> {
    // 每次打开前强制刷一次数据, 防止缓存 rows 与磁盘不同步 (SC 补齐等)
    if (factionId) {
        try { await loadData(); } catch { /* ignore, fall back to cached rows */ }
    }
    els.panel.style.display = 'block';
    const row = factionId ? rows.find(r => r.id === factionId) : null;
    const isNew = !row;
    const title = isNew ? '新增实体' : `编辑: ${row!.name}`;

    const currentRegion = row?.cityRegion ?? row?.eliteRegion ?? '';
    const regionOptions = (entityData?.regions ?? []).map(r =>
        `<option value="${r}" ${r === currentRegion ? 'selected' : ''}>${REGION_LABELS[r] ?? r} (${r})</option>`
    ).join('');

    if (isNew) {
        // ── New entity: quick-input mode ──
        const qInput = (id: string, placeholder = '') =>
            `<input id="${id}" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:6px 8px;font-size:13px" placeholder="${placeholder}" />`;
        els.panelContent.innerHTML = `
        <div class="bm-form">
          <h3>快速录入（识别自动填 → 手动修改 → 提交）</h3>
          <label><span>粘贴一行文字，自动识别填入下方字段（不覆盖已手填内容）</span>
            <textarea id="bm-quick-input" rows="3" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:8px;font-size:13px;resize:vertical;font-family:inherit"
              placeholder="据点：梓州，势力：梓州，旗号：梓，武将：王建，精锐：西川牙兵，T2。lat: 31.1141, lng: 105.0623"></textarea>
          </label>
          <h3 style="margin-top:12px">① 势力与据点</h3>
          <div class="form-row">
            <label><span>势力名 *</span>${qInput('bm-quick-fname')}</label>
            <label><span>旗号（留空取势力名首字）</span>${qInput('bm-quick-flag')}</label>
          </div>
          <div class="form-row">
            <label><span>据点名 *</span>${qInput('bm-quick-cname')}</label>
            <label><span>文化区 *</span>
              <select id="bm-quick-region" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:6px 8px;font-size:13px">
                <option value="">请选择</option>
                ${regionOptions}
              </select>
            </label>
          </div>
          <div class="form-row">
            <label><span>纬度 lat *</span>${qInput('bm-quick-lat')}</label>
            <label><span>经度 lng *</span>${qInput('bm-quick-lng')}</label>
          </div>
          <h3 style="margin-top:14px">② 武将（可选 · 立绘/武将技不选则随机，不留空）</h3>
          <div class="form-row">
            <label><span>武将名（留空则不建武将）</span>${qInput('bm-quick-genname', '从文本识别自动填入，可手改')}</label>
            <label><span>品阶</span>
              <select id="bm-quick-tier" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:6px 8px;font-size:13px">
                <option value="ordinary">普将</option>
                <option value="famous">名将</option>
              </select>
            </label>
            <label><span>时代</span>
              <select id="bm-quick-era" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:6px 8px;font-size:13px">
                <option value="antiquity">古典时代 (≤400)</option>
                <option value="feudal" selected>封建时代 (400-1050)</option>
                <option value="castle">城堡时代 (1050-1500)</option>
                <option value="imperial">帝王时代 (1500-1900)</option>
              </select>
            </label>
          </div>
          <label><span>立绘（输入拼音/势力key 即时筛选，如 liguang）</span>
            ${qInput('bm-quick-portrait', '留空 → 从未被占用的立绘中随机')}
          </label>
          <div class="bm-portrait-preview">
            <img id="bm-quick-portrait-img" style="display:none" alt="立绘" />
            <div class="portrait-empty" id="bm-quick-portrait-empty">未选立绘</div>
            <div class="portrait-info"><div><b>立绘预览</b></div><div style="margin-top:4px">从筛选下拉点选后显示；留空提交时随机</div></div>
          </div>
          <div class="form-row" style="margin-top:8px">
            <p style="font-size:12px;color:#9a9080;margin:4px 0">战略技已全随机（2026-08-03 起名将战略技由运行时随机池分配，不写入档案）。</p>
          </div>
          <p style="font-size:12px;color:#9a9080;margin:4px 0">战术六槽提交时按<strong>六计各一</strong>自动配齐（攻守互补；仅 common 档）；不单独选「战术技」。</p>
          <h3 style="margin-top:14px">③ 精锐（可选）</h3>
          <div class="form-row">
            <label><span>番号名（留空则不建精锐）</span>${qInput('bm-quick-elite')}</label>
            <label><span>级别</span>
              <select id="bm-quick-elitetier" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:6px 8px;font-size:13px">
                <option value="0">T0</option><option value="1">T1</option>
                <option value="2" selected>T2</option><option value="3">T3</option><option value="4">T4</option>
              </select>
            </label>
          </div>

          <div id="bm-quick-preview" class="bm-id-preview" style="margin-top:12px">
            <span class="id-label">粘贴文字或手动填写…</span>
          </div>

          <div class="form-actions">
            <button type="button" id="bm-quick-submit" class="bm-btn bm-btn-primary">提交添加</button>
            <button type="button" class="bm-btn" id="bm-panel-close">关闭</button>
          </div>
        </div>
        `;

        const quickInput = document.getElementById('bm-quick-input') as HTMLTextAreaElement;
        quickInput.addEventListener('input', () => { fillQuickFieldsFromText(); updateQuickPreview(); });
        document.getElementById('bm-quick-submit')!.addEventListener('click', handleQuickSubmit);
        document.getElementById('bm-panel-close')!.addEventListener('click', closePanel);

        // 所有字段变更 → 实时刷新预览
        for (const id of ['bm-quick-fname', 'bm-quick-flag', 'bm-quick-cname', 'bm-quick-lat', 'bm-quick-lng',
            'bm-quick-genname', 'bm-quick-elite']) {
            document.getElementById(id)!.addEventListener('input', () => updateQuickPreview());
        }
        for (const id of ['bm-quick-region', 'bm-quick-tier', 'bm-quick-tac', 'bm-quick-elitetier']) {
            document.getElementById(id)!.addEventListener('change', () => updateQuickPreview());
        }

        // 立绘搜索 + 预览联动
        const qPortrait = document.getElementById('bm-quick-portrait') as HTMLInputElement;
        const qPortraitImg = document.getElementById('bm-quick-portrait-img') as HTMLImageElement;
        const qPortraitEmpty = document.getElementById('bm-quick-portrait-empty') as HTMLElement;
        attachPortraitSearch(qPortrait);
        qPortrait.addEventListener('input', () => {
            const p = qPortrait.value.trim();
            if (p) {
                qPortraitImg.src = p;
                qPortraitImg.style.display = '';
                qPortraitEmpty.style.display = 'none';
            } else {
                qPortraitImg.style.display = 'none';
                qPortraitEmpty.textContent = '未选立绘';
                qPortraitEmpty.style.display = '';
            }
            updateQuickPreview();
        });
        qPortraitImg.addEventListener('error', () => {
            qPortraitImg.style.display = 'none';
            qPortraitEmpty.textContent = '加载失败';
            qPortraitEmpty.style.display = '';
        });

        quickInput.focus();
        return;
    } else {
        // ── Edit existing: show IDs as readonly ──
        els.panelContent.innerHTML = `
        <form class="bm-form" id="bm-edit-form">
          <h3>编辑: ${row!.name}</h3>
          <div style="margin-bottom:12px;padding:8px;border:1px dashed #5a5040;border-radius:6px;background:#1a1710">
            <label style="font-size:12px;color:#aa9970;margin-bottom:4px;display:block">粘贴快速格式，自动填入下方表单：</label>
            <div style="display:flex;gap:6px">
              <input id="bm-edit-quick-fill" type="text" style="flex:1;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:5px 8px;font-size:12px"
                placeholder="据点：宕昌（坐标：33.70, 104.52），势力：阴平，旗号：阴平，武将：邓艾，精锐：阴平奇兵，T0" />
              <button type="button" id="bm-edit-quick-apply" class="bm-btn" style="padding:4px 10px;font-size:12px;white-space:nowrap">识别填入</button>
            </div>
          </div>
          <input type="hidden" name="factionId" value="${row!.id}" />
          <div class="form-row">
            <label><span>势力 ID</span><input value="${row!.id}" readonly /></label>
            <label><span>势力名称</span><input name="factionName" value="${row!.name}" required /></label>
          </div>
          <label><span>旗号 (1-2字)</span><input name="flagText" value="${row!.flagText ?? ''}" maxlength="4" required /></label>
          <div class="form-row">
            <label><span>据点 ID</span><input value="${row!.cityId ?? ''}" readonly /></label>
            <label><span>据点名称</span><input name="cityName" value="${row!.cityName ?? ''}" required /></label>
          </div>
          <input type="hidden" name="cityId" value="${row!.cityId ?? ''}" />
          <div class="form-row">
            <label><span>纬度 (lat)</span><input name="lat" type="number" step="any" value="${row!.lat ?? ''}" required /></label>
            <label><span>经度 (lng)</span><input name="lng" type="number" step="any" value="${row!.lng ?? ''}" required /></label>
          </div>
          <label><span>文化区</span>
            <select name="region">
              ${currentRegion ? '' : '<option value="" selected>请选择</option>'}
              ${regionOptions}
            </select>
          </label>
          <label><span>据点类型</span>
            <select name="cityType">
              <option value="small_city" ${(row!.cityType ?? 'small_city') === 'small_city' ? 'selected' : ''}>小城 (small_city)</option>
              <option value="medium_city" ${row!.cityType === 'medium_city' ? 'selected' : ''}>中城 (medium_city)</option>
              <option value="big_city" ${row!.cityType === 'big_city' ? 'selected' : ''}>大城 (big_city)</option>
              <option value="stockade" ${row!.cityType === 'stockade' ? 'selected' : ''}>城寨 (stockade)</option>
              <option value="pass" ${row!.cityType === 'pass' ? 'selected' : ''}>关隘 (pass)</option>
            </select>
          </label>
          <label class="bm-checkbox-label" id="bm-mirror-label">
            <input type="checkbox" name="mirror" ${row!.mirror ? 'checked' : ''} />
            <span>镜像立绘 (mirror)</span>
          </label>

          <h3>② 武将</h3>
          <div class="form-row">
            <label><span>武将 ID</span><input id="bm-edit-genid-view" value="${row!.generalId ?? ''}" readonly /></label>
            <label><span>武将名</span><input name="generalName" id="bm-edit-genname" value="${row!.generalName ?? ''}" /></label>
          </div>
          <input type="hidden" name="generalId" id="bm-edit-genid" value="${row!.generalId ?? ''}" />
          <input type="hidden" name="oldGeneralId" value="${row!.generalId ?? ''}" />
          <input type="hidden" name="oldGeneralName" value="${row!.generalName ?? ''}" />
          <div id="bm-edit-general-hint" style="display:none;font-size:12px;color:#e0a030;margin:2px 0 6px;line-height:1.5"></div>
          <label><span>立绘路径</span><input name="portrait" id="bm-edit-portrait" value="${row!.portrait ?? ''}" /></label>
          <div class="bm-portrait-preview" id="bm-portrait-preview">
            <img id="bm-portrait-img" src="${row!.portrait ?? ''}" alt="立绘" style="${row!.portrait ? '' : 'display:none'}" />
            <div class="portrait-empty" id="bm-portrait-empty" style="${row!.portrait ? 'display:none' : ''}">无立绘</div>
            <div class="portrait-info">
              <div><b>预览</b></div>
              <div style="margin-top:4px">修改上面路径后自动刷新</div>
            </div>
          </div>
          <div class="form-row">
            <label><span>品阶</span>
              <select name="tier">
                ${row!.tier ? '' : '<option value="" selected>请选择</option>'}
                <option value="famous" ${row!.tier === 'famous' ? 'selected' : ''}>名将 (famous)</option>
                <option value="ordinary" ${row!.tier === 'ordinary' ? 'selected' : ''}>普将 (ordinary)</option>
              </select>
            </label>
            <label><span>时代（按辉煌年代/30岁判定）</span>
              <select name="era">
                ${row!.era ? '' : '<option value="" selected>请选择时代</option>'}
                <option value="antiquity" ${row!.era === 'antiquity' ? 'selected' : ''}>古典时代 (≤400)</option>
                <option value="feudal" ${row!.era === 'feudal' ? 'selected' : ''}>封建时代 (400-1050)</option>
                <option value="castle" ${row!.era === 'castle' ? 'selected' : ''}>城堡时代 (1050-1500)</option>
                <option value="imperial" ${row!.era === 'imperial' ? 'selected' : ''}>帝王时代 (1500-1900)</option>
              </select>
            </label>
          </div>
          <h4 style="margin:10px 0 6px;font-size:13px;color:#8ab4c4">攻守风格 · 人物标签（影子字段，不参与战斗结算）</h4>
          <div class="form-row">
            <label><span>攻守风格（独立于三势，不是技能）</span>
              <select name="attackStyle">
                ${row!.attackStyle ? '' : '<option value="" selected>请选择</option>'}
                <option value="attack" ${row!.attackStyle === 'attack' ? 'selected' : ''}>善攻 attack</option>
                <option value="defense" ${row!.attackStyle === 'defense' ? 'selected' : ''}>善防 defense</option>
                <option value="balanced" ${row!.attackStyle === 'balanced' ? 'selected' : ''}>双行 balanced</option>
              </select>
            </label>
            <label><span>三势 aptitude</span>
              <select name="aptitude">
                ${row!.aptitude ? '' : '<option value="" selected>请选择</option>'}
                <option value="create" ${row!.aptitude === 'create' ? 'selected' : ''}>造势 create</option>
                <option value="leverage" ${row!.aptitude === 'leverage' ? 'selected' : ''}>借势 leverage</option>
                <option value="reverse" ${row!.aptitude === 'reverse' ? 'selected' : ''}>逆势 reverse</option>
              </select>
            </label>
          </div>

          <h3>③ 精锐番号</h3>
          <div class="form-row">
            <label><span>番号名</span><input name="eliteName" value="${row!.eliteName ?? ''}" /></label>
            <label><span>级别</span>
              <select name="eliteTier">
                ${row!.eliteTier == null ? '<option value="" selected>请选择</option>' : ''}
                <option value="0" ${row!.eliteTier === 0 ? 'selected' : ''}>T0</option>
                <option value="1" ${row!.eliteTier === 1 ? 'selected' : ''}>T1</option>
                <option value="2" ${row!.eliteTier === 2 ? 'selected' : ''}>T2</option>
                <option value="3" ${row!.eliteTier === 3 ? 'selected' : ''}>T3</option>
                <option value="4" ${row!.eliteTier === 4 ? 'selected' : ''}>T4</option>
              </select>
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="bm-btn bm-btn-primary">保存修改</button>
            <button type="button" class="bm-btn" id="bm-panel-close">关闭</button>
            ${!isNew ? `<button type="button" class="bm-btn bm-btn-warn" id="bm-panel-delete">删除该势力</button>` : ''}
          </div>
        </form>
        `;
    }

    document.getElementById('bm-panel-close')!.addEventListener('click', closePanel);
    document.getElementById('bm-edit-form')!.addEventListener('submit', handleFormSubmit);
    // 换将：改武将名 → 自动重算 generalId；立绘不变（主人要求：改名字不丢立绘）
    if (!isNew && row) {
        const gName = document.getElementById('bm-edit-genname') as HTMLInputElement | null;
        const gIdHidden = document.getElementById('bm-edit-genid') as HTMLInputElement | null;
        const gIdView = document.getElementById('bm-edit-genid-view') as HTMLInputElement | null;
        const gHint = document.getElementById('bm-edit-general-hint');
        const origName = row.generalName ?? '';
        const origId = row.generalId ?? '';
        gName?.addEventListener('input', () => {
            const nm = gName.value.trim();
            const changed = !!nm && nm !== origName;
            const newId = changed ? `${row!.id}_${toPinyinId(nm)}` : origId;
            if (gIdHidden) gIdHidden.value = newId;
            if (gIdView) gIdView.value = newId;
            if (gHint) {
                gHint.style.display = changed ? 'block' : 'none';
                if (changed) gHint.textContent = `换将 → 新 ID：${newId}。请为「${nm}」重设战术技/战略技。旧武将「${origName}」的技能档会被清理。`;
            }
        });
    }
    if (!isNew && row) {
        document.getElementById('bm-panel-delete')?.addEventListener('click', () => void handleDeleteFaction(row!));
    }

    // 镜像立绘只适用险要（城市 DE 模型已自动镜像朝向）：cityType 改成 pass 时才显示镜像复选框
    const cityTypeSel = document.querySelector('select[name="cityType"]') as HTMLSelectElement | null;
    const mirrorLabel = document.getElementById('bm-mirror-label');
    const syncMirrorVisible = () => {
        if (mirrorLabel) mirrorLabel.style.display = cityTypeSel?.value === 'pass' ? '' : 'none';
    };
    cityTypeSel?.addEventListener('change', syncMirrorVisible);
    syncMirrorVisible();

    // 立绘路径改动 → 实时刷新预览图
    const portraitInput = document.getElementById('bm-edit-portrait') as HTMLInputElement | null;
    const portraitImg = document.getElementById('bm-portrait-img') as HTMLImageElement | null;
    const portraitEmpty = document.getElementById('bm-portrait-empty') as HTMLElement | null;
    if (portraitInput && portraitImg && portraitEmpty) {
        const refresh = () => {
            const path = portraitInput.value.trim();
            if (path) {
                portraitImg.src = path;
                portraitImg.style.display = '';
                portraitEmpty.style.display = 'none';
            } else {
                portraitImg.style.display = 'none';
                portraitEmpty.style.display = '';
            }
        };
        portraitInput.addEventListener('input', refresh);
        attachPortraitSearch(portraitInput);
        portraitImg.addEventListener('error', () => {
            portraitImg.style.display = 'none';
            portraitEmpty.textContent = '加载失败';
            portraitEmpty.style.display = '';
        });
        portraitImg.addEventListener('load', () => {
            portraitEmpty.textContent = '无立绘';
        });
    }

    // 快速填入：解析粘贴文本并填入表单
    const quickFillInput = document.getElementById('bm-edit-quick-fill') as HTMLInputElement;
    const quickFillBtn = document.getElementById('bm-edit-quick-apply') as HTMLButtonElement;
    if (quickFillInput && quickFillBtn) {
        const applyQuickFill = () => {
            const parsed = parseQuickInput(quickFillInput.value);
            if (!parsed) { showToast('无法解析，请检查格式', true); return; }
            const form = document.getElementById('bm-edit-form') as HTMLFormElement;
            const set = (name: string, val: string) => {
                const el = form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement | null;
                if (el && val) el.value = val;
            };
            set('factionName', parsed.factionName);
            set('flagText', parsed.flagText);
            set('cityName', parsed.cityName);
            if (!isNaN(parsed.lat)) set('lat', String(parsed.lat));
            if (!isNaN(parsed.lng)) set('lng', String(parsed.lng));
            set('generalName', parsed.generalName);
            set('eliteName', parsed.eliteName);
            set('eliteTier', String(parsed.eliteTier));
            set('tier', parsed.tier);
            if (parsed.region) set('region', parsed.region);
            showToast('✓ 已填入，可手动微调后保存');
        };
        quickFillBtn.addEventListener('click', applyQuickFill);
        quickFillInput.addEventListener('paste', () => setTimeout(applyQuickFill, 50));
    }
}

// ── Quick-input parsing ──

interface ParsedEntity {
    cityName: string;
    factionName: string;
    flagText: string;
    generalName: string;
    eliteName: string;
    eliteTier: number;
    lat: number;
    lng: number;
    tier: 'famous' | 'ordinary';
    region: string;
}

const REGION_ALIAS: Record<string, string> = {
    '斯拉夫': 'SLAVIC',
    '日耳曼': 'GERMANIC',
    '拉丁': 'LATIN',
    '日本': 'JAPAN',
    '朝鲜': 'KOREA', '韩国': 'KOREA',
    '东北': 'NORTHEAST',
    '草原': 'STEPPE', '蒙古': 'STEPPE',
    '西域': 'WESTERN',
    '中亚': 'CENTRAL_ASIA',
    '西亚': 'WEST_ASIA',
    '吐蕃': 'TIBET', '青藏': 'TIBET', '羌藏': 'TIBET',
    '缅甸': 'BURMESE',
    '河西': 'HEXI',
    '北方': 'NORTH',
    '中原': 'CENTRAL',
    '江南': 'JIANGNAN',
};

function parseQuickInput(text: string): ParsedEntity | null {
    const t = text.trim();
    if (!t) return null;

    const extract = (patterns: RegExp[]): string => {
        for (const re of patterns) {
            const m = t.match(re);
            if (m) return m[1].trim();
        }
        return '';
    };

    // 据点：宕昌（坐标：33.70, 104.52） 或 据点：宕昌
    const cityWithCoord = t.match(/据点[：:]\s*([^（(，,。\s]+)[（(]坐标[：:]\s*(-?[\d.]+)[,，]\s*(-?[\d.]+)[)）]/);
    const cityName = cityWithCoord ? cityWithCoord[1].trim() : extract([/据点[：:]\s*([^，,。\s（(]+)/]);
    const factionName = extract([/势力[：:]\s*([^，,。\s]+)/]);
    const flagText = extract([/旗号[：:]\s*([^，,。\s]+)/]);
    const generalName = extract([/武将[：:]\s*([^，,。\s]+)/]);
    const eliteName = extract([/精锐[：:]\s*([^，,。T\d\s]+)/]);

    // T0-T4
    const tierMatch = t.match(/[,，。\s]T(\d)/i);
    const eliteTier = tierMatch ? parseInt(tierMatch[1]) : 2;

    // lat/lng: 优先从括号坐标提取，否则从 lat:/lng: 格式提取
    let lat: number, lng: number;
    if (cityWithCoord) {
        lat = parseFloat(cityWithCoord[2]);
        lng = parseFloat(cityWithCoord[3]);
    } else {
        const latMatch = t.match(/lat[：:\s]*(-?[\d.]+)/i);
        const lngMatch = t.match(/lng[：:\s]*(-?[\d.]+)/i);
        lat = latMatch ? parseFloat(latMatch[1]) : NaN;
        lng = lngMatch ? parseFloat(lngMatch[1]) : NaN;
    }

    // 名将/普将 (default ordinary)
    const isFamous = /名将/.test(t);
    const tier = isFamous ? 'famous' as const : 'ordinary' as const;

    // 文化区：文化：青藏 → TIBET
    const cultureText = extract([/文化[：:]\s*([^，,。\s]+)/]);
    const region = REGION_ALIAS[cultureText] ?? '';

    if (!factionName || !cityName) return null;

    return {
        cityName, factionName,
        flagText: flagText || factionName.slice(0, 1),
        generalName, eliteName, eliteTier,
        lat, lng, tier, region,
    };
}

/** 识别文本 → 预填空字段（只填空的，不覆盖手动修改） */
function fillQuickFieldsFromText(): void {
    const input = document.getElementById('bm-quick-input') as HTMLTextAreaElement | null;
    if (!input) return;
    const parsed = parseQuickInput(input.value);
    if (!parsed) return;
    const fillIfEmpty = (id: string, val: string): boolean => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el && val && !el.value.trim()) { el.value = val; return true; }
        return false;
    };
    fillIfEmpty('bm-quick-fname', parsed.factionName);
    fillIfEmpty('bm-quick-flag', parsed.flagText);
    fillIfEmpty('bm-quick-cname', parsed.cityName);
    if (!isNaN(parsed.lat)) fillIfEmpty('bm-quick-lat', String(parsed.lat));
    if (!isNaN(parsed.lng)) fillIfEmpty('bm-quick-lng', String(parsed.lng));
    const regionSelect = document.getElementById('bm-quick-region') as HTMLSelectElement | null;
    if (regionSelect && parsed.region && !regionSelect.value) regionSelect.value = parsed.region;
    if (fillIfEmpty('bm-quick-genname', parsed.generalName)) {
        const tierSelect = document.getElementById('bm-quick-tier') as HTMLSelectElement | null;
        if (tierSelect) tierSelect.value = parsed.tier;
    }
    if (fillIfEmpty('bm-quick-elite', parsed.eliteName)) {
        const eliteTierSel = document.getElementById('bm-quick-elitetier') as HTMLSelectElement | null;
        if (eliteTierSel) eliteTierSel.value = String(parsed.eliteTier);
    }
}

/** 读取新增面板所有字段（提交与预览共用同一读法） */
function readQuickFields() {
    const val = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? '';
    const factionName = val('bm-quick-fname');
    return {
        factionName,
        flagText: val('bm-quick-flag') || factionName.slice(0, 1),
        cityName: val('bm-quick-cname'),
        lat: parseFloat(val('bm-quick-lat')),
        lng: parseFloat(val('bm-quick-lng')),
        region: val('bm-quick-region'),
        genName: val('bm-quick-genname'),
        genTier: (val('bm-quick-tier') === 'famous' ? 'famous' : 'ordinary') as 'famous' | 'ordinary',
        portrait: val('bm-quick-portrait'),
        eliteName: val('bm-quick-elite'),
        eliteTier: parseInt(val('bm-quick-elitetier') || '2', 10),
    };
}

// ── 随机分配（不选就随机，不留空） ──

function pickRandom<T>(arr: readonly T[]): T | null {
    if (arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)] ?? null;
}

/** 随机战术技只从 common 档挑：limited/gamble/专属等限量档禁止随机乱发（见 TACTICAL_ASSIGN_TIER） */
function pickRandomTacticalSkill(): { id: string; displayName: string } | null {
    return pickRandom((entityData?.tacticalSkills ?? []).filter(s => s.assignTier === 'common'));
}

/**
 * 按六计各一 + 攻守互补随机配齐攻防六槽（与 AGENTS 六槽铁律 / 校验 11.12 一致）。
 * 三对槽：优势=攻战+胜战、均势=敌战+混战、劣势=并战+败战；攻守各取其一、不得重复。
 */
function pickComplementarySixSlots(): Partial<Record<
    'atkAdvantageSkillId' | 'atkBalanceSkillId' | 'atkDisadvantageSkillId'
    | 'defAdvantageSkillId' | 'defBalanceSkillId' | 'defDisadvantageSkillId',
    string
>> | { error: string } {
    type SixSlotKey = 'atkAdvantageSkillId' | 'atkBalanceSkillId' | 'atkDisadvantageSkillId'
        | 'defAdvantageSkillId' | 'defBalanceSkillId' | 'defDisadvantageSkillId';
    const common = (entityData?.tacticalSkills ?? []).filter(s => s.assignTier === 'common' && s.sixClass);
    const usedIds = new Set<string>();
    const pickFromClass = (cls: string): { id: string; displayName: string } | null => {
        const pool = common.filter(s => s.sixClass === cls && !usedIds.has(s.id));
        return pickRandom(pool);
    };
    const pairs: Array<[SixSlotKey, SixSlotKey, [string, string]]> = [
        ['atkAdvantageSkillId', 'defAdvantageSkillId', ['攻战计', '胜战计']],
        ['atkBalanceSkillId', 'defBalanceSkillId', ['敌战计', '混战计']],
        ['atkDisadvantageSkillId', 'defDisadvantageSkillId', ['并战计', '败战计']],
    ];
    const out: Partial<Record<SixSlotKey, string>> = {};
    for (const [atkKey, defKey, [a, b]] of pairs) {
        const atkClass = Math.random() < 0.5 ? a : b;
        const defClass = atkClass === a ? b : a;
        const atkSkill = pickFromClass(atkClass);
        if (!atkSkill) return { error: `common∩${atkClass} 池为空（或已用尽）` };
        usedIds.add(atkSkill.id);
        const defSkill = pickFromClass(defClass);
        if (!defSkill) return { error: `common∩${defClass} 池为空（或已用尽）` };
        usedIds.add(defSkill.id);
        out[atkKey] = atkSkill.id;
        out[defKey] = defSkill.id;
    }
    return out;
}

function pickRandomStrategicSkill(): { id: string; displayName: string } | null {
    return pickRandom(entityData?.strategicSkills ?? []);
}

/** 随机立绘：优先挑未被任何武将占用的，避免两人共用一张脸；全占用才复用 */
async function pickRandomUnusedPortrait(): Promise<string | null> {
    const all = await loadPortraitCatalog();
    if (all.length === 0) return null;
    const used = new Set(rows.map(r => (r.portrait ?? '').trim()).filter(Boolean));
    const unused = all.filter(p => !used.has(p));
    return pickRandom(unused.length > 0 ? unused : all);
}

function updateQuickPreview(): void {
    const preview = document.getElementById('bm-quick-preview');
    if (!preview || !document.getElementById('bm-quick-fname')) return;
    const f = readQuickFields();
    if (!f.factionName && !f.cityName) {
        preview.innerHTML = '<span class="id-label">粘贴文字或手动填写…</span>';
        return;
    }

    const ids = computeIds(f.factionName, f.cityName, f.genName);
    const lines: string[] = [
        `<span class="id-label">势力:</span> ${f.factionName || '<span class="id-dup">必填</span>'} → <span class="id-value">${ids.factionId}</span>${ids.factionDup ? ' <span class="id-dup">(+后缀)</span>' : ''}`,
        `<span class="id-label">旗号:</span> ${f.flagText || '<span class="id-dup">取势力名首字</span>'}`,
        `<span class="id-label">据点:</span> ${f.cityName || '<span class="id-dup">必填</span>'} → <span class="id-value">${ids.cityId}</span>${ids.cityDup ? ' <span class="id-dup">(+后缀)</span>' : ''}`,
        `<span class="id-label">坐标:</span> ${isNaN(f.lat) || isNaN(f.lng) ? '<span class="id-dup">必填</span>' : `${f.lat}, ${f.lng}`}`,
        `<span class="id-label">文化区:</span> ${f.region || '<span class="id-dup">请选择</span>'}`,
    ];
    const existingFaction = rows.find(r => r.id === ids.factionId);
    if (existingFaction) {
        lines.push(`<span class="id-dup">⚠ 势力已存在，将跳过据点导入，仅补充武将/精锐</span>`);
    }
    if (f.genName) {
        lines.push(`<span class="id-label">武将:</span> ${f.genName} → <span class="id-value">${ids.generalId}</span>${ids.generalDup ? ' <span class="id-dup">(+后缀)</span>' : ''} (${f.genTier === 'famous' ? '名将' : '普将'})`);
        lines.push(f.portrait
            ? `<span class="id-label">立绘:</span> <span class="id-value">${f.portrait}</span> (已选择)`
            : `<span class="id-label">立绘:</span> 未选 → <span class="id-value">提交时从未占用立绘中随机</span>`);
        lines.push(`<span class="id-label">战术:</span> <span class="id-value">提交时按六计各一配齐攻防六槽（攻守互补）</span>`);
        lines.push(`<span class="id-label">战略技:</span> <span class="id-value">全随机（2026-08-03 起名将战略技由运行时随机池分配，不写入档案）</span>`);
    }
    if (f.eliteName) {
        lines.push(`<span class="id-label">精锐:</span> ${f.eliteName} T${f.eliteTier}`);
    }
    const dupWarnings = checkNameDuplicates(f.cityName, f.factionName, f.genName, f.eliteName);
    for (const w of dupWarnings) {
        lines.push(`<span class="id-dup">⚠ ${w}（仅提醒，不阻止提交）</span>`);
    }
    preview.innerHTML = lines.join('<br>');
}

async function handleQuickSubmit(): Promise<void> {
    const f = readQuickFields();

    // 硬校验：必填项与数据完整性（重名不在此列——只提醒不阻止）
    if (!f.factionName || !f.cityName) {
        showToast('势力名与据点名必填（可粘贴文字自动识别）', true);
        return;
    }
    if (isNaN(f.lat) || isNaN(f.lng)) {
        showToast('坐标必填，如 lat: 31.11, lng: 105.06', true);
        return;
    }
    if (!f.region) {
        showToast('请选择文化区', true);
        return;
    }

    const ids = computeIds(f.factionName, f.cityName, f.genName);
    if (!ids.factionId || !ids.cityId) {
        showToast('无法生成 ID，请检查名称', true);
        return;
    }

    // 🔴 [2026-09-11 主人定] 势力、武将重名要报错（阻止提交）
    const nameConflict = checkFactionGeneralNameConflict(f.factionName, f.genName);
    if (nameConflict) {
        showToast(`❌ ${nameConflict}，禁止提交`, true);
        return;
    }

    // 据点/精锐重名：只提醒，不阻止（预览区已实时列出全部重名）
    const dupWarnings = checkNameDuplicates(f.cityName, f.factionName, f.genName, f.eliteName);
    if (dupWarnings.length > 0) {
        showToast(`⚠ 重名提醒（继续提交）: ${dupWarnings[0]}${dupWarnings.length > 1 ? ` 等 ${dupWarnings.length} 条` : ''}`, true);
    }

    // 武将：立绘/武将技不选则随机，不留空
    let portrait = normalizePortraitPath(f.portrait);
    if (portrait && !portrait.toLowerCase().endsWith('.png')) {
        showToast(`立绘路径必须是 .png: ${portrait}`, true);
        return;
    }
    // 2026-08-03 主人定：名将战略技全随机（运行时随机池），不再写入档案 strategicSkillId
    const strategicSkillId = '';
    const randomNotes: string[] = [];
    type SixSlotKey = 'atkAdvantageSkillId' | 'atkBalanceSkillId' | 'atkDisadvantageSkillId'
        | 'defAdvantageSkillId' | 'defBalanceSkillId' | 'defDisadvantageSkillId';
    const sixSlots: Partial<Record<SixSlotKey, string>> = {};
    let aptitude = '';
    let tacticalSkillId = '';
    if (f.genName) {
        // 六计各一 + 攻守互补（勿六槽各自从两类池独立抽，否则会重复同一计）
        const picked = pickComplementarySixSlots();
        if ('error' in picked) {
            showToast(`随机六槽失败：${picked.error}`, true);
            return;
        }
        Object.assign(sixSlots, picked);
        tacticalSkillId = deriveTacticalSkillIdFromSix(sixSlots as SixSlotIds);
        randomNotes.push('攻防六槽已按六计各一配齐');
        aptitude = pickRandom(['create', 'leverage', 'reverse'] as const) ?? 'leverage';
        randomNotes.push(`三势=${aptitude}`);
        if (!portrait) {
            const p = await pickRandomUnusedPortrait();
            if (!p) { showToast('随机立绘失败：立绘清单为空，请手动选择', true); return; }
            portrait = p;
            randomNotes.push(`立绘=${p.split('/').pop()}`);
        }
    }

    const existingFaction = rows.find(r => r.id === ids.factionId);

    try {
        // Step 0: 50km proximity check（游戏规则约束，保持拦截）
        const proxRes = await fetch('/api/check-proximity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: f.lat, lng: f.lng,
                excludeCityId: existingFaction?.cityId || '',
            }),
        });
        const proxData = await proxRes.json();
        if (!proxData.ok && proxData.issues?.length > 0) {
            const nearest = proxData.issues[0];
            showToast(`距 "${nearest.name}" 仅 ${nearest.km.toFixed(1)}km (< 50km)，不允许添加`, true);
            return;
        }

        // Step 1: batch-import (skip if faction already exists)
        if (existingFaction) {
            showToast(`势力 "${f.factionName}" 已存在，跳过据点导入，补充武将/精锐…`);
        } else {
            const importRes = await fetch('/api/batch-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entries: [{
                        factionId: ids.factionId,
                        factionName: f.factionName,
                        flagText: f.flagText,
                        cityId: ids.cityId,
                        cityName: f.cityName,
                        lat: f.lat, lng: f.lng,
                        region: f.region,
                    }]
                }),
            });
            const importData = await importRes.json();
            if (!importData.ok) {
                const errMsg = importData.results?.find((r: any) => !r.ok)?.error ?? '导入失败';
                showToast(`导入失败: ${errMsg}`, true);
                return;
            }
        }

        // Step 2: save general (if provided)
        if (f.genName) {
            const genRes = await fetch('/api/save-general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId: ids.factionId,
                    generalId: ids.generalId,
                    generalName: f.genName,
                    portrait,
                    tier: f.genTier,
                    era: (document.getElementById('bm-quick-era') as HTMLSelectElement)?.value || undefined,
                    tacticalSkillId,
                    strategicSkillId: strategicSkillId || undefined,
                    atkAdvantageSkillId: sixSlots.atkAdvantageSkillId,
                    atkBalanceSkillId: sixSlots.atkBalanceSkillId,
                    atkDisadvantageSkillId: sixSlots.atkDisadvantageSkillId,
                    defAdvantageSkillId: sixSlots.defAdvantageSkillId,
                    defBalanceSkillId: sixSlots.defBalanceSkillId,
                    defDisadvantageSkillId: sixSlots.defDisadvantageSkillId,
                    aptitude: aptitude || undefined,
                }),
            });
            const genData = await genRes.json();
            if (!genData.ok) {
                showToast(`武将保存失败: ${genData.error}`, true);
                return;
            }
            const portraitWarning = genData.results?.find((r: string) => r.includes('⚠'));
            if (portraitWarning) {
                showToast(portraitWarning, true);
            }
        }

        // Step 3: save elite (if provided)
        if (f.eliteName) {
            const eliteRes = await fetch('/api/save-elite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId: ids.factionId,
                    eliteName: f.eliteName,
                    eliteTier: f.eliteTier,
                    region: f.region,
                }),
            });
            const eliteData = await eliteRes.json();
            if (!eliteData.ok) {
                showToast(`精锐保存失败: ${eliteData.error}`, true);
                return;
            }
        }

        showToast(`✓ ${f.factionName} 添加成功 → ${ids.factionId}${randomNotes.length ? `（随机分配：${randomNotes.join('，')}）` : ''}`);
        await loadData();
        editingFactionId = ids.factionId;
        openEditPanel(ids.factionId);
    } catch (err: any) {
        showToast(`错误: ${err.message}`, true);
    }
}

function closePanel(): void {
    els.panel.style.display = 'none';
    editingFactionId = null;
    renderTable();
}

/** 删除整套势力数据：势力+据点+旗号+武将+技能+精锐+道路（走事务式 /api/batch-delete，全成才落盘） */
async function handleDeleteFaction(row: FactionRow): Promise<void> {
    const fid = row.id;
    const cid = row.cityId;
    const parts = [`势力「${row.name}」(${fid})`];
    if (row.cityName || cid) parts.push(`据点「${row.cityName ?? cid}」`);
    if (row.generalName) parts.push(`武将「${row.generalName}」`);
    if (row.eliteName) parts.push(`精锐「${row.eliteName}」`);
    parts.push('旗号、技能档案、关联道路等全部数据');
    if (!confirm(`确认删除以下全部数据？此操作不可撤销：\n\n${parts.join('\n')}`)) return;

    const targets: Array<{ factionId?: string; cityId?: string }> = [{ factionId: fid }];
    if (cid) targets.push({ cityId: cid });
    try {
        const res = await fetch('/api/batch-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targets }),
        });
        const data = await res.json();
        if (!data.ok) {
            showToast(`删除失败: ${JSON.stringify(data.results ?? data.error)}`, true);
            return;
        }
        const files = (data.results ?? []).filter((r: any) => r.ok).map((r: any) => r.file).join(', ');
        showToast(`✅ 已删除「${row.name}」（${files || '无残留'}）`);
        closePanel();
        await loadData();
    } catch (err: any) {
        showToast(`删除失败: ${err.message}`, true);
    }
}

async function handleFormSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const get = (k: string) => (fd.get(k) as string ?? '').trim();

    const factionName = get('factionName');
    const flagText = get('flagText');
    const cityName = get('cityName');
    const lat = parseFloat(get('lat'));
    const lng = parseFloat(get('lng'));

    const region = get('region');

    if (!factionName || !flagText || !cityName || isNaN(lat) || isNaN(lng)) {
        showToast('请填写完整的势力和据点信息', true);
        return;
    }

    // Determine IDs: for new entities, auto-generate; for edits, use hidden fields
    let factionId = get('factionId');
    let cityId = get('cityId');
    let generalId = get('generalId');
    const oldGeneralId = get('oldGeneralId');
    const isNew = !factionId;

    if (isNew) {
        const ids = computeIds(factionName, cityName, get('generalName'));
        factionId = ids.factionId;
        cityId = ids.cityId;
        generalId = ids.generalId;
        if (!factionId || !cityId) {
            showToast('无法生成 ID，请检查名称是否包含汉字', true);
            return;
        }
    } else {
        // 换将：仅当武将名真的改了才按新名重算 generalId（{factionId}_拼音）。
        // 名字没变必须保持原 ID——历史手工 ID（leloi/agui/pugu_puguhuaien 等 9 条）不符合
        // 新规则，无条件重算会把普通保存（改坐标/换技能）当成换将，删旧档 + 断远征目标表。
        const gn = get('generalName');
        const oldGn = get('oldGeneralName');
        if (gn && gn !== oldGn) {
            generalId = `${factionId}_${toPinyinId(gn)}`;
        } else if (gn && oldGeneralId) {
            generalId = oldGeneralId; // 名字没变：无视隐藏字段可能被中途改写过的值，锁回原 ID
        }
    }

    // 武将/立绘字段先行校验：填了武将名但缺品阶时不落盘，避免半保存状态。
    const generalName = get('generalName');
    const portrait = normalizePortraitPath(get('portrait'));
    if (portrait && !portrait.toLowerCase().endsWith('.png')) {
        showToast('立绘路径必须以 .png 结尾！不支持 .jpg 等格式', true);
        return;
    }
    const tier = get('tier');
    const strategicSkillId = ''; // 2026-08-03 起名将战略技全随机，不写入档案
    const sixSlots = readSixSlotsFromForm(form);
    const existingRow = rows.find(r => r.id === factionId);
    const tacticalSkillId = deriveTacticalSkillIdFromSix(sixSlots, existingRow?.tacticalSkillId);
    if (generalName && !tier) {
        showToast(`武将「${generalName}」缺少品阶，请选择后再保存`, true);
        return;
    }
    // 🔴 [2026-09-11 主人定] 势力、武将重名要报错（阻止提交）；编辑自身时排除自己
    const nameConflict = checkFactionGeneralNameConflict(factionName, generalName, isNew ? undefined : factionId);
    if (nameConflict) {
        showToast(`❌ ${nameConflict}，禁止提交`, true);
        return;
    }
    const attackStyle = get('attackStyle');

    try {
        // Step 1: batch-import (faction + city + flag + startingCapital + region)
        const importRes = await fetch('/api/batch-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                entries: [{
                    factionId, factionName, flagText,
                    cityId, cityName, lat, lng,
                    region: region || undefined,
                    cityType: get('cityType') || 'small_city',
                    mirror: (form.querySelector('input[name="mirror"]') as HTMLInputElement | null)?.checked || undefined,
                }]
            }),
        });
        const importData = await importRes.json();
        if (!importData.ok) {
            const errMsg = importData.results?.find((r: any) => !r.ok)?.error ?? '导入失败';
            showToast(`导入失败: ${errMsg}`, true);
            return;
        }

        // Step 2: save general (if provided)
        if (generalName && tier) {
            if (!generalId) {
                const ids = computeIds(factionName, cityName, generalName);
                generalId = ids.generalId;
            }
            const genRes = await fetch('/api/save-general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId, generalId, generalName,
                    portrait,
                    tier,
                    era: get('era') || undefined,
                    tacticalSkillId,
                    strategicSkillId,
                    atkAdvantageSkillId: get('atkAdvantageSkillId') || undefined,
                    atkBalanceSkillId: get('atkBalanceSkillId') || undefined,
                    atkDisadvantageSkillId: get('atkDisadvantageSkillId') || undefined,
                    defAdvantageSkillId: get('defAdvantageSkillId') || undefined,
                    defBalanceSkillId: get('defBalanceSkillId') || undefined,
                    defDisadvantageSkillId: get('defDisadvantageSkillId') || undefined,
                    aptitude: get('aptitude') || undefined,
                    attackStyle,
                    oldGeneralId: oldGeneralId || undefined,
                }),
            });
            const genData = await genRes.json();
            if (!genData.ok) {
                showToast(`武将保存失败: ${genData.error}`, true);
                return;
            }
        }

        // Step 3: save elite (if provided, uses same region)
        const eliteName = get('eliteName');
        const eliteTier = get('eliteTier');

        if (eliteName) {
            if (!region) {
                showToast(`精锐保存失败: 请先选择文化区`, true);
                return;
            }
            if (eliteTier === '') {
                showToast(`精锐保存失败: 请选择精锐级别`, true);
                return;
            }
            const eliteRes = await fetch('/api/save-elite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId, eliteName,
                    eliteTier: parseInt(eliteTier),
                    region,
                }),
            });
            const eliteData = await eliteRes.json();
            if (!eliteData.ok) {
                showToast(`精锐保存失败: ${eliteData.error}`, true);
                return;
            }
        }

        showToast(`✓ ${factionName} 保存成功 (${factionId})`);
        await loadData();
        editingFactionId = factionId;
        openEditPanel(factionId);
    } catch (err: any) {
        showToast(`错误: ${err.message}`, true);
    }
}

// ── Validation ──

async function runValidation(): Promise<void> {
    try {
        const res = await fetch('/api/validate-entities');
        const data = await res.json();
        issues = data.issues ?? [];
        
        const errorsOrWarns = issues.filter(i => i.level === 'error' || i.level === 'warn');
        if (errorsOrWarns.length > 0) {
            els.validationTitle.textContent = '校验结果';
            renderValidation();
            els.validation.style.display = 'block';
            showToast(`校验发现 ${errorsOrWarns.length} 处问题`, true);
        } else {
            els.validation.style.display = 'none';
            showToast('✓ 校验通过，未发现任何错误');
        }
        applyFilter();
        renderTable();
        updateStats();
    } catch (err: any) {
        showToast(`校验失败: ${err.message}`, true);
    }
}

async function runSkillCoverageCheck(): Promise<void> {
    try {
        const res = await fetch('/api/check-skill-coverage');
        const report = await res.json() as SkillCoverageReport;
        if (!res.ok || report.error) {
            throw new Error(report.error ?? `HTTP ${res.status}`);
        }

        issues = [
            ...report.unusedTactical.map(s => ({
                level: 'error',
                msg: `战术技 "${s.displayName}"(${s.id}) 未被任何武将的攻防六槽使用`,
            })),
            ...report.unusedStrategic.map(s => ({
                level: 'error',
                msg: `战略技 "${s.displayName}"(${s.id}) 无任何武将佩戴`,
            })),
            {
                level: 'info',
                msg: `技能覆盖：战术 ${report.tactical.used}/${report.tactical.total}，战略 ${report.strategic.used}/${report.strategic.total}`,
            },
            {
                level: 'info',
                msg: '排除：远征技 str_11、关隘/文化中心系统技、不在册战术技（随机池）、已封存战略技（str_05/17/18/25/26/27）',
            },
        ];

        els.validationTitle.textContent = '武将技能覆盖检查';
        renderValidation();
        els.validation.style.display = 'block';
        applyFilter();
        renderTable();
        updateStats();

        const missing = report.unusedTactical.length + report.unusedStrategic.length;
        showToast(
            missing === 0
                ? `✓ 所有武将技能均有人使用（战术 ${report.tactical.total}，战略 ${report.strategic.total}）`
                : `技能覆盖失败：${missing} 个技能无人使用`,
            missing > 0,
        );
    } catch (err: any) {
        showToast(`技能覆盖检查失败: ${err.message}`, true);
    }
}

/** 名称审计（2026-08-03 主人定，2026-09-11 主人修订）：精锐 ≤5 字、武将/势力/据点 ≤9 字，均全局不重名。
 *  武将名分层标准：①本名/本名+序数（阿方索六世、腓特烈二世）——本身就是大众熟知叫法，用之；
 *  ②通用历史符号型称呼（成吉思汗、熙德、黑太子、巴巴罗萨）——大众比本名更熟且称呼已成通用名，用之；
 *  ③纯描述性绰号/封号（勇敢者、沉默者、救主、左贤王）——不像名字看不出是谁，必须用本名。 */
function runNameAudit(): void {
    if (!entityData) { showToast('数据未加载，请先刷新', true); return; }
    const ed = entityData; // 收窄引用（闭包内 entityData 不被 null 检查收窄）
    const problems: ValidationIssue[] = [];
    const over5 = (s: string) => s.length > 5;  // 精锐番号 ≤5 字
    const over9 = (s: string) => s.length > 9;  // 武将/势力/据点 ≤9 字
    const facNameOf = (fid: string) => ed.factions.find(f => f.id === fid)?.name ?? fid;

    // 武将名
    const genByName = new Map<string, string>();
    for (const [fid, g] of Object.entries(ed.generals)) {
        const n = g.generalName;
        if (!n) continue;
        if (over9(n)) problems.push({ level: 'error', msg: `武将名超9字: "${n}"(${n.length}字) @ ${fid}（${facNameOf(fid)}）` });
        if (genByName.has(n)) problems.push({ level: 'error', msg: `武将名重复: "${n}" @ ${fid}（${facNameOf(fid)}） 与 ${genByName.get(n)}` });
        else genByName.set(n, fid);
    }

    // 精锐番号
    const eliteByName = new Map<string, string>();
    for (const [fid, e] of Object.entries(ed.elites)) {
        const n = e.name;
        if (!n) continue;
        if (over5(n)) problems.push({ level: 'error', msg: `精锐番号超5字: "${n}"(${n.length}字) @ ${fid}（${facNameOf(fid)}）` });
        if (eliteByName.has(n)) problems.push({ level: 'error', msg: `精锐番号重复: "${n}" @ ${fid}（${facNameOf(fid)}） 与 ${eliteByName.get(n)}` });
        else eliteByName.set(n, fid);
    }

    // 势力名
    const facByName = new Map<string, string>();
    for (const f of ed.factions) {
        if (over9(f.name)) problems.push({ level: 'error', msg: `势力名超9字: "${f.name}"(${f.name.length}字) @ ${f.id}` });
        if (facByName.has(f.name)) problems.push({ level: 'error', msg: `势力名重复: "${f.name}" @ ${f.id} 与 ${facByName.get(f.name)}` });
        else facByName.set(f.name, f.id);
    }

    // 据点名
    const cityByName = new Map<string, string>();
    for (const c of ed.cities) {
        if (over9(c.name)) problems.push({ level: 'error', msg: `据点名超9字: "${c.name}"(${c.name.length}字) @ ${c.id}` });
        if (cityByName.has(c.name)) problems.push({ level: 'error', msg: `据点名重复: "${c.name}" @ ${c.id} 与 ${cityByName.get(c.name)}` });
        else cityByName.set(c.name, c.id);
    }

    const errs = problems.filter(p => p.level === 'error').length;
    problems.push({
        level: errs === 0 ? 'info' : 'warn',
        msg: `名称审计：武将 ${Object.keys(ed.generals).length} · 精锐 ${Object.keys(ed.elites).length} · 势力 ${ed.factions.length} · 据点 ${ed.cities.length}；精锐 ≤5 字、武将/势力/据点 ≤9 字、全局不重名${errs === 0 ? '，全部合规 ✓' : `，${errs} 处违规`}`,
    });

    issues = problems;
    els.validationTitle.textContent = '名称审计（精锐≤5 · 武将/势力/据点≤9 · 不重名）';
    renderValidation();
    els.validation.style.display = 'block';
    applyFilter();
    renderTable();
    updateStats();
    showToast(
        errs === 0 ? '✓ 全部名称合规（精锐≤5字、武将/势力/据点≤9字、无重名）' : `名称违规：${errs} 处（超字数/重名）`,
        errs > 0,
    );
}

function renderValidation(): void {
    const errors = issues.filter(i => i.level === 'error');
    const warns = issues.filter(i => i.level === 'warn');
    const infos = issues.filter(i => i.level === 'info');

    const isOrphanFaction = (i: typeof issues[0]) => i.msg.includes('不在 factions.ts');
    const isMissingSC = (i: typeof issues[0]) => i.msg.includes('缺 StartingCapitals');
    const findCityByFactionId = (fid: string) => entityData?.cities.find(c => c.factionId === fid);

    const issueHtml = (i: typeof issues[0], icon: string) => {
        const fid = i.factionId ?? i.msg.match(/\((\w+)\)/)?.[1] ?? null;
        if (fid && isOrphanFaction(i)) {
            return `<div class="issue issue-${i.level}">${icon} ${i.msg} `
                + `<button class="bm-btn bm-btn-warn" data-orphan-fid="${fid}" style="margin-left:6px;padding:2px 8px;font-size:11px">🔧 一键清扫</button>`
                + `</div>`;
        }
        if (fid && isMissingSC(i)) {
            const city = findCityByFactionId(fid);
            if (city) {
                return `<div class="issue issue-${i.level}">${icon} ${i.msg} `
                    + `<button class="bm-btn bm-btn-primary" data-repair-fid="${fid}" data-repair-cid="${city.id}" style="margin-left:6px;padding:2px 8px;font-size:11px">🔧 用现有据点 "${city.name}" 补 SC</button>`
                    + `</div>`;
            }
        }
        if (fid) {
            return `<div class="issue issue-${i.level}" data-fid="${fid}" style="cursor:pointer">${icon} ${i.msg} → 点击编辑</div>`;
        }
        return `<div class="issue issue-${i.level}">${icon} ${i.msg}</div>`;
    };

    els.validationList.innerHTML = [
        `<div style="margin-bottom:6px;color:#a89f8f">错误 ${errors.length} | 警告 ${warns.length} | 信息 ${infos.length}</div>`,
        ...errors.map(i => issueHtml(i, '✗')),
        ...warns.map(i => issueHtml(i, '⚠')),
        ...infos.slice(0, 50).map(i => issueHtml(i, 'ℹ')),
        infos.length > 50 ? `<div class="issue issue-info">… 还有 ${infos.length - 50} 条信息</div>` : '',
    ].join('');

    els.validationList.querySelectorAll('[data-fid]').forEach(el => {
        el.addEventListener('click', () => {
            const fid = (el as HTMLElement).dataset.fid!;
            editingFactionId = fid;
            openEditPanel(fid);
        });
    });

    els.validationList.querySelectorAll('[data-repair-fid]').forEach(el => {
        el.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            const fid = (el as HTMLElement).dataset.repairFid!;
            const cid = (el as HTMLElement).dataset.repairCid!;
            try {
                const res = await fetch('/api/repair-missing-sc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ factionId: fid, cityId: cid }),
                });
                const data = await res.json();
                if (!data.ok) {
                    showToast(`修复失败: ${data.error ?? '未知错误'}`, true);
                    return;
                }
                showToast(`✅ 已补 SC: ${fid} → ${cid}`);
                await loadData();
                runValidation();
            } catch (err: any) {
                showToast(`修复失败: ${err.message}`, true);
            }
        });
    });

    els.validationList.querySelectorAll('[data-orphan-fid]').forEach(el => {
        el.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            const fid = (el as HTMLElement).dataset.orphanFid!;
            const cityId = entityData?.capitals?.[fid];
            const city = cityId ? entityData?.cities.find(c => c.id === cityId) : undefined;
            const targets: Array<{ factionId?: string; cityId?: string }> = [{ factionId: fid }];
            if (cityId) targets.push({ cityId });
            const cityHint = city ? `\n以及关联据点 "${city.name}" (${cityId})` : cityId ? `\n以及关联据点 "${cityId}"（cities_v2 中未找到，仅清 SC 引用）` : '';
            const filesTip = `StartingCapitals / CityAssetManager / SandboxDisplayNames / FactionGenerals / general-skills/profiles / 14 区精锐${cityId ? ' / cities_v2 / VectorRoadData' : ''}`;
            if (!confirm(`确认清扫孤儿势力 "${fid}"${cityHint}？\n将从 ${filesTip} 中删除所有残留。`)) return;
            try {
                const res = await fetch('/api/batch-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targets }),
                });
                const data = await res.json();
                if (!data.ok) {
                    showToast(`清扫失败: ${JSON.stringify(data.results ?? data.error)}`, true);
                    return;
                }
                const files = (data.results ?? []).filter((r: any) => r.ok).map((r: any) => r.file).join(', ');
                showToast(`✅ 已清扫 ${fid}${cityId ? ` + ${cityId}` : ''}（${files || '无残留'}）`);
                await loadData();
                runValidation();
            } catch (err: any) {
                showToast(`清扫失败: ${err.message}`, true);
            }
        });
    });
}

// ── Toast ──

function showToast(msg: string, isError = false): void {
    els.toast.textContent = msg;
    els.toast.className = isError ? 'bm-toast is-error' : 'bm-toast';
    setTimeout(() => { if (els.toast.textContent === msg) els.toast.textContent = ''; }, 4000);
}

// ── Export 名册 (Markdown) ──

/** 把战术/战略技 id 解析成「格 显示名」纯文本，如「③ 侵掠如火」 */
function skillLabelPlain(id?: string): string {
    if (!id || !entityData) return id ?? '';
    const tac = entityData.tacticalSkills.find(s => s.id === id);
    if (tac) return `${tac.grid} ${tac.displayName}`;
    const str = entityData.strategicSkills.find(s => s.id === id);
    if (str) return `${str.grid} ${str.displayName}`;
    return id;
}

/** Markdown 表格单元格转义：竖线、换行 */
function mdCell(v: string | number | null | undefined): string {
    if (v == null || v === '') return '—';
    return String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function exportCatalog(): void {
    if (!filteredRows.length) { showToast('暂无数据可导出', true); return; }

    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const stampFull = `${stamp} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

    const exportRows = filteredRows.slice();
    const totalAll = rows.length;
    const complete = exportRows.filter(r => r.completeness === 100).length;
    const noGen = exportRows.filter(r => !r.generalId).length;
    const noElite = exportRows.filter(r => !r.eliteName).length;
    const sortLabel = COLUMNS.find(c => c.key === sortCol)?.label ?? sortCol;
    const sortInfo = `${sortLabel} ${sortAsc ? '升序' : '降序'}`;
    const filteredNote = exportRows.length < totalAll
        ? `｜ 已筛选 ${exportRows.length} / ${totalAll}`
        : '';

    const tierCn = (t?: string) => t === 'famous' ? '名将' : t === 'ordinary' ? '普将' : '';
    const header = '| 势力 | 据点 | 坐标(lat, lng) | 旗号 | 武将 | 品阶 | 时代 | 战术技 | 战略技 | 精锐 | 级别 | 完整度 |';
    const divider = '|---|---|---|---|---|---|---|---|---|---|---|---|';

    const lines: string[] = [
        '# MAPWAR 实体名册',
        '',
        `> 导出时间：${stampFull}　`,
        `> 共 ${exportRows.length} 势力 ｜ 完整 ${complete} ｜ 缺武将 ${noGen} ｜ 缺精锐 ${noElite}${filteredNote}`,
        `> 排序：${sortInfo}（与当前表格一致）`,
        '',
        header,
        divider,
    ];

    for (const r of exportRows) {
        const coord = (r.lat != null && r.lng != null) ? `${r.lat.toFixed(2)}, ${r.lng.toFixed(2)}` : '';
        lines.push('| ' + [
            mdCell(r.name),
            mdCell(r.cityName),
            mdCell(coord),
            mdCell(r.flagText),
            mdCell(r.generalName),
            mdCell(tierCn(r.tier)),
            mdCell(r.eraLabel),
            mdCell(skillLabelPlain(r.tacticalSkillId)),
            mdCell(skillLabelPlain(r.strategicSkillId)),
            mdCell(r.eliteName),
            mdCell(r.eliteTier != null ? `T${r.eliteTier}` : ''),
            mdCell(`${r.completeness}%`),
        ].join(' | ') + ' |');
    }
    lines.push('');

    const md = lines.join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MAPWAR名册_${stamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`✓ 已导出 ${exportRows.length} 势力 → MAPWAR名册_${stamp}.md`);
}

// ═══════════════════════════════════════════════════════════════════
// 🏙️ 据点编辑视图（2026-09-11 主人需求）
//   全部据点列出 → 点一行 → 右侧编辑据点属性
//   属性：据点名 / ID / 等级 / 文化区 / **建筑风格(下拉)** / 势力 / 兵力 / 纬度 / 经度 / 层级 / 镜像立绘 / 备注
//   保存走 /api/save-city：**只改传入字段**，note / buildingStyle / tier 等其余字段一个不丢；
//   改坐标会先过 50km 邻近检查（§2.1.1 铁律），不通过则整条不写盘。
// ═══════════════════════════════════════════════════════════════════

/** 建筑风格：**与游戏侧一一对应**（cities_v2.BuildingStyle 16 套 + TerritorySystem 显式支持的 YURT 毡帐）。 */
const BUILDING_STYLES: Array<[string, string]> = [
    ['ASIA', '东亚'], ['WEST', '西欧'], ['EAST', '东南欧'], ['SLAV', '东北欧'],
    ['MEDI', '地中海'], ['ORIE', '中东'], ['CEAS', '中亚'], ['INDI', '印度'],
    ['PURU', '普鲁'], ['SEAS', '东南亚'], ['MESO', '中美'], ['ANDE', '安第斯'],
    ['AFRI', '非洲'], ['PERSIAN', '波斯'], ['GREEK', '希腊'], ['THRACIAN', '色雷斯'],
    ['YURT', '草原毡帐营地（TerritorySystem 显式支持，城堡=MONG_CASTLE_AGE3）'],
];

const CITY_TYPES: Array<[string, string]> = [
    ['big_city', '大城 big_city'], ['medium_city', '中城 medium_city'], ['small_city', '小城 small_city'],
    ['pass', '险要 pass'], ['stockade', '城寨 stockade'],
];

// 视图与筛选记忆：保存会改写 cities_v2.ts → Vite 整页热重载，记忆后回到原位（2026-09-11）
let viewMode: 'entities' | 'cities' = localStorage.getItem('bm-view') === 'cities' ? 'cities' : 'entities';
let citySearch = localStorage.getItem('bm-city-search') ?? '';
let cityTypeFilter = localStorage.getItem('bm-city-type') ?? 'all';
let cityStyleFilter = localStorage.getItem('bm-city-style') ?? 'all';
let selectedCityId: string | null = localStorage.getItem('bm-city-selected') || null;

function cityList(): EntityData['cities'] {
    return entityData?.cities ?? [];
}

function setView(mode: 'entities' | 'cities'): void {
    viewMode = mode;
    localStorage.setItem('bm-view', mode);
    const isCities = mode === 'cities';
    els.toolbarEntities.style.display = isCities ? 'none' : '';
    els.bodyEntities.style.display = isCities ? 'none' : '';
    els.toolbarCities.style.display = isCities ? '' : 'none';
    els.bodyCities.style.display = isCities ? '' : 'none';
    els.viewEntities.className = 'bm-btn' + (isCities ? '' : ' bm-btn-primary');
    els.viewCities.className = 'bm-btn' + (isCities ? ' bm-btn-primary' : '');
    if (isCities) {
        els.cityStyle.innerHTML = '<option value="all">全部建筑风格 (16母体全量)</option>'
            + BASE16_STYLES.map(s => `<option value="${s.key}">${s.emoji} ${s.name} (${s.key})</option>`).join('')
            + '<option value="__none__">（未设建筑风格）</option>';
        els.citySearch.value = citySearch;
        els.cityType.value = cityTypeFilter;
        els.cityStyle.value = cityStyleFilter;
        renderCityTable();
        // 热重载后自动回到上次编辑的那座据点
        if (selectedCityId && cityList().some(c => c.id === selectedCityId)) openCityPanel(selectedCityId);
    }
}

function filterCities(): Array<EntityData['cities'][number] & { hierarchy: CityBase16Resolution }> {
    const q = citySearch.toLowerCase();
    const all = cityList().map(c => ({
        ...c,
        hierarchy: resolveCityHierarchy(c),
    }));
    return all.filter(c => {
        if (cityTypeFilter !== 'all' && c.type !== cityTypeFilter) return false;
        if (cityStyleFilter === '__none__') {
            if (c.buildingStyle) return false;
        } else if (cityStyleFilter !== 'all') {
            // 🔴 核心：按 16 母体筛选！选 ASIA 涵盖所有东亚细分分支
            if (c.hierarchy.base16 !== cityStyleFilter) return false;
        }
        if (!q) return true;
        return `${c.name} ${c.id} ${c.factionId} ${c.region ?? ''} ${c.buildingStyle ?? ''} ${c.hierarchy.base16} ${c.hierarchy.base16Name} ${c.hierarchy.branchKey ?? ''} ${c.hierarchy.branchName ?? ''} ${c.note ?? ''}`
            .toLowerCase().includes(q);
    });
}

function renderCityTable(): void {
    const list = filterCities();
    const typeCn = new Map(CITY_TYPES);
    const tbody = list.map(c => {
        const sel = c.id === selectedCityId ? ' class="selected"' : '';
        const note = (c.note ?? '').slice(0, 24);
        const h = c.hierarchy;
        const branchHtml = h.branchName
            ? `<span style="color:#f5e6c8;font-weight:600">${h.branchName}</span> <span class="cell-region" style="font-size:10px;color:#8fa3bb">(${h.branchKey})</span>`
            : '<span style="color:#64748b">—</span>';
        return `<tr${sel} data-cid="${c.id}">
            <td><b>${c.name}</b></td>
            <td class="cell-id">${c.id}</td>
            <td>${typeCn.get(c.type) ?? c.type}</td>
            <td class="cell-region" style="font-weight:700;color:#f5d78e">${h.base16Emoji} ${h.base16Name} (${h.base16})</td>
            <td>${branchHtml}</td>
            <td class="cell-region">${c.region ?? '<span class="cell-miss">✗</span>'}</td>
            <td>${c.factionId}</td>
            <td>${c.troops ?? ''}</td>
            <td class="cell-region">${c.lat?.toFixed(2)}, ${c.lng?.toFixed(2)}</td>
            <td class="cell-region" title="${(c.note ?? '').replace(/"/g, '&quot;')}">${note}</td>
        </tr>`;
    }).join('');

    els.cityTableWrap.innerHTML = `<table class="bm-table"><thead><tr>
        <th>据点</th><th>ID</th><th>等级</th><th>16母体风格</th><th>细分文明/定制 (59+3)</th><th>文化区</th>
        <th>势力</th><th>兵力</th><th>坐标</th><th>备注</th>
    </tr></thead><tbody>${tbody}</tbody></table>`;

    els.cityTableWrap.querySelectorAll('tr[data-cid]').forEach(tr => {
        tr.addEventListener('click', () => {
            selectedCityId = (tr as HTMLElement).dataset.cid!;
            localStorage.setItem('bm-city-selected', selectedCityId);
            openCityPanel(selectedCityId);
            renderCityTable();
        });
    });

    const baseCounts: Record<string, number> = {};
    for (const c of cityList()) {
        const h = resolveCityHierarchy(c);
        baseCounts[h.base16] = (baseCounts[h.base16] || 0) + 1;
    }
    const summary16 = BASE16_STYLES.map(s => `${s.name}: ${baseCounts[s.key] || 0}`).join(' · ');
    els.cityStats.innerHTML = `<span style="color:#f5d78e">共 ${cityList().length} 座据点（当前显示 ${list.length} 座）</span><span style="margin-left:12px;color:#a89f8f;font-size:11px">16母体覆盖：${summary16}</span>`;
}

function openCityPanel(cityId: string): void {
    const c = cityList().find(x => x.id === cityId);
    if (!c) return;
    const factions = entityData?.factions ?? [];
    const h = resolveCityHierarchy(c);
    const curWall = h.base16;
    const curBranch = h.branchKey ?? '';
    const isCustom = LAYER3_CUSTOM_GROUPS.some(g => g.branches.some(b => b.key === curBranch));

    // 游戏实际会采用的建筑风格（战略地图与战术战场同源）
    const gameStyle = resolveCityDeBuildingStyle(c.id, c.type, c.region, c.lat, c.lng, c.buildingStyle);
    const steppeForced = !!(c.region && (c.region.includes('STEPPE') || c.region.includes('MONGOL')));
    const gameStyleLine = gameStyle
        ? `<div id="bm-city-game-style" style="margin:6px 0 10px;padding:6px 8px;border:1px dashed #5a5040;border-radius:6px;background:#1a1710;font-size:12px">
             🎮 游戏实际采用建筑风格：<b style="color:#f5d78e">${gameStyle}</b>
             ${steppeForced ? '<span style="color:#c8a05a">（文化区属草原/蒙古：游戏强制毡帐 YURT，此处另选别的不会生效）</span>' : ''}
             <div style="color:#8a8272;margin-top:2px">战略地图与 ZOOM13 战术战场共用这一套解析</div>
           </div>`
        : `<div id="bm-city-game-style" style="margin:6px 0 10px;padding:6px 8px;border:1px dashed #5a5040;border-radius:6px;background:#1a1710;font-size:12px">
             🎮 游戏实际采用建筑风格：<b style="color:#b87c7c">（无 → 该据点走兜底渲染）</b>
           </div>`;

    els.cityPanel.style.display = '';
    els.cityPanelContent.innerHTML = `
      <form class="bm-form" id="bm-city-form">
        <h3>🏙️ 编辑据点：${c.name}</h3>
        <div class="form-row">
          <label><span>据点 ID（只读）</span><input value="${c.id}" readonly /></label>
          <label><span>据点名称</span><input name="name" value="${c.name}" required /></label>
        </div>
        <label><span>据点等级 (type)</span>
          <select name="type">
            ${CITY_TYPES.map(([k, cn]) => `<option value="${k}" ${c.type === k ? 'selected' : ''}>${cn}</option>`).join('')}
          </select>
        </label>
        ${gameStyleLine}

        <!-- 🔴 [2026-09-18 主人定] 与 _citytest.html 100% 对齐的建筑风格三级体系 -->
        <div style="background:#16130f;padding:10px 12px;border:1px solid #3a342c;border-radius:6px;margin-bottom:12px">
          <div style="font-weight:700;color:#f6e05e;margin-bottom:8px">🏛️ 建筑风格三级体系（与 _citytest.html 同步）</div>

          <label><span>① 城墙 / 母体 (16套母体建筑风格)</span>
            <select name="wallStyle" id="bm-ce-wall">
              ${BASE16_STYLES.map(s => `<option value="${s.key}" ${curWall === s.key ? 'selected' : ''}>${s.emoji} ${s.name} (${s.key})</option>`).join('')}
            </select>
          </label>

          <label><span>② 城堡 / 文明分支 (59套专属城堡·险要)</span>
            <select name="castleBranch" id="bm-ce-castle">
              <option value="">── 不选二层分支 ──</option>
              ${CULTURE_59_GROUPS.map(g => `
                <optgroup label="${g.group}">
                  ${g.branches.map(b => `<option value="${b.key}" ${!isCustom && curBranch === b.key ? 'selected' : ''}>${b.label}</option>`).join('')}
                </optgroup>
              `).join('')}
            </select>
          </label>

          <label><span>③ 自建 / 专属定制 (3套独立视觉与宗堡)</span>
            <select name="customStyle" id="bm-ce-custom">
              <option value="">── 不选三层专属 ──</option>
              ${LAYER3_CUSTOM_GROUPS.map(g => `
                <optgroup label="${g.group}">
                  ${g.branches.map(b => `<option value="${b.key}" ${isCustom && curBranch === b.key ? 'selected' : ''}>${b.label}</option>`).join('')}
                </optgroup>
              `).join('')}
            </select>
          </label>
        </div>

        <label><span>文化区 (region · 只读)</span>
          <input value="${c.region ?? '（未设）'}" readonly title="文化区由二/三层风格或大区定义自动联动维护" />
        </label>
        <label><span>势力 (factionId)</span>
          <select name="factionId">
            ${factions.map(f => `<option value="${f.id}" ${c.factionId === f.id ? 'selected' : ''}>${f.name}（${f.id}）</option>`).join('')}
          </select>
        </label>
        <div class="form-row">
          <label><span>兵力 (troops)</span><input name="troops" type="number" value="${c.troops ?? ''}" /></label>
          <label><span>层级 (tier)</span><input name="tier" type="number" value="${c.tier ?? ''}" placeholder="0/1/2/4" /></label>
        </div>
        <div class="form-row">
          <label><span>纬度 (lat)</span><input name="lat" type="number" step="any" value="${c.lat ?? ''}" /></label>
          <label><span>经度 (lng)</span><input name="lng" type="number" step="any" value="${c.lng ?? ''}" /></label>
        </div>
        <label class="bm-checkbox-label">
          <input type="checkbox" name="mirror" ${c.mirror ? 'checked' : ''} />
          <span>镜像立绘 (mirror)</span>
        </label>
        <label><span>备注 (note)</span>
          <textarea name="note" rows="4" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:6px 8px;font-size:12px">${c.note ?? ''}</textarea>
        </label>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button type="submit" class="bm-btn bm-btn-primary">保存到 cities_v2</button>
          <button type="button" id="bm-city-reset" class="bm-btn">重置</button>
          <button type="button" id="bm-city-close" class="bm-btn">关闭</button>
        </div>
        <p style="font-size:11px;color:#8a8272;margin-top:8px;line-height:1.6">
          保存与 _citytest.html 规范一致：一级母体写入 buildingStyle，二层59/三层3写入 region。<br />
          改坐标会先做 50km 邻近检查（项目铁律），不过关则整条不写盘。
        </p>
      </form>`;

    const form = document.getElementById('bm-city-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => { e.preventDefault(); void saveCityEdits(c.id, form); });

    const elWall = document.getElementById('bm-ce-wall') as HTMLSelectElement | null;
    const elCastle = document.getElementById('bm-ce-castle') as HTMLSelectElement | null;
    const elCustom = document.getElementById('bm-ce-custom') as HTMLSelectElement | null;

    const refreshGameStyleHint = (): void => {
        const el = document.getElementById('bm-city-game-style');
        if (!el) return;
        const wallVal = elWall?.value || c.buildingStyle || '';
        const castleVal = elCastle?.value || '';
        const customVal = elCustom?.value || '';
        const regionVal = customVal || castleVal || c.region || '';
        const typeVal = String(form.elements.namedItem('type') ? (form.elements.namedItem('type') as any).value : c.type);
        const s = resolveCityDeBuildingStyle(
            c.id,
            typeVal,
            regionVal,
            Number(c.lat),
            Number(c.lng),
            wallVal,
        );
        const forced = regionVal.includes('STEPPE') || regionVal.includes('MOBEI_MONGOL');
        el.innerHTML = `🎮 游戏实际采用建筑风格：<b style="color:${s ? '#f5d78e' : '#b87c7c'}">${s ?? '（无 → 兜底渲染）'}</b>`
            + (forced ? '<span style="color:#c8a05a">（文化区属草原/蒙古：游戏强制毡帐 YURT，此处另选别的不会生效）</span>' : '')
            + '<div style="color:#8a8272;margin-top:2px">战略地图与 ZOOM13 战术战场共用这一套解析</div>';
    };

    if (elWall && elCastle && elCustom) {
        elWall.addEventListener('change', () => {
            const w = elWall.value;
            if (elCastle.value) {
                const b = ALL_BRANCHES_MAP[elCastle.value];
                if (b && b.deStyle !== w) elCastle.value = '';
            }
            if (elCustom.value) {
                const b = ALL_BRANCHES_MAP[elCustom.value];
                if (b && b.deStyle !== w) elCustom.value = '';
            }
            refreshGameStyleHint();
        });

        elCastle.addEventListener('change', () => {
            const k = elCastle.value;
            if (k) {
                elCustom.value = '';
                const b = ALL_BRANCHES_MAP[k];
                if (b) elWall.value = b.deStyle;
            }
            refreshGameStyleHint();
        });

        elCustom.addEventListener('change', () => {
            const k = elCustom.value;
            if (k) {
                elCastle.value = '';
                const b = ALL_BRANCHES_MAP[k];
                if (b) elWall.value = b.deStyle;
            }
            refreshGameStyleHint();
        });
    }

    for (const sel of ['type', 'lat', 'lng']) {
        (form.elements.namedItem(sel) as HTMLElement | null)?.addEventListener('change', refreshGameStyleHint);
    }
    document.getElementById('bm-city-reset')!.addEventListener('click', () => openCityPanel(c.id));
    document.getElementById('bm-city-close')!.addEventListener('click', () => {
        els.cityPanel.style.display = 'none';
        selectedCityId = null;
        localStorage.removeItem('bm-city-selected');
        renderCityTable();
    });
}

async function saveCityEdits(cityId: string, form: HTMLFormElement): Promise<void> {
    const fd = new FormData(form);
    const wall = String(fd.get('wallStyle') ?? '').trim();
    const castle = String(fd.get('castleBranch') ?? '').trim();
    const custom = String(fd.get('customStyle') ?? '').trim();

    // 🔴 [2026-09-18 主人定死] 与 _citytest.html 100% 对齐：
    // 一级 16 母体写入 buildingStyle；二层 59 文明或三层 3 专属定制写入 region！
    const fields: Record<string, string | number | boolean | null> = {
        name: String(fd.get('name') ?? '').trim(),
        type: String(fd.get('type') ?? ''),
        factionId: String(fd.get('factionId') ?? ''),
        buildingStyle: wall,
        troops: String(fd.get('troops') ?? '').trim(),
        tier: String(fd.get('tier') ?? '').trim(),
        lat: String(fd.get('lat') ?? '').trim(),
        lng: String(fd.get('lng') ?? '').trim(),
        mirror: fd.get('mirror') === 'on',
        note: String(fd.get('note') ?? ''),
    };
    if (custom) {
        fields.region = custom;
    } else if (castle) {
        fields.region = castle;
    }

    try {
        localStorage.setItem('bm-city-saving', cityId);
        const res = await fetch('/api/save-city', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cityId, fields }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        const changed: string[] = json.changed ?? [];
        if (changed.length === 0) {
            localStorage.removeItem('bm-city-saving');
            showToast('没有字段变化，未写盘');
        } else {
            localStorage.setItem('bm-city-saved-msg', `✓ 已保存 ${cityId}：${changed.join(', ')}`);
        }
        await loadData();
        renderCityTable();
        openCityPanel(cityId);
    } catch (err: any) {
        localStorage.removeItem('bm-city-saving');
        showToast(`保存失败: ${err.message}`, true);
    }
}

// ── Events ──

function bindEvents(): void {
    els.search.addEventListener('input', () => {
        searchQuery = els.search.value.trim();
        localStorage.setItem('bm-search', searchQuery);
        applyFilter();
        renderTable();
        updateStats();
    });
    els.filter.addEventListener('change', () => {
        filterMode = els.filter.value as typeof filterMode;
        localStorage.setItem('bm-filter', filterMode);
        applyFilter();
        renderTable();
        updateStats();
    });
    document.getElementById('bm-reload')!.addEventListener('click', () => {
        loadData().then(() => showToast('✓ 数据已刷新')).catch(e => showToast(String(e), true));
    });
    document.getElementById('bm-export')!.addEventListener('click', () => {
        exportCatalog();
    });
    document.getElementById('bm-skill-coverage')!.addEventListener('click', () => {
        runSkillCoverageCheck();
    });
    document.getElementById('bm-name-audit')!.addEventListener('click', () => {
        runNameAudit();
    });
    document.getElementById('bm-validate')!.addEventListener('click', () => {
        runValidation();
    });
    document.getElementById('bm-add-new')!.addEventListener('click', () => {
        editingFactionId = null;
        openEditPanel(null);
    });
    document.getElementById('bm-close-validation')!.addEventListener('click', () => {
        els.validation.style.display = 'none';
    });

    // ── 据点编辑视图（2026-09-11 主人需求）──
    els.viewEntities.addEventListener('click', () => setView('entities'));
    els.viewCities.addEventListener('click', () => setView('cities'));
    els.citySearch.addEventListener('input', () => {
        citySearch = els.citySearch.value.trim();
        localStorage.setItem('bm-city-search', citySearch);
        renderCityTable();
    });
    els.cityType.addEventListener('change', () => {
        cityTypeFilter = els.cityType.value;
        localStorage.setItem('bm-city-type', cityTypeFilter);
        renderCityTable();
    });
    els.cityStyle.addEventListener('change', () => {
        cityStyleFilter = els.cityStyle.value;
        localStorage.setItem('bm-city-style', cityStyleFilter);
        renderCityTable();
    });
}

// ── Boot ──

async function boot(): Promise<void> {
    bindEvents();
    searchQuery = localStorage.getItem('bm-search') ?? '';
    filterMode = (localStorage.getItem('bm-filter') ?? 'all') as typeof filterMode;
    els.search.value = searchQuery;
    els.filter.value = filterMode;
    await loadData();
    await runValidation();
    // 上次停在「据点编辑」视图 → 热重载后回到那里
    if (viewMode === 'cities') setView('cities');
    // 上一次保存若被热重载冲掉了提示，这里补弹一次
    const savedMsg = localStorage.getItem('bm-city-saved-msg');
    if (savedMsg) { localStorage.removeItem('bm-city-saved-msg'); localStorage.removeItem('bm-city-saving'); showToast(savedMsg); }
    const errN = issues.filter(i => i.level === 'error').length;
    const noSkillN = rows.filter(r => rowHasSkillError(r)).length;
    if (errN > 0 || noSkillN > 0) {
        showToast(`校验：错误 ${errN} 条${noSkillN > 0 ? `，缺武将技 ${noSkillN} 势力` : ''}`, true);
    }
}

boot().catch(err => {
    console.error(err);
    app.innerHTML = `<div style="padding:40px;color:#ff9a8a">启动失败: ${err}</div>`;
});
