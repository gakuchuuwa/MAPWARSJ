/**
 * AGENTS.md §12.1.1 — 旗号与番号可共享汉字的势力白名单
 *
 * 仅当势力按 §4.1 定为 **1·民族 / 2·政权 / 4·家族** 时，
 * 允许番号包含旗号（如 魏+魏武卒、大理+大理白军）。
 *
 * 军镇专名、州郡、关名、番号即势力名者 **不得** 列入（例：tianxiong 天雄 ≠ 天雄军）。
 * 新增条目：先定 §4.1 级别，再决定是否加入本表。
 *
 * 注：本表只豁免 **旗号↔番号**；据点↔番号 / 旗号↔据点 仍须另改据点名或番号。
 */
export const EXPEDITION_FLAG_LEGION_REPEAT_OK = new Set<string>([
  // ── 2·政权（国号/政权专名）──
  'wei', 'qin', 'tang', 'qi', 'shang', 'zhou', 'xiezhou', 'han_d', 'fu', 'cao_d',
  'chen', 'xiao_d', 'song', 'wuzhou_d', 'sunqin',
  'hongguang', 'min', 'loulan', 'han', 'jingjiang', 'liang_d', 'ashina',
  'xiliao', // 喀喇契丹·斡耳朵亲卫（西辽政权）
  'edo', 'riben', 'xinluo', 'gaogouli', 'balhae', 'goryeo', 'joseon',
  'zhao', // 赵国·赵边骑
    'daxi_ming', // 大西·大西老营
  'seljuq', // 塞尔柱·桑贾尔禁卫
  // 西域
  'anxi', // 安西·大唐安西军（都护府专名）
  'gaochang', // 高昌·高昌铁骑（麴氏高昌政权）
  'shache', // 莎车·莎车左右骑
  // 中亚
  'yanda', // 嚈哒·嚈哒铁骑
  'huarazim', // 花剌·花剌子模骑
  // tiemuer 察合台突骑：旗号帖木儿
  // 青藏
  'xiangxiong', // 象雄·象雄武士
  'guge', // 古格·古格甲兵
  'khoshut', // 和硕·和硕特铁骑
  'pazhu', // 帕竹·帕竹甲兵
  // 滇缅
  'konbaung', // 贡榜·贡榜卡塞骑
  'dali', // 大理·大理白军
  'pyu', // 骠·骠国巨象阵
  'champa', // 占婆·占婆国水师
  'luchuan', // 麓川·麓川夷象
  'guangzhou', // 广州·清海军（广南核心；番禺）
  'dayue', // 大越·白藤江水师
  'chenla', // 真腊·双弓弩象营（吴哥；岭南区）
  // ── 4·家族 ──
  'qi_d',
  'ming_zheng', // 明郑·郑氏铁人军（郑成功）
  'date_d', // 伊达·伊达铁骑
  'otomo_d', // 大友·大友水军
  'suwa_d', // 诹访·诹访神党
  // ── 1·民族 / 部族（史籍专名旗号）──
  'tujue', 'shatuo', 'gaoche', 'rouran', 'naiman', 'ongut', 'wala', 'geluolu',
  'qiuci', 'yanqi', 'iga_d', 'sambyeol', 'wuhuan',
  'huige', // 回纥·毗伽近卫
  'wusun', // 乌孙·昆莫亲卫
  'borjigin', // 孛儿·那可儿军（孛儿只斤）
  'suolun', // 索伦·索伦营（清代黑龙江索伦营）
  'qincha', // 钦察·康里精骑
  'kazakh', // 哈萨·哈萨克骑
  'gurkha', // 廓喀·廓尔喀弯刀
  // 未列入者默认：旗号∩番号 禁止共享（含 tianxiong、北府若改军镇专名等须逐条审核）
]);

/** 旗号与番号之间是否允许共享汉字 / 包含关系 */
export function expeditionFlagLegionRepeatAllowed(factionId: string): boolean {
  return EXPEDITION_FLAG_LEGION_REPEAT_OK.has(factionId);
}
