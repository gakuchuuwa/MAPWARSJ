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
  // 悬棺武士除名
  chenghan: { name: '六夷突骑', tier: 2 },      // 鹿头关·§8 #9 成汉李特六夷铁骑
  daxi_ming: { name: '大西老营', tier: 1 },     // 涪城·§8 #10 张献忠大西核心营（旗=大西·§12.1.1）
  ba: { name: '兴戎军', tier: 2 },              // 钓鱼城·南宋兴戎司禁军（《宋史》王坚合州知州；旗=巴·巴国）
  di: { name: '氐豪锐骑', tier: 3 },              // 略阳·前秦苻氏氐族核心骑兵（《晋书》氐豪）
  qiuchi: { name: '武都部曲', tier: 3 },          // 仇池·杨氏世袭部曲（《宋书》杨难当拥部曲数万）
  // ── 2026-06-16 新增：4座西南名关 ──
  lizhou_d: { name: '白水军', tier: 2 },        // 剑门关·刘璋白水关旧部
  xiazhou: { name: '峡江水军', tier: 2 },       // 瞿塘关·三峡重防区（原白杆兵防重）
  yang_bozhou: { name: '播州土兵', tier: 3 },    // 海龙屯·播州杨氏
  yong: { name: '庸国戍卒', tier: 3 },           // 上庸·古庸国
  cong: { name: '賨族勇士', tier: 3 },           // 宕渠·賨族
  wuxi: { name: '五溪蛮兵', tier: 3 },           // 八面山·五溪蛮
  song2: { name: '松州戍卒', tier: 3 },          // 嘉诚·唐蕃古道松州
  yidou: { name: '夷陵守军', tier: 3 },          // 夷陵·三国夷陵之战
  // 权州戍兵除名（生造）
  zuo_d: { name: '南中叟兵', tier: 3 },         // 清溪关·西南夷王牌
  zangke: { name: '夜郎锐卒', tier: 3 },        // 胜境关·古夜郎国地
};
