/**
 * 立绘配置内置默认值（TypeScript 模块，避免 portrait_config.json 被清空时 Vite 无法启动）。
 * 用户通过战斗 UI 保存的映射在运行时写入 localStorage / 自选 portrait_config.json。
 * 该 JSON **不会**自动打进构建包；勿用「区域冲突」等泛用标题作 key（会误伤全部区域战）。
 */
export interface PortraitMappingData {
    attacker?: string;
    defender?: string;
    attackerMirror?: boolean;
    defenderMirror?: boolean;
}

export type PortraitConfigData = Record<string, PortraitMappingData>;

export const DEFAULT_PORTRAIT_CONFIG: PortraitConfigData = {};
