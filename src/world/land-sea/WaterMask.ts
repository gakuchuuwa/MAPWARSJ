/**
 * 水域掩膜 — 唯一的「这里是不是水」判据
 *
 * ## 为什么不用海拔
 *
 * 高程图记录的是「地面多高」，它并不知道哪里有水。用「海拔 < 0 就是海」去反推水域，
 * 遇到**低于海平面的陆地**必然出错。实测（2026-07-28，z9 精度，以 ESRI 底图为准）：
 *
 *   伊蒂尔(里海低地)  -27m → 旧规则判「海」，实为陆（骑兵在此显示成船）
 *   吐鲁番/高昌       -51m → 旧规则判「海」，实为陆
 *   东营沿海          -20m → 旧规则判「海」，实为陆
 *
 * 里海是内流湖，湖面本身就在 -28m，整片里海低地都在 0m 以下；吐鲁番盆地最低 -154m。
 * 里海区域 12000 点抽样，旧规则正确率仅 71.0%。
 *
 * 曾考虑过「按盆地列一张局部海平面表」，被否决：那是硬编码，漏一个盆地就再犯一次错。
 *
 * ## 改用什么
 *
 * ESRI World_Shaded_Relief 底图把真实水体渲染成蓝色。RiverOverlayLayer 早就在用这一点
 * 画河流和海岸线描边——**描边画得出来，就说明它已经知道每个像素是水是陆**。
 * 本模块把那条判据抽出来共用，让「画出来的描边」和「游戏里的海陆判定」永远一致。
 *
 * z9 精度抽查 20 处：真海（渤海/黄海/东海/南海/台湾海峡/日本海/濑户内海/长江口/里海深水）
 * 与陆地（长安/洛阳/敦煌/黄河三角洲/盐城/伊蒂尔/吐鲁番）全部判对。
 *
 * 注：曾以 z6 粗网格扫出「渤海湾误判」，那是 2.4km/格 把海岸线的海与陆混进同一格造成的
 * 假象，z9 下不存在——别再拿那个结论下判断。
 */

/** ESRI 晕渲底图；与 RiverOverlayLayer 同一份瓦片，故浏览器 HTTP 缓存可直接复用 */
export const ESRI_SHADED_RELIEF_URL =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';

/**
 * 单像素判水：蓝色显著占优。
 *
 * 阈值沿用 RiverWorker 2026-07-27 调校后的值，不要单独改这里——
 * 改了会让海岸线描边和海陆判定对不上。
 */
export function isWaterPixel(r: number, g: number, b: number): boolean {
    const brightness = (r + g + b) / 3;
    const blueDominance = b - Math.max(r, g);
    return (
        b > r + 20 &&
        b > g + 16 &&
        blueDominance > 15 &&
        b > 95 &&
        brightness > 60 &&
        brightness < 215 &&
        (r < 245 || g < 245 || b < 245)
    );
}

/**
 * ESRI 缓存烤坏的瓦片：整块返回纯灰 rgb(51,52,54)，陆地海面一律如此。
 * 实测 2026-07-19（见 RiverOverlayLayer 同名注释）：World_Shaded_Relief 在**仅 zoom 10**
 * 的北海道及其东侧海面整块如此，同地点 z9/z11 正常，属该级瓦片缓存没烤出来。
 *
 * 纯灰不满足判蓝条件 ⇒ 会被当成「整块都是陆地」。若拿这种掩膜去改上色，
 * 那片海会被刷成陆地色；去判海陆，则海面变成可行军的陆地。必须识别出来并弃用。
 */
const DEFECT_GRAY: readonly [number, number, number] = [51, 52, 54];
const DEFECT_TOLERANCE = 6;

/** 是否整块都是缺陷灰。抽 8×8 网格，任一点不符即否——正常晕渲图必有纹理，误判概率极低 */
export function isDefectGrayTile(
    rgba: Uint8ClampedArray,
    width: number,
    height: number,
): boolean {
    const [gr, gg, gb] = DEFECT_GRAY;
    for (let sy = 0; sy < 8; sy++) {
        for (let sx = 0; sx < 8; sx++) {
            const px = Math.min(width - 1, Math.floor(((sx + 0.5) * width) / 8));
            const py = Math.min(height - 1, Math.floor(((sy + 0.5) * height) / 8));
            const i = (py * width + px) * 4;
            if (
                Math.abs(rgba[i] - gr) > DEFECT_TOLERANCE ||
                Math.abs(rgba[i + 1] - gg) > DEFECT_TOLERANCE ||
                Math.abs(rgba[i + 2] - gb) > DEFECT_TOLERANCE
            ) {
                return false;
            }
        }
    }
    return true;
}

/** 整块 RGBA 像素 → 每像素 1 字节的水域掩膜（1=水） */
export function buildWaterMask(rgba: Uint8ClampedArray, pixelCount: number): Uint8Array {
    const mask = new Uint8Array(pixelCount);
    for (let i = 0, p = 0; p < pixelCount; i += 4, p++) {
        if (isWaterPixel(rgba[i], rgba[i + 1], rgba[i + 2])) mask[p] = 1;
    }
    return mask;
}
