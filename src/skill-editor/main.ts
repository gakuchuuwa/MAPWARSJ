/**
 * 武将技编辑器（/skill-editor.html）
 * ────────────────────────────────────────────
 * 一技一档案：三势 / 攻防 / 六类(推导) / 典故主(=专属) / 档位。
 * 六类 = baseEffect → 效果大类 → 与三势结合自动推导（不手动填写）。
 * 服务端：vite.config.ts /api/skill-editor/{list,save,create}
 */
interface SkillRow {
    id: string; displayName: string; sourceQuote: string;
    baseEffect: string; condition: string; phase: string;
    magnitude?: number; luckMin?: number; luckMax?: number;
    engineStatus: string; note: string;
    family: string | null; locked: boolean;
    situationTag: string; situationSource: string;
    usageTag: string; usageSource: string;
    sixClass: string; sixClassMatch: boolean;
    ownerGeneralId: string | null; ownerName: string | null; ownerSource: string | null;
    exclusive: string;
    wearers: { gid: string; name: string; tier: string }[];
}
interface GeneralRow { generalId: string; name: string; tier: string; }

let SKILLS: SkillRow[] = [];
let GENERALS: GeneralRow[] = [];
let TIERS: Record<string, Record<string, number | [number, number]>> = {};
let CONDITIONS: string[] = [];
let selectedId: string | null = null;
let sortKey: string | null = null;
let sortDir: 1 | -1 = 1;
/** 典故主→其拥有的在役技数（renderList 排序前重算，供"按人数排"用） */
let ownerCount = new Map<string, number>();

const SIT_ORDER: Record<string, number> = { '优势': 0, '均势': 1, '劣势': 2 };
const USE_ORDER: Record<string, number> = { '攻击': 0, '双行': 1, '防御': 2 };
const SIX_ORDER: Record<string, number> = { '攻战计': 0, '胜战计': 1, '敌战计': 2, '混战计': 3, '并战计': 4, '败战计': 5 };
function sortValue(s: SkillRow, key: string): number | string {
    switch (key) {
        case 'id': return parseInt(s.id.replace('ts_', ''), 10) || 0;
        case 'name': return s.displayName;
        case 'sit': return SIT_ORDER[s.situationTag] ?? 9;
        case 'use': return USE_ORDER[s.usageTag] ?? 9;
        case 'six': return s.sixClass ? (SIX_ORDER[s.sixClass] ?? 8) : 9;
        case 'owner': return s.ownerName ? (ownerCount.get(s.ownerName) ?? 0) : -1;
        case 'value': return s.family === 'luck' ? (s.luckMin ?? 0.8) : (s.magnitude ?? -1);
        case 'wear': return s.wearers.length;
        default: return 0;
    }
}

const app = document.getElementById('app')!;
app.innerHTML = `
<style>
    .se-header { padding: 10px 16px; background: #1a1713; border-bottom: 1px solid #3a3226; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .se-title { font-size: 18px; font-weight: bold; color: #d8b95e; letter-spacing: 2px; margin-right: 8px; }
    .se-header input, .se-header select { background: #0e0d0c; color: #e8e0d0; border: 1px solid #4a4234; border-radius: 4px; padding: 5px 8px; font-family: inherit; }
    .se-btn { background: #3a3226; color: #e8d9b0; border: 1px solid #6a5c3c; border-radius: 4px; padding: 5px 14px; cursor: pointer; font-family: inherit; }
    .se-btn:hover { background: #4a4234; }
    .se-btn-gold { background: #5c4a1e; border-color: #b48c3c; }
    .se-btn-red { background: #5c2a1e; border-color: #b45c3c; }
    .se-main { flex: 1; display: flex; min-height: 0; }
    .se-list { flex: 1; overflow: auto; min-width: 280px; }
    .se-splitter { width: 5px; cursor: col-resize; background: #2a2418; flex-shrink: 0; transition: background 0.15s; }
    .se-splitter:hover, .se-splitter.dragging { background: #6a5c3c; }
    .se-detail { width: 480px; min-width: 280px; max-width: 70%; border-left: 1px solid #3a3226; overflow: auto; padding: 14px; background: #131110; flex-shrink: 0; }
    .se-detail.se-closed, .se-splitter.se-closed { display: none; }
    .se-detail-hd { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
    .se-detail-hd h3 { margin: 0; flex: 1; color: #d8b95e; }
    .se-list th { position: sticky; top: 0; background: #1a1713; color: #b8a878; text-align: left; padding: 6px 8px; border-bottom: 1px solid #3a3226; }
    .se-sortable { cursor: pointer; user-select: none; }
    .se-sortable:hover { color: #d8b95e; }
    .se-sort-arrow { color: #d8b95e; font-size: 11px; margin-left: 3px; }
    .se-list td { padding: 4px 8px; border-bottom: 1px solid #221e18; white-space: nowrap; }
    .se-list tr { cursor: pointer; }
    .se-list tr:hover td { background: #221e18; }
    .se-list tr.sel td { background: #2e281c; }
    .se-detail h3 { margin: 0 0 4px; color: #d8b95e; }
    .se-field { margin: 8px 0; }
    .se-field label { display: inline-block; width: 76px; color: #b8a878; font-size: 13px; }
    .se-field select, .se-field input { background: #0e0d0c; color: #e8e0d0; border: 1px solid #4a4234; border-radius: 4px; padding: 4px 8px; font-family: inherit; width: 300px; }
    .se-field .se-ro { color: #8a7a5a; font-size: 13px; }
    .se-quote { font-size: 12px; color: #9a8e78; margin: 6px 0; line-height: 1.5; }
    .se-wearers { font-size: 12px; color: #8a9a78; margin: 6px 0; line-height: 1.6; }
    .se-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 11px; margin-left: 4px; }
    .se-inline { background: #2c4a2c; color: #a8d8a8; }
    .se-table { background: #4a3c1e; color: #d8c88e; }
    .se-derived { background: #3a3226; color: #a89878; }
    .se-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #2c4a2c; color: #d8f0d8; padding: 10px 24px; border-radius: 6px; z-index: 99; display: none; max-width: 80%; }
    .se-toast.err { background: #5a2424; color: #f0d8d8; }
    .se-new { border: 1px solid #3a3226; border-radius: 6px; padding: 10px; margin-top: 14px; background: #17140f; display: none; }
    .se-mono { font-family: Consolas, monospace; font-size: 12px; color: #8a97a8; }
    .se-count { color: #8a8271; font-size: 13px; margin-left: auto; }
    .se-match-warn { color: #d8a05e; font-size: 11px; }
    .se-copy-btn { background: none; border: 1px solid #3a3226; color: #8a7a5a; cursor: pointer; border-radius: 3px; padding: 0 4px; font-size: 12px; }
    .se-copy-btn:hover { background: #2e281c; color: #d8b95e; border-color: #6a5c3c; }
    /* 错误检查弹窗 */
    .se-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; }
    .se-modal { background: #1a1713; border: 1px solid #6a5c3c; border-radius: 8px; width: 820px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.6); }
    .se-modal-hd { padding: 14px 18px; border-bottom: 1px solid #3a3226; display: flex; align-items: center; gap: 12px; }
    .se-modal-hd h3 { margin: 0; color: #d8b95e; }
    .se-modal-body { flex: 1; overflow: auto; padding: 12px 18px; }
    .se-modal-body table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .se-modal-body th { text-align: left; padding: 6px 8px; border-bottom: 1px solid #3a3226; color: #b8a878; position: sticky; top: 0; background: #1a1713; }
    .se-modal-body td { padding: 4px 8px; border-bottom: 1px solid #221e18; }
    .se-err-count { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 13px; }
    .se-err-red { background: #5a2424; color: #f0a0a0; }
    .se-err-ok { background: #2c4a2c; color: #a8d8a8; }
    .se-err-warn { background: #4a3c1e; color: #d8c88e; }
    .se-issue-row td { color: #e8a0a0; }
    .se-issue-row:hover td { background: #2a1a1a; }
    .se-issue-row.se-issue-warn td { color: #d8c88e; }
    .se-issue-row.se-issue-warn:hover td { background: #2a2418; }
    .se-summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
    /* 典故主级汇总 */
    .se-owner-summary { background: #1e1a14; border: 1px solid #4a3c1e; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
    .se-owner-summary-hd { color: #d8b95e; font-size: 14px; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #3a3226; padding-bottom: 6px; }
    .se-owner-item { display: flex; align-items: flex-start; gap: 8px; padding: 4px 0; font-size: 13px; line-height: 1.5; }
    .se-owner-item + .se-owner-item { border-top: 1px solid #2a2418; }
    .se-owner-tag { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 11px; white-space: nowrap; flex-shrink: 0; }
    .se-owner-tag-over { background: #5a2424; color: #f0a0a0; }
    .se-owner-tag-dup { background: #4a3c1e; color: #d8c88e; }
    .se-owner-msg { flex: 1; color: #d0b090; word-break: break-all; }
</style>
<div class="se-header">
    <span class="se-title">武将技编辑器</span>
    <input id="f-search" placeholder="搜技名 / id / 典故主" style="width:180px">
    <select id="f-sit"><option value="">三势·全部</option><option>优势</option><option>均势</option><option>劣势</option></select>
    <select id="f-use"><option value="">攻防·全部</option><option>攻击</option><option>防御</option><option>双行</option></select>
    <select id="f-six"><option value="">六类·全部</option><option value="攻战计">攻战计</option><option value="胜战计">胜战计</option><option value="敌战计">敌战计</option><option value="混战计">混战计</option><option value="并战计">并战计</option><option value="败战计">败战计</option><option value="(空)">未标六类</option><option value="(x)">三势跨类</option></select>
    <select id="f-wear">
        <option value="">佩戴·全部</option>
        <option value="none">无人佩戴</option>

    </select>
    <select id="f-owner">
        <option value="">典故主·全部</option>
        <option value="registered">在册武将</option>
        <option value="unregistered">不在册</option>
        <option value="none">无典故主</option>
    </select>
    <button class="se-btn se-btn-gold" id="btn-new">＋ 新增技能</button>
    <button class="se-btn se-btn-red" id="btn-check">🔍 检查错误</button>
    <button class="se-btn se-btn-gold" id="btn-six">⚔ 六槽管理</button>
    <button class="se-btn" id="btn-export">📄 导出文档</button>
    <button class="se-btn" id="btn-refresh">刷新</button>
    <span class="se-count" id="count"></span>
</div>
<div class="se-main">
    <div class="se-list"><table>
        <thead><tr>
            <th class="se-sortable" data-sort="id">id</th>
            <th class="se-sortable" data-sort="name">技名</th>
            <th class="se-sortable" data-sort="sit">三势</th>
            <th class="se-sortable" data-sort="use">攻防</th>
            <th class="se-sortable" data-sort="six">六类(推导)</th>
            <th class="se-sortable" data-sort="owner">典故主</th>
            <th class="se-sortable" data-sort="value">档位/数值</th>
            <th class="se-sortable" data-sort="wear">佩戴</th>
            <th>复制</th>
        </tr></thead>
        <tbody id="list-body"></tbody>
    </table></div>
    <div class="se-splitter se-closed" id="splitter"></div>
    <div class="se-detail se-closed" id="detail"></div>
</div>
<div class="se-toast" id="toast"></div>
<datalist id="dl-generals"></datalist>
`;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
function toast(msg: string, err = false): void {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'se-toast' + (err ? ' err' : '');
    t.style.display = 'block';
    window.setTimeout(() => { t.style.display = 'none'; }, err ? 8000 : 3000);
}

