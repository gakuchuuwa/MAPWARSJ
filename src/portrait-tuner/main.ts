/**
 * MAPWAR 立绘调校（眼线 / 胸线对齐版）
 * 访问：http://localhost:5173/portrait-tuner.html
 */
import {
    PORTRAIT_ADJUST_NEUTRAL,
    applyPortraitAdjustToElement,
    applyPortraitEdgeMask,
    hasPortraitImageOverride,
    resolvePortraitAdjust,
} from '../config/PortraitAdjust';
import { autoFitPortraitFromUrl } from '../config/portraitAutoFit';

import {
    DEFAULT_PORTRAIT_ADJUST,
    PORTRAIT_GUIDE_DEFAULT,
    PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X,
    PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y,
    type PortraitAdjustData,
    type PortraitAdjustValues,
    type PortraitFolderGuide,
} from '../data/portrait_adjust';

type EditMode = 'image' | 'folder';
type CatalogEntry = { folder: string; label: string; images: string[] };

const SLIDER = {
    scale: { min: 0.4, max: 2.2, step: 0.01 },
    offset: { min: -240, max: 240, step: 1 },
} as const;

/** 调校区 768×1024 画布显示高度（px） */
const CANVAS_H = 300;
const CANVAS_W = CANVAS_H * (768 / 1024);

const DEFAULT_GUIDE: PortraitFolderGuide = { ...PORTRAIT_GUIDE_DEFAULT };

const SAMPLE_INSET = { left: 20, bottom: 20 } as const;
const VIEW_GAP = 16;

let adjustData: PortraitAdjustData = structuredClone(DEFAULT_PORTRAIT_ADJUST);
let portraitCatalog: CatalogEntry[] = [];
let selectedFolder = '';
let selectedImage = '';
let editMode: EditMode = 'image';
let draft: Required<PortraitAdjustValues> = { ...PORTRAIT_ADJUST_NEUTRAL };
let dirty = false;

const app = document.getElementById('app')!;
app.innerHTML = `
<header class="pt-header">
  <div class="pt-title">MAPWAR 立绘调校</div>
  <div class="pt-header-actions">
    <a href="/" class="pt-link">← 返回游戏</a>
    <button type="button" id="pt-reload" class="pt-btn pt-btn-ghost">重新加载</button>
    <button type="button" id="pt-save-file" class="pt-btn pt-btn-primary">保存</button>
  </div>
</header>
<div class="pt-body">
  <aside class="pt-sidebar">
    <label class="pt-label">文件夹
      <select id="pt-folder" class="pt-select"></select>
    </label>
    <input id="pt-search" class="pt-input" type="search" placeholder="搜索文件名…" />
    <div id="pt-image-list" class="pt-image-list"></div>
    <div id="pt-stats" class="pt-stats"></div>
  </aside>
  <main class="pt-main">
    <div class="pt-hint" id="pt-hint"></div>
    <div class="pt-stage" id="pt-stage">
      <div class="pt-view pt-view-sample" id="pt-view-sample">
        <div class="pt-view-tag">样片（尺）</div>
        <div class="pt-canvas" id="pt-canvas-sample">
          <div class="pt-img-slot" id="pt-slot-sample"></div>
        </div>
      </div>
      <div class="pt-view pt-view-current" id="pt-view-current">
        <div class="pt-view-tag">当前张（对照）</div>
        <div class="pt-canvas" id="pt-canvas-current">
          <div class="pt-img-slot" id="pt-slot-current"></div>
        </div>
      </div>
      <div class="pt-guide-layer" id="pt-guide-layer">
        <div class="pt-guide pt-guide-eye" id="pt-guide-eye" title="拖动调整眼线"></div>
        <div class="pt-guide pt-guide-chest" id="pt-guide-chest" title="拖动调整胸线"></div>
        <div class="pt-guide pt-guide-chest-mirror" id="pt-guide-chest-mirror" aria-hidden="true"></div>
      </div>
    </div>
    <div class="pt-controls">
      <div class="pt-mode">
        <label><input type="radio" name="pt-mode" value="image" checked /> 单张例外</label>
        <label><input type="radio" name="pt-mode" value="folder" /> 文件夹默认</label>
      </div>
      <div id="pt-edit-target" class="pt-edit-target"></div>
      <div class="pt-sliders">
        <label class="pt-slider-row">缩放 <span id="pt-val-scale"></span>
          <input type="range" id="pt-scale" />
        </label>
        <label class="pt-slider-row">水平偏移 <span id="pt-val-offsetX"></span>
          <input type="range" id="pt-offsetX" />
        </label>
        <label class="pt-slider-row">垂直偏移 <span id="pt-val-offsetY"></span>
          <input type="range" id="pt-offsetY" />
        </label>
      </div>
      <div class="pt-actions">
        <button type="button" id="pt-set-sample" class="pt-btn">当前张设为样片</button>
        <button type="button" id="pt-reset-guides" class="pt-btn pt-btn-ghost">标线复位</button>
        <button type="button" id="pt-center-chest" class="pt-btn pt-btn-ghost">胸线居中</button>
        <button type="button" id="pt-reset-draft" class="pt-btn pt-btn-ghost">重置滑块</button>
        <button type="button" id="pt-clear-override" class="pt-btn pt-btn-ghost">清除单张例外</button>
        <button type="button" id="pt-prev" class="pt-btn pt-btn-ghost">上一张</button>
        <button type="button" id="pt-next" class="pt-btn pt-btn-ghost">下一张</button>
      </div>
      <div class="pt-save-bar">
        <div class="pt-save-bar-title">保存</div>
        <div class="pt-save-bar-hint">滑块与标线调好后，点「保存」一并写入 portrait_adjust.ts（游戏内 F5 生效）</div>
        <div class="pt-save-bar-actions">
          <button type="button" id="pt-save-bottom" class="pt-btn pt-btn-primary pt-btn-large pt-btn-save">保存</button>
          <button type="button" id="pt-autofit-folder" class="pt-btn pt-btn-large">🪄 本文件夹自动校正</button>
          <button type="button" id="pt-autofit-all" class="pt-btn pt-btn-large">🪄 全库自动校正</button>
        </div>
        <div id="pt-autofit-progress" class="pt-autofit-progress"></div>
        <div id="pt-dirty-hint" class="pt-dirty-hint"></div>
        <div id="pt-save-toast" class="pt-save-toast"></div>
      </div>
      <div id="pt-effective" class="pt-effective"></div>
    </div>
  </main>
</div>
`;

