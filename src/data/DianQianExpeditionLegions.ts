/**
 * 滇缅文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线：
 * - 每文化区 ≥10 条；番号 3–6 字，全局不重复
 * - 番号取项目辞典/正史具名，禁止泛称堆砌「XX战象队」
 * - 不收热兵器专名（§11 #3 佛郎机火枪营；#6 日本人町不收）
 */
export const DIANQIAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  nanzhao: { name: '罗苴子', tier: 0 },        // 蒙舍城·天宝之战（754）伏击李宓唐军
  dali: { name: '大理白军', tier: 2 },         // 羊苴咩·§11 #2
  bayinnaung: { name: '东吁象阵兵', tier: 1 }, // 东吁·辞典东吁象阵（#16，去火枪）
  dongxu: { name: '南都象阵', tier: 2 },       // 勃固城·东吁王朝南都勃固象兵（≠东吁@东吁）
  konbaung: { name: '贡榜卡塞骑', tier: 2 },   // 瑞波·§11 #4 卡塞重骑
  siam: { name: '皇家象骑兵', tier: 2 },       // 阿瑜陀耶·暹罗王家象兵（纳黎萱等；泰籍战史名，非中原式以少胜多顶格）
  pagan: { name: '战象禁卫', tier: 3 },      // 蒲甘·阿奴律陀象军禁卫（无古籍固定番号）
  pyu: { name: '骠国巨象阵', tier: 2 },        // 室利差罗·辞典 #22（新唐书·骠国乐）
  champa: { name: '占婆国水师', tier: 2 },     // 美山·§10 #7（占族航海精锐）
  chenla: { name: '双弓弩象营', tier: 2 },     // 吴哥·辞典 #93 高棉弩象营
  luchuan: { name: '麓川夷象', tier: 2 }, // 勐卯·辞典 #96 三征麓川象兵
  dianguo: { name: '滇池水军', tier: 2 },     // 拓东城·滇国水师
  // 仲家兵除名（无此编制）
  hani_d: { name: '思陀甸兵', tier: 3 },      // 思陀·哈尼族思陀甸兵
  wuman: { name: '东爨乌蛮兵', tier: 3 },     // 乌蒙山·东爨乌蛮兵
  cuanshi: { name: '爨族部兵', tier: 3 },      // 曲靖·爨氏
  suke: { name: '素可泰兵', tier: 3 },     // 双河城·素可泰王国
  ailao: { name: '哀牢戍兵', tier: 3 },        // 永昌·哀牢国
};
