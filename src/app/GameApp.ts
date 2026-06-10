import { GameMap } from '../map/GameMap';
import { CityManager } from '../world/CityManager';
import { CityAssetManager } from '../assets/CityAssetManager';
if (import.meta.env.DEV) {
    void import('../utils/FlagTextDebug');
}
import { GridManager } from '../core/GridManager';
import { FactionManager } from '../world/FactionManager';
import { initializeGlobalUnitRenderer } from '../map/UnitRenderer';
import { GlobalUnitRenderer } from '../map/GlobalUnitRenderer';
import { SpeedOverlayRenderer } from '../map/SpeedOverlayRenderer';
import { TerrainSpeedSystem } from '../core/TerrainSpeedSystem';
import { TerrainOverrideManager } from '../editors/TerrainOverrideManager';
import { LandSeaSystem, LandTerrainSystem } from '../world/land-sea';
import { TimeSystem } from './TimeSystem';
import { HistoricalEventManager } from '../events/HistoricalEventManager';

import { CombatSystem } from '../combat/CombatSystem';
import { EventEditor } from '../editors/EventEditor';
import { CityEditor } from '../editors/CityEditor';
import { VectorRoadEditor } from '../roads/VectorRoadEditor';
import { ArmyEditor } from '../editors/ArmyEditor';
import { UnifiedEditorManager } from '../editors/UnifiedEditorManager';
import { SimpleVectorRoadRenderer } from '../roads/SimpleVectorRoadRenderer';
import { FACTIONS } from '../data/factions';
import { STARTING_CAPITALS } from '../data/StartingCapitals';
import { FactionTintSystem } from '../systems/tinting/FactionTintSystem';
import { CITIES } from '../data/cities';
import { GAME_CONSTANTS, GameConfig } from '../config/GameConfig';
import { AIController, RecruitmentSystem } from '../ai';
import { FollowResupplySystem } from '../legion/FollowResupplySystem';
import { roadRegistry } from '../roads/RoadRegistry';
import { RebellionSystem } from '../systems/RebellionSystem';

// [NEW] Visual Renderers
import { GameUIManager } from './GameUIManager';
import { GameInputManager } from './GameInputManager';
import { CombatUI } from '../ui/CombatUI'; // [NEW]
import { GameTimeHUD } from '../ui/GameTimeHUD';
import { HistoricalEventPanel } from '../ui/HistoricalEventPanel';
import { BrawlFeedPanel } from '../ui/BrawlFeedPanel';
import { Army } from '../legion/Army';
import { PerformanceMonitor } from '../debug/PerformanceMonitor'; // [PERF]
import { CameraFollowUI } from '../ui/CameraFollowUI'; // [NEW] 军团跟随视角
import { ExpeditionUI } from '../ui/ExpeditionUI'; // 远征指令（GAME_DIRECTION 2026-06-11）
import { gameLog } from '../utils/GameLogger';
import { tickGameAppFrame } from './GameAppLoop';
import { exposeGameAppGlobals } from './GameAppExpose';
import { wireGameAppCombatUiHooks } from './boot/GameAppCombatHooks';
import { handleGameAppCityEditorSave, loadGameAppCityData } from './boot/GameAppCityLoader';
import { setupGameAppMapListeners } from './boot/GameAppMapListeners';
import {
    setupGameAppVisibilityHandler,
    showGameAppErrorOverlay,
    yieldToBrowser,
} from './boot/GameAppBootUtils';

export { STARTING_CAPITALS } from '../data/StartingCapitals';

declare global {
    interface Window {
        game: GameApp;
        // ...
    }
}

export class GameApp {
    public map!: GameMap;
    private factionManager!: FactionManager;
    public cityManager!: CityManager;
    private gridManager!: GridManager;
    public combatSystem!: CombatSystem;
    public eventEditor!: EventEditor;
    public cityEditor!: CityEditor;
    public roadEditor!: VectorRoadEditor;
    private unifiedEditorManager!: UnifiedEditorManager;
    public timeSystem!: TimeSystem;
    public historicalEventManager!: HistoricalEventManager;
    public speedOverlay!: SpeedOverlayRenderer;
    private overrideManager!: TerrainOverrideManager;

