import L from 'leaflet';
import {
    FOREST_DENSITY_BY_REGION,
    FOREST_SCALE_BY_REGION,
    FOREST_TEXTURES_BY_REGION,
    forestPatchSpriteRange,
    getForestTextures,
} from '../config/tree-assets';
import { getRegion, type RegionType } from '../systems/RegionSystem';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';

const BASE_DENSITY_THRESHOLD = 0.76;
const TREELINE_ELEV = 3600;
/** 森林斑块锚点间距（世界像素，越大越稀疏） */
const WORLD_STEP = 120;
/** 文化区内采样半径（世界像素），用于排除边界格 */
const REGION_INTERIOR_PROBE = WORLD_STEP * 0.42;
const TEX_DISPLAY_W = 56;
/**
 * 斑块内各贴图「底座锚点」横向间距（世界像素）。
 * Stitch 贴图带菱形土台，间距约 0.4×显示宽时土台边缘相连。
 */
const PATCH_BASE_SPREAD = 30;
/** 底座锚点纵向微偏移上限（世界像素），保持同一地面又略有色深 */
const PATCH_BASE_Y_JITTER = 2;
const LOCKED_ZOOM = 9;

/** 归一化底座布局：同簇内土台横向重叠、纵向几乎共线 */
const PATCH_BASE_LAYOUT: readonly [number, number][] = [
    [0, 0],
    [-0.46, 0.02],
    [0.46, 0.02],
    [-0.24, -0.03],
    [0.24, -0.03],
    [0, 0.05],
    [-0.36, 0.04],
    [0.36, 0.04],
];

interface ForestStamp {
    x: number;
    y: number;
    w: number;
    h: number;
    tex: TextureSprite;
    rotation: number;
}

interface TextureSprite {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
}

function hash(x: number, y: number): number {
    const sin = Math.sin(x * 12.9898 + y * 78.233);
    return (Math.abs(sin) * 43758.5453123) % 1;
}

function smoothNoise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    const v1 = hash(ix, iy);
    const v2 = hash(ix + 1, iy);
    const v3 = hash(ix, iy + 1);
    const v4 = hash(ix + 1, iy + 1);

    const i1 = v1 * (1 - fx) + v2 * fx;
    const i2 = v3 * (1 - fx) + v4 * fx;

    return i1 * (1 - fy) + i2 * fy;
}

function densityThreshold(region: RegionType): number {
    const factor = FOREST_DENSITY_BY_REGION[region] ?? 0.6;
    return BASE_DENSITY_THRESHOLD + (1 - factor) * 0.1;
}

/** 锚点及四向探针须同属一区，文化边界不放树 */
function isRegionInterior(
    worldX: number,
    worldY: number,
    region: RegionType,
    map: L.Map,
    z: number
): boolean {
    const probes: [number, number][] = [
        [0, 0],
        [REGION_INTERIOR_PROBE, 0],
        [-REGION_INTERIOR_PROBE, 0],
        [0, REGION_INTERIOR_PROBE],
        [0, -REGION_INTERIOR_PROBE],
    ];
    for (const [dx, dy] of probes) {
        const pt = map.unproject(new L.Point(worldX + dx, worldY + dy), z);
        if (getRegion(pt.lat, pt.lng) !== region) return false;
    }
    return true;
}

/** 抠除白底 / 灰白棋盘格（Stitch 导出常见） */
function chromaKeyTreeBackground(imageData: ImageData): void {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max - min;
        const lum = (r + g + b) / 3;

        const isWhite = r > 245 && g > 245 && b > 245;
        const isCheckerOrGrayBg = sat < 28 && lum > 95;
        const isGreenScreen = g > 200 && r < 100 && b < 100;

        if (isWhite || isCheckerOrGrayBg || isGreenScreen) {
            data[i + 3] = 0;
        }
    }
}

