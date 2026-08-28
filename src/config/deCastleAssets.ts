import type { RegionType } from '../systems/RegionSystem';

/**
 * DE 城堡素材映射（FACTION_CASTLE + REGION_CASTLE）。
 * 2026-08-27 从 Scene13WarLayer.ts 迁移至此，供战略（TerritorySystem 险要）与战术（Scene13WarLayer）共用，
 * 确保 DE 的 65 个城堡素材（风格集 13 + 文明专属 52）都用上，不再让文明专属城堡闲置。
 *
 * DE 的建筑分两层，这是关键：
 *   · **风格集**（AFRI/ASIA/CEAS/EAST/INDI/MEDI/MESO/ORIE/PERSIAN/PURU/SEAS/SLAV/WEST 等）——
 *     兵营/房屋/塔/墙/门全套，按地域共用，走 REGION_TO_DE_STYLE / REGION_BUILDING_STYLE。
 *   · **文明专属城堡**（BYZA/FRAN/SHU/WU/WEI/KORE/JURC/KHIT/MONG… 共 52 个）——
 *     `public/SUCAI_BUILDING/` 里这些前缀**只有 CASTLE_AGE3**，没有别的建筑。
 * 原来城堡也写成 `${style}_CASTLE_AGE3`，于是 65 个城堡里只用到风格集那 13 个，
 * 52 个文明城堡全部闲置。改为三层选择（见 resolveCastleAsset）：
 * **势力专属 → 文化区 → 风格集默认**。
 * 值是**完整素材目录名**而不是前缀，因为阿契美尼德那张叫
 * `PERSIAN_CASTLE_ACHAEMENIDS_AGE3`，不符合 `{前缀}_CASTLE_AGE3` 的格式。
 */

