/**
 * 武将技数据 · 转发壳（2026-07-13 拆分）
 * 实体已按功能模块拆到 src/data/general-skills/：
 *   types.ts     类型与效果枚举
 *   catalogs.ts  旧 tac_* 兼容定义 / 战略技 / 系统技目录
 *   profiles.ts  ★ 835 条武将档案（批量工具唯一该写的文件）
 *   bridge.ts    v1 桥接（getTacticalSkillDef）
 * 本文件保持原 import 路径全部可用（export *），勿在此新增数据。
 * 现行战术技全表：src/data/TacticalSkillCatalog.ts；设计文档见 docs/02-design/武将技-分类逻辑说明.md。
 */

export * from './general-skills/types';
export * from './general-skills/catalogs';
export * from './general-skills/profiles';
export * from './general-skills/bridge';

export {
    getTacticalSkillEntry,
    getTacticalSkillEntryForGeneral,
    TACTICAL_SKILL_ENTRIES_V1,
    TACTICAL_SKILL_BY_ID,
    type TacticalSkillEntry,
    type TacticalSeries,
    type TacticalBaseEffect,
} from './TacticalSkillCatalog';
