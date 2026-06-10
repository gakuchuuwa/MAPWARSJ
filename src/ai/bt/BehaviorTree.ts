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

    /** 当前锁定的目标位置（终目标坐标） */
    targetPosition: { lat: number; lng: number } | null;

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