function valueLabel(s: SkillRow): string {
    if (s.family === 'luck') return `[${s.luckMin ?? 0.8},${s.luckMax ?? 1.2}]`;
    return String(s.magnitude ?? '—');
}
function srcBadge(src: string): string {
    if (src === 'inline') return '<span class="se-badge se-inline">档案</span>';
    if (src === 'table') return '<span class="se-badge se-table">散表</span>';
    return '<span class="se-badge se-derived">推导</span>';
}
function wearProblem(s: SkillRow): string {
    return s.wearers.length === 0 ? 'none' : '';
}

function applyFilters(): SkillRow[] {
    const q = ($('f-search') as HTMLInputElement).value.trim();
    const sit = ($('f-sit') as HTMLSelectElement).value;
    const use = ($('f-use') as HTMLSelectElement).value;
    const six = ($('f-six') as HTMLSelectElement).value;
    const wear = ($('f-wear') as HTMLSelectElement).value;
    const owner = ($('f-owner') as HTMLSelectElement).value;
    return SKILLS.filter(s => {
        if (q && !(s.id.includes(q) || s.displayName.includes(q) || (s.ownerName ?? '').includes(q))) return false;
        if (sit && s.situationTag !== sit) return false;
        if (use && s.usageTag !== use) return false;
        if (six === '(空)' && s.sixClass) return false;
        if (six === '(x)' && s.sixClassMatch) return false;
        if (six && six !== '(空)' && six !== '(x)' && s.sixClass !== six) return false;
        if (wear && wearProblem(s) !== wear) return false;
        if (owner === 'registered' && !s.ownerGeneralId) return false;
        if (owner === 'unregistered' && (s.ownerGeneralId || !s.ownerName)) return false;
        if (owner === 'none' && s.ownerName) return false;
        return true;
    });
}

function sixClassDisplay(s: SkillRow): string {
    if (!s.sixClass) return '<span style="color:#5a3a3a">???</span>';
    let html = s.sixClass;
    if (!s.sixClassMatch) html += ' <span class="se-match-warn" title="三势不匹配规范值">⚠</span>';
    return html;
}