export const FACTION_CASTLE: Readonly<Record<string, string>> = {
    // ── 地中海古典 ──
    baizanting: 'BYZA_CASTLE_AGE3',        // 拜占庭
    luoma_diguo: 'ROMA_CASTLE_AGE3',       // 罗马帝国
    talanduo: 'GREEK_CASTLE_AGE3',         // 大希腊（南意大利希腊殖民城邦）
    sailiugu: 'GREEK_CASTLE_AGE3',         // 塞琉古（希腊化王朝）
    maqidun: 'MACEDONIAN_CASTLE_AGE3',     // 马其顿
    seleisi: 'THRACIAN_CASTLE_AGE3',       // 色雷斯
    // ── 希腊城邦：DE 罗马复兴带了雅典/斯巴达两张专属 ──
    xila: 'ATHENIANS_CASTLE_AGE3',         // 阿提卡（雅典所在地区）
    lagoniya: 'SPARTANS_CASTLE_AGE3',      // 拉哥尼亚（斯巴达本土）
    boootiya: 'GREEK_CASTLE_AGE3',         // 波奥蒂亚（底比斯）
    yipilusi: 'GREEK_CASTLE_AGE3',         // 伊庇鲁斯
    kelite: 'GREEK_CASTLE_AGE3',           // 克里特
    luodesi: 'GREEK_CASTLE_AGE3',          // 多德卡尼斯（罗得岛）
    bitiniya: 'THRACIANS_CASTLE_AGE3',     // 比提尼亚（色雷斯人在小亚建的王国）
    gaolu_luoma: 'ROMA_CASTLE_AGE3',       // 高卢罗曼
    // ── 不列颠凯尔特系：皮克特(苏格兰) / 盖尔(爱尔兰) / 坎布里亚(威尔士) ──
    piketai: 'CELT_CASTLE_AGE3',
    gaer: 'CELT_CASTLE_AGE3',
    mangsite: 'CELT_CASTLE_AGE3',
    kanbuliya: 'CELT_CASTLE_AGE3',
    // ── 北欧维京系 ──
    nuosi: 'VIKI_CASTLE_AGE3',             // 诺斯
    weijing_york: 'VIKI_CASTLE_AGE3',      // 约维克（维京统治下的约克）
    /*
     * 🔴 [2026-08-26 更正] PURU 是一整套**南亚风格集**（45 件）：兵营是层叠飞檐的南亚建筑、
     * 奇观是圆顶塔神庙。之前只看城堡那一张就判成「西欧石堡」并配给英格兰，是错的 ——
     * 那其实是印度式石砌堡垒（拉贾斯坦那类粗石圆塔）。**判风格要看整套，别只看一张。**
     * 三个 _UP 是同一座堡的防御工事强化态；本作无城堡升级机制，分给南亚诸势力。
     */
    zhuluo: 'PURU_CASTLE_AGE3',                       // 朱罗（南印度）
    pangzha: 'PURU_CASTLE_AGE3_ATTACKUP',             // 旁遮普
    kongque: 'PURU_CASTLE_AGE3_BOTHUP',               // 孔雀帝国
    mojietuo: 'PURU_CASTLE_AGE3_DEFENSEUP',           // 摩揭陀王国
    // ── 孟加拉：波罗帝国(Pala)统治孟加拉-比哈尔，都城高达(Gauda)即孟加拉古称 ──
    boluo: 'BENG_CASTLE_AGE3',             // 波罗帝国
    sumo: 'BENG_CASTLE_AGE3',              // 苏摩国（耽摩栗底，恒河三角洲）
    luosi: 'EAST_CASTLE_AGE3',             // 罗斯（东欧风格集，DE 里罗斯就是这套）
    // ── 波斯三代：阿契美尼德有自己那张，安息/萨珊分用另两张 ──
    ailan: 'PERSIAN_CASTLE_AGE3',          // 埃兰（波斯前身，两河东南）
    aqimeinide: 'PERSIAN_CASTLE_ACHAEMENIDS_AGE3',
    ansxi: 'PERS_CASTLE_AGE3',             // 安息帝国（帕提亚）
    sashan: 'PERS_CASTLE_AGE3',            // 萨珊
    // ── 突厥系 ──
    tujue: 'TURK_CASTLE_AGE3',
    seljuq: 'TURK_CASTLE_AGE3',
    osman: 'TURK_CASTLE_AGE3',
    // ── 高加索 / 东欧 ──
    wulaertu: 'ARME_CASTLE_AGE3',          // 亚美尼亚（乌拉尔图）
    gelujiya: 'GEOR_CASTLE_AGE3',          // 格鲁吉亚
    baojialiya: 'BULG_CASTLE_AGE3',        // 保加利亚
    mazhaer: 'MAGY_CASTLE_AGE3',           // 匈牙利（马扎尔）
    xiongyati: 'MAGY_CASTLE_AGE3',          // 匈雅提（马扎尔·科文城堡）
    litaowan: 'LITH_CASTLE_AGE3',          // 立陶宛
    bolan: 'POLE_CASTLE_AGE3',             // 波兰
    boximiya: 'BOHE_CASTLE_AGE3',          // 波西米亚
    qincha: 'CUMA_CASTLE_AGE3',            // 钦察（库曼）
    xiongren: 'HUNS_CASTLE_AGE3',          // 匈人
    xiongnu: 'HUNS_CASTLE_AGE3',           // 匈奴
    // ── 西欧 ──
    donggete: 'GOTH_CASTLE_AGE3',          // 东哥特
    xigete: 'GOTH_CASTLE_AGE3',            // 西哥特
    danmai: 'VIKI_CASTLE_AGE3',            // 丹麦
    ruidian_si: 'VIKI_CASTLE_AGE3',        // 瑞典
    ruidian_yota: 'VIKI_CASTLE_AGE3',      // 约塔（瑞典哥特兰）
    falanji: 'FRAN_CASTLE_AGE3',           // 法兰克
    gaolu: 'FRAN_CASTLE_AGE3',             // 法兰西（高卢）
    bogendi: 'BURG_CASTLE_AGE3',           // 勃艮第
    xixiliwangguo: 'SICI_CASTLE_AGE3',     // 西西里王国
    xilagu: 'SICI_CASTLE_AGE3',            // 叙拉古（在西西里）
    kasidiliya: 'SPAN_CASTLE_AGE3',        // 卡斯蒂利亚
    xibanya: 'SPAN_CASTLE_AGE3',           // 西班牙
    putaoya: 'PORT_CASTLE_AGE3',           // 葡萄牙
    // ── 非洲 ──
    ethiopia: 'ETHI_CASTLE_AGE3',          // 埃塞俄比亚
    mulabite: 'BERB_CASTLE_AGE3',          // 穆拉比特（柏柏尔）
    // ── 三国：DE 罗马复兴带了蜀/吴/魏三张 ──
    shu: 'SHU_CASTLE_AGE3',
    wu: 'WU_CASTLE_AGE3',
    sunwu_d: 'WU_CASTLE_AGE3',             // 孙吴
    wei: 'WEI_CASTLE_AGE3',
    ranwei_d: 'WEI_CASTLE_AGE3',           // 冉魏
    // ── 东北亚 ──
    gaogouli: 'KORE_CASTLE_AGE3',
    xinluo: 'KORE_CASTLE_AGE3',
    baiji: 'KORE_CASTLE_AGE3',
    goryeo: 'KORE_CASTLE_AGE3',
    joseon: 'KORE_CASTLE_AGE3',
    jurchen: 'JURC_CASTLE_AGE3',
    manzhou: 'JURC_CASTLE_AGE3',
    dajin: 'JURC_CASTLE_AGE3',
    qidan: 'KHIT_CASTLE_AGE3',
    liao_d: 'KHIT_CASTLE_AGE3',
    xingliao: 'KHIT_CASTLE_AGE3',
    menggu_d: 'MONG_CASTLE_AGE3',
    yuan_d: 'MONG_CASTLE_AGE3',
    da_yuan: 'MONG_CASTLE_AGE3',
    borjigin: 'MONG_CASTLE_AGE3',
    // ── 东南亚 / 南亚 ──
    zhancheng: 'VIET_CASTLE_AGE3',         // 占城
    dayue: 'VIET_CASTLE_AGE3',             // 大越
    pagan: 'BURM_CASTLE_AGE3',             // 缅国（蒲甘）
    hantawadi: 'BURM_CASTLE_AGE3',         // 汉达瓦底
    malacca: 'MALA_CASTLE_AGE3',           // 满剌加
    deli: 'HIND_CASTLE_AGE3',              // 德里苏丹国
    gurjara: 'GURJ_CASTLE_AGE3',           // 瞿折罗
    huluo: 'GURJ_CASTLE_AGE3',             // 古尔
    // ── 美洲 ──
    inca: 'INCA_CASTLE_AGE3',
    maya: 'MAYA_CASTLE_AGE3',
    muisca: 'MUIS_CASTLE_AGE3',
    mapuche: 'MAPU_CASTLE_AGE3',
    tupi: 'TUPI_CASTLE_AGE3',
};

