/**
 * 中原文化区远征精锐军团名（CENTRAL）
 *
 * 收录红线：
 * - 每文化区 ≥10 条；番号 3–6 字，全局不重复
 * - 据点优先标志战场，其次治所/成军地（潼津@潼关等）
 * - 依据 史料/古代精锐部队.md §1 中原；#83–96 非中原地理不收
 * - §1 他区已占：#34–35 江南、#54 西域、#70 草原、#72–79 南方/东北、#75 北方
 */
export const CENTRAL_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
      wei: { name: '魏之武卒', tier: 1 },        // 汴梁·阴晋大捷；马陵/伊阙大败溃散，降T1
  qin: { name: '秦之锐士', tier: 1 },        // 秦首都·精锐番号（将随 FactionGenerals 录入）
  qi: { name: '齐之技击', tier: 1 },       // 临淄·§1 #13 田忌孙膑
  han: { name: '韩之劲弩', tier: 2 },        // 新郑·暴鸢韩弩
  xichu: { name: '江东子弟', tier: 0 },    // 彭城·项羽巨鹿破秦（《史记》）
  han_d: { name: '赤帝亲兵', tier: 2 },      // 南郑·刘邦专属
  pizhou: { name: '陷阵营', tier: 1 },        // 下邳·高顺陷阵营
  cao_d: { name: '虎豹骑', tier: 1 },      // 谯都·曹纯曹真（无独立以少胜多经典）
  ranwei_d: { name: '乞活军', tier: 2 },   // 巨鹿·§1 #41 冉闵陈午
    wuzhou_d: { name: '羽林军', tier: 1 },     // 洛阳·李多祚羽林军（武周）
  shang: { name: '虎贲多射', tier: 2 },       // 安阳·殷商虎贲与多射（妇好征伐）
  zhou: { name: '岐阳虎贲', tier: 2 },     // 岐山·武王伐纣牧野（《史记》）
  // 夏后亲卫除名（夏代无信史）
  yuan_cj_d: { name: '大戟士', tier: 2 },    // 汝南·袁术大戟士（败多胜少，降T2）
  chanzhou: { name: '殿前诸班', tier: 1 },   // 濮阳·柴荣
  sui: { name: '骁果军', tier: 2 },        // 汉东·隋帝禁卫骁果；615雁门李世民解围（根基在中央，河套用武地）
  sunqin: { name: '督标秦军', tier: 2 },   // 潼关·孙传庭督标
  // 飞熊军除名（小说番号）
  // 韩卒击刹除名（无史载）
    liang_d: { name: '睢阳义兵', tier: 2 },     // 商丘·张巡守睢阳（防御战，降T2）
  // 公行锐士除名
  jin: { name: '晋中军', tier: 2 },        // 曲沃·城濮之战破楚（《左传》）
    li_lx_d: { name: '陇右突骑', tier: 1 },
  xiayang_d: { name: '西河突骑', tier: 1 }, // 龙门·唐同州境黄河禹门戍防（《水经注》夏阳龙门）
  baibo: { name: '白波黄巾', tier: 3 },     // 白波谷·郭太白波黄巾
  dashun: { name: '老营军', tier: 1 },      // 子午谷·李自成老营精锐
  tianxiong: { name: '魏博牙兵', tier: 1 },  // 大名·田承嗣魏博牙兵
  dixiang: { name: '猪突豨勇', tier: 2 },   // 宛城·张绣南阳材官
  // 朱龙骑除名（无此番号）
  liguo: { name: '潞川锐骑', tier: 2 },       // 阏与·潞州王猛
  yiyang_d: { name: '申息锐师', tier: 2 },    // 武胜关·楚国申息之师
  // ── 2026-06-16 新增：11大名关 ──
                      hongnong_jun: { name: '黄龙骑', tier: 2 },    // 函谷关·杨素大破突厥
  jingzhou_gs: { name: '安定突骑', tier: 2 },       // 安定·天水安定出精骑（皇甫嵩所部）
  tang: { name: '玄甲军', tier: 0 },            // 长安·李世民玄甲骑
    ruo: { name: '频阳锐士', tier: 1 },
  ruzhou: { name: '赤帻先锋', tier: 2 },
  yun: { name: '陆浑戎骑', tier: 3 },
  jiyuan: { name: '落雕卫', tier: 1 },
  xiongding: { name: '鲜卑燕军', tier: 2 }, // 天井关·慕容永西燕末代君主
  // 金甲卫除名（生造）
  huo: { name: '霍邑骁锐', tier: 1 },
  mushi: { name: '丘穆陵骑', tier: 3 },
  // 齐莱锐士除名（无典）
  yin: { name: '殷商多射', tier: 2 },          // 朝歌·甲骨文"多射"
  // 蔡国劲卒除名（无此部队）
  shen: { name: '申伯亲卫', tier: 3 },         // 安康·西周申国
  // 汴河戍旅除名（无此编制）
  yuzhou: { name: '雍丘锐士', tier: 1 },     // 雍丘·祖逖中流击楢
  xin: { name: '上党轻骑', tier: 2 },          // 长子·王猛潞川破前燕
  beidi: { name: '北地羌骑', tier: 1 },        // 萧关·姚苌岭北占据
  yingzhou_d: { name: '选锋军', tier: 2 },       // 顺昌·南宋选锋
  // 北门飞骑除名
    // 大明龙骧卫除名（与明初龙骧卫无专属番号典，改挂殿前诸班）
  lulin: { name: '云台突骑', tier: 0 },           // 昆阳·云台二十八将突骑（昆阳破莽大捷，升T0）
  lai: { name: '齐关弩手', tier: 2 },           // 青石关·王师范屡败朱温（正史胜仗）
  yangshao: { name: '材官骑士', tier: 2 },     // 渑池·周勃大破秦军
    dongxian: { name: '马陵伏弩', tier: 1 },
  mi: { name: '朐城弩手', tier: 2 },         // 朐城·麋竺家兵
  yaozhou: { name: '耀州牙兵', tier: 2 },       // 金锁关·李茂贞岐军
  cai: { name: '雪夜突骑', tier: 1 },          // 新蔡·李愬雪夜入蔡州
  wazhai: { name: '瓦岗军', tier: 1 },           // 定陶·李密破张须陀瓦岗崛起
  huaiyang: { name: '细柳营', tier: 1 },     // 宛丘·周亚夫绝吴楚粮道三月平七国
  yao: { name: '匈奴五部', tier: 2 },        // 平阳·刘渊建都平阳，指挥灭晋
  kong_d: { name: '北海郡兵', tier: 3 },       // 曲阜·孔融以北海相保境，孔融本人极有名
  tongma: { name: '胶西郡国兵', tier: 3 },       // 胶西·刘卬发国兵参与七国之乱，战败
  yanchuan_d: { name: '淮西行营军', tier: 3 }, // 郾城·韩愈随裴度督师郾城，参赞军务
  guide_d: { name: '酂侯亲卫', tier: 1 },   // 永城·萧何酂侯
  tongzhou: { name: '匡国牙兵', tier: 2 },    // 长宁·后汉高祖镇守同州
    hao_d: { name: '淮西突骑', tier: 2 },
  suzhou_d: { name: '江北团练', tier: 3 },
  sima_d: { name: '宣王中军', tier: 3 },   // 获嘉·司马懿都督中外诸军事
  bozhou_d: { name: '聊城义勇', tier: 3 },
  mengcheng_d: { name: '山桑弓手', tier: 3 },
  shangzhou: { name: '商州锐士', tier: 3 },
  bailian: { name: '白莲教众', tier: 2 },
  xinping: { name: '邠宁戍骑', tier: 2 },
  huai: { name: '淮西子弟', tier: 2 },
  dang_d: { name: '厅子都', tier: 3 },
  qianzhou: { name: '神策军', tier: 1 },          // 奉天·李晟神策军收复长安
    xiao_d: { name: '雍州骁锐', tier: 1 },
  zhengzhou: { name: '白袍军', tier: 0 },        // 虎牢关·陈庆之白袍军（名师大将莫自牢，升T0）
  song: { name: '殿前捧日', tier: 1 },           // 开封·赵匡胤殿前捧日军,
    zhao: { name: '邯郸甲士', tier: 2 },
    qing: { name: '环庆军', tier: 1 },
};
