/**
 * 川蜀文化区远征精锐军团名（BASHU）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复
 * - 依据 史料/古代精锐部队.md §8 川蜀 10 支全收录
 * - 蜀汉多番号分流：蜀/夔/谯/卓各挂一军
 * - 据点取川东近乡或史载成军/战场地
 */
export const BASHU_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  bandun: { name: '賨人勇士', tier: 2 },       // 汉昌·§8 #1 板楯蛮（賨人）
  kui: { name: '白毦兵', tier: 1 },             // 白帝城·§8 #2 陈到永安白毦
  qiao_d: { name: '虎步军', tier: 3 },          // 阆中·§8 #3 蜀汉虎步营
  zhuoshi: { name: '连弩士', tier: 2 },         // 临邛·§8 #4 诸葛连弩营
  tujia_d: { name: '白杆兵', tier: 2 },         // 石柱·§8 #5 秦良玉土司白蜡矛
  shu: { name: '无当飞军', tier: 0 },           // 成都·街亭（228）王平千余人退张郃
  shuixi: { name: '罗罗兵', tier: 3 },           // 毕节·§8 #7 水西罗罗兵（奢安之乱）
  boren: { name: '悬棺武士', tier: 2 },         // 僰道·§8 #8 僰人山地武士（番号避旗号「僰」）
  chenghan: { name: '六夷突骑', tier: 2 },      // 鹿头关·§8 #9 成汉李特六夷铁骑
  daxi_ming: { name: '大西老营', tier: 1 },     // 涪城·§8 #10 张献忠大西核心营（旗=大西·§12.1.1）
  ba: { name: '合州水军', tier: 2 },            // 重庆·南宋合州钓鱼城水军（旗=巴·巴郡）
  // ── 2026-06-16 新增：4座西南名关 ──
  lizhou_d: { name: '白水军', tier: 2 },        // 剑门关·刘璋白水关旧部
  xiazhou: { name: '峡江水军', tier: 2 },       // 瞿塘关·三峡重防区（原白杆兵防重）
  zuo_d: { name: '南中叟兵', tier: 3 },         // 清溪关·西南夷王牌
  zangke: { name: '夜郎锐卒', tier: 3 },        // 胜境关·古夜郎国地
};
