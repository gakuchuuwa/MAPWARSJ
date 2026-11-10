/**
 * 🔴 [2026-11-10 主人令「统一风格，DE 里有的就用 DE 里的」] 百岁模式「文化徽章」——67 文化 → 徽章图。
 *
 * 素材：`public/culture-emblems/<名字>.png`（104×104，DE 圆盘/盾形金边徽章原图，**未重绘、未改色**），
 * 来源 DE 安装目录 `resources\_common\wpfg\resources\civ_techtree\menu_techtree_*.png`（62 个文明）。
 * 只做「哪个文化用哪张」的登记，不复制 DE 的 random/custom/disabled/fullrandom/mirror 五张非文明图。
 *
 * 口径：
 *   · **风格统一走 DE 徽章**：DE 有的文化一律用 DE 原图（含 `chinese` 中国结、`vietnamese` 太阳纹，
 *     不因为「不是字」另画）；汉字的「魏 / 吴 / 蜀」直接用 DE `wei / wu / shu` 原图。
 *   · 与 `FACTION_EMBLEM`（势力纹章，一种只给一家）分开登记：**文化徽章允许与势力共用同一张图**
 *     （2026-11-10 主人「可以共用」），只在据点「该文化此刻没有在场势力」时显示。
 *   · DE 没有的 5 个文化（河西 / 湖广 / 吐蕃 / 西域 / 希腊）留空，等主人按同款补画后填名。
 */

/** 文化键 → `public/culture-emblems/` 下的文件名（不含 .png） */
export const CULTURE_EMBLEM: Readonly<Record<string, string>> = {
    // ── 东亚 / 内亚 ───────────────────────────────────────────────
    CENTRAL: 'chinese',        // 中原：红底金盘长结（DE 中国）
    BASHU: 'shu',              // 巴蜀：DE 三国·蜀（绿黑盾，「漢」字）
    JIANGNAN: 'wu',            // 江南：DE 三国·吴（红黑盾，「吴」字）
    WEI: 'wei',                // 河朔：DE 三国·魏（蓝黑旗形，「魏」字）
    NORTHEAST: 'jurchens',     // 东北：四色圆盘金龙（主人截图）
    XIANBEI: 'khitans',        // 漠南：契丹团龙圆盘
    MONGOL: 'mongols',         // 漠北蒙古：蓝底金月与苏鲁锭
    CENTRAL_ASIA: 'tatars',    // 中亚：白底红塔木加
    KOREA: 'koreans',          // 朝鲜：太极旗
    JAPAN: 'japanese',         // 日本：金色菊纹
    VIETNAMESE: 'vietnamese',  // 越南：蓝底金太阳纹
    // ── 南亚 / 东南亚 ─────────────────────────────────────────────
    INDIA: 'dravidians',
    MUGHAL: 'indians',
    BENGALIS: 'bengalis',
    GURJARAS: 'gurjaras',
    PURU: 'puru',
    KHMER: 'khmer',
    MALAY: 'malay',
    BURMESE: 'burmese',
    // ── 西亚 / 中亚伊斯兰 ─────────────────────────────────────────
    PERSIAN: 'achaemenids',
    SASANIAN: 'persians',
    ORIE: 'saracens',
    TURKS: 'turks',
    ARMENIANS: 'armenians',
    GEORGIANS: 'georgians',
    BYZANTINE: 'byzantines',
    // ── 欧洲 ─────────────────────────────────────────────────────
    ROMA: 'romans',
    LATIN: 'italians',
    SICILIANS: 'sicilians',
    FRANKS: 'franks',
    BRITONS: 'britons',
    CELTS: 'celts',
    GERMANIC: 'teutons',
    SAXONS: 'saxons',
    VIKINGS: 'vikings',
    DANES: 'danes',
    VARANGIANS: 'varangians',
    SLAVIC: 'slavs',
    POLES: 'poles',
    LITHUANIANS: 'lithuanians',
    BOHEMIANS: 'bohemians',
    BURGUNDIANS: 'burgundians',
    BULGARIANS: 'bulgarians',
    MAGYAR: 'magyars',
    HUNS: 'huns',
    CUMAN: 'cumans',
    GOTHS: 'goths',
    SPANISH: 'spanish',
    PORTUGUESE: 'portuguese',
    // ── 希腊城邦（各自一级文化，非三级 GREECE）──────────────────────
    ATHENIANS: 'athenians',
    SPARTANS: 'spartans',
    MACEDONIAN: 'macedonians',
    THRACIAN: 'thracians',
    // ── 北非 / 撒哈拉以南 ─────────────────────────────────────────
    BERBER: 'berber',
    ETHIOPIANS: 'ethiopians',
    AFRICA: 'malians',
    // ── 美洲 ─────────────────────────────────────────────────────
    AMERICA: 'aztecs',
    MAYANS: 'mayans',
    INCA: 'inca',
    MUISCA: 'muisca',
    MAPUCHE: 'mapuche',
    TUPI: 'tupi',
    // ── DE 无对应文明：按 DE 同款补画（2026-11-10）────────────────────
    HEXI: 'hexi',          // 河西：赭红/深褐 + 金「凉」
    TIBET: 'tibet',        // 青藏：深青/黑 + 金蹲坐石狮（吐蕃王陵石狮）
    WESTERN: 'western',    // 西域：赭褐/暗血红 + 金双峰骆驼
    GREECE: 'greece',      // 希腊：爱琴蓝/象牙白 + 回纹带、月桂与橄榄
    HUGUANG: 'huguang',    // 湖广：红/黑 + 金鸟虫篆「楚」
};

/** DE 里没有徽章、待补画的 5 个文化（验收与美术清单共用） */
export const CULTURE_EMBLEM_PENDING: readonly string[] = [
    
];

/** 该文化的徽章文件名（无 → null，显示层照旧走字旗兜底） */
export function getCultureEmblemFile(buildingStyle: string | null | undefined): string | null {
    if (!buildingStyle) return null;
    return CULTURE_EMBLEM[buildingStyle] ?? null;
}

/** 该文化徽章的完整路径（无 → null） */
export function getCultureEmblemPath(buildingStyle: string | null | undefined): string | null {
    const file = getCultureEmblemFile(buildingStyle);
    return file ? `/culture-emblems/${file}.png` : null;
}




