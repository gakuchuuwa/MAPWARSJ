/**
 * 军团编辑面板 —— 🔴 [2026-09-15 主人定]
 *
 * > 「军团方阵那一页就是势力归属；我要的是军团编辑」「没必要再搞一个页面」
 *
 * 挂在「军团方阵」页里的全屏面板（不另开页）。**只干一件事**：改军团自己的编制。
 *   · 直接列出全部三层军团，点一支就改它的三排兵种 + 阵型，不用先去找势力
 *   · 保存走 `/api/save-legion-composition`：**只写这一支军团那一条记录**
 *   · 删除走 `/api/delete-legion`：一级 16 母体与二级 59 文明禁止删，只能删三级
 *   · **绝不碰势力归属**（`FactionCompositions.ts` 一个字都不动）
 */
import { FACTIONS } from '../data/factions';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { planFallbackForDeletedLegion, applyFallbackPlan } from '../systems/LegionFallbackOnDelete';
import {
    CULTURE_LEGION_NAMES,
    getLegionCompositionByName,
    patchLegionComposition,
    dropLegionFromMemory,
    renameLegionInMemory,
    resolveRenamedLegion,
    type FormationMode,
} from '../types/CultureFormations';
import { LEVEL_2_CIV_59_LEGIONS } from '../data/level2Civ59Legions';
import { LEVEL_3_LEGIONS } from '../data/level3CustomLegions';
import { STARTING_CAPITALS } from '../data/StartingCapitals';
import { CITIES_V2 } from '../data/cities_v2';
import { getCityRegion, type RegionType } from '../systems/RegionSystem';
import { WAR_TYPES } from '../data/WarTypes';
import {
    DE_UNITS_CATALOG, CATEGORY_LABEL, SUBCATEGORY_LABEL,
    getUnitSubcategory, getUnitTier, observeThumbs, drawUnitThumb,
} from '../legion-editor/main';
import { getNavalShipChineseName } from '../types/NavalShipTiers';

const BASE_16_LEGION_NAMES: Record<string, string> = {
    CENTRAL: '东亚军团', STEPPE: '中亚军团', INDIA: '印度军团', GERMANIC: '西欧军团',
    PURU: '普鲁军团', ORIE: '中东军团', LATIN: '地中海军团', SLAVIC: '东北欧军团',
    EAST: '东南欧军团', PERSIAN: '波斯军团', MALAY: '东南亚军团', GREEK: '希腊军团',
    THRACIAN: '色雷斯军团', ANDE: '安第斯军团', AMERICA: '中美军团', AFRICA: '非洲军团',
};

/** 七阵型的前/中/后人数（总和一律 9） */
const MODE_ROWS: Record<FormationMode, [number, number, number]> = {
    square: [3, 3, 3],
    echelon: [4, 3, 2],
    fish_scale: [3, 4, 2],
    crane_wing: [2, 4, 3],
    triangle: [2, 3, 4],
    crescent: [3, 2, 4],
    balance_yoke: [4, 2, 3],
};
const MODE_LABEL: Record<FormationMode, string> = {
    square: '方阵 3+3+3', echelon: '雁行 4+3+2', fish_scale: '鱼鳞 3+4+2',
    crane_wing: '鹤翼 2+4+3', triangle: '锥形 2+3+4', crescent: '偃月 3+2+4',
    balance_yoke: '衡轭 4+2+3',
};

type Layer = '一级' | '二级' | '三级';
interface LegionRow {
    name: string;
    layer: Layer;
    mode: FormationMode;
    slots: { type: string; count: number }[];
    users: number;
    shipId: string;
}

const cn = (id: string) => (WAR_TYPES as Record<string, { name?: string }>)[id]?.name ?? id;
const cityMap = new Map(CITIES_V2.map(c => [c.id, c]));

function countUsers(): Map<string, number> {
    const m = new Map<string, number>();
    for (const f of FACTIONS) {
        const cap = cityMap.get((STARTING_CAPITALS as Record<string, string>)[f.id]);
        const rg: RegionType = cap
            ? getCityRegion({ latitude: cap.lat, longitude: cap.lng, region: cap.region })
            : ('CENTRAL' as RegionType);
        const ptr = (FACTION_COMPOSITIONS as Record<string, { legionName?: string }>)[f.id]?.legionName?.trim();
        const name = ptr || (CULTURE_LEGION_NAMES as Record<string, string>)[rg];
        if (name) m.set(name, (m.get(name) ?? 0) + 1);
    }
    return m;
}

function buildRows(): LegionRow[] {
    const users = countUsers();
    const out: LegionRow[] = [];
    const push = (rawName: string, layer: Layer) => {
        // 改名后静态表还是旧名（要等 HMR），这里先换成新名再查编制
        const name = resolveRenamedLegion(rawName);
        const c = getLegionCompositionByName(name);
        if (!c) return;
        out.push({ name, layer, mode: c.formationMode, slots: c.slots.map(s => ({ type: s.type, count: s.count })), users: users.get(name) ?? 0, shipId: c.shipId ?? '' });
    };
    for (const n of Object.values(BASE_16_LEGION_NAMES)) push(n, '一级');
    for (const l of LEVEL_2_CIV_59_LEGIONS) push(l.name, '二级');
    for (const l of LEVEL_3_LEGIONS) push(l.name, '三级');
    // 🔴 [2026-09-16] 本次会话里新建的三级军团：静态表要等 HMR 才有它，
    //    先从内存补进列表，新建完立刻能看见、能接着编（与保存编制「不等 HMR」同一套路）。
    for (const n of runtimeCreated) if (!out.some(r => r.name === n)) push(n, '三级');
    return out;
}

