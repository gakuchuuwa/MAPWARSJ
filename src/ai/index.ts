/**
 * AI 模块索引
 * 导出所有 AI 相关组件
 */

export { AIState, AI_CONFIG } from './AIState';
export { AIController } from './AIController';
export { TargetEvaluator } from './TargetEvaluator';
export type { TargetScore } from './TargetEvaluator';
export {
    getArmyOriginCityId,
    isHomeCityLost,
    resolveForwardAnchor,
    resolveRecaptureTarget,
} from './TargetAnchorResolver';
export type { TargetAnchorCityAccess } from './TargetAnchorResolver';
export { RecruitmentSystem } from './RecruitmentSystem';
