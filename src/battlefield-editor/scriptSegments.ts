/**
 * 剧本的「片 → 段 → 句」表（**只给编辑器看，不进游戏数据**）。
 *
 * 🔴 主人 2026-09-26 最终口径「**一路一句**」—— 本文件的唯一规矩：
 *    ① **结构：片 → 段 → 句**。**片** ＝ 战略区域（6 片）；**段 ＝ 一场**（一次进军：上一场落点 → 本场战场／被攻据点，共 20 段）；
 *       **句 ＝ 一条路**（路网里两站之间一条；段首那一句挂这条路起点的据点，第一句起步就念）。
 *    ② **一句最少 40 公里**：不足 40 公里的路**不算路、不播报**（军团只是走过去）——与换阵型那个 40 公里是同一个数（`Army.COLUMN_DEPLOY_KM`）。
 *    ③ **字数 ＝ 路长 ÷ 12.51 × 4.2**（每公里 0.336 字）；路再长也只算一句，超了就在**这一句内部**断成两三句短的连着念（不加据点、不拆路）。
 *    ④ **到了下一个挂点这句还没念完 → 军团就地驻足，听完再走**（`Army.setMarchHold`，每帧重按、1.5 秒自动松，不会钉死）。
 *       按 ③ 的字数写，正常正好念完到点、一秒不停；只有差几秒时才停那几秒。这是「行军与播报对得上」的保障。
 *       🔴 [2026-09-27 主人令「军团行至据点、播报没念完而停下时，改为常规阵型更好，好似在据点休息」]
 *       被按住的这几秒里军团**摆常规阵型**（`Army.updateColumnMarch`：被按住就不再走长蛇阵），松闸后下一帧自动收回长蛇继续走。
 *    ⑤ 挂点只许照**真机走过的那条路**挑（起点 ＝ 上一场落点）；挂到走不到的站上，光标一卡、整场后面全不念。
 *    ⑥ 「移动时才播报」那道闸**只许挂起、不许掐死**：军团停着 ＝ 暂停这一句，走起来接着念；行程没了（改道／入伍／关自动）才中止。
 *    ⑦ **一路一句 ＝ 一条路一屏**（2026-09-27 主人「不是说好一路一句吗。为什么字幕是分句显示？」）：
 *      这一条路的整句**一次 `speak()`**、字幕**整句一起出**，不再按句末标点／逗号切成「(1/3)(2/3)」轮播。
 *      句子内部怎么断是文案自己的事；**别在文案里写空行**（空行＝另一条路）。
 *      **编辑器按「一条路一个框」给你写**（riefingBodiesOf / ssembleBriefing）：载入时把存盘的播报按段表拆回每一条路（剥掉【据点名】挂点），存盘时再合成回原文 ——
 *      **存盘格式一个字都没改**（riefing 仍是一段字符串），改的只是录入界面。
 *    全剧量得：**6 片 / 20 段 / 133 条路（＝133 句）/ 约 8615 字**（不足 40 公里的路已剔除，不播报）。
 *
 * **本文件两张表，各管一件事（别混）：**
 *    · `SCRIPT_ROAD_SEGMENTS` —— **口径表，编辑器显示与「逐句尺子」用**：20 段，段 ＝ 一场，每段带它走过的每条路（起 → 终／公里／该写字数）。
 *    · `SCRIPT_SEGMENTS` —— **底本路标段（老粒度，31 个）**。🔴 **游戏读的是它的 `from` / `to` / `via`**：
 *      `src/events/scriptCityVisibility.ts` 用这三样认「**点名的据点**」（点名的据点无条件上图）。
 *      **改这张表 ＝ 改地图上会显示哪些城**，不是纯文档改动；要动先看那处调用。
 *
 * 🔴 沿革（血训，别再走回头路）：
 *    · 播报粒度：「按时间掐的一场一篇长播报」→（2026-09-26）「按路标分段、走到哪讲到哪」→（同日二轮）尺子由「全片总字数」换成**逐段**
 *      （一段的可用路 ＝ 它的挂点 → 下一个挂点）→（同日三轮）再细一层 **句 ＝ 一条路**，即今天的口径。
 *      **总账合格不等于对得上**：真机语义是「念着时走到下一个挂点，只把 `briefingPending` 覆盖成新段号」——
 *      一段若比自己那段路长，它会把后面的挂点一个个走过去，走过两个以上，**中间那一段整段被丢**。
 *    · 「军团驻足等播报」被主人当场否掉过一次（「**我要的是行军播报，不是驻足播报**」），随后主人第三次说清
 *      「**到了点没念完得停，不然行军和播报又对不上**」—— 现在的实现是**兜底驻足**（每帧重按、自动松），不是让军团站着等。
 *    · 「末段绝不许挂在终点那一站」：挂点在终点站时，触发那一刻只剩 15 公里（约 1.2 秒）的路，整段白写 —— 末段要挂在终点前留得住话的那一站。
 *    · 验收：`npx tsx --import ./tools/sim-preload.mjs scratch/_audit_briefing_timeline.mts`（0 丢段、迟到 ≤12 秒）、
 *      `scratch/_audit_briefing_per_leg.mts`（每句字数 vs 它那条路）、`node scratch/_probe_briefing_segments.mjs`（逐段机制是否生效）。
 *    · 片与段**不进口数据**（游戏按 `year` / `season` 自动排场次），只在底本与编辑器里成表。
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
    { id: '1-2', part: 1, partName: '巴尔干平叛与希腊整合', from: '海姆斯山战场', to: '佩利昂（战争点 02）', via: ['莱吉努斯河', '德鲁斯塔尔（多瑙河畔）', '布加勒斯特（北岸·渡河击盖塔人）', '索非亚（阿格里安人之地／派奥尼亚）'], events: [2], hasBattle: true, briefedBy: [2],
      note: '🔴 [2026-09-25 主人「既然有据点，那么就添加个途径点」] 线**北到多瑙河**：破特里巴利人于莱吉努斯河（英文维基 Battle at Lyginus River：3,000 人战死），西尔穆斯退守多瑙河中的波伊刻岛，亚历山大渡河击盖塔人，随后折返西南经阿格里安人之地／派奥尼亚进兵佩利昂。这两件事按 B 档**在播报里念**（第 2 场播报已写），不单列为一场战役；路标用库里现成据点：德鲁斯塔尔（多瑙河畔锡利斯特拉）、布加勒斯特（北岸）。' },
    { id: '1-3', part: 1, partName: '巴尔干平叛与希腊整合', from: '佩利昂', to: '佩拉（班师过冬）', via: ['佩拉', '温泉关', '底比斯（战争点 03）'], events: [3], hasBattle: true, briefedBy: [3] },

    // ── 第二片（前334–333）：4 段 / 4 场 ────────────────────────
    { id: '2-1', part: 2, partName: '小亚细亚破门与封锁海岸', from: '佩拉', to: '萨迪斯', via: ['安菲波利斯', '羊河（渡海）', '特洛伊（伊利昂祭祀）', '格拉尼库斯河战场'], events: [4], hasBattle: true, briefedBy: [4],
      note: '含战争点 03→04 之间的渡海与格拉尼库斯。特洛伊（伊利昂）是史书明记的途经地：渡赫勒斯滂后亚历山大先登岸伊利昂祭雅典娜（阿里安 I.11），与数据里的路标 city_teluoyi 同一处，故补进段表。' },
    { id: '2-2', part: 2, partName: '小亚细亚破门与封锁海岸', from: '萨迪斯', to: '哈利卡纳苏斯（战争点 06）', via: ['以弗所', '米利都（战争点 05）'], events: [5, 6], hasBattle: true, briefedBy: [5, 6] },
    { id: '2-3', part: 2, partName: '小亚细亚破门与封锁海岸', from: '哈利卡纳苏斯', to: '安卡拉（安基拉）', via: ['考诺斯', '特尔梅索斯', '克桑托斯', '帕塔拉（吕基亚）', '米拉', '法塞利斯', '克利马克斯隘道', '阿斯彭杜斯', '特梅索斯', '萨加拉索斯', '塞莱奈', '戈尔迪乌姆（过冬）'], events: [7], hasBattle: false, briefedBy: [7],
      note: '纯行军段（南岸扫荡＋内陆迂回）；由第 7 场的赶路播报念' },
    { id: '2-4', part: 2, partName: '小亚细亚破门与封锁海岸', from: '安卡拉（安基拉）', to: '伊苏斯（战争点 07）', via: ['奇里乞亚门', '塔尔苏斯'], events: [7], hasBattle: true, briefedBy: [7] },

    // ── 第三片（前332–331）：3 段 / 3 场（8、9 场 ＋ 第 10 场的埃及段）──
    { id: '3-1', part: 3, partName: '黎凡特与埃及走廊', from: '伊苏斯战场', to: '推罗（战争点 08）', via: ['阿拉杜斯', '马拉苏斯', '比布鲁斯', '西顿'], events: [8], hasBattle: true, briefedBy: [8],
      note: '史料（英文维基 Siege of Tyre (332 BC)）记伊苏斯战后沿海岸南下腓尼基：阿拉多斯、马拉苏斯、比布鲁斯、西顿以次归附，前332 年1 月自北面进围推罗。这四个地名库里都没有据点（按铁律不新建），作**线上节点**记在此；军团实际沿路网走，路标用沿海现成据点拉塔基亚 —— 拉塔基亚即古劳迪西亚、前300 年才建，故列入该场 `absentCities`（那年不上图，路照走）。' },
    { id: '3-2', part: 3, partName: '黎凡特与埃及走廊', from: '推罗（战争点 08）', to: '加沙（战争点 09）', via: [], events: [9], hasBattle: true, briefedBy: [9],   // 🔴 [2026-09-27 主人令「阿卡没用不要显示了。而且离推罗太近了」] 原来 via 写 ['阿卡']：点名的据点会无条件上图，把这座离推罗只有 42 公里的小站顶上了地图 —— 撤销点名（路照走：推罗 → 阿卡 → 加沙）
      note: '⚠️ 待主人定：史料记这一段**沿海岸南下**（托勒密伊斯 → 约帕 → 加沙，英文维基 Siege of Gaza (332 BC)），而路网实走的走线是内陆（阿音贾鲁特—耶路撒冷—加沙，273 公里／直线 208＝1.31 倍，不报警）。库里没有托勒密伊斯、约帕两座据点；要不要补一条沿海路归主人定，AI 不碰道路。' },
    { id: '3-3', part: 3, partName: '黎凡特与埃及走廊', from: '加沙', to: '亚历山大城', via: ['佩鲁西姆', '孟菲斯', '锡瓦绿洲（阿蒙神庙）'], events: [10], hasBattle: false, briefedBy: [10],
      note: '纯行军段（埃及不战而降、孟菲斯加冕法拉、尼罗河口建亚历山大城、西行锡瓦求阿蒙神谕）；由第 10 场的赶路播报念。NN 复核后划归第三片。' },

    // ── 第四片（前331–330）：4 段 / 3 场 ────────────────────────
    { id: '4-1', part: 4, partName: '波斯帝国心脏', from: '亚历山大（亚历山大城）', to: '高加米拉（战争点 10）', via: ['（回程）佩鲁西姆', '加沙', '推罗', '大马士革', '塔德莫尔', '塔普萨库斯', '埃德萨', '尼西比斯', '尼尼微'], events: [10], hasBattle: true, briefedBy: [10] },
    { id: '4-2', part: 4, partName: '波斯帝国心脏', from: '高加米拉战场', to: '乌克西亚隘口（战争点 11）', via: ['尼尼微', '亚述城', '巴比伦', '苏萨'], events: [11], hasBattle: true, briefedBy: [11] },
    { id: '4-3', part: 4, partName: '波斯帝国心脏', from: '乌克西亚隘口战场', to: '波斯门（战争点 12）', via: [], events: [12], hasBattle: true, briefedBy: [12],
      note: '无中途站：实测这一段 417 公里沿线没有任何据点（御道自乌克西亚隘口东南行，直抵波斯门），史料（阿里安 III.18）也只记自隘口东进，未记中途站。' },
    { id: '4-4', part: 4, partName: '波斯帝国心脏', from: '波斯门（战争点 12）', to: '波斯波利斯', via: [], events: [13], hasBattle: false, briefedBy: [13],
      note: '纯行军段（下扎格罗斯山进波斯波利斯：占王都、焚宫、驻留过冬 —— 史料记明的大驻留，故单断一截；旁白由第 13 场的赶路播报念）。⚠️ 途经点为空 ＝ 实测结果「无中途站」：这一段 151 公里直下，沿线没有任何据点，史料（阿里安 III.18）也只记「自隘口进抵波斯波利斯」，未记中途站 —— 故不硬填节点。' },

    // ── 第五片（前329–327）：7 段 / 3 场 ────────────────────────
    // 🔴 [2026-09-25 主人「这一段是不是太长了」→「一段一条播报」×3]
    //    原 5-1 一段 4360 公里（波斯波利斯→蓝氏城）太长，一段只有一条旁白、中间三千公里没有讲解；
    //    按史料的四个战略阶段拆成四段（追击大流士到里海门 / 东进阿里亚平叛 / 德兰吉亚那→阿拉霍西亚 / 翻兴都库什入巴克特里亚越冬），
    //    每段各有自己的旁白 —— 第 13 场的 briefing 按空行分**五段**，与 5-1…5-5 一一对应（段起点：里海门、赫拉特、坎大哈、蓝氏城）。
    { id: '5-1', part: 5, partName: '中亚与粟特平叛', from: '波斯波利斯', to: '里海门', via: ['伊斯法罕', '古尔帕耶甘', '哈马丹', '雷伊'], events: [13], hasBattle: false, briefedBy: [13],
      note: '纯行军段（北上米底取埃克巴坦那、东出里海门追大流士）；实测 1611 公里' },
    { id: '5-2', part: 5, partName: '中亚与粟特平叛', from: '里海门', to: '赫拉特', via: ['达姆甘', '白哈格', '尼沙布尔', '图斯', '泰巴德'], events: [13], hasBattle: false, briefedBy: [13],
      note: '纯行军段（出厄尔布尔士入赫尔卡尼亚、东进呼罗珊、平阿里亚之叛、筑阿利亚亚历山大城）；实测 1125 公里' },
    { id: '5-3', part: 5, partName: '中亚与粟特平叛', from: '赫拉特', to: '坎大哈', via: ['法拉', '博斯特'], events: [13], hasBattle: false, briefedBy: [13],
      note: '纯行军段（德兰吉亚那处死菲罗塔斯、南下阿拉霍西亚筑城）；实测 989 公里' },
    { id: '5-4', part: 5, partName: '中亚与粟特平叛', from: '坎大哈', to: '蓝氏城（巴克特拉，过冬）', via: ['哥疾宁', '高附', '德拉普萨卡'], events: [13], hasBattle: false, briefedBy: [13],
      note: '纯行军段（翻兴都库什入巴克特里亚、拿贝苏斯、巴克特拉过冬）；实测 635 公里' },
    { id: '5-5', part: 5, partName: '中亚与粟特平叛', from: '蓝氏城', to: '居鲁士城', via: ['撒马尔罕'], events: [13], hasBattle: true, briefedBy: [13],
      note: '渡乌浒水入粟特 → 居鲁士城围攻；实测 612 公里' },
    { id: '5-6', part: 5, partName: '中亚与粟特平叛', from: '居鲁士城', to: '锡尔河（战争点 14）', via: ['忽毡'], events: [14], hasBattle: true, briefedBy: [14] },
    { id: '5-7', part: 5, partName: '中亚与粟特平叛', from: '锡尔河战场', to: '索格狄亚那岩（战争点 15）', via: ['居鲁士城', '吉扎克', '撒马尔罕', '诺塔卡'], events: [15], hasBattle: true, briefedBy: [15] },

    // ── 第六片（前327–324）：10 段 / 5 场 ────────────────────────
    { id: '6-1', part: 6, partName: '印度远征与班师', from: '索格狄亚那岩', to: '马萨加（战争点 16）', via: ['蓝氏城', '巴米扬', '高附', '难揭'], events: [16], hasBattle: true, briefedBy: [16] },
    { id: '6-2', part: 6, partName: '印度远征与班师', from: '马萨加', to: '奥诺斯岩（战争点 17）', via: ['白沙瓦', '阿托克'], events: [17], hasBattle: true, briefedBy: [17] },
    { id: '6-3', part: 6, partName: '印度远征与班师', from: '奥诺斯岩', to: '海达斯佩斯河（战争点 18）', via: ['阿托克'], events: [18], hasBattle: true, briefedBy: [18] },
    { id: '6-4', part: 6, partName: '印度远征与班师', from: '海达斯佩斯河战场', to: '马里斯（战争点 19）', via: ['蒙格'], events: [19], hasBattle: true, briefedBy: [19] },
        { id: '6-5', part: 6, partName: '印度远征与班师', from: '马里斯', to: '普拉', via: ['帕塔拉', '兰巴基亚'], events: [20], hasBattle: false, briefedBy: [20],
      note: '纯行军段（顺印度河南下 → 帕塔拉出海献祭 → 马克兰荒漠苦旅到普拉）；由第 20 场的赶路播报念' },
    { id: '6-6', part: 6, partName: '印度远征与班师', from: '普拉', to: '卡曼尼亚', via: ['巴姆', '锡尔詹'], events: [20], hasBattle: false, briefedBy: [20],
      note: '纯行军段（贾兹穆里安洼地走廊 → 卡曼尼亚）；三路大军会师与清算' },
    { id: '6-7', part: 6, partName: '印度远征与班师', from: '卡曼尼亚', to: '波斯波利斯', via: ['锡尔詹', '帕萨尔加德'], events: [20], hasBattle: false, briefedBy: [20],
      note: '纯行军段（扎格罗斯山前走廊 → 帕萨尔加德拜谒居鲁士陵 → 波斯波利斯）' },
    { id: '6-8', part: 6, partName: '印度远征与班师', from: '波斯波利斯', to: '苏萨', via: ['波斯门'], events: [20], hasBattle: false, briefedBy: [20],
      note: '纯行军段（皇家大道西线 → 苏萨融合大典）' },
    { id: '6-9', part: 6, partName: '印度远征与班师', from: '苏萨', to: '哈马丹（埃克巴坦那）', via: ['巴比伦', '巴格达（欧皮斯一带）', '呼勒万', '伊拉姆', '纳哈万德'], events: [20], hasBattle: false, briefedBy: [20],
      note: '纯行军段（底格里斯平原北上 → 欧皮斯兵变与和解宴 → 扎格罗斯门 → 米底；赫菲斯提安之死）' },
    { id: '6-10', part: 6, partName: '印度远征与班师', from: '哈马丹（埃克巴坦那）', to: '巴比伦', via: ['科塞亚（战争点 20）'], events: [20], hasBattle: true, briefedBy: [20],
      note: '科塞亚人冬剿（第 20 场）→ 美索不达米亚 → 巴比伦（前 323 年 6 月亚历山大病死于巴比伦，全剧终）' },
];

/** 纯行军段（不打仗，但有赶路播报） */
/**
 * 编辑器口径表：**段 ＝ 一场**，每段带它走过的每条路（句 ＝ 一条路）。
 * 🔴 由 `scratch/_gen_script_segments.mts` 从**真机那条路**生成 —— 改剧本路线／加路标后请重跑，不要手改数字。
 * 用途：① 编辑器左栏按「片 → 段 → 场」显示，并报出本段「几路／多少公里／该写多少字」；
 *      ② 「赶路播报」那一栏按它做**逐句尺子**（挂点 → 该写字数 vs 现在写的）。
 */