/** 本次会话里新建的三级军团名（静态表还没有它们） */
const runtimeCreated = new Set<string>();

let rows: LegionRow[] = [];
let keyword = '';
/** 🔴 [2026-09-16 主人「加一个势力排序」] 按「用它的势力家数」排：none=表原顺序（一→二→三级）/ desc=多在前 / asc=少在前。
 *  点「势力」表头循环切换。无人套用的军团要找出来，点两下切到 asc 就全在最上面。 */
let sortByUsers: 'none' | 'desc' | 'asc' = 'none';
let layerFilter: Layer | '全部' = '全部';
let selected: string | null = null;
/** 当前正在编辑的草稿（未保存） */
let draft: { mode: FormationMode; types: [string, string, string]; shipId: string } | null = null;
let host: HTMLElement;
/** 🔴 [2026-09-15 主人报障「搜索框打不出汉字」]
 *  这两个搜索框每敲一下就 innerHTML 重建整块，输入框节点被换掉，
 *  中文输入法正在进行的「组合（composition）」当场被打断 —— 拼音上不了屏。
 *  解法：组合期间只记值、不重绘，等 compositionend 再重绘一次。 */
let composing = false;

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toast(msg: string, bad = false): void {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;left:50%;top:56px;transform:translateX(-50%);z-index:20000;
        background:${bad ? '#5a2020' : '#20502a'};border:1px solid ${bad ? '#a05050' : '#4a9a5a'};
        color:#fff;padding:9px 18px;border-radius:5px;font-size:13px;max-width:70vw;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4200);
}

/** 兵种的子分类中文名（剑盾兵 / 长枪兵 / 弓骑兵…），选择器和摘要都用它 */
function subLabelOf(unitId: string): string {
    const sub = getUnitSubcategory(unitId);
    const u = DE_UNITS_CATALOG.find(x => x.id === unitId);
    const cat = u ? (CATEGORY_LABEL as Record<string, string>)[u.category] ?? '' : '';
    const subCn = sub ? (SUBCATEGORY_LABEL as Record<string, string>)[sub] ?? sub : '';
    const tier = u && getUnitTier(u) === 'elite' ? ' · ⭐精锐' : '';
    return [cat, subCn].filter(Boolean).join(' / ') + tier;
}

/**
 * 🔴 [2026-09-18 主人「让舰队和其他前中后三排兵种一样显示」]
 * 军团表里存的 `shipId` 是**大写素材 ID**（如 `ANT_WAR_GALLEY`），
 * 而兵种表 `DE_UNITS_CATALOG` 里的船 id 是**小写**（`ant_war_galley`）——
 * 缩略图（drawUnitThumb）与选择器都走兵种表，所以显示前先转小写。
 * 实测（`node scratch/_check_ship_ids.cjs`）：海军中文名表 44 条 + 三张编制表里实际在用的 23 个 shipId，
 * 全部能落到兵种表的「船只」条目上，无一落空。
 */
function shipUnitId(shipId: string | undefined): string {
    return (shipId ?? '').toLowerCase();
}

/** 战船显示名：取兵种表里的中文名（与选择器弹窗里同名），兵种表查无再退回海军中文名表 / 原样 ID。 */
function shipLabel(shipId: string | undefined): string {
    const uid = shipUnitId(shipId);
    if (!uid) return '—';
    return DE_UNITS_CATALOG.find(u => u.id === uid)?.name ?? getNavalShipChineseName(uid);
}

/** 选兵种：带图 + 按子分类分组的弹窗（2026-09-15 主人「选兵种的时候，要有图，要有子分类」） */
let pickerKeyword = '';
let pickerCat: string = 'all';
/**
 * 🔴 [2026-09-18 主人「让舰队和兵种一样显示」] 战船选择器也走这个弹窗，但**分类记忆要分开**：
 *    战船默认停在「船只」，陆战兵种那套照旧记上次看的大类。
 *    共用一个 pickerCat 的话，选完船再点前排，弹窗会只剩船只、陆战兵种全被滤掉。
 */
let pickerShipCat: string = 'naval';
let pickerKind: 'unit' | 'ship' = 'unit';

/**
 * @param onPick 给了就把选中的兵种交给它（新建军团弹窗、舰队选船用），不动 draft、不重绘主列表；
 *               不给就是原行为：写进当前编辑中的 draft 那一排。
 * @param kind   'ship' = 给「舰队（战船）」选船（分类默认停船只、标题写舰队）。
 */
