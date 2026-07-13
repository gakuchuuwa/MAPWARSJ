/**
 * 武将技编辑器（/skill-editor.html）
 * ────────────────────────────────────────────
 * 一技一档案：三势 / 攻防 / 典故主(=专属) / 状态 / 档位（查表写标准值，不给自由数字）。
 * 保存即迁移：内联字段写入条目本体，四张散表中的该条同时退役。
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
    ownerGeneralId: string | null; ownerName: string | null; ownerSource: string | null;
    exclusive: string; status: string;
    wearers: { gid: string; name: string; tier: string }[];
}
interface GeneralRow { generalId: string; name: string; tier: string; }

let SKILLS: SkillRow[] = [];
let GENERALS: GeneralRow[] = [];
let TIERS: Record<string, Record<string, number | [number, number]>> = {};
let CONDITIONS: string[] = [];
let selectedId: string | null = null;

const app = document.getElementById('app')!;
app.innerHTML = `
<style>
    .se-header { padding: 10px 16px; background: #1a1713; border-bottom: 1px solid #3a3226; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .se-title { font-size: 18px; font-weight: bold; color: #d8b95e; letter-spacing: 2px; margin-right: 8px; }
    .se-header input, .se-header select { background: #0e0d0c; color: #e8e0d0; border: 1px solid #4a4234; border-radius: 4px; padding: 5px 8px; font-family: inherit; }
    .se-btn { background: #3a3226; color: #e8d9b0; border: 1px solid #6a5c3c; border-radius: 4px; padding: 5px 14px; cursor: pointer; font-family: inherit; }
    .se-btn:hover { background: #4a4234; }
    .se-btn-gold { background: #5c4a1e; border-color: #b48c3c; }
    .se-main { flex: 1; display: flex; min-height: 0; }
    .se-list { flex: 1; overflow: auto; }
    .se-list table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .se-list th { position: sticky; top: 0; background: #1a1713; color: #b8a878; text-align: left; padding: 6px 8px; border-bottom: 1px solid #3a3226; }
    .se-list td { padding: 4px 8px; border-bottom: 1px solid #221e18; white-space: nowrap; }
    .se-list tr { cursor: pointer; }
    .se-list tr:hover td { background: #221e18; }
    .se-list tr.sel td { background: #2e281c; }
    .se-detail { width: 460px; border-left: 1px solid #3a3226; overflow: auto; padding: 14px; background: #131110; }
    .se-detail h3 { margin: 0 0 4px; color: #d8b95e; }
    .se-field { margin: 8px 0; }
    .se-field label { display: inline-block; width: 76px; color: #b8a878; font-size: 13px; }
    .se-field select, .se-field input { background: #0e0d0c; color: #e8e0d0; border: 1px solid #4a4234; border-radius: 4px; padding: 4px 8px; font-family: inherit; width: 300px; }
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
    .se-retired td { opacity: 0.45; }
</style>
<div class="se-header">
    <span class="se-title">武将技编辑器</span>
    <input id="f-search" placeholder="搜技名 / id / 典故主" style="width:180px">
    <select id="f-sit"><option value="">三势·全部</option><option>优势</option><option>均势</option><option>劣势</option></select>
    <select id="f-use"><option value="">攻防·全部</option><option>攻击</option><option>防御</option><option>通用</option></select>
    <select id="f-ex"><option value="">归属·全部</option><option>专用</option><option>通行</option></select>
    <select id="f-wear">
        <option value="">佩戴·全部</option>
        <option value="none">无人佩戴</option>
        <option value="stray">戴错人（专属被外人戴）</option>
        <option value="orphanOwner">典故主未佩戴</option>
    </select>
    <select id="f-status"><option value="">状态·全部</option><option value="active">在役</option><option value="retired">退役</option></select>
    <button class="se-btn se-btn-gold" id="btn-new">＋ 新增技能</button>
    <button class="se-btn" id="btn-refresh">刷新</button>
    <span class="se-count" id="count"></span>
</div>
<div class="se-main">
    <div class="se-list"><table>
        <thead><tr><th>id</th><th>技名</th><th>三势</th><th>攻防</th><th>典故主</th><th>档位/数值</th><th>佩戴</th><th>状态</th></tr></thead>
        <tbody id="list-body"></tbody>
    </table></div>
    <div class="se-detail" id="detail"><div style="color:#6a6254">← 点击左侧条目编辑；每次保存会把该技的散表标注迁入条目本体。</div></div>
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
    window.setTimeout(() => { t.style.display = 'none'; }, err ? 6000 : 3000);
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
    if (s.status === 'retired') return '';
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
    const ex = ($('f-ex') as HTMLSelectElement).value;
    const wear = ($('f-wear') as HTMLSelectElement).value;
    const status = ($('f-status') as HTMLSelectElement).value;
    return SKILLS.filter(s => {
        if (q && !(s.id.includes(q) || s.displayName.includes(q) || (s.ownerName ?? '').includes(q))) return false;
        if (sit && s.situationTag !== sit) return false;
        if (use && s.usageTag !== use) return false;
        if (ex && s.exclusive !== ex) return false;
        if (status && s.status !== status) return false;
        if (wear && wearProblem(s) !== wear) return false;
        return true;
    });
}

function renderList(): void {
    const rows = applyFilters();
    $('count').textContent = `${rows.length} / ${SKILLS.length} 条`;
    $('list-body').innerHTML = rows.map(s => `
        <tr data-id="${s.id}" class="${s.id === selectedId ? 'sel' : ''}${s.status === 'retired' ? ' se-retired' : ''}">
            <td class="se-mono">${s.id}</td>
            <td>${s.displayName}${s.locked ? ' 🔒' : ''}</td>
            <td>${s.situationTag}${srcBadge(s.situationSource)}</td>
            <td>${s.usageTag}</td>
            <td>${s.ownerName ?? '<span style="color:#6a6254">通用</span>'}${s.ownerSource ? srcBadge(s.ownerSource) : ''}</td>
            <td class="se-mono">${valueLabel(s)}</td>
            <td>${s.wearers.length}${wearProblem(s) === 'stray' ? ' ⚠' : wearProblem(s) === 'orphanOwner' ? ' ✂' : s.wearers.length === 0 && s.status === 'active' ? ' ∅' : ''}</td>
            <td>${s.status === 'retired' ? '退役' : '在役'}</td>
        </tr>`).join('');
    for (const tr of $('list-body').querySelectorAll('tr')) {
        tr.addEventListener('click', () => { selectedId = (tr as HTMLElement).dataset.id!; renderList(); renderDetail(); });
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

function renderDetail(): void {
    const s = SKILLS.find(x => x.id === selectedId);
    if (!s) return;
    const ownerVal = s.ownerName ? `${s.ownerName} (${s.ownerGeneralId ?? '?'})` : '';
    $('detail').innerHTML = `
        <h3>${s.displayName} <span class="se-mono">${s.id}</span>${s.locked ? ' 🔒锁定值' : ''}</h3>
        <div class="se-quote">${s.sourceQuote || '（无出处）'}</div>
        <div class="se-mono">effect=${s.baseEffect} · cond=${s.condition} · phase=${s.phase} · ${s.engineStatus}</div>
        ${s.note ? `<div class="se-quote">note: ${s.note}</div>` : ''}
        <hr style="border-color:#3a3226">
        <div class="se-field"><label>三势</label><select id="d-sit">
            ${['优势', '均势', '劣势'].map(v => `<option ${v === s.situationTag ? 'selected' : ''}>${v}</option>`).join('')}
        </select> ${srcBadge(s.situationSource)}</div>
        <div class="se-field"><label>攻防</label><select id="d-use">
            ${['通用', '攻击', '防御'].map(v => `<option ${v === s.usageTag ? 'selected' : ''}>${v}</option>`).join('')}
        </select></div>
        <div class="se-field"><label>典故主</label><input id="d-owner" list="dl-generals" value="${ownerVal}" placeholder="留空 = 通用；输入人名从名录选"></div>
        <div class="se-field"><label>状态</label><select id="d-status">
            <option value="active" ${s.status !== 'retired' ? 'selected' : ''}>在役</option>
            <option value="retired" ${s.status === 'retired' ? 'selected' : ''}>退役</option>
        </select></div>
        <div class="se-field"><label>档位</label>${s.family && !s.locked
            ? `<select id="d-tier"><option value="">（不改）</option>${tierOptions(s)}</select>`
            : `<span style="color:#6a6254">${s.locked ? '定稿锁定，禁改' : '该效果家族不走档位（维持现值 ' + valueLabel(s) + '）'}</span>`}</div>
        <div class="se-wearers"><b>佩戴（六槽，${s.wearers.length} 人）：</b>${s.wearers.map(w =>
            `${w.name}${w.tier === 'famous' ? '★' : ''}${s.ownerGeneralId && w.gid !== s.ownerGeneralId ? '⚠' : ''}`).join('、') || '无人'}
            ${s.ownerGeneralId && !s.wearers.some(w => w.gid === s.ownerGeneralId) ? '<div style="color:#d8a05e">✂ 典故主本人未佩戴</div>' : ''}</div>
        <button class="se-btn se-btn-gold" id="d-save">保存（写入条目本体 + 散表退役）</button>
        <div class="se-new" id="new-panel"></div>
    `;
    $('d-save').addEventListener('click', () => saveDetail(s));
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
    const body = {
        id: s.id,
        situationTag: ($('d-sit') as HTMLSelectElement).value,
        usageTag: ($('d-use') as HTMLSelectElement).value,
        status: ($('d-status') as HTMLSelectElement).value,
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
        <div class="se-field"><label>出处</label><input id="n-quote" placeholder="史料引文，引号用“”"></div>
        <div class="se-field"><label>效果</label><select id="n-effect">${effects.map(e => `<option>${e}</option>`).join('')}</select></div>
        <div class="se-field"><label>条件</label><select id="n-cond">${CONDITIONS.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div class="se-field"><label>三势</label><select id="n-sit"><option>优势</option><option>均势</option><option>劣势</option></select></div>
        <div class="se-field"><label>攻防</label><select id="n-use"><option>通用</option><option>攻击</option><option>防御</option></select></div>
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

async function load(keepSelected?: string): Promise<void> {
    const res = await fetch('/api/skill-editor/list');
    const j = await res.json();
    if (!j.ok) { toast(`加载失败：${j.error}`, true); return; }
    SKILLS = j.skills;
    GENERALS = j.generals;
    TIERS = j.tiers;
    CONDITIONS = j.conditions;
    $('dl-generals').innerHTML = GENERALS.map(g =>
        `<option value="${g.name} (${g.generalId})">${g.tier === 'famous' ? '★名将' : '普将'}</option>`).join('');
    if (keepSelected) selectedId = keepSelected;
    renderList();
    if (selectedId) renderDetail();
}

for (const id of ['f-search', 'f-sit', 'f-use', 'f-ex', 'f-wear', 'f-status']) {
    $(id).addEventListener('input', renderList);
}
$('btn-refresh').addEventListener('click', () => load());
$('btn-new').addEventListener('click', () => {
    selectedId = null;
    renderList();
    $('detail').innerHTML = '<div class="se-new" id="new-panel"></div>';
    renderNewForm();
});

load();
