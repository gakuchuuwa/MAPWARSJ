/**
 * 「非科技树兵种」视图 —— de-wiki 的新模式页签
 *
 * 数据来自 public/de-techtree/offtree-units.json（由 tools/gen-de-offtree-units.mjs 生成）：
 *   · 来源 = wiki 的不可训练单位清单（78 条）+ 英雄列表页（AoE2 216 / Chronicles 27）+ 分类补充
 *   · 与本地 DE 数据（strings-en/zh 官方名、兵种表、SUCAI 贴图）交叉核对
 *
 * 默认只显示「兵种」（步兵/骑兵/远程/攻城/海军）—— 动物、平民、物件、秘籍玩笑单位默认收起。
 */

export type OffTreeBucket = 'combat' | 'hero' | 'animal' | 'civilian' | 'object' | 'joke' | 'other';

export interface OffTreeUnit {
    name_en: string;
    name_zh: string;
    cls: 'infantry' | 'cavalry' | 'ranged' | 'siege' | 'naval' | 'hero' | 'other';
    bucket: OffTreeBucket;
    game: 'aoe2' | 'chronicles';
    kind: string;
    gaia: boolean;
    hasUpgrade: boolean;
    removed: boolean;
    inCatalog: boolean;
    catalogId: string | null;
    catalogName: string | null;
    iconUrl: string | null;
    spriteUrl: string | null;
    spriteDir?: string;
    wikiUrl: string | null;
    note: string;
}

interface OffTreeData {
    generatedAt: string;
    sources: Record<string, string>;
    totals: Record<string, number>;
    units: OffTreeUnit[];
}

const CLS_LABEL: Record<string, string> = {
    infantry: '步兵', cavalry: '骑兵', ranged: '远程', siege: '攻城', naval: '海军', hero: '英雄', other: '其他',
};
const CLS_ICON: Record<string, string> = {
    infantry: '🛡️', cavalry: '🐎', ranged: '🏹', siege: '⚙️', naval: '🚢', hero: '👑', other: '📦',
};
const BUCKET_LABEL: Record<string, string> = {
    combat: '战斗兵种', hero: '英雄', animal: '动物/野怪', civilian: '平民/器械', object: '物件', joke: '秘籍玩笑单位', other: '其他',
};

let cache: OffTreeData | null = null;
async function loadData(): Promise<OffTreeData> {
    if (cache) return cache;
    const res = await fetch('/de-techtree/offtree-units.json');
    if (!res.ok) throw new Error('offtree-units.json 读取失败: ' + res.status);
    cache = (await res.json()) as OffTreeData;
    return cache;
}

const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