function openUnitPicker(rowIdx: number, onPick?: (unitId: string) => void, pickedNow?: string, kind: 'unit' | 'ship' = 'unit'): void {
    if (!draft && !onPick) return;
    pickerKind = kind;
    if (kind === 'ship') pickerCat = pickerShipCat;
    // 🔴 高亮「当前这一排是谁」：编辑现有军团时读 draft，新建弹窗没有 draft，读调用方传来的值。
    //    原来这里直写 draft!.types[rowIdx]，新建那条路进来时 draft 是 null → 整个 paint 抛异常，
    //    弹窗开出来是**空白的**（overlay 在、一张卡都没有）。
    const currentType = (): string => (onPick ? (pickedNow ?? '') : (draft?.types[rowIdx] ?? ''));
    document.getElementById('lp-picker')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'lp-picker';
    overlay.style.cssText = `position:fixed;inset:0;z-index:16000;background:rgba(0,0,0,.72);
        display:flex;align-items:center;justify-content:center;`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const box = document.createElement('div');
    box.style.cssText = `width:min(1100px,92vw);height:min(760px,88vh);background:#141210;
        border:1px solid #3a342c;border-radius:6px;display:flex;flex-direction:column;overflow:hidden;`;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const cats = ['all', ...new Set(DE_UNITS_CATALOG.map(u => u.category))];

    // 🔴 保持 DE_UNITS_CATALOG 原始子分类顺序（分类绝对不可乱）
    const SUB_ORDER = (() => {
        const arr: string[] = [];
        for (const u of DE_UNITS_CATALOG) {
            const sub = getUnitSubcategory(u.id);
            const key = sub ? (SUBCATEGORY_LABEL as Record<string, string>)[sub] ?? sub : '未分类';
            if (!arr.includes(key)) arr.push(key);
        }
        return arr;
    })();

    const paint = (): void => {
        const kw = pickerKeyword.trim();
        // 🔴 保持分类顺序：不要在最外层全局按名字排序，否则会把冷兵器等搞到最前面
        const list = DE_UNITS_CATALOG.filter(u => {
            if (pickerCat !== 'all' && u.category !== pickerCat) return false;
            if (!kw) return true;
            return u.name.includes(kw) || u.id.includes(kw) || subLabelOf(u.id).includes(kw);
        });
        // 按子分类分组
        const groups = new Map<string, typeof list>();
        for (const u of list) {
            const sub = getUnitSubcategory(u.id);
            const key = sub ? (SUBCATEGORY_LABEL as Record<string, string>)[sub] ?? sub : '未分类';
            if (!groups.has(key)) groups.set(key, [] as unknown as typeof list);
            groups.get(key)!.push(u);
        }
        // 🔴 兵种按名称排序：仅在每个子分类组内按中文拼音排序
        for (const us of groups.values()) {
            us.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN') || a.id.localeCompare(b.id));
        }
        // 🔴 分类顺序严格按系统原始分类顺序排列（刀盾、双手、长矛...）
        const sortedGroups = [...groups.entries()].sort(
            ([a], [b]) => (SUB_ORDER.indexOf(a) === -1 ? 999 : SUB_ORDER.indexOf(a)) - (SUB_ORDER.indexOf(b) === -1 ? 999 : SUB_ORDER.indexOf(b))
        );
        box.innerHTML = `
          <div style="padding:10px 14px;border-bottom:1px solid #2a2520;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <b style="color:#f6e05e;">选兵种 · ${['前排', '中坚', '后排'][rowIdx] ?? '舰队'}</b>
            <input id="lp-pk-search" placeholder="搜兵种名 / 子分类 / ID" value="${esc(pickerKeyword)}"
              style="width:220px;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:6px 9px;">
            ${cats.map(c => `<button data-cat="${c}" class="lp-pk-cat" style="background:${pickerCat === c ? '#5a3c28' : '#243246'};
              border:1px solid ${pickerCat === c ? '#8a6038' : '#4a5568'};color:#e8e0d0;border-radius:4px;padding:5px 11px;cursor:pointer;font-size:12px;">
              ${c === 'all' ? '全部' : esc((CATEGORY_LABEL as Record<string, string>)[c] ?? c)}</button>`).join('')}
            <span style="color:#8a8378;font-size:12px;">${list.length} 个</span>
            <button id="lp-pk-close" style="margin-left:auto;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:4px;padding:5px 12px;cursor:pointer;">✕</button>
          </div>
          <div id="lp-pk-body" style="flex:1;overflow:auto;padding:12px 14px;">
            ${sortedGroups.map(([sub, us]) => `
              <div style="color:#c8a84b;font-size:12px;margin:10px 0 6px;border-bottom:1px solid #2a2520;padding-bottom:4px;">
                ${esc(sub)} <span style="color:#6a6358;">${us.length}</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;">
                ${us.map(u => `
                  <div class="lp-pk-card" data-uid="${esc(u.id)}" style="display:flex;gap:8px;align-items:center;
                       background:${u.id === currentType() ? '#3a2f1e' : '#201d18'};
                       border:1px solid ${u.id === currentType() ? '#c8a84b' : '#363024'};
                       border-radius:4px;padding:6px 8px;cursor:pointer;">
                    <canvas data-uid="${esc(u.id)}" width="48" height="48"
                      style="width:48px;height:48px;flex:0 0 48px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
                    <div style="min-width:0;">
                      <div style="color:#e8e0d0;font-size:12px;">${esc(u.name)}</div>
                      <div style="color:#6a6358;font-size:10px;">${getUnitTier(u) === 'elite' ? '⭐精锐' : ''}</div>
                    </div>
                  </div>`).join('')}
              </div>`).join('')}
          </div>`;

        observeThumbs(box);
        const pkSearch = document.getElementById('lp-pk-search') as HTMLInputElement | null;
        const repaintSearch = (v: string): void => {
            pickerKeyword = v;
            paint();
            const s = document.getElementById('lp-pk-search') as HTMLInputElement;
            s.focus(); s.setSelectionRange(s.value.length, s.value.length);
        };
        pkSearch?.addEventListener('compositionstart', () => { composing = true; });
        pkSearch?.addEventListener('compositionend', e => {
            composing = false;
            repaintSearch((e.target as HTMLInputElement).value);
        });
        pkSearch?.addEventListener('input', e => {
            const v = (e.target as HTMLInputElement).value;
            pickerKeyword = v;
            if (composing) return;             // 同上：组合期间不重绘
            repaintSearch(v);
        });
        box.querySelectorAll('.lp-pk-cat').forEach(b => b.addEventListener('click', () => {
            pickerCat = (b as HTMLElement).dataset.cat!;
            if (pickerKind === 'ship') pickerShipCat = pickerCat;
            paint();
        }));
        document.getElementById('lp-pk-close')?.addEventListener('click', () => overlay.remove());
        box.querySelectorAll('.lp-pk-card').forEach(c => c.addEventListener('click', () => {
            const uid = (c as HTMLElement).dataset.uid!;
            overlay.remove();
            if (onPick) { onPick(uid); return; }
            if (draft) draft.types[rowIdx] = uid;
            render();
        }));
    };
    paint();
}

