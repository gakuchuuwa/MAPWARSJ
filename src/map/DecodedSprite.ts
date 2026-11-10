/**
 * 画布精灵图的「常驻已解码位图」。
 *
 * 🔴 [2026-11-10 修「战略地图移动掉帧」] 画布 drawImage(HTMLImageElement) 的解码结果放在浏览器的
 *    可丢弃缓存里：系统内存吃紧时（主人机器 16GB、常驻开发工具已占二十多 GB）用完即丢，
 *    下一帧同一张图再解码、再上传显卡。真显卡时间线实测：7 秒内主线程「Decode Image」1927～3978 次、
 *    占 1.9～4 秒，Commit 每帧 12～109ms；换成 ImageBitmap 后主线程解码归零，Commit 降到 8ms。
 *    植被 / 陆地动物 / 据点民生三层是每帧都画的精灵图，全走这里。
 *
 * 用法：`ctx.drawImage(drawableOf(img), ...)`。位图没备好之前原样返回 img（画面不空）；
 *      尺寸仍从 img.naturalWidth 读。素材淘汰时调 releaseDrawable(img) 立刻还内存。
 */
type Entry = ImageBitmap | 'pending' | 'failed';
const BITMAPS = new WeakMap<HTMLImageElement, Entry>();

export function drawableOf(img: HTMLImageElement): HTMLImageElement | ImageBitmap {
    // DEV 对照开关：window.__noDecodedSprite = true 退回直接画原图（量前后差别用）
    if (import.meta.env.DEV && (window as unknown as { __noDecodedSprite?: boolean }).__noDecodedSprite) return img;
    const hit = BITMAPS.get(img);
    if (hit !== undefined) return typeof hit === 'string' ? img : hit;
    if (!img.complete || img.naturalWidth === 0 || typeof createImageBitmap !== 'function') return img;
    BITMAPS.set(img, 'pending');
    const src = img.src;
    createImageBitmap(img).then(
        (bm) => {
            // 等位图期间这张图被换了地址（加载失败改用备用图）或已被淘汰 → 作废重来
            if (img.src !== src || BITMAPS.get(img) !== 'pending') { bm.close(); if (BITMAPS.get(img) === 'pending') BITMAPS.delete(img); return; }
            BITMAPS.set(img, bm);
        },
        () => { if (BITMAPS.get(img) === 'pending') BITMAPS.set(img, 'failed'); },
    );
    return img;
}

export function releaseDrawable(img: HTMLImageElement | null | undefined): void {
    if (!img) return;
    const hit = BITMAPS.get(img);
    if (hit && typeof hit !== 'string') hit.close();
    BITMAPS.delete(img);
}
