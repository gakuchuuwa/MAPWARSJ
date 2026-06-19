/**
 * 北方文化区远征精锐军团名（NORTH）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复；史料具名
 * - 八字军属王彦太行义军，不得挂南方衡州
 * - §2 北方 12 支全收录；§1 地理偏北者（曳落河/鸦儿军/朔方/静塞/殿前诸班）同列
 * - 朔方军：旗=灵@回乐（灵州/灵武治所），番=朔方军（≠旗号朔方@临戎）
 */
export const NORTH_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  // ── 太行/河北（§1 交叉 + 明末）──
  wangyan: { name: '八字军', tier: 0 },     // 飞狐·顺昌大捷2万破10万（《宋史·刘锜传》）
  tianxiong: { name: '魏博牙兵', tier: 1 },   // 大名·田承嗣魏博牙兵
  // 宣毅军除名（泛称非专属，与方渠无关）
  huan: { name: '环州戍兵', tier: 3 },      // 方渠·宋代环州边防（原步跋子，归嵬名）
  qingyuan_bd: { name: '神臂营', tier: 2 }, // 保定·北宋强弩营

  // ── §2 北方 12 支 ──
  zhao: { name: '邯郸坚兵', tier: 1 },     // 邯郸·§2 #1 廉颇赵国坚兵
  yan: { name: '渔阳突骑', tier: 2 },       // 古北口·§2 #2 光武幽州精骑（燕国北京）
  gongsun_d: { name: '辽东戍卒', tier: 3 }, // 襄平·公孙氏辽东
  shizhao_d: { name: '黑槊龙骧', tier: 1 }, // 邢台·§2 #4 石勒石虎后赵禁军
  yunzhong: { name: '苍头军', tier: 3 },    // 盛乐·拓跋代北
  tuoba: { name: '拓跋虎骑', tier: 1 },     // 大同·拓跋鲜卑
  // 武川镇军已迁草原（yuwen@武川镇）
  erzhu: { name: '六镇戍兵', tier: 2 },     // 秀容川·北魏六镇武人
  gaoqi_d: { name: '百保鲜卑', tier: 1 },   // 蓨城·北齐百保精兵·高长恭禁卫
  yingzhou_ying_d: { name: '黄龙兵', tier: 3 }, // 棘城·营州黄龙（《北齐书·高宝宁传》）
  feng_d: { name: '龙城铁骑', tier: 2 },      // 朝阳·北燕冯跋龙城骑兵（《魏书·冯跋传》）
  chile: { name: '两池军', tier: 3 },       // 云中·§2 #11
  murong: { name: '龙城甲骑', tier: 1 },    // 棘城·慕容燕具装骑（无经典以少胜多）
  ming_d: { name: '明军三大营', tier: 2 },   // 北京·五军神机三千营

  // ── §1 中原表·地理偏北（用户指定）──
  zhuozhou: { name: '曳落河', tier: 1 },     // 范阳·§1 #48 安禄山蕃胡骑兵
  shatuo: { name: '鸦儿军', tier: 1 },      // 光禄城·§1 #50 李克用沙陀铁骑（原草原#8改挂北方）
  lingwu: { name: '朔方军', tier: 1 },      // 回乐·§1 #53 灵州朔方节度使精锐
  dingxiang_d: { name: '恶阳骑', tier: 1 }, // 恶阳岭·贞观四年李靖三千轻骑夜袭定襄（《旧唐书·李靖传》）
  zhongshan: { name: '恒州弩手', tier: 2 },   // 真定·颜杲卿恒州弩手
  wuhuan: { name: '乌桓突骑', tier: 2 },    // 白狼山·§1 #84 曹操收编名骑
  helian: { name: '铁弗卫队', tier: 2 },     // 统万城·赫连勃勃铁弗亲卫
  bing: { name: '并州狼骑', tier: 2 },     // 晋阳·并州骑兵
  you: { name: '上谷突骑', tier: 2 },        // 居庸关·幽州上谷郡
  yi: { name: '白马义从', tier: 1 },           // 紫荆关·易京要塞公孙瓒
  changshan: { name: '常山义军', tier: 2 },   // 倒马关·常山颜杲卿义军
  xianyu: { name: '中山铁卒', tier: 3 },      // 井陉关·鲜虞（战国）
  linhu: { name: '林胡骑', tier: 3 },         // 偏头关·林胡族
  // 飞虎军除名（李克用置，平型关时代错位）
  loufan: { name: '楼烦兵', tier: 3 },        // 宁武关·战国楼烦胡骑
  linyu: { name: '夷丁突骑', tier: 3 },       // 山海关·临榆（明末）
  // 恒山军除名（泛称无固定番号）
  dai_d: { name: '代国锐卒', tier: 3 },         // 代县·春秋代国
  dongdan: { name: '东丹卫兵', tier: 3 },       // 卑沙城·东丹国
  xuan: { name: '宣府镇军', tier: 3 },          // 宣化·明九边宣府镇
  zhe_d: { name: '折家将兵', tier: 2 },         // 府谷·宋府州折氏十世将门
  shanrong: { name: '山戎突骑', tier: 3 },      // 无终·山戎族
  pingyuan: { name: '高唐戍卒', tier: 3 },      // 平原·高唐州
  dada_ming: { name: '度辽营', tier: 2 },          // 河套·东汉度辽将军部
  xiezhou: { name: '解县弩手', tier: 3 },       // 安邑·解县弩手

  // ── 2026-06-18 自东北文件迁回
  jinzhou: { name: '辽东铁骑', tier: 2 },     // 徒河·李成梁辽东骑兵（§3 #6）
  zu_d: { name: '关宁铁骑', tier: 0 },       // 宁远·宁远大捷破努尔哈赤（§3 #5）
  mao_wenlong: { name: '东江劲旅', tier: 3 }, // 皮岛·毛文龙（§1 #86）
  liwang: { name: '河间突骑', tier: 1 },     // 乐成·李光弼河朔骑兵
  qu_d: { name: '先登死士', tier: 0 },       // 界桥·麴义破公孙瓒（192年）
};
