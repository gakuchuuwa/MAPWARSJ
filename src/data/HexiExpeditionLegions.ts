/**
 * 河西文化区远征精锐军团名（HEXI / RegionSystem「河西」）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复；史料具名
 * - 依据 史料/古代精锐部队.md §7 河西 12 支
 * - §7 #5 泼喜军（骆驼抛石）→ 不收；#12 嘉峪关戍卒（火器）→ 不收
 * - 三者防重：见 ExpeditionLegions.ts、ExpeditionTripleNameAllow.ts
 */
export const HEXI_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    lanzhou: { name: '湟中胡骑', tier: 3 },
  dangxiang: { name: '铁鹞子', tier: 2 },        // 西夏仅三千人的重甲冲阵死士，规模与定位均属纯粹的战术突击分队，符合T2战术
  // 步跋子已迁环洲（huan@方渠）
  yeli: { name: '擒生军', tier: 3 },             // 西夏主力野战部队之一，特色极其鲜明，升入T3知名
    weiming: { name: '平夏部骑', tier: 3 },
    guiyi: { name: '归义射雕手', tier: 2 },
  tufa_d: { name: '南凉铁骑', tier: 4 },         // 浇河·§7 #8 秃发鲜卑（番号避旗号「秃发」）（缺乏极其著名的战术高光，降T3）
  juqu_d: { name: '卢水胡兵', tier: 3 },         // 五胡十六国时期河西走廊极其著名的部族武装（北凉基础），历史辨识度高，升入T3知名
    liangzhou: { name: '凉州大马', tier: 3 },
  hunxie: { name: '肩水胡骑', tier: 4 },          // 肩水金关·匈奴浑邪部（原甘州铁骑，归甘）（缺乏极其著名的战术高光，降T3）

  yingli: { name: '泼喜军', tier: 2 },            // 西夏骆驼旋风炮特种部队，古代军事史上罕见的战术创新，升入T2战术
  chijin: { name: '赤金营', tier: 4 },        // 赤金堡·岳钟琪平准噶尔西路劲旅（缺乏极其著名的战术高光，降T3）
    dongshengwei: { name: '九边夜不收', tier: 2 },
    zhai_han: { name: '蕃落骑', tier: 1 },
  huizhou: { name: '会州边兵', tier: 4 },          // 祖厉·唐代会州
  // 赤亭关 @ gaochang（西域）已有「高昌铁骑」；后秦姚氏羌骑无合格 1势力=1据点，不收 yao_qiang
    ningkou: { name: '汉连弩卫', tier: 2 },
  shuofang: { name: '期门郎骑', tier: 3 },      // 汉武帝期门军（近卫），知名度高，降为T3知名。
    ganzhou: { name: '觻得精骑', tier: 2 },
    xiqin: { name: '忠孝军', tier: 2 }, // 仅有四百至数千人，于大昌原等战役打出短期战术高光，随后于三峰山覆灭，缺乏长久延续性，符合T2战术
    didao: { name: '熙河蕃兵', tier: 1 },
  baiyang: { name: '长城烽火卫', tier: 3 }, // 塞外长城守军
  wei2: { name: '静塞军', tier: 2 },                 // 易州·北宋第一精骑（战术尖刀）
  guazhou: { name: '瓜州镇兵', tier: 4 },  // 晋昌城·唐瓜州镇兵
  shazhou: { name: '归义精骑', tier: 1 },  // 敦煌·张议潮归义军精骑（有名且复河西，升T1）
  suzhou: { name: '骠骑郎卫', tier: 0 },  // 霍去病封狼居胥，彻底解除百年威胁，完全踩中T0“灭国级大捷”，升T0
  kang: { name: '鹰扬骁骑', tier: 4 },              // 长泽·梁师都鹰扬郎将起兵建梁（名气不足，降T2）（缺乏进攻高光，降T3）
    lushui: { name: '飞熊军', tier: 2 },
  woye: { name: '度辽营', tier: 2 },           // 东汉经典边防番号度辽将军，专属名号特色鲜明，升T2
    yangguan: { name: '西凉铁骑', tier: 1 },
        yuezhi: { name: '折兰骑', tier: 3 },             // 霍去病河西之战斩杀的匈奴最强王牌，战役背景极具符号价值，升入T3知名,
    shanzhou: { name: '陇右健儿', tier: 1 },
    chile: { name: '两池军', tier: 3 },
    weiyuan: { name: '永安营兵', tier: 3 },
};
