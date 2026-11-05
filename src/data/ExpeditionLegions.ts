/**
 * 远征精锐番号统一查询（14 文化区）
 *
 * ═══════════════════════════════════════════════════════════════════
 * 【AGENTS.md §十二 — AI 写入前必读，三者防重】
 * ═══════════════════════════════════════════════════════════════════
 *
 * 玩家看见三样东西，必须是三个不同专名：
 *   ① 旗号（旗面 1–2 字）  ② 据点名（地图城名）  ③ 远征番号（跟拍军团名）
 *
 * 红线（违反任一条 = 不得新增条目）：
 *   · 三者两两严格不相等（字符串；只查逐字完全相同）
 *   · 共享汉字不算违规（例：剡中 + 剡城义军、武川镇 + 武川镇军）
 *   · §4.1：据点 XX关/城/邑/州 且旗号=XX → 改据点名
 *
 * 🔴 [2026-10-18 清理] 一个 factionId 只保留**一张**区域表的条目；原 35 个跨表重复
 *   （CentralAsia/Persian、Steppe/Cuman、Japan/Northeast、WestAsia/Persian·Orie）已删旧表重复项，
 *   唯一权威按本文件 `ALL_FACTION_ELITE_LEGIONS` 的展开顺序（后者为准）。
 *
 * **运行时定案：据点本位**（录入 AGENTS §2.2.0；占城 §12.2.1）
 *   · 将/精：按 `cityId` 查录入表；与占城旗号无关
 *   · 录入：据点→势力→武将→精锐；禁止以人物/势力反推据点
 * 数据录入仍用 factionId→番号 + STARTING_CAPITALS 推导 cityId 映射；禁止为番号迁点。
 *
 * 审计：npm run expedition:triple-check  +  npm run expedition:audit
 * tier 标准：AGENTS.md §12.3.1（T0 正史以少胜多 / T1 有名且打过胜仗 / T2 战术高光/战略王牌 / T3 有名/史载专名 / T4 真实存在有番号；乘数 1.5/1.4/1.3/1.2/1.1）
 * tier 重评：十四区各 **1–3 支 T0**（锚点见 scratch/elite_tier_region_anchors.json）；锚点下调须有区内替代。T0 锁定后再审 T1。
 * 史料：史料/古代精锐部队.md
 * ═══════════════════════════════════════════════════════════════════
 */
import { JAPAN_EXPEDITION_ELITE_LEGIONS } from './JapanExpeditionLegions';
import { KOREA_EXPEDITION_ELITE_LEGIONS } from './KoreaExpeditionLegions';
import { NORTHEAST_EXPEDITION_ELITE_LEGIONS } from './NortheastExpeditionLegions';
import { STEPPE_EXPEDITION_ELITE_LEGIONS } from './SteppeExpeditionLegions';
import { WESTERN_EXPEDITION_ELITE_LEGIONS } from './WesternExpeditionLegions';
import { CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS } from './CentralAsiaExpeditionLegions';
import { WEST_ASIA_EXPEDITION_ELITE_LEGIONS } from './WestAsiaExpeditionLegions';
import { ORIE_EXPEDITION_ELITE_LEGIONS } from './OrieExpeditionLegions';
import { TIBET_EXPEDITION_ELITE_LEGIONS } from './TibetExpeditionLegions';
import { DIANQIAN_EXPEDITION_ELITE_LEGIONS } from './DianQianExpeditionLegions';
import { LINGNAN_EXPEDITION_ELITE_LEGIONS } from './LingnanExpeditionLegions';
import { JIANGNAN_EXPEDITION_ELITE_LEGIONS } from './JiangnanExpeditionLegions';
import { NORTH_EXPEDITION_ELITE_LEGIONS } from './NorthExpeditionLegions';
import { CENTRAL_EXPEDITION_ELITE_LEGIONS } from './CentralExpeditionLegions';
import { BASHU_EXPEDITION_ELITE_LEGIONS } from './BashuExpeditionLegions';
import { HEXI_EXPEDITION_ELITE_LEGIONS } from './HexiExpeditionLegions';
import { SLAVIC_EXPEDITION_ELITE_LEGIONS } from './SlavicExpeditionLegions';
import { GERMANIC_EXPEDITION_ELITE_LEGIONS } from './GermanicExpeditionLegions';
import { LATIN_EXPEDITION_ELITE_LEGIONS } from './LatinExpeditionLegions';
import { INDIA_EXPEDITION_ELITE_LEGIONS } from './IndiaExpeditionLegions';
import { PURU_EXPEDITION_ELITE_LEGIONS } from './PuruExpeditionLegions';
import { BERBER_EXPEDITION_ELITE_LEGIONS } from './BerberExpeditionLegions';
import { AMERICA_EXPEDITION_ELITE_LEGIONS } from './AmericaExpeditionLegions';
import { ANDE_EXPEDITION_ELITE_LEGIONS } from './AndeExpeditionLegions';
import { AFRICA_EXPEDITION_ELITE_LEGIONS } from './AfricaExpeditionLegions';
import { MALAY_EXPEDITION_ELITE_LEGIONS } from './MalayExpeditionLegions';
import { EAST_EXPEDITION_ELITE_LEGIONS } from './EastExpeditionLegions';
import { GREEK_EXPEDITION_ELITE_LEGIONS } from './GreekExpeditionLegions';
import { THRACIAN_EXPEDITION_ELITE_LEGIONS } from './ThracianExpeditionLegions';
import { PERSIAN_EXPEDITION_ELITE_LEGIONS } from './PersianExpeditionLegions';
import { CUMAN_EXPEDITION_ELITE_LEGIONS } from './CumanExpeditionLegions';
import { SCYTHIANS_EXPEDITION_ELITE_LEGIONS } from './ScythiansExpeditionLegions';
import { SRIVIJAYA_EXPEDITION_ELITE_LEGIONS } from './SriVijayaExpeditionLegions';
import { STARTING_CAPITALS } from './StartingCapitals';
import { CITIES_V2 } from './cities_v2';
import { FACTION_GENERALS, getRawGeneralByGeneralId } from './FactionGenerals';

export type EliteTier = 0 | 1 | 2 | 3 | 4;
export interface EliteLegionConfig {
  name: string;
  tier: EliteTier;
}

/**
 * 精锐五级制的**档位名**（唯一口径，2026-11-03 主人定）。
 * T0 传奇｜T1 战略｜T2 战术｜T3 知名｜T4 存在 —— UI 一律显示这五个词，不显示 T0/T1 之类代号；
 * 旧称「天神军／王者师／劲锐旅／精英团／戍卫营」已废。
 */
export const ELITE_TIER_LABELS = ['传奇', '战略', '战术', '知名', '存在'] as const;

/** 档位数字 → 档位名（越界回落空串，调用方自行兜底） */
export function getEliteTierDisplayName(tier: EliteTier | number | null | undefined): string {
  if (tier === null || tier === undefined) return '';
  return (ELITE_TIER_LABELS as readonly string[])[tier] ?? '';
}

/** 数据录入：factionId → 番号（14 区表合并，供审计与推导 cityId 映射） */
const ALL_FACTION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {
  ...JAPAN_EXPEDITION_ELITE_LEGIONS,
  ...KOREA_EXPEDITION_ELITE_LEGIONS,
  ...NORTHEAST_EXPEDITION_ELITE_LEGIONS,
  ...STEPPE_EXPEDITION_ELITE_LEGIONS,
  ...WESTERN_EXPEDITION_ELITE_LEGIONS,
  ...CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS,
  ...WEST_ASIA_EXPEDITION_ELITE_LEGIONS,
  ...ORIE_EXPEDITION_ELITE_LEGIONS,
  ...TIBET_EXPEDITION_ELITE_LEGIONS,
  ...DIANQIAN_EXPEDITION_ELITE_LEGIONS,
  ...LINGNAN_EXPEDITION_ELITE_LEGIONS,
  ...JIANGNAN_EXPEDITION_ELITE_LEGIONS,
  ...NORTH_EXPEDITION_ELITE_LEGIONS,
  ...CENTRAL_EXPEDITION_ELITE_LEGIONS,
  ...BASHU_EXPEDITION_ELITE_LEGIONS,
  ...HEXI_EXPEDITION_ELITE_LEGIONS,
  ...SLAVIC_EXPEDITION_ELITE_LEGIONS,
  ...GERMANIC_EXPEDITION_ELITE_LEGIONS,
  ...LATIN_EXPEDITION_ELITE_LEGIONS,
  ...INDIA_EXPEDITION_ELITE_LEGIONS,
  ...PURU_EXPEDITION_ELITE_LEGIONS,
  ...BERBER_EXPEDITION_ELITE_LEGIONS,
  ...AMERICA_EXPEDITION_ELITE_LEGIONS,
  ...ANDE_EXPEDITION_ELITE_LEGIONS,
  ...AFRICA_EXPEDITION_ELITE_LEGIONS,
  ...MALAY_EXPEDITION_ELITE_LEGIONS,
  ...EAST_EXPEDITION_ELITE_LEGIONS,
  ...GREEK_EXPEDITION_ELITE_LEGIONS,
  ...THRACIAN_EXPEDITION_ELITE_LEGIONS,
  ...PERSIAN_EXPEDITION_ELITE_LEGIONS,
  ...CUMAN_EXPEDITION_ELITE_LEGIONS,
  ...SCYTHIANS_EXPEDITION_ELITE_LEGIONS,
  ...SRIVIJAYA_EXPEDITION_ELITE_LEGIONS,
};

/**
 * 🔴 [2026-10-19 主人定：「一个据点，一个势力，可以多个武将，一个武将一支精锐」]
 * 同一据点（同一势力）下挂有多位武将时，每位武将各有专属精锐部队（≤5字、全局不重名）。
 * 也可直接在 `FactionGenerals.ts` 的武将条目上写 `eliteName` / `eliteTier`。
 */
