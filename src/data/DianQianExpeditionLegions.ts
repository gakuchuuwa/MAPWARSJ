/**
 * 滇缅文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线：
 * - 每文化区 ≥10 条；番号 3–6 字，全局不重复
 * - 番号取项目辞典/正史具名，禁止泛称堆砌「XX战象队」
 * - 不收热兵器专名（§11 #3 佛郎机火枪营；#6 日本人町不收）
 */
export const DIANQIAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
  nanzhao: { name: '罗苴子', tier: 3 },        // 南诏/大理特色精锐，兵种特色鲜明，但无明确战略级大捷，降为T3知名。
    dali: { name: '洱海白戟', tier: 3 },
  hantawadi: { name: '东吁象兵', tier: 1 },    // 勃固城·东吁王朝席卷中南半岛的战略主力
    dongxu: { name: '金象陷阵', tier: 2 },
    konbaung: { name: '莫罕猎兵', tier: 1 },
  siam: { name: '皇家象骑兵', tier: 1 },       // 阿瑜陀耶·暹罗复国与争霸中南半岛的战略主力
  pagan: { name: '缅王战象', tier: 3 },      // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
  pyu: { name: '骠国战象', tier: 4 },        // 室利差罗·骠国象卫
  champa: { name: '占婆国水师', tier: 3 },             // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
    chenla: { name: '吴哥战象', tier: 1 },
  luchuan: { name: '麓川夷象', tier: 3 }, // 明朝三征麓川时思氏仰仗的核心象阵，极具历史话题度和风土特色，升入T3知名
    dianguo: { name: '青铜殳', tier: 3 },
    mu_lijiang: { name: '丽江土兵', tier: 3 },
  mingzheng: { name: '明正土兵', tier: 4 },           // 打箭炉·坚赞德昌从征金川   // 打箭炉·明正土司兵（常规番号，降T3）

  // 仲家兵除名（无此编制）
  hani_d: { name: '思陀甸兵', tier: 4 },      // 思陀·遮比归附从征安南（缺乏极其著名的战术高光，降T3）
  cuanshi: { name: '爨族部兵', tier: 3 },      // 统治云南四百年的爨氏文化象征，西南历史的丰碑，升入T3知名
    suke: { name: '素可泰兵', tier: 3 },
  ailao: { name: '哀牢山营', tier: 4 },       // 永昌·类牢反叛连破数城（缺乏极其著名的战术高光，降T3）
    yueyi: { name: '牦牛戍锋', tier: 3 },
  jingdong: { name: '景东象卫', tier: 4 },     // 银生城·陶洪屡退麓川（缺乏极其著名的战术高光，降T3）
  luohu: { name: '罗斛步卒', tier: 4 },        // 呵叻城·敢木丁驻守
    kunming_yi: { name: '会川藤甲兵', tier: 3 },
    taiyuan: { name: '清坎陷象', tier: 2 },
  baiman: { name: '白蛮甲士', tier: 4 },       // 威楚·高升泰平杨义贞复大理（缺乏极其著名的战术高光，降T3）
  dai: { name: '车里战象', tier: 4 },          // 勐泐城·刀应勐傣兵助明御缅（缺乏极其著名的战术高光，降T3）
  ava: { name: '掸族象卫', tier: 4 },
    mon: { name: '孟族战象', tier: 4 },
    dian: { name: '秀山白义从', tier: 3 },
    ahaomu: { name: '阿豪姆舟师', tier: 3 },           // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
    wazu: { name: '阿佤猎兵', tier: 3 },              // 西南少数民族极其典型的风土特种武装，民族辨识度极高，升入T3知名
    jingpozu: { name: '景颇长刀兵', tier: 3 },
    yangzhou: { name: '无当飞军', tier: 2 },
    xingwei: { name: '木邦象兵', tier: 4 },
    dangzhou: { name: '阴平氐兵', tier: 2 },
    wenling: { name: '福建水师', tier: 3 },
};