function renderList(): void {
    const rows = applyFilters();
    if (sortKey) {
        // 按人数排"典故主"列前，先重算每个典故主的技数
        if (sortKey === 'owner') {
            ownerCount = new Map();
            for (const s of SKILLS) if (s.ownerName) ownerCount.set(s.ownerName, (ownerCount.get(s.ownerName) ?? 0) + 1);
        }
        rows.sort((a, b) => {
            // 典故主列特殊排序：在册 > 不在册 > 无，同组内人数多的在前
            if (sortKey === 'owner') {
                const g = (s: SkillRow) => s.ownerGeneralId ? 0 : s.ownerName ? 1 : 2;
                const ga = g(a), gb = g(b);
                if (ga !== gb) return ga - gb; // 组排序固定升序，不受 sortDir 影响
                // 组内按人数降序（多的在前）
                const ca = ownerCount.get(a.ownerName ?? '') ?? 0;
                const cb = ownerCount.get(b.ownerName ?? '') ?? 0;
                if (ca !== cb) return (cb - ca) * sortDir;
                const nc = (a.ownerName ?? '').localeCompare(b.ownerName ?? '', 'zh');
                if (nc !== 0) return nc;
                return parseInt(a.id.replace('ts_', ''), 10) - parseInt(b.id.replace('ts_', ''), 10);
            }
            const va = sortValue(a, sortKey!), vb = sortValue(b, sortKey!);
            const c = typeof va === 'number' && typeof vb === 'number'
                ? va - vb
                : String(va).localeCompare(String(vb), 'zh');
            if (c !== 0) return c * sortDir;
            // 人数相同的典故主分到一起（同名相邻），再按 id
            if (sortKey === 'owner') {
                const nc = (a.ownerName ?? '').localeCompare(b.ownerName ?? '', 'zh');
                if (nc !== 0) return nc;
            }
            return parseInt(a.id.replace('ts_', ''), 10) - parseInt(b.id.replace('ts_', ''), 10);
        });
    }
    for (const th of document.querySelectorAll('.se-sortable')) {
        const k = (th as HTMLElement).dataset.sort!;
        const base = (th.textContent ?? '').replace(/[▲▼]\s*$/, '').trim();
        th.innerHTML = k === sortKey ? `${base}<span class="se-sort-arrow">${sortDir === 1 ? '▲' : '▼'}</span>` : base;
    }
    $('count').textContent = `${rows.length} / ${SKILLS.length} 条`;
    $('list-body').innerHTML = rows.map(s => `
        <tr data-id="${s.id}" class="${s.id === selectedId ? 'sel' : ''}">
            <td class="se-mono">${s.id}</td>
            <td>${s.displayName}${s.locked ? ' 🔒' : ''}</td>
            <td>${s.situationTag}${srcBadge(s.situationSource)}</td>
            <td>${s.usageTag}</td>
            <td style="color:${s.sixClass ? '#d8c88e' : '#5a4a3a'}">${sixClassDisplay(s)}</td>
            <td>${s.ownerGeneralId
                ? `<span style="color:#a8d8a8">${s.ownerName}</span>`
                : s.ownerName
                    ? `<span style="color:#d8a85e">${s.ownerName} <small style="color:#8a7a5a">不在册</small></span>`
                    : '<span style="color:#6a6254">无</span>'}</td>
            <td class="se-mono">${valueLabel(s)}</td>
            <td>${s.wearers.length}${s.wearers.length === 0 ? ' ∅' : ''}</td>
            <td><button class=\"se-copy-btn\" data-id=\"${s.id}\" title=\"复制此行\">📋</button></td>
        </tr>`).join('');
    for (const tr of $('list-body').querySelectorAll('tr')) {
        tr.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.se-copy-btn')) return;
            selectedId = (tr as HTMLElement).dataset.id!; renderList(); renderDetail();
        });
    }
    for (const btn of $('list-body').querySelectorAll('.se-copy-btn')) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const sid = (btn as HTMLElement).dataset.id!;
            const s = SKILLS.find(x => x.id === sid);
            if (!s) return;
            const line = `${s.id}\t${s.displayName}\t${s.ownerName ?? '通用'}\t${s.sourceQuote}\t${s.usageTag}\t${s.situationTag}\t${s.sixClass}`;
            navigator.clipboard.writeText(line).then(() => toast(`已复制：${s.id} ${s.displayName}`));
        });
    }
}

function tierOptions(s: SkillRow): string {
    if (!s.family) return '';
    const cur = valueLabel(s);
    return Object.entries(TIERS[s.family] ?? {}).map(([label, v]) => {
        const vs = Array.isArray(v) ? `[${v[0]},${v[1]}]` : String(v);
        return `<option value="${label}" ${vs === cur ? 'selected' : ''}>${label}</option>`;
    }).join('');
}

function setDetailOpen(open: boolean): void {
    $('detail').classList.toggle('se-closed', !open);
    $('splitter').classList.toggle('se-closed', !open);
}

function closeDetail(): void {
    selectedId = null;
    setDetailOpen(false);
    $('detail').innerHTML = '';
    renderList();
}

function renderDetail(): void {
    const s = SKILLS.find(x => x.id === selectedId);
    if (!s) return;
    setDetailOpen(true);
    const ownerVal = s.ownerName ? `${s.ownerName} (${s.ownerGeneralId ?? '待挂将'})` : '';
    const sixInfo = s.sixClass
        ? `${s.sixClass}${s.sixClassMatch ? '' : ' ⚠ 三势与规范值不匹配'}`
        : '⚠ 未知效果类型，无法归类';
    $('detail').innerHTML = `
        <div class="se-detail-hd">
            <h3>${s.displayName} <span class="se-mono">${s.id}</span>${s.locked ? ' 🔒锁定值' : ''}</h3>
            <button type="button" class="se-btn" id="d-rename" title="重命名">✏</button>
            <button type="button" class="se-btn" id="d-close" title="关闭右侧编辑">✕</button>
        </div>
        <div class="se-quote">${s.sourceQuote || '（无出处）'}</div>
        <div class="se-mono">effect=${s.baseEffect} · cond=${s.condition} · phase=${s.phase} · ${s.engineStatus}</div>
        ${s.note ? `<div class="se-quote">note: ${s.note}</div>` : ''}
        <hr style="border-color:#3a3226">
        <div class="se-field"><label>三势</label><select id="d-sit">
            ${['优势', '均势', '劣势'].map(v => `<option ${v === s.situationTag ? 'selected' : ''}>${v}</option>`).join('')}
        </select></div>
        <div class="se-field"><label>攻防</label><select id="d-use">
            ${['双行', '攻击', '防御'].map(v => `<option ${v === s.usageTag ? 'selected' : ''}>${v}</option>`).join('')}
        </select></div>
        <div class="se-field"><label>六类</label><span class="se-ro">${sixInfo}</span></div>
        <div class="se-field"><label>典故主</label><input id="d-owner" list="dl-generals" value="${ownerVal}" placeholder="留空 = 通用；输入人名从名录选"></div>
        <div class="se-field"><label>档位</label>${s.family && !s.locked
            ? `<select id="d-tier"><option value="">（不改）</option>${tierOptions(s)}</select>`
            : `<span style="color:#6a6254">${s.locked ? '定稿锁定，禁改' : '该效果家族不走档位（维持现值 ' + valueLabel(s) + '）'}</span>`}</div>
        <div class="se-wearers"><b>佩戴（六槽，${s.wearers.length} 人）：</b>${s.wearers.map(w =>
            `${w.name}${w.tier === 'famous' ? '★' : ''}`).join('、') || '无人'}
            </div>
        <button class="se-btn se-btn-gold" id="d-save">保存</button>
        <div class="se-new" id="new-panel"></div>
    `;
    $('d-save').addEventListener('click', () => saveDetail(s));
    $('d-rename').addEventListener('click', () => renameSkill(s));
    $('d-close').addEventListener('click', () => closeDetail());
}

