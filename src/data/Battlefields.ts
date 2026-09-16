/**
 * 战场表 —— 🔴 [2026-09-12 主人定] 战场**独立于据点体系**，不是 `city_*`。
 *
 * > 主人原话：「要不然把战场独立出来，不做为据点，**就叫战场**。一个地名而已。
 * >           **类似奇观**，万一缺少武将了，可以安置一个武将，但是**不能出征**，纯属剧情需要。」
 *
 * ── 为什么独立（血训） ────────────────────────────────────────────────
 *   原先战场是 `cities_v2.ts` 里带 `battlefield: true` 的**真据点行**，后果：
 *   · 它**在 `cityManager.getCities()` 里**，于是全项目 30+ 处消费者都看得见它
 *     （AI 目标池 / 任务系统 / 行军寻路 / 复国系统 / 存档 / 军团寻路…），
 *     只能靠 `GameAppCityLoader`、`TerritorySystem`、`RecruitmentSystem`、
 *     三个审计脚本到处打补丁绕开 —— 全是「因为它混在据点里」才需要的补丁。
 *   · 还得把 `City.troops` 改成可选（为「没有兵力」），连带 6 处 `?? 0`。
 *   · 更要命的是它带着一个 `factionId`（照抄守方），AI 会把它当敌方据点；
 *     剧本 `cityUpdates` 还能给它「易主」（主人：「**战场没有主人，易什么主？**」）。
 *   → 独立后这些补丁与隐患**整类消失**：战场不进 `getCities()`，没有势力、没有兵力、
 *     不能攻占、不参与 50km 间距与四公理审计。
 *
 * ── 显示规矩（保留主人 2026-09-12 定案，只是换了载体） ─────────────────
 *   「**打完了才叫战场，没打的不叫战场**」：
 *   · **开战前**：只显示**地名**（不显示战场形态）
 *   · **打完之后**：显示战场形态（拒马／尸体／骨骸／火把…）
 *   见 `src/map/BattlefieldLayer.ts` 与 `src/events/battlefieldState.ts`。
 *
 * 🔴 [2026-09-12 主人令「**怎么战场还显示武将名字呢，删除，别乱加**」]
 *   战场标牌**只许显示地名**，不再有任何「剧情武将」名字行 —— 原先的 `storyGeneralId`
 *   字段与渲染已整段删除。剧本里的武将该出场就在剧本里出场：
 *   例如 -333 伊苏斯之战的守方主帅 = `defenderGeneralId: 'daliushi_iii'`（走野战军团，不是战场标牌）。
 */

export interface BattlefieldData {
    /** 🔴 战场 id（**不是** `city_*`，不进据点表）：`bf_` + 拼音 */
    id: string;
    /** 战场地名（一个地名而已） */
    name: string;
    /** 真实坐标。🔴 **必须与该场剧本 `fieldBattleData.location` 一字不差** */
    lat: number;
    lng: number;
    /** 哪一年的剧本打完它才上图（对应 `HistoricalEventScript` 的 `year`） */
    scriptYear: number;
    note?: string;
}

export const BATTLEFIELDS: BattlefieldData[] = [
    // ── 前 334 年 格拉尼库斯河战役（马其顿 vs 波斯） ──
    //    剧本：`HistoricalEventScript` `-334`（`type: 'field_battle'`）。
    {
        id: 'bf_gelanikusihe',
        name: '格拉尼库斯河',
        lat: 40.23,
        lng: 27.24,
        scriptYear: -334,
        note: '格拉尼库斯河战役战场（前334年5月），亚历山大亲率伙伴骑兵强渡急流击溃波斯联军；'
            + '坐标与剧本 -334 的 location 一字不差；战场无势力、无兵力、不可攻占',
    },

    // ── 前 333 年 伊苏斯战役（马其顿 vs 波斯） ──
    {
        id: 'bf_yisusi',
        name: '伊苏斯',
        lat: 36.7583,
        lng: 36.2250,
        scriptYear: -333,
        // 🔴 [2026-09-12 主人令「怎么战场还显示武将名字呢，删除，别乱加」]
        //    原先这里挂 `storyGeneralId: 'daliushi_iii'`（标牌上多印一行大流士三世）——已删除。
        //    大流士三世照旧在剧本里当主帅：`HistoricalEventScript` -333 的 `defenderGeneralId`。
        note: '伊苏斯战役战场（前333年），皮纳鲁斯河畔，亚历山大击溃大流士三世；'
            + '坐标与剧本 -333 的 location 一字不差；战场无势力、无兵力、不可攻占',
    },

    // ── 前 332 年 推罗围城战（马其顿 vs 迦南） ──
    //    剧本：`HistoricalEventScript` `-332`（`type: 'siege'` 攻城战）。
    {
        id: 'bf_tuile',
        name: '推罗',
        lat: 33.2709,
        lng: 35.1962,
        scriptYear: -332,
        note: '推罗围城战战场（前332年），亚历山大填海筑堤历时七月破城；攻城战后推罗城易主归马其顿',
    },

    // ── 前 331 年 高加米拉战役（马其顿 vs 阿契美尼德波斯） ──
    //    剧本：`HistoricalEventScript` `-331`（`type: 'field_battle'` 野战）。
    {
        id: 'bf_gaojiamila',
        name: '高加米拉',
        lat: 36.3628,
        lng: 43.2500,
        scriptYear: -331,
        note: '高加米拉战役战场（前331年10月），亚历山大斜线战术与骑兵楔形突击击溃大流士三世；宣告波斯帝国瓦解',
    },
];

/** 按 id 取战场 */
export function getBattlefield(id: string): BattlefieldData | undefined {
    return BATTLEFIELDS.find((b) => b.id === id);
}