export const GENERAL_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {
  halikanasu_memnon: { name: '罗得雇佣军', tier: 2 },
  dibisi_phoinix: { name: '卡德米亚军', tier: 3 },
  maqidun_antipater: { name: '佩拉近卫军', tier: 2 },
  maqidun_craterus: { name: '持盾卫队', tier: 1 },
  jite_shouling: { name: '盖塔矛骑兵', tier: 3 },
  xila_leosthenes: { name: '雅典同盟军', tier: 2 },
  xila_antiphilus: { name: '阿提卡重步', tier: 3 },
  shang_weiwuji: { name: '信陵死士', tier: 1 },
  teluoyi_maniya: { name: '达尔丹卫军', tier: 3 },
  sogdian_aokexiate: { name: '索格底翼兵', tier: 3 },
  zhou_jifu: { name: '西六师', tier: 2 },
  yin_yuejin: { name: '先登骁果', tier: 2 },
  heti_alialate: { name: '哈吕斯重骑', tier: 3 },
  xibolai_majiabi: { name: '哈斯蒙尼军', tier: 2 },
  dibisi_tahaerka: { name: '库施神弓手', tier: 2 },
  aiji_lameisisi: { name: '阿蒙皇家车', tier: 1 },
  xikesuosi_samutike: { name: '塞易斯卫队', tier: 3 },
  daliushi_iii: { name: '苹果兵卫队', tier: 2 },
  aqimeinide_aertabazanuosi: { name: '波斯门守军', tier: 3 },
  sumeier_nabopalasa: { name: '迦勒底重步', tier: 2 },
  ailan_julushi: { name: '帕萨尔加德', tier: 1 },
  guyashu_tigelate: { name: '亚述近卫车', tier: 1 },
  boluo_vijaya: { name: '僧伽罗卫军', tier: 3 },
  wuer_boshasha: { name: '巴比伦禁卫', tier: 3 },
  sijitai_satraces: { name: '药杀水游骑', tier: 3 },
  yamaxun_faernake: { name: '本都重装骑', tier: 3 },
  gen_astrakhan_khan: { name: '阿斯特拉骑', tier: 3 },
  oirat_ming_gaerdan: { name: '准噶尔铁骑', tier: 1 },

  // ── 2026-10-24 主人令「武将应该都有精锐」：起义／边疆起事首领（各家独立势力；旧 panjun 占位势力已于 2026-10-25 删除）原先没有势力精锐表可继承，
  //    「一个武将一支精锐」逐位补齐。番号取该将本部的名号／族兵／经典战，3–5 字、全局不重名；
  //    分级严格对照精锐五级制 v3（T1 战略／T2 战术尖刀·硬战大捷／T3 文化符号·兵种特色／T4 常规建制·地方部曲）。 ──
  zhao_gerong: { name: '六镇义军', tier: 1 },               // 葛荣：六镇降户骨干，席卷河北数十万众，奠定北齐武力底色（T1 战略）
  zhongxiang_zhongxiang: { name: '洞庭车船', tier: 2 },      // 钟相：依阻洞庭湖，车船水战突击，屡破南宋官军水师（T2 战术）
  yang_bozhou_yangyinglong: { name: '播州苗兵', tier: 2 },  // 杨应龙：盘踞险隘屡挫明军，硬抗万历三大征主力（T2 战术）
  she_shechongming: { name: '永宁夷兵', tier: 2 },          // 奢崇明：奢安之乱主力，陷重镇围成都，野战数次击溃明军（T2 战术）
  haikou_wangzhi: { name: '五峰水师', tier: 2 },            // 汪直：掌东南海权，多桅大舶与火器，正面击溃明军水师（T2 战术）
  bfe_ajibaldo: { name: '铜甲倭兵', tier: 2 },               // 阿只拔都：全员铜甲，荒山之战突击凶悍，李成桂苦战方破（T2 战术）
  chendiaoyan_chendiaoyan: { name: '漳州畲军', tier: 3 },   // 陈吊眼：元初闽南畲汉骨干，山林游击独具特色（T3 知名）
  yezongliu_yezongliu: { name: '处州矿兵', tier: 3 },       // 叶宗留：明正统矿徒结党，火器与坑道战术，转战浙闽赣（T3 知名）
  tan_d_qinhou: { name: '慈利蛮兵', tier: 3 },              // 覃垕：元末明初湘西土家劲卒，扼守天险绝壁（T3 知名）
  boren_ada: { name: '都掌蛮兵', tier: 3 },                 // 阿大：万历都掌僰人精锐，据守九丝山悬崖，死斗至灭亡（T3 知名）
  sou_gaodingyuan: { name: '越嶲叟兵', tier: 4 },           // 高定元：三国南中夷兵主力，山地攀爬与步战特色（T3 知名）
  bfe_xu_hai: { name: '明山倭兵', tier: 3 },                 // 徐海：嘉靖大倭寇主力，纵横江浙（T3 知名）
  qianzhong_wubayue: { name: '平陇苗兵', tier: 3 },         // 吴八月：乾嘉苗变中坚，平陇营寨防守战法突出（T3 知名）
  qianhui_baiyanhu: { name: '陕回骑兵', tier: 3 },           // 白彦虎：同治陕甘回民起事核心，长途奔袭与骑战辨识度高（T3 知名）
  dongzu_wumian: { name: '五开侗兵', tier: 3 },              // 吴勉：洪武黎平侗民起事，称铲平王（T3 知名）
  shengmiao_baoli: { name: '古州苗兵', tier: 4 },            // 包利：雍正古州地方苗民武装，建制可考（T4 存在）
  buyi_d_weichaoyuan: { name: '南笼布依', tier: 4 },         // 韦朝元：嘉庆南笼布依族起事部众，地方民变武装（T4 存在）
  shuizu_panxinjian: { name: '荔波水军', tier: 4 },          // 潘新简：咸丰黔桂水族起事武装，见方志与清廷剿抚档案（T4 存在）
  miaomin_shiliudeng: { name: '松桃苗兵', tier: 4 },         // 石柳邓：乾嘉松桃地方苗众武装，建制明确（T4 存在）
  wumeng_azi: { name: '越州夷兵', tier: 4 },                // 阿资：明初越州彝族土兵，洪武年间为沐春击破斩杀（T4 存在）
  qiufu_qiufu: { name: '罗平义军', tier: 4 },              // 裘甫：唐末浙东农民武装，建元罗平据剡县（T4 存在）
  qiong_rengui: { name: '邛都夷兵', tier: 4 },              // 任贵：东汉建武邛都夷兵，杀越巂太守（T4 存在）
  tingzhou_d_chenmin: { name: '破敌军', tier: 4 },   // 陈敏｜宋｜瑞金｜《宋史·卷四〇二·陈敏传》陈敏以统制殿前司「破敌军」屡摧金人，为南宋名部，建制确凿（T4）。

  // 🔴 2026-10-26 主人令「T0、T1 只能一个人带」：宋国势力精锐「殿前捧日」T1 是赵匡胤（开封）的宿卫番号，
  //    岳飞不该继承。按《精锐图鉴·T0》（郾川/郾城/岳飞/背嵬军，T0；《宋史·岳飞传》郾城以背嵬破拐子马）单列。
  yanchuan_d_yuefei: { name: '背嵬军', tier: 0 },

  // ── 2026-10-26 主人令「T0/T1 只能一个人带」：以下为各将专属精锐（原误挂势力 T0/T1 番号，逐位考据改配） ──
  gen_wang_qiaonian: { name: '三边督标', tier: 4 },   // 汪乔年｜明｜长安｜旧档无；崇祯十五年汪乔年以陕西三边总督率督标出潼关救襄城，兵败身死（《明史·卷二六二·汪乔年传》），督标即总督亲统标兵之制名。
  zuo_d_wufu: { name: '南中叟兵', tier: 3 },   // 吴复｜明｜清溪关｜旧档 南中叟兵 原样沿用：吴复从傅友德平四川、云南，留镇贵州，所统为南中土兵（《明史·卷一三〇·吴复传》）。
  hongzhou_zhuwenzheng: { name: '洪都火卫', tier: 3 },   // 朱文正｜明｜豫章｜旧档 洪都火卫 原样沿用：朱文正守洪都八十五日拒陈友谅，凭火器守城（《明史·卷一一八·朱文正传》）。
  bfe_zhu_chenhao: { name: '宁府护卫', tier: 4 },   // 朱宸濠｜明｜豫章｜旧档无；正德九年宁王朱宸濠奏复护卫，以南昌左卫为宁府护卫，正德十四年起兵即倚为骨干（《明史·卷一一七·宁王传》）。
  liuzhou_shenxiyi: { name: '柳州狼兵', tier: 3 },   // 沈希仪｜明｜潭中｜旧档 柳州狼兵 原样沿用：沈希仪镇柳州，调广西狼兵剿瑶僮（《明史·卷二一一·沈希仪传》）。
  gen_wangzhen: { name: '腾骧四卫', tier: 4 },   // 王振｜明｜北京｜旧档无；王振本无专属部曲，土木之役挟英宗北征所率为京营禁卫，腾骧四卫即明代宦官御马监提督之禁卫番号（《明史·兵志一》）。
  gen_wang_ji: { name: '腾冲戍卒', tier: 3 },   // 王骥｜明｜腾越城｜旧档无；王骥三征麓川奏设腾冲军民指挥使司、筑腾冲石城，正统十年率南征将士一万五千戍守（《明史·卷一七一·王骥传》）。
  gen_hong_chengchou: { name: '宁远戍卒', tier: 4 },   // 洪承畴｜明｜宁远城｜旧档无；洪承畴以蓟辽总督驻宁远督师，松锦之战统关宁八总兵出援（《明史·卷二五九·洪承畴传》），故取驻地戍卒。
  linhu_mafang: { name: '山西镇骑', tier: 3 },   // 马芳｜明｜偏头关｜旧档 山西镇骑 原样沿用：马芳镇山西、大同，以骑兵屡破俺答（《明史·卷二一一·马芳传》）。
  yi_yuqian: { name: '神机营', tier: 2 },   // 于谦｜明｜北京｜旧档「易州戍兵」与其据点北京、事迹不合，改；《明史·卷一七〇·于谦传》土木变后选京营精锐十万分十营团操，号十团营。
  linyu_wusangui: { name: '夷丁突骑', tier: 2 },   // 吴三桂｜明｜山海关｜旧档 夷丁突骑 原样沿用：吴三桂镇山海关，收夷丁为突骑，为关宁军锋（《明史·卷三〇九·流贼传》）。
  jinzhou_lichengliang: { name: '辽东铁骑', tier: 2 },   // 李成梁｜明｜徒河｜旧档 辽东铁骑 原样沿用：李成梁镇辽东，以家丁铁骑屡破土蛮诸部（《明史·卷二三八·李成梁传》）。
  shanrong_lanyu: { name: '蓟镇标营', tier: 3 },   // 蓝玉｜明｜无终｜旧档 蓟镇标营 原样沿用：蓝玉北征出大宁、驻蓟州一线，捕鱼儿海大捷（《明史·卷一三二·蓝玉传》）。
  xuan_xuda: { name: '宣大劲骑', tier: 1 },   // 徐达｜明｜北京｜旧档 宣大劲骑 原样沿用：徐达统北伐诸军出宣府、大同，骑兵为锋（《明史·卷一二五·徐达传》）。
  yansui_wangwei: { name: '榆林铁骑', tier: 4 },   // 王威｜明｜榆林｜旧档 榆林铁骑 原样沿用：王威为延绥总兵，镇榆林（《明史·卷二六三·王威传》）。
  jinan_tiexuan: { name: '神牌弩手', tier: 2 },   // 铁铉｜明｜历下｜旧档 神牌弩手 原样沿用：铁铉守济南，悬太祖神牌、以弩矢拒燕军（《明史·卷一四二·铁铉传》）。
  sunqin_sunchuanting: { name: '督标秦军', tier: 3 },   // 孙传庭｜明｜潼关｜旧档 督标秦军 原样沿用：孙传庭以陕西总督练秦兵、守潼关（《明史·卷二六二·孙传庭传》）。
  suzhou_d_shikefa: { name: '江北四镇', tier: 3 },   // 史可法｜明｜淮安｜旧档《武将百科》定「江北四镇」T3；《明史·卷二百七十四·史可法传》载其督师淮扬、节制江北四镇（高杰、刘泽清、刘良佐、黄得功），与其据点淮安相符，原样沿之。
  huai_zhuyuanzhang: { name: '淮西子弟', tier: 2 },   // 朱元璋｜明｜金陵｜旧档定「淮西子弟」T3；《明史·卷一·太祖本纪》载起兵濠梁，所部徐达、汤和等皆淮西旧籍，即其本部，原样沿之。
  luming_luxiangsheng: { name: '天雄军', tier: 2 },   // 卢象升｜明｜大名｜旧档定「天雄军」T2；《明史·卷二百六十一·卢象升传》载其知大名府、整饬大名道，练天雄军保卫大名府，名动天下，原样沿之。
  ran_d_ranshouzhong: { name: '酉阳土兵', tier: 4 },   // 冉守忠｜明｜秀山｜旧档定「酉阳土兵」T4；冉氏世袭酉阳宣抚司土官，秀山为其辖地（《明史·四川土司传》重庆酉阳宣抚司），所部土兵即本部，原样沿之。
  tujia_d_qinliangyu: { name: '白杆兵', tier: 2 },   // 秦良玉｜明｜石柱｜旧档定「白杆兵」T2；《明史·卷二百七十·秦良玉传》载石柱白杆兵以白杆长枪著名，浑河、重庆诸战皆用，原样沿之。
  mu_lijiang_muzeng: { name: '丽江土兵', tier: 3 },   // 木增｜明｜大研｜旧档定「丽江土兵」T3；木氏世袭丽江土知府，所部纳西土兵（《明史·云南土司传》丽江府），与其据点大研相符，原样沿之。
  pingnan_muying: { name: '云南卫军', tier: 3 },   // 沐英｜明｜滇池｜考据（旧档无）：《明史·卷一百二十六·沐英传》载洪武十四年从傅友德平云南、十五年留镇，二十一年定边府以三行火铳破思伦发象阵；其本部即云南都司卫所军，故定「云南卫军」，属常规建制地方部曲，T4。
  hani_d_zhebi: { name: '思陀甸兵', tier: 4 },   // 遮比｜明｜思陀｜旧档定「思陀甸兵」T4；遮比为临安路思陀甸长官司哈尼土官（《明史·云南土司传》），思陀即其世守之地，部众即甸兵，原样沿之。
  dayu_wangshouren: { name: '南赣标军', tier: 3 },   // 王守仁｜明｜南康｜旧档定「南赣标军」T3；《明史·卷一百九十五·王守仁传》载其巡抚南赣、平漳南横水浰头诸寨，所统即南赣抚标，原样沿之。
  fang_guozhen_fangguozhen: { name: '甬江水营', tier: 4 },   // 卢镗｜明｜宁波｜旧档定「甬江水营」T4；卢镗嘉靖间镇宁波、统定海水师抗倭（维基「卢镗」条、《明史》抗倭诸传），甬江即其驻地，原样沿之。
  xiang_d_xiangdakun: { name: '散毛土兵', tier: 4 },   // 覃大旺｜明｜散毛关｜旧档定「散毛土兵」T4；覃氏世袭施州卫散毛宣抚司土官，来凤即散毛故地（《明史·湖广土司传》），所部土兵即本部，原样沿之。
  chizhou_changyuchun: { name: '九华伏兵', tier: 3 },   // 常遇春｜明｜大通｜旧档定「九华伏兵」T3；《明史·卷一百二十五·常遇春传》载其从朱元璋战池州、九华山一带，大通即池州江岸，时地相符，原样沿之。
  dongshengwei_wangyue: { name: '九边夜不收', tier: 3 },   // 王越｜明｜榆林｜旧档定「九边夜不收」T2；《明史·卷一百七十一·王越传》载其三出塞袭鞑靼（红盐池、威宁海），夜不收为九边哨探锐卒，榆林属延绥镇，原样沿之。
  zu_d_yuanchonghuan: { name: '关宁铁骑', tier: 1 },   // 袁崇焕｜明｜宁远城｜旧档定「关宁铁骑」T1；《明史·卷二百五十九·袁崇焕传》载其守宁远、抚练关宁军，宁远即其驻地，原样沿之。
  nuergan_kangwang: { name: '奴儿干卫军', tier: 3 },   // 康旺｜明｜特林｜旧档定「奴儿干卫军」T3；康旺任奴儿干都司都指挥使、驻特林（《明史·卷九十·兵志》卫所及永宁寺碑），与其据点相符，原样沿之。
  jingdong_taohong: { name: '景东象卫', tier: 4 },   // 陶洪｜明｜银生城｜旧档定「景东象卫」T4；陶氏世袭景东府土知府，银生城即景东（《明史·云南土司传》景东府），土司旧有象阵，原样沿之。
  gen_yang_hao: { name: '定辽卫军', tier: 4 },   // 杨镐｜明｜襄平｜旧档无；辽阳为明辽东都司治所，置定辽前、后、左、右、中五卫及东宁卫（《明史·地理志二》辽东都司），万历末杨镐以辽东经略驻辽阳、由萨尔浒调四路出师（《明史·卷二五九·杨镐传》），故取驻地卫军。
  gen_qiu_luan: { name: '大同铁骑', tier: 3 },   // 仇鸾｜明｜大同｜旧档无；仇鸾嘉靖中佩镇朔大将军印镇大同（《明史·卷一七六·仇鸾传》），大同镇为九边劲镇，边人称「大同士马甲天下」，故取镇标铁骑。
  qian_d_yudayou: { name: '嘉兴水师', tier: 3 },   // 俞大猷｜明｜宁波｜旧档 嘉兴水师 原样沿用：俞大猷以浙江都司佥书守浙东，练水师破倭于嘉兴、王江泾一带（《明史·卷二一二·俞大猷传》）。
  gen_li_jinglong: { name: '京卫戍卒', tier: 4 },   // 李景隆｜明｜金陵｜旧档无；李景隆以曹国公掌左军都督府，建文元年率京卫诸军五十万北伐、溃于郑村坝（《明史·卷一二六·李景隆传》），明初南京置京卫数十（《明史·兵志二》），故取京师卫军。
  mao_wenlong_maowenlong: { name: '东江劲旅', tier: 3 },   // 毛文龙｜明｜皮岛｜旧档 东江劲旅 原样沿用：毛文龙开镇皮岛、号东江镇，招集辽民为兵屡袭后金（《明史·卷二五九·毛文龙传》）。
  hu_d_husansheng: { name: '凉州达军', tier: 4 },   // 吴允诚｜明｜姑臧｜旧档 白峤汛卫 与史实冲突，改 凉州达军：白峤在浙东宁海，且「汛」为清代绿营汛地之制，与永乐间河西降附无涉；吴允诚本名把都帖木儿，永乐三年率部归附、赐居凉州，所部蒙古降众明人称「达官」、其军号「达军」（《明史·卷一五六·吴允诚传》）。
  gen_feng_sheng: { name: '嘉峪戍卒', tier: 4 },   // 冯胜｜明｜嘉峪关｜旧档无；冯胜洪武五年下河西、追元将至瓜沙，还师置嘉峪关戍守（《明史·卷一二九·冯胜传》），故取关城戍卒。
  chijin_qiewangshijia: { name: '赤金营', tier: 4 },   // 且旺失加｜明｜赤金堡｜旧档 赤金营 原样沿用：且旺失加为关西赤金蒙古部首领，居赤金堡（今玉门赤金），明置赤金蒙古卫羁縻（《明史·卷三三〇·西域传二》）。
  gen_wang_tong: { name: '交州卫军', tier: 4 },   // 王通｜明｜昇龙｜旧档无；永乐设交趾都指挥使司，置交州等卫（《明史·地理志》交趾），宣德间王通守东关（昇龙）拒黎利、被围援绝（《明史·卷一五四·王通传》）。
  song_zhangjun: { name: '秦陇锐士', tier: 3 },   // 张浚｜宋｜略阳｜旧档无；张浚以川陕宣抚处置使合陕西五路兵与金战于富平，所统即秦陇西军劲卒（《宋史·卷三六一·张浚传》）。
  song_wangbing: { name: '胜捷军', tier: 3 },   // 王禀｜宋｜晋阳｜旧档无；胜捷军为童贯宣和间于陕西选诸军精壮所建亲兵，王禀继张师正为统制，率三千人守太原二百五十余日、城破投汾水死（《宋史·卷四四六·王禀传》、太原保卫战）。
  kejia_wentianxiang: { name: '黄连峒丁', tier: 4 },   // 黄凤｜宋｜黄连｜旧档无；黄连即汀州宁化古黄连峒，隋巫罗俊筑堡自守之地，宋时闽广溪峒丁壮号「峒丁」（《宋史·兵志》峒丁），黄凤以客家义兵守汀州。
  chaozhou_d_mafa: { name: '潮州义勇', tier: 4 },   // 马发｜宋｜海阳｜旧档 潮州义勇 原样沿用：马发为宋潮州摧锋寨正将，率州兵民勇守潮州拒元，城破死之（《宋史·卷四五一·马发传》）。
  shaozhou_zhangzhensun: { name: '大庾岭义旅', tier: 4 },   // 张镇孙｜宋｜番禺｜旧档 大庾岭义旅 原样沿用：张镇孙宋末聚兵于广州、大庾岭间抗元，复广州城，兵败被执（《宋史·卷四五一·张镇孙传》）。
  qian_songjingyang: { name: '矩州戍卒', tier: 4 },   // 宋景阳｜宋｜顺元｜旧档 矩州戍卒 原样沿用：矩州即今贵阳，宋景阳宋初入黔领蛮州、世守矩州一带（《宋史·卷四九六·蛮夷传四》）。
  xinjiang_maji: { name: '静江弩手', tier: 4 },   // 马塈｜宋｜始安｜旧档 静江弩手 原样沿用：马塈以宋静江府守将缮城积粟、率军民守静江三月，弩矢石炮拒元兵（《宋史·卷四五一·马塈传》）。
  yanzhou_zhongshiheng: { name: '环州弓箭手', tier: 3 },   // 种世衡｜宋｜方渠｜旧档「步跋子」为西夏步兵番号，与宋将政权/兵种不符，改；《宋史·卷三三五·种世衡传》知环州教蕃汉弓箭手守边。
  song_zhaoguangyi: { name: '御龙直', tier: 3 },   // 赵光义｜宋｜开封｜《宋史·兵志》殿前司诸班直有御龙直，为皇帝亲卫骑军；赵光义以晋王入继、亲征北汉，亲军取此班直（wikiElite 空，自定）
  song_renfu: { name: '环庆边兵', tier: 4 },   // 任福｜宋｜合水｜《宋史·任福传》任福为环庆路副都部署，庆历元年好水川之役率环庆、泾原边兵战殁（wikiElite 空，自定）
  changshan_yangyanzhao: { name: '倒马寒锋', tier: 3 },   // 杨延昭｜宋｜倒马关｜旧档原样采用；《宋史·杨延昭传》杨延昭守遂城、倒马关一线，辽人惮之
  wangyan_wangyan: { name: '八字军', tier: 2 },   // 王彦｜宋｜安康｜旧档原样采用；《宋史·王彦传》部众面刺「赤心报国，誓杀金贼」八字，号八字军
  zhe_d_zheyuqing: { name: '折家将兵', tier: 3 },   // 折御卿｜宋｜府谷｜旧档原样采用；《宋史·折御卿传》府州折氏世领麟府蕃汉兵，御卿袭知府州
  heng1_yangye: { name: '杨无敌军', tier: 2 },   // 杨业｜宋｜雁门关｜旧档原样采用；《宋史·杨业传》契丹畏之，号曰「杨无敌」，雁门之捷其部为锋
  xiangzhou_lvwenhuan: { name: '襄樊捍卫', tier: 3 },   // 吕文焕｜宋｜襄阳｜旧档原样采用；《宋史·吕文焕传》吕文焕守襄阳六年，襄樊城守之兵
  yingzhou_d_liuqi: { name: '顺昌锐士', tier: 2 },   // 刘锜｜宋｜顺昌｜《宋史纪事本末·卷十六》绍兴十年刘锜率所部及殿司卒守顺昌，大破金兀术铁浮图（wikiElite 空，自定）
  didao_wangshao: { name: '熙河蕃兵', tier: 1 },   // 王韶｜宋｜狄道｜旧档原样采用；《宋史·王韶传》熙河开边，招纳蕃部为兵，复河湟二千里
  fengzhou_wujie: { name: '和尚原锐卒', tier: 2 },   // 吴玠｜宋｜大散关｜旧档原样采用；《宋史·吴玠传》和尚原之战以驻队矢迭射大破金军
  sizhou_hanshizhong: { name: '克敌军', tier: 2 },   // 韩世忠｜宋｜淮安｜旧档原样采用；《宋史·韩世忠传》韩世忠创克敌弓，所部号克敌军，黄天荡困兀术
  zaoyang_d_menggong: { name: '忠顺军', tier: 1 },   // 孟珙｜宋｜枣阳｜旧档原样采用；《宋史·孟珙传》孟珙收编降人创忠顺军，枣阳、蔡州之役为劲旅
  qing_quduan: { name: '泾原锐骑', tier: 2 },   // 曲端｜宋｜合水｜旧档原样采用；《宋史·曲端传》曲端为泾原路都统制，所部泾原骑兵为西边之最
  zhai_han_diqing: { name: '蕃落骑', tier: 1 },   // 狄青｜宋｜肤施｜旧档原样采用；《宋史·狄青传》狄青统鄜延、泾原蕃落骑兵，昆仑关夜袭破侬智高
  huizhou_yaosi: { name: '会州边兵', tier: 4 },   // 姚兕｜宋｜祖厉｜旧档原样采用；《宋史·姚兕传》姚兕守会州、祖厉一带，以边兵御西夏
  huan_zhongshidao: { name: '神臂弓手', tier: 2 },   // 种师道｜宋｜方渠｜旧档原样采用；《宋史·种师道传》种氏世将西边，所部以神臂弓拒夏人骑冲
  mengcheng_d_gaoqiong: { name: '山桑弓手', tier: 4 },   // 高琼｜宋｜开封｜旧档原样采用；《宋史·高琼传》高琼亳州蒙城（汉山桑）人，澶渊之役统禁军弓手
  hezhou_wangjian: { name: '兴戎军', tier: 1 },   // 王坚｜宋｜钓鱼城｜旧档《武将百科》作兴戎军，档位 T1 照录；《宋史·王坚传》载其守合州钓鱼城、统本部兴戎军御蒙哥。
  tian_sizhou_tianyougong: { name: '思州土兵', tier: 4 },   // 田祐恭｜宋｜㵲溪｜旧档《武将百科》作思州土兵，档位 T4 照录；《宋史·蛮夷传》记思州田氏世领其地、率土兵听调。
  wanzhou_shangguankui: { name: '天生城军', tier: 4 },   // 上官夔｜宋｜南浦｜旧档《武将百科》作天生城军，档位 T4 照录；上官夔守万州天生城抗元，见《宋史·忠义传》及万历《重庆府志》。
  shenshi_wentianxiang: { name: '勤王义军', tier: 4 },   // 文天祥｜宋｜杭州｜旧档《武将百科》作勤王义军，档位 T4 照录；《宋史·文天祥传》载其尽散家资起兵勤王。
  yiyang_d_mengzongzheng: { name: '申息锐师', tier: 3 },   // 孟宗政｜宋｜枣阳｜旧档《武将百科》作申息锐师，档位 T3 照录；《宋史·孟宗政传》载其守枣阳、屡破金兵，部曲为荆湖精锐。
  luoping_zhangshijie: { name: '摧锋军', tier: 2 },   // 张世杰｜宋｜厓山｜旧档《武将百科》作摧锋军，档位 T2 照录；《宋史·张世杰传》载其统摧锋军转战，厓山死战。
  duanzhou_d_caojin: { name: '端州义勇', tier: 4 },   // 曹觐｜宋｜肇庆｜旧档《武将百科》作端州义勇，档位 T4 照录；《宋史·曹觐传》载其知端州、率州兵义勇御侬智高死事。
  daozhou_yangzaixing: { name: '郾城骁骑', tier: 2 },   // 按史：杨再兴归岳飞后统骑军，郾城之战单骑突阵欲擒兀术，小商桥以三百骑杀敌二千（《宋史·卷三六八·杨再兴传》）；道州只是其早年籍贯与起事地，不改配道州乡兵。
  wan_liuyuan: { name: '野人原义兵', tier: 4 },   // 刘源｜宋｜皖口｜旧档《武将百科》作野人原义兵，档位 T4 照录；《宋史·忠义传》载刘源结寨野人原、聚义兵抗元。
  xie_xiefangde: { name: '信州弩士', tier: 4 },   // 谢枋得｜宋｜葛溪｜旧档《武将百科》作信州弩士，档位 T4 照录；《宋史·谢枋得传》载其知信州、率民兵守御。
  changshaguo_xinqiji: { name: '飞虎军', tier: 2 },   // 辛弃疾｜宋｜长沙｜旧档《武将百科》作飞虎军，档位 T2 照录；《宋史·辛弃疾传》载其帅湖南创飞虎军，雄镇一方。
  song_peiji: { name: '秦凤戍卒', tier: 4 },   // 裴济｜宋｜大散关｜裴济守灵州殉国，移大散关（CENTRAL）后取秦凤路关隘戍卒番号（《宋史·兵志》秦凤路戍卒守大散关诸寨）。
  qiliqiya_pangpei: { name: '埃沃卡提', tier: 3 },   // 庞培｜罗马｜阿达纳｜《恺撒·内战记》卷三载法萨卢斯之战庞培军以历次东征召还的老兵（evocati）为军锋，故取其军号为番号。
  meisuobudamiya_shoujiang: { name: '斯基提卡', tier: 4 },   // 萨宾｜罗马｜尼西比斯｜斯特拉波《地理志》与《百官志》载罗马叙利亚—美索不达米亚防线常驻第四斯基提卡军团（Legio IV Scythica），尼西比斯守将萨宾取其军号。
  bfe3_4: { name: '特里阿里', tier: 4 },   // 拉维利乌斯｜罗马｜罗马城｜普鲁塔克《皮洛士传》载前280 赫拉克利亚之战，罗马执政官拉维努斯以第三线老兵特里阿里（triarii）死战不退。
  bfe3_63: { name: '日耳曼尼卡', tier: 4 },   // 霍尔多尼乌斯｜罗马｜罗马城｜塔西佗《历史》卷一载 69 年日耳曼总督霍尔多尼乌斯统莱茵军团，含驻博纳的第一日耳曼尼卡军团（Legio I Germanica）。
  bfe3_51: { name: '昔兰尼加', tier: 4 },   // 佩特罗尼乌斯｜罗马｜罗马城｜斯特拉波《地理志》卷一七载前25–前21 埃及总督佩特罗尼乌斯远征麦罗埃，所率即驻埃及的第三昔兰尼加军团（Legio III Cyrenaica）。
  bfe_gaius_livius: { name: '罗马舰队', tier: 3 },   // 李维乌斯｜罗马｜罗马城｜李维《罗马史》卷三七载前190 欧里梅敦海战，罗马统帅李维乌斯率罗马舰队破安条克水师。
  gen_constantine_great: { name: '约维亚尼', tier: 2 },   // 君士坦丁｜罗马｜特里尔｜《百官志》（Notitia Dignitatum）载约维亚尼（Ioviani）为戴克里先朝创设的宫廷野战军团，君士坦丁朝列近卫野战军，312 年随其破马克森提乌斯于米尔维安大桥。
  gen_julian_apostate: { name: '科尔努提', tier: 2 },   // 尤里安｜罗马｜里昂｜阿米阿努斯·马塞利努斯《罗马史》卷一六载 357 年斯特拉斯堡之战，尤里安以科尔努提（Cornuti）为前锋击破阿勒曼尼。
  gen_bonifatius: { name: '布切拉里', tier: 3 },   // 博尼法提乌斯｜罗马｜希波｜普罗柯比《战史》卷三载 430 年汪达尔人围希波，博尼法提乌斯以私兵布切拉里（bucellarii）死守孤城。
  disidelusi_disidelusi: { name: '奥古斯塔', tier: 4 },   // 蒂斯德鲁斯督造｜罗马｜杰姆｜《百官志》与阿非利加碑铭载罗马阿非利加常驻第三奥古斯塔军团（Legio III Augusta），蒂斯德鲁斯（杰姆）在其防区。
  gen_kangxi: { name: '虎枪营', tier: 3 },   // 康熙｜清｜沈阳｜康熙二十三年设虎枪营，于上三旗亲军选善猎者隶御前，随驾狩猎兼宿卫，为帝室独有之亲军（《清史稿·兵志》；「虎枪营」条：清代禁卫军之一）。满洲兵种特色，与盛京满洲同文化。
  gen_nikan: { name: '满洲护军', tier: 4 },   // 尼堪｜清｜沈阳｜《清史稿·尼堪传》：顺治九年尼堪以敬谨亲王统八旗护军南征湖南，衡州中伏战死；护军即满洲巴牙喇，八旗常备精锐（《清史稿·兵志》）。
  xingan_hailancha: { name: '索伦营', tier: 2 },   // 海兰察｜清｜北京｜旧档原样保留（wikiElite=索伦营/T2）：海兰察为索伦部人，乾隆间率索伦劲骑征准噶尔、金川、台湾（《清史稿·海兰察传》），番号与本部族、兵种相符。
  aisin_d_huangtaiji: { name: '巴牙喇军', tier: 1 },   // 皇太极｜清｜赫图阿拉｜旧档原样保留（wikiElite=巴牙喇军/T1）：巴牙喇为后金—清八旗护军精锐，皇太极亲统巴牙喇破明军（《清史稿·太宗本纪》《兵志》）。
  manzhou_nuerhachi: { name: '白甲兵', tier: 1 },   // 努尔哈赤｜清｜萨尔浒｜旧档原样保留（wikiElite=白甲兵/T1）：白甲（白摆牙喇）为八旗护军中最锐者，努尔哈赤以白甲兵破九部、下辽沈（《清史稿·太祖本纪》《兵志》）。
  jilin_fujun: { name: '吉林屯营', tier: 4 },   // 富俊｜清｜龙潭山｜旧档原样保留（wikiElite=吉林屯营/T4）：富俊任吉林将军，主持双城堡、伯都讷屯垦，移京旗就耕（《清史稿·富俊传》），屯营与驻地吉林相符。
  hezhe_shaerhuda: { name: '松花伏涛', tier: 2 },   // 沙尔虎达｜清｜乌云｜旧档原样保留（wikiElite=松花伏涛/T2，时代、地点、兵种皆合）：顺治十五年沙尔虎达以宁古塔昂邦章京率水陆兵邀击俄军斯捷潘诺夫部于松花江、黑龙江交汇处，全歼之（《清史稿·沙尔虎达传》）。
  dongping_langtan: { name: '东平镇营', tier: 4 },   // 郎坦｜清｜瑷珲｜旧档原样保留（wikiElite=东平镇营/T4）：郎坦康熙二十一年与彭春往侦雅克萨，二十四年攻克之，驻黑龙江、瑷珲（《清史稿·郎坦传》），番号与驻地、时代相符。
  maomingan_suoetu: { name: '额尔古纳骑', tier: 4 },   // 索额图｜清｜北京｜旧档原样保留（wikiElite=额尔古纳骑/T4）：索额图康熙二十八年以领侍卫内大臣赴尼布楚与俄国定界，额尔古纳河即东段界河（《清史稿·索额图传》）。
  agui: { name: '健锐营', tier: 2 },   // 阿桂｜清｜美诺寨｜旧档原样保留（wikiElite=健锐营/T2）：健锐营为乾隆十四年所设云梯兵，专攻碉卡；阿桂平大小金川，以健锐营攻碉（《清史稿·阿桂传》《兵志》），与其据点美诺寨相符。
  gen_mingrui: { name: '盛京八旗', tier: 4 },   // 明瑞｜清｜沈阳｜明瑞满洲镶黄旗出身，沈阳（NORTHEAST）盛京八旗劲旅为其旗籍根本（《清史稿·兵志一》盛京驻防八旗）。
  kalun_dexinga: { name: '东三省马队', tier: 4 },   // 德兴阿｜清｜沈阳｜德兴阿黑龙江齐齐哈尔索伦部出身，以东三省马队驰骋江北、辽左（《清史稿·德兴阿传》黑龙江马队劲旅）。
  gen_furdan: { name: '科布多戍卒', tier: 4 },   // 傅尔丹｜清｜科布多｜《清史稿·傅尔丹传》：雍正七年授靖逆将军，雍正八年于科布多筑城屯兵为西路军大营，九年由此出师致和通泊之败；戍卒与据点科布多、时代相符。
  duonaobaojia_tzimiskes: { name: '不死军', tier: 2 },   // 齐米斯基｜拜占｜君士坦丁堡｜《牛津拜占庭辞典》Athanatoi 条：970 年齐米斯基为对罗斯战争新建「不死军」重装突骑，普雷斯拉夫与多罗斯托隆之战由其定胜负（维基 Immortals (Byzantine Empire)）。
  baizanting_diaofeilusi: { name: '阿克里泰', tier: 2 },   // 狄奥斐卢斯｜拜占｜君士坦丁堡｜838 年安曾之战，狄奥斐卢斯亲率东方边区阿克里泰边军拒阿拔斯军（维基 Battle of Anzen；《塞奥法尼斯续编》）；与阿历克塞同番同档 T2。
  bfe_andronikos_komnenos: { name: '赫塔雷亚', tier: 3 },   // 科穆宁｜拜占｜君士坦丁堡｜科穆宁朝宫廷亲卫「赫塔雷亚」（Hetaireia）宿卫皇帝，安德洛尼卡一世 1182 年入京即倚之控制京畿（维基 Hetaireia；《拜占庭帝国史》近卫条）。
  bfe_isaac_komnenos: { name: '铁甲弓骑', tier: 3 },   // 伊萨克｜拜占｜君士坦丁堡｜科穆宁朝军制以重装弓骑（hippotoxotai）为锋，1184 年伊萨克据塞浦路斯自立所部即此（维基 Byzantine army (Komnenian era)、Isaac Komnenos of Cyprus）。
  baizanting_nikephoros_phokas: { name: '铁甲重骑', tier: 2 },   // 尼基弗鲁斯二世｜拜占｜君士坦丁堡｜尼基弗鲁斯二世《军事训令》定铁甲重骑（kataphraktoi）编装，961 年克干地亚、965 年复奇里乞亚皆赖之（维基 Praecepta Militaria、Nikephoros II Phokas）。
  gen_constantine_xi: { name: '克里特弓手', tier: 3 },   // 君士坦丁十一世｜拜占｜君士坦丁堡｜1453 年君士坦丁堡之围，克里特弓手据守城墙段力战至城破（维基 Fall of Constantinople）。
  baizanting_nikephoros_i: { name: '斯科莱', tier: 3 },   // 尼基弗鲁斯一世｜拜占｜君士坦丁堡｜811 年普利斯卡之役，尼基弗鲁斯一世率近卫塔格马「斯科莱」（Scholai）亲征保加利亚，兵败身亡（《塞奥法尼斯编年史》；维基 Battle of Pliska）。
  baizanting_romanosi: { name: '德罗蒙', tier: 3 },   // 罗曼努斯一世｜拜占｜君士坦丁堡｜罗曼努斯一世起家于帝国舰队司令（droungarios tou stolou），以德罗蒙桨帆战舰为本钱夺位（维基 Romanos I Lekapenos）。
  baizanting_isaac_ii: { name: '普罗尼亚', tier: 3 },   // 伊萨克二世｜拜占｜君士坦丁堡｜安格洛斯朝野战主力为普罗尼亚封土骑兵，伊萨克二世 1185–1190 年对保加利亚、诺曼诸役皆用之（维基 Pronoia；《拜占庭帝国史》）。
  baizanting_alexios_v: { name: '城垣戍卒', tier: 4 },   // 阿莱克修斯五世｜拜占｜君士坦丁堡｜旧档「瓦兰吉卫队」与雅罗斯拉夫 T1 重名，改；霍尼亚提斯《历史》：1204 年阿莱克修斯五世据君士坦丁堡城垣拒第四次十字军，陆墙戍卒与瓦兰吉共守。
  bitiniya_diaoduoer: { name: '尼西亚戍兵', tier: 4 },   // 狄奥多尔｜拜占｜尼凯亚｜1204 年君士坦丁堡陷后狄奥多尔一世据尼西亚立国，都城戍兵为其立国之本（维基 Empire of Nicaea、Theodore I Laskaris）。
  bfe_sinan_pasha: { name: '塞克班', tier: 4 },   // 锡南帕夏｜奥斯｜埃迪尔内｜旧档无；锡南帕夏（Koca Sinan Paşa，卒1596）五度出任大维齐尔，征也门、匈牙利皆自募塞克班（sekban）火枪手为部曲（维基「Koca Sinan Pasha」／《奥斯曼帝国史》）。
  osman_kapadan: { name: '阿扎普', tier: 3 },   // 卡尼姆穆罕默德帕夏｜奥斯｜布尔萨｜旧档无；卡尼姆穆罕默德帕夏即奥斯曼海军大臣（Kapudan Pasha），其桨船所载接舷陆战兵为阿扎普（azap），维基「Kapudan Pasha」「Azap」。为其驻布尔萨（帝国旧都、船厂所在）之海军本部。
  gen_kara_mustafa: { name: '卡皮库鲁', tier: 3 },   // 卡拉穆斯塔法｜奥斯｜布尔萨｜旧档无；1683年围维也纳，卡拉穆斯塔法统卡皮库鲁（kapıkulu，宫廷常备步骑）为主力（维基「维也纳之战 (1683年)」）。
  gen_mustafa_pasha: { name: '德里轻骑', tier: 4 },   // 穆斯塔法帕夏｜奥斯｜布尔萨｜旧档无；奥斯曼帝国时代巴尔干—安纳托利亚帕夏帐下突击轻骑为德里（deli，字面「狂人」），维基「Deli (military)」。
  gen_suleiman: { name: '穆特费里卡', tier: 2 },   // 苏莱曼｜奥斯｜布尔萨｜旧档无；苏莱曼一世亲征贝尔格莱德、罗得岛、莫哈奇（1526大捷）时随驾近卫骑兵即穆特费里卡（müteferrika），维基「Suleiman the Magnificent」。
  gen_bayezid_i: { name: '西帕希', tier: 3 },   // 巴耶济德一世｜奥斯｜布尔萨｜旧档无；1396年尼科波利斯之役，巴耶济德一世以安纳托利亚、鲁米利亚西帕希（sipahi）提马尔骑兵为主力大破十字军（维基「尼科波利斯战役」）。
  gen_mehmed_giray: { name: '阿克曼戍卒', tier: 4 },   // 迈赫迈德｜奥斯｜阿克曼｜旧档无；阿克曼（比爾霍羅德，Dniester 河口要塞）为克里米亚汗国与奥斯曼共守之边塞，汗国骑兵与戍卒驻此，迈赫迈德为该地守将（维基「Bilhorod-Dnistrovskyi」「克里米亚汗国」），故取驻地戍卒。
  gen_osman_i: { name: '瑟于特加齐', tier: 4 },   // 奥斯曼一世｜奥斯｜瑟于特｜旧档无；奥斯曼一世以瑟于特（Söğüt）为基地，聚加齐（gazi）武士袭取拜占庭边堡起家（维基「奥斯曼一世」），据点瑟于特，故取本地加齐部曲。
  lumiliya_lalashahin: { name: '阿金日', tier: 3 },   // 拉拉沙欣｜奥斯｜埃迪尔内｜旧档无；拉拉沙欣任鲁米利亚贝勒贝伊，率阿金日（akıncı）边锋轻骑取其驻地埃迪尔内，1371年马里查河破塞尔维亚军（维基「Lala Shahin Pasha」）。
  gen_barbarossa: { name: '莱文特', tier: 3 },   // 巴巴罗萨｜奥斯｜阿尔及尔｜旧档无；海雷丁·巴巴罗萨以阿尔及尔为基地，麾下为莱文特（levend）海上义勇与加莱桨手，1538年普雷韦扎大破神圣同盟舰队（维基「Barbarossa Hayreddin Pasha」）。
  gen_dragut: { name: '图芬克奇', tier: 4 },   // 德拉古特｜奥斯｜的黎波里｜旧档无；德拉古特（Turgut Reis）以的黎波里为基地，桨船载图芬克奇（tüfekçi）火枪兵接舷夺船（维基「Turgut Reis」／「奥斯曼帝国海军」）。
  tubo_xinuoluo: { name: '伍如锐士', tier: 3 },   // 悉诺逻恭禄｜吐蕃｜逻些｜旧档无；吐蕃军政分四如，逻些居伍如（dbus ru）之中、兵民合一（《敦煌本吐蕃历史文书》赞普世系与四如建置）；悉诺逻恭禄即以此腹地军翼寇唐瓜、甘诸州（《旧唐书·吐蕃传》）。
  tubo_lunmangre: { name: '逻些牙兵', tier: 4 },   // 论莽热｜吐蕃｜逻些｜旧档无；论莽热为赞普帐下统军重臣，贞元十七年（801）率众援维州，被韦皋大破生擒（《旧唐书·韦皋传》），本部出逻些，故取逻些牙兵。
  gongbu_gongbumangbuzhi: { name: '工布长弓手', tier: 3 },   // 工布莽布支｜吐蕃｜太昭｜旧档 工布长弓手 原样沿用：工布莽布支为工布（今太昭一带）地方小王，其部以弓矢见长（《敦煌本吐蕃历史文书》工布第穆萨摩崖刻辞）。
  faqiang_niechizanpu: { name: '发羌劲卒', tier: 4 },   // 聂赤｜吐蕃｜甲玛赤康｜旧档 发羌劲卒 原样沿用：聂赤为发羌（吐蕃先世）首领，居甲玛赤康（《旧唐书·吐蕃传》载吐蕃本发羌）。
  spurgyal_dariniansai: { name: '甲玛赤锋', tier: 2 },   // 达日年塞｜吐蕃｜甲玛赤康｜旧档 甲玛赤锋 原样沿用：达日年塞为悉补野部赞普、居甲玛赤康，其世系见《敦煌本吐蕃历史文书》赞普传记。
  gar_lunqinling: { name: '却杰军', tier: 1 },   // 论钦陵｜吐蕃｜大非川｜旧档 却杰军 原样沿用：论钦陵（Gar Trinring）咸亨元年（670）大非川破唐薛仁贵十万众，为吐蕃第一名将（《旧唐书·吐蕃传》）。
  yangtong_chisongdezan: { name: '羊同勇士', tier: 3 },   // 赤松德赞｜吐蕃｜逻些｜旧档保留：羊同（象雄）降附吐蕃后仍列属部千户从征，赤松德赞朝以此供军，见《旧唐书·吐蕃传》吐蕃役属诸羌之制。
  duomi_lunkongre: { name: '廓州蕃兵', tier: 4 },   // 论恐热｜吐蕃｜浇河｜《新唐书·吐蕃传》《资治通鉴》会昌三年论恐热以落门川讨击使据廓州（隋浇河郡）起兵统吐蕃边部，故取廓州蕃兵。
  tubo_muzheng: { name: '河湟蕃兵', tier: 3 },   // 木征｜吐蕃｜浇河｜《宋史·卷四九二·吐蕃传》木征统河湟、廓州吐蕃部族兵，熙宁七年降宋；蕃兵即宋对河湟吐蕃部族兵的正式称谓，见《宋史·兵志》。
  dongdan_yelvbei: { name: '东丹卫兵', tier: 4 },   // 耶律倍｜辽｜襄平｜旧档保留：《辽史·义宗倍传》天显元年封东丹王、都东平（辽阳），东丹国自有宫卫部曲宿卫。
  liao_d_xiaopaiya: { name: '左皮室军', tier: 3 },   // 萧排押｜辽｜临潢府｜《辽史·卷八十八·萧排押传》统和初为左皮室详稳，率皮室亲军南征，故取左皮室军。
  liao_d_handewei: { name: '迭剌糺军', tier: 3 },   // 韩德威｜辽｜大同｜《辽史·卷八十二·韩德威传》「领突吕不、叠剌二糺军」，迭剌（叠剌）为契丹部族糺军，德威镇西南面讨党项、败杨继业皆用此军。
  liao_d_xiaoduli: { name: '铁林军', tier: 3 },   // 萧咄李｜辽｜临潢府｜《宋史·卷二百七十二·杨业传》太平兴国五年雁门之战斩辽驸马都尉萧咄李；铁林军为辽帝统下劲骑军号，见《辽史·萧阳阿传》历铁林、铁鹞、大鹰三军详稳。
  liao_d_tianzuodi: { name: '永昌宫骑', tier: 3 },   // 天祚帝｜辽｜临潢府｜《辽史·卷三十一·营卫志》天祚皇帝置阿鲁碗斡鲁朵，「是为永昌宫……出骑军一万」，即其宫分亲军。
  qidan_shulvping: { name: '属珊锐骑', tier: 3 },   // 述律平｜辽｜临潢府｜旧档保留：《辽史·营卫志》应天皇太后置属珊军为其帐下亲军，述律平自将，故称属珊锐骑。
  yel_yelvxiuge: { name: '斡鲁朵军', tier: 1 },   // 耶律休哥｜辽｜降圣｜旧档保留：《辽史·卷八十三·耶律休哥传》高梁河、岐沟关两捷统辽宫卫劲骑，斡鲁朵即宫卫军。
  jingcheng_d_yuyouzhao: { name: '镜城突骑', tier: 3 },   // 鱼有沼｜朝鲜｜笼耳｜旧档保留：《朝鲜王朝实录·成宗实录》鱼有沼任咸镜道节度使，驻镜城屡讨尼麻车等女真部，以突骑取胜。
  chungju_d_quanli: { name: '幸州勤王军', tier: 2 },   // 权栗｜朝鲜｜汉城｜万历二十一年（1593）幸州大捷，权栗率全罗道勤王军守幸州山城以车阵火矢大破日军，见《朝鲜王朝实录·宣祖实录》。
  sambyeol_lishunchen: { name: '龟甲板屋船', tier: 0 },   // 李舜臣｜朝鲜｜鸣梁｜旧档保留：李舜臣以龟船破日军于闲山岛、鸣梁，见《李忠武公全书》及维基「闲山岛海战」「鸣梁海战」。
  sheng_d_liyiqi: { name: '全罗水军', tier: 2 },   // 李亿祺｜朝鲜｜顺天｜旧档保留：李亿祺任全罗右水使，与李舜臣合兵闲山岛破日军，见《朝鲜王朝实录·宣祖实录》。
  luosi_svyatopolk: { name: '佩切涅格骑', tier: 3 },   // 斯维亚托波尔克｜罗斯｜基辅｜旧档无；《往年纪事》记 1016、1019 年斯维亚托波尔克两度借佩切涅格骑兵与雅罗斯拉夫争基辅，1019 阿尔塔河败死，佩切涅格骑即其争位主力（维基「斯维亚托波尔克一世」）。
  kaleiliya_kelimu: { name: '基日民团', tier: 4 },   // 克利姆索博列夫｜罗斯｜基日岛｜旧档无；克利姆·索博列夫为托尔武亚乡农民，1769–1771 年基日（卡累利阿）农民起义首领，所领为基日乡农民武装（维基「Кижское восстание 1769—1771」）。
  xiadunhe_sviatoslav: { name: '基辅亲兵', tier: 3 },   // 斯维亚托斯拉夫｜罗斯｜基辅｜旧档无；《往年纪事》载斯维亚托斯拉夫以亲兵队（дружина）为锋，965 破哈扎尔、968 征保加尔，亲兵随其自基辅出征。
  gen_alexander_nef: { name: '德鲁日纳', tier: 2 },   // 涅夫斯基｜罗斯｜拉多加｜旧档无；《诺夫哥罗德第一编年史》记 1242 年冰湖之战，涅夫斯基亲兵德鲁日纳为冲垮条顿骑士团之主力（维基「冰湖之战」）。
  gen_rurik: { name: '瓦良格亲兵', tier: 3 },   // 留里克｜罗斯｜拉多加｜旧档无；《往年纪事》862 年留里克率瓦良格人渡海据拉多加，其亲兵即瓦良格（诺斯）战士，为留里克王朝立国之本。
  gen_sineus: { name: '白湖戍卒', tier: 4 },   // 西涅乌斯｜罗斯｜白湖｜旧档无；《往年纪事》862 年留里克之弟西涅乌斯分据白湖，白湖戍卒守伊尔门湖—伏尔加河商路，为其驻地本地精锐。
  gen_vyacheslav_tartu: { name: '塔尔图戍卒', tier: 4 },   // 维切斯拉夫｜罗斯｜尤里耶夫｜旧档无；1224 年利沃尼亚骑士团围塔尔图（尤里耶夫），维切斯拉夫率二百罗斯亲兵与楚德守军死守至城破身亡（维基「Tartu piiramine (1224)」）。
  gen_grigory_donets: { name: '哈尔科夫团', tier: 4 },   // 多涅茨｜俄｜哈尔科夫｜旧档无；1659–1765 年哈尔科夫团为斯洛博达乌克兰哥萨克团，团校多涅茨率之抗克里米亚鞑靼（维基「Харьковский слободской казачий полк」）。
  gen_semyon_saburov: { name: '沃罗涅日团', tier: 4 },   // 萨布罗夫｜俄｜沃罗涅日｜旧档无；1586 年俄国于顿河上游筑沃罗涅日要塞，设沃罗涅日团戍守以防克里米亚鞑靼（维基「Воронеж」）。
  don_vorontsov: { name: '波雅尔骑兵', tier: 3 },   // 沃隆佐夫｜俄｜圣彼得堡｜旧档无；沃隆佐夫家族为 16 世纪莫斯科军役贵族，所统为波雅尔贵族骑兵（боярские дети，维基「Бояре」及俄国军役制）。
  nogai_votkhovsky: { name: '诺盖骑兵', tier: 3 },   // 沃特霍夫斯基｜俄｜萨马拉｜旧档无；萨马拉 1586 年筑堡正为防诺盖帐汗国袭扰，沃特霍夫斯基为诺盖出身，所领即伏尔加—乌拉尔草原诺盖骑兵（维基「Ногайская Орда」）。
  bashkir_nagoy: { name: '巴什基尔骑', tier: 3 },   // 纳吉｜俄｜乌法｜旧档无；乌法 1574 年筑堡于巴什基尔地，巴什基尔骑兵为俄军服役之草原骑（维基「Башкирская конница」），纳吉即巴什基尔部将。
  gen_sergey_belgorod: { name: '别尔哥团', tier: 4 },   // 谢尔盖｜俄｜别尔哥罗德｜旧档无；1596 年筑别尔哥罗德要塞，别尔哥罗德团（Белгородский полк）戍别尔哥罗德防线以御鞑靼（维基「Белгород」）。
  eguo_zasekin: { name: '萨拉托夫团', tier: 4 },   // 扎谢金｜俄｜萨拉托夫｜旧档无；扎谢金 1590 年筑萨拉托夫要塞，驻萨拉托夫团扼伏尔加河渡口（维基「Саратов」）。
  qin_hengyi: { name: '陷队之士', tier: 2 },   // 桓齮｜秦｜长安｜旧档无；《商君书·境内》载秦军攻城有「陷队之士」（面十八人）即先登陷阵之敢死队；桓齮前234攻赵平阳、杀赵将扈辄斩首十万（《史记·秦始皇本纪》），正为攻城陷阵之用。
  wazhai_zhanghan: { name: '骊山刑徒', tier: 2 },   // 章邯｜秦｜长安｜旧档 骊山刑徒 原样沿用：二世二年周文兵至戏，章邯请赦骊山徒、人奴产子悉发以击楚军，大破之（《史记·秦始皇本纪》《项羽本纪》），其军即骊山刑徒，据点在长安。
  ruo_wangjian: { name: '秦之锐士', tier: 1 },   // 王翦｜秦｜长安｜旧档 秦之锐士 原样沿用：《荀子·议兵》称「秦之锐士」不可当，王翦将秦兵六十万灭楚（《史记·白起王翦列传》），番号与秦军本体相符。
  shangzhou_shangyang: { name: '商州锐士', tier: 4 },   // 商鞅｜秦｜商邑｜旧档 商州锐士 原样沿用：商鞅破魏后封於商十五邑、号商君，据点即商邑（《史记·商君列传》）；锐士为变法后秦卒之称（《荀子·议兵》）。
  baiyang_mengtian: { name: '长城军', tier: 3 },   // 蒙恬｜秦｜肤施｜🔴 [2026-11-02 主人令] 长城烽火卫 → 长城军，档位照原 T3 不改；按史：蒙恬率三十万众北逐匈奴、筑长城、守上郡十余年（《史记·蒙恬列传》），「长城军」即其所统长城—上郡边防之众，据点在肤施（上郡治所）。
  bfe2_gongzi_ang: { name: '安邑武卒', tier: 4 },   // 公子卬｜魏｜安邑｜旧档无；《史记·商君列传》魏使公子卬将兵御商鞅，卫鞅设会诱虏之而破其军；魏武卒为魏国选练之卒（《荀子·议兵》），安邑为魏旧都，故取安邑武卒为地方部曲。
  liangshidu_longjia: { name: '雕阴戍卒', tier: 2 },   // 龙贾｜魏｜绥德｜旧档 雕阴戍卒 原样沿用：魏将龙贾守河西上郡，前330秦败魏于雕阴、虏龙贾（《史记·秦本纪》《魏世家》），雕阴即其防地，据点在绥德一带。
  bfe2_pang_juan: { name: '大梁苍头', tier: 3 },   // 庞涓｜魏｜开封｜旧档无；《战国策·魏策》载魏卒有「苍头」之号，庞涓为魏惠王将、破赵邯郸（《史记·孙子吴起列传》），魏已徙都大梁（开封），故取大梁苍头。
  bfe_prince_chao: { name: '王城甲士', tier: 4 },   // 王子朝｜周｜洛阳｜旧档无；《左传·昭公二十二年》王子朝率郊、要、饯之甲逐刘子、据王城以争位，至二十六年始奔楚，所统即王城甲士。
  zi_changhong: { name: '成周八师', tier: 3 },   // 苌弘｜周｜洛阳｜旧档 资州戍兵 与史实冲突（资州为巴蜀资中，是苌弘籍贯而非其统兵地，且其据点在洛阳周室），改；苌弘为周敬王大夫、佐刘文公平王子朝之乱，敬王居成周（《左传·昭公二十六年》《哀公三年》），成周八师为周天子驻成周之常备王师（西周金文、《周礼》官制）。
  bfe2_xun_linfu: { name: '中行步卒', tier: 3 },   // 荀林父｜晋｜曲沃｜旧档无；《左传·僖公二十八年》晋作三行以御狄，荀林父将中行、遂以中行为氏；三行为晋国步兵建制，故取中行步卒（中行为军制名，非以其名为号）。
  yangshe_yangshezhi: { name: '铜鞮私卒', tier: 4 },   // 羊舌职｜晋｜铜鞮｜旧档 铜鞮私卒 原样沿用：羊舌氏食邑铜鞮（今山西沁县），羊舌职为晋大夫（《左传·襄公三年》），私卒即其邑兵。
  gen_vernon: { name: '西印度舰队', tier: 3 },   // 弗农｜英｜坎佩尔｜弗农 1739–1742 年任西印度群岛海陆军总司令，率所部舰队攻波特贝洛、卡塔赫纳（维基「Edward Vernon」「Battle of Cartagena de Indias」）；18 世纪英国海外分舰队为其海军战力特色，属兵种特色一档。
  gen_suffolk: { name: '汉普郡兵', tier: 4 },   // 萨福克伯爵｜英｜温彻斯特｜萨福克伯爵 1428–29 年为奥尔良围城英军统帅，本部为英格兰骑士与郡征召兵（维基「William de la Pole, 1st Duke of Suffolk」「Siege of Orléans」）；据点温彻斯特即汉普郡治所，取本地郡兵为常规地方部曲。
  yinggelan_warenne: { name: '萨里戍卒', tier: 4 },   // 瓦伦｜英｜伦敦｜瓦伦为第六代萨里伯爵，1296 年邓巴之战、1297 年斯特灵桥之战统英格兰封建征召军（维基「Battle of Stirling Bridge」「John de Warenne, 6th Earl of Surrey」），萨里即其伯爵领戍兵之地。
  gen_alfred_great: { name: '塞恩亲兵', tier: 3 },   // 阿尔弗雷德｜英｜温彻斯特｜阿尔弗雷德以塞恩（thegn）亲兵为骨干，878 年埃丁顿之战率亲兵与民兵破丹麦大军（《盎格鲁-撒克逊编年史》878 年条；维基「Thegn」「Battle of Edington」），盎格鲁-撒克逊亲兵属兵种特色。
  gen_edward_longshanks: { name: '威尔士长弓', tier: 2 },   // 长腿爱德华｜英｜卡那封｜《武将百科》旧档改订；维基「Battle of Falkirk」(1298)：长腿爱德华以威尔士长弓手攒射破苏格兰长枪圆阵，长弓首成决胜兵种。
  gen_gilbert: { name: '卡菲利戍卒', tier: 4 },   // 吉尔伯特｜英｜格洛斯特｜吉尔伯特·德·克莱尔为第七代格洛斯特伯爵、格拉摩根领主，1271 年起建卡菲利城堡并驻军镇守威尔士边区（维基「Caerphilly Castle」「Gilbert de Clare, 7th Earl of Gloucester」）。
  gen_philip_ii: { name: '步兵伙友', tier: 2 },   // 腓力二世｜马其｜佩拉｜旧档「持盾卫队」与克拉特罗斯 T1 重名，改；狄奥多罗斯 XVI.3、维基「Ancient Macedonian army」：腓力二世创步兵伙友（Pezhetairoi）萨里沙方阵，前 338 喀罗尼亚大捷。
  gen_parmenion: { name: '塞萨利骑兵', tier: 3 },   // 帕曼纽｜马其｜佩拉｜高加米拉之战帕曼纽统马其顿军左翼，塞萨利骑兵在其节制下力拒波斯右翼（阿里安《远征记》III.11–14）；旧挂「伙伴骑兵」T0 为他人专属，改。
  dulan_azimuhan: { name: '优素福扎伊', tier: 3 },   // 阿扎姆汗｜杜兰｜白沙瓦｜阿扎姆汗为杜兰尼王子、白沙瓦总督，1823 年集白沙瓦、阿托克阿富汗部众于瑙谢拉与锡克军决战（《The Punjab Past and Present》卷十九；维基「Battle of Nowshera」），其军以白沙瓦谷地优素福扎伊等部族骑兵为骨干。
  dulan_muzaffarkhan: { name: '木尔坦戍卒', tier: 4 },   // 穆扎法尔汗｜杜兰｜马里斯｜穆扎法尔汗为木尔坦的阿富汗总督，1818 年城破战死；马里斯卫城墙高沟深，其守军即木尔坦戍卒（维基「Muzaffar Khan Sadozai」「Siege of Multan (1818)」；本库据点马里斯即木尔坦）。
  kuida_chakar: { name: '林德部骑', tier: 3 },   // 恰卡尔｜杜兰｜奎达｜恰卡尔为俾路支林德部（Rind）首领，俾路支部族史诗记其率林德部骑兵与拉沙尔部争战、据沙尔（今奎达）（俾路支《恰卡尔史诗》；维基「Chakar Khan Rind」），属民族固有军号一档。
  maikelan_punong: { name: '凯奇戍卒', tier: 4 },   // 普农｜杜兰｜特尔巴特｜普农为俾路支霍特氏族（Hot Baloch）凯奇河谷首领，居普纳堡（今特尔巴特，古称凯奇/Kech），部众即凯奇戍卒（维基「Turbat」；俾路支霍特氏族谱系「Punnun Fort」）。
  bfe2_sin_shar_ishkun: { name: '尼尼微戍卒', tier: 4 },   // 伊什昆｜亚述｜尼尼微｜旧档无；《巴比伦编年史》记前612年米底与巴比伦联军围尼尼微，末代王伊什昆据城死战、城破身死（维基「尼尼微之战（前612年）」），戍城之兵即其本军，取驻地为号。
  bfe2_shalmaneser_iii: { name: '尼尼微战车', tier: 3 },   // 沙尔马那塞尔三世｜亚述｜尼尼微｜旧档无；沙尔马那塞尔三世前853年西征卡尔卡尔，阵中战车约二千乘、骑兵五千五百（维基「卡尔卡尔之战」），亚述王军素以战车队为锋，尼尼微为其王城，故取兵种特色为号。
  bfe2_esarhaddon: { name: '沙雷希亲卫', tier: 2 },   // 以撒哈顿｜亚述｜尼尼微｜旧档无；前671年以撒哈顿渡西奈、克孟菲斯而灭埃及（维基「亚述征服埃及」），新亚述王家常备近卫称 ša rēši（「首上之人」），随王亲征为王军尖刀（维基「新亚述帝国的军事史」）。
  guyashu_shamushi: { name: '亚述城戍卒', tier: 4 },   // 沙姆希阿达｜亚述｜亚述城｜旧档无；《亚述王表》记沙姆希阿达一世（前1813–前1781）据亚述城、主阿淑尔神庙，古亚述尚无常备军，戍城之众即其本军，取驻地为号（维基「沙姆希阿达一世」）。
  kuman_tugorkan: { name: '第聂伯游骑', tier: 4 },   // 图戈尔坎｜库曼｜奥列什基｜旧档无；图戈尔坎为11世纪库曼可汗，据第聂伯河下游，1096年攻佩列亚斯拉夫尔兵败身死（维基「图戈尔坎」），奥列什基即第聂伯下游库曼冬营，游骑为其本军。
  gen_haci_giray: { name: '克里木游骑', tier: 3 },   // 哈吉格莱｜库曼｜奥列什基｜旧档无；哈吉格莱1441年建克里米亚汗国、都巴赫奇萨赖，军以鞑靼轻骑奔袭为长（维基「克里米亚汗国」），奥列什基属其草原北境，取克里木本军为号。
  tujue_xielikehan: { name: '牙帐狼骑', tier: 3 },   // 颉利可汗｜突厥｜燕然山｜颉利为东突厥末代大可汗，以漠北燕然山（MONGOL）王庭牙帐突厥附离狼骑为核心战力（《隋书·突厥传》）。
  tujue_abo_dagan: { name: '郁督军游骑', tier: 4 },   // 阿波达干｜突厥｜于都斤山｜阿波达干驻于都斤山（郁督军山），部众以漠北圣山游骑为锋（《新唐书·突厥传》）。
  tujue_wusumishi: { name: '于都斤牙帐', tier: 4 },   // 乌苏米施可汗｜突厥｜于都斤山｜旧档无；乌苏米施可汗为后突厥末代可汗，牙帐在于都斤山，天宝三载（744）为拔悉密、回纥所破被杀（《旧唐书·突厥传》），汗庭牙帐之众即其本军。
  pugu_ashinaguduolu: { name: '燕然劲骑', tier: 2 },   // 骨咄禄｜突厥｜燕然山｜旧档无；骨咄禄（颉跌利施可汗）永淳元年（682）起兵黑沙城、复后突厥，屡破唐军而建牙于都斤山（《旧唐书·突厥传》），燕然山即其劲骑出没之地。
  bfe_qutlugh_khwaja: { name: '弓月戍卒', tier: 4 },   // 忽都鲁火者｜蒙古｜弓月城｜旧档无；维基「都哇」记 1297 年都哇封其子忽都鲁火者为拉合尔统治者、1299 年率察合台军攻德里，弓月城（阿力麻里）为察合台汗国腹地，取驻地戍卒为号（CENTRAL_ASIA 本地部曲）。
  menggu_d_mongke: { name: '和林宿卫', tier: 3 },   // 蒙哥｜蒙古｜哈拉和林｜旧档无；《元史·宪宗纪》记蒙哥 1251 年即位于阔帖兀阿阑、以哈拉和林为汗庭所在，大汗居和林置宿卫亲军，故取「和林宿卫」（维基「蒙哥」）。
  borjigin_tuolei: { name: '那可儿伴当', tier: 1 },   // 拖雷｜蒙古｜曲雕阿兰｜用本项目《武将百科》旧档 wikiElite＝那可儿伴当、wikiTier＝1；那可儿为蒙古伴当亲兵（《元朝秘史》），拖雷掌兀鲁思本部军，与旧档相合。
  dajin_wanyaneke: { name: '会宁猛安', tier: 4 },   // 完颜讹可｜金｜会宁府｜旧档无；《金史·卷111·完颜讹可传》记其为内族、护卫出身，正大八年与草火讹可将兵三万守河中力战；会宁府即金上京、猛安谋克故地（《金史·兵志》），取「会宁猛安」。
  dajin_wanyan_zhongde: { name: '上京女真军', tier: 4 },   // 完颜仲德｜金｜会宁府｜《金史·卷119·完颜仲德传》天兴末竭忠报国，移驻上京会宁府（NORTHEAST）后配上京金源故地女真军。
  mohe_wanyanzonghan: { name: '女真拐子马', tier: 3 },   // 完颜宗翰｜金｜大同｜用本项目《武将百科》旧档 wikiElite＝女真拐子马、wikiTier＝3；拐子马为女真两翼轻骑（《宋史·岳飞传》），宗翰统女真骑兵破汴，与旧档相合。
  khoshut_lhasang: { name: '达木蒙古', tier: 3 },   // 拉藏｜和硕｜逻些｜旧档无；1642 年固始汗入藏后以当雄（达木）驻蒙古骑兵、置达木八旗护卫拉萨，为和硕特汗王直辖（百度百科「达木蒙古」；维基「拉藏汗」记 1717 年拉萨城破败死）。
  gen_lobsang_danjin: { name: '青海和硕特', tier: 4 },   // 罗卜藏丹津｜和硕｜当雄｜旧档无；维基「罗卜藏丹津」记其为固始汗之孙、达什巴图尔之子，驻安多（青海）东部，1723 年会盟赛罕托罗海、联合青海蒙古各部反清。
  dulan_dashibatuer: { name: '青海归锋', tier: 3 },   // 达什巴图尔｜和硕｜台吉乃尔｜用本项目《武将百科》旧档 wikiElite＝青海归锋、wikiTier＝3；达什巴图尔为青海和硕特首领、固始汗第十子，1697 年率青海诸台吉归附清朝封和硕亲王，与旧档相合。
  bfe3_68: { name: '幽州突骑', tier: 1 },   // 严纲｜幽｜北京｜《后汉书·耿弇传》「渔阳、上谷突骑，天下所闻」；《三国志·公孙瓒传》严纲为瓒所署冀州刺史，率幽州突骑为前锋，界桥之战为麴义所破。
  cangzhou_liurengong: { name: '定霸都', tier: 4 },   // 刘仁恭｜幽｜北京｜《旧五代史·刘仁恭传》仁恭据幽州，简军中壮士为亲军，号「定霸都」；旧档与本条相符，原样沿用。
  yuzhou_zuti: { name: '中流击楫军', tier: 3 },   // 祖逖｜晋｜雍丘｜《晋书·祖逖传》逖渡江中流击楫立誓北复中原，部曲号「中流击楫军」，镇雍丘；旧档时代地点均合，原样沿用。
  danyang_huanwen: { name: '姑孰护卫', tier: 2 },   // 桓温｜晋｜姑孰｜《晋书·桓温传》温镇姑孰、遥控朝政，其牙门亲兵为「姑孰护卫」；旧档与东晋、江南镇所相符，原样沿用。
  xijue_ganyanshou: { name: '北单于庭骑', tier: 3 },   // 郅支｜匈奴｜头曼城｜郅支单于与呼韩邪争立自号北单于，以匈奴王庭旧部精骑为号（《汉书·匈奴传》）。
  xiongnu_hunxiewang: { name: '浑邪部骑', tier: 4 },   // 浑邪王｜匈奴｜头曼城｜浑邪王为匈奴西部诸王，移头曼城后以本部浑邪部控弦胡骑为号（《史记·匈奴列传》）。
  xiongnu_yizhixie: { name: '单于庭精骑', tier: 4 },   // 伊稚斜单于｜匈奴｜头曼城｜《史记·匈奴列传》伊稚斜自立为单于，单于庭北徙漠南阴山一带，其本部精骑即单于庭之众。
  dingling_weilu: { name: '丁零游骑', tier: 4 },   // 卫律｜匈奴｜贝加尔｜《汉书·李广苏建传》卫律降匈奴、封丁零王，统丁零部众，居贝加尔丁零故地；旧档与原样沿用。
  heisha_d_houlihu: { name: '黑沙精骑', tier: 3 },   // 呴犁湖｜匈奴｜特尔门｜《汉书·匈奴传》呴犁湖单于立于漠北黑沙之地，部众皆轻骑；旧档与本条时代、兵种相符，原样沿用。
  bohai_dayinzhuan: { name: '忽汗城牙兵', tier: 4 },   // 大諲撰｜渤海｜龙泉府｜《辽史·太祖纪》天显元年契丹围忽汗城，渤海末王諲撰出降；忽汗城即渤海上京龙泉府，为其牙城亲兵所在。
  luzhou_zhangwenxiu: { name: '鸭绿水师', tier: 4 },   // 张文休｜渤海｜鸭绿府｜《新唐书·渤海传》仁安十四年遣张文休率水军越海攻唐登州；旧档与渤海、水军相符，原样沿用。
  rouran_anagui: { name: '柔然王庭骑', tier: 4 },   // 阿那瓌｜柔然｜赛尔乌苏｜《魏书·蠕蠕传》阿那瓌复国、号敕连头兵豆伐可汗，王庭置于漠北，其众号柔然，皆控弦之骑。
  yujiulu_yujiulv: { name: '柔然汗骑', tier: 4 },   // 郁久闾大檀｜柔然｜弱水畔｜《魏书·蠕蠕传》大檀号牟汗纥升盖可汗，柔然极盛、控弦数十万；旧档与漠北骑兵相符，原样沿用。
  gen_ishida_mitsunari: { name: '佐和山众', tier: 3 },   // 石田三成｜丰臣｜京都｜石田三成居城为近江佐和山城（十九万石），关原之战本队据笹尾山、旗印「大一大万大吉」；据维基「关原之战」与《当代记》，取居城兵为番号，不做「石田众」（禁用人名）。
  aizu_pushengshixiang: { name: '会津藩士', tier: 3 },   // 蒲生氏乡｜丰臣｜鹤之城｜旧档照用：蒲生氏乡天正十八年（1590）转封会津九十二万石、居黑川（若松）城，家臣团即会津众；维基「蒲生氏乡」。
  mino_dagujiji: { name: '大谷部众', tier: 4 },   // 大谷吉继｜丰臣｜不破关｜旧档照用：大谷吉继为越前敦贺五万石领主，关原于山中村布阵、麾下即大谷部众；维基「大谷吉继」「关原之战」。
  aki_maoliyuanjiu: { name: '严岛伏兵', tier: 2 },   // 按史：严岛之战毛利元就分兵迂回、突袭陶晴贤本阵；村上水军由村上武吉亲统，另归村上武吉，不再把盟军主将与本部混挂（《毛利家文书》《阴德太平记》）。
  jibei2_qingshuizongzhi: { name: '备中众', tier: 4 },   // 清水宗治｜毛利｜备中高松城｜旧档照用：清水宗治以备中高松城主守城，天正十年（1582）水攻之役率城兵抗羽柴大军；维基「备中高松城之战」。
  gen_cangrande: { name: '维罗纳戍卒', tier: 4 },   // 坎格兰德｜威共｜维罗纳｜坎格兰德一世自 1311 年起为维罗纳领主兼帝国代牧，兵源以维罗纳城兵与德意志雇佣骑士为骨干；维基「Cangrande I della Scala」（旧档空，自拟地方戍卒番号）。
  gen_dandolo: { name: '圣马可桨手', tier: 3 },   // 丹多洛｜威共｜威尼斯｜丹多洛以威尼斯桨帆舰队运送第四次十字军，1204 年攻君士坦丁堡时桨手兼充陆战、奉圣马可旗；维基「第四次十字军」「Enrico Dandolo」。
  kejila_shulunbao: { name: '科孚戍卒', tier: 3 },   // 舒伦堡｜威共｜科孚｜舒伦堡 1716 年率威尼斯守军与岛民守科孚，击退奥斯曼围城二十二日；维基「Corfu (1716)」、《威尼斯共和国史》。
  gesake_khmelnytsky: { name: '扎波罗热军', tier: 2 },   // 赫梅利尼茨基｜哥萨｜塞契｜赫梅利为扎波罗热军（Військо Запорозьке）盖特曼，1648 年黄水、科尔松两战大破波军；维基「赫梅利尼茨基起义」。固有军号，非人名。
  gen_vyshnevetsky: { name: '切尔卡瑟团', tier: 4 },   // 拜达｜哥萨｜切尔卡瑟｜维什涅韦茨基（拜达）任切尔卡瑟长老（starosta），1556 年建霍尔蒂察塞契；切尔卡瑟团为注册哥萨克老团，维基「Dmytro Vyshnevetsky」。
  gen_mikhail_tatarinov: { name: '顿河哥萨', tier: 3 },   // 塔塔里诺夫｜哥萨｜维申斯卡亚｜「顿河军」与莫斯科三将（T2）同名异档，改；塔塔里诺夫为顿河哥萨克阿塔曼，1637 取亚速、1641 亚速坐困（《苏联大百科全书》「亚速坐困」条）。
  gen_caffa_consul: { name: '卡法戍卒', tier: 4 },   // 斯夸尔｜热亚｜卡法｜卡法为热那亚黑海殖民地的领事驻地，设戍军与弩手守城，1346—47 年贾尼别围城；维基「Siege of Caffa」。
  gen_valdivia: { name: '智利戍卒', tier: 3 },   // 瓦尔迪维亚｜西｜利马｜瓦尔迪维亚 1540 年自利马受皮萨罗委为智利副总督，率远征队南征，1541 建圣地亚哥、1550 建康塞普西翁，其部即智利首批常驻戍军；维基「Pedro de Valdivia」「图卡佩尔之战」（旧档空，自拟地方戍卒番号，不借「征服者」势力号）。
  gen_medinaceli: { name: '西西里方阵', tier: 4 },   // 梅迪纳科利｜西｜利马｜梅迪纳科利公爵胡安·德·拉·塞尔达 1557–1564 任西西里总督兼统帅、1560 率舰队征的黎波里败于杰尔巴岛，所辖即西西里方阵（Tercio de Sicilia）；Treccani「Medinaceli, Juan de la Cerda」。（旧档空，按其本任驻军自拟）
  bfe3_25: { name: '泰米尔戍卒', tier: 4 },   // 埃拉拉｜朱罗｜坦贾武尔｜《大史》（Mahavamsa）记埃拉拉为「Damila」（泰米尔）王，率注辇军渡海据阿努拉德普勒四十四年，以泰米尔戍军守其地；维基「Ellalan」。（旧档空，自拟戍卒番号）
  zhuluo_lajindela: { name: '注辇水师', tier: 2 },   // 拉金德拉一世｜朱罗｜坦贾武尔｜坦贾武尔铭文载拉金德拉一世 1014–1017 年遣水师渡海破三佛齐（Kadaram），为朱罗海军最大远征；《宋史·外国传五·注辇》亦记注辇国；维基「Rajendra I」。（旧档空，取政权固有军号「注辇水师」，与埃拉拉分开）
  gen_abu_yahya: { name: '胡法兹锐士', tier: 3 },   // 阿布叶海亚｜穆瓦｜拉巴特｜穆瓦希德以伊本·图马尔特所立「胡法兹」（Ḥuffāẓ，教义记诵者）为军中之锐，都城里巴特·法特赫为其教团军屯之地；阿布叶海亚为穆瓦希德宗室、马略卡总督，1229 年守马略卡战死；维基「Conquest of Majorca」。（旧档空，考据自拟）
  muwaxide_axatafu: { name: '安达卢斯兵', tier: 4 },   // 阿夏塔夫｜穆瓦｜1248 年塞维利亚守将阿夏塔夫（穆瓦希德宗室）率安达卢斯城兵抗卡斯蒂利亚的费尔南多三世，城破出降；维基「Siege of Seville」、《西班牙编年史》（Primera Crónica General）。（旧档空，自拟地方部曲番号）
  sengjialuo_mahinda_v: { name: '罗哈纳戍卒', tier: 4 },   // 摩哂陀五世｜僧伽｜阿努拉德｜摩哂陀五世 993 年弃阿努拉德普勒退保罗哈纳（Rohana），1017 年为注辇所俘；《大史》续篇 Culavamsa、维基「Mahinda V」。（旧档空，按其退守地戍军自拟）
  gen_binnya_dala: { name: '孟族象兵', tier: 4 },   // 彬尼亚达拉｜汉达｜勃固｜彬尼亚达拉为孟族汉达瓦底末王，1757 年阿朗帕耶围勃固，其率孟族象军守城，城破被俘；《琉璃宫史》、维基「Binnya Dala」。（旧档空，取民族固有军号自拟）
  huarazim_jalal: { name: '河中突骑', tier: 2 },   // 扎兰丁｜花剌｜玉龙杰赤｜1221 年八鲁湾（Parwan）之战，扎兰丁率花剌子模骑兵大破蒙古失吉忽秃忽部，为蒙古西征少有之败；《世界征服者史》《史集》。（旧档空，取其河中本部骑兵自拟，不夺「康里精骑」）
  gen_beg_arslan: { name: '河套铁骑', tier: 3 },   // 癿加思兰｜鞑靼｜河套｜《明史·卷三二七·鞑靼传》：癿加思兰以鞑靼太师拥众入据河套，成化九年（1473）王越袭破其帐于红盐池；部众即河套蒙古精骑，取驻地本军为号（非人名）。
  xiliao_uthman: { name: '喀喇汗亲兵', tier: 4 },   // 奥斯曼｜大辽｜碎叶｜奥斯曼为西喀喇汗末王（1175–1212），据撒马尔罕，1212 年为花剌子模摩诃末所杀（《辽史·卷三十·西辽》；维基「奥斯曼（西喀喇汗）」）；碎叶川本喀喇汗牙帐故地，其牙帐亲兵为突厥骑兵，故取政权固有军号。
  erzhu_erzhuzhao: { name: '契胡突骑', tier: 3 },   // 尔朱兆｜尔朱｜秀容川｜《魏书·卷七五·尔朱兆传》：尔朱氏本秀容川契胡酋帅，世统契胡部众为骑兵，尔朱兆继尔朱荣领其众，532 年韩陵山败于高欢；番号取本族固有军号。
  wu_fuchai: { name: '姑苏舟师', tier: 3 },   // 夫差｜吴｜姑苏｜《左传·哀公九年》吴城邗、沟通江淮以通粮道，《国语·吴语》载夫差率舟师北上黄池争盟；吴以姑苏为都，舟师即其本土特色军种。
  gen_li_xiucheng: { name: '苏福枪船', tier: 3 },   // 李秀成｜太平｜金陵｜李秀成 1860 年克苏州、置苏福省，统苏南水乡枪船水师及洋枪队为苏浙战场尖兵（《李秀成自述》；罗尔纲《太平天国史》）；据点在金陵，同为太平天国苏浙根本。
  totomi_jiujingzhongci: { name: '三河武士', tier: 3 },   // 酒井忠次｜德川｜浜松城｜用本项目《武将百科》旧档 wikiElite＝三河武士、wikiTier＝2；酒井忠次为三河谱代重臣、德川四天王，1572 年三方原、1575 年长篠统三河众作战（《三河物语》），浜松城即其封地。
  osumi_ganfujianxu: { name: '九州防人', tier: 3 },   // 肝付兼续｜岛津｜赤尾木城｜用本项目《武将百科》旧档 wikiElite＝九州防人、wikiTier＝3；肝付兼续为大隅南部豪族，据赤尾木城与岛津氏争大隅，统九州南部国人众（维基「肝付兼续」；《岛津氏历代记》）。
  taira_pingzhisheng: { name: '平家水军', tier: 3 },   // 平知盛｜平｜赤间关｜用本项目《武将百科》旧档 wikiElite＝平家水军、wikiTier＝3；平知盛为平家水军总督，1185 年坛之浦之战统率平家战船（《平家物语》；《吾妻镜》），赤间关即战场所在。
  gen_dinhle: { name: '义安戍卒', tier: 4 },   // 丁礼｜瞿越｜义安｜丁礼（1385–1427）为 15 世纪大越将领，镇义安（驩州），地当林邑北界，戍守州兵即其本军（《大越史记全书·本纪》；据点注「南越王坐镇驩州抗击林邑」）。
  yuenan_ruanguangzuan: { name: '西山禁兵', tier: 4 },   // 阮光缵｜越南｜华闾｜阮光缵（1783–1802）继阮惠为西山朝帝，居富春，统西山禁兵；1801 年富春陷、1802 年被擒（《大南实录正编·本纪》；维基「阮光缵」）；番号取西山政权禁卫本军。
  guangping_ruanwenzhang: { name: '象兵水师', tier: 4 },   // 阮文张｜越南｜洞海城｜用本项目《武将百科》旧档 wikiElite＝象兵水师、wikiTier＝4；阮文张（1753–1811）以战象与水师守洞海（广平）拒西山军（《大南实录》；维基「阮文张」），与据点海陆要冲相合。

  // ── 2026-10-26 名将精锐按史回正：不再让同势力名将整批继承普通种子番号；档位按 v3 战绩与建制判定 ──
  suzhou_huoqubing: { name: '骠骑郎卫', tier: 0 },       // 霍去病：六击匈奴、封狼居胥，扭转汉匈战略格局（《史记·卫将军骠骑列传》）。
  lulin_liuxiu: { name: '云台突骑', tier: 0 },           // 刘秀：昆阳决胜、河北突骑为中兴主力，重建汉室（《后汉书·光武帝纪》）。
  yuwen_yuwentai: { name: '武川镇军', tier: 0 },         // 宇文泰：武川集团为西魏—北周军政根本，沙苑之战扭转东西魏攻守（《周书·文帝纪》）。
  zhong_xiexuan: { name: '北府兵', tier: 0 },            // 谢玄：北府兵为淝水决战核心，八万破前秦大军、改写南北格局（《晋书·谢玄传》）。
  guizhou_lidingguo: { name: '永历铁骑', tier: 1 },      // 李定国：两蹶名王，永历朝西南战场主力（《明史·李定国传》）。
  da_yuan_kuokuotiemuer: { name: '北元怯薛', tier: 1 },  // 扩廓帖木儿：总北元兵，岭北之战主力（《元史·扩廓帖木儿传》《明史·扩廓帖木儿传》）。
  huige_gulipeiluo: { name: '回纥精骑', tier: 1 },       // 骨力裴罗：统一回纥诸部、建汗国之本部精骑（《旧唐书·回纥传》）。
  kazakh_hasimu: { name: '哈萨克骑', tier: 1 },          // 哈斯木汗：哈萨克汗国中兴，本部骑兵长期为野战主力（《哈萨克汗国史》）。
  aba_shapuer: { name: '萨珊重装骑', tier: 1 },          // 沙普尔：萨珊重装骑兵为对罗马战争主力（《萨珊帝国史》）。
  delan_sulun: { name: '帕提亚铁骑', tier: 2 },          // 苏伦：卡莱之战以帕提亚骑射与铁甲骑歼克拉苏军（普鲁塔克《克拉苏传》）。
  ansxi_surena: { name: '卡莱弓骑', tier: 2 },           // 苏莱纳（经典战敌将条目）：卡莱战场的帕提亚骑射兵，以机动弓骑配合铁甲骑破敌（普鲁塔克《克拉苏传》）。
  ansxi_aershake: { name: '帕尼精骑', tier: 2 },         // 阿尔沙克：率帕尼部骑众入主安息、奠定建国武力；与后世苏伦所统帕提亚铁骑分号。
  bfe_meherdates: { name: '帕提亚王卫', tier: 4 },       // 梅哈尔达特：安息王族争位者，所部为王位战争中的本部王卫，不共享卡莱主帅的高级番号。
  pangzha_halixinge: { name: '卡尔萨武士', tier: 1 },    // 哈里辛格：卡尔萨军为锡克帝国扩张与阿富汗战争主力（《锡克帝国史》）。
  wala_yexian: { name: '瓦剌铁骑', tier: 1 },            // 也先：土木之变瓦剌骑兵为决定性主力（《明史·瓦剌传》）。
  daxi_ming_zhangxianzhong: { name: '大西老营', tier: 1 }, // 张献忠：大西军转战与入川建政的核心老营（《明史·张献忠传》）。
  shazhou_zhangyichao: { name: '归义精骑', tier: 1 },    // 张议潮：归义军收复河西十一州，长期镇戍敦煌（《旧唐书·张议潮传》）。
  xiyuduhu_banchao: { name: '西域都护军', tier: 1 },     // 班超：以西域都护本部长期经营西域、击破莎车与龟兹（《后汉书·班超传》）。
  jiluo_d_douxian: { name: '北征突骑', tier: 1 },        // 窦宪：稽落山大破北匈奴、燕然勒功之北征主力（《后汉书·窦宪传》）。
  chanzhou_chairong: { name: '殿前诸班', tier: 2 },      // 柴荣：高平战后整练殿前诸班，为后周南征北伐核心（《旧五代史·周世宗纪》）。
  taiping_shidakai: { name: '太平军', tier: 1 },         // 石达开：太平军本部屡为西征主力；「石敢当」是其称誉，不是部队番号（《太平天国史》）。
  you_gengyan: { name: '上谷突骑', tier: 1 },            // 耿弇：上谷突骑随其平定河北、齐地，为东汉中兴野战军（《后汉书·耿弇传》）。
  wuwu_d_lvmeng: { name: '楼船军', tier: 1 },            // 吕蒙：统孙吴水军袭取荆州，改写三方局势（《三国志·吴书·吕蒙传》）。
  yingzhou_ying_d_muronghuang: { name: '黄龙兵', tier: 1 }, // 慕容皝：前燕都龙城，黄龙兵为其辽东经略与建国主力（《晋书·慕容皝载记》）。
  hejian_gongsunzan: { name: '白马义从', tier: 2 },      // 公孙瓒：亲统白马义从驰骋幽冀；上谷突骑归耿弇，不再错挂（《后汉书·公孙瓒传》）。
  yangzhou_wangping: { name: '无当飞军', tier: 2 },      // 王平：统无当飞军，兴势之战拒曹爽大军（《三国志·蜀书·王平传》）。
  huizhou_zhugeliang: { name: '元戎弩兵', tier: 2 },     // 诸葛亮：损益连弩称元戎，北伐军弩兵为战术特色（《三国志·蜀书·诸葛亮传》裴注《魏氏春秋》）。
  xianyu_hanxin: { name: '轻勇骑', tier: 2 },            // 韩信：井陉以二千轻骑袭赵垒，为背水阵决胜奇兵（《史记·淮阴侯列传》）。
  qu_d_quyi: { name: '先登营', tier: 2 },                // 麴义：界桥以八百先登伏强弩破白马义从（《后汉书·袁绍传》）。
  jiaodong_tiandan: { name: '即墨火牛阵', tier: 2 },     // 田单：即墨火牛夜袭破燕军，乘势复齐（《史记·田单列传》）。
  dongxian_sunbin: { name: '马陵伏弩', tier: 2 },        // 孙膑：马陵设伏万弩齐发破魏军（《史记·孙子吴起列传》）。
  wuzhou_limu: { name: '百金之士', tier: 2 },            // 李牧：选练百金之士，破匈奴、却秦军（《史记·廉颇蔺相如列传》）。
  liguo_zhaoshe: { name: '阏与突骑', tier: 2 },          // 赵奢：阏与之战抢占北山、纵兵击破秦军（《史记·廉颇蔺相如列传》）。
  yidou_luxun: { name: '夷陵奇兵', tier: 2 },            // 陆逊：夷陵火攻破刘备诸营（《三国志·吴书·陆逊传》）。
  jiujiang_zhouyu: { name: '蒙冲斗舰', tier: 2 },        // 周瑜：赤壁统蒙冲斗舰火攻曹操水军（《三国志·吴书·周瑜传》）。
  yue_d_lusu: { name: '巴陵楼船', tier: 2 },             // 鲁肃：驻巴丘、统水军维持荆州防线（《三国志·吴书·鲁肃传》）。
  shanyue_sunce: { name: '丹阳兵', tier: 2 },            // 孙策：以丹阳精兵渡江定江东（《三国志·吴书·孙破虏讨逆传》）。
  li_lx_d_liguang: { name: '陇右突骑', tier: 2 },        // 李广：陇西骑射，历任边郡太守击匈奴（《史记·李将军列传》）。
  li_s_mayuan: { name: '大汉伏波', tier: 2 },            // 马援：伏波将军南征交趾、北击乌桓（《后汉书·马援传》）。
  ningkou_liling: { name: '汉连弩卫', tier: 2 },         // 李陵：浚稽山以步卒连弩抗匈奴骑军（《汉书·李广苏建传》）。
  satsuma_daojinjiajiu: { name: '萨摩隼人', tier: 2 },   // 岛津家久：萨摩隼人为岛津氏地方武士骨干；「示现流」是剑术流派，不与铁炮拼成虚构番号。
  shuofang_weiqing: { name: '期门郎骑', tier: 3 },       // 卫青：由建章监、侍中统郎卫骑军出征，后为大将军（《史记·卫将军骠骑列传》）。
  jingmen_zhaoyun: { name: '长坂血骑', tier: 3 },        // 赵云：长坂护主突围的骑从文化符号（《三国志·蜀书·赵云传》）。
  chu_guanyu: { name: '荆州校刀手', tier: 3 },           // 关羽：镇荆州本部校刀手，具蜀汉与荆州辨识度（《三国志·蜀书·关羽传》及文学形象）。
  langzhou_zhangfei: { name: '巴西板楯蛮', tier: 3 },    // 张飞：巴西郡驻防，巴郡板楯蛮为巴蜀劲兵（《后汉书·南蛮传》《三国志·蜀书·张飞传》）。
  qingqiang_jiangwei: { name: '冉駹突骑', tier: 3 },     // 姜维：经营陇右、汶山羌胡地区，所统含冉駹等蜀边部众（《三国志·蜀书·姜维传》）。
  yueyi_zhangyi: { name: '牦牛戍锋', tier: 3 },          // 张嶷：镇越嶲、定牦牛道，南中戍兵为其本部（《三国志·蜀书·张嶷传》）。
  nanzhong_mazhong: { name: '兴古戍锋', tier: 3 },       // 马忠：镇南中、守兴古，所统南中戍兵（《三国志·蜀书·马忠传》）。
  huaiyang_zhouyafu: { name: '细柳营', tier: 3 },        // 周亚夫：细柳营军纪著名，后统军平七国之乱（《史记·绛侯周勃世家》）。
  ruzhou_sunjian: { name: '赤帻先锋', tier: 3 },         // 孙坚：赤帻为标识，常率先登陷阵（《三国志·吴书·孙破虏传》裴注《吴书》）。
  jiang_s_huanggai: { name: '零陵蒙冲', tier: 3 },       // 黄盖：镇零陵、领孙吴水军，赤壁献策火攻（《三国志·吴书·黄盖传》）。
  hao_d_weirui: { name: '钟离护卫', tier: 3 },           // 韦睿：钟离之战统梁军破魏，所部具水军与工事先筑特色（《梁书·韦睿传》）。
  ying_caojingzong: { name: '汉沔水锋', tier: 3 },       // 曹景宗：汉沔水军随韦睿援钟离破魏（《梁书·曹景宗传》）。
  xiao_d_xiaoyan: { name: '兰陵护卫', tier: 3 },         // 萧衍：兰陵萧氏部曲与雍州起兵本部（《梁书·武帝纪》）。
  long2_weixiaokuan: { name: '陇上暗桩', tier: 3 },      // 韦孝宽：镇陇右、玉壁，善用谍候与守备（《周书·韦孝宽传》）。
  zhuqian_shaoerzineng: { name: '警固番役', tier: 3 },   // 少贰资能：筑紫警固番役为地方武士戍役，非独立战略野战军。
  mi_mizhu: { name: '朐山弩手', tier: 4 },               // 麋竺：东海朐县乡里部曲，随其入蜀（《三国志·蜀书·麋竺传》）。
  fu_zhou_yanyan: { name: '涪陵劲卒', tier: 4 },         // 严颜：巴郡守将，所统巴地州郡兵（《三国志·蜀书·张飞传》）。
  lizhou_d_liaohua: { name: '剑阁戍卒', tier: 4 },       // 廖化：蜀汉后期右车骑将军，守御剑阁一线（《三国志·蜀书·廖化传》）。
  tongma_taishici: { name: '高密强弩', tier: 4 },        // 太史慈：东莱高密人，以弓弩武勇与乡里部从著称（《三国志·吴书·太史慈传》）。
  chen2_zhaofan: { name: '桂阳戍卒', tier: 4 },          // 赵范：桂阳太守，所统本郡戍兵（《三国志·蜀书·赵云传》裴注《云别传》）。
  guangxin_shixie: { name: '苍梧越甲', tier: 4 },        // 士燮：交趾、苍梧地方部曲，长期镇交州（《三国志·吴书·士燮传》）。
  heng_hetengjiao: { name: '衡州义军', tier: 4 },        // 何腾蛟：驻衡州联络南明诸军与义师（《明史·何腾蛟传》）。
  jingjiang_qushisi: { name: '靖江府卫', tier: 4 },      // 瞿式耜：留守桂林，统靖江地方守卫与义师（《明史·瞿式耜传》）。
  kalan_suhela: { name: '萨珊边骑', tier: 4 },           // 苏赫拉：萨珊边军将领，不与苏伦的帕提亚铁骑混挂。
  hali_gedaerzi: { name: '萨洛尔弓骑', tier: 4 },        // 戈达尔兹：萨洛尔地方部族弓骑，避免与帕提亚铁骑同名异档。
  yingzhou_d2_licunxu: { name: '从马直', tier: 2 },      // 李存勖：亲军从马直，柏乡等役为突击主力；鸦儿军归李克用（《旧五代史·庄宗纪》）。
  iyo_d_cunshangwuji: { name: '村上水军', tier: 3 },     // 村上武吉：能岛村上氏水军由其亲统，严岛等役为主力；毛利元就只取严岛伏兵，不混挂（《毛利家文书》）。
  qi_d_qijiguang: { name: '戚家军', tier: 1 },           // 戚继光：募义乌兵练成戚家军，台州九捷、东南平倭并长期转战南北，符合 v3 T1（《明史·戚继光传》）。

  // 🔴 [2026-10-26 主人令「名将最好一人一支精锐，一个精锐最好只给一个武将」]
  // 下列均恢复《武将百科》旧档已有的专属番号与档位，不为凑唯一另造新名。
  yangshao_zhoubo: { name: '安刘北军', tier: 3 },
  jingzhou_gs_huangfusong: { name: '安定突骑', tier: 3 },
  xiayang_d_dengyu: { name: '西河突骑', tier: 3 },
  liu_yingbu: { name: '九江裂骑', tier: 3 },
  lanzhou_zhaochongguo: { name: '湟中胡骑', tier: 3 },
  quli_chentang: { name: '轮台屯骑', tier: 3 },
  guangwu_xinwuxian: { name: '河西突骑', tier: 3 },
  pulei_dougu: { name: '蒲类落雕骑', tier: 3 },
  merkit_boyan: { name: '岭北屯骑', tier: 3 },
  chahar_yantiemuer: { name: '哈剌赤军', tier: 2 },
  mi_chu_xionglv: { name: '左广右广', tier: 2 },
  dingzhou_d_murongchui: { name: '鲜卑甲骑', tier: 2 },
  yeli_yeliwangrong: { name: '擒生军', tier: 3 },
  xiazhou_lijiqian: { name: '平夏部骑', tier: 3 },
  pinghai_laihuer: { name: '征东舟师', tier: 2 },
  hongnong_jun_yangsu: { name: '黄龙水师', tier: 3 },
  jiyuan_huluguang: { name: '落雕卫', tier: 3 },
  zhen_zhenxuan: { name: '完山虎贲', tier: 3 },
  seljuq_sangjiaer: { name: '塞尔柱突骑', tier: 1 },
  najie_minande: { name: '那竭方阵兵', tier: 3 },
  jiazini_mahamaode: { name: '伽色尼禁卫', tier: 2 },
  dizhou_wangyanzhang: { name: '龙骧军', tier: 2 },
  dang_d_zhuwen: { name: '厅子都', tier: 2 },
  ssangseong_cuiying: { name: '瀑池弩手', tier: 3 },
  cai_lishuo: { name: '十八骑', tier: 3 },              // 石勒：起兵核心十八骑（《晋书·石勒载记》），旧档「汲桑所与」是叙述语，不作番号。
  nong2_nongzhigao: { name: '侬峒狼兵', tier: 3 },
  dongxu_mangruiti: { name: '金象陷阵', tier: 2 },
  guo_jixin: { name: '果州戍兵', tier: 4 },
  baishui_yanghuai: { name: '白水戍卒', tier: 4 },
  kuai_kuaiyue: { name: '蒯氏宗兵', tier: 4 },
  guide_d_xiaohe: { name: '酂侯亲卫', tier: 4 },
  chu_d_lukang: { name: '庐江义旅', tier: 4 },
  wuyuan_d_chengui: { name: '五原塞卒', tier: 4 },
  woye_huangfugui: { name: '沃野镇兵', tier: 3 },
  dongsheng_weishang: { name: '云中彀骑', tier: 3 },
  ganzhou_dourong: { name: '觻得精骑', tier: 2 },
  xiutu_jinridi: { name: '休屠王骑', tier: 3 },
  lushui_dongzhuo: { name: '飞熊军', tier: 2 },
  kunming_yi_lucheng: { name: '会川藤甲兵', tier: 3 },
  miao_qing_yangwanzhe: { name: '黑旗苗獠', tier: 3 },
  chunshen_huangxie: { name: '春申门客', tier: 4 },
  yong_lujili: { name: '庸国戍卒', tier: 4 },
  ruochu_doulian: { name: '若敖六卒', tier: 2 },
  xiongding_murongyong: { name: '鲜卑燕骑', tier: 4 },
  mushi_muchong: { name: '大岘戟士', tier: 4 },
  yingli_jilasiyi: { name: '泼喜军', tier: 2 },
  huo_songlaosheng: { name: '霍邑骁锐', tier: 4 },
  chile_hulvjin: { name: '两池军', tier: 3 },
  naju_d_wangjian_wangye: { name: '罗州精兵', tier: 4 },
  shixing_houandou: { name: '大庾岭突锋', tier: 3 },
  ouyang_ouyangwei: { name: '庐陵蛮兵', tier: 4 },
  fu2_zhoudi: { name: '临川郡兵', tier: 4 },
  muer_mujier: { name: '呼罗珊义从', tier: 4 },
  baha_gaiwamu: { name: '巴哈尔兹卫', tier: 4 },
  jibin_jianisejia: { name: '迦毕试梵骑', tier: 2 },
  yaoluoge_yaoluogepusa: { name: '娑陵鹰骑', tier: 4 },
  guzgan_abuhalisi: { name: '古兹根卫队', tier: 4 },
  liao_houhongyuan: { name: '巴僚弩手', tier: 4 },
  qingyi_fanchangsheng: { name: '天师道众', tier: 3 },
  yunzhong_tuobaliwei: { name: '苍头军', tier: 3 },
  donghu_tuiyin: { name: '东胡骑', tier: 4 },
  woju_yinguan: { name: '别武班', tier: 2 },
  ssangseong_lizichun: { name: '和宁戍骑', tier: 4 },
  monong_anong: { name: '墨侬部卒', tier: 4 },
  niang_suonanjiabo: { name: '琼结卫', tier: 4 },
  pazhu_redangunsangpa: { name: '江孜宗武士', tier: 2 },
  xuantu_yuangaisuwen: { name: '皂衣先人', tier: 2 },
  huimo_gaoyanshou: { name: '濊貊长矛手', tier: 4 },
  higo_d_juchiwuguang: { name: '菊池党', tier: 3 },
  jinling_tandaoji: { name: '量沙军', tier: 2 },

  // 多名将不得共用一支有明确主人的精锐；按各自主导战役、军区或本部拆分。
  gen_artaphernes: { name: '萨迪斯军', tier: 3 },       // 阿尔塔弗涅斯：吕底亚总督，萨迪斯军区本部。
  gen_datis: { name: '米底军', tier: 2 },          // 达提斯：前490 与阿尔塔弗涅斯统军远征、登陆马拉松（希罗多德《历史》）。
  aliya_satibazanishi: { name: '阿里亚骑', tier: 3 },   // 萨提巴扎尼斯：阿里亚总督，所部为阿里亚军区骑兵。
  hekaniya_artabazos: { name: '普拉提亚卫', tier: 2 },  // 阿尔塔巴佐斯：普拉提亚战役所部后卫（希罗多德《历史》）。
  eerbulushi_beisusi: { name: '大夏骑军', tier: 3 },    // 贝苏斯：巴克特里亚（大夏）总督本部骑军。
  xuliya_shoujiang: { name: '高加米拉骑', tier: 2 },    // 马泽乌斯：高加米拉之战统波斯右翼骑兵（阿里安《亚历山大远征记》）。
  gen_raymond_iv: { name: '图卢兹军', tier: 2 },        // 雷蒙四世：图卢兹伯国本部，第一次十字军南路主力。
  gen_louis_xi: { name: '皮卡第军', tier: 3 },          // 路易十一：与勃艮第争夺皮卡第的王国野战军。
  gen_boucicaut: { name: '尼科波利骑', tier: 2 },       // 布锡考特：尼科波利斯十字军法国骑士本部。
  gen_francis_i: { name: '马里尼昂军', tier: 2 },       // 弗朗索瓦一世：马里尼亚诺会战亲征军。
  gen_joanofarc: { name: '奥尔良义军', tier: 2 },       // 贞德：解奥尔良之围所统法军。
  yuan_d_hubilie: { name: '金莲川军', tier: 3 },        // 忽必烈：金莲川幕府与漠南亲王本部（《元史·世祖本纪》）。
  gen_zhang_rou: { name: '汉军万户', tier: 3 },         // 张柔：蒙古汉军万户，所统汉军世侯本部（《元史·张柔传》）。
  gen_clovis_i: { name: '萨利安军', tier: 3 },          // 克洛维：萨利安法兰克本部。
  falanji_baodewen: { name: '佛兰德骑', tier: 2 },      // 鲍德温九世：佛兰德伯国骑士，第四次十字军本部。
  gen_otto_great: { name: '萨克森军', tier: 2 },        // 奥托一世：萨克森公国本部，莱希河战役核心。
  baojialiya_aseni: { name: '阿森义军', tier: 2 },      // 阿森一世：1185 反拜占庭起义本部。
  duonaobaojia_samuel: { name: '奥赫里德军', tier: 3 }, // 萨穆伊尔：奥赫里德政权本部军。
  gen_krum: { name: '普利斯卡军', tier: 2 },            // 克鲁姆：811 普利斯卡歼拜占庭军。
  gen_ivaylo: { name: '农民义军', tier: 2 },            // 伊瓦伊洛：保加利亚农民起义军。
  jialiboli_kaluoyang: { name: '库曼骑军', tier: 2 },   // 卡洛扬：所部库曼、瓦拉几亚联军骑军。
  gen_simeon_great: { name: '阿赫洛军', tier: 2 },      // 西美昂：917 阿赫洛河大破拜占庭之本部。
  abasi_muwafake: { name: '赞吉讨军', tier: 2 },        // 穆瓦法克：主持平定赞吉起义的野战军。
  samaila_muataisuimu: { name: '突厥古拉姆', tier: 2 }, // 穆阿台绥姆：萨迈拉突厥古拉姆新军。
  xishudongyin_lijiasipi: { name: '马尼拉守军', tier: 4 }, // 莱加斯皮：菲律宾远征与马尼拉殖民军本部。
  kasidiliya_afangsuoshiyi: { name: '萨拉多军', tier: 2 }, // 阿方索十一世：1340 萨拉多会战亲征军。
  gen_juan_i_castile: { name: '卡斯蒂王军', tier: 3 },     // 胡安一世：卡斯蒂利亚王军本部。
  kasidiliya_afangsuoba: { name: '纳瓦斯军', tier: 2 },    // 阿方索八世：1212 纳瓦斯·德托洛萨会战联军本部。
  gen_fernando_iii: { name: '塞维利亚军', tier: 2 },       // 费尔南多三世：收复塞维利亚的围攻军。
  gen_ferdinand_ii: { name: '格拉纳达军', tier: 2 },       // 斐迪南二世：格拉纳达战争王军。
  gen_el_cid: { name: '瓦伦西亚军', tier: 2 },             // 熙德：据守瓦伦西亚的本部军。
  gen_algirdas: { name: '立陶宛公军', tier: 3 },           // 奥尔格尔德：立陶宛大公国本部，与经典战条目分用战场番号。
  gen_vytautas_great: { name: '格伦瓦德军', tier: 2 },     // 维托夫特：1410 格伦瓦德会战立陶宛军。
  gen_kestutis: { name: '特拉凯军', tier: 3 },             // 科斯图提斯：特拉凯公国本部。
  gen_frederic_ii: { name: '西西里王军', tier: 3 },        // 腓特烈二世：西西里王国本部军。
  gen_bohemond: { name: '安条克骑', tier: 2 },             // 博希蒙德：安条克公国诺曼骑军。
  gen_robert_guiscard: { name: '都拉斯军', tier: 2 },      // 吉斯卡尔：都拉斯（迪拉基乌姆）战役诺曼军。
  hre_manfred: { name: '贝内文托军', tier: 3 },            // 曼弗雷德：贝内文托战役所部。
  gen_roger_i: { name: '墨西拿军', tier: 2 },              // 罗杰一世：渡墨西拿海峡征服西西里的诺曼本部。
  gen_charles_i_naples: { name: '那不勒斯军', tier: 3 },   // 卡洛一世：那不勒斯王国本部。
  gen_aristides: { name: '马拉松重装', tier: 2 },          // 阿里斯提德：马拉松会战雅典重装步兵。
  gen_chabrias: { name: '纳克索斯舰', tier: 2 },           // 卡布里亚斯：前376 纳克索斯海战舰队。
  bfe2_conon: { name: '克尼多斯舰', tier: 2 },             // 科农：前394 克尼多斯海战舰队。
  sashan_khosrow_ii: { name: '达拉骑军', tier: 3 },        // 霍斯劳二世：对美索不达米亚与拜占庭战争本部。
  sashan_bahram_vi: { name: '雷伊骑军', tier: 2 },         // 巴赫拉姆六世（楚宾）：雷伊起兵与米太本部骑军。
  shahelude_weisitamu: { name: '米太骑军', tier: 3 },      // 维斯塔姆：米太与希尔卡尼亚地方本部。
  talike_talike: { name: '直布罗陀军', tier: 2 },          // 塔里克：渡直布罗陀征服西哥特之本部。
  womaya_muaweiye: { name: '叙利亚军', tier: 3 },          // 穆阿维叶：长期任叙利亚总督之本部军。
  gen_abd_al_rahman_iii: { name: '科尔多瓦军', tier: 3 },  // 拉赫曼三世：科尔多瓦哈里发王军。
  womaya_abdrahman: { name: '安达卢斯军', tier: 3 },       // 拉赫曼一世：入安达卢斯建立后倭马亚之本部。

  // [2026-10-26 主人令] 名将专属番号按史拆分：一支有明确历史主人的精锐不再由多位名将共带。
  gen_sadashivrao: { name: '马拉塔军', tier: 3 },         // 萨达希夫：马拉塔北伐军，第三次帕尼帕特战役本部。
  gen_hemu: { name: '苏尔军', tier: 3 },                 // 赫穆：苏尔王朝军，第二次帕尼帕特战役本部。
  deli_alawuding: { name: '卡尔吉军', tier: 2 },          // 阿拉乌丁：卡尔吉王朝军，屡败蒙古并征服德干诸国。
  gen_ibrahim_lodi: { name: '洛迪军', tier: 3 },          // 洛迪：第一次帕尼帕特战役的洛迪王军。
  xindu_bahelamuhan: { name: '帕尼帕特军', tier: 2 },     // 拜拉姆汗：1556 第二次帕尼帕特战役击败赫穆之本部。
  muertan_naxierding: { name: '木尔坦军', tier: 3 },      // 纳西尔丁·卡巴恰：据乌奇、木尔坦的割据军。
  gen_lajos_ii: { name: '莫哈奇军', tier: 3 },           // 拉约什二世：1526 莫哈奇战役匈牙利王军。
  xiongyati_yannuoshi: { name: '白城堡军', tier: 2 },     // 匈雅提：1456 白城堡（贝尔格莱德）解围军。
  gen_brasidas: { name: '安菲波军', tier: 2 },            // 巴西达斯：前422 安菲波利斯战役本部。
  gen_lysander: { name: '羊河舰队', tier: 2 },            // 吕山德：前405 羊河海战歼雅典舰队之本部。
  bolan_suobiesiji: { name: '维也纳援军', tier: 2 },      // 索别斯基：1683 维也纳战役波兰援军。
  gen_boleslaw_brave: { name: '格涅兹诺军', tier: 3 },    // 勇者波列：以格涅兹诺为核心的波兰公军。
  gen_joao_i: { name: '阿尔儒巴军', tier: 2 },            // 若昂一世：1385 阿尔儒巴罗塔会战本部。
  gen_hannibal: { name: '坎尼军', tier: 2 },              // 汉尼拔：前216 坎尼会战合围罗马军之本部。
  gen_hamilcar: { name: '巴卡军', tier: 3 },              // 哈米尔卡：经营伊比利亚的巴卡家族本部。
  wangdaer_gaisalike: { name: '汪达尔海军', tier: 2 },    // 盖萨里克：468 邦角海战大破东罗马舰队。
  zhuozhou_shisiming: { name: '范阳叛军', tier: 3 },      // 史思明：范阳起兵及其后所统燕军。
  safawei_d_abasi: { name: '古拉姆新军', tier: 2 },       // 阿拔斯一世：军制改革后的古拉姆新军。
  yilihanguo_yisimeier: { name: '奇兹尔巴什', tier: 2 },  // 伊斯玛仪一世：萨法维建国核心奇兹尔巴什。
  yilihanguo_kitbuqa: { name: '艾因贾鲁军', tier: 3 },    // 怯的不花：1260 艾因贾鲁战役蒙古本部。
  gen_batu: { name: '金帐骑军', tier: 2 },              // 拔都：1236—1242 长子西征本部。
  gen_mamai: { name: '蓝帐军', tier: 3 },                // 马麦：金帐汗国西部蓝帐系军。
  jinzhang_nogai: { name: '那海部骑', tier: 3 },          // 那海：所统那海兀鲁思骑军。
  gen_tashfin: { name: '萨拉卡军', tier: 2 },             // 优素福·本·塔什芬：1086 萨拉卡会战穆拉比特军。
  malin_abulhasan: { name: '马拉喀什军', tier: 3 },       // 阿布哈桑：马林王朝马拉喀什本部。
  gen_kusaila: { name: '柏柏尔义军', tier: 3 },           // 库赛拉：抗击倭马亚的柏柏尔部众。
  xisi_yakubusafaer: { name: '锡斯坦军', tier: 3 },        // 雅各布·本·莱斯：锡斯坦萨法尔王朝本部。
  xisi_amr: { name: '巴尔赫军', tier: 3 },               // 阿姆尔：据巴尔赫与呼罗珊之本部。
  zhalange_barsaentes: { name: '扎兰季军', tier: 3 },     // 巴尔塞恩特斯：扎兰季地方本部，不占萨法尔王朝番号。
  gen_charles_xii: { name: '卡罗林军', tier: 2 },         // 查理十二：大北方战争中的瑞典卡罗林军。
  tuolemi_tuolemi: { name: '加沙军', tier: 2 },           // 托勒密一世：前312 加沙会战联军本部。
  gen_dmitry_donskoy: { name: '库利科沃军', tier: 2 },    // 顿斯科伊：1380 库利科沃会战罗斯联军。
  gen_vasili_iii: { name: '斯摩棱军', tier: 2 },          // 瓦西里三世：1514 攻取斯摩棱斯克之本部。
  gen_vladimir_andreyevich: { name: '谢尔普军', tier: 3 }, // 勇者弗拉基米尔：谢尔普霍夫公国本部。
  gurjara_vatsaraja: { name: '曲女城军', tier: 3 },       // 瓦萨拉贾：争夺曲女城的瞿折罗本部。
  gurjara_nagabhata_ii: { name: '拉贾斯坦军', tier: 2 },  // 那加巴塔二世：拉贾斯坦抗击阿拉伯扩张之本部。
  gen_alfonso_vi: { name: '托莱多军', tier: 2 },          // 阿方索六世：1085 收复托莱多之王军。
  gen_alaric: { name: '阿德里安军', tier: 2 },            // 亚拉里克：378 阿德里安堡会战西哥特军。
  boluo_damoboluo: { name: '孟加拉军', tier: 3 },         // 达磨波罗：波罗王朝孟加拉本部。
  gen_shashanka: { name: '高达军', tier: 3 },             // 设赏迦：高达王国本部。
  varendra_devapala: { name: '那烂陀军', tier: 3 },       // 提婆波罗：波罗王朝那烂陀与孟加拉本部。
  gen_baodewen_iv: { name: '蒙吉萨军', tier: 2 },         // 鲍德温四世：1177 蒙吉萨会战耶路撒冷军。
  aosiruowen_baodewen: { name: '耶路撒冷军', tier: 3 },   // 鲍德温一世：耶路撒冷王国本部。
  mowoer_akeba: { name: '拉贾普特军', tier: 3 },          // 阿克巴：征服与整编拉贾普特诸邦之本部。
  babuer_babuer: { name: '莫卧儿近卫', tier: 2 },         // 巴布尔：帕尼帕特、坎瓦会战野战本部。
  gen_vlad_impaler: { name: '夜袭军', tier: 2 },          // 弗拉德三世：1462 夜袭奥斯曼军营之本部。
  gen_basarab_i: { name: '波萨达军', tier: 2 },           // 巴萨拉布一世：1330 波萨达会战瓦拉几亚军。
  gen_topa_inca: { name: '大耳卫队', tier: 3 },         // 图帕克：扩张安第斯诸地的印加本部。
  gen_pachacuti: { name: '库斯科军', tier: 2 },           // 帕查库提：库斯科击破昌卡之本部。
  danmai_abusalong: { name: '丹麦舰队', tier: 3 },        // 阿布萨隆：丹麦海岸与波罗的海征伐舰队。
  gen_akechi_mitsuhide: { name: '本能寺军', tier: 2 },    // 明智光秀：1582 本能寺奇袭本部。
  zhelouqi_puliteweilajie: { name: '乔汉骑军', tier: 3 }, // 普里特维拉杰：乔汉王朝骑军，与经典战条目分号。
  maidina_halide: { name: '雅尔穆克军', tier: 2 },        // 哈立德：636 雅尔穆克会战穆斯林军。
  maidina_ali: { name: '巴士拉军', tier: 3 },             // 阿里：656 巴士拉骆驼之战本部。
  gen_liu_guoxuan: { name: '东宁水师', tier: 3 },         // 刘国轩：明郑东宁水师，不占沈有容澎湖守军番号。
  gen_charlemagne: { name: '伦巴第军', tier: 2 },         // 查理曼：773—774 征服伦巴第王国之本部。
  han_d_liubang: { name: '丰沛子弟', tier: 3 },           // 刘邦：丰沛起兵所率乡里部曲。
  cangsong_machao: { name: '渭南骑军', tier: 2 },         // 马超：211 渭南会战凉州联军骑军，不与华雄西凉铁骑混用。
  shu_masu: { name: '街亭军', tier: 3 },                 // 马谡：228 街亭所部，不占刘备白毦精兵番号。

  // 名将专属番号下的跨时代／跨政权回落，改回各将真实本部；同朝通制兵仍允许合理共用。
  mazhaer_bela_iv: { name: '赛约河军', tier: 3 },        // 贝拉四世：1241 赛约河战役匈牙利王军，非后世黑军。
  mazhaer_charles_i: { name: '罗兹戈尼军', tier: 2 },    // 查理一世：1312 罗兹戈尼会战本部，非后世黑军。
  shaiyue_aerpade: { name: '马扎尔军', tier: 3 },        // 阿尔帕德：马扎尔人迁居喀尔巴阡盆地之本部。
  bfe3_80: { name: '鹿头关军', tier: 3 },                // 张微：鹿头关所部晋军，不占刘备白毦精兵。
  bfe3_2: { name: '葭萌守军', tier: 3 },                 // 芦子霸王：葭萌地方守军，不占刘备白毦精兵。
  bfe3_75: { name: '建宁夷兵', tier: 3 },                // 刘胄：建宁南中起事部众，不占刘备白毦精兵。
  zhuozhou_anshouzhong: { name: '香积寺军', tier: 3 },   // 安守忠：757 香积寺战役燕军本部。
  dayan_cuiqianyou: { name: '灵宝军', tier: 2 },         // 崔乾祐：756 灵宝伏破哥舒翰之本部。
  bfe_yin_ziqi: { name: '睢阳围军', tier: 3 },           // 尹子奇：757 围攻睢阳所部。
  lunbadi_alboin: { name: '伦巴第王军', tier: 2 },       // 阿尔博因：568 起征服意大利北部的伦巴第本部。
  aiji_neiketaneibu: { name: '塞本尼军', tier: 3 },      // 内克塔内布：以塞本尼图斯为都的埃及王军。
  hre_siegfried: { name: '科隆军', tier: 4 },            // 西格弗里德：科隆地方本部，不占查理马特图尔军。
  bfe3_86: { name: '斯特拉斯军', tier: 3 },              // 克诺多马尔：357 斯特拉斯堡战役阿勒曼尼军。
  falanji_kalman: { name: '巴伐利亚军', tier: 3 },       // 卡洛曼：所领巴伐利亚本部，不占查理马特图尔军。
  gaoqi_d_xiaogui: { name: '白下军', tier: 3 },          // 萧轨：556 白下之战北齐军，不占高欢百保鲜卑。
  gen_chen_youliang: { name: '鄱阳水师', tier: 3 },      // 陈友谅：1363 鄱阳湖水战本部。
  chenli_d_zuoxianwang: { name: '武昌卫军', tier: 4 },   // 张必先：武昌守军本部。
  gen_albert_riga: { name: '里加主教军', tier: 4 },      // 阿尔伯特：里加主教区本部，与宝剑骑士团区分。
  gen_prettenberg: { name: '立窝尼亚军', tier: 3 },      // 普雷特贝格：立窝尼亚骑士团本部。
  yamaxun_xibolvte: { name: '亚马逊骑', tier: 3 },       // 希波吕忒：史源转述的亚马逊女骑，非本都王军。
  xian_d_xianfuren: { name: '高凉军', tier: 3 },         // 冼英：高凉本部，551 破李迁仕，非后世儋耳黎兵。
  jialebi_brasilesuo: { name: '卡塔赫纳军', tier: 2 },   // 布拉斯·德·莱索：1741 卡塔赫纳守军大败英军。
  gen_thoros: { name: '奇里乞亚军', tier: 3 },           // 托罗斯二世：奇里乞亚亚美尼亚本部，非乌拉尔图军。
  gen_villaret: { name: '罗德岛骑士', tier: 3 },         // 维拉雷：罗德岛医院骑士团，与马耳他大围攻区分。
  gen_toghtekin: { name: '大马士革军', tier: 3 },        // 图格特金：大马士革阿塔贝格本部，非萨迈拉古拉姆。
  bfe_abdullah_ali: { name: '尼西比斯军', tier: 3 },     // 阿卜杜拉：754 尼西比斯叛乱所部。
  bfe2_cleon: { name: '斯法克军', tier: 2 },             // 克里昂：前425 斯法克特里亚受降斯巴达军之本部。
  fujisi_fujiweng: { name: '雅典舰队', tier: 3 },        // 福基翁：雅典海军本部，不占萨拉米斯舰。
  keerman_xierzhan_shoujiang: { name: '克尔曼军', tier: 4 }, // 克尔曼守将：地方守军，不占大流士长生军。
  golpayegan_yicheng: { name: '戈尔帕扬军', tier: 4 },   // 尼扎姆：戈尔帕扬地方本部。
  bfe2_pharnabazus: { name: '达斯基利军', tier: 3 },     // 法那巴佐斯：达斯基利翁总督区本部。
  mixiya_arsames: { name: '塔尔苏斯军', tier: 3 },       // 阿萨米斯：奇里乞亚塔尔苏斯本部。
  panfeiliya_apollonios: { name: '潘菲利亚军', tier: 4 }, // 阿波罗尼奥斯：潘菲利亚地方本部。
  xiaofulijiya_aerxitis: { name: '弗里吉亚军', tier: 4 }, // 阿尔西提斯：弗里吉亚地方本部。
  kamanniya_zongdu: { name: '卡尔曼军', tier: 4 },       // 阿斯普兰斯：卡尔曼尼亚总督区本部。
  bfe2_mardonius: { name: '普拉提亚军', tier: 3 },       // 马尔多尼乌斯：前479 普拉提亚战役波斯本部。

  // [2026-10-26 剩余通制兵逐组复核] 只拆跨政权、跨时代及有明确主人的番号；同朝同军通制兵不另造名。
  ribale_faheerdaolai: { name: '德莱木军', tier: 3 },     // 法赫尔道莱：白益王朝德莱木本部，非阿拔斯黑衣卫。
  youfaladi_yehaiya: { name: '巴尔马克军', tier: 4 },     // 巴尔马克：巴尔马克家族部曲，非哈里发禁卫。
  aliya_muhammad_tahir: { name: '塔希尔军', tier: 3 },    // 塔希尔：塔希尔王朝呼罗珊本部。
  bfe2_xerxes_i: { name: '长生军', tier: 2 },           // 薛西斯一世：前480 远征希腊的波斯王军，非埃兰战车。
  lulisitan_shoujiang: { name: '卢里斯军', tier: 4 },     // 卢里斯坦守将：地方守军，不占古埃兰番号。
  jiaye_punafamo: { name: '迦摩缕波军', tier: 3 },        // 普那伐摩：迦摩缕波伐摩王朝本部，非孔雀帝国战象。
  muxikani_muxikanuosi: { name: '阿罗尔军', tier: 3 },    // 穆西卡诺斯：印度河下游阿罗尔本国军，非孔雀帝国战象。
  sailiugu_yaghi: { name: '塞尔柱守军', tier: 3 },        // 雅吉西扬：1098 安条克塞尔柱守军，非古代塞琉古方阵。
  gen_carpini: { name: '安提瓦里军', tier: 4 },           // 柏朗嘉宾：1247—1252 任安提瓦里大主教，按驻地地方军配 T4，不占杜尚兵团。
  bfe3_83: { name: '成汉军', tier: 3 },                  // 李势：成汉末帝成都本部，不占祖父李特的流民帅突骑。
};

