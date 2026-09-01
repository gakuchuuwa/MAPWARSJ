import L from 'leaflet';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { getFollowedArmyId } from '../utils/MapFloatingText';

/**
 * 战略地图「海洋生物」层：跟拍海军舰队在海上时，每隔 1 分钟在舰队附近海域
 * 偶发一次海豚跃水 / 鲸鱼喷水（frames.png 雪碧图动画），持续 15~25 秒后消失。
 * 纯装饰点缀，不频繁、不喧宾夺主。
 */
const PANE = 'marineLifePane';
const TRIGGER_INTERVAL_MS = 60_000; // 1 分钟一次
const FPS = 15;
const MIN_ZOOM = 8;
const MAX_ZOOM = 10;

interface CreatureAsset {
    url: string;
    frames: number;
    boxW: number;
    boxH: number;
    anchorX: number;
    anchorY: number;
    screenW: number;
}

const ASSETS: Record<'DOLPHIN' | 'WHALE' | 'BOX_TURTLES', CreatureAsset> = {
    // 硬编码来自 _meta.json（加载时再 fetch 覆盖一次，保证一致）
    DOLPHIN:     { url: '/SUCAI_RESOURCE/DOLPHIN/frames.png',     frames: 104, boxW: 40, boxH: 60, anchorX: 52, anchorY: 56, screenW: 34 },
    WHALE:       { url: '/SUCAI_RESOURCE/WHALE/frames.png',       frames: 241, boxW: 148, boxH: 64, anchorX: 82, anchorY: 58, screenW: 118 },
    BOX_TURTLES: { url: '/SUCAI_RESOURCE/BOX_TURTLES/frames.png', frames: 180, boxW: 68, boxH: 28, anchorX: 32, anchorY: 16, screenW: 42 },
};

interface Creature {
    kind: 'DOLPHIN' | 'WHALE' | 'BOX_TURTLES';
    offsetLat: number; // 相对军团的世界坐标偏移（度）
    offsetLng: number;
    frame: number;
    expiresAt: number;
}

export class MarineLifeLayer extends L.Layer {
    private map: L.Map | null = null;
    private canvas = document.createElement('canvas');
    private ctx = this.canvas.getContext('2d');
    private imgs = new Map<string, HTMLImageElement>();
    private ready = false;
    private lastTriggerAt = 0;
    private creature: Creature | null = null;
    private rafId: number | null = null;
    private lastFrameAt = 0;

    constructor() {
        super();
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
    }

    public onAdd(map: L.Map): this {
        this.map = map;
        if (!map.getPane(PANE)) map.createPane(PANE);
        const pane = map.getPane(PANE)!;
        // 🔴 [2026-08-31] 原为 630，在 UNITS(620) 之上，会盖住海上的舰队。
        //    海面生物同属装饰层，下调到 UNITS_LOW(580) 之下；它只画在海面，与陆上装饰不冲突。
        pane.style.zIndex = '578'; // 装饰层最高，仍低于 UNITS_LOW(580)
        pane.style.pointerEvents = 'none';
        pane.appendChild(this.canvas);
        this.resize();
        void this.ensureAssets();
        map.on('resize', this.resize);
        this.rafId = requestAnimationFrame(this.tick);
        return this;
    }

    public onRemove(map: L.Map): this {
        this.map = null;
        map.off('resize', this.resize);
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.canvas.remove();
        return this;
    }

