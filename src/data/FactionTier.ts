/**
 * 正规势力六级分档 + 旗面素材编号（515 势力；不含 panjun 叛军据点）
 *
 * 级别由 factionTierClassify 按 SandboxDisplayNames 旗号字数 + 审计表**运行时**计算。
 * 改旗号短名 → 刷新游戏即更新级别/旗形，无需手跑脚本。
 *
 * 导出审计快照：npm run tier:export
 */
import { SANDBOX_DISPLAY_NAMES } from './SandboxDisplayNames';
import {
    FACTION_FLAG_TEMPLATE_BY_TIER,
    classifyFactionTier,
    flagCharLen,
    type FactionTier,
} from './factionTierClassify';

export type { FactionTier };
export { FACTION_FLAG_TEMPLATE_BY_TIER };

/**
 * 单字旗统一模板：凡旗号只有一个字，一律套用 7-1.png（方旗，最适合单字）。
 * 主人 2026-07-06 定：不分级别（政权/民族/家族/州郡/起义），只要旗号一字都用 7。
 * 二字旗仍按 FACTION_FLAG_TEMPLATE_BY_TIER 选各自的横宽旗形。
 */
export const SINGLE_CHAR_FLAG_TEMPLATE_ID = 7;

export function getFactionTier(factionId: string): FactionTier {
    if (!factionId || factionId === 'panjun') return 5;
    const flag = SANDBOX_DISPLAY_NAMES[factionId] ?? factionId;
    return classifyFactionTier(factionId, flag).tier;
}

export function getFactionFlagTemplateId(factionId: string): number {
    if (factionId && factionId !== 'panjun') {
        const flag = SANDBOX_DISPLAY_NAMES[factionId] ?? factionId;
        if (flagCharLen(flag) === 1) return SINGLE_CHAR_FLAG_TEMPLATE_ID;
    }
    return FACTION_FLAG_TEMPLATE_BY_TIER[getFactionTier(factionId)];
}

export function getFactionFlagTemplatePath(factionId: string): string {
    const id = getFactionFlagTemplateId(factionId);
    return `/SUCAI/S10QZ/${id}-1.png`;
}

/** 六级旗面底图路径（启动占位预载，最多 6 张） */
export function getAllFactionFlagTemplatePaths(): readonly string[] {
    const ids = new Set(Object.values(FACTION_FLAG_TEMPLATE_BY_TIER));
    return [...ids].map((id) => `/SUCAI/S10QZ/${id}-1.png`);
}

/** 调试 / 编辑器：完整分档结果 */
export function getFactionTierDetail(factionId: string) {
    const flag = SANDBOX_DISPLAY_NAMES[factionId] ?? factionId;
    const result = classifyFactionTier(factionId, flag);
    return {
        id: factionId,
        flag,
        ...result,
        flagTemplate: FACTION_FLAG_TEMPLATE_BY_TIER[result.tier],
    };
}
