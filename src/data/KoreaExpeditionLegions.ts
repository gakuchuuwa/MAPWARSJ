/**
 * 朝鲜文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日本区一致：
 * - 番号至少 3 个汉字
 * - 同势力只挂一个番号（比知名度取最高）
 * - 不收热兵器/近代专名（训练都监、别技军、捉虎甲士火绳枪、壮勇营等）
 * - 依据 史料/古代精锐部队.md §4 #1–11
 */
export const KOREA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, {
  name: string;
  tier: 0 | 1 | 2 | 3;
}>> = {
  // === 初始/默认（1） ===
  lelang: { name: '乐浪材官', tier: 3 },    // 息城·王颀乐浪材官
  donghui: { name: '檀弓猎手', tier: 3 },  // 德源·东濊檀弓
  gaogouli: { name: '高句丽铁骑', tier: 1 },   // 平壤·高句丽铁骑（§4 #）
  xuantu: { name: '皂衣先人', tier: 3 },     // 国内城·玄菟辖境/高句丽早期死士（§4 #2）
  xinluo: { name: '花郎道', tier: 2 },       // 金城·新罗花郎（§4 #3）
  baiji: { name: '百济五方兵', tier: 2 },        // 泗沘·百济五方兵制
  goryeo: { name: '鹰扬军', tier: 2 },   // 开城·高丽鹰扬军
  luzhou: { name: '鸭绿水师', tier: 2 },       // 鸭绿府·渌州水师（§4 #）
  sambyeol: { name: '龟甲板屋船', tier: 0 },     // 鸣梁·李舜臣12破330（区T0锚点）
  hai2: { name: '朝鲜甲士', tier: 3 },       // 朐山/海州·李朝早期重装（§4 #8，边镇分流）
  joseon: { name: '义兴亲军卫', tier: 1 },       // 汉城·李成桂义兴亲军卫（§4 #9）
  sheng_d: { name: '全罗左水军', tier: 2 },   // 顺天·朝鲜全罗左道水军
  chen3: { name: '马韩部族', tier: 3 },         // 欢州·辰王马韩
  danluo: { name: '三别抄', tier: 1 },        // 星主厅·高丽武人抗蒙
  jianzhou_nvzhen: { name: '建州劲卒', tier: 3 },  // 浑江·建州女真
  zhen: { name: '后百济锐卒', tier: 3 },          // 完山·后百济甄萱
  woju: { name: '别武班', tier: 1 },            // 咸兴·尹瓘别武班
  ssangseong: { name: '双城重甲骑', tier: 2 }, // 铁岭关·崔莹
  hui: { name: '濊族步卒', tier: 3 },          // 何瑟罗·不耐侯濊族
  chungju_d: { name: '忠州忠义军', tier: 2 },    // 国原城·权栗忠清道募兵
  gaya: { name: '金官伽倻兵', tier: 2 },         // 金海·金首露伽倻始祖
  naju_d: { name: '罗州精兵', tier: 1 },         // 锦城·王建罗州根据地
  sabeol: { name: '沙伐义兵', tier: 2 },          // 三白·金时敏募义兵
  xingliao: { name: '龙湾戍军', tier: 3 },      // 龙湾·兴辽边防
  jingcheng_d: { name: '镜城边军', tier: 3 },     // 笼耳·镜城兵马使
  // #10 捉虎甲士（火绳枪）、#12–15 近代/热兵 → 不收
};
