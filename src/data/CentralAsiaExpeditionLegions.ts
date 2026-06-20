/**
 * 中亚文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝东北草原西域一致：
 * - 番号至少 3 个汉字，全局不重复
 * - 同势力只挂一个番号
 * - 依据 史料/古代精锐部队.md §13；增补桑贾尔禁卫@梅尔夫（大塞尔柱）
 * - 耶尼切里为史籍专名精锐番号（非泛称火枪兵）；叶尔羌式「火枪兵」后缀不收
 */
export const CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  yanda: { name: '嚈哒铁骑', tier: 1 },          // 阿缓城·白匈奴横扫中亚（§13 #2）
  saman: { name: '萨曼古拉姆', tier: 1 },     // 阿母城·伊斯梅尔萨曼古拉姆
  huarazim: { name: '钦察精骑', tier: 1 },      // 玉龙杰赤·摩诃末钦察卫（§13 #4）
  qincha: { name: '康里精骑', tier: 2 },
  qiepantuo: { name: '护密戍卒', tier: 3 },   // 护密城·瓦罕走廊戍卒
  tiemuer: { name: '察合台突骑', tier: 0 },      // 区T0锚·撒马尔罕·帖木儿察合台突骑
  kazakh: { name: '哈萨克骑', tier: 3 },     // 亚西·哈斯木汗游击（§13 #7）
  seljuq: { name: '古拉姆禁卫', tier: 1 },     // 木鹿·桑贾尔苏丹古拉姆近卫
  xiliao: { name: '斡耳朵亲卫', tier: 0 },     // 区T0锚·虎思·耶律大石斡耳朵亲卫
  // ── 2026-06-16 新增：中亚大区平衡补全（12支，精锐随据点） ──
  guishuang: { name: '大月氏兵', tier: 3 },
  muer: { name: '花剌子模重甲枪兵', tier: 2 }, // 马尔夫鲁德·穆尔加布河畔花剌子模戍卫
  xijue: { name: '郅支城坚兵', tier: 2 },
  tujishi: { name: '怛罗斯突骑', tier: 2 },
  kokand: { name: '浩罕轻骑', tier: 3 },
  sogdian: { name: '瓦拉赫沙卫', tier: 3 },
  kangju: { name: '康卡控弦', tier: 2 },
  anushidgin: { name: '希瓦铁骑', tier: 3 },
  dayuzi: { name: '讹答剌卫队', tier: 3 },
  zhaowu: { name: '忽毡城武士', tier: 3 },
  yada: { name: '悉万斤重甲', tier: 3 },
  jiazini: { name: '伽色尼禁卫', tier: 1 },       // 哥疾宁·马哈茂德古拉姆
  jibin: { name: '贵霜战象', tier: 1 },        // 迦毕试·丘就却统一五部贵霜后象兵破城
  fanyanna: { name: '梵衍那僧兵', tier: 2 },      // 巴米扬·梵衍那王率僧兵御大食
  // ── 2026-06-19 新增：彭迪·马尔 / 毡的·乌古斯 ──
  maer_d: { name: '骆驼突骑', tier: 2 },        // 彭迪·萨珊东北边境骆驼骑兵
  wugu_d: { name: '乌古斯弓骑', tier: 1 },      // 毡的·乌古斯复合弓骑
  mamon: { name: '呼罗珊禁卫', tier: 1 },       // 达尔甘·马蒙大破艾敏
  khoja: { name: '白山派卫兵', tier: 2 },        // 休循·阿帕克和卓白山派
  shi_clan: { name: '石国胡兵', tier: 2 },       // 柘折城·莫贺咄吐屯御大食
  guzgan: { name: '古兹根卫队', tier: 3 },       // 法里亚布·古兹根戍卫
  badakhshan: { name: '达克边戍', tier: 3 },     // 法扎巴德·达克边防
  kawusi: { name: '卡乌斯戍军', tier: 3 },     // 吉扎克·粟特要塞
  xianhai: { name: '咸海戍兵', tier: 3 },        // 养吉干·花剌子模北境
  wuhu: { name: '乌护游骑', tier: 3 },           // 真珠河·乌古斯游牧（1040丹达内克胜伽色尼）
  // —— 2026-06-20 新增：旁遮普·阿托克 ——
  pangzha: { name: '卡尔萨武士', tier: 1 },      // 阿托克·戈宾德辛格创立卡尔萨，兰季特辛格旁遮普帝国核心武力
  // —— 2026-06-20 新增：那竭国·顶骨城 ——
  najie: { name: '那竭方阵兵', tier: 1 },       // 顶骨城·印度-希腊米南德一世马其顿式重装方阵
  // ── 2026-06-20 新增：杜兰尼·呼罗珊·阿巴尔 ──
  dulan_d: { name: '普什图骑兵', tier: 2 },    // 坎大哈·艾哈迈德沙阿杜兰尼轻装游骑
  // ── 2026-06-20 新增：布兹詹·哈里·卡伦 ──
  baha: { name: '巴哈尔兹重甲戟兵', tier: 2 }, // 泰巴德·巴哈尔兹重装戍卫
  hali: { name: '丹达纳克弓骑', tier: 1 },    // 萨拉赫斯·1040塞尔柱丹达纳克大破伽色尼
  kalan: { name: '萨珊边防铁骑', tier: 1 },    // 图斯·卡伦家族世袭东北边防元帅
  // ── 2026-06-20 新增：锡斯坦·德兰吉亚 ──
  xisi: { name: '萨法尔圣战兵', tier: 1 },  // 博斯特·雅库布铜匠加齐步兵席卷呼罗珊
  delan: { name: '帕提亚铁骑', tier: 0 },   // 法拉·苏伦超重装Cataphract卡莱灭克拉苏
  huluo: { name: '呼罗珊重骑兵', tier: 1 },  // 赫拉特·阿布穆斯林黑旗军重骑
  aba: { name: '萨珊具装铁骑', tier: 0 },    // 尼沙布尔·萨珊Grivpanvar超重装突骑
};
