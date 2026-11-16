import { LEGION_NAVAL_FLEET_ROSTERS, type LegionNavalFleetRoster } from '../data/LegionNavalFleets.generated';
import {
    NAVAL_SHIP_CHINESE_NAMES,
    getNavalDeStats,
    getNavalShipChineseName,
    getNavalShipDrawScale,
    getNavalWeapons,
    type NavalWeapon,
} from '../types/NavalShipTiers';
import { LegionPhalanxDrawer } from '../map/legion/LegionPhalanxDrawer';

interface EditableRoster {
    flagShipKey: string;
    frontShipKey: string;
    mainShipKey: string;
    backShipKey: string;
    navalTier: string;
}

const WEAPON_ZH: Record<NavalWeapon, string> = {
    ram: '撞角',
    arrow: '弓箭',
    cannon: '火炮',
    trebuchet: '投石',
    greekfire: '希腊火',
};

const TIER_OPTIONS = ['远洋强权', '近海与内河水师', '沿岸渔猎渡河', '纯内陆无水师'] as const;

const TIER_COLOR: Record<string, string> = {
    '远洋强权': '#e0b354',
    '近海与内河水师': '#5da9e9',
    '沿岸渔猎渡河': '#7bc47f',
    '纯内陆无水师': '#9e978e',
};

const SHIP_KEYS = Object.keys(NAVAL_SHIP_CHINESE_NAMES).sort((a, b) =>
    getNavalShipChineseName(a).localeCompare(getNavalShipChineseName(b), 'zh'),
);

const initialRosters: Record<string, EditableRoster> = {};
const workingRosters: Record<string, EditableRoster> = {};
for (const [k, v] of Object.entries(LEGION_NAVAL_FLEET_ROSTERS)) {
    initialRosters[k] = { ...v };
    workingRosters[k] = { ...v };
}

const allNames = Object.keys(workingRosters);
let selectedName = allNames[0] ?? '';
let searchQuery = '';
let eraFilter = 'all';
let tierFilter = 'all';
let dirtyOnly = false;
let saving = false;
let statusMsg = '';

function eraOf(name: string): string {
    if (name.startsWith('古典时代') || name === '先秦军团') return 'antiquity';
    if (name.startsWith('封建时代')) return 'feudal';
    if (name.startsWith('城堡时代')) return 'castle';
    if (name.startsWith('帝国时代')) return 'imperial';
    return 'other';
}

function isDirty(name: string): boolean {
    const a = initialRosters[name];
    const b = workingRosters[name];
    if (!a || !b) return false;
    return a.flagShipKey !== b.flagShipKey
        || a.frontShipKey !== b.frontShipKey
        || a.mainShipKey !== b.mainShipKey
        || a.backShipKey !== b.backShipKey
        || a.navalTier !== b.navalTier;
}

function dirtyCount(): number {
    return allNames.filter(isDirty).length;
}

function shipSummary(key: string): string {
    const st = getNavalDeStats(key);
    const w = getNavalWeapons(key).map((x) => WEAPON_ZH[x] ?? x).join('+');
    return `${getNavalShipChineseName(key)}（血${st.hp} · 速${st.speed.toFixed(2)} · ${w}）`;
}

function drawShipSprite(ctx: CanvasRenderingContext2D, shipKey: string, cx: number, cy: number, targetH: number): boolean {
    LegionPhalanxDrawer.ensureUnitTypeLoading(shipKey);
    const set: any = LegionPhalanxDrawer.getUnitAssets(shipKey);
    const dir = 2; // 朝右偏下斜角，方便看清船型
    const frames: HTMLImageElement[] | undefined = set?.dirFrames?.[dir];
    const img: HTMLImageElement | undefined =
        (frames && frames[0]?.complete && frames[0].naturalWidth > 0 ? frames[0] : undefined)
        ?? (set?.idle?.complete && set.idle.naturalWidth > 0 ? set.idle : undefined)
        ?? (set?.frames?.[0]?.complete && set.frames[0].naturalWidth > 0 ? set.frames[0] : undefined);
    if (!img) return false;
    const meta = set?.dirMetas?.[dir]?.[0] ?? set?.meta;
    const scale = getNavalShipDrawScale(shipKey);
    const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
    const drawH = targetH * scale;
    const drawW = drawH * aspect;
    const ax = meta?.anchorX ?? 0.5;
    const ay = meta?.anchorY ?? 0.5;
    ctx.drawImage(img, cx - drawW * ax, cy - drawH * ay, drawW, drawH);
    return true;
}

