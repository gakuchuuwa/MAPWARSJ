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
  gaogouli: { name: '铠马武士', tier: 1 },   // 平壤·高句丽重装骑兵（§4 #1）
  xuantu: { name: '皂衣先人', tier: 3 },     // 国内城·玄菟辖境/高句丽早期死士（§4 #2）
  xinluo: { name: '花郎道', tier: 2 },       // 金城·新罗花郎（§4 #3）
  baiji: { name: '九誓幢', tier: 2 },        // 泗沘·统一新罗混编含百济裔（§4 #4）
  goryeo: { name: '鹰扬龙虎军', tier: 1 },   // 开城·高丽二军（§4 #5）
  dingan: { name: '别武班', tier: 2 },       // 鸭绿府·高丽抗女真野战军（§4 #6）
  sambyeol: { name: '龟甲板屋船', tier: 2 },     // 鸣梁·李舜臣（原属全罗左道）
  hai2: { name: '朝鲜甲士', tier: 3 },       // 朐山/海州·李朝早期重装（§4 #8，边镇分流）
  joseon: { name: '内禁卫', tier: 1 },       // 汉城·国王贴身近卫（§4 #9）
  jeolla: { name: '全罗水军', tier: 0 },       // 顺天·全罗左道水军
  chen3: { name: '击刹兵', tier: 3 },         // 大木岳·月支击刹兵
  danluo: { name: '三别抄', tier: 3 },        // 星主厅·耽罗三别抄
  // #10 捉虎甲士（火绳枪）、#12–15 近代/热兵 → 不收
};
