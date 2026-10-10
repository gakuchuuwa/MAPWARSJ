/**
 * 骨架 → RealGeoPlan（**纯模块**，结构与 src/ui/scene13/Scene13RealGeography.ts 的 RealGeoPlan 对齐）。
 * 输入：解码后的骨架 { levels, water, header }；输出：{ deep, shallow, sand, isWater(x,y), elevation, hasSea, waterCells, reliefM, raisedCells }
 * 坐标：新地图中心对齐屏幕中心、x/y 对调（AA 第 94 轮那套）；`screenFromCell(cx,cy,dx,dy,offX)` 给出换算。
 */
import { CELLS, isWaterAt } from './bakeFormat.mjs';
export function buildRealGeoPlan(sk /*, 仅用骨架；屏幕坐标由调用方注入 */) {
  const water = sk.water, lv = sk.levels;
  const W = (x, y) => (x < 0 || y < 0 || x >= CELLS || y >= CELLS) ? false : isWaterAt(water, y * CELLS + x);
  const deep = [], shallow = [], sand = [];
  let waterCells = 0, raisedCells = 0, reliefM = 0;
  const elevation = [];
  for (let y = 0; y < CELLS; y++) { const row = []; for (let x = 0; x < CELLS; x++) {
    const w = W(x, y), i = y * CELLS + x;
    const nearLand = !w && (W(x - 1, y) || W(x + 1, y) || W(x, y - 1) || W(x, y + 1));
    const nearWater = w && (W(x - 1, y) || W(x + 1, y) || W(x, y - 1) || W(x, y + 1));
    const edgeWater = w && (!W(x - 1, y) || !W(x + 1, y) || !W(x, y - 1) || !W(x, y + 1));
    if (w) { waterCells++; (edgeWater && !nearWater) ? shallow.push([x, y]) : (edgeWater ? shallow.push([x, y]) : deep.push([x, y])); }
    if (nearLand) sand.push([x, y]);
    const h3 = lv[i] === 0 ? 0 : (lv[i] <= 2 ? 1 : (lv[i] <= 4 ? 2 : 3));
    row.push(h3); if (h3 > 0) raisedCells++;
  } elevation.push(row); }
  reliefM = (sk.header?.hmax ?? 0) - (sk.header?.hmin ?? 0);
  return { deep, shallow, sand, isWater: (x, y) => W(x, y), elevation, hasSea: waterCells > 0, waterCells, reliefM, raisedCells };
}

/** 屏幕坐标 → 格：**本模块不自己写这套公式**（只许一份，游戏里传 AA 的 Scene13GroundLayerGL 那一个）。
 *  用法：`buildScreenIndex(plan, screenToCell)` → `isWaterOnScreen(x,y)`。
 *  @param screenToCell (x,y) => { gx, gy } | null   由调用方注入（地面层同一份实现） */
export function buildScreenIndex(plan, screenToCell) {
  return {
    isWaterOnScreen(x, y) { const c = screenToCell(x, y); if (!c) return false; return plan.isWater(Math.round(c.gx), Math.round(c.gy)); },
    sandOnScreen(x, y) { const c = screenToCell(x, y); if (!c) return false; return plan.isWater(Math.round(c.gx), Math.round(c.gy)); },
  };
}