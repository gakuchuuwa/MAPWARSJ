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
  xiezhou: { name: '河东军', tier: 2 },   // 安邑·马燧河东节度使
  tang: { name: '神策军', tier: 2 },       // 长安·李晟神策军（唐禁军）
  wei: { name: '魏之武卒', tier: 0 },        // 汴梁·吴起练武卒阴晋破秦（《荀子·议兵》）
  qin: { name: '秦之锐士', tier: 1 },        // 天水·§1 #12 司马错白起
  qi: { name: '齐之技击', tier: 1 },       // 临淄·§1 #13 田忌孙膑
  han: { name: '韩之劲弩', tier: 2 },        // 新郑·暴鸢韩弩
  xichu: { name: '江东子弟', tier: 0 },    // 彭城·项羽巨鹿破秦（《史记》）
  han_d: { name: '轻勇骑', tier: 1 },      // 南郑·§1 #18 韩信背水之战的夺旗骑兵
  pizhou: { name: '陷阵营', tier: 1 },        // 下邳·高顺陷阵营
  cao_d: { name: '虎豹骑', tier: 1 },      // 谯都·曹纯曹真（无独立以少胜多经典）
  ranwei_d: { name: '乞活军', tier: 2 },   // 巨鹿·§1 #41 冉闵陈午
    wuzhou_d: { name: '羽林军', tier: 1 },     // 洛阳·李多祚羽林军（武周）
  shang: { name: '虎贲多射', tier: 1 },       // 安阳·殷商虎贲与多射（妇好征伐）
  zhou: { name: '岐阳虎贲', tier: 1 },     // 岐山·武王伐纣牧野（《史记》）
  // 夏后亲卫除名（夏代无信史）
  yuan_cj_d: { name: '大戟士', tier: 2 },    // 汝南·袁术大戟士（败多胜少，降T2）
  chanzhou: { name: '澶州弩手', tier: 1 },   // 濮阳·李继隆澶州弩手
  sui: { name: '骁果军', tier: 2 },        // 汉东·隋帝禁卫骁果；615雁门李世民解围（根基在中央，河套用武地）
  sunqin: { name: '督标秦军', tier: 2 },   // 潼关·孙传庭督标
  // 飞熊军除名（小说番号）
  // 韩卒击刹除名（无史载）
    liang_d: { name: '睢阳义兵', tier: 1 },     // 商丘·张巡守睢阳
  // 公行锐士除名
  jin: { name: '晋中军', tier: 1 },        // 曲沃·城濮之战破楚（《左传》）
  li_lx_d: { name: '陇西戍骑', tier: 3 },   // 陇西·李崇秦陇西郡守戍兵
  xiayang_d: { name: '龙门戍卒', tier: 3 }, // 龙门·唐同州境黄河禹门戍防（《水经注》夏阳龙门）
  baibo: { name: '白波黄巾', tier: 3 },     // 白波谷·郭太白波黄巾
  dashun: { name: '老营军', tier: 1 },      // 子午谷·李自成老营精锐
  tianxiong: { name: '魏博牙兵', tier: 1 },  // 大名·田承嗣魏博牙兵
  dixiang: { name: '南阳材官', tier: 3 },   // 宛城·张绣南阳材官
  // 朱龙骑除名（无此番号）
  liguo: { name: '黎之耆戎', tier: 3 },       // 阏与·黎国耆戎
  yiyang_d: { name: '申息锐师', tier: 2 },    // 武胜关·楚国申息之师
  // ── 2026-06-16 新增：11大名关 ──
                      hongnong_jun: { name: '函谷锐士', tier: 1 },    // 函谷关·樗里疾崤函锐士
  huangfu: { name: '安定神策', tier: 1 },       // 安定·李晟安定神策（T1有名且胜仗）
  zhengzhou: { name: '玄甲军', tier: 0 },  // 虎牢关·李世民玄甲骑
  ruo: { name: '商於材官', tier: 3 },
  ruzhou: { name: '广成健卒', tier: 3 },
  yun: { name: '陆浑戎骑', tier: 3 },
  zhi_state: { name: '太行飞军', tier: 3 },
  xiongding: { name: '鲜卑燕军', tier: 2 }, // 天井关·慕容永西燕末代君主
  // 金甲卫除名（生造）
  huo: { name: '霍邑锐士', tier: 3 },
  mushi: { name: '丘穆陵骑', tier: 3 },
  // 齐莱锐士除名（无典）
  yin: { name: '殷商多射', tier: 2 },          // 朝歌·甲骨文"多射"
  // 蔡国劲卒除名（无此部队）
  shen: { name: '申伯亲卫', tier: 3 },         // 安康·西周申国
  // 汴河戍旅除名（无此编制）
  qiguo_d: { name: '夏裔锐士', tier: 3 },      // 雍丘·杞国夏后氏苗裔
  xin: { name: '新室卫士', tier: 3 },          // 宛城·王莽新室（《汉书》）
  yingzhou_d: { name: '选锋军', tier: 2 },       // 顺昌·南宋选锋
  // 北门飞骑除名
  chuzhou_d: { name: '殿前诸班', tier: 1 },      // 清流关·后周殿前军（赵匡胤曾任殿前都点检，《旧五代史》）
  // 大明龙骧卫除名（与明初龙骧卫无专属番号典，改挂殿前诸班）
  lulin: { name: '云台突骑', tier: 1 },           // 昆阳·云台二十八将突骑
  lai: { name: '齐关弩手', tier: 1 },           // 青石关·王师范屡败朱温（正史胜仗）
  yangshao: { name: '材官骑士', tier: 1 },     // 渑池·周勃大破秦军
  dongxian: { name: '郯城戍卒', tier: 2 },     // 郯城·徐盛东吴宿将
  mi: { name: '朐城弩手', tier: 2 },         // 朐城·麋竺家兵
  yaozhou: { name: '耀州牙兵', tier: 2 },       // 金锁关·李茂贞岐军
  cai: { name: '蔡国甲士', tier: 2 },          // 新蔡·蔡叔度开国君主
  wazhai: { name: '瓦岗军', tier: 1 },           // 定陶·李密破张须陀瓦岗崛起
  huaiyang: { name: '大楚戍卒义军', tier: 2 },     // 宛丘·陈胜称王建都起义领袖
  yao: { name: '匈奴五部', tier: 2 },        // 平阳·刘渊建都平阳，指挥灭晋
  kong_d: { name: '北海郡兵', tier: 3 },       // 曲阜·孔融以北海相保境，孔融本人极有名
  tongma: { name: '胶西郡国兵', tier: 3 },       // 胶西·刘卬发国兵参与七国之乱，战败
  yanchuan_d: { name: '唐·淮西行营军', tier: 3 }, // 郾城·韩愈随裴度督师郾城，参赞军务
  guide_d: { name: '隋·永城屯守兵', tier: 3 },   // 永城·麻叔谋镇守永城
  tongzhou: { name: '隋·同州府兵', tier: 3 },    // 长宁·杨智积镇守同州
  hao_d: { name: '濠州红巾军', tier: 3 },
  suzhou_d: { name: '江北团练', tier: 3 },
  sima_d: { name: '河内甲士', tier: 3 },
  bozhou_d: { name: '聊城义勇', tier: 3 },
  mengcheng_d: { name: '山桑弓手', tier: 3 },
  shangzhou: { name: '商州锐士', tier: 3 },
  bailian: { name: '白莲教众', tier: 3 },
  xinping: { name: '新平戍军', tier: 3 },
  huai: { name: '淮西子弟', tier: 3 },
  dang_d: { name: '砀山义军', tier: 3 },
};
