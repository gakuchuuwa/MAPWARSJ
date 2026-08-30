/**
 * ZOOM 13 战术模式「地面渲染器」（2026-08-24 从 Scene13WarLayer 抽出）。
 *
 * 抽出的动机：背景图预览工具必须和实机画出完全一样的东西，否则在工具里调好的参数
 * 拿到游戏里对不上，看了等于白看。所以地面渲染只能有一份，游戏和工具共用这个模块。
 *
 * 本模块只负责「地面」，不碰战斗、单位、寻路、胜负：
 *   1. 铺底地形贴图（含 DE 2.5D 高程抬升，逐格高分组裁成真实倾斜四边形）；
 *   2. 地形斑块合成（硬菱形并集 → 距离场 → tile 级撕边 → source-in 填纹理 → 位图缓存）；
 *   3. 高程方向光（法线梯度 → Gouraud 放大 → multiply/screen 双刷）。
 *
 * 调用方负责：素材加载调度、装饰精灵、水体动画、单位——那些留在 Scene13WarLayer。
 */

/** 等距菱形瓦片（2:1，DE 同款投影） */
export const TILE_W = 64;
export const TILE_H = 32;
export const ELEV_STEP_PX = 18;
/** 高地光照羽化半径（px） */
const ELEV_BLUR = 5;

/**
 * DE 原版 2.5D 经典左上方光源（2:1 等距视角俯冲光）：
 * 迎光坡面明亮立体，背光坡面呈现清晰温暖的 2.5D 山坡阴影。
 */
const ELEV_LIGHT_DIR_X = 0.92;
const ELEV_LIGHT_DIR_Y = -0.39;

/** 坡度响应敏感系数：让局部缓坡与高台肩部清晰呈现出受光面/背光面 */
const ELEV_LIGHT_K = 2.4;

/** 背光坡面立体压暗深度（multiply） */
const ELEV_SHADE_DARK = 0.24;

/** 迎光坡面自然受光提亮（screen） */
const ELEV_SHADE_LIGHT = 0.18;
/**
 * 斑块撕边幅度：blend 噪声在边界等值线上推拉的量。
 * 实测（等周指标 = 周长 / 2√(π·面积)，1.0 = 完美圆滑）：
 *   纯高斯软边 0.93 → 撕边后 7.08，且半透明过渡带只有 2188px（碎而清晰，不是糊）。
 */
const PATCH_EDGE_RAGGED = 1.25;
/** 斑块边缘锐度：越大越接近 DE 那种「碎但清晰」的咬合边，越小越糊 */
const PATCH_EDGE_HARDNESS = 6.5;
/** DE 地形贴图目录 */
const TERRAIN_BASE_URL = '/SUCAI_TERRAIN/';


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
    // 🔴 仅真正的大江大海水体 (river_clean_green / wtr / wt*) 与浅滩浅水 (sh*) 参与动态波纹，
    //    绝不将地面草皮/泥土贴片误判为动态流动水体，彻底根除地面出现移动菱形方块的 Bug！
    return tile === 'river_clean_green' || tile === 'wtr' || tile.startsWith('wt') || tile.startsWith('sh');
}

/** DE terrain/blends 有机咬合遮罩类别（白=目标地形、黑=露底、边缘噪点咬合）。 */
export type BlendKind = 'landland' | 'snowland' | 'watershore' | 'shallowswater' | 'icewater' | 'roadland' | 'farmland';

export function blendForTile(tile: string): BlendKind {
    // 水系：真正大江大海 → watershore；浅滩/岸 → shallowswater
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
    /** 不规则斑块的网格单元 [gx, gy]（clump 生长，非矩形） */
    cells: Array<[number, number]>;
    /** 海岸连续遮罩（屏幕坐标）；存在时不再绘制逐格菱形。 */
    polygon?: Array<{ x: number; y: number }>;
    alpha: number;
    isWater?: boolean;
    isRoad?: boolean;
    /** 边缘高斯模糊半径（px）；缺省 polygon=16 / cells=24。 */
    blur?: number;
    bbox?: { x: number; y: number; w: number; h: number };
    waterPattern?: CanvasPattern | null;
    waterPattern2?: CanvasPattern | null;
    /**
     * 🔴 [2026-08-24 性能] 本块斑块合成后的最终位图缓存。实测单块走完整管线 6.47ms、
     * 走缓存 0.004ms；素材加载风暴期间 repaintDecor 会被触发上百次，没有这层缓存
     * 就是开场卡顿的主因。
     */
    cache?: HTMLCanvasElement;
    cacheX?: number;
    cacheY?: number;
}