function injectStyles(): void {
    const st = document.createElement('style');
    st.textContent = `
        .nf-wrap { display: flex; flex: 1; min-height: 0; overflow: hidden; }
        .nf-side { width: 340px; border-right: 1px solid #332d26; background: #141210; display: flex; flex-direction: column; }
        .nf-filter { padding: 10px; border-bottom: 1px solid #2b2620; display: flex; flex-direction: column; gap: 7px; }
        .nf-input, .nf-select { width: 100%; padding: 6px 8px; background: #1e1a16; color: #eee4d2; border: 1px solid #443c32; border-radius: 4px; font-family: inherit; font-size: 12px; }
        .nf-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .nf-list { flex: 1; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 4px; }
        .nf-item { padding: 7px 9px; border: 1px solid #2a241e; border-radius: 5px; background: #191613; cursor: pointer; display: flex; flex-direction: column; gap: 3px; }
        .nf-item:hover { background: #231f1a; border-color: #54493b; }
        .nf-item.active { background: #2b241a; border-color: #d4af37; }
        .nf-item-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; }
        .nf-item-sub { font-size: 11px; color: #a89b84; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nf-badge { font-size: 10px; padding: 1px 6px; border-radius: 3px; border: 1px solid currentColor; white-space: nowrap; }
        .nf-main { flex: 1; overflow-y: auto; padding: 14px 18px; display: flex; flex-direction: column; gap: 14px; }
        .nf-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding-bottom: 10px; border-bottom: 1px solid #322c24; }
        .nf-title { font-size: 20px; font-weight: 900; color: #f6df9d; }
        .nf-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .nf-btn { padding: 6px 12px; border-radius: 4px; border: 1px solid #6b5b3e; background: #2d251a; color: #f3e4c3; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 700; }
        .nf-btn:hover { background: #3f3323; border-color: #d4af37; }
        .nf-btn.primary { background: #70531c; border-color: #d4af37; color: #fff; }
        .nf-btn:disabled { opacity: 0.45; cursor: default; }
        .nf-stats { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: #cfc2aa; background: #171411; padding: 8px 12px; border: 1px solid #2d2720; border-radius: 6px; }
        .nf-canvas-box { background: radial-gradient(circle at 50% 45%, #163b57 0%, #0b2236 70%, #071624 100%); border: 1px solid #35526b; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; align-items: center; }
        .nf-canvas { width: 100%; max-width: 920px; height: 290px; display: block; }
        .nf-slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
        .nf-slot { background: #171411; border: 1px solid #322c24; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
        .nf-slot-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 700; color: #e8cf8a; }
        .nf-slot-preview { height: 92px; background: #0d2233; border: 1px solid #29465e; border-radius: 5px; display: flex; align-items: center; justify-content: center; }
        .nf-slot-meta { font-size: 11px; color: #b8ab92; line-height: 1.5; }
    `;
    document.head.appendChild(st);
}

const app = document.getElementById('app')!;
injectStyles();

const wrap = document.createElement('div');
wrap.className = 'nf-wrap';
const sideEl = document.createElement('div');
sideEl.className = 'nf-side';
const mainEl = document.createElement('div');
mainEl.className = 'nf-main';
wrap.append(sideEl, mainEl);
app.appendChild(wrap);

function filteredNames(): string[] {
    const q = searchQuery.trim().toLowerCase();
    return allNames.filter((name) => {
        if (dirtyOnly && !isDirty(name)) return false;
        if (eraFilter !== 'all' && eraOf(name) !== eraFilter) return false;
        const r = workingRosters[name];
        if (tierFilter !== 'all' && r.navalTier !== tierFilter) return false;
        if (!q) return true;
        const text = [
            name,
            r.navalTier,
            r.flagShipKey, getNavalShipChineseName(r.flagShipKey),
            r.frontShipKey, getNavalShipChineseName(r.frontShipKey),
            r.mainShipKey, getNavalShipChineseName(r.mainShipKey),
            r.backShipKey, getNavalShipChineseName(r.backShipKey),
        ].join(' ').toLowerCase();
        return q.split(/\s+/).every((t) => text.includes(t));
    });
}

