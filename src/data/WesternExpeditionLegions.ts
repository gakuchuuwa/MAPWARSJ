/**
 * 西域文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝东北草原一致：
 * - 番号至少 3 个汉字
 * - 同势力只挂一个番号（比知名度分流）
 * - 不收热兵器专名（§14 #9 叶尔羌火枪兵等）
 * - 依据 史料/古代精锐部队.md §14 #1–8；#10 喀喇契丹→中亚 xiliao@屈耽·斡耳朵亲卫
 */
export const WESTERN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    bailong: { name: '白龙堆卫营', tier: 4 },
  kepantuo: { name: '公主堡铁卫', tier: 3 }, // 公主堡汉日天种王传奇，名号极具传奇色彩，升T2
  zhasaketu: { name: '札萨克图骑', tier: 4 }, // 扎布汗·策旺扎布
  huite: { name: '辉特部骑', tier: 4 }, // 额尔齐斯·阿睦尔撒纳叛清大军（缺乏极其著名的战术高光，降T3）
  tuoming: { name: '回民团练', tier: 4 },  // 达坂城·妥明清真王
  keerkezi: { name: '柯尔克孜骑', tier: 3 }, // 柯尔克孜族英雄玛纳斯史诗，显著文化知名度，升T2
  pisha: { name: '毗沙都督卫', tier: 4 }, // 麻扎塔格·毗沙
  xingxingxia: { name: '交河锐骑', tier: 3 }, // 交河故城是西域最为著名、最具沧桑感的历史文化名城符号，升入T3知名
  wulianghai: { name: '乌梁海巡骑', tier: 4 }, // 布尔根·车凌乌巴什
  qiuci: { name: '龟兹精兵', tier: 3 },   // 丝路第一大国龟兹，鸠摩罗什故国，显著文化知名度，升T2
  yuchi: { name: '于阗精兵', tier: 2 },       // 尉迟王族抗击黑汗四十载，独立坚守的特色王牌，升T2
  yiduhu: { name: '西州回鹘', tier: 3 },      // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
  shule: { name: '阿兰斯近卫', tier: 3 },     // 元代著名的“阿速回军”（阿兰人近卫军），深度介入元廷斗争的异族卫队，知名度极高，升入T3知名
    yanqi: { name: '焉耆龙骑兵', tier: 4 },
  wusun: { name: '昆莫亲卫', tier: 3 }, // 汉代西域最强霸主乌孙国国王（昆莫）亲卫，汉朝联姻抗匈的绝对盟友，升入T3知名
  dayuan: { name: '汗血天马骑', tier: 3 },   // 大宛汗血宝马+李广利万里远征，极高文化知名度，升T2
  shache: { name: '莎车左右骑', tier: 4 },   // 渠莎·汉代西域强国（缺乏极其著名的战术高光，降T3）
  // §14 #9 叶尔羌火枪兵（火绳枪）→ 不收
  loulan: { name: '精绝都护营', tier: 3 },      // 精绝古国尼雅遗址，神秘古国文化IP显著，升T2
  zhuxie: { name: '朱邪部兵', tier: 3 },      // 沙陀朱邪部，后唐后晋后汉三朝开国根基，升T2
  // 重复行已删
    juandu: { name: '安西都护军', tier: 3 },
  wensu: { name: '温宿锐卒', tier: 4 },      // 三重城·温宿国
  // §14 #10 喀喇契丹 → 见 CentralAsiaExpeditionLegions xiliao
  // ── 2026-06-16 新增：西域大区平衡补全（5支，精锐随据点，全图无六字番号） ──
    quli: { name: '轮台屯骑', tier: 3 },
  yarkand: { name: '英吉沙骑兵', tier: 4 },
    gaochang: { name: '高昌铁骑', tier: 3 },          // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
    yiwu: { name: '关西卫骑', tier: 4 },
  adao_d: { name: '昆岗军台营', tier: 4 },      // 昆岗·阿克苏道军台驿卒
  weitou: { name: '尉头国飞军', tier: 4 },    // 阿合奇·尉头国王城
  yumi: { name: '扜弥锐兵', tier: 4 },        // 阿赫雅尔·扜弥国王都
  qiemo: { name: '且末守捉', tier: 4 },       // 播仙·唐安西四镇且末
  pishan: { name: '皮山国兵', tier: 4 },      // 固玛·皮山国
  ruoqiang: { name: '婼羌部族兵', tier: 4 },  // 卡克里克·婼羌部落
  weili: { name: '尉犁飞骑', tier: 4 },       // 库尔勒·尉犁国王城
  duerbote: { name: '杜尔伯特骑', tier: 4 }, // 托克逊·杜尔伯特部
  sai: { name: '塞种弓骑', tier: 3 },         // 斯基泰人（塞种），横扫中亚及西域的古老印欧游牧霸主，文化及考古名气极大，升入T3知名
  xiye: { name: '西夜国兵', tier: 4 },        // 叶城·西夜国
  weiwuer: { name: '回部伯克卫', tier: 4 },   // 玉尔滚·回部伯克
    shanshan: { name: '楼兰弓手', tier: 3 },
    tajikezu: { name: '帕米尔山民', tier: 4 },
    khoja: { name: '白山派卫兵', tier: 4 },
    chagatai: { name: '戊己屯军', tier: 2 },
    kokand: { name: '浩罕骑兵', tier: 4 },
};