function parseOwnerInput(raw: string): { gid: string | null; name: string | null } {
    const t = raw.trim();
    if (!t) return { gid: null, name: null };
    const m = t.match(/^(.+?)\s*\(([\w]+)\)$/);
    if (m) return { gid: m[2], name: m[1].trim() };
    const hits = GENERALS.filter(g => g.name === t);
    if (hits.length === 1) return { gid: hits[0].generalId, name: hits[0].name };
    if (hits.length > 1) throw new Error(`「${t}」在册有 ${hits.length} 人（${hits.map(h => h.generalId).join(', ')}），请用下拉精确选择`);
    throw new Error(`「${t}」不在册——典故主必须是在册武将；查无此人请留空归通用`);
}

async function renameSkill(s: SkillRow): Promise<void> {
    const newName = window.prompt('新技名（四字汉语）：', s.displayName);
    if (!newName || newName === s.displayName) return;
    const body = { id: s.id, displayName: newName };
    const res = await fetch('/api/skill-editor/save', { method: 'POST', body: JSON.stringify(body) });
    const j = await res.json();
    if (!j.ok) { toast(`改名失败：${j.error}`, true); return; }
    toast(`已改名：${s.displayName} → ${newName}`);
    await load(s.id);
}

async function saveDetail(s: SkillRow): Promise<void> {
    let owner: { gid: string | null; name: string | null };
    try { owner = parseOwnerInput(($('d-owner') as HTMLInputElement).value); }
    catch (e: any) { toast(e.message, true); return; }
    const tierSel = document.getElementById('d-tier') as HTMLSelectElement | null;
    const body: Record<string, any> = {
        id: s.id,
        situationTag: ($('d-sit') as HTMLSelectElement).value,
        usageTag: ($('d-use') as HTMLSelectElement).value,
        ownerGeneralId: owner.gid,
        ownerName: owner.name,
        tierLabel: tierSel?.value || undefined,
    };
    const res = await fetch('/api/skill-editor/save', { method: 'POST', body: JSON.stringify(body) });
    const j = await res.json();
    if (!j.ok) { toast(`保存失败：${j.error}`, true); return; }
    toast(`已保存 ${s.id}${j.warnings?.length ? `；⚠ ${j.warnings.join('；')}` : ''}`, !!j.warnings?.length);
    await load(s.id);
}

function renderNewForm(): void {
    const panel = $('new-panel') as HTMLElement | null ?? (() => {
        $('detail').innerHTML = '<div class="se-new" id="new-panel"></div>';
        return $('new-panel');
    })();
    const effects = Object.keys(TIERS).length ? [
        'ally_power_mult', 'first_sortie_power_mult', 'enemy_sub_troops_opening', 'ally_add_troops_opening',
        'dual_sub_troops_opening', 'negate_enemy_skill', 'partial_negate_enemy_skill', 'steal_enemy_skill',
        'luck_variance_self', 'luck_variance_enemy', 'win_casualty_reduction', 'elite_casualty_reduction',
        'lose_enemy_casualty_boost', 'post_recovery_rate', 'battle_duration_mult',
    ] : [];
    panel.style.display = 'block';
    panel.innerHTML = `
        <h3 style="color:#d8b95e;margin:0 0 6px">新增技能（保存时全部必填项过闸）</h3>
        <div class="se-field"><label>技名(四字)</label><input id="n-name" maxlength="4"></div>
        <div class="se-field"><label>出处</label><input id="n-quote" placeholder="史料引文，引号用&quot;&quot;"></div>
        <div class="se-field"><label>效果</label><select id="n-effect">${effects.map(e => `<option>${e}</option>`).join('')}</select></div>
        <div class="se-field"><label>条件</label><select id="n-cond">${CONDITIONS.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div class="se-field"><label>三势</label><select id="n-sit"><option>优势</option><option>均势</option><option>劣势</option></select></div>
        <div class="se-field"><label>攻防</label><select id="n-use"><option>双行</option><option>攻击</option><option>防御</option></select></div>
        <div class="se-field"><label>典故主</label><input id="n-owner" list="dl-generals" placeholder="留空 = 通用"></div>
        <div class="se-field"><label>档位</label><select id="n-tier"></select></div>
        <div class="se-field"><label>备注</label><input id="n-note"></div>
        <button class="se-btn se-btn-gold" id="n-save">创建（自动分配 id）</button>
    `;
    const syncTiers = () => {
        const eff = ($('n-effect') as HTMLSelectElement).value;
        const famMap: Record<string, string> = {
            ally_power_mult: 'power', first_sortie_power_mult: 'power',
            enemy_sub_troops_opening: 'pct', ally_add_troops_opening: 'pct', dual_sub_troops_opening: 'pct',
            negate_enemy_skill: 'negate', partial_negate_enemy_skill: 'negate', steal_enemy_skill: 'steal',
            luck_variance_self: 'luck', luck_variance_enemy: 'luck',
            win_casualty_reduction: 'casualty', elite_casualty_reduction: 'casualty',
            lose_enemy_casualty_boost: 'bite', post_recovery_rate: 'recovery', battle_duration_mult: 'duration',
        };
        const fam = famMap[eff];
        ($('n-tier') as HTMLSelectElement).innerHTML =
            Object.keys(TIERS[fam] ?? {}).map(l => `<option>${l}</option>`).join('');
    };
    ($('n-effect') as HTMLSelectElement).addEventListener('change', syncTiers);
    syncTiers();
    $('n-save').addEventListener('click', async () => {
        let owner: { gid: string | null; name: string | null };
        try { owner = parseOwnerInput(($('n-owner') as HTMLInputElement).value); }
        catch (e: any) { toast(e.message, true); return; }
        const body = {
            displayName: ($('n-name') as HTMLInputElement).value.trim(),
            sourceQuote: ($('n-quote') as HTMLInputElement).value.trim(),
            baseEffect: ($('n-effect') as HTMLSelectElement).value,
            condition: ($('n-cond') as HTMLSelectElement).value,
            situationTag: ($('n-sit') as HTMLSelectElement).value,
            usageTag: ($('n-use') as HTMLSelectElement).value,
            tierLabel: ($('n-tier') as HTMLSelectElement).value,
            ownerGeneralId: owner.gid, ownerName: owner.name,
            note: ($('n-note') as HTMLInputElement).value.trim() || undefined,
        };
        const res = await fetch('/api/skill-editor/create', { method: 'POST', body: JSON.stringify(body) });
        const j = await res.json();
        if (!j.ok) { toast(`创建失败：${j.error}`, true); return; }
        toast(`已创建 ${j.id}【${body.displayName}】`);
        await load(j.id);
    });
}

// ========== 错误检查 ==========

interface CheckIssue {
    id: string; displayName: string;
    type: 'non4char' | 'noWearer' | 'noSituation' | 'noUsage' | 'noSixClass' | 'sixClassMismatch' | 'duplicateSixClass' | 'tooManySkills' | 'duplicateName' | 'generalSixIncomplete' | 'orphanOwner' | 'missingOwnerGid' | 'pendingOwner' | 'invalidOwnerGid';
    msg: string;
    /** error=硬错误；warn=可保留史料、待挂将等 */
    severity: 'error' | 'warn';
}