/**
 * 按 generalId 查询该武将的专属精锐配置（「一个武将一支精锐」）：
 * 1. 优先读 `FactionGeneral.eliteName` / `eliteTier`；
 * 2. 次读 `GENERAL_ELITE_LEGIONS[generalId]`；
 * 3. 回落到该武将自己的势力（自带 factionId 优先，没有才用所在据点的势力）的 `ALL_FACTION_ELITE_LEGIONS`。
 */
export function getGeneralEliteConfig(generalId: string | null | undefined): EliteLegionConfig | null {
  if (!generalId) return null;
  const hit = getRawGeneralByGeneralId(generalId);
  if (hit?.general.eliteName) {
    const fallbackTier = ALL_FACTION_ELITE_LEGIONS[hit.factionId]?.tier ?? 2;
    return {
      name: hit.general.eliteName,
      tier: hit.general.eliteTier ?? fallbackTier,
    };
  }
  const direct = GENERAL_ELITE_LEGIONS[generalId];
  if (direct) return direct;
  // 🔴 [2026-10-23 主人「一个武将，一个势力，一个精锐，一个军团，一个旗号」] 回落按**武将自己的势力**
  //    （挂在别家据点上的武将，如长安的霍去病＝汉），没有自带势力才用他所在据点的势力
  const ownFaction = hit?.general.factionId ?? hit?.factionId;
  if (ownFaction) {
    return ALL_FACTION_ELITE_LEGIONS[ownFaction] ?? null;
  }
  return null;
}