    public setVisible(visible: boolean): void {
        this.canvas.style.display = visible ? 'block' : 'none';
        if (!visible) {
            this.creature = null;
            if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    private resize = (): void => {
        if (!this.map) return;
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.canvas.style.width = size.x + 'px';
        this.canvas.style.height = size.y + 'px';
    };

    private async ensureAssets(): Promise<void> {
        await Promise.all((Object.keys(ASSETS) as Array<'DOLPHIN' | 'WHALE' | 'BOX_TURTLES'>).map(async (kind) => {
            const a = ASSETS[kind];
            const im = new Image();
            await new Promise<void>((resolve) => { im.onload = () => resolve(); im.onerror = () => resolve(); im.src = a.url; });
            this.imgs.set(kind, im);
            try {
                const r = await fetch(a.url.replace('frames.png', '_meta.json'));
                if (r.ok) {
                    const m = await r.json();
                    if (m) {
                        a.frames = m.frames ?? a.frames;
                        a.boxW = m.box_w ?? a.boxW;
                        a.boxH = m.box_h ?? a.boxH;
                        a.anchorX = m.anchor_x ?? a.anchorX;
                        a.anchorY = m.anchor_y ?? a.anchorY;
                    }
                }
            } catch { /* 用硬编码兜底 */ }
        }));
        this.ready = true;
    }

    private tick = (now: number): void => {
        this.rafId = requestAnimationFrame(this.tick);
        if (!this.map || !this.ctx || !this.ready) return;
        const zoom = this.map.getZoom();
        if (zoom < MIN_ZOOM || zoom > MAX_ZOOM) { this.render(); return; }

        if (!this.creature) {
            if (now - this.lastTriggerAt >= TRIGGER_INTERVAL_MS) this.tryTrigger(now);
            this.render();
            return;
        }

        if (now > this.creature.expiresAt) {
            this.creature = null;
            this.render();
            return;
        }

        if (now - this.lastFrameAt > 1000 / FPS) {
            this.lastFrameAt = now;
            const a = ASSETS[this.creature.kind];
            this.creature.frame = (this.creature.frame + 1) % a.frames;
        }
        this.render();
    };

    private tryTrigger(now: number): void {
        const followedId = getFollowedArmyId();
        if (!followedId) return;
        const game = (window as any).game as { legionManager?: { getLegionById(id: string): { getPosition(): { lat: number; lng: number } } | undefined } } | undefined;
        const army = game?.legionManager?.getLegionById(followedId);
        if (!army) return;
        const pos = army.getPosition();
        if (!pos || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) return;
        // 只有军团在海上（海军舰队）才触发
        if (!LandSeaSystem.isSeaAt(L.latLng(pos.lat, pos.lng))) return;

        this.lastTriggerAt = now;
        // 暖温海域（|lat| < 42°，如地中海、南洋、红海、波斯湾、加勒比、东海）支持海龟
        const isWarmSea = Math.abs(pos.lat) < 42;
        let kind: 'DOLPHIN' | 'WHALE' | 'BOX_TURTLES';
        if (isWarmSea) {
            const r = Math.random();
            if (r < 0.45) kind = 'WHALE';
            else if (r < 0.75) kind = 'DOLPHIN';
            else kind = 'BOX_TURTLES'; // 25% 概率出现海龟游弋
        } else {
            // 高纬寒带海域保持鲸鱼与海豚
            kind = Math.random() < 0.65 ? 'WHALE' : 'DOLPHIN';
        }

        let offsetLat = 0;
        let offsetLng = 0;
        let foundSeaPlacement = false;
        for (let attempt = 0; attempt < 16; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 0.05 + Math.random() * 0.1;
            offsetLat = Math.sin(angle) * dist;
            offsetLng = Math.cos(angle) * dist;
            if (this.isSeaPlacement(pos.lat + offsetLat, pos.lng + offsetLng, kind)) {
                foundSeaPlacement = true;
                break;
            }
        }
        if (!foundSeaPlacement) return;

        this.creature = {
            kind,
            offsetLat,
            offsetLng,
            frame: Math.floor(Math.random() * ASSETS[kind].frames),
            expiresAt: now + 15000 + Math.random() * 10000,
        };
        this.lastFrameAt = now;
    }

    private isSeaPlacement(lat: number, lng: number, kind: Creature['kind']): boolean {
        if (!this.map) return false;
        const a = ASSETS[kind];
        const center = this.map.latLngToContainerPoint(L.latLng(lat, lng));
        const halfW = a.screenW / 2;
        const halfH = (a.boxH / a.boxW) * a.screenW / 2;
        const samples = [
            center,
            L.point(center.x - halfW, center.y),
            L.point(center.x + halfW, center.y),
            L.point(center.x, center.y - halfH),
            L.point(center.x, center.y + halfH),
            L.point(center.x - halfW, center.y - halfH),
            L.point(center.x + halfW, center.y - halfH),
            L.point(center.x - halfW, center.y + halfH),
            L.point(center.x + halfW, center.y + halfH),
        ];
        return samples.every((point) => LandSeaSystem.isSeaAt(this.map!.containerPointToLatLng(point)));
    }

    private render(): void {
        if (!this.map || !this.ctx) return;
        const g = this.ctx;
        g.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!this.creature) return;

        const game = (window as any).game as { legionManager?: { getLegionById(id: string): { getPosition(): { lat: number; lng: number } } | undefined } } | undefined;
        const followedId = getFollowedArmyId();
        if (!followedId) return;
        const army = game?.legionManager?.getLegionById(followedId);
        if (!army) return;
        const pos = army.getPosition();
        if (!pos) return;

        const a = ASSETS[this.creature.kind];
        const img = this.imgs.get(this.creature.kind);
        if (!img) return;

        const lat = pos.lat + this.creature.offsetLat;
        const lng = pos.lng + this.creature.offsetLng;
        if (!this.isSeaPlacement(lat, lng, this.creature.kind)) {
            this.creature = null;
            return;
        }
        const p = this.map.latLngToContainerPoint(L.latLng(lat, lng));
        const w = a.screenW;
        const h = (a.boxH / a.boxW) * w;
        const sx = this.creature.frame * a.boxW;

        // 切帧 drawImage（源图超宽也 OK，只取一帧）
        g.drawImage(img, sx, 0, a.boxW, a.boxH, p.x - w / 2, p.y - h * 0.5, w, h);
    }
}

let marineSingleton: MarineLifeLayer | null = null;

export function registerMarineLifeLayer(layer: MarineLifeLayer): void {
    marineSingleton = layer;
}

export function setMarineAnimalVisible(nextVisible: boolean): void {
    marineSingleton?.setVisible(nextVisible);
}