function runErrorCheck(): void {
    const issues: CheckIssue[] = [];
    const gidSet = new Set(GENERALS.map(g => g.generalId));

    // ── 典故主：史料名可保留；无 ID = 待挂将（警告，不删）；ID 非法才报错 ──
    for (const s of SKILLS) {
        if (!s.ownerName && !s.ownerGeneralId) continue;
        if (s.ownerGeneralId) {
            if (!gidSet.has(s.ownerGeneralId)) {
                issues.push({
                    id: s.id, displayName: s.displayName, type: 'invalidOwnerGid', severity: 'error',
                    msg: `典故主 ID「${s.ownerGeneralId}」不在册（${s.ownerName ?? '无写名'}），须改绑合法 generalId`,
                });
            }
            continue;
        }
        // 仅有史料名、尚未挂将 → 警告（勿清空 ownerName）
        if (s.ownerName) {
            issues.push({
                id: s.id, displayName: s.displayName, type: 'pendingOwner', severity: 'warn',
                msg: `史料典故主「${s.ownerName}」待挂将（暂作通用技；立将后补 ownerGeneralId，勿删此名）`,
            });
        }
    }

    for (const s of SKILLS) {
        if (s.displayName.length !== 4) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'non4char', severity: 'error', msg: `技名「${s.displayName}」不是四字（${s.displayName.length}字）` });
        }
        if (s.wearers.length === 0) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'noWearer', severity: 'warn', msg: '在役但无任何武将佩戴' });
        }
        if (!s.situationTag || !['优势', '均势', '劣势'].includes(s.situationTag)) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'noSituation', severity: 'error', msg: `三势标签缺失或异常（当前：${s.situationTag || '空'}）` });
        }
        if (!s.usageTag || !['攻击', '防御', '双行'].includes(s.usageTag)) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'noUsage', severity: 'error', msg: `攻防标签缺失或异常（当前：${s.usageTag || '空'}）` });
        }
        if (!s.sixClass) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'noSixClass', severity: 'error', msg: `baseEffect「${s.baseEffect}」无法归入六类——效果类型不在已知映射中` });
        }
        if (s.sixClass && !s.sixClassMatch) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'sixClassMismatch', severity: 'warn', msg: `六类=${s.sixClass} 但三势=${s.situationTag}（规范值应为${s.sixClass ? getCanonicalSit(s.sixClass) : '?'}），效果与三势不匹配` });
        }
    }

    // ── 同典故主六类去重（按重复数降序）──
    const ownerGroups = new Map<string, { id: string; displayName: string; sixClass: string }[]>();
    for (const s of SKILLS) {
        if (!s.ownerName || !s.sixClass) continue;
        const group = ownerGroups.get(s.ownerName) ?? [];
        group.push({ id: s.id, displayName: s.displayName, sixClass: s.sixClass });
        ownerGroups.set(s.ownerName, group);
    }
    // ── 典故主级汇总问题（放错误面板顶部，不逐技展开）──
    interface OwnerIssue { owner: string; skillCount: number; type: 'tooManySkills' | 'duplicateSixClass'; msg: string; dupClass?: string; dupIds?: string; }
    const ownerIssues: OwnerIssue[] = [];

    // 典故主六类重复（按重复数降序，每 owner+class 一条）
    for (const [owner, skills] of ownerGroups) {
        if (skills.length < 2) continue;
        const seen = new Map<string, string[]>(); // sixClass → [ids]
        for (const sk of skills) {
            const ids = seen.get(sk.sixClass) ?? [];
            ids.push(sk.id);
            seen.set(sk.sixClass, ids);
        }
        for (const [sixClass, ids] of seen) {
            if (ids.length < 2) continue;
            ownerIssues.push({
                owner, skillCount: skills.length, type: 'duplicateSixClass',
                msg: `典故主「${owner}」的 ${ids.length} 个技六类同为「${sixClass}」（${ids.join('、')}），同一典故主各技六类不得重复`,
                dupClass: sixClass, dupIds: ids.join('、'),
            });
        }
    }

    // 典故主超 6 技（按技能数降序，每 owner 一条）
    const sortedOwners = [...ownerGroups.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [owner, skills] of sortedOwners) {
        if (skills.length <= 6) continue;
        ownerIssues.push({
            owner, skillCount: skills.length, type: 'tooManySkills',
            msg: `典故主「${owner}」共有 ${skills.length} 个技（六类只有 6 种，超 6 必重复），需核查归属或分摊`,
        });
    }
    // 按严重程度排序：超6技优先（按技能数降序），再排六类重复（按重复数降序）
    ownerIssues.sort((a, b) => {
        const order = { tooManySkills: 0, duplicateSixClass: 1 };
        if (order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
        return b.skillCount - a.skillCount;
    });

    // ── 技名重复 ──
    const nameGroups = new Map<string, string[]>();
    for (const s of SKILLS) {
        const ids = nameGroups.get(s.displayName) ?? [];
        ids.push(s.id);
        nameGroups.set(s.displayName, ids);
    }

    for (const [name, ids] of nameGroups) {
        if (ids.length < 2) continue;
        for (const sid of ids) {
            const s = SKILLS.find(x => x.id === sid)!;
            issues.push({
                id: s.id, displayName: s.displayName, type: 'duplicateName', severity: 'error',
                msg: `技名「${name}」重复（${ids.join('、')}），同名技不得存在`,
            });
        }
    }

    // ── 武将六计不齐（从佩戴反查：每将六槽应覆盖攻/胜/敌/混/并/败各一，与 batch-manager 同口径）──
    {
        const genSix = new Map<string, string[]>(); // gid → 所佩戴技的六计
        for (const s of SKILLS) {
            if (!s.sixClass) continue;
            for (const w of s.wearers) {
                (genSix.get(w.gid) ?? genSix.set(w.gid, []).get(w.gid)!).push(s.sixClass);
            }
        }
        const ALL_SIX = ['攻战计', '胜战计', '敌战计', '混战计', '并战计', '败战计'];
        for (const g of GENERALS) {
            const six = genSix.get(g.generalId) ?? [];
            const cnt: Record<string, number> = {};
            for (const c of six) cnt[c] = (cnt[c] ?? 0) + 1;
            const missing = ALL_SIX.filter(c => !cnt[c]);
            const dup = Object.entries(cnt).filter(([, n]) => n > 1).map(([c, n]) => c + '×' + n);
            if (missing.length || dup.length) {
                const parts: string[] = [];
                if (missing.length) parts.push('缺' + missing.join('/'));
                if (dup.length) parts.push('重' + dup.join('/'));
                issues.push({
                    id: g.generalId, displayName: g.name, type: 'generalSixIncomplete', severity: 'warn',
                    msg: `武将「${g.name}」六计不齐：${parts.join('，')}（六槽应攻/胜/敌/混/并/败各一）`,
                });
            }
        }
    }

    const counts: Record<string, number> = {
        non4char: 0, noWearer: 0, orphanOwner: 0, missingOwnerGid: 0, pendingOwner: 0, invalidOwnerGid: 0,
        noSituation: 0, noUsage: 0, noSixClass: 0, sixClassMismatch: 0, duplicateSixClass: 0, tooManySkills: 0,
        duplicateName: 0, generalSixIncomplete: 0, total: issues.length,
    };
    for (const i of issues) counts[i.type]++;
    for (const oi of ownerIssues) counts[oi.type]++;

    const errN = issues.filter(i => i.severity === 'error').length;
    const warnN = issues.filter(i => i.severity === 'warn').length;

    const typeLabel: Record<string, string> = {
        pendingOwner: '史料待挂将', invalidOwnerGid: '典故主ID非法',
        missingOwnerGid: '缺武将ID', orphanOwner: '典故主不在册',
        non4char: '非四字技名', noWearer: '无佩戴', noSituation: '三势缺失', noUsage: '攻防缺失',
        noSixClass: '六类未标', sixClassMismatch: '三势跨类', duplicateSixClass: '典故主六类重复',
        tooManySkills: '典故主超6技', duplicateName: '技名重复', generalSixIncomplete: '武将六计不齐',
    };
    const HARD_TYPES = new Set(['duplicateName', 'duplicateSixClass', 'non4char', 'noSituation', 'noUsage', 'noSixClass', 'invalidOwnerGid']);
    const summaryHtml = Object.entries(typeLabel).map(([k, label]) => {
        const n = counts[k] ?? 0;
        if (k === 'missingOwnerGid' || k === 'orphanOwner') return ''; // 已由 pendingOwner / invalidOwnerGid 取代
        const cls = n === 0 ? 'se-err-ok' : (HARD_TYPES.has(k) ? 'se-err-red' : 'se-err-warn');
        return `<span class="se-err-count ${cls}">${label}: ${n}</span>`;
    }).filter(Boolean).join('');

    // ── 典故主级汇总（放在表格下方，不逐技展开）──
    const ownerSummaryHtml = ownerIssues.length > 0 ? `
        <div class="se-owner-summary">
            <div class="se-owner-summary-hd">📋 典故主问题（${ownerIssues.length} 项）</div>
            ${ownerIssues.map(oi => `
                <div class="se-owner-item">
                    <span class="se-owner-tag se-owner-tag-${oi.type === 'tooManySkills' ? 'over' : 'dup'}">${typeLabel[oi.type]}</span>
                    <span class="se-owner-msg">${oi.msg}</span>
                    <button class="se-copy-btn se-copy-owner" data-msg="${oi.msg.replace(/"/g, '&quot;')}" title="复制此项">📋</button>
                </div>`).join('')}
        </div>` : '';

    const tableIssues = issues.filter(i => i.type !== 'tooManySkills' && i.type !== 'duplicateSixClass');
    // 警告默认折叠列出：仍全部显示，但硬错误排前
    tableIssues.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1));
    const hasIssues = tableIssues.length > 0;

    const modal = document.createElement('div');
    modal.className = 'se-modal-bg';
    modal.innerHTML = `
        <div class="se-modal">
            <div class="se-modal-hd">
                <h3>错误检查</h3>
                <span style="color:#8a8271">硬错误 ${errN} · 警告 ${warnN} · 典故主汇总 ${ownerIssues.length}</span>
                <button class="se-btn" id="modal-close" style="margin-left:auto">✕</button>
            </div>
            <div class="se-modal-body">
                <div class="se-summary">${summaryHtml}</div>
                ${hasIssues ? `
                <table><thead><tr><th>id</th><th>技名</th><th>级别</th><th>类型</th><th>详情</th></tr></thead><tbody>
                    ${tableIssues.map(i => `
                        <tr class="se-issue-row${i.severity === 'warn' ? ' se-issue-warn' : ''}" data-id="${i.id}" style="cursor:pointer">
                            <td class="se-mono">${i.id}</td>
                            <td>${i.displayName}</td>
                            <td>${i.severity === 'error' ? '错误' : '警告'}</td>
                            <td>${typeLabel[i.type] ?? i.type}</td>
                            <td>${i.msg} <button class="se-copy-btn se-copy-issue" data-id="${i.id}" data-msg="${i.msg.replace(/"/g, '&quot;')}" title="复制此行">📋</button></td>
                        </tr>`).join('')}
                </tbody></table>` : ''}
                ${ownerSummaryHtml}
                ${!hasIssues && ownerIssues.length > 0 ? '<p style="color:#8a9a78;margin-top:12px">✅ 逐技检查无其他硬错误（上方为典故主汇总）</p>' : ''}
                ${!hasIssues && ownerIssues.length === 0 ? '<p style="color:#8a9a78">✅ 无错误</p>' : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const modalBox = modal.querySelector('.se-modal') as HTMLElement;
    modalBox.addEventListener('click', (e) => { e.stopPropagation(); });
    ($('modal-close') as HTMLElement).addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if ((e.target as HTMLElement) === modal) modal.remove();
    });
    for (const btn of modal.querySelectorAll('.se-copy-issue')) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const msg = decodeURIComponent((btn as HTMLElement).dataset.msg!.replace(/&quot;/g, '"'));
            const id = (btn as HTMLElement).dataset.id!;
            navigator.clipboard.writeText(`${id}\t${msg}`).then(() => toast(`已复制：${id}`));
        });
    }
    for (const btn of modal.querySelectorAll('.se-copy-owner')) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const msg = decodeURIComponent((btn as HTMLElement).dataset.msg!.replace(/&quot;/g, '"'));
            navigator.clipboard.writeText(msg).then(() => toast('已复制典故主问题'));
        });
    }
    for (const row of modal.querySelectorAll('.se-issue-row')) {
        row.addEventListener('click', () => {
            selectedId = (row as HTMLElement).dataset.id!;
            renderList(); renderDetail();
            modal.remove();
        });
    }
}

async function load(selectId?: string): Promise<void> {
    const data = await (await fetch('/api/skill-editor/list')).json();
    SKILLS = data.skills;
    GENERALS = data.generals;
    TIERS = data.tiers;
    CONDITIONS = data.conditions;
    ($('dl-generals') as HTMLElement).innerHTML = GENERALS.map(g => `<option>${g.name} (${g.generalId})</option>`).join('');
    if (selectId && SKILLS.find(s => s.id === selectId)) selectedId = selectId;
    else if (selectedId && !SKILLS.find(s => s.id === selectedId)) selectedId = null;
    renderList();
    if (selectedId) renderDetail();
}

// Global for error check
function getCanonicalSit(sixClass: string): string {
    const map: Record<string, string> = {
        '攻战计': '优势', '胜战计': '优势',
        '敌战计': '均势', '混战计': '均势',
        '并战计': '劣势', '败战计': '劣势',
    };
    return map[sixClass] ?? '?';
}
(window as any).getCanonicalSit = getCanonicalSit;

$('btn-refresh').addEventListener('click', () => load());
$('btn-check').addEventListener('click', () => runErrorCheck());
let sixSlotData: any[] = [];
let sixSlotSortKey: string | null = null;
let sixSlotSortDir: 1 | -1 = 1;

async function loadSixSlotData() {
    const [listRes, profilesText] = await Promise.all([
        fetch('/api/skill-editor/list'),
        fetch('/api/skill-editor/profiles'),
    ]);
    const data = await listRes.json();
    const profilesData = await profilesText.json();
    const skills = data.skills;
    const generals = data.generals;
    const gidToName: Record<string,string> = {};
    for (const g of generals) gidToName[g.generalId] = g.name;
    const skillMap: Record<string, {displayName:string, baseEffect:string, condition:string, sixClass:string, ownerName:string|null}> = {};
    const SIX: Record<string,string> = {'ally_power_mult':'攻战计','first_sortie_power_mult':'攻战计','enemy_sub_troops_opening':'胜战计','dual_sub_troops_opening':'胜战计','ally_add_troops_opening':'混战计','luck_variance_self':'敌战计','luck_variance_enemy':'敌战计','luck_lock_self':'敌战计','negate_enemy_skill':'混战计','partial_negate_enemy_skill':'混战计','steal_enemy_skill':'混战计','nullify_enemy_opening_cut':'混战计','reflect_enemy_opening_cut':'混战计','cancel_enemy_terrain_buff':'混战计','win_casualty_reduction':'并战计','elite_casualty_reduction':'并战计','lose_enemy_casualty_boost':'败战计','post_recovery_rate':'败战计','recompute_comeback':'败战计','lose_zero_enemy_recovery':'败战计','ally_add_troops_comeback':'败战计','battle_duration_mult':'败战计'};
    const UD=new Set(['ratio_underdog','self_troops_below_enemy_pct','side_comeback','lose_as_underdog']);
    const VE=new Set(['luck_variance_self','luck_lock_self','recompute_comeback']);
    for (const s of skills) {
        let sc = SIX[s.baseEffect] || '';
        if (UD.has(s.condition||'') || VE.has(s.baseEffect)) sc = '败战计';
        skillMap[s.id] = {displayName:s.displayName, baseEffect:s.baseEffect, condition:s.condition||'', sixClass:sc, ownerName:s.ownerName};
    }
    const ALL_SLOTS=['atkAdvantageSkillId','atkBalanceSkillId','atkDisadvantageSkillId','defAdvantageSkillId','defBalanceSkillId','defDisadvantageSkillId'];
    sixSlotData = [];
    for (const g of generals) {
        const prof = profilesData[g.generalId];
        if (!prof) continue;
        const row: any = { gid: g.generalId, name: g.name, tier: g.tier, slots: {} };
        for (const sn of ALL_SLOTS) {
            const sid = prof[sn];
            if (sid && skillMap[sid]) {
                row.slots[sn] = { id: sid, name: skillMap[sid].displayName, sixClass: skillMap[sid].sixClass, isPersonal: !!skillMap[sid].ownerName };
            }
        }
        sixSlotData.push(row);
    }
}

function renderSixSlotPanel() {
    if (sixSlotData.length === 0) { loadSixSlotData().then(() => renderSixSlotPanel()); return; }
    const ALL_SLOTS = ['atkAdvantageSkillId','atkBalanceSkillId','atkDisadvantageSkillId','defAdvantageSkillId','defBalanceSkillId','defDisadvantageSkillId'];
    const SLOT_LABEL: Record<string,string> = {'atkAdvantageSkillId':'攻优','atkBalanceSkillId':'攻均','atkDisadvantageSkillId':'攻劣','defAdvantageSkillId':'防优','defBalanceSkillId':'防均','defDisadvantageSkillId':'防劣'};
    const SIX_COLORS: Record<string,string> = {'攻战计':'#d85040','胜战计':'#d89030','敌战计':'#4088d8','混战计':'#60a860','并战计':'#b070c0','败战计':'#888888'};
    const ALL_SIX=['攻战计','胜战计','敌战计','混战计','并战计','败战计'];

    let rows = sixSlotData;
    let issues=0, complete=0;
    for (const r of rows) {
        const got: string[] = [];
        for (const sn of ALL_SLOTS) {
            const s = r.slots[sn];
            if (s) got.push(s.sixClass);
        }
        const cnt: Record<string,number>={};
        for (const c of got) cnt[c]=(cnt[c]||0)+1;
        r.missing = ALL_SIX.filter(c => !cnt[c]);
        r.dup = Object.entries(cnt).filter(e => e[1]>1).map(e => e[0]);
        r.hasIssue = r.missing.length>0 || r.dup.length>0;
        if (r.hasIssue) issues++; else complete++;
    }

    // Sort
    if (sixSlotSortKey) {
        rows.sort((a,b) => {
            const va = sixSlotSortKey==='name' ? a.name : sixSlotSortKey==='issues' ? (a.hasIssue?0:1) : '';
            const vb = sixSlotSortKey==='name' ? b.name : sixSlotSortKey==='issues' ? (b.hasIssue?0:1) : '';
            return String(va).localeCompare(String(vb),'zh') * sixSlotSortDir;
        });
    }

    const q = ($('f-six-search') as HTMLInputElement).value.trim().toLowerCase();
    if (q) rows = rows.filter(r => r.name.includes(q) || r.gid.includes(q));

    const modal = document.createElement('div');
    modal.className = 'se-modal-bg';
    modal.innerHTML = `
        <div class="se-modal" style="width:95%;max-width:1200px">
            <div class="se-modal-hd">
                <h3>⚔ 六槽管理 <span style="color:#8a8271;font-size:13px">${rows.length}将 · ${issues}⚠ · ${complete}✅</span></h3>
                <input id="f-six-search" placeholder="搜武将名" style="background:#0e0d0c;color:#e8e0d0;border:1px solid #4a4234;padding:4px 8px;width:150px" value="${q}">
                <button class="se-btn se-btn-gold" id="btn-six-fix">🛠 一键修复</button>
                <button class="se-btn" id="modal-close-six" style="margin-left:auto">✕</button>
            </div>
            <div class="se-modal-body" style="overflow:auto;max-height:75vh">
                <table><thead><tr>
                    <th class="se-sortable" data-sort="name">武将</th>
                    <th>T</th>
                    ${ALL_SLOTS.map(sn => `<th>${SLOT_LABEL[sn]}</th>`).join('')}
                    <th>六计</th>
                </tr></thead><tbody>
                ${rows.map(r => {
                    const got: string[] = [];
                    const cells = ALL_SLOTS.map(sn => {
                        const s = r.slots[sn];
                        if (!s) return '<td style="color:#5a3a3a">空</td>';
                        got.push(s.sixClass);
                        const color = SIX_COLORS[s.sixClass] || '#888';
                        return `<td style="color:${color};font-size:12px" title="${s.id} ${s.name} ${s.sixClass}">${s.name}</td>`;
                    });
                    const cnt: Record<string,number>={};
                    for (const c of got) cnt[c]=(cnt[c]||0)+1;
                    const missing = ALL_SIX.filter(c => !cnt[c]);
                    const dup = Object.entries(cnt).filter(e => e[1]>1).map(e => e[0]);
                    let status = '';
                    if (missing.length&&dup.length) status='<span style="color:#e86040">缺'+missing.join('/')+' 重'+dup.join('×'+dup.length)+'</span>';
                    else if (missing.length) status='<span style="color:#d89030">缺'+missing.join('/')+'</span>';
                    else if (dup.length) status='<span style="color:#d89030">重'+dup.join('/')+'</span>';
                    else status='<span style="color:#60a860">✅</span>';
                    return `<tr class="${r.hasIssue?'se-issue-row':''}" style="${r.hasIssue?'':'opacity:0.6'}">
                        <td>${r.name}</td><td>${r.tier==='famous'?'★':''}</td>
                        ${cells.join('')}<td>${status}</td>
                    </tr>`;
                }).join('')}
                </tbody></table>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const modalBox = modal.querySelector('.se-modal') as HTMLElement;
    modalBox.addEventListener('click', (e) => { e.stopPropagation(); });
    ($('modal-close-six') as HTMLElement).addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if ((e.target as HTMLElement) === modal) modal.remove();
    });
    ($('f-six-search') as HTMLElement).addEventListener('input', () => { modal.remove(); renderSixSlotPanel(); });
    ($('btn-six-fix') as HTMLElement).addEventListener('click', async () => {
        toast('正在修复…');
        const res = await fetch('/api/skill-editor/fix-six-slots', { method: 'POST' });
        const j = await res.json();
        toast(j.ok ? '修复完成' : '修复失败: '+j.error, !j.ok);
        modal.remove();
        renderSixSlotPanel();
    });
}