/** 按 generalId 查询该武将的专属精锐番号（「一个武将一支精锐」） */
export function getGeneralEliteLegionName(generalId: string | null | undefined): string | null {
  return getGeneralEliteConfig(generalId)?.name ?? null;
}

function buildCityEliteLegionMap(): Readonly<Record<string, EliteLegionConfig>> {
  // 🔴 [2026-10-22 主人新口径] 一个势力可以拥有多个据点：
  //    同势力的**每个据点**都拿到该势力的精锐配置（无将守城也有番号），不再只管首府。
  const map: Record<string, EliteLegionConfig> = {};
  for (const city of CITIES_V2) {
    const elite = ALL_FACTION_ELITE_LEGIONS[city.factionId];
    if (elite) map[city.id] = elite;
  }
  for (const [factionId, cityId] of Object.entries(STARTING_CAPITALS)) {
    if (cityId && !map[cityId]) {
      const elite = ALL_FACTION_ELITE_LEGIONS[factionId];
      if (elite) map[cityId] = elite;
    }
  }
  for (const list of Object.values(FACTION_GENERALS)) {
    if (!list) continue;
    const arr = Array.isArray(list) ? list : [list];
    for (const g of arr) {
      if (g.cityId && !map[g.cityId]) {
        const genElite = getGeneralEliteConfig(g.generalId);
        if (genElite) map[g.cityId] = genElite;
      }
    }
  }
  return map;
}

