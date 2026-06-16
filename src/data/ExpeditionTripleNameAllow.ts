/**
 * AGENTS.md §12.1.1 — 旗号与番号可共享汉字的势力白名单
 *
 * 仅当势力按 §4.1 定为 **1·民族 / 2·政权 / 4·家族** 时，
 * 允许番号包含旗号（如 魏+魏武卒、大理+大理白军、吐蕃+吐蕃桂级骑）。
 *
 * 军镇专名、州郡、关名、番号即势力名者 **不得** 列入（例：tianxiong 天雄 ≠ 天雄军）。
 * 新增条目：先定 §4.1 级别，再决定是否加入本表。
 *
 * 注：本表只豁免 **旗号↔番号**；据点↔番号 / 旗号↔据点 仍须另改据点名或番号。
 */
export const EXPEDITION_FLAG_LEGION_REPEAT_OK = new Set<string>([
  // ── 2·政权（国号/政权专名）──
  'wei', 'qin', 'tang', 'qi', 'shang', 'zhou', 'xia', 'han_d', 'fu', 'cao_d',
  'chen', 'xiao_d', 'song', 'wuzhou_d', 'haoding', 'sunqin',
  'hongguang', 'min', 'loulan', 'han', 'jingjiang', 'liang_d', 'ashina',
  'edo', 'riben', 'xinluo', 'gaogouli', 'balhae', 'goryeo', 'joseon',
  'zhao', // 赵国·赵边骑
  'xiliang', // 西凉·西凉铁骑
  'daxi_ming', // 大西·大西老营
  'seljuq', // 塞尔柱·桑贾尔禁卫
  // 西域
  'anxi', // 安西·大唐安西军（都护府专名）
  'shache', // 莎车·莎车左右骑
  // 中亚
  'yanda', // 嚈哒·嚈哒铁骑
  'huarazim', // 花剌·花剌子模
  'tiemuer', // 帖木·帖木重装骑
  // 青藏
  'tubo', // 吐蕃·吐蕃桂级骑
  'xiangxiong', // 象雄·象雄武士
  'guge', // 古格·古格甲兵
  'khoshut', // 和硕·和硕特铁骑
  'pazhu', // 帕竹·帕竹甲兵
  // 滇缅
  'nanzhao', // 南诏·南诏罗苴子
  'dali', // 大理·大理白军
  'konbaung', // 贡榜·贡榜卡塞骑
  'pyu', // 骠·骠国巨象阵
  'champa', // 占婆·占婆国水师
  'luchuan', // 麓川·麓川夷象
  'guangzhou', // 广州·摧锋军（广南核心；§9 #15 番禺）
  'chenla', // 真腊·双弓弩象营（吴哥；岭南区）
  // ── 4·家族 ──
  'qi_d',
  'ming_zheng', // 明郑·郑氏铁人军（郑成功）
  // ── 1·民族 / 部族（史籍专名旗号）──
  'tujue', 'shatuo', 'gaoche', 'rouran', 'naiman', 'ongut', 'wala', 'geluolu',
  'qiuci', 'kala', 'yanqi', 'iga_d', 'sambyeol', 'wuhuan',
  'huige', // 回纥·回鹘铁骑
  'wusun', // 乌孙·昆莫亲卫
  'borjigin', // 孛儿·那可儿军（孛儿只斤）
  'qincha', // 钦察·康里精骑
  'kazakh', // 哈萨·哈萨克骑
  'gurkha', // 廓喀·廓尔喀弯刀
  // 未列入者默认：旗号∩番号 禁止共享（含 tianxiong、北府若改军镇专名等须逐条审核）
]);

/** 旗号与番号之间是否允许共享汉字 / 包含关系 */
export function expeditionFlagLegionRepeatAllowed(factionId: string): boolean {
  return EXPEDITION_FLAG_LEGION_REPEAT_OK.has(factionId);
}