injectStyles();

const els = {
    folder: document.getElementById('pt-folder') as HTMLSelectElement,
    search: document.getElementById('pt-search') as HTMLInputElement,
    imageList: document.getElementById('pt-image-list')!,
    stats: document.getElementById('pt-stats')!,
    hint: document.getElementById('pt-hint')!,
    stage: document.getElementById('pt-stage')!,
    viewSample: document.getElementById('pt-view-sample')!,
    viewCurrent: document.getElementById('pt-view-current')!,
    guideLayer: document.getElementById('pt-guide-layer')!,
    guideEye: document.getElementById('pt-guide-eye')!,
    guideChest: document.getElementById('pt-guide-chest')!,
    guideChestMirror: document.getElementById('pt-guide-chest-mirror')!,
    editTarget: document.getElementById('pt-edit-target')!,
    scale: document.getElementById('pt-scale') as HTMLInputElement,
    offsetX: document.getElementById('pt-offsetX') as HTMLInputElement,
    offsetY: document.getElementById('pt-offsetY') as HTMLInputElement,
    valScale: document.getElementById('pt-val-scale')!,
    valOffsetX: document.getElementById('pt-val-offsetX')!,
    valOffsetY: document.getElementById('pt-val-offsetY')!,
    effective: document.getElementById('pt-effective')!,
    dirtyHint: document.getElementById('pt-dirty-hint')!,
    saveToast: document.getElementById('pt-save-toast')!,
    autofitProgress: document.getElementById('pt-autofit-progress')!,
};

let imgSample: HTMLImageElement;
let imgCurrent: HTMLImageElement;

function injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .pt-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 16px; border-bottom: 1px solid #2a2620; background: #141210;
      }
      .pt-title { font-size: 18px; font-weight: 700; color: #f5e6c8; }
      .pt-header-actions { display: flex; gap: 8px; align-items: center; }
      .pt-link { color: #8ab4c4; font-size: 13px; text-decoration: none; }
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
      .pt-image-list {
        flex: 1; overflow: auto; border: 1px solid #2a2620; border-radius: 4px; background: #0e0d0c;
      }
      .pt-image-item {
        display: block; width: 100%; text-align: left; padding: 6px 8px; border: 0; border-bottom: 1px solid #1e1b18;
        background: transparent; color: #ccc; font-size: 11px; cursor: pointer;
      }
      .pt-image-item:hover { background: #1a1815; }
      .pt-image-item.is-active { background: #2a2418; color: #f5d78e; }
      .pt-image-item.is-sample::after { content: ' 样'; color: #f5d78e; font-size: 10px; }
      .pt-image-item.is-tuned::before { content: '● '; color: #7cb87c; }
      .pt-stats { font-size: 11px; color: #888; }
      .pt-hint {
        padding: 10px 16px 0; font-size: 12px; color: #9a8f7a; line-height: 1.5;
      }
      .pt-stage {
        position: relative; flex: 1; min-height: 480px; margin: 12px 16px;
        background: #1a1816; border: 1px solid #4a4238; border-radius: 8px; overflow: visible;
      }
      .pt-view {
        position: absolute; width: ${CANVAS_W}px; height: ${CANVAS_H}px; overflow: visible;
      }
      .pt-view-tag {
        position: absolute; top: -20px; left: 0; font-size: 10px; color: #8a8070; white-space: nowrap;
      }
      .pt-canvas {
        width: 100%; height: 100%; position: relative; overflow: hidden;
        border: 2px dashed rgba(253, 185, 49, 0.85);
        box-shadow: inset 0 0 0 1px rgba(96, 196, 255, 0.9);
        background-color: #2e2e34;
        background-image:
          linear-gradient(45deg, #3a3a42 25%, transparent 25%),
          linear-gradient(-45deg, #3a3a42 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #3a3a42 75%),
          linear-gradient(-45deg, transparent 75%, #3a3a42 75%);
        background-size: 12px 12px;
        background-position: 0 0, 0 6px, 6px -6px, -6px 0;
      }
      .pt-img-slot {
        position: absolute; inset: 0;
        display: flex; align-items: flex-end;
        overflow: hidden;
      }
      .pt-view-sample .pt-img-slot { justify-content: flex-end; }
      .pt-view-current .pt-img-slot { justify-content: flex-start; }
      .pt-img-slot img {
        height: 100%; width: auto; max-width: 100%;
        display: block;
        filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.5));
      }
      .pt-view-sample .pt-canvas { border-color: rgba(245, 215, 142, 0.95); }
      .pt-view-current .pt-canvas { border-color: rgba(126, 200, 140, 0.85); }
      .pt-guide-layer {
        position: absolute;
        pointer-events: none;
        z-index: 30;
      }
      .pt-guide {
        position: absolute; pointer-events: auto;
      }
      .pt-guide-eye { z-index: 1; }
      .pt-guide-chest { z-index: 2; }
      .pt-guide-eye {
        left: 0; right: 0;
        height: 12px; margin-top: -6px; cursor: ns-resize;
      }
      .pt-guide-eye::after {
        content: ''; position: absolute; left: 0; right: 0; top: 5px; height: 2px;
        background: repeating-linear-gradient(90deg, #6ec8ff 0 8px, transparent 8px 14px);
        box-shadow: 0 0 8px rgba(96, 196, 255, 0.9);
      }
      .pt-guide-chest {
        top: 0; bottom: 0;
        width: 12px; margin-left: -6px; cursor: ew-resize;
      }
      .pt-guide-chest-mirror {
        top: 0; bottom: 0;
        width: 12px; margin-left: -6px;
        pointer-events: none;
        z-index: 2;
      }
      .pt-guide-chest::after,
      .pt-guide-chest-mirror::after {
        content: ''; position: absolute; top: 0; bottom: 0; left: 5px; width: 2px;
        background: repeating-linear-gradient(180deg, #ff9a7a 0 8px, transparent 8px 14px);
        box-shadow: 0 0 10px rgba(255, 120, 80, 0.95);
      }
      .pt-controls {
        border-top: 1px solid #2a2620; padding: 12px 16px 16px; background: #141210;
        display: flex; flex-direction: column; gap: 8px;
        position: sticky; bottom: 0; z-index: 20;
        box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.35);
      }
      .pt-mode { display: flex; gap: 16px; font-size: 13px; }
      .pt-edit-target { font-size: 12px; color: #c4b89a; word-break: break-all; }
      .pt-slider-row { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #aaa; }
      .pt-slider-row input[type=range] { width: 100%; }
      .pt-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .pt-btn {
        background: #2a2620; color: #e8e0d0; border: 1px solid #4a4238;
        border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 13px;
      }
      .pt-btn:hover { background: #3a342c; }
      .pt-btn-primary { background: #5a4a28; border-color: #8a7038; color: #fff8e8; }
      .pt-btn-ghost { background: transparent; }
      .pt-effective { font-size: 11px; color: #7a9aaf; line-height: 1.5; }
      .pt-save-bar {
        margin-top: 4px; padding: 12px 14px; border-radius: 8px;
        background: #1e1a14; border: 1px solid #6a5a30;
      }
      .pt-save-bar-title { font-size: 14px; font-weight: 700; color: #f5d78e; }
      .pt-save-bar-hint { font-size: 11px; color: #a89f7a; line-height: 1.45; margin-top: 4px; }
      .pt-save-bar-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
      .pt-btn-large { padding: 10px 20px; font-size: 15px; font-weight: 600; }
      .pt-btn-save { min-width: 160px; padding: 12px 32px; font-size: 17px; }
      .pt-autofit-progress { font-size: 12px; margin-top: 8px; color: #8ab4c4; min-height: 1.2em; }
      .pt-autofit-progress:empty { display: none; }
      .pt-dirty-hint { font-size: 11px; margin-top: 8px; color: #7cb87c; }
      .pt-dirty-hint.is-dirty { color: #ffb86c; }
      .pt-save-toast {
        margin-top: 8px; padding: 8px 10px; border-radius: 4px; font-size: 12px;
        background: #1a3020; color: #9fd4a8; border: 1px solid #3a6a48;
        min-height: 1.2em;
      }
      .pt-save-toast:empty { display: none; }
      .pt-save-toast.is-error { background: #301a1a; color: #ffb4a8; border-color: #6a3a3a; }
      #app { height: 100vh; }
    `;
    document.head.appendChild(style);
}

function mountImgInSlot(slotId: string): HTMLImageElement {
    const slot = document.getElementById(slotId)!;
    const img = document.createElement('img');
    img.alt = '立绘';
    slot.appendChild(img);
    return img;
}

function getPreviewAdjustData(): PortraitAdjustData {
    if (editMode === 'folder') {
        return {
            ...adjustData,
            folders: {
                ...adjustData.folders,
                [selectedFolder]: { ...draft },
            },
        };
    }
    return {
        ...adjustData,
        images: {
            ...adjustData.images,
            [selectedImage]: { ...draft },
        },
    };
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

function saveFolderGuide(folder: string, guide: PortraitFolderGuide): void {
    adjustData.folderGuides = adjustData.folderGuides ?? {};
    adjustData.folderGuides[folder] = guide;
    dirty = true;
    updateDirtyHint();
}

function getFilteredImages(): string[] {
    const cat = portraitCatalog.find((c) => c.folder === selectedFolder);
    if (!cat) return [];
    const q = els.search.value.trim().toLowerCase();
    if (!q) return cat.images;
    return cat.images.filter((p) => p.toLowerCase().includes(q));
}

function renderImageList(): void {
    const images = getFilteredImages();
    const guide = getFolderGuide(selectedFolder);
    if (!images.includes(selectedImage) && images.length > 0) {
        selectedImage = images[0];
    }

    els.imageList.innerHTML = images.map((path) => {
        const name = path.split('/').pop() ?? path;
        const active = path === selectedImage ? ' is-active' : '';
        const sample = path === guide.samplePath ? ' is-sample' : '';
        const mark = hasPortraitImageOverride(path, adjustData) ? ' is-tuned' : '';
        return `<button type="button" class="pt-image-item${active}${sample}${mark}" data-path="${path}">${name}</button>`;
    }).join('');

    els.imageList.querySelectorAll('.pt-image-item').forEach((btn) => {
        btn.addEventListener('click', () => {
            selectedImage = (btn as HTMLElement).dataset.path!;
            renderImageList();
            loadDraftFromMode();
            refreshPreview();
        });
    });

    const imageCount = Object.keys(adjustData.images ?? {}).length;
    const folderCount = Object.keys(adjustData.folders ?? {}).length;
    const total = portraitCatalog.reduce((n, c) => n + c.images.length, 0);
    els.stats.textContent = `已调校：单张 ${imageCount} · 文件夹 ${folderCount} · 库内 ${total} 张`;
}

function loadDraftFromMode(): void {
    if (editMode === 'folder') {
        const f = adjustData.folders?.[selectedFolder];
        draft = {
            scale: f?.scale ?? PORTRAIT_ADJUST_NEUTRAL.scale,
            offsetX: f?.offsetX ?? PORTRAIT_ADJUST_NEUTRAL.offsetX,
            offsetY: f?.offsetY ?? PORTRAIT_ADJUST_NEUTRAL.offsetY,
        };
    } else {
        draft = { ...resolvePortraitAdjust(selectedImage, adjustData) };
    }
    syncSlidersToDraft();
    updateEditTargetLabel();
    updateEffectiveLabel();
}

function syncSlidersToDraft(): void {
    els.scale.value = String(draft.scale);
    els.offsetX.value = String(draft.offsetX);
    els.offsetY.value = String(draft.offsetY);
    els.valScale.textContent = draft.scale.toFixed(2);
    els.valOffsetX.textContent = String(draft.offsetX);
    els.valOffsetY.textContent = String(draft.offsetY);
}

function updateDirtyHint(): void {
    els.dirtyHint.textContent = dirty
        ? '有改动未保存，请点「保存」'
        : '✓ 已保存到 portrait_adjust.ts';
    els.dirtyHint.className = dirty ? 'pt-dirty-hint is-dirty' : 'pt-dirty-hint';
}

function showSaveToast(message: string, isError = false): void {
    els.saveToast.textContent = message;
    els.saveToast.className = isError ? 'pt-save-toast is-error' : 'pt-save-toast';
}

function updateEditTargetLabel(): void {
    const key = editMode === 'folder' ? selectedFolder : selectedImage;
    els.editTarget.textContent = editMode === 'folder'
        ? `保存时将写入：文件夹默认 ${key}`
        : `保存时将写入：单张例外 ${key}`;
}

function updateEffectiveLabel(): void {
    const path = editMode === 'folder' ? (getFolderGuide(selectedFolder).samplePath || selectedImage) : selectedImage;
    const eff = resolvePortraitAdjust(path, adjustData);
    const parts = [
        `滑块预览：scale ${draft.scale.toFixed(2)}，offsetX ${draft.offsetX}，offsetY ${draft.offsetY}`,
        `｜已保存有效值：scale ${eff.scale.toFixed(2)}，offsetX ${eff.offsetX}，offsetY ${eff.offsetY}`,
    ];
    if (hasPortraitImageOverride(selectedImage, adjustData)) parts.push('（当前张有单张覆盖）');
    els.effective.textContent = parts.join('');
}

function imageNeedsReload(img: HTMLImageElement, path: string): boolean {
    if (!path) return false;
    return !(img.src.endsWith(path) || img.src.endsWith(encodeURI(path)));
}

/** 统一刷新预览与标线（保存/滑块/翻页后都走这里） */
function syncPreviewUI(): void {
    updateCurrentTransforms();
    layoutStage();
}

function updateHint(): void {
    const guide = getFolderGuide(selectedFolder);
    if (!guide.samplePath) {
        els.hint.textContent = '① 选中等构图 →「当前张设为样片」→ 拖蓝线(眼)、橙线(胸) → 文件夹默认 → 保存';
        return;
    }
    els.hint.textContent = `左=样片 右=对照。标线默认眼线 ${(PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y * 100).toFixed(0)}%、胸线 ${(PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X * 100).toFixed(0)}%。缩放锚点=两线交汇处。左栏拖线，双击橙线居中。`;
}

function updateCurrentTransforms(): void {
    imgSample.style.transform = '';
    imgSample.style.transformOrigin = '';
    applyPortraitEdgeMask(imgSample);
    applyPortraitAdjustToElement(imgCurrent, selectedImage, getPreviewAdjustData());
}

function applyGuidePositions(): void {
    const guide = getFolderGuide(selectedFolder);
    const sampleLeft = SAMPLE_INSET.left;
    const sampleBottom = SAMPLE_INSET.bottom;
    const spanW = CANVAS_W * 2 + VIEW_GAP;

    els.guideLayer.style.left = `${sampleLeft}px`;
    els.guideLayer.style.bottom = `${sampleBottom}px`;
    els.guideLayer.style.width = `${spanW}px`;
    els.guideLayer.style.height = `${CANVAS_H}px`;

    els.guideEye.style.top = `${guide.eyeLineY * CANVAS_H}px`;
    const chestX = guide.chestLineX * CANVAS_W;
    els.guideChest.style.left = `${chestX}px`;
    els.guideChestMirror.style.left = `${CANVAS_W + VIEW_GAP + chestX}px`;
}

function layoutStage(): void {
    const sampleLeft = SAMPLE_INSET.left;
    const sampleBottom = SAMPLE_INSET.bottom;
    const currentLeft = sampleLeft + CANVAS_W + VIEW_GAP;

    els.viewSample.style.left = `${sampleLeft}px`;
    els.viewSample.style.bottom = `${sampleBottom}px`;
    els.viewCurrent.style.left = `${currentLeft}px`;
    els.viewCurrent.style.bottom = `${sampleBottom}px`;

    applyGuidePositions();
}

function refreshPreview(): void {
    const guide = getFolderGuide(selectedFolder);
    const sampleSrc = guide.samplePath || selectedImage;
    const needSample = imageNeedsReload(imgSample, sampleSrc);
    const needCurrent = imageNeedsReload(imgCurrent, selectedImage);

    if (needSample) imgSample.src = sampleSrc;
    if (needCurrent) imgCurrent.src = selectedImage;

    if (needSample || needCurrent) {
        let pending = (needSample ? 1 : 0) + (needCurrent ? 1 : 0);
        const onload = () => {
            pending -= 1;
            if (pending <= 0) syncPreviewUI();
        };
        if (needSample) imgSample.onload = onload;
        if (needCurrent) imgCurrent.onload = onload;
    } else {
        syncPreviewUI();
    }

    updateHint();
    updateEffectiveLabel();
}

function commitDraftToAdjustData(): void {
    const values: PortraitAdjustValues = {
        scale: draft.scale,
        offsetX: draft.offsetX,
        offsetY: draft.offsetY,
    };
    if (editMode === 'folder') {
        adjustData.folders = adjustData.folders ?? {};
        adjustData.folders[selectedFolder] = values;
    } else {
        adjustData.images = adjustData.images ?? {};
        adjustData.images[selectedImage] = values;
    }
}


function setCurrentAsSample(): void {
    const guide = getFolderGuide(selectedFolder);
    guide.samplePath = selectedImage;
    saveFolderGuide(selectedFolder, guide);
    renderImageList();
    refreshPreview();
}

/** 一键保存：滑块 + 标线 + folderGuides 一并写入 portrait_adjust.ts */
async function saveEverything(): Promise<void> {
    commitDraftToAdjustData();
    dirty = true;
    updateDirtyHint();
    try {
        await saveAdjustToServer();
        loadDraftFromMode();
        syncPreviewUI();
        const guide = getFolderGuide(selectedFolder);
        const target = editMode === 'folder'
            ? `文件夹默认 ${selectedFolder}`
            : `单张 ${selectedImage.split('/').pop()}`;
        showSaveToast(
            `已保存：${target}（scale ${draft.scale.toFixed(2)}，offsetY ${draft.offsetY}，眼线 ${(guide.eyeLineY * 100).toFixed(1)}%，胸线 ${(guide.chestLineX * 100).toFixed(1)}%）· 回游戏刷新后生效`,
        );
    } catch (err) {
        showSaveToast(`保存失败：${err}`, true);
        throw err;
    }
}

/** 对一批图片跑自动校正，写入 adjustData.images，返回 {done, failed} */
async function autoFitImages(images: string[]): Promise<{ done: number; failed: string[] }> {
    const failed: string[] = [];
    let done = 0;
    for (const path of images) {
        const folder = path.match(/^(\/assets\/[^/]+\/)/)?.[1] ?? '';
        const eyeLineY = getFolderGuide(folder).eyeLineY;
        const fit = await autoFitPortraitFromUrl(path, eyeLineY);
        if (fit) {
            adjustData.images = adjustData.images ?? {};
            adjustData.images[path] = fit;
            done += 1;
        } else {
            failed.push(path);
        }
        els.autofitProgress.textContent =
            `自动校正中… ${done + failed.length}/${images.length}（成功 ${done}，失败 ${failed.length}）`;
        // 让出主线程，避免长任务卡 UI
        await new Promise((r) => setTimeout(r, 0));
    }
    return { done, failed };
}

/** 自动校正一组图片 → 保存 → 刷新界面 */
async function runAutoFit(images: string[], label: string): Promise<void> {
    if (images.length === 0) return;
    if (!confirm(`将对${label}共 ${images.length} 张立绘自动校正（覆盖现有单张设置），并保存到 portrait_adjust.ts。继续？`)) {
        return;
    }
    els.autofitProgress.textContent = `自动校正中… 0/${images.length}`;
    try {
        const { done, failed } = await autoFitImages(images);
        dirty = true;
        updateDirtyHint();
        await saveAdjustToServer();
        loadDraftFromMode();
        refreshPreview();
        renderImageList();
        const failNote = failed.length ? `，${failed.length} 张读取失败（已跳过）` : '';
        els.autofitProgress.textContent = `✓ ${label}完成：${done} 张已校正并保存${failNote} · 回游戏 F5 生效`;
        showSaveToast(`自动校正已保存：${done} 张${failNote}`);
    } catch (err) {
        els.autofitProgress.textContent = `保存失败：${err}`;
        showSaveToast(`自动校正保存失败：${err}`, true);
    }
}

function clearImageOverride(): void {
    if (!adjustData.images?.[selectedImage]) return;
    delete adjustData.images[selectedImage];
    if (Object.keys(adjustData.images).length === 0) delete adjustData.images;
    dirty = true;
    updateDirtyHint();
    loadDraftFromMode();
    refreshPreview();
    renderImageList();
}

function navigateImage(delta: number): void {
    const images = getFilteredImages();
    const idx = images.indexOf(selectedImage);
    if (idx === -1) return;
    const next = images[idx + delta];
    if (!next) return;
    selectedImage = next;
    if (editMode === 'image') loadDraftFromMode();
    renderImageList();
    refreshPreview();
}

function resetGuideLines(): void {
    const guide = getFolderGuide(selectedFolder);
    guide.eyeLineY = DEFAULT_GUIDE.eyeLineY;
    guide.chestLineX = DEFAULT_GUIDE.chestLineX;
    saveFolderGuide(selectedFolder, guide);
    syncPreviewUI();
}

function centerChestLine(): void {
    const guide = getFolderGuide(selectedFolder);
    guide.chestLineX = PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X;
    saveFolderGuide(selectedFolder, guide);
    syncPreviewUI();
}

function bindGuideDrag(
    handle: HTMLElement,
    axis: 'eye' | 'chest',
): void {
    let dragging = false;

    const onMove = (clientX: number, clientY: number) => {
        const guide = getFolderGuide(selectedFolder);
        const layerRect = els.guideLayer.getBoundingClientRect();

        if (axis === 'eye') {
            const y = Math.max(0.05, Math.min(0.55, (clientY - layerRect.top) / CANVAS_H));
            guide.eyeLineY = y;
        } else {
            let x = Math.max(0.15, Math.min(0.85, (clientX - layerRect.left) / CANVAS_W));
            if (Math.abs(x - PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X) < 0.02) {
                x = PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X;
            }
            guide.chestLineX = x;
        }
        saveFolderGuide(selectedFolder, guide);
        applyGuidePositions();
        updateCurrentTransforms();
    };

    handle.addEventListener('pointerdown', (e) => {
        dragging = true;
        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        onMove(e.clientX, e.clientY);
    });
    handle.addEventListener('pointerup', () => { dragging = false; });
    handle.addEventListener('pointercancel', () => { dragging = false; });
    if (axis === 'chest') {
        handle.addEventListener('dblclick', (e) => {
            centerChestLine();
            e.preventDefault();
        });
    }
}

async function loadCatalogFromServer(): Promise<void> {
    const res = await fetch('/api/portrait-catalog');
    if (!res.ok) throw new Error(await res.text());
    portraitCatalog = await res.json();
    if (portraitCatalog.length === 0) throw new Error('未扫描到任何立绘 PNG');
    selectedFolder = portraitCatalog[0].folder;
    selectedImage = portraitCatalog[0].images[0] ?? '';
}

async function loadAdjustFromServer(): Promise<void> {
    const res = await fetch('/api/portrait-adjust');
    if (!res.ok) throw new Error(await res.text());
    adjustData = await res.json();
    if (!adjustData.folderGuides) adjustData.folderGuides = {};
    dirty = false;
    updateDirtyHint();
}

async function saveAdjustToServer(): Promise<void> {
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
    updateDirtyHint();
}

function bindEvents(): void {
    els.folder.addEventListener('change', () => {
        selectedFolder = els.folder.value;
        const cat = portraitCatalog.find((c) => c.folder === selectedFolder);
        selectedImage = cat?.images[0] ?? '';
        renderImageList();
        loadDraftFromMode();
        refreshPreview();
    });

    els.search.addEventListener('input', () => renderImageList());

    document.querySelectorAll('input[name="pt-mode"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
            editMode = (e.target as HTMLInputElement).value as EditMode;
            loadDraftFromMode();
            refreshPreview();
        });
    });

    const onSlider = () => {
        dirty = true;
        updateDirtyHint();
        syncPreviewUI();
        updateEffectiveLabel();
    };
    els.scale.addEventListener('input', () => {
        draft.scale = parseFloat(els.scale.value);
        els.valScale.textContent = draft.scale.toFixed(2);
        onSlider();
    });
    els.offsetX.addEventListener('input', () => {
        draft.offsetX = parseInt(els.offsetX.value, 10);
        els.valOffsetX.textContent = String(draft.offsetX);
        onSlider();
    });
    els.offsetY.addEventListener('input', () => {
        draft.offsetY = parseInt(els.offsetY.value, 10);
        els.valOffsetY.textContent = String(draft.offsetY);
        onSlider();
    });

    document.getElementById('pt-set-sample')!.addEventListener('click', setCurrentAsSample);
    document.getElementById('pt-reset-guides')!.addEventListener('click', resetGuideLines);
    document.getElementById('pt-center-chest')!.addEventListener('click', centerChestLine);
    const saveHandler = () => { saveEverything().catch(() => {}); };
    document.getElementById('pt-save-file')!.addEventListener('click', saveHandler);
    document.getElementById('pt-save-bottom')!.addEventListener('click', saveHandler);
    document.getElementById('pt-reset-draft')!.addEventListener('click', () => {
        if (editMode === 'folder') {
            draft = { ...PORTRAIT_ADJUST_NEUTRAL };
        } else {
            const folder = adjustData.folders?.[selectedFolder];
            draft = {
                scale: folder?.scale ?? PORTRAIT_ADJUST_NEUTRAL.scale,
                offsetX: folder?.offsetX ?? PORTRAIT_ADJUST_NEUTRAL.offsetX,
                offsetY: folder?.offsetY ?? PORTRAIT_ADJUST_NEUTRAL.offsetY,
            };
        }
        syncSlidersToDraft();
        refreshPreview();
    });
    document.getElementById('pt-autofit-folder')!.addEventListener('click', () => {
        const cat = portraitCatalog.find((c) => c.folder === selectedFolder);
        runAutoFit(cat?.images ?? [], `文件夹「${selectedFolder}」`).catch(() => {});
    });
    document.getElementById('pt-autofit-all')!.addEventListener('click', () => {
        const all = portraitCatalog.flatMap((c) => c.images);
        runAutoFit(all, '全库').catch(() => {});
    });
    document.getElementById('pt-clear-override')!.addEventListener('click', clearImageOverride);
    document.getElementById('pt-prev')!.addEventListener('click', () => navigateImage(-1));
    document.getElementById('pt-next')!.addEventListener('click', () => navigateImage(1));
    document.getElementById('pt-reload')!.addEventListener('click', () => {
        loadAdjustFromServer()
            .then(() => {
                loadDraftFromMode();
                refreshPreview();
                renderImageList();
                updateDirtyHint();
            })
            .catch((err) => alert(String(err)));
    });

    window.addEventListener('resize', () => syncPreviewUI());
    window.addEventListener('beforeunload', (e) => {
        if (dirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    bindGuideDrag(els.guideEye, 'eye');
    bindGuideDrag(els.guideChest, 'chest');
}

function populateFolders(): void {
    els.folder.innerHTML = portraitCatalog.map(
        (c) => `<option value="${c.folder}">${c.label} (${c.images.length})</option>`,
    ).join('');
    if (selectedFolder) els.folder.value = selectedFolder;
}

async function boot(): Promise<void> {
    imgSample = mountImgInSlot('pt-slot-sample');
    imgCurrent = mountImgInSlot('pt-slot-current');

    els.scale.min = String(SLIDER.scale.min);
    els.scale.max = String(SLIDER.scale.max);
    els.scale.step = String(SLIDER.scale.step);
    els.offsetX.min = els.offsetY.min = String(SLIDER.offset.min);
    els.offsetX.max = els.offsetY.max = String(SLIDER.offset.max);
    els.offsetX.step = els.offsetY.step = String(SLIDER.offset.step);

    bindEvents();

    await loadCatalogFromServer();
    populateFolders();

    try {
        await loadAdjustFromServer();
    } catch (err) {
        console.warn('[PortraitTuner] 使用内置默认配置', err);
        adjustData = structuredClone(DEFAULT_PORTRAIT_ADJUST);
    }

    renderImageList();
    loadDraftFromMode();
    refreshPreview();
    updateDirtyHint();
}

boot().catch((err) => {
    console.error(err);
    alert(`立绘调校工具启动失败：${err}`);
});
