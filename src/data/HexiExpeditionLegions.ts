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
  lanzhou: { name: '金城突骑', tier: 2 },     // 金城·赵充国金城突骑
  dangxiang: { name: '铁鹞子', tier: 1 },        // 兴庆府·西夏重装冲锋骑兵，百年立国主力
  // 步跋子已迁环洲（huan@方渠）
  yeli: { name: '擒生军', tier: 2 },             // 克夷门·西夏监军司
    weiming: { name: '嵬名亲卫', tier: 2 },       // 鸡鹿塞·李继迁嵬名部亲卫起兵地斤泽
  guiyi: { name: '沙州劲旅', tier: 2 },          // 玉门关·张议潮归义军（名震天下复河西，降T2让给敦煌T1）
  xianlingqiang: { name: '凉州大马', tier: 2 },  // 允吾·凉州骑兵泛称
  tufa_d: { name: '南凉铁骑', tier: 2 },         // 浇河·§7 #8 秃发鲜卑（番号避旗号「秃发」）
  juqu_d: { name: '卢水胡兵', tier: 3 },         // 表氏·沮渠卢水胡兵
  liangzhou: { name: '凉州突骑', tier: 2 },     // 姑臧·窦融河西骑兵美称（史书泛称，非固定番号；突骑＝突击骑）
  hunxie: { name: '肩水胡骑', tier: 2 },          // 肩水金关·匈奴浑邪部（原甘州铁骑，归甘）
  qifu_d: { name: '苑川突骑', tier: 2 },         // 枹罕·西秦乞伏鲜卑突骑（苑川故地）

  yingli: { name: '泼喜军', tier: 2 },            // 鸣沙·西夏砲驼兵
  chijin: { name: '赤金营', tier: 2 },        // 赤金堡·岳钟琪平准噶尔西路劲旅
  juyan_d: { name: '荆楚步卒', tier: 2 },     // 巴音布拉格·李陵五千荆楚勇士出居延（虽勇但战败投降，降T2）
  dongshengwei: { name: '九边夜不收', tier: 2 },     // 榆林·明代九边特种侦察兵（夜不收）
  zhai_han: { name: '蕃落骑', tier: 1 },         // 肤施·狄青率蕃落骑破西夏及夜袭昆仑关大捷
  huizhou: { name: '会州边兵', tier: 3 },          // 祖厉·唐代会州
  // 赤亭关 @ gaochang（西域）已有「高昌铁骑」；后秦姚氏羌骑无合格 1势力=1据点，不收 yao_qiang
  ningkou: { name: '居延戍卒', tier: 3 },            // 居延塞·汉居延戍卒（居延汉简）
  shuofang: { name: '期门郎骑', tier: 2 },      // 河南地·汉武帝期门郎戍朔方
    ganzhou: { name: '甘州铁骑', tier: 2 },       // 张掖·窦融河西骑兵（T2有名史载专名）
    xiqin: { name: '忠孝军', tier: 1 },
    didao: { name: '熙河蕃兵', tier: 1 },
  baiyang: { name: '长城烽火卫', tier: 3 }, // 塞外长城守军
  wei2: { name: '静塞军', tier: 2 },
  guazhou: { name: '瓜州镇兵', tier: 3 },  // 晋昌城·唐瓜州镇兵
  shazhou: { name: '归义精骑', tier: 1 },  // 敦煌·张议潮归义军精骑（有名且复河西，升T1）
  suzhou: { name: '骠骑郎卫', tier: 1 },  // 酒泉·霍去病骠骑将军麾下郎卫（河西出击）
  kang: { name: '鹰扬骁骑', tier: 2 },              // 长泽·梁师都鹰扬郎将起兵建梁（名气不足，降T2）
  lushui: { name: '飞熊军', tier: 2 },          // 媪围·董卓飞熊军（小说番号更好听，T2符合其实力）
  woye: { name: '度辽营', tier: 2 },           // 临戎·皇甫规度辽将军驻朔方,
    yangguan: { name: '西凉铁骑', tier: 1 },
    yuezhi: { name: '折兰骑', tier: 2 },
};
