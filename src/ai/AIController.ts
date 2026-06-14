/**
 * AIController.ts
 * [REFACTORED - Behavior Tree Edition]
 * 
 * 使用行为树驱动 AI 军团决策。
 * 每个军团持有独立的 BTContext，由统一的 BTRunner 执行。
 */

import { Army } from '../core/Army';
import { LegionManager } from '../core/LegionManager';
import { CityManager } from '../core/CityManager';
import { HistoricalEventManager } from '../events/HistoricalEventManager';
import { roadRegistry } from '../core/RoadRegistry';
import { GameConfig } from '../config/GameConfig';
import { gameLog } from '../utils/GameLogger';
import { getStrategicTargetId, setStrategicTarget } from './bt/BtDecisionLog';

import { BTNode, BTContext, BTStatus } from './bt/BehaviorTree';
import { createLegionBehaviorTree } from './bt/LegionBehaviors';

// AI 行为树诊断：见 GameConfig.LOG.AI 或控制台 gameLog.set({ AI: true })
const DEBUG_AI = GameConfig.LOG.AI;

export class AIController {
    private legionManager: LegionManager;
    private cityManager: CityManager;
    private historicalEventManager: HistoricalEventManager;

    /** 每个军团的行为树上下文 */
    private armyContexts: Map<string, BTContext> = new Map();

    /** 沙盒诊断：仅在上次 BT 状态变化时打印，避免每帧 SUCCESS 刷屏 */
    private lastBtStatusByArmy: Map<string, BTStatus> = new Map();

    /** 共享的行为树根节点（所有军团使用同一棵树结构） */
    private behaviorTree: BTNode;

    /** 系统是否启用 - 默认禁用，避免干扰剧本/事件控制 */
    private enabled: boolean = false;

    /** 时间分片索引 */
    private currentArmyIndex: number = 0;

    constructor(
        legionManager: LegionManager,
        cityManager: CityManager,
        roadRegistry: any, // 保留参数兼容性，但不再使用
        historicalEventManager: HistoricalEventManager
    ) {
        this.legionManager = legionManager;
        this.cityManager = cityManager;
        this.historicalEventManager = historicalEventManager;

        // 创建共享行为树
        this.behaviorTree = createLegionBehaviorTree();
        
        // [MODIFIED] Sandbox 大乱斗沙盒模式下默认开启 AI 系统
        if (GameConfig.SYSTEM.SANDBOX_MODE) {
            this.enabled = true;
            gameLog('startup', '[AIController] 🚨 沙盒大乱斗模式已检测到：已自动开启 AI 决策引擎');
        }
        
        gameLog('startup', '[AIController] 行为树系统初始化完成');
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * 每帧调用，分批处理 AI 军团
     */
    public update(): void {
        if (!this.enabled) return;

        const armies = this.legionManager.getArmies();
        if (armies.length === 0) return;

        // 时间分片：每帧最多处理 50 个军团
        const MAX_PROCESS_PER_FRAME = 50;
        const FRAME_BUDGET_MS = 8.0;
        const startTime = performance.now();
        let processed = 0;

        // [NEW] 1. 新军团首帧优先 tick（未在 armyContexts 中的插队执行，出征立刻思考）
        const newArmies = armies.filter(a => 
            !this.armyContexts.has(a.id) && 
            !a.isDestroyed && 
            a.type === 'legion' &&
            true
        );

        for (const army of newArmies) {
            if (performance.now() - startTime > FRAME_BUDGET_MS) break;
            this.tickArmy(army);
            processed++;
        }

        // [NEW] 2. 时间分片：继续轮询旧军团
        while (processed < MAX_PROCESS_PER_FRAME && processed < armies.length) {
            if (performance.now() - startTime > FRAME_BUDGET_MS) break;

            this.currentArmyIndex = (this.currentArmyIndex + 1) % armies.length;
            const army = armies[this.currentArmyIndex];

            // 跳过无效或非 AI 军团
            if (army.isDestroyed || army.type !== 'legion') continue;

            // 新军团刚才已经优先 tick 过了，本帧内轮询若再抽到可直接跳过
            if (newArmies.includes(army)) continue;

            this.tickArmy(army);
            processed++;
        }
    }

    /**
     * 执行单个军团的行为树
     */
    private tickArmy(army: Army): void {
        // 获取或创建上下文
        let context = this.armyContexts.get(army.id);
        if (!context) {
            context = this.createContext(army);
            this.armyContexts.set(army.id, context);
        }

        // 同步上下文（更新军队引用等）
        context.army = army;
        this.syncBlackboardTarget(context, army);

        // 执行行为树
        const status = this.behaviorTree.tick(context);

        if (DEBUG_AI) {
            const prev = this.lastBtStatusByArmy.get(army.id);
            if (prev !== status && status !== BTStatus.SUCCESS) {
                this.lastBtStatusByArmy.set(army.id, status);
                console.log(`[AI] ${army.name} BT → ${status}`);
            } else if (prev !== status) {
                this.lastBtStatusByArmy.set(army.id, status);
            }
        }
    }

    /**
     * 黑板与 Army 对齐：路径「第一站」只存在 Army 上，不覆盖 strategicTargetCityId。
     */
    private syncBlackboardTarget(context: BTContext, army: Army): void {
        const strategicId = getStrategicTargetId(context);
        const armyCity = army.getTargetCity();

        if (!strategicId && army.isIdle()) {
            if (armyCity) {
                army.setTargetCity(null);
            }
            return;
        }

        if (!strategicId && armyCity?.id && !army.getIsInCombat()) {
            setStrategicTarget(context, armyCity.id, {
                lat: armyCity.latitude,
                lng: armyCity.longitude,
            });
        }
    }

    /**
     * 为军团创建初始上下文
     */
    private createContext(army: Army): BTContext {
        return {
            army: army,
            targetCityId: null,
            strategicTargetCityId: null,
            targetPosition: null,
            lastMoveResult: null,
            recentFailedTargets: new Map(),
            moveFailureLogCooldown: new Map(),
            btLogThrottle: new Map(),
            legionManager: this.legionManager,
            cityManager: this.cityManager,
            roadRegistry: roadRegistry,
            debug: DEBUG_AI,
            nodeState: new Map(),
        };
    }

    /**
     * 清理被销毁军团的上下文
     */
    public cleanup(armyId: string): void {
        this.armyContexts.delete(armyId);
    }

    // =====================
    // 兼容旧接口 (供外部调用)
    // =====================

    public getState(armyId: string): string {
        // 返回简化状态，兼容旧代码
        const ctx = this.armyContexts.get(armyId);
        if (!ctx) return 'IDLE';
        if (ctx.army.getIsInCombat()) return 'IN_COMBAT';
        if (ctx.strategicTargetCityId || ctx.targetCityId) return 'ATTACKING';
        return 'IDLE';
    }

    public setState(armyId: string, state: string): void {
        // 行为树模式下，状态由树自动管理，此方法仅做日志
        if (DEBUG_AI) console.log(`[AIController] 外部尝试设置状态: ${armyId} -> ${state} (已忽略)`);
    }
}
