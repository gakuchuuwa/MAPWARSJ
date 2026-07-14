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
    .se-summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
</style>
<div class="se-header">
    <span class="se-title">武将技编辑器</span>
    <input id="f-search" placeholder="搜技名 / id / 典故主" style="width:180px">
    <select id="f-sit"><option value="">三势·全部</option><option>优势</option><option>均势</option><option>劣势</option></select>
    <select id="f-use"><option value="">攻防·全部</option><option>攻击</option><option>防御</option><option>双行</option></select>
    <select id="f-six"><option value="">六类·全部</option><option value="攻战计">攻战计</option><option value="胜战计">胜战计</option><option value="敌战计">敌战计</option><option value="混战计">混战计</option><option value="并战计">并战计</option><option value="败战计">败战计</option><option value="(空)">未标六类</option><option value="(x)">三势跨类</option></select>
    <select id="f-ex"><option value="">归属·全部</option><option>专用</option><option>通行</option></select>
    <select id="f-wear">
        <option value="">佩戴·全部</option>
        <option value="none">无人佩戴</option>
        <option value="stray">戴错人（专属被外人戴）</option>
        <option value="orphanOwner">典故主未佩戴</option>
    </select>
    <button class="se-btn se-btn-gold" id="btn-new">＋ 新增技能</button>
    <button class="se-btn se-btn-red" id="btn-check">🔍 检查错误</button>
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
    if (s.wearers.length === 0) return 'none';
    if (s.ownerGeneralId) {
        const stray = s.wearers.some(w => w.gid !== s.ownerGeneralId);
        const ownerHas = s.wearers.some(w => w.gid === s.ownerGeneralId);
        if (stray) return 'stray';
        if (!ownerHas) return 'orphanOwner';
    } else if (s.ownerName) {
        const ownerHas = s.wearers.some(w => w.name === s.ownerName);
        if (!ownerHas) return 'orphanOwner';
    }
    return '';
}

