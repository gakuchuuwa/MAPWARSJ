/**
 * MAPWAR 立绘调校工具
 * 访问：http://localhost:5173/portrait-tuner.html
 */
import {
    COMBAT_UI_TOKENS as T,
    COMBAT_UI_SCALE,
    uiPx,
} from '../config/combat-ui-tokens';
import {
    DEFAULT_PORTRAIT_ADJUST,
    type PortraitAdjustData,
    type PortraitAdjustValues,
} from '../data/portrait_adjust';
import {
    PORTRAIT_ADJUST_NEUTRAL,
    extractPortraitFolder,
    hasPortraitImageOverride,
    resolvePortraitAdjust,
} from '../config/PortraitAdjust';

type EditMode = 'image' | 'folder';
type CatalogEntry = { folder: string; label: string; images: string[] };

const SLIDER = {
    scale: { min: 0.4, max: 2.2, step: 0.01 },
    offset: { min: -240, max: 240, step: 1 },
} as const;

/** 与 CombatUI 一致：768×1024 在战斗 UI 中的显示尺寸（设计 px） */
const PORTRAIT_CANVAS_H = 550;
const PORTRAIT_CANVAS_W = PORTRAIT_CANVAS_H * (768 / 1024);

/** scale=1.0 时半身立绘常见人物占原图高度比（在此附近视为「不用缩」） */
const BASELINE_CHAR_RATIO_AT_SCALE_1 = 0.88;
/** 人物占比与基准相差在此范围内 → 保持当前锚定 scale，不自动缩小 */
const AUTO_SCALE_TOLERANCE = 0.05;

let adjustData: PortraitAdjustData = structuredClone(DEFAULT_PORTRAIT_ADJUST);
let portraitCatalog: CatalogEntry[] = [];
let selectedFolder = '';
let selectedImage = '';
/** 滑块/写入实际作用的图片；对比模式下可与 selectedImage（右边）分离 */
let editingImagePath = '';
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
    <button type="button" id="pt-save-file" class="pt-btn pt-btn-primary">保存到 portrait_adjust.ts</button>
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
    <div class="pt-preview-wrap">
      <div class="pt-preview-hint">琥珀+青双边框 = 768×1024 PNG 画布（与战斗 UI 同尺寸）· 灰点外框 = 战斗立绘槽 · 红虚线 = 脚底线 · 灰格纹 = 透明区域</div>
      <div class="pt-preview-stage">
        <div class="pt-stage-midline" aria-hidden="true"></div>
        <div class="pt-slot pt-slot-left">
          <div class="pt-slot-label" id="pt-label-left">攻方</div>
          <div class="pt-slot-frame" id="pt-frame-left"></div>
        </div>
        <div class="pt-slot pt-slot-right">
          <div class="pt-slot-label" id="pt-label-right">守方（镜像）</div>
          <div class="pt-slot-frame" id="pt-frame-right"></div>
        </div>
      </div>
    </div>
    <div class="pt-controls">
      <div class="pt-mode">
        <label><input type="radio" name="pt-mode" value="image" checked /> 单张覆盖</label>
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
        <button type="button" id="pt-apply" class="pt-btn">写入当前模式</button>
        <button type="button" id="pt-auto" class="pt-btn">自动估算缩放</button>
        <button type="button" id="pt-reset-draft" class="pt-btn pt-btn-ghost">重置滑块</button>
        <button type="button" id="pt-clear-override" class="pt-btn pt-btn-ghost">清除单张覆盖</button>
        <button type="button" id="pt-pin-ref" class="pt-btn pt-btn-ghost">钉住当前为对比样片</button>
        <button type="button" id="pt-prev" class="pt-btn pt-btn-ghost">上一张</button>
        <button type="button" id="pt-next" class="pt-btn pt-btn-ghost">下一张</button>
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
    frameLeft: document.getElementById('pt-frame-left')!,
    frameRight: document.getElementById('pt-frame-right')!,
    editTarget: document.getElementById('pt-edit-target')!,
    scale: document.getElementById('pt-scale') as HTMLInputElement,
    offsetX: document.getElementById('pt-offsetX') as HTMLInputElement,
    offsetY: document.getElementById('pt-offsetY') as HTMLInputElement,
    valScale: document.getElementById('pt-val-scale')!,
    valOffsetX: document.getElementById('pt-val-offsetX')!,
    valOffsetY: document.getElementById('pt-val-offsetY')!,
    effective: document.getElementById('pt-effective')!,
    labelLeft: document.getElementById('pt-label-left')!,
    labelRight: document.getElementById('pt-label-right')!,
    pinRefBtn: document.getElementById('pt-pin-ref') as HTMLButtonElement,
    autoBtn: document.getElementById('pt-auto') as HTMLButtonElement,
    previewHint: document.querySelector('.pt-preview-hint') as HTMLDivElement,
};

