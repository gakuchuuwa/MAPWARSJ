// 本文件由 scripts/naval_fx_atlas.py 生成，请勿手改。
// 源素材：帝国时代2 决定版本体特效（public/SUCAI 下 2026-08-19 提取批次）。
export interface NavalFxMeta {
    /** 图集路径（public 下） */
    url: string;
    frames: number;
    /** 单帧宽高（图集像素） */
    fw: number;
    fh: number;
    /** 锚点：水花=命中点，炮焰=开炮船位置（DE 原素材 hotspot） */
    anchorX: number;
    anchorY: number;
    fps: number;
    durationMs: number;
    /** 图集相对 DE 原始像素的缩小倍率，用来还原成 DE 原比例 */
    atlasScale: number;
}

export type NavalFxName = 'CANNON_MUZZLE' | 'WATER_SPLASH';

export const NAVAL_FX: Record<NavalFxName, NavalFxMeta> = {
    CANNON_MUZZLE: {
        url: '/SUCAI/FX_NAVAL/CANNON_MUZZLE/sheet.png',
        frames: 24,
        fw: 96,
        fh: 82,
        anchorX: 0,
        anchorY: 64,
        fps: 24,
        durationMs: 1000,
        atlasScale: 0.412017,
    },
    WATER_SPLASH: {
        url: '/SUCAI/FX_NAVAL/WATER_SPLASH/sheet.png',
        frames: 24,
        fw: 96,
        fh: 81,
        anchorX: 56,
        anchorY: 28,
        fps: 24,
        durationMs: 1000,
        atlasScale: 0.644295,
    },
};