$('btn-six').addEventListener('click', () => window.open('/six-slot.html', '_blank'));
$('btn-export').addEventListener('click', () => exportDoc());

// ========== 导出文档（Markdown）==========
function exportDoc(): void {
    const SIX_ORD: Record<string, number> = { '攻战计': 0, '胜战计': 1, '敌战计': 2, '混战计': 3, '并战计': 4, '败战计': 5 };
    const inReg = new Set(GENERALS.map(g => g.name));
    const act = SKILLS.filter(s => (s as any).status !== 'retired');

    // 按典故主聚合
    const byOwner = new Map<string, SkillRow[]>();
    const generic: SkillRow[] = [];
    for (const s of act) {
        if (s.ownerName) { (byOwner.get(s.ownerName) ?? byOwner.set(s.ownerName, []).get(s.ownerName)!).push(s); }
        else generic.push(s);
    }
    // 统计
    let dupOwners = 0, orphanOwners = 0;
    for (const [owner, list] of byOwner) {
        const cnt: Record<string, number> = {};
        for (const s of list) cnt[s.sixClass] = (cnt[s.sixClass] ?? 0) + 1;
        if (Object.values(cnt).some(n => n > 1)) dupOwners++;
        if (!inReg.has(owner)) orphanOwners++;
    }
    const fmtSkill = (s: SkillRow) => `${s.sixClass || '—'}｜${s.displayName}｜${s.situationTag}/${s.usageTag}｜${s.baseEffect}` +
        (s.sourceQuote ? `｜${s.sourceQuote}` : '');

    const L: string[] = [];
    L.push('# 武将技·典故主与六计一览');
    L.push('');
    L.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}`);
    L.push(`> 技能总数 ${act.length}｜典故主 ${byOwner.size} 位｜通用技 ${generic.length} 条`);
    L.push(`> 六计重复的典故主：**${dupOwners}** 位（0 = 全部符合"一将六计各异"）`);
    L.push(`> 游戏未收录、待日后挂将的典故主：**${orphanOwners}** 种（史料名已保留）`);
    L.push('');
    L.push('---');
    L.push('');

    // 一、在册武将（按名字排；每人列其六计分布 + 各技）
    const regOwners = [...byOwner.keys()].filter(o => inReg.has(o)).sort((a, b) => a.localeCompare(b, 'zh'));
    L.push(`## 一、在册武将（${regOwners.length} 位）`);
    L.push('');
    for (const owner of regOwners) {
        const list = byOwner.get(owner)!.slice().sort((a, b) => (SIX_ORD[a.sixClass] ?? 9) - (SIX_ORD[b.sixClass] ?? 9));
        const six = [...new Set(list.map(s => s.sixClass))].sort((a, b) => (SIX_ORD[a] ?? 9) - (SIX_ORD[b] ?? 9)).join('/');
        const cnt: Record<string, number> = {};
        for (const s of list) cnt[s.sixClass] = (cnt[s.sixClass] ?? 0) + 1;
        const dup = Object.values(cnt).some(n => n > 1);
        L.push(`### ${owner}${dup ? ' ⚠六计重复' : ''}  〔${six}〕`);
        for (const s of list) L.push(`- ${fmtSkill(s)}`);
        L.push('');
    }

    // 二、孤儿典故主（游戏没这个人）
    const orphans = [...byOwner.keys()].filter(o => !inReg.has(o)).sort((a, b) => byOwner.get(b)!.length - byOwner.get(a)!.length);
    if (orphans.length) {
        L.push('---');
        L.push('');
        L.push(`## 二、待处理·孤儿典故主（${orphans.length} 种，游戏未收录此人/多人标签/非武将，宜改通用或还给正主）`);
        L.push('');
        for (const owner of orphans) {
            const list = byOwner.get(owner)!;
            L.push(`- **${owner}**${owner.includes('/') ? '（多人假标签）' : ''} ×${list.length}：${list.map(s => s.displayName + '(' + s.sixClass + ')').join('、')}`);
        }
        L.push('');
    }

    // 三、通用技（按六计分组）
    L.push('---');
    L.push('');
    L.push(`## 三、通用技（${generic.length} 条，无典故主，共享）`);
    L.push('');
    const bySix = new Map<string, SkillRow[]>();
    for (const s of generic) (bySix.get(s.sixClass) ?? bySix.set(s.sixClass, []).get(s.sixClass)!).push(s);
    for (const six of Object.keys(SIX_ORD)) {
        const list = bySix.get(six);
        if (!list?.length) continue;
        L.push(`### ${six}（${list.length}）`);
        L.push(list.map(s => s.displayName).join('、'));
        L.push('');
    }

    // 下载
    const blob = new Blob([L.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `武将技-典故主六计一览-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(`已导出文档：${act.length} 技 / ${byOwner.size} 典故主`);
}
$('btn-new').addEventListener('click', () => { selectedId = null; setDetailOpen(true); renderNewForm(); });
$('list-body').addEventListener('dblclick', (e) => {
    const tr = (e.target as HTMLElement).closest('tr');
    if (!tr) return;
    selectedId = (tr as HTMLElement).dataset.id!;
    renderList();
    renderDetail();
});

// 列头排序
for (const th of document.querySelectorAll('.se-sortable')) {
    th.addEventListener('click', () => {
        const k = (th as HTMLElement).dataset.sort!;
        if (sortKey === k) sortDir = sortDir === 1 ? -1 : 1;
        else { sortKey = k; sortDir = 1; }
        renderList();
    });
}

// 筛选器实时刷新
for (const id of ['f-search', 'f-sit', 'f-use', 'f-six', 'f-wear', 'f-owner']) {
    $(id).addEventListener('input', () => { renderList(); if (!selectedId) setDetailOpen(false); });
    $(id).addEventListener('change', () => { renderList(); if (!selectedId) setDetailOpen(false); });
}

// 拖拽面板宽
const splitter = $('splitter');
splitter.addEventListener('mousedown', (e) => {
    e.preventDefault();
    splitter.classList.add('dragging');
    const onMove = (ev: MouseEvent) => {
        const detail = $('detail');
        if (!detail || detail.classList.contains('se-closed')) return;
        const w = document.body.clientWidth - ev.clientX;
        detail.style.width = `${Math.max(280, Math.min(w, document.body.clientWidth * 0.7))}px`;
    };
    const onUp = () => {
        splitter.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
});

load();
