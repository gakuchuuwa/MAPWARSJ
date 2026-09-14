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
import {
    CULTURE_LEGION_NAMES,
    getLegionCompositionByName,
    patchLegionComposition,
    dropLegionFromMemory,
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
    const push = (name: string, layer: Layer) => {
        const c = getLegionCompositionByName(name);
        if (!c) return;
        out.push({ name, layer, mode: c.formationMode, slots: c.slots.map(s => ({ type: s.type, count: s.count })), users: users.get(name) ?? 0 });
    };
    for (const n of Object.values(BASE_16_LEGION_NAMES)) push(n, '一级');
    for (const l of LEVEL_2_CIV_59_LEGIONS) push(l.name, '二级');
    for (const l of LEVEL_3_LEGIONS) push(l.name, '三级');
    return out;
}

let rows: LegionRow[] = [];
let keyword = '';
let layerFilter: Layer | '全部' = '全部';
let selected: string | null = null;
/** 当前正在编辑的草稿（未保存） */
let draft: { mode: FormationMode; types: [string, string, string] } | null = null;
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

/** 选兵种：带图 + 按子分类分组的弹窗（2026-09-15 主人「选兵种的时候，要有图，要有子分类」） */
let pickerKeyword = '';
let pickerCat: string = 'all';

function openUnitPicker(rowIdx: number): void {
    if (!draft) return;
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

    const paint = (): void => {
        const kw = pickerKeyword.trim();
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
        box.innerHTML = `
          <div style="padding:10px 14px;border-bottom:1px solid #2a2520;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <b style="color:#f6e05e;">选兵种 · ${['前排', '中坚', '后排'][rowIdx]}</b>
            <input id="lp-pk-search" placeholder="搜兵种名 / 子分类 / ID" value="${esc(pickerKeyword)}"
              style="width:220px;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:6px 9px;">
            ${cats.map(c => `<button data-cat="${c}" class="lp-pk-cat" style="background:${pickerCat === c ? '#5a3c28' : '#243246'};
              border:1px solid ${pickerCat === c ? '#8a6038' : '#4a5568'};color:#e8e0d0;border-radius:4px;padding:5px 11px;cursor:pointer;font-size:12px;">
              ${c === 'all' ? '全部' : esc((CATEGORY_LABEL as Record<string, string>)[c] ?? c)}</button>`).join('')}
            <span style="color:#8a8378;font-size:12px;">${list.length} 个</span>
            <button id="lp-pk-close" style="margin-left:auto;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:4px;padding:5px 12px;cursor:pointer;">✕</button>
          </div>
          <div id="lp-pk-body" style="flex:1;overflow:auto;padding:12px 14px;">
            ${[...groups.entries()].map(([sub, us]) => `
              <div style="color:#c8a84b;font-size:12px;margin:10px 0 6px;border-bottom:1px solid #2a2520;padding-bottom:4px;">
                ${esc(sub)} <span style="color:#6a6358;">${us.length}</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;">
                ${us.map(u => `
                  <div class="lp-pk-card" data-uid="${esc(u.id)}" style="display:flex;gap:8px;align-items:center;
                       background:${u.id === draft!.types[rowIdx] ? '#3a2f1e' : '#201d18'};
                       border:1px solid ${u.id === draft!.types[rowIdx] ? '#c8a84b' : '#363024'};
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
            paint();
        }));
        document.getElementById('lp-pk-close')?.addEventListener('click', () => overlay.remove());
        box.querySelectorAll('.lp-pk-card').forEach(c => c.addEventListener('click', () => {
            if (draft) draft.types[rowIdx] = (c as HTMLElement).dataset.uid!;
            overlay.remove();
            render();
        }));
    };
    paint();
}

function visible(): LegionRow[] {
    const kw = keyword.trim();
    return rows.filter(r => {
        if (layerFilter !== '全部' && r.layer !== layerFilter) return false;
        if (!kw) return true;
        return r.name.includes(kw) || r.slots.some(s => cn(s.type).includes(kw));
    });
}

function render(): void {
    const list = visible();
    const sel = selected ? rows.find(r => r.name === selected) : null;
    if (sel && !draft) {
        draft = { mode: sel.mode, types: [sel.slots[0]?.type ?? '', sel.slots[1]?.type ?? '', sel.slots[2]?.type ?? ''] };
    }
    const counts = { 一级: 0, 二级: 0, 三级: 0 } as Record<Layer, number>;
    for (const r of rows) counts[r.layer]++;
    const rowCnt = draft ? MODE_ROWS[draft.mode] : [0, 0, 0];
    const dirty = !!(sel && draft && (draft.mode !== sel.mode
        || draft.types.join(',') !== sel.slots.map(s => s.type).join(',')));

    host.innerHTML = `
    <div style="padding:10px 14px;border-bottom:1px solid #2a2520;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <input id="lp-search" placeholder="搜军团名 / 兵种" value="${esc(keyword)}"
        style="width:230px;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:6px 9px;">
      <select id="lp-layer" style="background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:6px 9px;">
        ${(['全部', '一级', '二级', '三级'] as const).map(l =>
            `<option value="${l}" ${layerFilter === l ? 'selected' : ''}>${l}${l === '全部' ? `（${rows.length} 支）` : `（${counts[l as Layer]} 支）`}</option>`).join('')}
      </select>
      <span style="color:#8a8378;font-size:12px;">列出 ${list.length} 支</span>
    </div>

    <div style="flex:1;display:flex;min-height:0;">
      <div style="flex:1;overflow:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead style="position:sticky;top:0;background:#1a1714;">
            <tr style="color:#b8ab8e;text-align:left;">
              <th style="padding:7px 10px;">层级</th>
              <th style="padding:7px 10px;">军团名</th>
              <th style="padding:7px 10px;">阵型</th>
              <th style="padding:7px 10px;">前排</th>
              <th style="padding:7px 10px;">中坚</th>
              <th style="padding:7px 10px;">后排</th>
              <th style="padding:7px 10px;">势力</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(r => `
              <tr data-name="${esc(r.name)}" style="cursor:pointer;border-top:1px solid #221e19;${selected === r.name ? 'background:#2f2a20;' : ''}">
                <td style="padding:6px 10px;color:${r.layer === '一级' ? '#8fc4f0' : r.layer === '二级' ? '#f0c86a' : '#c0a0e0'};">${r.layer}</td>
                <td style="padding:6px 10px;color:#e8e0d0;">${esc(r.name)}</td>
                <td style="padding:6px 10px;color:#a89f8f;">${MODE_LABEL[r.mode] ?? r.mode}</td>
                ${[0, 1, 2].map(i => {
                    const u = r.slots[i];
                    return `<td style="padding:4px 10px;color:#d8c898;">
                      <div style="display:flex;align-items:center;gap:6px;">
                        ${u ? `<canvas data-uid="${esc(u.type)}" width="36" height="36" style="width:36px;height:36px;background:#141210;border-radius:3px;image-rendering:pixelated;flex:0 0 36px;"></canvas>` : ''}
                        <span>${esc(cn(u?.type ?? '—'))}<span style="color:#6a6358;"> ×${u?.count ?? 0}</span></span>
                      </div></td>`;
                }).join('')}
                <td style="padding:6px 10px;color:${r.users ? '#8a8378' : '#e07a7a'};">${r.users || '无'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div style="width:420px;border-left:1px solid #2a2520;overflow:auto;padding:14px;">
        ${sel && draft ? `
          <div style="font-size:16px;color:#f6e05e;">${esc(sel.name)}</div>
          <div style="font-size:12px;color:#8a8378;margin:4px 0 14px;">
            ${sel.layer}军团 · ${sel.users ? `${sel.users} 家势力在用` : '当前无势力使用'}
          </div>

          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">阵型</div>
          <select id="lp-mode" style="width:100%;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:7px 9px;margin-bottom:14px;">
            ${(Object.keys(MODE_ROWS) as FormationMode[]).map(m =>
                `<option value="${m}" ${draft!.mode === m ? 'selected' : ''}>${MODE_LABEL[m]}</option>`).join('')}
          </select>

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
    host.querySelectorAll('tbody tr').forEach(tr => {
        tr.addEventListener('click', () => {
            selected = (tr as HTMLElement).dataset.name!;
            draft = null;
            render();
        });
    });
    document.getElementById('lp-mode')?.addEventListener('change', e => {
        if (draft) draft.mode = (e.target as HTMLSelectElement).value as FormationMode;
        render();
    });
    host.querySelectorAll('.lp-unit').forEach(el => {
        el.addEventListener('click', () => {
            openUnitPicker(Number((el as HTMLElement).dataset.row));
        });
    });
    // 兵种图：列表用懒加载（滚进视口才画），右侧三张立刻画
    observeThumbs(host);
    if (draft) {
        for (let i = 0; i < 3; i++) {
            const c = document.getElementById('lp-thumb-' + i) as HTMLCanvasElement | null;
            if (c && draft.types[i]) void drawUnitThumb(c, draft.types[i]);
        }
    }

    document.getElementById('lp-reset')?.addEventListener('click', () => { draft = null; render(); });
    document.getElementById('lp-save')?.addEventListener('click', () => { void save(); });
    document.getElementById('lp-delete')?.addEventListener('click', () => { void remove(); });
}

async function save(): Promise<void> {
    if (!selected || !draft) return;
    const counts = MODE_ROWS[draft.mode];
    const slots = draft.types.map((type, i) => ({ type, count: counts[i] }));
    try {
        const res = await fetch('/api/save-legion-composition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ legionName: selected, formationMode: draft.mode, slots }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        patchLegionComposition(selected, slots, draft.mode);
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
    if (!window.confirm(`确定删除军团【${name}】？用它的势力会回落到所在文化区的军团。`)) return;
    try {
        const res = await fetch('/api/delete-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ legionName: name }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        dropLegionFromMemory(name);
        selected = null;
        draft = null;
        rows = buildRows();
        render();
        toast(`🗑 已删除军团【${name}】`);
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
