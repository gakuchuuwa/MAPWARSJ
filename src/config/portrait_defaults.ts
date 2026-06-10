/**
 * 战斗 UI 默认立绘：14 文化区 × field/garrison + 叛军 panjun
 * 文件位于 public/assets/portraits/{REGION}_{role}.png
 *
 * 素材约定：全部 PNG 未镜像时目视**右侧**。
 * CombatUI：左攻不 scaleX、右守 scaleX(-1)，二人相向中央。
 */
import type { IBattleUnit } from '../core/CombatSystem';
import {
    resolveUnitCultureRegion,
    type CultureCombatRole,
} from '../systems/CultureCombat';

export const PORTRAIT_ASSETS_DIR = '/assets/portraits';

/** PNG 内人物默认目视方向（未做 scaleX 时） */
export type PortraitSourceFacing = 'left' | 'right';

/** 全库立绘统一朝右 */
export const DEFAULT_PORTRAIT_SOURCE_FACING: PortraitSourceFacing = 'right';

/** 从 URL 或参战单位推断 PNG 目视方向（当前恒为朝右） */
export function resolvePortraitSourceFacing(
    _unit?: IBattleUnit,
    _portraitPath?: string,
): PortraitSourceFacing {
    return DEFAULT_PORTRAIT_SOURCE_FACING;
}

/** 左攻右守相向中央：攻方应朝右、守方应朝左 */
export function shouldMirrorPortraitForSide(
    side: 'attacker' | 'defender',
    sourceFacing: PortraitSourceFacing = DEFAULT_PORTRAIT_SOURCE_FACING,
): boolean {
    return side === 'attacker' ? sourceFacing === 'left' : sourceFacing === 'right';
}

export function getCulturePortraitRole(unit: IBattleUnit): CultureCombatRole {
    return unit.unitType === 'city' ? 'garrison' : 'field';
}

/** 按参战单位文化区与军队/守军选默认立绘路径 */
export function getCombatPortraitPath(unit: IBattleUnit): string {
    if (unit.factionId === 'panjun') {
        return `${PORTRAIT_ASSETS_DIR}/panjun.png`;
    }
    const region = resolveUnitCultureRegion(unit);
    const role = getCulturePortraitRole(unit);
    return `${PORTRAIT_ASSETS_DIR}/${region}_${role}.png`;
}
