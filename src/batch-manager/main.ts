/**
 * MAPWAR 实体批量管理工具
 * 访问：http://localhost:5173/batch-manager.html
 *
 * 功能：查看/新增/校验 据点、势力、旗号、武将、武将技、精锐
 */

import { pinyin } from 'pinyin-pro';

interface FactionRow {
    id: string;
    name: string;
    flagText?: string;
    cityId?: string;
    cityName?: string;
    lat?: number;
    lng?: number;
    cityType?: string;
    generalId?: string;
    generalName?: string;
    portrait?: string;
    tier?: string;
    tacticalSkillId?: string;
    strategicSkillId?: string;
    eliteName?: string;
    eliteTier?: number;
    eliteRegion?: string;
    cityRegion?: string;
    completeness: number;
}

interface EntityData {
    factions: Array<{ id: string; name: string }>;
    cities: Array<{ id: string; name: string; factionId: string; lat: number; lng: number; type: string; troops: number; region?: string; tier?: number }>;
    flags: Record<string, string>;
    capitals: Record<string, string>;
    generals: Record<string, { generalId: string; generalName: string; portrait: string }>;
    profiles: Record<string, { tier: string; tacticalSkillId: string; strategicSkillId?: string }>;
    elites: Record<string, { name: string; tier: number; region: string }>;
    tacticalSkills: Array<{ id: string; grid: string; displayName: string }>;
    strategicSkills: Array<{ id: string; grid: string; displayName: string }>;
    regions: string[];
}

interface ValidationIssue {
    level: string;
    msg: string;
    factionId?: string;
}

// ── Pinyin helpers ──

function toPinyinId(chinese: string): string {
    return pinyin(chinese, { toneType: 'none', type: 'array' })
        .map(s => s.replace(/\s+/g, ''))
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
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
let filterMode: 'all' | 'incomplete' | 'no-general' | 'no-elite' | 'errors' = 'all';
let sortCol = 'id';
let sortAsc = true;
let editingFactionId: string | null = null;

const app = document.getElementById('app')!;
app.innerHTML = `
<header class="bm-header">
  <div class="bm-title">MAPWAR 实体批量管理</div>
  <div class="bm-header-actions">
    <a href="/" class="bm-link">← 返回游戏</a>
    <a href="/portrait-tuner.html" class="bm-link">立绘调校</a>
    <button type="button" id="bm-reload" class="bm-btn">刷新数据</button>
    <button type="button" id="bm-validate" class="bm-btn bm-btn-warn">运行校验</button>
  </div>
</header>
<div class="bm-toolbar">
  <input id="bm-search" class="bm-input" type="search" placeholder="搜索 ID / 名称 / 旗号…" />
  <select id="bm-filter" class="bm-select">
    <option value="all">全部</option>
    <option value="incomplete">不完整</option>
    <option value="no-general">缺武将</option>
    <option value="no-elite">缺精锐</option>
    <option value="errors">有错误</option>
  </select>
  <span id="bm-stats" class="bm-stats"></span>
  <button type="button" id="bm-add-new" class="bm-btn bm-btn-primary">+ 新增实体</button>
</div>
<div class="bm-body">
  <main class="bm-main">
    <div id="bm-table-wrap" class="bm-table-wrap"></div>
  </main>
  <aside id="bm-panel" class="bm-panel" style="display:none">
    <div id="bm-panel-content"></div>
  </aside>
</div>
<div id="bm-validation" class="bm-validation" style="display:none">
  <div class="bm-validation-header">
    <span>校验结果</span>
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
    validationList: document.getElementById('bm-validation-list')!,
    toast: document.getElementById('bm-toast')!,
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

// ── Data Loading ──

async function loadData(): Promise<void> {
    const res = await fetch('/api/entity-data');
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

        let completeness = 0;
        if (flag) completeness++;
        if (cId && city) completeness++;
        if (gen) completeness++;
        if (profile) completeness++;
        if (elite) completeness++;
        completeness = Math.round(completeness / 5 * 100);

        return {
            id: f.id,
            name: f.name,
            flagText: flag,
            cityId: cId,
            cityName: city?.name,
            lat: city?.lat,
            lng: city?.lng,
            cityType: city?.type,
            generalId: gen?.generalId,
            generalName: gen?.generalName,
            portrait: gen?.portrait,
            tier: profile?.tier,
            tacticalSkillId: profile?.tacticalSkillId,
            strategicSkillId: profile?.strategicSkillId,
            eliteName: elite?.name,
            eliteTier: elite?.tier,
            eliteRegion: elite?.region,
            cityRegion: city?.region,
            completeness,
        };
    });
}

function applyFilter(): void {
    const errorFactionIds = new Set(issues.filter(i => i.level === 'error' && i.factionId).map(i => i.factionId));
    filteredRows = rows.filter(r => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const haystack = `${r.id} ${r.name} ${r.flagText ?? ''} ${r.cityName ?? ''} ${r.generalName ?? ''} ${r.eliteName ?? ''}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        switch (filterMode) {
            case 'incomplete': return r.completeness < 100;
            case 'no-general': return !r.generalId;
            case 'no-elite': return !r.eliteName;
            case 'errors': return errorFactionIds.has(r.id);
        }
        return true;
    });
    sortRows();
}

