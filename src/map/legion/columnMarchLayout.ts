/**
 * 剧本模式行军纵队的纯计算：沿轨迹排位 + 每人朝向。
 * 从 LegionPhalanxDrawer.columnOffsets 拆出来，离线测试可直接加载（绘制器依赖 Web Worker，Node 里加载不了）。
 * 验收：npx tsx scratch/_column_dir_flicker.mts
 */
import { OrientationSystem } from '../../core/OrientationSystem';

/** 朝向换档死区（度）：角度要越过扇区边界再多这么多才换档 */
const DIR_DEAD_ZONE_DEG = 15;

/**
 * @param pts   轨迹投影后的屏幕折线（相对军团中心，[0] = 头）
 * @param dists 每个人离头多远（像素），与返回数组一一对应
 * @param gap   纵队里前后两人的间距（像素），也是取朝向的弦长半径
 * @param prevDirs 上一帧各人的朝向（8 向）；null = 第一帧
 */
export function layoutColumn(
    pts: { x: number; y: number }[],
    dists: number[],
    gap: number,
    prevDirs: readonly number[] | null,
): { targets: { x: number; y: number }[]; dirs: number[] } {
    const cum = [0];
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
    // 最老一段的前进方向（轨迹不够长时往后直线延伸用）；太短的段往前找一段够长的
    let tx = 1, ty = 0;
    for (let k = pts.length - 1; k >= 1; k--) {
        const fx = pts[k - 1].x - pts[k].x, fy = pts[k - 1].y - pts[k].y;
        const len = Math.hypot(fx, fy);
        if (len > 1e-3) { tx = fx / len; ty = fy / len; break; }
    }
    /** 轨迹上距头 d 像素的点 */
    const at = (d: number): { x: number; y: number } => {
        if (d <= 0) return { x: pts[0].x, y: pts[0].y };
        for (let k = 1; k < pts.length; k++) {
            if (cum[k] >= d) {
                const segLen = Math.max(1e-6, cum[k] - cum[k - 1]);
                const t = (d - cum[k - 1]) / segLen;
                const a = pts[k - 1], b = pts[k];
                return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
            }
        }
        const b = pts[pts.length - 1];
        const extra = d - cum[cum.length - 1];
        return { x: b.x - tx * extra, y: b.y - ty * extra };
    };
    const targets: { x: number; y: number }[] = [];
    const dirs: number[] = [];
    dists.forEach((d, i) => {
        targets.push(at(d));
        // 朝向取「身后一个兵距 → 身前一个兵距」的弦：路网折线的小锯齿、1 公里一个的脚印交界都被平均掉
        const ahead = at(d - gap), behind = at(d + gap);
        const fx = ahead.x - behind.x, fy = ahead.y - behind.y;
        const prev = prevDirs?.[i];
        if (Math.hypot(fx, fy) < 1e-3) { dirs.push(prev ?? 1); return; }
        const ang = Math.atan2(-fy, fx) * 180 / Math.PI;   // 屏幕 y 向下 → 数学角取 -fy
        dirs.push(prev === undefined
            ? OrientationSystem.get8DirectionFromAngle(ang)
            : OrientationSystem.get8DirectionWithHysteresis(prev, ang, DIR_DEAD_ZONE_DEG));
    });
    return { targets, dirs };
}