function renderSidebar(): void {
    const items = filteredNames();
    const listEl = sideEl.querySelector('.nf-list') as HTMLDivElement | null;
    const countEl = sideEl.querySelector('.nf-count') as HTMLDivElement | null;
    if (!listEl || !countEl) return;
    countEl.textContent = `显示 ${items.length} / ${allNames.length} 支军团（待保存 ${dirtyCount()}）`;
    listEl.innerHTML = '';
    for (const name of items) {
        const r = workingRosters[name];
        const d = document.createElement('div');
        d.className = 'nf-item' + (name === selectedName ? ' active' : '');
        const tc = TIER_COLOR[r.navalTier] ?? '#cbb98e';
        const mod = isDirty(name) ? '<span style="color:#ff9f43">●</span> ' : '';
        d.innerHTML = `
            <div class="nf-item-top">
                <span>${mod}${name}</span>
                <span class="nf-badge" style="color:${tc}">${r.navalTier}</span>
            </div>
            <div class="nf-item-sub">旗:${getNavalShipChineseName(r.flagShipKey)} · 前:${getNavalShipChineseName(r.frontShipKey)} · 中:${getNavalShipChineseName(r.mainShipKey)} · 后:${getNavalShipChineseName(r.backShipKey)}</div>
        `;
        d.addEventListener('click', () => {
            selectedName = name;
            renderSidebar();
            renderMain();
        });
        listEl.appendChild(d);
    }
}

function buildSidebar(): void {
    sideEl.innerHTML = '';
    const filter = document.createElement('div');
    filter.className = 'nf-filter';

    const search = document.createElement('input');
    search.className = 'nf-input';
    search.placeholder = '搜军团名 / 船型中文名 / 船型ID…';
    search.addEventListener('input', () => {
        searchQuery = search.value;
        renderSidebar();
    });

    const row2 = document.createElement('div');
    row2.className = 'nf-row-2';

    const eraSel = document.createElement('select');
    eraSel.className = 'nf-select';
    eraSel.innerHTML = `
        <option value="all">全部时代</option>
        <option value="antiquity">古典 / 先秦</option>
        <option value="feudal">封建时代</option>
        <option value="castle">城堡时代</option>
        <option value="imperial">帝国时代</option>
        <option value="other">特殊军团</option>
    `;
    eraSel.addEventListener('change', () => {
        eraFilter = eraSel.value;
        renderSidebar();
    });

    const tierSel = document.createElement('select');
    tierSel.className = 'nf-select';
    tierSel.innerHTML = `<option value="all">全部水师等级</option>` +
        TIER_OPTIONS.map((t) => `<option value="${t}">${t}</option>`).join('');
    tierSel.addEventListener('change', () => {
        tierFilter = tierSel.value;
        renderSidebar();
    });

    row2.append(eraSel, tierSel);

    const dirtyLbl = document.createElement('label');
    dirtyLbl.style.cssText = 'font-size:11px; color:#b8ab92; display:flex; align-items:center; gap:5px; cursor:pointer;';
    const dirtyChk = document.createElement('input');
    dirtyChk.type = 'checkbox';
    dirtyChk.addEventListener('change', () => {
        dirtyOnly = dirtyChk.checked;
        renderSidebar();
    });
    dirtyLbl.append(dirtyChk, document.createTextNode('只看已修改'));

    const countEl = document.createElement('div');
    countEl.className = 'nf-count';
    countEl.style.cssText = 'font-size:11px; color:#cbb98e;';

    filter.append(search, row2, dirtyLbl, countEl);

    const listEl = document.createElement('div');
    listEl.className = 'nf-list';
    sideEl.append(filter, listEl);
    renderSidebar();
}