function visible(): LegionRow[] {
    const kw = keyword.trim();
    const out = rows.filter(r => {
        if (layerFilter !== '全部' && r.layer !== layerFilter) return false;
        if (!kw) return true;
        return r.name.includes(kw) || r.slots.some(s => cn(s.type).includes(kw));
    });
    if (sortByUsers !== 'none') {
        const dir = sortByUsers === 'desc' ? -1 : 1;
        // 家数相同的保持原来的层级顺序，别让同数的军团每次重绘都换位置
        out.sort((a, b) => (a.users - b.users) * dir || rows.indexOf(a) - rows.indexOf(b));
    }
    return out;
}

function render(): void {
    const list = visible();
    const sel = selected ? rows.find(r => r.name === selected) : null;
    if (sel && !draft) {
        draft = { mode: sel.mode, types: [sel.slots[0]?.type ?? '', sel.slots[1]?.type ?? '', sel.slots[2]?.type ?? ''], shipId: sel.shipId ?? '' };
    }
    const counts = { 一级: 0, 二级: 0, 三级: 0 } as Record<Layer, number>;
    for (const r of rows) counts[r.layer]++;
    const rowCnt = draft ? MODE_ROWS[draft.mode] : [0, 0, 0];
    const dirty = !!(sel && draft && (draft.mode !== sel.mode
        || draft.types.join(',') !== sel.slots.map(s => s.type).join(',')
        || (draft.shipId ?? '') !== (sel.shipId ?? '')));

    // 🔴 [2026-09-15] 整表是 innerHTML 重建的，点一支军团就换新节点，
    //     不记住滚动位置的话列表会弹回顶部，往下拉着编根本编不下去。
    const keepScroll = document.getElementById('lp-list')?.scrollTop ?? 0;

    host.innerHTML = `
    <div style="padding:10px 14px;border-bottom:1px solid #2a2520;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <input id="lp-search" placeholder="搜军团名 / 兵种" value="${esc(keyword)}"
        style="width:230px;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:6px 9px;">
      <select id="lp-layer" style="background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:6px 9px;">
        ${(['全部', '一级', '二级', '三级'] as const).map(l =>
            `<option value="${l}" ${layerFilter === l ? 'selected' : ''}>${l}${l === '全部' ? `（${rows.length} 支）` : `（${counts[l as Layer]} 支）`}</option>`).join('')}
      </select>
      <span style="color:#8a8378;font-size:12px;">列出 ${list.length} 支</span>
      <button id="lp-new" style="margin-left:auto;padding:6px 14px;background:#2a4a2a;border:1px solid #4a7a4a;
        color:#d0e8d0;border-radius:4px;font-size:13px;cursor:pointer;">➕ 新建军团</button>
    </div>

    <div style="flex:1;display:flex;min-height:0;">
      <div id="lp-list" style="flex:1;overflow:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead style="position:sticky;top:0;background:#1a1714;">
            <tr style="color:#b8ab8e;text-align:left;">
              <th style="padding:7px 10px;">层级</th>
              <th style="padding:7px 10px;">军团名</th>
              <th style="padding:7px 10px;">阵型</th>
              <th style="padding:7px 10px;">前排</th>
              <th style="padding:7px 10px;">中坚</th>
              <th style="padding:7px 10px;">后排</th>
              <th style="padding:7px 10px;">舰队</th>
              <th id="lp-sort-users" title="点击按势力家数排序（多在前 / 少在前 / 原顺序）"
                  style="padding:7px 10px;cursor:pointer;user-select:none;${sortByUsers !== 'none' ? 'color:#f6e05e;' : ''}">
                势力${sortByUsers === 'desc' ? ' ▼' : sortByUsers === 'asc' ? ' ▲' : ' ⇅'}</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(r => {
                /* 🔴 [2026-09-18 主人报障「编辑军团后，信息有的不实时更新」]
                 * 左表原先只读 `r`（已保存的记录），而阵型/兵种/战船改动都写在 `draft` 里，
                 * 于是右侧面板的三排人数当场从 4+2+3 变成 3+3+3，左表那一行却还挂着旧的
                 * 「衡轭 4+2+3 ×4 ×2 ×3」—— 同一屏两个数，主人看到的就是这个。
                 * 现在：**正在编辑的那一行改读 draft**，其余行照旧读已保存值。
                 * 人数与右侧同源，都由 MODE_ROWS[mode] 得出，不会再各算各的。 */
                const d = (draft && r.name === selected) ? draft : null;
                const rMode = d ? d.mode : r.mode;
                const rCnt = MODE_ROWS[rMode] ?? [0, 0, 0];
                const rTypes: (string | undefined)[] = d
                    ? [d.types[0], d.types[1], d.types[2]]
                    : [r.slots[0]?.type, r.slots[1]?.type, r.slots[2]?.type];
                const rShip = d ? d.shipId : r.shipId;
                return `
              <tr data-name="${esc(r.name)}" style="cursor:pointer;border-top:1px solid #221e19;${selected === r.name ? 'background:#2f2a20;' : ''}">
                <td style="padding:6px 10px;color:${r.layer === '一级' ? '#8fc4f0' : r.layer === '二级' ? '#f0c86a' : '#c0a0e0'};">${r.layer}</td>
                <td style="padding:6px 10px;color:#e8e0d0;">${esc(r.name)}</td>
                <td style="padding:6px 10px;color:#a89f8f;">${MODE_LABEL[rMode] ?? rMode}</td>
                ${[0, 1, 2].map(i => {
                    const t = rTypes[i];
                    const c = d ? (rCnt[i] ?? 0) : (r.slots[i]?.count ?? 0);
                    return `<td style="padding:4px 10px;color:#d8c898;">
                      <div style="display:flex;align-items:center;gap:6px;">
                        ${t ? `<canvas data-uid="${esc(t)}" width="36" height="36" style="width:36px;height:36px;background:#141210;border-radius:3px;image-rendering:pixelated;flex:0 0 36px;"></canvas>` : ''}
                        <span>${esc(cn(t ?? '—'))}<span style="color:#6a6358;"> ×${c}</span></span>
                      </div></td>`;
                }).join('')}
                <td style="padding:4px 10px;color:#d8c898;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    ${rShip ? `<canvas data-uid="${esc(shipUnitId(rShip))}" width="36" height="36" style="width:36px;height:36px;background:#141210;border-radius:3px;image-rendering:pixelated;flex:0 0 36px;"></canvas>` : ''}
                    <span>${esc(shipLabel(rShip))}</span>
                  </div></td>
                <td style="padding:6px 10px;color:${r.users ? '#8a8378' : '#e07a7a'};">${r.users || '无'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="width:420px;border-left:1px solid #2a2520;overflow:auto;padding:14px;">
        ${sel && draft ? `
          <div style="font-size:16px;color:#f6e05e;">${esc(sel.name)}</div>
          <div style="font-size:12px;color:#8a8378;margin:4px 0 14px;">
            ${sel.layer}军团 · ${sel.users ? `${sel.users} 家势力在用` : '当前无势力使用'}
          </div>

          ${sel.layer === '一级' ? `
            <div style="font-size:11px;color:#6a6358;margin-bottom:14px;line-height:1.7;">
              一级 16 母体是底座军团，不可改名。
            </div>` : `
            <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">军团名</div>
            <div style="display:flex;gap:6px;margin-bottom:14px;">
              <input id="lp-rename" value="${esc(sel.name)}" maxlength="24"
                style="flex:1;min-width:0;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:7px 9px;">
              <button id="lp-rename-go" style="flex:0 0 auto;padding:7px 12px;background:#2a2520;border:1px solid #5a5040;color:#e0d8c0;border-radius:4px;font-size:13px;cursor:pointer;white-space:nowrap;">✏️ 改名</button>
            </div>`}

          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">阵型</div>
          <select id="lp-mode" style="width:100%;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:7px 9px;margin-bottom:14px;">
            ${(Object.keys(MODE_ROWS) as FormationMode[]).map(m =>
                `<option value="${m}" ${draft!.mode === m ? 'selected' : ''}>${MODE_LABEL[m]}</option>`).join('')}
          </select>

          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">舰队（战船）</div>
          <div id="lp-ship-card" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;
               background:#151310;border:1px solid #3a342c;border-radius:4px;padding:7px 9px;cursor:pointer;">
            <canvas id="lp-thumb-ship" width="64" height="64"
              style="width:64px;height:64px;flex:0 0 64px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
            <div style="flex:1;min-width:0;">
              <div style="color:#e8e0d0;font-size:13px;">${esc(shipLabel(draft!.shipId))}</div>
              <div style="color:#6a6358;font-size:11px;">
                ${esc(subLabelOf(shipUnitId(draft!.shipId)))} · 点击更换
              </div>
            </div>
            <span style="color:#8a8378;font-size:16px;">▾</span>
          </div>

          ${['前排尖刀', '中坚突击', '后排底边'].map((label, i) => `
            <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">${label} · ${rowCnt[i]} 人</div>
            <div class="lp-unit" data-row="${i}" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;
                 background:#151310;border:1px solid #3a342c;border-radius:4px;padding:7px 9px;cursor:pointer;">
              <canvas id="lp-thumb-${i}" width="64" height="64"
                style="width:64px;height:64px;flex:0 0 64px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
              <div style="flex:1;min-width:0;">
                <div style="color:#e8e0d0;font-size:13px;">${esc(cn(draft!.types[i]))}</div>
                <div style="color:#6a6358;font-size:11px;">
                  ${esc(subLabelOf(draft!.types[i]))} · 点击更换
                </div>
              </div>
              <span style="color:#8a8378;font-size:16px;">▾</span>
            </div>`).join('')}

          <button id="lp-save" style="width:100%;padding:10px;background:${dirty ? '#5a3c28' : '#2a2520'};border:1px solid ${dirty ? '#8a6038' : '#3a342c'};color:#fff;border-radius:4px;font-size:14px;cursor:pointer;">
            💾 保存军团编制${dirty ? '（有改动未保存）' : ''}
          </button>
          <button id="lp-reset" style="width:100%;padding:7px;margin-top:8px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:4px;font-size:12px;cursor:pointer;">
            ↺ 放弃改动
          </button>
          ${sel.layer === '三级' ? `
            <button id="lp-delete" style="width:100%;padding:7px;margin-top:18px;background:#3a1a1a;border:1px solid #7a3a3a;color:#e0a0a0;border-radius:4px;font-size:12px;cursor:pointer;">
              🗑 删除这支军团${sel.users ? `（${sel.users} 家势力会回落到文化区军团）` : ''}
            </button>` : `
            <div style="font-size:11px;color:#6a6358;margin-top:18px;line-height:1.7;">
              ${sel.layer}军团不可删除（一级 16 母体是底座，二级 59 文明是定数）。
            </div>`}
          <div style="font-size:11px;color:#6a6358;margin-top:14px;line-height:1.7;">
            保存只写这一支军团那一条记录，<b>不碰势力归属</b>。<br>
            用它的势力会自动跟着变，不需要同步。
          </div>
        ` : '<div style="color:#6a6358;font-size:13px;padding-top:40px;text-align:center;">左边点一支军团</div>'}
      </div>
    </div>`;

    const listBox = document.getElementById('lp-list');
    if (listBox && keepScroll > 0) listBox.scrollTop = keepScroll;

    const search = document.getElementById('lp-search') as HTMLInputElement | null;
    search?.addEventListener('compositionstart', () => { composing = true; });
    search?.addEventListener('compositionend', e => {
        composing = false;
        keyword = (e.target as HTMLInputElement).value;
        render();
        const s = document.getElementById('lp-search') as HTMLInputElement;
        s.focus(); s.setSelectionRange(s.value.length, s.value.length);
    });
    search?.addEventListener('input', e => {
        keyword = (e.target as HTMLInputElement).value;
        if (composing) return;                 // 拼音还在组合中，绝不能重建输入框
        render();
        const s = document.getElementById('lp-search') as HTMLInputElement;
        s.focus(); s.setSelectionRange(s.value.length, s.value.length);
    });
    document.getElementById('lp-layer')?.addEventListener('change', e => {
        layerFilter = (e.target as HTMLSelectElement).value as Layer | '全部';
        render();
    });
    document.getElementById('lp-new')?.addEventListener('click', () => { openCreateDialog(); });
    document.getElementById('lp-sort-users')?.addEventListener('click', () => {
        sortByUsers = sortByUsers === 'none' ? 'desc' : sortByUsers === 'desc' ? 'asc' : 'none';
        render();
    });
    host.querySelectorAll('tbody tr').forEach(tr => {
        tr.addEventListener('click', () => {
            selected = (tr as HTMLElement).dataset.name!;
            draft = null;
            render();
        });
    });
    const renameGo = document.getElementById('lp-rename-go');
    const renameIn = document.getElementById('lp-rename') as HTMLInputElement | null;
    renameGo?.addEventListener('click', () => { void rename(renameIn?.value ?? ''); });
    renameIn?.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') void rename(renameIn.value);
    });

    document.getElementById('lp-mode')?.addEventListener('change', e => {
        if (draft) draft.mode = (e.target as HTMLSelectElement).value as FormationMode;
        render();
    });
    document.getElementById('lp-ship-card')?.addEventListener('click', () => {
        if (!draft) return;
        // 选船走和三排兵种同一个弹窗（带图带子分类）：选中即写 draft.shipId，保存沿用 shipId 那条落盘路径
        openUnitPicker(-1, uid => { draft!.shipId = uid.toUpperCase(); render(); }, shipUnitId(draft.shipId), 'ship');
    });
    host.querySelectorAll('.lp-unit').forEach(el => {
        el.addEventListener('click', () => {
            openUnitPicker(Number((el as HTMLElement).dataset.row));
        });
    });
    // 兵种图：列表用懒加载（滚进视口才画），右侧三排 + 舰队那张立刻画
    observeThumbs(host);
    if (draft) {
        for (let i = 0; i < 3; i++) {
            const c = document.getElementById('lp-thumb-' + i) as HTMLCanvasElement | null;
            if (c && draft.types[i]) void drawUnitThumb(c, draft.types[i]);
        }
        const shipCv = document.getElementById('lp-thumb-ship') as HTMLCanvasElement | null;
        if (shipCv && draft.shipId) void drawUnitThumb(shipCv, shipUnitId(draft.shipId));
    }

    document.getElementById('lp-reset')?.addEventListener('click', () => { draft = null; render(); });
    document.getElementById('lp-save')?.addEventListener('click', () => { void save(); });
    document.getElementById('lp-delete')?.addEventListener('click', () => { void remove(); });
}

/**
 * 改名。一个军团名在三处各存一份（军团自身记录 / 势力专属归属 / 文化区默认指针），
 * 服务端 `/api/rename-legion` 三处同改并带条数自检，这里只管交互与本地内存刷新。
 * 🔴 有未保存的编制改动时先拦下来——改名会重新拉表，草稿会丢。
 */
async function rename(raw: string): Promise<void> {
    const oldName = selected;
    const newName = (raw ?? '').trim();
    if (!oldName) return;
    if (!newName || newName === oldName) return;
    const sel = rows.find(r => r.name === oldName);
    if (sel && draft && (draft.mode !== sel.mode
        || draft.types.join(',') !== sel.slots.map(s => s.type).join(','))) {
        toast('⚠️ 先保存或放弃编制改动，再改名', true);
        return;
    }
    if (rows.some(r => r.name === newName)) {
        toast(`❌ 【${newName}】已存在，一个军团名只能有一种编制`, true);
        return;
    }
    try {
        const res = await fetch('/api/rename-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName, newName }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        renameLegionInMemory(oldName, newName);
        selected = newName;
        draft = null;
        rows = buildRows();
        render();
        toast(`✏️ 【${oldName}】→【${newName}】　势力归属 ${json.factions} 处 · 文化区指针 ${json.cultures} 处已同改`);
    } catch (e) {
        toast('❌ 改名失败：' + ((e as Error)?.message ?? String(e)), true);
    }
}

/**
 * 新建军团 —— 🔴 [2026-09-16 主人定「添加一个功能，新建军团。一律属于三级」]
 *
 * 一级 16 母体与二级 59 文明是定数，只能改不能增，所以新建的**一律落三级表**。
 * 弹窗要填三样：
 *   · 军团名：命名法「时代 + 民族 + 军团」（如「城堡时代宋禁军团」），三层里不许重名
 *   · 归属军团 parentLegion：一级 16 或二级 59 里的一支（三级表这个字段是必填）
 *   · 阵型：七阵型之一，三排人数总和恒为 9
 * 三排兵种先照抄归属军团的，战船 shipId 也跟归属军团走 —— 新建出来就是一支能用的军团，
 * 主人再点进去逐排改。绝不留空位：空兵种在渲染层会掉回默认集。
 */
function openCreateDialog(): void {
    document.getElementById('lp-create')?.remove();
    const parents = rows.filter(r => r.layer === '一级' || r.layer === '二级');
    let parentName = parents[0]?.name ?? '';
    let mode: FormationMode = 'square';
    let name = '';
    /** 三排兵种：默认照抄归属军团，点一下就能换成任意兵种 */
    let types: [string, string, string] = ['', '', ''];
    /** 哪几排是主人自己点过的 —— 换归属军团时只刷没点过的那几排，别把手选的覆盖掉 */
    const touched = [false, false, false];

    const syncFromParent = (): void => {
        const p = rows.find(r => r.name === parentName);
        for (let i = 0; i < 3; i++) {
            if (touched[i] && types[i]) continue;
            types[i] = p?.slots[i]?.type ?? p?.slots[0]?.type ?? '';
        }
    };
    syncFromParent();

    const overlay = document.createElement('div');
    overlay.id = 'lp-create';
    overlay.style.cssText = `position:fixed;inset:0;z-index:16000;background:rgba(0,0,0,.72);
        display:flex;align-items:center;justify-content:center;`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    const box = document.createElement('div');
    box.style.cssText = `width:min(600px,92vw);max-height:92vh;overflow:auto;background:#141210;
        border:1px solid #3a342c;border-radius:6px;padding:18px;color:#e8e0d0;`;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const paint = (): void => {
        const cnt = MODE_ROWS[mode];
        box.innerHTML = `
          <div style="font-size:16px;color:#f6e05e;margin-bottom:4px;">新建军团</div>
          <div style="font-size:11px;color:#6a6358;margin-bottom:14px;line-height:1.7;">
            新建的军团一律是<b>三级</b>（一级 16 母体与二级 59 文明是定数，只能改不能增）。<br>
            命名法：时代 + 民族 + 军团，例「城堡时代宋禁军团」。
          </div>
          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">军团名</div>
          <input id="lp-c-name" maxlength="24" placeholder="如：城堡时代宋禁军团" value="${esc(name)}"
            style="width:100%;box-sizing:border-box;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:8px 9px;margin-bottom:14px;">
          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">归属军团（一级 16 / 二级 59）</div>
          <select id="lp-c-parent" style="width:100%;box-sizing:border-box;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:8px 9px;margin-bottom:14px;">
            ${parents.map(p => `<option value="${esc(p.name)}" ${p.name === parentName ? 'selected' : ''}>${p.layer}　${esc(p.name)}</option>`).join('')}
          </select>
          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">阵型</div>
          <select id="lp-c-mode" style="width:100%;box-sizing:border-box;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:8px 9px;margin-bottom:14px;">
            ${(Object.keys(MODE_ROWS) as FormationMode[]).map(m => `<option value="${m}" ${m === mode ? 'selected' : ''}>${MODE_LABEL[m]}</option>`).join('')}
          </select>
          ${['前排尖刀', '中坚突击', '后排底边'].map((label, i) => `
            <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">${label} · ${cnt[i]} 人${touched[i] ? '' : '　<span style="color:#6a6358;">（照抄归属军团，可点换）</span>'}</div>
            <div class="lp-c-unit" data-row="${i}" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;
                 background:#151310;border:1px solid #3a342c;border-radius:4px;padding:7px 9px;cursor:pointer;">
              <canvas id="lp-c-thumb-${i}" width="64" height="64"
                style="width:64px;height:64px;flex:0 0 64px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
              <div style="flex:1;min-width:0;">
                <div style="color:#e8e0d0;font-size:13px;">${esc(cn(types[i]))}</div>
                <div style="color:#6a6358;font-size:11px;">${esc(subLabelOf(types[i]))} · 点击更换</div>
              </div>
              <span style="color:#8a8378;font-size:16px;">▾</span>
            </div>`).join('')}
          <div style="display:flex;gap:8px;margin-top:4px;">
            <button id="lp-c-go" style="flex:1;padding:9px;background:#2a4a2a;border:1px solid #4a7a4a;color:#d0e8d0;border-radius:4px;font-size:14px;cursor:pointer;">✅ 建立</button>
            <button id="lp-c-cancel" style="flex:0 0 100px;padding:9px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:4px;font-size:13px;cursor:pointer;">取消</button>
          </div>`;
        for (let i = 0; i < 3; i++) {
            const cv = document.getElementById('lp-c-thumb-' + i) as HTMLCanvasElement | null;
            if (cv && types[i]) drawUnitThumb(cv, types[i]);
        }
        const nameIn = document.getElementById('lp-c-name') as HTMLInputElement;
        nameIn.addEventListener('input', e => { name = (e.target as HTMLInputElement).value; });
        document.getElementById('lp-c-parent')?.addEventListener('change', e => {
            parentName = (e.target as HTMLSelectElement).value;
            syncFromParent();
            paint();
        });
        document.getElementById('lp-c-mode')?.addEventListener('change', e => {
            mode = (e.target as HTMLSelectElement).value as FormationMode;
            paint();
        });
        box.querySelectorAll('.lp-c-unit').forEach(el => el.addEventListener('click', () => {
            const i = Number((el as HTMLElement).dataset.row);
            openUnitPicker(i, uid => { types[i] = uid; touched[i] = true; paint(); }, types[i]);
        }));
        document.getElementById('lp-c-cancel')?.addEventListener('click', () => overlay.remove());
        document.getElementById('lp-c-go')?.addEventListener('click', () => {
            void createLegion(name, parentName, mode, types, overlay);
        });
    };
    paint();
    (document.getElementById('lp-c-name') as HTMLInputElement)?.focus();
}