let previewImgLeft: HTMLImageElement;
let previewImgRight: HTMLImageElement;
let previewCanvasLeft: HTMLDivElement;
let previewCanvasRight: HTMLDivElement;
/** 钉住的样片路径；翻页时左侧固定显示它，右侧显示当前张 */
let pinnedReferencePath: string | null = null;

function injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .pt-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 16px; border-bottom: 1px solid #2a2620;
        background: #141210;
      }
      .pt-title { font-size: 18px; font-weight: 700; color: #f5e6c8; }
      .pt-header-actions { display: flex; gap: 8px; align-items: center; }
      .pt-link { color: #8ab4c4; font-size: 13px; text-decoration: none; }
      .pt-body { flex: 1; display: flex; min-height: 0; }
      .pt-sidebar {
        width: 280px; border-right: 1px solid #2a2620; padding: 12px;
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
      .pt-image-item.is-check { box-shadow: inset 3px 0 0 #7cb87c; }
      .pt-image-item.is-tuned::before { content: '● '; color: #7cb87c; }
      .pt-image-item.is-ref-pin::after { content: ' 样'; color: #f5d78e; font-size: 10px; }
      .pt-stats { font-size: 11px; color: #888; }
      .pt-preview-wrap { flex: 1; padding: 16px 16px 48px; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
      .pt-preview-hint { font-size: 12px; color: #9a8f7a; line-height: 1.45; }
      .pt-preview-stage {
        flex: 1; position: relative; min-height: 320px;
        background:
          radial-gradient(ellipse 90% 80% at 50% 55%, rgba(42, 38, 34, 0.55), rgba(14, 13, 12, 0.2)),
          #1a1816;
        border: 1px solid #4a4238; border-radius: 8px; overflow: visible;
      }
      .pt-stage-midline {
        position: absolute; top: 8%; bottom: 8%; left: 50%;
        width: 0; border-left: 1px dashed rgba(253, 185, 49, 0.35);
        transform: translateX(-0.5px); pointer-events: none; z-index: 1;
      }
      .pt-slot { position: absolute; bottom: 0; width: 50%; height: 100%; }
      .pt-slot-left { left: 0; }
      .pt-slot-right { right: 0; }
      .pt-slot-label { position: absolute; top: 8px; font-size: 11px; color: #666; z-index: 2; }
      .pt-slot-left .pt-slot-label { left: 12px; }
      .pt-slot-right .pt-slot-label { right: 12px; }
      .pt-slot-frame {
        position: absolute; bottom: ${uiPx(T.portraitBottom)};
        overflow: visible;
        border: 1px dotted rgba(180, 170, 150, 0.45);
        border-radius: 4px;
        background: transparent;
      }
      .pt-slot-frame.is-editing-target {
        box-shadow: 0 0 0 2px rgba(245, 215, 142, 0.7);
      }
      .pt-slot-frame.is-clickable { cursor: pointer; }
      .pt-slot-frame::before {
        content: '战斗UI槽';
        position: absolute; top: 4px; left: 6px;
        font-size: 10px; color: rgba(180, 170, 150, 0.7);
        pointer-events: none; z-index: 2;
      }
      .pt-slot-left .pt-slot-frame {
        left: ${uiPx(T.portraitInset + T.portraitPullToCenter)};
        width: ${uiPx(T.portraitSlotWidth)}; height: ${uiPx(620)};
      }
      .pt-slot-right .pt-slot-frame {
        right: ${uiPx(T.portraitInset + T.portraitPullToCenter)};
        width: ${uiPx(T.portraitSlotWidth)}; height: ${uiPx(620)};
      }
      .pt-canvas-box {
        position: absolute;
        bottom: 0;
        width: ${uiPx(PORTRAIT_CANVAS_W)};
        height: ${uiPx(PORTRAIT_CANVAS_H)};
        z-index: 2;
        transform-origin: center center;
        border: 2px dashed rgba(253, 185, 49, 0.88);
        box-shadow: inset 0 0 0 1px rgba(96, 196, 255, 0.95);
        border-radius: 2px;
        background-color: #2e2e34;
        background-image:
          linear-gradient(45deg, #3a3a42 25%, transparent 25%),
          linear-gradient(-45deg, #3a3a42 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #3a3a42 75%),
          linear-gradient(-45deg, transparent 75%, #3a3a42 75%);
        background-size: 14px 14px;
        background-position: 0 0, 0 7px, 7px -7px, -7px 0;
        overflow: hidden;
      }
      .pt-slot-left .pt-canvas-box { left: ${uiPx(-T.portraitImageOffset)}; }
      .pt-slot-right .pt-canvas-box { right: ${uiPx(-T.portraitImageOffset)}; }
      .pt-preview-img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: fill;
        box-shadow: 0 16px 28px rgba(0, 0, 0, 0.45);
      }
      .pt-slot-right.pt-slot-compare .pt-slot-frame {
        box-shadow: 0 0 0 2px rgba(126, 200, 140, 0.45);
      }
      .pt-slot-label.is-ref { color: #f5d78e; }
      .pt-slot-label.is-current { color: #9fd4a8; }
      .pt-foot-line {
        position: absolute;
        left: -6px;
        right: -6px;
        bottom: 0;
        height: 4px;
        z-index: 30;
        pointer-events: none;
        background: repeating-linear-gradient(
          90deg,
          #ff5a45 0 10px,
          transparent 10px 16px
        );
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.55),
          0 0 10px rgba(255, 72, 48, 0.95);
      }
      .pt-foot-line::before {
        content: '脚底线';
        position: absolute;
        left: 4px;
        bottom: 6px;
        font-size: 10px;
        line-height: 1;
        color: #ffb4a8;
        text-shadow: 0 0 6px rgba(0, 0, 0, 0.9);
        white-space: nowrap;
      }
      .pt-controls {
        border-top: 1px solid #2a2620; padding: 14px 16px; background: #141210;
        display: flex; flex-direction: column; gap: 10px;
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
      #app { height: 100vh; }
    `;
    document.head.appendChild(style);
}

function initPreviewImages(): void {
    const mount = (frame: HTMLElement, side: 'left' | 'right') => {
        const canvas = document.createElement('div');
        canvas.className = 'pt-canvas-box';
        const img = document.createElement('img');
        img.className = 'pt-preview-img';
        img.alt = side === 'left' ? '攻方立绘预览' : '守方立绘预览';
        canvas.appendChild(img);

        const footLine = document.createElement('div');
        footLine.className = 'pt-foot-line';
        footLine.setAttribute('aria-hidden', 'true');

        frame.appendChild(canvas);
        frame.appendChild(footLine);
        return { img, canvas };
    };
    const left = mount(els.frameLeft, 'left');
    const right = mount(els.frameRight, 'right');
    previewImgLeft = left.img;
    previewImgRight = right.img;
    previewCanvasLeft = left.canvas;
    previewCanvasRight = right.canvas;

    els.frameLeft.addEventListener('click', () => selectEditingTarget('left'));
    els.frameRight.addEventListener('click', () => selectEditingTarget('right'));
}

function withDraftOverlay(
    data: PortraitAdjustData,
    portraitPath: string,
    values: PortraitAdjustValues,
): PortraitAdjustData {
    return {
        ...data,
        images: {
            ...data.images,
            [portraitPath]: { ...values },
        },
    };
}

function selectEditingTarget(side: 'left' | 'right'): void {
    if (side === 'left' && pinnedReferencePath) {
        if (editingImagePath === pinnedReferencePath) return;
        editingImagePath = pinnedReferencePath;
        loadDraftFromMode();
        refreshEditFocusUI();
        return;
    }
    if (editingImagePath === selectedImage && !pinnedReferencePath) return;
    editingImagePath = selectedImage;
    loadDraftFromMode();
    refreshEditFocusUI();
}

function refreshEditFocusUI(): void {
    const editingLeft = pinnedReferencePath !== null && editingImagePath === pinnedReferencePath;
    const editingRight = editingImagePath === selectedImage;

    els.frameLeft.classList.toggle('is-editing-target', editingLeft);
    els.frameRight.classList.toggle('is-editing-target', editingRight);
    els.frameLeft.classList.toggle('is-clickable', pinnedReferencePath !== null);
    els.frameRight.classList.toggle('is-clickable', pinnedReferencePath !== null);

    updateEditTargetLabel();
    updateEffectiveLabel();
    updatePreviewTransforms();
    renderImageList();
}

function setupSliders(): void {
    const bind = (input: HTMLInputElement, key: keyof PortraitAdjustValues, label: HTMLElement) => {
        input.min = String(key === 'scale' ? SLIDER.scale.min : SLIDER.offset.min);
        input.max = String(key === 'scale' ? SLIDER.scale.max : SLIDER.offset.max);
        input.step = String(key === 'scale' ? SLIDER.scale.step : SLIDER.offset.step);
        input.addEventListener('input', () => {
            const v = key === 'scale' ? parseFloat(input.value) : parseInt(input.value, 10);
            draft[key] = v as never;
            label.textContent = key === 'scale' ? v.toFixed(2) : String(v);
            updatePreviewTransforms();
        });
    };
    bind(els.scale, 'scale', els.valScale);
    bind(els.offsetX, 'offsetX', els.valOffsetX);
    bind(els.offsetY, 'offsetY', els.valOffsetY);
}

function populateFolders(): void {
    els.folder.innerHTML = portraitCatalog.map(
        (c) => `<option value="${c.folder}">${c.label} (${c.images.length})</option>`,
    ).join('');
    if (selectedFolder) els.folder.value = selectedFolder;
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
    if (!images.includes(selectedImage) && images.length > 0) {
        selectedImage = images[0];
        editingImagePath = selectedImage;
    }
    els.imageList.innerHTML = images.map((path) => {
        const name = path.split('/').pop() ?? path;
        const active = path === editingImagePath ? ' is-active' : '';
        const check = pinnedReferencePath && path === selectedImage && path !== editingImagePath
            ? ' is-check'
            : '';
        const refPin = pinnedReferencePath && path === pinnedReferencePath ? ' is-ref-pin' : '';
        const mark = hasPortraitImageOverride(path, adjustData) ? ' is-tuned' : '';
        return `<button type="button" class="pt-image-item${active}${check}${refPin}${mark}" data-path="${path}">${name}</button>`;
    }).join('');

    els.imageList.querySelectorAll('.pt-image-item').forEach((btn) => {
        btn.addEventListener('click', () => {
            const path = (btn as HTMLElement).dataset.path!;
            if (pinnedReferencePath && path === pinnedReferencePath) {
                editingImagePath = pinnedReferencePath;
                loadDraftFromMode();
                refreshEditFocusUI();
                return;
            }
            selectedImage = path;
            if (!pinnedReferencePath || editingImagePath !== pinnedReferencePath) {
                editingImagePath = path;
            }
            renderImageList();
            loadDraftFromMode();
            refreshPreview();
        });
    });

    updateStats();
}

function updateStats(): void {
    const imageCount = Object.keys(adjustData.images ?? {}).length;
    const folderCount = Object.keys(adjustData.folders ?? {}).length;
    const total = ALL_PORTRAIT_COUNT();
    els.stats.textContent = `已调校：单张 ${imageCount} · 文件夹 ${folderCount} · 库内 ${total} 张`;
}

function ALL_PORTRAIT_COUNT(): number {
    return portraitCatalog.reduce((n, c) => n + c.images.length, 0);
}

function getEditKey(): string {
    return editMode === 'folder' ? selectedFolder : editingImagePath;
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
        draft = { ...resolvePortraitAdjust(editingImagePath, adjustData) };
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

function updateEditTargetLabel(): void {
    const key = getEditKey();
    if (editMode === 'folder') {
        els.editTarget.textContent = `正在编辑文件夹默认：${key}（该文件夹内未单独覆盖的图共用）`;
        return;
    }
    if (pinnedReferencePath && editingImagePath === pinnedReferencePath) {
        els.editTarget.textContent = `正在编辑左边样片：${key}`;
        return;
    }
    if (pinnedReferencePath) {
        els.editTarget.textContent = `正在编辑右边当前张：${key}`;
        return;
    }
    els.editTarget.textContent = `正在编辑单张：${key}`;
}

function updateEffectiveLabel(): void {
    const eff = resolvePortraitAdjust(editingImagePath, adjustData);
    const parts: string[] = [
        `当前编辑有效值：scale ${eff.scale.toFixed(2)}，offsetX ${eff.offsetX}，offsetY ${eff.offsetY}`,
    ];
    if (hasPortraitImageOverride(editingImagePath, adjustData)) {
        parts.push('（含单张覆盖）');
    } else if (adjustData.folders?.[extractPortraitFolder(editingImagePath) ?? '']) {
        parts.push('（来自文件夹默认）');
    } else {
        parts.push('（未调校，使用默认）');
    }
    if (pinnedReferencePath && editingImagePath === pinnedReferencePath && selectedImage !== editingImagePath) {
        parts.push(`；右边对照：${selectedImage.split('/').pop()}`);
    }
    els.effective.textContent = parts.join(' ');
}

function applyCanvasTransform(
    canvas: HTMLElement,
    portraitPath: string,
    data: PortraitAdjustData,
    mirror: boolean,
): void {
    const adj = resolvePortraitAdjust(portraitPath, data);
    const ox = Math.round(adj.offsetX * COMBAT_UI_SCALE);
    const oy = Math.round(adj.offsetY * COMBAT_UI_SCALE);
    const base = `translate(${ox}px, ${oy}px) scale(${adj.scale})`;
    canvas.style.transform = mirror ? `${base} scaleX(-1)` : base;
}

function updateCompareLabels(): void {
    const leftSlot = els.labelLeft.parentElement!;
    const rightSlot = els.labelRight.parentElement!;
    if (pinnedReferencePath) {
        els.labelLeft.textContent = '对比样片（点左边可选中）';
        els.labelRight.textContent = '当前这张（点右边可选中）';
        els.labelLeft.className = 'pt-slot-label is-ref';
        els.labelRight.className = 'pt-slot-label is-current';
        leftSlot.classList.remove('pt-slot-compare');
        rightSlot.classList.add('pt-slot-compare');
        els.pinRefBtn.textContent = '取消样片对比';
        els.autoBtn.textContent = '对齐样片大小';
        els.previewHint.textContent =
            '对比模式：左 = 样片 · 右 = 翻页对照 · 点左边/列表带「样」= 编辑样片；点右边/其他列表项 = 编辑当前张';
    } else {
        els.labelLeft.textContent = '攻方';
        els.labelRight.textContent = '守方（镜像）';
        els.labelLeft.className = 'pt-slot-label';
        els.labelRight.className = 'pt-slot-label';
        rightSlot.classList.remove('pt-slot-compare');
        els.pinRefBtn.textContent = '钉住当前为对比样片';
        els.autoBtn.textContent = '自动估算缩放';
        els.previewHint.textContent =
            '琥珀+青双边框 = 768×1024 PNG 画布 · 灰点外框 = 战斗立绘槽 · 红虚线 = 脚底线 · 顺眼就 scale=1 直接写入，自动估算不会把普通半身缩小';
    }
}

function updatePreviewTransforms(): void {
    if (pinnedReferencePath) {
        const leftData = editingImagePath === pinnedReferencePath
            ? withDraftOverlay(adjustData, pinnedReferencePath, draft)
            : adjustData;
        const rightData = editingImagePath === selectedImage
            ? withDraftOverlay(adjustData, selectedImage, draft)
            : adjustData;
        applyCanvasTransform(previewCanvasLeft, pinnedReferencePath, leftData, false);
        applyCanvasTransform(previewCanvasRight, selectedImage, rightData, false);
        return;
    }

    const previewData = withDraftOverlay(adjustData, selectedImage, draft);
    applyCanvasTransform(previewCanvasLeft, selectedImage, previewData, false);
    applyCanvasTransform(previewCanvasRight, selectedImage, previewData, true);
}

function refreshPreview(): void {
    if (pinnedReferencePath) {
        previewImgLeft.src = pinnedReferencePath;
        previewImgRight.src = selectedImage;
    } else {
        previewImgLeft.src = selectedImage;
        previewImgRight.src = selectedImage;
    }
    previewImgRight.onload = () => updatePreviewTransforms();
    previewImgLeft.onload = () => updatePreviewTransforms();
    updatePreviewTransforms();
    updateEffectiveLabel();
    updateCompareLabels();
    refreshEditFocusUI();
}

function togglePinReference(): void {
    if (pinnedReferencePath === selectedImage) {
        pinnedReferencePath = null;
        editingImagePath = selectedImage;
    } else {
        pinnedReferencePath = selectedImage;
        editingImagePath = selectedImage;
    }
    refreshPreview();
}

function clearPinnedReference(): void {
    pinnedReferencePath = null;
    editingImagePath = selectedImage;
    updateCompareLabels();
    refreshEditFocusUI();
}

function writeCurrentMode(): void {
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
        adjustData.images[editingImagePath] = values;
    }
    dirty = true;
    renderImageList();
    updateEffectiveLabel();
    updatePreviewTransforms();
}

function clearImageOverride(): void {
    if (!adjustData.images?.[editingImagePath]) return;
    delete adjustData.images[editingImagePath];
    if (Object.keys(adjustData.images).length === 0) delete adjustData.images;
    dirty = true;
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
    if (!pinnedReferencePath || editingImagePath !== pinnedReferencePath) {
        editingImagePath = selectedImage;
    }
    renderImageList();
    loadDraftFromMode();
    refreshPreview();
}

type CharBBoxMeasure = {
    charRatio: number;
    /** 人物 bbox 底边到原图底边的留白占比 */
    bottomMarginRatio: number;
};

async function loadImageForMeasure(src: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    await img.decode().catch(() => {
        throw new Error(`图片加载失败：${src}`);
    });
    return img;
}

async function measureCharacterBBox(portraitPath: string): Promise<CharBBoxMeasure | null> {
    const img = await loadImageForMeasure(portraitPath);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let minY = height;
    let maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const a = data[(y * width + x) * 4 + 3];
            if (a > 16) {
                found = true;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (!found) return null;

    const bboxH = maxY - minY + 1;
    return {
        charRatio: bboxH / height,
        bottomMarginRatio: (height - maxY) / height,
    };
}

function clampScale(value: number): number {
    return Math.min(SLIDER.scale.max, Math.max(SLIDER.scale.min, value));
}

function clampOffset(value: number): number {
    return Math.min(SLIDER.offset.max, Math.max(SLIDER.offset.min, Math.round(value)));
}

async function estimateAutoScale(): Promise<void> {
    const measurePath = editingImagePath || selectedImage;
    const curMeasure = await measureCharacterBBox(measurePath);
    if (!curMeasure) {
        alert('未检测到不透明像素，请手动调节');
        return;
    }

    if (pinnedReferencePath && measurePath === selectedImage && measurePath !== pinnedReferencePath) {
        const refMeasure = await measureCharacterBBox(pinnedReferencePath);
        if (!refMeasure) {
            alert('样片未检测到不透明像素，请换一张样片或手动调节');
            return;
        }

        const refAdj = resolvePortraitAdjust(pinnedReferencePath, adjustData);
        const suggestedScale = refAdj.scale * (refMeasure.charRatio / curMeasure.charRatio);
        draft.scale = clampScale(suggestedScale);
    } else {
        const folderAdj = adjustData.folders?.[selectedFolder];
        const anchorScale = folderAdj?.scale ?? PORTRAIT_ADJUST_NEUTRAL.scale;
        const ratioGap = Math.abs(curMeasure.charRatio - BASELINE_CHAR_RATIO_AT_SCALE_1);

        if (ratioGap <= AUTO_SCALE_TOLERANCE) {
            draft.scale = anchorScale;
        } else {
            draft.scale = clampScale(
                anchorScale * (BASELINE_CHAR_RATIO_AT_SCALE_1 / curMeasure.charRatio),
            );
        }
    }

    syncSlidersToDraft();
    updatePreviewTransforms();
}

async function loadCatalogFromServer(): Promise<void> {
    const res = await fetch('/api/portrait-catalog');
    if (!res.ok) throw new Error(await res.text());
    portraitCatalog = await res.json();
    if (portraitCatalog.length === 0) throw new Error('未扫描到任何立绘 PNG');
    selectedFolder = portraitCatalog[0].folder;
    selectedImage = portraitCatalog[0].images[0] ?? '';
    editingImagePath = selectedImage;
}

async function loadAdjustFromServer(): Promise<void> {
    const res = await fetch('/api/portrait-adjust');
    if (!res.ok) throw new Error(await res.text());
    adjustData = await res.json();
    dirty = false;
}

async function saveAdjustToServer(): Promise<void> {
    const res = await fetch('/api/save-portrait-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustData),
    });
    const result = await res.json();
    if (!result.ok) throw new Error(result.error || '保存失败');
    dirty = false;
    alert('已写入 src/data/portrait_adjust.ts');
}

function bindEvents(): void {
    els.folder.addEventListener('change', () => {
        selectedFolder = els.folder.value;
        clearPinnedReference();
        const cat = portraitCatalog.find((c) => c.folder === selectedFolder);
        selectedImage = cat?.images[0] ?? '';
        editingImagePath = selectedImage;
        renderImageList();
        loadDraftFromMode();
        refreshPreview();
    });

    els.search.addEventListener('input', () => renderImageList());

    document.querySelectorAll('input[name="pt-mode"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
            editMode = (e.target as HTMLInputElement).value as EditMode;
            loadDraftFromMode();
            updatePreviewTransforms();
        });
    });

    document.getElementById('pt-apply')!.addEventListener('click', writeCurrentMode);
    document.getElementById('pt-auto')!.addEventListener('click', () => {
        estimateAutoScale().catch((err) => alert(String(err)));
    });
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
        updatePreviewTransforms();
    });
    document.getElementById('pt-clear-override')!.addEventListener('click', clearImageOverride);
    document.getElementById('pt-pin-ref')!.addEventListener('click', togglePinReference);
    document.getElementById('pt-prev')!.addEventListener('click', () => navigateImage(-1));
    document.getElementById('pt-next')!.addEventListener('click', () => navigateImage(1));
    document.getElementById('pt-reload')!.addEventListener('click', () => {
        loadAdjustFromServer()
            .then(() => {
                loadDraftFromMode();
                refreshPreview();
                renderImageList();
            })
            .catch((err) => alert(String(err)));
    });
    document.getElementById('pt-save-file')!.addEventListener('click', () => {
        saveAdjustToServer().catch((err) => alert(String(err)));
    });

    window.addEventListener('beforeunload', (e) => {
        if (dirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

async function boot(): Promise<void> {
    initPreviewImages();
    setupSliders();
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
}

boot().catch((err) => {
    console.error(err);
    alert(`立绘调校工具启动失败：${err}`);
});