function drawFormationCanvas(cv: HTMLCanvasElement, r: EditableRoster): void {
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth || 900;
    const h = cv.clientHeight || 290;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 海战 10 舰标准阵位（左：后排 → 中排 → 前排 → 旗舰压阵或前突，清楚标出每排）
    const cols: { label: string; key: string; ys: number[]; x: number }[] = [
        { label: '后排（3艘）', key: r.backShipKey, x: w * 0.16, ys: [h * 0.24, h * 0.50, h * 0.76] },
        { label: '中排（3艘）', key: r.mainShipKey, x: w * 0.39, ys: [h * 0.24, h * 0.50, h * 0.76] },
        { label: '前排（3艘）', key: r.frontShipKey, x: w * 0.62, ys: [h * 0.24, h * 0.50, h * 0.76] },
        { label: '旗舰（1艘）', key: r.flagShipKey, x: w * 0.84, ys: [h * 0.50] },
    ];

    let needRetry = false;
    ctx.font = '12px "Noto Serif SC", sans-serif';
    ctx.textAlign = 'center';
    for (const col of cols) {
        ctx.fillStyle = '#d9c592';
        ctx.fillText(`${col.label} · ${getNavalShipChineseName(col.key)}`, col.x, 20);
        for (const y of col.ys) {
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
            ctx.beginPath();
            ctx.ellipse(col.x, y + 6, 36, 12, 0, 0, Math.PI * 2);
            ctx.stroke();
            if (!drawShipSprite(ctx, col.key, col.x, y, 56)) {
                needRetry = true;
            }
        }
    }
    if (needRetry) {
        setTimeout(() => {
            if (document.body.contains(cv)) drawFormationCanvas(cv, r);
        }, 160);
    }
}

