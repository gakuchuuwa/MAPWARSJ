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
    lelang: { name: '乐浪材官', tier: 4 },
  donghui: { name: '檀弓猎手', tier: 3 },  // “楛矢石砮，檀弓角弓”，先秦古籍中极其出名的东夷/东北夷标志性兵种，升入T3知名
    gaogouli: { name: '萨水精兵', tier: 2 }, // 因萨水之战水淹三十万隋军这一特定战役而名留青史，缺乏长久野战军建制，符合T2战术
  xuantu: { name: '皂衣先人', tier: 2 },     // 前燕慕容恪廉台之战克制冉闵的连环马战术鼻祖，极其明确的战术阵法，升入T2战术
  xinluo: { name: '花郎道', tier: 3 },       // 金城·新罗花郎（§4 #3）
  baiji: { name: '百济五方兵', tier: 4 },        // 泗沘·百济五方兵制（缺乏极其著名的战术高光，降T3）
    goryeo: { name: '鹰扬军', tier: 3 },
  luzhou: { name: '鸭绿水师', tier: 4 },       // 鸭绿府·渌州水师（§4 #）（常规番号，降T3）
    sambyeol: { name: '龟甲板屋船', tier: 0 },
    hai2: { name: '瀑池弩手', tier: 3 },
  joseon: { name: '义兴亲军卫', tier: 1 },       // 汉城·李成桂义兴亲军卫（§4 #9）
  sheng_d: { name: '全罗水军', tier: 2 },   // 鸣梁海战以十三船击退百艘日军，打出不可思议的战术大捷实绩，符合T2战术
  chen3: { name: '马韩部族', tier: 4 },         // 欢州·辰王马韩
  danluo: { name: '三别抄', tier: 2 },        // 星主厅·高丽武人抗蒙（最终战败，T2）
    zhen: { name: '完山虎贲', tier: 3 },
  woju: { name: '别武班', tier: 2 },            // 咸兴·尹瓘别武班（征女真九城即退还，T2）
  hui: { name: '濊族步卒', tier: 4 },          // 何瑟罗·不耐侯（缺乏极其著名的战术高光，降T3）
    chungju_d: { name: '幸州天字铳', tier: 2 },
  gaya: { name: '金官伽倻兵', tier: 3 },         // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
    naju_d: { name: '罗州精兵', tier: 4 },
    sabeol: { name: '沙伐义兵', tier: 3 },
    xingliao: { name: '龙湾戍军', tier: 4 },
    jingcheng_d: { name: '镜城突骑', tier: 3 },
  // #10 捉虎甲士（火绳枪）、#12–15 近代/热兵 → 不收
};
