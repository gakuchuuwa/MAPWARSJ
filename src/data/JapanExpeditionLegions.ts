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
  zhuqian: { name: '警固番役', tier: 2 },  // 太宰府·警固番役

  // ── 室町—战国—江户（辞典映射表）──
  ashikaga: { name: '奉公众', tier: 2 },         // 京都·§5 #31 足利奉公众
  edo: { name: '旗本武士', tier: 1 },          // 江户城·§5 #20 旗本（Hatamoto）
  satsuma: { name: '隼人众', tier: 3 },        // 内城·§5 #35 萨摩隼人
  hojo_d: { name: '风魔党', tier: 2 },         // 小田原·§5 #17
  iga_d: { name: '伊贺众', tier: 2 },          // 名张·§5 #16
  hashiba: { name: '七手组', tier: 3 },        // 姬路城·§5 #10
  kai: { name: '武田赤备', tier: 0 },          // 躑躅崎馆·§5 #7
  owari: { name: '母衣众', tier: 2 },          // 清洲城·§5 #8
  jinchuan: { name: '马回众', tier: 2 },       // 骏府城·§5 #9
  echigo: { name: '轩猿众', tier: 3 },         // 春日山·§5 #18
  aki: { name: '九鬼水军', tier: 1 },          // 吉田郡山·§5 #13 冷兵接舷
  chosokabe: { name: '一领具足', tier: 2 },     // 冈丰城·长宗我部半农半兵精锐
  aizu: { name: '大番众', tier: 3 },           // 鹤之城·§5 #21 大番
  izumo: { name: '新宫党', tier: 3 },          // 月山富田·尼子氏最强武装精锐
  honda: { name: '纪清两党', tier: 3 },        // 宇都宫·下野国极度尚武的精锐武士集团
  fujiwara: { name: '平泉骑马队', tier: 2 },     // 柳之御所·奥州藤原氏重装骑兵
  kakizaki: { name: '虾夷探题', tier: 3 },     // 胜山馆·蛎崎氏/松前氏边区武士
  nanbu: { name: '南部铁骑', tier: 1 },        // 根城·陆奥名马产地、战国闻名的南部骑兵
  osumi: { name: '九州防人', tier: 3 },         // 赤尾木城·§5 #1 防人
  anmei: { name: '奄美岛勇', tier: 3 },         // 赤木名城·琉球/奄美诸岛死士
  ayinu: { name: '阿伊努猎兵', tier: 3 },       // 白老·虾夷特有猛毒箭射手
  beihai: { name: '雪国斥候', tier: 3 },       // 宗谷·极北严寒适应兵
  yamato: { name: '健儿武士', tier: 2 },       // 飞鸟宫·§5 #2
  sanada_d: { name: '真田赤备', tier: 0 },
};
