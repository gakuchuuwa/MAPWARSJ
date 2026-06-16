/**
 * 东北文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝一致：
 * - 番号至少 3 个汉字
 * - 同势力只挂一个番号（比知名度分流）
 * - 不收热兵器/近代/错区条目（§3 #7–24、#28–29）
 * - 依据 史料/古代精锐部队.md §3 #1–6、#8–9、#13、#25–27；§1 #85–86 交叉收录
 */
export const NORTHEAST_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  bohai: { name: '神贲禁卫', tier: 0 },       // 龙泉府·渤海左右神贲军（§1 #85）
  dajin: { name: '铁浮图', tier: 3 },         // 会宁府·金军重装（§3 #1）
  wanyan_d: { name: '拐子马队', tier: 3 },    // 双城·完颜氏拐子马（§3 #2）
  jurchen: { name: '猛安谋克', tier: 3 },     // 五国城·女真兵民合一（§3 #25）
  qing: { name: '忠孝军', tier: 3 },         // 安化·庆州；完颜陈和尚（§3 #3）
  jinzhou: { name: '辽东铁骑', tier: 1 },     // 徒河·明锦州卫；李成梁（§3 #6）
  zu_d: { name: '关宁铁骑', tier: 0 },       // 宁远·祖大寿（§3 #5）
  mao_wenlong: { name: '东江劲旅', tier: 3 }, // 皮岛·毛文龙（§1 #86）
  aisin_d: { name: '巴牙喇军', tier: 3 },     // 赫图阿拉·后金白甲近卫（§3 #27）
  manzhou: { name: '八旗劲旅', tier: 1 },     // 萨尔浒·满洲八旗龙兴（§3 #8）
  manzhou_d: { name: '满洲八旗', tier: 1 },   // 沈阳·努尔哈赤八旗劲旅
  hezhe: { name: '索伦劲旅', tier: 3 },       // 乌云·索伦部（§3 #13）
  aola: { name: '黑龙江水师', tier: 1 },     // 雅克萨·雅克萨之战（§3 #26）
  wuliangha: { name: '朵颜三卫', tier: 3 },  // 赛音山达·§1 #74 兀良哈三卫（朵颜/泰宁/福余合一）
  dazhen: { name: '渤海八猛安', tier: 3 },    // 恤品·大真渤海八猛安
  fuyu: { name: '金源边军', tier: 3 },       // 黄龙府·辽金黄龙府女真边军（据点今名黄龙府）
  // ── 2026-06-16 新增：东北大区平衡补全（7支，精锐随据点，全图无六字番号） ──
  heishui: { name: '拉哈苏苏兵', tier: 3 },
  sushen: { name: '东康坚甲', tier: 3 },
  haixi_nvzhen: { name: '辉发城铁骑', tier: 1 },
  mohe: { name: '勃利勇士', tier: 2 },
  suolun: { name: '卜奎索伦营', tier: 3 },
  keerqin: { name: '达尔罕卫', tier: 3 },
  yehe: { name: '八面关骁骑', tier: 2 },
};