/** 运行时：出兵据点 cityId → 精锐番号（番号随城） */
export const CITY_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = buildCityEliteLegionMap();

function buildCityAnchorFactionMap(): Readonly<Record<string, string>> {
  // 🔴 [2026-10-22 主人新口径] 一个势力可以拥有多个据点（旧「一城一势力」作废）：
  //    每个据点都要有史料锚定势力，直接取 cities_v2.factionId；STARTING_CAPITALS 只作兜底。
  const map: Record<string, string> = {};
  for (const city of CITIES_V2) {
    if (city.factionId) map[city.id] = city.factionId;
  }
  for (const [factionId, cityId] of Object.entries(STARTING_CAPITALS)) {
    if (cityId && !map[cityId]) map[cityId] = factionId;
  }
  return map;
}

/** 据点 → 史料锚定势力（cities_v2.factionId；旗号易主不改变） */
export const CITY_ANCHOR_FACTION: Readonly<Record<string, string>> = buildCityAnchorFactionMap();

/** 据点在史料录入中锚定的势力 id（无则该城不出将/精） */
export function getCityAnchorFactionId(cityId: string | null | undefined): string | null {
  if (!cityId) return null;
  return CITY_ANCHOR_FACTION[cityId] ?? null;
}

/** 是否为有将/精录入的据点首都（募兵与守城共用） */
export function isCityGeneralEliteAnchor(cityId: string | null | undefined): boolean {
  if (!getCityAnchorFactionId(cityId)) return false;
  return getCityEliteConfig(cityId) != null;
}

