/**
 * MAPWAR 立绘调校（网格化批量对齐版）
 * 访问：http://localhost:5173/portrait-tuner.html
 */
import {
    PORTRAIT_ADJUST_NEUTRAL,
    PORTRAIT_GUIDE_PREVIEW_CHIN_LINE_Y,
    PORTRAIT_GUIDE_PREVIEW_CHEST_LINE_X,
    PORTRAIT_GUIDE_PREVIEW_EYE_LINE_Y,
    PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_CENTER_DX,
    PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_CENTER_DY,
    PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_H,
    PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_W,
    PORTRAIT_GUIDE_PREVIEW_TOP_LINE_Y,
    PORTRAIT_GUIDE_PREVIEW_WAIST_LINE_Y,
    applyPortraitAdjustToElement,
    applyPortraitEdgeMask,
    hasPortraitImageOverride,
    resolvePortraitAdjust,
} from '../config/PortraitAdjust';

import {
    DEFAULT_PORTRAIT_ADJUST,
    PORTRAIT_GUIDE_DEFAULT,
    type PortraitAdjustData,
    type PortraitAdjustValues,
    type PortraitFolderGuide,
} from '../data/portrait_adjust';

type ImageEntry = { path: string; hash: string };
type CatalogEntry = { folder: string; label: string; images: ImageEntry[] };

function safeCardId(path: string): string {
    return encodeURIComponent(path).replace(/[^a-z0-9]/gi, '');
}

const SLIDER = {
    scale: { min: 0.4, max: 2.2, step: 0.01 },
    offset: { min: -240, max: 240, step: 1 },
} as const;

const DEFAULT_GUIDE: PortraitFolderGuide = { ...PORTRAIT_GUIDE_DEFAULT };

let adjustData: PortraitAdjustData = structuredClone(DEFAULT_PORTRAIT_ADJUST);
/** 本页改过的 images 键；保存时先取磁盘最新，只覆盖这些键——防止用本页旧快照整份覆盖掉 F2/其它标签页刚存的调校 */
const dirtyKeys = new Set<string>();
let portraitCatalog: CatalogEntry[] = [];
let selectedFolder = '';
let selectedImage = '';
let draft: Required<PortraitAdjustValues> = { ...PORTRAIT_ADJUST_NEUTRAL };
let dirty = false;
/**
 * draft 每改一次 +1。保存要跨两次 await（先拉盘再写盘），期间用户完全可能继续按方向键；
 * 若保存结束时无条件 dirty=false，就会把这段时间的改动当成"已保存"静默丢掉
 * （屏幕上还显示着新位置，切走再切回就变回去了）。所以只在版本号没变时才清 dirty。
 */
let editVersion = 0;

/**
 * 串行闸：保存 / 切图 / 切文件夹都是异步的，并发跑会互相踩
 * （快速连按 [ ] 时，先发起的那次在 await 后又把 selectedImage 写回自己的旧目标）。
 * 所有会改全局状态的异步操作一律排队执行。
 */
let opQueue: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = opQueue.then(task, task);
    opQueue = run.catch(() => { /* 失败不阻断后续排队 */ });
    return run;
}

type GeneralEntry = { generalId: string; generalName: string; factionId: string; portrait: string; region: string; cityName: string };
let generals: GeneralEntry[] = [];
let selectedGeneralId = '';

const app = document.getElementById('app')!;
app.innerHTML = `
<header class="pt-header">
  <div class="pt-title">MAPWAR 立绘调校</div>
  <div class="pt-header-actions">
    <span class="pt-hint">快捷键：A 自动对齐，[ ] 上/下一张，方向键平移，W/S 缩放（Shift 加速）</span>
    <a href="/" class="pt-link">← 返回游戏</a>
    <button type="button" id="pt-auto-align" class="pt-btn pt-btn-ghost" title="按检测自动设置 scale/offsetY（头部大小与上下位置），offsetX 交手动。三件套依据见 tools/PortraitAlign/align_one.py">🎯 自动对齐 (A)</button>
    <button type="button" id="pt-batch-align" class="pt-btn pt-btn-ghost" title="当前文件夹全部立绘自动对齐并直接落盘（服务端自动滚动备份，可回滚）；会覆盖本夹已有手调值">⚡ 批量对齐本夹</button>
    <button type="button" id="pt-reload" class="pt-btn pt-btn-ghost">重新加载</button>
    <button type="button" id="pt-save-file" class="pt-btn pt-btn-primary">保存 (Ctrl+S)</button>
  </div>
</header>
<div class="pt-body">
  <aside class="pt-sidebar">
    <label class="pt-label">文件夹
      <select id="pt-folder" class="pt-select"></select>
    </label>
    <input id="pt-search" class="pt-input" type="search" placeholder="搜索文件名…" />
    <div id="pt-stats" class="pt-stats"></div>
    <div id="pt-save-toast" class="pt-save-toast"></div>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid #2a2620;">
      <div style="font-weight:600;margin-bottom:6px;">给武将绑定立绘</div>
      <div style="font-size:12px;color:#9a8f7d;margin-bottom:8px;">先在右侧点选一张图，再搜索选中武将，点绑定。只把武将「指向」该图，不移动/复制任何立绘文件。建议选与武将同文化区的图。</div>
      <input id="pt-gen-search" class="pt-input" type="search" placeholder="搜索武将名 / ID…" style="width:100%;margin-bottom:6px;" />
      <select id="pt-gen-select" class="pt-select" size="8" style="width:100%;"></select>
      <div id="pt-gen-current" style="font-size:12px;color:#c8bda8;margin:6px 0;word-break:break-all;"></div>
      <div id="pt-gen-portrait" class="pt-gen-portrait"></div>
      <button type="button" id="pt-bind-btn" class="pt-btn pt-btn-primary" style="width:100%;" disabled>绑定选中图给该武将</button>
      <div id="pt-bind-status" style="font-size:12px;margin-top:6px;min-height:16px;"></div>
    </div>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid #2a2620;">
      <div style="font-weight:600;margin-bottom:6px;">⚠️ 立绘重复检测</div>
      <div id="pt-dup-list" style="font-size:12px;color:#e8c878;max-height:200px;overflow-y:auto;"></div>
    </div>
  </aside>
  <main class="pt-main">
    <div class="pt-grid" id="pt-grid"></div>
  </main>
</div>
`;

