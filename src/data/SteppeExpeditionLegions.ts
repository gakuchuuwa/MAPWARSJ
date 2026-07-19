/**
 * 草原文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝东北一致：
 * - 番号至少 3 个汉字
 * - 同势力只挂一个番号（比知名度分流）
 * - 不收热兵器/近代/汉军混编专名（§6 #4 大汉军、#13 准噶尔驼城火枪军等）
 * - 依据 史料/古代精锐部队.md §6 #1–3、#5–12、#14–19
 */
export const STEPPE_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    wuzhou: { name: '百金之士', tier: 2 },
    ashina: { name: '金山突厥兵', tier: 3 },
    liao_d: { name: '皮室军', tier: 1 },
  yel: { name: '斡鲁朵军', tier: 1 },         // 大辽帝国压制北宋两百年的最核心禁卫常备军制度，升入T1战略
    menggu_d: { name: '怯薛宿卫', tier: 0 },
  borjigin: { name: '那可儿伴当', tier: 1 },     // 曲雕阿兰·铁木真那可儿亲卫
  ogodei: { name: '探马赤军', tier: 1 },       // 也迷里·木华黎统帅的探马赤军
    yuan_d: { name: '秃鲁花军', tier: 3 },
  xiongnu: { name: '鸣镝精骑', tier: 1 },      // 头曼城·冒顿单于称霸大漠的鸣镝主力
  tujue: { name: '附离亲卫', tier: 1 },       // 于都斤山·突厥附离（《隋书·突厥传》；原突厥狼卫）

    huige: { name: '回纥精骑', tier: 1 },             // 安史之乱挽救大唐，雄踞漠北百年的回纥汗国绝对主力，升入T1战略
  // shatuo → 北方 shatuo:鸦儿军（§1 #50；§6 #8 沙陀铁骑与鸦儿军同系，改挂北方）
  // xianbei → 东北 NortheastExpeditionLegions:弹汗山卫（嘎仙洞属东北区）
  gaoche: { name: '高车战车', tier: 3 },       // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
  rouran: { name: '柔然铁骑', tier: 1 },       // 花木兰抗击的庞大游牧汗国，突厥崛起前漠北霸主，升入T1战略
    xueyantuo: { name: '薛延陀鹰师', tier: 3 },
  naiman: { name: '乃蛮重骑', tier: 4 },       // 福海·乃蛮重装骑兵（§6 #19）（缺乏极其著名的战术高光，降T3）
  ongut: { name: '汪古骑', tier: 4 },        // 净州塞·汪古部阿剌兀思
  wala: { name: '瓦剌铁骑', tier: 1 },         // 土木堡之变生擒明英宗的元凶，与鞑靼并列的大明两百年草原死敌，升入T1战略
  geluolu: { name: '葛逻禄背弓', tier: 3 },    // 怛罗斯之战导致大唐惨败的关键背叛者，极其著名的历史刺客，升入T3知名
  // 那可儿除名（与那可儿军重复）
  kumoxi: { name: '奚人游骑', tier: 4 },  // 饶乐水·库莫奚本部
  kumo: { name: '楮特奥隗部', tier: 4 },     // 马盂山·奚族楮特奥隗部
  // ── 2026-06-16 新增：草原大区平衡补全（20支） ──
    kelie: { name: '札合骁骑', tier: 4 },
    kereyid: { name: '克烈护卫军', tier: 4 },
  dingling: { name: '丁零游骑', tier: 4 }, // 贝加尔·丁零王（缺乏极其著名的战术高光，降T3）
  xiajiasi: { name: '黠戛斯锐卒', tier: 1 }, // 彻底摧毁回鹘汗国的“终结者”，改变漠北与西域历史格局的战略力量，升入T1战略
  donghu: { name: '东胡骑', tier: 4 },    // 巴彦乌拉·东胡王（缺乏极其著名的战术高光，降T3）
    tiele: { name: '铁勒九姓骑', tier: 3 },
    xibo_d: { name: '锡伯箭手', tier: 3 },
  tatar: { name: '塔塔儿勇士', tier: 4 },
    merkit: { name: '岭北屯骑', tier: 3 },
    chahar: { name: '哈剌赤军', tier: 2 },
    yuwen: { name: '武川镇军', tier: 0 },
    da_yuan: { name: '北元怯薛', tier: 1 },
    huyan: { name: '呼衍精骑', tier: 4 },
    yujiulu: { name: '柔然汗骑', tier: 4 },
    jalair: { name: '札剌亦儿军', tier: 3 },
  hongirad: { name: '弘吉剌护卫', tier: 4 },           // 常规番号，降T3
    choros: { name: '萨吾尔鹘骑', tier: 3 },
  duolu: { name: '咄陆部铁骑', tier: 4 },              // 缺乏知名度支撑，降T3
  kaerka: { name: '喀尔喀重骑', tier: 4 },
  buriat: { name: '林中射手', tier: 4 },
    cheshihou: { name: '车师后王卫', tier: 4 },
  // ── 2026-06-19 有将无番号补全 ──
  kiyad: { name: '乞颜宿卫', tier: 3 },         // 不儿罕山·也速该乞颜部
    mengwu: { name: '忙古勒骑', tier: 4 },
    zhadalan: { name: '十三翼', tier: 3 },
    oirat_ming: { name: '准噶尔驼城', tier: 3 },
  tumed: { name: '土默特精骑', tier: 1 },         // 俺答汗建立土默特汗国、逼迫明朝封贡的绝对战略主力，符合T1战略主力
  tushetu: { name: '库伦铁骑', tier: 4 },       // 库伦·土谢图汗
    yaoluoge: { name: '娑陵鹰骑', tier: 4 },
    huihu: { name: '回鹘骑兵', tier: 3 },
    pugu: { name: '燕然黑砂', tier: 2 },
    pulei: { name: '蒲类落雕骑', tier: 3 },
  chechen: { name: '车臣汗骑', tier: 4 },       // 巴彦图门·车臣汗硕垒
  zhuerqi: { name: '斡难河骑', tier: 4 },       // 斡难河·撒察别乞
  tumengken: { name: '赛音诺颜骑', tier: 4 },  // 拜达里克·图蒙肯抗卫拉特（缺乏极其著名的战术高光，降T3）
  bayegu: { name: '拔野古轻骑', tier: 4 },       // 稽落山·屈利失助唐灭薛延陀（缺乏极其著名的战术高光，降T3）
    zubu: { name: '特尔浑游骑', tier: 4 },
  wuzhumuqin: { name: '赛堪轻骑', tier: 4 },    // 乌珠穆沁·多尔济随征噶尔丹（缺乏极其著名的战术高光，降T3）
    xingan: { name: '索伦营', tier: 2 },             // 索伦鄂温克达斡尔精锐，清朝极具特色的边疆建制，升T2
  baidi: { name: '白狄徒兵', tier: 3 },          // 春秋白狄徒兵，北方游牧中步兵独树一帜，兵种特色鲜明，升T2
  shiwei: { name: '室韦猎骑', tier: 4 },         // 俱轮泊·室韦都督府部众
  sunite: { name: '苏尼特骑', tier: 4 },         // 赛汉塔拉·苏尼特旗武装
  bulat: { name: '布拉特猎兵', tier: 3 },      // 布里亚特（布拉特）人，西伯利亚极具辨识度的民族武装符号，升入T3知名
  tuva: { name: '唐努旗兵', tier: 4 },           // 唐努·唐努乌梁海驻防
  // ── 2026-06-19 新增：漠北/漠南要塞精锐 ──
    chenli_d: { name: '祭天铁卫', tier: 3 },
  nuoyan_d: { name: '漠北驿骑', tier: 4 },      // 赛音山达·清代大漠驿站护军
  wuli_d: { name: '喀尔喀劲骑', tier: 3 },      // 扎布汗·乌里雅苏台喀尔喀骑兵（缺乏极其著名的战术高光，降T3）
  heisha_d: { name: '黑沙精骑', tier: 3 },  // 后突厥黑沙道，突厥复兴运动核心，专属名号特色鲜明，升T2
  jiluo_d: { name: '北征突骑', tier: 1 },       // 燕然勒石彻底击灭北匈奴，独立战略主力，升T1,
    chagatai: { name: '戊己屯军', tier: 2 },
    dongsheng: { name: '云中彀骑', tier: 3 },
    murong: { name: '龙城甲骑', tier: 2 },
    chuyue: { name: '处月骑兵', tier: 3 },
    dongshengwei: { name: '九边夜不收', tier: 2 },
    wuliangha: { name: '兀良哈突骑', tier: 1 },
    juqu_d: { name: '卢水胡兵', tier: 3 },
    yuezhi: { name: '折兰骑', tier: 3 },
    lushui: { name: '飞熊军', tier: 2 },
    xijue: { name: '郅支精骑', tier: 4 },
    aertai: { name: '阿尔泰狼骑', tier: 3 },
};
