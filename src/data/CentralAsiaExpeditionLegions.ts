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
  saman: { name: '萨曼古拉姆', tier: 1 },     // 蒲华·伊斯梅尔萨曼古拉姆
  huarazim: { name: '钦察精骑', tier: 1 },      // 玉龙杰赤·摩诃末钦察卫（§13 #4）
  qincha: { name: '康里精骑', tier: 2 },     // 七河·钦察雇佣骑（§13 #5）
  tiemuer: { name: '察合台突骑', tier: 0 },      // 区T0锚·撒马尔罕·帖木儿察合台突骑
  kazakh: { name: '哈萨克骑', tier: 3 },     // 亚西·哈斯木汗游击（§13 #7）
  seljuq: { name: '古拉姆禁卫', tier: 1 },     // 木鹿·桑贾尔苏丹古拉姆近卫
  xiliao: { name: '斡耳朵亲卫', tier: 0 },     // 区T0锚·虎思·耶律大石斡耳朵亲卫
  // ── 2026-06-16 新增：中亚大区平衡补全（12支，精锐随据点） ──
  guishuang: { name: '大月氏兵', tier: 3 },
  guer: { name: '马鲁卫队', tier: 3 },
  xijue: { name: '郅支城坚兵', tier: 2 },
  tujishi: { name: '怛罗斯突骑', tier: 2 },
  kokand: { name: '浩罕轻骑', tier: 3 },
  sogdian: { name: '瓦拉赫沙卫', tier: 3 },
  kangju: { name: '康卡控弦', tier: 2 },
  anushidgin: { name: '希瓦铁骑', tier: 3 },
  dayuzi: { name: '讹答剌卫队', tier: 3 },
  zhaowu: { name: '忽毡城武士', tier: 3 },
  yada: { name: '悉万斤重甲', tier: 3 },
  jiazini: { name: '伽色尼古拉姆', tier: 1 },       // 哥疾宁·马哈茂德古拉姆
  yisifahan: { name: '曼齐克特骑', tier: 1 }, // 伊斯法罕·阿尔普·阿尔斯兰（原曼齐克特铁骑）
  gaofu: { name: '高附兵', tier: 3 },          // 喀布尔·喀布尔沙希兵
  fanyanna: { name: '梵衍那僧兵', tier: 3 },      // 梵衍那城·兴都库什僧兵
};
