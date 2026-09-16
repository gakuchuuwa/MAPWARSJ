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

    // ── 前 330 年 波斯门战役（马其顿 vs 阿契美尼德波斯） ──
    //    剧本：`HistoricalEventScript` `-330`（`type: 'field_battle'` 野战）。
    {
        id: 'bf_bosimen',
        name: '波斯门',
        lat: 30.7083,
        lng: 51.5986,
        scriptYear: -330,
        note: '波斯门战役战场（前330年1月），阿尔塔巴扎诺斯利用扎格罗斯山脉天险绝壁扼守；'
            + '亚历山大雪夜迂回奇袭获胜，扫清进占波斯波利斯的最后屏障',
    },

    // ── 前 329 年 锡尔河战役（马其顿 vs 斯基泰骑兵联军） ──
    //    剧本：`HistoricalEventScript` `-329`（`type: 'field_battle'` 野战）。
    {
        id: 'bf_xierhe',
        name: '锡尔河',
        lat: 40.2833,
        lng: 69.6167,
        scriptYear: -329,
        note: '锡尔河战役战场（前329年），苦盏前线锡尔河畔，亚历山大弩炮隔河火力覆盖、皮筏强渡，'
            + '设伏合围大破斯基泰骑兵联军；确立帝国东北边界',
    },

    // ── 前 328 年 索格底亚那岩山围攻战（马其顿 vs 索格底亚那起义军） ──
    //    剧本：`HistoricalEventScript` `-328`（`type: 'field_battle'` 野战）。
    {
        id: 'bf_suogediyanayanshan',
        name: '索格底亚那岩山',
        lat: 38.9667,
        lng: 67.0333,
        scriptYear: -328,
        note: '索格底亚那岩山围攻战战场（前328年冬），亚历山大选派300精锐死士雪夜攀登冰壁险峰，'
            + '奥克夏特斯不战而降；亚历山大迎娶罗克珊娜彻底平定中亚长达三年的反抗',
    },

    // ── 前 327 年 马萨加围城战（马其顿 vs 阿斯瓦卡守军） ──
    //    剧本：`HistoricalEventScript` `-327`（`type: 'field_battle'`）。
    {
        id: 'bf_masajia',
        name: '马萨加',
        lat: 34.6708,
        lng: 71.8417,
        scriptYear: -327,
        note: '马萨加围城战战场（前327年春），斯瓦特河谷查克达拉古要塞，亚历山大以攻城塔与攻城锤轰击破城，'
            + '阿萨卡诺斯阵亡后克莱奥菲斯女王率部投降；扫清进军印度通道',
    },

    // ── 前 326 年 希达斯佩斯河战役（马其顿 vs 波鲁斯王国军） ──
    //    剧本：`HistoricalEventScript` `-326`（`type: 'field_battle'` 野战）。
    {
        id: 'bf_xidasipeisihe',
        name: '希达斯佩斯河',
        lat: 32.8278,
        lng: 73.6389,
        scriptYear: -326,
        note: '希达斯佩斯河战役战场（前326年夏），亚历山大暴风雨夜强渡急流，长枪阵与骑兵两翼包抄血战力克波鲁斯战象大军；亚历山大远征四大战役收官之战',
    },

    // ── 前 325 年 马里斯城围攻战（马其顿 vs 马利联军） ──
    //    剧本：`HistoricalEventScript` `-325`（`type: 'field_battle'`）。
    {
        id: 'bf_malisi',
        name: '马里斯',
        lat: 30.1972,
        lng: 71.4750,
        scriptYear: -325,
        note: '马里斯城围攻战战场（前325年），木尔坦卫城堡垒，亚历山大登梯独入城内身负重伤（胸部中箭贯穿肺叶），马其顿大军怒破城门攻克卫城；彻底控制印度河下游',
    },

    // ── 前 324 年 科塞亚战役（马其顿 vs 科塞亚部落武装） ──
    //    剧本：`HistoricalEventScript` `-324`（`type: 'field_battle'` 野战/山地围攻）。
    {
        id: 'bf_kesaiya',
        name: '科塞亚',
        lat: 33.7500,
        lng: 47.1667,
        scriptYear: -324,
        note: '科塞亚战役战场（前324年冬），扎格罗斯山脉险峰，赫费斯提翁病逝后亚历山大分兵雪山围剿连拔数十处高山石垒；亚历山大军事生涯最后一场实战',
    },

    // ── 前 323 年 普拉塔纳斯战役（希腊反马其顿联军 vs 马其顿帝国本土守军） ──
    //    剧本：`HistoricalEventScript` `-323`（`type: 'field_battle'` 野战）。
    {
        id: 'bf_pulatanasi',
        name: '普拉塔纳斯',
        lat: 38.8083,
        lng: 22.7194,
        scriptYear: -323,
        note: '普拉塔纳斯战役战场（前323年秋），马里亚克湾沿海平原，色萨利骑兵临阵倒戈，莱奥斯塞尼斯率希腊反马其顿联军大破安提帕特；拉米亚战争首场大规模决战',
    },

    // ── 前 322 年 克兰农战役（马其顿帝国联军 vs 希腊反马其顿同盟军） ──
    //    剧本：`HistoricalEventScript` `-322`（`type: 'field_battle'` 野战）。
    {
        id: 'bf_kelannong',
        name: '克兰农',
        lat: 39.5194,
        lng: 22.3278,
        scriptYear: -322,
        note: '克兰农战役战场（前322年夏），色萨利克兰农古平原，安提帕特与克拉特罗斯以重装长矛方阵碾碎希腊步兵防线；拉米亚战争终局决战，标志古典城邦时代落幕',
    },

    // ── 前 321 年 赫勒斯滂战役（卡帕多细亚/中央军 vs 马其顿反摄政同盟军） ──
    //    剧本：`HistoricalEventScript` `-321`（`type: 'field_battle'` 野战）。
    {
        id: 'bf_helesipang',
        name: '赫勒斯滂',
        lat: 40.1500,
        lng: 26.4000,
        scriptYear: -321,
        note: '赫勒斯滂战役战场（前321年春），达达尼尔海峡南岸内陆平原，欧迈尼斯以两翼精锐重骑兵闪电突击大破克拉特罗斯老兵方阵；第一次继业者战争决战',
    },
];

/** 按 id 取战场 */
export function getBattlefield(id: string): BattlefieldData | undefined {
    return BATTLEFIELDS.find((b) => b.id === id);
}
