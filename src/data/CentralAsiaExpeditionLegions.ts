/**
 * 中亚文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝东北草原西域一致：
 * - 番号至少 3 个汉字，全局不重复
 * - 同势力只挂一个番号
 * - 依据 史料/古代精锐部队.md §13；增补桑贾尔禁卫@梅尔夫（大塞尔柱）
 * - 耶尼切里为史籍专名精锐番号（非泛称火枪兵）；叶尔羌式「火枪兵」后缀不收
 */
export const CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    yanda: { name: '阿尔洪铁骑', tier: 2 }, // 白匈奴重要分支，摧毁印度笈多帝国的战术尖刀，升入T2战术
  saman: { name: '萨曼古拉姆', tier: 3 },     // 伊斯兰世界古拉姆制度的标志性代表，升入T3知名
    huarazim: { name: '钦察精骑', tier: 1 },
  qincha: { name: '康里精骑', tier: 3 },              // 花剌子模和早期蒙古帝国中极其出名的突击力量，文化辨识度高，升入T3知名
  qiepantuo: { name: '瓦罕戍骑', tier: 4 },   // 护密城·瓦罕走廊戍卫
    tiemuer: { name: '察合台突骑', tier: 1 },
  kazakh: { name: '哈萨克骑', tier: 2 },     // 哈萨克汗国主力，普将配T2
  seljuq: { name: '丹丹纳骑', tier: 1 },     // 木鹿·桑贾尔：1040丹丹纳康之战奠基大塞尔柱；T1功勋（避「塞尔柱」撞将名）
                                               // （原注「生擒拜占庭皇帝」系误记：曼齐克特1071为阿尔普·阿尔斯兰，非桑贾尔）
  // ── 2026-06-16 新增：中亚大区平衡补全（12支，精锐随据点） ──
    guishuang: { name: '贵霜铁骑', tier: 2 },
    muer: { name: '呼罗珊义从', tier: 4 },
    tujishi: { name: '怛罗斯突骑', tier: 3 },
  kokand: { name: '浩罕轻骑', tier: 4 },
  sogdian: { name: '瓦拉赫沙卫', tier: 4 },
  kangju: { name: '康卡控弦', tier: 4 },              // 缺乏知名度支撑，降T3
    anushidgin: { name: '希瓦铁骑', tier: 4 },
    dayuzi: { name: '讹答剌卫队', tier: 4 },
    zhaowu: { name: '忽毡勇士', tier: 4 },
    yada: { name: '嚈哒重骑', tier: 2 },
  jiazini: { name: '伽色尼禁卫', tier: 2 },       // 马哈茂德的古拉姆近卫军，十七次远征印度战无不胜，升入T2战术
    jibin: { name: '迦毕试梵骑', tier: 2 },
    babuer: { name: '阿富汗游骑', tier: 3 },       // 喀布尔·巴布尔：帖木儿王朝喀布尔政权主力（突厥-蒙古+阿富汗部落骑兵）
  fanyanna: { name: '梵衍那僧兵', tier: 4 },      // 巴米扬·梵衍那王率僧兵御大食（缺乏极其著名的战术高光，降T3）
  // ── 2026-06-19 新增：彭迪·马尔 / 毡的·乌古斯 ──
    maer_d: { name: '骆驼突骑', tier: 3 },
    wugu_d: { name: '乌古斯弓骑', tier: 3 },
    mamon: { name: '呼罗珊之剑', tier: 2 },
    shi_clan: { name: '柘枝胡骑', tier: 4 },
  guzgan: { name: '古兹根卫队', tier: 4 },       // 法里亚布·古兹根戍卫
  badakhshan: { name: '达克游骑', tier: 4 },     // 法扎巴德·达克边防
    kawusi: { name: '卡乌斯铁卫', tier: 4 },
  xianhai: { name: '咸海骁锐', tier: 4 },        // 养吉干·花剌子模北境
  wuhu: { name: '乌护游骑', tier: 4 },           // 真珠河·乌古斯游牧（1040丹达内克胜伽色尼）
  jie: { name: '柘羯勇士', tier: 3 },            // 粟特城邦极其著名的职业重装雇佣兵/死士，文化辨识度极高，升入T3知名
  // —— 2026-06-20 新增：旁遮普·阿托克 ——
  pangzha: { name: '卡尔萨武士', tier: 1 },      // 阿托克·戈宾德辛格创立卡尔萨，兰季特辛格旁遮普帝国核心武力
  // —— 2026-06-20 新增：那竭国·顶骨城 ——
    najie: { name: '那竭方阵兵', tier: 3 },
  // ── 2026-06-20 新增：杜兰尼·呼罗珊·阿巴尔 ──
    dulan_d: { name: '普什图骑兵', tier: 1 },
  // ── 2026-06-20 新增：布兹詹·哈里·卡伦 ──
  baha: { name: '巴哈铁卫', tier: 4 }, // 泰巴德·巴哈尔兹重装戍卫（缺乏极其著名的战术高光，降T3）
    hali: { name: '萨洛尔弓骑', tier: 4 },
  kalan: { name: '萨珊边骑', tier: 4 },    // 图斯·卡伦家族世袭东北边防元帅（常规番号，降T3）
  // ── 2026-06-20 新增：锡斯坦·德兰吉亚 ──
  xisi: { name: '萨法尔圣兵', tier: 2 },  // 雅各布建立萨法尔王朝的核心主力（加齐圣战者），以少胜多狂飙突进，升入T2战术
  delan: { name: '帕提亚铁骑', tier: 1 },   // 法拉·卡莱战役大破罗马军团的战略主力
    huluo: { name: '古尔重骑', tier: 1 },
  aba: { name: '萨珊重装骑', tier: 1 },    // 尼沙布尔·萨珊波斯抗击罗马帝国的战略主力
    kala: { name: '古拉姆近卫', tier: 3 },
    saerbadaer: { name: '萨尔巴达军', tier: 3 },  // 白哈格·拉扎克：萨尔巴达尔平民/民兵抗蒙，非骑兵
    kumisi: { name: '瑟尔柱重骑', tier: 3 },
    safawei: { name: '吉兰步卒', tier: 3 },
    yilihanguo: { name: '奇兹尔巴什', tier: 2 },
    yilihanguo_d: { name: '伊利怯薛', tier: 2 },
    asaibaijiang: { name: '蒙古怯薛', tier: 0 },
    wulaertu: { name: '乌拉尔图卫', tier: 3 },  // 埃里温·瓦尔丹：亚美尼亚高山战锤修士与高山重骑主力
    gelujiya: { name: '莫纳斯帕', tier: 2 },
    keerjisi: { name: '伊梅列季兵', tier: 2 },
    midi: { name: '不死军团', tier: 3 },
    aqimeinide: { name: '长生军', tier: 1 },
    safawei_d: { name: '红头军', tier: 2 },
    // 2026-07-27 补中东四城+苏萨
    ailan: { name: '埃兰战车', tier: 3 },
    kesa: { name: '可萨弓骑', tier: 3 },
    ansxi: { name: '尼萨弓骑', tier: 3 },
    xierwan: { name: '希尔万骑卫', tier: 4 },
    // ── 2026-07-30 迁出：28 支已随首都归入 WEST_ASIA 区，唯一权威见
    //    WestAsiaExpeditionLegions.ts（原条目与西亚版番号/tier 冲突，靠展开顺序静默覆盖，故清出）──
    //    bendou bendou_d heti fulijiya ldiya pajiama bitiniya baizhanting xibolai aiji dibisi
    //    jialedi paermila abasi xikesuosi yashu youfaladi qiliqiya sumeier ayoubu aiaoniya
    //    jialatai guyashu nabatai beileinisi dedan maidina gulaishi,
    an: { name: '乌兹别克骑', tier: 3 },
};