function applyFilters(): SkillRow[] {
    const q = ($('f-search') as HTMLInputElement).value.trim();
    const sit = ($('f-sit') as HTMLSelectElement).value;
    const use = ($('f-use') as HTMLSelectElement).value;
    const six = ($('f-six') as HTMLSelectElement).value;
    const ex = ($('f-ex') as HTMLSelectElement).value;
    const wear = ($('f-wear') as HTMLSelectElement).value;
    return SKILLS.filter(s => {
        if (q && !(s.id.includes(q) || s.displayName.includes(q) || (s.ownerName ?? '').includes(q))) return false;
        if (sit && s.situationTag !== sit) return false;
        if (use && s.usageTag !== use) return false;
        if (six === '(空)' && s.sixClass) return false;
        if (six === '(x)' && s.sixClassMatch) return false;
        if (six && six !== '(空)' && six !== '(x)' && s.sixClass !== six) return false;
        if (ex && s.exclusive !== ex) return false;
        if (wear && wearProblem(s) !== wear) return false;
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
            <td>${s.ownerName ?? '<span style="color:#6a6254">通用</span>'}${s.ownerSource ? srcBadge(s.ownerSource) : ''}</td>
            <td class="se-mono">${valueLabel(s)}</td>
            <td>${s.wearers.length}${wearProblem(s) === 'stray' ? ' ⚠' : wearProblem(s) === 'orphanOwner' ? ' ✂' : s.wearers.length === 0 ? ' ∅' : ''}</td>
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
    const ownerVal = s.ownerName ? `${s.ownerName} (${s.ownerGeneralId ?? '?'})` : '';
    const sixInfo = s.sixClass
        ? `${s.sixClass}${s.sixClassMatch ? '' : ' ⚠ 三势与规范值不匹配'}`
        : '⚠ 未知效果类型，无法归类';
    $('detail').innerHTML = `
        <div class="se-detail-hd">
            <h3>${s.displayName} <span class="se-mono">${s.id}</span>${s.locked ? ' 🔒锁定值' : ''}</h3>
            <button type="button" class="se-btn" id="d-close" title="关闭右侧编辑">✕</button>
        </div>
        <div class="se-quote">${s.sourceQuote || '（无出处）'}</div>
        <div class="se-mono">effect=${s.baseEffect} · cond=${s.condition} · phase=${s.phase} · ${s.engineStatus}</div>
        ${s.note ? `<div class="se-quote">note: ${s.note}</div>` : ''}
        <hr style="border-color:#3a3226">
        <div class="se-field"><label>三势</label><select id="d-sit">
            ${['优势', '均势', '劣势'].map(v => `<option ${v === s.situationTag ? 'selected' : ''}>${v}</option>`).join('')}
        </select> ${srcBadge(s.situationSource)}</div>
        <div class="se-field"><label>攻防</label><select id="d-use">
            ${['双行', '攻击', '防御'].map(v => `<option ${v === s.usageTag ? 'selected' : ''}>${v}</option>`).join('')}
        </select></div>
        <div class="se-field"><label>六类</label><span class="se-ro">${sixInfo}</span></div>
        <div class="se-field"><label>典故主</label><input id="d-owner" list="dl-generals" value="${ownerVal}" placeholder="留空 = 通用；输入人名从名录选"></div>
        <div class="se-field"><label>档位</label>${s.family && !s.locked
            ? `<select id="d-tier"><option value="">（不改）</option>${tierOptions(s)}</select>`
            : `<span style="color:#6a6254">${s.locked ? '定稿锁定，禁改' : '该效果家族不走档位（维持现值 ' + valueLabel(s) + '）'}</span>`}</div>
        <div class="se-wearers"><b>佩戴（六槽，${s.wearers.length} 人）：</b>${s.wearers.map(w =>
            `${w.name}${w.tier === 'famous' ? '★' : ''}${s.ownerGeneralId && w.gid !== s.ownerGeneralId ? '⚠' : ''}`).join('、') || '无人'}
            ${s.ownerGeneralId && !s.wearers.some(w => w.gid === s.ownerGeneralId) ? '<div style="color:#d8a05e">✂ 典故主本人未佩戴</div>' : ''}</div>
        <button class="se-btn se-btn-gold" id="d-save">保存</button>
        <div class="se-new" id="new-panel"></div>
    `;
    $('d-save').addEventListener('click', () => saveDetail(s));
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
    type: 'non4char' | 'noWearer' | 'noSituation' | 'noUsage' | 'noSixClass' | 'sixClassMismatch' | 'duplicateSixClass' | 'tooManySkills' | 'duplicateName';
    msg: string;
}

function runErrorCheck(): void {
    const issues: CheckIssue[] = [];
    for (const s of SKILLS) {
        if (s.displayName.length !== 4) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'non4char', msg: `技名「${s.displayName}」不是四字（${s.displayName.length}字）` });
        }
        if (s.wearers.length === 0) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'noWearer', msg: '在役但无任何武将佩戴' });
        }
        if (!s.situationTag || !['优势', '均势', '劣势'].includes(s.situationTag)) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'noSituation', msg: `三势标签缺失或异常（当前：${s.situationTag || '空'}）` });
        }
        if (!s.usageTag || !['攻击', '防御', '双行'].includes(s.usageTag)) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'noUsage', msg: `攻防标签缺失或异常（当前：${s.usageTag || '空'}）` });
        }
        if (!s.sixClass) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'noSixClass', msg: `baseEffect「${s.baseEffect}」无法归入六类——效果类型不在已知映射中` });
        }
        if (s.sixClass && !s.sixClassMatch) {
            issues.push({ id: s.id, displayName: s.displayName, type: 'sixClassMismatch', msg: `六类=${s.sixClass} 但三势=${s.situationTag}（规范值应为${s.sixClass ? getCanonicalSit(s.sixClass) : '?'}），效果与三势不匹配` });
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
    const dupIssues: CheckIssue[] = [];
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
            for (const sid of ids) {
                const sk = skills.find(x => x.id === sid)!;
                dupIssues.push({
                    id: sk.id, displayName: sk.displayName, type: 'duplicateSixClass',
                    msg: `典故主「${owner}」的 ${ids.length} 个技六类同为「${sixClass}」（${ids.join('、')}），同一典故主各技六类不得重复`,
                });
            }
        }
    }
    dupIssues.sort((a, b) => {
        const na = parseInt(a.msg.match(/的 (\d+) 个技/)![1]);
        const nb = parseInt(b.msg.match(/的 (\d+) 个技/)![1]);
        return nb - na;
    });
    for (const di of dupIssues) issues.push(di);

    // ── 典故主超 6 技（按技能数降序）──
    const sortedOwners = [...ownerGroups.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [owner, skills] of sortedOwners) {
        if (skills.length <= 6) continue;
        for (const sk of skills) {
            issues.push({
                id: sk.id, displayName: sk.displayName, type: 'tooManySkills',
                msg: `典故主「${owner}」共有 ${skills.length} 个技（六类只有 6 种，超 6 必重复），需核查归属或分摊`,
            });
        }
    }

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
                id: s.id, displayName: s.displayName, type: 'duplicateName',
                msg: `技名「${name}」重复（${ids.join('、')}），同名技不得存在`,
            });
        }
    }

    const counts: Record<string, number> = { non4char: 0, noWearer: 0, noSituation: 0, noUsage: 0, noSixClass: 0, sixClassMismatch: 0, duplicateSixClass: 0, tooManySkills: 0, duplicateName: 0, total: issues.length };
    for (const i of issues) counts[i.type]++;

    const typeLabel: Record<string, string> = {
        non4char: '非四字技名', noWearer: '无佩戴', noSituation: '三势缺失', noUsage: '攻防缺失',
        noSixClass: '六类未标', sixClassMismatch: '三势跨类', duplicateSixClass: '典故主六类重复',
        tooManySkills: '典故主超6技', duplicateName: '技名重复',
    };
    const summaryHtml = Object.entries(typeLabel).map(([k, label]) => {
        const n = counts[k] ?? 0;
        const cls = n > 0 ? (k === 'duplicateName' || k === 'duplicateSixClass' ? 'se-err-red' : 'se-err-warn') : 'se-err-ok';
        return `<span class="se-err-count ${cls}">${label}: ${n}</span>`;
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'se-modal-bg';
    modal.innerHTML = `
        <div class="se-modal">
            <div class="se-modal-hd">
                <h3>错误检查</h3>
                <span style="color:#8a8271">共 ${issues.length} 条</span>
                <button class="se-btn" id="modal-close" style="margin-left:auto">✕</button>
            </div>
            <div class="se-modal-body">
                <div class="se-summary">${summaryHtml}</div>
                ${issues.length === 0 ? '<p style="color:#8a9a78">✅ 无错误</p>' : `
                <table><thead><tr><th>id</th><th>技名</th><th>类型</th><th>详情</th></tr></thead><tbody>
                    ${issues.map(i => `
                        <tr class="se-issue-row" data-id="${i.id}" style="cursor:pointer">
                            <td class="se-mono">${i.id}</td>
                            <td>${i.displayName}</td>
                            <td>${typeLabel[i.type] ?? i.type}</td>
                            <td>${i.msg}</td>
                        </tr>`).join('')}
                </tbody></table>`}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    ($('modal-close') as HTMLElement).addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).className === 'se-modal-bg') modal.remove();
    });
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
    L.push(`> 游戏未收录的典故主（孤儿）：**${orphanOwners}** 种`);
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
for (const id of ['f-search', 'f-sit', 'f-use', 'f-six', 'f-ex', 'f-wear']) {
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
