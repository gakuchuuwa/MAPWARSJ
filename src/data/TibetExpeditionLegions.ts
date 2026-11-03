/**
 * 青藏文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与其它文化区一致：
 * - 番号 3–5 个汉字（界面最多 5 字，禁止 6 字），全局不重复
 * - 同势力只挂一个番号（吐蕃合挂「却杰」赞普亲卫）
 * - 番号去「重装」泛称；依据 史料/古代精锐部队.md §12 共 11 支
 */
export const TIBET_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
  shaodang: { name: '湟中义从羌', tier: 3 },  // 东汉经典羌族从军制度，兵种名号极具特色，升T2
    tubo: { name: '吐蕃大纛军', tier: 1 },
  xiangxiong: { name: '象雄武士', tier: 3 },  // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
  gar_kham: { name: '德格骁骑', tier: 4 },    // 德格·康巴朵康先锋骑（§12 #7）（缺乏极其著名的战术高光，降T3）
  khoshut: { name: '和硕特铁骑', tier: 1 },   // 当雄·固始汗武力统一雪域的战略主力
  gurkha: { name: '廓尔喀弯刀', tier: 1 },    // 加德满都·廓尔喀库克里勇士
  tsangpa: { name: '藏巴汗卫队', tier: 3 },   // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
  // ── 2026-06-16 新增：青藏大区平衡补全（23支） ──
  supi: { name: '苏毗女卫', tier: 3 }, // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
    xiaobolu: { name: '勃律骑兵', tier: 4 },
    ladakh: { name: '玛域雪山卫', tier: 3 },
  khon: { name: '萨迦法王军', tier: 3 },               // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
  lang_clan: { name: '帕木竹巴军', tier: 3 }, // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
  karmapa: { name: '噶玛巴护教', tier: 4 },
    golog: { name: '果洛游骑', tier: 3 },
  // xihai_d 已移入 SteppeExpeditionLegions.ts（伏俟城改 XIANBEI）
  // 康区长刀卒除名（无此兵种）
  bailang: { name: '白狼锐卒', tier: 3 }, // 汉代著名西南夷部落，因一首《白狼歌》文化名气极大，升入T3知名
    xiadun: { name: '竹巴护法', tier: 3 },
  kongsa: { name: '孔萨土兵', tier: 4 },         // 甘孜·孔萨益多瞻对之役（常规番号，降T3）
    gling: { name: '玉树藏兵', tier: 4 },
  khyungpo: { name: '藏北苏毗兵', tier: 2 },    // 琼波邦色率苏毗兵灭象雄，吐蕃统一史关键，升T2
  galangdiba: { name: '波密民兵', tier: 4 },     // 噶朗宗·旺钦顿堆波密土王（常规番号，降T3）
  daca: { name: '八宿马队', tier: 4 },           // 八宿宗·达擦济咙活佛辖地
  dalung: { name: '达隆寺僧兵', tier: 4 },
  dong: { name: '玉树土兵', tier: 4 },               // 囊谦宗·隆庆：玉树土兵，避将名囊谦
  hor: { name: '霍尔部勇士', tier: 4 },
    ganden: { name: '格鲁僧兵', tier: 3 }, // 格鲁派（黄教）的武装僧兵，近现代西藏绝对政教核心力量，升入T3知名,
    xianlingqiang: { name: '湟水勇士', tier: 3 },
  // qifu_d 已移入 SteppeExpeditionLegions.ts（枹罕改 XIANBEI）
    jinchuan_g: { name: '嘉绒碉锋', tier: 3 },
  // tufa_d 已移入 SteppeExpeditionLegions.ts（青唐城改 XIANBEI）
    dangchang_guo: { name: '宕昌羌骑', tier: 3 },   // 宕昌｜统帅 梁勤｜T3 乘 1.2｜陇南羌族山地轻骑，依山阻险称雄西北数百年
};
