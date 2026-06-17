/**
 * 日本文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 跟拍军团兵力 ≥ 5 万且势力在此表中有映射时，方可下达远征；
 * 收录依据 史料/古代精锐部队.md §5 及「游戏远征映射一览（2026-06-11）」。
 *
 * 不收：#11–12/#22 热兵器；#23–30 幕末—明治近代；那霸水师→岭南。
 */
export const JAPAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  // ── 元寇 ──
  so: { name: '弘安御敌', tier: 2 },           // 对马·金石城·宗氏抗元（1281 弘安役首当锋；≠太宰府警固）
  zhuqian: { name: '警固番役', tier: 0 },  // 太宰府·警固番役（元寇：文永/弘安两役以少胜多，日本区T0锚点）

  // ── 室町—战国—江户（辞典映射表）──
  ashikaga: { name: '奉公众', tier: 2 },         // 京都·§5 #31 足利奉公众
  edo: { name: '旗本武士', tier: 1 },          // 江户城·§5 #20 旗本（Hatamoto）
  satsuma: { name: '隼人众', tier: 3 },        // 鹿儿岛城·§5 #35 萨摩隼人
  hojo_d: { name: '风魔党', tier: 2 },         // 小田原·§5 #17
  iga_d: { name: '伊贺众', tier: 2 },          // 名张·§5 #16
  hashiba: { name: '七手组', tier: 3 },        // 姬路城·§5 #10
  kai: { name: '武田赤备', tier: 1 },          // 躑躅崎馆·§5 #7
  owari: { name: '母衣众', tier: 1 },          // 清洲城·桶狭间（1560）3000破25000，织田信长（§5 #8）
  jinchuan: { name: '马回众', tier: 2 },       // 骏府城·§5 #9
  echigo: { name: '轩猿众', tier: 3 },         // 春日山·§5 #18
  aki: { name: '九鬼水军', tier: 1 },          // 吉田郡山·§5 #13 冷兵接舷
  chosokabe: { name: '一领具足', tier: 2 },     // 冈丰城·长宗我部半农半兵精锐
  aizu: { name: '会津藩士', tier: 3 },         // 鹤之城·会津藩（原大番众）
  izumo: { name: '新宫党', tier: 3 },          // 月山富田·尼子氏最强武装精锐
  honda: { name: '宇都宫势', tier: 3 },        // 宇都宫·下野宇都宫氏武士团（原纪清两党）
  fujiwara: { name: '奥州武士', tier: 3 },     // 柳之御所·奥州藤原氏
  kakizaki: { name: '安藤氏兵', tier: 3 },     // 胜山馆·安藤氏虾夷管领（原虾夷探题）
  nanbu: { name: '南部铁骑', tier: 3 },        // 根城·南部氏骑兵
  osumi: { name: '九州防人', tier: 3 },         // 赤尾木城·§5 #1 防人
  // 奄美岛勇除名（名称现代，无史载）
  ayinu: { name: '阿伊努猎兵', tier: 3 },       // 白老·虾夷特有猛毒箭射手
  beihai: { name: '越后山伏', tier: 3 },       // 宗谷界城·越后修验道武者（原雪国斥候）
  yamato: { name: '飞鸟卫府', tier: 3 },       // 飞鸟宫·大和朝廷
  sanada_d: { name: '真田赤备', tier: 1 },
  // ── 2026-06-17 令制国补点（古代据点名 + 精锐）──
  kaga_d: { name: '一向军', tier: 2 },       // 江沼·加贺一向一揆
  date_d: { name: '伊达铁骑', tier: 2 },     // 仙台·伊达氏（家族旗号可含「伊达」）
  higo_d: { name: '菊池党', tier: 2 },       // 熊本·菊池氏
  iyo_d: { name: '河野水军', tier: 2 },     // 松山·河野氏（伊予水军）
  otomo_d: { name: '大友水军', tier: 2 },   // 府内·大友氏（家族旗号可含「大友」）
  suwa_d: { name: '诹访神党', tier: 2 },     // 高岛·诹访氏最强武装（家族旗号可含「诹访」）
};
