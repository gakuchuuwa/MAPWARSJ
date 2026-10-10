/**
 * 出兵点计算（纯模块）—— 规则见 docs/02-design/战术模式-DE地图与玩法设计.md 第八节（主人 2026-10-10 定）
 *
 * 设计值（**主人 2026-10-11 定**）：
 *   SPAWN_GAP_PX                    = 1400  双方相对来处时基地相距的**屏幕距离**（px）⇒ 每边离中心 700
 *   CENTER_BAND_DIST_FROM_CENTER_PX =  252  守方改到"中心一带"时离中心的屏幕距离（＝同比例 0.36 倍）
 * 🔴 为什么按屏幕距离、不再按格半径（本次改动的原因）：
 *   等轴投影 1 格 = 32×16 px（横竖 2:1），旧口径「格半径 1/3」在屏幕上横竖差一倍 ——
 *   实测南北对进双方只隔 928 px、东西对进隔 1856 px，同一个设计值下八个方向的行军时长差一倍。
 *   改按屏幕距离后：**相对来处的两方**（南北/东西/斜向对进）基地一律相距 1400 px（步兵 vs 步兵约 15 秒接敌），
 *   间距只由**双方来处的夹角**决定，不再随这对方向在地图上的朝向而变（垂直来处自然＝700√2≈990 px）。
 * 规则：
 *   ① 方位角由「战场中心 → 该军在战略地图上的来处」算出，归到八方向；
 *   ② 野战：双方各从自己来处方向出现；攻城战：攻方从来的方向，**守方在中心**；
 *   ③ 双方同向或相邻方向 ⇒ 守方改到中心一带，攻方从边上进；
 *   ④ 出生点落在水或悬崖 ⇒ 沿该方向的弧线滑到最近可走陆地；整条边是水 ⇒ 从最近可走的边进。
 *      🔴 陆战口径下（`LAND_WAR_ALL_PASSABLE = true`，主人 2026-10-11 令）**本规则不触发**：
 *         水、树林、建筑、悬崖一律可通行，默认判定只挡出图；将来要做地形阻挡时把该常量置 false。
 * 坐标：模块内算出的是**屏幕距离**，输出仍是 **DE 格坐标**（x 向东、y 向北）——
 *   换算与 `Scene13GroundLayerGL.cellToScreen` 同一式，且**不取整**，调用方按同一式换算回去就是原像素点。
 */
export const VERSION_SPAWN = 1;
/** 双方**相对**来处（南北/东西/斜向对进）时基地相距的屏幕距离（px）—— 主人 2026-10-11 定 1400 */
export const SPAWN_GAP_PX = 1400;
/** 出生点离中心的屏幕距离（px，八方向统一）＝ 对进间距的一半（700） */
export const SPAWN_DIST_FROM_CENTER_PX = SPAWN_GAP_PX / 2;
/** 双方同向/相邻时守方改到「中心一带」的距离（px）＝同比例 0.36 倍（旧 0.12 ÷ 0.3333）＝ 252 */
export const CENTER_BAND_DIST_FROM_CENTER_PX = SPAWN_DIST_FROM_CENTER_PX * 0.36;
/** 格 ⇄ 屏幕系数：与 `Scene13GroundLayerGL.cellToScreen` 同一式（`dx = 32, dy = 16`） */
const DX = 32, DY = 16;
/** 🔴 主人 2026-10-11 令：**新战术模式先只做陆战——水、树林、建筑一律可通行，不许设计不可通行区域**。
 *  开启时默认 walkable 恒为 true（滑弧只会被调用方显式传入的 walkableAt 触发）；将来要做地形阻挡时置 false 即可。 */
export const LAND_WAR_ALL_PASSABLE = true;
const DIRS8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** 经纬度 → 八方向（从战场中心指向来处） */
export function bearing8(lat0, lng0, lat1, lng1) {
  const dN = (lat1 - lat0) * 111320;
  const dE = (lng1 - lng0) * 111320 * Math.cos((lat0 * Math.PI) / 180);
  const deg = (Math.atan2(dE, dN) * 180 / Math.PI + 360) % 360;   // 0=北，顺时针
  const idx = Math.round(deg / 45) % 8;
  return { dir: DIRS8[idx], deg: +deg.toFixed(1), idx };
}
const adjacent = (a, b) => { const d = Math.abs(a - b) % 8; return d === 0 || d === 1 || d === 7; };
const S2 = Math.SQRT1_2;
/** 八方向 → **屏幕**单位向量（x 向右、y 向下；北 N = (0,-1) 画面正上、东 E = (1,0) 画面正右） */
const unitOf = (idx) => [
  [0, -1],    // 0: N  (画面正上)
  [S2, -S2],  // 1: NE (画面右上)
  [1, 0],     // 2: E  (画面正右)
  [S2, S2],   // 3: SE (画面右下)
  [0, 1],     // 4: S  (画面正下)
  [-S2, S2],  // 5: SW (画面左下)
  [-1, 0],    // 6: W  (画面正左)
  [-S2, -S2], // 7: NW (画面左上)
][idx];
/** 相对中心的屏幕偏移 (dX,dY) → DE 格坐标（`cellToScreen` 的逆式；**不取整**，
 *  调用方按 `screenX = W/2 + (x-y)·DX`、`screenY = H/2 + (x+y-(N-1))·DY` 换算即得原像素点） */
