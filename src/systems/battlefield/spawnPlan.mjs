/**
 * 出兵点计算（纯模块）—— 规则见 docs/02-design/战术模式-DE地图与玩法设计.md 第八节（主人 2026-10-10 定）
 *
 * 设计值（现行＝2026-10-25，历次主人令见下方常量注释）：
 *   SPAWN_GAP_PX                    = 7200  双方相对来处时基地相距的**屏幕距离上限**（px）；每边按来向取图内最远（东西 3600、斜向≈3030、南北≈2500，见 spawnRadiusFor）
 *   CENTER_BAND_DIST_FROM_CENTER_PX =  864  守方改到"中心一带"时离中心的屏幕距离（＝同比例 0.36 倍）
 * 🔴 为什么按屏幕距离、不再按格半径（本次改动的原因）：
 *   等轴投影 1 格 = 32×16 px（横竖 2:1），旧口径「格半径 1/3」在屏幕上横竖差一倍 ——
 *   实测南北对进双方只隔 928 px、东西对进隔 1856 px，同一个设计值下八个方向的行军时长差一倍。
 *   改按屏幕距离后：**相对来处的两方**（南北/东西/斜向对进）基地一律相距同一个屏幕 px 数（现行 4800），
 *   间距只由**双方来处的夹角**决定，不再随这对方向在地图上的朝向而变（垂直来处自然＝2400√2≈3394 px）。
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
/**
 * 双方**相对**来处（南北/东西/斜向对进）时基地相距的屏幕距离（px）。
 * 1400 → **2200**（2026-10-11「野战中，两军营地相距太近了」）→ **3600**（2026-10-12 同上再拉远）
 * → **4800**（2026-10-25 主人令「战术模式中，野战的时候，双军营地离得有点近，请拉远写」）。
 * 🔴 [2026-10-11 主人报] 实测：基座相距 1400 时，两军**士兵重心**只隔 803px ——
 *    因为双方各有一个「向前排」偏移，两军前排实际只隔约 450px，画面里看着几乎贴在一起。
 * 🔴 [2026-10-25 上限核算] 120×120 格、每格 96×48 ⇒ 地图**南北半幅只有 2856 px**，营帐最后一排还要再退 ROW_DEPTH＝280，
 *    南北向每边最多约 2500；东西向半幅 5712 px 宽得多。所以 2026-10-26 起不再八向等长，改按方向取（见下）。
 *    改这里前先跑 `scratch/_probe_spawn_gap_20261025.mjs`。
 *    ⚠️ 攻城战不走这个值（攻方基座＝城半径＋…，见 Scene13WarLayer），只有野战受影响。
 */
/**
 * 🔴 [2026-10-26 主人令「请把野战中两军的营地拉远些，现在一个屏幕都能看见，太近了」]
 *    八方向统一 2400 时，南北向已顶到图边，但**东西向**半幅 5712 px、还空着一大半 ——
 *    主人截图正是东西对进：最远缩放（0.45）下一屏横向能看约 5690 世界 px，4800 的两营一屏全收。
 *    改为**按来向取距离**（与攻城战 `spawnRingSafeRadius` 同一做法，DE 场景也是贴着自家图边扎营）：
 *    每个方向取「营地盒仍在单位活动界内」的最远半径，再封顶 SPAWN_DIST_FROM_CENTER_PX。
 *    结果（每边）：东西 3600（两营相距 7200，一屏装不下）、斜向 ≈3030、南北 ≈2500（南北一屏本就只看约 3200）。
 *    代价：东西向对进行军路程比南北长，属主人要的「拉远」。核算：`node scratch/_probe_spawn_gap_20261025.mjs`。
 */
