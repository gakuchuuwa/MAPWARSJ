/**
 * 据点名字「轻微上下颤抖」自动侦测（2026-11-09 主人报：战略地图上战斗刚失败、人物静止时，所有据点名字轻微上下颤抖；
 * 截图拍不出来，无头浏览器按同一流程（入伍 → 随军战败 → 原地停顿）120 帧内名字与地图层纹丝不动，复现不了）。
 *
 * 主人不用做任何事：DEV 下每帧量画面中央附近几个据点名字的屏幕 Y 与地图层位置，
 * 一旦某个名字在 ≤4px 的幅度里来回翻转（30 帧内方向反转 ≥6 次）就把现场落盘：
 *   名字 Y 序列 / 每个名字当下的 transform / 地图层位置序列（看小数部分）/ zoom / devicePixelRatio /
 *   玩家停顿与否 / 战术画面状态 / 镜头跟谁 —— 落到 scratch/stuck_legion_log.jsonl（probe:'label-jitter'），
 *   复用现成的 /api/stuck-legion 端点（不改 vite.config，改它会刷掉主人正在跑的局）。最多每 60 秒一条。
 */
import type L from 'leaflet';

const WINDOW = 30;
const MIN_FLIPS = 6;
const MAX_AMPLITUDE_PX = 4;
const DUMP_INTERVAL_MS = 60_000;
const N_LABELS = 6;

interface Sample { t: number; pane: [number, number]; tops: number[] }

class LabelJitterProbe {
    private frame = 0;
    private samples: Sample[] = [];
    private labels: HTMLElement[] = [];
    private labelsPickedAt = 0;
    private lastDumpAt = -Infinity;

    /** 主循环每帧调一次（DEV） */
    public tick(map: L.Map): void {
        // 每帧都采：隔帧采样会把「逐帧来回翻」的颤抖采成同一相位、看起来一动不动（自测踩过）
        this.frame++;
        const now = performance.now();
        if (now - this.labelsPickedAt > 3000 || this.labels.some((el) => !el.isConnected)) this.pickLabels(map);
        if (this.labels.length === 0) return;
        const pp = (map as unknown as { _getMapPanePos(): { x: number; y: number } })._getMapPanePos();
        // 🔴 不读 getBoundingClientRect：每帧读会强制同步排版（6 分钟实测自身吃 279ms）。
        //    名字的屏幕 Y = 地图层 y + 标记自身 _leaflet_pos.y（纯 JS 数，零排版），正好就是要盯的「是否停在小数像素上来回变」。
        this.samples.push({ t: now, pane: [pp.x, pp.y], tops: this.labels.map((el) => pp.y + (this.markerPos(el)?.y ?? 0)) });
        if (this.samples.length > WINDOW) this.samples.shift();
        if (this.samples.length === WINDOW && now - this.lastDumpAt >= DUMP_INTERVAL_MS) this.check(map, now);
    }

    private markerPos(el: HTMLElement): { x: number; y: number } | null {
        const icon = el.closest('.leaflet-marker-icon') as (HTMLElement & { _leaflet_pos?: { x: number; y: number } }) | null;
        return icon?._leaflet_pos ?? null;
    }

    private pickLabels(map: L.Map): void {
        this.labelsPickedAt = performance.now();
        this.samples = [];
        const W = innerWidth / 2, H = innerHeight / 2;
        const pane = map.getPane('labelsPane');
        if (!pane) { this.labels = []; return; }
        const all = [...pane.querySelectorAll<HTMLElement>('.city-label-content')]
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter((x) => x.r.width > 0 && x.r.bottom > 0 && x.r.top < innerHeight && x.r.right > 0 && x.r.left < innerWidth);
        all.sort((a, b) => Math.hypot(a.r.x - W, a.r.y - H) - Math.hypot(b.r.x - W, b.r.y - H));
        this.labels = all.slice(0, N_LABELS).map((x) => x.el);
    }

    private check(map: L.Map, now: number): void {
        const s = this.samples;
        let worst = -1, worstFlips = 0;
        for (let i = 0; i < this.labels.length; i++) {
            let flips = 0, prevSign = 0, lo = Infinity, hi = -Infinity;
            for (let k = 0; k < s.length; k++) {
                const y = s[k].tops[i];
                if (y < lo) lo = y;
                if (y > hi) hi = y;
                if (k === 0) continue;
                const d = y - s[k - 1].tops[i];
                const sign = d > 0.01 ? 1 : d < -0.01 ? -1 : 0;
                if (sign !== 0 && prevSign !== 0 && sign !== prevSign) flips++;
                if (sign !== 0) prevSign = sign;
            }
            if (hi - lo > 0 && hi - lo <= MAX_AMPLITUDE_PX && flips >= MIN_FLIPS && flips > worstFlips) { worst = i; worstFlips = flips; }
        }
        if (worst < 0) return;
        this.lastDumpAt = now;
        const g = (window as unknown as { game?: any }).game;
        const hero = g?.playerHero;
        const body = {
            probe: 'label-jitter',
            at: new Date().toISOString(),
            说明: '据点名字小幅来回颤抖（自动侦测）。看 paneFrac 是否在变（地图层停在小数像素上来回挪）、tops 是否跟着变、transforms 是否在变',
            zoom: map.getZoom(),
            dpr: window.devicePixelRatio,
            flips: worstFlips,
            heroHeld: hero?.isHeld?.() ?? null,
            heroHost: hero?.getHostLegionId?.() ?? null,
            followingPlayer: g?.cameraFollowUI?.isFollowingPlayer?.() ?? null,
            followedId: g?.cameraFollowUI?.getFollowedArmyId?.() ?? null,
            battleSceneActive: g?.battleScene?.isActive?.() ?? null,
            battleSceneLingering: g?.battleScene?.isLingering?.() ?? null,
            scene13Active: g?.scene13War?.isActive?.() ?? null,
            mapVisibility: map.getContainer().style.visibility,
            labels: this.labels.map((el, i) => ({
                text: (el.textContent || '').trim().slice(0, 12),
                transform: el.style.transform,
                tops: s.map((x) => +x.tops[i].toFixed(2)),
            })),
            pane: s.map((x) => [+x.pane[0].toFixed(3), +x.pane[1].toFixed(3)]),
            dtMs: s.slice(1).map((x, k) => +(x.t - s[k].t).toFixed(1)),
        };
        void fetch('/api/stuck-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).catch(() => { /* 诊断失败不影响玩法 */ });
    }
}

export const labelJitterProbe = new LabelJitterProbe();
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __labelJitterProbe?: LabelJitterProbe }).__labelJitterProbe = labelJitterProbe;
