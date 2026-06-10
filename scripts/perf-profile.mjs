/**
 * 浏览器内性能采样 — 需先 npm run dev
 * 用法: node scripts/perf-profile.mjs [url] [采样秒数]
 */
import puppeteer from 'puppeteer';

const URL = process.argv[2] || 'http://localhost:5173';
const SAMPLE_SEC = Number(process.argv[3]) || 8;

function avg(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function p95(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length * 0.95)] ?? 0;
}

async function main() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--disable-gpu', '--no-sandbox'],
    });
    const page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });

    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    console.log(`\n📊 打开 ${URL}，等待游戏初始化…`);
    try {
        await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    } catch (e) {
        console.error('无法加载页面。请先运行: npm run dev');
        console.error(e.message);
        await browser.close();
        process.exit(1);
    }

    await page.waitForFunction(
        () => typeof window.game !== 'undefined' && window.perfMonitor,
        { timeout: 120000 }
    );
    console.log('✅ game 已就绪，预热 2 秒…');
    await new Promise((r) => setTimeout(r, 2000));

  // 暂停态基准
    const baseline = await page.evaluate(async (sec) => {
        const samples = [];
        const renderSamples = [];
        let frames = 0;
        const tEnd = performance.now() + sec * 1000;
        return new Promise((resolve) => {
            function tick() {
                const snap = window.perfMonitor.getSnapshot();
                const gur = window.game?.map?.getGlobalUnitRenderer?.()
                    || (typeof getGlobalUnitRenderer === 'function' ? getGlobalUnitRenderer() : null);
                const drawMs = gur?.getLastFrameDrawMs?.() ?? 0;
                samples.push({
                    frameTime: snap.frameTime,
                    ai: snap.aiTime,
                    combat: snap.combatTime,
                    recruitment: snap.recruitmentTime,
                    historicalEvent: snap.historicalEventTime,
                    legion: snap.legionTime ?? 0,
                    unaccounted: snap.unaccountedTime ?? 0,
                    polygons: snap.territoryPolygonCount,
                    markers: snap.cityMarkerCount,
                    labels: snap.cityLabelCount,
                    armies: snap.armyCount,
                    cities: snap.cityCount,
                    factions: snap.factionCount,
                });
                renderSamples.push(drawMs);
                frames++;
                if (performance.now() < tEnd) requestAnimationFrame(tick);
                else resolve({ samples, renderSamples, frames });
            }
            requestAnimationFrame(tick);
        });
    }, SAMPLE_SEC);

    // 点击播放，模拟运行中
    await page.click('#run-event-btn').catch(() => {});
    console.log('▶ 已尝试点击播放，再采样', SAMPLE_SEC, '秒（运行态）…');
    await new Promise((r) => setTimeout(r, 500));

    const running = await page.evaluate(async (sec) => {
        const samples = [];
        const renderSamples = [];
        let frames = 0;
        const tEnd = performance.now() + sec * 1000;
        return new Promise((resolve) => {
            function tick() {
                const snap = window.perfMonitor.getSnapshot();
                const gur = typeof getGlobalUnitRenderer === 'function' ? getGlobalUnitRenderer() : null;
                const drawMs = gur?.getLastFrameDrawMs?.() ?? 0;
                samples.push({
                    frameTime: snap.frameTime,
                    ai: snap.aiTime,
                    combat: snap.combatTime,
                    recruitment: snap.recruitmentTime,
                    historicalEvent: snap.historicalEventTime,
                    legion: snap.legionTime ?? 0,
                    unaccounted: snap.unaccountedTime ?? 0,
                    polygons: snap.territoryPolygonCount,
                    markers: snap.cityMarkerCount,
                    armies: snap.armyCount,
                });
                renderSamples.push(drawMs);
                frames++;
                if (performance.now() < tEnd) requestAnimationFrame(tick);
                else resolve({ samples, renderSamples, frames });
            }
            requestAnimationFrame(tick);
        });
    }, SAMPLE_SEC);

    const staticInfo = await page.evaluate(() => {
        const game = window.game;
        const units = typeof getGlobalUnitRenderer === 'function'
            ? getGlobalUnitRenderer()?.getUnitCount?.() ?? 0
            : 0;
        return {
            paused: game?.timeSystem?.isGamePaused?.() ?? true,
            cities: game?.cityManager?.getCities?.()?.length ?? 0,
            armies: game?.legionManager?.getArmies?.()?.length ?? 0,
            canvasUnits: units,
        };
    });

    await browser.close();

    function summarize(label, data) {
        const ft = data.samples.map((s) => s.frameTime);
        const leg = data.samples.map((s) => s.legion);
        const hist = data.samples.map((s) => s.historicalEvent);
        const ai = data.samples.map((s) => s.ai);
        const unacc = data.samples.map((s) => s.unaccounted);
        const draw = data.renderSamples;
        const fps = 1000 / avg(ft);
        const s0 = data.samples[0] || {};
        console.log(`\n── ${label} (${data.frames} 帧) ──`);
        console.log(`  FPS(估): ${fps.toFixed(1)}  帧耗时 avg ${avg(ft).toFixed(2)}ms  p95 ${p95(ft).toFixed(2)}ms  max ${Math.max(...ft).toFixed(2)}ms`);
        console.log(`  子系统(每帧 ms): 军团 ${avg(leg).toFixed(2)} | 历史事件总 ${avg(hist).toFixed(2)} | AI ${avg(ai).toFixed(2)} | 未计入 ${avg(unacc).toFixed(2)}`);
        console.log(`  画布绘制(GlobalUnitRenderer): avg ${avg(draw).toFixed(2)}ms  p95 ${p95(draw).toFixed(2)}ms`);
        console.log(`  地图实体: 领土层 ${s0.polygons} | 城市标记 ${s0.markers} | 军团 ${s0.armies ?? staticInfo.armies}`);
    }

    console.log('\n════════ 性能分析报告 ════════');
    console.log('静态:', JSON.stringify(staticInfo));
    summarize('暂停/待机', baseline);
    summarize('点击播放后', running);
    if (errors.length) {
        console.log('\n⚠ 页面错误:', errors.slice(0, 5).join('\n'));
    }
    console.log('\n说明: 「未计入」≈ 帧总耗时 − 已打点子系统，通常含 Leaflet/SVG、双 rAF 循环、DOM。\n');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