/** 查番号/远征解锁时的军团最小接口 */
export type LegionEliteLookup = {
  getFactionId(): string;
  homeCityId?: string | null;
  getSourceCityId(): string | null;
  generalId?: string | null;
  /** 🔴 [2026-09-23] 战场事件的史实军团：番号直接挂在军团上（军团名只写「马其顿军团」，不再拼番号） */
  eliteOverride?: EliteLegionConfig | null;
};

export {
  JAPAN_EXPEDITION_ELITE_LEGIONS,
  KOREA_EXPEDITION_ELITE_LEGIONS,
  NORTHEAST_EXPEDITION_ELITE_LEGIONS,
  STEPPE_EXPEDITION_ELITE_LEGIONS,
  WESTERN_EXPEDITION_ELITE_LEGIONS,
  CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS,
  TIBET_EXPEDITION_ELITE_LEGIONS,
  DIANQIAN_EXPEDITION_ELITE_LEGIONS,
  LINGNAN_EXPEDITION_ELITE_LEGIONS,
  JIANGNAN_EXPEDITION_ELITE_LEGIONS,
  NORTH_EXPEDITION_ELITE_LEGIONS,
  CENTRAL_EXPEDITION_ELITE_LEGIONS,
  BASHU_EXPEDITION_ELITE_LEGIONS,
  HEXI_EXPEDITION_ELITE_LEGIONS,
  INDIA_EXPEDITION_ELITE_LEGIONS,
  BERBER_EXPEDITION_ELITE_LEGIONS,
};

