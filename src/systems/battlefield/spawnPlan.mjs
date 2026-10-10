/**
 * 出兵点计算（纯模块）—— 规则见 docs/02-design/战术模式-DE地图与玩法设计.md 第八节（主人 2026-10-10 定）
 *
 * 设计值（**待实看调整**）：
 *   SPAWN_RADIUS_FRAC = 1/3   出生点离中心的半径比例（不从地图最边上出）
 *   CENTER_BAND_FRAC  = 0.12  守方改到"中心一带"时的半径比例
 * 规则：
 *   ① 方位角由「战场中心 → 该军在战略地图上的来处」算出，归到八方向；
 *   ② 野战：双方各从自己来处方向出现；攻城战：攻方从来的方向，**守方在中心**；
 *   ③ 双方同向或相邻方向 ⇒ 守方改到中心一带，攻方从边上进；
 *   ④ 出生点落在水或悬崖 ⇒ 沿该方向的弧线滑到最近可走陆地；整条边是水 ⇒ 从最近可走的边进。
 * 坐标：**DE 格坐标**（x 向东、y 向北；屏幕方向由渲染层负责，见第 68 轮方向公式）。
 */
export const VERSION_SPAWN = 1;
export const SPAWN_RADIUS_FRAC = 1 / 3;   // 设计值，待实看调整
export const CENTER_BAND_FRAC = 0.12;     // 设计值，待实看调整
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
/** 八方向 → DE 格坐标单位向量（北 N = 格(-S2, -S2) = 画面正上方；东 E = 格(S2, -S2) = 画面正右方） */
const unitOf = (idx) => [
  [-S2, -S2], // 0: N  (画面正上)
  [0, -1],    // 1: NE (画面右上)
  [S2, -S2],  // 2: E  (画面正右)
  [1, 0],     // 3: SE (画面右下)
  [S2, S2],   // 4: S  (画面正下)
  [0, 1],     // 5: SW (画面左下)
  [-S2, S2],  // 6: W  (画面正左)
  [-1, 0],    // 7: NW (画面左上)
][idx];

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
  const R = SPAWN_RADIUS_FRAC * c;
  /** 沿弧线滑到最近可走陆地：先在该方向的弧上试，再左右各扩，最后整圈 */
  function slide(idx, radius) {
    for (const spread of [0, 1, -1, 2, -2, 3, -3, 4]) {
      const k = (idx + spread + 8) % 8;
      for (const rr of [radius, radius * 0.85, radius * 0.7, radius * 0.55]) {
        const [ux, uy] = unitOf(k);
        const x = Math.round(c + ux * rr), y = Math.round(c + uy * rr);
        if (walk(x, y)) return { x, y, idx: k, slid: spread !== 0 };
      }
    }
    for (let r = R; r > 2; r -= 1) for (let k = 0; k < 8; k++) {
      const [ux, uy] = unitOf(k); const x = Math.round(c + ux * r), y = Math.round(c + uy * r);
      if (walk(x, y)) return { x, y, idx: k, slid: true };
    }
    return { x: Math.round(c), y: Math.round(c), idx, slid: true };
  }
  const a = slide(A.idx, R);
  if (a.slid) notes.push(`攻方方向 ${A.dir} 不可走（水/悬崖）⇒ 沿弧滑到 ${DIRS8[a.idx]}`);
  let def, atCenter = false;
  if (isSiege || !D) { atCenter = true; def = { x: Math.round(c), y: Math.round(c), idx: (A.idx + 4) % 8 }; notes.push('攻城战/无守方来处 ⇒ 守方在中心'); }
  else if (adjacent(A.idx, D.idx)) {
    atCenter = true;
    const s = slide(D.idx, CENTER_BAND_FRAC * c);
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