async function saveAll(): Promise<void> {
    if (saving) return;
    saving = true;
    statusMsg = '正在保存…';
    renderMain();
    try {
        const res = await fetch('/api/naval-fleets/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rosters: workingRosters }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || '保存失败');
        for (const k of allNames) initialRosters[k] = { ...workingRosters[k] };
        statusMsg = `✅ 已保存全部 ${data.count} 支军团舰队到 LegionNavalFleets.generated.ts`;
    } catch (e: any) {
        statusMsg = `❌ 保存失败：${e?.message ?? e}`;
    } finally {
        saving = false;
        renderSidebar();
        renderMain();
    }
}

function renderMain(): void {
    const name = selectedName;
    const r = workingRosters[name];
    if (!r) { mainEl.innerHTML = '<div style="padding:20px;">未选中军团</div>'; return; }

    mainEl.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'nf-head';
    const title = document.createElement('div');
    title.className = 'nf-title';
    title.textContent = name + (isDirty(name) ? ' *' : '');

    const actions = document.createElement('div');
    actions.className = 'nf-actions';

    const tierSel = document.createElement('select');
    tierSel.className = 'nf-select';
    tierSel.style.width = 'auto';
    for (const t of TIER_OPTIONS) {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if (r.navalTier === t) opt.selected = true;
        tierSel.appendChild(opt);
    }
    tierSel.addEventListener('change', () => {
        r.navalTier = tierSel.value;
        renderSidebar();
        renderMain();
    });

    const btnReset = document.createElement('button');
    btnReset.className = 'nf-btn';
    btnReset.textContent = '↩ 还原当前';
    btnReset.disabled = !isDirty(name);
    btnReset.addEventListener('click', () => {
        workingRosters[name] = { ...initialRosters[name] };
        renderSidebar();
        renderMain();
    });

    const btnSave = document.createElement('button');
    btnSave.className = 'nf-btn primary';
    btnSave.textContent = saving ? '保存中…' : `💾 保存到代码库（${dirtyCount()} 项修改）`;
    btnSave.disabled = saving;
    btnSave.addEventListener('click', () => { void saveAll(); });

    actions.append(tierSel, btnReset, btnSave);
    head.append(title, actions);
    mainEl.appendChild(head);

    if (statusMsg) {
        const msg = document.createElement('div');
        msg.style.cssText = 'font-size:12px; color:#ffd77a;';
        msg.textContent = statusMsg;
        mainEl.appendChild(msg);
    }

    // 10 舰总战力汇总
    const allTen = [r.flagShipKey, r.frontShipKey, r.frontShipKey, r.frontShipKey, r.mainShipKey, r.mainShipKey, r.mainShipKey, r.backShipKey, r.backShipKey, r.backShipKey];
    let totalHp = 0;
    let sumSpd = 0;
    const weaponCount: Partial<Record<NavalWeapon, number>> = {};
    for (const k of allTen) {
        const st = getNavalDeStats(k);
        totalHp += st.hp;
        sumSpd += st.speed;
        for (const w of getNavalWeapons(k)) weaponCount[w] = (weaponCount[w] ?? 0) + 1;
    }
    const wText = Object.entries(weaponCount).map(([k, n]) => `${WEAPON_ZH[k as NavalWeapon] ?? k}×${n}`).join(' ｜ ');
    const statsEl = document.createElement('div');
    statsEl.className = 'nf-stats';
    statsEl.innerHTML = `
        <span><b>10 舰总血量：</b>${totalHp}</span>
        <span><b>平均航速：</b>${(sumSpd / 10).toFixed(2)}</span>
        <span><b>舰队武装：</b>${wText || '无'}</span>
    `;
    mainEl.appendChild(statsEl);

    // 10 舰阵型预览画布
    const cvBox = document.createElement('div');
    cvBox.className = 'nf-canvas-box';
    const cv = document.createElement('canvas');
    cv.className = 'nf-canvas';
    cvBox.appendChild(cv);
    mainEl.appendChild(cvBox);
    requestAnimationFrame(() => drawFormationCanvas(cv, r));

    // 4 槽位编辑卡片
    const slotsWrap = document.createElement('div');
    slotsWrap.className = 'nf-slots';
    const slotDefs: { field: keyof Omit<EditableRoster, 'navalTier'>; label: string; count: number }[] = [
        { field: 'flagShipKey', label: '旗舰', count: 1 },
        { field: 'frontShipKey', label: '前排战船', count: 3 },
        { field: 'mainShipKey', label: '中排主力', count: 3 },
        { field: 'backShipKey', label: '后排支援', count: 3 },
    ];
    for (const sd of slotDefs) {
        const card = document.createElement('div');
        card.className = 'nf-slot';
        const curKey = r[sd.field];
        const st = getNavalDeStats(curKey);
        const weapons = getNavalWeapons(curKey).map((w) => WEAPON_ZH[w] ?? w).join(' / ');

        const sh = document.createElement('div');
        sh.className = 'nf-slot-head';
        sh.innerHTML = `<span>${sd.label}（${sd.count} 艘）</span><span style="font-size:11px;color:#9cc9f0">${curKey}</span>`;

        const prevBox = document.createElement('div');
        prevBox.className = 'nf-slot-preview';
        const scv = document.createElement('canvas');
        scv.width = 180;
        scv.height = 86;
        prevBox.appendChild(scv);
        const drawSlot = () => {
            const c = scv.getContext('2d');
            if (!c) return;
            c.clearRect(0, 0, scv.width, scv.height);
            if (!drawShipSprite(c, curKey, scv.width / 2, scv.height / 2 + 4, 62)) {
                setTimeout(() => { if (document.body.contains(scv)) drawSlot(); }, 160);
            }
        };
        drawSlot();

        const sel = document.createElement('select');
        sel.className = 'nf-select';
        for (const sk of SHIP_KEYS) {
            const opt = document.createElement('option');
            opt.value = sk;
            opt.textContent = shipSummary(sk);
            if (sk === curKey) opt.selected = true;
            sel.appendChild(opt);
        }
        sel.addEventListener('change', () => {
            r[sd.field] = sel.value;
            renderSidebar();
            renderMain();
        });

        const meta = document.createElement('div');
        meta.className = 'nf-slot-meta';
        meta.innerHTML = `单舰血量 <b>${st.hp}</b> · 航速 <b>${st.speed.toFixed(2)}</b> · 武装 <b>${weapons}</b>`;

        card.append(sh, prevBox, sel, meta);
        slotsWrap.appendChild(card);
    }
    mainEl.appendChild(slotsWrap);
}

buildSidebar();
renderMain();
