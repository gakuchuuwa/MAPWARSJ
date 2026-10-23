/**
 * 北方文化区远征精锐军团名（NORTH）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；史料具名
 * - 八字军属王彦太行义军，不得挂南方衡州
 * - §2 北方 12 支全收录；§1 地理偏北者（曳落河/鸦儿军/朔方/静塞/殿前诸班）同列
 * - 朔方军：旗=灵@回乐（灵州/灵武治所），番=朔方军（≠旗号朔方@临戎）
 */
export const NORTH_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
  // ── 太行/河北（§1 交叉 + 明末）──
  // tianxiong 已迁 CentralExpeditionLegions
  // 宣毅军除名（泛称非专属，与方渠无关）

  // ── §2 北方 12 支 ──
  yan: { name: '渔阳突骑', tier: 1 },       // 古北口·§2 #2 光武幽州精骑（升T1）
    gongsun_d: { name: '襄平狟骑', tier: 4 },
    yunzhong: { name: '苍头军', tier: 3 },           // 中国古代（秦汉等）特指奴仆组成的军队，极具军制与阶级特色的文化名词，升入T3知名
    tuoba: { name: '拓跋虎骑', tier: 3 },
  // 武川镇军已迁草原（yuwen@武川镇）
  erzhu: { name: '六镇戍兵', tier: 1 },     // 北魏六镇，横扫天下的基石，六镇之乱孕育了北齐、北周及隋唐开国集团，影响极其深远，升入T1战略
  gaoqi_d: { name: '百保鲜卑', tier: 2 },   // 蓨城·北齐百保精兵·高长恭禁卫（顶级近卫，降T2）
    ming_d: { name: '明军三大营', tier: 1 },

  // ── §1 中原表·地理偏北（用户指定）──
  lingzhou: { name: '朔方突骑', tier: 1 },  // 回乐·仆固怀恩朔方突骑
  dingxiang_d: { name: '定襄骁骑', tier: 0 }, // 恶阳岭·贞观四年李靖三千骁骑出恶阳岭夜袭定襄（神级进攻大捷，升T0）
  wuhuan: { name: '乌桓突骑', tier: 2 },    // 白狼山·§1 #84 曹操收编名骑
    you: { name: '上谷突骑', tier: 1 },
  // 飞虎军除名（李克用置，平型关时代错位）
  // 恒山军除名（泛称无固定番号）
  dongdan: { name: '东丹卫兵', tier: 4 },       // 敖东城·耶律倍东丹国（缺乏极其著名的战术高光，降T3）
  
  // ── 2026-06-18 自东北文件迁回
    zu_d: { name: '关宁铁骑', tier: 1 },
  mao_wenlong: { name: '东江劲旅', tier: 3 }, // 毛文龙在皮岛建立的敌后抗金武装，牵制后金大量兵力，悲剧色彩和知名度极高，升入T3知名
    yang_aner: { name: '天顺红袄', tier: 2 },
  jianzhou_nvzhen: { name: '建州女真卫', tier: 2 }, // 仅为后金初期的特定前身武装，缺乏长久建制延续性（真正的T1战略主力为后期的满洲八旗），降入T2战术
  wuyuan_d: { name: '五原塞卒', tier: 4 },  // 固阳塞·五原郡长城戍卒,
    // 武川镇·宇文泰：边镇骑射出身「武川铁骑」；不可代称六镇总称。档 T3（风土，不抬）
    yuwen: { name: '武川铁骑', tier: 3 },
    ssangseong: { name: '和宁戍骑', tier: 4 },
    hou_jin: { name: '晋阳牙兵', tier: 4 },
    hou_zhao: { name: '黑槊龙骧', tier: 2 },
    da_yan: { name: '曳落河', tier: 2 },
    hou_liang: { name: '铁枪军', tier: 3 },
    han_zhao: { name: '五部匈奴', tier: 4 },
};