export class Scene13GroundPainter {
    /** 铺好底图（含高程抬升）的离屏画布；调用方每次重绘只 drawImage 一次 */
    terrain: HTMLCanvasElement | null = null;
    private terrainCtx: CanvasRenderingContext2D | null = null;
    private terrainImg: HTMLImageElement | null = null;
    private terrainTile = '';

    /** 等距网格原点与尺寸（与生成器 setupIsoGrid 同源） */
    isoOx = 0;
    isoOy = 0;
    isoGw = 0;
    isoGh = 0;
    /** 连续高程网格 [y][x]：0 平地，正数为平滑缓坡高度。 */
    elevGrid: number[][] = [];

    private elevQuads: Map<number, Path2D> | null = null;
    private elevQuadsReady = false;
    private darkCv: HTMLCanvasElement | null = null;
    private darkCtx: CanvasRenderingContext2D | null = null;
    private darkBlurCv: HTMLCanvasElement | null = null;
    private darkBlurCtx: CanvasRenderingContext2D | null = null;

    private lightCv: HTMLCanvasElement | null = null;
    private lightCtx: CanvasRenderingContext2D | null = null;
    private lightBlurCv: HTMLCanvasElement | null = null;
    private lightBlurCtx: CanvasRenderingContext2D | null = null;
    private elevCacheReady = false;

    private maskCv: HTMLCanvasElement | null = null;
    private maskCtx: CanvasRenderingContext2D | null = null;
    private blurCv: HTMLCanvasElement | null = null;
    private blurCtx: CanvasRenderingContext2D | null = null;
    private edgeCv: HTMLCanvasElement | null = null;
    private edgeCtx: CanvasRenderingContext2D | null = null;
    private noiseCv: HTMLCanvasElement | null = null;
    private noiseCtx: CanvasRenderingContext2D | null = null;
    private raggedTile: HTMLCanvasElement | null = null;
    private raggedTileSrc: HTMLCanvasElement | null = null;
    private blendCache: Record<string, HTMLCanvasElement | null> = {};

    /** 异步素材（地形贴图 / blend 遮罩）到货时通知调用方重绘 */
    private onNeedRepaint: () => void;

    constructor(onNeedRepaint: () => void = () => {}) {
        this.onNeedRepaint = onNeedRepaint;
    }

    /** 设网格与高程（换战场时调一次）；作废抬升几何与光照缓存 */
    setGrid(ox: number, oy: number, gw: number, gh: number, elevation: number[][]): void {
        this.isoOx = ox; this.isoOy = oy; this.isoGw = gw; this.isoGh = gh;
        this.elevGrid = elevation;
        this.elevQuadsReady = false;
        this.elevCacheReady = false;
    }

    /**
     * 加载 DE 地形贴图并铺地。start 时调一次，贴图 onload 时增量重铺。
     * 🔴 纯装饰，加载失败就露透明（真实地图兜底），绝不进 pending。
     */
    setTerrain(tile: string, width: number, height: number): void {
        if (!this.terrain) {
            this.terrain = document.createElement('canvas');
            this.terrainCtx = this.terrain.getContext('2d')!;
        }
        this.terrain.width = width;
        this.terrain.height = height;
        this.terrainTile = tile;
        this.terrainImg = null;
        this.paintTerrain();   // 立即清掉上一场残留的旧铺地（尺寸不变时 set width 不清内容）
        const im = new Image();
        im.onload = () => {
            this.terrainImg = im;
            this.paintTerrain();
            this.elevCacheReady = false;
            this.onNeedRepaint();
        };
        im.src = TERRAIN_BASE_URL + this.terrainTile + '.png';
    }

