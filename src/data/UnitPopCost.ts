/**
 * 【兵种人口占用】共享数据模块（2026-08-18 抽出）。
 *
 * 🔴 为什么要共享：13 战斗（Scene13WarLayer）按人口折算出兵数，
 *    大地图军团编队（LegionPhalanxDrawer）按人口判「是不是大型单位、该排成一字横排」。
 *    两处必须同源——各存一份必然漂移。
 */

/**
 * 人口占用表 —— **由数据生成，别手改**：`node scratch/build_pop_cost.mjs` 重新生成后整段替换。
 *
 * 🔴 初版是三条正则猜名字（/elephant/、/chariot/、/mangonel|onager|…/），2026-08-18 迁走。
 *    迁移时对账，正则版被抓出 7 处错：
 *      · 巨弩 ballista 判成 1（漏），实为弩炮 class 55 → 3
 *      · 掷环兵 chakram_thrower 判成 3 —— 正则 `ram_` 误命中「cha**kram_t**hrower」，它是步兵 → 1
 *      · 高丽战车／胡斯战车四个判成 1（漏），它们是「车」→ 2
 *    这就是「看名字不看数据」的典型代价。
 *
 * 判据两级（缺一不可，见生成器文件头）：
 *   ① 炮/攻城/弩炮 → 按 DE unit class {13, 35, 55} → 3
 *   ② 象/车        → 按 DE **原型名**，不能按 class：**象和车的 class 都是 12（骑兵）**，class 分不开
 *   其余默认 1（步/弓/骑/弓骑/轻型火器）
 */
export const POP_COST_BY_KEY: Record<string, number> = {
    antiquity_battering_ram: 3,     // class 13（攻城器械）
    antiquity_capped_ram: 3,        // class 13（攻城器械）
    antiquity_heavy_scorpion: 3,    // class 55（类55）
    antiquity_mangonel: 3,          // class 13（攻城器械）
    antiquity_onager: 3,            // class 13（攻城器械）
    antiquity_scorpion: 3,          // class 55（类55）
    antiquity_siege_onager: 3,      // class 13（攻城器械）
    antiquity_siege_ram: 3,         // class 13（攻城器械）
    antiquity_siege_tower: 3,       // 人工指定
    ballista: 3,                    // class 55（类55）
    battering_ram: 3,               // class 13（攻城器械）
    bombard_cannon: 3,              // class 13（攻城器械）
    capped_ram: 3,                  // class 13（攻城器械）
    elite_organ_gun: 3,             // class 13（攻城器械）
    heavy_rocket_cart: 3,           // class 13（攻城器械）
    heavy_scorpion: 3,              // class 55（类55）
    helepolis: 3,                   // 人工指定
    houfnice: 3,                    // class 13（攻城器械）
    mangonel: 3,                    // class 13（攻城器械）
    mounted_trebuchet: 3,           // 人工指定
    onager: 3,                      // class 13（攻城器械）
    organ_gun: 3,                   // class 13（攻城器械）
    rocket_cart: 3,                 // class 13（攻城器械）
    scorpion: 3,                    // class 55（类55）
    siege_onager: 3,                // class 13（攻城器械）
    siege_ram: 3,                   // class 13（攻城器械）
    siege_tower: 3,                 // 人工指定
    traction_trebuchet: 3,          // class 13（攻城器械）
    armored_elephant: 2,            // 人工指定
    ballista_elephant: 2,           // DE原型 ELEBALI（象）
    battle_elephant: 2,             // DE原型 BATELE（象）
    bayinnaung_elephant: 2,         // 人工指定
    dagnajan_elephant: 2,           // 人工指定
    elephant: 3,                    // 人工指定（波斯战象 450 血，2026-09-01 2→3）
    elephant_archer: 2,             // DE原型 ELEAR（象）
    elite_armored_elephant: 2,      // 人工指定
    elite_ballista_elephant: 2,     // DE原型 EELEBALI（象）
    elite_battle_elephant: 2,       // DE原型 EBATELE（象）
    elite_elephant_archer: 2,       // 人工指定
    elite_hussite_wagon: 5,         // 人工指定
    elite_war_chariot: 3.75,           // 人工指定
    elite_war_elephant: 3,          // 人工指定（波斯战象精锐 600 血，2026-09-01 2→3）
    elite_war_wagon: 5,             // 人工指定
    hussite_wagon: 5,               // 人工指定
    porus_elephant: 2,              // 人工指定
    ratha_melee: 2,                 // 人工指定（孟加拉拉塔战车）
    ratha_ranged: 2,                // 人工指定（孟加拉拉塔战车弓）
    elite_ratha_melee: 2,           // 人工指定（孟加拉拉塔战车精锐）
    sannahya: 2,                    // 人工指定（孔雀王朝战象）
    war_chariot: 3.75,                 // 人工指定
    war_chariot_ranged: 3.75,          // 人工指定
    war_elephant: 3,                // 人工指定（波斯战象 450 血，2026-09-01 2→3）
    war_wagon: 5,                   // 人工指定
};
export function popCostOf(key: string): number {
    return POP_COST_BY_KEY[key] ?? 1;
}
