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
  jilizhou: { name: '卑沙戍卒', tier: 3 },   // 卑沙城·程名振
  nuergan: { name: '奴儿干卫军', tier: 3 }, // 奴儿干·康旺
  huimo: { name: '濊貊长矛手', tier: 3 }, // 乌骨城·高延寿濊貊
  bohai: { name: '渤海猛贲', tier: 2 },       // 龙泉府·渤海左右猛贲卫
  dajin: { name: '合扎猛安', tier: 0 },         // 会宁府·大金猛安谋克军制（阿骨打@都城）
  yizhou: { name: '金源精骑', tier: 1 },      // 蒺藜山·娄室金源精骑
  qidan: { name: '契丹铁林军', tier: 2 },     // 木叶山·辽朝铁林军
  manzhou: { name: '白甲兵', tier: 0 },     // 萨尔浒·1619 努尔哈赤白摆牙喇破明四路
  jurchen: { name: '铁浮图', tier: 1 },         // 五国城·宗弼铁浮屠重装（§3 #1）
  aisin_d: { name: '巴牙喇军', tier: 1 },     // 赫图阿拉·爱新觉罗白甲近卫（§3 #27）
  manzhou_d: { name: '满洲八旗', tier: 1 },   // 沈阳·八旗劲旅（军制非精兵番号）
  hezhe: { name: '索伦劲旅', tier: 3 },       // 乌云·索伦部（§3 #13）
  aola: { name: '敖拉部骑', tier: 3 },       // 雅克萨·孟烈伦敖拉氏
  wuliangha: { name: '兀良哈猎兵', tier: 1 },  // 薛灵哥·者勒蔑兀良哈猎兵
  fuyu: { name: '夫余步骑', tier: 3 },       // 黄龙府·夫余步骑（§1）
  keerqin: { name: '达尔罕卫', tier: 3 },
  yehe: { name: '八面关骁骑', tier: 3 },
  xianbei: { name: '鲜卑控弦之士', tier: 3 },   // 嘎仙洞·鲜卑弓骑
  dongxia: { name: '东夏锐卒', tier: 3 },       // 曷苏馆·蒲鲜万奴东夏国
  haixi_nvzhen: { name: '海西重甲骑', tier: 3 },  // 辉发城·王台哈达部
  houliao: { name: '东辽骑队', tier: 2 },       // 咸平·耶律留哥东辽
  suolun: { name: '索伦营', tier: 3 },          // 卜奎·清代黑龙江索伦营
  wula: { name: '乌拉国兵', tier: 3 },          // 龙潭山城·布占泰乌拉贝勒
  wure: { name: '兀惹部卒', tier: 3 },          // 乌舍城·乌昭度兀惹部
  heishui: { name: '黑水锐卒', tier: 3 },        // 拉哈苏苏·黑水靺鞨
  dawoer: { name: '达斡尔骑', tier: 3 },         // 莫尔根·清代黑龙江将军辖区
  mohe: { name: '粟末劲卒', tier: 3 },
  dazhen: { name: '女真拐子马', tier: 2 },   // 恤品·完颜铁哥大真国           // 勃利·靺鞨故地
};