    /**
     * 把本场选中的那张 DE 地形贴图铺满整屏（统一一张，绝不混色块）。
     *
     * 🔴 [2026-08-20 主人定稿] 纯重复平铺，一行变换都不要：
     *   原尺寸 512 铺（不压 256）、不镜像、不旋转 —— createPattern('repeat') + fillRect。
     * 病根复盘：DE 地形贴图带整体光照渐变，镜像/旋转后相邻块的明暗方向对不上，
     *   块与块之间跳出一条条规则方格边界（主人截图实锤）。贴图本身无缝，
     *   纯重复铺接缝色差（13.94）反而低于旋转镜像（19.27）。
     * 重复感现在先不管：AoE2 原版也是同一张纹理重复铺，靠树/石/建筑打断视线；
     *   等 P1 接回 DE 树再看。若仍嫌单调，正确手段是叠一层极淡的大尺度低频噪声
     *   （柔和明暗斑块，尺度远大于 tile，无硬边），绝不再用旋转镜像。
     */
    paintTerrain(): void {
        const cv = this.terrain, g = this.terrainCtx;
        if (!cv || !g) return;
        g.clearRect(0, 0, cv.width, cv.height);
        const im = this.terrainImg;
        if (!im || !im.complete || !im.naturalWidth) return;
        const pat = g.createPattern(im, 'repeat');
        if (!pat) return;
        // 1. 平地基底：整屏铺满。网格外区域也有地，任何情况下不留洞。
        g.fillStyle = pat;
        g.fillRect(0, 0, cv.width, cv.height);
        // 2. 抬升地面（DE 2.5D）：逐「格高」分组裁剪成真实倾斜四边形，贴图随地面整体上移。
        //    坡面因此是实打实的斜四边形，士兵/树脚下有地，不再悬空。
        const groups = this.ensureElevQuads();
        if (!groups) return;
        for (const h of [...groups.keys()].sort((a, b) => a - b)) {
            if (h <= 0) continue; // h=0 的裙边格与基底同高，基底已铺
            const lift = h * ELEV_STEP_PX;
            g.save();
            g.clip(groups.get(h)!);
            g.translate(0, -lift);
            g.fillStyle = pat;
            g.fillRect(0, 0, cv.width, cv.height + lift);
            g.restore();
        }
    }

    /** 网格 (gx, gy) → 菱形中心屏幕坐标（2:1 等距投影） */
    isoCellX(gx: number, gy: number): number { return (gx - gy) * (TILE_W / 2) + this.isoOx; }

    isoCellY(gx: number, gy: number): number { return (gx + gy) * (TILE_H / 2) + this.isoOy; }

    /** 屏幕脚点采样连续高程；双线性插值消除单位跨格时的上下跳动。 */
    elevationAt(x: number, y: number): number {
        const gh = this.elevGrid.length;
        const gw = gh ? this.elevGrid[0].length : 0;
        if (!gw || !gh) return 0;
        const a = (x - this.isoOx) * 2 / TILE_W;
        const b = (y - this.isoOy) * 2 / TILE_H;
        const gx = (a + b) / 2;
        const gy = (b - a) / 2;
        const x0 = Math.floor(gx), y0 = Math.floor(gy);
        if (x0 < 0 || y0 < 0 || x0 >= gw || y0 >= gh) return 0;
        const x1 = Math.min(gw - 1, x0 + 1), y1 = Math.min(gh - 1, y0 + 1);
        const tx = gx - x0, ty = gy - y0;
        const h00 = this.elevGrid[y0][x0];
        const h10 = this.elevGrid[y0][x1];
        const h01 = this.elevGrid[y1][x0];
        const h11 = this.elevGrid[y1][x1];
        return (h00 * (1 - tx) + h10 * tx) * (1 - ty)
            + (h01 * (1 - tx) + h11 * tx) * ty;
    }

    elevationLiftAt(x: number, y: number): number {
        return this.elevationAt(x, y) * ELEV_STEP_PX;
    }

