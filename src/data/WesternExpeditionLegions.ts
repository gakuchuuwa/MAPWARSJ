/**
 * 西域文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝东北草原一致：
 * - 番号至少 3 个汉字
 * - 同势力只挂一个番号（比知名度分流）
 * - 不收热兵器专名（§14 #9 叶尔羌火枪兵等）
 * - 依据 史料/古代精锐部队.md §14 #1–8；#10 喀喇契丹→中亚 xiliao@屈耽·斡耳朵亲卫
 */
export const WESTERN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  qiuci: { name: '龟兹重甲兵', tier: 2 },   // 伊逻卢·龟兹国冶铁重装（§14 #1）
  yutian: { name: '于阗尉迟军', tier: 2 },  // 于阗·尉迟王族精锐（§14 #2）
  kala: { name: '阿斯古拉姆', tier: 0 },      // 奥什·阿斯卡里古拉姆 Askari Ghulam；1006策勒灭于阗
  an: { name: '伊列克近卫', tier: 1 },        // 蒲华·999 纳斯尔·伊列克汗奇袭布哈拉灭萨曼
  yiduhu: { name: '阿斯兰军', tier: 1 },      // 西州·咸通七年仆固俊北庭回鹘克西州（新唐书·回鹘传「斩论尚热」）
  shule: { name: '盘橐卫', tier: 2 },       // 盘橐城·疏勒强弩守军（§14 #5；班超大本营）
  yanqi: { name: '焉耆龙骑兵', tier: 2 },   // 员渠城·焉耆龙骑（§14 #6）
  wusun: { name: '昆莫亲卫', tier: 1 }, // 赤谷城·乌孙王帐亲卫（§14 #7）
  chagatai: { name: '蒙兀儿铁骑', tier: 1 }, // 别失八里·东察合台蒙兀儿铁骑（§14 #8）
  dayuan: { name: '汗血天马骑', tier: 0 },   // 贵山城·史记「汗血天马子」；贵山守战四十余日抗汉（大宛列传）
  shache: { name: '莎车左右骑', tier: 3 },   // 渠莎·汉书莎车「左右骑君」；后汉莎车王贤数万人征服诸国
  anxi: { name: '大唐安西军', tier: 0 },     // 拨换城·高仙芝/郭昕安西都护府精锐（§1 #54）
  // §14 #9 叶尔羌火枪兵（火绳枪）→ 不收
  loulan: { name: '楼兰戍', tier: 3 },      // 扜泥城·汉晋楼兰戍卒（旗=楼兰·§12.1.1）
  zhuxie: { name: '朱邪部兵', tier: 3 },      // 大石城·沙陀朱邪部
  yuchi: { name: '精绝卫士', tier: 3 },      // 精绝·尉迟氏
  juandu: { name: '捐毒戍卒', tier: 3 },     // 排修城·汉西域捐毒国
  wensu: { name: '温宿锐卒', tier: 3 },      // 三重城·温宿国
  // §14 #10 喀喇契丹 → 见 CentralAsiaExpeditionLegions xiliao
  // ── 2026-06-16 新增：西域大区平衡补全（5支，精锐随据点，全图无六字番号） ──
  quli: { name: '轮台戍卒', tier: 3 },
  dzungar: { name: '塔城卫队', tier: 3 },
  yarkand: { name: '英吉沙骑兵', tier: 3 },
  tuerhute: { name: '鹰娑川铁骑', tier: 1 },
  gaochang: { name: '高昌铁骑', tier: 2 },    // 赤亭关·麴氏高昌具装骑（都城高昌，咸通前）
};
