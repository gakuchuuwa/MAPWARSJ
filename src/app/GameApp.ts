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
import { LandSeaBoundaryLayer } from '../map/LandSeaBoundaryLayer';
import { TerrainSpeedSystem } from '../core/TerrainSpeedSystem';
import { TerrainOverrideManager } from '../editors/TerrainOverrideManager';
import { LandSeaSystem, LandTerrainSystem } from '../world/land-sea';
import { TimeSystem } from './TimeSystem';
import { HistoricalEventManager } from '../events/HistoricalEventManager';

import { CombatSystem } from '../combat/CombatSystem';
import { CityEditor } from '../editors/CityEditor';
import { VectorRoadEditor } from '../roads/VectorRoadEditor';
import { ArmyEditor } from '../editors/ArmyEditor';
import { UnifiedEditorManager } from '../editors/UnifiedEditorManager';
import { SimpleVectorRoadRenderer } from '../roads/SimpleVectorRoadRenderer';
import { FACTIONS } from '../data/factions';
import { STARTING_CAPITALS } from '../data/StartingCapitals';
import { FactionTintSystem } from '../systems/tinting/FactionTintSystem';
import { CITIES_V2 as CITIES } from '../data/cities_v2';
import { GAME_CONSTANTS, GameConfig } from '../config/GameConfig';
import { AIController, RecruitmentSystem } from '../ai';
import { FollowResupplySystem } from '../legion/FollowResupplySystem';
import { roadRegistry } from '../roads/RoadRegistry';
import { RebellionSystem } from '../systems/RebellionSystem';
import { initializeTradeTrafficLayer } from '../map/TradeTrafficLayer'; // [2026-08-31] 战略地图商贸交通层

