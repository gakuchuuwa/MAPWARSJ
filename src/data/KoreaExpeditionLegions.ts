/**
 * 朝鲜文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日本区一致：
 * - 番号至少 3 个汉字
 * - 同势力只挂一个番号（比知名度取最高）
 * - 不收热兵器/近代专名（训练都监、别技军、捉虎甲士火绳枪、壮勇营等）
 * - 依据 史料/古代精锐部队.md §4 #1–11
 */
export const KOREA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  gaogouli: { name: '盖马铠骑', tier: 2 },   // 平壤·高句丽盖马部铠骑
  xuantu: { name: '皂衣先人', tier: 3 },     // 国内城·玄菟辖境/高句丽早期死士（§4 #2）
  xinluo: { name: '花郎道', tier: 2 },       // 金城·新罗花郎（§4 #3）
  baiji: { name: '百济达率兵', tier: 2 },        // 泗沘·百济达率制精兵
  goryeo: { name: '鹰扬军', tier: 2 },   // 开城·高丽鹰扬军
  dingan: { name: '别武班', tier: 2 },       // 鸭绿府·高丽抗女真野战军（§4 #6）
  sambyeol: { name: '龟甲板屋船', tier: 0 },     // 鸣梁·李舜臣龟甲船海战（原属全罗左道）
  hai2: { name: '朝鲜甲士', tier: 3 },       // 朐山/海州·李朝早期重装（§4 #8，边镇分流）
  joseon: { name: '内禁卫', tier: 3 },       // 汉城·国王贴身近卫（§4 #9）
  sheng_d: { name: '全罗左水军', tier: 2 },   // 顺天·朝鲜全罗左道水军
  chen3: { name: '击刹兵', tier: 3 },         // 大木岳·月支击刹兵
  danluo: { name: '三别抄', tier: 2 },        // 星主厅·高丽武人抗蒙王牌
  jianzhou_nvzhen: { name: '建州劲卒', tier: 3 },  // 浑江·建州女真
  zhen: { name: '后百济锐卒', tier: 3 },          // 完山·后百济甄萱
  woju: { name: '沃沮戍兵', tier: 3 },            // 咸兴·沃沮
  tunggiya: { name: '高句丽戍卒', tier: 3 },        // 丸都·高句丽丸都山城戍卒（原佟佳部兵）
  // #10 捉虎甲士（火绳枪）、#12–15 近代/热兵 → 不收
};
