/**
 * 剧本的「片 → 段」表（**只给编辑器看，不进游戏数据**）。
 *
 * 🔴 主人 2026-09-25 定的框架：**片（战略区域）→ 段（一段征程）→ 点 ＋ 线**；
 *    片与段**不进口数据**（游戏按 `year`/`season` 自动排场次），只在底本与编辑器里成表。
 *
 * 🔴 分段尺子：**段 ＝ 上一落点 → 本落点**；落点 ＝ 战争点（一场仗）或据点；
 *    史料记明的**大驻留（集结／过冬／建城／政治休整）**再断一截。
 *    → 全剧 6 片 **31 段**、20 场；其中 **12 段**是**不打仗的纯行军段**（`hasBattle: false`）：
 *      4-4／2-3／3-3／5-1／5-2／5-3／5-4／6-5／6-6／6-7／6-8／6-9。
 *
 * 🔴 [2026-09-25 主人令「赶紧修复」] **补 `4-4` 波斯门 → 波斯波利斯**：原来 `4-3` 落在波斯门、`5-1` 却从波斯波利斯起步，
 *    「波斯门 → 波斯波利斯」（约 151 公里，下扎格罗斯山进王都、焚宫、驻留过冬）**无段覆盖** —— 按分段尺子「大驻留再断一截」补此段。
 *
 * 🔴 [2026-09-25 主人令] **31 段每一段都要有自己的背景播报**（含 12 个不打仗的纯行军段，同上列）：
 *    播报**按段写**（一段一段各写各的，字数按那一段的实测时长定），不再「一场一条盖两段」。
 *    设计统一放在最后一步做（主人定「这个一会设计」）；本表先记下这件事。
 *
 * 🔴 播报归属：**不打仗的段没有自己的事件**，它的旁白由覆盖它的那一场的「赶路播报」念
 *    （播报起步开念、念完为止），所以「段」这一列必须写清 `briefedBy` —— 免得以为那段没播报。
 *
 * NN 2026-09-25 复核后的一处修正（已采纳）：**埃及段归第三片**（`3-3`），
 * 因为第三片片名就是「黎凡特与埃及走廊」，且埃及驻留是该片的收尾；第四片因此从 4 段变 3 段。
 */

export interface ScriptSegment {
    /** 段号：`片-段`，如 `2-3` */
    id: string;
    /** 片号与片名 */
    part: number;
    partName: string;
    /** 段的起点 → 终点（中间节点按史料途经地列出） */
    from: string;
    to: string;
    /** 途经节点（线内的点，不上图、不判定） */
    via: string[];
    /** 这一段覆盖的场次号（1 起，按年份季节排序） */
    events: number[];
    /** 这一段里有没有仗（false ＝ 纯行军段） */
    hasBattle: boolean;
    /** 纯行军段的旁白由哪一场的赶路播报覆盖（有仗的段写本段所含的场） */
    briefedBy: number[];
    /** 同一条线在数据里的读法（供编辑核对） */
    note?: string;
}

export const SCRIPT_PARTS: Array<{ part: number; name: string; years: string }> = [
    { part: 1, name: '巴尔干平叛与希腊整合', years: '前335' },
    { part: 2, name: '小亚细亚破门与封锁海岸', years: '前334–333' },
    { part: 3, name: '黎凡特与埃及走廊', years: '前332–331' },
    { part: 4, name: '波斯帝国心脏', years: '前331–330' },
    { part: 5, name: '中亚与粟特平叛', years: '前329–327' },
    { part: 6, name: '印度远征与班师', years: '前327–324' },
];

