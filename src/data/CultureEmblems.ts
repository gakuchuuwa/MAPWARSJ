/**
 * 🔴 [2026-11-10 主人令] 百岁模式「文化徽章」——67 文化（60 布料融合文化符号 ＋ 7 单字旗）。
 *
 * 口径：
 *   · 汉字圈 7 文化（中原/河朔/江南/巴蜀/湖广/越南/河西）走四时代统一单字旗（华/魏/吴/蜀/荆/越/凉），见 `CULTURE_TEXT_FLAG`。
 *   · 其余 60 文化统一走 `public/culture-emblems/sprite/{file}.png`（4×6 帧、单帧 128×160；剥离底盘外框、去 UI 塑料高光、带迎风透视切变与 S10QZ 旗布褶皱光影融合）。
 *   · 与 `FACTION_EMBLEM`（势力专属纹章）分开登记：只在百岁模式「该势力此刻无在场武将」且该势力本身无专属纹章时作为据点文化兜底显示。
 */

/** 60 个非单字旗文化键 → `public/culture-emblems/sprite/{file}.png` 文件名（不含 `.png`） */
export const CULTURE_EMBLEM: Readonly<Record<string, string>> = {
    // ── 东亚 / 内亚（其余 7 文化见 CULTURE_TEXT_FLAG）──────────────────
    NORTHEAST: 'jurchens',       // 🔴 [2026-11-13 主人令] 东北（白山黑水）：白山海东青（黑水玄黑旗，万鹰之神）
    XIANBEI: 'khitans',          // 🔴 [2026-11-13 主人令] 漠南（契丹/鲜卑）：大辽金冠展翅飞凤（大辽墨青旗）
    MONGOL: 'mongols',           // 🔴 [2026-11-13 主人令] 漠北蒙古：黄金索永布（长生天苍蓝旗）
    CENTRAL_ASIA: 'tatars',      // 🔴 [2026-11-13 主人令] 中亚：帖木儿品字三金环（撒马尔罕松石天青旗）
    KOREA: 'koreans',            // 🔴 [2026-11-13 主人令] 朝鲜：三色三太极（素白神旗，红蓝黄天地人）
    JAPAN: 'japanese',           // 🔴 [2026-11-13 主人令] 日本：十六瓣金菊纹（胜色深绀蓝旗）
    // ── 南亚 / 东南亚 ─────────────────────────────────────────────
    INDIA: 'dravidians',         // 🔴 [2026-11-13 主人令] 南印/达罗毗荼：象牙白朱罗腾跃神虎（藏红花金橘旗）
    MUGHAL: 'indians',           // 🔴 [2026-11-13 主人令] 北印/印度斯坦：恒河神狮旭日金轮（深翡翠祖母绿旗）
    BENGALIS: 'bengalis',       // 🔴 [2026-11-13 主人令] 孟加拉：波罗双鹿金法轮国玺（孟加拉深靛蓝旗）
    GURJARAS: 'gurjaras',       // 🔴 [2026-11-13 主人令] 古吉拉特/瞿折罗：莫德拉太阳神轮天马（索姆纳特圣白旗）
    PURU: 'puru',                // 🔴 [2026-11-13 主人令] 旁遮普/普鲁：普鲁斯重甲战象（印度河帝王蓝旗）
    KHMER: 'khmer',              // 🔴 [2026-11-13 主人令] 高棉/湄公河：巴戎微笑圣面微右倾（高棉暗莲茜赤旗）
    MALAY: 'malay',              // 🔴 [2026-11-13 主人令] 马来/南洋群岛：满者伯夷纯金八芒太阳花（南洋深海青蓝旗）
    BURMESE: 'burmese',          // 🔴 [2026-11-13 主人令] 缅甸/伊洛瓦底：贡榜开屏纯金孔雀（贡榜圣白旗）
    // ── 西亚 / 中亚伊斯兰 ─────────────────────────────────────────
    PERSIAN: 'achaemenids',      // 🔴 [2026-11-13 主人令] 波斯/伊朗西部：纯金卡瓦神鹰金星战纛（萨珊泰尔紫红旗）
    SASANIAN: 'persians',        // 🔴 [2026-11-13 主人令] 伊朗东部/呼罗珊（阿契美尼德）：纯金法拉瓦哈万王之翼（玄铁黑旗）
    ORIE: 'saracens',            // 🔴 [2026-11-13 主人令] 近东/萨拉森：祖勒菲卡尔双刃神剑新月（萨拉森正统翠绿旗）
    TURKS: 'turks',              // 🔴 [2026-11-13 主人令] 安纳托利亚：科尼亚金双头神鹰（塞尔柱深钴青旗）
    ARMENIANS: 'armenians',      // 🔴 [2026-11-13 主人令] 亚美尼亚：巴格拉提德神狮十字架（深石榴茜红旗）
    GEORGIANS: 'georgians',      // 🔴 [2026-11-13 主人令] 格鲁吉亚：玻尔尼西五十字（雪峰素白旗，偏右微调）
    BYZANTINE: 'byzantines',     // 🔴 [2026-11-13 主人令] 拜占庭：巴列奥略纯金四B帝国十字（生于紫室深紫红旗）
    // ── 欧洲 ─────────────────────────────────────────────────────
    ROMA: 'romans',              // 🔴 [2026-11-13 主人令] 罗马（拉丁姆）：罗马神鹰闪电月桂冠（军团猩红旗）
    LATIN: 'italians',           // 🔴 [2026-11-13 主人令] 意大利半岛城邦：纯金圣马可飞天翼狮（亚得里亚海权深绀蓝旗）
    SICILIANS: 'sicilians',      // 西西里：DE sicilians 斜分红白格蓝盾芯
    FRANKS: 'franks',            // 法兰克/法兰西：DE franks 三鸢尾花
    BRITONS: 'britons',          // 不列颠/英格兰：DE britons 三金狮
    CELTS: 'celts',              // 凯尔特/苏格兰：DE celts 三旋涡纹
    GERMANIC: 'teutons',         // 日耳曼/条顿：DE teutons 黑帝国鹰
    SAXONS: 'saxons',            // 萨克森：DE saxons 白跃马
    VIKINGS: 'vikings',          // 维京：DE vikings 渡鸦纹
    DANES: 'danes',              // 丹麦：DE danes 红黑木盾渡鸦
    VARANGIANS: 'varangians',    // 瓦兰吉/罗斯：DE varangians 蓝黄旋盾
    SLAVIC: 'slavs',             // 斯拉夫/俄罗斯：DE slavs 留里克三叉戟
    POLES: 'poles',              // 波兰：DE poles 戴冠白鹰
    LITHUANIANS: 'lithuanians',  // 立陶宛：DE lithuanians 格迪米纳斯金柱
    BOHEMIANS: 'bohemians',      // 波西米亚：DE bohemians 戴冠双尾银狮
    BURGUNDIANS: 'burgundians',  // 勃艮第：DE burgundians 勃艮第锯齿斜十字
    BULGARIANS: 'bulgarians',    // 保加利亚：DE bulgarians 三头黑狮
    MAGYAR: 'magyars',           // 马扎尔/匈牙利：DE magyars 阿尔帕德红白条盾
    HUNS: 'huns',                // 🔴 [2026-11-13 主人令] 匈人/蒂萨河草原：纯金阿提拉战雕图鲁尔（阿提拉深绯红旗）
    CUMAN: 'cumans',             // 🔴 [2026-11-13 主人令] 库曼/钦察草原：天穹反曲神弓（麦秆金黄旗）
    GOTHS: 'goths',              // 哥特：DE goths 红白鹰饰
    SPANISH: 'spanish',          // 西班牙：DE spanish 卡斯蒂利亚莱昂四分盾
    PORTUGUESE: 'portuguese',    // 葡萄牙：DE portuguese 五蓝盾（Quinas）
    // ── 希腊城邦（各自一级文化，非三级 GREECE）──────────────────────
    ATHENIANS: 'athenians',      // 🔴 [2026-11-13 主人令] 雅典（阿提卡）：雅典娜猫头鹰与橄榄枝（萨拉米斯海权深绀蓝旗）
    SPARTANS: 'spartans',        // 🔴 [2026-11-13 主人令] 斯巴达（拉科尼亚）：纯金青铜圆盾大写Λ（战袍猩红旗）
    MACEDONIAN: 'macedonians',   // 🔴 [2026-11-13 主人令] 马其顿：纯金十六芒维吉纳太阳（皇家帝王深紫红旗）
    THRACIAN: 'thracians',       // 🔴 [2026-11-13 主人令] 色雷斯：佩尔塔新月神盾与西卡战刀（铁血深赭红旗）
    // ── 北非 / 撒哈拉以南 ─────────────────────────────────────────
    BERBER: 'berber',            // 柏柏尔：DE berber 柏柏尔 Yaz 纹
    ETHIOPIANS: 'ethiopians',    // 埃塞俄比亚：DE ethiopians 埃塞俄比亚金十字
    AFRICA: 'malians',           // 西非（马里）：DE malians 西非几何木盾
    // ── 美洲 ─────────────────────────────────────────────────────
    AMERICA: 'aztecs',           // 中美（阿兹特克）：DE aztecs 金新月羽穗
    MAYANS: 'mayans',            // 玛雅：DE mayans 玛雅兽首铭文
    INCA: 'inca',                // 印加：DE inca 安第斯织锦
    MUISCA: 'muisca',            // 穆伊斯卡：DE muisca 黄金头饰人像
    MAPUCHE: 'mapuche',          // 马普切：DE mapuche 金阶梯十字与八角白星
    TUPI: 'tupi',                // 图皮：DE tupi 图皮几何彩纹
    // ── 其余三级/区域文化（自绘同风格符号）─────────────────────────
    TIBET: 'tibet',              // 🔴 [2026-11-13 主人令] 青藏：八辐金宝轮（金日轮，藏绛红旗）
    WESTERN: 'western',          // 🔴 [2026-11-13 主人令] 西域：丝路双峰金驼（绿洲翡翠碧绿旗）
    GREECE: 'greece',            // 🔴 [2026-11-13 主人令] 希腊（爱琴海）：阿波罗金月桂圣火（爱琴海翡翠天青旗）
};

/** 🔴 [2026-11-10 主人令「这些还是用字更好」] 不用图案、四代统一走单字旗的 7 个文化 */
export const CULTURE_TEXT_FLAG: Readonly<Record<string, string>> = {
    CENTRAL: '华',
    WEI: '魏',
    JIANGNAN: '吴',
    BASHU: '蜀',
    HUGUANG: '荆',
    VIETNAMESE: '越',
    HEXI: '凉',
};

/** 待补画清单（已全部就绪） */
export const CULTURE_EMBLEM_PENDING: readonly string[] = [];

/** 该文化的符号文件名（无 → null，走单字旗兜底） */
export function getCultureEmblemFile(buildingStyle: string | null | undefined): string | null {
    if (!buildingStyle) return null;
    return CULTURE_EMBLEM[buildingStyle] ?? null;
}

/** 该文化符号雪碧图的完整路径（`4×6` 帧，单帧 `128×160`） */
export function getCultureEmblemPath(buildingStyle: string | null | undefined): string | null {
    const file = getCultureEmblemFile(buildingStyle);
    return file ? `/culture-emblems/sprite/${file}.png` : null;
}
