/**
 * 中亚文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝东北草原西域一致：
 * - 番号 3–5 字，全局不重复
 * - 同势力只挂一个番号
 * - 依据 史料/古代精锐部队.md §13；增补桑贾尔禁卫@梅尔夫（大塞尔柱）
 * - 耶尼切里为史籍专名精锐番号（非泛称火枪兵）；叶尔羌式「火枪兵」后缀不收
 */
export const CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    yanda: { name: '头罗铁骑', tier: 2 }, // 白匈奴重要分支，摧毁印度笈多帝国的战术尖刀，升入T2战术
  saman: { name: '萨曼古拉姆', tier: 3 },     // 伊斯兰世界古拉姆制度的标志性代表，升入T3知名
    huarazim: { name: '康里精骑', tier: 1 },
  qiepantuo: { name: '瓦罕戍骑', tier: 4 },   // 护密城·瓦罕走廊戍卫
    tiemuer: { name: '察合台突骑', tier: 1 },
  kazakh: { name: '哈萨克骑', tier: 2 },     // 哈萨克汗国主力，普将配T2
                                               // （原注「生擒拜占庭皇帝」系误记：曼齐克特1071为阿尔普·阿尔斯兰，非桑贾尔）
  // ── 2026-06-16 新增：中亚大区平衡补全（12 支，精锐随据点；muer 已归 PERSIAN，见 2026-10-18 清理注） ──
    guishuang: { name: '贵霜铁骑', tier: 2 },
    tujishi: { name: '怛罗斯突骑', tier: 3 },
  sogdian: { name: '瓦拉赫沙卫', tier: 4 },
  suogediyana: { name: '岩堡守兵', tier: 4 },   // 索格狄亚那岩岩堡守军；史书未载该岩堡部队番号 → 按史地合理推定
  // 🔴 [2026-09-25 主人令「把缺少的战役加上」] 前329 居鲁士城围攻守方此前没有番号。史料：英文维基百科
  //    Siege of Cyropolis（居鲁士城是当地七座城寨中最大最坚者，守军约一万五千、号称本地最好的战士）。
  //    史书未载其番号 → 按史地合理推定。定级 T4「存在之兵」：地方建制守军。
  julushi: { name: '坚城守兵', tier: 4 },
  kangju: { name: '康卡控弦', tier: 4 },              // 缺乏知名度支撑，降T3
    anushidgin: { name: '希瓦铁骑', tier: 4 },
    dayuzi: { name: '讹答剌卫队', tier: 4 },
    zhaowu: { name: '忽毡勇士', tier: 4 },
    yada: { name: '嚈哒重骑', tier: 2 },
  // ── 2026-06-19 新增：彭迪·马尔 / 毡的·乌古斯 ──
    wugu_d: { name: '乌古斯弓骑', tier: 3 },
    mamon: { name: '呼罗珊之剑', tier: 2 },
    shi_clan: { name: '柘枝胡骑', tier: 4 },
  badakhshan: { name: '达克游骑', tier: 4 },     // 法扎巴德·达克边防
  xianhai: { name: '咸海骁锐', tier: 4 },        // 养吉干·花剌子模北境
  jie: { name: '柘羯勇士', tier: 3 },            // 粟特城邦极其著名的职业重装雇佣兵/死士，文化辨识度极高，升入T3知名
  // —— 2026-06-20 新增：旁遮普·阿托克 ——
  // —— 2026-06-20 新增：那竭国·顶骨城 ——
  // ── 2026-06-20 新增：杜兰尼·呼罗珊·阿巴尔 ──

  sute: { name: '粟特铁骑', tier: 3 },   // 诺塔卡（粟特南部要地）
  aolitai: { name: '奥里泰标枪', tier: 3 },
  shiyuzu: { name: '食鱼族毒弓', tier: 3 },   // 奥拉·食鱼族：欣戈尔河口海岸毒箭投石
    kala: { name: '古拉姆近卫', tier: 3 },
    wulaertu: { name: '复合弓手', tier: 3 },  // 埃里温·瓦尔丹：亚美尼亚步弓手（DE Composite Bowman 复合弓）
    wulaertu_guo: { name: '乌拉尔图卫', tier: 3 },
    gelujiya: { name: '莫纳斯帕', tier: 2 },
    keerjisi: { name: '伊梅列季兵', tier: 2 },
    // 2026-07-27 补希尔万（其余中东四城/苏萨条目已归入 Persian/Cuman 区，见 2026-10-18 清理注）
    xierwan: { name: '希尔万骑卫', tier: 4 },
    // ── 2026-07-30 迁出：28 支已随首都归入 WEST_ASIA 区，唯一权威见
    //    WestAsiaExpeditionLegions.ts（原条目与西亚版番号/tier 冲突，靠展开顺序静默覆盖，故清出）──
    //    bendou bendou_d heti fulijiya ldiya pajiama bitiniya baizhanting xibolai aiji dibisi
    //    jialedi paermila abasi xikesuosi yashu youfaladi qiliqiya sumeier ayoubu aiaoniya
    //    jialatai guyashu nabatai beileinisi dedan maidina gulaishi,
    //    （xibolai 后归 ORIE，见 WestAsia 区 2026-10-18 清理注）
    // ── 2026-10-18 清理：以下 23 支已归入 PERSIAN/CUMAN 区，唯一权威见
    //    PersianExpeditionLegions.ts / CumanExpeditionLegions.ts（原条目与新版番号/tier 冲突，
    //    靠展开顺序静默覆盖，故清出）──
    //    qincha muer jiazini babuer fanyanna guzgan dulan_d baha hali kalan delan aba
    //    saerbadaer kumisi safawei yilihanguo yilihanguo_d midi sashan safawei_d ailan ansxi kesa,
    an: { name: '乌兹别克骑', tier: 3 },
    feierganna: { name: '费尔干纳骑', tier: 3 },          // 阿赫西克特·忽都鲁：费尔干纳谷地骑兵
};
