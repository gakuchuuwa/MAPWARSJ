/**
 * 西域文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝东北草原一致：
 * - 番号至少 3 个汉字
 * - 同势力只挂一个番号（比知名度分流）
 * - 不收热兵器专名（§14 #9 叶尔羌火枪兵等）
 * - 依据 史料/古代精锐部队.md §14 #1–8；#10 喀喇契丹→中亚 xiliao@屈耽·斡耳朵亲卫
 */
export const WESTERN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  hepan: { name: '朅盘陀戍卒', tier: 3 }, // 石头城·裴神符
  bailong: { name: '白龙堆戍卒', tier: 3 }, // 三陇沙·白龙堆
  kepantuo: { name: '公主堡戍卒', tier: 3 }, // 公主堡·汉日天种王
  zhasaketu: { name: '札萨克图骑兵', tier: 3 }, // 扎布汗·策旺扎布
  huite: { name: '辉特部骑', tier: 1 }, // 金山·阿睦尔撒纳
  tuoming: { name: '回民团练', tier: 3 },  // 达坂城·妥明清真王
  chuyue: { name: '处月骑兵', tier: 3 }, // 独山城·沙陀那速
  keerkezi: { name: '柯尔克孜骑兵', tier: 3 }, // 斯姆哈纳·玛纳斯
  pisha: { name: '毗沙戍卒', tier: 3 }, // 麻扎塔格·毗沙
  xingxingxia: { name: '嵩武军', tier: 1 }, // 星星峡·张曜
  yangguan: { name: '阳关戍卒', tier: 3 }, // 阳关·班超
  wulianghai: { name: '乌梁海巡骑', tier: 3 }, // 布尔根·车凌乌巴什
  qiuci: { name: '龟兹精兵', tier: 3 },   // 伊逻卢·龟兹精兵
  yuchi: { name: '于阗精兵', tier: 3 },       // 于阗·尉迟王族精兵
  kala: { name: '阿斯古拉姆', tier: 1 },      // 奥什·喀喇汗古拉姆（灭于阗非以少胜多）
  an: { name: '昭武精骑', tier: 2 },        // 蒲华·昭武九姓安国（原伊列克近卫严重错代错位）
  yiduhu: { name: '西州回鹘', tier: 1 },      // 高昌·北庭回鹘取西州
  shule: { name: '阿斯兰近卫', tier: 1 },       // 盘橐·阿尔斯兰汗阿斯兰近卫
  yanqi: { name: '焉耆龙骑兵', tier: 2 },   // 员渠城·焉耆龙骑（§14 #6）
  wusun: { name: '昆莫亲卫', tier: 2 }, // 赤谷城·乌孙王帐
  chagatai: { name: '蒙兀儿铁骑', tier: 3 }, // 别失八里·东察合台
  dayuan: { name: '汗血天马骑', tier: 2 },   // 贵山城·大宛（守城非以少胜多）
  shache: { name: '莎车左右骑', tier: 2 },   // 渠莎·汉代西域强国
  anxi: { name: '大唐安西军', tier: 2 },     // 拨换城·安西都护府（无经典以少胜多）
  // §14 #9 叶尔羌火枪兵（火绳枪）→ 不收
  loulan: { name: '楼兰戍', tier: 3 },      // 扜泥城·汉晋楼兰戍卒（旗=楼兰·§12.1.1）
  zhuxie: { name: '朱邪部兵', tier: 3 },      // 大石城·沙陀朱邪部
  yuchi: { name: '于阗精兵', tier: 3 },       // 于阗·尉迟王族精兵（§14 #2）
  juandu: { name: '捐毒戍卒', tier: 3 },     // 排修城·汉西域捐毒国
  wensu: { name: '温宿锐卒', tier: 3 },      // 三重城·温宿国
  // §14 #10 喀喇契丹 → 见 CentralAsiaExpeditionLegions xiliao
  // ── 2026-06-16 新增：西域大区平衡补全（5支，精锐随据点，全图无六字番号） ──
  quli: { name: '轮台戍卒', tier: 3 },
  dzungar: { name: '塔城卫队', tier: 3 },
  yarkand: { name: '英吉沙骑兵', tier: 3 },
  tuerhute: { name: '鹰娑川铁骑', tier: 3 },
  gaochang: { name: '高昌铁骑', tier: 2 },    // 赤亭关·麴氏高昌具装骑（都城高昌，咸通前）
};
