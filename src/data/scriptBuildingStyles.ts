/**
 * 🔴 [2026-09-26 主人令「你要符合历史，看看这些据点符合建筑风格吗」→「符合历史，不要问我，直接改」]
 * **剧本期据点的建筑风格**：`cities_v2` 的 `buildingStyle` 与乱斗的 `factionId` 是同一个病 —— 取的是
 * 「这座城**最有名的那段历史**」的风格（阿卡＝十字军 CRUSADERS→WEST、索非亚＝保加利亚→SLAV），
 * 放进前 335–323 年的剧本地图就是**穿越**。
 *
 * 规则（与 `scriptHistoricalOwners.ts` 同一条路子）：
 *   · 只在剧本期生效（`src/events/scriptBuildingStylesSync.ts` 按 `isScriptPeriod()` 套上／撤下），乱斗逐字不变；
 *   · 只改**建筑风格**（`buildingStyle`），不改据点名、坐标、守将、精锐、旗号；
 *   · 只列**与前 335 那一年不符**的城；本来就对的城一个不写；
 *   · 风格值取 `cityDeStyle.BASE_16_BUILDING_STYLES` 那 16 套之一（一级风格，无例外）；
 *   · 每条写史料（英文维基为准，§一.1）。
 *
 * 逐座核定（2026-09-26，剧本 80 座全核过；相符的 74 座不列）：
 *   · 索非亚：前 335 是色雷斯人的塞尔迪卡（Triballi／色雷斯地界）→ THRACIAN。
 *   · 布加勒斯特：前 335 多瑙河北岸是盖塔人（色雷斯语族）聚落 → THRACIAN。
 *   · 德鲁斯塔尔：同上，多瑙河畔的盖塔／色雷斯渡口（后世 Durostorum）→ THRACIAN。
 *   · 阿卡：前 332 是腓尼基沿海城邦 → ORIE（近东），不是十字军（12 世纪）→ WEST。
 *   · 埃德萨：前 333 是上美索不达米亚的阿拉米城 → ORIE，与十字军伯爵领无关。
 *   · 拉塔基亚：前 332 那地方是腓尼基／叙利亚海岸聚落（剧本里当比布鲁斯、西顿的替身用）→ ORIE。
 *   · 呼勒万／伊拉姆／古尔帕耶甘：扎格罗斯山地与米底的伊朗城镇，原挂 MEDI（**地中海**）套，
 *     应为 PERSIAN（波斯套）。
 */
export interface ScriptBuildingStyle {
    cityId: string;
    /** 乱斗里原本的风格（用于核对与还原） */
    meleeStyle: string;
    /** 剧本期（前 335–323）该用的风格：`BASE_16_BUILDING_STYLES` 之一 */
    scriptStyle: string;
    /** 史料出处 */
    source: string;
}

export const SCRIPT_BUILDING_STYLES: readonly ScriptBuildingStyle[] = [
    {
        cityId: 'city_sofia', meleeStyle: 'SLAV', scriptStyle: 'THRACIAN',
        source: '英文维基 Serdica / Triballi：前 4 世纪索非亚一带是色雷斯人（塞尔迪部落）的聚落，公元前29年才入罗马；'
            + '「保加利亚」是 7 世纪以后的事，SLAV 套是那一层的观感 → 前 335 用色雷斯套。',
    },
    {
        cityId: 'city_bucharest', meleeStyle: 'SLAV', scriptStyle: 'THRACIAN',
        source: '英文维基 Getae / Histria：前 4 世纪多瑙河下游北岸是盖塔人（色雷斯语族）的地界；'
            + '亚历山大公元前335年渡多瑙河击盖塔人即在北岸。SLAV 是中世纪斯拉夫套 → 前 335 用色雷斯套。',
    },
    {
        cityId: 'city_delusitaer', meleeStyle: 'SLAV', scriptStyle: 'THRACIAN',
        source: '英文维基 Durostorum / Getae：锡利斯特拉（德鲁斯塔尔）前 4 世纪为多瑙河畔盖塔／色雷斯人聚居点，'
            + '罗马军团要塞是 1 世纪之事 → 前 335 用色雷斯套。',
    },
    {
        cityId: 'city_ake', meleeStyle: 'WEST', scriptStyle: 'ORIE',
        source: '英文维基 Acre, Israel / Phoenicia：阿卡是腓尼基沿海城邦，公元前332年随腓尼基诸城归亚历山大；'
            + '乱斗挂 CRUSADERS（耶路撒冷王国，12 世纪）→ 近东套才是那一年该有的样子。',
    },
    {
        cityId: 'city_aidesa', meleeStyle: 'WEST', scriptStyle: 'ORIE',
        source: '英文维基 Edessa / Osroene：埃德萨（今乌尔法）前 4 世纪是上美索不达米亚的阿拉米城，'
            + '亚历山大东征途中经过；十字军埃德萨伯国是 1098 年的事 → 前 333 用近东套。',
    },
    {
        cityId: 'city_latajiya', meleeStyle: 'WEST', scriptStyle: 'ORIE',
        source: '英文维基 Latakia / Laodicea ad Mare：拉塔基亚为塞琉古一世约公元前300年所建（前 332 尚不存在，'
            + '剧本里只作腓尼基海岸路标用，且已列 `absentCities` 那年不上图）；'
            + '画出来也应是腓尼基／叙利亚海岸的样子，而非十字军（CRUSADERS→WEST）套。',
    },
    {
        cityId: 'city_hulewan', meleeStyle: 'MEDI', scriptStyle: 'PERSIAN',
        source: '英文维基 Hulwan / Media (region)：呼勒万是扎格罗斯山西麓的伊朗城镇（米底／埃兰一带），'
            + '阿契美尼德与后世波斯的驿道重镇；原挂 MEDI（地中海套）与史地不符 → 波斯套。',
    },
    {
        cityId: 'city_yilamu', meleeStyle: 'MEDI', scriptStyle: 'PERSIAN',
        source: '英文维基 Elam / Ilam province：伊拉姆即古埃兰之地，前 4 世纪属阿契美尼德波斯；'
            + '原挂 MEDI（地中海套）与史地不符 → 波斯套。',
    },
    {
        cityId: 'city_guerpayegan', meleeStyle: 'MEDI', scriptStyle: 'PERSIAN',
        source: '英文维基 Golpayegan / Media (region)：古尔帕耶甘在米底腹地（今伊斯法罕省西北），'
            + '阿契美尼德波斯属地；原挂 MEDI（地中海套）与史地不符 → 波斯套。',
    },
];
