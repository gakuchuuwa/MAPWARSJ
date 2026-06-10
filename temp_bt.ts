/**
 * 创建标准军团 AI 行为树
 * 简化策略：持续进攻直到战死，不撤退、不休整。
 */
export function createLegionBehaviorTree(): BTNode {
    // 进攻序列：有目标 -> 近距离则攻城，否则移动
    const attackSequence = new Sequence('AttackSequence', [
        // 如果没有目标，先找一个
        new Selector('EnsureTarget', [
            HasTarget,
            FindTarget
        ]),
        // 如果已经很近，触发攻城
        new Selector('ApproachOrStrike', [
            new Sequence('StrikeIfNear', [
                IsNearTarget,
                TriggerSiege
            ]),
            // 否则继续移动（失败则放弃目标）
            new Selector('MoveOrAbandon', [
                MoveToTarget,
                AbandonTarget
            ])
        ])
    ]);

    // 根节点：战斗中等待 > 进攻 > 待机
    const root = new Selector('RootSelector', [
        IsInCombat,
        attackSequence,
        Idle
    ]);

    return root;
}