export interface ScriptRoadSegment {
    id: string;
    part: number;
    partName: string;
    scene: number;
    title: string;
    year: number;
    season: number;
    type: string;
    from: string;
    to: string;
    km: number;
    words: number;
    roads: Array<{ from: string; to: string; road: string; km: number; words: number }>;
}

export const SCRIPT_ROAD_SEGMENTS: ScriptRoadSegment[] = [   // 🔴 由 scratch/_sync_editor_segments.mts 按「150–500 公里＋通向战场例外」从真机路重算，别手改
    { id: "段1", part: 1, partName: "巴尔干平叛与希腊整合", scene: 1, title: "海姆斯山战役", year: -335, season: 0, type: "野战", from: "佩拉", to: "⚔海姆斯山", km: 464, words: 156, roads: [{ from: "佩拉", to: "⚔海姆斯山", road: "佩拉—⚔海姆斯山", km: 464, words: 156 }] },
    { id: "段2", part: 1, partName: "巴尔干平叛与希腊整合", scene: 2, title: "佩利昂战役", year: -335, season: 1, type: "攻城战", from: "⚔海姆斯山", to: "佩利昂", km: 1144, words: 384, roads: [{ from: "⚔海姆斯山", to: "德鲁斯塔尔", road: "⚔海姆斯山—德鲁斯塔尔", km: 261, words: 87 }, { from: "德鲁斯塔尔", to: "索非亚", road: "德鲁斯塔尔—索非亚", km: 420, words: 141 }, { from: "索非亚", to: "佩利昂", road: "索非亚—佩利昂", km: 463, words: 156 }] },
    { id: "段3", part: 1, partName: "巴尔干平叛与希腊整合", scene: 3, title: "底比斯战役", year: -335, season: 2, type: "攻城战", from: "佩利昂", to: "佩拉", km: 1010, words: 338, roads: [{ from: "佩利昂", to: "佩拉", road: "佩利昂—佩拉", km: 168, words: 56 }, { from: "佩拉", to: "底比斯", road: "佩拉—底比斯", km: 421, words: 141 }, { from: "底比斯", to: "佩拉", road: "底比斯—佩拉", km: 421, words: 141 }] },
    { id: "段4", part: 2, partName: "小亚细亚破门与封锁海岸", scene: 4, title: "格拉尼库斯河战役", year: -334, season: 0, type: "野战", from: "佩拉", to: "格拉尼库斯", km: 606, words: 203, roads: [{ from: "佩拉", to: "羊河", road: "佩拉—羊河", km: 433, words: 145 }, { from: "羊河", to: "格拉尼库斯", road: "羊河—格拉尼库斯", km: 173, words: 58 }] },
    { id: "段5", part: 2, partName: "小亚细亚破门与封锁海岸", scene: 5, title: "米利都战役", year: -334, season: 1, type: "攻城战", from: "格拉尼库斯", to: "米利都", km: 445, words: 149, roads: [{ from: "格拉尼库斯", to: "斯法尔德", road: "格拉尼库斯—斯法尔德", km: 242, words: 81 }, { from: "斯法尔德", to: "米利都", road: "斯法尔德—米利都", km: 203, words: 68 }] },
    { id: "段6", part: 2, partName: "小亚细亚破门与封锁海岸", scene: 6, title: "哈利卡纳苏斯战役", year: -334, season: 2, type: "攻城战", from: "米利都", to: "哈利卡纳苏斯", km: 85, words: 28, roads: [{ from: "米利都", to: "哈利卡纳苏斯", road: "米利都—哈利卡纳苏斯", km: 85, words: 28 }] },
    { id: "段7", part: 2, partName: "小亚细亚破门与封锁海岸", scene: 7, title: "伊苏斯战役", year: -333, season: 2, type: "野战", from: "哈利卡纳苏斯", to: "⚔伊苏斯", km: 1525, words: 512, roads: [{ from: "哈利卡纳苏斯", to: "阿斯彭杜斯", road: "哈利卡纳苏斯—阿斯彭杜斯", km: 470, words: 158 }, { from: "阿斯彭杜斯", to: "戈尔迪乌姆", road: "阿斯彭杜斯—戈尔迪乌姆", km: 390, words: 131 }, { from: "戈尔迪乌姆", to: "提亚纳", road: "戈尔迪乌姆—提亚纳", km: 408, words: 137 }, { from: "提亚纳", to: "⚔伊苏斯", road: "提亚纳—⚔伊苏斯", km: 257, words: 86 }] },
    { id: "段8", part: 3, partName: "黎凡特与埃及走廊", scene: 8, title: "推罗战役", year: -332, season: 0, type: "攻城战", from: "⚔伊苏斯", to: "推罗", km: 436, words: 146, roads: [{ from: "⚔伊苏斯", to: "推罗", road: "⚔伊苏斯—推罗", km: 436, words: 146 }] },
    { id: "段9", part: 3, partName: "黎凡特与埃及走廊", scene: 9, title: "加沙战役", year: -332, season: 2, type: "攻城战", from: "推罗", to: "加沙", km: 214, words: 72, roads: [{ from: "推罗", to: "加沙", road: "推罗—加沙", km: 214, words: 72 }] },
    { id: "段10", part: 3, partName: "黎凡特与埃及走廊", scene: 10, title: "高加米拉战役", year: -331, season: 2, type: "野战", from: "加沙", to: "⚔高加米拉", km: 3816, words: 1280, roads: [{ from: "加沙", to: "孟菲斯", road: "加沙—孟菲斯", km: 427, words: 143 }, { from: "孟菲斯", to: "亚历山大", road: "孟菲斯—亚历山大", km: 233, words: 78 }, { from: "亚历山大", to: "马特鲁港", road: "亚历山大—马特鲁港", km: 284, words: 95 }, { from: "马特鲁港", to: "锡瓦绿洲", road: "马特鲁港—锡瓦绿洲", km: 301, words: 101 }, { from: "锡瓦绿洲", to: "拜哈里耶", road: "锡瓦绿洲—拜哈里耶", km: 363, words: 122 }, { from: "拜哈里耶", to: "孟菲斯", road: "拜哈里耶—孟菲斯", km: 333, words: 112 }, { from: "孟菲斯", to: "加沙", road: "孟菲斯—加沙", km: 427, words: 143 }, { from: "加沙", to: "大马士革", road: "加沙—大马士革", km: 316, words: 106 }, { from: "大马士革", to: "塔普萨库斯", road: "大马士革—塔普萨库斯", km: 469, words: 157 }, { from: "塔普萨库斯", to: "尼西比斯", road: "塔普萨库斯—尼西比斯", km: 417, words: 140 }, { from: "尼西比斯", to: "⚔高加米拉", road: "尼西比斯—⚔高加米拉", km: 246, words: 83 }] },
    { id: "段11", part: 4, partName: "波斯帝国心脏", scene: 11, title: "乌克西亚隘口战役", year: -331, season: 3, type: "野战", from: "⚔高加米拉", to: "⚔乌克西亚隘口", km: 1121, words: 376, roads: [{ from: "⚔高加米拉", to: "亚述城", road: "⚔高加米拉—亚述城", km: 156, words: 53 }, { from: "亚述城", to: "巴比伦", road: "亚述城—巴比伦", km: 383, words: 128 }, { from: "巴比伦", to: "苏萨", road: "巴比伦—苏萨", km: 480, words: 161 }, { from: "苏萨", to: "⚔乌克西亚隘口", road: "苏萨—⚔乌克西亚隘口", km: 102, words: 34 }] },
    { id: "段12", part: 4, partName: "波斯帝国心脏", scene: 12, title: "波斯门战役", year: -330, season: 0, type: "野战", from: "⚔乌克西亚隘口", to: "⚔波斯门", km: 417, words: 140, roads: [{ from: "⚔乌克西亚隘口", to: "⚔波斯门", road: "⚔乌克西亚隘口—⚔波斯门", km: 417, words: 140 }] },
    { id: "段13", part: 4, partName: "波斯帝国心脏", scene: 13, title: "亚历山大东征居鲁士城战役", year: -329, season: 1, type: "攻城战", from: "⚔波斯门", to: "居鲁士城", km: 4907, words: 1648, roads: [{ from: "⚔波斯门", to: "波斯波利斯", road: "⚔波斯门—波斯波利斯", km: 177, words: 60 }, { from: "波斯波利斯", to: "伊斯法罕", road: "波斯波利斯—伊斯法罕", km: 396, words: 133 }, { from: "伊斯法罕", to: "古尔帕耶甘", road: "伊斯法罕—古尔帕耶甘", km: 173, words: 58 }, { from: "古尔帕耶甘", to: "哈马丹", road: "古尔帕耶甘—哈马丹", km: 406, words: 136 }, { from: "哈马丹", to: "雷伊", road: "哈马丹—雷伊", km: 315, words: 106 }, { from: "雷伊", to: "达姆甘", road: "雷伊—达姆甘", km: 317, words: 106 }, { from: "达姆甘", to: "白哈格", road: "达姆甘—白哈格", km: 310, words: 104 }, { from: "白哈格", to: "图斯", road: "白哈格—图斯", km: 223, words: 75 }, { from: "图斯", to: "赫拉特", road: "图斯—赫拉特", km: 376, words: 126 }, { from: "赫拉特", to: "法拉", road: "赫拉特—法拉", km: 249, words: 84 }, { from: "法拉", to: "坎大哈", road: "法拉—坎大哈", km: 398, words: 134 }, { from: "坎大哈", to: "喀布尔", road: "坎大哈—喀布尔", km: 481, words: 161 }, { from: "喀布尔", to: "蓝氏城", road: "喀布尔—蓝氏城", km: 477, words: 160 }, { from: "蓝氏城", to: "诺塔卡", road: "蓝氏城—诺塔卡", km: 330, words: 111 }, { from: "诺塔卡", to: "居鲁士城", road: "诺塔卡—居鲁士城", km: 279, words: 94 }] },
    { id: "段14", part: 5, partName: "中亚与粟特平叛", scene: 14, title: "亚历山大东征锡尔河战役", year: -329, season: 2, type: "野战", from: "居鲁士城", to: "忽毡", km: 68, words: 23, roads: [{ from: "居鲁士城", to: "忽毡", road: "居鲁士城—忽毡", km: 68, words: 23 }] },
    { id: "段15", part: 5, partName: "中亚与粟特平叛", scene: 15, title: "亚历山大东征索格狄亚那岩战役", year: -327, season: 0, type: "攻城战", from: "忽毡", to: "索格狄亚那岩", km: 512, words: 171, roads: [{ from: "忽毡", to: "吉扎克", road: "忽毡—吉扎克", km: 195, words: 65 }, { from: "吉扎克", to: "诺塔卡", road: "吉扎克—诺塔卡", km: 165, words: 55 }, { from: "诺塔卡", to: "索格狄亚那岩", road: "诺塔卡—索格狄亚那岩", km: 152, words: 51 }] },
    { id: "段16", part: 5, partName: "中亚与粟特平叛", scene: 16, title: "亚历山大东征马萨加战役", year: -327, season: 2, type: "攻城战", from: "索格狄亚那岩", to: "马萨加", km: 1004, words: 337, roads: [{ from: "索格狄亚那岩", to: "蓝氏城", road: "索格狄亚那岩—蓝氏城", km: 177, words: 60 }, { from: "蓝氏城", to: "巴米扬", road: "蓝氏城—巴米扬", km: 352, words: 118 }, { from: "巴米扬", to: "难揭", road: "巴米扬—难揭", km: 265, words: 89 }, { from: "难揭", to: "马萨加", road: "难揭—马萨加", km: 210, words: 70 }] },
    { id: "段17", part: 6, partName: "印度远征与班师", scene: 17, title: "亚历山大东征奥诺斯岩战役", year: -326, season: 0, type: "攻城战", from: "马萨加", to: "奥诺斯岩", km: 288, words: 96, roads: [{ from: "马萨加", to: "白沙瓦", road: "马萨加—白沙瓦", km: 96, words: 32 }, { from: "白沙瓦", to: "奥诺斯岩", road: "白沙瓦—奥诺斯岩", km: 192, words: 64 }] },
    { id: "段18", part: 6, partName: "印度远征与班师", scene: 18, title: "亚历山大东征海达斯佩斯河战役", year: -326, season: 1, type: "野战", from: "奥诺斯岩", to: "⚔海达斯佩斯河", km: 326, words: 110, roads: [{ from: "奥诺斯岩", to: "⚔海达斯佩斯河", road: "奥诺斯岩—⚔海达斯佩斯河", km: 326, words: 110 }] },
    { id: "段19", part: 6, partName: "印度远征与班师", scene: 19, title: "亚历山大东征马里斯战役", year: -325, season: 0, type: "攻城战", from: "⚔海达斯佩斯河", to: "马里斯", km: 425, words: 143, roads: [{ from: "⚔海达斯佩斯河", to: "马里斯", road: "⚔海达斯佩斯河—马里斯", km: 425, words: 143 }] },
    { id: "段20", part: 6, partName: "印度远征与班师", scene: 20, title: "亚历山大东征科塞亚战役", year: -324, season: 3, type: "野战", from: "马里斯", to: "⚔科塞亚", km: 4818, words: 1618, roads: [{ from: "马里斯", to: "帕塔拉", road: "马里斯—帕塔拉", km: 804, words: 270 }, { from: "帕塔拉", to: "兰巴基亚", road: "帕塔拉—兰巴基亚", km: 320, words: 107 }, { from: "兰巴基亚", to: "普拉", road: "兰巴基亚—普拉", km: 668, words: 224 }, { from: "普拉", to: "卡曼尼亚", road: "普拉—卡曼尼亚", km: 428, words: 144 }, { from: "卡曼尼亚", to: "锡尔詹", road: "卡曼尼亚—锡尔詹", km: 258, words: 87 }, { from: "锡尔詹", to: "波斯波利斯", road: "锡尔詹—波斯波利斯", km: 334, words: 112 }, { from: "波斯波利斯", to: "苏萨", road: "波斯波利斯—苏萨", km: 695, words: 233 }, { from: "苏萨", to: "巴比伦", road: "苏萨—巴比伦", km: 480, words: 161 }, { from: "巴比伦", to: "呼勒万", road: "巴比伦—呼勒万", km: 305, words: 103 }, { from: "呼勒万", to: "哈马丹", road: "呼勒万—哈马丹", km: 297, words: 100 }, { from: "哈马丹", to: "⚔科塞亚", road: "哈马丹—⚔科塞亚", km: 229, words: 77 }] },
];

export const SCRIPT_PURE_MARCH_SEGMENTS = SCRIPT_SEGMENTS.filter((s) => !s.hasBattle);

/** 某一场落在哪些段里（一场可以横跨段，一段也可以横跨场） */
export function segmentsOfEvent(eventNo: number): ScriptSegment[] {
    return SCRIPT_SEGMENTS.filter((s) => s.events.includes(eventNo));
}

/** 某一场的播报要念哪几段 */
export function segmentsBriefedBy(eventNo: number): ScriptSegment[] {
    return SCRIPT_SEGMENTS.filter((s) => s.briefedBy.includes(eventNo));
}
