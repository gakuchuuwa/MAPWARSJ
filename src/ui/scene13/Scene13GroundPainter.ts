/**
 * ZOOM 13 战术模式地面基础常量与气候光影配置。
 * （原 2D Canvas 地面绘制器 Scene13GroundPainter 已由 WebGL 地面渲染器 Scene13GroundLayerGL 全面替代并清理。）
 */

/** 等距菱形瓦片（2:1，DE 同款投影） */
export const TILE_W = 64;
export const TILE_H = 32;
export const ELEV_STEP_PX = 18;

/**
 * DE 官方经典不同气候/底图专属光影色调映射（Biome Lighting Profile）
 * - 迎光面 (Sunlight Highlight)：高山/沙丘/雪坡在 45° 阳光直射下的漫反射色彩与强度；
 * - 背光面 (Shadow Ambient)：背阴坡面的环境遮蔽与色调（如沙漠暖红褐、雪地天青冰蓝、草地墨绿褐）。
 */
export interface BiomeLightingProfile {
    lightR: number; lightG: number; lightB: number; lightMaxAlpha: number;
    darkR: number; darkG: number; darkB: number; darkMaxAlpha: number;
}

export function resolveBiomeLighting(tile: string): BiomeLightingProfile {
    // 1. 极地雪原 / 冻土苔原（冰雪清冽通透，背光呈天空冷青蓝）
    if (tile.startsWith('sn') || tile.startsWith('ic') || tile === 'sno' || tile === 'snd' || tile === 'ice') {
        return {
            lightR: 255, lightG: 255, lightB: 255, lightMaxAlpha: 0.36,
            darkR: 45, darkG: 68, darkB: 95, darkMaxAlpha: 0.32
        };
    }
    // 2. 沙漠 / 戈壁 / 干旱荒原（烈日高照暖金黄，背光呈深赭石暖红褐）
    if (tile.startsWith('pal') || tile.startsWith('des') || tile === 'ds5' || tile === 'ds2' || tile === 'qs') {
        return {
            lightR: 255, lightG: 238, lightB: 160, lightMaxAlpha: 0.38,
            darkR: 85, darkG: 45, darkB: 18, darkMaxAlpha: 0.42
        };
    }
    // 3. 热带雨林 / 潮湿密林（阳光金绿透亮，背光浓郁深青苔藓色）
    if (tile === 'fo2' || tile === 'gr6' || tile === 'qs2' || tile.startsWith('underbrush_rainforest')) {
        return {
            lightR: 242, lightG: 255, lightB: 185, lightMaxAlpha: 0.32,
            darkR: 20, darkG: 38, darkB: 24, darkMaxAlpha: 0.40
        };
    }
    // 4. 岩石山地 / 高原砾石（高山苍茫浅金，背光呈冷灰石质）
    if (tile === 'rck' || tile === 'gravel_default' || tile === 'pm2') {
        return {
            lightR: 255, lightG: 248, lightB: 230, lightMaxAlpha: 0.34,
            darkR: 48, darkG: 42, darkB: 36, darkMaxAlpha: 0.38
        };
    }
    // 5. 默认：温带草原 / 温带森林（柔和明快暖日光，背光深草绿褐色）
    return {
        lightR: 255, lightG: 248, lightB: 205, lightMaxAlpha: 0.30,
        darkR: 35, darkG: 45, darkB: 22, darkMaxAlpha: 0.36
    };
}

export function isWaterTile(tile: string): boolean {
    return tile === 'river_clean_green' || tile === 'wtr' || tile.startsWith('wt') || tile.startsWith('sh');
}

/** DE terrain/blends 有机咬合遮罩类别（白=目标地形、黑=露底、边缘噪点咬合）。 */
export type BlendKind = 'landland' | 'snowland' | 'watershore' | 'shallowswater' | 'icewater' | 'roadland' | 'farmland';

export function blendForTile(tile: string): BlendKind {
    if (tile === 'river_clean_green' || tile === 'wtr' || tile.startsWith('wt')) return 'watershore';
    if (tile === 'sh4' || tile === 'sh5' || tile === 'sha' || tile === 'sh2' || tile === 'sh3' || tile.startsWith('sh')) return 'shallowswater';
    if (tile === 'ice' || tile.startsWith('ic')) return 'icewater';
    if (tile === 'snd' || tile === 'snf' || tile === 'sno' || tile === 'sn2' || tile.startsWith('sn')) return 'snowland';
    if (tile === 'rd1' || tile === 'rd2' || tile === 'rd5' || tile === 'sr2' || tile === 'pm1' || tile.includes('road')) return 'roadland';
    if (tile.includes('farm') || tile.includes('field') || tile.includes('rice')) return 'farmland';
    return 'landland';
}

/** 一块地形斑块（原 Scene13WarLayer.DecorPatch，抽模块时改名） */
export interface GroundPatch {
    tile: string;
    img: HTMLImageElement | null;
    cells: Array<[number, number]>;
    polygon?: Array<{ x: number; y: number }>;
    alpha: number;
    isWater?: boolean;
    isRoad?: boolean;
    category?: string;
    blur?: number;
    bbox?: { x: number; y: number; w: number; h: number };
    waterPattern?: CanvasPattern | null;
    waterPattern2?: CanvasPattern | null;
    cache?: HTMLCanvasElement;
    cacheX?: number;
    cacheY?: number;
}
