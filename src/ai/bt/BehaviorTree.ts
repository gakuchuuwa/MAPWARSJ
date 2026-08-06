/**
 * BehaviorTree.ts
 *
 * 轻量级行为树核心框架。
 * 专为策略游戏 AI 设计，支持 Selector, Sequence 和自定义 Action 节点。
 *
 * [BUGFIX 2026-06-02] 节点本身完全无状态（stateless），运行状态存入 BTContext.nodeState。
 * 这样所有军团可安全共享同一棵树实例，不会互相污染 runningChild。
 * 原实现将 runningChild 存在节点实例上，多军团共用同一棵树时状态相互覆盖，
 * 导致"放弃目标 null"等诡异 AI 行为。
 */

/** 节点执行状态 */
export enum BTStatus {
    /** 成功完成 */
    SUCCESS = 'SUCCESS',
    /** 执行失败 */
    FAILURE = 'FAILURE',
    /** 正在执行中（需要下一帧继续） */
    RUNNING = 'RUNNING'
}

/**
 * 行为树节点基类（完全无状态）
 */
export abstract class BTNode {
    public name: string;

    /** 全局唯一 ID，用于在 context.nodeState 中存取本节点的运行状态 */
    public readonly nodeId: number;
    private static nextId = 0;

    constructor(name: string = 'Node') {
        this.name = name;
        this.nodeId = BTNode.nextId++;
    }

    /** 每帧执行，返回当前状态 */
    abstract tick(context: BTContext): BTStatus;

    /** 节点被中断时调用（可选重写） */
    public abort(context: BTContext): void { }
}

/**
 * 共享上下文（黑板），存储 AI 决策所需的所有数据。
 * 每个军团持有独立的 BTContext 实例。
 */
export interface BTContext {
    /** 当前控制的军队实例 */
    army: any;

    /** 当前锁定的目标城市 ID（与 strategicTargetCityId 同步，兼容旧逻辑） */
    targetCityId: string | null;

    /** 抽签终目标：不因路径「第一站」改写 */
    strategicTargetCityId: string | null;

    /**
     * 战术追击目标：附近敌军团 id。
     * 有值时优先野战追击，不走攻城链；**不清除** strategicTargetCityId（攻城目标挂起，追击结束后恢复）。
     * ⚠️ 优先级 ≠ 频率：本字段多数时候是 null（半径 0.8°≈89km 内没有敌军团），
     *    实机约 90% 的战斗是攻城战。见 AGENTS.md「战斗构成：90% 是攻城战」。
     */
    strategicTargetArmyId: string | null;

    /** 当前锁定的目标位置（终目标坐标） */
    targetPosition: { lat: number; lng: number } | null;

    /**
     * 追击目标「因对方交战中而打不起来」的连续起始时刻（performance.now），null = 当前没被卡住。
     * 用于给 HoldForFieldContact 兜底：该节点会 stopMovement 并返回 SUCCESS，
     * 行为树不会继续往下走攻城分支，所以只要目标一直处于交战中，军团就永远停在原地。
     * 对方若在攻城（攻城串行、且站着不动），既不会被打死也不会跑出放弃半径，无人能把它救出来。
     */
    huntBlockedSinceMs: number | null;

    /**
     * 上次采用的推进锚点（迟滞用；null = 尚未选过）。
     *
     * [2026-08-06] resolveForwardAnchor 每次重算都取「离军团最近的己方城」，两座己方城
     * 距离相近时会在两次 FindTarget 之间来回跳，方向池跟着整组换掉 → 观感是原地折返。
     * 锁在这里做迟滞：旧锚点仍有效就留着，除非新候选**明显**更近（见 FindTarget）。
     * 不是硬锁——军团亲自打下的城距离≈0，一定能顶掉旧锚点，推进不受影响。
     */
    marchAnchorCityId: string | null;

    /**
     * 正在野战交手的那支敌军团 id（脱战即清）。
     *
     * [2026-08-06] 只为「打完别立刻再追同一支」服务：目标冷却只有 12s，双将野战 30s+，
     * 开战时盖一次章根本撑不到脱战。IsInCombat 每帧给它续期，等于冷却从**脱战那刻**才起算。
     */
    postBattleFoeArmyId: string | null;

    /** 最近一次移动的结果 */
    lastMoveResult: 'success' | 'failure' | 'blocked' | null;
    /** 最近失败目标冷却：targetCityId -> lastFailedAt(ms) */
    recentFailedTargets: Map<string, number>;
    /** 相同失败日志节流：`${armyId}:${targetCityId}` -> lastLogAt(ms) */
    moveFailureLogCooldown: Map<string, number>;
    /** BT 决策日志节流：`${armyId}:${eventKey}` -> lastLogAt(ms) */
    btLogThrottle: Map<string, number>;

