/**
 * 河西文化区远征精锐军团名（HEXI / RegionSystem「河西」）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复；史料具名
 * - 依据 史料/古代精锐部队.md §7 河西 12 支
 * - §7 #5 泼喜军（骆驼抛石）→ 不收；#12 嘉峪关戍卒（火器）→ 不收
 * - 三者防重：见 ExpeditionLegions.ts、ExpeditionTripleNameAllow.ts
 */
export const HEXI_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  lanzhou: { name: '金城突骑', tier: 1 },     // 金城·赵充国金城突骑
  dangxiang: { name: '铁鹞子', tier: 1 },        // 兴庆府·1041好水川诱伏，铁鹞子冲阵，任福战死（非以少胜多，降T1）
  qing: { name: '忠孝军', tier: 0 },         // 安化·完颜陈和尚大昌原四百破八千（《金史》）
  // 步跋子已迁环洲（huan@方渠）
  yeli: { name: '擒生军', tier: 2 },             // 克夷门·西夏监军司
    weiming: { name: '嵬名亲卫', tier: 1 },       // 鸡鹿塞·李继迁嵬名部亲卫起兵地斤泽
  guiyi: { name: '沙州劲旅', tier: 1 },          // 玉门关·§7 #4 张议潮归义军（名震天下复河西，升T1）
  xianlingqiang: { name: '凉州大马', tier: 2 },  // 允吾·凉州骑兵泛称
  tufa_d: { name: '南凉铁骑', tier: 2 },         // 浇河·§7 #8 秃发鲜卑（番号避旗号「秃发」）
  juqu_d: { name: '卢水胡兵', tier: 3 },         // 表氏·沮渠卢水胡兵
  liangzhou: { name: '凉州突骑', tier: 2 },     // 姑臧·窦融河西骑兵美称（史书泛称，非固定番号；突骑＝突击骑）
  hunxie: { name: '肩水胡骑', tier: 2 },          // 肩水金关·匈奴浑邪部（原甘州铁骑，归甘）
  qifu_d: { name: '苑川突骑', tier: 2 },         // 枹罕·西秦乞伏鲜卑突骑（苑川故地）
  anding_wei: { name: '长征健儿', tier: 2 },      // 苦峪堡·唐安西征募健儿
  beidi: { name: '萧关弩手', tier: 3 },           // 萧关·孙卬守关战死
  yingli: { name: '泼喜军', tier: 2 },            // 鸣沙·西夏砲驼兵
  chijin: { name: '赤金营', tier: 2 },        // 赤金堡·岳钟琪平准噶尔西路劲旅
  juyan_d: { name: '荆楚步卒', tier: 2 },     // 巴音布拉格·李陵五千荆楚勇士出居延（虽勇但战败投降，降T2）
  dongshengwei: { name: '东胜卫戍', tier: 3 },     // 东胜卫·明代卫所
  zhai_han: { name: '翟国狄骑', tier: 3 },         // 肤施·春秋赤狄翟国
  huizhou: { name: '会州边兵', tier: 3 },          // 祖厉·唐代会州
  // 赤亭关 @ gaochang（西域）已有「高昌铁骑」；后秦姚氏羌骑无合格 1势力=1据点，不收 yao_qiang
  ningkou: { name: '居延戍卒', tier: 3 },            // 居延塞·汉居延戍卒（居延汉简）
  shuofang: { name: '期门郎骑', tier: 1 },      // 河南地·汉武帝期门郎戍朔方
    ganzhou: { name: '甘州铁骑', tier: 2 },       // 张掖·窦融河西骑兵（T2有名史载专名）
    anxi: { name: '大唐安西军', tier: 1 },       // 拨换城·郭昕安西军（白发孤忠，升T1）
  xiqin: { name: '西秦锐卒', tier: 3 },
  didao: { name: '狄道戍骑', tier: 3 },
  baiyang: { name: '长城戍卒', tier: 3 },
  wei2: { name: '静塞军', tier: 1 },
  guazhou: { name: '瓜州镇兵', tier: 3 },  // 晋昌城·唐瓜州镇兵
  shazhou: { name: '归义精骑', tier: 1 },  // 敦煌·张议潮归义军精骑（有名且复河西，升T1）
  suzhou: { name: '骠骑郎卫', tier: 1 },  // 酒泉·霍去病骠骑将军麾下郎卫（河西出击）
  kang: { name: '梁国鹰扬', tier: 2 },              // 长泽·梁师都鹰扬郎将起兵建梁（名气不足，降T2）
  lushui: { name: '凉州义从胡', tier: 2 },          // 媪围·北宫伯玉卢水义从胡起兵凉州
  woye: { name: '朔方边军', tier: 2 },           // 临戎·皇甫规度辽将军驻朔方
};
