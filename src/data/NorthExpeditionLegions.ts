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
  wangyan: { name: '八字军', tier: 1 },     // 飞狐·§9 #12 王彦太行寨；旗=太行（地名§4.1-5，禁人名）
  tianxiong: { name: '天雄军', tier: 3 },   // 大名·§1 #75 明史天雄军；旗=魏博
  huan: { name: '宣毅军', tier: 3 },        // 方渠·§1 #65 环州；范仲淹庆历沿边
  qingyuan_bd: { name: '神臂营', tier: 1 }, // 保定·§1 #68 河北禁军强弩营（定州路武库）

  // ── §2 北方 12 支 ──
  zhao: { name: '赵边骑', tier: 1 },        // 邯郸·§2 #1 赵武灵王胡服骑射
  yan: { name: '渔阳突骑', tier: 2 },       // 古北口·§2 #2 光武幽州精骑（燕国北京）
  gongsun_d: { name: '辽东坚甲', tier: 2 }, // 襄平·公孙氏凭恃的辽东坚甲重步骑
  shizhao_d: { name: '黑槊龙骧', tier: 1 }, // 邢台·§2 #4 石勒石虎后赵禁军
  yunzhong: { name: '苍头军', tier: 1 },    // 盛乐·§2 #5 拓跋珪代北苍头
  tuoba: { name: '虎纹突骑', tier: 1 },     // 大同·§2 #6 拓跋焘具装骑
  yuwen: { name: '宿卫虎贲', tier: 1 },     // 饶乐水·§2 #7 北魏/宇文宿卫
  erzhu: { name: '六镇戍兵', tier: 3 },     // 秀容川·§2 #8 六镇鲜卑军人（尔朱荣圈）
  gaoqi_d: { name: '百保鲜卑', tier: 0 },   // 蓨城·§2 #9 北齐百保精兵
  yingzhou_ying_d: { name: '黄龙兵', tier: 3 }, // 朝阳·§2 #10 营州黄龙（《北齐书·高宝宁传》）
  hejian: { name: '先登死士', tier: 0 },    // 乐成·§1 #25 界桥（番号随城）
  chile: { name: '两池军', tier: 3 },       // 云中·§2 #11
  murong: { name: '龙城甲骑', tier: 0 },    // 棘城·§2 #12 慕容燕龙城具装骑（原鲜卑燕骑）
  ming_d: { name: '明军三大营', tier: 1 },   // 北京·§1 #72–73、#79 五军/神机/三千营合称

  // ── §1 中原表·地理偏北（用户指定）──
  anshi_d: { name: '曳落河', tier: 1 },     // 范阳·§1 #48 安禄山蕃胡骑兵
  shatuo: { name: '鸦儿军', tier: 1 },      // 光禄城·§1 #50 李克用沙陀铁骑（原草原#8改挂北方）
  lingwu: { name: '朔方军', tier: 1 },      // 回乐·§1 #53 灵州朔方节度使精锐
  zhongshan: { name: '白狄武卒', tier: 2 },   // 真定·中山国千乘步卒
  wuhuan: { name: '乌桓突骑', tier: 2 },    // 白狼山·§1 #84 曹操收编名骑
  helian: { name: '铁弗卫队', tier: 2 },     // 统万城·赫连勃勃铁弗亲卫
  bing: { name: '并州狼骑', tier: 1 },     // 晋阳·并州狼骑
  you: { name: '上谷突骑', tier: 2 },        // 居庸关·幽州上谷郡
  yi: { name: '白马义从', tier: 1 },           // 紫荆关·易京要塞公孙瓒
  changshan: { name: '常山义军', tier: 2 },   // 倒马关·常山颜杲卿义军
  xianyu: { name: '中山铁卒', tier: 3 },      // 井陉关·鲜虞（战国）
  linhu: { name: '林胡骑', tier: 3 },         // 偏头关·林胡族
  lingqiu: { name: '飞虎军', tier: 3 },       // 平型关·灵丘（五代）
  loufan: { name: '楼烦兵', tier: 3 },        // 宁武关·楼烦（秦汉）
  linyu: { name: '夷丁突骑', tier: 3 },       // 山海关·临榆（明末）
  heng1: { name: '恒山军', tier: 3 },          // 雁门关·代北恒山防线戍军（旗=恒·元岳）
  dai_d: { name: '代国锐卒', tier: 3 },         // 代县·春秋代国
  dongdan: { name: '东丹卫兵', tier: 3 },       // 卑沙城·东丹国
  xuan: { name: '宣府镇军', tier: 3 },          // 宣化·明九边宣府镇
  zhe_d: { name: '折家将兵', tier: 3 },         // 府谷·五代宋初折氏
  shanrong: { name: '山戎突骑', tier: 3 },      // 无终·山戎族
  pingyuan: { name: '高唐戍卒', tier: 3 },      // 平原·高唐州
  dada_ming: { name: '度辽营', tier: 1 },          // 河套·东汉度辽将军镇北百五十年
};
