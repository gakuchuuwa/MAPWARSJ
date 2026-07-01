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
  tier: 0 | 1 | 2 | 3 | 4;
}>> = {
  // === 初始/默认（1） ===
  lelang: { name: '乐浪材官', tier: 4 },    // 息城·王颀乐浪材官
  donghui: { name: '檀弓猎手', tier: 4 },  // 德源·东濊檀弓
    gaogouli: { name: '萨水精兵', tier: 1 },
  xuantu: { name: '皂衣先人', tier: 3 },     // 国内城·高句丽早期精锐（升T2）
  xinluo: { name: '花郎道', tier: 3 },       // 金城·新罗花郎（§4 #3）
  baiji: { name: '百济五方兵', tier: 4 },        // 泗沘·百济五方兵制（缺乏极其著名的战术高光，降T3）
  goryeo: { name: '鹰扬军', tier: 4 },   // 开城·高丽鹰扬军（缺乏极其著名的战术高光，降T3）
  luzhou: { name: '鸭绿水师', tier: 4 },       // 鸭绿府·渌州水师（§4 #）（常规番号，降T3）
  sambyeol: { name: '龟甲板屋船', tier: 0 },     // 鸣梁·李舜臣12破330（区T0锚点）
  hai2: { name: '海州石弓', tier: 4 },       // 瀑池/海州·崔莹
  joseon: { name: '义兴亲军卫', tier: 1 },       // 汉城·李成桂义兴亲军卫（§4 #9）
  sheng_d: { name: '全罗水军', tier: 4 },   // 顺天·朝鲜全罗道水军（常规番号，降T3）
  chen3: { name: '马韩部族', tier: 4 },         // 欢州·辰王马韩
  danluo: { name: '三别抄', tier: 2 },        // 星主厅·高丽武人抗蒙（最终战败，T2）
    zhen: { name: '武珍锐卒', tier: 4 },
  woju: { name: '别武班', tier: 2 },            // 咸兴·尹瓘别武班（征女真九城即退还，T2）
  ssangseong: { name: '和宁戍骑', tier: 4 }, // 铁岭关·李子春（缺乏极其著名的战术高光，降T3）
  hui: { name: '濊族步卒', tier: 4 },          // 何瑟罗·不耐侯（缺乏极其著名的战术高光，降T3）
  chungju_d: { name: '忠州忠义军', tier: 4 },    // 国原城·权栗忠清道募兵（常规番号，降T3）
  gaya: { name: '金官伽倻兵', tier: 4 },         // 金海·金首露伽倻始祖（缺乏极其著名的战术高光，降T3）
    naju_d: { name: '罗州精兵', tier: 4 },            // 缺乏知名度支撑，降T3
  sabeol: { name: '沙伐义兵', tier: 4 },          // 三白·金时敏募义兵（缺乏极其著名的战术高光，降T3）
  xingliao: { name: '龙湾戍军', tier: 4 },      // 龙湾·兴辽边防
  jingcheng_d: { name: '镜城边军', tier: 4 },     // 笼耳·镜城兵马使
  // #10 捉虎甲士（火绳枪）、#12–15 近代/热兵 → 不收
};