// [NEW] Visual Renderers
import { GameUIManager } from './GameUIManager';
import { GameInputManager } from './GameInputManager';
import { CombatUI } from '../ui/CombatUI'; // [NEW]
import { BattleSceneLayer } from '../ui/BattleSceneLayer'; // [2026-08-09] 独立战斗场景（空壳）
import { Scene13WarLayer } from '../ui/Scene13WarLayer'; // [2026-08-11 13 v2] 出兵口互攻演出层
import { GameTimeHUD } from '../ui/GameTimeHUD';
import { BrawlFeedPanel } from '../ui/BrawlFeedPanel';
import { isRegionCenter, REGION_LABELS, type RegionType } from '../systems/RegionSystem';
import { Army } from '../legion/Army';
import { setDefeatCooldownTimeSource } from '../legion/DefeatCooldown';
import { PerformanceMonitor } from '../debug/PerformanceMonitor'; // [PERF]
import { CameraFollowUI } from '../ui/CameraFollowUI'; // [NEW] 军团跟随视角
import { ExpeditionUI } from '../ui/ExpeditionUI'; // 远征指令（GAME_DIRECTION 2026-06-11）
import { YuefeiExpedition } from './YuefeiExpedition'; // 岳飞北伐黄龙 圆梦脚本
import { HuoQubingExpedition } from './HuoQubingExpedition'; // 霍去病封狼居胥 脚本
import { ZhugeLiangExpedition } from './ZhugeLiangExpedition'; // 诸葛亮北伐中原 圆梦脚本
import { ZoomController } from './ZoomController'; // 自动缩放控制
import { ZoomPerfProbe } from '../debug/ZoomPerfProbe'; // 缩放卡顿自动采样（仅 DEV）
import { StreamModeToggle } from '../ui/StreamModeToggle'; // 直播模式（隐藏开发 UI）
import { initUnattendedStream } from './UnattendedStream'; // 无人值守直播（?stream=1）
import { GameSaveManager } from './GameSaveManager'; // 世界存档（跨天续摊）
import { SaveLoadUI } from '../ui/SaveLoadUI'; // 存档/读档界面
import { audioManager, type AudioManager } from '../audio/AudioManager';
import { speechAnnouncer, type CaptureJu } from '../audio/SpeechAnnouncer';
import { SpeechVoiceToggle } from '../ui/SpeechVoiceToggle';
import { gameLog } from '../utils/GameLogger';
import { tickGameAppFrame, tickGameLogicOnly } from './GameAppLoop';
import { exposeGameAppGlobals } from './GameAppExpose';
import { wireGameAppCombatUiHooks, wireGeneralSkillCombat } from './boot/GameAppCombatHooks';
import { handleGameAppCityEditorSave, loadGameAppCityData } from './boot/GameAppCityLoader';
import { setupGameAppMapListeners } from './boot/GameAppMapListeners';
import {
    setupGameAppVisibilityHandler,
    setupGameAppBackgroundHeartbeat,
    showGameAppErrorOverlay,
    showLoadingOverlay,
    hideLoadingOverlay,
    setLoadingMessage,
    setLoadingProgress,
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
    public cityEditor!: CityEditor;
    public roadEditor!: VectorRoadEditor;
    // 🔴 [2026-08-25] 海路编辑器已并入 roadEditor（面板顶部「🛣️ 陆路 / 🚢 海路」切换）。
    //    不再单独 new —— 两个实例并存会各自 enableCitySelection 抢城市点击。
    private unifiedEditorManager!: UnifiedEditorManager;
    public timeSystem!: TimeSystem;
    public historicalEventManager!: HistoricalEventManager;
    public speedOverlay!: SpeedOverlayRenderer;
    /** 海陆分界调试图层（默认关闭，调试面板 🧭 海陆分界线） */
    public landSeaBoundary!: LandSeaBoundaryLayer;
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
    public battleScene!: BattleSceneLayer; // [2026-08-09] 独立战斗场景（空壳）：上层画布 + 下层冻结地图背景
    /** [2026-08-11 13 v2] 出兵口互攻演出层（替代旧剧本法编队演出，只画精灵） */
    public scene13War!: Scene13WarLayer;
    private gameTimeHUD!: GameTimeHUD;
    public brawlFeedPanel!: BrawlFeedPanel; // 远征播报（ExpeditionUI/行为树）经 window.game 调用
    public roadRenderer!: SimpleVectorRoadRenderer;
    public cameraFollowUI!: CameraFollowUI; // [NEW] 军团跟随视角
    public expeditionUI!: ExpeditionUI; // 远征指令（仅跟拍军团，兵力≥5万解锁）
    public yuefeiExpedition!: YuefeiExpedition; // 岳飞北伐黄龙 圆梦脚本
    public huoqubingExpedition!: HuoQubingExpedition; // 霍去病封狼居胥 脚本
    public zhugeliangExpedition!: ZhugeLiangExpedition; // 诸葛亮北伐中原 圆梦脚本
    public zoomController!: ZoomController; // 自动缩放控制（行军 9 / 战斗 10）
    public tacticalModeEnabled: boolean = true; // 是否进入战术模式（zoom13 微观战斗），调试面板开关
    public audioManager: AudioManager = audioManager;
    public saveManager!: GameSaveManager; // 世界存档（跨天续摊）

    // Game Loop
    public lastFrameTime: number = 0;
    public animationFrameId: number | null = null;

    // [PERF] Performance Monitor
    public perfMonitor: PerformanceMonitor = PerformanceMonitor.getInstance();



    constructor() {
        // UI Initialization moved to GameUIManager
        // Expose game instance globally
        window.game = this;
        this.audioManager.initialize();
    }

    /**
     * [DIRECTOR API] Expose LegionManager for Cinematic Manager
     */
    public get legionManager() {
        return this.historicalEventManager?.getLegionManager();
    }



    public async start() {
        showLoadingOverlay();
        try {
            gameLog('startup', 'Game starting...');
            this.perfMonitor.markBootPhase('GameApp.start');

            // 开发期整页刷新闸门：必须在 boot **最前面**上报，不能等 boot 走完。
            // [2026-08-10 修·双重启根因] 原挂在 boot 末尾（约 11s 后才发出首次 fresh 上报），
            // 而 vite.config 的看门狗在「老页面最后一次心跳 +15s」就把积压刷新补发出来
            // （心跳 5s 一次 → 实际只剩 10~15s）。两个数字贴着，boot 慢一点就输 →
            // 手动 F5 后又被补发刷一次 = 主人反馈的「刷新页面要重启两次」。
            // 不依赖 game/timeSystem：shouldBlock 读不到就返回 false，
            // timeSystem 由 ReloadGate 心跳里的 tryHookPauseChange 后补挂钩。
            // 动态 import 保证生产构建整块剔除。
            if (import.meta.env.DEV) {
                void import('../dev/ReloadGate').then((m) => m.initReloadGate()).catch(() => {});
            }

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

            // [OPTIMIZATION-STARTUP] 先出地图+山体，再 await 旗号占位（避免长时间纯黑屏）
            this.map = new GameMap('map');
            this.perfMonitor.markBootPhase('Leaflet 地图');
            LandSeaSystem.initialize();
            LandTerrainSystem.initialize();
            LandSeaSystem.bindLeafletMap(this.map.getLeafletMap());

            // [2026-08-29] 世界底图气候查找表（冬季积雪/结冰判据，WorldClim 实测气温）：
            //   不阻塞启动，后台加载完成后注入 WorldBaseMap。此前从未加载 → 地中海冬天误判结冰。
            void import('../ui/scene13/WorldBaseMap').then((m) =>
                m.loadWorldBaseData('/world/world-base.png').catch(() => false)
            );

            await yieldToBrowser();
            // 加载动画保持显示，直到据点/UI 全部就绪后再隐藏

            setLoadingMessage('正在整理旗号…');
            setLoadingProgress(15);
            await CityAssetManager.seedBootPlaceholderFlags(activeFactions);

            // 军团贴图延后到首帧之后，避免与旗号 chromaKey 抢主线程
            const tUnitPreload = performance.now();
            void GlobalUnitRenderer.preloadAssets()
                .then(() => this.perfMonitor.noteAsyncWork('unitPreloadWall', performance.now() - tUnitPreload))
                .catch((e) => console.warn('[GameApp] Unit asset preload failed', e));
            this.perfMonitor.markBootPhase('旗号占位');

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
            // 战败冷却时间源：游戏秒（暂停冻结、倍速加速）
            setDefeatCooldownTimeSource(() => this.timeSystem.getElapsedGameSeconds());

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
            setLoadingMessage('正在铺设道路…');
            setLoadingProgress(30);
            gameLog('startup', '🛤️ 正在构建矢量路网图...');
            (window as any).roadRegistry = roadRegistry; // [FIX] Expose for Army.ts
            roadRegistry.initialize(CITIES);
            this.perfMonitor.markBootPhase('矢量路网');

            // [2026-08-31] 战略地图商贸交通层（商队/商船，跟随军团同屏渐显；独立层，不碰现有渲染）
            initializeTradeTrafficLayer(this.map).start();

            setLoadingProgress(50);
            // [PERF] yield before heavy city load
            await yieldToBrowser();

            // 5. Initialize City dependent systems
            setLoadingMessage('正在布置城池…');
            setLoadingProgress(65);
            this.cityManager = new CityManager(this.map, this.factionManager);
            loadGameAppCityData(this);
            // 叛军旗：画据点前只 await 兜底 1 面，其余 52 面 3s 后后台补满。见 AGENTS.md §10.3
            // 阶段名别再写「52面」——这一相只装 1 面，历史上多次被误读成「叛军旗在干活」，
            // 实际它慢是因为 await 续点被别的长任务插队背锅。
            await CityAssetManager.preloadRebelFlagsForBoot();
            this.perfMonitor.markBootPhase('叛军旗兜底1面');
            await CityAssetManager.onBootMapReady();
            this.perfMonitor.markBootPhase('视口势力旗染色');
            this.cityManager.bindViewportCitySync();

            setLoadingMessage('正在升旗入场…');
            setLoadingProgress(80);
            // 势力色块默认关（chk-faction 未勾选）。禁止 toggleTerritoryLayer(true) / renderTerritoryOnly。§10.1
            await this.cityManager.renderCitiesOnly();
            this.perfMonitor.markBootPhase('视口据点旗号');
            this.cityManager.syncStrategicMapView();

            setLoadingProgress(95);
            await yieldToBrowser();

            // [PERF] 道路光栅化真正异步（首帧渲染完再执行，不阻塞据点首显）
            setTimeout(() => {
                // [诊断 2026-07-17] 道路光栅化是同步大循环，量化它对启动期主线程的占用
                const tRaster = performance.now();
                roadRegistry.rasterizeRoadsDeferred();
                this.perfMonitor.noteAsyncWork('roadRasterize', performance.now() - tRaster);
            }, 0);

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
            // 游戏内立绘校正（战斗中 F2）需要暂停推演
            this.combatUI.pauseHook = this.timeSystem;

            // 独立全屏战斗场景；挂点在 GameAppCombatHooks（跟拍军团参与的 1v1/区域战开始/结束）。
            this.battleScene = new BattleSceneLayer();
            // 进战术层先暂停大战略，退出时恢复原状态。
            this.battleScene.pauseHook = this.timeSystem;

            // [2026-08-11 13 v2] 出兵口互攻演出层：全屏 canvas 叠在地图上（透明背景，冻结地图透出）
            this.scene13War = new Scene13WarLayer();
            this.scene13War.attach();

            this.gameTimeHUD = new GameTimeHUD();
            this.gameTimeHUD.init();

            // 尽早启动主循环，避免 lengthy 同步初始化占死主线程（F12/拖动都失效）
            this.timeSystem.setPaused(true);
            if (this.animationFrameId === null) {
                this.lastFrameTime = performance.now();
                this.gameLoop(this.lastFrameTime);
            }

            // 主循环已启动、HUD 就绪 → 此时游戏可见，隐藏加载动画
            setLoadingProgress(100);
            await yieldToBrowser(); // 让浏览器先绘制最后一帧进度条 100%
            hideLoadingOverlay();

            wireGameAppCombatUiHooks(this);

            this.timeSystem.onPauseChange((paused) => {
                if (paused) {
                    gameLog('startup', '⏸️ [GameApp] Pause detected.');
                }
                // 🔴 [2026-08-12 13 音效修复] 13 场景接管暂停（大战略暂停、战斗继续）≠ 用户真暂停：
                //   enter() 已先置 strategyPausedByScene 再 setPaused，这里能识别——场景暂停时
                //   不调 setGamePaused(true)，battle_loop/BGM 照常响，只有用户手动暂停才全停。
                //   修前：13 一进场 audioManager.gamePaused=true → startLoop('battle_loop') 被
                //   `if (this.gamePaused) return` 挡住 → 13 战斗只有语音播报、没有战斗音效（主人实锤）。
                const scenePause = paused && this.battleScene?.isStrategyPausedByScene?.() === true;
                this.audioManager.setGamePaused(scenePause ? false : paused);
            });

            setupGameAppVisibilityHandler(() => {
                this.lastFrameTime = performance.now();
            });

            // 心跳：rAF 被节流/停止时（切 tab、最小化、被其他窗口遮挡）持续推进游戏逻辑
            setupGameAppBackgroundHeartbeat(
                () => performance.now() - this.lastFrameTime,
                (timestamp) => tickGameLogicOnly(this, timestamp),
            );

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
                    const prevEliminable = BrawlFeedPanel.isEliminableFaction(event.previousFactionId);
                    const isFall = prevEliminable
                        && this.cityManager.getCitiesByFaction(event.previousFactionId).length === 0;
                    const isCenter = isRegionCenter(event.cityId);

                    // [语音播报] 直播主角 = 跟拍军团：所有语音只围绕它（700 国全局播报太吵）。
                    // 跟拍军团攻占文化中心 → S 级仪式播报（带字幕条）；
                    // 普通攻占 → 常规播报（原行为）；别人干的一律不出声（军情面板留字）。
                    const followedId = this.cameraFollowUI?.getFollowedArmyId?.();
                    const byFollowed = !!event.captorLegionId && followedId === event.captorLegionId;
                    if (byFollowed) {
                        const regionKey = isCenter ? this.cityManager.getCity(event.cityId)?.region : undefined;
                        const regionLabel = regionKey ? (REGION_LABELS[regionKey as RegionType] ?? '') : undefined;
                        const capJu = (event.attackerJu as CaptureJu) ?? 'balance';
                        speechAnnouncer.announceCityCapture({
                            attackerFactionId: event.newFactionId,
                            cityName: event.cityName,
                            ju: capJu,
                            attackerSkillId: event.attackerSkillId,
                            defenderGeneralId: event.defenderGeneralId,
                            regionLabel,
                        });
                    }

                    if (!event.captorLegionName) return;
                    if (!prevEliminable) return;

                    if (isFall) {
                        this.brawlFeedPanel.pushFactionFall({
                            attackerFactionId: event.newFactionId,
                            legionName: event.captorLegionName,
                            defenderFactionId: event.previousFactionId,
                            cityName: event.cityName,
                        });
                        return;
                    }

                    // 攻占大城（或同级核心据点）
                    const city = this.cityManager.getCity(event.cityId);
                    if (city && (city.type === 'big_city' || (city.tier ?? 99) <= 1)) {
                        this.brawlFeedPanel.pushCityCapture({
                            attackerFactionId: event.newFactionId,
                            legionName: event.captorLegionName,
                            regionKey: city.region,
                            cityName: event.cityName
                        });
                    }
                });

                Army.setAnnihilationReporter((army, info) => {
                    // [语音播报] 跟随军团全军覆没 (移至最前，防止 panjun 被 return)
                    const followedId = this.cameraFollowUI?.getFollowedArmyId?.();
                    // 野战阵亡('field')/攻城失败('siege_attacker')语音由专句接管，此处跳过通用覆没语音
                    // 援军('siege') — 不管是攻城还是守城援军 — 统一走野战结束句
                    if (followedId === army.id && info.kind !== 'field' && info.kind !== 'siege_attacker') {
                        speechAnnouncer.announceFieldBattleEnd({
                            win: false,
                            followerFactionId: army.getFactionId(),
                            ju: 'balance', // 援军覆没兜底：无战场可直接读比例
                            followerSkillId: info.battleSkillId ?? null,
                        });
                    }

                    if (!BrawlFeedPanel.isEliminableFaction(army.getFactionId())) return;
                    this.brawlFeedPanel.pushLegionAnnihilated({
                        factionId: army.getFactionId(),
                        legionName: army.name || '军团',
                        cityName: info.cityName,
                    });
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
                    // 复国与跟拍主角无关，不做语音（军情面板文字照旧）
                    this.brawlFeedPanel.pushRestoration(report);
                });
            }
            this.perfMonitor.markBootPhase('事件/军团/叛乱管理器');
            await yieldToBrowser();

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
                // 海路编辑器已并入 roadEditor，不再单独注册（否则编辑器列表里出现两个入口）
                this.unifiedEditorManager.register(this.roadEditor);
            }

            const legionManager = this.historicalEventManager.getLegionManager();
            wireGeneralSkillCombat(this, legionManager);
            this.aiController = new AIController(
                legionManager,
                this.cityManager,
                roadRegistry,
                this.historicalEventManager
            );
            this.recruitmentSystem = new RecruitmentSystem(
                this.cityManager,
                legionManager,
                this.historicalEventManager.getSiegeManager()
            );
            this.followResupplySystem = new FollowResupplySystem(this.cityManager);
            legionManager.setFollowResupplySystem(this.followResupplySystem);
            legionManager.syncCitySpawnTierConsumption();

            this.speedOverlay = new SpeedOverlayRenderer(this.map, this.overrideManager);
            this.landSeaBoundary = new LandSeaBoundaryLayer(this.map);

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
                this.uiManager
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
                        // 切换跟随目标时，若新目标已在战斗中则立即弹出战斗 UI
                        // 先查区域战 (BattleField)
                        let found = false;
                        const activeFields = this.combatSystem.getActiveBattleFields();
                        for (const bf of activeFields) {
                            if (bf.isOver || !bf.hasParticipant(armyId)) continue;
                            const attackers = bf.getAttackerUnits();
                            const defenders = bf.getDefenderUnits();
                            if (attackers.length === 0 || defenders.length === 0) continue;
                            try {
                                this.combatUI.showRegional(
                                    attackers, defenders, undefined, undefined,
                                    (window as any).__huoqubingBattleTitle ?? bf.customTitle ?? (bf.type === 'siege' ? (bf.siegeCityId ? `${this.cityManager.getCity(bf.siegeCityId)?.name ?? ''} 攻防战` : '攻城战') : `${this.cityManager.getFactionName(bf.getAttackerFactionId())} 大战 ${this.cityManager.getFactionName(bf.getDefenderFactionId())}`),
                                    '', false, bf.targetDuration, this.timeSystem.getSpeed(), bf,
                                );
                                found = true;
                            } catch (err) {
                                console.error('[GameApp] 切换跟随弹出战斗 UI 失败：', err);
                            }
                            break;
                        }
                        // 再查老式 1v1 战斗 (Battle)
                        if (!found) {
                            const activeBattles = this.combatSystem.getActiveBattles();
                            for (const battle of activeBattles) {
                                if (battle.isOver) continue;
                                if (battle.attacker.id !== armyId && battle.defender.id !== armyId) continue;
                                try {
                                    this.combatUI.show(battle);
                                    found = true;
                                } catch (err) {
                                    console.error('[GameApp] 切换跟随弹出 1v1 战斗 UI 失败：', err);
                                }
                                break;
                            }
                        }
                        // 新目标不在任何战斗中 → 必须收掉上一场的面板：
                        // 否则旧战斗的立绘/名牌会一直挂到那场仗自己打完（十几秒），
                        // 而战斗面板的全部入口都以「跟随军团参战」为前提，留着就是错的。
                        if (!found) {
                            this.combatUI.hide();
                        }
                    }
                },
                () => legionManager.trimLegionsToCap(),
                (armyId, newName) => legionManager.renameLegion(armyId, newName)
            );
            // 合并势力榜：军团列表（左上角）每行附带所属势力的兵力/据点数与兵力排名色条
            this.cameraFollowUI.setFactionStats(this.cityManager, this.factionManager);
            this.cameraFollowUI.update();

            this.expeditionUI = new ExpeditionUI();
            this.expeditionUI.init(
                () => {
                    const id = this.cameraFollowUI.getFollowedArmyId();
                    return id ? legionManager.getLegionById(id) ?? null : null;
                },
                this.cityManager
            );

            // 岳飞北伐黄龙 圆梦脚本：军团按钮下方按钮触发
            this.yuefeiExpedition = new YuefeiExpedition({
                legionManager,
                cityManager: this.cityManager,
                cameraFollowUI: this.cameraFollowUI,
                notify: (msg) => gameLog('expedition', msg),
                ensureUnpaused: () => {
                    if (this.timeSystem.isGamePaused()) {
                        this.timeSystem.setPaused(false);
                    }
                },
                snapCameraToArmy: (armyId) => {
                    const army = legionManager.getLegionById(armyId);
                    if (!army) return;
                    const pos = army.getPosition();
                    const lMap = this.map.getLeafletMap();
                    lMap.setView([pos.lat, pos.lng], lMap.getZoom(), { animate: false });
                },
                kickLegionAi: (armyId) => {
                    this.aiController?.tickArmyById(armyId);
                },
            });
            this.cameraFollowUI.setYuefeiHandler(() => this.yuefeiExpedition.start());
            this.cameraFollowUI.setHuoQubingHandler(() => this.huoqubingExpedition.start());

            // 霍去病封狼居胥 脚本
            this.huoqubingExpedition = new HuoQubingExpedition({
                legionManager,
                cityManager: this.cityManager,
                cameraFollowUI: this.cameraFollowUI,
                notify: (msg) => gameLog('expedition', msg),
                ensureUnpaused: () => {
                    if (this.timeSystem.isGamePaused()) {
                        this.timeSystem.setPaused(false);
                    }
                },
                snapCameraToArmy: (armyId) => {
                    const army = legionManager.getLegionById(armyId);
                    if (!army) return;
                    const pos = army.getPosition();
                    const lMap = this.map.getLeafletMap();
                    lMap.setView([pos.lat, pos.lng], lMap.getZoom(), { animate: false });
                },
                kickLegionAi: (armyId) => {
                    this.aiController?.tickArmyById(armyId);
                },
            });

            // 诸葛亮北伐中原 脚本
            this.zhugeliangExpedition = new ZhugeLiangExpedition({
                legionManager,
                cityManager: this.cityManager,
                cameraFollowUI: this.cameraFollowUI,
                notify: (msg) => gameLog('expedition', msg),
                ensureUnpaused: () => {
                    if (this.timeSystem.isGamePaused()) {
                        this.timeSystem.setPaused(false);
                    }
                },
                snapCameraToArmy: (armyId) => {
                    const army = legionManager.getLegionById(armyId);
                    if (!army) return;
                    const pos = army.getPosition();
                    const lMap = this.map.getLeafletMap();
                    lMap.setView([pos.lat, pos.lng], lMap.getZoom(), { animate: false });
                },
                kickLegionAi: (armyId) => {
                    this.aiController?.tickArmyById(armyId);
                },
            });
            this.cameraFollowUI.setZhugeLiangHandler(() => this.zhugeliangExpedition.start());

            StreamModeToggle.init();
            SpeechVoiceToggle.init();

            // 自动缩放：首次跟随 → 8；战斗结束（战术/战略）→ 陆军 9 / 海军 10；战斗过后永不再用 8。
            this.zoomController = new ZoomController(this.map, () => {
                const id = this.cameraFollowUI.getFollowedArmyId();
                return id ? legionManager.getLegionById(id) ?? null : null;
            }, () => {
                // 是否在战斗中：战术模式（zoom13 微观战斗）+ 战略地图区域战（跟随军团参战）
                if (this.battleScene?.isActive?.()) return true;
                const followedId = this.cameraFollowUI.getFollowedArmyId();
                if (!followedId) return false;
                return this.combatSystem.getActiveBattleFields().some((bf) => !bf.isOver && bf.hasParticipant(followedId));
            });

            // [诊断] 缩放卡顿自动采样（仅 DEV）：每次缩放落盘 scratch/zoom_perf_latest.json，
            // 免得排查时还要主人在控制台敲命令。不改变任何游戏行为。
            ZoomPerfProbe.install(this);

            // 世界存档（跨天续摊）：存/读由人主动点，刷新绝不自动读档；自动存档每 10 分钟覆盖当天档。
            this.saveManager = new GameSaveManager(this);
            new SaveLoadUI(this.saveManager).init();
            this.saveManager.startAutoSave();
            this.map.getLeafletMap().on('dragstart', () => {
                // [2026-06-23 Fix] 不要自动取消，允许玩家拥有弹性拖拽体验
                // if (this.cameraFollowUI?.isFollowing()) {
                //     this.cameraFollowUI.cancelFollow();
                // }
            });

            this.exposeGlobals();

            initUnattendedStream(this, this.gameTimeHUD);

            setInterval(() => {
                this.uiManager.update();
            }, GAME_CONSTANTS.UI_UPDATE_INTERVAL);

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

// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept(['../types/CultureFormations.ts'], () => {
        console.log('[HMR] CultureFormations.ts 改变，自动应用到大地图现有军队');
        if ((window as any).game?.legionManager) {
            (window as any).game.legionManager.refreshCultureFormations();
        }
    });

    // @ts-ignore
    import.meta.hot.accept(['../data/cities_v2.ts'], ([mod]: any[]) => {
        const game = (window as any).game as GameApp | undefined;
        if (!game?.cityManager || !mod?.CITIES_V2) return;
        const fresh: Array<{ id: string; name: string; factionId: string; lat: number; lng: number; type: string; troops?: number; region?: string; mirror?: boolean; startYear?: number; endYear?: number }> = mod.CITIES_V2;
        const existing = game.cityManager.getCities();
        const existingMap = new Map(existing.map(c => [c.id, c]));
        let updated = 0, added = 0;
        for (const c of fresh) {
            const old = existingMap.get(c.id);
            if (old) {
                if (old.name !== c.name || old.factionId !== c.factionId) {
                    game.cityManager.updateCity(c.id, { name: c.name, factionId: c.factionId }, { skipCaptureLog: true });
                    updated++;
                }
            } else {
                game.cityManager.addCity({
                    id: c.id, name: c.name, factionId: c.factionId,
                    latitude: c.lat, longitude: c.lng, type: c.type as any,
                    troops: c.troops ?? 5000,
                });
                added++;
            }
        }
        console.log(`[HMR] cities_v2.ts → 更新 ${updated} 座, 新增 ${added} 座`);
    });

    // SandboxDisplayNames / factions 自己处理数据原地更新，完成后 dispatch 'hmr:flag-data'
    window.addEventListener('hmr:flag-data', () => {
        const game = (window as any).game as GameApp | undefined;
        if (!game?.cityManager) return;
        const cities = game.cityManager.getCities();
        const refreshed = new Set<string>();
        for (const city of cities) {
            if (city.factionId && city.factionId !== 'panjun' && !refreshed.has(city.factionId)) {
                CityAssetManager.invalidateFlagTextCache(city.factionId);
                refreshed.add(city.factionId);
            }
        }
        game.cityManager.refreshAll();
        console.log(`[HMR] 旗号数据改变 → 已刷新 ${refreshed.size} 个势力的旗号文字`);
    });
}
