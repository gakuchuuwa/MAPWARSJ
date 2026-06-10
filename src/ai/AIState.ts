/**
 * AIState.ts
 * 
 * 定义 AI 军团的有限状态机 (FSM) 状态。
 * 每个军团在任何时刻只能处于一种状态。
 */

export enum AIState {
    /** 待命：在城市或指定位置驻扎，等待新指令 */
    IDLE = 'IDLE',

    /** 进攻：向敌方城市或目标推进 */
    ATTACKING = 'ATTACKING',

    /** 防守：向受威胁的友方城市移动，拦截敌军 */
    DEFENDING = 'DEFENDING',

    /** 撤退：兵力不足，返回安全的后方城市恢复 */
    RETREATING = 'RETREATING',

    /** 集结：在前线等待友军汇合，准备发起总攻 */
    RALLYING = 'RALLYING',

    /** 交战中：正在战斗，无法移动或改变目标 */
    IN_COMBAT = 'IN_COMBAT',

    /** 休整中：在城市内恢复兵力 */
    RESTING = 'RESTING',

    /** 等待中：遇到友军阻挡，暂时停止行动 */
    WAITING = 'WAITING'
}

/**
 * AI 配置常量
 */
export const AI_CONFIG = {
    /** 兵力低于此比例时强制撤退 (0.3 = 30%) */
    RETREAT_THRESHOLD: 0.25,

    /** 兵力恢复到此比例后重新出击 (0.85 = 85%) */
    READY_THRESHOLD: 0.85,

    /** AI 决策间隔 (毫秒) */
    DECISION_INTERVAL_MS: 3000,

    /** 发起进攻所需的兵力优势比 (1.1 = 我方兵力需达到敌方的1.1倍) - 降低门槛以增加进攻性 */
    ATTACK_ADVANTAGE_RATIO: 1.1,

    /** 集结等待的最大时间 (秒) */
    RALLY_MAX_WAIT_SECONDS: 60,

    /** 集结范围 (距离单位)，在此范围内的友军可以协同进攻 */
    RALLY_RANGE: 150000, // 约150km (基于 LatLng 距离估算，需根据地图比例调整)

    /** 每个 AI 军团每帧行动的概率 (防止所有军团同时行动) */
    ACTION_PROBABILITY: 0.05
};