async function loadForestTexture(url: string): Promise<TextureSprite> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return { canvas, width: 1, height: 1 };
    }

    await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            chromaKeyTreeBackground(imageData);
            ctx.putImageData(imageData, 0, 0);
            resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load forest texture: ${url}`));
        img.src = url;
    });

    return { canvas, width: canvas.width, height: canvas.height };
}

function patchBaseOffset(
    index: number,
    anchorX: number,
    anchorY: number
): [number, number] {
    const layout = PATCH_BASE_LAYOUT[index % PATCH_BASE_LAYOUT.length];
    const ring = Math.floor(index / PATCH_BASE_LAYOUT.length);
    const ringShrink = 1 / (1 + ring * 0.22);
    const jitterX = (hash(anchorX + index * 3.1, anchorY + index * 7.9) - 0.5) * 0.06;
    const jitterY =
        (hash(anchorX + index * 11.3, anchorY + index * 5.7) - 0.5) *
        (PATCH_BASE_Y_JITTER / PATCH_BASE_SPREAD);
    return [
        (layout[0] + jitterX) * PATCH_BASE_SPREAD * ringShrink,
        (layout[1] + jitterY) * PATCH_BASE_SPREAD * ringShrink,
    ];
}

function buildForestPatchStamps(
    anchorX: number,
    anchorY: number,
    region: RegionType,
    texPaths: readonly string[],
    textureCache: Map<string, TextureSprite[]>,
    z: number,
    map: L.Map
): ForestStamp[] {
    const [minN, maxN] = forestPatchSpriteRange(region);
    const count = minN + Math.floor(hash(anchorX, anchorY) * (maxN - minN + 1));
    const scaleBoost = FOREST_SCALE_BY_REGION[region] ?? 1;
    const stamps: ForestStamp[] = [];

    const path = texPaths[0];
    const sprites = textureCache.get(path);
    if (!sprites || sprites.length === 0) return stamps;
    const tex = sprites[0];

    for (let i = 0; i < count; i++) {
        const h4 = hash(anchorX + i * 11.1, anchorY + i * 19.6);
        const [offsetX, offsetY] = patchBaseOffset(i, anchorX, anchorY);

        const worldX = anchorX + offsetX;
        const worldY = anchorY + offsetY;

        const latLng = map.unproject(new L.Point(worldX, worldY), z);
        const pt = map.latLngToContainerPoint(latLng);

        const scale = (0.82 + h4 * 0.22) * scaleBoost;
        const w = TEX_DISPLAY_W * scale;
        const h = w * (tex.height / tex.width);
        const rotation = (hash(anchorX + i * 9.3, anchorY + i * 13.7) - 0.5) * 0.08;

        stamps.push({ x: pt.x, y: pt.y, w, h, tex, rotation });
    }

    return stamps;
}

export class TreeLayer extends L.Layer {
    private mapInstance: L.Map;
    private canvas: HTMLCanvasElement;
    private paneName = 'treePane';
    private isActive = false;
    private textureCache = new Map<string, TextureSprite[]>();
    private texturesReady = false;
    private redrawTimeout: number | null = null;
    private renderPending = false;

    private readonly onMoveEnd = () => this.scheduleRender();
    private readonly onResize = () => this.resize();
    private readonly onTilesUpdated = () => this.scheduleRender(300);

    constructor(map: L.Map) {
        super();
        this.mapInstance = map;
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'tree-layer leaflet-zoom-animated';
        this.canvas.style.pointerEvents = 'none';
    }

    public addTo(map: L.Map): this {
        if (!map.hasLayer(this)) {
            map.addLayer(this);
        }
        return this;
    }

    public onAdd(map: L.Map): this {
        this.isActive = true;
        this.initPane(map);
        this.resize();
        void this.ensureTextures().then(() => this.render());

        map.on('moveend', this.onMoveEnd);
        map.on('zoomend', this.onMoveEnd);
        map.on('resize', this.onResize);
        window.addEventListener('land-sea-tiles-updated', this.onTilesUpdated);

        return this;
    }

    public onRemove(map: L.Map): this {
        this.isActive = false;
        map.off('moveend', this.onMoveEnd);
        map.off('zoomend', this.onMoveEnd);
        map.off('resize', this.onResize);
        window.removeEventListener('land-sea-tiles-updated', this.onTilesUpdated);

        if (this.redrawTimeout) {
            window.clearTimeout(this.redrawTimeout);
            this.redrawTimeout = null;
        }

        this.canvas.remove();
        return this;
    }

    private initPane(map: L.Map): void {
        if (!map.getPane(this.paneName)) {
            map.createPane(this.paneName);
        }
        const pane = map.getPane(this.paneName)!;
        pane.style.zIndex = '610';
        pane.style.pointerEvents = 'none';
        pane.appendChild(this.canvas);
    }

    private async ensureTextures(): Promise<void> {
        if (this.texturesReady) return;

        const paths = new Set<string>();
        for (const texList of Object.values(FOREST_TEXTURES_BY_REGION)) {
            if (!texList) continue;
            for (const p of texList) paths.add(p);
        }

        for (const path of paths) {
            if (this.textureCache.has(path)) continue;
            try {
                const sprite = await loadForestTexture(path);
                this.textureCache.set(path, [sprite]);
            } catch (err) {
                console.warn('[TreeLayer] texture load failed:', path, err);
            }
        }

        this.texturesReady = true;
    }

    private resize(): void {
        const size = this.mapInstance.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;

        const topLeft = this.mapInstance.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);

        if (this.isActive) {
            this.scheduleRender();
        }
    }

    private scheduleRender(delayMs = 0): void {
        if (!this.isActive) return;
        if (this.redrawTimeout) {
            window.clearTimeout(this.redrawTimeout);
        }
        this.redrawTimeout = window.setTimeout(() => {
            this.redrawTimeout = null;
            void this.render();
        }, delayMs);
    }

    private async render(): Promise<void> {
        if (!this.isActive || this.renderPending) return;
        this.renderPending = true;

        try {
            await this.ensureTextures();

            const ctx = this.canvas.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.mapInstance.getZoom() !== LOCKED_ZOOM) return;

            const topLeft = this.mapInstance.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(this.canvas, topLeft);

            const bounds = this.mapInstance.getBounds();
            const z = LOCKED_ZOOM;

            const nwPt = this.mapInstance.project(bounds.getNorthWest(), z);
            const sePt = this.mapInstance.project(bounds.getSouthEast(), z);

            const xMin = Math.floor(nwPt.x / WORLD_STEP) * WORLD_STEP;
            const xMax = Math.ceil(sePt.x / WORLD_STEP) * WORLD_STEP;
            const yMin = Math.floor(nwPt.y / WORLD_STEP) * WORLD_STEP;
            const yMax = Math.ceil(sePt.y / WORLD_STEP) * WORLD_STEP;

            const noiseScale = 0.01;
            const regionCache = new Map<string, RegionType>();

            const getRegionAt = (lat: number, lng: number): RegionType => {
                const key = `${Math.floor(lat * 3)},${Math.floor(lng * 3)}`;
                if (!regionCache.has(key)) {
                    regionCache.set(key, getRegion(lat, lng));
                }
                return regionCache.get(key)!;
            };

            const allStamps: ForestStamp[] = [];

            for (let globalY = yMin; globalY <= yMax; globalY += WORLD_STEP) {
                for (let globalX = xMin; globalX <= xMax; globalX += WORLD_STEP) {
                    const cellCx = globalX + WORLD_STEP * 0.5;
                    const cellCy = globalY + WORLD_STEP * 0.5;

                    const noiseVal = smoothNoise(cellCx * noiseScale, cellCy * noiseScale);

                    const latLng = this.mapInstance.unproject(new L.Point(cellCx, cellCy), z);
                    const region = getRegionAt(latLng.lat, latLng.lng);

                    const texPaths = getForestTextures(region);
                    if (!texPaths || texPaths.length === 0) continue;

                    if (!isRegionInterior(cellCx, cellCy, region, this.mapInstance, z)) continue;

                    if (noiseVal < densityThreshold(region)) continue;

                    const elev = LandSeaSystem.getElevationAtMapPixel(
                        cellCx,
                        cellCy,
                        z,
                        latLng.lat,
                        latLng.lng
                    );
                    if (elev === null || elev < 0 || elev > TREELINE_ELEV) continue;

                    const patchStamps = buildForestPatchStamps(
                        cellCx,
                        cellCy,
                        region,
                        texPaths,
                        this.textureCache,
                        z,
                        this.mapInstance
                    );
                    allStamps.push(...patchStamps);
                }
            }

            allStamps.sort((a, b) => a.y - b.y);
            for (const s of allStamps) {
                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.rotation);
                ctx.drawImage(s.tex.canvas, -s.w * 0.5, -s.h * 0.88, s.w, s.h);
                ctx.restore();
            }
        } finally {
            this.renderPending = false;
        }
    }
}
