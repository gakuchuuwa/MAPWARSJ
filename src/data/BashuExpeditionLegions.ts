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
  qiao_d: { name: '虎步军', tier: 3 },          // 阆中·§8 #3 蜀汉虎步营
  zhuoshi: { name: '连弩士', tier: 3 },         // 临邛·诸葛连弩营
  tujia_d: { name: '白杆兵', tier: 2 },         // 石柱·§8 #5 秦良玉土司白蜡矛
  shu: { name: '无当飞军', tier: 1 },           // 成都·诸葛亮连弩山地劲旅（王平统率史载）
  shu_han: { name: '兴势守军', tier: 1 },       // 兴势·244年王平兴势之战
  hanzhong_d: { name: '汉中镇远军', tier: 1 },  // 略阳·魏延汉中太守
  ju_d: { name: '巴蜀锐士', tier: 1 },          // 重庆·司马错灭蜀秦军
  shuixi: { name: '罗罗兵', tier: 3 },           // 毕节·§8 #7 水西罗罗兵（奢安之乱）
  // 悬棺武士除名
  chenghan: { name: '六夷突骑', tier: 2 },      // 鹿头关·§8 #9 成汉李特六夷铁骑
  daxi_ming: { name: '大西老营', tier: 1 },     // 涪城·§8 #10 张献忠大西核心营（旗=大西·§12.1.1）
  ba: { name: '兴戎军', tier: 0 },              // 钓鱼城·王坚抗蒙毙蒙哥（《宋史》）
  kui: { name: '霆军', tier: 1 },               // 鱼复·鲍超霆军（奉节籍湘军猛将）
  qiuchi: { name: '武都部曲', tier: 3 },          // 仇池·杨氏世袭部曲（《宋书》杨难当拥部曲数万）
  // ── 2026-06-16 新增：4座西南名关 ──
  lizhou_d: { name: '蜀口守军', tier: 1 },        // 剑门关·吴玠和尚原仙人关守蜀
  xiazhou: { name: '白毦兵', tier: 1 },       // 瞿塘关·陈到永安白毦（夔门护卫）
  yang_bozhou: { name: '播州土兵', tier: 3 },    // 海龙屯·播州杨氏
  yong: { name: '庸国戍卒', tier: 3 },           // 上庸·古庸国
  cong: { name: '賨族勇士', tier: 3 },           // 宕渠·賨族
  wuxi: { name: '五溪蛮兵', tier: 3 },           // 八面山·五溪蛮
  song2: { name: '松州戍卒', tier: 3 },          // 嘉诚·唐蕃古道松州
  yidou: { name: '夷陵守军', tier: 3 },          // 夷陵·三国夷陵之战
  // 权州戍兵除名（生造）
  zuo_d: { name: '南中叟兵', tier: 3 },         // 清溪关·西南夷王牌
  zangke: { name: '牂牁戍卒', tier: 3 },        // 胜境关·古牂牁国地（原夜郎锐卒，避岭南同名）
  di: { name: '氐豪锐骑', tier: 3 },              // 成县·前秦苻氏氐族核心骑兵
  xin2: { name: '北伐前军', tier: 1 },          // 南浦·姜维九伐中原前军
  cheng: { name: '西川绿营', tier: 2 },          // 阳安·岳钟琪川督绿营
};
