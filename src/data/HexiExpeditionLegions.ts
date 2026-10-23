/**
 * 河西文化区远征精锐军团名（HEXI / RegionSystem「河西」）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；史料具名
 * - 依据 史料/古代精锐部队.md §7 河西 12 支
 * - §7 #5 泼喜军（骆驼抛石）→ 不收；#12 嘉峪关戍卒（火器）→ 不收
 * - 三者防重：只查旗号/据点名/番号逐字相同，见 ExpeditionLegions.ts
 */
export const HEXI_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    dangxiang: { name: '铁鹞子', tier: 2 },
  // 步跋子已迁环洲（huan@方渠）
    guiyi: { name: '归义射雕手', tier: 2 },

  // 赤亭关 @ gaochang（西域）已有「高昌铁骑」；后秦姚氏羌骑无合格 1势力=1据点，不收 yao_qiang
  // 静塞军：北宋专名骑军，唐河之役破辽铁林 → T2；恢复专名（勿加「骑」字凑新）
    anxi: { name: '安西陌刀军', tier: 2 },
    pulei: { name: '蒲类落雕骑', tier: 3 },
    hepan: { name: '葱岭守捉兵', tier: 3 },
    fushi: { name: '氐秦锐士', tier: 3 },
    qianliang: { name: '凉州大马', tier: 1 },   // 前凉｜统帅 张轨｜T1 乘 1.4｜西域诸国震服，数次长途出击大破汉赵、后赵
};