    // [AI System]
    public aiController!: AIController;
    public recruitmentSystem!: RecruitmentSystem;
    private followResupplySystem!: FollowResupplySystem;
    public rebellionSystem!: RebellionSystem;

    // [REFACTORED]
    private uiManager!: GameUIManager;
    private inputManager!: GameInputManager;
    public combatUI!: CombatUI; // [NEW]
    private gameTimeHUD!: GameTimeHUD;
    private historicalEventPanel!: HistoricalEventPanel;
    private brawlFeedPanel!: BrawlFeedPanel;
    public roadRenderer!: SimpleVectorRoadRenderer;
    public cameraFollowUI!: CameraFollowUI; // [NEW] 军团跟随视角
    public expeditionUI!: ExpeditionUI; // 远征指令（仅跟拍军团，兵力≥5万解锁）

    // Game Loop
    public lastFrameTime: number = 0;
    public animationFrameId: number | null = null;

    // [PERF] Performance Monitor
    public perfMonitor: PerformanceMonitor = PerformanceMonitor.getInstance();



    constructor() {
        // UI Initialization moved to GameUIManager
        // Expose game instance globally
        window.game = this;
    }

    /**
     * [DIRECTOR API] Expose LegionManager for Cinematic Manager
     */
    public get legionManager() {
        return this.historicalEventManager?.getLegionManager();
    }