    /** 依赖服务 */
    legionManager: any;
    cityManager: any;
    roadRegistry: any;

    /** 调试日志开关 */
    debug: boolean;

    /**
     * [STATELESS FIX] 每个节点的运行状态，key = nodeId，value = 正在执行的子节点索引。
     * -1 表示从头开始。
     * 由于每个军团有独立的 BTContext，节点状态天然隔离，不会互相污染。
     */
    nodeState: Map<number, number>;
}

/** 清除本军团所有复合节点的续跑索引（战斗打断、传送等场景可调用） */
export function resetBtNodeState(context: BTContext): void {
    context.nodeState.clear();
}

// =====================
// 复合节点
// =====================

/**
 * Selector (选择器): 依次尝试子节点，直到一个成功
 */
export class Selector extends BTNode {
    private children: BTNode[];

    constructor(name: string, children: BTNode[]) {
        super(name);
        this.children = children;
    }

    tick(context: BTContext): BTStatus {
        const runningChild = context.nodeState.get(this.nodeId) ?? -1;
        const startIdx = runningChild >= 0 ? runningChild : 0;

        for (let i = startIdx; i < this.children.length; i++) {
            const status = this.children[i].tick(context);

            if (status === BTStatus.RUNNING) {
                context.nodeState.set(this.nodeId, i);
                return BTStatus.RUNNING;
            }
            if (status === BTStatus.SUCCESS) {
                context.nodeState.set(this.nodeId, -1);
                return BTStatus.SUCCESS;
            }
            // FAILURE -> 继续尝试下一个
        }

        context.nodeState.set(this.nodeId, -1);
        return BTStatus.FAILURE;
    }

    abort(context: BTContext): void {
        const runningChild = context.nodeState.get(this.nodeId) ?? -1;
        if (runningChild >= 0) {
            this.children[runningChild].abort(context);
        }
        context.nodeState.set(this.nodeId, -1);
    }
}

/**
 * Sequence (序列): 依次执行子节点，直到一个失败
 */
export class Sequence extends BTNode {
    private children: BTNode[];

    constructor(name: string, children: BTNode[]) {
        super(name);
        this.children = children;
    }

    tick(context: BTContext): BTStatus {
        const runningChild = context.nodeState.get(this.nodeId) ?? -1;
        const startIdx = runningChild >= 0 ? runningChild : 0;

        for (let i = startIdx; i < this.children.length; i++) {
            const status = this.children[i].tick(context);

            if (status === BTStatus.RUNNING) {
                context.nodeState.set(this.nodeId, i);
                return BTStatus.RUNNING;
            }
            if (status === BTStatus.FAILURE) {
                context.nodeState.set(this.nodeId, -1);
                return BTStatus.FAILURE;
            }
            // SUCCESS -> 继续下一个
        }

        context.nodeState.set(this.nodeId, -1);
        return BTStatus.SUCCESS;
    }

    abort(context: BTContext): void {
        const runningChild = context.nodeState.get(this.nodeId) ?? -1;
        if (runningChild >= 0) {
            this.children[runningChild].abort(context);
        }
        context.nodeState.set(this.nodeId, -1);
    }
}

// =====================
// 装饰器节点
// =====================

/**
 * Inverter: 反转子节点结果 (SUCCESS <-> FAILURE)
 */
export class Inverter extends BTNode {
    private child: BTNode;

    constructor(child: BTNode) {
        super(`Not(${child.name})`);
        this.child = child;
    }

    tick(context: BTContext): BTStatus {
        const status = this.child.tick(context);
        if (status === BTStatus.SUCCESS) return BTStatus.FAILURE;
        if (status === BTStatus.FAILURE) return BTStatus.SUCCESS;
        return BTStatus.RUNNING;
    }

    abort(context: BTContext): void {
        this.child.abort(context);
    }
}

/**
 * Condition: 条件检查节点（不执行动作，只返回 SUCCESS/FAILURE）
 */
export class Condition extends BTNode {
    private check: (ctx: BTContext) => boolean;

    constructor(name: string, check: (ctx: BTContext) => boolean) {
        super(name);
        this.check = check;
    }

    tick(context: BTContext): BTStatus {
        return this.check(context) ? BTStatus.SUCCESS : BTStatus.FAILURE;
    }
}

/**
 * Action: 执行具体动作的叶子节点
 */
export class Action extends BTNode {
    private execute: (ctx: BTContext) => BTStatus;

    constructor(name: string, execute: (ctx: BTContext) => BTStatus) {
        super(name);
        this.execute = execute;
    }

    tick(context: BTContext): BTStatus {
        return this.execute(context);
    }
}