/** 数据录入/审计：factionId → 番号（运行时募兵请用 getLegionEliteLegionName） */
export function getExpeditionEliteLegionName(factionId: string): string | null {
  return ALL_FACTION_ELITE_LEGIONS[factionId]?.name ?? null;
}

export function getExpeditionEliteConfig(factionId: string): EliteLegionConfig | null {
  return ALL_FACTION_ELITE_LEGIONS[factionId] ?? null;
}

/** @deprecated 旧「旗号=将精势力」校验；运行时改用 isCityGeneralEliteAnchor */
export function isFactionGeneralEliteAnchor(
  factionId: string,
  cityId: string | null | undefined,
): boolean {
  if (!cityId || factionId === 'panjun') return false;
  return STARTING_CAPITALS[factionId] === cityId;
}

/** 番号随将/随城：若有 generalId 优先查该武将专属精锐，否则据 cityId 查精锐配置 */
export function getCityEliteConfig(
  cityId: string | null | undefined,
  generalId?: string | null,
): EliteLegionConfig | null {
  if (generalId) {
    const genElite = getGeneralEliteConfig(generalId);
    if (genElite) return genElite;
  }
  if (!cityId) return null;
  return CITY_ELITE_LEGIONS[cityId] ?? null;
}

/** 番号随将/随城：若有 generalId 优先查该武将专属精锐番号，否则据 cityId 查精锐番号 */
export function getCityEliteLegionName(
  cityId: string | null | undefined,
  generalId?: string | null,
): string | null {
  return getCityEliteConfig(cityId, generalId)?.name ?? null;
}

