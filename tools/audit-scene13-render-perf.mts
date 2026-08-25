/**
 * 13 每帧渲染开销的结构性验收（防回归）。
 *
 * 🔴 [2026-08-25 起因：主人报「战斗模式有点卡」]
 *
 *    定位过程全靠 scratch/scene13_probe_log.jsonl 里已有的 986 局实测数据，没靠观感：
 *      · 13 自己的 step+render 中位只有 4.09ms（预算 16.7ms），**稳态不是它慢**
 *      · fps 跟场上精灵数几乎无关（0~100 人 50.4fps vs 400+ 人 45.5fps）
 *      · fps 中位数在 **2026-08-21 当天** 从 51.2 掉到 31.9，场上人数没变
 *      · 同一天 `renderDynamicWater` 被加进来；加入前 fps<35 占 22.7%，加入后 **49.3%**
 *
 *    该函数改前有三处纯浪费（与水面 patch 数量无关，纯属该省的没省）：
 *      ① createPattern 每帧每 patch 重建（源图整局不变）
 *      ② 两次 pattern fillRect 用**整张画布**尺寸（4K 下 3828×1911）
 *      ③ 水色增强 fillRect(0,0,canvas.width,canvas.height) 纯色铺满全屏
 *    每个水面 patch 每帧 3 次全画布填充，而 isWater 是按贴图判的
 *    （湿地 sh4 / 沼泽 qs2 的地表变体小斑块统统算水），一局能有一堆。
 *
 * 跑法：npx tsx tools/audit-scene13-render-perf.mts
 */
import { readFileSync } from 'node:fs';

const SRC = readFileSync('src/ui/Scene13WarLayer.ts', 'utf8');
let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

// 取出 renderDynamicWater 函数体
const body = /private renderDynamicWater\([\s\S]*?\n    \}/.exec(SRC)?.[0] ?? '';

console.log('动态水面（每帧最贵的一块）：');
if (!body) bad('找不到 renderDynamicWater（结构变了，先看代码再改这个脚本）');
else {
    // ① pattern 必须缓存
    if (!/waterPatternCache\.get\(img\)/.test(body)) {
        bad('createPattern 没走缓存 —— 源图整局不变，每帧每 patch 重建是白扔');
    } else ok('pattern 按 img 缓存（不再每帧重建）');

    // ② fillRect 不得再用整张画布尺寸（唯一允许的是 bbox 算不出时的兜底那一行）
    const fills = body.match(/ctx\.fillRect\([^)]*\)/g) ?? [];
    const fullCanvas = fills.filter((f) => /ctx\.canvas\.(width|height)/.test(f));
    if (fullCanvas.length > 0) {
        bad(`还有 ${fullCanvas.length} 处 fillRect 按整张画布铺：${fullCanvas.join(' / ')}`);
    } else ok(`${fills.length} 处 fillRect 全部收窄到 patch 包围盒`);

    // ③ 必须有 bbox 兜底（算不出时退回全画布，宁可慢也不能漏画）
    if (!/waterBBoxOf\(p\) \?\? \{ x: 0, y: 0, w: ctx\.canvas\.width/.test(body)) {
        bad('bbox 没有兜底 —— 算不出包围盒时会漏画水面');
    } else ok('bbox 算不出时退回全画布（不会漏画）');
}

console.log('\n包围盒来源：');
// ④ 必须自己算，不能改成给 p.bbox 赋值（那会把死掉的涉水涟漪连带复活）
if (/private waterBBoxOf/.test(SRC) && /waterBBoxCache/.test(SRC)) {
    ok('renderDynamicWater 自己算并缓存 bbox（不碰 patch.bbox 字段）');
} else bad('waterBBoxOf/waterBBoxCache 不见了');

// ⑤ 提醒：p.bbox 至今无人赋值 → renderWadingRipples 是死代码。
//    这里只报告不判失败：复活与否是主人的决定，不是脚本该管的。
const assigns = /\bbbox\s*[:=]\s*\{/.test(SRC.replace(/waterBBoxCache[\s\S]{0,200}/g, ''));
const ripple = /filter\(\(p\) => p\.isWater && p\.bbox\)/.test(SRC);
if (ripple && !assigns) {
    console.log('  ⚪ 提醒：`p.bbox` 全项目仍无人赋值 → renderWadingRipples（涉水涟漪，2026-08-22 加）');
    console.log('     的 filter 恒为空，**从没显示过**。要复活请主人明确要求（会多一层每帧 O(men) 椭圆描边）。');
}

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