    public async start() {
        try {
            gameLog('startup', 'Game starting...');
            this.perfMonitor.markBootPhase('GameApp.start');

            // [FIX] FactionManager 必须先初始化，preloadFlags 内部会读 factionManager.getFactionColor
            // 否则 getFactionColor 在染色前不可用。
            this.factionManager = new FactionManager(FACTIONS.length);
            FACTIONS.forEach(f => this.factionManager.addFaction(f));

            const cityById = new Map(CITIES.map((c) => [c.id, c]));
            const capitalByFaction = new Map<string, { lat: number; lng: number }>();
            for (const f of FACTIONS) {
                const capCityId = STARTING_CAPITALS[f.id];
                const city =
                    (capCityId ? cityById.get(capCityId) : undefined) ??
                    CITIES.find((c) => c.factionId === f.id);
                if (city) capitalByFaction.set(f.id, { lat: city.lat, lng: city.lng });
            }
            this.factionManager.assignSpatialColors(capitalByFaction);

            FactionTintSystem.bindFactionManager(this.factionManager);
            CityAssetManager.bindFactionManager(this.factionManager);

            const _PANJUN_ID_BOOT = 'pan' + 'jun';
            const activeFactionsBoot = [...new Set([...CITIES.map(c => c.factionId), _PANJUN_ID_BOOT])];
            await CityAssetManager.seedBootPlaceholderFlags(activeFactionsBoot);

            // [OPTIMIZATION-STARTUP] 1. Start Heavy Async Tasks IMMEDIATELY (Network/IO)
            // [PERF 2026-05-29] activeFactions 从据点实际引用反推, 不再读 STARTING_CAPITALS:
            //   - 沙盒/非沙盒模式同一份逻辑, 自动跟上数据漂移
            //   - 86 个孤儿势力 (注册了但没城用) 自动不加载, 省 chromaKey 时间 -18%
            //   - 加新势力据点时下次启动自动包含; 删势力但留城仍包含 (panjun fallback)
            //   - 参见 AGENTS.md §三: 1 势力 = 1 据点 (反推合理)
            // [FIX 2026-05-29] 不能在这里出现字符串 'panjun', 否则 serverReplaceObjectLine
            // 会用 indexOf('panjun') 在 STARTING_CAPITALS 之后找首匹配, 错误命中此处.
            // 改用变量 + 数组合并, 不暴露字符串字面量.
            const _PANJUN_ID = 'pan' + 'jun';
            const activeFactions = [...new Set([...CITIES.map(c => c.factionId), _PANJUN_ID])];
            const flagCities = CITIES.map((c) => ({
                lat: c.lat,
                lng: c.lng,
                factionId: c.factionId,
                region: (c as { region?: string }).region,
            }));
            CityAssetManager.registerFlagCities(flagCities);
            CityAssetManager.prepareDeferredFlagQueue(activeFactions);
            // 军团贴图延后到首帧之后，避免与旗号 chromaKey 抢主线程
            void GlobalUnitRenderer.preloadAssets().catch((e) =>
                console.warn('[GameApp] Unit asset preload failed', e)
            );
            this.perfMonitor.markBootPhase('旗号队列(待视口/拖图)');

            // [OPTIMIZATION-STARTUP] 2. Initialize Main Map (DOM/WebGL)
            this.map = new GameMap('map');
            this.perfMonitor.markBootPhase('Leaflet 地图');
            LandSeaSystem.initialize();
            LandTerrainSystem.initialize();
            LandSeaSystem.bindLeafletMap(this.map.getLeafletMap());

            // [PERF] 让浏览器立刻 paint 一次空地图，用户感知"已经开始加载"
            // 否则下面的同步初始化会让整个页面看起来卡死直到结束。
            await yieldToBrowser();

            // 3. Initialize remaining Core Managers (Lightweight JS)
            this.gridManager = new GridManager(this.map);

            // Listeners
            setupGameAppMapListeners(this);

            // Initialize global unit renderer for NPCs and armies
            initializeGlobalUnitRenderer(this.map);


            // Initialize CombatSystem moved down
            // this.combatSystem = new CombatSystem();

            // Managers & Systems
            // this.contactEngine ... moved down
            this.timeSystem = new TimeSystem();

            // [NEW] Sync Time to Map Visuals (Roads/Rivers filtering)
            this.timeSystem.onYearChange((year) => {
                this.map.updateTime(year);
                if (this.gameTimeHUD) {
                    this.gameTimeHUD.updateTime(year, this.timeSystem.getSeason());
                }
            });
            this.timeSystem.onSeasonChange((season, year) => {
                if (this.gameTimeHUD) {
                    this.gameTimeHUD.updateTime(year, season);
                }
            });
            // [FIX] Initial sync for roads (e.g. hide Qin Direct Road in -236)
            this.map.updateTime(this.timeSystem.getYear());

            // Terrain & Renderers (Independent)
            this.overrideManager = new TerrainOverrideManager();
            TerrainSpeedSystem.initialize(this.overrideManager);

            // Roads Init - 矢量路网图引擎
            gameLog('startup', '🛤️ 正在构建矢量路网图...');
            (window as any).roadRegistry = roadRegistry; // [FIX] Expose for Army.ts
            roadRegistry.initialize(CITIES);
            this.perfMonitor.markBootPhase('矢量路网');

            // [PERF] yield before heavy city load
            await yieldToBrowser();

            // 5. Initialize City dependent systems
            this.cityManager = new CityManager(this.map, this.factionManager);
            loadGameAppCityData(this);
            // 叛军：S10QZ 7–58 共 52 面，画据点前 await。见 AGENTS.md §10.3
            await CityAssetManager.preloadRebelFlagsForBoot();
            await CityAssetManager.onBootMapReady();
            this.cityManager.bindViewportCitySync();
            // 势力色块默认关（chk-faction 未勾选）。禁止 toggleTerritoryLayer(true) / renderTerritoryOnly。§10.1
            void this.cityManager.renderCitiesOnly().then(() => {
                this.perfMonitor.markBootPhase('视口据点旗号');
                this.cityManager.syncStrategicMapView();
            });

            await yieldToBrowser();

            // [PERF] Report city count to PerformanceMonitor
            this.perfMonitor.reportCount('cities', CITIES.length);
            this.perfMonitor.reportCount('factions', FACTIONS.length);

            if (import.meta.env.DEV) {
                this.cityEditor = new CityEditor(this.map.getLeafletMap(), this.cityManager, (data: any) => {
                    handleGameAppCityEditorSave(this, data);
                });
            }

            this.combatSystem = new CombatSystem(this.cityManager, null, null);


            // [NEW] Combat UI
            this.combatUI = new CombatUI();

            this.gameTimeHUD = new GameTimeHUD();
            this.gameTimeHUD.init();

            // 尽早启动主循环，避免 lengthy 同步初始化占死主线程（F12/拖动都失效）
            this.timeSystem.setPaused(true);
            if (this.animationFrameId === null) {
                this.lastFrameTime = performance.now();
                this.gameLoop(this.lastFrameTime);
            }

            wireGameAppCombatUiHooks(this);

            // [FIX] Unlock camera when game is paused
            this.timeSystem.onPauseChange((paused) => {
                if (paused) {
                    gameLog('startup', '⏸️ [GameApp] Pause detected.');
                }
            });

            setupGameAppVisibilityHandler(() => {
                this.lastFrameTime = performance.now();
            });

            void this.completeLateBoot();
        } catch (error) {
            console.error('❌ 游戏初始化失败:', error);
            showGameAppErrorOverlay(error instanceof Error ? error.message : '未知错误');
        }
    }

