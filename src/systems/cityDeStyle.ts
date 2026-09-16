/**
 * 据点「DE 建筑风格」的**唯一解析源**：战略地图（TerritorySystem）与 ZOOM13 战术战场（Scene13WarLayer）共用。
 *
 * 🔴 [2026-09-11 主人「和游戏同步」] 原先两侧各有一套：
 *   · 战略地图：据点显式 buildingStyle → 区域表（本文件）
 *   · 战术战场：势力专属表 → REGION_BUILDING_STYLE → 兜底 'WEST'
 *   后果：编辑器里改建筑风格，**地图变了、战场没变**；且战场表缺 BASHU/SEAS 两区，
 *   实测 77 座据点的地图风格 ≠ 战场风格（成都等在战场上被画成西欧 WEST）。
 *   现抽成共享模块，两侧调同一个函数。
 */
import { getCityRegion, type RegionType } from './RegionSystem';

export const DE_CITY_EXPERIMENT = new Set(['city_tenochtitlan']);


export const REGION_TO_DE_STYLE: Record<RegionType, string> & Record<string, string> = {
    CENTRAL: 'ASIA', NORTH: 'ASIA', JIANGNAN: 'ASIA', BASHU: 'ASIA',
    HEXI: 'ASIA', WESTERN: 'CEAS', JAPAN: 'ASIA', KOREA: 'ASIA', NORTHEAST: 'ASIA',
    TIBET: 'PURU', // 2026-09-11 主人定：吐蕃三层建筑风格套用南亚古典 PURU 粗石红褐石墙 + TIBET_CASTLE_AGE3
    STEPPE: 'YURT', MONGOL: 'ASIA', MONGOLS: 'YURT', MOBEI_MONGOL: 'YURT', // [2026-09-16] 二级蒙古→东亚建筑+蒙古城堡；三级漠北蒙古→毡帐
    SLAVIC: 'SLAV', SLAVIC_FEUDAL: 'SLAV', SLAVIC_CASTLE: 'SLAV', SLAVIC_IMPERIAL: 'SLAV', GERMANIC: 'WEST', GERMANIC_FEUDAL: 'WEST', GERMANIC_IMPERIAL: 'WEST', GERMANIC_CASTLE: 'WEST', LATIN: 'MEDI', LATIN_CASTLE: 'MEDI', LATIN_IMPERIAL: 'MEDI',
    INDIA: 'INDI', WEST_ASIA: 'ORIE', CENTRAL_ASIA: 'CEAS',
    AFRICA: 'AFRI', BERBER: 'ORIE', MALAY: 'SEAS',
    SEAS: 'SEAS', // [2026-09-11 主人「和游戏同步」补] 该键原先两张表都没有 → region='SEAS' 的 6 座（阿瑜陀耶等）一旦没走据点显式风格就会落到西欧 WEST；东南亚该走 SEAS 套装
    AMERICA: 'MESO',
    ANDE: 'ANDE',
    PURU: 'PURU',
    ORIE: 'ORIE',
    EAST: 'EAST',
    PERSIAN: 'PERSIAN', // DE 波斯 = PERSIAN 套装（PERSIAN_WONDER_ACHAEMENIDS 阿契美尼德奇观在此）
    CUMAN: 'CEAS', // DE 库曼/鞑靼 = CEAS 套装（CEAS_WONDER_CUMANS/TATARS 在此）
    GREEK: 'GREEK', // [2026-09-08] 改回 GREEK 本套。原挂 MEDI 的理由是「greek 无 AGE3 建筑池」——
                    // 那是没提取造成的，现已补提 119 件（含 13 件 AGE3）。拜占庭奇观仍在 MEDI，不影响这里。
    THRACIAN: 'THRACIAN', // [2026-09-08] 同上，已补提 115 件（含 13 件 AGE3）。
                          // 保加利亚奇观仍在 SLAV，不影响这里。
    // ── [2026-08-29 补全→08-29 修正] 支文化/细分势力：DE 具体文明无 AGE2 素材，归到 DE 权威建筑风格
    //   （fandom Architecture set）。每个区 1 个据点。权威归属：
    //   中欧(EAST)=哥特/匈奴/条顿/维京；东欧(SLAV)=马扎尔/波西米亚/保加利亚/立陶宛/波兰；
    //   地中海(MEDI)=意大利/西西里/西班牙/葡萄牙/亚美尼亚/格鲁吉亚/雅典/斯巴达/马其顿；
    //   东亚(ASIA)=越南；东南亚(SEAS)=高棉；南美(ANDE)=马普切/穆伊斯卡/图皮；中美洲(MESO)=玛雅。
    BRITONS: 'WEST', CELTS_FEUDAL: 'WEST', BURGUNDIANS: 'WEST',
    GOTHS: 'WEST', TEUTONS: 'WEST', VIKINGS: 'WEST', HUNS: 'CEAS',
    ITALIANS: 'MEDI', SICILIANS: 'MEDI', SPANISH: 'MEDI', PORTUGUESE: 'MEDI',
    ARMENIANS: 'MEDI', GEORGIANS: 'MEDI',
    LITHUANIANS: 'SLAV', POLES: 'SLAV', BOHEMIANS: 'SLAV', BULGARIANS: 'SLAV', MAGYAR: 'SLAV',
    ACHAEMENIDS: 'PERSIAN',
    BENGALIS: 'INDI', GURJARAS: 'INDI', PORUS: 'INDI',
    BENGALIS_ANTIQUITY: 'INDI',   // 2026-09-12 古典孟加拉：与孟加拉同风格
    VIETNAMESE: 'ASIA', KHMER: 'SEAS',
    MAYANS: 'MESO',
    MAPUCHE: 'ANDE', TUPI: 'ANDE', MUISCA: 'ANDE',
    ETHIOPIANS: 'AFRI',
    BURMESE: 'SEAS',
    LATIN_FEUDAL: 'MEDI',
    WESTERN_FEUDAL: 'CEAS',
    WESTERN_CASTLE: 'CEAS',
    WESTERN_IMPERIAL: 'CEAS',
    TIBET_CASTLE: 'PURU',
    TIBET_IMPERIAL: 'PURU',
    STEPPE_IMPERIAL: 'YURT',
    STEPPE_ANTIQUITY: 'YURT',
    STEPPE_FEUDAL: 'YURT',
    JAPAN_ANTIQUITY: 'ASIA',
    JAPAN_IMPERIAL: 'ASIA',
    CENTRAL_ASIA_IMPERIAL: 'CEAS',
    CENTRAL_ASIA_ANTIQUITY: 'CEAS',
    CENTRAL_ASIA_CASTLE: 'CEAS',
    INDIA_FEUDAL: 'INDI',
    INDIA_CASTLE: 'INDI',
    INDIA_IMPERIAL: 'INDI',
    WEST_ASIA_ANTIQUITY: 'ORIE',
    WEST_ASIA_CASTLE: 'ORIE',
    NORTHAM_IMPERIAL: 'MESO',
    AFRICA_IMPERIAL: 'AFRI',
    AFRICA_ANTIQUITY: 'AFRI',
    AFRICA_CASTLE: 'AFRI',
    SEASIA_ANTIQUITY: 'SEAS',
    SEASIA_IMPERIAL: 'SEAS',
    SEASIA_CASTLE: 'SEAS',
    SEASIA_FEUDAL: 'SEAS',
    SOUTHAM_IMPERIAL: 'ANDE',
    ORIE_ANTIQUITY: 'ORIE',
    PERSIAN_CASTLE: 'PERSIAN',
    IROQUOIS: 'MESO',
    CHIMU: 'ANDE',
    TARASCAN: 'MESO',
    TAIRONA: 'ANDE',
    TEHUELCHE: 'ANDE',
    EGYPT: 'ORIE',
    CARTHAGE: 'MEDI',
    BABYLON: 'ORIE',
    HITTITES: 'ORIE',
    ASSYRIAN: 'ORIE',
    SCYTHIANS: 'CEAS',
    BYZANTINE: 'EAST',
    FRANKS: 'WEST',
    SASANIAN: 'PERSIAN',
    TURKS: 'CEAS',
    NANZHAO: 'ASIA',
    SRIVIJAYA: 'SEAS',
    KUSHAN: 'CEAS',
    KUSH: 'AFRI',
    KHITAN: 'ASIA',
    UIGHUR: 'CEAS',
    MOHE: 'ASIA',
    ANGLO_SAXON: 'WEST',
    GHANA: 'AFRI',
    KHAZARS: 'CEAS',
    VANDALS: 'WEST',
    LOMBARDS: 'WEST',
    ROURAN: 'CEAS',
    SOGDIANS: 'CEAS',
    TANGUT: 'ASIA',
    JAVANESE: 'SEAS',
    JURCHEN: 'ASIA',
    SELJUQ: 'CEAS',
    OTTOMAN: 'ORIE',
    OTTOMAN_IMPERIAL: 'ORIE',
    FRENCH: 'WEST',
    MANCHU: 'ASIA',
    MUGHAL: 'INDI',
    SAFAVID: 'PERSIAN',
    RUSSIAN: 'SLAV',
    SIKH: 'INDI',
    HEBREWS: 'ORIE',
    WUSUN: 'CEAS',
    QIANG: 'ASIA',
    YARLUNG: 'PURU', // 🔴 [2026-09-11 主人「萨噶是羌，是青藏，是吐蕃，请按历史修复」]
                     //    古典雅隆＝雅隆河谷＝吐蕃发祥地（聂赤赞普），建筑走**吐蕃三层风格**：
                     //    底座 PURU 粗石红褐石墙 + TIBET_CASTLE_AGE3 藏式金顶宗堡，与 TIBET/TIBET_CASTLE/TIBET_IMPERIAL 同档。
                     //    原先误挂 INDI（印度），萨噶成了印度建筑——历史错配，已改正。
    NABATAEANS: 'ORIE',
    HEPHTHALITES: 'CEAS',
    AINU: 'ASIA',
    PASHTUN: 'CEAS',
    SWEDISH: 'WEST',
    MACEDONIAN: 'GREEK',
    HELLENIC: 'GREEK',
    IMPERIAL_ROME: 'MEDI',
    GREEK_MERCENARY: 'GREEK',
    MAGNA_GRAECIA: 'GREEK',
    AMAZONS: 'GREEK',
    SONG: 'ASIA',
    GORYEO: 'ASIA',
    JOSEON: 'ASIA',
    GOJOSEON: 'ASIA',
    PRE_QIN: 'ASIA',
    MING: 'ASIA',
    HUAXIA_IMPERIAL: 'ASIA',
    DALI: 'ASIA',
    MAMLUKS: 'ORIE',
    CRUSADERS: 'WEST',
    RUS: 'SLAV',
    KARA_KHITAN: 'CEAS',
    TIMURID: 'CEAS',
    DELHI: 'INDI',
    CASTILE: 'MEDI',
    SCOTLAND: 'WEST',
    HRE: 'WEST',
    ALMOHAD: 'ORIE',
    SERBIA: 'SLAV',
    ILKHANATE: 'CEAS',
    ARAGON: 'MEDI',
    // ── [2026-09-16 主人定] 59 二级文明值（buildingStyle）→ 母体风格集前缀。
    //   59 文明值本身不是 DE 素材前缀（DE 只有 16 套母体素材），城墙/城镇必须回落到母体，
    //   城堡则走 resolveCastleAsset 的「代表据点→势力→文化区→分支」四层。此处补 5 个
    //   REGION_TO_DE_STYLE 里原本缺失的 59 文明 key（其余 49 个已在上方覆盖）。
    WEI: 'ASIA',        // 曹魏（华夏）
    ROMA: 'MEDI',       // 罗马（地中海）
    INCA: 'ANDE',       // 印加（安第斯）
    ATHENIANS: 'GREEK', // 雅典（希腊）
    SPARTANS: 'GREEK',  // 斯巴达（希腊）
};

