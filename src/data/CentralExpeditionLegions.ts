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
  wei: { name: '魏之武卒', tier: 0 },        // 汴梁·§1 #11 吴起大梁
  qin: { name: '秦之锐士', tier: 0 },        // 天水·§1 #12 司马错白起
  qi: { name: '齐之技击', tier: 0 },       // 临淄·§1 #13 田忌孙膑
  xichu: { name: '江东子弟', tier: 0 },    // 彭城·§1 #15 八千子弟兵（项羽会稽起兵）
  han_d: { name: '轻勇骑', tier: 3 },      // 南郑·§1 #18 韩信背水之战的夺旗骑兵
  xu: { name: '陷阵营', tier: 0 },          // 下邳·§1 #23 高顺部曲（番号随城；旗号徐·徐国）
  cao_d: { name: '虎豹骑', tier: 0 },      // 谯都·§1 #31 曹纯曹真（#32青州兵让位）
  ranwei_d: { name: '乞活军', tier: 1 },   // 巨鹿·§1 #41 冉闵陈午
  wuzhou_d: { name: '控鹤军', tier: 1 },   // 洛阳·§1 #47 武则天北衙
  fu: { name: '皂衣队', tier: 3 },         // 大散关·§1 #39 苻坚前秦
  shang: { name: '虎贲多射', tier: 1 },       // 安阳·殷商虎贲与多射（妇好征伐）
  zhou: { name: '岐阳周师', tier: 3 },     // 岐山·§1 #3 虎贲三千（岐阳即岐周故地）
  xia: { name: '夏后亲卫', tier: 1 },      // 安邑·§1 #1 夏后氏
  sui: { name: '骁果军', tier: 1 },        // 汉东·§1 #43 隋帝骁果（≠瓦岗军）
  sunqin: { name: '督标秦军', tier: 3 },   // 潼关·§1 #81 孙传庭督标秦兵
  didao: { name: '飞熊军', tier: 1 },      // 临洮·§1 #27 陇西董卓系（旗=狄·狄道）
  han: { name: '韩卒击刹', tier: 3 },      // 新郑·战国韩都精锐（旗=韩·韩国）
  liang_d: { name: '梁国劲卒', tier: 2 },  // 商丘·战国/汉代梁国劲卒（旗=梁·梁国）
  wey: { name: '朱龙骑', tier: 3 },          // 濮阳·卫国朱龙骑
  liguo: { name: '黎之耆戎', tier: 3 },       // 阏与·黎国耆戎
  yiyang_d: { name: '申息锐师', tier: 2 },    // 武胜关·义阳申息锐师
  // ── 2026-06-16 新增：11大名关 ──
  hongnong_jun: { name: '桃林射士', tier: 2 },
  zheng: { name: '成皋部曲', tier: 2 },
  ruo: { name: '商於材官', tier: 3 },
  ruzhou: { name: '广成健卒', tier: 3 },
  yun: { name: '陆浑戎骑', tier: 3 },
  zhi_state: { name: '太行飞军', tier: 1 },
  xiongding: { name: '碗子城军', tier: 3 },
  yaozhou: { name: '金甲卫', tier: 3 },
  huo: { name: '霍邑锐士', tier: 3 },
  mushi: { name: '丘穆陵骑', tier: 3 },
  lai: { name: '齐莱锐士', tier: 3 },
  chuzhou_d: { name: '大明龙骧卫', tier: 0 },      // 清流关·明开国龙骧卫
};