/** @deprecated 运行时改用 getCityEliteConfig(cityId) */
export function getFactionCityEliteConfig(
  factionId: string,
  cityId: string | null | undefined,
): EliteLegionConfig | null {
  if (!isFactionGeneralEliteAnchor(factionId, cityId)) return null;
  return getCityEliteConfig(cityId);
}

/** @deprecated 运行时改用 getCityEliteLegionName(cityId) */
export function getFactionCityEliteLegionName(
  factionId: string,
  cityId: string | null | undefined,
): string | null {
  return getFactionCityEliteConfig(factionId, cityId)?.name ?? null;
}

/** 按军团将领/出兵据点查精锐（一个武将一支精锐：有 generalId 优先取该将精锐，否则按据点） */
export function getLegionEliteConfig(army: LegionEliteLookup): EliteLegionConfig | null {
  if (army.eliteOverride) return army.eliteOverride;
  if (army.generalId) {
    const genElite = getGeneralEliteConfig(army.generalId);
    if (genElite) return genElite;
    // 🔴 [2026-10-24 修「精锐跨势力外溢」（AGENTS 二-4：别国武将精锐不许随城错配）]
    //    有将却查不到专属精锐（典型：经典战拟名／战场人物不在将领档）→ 精锐随**本军势力**取；
    //    不再按 homeCityId/sourceCityId 的据点兜底，否则攻方会顶替被攻城（守方）的精锐
    //    （实例：葡萄牙攻伊瓜苏，攻方卡片显示守方的「传教区军」）。
    const ownFactionElite = ALL_FACTION_ELITE_LEGIONS[army.getFactionId()];
    return ownFactionElite ?? null;
  }
  const cityId = army.homeCityId ?? army.getSourceCityId();
  return getCityEliteConfig(cityId);
}

/** 番号随将/随城：按军团 generalId 或 homeCityId / sourceCityId 查精锐番号 */
export function getLegionEliteLegionName(army: LegionEliteLookup): string | null {
  return getLegionEliteConfig(army)?.name ?? null;
}

// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept([
        './JapanExpeditionLegions',
        './KoreaExpeditionLegions',
        './NortheastExpeditionLegions',
        './SteppeExpeditionLegions',
        './WesternExpeditionLegions',
        './CentralAsiaExpeditionLegions',
        './TibetExpeditionLegions',
        './DianQianExpeditionLegions',
        './LingnanExpeditionLegions',
        './JiangnanExpeditionLegions',
        './NorthExpeditionLegions',
        './CentralExpeditionLegions',
        './BashuExpeditionLegions',
        './HexiExpeditionLegions',
        './IndiaExpeditionLegions',
        './BerberExpeditionLegions',
    ], () => {
        console.log('[HMR] 精锐番号数据已更新（F5 生效）');
    });
    // @ts-ignore
    import.meta.hot.accept();
}