const STYLE_ID = 'de-offtree-style';
function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .de-offtree-wrap { padding: 4px 0 60px; }
      .de-offtree-head { display:flex; flex-wrap:wrap; align-items:flex-end; gap:14px; border-bottom:1px solid var(--de-border-gold); padding-bottom:14px; margin-bottom:16px; }
      .de-offtree-head h2 { font-family: var(--font-serif); color: var(--de-gold-light); font-size: 22px; margin: 0; }
      .de-offtree-head p { margin:4px 0 0; font-size:12px; color: var(--de-text-dim); max-width: 1000px; line-height:1.6; }
      .de-offtree-pills { display:flex; gap:8px; flex-wrap:wrap; margin-left:auto; }
      .de-offtree-pill { background: rgba(0,0,0,.35); border:1px solid var(--de-border); border-radius:6px; padding:6px 12px; text-align:center; min-width:78px; }
      .de-offtree-pill .n { display:block; font-size:18px; font-weight:bold; color: var(--de-gold-primary); font-family: var(--font-serif); }
      .de-offtree-pill .l { font-size:10px; color: var(--de-text-dim); letter-spacing:.5px; }
      .de-offtree-bar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:10px; }
      .de-offtree-chips { display:flex; gap:6px; flex-wrap:wrap; }
      .de-offtree-chip { background: transparent; border:1px solid var(--de-border); color: var(--de-text-dim); border-radius:999px; padding:4px 12px; font-size:12px; cursor:pointer; transition:all .15s; }
      .de-offtree-chip:hover { border-color: var(--de-gold-primary); color: var(--de-gold-light); }
      .de-offtree-chip.active { background: rgba(212,175,55,.16); border-color: var(--de-gold-primary); color:#fff; font-weight:bold; }
      .de-offtree-chip.off { opacity:.45; }
      .de-offtree-search { background: rgba(0,0,0,.4); border:1px solid var(--de-border); color: var(--de-text-parchment); border-radius:5px; padding:6px 12px; font-size:13px; min-width:240px; }
      .de-offtree-count { font-size:12px; color: var(--de-text-dim); margin-left:auto; }
      .de-offtree-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(232px, 1fr)); gap:12px; }
      .de-offtree-card { display:flex; gap:10px; background: var(--de-bg-card); border:1px solid var(--de-border); border-radius:6px; padding:10px; cursor:pointer; transition:all .15s; position:relative; }
      .de-offtree-card:hover { border-color: var(--de-gold-primary); transform: translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.45); }
      .de-offtree-thumb { width:56px; height:56px; flex:0 0 56px; background:#141210; border:1px solid #3a3225; border-radius:4px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
      .de-offtree-thumb img { max-width:100%; max-height:100%; image-rendering: pixelated; object-fit: contain; }
      .de-offtree-thumb .ph { font-size:22px; opacity:.75; }
      .de-offtree-name { font-size:13px; font-weight:bold; color:#fff8e8; line-height:1.25; }
      .de-offtree-en { font-size:11px; color:#8ab4c4; font-family: monospace; margin-top:2px; word-break:break-word; }
      .de-offtree-tags { display:flex; gap:4px; flex-wrap:wrap; margin-top:6px; }
      .de-offtree-tag { font-size:10px; padding:1px 6px; border-radius:3px; border:1px solid #3a3225; color:#cbb98e; background: rgba(0,0,0,.3); }
      .de-offtree-tag.ok { color:#8fdc9b; border-color:#2f5a35; }
      .de-offtree-tag.miss { color:#e8a0a0; border-color:#5a2f2f; }
      .de-offtree-tag.chr { color:#d8c0ff; border-color:#4a3a6a; }
      .de-offtree-note { padding:12px 14px; background: rgba(0,0,0,.35); border:1px solid var(--de-border); border-radius:6px; font-size:12px; color: var(--de-text-dim); line-height:1.7; margin-top:18px; }
      .de-offtree-note b { color: var(--de-gold-light); }
      .de-offtree-empty { color: var(--de-text-dim); font-size:13px; padding:24px; text-align:center; }
      .de-offtree-modal { position:fixed; inset:0; background: rgba(0,0,0,.72); display:none; align-items:center; justify-content:center; z-index:12000; }
      .de-offtree-modal.open { display:flex; }
      .de-offtree-modal-box { background: var(--de-bg-darker); border:1px solid var(--de-border-gold); border-radius:8px; max-width:620px; width:calc(100% - 40px); max-height:82vh; overflow:auto; padding:20px 22px; position:relative; }
      .de-offtree-modal-box h3 { font-family: var(--font-serif); color: var(--de-gold-light); margin:0 0 2px; font-size:19px; }
      .de-offtree-modal-close { position:absolute; top:10px; right:12px; background:none; border:none; color:#cbb98e; font-size:18px; cursor:pointer; }
      .de-offtree-kv { display:grid; grid-template-columns:110px 1fr; gap:6px 10px; font-size:13px; margin-top:14px; }
      .de-offtree-kv .k { color: var(--de-text-dim); }
      .de-offtree-kv .v { color: var(--de-text-parchment); }
      .de-offtree-kv a { color: var(--de-gold-primary); }
    `;
    document.head.appendChild(s);
}

interface ViewState {
    scopes: Record<OffTreeBucket, boolean>;
    cls: string;
    game: string;
    catalog: string;
    q: string;
}

const DEFAULT_SCOPES: Record<OffTreeBucket, boolean> = {
    combat: true, hero: false, animal: false, civilian: false, object: false, joke: false, other: false,
};

export function mountOffTreeView(host: HTMLElement): void {
    if (host.dataset.mounted === '1') return;
    host.dataset.mounted = '1';
    injectStyle();

    const state: ViewState = { scopes: { ...DEFAULT_SCOPES }, cls: 'all', game: 'all', catalog: 'all', q: '' };
    let data: OffTreeData | null = null;

    host.innerHTML = `<div class="de-offtree-wrap">
        <div class="de-offtree-head">
          <div>
            <h2>🧩 非科技树兵种 · 特殊单位总览</h2>
            <p>这些单位<strong>不出现在任何文明的科技树里</strong>，属于场景编辑器专属 / 战役限定 / 秘籍单位 —— 例如 Chronicles 的 Sparabara（波斯持盾步兵），
            同时与本地兵种表交叉标出「已收录 / 未收录」和贴图素材情况。数据源：wiki 不可训练单位清单 + 英雄列表页 + 本仓库 DE 提取数据。</p>
          </div>
          <div class="de-offtree-pills" id="de-offtree-pills"></div>
        </div>
        <div class="de-offtree-bar">
          <span style="font-size:12px;color:var(--de-text-dim);">显示范围：</span>
          <div class="de-offtree-chips" id="de-offtree-scopes"></div>
        </div>
        <div class="de-offtree-bar">
          <span style="font-size:12px;color:var(--de-text-dim);">兵种类别：</span>
          <div class="de-offtree-chips" id="de-offtree-cls"></div>
          <span style="font-size:12px;color:var(--de-text-dim);margin-left:8px;">来源：</span>
          <div class="de-offtree-chips" id="de-offtree-game"></div>
          <div class="de-offtree-chips" id="de-offtree-catalog"></div>
          <input id="de-offtree-search" class="de-offtree-search" type="search" placeholder="🔍 搜索 兵种中文名 / 英文名 / ID…" />
          <span class="de-offtree-count" id="de-offtree-count"></span>
        </div>
        <div class="de-offtree-grid" id="de-offtree-grid"><div class="de-offtree-empty">加载中…</div></div>
        <div class="de-offtree-note" id="de-offtree-note"></div>
        <div class="de-offtree-modal" id="de-offtree-modal">
          <div class="de-offtree-modal-box">
            <button class="de-offtree-modal-close" id="de-offtree-modal-close">✕</button>
            <div id="de-offtree-modal-body"></div>
          </div>
        </div>
      </div>`;

    const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>(`#${id}`)!;

    const renderScopes = () => {
        $('de-offtree-scopes').innerHTML = (Object.keys(BUCKET_LABEL) as OffTreeBucket[])
            .map((b) => {
                const on = state.scopes[b];
                const n = data ? data.units.filter((u) => u.bucket === b).length : 0;
                return `<button class="de-offtree-chip ${on ? 'active' : 'off'}" data-scope="${b}">${on ? '☑' : '☐'} ${BUCKET_LABEL[b]} ${n}</button>`;
            }).join('');
        $('de-offtree-scopes').querySelectorAll<HTMLElement>('[data-scope]').forEach((el) => {
            el.addEventListener('click', () => {
                const b = el.dataset.scope as OffTreeBucket;
                state.scopes[b] = !state.scopes[b];
                renderScopes();
                renderGrid();
            });
        });
    };

    const renderPills = () => {
        if (!data) return;
        const t = data.totals;
        const items: Array<[string, number | string, string]> = [
            ['兵种总数', t.combat, 'combat'],
            ['└ AoE2 本体', t.combatAoe2, ''],
            ['└ Chronicles', t.combatChronicles, ''],
            ['英雄', t.hero, ''],
            ['动物/野怪', t.animal, ''],
            ['平民/器械', t.civilian, ''],
            ['秘籍玩笑', t.joke, ''],
            ['已收录进本作', `${t.inCatalog}/${t.all}`, ''],
        ];
        $('de-offtree-pills').innerHTML = items
            .map(([l, n]) => `<div class="de-offtree-pill"><span class="n">${n}</span><span class="l">${l}</span></div>`)
            .join('');
    };

    const renderStaticChips = () => {
        const clsItems: Array<[string, string]> = [['all', '全部'], ['infantry', '步兵'], ['cavalry', '骑兵'], ['ranged', '远程'], ['siege', '攻城'], ['naval', '海军'], ['hero', '英雄'], ['other', '其他']];
        $('de-offtree-cls').innerHTML = clsItems.map(([v, l]) => `<button class="de-offtree-chip ${state.cls === v ? 'active' : ''}" data-cls="${v}">${l}</button>`).join('');
        $('de-offtree-cls').querySelectorAll<HTMLElement>('[data-cls]').forEach((el) => el.addEventListener('click', () => {
            state.cls = el.dataset.cls!; renderStaticChips(); renderGrid();
        }));

        const gameItems: Array<[string, string]> = [['all', '全部'], ['aoe2', 'AoE2 本体'], ['chronicles', 'Chronicles']];
        $('de-offtree-game').innerHTML = gameItems.map(([v, l]) => `<button class="de-offtree-chip ${state.game === v ? 'active' : ''}" data-game="${v}">${l}</button>`).join('');
        $('de-offtree-game').querySelectorAll<HTMLElement>('[data-game]').forEach((el) => el.addEventListener('click', () => {
            state.game = el.dataset.game!; renderStaticChips(); renderGrid();
        }));

        const catItems: Array<[string, string]> = [['all', '全部'], ['in', '✅ 已收录'], ['out', '❌ 未收录']];
        $('de-offtree-catalog').innerHTML = catItems.map(([v, l]) => `<button class="de-offtree-chip ${state.catalog === v ? 'active' : ''}" data-cat="${v}">${l}</button>`).join('');
        $('de-offtree-catalog').querySelectorAll<HTMLElement>('[data-cat]').forEach((el) => el.addEventListener('click', () => {
            state.catalog = el.dataset.cat!; renderStaticChips(); renderGrid();
        }));
    };

    const thumbHtml = (u: OffTreeUnit) => {
        if (u.spriteUrl) return `<img src="${esc(u.spriteUrl)}" alt="${esc(u.name_en)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ph',textContent:'${CLS_ICON[u.cls] ?? '📦'}'}))" />`;
        return `<span class="ph">${CLS_ICON[u.cls] ?? '📦'}</span>`;
    };

    const filtered = (): OffTreeUnit[] => {
        if (!data) return [];
        const q = state.q.trim().toLowerCase();
        return data.units.filter((u) => {
            if (!state.scopes[u.bucket]) return false;
            if (state.cls !== 'all' && u.cls !== state.cls) return false;
            if (state.game !== 'all' && u.game !== state.game) return false;
            if (state.catalog === 'in' && !u.inCatalog) return false;
            if (state.catalog === 'out' && u.inCatalog) return false;
            if (q) {
                const hay = `${u.name_zh} ${u.name_en} ${u.catalogId ?? ''} ${u.note}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    };

    const renderGrid = () => {
        const list = filtered();
        $('de-offtree-count').textContent = `当前显示 ${list.length} / ${data ? data.units.length : 0} 条`;
        if (!list.length) {
            $('de-offtree-grid').innerHTML = `<div class="de-offtree-empty">没有符合条件的单位（试试打开上方「显示范围」里的其它分类）</div>`;
            return;
        }
        $('de-offtree-grid').innerHTML = list.map((u, i) => `
          <div class="de-offtree-card" data-idx="${i}">
            <div class="de-offtree-thumb">${thumbHtml(u)}</div>
            <div style="min-width:0;">
              <div class="de-offtree-name">${esc(u.name_zh || u.name_en)}</div>
              <div class="de-offtree-en">${esc(u.name_en)}</div>
              <div class="de-offtree-tags">
                <span class="de-offtree-tag">${CLS_ICON[u.cls] ?? ''} ${CLS_LABEL[u.cls] ?? u.cls}</span>
                <span class="de-offtree-tag ${u.game === 'chronicles' ? 'chr' : ''}">${u.game === 'chronicles' ? 'Chronicles' : 'AoE2'}</span>
                ${u.inCatalog ? '<span class="de-offtree-tag ok">✅ 已收录</span>' : '<span class="de-offtree-tag miss">❌ 未收录</span>'}
                ${u.gaia ? '<span class="de-offtree-tag">Gaia</span>' : ''}
                ${u.hasUpgrade ? '<span class="de-offtree-tag">含精锐</span>' : ''}
                ${u.removed ? '<span class="de-offtree-tag">已移除</span>' : ''}
              </div>
            </div>
          </div>`).join('');

        $('de-offtree-grid').querySelectorAll<HTMLElement>('.de-offtree-card').forEach((card) => {
            card.addEventListener('click', () => openModal(list[Number(card.dataset.idx)]));
        });
    };

    const openModal = (u: OffTreeUnit) => {
        $('de-offtree-modal-body').innerHTML = `
          <h3>${esc(u.name_zh || u.name_en)}</h3>
          <div style="font-size:12px;color:#8ab4c4;font-family:monospace;">${esc(u.name_en)}</div>
          <div class="de-offtree-kv">
            <div class="k">分类</div><div class="v">${BUCKET_LABEL[u.bucket] ?? u.bucket} · ${CLS_LABEL[u.cls] ?? u.cls}</div>
            <div class="k">出处</div><div class="v">${u.game === 'chronicles' ? 'Chronicles（Battle for Greece / Alexander the Great）' : 'AoE2 本体及 DLC'} · ${esc(u.kind)}</div>
            <div class="k">科技树</div><div class="v">❌ 不在任何文明科技树中${u.gaia ? '（Gaia 专属）' : ''}</div>
            <div class="k">本作兵种表</div><div class="v">${u.inCatalog ? `✅ 已收录：<b>${esc(u.catalogName ?? '')}</b>（id: ${esc(u.catalogId ?? '')}）` : '❌ 未收录'}</div>
            <div class="k">贴图素材</div><div class="v">${u.spriteUrl ? `✅ ${esc(u.spriteDir ?? u.spriteUrl)}` : '—（未提取）'}</div>
            <div class="k">备注</div><div class="v">${esc(u.note || '—')}</div>
            <div class="k">Wiki</div><div class="v">${u.wikiUrl ? `<a href="${esc(u.wikiUrl)}" target="_blank" rel="noopener">${esc(u.wikiUrl)}</a>` : '—'}</div>
          </div>`;
        $('de-offtree-modal').classList.add('open');
    };

    $('de-offtree-modal-close').addEventListener('click', () => $('de-offtree-modal').classList.remove('open'));
    $('de-offtree-modal').addEventListener('click', (e) => { if (e.target === $('de-offtree-modal')) $('de-offtree-modal').classList.remove('open'); });
    $('de-offtree-search').addEventListener('input', (e) => { state.q = (e.target as HTMLInputElement).value; renderGrid(); });

    void (async () => {
        try {
            data = await loadData();
        } catch (err) {
            $('de-offtree-grid').innerHTML = `<div class="de-offtree-empty">数据加载失败：${esc(String(err))}</div>`;
            return;
        }
        renderPills();
        renderScopes();
        renderStaticChips();
        renderGrid();
        const t = data.totals;
        $('de-offtree-note').innerHTML = `
          <b>口径说明：</b>
          ①「兵种」＝ 步兵 / 骑兵 / 远程 / 攻城 / 海军等<strong>战斗单位</strong>，共 <b>${t.combat}</b> 个（AoE2 本体 ${t.combatAoe2} + Chronicles ${t.combatChronicles}），
          已收录进本作兵种表 ${t.combatInCatalog} 个、缺 ${t.combatMissing} 个；
          ② 英雄（${t.hero}）单列一类，默认收起 —— 它们同样不在科技树里，但通常是战役剧情人物；
          ③ 动物/野怪（${t.animal}）、平民器械（${t.civilian}）、秘籍玩笑单位（${t.joke}）默认收起，避免污染「兵种」口径；
          ④ 数据由 <code>tools/gen-de-offtree-units.mjs</code> 从 wiki + 本仓库已提取的 DE 数据生成，生成时间 ${esc(data.generatedAt)}。`;
    })();
}
