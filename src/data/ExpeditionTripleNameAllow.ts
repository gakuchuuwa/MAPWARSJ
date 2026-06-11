/**
 * AGENTS.md §12.1.1 — 旗号与番号可共享汉字的势力白名单
 *
 * 仅当势力按 §4.1 定为 **1·民族 / 2·政权 / 4·家族** 时，
 * 允许番号包含旗号（如 魏+魏武卒、戚+戚家军）。
 *
 * 军镇专名、州郡、关名、番号即势力名者 **不得** 列入（例：tianxiong 天雄 ≠ 天雄军）。
 * 新增条目：先定 §4.1 级别，再决定是否加入本表。
 */
export const EXPEDITION_FLAG_LEGION_REPEAT_OK = new Set<string>([
  // ── 2·政权（国号/政权专名）──
  'wei', 'qin', 'tang', 'qi', 'shang', 'zhou', 'xia', 'han_d', 'fu', 'cao_d', 'lvbu',
  'ranwei_d', 'zhuliang_d', 'xichu', 'sui', 'chu', 'nantang_d', 'ming_d', 'sunwu_d',
  'chen', 'xiao_d', 'song', 'wuzhou_d', 'beifu_d', 'haoding', 'sunqin',
  'edo', 'riben', 'xinluo', 'gaogouli', 'balhae', 'goryeo', 'joseon',
  'zhao', // 赵国·赵边骑（§2 #1 政权专名）
  // ── 4·家族 ──
  'qi_d',
  // ── 1·民族 / 部族（史籍专名旗号）──
  'tujue', 'shatuo', 'gaoche', 'rouran', 'naiman', 'ongut', 'wala', 'geluolu',
  'qiuci', 'kala', 'yanqi', 'iga_d', 'sambyeol',
  // 未列入者默认：旗号∩番号 禁止共享（含 tianxiong、北府若改军镇专名等须逐条审核）
]);

/** 旗号与番号之间是否允许共享汉字 / 包含关系 */
export function expeditionFlagLegionRepeatAllowed(factionId: string): boolean {
  return EXPEDITION_FLAG_LEGION_REPEAT_OK.has(factionId);
}
