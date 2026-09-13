import { CityAssetManager } from '../../assets/CityAssetManager';
import { speechAnnouncer } from '../../audio/SpeechAnnouncer';
import type { GameApp } from '../GameApp';

/** 地图面板 toggle 与编辑器开关（从 GameApp 抽出）。 */
export function setupGameAppMapListeners(app: GameApp): void {
    // 启动同步：语音播报开关跟随音频总开关（localStorage 恢复的 enabled 可能为 false，刷新后播报不得自行开口）
    speechAnnouncer.setEnabled(app.audioManager.isEnabled());

    window.addEventListener('toggle-faction-color', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        if (app.cityManager) app.cityManager.toggleTerritoryLayer(!!detail?.visible);
    });

    window.addEventListener('toggle-road-layer', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        if (app.roadRenderer) app.roadRenderer.toggle(!!detail?.visible);
    });

    window.addEventListener('toggle-terrain-layer', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        if (app.speedOverlay) app.speedOverlay.setVisible(!!detail?.visible);
    });

    window.addEventListener('toggle-land-sea-boundary', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        if (app.landSeaBoundary) app.landSeaBoundary.setVisible(!!detail?.visible);
    });

    window.addEventListener('toggle-city-texture', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        if (app.cityManager) app.cityManager.toggleCityTextures(!!detail?.visible);
    });

    window.addEventListener('audio-settings-change', (e: Event) => {
        const detail = (e as CustomEvent<{ enabled?: boolean; masterVolume?: number }>).detail;
        if (typeof detail?.enabled === 'boolean') {
            app.audioManager.setEnabled(detail.enabled);
            // 「开启音效」= 全局总开关：关闭时语音播报一并静音（GAKU 2026-08-04 定）
            speechAnnouncer.setEnabled(detail.enabled);
        }
        if (typeof detail?.masterVolume === 'number') app.audioManager.setMasterVolume(detail.masterVolume);
    });

    window.addEventListener('audio-test-sound', () => {
        app.audioManager.unlock();
    });

    window.addEventListener('toggle-editor-city', (e: Event) => {
        const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
        if (app.cityEditor) {
            detail?.enabled ? app.cityEditor.show() : app.cityEditor.hide();
        }
        if (app.cityManager) app.cityManager.setEditorMode(!!detail?.enabled);
    });

    window.addEventListener('toggle-editor-road', (e: Event) => {
        const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
        if (app.roadEditor) {
            detail?.enabled ? app.roadEditor.show() : app.roadEditor.hide();
        }
    });

    // 🔴 [2026-08-25] 海路编辑已并入道路编辑器：这个事件保留做兼容入口 ——
    //    收到就打开道路编辑器并切到海路模式，关掉则切回陆路（不整个关掉道路编辑器）。
    window.addEventListener('toggle-editor-sea', (e: Event) => {
        const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
        if (!app.roadEditor) return;
        if (detail?.enabled) {
            if (!app.roadEditor.isVisible()) app.roadEditor.show();
            app.roadEditor.setMode('sea');
        } else {
            app.roadEditor.setMode('land');
        }
    });

    // 🔴 [2026-09-14 主人定] 点击战场 → 立刻打那一场真实战役（与剧本模式无关，见
    //    HistoricalEventManager.startBattlefieldBattle）。打完由它点亮战场形态。
    window.addEventListener('battlefield-click', (e: Event) => {
        const d = (e as CustomEvent<{ id?: string; name?: string }>).detail;
        if (!d?.id) return;
        // 抵达判定、武将在城判定、选边对话全在任务系统里（它握着 hero 与对话 UI）
        app.playerQuests?.onBattlefieldClicked(d.id, d.name ?? '战场');
    });


    const leaflet = app.map?.getLeafletMap?.();
    if (leaflet) {
        // move 期间仍需通知（使镜头跟随途中旗号也能上色）；zoom 迁到 zoomend 避免动画中间帧密集扫全城
        leaflet.on('move', () => CityAssetManager.notifyMapInteraction());
        leaflet.on('zoomend', () => CityAssetManager.notifyMapInteraction());
    }

    // UI 点击仅用于解锁音频上下文，不播放音效
    window.addEventListener('click', () => {
        app.audioManager.unlock();
    }, { capture: true, passive: true });

    // 🔴 [2026-09-11 主人需求] 编辑器导航栏「据点编辑」跳转 /index.html?_editor=city 时自动打开城市编辑
    const editorParam = new URLSearchParams(window.location.search).get('_editor');
    if (editorParam === 'city') {
        setTimeout(() => {
            if (app.cityEditor) app.cityEditor.show();
            if (app.cityManager) app.cityManager.setEditorMode(true);
        }, 600);
    }
}
