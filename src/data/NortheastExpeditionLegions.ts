/**
 * 东北文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝一致：
 * - 番号 3–5 字
 * - 同势力只挂一个番号（比知名度分流）
 * - 不收热兵器/近代/错区条目（§3 #7–24、#28–29）
 * - 依据 史料/古代精锐部队.md §3 #1–6、#8–9、#13、#25–27；§1 #85–86 交叉收录
 */
export const NORTHEAST_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
  bohai: { name: '渤海猛贲', tier: 1 },       // 建立并维持“海东盛国”渤海国两百余年的核心主力，符合T1战略主力
    dajin: { name: '合扎猛安', tier: 0 },
    manzhou_d: { name: '满洲八旗', tier: 0 },
  fuyu: { name: '夫余步骑', tier: 4 },       // 黄龙府·夫余步骑（§1）
  keerqin: { name: '达尔罕卫', tier: 4 },
    yehe: { name: '八面关骁骑', tier: 4 },
    xianbei: { name: '鲜卑弓骑', tier: 4 },
  dongxia: { name: '东夏锐卒', tier: 4 },       // 曷苏馆·蒲鲜万奴东夏国
    haixi_nvzhen: { name: '海西甲骑', tier: 3 }, // 与建州死磕的“海西女真”主力，代表了满洲统一前长达百年的激烈内战，升入T3知名
    houliao: { name: '咸平契骑', tier: 3 },
    suolun: { name: '索伦骑', tier: 3 },
    wula: { name: '乌拉国兵', tier: 4 },
  wure: { name: '兀惹部卒', tier: 4 },          // 乌舍城·乌昭度兀惹部
    heishui: { name: '靺鞨锐卒', tier: 3 }, // 东北历史上极其著名的庞大民族（女真直系祖先），建立渤海国，文化辨识度极高，升入T3知名
    ewenki: { name: '石勒喀猎兵', tier: 4 },
    yeren_nvzhen: { name: '瑷珲马甲', tier: 4 },      // 缺乏知名度支撑，降T3
  wuji: { name: '勿吉步卒', tier: 4 },            // 伯都·乙力支朝贡北魏（缺乏极其著名的战术高光，降T3）
  kuye: { name: '库页猎兵', tier: 4 },            // 白主·费雅喀猎户
  sushen: { name: '楛矢射手', tier: 3 },          // 中国先秦史籍记载的东北夷神兵图腾“楛矢石砮”，极具历史文化辨识度，升入T3知名
  yilou: { name: '挹娄突骑', tier: 4 },           // 凤林城·恼犽助战高句丽
  jilimi: { name: '吉里迷水师', tier: 4 },        // 囊哈儿·奴儿干吉里迷
  eluoke: { name: '鄂罗克猎兵', tier: 4 },        // 诺托罗·库页岛北部
  feiyaka: { name: '费雅喀猎手', tier: 4 },       // 普禄·库页岛西岸
    elunchunzu: { name: '鄂伦春猎骑', tier: 3 },
    ayinu_ezo: { name: '毒木箭手', tier: 3 },  // 莫约罗·柯沙玛因：阿伊努独立猎人附子毒矢神射勇士
};