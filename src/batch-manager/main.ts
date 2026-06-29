/**
 * MAPWAR 实体批量管理工具
 * 访问：http://localhost:5173/batch-manager.html
 *
 * 功能：查看/新增/校验 据点、势力、旗号、武将、武将技、精锐
 */

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
    completeness: number;
}

interface EntityData {
    factions: Array<{ id: string; name: string }>;
    cities: Array<{ id: string; name: string; factionId: string; lat: number; lng: number; type: string; troops: number; region?: string }>;
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
        width:420px; border-left:1px solid #2a2620; background:#12100e;
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
      .bm-form .form-row { display:flex; gap:8px; }
      .bm-form .form-row label { flex:1; }
      .bm-form .form-actions { display:flex; gap:8px; margin-top:16px; }
      .bm-form h3 { color:#f5e6c8; font-size:14px; margin:16px 0 8px; border-bottom:1px solid #2a2620; padding-bottom:4px; }
      .bm-form h3:first-child { margin-top:0; }

      .bm-validation {
        position:fixed; bottom:0; left:0; right:0; max-height:40vh;
        background:#12100e; border-top:2px solid #5a2828;
        overflow-y:auto; padding:12px 16px; z-index:10;
      }
      .bm-validation-header {
        display:flex; justify-content:space-between; align-items:center;
        margin-bottom:8px; font-weight:bold; color:#f5e6c8;
      }
      .bm-validation .issue { padding:3px 0; font-size:12px; }
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
        if (flag) completeness++;            // 旗号
        if (cId && city) completeness++;      // 据点
        if (gen) completeness++;              // 武将
        if (profile) completeness++;          // 技能
        if (elite) completeness++;            // 精锐
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
        </tr>`;
    }).join('');

    els.tableWrap.innerHTML = `<table class="bm-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;

    // bind clicks
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
        tr.addEventListener('click', () => {
            editingFactionId = (tr as HTMLElement).dataset.fid!;
            openEditPanel(editingFactionId);
            renderTable();
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
    const regionOptions = (entityData?.regions ?? []).map(r =>
        `<option value="${r}" ${r === (row?.eliteRegion ?? '') ? 'selected' : ''}>${r}</option>`
    ).join('');

    els.panelContent.innerHTML = `
    <form class="bm-form" id="bm-edit-form">
      <h3>① 势力 &amp; 据点</h3>
      <div class="form-row">
        <label><span>势力 ID</span><input name="factionId" value="${row?.id ?? ''}" ${row ? 'readonly' : ''} required /></label>
        <label><span>势力名称</span><input name="factionName" value="${row?.name ?? ''}" required /></label>
      </div>
      <label><span>旗号 (1-2字)</span><input name="flagText" value="${row?.flagText ?? ''}" maxlength="4" required /></label>
      <div class="form-row">
        <label><span>据点 ID</span><input name="cityId" value="${row?.cityId ?? ''}" required /></label>
        <label><span>据点名称</span><input name="cityName" value="${row?.cityName ?? ''}" required /></label>
      </div>
      <div class="form-row">
        <label><span>纬度 (lat)</span><input name="lat" type="number" step="0.01" value="${row?.lat ?? ''}" required /></label>
        <label><span>经度 (lng)</span><input name="lng" type="number" step="0.01" value="${row?.lng ?? ''}" required /></label>
      </div>

      <h3>② 武将 (可选)</h3>
      <div class="form-row">
        <label><span>武将 ID</span><input name="generalId" value="${row?.generalId ?? ''}" /></label>
        <label><span>武将名</span><input name="generalName" value="${row?.generalName ?? ''}" /></label>
      </div>
      <label><span>立绘路径</span><input name="portrait" value="${row?.portrait ?? ''}" placeholder="/assets/REGION/factionId_generalId.png" /></label>
      <div class="form-row">
        <label><span>品阶</span>
          <select name="tier">
            <option value="">不设</option>
            <option value="famous" ${row?.tier === 'famous' ? 'selected' : ''}>名将 (famous)</option>
            <option value="ordinary" ${row?.tier === 'ordinary' ? 'selected' : ''}>普将 (ordinary)</option>
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

      <h3>③ 精锐番号 (可选)</h3>
      <div class="form-row">
        <label><span>番号名</span><input name="eliteName" value="${row?.eliteName ?? ''}" /></label>
        <label><span>级别</span>
          <select name="eliteTier">
            <option value="">不设</option>
            <option value="0" ${row?.eliteTier === 0 ? 'selected' : ''}>T0</option>
            <option value="1" ${row?.eliteTier === 1 ? 'selected' : ''}>T1</option>
            <option value="2" ${row?.eliteTier === 2 ? 'selected' : ''}>T2</option>
            <option value="3" ${row?.eliteTier === 3 ? 'selected' : ''}>T3</option>
          </select>
        </label>
      </div>
      <label><span>文化区 (决定写入哪个 ExpeditionLegions 文件)</span>
        <select name="eliteRegion">
          <option value="">不设</option>
          ${regionOptions}
        </select>
      </label>

      <div class="form-actions">
        <button type="submit" class="bm-btn bm-btn-primary">${isNew ? '提交新增' : '保存修改'}</button>
        <button type="button" class="bm-btn" id="bm-panel-close">关闭</button>
      </div>
    </form>
    `;

    document.getElementById('bm-panel-close')!.addEventListener('click', closePanel);
    document.getElementById('bm-edit-form')!.addEventListener('submit', handleFormSubmit);
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

    const factionId = get('factionId');
    const factionName = get('factionName');
    const flagText = get('flagText');
    const cityId = get('cityId');
    const cityName = get('cityName');
    const lat = parseFloat(get('lat'));
    const lng = parseFloat(get('lng'));

    if (!factionId || !factionName || !flagText || !cityId || !cityName || isNaN(lat) || isNaN(lng)) {
        showToast('请填写完整的势力和据点信息', true);
        return;
    }

    try {
        // Step 1: batch-import (faction + city + flag + startingCapital)
        const importRes = await fetch('/api/batch-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                entries: [{
                    factionId, factionName, flagText,
                    cityId, cityName, lat, lng,
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
        const generalId = get('generalId');
        const generalName = get('generalName');
        const portrait = get('portrait');
        const tier = get('tier');
        const tacticalSkillId = get('tacticalSkillId');
        const strategicSkillId = get('strategicSkillId');

        if (generalId && generalName && tier && tacticalSkillId) {
            const genRes = await fetch('/api/save-general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId, generalId, generalName,
                    portrait: portrait || `/assets/CENTRAL/${factionId}_${generalId}.png`,
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

        // Step 3: save elite (if provided)
        const eliteName = get('eliteName');
        const eliteTier = get('eliteTier');
        const eliteRegion = get('eliteRegion');

        if (eliteName && eliteTier !== '' && eliteRegion) {
            const eliteRes = await fetch('/api/save-elite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId, eliteName,
                    eliteTier: parseInt(eliteTier),
                    region: eliteRegion,
                }),
            });
            const eliteData = await eliteRes.json();
            if (!eliteData.ok) {
                showToast(`精锐保存失败: ${eliteData.error}`, true);
                return;
            }
        }

        showToast(`✓ ${factionName} 保存成功`);
        await loadData();
        if (factionId) {
            editingFactionId = factionId;
            openEditPanel(factionId);
        }
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

    els.validationList.innerHTML = [
        `<div style="margin-bottom:6px;color:#a89f8f">错误 ${errors.length} | 警告 ${warns.length} | 信息 ${infos.length}</div>`,
        ...errors.map(i => `<div class="issue issue-error">✗ ${i.msg}</div>`),
        ...warns.map(i => `<div class="issue issue-warn">⚠ ${i.msg}</div>`),
        ...infos.slice(0, 50).map(i => `<div class="issue issue-info">ℹ ${i.msg}</div>`),
        infos.length > 50 ? `<div class="issue issue-info">… 还有 ${infos.length - 50} 条信息</div>` : '',
    ].join('');
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
        applyFilter();
        renderTable();
        updateStats();
    });
    els.filter.addEventListener('change', () => {
        filterMode = els.filter.value as typeof filterMode;
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
    await loadData();
}

boot().catch(err => {
    console.error(err);
    app.innerHTML = `<div style="padding:40px;color:#ff9a8a">启动失败: ${err}</div>`;
});
