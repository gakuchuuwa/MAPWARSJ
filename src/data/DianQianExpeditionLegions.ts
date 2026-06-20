/**
 * 滇缅文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线：
 * - 每文化区 ≥10 条；番号 3–6 字，全局不重复
 * - 番号取项目辞典/正史具名，禁止泛称堆砌「XX战象队」
 * - 不收热兵器专名（§11 #3 佛郎机火枪营；#6 日本人町不收）
 */
export const DIANQIAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  nanzhao: { name: '罗苴子', tier: 1 },        // 蒙舍城·天宝伏击唐军（联军占优非以少胜多）
  dali: { name: '大理白军', tier: 2 },         // 羊苴咩·§11 #2
  hantawadi: { name: '东吁象兵', tier: 0 },    // 勃固城·莽应龙象兵（区T0锚点·灭阿瑜陀耶）
  dongxu: { name: '东吁铁骑', tier: 1 },       // 东吁城·莽瑞体东吁铁骑
  konbaung: { name: '贡榜禁军', tier: 1 },   // 瑞波·贡榜禁军
  siam: { name: '皇家象骑兵', tier: 2 },       // 阿瑜陀耶·暹罗王家象兵（纳黎萱等；泰籍战史名，非中原式以少胜多顶格）
  pagan: { name: '缅王战象', tier: 1 },      // 蒲甘·阿奴律陀象军
  pyu: { name: '骠国戍卒', tier: 3 },        // 室利差罗·骠国
  champa: { name: '占婆国水师', tier: 2 },     // 美山·§10 #7（占族航海精锐）
  chenla: { name: '吴哥战象', tier: 3 },     // 吴哥·高棉战象
  luchuan: { name: '麓川夷象', tier: 2 }, // 勐卯·辞典 #96 三征麓川象兵
  dianguo: { name: '滇池兵', tier: 3 },       // 滇池·庄蹻滇国
  mu_lijiang: { name: '丽江土兵', tier: 3 },   // 大研·木氏土司兵
  mingzheng: { name: '明正土兵', tier: 2 },   // 打箭炉·坚赞德昌从征金川   // 打箭炉·明正土司兵
  anding_wei: { name: '安定卫戍', tier: 3 },   // 苦峪堡·明安定卫戍卒
  // 仲家兵除名（无此编制）
  hani_d: { name: '思陀甸兵', tier: 2 },      // 思陀·遮比归附从征安南
  wuman: { name: '东爨乌蛮兵', tier: 3 },     // 乌蒙山·东爨乌蛮兵
  cuanshi: { name: '爨族部兵', tier: 3 },      // 曲靖·爨氏
  suke: { name: '素可泰兵', tier: 3 },     // 双河城·素可泰王国
  ailao: { name: '哀牢戍兵', tier: 1 },       // 永昌·类牢反叛连破数城        // 永昌·哀牢国
  miaomin: { name: '苗疆义军', tier: 3 },
  dongzu: { name: '侗家义军', tier: 3 },
  zuo_d: { name: '清溪关弩手', tier: 3 },
  nanzhong: { name: '南中劲卒', tier: 1 },     // 宛温·马忠善射夷汉部曲
  yueyi: { name: '邛都戍', tier: 2 },         // 越嶲·焦璜戍守
pingnan: { name: '平南戍军', tier: 1 },       // 腾越城·沐晟征讨麓川
  jingdong: { name: '景东夷兵', tier: 1 },     // 银生城·陶洪屡退麓川
  shanzu: { name: '麓川象阵', tier: 2 },       // 阿瓦·思机发退守
  tonghai: { name: '通海节度兵', tier: 2 },     // 新兴·段俭魏通海都督
  mengzu: { name: '孟族水师', tier: 2 },       // 直通城·摩奴哈孟族王
  luohu: { name: '罗斛步卒', tier: 3 },        // 呵叻城·敢木丁驻守
  kunming_yi: { name: '昆明夷兵', tier: 1 },   // 会川·卤承斩哀牢王封侯
  taiyuan: { name: '兰纳锐卒', tier: 1 },      // 清坎城·芒莱王征服南奔开创兰纳
  baiman: { name: '白蛮甲士', tier: 1 },       // 威楚·高升泰平杨义贞复大理
  dai: { name: '车里战象', tier: 2 },          // 勐泐城·刀应勐傣兵助明御缅
  qiong: { name: '邛都夷兵', tier: 3 },        // 邛都·任贵自立邛谷王
};