/** 判断某城是否用小城/关隘/中城/大城 DE 建筑组合渲染；优先取据点显式配置的 buildingStyle，否则按区域推导，返回 DE 建筑风格前缀，否则 null。
 *  🔴 [2026-09-11 主人「和游戏同步」] 已 `export` —— 战术战场（Scene13WarLayer）必须调**同一个**函数，
 *     否则「编辑器里改建筑风格，战略地图变了、战场没变」（实测曾有 77 座地图↔战场不一致）。 */
export function resolveCityDeBuildingStyle(cityId: string, cityType: string, cityRegion: string | undefined, lat: number, lng: number, buildingStyle?: string): string | null {
    if (DE_CITY_EXPERIMENT.has(cityId)) return 'MESO'; // 实验保底（特诺奇提特兰 MESO 中城）
    // 小城/关隘/中城/大城都按建筑风格套用 DE 建筑（2026-08-27 扩充大城，帝国时代）
    const region = getCityRegion({ latitude: lat, longitude: lng, region: cityRegion });
    // 🔴 [2026-09-16 主人定] 显式 buildingStyle 优先：二级蒙古(MONGOL)套东亚建筑+蒙古城堡，
    //    三级漠北蒙古(MOBEI_MONGOL)毡帐营地（YURT），不再被 region 的 STEPPE/MONGOL 兜底强制覆盖。
    if (buildingStyle) {
        if (buildingStyle === 'YURT') return 'YURT';
        return REGION_TO_DE_STYLE[buildingStyle] ?? buildingStyle;
    }
    // 无显式 buildingStyle，按 region 兜底：草原(STEPPE*)/漠北蒙古 → YURT 毡帐营地
    // 🔴 [2026-09-16 主人「二级蒙古的建筑，大中小城采用正常的城墙」] 兜底**不再含裸 MONGOL** ——
    //    二级蒙古走东亚建筑（REGION_TO_DE_STYLE.MONGOL='ASIA'），只有 MOBEI_MONGOL（三级漠北蒙古）才是毡帐；
    //    注意 'MOBEI_MONGOL'.includes('MONGOL') 为真，所以这里必须写 MOBEI_MONGOL，不能写 MONGOL。
    if (region && (region.includes('STEPPE') || region.includes('MOBEI_MONGOL'))) return 'YURT';
    if (cityRegion && (cityRegion.includes('STEPPE') || cityRegion.includes('MOBEI_MONGOL'))) return 'YURT';
    return REGION_TO_DE_STYLE[region] ?? null;
}
