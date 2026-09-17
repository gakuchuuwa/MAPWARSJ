import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { getFollowedArmyId } from '../utils/MapFloatingText';

/**
 * 战略地图「海洋生物」层（2026-09-17 优化升级）：
 * 1. 视口海面自然生态：玩家在 zoom 8~10 浏览开阔海域时，偶发海豚跃水、鲸鱼喷水或海龟游弋；
 * 2. 海军跟拍互动：跟拍海上舰队时，优先在舰队周边海域生成伴航海洋生物；
 * 3. 彻底修复 Canvas 平移漂移与每帧误杀 Bug，绝对经纬度固定，持续 16~26 秒后平滑自然消失。
 */
const PANE = 'marineLifePane';
const TRIGGER_INTERVAL_MS = 10_000; // 每 10 秒检查一次是否需要补充海洋动物
const MAX_CREATURES = 2;            // 视口内最多同时存在 2 只，纯点缀不喧宾夺主
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
    id: number;
    kind: 'DOLPHIN' | 'WHALE' | 'BOX_TURTLES';
    lat: number;
    lng: number;
    frame: number;
    expiresAt: number;
    lastFrameAt: number;
}

export class MarineLifeLayer extends L.Layer {
    private map: L.Map | null = null;
    private canvas = document.createElement('canvas');
    private ctx = this.canvas.getContext('2d');
    private imgs = new Map<string, HTMLImageElement>();
    private ready = false;
    private lastTriggerAt = 0;
    private creatures: Creature[] = [];
    private nextCreatureId = 1;
    private rafId: number | null = null;

    constructor() {
        super();
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
    }

    public onAdd(map: L.Map): this {
        this.map = map;
        if (!map.getPane(PANE)) map.createPane(PANE);
        const pane = map.getPane(PANE)!;
        pane.style.zIndex = '578'; // 装饰层，低于 UNITS_LOW(580)
        pane.style.pointerEvents = 'none';
        pane.appendChild(this.canvas);

        this.resize();
        this.syncCanvas();
        void this.ensureAssets();

        this.map.on('move', this.syncCanvas);
        this.map.on('zoom', this.syncCanvas);
        this.map.on('resize', this.resize);
        this.rafId = requestAnimationFrame(this.tick);
        return this;
    }

    public onRemove(map: L.Map): this {
        this.map?.off('move', this.syncCanvas);
        this.map?.off('zoom', this.syncCanvas);
        this.map?.off('resize', this.resize);
        this.map = null;
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.canvas.remove();
        this.creatures = [];
        return this;
    }

    public setVisible(visible: boolean): void {
        this.canvas.style.display = visible ? 'block' : 'none';
        if (!visible) {
            this.creatures = [];
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
        this.syncCanvas();
    };

    private syncCanvas = (): void => {
        if (!this.map) return;
        const topLeft = this.map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);
    };

