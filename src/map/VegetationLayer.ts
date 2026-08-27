import L from 'leaflet';
import { CITIES_V2 } from '../data/cities_v2';
import { resolveTerrainTile } from '../ui/Scene13Biome';
import { pickTree, type TreeSeason } from '../ui/scene13/TreeAssignment';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';

const PANE = 'vegetationPane';
const SAMPLE_ZOOM = 9;
const SAMPLE_STEP = 112;
const MIN_ZOOM = 8;
const MAX_ZOOM = 10;
const BASE_TREE_SIZE = 42;
const CITY_CLEAR_PX = 42;

function hash(x: number, y: number, salt = 0): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453123;
    return n - Math.floor(n);
}

function densityFor(tile: string): number {
    if (tile === 'for' || tile === 'fo2' || tile === 'underbrush_leaves' || tile === 'gr6') return 0.42;
    if (tile === 'grs' || tile === 'gr2' || tile === 'gr3' || tile === 'gr4' || tile === 'sh4' || tile === 'qs2') return 0.28;
    if (tile === 'gr5' || tile === 'gr7' || tile === 'ds2' || tile === 'ds4') return 0.16;
    if (tile === 'snd' || tile === 'sno' || tile === 'sn2' || tile === 'snf') return 0.08;
    if (tile === 'des' || tile === 'pal' || tile === 'pal1' || tile === 'qs' || tile === 'ds5' || tile === 'rck') return 0.045;
    return 0.18;
}

function currentTreeSeason(): TreeSeason {
    const season = (window as any).game?.timeSystem?.getSeason?.() ?? 0;
    if (season === 2) return 1;
    if (season === 3) return 2;
    return 0;
}

export class VegetationLayer {
    private readonly map: L.Map;
    private readonly layerGroup: L.LayerGroup;
    private visible = true;
    private renderTimer: number | null = null;

    private readonly onViewportChanged = () => this.scheduleRender();
    private readonly onTerrainReady = () => this.scheduleRender(200);

    constructor(map: L.Map) {
        this.map = map;
        if (!map.getPane(PANE)) map.createPane(PANE);
        const pane = map.getPane(PANE)!;
        pane.style.zIndex = '590';
        pane.style.pointerEvents = 'none';

        this.layerGroup = L.layerGroup().addTo(map);
        map.on('moveend zoomend resize', this.onViewportChanged);
        window.addEventListener('land-sea-tiles-updated', this.onTerrainReady);
        this.render();
    }

    public setVisible(visible: boolean): void {
        this.visible = visible;
        const pane = this.map.getPane(PANE);
        if (pane) pane.style.display = visible ? 'block' : 'none';
        if (visible) this.scheduleRender();
        else this.layerGroup.clearLayers();
    }

    private scheduleRender(delay = 0): void {
        if (!this.visible) return;
        if (this.renderTimer !== null) window.clearTimeout(this.renderTimer);
        this.renderTimer = window.setTimeout(() => {
            this.renderTimer = null;
            this.render();
        }, delay);
    }

    private render(): void {
        this.layerGroup.clearLayers();
        if (!this.visible) return;

        const zoom = Math.floor(this.map.getZoom());
        const pane = this.map.getPane(PANE);
        const inRange = zoom >= MIN_ZOOM && zoom <= MAX_ZOOM;
        if (pane) pane.style.display = inRange ? 'block' : 'none';
        if (!inRange) return;

        const bounds = this.map.getBounds();
        const nw = this.map.project(bounds.getNorthWest(), SAMPLE_ZOOM);
        const se = this.map.project(bounds.getSouthEast(), SAMPLE_ZOOM);
        const xMin = Math.floor(nw.x / SAMPLE_STEP) * SAMPLE_STEP;
        const xMax = Math.ceil(se.x / SAMPLE_STEP) * SAMPLE_STEP;
        const yMin = Math.floor(nw.y / SAMPLE_STEP) * SAMPLE_STEP;
        const yMax = Math.ceil(se.y / SAMPLE_STEP) * SAMPLE_STEP;
        const season = currentTreeSeason();
        const paddedBounds = bounds.pad(0.08);
        const visibleCities = CITIES_V2
            .filter((city) => paddedBounds.contains([city.lat, city.lng]))
            .map((city) => this.map.latLngToContainerPoint([city.lat, city.lng]));

        for (let wy = yMin; wy <= yMax; wy += SAMPLE_STEP) {
            for (let wx = xMin; wx <= xMax; wx += SAMPLE_STEP) {
                const chance = hash(wx, wy);
                const latLng = this.map.unproject([wx + SAMPLE_STEP * 0.5, wy + SAMPLE_STEP * 0.5], SAMPLE_ZOOM);
                if (latLng.lat < -58 || latLng.lat > 75) continue;

                const elev = LandSeaSystem.getElevationAtMapPixel(
                    wx + SAMPLE_STEP * 0.5,
                    wy + SAMPLE_STEP * 0.5,
                    SAMPLE_ZOOM,
                    latLng.lat,
                    latLng.lng,
                );
                if (elev === null || elev < 0 || elev > 3600) continue;

                const tile = resolveTerrainTile(latLng.lat, latLng.lng, season);
                const density = densityFor(tile);
                if (chance >= density) continue;

                const center = this.map.latLngToContainerPoint(latLng);
                if (visibleCities.some((p) => p.distanceTo(center) < CITY_CLEAR_PX)) continue;

                const asset = pickTree({ baseTile: tile, lat: latLng.lat, lng: latLng.lng, season, isSiege: false });
                const count = density >= 0.4 ? 3 : density >= 0.25 ? 2 : 1;
                for (let i = 0; i < count; i++) {
                    const angle = hash(wx, wy, i + 1) * Math.PI * 2;
                    const radius = i === 0 ? 0 : 15 + hash(wx, wy, i + 11) * 18;
                    const point = L.point(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius * 0.55);
                    if (visibleCities.some((p) => p.distanceTo(point) < CITY_CLEAR_PX)) continue;
                    const pos = this.map.containerPointToLatLng(point);
                    const size = Math.round(BASE_TREE_SIZE * (0.82 + hash(wx, wy, i + 21) * 0.34));
                    const icon = L.divIcon({
                        className: 'strategic-de-vegetation',
                        html: `<img src="/SUCAI_NATURE/${asset}/preview.png" alt="" draggable="false" style="width:${size}px;height:${size}px;object-fit:contain;display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.28));pointer-events:none">`,
                        iconSize: [size, size],
                        iconAnchor: [size / 2, size * 0.88],
                    });
                    L.marker(pos, { icon, pane: PANE, interactive: false }).addTo(this.layerGroup);
                }
            }
        }
    }
}