injectStyles();

const els = {
    folder: document.getElementById('pt-folder') as HTMLSelectElement,
    search: document.getElementById('pt-search') as HTMLInputElement,
    stats: document.getElementById('pt-stats')!,
    grid: document.getElementById('pt-grid')!,
    saveToast: document.getElementById('pt-save-toast')!,
    genSearch: document.getElementById('pt-gen-search') as HTMLInputElement,
    genSelect: document.getElementById('pt-gen-select') as HTMLSelectElement,
    genCurrent: document.getElementById('pt-gen-current')!,
    genPortrait: document.getElementById('pt-gen-portrait')!,
    bindBtn: document.getElementById('pt-bind-btn') as HTMLButtonElement,
    bindStatus: document.getElementById('pt-bind-status')!,
    dupList: document.getElementById('pt-dup-list')!,
};

function injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .pt-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 16px; border-bottom: 1px solid #2a2620; background: #141210;
      }
      .pt-title { font-size: 18px; font-weight: 700; color: #f5e6c8; }
      .pt-header-actions { display: flex; gap: 16px; align-items: center; }
      .pt-link { color: #8ab4c4; font-size: 13px; text-decoration: none; }
      .pt-hint { font-size: 13px; color: #a89f7a; }
      .pt-body { flex: 1; display: flex; min-height: 0; }
      .pt-sidebar {
        width: 260px; border-right: 1px solid #2a2620; padding: 12px;
        display: flex; flex-direction: column; gap: 8px; background: #12100e;
      }
      .pt-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
      .pt-label { font-size: 12px; color: #a89f8f; display: flex; flex-direction: column; gap: 4px; }
      .pt-select, .pt-input {
        background: #1c1916; border: 1px solid #3a342c; color: #eee; border-radius: 4px; padding: 6px 8px;
      }
      .pt-stats { font-size: 11px; color: #888; margin-top: 10px; }
      
      .pt-grid {
        flex: 1; padding: 16px; overflow-y: auto;
        display: grid; grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
        gap: 20px; background: #1a1816;
      }
      .pt-grid-card {
        background: #1a1815; border: 2px solid transparent; border-radius: 6px;
        cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
      }
      .pt-grid-card:hover { border-color: #3a342c; }
      .pt-grid-card.is-active {
        border-color: #f5d78e; box-shadow: 0 0 0 2px #f5d78e;
      }
      .pt-grid-canvas-wrap {
        /* 立绘逻辑高严格 = 游戏战斗立绘高 uiPx(550)=385px，保证 offset 像素位移与游戏一致；
           显示用 --pt-zoom 整体放大看清脸，不改变内部相对关系（所见即游戏所得）。
           若游戏 COMBAT_UI_SCALE(0.7) 或 max-height(550) 变了，--pt-stage-h 需同步。 */
        --pt-stage-h: 385px;
        --pt-zoom: 2.4;
        width: 100%; height: calc(var(--pt-stage-h) * var(--pt-zoom));
        position: relative; overflow: hidden;
        border-radius: 4px 4px 0 0;
        display: flex; align-items: flex-end; justify-content: center;
        background-color: #2e2e34;
        background-image:
          linear-gradient(45deg, #3a3a42 25%, transparent 25%),
          linear-gradient(-45deg, #3a3a42 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #3a3a42 75%),
          linear-gradient(-45deg, transparent 75%, #3a3a42 75%);
        background-size: 12px 12px;
        background-position: 0 0, 0 6px, 6px -6px, -6px 0;
      }
      .pt-grid-img-slot { display: contents; }
      .img-wrapper {
        position: relative; height: var(--pt-stage-h); display: inline-block;
        transform: scale(var(--pt-zoom)); transform-origin: center bottom;
      }
      .img-wrapper img {
        height: 100%; width: auto; max-width: none; display: block;
        filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.5));
      }
      .pt-grid-name {
        padding: 10px; font-size: 15px; font-weight: bold; color: #a89f8f; text-align: center;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        border-top: 1px solid #2a2620;
      }
      .pt-grid-card.is-tuned .pt-grid-name::before { content: '● '; color: #7cb87c; }
      
      .pt-crosshair { position:absolute; inset:0; pointer-events:none; z-index:6; }
      .pt-crosshair .ch-face {
          position:absolute; box-sizing:border-box;
          border:2px dashed #e8c878; border-radius:50%;
          background:rgba(232,200,120,0.07);
          box-shadow:0 0 10px rgba(232,200,120,0.45);
      }
      .pt-crosshair .ch-top { position:absolute; left:0; right:0; height:0; border-top:2px dashed #ffa8ec; box-shadow:0 0 6px rgba(255,168,236,0.85); }
      .pt-crosshair .ch-eye { position:absolute; left:0; right:0; height:0; border-top:2px dashed #6ec8ff; box-shadow:0 0 6px rgba(96,196,255,0.85); }
      .pt-crosshair .ch-chin { position:absolute; left:0; right:0; height:0; border-top:2px dashed #88e0d0; box-shadow:0 0 6px rgba(120,220,200,0.8); }
      .pt-crosshair .ch-waist { position:absolute; left:0; right:0; height:0; border-top:2px dashed #c8a8e8; box-shadow:0 0 6px rgba(200,168,232,0.75); }
      .pt-crosshair .ch-mid { position:absolute; top:0; bottom:0; width:0; border-left:2px dashed #ff9a7a; box-shadow:0 0 6px rgba(255,120,80,0.85); }

      .pt-btn {
        background: #2a2620; color: #e8e0d0; border: 1px solid #4a4238;
        border-radius: 4px; padding: 6px 16px; cursor: pointer; font-size: 13px; font-weight: 600;
      }
      .pt-btn:hover { background: #3a342c; }
      .pt-btn-primary { background: #5a4a28; border-color: #8a7038; color: #fff8e8; }
      .pt-btn-ghost { background: transparent; }
      .pt-save-toast {
        margin-top: 12px; padding: 10px; border-radius: 4px; font-size: 12px;
        background: #1a3020; color: #9fd4a8; border: 1px solid #3a6a48;
        min-height: 1.2em;
      }
      .pt-save-toast:empty { display: none; }
      .pt-save-toast.is-error { background: #301a1a; color: #ffb4a8; border-color: #6a3a3a; }
      .pt-gen-portrait {
        width: 100%; aspect-ratio: 3/4; background: #1c1916; border: 1px solid #3a342c;
        border-radius: 4px; overflow: hidden; position: relative; display: none;
        margin-bottom: 8px;
      }
      .pt-gen-portrait.has-img { display: block; }
      .pt-gen-portrait img {
        width: 100%; height: 100%; object-fit: cover; object-position: center top;
      }
      #app { height: 100vh; }
    `;
    document.head.appendChild(style);
}

function getFolderGuide(folder: string): PortraitFolderGuide {
    const g = adjustData.folderGuides?.[folder];
    if (!g) return { ...DEFAULT_GUIDE };
    return {
        samplePath: g.samplePath ?? '',
        eyeLineY: g.eyeLineY ?? DEFAULT_GUIDE.eyeLineY,
        chestLineX: g.chestLineX ?? DEFAULT_GUIDE.chestLineX,
    };
}

function getFilteredImages(): string[] {
    const cat = portraitCatalog.find((c) => c.folder === selectedFolder);
    if (!cat) return [];
    const q = els.search.value.trim().toLowerCase();
    let imgs = cat.images.map(i => i.path);
    if (q) imgs = imgs.filter(p => p.toLowerCase().includes(q));
    return imgs;
}

function renderGrid(): void {
    const images = getFilteredImages();
    if (!images.includes(selectedImage) && images.length > 0) {
        selectedImage = images[0];
        loadDraftForSelected();
    }

    const folderG = getFolderGuide(selectedFolder);
    const topPct = (PORTRAIT_GUIDE_PREVIEW_TOP_LINE_Y * 100).toFixed(1);
    const eyePct = (PORTRAIT_GUIDE_PREVIEW_EYE_LINE_Y * 100).toFixed(1);
    const chinPct = (PORTRAIT_GUIDE_PREVIEW_CHIN_LINE_Y * 100).toFixed(1);
    const waistPct = (PORTRAIT_GUIDE_PREVIEW_WAIST_LINE_Y * 100).toFixed(1);
    const chestPct = (PORTRAIT_GUIDE_PREVIEW_CHEST_LINE_X * 100).toFixed(1);
    const ovalW = PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_W * 100;
    const ovalH = PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_H * 100;
    const ovalCx = (PORTRAIT_GUIDE_PREVIEW_CHEST_LINE_X + PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_CENTER_DX) * 100;
    const ovalCy = (PORTRAIT_GUIDE_PREVIEW_EYE_LINE_Y + PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_CENTER_DY) * 100;

    els.grid.innerHTML = images.map((path) => {
        const name = path.split('/').pop() ?? path;
        const active = path === selectedImage ? ' is-active' : '';
        const mark = hasPortraitImageOverride(path, adjustData) ? ' is-tuned' : '';
        
        return `
          <div class="pt-grid-card${active}${mark}" data-path="${path}" id="card-${safeCardId(path)}">
            <div class="pt-grid-canvas-wrap">
              <div class="pt-grid-img-slot">
                <div class="img-wrapper">
                  <img src="${path}" data-img-path="${path}" loading="lazy" />
                  <div class="pt-crosshair">
                    <div class="ch-face" style="left: ${ovalCx - ovalW / 2}%; top: ${ovalCy - ovalH / 2}%; width: ${ovalW}%; height: ${ovalH}%;"></div>
                    <div class="ch-top" style="top: ${topPct}%;"></div>
                    <div class="ch-eye" style="top: ${eyePct}%;"></div>
                    <div class="ch-chin" style="top: ${chinPct}%;"></div>
                    <div class="ch-waist" style="top: ${waistPct}%;"></div>
                    <div class="ch-mid" style="left: ${chestPct}%;"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="pt-grid-name">${name}</div>
          </div>
        `;
    }).join('');

    els.grid.querySelectorAll('.pt-grid-card').forEach((card) => {
        card.addEventListener('click', () => {
            selectImageAndAutoSave((card as HTMLElement).dataset.path!);
        });
    });

    const imageCount = Object.keys(adjustData.images ?? {}).length;
    const folderCount = Object.keys(adjustData.folders ?? {}).length;
    const total = portraitCatalog.reduce((n, c) => n + c.images.length, 0);
    els.stats.textContent = `已调校单张：${imageCount} 张 | 共有立绘 ${total} 张`;

    setTimeout(() => {
        updateAllGridTransforms();
    }, 50);
}

function updateAllGridTransforms(): void {
    els.grid.querySelectorAll('.pt-grid-card').forEach((card) => {
        const path = (card as HTMLElement).dataset.path!;
        const img = card.querySelector('img') as HTMLImageElement;
        if (img) {
            const dataToApply = path === selectedImage ? getPreviewAdjustData() : adjustData;
            applyPortraitAdjustToElement(img, path, dataToApply);
            applyPortraitEdgeMask(img);
        }
    });
}

function updateSingleGridTransform(path: string): void {
    const cardId = `card-${safeCardId(path)}`;
    const card = document.getElementById(cardId);
    if (!card) return;
    const img = card.querySelector('img') as HTMLImageElement;
    if (img) {
        applyPortraitAdjustToElement(img, path, getPreviewAdjustData());
        applyPortraitEdgeMask(img);
    }
}

function getPreviewAdjustData(): PortraitAdjustData {
    const draftCopy = { ...draft };
    return {
        ...adjustData,
        images: {
            ...adjustData.images,
            [selectedImage]: draftCopy,
        },
    };
}

function loadDraftForSelected(): void {
    draft = { ...resolvePortraitAdjust(selectedImage, adjustData) };
}

/** toast 自动清除定时器：每次调用先清旧的，避免批量进度被旧定时器提前清掉 */
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showSaveToast(message: string, isError = false, persist = false): void {
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    els.saveToast.textContent = message;
    els.saveToast.className = isError ? 'pt-save-toast is-error' : 'pt-save-toast';
    if (persist) return; // 持久显示：批量进度/完成信息不自动清空，等下次操作覆盖
    toastTimer = setTimeout(() => {
        if (els.saveToast.textContent === message) {
            els.saveToast.textContent = '';
            els.saveToast.className = 'pt-save-toast';
        }
        toastTimer = null;
    }, 3000);
}

function commitDraftToAdjustData(): void {
    // 没选中图时绝不落键：否则会往调校表里写入 "" 这种垃圾键
    if (!selectedImage) return;
    adjustData.images = adjustData.images ?? {};
    // 内容完全相同的立绘一起写：同一张图的正确缩放位移必然相同，
    // 分别调会出现「同一张图在两个夹里显示效果不同」（实测 41 组重复里 25 组不一致）。
    // 注意与 2026-06-27 废弃的 canonical 共享不同：那个是多文件抢同一个槽位，
    // 会互相覆盖；这里是各写各的键，只是值相同，谁也不会把谁挤掉。
    for (const sib of duplicateSiblings.get(selectedImage) ?? []) {
        adjustData.images[sib] = { scale: draft.scale, offsetX: draft.offsetX, offsetY: draft.offsetY };
        dirtyKeys.add(sib);
    }
    // 每张立绘按自身路径各存各的（与 F2、resolvePortraitAdjust 完全一致）。
    // 不再按「内容相同」自动扩写到其他文件——那会把独立立绘互相覆盖（调了又丢）。
    // 想让多个武将共享调校：让他们指向同一个文件（同一路径），自然共享。
    adjustData.images[selectedImage] = { scale: draft.scale, offsetX: draft.offsetX, offsetY: draft.offsetY };
    dirtyKeys.add(selectedImage);
}

function selectImageAndAutoSave(newImagePath: string): Promise<void> {
    // 排队执行：连按 [ ] 时若并发跑，先发起的那次会在 await 之后
    // 把 selectedImage 覆写回它自己的旧目标，导致选中项往回跳、draft 与选中图错配。
    return serialize(() => selectImageAndAutoSaveInner(newImagePath));
}

async function selectImageAndAutoSaveInner(newImagePath: string): Promise<void> {
    if (newImagePath === selectedImage) return;

    if (dirty) {
        commitDraftToAdjustData();
        try {
            await saveAdjustToServer(false);
        } catch (e) {
            // 保存失败就别切走：draft 会被下一张覆盖，改动就真没了
            showSaveToast(`保存失败，已留在当前图：${e}`, true);
            return;
        }
    }

    selectedImage = newImagePath;
    loadDraftForSelected();
    
    els.grid.querySelectorAll('.pt-grid-card').forEach(c => c.classList.remove('is-active'));
    const targetId = `card-${safeCardId(newImagePath)}`;
    const targetCard = document.getElementById(targetId);
    if (targetCard) {
        targetCard.classList.add('is-active');
    }

    updateSingleGridTransform(selectedImage);
    updateBindPanel();
}

async function saveAdjustToServer(showToast = true): Promise<void> {
    // 本次保存覆盖哪些键、基于哪个编辑版本，都在发起 await 之前定格。
    const versionAtStart = editVersion;
    const keysBeingSaved = [...dirtyKeys];

    // 先取磁盘最新数据，只覆盖本页改过的键（与游戏内 F2 的保存策略一致）；
    // 直接整份写回会把 F2 / 其它 tuner 标签页在本页打开后保存的调校覆盖掉。
    const fresh = await fetch('/api/portrait-adjust');
    if (!fresh.ok) {
        // 拉不到盘上最新数据就不能写：旧行为是退回整份覆盖，那会把本页打开之后
        // F2 / 其它标签页存的调校全部抹掉。宁可保存失败让用户重试。
        throw new Error(`读取磁盘数据失败（HTTP ${fresh.status}），已中止保存以免覆盖他处改动`);
    }
    const payload: PortraitAdjustData = await fresh.json();
    payload.images = payload.images ?? {};
    // 2026-08-03 血训修复：保存前校验 key 指向的文件存在，防止把"失联 key"继续写回表里
    // （图片被改名/删除后 key 悬空，保存会固化死键，下次读取回落默认 → 调好又变）
    const diskPaths = new Set<string>();
    try {
        const cat = await (await fetch('/api/portrait-catalog')).json() as { images: { path: string }[] }[];
        for (const c of cat) for (const img of c.images) diskPaths.add(img.path);
    } catch { /* 拿不到 catalog 就跳过校验，不阻塞保存 */ }
    let skippedOrphans = 0;
    for (const k of keysBeingSaved) {
        const v = adjustData.images?.[k];
        if (!v) continue;
        if (diskPaths.size > 0 && !diskPaths.has(k)) {
            // 文件已不存在：不写死键，提示主人（防"调好又变"）
            skippedOrphans++;
            continue;
        }
        payload.images[k] = { ...v };
    }
    if (skippedOrphans > 0) {
        showSaveToast(`⚠ ${skippedOrphans} 条调校指向不存在的文件，已跳过保存（防固化死键）`, true);
    }
    if (!payload.folderGuides) payload.folderGuides = {};

    const res = await fetch('/api/save-portrait-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    const result = await res.json();
    if (!result.ok) throw new Error(result.error || '保存失败');

    adjustData = payload;
    // 只消掉本次确实写进去的键；保存期间新产生的脏键必须留着
    for (const k of keysBeingSaved) dirtyKeys.delete(k);
    // 保存期间用户又动了 draft → 版本号变了 → 保持 dirty，交给下一次保存
    if (editVersion === versionAtStart) dirty = false;

    if (showToast) {
        showSaveToast(dirty ? '✓ 已保存（保存期间的新改动待下次写入）' : '✓ 保存成功');
    }

    // 标记刚写进去的那几张，而不是"当前选中"——切图/切夹时选中项可能已经变了
    for (const k of keysBeingSaved) {
        document.getElementById(`card-${safeCardId(k)}`)?.classList.add('is-tuned');
    }
}

/**
 * 一键自动对齐三件套：scale（头部大小）/ offsetY（上下）/ offsetX（横向，当前恒 0）。
 * 结果先落到 draft 让你当场看，觉得不对可以继续用方向键微调或直接切走放弃。
 * 依据见 tools/PortraitAlign/align_one.py（2026-08-03 全量 1291 张验证）：
 *   scale  = 0.11676 / 检测脸高(眼→下巴) → 全库脸高 CV 0%（定义恒等），对照手调后 CV 8.5%
 *   offsetY = -512 × (eyeY - 0.2344)     → 误差中位 1.9px，87.3% ≤5px
 *   offsetX = 0（全库仅 13.4% 图手调过横向，拟合弱，交手动）
 */
function autoAlignSelected(): Promise<void> {
    return serialize(async () => {
        if (!selectedImage) {
            showSaveToast('请先选中一张立绘', true);
            return;
        }
        showSaveToast('检测中…');
        try {
            const res = await fetch(`/api/portrait-auto-align?path=${encodeURIComponent(selectedImage)}`);
            const j = await res.json();
            if (!j.ok) {
                showSaveToast(`自动对齐失败：${j.reason ?? '未知'}`, true);
                return;
            }
            const before = { ...draft };
            if (typeof j.scale === 'number') draft.scale = j.scale;
            if (typeof j.offsetX === 'number') draft.offsetX = j.offsetX;
            if (typeof j.offsetY === 'number') draft.offsetY = j.offsetY;
            dirty = true;
            editVersion++;
            updateSingleGridTransform(selectedImage);
            const parts = [
                `scale ${before.scale.toFixed(2)}→${j.scale.toFixed(2)}`,
                `offsetY ${before.offsetY}→${j.offsetY}`,
            ];
            if (j.offsetX !== 0) parts.push(`offsetX ${before.offsetX}→${j.offsetX}`);
            showSaveToast(`🎯 ${parts.join('  ')}（置信度 ${j.score}）`);
        } catch (e) {
            showSaveToast(`自动对齐失败：${e}`, true);
        }
    });
}

/**
 * 批量自动对齐当前文件夹：逐张调 /api/portrait-auto-align，结果写入 adjustData.images（内存预览），
 * 不自动保存 —— 网格全部刷新成自动对齐效果，主人 Ctrl+S 才落盘。
 * 检测失败/超时的图跳过并计数，绝不覆盖已有手调值之外的东西（只改检测成功的那几张）。
 */
function batchAlignSelected(): Promise<void> {
    return serialize(async () => {
        const images = getFilteredImages();
        if (images.length === 0) {
            showSaveToast('当前文件夹没有立绘', true);
            return;
        }
        // 2026-08-03 血训修正：批量对齐只写内存预览 + 标记脏键，绝不自动落盘。
        // 之前改成"自动保存"导致点一下就把该夹手调值覆盖写进磁盘（主人实测后不满）。
        // 现在：预览满意 → Ctrl+S 才写盘；不满意 → 重新加载还原。刷新页面会丢预览（预览的代价）。
        if (!confirm(`对当前文件夹 ${images.length} 张立绘执行自动对齐？\n只预览不保存：满意请 Ctrl+S 写盘，不满意点「重新加载」还原。检测失败/无脸的图跳过。`)) return;
        showSaveToast(`⏳ 批量对齐中… 0/${images.length}`, false, true);
        adjustData.images = adjustData.images ?? {};
        let ok = 0, fail = 0;
        for (let i = 0; i < images.length; i++) {
            const p = images[i];
            try {
                const res = await fetch(`/api/portrait-auto-align?path=${encodeURIComponent(p)}`);
                const j = await res.json();
                if (j.ok) {
                    adjustData.images[p] = { scale: j.scale, offsetX: j.offsetX ?? 0, offsetY: j.offsetY };
                    dirtyKeys.add(p); // 标记脏键：Ctrl+S 时才会写盘
                    ok++;
                } else {
                    fail++;
                }
            } catch {
                fail++;
            }
            // 持久进度：每张都刷新（不清空），完成后显示最终结果
            showSaveToast(`⏳ 批量对齐中… ${i + 1}/${images.length}（成功 ${ok}，跳过 ${fail}）`, false, true);
        }
        dirty = true;
        editVersion++;
        if (selectedImage) loadDraftForSelected();
        renderGrid();
        // 全部卡片立即应用新调校，无需点击
        updateAllGridTransforms();
        showSaveToast(`✅ 批量对齐预览完成：${ok} 张已更新，${fail} 张跳过（保留原值）。\n满意请 Ctrl+S 写盘；不满意点「重新加载」还原。`, false, true);
    });
}

/** 内容完全相同的立绘分组：path → 同组其它文件 */
const duplicateSiblings = new Map<string, string[]>();

async function loadDuplicates(): Promise<void> {
    try {
        const res = await fetch('/api/portrait-duplicates');
        if (!res.ok) return;
        const groups: string[][] = await res.json();
        duplicateSiblings.clear();
        for (const g of groups) {
            for (const p of g) duplicateSiblings.set(p, g.filter((q) => q !== p));
        }
    } catch { /* 拿不到就退化成不联动，不影响主流程 */ }
}

/** 手动保存入口（按钮 / Ctrl+S）：排队 + 统一报错 */
function requestSave(): Promise<void> {
    return serialize(async () => {
        if (!selectedImage) {
            showSaveToast('当前没有选中的立绘', true);
            return;
        }
        commitDraftToAdjustData();
        try {
            await saveAdjustToServer(true);
        } catch (e) {
            showSaveToast(String(e), true);
        }
    });
}

function bindEvents(): void {
    els.folder.addEventListener('change', () => {
        const nextFolder = els.folder.value;
        void serialize(async () => {
            // 必须等保存完成再换夹：旧版不 await 就同步改 selectedImage，
            // 保存内部再去读 selectedImage 就已经是新夹的图了。
            if (dirty) {
                commitDraftToAdjustData();
                try {
                    await saveAdjustToServer(false);
                } catch (e) {
                    showSaveToast(`保存失败：${e}`, true);
                }
            }
            selectedFolder = nextFolder;
            const cat = portraitCatalog.find((c) => c.folder === selectedFolder);
            selectedImage = cat?.images[0]?.path ?? '';
            loadDraftForSelected();
            renderGrid();
        });
    });

    els.search.addEventListener('input', () => renderGrid());

    els.genSearch.addEventListener('input', () => renderGeneralOptions());
    els.genSelect.addEventListener('change', () => {
        selectedGeneralId = els.genSelect.value;
        updateBindPanel();
    });
    els.bindBtn.addEventListener('click', () => { void bindSelectedImageToGeneral(); });

    document.getElementById('pt-save-file')!.addEventListener('click', () => {
        void requestSave();
    });

    document.getElementById('pt-auto-align')!.addEventListener('click', () => {
        void autoAlignSelected();
    });

    document.getElementById('pt-batch-align')!.addEventListener('click', () => {
        void batchAlignSelected();
    });

    document.getElementById('pt-reload')!.addEventListener('click', () => {
        loadAdjustFromServer()
            .then(() => {
                loadDraftForSelected();
                renderGrid();
            })
            .catch((err) => alert(String(err)));
    });

    window.addEventListener('keydown', (e) => {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;

        if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            void requestSave();
            return;
        }

        if (!selectedImage) return;

        if (e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            void autoAlignSelected();
            return;
        }

        let changed = false;
        const speed = e.shiftKey ? 10 : 1;
        const scaleSpeed = e.shiftKey ? 0.05 : 0.01;

        switch (e.key) {
            case 'ArrowUp':
                draft.offsetY -= speed;
                changed = true;
                e.preventDefault();
                break;
            case 'ArrowDown':
                draft.offsetY += speed;
                changed = true;
                e.preventDefault();
                break;
            case 'ArrowLeft':
                draft.offsetX -= speed;
                changed = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
                draft.offsetX += speed;
                changed = true;
                e.preventDefault();
                break;
            case 'w':
            case 'W':
            case '=':
            case '+':
                draft.scale = Math.min(SLIDER.scale.max, +(draft.scale + scaleSpeed).toFixed(2));
                changed = true;
                e.preventDefault();
                break;
            case 's':
            case 'S':
            case '-':
            case '_':
                draft.scale = Math.max(SLIDER.scale.min, +(draft.scale - scaleSpeed).toFixed(2));
                changed = true;
                e.preventDefault();
                break;
            case '[':
            case ']': {
                e.preventDefault();
                const imgs = getFilteredImages();
                const idx = imgs.indexOf(selectedImage);
                if (idx < 0 || imgs.length < 2) break;
                const next = e.key === '[' ? (idx - 1 + imgs.length) % imgs.length : (idx + 1) % imgs.length;
                selectImageAndAutoSave(imgs[next]).then(() => {
                    const el = document.getElementById(`card-${safeCardId(imgs[next])}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
                break;
            }
        }

        if (changed) {
            dirty = true;
            editVersion++;   // 让进行中的保存知道"这之后还有新改动"，别把 dirty 清掉
            updateSingleGridTransform(selectedImage);
        }
    });

    window.addEventListener('beforeunload', (e) => {
        // dirtyKeys 非空 = 已提交但上次保存失败，同样不能让用户无提示地关掉
        if (dirty || dirtyKeys.size > 0) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

async function loadCatalogFromServer(): Promise<void> {
    const res = await fetch('/api/portrait-catalog');
    if (!res.ok) throw new Error(await res.text());
    portraitCatalog = await res.json();
    if (portraitCatalog.length === 0) throw new Error('未扫描到任何立绘 PNG');

    selectedFolder = portraitCatalog[0].folder;
    selectedImage = portraitCatalog[0].images[0]?.path ?? '';
}

async function loadAdjustFromServer(): Promise<void> {
    const res = await fetch('/api/portrait-adjust');
    if (!res.ok) throw new Error(await res.text());
    adjustData = await res.json();
    if (!adjustData.folderGuides) adjustData.folderGuides = {};
    dirtyKeys.clear();
    dirty = false;
}

function populateFolders(): void {
    els.folder.innerHTML = portraitCatalog.map(
        (c) => `<option value="${c.folder}">${c.label} (${c.images.length})</option>`,
    ).join('');
    if (selectedFolder) els.folder.value = selectedFolder;
}

// ── 给指定武将绑定立绘（无需进战斗；旧立绘自动转闲置，由服务端 bind 处理）──
async function loadGenerals(): Promise<void> {
    try {
        const res = await fetch('/api/entity-data');
        if (!res.ok) return;
        const data = await res.json();

        // 构建 factionId → cityId → region 查找链
        const capitals: Record<string, string> = data.capitals ?? {};
        const cityById: Map<string, { name: string; region?: string }> = new Map(
            (data.cities ?? []).map((c: any) => [c.id, { name: c.name, region: c.region }]),
        );

        const REGION_LABELS: Record<string, string> = {
            CENTRAL: '中原', NORTH: '北方', JIANGNAN: '江南', BASHU: '川蜀',
            LINGNAN: '岭南', HEXI: '河西', STEPPE: '草原', NORTHEAST: '东北',
            KOREA: '朝鲜', JAPAN: '日本', XIYU: '西域', QINGZANG: '青藏',
            DIANMIAN: '滇缅', CENTRAL_ASIA: '中亚',
        };

        generals = Object.entries((data.generals ?? {}) as Record<string, { generalId: string; generalName: string; portrait: string }>)
            .map(([factionId, g]) => {
                const cityId = capitals[factionId];
                const city = cityId ? cityById.get(cityId) : null;
                const rawRegion = city?.region ?? '';
                const region = (REGION_LABELS[rawRegion] ?? rawRegion) || '未知';
                return {
                    generalId: g.generalId,
                    generalName: g.generalName,
                    factionId,
                    portrait: g.portrait,
                    region,
                    cityName: city?.name ?? (cityId ?? ''),
                };
            })
            .sort((a, b) => {
                // 先按区域排，再按武将名排
                const r = a.region.localeCompare(b.region, 'zh-CN');
                if (r !== 0) return r;
                return a.generalName.localeCompare(b.generalName, 'zh-CN');
            });
        renderGeneralOptions();
    } catch (e) {
        console.warn('[PortraitTuner] 加载武将列表失败', e);
    }
}

function renderGeneralOptions(): void {
    const q = els.genSearch.value.trim().toLowerCase();
    const list = q
        ? generals.filter((g) => g.generalName.toLowerCase().includes(q) || g.generalId.toLowerCase().includes(q))
        : generals;

    // 按区域分组
    const groups = new Map<string, GeneralEntry[]>();
    for (const g of list) {
        const arr = groups.get(g.region) || [];
        arr.push(g);
        groups.set(g.region, arr);
    }

    els.genSelect.innerHTML = Array.from(groups.entries())
        .map(([region, gens]) => {
            const opts = gens
                .map((g) => `<option value="${g.generalId}">${g.generalName}（${g.generalId}）</option>`)
                .join('');
            return `<optgroup label="${region}（${gens.length} 将）">${opts}</optgroup>`;
        })
        .join('');

    if (list.some((g) => g.generalId === selectedGeneralId)) {
        els.genSelect.value = selectedGeneralId;
    } else {
        selectedGeneralId = '';
    }
    updateBindPanel();
}

function updateBindPanel(): void {
    const gen = generals.find((g) => g.generalId === selectedGeneralId);
    els.genCurrent.innerHTML = gen
        ? `当前立绘：<code>${gen.portrait || '(无)'}</code>`
        : '';
    if (gen?.portrait) {
        els.genPortrait.innerHTML = `<img src="${gen.portrait}" alt="${gen.generalName}" />`;
        els.genPortrait.classList.add('has-img');
    } else {
        els.genPortrait.innerHTML = '';
        els.genPortrait.classList.remove('has-img');
    }
    const imgHint = selectedImage ? '' : '（请先在右侧点选一张图）';
    els.bindBtn.textContent = `把选中图指给该武将${imgHint}`;
    els.bindBtn.disabled = !(gen && selectedImage);
}

function bindSelectedImageToGeneral(): Promise<void> {
    // 绑定会改名源图并迁移调校键，必须与保存/切图串行，不能并发
    return serialize(() => bindSelectedImageToGeneralInner());
}

async function bindSelectedImageToGeneralInner(): Promise<void> {
    const gen = generals.find((g) => g.generalId === selectedGeneralId);
    if (!gen || !selectedImage) return;
    if (!selectedImage.toLowerCase().endsWith('.png')) {
        els.bindStatus.textContent = '⚠ 立绘必须是 .png';
        els.bindStatus.style.color = '#e08a7a';
        return;
    }
    // 绑定前先提交未保存的调校，防止丢失
    if (dirty) {
        commitDraftToAdjustData();
        try {
            await saveAdjustToServer(false);
        } catch (e) {
            console.warn('[BindPortrait] 保存调校失败（继续绑定）:', e);
        }
    }
    // 跨文化区提醒：选中图与武将当前文化区夹不同时先确认（仍就地引用、不移动文件）
    const genFolder = ((gen.portrait || '').match(/^\/assets\/([^/]+)\//) || [])[1];
    const imgFolder = (selectedImage.match(/^\/assets\/([^/]+)\//) || [])[1];
    if (genFolder && imgFolder && genFolder.toLowerCase() !== imgFolder.toLowerCase()) {
        const ok = window.confirm(
            `注意：所选图在【${imgFolder}】夹，而 ${gen.generalName} 属于【${genFolder}】文化区。\n` +
            `绑定不会跨夹搬运（新立绘留在【${imgFolder}】夹内改名），但该武将会使用跨文化区的样貌，可能不搭。\n是否继续？`,
        );
        if (!ok) return;
    }
    els.bindBtn.disabled = true;
    els.bindStatus.textContent = '绑定中…';
    els.bindStatus.style.color = '#c8bda8';
    try {
        // 绑定：源图在「自己的夹」内改名为 {generalId}.png（认领闲置图不留重复），旧立绘转闲置。
        // 不传 targetFolder → 服务端用源图所在夹，绝不把图搬进别的文化区。
        const res = await fetch('/api/bind-general-portrait', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generalId: gen.generalId, sourcePath: selectedImage }),
        });
        const result = await res.json();
        if (!res.ok || !result.ok) throw new Error(result.error || `HTTP ${res.status}`);
        els.bindStatus.textContent = `✓ ${gen.generalName} 新立绘已就位：${result.portraitPath || ''}（旧立绘已转闲置）`;
        els.bindStatus.style.color = '#8bbf7a';
        await loadGenerals();
        await loadCatalogFromServer();
        // 服务端绑定时已把源图调校迁移/同步到新路径——取回最新数据，防止本页后续保存把它覆盖掉
        await loadAdjustFromServer();
        loadDraftForSelected();
        populateFolders();
        renderGrid();
    } catch (e) {
        els.bindStatus.textContent = `✗ 绑定失败：${e instanceof Error ? e.message : String(e)}`;
        els.bindStatus.style.color = '#e08a7a';
    } finally {
        els.bindBtn.disabled = !(selectedGeneralId && selectedImage);
    }
}

function checkDuplicatePortraits(): void {
    // 从已加载的立绘目录建立 hash → paths 索引
    const hashToPaths = new Map<string, string[]>();
    const pathToHash = new Map<string, string>();
    for (const cat of portraitCatalog) {
        for (const img of cat.images) {
            pathToHash.set(img.path, img.hash);
            const arr = hashToPaths.get(img.hash) || [];
            arr.push(img.path);
            hashToPaths.set(img.hash, arr);
        }
    }

    // 按内容 hash 分组所有武将
    const byHash = new Map<string, GeneralEntry[]>();
    for (const g of generals) {
        if (!g.portrait) continue;
        const hash = pathToHash.get(g.portrait);
        if (!hash) continue; // 立绘不在目录中（可能是未扫描到）
        const arr = byHash.get(hash) || [];
        arr.push(g);
        byHash.set(hash, arr);
    }

    // 筛出重复：同一 hash 下有 ≥2 个武将
    const dups = [...byHash.entries()].filter(([, v]) => v.length > 1);

    if (dups.length === 0) {
        els.dupList.innerHTML = '<span style="color:#7cb87c">✓ 无重复立绘</span>';
        return;
    }

    els.dupList.innerHTML = dups.map(([hash, gens]) => {
        const names = gens.map(g => `${g.generalName}（${g.region}·${g.cityName}）`).join('、');
        // 查该 hash 对应的所有文件名
        const files = (hashToPaths.get(hash) || []).map(p => p.split('/').pop()).join(', ');
        return `<div style="margin-bottom:6px;padding:4px 6px;background:#2a2010;border-radius:3px;">
          <div style="color:#f0c060;">📋 ${files}</div>
          <div style="color:#e8c878;">${names}</div>
          <div style="color:#a08060;font-size:10px;">hash: ${hash.slice(0,12)}</div>
        </div>`;
    }).join('');
    els.dupList.innerHTML += `<div style="margin-top:4px;color:#c08050;">共 ${dups.length} 组重复</div>`;
}

/**
 * 悬空调校自检（2026-08-03 血训修复）：调校表里的 key 指向的图片文件不存在 = 失联。
 * 图片被改名/移动/删除而调校 key 没跟着走时，读图回落默认值 → "调好又变"。
 * tuner 打开时报告，绝不静默。
 */
function checkOrphanAdjustKeys(): number {
    if (!adjustData?.images) return 0;
    const diskPaths = new Set<string>();
    for (const cat of portraitCatalog) {
        for (const img of cat.images) diskPaths.add(img.path);
    }
    const orphans: string[] = [];
    for (const k of Object.keys(adjustData.images)) {
        if (!diskPaths.has(k)) orphans.push(k);
    }
    if (orphans.length === 0) return 0;
    console.warn(`[PortraitTuner] ⚠ ${orphans.length} 条调校 key 指向不存在的文件（图片被改名/移动/删除）：`);
    for (const k of orphans.slice(0, 15)) console.warn('   ', k);
    if (orphans.length > 15) console.warn(`    … 其余 ${orphans.length - 15} 条`);
    alert(
        `⚠ 检测到 ${orphans.length} 条调校记录指向不存在的文件（失联）！\n\n` +
        `原因：图片被改名/移动/删除，而调校 key 没跟着迁移。\n` +
        `这些立绘的缩放/位置已回落默认值——就像上次"调好又变"。\n\n` +
        `解决：node tools/lib/portrait_adjust_recover.mjs 追回（默认 dry-run 预览，加 --apply 写盘；\n` +
        `内含改名日志 / git rename / MD5 内容匹配三层）。`
    );
    return orphans.length;
}

async function boot(): Promise<void> {
    bindEvents();

    await loadCatalogFromServer();
    populateFolders();
    await loadGenerals();
    checkDuplicatePortraits();
    await loadDuplicates();

    try {
        await loadAdjustFromServer();
    } catch (err) {
        console.warn('[PortraitTuner] 使用内置默认配置', err);
        adjustData = structuredClone(DEFAULT_PORTRAIT_ADJUST);
    }

    checkOrphanAdjustKeys();

    loadDraftForSelected();
    renderGrid();
}

boot().catch((err) => {
    console.error(err);
    alert(`立绘调校工具启动失败：${err}`);
});
