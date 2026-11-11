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
    NORTHEAST: 'jurchens',       // 东北（肃慎/靺鞨/女真）：DE jurchens 金龙圆章
    XIANBEI: 'khitans',          // 漠南（鲜卑/契丹）：DE khitans 金凤纹
    MONGOL: 'mongols',           // 漠北蒙古：DE mongols 索永布
    CENTRAL_ASIA: 'tatars',      // 中亚：DE tatars 塔木加
    KOREA: 'koreans',            // 朝鲜：DE koreans 太极木盾芯
    JAPAN: 'japanese',           // 日本：DE japanese 十六瓣金菊纹
    // ── 南亚 / 东南亚 ─────────────────────────────────────────────
    INDIA: 'dravidians',         // 南印（达罗毗荼/朱罗）：DE dravidians 九宝珠盾饰
    MUGHAL: 'indians',           // 北印（莫卧儿）：DE indians 八角星章
    BENGALIS: 'bengalis',       // 孟加拉（波罗）：DE bengalis 吉祥纹
    GURJARAS: 'gurjaras',       // 瞿折罗：DE gurjaras 六钉铜盾芯
    PURU: 'puru',                // 旁遮普（婆罗/孔雀）：DE puru 浮雕战象章
    KHMER: 'khmer',              // 高棉（真腊）：DE khmer 巴戎佛面
    MALAY: 'malay',              // 马来（三佛齐）：DE malay 六芒花星盾芯
    BURMESE: 'burmese',          // 缅甸：DE burmese 开屏孔雀金章
    // ── 西亚 / 中亚伊斯兰 ─────────────────────────────────────────
    PERSIAN: 'achaemenids',      // 波斯（阿契美尼德）：DE achaemenids 翼狮
    SASANIAN: 'persians',        // 萨珊波斯：DE persians 西摩格神鸟
    ORIE: 'saracens',            // 阿拉伯（萨拉森）：DE saracens 八角星纹
    TURKS: 'turks',              // 突厥/奥斯曼：DE turks 星月
    ARMENIANS: 'armenians',      // 亚美尼亚：DE armenians 双十字瑞狮
    GEORGIANS: 'georgians',      // 格鲁吉亚：DE georgians 五十字
    BYZANTINE: 'byzantines',     // 拜占庭：DE byzantines 四 B 十字
    // ── 欧洲 ─────────────────────────────────────────────────────
    ROMA: 'romans',              // 罗马：DE romans 鹰徽月桂
    LATIN: 'italians',           // 意大利（拉丁）：DE italians 圣乔治红十字
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
    HUNS: 'huns',                // 匈人/草原：DE huns 红马首
    CUMAN: 'cumans',             // 库曼：DE cumans 钦察银面具
    GOTHS: 'goths',              // 哥特：DE goths 红白鹰饰
    SPANISH: 'spanish',          // 西班牙：DE spanish 卡斯蒂利亚莱昂四分盾
    PORTUGUESE: 'portuguese',    // 葡萄牙：DE portuguese 五蓝盾（Quinas）
    // ── 希腊城邦（各自一级文化，非三级 GREECE）──────────────────────
    ATHENIANS: 'athenians',      // 雅典：DE athenians 雅典娜猫头鹰与橄榄枝
    SPARTANS: 'spartans',        // 斯巴达：DE spartans Λ 纹
    MACEDONIAN: 'macedonians',   // 马其顿：DE macedonians 十六芒维吉纳太阳
    THRACIAN: 'thracians',       // 色雷斯：DE thracians 色雷斯红面盾
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
    TIBET: 'tibet',              // 青藏：藏王陵金石狮
    WESTERN: 'western',          // 西域：西域金双峰驼
    GREECE: 'greece',            // 希腊：金月桂花环与橄榄枝
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