export const SPAWN_GAP_PX = 7200;
/** 出生点离中心的屏幕距离**上限**（px）＝ 对进间距上限的一半；实际按方向再被图边收紧，见 spawnRadiusFor */
export const SPAWN_DIST_FROM_CENTER_PX = SPAWN_GAP_PX / 2;
/** 双方同向/相邻时守方改到「中心一带」的距离（px）＝ 864（原 2400×0.36，不随本次拉远而变） */
export const CENTER_BAND_DIST_FROM_CENTER_PX = 864;
/** 地图半幅（与 Scene13GroundLayerGL 的 TAC_MAP_HALF_W/H 同式：(120-1)×96/2、(120-1)×48/2） */
const MAP_HALF_W = 5712, MAP_HALF_H = 2856;
/** 营地盒：沿进军方向 ±ROW_DEPTH(280)、横向 ±620（九口最宽阵面）；活动界余量 UNIT_PX/2=32，再留 40 */
const CAMP_DEPTH = 280, CAMP_LAT = 620, EDGE = 32 + 40;
/** 该方向能退到的最远半径（营地盒整块留在单位活动界内），封顶 SPAWN_DIST_FROM_CENTER_PX */
export function spawnRadiusFor(idx) {
  const [ux, uy] = unitOf(idx);
  const ax = Math.abs(ux), ay = Math.abs(uy);
  const ex = ax * CAMP_DEPTH + ay * CAMP_LAT;
  const ey = ay * CAMP_DEPTH + ax * CAMP_LAT;
  let r = SPAWN_DIST_FROM_CENTER_PX;
  if (ax > 1e-6) r = Math.min(r, (MAP_HALF_W - EDGE - ex) / ax);
  if (ay > 1e-6) r = Math.min(r, (MAP_HALF_H - EDGE - ey) / ay);
  return Math.max(0, Math.floor(r));
}
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
  x: c + dX / 96,   // 🔴 [2026-10-11 AA 底图改「16:9 满铺矩形」] 逆变换同步换矩形：
  y: c + dY / 48,   //    旧式是等距菱形 (dX/DX+dY/DY)/2，投影一变出兵口就会落错格子。
                    // 🔴 [2026-10-12] 每格 64×32 → 96×48（Scene13GroundLayerGL 的 TAC_TILE_W/H；本文件是 .mjs 纯模块，故此处写数字，两边必须同改）
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
  const isSiege = String(o.battleType) === 'siege';
  let D = null;
  if (o.defenderFrom) D = bearing8(o.center.lat, o.center.lng, o.defenderFrom.lat, o.defenderFrom.lng);
  const R = SPAWN_DIST_FROM_CENTER_PX;
  /** 沿弧线滑到最近可走陆地：先在该方向的弧上试，再左右各扩，最后整圈（半径一律按**屏幕 px**）。
   *  radius 省略 ＝ 按各自方向的最远半径（spawnRadiusFor）；中心一带的固定半径照传。 */
  function slide(idx, radius) {
    for (const spread of [0, 1, -1, 2, -2, 3, -3, 4]) {
      const k = (idx + spread + 8) % 8;
      const base = radius ?? spawnRadiusFor(k);
      for (const rr of [base, base * 0.85, base * 0.7, base * 0.55]) {
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
  const a = slide(A.idx);
  if (a.slid) notes.push(`攻方方向 ${A.dir} 不可走（水/悬崖）⇒ 沿弧滑到 ${DIRS8[a.idx]}`);
  let def, atCenter = false;
  if (isSiege) { atCenter = true; def = { x: c, y: c, idx: (A.idx + 4) % 8 }; notes.push('攻城战 ⇒ 守方在中心'); }
  else if (!D) {
    const oppIdx = (a.idx + 4) % 8;
    const s = slide(oppIdx);
    def = { x: s.x, y: s.y, idx: s.idx };
    notes.push(`野战无守方来处 ⇒ 守方在对向 ${DIRS8[def.idx]} 扎营`);
  } else if (adjacent(A.idx, D.idx)) {
    atCenter = true;
    const oppIdx = (a.idx + 4) % 8;
    const s = slide(oppIdx, CENTER_BAND_DIST_FROM_CENTER_PX);
    def = { x: s.x, y: s.y, idx: s.idx };
    notes.push(`双方同向或相邻（攻 ${A.dir} / 守 ${D.dir}）⇒ 守方改到中心背攻方一侧固守`);
  } else {
    const s = slide(D.idx);
    def = { x: s.x, y: s.y, idx: s.idx };
    if (s.slid) notes.push(`守方方向 ${D.dir} 不可走 ⇒ 沿弧滑到 ${DIRS8[s.idx]}`);
  }
  return {
    attacker: { x: a.x, y: a.y, dir: DIRS8[a.idx], deg: A.deg },
    defender: { x: def.x, y: def.y, dir: DIRS8[def.idx], deg: D ? D.deg : null, atCenter },
    notes,
  };
}