    /** 事件索引 / AI / 输入等重初始化：分帧执行，不阻塞首屏与 DevTools */
    private async completeLateBoot(): Promise<void> {
        try {
            await yieldToBrowser();

            this.historicalEventManager = new HistoricalEventManager(
                this.timeSystem,
                this.cityManager,
                this.map,
                this.combatSystem,
                this.gameTimeHUD
            );
            if (GameConfig.SYSTEM.SANDBOX_MODE) {
                this.brawlFeedPanel = new BrawlFeedPanel(this.timeSystem, this.cityManager);
                this.brawlFeedPanel.init();
                this.cityManager.setOnCityCaptured((event) => {
                    if (!event.captorLegionName) return;
                    if (!BrawlFeedPanel.isEliminableFaction(event.previousFactionId)) return;
                    if (this.cityManager.getCitiesByFaction(event.previousFactionId).length > 0) return;

                    this.brawlFeedPanel.pushFactionFall({
                        attackerFactionId: event.newFactionId,
                        legionName: event.captorLegionName,
                        defenderFactionId: event.previousFactionId,
                        cityName: event.cityName,
                    });
                });
                Army.setAnnihilationReporter((army, info) => {
                    if (!BrawlFeedPanel.isEliminableFaction(army.getFactionId())) return;
                    this.brawlFeedPanel.pushLegionAnnihilated({
                        factionId: army.getFactionId(),
                        legionName: army.name || '军团',
                        cityName: info.cityName,
                    });
                });
            }

            if (GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS) {
                this.historicalEventPanel = new HistoricalEventPanel();
                this.historicalEventPanel.init();
                this.historicalEventPanel.setHistory(this.historicalEventManager.getEventHistory());
                this.historicalEventManager.onEventTriggered((event) => {
                    this.historicalEventPanel.pushEvent(event);
                });
            }
            this.rebellionSystem = new RebellionSystem(
                this.cityManager,
                this.timeSystem,
                this.historicalEventManager.getLegionManager(),
                this.historicalEventManager.getSiegeManager()
            );
            if (this.brawlFeedPanel) {
                this.rebellionSystem.setRestorationReporter((report) => {
                    this.brawlFeedPanel.pushRestoration(report);
                });
            }
            this.perfMonitor.markBootPhase('事件/军团/叛乱管理器');
            await yieldToBrowser();

            if (import.meta.env.DEV) {
                this.eventEditor = new EventEditor(
                    this.cityManager,
                    this.historicalEventManager.getLegionManager(),
                    this.map.getLeafletMap()
                );
            }

            this.roadRenderer = new SimpleVectorRoadRenderer(this.map.getLeafletMap());
            this.roadRenderer.setYear(this.timeSystem.getYear());
            this.timeSystem.onYearChange((y) => this.roadRenderer.setYear(y));

            if (import.meta.env.DEV) {
                this.roadEditor = new VectorRoadEditor(this.map.getLeafletMap(), this.cityManager);

                const armyEditor = new ArmyEditor(this.map.getLeafletMap());
                window.addEventListener('toggle-editor-army', (e: Event) => {
                    const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
                    armyEditor.toggle(detail?.enabled ?? false);
                });

                this.unifiedEditorManager = new UnifiedEditorManager();
                this.unifiedEditorManager.register(this.cityEditor);
                this.unifiedEditorManager.register(this.eventEditor);
                this.unifiedEditorManager.register(this.roadEditor);
            }

            const legionManager = this.historicalEventManager.getLegionManager();
            this.aiController = new AIController(
                legionManager,
                this.cityManager,
                roadRegistry,
                this.historicalEventManager
            );
            this.recruitmentSystem = new RecruitmentSystem(this.cityManager, legionManager);
            this.followResupplySystem = new FollowResupplySystem(this.cityManager);
            legionManager.setFollowResupplySystem(this.followResupplySystem);

            this.speedOverlay = new SpeedOverlayRenderer(this.map, this.overrideManager);

            this.uiManager = new GameUIManager(
                this.timeSystem,
                this.factionManager,
                this.historicalEventManager,
                this.speedOverlay
            );

            this.inputManager = new GameInputManager(
                this.map,
                this.speedOverlay,
                this.roadEditor,
                this.cityEditor,
                this.cityManager,
                this.uiManager,
                this.eventEditor
            );

            this.cameraFollowUI = new CameraFollowUI();
            this.cameraFollowUI.init(
                () => legionManager.getArmies(),
                (armyId) => {
                    legionManager.setFollowedLegionId(armyId);
                    if (!armyId) {
                        this.combatUI.hide();
                        CityAssetManager.prioritizeFollowedFaction(null);
                    } else {
                        const army = legionManager.getLegionById(armyId);
                        CityAssetManager.prioritizeFollowedFaction(army?.getFactionId() ?? null);
                    }
                },
                () => legionManager.trimLegionsToCap(),
                (armyId, newName) => legionManager.renameLegion(armyId, newName)
            );
            this.cameraFollowUI.update();

            this.expeditionUI = new ExpeditionUI();
            this.expeditionUI.init(
                () => {
                    const id = this.cameraFollowUI.getFollowedArmyId();
                    return id ? legionManager.getLegionById(id) ?? null : null;
                },
                this.cityManager
            );

            this.map.getLeafletMap().on('dragstart', () => {
                if (this.cameraFollowUI?.isFollowing()) {
                    this.cameraFollowUI.cancelFollow();
                }
            });

            this.exposeGlobals();

            setInterval(() => this.uiManager.update(), GAME_CONSTANTS.UI_UPDATE_INTERVAL);

            gameLog('startup', '🤖 AI 系统已启动');
            legionManager.refreshCityRegistry();

            if (this.map.getLeafletMap().dragging) {
                this.map.getLeafletMap().dragging.enable();
            }

            gameLog('startup', '✅ 游戏初始化完成 (重构版)');
            this.perfMonitor.finishBoot();
        } catch (error) {
            console.error('❌ 游戏延后初始化失败:', error);
            showGameAppErrorOverlay(error instanceof Error ? error.message : '未知错误');
        }
    }

    public gameLoop(timestamp: number): void {
        tickGameAppFrame(this, timestamp);
    }

    private exposeGlobals(): void {
        exposeGameAppGlobals(this);
    }

}

// 防止编辑器保存 cities.ts 时触发 Vite 全局刷新
// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept(['../data/cities.ts', '../data/cities_v2.ts'], () => {
        console.log('[HMR] cities.ts 发生改变，拦截自动刷新 (页面状态已保留)');
    });
    // @ts-ignore
    import.meta.hot.accept(['../types/CultureFormations.ts'], () => {
        console.log('[HMR] CultureFormations.ts 改变，自动应用到大地图现有军队');
        if ((window as any).game?.legionManager) {
            (window as any).game.legionManager.refreshCultureFormations();
        }
    });
}