const cellFromOffset = (dX, dY, c) => ({
  x: c + (dX / DX + dY / DY) / 2,
  y: c + (dY / DY - dX / DX) / 2,
});

/**
 * planSpawns({ center, attackerFrom, defenderFrom, battleType, skeleton })
 *   center        { lat, lng }                    战场中心
 *   attackerFrom  { lat, lng }                    攻方在战略地图上的来处
 *   defenderFrom  { lat, lng } | null             守方来处（攻城战传 null）
 *   battleType    'siege' | 'field' | 其它
 *   skeleton      { levels, water, ... }          解码后的骨架（陆水、悬崖）
 *   walkableAt(x,y) 可选：自定义可走判定（默认 = 非水 且 非悬崖格）
 * → { attacker:{x,y,dir,deg}, defender:{x,y,dir,deg,atCenter:boolean}, notes[] }
 */
export function planSpawns(o) {
  const notes = [];
  const C = o.cells ?? 120, c = (C - 1) / 2;
  const walk = o.walkableAt ?? ((x, y) => {
    if (LAND_WAR_ALL_PASSABLE) return x >= 0 && y >= 0 && x < C && y < C;   // 陆战：一切可通行（只挡出图）
    if (x < 0 || y < 0 || x >= C || y >= C) return false;
    const i = Math.round(y) * C + Math.round(x);
    const water = o.skeleton ? ((o.skeleton.water[i >> 3] >> (i & 7)) & 1) === 1 : false;
    const cliff = Array.isArray(o.skeleton?.cliffSet) ? o.skeleton.cliffSet.has(i) : false;
    return !water && !cliff;
  });
  const A = bearing8(o.center.lat, o.center.lng, o.attackerFrom.lat, o.attackerFrom.lng);
  const isSiege = String(o.battleType) === 'siege' || !o.defenderFrom;
  let D = null;
  if (o.defenderFrom) D = bearing8(o.center.lat, o.center.lng, o.defenderFrom.lat, o.defenderFrom.lng);
  const R = SPAWN_DIST_FROM_CENTER_PX;
  /** 沿弧线滑到最近可走陆地：先在该方向的弧上试，再左右各扩，最后整圈（半径一律按**屏幕 px**） */
  function slide(idx, radius) {
    for (const spread of [0, 1, -1, 2, -2, 3, -3, 4]) {
      const k = (idx + spread + 8) % 8;
      for (const rr of [radius, radius * 0.85, radius * 0.7, radius * 0.55]) {
        const [ux, uy] = unitOf(k);
        const p = cellFromOffset(ux * rr, uy * rr, c);
        if (walk(p.x, p.y)) return { x: p.x, y: p.y, idx: k, slid: spread !== 0 };
      }
    }
    for (let r = R; r > 2; r -= 1) for (let k = 0; k < 8; k++) {
      const [ux, uy] = unitOf(k); const p = cellFromOffset(ux * r, uy * r, c);
      if (walk(p.x, p.y)) return { x: p.x, y: p.y, idx: k, slid: true };
    }
    return { x: c, y: c, idx, slid: true };
  }
  const a = slide(A.idx, R);
  if (a.slid) notes.push(`攻方方向 ${A.dir} 不可走（水/悬崖）⇒ 沿弧滑到 ${DIRS8[a.idx]}`);
  let def, atCenter = false;
  if (isSiege || !D) { atCenter = true; def = { x: c, y: c, idx: (A.idx + 4) % 8 }; notes.push('攻城战/无守方来处 ⇒ 守方在中心'); }
  else if (adjacent(A.idx, D.idx)) {
    atCenter = true;
    const s = slide(D.idx, CENTER_BAND_DIST_FROM_CENTER_PX);
    def = { x: s.x, y: s.y, idx: s.idx };
    notes.push(`双方同向或相邻（攻 ${A.dir} / 守 ${D.dir}）⇒ 守方改到中心一带固守`);
  } else {
    const s = slide(D.idx, R);
    def = { x: s.x, y: s.y, idx: s.idx };
    if (s.slid) notes.push(`守方方向 ${D.dir} 不可走 ⇒ 沿弧滑到 ${DIRS8[s.idx]}`);
  }
  return {
    attacker: { x: a.x, y: a.y, dir: DIRS8[a.idx], deg: A.deg },
    defender: { x: def.x, y: def.y, dir: DIRS8[def.idx], deg: D ? D.deg : null, atCenter },
    notes,
  };
}