async function createLegion(
    rawName: string,
    parentName: string,
    mode: FormationMode,
    types: [string, string, string],
    overlay: HTMLElement,
): Promise<void> {
    const name = (rawName ?? '').trim();
    if (!name) { toast('❌ 请先填军团名', true); return; }
    if (rows.some(r => r.name === name)) { toast(`❌ 【${name}】已存在，一个军团名只能有一种编制`, true); return; }
    const parent = getLegionCompositionByName(parentName);
    if (!parent) { toast(`❌ 归属军团【${parentName}】查不到编制`, true); return; }
    const cnt = MODE_ROWS[mode];
    // 兵种用弹窗里选好的那三个；人数按阵型走（三排总和恒 9，与选兵种无关）
    const slots = [0, 1, 2].map(i => ({ type: types[i], count: cnt[i] }));
    if (slots.some(sl => !sl.type)) { toast('❌ 三排兵种要选全', true); return; }
    try {
        const res = await fetch('/api/create-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                legionName: name,
                formationMode: mode,
                slots,
                parentLegion: parentName,
                shipId: parent.shipId ?? '',
            }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        patchLegionComposition(name, slots, mode);   // 不等 HMR，立刻可见可编
        runtimeCreated.add(name);
        overlay.remove();
        selected = name;
        draft = null;
        rows = buildRows();
        render();
        toast(`✅ 已新建三级军团【${name}】（归属 ${parentName}）：${slots.map(sl => cn(sl.type) + '×' + sl.count).join('　')}`);
    } catch (e) {
        toast('❌ 新建失败：' + ((e as Error)?.message ?? String(e)), true);
    }
}

