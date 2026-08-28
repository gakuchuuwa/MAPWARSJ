/**
 * 名城奇观的真实地理坐标（素材目录名 -> 真实位置）。
 *
 * [2026-08-27 主人 haversine 全量测距] 名城奇观原先走「挂在城市坐标」路线（CITY_WONDER 只存 cityId→素材，
 *   渲染时直接取那座城的 lat/lng），导致「按文明代表城挂靠」的奇观大批跨区错位。
 *   本表把错位奇观按史实真实位置独立摆放；未列出的奇观（本来就在正确城 / 同城近郊 <22km）仍挂城市坐标。
 *   渲染处：MonumentLayer 取 WONDER_COORD[asset] 的坐标，否则回退城市坐标。
 *   注意：cityId 仍保留（用于 zoom13 守方地标 + 势力归属），仅战略地图摆放坐标独立。
 *
 * 🔴 禁止为以下对象添加“考据式”独立坐标：
 *   - EAST_WONDER_HUNS：虚构凯旋门废墟，留在塞格德；不是罗马君士坦丁凯旋门。
 *   - ASIA_WONDER_MONGOLS：移动的成吉思汗大帐，随成吉思汗据点哈拉和林；不是固定的阿瓦尔嘎遗址。
 *   - SCEN_SPHINX 不在本表：它是希腊底比斯神话斯芬克斯，不是吉萨狮身人面像。
 *   身份或地点不确定时保留现状，禁止根据外形、名称相似或个人推测擅自改址。
 */
export const WONDER_COORD: Record<string, { lat: number; lng: number; place: string }> = {
    // ── 明显错位（>120km） ──
    'CEAS_WONDER_TATARS': { lat: 39.675, lng: 66.994, place: '撒马尔罕' },        // 乌鲁格别克天文台
    'INDI_WONDER_INDIANS': { lat: 10.782, lng: 79.132, place: '坦贾武尔' },        // 布里哈迪斯瓦拉神庙
    'PURU_WONDER_PURU': { lat: 23.583, lng: 72.133, place: '莫德拉' },             // 莫德拉太阳神庙（环水圣池水殿）
    'EAST_WONDER_GOTHS': { lat: 44.425, lng: 12.209, place: '拉文纳' },            // 狄奥多里克陵墓
    'SEAS_WONDER_MALAY': { lat: -7.756, lng: 110.445, place: '日惹' },             // 卡拉桑神庙
    'ASIA_WONDER_JURCHENS': { lat: 40.322, lng: 116.321, place: '昌平银山' },       // 银山塔林（法华禅寺金代墓塔群，延寿镇银山山谷）
    'ORIE_WONDER_PERSIANS': { lat: 33.094, lng: 44.581, place: '泰西封' },         // 泰西封巨拱
    'ASIA_WONDER_KHITANS': { lat: 39.565, lng: 113.190, place: '应县' },           // 佛宫寺释迦塔
    'ASIA_WONDER_KOREANS': { lat: 35.838, lng: 129.212, place: '庆州' },           // 皇龙寺九层木塔
    'MEDI_WONDER_SPANISH': { lat: 37.382, lng: -5.996, place: '塞维利亚' },        // 黄金塔
    'ASIA_WONDER_WU': { lat: 31.229, lng: 121.473, place: '上海' },                // 静安寺
    'THRACIAN_WONDER_THRACIANS': { lat: 43.745, lng: 26.766, place: '伊斯佩里赫' }, // 斯韦什塔里色雷斯古墓
    // ── 近距（30–120km，同区但不同地） ──
    'MESO_WONDER_INCAS': { lat: -13.163, lng: -72.545, place: '马丘比丘' },        // 拴日石
    'GREEK_WONDER_MACEDONIANS': { lat: 40.486, lng: 22.318, place: '韦尔吉纳' },   // 韦尔吉纳王陵
    'ASIA_WONDER_WEI': { lat: 34.5016, lng: 113.0159, place: '登封' },             // 嵩岳寺塔（北魏密檐砖塔，太室山南麓嵩岳寺）
    'ASIA_WONDER_JAPANESE': { lat: 34.689, lng: 135.840, place: '奈良' },          // 东大寺大佛殿
};
