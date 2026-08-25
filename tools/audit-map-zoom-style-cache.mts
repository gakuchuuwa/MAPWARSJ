/**
 * 战略地图缩放时「样式重设」的缓存口径验收（防回归）。
 *
 * 🔴 [2026-08-25 起因：主人报「战略地图也卡」]
 *
 *    定位全靠 scratch/zoom_perf_log.jsonl 里已有的 19926 次缩放采样（探针 2026-07-26 起就在记）：
 *      · 最近 3000 次里，监听器耗时第一名是河流层的 zoomend：724982ms / 2980 次 = **243ms/次**
 *      · 第二名 Leaflet Renderer._onZoomEnd（矢量重投影）464285ms / 1641 次 = 283ms/次
 *      · 最长帧中位数从 08-14 的 257ms 涨到 08-25 的 564ms，翻倍
 *
 *    第一名是**纯白花**：样式只按 getScaleMultiplier 分 4 档
 *    （≤7→0.5 / 8~9→1.0 / 10~11→1.5 / ≥12→2.0），而缓存按**具体 zoom 值**判。
 *    ZoomController 行军 8↔9、战斗 10↔11 每十几秒切一次档，两边样式一模一样，
 *    却每次都全量 setStyle 约 2910 条 path。领土层 updateTerritoryStyle 是同一个毛病
 *    （样式只有 strategic/border/hidden 三档，缓存却按 floorZoom 判，10↔11 白刷）。
 *
 *    ⚠️ 第二名（283ms 重投影）是**真实工作**不是白花，要动得换 Canvas renderer，风险大，未做。
 *    ⚠️ 7-28 记忆里「河流只有 42.9% 落在可玩范围、裁掉能省一半」这条**已经过期**：
 *      城池范围那时是 lat 11.7~53.4，现在是 lat -37.7~59.9 / lng -99.1~144.3（953 座，扩到美洲）。
 *      实测按城池 bbox 裁剪只省 12~19% 顶点，不划算。别再照抄那个旧数字。
 *
 * 跑法：npx tsx tools/audit-map-zoom-style-cache.mts
 */
import { readFileSync } from 'node:fs';

let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

// ── 河流层 ──
const RIV = readFileSync('src/map/VectorRiverLayer.ts', 'utf8');
console.log('河流层 VectorRiverLayer.updateStyle：');

const upd = /public updateStyle\([\s\S]*?\n    \}/.exec(RIV)?.[0] ?? '';
if (!upd) bad('找不到 updateStyle（结构变了，先看代码再改这个脚本）');
else {
    if (/if \(this\.lastStyledZoom === zoom\) return/.test(upd)) {
        bad('缓存又按 zoom 值判了 —— 8↔9 / 10↔11 切档会白刷 2910 条 path（243ms/次）');
    } else ok('不再按 zoom 值缓存');
    if (!/this\.lastStyledMult === mult/.test(upd)) {
        bad('没有按档位（getScaleMultiplier）缓存');
    } else ok('按档位（getScaleMultiplier）缓存');
}

// 档位表本身：证明 8/9 与 10/11 确实同档（白花的前提）
const mulFn = /private static getScaleMultiplier\([\s\S]*?\n    \}/.exec(RIV)?.[0] ?? '';
const mult = (z: number): number => {
    if (/zoom >= 12\) return 2\.0/.test(mulFn) && z >= 12) return 2.0;
    if (/zoom >= 10\) return 1\.5/.test(mulFn) && z >= 10) return 1.5;
    if (/zoom <= 7\) return 0\.5/.test(mulFn) && z <= 7) return 0.5;
    return 1.0;
};
if (mult(8) === mult(9) && mult(10) === mult(11)) {
    ok(`档位表确认：zoom 8/9 同为 ${mult(8)}，10/11 同为 ${mult(10)} —— 这两对切档本就不该重设样式`);
} else {
    console.log(`  ⚪ 档位表变了（8→${mult(8)} 9→${mult(9)} 10→${mult(10)} 11→${mult(11)}），`);
    console.log('     若 8/9 或 10/11 不再同档，按档位缓存依然正确，只是省下的没那么多。');
}

// ── 领土层 ──
const TER = readFileSync('src/systems/TerritorySystem.ts', 'utf8');
console.log('\n领土层 TerritorySystem.updateTerritoryStyle：');
const ter = /private updateTerritoryStyle\([\s\S]*?\n    \}/.exec(TER)?.[0] ?? '';
if (!ter) bad('找不到 updateTerritoryStyle');
else {
    if (/this\.lastStyledTerritoryFloorZoom === floorZoom\) return/.test(ter)) {
        bad('缓存又按 floorZoom 判了 —— 10↔11 都是 isHidden、样式相同，会白刷全部领土多边形');
    } else ok('不再按 floorZoom 缓存');
    if (!/this\.lastTerritoryStyleKey === styleKey/.test(ter)) {
        bad('没有按样式档（strategic/border/hidden）缓存');
    } else ok('按样式档（strategic/border/hidden）缓存');
    if (!/force/.test(ter)) bad('丢了 force 参数 —— 图层重新挂载后 DOM 被 Leaflet 重置，必须能强刷');
    else ok('保留 force 强刷（重新挂载后补样式）');
}

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
