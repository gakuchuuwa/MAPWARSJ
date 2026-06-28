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
    toCanonicalPortraitPath,
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
let portraitCatalog: CatalogEntry[] = [];
let hashToPaths = new Map<string, string[]>();
let pathToHash = new Map<string, string>();
let selectedFolder = '';
let selectedImage = '';
let draft: Required<PortraitAdjustValues> = { ...PORTRAIT_ADJUST_NEUTRAL };
let dirty = false;

const app = document.getElementById('app')!;
app.innerHTML = `
<header class="pt-header">
  <div class="pt-title">MAPWAR 立绘调校</div>
  <div class="pt-header-actions">
    <span class="pt-hint">快捷键：[ ] 上/下一张，方向键平移，W/S 缩放（Shift 加速）</span>
    <a href="/" class="pt-link">← 返回游戏</a>
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
    const canonical = toCanonicalPortraitPath(selectedImage);
    const draftCopy = { ...draft };
    return {
        ...adjustData,
        images: {
            ...adjustData.images,
            [selectedImage]: draftCopy,
            [canonical]: draftCopy,
        },
    };
}

function loadDraftForSelected(): void {
    draft = { ...resolvePortraitAdjust(selectedImage, adjustData) };
}

function showSaveToast(message: string, isError = false): void {
    els.saveToast.textContent = message;
    els.saveToast.className = isError ? 'pt-save-toast is-error' : 'pt-save-toast';
    setTimeout(() => { 
        if (els.saveToast.textContent === message) {
            els.saveToast.textContent = ''; 
            els.saveToast.className = 'pt-save-toast'; 
        }
    }, 3000);
}

function commitDraftToAdjustData(): void {
    adjustData.images = adjustData.images ?? {};
    const hash = pathToHash.get(selectedImage);
    const identicalPaths = hash ? (hashToPaths.get(hash) ?? [selectedImage]) : [selectedImage];

    const value = { scale: draft.scale, offsetX: draft.offsetX, offsetY: draft.offsetY };
    for (const p of identicalPaths) {
        adjustData.images[p] = { ...value };
        const c = toCanonicalPortraitPath(p);
        if (c !== p) adjustData.images[c] = { ...value };
    }
}

async function selectImageAndAutoSave(newImagePath: string): Promise<void> {
    if (newImagePath === selectedImage) return;

    if (dirty) {
        commitDraftToAdjustData();
        await saveAdjustToServer(false);
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
}

async function saveAdjustToServer(showToast = true): Promise<void> {
    const res = await fetch('/api/save-portrait-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustData),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    const result = await res.json();
    if (!result.ok) throw new Error(result.error || '保存失败');
    dirty = false;
    
    if (showToast) {
        showSaveToast('✓ 保存成功，且自动应用到了相同内容的重复文件');
    }
    
    const hash = pathToHash.get(selectedImage);
    const identicalPaths = hash ? (hashToPaths.get(hash) ?? [selectedImage]) : [selectedImage];
    for (const p of identicalPaths) {
        const targetId = `card-${safeCardId(p)}`;
        const targetCard = document.getElementById(targetId);
        if (targetCard) targetCard.classList.add('is-tuned');
    }
}

function bindEvents(): void {
    els.folder.addEventListener('change', () => {
        if (dirty) {
            commitDraftToAdjustData();
            saveAdjustToServer(false).catch(console.error);
        }
        selectedFolder = els.folder.value;
        const cat = portraitCatalog.find((c) => c.folder === selectedFolder);
        selectedImage = cat?.images[0]?.path ?? '';
        loadDraftForSelected();
        renderGrid();
    });

    els.search.addEventListener('input', () => renderGrid());

    document.getElementById('pt-save-file')!.addEventListener('click', async () => {
        commitDraftToAdjustData();
        try {
            await saveAdjustToServer(true);
        } catch (e) {
            showSaveToast(String(e), true);
        }
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
            commitDraftToAdjustData();
            saveAdjustToServer(true).catch(e => showSaveToast(String(e), true));
            return;
        }

        if (!selectedImage) return;

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
            updateSingleGridTransform(selectedImage);
        }
    });

    window.addEventListener('beforeunload', (e) => {
        if (dirty) {
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
    
    hashToPaths.clear();
    pathToHash.clear();
    for (const cat of portraitCatalog) {
        for (const img of cat.images) {
            pathToHash.set(img.path, img.hash);
            if (!hashToPaths.has(img.hash)) {
                hashToPaths.set(img.hash, []);
            }
            hashToPaths.get(img.hash)!.push(img.path);
        }
    }
    
    selectedFolder = portraitCatalog[0].folder;
    selectedImage = portraitCatalog[0].images[0]?.path ?? '';
}

async function loadAdjustFromServer(): Promise<void> {
    const res = await fetch('/api/portrait-adjust');
    if (!res.ok) throw new Error(await res.text());
    adjustData = await res.json();
    if (!adjustData.folderGuides) adjustData.folderGuides = {};
    dirty = false;
}

function populateFolders(): void {
    els.folder.innerHTML = portraitCatalog.map(
        (c) => `<option value="${c.folder}">${c.label} (${c.images.length})</option>`,
    ).join('');
    if (selectedFolder) els.folder.value = selectedFolder;
}

async function boot(): Promise<void> {
    bindEvents();

    await loadCatalogFromServer();
    populateFolders();

    try {
        await loadAdjustFromServer();
    } catch (err) {
        console.warn('[PortraitTuner] 使用内置默认配置', err);
        adjustData = structuredClone(DEFAULT_PORTRAIT_ADJUST);
    }

    loadDraftForSelected();
    renderGrid();
}

boot().catch((err) => {
    console.error(err);
    alert(`立绘调校工具启动失败：${err}`);
});