    private async ensureAssets(): Promise<void> {
        await Promise.all((Object.keys(ASSETS) as Array<'DOLPHIN' | 'WHALE' | 'BOX_TURTLES'>).map(async (kind) => {
            const a = ASSETS[kind];
            const im = new Image();
            await new Promise<void>((resolve) => {
                im.onload = () => resolve();
                im.onerror = () => resolve();
                im.src = a.url;
            });
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
        const _t0 = performance.now();
        try {
            this.tickBody(now);
        } finally {
            perfDoctor.note('MarineLifeLayer.tick(海洋生物层)', performance.now() - _t0, 'src/map/MarineLifeLayer.ts:tick');
        }
    };

    private tickBody(now: number): void {
        if (!this.map || !this.ctx) return;
        const zoom = this.map.getZoom();
        if (zoom < MIN_ZOOM || zoom > MAX_ZOOM) {
            this.render();
            return;
        }

        // 清理过期生物
        if (this.creatures.length > 0) {
            this.creatures = this.creatures.filter(c => now <= c.expiresAt);
        }

        // 尝试生成新生物
        if (this.creatures.length < MAX_CREATURES && now - this.lastTriggerAt >= TRIGGER_INTERVAL_MS) {
            this.tryTrigger(now);
        }

        // 推进各生物动画帧
        const frameInterval = 1000 / FPS;
        for (const c of this.creatures) {
            if (now - c.lastFrameAt > frameInterval) {
                c.lastFrameAt = now;
                const a = ASSETS[c.kind];
                c.frame = (c.frame + 1) % a.frames;
            }
        }

        this.render();
    }

    private tryTrigger(now: number): void {
        if (!this.map || this.creatures.length >= MAX_CREATURES) return;
        this.lastTriggerAt = now;

        let spawnLat = 0;
        let spawnLng = 0;
        let found = false;

        // 优先 1：检查是否有正在跟拍且航行在海面上的舰队
        const followedId = getFollowedArmyId();
        const game = (window as any).game as { legionManager?: { getLegionById(id: string): { getPosition(): { lat: number; lng: number } } | undefined } } | undefined;
        const army = followedId ? game?.legionManager?.getLegionById(followedId) : null;
        const armyPos = army?.getPosition();

        if (armyPos && Number.isFinite(armyPos.lat) && Number.isFinite(armyPos.lng) && LandSeaSystem.isSeaAt(L.latLng(armyPos.lat, armyPos.lng))) {
            for (let i = 0; i < 12; i++) {
                const ang = Math.random() * Math.PI * 2;
                const d = 0.04 + Math.random() * 0.08;
                const tLat = armyPos.lat + Math.sin(ang) * d;
                const tLng = armyPos.lng + Math.cos(ang) * d;
                if (LandSeaSystem.isSeaAt(L.latLng(tLat, tLng))) {
                    spawnLat = tLat;
                    spawnLng = tLng;
                    found = true;
                    break;
                }
            }
        }

        // 优先 2：视野内的开阔海面自然撒点
        if (!found) {
            const bounds = this.map.getBounds();
            const minLat = bounds.getSouth();
            const maxLat = bounds.getNorth();
            const minLng = bounds.getWest();
            const maxLng = bounds.getEast();

            for (let i = 0; i < 16; i++) {
                const rLat = minLat + Math.random() * (maxLat - minLat);
                const rLng = minLng + Math.random() * (maxLng - minLng);
                if (LandSeaSystem.isSeaAt(L.latLng(rLat, rLng))) {
                    spawnLat = rLat;
                    spawnLng = rLng;
                    found = true;
                    break;
                }
            }
        }

        if (!found) return;

        // 暖温海域（|lat| < 42°，如地中海、南洋、红海、波斯湾、加勒比、东海）支持海龟
        const isWarmSea = Math.abs(spawnLat) < 42;
        let kind: 'DOLPHIN' | 'WHALE' | 'BOX_TURTLES';
        if (isWarmSea) {
            const r = Math.random();
            if (r < 0.40) kind = 'WHALE';
            else if (r < 0.75) kind = 'DOLPHIN';
            else kind = 'BOX_TURTLES'; // 25% 概率出现海龟游弋
        } else {
            // 高纬寒带海域保持鲸鱼与海豚
            kind = Math.random() < 0.65 ? 'WHALE' : 'DOLPHIN';
        }

        this.creatures.push({
            id: this.nextCreatureId++,
            kind,
            lat: spawnLat,
            lng: spawnLng,
            frame: Math.floor(Math.random() * ASSETS[kind].frames),
            expiresAt: now + 16000 + Math.random() * 10000,
            lastFrameAt: now,
        });
    }

    private render(): void {
        if (!this.map || !this.ctx) return;
        const g = this.ctx;
        g.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.creatures.length === 0) return;

        const bounds = this.map.getBounds();
        for (const c of this.creatures) {
            // 视口粗筛（留 0.1° 边距防边缘截断）
            if (c.lat < bounds.getSouth() - 0.1 || c.lat > bounds.getNorth() + 0.1 ||
                c.lng < bounds.getWest() - 0.1 || c.lng > bounds.getEast() + 0.1) {
                continue;
            }

            const a = ASSETS[c.kind];
            const img = this.imgs.get(c.kind);
            if (!img) continue;

            const p = this.map.latLngToContainerPoint(L.latLng(c.lat, c.lng));
            const w = a.screenW;
            const h = (a.boxH / a.boxW) * w;
            const sx = c.frame * a.boxW;

            // 切帧绘制（源图水平雪碧图，只取当前帧）
            g.drawImage(img, sx, 0, a.boxW, a.boxH, p.x - w / 2, p.y - h * 0.5, w, h);
        }
    }
}

let marineSingleton: MarineLifeLayer | null = null;

export function registerMarineLifeLayer(layer: MarineLifeLayer): void {
    marineSingleton = layer;
}

export function setMarineAnimalVisible(nextVisible: boolean): void {
    marineSingleton?.setVisible(nextVisible);
}
