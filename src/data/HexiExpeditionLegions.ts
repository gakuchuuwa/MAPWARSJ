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
    dangxiang: { name: '铁鹞子', tier: 2 },
  // 步跋子已迁环洲（huan@方渠）
    weiming: { name: '嵬名游骑', tier: 4 },
    guiyi: { name: '归义射雕手', tier: 2 },
    liangzhou: { name: '凉州大马', tier: 3 },
  hunxie: { name: '肩水胡骑', tier: 4 },          // 肩水金关·匈奴浑邪部（原甘州铁骑，归甘）（缺乏极其著名的战术高光，降T3）

  yingli: { name: '泼喜军', tier: 2 },            // 西夏骆驼旋风炮特种部队，古代军事史上罕见的战术创新，升入T2战术
  chijin: { name: '赤金营', tier: 4 },        // 赤金堡·岳钟琪平准噶尔西路劲旅（缺乏极其著名的战术高光，降T3）
    zhai_han: { name: '蕃落骑', tier: 1 },
  huizhou: { name: '会州边兵', tier: 4 },          // 祖厉·唐代会州
  // 赤亭关 @ gaochang（西域）已有「高昌铁骑」；后秦姚氏羌骑无合格 1势力=1据点，不收 yao_qiang
    ningkou: { name: '汉连弩卫', tier: 2 },
  shuofang: { name: '期门郎骑', tier: 3 },      // 汉武帝期门军（近卫），知名度高，降为T3知名。
    ganzhou: { name: '觻得精骑', tier: 2 },
    xiqin: { name: '忠孝军', tier: 2 }, // 仅有四百至数千人，于大昌原等战役打出短期战术高光，随后于三峰山覆灭，缺乏长久延续性，符合T2战术
    didao: { name: '熙河蕃兵', tier: 1 },
    baiyang: { name: '长城烽火卫', tier: 3 },
  // 静塞军：北宋专名骑军，唐河之役破辽铁林 → T2；恢复专名（勿加「骑」字凑新）
  wei2: { name: '静塞军', tier: 2 },
    guazhou: { name: '墨离疑锋', tier: 3 },
  shazhou: { name: '归义精骑', tier: 1 },  // 敦煌·张议潮归义军精骑（有名且复河西，升T1）
    kang: { name: '鹰扬骁骑', tier: 4 },
    woye: { name: '沃野镇兵', tier: 3 },
    chile: { name: '两池军', tier: 3 },
    weiyuan: { name: '永安营兵', tier: 3 },
    helian: { name: '铁弗宿卫', tier: 3 },
    xiazhou: { name: '平夏部骑', tier: 3 },
    yanzhou: { name: '步跋子', tier: 3 },
    ashide: { name: '阿史德骑', tier: 4 },
    cangsong: { name: '西凉铁骑', tier: 2 },
    suzhou: { name: '轻勇骑', tier: 0 },
    xiyuduhu: { name: '西域都护军', tier: 1 },
    anxi: { name: '安西陌刀军', tier: 2 },
    jiluo_d: { name: '北征突骑', tier: 1 },
};
