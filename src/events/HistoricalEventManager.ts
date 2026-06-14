import { TimeSystem } from '../app/TimeSystem';
import { CityManager } from '../world/CityManager';
import { GameMap } from '../map/GameMap';
import { CombatSystem } from '../combat/CombatSystem';
import { LegionManager } from '../legion/LegionManager';
import { SiegeManager } from '../combat/SiegeManager';
import { FieldBattleManager } from '../combat/FieldBattleManager';
import { EventVisualizer } from '../core/EventVisualizer';
import { GameTimeHUD } from '../ui/GameTimeHUD';

export class HistoricalEventManager {
    private timeSystem: TimeSystem;
    private cityManager: CityManager;
    private map: GameMap;
    private combatSystem: CombatSystem;
    private gameTimeHUD?: GameTimeHUD;

    /** 开局点「播放」前为 true */
    private playbackPaused: boolean = true;

    private legionManager: LegionManager;
    private siegeManager: SiegeManager;
    private fieldBattleManager: FieldBattleManager;
    private eventVisualizer: EventVisualizer;

    public getLegionManager(): LegionManager { return this.legionManager; }
    public getSiegeManager(): SiegeManager { return this.siegeManager; }

    constructor(
        timeSystem: TimeSystem,
        cityManager: CityManager,
        map: GameMap,
        combatSystem: CombatSystem,
        gameTimeHUD?: GameTimeHUD
    ) {
        this.timeSystem = timeSystem;
        this.cityManager = cityManager;
        this.map = map;
        this.combatSystem = combatSystem;
        this.gameTimeHUD = gameTimeHUD;

        this.legionManager = new LegionManager(cityManager, map);
        this.eventVisualizer = new EventVisualizer(map);

        this.siegeManager = new SiegeManager(cityManager, this.legionManager, combatSystem, map, this.eventVisualizer);
        this.fieldBattleManager = new FieldBattleManager(cityManager, this.legionManager, combatSystem, map, this.eventVisualizer, this.siegeManager);

        this.legionManager.initContactEngine(combatSystem);
        this.legionManager.setSiegeManager(this.siegeManager);
        combatSystem.setReinforcementPollTargets(this.legionManager, this.siegeManager);
    }

    /** 开局点一次「播放」；再点则暂停推演 */
    public togglePlayback(): boolean {
        if (!this.playbackPaused) {
            this.playbackPaused = true;
            this.map.unlockCamera();
            this.timeSystem.setPaused(true);
            return false;
        }

        this.playbackPaused = false;
        this.timeSystem.setPaused(false);
        return true;
    }

    /** 军团移动 / 碰撞 / 增援（每帧） */
    public updateLegions(deltaTime: number): void {
        this.legionManager.update(deltaTime);
    }

    /** 历史事件系统已移除；保留空桩 */
    public updateEvents(_deltaTime: number): void {}

    /** @deprecated 历史事件系统已移除 */
    public isHistoricalEventsEnabled(): boolean { return false; }

    /** @deprecated 历史事件系统已移除 */
    public setScriptModeEnabled(_enabled: boolean): void {}

    /** @deprecated 历史事件系统已移除 */
    public reloadEvents(): void {}

    /** @deprecated 历史事件系统已移除 */
    public onEventTriggered(): void {}

    /** @deprecated 历史事件系统已移除 */
    public skipCurrentEvent(): void {}

    /** @deprecated 历史事件系统已移除 */
    public getEventHistory(): never[] { return []; }
}
