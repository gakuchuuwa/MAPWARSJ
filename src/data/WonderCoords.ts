/**
 * 名城奇观的真实地理坐标（素材目录名 -> 真实位置）。
 *
 * [2026-08-27 主人 haversine 全量测距] 名城奇观原先走「挂在城市坐标」路线（CITY_WONDER 只存 cityId→素材，
 *   渲染时直接取那座城的 lat/lng），导致「按文明代表城挂靠」的奇观大批跨区错位。
 *   本表把错位奇观按史实真实位置独立摆放；未列出的奇观（本来就在正确城 / 同城近郊 <22km）仍挂城市坐标。
 *   渲染处：MonumentLayer 取 WONDER_COORD[asset] 的坐标，否则回退城市坐标。
 *   注意：cityId 仍保留（用于 zoom13 守方地标 + 势力归属），仅战略地图摆放坐标独立。
 */
export const WONDER_COORD: Record<string, { lat: number; lng: number; place: string }> = {
    // ── 明显错位（>120km） ──
    'CEAS_WONDER_TATARS': { lat: 39.675, lng: 66.994, place: '撒马尔罕' },        // 乌鲁格别克天文台
    'INDI_WONDER_INDIANS': { lat: 10.782, lng: 79.132, place: '坦贾武尔' },        // 布里哈迪斯瓦拉神庙
    'EAST_WONDER_GOTHS': { lat: 44.425, lng: 12.209, place: '拉文纳' },            // 狄奥多里克陵墓
    'ORIE_WONDER_BERBERS': { lat: 34.024, lng: -6.822, place: '拉巴特' },          // 哈桑塔
    'SEAS_WONDER_MALAY': { lat: -7.756, lng: 110.445, place: '日惹' },             // 卡拉桑神庙
    'SLAV_WONDER_SLAVS': { lat: 62.067, lng: 35.210, place: '基日岛' },            // 波戈斯特木教堂
    'ANDE_WONDER_TUPI': { lat: -25.695, lng: -54.437, place: '伊瓜苏' },           // 伊瓜苏瀑布长屋
    'ASIA_WONDER_JURCHENS': { lat: 40.217, lng: 116.229, place: '昌平' },          // 银山塔林
    'EAST_WONDER_TEUTONS': { lat: 50.402, lng: 7.253, place: '莱茵兰' },           // 玛丽亚拉赫修道院
    'ORIE_WONDER_PERSIANS': { lat: 33.094, lng: 44.581, place: '泰西封' },         // 泰西封巨拱
    'ASIA_WONDER_KHITANS': { lat: 39.565, lng: 113.190, place: '应县' },           // 佛宫寺释迦塔
    'ORIE_WONDER_SARACENS': { lat: 34.199, lng: 43.873, place: '萨迈拉' },         // 萨迈拉螺旋塔
    'ORIE_WONDER_TURKS': { lat: 41.677, lng: 26.555, place: '埃迪尔内' },          // 塞利米耶清真寺
    'CEAS_WONDER_CUMANS': { lat: 47.615, lng: 40.618, place: '顿河下游' },         // 萨尔克尔要塞
    'WEST_WONDER_BURGUNDIANS': { lat: 50.847, lng: 4.352, place: '布鲁塞尔' },     // 布鲁塞尔市政厅
    'INDI_WONDER_GURJARAS': { lat: 20.888, lng: 70.401, place: '索姆纳特' },       // 索姆纳特神庙
    'SLAV_WONDER_MAGYARS': { lat: 45.750, lng: 22.888, place: '胡内多阿拉' },      // 科文城堡
    'ASIA_WONDER_KOREANS': { lat: 35.838, lng: 129.212, place: '庆州' },           // 皇龙寺九层木塔
    'MEDI_WONDER_SPANISH': { lat: 37.382, lng: -5.996, place: '塞维利亚' },        // 黄金塔
    'SLAV_WONDER_BULGARIANS': { lat: 43.161, lng: 26.813, place: '普雷斯拉夫' },   // 普雷斯拉夫圆顶金教堂
    'ASIA_WONDER_WU': { lat: 31.229, lng: 121.473, place: '上海' },                // 静安寺
    'THRACIAN_WONDER_THRACIANS': { lat: 43.745, lng: 26.766, place: '伊斯佩里赫' }, // 斯韦什塔里色雷斯古墓
    'AFRI_WONDER_ETHIOPIANS': { lat: 12.032, lng: 39.045, place: '拉利贝拉' },     // 阿曼努尔岩石教堂
    'ANDE_WONDER_MUISCA': { lat: 5.715, lng: -72.933, place: '苏加穆西' },         // 苏加穆西太阳神殿
    'WEST_WONDER_CELTS': { lat: 52.518, lng: -7.889, place: '卡舍尔' },            // 卡舍尔之石
    // ── 近距（30–120km，同区但不同地） ──
    'INDI_WONDER_BENGALIS': { lat: 25.031, lng: 88.977, place: '巴哈尔布尔' },     // 索马普拉大寺
    'WEST_WONDER_BRITONS': { lat: 50.836, lng: -0.781, place: '奇切斯特' },        // 奇切斯特大教堂
    'WEST_WONDER_FRANKS': { lat: 48.448, lng: 1.488, place: '沙特尔' },            // 沙特尔圣母主教座堂
    'MESO_WONDER_INCAS': { lat: -13.163, lng: -72.545, place: '马丘比丘' },        // 拴日石
    'GREEK_WONDER_MACEDONIANS': { lat: 40.486, lng: 22.318, place: '韦尔吉纳' },   // 韦尔吉纳王陵
    'ASIA_WONDER_WEI': { lat: 34.506, lng: 112.943, place: '登封' },               // 嵩岳寺塔
    'ASIA_WONDER_JAPANESE': { lat: 34.689, lng: 135.840, place: '奈良' },          // 东大寺大佛殿
};