function sortRows(): void {
    filteredRows.sort((a, b) => {
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
    const noElite = rows.filter(r => !r.eliteName).length;
    els.stats.textContent = `共 ${total} 势力 | 完整 ${complete} | 缺武将 ${noGen} | 缺精锐 ${noElite} | 显示 ${filteredRows.length}`;
}

// ── Table Rendering ──

const COLUMNS: Array<{ key: string; label: string; width?: string }> = [
    { key: 'id', label: 'ID', width: '120px' },
    { key: 'name', label: '势力' },
    { key: 'cityRegion', label: '文化区', width: '90px' },
    { key: 'flagText', label: '旗号', width: '50px' },
    { key: 'cityName', label: '据点' },
    { key: 'lat', label: '纬度', width: '60px' },
    { key: 'lng', label: '经度', width: '60px' },
    { key: 'generalName', label: '武将' },
    { key: 'tacticalSkillId', label: '战术技', width: '70px' },
    { key: 'strategicSkillId', label: '战略技', width: '70px' },
    { key: 'eliteName', label: '精锐' },
    { key: 'eliteTier', label: 'T', width: '30px' },
    { key: 'completeness', label: '完整度', width: '80px' },
    { key: '_actions', label: '', width: '36px' },
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
            <td class="cell-id">${r.id}</td>
            <td>${r.name}</td>
            <td class="cell-region">${r.cityRegion ?? ''}</td>
            <td class="cell-flag">${r.flagText ?? '<span class="cell-miss">✗</span>'}</td>
            <td>${r.cityName ?? '<span class="cell-miss">✗</span>'}</td>
            <td>${r.lat != null ? r.lat.toFixed(1) : ''}</td>
            <td>${r.lng != null ? r.lng.toFixed(1) : ''}</td>
            <td>${r.generalName ? `<span class="cell-ok">${r.generalName}</span>` : '<span class="cell-miss">✗</span>'}</td>
            <td>${formatSkill(r.tacticalSkillId)}</td>
            <td>${formatSkill(r.strategicSkillId)}</td>
            <td>${r.eliteName ? `<span class="cell-ok">${r.eliteName}</span>` : '<span class="cell-miss">✗</span>'}</td>
            <td>${r.eliteTier != null ? `T${r.eliteTier}` : ''}</td>
            <td>${renderBar(r.completeness)}</td>
            <td><button class="bm-copy-btn" data-copy-fid="${r.id}" title="复制为快速录入格式">📋</button></td>
        </tr>`;
    }).join('');

    els.tableWrap.innerHTML = `<table class="bm-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;

    els.tableWrap.querySelectorAll('th').forEach(th => {
        th.addEventListener('click', () => {
            const col = (th as HTMLElement).dataset.col!;
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

function formatSkill(id?: string): string {
    if (!id) return '';
    if (!entityData) return id;
    const tac = entityData.tacticalSkills.find(s => s.id === id);
    if (tac) return `<span title="${tac.displayName}">${tac.grid}</span>`;
    const str = entityData.strategicSkills.find(s => s.id === id);
    if (str) return `<span title="${str.displayName}">${str.grid}</span>`;
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
    const check = (newName: string, label: string, field: keyof FactionRow, existLabel: string) => {
        if (!newName || newName.length < 2) return;
        for (const row of rows) {
            const exist = row[field] as string | undefined;
            if (!exist || exist.length < 2) continue;
            if (newName === exist) {
                warnings.push(`${label}"${newName}" 与已有${existLabel}"${exist}"(${row.name}) 完全同名`);
            } else if (newName.includes(exist) || exist.includes(newName)) {
                warnings.push(`${label}"${newName}" 与已有${existLabel}"${exist}"(${row.name}) 名字包含关系`);
            }
        }
    };
    check(cityName, '据点', 'cityName', '据点');
    check(factionName, '势力', 'name', '势力');
    check(generalName, '武将', 'generalName', '武将');
    check(eliteName, '精锐', 'eliteName', '精锐');
    return warnings;
}

function updateIdPreview(): void {
    const preview = document.getElementById('bm-id-preview');
    if (!preview) return;
    const form = document.getElementById('bm-edit-form') as HTMLFormElement;
    if (!form) return;

    const factionName = (form.querySelector('[name="factionName"]') as HTMLInputElement)?.value.trim() ?? '';
    const cityName = (form.querySelector('[name="cityName"]') as HTMLInputElement)?.value.trim() ?? '';
    const generalName = (form.querySelector('[name="generalName"]') as HTMLInputElement)?.value.trim() ?? '';

    if (!factionName && !cityName) {
        preview.innerHTML = '<span class="id-label">输入名称后自动生成 ID…</span>';
        return;
    }

    const ids = computeIds(factionName, cityName, generalName);
    const lines: string[] = [];
    if (ids.factionId) {
        lines.push(`<span class="id-label">势力 ID:</span> <span class="id-value">${ids.factionId}</span>${ids.factionDup ? ' <span class="id-dup">(已存在同名, 自动加后缀)</span>' : ''}`);
    }
    if (ids.cityId) {
        lines.push(`<span class="id-label">据点 ID:</span> <span class="id-value">${ids.cityId}</span>${ids.cityDup ? ' <span class="id-dup">(已存在同名, 自动加后缀)</span>' : ''}`);
    }
    if (ids.generalId) {
        lines.push(`<span class="id-label">武将 ID:</span> <span class="id-value">${ids.generalId}</span>${ids.generalDup ? ' <span class="id-dup">(已存在同名, 自动加后缀)</span>' : ''}`);
    }
    preview.innerHTML = lines.join('<br>');
}

// ── Edit / Add Panel ──

function openEditPanel(factionId: string | null): void {
    els.panel.style.display = 'block';
    const row = factionId ? rows.find(r => r.id === factionId) : null;
    const isNew = !row;
    const title = isNew ? '新增实体' : `编辑: ${row!.name}`;

    const tacOptions = (entityData?.tacticalSkills ?? []).map(s =>
        `<option value="${s.id}" ${s.id === (row?.tacticalSkillId ?? '') ? 'selected' : ''}>${s.grid} ${s.displayName}</option>`
    ).join('');
    const strOptions = (entityData?.strategicSkills ?? []).map(s =>
        `<option value="${s.id}" ${s.id === (row?.strategicSkillId ?? '') ? 'selected' : ''}>${s.grid} ${s.displayName}</option>`
    ).join('');
    const currentRegion = row?.cityRegion ?? row?.eliteRegion ?? '';
    const regionOptions = (entityData?.regions ?? []).map(r =>
        `<option value="${r}" ${r === currentRegion ? 'selected' : ''}>${r}</option>`
    ).join('');

    if (isNew) {
        // ── New entity: quick-input mode ──
        els.panelContent.innerHTML = `
        <div class="bm-form">
          <h3>快速录入</h3>
          <label><span>粘贴一行文字，自动解析所有字段</span>
            <textarea id="bm-quick-input" rows="3" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:8px;font-size:13px;resize:vertical;font-family:inherit"
              placeholder="据点：梓州，势力：梓州，旗号：梓，武将：王建，精锐：西川牙兵，T2。lat: 31.1141, lng: 105.0623"></textarea>
          </label>
          <label><span>文化区 *</span>
            <select id="bm-quick-region" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:6px 8px;font-size:13px">
              <option value="">请选择</option>
              ${regionOptions}
            </select>
          </label>
          <div class="form-row" style="margin-top:8px">
            <label><span>战术技 (可选)</span>
              <select id="bm-quick-tac" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:6px 8px;font-size:13px">
                <option value="">不设</option>
                ${tacOptions}
              </select>
            </label>
            <label><span>战略技 (可选)</span>
              <select id="bm-quick-str" style="width:100%;background:#1c1916;border:1px solid #3a342c;color:#eee;border-radius:4px;padding:6px 8px;font-size:13px">
                <option value="">无</option>
                ${strOptions}
              </select>
            </label>
          </div>

          <div id="bm-quick-preview" class="bm-id-preview" style="margin-top:12px">
            <span class="id-label">粘贴文字后自动解析…</span>
          </div>

          <div class="form-actions">
            <button type="button" id="bm-quick-submit" class="bm-btn bm-btn-primary">解析并提交</button>
            <button type="button" class="bm-btn" id="bm-panel-close">关闭</button>
          </div>
        </div>
        `;

        const quickInput = document.getElementById('bm-quick-input') as HTMLTextAreaElement;
        quickInput.addEventListener('input', () => updateQuickPreview());
        document.getElementById('bm-quick-region')!.addEventListener('change', () => updateQuickPreview());
        document.getElementById('bm-quick-submit')!.addEventListener('click', handleQuickSubmit);
        document.getElementById('bm-panel-close')!.addEventListener('click', closePanel);
        quickInput.focus();
        return;
    } else {
        // ── Edit existing: show IDs as readonly ──
        els.panelContent.innerHTML = `
        <form class="bm-form" id="bm-edit-form">
          <h3>编辑: ${row!.name}</h3>
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
            <label><span>纬度 (lat)</span><input name="lat" type="number" step="0.0001" value="${row!.lat ?? ''}" required /></label>
            <label><span>经度 (lng)</span><input name="lng" type="number" step="0.0001" value="${row!.lng ?? ''}" required /></label>
          </div>
          <label><span>文化区</span>
            <select name="region">
              <option value="">不设</option>
              ${regionOptions}
            </select>
          </label>

          <h3>② 武将</h3>
          <div class="form-row">
            <label><span>武将 ID</span><input value="${row!.generalId ?? ''}" readonly /></label>
            <label><span>武将名</span><input name="generalName" value="${row!.generalName ?? ''}" /></label>
          </div>
          <input type="hidden" name="generalId" value="${row!.generalId ?? ''}" />
          <label><span>立绘路径</span><input name="portrait" value="${row!.portrait ?? ''}" /></label>
          <div class="form-row">
            <label><span>品阶</span>
              <select name="tier">
                <option value="">不设</option>
                <option value="famous" ${row!.tier === 'famous' ? 'selected' : ''}>名将 (famous)</option>
                <option value="ordinary" ${row!.tier === 'ordinary' ? 'selected' : ''}>普将 (ordinary)</option>
              </select>
            </label>
            <label><span>战术技</span>
              <select name="tacticalSkillId">
                <option value="">不设</option>
                ${tacOptions}
              </select>
            </label>
          </div>
          <label><span>战略技 (仅名将)</span>
            <select name="strategicSkillId">
              <option value="">无</option>
              ${strOptions}
            </select>
          </label>

          <h3>③ 精锐番号</h3>
          <div class="form-row">
            <label><span>番号名</span><input name="eliteName" value="${row!.eliteName ?? ''}" /></label>
            <label><span>级别</span>
              <select name="eliteTier">
                <option value="">不设</option>
                <option value="0" ${row!.eliteTier === 0 ? 'selected' : ''}>T0</option>
                <option value="1" ${row!.eliteTier === 1 ? 'selected' : ''}>T1</option>
                <option value="2" ${row!.eliteTier === 2 ? 'selected' : ''}>T2</option>
                <option value="3" ${row!.eliteTier === 3 ? 'selected' : ''}>T3</option>
              </select>
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="bm-btn bm-btn-primary">保存修改</button>
            <button type="button" class="bm-btn" id="bm-panel-close">关闭</button>
          </div>
        </form>
        `;
    }

    document.getElementById('bm-panel-close')!.addEventListener('click', closePanel);
    document.getElementById('bm-edit-form')!.addEventListener('submit', handleFormSubmit);
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
}

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

    const cityName = extract([/据点[：:]\s*([^，,。\s]+)/]);
    const factionName = extract([/势力[：:]\s*([^，,。\s]+)/]);
    const flagText = extract([/旗号[：:]\s*([^，,。\s]+)/]);
    const generalName = extract([/武将[：:]\s*([^，,。\s]+)/]);
    const eliteName = extract([/精锐[：:]\s*([^，,。T\d\s]+)/]);

    // T0-T3
    const tierMatch = t.match(/[,，。\s]T(\d)/i);
    const eliteTier = tierMatch ? parseInt(tierMatch[1]) : 2;

    // lat/lng
    const latMatch = t.match(/lat[：:\s]*(-?[\d.]+)/i);
    const lngMatch = t.match(/lng[：:\s]*(-?[\d.]+)/i);
    const lat = latMatch ? parseFloat(latMatch[1]) : NaN;
    const lng = lngMatch ? parseFloat(lngMatch[1]) : NaN;

    // 名将/普将 (default ordinary)
    const isFamous = /名将/.test(t);
    const tier = isFamous ? 'famous' as const : 'ordinary' as const;

    if (!factionName || !cityName) return null;

    return {
        cityName, factionName,
        flagText: flagText || factionName.slice(0, 1),
        generalName, eliteName, eliteTier,
        lat, lng, tier,
    };
}

function updateQuickPreview(): void {
    const preview = document.getElementById('bm-quick-preview');
    const input = document.getElementById('bm-quick-input') as HTMLTextAreaElement;
    const regionSelect = document.getElementById('bm-quick-region') as HTMLSelectElement;
    if (!preview || !input) return;

    const parsed = parseQuickInput(input.value);
    if (!parsed) {
        preview.innerHTML = '<span class="id-label">粘贴文字后自动解析…</span>';
        return;
    }

    const ids = computeIds(parsed.factionName, parsed.cityName, parsed.generalName);
    const region = regionSelect?.value || '';
    const lines: string[] = [
        `<span class="id-label">势力:</span> ${parsed.factionName} → <span class="id-value">${ids.factionId}</span>${ids.factionDup ? ' <span class="id-dup">(+后缀)</span>' : ''}`,
        `<span class="id-label">旗号:</span> ${parsed.flagText}`,
        `<span class="id-label">据点:</span> ${parsed.cityName} → <span class="id-value">${ids.cityId}</span>${ids.cityDup ? ' <span class="id-dup">(+后缀)</span>' : ''}`,
        `<span class="id-label">坐标:</span> ${isNaN(parsed.lat) ? '<span class="id-dup">未识别</span>' : `${parsed.lat}, ${parsed.lng}`}`,
        `<span class="id-label">文化区:</span> ${region || '<span class="id-dup">请选择</span>'}`,
    ];
    const existingFaction = rows.find(r => r.id === ids.factionId);
    if (existingFaction) {
        lines.push(`<span class="id-dup">⚠ 势力已存在，将跳过据点导入，仅补充武将/精锐</span>`);
    }
    if (parsed.generalName) {
        const portraitPath = region ? `/assets/${region}/${ids.generalId}.png` : '';
        lines.push(`<span class="id-label">武将:</span> ${parsed.generalName} → <span class="id-value">${ids.generalId}</span>${ids.generalDup ? ' <span class="id-dup">(+后缀)</span>' : ''} (${parsed.tier === 'famous' ? '名将' : '普将'})`);
        if (portraitPath) {
            lines.push(`<span class="id-label">立绘:</span> <span class="id-value">${portraitPath}</span>`);
        }
    }
    if (parsed.eliteName) {
        lines.push(`<span class="id-label">精锐:</span> ${parsed.eliteName} T${parsed.eliteTier}`);
    }
    const dupWarnings = checkNameDuplicates(parsed.cityName, parsed.factionName, parsed.generalName || '', parsed.eliteName || '');
    for (const w of dupWarnings) {
        lines.push(`<span class="id-dup">⚠ ${w}</span>`);
    }
    preview.innerHTML = lines.join('<br>');
}

async function handleQuickSubmit(): Promise<void> {
    const input = document.getElementById('bm-quick-input') as HTMLTextAreaElement;
    const regionSelect = document.getElementById('bm-quick-region') as HTMLSelectElement;
    const tacSelect = document.getElementById('bm-quick-tac') as HTMLSelectElement;
    const strSelect = document.getElementById('bm-quick-str') as HTMLSelectElement;

    const parsed = parseQuickInput(input.value);
    if (!parsed) {
        showToast('无法解析，请检查格式。需要至少包含: 据点：xx，势力：xx', true);
        return;
    }
    if (isNaN(parsed.lat) || isNaN(parsed.lng)) {
        showToast('未识别到坐标，请包含 lat: xx, lng: xx', true);
        return;
    }
    const region = regionSelect.value;
    if (!region) {
        showToast('请选择文化区', true);
        return;
    }

    const ids = computeIds(parsed.factionName, parsed.cityName, parsed.generalName);
    if (!ids.factionId || !ids.cityId) {
        showToast('无法生成 ID，请检查名称', true);
        return;
    }

    const dupWarnings = checkNameDuplicates(parsed.cityName, parsed.factionName, parsed.generalName || '', parsed.eliteName || '');
    if (dupWarnings.length > 0) {
        showToast(`重名检测: ${dupWarnings[0]}`, true);
        return;
    }

    const tacticalSkillId = tacSelect?.value || '';
    const strategicSkillId = strSelect?.value || '';

    const existingFaction = rows.find(r => r.id === ids.factionId);

    try {
        // Step 0: 50km proximity check (always run)
        const proxRes = await fetch('/api/check-proximity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: parsed.lat, lng: parsed.lng,
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
            showToast(`势力 "${parsed.factionName}" 已存在，跳过据点导入，补充武将/精锐…`);
        } else {
            const importRes = await fetch('/api/batch-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entries: [{
                        factionId: ids.factionId,
                        factionName: parsed.factionName,
                        flagText: parsed.flagText,
                        cityId: ids.cityId,
                        cityName: parsed.cityName,
                        lat: parsed.lat, lng: parsed.lng,
                        region,
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
        if (parsed.generalName && tacticalSkillId) {
            const genRes = await fetch('/api/save-general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId: ids.factionId,
                    generalId: ids.generalId,
                    generalName: parsed.generalName,
                    portrait: `/assets/${region}/${ids.generalId}.png`,
                    tier: parsed.tier,
                    tacticalSkillId,
                    strategicSkillId: strategicSkillId || undefined,
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
        if (parsed.eliteName) {
            const eliteRes = await fetch('/api/save-elite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId: ids.factionId,
                    eliteName: parsed.eliteName,
                    eliteTier: parsed.eliteTier,
                    region,
                }),
            });
            const eliteData = await eliteRes.json();
            if (!eliteData.ok) {
                showToast(`精锐保存失败: ${eliteData.error}`, true);
                return;
            }
        }

        showToast(`✓ ${parsed.factionName} 添加成功 → ${ids.factionId}`);
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
    }

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
        const generalName = get('generalName');
        const portrait = get('portrait');
        const tier = get('tier');
        const tacticalSkillId = get('tacticalSkillId');
        const strategicSkillId = get('strategicSkillId');

        if (generalName && tier && tacticalSkillId) {
            if (!generalId) {
                const ids = computeIds(factionName, cityName, generalName);
                generalId = ids.generalId;
            }
            const portraitRegion = region || 'CENTRAL';
            const genRes = await fetch('/api/save-general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId, generalId, generalName,
                    portrait: portrait || `/assets/${portraitRegion}/${generalId}.png`,
                    tier, tacticalSkillId,
                    strategicSkillId: strategicSkillId || undefined,
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

        if (eliteName && eliteTier !== '' && region) {
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
        renderValidation();
        els.validation.style.display = 'block';
        applyFilter();
        renderTable();
        updateStats();
    } catch (err: any) {
        showToast(`校验失败: ${err.message}`, true);
    }
}

function renderValidation(): void {
    const errors = issues.filter(i => i.level === 'error');
    const warns = issues.filter(i => i.level === 'warn');
    const infos = issues.filter(i => i.level === 'info');

    const issueHtml = (i: typeof issues[0], icon: string) => {
        if (i.factionId) {
            return `<div class="issue issue-${i.level}" data-fid="${i.factionId}" style="cursor:pointer">${icon} ${i.msg} → 点击编辑</div>`;
        }
        const idMatch = i.msg.match(/\((\w+)\)/);
        if (idMatch) {
            return `<div class="issue issue-${i.level}" data-fid="${idMatch[1]}" style="cursor:pointer">${icon} ${i.msg} → 点击编辑</div>`;
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
}

// ── Toast ──

function showToast(msg: string, isError = false): void {
    els.toast.textContent = msg;
    els.toast.className = isError ? 'bm-toast is-error' : 'bm-toast';
    setTimeout(() => { if (els.toast.textContent === msg) els.toast.textContent = ''; }, 4000);
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
}

// ── Boot ──

async function boot(): Promise<void> {
    bindEvents();
    searchQuery = localStorage.getItem('bm-search') ?? '';
    filterMode = (localStorage.getItem('bm-filter') ?? 'all') as typeof filterMode;
    els.search.value = searchQuery;
    els.filter.value = filterMode;
    await loadData();
}

boot().catch(err => {
    console.error(err);
    app.innerHTML = `<div style="padding:40px;color:#ff9a8a">启动失败: ${err}</div>`;
});
