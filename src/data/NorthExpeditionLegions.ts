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
  wangyan: { name: '八字军', tier: 0 },     // 飞狐·王彦八字军（区T0锚点·新乡大捷）
  // tianxiong 已迁 CentralExpeditionLegions
  // 宣毅军除名（泛称非专属，与方渠无关）
  heng1: { name: '赵边骑', tier: 1 },         // 雁门关·李牧赵边骑抗匈奴
  huan: { name: '环州戍兵', tier: 3 },      // 方渠·宋代环州边防（原步跋子，归嵬名）
  qingyuan_bd: { name: '神臂营', tier: 2 }, // 保定·北宋强弩营

  // ── §2 北方 12 支 ──
  zhao: { name: '赵国边骑', tier: 2 },     // 邯郸·廉颇赵国名将（无独立胜仗）
  yan: { name: '渔阳突骑', tier: 2 },       // 古北口·§2 #2 光武幽州精骑（燕国北京）
  gongsun_d: { name: '襄平铁骑', tier: 1 }, // 襄平·公孙度襄平铁骑
  shizhao_d: { name: '黑槊龙骧', tier: 2 }, // 邢台·石虎后赵禁军
  yunzhong: { name: '苍头军', tier: 3 },    // 盛乐·拓跋代北
  tuoba: { name: '拓跋虎骑', tier: 1 },     // 大同·拓跋鲜卑
  // 武川镇军已迁草原（yuwen@武川镇）
  erzhu: { name: '六镇戍兵', tier: 2 },     // 秀容川·北魏六镇武人
  gaoqi_d: { name: '百保鲜卑', tier: 1 },   // 蓨城·北齐百保精兵·高长恭禁卫
  yingzhou_ying_d: { name: '黄龙兵', tier: 1 }, // 朝阳·慕容皝棘城大破石赵
  chile: { name: '两池军', tier: 3 },       // 云中·§2 #11
  murong: { name: '龙城甲骑', tier: 1 },    // 棘城·慕容燕具装骑（无经典以少胜多）
  ming_d: { name: '明军三大营', tier: 2 },   // 北京·五军神机三千营

  // ── §1 中原表·地理偏北（用户指定）──
  zhuozhou: { name: '曳落河', tier: 1 },     // 范阳·§1 #48 安禄山蕃胡骑兵
  shatuo: { name: '鸦儿军', tier: 1 },      // 光禄城·§1 #50 李克用沙陀铁骑（原草原#8改挂北方）
  lingwu: { name: '朔方军', tier: 1 },      // 回乐·§1 #53 灵州朔方节度使精锐
  dingxiang_d: { name: '定襄骁骑', tier: 2 }, // 恶阳岭·贞观四年李靖三千骁骑出恶阳岭夜袭定襄（《旧唐书·李靖传》）
  zhongshan: { name: '常山兵', tier: 1 },   // 真定·常山兵
  wuhuan: { name: '乌桓突骑', tier: 2 },    // 白狼山·§1 #84 曹操收编名骑
  helian: { name: '铁弗卫队', tier: 2 },     // 统万城·赫连勃勃铁弗亲卫
  bing: { name: '并州狼骑', tier: 2 },     // 晋阳·并州骑兵
  you: { name: '上谷突骑', tier: 2 },        // 居庸关·幽州上谷郡
  yi: { name: '易州戍兵', tier: 3 },           // 紫荆关·杨洪明代易州戍守
  changshan: { name: '倒马关卒', tier: 3 },   // 倒马关·常山
  xianyu: { name: '中山铁卒', tier: 2 },      // 井陉关·成公中山
  linhu: { name: '胡服骑', tier: 1 },         // 偏头关·赵武灵王胡服骑射
  lingqiu: { name: '宁武边军', tier: 3 },    // 平型关·周遇吉宁武边军
  huo: { name: '霍国甲士', tier: 3 },       // 灵石关·霍叔处霍国甲士
  // 飞虎军除名（李克用置，平型关时代错位）
  loufan: { name: '楼烦兵', tier: 2 },        // 宁武关·楼烦王
  linyu: { name: '夷丁突骑', tier: 3 },       // 山海关·临榆（明末）
  // 恒山军除名（泛称无固定番号）
  dai_d: { name: '代国锐卒', tier: 3 },         // 代县·春秋代国
  dongdan: { name: '东丹卫兵', tier: 2 },       // 敖东城·耶律倍东丹国
  xuan: { name: '大明北伐军', tier: 1 },          // 宣化·明九边宣府镇
  zhe_d: { name: '折家将兵', tier: 2 },         // 府谷·宋府州折氏十世将门
  shanrong: { name: '山戎突骑', tier: 2 },      // 无终·齐桓公伐山戎
  pingyuan: { name: '平原义军', tier: 1 },      // 平原·颜真卿首倡义兵
  dada_ming: { name: '度辽营', tier: 2 },          // 河套·东汉度辽将军部
  xiezhou: { name: '解县弩手', tier: 3 },       // 安邑·解县弩手

  // ── 2026-06-18 自东北文件迁回
  jinzhou: { name: '辽东铁骑', tier: 2 },     // 徒河·李成梁辽东骑兵（§3 #6）
  zu_d: { name: '关宁铁骑', tier: 1 },       // 宁远·祖大寿（原T0降级，防御战）
  mao_wenlong: { name: '东江劲旅', tier: 3 }, // 皮岛·毛文龙（§1 #86）
  liwang: { name: '河间突骑', tier: 1 },     // 乐成·李光弼河朔骑兵
  hejian: { name: '白马义从', tier: 2 },      // 文安·公孙瓒幽州突骑河间大破黄巾（以少胜多）
  qu_d: { name: '先登死士', tier: 0 },       // 界桥·麴义破公孙瓒（192年）
  yang_aner: { name: '天顺红袄', tier: 1 },        // 蓬莱·杨安儿天顺红袄克登莱
  weihaiwei: { name: '东征水军', tier: 3 },    // 文登·张亮东征水军
  jianzhou_nvzhen: { name: '建州女真卫', tier: 1 }, // 浑江·李满住建州女真卫
  pinghai: { name: '征东舟师', tier: 2 },     // 漂渝津·来护儿征东水师
  liangshidu: { name: '雕阴戍卒', tier: 2 }, // 雕阴·龙贾戍卒抗秦
  yangshe: { name: '铜鞮私卒', tier: 2 }, // 铜鞮·羊舌职封邑
  guzhu: { name: '辽西郡兵', tier: 2 },    // 肥如·田豫辽西镇北疆
  dizhou: { name: '龙骧军', tier: 1 },     // 乐安·王彦章龙骧破晋
  wuyuan_d: { name: '五原塞卒', tier: 3 },  // 固阳塞·五原郡长城戍卒
};
