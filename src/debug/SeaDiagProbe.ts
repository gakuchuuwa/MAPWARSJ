/**
 * [2026-09-30 临时诊断，查完即删] 主人报「海面一片平色」，但同一套代码在 AI 的浏览器里海面有深浅。
 * 仅 DEV：每 15 秒把「晕渲图层设置 + 屏幕上海面瓦片的实际像素 + 瓦片透明度 + 滤镜」落盘到
 * scratch/zoom_perf_latest.json（kind: 'seaDiag'），排查方直接读文件，不用主人敲命令。
 */
export function installSeaDiagProbe(game: any): void {
    if (!import.meta.env.DEV) return;
    let n = 0;
    const tick = () => {
        n++;
        try {
            const gm = game.map;
            const L = gm?.getLeafletMap?.() ?? gm?.map;
            const hs = gm?.hillshadeLayer;
            if (!L || !hs) return;
            const cont = hs.getContainer?.() as HTMLElement | null;
            const tiles = cont ? Array.from(cont.querySelectorAll('canvas')) as HTMLCanvasElement[] : [];
            const opHist: Record<string, number> = {};
            const seaStats: any[] = [];
            const R = L.getContainer().getBoundingClientRect();
            for (const t of tiles) {
                const o = getComputedStyle(t).opacity;
                opHist[o] = (opHist[o] ?? 0) + 1;
                const r = t.getBoundingClientRect();
                if (r.right < R.left || r.left > R.right || r.bottom < R.top || r.top > R.bottom) continue;
                const ctx = t.getContext('2d');
                if (!ctx || seaStats.length >= 8) continue;
                const d = ctx.getImageData(0, 0, t.width, t.height).data;
                let cnt = 0, sr = 0, sg = 0, sb = 0, mn = 999, mx = 0, a = 0;
                for (let i = 0; i < d.length; i += 64) {
                    const pr = d[i], pg = d[i + 1], pb = d[i + 2];
                    if (pb > pr + 25 && pb >= pg) { cnt++; sr += pr; sg += pg; sb += pb; const l = pr + pg + pb; if (l < mn) mn = l; if (l > mx) mx = l; a += d[i + 3]; }
                }
                if (cnt > 100) seaStats.push({ mean: [Math.round(sr / cnt), Math.round(sg / cnt), Math.round(sb / cnt)], lumMin: mn, lumMax: mx, alpha: Math.round(a / cnt), opacity: o, key: (t as any).dataset?.key ?? '' });
            }
            const tilePane = L.getPanes().tilePane as HTMLElement;
            const payload = {
                kind: 'seaDiag', seq: n, at: new Date().toISOString(), ua: navigator.userAgent,
                zoom: L.getZoom(), center: L.getCenter(), dpr: devicePixelRatio,
                relief: gm.isExperimentalReliefEnabled, hsRelief: hs.experimentalRelief, useElevationColor: hs.useElevationColor,
                useDesertColoring: hs.useDesertColoring, shadowOpacity: hs.shadowOpacity, hsOnMap: L.hasLayer(hs),
                tilePaneFilter: tilePane?.style.filter, containerBg: getComputedStyle(L.getContainer()).backgroundColor,
                hsContainerOpacity: cont ? getComputedStyle(cont).opacity : null, tileCount: tiles.length, opHist, seaStats,
                ls: Object.fromEntries(Object.keys(localStorage).filter(k => /mapwar/i.test(k)).map(k => [k, String(localStorage.getItem(k)).slice(0, 60)])),
            };
            void fetch('/api/zoom-perf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload, null, 2) });
        } catch (e) { /* 诊断失败不影响游戏 */ }
        if (n < 12) setTimeout(tick, 15000);
    };
    setTimeout(tick, 20000);
}