export const SCRIPT_SEGMENTS: ScriptSegment[] = [
    // ── 第一片（前335）：3 段 / 3 场 ─────────────────────────────
    { id: '1-1', part: 1, partName: '巴尔干平叛与希腊整合', from: '佩拉', to: '海姆斯山（战争点 01）', via: ['菲利比', '内斯托斯河', '罗多彼山', '菲利波波利斯'], events: [1], hasBattle: true, briefedBy: [1] },
    { id: '1-2', part: 1, partName: '巴尔干平叛与希腊整合', from: '海姆斯山战场', to: '佩利昂（战争点 02）', via: ['索非亚（阿格里安人之地／派奥尼亚）'], events: [2], hasBattle: true, briefedBy: [2],
      note: '线内另含史料 B 档：破特里巴利人、皮帐作筏夜渡多瑙河' },
    { id: '1-3', part: 1, partName: '巴尔干平叛与希腊整合', from: '佩利昂', to: '底比斯（战争点 03）', via: ['佩拉', '温泉关'], events: [3], hasBattle: true, briefedBy: [3] },

    // ── 第二片（前334–333）：4 段 / 4 场 ────────────────────────
    { id: '2-1', part: 2, partName: '小亚细亚破门与封锁海岸', from: '底比斯', to: '斯法尔德', via: ['佩拉（过冬）', '安菲波利斯', '羊河（渡海）', '格拉尼库斯河战场'], events: [4], hasBattle: true, briefedBy: [4],
      note: '含战争点 03→04 之间的渡海与格拉尼库斯' },
    { id: '2-2', part: 2, partName: '小亚细亚破门与封锁海岸', from: '斯法尔德', to: '哈利卡纳苏斯（战争点 06）', via: ['以弗所', '米利都（战争点 05）'], events: [5, 6], hasBattle: true, briefedBy: [5, 6] },
    { id: '2-3', part: 2, partName: '小亚细亚破门与封锁海岸', from: '哈利卡纳苏斯', to: '安卡拉（安基拉）', via: ['考诺斯', '特尔梅索斯', '克桑托斯', '帕塔拉', '米拉', '法塞利斯', '克利马克斯隘道', '佩尔格', '特梅索斯', '萨加拉索斯', '塞莱奈', '戈尔迪乌姆（过冬）'], events: [7], hasBattle: false, briefedBy: [7],
      note: '纯行军段（南岸扫荡＋内陆迂回）；由第 7 场的赶路播报念' },
    { id: '2-4', part: 2, partName: '小亚细亚破门与封锁海岸', from: '安卡拉（安基拉）', to: '伊苏斯（战争点 07）', via: ['奇里乞亚门', '塔尔苏斯'], events: [7], hasBattle: true, briefedBy: [7] },

    // ── 第三片（前332–331）：3 段 / 3 场（8、9 场 ＋ 第 10 场的埃及段）──
    { id: '3-1', part: 3, partName: '黎凡特与埃及走廊', from: '伊苏斯战场', to: '推罗（战争点 08）', via: [], events: [8], hasBattle: true, briefedBy: [8] },
    { id: '3-2', part: 3, partName: '黎凡特与埃及走廊', from: '推罗', to: '加沙（战争点 09）', via: [], events: [9], hasBattle: true, briefedBy: [9] },
    { id: '3-3', part: 3, partName: '黎凡特与埃及走廊', from: '加沙', to: '亚历山大（亚历山大城）', via: ['佩鲁西姆', '孟菲斯'], events: [10], hasBattle: false, briefedBy: [10],
      note: '纯行军段（埃及不战而降、孟菲斯加冕、建亚历山大城）；由第 10 场的赶路播报念。NN 复核后划归第三片' },

    // ── 第四片（前331–330）：4 段 / 3 场 ────────────────────────
    { id: '4-1', part: 4, partName: '波斯帝国心脏', from: '亚历山大（亚历山大城）', to: '高加米拉（战争点 10）', via: ['（回程）佩鲁西姆', '加沙', '推罗', '大马士革', '阿勒颇', '埃德萨', '尼尼微'], events: [10], hasBattle: true, briefedBy: [10] },
    { id: '4-2', part: 4, partName: '波斯帝国心脏', from: '高加米拉战场', to: '乌克西亚隘口（战争点 11）', via: ['尼尼微', '亚述城', '巴比伦', '苏萨'], events: [11], hasBattle: true, briefedBy: [11] },
    { id: '4-3', part: 4, partName: '波斯帝国心脏', from: '乌克西亚隘口战场', to: '波斯门（战争点 12）', via: [], events: [12], hasBattle: true, briefedBy: [12] },
    { id: '4-4', part: 4, partName: '波斯帝国心脏', from: '波斯门（战争点 12）', to: '波斯波利斯', via: [], events: [13], hasBattle: false, briefedBy: [13],
      note: '纯行军段（下扎格罗斯山进波斯波利斯：占王都、焚宫、驻留过冬 —— 史料记明的大驻留，故单断一截；旁白由第 13 场的赶路播报念）' },

    // ── 第五片（前329–327）：7 段 / 3 场 ────────────────────────
    // 🔴 [2026-09-25 主人「这一段是不是太长了」→「一段一条播报」×3]
    //    原 5-1 一段 4360 公里（波斯波利斯→蓝氏城）太长，一段只有一条旁白、中间三千公里没有讲解；
    //    按史料的四个战略阶段拆成四段（追击大流士到里海门 / 东进阿里亚平叛 / 德兰吉亚那→阿拉霍西亚 / 翻兴都库什入巴克特里亚越冬），
    //    每段各有自己的旁白 —— 第 13 场的 briefing 按空行分**五段**，与 5-1…5-5 一一对应（段起点：里海门、赫拉特、坎大哈、蓝氏城）。
    { id: '5-1', part: 5, partName: '中亚与粟特平叛', from: '波斯波利斯', to: '里海门', via: ['伊斯法罕', '哈马丹', '雷伊'], events: [13], hasBattle: false, briefedBy: [13],
      note: '纯行军段（北上米底取埃克巴坦那、东出里海门追大流士）；实测 1611 公里' },
    { id: '5-2', part: 5, partName: '中亚与粟特平叛', from: '里海门', to: '赫拉特', via: ['达姆甘', '白哈格', '尼沙布尔', '图斯', '泰巴德'], events: [13], hasBattle: false, briefedBy: [13],
      note: '纯行军段（出厄尔布尔士入赫尔卡尼亚、东进呼罗珊、平阿里亚之叛、筑阿利亚亚历山大城）；实测 1125 公里' },
    { id: '5-3', part: 5, partName: '中亚与粟特平叛', from: '赫拉特', to: '坎大哈', via: ['法拉', '博斯特'], events: [13], hasBattle: false, briefedBy: [13],
      note: '纯行军段（德兰吉亚那处死菲罗塔斯、南下阿拉霍西亚筑城）；实测 989 公里' },
    { id: '5-4', part: 5, partName: '中亚与粟特平叛', from: '坎大哈', to: '蓝氏城（巴克特拉，过冬）', via: ['哥疾宁', '高附'], events: [13], hasBattle: false, briefedBy: [13],
      note: '纯行军段（翻兴都库什入巴克特里亚、拿贝苏斯、巴克特拉过冬）；实测 635 公里' },
    { id: '5-5', part: 5, partName: '中亚与粟特平叛', from: '蓝氏城', to: '居鲁士城', via: ['撒马尔罕'], events: [13], hasBattle: true, briefedBy: [13],
      note: '渡乌浒水入粟特 → 居鲁士城围攻；实测 612 公里' },
    { id: '5-6', part: 5, partName: '中亚与粟特平叛', from: '居鲁士城', to: '锡尔河（战争点 14）', via: ['忽毡'], events: [14], hasBattle: true, briefedBy: [14] },
    { id: '5-7', part: 5, partName: '中亚与粟特平叛', from: '锡尔河战场', to: '索格狄亚那岩（战争点 15）', via: ['撒马尔罕', '阿母城', '撒马尔罕', '忽毡'], events: [15], hasBattle: true, briefedBy: [15] },

    // ── 第六片（前327–324）：10 段 / 5 场 ────────────────────────
    { id: '6-1', part: 6, partName: '印度远征与班师', from: '索格狄亚那岩', to: '马萨加（战争点 16）', via: ['撒马尔罕', '阿母城', '蓝氏城', '巴米扬', '喀布尔', '难揭'], events: [16], hasBattle: true, briefedBy: [16] },
    { id: '6-2', part: 6, partName: '印度远征与班师', from: '马萨加', to: '奥诺斯岩（战争点 17）', via: ['白沙瓦', '阿托克'], events: [17], hasBattle: true, briefedBy: [17] },
    { id: '6-3', part: 6, partName: '印度远征与班师', from: '奥诺斯岩', to: '海达斯佩斯河（战争点 18）', via: ['阿托克'], events: [18], hasBattle: true, briefedBy: [18] },
    { id: '6-4', part: 6, partName: '印度远征与班师', from: '海达斯佩斯河战场', to: '马里斯（战争点 19）', via: ['蒙格'], events: [19], hasBattle: true, briefedBy: [19] },
        { id: '6-5', part: 6, partName: '印度远征与班师', from: '马里斯', to: '普拉', via: ['帕塔拉', '兰巴基亚'], events: [20], hasBattle: false, briefedBy: [20],
      note: '纯行军段（顺印度河南下 → 帕塔拉出海献祭 → 马克兰荒漠苦旅到普拉）；由第 20 场的赶路播报念' },
    { id: '6-6', part: 6, partName: '印度远征与班师', from: '普拉', to: '卡曼尼亚', via: [], events: [20], hasBattle: false, briefedBy: [20],
      note: '纯行军段（贾兹穆里安洼地走廊 → 卡曼尼亚）；三路大军会师与清算' },
    { id: '6-7', part: 6, partName: '印度远征与班师', from: '卡曼尼亚', to: '波斯波利斯', via: ['帕萨尔加德'], events: [20], hasBattle: false, briefedBy: [20],
      note: '纯行军段（扎格罗斯山前走廊 → 帕萨尔加德拜谒居鲁士陵 → 波斯波利斯）' },
    { id: '6-8', part: 6, partName: '印度远征与班师', from: '波斯波利斯', to: '苏萨', via: ['波斯门'], events: [20], hasBattle: false, briefedBy: [20],
      note: '纯行军段（皇家大道西线 → 苏萨融合大典）' },
    { id: '6-9', part: 6, partName: '印度远征与班师', from: '苏萨', to: '哈马丹（埃克巴坦那）', via: ['巴格达（欧皮斯一带）', '呼勒万', '伊拉姆', '纳哈万德'], events: [20], hasBattle: false, briefedBy: [20],
      note: '纯行军段（底格里斯平原北上 → 欧皮斯兵变与和解宴 → 扎格罗斯门 → 米底；赫菲斯提安之死）' },
    { id: '6-10', part: 6, partName: '印度远征与班师', from: '哈马丹（埃克巴坦那）', to: '巴比伦', via: ['科塞亚（战争点 20）'], events: [20], hasBattle: true, briefedBy: [20],
      note: '科塞亚人冬剿（第 20 场）→ 美索不达米亚 → 巴比伦（前 323 年 6 月大帝陨落，全剧终）' },
];

/** 纯行军段（不打仗，但有赶路播报） */
export const SCRIPT_PURE_MARCH_SEGMENTS = SCRIPT_SEGMENTS.filter((s) => !s.hasBattle);

/** 某一场落在哪些段里（一场可以横跨段，一段也可以横跨场） */
export function segmentsOfEvent(eventNo: number): ScriptSegment[] {
    return SCRIPT_SEGMENTS.filter((s) => s.events.includes(eventNo));
}

/** 某一场的播报要念哪几段 */
export function segmentsBriefedBy(eventNo: number): ScriptSegment[] {
    return SCRIPT_SEGMENTS.filter((s) => s.briefedBy.includes(eventNo));
}
