/**
 * 东欧蛮族文化区远征精锐军团名（EAST / RegionSystem，2026-08-27 拆日耳曼/拉丁/斯拉夫/草原新增）
 *
 * 覆盖范围：东欧蛮族（哥特/匈人/条顿/维京/罗斯）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 * - 武将/精锐/据点三契：守将/贡献/镇守/当官/执行任务；非出生地无贡献
 * - 冷兵器、17 世纪以前
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const EAST_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {

    // ── T1 功勋之兵 ──
    xiongnu: { name: '鸣镝精骑', tier: 1 },          // 头曼城·冒顿单于：鸣镝主力称霸大漠
    xiongren: { name: '答剌罕骑兵', tier: 1 },        // 塞格德·阿提拉：横扫巴尔干与意大利的战略级胜利，DE 匈奴特色单位
    luosi: { name: '瓦兰吉卫队', tier: 1 },           // 基辅·瓦良格：989 巴西尔二世借基辅瓦良格兵组建的拜占庭皇帝斧兵卫队

    // ── T2 特色之兵 ──
    tiaodun_qishi: { name: '条顿骑士团', tier: 2 },   // 柯尼斯堡·乌尔里希：条顿骑士团
    ruidian_si: { name: '斯韦阿卫队', tier: 2 },      // 斯德哥尔摩·瑞典王室卫队

    // ── T3 风土之兵 ──
    donggete: { name: '哥特近卫军', tier: 3 },        // 拉文纳·狄奥多里克：493 攻陷拉文纳建东哥特王国，亲卫为征服主力
    xigete: { name: '卡斯蒂骑士', tier: 3 },          // 托莱多·阿方索六世：1085 收复托莱多，卡斯蒂利亚骑士为收复失地核心
    weijing_york: { name: '丹法盾墙', tier: 3 },      // 约克·血斧埃里克：丹法区约维克戍军；避势力「约维克」叠字
    nuosi: { name: '维京狂战士', tier: 3 },           // 乌普萨拉·奥拉夫：诺斯狂暴战士（DE 狂战士 Berserk）
    danmai: { name: '丹斧兵', tier: 3 },              // 哥本哈根·阿布萨隆（名将亲兵，维京战斧）

    // ── T4 存在之兵 ──
    ruidian_yota: { name: '卡尔马盟', tier: 4 },      // 哥德堡·卡尔九世：卡尔马战争可考
};
