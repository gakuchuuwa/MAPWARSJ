/**
 * 草原文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝东北一致：
 * - 番号至少 3 个汉字
 * - 同势力只挂一个番号（比知名度分流）
 * - 不收热兵器/近代/汉军混编专名（§6 #4 大汉军、#13 准噶尔驼城火枪军等）
 * - 依据 史料/古代精锐部队.md §6 #1–3、#5–12、#14–19
 */
export const STEPPE_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  wuzhou: { name: '雁门边骑', tier: 2 },   // 善无·李广雁门
  ashina: { name: '金山突厥兵', tier: 2 }, // 阿尔泰·阿史那燕都（阿史那氏突厥起源地）
  liao_d: { name: '皮室军', tier: 1 },         // 临潢府·辽太祖皮室军（§6 #1）
  yel: { name: '斡鲁朵军', tier: 2 },         // 降圣·契丹宫帐制
  menggu_d: { name: '怯薛宿卫', tier: 0 },     // 区T0锚·怯薛参与西征诸役；蒙古西征整体史家论以少胜多（§6 #2）
  borjigin: { name: '那可儿伴当', tier: 1 },     // 曲雕阿兰·铁木真那可儿（§6 #10，升T1）
  ogodei: { name: '探马赤军', tier: 1 },       // 也迷里·木华黎探马赤（原T0；降为T1，无单独少胜多招牌仗）
  yuan_d: { name: '秃鲁花军', tier: 2 },       // 上都·元质子军
  xiongnu: { name: '控弦之士', tier: 2 },      // 头曼城·匈奴骑兵
  tujue: { name: '附离亲卫', tier: 1 },       // 于都斤山·突厥附离（《隋书·突厥传》；原突厥狼卫）

  huige: { name: '回鹘精骑', tier: 2 },       // 窝鲁朵八里·骨力裴罗回鹘精骑
  // shatuo → 北方 shatuo:鸦儿军（§1 #50；§6 #8 沙陀铁骑与鸦儿军同系，改挂北方）
  // xianbei → 东北 NortheastExpeditionLegions:弹汗山卫（嘎仙洞属东北区）
  gaoche: { name: '高车战车', tier: 3 },       // 浚稽山·高车战车兵（§6 #16）
  rouran: { name: '柔然铁骑', tier: 2 },       // 赛尔乌苏·柔然骑兵
  xueyantuo: { name: '燕然铁骑', tier: 2 },    // 燕然勒石·窦宪破北匈奴刻石
  naiman: { name: '乃蛮重骑', tier: 2 },       // 福海·乃蛮重装骑兵（§6 #19）
  ongut: { name: '汪古骑', tier: 3 },        // 净州塞·汪古部阿剌兀思
  wala: { name: '瓦剌铁骑', tier: 2 },         // 博尔巴任·也先瓦剌（§6 #12）
  geluolu: { name: '葛逻禄背弓', tier: 2 },    // 弓月城·三姓葛逻禄
  // 那可儿除名（与那可儿军重复）
  kumoxi: { name: '奚人游骑', tier: 3 },  // 饶乐水·库莫奚本部
  kumo: { name: '楮特奥隗部', tier: 3 },     // 马盂山·奚族楮特奥隗部
  // ── 2026-06-16 新增：草原大区平衡补全（20支） ──
  kelie: { name: '札合骁骑', tier: 3 },         // 都尉溷河·札合敢不克烈支系
  kereyid: { name: '克烈护卫军', tier: 2 },     // 汪吉河·王汗克烈部
  dingling: { name: '丁零游骑', tier: 2 }, // 贝加尔·丁零王
  xiajiasi: { name: '黠戛斯锐卒', tier: 2 }, // 攻灭回鹘汗国（升T2）
  donghu: { name: '东胡骑', tier: 2 },    // 巴彦乌拉·东胡王
  tiele: { name: '铁勒骁骑', tier: 3 },
  xibo_d: { name: '锡伯箭手', tier: 3 },        // 固尔札·清代锡伯营（原索伦营错族）
  tatar: { name: '塔塔儿勇士', tier: 3 },
  merkit: { name: '蔑儿乞猎骑', tier: 3 },
  chahar: { name: '察哈尔八旗', tier: 2 },
  yuwen: { name: '武川镇军', tier: 2 },     // 武川镇·537沙苑之战胜；但邙山之战大溃败，丢盔弃甲，降T1
  da_yuan: { name: '北元怯薛', tier: 2 },
  huyan: { name: '呼衍精骑', tier: 3 },
  yujiulu: { name: '郁久闾王骑', tier: 2 },
  jalair: { name: '札剌亦儿军', tier: 3 },
  hongirad: { name: '弘吉剌护卫', tier: 2 },
  choros: { name: '绰罗斯骁骑', tier: 3 },
  dada_ming: { name: '鞑靼铁骑', tier: 2 },  // 河套·达延汗鞑靼部（明蒙古中兴）
  duolu: { name: '咄陆部铁骑', tier: 2 },
  kaerka: { name: '喀尔喀重骑', tier: 3 },
  zhasaketu: { name: '扎萨克图骑', tier: 3 }, // 乌城·喀尔喀蒙古（原扎萨克图骁骑）
  buriat: { name: '林中射手', tier: 3 },
  cheshihou: { name: '车师后王卫', tier: 3 },
  // ── 2026-06-19 有将无番号补全 ──
  kiyad: { name: '乞颜宿卫', tier: 3 },         // 不儿罕山·也速该乞颜部
  mengwu: { name: '忙古勒骑', tier: 3 },        // 狼居胥·合不勒汗
  zhadalan: { name: '札剌儿军', tier: 3 },      // 阔亦田·札木合
  oirat_ming: { name: '卫拉特骑', tier: 2 },    // 科布多·噶尔丹东进（昭莫多惨败，降T2）
  tumed: { name: '土默特精骑', tier: 2 },         // 归化城·俺答汗土默特精骑
  tushetu: { name: '库伦铁骑', tier: 3 },       // 库伦·土谢图汗
  yaoluoge: { name: '药罗葛骑', tier: 3 },      // 娑陵·药罗葛部
  huihu: { name: '回鹘牙帐骑', tier: 3 },      // 窝鲁朵·回鹘汗庭
  ashide: { name: '阿史德骑', tier: 3 },        // 黑沙城·阿史德氏
  pugu: { name: '蓝突厥骑', tier: 2 },          // 燕然山·仆固氏铁勒
  pulei: { name: '蒲类戍卒', tier: 3 },         // 巴里坤·蒲类国故地
  chechen: { name: '车臣汗骑', tier: 3 },       // 巴彦图门·车臣汗硕垒
  zhuerqi: { name: '斡难河骑', tier: 3 },       // 斡难河·撒察别乞
  tumengken: { name: '赛音诺颜骑', tier: 2 },  // 拜达里克·图蒙肯抗卫拉特
  bayegu: { name: '拔野古轻骑', tier: 2 },       // 稽落山·屈利失助唐灭薛延陀
  zubu: { name: '阻卜轻骑', tier: 2 },           // 特尔浑·磨古斯叛辽
  wuzhumuqin: { name: '赛堪轻骑', tier: 2 },    // 乌珠穆沁·多尔济随征噶尔丹
  xingan: { name: '呼伦索伦兵', tier: 2 },   // 哈拉盖图·清代索伦营（升T2）
  baidi: { name: '白狄徒兵', tier: 3 },          // 集宁·春秋白狄部落
  shiwei: { name: '室韦猎骑', tier: 3 },         // 俱轮泊·室韦都督府部众
  sunite: { name: '苏尼特骑', tier: 3 },         // 赛汉塔拉·苏尼特旗武装
  bulat: { name: '布拉特猎兵', tier: 3 },      // 石勒喀河·布里亚特归附清朝
  tuva: { name: '唐努旗兵', tier: 3 },           // 唐努·唐努乌梁海驻防
  // ── 2026-06-19 新增：漠北/漠南要塞精锐 ──
  chenli_d: { name: '祭天戍', tier: 3 },        // 姑衍山·匈奴祭天戍卒
  nuoyan_d: { name: '漠北驿骑', tier: 3 },      // 赛音山达·清代大漠驿站护军
  wuli_d: { name: '喀尔喀劲骑', tier: 2 },      // 扎布汗·乌里雅苏台喀尔喀骑兵
  heisha_d: { name: '黑沙精骑', tier: 3 },  // 特尔门·后突厥黑沙道
  jiluo_d: { name: '北征突骑', tier: 2 },       // 涿邪山·窦宪燕然勒石
};
