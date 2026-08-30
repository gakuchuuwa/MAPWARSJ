import L from 'leaflet';
import { queryBaseTile } from '../ui/scene13/WorldBaseMap';

/**
 * 战略地图「自然资源点缀」层：地中海 → 葡萄园、干涸盐湖(pal1) → 盐田。
 * 纯装饰点缀，比植被稀疏得多，只为增加地域辨识（盐田白斑 / 葡萄园绿垄）。
 */
const PANE = 'resourceSpotPane';
const SAMPLE_ZOOM = 9;
const SAMPLE_STEP = 360; // 世界像素采样步长（比树 112 稀疏得多 → 点缀而非成片）
const MIN_ZOOM = 8;
const MAX_ZOOM = 10;

/** 地中海框（葡萄园：地中海气候葡萄种植带） */
const MED_BOX = { s: 36, n: 48, w: -10, e: 30 };

interface ResAsset { url: string; w: number; h: number; screenW: number }
const RES: Record<string, ResAsset> = {
    VINEYARD:   { url: '/SUCAI_RESOURCE/VINEYARD/preview.png',   w: 108, h: 92, screenW: 64 },
    SALT_CRACK: { url: '/SUCAI_RESOURCE/SALT_CRACK/preview.png', w: 176, h: 58, screenW: 92 },
};

function hash(x: number, y: number): number {
    const s = Math.sin(x * 12.9898 + y * 78.233);
    return (Math.abs(s) * 43758.5453123) % 1;
}

export class ResourceSpotLayer extends L.Layer {
    private map: L.Map | null = null;
    private canvas = document.createElement('canvas');
    private ctx = this.canvas.getContext('2d');
    private imgs = new Map<string, HTMLImageElement>();
    private ready = false;
    private lastKey = '';

    constructor() {
        super();
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
    }

    public onAdd(map: L.Map): this {
        this.map = map;
        if (!map.getPane(PANE)) map.createPane(PANE);
        const pane = map.getPane(PANE)!;
        pane.style.zIndex = '620'; // 略高于植被色块(610)，资源点压树之上
        pane.style.pointerEvents = 'none';
        pane.appendChild(this.canvas);
        this.resize();
        void this.ensureAssets().then(() => this.render());
        map.on('moveend zoomend resize', this.onViewChange);
        window.addEventListener('land-sea-tiles-updated', this.onTilesUpdated);
        return this;
    }

    public onRemove(map: L.Map): this {
        this.map = null;
        map.off('moveend zoomend resize', this.onViewChange);
        window.removeEventListener('land-sea-tiles-updated', this.onTilesUpdated);
        this.canvas.remove();
        return this;
    }

    private resize(): void {
        if (!this.map) return;
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.canvas.style.width = size.x + 'px';
        this.canvas.style.height = size.y + 'px';
    }

    private async ensureAssets(): Promise<void> {
        const paths = Object.values(RES).map((r) => r.url);
        await Promise.all(paths.map((url) => new Promise<void>((resolve) => {
            const im = new Image();
            im.onload = () => { this.imgs.set(url, im); resolve(); };
            im.onerror = () => resolve();
            im.src = url;
        })));
        this.ready = true;
    }

    private onViewChange = (): void => {
        if (!this.map) return;
        this.resize();
        this.render();
    };

    private onTilesUpdated = (): void => this.onViewChange();

    private pickAsset(lat: number, lng: number): ResAsset | null {
        const tile = queryBaseTile({ lat, lng, isSiege: false, isWinter: false });
        if (tile === 'pal1') return RES.SALT_CRACK; // 干涸盐湖 → 盐田
        if (lat >= MED_BOX.s && lat <= MED_BOX.n && lng >= MED_BOX.w && lng <= MED_BOX.e) {
            // 地中海框内：只有非沙漠/非雪原才放葡萄园（别种在撒哈拉北缘）
            if (tile && !['pal', 'qs', 'pal1', 'ds5', 'des'].includes(tile)) return RES.VINEYARD;
        }
        return null;
    }

    private render(): void {
        if (!this.map || !this.ctx || !this.ready) return;
        const g = this.ctx;
        g.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const zoom = this.map.getZoom();
        if (zoom < MIN_ZOOM || zoom > MAX_ZOOM) return;

        // 世界像素采样：以当前视野左上角为基准，按 SAMPLE_STEP 网格扫点
        const bounds = this.map.getBounds();
        const nw = this.map.project(bounds.getNorthWest(), SAMPLE_ZOOM);
        const se = this.map.project(bounds.getSouthEast(), SAMPLE_ZOOM);
        const startX = Math.floor(nw.x / SAMPLE_STEP) * SAMPLE_STEP;
        const startY = Math.floor(nw.y / SAMPLE_STEP) * SAMPLE_STEP;

        for (let wx = startX; wx <= se.x; wx += SAMPLE_STEP) {
            for (let wy = startY; wy <= se.y; wy += SAMPLE_STEP) {
                // 确定性抖动：避免规整网格，且每屏稳定
                const jx = wx + (hash(wx, wy) - 0.5) * SAMPLE_STEP;
                const jy = wy + (hash(wx, wy + 1) - 0.5) * SAMPLE_STEP;
                const latLng = this.map.unproject(L.point(jx, jy), SAMPLE_ZOOM);
                if (latLng.lat < -58 || latLng.lat > 75) continue;

                const asset = this.pickAsset(latLng.lat, latLng.lng);
                if (!asset) continue;
                // 稀疏概率：资源点是稀有点缀，不是每个命中都画
                if (hash(jx, jy) < 0.55) continue;

                const img = this.imgs.get(asset.url);
                if (!img) continue;
                const p = this.map.latLngToContainerPoint(latLng);
                const w = asset.screenW;
                const h = (asset.h / asset.w) * asset.screenW;
                g.globalAlpha = 0.9;
                g.drawImage(img, p.x - w / 2, p.y - h * 0.7, w, h);
            }
        }
        g.globalAlpha = 1;
    }
}