async function save(): Promise<void> {
    if (!selected || !draft) return;
    const counts = MODE_ROWS[draft.mode];
    const slots = draft.types.map((type, i) => ({ type, count: counts[i] }));
    const prevShip = rows.find(r => r.name === selected)?.shipId ?? '';
    const shipChanged = (draft.shipId ?? '') !== prevShip;
    try {
        const res = await fetch('/api/save-legion-composition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ legionName: selected, formationMode: draft.mode, slots }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        patchLegionComposition(selected, slots, draft.mode, draft.shipId || undefined);
        if (shipChanged && draft.shipId) {
            const shipRes = await fetch('/api/save-legion-ship', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ legionName: selected, shipId: draft.shipId }),
            });
            const shipJson = await shipRes.json();
            if (!shipRes.ok || !shipJson.ok) throw new Error(shipJson.error ?? `HTTP ${shipRes.status}`);
        }
        rows = buildRows();
        draft = null;
        render();
        toast(`✅ 【${selected}】编制已保存（写入 ${json.file}）`);
    } catch (e) {
        toast('❌ 保存失败：' + ((e as Error)?.message ?? String(e)), true);
    }
}

async function remove(): Promise<void> {
    if (!selected) return;
    const name = selected;
    // 🔴 [2026-09-16 主人定] 删除前先把「谁要重排、各自去哪」算出来给主人看：
    //    看武将时代 + 据点建筑风格 → 二级有同时代的就进二级，没有就退该风格的母体一级军团。
    //    规则与样例见 src/systems/LegionFallbackOnDelete.ts 文件头。
    const plan = planFallbackForDeletedLegion(name);
    const toL2 = plan.items.filter((i) => i.via === 'level2').length;
    const toL1 = plan.items.length - toL2;
    const affected = plan.items.length + plan.skipped.length;
    const lines = plan.items.slice(0, 8).map((i) => '  · ' + i.note).join('\n');
    const more = plan.items.length > 8 ? '\n  …另有 ' + (plan.items.length - 8) + ' 家' : '';
    const skipTip = plan.skipped.length
        ? '\n判不了时代/风格的 ' + plan.skipped.length + ' 家将跟随文化区：\n  · '
            + plan.skipped.slice(0, 5).map((s) => s.factionId + '（' + s.reason + '）').join('\n  · ')
        : '';
    if (!window.confirm(
        '确定删除军团【' + name + '】？\n\n用它的 ' + affected + ' 家势力将重新安置'
        + '（二级 ' + toL2 + ' / 一级 ' + toL1 + '）：\n' + lines + more + skipTip,
    )) return;
    try {
        const res = await fetch('/api/delete-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ legionName: name }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        const applied = await applyFallbackPlan(plan);
        // 判不了时代/风格的：保持旧行为，清空条目让它跟随文化区
        for (const sk of plan.skipped) {
            await fetch('/api/save-faction-legion', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ factionId: sk.factionId, legionName: null }),
            });
        }
        dropLegionFromMemory(name);
        selected = null;
        draft = null;
        rows = buildRows();
        render();
        toast(
            `🗑 已删除军团【${name}】：重排 ${applied.ok} 家（二级 ${toL2} / 一级 ${toL1}）`
            + (applied.failed.length ? `，${applied.failed.length} 家写入失败` : '')
            + (plan.skipped.length ? `，${plan.skipped.length} 家判不了已跟随文化区` : ''),
            applied.failed.length > 0,
        );
        if (applied.failed.length) console.error('[DeleteLegion] 写入失败：', applied.failed);
    } catch (e) {
        toast('❌ 删除失败：' + ((e as Error)?.message ?? String(e)), true);
    }
}

/** 把「军团编辑」挂进军团方阵页的主区（与其它视图页签并排，不另开页、不做浮层） */
export function mountLegionPanel(container: HTMLElement): void {
    host = container;
    rows = buildRows();
    render();
}
