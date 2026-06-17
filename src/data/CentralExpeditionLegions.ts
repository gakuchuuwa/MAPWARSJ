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
  tang: { name: '玄甲军', tier: 0 },       // 长安·§1 #44 李世民玄甲骑
  wei: { name: '魏之武卒', tier: 0 },        // 汴梁·吴起练武卒阴晋破秦（《荀子·议兵》）
  qin: { name: '秦之锐士', tier: 1 },        // 天水·§1 #12 司马错白起
  qi: { name: '齐之技击', tier: 1 },       // 临淄·§1 #13 田忌孙膑
  xichu: { name: '江东子弟', tier: 0 },    // 彭城·项羽巨鹿破秦（《史记》）
  han_d: { name: '轻勇骑', tier: 1 },      // 南郑·§1 #18 韩信背水之战的夺旗骑兵
  xu: { name: '陷阵营', tier: 0 },          // 下邳·§1 #23 高顺部曲（番号随城；旗号徐·徐国）
  cao_d: { name: '虎豹骑', tier: 0 },      // 谯都·§1 #31 曹纯曹真（#32青州兵让位）
  ranwei_d: { name: '乞活军', tier: 2 },   // 巨鹿·§1 #41 冉闵陈午
  wuzhou_d: { name: '控鹤军', tier: 2 },   // 洛阳·§1 #47 武则天北衙
  fu: { name: '皂衣队', tier: 1 },         // 大散关·§1 #39 苻坚前秦
  shang: { name: '虎贲多射', tier: 1 },       // 安阳·殷商虎贲与多射（妇好征伐）
  zhou: { name: '岐阳周师', tier: 2 },     // 岐山·武王伐纣王师
  xia: { name: '夏后亲卫', tier: 2 },      // 安邑·夏后氏
  sui: { name: '骁果军', tier: 2 },        // 汉东·隋帝禁卫骁果；615雁门李世民解围（根基在中央，河套用武地）
  sunqin: { name: '督标秦军', tier: 2 },   // 潼关·孙传庭督标
  // 飞熊军除名（小说番号）
  // 韩卒击刹除名（无史载）
  liang_d: { name: '宋公徒旅', tier: 3 },  // 商丘·春秋宋国公室徒旅（《左传》；原梁国劲卒，都大梁非商丘）
  // 公行锐士除名
  // 朱龙骑除名（无此番号）
  liguo: { name: '黎之耆戎', tier: 3 },       // 阏与·黎国耆戎
  yiyang_d: { name: '申息锐师', tier: 2 },    // 武胜关·楚国申息之师
  // ── 2026-06-16 新增：11大名关 ──
  hongnong_jun: { name: '神策军', tier: 2 },       // 函谷关·鱼朝恩陕州兵，唐中央禁军
  zheng: { name: '成皋部曲', tier: 3 },
  ruo: { name: '商於材官', tier: 3 },
  ruzhou: { name: '广成健卒', tier: 3 },
  yun: { name: '陆浑戎骑', tier: 3 },
  zhi_state: { name: '太行飞军', tier: 2 },
  xiongding: { name: '碗子城军', tier: 3 },
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
  chuzhou_d: { name: '大明龙骧卫', tier: 2 },      // 清流关·明初亲军卫
};