    /** 格 (gx,gy) 自身的整数高度抬升量（px）；斑块/地面贴花按格对齐用 */
    cellLift(gx: number, gy: number): number {
        const gh = this.elevGrid.length;
        const gw = gh ? this.elevGrid[0].length : 0;
        if (!gw || !gh) return 0;
        if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) return 0;
        return this.elevGrid[gy][gx] * ELEV_STEP_PX;
    }

    /**
     * 把高度场转成 DE 那样的真实倾斜四边形（一次性，缓存）。
     *
     * elevGrid 的高度采样在**格心**（elevationAt 就是按格心做双线性），所以菱形的四个角落在
     * 对偶网格的顶点上，顶点高度 = 周围四格的均值 —— 相邻两格共用同一顶点、算出同一个高度，
     * 因此拼出来的是**连续曲面**，格与格之间不会裂缝，同心台阶也被均值抹成真正的斜坡。
     *
     * 只收「四角有任一顶点高于 0」的格：纯平地区域走整屏平铺基底，省掉 ~70% 的裁剪面积。
     * 按格高分组是为了让贴图能整体上移一次就画完一组（Canvas 2D 没有逐四边形纹理映射，
     * 逐格 setTransform 会把开场时间拖垮）；组内坡面各角高度仍然各算各的，几何是准的。
     */
    private ensureElevQuads(): Map<number, Path2D> | null {
        if (this.elevQuadsReady) return this.elevQuads;
        this.elevQuadsReady = true;
        this.elevQuads = null;
        const gh = this.elevGrid.length;
        const gw = gh ? this.elevGrid[0].length : 0;
        if (!gw || !gh) return null;
        const cell = (x: number, y: number): number =>
            this.elevGrid[Math.max(0, Math.min(gh - 1, y))][Math.max(0, Math.min(gw - 1, x))];
        // 对偶网格顶点 (vx,vy) 位于格坐标 (vx-0.5, vy-0.5)，由四邻格取均值
        const vert = (vx: number, vy: number): number =>
            (cell(vx - 1, vy - 1) + cell(vx, vy - 1) + cell(vx - 1, vy) + cell(vx, vy)) * 0.25;

        const map = new Map<number, Path2D>();
        for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
                const vT = vert(x, y), vR = vert(x + 1, y), vB = vert(x + 1, y + 1), vL = vert(x, y + 1);
                if (vT <= 0 && vR <= 0 && vB <= 0 && vL <= 0) continue;
                const h = this.elevGrid[y][x];
                let path = map.get(h);
                if (!path) { path = new Path2D(); map.set(h, path); }
                const cx = this.isoCellX(x, y), cy = this.isoCellY(x, y);
                path.moveTo(cx, cy - TILE_H / 2 - vT * ELEV_STEP_PX);          // 上角
                path.lineTo(cx + TILE_W / 2, cy - vR * ELEV_STEP_PX);          // 右角
                path.lineTo(cx, cy + TILE_H / 2 - vB * ELEV_STEP_PX);          // 下角
                path.lineTo(cx - TILE_W / 2, cy - vL * ELEV_STEP_PX);          // 左角
                path.closePath();
            }
        }
        this.elevQuads = map.size ? map : null;
        return this.elevQuads;
    }

    /**
     * DE 式高程光照（Hillshade）。
     *
     * AoE2 DE 的地形不再是老 SLP 的斜坡切片，而是 512 无缝贴图 + 引擎按高度场法线实时打光：
     * 平地（不论海拔高低）一律中性，只有**坡面**才出现明暗——朝光的坡亮、背光的坡暗。
     * 这里照同一原理做：
     *   1. 由 elevGrid 取中心差分梯度 ∇h（每格一顶点）；
     *   2. 光源固定在屏幕左上（DE 同向）；背光方向在等距网格里 ≈ (0.95, 0.32)，
     *      ∇h·D > 0 = 迎光坡（提亮），< 0 = 背光坡（压暗）；
     *   3. 明暗值写进 gw×gh 的小图，再用等距仿射矩阵放大到全屏 —— 双线性插值天然给出
     *      Gouraud 平滑过渡，不会出现逐格菱形硬边（旧版「黑白脏色块」的病根）；
     *   4. 明暗图刷两遍：multiply 压暗背光面、screen 提亮迎光面，各自对另一侧天然中性 —— 
     *      线性调光，保留地表贴图的原色与颗粒，绝不糊成灰。
     *
     * elevGrid 静态，整套只算一次（elevCacheReady），之后每次 repaintDecor 只 drawImage。
     */
    paintShading(g: CanvasRenderingContext2D, W: number, H: number): void {
        const gh = this.elevGrid.length;
        const gw = gh ? this.elevGrid[0].length : 0;
        if (!gw || !gh || !W || !H) return;

        // 检查全场是否真正存在高地丘陵（海拔 > 0）
        let hasAnyElevation = false;
        for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
                if (this.elevGrid[y][x] > 0) {
                    hasAnyElevation = true;
                    break;
                }
            }
            if (hasAnyElevation) break;
        }
        if (!hasAnyElevation) return; // 平原地形直接退出，100% 保持底图纯净原色

        if (!this.darkCv) { this.darkCv = document.createElement('canvas'); this.darkCtx = this.darkCv.getContext('2d')!; }
        if (!this.darkBlurCv) { this.darkBlurCv = document.createElement('canvas'); this.darkBlurCtx = this.darkBlurCv.getContext('2d')!; }
        if (!this.lightCv) { this.lightCv = document.createElement('canvas'); this.lightCtx = this.lightCv.getContext('2d')!; }
        if (!this.lightBlurCv) { this.lightBlurCv = document.createElement('canvas'); this.lightBlurCtx = this.lightBlurCv.getContext('2d')!; }

        const dcv = this.darkCv, dctx = this.darkCtx!;
        const dbcv = this.darkBlurCv, dbctx = this.darkBlurCtx!;
        const lcv = this.lightCv, lctx = this.lightCtx!;
        const lbcv = this.lightBlurCv, lbctx = this.lightBlurCtx!;

        if (dcv.width !== W || dcv.height !== H) {
            dcv.width = W; dcv.height = H;
            dbcv.width = W; dbcv.height = H;
            lcv.width = W; lcv.height = H;
            lbcv.width = W; lbcv.height = H;
            this.elevCacheReady = false;
        }

        if (!this.elevCacheReady) {
            const profile = resolveBiomeLighting(this.terrainTile || 'gr2');

            // 1. 在网格尺度上计算局部山丘的梯度与受光面
            const darkSmall = document.createElement('canvas');
            darkSmall.width = gw; darkSmall.height = gh;
            const dsctx = darkSmall.getContext('2d')!;
            const darkId = dsctx.createImageData(gw, gh);
            const darkPx = darkId.data;

            const lightSmall = document.createElement('canvas');
            lightSmall.width = gw; lightSmall.height = gh;
            const lsctx = lightSmall.getContext('2d')!;
            const lightId = lsctx.createImageData(gw, gh);
            const lightPx = lightId.data;

            const at = (x: number, y: number): number =>
                this.elevGrid[Math.max(0, Math.min(gh - 1, y))][Math.max(0, Math.min(gw - 1, x))];

            let anyDark = false, anyLight = false;

            // 严格边界 Padding：四周 4 格绝对不绘制光影，杜绝任何全屏泄漏
            for (let y = 4; y < gh - 4; y++) {
                for (let x = 4; x < gw - 4; x++) {
                    const hCenter = at(x, y);
                    // 仅在真实山丘（hCenter > 0 或周围有起伏）的局部几何上产生光影
                    if (hCenter === 0 && at(x + 1, y) === 0 && at(x - 1, y) === 0 && at(x, y + 1) === 0 && at(x, y - 1) === 0) {
                        continue; // 平地严格透明
                    }

                    const dhx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
                    const dhy = (at(x, y + 1) - at(x, y - 1)) * 0.5;
                    const slopeMag = Math.sqrt(dhx * dhx + dhy * dhy);
                    if (slopeMag < 0.05) continue; // 平坦丘顶/基底平地不画光影

                    const s = dhx * ELEV_LIGHT_DIR_X + dhy * ELEV_LIGHT_DIR_Y;
                    const m = Math.min(1, Math.abs(s) * ELEV_LIGHT_K);
                    const i = (y * gw + x) * 4;

                    if (s < -0.02) {
                        // 背光坡面：应用当前 Biome 专属的深色漫反射阴影
                        darkPx[i] = profile.darkR;
                        darkPx[i + 1] = profile.darkG;
                        darkPx[i + 2] = profile.darkB;
                        darkPx[i + 3] = Math.round(m * profile.darkMaxAlpha * 255);
                        anyDark = true;
                    } else if (s > 0.02) {
                        // 迎光坡面：应用当前 Biome 专属的温暖日光受光
                        lightPx[i] = profile.lightR;
                        lightPx[i + 1] = profile.lightG;
                        lightPx[i + 2] = profile.lightB;
                        lightPx[i + 3] = Math.round(m * profile.lightMaxAlpha * 255);
                        anyLight = true;
                    }
                }
            }

            dsctx.putImageData(darkId, 0, 0);
            lsctx.putImageData(lightId, 0, 0);

            dctx.clearRect(0, 0, dcv.width, dcv.height);
            dbctx.clearRect(0, 0, dbcv.width, dbcv.height);
            lctx.clearRect(0, 0, lcv.width, lcv.height);
            lbctx.clearRect(0, 0, lbcv.width, lbcv.height);

            // 2. 阴影通道等距仿射放大与平滑羽化
            if (anyDark) {
                dctx.imageSmoothingEnabled = true;
                dctx.imageSmoothingQuality = 'high';
                dctx.setTransform(TILE_W / 2, TILE_H / 2, -TILE_W / 2, TILE_H / 2, this.isoOx, this.isoOy - TILE_H / 2);
                dctx.drawImage(darkSmall, 0, 0);
                dctx.setTransform(1, 0, 0, 1, 0, 0);

                dbctx.save();
                dbctx.filter = `blur(${ELEV_BLUR}px)`;
                dbctx.drawImage(dcv, 0, 0);
                dbctx.restore();
            }

            // 3. 高光通道等距仿射放大与平滑羽化
            if (anyLight) {
                lctx.imageSmoothingEnabled = true;
                lctx.imageSmoothingQuality = 'high';
                lctx.setTransform(TILE_W / 2, TILE_H / 2, -TILE_W / 2, TILE_H / 2, this.isoOx, this.isoOy - TILE_H / 2);
                lctx.drawImage(lightSmall, 0, 0);
                lctx.setTransform(1, 0, 0, 1, 0, 0);

                lbctx.save();
                lbctx.filter = `blur(${ELEV_BLUR}px)`;
                lbctx.drawImage(lcv, 0, 0);
                lbctx.restore();
            }

            this.elevCacheReady = true;
        }

        // 4. 双通道局部合成：multiply 压暗背光阴影，screen 提亮迎光高光
        g.save();
        if (this.darkBlurCv) {
            g.globalCompositeOperation = 'multiply';
            g.drawImage(this.darkBlurCv, 0, 0);
        }
        if (this.lightBlurCv) {
            g.globalCompositeOperation = 'screen';
            g.drawImage(this.lightBlurCv, 0, 0);
        }
        g.restore();
    }

    /** 懒加载 DE blends 咬合遮罩（按 BlendKind）；onload 后把灰度图转成「alpha=灰度」canvas 存缓存
     *  （白=不透明露目标地形、黑=透明露底下层、灰=半透明过渡），拉伸时 alpha 自动插值，免每斑块 getImageData。 */
    private blendFor(kind: BlendKind): HTMLCanvasElement | null {
        if (kind in this.blendCache) return this.blendCache[kind];
        const im = new Image();
        this.blendCache[kind] = null;
        im.onload = () => {
            const c = document.createElement('canvas');
            c.width = im.naturalWidth;
            c.height = im.naturalHeight;
            const cg = c.getContext('2d', { willReadFrequently: true })!;
            cg.drawImage(im, 0, 0);
            const id = cg.getImageData(0, 0, c.width, c.height);
            const da = id.data;
            for (let i = 0; i < da.length; i += 4) {
                da[i] = da[i + 1] = da[i + 2] = 255;
                da[i + 3] = da[i + 1]; // 灰度(G)→alpha：白不透明(目标地形)、黑透明(露底)、灰半透明(过渡)
            }
            cg.putImageData(id, 0, 0);
            this.blendCache[kind] = c;
            this.onNeedRepaint();
        };
        im.src = TERRAIN_BASE_URL + 'blends/' + kind + '.png';
        return null;
    }

    /** 把一块斑块羽化后合成：白形状 → 高斯模糊 → source-in 填纹理（边界软化、纹理清晰）。
     *  🔴 [2026-08-21 性能] mask/blur/fill/drawImage 全部限定斑块 bbox（+羽化余量），
     *    不再全屏操作——素材加载风暴时每个 onload 触发一次全量 repaintDecor，
     *    每个贴片全屏 blur(20px) 是进战斗卡顿主因之一。 */
    paintPatch(g: CanvasRenderingContext2D, p: GroundPatch, W: number, H: number): void {
        const img = p.img;
        if (!img || !img.complete || !img.naturalWidth) return;

        // 命中缓存：直接贴，跳过整条重算管线
        if (p.cache) {
            if (p.alpha < 1) g.globalAlpha = p.alpha;
            g.drawImage(p.cache, p.cacheX!, p.cacheY!);
            if (p.alpha < 1) g.globalAlpha = 1;
            return;
        }

        // 🔴 [彻底根除方块矩形切边] 高斯模糊羽化余量必须 ≥ 3 倍模糊半径 (3 × 24 = 72px)，
        //    确保模糊在到达离屏 canvas 四周边界前 100% 衰减为 0（绝对透明），绝不被 canvas 边框生硬截断！
        // 🔴 [2026-08-23 美化] 窄条带（水/滩）用 patch.blur 精确控制河岸软硬度：深水 8 / 浅水 12，避免变回整片高斯糊
        const blurRadius = p.blur ?? (p.polygon ? 16 : 24);
        const blurR = blurRadius * 3 + 16;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        if (p.polygon && p.polygon.length >= 3) {
            for (const pt of p.polygon) {
                if (pt.x < minX) minX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y > maxY) maxY = pt.y;
            }
        } else {
            for (const [gx, gy] of p.cells) {
                const sx = this.isoCellX(gx, gy), sy = this.isoCellY(gx, gy) - this.cellLift(gx, gy);
                if (sx - TILE_W / 2 < minX) minX = sx - TILE_W / 2;
                if (sy - TILE_H / 2 < minY) minY = sy - TILE_H / 2;
                if (sx + TILE_W / 2 > maxX) maxX = sx + TILE_W / 2;
                if (sy + TILE_H / 2 > maxY) maxY = sy + TILE_H / 2;
            }
        }
        if (!isFinite(minX)) return;
        const bx = Math.max(0, Math.floor(minX - blurR));
        const by = Math.max(0, Math.floor(minY - blurR));
        const bw = Math.min(W, Math.ceil(maxX + blurR)) - bx;
        const bh = Math.min(H, Math.ceil(maxY + blurR)) - by;
        if (bw <= 0 || bh <= 0) return;

        if (!this.maskCv) { this.maskCv = document.createElement('canvas'); this.maskCtx = this.maskCv.getContext('2d')!; }
        if (!this.blurCv) { this.blurCv = document.createElement('canvas'); this.blurCtx = this.blurCv.getContext('2d')!; }
        const mcv = this.maskCv, mctx = this.maskCtx!;
        const bcv = this.blurCv, bctx = this.blurCtx!;
        if (mcv.width !== bw || mcv.height !== bh) { mcv.width = bw; mcv.height = bh; bcv.width = bw; bcv.height = bh; }
        // 1. 白形状（斑块格，局部坐标）
        mctx.clearRect(0, 0, bw, bh);
        mctx.fillStyle = '#fff';
        if (p.polygon && p.polygon.length >= 3) {
            mctx.beginPath();
            mctx.moveTo(p.polygon[0].x - bx, p.polygon[0].y - by);
            for (let i = 1; i < p.polygon.length; i++) mctx.lineTo(p.polygon[i].x - bx, p.polygon[i].y - by);
            mctx.closePath();
            mctx.fill();
        } else {
            // DE 的地形斑块按格铺满（一格就是一格），边缘的参差交给下面 tile 级的咬合噪声，
            // 不靠把格子画成椭圆来「装有机」——椭圆并集反而会拼出一圈直棱长边。
            mctx.beginPath();
            for (const [gx, gy] of p.cells) {
                // 斑块必须跟着地面一起抬升，否则高地上的草/土斑会浮在坡面下方错位
                const sx = this.isoCellX(gx, gy) - bx, sy = this.isoCellY(gx, gy) - this.cellLift(gx, gy) - by;
                mctx.moveTo(sx, sy - TILE_H / 2);
                mctx.lineTo(sx + TILE_W / 2, sy);
                mctx.lineTo(sx, sy + TILE_H / 2);
                mctx.lineTo(sx - TILE_W / 2, sy);
                mctx.closePath();
            }
            mctx.fill();
        }
        // 2. 边缘处理
        const blendKind = blendForTile(p.tile);
        // 🔴 [2026-08-23 主人定] 道路与地基（isRoad 或 roadland 系列）边缘走高斯模糊（平顺硬化路面/地基），不做撕边与硬化切边。
        let ragged = false;
        if (!p.polygon && blendKind !== 'roadland' && !p.isRoad) {
            const bmask = this.blendFor(blendKind);
            if (bmask) {
                ragged = this.raggedEdgeMask(mcv, bw, bh, bmask, blurRadius);
            }
        }
        if (!ragged) {
            // 高斯模糊（polygon 斑块 / 道路 / 地基 / 无 blend 图时）：平滑软化边界，形成自然柔和的渐变羽化
            bctx.clearRect(0, 0, bw, bh);
            bctx.filter = `blur(${blurRadius}px)`;
            bctx.drawImage(mcv, 0, 0);
            bctx.filter = 'none';
        }
        // 3. source-in 填纹理（纹理只在最终遮罩形状内）
        bctx.globalCompositeOperation = 'source-in';
        const pat = bctx.createPattern(img, 'repeat');
        if (pat) {
            bctx.save();
            bctx.translate(-bx, -by);
            bctx.fillStyle = pat;
            bctx.fillRect(bx, by, bw, bh);
            bctx.restore();
        }
        bctx.globalCompositeOperation = 'source-over';
        // 4. 存缓存（bcv 是共享暂存画布，下一块斑块就会覆盖，必须拷出来）
        const cache = document.createElement('canvas');
        cache.width = bw; cache.height = bh;
        cache.getContext('2d')!.drawImage(bcv, 0, 0);
        p.cache = cache; p.cacheX = bx; p.cacheY = by;
        // 5. 合成到装饰层（只贴 bbox 区域）
        if (p.alpha < 1) g.globalAlpha = p.alpha;
        g.drawImage(cache, bx, by);
        if (p.alpha < 1) g.globalAlpha = 1;
    }

    /**
     * DE 式 tile 级撕边遮罩。
     *
     * 病根（2026-08-23 主人截图实锤）：blends/*.png 是 **单块 tile** 的咬合遮罩
     * （中心白、四边黑、内部带不规则缺口），DE 是**逐边界格**按 tile 尺寸用它。
     * 旧代码把这一张 512 遮罩**整张拉伸盖住整个斑块包围盒** —— 于是整块斑块的轮廓
     * 直接变成了那张遮罩本身的形状：一个带缺口的大圆饼，边缘是几条长直棱边。
     *
     * 这里改回 DE 尺度：
     *   D = 硬菱形并集做高斯 → 到边界的距离场（0..1）；
     *   N = blend 遮罩按 2×2 tile（128×64）平铺出来的咬合噪声（0..1）；
     *   alpha = clamp((D - 0.5 + (N - 0.5) × RAG) × HARD + 0.5)
     * N 在 D 的等值线上做 ±RAG/2 的推拉，把一条平滑边界撕成 tile 尺度的犬牙参差；
     * 内部 D=1、外部 D=0 不受影响，所以只有边缘变碎，斑块主体依旧实心。
     *
     * 返回 false 表示没做（调用方回退高斯模糊）。
     */
    private raggedEdgeMask(
        mcv: HTMLCanvasElement,
        bw: number,
        bh: number,
        bmask: HTMLCanvasElement,
        blurRadius: number,
    ): boolean {
        const bctx = this.blurCtx;
        if (!bctx) return false;
        if (!this.edgeCv) {
            this.edgeCv = document.createElement('canvas');
            // 逐像素读回：必须带 willReadFrequently，否则每块斑块都触发一次 GPU→CPU 回读
            this.edgeCtx = this.edgeCv.getContext('2d', { willReadFrequently: true });
            this.noiseCv = document.createElement('canvas');
            this.noiseCtx = this.noiseCv.getContext('2d', { willReadFrequently: true });
        }
        const ecv = this.edgeCv!, ectx = this.edgeCtx;
        const ncv = this.noiseCv!, nctx = this.noiseCtx;
        if (!ectx || !nctx) return false;
        if (ecv.width !== bw || ecv.height !== bh) {
            ecv.width = bw; ecv.height = bh;
            ncv.width = bw; ncv.height = bh;
        }

        // D：硬菱形并集 → 高斯 → 距离场。羽化半径直接决定撕边能推多远：
        // 距离场越宽，同样的噪声幅度换算成的像素位移越大（实测 blur 12 只能推 ±6px，看不出来；
        // blur 26 推 ±13px，正好是半格，撕出 DE 那种格尺度的犬牙边）。
        const soft = Math.max(12, blurRadius * 1.1);
        ectx.setTransform(1, 0, 0, 1, 0, 0);
        ectx.clearRect(0, 0, bw, bh);
        ectx.filter = `blur(${soft}px)`;
        ectx.drawImage(mcv, 0, 0);
        ectx.filter = 'none';

        // N：blend 遮罩按 **一格** 平铺 —— 这就是 DE 用这张图的原始尺度
        if (!this.raggedTile) {
            const t = document.createElement('canvas');
            t.width = TILE_W; t.height = TILE_H;
            const tg = t.getContext('2d')!;
            tg.drawImage(bmask, 0, 0, t.width, t.height);
            this.raggedTile = t;
            this.raggedTileSrc = bmask;
        } else if (this.raggedTileSrc !== bmask) {
            const tg = this.raggedTile.getContext('2d')!;
            tg.clearRect(0, 0, this.raggedTile.width, this.raggedTile.height);
            tg.drawImage(bmask, 0, 0, this.raggedTile.width, this.raggedTile.height);
            this.raggedTileSrc = bmask;
        }
        const npat = nctx.createPattern(this.raggedTile, 'repeat');
        if (!npat) return false;
        nctx.setTransform(1, 0, 0, 1, 0, 0);
        nctx.clearRect(0, 0, bw, bh);
        nctx.fillStyle = npat;
        nctx.fillRect(0, 0, bw, bh);

        const dImg = ectx.getImageData(0, 0, bw, bh);
        const nImg = nctx.getImageData(0, 0, bw, bh);
        const dd = dImg.data, nd = nImg.data;
        for (let i = 3; i < dd.length; i += 4) {
            const D = dd[i] / 255;
            const N = nd[i] / 255;
            // 只在边界带（D≈0.5）让噪声起作用：内部 D=1 / 外部 D=0 处权重归零，
            // 否则噪声会把斑块内部一起削成半透明（实测半透明像素从 1130 暴涨到 103521）。
            const w = 4 * D * (1 - D);
            let a = (D - 0.5 + (N - 0.5) * PATCH_EDGE_RAGGED * w) * PATCH_EDGE_HARDNESS + 0.5;
            a = a < 0 ? 0 : a > 1 ? 1 : a;
            dd[i - 3] = dd[i - 2] = dd[i - 1] = 255;
            dd[i] = (a * 255) | 0;
        }
        bctx.setTransform(1, 0, 0, 1, 0, 0);
        bctx.globalCompositeOperation = 'source-over';
        bctx.clearRect(0, 0, bw, bh);
        bctx.putImageData(dImg, 0, 0);
        return true;
    }
}
