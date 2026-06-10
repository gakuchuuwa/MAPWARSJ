/**
 * UnitSpriteConfig.ts
 * 
 * 兵种精灵图配置管理。
 * 根据兵种类型返回对应的精灵图路径。
 */

import { LegionType } from '../types/UnitTypes';
import { SPRITE_PATHS } from './GameConfig';

/**
 * 精灵动作类型
 */
export type SpriteAction = 'MOVE' | 'ATTACK' | 'IDLE' | 'DAMAGE' | 'DEATH';

/**
 * 精灵图集接口
 */
export interface SpriteSet {
    MOVE: readonly string[];
    ATTACK: readonly string[];
    IDLE: readonly string[];
    DAMAGE: readonly string[];
    DEATH: readonly string[];
}

/**
 * 根据兵种类型获取精灵图集
 */
export function getSpriteSetForType(legionType: LegionType): SpriteSet {
    switch (legionType) {
        case 'cavalry':
            // 骑兵使用玩家骑兵贴图
            return {
                MOVE: SPRITE_PATHS.PHALANX.MOVE,
                ATTACK: SPRITE_PATHS.PHALANX.ATTACK,
                IDLE: SPRITE_PATHS.PHALANX.IDLE,
                DAMAGE: SPRITE_PATHS.PHALANX.DAMAGE,
                DEATH: SPRITE_PATHS.PHALANX.DEATH,
            };
        case 'archer_cavalry':
            // 弓骑使用骑兵贴图 (因为是骑马)
            return {
                MOVE: SPRITE_PATHS.PHALANX.MOVE,
                ATTACK: SPRITE_PATHS.PHALANX.ATTACK,
                IDLE: SPRITE_PATHS.PHALANX.IDLE,
                DAMAGE: SPRITE_PATHS.PHALANX.DAMAGE,
                DEATH: SPRITE_PATHS.PHALANX.DEATH,
            };
        case 'infantry':
        default:
            // 步兵使用步兵贴图
            return {
                MOVE: SPRITE_PATHS.LEGION.MOVE,
                ATTACK: SPRITE_PATHS.LEGION.ATTACK,
                IDLE: SPRITE_PATHS.LEGION.IDLE,
                DAMAGE: SPRITE_PATHS.LEGION.DAMAGE,
                DEATH: SPRITE_PATHS.LEGION.DEATH,
            };
    }
}

/**
 * 获取指定兵种和动作的精灵图路径数组
 */
export function getSpritePaths(legionType: LegionType, action: SpriteAction): readonly string[] {
    const spriteSet = getSpriteSetForType(legionType);
    return spriteSet[action];
}

/**
 * 预加载所有兵种的精灵图
 */
export function getAllSpritePaths(): string[] {
    const allPaths: string[] = [];

    // 骑兵
    allPaths.push(...SPRITE_PATHS.PHALANX.MOVE);
    allPaths.push(...SPRITE_PATHS.PHALANX.ATTACK);
    allPaths.push(...SPRITE_PATHS.PHALANX.IDLE);
    allPaths.push(...SPRITE_PATHS.PHALANX.DAMAGE);
    allPaths.push(...SPRITE_PATHS.PHALANX.DEATH);

    // 步兵
    allPaths.push(...SPRITE_PATHS.LEGION.MOVE);
    allPaths.push(...SPRITE_PATHS.LEGION.ATTACK);
    allPaths.push(...SPRITE_PATHS.LEGION.IDLE);
    allPaths.push(...SPRITE_PATHS.LEGION.DAMAGE);
    allPaths.push(...SPRITE_PATHS.LEGION.DEATH);



    return allPaths;
}

console.log('🎨 [UnitSpriteConfig] Loaded unit sprite configuration');