/**
 * 文化区级城堡（势力没配专属时用）。只在「该区有比风格集更贴切的城堡」时才列，
 * 其余留空走风格集默认（`{style}_CASTLE_AGE3`）。
 */
export const REGION_CASTLE: Partial<Record<RegionType, string>> = {
    // 中原王朝一律用中国城堡，而不是东亚通用的 ASIA_CASTLE
    CENTRAL: 'CHIN_CASTLE_AGE3',
    NORTH: 'CHIN_CASTLE_AGE3',
    JIANGNAN: 'CHIN_CASTLE_AGE3',
    LINGNAN: 'CHIN_CASTLE_AGE3',
    BASHU: 'CHIN_CASTLE_AGE3',
    HEXI: 'CHIN_CASTLE_AGE3',
    NORTHEAST: 'JURC_CASTLE_AGE3',   // 东北：女真式
    KOREA: 'KORE_CASTLE_AGE3',
    STEPPE: 'MONG_CASTLE_AGE3',      // 草原：蒙古式
    WEST_ASIA: 'PERS_CASTLE_AGE3',   // 西亚：波斯式（比 ORIE 通用更贴）
    INDIA: 'HIND_CASTLE_AGE3',
    MALAY: 'MALA_CASTLE_AGE3',
    DIANQIAN: 'VIET_CASTLE_AGE3',    // 滇黔：中南半岛式
    AMERICA: 'MAYA_CASTLE_AGE3',
    AFRICA: 'ETHI_CASTLE_AGE3',
    BERBER: 'BERB_CASTLE_AGE3',
    SLAVIC: 'SLAV_CASTLE_AGE3',
    LATIN: 'MEDI_CASTLE_AGE3',
    GERMANIC: 'WEST_CASTLE_AGE3',
};

/** 城堡素材三层选择：**势力专属 → 文化区 → 风格集默认**。 */
export function resolveCastleAsset(style: string, factionId?: string | null, region?: string | null): string {
    if (factionId) {
        const byFaction = FACTION_CASTLE[factionId];
        if (byFaction) return byFaction;
    }
    if (region) {
        const byRegion = REGION_CASTLE[region as RegionType];
        if (byRegion) return byRegion;
    }
    return `${style}_CASTLE_AGE3`;
}
