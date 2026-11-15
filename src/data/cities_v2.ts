/**
 * cities_v2.ts — 重构版城市数据
 *
 * 架构原则:
 * - T0 大城 (big_city): 见 AGENTS.md §五.1（2026-10-25 标准：城居人口 ≥40 万，含 40–50 万边缘）
 * - T1 中城 (medium_city): 城居人口 ≥8 万（含 8–10 万边缘）
 * - T2 关隘/要塞 (pass): 军事设施（关/隘/渡/堡/戍/镇/哨卡）＋有墙（石/砖/夯土）
 * - 周边: 日本七道、朝鲜八道、各古代政权首都 — 待补充
 *
 * 命名原则:
 * - 历史大乱斗游戏, 使用各城市最有知名度的名字
 * - 朝代切换时, 通过 historicalNames 数组 (待实现) 动态改名
 *
 * 距离约束 (来自 cities.ts / AGENTS §2.1 / §2.1.1):
 * - 全图任意两据点距离 >= 50km
 * - 新建/改坐标前 --probe：与全图任意已有城均须 >= 50km
 * - 已校验所有 T0 之间满足
 *
 * 14 区文化中心 (14 城, 见 RegionSystem.REGION_CENTERS):
 * - 开局兵力统一 troops: 10000（全部 1088 座，五种城型一视同仁；主人 2026-09-15 复述「开局所有兵力是 10000」）
 *
 * 界城 region 标准（环线锚点 vs 实际文化，详见 RegionSystem.ts REGION_BOUNDARY_LOOPS 注释）:
 * - 环线代称: 威海卫→文登、钓鱼岛城→钓鱼岛、也迷离→也迷里
 * - 哈密卫: 草原环线锚点，文化西域 WESTERN
 * - 石门关: 岭南环线锚点，文化川蜀 BASHU
 * - 尼布楚: 东北/草原共用锚点，文化东北 NORTHEAST
 * - 14 区环线主人定稿见 RegionSystem.ts REGION_BOUNDARY_LOOPS 注释（zoom=6 绘线）
 * - 威海卫/钓鱼岛城/也迷离/哈密/弓月/护密城 等代称与锚点 cityId 见该文件
 */

import { CityType } from '../types/core';

export type BuildingStyle =
    | 'ASIA'
    | 'WEST'
    | 'EAST'
    | 'SLAV'
    | 'MEDI'
    | 'ORIE'
    | 'CEAS'
    | 'INDI'
    | 'PURU'
    | 'SEAS'
    | 'MESO'
    | 'ANDE'
    | 'AFRI'
    | 'PERSIAN'
    | 'GREEK'
    | 'THRACIAN'
    /** [2026-09-11 主人「和游戏同步」补] 草原毡帐营地：TerritorySystem 一直显式支持
     *  （`buildingStyle === 'YURT'` → 毡帐营寨；deCastleAssets: YURT → MONG_CASTLE_AGE3），
     *  但联合类型里没有它 → 「游戏认、数据不认」。补上后编辑器与游戏取值一致。 */
    | 'YURT'
    /** [2026-09-16 主人定] 62 二级文明（有独特城堡）；建筑文化共 62 + 5 = 67 种（一级 16 母体是另一套据点分类，不作建筑文化）。
     *  重名 5 个（EAST/ORIE/PERSIAN/PURU/THRACIAN）已在上方母体里，此处不再重复。 */
    | 'JAPAN' | 'CENTRAL' | 'WEI' | 'JIANGNAN' | 'BASHU' | 'HEXI' | 'NORTHEAST' | 'MONGOL' | 'KOREA'
    // 🔴 [2026-09-18 主人定「每座据点都必须是一级 16 中的一种，其次必须是二级 62+3 中的一种」]
    //    补 CELTS 凯尔特：本联合类型**原先漏了它**（与 cityDeStyle.REGION_TO_DE_STYLE 漏同一项同源），
    //    于是全项目没有任何据点能写 buildingStyle='CELTS'，DE 的凯尔特城堡素材长期闲置。
    //    爱尔兰/苏格兰/威尔士 7 座已归入这一类。
    | 'CELTS'
    | 'GERMANIC' | 'FRANKS' | 'BURGUNDIANS' | 'BRITONS' | 'VIKINGS' | 'GOTHS'
    | 'BYZANTINE' | 'ARMENIANS' | 'GEORGIANS'
    | 'POLES' | 'BOHEMIANS' | 'MAGYAR' | 'SLAVIC' | 'LITHUANIANS' | 'BULGARIANS'
    | 'LATIN' | 'ROMA' | 'SICILIANS' | 'SPANISH' | 'PORTUGUESE'
    | 'HUNS' | 'CUMAN' | 'TURKS' | 'CENTRAL_ASIA'
    | 'INDIA' | 'MUGHAL' | 'BENGALIS' | 'GURJARAS'
    | 'KHMER' | 'BURMESE' | 'VIETNAMESE' | 'MALAY'
    | 'MAYANS' | 'AMERICA' | 'INCA' | 'MUISCA' | 'MAPUCHE' | 'TUPI'
    | 'BERBER' | 'AFRICA' | 'ETHIOPIANS'
    | 'SASANIAN' | 'ATHENIANS' | 'SPARTANS' | 'MACEDONIAN'
    | 'MOBEI_MONGOL'   // 漠北蒙古（三级自建毡帐营地，2026-09-16 主人定）
    /** [2026-09-18 主人定] 三级专属定制风格另两种。原先这两种据点的 buildingStyle 写的是
     *  一级底座（青藏写 PURU、西域写 CEAS），三级身份只存在于已废弃的 region 字段里 ——
     *  「region 早就取消了」，身份必须落在 buildingStyle 上，故补此两值。
     *  渲染不变：TIBET→底座 PURU + TIBET_CASTLE_AGE3；WESTERN→底座 CEAS + WESTERN_CASTLE_AGE3。 */
    | 'TIBET' | 'WESTERN'
    /** [2026-10-07 主人令「66 个建筑风格都必须有据点，按历史分配」] DE 新文明三类（二级）与三级自建两类，原先漏登记。 */
    | 'SAXONS' | 'DANES' | 'VARANGIANS' | 'XIANBEI' | 'GREECE'
    /** [2026-10-26 主人令] 新增三级文化湖广：湖北、湖南、广东、广西、福建；建筑沿用岭南城堡素材。 */
    | 'HUGUANG';

export interface CityDataV2 {
        id: string;
        name: string;
        factionId: string;
        lat: number;
        lng: number;
        type: CityType;
    /** 是否为历史海港据点（海路唯一真源与战略地图海边码头准入标志，2026-11-14 定） */
    isPort?: boolean;
    troops?: number;
    /** 城市层级: 0=大城, 1=中城, 2=要塞/关隘/渡口/港口, 4=周边 (3 暂留备扩展) */
        tier?: 0 | 1 | 2 | 4;
    /** 文化区域分类 (如 KOREA, JAPAN 等) */
    region?: string;
    /** 建筑风格 (16 种: ASIA, WEST, EAST, SLAV, MEDI, ORIE, CEAS, INDI, PURU, SEAS, MESO, ANDE, AFRI, PERSIAN, GREEK, THRACIAN) */
    buildingStyle?: BuildingStyle;
    /** 关隘/港口朝向镜像 */
    mirror?: boolean;
    /** 据点出现的游戏起始年（含）*/
    startYear?: number;
    /** 据点消失的游戏终止年（含）*/
    endYear?: number;
    /** 城寨显式固定形制（不填走六形制哈希）：square | round | octagon | rect | oval | trapezoid */
    stockadeShape?: 'square' | 'round' | 'octagon' | 'rect' | 'oval' | 'trapezoid';
    /** 城寨显式固定外围材质（不填按建筑风格匹配）：HARDWOOD | DARK | ARCHAIC | FENCE */
    stockadeFence?: 'HARDWOOD' | 'DARK' | 'ARCHAIC' | 'FENCE';
    /** 史地备注（人工录入据点时的可考性说明，运行时不使用） */
    note?: string;
    // 🔴 [2026-09-12 主人定] 这里原先有个 `battlefield?: boolean` —— 战场当时是「真据点」。
    //    主人随后改定「把战场独立出来，不做为据点，就叫战场。一个地名而已。类似奇观」，
    //    于是该字段已删：战场迁到 `src/data/Battlefields.ts`（`bf_*`）＋ `src/map/BattlefieldLayer.ts`，
    //    **不再进 `cities_v2`、不再进 `cityManager.getCities()`**。
}

// ============================================================
// T0 — 中国十大古都 (基于 2016 成都共识, 有一处替换)
// ============================================================
//
// 长安、洛阳、北京、南京、杭州、成都、汉中、番禺、汴梁、姑臧、太原、安阳、沈阳、哈拉和林、逻些
// + 外国: 梅尔夫、阿瑜陀耶、吴哥、江户、金城（新罗都）
//
// 替换说明 (郑州 → 新郑):
// - 原 2016 成都共识列入"郑州"(因郑州商城遗址)
// - 替换为"新郑": 黄帝故里 + 春秋郑国都城 + 战国韩国都城, 历史代入感更强
// - 地理上, 新郑南移 ~40km 后, 与虎牢关 / 开封 错开成"川"字形,
//   主干道线路更舒展, 减少节点拥挤
//
// 命名说明:
// - 西安 → 显示"长安" (历史游戏汉唐千年知名度)
// - 其余按现代/历史最知名名字 (北京/南京/杭州/开封/大同/新郑/安阳/成都)
//
// 距离自检:
// - 洛阳 (34.62, 112.45) ↔ 新郑 (34.39, 113.72): Δ ≈ 130 km ✓
// - 新郑 ↔ 开封: Δ ≈ 80 km  ✓
// - 新郑 ↔ 安阳: Δ ≈ 190 km ✓
// - 开封 ↔ 安阳: Δ ≈ 145 km ✓
// - 安阳 ↔ 北京: Δ ≈ 420 km ✓
// - 北京 ↔ 大同: Δ ≈ 265 km ✓
// - 长安 ↔ 洛阳: Δ ≈ 320 km ✓
// - 长安 ↔ 成都: Δ ≈ 660 km ✓
// - 洛阳 ↔ 南京: Δ ≈ 700 km ✓
// - 南京 ↔ 杭州: Δ ≈ 250 km ✓
// - 开封 ↔ 南京: Δ ≈ 500 km ✓

export const T0_CAPITALS: CityDataV2[] = [
    // ── 关中 / 西部 ──
    {
        id: 'city_changan',
        name: '长安',
        factionId: 'tang',
        lat: 34.27, lng: 108.93,
        type: 'big_city',
        region: 'CENTRAL',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        tier: 0,
        note: '[隋大兴至唐天宝盛期·夯土包砖都城郭] 唐长安外郭城84平方公里内万年、长安两在城赤县坊市常住与寄居人口峰值约70–100万（《新唐书·地理志》京兆府户籍折算及妹尾达彦《长安的都市规划》），>50万定大城。',
    },
    {
        id: 'city_chengdu',
        name: '成都',
        factionId: 'shu',
        lat: 30.5700, lng: 104.0700,
        type: 'big_city',
        region: 'BASHU',
        buildingStyle: 'BASHU',
        troops: 10000,
        tier: 0,
        note: '[晚唐前蜀至两宋·夯土包砖罗城大邑] 晚唐高骈筑罗城至前蜀、北宋盛期，成都与华阳两在城倚郭县及城外草市关厢城居峰值约40–45万（《元丰九域志》《宋史·地理志》及韩光辉考算），≥40万容差线，定大城。',
    },

    // ── 中原核心 ──
    {
        id: 'city_luoyang',
        name: '洛阳',
        factionId: 'wuzhou_d',
        lat: 34.62, lng: 112.45,
        type: 'big_city',
        region: 'CENTRAL',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        mirror: true, // 洛阳 ↔ 新郑 镜像分布
        tier: 0,
        note: '[北魏至隋唐·夯土包砖都城郭] 北魏洛阳城居峰值约50–60万（《洛阳伽蓝记》「京师户十万九千余」，合城居逾50万口），>50万定大城。' },
    
    {
        id: 'city_anyang',
        name: '安阳',
        factionId: 'shang',
        lat: 36.10, lng: 114.39,
        type: 'big_city',
        region: 'CENTRAL',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        tier: 0,
        note: '[东魏至北齐邺都期·夯土包砖双城都邑] 安阳承东魏北齐邺都（天平元年自洛阳迁四十万户营邺南城，《魏书·孝静帝纪》），邺北城与邺南城连片城居峰值约40–50万（Chandler估40万、葛剑雄《中国人口发展史》考算），≥40万容差线，定大城。',
    },

    // ── 北方 ──
    { id: 'city_hedong', name: '安邑', factionId: 'wei', lat: 35.15, lng: 111.0, type: 'small_city', troops: 10000, region: 'WEI', buildingStyle: 'WEI', note: '[战国魏国前期王都安邑（禹王城）·大城中城小城三重夯土都城郭] 魏文侯至魏惠王迁大梁前魏国国都，夏县禹王城遗址大城围合13平方公里，秦汉为河东郡治（《史记·魏世家》《汉书·地理志》），战国王都盛期城居约5–7万（未满8万中城容差线），定小城。' },
    { id: 'city_beijing', name: '北京', factionId: 'ming_d', lat: 39.9, lng: 116.41, type: 'big_city', troops: 10000, region: 'WEI', buildingStyle: 'WEI' , note: '[元大都至明万历盛期·夯土包砖京师重城] 明嘉靖增筑外城后京师内外城及关厢（宛平、大兴坊厢铺户与卫所军匠）城居峰值约80–100万（韩光辉《北京历史人口地理》考证；Chandler 1580年表70.6万），>50万定大城。' },

    { id: 'city_datong', name: '大同', factionId: 'tuoba', lat: 40.08, lng: 113.3, type: 'medium_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[北魏平城都城期·夯土包砖都城郭] 北魏太和迁洛前平城郭城约20平方公里，城居峰值约20–30万（Modelski／Morris公元500年表20万；《魏书》所谓五十万含代尹京畿八郡属县），扣除京畿属县后为20–30万，定中城。' },


    // ── 江南 ──
    {
        id: 'city_nanjing',
        name: '金陵',
        factionId: 'liusong',
        lat: 32.0500, lng: 118.7700,
        type: 'big_city',
        region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN',
        troops: 10000,
        tier: 0,
        note: '[南朝建康至明初洪武期·包砖巨石京城垣] 明洪武至永乐初应天府京城四重砖石城垣内军民匠户峰值约50–80万（《洪武京城图志》及曹树基《中国人口史·明时期》考算；南朝梁建康次峰约40万），>50万定大城。',
    },
    { id: 'city_hangzhou', name: '杭州', factionId: 'wuyue', lat: 30.25, lng: 120.16, type: 'big_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[南宋行在临安盛期·夯土包砖都城郭] 南宋咸淳年间临安城垣内及南北关厢（钱塘、仁和两赤县在城厢界）城居峰值约100–120万（潜说友《咸淳临安志》卷五十八载两赤县户391,259、口1,240,760），>50万定大城。' },


    
    { id: 'city_taiyuan', name: '晋阳', factionId: 'hou_han', lat: 37.87, lng: 112.55, type: 'medium_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[唐北都至五代北汉晋阳·夯土包砖三城重镇] 唐天宝至北汉时期晋阳西城、东城与中城（汾水两岸连城）城居峰值约15–20万（《新唐书·地理志》太原府户128,905扣除属县，晋阳、太原两赤县在城折算），>10万定中城。' },

    { id: 'city_xiangyang', name: '襄阳', factionId: 'song', lat: 32.01, lng: 112.12, type: 'small_city', troops: 10000, region: 'SONG', buildingStyle: 'CENTRAL' , note: '[南宋至明代荆襄锁钥·条石包砖江防城池] 南宋抗蒙至明万历间襄阳砖石府城（周七里余）加汉水对岸樊城关厢，常住城居峰值约5–7万（《万历襄阳府志》襄阳县坊厢户数及曹树基《中国人口史》折算），未满8万中城容差线，定小城。' },



    { id: 'city_shouxian', name: '寿春', factionId: 'dongjin', lat: 32.59, lng: 116.8, type: 'medium_city', region: 'CENTRAL', buildingStyle: 'CENTRAL', troops: 10000, tier: 1, note: '[战国末楚都至东晋南朝淮南重镇·夯土包砖城郭] 前241年楚考烈王迁都寿春及东晋南朝豫州、南梁寿阳盛期，城垣与淝水商埠峰值约10–15万（《史记·楚世家》《梁书·韦睿传》及淮南寿春城址考古测算），>10万定中城。' },
    { id: 'city_ueda', name: '上田城', factionId: 'sanada', lat: 36.4025, lng: 138.2464, type: 'pass', troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN' , note: '[安土桃山时代真田氏·千曲川断崖石垣土垒要塞城] 天正十一年（1583）真田昌幸筑上田城扼信浓东山道咽喉，1585与1600年两次合战拒德川大军（《真田家谱》），具石垣土垒且城下常住不足1万，定险要。' },

];

// ============================================================
// T1 中城 — 待添加 (省会 + 朝代府治)
// ============================================================
export const T1_MEDIUM_CITIES: CityDataV2[] = [
    // ── 蜀道沿线 (长安→成都 的中城) ──
        // ── 关中平原历史名城 ──
        { id: 'city_anding', name: '安定', factionId: 'han_d', lat: 35.327451, lng: 107.358398, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[西汉高平至隋唐泾州保定郡治安定·泾水南岸夯土包砖州郡重城] 汉安定郡、隋唐泾州彰义军节度使治所保定县（今泾川，《新唐书·地理志》泾州辖泾原防秋大军），关陇孔道军政州城与附郭坊市常住约1.5–2.5万，>1万定小城。' },

    { id: 'city_hanzhong', name: '南郑', factionId: 'han_d', lat: 33.07, lng: 107.02, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[楚汉刘邦王汉中至蜀汉唐宋兴元府治南郑·汉水北岸夯土包砖帅府城] 汉中郡治、唐山南西道节度与南宋利州西路帅府兴元府（《史记·高祖本纪》《宋史·地理志》兴元府户六万余），秦巴盆地首邑在城坊厢人口约3–5万，>1万定小城。' },


    {
        id: 'city_guozhou',
        name: '南充',
        factionId: 'shu',
        lat: 30.83, lng: 106.11,
        type: 'small_city',
        region: 'BASHU',
        buildingStyle: 'BASHU',
        troops: 10000,
        note: '[汉巴郡安汉至唐果州南宋顺庆府治南充·嘉陵江西岸条石包砖州府城] 谯周、陈寿故里汉安汉大邑，唐置果州、南宋升顺庆府、明洪武筑条石城墙周九里余（《华阳国志·巴志》《明史·地理志》），嘉陵江中游都会城居约2–3.5万，>1万定小城。',
    },
    { id: 'city_mianyang', name: '涪城', factionId: 'daxi_ming', lat: 31.482545, lng: 104.718933, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[汉蜀汉涪县至唐宋剑南东川重镇绵州·涪江安昌河汇口条石包砖州城] 建安十六年刘备入蜀会刘璋于涪城，唐宋绵州巴西郡盛产丝绸盐茶（《三国志·先主传》《元丰九域志》绵州户逾十二万），在城巴西县及江岸关厢常住约2.5–4万，>1万定小城。' },

    {
        id: 'city_chongqing',
        name: '重庆',
        factionId: 'ba',
        lat: 29.56, lng: 106.58,
        type: 'small_city',
        region: 'BASHU',
        buildingStyle: 'BASHU',
        troops: 10000,
        tier: 1,
        note: '[巴国江州至南宋重庆府明代巨镇·嘉陵长江交汇条石悬崖九开八闭十七门城垣] 南宋淳熙升重庆府、彭大雅与余玠筑巨石城墙拒蒙，明洪武戴鼎重筑十七门条石巨城（《宋史·余玠传》《明一统志》），两江水运总埠城居达4–6万，>1万定小城。' },
    {
        id: 'city_zizhou',
        name: '盘石',
        factionId: 'shu',
        lat: 29.78, lng: 104.85,
        type: 'small_city',
        region: 'BASHU',
        buildingStyle: 'BASHU',
        troops: 10000,
        note: '[汉资中牛鞞至隋唐资州资阳郡治盘石·沱江中游条石包砖盐糖州城] 隋改置盘石县为资州治（《新唐书·地理志》资州户29,635、《宋史·地理志》资州辖盘石盐井漕埠），宋明包砖石州城与水码头坊厢常住约1.5–2.5万，>1万定小城。',
    },

    // ── 崤函古道沿线 (洛阳→长安 的中城) ──

    // ── 中原北线/冀南走廊 (洛阳→安阳 的中城) ──
    // ── 幽冀古道/平原走廊 (安阳→北京 的中城) ──
    { id: 'city_handan', name: '邯郸', factionId: 'zhao', lat: 36.61, lng: 114.49, type: 'medium_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'WEI' , note: '[战国赵都全盛期·夯土王城与大北城郭] 战国中晚期赵都邯郸（赵王城加13.8平方公里大北城廓区）城居峰值约20–25万（《史记·货殖列传》《汉书·地理志》赵国邯郸及考古廓城密度测算），>10万定中城。' },




    { id: 'city_zhending', name: '真定', factionId: 'tang', lat: 38.130241, lng: 114.590149, type: 'medium_city', region: 'NORTH', buildingStyle: 'WEI', troops: 10000, note: '[唐成德藩镇至北宋河北西路帅府·夯土包砖周二十四里巨城] 唐恒州成德军镇至北宋真定府24里大城垣及关厢，崇宁至政和间城居驻军商民峰值约10–12万（《宋史·地理志》真定府户92,353在城真定县及厢军驻防折算），>10万定中城。' },
    { id: 'city_baoding', name: '保定', factionId: 'yuan_d', lat: 38.87, lng: 115.48, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[金顺天军、元张柔扩建保定路至明保定府·夯土包砖周十二里畿南大府] 元张柔规划棋盘街坊开引一亩泉入城，明洪武至隆庆包砖扩筑畿南重镇保定府城（《元史·张柔传》《万历保定府志》），府卫同城军民商贾达3.5–5万，>1万定小城。' },

    { id: 'city_hejian', name: '乐成', factionId: 'han_d', lat: 38.18, lng: 116.12, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[两汉河间国都乐成至北魏瀛州宋明河间府·夯土包砖京南运道府城] 汉河间献王刘德都乐成，北魏置瀛州、北宋升河间府、明包砖筑周十六里府城控京师南路驿道（《汉书·地理志》《明史·地理志》），在城及关厢人口约2–3万，>1万定小城。' },

    {
        id: 'city_jingzhou2',
        name: '蓨城',
        factionId: 'gaoqi_d',
        lat: 37.68, lng: 116.27,
        type: 'small_city',
        region: 'NORTH',
        buildingStyle: 'WEI',
        troops: 10000,
        note: '[两汉信都勃海大县蓨县至北齐高氏本籍景州·卫运河西岸夯土包砖州城] 汉周亚夫封条侯国、北齐皇室渤海高氏祖籍蓨县，元明为景州治并包砖修筑州城控京杭运河西岸（《汉书·地理志》《北齐书·神武纪》），州城关厢约1.2–2万，>1万定小城。' },
    {
        id: 'city_pingyuan',
        name: '平原城',
        factionId: 'tang',
        lat: 37.16, lng: 116.43,
        type: 'small_city',
        region: 'NORTH',
        buildingStyle: 'WEI',
        troops: 10000,
        note: '[两汉平原郡治至唐安史之乱颜真卿守城德州平原·夯土城郭大郡首邑] 《汉书·地理志》平原郡领十九县户154,387，唐天宝十四载颜真卿修浚平原城墙募兵万人首倡讨安禄山（《旧唐书·颜真卿传》），汉唐郡州重邑在城约1.5–2.5万，>1万定小城。',
    },
        // ── 京同山川走廊 (北京→大同 的中城) ──
    // ── 晋陕走廊/汾河谷地 (大同→长安 的中城) ──
    { id: 'city_linfen', name: '临汾', factionId: 'han_zhao', lat: 36.088, lng: 111.516724, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'WEI' , note: '[十六国汉赵刘渊建都平阳至唐晋州明平阳府·汾河东岸夯土包砖周十一里巨城] 永嘉三年刘渊迁都平阳、刘聪拓建，明洪武包砖修筑平阳府城统晋南三十余州县（《晋书·刘元海载记》《万历平阳府志》），城关常住人口约4–6万，>1万定小城。' },


    // ── 太行山脉走廊/八陉周边中城 ──
                // ── 淮海与齐鲁中原走廊中城 ──
    { id: 'city_shangqiu', name: '商丘', factionId: 'song', lat: 34.41, lng: 115.66, type: 'medium_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[唐睢阳至北宋南京应天府·夯土包砖汴渠陪都] 北宋陪都南京应天府（宋城及汴河舟车关厢）元丰至崇宁间城居峰值约8–12万（《宋史·地理志》应天府崇宁户79,741，宋城县附郭加汴河关厢商旅折算），≥8万容差线，定中城。' },


    { id: 'city_pengcheng', name: '彭城', factionId: 'chuguo', lat: 34.27, lng: 117.18, type: 'small_city', region: 'CENTRAL', buildingStyle: 'CENTRAL', troops: 10000, tier: 1, note: '[楚汉西楚都至宋明徐州·夯土包砖河防重城] 西楚霸王都彭城及汉唐宋明徐州城（城周九里余加黄河汴口关厢），历代城居峰值约5–7万（《汉书·地理志》彭城县户40,196含广大乡聚，折算在城坊厢不足8万），未达8万容差线，定小城。' },
    { id: 'city_langya', name: '琅琊', factionId: 'song', lat: 35.077231, lng: 118.363953, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[东汉琅琊王国开阳至东晋南朝唐宋沂州临沂·沂水西岸夯土包砖州府大城] 东汉光武封琅琊孝王京迁都开阳（今临沂），隋唐宋为沂州琅琊郡治、明万历包砖筑城（《后汉书·光武十王列传》《宋史·地理志》），鲁南都会城居约2–3.5万，>1万定小城。' },



    { id: 'city_ju', name: '莒城', factionId: 'chimei', lat: 35.578, lng: 118.832, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[春秋战国莒国故都至两汉城阳王国都莒县·沭水畔周二十里双城夯土大邑] 春秋赢姓莒国都城及齐田单守莒五载不拔名邑，西汉城阳景王刘章国都（《史记·田单列传》《汉书·地理志》城阳国四县户56,642集中于莒都），故城内城外郭城居达2.5–3.5万，>1万定小城。' },

    { id: 'city_lanling', name: '氶城', factionId: 'nan_liang', lat: 34.798005, lng: 117.647095, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[战国楚兰陵荀子为令至汉东海郡承县金明峄州·鲁南石砌包砖州城] 汉承县、晋兰陵郡治（萧梁皇室祖望），金升峄州、明洪武至崇祯采青石包砖筑峄州坚城（《晋书·地理志》《明史·地理志》），州城在籍坊厢逾1.2–1.8万且具石砖墙，定小城。' },





    // ── 齐鲁古国与半岛走廊中城 ──
    { id: 'city_dingtao', name: '定陶', factionId: 'qin', lat: 35.200716, lng: 115.471802, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[春秋曹国故都至战国秦汉天下之中定陶·济水菏水交汇夯土商业都会] 范蠡治产致富与汉高祖即位之济阴郡治定陶，《史记·货殖列传》盛称「陶天下之中，诸侯四通，货物所交易也」，战国至西汉定陶王都期城居达3–5万，>1万定小城。' },

    { id: 'city_jimo', name: '即墨', factionId: 'qi', lat: 36.403591, lng: 120.445862, type: 'small_city', region: 'CENTRAL',
buildingStyle: 'CENTRAL', troops: 10000,
        note: '[战国齐国东方副都即墨大邑·胶东沽河畔周十余里夯土坚城] 齐威王封即墨大夫与前284–279年田单据即墨火牛阵复齐七十余城（《战国策·齐策六》《史记·田单列传》载城中丁壮与老弱妇孺数万乘城），战国西汉胶东国都期城居达3–5万，>1万定小城。',
    },
    { id: 'city_boyang', name: '奉高', factionId: 'han_d', lat: 36.15, lng: 117.05, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[两汉泰山郡治奉高至金明泰安州城·泰山南麓条石包砖封禅重邑] 汉武帝元封元年置泰山郡治奉高掌岱宗封禅，金置泰安州、明洪武嘉靖改筑条石包砖泰安州城并聚泰山香税关厢（《汉书·武帝纪》《泰安州志》），城关常住约1.5–2.5万且具石砖墙，定小城。' },


    {
        id: 'city_licheng',
        name: '历下',
        factionId: 'ming_d',
        lat: 36.67, lng: 117.00,
        type: 'medium_city',
        region: 'SONG',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        tier: 1,
        note: '[明代山东布政使司济南府·巨石包砖府城与西关厢] 明洪武包砖济南府城（周十二里）及繁盛西关泉渠商厢，万历至崇祯初城居峰值约8–10万（《崇祯历城县志》坊厢户口及曹树基《中国人口史·明时期》考算），≥8万容差线，定中城。',
    },
    { id: 'city_linzi', name: '临淄', factionId: 'qi', lat: 36.88, lng: 118.43, type: 'medium_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[战国田齐极盛期·夯土大城与小城都郭] 齐宣王至齐湣王时期临淄大城与小城（逾15平方公里）城居约30–35万（《战国策·齐策一》苏秦明言「临淄之中七万户」，合城居约35万口），<40万而>10万，定中城。' },


    // ── 岭南、东南与西南地区中城 ──
    {
        id: 'city_bushan',
        name: '布山',
        factionId: 'xiou',
        lat: 23.10, lng: 109.60,
        type: 'small_city',
        region: 'JIANGNAN',
        // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：布山（广西贵港）：桂林郡治，汉地城郭
        buildingStyle: 'JIANGNAN',
        troops: 10000,
        note: '[汉郁林郡治布山至唐宋明浔州府桂平·黔郁两江交汇包砖石基府城] 西瓯故地、汉元鼎六年置郁林郡治布山，唐置浔州、明洪武至成化修筑包砖石基浔州府城控西江咽喉（《汉书·地理志》《百粤先贤志》《浔州府志》），府卫同城逾1–1.5万且具砖石墙，定小城。',
    },
    {
        id: 'city_fuzhou',
        name: '冶城',
        factionId: 'min',
        lat: 26.07, lng: 119.30,
        type: 'medium_city',
        isPort: true,
        region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN',
        troops: 10000,
        tier: 1,
        note: '[五代闽国都城至南宋福州府·夯土包砖夹城罗城] 五代王审知筑罗城、夹城至南宋淳熙年间，福州城内（闽县、侯官两附郭县坊厢）及南台关厢城居峰值约10–15万（梁克家《三山志》在城厢坊户籍考算），>10万定中城。' },
    // ── 淮河流域与中原周边中城 ──
    
    { id: 'city_huaiyang', name: '宛丘', factionId: 'han_d', lat: 33.63, lng: 114.7, type: 'small_city', region: 'CENTRAL',
buildingStyle: 'CENTRAL', troops: 10000,
        note: '[西周春秋陈国五百年国都宛丘至两汉淮阳国陈国都陈县·周十余里夯土水城] 胡公满封陈国都宛丘、战国末楚顷襄王自郢迁都于陈，西汉为淮阳王国都（《史记·陈杞世家》《汉书·地理志》淮阳国陈县），先秦两汉王都期城居达3–5万，>1万定小城。',
    },
    { id: 'city_shunchang', name: '顺昌', factionId: 'song', lat: 32.9, lng: 115.81, type: 'small_city', troops: 10000, region: 'SONG', buildingStyle: 'CENTRAL' , note: '[春秋胡国、汉汝阴至唐宋颍州顺昌府·颍河淮西夯土包砖抗金名城] 欧阳修、苏轼知颍州治所，绍兴十年（1140）刘锜率八字军偕顺昌军民数万据城大破完颜宗弼铁浮图（《宋史·刘锜传》），明颖州包砖城关人口约2.5–3.5万，>1万定小城。' },

    { id: 'city_qiaojun', name: '谯县', factionId: 'caowei', lat: 33.88, lng: 115.77, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[东汉末曹魏五都之陪都谯城至宋明亳州·涡水畔包砖夯土商药名都] 曹操故里、魏文帝黄初二年立谯为五都之一，元明为亳州治并筑包砖城墙（《三国志·文帝纪》《明一统志》），魏代陪都及明末涡河商埠期城居达3–5万，>1万定小城。' },




    { id: 'city_hefei', name: '合肥', factionId: 'yangwu', lat: 31.82, lng: 117.23, type: 'small_city', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, tier: 1, note: '[汉末三国张辽满宠合肥新城至唐宋庐州明庐州府·淝水包砖石基周二十六里巨城] 孙吴曹魏数十万人反复争夺之淮右锁钥，五代杨行密发祥庐州，宋郭振扩城、明包砖修筑庐州府城（《三国志·张辽传》《嘉庆合肥县志》），宋明府城坊厢常住达3–5万，>1万定小城。' },
    {
        id: 'city_yangzhou',
        name: '广陵',
        factionId: 'yangwu',
        lat: 32.3930, lng: 119.4200,
        type: 'medium_city',
        region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN', troops: 10000,
        tier: 1, note: '[中晚唐淮南节度至五代杨吴都城·夯土包砖二十四桥罗城] 中晚唐扬州子城与罗城（江都、江阳两县在城坊市）及明万历新旧双城盐商关厢城居峰值约25–35万（《新唐书·地理志》及曹树基《中国人口史》考算），<40万而>10万，定中城。' },

    { id: 'city_nanyang', name: '宛城', factionId: 'dixiang', lat: 32.955682, lng: 112.516479, type: 'medium_city', region: 'CENTRAL', buildingStyle: 'CENTRAL', troops: 10000, note: '[两汉五都之南都宛城·夯土大郭都会] 西汉至东汉五都之一宛城（城址约6–7平方公里，《汉书·食货志》列洛阳、邯郸、临淄、宛、成都五都；《汉书·地理志》宛县户47,547，扣除乡聚折算城关实居约8–12万，摒弃全郡240万旧误），≥8万定中城。' },
    // ── 荆楚与三峡巴蜀沿线中城 ──
    {
        id: 'city_fuling',
        name: '涪陵',
        factionId: 'shu',
        lat: 29.70, lng: 107.39,
        type: 'small_city',
        region: 'BASHU',
        buildingStyle: 'BASHU',
        troops: 10000, note: '[战国巴子别都、蜀汉涪陵郡治至唐宋明涪州·乌江入长江口条石包砖州城] 控扼黔中乌江盐丹入长江咽喉，蜀汉徵涪陵劲卒、南宋筑龟陵石城、明成化包砌条石涪州城（《华阳国志·巴志》《涪州志》），水陆商埠州城常住约1.5–2.5万且具石墙，定小城。' },
    { id: 'city_yiling', name: '夷陵', factionId: 'sunwu_d', lat: 30.7, lng: 111.28, type: 'small_city', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', troops: 10000,
        note: '[战国秦白起烧夷陵、三国陆逊破蜀至唐宋峡州明夷陵州·西陵峡口条石包砖江防城] 出三峡第一重镇夷陵（宜昌），南宋筑石城、明洪武因山临江重筑条石包砖州城控川鄂漕盐转般（《三国志·陆逊传》《东湖县志》），在城及江岸关厢常住约2–3万，>1万定小城。',
    },

    { id: 'city_ying', name: '江陵', factionId: 'chuguo', lat: 30.35, lng: 112.18, type: 'medium_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[春秋战国楚纪南郢都至南朝梁元帝江陵·夯土包砖大城] 战国楚都纪南城（16平方公里）及南朝梁江陵（554年西魏破城虏男女十余万口，《周书·于谨传》确载）、五代南平至唐宋荆南府，城居峰值约15–25万，>10万定中城。' },




    { id: 'city_suizhou', name: '随州', factionId: 'sui', lat: 31.71, lng: 113.36, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[曾随古国都城、杨坚发祥随州至宋明包砖州城·涢水畔夯土包砖汉东首邑] 西周春秋曾国（随国）都邑，北周杨坚封随国公定国号之源，南宋吴柔胜筑城抗金、明洪武包砖筑随州城（《左传·桓公六年》《随州志》），历代州治城居约2–3万，>1万定小城。' },


    {
        id: 'city_chaisang',
        name: '柴桑',
        factionId: 'sunwu_d',
        lat: 29.6802,
        lng: 115.9964,
        type: 'small_city',
        troops: 10000,
        
        note: '[孙吴周瑜水军大本营柴桑至唐江州浔阳明九江府·长江鄱阳湖口条石包砖巨埠] 东晋陶侃庾亮镇武昌寻阳、唐白居易贬江州，明代设九江钞关并筑周十二里条石包砖府城（《三国志·周瑜传》《万历九江府志》），赣江长江交汇钞关商民达3–5万，>1万定小城。', region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN' },
    { id: 'city_changsha', name: '长沙', factionId: 'machu', lat: 28.19, lng: 112.97, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[西汉吴氏刘氏长沙国都临湘至五代马殷楚国都潭州·湘江东岸夯土包砖王都] 西汉长沙王都、五代十国马楚建都潭州开茶马贸易盛局，南宋抗蒙潭州大城及明吉王藩封长沙府城（《汉书·地理志》《新五代史·楚世家》），城关常住人口约5–7万（未满8万），定小城。' },


    {
        id: 'city_changzhou',
        name: '延陵',
        factionId: 'zhangshicheng',
        lat: 31.78, lng: 119.97,
        type: 'small_city',
        region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN',
        troops: 10000,
        note: '[春秋吴季札封邑延陵至隋唐常州毗陵宋明常州府·江南运河包砖罗城大邑] 南朝兰陵萧氏桑梓、隋唐江南大州（《新唐书·地理志》常州户102,631），明洪武汤和改筑包砖新罗城，运河穿城贯东中西三关厢，城关实居达4–6万，>1万定小城。',
    },
    { id: 'city_gusu', name: '姑苏', factionId: 'wu', lat: 31.3, lng: 120.62, type: 'big_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[明万历至清康熙前期·包砖石基府城郭] 明万历至清康熙（≤1700年）苏州府城垣内及阊门、南濠、枫桥连片关厢城居峰值约50–60万（曹树基《中国人口史》据吴县、长洲在城坊厢折算；Chandler 1600年表40–50万），≥50万定大城。' },
    { id: 'city_jiaxing', name: '嘉兴', factionId: 'wuyue', lat: 30.75, lng: 120.76, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[孙吴嘉兴、五代吴越开元府秀州至宋明嘉兴府·江南运河条石包砖周十二里巨郡] 南宋孝宗潜邸升嘉兴府，明万历丝绸米市甲于浙西，条石包砖府城内（嘉兴、秀水两附郭县坊厢）及四门关厢常住达5–7万（《万历嘉兴府志》及曹树基考算），>1万定小城。' },

    { id: 'city_shanxian', name: '剡城', factionId: 'tang', lat: 29.556746, lng: 120.822144, type: 'small_city', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', troops: 10000, mirror: true,
        note: '[两汉六朝剡县名邑至唐嵊州宋明嵊县·曹娥江上游剡溪条石包砖县城] 晋戴逵隐居与谢玄唐浙东裘甫起事争夺要邑，明嘉靖三十四年知县吴三畏筑周六里条石包砖县城御倭（《嘉泰会稽志》《嵊县志》），县治城关约1.2–1.8万且具石砖墙，定小城。',
    },

    // ── 陇右与河西走廊中城 ──
    { id: 'city_tianshui', name: '天水', factionId: 'qin', lat: 34.58, lng: 105.73, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[秦邽县、汉天水郡上邽藉水至唐宋秦州雄武军·渭南陇右夯土包砖东西关连城] 姜维故里、前秦后秦乞伏争战名城，北宋秦凤路经略安抚使治所秦州大城及明筑东西五城相连包砖城垣（《宋史·地理志》秦州户逾四万九千，《秦州直隶州新志》），城居达3–5万，>1万定小城。' },




    { id: 'city_longzhou', name: '汧源', factionId: 'yuwen', lat: 34.89, lng: 106.86, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[秦汉汧县至西魏北周隋唐陇州汧阳郡·关陇西门汧水畔夯土包砖防秋军州城] 北周韦孝宽经营关西、唐代京师西屏防吐蕃第一军镇陇州治汧源（《元和郡县图志》卷二、《新唐书·地理志》驻防秋神策军），军州城内驻兵与坊民逾1.5–2万，>1万定小城。' },

    { id: 'city_longxi', name: '襄武', factionId: 'han_d', lat: 35.032229, lng: 104.587097, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[东汉隗嚣都西城襄武至唐渭州北宋巩州通远军·渭河上游夯土包砖陇右郡府城] 汉陇西郡治襄武、东汉建武隗嚣王元据守抗汉，北宋熙宁置通远军升巩州、元巩昌府总帅汪世显驻都（《后汉书·隗嚣传》《元史·汪世显传》），州府城居达2–3万，>1万定小城。' },


    { id: 'city_wuwei', name: '姑臧', factionId: 'qianliang', lat: 37.93, lng: 102.64, type: 'small_city', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI' , note: '[两汉武威郡治至十六国前凉后凉南凉北凉四朝王都姑臧·卧龙七城夯土包砖凉都] 张轨前凉及吕光后凉定都姑臧，筑七城相连象北斗，河西避乱衣冠士庶云集，五凉极盛期城居峰值约5–7万（《晋书·张轨传》及齐陈骏《河西史研究》，未满8万），定小城。' },


    { id: 'city_zhangye', name: '张掖', factionId: 'han_d', lat: 38.93, lng: 100.45, type: 'small_city', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI' , note: '[汉张掖郡觻得至甘州回鹘牙帐王都及明陕西行都司甘州镇·夯土包砖周十二里重镇] 丝路河西中枢甘州，10–11世纪甘州回鹘可汗王城、西夏镇夷郡、明置陕西行都司统五卫包砖巨城（《宋史·回鹘传》《甘镇志》），卫城军余商民达3–5万，>1万定小城。' },

    { id: 'city_jiuquan', name: '嘉峪关', factionId: 'ming_d', lat: 39.7822, lng: 98.3414, type: 'pass', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[明洪武至万历·夯土包砖长城西端雄关] 洪武五年冯胜始筑、弘治嘉靖包砖扩建嘉峪关扼祁连山与黑山峡口（《明史·地理志》《肃镇华夷志》），带「关」字且具包砖关城，未成万人居民城，定险要。' },










    // ── 塞北与西域中城 ──
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 HUNS：郅支城：匈奴郅支单于西迁所筑（《汉书·陈汤传》），归匈人 HUNS
    { id: 'city_zhizhicheng', name: '郅支城', factionId: 'xijue', lat: 42.906205, lng: 72.765198, type: 'stockade', troops: 10000, region: 'CENTRAL_ASIA', buildingStyle: 'WESTERN', note: '[前36年西汉陈汤甘延寿远征北匈奴郅支单于都城·塔拉斯河畔重木城包土城垣] 《汉书·陈汤传》明载郅支单于发康居民作城「日五百人二岁乃已，又为重木城」于都赖水（塔拉斯河）上，前36年汉军焚破木栅土城斩郅支，游牧单于新筑土城木栅且常住<1万，定城寨。' },



    { id: 'city_chigucheng', name: '赤谷城', factionId: 'wusun', lat: 42.153304, lng: 77.585449, type: 'stockade', troops: 10000, region: 'WUSUN', buildingStyle: 'WESTERN', note: '[两汉伊塞克湖南岸乌孙汗国大昆弥王庭赤谷城·天山纳伦河谷毡帐游牧冬都] 汉细君、解忧公主和亲乌孙驻居赤谷城，《汉书·西域传》明载乌孙十二万户系全行国随畜逐水草总人口（非城居），赤谷城实为昆弥过冬木土营宫与毡帐群，常住定居不足数千人，定城寨。' },

    { id: 'city_guishancheng', name: '贵山城', factionId: 'dayuan', lat: 41.290174, lng: 71.666565, type: 'small_city', region: 'WESTERN',
buildingStyle: 'WESTERN', troops: 10000,
        note: '[前2世纪大宛王国都城贵山城·费尔干纳卡桑赛内城外城夯土泥砖王都] 汉太初三年（前102）李广利六万大军再征大宛围攻贵山城四十余日破外城断水源（《史记·大宛列传》载大宛属邑七十余城、贵山为王都），Mugtepa考古大城垣内都城人口约1.5–2.5万，>1万定小城。',
    },

    {
        id: 'city_loulan',
        name: '扜泥城',
        factionId: 'shanshan',
        lat: 40.5158, lng: 89.92,
        type: 'stockade',
        region: 'WESTERN',
        buildingStyle: 'WESTERN',
        troops: 10000,
        tier: 1,
        note: '[西汉元凤更名鄯善至魏晋·米兰若羌绿洲夯土夹红柳王城扜泥] 《汉书·西域传》明载鄯善全国总人口仅「户千五百七十，口万四千一百」散处多片绿洲，都城扜泥城居仅约3000–5000人且为夯土红柳城垣，定城寨。' },
    {
        id: 'city_shache',
        name: '渠莎',
        factionId: 'shache',
        lat: 38.41, lng: 77.24,
        type: 'small_city',
        region: 'WESTERN',
        buildingStyle: 'WESTERN',
        troops: 10000,
        note: '[两汉西域强国莎车至16至17世纪叶尔羌汗国百六十年首都·高大夯土泥砖都城渠莎] 东汉初莎车王贤称霸西域（《后汉书·西域传》），1514–1680年赛义德汗与拉失德汗定都叶尔羌（莎车）统辖天山南北，米尔咱·海答儿《拉失德史》及汗国盛期都城人口达3–5万，>1万定小城。' },
    { id: 'city_shule', name: '盘橐', factionId: 'shule', lat: 39.4850, lng: 76.0007, type: 'small_city', troops: 10000,        region: 'WESTERN_FEUDAL',
buildingStyle: 'WESTERN', tier: 1,
        note: '[两汉班超驻守疏勒国都盘橐城至喀喇汗国东都喀什噶尔·克孜勒河夯土高墙商都] 东汉班超据盘橐城经营西域（《汉书·西域传》疏勒户千五百、至东汉《后汉书·西域传》疏勒猛增至「领户二万一千，胜兵三万余人」），11世纪麻赫穆德·喀什噶里时代东都城居达2–4万，>1万定小城。',
    },

    { id: 'city_yanqi', name: '员渠城', factionId: 'yanqi', lat: 42.06, lng: 86.56, type: 'stockade', troops: 10000, region: 'WESTERN_FEUDAL', buildingStyle: 'WESTERN' , note: '[两汉至唐代焉耆国都员渠城·博斯腾湖西岸夯土方城] 《汉书·西域传》焉耆全国户四千、口三万二千一百，玄奘《大唐西域记》卷一载阿耆尼国都城周仅六七里（博格达沁古城约0.5平方公里夯土墙），扣除属境后都城实居约5000–8000人<1万，定城寨。' },


    {
        id: 'city_dunhuang',
        name: '敦煌',
        factionId: 'guiyi',
        lat: 40.14, lng: 94.66,
        type: 'small_city',
        region: 'KHITAN',
        buildingStyle: 'HEXI',
        troops: 10000,
        note: '[两汉河西敦煌郡治至晚唐五代张议潮曹氏归义军节度首府沙州·党河夯土大州城] 丝路总咽喉敦煌，吐蕃与张议潮归义军时期敦煌文书《沙州诸乡户口帐》及寺院僧尼工匠名籍可考，沙州子城罗城内常住军民僧俗峰值约1.5–2.5万（冻国栋《唐代人口问题研究》），>1万定小城。',
    },
    { id: 'city_lanzhou', name: '皋兰', factionId: 'han_d', lat: 36.062422, lng: 103.765869, type: 'small_city', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI' , note: '[西汉金城至隋唐兰州金城郡及明肃王藩封兰州卫·黄河铁桥南岸夯土包砖内外双城] 隋置兰州总管府控河湟，明建肃王府并包砖修筑内城与十四里外郭关城锁控甘青茶马大市（《元和郡县图志》《兰州市志》），明万历藩城卫所与关厢商民达3–5万，>1万定小城。' },


    { id: 'city_ledu', name: '浇河', factionId: 'tubo', lat: 35.7264, lng: 101.2061, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'TIBET', note: '[十六国吐谷浑阿豺筑浇河城至唐吐蕃争夺廓州达化·黄河上游贵德夯土军州小城] 吐谷浑王阿豺兼并氐羌筑浇河城，北周隋唐置廓州宁塞郡、宋唃厮啰改积石军（《晋书·西戎传》《旧唐书·地理志》廓州三县合计仅户4,261），夯土河谷小城且在城不足3000人，定城寨。' },

    { id: 'city_lintao', name: '狄道', factionId: 'song', lat: 35.37, lng: 103.86, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[战国秦长城西端陇西郡治狄道至北宋王韶熙河路帅府熙州·洮水东岸夯土包砖重镇] 秦昭襄王置陇西郡治狄道，北宋熙宁五年王韶拓熙河置熙州经略安抚司统重兵（《史记·匈奴列传》《宋史·王韶传》《地理志》），宋金元明临洮府治城居约2–3万，>1万定小城。' },

    { id: 'city_songzhou', name: '嘉诚', factionId: 'tang', lat: 32.787239, lng: 103.625793, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[唐武德置松州交川郡治嘉诚（贞观十二年松州之战）·岷江源头夯土山谷边州小城] 贞观十二年（638）松赞干布率吐蕃大军围松州嘉诚县，侯君集、牛进达夜袭破之（《旧唐书·吐蕃传》，《旧唐书·地理志》松州全州三县仅户1,076！），唐代表阶段夯土边城不足3000人，定城寨。' },



    { id: 'city_jianchang', name: '邛都', factionId: 'han_d', lat: 27.870652, lng: 102.310181, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[西汉越嶲郡治邛都、大理建昌府至明四川行都司建昌卫·安宁河谷条石包砖九门大城] 司马相如通西南夷置邛都，明洪武二十五年月鲁帖木儿平后筑条石包砖周九里建昌卫城统五卫八所（《史记·西南夷列传》《明史·地理志》），川滇走廊军商大城常住约1.5–2.5万，>1万定小城。' },


    { id: 'city_toumancheng', name: '头曼城', factionId: 'xiongnu', lat: 41.302589, lng: 108.50647, type: 'stockade', troops: 10000, region: 'STEPPE_ANTIQUITY', buildingStyle: 'XIANBEI' , note: '[秦末汉初匈奴头曼单于期·阴山北麓早期夯土单于驻城] 《史记·匈奴列传》载头曼单于北徙十余年后复南归之头曼城，系草原游牧政权早期小型夯土驻所，查无城居人口记载且无砖石城郭，定城寨。' },



    { id: 'city_guangnan', name: '广南', factionId: 'gouding', lat: 23.755260, lng: 105.386353, type: 'stockade', region: 'BASHU',
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：广南（云南广南）：汉地边州
buildingStyle: 'BASHU', troops: 10000,
        note: '[西汉西南夷句町王国至宋特磨道·滇桂交界竹木土石部族城寨] 汉昭帝封句町王毋波（《汉书·西南夷传》），句町部族首邑无砖石城垣（广南砖石府城晚筑且本据点代表汉代句町国阶段），城居查无确数且<1万，定城寨。',
    },    
    { id: 'city_liaoyang', name: '襄平', factionId: 'gongsun_d', lat: 41.27, lng: 123.17, type: 'small_city', troops: 10000, region: 'WEI', buildingStyle: 'WEI' , note: '[战国燕秦两汉辽东郡治襄平至辽金东京辽阳府·太子河畔夯土包砖周三十里陪都] 公孙度父子三代割据襄平，辽太宗升南京后改东京辽阳府筑三十里大城、金为东京留守司（《三国志·公孙度传》《辽史·地理志》东京在城辽阳、仙乡两县），陪都城居峰值达4–6万，>1万定小城。' },


    // 🔴 [2026-10-25 主人令「朝阳改为河朔文化、与程名振就不冲突了，都改为河朔」] 朝阳＝唐营州（河北道），按当地最著名本地政权取河朔（WEI）
    { id: 'city_chaoyang', name: '朝阳', factionId: 'wuhuan', lat: 41.57, lng: 120.45, type: 'small_city', troops: 10000, region: 'NORTHEAST', buildingStyle: 'XIANBEI' , note: '[十六国前燕后燕北燕三朝国都龙城（和龙宫）·大凌河畔夯土包砖都城郭] 慕容皝咸康七年营新宫柳城改名龙城迁都，后燕慕容熙、北燕冯跋继都于此（《晋书·慕容皝载记》及朝阳三燕龙城遗址考古），三燕王都期城内军民贵族达3–5万，>1万定小城。' },



    { id: 'city_jicheng', name: '棘城', factionId: 'murong', lat: 41.58, lng: 121.055, type: 'small_city', troops: 10000, region: 'NORTHEAST', buildingStyle: 'XIANBEI' , note: '[西晋末至东晋初前燕慕容廆慕容皝五十年早期国都棘城·辽西夯土王城] 元康四年（294）慕容廆定都大棘城招抚中原流亡士庶十余万户，咸康四年慕容皝据棘城大破后赵石虎数十万围军（《晋书·慕容廆载记》），迁龙城前棘城都邑人口达2–3万，>1万定小城。' },


    {
        id: 'city_bailangshan',
        name: '白狼山',
        factionId: 'wuhuan',
        lat: 41.40, lng: 119.64,
        type: 'stockade',
        region: 'NORTHEAST',
        buildingStyle: 'XIANBEI',
        troops: 10000,
        note: '[东汉建安十二年曹操张辽北征三郡乌桓决战地·大凌河上游白狼山麓乌桓游牧聚落] 曹操自卢龙塞出奇兵登白狼山卒与蹋顿数万骑遇、张辽斩蹋顿（《三国志·武帝纪》《张辽传》），系辽西山地乌桓部族驻牧营聚（名不带关且无城墙），常住<1万，定城寨。',
    },

    { id: 'city_chifeng', name: '木叶山', factionId: 'liao_d', lat: 42.718800, lng: 120.726013, type: 'stockade', region: 'KHITAN', buildingStyle: 'XIANBEI', troops: 10000, note: '[契丹发祥圣山木叶山与辽太祖阿保机陵寝奉陵邑祖州·西拉木伦河汇口夯土小陵州城] 契丹青牛白马始祖庙所在，耶律德光筑祖州天成军夯土城奉太祖陵（巴林左旗石房子祖州城遗址周仅约1.9公里夯土墙，《辽史·地理志》），奉陵小邑常住侍陵户数千人<1万，定城寨。' },
    {
        id: 'city_jiangsheng',
        name: '降圣',
        factionId: 'liao_d',
        lat: 42.5610,
        lng: 119.4818,
        type: 'stockade',
        region: 'KHITAN',
        buildingStyle: 'XIANBEI',
        troops: 10000,
        note: '[辽太宗诞生地置头下奉圣/降圣州（永州木叶山南境）·潢水土河交汇契丹斡鲁朵小邑] 契丹皇室斡鲁朵宫卫小州城（《辽史·地理志》上京道头下与陵寝诸小州户仅数千），夯土城垣狭小且常住契丹汉户不足5000人，定城寨。',
    },
    { id: 'city_linhuang', name: '临潢府', factionId: 'liao_d', lat: 43.96, lng: 119.38, type: 'medium_city', troops: 10000, region: 'KHITAN', buildingStyle: 'XIANBEI' , note: '[辽上京临潢府盛期·夯土皇城与汉城双郭] 辽兴宗至道宗时期上京临潢府皇城与南侧汉城（周二十七里）城居峰值约8–12万（《辽史·地理志》上京临潢县及内果园、诸宫卫斡鲁朵在京户3.65万户折算），≥8万定中城。' },



    { id: 'city_hezhang', name: '可乐寨', factionId: 'yelang', lat: 27.095807, lng: 104.718933, type: 'stockade', region: 'BASHU', buildingStyle: 'BASHU', troops: 10000, note: '[战国至西汉夜郎旁小邑可乐（汉犍为郡汉阳县址）·乌蒙高原无城垣铜鼓墓群大聚落] 贵州赫章可乐遗址发掘数百座「套头葬」战国秦汉墓群与汉阳县夯土小治址（《史记·西南夷列传》及贵州考古所发掘报告），西南夷山地夯土小邑且人口不足5000人，定城寨。' },
    { id: 'city_tancheng', name: '郯城', factionId: 'qi', lat: 34.549568, lng: 118.317261, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[春秋郯子古国都至两汉东海大郡治所郯县·沂沭平原周十余里夯土大郡城] 《汉书·地理志》东海郡领三十八县户358,414、口1,559,357（高居西汉百三郡国人口前二名），郡治郯县故城周十余里，两汉郡治盛期城居约2–3万，>1万定小城。' },

    { id: 'city_qucheng', name: '朐城', factionId: 'shu', lat: 34.5292, lng: 119.132996, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[秦置朐县东门石阙至南宋抗金魏胜海州城明海州·石棚山麓条石包砖周九里海防州城] 绍兴三十一年魏胜起义收复海州屡破金兵，明洪武永乐包砖石重筑海州城控淮北海盐漕运（《宋史·魏胜传》《嘉庆海州直隶州志》），州城及新浦盐关人口约1.5–2.5万，>1万定小城。' },

        { id: 'city_baibogu', name: '白波谷', factionId: 'baibo', lat: 36.135621, lng: 112.206116, type: 'stockade', region: 'CENTRAL',
buildingStyle: 'WEI', troops: 10000,
        note: '[东汉中平末白波军起事·汾西山谷流民营寨] 中平五年郭太等起兵于西河白波谷（《后汉书·灵帝纪》《三国志·董卓传》），系山谷义军屯聚营寨，名字不带关隘堡戍且无砖石夯土关墙，人口<1万，定城寨。',
    },
    { id: 'city_baoshan', name: '永昌', factionId: 'ailao', lat: 25.11, lng: 99.16, type: 'small_city', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[东汉哀牢内属置永昌郡至大理永昌府明永昌军民府·太保山麓条石包砖周十三里滇西巨城] 汉明帝永平十二年柳貌内属置永昌郡，明洪武二十三年筑永昌卫、弘治扩建条石包砖八门大城控博南古道（《后汉书·西南夷传》《徐霞客游记·滇游日记》），城关商民逾2–3万，>1万定小城。',
    },

    {
        id: 'city_guoneicheng',
        name: '国内城',
        factionId: 'gaogouli',
        lat: 41.13, lng: 126.19,
        type: 'small_city',
        region: 'KOREA',
        buildingStyle: 'KOREA', troops: 10000,
        tier: 1,
        note: '[公元1至5世纪初高句丽四百年王都·鸭绿江畔集安花岗岩方形条石都城与丸都山城] 琉璃明王迁都至长寿王427年南迁平壤前高句丽都城，现存集安平原国内城周2.7公里规整楔形花岗岩条石城垣，配合丸都山城拱卫，都城盛期城居约2–3万（《三国史记》及集安世遗考古），>1万定小城。' },
    {
        id: 'city_fuyu',
        name: '黄龙府',
        factionId: 'fuyu',
        lat: 44.4278, lng: 125.1758,
        type: 'small_city',
        region: 'NORTHEAST',
        buildingStyle: 'NORTHEAST',
        troops: 10000,
        note: '[夫余前期王城、辽黄龙府至金初济州利涉军·伊通河农安周七里夯土砖塔重镇] 保大前辽东北军事重镇黄龙府（岳飞直捣黄龙典故所指），《金史·地理志》济州利涉军倚郭利涉县户逾两万，辽金盛期州府在城军民约2.5–4万，>1万定小城。',
    },
    
    { id: 'city_wuling', name: '常德', factionId: 'song', lat: 29.03, lng: 111.69, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[两汉武陵郡临沅至唐朗州宋常德府明荣王藩封·沅水北岸条石包砖周九里江防府城] 五代周行逢武平军节度治所朗州，南宋升常德府、明洪武包砖修筑府城控湘西北入黔水道（《新五代史·周行逢传》《常德府志》），城关常住人口达3–4.5万，>1万定小城。' },




    // ── 2026-05-25 唐朝势力新增据点 ──

];

// ============================================================
// T2 关隘/要塞/渡口/港口 — 待添加
// ============================================================
export const T2_STRATEGIC: CityDataV2[] = [
    // ── 蜀道沿线关隘 (长安→成都) ──
    {
        id: 'city_dasanguan',
        name: '大散关',
        factionId: 'song',
        lat: 34.2800, lng: 106.9500,
        type: 'pass',
        region: 'SONG',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        tier: 2,
        note: '[秦汉至南宋抗金·秦岭陈仓道石砌夯土关城] 扼秦岭北麓入蜀故道咽喉，南宋绍兴间吴璘、杨政据大散关屡拒金兵（《宋史·吴璘传》《读史方舆纪要》），带「关」字且具石土关墙，未成万人城，定险要。',
    },
    { id: 'city_dusong', name: '独松关', factionId: 'song', lat: 30.566952, lng: 119.679565, type: 'pass', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', mirror: true, note: '[南宋行在北门户·天目山余脉块石砌筑关隘] 扼广德入临安驿道狭谷，德祐元年张濡戍守抗元，现存南宋块石关墙与瓮城券门（《宋史·瀛国公纪》《咸淳临安志》），带「关」字且具石墙，未成万人城，定险要。' },

//镜像
    { id: 'city_xianxia', name: '仙霞关', factionId: 'huangwang', lat: 28.35, lng: 118.51, type: 'pass', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', troops: 10000, tier: 2,
        note: '[唐末黄巢开道至宋明清·仙霞岭四重麻石关城] 扼浙闽赣三省交界仙霞古道，南宋史浩始筑石关，明隆武郑彩驻防，现存四道条石关门与石墙（《新唐书·黄巢传》《江山县志》），带「关」字且具石墙，未成万人城，定险要。',
    },
    { id: 'city_wuzhou', name: '金华', factionId: 'lujian', lat: 29.08, lng: 119.65, type: 'small_city', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', troops: 10000,
        note: '[三国吴东阳郡至唐宋婺州元明金华府·婺江北岸条石巨砖周十七里七门坚城] 朱元璋取宁越改金华府为开国浙东根本，南明朱大典凭金华条石巨城抗清军红衣大炮数月（《明史·朱大典传》《万历金华府志》），府城坊厢人口达3.5–5万，>1万定小城。',
    },
    { id: 'city_quzhou', name: '信安', factionId: 'tang', lat: 28.96, lng: 118.87, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[唐置衢州信安郡至南宋孔氏南宗家庙明衢州府·信安江畔条石包砖周九里六门铁城] 四省通衢锁钥，唐黄巢、宋方腊及清初耿精忠之乱屡经攻守，自宋至明修筑坚厚条石包砖城垣（《弘治衢州府志》），水陆转般关厢与在城人口达2.5–4万，>1万定小城。' },

    { id: 'city_raozhou', name: '鄱阳', factionId: 'linshihong', lat: 28.99, lng: 116.66, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[春秋楚吴争番邑、汉吴芮番令至唐宋饶州明饶州府·鄱阳湖东口条石包砖周十二里名城] 秦番县吴芮起兵号番君，唐宋置永平监铸钱与景德镇瓷器水运总汇饶州府（《史记·黥布列传》《宋史·地理志》饶州崇宁户181,300），在城鄱阳县及沿河瓷码头关厢常住达3–5万，>1万定小城。' },


    
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：南康（江西）：汉地州郡
    { id: 'city_qianzhou', name: '南康', factionId: 'ming_d', lat: 25.8509, lng: 114.93, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[东晋南康郡至唐虔州北宋赣州府明南赣巡抚驻城·章贡合流北宋寿量条石包砖十三门宋城] 北宋嘉祐至熙宁知州刘彝修福寿沟并全城包砌火烧铭文砖与条石防洪城墙（保存至今），王阳明南赣巡抚驻节统四省军务（《宋史》《赣州府志》），两江榷关与在城人口达4–6万，>1万定小城。' },


    {
        id: 'city_jianmenguan',
        name: '剑门关',
        factionId: 'shu',
        lat: 32.28, lng: 105.53,
        type: 'pass',
        region: 'BASHU',
        buildingStyle: 'BASHU',
        troops: 10000,
        tier: 2,
        note: '[蜀汉至唐宋明·大剑山断崖条石关城] 诸葛亮因大剑山凿石架阁立剑门关，炎兴元年姜维、廖化凭关拒钟会十万大军（《三国志·姜维传》《华阳国志》），带「关」字且具石砌关墙，未成万人城，定险要。',
    },
    { id: 'city_baishuiguan', name: '白水关', factionId: 'shu', lat: 32.74, lng: 105.5, type: 'pass', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[东汉末蜀汉入川之役·金牛景谷道会口石土关城] 扼广元入蜀白水峡口，建安十七年刘备袭斩益州守将杨怀、高沛夺白水关（《三国志·先主传》《水经注·漾水》），带「关」字且为纯军事关塞，未成万人城，定险要。' },

    //── 子午道秦岭关隘 ──
    { id: 'city_ziwu', name: '子午谷', factionId: 'dashun', lat: 33.312230, lng: 108.124695, type: 'stockade', region: 'HUAXIA_IMPERIAL', buildingStyle: 'CENTRAL', troops: 10000, note: '[秦汉魏延子午道北口子午镇至明崇祯九年孙传庭黑水峪擒闯王高迎祥·秦岭峪口夯土营镇] 扼长安南穿秦岭捷径子午谷口，汉设子午关驿、明崇祯九年高迎祥出子午谷遭伏被擒（《三国志·魏延传》注、《明史·孙传庭传》），名不带关隘堡戍之谷口驿镇且人口不足3000，定城寨。' },
    { id: 'city_mianzhuguan', name: '鹿头关', factionId: 'chenghan', lat: 31.32549, lng: 104.172363, type: 'pass', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[唐至五代两宋·鹿头山金牛道尾闸夯土石基关城] 唐置鹿头关控成都平原北门，元和元年高崇文讨刘辟连破鹿头关八栅（《旧唐书·高崇文传》《元和郡县图志》），带「关」字且为守道关塞，未成万人城，定险要。' },


    // ── 崤函古道沿线关隘 ──
    { id: 'city_hanguguan', name: '函谷关', factionId: 'sui', lat: 34.615131, lng: 110.915222, type: 'pass', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[战国秦至两汉魏晋·崤函绝谷夯土关城] 秦孝公置函谷关「车不方轨、马不并辔」拒六国，汉元鼎三年东移新安（《史记·秦本纪》《水经注·河水》），带「关」字且具夯土关垣，未成万人城，定险要。' },

    { id: 'city_tongguan', name: '潼关', factionId: 'ming_d', lat: 34.540000, lng: 110.290000, type: 'pass', region: 'MING', buildingStyle: 'CENTRAL', troops: 10000, mirror: true, note: '[东汉末至隋唐明·夯土包砖关城] 建安元年置潼关扼崤函通道（《水经注·河水》），纯军事咽喉关城、带「关」字且具城墙，未成万人居民城，定险要。' },
    // ── 中原北线黄河走廊关隘 ──
    { id: 'city_hulaoguan', name: '虎牢关', factionId: 'nan_liang', lat: 34.810000, lng: 113.170000, type: 'pass', region: 'CENTRAL',
buildingStyle: 'CENTRAL', troops: 10000, mirror: true,
        note: '[春秋成皋至北魏隋唐·汜水虎牢夯土包砖关城] 踞嵩山北麓黄河绝岸，北魏毛德祖坚守二百余日、唐武德四年李世民凭虎牢擒窦建德（《魏书》《旧唐书·太宗纪》），带「关」字且具关城垣，未成万人城，定险要。',
    },
    // ── 洛阳周边防御关隘群 ──
    { id: 'city_guangchengguan', name: '广成关', factionId: 'han_d', lat: 34.139089, lng: 112.887268, type: 'pass', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', mirror: true, note: '[东汉末洛阳八关·汝水宛洛道夯土关城] 中平元年何进奏置八关都尉，广成关扼洛阳南通荆宛孔道，孙坚曾破胡轸、华雄于此一带（《后汉书·灵帝纪》《资治通鉴》），带「关」字且具夯土关垣，未成万人城，定险要。' },


    
    // ── 京同山川走廊关隘 ──
    { id: 'city_juyongguan', name: '居庸关', factionId: 'you', lat: 40.28, lng: 116.06, type: 'pass', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[秦汉军都陉至元明·太行八陉条石包砖重关] 太行八陉之军都陉，明洪武景泰修筑南北券城、水门及石砖关垣拱卫京师西北（《吕氏春秋》《明史·兵志》），带「关」字且具砖石城墙，未成万人城，定险要。', mirror: true },



    // ── 晋西北外三关及晋东北内长城关隘 ──
    { id: 'city_piantouguan', name: '偏头关', factionId: 'ming_d', lat: 39.43, lng: 111.5, type: 'pass', troops: 10000, region: 'MING', buildingStyle: 'WEI', note: '[元至明九边山西镇·黄河东岸夯土包砖边关] 与宁武、雁门合称外三关，明洪武二十三年改筑、成化弘治包砖，山西镇总兵驻守防河套骑兵（《明史·兵志》《山西通志》），带「关」字且具砖墙，驻军戍堡<1万民城，定险要。' },




    { id: 'city_pingxingguan', name: '平型关', factionId: 'zhao', lat: 39.281169, lng: 113.744202, type: 'pass', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', mirror: true, note: '[北魏平城道至明内长城·恒山瓶形岭砖石关城] 明正德六年筑岭口关城、嘉靖二十四年包砖设守备扼代郡入蔚灵通道（《明史·地理志》《繁峙县志》），带「关」字且具砖石关墙，未成万人城，定险要。' },


    { id: 'city_lingshiguan', name: '灵石关', factionId: 'sui', lat: 36.844462, lng: 111.796875, type: 'pass', region: 'NORTH',
buildingStyle: 'WEI', troops: 10000,
        note: '[隋唐至明代雀鼠谷道·汾河峡谷石砖关城] 即阴地关／冷泉关灵石峡段，扼太原盆地南下临汾咽喉，义宁元年李渊破宋老生经此谷道（《旧唐书·高祖纪》《读史方舆纪要》），带「关」字且具石砖关垣，未成万人城，定险要。',
    },
        // ── 关中盆地防御要塞群 ──
    { id: 'city_wuguan', name: '武关', factionId: 'qin', lat: 33.6, lng: 110.62, type: 'pass', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', mirror: true, note: '[战国秦至楚汉隋唐·商洛丹江谷夯土包石关城] 关中四塞之南关，前207年刘邦破武关入咸阳（《史记·高祖本纪》《元和郡县图志》），带「关」字且具夯土石基关城，未成万人居民城，定险要。' },






    { id: 'city_xiaoguan', name: '萧关', factionId: 'hou_qin', lat: 35.657289, lng: 106.32019, type: 'pass', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[秦汉至唐宋陇山北口·夯土关城与边塞障垣] 关中四塞之西北关，汉文帝十四年匈奴入朝那萧关杀北地都尉孙卬（《史记·匈奴列传》《括地志》），带「关」字且具夯土关垣，未成万人居民城，定险要。', mirror: true },



    {
        id: 'city_jinsuoguan',
        name: '金锁关',
        factionId: 'tang',
        lat: 35.19, lng: 109.11,
        type: 'pass',
        region: 'CENTRAL',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        tier: 2,
        note: '[北魏至唐宋明·铜川三水石峡砖石关城] 踞耀州北神水峡绝壁，扼关中通陕北延绥咽喉（《宋史·地理志》《读史方舆纪要》），带「关」字且具石砖关墙，纯军事锁钥未成万人城，定险要。',
    },
    // ── 太行八陉防御要塞关隘群 ──
    { id: 'city_zhiguan', name: '轵关', factionId: 'gaoqi_d', lat: 35.15, lng: 112.3, type: 'pass', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[战国魏韩至两汉北朝·太行第一陉夯土石基关城] 太行八陉首陉轵关陉口，秦昭王伐韩拔轵、北齐筑关防周（《史记·六国年表》《水经注·沁水》），带「关」字且具夯土石砌关垣，未成万人城，定险要。', mirror: true },


            { id: 'city_jingxingguan', name: '井陉关', factionId: 'han_d', lat: 38.02, lng: 114, type: 'pass', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[战国秦汉至隋唐明·太行第五陉条石包砖关城] 即土门关，前204年韩信出井陉背水破赵军陈馀（《史记·淮阴侯列传》），明筑砖石三重关门，带「关」字且具石砖关墙，未成万人城，定险要。' },





    { id: 'city_daomaguan', name: '倒马关', factionId: 'song', lat: 38.861098, lng: 114.768677, type: 'pass', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[汉代常山关至宋明内三关·唐河山峡砖石关城] 宋杨延昭镇守、明景泰三年包砖筑上下两城列内长城三关之一（《宋史·杨业传》《明史·兵志》），带「关」字且具砖石关垣，未成万人城，定险要。', mirror: true },


    { id: 'city_feihu', name: '飞狐', factionId: 'song', lat: 39.3487, lng: 114.6986, type: 'stockade', troops: 10000, region: 'WEI', buildingStyle: 'WEI', note: '[战国汉晋太行八陉之飞狐道广昌县（隋改飞狐县）·拒马河源涞源盆地夯土山县] 郦食其劝汉高祖塞飞狐之口，隋仁寿改广昌置飞狐县、唐属蔚州（《史记·留侯世家》《元和郡县图志》，本据点取飞狐县城而非北口关门），汉唐宋阶段夯土山县城居不足5000人，定城寨。' },
    { id: 'city_zijingguan', name: '紫荆关', factionId: 'ming_d', lat: 39.472238, lng: 115.265808, type: 'pass', region: 'SONG',
buildingStyle: 'WEI', troops: 10000, mirror: true,
        note: '[秦汉五阮关至明代内三关·太行蒲阴陉条石包砖关城] 太行第七陉，明正统十四年也先破紫荆关后景泰大修条石包砖九门关城（《明史·于谦传》《畿辅通志》），带「关」字且具石砖关墙，未成万人城，定险要。',
    },
    // ── 辽东幽州走廊关隘 ──
    { id: 'city_shanhaiguan', name: '山海关', factionId: 'ming_d', lat: 40, lng: 119.8, type: 'pass', troops: 10000, region: 'MING', buildingStyle: 'WEI', note: '[明洪武至崇祯末·燕山渤海走廊夯土包砖天下第一关] 洪武十四年徐达筑山海关关城及罗城、东西翼城，崇祯十七年吴三桂据关引清兵破李自成（《明史·徐达传》《明季北略》），带「关」字且具包砖关城，纯军事关防未成万人居民城，定险要。' },

    { id: 'city_wushengguan', name: '武胜关', factionId: 'song', lat: 31.83, lng: 114.01, type: 'pass', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', 
        note: '[南朝梁义阳三关至南宋·大别山鸡公岭块石关城] 古直辕、武阳关，与平靖、黄岘合称义阳三关，南朝梁蔡道恭、南宋董先凭关南北争衡（《梁书·蔡道恭传》《读史方舆纪要》），带「关」字且具石砌关墙，未成万人城，定险要。', troops: 10000 },
    // ── 齐鲁关隘 ──
    { id: 'city_mulingguan', name: '大岘关', factionId: 'qi', lat: 36.275259, lng: 118.660583, type: 'pass', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', mirror: true, note: '[春秋齐长城至东晋南燕·沂山大岘石砌夯土关塞] 齐长城穆陵关（大岘），义熙五年刘裕越过无备之大岘灭南燕慕容超（《左传·僖公四年》《宋书·武帝纪》），带「关」字且具石砌齐长城关墙，未成万人城，定险要。' },




    { id: 'city_qingshiguan', name: '青石关', factionId: 'tang', lat: 36.246502, lng: 117.715759, type: 'pass', region: 'CENTRAL',
buildingStyle: 'CENTRAL', troops: 10000,
        note: '[春秋齐长城至唐宋明·鲁中莱芜谷道块石关城] 齐长城要隘青石关，两山夹谷仅通一车，控临淄至泰山鲁中通道（《读史方舆纪要·山东五》），带「关」字且具块石关垣，未成万人城，定险要。',
    },
    {
        id: 'city_diaoyucheng',
        name: '钓鱼城',
        factionId: 'song',
        lat: 30.04, lng: 106.30,
        type: 'pass',
        region: 'BASHU',
        buildingStyle: 'BASHU',
        troops: 10000,
        note: '[南宋淳祐至祥兴抗蒙期·三江合流山巅条石悬崖要塞] 淳祐三年余玠、冉琎冉璞兄弟筑合州钓鱼城八门条石城垣，王坚、张珏坚守三十六年毙蒙哥汗（《宋史·余玠传》《元史·宪宗纪》），纯军事山城要塞且具完整石墙，定险要。',
    },
    { id: 'city_diezhou', name: '迭部', factionId: 'dangchang_guo', lat: 33.975273, lng: 103.482971, type: 'stockade', troops: 10000, region: 'TIBET', buildingStyle: 'TIBET', note: '[南北朝宕昌羌王梁弥定故地至唐武德置叠州合川郡·白龙江上游高山木石羌藏小州] 唐武德二年析芳州置叠州治合川县，《旧唐书·地理志》明载叠州全州二县合计仅户1,275、口7,674，安史后没入吐蕃筑木石高碉寨，在城不足2000人，定城寨。' },


    { id: 'city_panzhou', name: '潘寨', factionId: 'tang', lat: 33.578015, lng: 103.029785, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'TIBET', note: '[唐贞观置潘州（后改茂州羁縻、若尔盖求吉一带）·松潘草地高寒游牧羌蕃营聚] 唐松州西北羁縻羌蕃部族驻牧地（《新唐书·地理志》羁縻州无实编城郭大户），高寒草原帐幕与土石小寨常住不足2000人，定城寨。' },







    { id: 'city_maozhou', name: '汶山城', factionId: 'han_d', lat: 31.693115, lng: 103.867493, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[两汉蜀汉汶山郡治汶江·岷江上游高山峡谷夯土边郡小城] 汉武帝置、蜀汉复立汶山郡治汶江，《晋书·地理志》汶山全郡八县仅3,500户、《旧唐书·地理志》茂州全州四县仅2,510户，汉蜀代表阶段为夯土峡谷小城且城居不足5000，定城寨。' },


    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 2026-10-26 主人令「岭南归入湖广」→ HUGUANG：清远（广东）
    { id: 'city_qingyuan', name: '清远', factionId: 'chen', lat: 23.68, lng: 113.06, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[南朝梁置清远郡至宋明广州府北门清远县卫·北江出飞来峡条石包砖周六里县城] 扼粤北韶连南下广州北江水口，明洪武二十二年置清远卫与县同城修筑条石包砖城垣御瑶乱（《南齐书》《万历广东通志》），卫县同城军民与北江埠头逾1–1.5万且具砖石墙，定小城。' },

    { id: 'city_gaoque', name: '高阙塞', factionId: 'qin', lat: 41.195202, lng: 107.166138, type: 'pass', troops: 10000, region: 'HEXI', buildingStyle: 'XIANBEI', mirror: true, note: '[战国赵武灵王至秦汉·阴山狼山缺口石砌夯土边塞] 赵武灵王筑长城自代并阴山下至高阙为塞，前127年卫青出高阙破右贤王（《史记·匈奴列传》《水经注·河水》），史书明载边塞关口且具石土塞垣，未成万人城，定险要。' },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 2026-10-26 主人令「岭南归入湖广」→ HUGUANG：横浦关（广东南雄）：秦五岭关隘
    { id: 'city_hengpuguan', name: '横浦关', factionId: 'nanyue', lat: 25.32, lng: 114.26, type: 'pass', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[秦末南越至汉武平粤·大庾岭梅关道关塞] 秦末赵佗移檄横浦关绝新道，汉元鼎五年杨仆破石门横浦入番禺（《史记·南越列传》《汉书·两粤传》），带「关」字且史明为禁道三关之一，未成万人城，定险要。' },

    {
        id: 'city_yangshanguan',
        name: '阳山关',
        factionId: 'nanyue',
        lat: 24.78, lng: 112.65,
        type: 'pass',
        region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN',
        troops: 10000,
        mirror: true,
        tier: 2,
        note: '[秦末南越至汉唐·骑田岭连江峡口关塞] 南越国北境禁道三关之一，扼湘南骑田岭南下连江通道（《史记·南越列传》《水经注·洭水》），带「关」字且史书明载关塞，未成万人居民城，定险要。',
    },
    {
        id: 'city_huangxiguan',
        name: '湟溪关',
        factionId: 'nanhan',
        lat: 24.16, lng: 113.38,
        type: 'pass',
        region: 'JIANGNAN',
        // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 2026-10-26 主人令「岭南归入湖广」→ HUGUANG：湟溪关（广东）：秦五岭关隘
        buildingStyle: 'JIANGNAN',
        troops: 10000,
        note: '[秦末南越至五代南汉·连江入北江峡口关塞] 秦汉南越三关之一（英德连江口），控北江水陆咽喉（《汉书·南粤传》《元和郡县图志》），带「关」字且史书明确为关，未成万人居民城，定险要。'
    },
    { id: 'city_yinzhou', name: '绥德', factionId: 'wei', lat: 37.5119, lng: 110.2396, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[战国魏上郡雕阴秦扶苏蒙恬驻军至北宋绥德军明绥德州·无定河大理河汇口条石包砖山城] 秦太子扶苏与蒙恬统三十万众屯上郡肤施（今榆林绥德境），北宋元符筑绥德城抗夏、明包砖砌石（《史记·蒙恬列传》《延绥镇志》），陕北军商州城常住约1.5–2.5万，>1万定小城。' },

    { id: 'city_dongshengzhou', name: '增山', factionId: 'ming_d', lat: 39.810643, lng: 109.959412, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'WEI', note: '[西汉元朔置西河郡增山县·鄂尔多斯准格尔黄河西岸夯土边塞小县] 《汉书·地理志》西河郡三十六县之一增山县（有道通鸡鹿塞，东汉初即省废），西汉边塞夯土小县址狭小且查无城居人口记载，定城寨。；WEI＝河朔（中原高台阙楼）为最近代理，非精确' },



    // ── 战略要塞/县级城镇 (移入的小城) ──
    { id: 'city_lueyang', name: '略阳', factionId: 'fushi', lat: 33.33, lng: 106.15, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[汉武都略阳道、前秦氐人故地至南宋吴玠川陕大军根本兴州·嘉陵江畔条石包砖帅府城] 南宋绍兴至开禧间吴玠、吴璘、吴挺三代驻节兴州（略阳）统御前七万大军屏障西蜀七十年，升沔州（《宋史·吴玠传》《建炎以来系年要录》），军帅驻城与商旅坊市达2–3.5万，>1万定小城。' },

    { id: 'city_mianchi', name: '渑池', factionId: 'qin', lat: 34.76, lng: 111.76, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[战国秦赵渑池之会至两汉魏晋崤函驿道大邑渑池·涧河谷地夯土包砖县城] 前279年秦昭王与赵惠文王会于渑池（《史记·廉颇蔺相如列传》），唐置熊州、宋金元明为洛阳西通潼关咽喉大驿，明正德嘉靖改筑包砖石基城墙（《河南府志》），具包砖城墙且驿邑近万，定小城。' },




        {
        id: 'city_huaiyin',
        name: '淮安',
        factionId: 'song',
        lat: 33.5000, lng: 119.1300,
        type: 'medium_city',
        region: 'SONG',
        buildingStyle: 'CENTRAL',
        troops: 10000, note: '[南宋楚州至明代漕运总督驻节淮安府·包砖联城巨镇] 明中叶至万历间淮安旧城、新城、联城及清江浦、板闸漕盐连片关厢城居峰值约10–15万（《天启淮安府志》及傅衣凌、曹树基运河城市人口考算），>10万定中城。' },
    {
        id: 'city_dangyang',
        name: '当阳',
        factionId: 'shu',
        lat: 30.82, lng: 111.79,
        type: 'small_city',
        region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN',
        troops: 10000,
        note: '[战国楚昭王墓邑、汉当阳长坂至隋唐玉州明当阳县·沮漳河出山包砖条石城垣] 汉末长坂之战及关羽败走麦城古邑，明洪武景泰成化修筑青砖条石当阳县城（现存明代砖城遗迹，《三国志·先主传》《荆州府志》），具明代完整包砖石墙且县关常住约0.8–1.2万，定小城。',
    },
        {
        id: 'city_zaoyang',
        name: '枣阳',
        factionId: 'song',
        lat: 32.13, lng: 112.75,
        type: 'small_city',
        region: 'SONG',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        note: '[汉舂陵蔡阳光武龙兴地至南宋孟宗政孟珙抗金枣阳军·滚河畔包砖石基三壕铁城] 嘉定十年至十二年（1217–1219）孟宗政、扈再兴增筑枣阳军砖石内城外濠，率军民两万余众血战八十余日击退金完颜讹可十万围军（《宋史·孟宗政传》），>1万且具砖石坚城，定小城。' },

    { id: 'city_ruoqiang', name: '卡克里克', factionId: 'ruoqiang', lat: 38.987176, lng: 88.948059, type: 'stockade', region: 'WESTERN', buildingStyle: 'WESTERN', troops: 10000, note: '[西汉阳关外首当其冲婼羌国（卡克里克绿洲）·阿尔金山北麓随畜逐水草毡帐小行国] 《汉书·西域传》开篇明载婼羌国王号去胡来王，「户四百五十，口千七百五十，随畜逐水草不田作」，举国不足两千人且无城郭，定城寨。' },
    {
        id: 'city_qiemo',
        name: '播仙',
        factionId: 'qiemo',
        lat: 38.14, lng: 85.53,
        type: 'stockade', region: 'WESTERN',
        buildingStyle: 'WESTERN',
        troops: 10000, note: '[西汉南道且末国至唐贞观改置播仙镇·车尔臣河绿洲夯土小城] 《汉书·西域传》明载且末国全境仅「户二百三十，口千六百一十」，唐高宗上元中改且末城为播仙镇（玄奘《大唐西域记》记故城荒芜），夯土绿洲镇寨人口不足3000人，定城寨。' },
    {
        id: 'city_jingjue',
        name: '精绝',
        factionId: 'shanshan',
        lat: 37.06, lng: 82.69,
        type: 'stockade',
        region: 'WESTERN',
        buildingStyle: 'WESTERN',
        troops: 10000,
        note: '[两汉魏晋西域南道精绝国（尼雅遗址）·尼雅河尾闾红柳夹泥木骨散居绿洲聚落] 《汉书·西域传》明载精绝国全境仅「户四百八十，口三千三百六十」，斯坦因与中日尼雅考古确证其为无环城大墙之木骨泥墙散居果园聚落，4世纪沙埋废弃，定城寨。' },
    { id: 'city_pishan', name: '固玛', factionId: 'pishan', lat: 37.570718, lng: 78.250122, type: 'stockade', region: 'WESTERN', buildingStyle: 'WESTERN', troops: 10000, note: '[两汉丝路南道通罽宾分道口皮山国（固玛）·昆仑北麓夯土小绿洲邑] 《汉书·西域传》明载皮山国王治皮山城，全境仅「户五百，口三千五百」，举国仅三千五百人且为夯土小邑，定城寨。' },
        {
        id: 'city_weili',
        name: '库尔勒',
        factionId: 'weili',
        lat: 41.33, lng: 86.26,
        type: 'stockade', region: 'WESTERN',
        buildingStyle: 'WESTERN',
        troops: 10000, note: '[两汉塔里木北道尉犁国都·孔雀河畔夯土绿洲小城] 《汉书·西域传》明载尉犁国全境总人口仅「户千二百，口九千六百」，举国尚不满1万，王城城居仅两三千人且为夯土墙，定城寨。' },
    // 迪化 — 且弥清新都 (原庭州已删除)
    // 鹰娑川 — 土尔扈特 (天山尤鲁都斯/巴音布鲁克)
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 TURKS：鹰娑川：西突厥/突骑施牧地，归突厥 TURKS
    { id: 'city_yingsuochuan', name: '鹰娑川', factionId: 'tuerhute', lat: 42.869899, lng: 83.773499, type: 'stockade', troops: 10000, region: 'STEPPE_IMPERIAL', buildingStyle: 'MONGOL', note: '[唐显庆平阿史那贺鲁置鹰娑都督府至卫拉特土尔扈特牧地·天山尤尔都斯巴音布鲁克高山草甸牧营] 《新唐书·突厥传》《地理志》载鼠尼施处半部游牧鹰娑川（开都河上游），高寒天鹅湖草原历代皆为毡帐夏冬牧场无城郭且常住<1万，定城寨。' },
    // 沙图阿满 — 叛军 (清军哨卡)

    // 星星峡 — 叛军 (丝路关隘)
    { id: 'city_xingxingxia', name: '五峰燧', factionId: 'tang', lat: 41.611382, lng: 95.267944, type: 'pass', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[汉唐西域北道至明代·马鬃山峡口夯土夹苇烽燧军塞] 扼河西走廊入伊吾（哈密）峡谷要冲，现存汉唐至明夯土夹红柳烽燧及关塞墩台（《元和郡县图志》《明一统志》），纯守道边防军台且具夯土塞体，未成万人城，定险要。；与嘉峪关同属河西，项目无 HEXI 独立分支，用 HEXI（标签「河西（边墙要塞）」）作河西边墙代理，键名旧、非辽式' },

    // 赤亭 — 叛军 (吐鲁番绿洲)
    { id: 'city_chiting', name: '赤亭关', factionId: 'gaochang', lat: 42.85, lng: 91.5, type: 'pass', troops: 10000, region: 'WESTERN_FEUDAL', buildingStyle: 'WESTERN', note: '[唐安西西州至吐蕃争夺期·天山南路夯土守捉关城] 唐置赤亭镇守捉扼伊吾至高昌戈壁孔道（今鄯善七克台夯土古城，《元和郡县图志》卷四十、《新唐书·地理志》），带「关」字且具夯土关城，未成万人城，定险要。' },


    {
        id: 'city_xiye',
        name: '叶城',
        factionId: 'xiye',
        lat: 37.884, lng: 77.430,
        type: 'stockade',
        region: 'WESTERN',
        buildingStyle: 'WESTERN',
        troops: 10000,
        note: '[两汉昆仑北麓西夜子合国·呼犍谷夯土山麓小邑] 《汉书·西域传》明载西夜国全境仅「户三百五十，口四千」，举国仅四千人，谷地小邑人口不足2000且无石砖城郭，定城寨。' },





    { id: 'city_xiuxun', name: '休循', factionId: 'khoja', lat: 39.709286, lng: 73.22937, type: 'stockade', troops: 10000, region: 'WESTERN_IMPERIAL', buildingStyle: 'WESTERN', note: '[两汉葱岭西塞种行国休循国·帕米尔阿赖山谷鸟飞谷毡帐游牧聚落] 《汉书·西域传》明载休循国王治鸟飞谷，「户三百五十八，口千三十，民俗衣服类乌孙，因畜随水草，本故塞种也」，举国仅千余人且无城郭，定城寨。', mirror: true },
    { id: 'city_yinai', name: '英吉沙尔', factionId: 'yarkand', lat: 38.929502, lng: 76.225891, type: 'stockade', region: 'WESTERN_IMPERIAL',
buildingStyle: 'WESTERN', troops: 10000,
        note: '[喀喇汗至16至17世纪叶尔羌汗国西道驿镇英吉沙尔·昆仑山北麓生土泥砖绿洲小邑] 疏勒与莎车间驿路手工制刀绿洲镇英吉沙尔（清乾隆筑土城在1759年后超限不采），≤1700年叶尔羌汗国时期仅为生土泥砖小集镇且常住不足5000人，定城寨。',
    },
    { id: 'city_yumenguan', name: '玉门关', factionId: 'guiyi', lat: 40.35, lng: 93.86, type: 'pass', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[西汉元鼎至东汉魏晋·疏勒河南岸夯土小方盘关城] 汉武帝置玉门关扼丝路北道咽喉，现存小方盘城夯土关垣高近十米（《汉书·西域传》、敦煌汉简），带「关」字且具坚固夯土城墙，纯关塞无万人城，定险要。' },


    { id: 'city_yangguan', name: '阳关', factionId: 'yangguan', lat: 39.92, lng: 94.06, type: 'pass', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', mirror: true, note: '[西汉元鼎至唐代·敦煌南湖古董滩夯土关塞烽燧] 与玉门关同置，位于玉门关之南故称阳关，扼丝路南道出口（《史记·大宛列传》《元和郡县图志》），带「关」字且具夯土塞墙烽燧，未成万人城，定险要。' },





    { id: 'city_wuzhousai', name: '善无', factionId: 'zhao', lat: 39.998214, lng: 112.420349, type: 'stockade', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[战国赵武灵王置雁门郡治善无至两汉善无县·晋北右玉南河盆地夯土塞下县城] 战国李牧守雁门郡驻节及两汉雁门郡治善无故城（右玉威远镇西古城村夯土城址，《史记·廉颇蔺相如列传》《汉书·地理志》），秦汉边塞夯土郡县城居无确数且<1万，定城寨。' },

    // ── 2026-06-18 新增：李靖@恶阳岭（贞观四年定襄夜袭）──
    { id: 'city_eyangling', name: '恶阳岭', factionId: 'tang', lat: 39.910000, lng: 111.650000, type: 'stockade', troops: 10000, region: 'NORTH', buildingStyle: 'XIANBEI', mirror: true, note: '[东汉南匈奴庭美稷北屏至唐贞观四年李靖奇袭东突厥通道·阴山白道东翼山地营聚恶阳岭] 贞观四年正月李靖率三千骁骑自马邑进屯恶阳岭乘夜雪袭破颉利可汗定襄牙帐（《旧唐书·李靖传》），系阴山山岭行军屯营点，名不带关且无常设关墙，人口<1万，定城寨。' },
    { id: 'city_jilusai', name: '鸡鹿塞', factionId: 'han_d', lat: 40.46, lng: 106.26, type: 'pass', troops: 10000, region: 'XIANBEI', buildingStyle: 'HEXI', note: '[西汉太初至东汉·阴山哈隆格乃峡口石砌障塞] 汉朔方郡窳浑县西北石塞，前51年呼韩邪单于入朝由鸡鹿塞、永元元年窦宪出鸡鹿塞北伐，现存方形片石塞城高墙（《汉书·匈奴传》《后汉书·窦宪传》），具石墙且未成万人城，定险要。' },





    {
        id: 'city_guyangsai',
        name: '固阳塞',
        factionId: 'han_d',
        lat: 41.10, lng: 110.08,
        type: 'pass',
        region: 'CENTRAL',
        buildingStyle: 'XIANBEI',
        troops: 10000,
        tier: 2,
        note: '[秦昭襄王长城至两汉北魏·阴山五原北石筑夯土塞城] 秦汉五原郡北长城要塞，扼包头昆都仑沟阴山通道，现存石砌与夯土障城遗迹（《汉书·地理志》《水经注·河水》），史明为长城边塞且具塞墙，未成万人城，定险要。' },
    { id: 'city_xiayangdu', name: '龙门', factionId: 'han_d', lat: 35.602, lng: 110.452, type: 'stockade', troops: 10000, region: 'CENTRAL', buildingStyle: 'WEI', note: '[战国魏吴起守西河至楚汉韩信木罂渡军取魏豹·黄河禹门口龙门渡津聚落] 黄河出晋陕峡谷古夏阳—蒲坂北端龙门津渡（《史记·淮阴侯列传》《水经注·河水》），名字不带关隘堡戍且古津渡无合围砖石关城，岸畔渡村人口不足3000人，定城寨。' },

    // ── 战略渡口 ──
    { id: 'city_piaoyujin', name: '漂渝津', factionId: 'sui', lat: 39.02, lng: 117.6, type: 'stockade', isPort: true, troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[东汉建安至隋代征辽海口津渡·海河入海口夯土军漕渡聚] 建安十一年曹操凿平虏、泉州渠自漂渝津入海征乌桓，隋设怀远镇渡口（《三国志·武帝纪》《隋书》），汉隋代表阶段为河海津渡小聚落无石砖关城且人口<1万，定城寨。' },


    // ── 太行陉关隘 ──
    { id: 'city_tianjinguan', name: '天井关', factionId: 'murong', lat: 35.27, lng: 112.93, type: 'pass', troops: 10000, region: 'CENTRAL', buildingStyle: 'WEI', mirror: true, note: '[战国汉晋至唐宋明·太行第二陉条石包砖关城] 扼太行绝顶晋城南下河内沁阳咽喉，东汉王梁破赤眉、刘琨筑关御石勒，明筑砖石关楼（《后汉书·王梁传》《读史方舆纪要》），带「关」字且具石砖墙，未成万人城，定险要。' },



];

// ============================================================
// 周边 — 待添加 (日本七道、朝鲜八道、各古政权首都)
// ============================================================
export const PERIPHERY: CityDataV2[] = [
    { id: 'city_dali_city', name: '羊苴咩', factionId: 'dali', lat: 25.6983, lng: 100.1488, type: 'medium_city', troops: 10000, region: 'DALI', buildingStyle: 'BASHU' , note: '[南诏至大理国都羊苴咩城·苍山洱海石砖夯土王都] 南诏异牟寻定都至大理国盛期羊苴咩城（东临洱海西倚苍山，南北十余里城垣）城居峰值约8–12万（樊绰《蛮书》卷二及方国瑜《云南史料目录概说》考算），≥8万容差线，定中城。' },




    // ── 2026-05-25 唐朝势力新增周边据点 ──
    { id: 'city_mengshe', name: '蒙舍城', factionId: 'nanzhao', lat: 25.058278, lng: 100.500183, type: 'small_city', region: 'NANZHAO',
buildingStyle: 'BASHU', troops: 10000,
        note: '[唐初六诏蒙舍诏（南诏）发祥旧都至明蒙化直隶厅卫·巍山坝子条石包砖周六里方城] 细奴逻、皮逻阁统一六诏迁太和前之南诏根本故都（樊绰《蛮书·六诏第一》），明正统十三年左氏土司与蒙化卫合筑条石包砖四门方城（拱辰楼现存），城关常住约1.5–2万，>1万定小城。',
    },
    {
        id: 'city_hanseong',
        name: '汉城',
        factionId: 'joseon',
        lat: 37.52, lng: 126.98,
        type: 'medium_city',
        troops: 10000,
        tier: 1,
        region: 'GORYEO',
        buildingStyle: 'KOREA',
        note: '[17世纪朝鲜王朝都城汉阳·花岗岩巨石都城垣] 朝鲜显宗十年（1669）汉城府五部城内及城底十里官方户籍实测194,030人、肃宗年间约20万（《朝鲜王朝实录·显宗实录》及韩国国史编纂委员会考证），>10万定中城。' },
    { id: 'city_pyongyang', name: '平壤', factionId: 'gaogouli', lat: 39.02, lng: 125.76, type: 'small_city', troops: 10000, region: 'KOREA', buildingStyle: 'KOREA' , note: '[5至7世纪高句丽后期长安城王都至高丽西京朝鲜监营·四重石土城垣] 427年高句丽迁都平壤，586年筑长安城四重石筑外郭（周23公里，668年唐苏定方李勣破城，《旧唐书·高丽传》载高句丽盛时京邑数万户），高丽西京期Chandler 1100年表4万，>1万定小城。' },


    { id: 'city_kaesong', name: '开城', factionId: 'goryeo', lat: 37.97, lng: 126.55, type: 'medium_city', isPort: true, troops: 10000, region: 'KOREA', buildingStyle: 'KOREA' , note: '[11至12世纪高丽王朝开京盛期·石筑罗城与内城] 高丽文宗至仁宗盛期开京罗城（周23公里石土混筑）内五部三十五坊人口约10–15万（徐兢《宣和奉使高丽图经》卷三「城中户十余万」折实及韩国学界考算），>10万定中城。' },

    { id: 'city_hamhung', name: '咸兴', factionId: 'goryeo', lat: 39.968685, lng: 127.499084, type: 'stockade', troops: 10000, 
        note: '[汉沃沮故地、高丽尹瓘筑东北九城咸州至朝鲜太祖李成桂潜邸咸兴府·城川江卵石土筑邑城] 1107年高丽尹瓘征女真筑咸州城旋还，李成桂晚年归居咸兴（《高丽史·尹瓘传》《朝鲜王朝实录》），≤1700年北道苦寒边邑咸兴城内民户仅数千人未满1万，定城寨。', region: 'GORYEO',
        buildingStyle: 'KOREA' },
    { id: 'city_longer', name: '笼耳', factionId: 'joseon', lat: 40.967, lng: 129.551, type: 'stockade', troops: 10000, region: 'GORYEO', buildingStyle: 'KOREA', note: '[朝鲜世宗开拓豆满江六镇之会宁都护府（古女真斡木河／笼耳）·图们江岸木栅石土边镇] 明宣德至正统间建州女真猛哥帖木儿旧居斡木河，1434年朝鲜世宗金宗瑞设会宁镇（《世宗实录》），实为豆满江屯田军民杂居小邑而非单立关门，≤1700年城内常住约3000–5000人<1万，定城寨。' },

    { id: 'city_guoyuancheng', name: '国原城', factionId: 'joseon', lat: 36.991, lng: 127.926, type: 'small_city', troops: 10000, region: 'JOSEON', buildingStyle: 'KOREA' , note: '[7至10世纪统一新罗五小京之中原京至朝鲜忠州邑城·南汉江花岗岩石筑邑城] 新罗真兴王拓地置国原小京、统一期定为中原京迁贵戚豪民实之（《三国史记·地理志》），高丽朝鲜筑花岗岩忠州石邑城（1592年申砬弹琴台背水战处），具完整石砌邑城且盛期城居约1–1.5万，定小城。' },

    { id: 'city_geumseong', name: '锦城', factionId: 'baiji', lat: 35.015, lng: 126.71, type: 'small_city', troops: 10000, region: 'KOREA', buildingStyle: 'KOREA' , note: '[后三国泰封与高丽太祖王建攻取罗州至朝鲜罗州牧·全罗道四大石筑邑城] 全罗道锦城（罗州牧），筑周3.7公里花岗岩巨石四门邑城（东渐门、南顾门现存），《世宗实录地理志》与壬辰前全罗首邑城内及附邑坊里逾1–1.5万且具完整石墙，定小城。' },


    { id: 'city_jeonju', name: '完山', factionId: 'baiji', lat: 35.75, lng: 127.14, type: 'small_city', troops: 10000, region: 'KOREA', buildingStyle: 'KOREA' , note: '[统一新罗九州之完山州、后百济甄萱王都至朝鲜全罗监营·石砖四门全州府城] 900–936年甄萱建后百济定都完山（全州，《三国史记·甄萱传》），朝鲜王朝为李氏丰沛本贯与全罗道观察使驻城，筑石砖四门府城（丰南门现存），城居达2–3万，>1万定小城。' },


    { id: 'city_jindo', name: '鸣梁', factionId: 'joseon', lat: 34.487, lng: 126.263, type: 'stockade', isPort: true, troops: 10000, region: 'JOSEON', buildingStyle: 'KOREA', note: '[高丽三别抄抗蒙珍岛龙藏山城至1597年李舜臣鸣梁大捷·珍岛碧波津海峡水军营寨] 万历二十五年（1597）九月李舜臣以十三舰于鸣梁海峡急流击溃日舰百三十余艘（李舜臣《乱中日记》《惩毖录》），系海岛水军营垒与渔村聚落，常住不足5000人，定城寨。', mirror: true },


    {
        id: 'city_suncheon_k',
        name: '顺天',
        factionId: 'joseon',
        lat: 34.9652, lng: 127.4991,
        type: 'small_city',
        isPort: true,
        troops: 10000,
        tier: 4,
        region: 'JOSEON',
        buildingStyle: 'KOREA',
        note: '[高丽升州牧至朝鲜全罗左道重镇顺天府·3.4公里花岗岩石筑顺天邑城] 朝鲜世宗十二年重筑周3.4公里石砌顺天府邑城（《新增东国舆地胜览》卷四十），壬辰倭乱全罗左水营后方大邑，具完整石砌城垣且邑治人口约0.8–1.2万，定小城。' },
    {
        id: 'city_gimhae',
        name: '金海',
        factionId: 'gaya',
        lat: 35.23, lng: 128.88,
        type: 'stockade',
        isPort: true,
        troops: 10000,
        tier: 4,
         
        note: '[公元1至6世纪伽倻联盟盟主金官伽倻王都（驾洛国）·洛东江口凤凰洞夯土贝冢环壕王邑] 金首露王建金官伽倻国都，532年法兴王时并入新罗置金官小京（《三国遗事·驾洛国记》及金海凤凰台发掘报告），早期铁器时代夯土木栅港邑人口查无确数且未满1万，定城寨。', region: 'GOJOSEON',
        buildingStyle: 'KOREA' },
    { id: 'city_jincheng_silla', name: '金城', factionId: 'xinluo', lat: 35.808912, lng: 129.210205, type: 'medium_city', region: 'KOREA',
buildingStyle: 'KOREA', troops: 10000, tier: 0,
        note: '[8世纪统一新罗盛期·石筑王京坊里城] 统一新罗王京金城（庆州）坊里建成区约15–20平方公里，现代考古与城市史折算城居峰值约10–20万（《三国遗事》十七万八千九百三十六户含王畿夸饰不取，Chandler估5–10万、韩国学界折中10–20万），定中城。',
    }, // 金城：按「边缘算大城」保留（2026-10-25），依据见 note
        { id: 'city_haeju', name: '瀑池', factionId: 'goryeo', lat: 38.03, lng: 125.71, type: 'stockade', isPort: true, troops: 10000, region: 'GORYEO', buildingStyle: 'KOREA', note: '[高丽太祖赐名海州（古瀑池／孤竹）至朝鲜黄海道海州牧·首阳山南麓海湾小牧邑] 高丽成宗置海州牧，《世宗实录地理志》卷一五二明载海州牧全境乡村合计仅户1,683、口6,757，举州城乡尚不足七千口、邑内仅二三千人，定城寨。' },

    { id: 'city_longwan', name: '龙湾', factionId: 'xingliao', lat: 40.1967, lng: 124.5306, type: 'stockade', troops: 10000, region: 'KOREA', buildingStyle: 'KOREA', note: '[辽保州、1029年大延琳兴辽国声援地至高丽朝鲜鸭绿江口义州龙湾馆·江岸互市迎使驿邑] 中朝使臣渡鸭绿江首站义州龙湾，《世宗实录地理志》载义州牧全境合计户仅1,400余、口约6,000余，≤1700年邑内常住仅数千人<1万，定城寨。', mirror: true },

    // === 第三批新增据点 ===
    { id: 'city_fuhan', name: '枹罕', factionId: 'qifu_d', lat: 35.6, lng: 103.21, type: 'small_city', troops: 10000, region: 'HEXI', buildingStyle: 'CENTRAL' , note: '[汉护羌校尉治、十六国乞伏西秦三十年国都至唐宋河州·大夏河畔夯土包砖王都州城] 太初元年至永康间乞伏乾归、炽磐定都枹罕（今临夏），唐置河州安乡郡、北宋王韶克河州，明置河州卫包砖筑城为茶马司重镇（《晋书·乞伏炽磐载记》《河州志》），西秦国都及明茶马城达2–3.5万，>1万定小城。' },

    // ---- 从 CITIES_LEGACY 迁移的城市 ----
    { id: 'city_qishan', name: '岐山', factionId: 'zhou', lat: 34.506539, lng: 107.487488, type: 'small_city', region: 'CENTRAL',
buildingStyle: 'CENTRAL', troops: 10000,
        note: '[西周岐邑王都至晚唐五代李茂贞岐国都凤翔府·周原5.2平方公里大城与夯土包砖凤翔城] 先周至西周王都周原岐邑（考古探明外城垣5.2平方公里），唐至德升西京凤翔府、晚唐岐王李茂贞建都（《新唐书·地理志》凤翔府户58,486，《旧五代史·李茂贞传》天复围城军民数万），城居达3–5万，>1万定小城。',
    },
    { id: 'city_tongwancheng', name: '统万城', factionId: 'helian', lat: 38.024286, lng: 109.14917, type: 'small_city', troops: 10000, region: 'KHITAN', buildingStyle: 'XIANBEI' , note: '[东晋义熙九年赫连勃勃大夏国都统万城·无定河北白垩石英砂蒸土夯筑铁壁三城] 赫连勃勃发十万众以白灰石英糯米汁蒸土筑东西二城及外郭（「锥入一寸即杀筑者」，《晋书·赫连勃勃载记》），北魏夏州治，大夏国都极盛期迁关中河西工匠豪族实京城居达3–5万，>1万定小城。' },


    { id: 'city_qiuchi', name: '上禄', factionId: 'qiuchi', lat: 33.86, lng: 105.3, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[两汉武都郡上禄县至魏晋南北朝氐王杨氏百顷仇池山上国都·西和洛峪四面峭壁夯土山顶氏都] 氐人杨驹、杨难当世据仇池山顶平地二十余里天然绝壁立国抗衡南北朝（《宋书·氐胡传》《水经注·漾水》），非守道关门而系山地小王邑，山顶田庐常住数千人<1万且无砖石外郭，定城寨。' },



    { id: 'city_ganquanyi', name: '武都', factionId: 'caowei', lat: 33.4293, lng: 105.1419, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[两汉武都郡治、魏晋杨氏仇池外屏至唐宋阶州明阶州直隶州·白龙江北岸条石包砖州城] 扼陇蜀阴平道咽喉，蜀汉建兴七年陈式克武都、诸葛亮亲诣定郡，明洪武五年千户潘同改筑条石包砖阶州旧城与新城（《三国志·后主传》《阶州直隶州续志》），州卫军民逾1–1.5万且具砖石墙，定小城。' },



    { id: 'city_dangchang', name: '阴平', factionId: 'qiuchi', lat: 33.6997, lng: 104.5239, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[西汉置阴平道（北部都尉治）至景耀六年邓艾偷渡阴平入蜀·白水江畔文县夯土山谷小邑] 《汉书·地理志》广汉郡阴平道（有氐人杂居称道），263年邓艾自阴平凿山通道出江油（《三国志·邓艾传》），汉魏代表阶段为峡谷夯土小道城且人口不足5000，定城寨。' },


    { id: 'city_daixian', name: '灵仙', factionId: 'hou_jin', lat: 39.842285, lng: 114.408875, type: 'small_city', region: 'NORTH',
buildingStyle: 'WEI', troops: 10000,
        note: '[战国代王城、唐兴唐灵仙至后晋石氏蔚州明蔚州卫·壶流河北岸万历包砖周七里铁城] 后晋割幽云十六州之蔚州，明洪武十年指挥周房拓筑二十四座敌楼、高三丈五尺包砖石基蔚州铁城（玉皇阁与砖城完好现存，《辽史·地理志》《蔚州志》），州卫同城军民商贾约1.5–2.5万，>1万定小城。',
    },
    {
        id: 'city_ningan',
        name: '龙泉府',
        factionId: 'bohai',
        lat: 44.128997,
        lng: 129.295349,
        type: 'small_city',
        troops: 10000,
        tier: 1,
        
        note: '[8至10世纪初唐代渤海国百六十年首都上京龙泉府·牡丹江畔周16.3公里玄武岩条石夹土外郭都城] 大钦茂天宝末迁都上京龙泉府，仿唐长安规制筑外城、内城、宫城三重（现存宁安东京城玄武岩巨石宫墙与十门遗址，《新唐书·渤海传》），按16平方公里条坊建成区考古折算城居达3–6万，>1万定小城。', region: 'MOHE',
        buildingStyle: 'NORTHEAST' },

    // 🔴 [2026-09-18 主人定「渤海是靺鞨人，和女真同源」] 本据点＝**渤海西京鸭绿府**（后为辽渌州），
    //    原挂 KOREA 高丽（一级 ASIA）错 —— 渤海属靺鞨（肃慎系），与女真同源 → 改 NORTHEAST 女真；
    //    文化区随龙泉府（渤海治所）用 MOHE 靺鞨。对照：高句丽（扶余/濊貊系）仍归 KOREA，两者不同源。
    { id: 'city_yalu', name: '鸭绿府', factionId: 'bohai', lat: 41.81, lng: 126.91, type: 'stockade', region: 'MOHE',
        buildingStyle: 'NORTHEAST', troops: 10000,
        note: '[唐代渤海国西京鸭绿府·鸭绿江上游临江山谷夯土卵石小城] 《新唐书·渤海传》载西京鸭绿府领神、桓、丰、正四州控朝贡鸭绿道，峡谷盆地狭小、查无城居人口史料且未满万人，定城寨。',
    },
    { id: 'city_jilishan', name: '蒺藜山', factionId: 'dajin', lat: 42.25, lng: 121.80, type: 'stockade', troops: 10000, 
        note: '[辽末保大至金初·辽西医巫闾北麓山地营寨] 保大二年（1122）金军完颜宗望追击辽天祚帝战于显州蒺藜山（《辽史·天祚皇帝纪》《金史·太祖纪》），系山地交兵营聚，名字不带关隘堡戍且无常设关墙，人口<1万，定城寨。', region: 'JURCHEN',
        buildingStyle: 'XIANBEI' },

    // ── 2026-05-26 新建势力：大金(会宁府)、大元(上都) ──
    { id: 'city_huining', name: '会宁府', factionId: 'dajin', lat: 45.519798, lng: 126.971741, type: 'medium_city', troops: 10000, region: 'JURCHEN', buildingStyle: 'NORTHEAST', note: '[金初上京会宁府盛期·夯土南北双城皇都] 金熙宗至海陵王迁燕前上京会宁府南北双城（约6平方公里）城居峰值约10–12万（《金史·地理志》上京路会宁府户31,270及阿城白城遗址考古密度折算），>10万定中城。' },


    { id: 'city_shangdu', name: '上都', factionId: 'yuan_d', lat: 42.275283, lng: 115.760193, type: 'small_city', troops: 10000, region: 'STEPPE', buildingStyle: 'XIANBEI' , note: '[元代夏都开平上都·包砖石宫城与夯土外城] 元上都外城4.84平方公里大半为北苑皇家猎囿，宫城、皇城与关厢常住军民工匠约4–6万（《元史·地理志》上都路及叶新民《元上都研究》，巡幸短期随扈不计常住），<8万容差线，定小城。' },



    // 额尔古纳已删：室韦都城为俱轮泊 city_julunbo
    { id: 'city_hetuala', name: '赫图阿拉', factionId: 'manzhou_d', lat: 41.715981, lng: 125.032654, type: 'small_city', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[明万历三十一年至天命六年努尔哈赤后金开国都城赫图阿拉（兴京）·苏子河石砌土筑内外两重都城] 万历三十一年努尔哈赤筑内城、三十三年筑周九里外城，万历四十四年（1616）于此建元天命立八旗（《满洲实录》《清太祖武皇帝实录》明载内外城居八旗劲旅工匠家口逾两万），>1万定小城。' },

    { id: 'city_wuguo', name: '五国城', factionId: 'dajin', lat: 46.32, lng: 129.56, type: 'stockade', region: 'JURCHEN',
buildingStyle: 'NORTHEAST', troops: 10000,
        note: '[辽五国部至金初胡里改路·松花江口依兰夯土方城] 辽五国部越里吉城、金靖康后羁押徽钦二帝处（依兰五国头城遗址周长仅2.2公里夯土城垣，《辽史·营卫志》《金史·地理志》），边疆女真夯土小城不足5000人，定城寨。',
    },
    
    { id: 'city_yanran', name: '燕然山', factionId: 'tujue', lat: 46.276728, lng: 102.801819, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[匈奴龙城外屏至隋唐东突厥薛延陀驻牧杭爱山（古燕然山）·漠北森林草原游牧汗帐牧地] 北方游牧汗国核心夏牧场燕然山脉，开皇间隋军出塞、唐贞观平薛延陀置燕然都护府（《隋书·突厥传》《旧唐书·铁勒传》），草原毡帐游牧聚落无城墙且单营<1万，定城寨。' },

    { id: 'city_langjuxu', name: '狼居胥山', factionId: 'menggu_d', lat: 47.687578, lng: 108.528442, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[西汉元狩四年霍去病封狼居胥山至12世纪乞颜蒙古源出地肯特山·漠北高山密林游牧营地] 前119年霍去病大破左贤王封狼居胥山祭天，后为蒙古部族游牧林山（《史记·卫将军骠骑列传》《元朝秘史》），无城郭且游牧散营人口<1万，定城寨。' },

    { id: 'city_luoxie', name: '逻些', factionId: 'tubo', lat: 29.65, lng: 91.1, type: 'medium_city', troops: 10000, region: 'TIBET', buildingStyle: 'TIBET', mirror: true , note: '[8至9世纪吐蕃帝国极盛期·红山石砌宫堡与逻些建成区] 赤松德赞至热巴巾时期吐蕃王都逻些（拉萨河谷大昭寺八廓建成区与红山宫堡）峰值人口约8–10万（Chandler公元800年表列逻些10万），≥8万容差线，定中城。' },



    { id: 'city_guanglu', name: '光禄城', factionId: 'shatuo', lat: 41.9, lng: 108.2, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'XIANBEI' , note: '[西汉光禄塞故址至唐末沙陀边地·阴山北麓夯土塞城聚落] 西汉太初三年光禄勋徐自为筑塞垣列城，唐振武北境沙陀驻牧边邑（《汉书·匈奴传》《新唐书·沙陀传》），夯土塞邑无万人居民记载，定城寨。' },

    { id: 'city_yanran_stone', name: '燕然勒石', factionId: 'xueyantuo', lat: 45.203318, lng: 104.677734, type: 'stockade', troops: 10000, region: 'MONGOL', buildingStyle: 'MONGOL', note: '🔴 [2026-11-07 按史补依据] 燕然山刻石处（杭爱山）；人口待考：≤1700 年城居人口查不到 → 按 2026-10-25 标准③末行「查不到人口 → 城寨」置城寨（2026-10-28 按史补注）' },


    { id: 'city_luhun', name: '涿邪山', factionId: 'han_d', lat: 43.58829, lng: 104.661255, type: 'stockade', troops: 10000, region: 'STEPPE_FEUDAL', buildingStyle: 'MONGOL', note: '[西汉去病赵破奴北征至南北朝柔然汗国南道涿邪山（阿尔泰东延尼赤金山）·戈壁北缘山地牧营] 汉天汉年间出塞会师地及北魏拓跋焘北伐柔然经行山岭（《汉书·匈奴传》《魏书·蠕蠕传》），沙漠山地游牧歇马水源地，无城垣且常住<1万，定城寨。' },
    { id: 'city_chilechuan', name: '九原', factionId: 'qin', lat: 40.591029, lng: 110.044556, type: 'small_city', troops: 10000, region: 'HEXI', buildingStyle: 'WEI', note: '[战国赵九原、秦三十六郡之九原郡治至西汉五原郡治九原·阴山南麓黄河套北岸夯土大郡城] 秦始皇筑直道自云阳直抵九原，西汉元朔二年卫青收河南地置五原郡治九原（《史记·秦始皇本纪》《汉书·地理志》五原郡户39,322，包头麻池古城南北双城逾3平方公里），秦汉北边大本营城居约1.5–2.5万，>1万定小城。；同增山口径取 WEI（河朔）为最近代理，非精确' },

    { id: 'city_lanshi', name: '蓝氏城', factionId: 'guishuang', lat: 36.71248, lng: 67.08252, type: 'medium_city', troops: 10000, region: 'KUSHAN', buildingStyle: 'CENTRAL_ASIA' , note: '[贵霜至萨曼伽色尼期巴尔赫·泥砖夯土外郭巨城] 巴克特里亚古都蓝氏城（巴尔赫）10–12世纪伊斯兰盛期外郭巴拉希萨尔与拉巴特连片城区约10平方公里，蒙古破城前城居约10–15万（伊本·豪卡勒《大地志》及Chandler 1200年表），>10万定中城。' },



    { id: 'city_sabi', name: '泗沘', factionId: 'baiji', lat: 36.255354, lng: 126.949768, type: 'small_city', isPort: true, region: 'KOREA',
buildingStyle: 'KOREA', troops: 10000,
        note: '[538至660年百济后期国都泗沘（扶余）·扶苏山城与8公里石土罗城条坊王都] 百济圣王十六年自熊津迁都泗沘，筑东、北石土罗城围合棋盘五部二十二巷王都，显庆五年（660）苏定方破泗沘俘义慈王（《三国史记·百济本纪》及扶余罗城考古），都城峰值约3–5万，>1万定小城。',
    },
    
    { id: 'city_edo', name: '江户城', factionId: 'tokugawa', lat: 35.75, lng: 139.8007, type: 'big_city', isPort: true, troops: 10000, note: '[17世纪江户幕府元禄期·巨石垣总构城下町] 元禄六年（1693）江户町方实测353,588人，合旗本大名武家屋敷与寺社人口，≤1700年连片城下町峰值约60–70万（鬼头宏《日本二千年の人口史》），>50万定大城。', region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN' },

 // [2026-05-30] 升 big_city: 江户幕府 264 年 + 1700 年代百万人口世界第一

    {
        id: 'city_kyoto',
        name: '京都',
        factionId: 'ashikaga',
        lat: 35.01,
        lng: 135.77,
        type: 'big_city',
        troops: 10000,
        tier: 1,
        region: 'JAPAN',
        buildingStyle: 'JAPAN',
        note: '[室町至江户宽永盛期·土垒石垣洛中都城] 宽永十一年（1634）《京都御役所向大概觉书》实载洛中町方410,089人，合公家、武家与寺社人口约45万（≤1700年城居确证），≥40万容差线，定大城。' },
    { id: 'city_tainan', name: '承天', factionId: 'ming_zheng', lat: 22.99, lng: 120.2, type: 'small_city', isPort: true, troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[荷建普罗民遮赤嵌砖堡至1662至1683年明郑东宁王都承天府·安平热兰遮红砖棱堡与十字大街都邑] 永历十五年郑成功克红砖棱堡热兰遮与普罗民遮城，改设东宁承天府划定东安、西定、宁南、镇北四坊，明郑时期至康熙台湾府治城坊军民商贾达2.5–4万（江日昇《台湾外记》《台湾府志》），>1万定小城。' },

    { id: 'city_weirong', name: '威戎', factionId: 'yiqu', lat: 35.585841, lng: 105.512695, type: 'pass', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[北宋熙宁元丰秦凤路御夏防线·陇山葫芦河道夯土军寨堡] 北宋经略熙河与防御西夏于秦州陇城西筑威戎军堡控陇右通道（《宋史·地理志三》《元丰九域志》），纯守道军事夯土寨堡且未成万人居民城，定险要。' },

    { id: 'city_xingtai', name: '邢台', factionId: 'hou_zhao', lat: 37.07, lng: 114.50, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[商祖乙迁邢、战国赵信都至十六国石勒后赵帝国首都襄国·太行东麓建德大城夯土包砖帝都] 319–335年石勒、石虎定都襄国（邢台），营建建德殿、沣水宫及周二十余里外郭城（《晋书·石勒载记》载徙司冀青雍豪族数万户实襄国），后赵国都极盛期城居达5–7万，>1万定小城。' },

    { id: 'city_shengle', name: '盛乐', factionId: 'tuoba', lat: 40.38, lng: 111.82, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'XIANBEI' , note: '[曹魏甘露至北魏道武迁平城前·和林格尔夯土早期鲜卑王城] 拓跋力微始居、拓跋猗卢与什翼犍修筑盛乐南北城（《魏书·序纪》及和林格尔土城子遗址），北魏迁平城前尚处部落联盟转制期，夯土城垣内常住不足1万，定城寨。' },

    
    { id: 'city_izumo', name: '月山富田', factionId: 'amago', lat: 35.377853, lng: 133.148804, type: 'pass', troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[日本战国尼子氏全盛期·月山石垣土垒连郭山城] 尼子经久、晴久三代本城月山富田城，凭急峻山脊筑石垣、土垒与堀切，天文十一年大败大内义隆围攻（《阴德太平记》），山城要塞具石垣土垒且常住<1万，定险要。' },
    { id: 'city_satsuma', name: '鹿儿岛城', factionId: 'shimazu', lat: 31.6003, lng: 130.5583, type: 'small_city', isPort: true, troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN' , note: '[17世纪江户萨摩岛津七十七万石藩都·城山石垣鹤丸城与鹿儿岛城下町] 庆长六年（1601）岛津忠恒筑鹤丸石垣居城并设鹿儿岛城下士屋敷与三町商区，17世纪后期藩都城居约3–4万（斋藤诚治《江户时代的都市人口》及《鹿儿岛县史》），>1万定小城。' },

    // // [DATA LOST - emishi deleted]
    { id: 'city_shuri', name: '首里', factionId: 'ryukyu', lat: 26.22, lng: 127.72, type: 'small_city', isPort: true, region: 'SONG', buildingStyle: 'JAPAN', troops: 10000, tier: 1, note: '[15至17世纪琉球王国第二尚氏王都·珊瑚石灰岩高墙首里城与那霸连片港都] 尚真王集诸按司聚居首里石城，下接长虹石堤连结那霸唐荣外贸商港，明清册封使陈侃、徐葆光《中山传信录》实记首里王都与那霸连片常住约2–3万且具巨石城垣，定小城。；🔴 [2026-11-11 补标] 【建筑风格代理】琉球王国按司石城（Gusuku）与御岳信仰，67键无琉球，取最近JAPAN' },
    { id: 'city_tsushima', name: '金石馆', factionId: 'so', lat: 34.2031, lng: 129.2892, type: 'stockade', isPort: true, troops: 10000, 
        note: '[高丽末倭寇征讨与江户对马府中宗氏十万石格居馆·严原金石馆土垒石垣小港町] 朝鲜贸易窗口对马岛宗义智居馆金石城（无天守阁之屋敷馆城），全对马岛山田贫瘠，元禄年间府中严原港町常住仅约5000–7000人<1万且町区无环城墙，定城寨。', region: 'JAPAN_IMPERIAL',
        buildingStyle: 'JAPAN' },
    { id: 'city_yoshida', name: '吉田郡山', factionId: 'mori', lat: 34.438616, lng: 132.530823, type: 'pass', troops: 10000, 
        note: '[日本战国毛利元就期·安艺可爱川石垣土垒山城] 毛利元就本据吉田郡山城，全山设二百余曲轮、本丸石垣与重重堀切，天文九年以寡击破尼子诠久三万军（《毛利家文书》），军事山城具石垣土垒且<1万，定险要。', region: 'JAPAN_IMPERIAL',
        buildingStyle: 'JAPAN' },
    { id: 'city_kasugayama', name: '春日山', factionId: 'uesugi', lat: 37.16, lng: 138.24, type: 'pass', troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[日本战国上杉谦信期·越后颈城高峻土垒空堀山城] 长尾氏至上杉谦信山城要塞春日山城，依险构筑巨型夯筑土垒、大空堀与百余曲轮控北陆道咽喉（《北越军谈》），具夯土垒墙之军事山城且山上<1万，定险要。' },
    { id: 'city_tsutsujigasaki', name: '躑躅崎馆', factionId: 'takeda', lat: 35.6688, lng: 138.4991, type: 'stockade', troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[日本战国武田信虎信玄胜赖三代六十年本据·甲府盆地北缘单层土垒空堀武家馆（踯躅崎馆）] 永正十六年（1519）武田信虎筑踯躅崎馆，信玄秉持「人是城、人是石垣」终身不筑高城巨石垣而仅设方形夯筑土垒与堀（《甲阳军鉴》），1582年武田灭亡毁弃，馆下古府中不足1万确数，定城寨。' },

    { id: 'city_okafu', name: '冈丰城', factionId: 'chosokabe', lat: 33.5972, lng: 133.5756, type: 'stockade', isPort: true, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', troops: 10000, note: '[日本战国长宗我部元亲统一四国初期本城·高知平原北丘土垒空堀小山城（冈丰城）] 长宗我部氏累代居城，考古发掘仅诘诺段存少量低矮积石而主体为土垒堀切山城，1588年迁大高坂浦户后彻底废城，冈丰山下市集仅两三千人<1万，定城寨。' },
    { id: 'city_himeji', name: '姬路城', factionId: 'toyotomi', lat: 34.8394, lng: 134.6939, type: 'small_city', troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN' , note: '[安土桃山至江户前期·白漆天守巨石垣姬路城下町] 丰臣秀吉筑城、池田辉政大扩建后形成播磨藩首府姬路城下町，1650–1700年町方合武家常住城居达2.1–2.5万（斋藤诚治《江户时代的都市人口》），已成超万人城市不再算设施，定小城。' },

    { id: 'city_utsunomiya', name: '宇都宫城', factionId: 'utsunomiya', lat: 36.604491, lng: 139.858704, type: 'small_city', region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', troops: 10000, note: '[镰仓战国宇都宫氏本据至江户奥州街道大藩城·本多正纯修筑土垒石垣城下町] 日光社参必经奥州街道首邑宇都宫，元和年间本多正纯大修城郭与町割，元禄年间（≤1700）城下町常住人口约1.2–1.5万（《宇都宫市史》町方武家合算），>1万定小城。' },
    { id: 'city_tsuruga', name: '鹤之城', factionId: 'toyotomi', lat: 37.4878, lng: 139.9297, type: 'small_city', region: 'JAPAN_IMPERIAL',
buildingStyle: 'JAPAN', troops: 10000,
        note: '[安土桃山至江户前期·蒲生氏巨石垣会津若松城下町] 文禄元年蒲生氏乡扩建鹤之城并整备若松城下町，1650–1700年会津藩城下常住人口达2.5–2.7万（斋藤诚治《江户时代的都市人口》及《会津藩家世实纪》），已逾1万按城判，定小城。',
    },
    // ── 2026-06-11 日本精锐：北条@小田原、伊贺@名张（恶党/千早城距飞鸟宫旧址3km）──
    { id: 'city_nabari', name: '名张', factionId: 'iga_d', lat: 34.627, lng: 136.108, type: 'stockade', troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[日本战国天正伊贺之乱百地丹波众据点·大和伊贺交界山地惣村土垒馆砦群名张] 伊贺地侍自治联盟「伊贺惣国一揆」南部核心名张（柏原城等方形高土垒豪族屋敷，《伊乱记》），江户为藤堂藩支封阵屋町，无城郭环墙且常住仅约3000–4000人<1万，定城寨。' },


    // ── 2026-06-16 新增：日本令制国补点（方案A·6城）──
    { id: 'city_jianghu', name: '金泽', factionId: 'kaga_d', lat: 36.56, lng: 136.65, type: 'small_city', region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', troops: 10000, note: '[安土桃山前田利家入封至江户元禄加贺百万石藩都·高石垣金泽城下町] 前田氏金泽城下町据元禄十年（1697）《国事杂抄》官方实测本町与地子町12,085户共68,636人，合少量陪臣约7–7.5万（确证逾6.8万而未满8万中城容差线），定小城。' },
    { id: 'city_xiantai', name: '青叶馆', factionId: 'date_d', lat: 38.27, lng: 140.87, type: 'small_city', isPort: true, troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[17世纪江户伊达六十二万石藩都·青叶山巨石垣与仙台棋盘城下町] 庆长六年（1601）伊达政宗营建青叶城石垣与广濑川东岸仙台城下町，宽文至元禄年间（1660–1700）武家合町人城居达5–5.7万（斋藤诚治《江户时代的都市人口》），>1万定小城。' },

    { id: 'city_xiongben', name: '熊本', factionId: 'nanchou', lat: 32.81, lng: 130.71, type: 'small_city', region: 'JAPAN', buildingStyle: 'JAPAN', troops: 10000, note: '[庆长六年加藤清正筑城至江户细川五十四万石藩都·武者返巨石垣熊本城下町] 1601–1607年加藤清正筑高大扇形石垣熊本巨城并迁古府中商工入新町、古町，17世纪中后期城下武家与町人达4–5万（斋藤诚治《江户时代的都市人口》），>1万定小城。' },
    // 🔴 [2026-09-19 主人令「村上武吉换成源义经」「行就换」] 松山（伊予国）的守将改为**源义经**。
    //    史实依据：1184 年一之谷后，兄长源赖朝为义经奏请**伊予守**，伊予国即其守地；
    //    1185 年他确在伊予国忽那岛一带统率水军 —— 符合「在本处当官 / 执行过任务也行」。
    //    故本城势力由 `iyo_d`（伊予·村上水军）改为 **`genji_iyo`（伊予源氏）**，
    //    守将随势力锚定 = 源义经。村上武吉则回其**真本据能岛城**（见下条），不再是「无城武将」。
    // 🔴 [2026-09-19 主人质问「sagami 也是空势力，你没改回去吗」后自查] 松山为满足 50km 铁律微移：
    //    新增能岛城（真址 34.18238,133.08109）后与松山仅 47.72km，不足 50km。
    //    能岛是海岛、位移即失真，故只由松山一侧让位：沿「背离能岛」方向外移 3km
    //    （33.84,132.77 → 33.8185,132.7505），仍在本松山市境内。
    //    先例：箱根关西移 3km、高岛西移 7.7km、江户城东北移 9km（均为凑 50km，主人已认可的口径）。
    //    移后松山最近邻：能岛城 50.7km / 吉田郡山 71.9km / 冈丰城 80.2km，全图无 <50km 的对。
    { id: 'city_songshan', name: '松山', factionId: 'genji_iyo', lat: 33.8185, lng: 132.7505, type: 'small_city', isPort: true, troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[17世纪伊予松山十五万石藩都·胜山高石垣天守与城下町] 庆长七年（1602）加藤嘉明筑胜山巨石垣平山城并规画城下町，后久松松平氏入封，元禄年间城下武家与町人常住约1.6–2万（《爱媛县史》），>1万且具石垣，定小城。' },
    // 🔴 [2026-09-19 主人「能岛／因岛能添加上吗」「同理 iyo_d 也是空势力，你没改回去吗」]
    //    **能岛城** —— 村上武吉（能岛村上氏当主）的**真本据**，国指定史迹「能岛城迹」，
    //    濑户内海村上水军三家的中枢；坐标为城迹真实位置（マピオン 能岛城迹 34.18237848,133.08109418），未做位移。
    //    势力 `iyo_d`（伊予）由此恢复「有城」状态（此前松山让给伊予源氏后成了空势力）。
    //    注：能岛与因岛真实相距仅 15.86km，二岛只能取其一；取武吉本人的能岛。
    { id: 'city_noshima', name: '能岛城', factionId: 'mori', lat: 34.18238, lng: 133.08109, type: 'stockade', isPort: true, troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[日本室町至战国濑户内海能岛村上水军大本营·芸予诸岛急流礁岛木栅土垒海贼城] 村上武吉统领水军课收帆别钱之无人小礁岛能岛（周长仅850米，全岛削平为三段曲轮与船溜木桩穴，日本国史迹），天正十六年海贼停止令后废弃，纯木栅土垒海寨不足千人，定城寨。' },

    { id: 'city_funei', name: '府内', factionId: 'otomo_d', lat: 33.24, lng: 131.61, type: 'small_city', isPort: true, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', troops: 10000, note: '[16世纪大友宗麟九州霸权与南蛮贸易商都·丰后府内条坊与江户石垣府内城] 天文至天正间大友义镇（宗麟）治下丰后府内设耶稣会学院与西式医院，日本考古发掘中世丰后府内町屋遗迹及耶稣会士书信估盛期人口达2–3万，庆长筑石垣府内城，>1万定小城。' },
    { id: 'city_gaodao', name: '高岛', factionId: 'suwa_d', lat: 36.0138, lng: 137.9662, type: 'stockade', region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', troops: 10000, note: '[日本战国信浓诹访大社大祝诹访赖重本据（茶臼山高岛旧城）·诹访湖畔土垒丘城] 天文十一年（1542）武田晴信攻灭诹访赖重所据茶臼山高岛城（江户湖中浮城系日根野高吉1592–1598年另筑），战国中世本据为土垒山城且江户三万石小藩町民仅约4000–5000人<1万，定城寨。' },
    { id: 'city_shangdang', name: '长子', factionId: 'qin', lat: 36.148974, lng: 113.008118, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'WEI' , note: '[战国韩赵上党冯亭以郡嫁祸至秦汉上党郡治长子、北朝隋唐潞州上党·太行山顶盆地夯土包砖重城] 长平之战导火索韩上党郡治，隋唐昭义军节度使治所潞州（及长子县城，明包砖修筑，《史记·白起王翦列传》《新唐书·地理志》），上党高原军政中心城居达2–3.5万，>1万定小城。' },




    { id: 'city_fanyang', name: '范阳', factionId: 'da_yan', lat: 39.48, lng: 115.98, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[秦汉涿郡治涿县（旁领范阳）至唐涿州辽南京巡属、明景泰包砖涿州巨城·拒马河南岸天下第一州] 刘备张飞故里汉涿郡大邑（《汉书·地理志》涿郡户195,607），唐大历置涿州范阳军，明景泰包砖修筑周九里涿州高城及永济桥南北关厢拱卫京南（《涿州志》），城关人口达3–5万，>1万定小城。' },
    { id: 'city_chenjun', name: '新蔡', factionId: 'tang', lat: 32.75, lng: 114.98, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[春秋蔡平侯迁都新蔡至东晋汝南郡治、唐淮西吴元济东屏新蔡·汝洪两水汇口夯土包砖城垣] 春秋晚期蔡国国都新蔡（发掘葛陵楚简与周二十里春秋蔡都夯土故城，《左传·昭公十一年》），两汉汝南大邑，明正德嘉靖修筑包砖县城，春秋国都期城居达2–3万，>1万定小城。' },


    { id: 'city_qufu', name: '曲阜', factionId: 'kong_d', lat: 35.6, lng: 116.98, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[西周春秋战国鲁国八百年故都曲阜·洙泗之间周11.7公里夯土包石大城与明正德包砖孔庙县城] 伯禽受封鲁都曲阜（鲁故城遗址实测面积10.45平方公里，内含周公庙宫城与冶铁制骨大作坊区，《史记·鲁周公世家》及《曲阜鲁国故城》发掘报告），春秋战国盛期都城人口达4–6万，>1万定小城。' },


        

    { id: 'city_fusicheng', name: '伏俟城', factionId: 'xihai_d', lat: 36.76089, lng: 99.742126, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'TIBET' , note: '[南北朝至隋唐吐谷浑汗国王都·青海湖西铁卜加夯土小王城] 夸吕可汗建都伏俟城（今共和铁卜加夯土古城仅约0.04平方公里），《北史·吐谷浑传》明载「虽有城郭而不居，恒处穹庐随水草畜牧」，城内常住不足3000人且为夯土墙，定城寨。' },

    {
        id: 'city_xianglin',
        name: '象林',
        factionId: 'champa',
        lat: 15.00, lng: 108.50,
        type: 'small_city',
        region: 'VIETNAMESE',
        buildingStyle: 'KHMER',
        troops: 10000,
        note: '[2至5世纪占婆林邑王国早期都城（茶荞／区粟城）·周八里二丈高烧砖城垣王都] 汉日南郡象林县故地、区连建林邑国都，《水经注·温水》卷三十六明载林邑王城「周围八里一百步，砖城二丈，上起砖墙一丈」，南朝宋元嘉二十三年宗悫破城（《宋书·宗悫传》），具完整烧砖城墙且王都逾万，定小城。；🔴 [2026-11-11 按史改] 据点文化 VIETNAMESE→KHMER（代理）：占婆林邑都城，印度化红砖神庙塔',
    },
    // ── 2026-05-25 新增：秦朝核对追加势力城市 ──
    {
        id: 'city_lushi',
        name: '陆浑关',
        factionId: 'yun',
        lat: 34.05, lng: 111.05,
        type: 'pass',
        region: 'CENTRAL',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        mirror: true,
        note: '[春秋陆浑戎至秦汉唐·伏牛山伊水谷道夯土石基关隘] 古名伏流城、陆浑关，扼洛阳西南通武关、南阳山谷捷径（《左传·僖公二十二年》《元和郡县图志》），带「关」字且史明为关塞，未成万人城，定险要。',
    },//镜像
    
    {
        id: 'city_puyang',
        name: '濮阳',
        factionId: 'hou_zhou',
        lat: 35.7621, lng: 115.0291,
        type: 'small_city',
        region: 'CENTRAL',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        note: '[春秋卫国帝丘国都、后周郭威发祥澶州至北宋景德澶渊之盟开德府·黄河夹寨南北双城重镇] 春秋卫成公迁都帝丘，五代晋汉周黄河津要澶州（分河南北两城加铁索浮桥），景德元年宋真宗亲征定盟（《左传》《宋史·地理志》开德府崇宁户31,878），南北双城驻军与市民达3–5万，>1万定小城。',
    },
    { id: 'city_xucheng', name: '符离', factionId: 'ming_d', lat: 33.65, lng: 116.97, type: 'small_city', troops: 10000, region: 'MING', buildingStyle: 'CENTRAL' , note: '[秦汉符离县至唐元和置宿州扼通济渠汴河咽喉、明宿州包砖石城·淮北漕运军商重镇] 唐宪宗置宿州控汴水江淮漕粮命脉（白居易《宿州水亭》），南宋隆兴李显忠符离之战争夺名城，明洪武十年采青石包砖筑周六里宿州坚城（《元和郡县图志》《宿州志》），汴渠盛期及明代城居达2–3万，>1万定小城。' },

    // ── 2026-05-25 新增：汉朝补全半成品势力城市 ──
    
    // ── 2026-05-25 新增：汉朝核对追加势力都城 ──
    {
        id: 'city_zhaoge',
        name: '朝歌',
        factionId: 'shang',
        lat: 35.60, lng: 114.18,
        type: 'small_city',
        region: 'CENTRAL',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        note: '[商末帝乙帝辛陪都朝歌、西周卫国初都至两汉河内大邑·淇水畔夯土王城邑郭] 商纣王别都鹿台所在、周封康叔卫都（《史记·殷本纪》《卫康叔世家》），两汉河内郡大县兼袁绍起兵屯粮重邑，商末西周王都及两汉盛期城居约2–3万，>1万定小城。',
    },
    { id: 'city_liuxian', name: '六安', factionId: 'huainan', lat: 31.74, lng: 116.5, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[秦末汉初黥布九江淮南王都六县至汉六安国都、宋明六安州·淠河东岸包砖周七里州城] 皋陶封地、项羽封英布为九江王都六、汉武帝置六安国（《史记·黥布列传》《汉书·地理志》），明洪武十四年包砖修筑周七里六安州城，汉王国都及明州城人口达1.5–2.5万，>1万定小城。' },


    

    // ── 2026-05-25 新增：三国核对追加势力都城 ──
    {
        id: 'city_xiapi',
        name: '下邳',
        factionId: 'lvbu',
        lat: 33.888642,
        lng: 117.877808,
        type: 'small_city',
        region: 'CENTRAL',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        note: '[战国齐威王封邹忌下邳、汉初韩信楚王都至东汉三国徐州牧治所·沂泗交汇夯土三重水城] 《续汉书·郡国志》下邳国领十七城户136,389，建安三年曹操决沂泗水灌吕布所守下邳大城与白门楼（《三国志·吕布传》），两汉三国徐州首府在城人口达3–5万，>1万定小城。' },
    // ── 2026-05-25 新增：两晋核对追加势力城市 ──
    {
        id: 'city_xiurongchuan',
        name: '秀容川',
        factionId: 'erzhu',
        lat: 38.42, lng: 112.73,
        type: 'stockade',
        region: 'NORTH',
        buildingStyle: 'WEI',
        troops: 10000,
        note: '[北魏末尔朱契胡盛期·晋北忻定河谷游牧部落聚落] 北魏赐尔朱羽健世领秀容川三百里畜牧繁息，尔朱荣自此统契胡铁骑入洛（《魏书·尔朱荣传》），系河谷游牧领地聚落，名不带关隘堡戍且无砖石关墙，城居<1万，定城寨。',
    },

    // ── 2026-05-25 新增：隋朝核对追加势力城市 ──
    
    
    
    

    { id: 'city_songmo', name: '马盂山', factionId: 'kumoxi', lat: 41.017350, lng: 118.699036, type: 'stockade', region: 'STEPPE',
buildingStyle: 'XIANBEI', troops: 10000,
        note: '[唐契丹库莫奚至辽中京北·七老图山脉游牧王帐山寨] 奚族可突于、回离保长期据守之马盂山牧地营寨（《旧唐书·北狄传》《辽史·地理志》），系山地游牧驻帐据点，名字不带关隘堡戍且无正式关城墙垣，人口<1万，定城寨。',
    },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：高凉（广东）：汉地郡治
    { id: 'city_gaoliang', name: '高凉', factionId: 'liren', lat: 21.9, lng: 110.8, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[南朝梁陈至隋初岭南圣母冼夫人三代幕府治所高凉郡·漠阳江流域夯土包砖郡州城] 梁大同置高州高凉郡，冼英统岭南百越十余州保障一方（《隋书·谯国夫人传》），宋明阳江、高州修筑砖石城垣，南朝隋初幕府军政驻城及宋明城居约1.2–2万，>1万定小城。' },

    { id: 'city_beishacheng', name: '卑沙城', factionId: 'gaogouli', lat: 39.444692, lng: 121.959229, type: 'pass', isPort: true, troops: 10000, region: 'NORTH', buildingStyle: 'KOREA', note: '[高句丽晚期海防重塞·辽东大黑山楔形条石山城] 高句丽筑大黑山石砌山城扼辽东半岛海陆门户，贞观十九年（645）张亮率水师渡海夜袭拔卑沙城（《旧唐书·张亮传》及大黑山石城遗址考古），具完整石墙且未成万人居民城，定险要。' },


    // ── 2026-05-25 唐朝势力新增周边据点(续) ──
    { id: 'city_suiye', name: '碎叶', factionId: 'liao_d', lat: 42.8, lng: 75.2667, type: 'small_city', troops: 10000, region: 'KARA_KHITAN', buildingStyle: 'WESTERN' , note: '[唐调露元年王方翼筑安西四镇之碎叶镇城·楚河阿克贝希姆双城垣100公顷绿洲大邑] 《旧唐书·王方翼传》明载调露元年筑碎叶城「三旬而毕，立四面十二门皆为屈曲隐出以设伏」，吉尔吉斯阿克贝希姆遗址实测主城35公顷加拉巴特外城60公顷，粟特商胡与唐军驻城达1.5–2.5万，>1万定小城。' },


    { id: 'city_nieduo', name: '孽多', factionId: 'xiaobolu', lat: 35.92, lng: 74.3, type: 'stockade', region: 'TIBET', buildingStyle: 'TIBET', troops: 10000, note: '[汉难兜国至唐天宝六载高仙芝远征小勃律王都孽多城·吉尔吉特河谷高山木石王寨] 小勃律王没谨忙、苏失利之所居孽多城，前临娑夷水（吉尔吉特河）藤桥险道，天宝六载高仙芝断藤桥破城虏勃律王（《新唐书·西域传》《高仙芝传》），帕米尔深谷小国都人口不足8000且无规整砖石大郭，定城寨。' },

    // ── 2026-05-26 更新：窝鲁朵八里→富贵城/拜巴里（色楞格河畔漠北回鹘陪都）──

    { id: 'city_woluduobali', name: '卜古罕城', factionId: 'huihu', lat: 47.8, lng: 107.5, type: 'small_city', troops: 10000, region: 'MONGOL', buildingStyle: 'MONGOL' , note: '[8至9世纪漠北回鹘汗国首都斡耳朵八里（卜古罕城／哈剌巴剌合孙）·25平方公里夯土宫堡与十二铁门农商汗都] 骨力裴罗至保义可汗百年国都，821年阿拉伯旅行家塔米姆·伊本·巴赫尔亲访实记该城筑有十二座巨型铁门、街市人口稠密、外环大片水渠农庄（Minorsky 1948译注考证），汗都常住达2–4万，>1万定小城。' },


    
    { id: 'city_jinshan', name: '额尔齐斯', factionId: 'huite', lat: 46.939014, lng: 89.598999, type: 'stockade', region: 'CENTRAL_ASIA',
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CENTRAL_ASIA：额尔齐斯：辉特（卫拉特蒙古）关隘，归鞑靼（中亚草原）
buildingStyle: 'MONGOL', troops: 10000,
        note: '[大蒙古国至卫拉特辉特部·阿尔泰南麓河谷毡帐牧营] 额尔齐斯河上游卫拉特辉特部阿睦尔撒纳游牧驻帐河谷（《元朝秘史》《平定准噶尔方略》），属草原游牧营地，名字不带关隘堡戍且无城墙，人口<1万，定城寨。',
    },
    { id: 'city_dafang', name: '大方城', factionId: 'luodian', lat: 27.046910, lng: 105.707703, type: 'small_city', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[蜀汉济火罗甸至明代贵州水西宣慰使安氏总治大方城·慕俄格九层衙与崇祯周十里条石九门巨城] 奢香夫人开龙场九驿，天启崇祯平奢安之乱后总督朱燮元于大方采巨型青条石修筑周十里、高二丈余威宁镇大方石城（《明史·四川土司传》《黔西州志》），土司王城及明石城逾1–1.5万且具巨石墙，定小城。',
    },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：晋兴（广西南宁）：晋置晋兴郡，汉地州郡
    { id: 'city_yongzhou', name: '晋兴', factionId: 'nongzhigao', lat: 22.81, lng: 108.31, type: 'small_city', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[东晋晋兴郡至唐邕州经略军、北宋皇祐侬智高建大南国都及明南宁府·邕江北岸包砖城垣] 皇祐四年侬智高破邕州称仁惠皇帝改号南天国、次年狄青昆仑关破之（《宋史·狄青传》《广源州蛮传》），明洪武包砖扩筑南宁府城控左江右江总汇，城关商民约2–3万，>1万定小城。' },

    { id: 'city_qingxi', name: '帮源洞', factionId: 'fangla', lat: 29.6, lng: 119.04, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[北宋宣和二年方腊起义誓师大本营睦州青溪帮源洞·浙西淳安深山木石溪谷山寨] 方腊托摩尼教聚众于青溪县漆园帮源洞起兵连破六州（方勺《青溪寇轨》《宋史·童贯传》），系深山溪峒村落营寨无城墙且常住不足3000人，定城寨。' },


    // ── 2026-05-25 北宋辽金势力 v2 ──
    { id: 'city_dengzhou', name: '蓬莱', factionId: 'yang_aner', lat: 37.82, lng: 120.72, type: 'small_city', isPort: true, troops: 10000, region: 'NORTH', buildingStyle: 'CENTRAL' , note: '[唐神龙移登州治蓬莱至北宋刀鱼水师、明洪武备倭登州卫府双城·丹崖山石砖水城与周九里砖石府城] 唐新罗渤海朝贡登陆主港，明洪武九年于宋刀鱼水寨址筑条石包砖蓬莱水城并扩筑登州府砖城设登莱巡抚（《新唐书·地理志》《登州府志》），水陆军商达2.5–3.5万，>1万定小城。' },

    { id: 'city_jiaoxi', name: '黔陬', factionId: 'qi', lat: 36.228777, lng: 119.924011, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[战国齐黔陬、汉胶西高密至北宋元祐设市舶司板桥镇明胶州城·胶州湾西岸包砖海贸州城] 北宋哲宗元祐三年于密州板桥镇（今胶州）特设密州市舶司为北方唯一法定海贸巨港，海商云集，明洪武包砖修筑胶州城（《宋史·食货志下八》《胶州志》），宋市舶港及明州城达2–3万，>1万定小城。' },






    // ── 2026-05-25 元朝蒙古势力新增城市 ──
    // 第一类：西征摧毁政权
    { id: 'city_urgench', name: '玉龙杰赤', factionId: 'huarazim', lat: 42.24, lng: 59.63, type: 'medium_city', troops: 10000, region: 'CENTRAL_ASIA_CASTLE', buildingStyle: 'CENTRAL_ASIA', mirror: true , note: '[12至13世纪初花剌子模帝国都城·烧砖泥砖巨邑] 1221年蒙古围城前花剌子模帝都古尔干吉（玉龙杰赤）城区逾10平方公里，城居峰值约15–20万（雅库特《地名辞典》亲历记述及Chandler 1200年表），>10万定中城。' },


    { id: 'city_merv', name: '木鹿', factionId: 'seljuq', lat: 37.616410, lng: 62.234802, type: 'medium_city', region: 'SELJUQ', buildingStyle: 'SASANIAN', troops: 10000, note: '[12世纪大塞尔柱东都期·烧砖夯土双郭大城] 塞尔柱苏丹桑贾尔时期马鲁（木鹿）苏丹卡拉城垣及外郭连片城区约12平方公里，城居峰值约20万（Chandler 1150年表20万；50万旧说混入穆尔加布全绿洲农村不采），<40万而>10万，定中城。' },
    { id: 'city_pagan', name: '蒲甘', factionId: 'pagan', lat: 21.207449, lng: 94.894409, type: 'medium_city', troops: 10000, tier: 1, region: 'BURMESE', buildingStyle: 'BURMESE', note: '[12至13世纪蒲甘王朝极盛期·红砖城垣与连片佛塔城区] 阿隆悉都至那罗波帝悉都时期蒲甘王城垣及伊洛瓦底江畔连片聚落峰值约8–15万（Aung-Thwin及Hudson蒲甘聚落考古测算；Chandler 1200年表10–15万），≥8万定中城。' },
        // 第二类：四大汗国
    { id: 'city_almaliq', name: '弓月城', factionId: 'geluolu', lat: 43.979013, lng: 79.648132, type: 'small_city', region: 'TURKS',
buildingStyle: 'CENTRAL_ASIA', troops: 10000, mirror: true,
        note: '[13至14世纪察合台汗国首都阿力麻里（唐弓月城故地）·伊犁河谷夯土砖饰商都] 成吉思汗西征会师地及察合台汗国主都，耶律楚材《西游录》与丘处机《长春真人西游记》亲历记其引水入城、百果繁茂、回汉工匠万家，13世纪盛期城居约2–3万，>1万定小城。',
    },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CENTRAL_ASIA：也迷里：乃蛮/窝阔台汗国建牙处，归鞑靼（中亚草原）
    { id: 'city_emil', name: '也迷里', factionId: 'menggu_d', lat: 46.481378, lng: 83.633423, type: 'stockade', region: 'STEPPE', buildingStyle: 'CENTRAL_ASIA', troops: 10000, note: '[西辽至13世纪初窝阔台潜邸封地·额敏河谷夯土草原小城] 耶律大石始筑、窝阔台封地也迷里城（《元史·太宗纪》及额敏古城夯土遗址），系游牧汗廷附属河谷夯土小邑，史无万人居民记载，定城寨。' },
    // 第三类：蒙古草原部落
    { id: 'city_kereyid', name: '汪吉河', factionId: 'kereyid', lat: 46.600064, lng: 104.570618, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[12世纪末漠北克烈部王汗（脱斡邻勒）春冬牙帐·翁金河与黑林草原毡帐斡耳朵] 成吉思汗义父克烈部王汗驻牧翁金河（汪吉河）与土拉河黑林之地（《元朝秘史》），草原游牧汗帐营地无固定城垣且单营常住<1万，定城寨。' },

    { id: 'city_naiman', name: '金微山', factionId: 'tujue', lat: 47.64, lng: 88.29, type: 'stockade', troops: 10000, region: 'CENTRAL_ASIA', buildingStyle: 'MONGOL', note: '[东汉窦宪破北匈奴金微山、唐贞观羁縻金微都督府·阿尔泰山中段森林草原游牧营地] 永元三年（91）耿夔出居延塞围北单于于金微山大破之，唐以铁勒仆骨部置金微都督府（《后汉书·窦宪传》《新唐书·回鹘传》），山地游牧驻帐无城墙且<1万，定城寨。' },

    { id: 'city_fuhai', name: '福海', factionId: 'naiman', lat: 47.036450, lng: 87.352295, type: 'stockade', region: 'STEPPE',
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CENTRAL_ASIA：福海：乃蛮小城，归鞑靼（中亚草原）
buildingStyle: 'MONGOL', troops: 10000,
        note: '[12世纪末至13世纪初乃蛮部太阳汗冬牧大营·乌伦古湖与布伦托海河谷毡帐营地] 阿尔泰山南麓乃蛮部塔阳汗冬季避寒游牧草场（《元朝秘史》《元史·太祖纪》），毡帐牧营无城垣且常住<1万，定城寨。',
    },
    { id: 'city_tatar', name: '额布都格', factionId: 'tatar', lat: 47.182253, lng: 117.726746, type: 'stockade', region: 'STEPPE',
buildingStyle: 'MONGOL', troops: 10000,
        note: '[辽金阻卜塔塔儿六部核心牧地与1202年答阑捏木儿格思战场·呼伦贝尔哈拉哈河草原营盘] 金章宗明昌七年完颜襄合铁木真破塔塔儿蔑古真笑儿罕、1202年成吉思汗全歼塔塔儿四部于哈拉哈河流域（《金史·完颜襄传》《元朝秘史》），草原游牧营地无城墙，定城寨。',
    },

    { id: 'city_merkit', name: '买卖城', factionId: 'manzhou_d', lat: 50.264779, lng: 106.152649, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[12世纪蔑儿乞三部脱黑脱阿色楞格河牧地（清雍正五年1727年后始建恰克图买卖城）·河谷木栅营聚] 清俄恰克图互市买卖木城建于1727年（晚于1700年红线不采）；≤1700年该地为色楞格河支流蔑儿乞部与喀尔喀土谢图汗游牧渡口，无石砖城垣且常住<1万，定城寨。' },

    // 第四类：汉军世侯及元末军阀
    // 第五类：元末起义政权
    
    {
        id: 'city_xinhui', name: '厓山', factionId: 'song',
        lat: 22.53, lng: 113.04, type: 'stockade', troops: 10000, tier: 4,
        
        note: '[南宋祥兴二年（1279）张世杰陆秀夫奉帝昺抗元终战地·新会崖门海口木栅行宫水寨] 张世杰于崖山与汤瓶山夹海结千余巨舰连环水寨、岸筑草木行朝屋宇抗张弘范元军（《宋史·二王纪》《元史·张弘范传》），临时木栅水陆军寨（非守道常设石关亦非万人城），定城寨。', region: 'JIANGNAN',
        // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：厓山（广东新会）：宋末海战处，汉地
        buildingStyle: 'JIANGNAN' },
    { id: 'city_ninghai', name: '白峤', factionId: 'ming_d', lat: 29.2757, lng: 121.4182, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[晋置宁海县、唐白峤驿至明嘉靖抗倭台州北门·白溪北岸嘉靖条石砌筑周千丈县城垣] 方孝孺故里，明嘉靖三十一年知县林大梁采坚厚花岗条石环筑宁海县城周千一百余丈拒倭寇（《嘉靖宁海县志》《台州府志》），城内坊隅户籍约0.9–1.3万且具完整条石城墙，定小城。' },


    {
        id: 'city_zhenghe', name: '政和', factionId: 'dacheng',
        lat: 27.37, lng: 118.86, type: 'stockade', troops: 10000, tier: 4,
        
        note: '[五代王审知置关隶镇、北宋政和五年因贡白毫银针茶升政和县·闽北松溪上游山谷夯土卵石小县] 元至元间黄华于建宁政和起兵，明景泰前长期无城、正德嘉靖间始砌溪卵石矮垣周五百余丈（《八闽通志》《政和县志》），闽北偏远山县在城民户仅三四千人<1万，定城寨。', region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN' },
    {
        id: 'city_zhangzhou', name: '龙溪', factionId: 'tang',
        lat: 24.51, lng: 117.65, type: 'small_city', isPort: true, troops: 10000,
        
        note: '[唐宋漳州治至明代月港海贸期漳州府城·条石包砖周九里大邑] 唐垂拱置漳州治龙溪，南宋绍兴筑石城、明洪武万历包砖扩建府城垣，嘉靖隆庆海澄月港兴起后漳州府城与南厢商民达3–5万（《万历漳州府志》及曹树基考算），>1万且具砖石墙，定小城。', region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN' },
    { id: 'city_tingzhou', name: '黄连', factionId: 'tang', lat: 26.26, lng: 116.65, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[唐开元置汀州长汀郡（初驻黄连后移长汀）至宋明客家人首府汀州府·汀江条石包砖周六里府城] 控闽粤赣三省食盐官运枢纽，宋绍兴与明洪武四年因山临汀江修筑条石包砖六门府城（济川门现存，《崇祯汀州府志》），在城长汀县及水东盐埠关厢达2.5–3.5万，>1万定小城。' },


    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：瑞金（江西）：宋瑞金监，客家大本营
    { id: 'city_ruijin', name: '瑞金', factionId: 'nantang', lat: 25.9262, lng: 116.0458, type: 'stockade', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[五代南唐保大十一年由瑞金淘金场升瑞金县·武夷西麓贡水源头山地小县邑] 因掘地得金置瑞金场、南唐升县（《太平寰宇记》《赣州府志》），宋元及明正德前僻处赣闽万山之中，早期夯土土垣（明正德后始修小砖城周仅三里余），≤1700年在城不足6000人，定城寨。' },

    // ── 2026-05-25 明朝势力新增城市 ──
    // 第二类：元末群雄
    { id: 'city_qingyuan_zj', name: '宁波', factionId: 'ming_d', lat: 29.87, lng: 121.54, type: 'medium_city', isPort: true, troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[南宋庆元府至明代宁波府·条石包砖三江口港城] 南宋至明万历间明州／宁波砖石府城（鄞县在城厢）及江东、甬东市舶关厢城居峰值约8–10万（《宝庆四明志》厢坊户数及斯波义信、曹树基考算），≥8万容差线，定中城。' },


    {
        id: 'city_taizhou_zj', name: '临海', factionId: 'ouyue',
        lat: 28.66, lng: 121.42, type: 'small_city', isPort: true, troops: 10000, tier: 4,
        
        note: '[三国吴临海郡至唐宋台州明戚继光抗倭江南长城·灵江北岸北固山条石包砖周十八里府城] 顾欢、骆宾王游历名郡，北宋防洪、明嘉靖总兵戚继光创修双层空心敌台条石包砖台州府城墙（保存完好，《嘉定赤城志》《明史·戚继光传》），府城坊厢人口达3–4.5万，>1万定小城。', region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN' },
    { id: 'city_wenzhou', name: '永嘉', factionId: 'fangguozhen', lat: 28, lng: 120.7, type: 'small_city', isPort: true, troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[东晋郭璞卜筑永嘉郡城至南宋元明海外通商温州府·瓯江南岸条石包砖九山斗城] 南宋设温州市舶务与漆器柑橘海贸巨埠，元末方国珍争据、明洪武汤和加固条石包砖周十八里温州府城（《弘治温州府志》），城内永嘉县坊厢与江岸关厢达4–6万，>1万定小城。' },


    // 第三类：农民起义

    {
        id: 'city_shaxian', name: '沙戍堡', factionId: 'dengmaoqi',
        lat: 26.40, lng: 117.79, type: 'pass', troops: 10000, tier: 4,
        
        note: '[唐设县镇至明正统邓茂七之役·沙溪峡口夯土块石戍堡] 扼闽中沙溪水陆通道之军事戍堡，明正统十三年邓茂七攻掠沙县戍堡（《明史·丁瑄传》《读史方舆纪要》），名带「戍堡」且具土石寨垣，未成万人居民城，定险要。', region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN' },
    {
        id: 'city_yanping', name: '延平', factionId: 'longwu',
        lat: 26.670, lng: 118.210, type: 'small_city', troops: 10000, tier: 4,
        
        note: '[五代王延政建殷国都镡州、宋南剑州至明延平府（隆武驻跸）·闽江建溪富屯溪三江口巨石高城] 号称「铁延平、铜建宁」，凭三江汇口危崖全以巨型花岗条石砌筑高城，顺治三年隆武帝朱聿键驻跸抗清（《五代史补》《延平府志》），水陆咽喉府城常住达2.5–3.5万，>1万定小城。', region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN' },
    { id: 'city_jianning', name: '建宁', factionId: 'longwu', lat: 27.12, lng: 118.26, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[汉建安吴建安郡至唐建州南宋建宁府（朱熹讲学与建本印刷之都）·建溪东岸条石包砖周十余里大府] 福建上游第一雄藩建宁府（建安、瓯宁两附郭县在城），宋元明北苑贡茶与麻沙建阳书坊集散中心，明包砖条石重城（《嘉靖建宁府志》），两附郭坊厢及水西关厢达4–6万，>1万定小城。' },
    { id: 'city_chuzhou_zj', name: '丽水', factionId: 'tang', lat: 28.46, lng: 119.91, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[隋置处州括苍郡至唐丽水、宋元明处州府·瓯江大溪北岸条石包砖周九里六门山城] 刘基（刘伯温）辅明前浙东重郡，元末耿再成驻守、明洪武至嘉靖修筑防洪条石包砖处州府城（应星楼望京门遗迹，《崇祯处州府志》），龙泉青瓷水运汇口城居约2–3万，>1万定小城。' },

    {
        id: 'city_wenan', name: '文安', factionId: 'you',
        lat: 38.87, lng: 116.46, type: 'stockade', troops: 10000, tier: 4,
        region: 'NORTH',
        buildingStyle: 'WEI', note: '[西汉置勃海郡文安县至隋唐宋明京南洼淀防洪小邑·大清河赵王河洼地夯土护堤县城] 地处九河下梢文安大洼，自汉至明嘉靖前皆筑夯土高堤土城御水（崇祯末方部分砖修，周仅四里，《汉书·地理志》《文安县志》），水洼小县在城常住约4000–6000人<1万，定城寨。' },
    // 第四类：藩王叛乱
    { id: 'city_wudingzhou', name: '乐安', factionId: 'hou_liang', lat: 37.501018, lng: 117.518005, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'CENTRAL' , note: '[汉千乘乐安、唐棣州五代梁晋河口争战至明宣德汉王朱高煦藩城武定州·鲁北包砖周十里藩州城] 西晋末段匹磾屯乐陵厌次，明永乐十五年汉王朱高煦就国乐安州（宣德元年明宣宗御驾亲征围城擒高煦改武定州，《明史·高煦传》），包砖王府州城军民逾1.5–2.5万，>1万定小城。' },


    // 第五类：边疆民族
    { id: 'city_hetao', name: '河套', factionId: 'dada_ming', lat: 40.442769, lng: 109.333191, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'XIANBEI', note: '[明天顺成化至嘉靖鞑靼阿鲁台癿加思兰达延汗入套驻牧中枢·黄河后套平原水草毡帐大营] 明中叶蒙古诸部渡河入驻河套沃野威胁延绥宁夏，成化九年王越夜袭红盐池破套寇老营（《明史·鞑靼传》《王越传》），草原游牧毡帐营盘无城墙，定城寨。' },

    { id: 'city_kobdo', name: '科布多', factionId: 'oirat_ming', lat: 48.01, lng: 91.64, type: 'stockade', troops: 10000, region: 'STEPPE_IMPERIAL', buildingStyle: 'MONGOL' , note: '[15至17世纪卫拉特四部与准噶尔汗国阿尔泰东麓牧场（清科布多参赞城建于1730至1762年超限）·河谷帐营] 清筑科布多城在雍正乾隆间（晚于1700年红线不采）；≤1700年布彦图河与哈喇乌苏湖畔为瓦剌马哈木及噶尔丹东征驻牧草场，无城垣且常住<1万，定城寨。' },


    { id: 'city_yeren_base', name: '瑷珲', factionId: 'yeren_nvzhen', lat: 50.25, lng: 127.5, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[清康熙二十二年（1683）初设黑龙江将军萨布素驻城瑷珲·黑龙江左岸旧瑷珲与右岸原木夹土方城] 为雅克萨抗俄屯兵造船，康熙二十二至二十四年先后于精奇里江口与黑河右岸筑松木立栅夹夯土内外方城（《平定罗刹方略》《柳边纪略》详记木栅土城规制），木土墙且八旗驻兵水手家口约6000–8000人<1万，定城寨。' },



    { id: 'city_chijin', name: '赤金堡', factionId: 'ming_d', lat: 40.000221, lng: 97.437744, type: 'pass', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', mirror: true, note: '[明永乐至正德赤金蒙古卫·河西西端夯土包砖卫堡] 永乐二年置赤金蒙古千户所、后升卫，筑夯土关堡扼玉门至哈密孔道（《明史·西域传》及玉门赤金堡遗址），名带「堡」且具夯土墙，驻防卫堡未成万人城，定险要。；与嘉峪关同属河西，项目无 HEXI/MING 独立分支，用 HEXI（标签「河西（边墙要塞）」）作河西边墙代理，键名旧、非辽式' },

    { id: 'city_dafeichuan', name: '大非川', factionId: 'xihai_d', lat: 36.1379, lng: 100.7611, type: 'stockade', troops: 10000, region: 'TIBET', buildingStyle: 'TIBET', note: '[唐咸亨元年（670）薛仁贵十万唐军与吐蕃论钦陵决战地·青海湖以南切吉旷原河谷牧营] 薛仁贵留郭待封守辎重于大非川山栅败绩，论钦陵乘胜尽收吐谷浑故地（《旧唐书·薛仁贵传》《吐蕃传》），高原河滩牧场与临时军栅，无城郭且常住<1万，定城寨。' },



    // 第六类：周边国家
    
    {
        id: 'city_ayutthaya', name: '阿瑜陀耶', factionId: 'siam',
        lat: 14.35, lng: 100.58, type: 'medium_city', troops: 10000, tier: 4,
        
        note: '[16至17世纪暹罗阿瑜陀耶王朝·红砖环岛水都] 纳黎萱至那莱王时期（1550–1685年）三河环绕砖墙城岛及河岸外国商馆关厢人口约15–20万（法使拉卢贝尔1687年《暹罗王国志》及Chandler表15万），>10万定中城。', region: 'SEAS',
        // 🔴 [2026-09-18 主人定「每个据点都必须是一级 16 中的一种，其次必须是二级 62+3 中的一种」]
        //    原写 'SEAS'（只是一级母体）→ 取不到任何二级/三级，套不了 62 类里的城堡素材。
        //    按真实地理与历史归入**高棉 KHMER**：阿瑜陀耶（大城）1351 年立国后以吴哥为征服与
        //    文化母体，宫廷仪轨与佛塔（prang 式）皆承袭高棉；DE 的 62 类里没有泰族分支，
        //    东南亚四家（高棉/缅甸/越南/马来）中唯有高棉与其地理、历史同源。
        //    一级不变：REGION_TO_DE_STYLE.KHMER = 'SEAS'（东南亚母体），建筑素材照旧。
        buildingStyle: 'KHMER' },
    { id: 'city_angkor', name: '吴哥', factionId: 'chenla', lat: 13.41, lng: 103.87, type: 'medium_city', troops: 10000, region: 'KHMER', buildingStyle: 'KHMER', note: '[12世纪末吴哥王朝阇耶跋摩七世期·红土石巨垣大吴哥城] 大吴哥城（Angkor Thom）9平方公里红土石城墙及贴城坊市常住人口约10–15万（Chandler 1200年表15万；75万说系低密度大吴哥全水利农业区，按规不含远郊），>10万定中城。' },

    // ── 2026-05-25 明清之际新城市 ──
    { id: 'city_shenyang', name: '沈阳', factionId: 'manzhou_d', lat: 41.80203, lng: 123.43689, type: 'small_city', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST' , note: '[后金天聪崇德盛京期·青砖石基八门都城] 皇太极改筑盛京砖城（周九里三百三十二步，约2.2平方公里）及八门关厢，崇德年间八旗入关前峰值约5–7万，顺治元年从龙入关后城居骤降至3万余（《盛京通志》及王景泽《清初东北人口研究》），≤1700年未满8万，定小城。' },


    {
        id: 'city_guihua', name: '归化城', factionId: 'tumed',
        lat: 40.84, lng: 111.68, type: 'small_city', troops: 10000,
        
        note: '[明隆庆六年俺答汗与三娘子筑库库和屯（万历赐名归化城）·大青山南麓青砖包砌塞外商城] 隆庆和议后俺答汗征汉蒙工匠仿中原规制筑青砖包砌归化城与大召寺，成晋商对蒙俄茶叶皮毛贸易总埠，明末至清康熙平定噶尔丹驻跸时城关僧俗商民达2.5–4万（《明史·鞑靼传》《归绥识略》），>1万定小城。', region: 'STEPPE_IMPERIAL',
        buildingStyle: 'XIANBEI',  // [override] 蒙古土默特部都城, 文化属塞外
    },
    {
        id: 'city_kulun', name: '库伦', factionId: 'kaerka',
        lat: 47.92, lng: 106.84, type: 'stockade', region: 'STEPPE_IMPERIAL',
        buildingStyle: 'MONGOL', troops: 10000,
        note: '[17世纪喀尔喀土谢图汗部与一世哲布尊丹巴游牧移驻大毡帐寺院（定居木城在1778年后超限）·图拉河移动宫帐] 康熙年间库伦（Ikh Khüree）尚为随水草二十余次迁徙之巨型毛毡大经堂与僧帐营盘（1778年方定址色尔格河畔，晚于1700年，《蒙古游牧记》），无城垣且≤1700年随迁僧众仅数千人，定城寨。',
    },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CENTRAL_ASIA：固尔札（伊犁）：准噶尔汗庭所在，归鞑靼（中亚草原）
    { id: 'city_yili', name: '固尔札', factionId: 'xibo_d', lat: 43.901854, lng: 81.315308, type: 'stockade', troops: 10000, region: 'STEPPE_IMPERIAL', buildingStyle: 'MONGOL' , note: '[17世纪末准噶尔汗国策妄阿拉布坦夏冬王庭伊犁河谷（清惠远伊宁城建于1762年后超限）·毡帐斡耳朵与固尔札佛寺] 噶尔丹与策妄阿拉布坦以伊犁河谷为汗国心脏，≤1700年尚未建固尔札大庙（1740年代建）与清伊犁九城，纯属游牧汗庭金帐群无城墙且单营常住<1万，定城寨。；代理说明：本库无「卫拉特」键（不新增文化），帝国时代军团取 MONGOL 这一格＝「帝国时代喀尔喀军团」，名字属代理' },

    { id: 'city_yadong', name: '卓木', factionId: 'ganden', lat: 28.243709, lng: 89.376526, type: 'stockade', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[吐蕃至17世纪甘丹颇章时期喜马拉雅南麓春丕河谷商驿卓木（亚东）·印藏通道石木边贸小聚] 连接帕里宗、哲孟雄（锡金）与不丹之春丕峡谷温暖林区驿镇（非设防砌墙关城），≤1700年藏印背夫商站村落常住不足3000人，定城寨。',
    },
    { id: 'city_leweizhai', name: '勒乌围', factionId: 'jinchuan_g', lat: 31.812147, lng: 101.931152, type: 'stockade', troops: 10000, region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', note: '[明至清康熙嘉绒藏区大金川土司世袭官寨勒乌围（乾隆金川之役在1747年后超限）·大金川河岸片石高碉官寨] 嘉绒藏族促浸（大金川）土司依河筑数十米四角八角片石高碉与官寨群（《明史·四川土司传》《平定两金川方略》），系氏族土司碉房村寨而非守道关门亦无万人城市，常住仅两三千人，定城寨。', mirror: true },



 // 镜像
    { id: 'city_meinuozhai', name: '美诺寨', factionId: 'jinchuan_g', lat: 31, lng: 102.4, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'TIBET', note: '[明至清初嘉绒藏区小金川攒拉土司官寨美诺寨·沃日河与小金川汇口石砌高碉寨落] 与大金川唇齿相依之小金川土司中心石碉官寨（乾隆三十七年阿桂攻克在1772年超限），≤1700年为山谷石碉农牧村寨而非城市城郭，常住不足3000人，定城寨。' },



 // 镜像
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：肇庆（广东）：汉地州郡
    { id: 'city_zhaoqing', name: '肇庆', factionId: 'song', lat: 23.05, lng: 112.45, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[隋唐端州宋徽宗潜邸升肇庆府至明万历两广总督驻节首府·西江北岸北宋青砖条石七门宋城] 北宋政和三年政修青砖城墙（现存完好），明嘉靖四十三年起两广总督自梧州移驻肇庆百八十年，永历帝曾建行都（《万历肇庆府志》《明史·地理志》），督府军门与西江关厢达3.5–5万，>1万定小城。' },


    {
        id: 'city_haiyang', name: '海阳', factionId: 'tang',
        lat: 23.6697, lng: 116.6394, type: 'small_city', isPort: true, troops: 10000, region: 'JIANGNAN',
        // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：海阳（广东潮州）：汉地郡治
        buildingStyle: 'JIANGNAN', note: '[东晋义安郡至唐韩愈治潮州、宋元明潮州府（海阳附郭）·韩江西岸条石包砖广济桥商都] 南宋末马发阖城抗元殉节，明洪武指挥俞良辅大修条石包砖潮州府城，外接湘子浮桥通粤东闽西南洋瓷糖贸易（《永乐潮州府志》），城内坊厢及桥东关厢达4–6万，>1万定小城。' },
    { id: 'city_changhua_tw', name: '彰化', factionId: 'shuntian', lat: 24.08, lng: 120.56, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[1700年前台湾中部半线平原·巴布萨族半线社与明郑屯垦小聚] 清雍正元年（1723）方割诸罗北境设彰化县、雍正十二年植刺竹为城（砖城更迟至嘉庆，均超1700年红线）；≤1700年半线庄无砖石城垣且常住不足5000人，定城寨。' },

    { id: 'city_pinglong', name: '平陇', factionId: 'miaomin', lat: 28.304379, lng: 109.671021, type: 'stockade', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', troops: 10000,
        note: '[明清湘西腊尔山苗疆·高山深谷木石苗寨] 湘西乾州苗民吴八月、石柳邓所据平陇山寨（乾隆六十年事且晚于1700年；≤1700年为苗疆山谷聚落，《圣武记》），名字不带关隘堡戍且非常设守道关城，人口<1万，定城寨。',
    },
    { id: 'city_kathmandu', name: '加德满都', factionId: 'gurkha', lat: 27.715138, lng: 85.185242, type: 'small_city', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[12至17世纪尼泊尔马拉王朝康提普尔王都（加德满都）·烧砖雕木杜巴王宫广场与环城砖墙] 拉特纳·马拉独立建国至普拉塔普·马拉盛期，垄断印藏拉萨跨喜马拉雅铸币与转口贸易，17世纪耶稣会士格鲁伯与多维尔途经实记康提普尔砖墙内逾一万八千户约5–6万口（Regmi《中世纪尼泊尔》），>1万定小城。',
    },
    {
        id: 'city_turkestan', name: '亚西', factionId: 'kazakh',
        lat: 43.297, lng: 68.270, type: 'stockade', troops: 10000, tier: 4,
        
        note: '[14世纪末帖木儿敕建亚萨维圣陵至16至17世纪哈萨克汗国冬都亚西·生土帕赫萨夯墙绿洲小王城] 16世纪末额什木汗至头克汗定亚西（突厥斯坦）为哈萨克汗国可汗驻冬中心，1509年鲁兹比汗《布哈拉客籍录》详载其外垣为生土夯筑泥墙（非石墙包砖），常住定居居民与陵户约5000–8000人<1万，定城寨。', region: 'STEPPE_IMPERIAL',
        // 🔴 [2026-10-19 按史] 亚西（突厥斯坦城）是中亚定居城市（霍贾·艾哈迈德·亚萨维陵），建筑风格 CENTRAL_ASIA；不是库曼营地
        buildingStyle: 'CENTRAL_ASIA' },
    { id: 'city_kokand', name: '浩罕', factionId: 'kokand', lat: 40.5333, lng: 70.9333, type: 'stockade', troops: 10000, region: 'WESTERN_IMPERIAL', buildingStyle: 'WESTERN' , note: '[10世纪伊斯兰地理志霍瓦坎德小邑（浩罕汗国筑堡立都始于1709至1740年超限）·费尔干纳西端泥砖集镇] 浩罕明格部沙鲁赫伯克筑堡立国在1709年、建浩罕新城在1740年（均晚于1700年红线不采）；≤1700年仅为伊本·豪卡勒所记费尔干纳西南小村镇霍瓦坎德，泥砖无石墙且不足5000人，定城寨。' },


    { id: 'city_fayzabad', name: '法扎巴德', factionId: 'badakhshan', lat: 37.068341, lng: 70.675049, type: 'stockade', region: 'CENTRAL_ASIA_IMPERIAL',
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」推出的二级与史实不符 → 归 CENTRAL_ASIA：法扎巴德（巴达赫尚）：中亚—吐火罗
buildingStyle: 'CENTRAL_ASIA', troops: 10000,
        note: '[17世纪末巴达赫尚亚里德王朝首邑法扎巴德（1691年迎藏圣袍改名）·科克恰河峡谷卵石泥木山镇] 1680–1690年代亚尔贝格汗迁治科克恰河畔焦兹贡并因供奉先知圣袍改名法扎巴德（Grevemeyer《巴达赫尚史》），≤1700年初创山谷小镇无城墙且常住仅约3000–5000人<1万，定城寨。',
    },

    // ── 2026-05-25 晚清／近代城市（35个）──
    // 第一类：太平天国
    { id: 'city_jintian', name: '金田村', factionId: 'taiping', lat: 23.4, lng: 110.08, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[明清广西浔州府桂平北境紫荆山麓金田村（1851年太平天国起义超限不采）·客家壮瑶杂居无墙农庄] 道光三十年（1851）金田起义远超1700年红线不采；≤1700年桂平北境荆山脚下仅为百余户无城墙山麓农耕村落，定城寨。' },



    // 第三类：大明国/小刀会
    { id: 'city_shanghai', name: '上海', factionId: 'tang', lat: 31.23, lng: 121.47, type: 'small_city', isPort: true, troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[北宋上海酒务市舶镇、元至元二十九年立上海县至明嘉靖抗倭包砖城·黄浦江畔周九里棉布海运巨邑] 元明「衣被天下」松江棉布织染出口中心，嘉靖三十二年为御倭寇两月筑成周九里高二丈四尺包砖县城（《嘉靖上海县志》《阅世编》），万历至康熙城内及小东门十六铺关厢达4–6万，>1万定小城。' },


    // ── 洋州@兴势山（王平·兴势之战/无当飞军T1）──
    { id: 'city_yangxian', name: '兴势山', factionId: 'shu', lat: 33.352, lng: 107.582, type: 'stockade', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[蜀汉延熙七年（244）王平据兴势山围戍大破曹爽十万伐蜀军·秦岭傥骆道南口山顶木石营围] 汉中北屏兴势山，王平以不满三万军分据兴势山顶连营木栅鹿角拒曹爽司马昭大军两月迫其退走（《三国志·王平传》），系山地战时屯兵营围且名字不带关隘堡戍，常住<1万，定城寨。' },


    // 第六类：平南国（杜文秀）
    // 大理已存在 (city_dali_city), 不再新建

    // 第七类：陕甘回军
    // 第八类：号军/江汉政权
    
    { id: 'city_piandaoshui', name: '偏刀水', factionId: 'qianhui', lat: 27.921633, lng: 107.685242, type: 'stockade', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[明清黔东北思南府乌江东岸山地苗汉聚落偏刀水（同治白号军据点超限）·绝壁山顶卡寨] 19世纪同治年间黔北号军据点远超1700年红线；≤1700年仅为思南土司辖境乌江山地小村寨，无城郭且常住不足2000人，定城寨。',
    },
    // 第九类：黔西南回军
    // 第十类：苗民起义
    
    // 第十一类：新疆同治割据

    { id: 'city_wuliyasutai', name: '乌城', factionId: 'kaerka', lat: 47.74, lng: 96.84, type: 'stockade', region: 'STEPPE_IMPERIAL',
buildingStyle: 'MONGOL', troops: 10000,
        note: '[17世纪喀尔喀扎萨克图汗部杭爱山西麓牧地（清乌里雅苏台定边左副将军木城建于1733年超限）·河谷毡帐营] 雍正十一年（1733）策棱督建乌里雅苏台木栅戍城晚于1700年红线不采；≤1700年博格多河谷仅为喀尔喀西路素巴第汗部游牧草场，无城墙且人口<1万，定城寨。',
    },


    // 第十三类：西南土司
    // 第十四类：回疆割据（托克逊等）
    { id: 'city_tuokexun', name: '托克逊', factionId: 'duerbote', lat: 42.79, lng: 88.65, type: 'stockade', region: 'WESTERN_IMPERIAL', buildingStyle: 'WESTERN', troops: 10000, note: '[两汉山国危须北道至唐天山托克逊驿道绿洲（清筑城在1759年后超限）·白杨河戈壁驿村] 控吐鲁番盆地西通焉耆与翻天山至乌鲁木齐三岔水草驿点（《汉书·西域传》《西域图志》），≤1700年仅为生土小庄聚无砖石城垣且常住不足3000人，定城寨。' },

    { id: 'city_dabancheng', name: '达坂城', factionId: 'tuoming', lat: 43.339165, lng: 88.258667, type: 'stockade', region: 'WESTERN',
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CENTRAL_ASIA：达坂城：天山北麓白杨沟通道，准噶尔—回部交界，归鞑靼（中亚）
buildingStyle: 'WESTERN', troops: 10000,
        note: '[1700年前天山白水涧道·山口游牧驿路小聚落] 清乾隆二十年（1755）后始筑达坂城军台堡垣（晚于1700年红线不采）；≤1700年仅为吐鲁番通天山北路山口游牧歇马小聚落，无石砖夯土关城且人口不足千人，定城寨。', mirror: true },

    // 第十五类：越南阮朝
    { id: 'city_nanghar', name: '囊哈儿', factionId: 'jilimi', lat: 52.209343, lng: 141.951599, type: 'stockade', isPort: true, region: 'JURCHEN',
buildingStyle: 'NORTHEAST', troops: 10000,
        note: '[元征骨嵬至明永乐十年置奴儿干都司库页岛囊哈儿卫·鞑靼海峡西岸尼夫赫（吉里迷）木构渔猎聚落] 永乐十年置囊哈儿卫羁縻库页岛西北岸吉里迷与苦夷部族（《明太宗实录》《寰宇通志》），海滨半地穴冬屋与木架夏庐聚落无城墙且不足2000人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】库页岛渔猎聚落，取最近NORTHEAST',
    },
    {
        id: 'city_katsuyama', name: '胜山馆', factionId: 'kakizaki',
        lat: 41.8008, lng: 140.0994, type: 'pass', isPort: true, troops: 10000, tier: 4,
        
        note: '[日本战国蛎崎氏（松前前身）·虾夷渡岛海峡夯筑土垒山城] 蛎崎信广、庆广据上之国胜山馆扼津轻海峡和人与阿伊努交通咽喉，考古发掘确证多层夯筑土垒与空堀要塞（日本国史迹《胜山馆迹》），纯海防要塞且<1万，定险要。', region: 'JAPAN_IMPERIAL',
        buildingStyle: 'JAPAN' },
    {
        id: 'city_yanaginogosho', name: '柳之御所', factionId: 'fujiwara',
        lat: 38.99, lng: 141.1208, type: 'stockade', troops: 10000,
        
        note: '[12世纪日本平安末奥州藤原氏清衡基衡秀衡三代百年政厅柳之御所·北上川双重大堀木栅居馆平泉] 文治五年（1189）源赖朝奥州合战攻灭藤原泰衡后焚毁荒废（《吾妻镜》），考古发掘柳之御所遗址确证为宽阔水堀与板塀木栅政厅（无石垣环城墙），废绝后为农庄村聚，定城寨。', region: 'JAPAN',
        buildingStyle: 'JAPAN' },

    // ── 2026-05-26 新增：肃慎系势力都城（挹娄、勿吉、靺鞨）──
    { id: 'city_fenglin', name: '凤林寨', factionId: 'yilou', lat: 46.318508, lng: 132.187500, type: 'stockade', region: 'NORTHEAST',
buildingStyle: 'NORTHEAST', troops: 10000,
        note: '[辽五国部东境至明永乐置奴儿干属卫弗提／凤林古城·黑龙江下游松花江东北吉里迷挹娄夯土环壕寨] 汉魏挹娄、隋唐黑水靺鞨故地之夯土高台环壕山寨遗址（《明实录》奴儿干朝贡水道卫站），无砖石城垣且林中渔猎部族聚落人口不足3000人，定城寨。',
    },
    

    // ── 2026-05-26 新增：濊貊、毛文龙 ──
    
    {
        id: 'city_pidao', name: '皮岛', factionId: 'ming_d',
        lat: 39.5539, lng: 124.6611, type: 'pass', isPort: true, troops: 10000,
        
        note: '[明天启至崇祯东江镇·鸭绿江口海岛石土军镇要塞] 天启元年毛文龙开镇皮岛（椴岛），筑石土营垒牵制后金侧背（《明史·袁崇焕传》《东江疏揭塘报节抄》），系纯海上军事重镇且常住编户未成万人居民城，定险要。', region: 'KOREA',
        buildingStyle: 'KOREA' },

    // ── 2026-05-26 新增：满洲贵族世家 ──
    {
        id: 'city_tongjiajiang', name: '浑江', factionId: 'manzhou_d',
        lat: 41.2681, lng: 125.3625, type: 'stockade', troops: 10000,
        
        // [2026-08-19 修] region 原为 NORTH（北方汉地河朔），与史实和自身 note 矛盾：
        // 浑江（佟佳江，今吉林白山）是建州女真发祥地，在辽东边墙以东、长白山西麓，
        // 周边赫图阿拉/萨尔浒/辉发全部 NORTHEAST。错配会让建州女真与海西女真、满洲的
        // 女真内战变成「一方吃北方汉地科技（鼓风炉+锁子甲）、一方吃东北科技（安息战术+拇指环）」。
        note: '[明正统至成化建州卫都督李满住驻牧婆猪江（浑江）·长白山西麓原木栅栏女真冬夏寨（兀剌山城旁）] 宣德正统间建州女真李满住率部聚居婆猪江流域，屡与朝鲜世宗崔润德军交战（《明英宗实录》《朝鲜世宗实录》详记其木栅泥壁寨落），常住部众分散每寨仅一二千人，定城寨。', region: 'JURCHEN',
        buildingStyle: 'NORTHEAST' },
    
    
    // ── 2026-05-26 新增：渤海国王族大氏 ──
    // ── 2026-05-26 新增：漠北草原势力 ──
    { id: 'city_xiaoyenisei', name: '贝加尔', factionId: 'gaoche', lat: 51.8368, lng: 107.6138, type: 'stockade', region: 'STEPPE_ANTIQUITY', buildingStyle: 'MONGOL', troops: 10000, note: '[西汉苏武牧羊北海与卫律受封丁零王牧地贝加尔湖南岸·色楞格河入湖口森林草原游牧毡帐营] 汉代高车丁零先民游牧北海、唐骨利干昼长夜短之地（《汉书·苏武传》《新唐书·回鹘传》），湖滨游牧渔猎帐营无城垣且<1万，定城寨。' },
    { id: 'city_gaxian', name: '嘎仙洞', factionId: 'xianbei', lat: 49.323391, lng: 120.709534, type: 'stockade', troops: 10000, region: 'NORTHEAST', buildingStyle: 'NORTHEAST', note: '[鲜卑拓跋部远祖大鲜卑山石室祖庙嘎仙洞·大兴安岭嫩江支流甘河天然花岗岩巨洞与林中营地] 北魏太武帝太平真君四年（443）遣中书侍郎李敞诣祖宗石室祝祭刊刻祝文（1980年鄂伦春旗嘎仙洞发现北魏石刻真迹印证《魏书·礼志》），森林狩猎圣洞无城郭聚落，定城寨。' },

    { id: 'city_junjishan', name: '浚稽山', factionId: 'gaoche', lat: 45.767504, lng: 106.284485, type: 'pass', region: 'STEPPE_FEUDAL',
buildingStyle: 'MONGOL', troops: 10000,
        note: '🔴 [2026-11-07 按史补依据] 汉浚稽山（阿尔泰东）；浚稽山；高车关隘',
    },
    { id: 'city_otuken', name: '于都斤山', factionId: 'tujue', lat: 47.602542, lng: 101.230774, type: 'stockade', troops: 20000, region: 'MONGOL', buildingStyle: 'MONGOL', note: '[6至9世纪突厥第一第二汗国与回鹘汗国神圣可汗牙帐于都斤山（都斤山）·杭爱山东麓森林草原金帐圣地] 《周书·突厥传》与阙特勤碑、毗伽可汗碑反复铭刻「住于都斤山森林则国永存」之突厥大可汗金帐驻地，草原森林圣山毡帐无城垣，定城寨。', },

    { id: 'city_yingchang', name: '应昌', factionId: 'yuan_d', lat: 43.385052, lng: 116.82312, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'XIANBEI', note: '[元至元七年鲁王封邑应昌路至1370年北元顺帝驾崩昭宗即位行都·达里诺尔湖西南夯土方城] 弘吉剌部鲁王驻夏城，洪武三年（1370）明将李文忠疾驰攻克应昌俘元嫡孙买的里八剌（《元史·地理志》《明史·李文忠传》，克什克腾达里诺尔夯土城址仅0.48平方公里），草原小城常住不足8000人，定城寨。' },



    // ── 2026-05-26 新增：漠北草原部落/氏族势力据点 ──
    { id: 'city_ordos', name: '延恩', factionId: 'han_d', lat: 39.620517, lng: 108.852539, type: 'stockade', region: 'HEXI',
buildingStyle: 'XIANBEI', troops: 10000,
        note: '[西汉元朔二年卫青收河南地置朔方郡修都延恩一带边县·鄂尔多斯高原无定河北源夯土塞县] 西汉朔方郡南部属县（东汉省并入邻县，《汉书·地理志》），毛乌素沙地边缘汉代小型夯土县城，查无城居人口且不足5000人，定城寨。',
    },
    { id: 'city_ruoshui', name: '弱水畔', factionId: 'rouran', lat: 42.457925, lng: 101.186829, type: 'stockade', troops: 10000, region: 'ROURAN', buildingStyle: 'MONGOL', note: '[西汉霍去病涉钧耆济居延水至北魏太武帝讨柔然大檀弱水畔·额济纳黑河下游胡杨绿洲牧营] 始光六年（429）拓跋焘长驱至栗水（弱水）西行破柔然郁久闾大檀部落（《魏书·蠕蠕传》），沙漠内陆河岸季节性游牧草场无城郭，定城寨。' },

    
    { id: 'city_suoling', name: '娑陵', factionId: 'huihu', lat: 49.364493, lng: 102.840271, type: 'stockade', troops: 10000, region: 'MONGOL', buildingStyle: 'MONGOL', note: '[7世纪初铁勒回纥药罗葛菩萨大败东突厥于马鬣山独乐水、驻牧娑陵水·色楞格河流域回纥牙帐] 贞观初菩萨率五千骑破突厥十万众，移牙帐于娑陵水（色楞格河，《旧唐书·回纥传》），草原游牧部族驻帐河谷无城墙，定城寨。' },

    {
        id: 'city_burhan', name: '不儿罕山', factionId: 'menggu_d',
        lat: 48.50, lng: 109.00, type: 'stockade', troops: 10000, tier: 4,
        
        note: '[12世纪蒙古乞颜部也速该铁木真源出圣山不儿罕合勒敦（肯特山主峰）·三河之源高山密林游牧营地] 《元朝秘史》开卷所载孛儿只斤氏苍狼白鹿源出地及少年铁木真避蔑儿乞追杀藏身祭拜之神山，系原始针叶林与高山草甸游牧营盘，无城郭无万人城，定城寨。', region: 'STEPPE',
        buildingStyle: 'MONGOL' },
    
    { id: 'city_kerulen', name: '巴拉斯城', factionId: 'menggu_d', lat: 47.969654, lng: 113.005371, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[辽圣宗置镇州建安军（河董城）至北元达延汗满都海克鲁伦河会盟巴拉斯城·克鲁伦河畔夯土砖塔废城与牧营] 契丹筑防鞑靼边州河董城（东蒙古巴尔斯浩特一号夯土城址约2.5平方公里但宋元后荒废仅余砖塔，明代北元汗庭在此搭毡帐会盟驻牧，《辽史·地理志》《蒙古源流》），边防戍州与游牧营盘常住不足1万，定城寨。' },

    { id: 'city_erguna', name: '捕鱼儿海', factionId: 'hongirad', lat: 48.061537, lng: 117.78717, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[12世纪弘吉剌部德薛禅驻牧贝尔湖至洪武二十一年（1388）蓝玉捕鱼儿海大捷·草原湖滨毡帐行营] 蓝玉率十五万明军冒风雪奇袭北元脱古思帖木儿捕鱼儿海（贝尔湖）东北行营（《明史·蓝玉传》），草原湖泊游牧驻营无城郭且常住<1万，定城寨。' },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CENTRAL_ASIA：和博克：准噶尔盆地牧地，归鞑靼（中亚草原）
    { id: 'city_dzungar_basin', name: '和博克', factionId: 'oirat_ming', lat: 46.713523, lng: 85.68512, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[17世纪卫拉特土尔扈特和鄂尔勒克西迁前与准噶尔巴图尔珲台吉会盟地和博克赛尔·准噶尔西北山谷冬牧营] 1640年喀尔喀与卫拉特四十四部王公于塔尔巴哈台和博克谷地颁定《喀尔喀-卫拉特法典》（《卫拉特史料》），草原山谷冬牧毡帐营地无砖石城郭，定城寨。；代理说明：本库无「卫拉特」键，帝国时代军团取 MONGOL 这一格＝帝国时代喀尔喀军团，名字属代理' },




    { id: 'city_hanhai', name: '瀚海', factionId: 'gaoche', lat: 44.144832, lng: 103.697205, type: 'stockade', troops: 10000, region: 'STEPPE_FEUDAL', buildingStyle: 'MONGOL', note: '🔴 [2026-11-07 按史补依据] 戈壁瀚海；人口待考：≤1700 年城居人口查不到 → 按 2026-10-25 标准③末行「查不到人口 → 城寨」置城寨（2026-10-28 按史补注）' },

    { id: 'city_keyimen', name: '克夷门', factionId: 'dangxiang', lat: 39.289647, lng: 106.776123, type: 'pass', troops: 10000, region: 'TANGUT', buildingStyle: 'HEXI', note: '[西夏贺兰山中段东口·石砌夯土关门戍塞] 扼漠南草原翻越贺兰山直逼西夏国都中兴府咽喉，1209年成吉思汗攻西夏于克夷门大破嵬名令公五万军（《元史·太祖纪》《西夏书事》），史明为护都关门且具石土塞垣，未成万人城，定险要。' },


    // ── 2026-05-26 新增：西域/中亚城池（14个）──
    { id: 'city_talas', name: '怛罗斯', factionId: 'tujishi', lat: 42.885995, lng: 71.347961, type: 'small_city', troops: 10000, region: 'WESTERN_FEUDAL', buildingStyle: 'WESTERN' , note: '[6世纪西突厥可汗接待东罗马使臣名邑、751年唐大食决战地至10世纪喀喇汗国副都·烧砖泥砖内外城怛罗斯] 玄奘《大唐西域记》卷一载呾逻私城周八九里诸国商胡杂居，10世纪穆卡达西《地理志》盛赞塔拉兹坚城壕深、市场稠密，喀喇汗国时期城居峰值达2–3.5万（巴托尔德《七河史》），>1万定小城。' },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」推出的二级与史实不符 → 归 CENTRAL_ASIA：布哈拉：粟特—布哈拉汗国，中亚
    { id: 'city_bukhara', name: '布哈拉', factionId: 'an', lat: 39.7667, lng: 64.4333, type: 'medium_city', troops: 10000, region: 'CENTRAL_ASIA_IMPERIAL', buildingStyle: 'CENTRAL_ASIA' , note: '[9至10世纪萨曼王朝都城·烧砖内城与泥砖外郭] 萨曼王朝都城极盛期布哈拉内堡雅克、沙赫里斯坦与拉巴特连片城区峰值约8–12万（纳尔沙希《布哈拉史》及Chandler 900–1000年表10万），≥8万且达10万，定中城。' },
    { id: 'city_tashkent', name: '柘折城', factionId: 'shi_clan', lat: 41.3, lng: 69.3, type: 'small_city', troops: 10000, region: 'WESTERN_FEUDAL', buildingStyle: 'CENTRAL_ASIA' , note: '[唐石国柘折至萨曼期宾卡特·泥砖夯土内城与外郭] 10–12世纪石国故地宾卡特（塔什干）虽具泥砖内城与双外郭，据巴托尔德《蒙古入侵前的突厥斯坦》与布里亚科夫考古测算城居峰值约5–7万（Chandler历代百大城市表未达8万），<8万容差线，定小城。' },

    // ── 2026-05-26 新增：青藏高原势力城市（24个）──
    // === 第一类：高原帝国与割据强权 ===
    { id: 'city_qionglong', name: '穹窿银', factionId: 'xiangxiong', lat: 31.193972, lng: 80.771484, type: 'stockade', region: 'TIBET',
buildingStyle: 'TIBET', troops: 10000,
        note: '[7世纪吐蕃松赞干布灭象雄前古象雄王国苯教都城穹窿银城·阿里札达朗钦藏布峡谷火山凝灰岩洞窟山寨] 敦煌古藏文文书P.T.1287《吐蕃大事纪年》所载象雄王李迷夏王宫卡尔波（穹窿银城遗址），系海拔4300米荒漠峡谷崖顶干石矮垣与崖洞聚落，严寒缺粮常住仅一二千人，定城寨。',
    },  // [2026-05-29] 原 xiangxiong 势力已删, 暂归叛军
    { id: 'city_leh', name: '列城', factionId: 'ladakh', lat: 34.16, lng: 77.58, type: 'stockade', troops: 10000, region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET' , note: '[10世纪吉德尼玛衮后裔玛域王朝至17世纪拉达克南杰王朝僧格朗杰王城·印度河上游石木九层王宫与山坡商镇列城] 1640年代僧格朗杰筑列城九层石木王宫控克什米尔至阿里羊毛商路（1679–1684年拉达克战争战地），但下镇市集无环城石墙且高寒绿洲常住人口仅约4000–6000人<1万（Rizvi《拉达克史》），定城寨。' },


    { id: 'city_qingtang', name: '青唐城', factionId: 'tufa_d', lat: 36.644182, lng: 101.738892, type: 'small_city', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI' , note: '[十六国秃发南凉西平都城至11世纪唃厮啰吐蕃政权王都青唐城·湟水畔夯土二十里东西两城] 唃厮啰与董毡父子定都青唐垄断丝路河湟段商税近百年，《宋史·吐蕃传》明载青唐城周二十里分东西二城、城中商胡僧俗数万家，崇宁三年王厚收复改西宁州，盛期城居约2.5–4万，>1万定小城。' },


    { id: 'city_dangxiong', name: '当雄', factionId: 'khoshut', lat: 30.48, lng: 91.1, type: 'stockade', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[17世纪中叶固始汗和硕特汗国八旗驻牧藏北达木草原（当雄）·念青唐古拉南麓海拔4200米黑帐牧场] 1642年固始汗护卫五世达赖后留蒙古精骑驻牧达木草滩拱卫拉萨北门（《五世达赖喇嘛传》《卫藏通志》），纯高寒游牧黑帐营地无城郭，定城寨。',
    },

    // === 第二类：雪域土著与古老强族 ===
    { id: 'city_buerhanbuda', name: '白海堡', factionId: 'tubo', lat: 34.9100, lng: 98.2100, type: 'stockade', region: 'HEXI',
buildingStyle: 'TIBET', troops: 10000,
        note: '[唐贞观至吐蕃时期·黄河源玛多高寒游牧行馆牧地] 贞观十五年李道宗送文成公主至柏海迎亲、高宗时乌海柏海战地（《旧唐书·吐蕃传》），海拔4200米高寒牧帐草滩，史书仅载柏海行馆并无筑堡城墙记载，人口<1万，定城寨。',
    },
    { id: 'city_mapangyongcuo', name: '玛旁雍错', factionId: 'supi', lat: 30.814997, lng: 81.430664, type: 'stockade', region: 'TIBET',
buildingStyle: 'TIBET', troops: 10000,
        note: '[隋唐西女国苏毗羊同交界圣湖玛旁雍错·冈仁波齐南麓高寒朝圣转湖帐营与小寺聚落] 玄奘《大唐西域记》阿耨达池与苯佛印三教圣湖，海拔4580米严寒湖岸历代仅有小型修行石屋与牧民帐篷，常住不足千人且无城垣，定城寨。',
    },

    {
        id: 'city_kangyanchuan', name: '察木多', factionId: 'tubo',
        lat: 31.1333, lng: 97.1667, type: 'stockade', region: 'TIBET_CASTLE',
        buildingStyle: 'TIBET', troops: 10000, tier: 4,
        note: '[隋唐东女白兰羌南境至明正统帕巴拉呼图克图创强巴林寺察木多（昌都）·昂曲扎曲两江汇口寺院茶马聚落] 1444年宗喀巴弟子喜饶桑布建昌都强巴林寺形成政教聚落（《昌都强巴林寺志》），两江台地无城墙（非设防城市），≤1700年寺僧与茶马脚夫商户合计约5000–7000人<1万，定城寨。',
    },
    { id: 'city_heizong', name: '黑河宗', factionId: 'ganden', lat: 31.456786, lng: 92.04071, type: 'stockade', troops: 10000, region: 'TIBET_CASTLE', buildingStyle: 'TIBET', note: '[吐蕃苏毗皇家牧场至17世纪甘丹颇章设黑河（那曲）总管·藏北唐古拉南麓海拔4500米游牧帐房部落驻点] 控青藏北路入拉萨门户之藏北羌塘草原中心那曲（清设那曲卡抚绥三十九族在18世纪，《卫藏通志》），≤1700年纯属游牧黑牛毛帐篷集散地无城墙且常住不足2000人，定城寨。' },

    { id: 'city_cuona', name: '错那', factionId: 'ganden', lat: 27.979850, lng: 91.928101, type: 'stockade', region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', troops: 10000, note: '[14世纪帕竹至17世纪五世达赖门隅边贸宗治错那宗·喜马拉雅东段高寒湖盆片石小宗堡与村聚] 控山南翻越喜马拉雅南下达旺门隅茶盐互市通道，五世达赖时期扩修小型片石宗署（《西藏王臣记》），海拔4300米苦寒风口常住宗吏与边民不足2000人，定城寨。' },
    { id: 'city_metuo', name: '墨脱', factionId: 'ganden', lat: 29.250477, lng: 95.213013, type: 'stockade', region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', troops: 10000, note: '[吐蕃莲花生隐修秘境白玛岗至甘丹颇章时期雅鲁藏布大峡谷墨脱·亚热带雨林门巴珞巴竹木吊脚村寨] 深处雪山封锁之雅鲁藏布江大拐弯峡谷，珞巴族义都部与东迁门巴族建竹木藤网吊脚寨聚，无城墙且单村仅数百人，定城寨。' },
    // === 第三类：世袭门阀与政教寡头 ===
    { id: 'city_chubusi', name: '楚布寺', factionId: 'karmapa', lat: 30.059496, lng: 90.532837, type: 'stockade', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[1189年第一世噶玛巴杜松虔巴创建噶玛噶举派祖寺楚布寺·堆龙曲上游山谷藏式石木寺院聚落] 藏传佛教活佛转世制度发源地楚布寺，明永乐封五世噶玛巴为大宝法王、1642年固始汗击败藏巴汗后毁损重修，属山谷纯宗教寺院聚落无城市城郭且常住僧俗约2000–3000人<1万，定城寨。',
    },

    // ── 2026-05-26 Phase 3g：云贵高原/岭南/中南半岛/台湾势力 ──
    // ── 第一类：云贵高原与中南半岛的丛林帝国 ──
    {
        id: 'city_ava', name: '因瓦', factionId: 'ava',
        lat: 21.85, lng: 96.0667, type: 'small_city', region: 'BURMESE',
        buildingStyle: 'BURMESE', troops: 10000, tier: 4,
        note: '[14至17世纪阿瓦王朝与东吁复都因瓦·伊洛瓦底江米坦格河口红砖内城外郭王都] 1365年德多明帕亚开河成岛筑红砖内外王城因瓦，1635年他隆王自勃固复迁都于此，17世纪缅甸政治中枢城居达3–5万（Lieberman《缅甸行政周期与历史》），>1万定小城。',
    },
    {
        id: 'city_bago', name: '勃固', factionId: 'hantawadi',
        lat: 17.3333, lng: 96.4667, type: 'medium_city', region: 'BURMESE',
        buildingStyle: 'BURMESE', troops: 10000, tier: 1,
        note: '[16世纪东吁勃固王朝莽应龙期·红砖方城二十门帝都] 莽应龙新建汉达瓦底（勃固）砖墙方城（1565–1590年），威尼斯商人切萨雷·费德里奇亲历记其宏丽，城居峰值约15–17.5万（Chandler 1575年表17.5万；Reid考算），>10万定中城。',
    },
    { id: 'city_wumeng', name: '乌蒙山', factionId: 'cuanshi', lat: 26.497640, lng: 103.897705, type: 'stockade', region: 'NANZHAO',
buildingStyle: 'BASHU', troops: 10000,
        note: '[隋唐东爨乌蛮至元明土司·滇东北高山木石蛮寨] 东爨乌蛮阿芋路部世居乌蒙山区村寨（樊绰《蛮书·名类第四》），系山地部族聚落而非单一守道关塞，名字不带关隘堡戍且无正式关城墙垣，单寨人口<1万，定城寨。',
    },
    { id: 'city_leigong', name: '雷公山', factionId: 'dongzu', lat: 26.573781, lng: 108.091736, type: 'stockade', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[明代黔东南苗侗山地·密林木栅依山营寨] 洪武年间侗族吴勉及苗疆诸部据雷公山立木栅险寨抗明（《明太祖实录》《黔南识略》），木栅不算墙且名字不带关隘堡戍，非正式关塞，人口<1万，定城寨。',
    },
    {
        id: 'city_srikshetra', name: '室利差罗', factionId: 'pyu',
        lat: 18.8333, lng: 95.25, type: 'small_city', region: 'BURMESE',
        buildingStyle: 'BURMESE', troops: 10000, tier: 4,
        note: '[5至9世纪骠国最大王都室利差罗·周14.6公里巨型烧砖圆城垣] 玄奘与《新唐书·骠国传》所载骠国古都（UNESCO遗产），考古实测烧砖环城墙周长14.6公里、围合面积逾14平方公里，盛期城居约2–4万（Stargardt & Hudson骠国考古），>1万且具烧砖城墙，定小城。',
    },
    {
        id: 'city_thaton', name: '直通', factionId: 'mon',
        lat: 16.5333, lng: 97.6333, type: 'small_city', isPort: true, region: 'BURMESE',
        buildingStyle: 'BURMESE', troops: 10000, tier: 4,
        note: '[9至11世纪下缅甸孟族直通王国都城·红土巨石与烧砖双重矩形城垣] 1057年蒲甘阿奴律陀南征攻克迎取三藏经之孟族古都直通（《琉璃宫史》），遗址现存长逾2公里双重红土石烧砖城垣，盛期王都居民约1–1.5万且具红土石砖城墙，定小城。',
    },
    // ── 第三类：世袭土司与门阀 ──
    { id: 'city_tonghai', name: '通海城', factionId: 'cuanshi', lat: 24.11, lng: 102.76, type: 'small_city', troops: 10000, region: 'DALI', buildingStyle: 'BASHU' , note: '[唐南诏通海都督府、大理秀山郡至元临安宣抚司明通海县御卫城·杞麓湖南岸包砖城垣] 南诏经营爨地与入交趾南路军事重镇通海城（樊绰《蛮书》卷六），明洪武十五年置通海御千户所并包砖筑城，滇南铜铁手工业名邑城居约1.2–1.8万且具包砖墙，定小城。' },


    { id: 'city_hailongtun', name: '海龙屯', factionId: 'ming_d', lat: 27.751638, lng: 106.924438, type: 'pass', region: 'BASHU',
buildingStyle: 'BASHU', mirror: true, troops: 10000,
        note: '[南宋宝祐至明万历播州杨氏·龙岩山巅巨石九关山城要塞] 播州宣慰使杨文始筑、杨应龙扩建飞虎关、铁柱关、铜柱关等巨石城垣与摩天关楼，万历二十八年李化龙二十四万军围攻百日方克（《明史·四川土司传》及海龙屯考古），石墙关堡齐备且<1万，定险要。',
    },
    { id: 'city_zhenyuan', name: '㵲溪', factionId: 'song', lat: 27.05, lng: 108.42, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[明洪武至弘治湘黔驿道咽喉镇远府卫·㵲阳河两岸青石环城墙] 洪武二十二年置镇远卫、永乐置镇远府，正统至弘治沿㵲阳河修筑青石府城与卫城双石垣，水陆转运商民军户约1–1.5万（《明史·地理志》《镇远府志》），具完整石墙且逾万，定小城。' },


    { id: 'city_mufu', name: '独克宗', factionId: 'tubo', lat: 27.82, lng: 99.7, type: 'stockade', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[唐吐蕃神川铁桥南屏至15至17世纪丽江木氏与和硕特拉锯重镇建塘独克宗·中甸龟山石木藏房茶马古镇] 崇祯间丽江木增北拓与康熙六年蒙古达赖势力争夺中甸建塘（《明史·云南土司传》《中甸厅志》），龟山顶设大佛寺与藏式土石闪片民居而无砖石合围城墙，≤1700年常住数千人<1万，定城寨。',
    },

    { id: 'city_dongxu_old', name: '凯图玛蒂', factionId: 'dongxu', lat: 18.8, lng: 96.4, type: 'stockade', troops: 10000, region: 'SEASIA_IMPERIAL', buildingStyle: 'BURMESE', note: '[13世纪建栅至1510年明吉瑜筑凯图玛蒂（东吁旧都，莽瑞体起兵地）·锡当河谷红砖木栅起兵小王城] 1510年明吉瑜筑凯图玛蒂砖木城，1539年莽瑞体旋即南迁富庶海港勃固（汉达瓦底）为帝国首都，东吁降格为内陆山地支藩（《琉璃宫史》），≤1700年留守小邑常住不足1万确数，定城寨。' },
    { id: 'city_kangla', name: '康格拉', factionId: 'meitai', lat: 24.82, lng: 93.94, type: 'stockade', troops: 10000, region: 'BURMESE', buildingStyle: 'BENGALIS', note: '[公元1至17世纪印度东北梅泰人曼尼普尔王国王宫康格拉（因帕尔）·伊帕尔河畔夯土竹刺壕墙宫寨] 17世纪初哈根巴王扩建康格拉双道夯土泥墙与护城水渠击败阿豪姆与东吁边军（《切塔罗尔·库姆巴巴王室编年史》），但王宫外梅泰百姓散居河谷竹木稻村无砖石城郭，宫城内常住不足8000人，定城寨。' },

    // ── 第四类：岭南帝国、安南正统与海岛王国 ──
    // ── 第五类：百越余脉与南岛语系 ──
    {
        id: 'city_lingqu', name: '始安', factionId: 'ming_d',
        lat: 25.27, lng: 110.29, type: 'small_city', region: 'JIANGNAN',
        // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：始安（广西桂林）：零陵/始安郡治，秦凿灵渠处
        buildingStyle: 'JIANGNAN', troops: 10000, tier: 1,
        note: '[唐桂管观察使桂州、南宋静江府铁城至明靖江王藩封桂林府·漓江西岸巨型青石条砌内外王城] 南宋末李曾伯、马暨增筑静江三重条石水陆城抗元伯颜大军，明洪武朱守谦建靖江王城并拓筑周十三里青石桂林府城（独秀峰王城完好现存，《静江府城池图》《明史》），城关人口达4–6万，>1万定小城。',
    },
    { id: 'city_huashan', name: '花山', factionId: 'luoyue', lat: 22.159442, lng: 107.418823, type: 'stockade', region: 'JIANGNAN',
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：花山（广西宁明）：左江汉地边州
buildingStyle: 'JIANGNAN', troops: 10000,
        note: '[战国至东汉左江流域西瓯骆越祭祀盟誓中心宁明花山·明江断崖朱红岩画圣地与干栏竹木江寨] UNESCO左江花山岩画文化景观核心，系先秦两汉骆越部族铜鼓水战誓师祭江圣崖及沿岸干栏式木竹村寨（《汉书·地理志》交趾苍梧南境），无城墙且聚落人口<1万，定城寨。',
    },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：海门（广西合浦）：合浦郡治，汉地海疆
    { id: 'city_hepu', name: '海门', factionId: 'han_d', lat: 21.663, lng: 109.207, type: 'small_city', isPort: true, troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[西汉元鼎置合浦郡海上丝路始发港至唐宋明廉州府·南流江入海口包砖石基采珠商埠] 《汉书·地理志》详载自合浦徐闻乘船入南海通黄支国贸易（合浦汉墓群逾万座印证汉港繁盛），东汉孟尝还珠、马援经略，明洪武包砖修筑廉州府城（《廉州府志》），汉港及明府城居约1.5–2.5万，>1万定小城。' },






    { id: 'city_haikang', name: '海康', factionId: 'tang', lat: 20.9100, lng: 110.0800, type: 'small_city', isPort: true, troops: 10000, 
        note: '[唐贞观改合州为雷州海康郡至宋寇准苏辙贬所、明雷州府卫同城·雷州半岛红土条石包砖周五里坚城] 控扼琼州海峡渡海北门，宋绍兴知州王趯始筑子城外包砖石，明洪武置雷州卫与府同城抵御海寇倭患（《雷州府志》），卫府军民与南亭关厢常住约1.5–2.5万且具砖石墙，定小城。', region: 'JIANGNAN',
        // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：海康（广东雷州）：合州/雷州治，汉地
        buildingStyle: 'JIANGNAN' },
    {
        id: 'city_myson', name: '美山', factionId: 'champa',
        lat: 15.50, lng: 108.50, type: 'stockade', region: 'KHMER',
        buildingStyle: 'KHMER', troops: 10000, tier: 4,
        note: '[4至14世纪占婆王国历代国王献祭湿婆神圣谷地美山·秋盆河环山盆地七十余座红砖神庙圣所] 范胡达始建、制蓬峨修缮之占婆国家宗教祭祀山谷美山圣地（UNESCO遗产），与世俗都城茶荞／佛逝分立，盆地内纯为红砖神庙塔群与祭司侍卫居所，无城市坊市且常住仅一二千人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】占婆美山印度教红砖塔圣地，67键无占婆，取最近KHMER', mirror: true },
    
    {
        id: 'city_hoalu',
        name: '华闾',
        factionId: 'daquyue',
        lat: 20.25,
        lng: 105.9167,
        type: 'small_city',
        troops: 10000,
        tier: 1,
        
        note: '[10世纪末大瞿越丁朝与前黎朝国都·宁平石灰岩峰林夹筑高大石基砖墙王城] 968年丁部领统一十二使君定都华闾、981年黎桓据此破宋军（《大越史记全书》），考古发掘确证峰林缺口间砌筑10米高巨木桩基烧砖夹石人工城墙围合300公顷内外城，盛期军民逾1.5–2万，定小城。', region: 'VIETNAMESE',
        // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1」] 原「ASIA」只给一级、二级靠 region 推 → 归 VIETNAMESE：华闾（Hoa Lu）：越南丁朝/前黎朝古都；AGENTS 归位原则「越南归东南亚」，一级随 VIETNAMESE = SEAS
        buildingStyle: 'VIETNAMESE' },
    {
        id: 'city_hoabinh', name: '和平', factionId: 'dayue',
        lat: 20.7667, lng: 105.3333, type: 'stockade', region: 'SONG',
        buildingStyle: 'VIETNAMESE', troops: 10000, note: '[大越陈朝后黎朝黑水江（沱江）下游芒族土酋聚居地和平·石灰岩山谷高脚竹木栏栅村社] 扼红河三角洲西入西北泰芒山地孔道，后黎朝设羁縻芒族郎道土司（《大越地舆志》），全为竹木干栏村寨无石砖城垣且常住不足5000人，定城寨。' },
    
    {
        id: 'city_mudan', name: '牡丹社', factionId: 'paiwan',
        lat: 22.20, lng: 120.8333, type: 'stockade', isPort: true, region: 'HUAXIA_IMPERIAL',
        buildingStyle: 'MALAY', troops: 10000, tier: 4, note: '[1700年前台湾恒春半岛琅峤山地排湾族斯卡罗与高士佛牡丹诸社·页岩石板屋猎首部落山社] 同治十三年（1874）牡丹社事件远超1700年红线不采；郁永河康熙三十六年《裨海纪游》记琅峤生番诸社不通教化，山地页岩石板屋部落无城墙且单社仅数百人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】台湾排湾族石板屋聚落，取最近南岛MALAY' },
    // ── 第六类：岭南土司、安南权臣与海商门阀 ──
    { id: 'city_cen', name: '凌云', factionId: 'cen_d', lat: 24.462119, lng: 106.627808, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[北宋皇祐随狄青南征落籍至元明广西泗城州岑氏土司世袭治所凌云·澄碧河山谷土石司衙寨聚] 元置泗城州、明洪武岑善忠归附世袭泗城土知州逾六百年（清乾隆五年1740改流设凌云县筑石城超限，《明史·广西土司传》），≤1700年土司治所无砖石环城墙且常住仅数千人<1万，定城寨。' },



    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1」] 原「ASIA」只给一级、二级靠 region 推 → 归 VIETNAMESE：蓝山（Lam Son）：越南黎利蓝山起义地；AGENTS 归位原则「越南归东南亚」，一级随 VIETNAMESE = SEAS
    { id: 'city_xidu', name: '蓝山', factionId: 'dayue', lat: 19.8, lng: 105.7833, type: 'stockade', troops: 10000, region: 'VIETNAMESE', buildingStyle: 'VIETNAMESE' , note: '[1418至1428年黎利蓝山起义策源地与后黎朝丰沛陵寝西京蓝山·清化朱江上游山地竹木山寨与陵庙] 永乐十六年（1418）清化蓝山豪族黎利聚义兵据至灵山、蓝山密林竹栅抗明军十年开创立国，称帝后仍定都东京昇龙而以蓝山为奉祀祖陵之西京殿庙区（《大越史记全书》），无万人居民城，定城寨。' },

    { id: 'city_fuchun', name: '富春', factionId: 'yuenan', lat: 16.4667, lng: 107.5833, type: 'small_city', troops: 10000, region: 'SEASIA_IMPERIAL', buildingStyle: 'VIETNAMESE' , note: '[17世纪末广南阮主定都富春（顺化）·香江北岸木石宫垣与连片水陆坊市] 1687年阮福溙正式移广南正营定都富春（顺化前身，1805年嘉隆砖石京城超限不采），1695年英商鲍耶与禅师释大汕《海外纪事》亲历记香江两岸兵营坊市连绵，常住约1.5–2.5万，>1万定小城。' },



    // ── 2026-05-26 Phase 3h：新增賨、僰、谯、折、山越、畲、蒲 ──
    {
        id: 'city_dangqu', name: '宕渠', factionId: 'bandun',
        lat: 30.87, lng: 106.94, type: 'stockade', region: 'BASHU',
        buildingStyle: 'BASHU', troops: 10000,
        note: '[战国巴国賨人故邑至两汉巴郡宕渠县（板楯蛮朴胡杜濩聚居地）·渠江畔土溪城坝夯土县城] 汉高祖募板楯蛮平三秦免租赋，东汉末曹操拜宕渠賨邑侯朴胡为巴东太守、张飞大破张郃于宕渠蒙头荡石（《后汉书·南蛮传》《三国志·张飞传》，渠县城坝遗址发掘汉代夯土津关小城），夯土城且常住<1万，定城寨。',
    },

    { id: 'city_langzhong_gucheng', name: '隆城', factionId: 'shu', lat: 31.583, lng: 105.97, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[战国末巴国别都、楚汉张飞镇巴西郡治阆中至唐保宁明保宁府·嘉陵江三面环水条石包砖风水名城] 建安十九年张飞领巴西太守驻阆中七年破张郃，唐鲁王灵夔修城，明设川北道保宁府全城包砌条石青砖（顺治间更作四川临时省会十余年，《华阳国志》《保宁府志》），城居达2.5–4万，>1万定小城。' },

    { id: 'city_fuzhou_fugu', name: '府谷', factionId: 'song', lat: 39.0278, lng: 111.0583, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[五代至北宋折氏世袭府州至明府谷县·黄河绝壁条石包砖山城] 折从阮、折德扆世代镇守抗辽夏之宋麟府路府州城，明洪武景泰因石崖重修条石包砖城垣周四里余（《宋史·折德扆传》《延绥镇志》），城居约6000–9000人，<1万但具完整石砖城墙，定小城。' },

    {
        id: 'city_wanling', name: '宛陵', factionId: 'nanqi',
        lat: 30.9333, lng: 118.75, type: 'small_city', region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN', troops: 10000, tier: 4,
        note: '[六朝宣城郡至唐宣州宋明宁国府·鳌峰条石包砖周九里江南名城] 南朝谢朓守郡、唐宣歙观察使治所宣州（《新唐书·地理志》宣州户121,204），宋明修筑条石包砖九里十三步府城墙，在城宣城县坊厢常住约2.5–4万（《嘉靖宁国府志》），>1万定小城。',
    },
    {
        id: 'city_chimushan', name: '敕木山', factionId: 'she_ethnic',
        lat: 27.9250, lng: 119.6333, type: 'stockade', region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN', troops: 10000, tier: 4,
        note: '[元至正至明代浙南畲族·景宁高山木栅山寨] 浙南景宁畲族先民聚居及山林结寨自保地（《处州府志》），系山地木栅石块散居村寨，木栅不算墙且名字不带关隘堡戍，人口<1万，定城寨。',
    },
    {
        id: 'city_qingjingsi', name: '刺桐', factionId: 'song',
        lat: 24.90, lng: 118.5833, type: 'medium_city', isPort: true, region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN', troops: 10000, tier: 1,
        note: '[宋元泉州刺桐港极盛期·花岗岩包砖罗城翼城] 南宋绍定翼城至元代刺桐港全盛期（约6.4平方公里石砖城垣及城南番坊临江关厢），城居峰值约12–20万（《元史·地理志》扣除属县，伊本·白图泰记世界大港及傅宗文考算），>10万定中城。',
    },
    // ── 2026-05-26 Phase 3i：新增朴(新罗门阀)、土(巴人后裔) ──
    
    { id: 'city_wulingshan', name: '壶头山', factionId: 'wuling', lat: 29.1167, lng: 110.4667, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[东汉建武二十四年伏波将军马援征五溪蛮相单程困师绝地壶头山·沅水险滩悬崖石室军营] 马援率军次沅陵壶头山扼激流讨武陵五溪蛮，盛夏暑疫凿岸为室以避炎气病卒军中（《后汉书·马援传》《水经注·沅水》），系峡江山崖行军屯驻点无城郭聚落，定城寨。' },

];

// ============================================================
// 汇总导出
// ============================================================

// RESTORED CITIES
export const RESTORED_CITIES: CityDataV2[] = [


{ id: 'city_ningwuguan', name: '宁武关', factionId: 'tang', lat: 39.05, lng: 112.24, type: 'pass', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[明成化至崇祯外三关中路·管涔山口夯土包砖关城] 明成化三年筑宁武关城、弘治万历包砖扩建，崇祯十七年总兵周遇吉血战李自成大军阖城殉节（《明史·周遇吉传》《山西通志》），带「关」字且具包砖关城，未成万人居民城，定险要。' },


{ id: 'city_yanmenguan', name: '雁门关', factionId: 'song', lat: 39.19, lng: 112.87, type: 'pass', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[战国赵李牧至宋杨业明代·勾注山陉条石包砖雄关] 太行八陉之陉岭关，战国李牧备匈奴、宋杨业大捷、明洪武移筑勾注山脊条石包砖三门关城（《史记·廉颇蔺相如列传》《明史·地理志》），带「关」字且具石砖关垣，未成万人城，定险要。', mirror: true },






{ id: 'city_xingqing', name: '合水', factionId: 'song', lat: 36.01, lng: 107.87, type: 'stockade', troops: 10000, region: 'SONG', buildingStyle: 'CENTRAL', mirror: true, note: '[隋蟠交县、唐天宝改合水县至北宋庆历任福好水川前线庆州东翼属邑·马莲河支流黄土高原夯土小县] 唐宋庆州安化郡东属小县合水（《新唐书·地理志》《宋史·地理志》，庆州州治在安化庆阳），黄土塬梁夯土小县城常住仅两三千人<1万，定城寨。' },







// ── 大夏(西夏)都城：兴庆府 ──
{ id: 'city_yongan', name: '永安', factionId: 'taiping', lat: 24.066563, lng: 110.626831, type: 'small_city', troops: 10000, 
        note: '[唐置蒙州、宋立永安砦至明成化十三年升永安州·大瑶山东麓湄江条石包砖周三里余州城] 明成化十三年韩雍平大藤峡瑶乱后升立永安州并采青石火砖修筑完整砖石州城（清咸丰元年太平天国永安建制即据守此砖石州城半年，《明宪宗实录》《永安州志》），≤1700年城居虽不足1万但具完整明代石砖城墙，定小城。', region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN' },
    { id: 'city_xinzheng', name: '新郑', factionId: 'han', lat: 34.4, lng: 113.74, type: 'small_city', region: 'CENTRAL',
buildingStyle: 'CENTRAL', troops: 10000,
        note: '[春秋郑国三百九十九年国都与战国韩国百四十五年王都新郑·双洎洧水交汇16平方公里夯土巨垣故城] 郑桓公武公东迁至韩哀侯前375年灭郑迁都新郑，郑韩故城东西两城围合实测16平方公里、夯土墙残高近18米（全国重点文保发掘报告及《史记·韩世家》），战国韩都盛期城居达5–7万，>1万定小城。',
    },
    { id: 'city_xuchang', name: '许昌', factionId: 'caowei', lat: 34.02, lng: 113.85, type: 'small_city', region: 'CENTRAL',
buildingStyle: 'CENTRAL', troops: 10000,
        note: '[东汉建安元年曹操迎汉献帝迁都许县至曹魏五都许昌宫·颍水支流夯土包砖二十五载汉魏皇都] 建安元年至二十五年东汉王朝政治中枢与曹魏五都之一，屯田许下招聚州郡衣冠军民（《三国志·武帝纪》《文帝纪》），汉末魏初都城极盛期城居达5–7万，>1万定小城。',
    },
    { id: 'city_dongkang', name: '东康', factionId: 'heishui', lat: 44.427920, lng: 131.388245, type: 'stockade', region: 'MOHE',
buildingStyle: 'NORTHEAST', troops: 10000,
        note: '[唐代渤海国率宾府三州之一华州／益州绥芬河上游故址（东康）·老爷岭河谷夯土土城聚落] 《新唐书·渤海传》载率宾故地置率宾府产名马，东宁大城子与绥芬河流域渤海夯土小州城遗址周长仅约1.5–2公里，人口无载且常住不足5000人，定城寨。',
    },
    { id: 'city_kanka', name: '康卡', factionId: 'zhaowu', lat: 40.832522, lng: 68.634338, type: 'stockade', region: 'WESTERN_FEUDAL',
buildingStyle: 'WESTERN', troops: 10000,
        note: '[前2世纪至公元6世纪康居国冬夏行宫卑阗城与古康卡故城·锡尔河支流阿汉加兰河口泥砖夯土三重河城] 《汉书·西域传》康居国行国随畜迁徙，乌兹别克斯坦Kanka遗址发掘泥砖内堡与生土夯墙，后重心北移赭时（塔什干）而荒废，古典中亚泥砖旧邑人口查无确数且无烧砖石墙，定城寨。',
    },
    { id: 'city_asuka', name: '千早城', factionId: 'nanchou', lat: 34.336668, lng: 135.689392, type: 'pass', region: 'JAPAN',
buildingStyle: 'JAPAN', troops: 10000,
        note: '[日本镰仓末元弘之乱·金刚山绝壁石垒土垒山城] 元弘三年（1333）楠木正成以千余兵据河内千早城抗镰仓幕府大军围攻百日不拔（《太平记》卷七），纯军事绝壁山城要塞且具石垒土垣，常住不足千人，定险要。',
    },
    { id: 'city_shenglong', name: '昇龙', factionId: 'dayue', lat: 21.03, lng: 105.85, type: 'medium_city', troops: 10000, region: 'VIETNAMESE', buildingStyle: 'VIETNAMESE' , note: '[李陈至17世纪后黎郑主昇龙·夯土包砖大罗城与三十六行街] 17世纪昇龙（东京Kẻ Chợ）皇城与三十六古街坊市连片城区常住人口约10–13万（1688年英商威廉·丹皮尔及西方传教士纪行估10万以上，Reid 1993考证），≥10万定中城。' },

    { id: 'city_boduo', name: '伯都', factionId: 'wuji', lat: 45.4265, lng: 124.6591, type: 'stockade', region: 'MOHE',
buildingStyle: 'NORTHEAST', troops: 10000,
        note: '[南北朝勿吉北境、辽长春州塔虎城至元代乃颜故地纳仁汗驿（清伯都讷新城建于1693年）·松花江嫩江汇口夯土土城] 康熙三十二年（1693）移驻水师副都统修筑伯都讷夯土小城周仅四里余（《盛京通志》《吉林外纪》），≤1700年八旗驻兵与蒙汉猎户合计仅约3000人<1万且为夯土墙，定城寨。',
    },
    // 🔴 [2026-09-24 主人批间距特许] 第 11 场「前327 索格狄亚那岩」攻城战必须有真据点，库里没有 → 按 §二之二 添加。
    // 🔴 [2026-09-30 坐标纠错 · 主人令「必须符合历史」] 原取英文维基信息框 40.4,69.4 —— 该坐标**与同条目正文第一句
    //    「near Samarkand」自相矛盾**，且把岩堡错位 300 公里到北疆忽毡旁（当时还为它开了 27.69 公里的间距特许）。
    //    今按：① 英文维基 Siege of the Sogdian Rock 正文 near Samarkand；② 阿里安《远征记》IV.18–19 记此岩在
    //    诺塔卡（今沙赫里萨布兹）冬营附近、粟特与巴克特里亚交界的山区；③ 学术认定在撒马尔罕以南吉萨尔山脉／
    //    铁门关／拜孙（Bayson）山区 —— 取 **38.21,67.02**（合理推定，见事件「史料依据·地点」栏）。旧值与那条间距特许一并作废。
    { id: 'city_suogediyanayan', name: '索格狄亚那岩', factionId: 'sogdian', lat: 38.21, lng: 67.02, type: 'stockade', troops: 10000, stockadeShape: 'oval', stockadeFence: 'FENCE',
        note: '[前327年早春亚历山大东征奇袭粟特贵族阿里马泽斯避难绝壁·拜苏恩山脉天然万仞孤峰岩寨] 阿里安《亚历山大远征记》IV.18–19详载阿里马泽斯聚粟特妇孺粮草退据四面陡绝天然雪岩（三百马其顿攀岩死士铁楔登顶迫降），纯天然悬崖避难岩顶无石砖关城亦非居民城，定城寨。', region: 'SOGDIANS', buildingStyle: 'CENTRAL_ASIA' },
    // 🔴 [2026-09-25 主人令「把缺少的战役加上」] 前329 居鲁士城围攻（英文维基 Siege of Cyropolis，独立条目）必须有真据点，
    //    库里没有 → 按 §二之二 添加，并按据点完整性铁律配齐 势力（居鲁士）＋武将（卡塔涅斯）＋精锐（坚城守兵）。
    //    坐标：该条目信息框给 40.2833,69.6333，那正是库里「忽毡」的所在地（两城相距约 4 公里；库里那座城是亚历山大
    //    前329 所筑的绝域亚历山大城，自前329 起上图、同年旗归马其顿）；英文维基 Chronology 条目另记 Cyropolis = Uroteppa
    //    （今塔吉克斯坦伊斯塔拉夫尚 39.91,69.00），故本据点取后者。间距：--probe 实测最近索格狄亚那岩 64.22 公里。

    // 🔴 [2026-09-30 坐标纠错 · 主人令「必须符合历史」] 原 38.8667,65.8 记作「今卡尔希」—— 与史料不符：
    //    英文维基 `Nautaca`（https://en.wikipedia.org/wiki/Nautaca）**重定向到 Shahrisabz**，
    //    即诺塔卡 ＝ 今**乌兹别克斯坦沙赫里萨布兹**（Kesh 绿洲，撒马尔罕以南约 67 公里）；
    //    卡尔希是另一座城（Nakhshab／Nasaf），古名与诺塔卡不同。剧本路线与文案本来就写「诺塔卡（今沙赫里萨布兹）冬营」，
    //    坐标遂与之对齐；`--probe` 实测最近邻撒马尔罕 67.24 公里 ✓ 过 40 km 硬闸。
    { id: 'city_nuotaka', name: '诺塔卡', factionId: 'sogdian', lat: 39.0578, lng: 66.83, type: 'stockade', troops: 10000, region: 'SOGDIANS', buildingStyle: 'CENTRAL_ASIA', stockadeShape: 'rect', stockadeFence: 'FENCE', note: '[前328至前327年亚历山大东征粟特越冬整军营邑诺塔卡·卡什卡河绿洲泥砖贵族庄堡群] 前329年贝苏斯被擒及前328年冬亚历山大率全军驻冬休整之粟特南部农业绿洲诺塔卡（阿里安III.28、IV.18），古典史料未载人口数字且为中亚生土泥砖聚落，定城寨。' },    { id: 'city_julushicheng', name: '居鲁士城', factionId: 'sogdian', lat: 39.91, lng: 69.0, type: 'small_city', troops: 10000,
        note: '[前6至前4世纪阿契美尼德粟特第一边都居鲁士城·高大泥砖石基卫城与重垣] 居鲁士大帝所建锡尔河南岸最大城邑，阿里安《亚历山大远征记》IV.3.1–4明载前329年围城时城内仅守战丁壮即达1.5万人（战死八千、余众退守内堡），合家属城居逾2–3万，定小城。', region: 'SOGDIANS', buildingStyle: 'CENTRAL_ASIA' },
    { id: 'city_varaksha', name: '瓦拉赫沙', factionId: 'sogdian', lat: 40.402983, lng: 63.088989, type: 'stockade', troops: 10000, 
        note: '[5至10世纪布哈拉绿洲西缘布哈拉胡达王族夏宫城堡瓦拉赫沙·生土泥砖红厅壁画宫院（9公顷）] 苏联考古学家什什金发掘著名猎豹壁画宫殿之瓦拉赫沙遗址（面积仅9公顷生土泥砖台堡，纳尔沙希《布哈拉史》记其每十五日一集市，11世纪因缺水废弃），夏宫小堡常住不足5000人，定城寨。', region: 'SOGDIANS',
        buildingStyle: 'CENTRAL_ASIA' },
    {
        id: 'city_raoleshui',
        name: '饶乐水',
        factionId: 'kumoxi',
        lat: 43.27, lng: 118.48,
        type: 'stockade',
        region: 'XIANBEI',
        buildingStyle: 'XIANBEI',
        troops: 10000,
        note: '[南北朝至隋唐库莫奚五部可度者与阿会氏核心游牧地饶乐水·西拉木伦河上游草甸毡帐牙帐] 唐贞观二十二年以奚首领可度者内附置饶乐都督府领弱水等五羁縻州（《魏书·库莫奚传》《新唐书·北狄传》），草原河谷游牧驻帐无城墙，定城寨。' },
    // ── 武川镇 ──
    { id: 'city_wuchuanzhen', name: '武川镇', factionId: 'yuwen', lat: 41.2661, lng: 111.1322, type: 'pass', troops: 10000, region: 'XIANBEI', buildingStyle: 'XIANBEI' , note: '[北魏太和至孝昌北镇军事防线·阴山白道北口夯土军镇塞城] 北魏防柔然南侵所置六镇之武川镇，宇文泰先世镇守（《魏书·地形志》《周书·文帝纪》，武川土城梁遗址620×620米约0.38平方公里夯土军城），名带「镇」且为守阴山通道纯军事镇塞、镇城内<1万，定险要。' },




    // ── 新增关隘（2026-05-26） ──
    { id: 'city_gubeikou', name: '古北口', factionId: 'yan', lat: 40.69, lng: 117.16, type: 'pass', region: 'NORTH',
buildingStyle: 'WEI', troops: 10000, tier: 2,
        note: '[北齐唐辽至明蓟镇长城·潮河峡谷条石包砖关城] 古称虎北口，控漠南入幽燕潮河峡口，北齐始筑长城、明洪武十一年徐达筑砖石关城与水门（《辽史·地理志》《明史·兵志》），史明为长城巨关且具砖石墙，未成万人城，定险要。',
    },
    { id: 'city_shimenguan', name: '石门关', factionId: 'ming_d', lat: 28.079264, lng: 104.254761, type: 'pass', region: 'BASHU', buildingStyle: 'BASHU', troops: 10000, note: '[隋开皇至唐韦皋明代·五尺道豆沙关绝壁石砌关隘] 即盐津豆沙关（唐石门关），凿绝壁通蜀滇五尺道，贞元中韦皋遣使由此通南诏异牟寻（《新唐书·南诏传》《蛮书》），带「关」字且具石砌关门，未成万人城，定险要。' },


    // ── 2026-05-27 新增：汪(黟县) ──
    { id: 'city_yixian', name: '黟寨', factionId: 'tang', lat: 29.93, lng: 117.94, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[秦置鄣郡黟县、隋末汪华保据六州起兵徽地至唐宋明桃源山县黟县·黄山南麓卵石土垣徽派聚落] 《桃花源记》原型盆地之一，宋元及明万历前长期不筑城墙（崇祯末方草创小石垣旋圮，《弘治徽州府志》《黟县志》），徽商多聚居西递宏村宗族村落，县署在城仅三四千人<1万，定城寨。' },


    // ── 2026-05-27 新增：向(来凤)、覃(慈利)、冉(秀山)、储(潜山) ──
    { id: 'city_laifeng', name: '散毛关', factionId: 'ming_d', lat: 29.49, lng: 109.41, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[元明鄂西施州土司·散毛宣抚司山地木石司治] 史载本名散毛洞、明洪武置散毛宣抚司由覃氏土司世袭（《明史·湖广土司传》，现名散毛关为后拟），实系土司治所村寨而非守道关塞，无砖石环城墙且人口<1万，定城寨。', mirror: true },



    { id: 'city_cili', name: '慈利', factionId: 'ming_d', lat: 29.43, lng: 111.12, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'BASHU', note: '[秦慈姑、汉零阳吴置慈利县至明初覃垕土司起事大庸慈利·澧水中游土家苗汉杂居卵石土垣小县] 洪武三年慈利安福土酋覃垕据茅冈木石山寨反明、杨璟周德兴平之（《明太祖实录》），明代慈利县治小城仅砌溪石土垣周三里余，在城民户不足5000人，定城寨。' },

    { id: 'city_xiushan', name: '秀山', factionId: 'ming_d', lat: 28.379316, lng: 109.061279, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[五代宋元酉阳平茶邑梅石耶四洞土司地（清乾隆元年1736改土归流始设秀山县超限）·武陵山区木石土司洞寨] 明洪武置平茶洞、邑梅洞长官司由杨氏冉氏土司世袭助调征倭征播（《明史·四川土司传》），≤1700年尚无秀山县城而为分散吊脚木石土司寨，单寨不足3000人，定城寨。' },

    { id: 'city_qianshan', name: '潜山', factionId: 'han_d', lat: 30.616642, lng: 116.485291, type: 'small_city', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[春秋皖国、汉末陆康守庐江郡皖城（孙策周瑜克皖取二乔）至唐舒州北宋安庆军·潜水畔包砖石城] 东汉末庐江太守陆康据皖城拒袁术近两年、建安四年孙策攻拔皖城（《后汉书·陆康传》《三国志·孙策传》），唐至南宋嘉定迁宜城前久为舒州同安郡治，明筑包砖县城，盛期州郡城居约1.5–2.5万，>1万定小城。' },

    // ── 2026-05-27 新增：青衣(雅州) ──
    // ── 2026-05-27 新增：五溪(八面山) ──
    { id: 'city_bamian', name: '八面山', factionId: 'wuling', lat: 28.83, lng: 109.28, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[三国五溪蛮沙摩柯故地至元明湘西保靖龙山交界天险八面山·海拔1300米桌状绝壁土家苗民避兵山寨] 山顶台地周数十里仅一线岩径可登，历代五溪蛮与湘西土家苗民战乱结木石卡寨自保处（《永顺府志》），非守道关门且平时山顶散居农牧户不足千人，定城寨。' },




    // ── 2026-05-27 新增：生苗(甲定) ──
    { id: 'city_jiading', name: '甲定', factionId: 'shengmiao', lat: 26.485279, lng: 107.523193, type: 'stockade', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[明万历至崇祯黔东南都匀八寨生苗聚落甲定（丹寨）·月亮山北麓杉木吊脚苗寨群] 万历末收入羁縻青岩司而实为「新疆六厅」未辟生苗腹地（清雍正七年1729鄂尔泰开辟丹江厅筑石城超限，《黔南职方纪略》），≤1700年纯木构苗寨无城墙且单寨不足2000人，定城寨。',
    },

    // ── 2026-05-27 新增：且兰(且兰城) ──
    { id: 'city_qielancheng', name: '且兰', factionId: 'yelang', lat: 27.247242, lng: 107.880249, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[战国楚庄蹻克且兰至汉元鼎六年南越之役斩且兰君置牂牁郡且兰县·舞阳河上游黄平夯土山谷小城] 汉发巴蜀兵征南越，且兰君恐远行旁国虏其老弱遂反杀汉使，中郎将郭昌灭之置且兰县（《史记·西南夷列传》），西南夷山间夯土小县查无城居人口且<1万，定城寨。' },


    // ── 2026-05-27 新增：先零(允吾) ──
    { id: 'city_yunwu', name: '允吾', factionId: 'xianlingqiang', lat: 36.301845, lng: 102.897949, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[两汉金城郡治与诸羌交争期·湟水入河口下川口夯土郡城] 西汉昭帝置金城郡治允吾，东汉羌乱频仍《续汉书·郡国志》载金城全郡十县合计仅户3,858、口18,947，民和下川口汉代夯土城址不足0.4平方公里，城居仅数千人<1万，定城寨。' },




    // ── 2026-05-27 新增：蒯(房陵) ──
    { id: 'city_fangling', name: '房陵', factionId: 'han_d', lat: 32.043007, lng: 110.692749, type: 'stockade', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[战国秦迁赵王迁于房陵、东汉末孟达刘封争房陵至唐废帝庐陵王流放州·武当南麓粉水夯土山州小邑] 秦汉流放王侯险僻山邑，建安二十四年刘封孟达自汉中顺流攻拔申耽房陵（《史记·秦始皇本纪》《三国志·刘封传》），唐房州全州四县仅一万余户，汉唐山谷夯土小城在城不足6000人，定城寨。' },


    // ── 2026-05-27 新增：庸(上庸) ──
    { id: 'city_shangyong', name: '竹山', factionId: 'chuguo', lat: 32.349768, lng: 109.885254, type: 'stockade', region: 'CENTRAL',
buildingStyle: 'CENTRAL', troops: 10000,
        note: '[西周春秋庸国古都方城竹山至汉末申耽孟达上庸郡治·堵河上游群山环抱夯土小郡城] 前611年楚庄王联秦巴灭大庸国（《左传·文公十六年》），建安末孟达以上庸三郡降曹魏，秦巴深山夯土小郡县（明成化方筑小石土墙周三里），历代城居不足5000人，定城寨。',
    },
    { id: 'city_junzhou', name: '武当', factionId: 'bailian', lat: 32.5417, lng: 111.5133, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[战国楚武当邑、唐宋均州武当郡至明永乐大修武当宫观朝山门户均州城·汉水南岸条石包砖周六里大州] 明洪武初邓愈筑均州砖石城，永乐十年发三十万夫匠大修武当山真武宫观群，均州迎恩宫成全国朝山香客与汉水商船总汇（《明太宗实录》《均州志》），明代州城及关厢达2–3万，>1万定小城。' },


    // ── 2026-05-27 新增：申(金州) ──
    {
        id: 'city_jinzhou_shanxi',
        name: '安康',
        factionId: 'shen',
        lat: 32.68, lng: 109.02,
        type: 'small_city',
        region: 'CENTRAL',
        buildingStyle: 'CENTRAL',
        troops: 10000,
        note: '[汉汉中郡西城县、西魏金州至南宋王彦八字军镇金州及明万历兴安州·汉江北岸条石包砖新旧双城] 绍兴初王彦以金州为根本败金人保蜀门，明洪武包砖筑金州城、万历十一年水灾后于赵台山另筑条石包砖新城改名兴安州（《宋史·王彦传》《兴安府志》），汉江上游商埠城居约1.5–2.5万，>1万定小城。',
    },

    // ── 2026-05-27 新增：叟(乐山) ──
    {
        id: 'city_leshan',
        name: '乐山',
        factionId: 'shu',
        lat: 29.60, lng: 103.79,
        type: 'small_city',
        region: 'BASHU',
        buildingStyle: 'BASHU',
        troops: 10000,
        note: '[汉南安、北周嘉州至唐开元凿凌云大佛、南宋嘉定府明嘉定州·岷江大渡青衣三江汇流红砂条石高城] 蜀南盐茶木竹水运总口嘉州，南宋抗蒙筑三龟九顶山城，明洪武正德沿三江修筑高固红砂岩条石城垣（现存老霄顶与丽正门石墙，《宋史》《嘉定府志》），城关人口达2.5–4万，>1万定小城。',
    },

    // ── 2026-05-27 新增：板楯(汉昌) ──
    {
        id: 'city_hanchang',
        name: '汉昌',
        factionId: 'bandun',
        lat: 31.86, lng: 106.75,
        type: 'stockade',
        region: 'BASHU',
        buildingStyle: 'BASHU',
        troops: 10000,
        note: '[东汉永元析宕渠北境置汉昌县（賨人范目故里）至北魏唐宋巴州化城·巴河岸畔夯土小州县] 张鲁与刘璋争巴东汉昌賨民，隋唐置巴州清化郡治化城县（《华阳国志·巴志》《新唐书·地理志》，明正德始垒小石垣），大巴山南麓僻小州县在城常住约4000–7000人<1万，定城寨。',
    },

    // ── 2026-05-27 新增：烧当(玛曲) ──
    { id: 'city_maqu', name: '玛曲',
        factionId: 'shaodang', lat: 34.309295, lng: 101.513672, type: 'stockade', region: 'TIBET',
        buildingStyle: 'TIBET', troops: 10000, note: '[两汉河曲大允谷烧当羌滇良迷唐世居牧地玛曲·黄河天下第一弯海拔3500米高寒湿地黑帐牧场] 东汉永平至永元间烧当羌豪迷唐据大小榆谷与黄河首曲联结诸羌抗汉护羌校尉（《后汉书·西羌传》），纯高寒草原毡帐牧地无城郭，定城寨。' },

    // ── 2026-05-27 新增：叛军(古严关)、盘瑶(贺州)、马楚(麦岭关)、排瑶(连州)、士(广信)、蒋(永州) ──
    {
        id: 'city_guyanguan',
        name: '古严关',
        factionId: 'ming_d',
        lat: 25.68, lng: 110.62,
        type: 'pass',
        region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN',
        troops: 10000,
        tier: 4,
        note: '[秦凿灵渠至南明永历·湘桂走廊兴安狮子山条石关城] 扼湘桂走廊灵渠咽喉，秦汉严关故址，永历元年桂林保卫战焦琏等凭严关击退清军（《读史方舆纪要》《小腆纪年》），带「关」字且现存条石关墙，未成万人城，定险要。',
    },
    {
        id: 'city_hezhou',
        name: '临贺',
        factionId: 'panyao',
        lat: 24.40, lng: 111.55,
        type: 'small_city', region: 'JIANGNAN',
        buildingStyle: 'JIANGNAN',
        troops: 10000, note: '[汉置临贺县、三国吴临贺郡至唐宋贺州及明正统瑶乱防城·贺江北岸明洪武成化条石包砖周四里城垣] 扼潇贺古道入粤咽喉，明洪武二十九年始建守御千户所砖石城、成化弘治平盘瑶之乱后全城包砌青砖条石（《明史·地理志》《贺县志》），≤1700年城居虽约6000–9000人但具完整明代砖石城墙，定小城。',
        tier: 4 },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：麦岭关（广西）：汉地关隘
    { id: 'city_mailingguan', name: '麦岭关', factionId: 'song', lat: 25.02, lng: 111.23, type: 'pass', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[五代马楚南汉至两宋·萌渚岭湘桂界石砌关隘] 扼萌渚岭贺州至永州岭道咽喉，五代楚汉争岭北、宋置戍兵守关（《太平寰宇记》《读史方舆纪要》），带「关」字且具岭口石垒关墙，未成万人城，定险要。', mirror: true },


    { id: 'city_yongzhou_hn', name: '泉陵', factionId: 'tang', lat: 26.231835, lng: 111.588135, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[西汉零陵郡治泉陵至唐柳宗元谪居永州、宋明永州府·潇湘二水汇合条石包砖周九里湘南名城] 控湘桂走廊北端，唐元和柳宗元著《永州八记》，宋景定及明洪武五年修筑潇水东岸青石条基包砖永州府城（《弘治永州府志》），府卫同城与河西商埠常住约2–3万，>1万定小城。' },


    // ── 2026-05-28 新增：黎(崖州) ──
    { id: 'city_yazhou', name: '珠崖', factionId: 'liren', lat: 18.432692, lng: 108.989868, type: 'stockade', isPort: true, region: 'JIANGNAN',
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：珠崖（海南）：珠崖郡，汉地郡县
buildingStyle: 'HUGUANG', troops: 10000,
        note: '[西汉元鼎置珠崖儋耳二郡旋罢、唐振州宋吉阳军至明崖州水南村（黄道婆学纺黎锦地）·海南南端珊瑚砖土小卫州] 汉昭帝宣帝因黎俚数反罢弃珠崖郡，唐宰相李德裕、宋赵鼎胡铨贬谪天涯海角吉阳军（《汉书·贾捐之传》《琼台志》），虽明筑周三里余小砖垣但孤悬瘴海边角在城军民仅两三千人（本据点主系汉俚族珠崖阶段无砖墙），定城寨。',
    },
    // ── 2026-05-28 新增：悉勃野(匹播) ──
    { id: 'city_pibo', name: '匹播', factionId: 'lang_clan', lat: 29.224032, lng: 91.746826, type: 'stockade', region: 'TIBET_CASTLE',
buildingStyle: 'TIBET', troops: 10000,
        note: '[6世纪雅砻部落松赞干布祖父囊日论赞攻拔苏毗邻邦匹播城（琼结青瓦达孜宫）·雅砻河谷山脊片石王寨] 吐蕃统一前夕山南琼结河谷山崖片石宫寨青瓦达孜（历代赞普藏王墓所在地，14世纪帕竹绛曲坚赞亦兴于山南，《新唐书·吐蕃传》《贤者喜宴》），崖顶宫堡与山脚村聚不足5000人，定城寨。',
    },
    // ── 2026-05-28 新增：工布(江达宗) ──
    // [2026-05-29] 原 gongbu 势力已删, 暂归叛军
    // ── 2026-05-28 新增：果洛(花石峡)、察哈尔(多伦) ──
    { id: 'city_huashixia', name: '花石峡', factionId: 'tang', lat: 35.196235, lng: 98.907166, type: 'stockade', region: 'HEXI', buildingStyle: 'TIBET', troops: 10000, mirror: true, note: '[唐调露永隆间黑齿常之河源军经略入蕃唐蕃古道驿站花石峡·阿尼玛卿山西麓海拔4300米苦寒草滩驿营] 控西宁日月山翻越积石山通玉树逻些之唐蕃古道高寒草滩歇马营地（《旧唐书·黑齿常之传》），海拔逾四千米冻土荒滩无城垣且常住不足千人，定城寨。' },

    // ── 2026-05-30 威海(文登)；威海卫据点已删（与文登重复） ──
    { id: 'city_wendeng', name: '文登', factionId: 'tang', lat: 37.20, lng: 122.05, type: 'stockade', isPort: true, region: 'NORTH', buildingStyle: 'CENTRAL', troops: 10000, note: '[北齐置县至唐显庆伐百济·山东半岛东端夯土海防小县] 显庆五年（660）苏定方自成山文登渡海灭百济（《旧唐书·苏定方传》），唐登州全州四县仅二万二千户，文登偏居海角、唐代夯土县城常住不足1万，定城寨。' },
    {
        id: 'city_valparaiso',
        name: '瓦尔帕莱索',
        factionId: 'xibanya',
        lat: -33.04,
        lng: -71.62,
        type: 'stockade',
        isPort: true,
        troops: 10000,
        region: 'INCA',
        buildingStyle: 'SPANISH',
        note: '[16至17世纪西属智利外港·海湾木石仓栈无环墙小埠] 1544年巴尔迪维亚定为圣地亚哥出海口，16–17世纪屡遭德雷克等私掠船焚掠，≤1700年常住仅数百至千余人且无合围石砖城墙（仅小炮台），定城寨。',
    },
    {
        id: 'city_buenosaires',
        name: '布宜诺斯艾利斯',
        factionId: 'xibanya',
        lat: -34.60,
        lng: -58.38,
        type: 'stockade',
        isPort: true,
        troops: 10000,
        region: 'INCA',
        buildingStyle: 'SPANISH',
        note: '[1580至1700年西属拉普拉塔河口港镇·夯土小堡与无墙棋盘泥砖镇] 1580年胡安·德·加赖重建，至1700年仅河岸一座夯土小堡（Fuerte）而市镇无城墙，常住人口约4000–6000人（Besio Moreno布宜诺斯艾利斯人口史），<1万无石砖墙，定城寨。',
    },
    {
        id: 'city_jamestown',
        name: '詹姆斯敦',
        factionId: 'yinggelan',
        lat: 37.21,
        lng: -76.78,
        type: 'stockade',
        isPort: true,
        troops: 10000,
        region: 'AMERICA',
        buildingStyle: 'BRITONS',
        note: '[17世纪英属弗吉尼亚早期首府·詹姆斯河三角形原木立栅营镇] 1607年约翰·史密斯等建三角形木栅堡，1676年培根起义焚毁、1699年迁都威廉斯堡，≤1700年常住始终不足1500人且仅木栅土垒（Kelso詹姆斯敦考古），定城寨。',
    },
    {
        id: 'city_portroyal',
        name: '皇家港',
        factionId: 'yinggelan',
        lat: 17.94,
        lng: -76.84,
        type: 'small_city',
        isPort: true,
        troops: 10000,
        region: 'AMERICA',
        buildingStyle: 'BRITONS',
        note: '[17世纪下半叶英属牙买加海贸私掠首府·查理堡等六座石砖海防联墙体系] 1655–1692年加勒比最富商埠皇家港，1692年大地震沉海前沙嘴城区密集砖石楼宇常住人口约6500–8000人，外围查理堡、詹姆斯堡等六座石砖炮堡合围联防（Pawson & Buisseret《皇家港史》），<1万具石砖城防定小城。',
    },
    {
        id: 'city_elmina',
        name: '埃尔米纳',
        factionId: 'putaoya',
        lat: 5.08,
        lng: -1.35,
        type: 'small_city',
        isPort: true,
        troops: 10000,
        region: 'AFRICA',
        buildingStyle: 'PORTUGUESE',
        note: '[15至17世纪葡荷黄金海岸中枢·圣乔治全石砌要塞与连片港镇] 1482年葡建圣乔治达埃尔米纳石堡，17世纪荷属时期石堡西侧连片埃尔米纳港镇常住人口达1.2–1.6万（Feinberg 1989《黄金海岸埃尔米纳人与荷兰人》pp.85–88），>1万且具巨石要塞，定小城。',
    },
    {
        id: 'city_tahiti',
        name: '大溪地',
        factionId: 'bolinixiya',
        lat: -17.65,
        lng: -149.43,
        type: 'stockade',
        isPort: true,
        troops: 10000,
        region: 'AMERICA',
        buildingStyle: 'MALAY',
        note: '[10至17世纪波利尼西亚社会群岛·珊瑚祭坛（马拉埃）与木竹海岸村社] 波利尼西亚远洋航海枢纽大溪地，≤1700年岛民散居海岸木竹村落与干石祭坛而无城郭，最大单聚落仅千余人<1万（Oliver《古代大溪地社会》），定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】社会群岛毛利神庙Marae，取最近南岛MALAY',
    },
    {
        id: 'city_rapanui',
        name: '复活节岛',
        factionId: 'bolinixiya',
        lat: -27.11,
        lng: -109.36,
        type: 'stockade',
        isPort: true,
        troops: 10000,
        region: 'AMERICA',
        buildingStyle: 'MALAY',
        note: '[12至17世纪拉帕努伊巨石像期·无城垣石基茅屋氏族村落] 复活节岛霍图玛图阿传说定居地与摩艾石像阿胡平台，全岛分散氏族聚落峰值合计仅数千人、单村数百人且无防御城墙，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】拉帕努伊摩艾石像平台，取最近南岛MALAY',
    },
    {
        id: 'city_mua',
        name: '穆阿',
        factionId: 'bolinixiya',
        lat: -21.18,
        lng: -175.12,
        type: 'stockade',
        isPort: true,
        troops: 10000,
        region: 'AMERICA',
        buildingStyle: 'MALAY',
        note: '[12至17世纪图伊汤加海洋帝国王都·环水壕土堤与珊瑚石王陵聚落] 汤加塔布岛泻湖畔王都穆阿（拉帕哈），具人工运河环壕与巨石王陵Langi但无石砌城墙，常住王族祭司与侍从约3000–5000人<1万（Kirch《波利尼西亚酋邦》），定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】汤加石墓Langi，取最近南岛MALAY',
    },
    {
        id: 'city_honolulu',
        name: '火奴鲁鲁',
        factionId: 'bolinixiya',
        lat: 21.31,
        lng: -157.86,
        type: 'stockade',
        isPort: true,
        troops: 10000,
        region: 'AMERICA',
        buildingStyle: 'MALAY',
        note: '[1700年前夏威夷瓦胡岛南岸·木竹茅屋渔农聚落（寇乌港）] ≤1700年檀香山湾（古名Kou）仅为瓦胡岛阿里伊酋长治下散居芋田与独木舟湾村，无石砖城垣且单聚落人口不足3000人（近代商港兴于1790年代后不采），定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】夏威夷Heiau神庙，取最近南岛MALAY',
    },
    {
        id: 'city_sainthelena',
        name: '圣赫勒拿',
        factionId: 'putaoya',
        lat: -15.96,
        lng: -5.71,
        type: 'stockade',
        isPort: true,
        troops: 10000,
        region: 'AFRICA',
        buildingStyle: 'PORTUGUESE',
        note: '[16至17世纪葡英大西洋回航淡水岛·詹姆斯湾石木小垒定居点] 1502年若昂·达·诺瓦发现之无人淡水补给岛，1659年英国东印度公司建詹姆斯小堡，1700年全岛定居者与驻兵不足800人且镇无环墙，定城寨。',
    },
    {
        id: 'city_hormuz',
        name: '霍尔木兹',
        factionId: 'hulumusi',
        lat: 27.10,
        lng: 56.45,
        type: 'small_city',
        isPort: true,
        troops: 10000,
        region: 'ORIE',
        buildingStyle: 'PERSIAN',
        note: '[14至16世纪忽鲁谟斯王国与葡属要塞期·杰伦岛石砌王城与国际巨埠] 扼波斯湾咽喉之新忽鲁谟斯岛城，郑和船队四次抵此、1515年阿尔布克尔克筑圣母石堡，15–16世纪岛城常住商民达4–5万（马欢《瀛涯胜览》、巴尔博萨记述及Aubin考证），>1万定小城。',
    },

    {
        id: 'city_mauritius',
        name: '毛里求斯',
        factionId: 'gaolu',
        lat: -20.16,
        lng: 57.50,
        type: 'stockade',
        isPort: true,
        troops: 10000,
        region: 'AFRICA',
        buildingStyle: 'FRANKS',
        note: '[17世纪荷属毛里求斯补给站期·东南岸木石小堡与百人垦殖点] 法国拉布尔多内建设路易港石城在1735年（晚于1700年红线不采）；≤1700年仅为荷兰东印度公司弗雷德里克·亨德里克小驻站，全岛人口不足300人，定城寨。',
    },

    {
        id: 'city_suez',
        name: '苏伊士',
        factionId: 'ayoubu',
        lat: 29.97,
        lng: 32.55,
        type: 'small_city',
        isPort: true,
        troops: 10000,
        region: 'ORIE',
        buildingStyle: 'ORIE',
        note: '[阿尤布至马穆鲁克奥斯曼红海军港期·库尔祖姆石砌海防城垣商埠] 古克利斯马／库尔祖姆，1183年阿尤布水师由此出击红海十字军、16世纪为奥斯曼印度洋舰队母港，具石砌海防城垣与造船厂，常住水手商民约5000–8000人<1万但具石墙，定小城。',
    },
];

// ============================================================
// 汇总导出
// ============================================================
/** [2026-10-26 主人令] 湖广三级文化：仅湖北、湖南、广东、广西、福建；越南及其他区域不迁。 */
export const HUGUANG_CITY_IDS: ReadonlySet<string> = new Set([
    // 湖北（17）：2026-10-26 主人令「所有湖北据点」补入竹山、房陵、郧阳、武当、襄阳、枣阳
    'city_yiling', 'city_ying', 'city_suizhou', 'city_wushengguan', 'city_dangyang', 'city_laifeng',
    'city_jingling', 'city_yunmeng', 'city_wuchang', 'city_shicheng', 'city_qichun',
    'city_shangyong', 'city_fangling', 'city_yunyang', 'city_junzhou', 'city_xiangyang', 'city_zaoyang',
    // 湖南（13）：2026-10-26 主人令「所有湖南据点」补入慈利
    'city_changsha', 'city_wuling', 'city_pinglong', 'city_wulingshan', 'city_bamian', 'city_yongzhou_hn',
    'city_chenzhou2', 'city_yuanzhou', 'city_baling', 'city_linzheng', 'city_guiyang', 'city_shaozhou', 'city_cili',
    // 广东（12）
    'city_qingyuan', 'city_hengpuguan', 'city_yangshanguan', 'city_huangxiguan', 'city_gaoliang', 'city_xinhui',
    'city_zhaoqing', 'city_haiyang', 'city_haikang', 'city_panyu', 'city_longchuan', 'city_qujiang',
    // 广西（14）
    'city_bushan', 'city_yongzhou', 'city_jintian', 'city_lingqu', 'city_huashan', 'city_hepu', 'city_cen',
    'city_yongan', 'city_guyanguan', 'city_hezhou', 'city_mailingguan', 'city_cangwu', 'city_tianyang', 'city_tanzhong',
    // 福建（10）
    'city_fuzhou', 'city_zhenghe', 'city_zhangzhou', 'city_tingzhou', 'city_shaxian',
    'city_yanping', 'city_jianning', 'city_qingjingsi', 'city_chongan', 'city_hengyu',

    'city_dingkou',
]);

export const CITIES_V2: CityDataV2[] = [
    // ── 2026-10-28 补充超长道路中继历史据点 ──
    {
        id: 'city_pattani',
        name: '北大年',
        factionId: 'pattani',
        lat: 6.867, lng: 101.250,
        type: 'small_city',
        isPort: true,
        troops: 10000,
        region: 'SEAS',
        buildingStyle: 'MALAY',
        note: '[16至17世纪初北大年苏丹国女王盛期·砖木王城与国际商港建成区] 林道乾、拉者伊祖女王时期北大年为南洋华商与荷英船队大埠，连片港区与坊市常住人口约2–3万（Reid《商业时代的东南亚》第2卷及荷兰VOC商馆报告），>1万定小城。',
    },
    {
        id: 'city_aswan',
        name: '阿斯旺',
        factionId: 'aiji',
        lat: 24.088, lng: 32.899,
        type: 'small_city',
        troops: 10000,
        region: 'EGYPT',
        buildingStyle: 'ORIE',
        note: '[古埃及新王国至托勒密期·石墙边镇商埠] 尼罗河第一瀑布象岛总督驻所与贸易聚落，城居峰值约5000–8000（Baines & Malek《古埃及文化地图集》），<1万但具石墙城郭，定小城。',
    },
    {
        id: 'city_copan',
        name: '科潘',
        factionId: 'maya',
        lat: 14.840, lng: -89.141,
        type: 'small_city',
        troops: 10000,
        region: 'MESO',
        buildingStyle: 'MAYANS',
        note: '[8世纪玛雅古典期十八兔王盛期·凝灰岩卫城与山谷连片建成区] 玛雅东南王都科潘卫城及拉斯塞普尔图拉斯贵族居住区连片聚落，8世纪盛期常住人口约1.2–1.8万（Webster & Freter 1990科潘聚落考古普查），>1万定小城。',
    },
    {
        id: 'city_tumebamba',
        name: '托梅班巴',
        factionId: 'inca',
        lat: -2.900, lng: -79.005,
        type: 'small_city',
        troops: 10000,
        region: 'ANDE',
        buildingStyle: 'INCA',
        note: '[15世纪末至1530年印加帝国北方陪都·安山岩切石普马蓬戈王城] 图帕克·尤潘基与瓦伊纳·卡帕克营建之北方新库斯科托梅班巴，切石宫庙与驻防居民城区约1.5–2万（西耶萨·德·莱昂《秘鲁纪事》第44章），>1万定小城。',
    },
    // ── 2026-10-24 主人「添加据点」：环非洲 7 港（本地文化判定，见 docs/02-design/海路网-单一口径-2026-10-24.md）──
    { id: 'city_kilwa', name: '基尔瓦', factionId: 'kilwa', lat: -8.96, lng: 39.5128, type: 'small_city', isPort: true, troops: 10000, region: 'ETHIOPIANS', buildingStyle: 'ORIE', note: '[13至15世纪基尔瓦苏丹国黄金贸易盛期·珊瑚石灰岩宫墙与海岛商都] 东非斯瓦希里霸主基尔瓦岛（UNESCO遗产胡苏尼库布瓦石宫与大清真寺），1331年伊本·白图泰亲访誉其繁华，盛期岛城常住人口约1.2–2万（Chittick 1974《基尔瓦发掘报告》），>1万定小城。；【建筑风格代理】66 文化无斯瓦希里分支，取东非最近分支埃塞俄比亚（代理，非精确）；🔴 [2026-11-11 按史改] 据点文化 ETHIOPIANS→ORIE（代理）：基尔瓦苏丹国都城，珊瑚石大清真寺与胡苏尼库布瓦宫' },
    { id: 'city_mombasa', name: '蒙巴萨', factionId: 'mombasa', lat: -4.05, lng: 39.6667, type: 'small_city', isPort: true, troops: 10000, region: 'ETHIOPIANS', buildingStyle: 'ORIE', note: '[15至16世纪斯瓦希里蒙巴萨苏丹国·珊瑚石灰岩城墙海岛商都] 1505年葡帅阿尔梅达攻城目击者汉斯·迈尔及1516年巴尔博萨《东方诸国记》明载蒙巴萨具石砌城墙与多层珊瑚石宅，城居逾1–1.5万（Kusimba 1999考证），>1万且具石墙，定小城。；【建筑风格代理】66 文化无斯瓦希里分支，取东非最近分支埃塞俄比亚（代理，非精确）；🔴 [2026-11-11 按史改] 据点文化 ETHIOPIANS→ORIE（代理）：斯瓦希里伊斯兰港市，姆纳拉与曼德里清真寺' },
    { id: 'city_malindi', name: '马林迪', factionId: 'malindi', lat: -3.2192, lng: 40.1169, type: 'small_city', isPort: true, region: 'ETHIOPIANS', buildingStyle: 'ORIE', troops: 10000, note: '[15至16世纪斯瓦希里马林迪苏丹国·珊瑚石城墙海贸港邦] 郑和船队到访之麻林地及1498年达·伽马结盟港，具珊瑚石灰岩砌筑城垣与石屋街区，鼎盛期城居约0.8–1.2万（巴尔博萨《东方诸国记》及Kusimba斯瓦希里考古），具珊瑚石墙且近万，定小城。；【建筑风格代理】66 文化无斯瓦希里分支，取东非最近分支埃塞俄比亚（与基尔瓦/蒙巴萨同例，非精确）；🔴 [2026-11-11 按史改] 据点文化 ETHIOPIANS→ORIE（代理）：斯瓦希里伊斯兰港市，珊瑚石建筑与季风帆船通商' },
    { id: 'city_barawa', name: '布拉瓦', factionId: 'mogadishu', lat: 1.1000, lng: 44.0300, type: 'stockade', isPort: true, region: 'ETHIOPIANS', buildingStyle: 'ORIE', troops: 10000, note: '[15世纪索马里海岸斯瓦希里港邦卜剌哇·珊瑚石民居无环墙商镇] 郑和分䑸曾抵卜剌哇（费信《星槎胜览》），1506年葡将特里斯唐·达·库尼亚攻掠时为珊瑚石屋港镇但史无城居破万与完整环城石墙确证，按查无人口定城寨。；【建筑风格代理】同东非，取埃塞俄比亚分支；🔴 [2026-11-11 按史改] 据点文化 ETHIOPIANS→ORIE（代理）：布拉瓦伊斯兰海商名城，珊瑚石宅与清真寺' },
    { id: 'city_mogadishu', name: '摩加迪沙', factionId: 'mogadishu', lat: 2.0392, lng: 45.3419, type: 'small_city', isPort: true, troops: 10000, region: 'ETHIOPIANS', buildingStyle: 'ORIE', note: '[13至15世纪摩加迪沙苏丹国盛期·珊瑚巨石环城墙东非首邑] 1331年伊本·白图泰亲访记木骨都束为「极大之城」并筑有环城珊瑚石墙，郑和船队曾抵，14–15世纪城居约1.5–2.5万（Chittick东非海岸考古），>1万且具石墙，定小城。；【建筑风格代理】66 文化无斯瓦希里分支，取东非最近分支埃塞俄比亚（代理，非精确）；🔴 [2026-11-11 按史改] 据点文化 ETHIOPIANS→ORIE（代理）：摩加迪沙苏丹国，1269法赫鲁丁清真寺，沙斐仪派印度洋海商' },
    { id: 'city_mozambique', name: '莫桑比克', factionId: 'putaoya', lat: -15.03, lng: 40.74, type: 'stockade', isPort: true, troops: 10000, region: 'PORTUGUESE', buildingStyle: 'PORTUGUESE', note: '[16至17世纪葡属东非首府莫桑比克岛·圣塞巴斯蒂昂小石堡与无环墙珊瑚石镇] 1507年葡人设站、1558年于北端筑圣塞巴斯蒂昂石堡（1607–1608年两拒荷兰围攻），但岛上石屋镇区本身无合围城墙，1635年博卡罗《要塞图志》载常住葡非居民仅约2000–4000人<1万，定城寨。' },
    { id: 'city_luanda', name: '罗安达', factionId: 'putaoya', lat: -8.8383, lng: 13.2344, type: 'stockade', isPort: true, troops: 10000, region: 'PORTUGUESE', buildingStyle: 'PORTUGUESE', note: '[16至17世纪葡属安哥拉首府圣保罗德罗安达·圣米格尔山顶小堡与无环墙海湾港镇] 1576年诺瓦伊斯建镇为南大西洋贸易港（1641–1648年荷军一度攻占），除山岬圣米格尔炮堡外下城泥木砖瓦街区无合围城墙，≤1700年常住市民与士兵约3000–5000人<1万，定城寨。' },
    { id: 'city_cape_town', name: '开普敦', factionId: 'nidelan', lat: -33.9253, lng: 18.4239, type: 'stockade', isPort: true, troops: 10000, region: 'GERMANIC_IMPERIAL', buildingStyle: 'GERMANIC', note: '[1652至1700年荷属东印度公司好望角补给首府·五角好望小石堡与无墙桌湾村镇] 1652年范·里贝克建木土垒、1666–1679年改建五角好望小石堡，桌湾定居镇无外郭城墙，据VOC开普殖民地1700年人口册全境自由民与奴隶驻军合计仅约2800人、本镇不足2000人，定城寨。' },
    { id: 'city_aden', name: '亚丁', factionId: 'zuraid', lat: 12.7855, lng: 45.0187, type: 'small_city', isPort: true, troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[12至15世纪祖拉伊德与拉苏里德王朝·火山岩切石海陆城墙红海门户] 扼曼德海峡咽喉之亚丁大港，马可·波罗与马欢《瀛涯胜览》（阿丹国）记其石砌城垣与巨富商舶，13–15世纪城居约3–5万（Margariti 2007《中世纪亚丁》），>1万定小城。' },

    { id: 'city_moyoro', name: '莫约罗', factionId: 'ayinu_ezo', lat: 44.02, lng: 144.27, type: 'stockade', isPort: true, troops: 10000, region: 'AINU', buildingStyle: 'JAPAN', note: '[7至13世纪北海道鄂霍次克文化与早期阿伊努期·网走河口半地穴木骨聚落与查希土寨] 鄂霍次克海洋渔猎民族与阿伊努交融核心聚落莫约罗贝冢遗址（日本国史迹发掘大型六角木骨半地穴屋群），无石砖城垣且聚落常住人口仅数百至千余人<1万，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】北海道阿伊努/鄂霍次克渔猎聚落，67键无此文化，取最近JAPAN' },


    { id: 'city_thebes', name: '底比斯', factionId: 'boootiya', lat: 38.32, lng: 23.31, type: 'small_city', troops: 10000, region: 'GREEK', buildingStyle: 'GREECE' , note: '[前4世纪伊巴密浓达底比斯霸权期·卡德美亚石卫城与七门大郭石墙] 玻俄提亚同盟霸主底比斯，前371年留克特拉大捷后称霸希腊，七门石砌外郭围合328公顷，前335年亚历山大毁城时死难与被卖为奴者逾3.6万（狄奥多罗斯XVII.14；Hansen 2004），>1万定小城。' },
    { id: 'city_rhodes', name: '罗得城', factionId: 'maerta_qishi', lat: 36.44, lng: 28.22, type: 'small_city', isPort: true, troops: 10000, region: 'ATHENIANS', buildingStyle: 'FRANKS', note: '[14至16世纪初医院骑士团总部（兼古典巨像名邦）·双层巨石海陆棱堡高墙] 医院骑士团1309–1522年筑厚达12米双层切石巨墙与深壕（前408年建邦古典期亦曾逾5万；骑士团期1522年抗苏莱曼大帝围城时城居约1.5–2万，Kollias考证），>1万且具巨石墙，定小城。' },
    // 🔴 [2026-10-18 按史] 干地亚（伊拉克利翁）为威尼斯克里特首府，实建为威尼斯环城棱堡与库勒斯古堡 → LATIN；不取拜占庭。
    { id: 'city_knossos', name: '干地亚要塞', factionId: 'kelite', lat: 35.33, lng: 25.13, type: 'small_city', isPort: true, troops: 10000, region: 'EAST', buildingStyle: 'LATIN', note: '[13至17世纪威尼斯克里特首府干地亚·马丁嫩戈七棱堡巨石环城墙] 威尼斯东地中海最大殖民首府干地亚（伊拉克利翁），筑周4.5公里巨石星形棱堡城墙，1648–1669年二十一年围城前夕城内常住市民约1.5–2.5万（Detorakis《克里特史》），已成超万人城市，定小城。' },

    { id: 'city_salamanca', name: '萨拉曼卡', factionId: 'leangongguo', lat: 40.96, lng: -5.66, type: 'small_city', troops: 10000, region: 'CASTILE', buildingStyle: 'SPANISH' , note: '[13至16世纪莱昂与西班牙黄金期大学名城·托尔梅斯河双层石砌城墙] 1218年阿方索九世创设萨拉曼卡大学，具旧新两道中世纪石砌城墙，1561–1591年卡斯蒂利亚户口普查城居达1.9–2.4万（de Vries 1984 p.278），>1万定小城。' },

    { id: 'city_verona', name: '维罗纳', factionId: 'kelite', lat: 45.43, lng: 10.99, type: 'small_city', troops: 10000, region: 'ITALIANS', buildingStyle: 'LATIN' , note: '[14世纪斯卡拉家族领主都城至威尼斯重镇·阿迪杰河砖石棱堡环城墙] 坎格兰德一世都城及威尼斯陆上领地重镇，具完整中世纪至圣米凯利设计之砖石棱堡城墙，1550–1600年城居达4.5–5.3万（de Vries 1984 p.276、Malanima考证），>1万定小城。' },
    { id: 'city_palermo', name: '巴勒莫', factionId: 'xixiliwangguo', lat: 38.11, lng: 13.36, type: 'medium_city', isPort: true, troops: 10000, region: 'SICILIANS', buildingStyle: 'SICILIANS' , note: '[12世纪诺曼西西里至17世纪·石墙海港王都] 诺曼西西里王国都城时期（1150–1200年）及1650年石墙城区人口峰值约12.8–15万（Chandler 1200年表15万、de Vries 1650年表12.8万），>10万定中城。' },

    { id: 'city_bremen', name: '不莱梅', factionId: 'hansa', lat: 53.07, lng: 8.8, type: 'small_city', troops: 10000, region: 'FRANKS', buildingStyle: 'SAXONS' , note: '[13至17世纪萨克森大主教城与汉萨自由市·威悉河砖石星形棱堡城墙] 威悉河下游汉萨海贸重镇不莱梅，筑中世纪石墙及17世纪初砖石星形水壕棱堡，1600–1700年城居达2–2.7万（de Vries 1984 p.272），>1万定小城。' },

        { id: 'city_anbulajiya', name: '安布拉基亚', factionId: 'yipilusi', lat: 39.16, lng: 20.98, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前3世纪皮洛士伊庇鲁斯王国王都·阿achthos河巨石方砌环城墙] 科林斯殖民城及前295年皮洛士迁都之伊庇鲁斯王都安布拉基亚，前189年抗罗马富尔维乌斯围攻（波利比乌斯XXI.26–30），现存5公里巨石切石城垣，盛期城居约1.5–2.5万，定小城。' },
{ id: 'city_sparta', name: '斯巴达', factionId: 'lagoniya', lat: 37.07, lng: 22.42, type: 'small_city', troops: 10000, region: 'GREEK', buildingStyle: 'SPARTANS', note: '[前5至前4世纪古典斯巴达霸权期·欧罗塔斯河谷四村连片建成区] 修昔底德I.10.2明载古典斯巴达不筑城墙而由皮塔内等四毗连村落组成都邑（前3世纪始筑砖石墙），按无墙连片建成区口径，前5世纪盛期城居约2–3.5万（Hansen 2004 p.586），>1万定小城。' },
    { id: 'city_salonica', name: '佩拉', factionId: 'maqidun', lat: 40.76, lng: 22.5192, type: 'small_city', troops: 10000, region: 'MACEDONIAN', buildingStyle: 'MACEDONIAN' , note: '[前4世纪腓力二世与亚历山大马其顿王都·砖石环城墙与棋盘宫城佩拉] 阿奇老斯迁都、腓力二世扩建之马其顿帝国首都佩拉，考古探明400公顷棋盘街区与石基砖墙（色诺芬《希腊史》V.2.13称马其顿最大城），前4世纪末城居约3–5万（Hammond《马其顿史》），>1万定小城。' },








    { id: 'city_ragusa', name: '拉古萨', factionId: 'lagusa', lat: 42.65, lng: 18.09, type: 'small_city', isPort: true, troops: 10000, region: 'RUS', buildingStyle: 'LATIN', note: '[14至17世纪拉古萨海洋共和国·完整石灰岩海陆巨石环城高墙] 亚得里亚海商贸城邦杜布罗夫尼克（拉古萨），筑高25米、厚达6米之两公里完整巨石环城墙与明切塔圆塔，15–17世纪城内常住人口约6000–8000人（Carter 1972），<1万具巨石城墙，定小城。；🔴 [2026-11-11 按史改] 据点文化 SLAVIC→LATIN（代理）：拉古萨共和国，天主教拉丁—威尼斯海商城邦，意大利建筑师所筑海防棱堡与总督宫' },

    { id: 'city_gothenburg', name: '哥德堡', factionId: 'ruidian_si', lat: 57.7, lng: 11.97, type: 'small_city', isPort: true, troops: 10000, region: 'SWEDISH', buildingStyle: 'VIKINGS' , note: '[17世纪瑞典帝国西海门户·古斯塔夫二世石砖星形棱堡运河港城] 1621年古斯塔夫二世·阿道夫敕建并延荷兰工程师修筑全套花岗岩棱堡与水壕城墙，1690–1700年城内市民与驻军达1–1.2万（Lilja瑞典早期近代城市人口统计）且具完整石墙，定小城。' },
    { id: 'city_rostock', name: '罗斯托克', factionId: 'meikelunbao', lat: 54.09, lng: 12.13, type: 'small_city', isPort: true, troops: 10000, region: 'HRE', buildingStyle: 'GERMANIC', note: '[14至16世纪梅克伦堡汉萨重镇·红砖哥特环城墙与二十二塔港城] 波罗的海汉萨核心成员罗斯托克，筑完整红砖环城墙与克罗佩林砖门，1500–1600年城居达1.4–1.5万（Bairoch 1988《欧洲城市人口》p.9），>1万且具包砖城墙，定小城。' },
    { id: 'city_bruges', name: '布鲁日', factionId: 'didi', lat: 51.21, lng: 3.22, type: 'small_city', isPort: true, troops: 10000, region: 'HRE', buildingStyle: 'BURGUNDIANS', note: '[13至15世纪佛兰德伯国与勃艮第商贸金融之都·砖石双壕九门环城墙] 西北欧中世纪最大毛纺与汉萨交易中心布鲁日，1297年扩筑第二道砖石高墙与四座现存砖石城门，1340–1400年城居峰值达4–4.6万（Prevenier低地人口考及de Vries表），>1万定小城。' },
    { id: 'city_bulusaier', name: '布鲁塞尔', factionId: 'bulabante', lat: 50.8465, lng: 4.3518, type: 'small_city', troops: 10000, region: 'HRE', buildingStyle: 'BURGUNDIANS', note: '[15至17世纪勃艮第公爵与哈布斯堡尼德兰首府·8公里石砖七门第二城墙] 布拉班特首府布鲁塞尔1357年筑8公里第二道巨石城墙，1650–1700年城内实居达7–7.5万（de Vries 1984 p.272载1700年7.5万，贴近但未满8万中城容差线），定小城。' },

    { id: 'city_pisa', name: '比萨', factionId: 'pisa', lat: 43.72, lng: 10.4, type: 'small_city', isPort: true, troops: 10000, region: 'ITALIANS', buildingStyle: 'LATIN' , note: '[11至13世纪比萨海洋共和国极盛期·1155年白色大理石石灰岩环城高墙] 西地中海海权霸主比萨，1155年执政官科科筑现存7公里完整石砌环城墙，1293年户籍税册折算城内实居峰值约3.8–4.5万（Herlihy 1958《中世纪商业城市比萨》），>1万定小城。' },
    { id: 'city_seville', name: '塞维利亚', factionId: 'kasidiliya', lat: 37.38, lng: -5.98, type: 'medium_city', troops: 10000, region: 'CASTILE', buildingStyle: 'SPANISH' , note: '[16世纪卡斯蒂利亚黄金期·石砖城墙河海商都] 西印度贸易垄断港塞维利亚1565年市政户籍10.9万、1588–1597年达12.1–12.6万（Ruiz马丁人口考证及de Vries 1600年表12.6万），>10万定中城。' },
    { id: 'city_valencia', name: '巴伦西亚', factionId: 'alagong', lat: 39.47, lng: -0.37, type: 'small_city', isPort: true, troops: 10000, region: 'CASTILE', buildingStyle: 'SPANISH' , note: '[15世纪阿拉贡黄金世纪至16世纪·克里斯蒂安巨石十二门环城墙港都] 1356年佩德罗四世敕筑厚重巨石新墙与塞拉诺斯双石塔门，15世纪末至1600年城居达5–6.5万（de Vries 1984 p.278载1600年6.5万，未满8万），>1万定小城。' },
    { id: 'city_messina', name: '梅西纳', factionId: 'xixiliwangguo', lat: 38.19, lng: 15.55, type: 'small_city', isPort: true, troops: 10000, region: 'SICILIANS', buildingStyle: 'SICILIANS', note: '[诺曼西西里至16至17世纪海峡丝绸大埠·查理五世巨石棱堡环城墙] 扼墨西拿海峡咽喉、1571年勒班陀联军集结母港，1537年筑完整巨石棱堡环城墙，1600–1674年反西起义前城居峰值达5–6万（Beloch及de Vries 1600年表5万），>1万定小城。' },
    { id: 'city_cagliari', name: '卡利亚里', factionId: 'alagong', lat: 39.22, lng: 9.12, type: 'small_city', isPort: true, troops: 10000, region: 'SICILIANS', buildingStyle: 'SICILIANS', note: '[14至17世纪比萨与阿拉贡撒丁王国首府·卡斯特罗石灰岩巨塔环城墙] 比萨筑大象塔与圣潘克拉齐奥石塔、阿拉贡与西班牙增筑海防巨石棱堡城垣，1578–1650年炉灶税册（fuochi）折算城居约1–1.5万（Day《撒丁人口史》）且具完整石墙，定小城。' },
    { id: 'city_feisi', name: '非斯', factionId: 'yidelisi', lat: 34.03, lng: -5, type: 'medium_city', troops: 10000, region: 'BERBER', buildingStyle: 'BERBER' , note: '[12至13世纪穆瓦希德与马林期·石砖夯土双城古都] 穆瓦希德王朝盛期（1150–1250年）非斯老城与新城城垣内人口约16–20万（利奥·阿非利加努斯《非洲志》及Chandler 1200年表20万），>10万定中城。' },
    { id: 'city_cherkasy', name: '切尔卡瑟', factionId: 'gesake', lat: 49.44, lng: 32.06, type: 'stockade', troops: 10000, region: 'SLAVIC_IMPERIAL', buildingStyle: 'SLAVIC', note: '[14至17世纪第聂伯河哥萨克发祥重镇切尔卡瑟·河岸原木立栅城堡与木屋市镇] 奥斯塔菲·达什克维奇任长官整编第聂伯哥萨克抗鞑靼、1648年赫梅利尼茨基起义据点，据1552年卢斯特拉齐亚清册全镇仅255户木屋与原木城堡（17世纪仍不足6000人且为木栅），定城寨。' },
    { id: 'city_sofia', name: '索非亚', factionId: 'baojialiya', lat: 42.7, lng: 23.32, type: 'small_city', troops: 10000, region: 'BULGARIANS', buildingStyle: 'BULGARIANS', note: '[第一保加利亚帝国斯雷德茨至奥斯曼鲁米利亚省会·罗马拜占庭砖石城墙] 809年克鲁姆汗攻克后为保加利亚重镇，承完整罗马—拜占庭红砖夹石双层城墙，16–17世纪作为鲁米利亚首府城居达1.5–2.5万（Bairoch 1988 p.56），>1万且具砖石墙，定小城。' },
    { id: 'city_sarajevo', name: '萨拉热窝', factionId: 'bosiniya', lat: 43.85, lng: 18.41, type: 'small_city', troops: 10000, region: 'SERBIA', buildingStyle: 'SLAVIC', note: '[16至17世纪奥斯曼波斯尼亚省首府·石砌弗拉트尼克卫城与连片商坊] 加齐·胡斯雷夫贝伊扩建巴什察尔希亚石构商坊，1600–1660年奥斯曼税册与切莱比《旅行记》载城内逾四千五百户、常住人口达2.5–3.5万（Bairoch 1988），>1万定小城。' },
    { id: 'city_gradeci', name: '格拉代茨', factionId: 'habusibao', lat: 45.81, lng: 15.97, type: 'small_city', troops: 10000, region: 'SLAVIC_IMPERIAL', buildingStyle: 'MAGYAR', note: '[13至17世纪克罗地亚王家自由市格拉代茨·石门与石灰岩环城墙] 1242年匈王贝拉四世颁金玺诏书敕建格拉代茨（萨格勒布上城），1266年建成完整石灰岩环城墙、洛特尔什查克石塔与石门，≤1700年城居约4000–6000人，<1万具石墙，定小城。；🔴 [2026-11-11 按史改] 据点文化 SLAVIC→MAGYAR（代理）：萨格勒布格拉代茨，1242 年金玺诏书敕建自由王城，自 1102 年起属匈牙利圣伊什特万王冠，罗马天主教、中欧哥特石构；同贝尔格莱德先例取 MAGYAR 代理' },

    { id: 'city_malajiashen', name: '马拉喀什', factionId: 'mulabite', lat: 31.63, lng: -7.98, type: 'medium_city', troops: 10000, region: 'ALMOHAD', buildingStyle: 'BERBER' , note: '[12世纪穆拉比特至穆瓦希德期·红土石基王都城垣] 穆拉比特与穆瓦希德两朝帝都盛期（1100–1200年）19公里城垣内人口约12.5–15万（Chandler 1150–1200年表15万），>10万定中城。' },

    { id: 'city_xiuta', name: '休达', factionId: 'putaoya', lat: 35.89, lng: -5.31, type: 'small_city', isPort: true, troops: 10000, region: 'BERBER', buildingStyle: 'PORTUGUESE', note: '[10至14世纪马格里布海峡名城至1415年葡属要塞·皇家石砌通海双壕城墙] 马林王朝时期休达为直布罗陀南岸学术商贸大埠（地理学家伊德里斯故乡），1415年葡王若昂一世攻占前城居约2–3万，葡人续筑皇家巨石棱堡与通海护城河，>1万且具石墙，定小城。' },





    // 🔴 [2026-09-18 主人定：一级按真实地理、二级按民族政权] 原「ORIE」→ 归 BERBER：丹吉尔：摩洛哥，柏柏尔—马格里布（与非斯/马拉喀什同口径）
    { id: 'city_danjier', name: '丹吉尔', factionId: 'mulabite', lat: 35.74, lng: -5.87, type: 'small_city', isPort: true, troops: 10000, region: 'BERBER', buildingStyle: 'BERBER', note: '[8世纪倭马亚西征基地至15至17世纪葡英海防期·巨石海陆环城棱堡墙] 711年塔里克渡海征西出发港，1471–1684年葡英统治期与阿拉维苏丹伊斯梅尔收复后均具厚重石砌环城墙与卡斯巴卫城，中世纪盛期及17世纪城居约1–1.5万且具石墙，定小城。' },

    { id: 'city_teleimusen', name: '特莱姆森', factionId: 'zhayan', lat: 34.88, lng: -1.32, type: 'small_city', troops: 10000, region: 'ALMOHAD', buildingStyle: 'BERBER' , note: '[13至15世纪扎扬王朝（阿卜杜勒瓦迪德）王都·夯土包石砖多层都城垣] 中马格里布王国首都特莱姆森，经马林王朝长围与扎扬复振，14世纪极盛期城内商旅学府云集、常住人口达4–6万（利奥·阿非利加努斯《非洲志》记盛期一万六千户，Chandler表4–5万），>1万定小城。' },
    { id: 'city_aerjier', name: '阿尔及尔', factionId: 'osman', lat: 36.75, lng: 3.05, type: 'medium_city', isPort: true, troops: 10000, region: 'AFRICA_IMPERIAL', buildingStyle: 'BERBER' , note: '[16至17世纪奥斯曼阿尔及尔省·石砌海防棱堡省会] 奥斯曼北非海盗首府17世纪初石墙内常住居民、耶尼切里驻军及基督徒俘虏合计约8–10万（Haëdo 1612《阿尔及尔地形与通史》及Raymond《奥斯曼阿拉伯大城研究》），≥8万容差线，定中城。' },
    { id: 'city_bujiaya', name: '布佳亚', factionId: 'hamade', lat: 36.75, lng: 5.08, type: 'small_city', isPort: true, troops: 10000, region: 'BERBER', buildingStyle: 'BERBER' , note: '[11至12世纪哈马德柏柏尔王朝新都·石砖环山抱海大城垣贝贾亚] 1067年纳西尔建都纳西里亚（布佳亚／贝贾亚），比萨斐波那契曾求学于此，哈马德极盛期石砖城垣内人口约4–6万（伊德里斯《娱乐志》及Chandler 1150年表5–6万），>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 LATIN：迦太基：腓尼基—罗马，DE 无布匿分支，取地中海的罗马/意大利古典石堡
    { id: 'city_jiataji', name: '迦太基', factionId: 'buni', lat: 36.85, lng: 10.32, type: 'big_city', isPort: true, troops: 10000, region: 'CARTHAGE', buildingStyle: 'BERBER', mirror: true , note: '[布匿晚期至罗马帝国期·巨石三重都城郭] 前146年毁城前布匿都城及罗马阿非利加首府期城垣加马加拉关厢人口峰值约40–50万（斯特拉波《地理志》XVII.3.15载70万，现代学界折算城关实居40–50万），≥40万容差线，定大城。' },
    // 🔴 [2026-09-18 主人定：一级按真实地理、二级按民族政权] 原「ORIE」→ 归 BERBER：凯鲁万：突尼斯，柏柏尔／阿格拉布王朝都城（region=BERBER）
    { id: 'city_kailuwan', name: '凯鲁万', factionId: 'aguelabu', lat: 35.67, lng: 10.1, type: 'small_city', troops: 10000, region: 'BERBER', buildingStyle: 'BERBER' , note: '[9世纪阿格拉布王朝至11世纪初齐里期·烧砖泥砖城垣易弗里基叶圣都] 乌克巴始建、阿格拉布王朝北非首府凯鲁万（大清真寺与阿格拉布蓄水池），1057年希拉勒贝都因洗劫前城居峰值约5–7万（巴克里《道路与王国志》及Chandler 900–1000年表6–7万），>1万定小城。' },
    { id: 'city_khenchela', name: '肯切拉', factionId: 'awraba', lat: 35.436, lng: 7.145, type: 'stockade', troops: 10000, region: 'BERBER', buildingStyle: 'BERBER', note: '[7世纪奥雷斯山柏柏尔奥雷巴部·山地石木部族首府聚落] 阿马齐格奥雷巴部首领库萨伊拉故里与奥雷斯山地据点马斯库拉（伊本·赫勒敦《柏柏尔人史》），7世纪阿拉伯征服期罗马旧垣已废、山地部族聚落人口无载且<1万，定城寨。' },
    // 🔴 [2026-09-18 主人定：一级按真实地理、二级按民族政权] 原「ORIE」→ 归 BERBER：的黎波里：利比亚，柏柏尔—马格里布东部
    { id: 'city_deliboli', name: '的黎波里', factionId: 'osman', lat: 32.88, lng: 13.19, type: 'small_city', isPort: true, troops: 10000, region: 'AFRICA_IMPERIAL', buildingStyle: 'BERBER', note: '[哈夫斯王朝至16至17世纪奥斯曼的黎波里省·海陆巨石棱堡环城墙] 古奥亚港城，西军与奥斯曼名将图尔古特·雷斯增筑厚重海陆石砌环城墙与红堡，16–17世纪城内常住人口约1–1.5万（利奥·阿非利加努斯《非洲志》及Raymond考算），具石墙且逾万，定小城。' },
    { id: 'city_banjiaxi', name: '班加西', factionId: 'jileinaijia', lat: 32.11, lng: 20.06, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE' , note: '[古典欧斯佩里得斯至托勒密罗马贝伦尼基·切石环城墙昔兰尼加西港] 昔兰尼加五城同盟西端港邦，前3世纪托勒密三世王后贝伦尼基二世重筑完整切石环城墙（英国考古学会Sidi Khrebish发掘确证希腊化罗马石墙与街坊），盛期城居约1–1.5万且具石墙，定小城。' },

    { id: 'city_labate', name: '拉巴特', factionId: 'muwaxide', lat: 34.024, lng: -6.822, type: 'pass', isPort: true, troops: 10000, region: 'ALMOHAD', buildingStyle: 'BERBER', note: '[12世纪穆瓦希德王朝·石砌夯土圣战集结要塞（里巴特）] 雅库布·曼苏尔营建「胜利之堡」（Ribat al-Fath）及乌达亚石堡扼布雷格雷格河口（马马拉库希《马格里布志》），最著名穆瓦希德阶段为对伊比利亚圣战军事要塞且未成万人城，定险要。' },

    { id: 'city_oxford', name: '牛津', factionId: 'maixiya', lat: 51.75, lng: -1.25, type: 'small_city', troops: 10000, region: 'ANGLO_SAXON', buildingStyle: 'BRITONS' , note: '[13至17世纪英格兰大学名城与查理一世行都·中世纪石灰岩环城墙] 亨利三世拨税重修完整双层石灰岩环城墙与半圆石塔（新学院段石墙至今完好），1640年代内战期及1660年代炉灶税册载城居约8000–10000人，<1万具完整石墙，定小城。' },
    { id: 'city_hague', name: '海牙', factionId: 'nidelan', lat: 52.07, lng: 4.3, type: 'small_city', isPort: true, troops: 10000, region: 'GERMANIC_IMPERIAL', buildingStyle: 'GERMANIC' , note: '[17世纪荷兰共和国三级会议与执政驻都·运河环壕建成区海牙] 荷兰政治中枢内庭（Binnenhof）所在地，虽无外郭高墙但按连片建成区计，1622年普查1.58万、1700年实居达3万（de Vries 1984 p.271荷兰官方人口统计），>1万定小城。' },
    { id: 'city_gdansk', name: '格但斯克', factionId: 'bolan', lat: 54.35, lng: 18.64, type: 'small_city', isPort: true, troops: 10000, region: 'POLES', buildingStyle: 'POLES', note: '[16至17世纪波兰王室普鲁士第一海港·红砖哥特城墙与星形棱堡巨邑] 波罗的海谷物贸易总枢纽格但斯克（但泽），具红砖城门与巨型棱堡环墙，1600年城居5万、1650年峰值达7万（de Vries 1984 p.272、Bogucka波兰城市史），>1万（未满8万）定小城。' },
    { id: 'city_shiqieqing', name: '什切青', factionId: 'pomeilaniya', lat: 53.43, lng: 14.55, type: 'small_city', isPort: true, troops: 10000, region: 'HRE', buildingStyle: 'GERMANIC', note: '[13至17世纪波美拉尼亚公国都城与瑞属重镇·红砖石砌环城墙与星形棱堡] 奥得河口汉萨名城什切青，具中世纪红砖城墙与17世纪瑞典星形棱堡（1677年抗大选帝侯六月围攻），1600–1670年城居约1.2–1.8万（Bairoch 1988 p.30），>1万定小城。' },
    { id: 'city_toulouse', name: '图卢兹', factionId: 'gaolu', lat: 43.6, lng: 1.44, type: 'small_city', troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS' , note: '[中世纪图卢兹伯国都城至17世纪朗格多克首府·古罗马红砖石砌环城墙] 加龙河玫瑰红砖名城图卢兹，1218年抗西蒙·德·蒙福尔围攻，1600–1700年城墙内常住人口达4–4.3万（de Vries 1984 p.274），>1万定小城。' },
    { id: 'city_nantes', name: '南特', factionId: 'bulietani', lat: 47.21, lng: -1.55, type: 'small_city', isPort: true, troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS' , note: '[14至15世纪布列塔尼公爵驻都至17世纪大西洋商港·花岗岩公爵堡与石墙] 卢瓦尔河口重镇南特，弗朗索瓦二世重筑花岗岩公爵石堡与环城石墙，1600年城居约2.5万、1700年达4万（de Vries 1984 p.273），>1万定小城。' },
    { id: 'city_florence', name: '佛罗伦萨', factionId: 'florence', lat: 43.76, lng: 11.25, type: 'medium_city', troops: 10000, region: 'ITALIANS', buildingStyle: 'LATIN' , note: '[14世纪初共和国与文艺复兴期·阿诺河巨石第三城墙] 黑死病前（1338年）佛罗伦萨第三道石墙内实居人口约9.5–11万（乔瓦尼·维拉尼《新编年史》XI.94面粉消费账册折算；Chandler 1300年表9.5万），≥8万且逾10万，定中城。' },
    { id: 'city_venice', name: '威尼斯', factionId: 'kelite', lat: 45.44, lng: 12.31, type: 'medium_city', isPort: true, troops: 10000, region: 'ITALIANS', buildingStyle: 'LATIN' , note: '[15至16世纪威尼斯共和国·潟湖砖石水城] 威尼斯主岛六区建成区1563年官方普查168,627人、1575年鼠疫前达17.5万（Beloch《意大利人口史》及de Vries 1550年表15.8万），>10万定中城。' },
        { id: 'city_talanduo', name: '塔兰托', factionId: 'talanduo', lat: 40.47, lng: 17.24, type: 'medium_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'SPARTANS', note: '[前4世纪大希腊阿契塔执政期·巨石地峡港都] 斯巴达殖民母邦塔兰托前4世纪盛期石墙围合530公顷，城居峰值约8–10万（斯特拉波VI.3.4载可征市民步骑兵3.4万，Hansen 2004《城邦名录》折算城居8–10万），≥8万容差线，定中城。' },
{ id: 'city_naples', name: '那不勒斯', factionId: 'xixiliwangguo', lat: 40.85, lng: 14.26, type: 'medium_city', isPort: true, troops: 10000, region: 'ITALIANS', buildingStyle: 'LATIN' , note: '[16至17世纪西属那不勒斯王国·凝灰岩棱堡首府] 1600–1650年那不勒斯城墙与贴城关厢实居达28–30万（1656年大鼠疫前户籍，de Vries 1600年表28.1万、Chandler表30万），<40万而>10万，定中城。' },
    { id: 'city_barcelona', name: '巴塞罗那', factionId: 'jiatailuoniya', lat: 41.38, lng: 2.17, type: 'small_city', isPort: true, troops: 10000, region: 'LATIN_FEUDAL', buildingStyle: 'SPANISH' , note: '[13至17世纪阿拉贡联合王国与加泰罗尼亚首府·海梅一世与佩德罗四世巨石城墙] 地中海海权与商法重镇巴塞罗那，筑完整中世纪三道巨石城墙与船坞石垣，1340年及1700年城居约4.3–6.4万（de Vries 1984 p.277及Chandler表，未满8万），>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 SPANISH：格拉纳达：西班牙安达卢斯
    { id: 'city_granada', name: '格拉纳达', factionId: 'nasier', lat: 37.17, lng: -3.6, type: 'medium_city', troops: 10000, region: 'ALMOHAD', buildingStyle: 'ORIE' , note: '[14至15世纪纳斯尔王朝·石砖红堡与阿尔拜辛城垣] 纳斯尔王朝末期（1450–1492年）格拉纳达城垣与阿尔拜辛城区人口约10–16.5万（Ladero Quesada据摩尔人税册考算及Chandler 1450年表16.5万），>10万定中城。' },
    { id: 'city_genoa', name: '热那亚', factionId: 'kelimiya', lat: 44.4, lng: 8.94, type: 'medium_city', isPort: true, troops: 10000, region: 'LATIN_IMPERIAL', buildingStyle: 'LATIN' , note: '[13至17世纪热那亚共和国·依山巨石新旧城墙港都] 热那亚海权与金融黄金期石墙城区1300年约8–10万、1650年约7.5–9万（Chandler 1300年表10万；Bairoch《欧洲城市人口》），≥8万容差线，定中城。' },
        { id: 'city_teernuowo', name: '特尔诺沃', factionId: 'baojialiya', lat: 43.08, lng: 25.65, type: 'small_city', troops: 10000, region: 'SLAVIC_CASTLE', buildingStyle: 'BULGARIANS', note: '[12至14世纪保加利亚第二帝国首都·扬特拉河曲查雷维茨三重巨石皇城垣] 阿森兄弟复国至伊凡·亚历山大时期帝国都城大特尔诺沃，查雷维茨与特拉佩齐察双山巨石厚墙围合内城及河谷商区，14世纪盛期城居约1.5–2.5万（保加利亚科学院中世纪考古考算），>1万定小城。' },
{ id: 'city_plovdiv', name: '普罗夫迪夫', factionId: 'seleisi', lat: 42.14, lng: 24.74, type: 'small_city', troops: 10000, region: 'THRACIAN', buildingStyle: 'THRACIAN', note: '[腓力二世菲利波波利斯至罗马拜占庭奥斯曼期·三丘巨石夹砖环城墙] 色雷斯平原首邑普罗夫迪夫，现存马其顿巨石基与罗马拜占庭砖石城门（Hisar Kapia），罗马盛期及17世纪奥斯曼时期（切莱比记述与税册）城居达2–3万，>1万且具石墙，定小城。' },

    { id: 'city_brest', name: '布列斯特', factionId: 'litaowan', lat: 52.09, lng: 23.68, type: 'stockade', troops: 10000, region: 'LITHUANIANS', buildingStyle: 'LITHUANIANS', note: '[14至16世纪立陶宛大公国西布格河要邑布列斯特·木土城堡与木构市镇] 1409年雅盖沃与维陶塔斯筹划格伦瓦尔德会战地、1596年教会联合会议城，据1566年立陶宛王室清册实载1,091户约6000–6500人且市镇仅具木土防垣无石砖环墙，定城寨。' },
    { id: 'city_zhytomyr', name: '日托米尔', factionId: 'jialixiya', lat: 50.25, lng: 28.65, type: 'stockade', troops: 10000, region: 'SLAVIC', buildingStyle: 'SLAVIC', note: '[10世纪德列夫利安聚落至14至17世纪立陶宛波属基辅省副邑·捷捷列夫河木构城堡市镇] 1320年格季米纳斯并入立陶宛，1545年王室巡视清册详载日托米尔为双层原木塔楼城堡及百余户木屋市镇，≤1700年屡经鞑靼与哥萨克战火常住仅2000–4000人，定城寨。' },

    { id: 'city_heidelberg', name: '海德堡', factionId: 'pufaerci', lat: 49.4, lng: 8.68, type: 'small_city', troops: 10000, region: 'HRE', buildingStyle: 'GERMANIC', note: '[14至17世纪普法尔茨选侯国首府·砂岩城堡与石墙大学城] 1196年建镇、1386年设海德堡大学，为莱茵普法尔茨选侯驻都与有市政户籍的居民城（非守道关塞），1689年战火前城居约6000–8000人且具完整中世纪石砌城墙，按<1万石墙城定小城。' },
    { id: 'city_hamburg', name: '汉堡', factionId: 'hansa', lat: 53.55, lng: 9.99, type: 'small_city', isPort: true, troops: 10000, region: 'HRE', buildingStyle: 'SAXONS' , note: '[13至17世纪汉萨核心帝国自由市·1616至1625年约翰·范·瓦尔肯堡巨型砖石棱堡环墙] 易北河下游大港汉堡，三十年战争前建成22座棱堡巨型环城防线而免遭战火，1650年城居达7.5万、1700年约7万（de Vries 1984 p.272，贴近但未满8万中城容差线），定小城。' },
    { id: 'city_lubeck', name: '吕贝克', factionId: 'hansa', lat: 53.87, lng: 10.69, type: 'small_city', isPort: true, region: 'HRE', buildingStyle: 'GERMANIC', troops: 10000, note: '[13至16世纪汉萨同盟盟主帝国自由市·红砖哥特城墙与荷尔斯泰因门] 波罗的海贸易枢纽吕贝克具完整红砖环城墙与棱堡，1400–1600年城居稳定达2.2–2.5万（de Vries 1984 p.272及Hammel-Kiesow吕贝克地籍考证），>1万定小城。' },
    { id: 'city_amsterdam', name: '阿姆斯特丹', factionId: 'nidelan', lat: 52.3676, lng: 4.9041, type: 'medium_city', isPort: true, troops: 10000, region: 'GERMANIC_IMPERIAL', buildingStyle: 'GERMANIC', note: '[17世纪荷兰黄金时代·砖石星形棱堡运河商都] 荷属东印度公司总部阿姆斯特丹1650年约17.5万、1700年运河环棱堡城垣内达20万（de Vries 1984 p.271荷兰户籍实测），>10万定中城。' },
    { id: 'city_york', name: '约克', factionId: 'weijing_york', lat: 53.95, lng: -1.08, type: 'small_city', troops: 10000, region: 'VIKINGS', buildingStyle: 'BRITONS' , note: '[罗马埃博拉库姆、维京约维克至中世纪英格兰北都·完整4公里镁质石灰岩城墙] 英格兰保存最完整中世纪石砌四门环城墙与克利福德塔，1377年人头税居英格兰第二大城，1650–1700年城居约1.2–1.4万（de Vries 1984 p.270）且具完整石墙，定小城。' },
    // 🔴 [2026-09-18 主人定：一级按真实地理、二级按民族政权] 原「BRITONS」→ 归 CELTS：卡莱尔：苏格兰—英格兰边境（region=SCOTLAND），苏格兰王国故地
    { id: 'city_carlisle', name: '卡莱尔', factionId: 'scotland', lat: 54.89, lng: -2.93, type: 'small_city', troops: 10000, region: 'SCOTLAND', buildingStyle: 'CELTS', note: '[12至17世纪英苏边境重城·红砂岩城堡与环城石墙自治市] 亨利一世始筑红砂岩石砌环城墙连结卡莱尔城堡与西墙、东墙三门，具完整主教座堂与市镇议会户籍，14–17世纪城居约2000–4000人，<1万具完整石墙，定小城。' },
        { id: 'city_dijon', name: '第戎', factionId: 'bogendigongguo', lat: 47.32, lng: 5.04, type: 'small_city', troops: 10000, region: 'BURGUNDIANS', buildingStyle: 'BURGUNDIANS' , note: '[14至15世纪瓦卢瓦勃艮第公国首都·十八塔石砌环城高墙公爵都城] 菲利普二世至大胆查理四代勃艮第公爵王都第戎，1513年瑞士军围攻石墙，1600–1700年城居达2–2.2万（de Vries 1984 p.273），>1万且具石墙，定小城。' },
    // 🔴 [2026-10-25 主人令「为某文化某时代补点」] 日内瓦＝勃艮第王国 443–461 年都城（443 年勃艮第人经埃提乌斯安置于萨伏依，都城内梅/日内瓦；461 后迁里昂）；离最近据点尚贝里 73km（>50km）故新建；建筑文化按该时代当地本地政权判＝勃艮第（BURGUNDIANS），不按后世最著名的加尔文日内瓦
    { id: 'city_geneva', name: '日内瓦', factionId: 'bogendi_wangguo', lat: 46.2044, lng: 6.1432, type: 'small_city', troops: 10000, region: 'BURGUNDIANS', buildingStyle: 'BURGUNDIANS', note: '[15至17世纪日内瓦自治共和国·圣热尔韦双岸石砖星形棱堡城墙] 宗教改革重镇日内瓦，1602年市民凭石砌棱堡城墙挫败萨伏伊公爵「登城之夜」偷袭，1600–1700年城居达1.5–1.85万（de Vries 1984 p.275、Monter考证），>1万定小城。' },


    { id: 'city_shangbeili', name: '尚贝里', factionId: 'safuyi', lat: 45.57, lng: 5.92, type: 'small_city', troops: 10000, region: 'ITALIANS', buildingStyle: 'LATIN', note: '[13至16世纪中叶萨伏伊伯国与公国首府·公爵石堡与十四世纪石砌环城墙] 1295–1563年萨伏伊王朝法定首都尚贝里，控阿尔卑斯西麓孔道，1352年后筑完整石砌环城墙与三城门，16世纪迁都前城居约6000–8000人，<1万但具完整石墙，定小城。' },
    { id: 'city_lyon', name: '里昂', factionId: 'luoma_diguo', lat: 45.76, lng: 4.83, type: 'medium_city', troops: 10000, region: 'ROMA', buildingStyle: 'ROMA', note: '[罗马高卢首府卢格杜努姆·罗讷河石砌都城郭] 性质与石墙锁定罗马三高卢首府卢格杜努姆（罗马时城居约5–7万）；≤1700年同址城居峰值于1700年达9.7万（de Vries 1984 p.273），≥8万容差线，定中城。' },

    { id: 'city_bordeaux', name: '波尔多', factionId: 'aquidan', lat: 44.83, lng: -0.57, type: 'small_city', isPort: true, troops: 10000, region: 'BRITONS', buildingStyle: 'FRANKS' , note: '[12至15世纪英属阿基坦首府至17世纪法国大港·三道石灰岩环城墙与喇叭堡] 加龙河口葡萄酒海贸都会波尔多，1302年扩筑第三道巨石城墙围合全城，1600年城居约4万、1700年达4.5万（de Vries 1984 p.273），>1万定小城。' },
    { id: 'city_avignon', name: '阿维尼翁', factionId: 'puluowangsi', lat: 43.94, lng: 4.8, type: 'small_city', troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS' , note: '[14世纪天主教阿维尼翁教廷驻都·4.3公里三十九方塔完整石灰岩城墙] 1309–1377年七任教皇驻都，英诺森六世与乌尔班五世筑现存完整巨石垛口环城墙与教皇宫，1370年代城居峰值达3–4万（Guillemain《阿维尼翁教廷与城市考》），>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 LATIN：米兰：意大利，用意大利古典石堡
    { id: 'city_milan', name: '米兰', factionId: 'lunbadi', lat: 45.46, lng: 9.19, type: 'medium_city', troops: 10000, region: 'LOMBARDS', buildingStyle: 'LATIN', note: '[伦巴第至中世纪公国盛期·石砖双环城垣大邑] 13世纪末邦维辛《米兰奇观》载城民约15万，1600年西班牙墙内实测12–13万（de Vries 1600年表12万、Chandler 1300年表12万），>10万定中城。' },
    { id: 'city_palma', name: '帕尔马', factionId: 'jiatailuoniya', lat: 39.57, lng: 2.65, type: 'small_city', isPort: true, troops: 10000, region: 'LATIN_FEUDAL', buildingStyle: 'SPANISH', note: '[13至17世纪阿拉贡马略卡王国首府·砂岩巨石海防棱堡城墙港都] 1229年海梅一世收复后为地中海西岸航运大埠，筑完整巨石城垣，16世纪城居约1.8–2.5万（de Vries 1984 p.277马略卡帕尔马2.5万），>1万定小城。' },
    { id: 'city_ravenna', name: '拉文纳', factionId: 'donggete', lat: 44.41, lng: 12.2, type: 'small_city', isPort: true, troops: 10000, region: 'GOTHS', buildingStyle: 'GOTHS', note: '[5至6世纪西罗马末都与东哥特王国首都·狄奥多里克红砖厚墙帝都] 402年霍诺留迁都、493–526年东哥特王狄奥多里克大帝都城拉文纳，筑4.5公里高大烧砖环城墙与克拉塞军港，5–6世纪城居峰值约3–5万（Deliyannis 2010《晚期古代拉文纳》），>1万定小城。' },

    { id: 'city_toledo', name: '托莱多', factionId: 'xigete', lat: 39.86, lng: -4.02, type: 'small_city', troops: 10000, region: 'GOTHS', buildingStyle: 'GOTHS', note: '[6至8世纪西哥特王国都城至16世纪西班牙皇都·塔霍河花岗岩双层石墙] 西哥特王都瓦姆巴王重修石墙，卡斯蒂利亚收复后至1560年代腓力二世迁都前城居峰值达5.5–6.2万（1561年普查1.13万户合5.5–6万口，de Vries 1984 p.278），>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 SPANISH：科尔多瓦：西班牙安达卢斯
    { id: 'city_cordoba', name: '科尔多瓦', factionId: 'womaya', lat: 37.88, lng: -4.77, type: 'big_city', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[10世纪后倭马亚哈里发国·石砖都城郭] 后倭马亚哈里发国极盛期（约1000年）内城与二十一处连片关厢居民城峰值约45万（伊本·哈扬史料及Chandler《四千年城市发展》1000年表45万），≥40万容差线，定大城。' },
    { id: 'city_zaragoza', name: '萨拉戈萨', factionId: 'alagong', lat: 41.65, lng: -0.88, type: 'small_city', troops: 10000, region: 'ARAGON', buildingStyle: 'SPANISH' , note: '[摩尔萨拉戈萨泰法王都至阿拉贡王国首府·罗马石墙与砖石外郭阿尔哈费里亚] 埃布罗河中游首邑萨拉戈萨，承罗马切石内墙与中世纪砖石外墙，1600–1700年城居达2.5–3万（de Vries 1984 p.278），>1万定小城。' },
    { id: 'city_eger', name: '维雷茨基', factionId: 'mazhaer', lat: 48.77, lng: 23.17, type: 'stockade', troops: 10000, region: 'SLAVIC_FEUDAL', buildingStyle: 'MAGYAR', note: '[895年马扎尔七部征服潘诺尼亚通道·喀尔巴阡山维雷茨基山口木栅边卡聚落] 《匈牙利人业绩记》（Gesta Hungarorum）载895年阿尔帕德率马扎尔部众越维雷茨基山口入蒂萨平原、1241年拔都主力亦破此山口原木鹿砦栅门入匈，木栅不算墙且山口聚落不足千人，定城寨。' },

    // 🔴 [2026-09-18 主人定：一级按真实地理、二级按民族政权] 原「BRITONS」→ 归 CELTS：都柏林：爱尔兰，凯尔特（region=CELTS_FEUDAL）
    { id: 'city_dublin', name: '都柏林', factionId: 'dalriada', lat: 53.34, lng: -6.26, type: 'small_city', isPort: true, troops: 10000, region: 'CELTS_FEUDAL', buildingStyle: 'CELTS' , note: '[诺斯都柏林王国至12至17世纪英属爱尔兰首府·利菲河石砌城堡与环城墙] 1100年诺斯—爱尔兰时期已筑石墙，盎格鲁-诺曼扩建都柏林城堡与市政石垣，1650年约1.7万、1700年飙升至6万（de Vries 1984 p.271），>1万定小城。' },
    // 🔴 [2026-09-18 主人定：一级按真实地理、二级按民族政权] 原「WEST」→ 归 CELTS：卡舍尔：爱尔兰凯尔特王城（region=CELTS_FEUDAL）
    { id: 'city_kasheer', name: '卡舍尔', factionId: 'mangsite', lat: 52.5202, lng: -7.8907, type: 'small_city', troops: 10000, region: 'CELTS_FEUDAL', buildingStyle: 'CELTS', note: '[12至17世纪爱尔兰芒斯特旧王都与主教市镇·石灰岩环城墙卡舍尔] 卡舍尔岩皇家圣地山脚自治市镇，1319年爱德华二世颁筑墙税修筑完整石灰岩环城墙（围合12公顷市民城区），≤1700年城居约1500–3000人，<1万具完整石墙，定小城。' },
    // 🔴 [2026-09-18 主人定：一级按真实地理、二级按民族政权] 原「WEST」只给一级、二级靠 region(BRITONS) 推
    //    → 归 CELTS：利默里克在爱尔兰（凯尔特语族地区，region 里的 BRITONS 是英伦泛称，不适用爱尔兰）
    { id: 'city_limerick', name: '利默里克', factionId: 'tuomengde', lat: 52.6664, lng: -8.6957, type: 'small_city', isPort: true, troops: 10000, region: 'BRITONS', buildingStyle: 'CELTS', note: '[13至17世纪爱尔兰香农河口港城·英王城与爱尔兰城双重石砌环城墙] 约翰王城堡及南北双城区完整石灰岩高墙（1651与1690–1691年两度抗击克伦威尔军与威廉三世重炮围攻），17世纪下半叶城居约5000–8000人，<1万具坚固石墙，定小城。' },





    { id: 'city_calais', name: '加莱', factionId: 'fulandesi', lat: 50.95, lng: 1.85, type: 'small_city', isPort: true, troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS', mirror: true, note: '[14至17世纪英法海峡锁钥市镇·石砖双壕环城墙与里斯班石堡] 1346–1347年爱德华三世围城十一月后为英属羊毛专卖市镇、1558年归法，具完整石砖环城高墙与棱堡，14–17世纪城居约7000–9000人，<1万具石砖城墙，定小城。' },

    { id: 'city_rennes', name: '雷恩', factionId: 'bulietani', lat: 48.11, lng: -1.67, type: 'small_city', troops: 10000, region: 'CELTS_FEUDAL', buildingStyle: 'BRITONS', note: '[15至17世纪布列塔尼公国都城与高等法院首府·三代花岗岩石砌城墙] 15世纪扩筑完整三道石砌环城墙与莫尔代莱斯石门，1600–1700年城居达2–3万（de Vries 1984 p.273载1700年约2.5–3万），>1万且具石墙，定小城。' },
    { id: 'city_syracuse', name: '锡拉库萨', factionId: 'xixiliwangguo', lat: 37.07, lng: 15.28, type: 'medium_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'SICILIANS' , note: '[前4至前3世纪希腊化西西里霸主·埃皮波莱巨石长城] 狄奥尼修斯一世至阿加索克利、希耶罗二世时期27公里巨石城垣内五区连片人口约10–15万（斯特拉波VI.2.4及Chandler前300年表10–12万），>10万定中城。' },
    { id: 'city_bucharest', name: '布加勒斯特', factionId: 'walajiyia', lat: 44.43, lng: 26.1, type: 'small_city', troops: 10000, region: 'SLAVIC_CASTLE', buildingStyle: 'SLAVIC', note: '[16至17世纪瓦拉几亚公国都城·登博维察河畔王宫与连片商工都邑] 弗拉德三世筑旧宫后渐替特尔戈维什泰为瓦拉几亚正式都城，17世纪下半叶切莱比与西方使臣实记城居达4–5万（Chandler 1700年表5万、Giurescu《布加勒斯特史》），>1万定小城。' },
    { id: 'city_belgrade', name: '贝尔格莱德', factionId: 'saierweiya', lat: 44.78, lng: 20.45, type: 'small_city', troops: 10000, region: 'SERBIA', buildingStyle: 'MAGYAR', note: '[15世纪塞尔维亚专制公国都与匈牙利南门要邑·卡莱梅格丹双重巨石城垣] 1404年斯特凡·拉扎列维奇扩筑上城下城双重石墙，1456年匈雅提守城大捷，16–17世纪奥斯曼统治期下城多尔乔尔商坊繁盛、城居达4–6万（切莱比游记及Bairoch表5万），>1万定小城。' },


    // 🔴 [2026-09-18 主人定：一级按真实地理、二级按民族政权] 原「BRITONS」→ 归 CELTS：爱丁堡：苏格兰，凯尔特／皮克特故地
    { id: 'city_aidingbao', name: '爱丁堡', factionId: 'piketai', lat: 55.95, lng: -3.18, type: 'small_city', isPort: true, troops: 10000, region: 'GERMANIC_FEUDAL', buildingStyle: 'CELTS' , note: '[12至17世纪苏格兰王国首都·火山岩城堡与弗洛登石砌环城高墙] 苏格兰王室议会与最高法院首府爱丁堡，1450年筑国王墙、1513年后扩筑弗洛登石墙，1650–1700年连同坎农门关厢城居达3–3.5万（de Vries 1984 p.271），>1万定小城。' },
    { id: 'city_wupusala', name: '乌普萨拉', factionId: 'ruidian_si', lat: 59.85, lng: 17.63, type: 'stockade', troops: 10000, region: 'VIKINGS', buildingStyle: 'VIKINGS', note: '[6至11世纪瑞典维京时代斯维阿王廷旧乌普萨拉·皇家大土冢木构神庙与祭祀聚落] 不来梅的亚当《汉堡大主教史》与斯诺里《挪威王列传》所载北欧斯维阿诸王加冕土冢与木构大神庙中心，无石砖城墙且中世纪乌普萨拉至1700年常住仅约3000–4000人，定城寨。' },
    // 🔴 [2026-10-25 主人定「B」] 维斯比/哥特兰＝哥特人起源地 Scandza；离最近据点斯德哥尔摩约 190km（>50km）故新建；文化按当地政权＝北欧日耳曼 → VIKINGS
    { id: 'city_weishibi', name: '维斯比', factionId: 'donggete', lat: 57.64, lng: 18.29, type: 'stockade', isPort: true, troops: 10000, region: 'VIKINGS', buildingStyle: 'VIKINGS', note: '[铁器时代至维京前期哥得兰岛海上聚落（哥特人起源传说地）·海岸干石木栅商港营聚] 约达尼斯《哥特史》4章所述哥特南迁传说与维京时代哥得兰海商锚地（本据点锁定VIKINGS维京及早期哥特阶段，早于13世纪日耳曼汉萨石墙），维京期仅土垒木栅且常住数千人<1万，定城寨。' },
    { id: 'city_lundun', name: '伦敦', factionId: 'yinggelan', lat: 51.5, lng: -0.12, type: 'big_city', isPort: true, troops: 10000, region: 'ANGLO_SAXON', buildingStyle: 'BRITONS', note: '[17世纪英格兰王国·石砖都城与关厢] 斯图亚特王朝晚期伦敦城墙内外及威斯敏斯特、南华克连片关厢1650年约40万、1700年达57.5万（Chandler 1987；Wrigley英格兰人口史考算），≤1700年峰值>50万，定大城。' },


    { id: 'city_winchester', name: '温彻斯特', factionId: 'yinggelan', lat: 51.06, lng: -1.31, type: 'small_city', troops: 10000, region: 'BRITONS', buildingStyle: 'BRITONS' , note: '[盎格鲁撒克逊威塞克斯王都至诺曼期·罗马地基燧石切石环城墙古都] 阿尔弗雷德大帝规划街道并重修罗马基石环城墙与西门，11–12世纪《温彻斯特调查》载城居峰值约8000–10000人（Keene 1985《中世纪温彻斯特考》），具完整石墙定小城。' },
    { id: 'city_bali', name: '巴黎', factionId: 'gaolu', lat: 48.85, lng: 2.35, type: 'big_city', troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS', note: '[17世纪法兰西波旁期·石砌棱堡都城郭] 路易十四时期巴黎城垣及圣日耳曼等连片关厢1650年约42万、1700年达50–53万（de Vries《欧洲城市化1500–1800》及Chandler 1700年表），≤1700年峰值≥50万，定大城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「WEST」推出的二级与史实不符 → 归 FRANKS：沙特尔（法国）：法兰克，改前误挂意大利(LATIN)
    { id: 'city_shatteer', name: '沙特尔', factionId: 'kaernute', lat: 48.448, lng: 1.488, type: 'small_city', troops: 10000, region: 'LATIN', buildingStyle: 'FRANKS', note: '[12至17世纪法兰西沙特尔伯爵与朝圣主教城·厄尔河石砌环城墙与纪尧姆石门] 中世纪经院哲学与哥特大教堂圣城沙特尔，筑完整石砌环城墙（1591年亨利四世围攻石墙破城并于此加冕），16–17世纪城居约1–1.2万（de Vries 1984 p.273）且具石墙，定小城。' },
    { id: 'city_luoma', name: '罗马', factionId: 'luoma_diguo', lat: 41.9, lng: 12.49, type: 'big_city', isPort: true, troops: 10000, region: 'IMPERIAL_ROME', buildingStyle: 'ROMA' , note: '[1至2世纪罗马帝国盛期·砖石帝都城垣] 罗马帝国元首制盛期奥勒良城墙圈及台伯河西岸连片城区居民峰值约80–100万（奥古斯都谷物配给民册与Storey 1997／Modelski 2003考算），>50万定大城。' },
    { id: 'city_yadian', name: '雅典', factionId: 'xila', lat: 37.98, lng: 23.72, type: 'medium_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'ATHENIANS', note: '[前5世纪古典雅典全盛期·地米斯托克利石墙与长墙港都] 前431年伯罗奔尼撒战争爆发前夕雅典主城、长墙廊道及比雷埃夫斯港连片城居约12–16万（修昔底德II.13公民重装兵与舰队规模及Gomme／Hansen考算），>10万定中城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 SPANISH：加的斯：西班牙
    { id: 'city_jiadisi', name: '加的斯', factionId: 'buni', lat: 36.52, lng: -6.28, type: 'small_city', isPort: true, troops: 10000, region: 'CARTHAGE', buildingStyle: 'SPANISH' , note: '[腓尼基迦太基西海巨埠至16至17世纪西印度大帆船港·巨石棱堡环海防墙] 古典加迪尔（斯特拉波III.5.3载其骑士富豪人数仅次罗马、帕塔维乌姆），1596年后西班牙筑完整巨石海防城墙与陆门，1700年城居达4万（de Vries 1984 p.277），>1万定小城。' },
    { id: 'city_lisiben', name: '里斯本', factionId: 'putaoya', lat: 38.72, lng: -9.13, type: 'medium_city', isPort: true, troops: 10000, region: 'PORTUGUESE', buildingStyle: 'PORTUGUESE', note: '[16至17世纪葡萄牙王国·费尔南多石墙海权王都] 大航海鼎盛期里斯本费尔南多石墙及沿河关厢1600年约10–13万、1700年达16.5–18万（罗德里格斯户籍考证及de Vries 1700年表18万），>10万定中城。' },

    { id: 'city_weiyeena', name: '维也纳', factionId: 'habusibao', lat: 48.2, lng: 16.37, type: 'medium_city', troops: 10000, region: 'HRE', buildingStyle: 'GERMANIC', note: '[17世纪末哈布斯堡帝国皇都·砖石星形棱堡城垣与关厢] 1683年抗奥斯曼大围攻后维也纳内城棱堡与近郊关厢（Vorstädte）迅速繁盛，1700年城关实居达11.4万（de Vries 1984 p.274及Chandler 1700年表11.4万），≤1700年峰值>10万，定中城。' },
    { id: 'city_bulage', name: '布拉格', factionId: 'boximiya', lat: 50.07, lng: 14.43, type: 'small_city', troops: 10000, region: 'BOHEMIANS', buildingStyle: 'BOHEMIANS' , note: '[14世纪卢森堡查理四世与1600年鲁道夫二世帝都·饥饿石墙与四城石垣] 神圣罗马帝国皇都布拉格（老城、新城、小城、城堡区石砌高墙合围），1370年代约4万、1600年鲁道夫二世驻跸期峰值达6–7万（Janáček考算及de Vries 1600年表6万，未满8万），>1万定小城。' },
    { id: 'city_budapeisi', name: '布达佩斯', factionId: 'mazhaer', lat: 47.49, lng: 19.04, type: 'small_city', troops: 10000, region: 'MAGYAR', buildingStyle: 'MAGYAR' , note: '[15世纪匈牙利马加什一世黄金时代王都·布达城堡山与佩斯双岸石墙] 多瑙河西岸王都布达与东岸商城佩斯均筑完整石砌城垣，1490年马加什一世卒前双城连片常住人口约2.5–3.5万（Kubinyi《中世纪晚期布达人口史》），>1万定小城。' },
    { id: 'city_huneiduolala', name: '胡内多阿拉', factionId: 'mazhaer', lat: 45.749, lng: 22.888, type: 'stockade', troops: 10000, region: 'MAGYAR', buildingStyle: 'MAGYAR', note: '[15世纪匈牙利摄政匈雅提家族领地胡内多阿拉·哥特石堡与无墙冶铁小镇] 匈雅提·亚诺什与马加什一世修筑科尔温石堡，但堡外市镇（Oppidum）无环城石墙且非守道关塞，1512年地籍册实载仅196户约1000人、17世纪约1200人，定城寨。' },
    { id: 'city_saigede', name: '塞格德', factionId: 'xiongren', lat: 46.25, lng: 20.15, type: 'stockade', troops: 10000, region: 'HUNS', buildingStyle: 'HUNS', note: '[5世纪匈人帝国阿提拉王庭营地·蒂萨河与马罗什河汇流平原大型木构王宫营帐] 449年东罗马使臣普里斯库斯《出使匈人纪》亲访详记阿提拉大本营具雕花原木围栏、木构大殿与浴池而无城石墙（非守道关塞），草原汗庭常住侍卫部众不足万人城市规模，定城寨。' },
    { id: 'city_kelong', name: '科隆', factionId: 'falanji', lat: 50.93, lng: 6.95, type: 'small_city', troops: 10000, region: 'FRANKS', buildingStyle: 'FRANKS' , note: '[12至16世纪神圣罗马帝国最大自由市与选侯大主教城·7.5公里十二门中世纪石墙] 1180年起修筑半圆形巨型石砖城墙（现存塞弗林门、哈嫩门等巨型双塔石门），1300–1600年城居长期维持4–5.2万（de Vries 1984 p.272），>1万定小城。' },
    { id: 'city_lahexiuyuan', name: '拉赫修院', factionId: 'wende', lat: 50.402359, lng: 7.252187, type: 'stockade', troops: 10000, region: 'GERMANIC_FEUDAL', buildingStyle: 'GERMANIC', note: '[11至13世纪莱茵普法尔茨伯爵创建拉赫本笃会修道院·火山湖畔罗曼石教堂修院聚落] 1093年拉赫的亨利二世创立之本笃会修道院（非军事要塞亦非设防市镇），中世纪常住修士与依附佃工仅数百人<1万，定城寨。' },
    { id: 'city_yachen', name: '亚琛', factionId: 'falanji', lat: 50.77, lng: 6.08, type: 'small_city', troops: 10000, region: 'FRANKS', buildingStyle: 'FRANKS' , note: '[8至16世纪查理曼加洛林王城与神圣罗马加冕自由市·巴尔巴罗萨内外两道石墙] 查理大帝宫廷中枢，腓特烈一世与13–14世纪市民修筑内外两道多塔巨石环城墙（庞特门与马尔斯门现存），1500–1600年城居约1.5–1.8万（de Vries 1984 p.272），>1万定小城。' },
    { id: 'city_meiyinci', name: '美因茨', factionId: 'falanji', lat: 50, lng: 8.27, type: 'small_city', troops: 10000, region: 'GERMANIC_FEUDAL', buildingStyle: 'GERMANIC' , note: '[中世纪神圣罗马帝国首席选侯大主教驻都·莱茵河砂岩石砌环城墙与棱堡] 「黄金美因茨」帝国大宰相驻地与古腾堡印刷发祥城，具中世纪红砂岩环城墙与17世纪圣约翰棱堡，1500–1700年城居约1.5–2万（de Vries 1984 p.273），>1万定小城。' },
    { id: 'city_aogesibao', name: '奥格斯堡', factionId: 'shiwaben', lat: 48.37, lng: 10.89, type: 'small_city', troops: 10000, region: 'GERMANIC_FEUDAL', buildingStyle: 'GERMANIC' , note: '[15至16世纪福格尔家族金融之都与帝国议会自由市·红砖石基深壕环城墙] 南德银铜金融与纺织中心奥格斯堡，具完整砖石城墙与水塔防系，三十年战争前1600–1618年城内实测人口达4.5–4.8万（Roeck《三十年战争时期的奥格斯堡》及de Vries表4.8万），>1万定小城。' },
    { id: 'city_bolandengbao', name: '勃兰登堡', factionId: 'asikanani', lat: 52.41, lng: 12.55, type: 'small_city', troops: 10000, region: 'HRE', buildingStyle: 'GERMANIC' , note: '[12至16世纪勃兰登堡藩侯国发祥首邑·哈弗尔河新旧双城红砖环城墙] 阿伯特熊夺城后发展为老城与新城两座自治市，筑完整中世纪红砖环城墙与四座砖砌城门塔楼，15–16世纪城居约5000–7000人，<1万具红砖城墙，定小城。' },
    { id: 'city_magedebao', name: '马格德堡', factionId: 'wende', lat: 52.13, lng: 11.61, type: 'small_city', troops: 10000, region: 'GERMANIC_FEUDAL', buildingStyle: 'SAXONS' , note: '[10世纪奥托大帝重都至16至17世纪易北河汉萨坚城·双层巨石棱堡城垣] 奥托一世大主教座、《马格德堡城市法》母城，1631年蒂利伯爵攻陷前石砖棱堡墙内实居达3–3.5万（Guericke记述及de Vries 1600年表2.5–3万），>1万定小城。' },
    // 🔴 [2026-10-25 主人令「存在就建」] 不伦瑞克＝狮亨利都城（萨克森公国）；离最近据点马格德堡 75km（>50km）故新建；文化按当地政权＝萨克森 → SAXONS
    { id: 'city_bulunruike', name: '不伦瑞克', factionId: 'wende', lat: 52.27, lng: 10.52, type: 'small_city', troops: 10000, region: 'GERMANIC_CASTLE', buildingStyle: 'SAXONS', note: '[12世纪狮子亨利萨克森公爵都城与汉萨重镇·奥克河石砖环城墙不伦瑞克] 韦尔夫家族都城与汉萨内陆中枢（丹克瓦德罗德石堡与五区联合市镇），筑厚重石砖水壕城墙，1500–1600年城居约1.6–1.8万（Bairoch 1988及de Vries表1.6万），>1万定小城。' },
    { id: 'city_leigensibao', name: '雷根斯堡', factionId: 'bafaliya', lat: 49.01, lng: 12.09, type: 'small_city', troops: 10000, region: 'GERMANIC_FEUDAL', buildingStyle: 'GERMANIC' , note: '[巴伐利亚早期公爵都城与神圣罗马永久帝国议会驻地·罗马基石中世纪环城石墙] 多瑙河石桥商贸自由市雷根斯堡，保存罗马东门（Porta Praetoria）及完整中世纪石墙，13–16世纪城居约1.5–2.2万（de Vries 1984 p.273），>1万定小城。' },
    { id: 'city_niulunbao', name: '纽伦堡', factionId: 'asikanani', lat: 49.45, lng: 11.07, type: 'small_city', troops: 10000, region: 'HRE', buildingStyle: 'GERMANIC' , note: '[14至16世纪帝国宝器驻藏自由市与德意志文艺复兴之都·5公里砂岩双墙深壕] 凯撒堡与全欧最坚固5公里双层砂岩火炮城墙完好合围，1500–1620年城内实居达3.8–4.5万（de Vries 1984 p.273载1600年4万），>1万定小城。' },
    { id: 'city_teerier', name: '特里尔', factionId: 'luoma_diguo', lat: 49.75, lng: 6.64, type: 'small_city', troops: 10000, region: 'ROMA', buildingStyle: 'ROMA', note: '[3至4世纪罗马帝国四帝共治西部首府奥古斯塔特雷维罗鲁姆·黑门巨石环城墙] 君士坦丁大帝驻跸之高卢大区首府特里尔，筑6.4公里砂岩巨石城墙（Porta Nigra黑门现存），4世纪帝国极盛期城居达5–7万（Wightman《罗马特里尔考》），>1万且具罗马石墙，定小城。' },
    { id: 'city_basaier', name: '巴塞尔', factionId: 'ruishi', lat: 47.55, lng: 7.58, type: 'small_city', troops: 10000, region: 'GERMANIC_IMPERIAL', buildingStyle: 'GERMANIC' , note: '[15至17世纪瑞士邦联莱茵河大学名城·1398年外环四十塔石砌大城墙] 1431年大公会议驻地、1501年入瑞士邦联，外环石墙（含斯帕伦石门）围合两岸城区，1600–1700年城居约1.2–1.5万（de Vries 1984 p.275）且具石墙，定小城。' },
    { id: 'city_sitelasibao', name: '斯特拉斯堡', factionId: 'luoma_diguo', lat: 48.57, lng: 7.75, type: 'small_city', troops: 10000, region: 'GERMANIC', buildingStyle: 'GERMANIC' , note: '[13至17世纪阿尔萨斯帝国自由市·伊尔河石砖棱堡双环城墙与桥塔] 莱茵河中游文化军事重镇斯特拉斯堡，筑完整石砖棱堡环墙（1681年后沃邦再增筑），1600–1700年城居达2.5–3万（Ford《斯特拉斯堡转型》及de Vries表2.6万），>1万定小城。' },
    { id: 'city_aoermuci', name: '奥尔穆茨', factionId: 'boximiya', lat: 49.59, lng: 17.25, type: 'small_city', troops: 10000, region: 'SLAVIC_FEUDAL', buildingStyle: 'BOHEMIANS', note: '[13至17世纪摩拉维亚历史首府·石砖双层环城高墙主教王城] 普热米斯尔王朝摩拉维亚首邑奥尔穆茨，具完整石砖环城墙（三十年战争前为捷克第二大城），1600年前后城居约8000–12000人且具石砖城郭，定小城。' },
    { id: 'city_buernuo', name: '布尔诺', factionId: 'damolaweiya', lat: 49.19, lng: 16.6, type: 'small_city', troops: 10000, region: 'SLAVIC_FEUDAL', buildingStyle: 'BOHEMIANS', note: '[13至17世纪摩拉维亚侯爵驻都·什皮尔伯克石堡与五门石砌环城墙] 1243年瓦茨拉夫一世赐城市特许状筑五门石砌环城墙，1389年税册载墙内999栋石木宅约8400人、1645年凭石墙击退瑞典托尔斯滕松围攻，<1万具完整石墙，定小城。' },

    { id: 'city_jifu', name: '基辅', factionId: 'luosi', lat: 50.45, lng: 30.52, type: 'small_city', troops: 10000, region: 'SLAVIC', buildingStyle: 'SLAVIC', mirror: true , note: '[11至13世纪初基辅罗斯盛期·土垒石门与波多尔商城区] 1240年蒙军破城前雅罗斯拉夫城垣及第聂伯河畔波多尔商区常住人口约4.5–5万（托洛奇科《古基辅研究》考古测算及Chandler 1100–1200年表4.8–5万；1700年仅约2万），未达8万容差线，定小城。' },
    { id: 'city_nuofugeerdede', name: '诺夫哥罗德', factionId: 'luosi', lat: 58.52, lng: 31.27, type: 'small_city', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC', note: '[12至15世纪诺夫哥罗德封建共和国·沃尔霍夫河红砖石克里姆林与外郭土木高垣] 俄罗斯北方汉萨商贸共和国首府大诺夫哥罗德，石砖内城（Detinets）与两岸五端连片城区14–15世纪盛期常住人口达2.5–3.5万（雅宁《诺夫哥罗德桦树皮文书与城市考古》），>1万定小城。' },
    { id: 'city_ladoga', name: '拉多加', factionId: 'luosi', lat: 59.9967, lng: 32.2961, type: 'stockade', troops: 10000, region: 'RUS', buildingStyle: 'VARANGIANS', note: '[8至10世纪瓦良格留里克初驻旧拉多加·沃尔霍夫河木土垒墙与小石垒北欧商站] 《往年纪事》862年条载留里克初驻拉多加（Aldeigjuborg），考古发掘北欧长屋手工业聚落及早期干石土垒小堡，10世纪后重心南移诺夫哥罗德，≤1700年常住仅1000–2000人，定城寨。' },
    { id: 'city_baihu', name: '白湖', factionId: 'luosi', lat: 60.03, lng: 37.79, type: 'stockade', troops: 10000, region: 'RUS', buildingStyle: 'VARANGIANS', note: '[9至15世纪瓦良格西涅乌斯驻地与白湖公国首邑·谢克斯纳河源高大土垒木栅克里姆林] 《往年纪事》862年条载留里克之弟西涅乌斯驻白湖（Beloozero），1487年伊凡三世筑高30米土垒原木塔墙而无石砖城垣，1678年俄国普查册载镇民不足3000人，定城寨。' },
    { id: 'city_mosike', name: '莫斯科', factionId: 'eluosi_diguo', lat: 55.75, lng: 37.61, type: 'medium_city', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC' , note: '[16至17世纪沙皇俄国·红砖克里姆林与白城土城环垣] 莫斯科白城与土城（斯科罗多姆）环垣内1600年约10–12万、1700年约13–15万（沃达尔斯基据1678年俄国户籍册考算及Chandler 1700年表13万），>10万定中城。' },
    { id: 'city_shengpidebao', name: '圣彼得堡', factionId: 'eluosi_diguo', lat: 59.9387, lng: 30.3162, type: 'big_city', isPort: true, troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '🔴 [2026-11-12 按史定级] 俄罗斯新都圣彼得堡；彼得大帝1703年建，1712-1918俄罗斯帝国首都；按历史峰值口径19世纪帝国首都超50万（1800年22万，1850年超50万）；按 2026-10-25 标准：≥40 万 → 大城' },
    { id: 'city_xieerpuhuofu', name: '谢尔普霍夫', factionId: 'eluosi_diguo', lat: 54.92, lng: 37.41, type: 'stockade', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC', note: '[14至17世纪莫斯科南屏奥卡河防线分封王公城·勇者弗拉基米尔木石内堡与无墙木屋商区] 1374年筑橡木克里姆林（1556年改筑小内堡而外镇Posad无石墙），据俄国1552年清册623户约3000人、1678年清册约2500人（沃达尔斯基考证）<1万，定城寨。' },
    { id: 'city_fulajimier', name: '弗拉基米尔', factionId: 'suzidaer', lat: 56.12, lng: 40.4, type: 'small_city', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC' , note: '[12至13世纪初弗拉基米尔-苏兹达尔大公国首都·白石金门与土垒木石重城] 安德烈·博戈柳布斯基与大窝弗谢沃洛德时期东北罗斯最高大公都城，筑白石金门与7公里城垣，1238年拔都破城前城居约1.5–2.5万（沃罗宁《东北罗斯建筑与城市考古》），>1万定小城。' },
    { id: 'city_simolengsike', name: '斯摩棱斯克', factionId: 'daniebo', lat: 54.78, lng: 32.04, type: 'small_city', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC' , note: '[12世纪罗斯公国都城至1596至1602年鲍里斯沙皇筑城·6.5公里三十八塔砖石巨墙] 第聂伯河通莫斯科西门重镇，戈东诺夫命筑厚达5米、周6.5公里巨石红砖长城（1609–1611年抗波兰西吉斯蒙德三世二十月围攻），16–17世纪城居约1.5–2.5万且具砖石巨墙，定小城。' },
    { id: 'city_qiernigeweifu', name: '切尔尼戈夫', factionId: 'qiernigeweifu_gongguo', lat: 51.49, lng: 31.28, type: 'small_city', troops: 10000, region: 'SLAVIC', buildingStyle: 'SLAVIC' , note: '[11至13世纪初切尔尼戈夫大公国首都·杰斯纳河多重内城与外城约400公顷] 仅次于基辅之南罗斯第二大都会，1239年蒙军破城前内城、外城及修道院关厢建成区逾350公顷，考古折算常住人口约2–3万（雷巴科夫《切尔尼戈夫古迹考》），>1万定小城。' },
    { id: 'city_jialiqi', name: '加利奇', factionId: 'jialixiya', lat: 49.12, lng: 24.72, type: 'stockade', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC', note: '[12至13世纪加利西亚罗斯公国旧都加利奇·德涅斯特河高岸三道土垒木墙王城] 八思敏雅罗斯拉夫与丹尼尔王早期都城（《加利西亚-沃里尼亚编年史》），1240年拔都西征攻毁后迅速衰落为小村镇，遗址确证为深壕高土垒上立原木墙无石砖环墙且常住不足1万确数，定城寨。' },
    { id: 'city_pusikefu', name: '普斯科夫', factionId: 'pusikefu_gongheguo', lat: 57.82, lng: 28.33, type: 'small_city', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC' , note: '[14至16世纪普斯科夫共和国与俄国西北坚城·9公里五重石灰岩巨石城墙] 筑克罗姆内城及多夫蒙特城、中城、外城五重共9公里石灰岩厚墙，1581–1582年军民约3万人坚守五个月挫败波兰国王巴托里大军（沃达尔斯基及Bairoch 1500年表2–3万），>1万定小城。' },
    { id: 'city_liangzan', name: '梁赞', factionId: 'ouka', lat: 54.62, lng: 39.74, type: 'small_city', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC' , note: '[12至13世纪初旧梁赞公国都城·奥卡河高岸三重高大土木城垣（60公顷）] 1237年拔都西征首战围破之旧梁赞都城（Staraya Ryazan遗址内城外城逾60公顷，出土大量王公金银窖藏），据蒙加伊特《旧梁赞考古》折算毁城前城居约1–1.5万，定小城。' },
    { id: 'city_boluocike', name: '波洛茨克', factionId: 'xideweina', lat: 55.48, lng: 28.76, type: 'stockade', troops: 10000, region: 'SLAVIC', buildingStyle: 'SLAVIC', note: '[9至16世纪白俄罗斯最古公国都城波洛茨克·西德维纳河原木上城与下城土垒木塔] 弗谢斯拉夫王公与圣索菲亚教堂古邑，1563年伊凡雷帝与1579年巴托里围城战报详载波洛茨克上下两城皆为原木夹土高墙（巴托里纵火焚木墙克城），16–17世纪城居约5000–8000人<1万，定城寨。' },
    { id: 'city_salai', name: '萨莱', factionId: 'jinzhang', lat: 48.15, lng: 47.15, type: 'medium_city', troops: 10000, region: 'CUMAN', buildingStyle: 'CENTRAL_ASIA', note: '[14世纪前半金帐汗国月即别汗期·烧砖泥砖伏尔加都城] 新萨莱（别儿哥萨莱）1333年伊本·白图泰记其连片坊市一日方能骑穿，学界折算城居峰值约10–12万（Chandler 1350年表12万；旧传60万系夸张不取），>10万定中城。' },
    { id: 'city_kashan', name: '喀山', factionId: 'baojiaer', lat: 55.79, lng: 49.11, type: 'small_city', troops: 10000, region: 'CUMAN', buildingStyle: 'CENTRAL_ASIA' , note: '[15至16世纪中叶喀山汗国首都·伏尔加卡马汇口石木克里姆林与外郭商坊] 1438–1552年喀山汗国都城，1552年伊凡雷帝15万大军围城爆破城墙时，城内汗庭驻军与塔塔尔商工居民达3–5万（库尔布斯基《莫斯科大公史》及胡佳科夫《喀山汗国史纲》），>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「EAST」推出的二级与史实不符 → 归 BYZANTINE：赫尔松涅斯（克里米亚）：拜占庭海防要塞（961 年福卡斯收复克里特前的黑海基地）
    { id: 'city_heersongniesi', name: '赫尔松涅斯', factionId: 'bosi_puluosi', lat: 44.61, lng: 33.49, type: 'small_city', isPort: true, troops: 10000, region: 'SCYTHIANS', buildingStyle: 'BYZANTINE' , note: '[古典希腊殖民城至9至10世纪拜占庭赫尔松军区首府·双层切石高塔城墙] 克里米亚西南端千年石城（988年基辅大公弗拉基米尔围攻夺城并受洗处，《往年纪事》），现存古典至拜占庭3.5米厚双层切石城墙与棋盘街区，9–10世纪城居约1–1.5万且具石墙，定小城。' },
    { id: 'city_pantika', name: '潘提卡彭', factionId: 'bosi_puluosi', lat: 45.36, lng: 36.47, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前5至前1世纪博斯普鲁斯王国首都潘提卡彭·米特拉达梯山巨石卫城与海港城垣] 刻赤海峡谷物出口王国首都（琉孔一世至米特拉达梯六世末年驻地，斯特拉波VII.4.4），具多边形切石卫城与环港石墙，前4世纪盛期城居约2–3万（Gajdukevič《博斯普鲁斯王国史》），>1万定小城。' },
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」只是一级母体、取不到 62 类 → 归 LATIN：卡法（费奥多西亚）：热那亚黑海殖民地，用意大利（LATIN）城堡
{ id: 'city_kafa', name: '卡法', factionId: 'kelimiya', lat: 45.03, lng: 35.38, type: 'small_city', isPort: true, troops: 10000, region: 'EAST', buildingStyle: 'LATIN', mirror: true, note: '[14至15世纪热那亚黑海殖民首府与奥斯曼克里米亚大港·双层巨石二十六塔城墙] 黑海丝路终点卡法（费奥多西亚），热那亚筑内外两道巨石高塔城垣，1475年奥斯曼攻占前及16世纪税册实载城居达2–4万（Balard热那亚罗马尼亚考及伊本·白图泰游记），>1万定小城。' },

    { id: 'city_salatuofu', name: '萨拉托夫', factionId: 'eluosi_diguo', lat: 51.53, lng: 46.03, type: 'stockade', troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '[1590至1700年沙俄伏尔加河中游边防据点·扎谢金王公所筑双层松木立栅塔寨] 1590年督军图罗夫与扎谢金筑原木尖塔立栅边城防诺盖骑兵，1670年拉辛哥萨克起义军占领，1678–1700年俄国军镇册载驻军与商民约3000–5000人且为纯木栅墙，定城寨。' },
    { id: 'city_weierniwusi', name: '维尔纽斯', factionId: 'litaowan', lat: 54.68, lng: 25.27, type: 'small_city', troops: 10000, region: 'LITHUANIANS', buildingStyle: 'LITHUANIANS' , note: '[14至17世纪立陶宛大公国首都·格季米纳斯红砖石堡与1503年九门砖石环城墙] 格季米纳斯迁都维尔纽斯，亚历山大一世于1503–1522年筑完整砖石环城墙（黎明门现存），1600–1650年大洪水战火前城居达2–3万（Kiaupa《立陶宛史》及Bairoch表），>1万定小城。' },

    { id: 'city_huasha', name: '华沙', factionId: 'bolan', lat: 52.22, lng: 21.01, type: 'small_city', troops: 10000, region: 'SLAVIC_IMPERIAL', buildingStyle: 'POLES' , note: '[16世纪末至17世纪波兰立陶宛联邦新都·双道红砖哥特老城墙与皇家城堡] 1596年西吉斯蒙德三世自克拉科夫迁王廷至华沙，具完整双层红砖环城墙与瓮城（Barbakan），1655年瑞军破城前及1700年城居达2.5–3万（Bogucka及de Vries 1984 p.275），>1万定小城。' },

    // ── 2026-08-04 新增：波兹南（大波兰公国治所；普热梅斯二世故都）──
    { id: 'city_poznan', name: '波兹南', factionId: 'bolan', lat: 52.4064, lng: 16.9252, type: 'small_city', troops: 10000, region: 'POLES', buildingStyle: 'POLES' , note: '[10至17世纪大波兰首府与皮亚斯特旧都·红砖双层环城墙贸易大邑] 普热米斯尔二世筑完整红砖环城墙，16世纪波兰文艺复兴商贸盛期城墙内外连片城区人口达1.8–2万（Bogucka & Samsonowicz 1986《波兰城市与市民史》），>1万且具砖墙，定小城。' },

    { id: 'city_kelakefu', name: '克拉科夫', factionId: 'bolan', lat: 50.06, lng: 19.94, type: 'small_city', troops: 10000, region: 'SLAVIC_FEUDAL', buildingStyle: 'POLES', note: '[14至16世纪波兰王国首都雅盖隆黄金时代·瓦维尔石堡与红砖弗洛里安门环城墙] 卡齐米日大帝扩建主城并连结卡齐米日犹太石墙辅城，1550–1600年波兰极盛期连片城居达2.8–3.5万（Bogucka & Samsonowicz 1986及de Vries表2.8万），>1万定小城。' },
    { id: 'city_liweifu', name: '利沃夫', factionId: 'bolan', lat: 49.84, lng: 24.03, type: 'small_city', troops: 10000, region: 'POLES', buildingStyle: 'POLES', note: '[14至17世纪波兰红鲁塞尼亚首府·双层石砖高墙与火药塔贸易坚城利沃夫] 东方陆路商队门户利沃夫，筑内外两道石砖高墙与18座行会戍塔（1648与1672年抗赫梅利尼茨基与奥斯曼围攻），1600–1650年城居达2–2.5万（Kapral利沃夫人口史），>1万定小城。' },
    { id: 'city_liga', name: '里加', factionId: 'baojian_qishi', lat: 56.95, lng: 24.1, type: 'small_city', isPort: true, troops: 10000, region: 'LITHUANIANS', buildingStyle: 'GERMANIC', note: '[13至17世纪利沃尼亚首府与瑞属波罗的海第二大港·红砖石墙与近代星形棱堡] 1201年阿尔伯特主教建城，具中世纪红砖城墙与17世纪瑞典星形棱堡（1656年挫败俄沙皇阿列克谢御驾围攻），1650–1700年城居约1.2–1.5万（Bairoch 1988）且具砖石墙，定小城。' },
    { id: 'city_teweier', name: '特维尔', factionId: 'teweier_gongguo', lat: 56.86, lng: 35.9, type: 'stockade', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC', note: '[13至15世纪特维尔大公国首都（莫斯科劲敌）·伏尔加特维尔察汇口高土垒橡木克里姆林] 米哈伊尔大公抗金帐与莫斯科争霸重都，经1569年伊凡雷帝特辖军屠城与波兰战火重创，特维尔克里姆林至1763年大火前始终为土垒原木墙，1678年俄国户籍册载城民仅约4500人<1万，定城寨。' },
    { id: 'city_xianuofugeerdede', name: '下诺城', factionId: 'suzidaer', lat: 56.32, lng: 44, type: 'small_city', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC' , note: '[16至17世纪沙皇俄国伏尔加奥卡交汇大商埠·1500至1515年红砖白石十三塔克里姆林] 瓦西里三世延意大利工匠筑2公里红砖白石高墙克里姆林（从未被攻陷），1611年米宁与波扎尔斯基义勇军起兵地，1678年俄国普查册载上下商区（Posad）合驻军逾1.2–1.5万，定小城。' },
    { id: 'city_zhapoluore', name: '塞契', factionId: 'gesake', lat: 47.83, lng: 35.16, type: 'stockade', troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '[16至17世纪乌克兰扎波罗热哥萨克大本营塞契·第聂伯河心岛原木栅栏战车壕垒营寨] 维什涅维茨基始筑小霍尔季察木塞、1648年赫梅利尼茨基据此起兵（博普兰《乌克兰图志》详绘岛上原木栅栏、土壕与库连木营房），无石砖墙且平时驻营哥萨克数千人<1万，定城寨。' },
    { id: 'city_yaxi', name: '雅西', factionId: 'moerdaweiya', lat: 47.16, lng: 27.58, type: 'small_city', troops: 10000, region: 'SLAVIC_CASTLE', buildingStyle: 'SLAVIC' , note: '[16至17世纪摩尔达维亚公国首都·石砖设防宫院与连片都邑雅西] 1564年亚历山德鲁·勒普什内亚努自苏恰瓦迁都雅西，1653年阿勒颇的保罗随牧首亲访记城内逾两万户商民云集，学界折实17世纪城居约2–2.5万（Bairoch 1988），>1万定小城。' },
    { id: 'city_teergewishite', name: '特尔戈维', factionId: 'walajiyia', lat: 44.86, lng: 25.46, type: 'small_city', troops: 10000, region: 'SLAVIC_CASTLE', buildingStyle: 'SLAVIC', note: '[15至17世纪瓦拉几亚王公都城·石砖王廷垣与土石城防都邑] 米尔恰一世至马泰·巴萨拉布长期定都特尔戈维什泰，1580年代王公秘书弗兰科·西沃里记述及17世纪保罗游记折算全盛期城居约1.5–2万，>1万定小城。' },
    { id: 'city_kenisibao', name: '柯尼斯堡', factionId: 'tiaodun_qishi', lat: 54.71, lng: 20.51, type: 'small_city', isPort: true, troops: 10000, region: 'TEUTONS', buildingStyle: 'GERMANIC', note: '[13至17世纪条顿骑士团与普鲁士首府·红砖城堡与三联石砖港城] 1255年条顿骑士团筑堡后迅速形成老城、勒伯尼希特、克奈普霍夫三联汉萨居民城，17世纪中叶城居达3–4万（Bairoch 1988载1663年4万），已成超万人城市不再算设施，定小城。' },
    { id: 'city_talin', name: '塔林', factionId: 'baojian_qishi', lat: 59.43, lng: 24.75, type: 'small_city', isPort: true, troops: 10000, region: 'LITHUANIANS', buildingStyle: 'GERMANIC', note: '[13至17世纪丹麦条顿与瑞属汉萨石城雷瓦尔·托姆比亚石堡与2.4公里石灰岩高墙] 北欧保存最完好中世纪石灰岩环城高墙与26座防御石塔，16–17世纪城居约0.8–1.2万（Bairoch 1988载1700年约1万），具完整石砌城墙，定小城。' },
    { id: 'city_youliyefu', name: '尤里耶夫', factionId: 'luosi', lat: 58.37, lng: 26.72, type: 'stockade', troops: 10000, region: 'LITHUANIANS', buildingStyle: 'LITHUANIANS', note: '[11世纪雅罗斯拉夫大公建尤里耶夫至爱沙尼亚主教区塔尔图·埃马约吉河丘堡与战毁小邑] 1030年建木堡，本据点锁定波罗的海爱沙尼亚与早期罗斯争夺及1558–1700年俄瑞波立百年拉锯战毁期（1625与1704年屡成废墟，17世纪常住仅2000–3000人），定城寨。' },
    { id: 'city_jiridao', name: '基日岛', factionId: 'luosi', lat: 62.0667, lng: 35.225, type: 'stockade', troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '[16至17世纪俄罗斯北疆奥涅加湖基日教区中心·海岛全木构多穹顶教堂与农渔小聚] 俄国北方纯木构榫卯建筑代表基日岛，据1601与1678年奥涅加土地清册岛上教堂院旁仅4至12户农渔民不足百人，无城墙且<1万，定城寨。' },
    { id: 'city_akeman', name: '阿克曼', factionId: 'osman', lat: 46.19, lng: 30.34, type: 'small_city', isPort: true, troops: 10000, region: 'OTTOMAN', buildingStyle: 'TURKS', note: '[15至16世纪摩尔达维亚与奥斯曼黑海重镇·德涅斯特河口石灰岩巨垣港城] 蒙卡斯特罗／阿克曼不仅具内堡且外围2公里石灰岩高墙与深壕围合整个港市民居区，1574年奥斯曼税册实载城民4,664人，<1万但具完整石砌环城墙，定小城。；石堡主体虽为摩尔多瓦亚历山大善主（1407）与斯特凡二世（1440）所筑，但 66 分支无摩尔多瓦，按《建筑风格判定与代理规则》§三 用现有最接近的 TURKS（奥斯曼海峡要塞）代理，非精确' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「GREEK」推出的二级与史实不符 → 归 ATHENIANS：塔纳伊斯（亚速海）：希腊殖民城，一级希腊素材
    { id: 'city_asu', name: '塔纳伊斯', factionId: 'sijitai', lat: 47.23, lng: 39.70, type: 'small_city', isPort: true, troops: 10000, region: 'SCYTHIANS', buildingStyle: 'GREECE', note: '[前3至公元3世纪博斯普鲁斯王国顿河口商埠·方形切石高墙与深壕塔纳伊斯] 斯特拉波XI.2.3明载塔纳伊斯为欧亚游牧民与希腊人最大共同商市，考古发掘确证规整方形厚重石砌城墙与角塔（今涅德维戈夫卡石城遗址），古典盛期常住约0.6–1万且具石墙，定小城。' },
    { id: 'city_geluodenuo', name: '格罗德诺', factionId: 'litaowan', lat: 53.68, lng: 23.83, type: 'stockade', troops: 10000, region: 'LITHUANIANS', buildingStyle: 'LITHUANIANS', note: '[14至16世纪立陶宛维陶塔斯与波兰巴托里行宫重镇·尼曼河城堡与无石墙木屋城区格罗德诺] 虽高崖建有新旧王室小城堡，但整个格罗德诺市民城区无环城石墙，1558–1560年王室土地丈量清册实载全镇716座木宅约3600–4300人<1万，定城寨。' },
    { id: 'city_chalijin', name: '察里津', factionId: 'eluosi_diguo', lat: 48.7, lng: 44.51, type: 'stockade', troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '[1589至1700年沙俄伏尔加顿河地峡哨镇察里津·扎谢金原木立栅方塔军镇] 1589年俄国于察里察河入伏尔加口筑原木立栅哨城控水陆拖船道（1670年斯捷潘·拉辛攻破木寨），≤1700年纯木构墙垣且驻兵居民仅约1500–3000人，定城寨。' },
    { id: 'city_samala', name: '萨马拉', factionId: 'eluosi_diguo', lat: 53.2, lng: 50.15, type: 'stockade', troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '[1586至1700年沙俄伏尔加中游边镇萨马拉·扎谢金原木立栅十一塔河防木城] 1586年奉费奥多尔沙皇诏筑长600米原木高栅防诺盖与卡尔梅克游骑，17世纪末发展为河运盐鱼集镇，1678年户籍册载军民仅约2000–3000人且为木栅无石砖墙，定城寨。' },
    { id: 'city_wufa', name: '乌法', factionId: 'eluosi_diguo', lat: 54.73, lng: 55.96, type: 'stockade', troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '[1574至1700年沙俄经略巴什基尔首府乌法·别拉亚河高岸440米橡木立栅克里姆林] 1574年伊凡·纳戈伊筑橡木立栅与米哈伊洛夫原木塔楼，17世纪屡抗巴什基尔与卡尔梅克围攻，≤1700年无石砖城垣且驻军市民约2500–4000人<1万，定城寨。' },
    { id: 'city_bieergeleide', name: '别尔哥罗德', factionId: 'eluosi_diguo', lat: 50.6, lng: 36.58, type: 'stockade', troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '[1596至1700年沙俄南疆别尔哥罗德防线中枢·白垩山橡木立栅土垒军镇] 鲍里斯·戈东诺夫始筑、1635年起为800公里别尔哥罗德鹿砦土垒防线总督驻地，三次迁址皆筑橡木塔墙与夯土坡垒无石砖环城墙，1678年镇内常住军民约4000–5000人<1万，定城寨。' },
    // ── 2026-08-04 新增：哈尔科夫（1654哥萨克要塞；斯洛博达乌克兰·哈尔科夫团治所）──
    { id: 'city_haerkefu', name: '哈尔科夫', factionId: 'eluosi_diguo', lat: 49.9935, lng: 36.2304, type: 'stockade', troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '[1654至1700年斯洛博达乌克兰哥萨克团治所哈尔科夫·十座木塔双排橡木立栅寨城] 1654年乌克兰哥萨克流民筑十塔橡木栅城拒克里米亚鞑靼，据1660–1680年代俄国督军清册城内哥萨克与市民约4000–6000人且为纯木栅城垣，定城寨。' },
    // ── 2026-08-04 新增：沃罗涅日（1586南疆要塞，守穆拉夫小道防鞑靼）──
    { id: 'city_woluonerizh', name: '沃罗涅日', factionId: 'eluosi_diguo', lat: 51.6608, lng: 39.2003, type: 'stockade', troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '[1586至1700年沙俄顿河上游造船军镇沃罗涅日·萨布罗夫橡木高塔寨城] 1586年筑橡木立栅要塞御鞑靼、1696年彼得一世设亚速海帆船造船坞，≤1700年城垣为橡木原木结构（无石砖城墙）且常住居民约5000–7000人<1万，定城寨。' },
    { id: 'city_peilieyasilafu', name: '佩列斯拉夫', factionId: 'peilieya_gongguo', lat: 50.07, lng: 31.45, type: 'stockade', troops: 10000, region: 'RUS', buildingStyle: 'SLAVIC', note: '[10至13世纪初南罗斯屏障公国首邑佩列亚斯拉夫·特鲁别日河高大土垒原木上城] 弗拉基米尔·莫诺马赫镇守抗库曼前线重邑（《往年纪事》），1239年遭蒙军拔都彻底焚毁沦为哥萨克小聚落，罗斯时代为泥芯土垒立木墙（无石砖环城墙）且常住未满1万确数，定城寨。' },
    { id: 'city_weijiebusike', name: '维捷布斯克', factionId: 'litaowan', lat: 55.19, lng: 30.2, type: 'stockade', troops: 10000, region: 'LITHUANIANS', buildingStyle: 'LITHUANIANS', note: '[10世纪奥丽加始建至14世纪立陶宛阿尔吉尔达斯王公领地·西德维纳河石堡与木栅下城维捷布斯克] 阿尔吉尔达斯曾修上城石塔，但16世纪战火毁坏后重建原木塔墙，据1641年王室清册全城990栋木宅约5000人（1654年俄波战争再毁），<1万且市民城为木墙，定城寨。' },

    ...T0_CAPITALS,
    ...T1_MEDIUM_CITIES,
    ...T2_STRATEGIC,
    ...PERIPHERY,
    ...RESTORED_CITIES,
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：广源（广西）：汉地边州
    { id: 'city_guangyuan', name: '广源', factionId: 'nongzhigao', lat: 22.644425, lng: 106.273499, type: 'stockade', troops: 10000, region: 'VIETNAMESE', buildingStyle: 'VIETNAMESE' , note: '[北宋皇祐前壮侬首领侬全福阿侬侬智高父子起兵根据地广源州·中越交界高平献江山谷木石竹栅峒寨] 产金之羁縻傥犹、广源州（今越南高平省广渊），侬智高据广源峒寨铸兵招纳亡命出攻邕州（《宋史·广源州蛮传》《续资治通鉴长编》），喀斯特峰丛竹木峒寨无石砖城郭且不足8000人，定城寨。' },

    // ── 2026-05-28 新增：奢氏(永宁/四川叙永) ──
    { id: 'city_yongning2', name: '叙永', factionId: 'ming_d', lat: 28.17, lng: 105.44, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[唐蔺州、元永宁路至明洪武置永宁宣抚司与永宁卫（奢崇明起兵地）·永宁河两岸跨桥条石双城叙永] 扼川南入黔滇赤水盐道咽喉，明洪武二十四年景川侯曹震跨永宁河东西两岸修筑永宁卫石城与宣抚司石城，天启元年奢崇明据此反明（《明史·四川土司传》《叙永厅志》），双石城军商逾1–1.5万且具完整条石墙，定小城。' },

    // ── 2026-05-28 新增：僚(江阳/四川泸州) ──
    { id: 'city_jiangyang', name: '江阳', factionId: 'chenghan', lat: 28.87, lng: 105.42, type: 'small_city', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[两汉江阳至南宋明代川南重镇泸州·沱江长江汇口条石包砖城垣] 汉置江阳县，南宋迁神臂城抗蒙、明洪武八年因宋基重筑泸州条石城墙周七里余控川滇黔水运，城关军民商贾约2–3万（《宋史·地理志》《明一统志》），>1万且具石墙，定小城。',
    },
    // ── 2026-05-28 新增：普氏(矩州/贵州贵阳) ──
    { id: 'city_juzhou', name: '顺元', factionId: 'ming_d', lat: 26.576247, lng: 106.685486, type: 'small_city', region: 'BASHU', buildingStyle: 'BASHU', troops: 10000, note: '[唐矩州、元顺元路宣慰司至明永乐十一年设贵州布政使司贵阳府·南明河北岸条石巨砖九门省会城] 明洪武十五年马晔始筑顺元条石城，永乐建省设贵州布政司、天启六年增筑外城拒水西安邦彦十万围攻百日不破（《明史·地理志》《贵阳府志》），西南省会军政商民达2.5–4万，>1万定小城。' },

    // ── 2026-05-28 新增：南部(根城/日本)、萨曼(阿母城/中亚)、西域四政权 ──
    { id: 'city_genjo', name: '根城', factionId: 'nanbu_shi', lat: 40.5047, lng: 141.4644, type: 'stockade', isPort: true, region: 'JAPAN_IMPERIAL',
buildingStyle: 'JAPAN', troops: 10000, tier: 4,
        note: '[日本南北朝建武元年北畠显家国代南部师行始筑八户根城·马渊川台地多重空堀土垒木栅平山城] 陆奥南部氏三百年本据八户根城，宽永四年（1627）远野移封废城，日本考古全面发掘复原确证本丸主殿与围垣全为掘立柱木板塀、夯土垒与干壕（绝无石垣，国史迹《根城迹》），常住不足5000人，定城寨。',
    },
    { id: 'city_amucheng', name: '阿母城', factionId: 'saman', lat: 39.0833, lng: 63.5786, type: 'small_city', region: 'CENTRAL_ASIA', buildingStyle: 'CENTRAL_ASIA', troops: 10000, note: '[9至12世纪萨曼与塞尔柱王朝阿姆河渡口商都阿母城（阿穆勒）·烧砖泥砖河港城] 扼呼罗珊通布哈拉第一大渡口（今土库曼纳巴特），10世纪伊斯塔赫里与穆卡达西《地理志》记其城垣繁密、学者商队云集，1220年蒙军破城前城居约1.5–2.5万，>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」推出的二级与史实不符 → 归 CENTRAL_ASIA：石头城（塔什库尔干）：朅盘陀/色勒库尔，葱岭
    { id: 'city_hepancheng', name: '石头城', factionId: 'kepantuo', lat: 37.7725, lng: 75.2264, type: 'pass', troops: 10000, region: 'WESTERN', buildingStyle: 'WESTERN', note: '[汉蒲犁至唐朅盘陀开元葱岭守捉·帕米尔乱石圆筑山巅要塞] 帕米尔高原塔什库尔干石头城，唐开元中平朅盘陀置葱岭守捉控东西丝路山口，现存石基土石高垣（《大唐西域记》卷十二、《新唐书·西域传》），纯军事守捉石城且<1万，定险要。' },


    { id: 'city_humicheng', name: '护密', factionId: 'qiepantuo', lat: 36.7266, lng: 71.6133, type: 'stockade', region: 'CENTRAL_ASIA', buildingStyle: 'WESTERN', troops: 10000, tier: 4, note: '[北魏钵和国至唐显庆置鸟飞州都督府瓦罕护密国王治塞迦审城·帕米尔喷赤河谷高寒片石小寨] 玄奘《大唐西域记》卷十二达摩悉铁帝国及慧超《往五天竺国传》胡蜜国，唐天宝六载高仙芝讨小勃律于护密分三路进兵（《新唐书·西域传》载地寒瘠民贫），峡谷小国都常住仅两三千人，定城寨。' },
    { id: 'city_huoguocheng', name: '德拉普萨卡', factionId: 'yanda', lat: 36.7286, lng: 68.8681, type: 'stockade', troops: 10000, region: 'HEPHTHALITES', buildingStyle: 'CENTRAL_ASIA', note: '[5至6世纪嚈哒（白匈奴）帝国阿姆河南岸副都阿缓城（古巴克特里亚德拉普萨卡／昆都士）·高台生土泥砖大营城] 玄奘《大唐西域记》卷一活国（嚈哒余部与西突厥统叶护长子呾度设驻牙所，「城周二十余里」多荒园伽蓝），巴拉希萨尔泥砖土台遗址无石墙烧砖大垣且唐初战后城居不足1万确数，定城寨。' },


    // ── 2026-05-28 新增：马蒙(达尔甘)、古兹根(法里亚布)、傣(勐泐城)、泰沅(清坎城)、帕銮(素可泰)、罗斛(呵叻城) ──
    { id: 'city_dargan', name: '达尔甘', factionId: 'huarazim', lat: 40.5333, lng: 62.2667, type: 'stockade', troops: 10000, region: 'CENTRAL_ASIA', buildingStyle: 'CENTRAL_ASIA', note: '[8至13世纪初花剌子模南门阿姆河西岸商队驿城达尔甘·卡拉库姆沙漠边缘生土帕赫萨高墙小城] 穆卡达西《地理志》称达尔甘为花剌子模仅次朱尔贾尼亚之南境门户城，现存高台生土泥砖残垣（面积约10余公顷），1221年蒙军西征后衰废，生土墙且常住仅约4000–6000人<1万，定城寨。' },


    { id: 'city_fariyab', name: '法里亚布', factionId: 'jiazini', lat: 35.9200, lng: 64.7800, type: 'stockade', region: 'SASANIAN',
buildingStyle: 'PERSIAN', troops: 10000, tier: 4,
        note: '[萨珊至9至12世纪呼罗珊东境朱兹詹名邑法里亚布（哲学的阿尔法拉比祖籍区）·希林塔加布绿洲泥砖小城] 10世纪《世界境域志》与伊斯塔赫里记法里亚布为朱兹詹商路绿洲宜居泥砖城镇，1220年成吉思汗南下巴尔赫时彻底焚毁成丘，查无城居破万数字且为泥砖生土垣，定城寨。',
    },
    { id: 'city_mengle', name: '勐泐城', factionId: 'dai', lat: 22.0000, lng: 100.8000, type: 'small_city', region: 'BASHU', buildingStyle: 'BURMESE', troops: 10000, note: '[12至16世纪傣族景陇金殿国与明车里宣慰司都城·澜沧江畔砖木宣慰司城景洪] 1180年帕雅真建景陇金殿国都勐泐，明置车里军民宣慰使司（《元史·地理志》《明史·云南土司传》），澜沧江坝子核心都邑连片曼寨与司城常住约1.2–2万，>1万定小城。' },
    { id: 'city_chingkham', name: '清坎寨', factionId: 'taiyuan', lat: 19.52, lng: 100.3, type: 'stockade', troops: 10000, region: 'KHMER', buildingStyle: 'KHMER', note: '[13世纪末兰纳泰族孟莱王早期肇基湄公河畔清盛清坎聚落·高脚柚木排屋与夯土壕沟泰老江寨] 1262年孟莱王南迁清迈前于金三角湄公河谷经营之早期泰沅勐寨（《清迈编年史》），干栏柚木竹构聚落配夯土矮堤无石砖城郭且早期人口约5000–8000人<1万，定城寨。；项目无 SIAMESE 分支，退用 MALAY 木石水寨作最接近的木质干栏代理' },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「SEAS」推出的二级与史实不符 → 归 KHMER：素可泰：泰族立国，承吴哥高棉体系（62 类无泰族分支，择近高棉）
    { id: 'city_shuanghe', name: '素可泰', factionId: 'suke', lat: 17.017, lng: 99.704, type: 'small_city', troops: 10000, region: 'SONG', buildingStyle: 'KHMER' , note: '[13至14世纪素可泰王国兰甘亨盛期·红土石夹烧砖三重城墙水池王都] 兰甘亨大帝1292年石碑明载素可泰「三重城墙围绕」，UNESCO遗址现存长1.8公里、宽1.4公里三重红土石砖砌城垣及寺塔区，13–14世纪城关常住人口约2–3万，>1万且具石砖墙，定小城。' },

    { id: 'city_khorat', name: '呵叻城', factionId: 'luohu', lat: 14.9700, lng: 102.1000, type: 'small_city', region: 'SEAS',
        // 🔴 [2026-09-18 主人定] 原 'SEAS' 只是一级母体、无二级/三级 → 按真实地理历史归**高棉 KHMER**：
        //    呵叻（Nakhon Ratchasima）在呵叻高原，高棉帝国时期为吴哥属邑，城郊披迈石宫即吴哥式建筑。
        buildingStyle: 'KHMER', troops: 10000, tier: 4,
        note: '[17世纪下半叶阿瑜陀耶王朝那莱王东北重镇·红砖高墙四角棱堡呵叻城] 1656–1688年暹罗那莱王延法国工程师筑长1.7公里、宽1公里完整红砖包砌城墙、四砖石城门与护城河控澜沧与高棉边境，≤1700年城居约1–1.5万且具完整包砖城墙，定小城。',
    },

    // ── 2026-05-28 新增：黑龙江流域民族/家族据点 ──
    { id: 'city_lahasusu', name: '拉哈苏苏', factionId: 'heishui', lat: 47.654208, lng: 132.497864, type: 'stockade', troops: 10000, region: 'MOHE', buildingStyle: 'NORTHEAST', note: '[唐黑水靺鞨故地、辽五国部越里吉旁聚至明女真三万卫北胡里改江（清三姓副都统设于1715年超限）·江口渔猎木寨] 清设三姓（依兰）协领筑土城在康熙五十四年（1715，晚于1700年红线不采）；≤1700年松花江牡丹江汇口为赫哲（黑斤）与女真三姓木栅桦皮庐聚落，人口不足3000人，定城寨。' },


    { id: 'city_valen', name: '瓦伦', factionId: 'manzhou_d', lat: 50.5500, lng: 137.0000, type: 'stockade', region: 'MANCHU',
buildingStyle: 'NORTHEAST', troops: 10000, tier: 4,
        note: '[元东征元帅府水达达路至明奴儿干水道黑龙江下游那乃（赫哲）聚落瓦伦·江岸鱼皮木屋冬村] 黑龙江下游右岸赫哲那乃族传统渔猎定居大屯（《皇清职贡图》《柳边纪略》使犬部），木柱地窨冬屋与树皮夏帐无城墙且常住不足千人，定城寨。',
    },
    { id: 'city_qiji', name: '普禄', factionId: 'jilimi', lat: 51.5800, lng: 140.0000, type: 'stockade', region: 'MANCHU',
buildingStyle: 'NORTHEAST', troops: 10000, tier: 4,
        note: '[唐流鬼国南境至明清库页岛中南部波罗奈河口普禄（敷香）·鄂罗克与费雅喀（吉里迷）驯鹿渔猎木帐营] 库页岛东岸多来加湾河口土著费雅喀与鄂罗克氏族季节性捕鲑放鹿集散点（曹廷杰《西伯利东偏纪要》），无城垣且仅数百人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】库页岛渔猎聚落，取最近NORTHEAST',
    },
    // ── 2026-05-28 新增：伊勒巴斯(希瓦)、南杰(日土宗) ──
    { id: 'city_dadoubagu', name: '大斗拔谷', factionId: 'han_d', lat: 38.0011, lng: 100.9125, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[西汉霍去病出陇西与隋大业五年（609）隋炀帝西巡张掖穿行祁连山大斗拔谷（扁都口）·高寒峡谷行营点] 《隋书·炀帝纪》大业五年六月炀帝度大斗拔谷遇暴风雪士卒冻死者大半，系海拔3500米祁连山天然宽谷通道（名不带关且无常设关城垣），牧帐驿点不足千人，定城寨。', mirror: true },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」推出的二级与史实不符 → 归 CENTRAL_ASIA：希瓦：花剌子模希瓦汗国，中亚
    { id: 'city_khiva', name: '希瓦', factionId: 'huarazim', lat: 41.564038, lng: 60.710449, type: 'small_city', troops: 10000, region: 'CENTRAL_ASIA_CASTLE', buildingStyle: 'CENTRAL_ASIA', mirror: true , note: '[16至17世纪阿布海尔系花剌子模（希瓦）汗国都城·伊钦卡拉泥砖烧砖内城商都] 阿姆河改道后1598年阿拉伯·穆罕默德汗自乌尔根奇迁都希瓦，17世纪阿布·哈齐汗时期内城与商坊常住人口约1.5–2万（巴托尔德《中亚灌溉史》），>1万定小城。' },
    { id: 'city_rituzong', name: '日土宗', factionId: 'ladakh', lat: 33.367241, lng: 79.705811, type: 'stockade', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[古象雄鲁玛地至17世纪拉达克与甘丹颇章拉锯之班公湖东端日土宗·孤山岩顶片石宗堡与牧村] 1681年甘丹才旺率蒙藏联军收复阿里三围置日土宗（《五世达赖传》），虽山岩筑小型片石宗堡但非万人邑亦非正式带关名塞，海拔4300米高寒荒漠全宗牧户仅千余人，定城寨。',
    },


    // ── 2026-05-28 新增：甘丹颇章(扎敦宗)、叛军(三陇沙/肩水金关) ──
    { id: 'city_zhadunzong', name: '扎敦宗', factionId: 'ganden', lat: 29.645092, lng: 84.171753, type: 'stockade', troops: 10000, region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', note: '[吐蕃羊同南道至17世纪甘丹颇章设藏西雅鲁藏布上游扎敦（仲巴萨嘎马泉河谷）·高寒沙丘草甸牧帐宗点] 连接日喀则与阿里神山冈仁波齐之马泉河高寒宽谷牧区驿站（海拔4600米，《卫藏图识》），仅设几间土石差房与黑牛毛牧帐无城垣且常住不足千人，定城寨。' },

    { id: 'city_sanlongsha', name: '三陇沙', factionId: 'dongjin', lat: 40.4, lng: 92.5, type: 'stockade', troops: 10000, region: 'WESTERN', buildingStyle: 'WESTERN', note: '[汉魏晋敦煌玉门关西出楼兰白龙堆险途三陇沙·库姆塔格流沙戈壁雅丹行军水泉驿点] 曹魏仓慈、西晋索劢及前凉张骏西征焉耆龟兹必经之三道大沙垄险途（《三国志》注引《魏略·西戎传》《晋书·张骏传》），流沙边缘苦泉歇驼点无城垣且无常住民，定城寨。' },

    { id: 'city_jianshuijinguan', name: '肩水金关', factionId: 'han_d', lat: 40.413414, lng: 99.434509, type: 'pass', region: 'KHITAN',
buildingStyle: 'HEXI', troops: 10000, mirror: true,
        note: '[西汉太初至东汉·弱水肩水道夯土关城障燧] 汉张掖郡肩水都尉南端出入验传大关，考古发掘出土万余枚《肩水金关汉简》及完整夯土关门坞壁（《汉书·地理志》及甘肃简牍博物馆发掘报告），带「关」字且具夯土墙，未成万人城，定险要。',
    },//镜像

    // ── 2026-05-28 新增：药罗葛(博尔巴任)、爱新觉罗(墨尔根城)、广南国(洞海城) ──
    // 瓦剌（卫拉特）药罗葛部牧地，与明代卫拉（科布多）分立
    { id: 'city_porbazhyn', name: '博尔巴任', factionId: 'huihu', lat: 49.664324, lng: 95.767822, type: 'stockade', region: 'STEPPE',
buildingStyle: 'CENTRAL', troops: 10000,
        note: '[唐大历至贞元漠北回鹘牟羽可汗或宁国公主夏宫博尔巴任·图瓦捷列霍尔湖心岛3.8公顷夯土宫院] 俄罗斯图瓦湖心岛方形唐式瓦当夯土遗址（长215×宽162米仅3.5公顷，2007年碳十四与树轮精确断代为公元777年夏筑成旋因地震火焚废弃），纯季节性夯土行宫无市民人口，定城寨。',
    },
    { id: 'city_moergen', name: '莫尔根', factionId: 'suolun', lat: 49.176, lng: 125.228, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[清康熙二十四年设驿站、二十九年（1690）黑龙江将军自瑷珲移驻墨尔根（嫩江）·松木立栅夹土方城] 康熙二十九至三十八年曾为黑龙江将军驻节十年（后移齐齐哈尔），杨宾《柳边纪略》实记墨尔根城「木植立栅实土其中，周数里」，木栅土墙且八旗索伦达斡尔官兵家口仅约4000–5000人<1万，定城寨。' },

    { id: 'city_donghai', name: '洞海城', factionId: 'yuenan', lat: 17.620424, lng: 106.495972, type: 'stockade', isPort: true, troops: 10000, region: 'HUAXIA_IMPERIAL', buildingStyle: 'VIETNAMESE', mirror: true, note: '[17世纪广南阮主福源用陶维慈计修筑抗北郑主防线洞海垒（定北长城）·日丽江口夯土夹铁力木长垒军屯] 1630–1631年陶维慈督筑自山麓直抵日丽海口长十八公里夯土巨木防垒，七次挫败郑主南征大军（《大南实录前编》），属战线军屯营寨而非万人居民城市，≤1700年守兵屯户数千人，定城寨。' },

    // ── 2026-05-28 新增：图蒙肯(拜达里克牙帐) ──
    { id: 'city_baidalik', name: '拜达里克', factionId: 'kaerka', lat: 46.189304, lng: 99.159851, type: 'stockade', region: 'STEPPE_IMPERIAL',
buildingStyle: 'MONGOL', troops: 10000,
        note: '[13世纪蒙古高原中部杭爱山南麓拜达里克河（推河西邻）·喀尔喀赛音诺颜部图蒙肯汗裔游牧夏冬营] 清乾隆以前拜达里克河谷为喀尔喀中路贵族随水草迁徙之优良河谷牧场（《蒙古游牧记》卷七），纯毡帐营地无城墙且常住<1万，定城寨。',
    },

    // ── 2026-05-28 新增：岭(结古宗)、琼波(丁青宗)、索伦(卜奎)、图瓦(唐努) ──
    { id: 'city_jiegu', name: '结古宗', factionId: 'gling', lat: 33.001753, lng: 97.012024, type: 'stockade', troops: 10000, region: 'TIBET_CASTLE', buildingStyle: 'TIBET', note: '[唐吐蕃多弥苏毗道至明清康藏茶马北道枢纽玉树结古（结古寺创于1398年）·扎曲巴塘河谷石木寺院商站] 萨迦派结古顿珠林寺山坡石木僧舍及山下西宁至拉萨茶马羊毛互市锅庄聚落（清雍正会勘囊谦玉树二十五族在1725年，《卫藏通志》），无城墙且≤1700年常住僧商约3000–5000人<1万，定城寨。' },



    { id: 'city_qiongbu', name: '丁青宗', factionId: 'tubo', lat: 31.4100, lng: 95.5900, type: 'stockade', region: 'TIBET',
buildingStyle: 'TIBET', troops: 10000, tier: 4,
        note: '[象雄东境苯教重镇至元代吐蕃等路宣慰司琼布（丁青）万户府·怒江支流孜曲山崖石木宗署与苯教寺聚] 苯教大寺孜珠寺近邻及元代授印世袭琼布部落首邑（《元史·释老传》《藏族史料集》），高山石木碉楼村聚无砖石环城墙且常住不足4000人，定城寨。',
    },
    { id: 'city_bukui', name: '卜奎', factionId: 'suolun', lat: 47.305322, lng: 123.752747, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[清康熙三十年（1691）火器营协领玛布岱筑齐齐哈尔城、三十八年黑龙江将军移驻卜奎·嫩江东岸松木立栅夹土双重城] 原达斡尔卜奎村，康熙三十年筑内城木栅千步、外城土垣数里（西清《黑龙江外纪》详载直至清季仍为松木排桩与土墙无砖石），≤1700年初建九年驻防八旗水师官兵家口约5000–7000人<1万，定城寨。' },


    { id: 'city_teshuolankalun', name: '唐努', factionId: 'kaerka', lat: 49.419915, lng: 98.432007, type: 'stockade', region: 'STEPPE_IMPERIAL',
buildingStyle: 'MONGOL', troops: 10000,
        note: '[隋唐铁勒都播（木马突厥）至17世纪喀尔喀阿拉坦汗统治唐努乌梁海·叶尼塞上游图瓦盆地桦皮圆帐营聚] 《通典》《新唐书·回鹘传》载都播部「结草为庐，知乘木马驰冰上捕貂鹿」，17世纪属喀尔喀西路和托辉特部牧猎林区，无城郭且单营数百人，定城寨。',
    },

    // ── 2026-05-28 新增：大隅(赤尾木城/九州)、奄美(赤木名城/琉球) ──
    { id: 'city_akaogicheng', name: '赤尾木城', factionId: 'shimazu', lat: 30.7300, lng: 131.0000, type: 'stockade', isPort: true, troops: 10000, tier: 4, 
        note: '[天文十二年（1543）葡船漂着铁炮传来之地种子岛时尧居城赤尾木城·海岸凝灰岩台地土垒空堀小居馆] 南浦文之《铁炮记》所载种子岛时尧以二千金购两挺火绳枪仿制之历史现场赤尾木港与山丘土垒居城，岛窄民稀，≤1700年港村与武家屋敷常住仅约3000–4000人且无石垣环城墙，定城寨。', region: 'JAPAN_IMPERIAL',
        buildingStyle: 'JAPAN' },
    { id: 'city_akakinagusuku', name: '赤木名城', factionId: 'ryukyu', lat: 28.4540, lng: 129.6740, type: 'pass', isPort: true, region: 'JAPAN_IMPERIAL',
buildingStyle: 'JAPAN', troops: 10000, tier: 4,
        note: '[15至16世纪琉球统治奄美期·笠利半岛珊瑚石灰岩按司山城] 奄美大岛北端东按司居城赤木名城（グスク），依山垒筑石垣与空堀控琉球至萨摩海道（《琉球国由来记》及鹿儿岛考古报告），海道石垣要塞且聚落<1万，定险要。；🔴 [2026-11-11 补标] 【建筑风格代理】奄美按司石城，67键无琉球，取最近JAPAN',
    },

    // ── 2026-05-28 新增：康区藏族土司/部落据点 ──
    { id: 'city_riwoche', name: '类乌齐', factionId: 'ganden', lat: 31.3600, lng: 96.5000, type: 'stockade', region: 'TIBET_CASTLE',
buildingStyle: 'TIBET', troops: 10000, tier: 4,
        note: '[1276年达垅噶举高僧桑吉温创建类乌齐查杰玛大殿至元明万户土司治·紫曲河谷红白高墙石木寺院聚落] 川青入藏北道茶马枢纽类乌齐寺（元封达隆巴万户，明授禅师印，《明实录》），系政教合一寺院与转运锅庄村镇，无城市环墙且常住僧俗约3000–5000人<1万，定城寨。',
    },
    { id: 'city_derge', name: '德格', factionId: 'gar_kham', lat: 31.924163, lng: 99.181824, type: 'stockade', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[15世纪中叶博东巴创更庆寺与德格土司迁驻龚垭（印经院建于1729年超限）·金沙江支流色曲峡谷石木官寨] 康区四大土司之首德格家族15世纪迁驻更庆沟筑石木土司官寨与更庆寺（17世纪受五世达赖与固始汗扶植扩土，《德格土司世系》），峡谷狭长无环城墙且≤1700年沟内僧俗约3000–5000人<1万，定城寨。',
    },
    { id: 'city_ganzi', name: '甘孜', factionId: 'kongsa', lat: 31.615967, lng: 99.981079, type: 'stockade', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[明末清初固始汗长孙达赖汗建霍尔甘孜寺与孔萨麻书双土司官寨·雅砻江上游甘孜坝子石木土堡聚落] 康熙元年（1662）建甘孜大寺（千五百僧），山下并立孔萨与麻书两家霍尔土司夯土片石高官寨（《清史稿·四川土司传》），无合围县城墙且≤1700年僧俗常住约4000–6000人<1万，定城寨。',
    },
    { id: 'city_dajianlu', name: '打箭炉', factionId: 'manzhou_d', lat: 30.0500, lng: 101.9600, type: 'stockade', region: 'SONG',
buildingStyle: 'BASHU', troops: 10000, tier: 4,
        note: '[明正长官司（木雅西吴王后裔）驻地与川藏茶马包销总口打箭炉（康定）·折多河炉城峡谷无墙石木商锅庄镇] 康熙三十九年（1700）唐希顺平昌侧集烈之乱收复打箭炉（清设打箭炉厅及筑小石门更在雍正乾隆间，《清圣祖实录》《西藏图考》），≤1700年两山夹水无城墙，常住锅庄商户脚夫约4000–6000人<1万，定城寨。；藏式部分并入巴蜀代理，不另改青藏',
    },
    // ── 2026-05-28 新增：波密(博窝/西藏) ──
    // ── 2026-05-28 新增：达擦(八宿宗/达察呼图克图/家族) ──
    { id: 'city_basu', name: '八宿宗', factionId: 'ganden', lat: 30.185461, lng: 97.283936, type: 'stockade', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[吐蕃至17世纪甘丹颇章时期怒江上游川藏茶马官道要站八宿宗（白马）·冷曲河谷片石小宗堡与农庄] 控业拉山九十九道拐东下邦达草原与怒江天险之驿道小宗（《卫藏通志》），仅山坡一座小型片石土筑宗署而无城郭，常住宗民不足2000人，定城寨。',
    },


    // ── 2026-05-28 新增：景东(银生城/云南/政权) ──
    { id: 'city_yinsheng', name: '银生城', factionId: 'nanzhao', lat: 23.873432, lng: 100.914917, type: 'stockade', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[唐代南诏银生节度治城·澜沧江东岸景东夯土边城] 南诏六节度之一银生节度驻城（樊绰《蛮书·云南城镇第六》），系控御扑子、茫蛮诸部之夯土板筑边防节度小邑，查无万人城居记载，定城寨。',
    },

    // ── 2026-05-28 新增：霍尔(索宗/那曲/家族) ──
    { id: 'city_suozong', name: '索宗', factionId: 'hor', lat: 31.889225, lng: 93.804016, type: 'stockade', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[元代蒙古军驻牧霍尔三十九族中心索县赞丹寺与索宗·怒江支流索曲河崖布达拉式片石寺堡聚落] 康熙年间五世达赖弟子建索赞丹寺踞断崖与索宗合一管辖三十九族（《卫藏图识》），寺镇一体无外郭城墙且高寒河谷常住僧俗约2000–3000人<1万，定城寨。',
    },

    // 🔴 [2026-11-10 主人令「删除这个势力」] 原囊谦土司(dong)已删，据点改隶玉树二十五族(gling)——囊谦千户本为玉树二十五族之首
    { id: 'city_nangqian', name: '囊谦宗', factionId: 'gling', lat: 32.2000, lng: 96.4800, type: 'stockade', region: 'TIBET_CASTLE',
buildingStyle: 'TIBET', troops: 10000, tier: 4,
        note: '[南宋理宗赐印至元明清康北囊谦千户王族世袭驻地囊谦·扎曲（澜沧江上游）河谷土石王府官寨与寺院] 统辖玉树二十五族之母体囊谦王（Nangchen King）驻牧与冬居土石寨院（《玉树调查记》），半农半牧河谷无城市城垣且单驻点常住不足3000人，定城寨。',
    },

    // ── 工布土王(尼池/林芝)；巴塘宗改叛军点 ──
    { id: 'city_nichi', name: '太昭', factionId: 'tubo', lat: 29.752, lng: 93.232, type: 'stockade', region: 'TIBET',
buildingStyle: 'TIBET', troops: 10000,
        note: '[吐蕃工布王阿吉杰布领地至清前藏东通波密驿镇太昭（江达）·尼洋河上游高山林谷石木驿镇] 工布地区东大门古名江达（太昭名始于光绪末超限，≤1700年为工布江达宗驿，《卫藏通志》），峡谷林间石木民居一街无城墙且常住仅千余人，定城寨。',
    },
    { id: 'city_litangzong', name: '理塘宗', factionId: 'ganden', lat: 30.0000, lng: 100.2700, type: 'stockade', region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', troops: 10000, note: '[明万历八年三世达赖索南嘉措创建长青春科尔寺至和硕特驻防理塘·海拔4014米毛垭大草原石木大寺高城] 1580年建康南格鲁派第一大寺理塘寺，草原边缘僧舍与土司头人藏房聚落无城市环墙，≤1700年寺僧与牧商常住约4000–6000人<1万，定城寨。' },

    // ── 2026-05-28 新增：后突(黑沙城/阴山北麓) ──
    { id: 'city_heishacheng', name: '黑沙牙帐', factionId: 'tujue', lat: 43.5, lng: 96.6, type: 'stockade', troops: 10000, region: 'TURKS', buildingStyle: 'MONGOL', note: '[唐调露至圣历后突厥骨咄禄阿史德元珍复国南牙黑沙城·阴山北麓呼和浩特北或杭爱南道游牧汗庭营城] 永淳元年（682）骨咄禄纠合亡散五千骑据黑沙城南掠蔚定复建后突厥汗国（《旧唐书·突厥传上》），系草原游牧可汗驻兵休牧土石营帐，无万人居民城市，定城寨。' },


    { id: 'city_beiluocheng', name: '孛罗营', factionId: 'duolu', lat: 44.9, lng: 82.07, type: 'stockade', region: 'TURKS',
buildingStyle: 'CENTRAL_ASIA', troops: 10000,
        note: '[唐显庆二年苏定方平西突厥阿史那贺鲁双河之战至元代博罗城（达鲁花赤驻城）·博尔塔拉河谷夯土方城] 西突厥咄陆五部牧地，耶律楚材《西游录》与《元史》所记阿里麻里东北之孛罗城（博乐达勒特破城遗址周约2公里夯土墙），14世纪荒废，夯土小城常住约3000–6000人<1万，定城寨。',
    },

    { id: 'city_dushancheng', name: '独山营', factionId: 'chuyue', lat: 44.42, lng: 84.92, type: 'stockade', troops: 10000, region: 'TURKS', buildingStyle: 'CENTRAL_ASIA', note: '[唐贞观显庆西突厥处月部朱邪孤注（沙陀先祖）据守牢山独山营·准噶尔南缘奎屯独山子山麓牧营] 永徽二年（651）处月朱邪孤注从贺鲁反唐据牢山，梁建方契苾何力大破之（《新唐书·沙陀传》），天山北麓冲积扇游牧营垒无石砖城垣且<1万，定城寨。' },


    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CENTRAL_ASIA：迪化城（乌鲁木齐）：准噶尔牧地，归鞑靼（中亚草原）
    { id: 'city_wutucheng', name: '迪化城', factionId: 'shanshan', lat: 43.735353, lng: 87.574768, type: 'stockade', troops: 10000, region: 'WESTERN', buildingStyle: 'WESTERN' , note: '[唐轮台戍故地至17世纪准噶尔汗国乌鲁木齐牧场（清乾隆筑迪化城在1755至1763年超限）·天山北麓草场帐营] 清筑迪化土石城在乾隆二十三年后（晚于1700年红线不采）；≤1700年乌鲁木齐（蒙古语优美牧场）为卫拉特准噶尔游牧骑兵牧地（唐北庭轮台县故城早废为夯土残垣），常住<1万，定城寨。' },


    { id: 'city_gaochangcheng', name: '高昌', factionId: 'huihu', lat: 42.8533, lng: 89.53, type: 'small_city', region: 'WESTERN_CASTLE',
buildingStyle: 'WESTERN', troops: 10000, mirror: true,
        note: '[汉戊己校尉高昌壁、麴氏高昌王国都、唐西州安西都护府至高昌回鹘王都·周5.4公里三重高大夯土都城] 贞观十四年侯君集平麴文泰时《旧唐书·高昌传》载高昌王城及属邑户八千余、僧侣使团商旅云集，9–13世纪高昌回鹘亦都护冬都（王延德《使高昌记》记佛寺五十余区），高昌故城2.2平方公里内盛期城居约2–3万，>1万定小城。',
    },


    { id: 'city_jinchangcheng', name: '晋昌', factionId: 'tang', lat: 40.5346, lng: 95.820007, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[汉冥安、北魏常乐郡至唐武德置瓜州晋昌郡（开元张守珪刺瓜州）·疏勒河锁阳城夯土内外双城] 丝路河西分赴伊吾与敦煌咽喉瓜州，《旧唐书·地理志》明载唐天宝盛期瓜州全州二县合计仅「户四百七十七，口四千九百八十七」，举州不满五千口且锁阳城遗址为纯夯土墙，定城寨。' },

    { id: 'city_jieshuangna', name: '羯霜那', factionId: 'hou_zhao', lat: 40.124284, lng: 65.341187, type: 'stockade', region: 'CENTRAL_ASIA',
buildingStyle: 'CENTRAL_ASIA', troops: 10000,
        note: '[隋唐昭武九姓史国都城羯霜那（乞史／沙赫里萨布兹前身）·卡什卡河绿洲生土泥砖城邑] 《隋书·西域传》《新唐书·西域传》载史国都独莫水南十里羯霜那城（本据点锁定前伊斯兰隋唐粟特史国阶段，帖木儿白宫建于1380年代后），隋唐粟特泥砖生土城垣且查无破万城居确数，定城寨。',
    },
    { id: 'city_samaerhan', name: '撒马尔罕', factionId: 'tiemuer', lat: 39.6525, lng: 66.9714, type: 'medium_city', troops: 10000, region: 'TIMURID', buildingStyle: 'CENTRAL_ASIA' , note: '[12世纪西辽河中至15世纪初帖木儿帝都·砖石泥砖巨都] 1220年前阿弗拉西阿卜城及1404年帖木儿帝都撒马尔罕城关连片人口峰值约10–20万（克拉维约《东使记》及Chandler 1200／1400年表10–15万），>10万定中城。' },

    { id: 'city_jizhake', name: '吉扎克', factionId: 'buhala', lat: 40.1167, lng: 67.8333, type: 'stockade', troops: 10000, region: 'CENTRAL_ASIA', buildingStyle: 'CENTRAL_ASIA' , note: '[9至12世纪萨曼王朝乌斯特鲁沙那边境圣战军营镇迪扎克（吉扎克）·努拉塔山口泥砖拉巴特驿镇] 10世纪伊本·豪卡勒《大地志》记迪扎克为河中平原通草原游牧边界聚集志愿圣战者（Ghazis）之泥砖拉巴特军驿小镇（布哈拉埃米尔大堡建于18–19世纪超限），≤1700年泥砖小镇不足8000人，定城寨。' },




    { id: 'city_yierkeshentan', name: '斯姆哈纳', factionId: 'keerkezi', lat: 39.67, lng: 73.9, type: 'stockade', region: 'CENTRAL_ASIA',
buildingStyle: 'WESTERN', troops: 10000,
        note: '[汉捐毒休循西道至中世纪喀喇汗叶尔羌汗国翻越葱岭商队驿口斯姆哈纳（伊尔克什坦）·克孜勒苏河源高山牧卡] 连接喀什噶尔与费尔干纳奥什之铁列克提达坂东口河谷歇驼草场（柯尔克孜冲巴噶什部牧地），海拔近三千米山谷无城郭且常住牧户不足千人，定城寨。',
    },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」推出的二级与史实不符 → 归 CENTRAL_ASIA：轮台：汉轮台屯田、西域都护地，塔里木
    { id: 'city_luntai', name: '轮台', factionId: 'han_d', lat: 41.77, lng: 84.25, type: 'stockade', troops: 10000, region: 'KHITAN', buildingStyle: 'WESTERN' , note: '[西汉贰师破仑头至轮台屯田·天山南麓夯土军屯小城] 《汉书·西域传》载原仑头国全境仅户六百八十、口四千八百，汉置使者校尉领士卒数百人屯田轮台（奎玉克协海尔夯土遗址），夯土小城不足5000人，定城寨。' },

    { id: 'city_duluohe', name: '推河堡', factionId: 'kaerka', lat: 45.826868, lng: 101.878967, type: 'stockade', region: 'STEPPE_IMPERIAL',
buildingStyle: 'MONGOL', troops: 10000,
        note: '[1700年前喀尔喀图音河畔·杭爱南麓游牧驻帐营地] 清雍正九年（1731）始于图音河筑推河戍堡屯兵防准噶尔（《清实录·世宗实录》，晚于1700年红线不采）；≤1700年仅为喀尔喀牧地河谷帐营，无城墙且人口<1万，定城寨。',
    },
    { id: 'city_guyanshan', name: '姑衍山', factionId: 'xiongnu', lat: 48.6184, lng: 110.6488, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[西汉元狩四年霍去病封狼居胥山、禅于姑衍山·肯特山西北或鄂尔浑上游漠北森林山岭牧营] 《史记·卫将军骠骑列传》载霍去病北伐深入二千余里禅姑衍山临瀚海，系漠北游牧部族山谷草场，无城垣且常住<1万，定城寨。' },




    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CENTRAL_ASIA：淖毛湖：哈密北境回部（维吾尔）牧地，归鞑靼（中亚）
    { id: 'city_naomaohu', name: '淖毛湖', factionId: 'xiongnu', lat: 43.279321, lng: 94.713135, type: 'stockade', troops: 10000, region: 'STEPPE_ANTIQUITY', buildingStyle: 'MONGOL', note: '[汉伊吾卢北境匈奴呼衍王牧地淖毛湖·东天山北麓莫钦乌兰山前胡杨戈壁绿洲营地] 东汉与北匈奴争夺伊吾屯田之北翼戈壁水草点（《后汉书·西域传》），无砖石城郭且沙漠绿洲游牧聚落不足2000人，定城寨。' },

    { id: 'city_jiluoshan', name: '稽落山', factionId: 'bayegu', lat: 44.97439, lng: 99.113159, type: 'stockade', troops: 10000, region: 'STEPPE_FEUDAL', buildingStyle: 'MONGOL', note: '[东汉永元元年（89）窦宪耿秉出塞与北单于决战地稽落山·蒙古高原额布根山脉游牧山地] 窦宪率汉与南匈奴三万骑战于稽落山大破北单于，斩名王以下万三千级（《后汉书·窦宪传》），漠北游牧山地驻帐点无城垣且常住<1万，定城寨。' },

    { id: 'city_aodongcheng', name: '敖东城', factionId: 'liao_d', lat: 43.37, lng: 128.22, type: 'small_city', region: 'KHITAN', buildingStyle: 'NORTHEAST', troops: 10000, note: '[698至742年渤海国震国公高王大祚荣开国四十四年古都旧国·牡丹江上游敦化城山子山城与平原敖东城] 圣历元年大祚荣东保东牟山筑城立国（《旧唐书·渤海靺鞨传》「筑城以居，靺鞨之众及高丽余烬稍归之，地方五千里户十余万」），迁中京显德府前开国王都聚居军民贵族约1.5–2.5万，>1万定小城。' },
    { id: 'city_longtanshancheng', name: '龙潭山', factionId: 'dongxia', lat: 43.834536, lng: 126.589966, type: 'pass', region: 'JURCHEN', buildingStyle: 'NORTHEAST', troops: 10000, note: '[高句丽北境至金末东夏国·松花江畔块石夯土山城要塞] 高句丽始筑、金末蒲鲜万奴东夏国据守之吉林龙潭山城，现存周2.4公里块石夹筑夯土山城高垣及水牢兵库（《元史·太祖纪》及全国重点文保考古报告），纯军事山城具石土墙且<1万，定险要。' },
    { id: 'city_bamiancheng', name: '八面关', factionId: 'yehe', lat: 43.189189, lng: 124.354248, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[辽金韩州故址至明末叶赫南境·辽北平原夯土故城聚落] 实为辽金韩州柳河县八面城夯土四门县城遗址，明末为叶赫部金台吉南境边地（《辽史·地理志》《明神宗实录》，史名八面城而非关隘），系荒废夯土县邑聚落且人口<1万，定城寨。' },

    { id: 'city_tuhe', name: '徒河', factionId: 'ming_d', lat: 41.12, lng: 121.14, type: 'small_city', troops: 10000, region: 'WEI', buildingStyle: 'WEI' , note: '[汉辽西徒河、辽锦州临海军至明辽东重镇锦州卫中左所（祖大寿洪承畴松山锦州大战）·小凌河包砖大城] 明洪武二十四年置广宁中屯、左屯二卫于锦州，崇祯间祖大寿大修包砖石基内外双城及关厢拒皇太极长围（《辽东志》《明季北略》载城中辽军与商民数万口），>1万且具包砖坚城，定小城。' },

    { id: 'city_feiru', name: '肥如', factionId: 'caowei', lat: 39.89, lng: 118.89, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[商周孤竹国、两汉辽西郡治肥如、曹魏田豫北伐至隋唐平州明永平府（卢龙）·滦河青龙河交汇条石包砖府城] 控榆关山海西侧咽喉，隋唐北平郡平州治，明洪武四年大扩建条石包砖周九里永平府城统辖山海蓟东防务（《汉书·地理志》《永平府志》），府卫军民达2–3万，>1万定小城。' },

    { id: 'city_macheng', name: '马城', factionId: 'caowei', lat: 40.70, lng: 114.35, type: 'stockade', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[两汉代郡边县至曹魏黄初之役·东洋河畔夯土塞垣故城] 西汉置代郡马城县为东部都尉治，曹魏黄初五年田豫据马城夯土故城破轲比能十重围（《汉书·地理志》《三国志·田豫传》《水经注·㶟水》），城居无载且为夯土小城，定城寨。' },

    { id: 'city_wuzhong', name: '无终', factionId: 'ming_d', lat: 39.95, lng: 117.4, type: 'small_city', troops: 10000, region: 'WEI', buildingStyle: 'WEI', note: '[春秋山戎无终子国、汉右北平无终（田畴李广故地）至唐开元置蓟州渔阳郡明蓟州镇·盘山南麓包砖重镇] 安禄山兼领之唐蓟州静塞军，明洪武四年包砖修筑周九里蓟州城并定为九边蓟镇三屯营西协重镇、蓝玉北征集结地（《左传·襄公四年》《明史·兵志》《蓟州志》），州卫军民达2–3万，>1万定小城。' },




    { id: 'city_wugucheng', name: '乌骨城', factionId: 'gaogouli', lat: 40.7685, lng: 123.9395, type: 'pass', region: 'KOREA',
buildingStyle: 'KOREA', troops: 10000,
        note: '[高句丽晚期辽东重塞·凤凰山绝壁楔形花岗岩巨石山城] 高句丽乌骨山城（今凤城凤凰山古城），全以楔形花岗岩条石砌筑周15公里险垣扼鸭绿江入辽东山道（《新唐书·高丽传》贞观二十二年薛万彻伐乌骨城），石墙山塞且无万人常住民城，定险要。', mirror: true },
    { id: 'city_shangzhou', name: '三白', factionId: 'joseon', lat: 36.41, lng: 128.16, type: 'stockade', troops: 10000, region: 'JOSEON', buildingStyle: 'KOREA', note: '[新罗沙伐州至朝鲜庆尚道尚州牧（古三白，1592年李镒尚州败绩处）·洛东江支流小石土邑城] 万历二十年壬辰倭乱小西行长于尚州击溃巡边使李镒仓促募聚之农兵八百人（柳成龙《惩毖录》），朝鲜中期尚州邑城狭小（周仅三千余尺），邑内官衙吏民常住约4000–6000人<1万，定城寨。' },

    { id: 'city_yuanzhishi', name: '原之辻', factionId: 'yizhi', lat: 33.791, lng: 129.703, type: 'stockade', isPort: true, region: 'JAPAN_ANTIQUITY', buildingStyle: 'JAPAN', troops: 10000, note: '[弥生时代《魏志·倭人传》一支国王都原之辻遗址·壹岐岛幡鉾川三重环壕木栅聚落] 陈寿《三国志·魏书·倭人传》明载渡一海至一大国（一支国）「有三千许家，差有田地犹不足食」，日本国特别史迹原之辻发掘三重环壕与码头，全岛合计三千家、环壕聚落常住约2000–3000人无石墙，定城寨。' },
    { id: 'city_taizaifu', name: '太宰府', factionId: 'shoni', lat: 33.51, lng: 130.52, type: 'small_city', isPort: true, troops: 10000, region: 'JAPAN', buildingStyle: 'JAPAN' , note: '[8至12世纪日本律令西海道总督府大宰府·大野基肄朝鲜式石垒与条坊都市] 管辖九州二岛外交海防之「远朝廷」大宰府，北依大野城百济式巨石垒、南展二十四条十二坊棋盘街区，奈良平安盛期条坊人口约1.5–2万（Farris《古代日本人口与经济》），>1万定小城。' },
    { id: 'city_goto', name: '五岛', factionId: 'goto', lat: 32.6955, lng: 128.841, type: 'stockade', isPort: true, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', troops: 10000, note: '[室町战国宇久五岛氏期·福江土垒空堀水军居馆（江川城）] 遣唐使南路末站值嘉岛、战国五岛玄雅水军本据江川城（宽永火毁；石垣福江城迟至1849年方筑，超年不采），≤1700年为土垒无石墙且港町人口不足5000，定城寨。' },
    { id: 'city_nagasaki', name: '长崎', factionId: 'omura', lat: 32.7555, lng: 129.8777, type: 'small_city', isPort: true, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', troops: 10000, note: '[安土桃山南蛮开港至江户元禄天领期·出岛石岸与连片唐兰贸易港市] 1571年开港后为幕府直辖唯一锁国对外贸易港，据《宽文元禄长崎人口帐》实测1669年城居40,563人、1696年达64,523人（远超1万且未满8万），定小城。' },
    { id: 'city_aomen', name: '澳门', factionId: 'putaoya', lat: 22.1975, lng: 113.5438, type: 'small_city', isPort: true, region: 'PORTUGUESE', buildingStyle: 'PORTUGUESE', troops: 10000, note: '[明嘉靖开埠至17世纪葡居自治盛期·大炮台与三巴石筑火炮城垣港市] 1557年开埠后成中日丝银与果阿航线枢纽，1622–1626年筑三合土包石环城墙与大炮台，1635年博卡罗《东方要塞图志》实载城中葡人华民家庭合计逾2万口，>1万且具石墙，定小城。' },
    { id: 'city_kelunpo', name: '科伦坡', factionId: 'putaoya', lat: 6.9271, lng: 79.8612, type: 'small_city', isPort: true, region: 'INDIA', buildingStyle: 'PORTUGUESE', troops: 10000, note: '[16至17世纪葡属与荷属锡兰首府·红土巨石十二棱堡环城港都] 1518年葡建要塞、1597年起为葡属锡兰首府，筑完整红土石环城墙与十二座石棱堡围合总督府及市民坊区，1635年博卡罗《要塞图志》载城居约7000–9000人，<1万具完整石墙，定小城。' },
    { id: 'city_cebu', name: '宿务', factionId: 'xibanya', lat: 10.3157, lng: 123.8854, type: 'stockade', isPort: true, region: 'SPANISH', buildingStyle: 'SPANISH', troops: 10000, note: '[16至17世纪西属菲律宾初创城宿务·三角形小石堡与竹木无墙市镇] 1565年莱加斯皮登陆建圣佩德罗小型三角棱堡（每边仅30米），1571年殖民中心迁马尼拉后宿务市镇本身无外郭石墙，≤1700年常住仅3000–5000人<1万，定城寨。' },
    { id: 'city_plymouth', name: '普利茅斯', factionId: 'yinggelan', lat: 50.3755, lng: -4.1427, type: 'small_city', isPort: true, region: 'BRITONS', buildingStyle: 'BRITONS', troops: 10000, note: '[15至17世纪英格兰皇家海军西港·石灰岩城墙与石砌皇家棱堡港城] 1588年德雷克迎击西班牙无敌舰队母港，16世纪具市政石墙、1665年增筑皇家石砌大棱堡，1670年代至1700年城居约8000–10000人（Chalklin英国城镇人口考），具完整石墙定小城。' },
    { id: 'city_ambon', name: '安汶', factionId: 'nidelan', lat: -3.6954, lng: 128.1814, type: 'stockade', isPort: true, region: 'SEASIA_IMPERIAL', buildingStyle: 'MALAY', troops: 10000, note: '[16至17世纪葡荷摩鹿加丁香中心·维多利亚小堡与马来木屋港镇] 1575年葡建堡、1605年荷兰VOC夺为香料据点，市镇为马来式木竹民居且无环镇石墙，1690年代VOC人口册载城堡周边镇民约5000–6000人（Knaap 1987考证）<1万，定城寨。' },
    { id: 'city_banda', name: '班达奈拉', factionId: 'nidelan', lat: -4.5213, lng: 129.9054, type: 'stockade', isPort: true, region: 'SEASIA_IMPERIAL', buildingStyle: 'MALAY', troops: 10000, note: '[17世纪荷属肉豆蔻专卖中心班达奈拉·比利时小石堡与岛屿庄园聚落] 1609–1621年科恩征服班达群岛建纳苏与比利时两小堡，全群岛在籍种植园人口合计仅约4000–6000人、奈拉本镇约2000人且镇无环城墙（Hanna《印尼殖民地班达》），定城寨。' },
    { id: 'city_wandan', name: '万丹', factionId: 'wandan', lat: -6.0333, lng: 106.1500, type: 'small_city', isPort: true, region: 'SEASIA_IMPERIAL', buildingStyle: 'MALAY', troops: 10000, note: '[16至17世纪爪哇万丹苏丹国极盛期·红砖珊瑚石环城墙胡椒大都会] 毛拉纳·优素福筑红砖与珊瑚石外郭城墙，阿贡苏丹时期（1651–1682）为东南亚最大胡椒集散港都，城关实居达4–7万（Reid《商业时代的东南亚》第2卷及Chandler表5万），>1万定小城。' },

    { id: 'city_chijianguan', name: '赤间关', factionId: 'heishi', lat: 33.95, lng: 130.93, type: 'pass', isPort: true, troops: 10000, region: 'JAPAN', buildingStyle: 'JAPAN', note: '[平安末坛之浦至镰仓战国·关门海峡咽喉海防渡口关所] 扼本州与九州间早鞆濑户水道，寿永四年（1185）平氏与源义经决战坛之浦即在关前，历代设关司海检戍卫（《平家物语》《吾妻镜》），带「关」字之海峡关塞且≤1700年未满万人城，定险要。' },

    { id: 'city_guizhicheng', name: '备中高松城', factionId: 'mori', lat: 34.69, lng: 133.82, type: 'pass', region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', troops: 10000, note: '[安土桃山时代毛利境目七城·低湿地石垣土垒水防要塞] 毛利氏备中前线境目要塞高松城，天正十年（1582）羽柴秀吉筑长堤水攻，城将清水宗治切腹保兵（《信长公记》），纯前线军事城塞具石垣土垒且常住<1万，定险要。' },
    { id: 'city_junfucheng', name: '骏府', factionId: 'imagawa', lat: 34.97, lng: 138.38, type: 'medium_city', isPort: true, region: 'JAPAN_IMPERIAL',
buildingStyle: 'JAPAN', troops: 10000,
        note: '[17世纪初德川家康大御所期·巨石垣三重堀骏府城下町] 庆长十二年至元和二年（1607–1616）德川家康隐居骏府执掌大政期间，骏府九十六町城下町峰值达8–10万（1609年西属吕宋总督比韦罗《日本见闻录》估10万、鬼头宏考算8–10万），≥8万定中城。',
    },
    { id: 'city_hamamatsu', name: '浜松城', factionId: 'tokugawa', lat: 34.71, lng: 137.73, type: 'small_city', troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN' , note: '[元龟天正德川家康十七年居城至江户谱代要藩·野面积石垣浜松城与东海道城下町] 1570–1586年德川家康扩建引马城为浜松城并兴城下町（三方原合战退守本城），江户五万石谱代藩都兼东海道宿场，≤1700年武家合町人约1.5–2万且具石垣城郭，定小城。' },

    { id: 'city_atsuta', name: '宫宿', factionId: 'oda', lat: 35.12, lng: 136.95, type: 'small_city', troops: 20000, region: 'JAPAN', buildingStyle: 'JAPAN', note: '[战国织田氏至江户东海道第一大宿场港·热田神宫门前连片港町宫宿] 织田信长桶狭间出阵祈愿地，江户时代为东海道五十三次规模最大宿场兼伊势湾七里渡海港，元禄至享保间宫宿町家逾二千五百户、常住人口达1.1–1.4万（《尾张徇行记》），>1万定小城。', },

    { id: 'city_xuanhua', name: '宣化', factionId: 'ming_d', lat: 40.609, lng: 115.052, type: 'small_city', troops: 10000, region: 'WEI', buildingStyle: 'WEI' , note: '[明代九边宣府镇总兵驻城·夯土包砖周二十四里边镇城] 明永乐至万历宣府镇城砖墙虽周二十四里，城内多为镇帅公署、草场与仓廒，本城在籍正奇兵马与商民家口合计约5–7万（《嘉靖宣府镇志》兵马钱粮原额折算），未满8万中城容差线，定小城。' },
    { id: 'city_xinghe', name: '兴和城', factionId: 'yuan_d', lat: 41.15, lng: 114.7, type: 'pass', troops: 10000, region: 'STEPPE', buildingStyle: 'XIANBEI', note: '[元兴和路至明初兴和守御千户所·坝上高原夯土包砖边防卫所] 明洪武三十年就元高原故址筑兴和守御千户所城，控宣府北出漠南野狐岭口通道，永乐中阿鲁台屡攻此所（《明史·地理志》《明太宗实录》），明代最著名阶段为守边军所城且常住<1万，定险要。' },



    { id: 'city_jining', name: '集宁', factionId: 'baidi', lat: 41.03, lng: 113.1, type: 'stockade', region: 'STEPPE_ANTIQUITY',
buildingStyle: 'XIANBEI', troops: 10000,
        note: '[春秋白狄故地、金置集宁县至元集宁路总管府·乌兰察布霸王河畔路城子夯土方城] 汪古部封地商路集市集宁路（察右前旗土城子遗址实测760×940米约0.7平方公里纯夯土城垣，元末红巾军破上都时焚毁荒废，《金史》《元史·地理志》及内蒙古考古发掘报告），夯土路城常住约5000–8000人<1万，定城寨。',
    },
    { id: 'city_jingzhou', name: '净州塞', factionId: 'ongut', lat: 41.56, lng: 111.66, type: 'stockade', region: 'STEPPE',
buildingStyle: 'XIANBEI', troops: 10000,
        note: '[金大定净州至蒙元汪古部·阴山北麓夯土州县治城] 金大定十八年置西京路净州治天山县，汪古部阿剌兀思剔吉忽里镇守其北金界壕（《金史·地理志》净州全州户5,938、《元史·阿剌兀思传》），实为有民户之夯土州治小城而非单立关门，城居约4000–6000人<1万，定城寨。',
    },

    { id: 'city_saierwusu', name: '赛尔乌苏', factionId: 'rouran', lat: 44.818872, lng: 106.800842, type: 'stockade', region: 'ROURAN',
buildingStyle: 'MONGOL', troops: 10000,
        note: '[南北朝柔然社仑阿那瓌漠南漠北往来中道至清初阿尔泰军台总汇赛尔乌苏·中戈壁草原水泉驿站] 张家口北出瀚海通库伦与乌里雅苏台分道咽喉甜水井牧站（《朔漠方略》《口北三厅志》），戈壁水草毡帐台站无城墙且常住不足千人，定城寨。',
    },
    { id: 'city_tongdi', name: '铜鞮', factionId: 'jin', lat: 36.7741, lng: 112.6675, type: 'stockade', region: 'NORTH',
buildingStyle: 'WEI', troops: 10000,
        note: '[春秋晋国羊舌氏封邑·浊漳水北源夯土采邑小城] 晋国铜鞮宫及羊舌赤（铜鞮伯华）封邑（《左传·成公九年》《襄公三十一年》），春秋晋邑为夯土城垣且查无破万城居人口，定城寨。',
    },
    { id: 'city_huixian', name: '河池', factionId: 'shu', lat: 33.80, lng: 106.06, type: 'stockade', region: 'BASHU', buildingStyle: 'BASHU', troops: 10000, note: '[西汉元鼎置武都郡河池县、东汉末曹操取汉中经河池氐王窦茂至南宋吴璘河池军粮站·嘉陵江上游徽县盆地夯土小县] 建安二十年曹操自陈仓出散关至河池屠氐王窦茂，元升徽州（《三国志·武帝纪》《元史·地理志》），秦蜀间山间小盆地夯土县州城（明成化后始部分砌砖周仅三里），≤1700年在城不足6000人，定城寨。' },
{ id: 'city_huojia', name: '获嘉', factionId: 'wei', lat: 35.26, lng: 113.66, type: 'stockade', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[西汉元鼎置县至曹魏河内期·太行南麓夯土小县城] 汉武帝元鼎六年巡幸至汲县新中乡得南越吕嘉首级置获嘉县（《汉书·武帝纪》），汉魏时期为普通夯土小县城，查无城居破万史料，定城寨。' },


    { id: 'city_eyu', name: '阏与', factionId: 'zhao', lat: 36.487, lng: 113.381, type: 'stockade', troops: 10000, region: 'CENTRAL', buildingStyle: 'WEI' , note: '[战国赵惠文王二十九年（前270）赵奢狭路勇胜大破秦军救韩阏与·太行山中段和顺山谷夯土小邑] 秦伐韩围阏与，「道远险狭譬犹两鼠斗于穴中」，赵奢卷甲趋救据北山大破秦军（《史记·廉颇蔺相如列传》），系太行山险狭夯土小邑（非设关关门），常住不足5000人，定城寨。' },


    
    { id: 'city_fushi', name: '肤施', factionId: 'song', lat: 36.59, lng: 109.48, type: 'small_city', troops: 10000, region: 'SONG', buildingStyle: 'WEI' , note: '[秦汉上郡肤施、北宋沈括范仲淹经略鄜延路帅府延安府至明延安府·延水清凉山麓条石包砖东城南城] 北宋防御西夏第一主帅府延州（康定至元祐驻西军精兵数万，《宋史·范仲淹传》《梦溪笔谈》），明包砖条石筑城，宋明军政都会在城人口达2.5–4万，>1万定小城。' },


    { id: 'city_changze', name: '长泽', factionId: 'liangshidu', lat: 39.1, lng: 107.98, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'XIANBEI', note: '[北魏置阐熙长泽县、隋末梁师都永隆政权西翼至唐元和复置宥州治长泽·毛乌素西缘白城子夯土州县城] 唐开元及元和十五年移宥州治长泽县安置党项降户，《旧唐书·地理志》天宝宁朔郡（宥州）全州合计仅户7,083，沙地夯土小州城内常住仅两三千人<1万，定城寨。' },

    { id: 'city_linrong', name: '临戎', factionId: 'han_d', lat: 40.3, lng: 107, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'XIANBEI', note: '[西汉元朔二年卫青筑朔方城（东汉朔方郡治临戎县）·磴口补隆淖黄河故道旁夯土方城] 汉武帝遣苏建十万人筑朔方城，至东汉羌胡内迁《续汉书·郡国志》明载朔方全郡六城合计仅余「户千九百八十七，口七千八百四十三」，临戎夯土故城（600×450米）常住不足5000人，定城寨。' },


    { id: 'city_aowei', name: '媪围', factionId: 'han_d', lat: 37.396289, lng: 104.111938, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[西汉置武威郡媪围县·景泰白墩子腾格里沙漠南缘黄河渡道夯土边塞小县] 控武威东渡黄河赴朔方捷径之汉代边县，东汉省入武威郡武威姑臧（《汉书·地理志》），干旱戈壁绿洲夯土小县址狭小且人口无载<1万，定城寨。' },


    { id: 'city_mingsha', name: '鸣沙', factionId: 'dangxiang', lat: 37.51, lng: 105.18, type: 'stockade', region: 'HEXI',
buildingStyle: 'HEXI', troops: 10000,
        note: '[北周置会州、隋置鸣沙县至唐武德置西会州（鸣沙州）及西夏鸣沙军镇·中宁黄河南岸白马滩夯土小城] 控灵州西南黄河峡口驿道，沙随人马践踏发声故名鸣沙，唐安史后没吐蕃、元初废入应理州（《元和郡县图志》卷四），夯土军镇小县城居不足5000人，定城寨。',
    },
    { id: 'city_xingqingfu2', name: '兴庆府', factionId: 'dangxiang', lat: 38.537412, lng: 106.295471, type: 'medium_city', troops: 10000, region: 'TANGUT', buildingStyle: 'HEXI' , note: '[11至13世纪初西夏国都兴庆府·夯土包砖周十八里都城] 西夏元昊至仁宗盛期中兴府（兴庆府）城垣内及近城坊厢军民工匠峰值约10–15万（《宋史·夏国传》《嘉靖宁夏新志》及杜建录西夏人口考算），>10万定中城。' },


    { id: 'city_lingju', name: '令居', factionId: 'han_d', lat: 36.73, lng: 103.26, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[西汉元鼎六年筑令居塞、旋置金城郡令居县（赵充国辛武贤屯兵河湟咽喉）·庄浪河谷永登夯土县城] 汉武帝破匈奴浑邪王后首筑令居塞列亭至敦煌并设令居县（《史记·大宛列传》《汉书·赵充国传》），汉魏代表阶段为有户籍之夯土边县小城（全金城郡东汉仅三千八百户），城居不足5000人，定城寨。' },




    { id: 'city_zuli', name: '祖厉', factionId: 'song', lat: 36.56, lng: 104.68, type: 'stockade', region: 'SONG',
buildingStyle: 'CENTRAL', troops: 10000,
        note: '[西汉置安定郡祖厉县（东汉永元元年窦宪出师会盟处）至北宋元符筑会州敷文城·祖厉河入黄河口夯土边城] 《后汉书·窦宪传》北伐前屯兵祖厉，北宋元符二年筑会州新泉夯土城抗西夏（《宋史·地理志》会州仅领敷文一县），黄土苦水河口夯土边城常住军民约4000–7000人<1万，定城寨。',
    },
    // ── 2026-06-11 新增：折墌（薛举西秦/薛举据城）──
    { id: 'city_zhedi', name: '真宁', factionId: 'dajin', lat: 35.5, lng: 107.94, type: 'stockade', troops: 10000, region: 'SONG', buildingStyle: 'CENTRAL', note: '[隋罗川县、唐天宝元年获玉真人像改宁州真宁县至金正大八年完颜陈和尚倒回谷大捷翼邑·子午岭西麓夯土小县] 陇东黄土高塬普通属县真宁（今正宁，《新唐书·地理志》《金史·完颜陈和尚传》），历代至清初皆为周三里余纯夯土县垣无砖石包砌，在城常住仅两三千人<1万，定城寨。' },


    // ── 2026-06-11 精锐部队缺口：新建据点 ──
    { id: 'city_jingling', name: '竟陵', factionId: 'chuguo', lat: 30.662000, lng: 113.166000, type: 'small_city', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[战国楚竟陵邑（白起拔郢前先拔竟陵）、西晋竟陵郡至五代唐宋复州明景陵县·汉北天门河包砖城垣] 陆羽故里与竟陵派文学名邑，五代后晋至南宋为复州治，明成化弘治包砖修筑周七里景陵县城（《史记·白起传》《天门县志》），江汉棉粮集散邑城居约1.5–2万，>1万定小城。' },
    { id: 'city_yunmeng', name: '云梦', factionId: 'chuguo', lat: 31.02, lng: 113.75, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[春秋战国楚王游猎云梦泽·江汉平原泽畔夯土离宫邑聚] 楚庄王、楚昭王涉雎济江入于云梦（《左传·宣公四年》《定公四年》及云梦楚王城夯土遗址），楚代为泽畔行猎邑聚，城居查无破万实据且为夯土城垣，定城寨。' },

    { id: 'city_daming', name: '大名', factionId: 'tianxiong', lat: 36.5138, lng: 115.3043, type: 'medium_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'WEI' , note: '[唐魏博节度魏州至北宋北京大名府·夯土包砖陪都巨城] 唐魏博牙城罗城至北宋陪都北京大名府（外城周四十八里，元城、大名两县附郭及御河漕运关厢）城居峰值约10–15万（《宋史·地理志》大名府崇宁户155,253折算在城），>10万定中城。' },

    { id: 'city_shizhu', name: '石柱', factionId: 'ming_d', lat: 30, lng: 108.11, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[南宋马定虎镇石柱至明洪武授石柱宣抚司（天启崇祯巾帼名将秦良玉白杆兵大本营）·川东七曜山龙河土石司治] 马氏土司世袭近七百年，万历天启崇祯间秦良玉统石柱土兵转战辽东勤王京师、筑万寿山石卡保境（《明史·秦良玉传》），但石柱宣抚司署坝子狭小（明末清初司治仅数百户约3000–5000人且无砖石府县巨垣），定城寨。' },

    { id: 'city_bijie', name: '毕节', factionId: 'luodian', lat: 27.302000, lng: 105.285000, type: 'stockade', region: 'BASHU', buildingStyle: 'BASHU', troops: 10000, note: '[明洪武十七年颖川侯傅友德置毕节卫、奢香夫人开赤水毕节驿道·七星关东翼川滇黔锁钥小石土卫城] 水西安氏与乌撒交界驿卫，天启二年安邦彦围贵阳分兵攻陷毕节卫（《明史·四川土司传》《毕节县志》，卫城周仅四里），边陲苦瘠小卫所城内军户商旅约4000–7000人（且本据点主系水西罗甸土司阶段无石砖城郭），定城寨。' },
    { id: 'city_tianyang', name: '田阳', factionId: 'cen_d', lat: 23.720000, lng: 106.650000, type: 'stockade', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[北宋至明嘉靖广西右江岑氏最大土司田州府治（岑猛之乱与瓦氏夫人抗倭狼兵故里）·右江河谷土筑竹刺司城] 嘉靖五年王阳明招抚田州思恩改设流土并治、三十四年七旬女土官瓦氏率田州狼兵赴江浙王江泾破倭（《明史·王守仁传》《广西土司传》），田州土司旧治为夯土竹刺垣且在城常住约5000–8000人<1万，定城寨。' },
    { id: 'city_hailing', name: '海陵', factionId: 'nantang', lat: 32.550000, lng: 120.000000, type: 'small_city', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[西汉吴王刘濞煮海盐仓海陵、五代南唐升泰州至宋范仲淹修捍海堰明泰州·两淮盐税冠冕包砖周十里大州] 南唐昇元元年李昪升海陵为泰州，宋元明统辖淮南东路二十余盐场，盐商灶户辐辏，明洪武包砖修筑泰州城及北关坝口关厢（《南唐书》《崇祯泰州志》），城关人口达3–5万，>1万定小城。' },
    { id: 'city_jingkou', name: '濡须口', factionId: 'sunwu_d', lat: 31.580000, lng: 117.920000, type: 'pass', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, mirror: true, note: '[东汉末孙吴濡须口·夹水夯土包砖双坞东关水塞] 建安十七年吕蒙劝孙权夹濡须水口筑濡须坞，吴赤乌后称东兴堤／东关，曹魏四次大举南征皆阻于此坞（《三国志·吴主传》《吕蒙传》），史书明载「东关」水陆军坞且具城垣，未成万人城，定险要。' },
    { id: 'city_liyang', name: '巨鹿', factionId: 'ranwei_d', lat: 37.22, lng: 115.04, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[秦末项羽破釜沉舟巨鹿大郡治、两汉巨鹿郡国及东汉黄巾张角起兵广宗巨鹿·漳滏平原夯土大郡城] 秦三十六郡之巨鹿郡，西汉巨鹿郡领二十县户155,951、口827,177（《史记·项羽本纪》《汉书·地理志》），秦汉河北膏腴大郡治城常住达2.5–4万，>1万定小城。' },

    // 🔴 [2026-10-25 按史修正、主人问「洪承畴的军团为什么漠南」查出] 宁远城（今辽宁兴城）＝明宁远卫：
    //    明代关宁防线核心，1622 袁崇焕重筑砖城、架红夷大炮，宁远/宁锦大捷皆此城；本地最著名建筑层＝明式砖城。
    //    辽西走廊同一线 山海关／徒河（锦州）／襄平（辽阳）皆「河朔 WEI」；`XIANBEI`（漠南＝阴山—锡林郭勒—河套的塞外王帐石堡）不含辽西，
    //    原值系旧批量套用、非史实 → buildingStyle／region 一律 WEI。洪承畴、袁崇焕的文化与军团随之归位。
    { id: 'city_ningyuan', name: '宁远城', factionId: 'ming_d', lat: 40.618, lng: 120.72, type: 'pass', troops: 10000, region: 'WEI', buildingStyle: 'WEI', mirror: true , note: '[明宣德至天启崇祯·辽西走廊条石包砖四门卫城] 宣德三年筑宁远卫砖石城（周仅四里一百六十步约0.36平方公里），天启六年袁崇焕凭城发红夷大炮挫努尔哈赤后金主力（《明史·袁崇焕传》《辽东志》），城池狭小属纯走廊要塞且常住<1万，定险要。' },


    { id: 'city_salhu', name: '萨尔浒', factionId: 'manzhou_d', lat: 41.841, lng: 124.046, type: 'pass', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST' , note: '[明万历四十七年后金筑城·浑河苏子河汇口石土山城要塞] 万历四十七年（1619）正月努尔哈赤于萨尔浒山巅筑石基夯土军城屯兵储粮，三月破明杨镐四路大军于城下（《满洲实录》《明史·杨镐传》），纯军事山城具石土墙且无居民城，定险要。' },


    { id: 'city_wuchang', name: '武昌', factionId: 'sunwu_d', lat: 30.53, lng: 114.32, type: 'medium_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', mirror: true , note: '[孙吴武昌至南宋鄂州明武昌府·条石包砖江防省会] 南宋岳飞屯驻时鄂州城外南市关厢沿江十里商贾辐辏，及明万历湖广省会武昌府砖石城垣加南关汉口埠岸，城居峰值约10–15万（陆游《入蜀记》、Chandler表8.4–10万及曹树基考算），≥10万定中城。' },
    { id: 'city_quwo', name: '曲沃', factionId: 'jin', lat: 35.631000, lng: 111.474000, type: 'small_city', region: 'CENTRAL', buildingStyle: 'WEI', troops: 10000, note: '[春秋初晋桓叔庄伯武公六十七年强宗别都曲沃·浍水畔曲村天马晋都遗址与大邑夯土城垣] 前745年晋昭侯封成师于曲沃，《诗经·唐风》刺晋昭公微弱「曲沃邑大于翼（晋国都）」，前679年曲沃武公代晋并国（《左传·桓公二年》《史记·晋世家》），春秋晋宗大都城居逾1.5–2.5万，>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CENTRAL_ASIA：塔城（塔尔巴哈台）：准噶尔牧地，归鞑靼（中亚草原）
    { id: 'city_tacheng', name: '塔城', factionId: 'oirat_ming', lat: 46.746, lng: 82.983, type: 'stockade', troops: 10000, region: 'STEPPE_IMPERIAL', buildingStyle: 'MONGOL' , note: '[17世纪卫拉特准噶尔巴图尔珲台吉冬牧中心楚呼楚（塔尔巴哈台，清筑绥靖城在1766年超限）·塔尔巴哈台南麓牧帐营] 1635年巴图尔珲台吉建准噶尔汗国早期驻冬牙帐即在塔尔巴哈台霍博克与额敏谷地（清参赞大臣筑绥靖城在乾隆三十一年超1700年红线），≤1700年纯草原游牧牙帐无城墙，定城寨。；代理说明：本库无「卫拉特」键，帝国时代军团取 MONGOL 这一格＝帝国时代喀尔喀军团，名字属代理' },



    // 🔴 [2026-10-26 主人问「哈密卫，是城市，还是险要？」] 判「城」不是险要：
    //    哈密卫＝明代哈密卫治所、忠顺王府所在（永乐四年立卫、封忠顺王，《明史·卷329·西域传》），
    //    回回/畏兀儿/哈剌灰 三部聚居的绿洲居民城（王府、坊市、城郭俱在），史书不称关塞、名字也不带关/隘/渡/堡/戍/镇/哨卡
    //    → 按 AGENTS §五.1 不判 PASS；城居人口无直接史料，按③「按城郭判」（有夯土城郭）→ 小城。
    { id: 'city_hamiwei', name: '哈密卫', factionId: 'yiwu', lat: 42.8, lng: 93.5, type: 'stockade', troops: 10000, region: 'WESTERN_CASTLE', buildingStyle: 'WESTERN', mirror: true , note: '[唐伊州伊吾至明永乐哈密卫·东天山绿洲夯土卫城] 《旧唐书·地理志》唐伊州全州三县合计仅户2,467、口10,157，明设哈密卫忠顺王城为夯土城垣（《明史·西域传》），扣除绿洲村落城居约4000–7000人<1万，定城寨。' },

    // 🔴 [2026-10-26 主人令「请修复据点类型。务涂城也改一并复核」] 判「城」不是险要：
    //    务涂城＝车师后部王城务涂谷（《汉书·卷96下·西域传》「车师后国，王治务涂谷……户五百九十五，口四千七百七十四」），
    //    王城有城郭、有王治、居民聚落，不是「为守一条通道而设、本身不是居民城」的军事设施，名字也不带关/隘/渡/堡/戍/镇/哨卡 → 不判 PASS；
    //    城居人口无直接城居史料（国户口为全境，非城居）→ 按 §5.1③ 城郭判（有城郭）→ 小城。
    { id: 'city_bieshibali', name: '务涂城', factionId: 'chagatai', lat: 43.988866, lng: 89.579773, type: 'small_city', troops: 10000, region: 'WESTERN', buildingStyle: 'WESTERN', mirror: true , note: '[汉车师后王务涂谷至唐北庭大都护府驻瀚海军及高昌回鹘夏都别失八里·吉木萨尔1.5平方公里内外双重夯土都城] 长安二年置北庭都护府统天山北路，城内常驻瀚海军精兵一万二千人（《旧唐书·地理志》《通典·州郡典》），9–13世纪为回鹘夏都别失八里（长春真人亲访），军府与商胡城居逾1.5–2.5万，>1万定小城。' },



    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」推出的二级与史实不符 → 归 CENTRAL_ASIA：巴里坤：天山北路，汉—准噶尔通道
    { id: 'city_balikun', name: '巴里坤', factionId: 'han_d', lat: 43.6, lng: 93, type: 'stockade', troops: 10000, region: 'WESTERN', buildingStyle: 'WESTERN' , note: '[两汉天山北道行国蒲类国（东汉戊己校尉索班与班勇屯兵处；清筑巴里坤汉满双城在1731至1772年超限）·巴里坤湖草原帐营] 《汉书·西域传》明载蒲类国王治天山西疏榆谷，「户三百二十五，口二千三十二」，清雍正九年岳钟琪筑城晚于1700年红线不采；≤1700年为草原游牧小行国与准噶尔牧场无石砖城，定城寨。' },

    { id: 'city_buergenjuntai', name: '布尔根', factionId: 'duerbote', lat: 46.09, lng: 91.53, type: 'stockade', region: 'STEPPE_IMPERIAL', buildingStyle: 'MONGOL', troops: 10000,
        note: '[蒙元至准噶尔杜尔伯特期·阿尔泰南麓布尔根河谷牧营] 科布多南境布尔根河谷乌梁海与卫拉特杜尔伯特部游牧驻地（清乾隆中期以后方设军台卡伦，晚于1700年，《朔方备乘》），≤1700年为无墙河谷牧帐营地且人口<1万，定城寨。',
    },
    { id: 'city_zhabuhanjuntai', name: '扎布汗', factionId: 'manzhou_d', lat: 47.844489, lng: 94.174805, type: 'stockade', region: 'STEPPE_IMPERIAL', buildingStyle: 'MONGOL', troops: 10000, note: '[13至17世纪漠北扎布汗河流域喀尔喀扎萨克图部牧地（清策棱驻防军台设于1730年代超限）·杭爱西麓河谷毡帐营] 雍正十年额驸策棱统喀尔喀骑兵破准噶尔在1732年（晚于1700年红线）；≤1700年扎布汗河沿岸为喀尔喀西路随水草游牧草场，无城郭且单营人口<1万，定城寨。' },
    { id: 'city_teerhunjuntai', name: '特尔浑', factionId: 'zubu', lat: 48.089107, lng: 99.538879, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[辽金北方阻卜（鞑靼）诸部磨古斯驻牧后杭爱特尔浑河谷·鄂尔浑西源高山草甸游牧营盘] 辽道宗大安至寿昌间阻卜诸部长磨古斯据后杭爱河谷反辽十余年（《辽史·道宗纪》），纯草原河谷毡帐牧营无城垣且常住<1万，定城寨。' },

    { id: 'city_woluduocheng', name: '青岭牙帐', factionId: 'huihu', lat: 47.698601, lng: 102.631531, type: 'stockade', troops: 10000, region: 'MONGOL', buildingStyle: 'MONGOL', note: '[8至9世纪漠北回鹘汗国可汗夏秋别牙青岭牙帐·杭爱山脉北麓山林草原毡帐行宫] 唐回鹘顿莫贺达干（武义成功可汗）及后裔驻夏行帐青岭（《新唐书·回鹘传》），游牧汗廷毡帐营地无砖石城郭且常住<1万，定城寨。' },


    { id: 'city_douweihunhe', name: '都尉溷河', factionId: 'kereyid', lat: 47.859243, lng: 103.96637, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[汉北征塞外都尉溷水至12世纪克烈部王汗之弟札合敢不驻牧地·土拉河翁金河间草原河曲帐营] 汉代漠北出塞水道与大蒙古国兴起前克烈部贵族札合敢不游牧营地（《汉书》《元朝秘史》），草原无墙游牧聚落且人口<1万，定城寨。' },

    { id: 'city_xicheng', name: '息谷', factionId: 'caowei', lat: 39.62, lng: 125.66, type: 'stockade', troops: 10000, region: 'GOJOSEON', buildingStyle: 'KOREA', note: '[三国曹魏正始五年毌丘俭王颀伐高句丽追过丸都之鸭绿江南岸息谷·慈江道深山峡谷聚落] 毌丘俭破丸都后玄菟太守王颀越慈江深谷追高句丽东川王直抵买沟沃沮界（《三国志·毌丘俭传》），高寒林谷小聚无石砖城郭且人口不足3000人，定城寨。' },

    { id: 'city_qudiaoalan', name: '曲雕阿兰', factionId: 'menggu_d', lat: 47.146753, lng: 109.204102, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL' , note: '[1206至1240年大蒙古国历次忽里勒台选汗圣地曲雕阿兰·克鲁伦河上游沙陀行宫大斡耳朵] 1229年窝阔台即大汗位及1240年《蒙古秘史》结稿之地曲雕阿兰（今蒙古肯特省德尔格尔汗阔迭额阿剌勒），系金帐毡幕行宫会盟草场无砖石城墙，平时留守斡耳朵不足5000人，定城寨。' },


    { id: 'city_bayanwula', name: '巴彦乌拉', factionId: 'tuoba', lat: 44.53, lng: 117.6, type: 'stockade', region: 'NORTHEAST', buildingStyle: 'XIANBEI', troops: 10000, note: '[战国至汉初东胡强部王庭牧地与鲜卑推寅南迁大泽·锡林郭勒巴彦乌拉草原丘陵牧营] 冒顿单于袭灭东胡王前东胡驻牧锡林郭勒东南部草场及拓跋先祖推寅南迁驻地（《史记·匈奴列传》《魏书·序纪》），草原毡帐无城垣，定城寨。' },
    { id: 'city_halagaitu2', name: '哈拉盖图', factionId: 'manzhou_d', lat: 45.780925, lng: 119.245605, type: 'stockade', troops: 10000, region: 'STEPPE_IMPERIAL', buildingStyle: 'MONGOL', note: '[16至17世纪北元达延汗分封察哈尔左翼乌珠穆沁部翁衮都喇尔牧地哈拉盖图·锡林郭勒东北部草甸帐营] 崇德间归清编乌珠穆沁左右翼旗（《蒙古游牧记》《清史稿·藩部传》），纯草原游牧旗王驻冬毡帐无城墙且常住<1万，定城寨。' },

    { id: 'city_kuoyitian', name: '阔亦田', factionId: 'zhadalan', lat: 47.135705, lng: 115.290527, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[1202年成吉思汗与王汗联军大破乃蛮札木合十一部联军古战场阔亦田·呼伦贝尔鄂嫩河南山地草场] 《元朝秘史》第142–143节详载阔亦田高地大战（乃蛮不亦鲁黑汗施暴风雪巫术反噬溃败），山地游牧草场无城郭（非无人迹荒漠，属扎答兰等部牧场），常住<1万，定城寨。' },

    { id: 'city_sangguer', name: '温都尔汗', factionId: 'zhuerqi', lat: 47.262466, lng: 110.717468, type: 'stockade', region: 'STEPPE',
buildingStyle: 'MONGOL', troops: 10000,
        note: '[12世纪蒙古乞颜长支主儿乞部撒察别乞驻牧克鲁伦河中游温都尔汗·河岸草甸车臣汗部王帐营地] 成吉思汗平主儿乞部之地及17世纪喀尔喀东路车臣汗硕垒家族河谷驻帐地（《元朝秘史》《蒙古游牧记》），草原无城墙游牧营聚且常住<1万，定城寨。',
    },
    { id: 'city_bayantumen', name: '巴彦图门', factionId: 'kaerka', lat: 48.053, lng: 114.538, type: 'stockade', region: 'STEPPE_IMPERIAL',
buildingStyle: 'MONGOL', troops: 10000,
        note: '[17世纪喀尔喀东路车臣汗硕垒（摩诃萨嘛谛）汗庭巴彦图门·克鲁伦河下游库伦寺帐聚落] 1650年代硕垒车臣汗于克鲁伦河岸建东库伦僧帐与汗庭（今东方省乔巴山前身，《蒙古源流》），≤1700年全为毡帐木经堂无砖石城垣且常住仅两三千人，定城寨。',
    },
    { id: 'city_huzhan', name: '忽毡', factionId: 'zhaowu', lat: 40.248096, lng: 69.658813, type: 'small_city', troops: 10000, region: 'WESTERN_CASTLE', buildingStyle: 'CENTRAL_ASIA' , note: '[前4世纪极北亚历山大城至唐俱战提萨曼花剌子模期·锡尔河南岸砖石内堡商城苦盏] 扼费尔干纳谷地西口，10世纪伊本·豪卡勒记其内堡、主城与拉巴特商区繁盛，1220年帖木儿·灭里率军民拒蒙古围攻（志费尼《世界征服者史》），中世纪盛期城居约1.5–2.5万，>1万定小城。' },

    { id: 'city_aoshen', name: '奥什', factionId: 'kala', lat: 40.53, lng: 72.79, type: 'small_city', troops: 10000, region: 'WESTERN_FEUDAL', buildingStyle: 'WESTERN' , note: '[大宛东门重邑至10至12世纪喀喇汗国费尔干纳东南名都奥什·苏莱曼圣山脚三门泥砖石基城垣] 10世纪阿拉伯地理学家伊斯塔赫里与穆卡达西《地理志》记奥什为费尔干纳第三大繁盛设防城市、设三座城门与边防圣战军营，巴布尔《回忆录》极赞其富庶，盛期城居约1.5–2.5万，>1万定小城。' },




    { id: 'city_dawushenkate', name: '大乌什', factionId: 'wensu', lat: 41.13, lng: 82.78, type: 'stockade', region: 'WESTERN', buildingStyle: 'WESTERN', troops: 10000, note: '[两汉塔里木西北道温宿国王治温宿城（今乌什大乌什；清筑永宁城在1758年后超限）·托什干河绿洲夯土小城] 《汉书·西域传》明载温宿国全境总人口仅「户二千二百，口八千四百」，举国尚不满九千人，王城为夯土小邑且城居仅两三千人，定城寨。' },
    { id: 'city_kungang', name: '昆岗', factionId: 'manzhou_d', lat: 40.54, lng: 81.26, type: 'stockade', region: 'WESTERN_IMPERIAL', buildingStyle: 'WESTERN', troops: 10000, note: '[1700年前龟兹西境丝路北道·戈壁绿洲驿路小聚落] 清乾隆平定回部后始设阿克苏道昆岗军台（晚于1700年红线不采）；≤1700年仅为拜城至阿克苏间小绿洲歇马聚落，名字不带关隘堡戍且无石砖夯土关墙，人口<1万，定城寨。' },
    { id: 'city_mazhatage', name: '麻扎塔格', factionId: 'yuchi', lat: 38.58, lng: 80.8, type: 'stockade', troops: 10000, region: 'WESTERN_FEUDAL', buildingStyle: 'WESTERN', note: '[8世纪末吐蕃攻占于阗北屏麻扎塔格红白山戍堡·和田河横穿塔克拉玛干沙漠红白断崖土石古戍] 斯坦因发掘出土大批古藏文与汉文简纸文书之唐蕃麻扎塔格小戍堡（面积仅数十米见方生土石块小垒，非守正式大道咽喉名关亦无居民城，9世纪后沙埋废弃），戍卒仅数十人，定城寨。' },

    { id: 'city_yutian2', name: '于阗', factionId: 'yuchi', lat: 37.1000, lng: 79.9200, type: 'small_city', region: 'WESTERN_FEUDAL',
buildingStyle: 'WESTERN', troops: 10000,
        note: '[两汉西域南道大国于阗王都西城至唐毗沙都督府尉迟王族千年玉都·玉龙喀什河买力克阿瓦提夯土都城] 《汉书·西域传》于阗户三千三百，至东汉永建年间《后汉书·西域传》猛增至「领户三万二千，口八万三千，胜兵三万余人」，玄奘《大唐西域记》卷十二记王城繁华，东汉至五代宋初尉迟于阗国都城居达2–3万，>1万定小城。',
    },
    { id: 'city_yumi', name: '阿赫雅尔', factionId: 'yumi', lat: 36.85, lng: 81.65, type: 'stockade', region: 'WESTERN', buildingStyle: 'WESTERN', troops: 10000, note: '[两汉塔里木南道扜弥国都·克里雅河绿洲夯土小城] 《汉书·西域传》载扜弥国全境户三千三百四十、口二万四百散居沙漠绿洲，都城扜弥城（喀拉墩一带夯土木骨泥墙遗址）城居约4000–6000人<1万，魏晋后沙埋，定城寨。' },
    { id: 'city_keliyashankou', name: '阿什库尔', factionId: 'yuchi', lat: 35.45, lng: 81.1, type: 'stockade', region: 'WESTERN', buildingStyle: 'WESTERN', troops: 10000, note: '[汉唐于阗国南屏昆仑山普鲁阿什库尔火山口硫磺矿与牧口·克里雅河源高寒山地哨聚] 控于阗南山防吐蕃通道之克里雅谷口火山湖高地（《新唐书·西域传》），名字不带关隘堡戍且无石砖夯土正式关城，高寒山地牧矿小聚不足千人，定城寨。' },
    { id: 'city_longmucuo', name: '龙木错', factionId: 'xiangxiong', lat: 34.572168, lng: 80.348511, type: 'stockade', region: 'TIBET', buildingStyle: 'TIBET', troops: 10000, note: '[7至8世纪吐蕃赤松德赞经略羊同与通西域南山捷径龙木错·阿克赛钦海拔5000米高原咸湖营站] 昆仑山南麓阿里西北部高寒湖盆牧猎歇马站（《敦煌本吐蕃历史文书》），无城墙且高寒湖滨季节性牧人不足百户，定城寨。' },
    { id: 'city_gadake', name: '噶大克', factionId: 'tubo', lat: 31.940459, lng: 80.139771, type: 'stockade', troops: 10000, region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', note: '[17世纪末拉达克战争后甘丹颇章设阿里东路行政夏市噶大克（噶尔雅沙）·森格藏布河谷帐篷互市营地] 1684年《廷姆冈条约》后定为藏印什布奇羊毛贸易夏秋集市与阿里噶本夏驻地，西方探险志与《卫藏通志》明载噶大克冬季仅十余间土石官房与百余人（夏季搭帐交易亦仅数千人）且无城墙，定城寨。' },


    { id: 'city_payangyi', name: '帕羊驿', factionId: 'supi', lat: 30.140235, lng: 83.281860, type: 'stockade', region: 'TIBET',
buildingStyle: 'TIBET', troops: 10000,
        note: '[吐蕃征象雄羊同南道至甘丹颇章拉萨通阿里大驿道帕羊驿·马泉河宽谷高寒草甸换乌拉差马站] 海拔4600米仲巴帕羊沙丘水草盆地官道驿站（《卫藏图识》），仅设土石驿房与牧帐无城垣且常住牧户不足千人，定城寨。',
    },
    { id: 'city_saga', name: '萨噶', factionId: 'tubo', lat: 29.33, lng: 85.23, type: 'stockade', region: 'YARLUNG', buildingStyle: 'TIBET', troops: 10000, note: '[吐蕃经略象雄发羌要冲至甘丹颇章设萨噶宗·雅鲁藏布上游达吉岭河口土石小宗署聚落] 扼日喀则西赴阿里与南下吉隆尼泊尔分水口之萨噶（《卫藏通志》），非守险砌墙关门且高寒河谷全宗散户仅一二千人，定城寨。' },

    { id: 'city_sajia', name: '萨迦', factionId: 'khon', lat: 29.101759, lng: 87.665405, type: 'stockade', troops: 10000,
        
        note: '[1073年昆·贡却杰布建北寺、1268年八思巴建萨迦南寺统领乌思藏十三万户首府·仲曲河畔夯土石砌方院大寺城] 元代帝师八思巴与萨迦本钦施政全藏之政教中心萨迦寺，虽南寺筑有方形寺院厚重土石高垣，但该垣系寺院围墙而非万人坊市城郭，元明盛期常住寺僧与溪卡属民约5000–7000人<1万（《萨迦世系史》），定城寨。', region: 'TIBET_CASTLE',
        buildingStyle: 'TIBET' },
    { id: 'city_sangzhuzi', name: '桑珠孜', factionId: 'tsangpa', lat: 29.303155, lng: 88.862915, type: 'small_city', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[14世纪帕竹大司徒绛曲坚赞设最后溪卡至16至17世纪初藏巴汗王朝首都·年楚河口石砌桑珠孜宗堡与日喀则城区] 1565–1642年辛厦巴·才丹多吉开创藏巴汗政权统辖卫藏定都桑珠孜，山巅筑高耸花岗片石白红宫堡，连结山麓扎什伦布寺（逾三千僧侣）及八廓商市，后藏首邑常住达1.5–2.5万，>1万定小城。',
    },

    { id: 'city_jiamachikang', name: '甲玛赤康', factionId: 'tubo', lat: 29.74, lng: 91.7, type: 'stockade', troops: 10000, region: 'TIBET', buildingStyle: 'TIBET', note: '[6世纪末吐蕃赞普囊日论赞驻地与松赞干布诞生地甲玛赤康（强巴敏久林宫）·墨竹工卡甲玛沟夯土片石王庄] 吐蕃王朝龙兴之地甲玛沟（《西藏王统记》《贤者喜宴》），松赞干布迁都逻些后退为王室贵族庄园溪卡，无城市城垣且山沟常住农牧民仅两三千人，定城寨。' },

    { id: 'city_juemuzong', name: '觉木宗', factionId: 'lang_clan', lat: 29.571086, lng: 94.476929, type: 'stockade', region: 'TIBET_CASTLE',
buildingStyle: 'TIBET', troops: 10000,
        note: '[14世纪帕竹政权设波密南境觉木宗（扎木）·帕隆藏布江河谷密林石木宗寨聚落] 地处藏东南暖湿森林峡谷、波密土王外围据点觉木宗（《卫藏通志》），木瓦石基山寨无环城石墙且常住不足2000人，定城寨。',
    },
    { id: 'city_galangzong', name: '噶朗宗', factionId: 'galangdiba', lat: 29.86, lng: 95.77, type: 'stockade', region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', troops: 10000, note: '[吐蕃止贡赞普后裔世袭波密土王（甘朗王）王宫噶朗央宗·波密噶朗湖畔雪山林谷木石王寨] 自成一统不服噶厦差税之波密噶朗土王驻地（《西藏图考》），以巨木片石构筑王邸官寨而无城市城垣，谷地常住部民仅两三千人，定城寨。' },
    { id: 'city_mangkangzong', name: '芒康宗', factionId: 'fuguo', lat: 29.67, lng: 98.59, type: 'pass', region: 'TIBET',
buildingStyle: 'TIBET', troops: 10000,
        note: '[吐蕃至甘丹颇章时期·澜沧江金沙江分水岭片石宗堡] 扼川滇入藏茶马南道门户之芒康山顶片石砌筑宗堡戍防（《卫藏通志》《清实录》），控险守道且具石砌堡墙，山下散户不足3000未成万人居民城，定险要。',
    },
    { id: 'city_adunzi', name: '阿墩子', factionId: 'bailang', lat: 28.48, lng: 98.85, type: 'stockade', region: 'TIBET',
buildingStyle: 'TIBET', troops: 10000,
        note: '[东汉白狼王唐菆归汉故地至明清滇藏茶马咽喉阿墩子（德钦）·白马雪山梅里雪山夹峙高寒一街商集] 《后汉书·西南夷传》永平中白狼王献《白狼歌》故地，明丽江木氏北拓设哨，清初为澜沧江梅里峡谷茶马换驮狭长山街（无城墙），≤1700年常住藏纳商户不足2000人，定城寨。',
    },
    { id: 'city_dayan', name: '大研', factionId: 'ming_d', lat: 26.87, lng: 100.22, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[元至元置丽江路至明代木氏纳西土司世袭府治大研镇·玉龙雪山南麓黑龙潭水网无墙瓦屋古镇] 明洪武赐阿甲阿得木姓世袭丽江土知府，崇祯十二年徐霞客亲访《滇游日记》明载木氏忌「木加框成困」故绝不筑城墙，虽木府宏丽瓦屋栉比，因无石砖环城墙且≤1700年镇居约6000–9000人未满1万整，定城寨。' },

    { id: 'city_tengyuecheng', name: '腾越城', factionId: 'ming_d', lat: 25.02, lng: 98.48, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[明正统至嘉靖滇西极边第一城腾越州·火山玄武岩巨石包砌方城] 正统十年王骥麓川之役后筑腾冲军民指挥使司石城，弘治嘉靖采火山巨石砌筑城垣周七里余高二丈五尺（《明史·地理志》《腾越州志》），州卫同城军民商贾约1.2–1.8万且具巨石城墙，定小城。' },



    { id: 'city_mengmao', name: '勐卯', factionId: 'luchuan', lat: 24.01, lng: 97.85, type: 'stockade', region: 'BASHU',
buildingStyle: 'BURMESE', troops: 10000,
        note: '[元麓川路至明洪武永乐思伦发思任发麓川平缅宣慰司王都勐卯·瑞丽江坝子夯土砖包广贺罕木栅都寨] 明初西南最大傣族土司王国麓川首府（瑞丽勐卯古城遗址周长约4公里纯红土夯筑土垣上立竹木排栅，《明史·云南土司传》钱古训《百夷传》记其无砖石高城），正统三征麓川夷毁后沦为小司寨<1万，定城寨。',
    },
    { id: 'city_xiwanjin', name: '悉万斤', factionId: 'yada', lat: 36.66, lng: 65.75, type: 'stockade', troops: 10000, region: 'CENTRAL_ASIA', buildingStyle: 'CENTRAL_ASIA', note: '[5至6世纪嚈哒与西突厥辖下吐火罗北岸铁门南麓石汗那首邑悉万斤（恰希安）·苏尔汉河谷生土泥砖小城] 北魏宋云与唐玄奘《大唐西域记》卷一赤鄂衍那国（城周十余里，生土泥砖垣，区别于粟特康国都飒秣建），中世纪查加尼扬河谷泥砖小邑查无破万城居确数，定城寨。' },


    { id: 'city_hunduduo', name: '昏度多', factionId: 'qiepantuo', lat: 37.022272, lng: 72.627869, type: 'stockade', region: 'TIBET',
buildingStyle: 'WESTERN', troops: 10000,
        note: '[北魏宋云惠生西行至唐高仙芝行军所经瓦罕走廊南道要邑昏驮多城·帕米尔兴都库什北麓片石山村] 玄奘《大唐西域记》卷十二明载达摩悉铁帝国国都昏驮多城「城中寒风凄劲，少谷豆多麦脉冲」，高仙芝天宝六载会师处（《新唐书·高仙芝传》），高寒峡谷小邑常住不足3000人，定城寨。',
    },
    { id: 'city_puticheng', name: '菩提营', factionId: 'xiaobolu', lat: 35.3, lng: 75.64, type: 'stockade', troops: 10000, region: 'TIBET', buildingStyle: 'TIBET', note: '[唐开元天宝大勃律国（巴尔蒂斯坦小西藏）至16世纪马卡本王朝斯卡杜·印度河上游花岗岩崖堡与河谷绿洲聚落] 天宝十二载（753）封常清率军破大勃律至菩萨劳城（《旧唐书·封常清传》），16世纪阿里谢尔汗筑卡尔波切岩顶小堡而河谷村落无外郭石墙，严寒山谷常住不足6000人，定城寨。' },

    { id: 'city_kajier', name: '喀吉尔', factionId: 'tang', lat: 34.55, lng: 76.13, type: 'stockade', region: 'TIBET', buildingStyle: 'TIBET', troops: 10000, note: '[吐蕃至拉达克巴尔蒂斯坦交界苏鲁河谷要冲喀吉尔（卡吉尔）·西喜马拉雅高寒河谷石木小寨聚] 连接克什米尔佐吉拉山口与拉达克列城、巴尔蒂斯坦三岔河谷聚落（Francke《西藏西部史》），散落梯田石木平顶村屋无城墙且常住仅二三千人，定城寨。' },
    { id: 'city_zhaburang2', name: '札布让', factionId: 'tubo', lat: 31.496599, lng: 79.799194, type: 'stockade', region: 'TIBET',
buildingStyle: 'TIBET', troops: 10000,
        note: '[10至17世纪阿里古格王国后期王都札布让·象泉河南岸300米黄土土林山崖洞窟夯土宫庙城] 吐蕃王裔吉德尼玛衮曾孙开创古格王朝，1630年拉达克僧格朗杰围破札布让后彻底荒废（《阿里王统记》、耶稣会士安德拉德1624年亲驻札布让书信记王城连僧兵仅数千人），土林夯土崖寨不足5000人，定城寨。',
    },
    { id: 'city_jiangzi', name: '江孜', factionId: 'lang_clan', lat: 28.92, lng: 89.59, type: 'stockade', troops: 10000, region: 'TIBET_CASTLE', buildingStyle: 'TIBET' , note: '[14世纪末帕竹司徒热丹衮桑帕扩建江孜宗山城堡与白居寺·年楚河中游红山片石宗堡与十万佛塔镇] 1418年建白居寺筑夯土片石寺院围墙、山顶立江孜宗堡控亚东至日喀则拉萨通途（《江孜法王传》），寺院围垣与山顶宗署外市集无环城石墙且常住僧俗约5000–7000人<1万，定城寨。' },

    { id: 'city_linqiong', name: '临邛', factionId: 'han_d', lat: 30.4149, lng: 103.4619, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[战国秦置蜀郡临邛铁官盐井巨邑至汉卓王孙司马相如名城、唐宋邛州·南河北岸条石包砖州城] 《史记·货殖列传》详载秦迁赵卓氏、程郑于临邛即铁山鼓铸，「富至僮千人，田池射猎之乐拟于人君」，唐宋邛州领六县户逾七万，明成化筑条石包砖州城（《邛州直隶州志》），汉宋盛期城居达2–3.5万，>1万定小城。' },



    { id: 'city_yandao', name: '严道', factionId: 'chenghan', lat: 30.000133, lng: 102.972107, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[战国秦置蜀郡严道县（汉文帝流放邓通铸钱地）至唐荣经县·大相岭北麓荥经河谷夯土山麓小县] 扼成都西南翻大相岭通黎雅孔道（非关隘本身，关在南境清溪关，《史记·佞幸列传》《华阳国志》），汉唐宋明正德前皆为夯土卵石矮垣小县，在城民户不足5000人，定城寨。' },

    { id: 'city_qingxiguan', name: '清溪关', factionId: 'tang', lat: 29.3667, lng: 102.6333, type: 'pass', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000, tier: 2,
        note: '[隋唐清溪镇关至宋明·大相岭旄牛道条石关城] 唐置清溪关扼雅州翻大相岭南通建昌、南诏孔道，大和三年高骈、韦皋经略西山南诏皆以此为锁钥（《新唐书·地理志》《元和郡县图志》），带「关」字且具石砌关墙，未成万人城，定险要。',
    },
    { id: 'city_yuegui', name: '越嶲', factionId: 'shu', lat: 28.422864, lng: 102.680969, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[蜀汉延熙三年张嶷平定越嶲郡蛮夷复通旧道（今越西县，北距邛都西昌百余里）·越西河谷夯土边邑] 《三国志·张嶷传》详载越嶲太守张嶷讨平苏祈邑冬逢、定莋率豪狼岑并缮筑郡邑夯土颓垣（明洪武置越嶲卫于今越西），山谷高寒卫县在城常住约4000–7000人（且蜀汉主阶段为夯土墙<1万），定城寨。' },

    { id: 'city_huichuan', name: '会川', factionId: 'nanzhao', lat: 26.6545, lng: 102.2454, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[汉会无县、唐南诏会川都督府至元会川路明洪武会川卫（会理）·金沙江北岸川滇古渡夯土铜矿卫邑] 南诏六节度两都督之一会川都督驻地控金沙江泸水渡口（樊绰《蛮书》卷六），明洪武二十七年筑会川卫土城（正德后始局部包砖周仅五里，《会理州志》），南诏至明中叶城居约5000–8000人<1万，定城寨。' },


    { id: 'city_chenzhou2', name: '沅陵', factionId: 'tang', lat: 28.227028, lng: 110.291748, type: 'small_city', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', troops: 10000,
        note: '[秦黔中郡、两汉武陵五溪门户沅陵至唐宋辰州卢溪郡明辰州府·沅水酉水汇口条石包砖府卫双城] 马援征五溪蛮驻师重镇，明洪武初周德兴筑辰州卫与辰州府条石包砖高城控扼湘西入黔水道（《后汉书·马援传》《辰州府志》），水陆军商聚居约2–3万，>1万定小城。',
    },
    { id: 'city_yuanzhou', name: '芷江', factionId: 'manzhou_d', lat: 27.566688, lng: 109.909973, type: 'small_city', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', troops: 10000,
        note: '[唐巫州叙州、北宋熙宁置沅州卢阳郡至明万历偏沅巡抚驻节沅州卫城（芷江）·潕水东岸条石包砖周七里重镇] 滇黔官马大道入湘首驿，明洪武置沅州卫筑条石包砖城垣，万历二十七年平播之役特设偏沅巡抚常驻沅州节制湘黔军务（《明史·职官志》《芷江县志》），抚标卫军与商民达1.5–2.5万，>1万定小城。',
    },
    { id: 'city_puding', name: '普定', factionId: 'yelang', lat: 26.25, lng: 105.93, type: 'stockade', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[战国夜郎旁邑、元至元置普定路习安州至明洪武置普定府卫（安顺前身）·黔中喀斯特坝子卫所屯堡邑] 洪武十四年傅友德克普定筑卫城，本据点代表夜郎与元代罗甸普定土司部族阶段（明安顺石城属后期改建，且≤1700年屯堡军户散居九溪十八寨、卫城内仅约5000–8000人<1万，《元史·地理志》），定城寨。',
    },
    { id: 'city_shengjingguan', name: '胜境关', factionId: 'tang', lat: 25.651438, lng: 104.350891, type: 'pass', region: 'NANZHAO',
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 BASHU：胜境关（云南富源）：滇黔锁钥，南诏/大理故地
buildingStyle: 'BASHU', troops: 10000,
        note: '[明洪武至清初·滇黔交界老鸦关山脊条石关城] 洪武二十四年置平夷卫筑条石关城于滇黔分水岭，为中原入滇第一雄关（《明史·地理志》《滇系》），带「关」字且具完整石墙，纯驿道关塞未成万人城，定险要。',
    },
    { id: 'city_weixian2', name: '曲靖', factionId: 'cuanshi', lat: 25.49, lng: 103.79, type: 'small_city', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[蜀汉建宁郡味县、两晋南北朝爨氏大姓世领南中四百年治城至大理石城郡明曲靖军民府·南盘江包砖府卫城] 诸葛亮南征班师留李恢镇建宁郡味县（《三国志·李恢传》，出土《爨宝子碑》《爨龙颜碑》），元置曲靖宣抚司、明洪武二十年筑条石包砖曲靖卫府大城控入滇东大门，城居约2–3万，>1万定小城。',
    },
    { id: 'city_weichu', name: '威楚', factionId: 'dali', lat: 25.045791, lng: 101.574097, type: 'small_city', region: 'DALI', buildingStyle: 'BASHU', troops: 10000, note: '[唐南诏银生北屏威楚城、大理国威楚府（高氏封地）至明洪武楚雄府卫城·龙川江畔条石包砖周七里府城] 大理国相高升泰家族重镇威楚府，明洪武十六年袁义改筑条石包砖六门楚雄府卫同城扼大理至昆明驿道中枢（《元史·地理志》《楚雄府志》），滇西咽喉城居约1.5–2.5万，>1万定小城。' },
    { id: 'city_tuodongcheng', name: '滇池', factionId: 'dianguo', lat: 25.05, lng: 102.7, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[战国汉滇王都、唐南诏副都拓东城（鄯阐府）至元赛典赤云南行省中庆路明云南府·盘龙江包砖龟城省会] 凤伽异筑南诏东都拓东城，元为云南行省省会（马可·波罗记押赤大城），明洪武十五年沐英改筑周九里三百步六门青砖条石云南府省城（《蛮书》《云南通志》），明万历省垣关厢达4–6万，>1万定小城。' },


    { id: 'city_luoxiong', name: '罗雄', factionId: 'cuanshi', lat: 24.769307, lng: 104.224548, type: 'stockade', region: 'BASHU',
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 BASHU：罗雄（云南罗平）：南诏/大理故地
buildingStyle: 'BASHU', troops: 10000,
        note: '[三国蜀汉兴古郡境、元至元十三年置曲靖路罗雄州（爨氏罗雄部）·滇东多依河坝子夯土土司小州] 元阿资、明万历十六年土知州者继荣叛乱改土归流改名罗平州（《元史·地理志》《明史·云南土司传》），元明土司时期为夯土木栅州寨且常住不足5000人，定城寨。',
    },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 BASHU：宛温（云南）：汉宛温县，南中之地
    { id: 'city_wanwen', name: '宛温', factionId: 'shu', lat: 25.09, lng: 104.89, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[西汉元鼎六年置牂牁郡宛温县、蜀汉兴古郡治宛温·南盘江北岸黔西南喀斯特山间夯土小郡县] 《汉书·地理志》《晋书·地理志》兴古郡领宛温等十一县全郡合计仅户4,860，平均每县含山野夷寨仅四百余户，宛温夯土小城常住不足2000人，定城寨。' },

    { id: 'city_cangwu', name: '苍梧', factionId: 'han_d', lat: 23.47, lng: 111.31, type: 'small_city', region: 'JIANGNAN',
// 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：苍梧（广西梧州）：苍梧郡治，汉地
buildingStyle: 'JIANGNAN', troops: 10000,
        note: '[西汉元鼎交州刺史部首治苍梧郡广信至明嘉靖前两广总督军门驻节梧州府·桂江浔江汇口条石包砖总督城] 汉代岭南文化首府广信，明成化元年轻骑韩雍开府梧州设立两广总督军门、总镇府与梧州盐榷大关逾百年，包砖条石城垣内外军民商舶达2–3.5万（《苍梧总督军门志》《梧州府志》），>1万定小城。',
    },
    {
        id: 'city_panyu',
        name: '番禺',
        factionId: 'nanhan',
        lat: 23.120000,
        lng: 113.260000,
        type: 'medium_city',
        isPort: true,
        troops: 10000,
        tier: 1,
        region: 'JIANGNAN',
        // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：番禺（广东广州）：南越国都、南海郡治，汉地城郭
        buildingStyle: 'JIANGNAN',
        note: '[唐宋广州三城至明末广州府·红砂岩包砖内外新城] 宋筑子城东西两翼城至明嘉靖增筑外城，广州城垣内（南海、番禺两附郭县坊厢）及河南、西关商厢≤1700年峰值约20–30万（《万历广东通志》及Chandler 1600年表20万；乾隆40万超年不取），>10万定中城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：龙川（广东）：秦置龙川县，赵佗任所
    { id: 'city_longchuan', name: '龙川', factionId: 'nanyue', lat: 24.1, lng: 115.26, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[秦始皇三十三年赵佗任龙川令筑佗城至五代南汉祯州宋循州治龙川·东江上游明洪武包砖石基千户所县城] 岭南最早古邑赵佗兴王根本龙川佗城（《史记·南越列传》），北宋为循州海丰郡治（苏辙谪居处），明洪武二十一年置龙川守御千户所筑周四里包砖条石城墙（现存越王井与明砖城门），宋州治逾万且明具砖石墙，定小城。' },

    { id: 'city_kuaiji', name: '会稽', factionId: 'yue', lat: 29.987000, lng: 120.582000, type: 'medium_city', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[春秋越都至南宋绍兴府明代水城·条石包砖罗城] 南宋陪都格绍兴府（山阴、会稽两附郭县在城厢）至明万历间，周二十余里石砖城垣与关厢城居峰值约10–15万（《嘉泰会稽志》户籍及曹树基《中国人口史》折算），>10万定中城。' },
    { id: 'city_luling', name: '庐陵', factionId: 'song', lat: 27.1133, lng: 114.9806, type: 'small_city', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[东汉末孙策破庐陵郡至唐吉州、两宋文风鼎盛欧阳修文天祥故里吉州庐陵及明吉安府·赣江西岸包砖九门大城] 两宋江南大郡（《宋史·地理志》吉州崇宁户335,710居江西之冠），白鹭洲书院与螺川商埠云集，明洪武包砖修筑周九里吉安府城及南关厢，城关常住人口达4–6万，>1万定小城。' },
    { id: 'city_hongzhou', name: '豫章', factionId: 'tang', lat: 28.68, lng: 115.88, type: 'medium_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[唐洪州江南西道治至明南昌府·包砖石基章江大城] 南宋隆兴府至明万历江西布政使司南昌府（南昌、新建两附郭县在城坊厢及章江门外关厢），城居峰值约10–15万（《万历南昌府志》及曹树基《中国人口史·明时期》考算），>10万定中城。' },


    { id: 'city_qingliuguan', name: '清流关', factionId: 'nantang', lat: 32.280000, lng: 118.250000, type: 'pass', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', troops: 10000, mirror: true,
        note: '[五代后周伐南唐至宋明·滁州琅琊山古道块石关城] 显德三年（956）赵匡胤倍道夜袭清流关生擒南唐大将皇甫晖、姚凤（《旧五代史·世宗纪》《资治通鉴》），带「关」字且现存块石关洞关墙，未成万人城，定险要。',
    },
    { id: 'city_zhongli', name: '盱眙', factionId: 'ming_d', lat: 33.011000, lng: 118.497000, type: 'small_city', region: 'SONG', buildingStyle: 'CENTRAL', troops: 10000, note: '[秦末楚义帝都盱眙、南朝北魏南北对峙重镇至南宋第一线边防盱眙军明祖陵包砖石城·淮河入洪泽湖山城] 绍兴十二年宋金划淮为界升盱眙军为榷场互市与水陆防线总前哨（毕再遇守城破金，《宋史·地理志》《毕再遇传》），明初因明祖陵所在依山筑石砖城垣，宋榷场军城及明代常住约1.5–2.5万，>1万定小城。' },
    { id: 'city_bianliang', name: '开封', factionId: 'song', lat: 34.8, lng: 114.31, type: 'big_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[北宋崇宁大观盛期·夯土包砖三重都城] 北宋东京开封内外城及新宋门等关厢厢坊常住军民峰值约100–130万（《宋史·地理志》崇宁开封府户261,117、孟元老《东京梦华录》及久保田和男考算），>50万定大城。' },

    { id: 'city_shangluo', name: '商邑', factionId: 'qin', lat: 33.87, lng: 109.94, type: 'stockade', region: 'CENTRAL', buildingStyle: 'CENTRAL', troops: 10000, note: '[战国秦孝公封商鞅商邑·丹江上游山地夯土封邑小城] 秦封卫鞅于商十五邑号商君（《史记·商君列传》及丹凤商邑夯土遗址），秦汉商县及唐商州（全州六县仅八千余户）在城人口不足1万且秦代为夯土墙，定城寨。' },
    { id: 'city_shicheng', name: '郊郢', factionId: 'chuguo', lat: 31.16, lng: 112.58, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[战国楚别都郊郢、三国文聘守石城至唐宋郢州及明嘉靖帝潜邸升承天府·汉水东岸条石巨砖周十余里陪都级大城] 羊祜镇荆州重塞石城，明嘉靖十年因兴献王显陵所在自安陆州特升承天府，比照都城规制大修青砖条石重城与钟祥附郭县（《三国志·文聘传》《明史·地理志》），明中后期城关军民达3–5万，>1万定小城。' },

    { id: 'city_baling', name: '巴陵', factionId: 'sunwu_d', lat: 29.35, lng: 113.13, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[三国鲁肃屯巴丘筑城、晋巴陵郡至唐宋岳州巴陵郡明岳州府·洞庭湖入长江口红砂条石包砖岳阳楼江防城] 控扼荆江与洞庭咽喉，鲁肃修巴丘邸阁，宋滕子京重修城楼、明洪武扩筑周七里红砂条石包砖岳州府城设荆岳水军卫所（《三国志·鲁肃传》《岳州府志》），城关水埠人口达2.5–3.5万，>1万定小城。' },




    { id: 'city_linzheng', name: '临烝', factionId: 'tang', lat: 26.89, lng: 112.6, type: 'small_city', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[三国吴亮置衡阳郡临烝至唐衡州湖南观察使、宋明衡州府（吴三桂称帝处）·湘江烝水耒水三江汇口条石包砖七门城] 南岳门户湘南第一大都会，宋元明为湘粤桂盐粮转运中枢，明洪武包砖条石修筑周七里余衡州府城（《元和郡县图志》《万历衡州府志》），在城衡阳、清泉坊厢及江东岸关厢达3.5–5万，>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：桂阳（湖南郴州）：桂阳郡治，汉地
    { id: 'city_guiyang', name: '桂阳', factionId: 'shu', lat: 25.78, lng: 113, type: 'small_city', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[西汉高祖置桂阳郡治郴县、蜀汉赵云取桂阳至唐宋郴州明郴州直隶州·骑田岭北麓条石包砖银铅矿冶商州] 扼湘粤摺岭骑田古道咽喉（《汉书·地理志》《三国志·先主传》），唐宋置桂阳监铸钱采银，明洪武元年包砖条石修筑郴州城及水陆骡马转运坊厢（《万历郴州志》），城关人口约1.5–2.5万，>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「VIETNAMESE」推出的二级与史实不符 → 归 CENTRAL：韶关（广东曲江）：汉地关城
    { id: 'city_qujiang', name: '韶关', factionId: 'tang', lat: 24.8, lng: 113.59, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[东汉始兴郡曲江、唐张九龄故里韶州至宋明韶州府（明设太平桥税关俗称韶关）·武江浈江合流条石包砖九里三城] 控梅关古道南下广州总门户（实为州府居民大城而非山隘单关），宋筑子城与河北水城、明洪武包砖修筑韶州府城并设太平榷关（《新唐书·地理志》《韶州府志》），榷关商旅与在城人口达2.5–4万，>1万定小城。' },
    { id: 'city_bodao', name: '珙县', factionId: 'ming_d', lat: 28.76, lng: 104.62, type: 'stockade', region: 'BASHU', buildingStyle: 'BASHU', troops: 10000, note: '[汉南广、唐宋羁縻巩州僰人聚居地至明万历元年都掌蛮（僰人）阿大九丝山之役珙县·川南悬棺山地岩寨] 万历元年四川巡抚曾省吾、总兵刘显攻破珙县九丝山凌霄城阿大等僰人山顶木石险寨（《明史·刘显传》《蜀中广记》），系川南山地部族寨聚且珙县小邑无砖石大垣、常住不足4000人，定城寨。' },
    { id: 'city_nanpu', name: '南浦', factionId: 'song', lat: 30.82, lng: 108.38, type: 'small_city', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[汉朐忍、蜀汉南浦至唐宋万州南浦郡及明万县卫所·长江川东入峡水驿条石依山城垣] 南宋末上官夔筑天生城配合万州江城拒元兵，明洪武七年采青石条砌万县城垣控川东入夔门水运（《宋史·忠义传》《万县志》），江防县城及西山商埠逾1–1.5万且具完整条石城墙，定小城。',
    },
    { id: 'city_baidicheng2', name: '白帝城', factionId: 'chengjia', lat: 31.0430, lng: 109.5700, type: 'pass', region: 'BASHU', buildingStyle: 'BASHU', troops: 10000, note: '[新莽公孙述至蜀汉南宋·长江夔门绝壁条石山城要塞] 公孙述筑白帝城扼三峡瞿塘峡西口，章武二年刘备夷陵退保永安、南宋筑白帝抗蒙石城（《三国志·先主传》《水经注·江水》），具条石城墙控扼江峡且常住<1万，定险要。' },
    { id: 'city_qichun', name: '蕲春', factionId: 'xushouhui', lat: 30.23, lng: 115.45, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[西汉蕲春县、吴蕲春郡至唐宋淮西名藩蕲州及明荆王藩封蕲州城·长江北岸麒麟山条石包砖周九里王府大城] 南宋嘉定十四年知州李诚之率蕲州军民数万死守砖石州城抗金兵壮烈殉城（《宋史·李诚之传》），元末徐寿辉天完称帝、明正统荆宪王朱瞻堈迁封蕲州（李时珍故里，《蕲州志》），城居达2.5–3.5万，>1万定小城。' },

    { id: 'city_wancheng', name: '皖口', factionId: 'song', lat: 30.51, lng: 117.04, type: 'small_city', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', troops: 10000,
        note: '[南宋黄干筑安庆府城至元余阙守城明安庆府卫·长江北岸条石包砖周九里十三步省会级坚城] 嘉定十年（1217）知安庆府黄干包砌砖石城墙备金，至正间余阙死守六年，明洪武置安庆卫、崇祯设安庆巡抚（《宋史·黄干传》《明史·地理志》《怀宁县志》），在城及江岸关厢常住达3–5万且具砖石墙，定小城。',
    },

    { id: 'city_jiuzi', name: '姑孰', factionId: 'dongjin', lat: 31.55, lng: 118.47, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[东晋桓温王敦镇姑孰、南朝畿辅重镇至北宋太平州明直隶太平府·姑溪河入江口条石包砖周十二里铁壁陪辅城] 建康西屏门户姑孰，南唐筑新城的当涂，朱元璋渡江首克太平改太平府并筑高固条石包砖城垣拱卫南京（《晋书·桓温传》《明太祖实录》《太平府志》），府城及采石芜湖水道商厢达3–4.5万，>1万定小城。' },



    { id: 'city_datong2', name: '大通', factionId: 'ming_d', lat: 30.8188, lng: 117.7762, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[唐大通水驿至宋明沿江商镇·铜陵江岸无城墙开放市镇] 池州与铜陵间长江澜溪口商税水驿大通镇（《明史·地理志》设巡检司与河泊所），明清至1700年始终为无城墙沿江集镇且常住人口约5000–8000人<1万，定城寨。' },


    // ── 2026-05-30 新增：哈拉和林(蒙古帝国首都) ──
    { id: 'city_karakorum', name: '哈拉和林', factionId: 'menggu_d', lat: 47.137441, lng: 103.035278, type: 'medium_city', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[13世纪大蒙古国窝阔台至蒙哥期·夯土城垣与连片斡耳朵] 1235年窝阔台筑哈拉和林万安宫与夯土四门城垣，合城外回回、汉匠及诸王斡耳朵常住连片聚落峰值约8–10万（鲁布鲁克《东行记》及苏联—德国考古队聚落区测算），≥8万容差线，定中城。' },

    { id: 'city_xingzhuting', name: '星主厅', factionId: 'danluo', lat: 33.5131, lng: 126.5215, type: 'stockade', isPort: true, region: 'GORYEO', buildingStyle: 'KOREA', troops: 10000, note: '[耽罗王国星主王子世袭治所至元耽罗总管府（1273年三别抄金通精抗元处）朝鲜济州牧·火山玄武岩海岛小牧城] 高丽元宗十四年忻都洪茶丘渡海破耽罗三别抄抗元木石垒（《高丽史》《元史·耽罗传》），朝鲜济州牧孤悬大海人口稀薄，邑城内官属民户仅约4000–6000人<1万，定城寨。' },
    { id: 'city_deokwon', name: '德源', factionId: 'hui', lat: 39.54, lng: 127.24, type: 'stockade', region: 'GOJOSEON', buildingStyle: 'KOREA', troops: 10000, note: '[汉东沃沮与濊族南闾故地、高丽涌州至朝鲜太宗改德源都护府（元山湾）·东朝鲜海湾土石小邑] 《世宗实录地理志》卷一五五明载咸吉道德源都护府全境城乡合计仅户479、口2,340，举府仅两千三百人且无高大石城，定城寨。' },
    { id: 'city_yuezhi', name: '大木岳', factionId: 'mahan', lat: 36.8353, lng: 127.0417, type: 'stockade', region: 'GOJOSEON',
buildingStyle: 'KOREA', troops: 10000,
        note: '[马韩五十四国目支国辰王治所推定址（忠清南道天安稷山慰礼山城／大木岳）·环壕土垒木栅马韩王邑] 《后汉书·东夷传》《三国志·韩传》载马韩最大邦目支国辰王治月支（高丽初称大木岳郡欢州），早期三韩铁器时代为山丘土垒环壕木栅邑聚，无石砖墙且常住不足8000人，定城寨。',
    },
    { id: 'city_heseluo', name: '何瑟罗', factionId: 'hui', lat: 37.75, lng: 128.89, type: 'stockade', region: 'GOJOSEON', buildingStyle: 'KOREA', troops: 10000, note: '[东汉涉（濊）王不耐侯故邑至新罗何瑟罗州溟州（江陵）·太白山脉东麓海岸土筑小州邑] 正始六年毌丘俭遣王颀受不耐濊侯降（《三国志·东夷传》），新罗置何瑟罗小京旋废为溟州，高丽筑江陵土城（《高丽史·地理志》），东海岸狭长平原邑内常住约4000–6000人<1万，定城寨。' },
    { id: 'city_wushecheng', name: '乌舍寨', factionId: 'wula', lat: 45.821125, lng: 128.161011, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[辽长春州北境至金初肇州泰州边防乌舍寨与明海西乌拉部西界·嫩江洮儿河草原夯土壕墙营寨] 金初防蒙古塔塔儿之西北界壕屯兵土寨群（白城一带金代夯土小边堡遗址，《金史·地理志》），夯土小寨常住不足3000人，定城寨。' },


    { id: 'city_xianping', name: '咸平', factionId: 'liao_d', lat: 42.579367, lng: 124.07959, type: 'small_city', troops: 10000, region: 'STEPPE', buildingStyle: 'NORTHEAST', note: '[辽金咸平路咸平府至明三万卫开原城·辽北包砖十二里马市重镇] 金置咸平路总管府，明洪武二十一年置三万卫、永乐设辽东镇北关马市并包砖修筑周十二里开原大城，卫所军余与互市商民达1.5–2.5万（《金史·地理志》《全辽志》），>1万且具包砖墙，定小城。' },

    { id: 'city_xupin', name: '恤品', factionId: 'dongxia', lat: 42.994587, lng: 129.828186, type: 'stockade', troops: 10000, region: 'JURCHEN', buildingStyle: 'NORTHEAST' , note: '[唐渤海率宾府、金置恤品路节度使至金末蒲鲜万奴东夏国南京·绥芬河双城子周4公里夯土方城] 《金史·地理志》上京路恤品路（乌苏里斯克克拉斯诺亚尔山城及西侧平原夯土城遗址），地处滨海苦寒林莽、元置水达达路后荒废，纯夯土城垣且查无破万城居人口，定城寨。' },

    { id: 'city_huifa', name: '辉发', factionId: 'haixi_nvzhen', lat: 42.70463, lng: 125.922546, type: 'pass', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST' , note: '[明中叶至万历海西女真辉发部·辉发河畔扈尔奇三道石土山城] 辉发贝勒王机砶、拜音达里凭险筑扈尔奇三道石砌夯土山城拒努尔哈赤，万历三十五年城破（《满洲实录》及辉发城遗址考古报告），军事山城具石土三重墙且常住<1万，定险要。' },


    { id: 'city_julunbo', name: '俱轮泊', factionId: 'shiwei', lat: 49.251593, lng: 118.262329, type: 'stockade', region: 'MONGOL',
buildingStyle: 'MONGOL', troops: 10000,
        note: '[南北朝隋唐室韦乌洛侯与蒙兀室韦渔猎游牧地俱轮泊（呼伦湖）·草原大湖沿岸桦皮毡帐营聚] 《旧唐书·室韦传》载我唐太宗时俱轮泊四面室韦诸部附突厥或内贡，后为蒙古弘吉剌与巴尔虎牧场，湖滨游牧渔猎帐营无城墙，定城寨。',
    },
    { id: 'city_boli2', name: '勃利', factionId: 'dajin', lat: 48.48, lng: 135.07, type: 'stockade', troops: 10000, region: 'JURCHEN', buildingStyle: 'NORTHEAST', note: '[唐开元十年以黑水靺鞨置勃利州、金胡里改路东境勃利（伯力／哈巴罗夫斯克）·黑龙江乌苏里江汇口木栅渔猎大屯] 黑水靺鞨与明奴儿干都司失儿兀赤卫江岸木屋渔屯（1652年俄哥萨克哈巴罗夫曾于江口筑阿昌斯克越冬原木小寨被清军沙尔虎达击走，《新唐书·黑水靺鞨传》《平定罗刹方略》），无砖石墙且不足3000人，定城寨。' },




    { id: 'city_kuanchengzi', name: '宽城屯', factionId: 'manzhou_d', lat: 43.8725, lng: 125.3595, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[17世纪科尔沁郭尔罗斯前旗伊通河牧地（嘉庆五年1800设长春厅宽城子远超1700年红线）·柳条边外草原牧屯] 清设长春厅流民商埠宽城子始于1791–1800年（违反≤1700年红线不采）；≤1700年柳条边伊通门外仅为蒙古郭尔罗斯旗游牧草甸与零星台站，无城墙且不足千人，定城寨。' },

    { id: 'city_wuliyasitai', name: '乌里雅斯太', factionId: 'wuzhumuqin', lat: 45.519, lng: 116.9604, type: 'stockade', troops: 10000, region: 'STEPPE_IMPERIAL', buildingStyle: 'XIANBEI', note: '[17世纪漠南察哈尔东迁后东乌珠穆沁旗多尔济贝勒驻牧地乌里雅斯太·大兴安岭西麓拉尕拉河草甸王帐] 多尔济号色臣济农于崇德间率部归清封东乌珠穆沁扎萨克亲王（《蒙古游牧记》卷二），草原游牧王府毡帐无城郭且常住<1万，定城寨。' },

    { id: 'city_saihantala', name: '赛汉塔拉', factionId: 'sunite', lat: 42.7701, lng: 112.6099, type: 'stockade', region: 'STEPPE_IMPERIAL',
buildingStyle: 'XIANBEI', troops: 10000,
        note: '[17世纪北元博迪阿拉克汗裔苏尼特部腾机思与叟塞杜棱郡王牧地赛汉塔拉·浑善达克沙地北缘戈壁草原帐营] 顺治间腾机思叛奔喀尔喀旋归降驻牧张家口北苏尼特草原（《清史稿·藩部传》），半荒漠草原游牧毡帐营盘无城墙，定城寨。',
    },
    { id: 'city_sailan', name: '讹答剌', factionId: 'kazakh', lat: 42.2863, lng: 69.5709, type: 'small_city', troops: 10000, region: 'WESTERN_CASTLE', buildingStyle: 'CENTRAL_ASIA' , note: '[10至13世纪初喀喇汗与花剌子模边贸重都讹答剌·200公顷烧砖内城外郭遗址] 1218年海儿汗杀蒙古商队引发西征、坚守五月之讹答剌大城，哈萨克考古发掘确证烧砖浴场、清真寺与水道网，蒙军破城前城居约2–3万（Akishev & Baipakov《古讹答剌考》），>1万定小城。' },

    { id: 'city_saiyinshanda', name: '薛灵哥', factionId: 'menggu_d', lat: 49.437762, lng: 101.428528, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[元岭北行省驿道至17世纪喀尔喀北境色楞格河（薛灵哥河）下游渡口牧营·河谷草甸毡帐聚落] 《元史·地理志》薛灵哥水谦州至哈拉和林北路水草通道，喀尔喀土谢图汗北界游牧河岸无石砖城郭且常住<1万，定城寨。' },



    // ── 2026-06-18 新增：赛音山达（漠东隘口，叛军旗）──
    { id: 'city_saiyinsanda', name: '赛音山达', factionId: 'kaerka', lat: 44.8870, lng: 110.1407, type: 'stockade', region: 'STEPPE_IMPERIAL', buildingStyle: 'MONGOL', troops: 10000, note: '[隋唐突厥南下碛口北道至17世纪喀尔喀车臣土谢图交界东戈壁赛音山达·戈壁水泉游牧台站] 控漠北穿东戈壁南赴二连张家口商驼古道甜水泉站（《蒙古游牧记》），戈壁水草毡帐驻点无城垣且常住不足2000人，定城寨。' },
    // ── 2026-06-19 特尔门·黑沙（草原）──
    { id: 'city_temermen', name: '特尔门',
        factionId: 'tujue', lat: 48.7386, lng: 97.8387, type: 'stockade', region: 'STEPPE_ANTIQUITY',
        buildingStyle: 'MONGOL', troops: 10000, note: '[匈奴呴犁湖单于牧地与唐后突厥北境土拉河扎布汗间特尔门湖盆·杭爱山北坡高山草甸游牧营地] 漠北森林草原交界夏牧场（《汉书·匈奴传》《新唐书·突厥传》），纯毡帐游牧营地无城墙且<1万，定城寨。' },
    { id: 'city_yancheng2', name: '郾城', factionId: 'song', lat: 33.58, lng: 114.03, type: 'small_city', troops: 10000, region: 'SONG', buildingStyle: 'CENTRAL' , note: '[战国楚鄢陵郾邑、东汉光武得贾复郾县至唐元和平淮西、南宋绍兴十年岳飞郾城大捷·颍汝漕道夯土包砖名邑] 绍兴十年岳飞驻军郾城大破完颜宗弼拐子马（《宋史·岳飞传》），控汴京南通荆襄官道，明成化嘉靖修筑包砖护城大堤县城（《郾城县志》），南北驿商大县在城人口约1.2–1.8万且具包砖墙，定小城。' },








    { id: 'city_xuanhu', name: '悬瓠', factionId: 'huaixi', lat: 33.01, lng: 114.36, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[两汉汝南郡治平舆安城、北魏悬瓠守城四十二日、唐李愬雪夜入蔡州至金哀宗末都蔡州·汝水环抱夯土包砖巨城] 元和十二年（817）李愬雪夜袭破吴元济淮西节度首府蔡州，天兴三年（1234）宋蒙联军围破金哀宗末都蔡州（《旧唐书·李愬传》《金史·哀宗纪》），汝水双城极盛期军民达3–5万，>1万定小城。' },




    {
        id: 'city_yiluolucheng',
        name: '伊逻卢',
        factionId: 'qiuci',
        lat: 41.720000, lng: 82.930000, type: 'small_city', troops: 10000, tier: 1, 
        note: '[两汉西域北道霸主龟兹王都延城至唐安西大都护府驻节伊逻卢城·皮朗古城周7公里高大夯土三重王都] 《汉书·西域传》龟兹全境人口81,317冠绝塔里木诸国，玄奘《大唐西域记》卷一明载屈支（龟兹）国大都城周十七八里（库车皮朗古城考古实测周长约7公里），安西四镇首府与龟兹乐舞商都城居达2–3.5万，>1万定小城。', region: 'WESTERN',
        buildingStyle: 'WESTERN' },
    { id: 'city_yuergun', name: '玉尔滚', factionId: 'weiwuer', lat: 41.35, lng: 81.3, type: 'stockade', region: 'WESTERN_CASTLE', buildingStyle: 'WESTERN', troops: 10000, note: '[唐龟兹东境至16至17世纪叶尔羌汗国阿克苏库车驿道绿洲庄园玉尔滚·渭干河冲积扇生土果园村聚] 塔里木北道伯克统辖之维吾尔生土泥墙绿洲农业庄园聚落（《西域同文志》），无砖石城郭且常住不足4000人，定城寨。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」推出的二级与史实不符 → 归 CENTRAL_ASIA：拨换城（阿克苏）：姑墨/跋禄迦，塔里木
    { id: 'city_bohuancheng', name: '拨换城', factionId: 'tang', lat: 41.17, lng: 80.25, type: 'stockade', troops: 10000, region: 'WESTERN', buildingStyle: 'WESTERN' , note: '[唐显庆置姑墨州温肃州治拨换城（威戎城，今阿克苏旧址）·多浪河畔夯土军镇小州城] 贾耽《皇华四达记》（《新唐书·地理志》引）详记安西西出经拨换城南临思浑河，建中贞元间安西大都护郭昕坚守西域孤悬镇戍，唐代为夯土城垣且查无破万城居确数，定城寨。' },





    { id: 'city_dashicheng', name: '大石堡', factionId: 'weitou', lat: 41.28, lng: 79.22, type: 'stockade', region: 'WESTERN_FEUDAL',
buildingStyle: 'WESTERN', troops: 10000,
        // 🔴 [2026-10-30 按史修正] 沙陀李克用父子已移归漠南/河朔祖邑（光禄城/彰国军城），大石堡位于天山别迭里达坂南麓阿克苏乌什北，属古尉头/安西西域要隘，归属尉头（weitou）
        note: '[汉尉头国至唐安西大石城·天山南麓绿洲夯土小邑] 即唐温肃州大石城（今乌什，《新唐书·地理志》卷四十三下引贾耽道里记），实为西域绿洲居民小城邑而非砌墙关门，查无城居人口确数且为夯土小邑<1万，定城寨。',
    },
    { id: 'city_weitoucheng', name: '阿合奇', factionId: 'weitou', lat: 40.3, lng: 79.05, type: 'stockade', region: 'WESTERN', buildingStyle: 'WESTERN', troops: 10000, note: '[两汉葱岭北道山谷半游牧小国尉头国王治尉头谷（今阿合奇；清设卡在1759年后超限）·托什干河上游石土山牧寨] 《汉书·西域传》明载尉头国全境总人口仅「户三百，口二千三百，随畜逐水草，衣服类乌孙」，举国仅两千三百人且无城郭，定城寨。' },
    { id: 'city_wosedecheng', name: '握瑟德', factionId: 'tang', lat: 39.77, lng: 78.56, type: 'stockade', region: 'WESTERN_FEUDAL', buildingStyle: 'WESTERN', troops: 10000, note: '[唐安西四镇龟兹西赴拨换要驿握瑟德城（郁头州，今巴楚东北唐王城）·叶尔羌河下游夯土圆城] 开元二十七年盖嘉运平突骑施经略西域、贾耽道里记明载自拨换南行经握瑟德城（巴楚托库孜萨来唐王城夯土遗址），沙漠边缘夯土军驿小城常住不足5000人，定城寨。' },
    { id: 'city_jiaseni', name: '哥疾宁', factionId: 'jiazini', lat: 33.55, lng: 68.42, type: 'medium_city', region: 'SASANIAN',
buildingStyle: 'PERSIAN', troops: 10000, tier: 1,
        note: '[11世纪伽色尼王朝马哈茂德极盛期·石基泥砖烧砖帝都] 苏丹马哈茂德掠印财赋营建伽色尼（哥疾宁）卫城与大片坊市关厢，11世纪上半叶城居峰值约8–12万（拜哈基《马斯乌德史》及Bosworth《伽色尼王朝史》考算），≥8万定中城。',
    },
    // ── 2026-08-05 罽宾迁白沙瓦；喀布尔归还巴布尔（1504 发迹地）──
    { id: 'city_gaofu', name: '喀布尔', factionId: 'mowoer', lat: 34.55, lng: 69.2, type: 'small_city', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', note: '[贵霜高附至16世纪初巴布尔莫卧儿奠基王都·巴拉希萨尔石基高墙喀布尔] 1504–1526年巴布尔定都喀布尔并详述于《巴布尔回忆录》为印度与呼罗珊总商埠（每年商队万匹驼马过境），16–17世纪莫卧儿夏都与西北军府期城居达2.5–4万，>1万定小城。' },
        // 🔴 [2026-09-24] 第 12 场「前327 马萨加围城战」攻城战必须有真据点，库里没有 → 按 §二之二 添加。
    //    坐标取斯瓦特河谷要冲 Chakdara 一带 34.65,72.03（英文维基 Cophen campaign 未给马萨加坐标 → 按史地合理推定：
    //    该条目记马萨加为阿萨卡诺伊人最大的设防城市与首府，位于斯瓦特河谷，故取河谷门户）。
    { id: 'city_masaga', name: '马萨加', factionId: 'aswaka', lat: 34.65, lng: 72.03, type: 'small_city', troops: 10000,
        note: '[前4世纪斯瓦特河谷阿斯瓦卡王国首邑·35斯塔迪亚切石基垣山城马萨加] 前327年亚历山大攻围克莱奥菲斯女王所守马萨加，库尔提乌斯《亚历山大大帝史》VIII.10.23–25明载该城下层以巨大天然切石垒筑周35斯塔迪亚城墙且城内军民达3.8万人，>1万且具石墙，定小城。', region: 'PURU', buildingStyle: 'PURU' },
    // 🔴 [2026-09-25 §二之二 授权] 第 15 场「前325 马里斯」是攻城战，必须有真据点，库里没有 → 按授权添加。
    //    势力（马利）＋武将（摩罗波罗）＋精锐（马利城兵）库里都已有，故本场只新增这一个据点。
    //    坐标取英文维基百科 Multan 条目信息框 30°11′N 71°28′E；城址身份见 note。
    //    间距：--probe 实测最近拉合尔 313.44 km（≥40 km，无需特批）。

    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 帕塔拉＝印度河三角洲重镇（信德）→ PURU（西北印）；原标 INDIA
    { id: 'city_patala', name: '帕塔拉', factionId: 'maqidun', lat: 25.39, lng: 68.36, type: 'stockade', troops: 10000, region: 'PURU', buildingStyle: 'PURU', note: '[前4世纪亚历山大东征终点·印度河三角洲分流处泥砖木构港邑] 前325年亚历山大抵帕塔拉时当地人举邑逃散，马其顿军修整木土船坞与卫垒（阿里安《远征记》VI.17–20），冲积三角洲无石砖城郭且古典史料查无人口数字，定城寨。' },
    { id: 'city_pula', name: '普拉', factionId: 'maqidun', lat: 27.2025, lng: 60.6858, type: 'stockade', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN', note: '[前4世纪阿契美尼德与亚历山大西归休整之吉德罗西亚行省治所普拉（今伊朗沙赫尔Bampur土丘）·沙漠绿洲生土泥砖小省邑] 前325年亚历山大穿越莫克兰酷热沙漠死伤惨重后抵普拉休整补给（阿里安《远征记》VI.24–26），俾路支干旱绿洲泥砖高台小邑古典史料查无人口数字且<1万，定城寨。' },
    { id: 'city_kamanniya', name: '卡曼尼亚', factionId: 'aqimeinide', lat: 28.67, lng: 57.74, type: 'small_city', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN', note: '[塞尔柱克尔曼王朝至萨法维期（承阿契美尼德卡曼尼亚）·烧砖泥砖六门商都克尔曼] 11–12世纪克尔曼塞尔柱都城及17世纪萨法维甘贾利汗扩建大巴扎时期，马可·波罗与塔维尼埃记其地毯军械贸易兴盛，城垣内常住人口约2.5–4万（Matthee萨法维经济考），>1万定小城。' },
    { id: 'city_xierzhan', name: '锡尔詹', factionId: 'seljuq', lat: 29.45, lng: 55.68, type: 'stockade', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN', stockadeShape: 'rect', stockadeFence: 'HARDWOOD', note: '[萨珊至10世纪白益与塞尔柱克尔曼西门商道城锡尔詹·卡拉伊桑石丘与平原泥砖城垣] 10世纪伊斯塔赫里记锡尔詹为法尔斯入克尔曼商站泥砖城，1396年帖木儿军围破卡拉伊桑后彻底夷毁荒废（哈菲兹·阿布鲁《史汇》），泥砖生土垣且≤1700年无破万确证，定城寨。' },
    { id: 'city_hulewan', name: '呼勒万', factionId: 'sashan', lat: 34.35, lng: 45.9, type: 'stockade', troops: 10000, region: 'MEDI', buildingStyle: 'SASANIAN', stockadeShape: 'trapezoid', stockadeFence: 'ARCHAIC', note: '[萨珊波斯晚期·扎格罗斯山口西麓驿道市镇] 萨珊霍斯劳二世设宫驿之山口聚落呼勒万（637年阿拉伯军进占，《塔巴里史》），实为无环城石墙之山麓小镇而非正式砌墙关塞，城居不足1万，定城寨。', mirror: true },
    { id: 'city_yilamu', name: '伊拉姆', factionId: 'ailan', lat: 33.64, lng: 46.42, type: 'stockade', troops: 10000, region: 'MEDI', buildingStyle: 'SASANIAN', note: '[埃兰西境山地与萨珊塞尔柱洛雷斯坦北缘山谷集镇伊拉姆·扎格罗斯西麓石木游牧冬营小镇] 库尔德与卢尔山地部落冬牧集市，中世纪阿拉伯地理志仅列为山间小村镇（总督卡迪姆宫迟至卡扎尔王朝方建），无石砖大城墙且≤1700年常住仅两三千人，定城寨。' },
    { id: 'city_guerpayegan', name: '古尔帕耶甘', factionId: 'seljuq', lat: 33.4536, lng: 50.2884, type: 'stockade', troops: 10000, region: 'MEDI', buildingStyle: 'SASANIAN', stockadeShape: 'rect', stockadeFence: 'HARDWOOD', note: '[萨珊传说建邑至12世纪大塞尔柱穆罕默德·塔帕尔建清真寺古尔帕耶甘·扎格罗斯东麓谷口泥砖烧砖驿镇] 连接伊斯法罕与哈马丹山间走廊之农业绿洲小镇（现存1105–1118年塞尔柱砖砌清真寺），非设防大都会亦非关门，中世纪常住人口无确载（约数千<1万），定城寨。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 兰巴基亚＝莫克兰海岸（判不出→最近同风格据点卡拉奇）→ PURU；原标 INDIA
    { id: 'city_lanbaqiya', name: '兰巴基亚', factionId: 'aolitai', lat: 26.23, lng: 66.3, type: 'stockade', troops: 10000, region: 'PURU', buildingStyle: 'PURU', note: '[前325年亚历山大征服俾路支沿海奥里泰人最大村落兰巴基亚（今拉斯贝拉）·波拉利河谷泥砖茅屋大村] 阿里安《亚历山大远征记》VI.21.5明确界定兰巴基亚为「奥里泰人最大之村落（κώμη）」，亚历山大命赫费斯提翁留建新屯旋即因土著反叛废弃，无石砖城郭且村落人口不足1万，定城寨。' },
    { id: 'city_malisi', name: '马里斯', factionId: 'malli', lat: 30.198, lng: 71.468, type: 'small_city', troops: 10000, region: 'PURU', buildingStyle: 'PURU', note: '[前4世纪马利人首邑至中世纪木尔坦苏丹都城·烧砖红砂岩六门高台卫城] 前325年亚历山大登梯重伤之马利人巨城（阿里安VI.9–11），后为阿拉伯与德里苏丹国西境大镇木尔坦，玄奘《大唐西域记》茂罗三部卢国及中世纪烧砖城垣内人口达3–5万，>1万定小城。' },
    // 🔴 [2026-09-24 §二之二 授权] 第 13 场「前326 奥诺斯岩」是攻城战，必须有真据点，库里没有 → 按授权添加，
    //    并按据点完整性铁律配齐 势力（奥诺斯）＋武将（阿夫里凯斯）＋精锐（绝壁守兵）。
    //    坐标取维基数据 Pir Sar 34.82,72.88 —— 英文维基百科 Aornos 条目正文记该岩在印度河上游峡谷湾上、
    //    Gunangar Shamshi Khel 之西，条目所附照片说明即 Shangla 县，与这一点反查所得一致。
    //    间距：--probe 实测最近马萨加 79.94 km（≥40 km，无需特批）。
    { id: 'city_aonuosiyan', name: '奥诺斯岩', factionId: 'asakaini', lat: 34.82, lng: 72.88, type: 'stockade', troops: 10000, stockadeShape: 'oval', stockadeFence: 'FENCE',
        note: '[前326年春亚历山大最后一次传奇围岩战斯瓦特印度河大峡谷奥诺斯岩（皮尔萨尔峰）·海拔2200米天然绝壁避难岩顶] 阿里安《远征记》IV.28–30详载阿萨凯尼溃众逃上高十余斯塔迪亚之天然陡崖奥诺斯岩（斯坦因1926年实地勘定Pir-Sar孤峰，无人工环山城郭），临时避难岩顶非居民城亦非砌墙关门，定城寨。', region: 'PURU', buildingStyle: 'PURU' },
    { id: 'city_baishawa', name: '白沙瓦', factionId: 'guishuang', lat: 34.01, lng: 71.52, type: 'medium_city', troops: 10000, region: 'PURU', buildingStyle: 'PURU', note: '[2世纪贵霜帝国迦腻色迦都城期·石砖城垣布路沙布逻] 贵霜大帝迦腻色迦一世冬都布路沙布逻（白沙瓦）石砖大城及迦腻色迦大塔城区，公元100–200年城居峰值约10–12万（《大唐西域记》卷二及Chandler公元100年表12万），>10万定中城。' },



    { id: 'city_fanyanna', name: '巴米扬', factionId: 'fanyanna', lat: 34.8659, lng: 67.9807, type: 'small_city', region: 'CENTRAL_ASIA',
buildingStyle: 'CENTRAL_ASIA', troops: 10000, note: '[6至8世纪吐火罗梵衍那王国至12世纪古尔支系王都·石崖大佛坊市与沙赫尔佐哈克红堡] 玄奘《大唐西域记》卷一载梵衍那国都城据崖跨谷长六七里、伽蓝数十所僧数千人，1221年成吉思汗毁城前为兴都库什南北商道都会，盛期城居约1.5–2.5万，>1万定小城。' },
    { id: 'city_paixiucheng', name: '涓笃', factionId: 'shule', lat: 39.48, lng: 76.72, type: 'stockade', troops: 10000, region: 'WESTERN_FEUDAL', buildingStyle: 'WESTERN', note: '[两汉葱岭东麓塞种小行国捐毒国（乌恰托云河谷）·天山帕米尔交汇随畜逐水草毡帐部落] 《汉书·西域传》明载捐毒国王治衍敦谷，「户三百八十，口千一百，衣服类乌孙，随水草依葱岭，本塞种也」，举国仅千一百人且无城郭，定城寨。' },




    { id: 'city_daerhan', name: '达尔罕', factionId: 'keerqin', lat: 43.6064, lng: 122.2229, type: 'stockade', region: 'MANCHU',
buildingStyle: 'XIANBEI', troops: 10000,
        note: '[17世纪初成吉思汗胞弟哈撒儿后裔科尔沁土谢图汗奥巴与达尔罕亲王满珠习礼牧地·西辽河教来河草原王帐] 天命十一年奥巴最先率科尔沁归附后金受封土谢图汗，满珠习礼封扎萨克达尔罕亲王（《清史稿·藩部传》；注：阴山达尔罕茂明安系喀尔喀右翼达尔罕贝勒牧地，二者皆为草原游牧旗府毡帐无城墙），常住<1万，定城寨。',
    },
    { id: 'city_yiyang', name: '葛溪', factionId: 'song', lat: 28.3524, lng: 117.4466, type: 'small_city', region: 'JIANGNAN',
buildingStyle: 'JIANGNAN', troops: 10000,
        note: '[唐乾元析置信州（连结弋阳葛溪）至两宋辛弃疾谢叠山抗元明广信府·信江北岸红砂条石包砖周九里府城] 控赣东北入浙闽玉山铅山河口纸铜水运总枢，唐置信州、明洪武四年因宋基修筑红砂岩条石包砖广信府城（《元和郡县图志》《广信府志》），信江商舶与附郭上饶坊厢达2.5–4万，>1万定小城。',
    },
    { id: 'city_linchuan', name: '临川', factionId: 'song', lat: 27.9779, lng: 116.3562, type: 'small_city', region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '[三国吴太平二年置临川郡至唐宋才子之乡抚州临川郡（王安石汤显祖故里）明抚州府·汝水西岸条石包砖周九里名城] 南朝梁陈周迪割据临川，两宋抚州户逾二十五万（《宋史·地理志》），明洪武修筑条石包砖抚州府城及文昌桥东关厢，江右商帮与书院都会城居达3.5–5万，>1万定小城。' },
    { id: 'city_binzhou2', name: '新平', factionId: 'tang', lat: 35.03, lng: 108.08, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[公刘豳国故地、汉漆县至唐邠宁节度使治所邠州新平郡·泾河中游夯土包砖西北强藩军府城] 郭子仪、李怀光、浑瑊历镇邠宁节度屏蔽长安西北门户，五代杨崇本守邠州，明包砖修筑邠州城（《新唐书·方镇表》《邠州新志稿》），唐宋节度军州在城军民达2–3万，>1万定小城。' },




    { id: 'city_fangqu', name: '方渠', factionId: 'song', lat: 36.58, lng: 107.3, type: 'stockade', region: 'SONG',
buildingStyle: 'CENTRAL', troops: 10000,
        note: '[西汉置北地郡方渠县、唐大历置环州防党项吐蕃至北宋种世衡经略庆州北屏环州通远军·环江河谷夯土边州小城] 五代后周降威州为环州，北宋范仲淹种世衡守环庆御西夏元昊（《宋史·地理志》环州仅领通远一县，崇宁全州含诸砦合计户仅7,183！），黄土狭谷夯土边城内常住军民仅约4000–5000人<1万，定城寨。',
    },
    { id: 'city_jingsai', name: '静塞', factionId: 'tang', lat: 37.448637, lng: 106.674500, type: 'stockade', region: 'HEXI',
buildingStyle: 'HEXI', troops: 10000, mirror: true,
        note: '[唐景云至开元朔方节度·灵州南黄河岸军屯聚落] 唐置静塞军驻屯点（《新唐书·兵志》），名字不带关隘堡戍且考古未见砖石或夯土关城遗址，系沿河屯田军聚且人口<1万，定城寨。',
    },//镜像
    { id: 'city_lingzhou', name: '回乐', factionId: 'tang', lat: 37.998341, lng: 106.295471, type: 'small_city', region: 'HEXI',
buildingStyle: 'HEXI', troops: 10000,
        note: '[北魏置灵州、唐朔方节度使大本营（天宝十五载唐肃宗灵武即位中兴行都）至西夏西平府·黄河东岸夯土包砖军都] 统辖唐代最强边防劲旅朔方军六万余众之总治所灵州回乐，肃宗即位百官朔方将士云集，西夏继为陪都西平府、明筑宁夏灵州千户所砖城（《旧唐书·肃宗纪》《元和郡县图志》），唐夏军都城居达2.5–4万，>1万定小城。',
    },
    { id: 'city_nuergan', name: '特林', factionId: 'ming_d', lat: 52.92, lng: 139.77, type: 'stockade', region: 'JURCHEN', buildingStyle: 'NORTHEAST', troops: 10000, note: '[元东征元帅府至明永乐七年（1409）太监亦失哈设奴儿干都指挥使司治所特林·黑龙江口红土悬崖永宁寺木栅衙署] 永乐十一年与宣德八年亦失哈十下奴儿干于特林悬崖建观音堂永宁寺并立两通汉蒙女真藏四体《敕修奴儿干永宁寺碑》（碑石现存海参崴博物馆，《明实录》），系季节性巡抚木栅司署与吉里迷小屯无砖石城墙，常住不足2000人，定城寨。' },
    { id: 'city_pennuli', name: '盆奴里', factionId: 'jilimi', lat: 47.708134, lng: 130.933685, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[唐开元天宝黑水靺鞨北邻室韦达姤盆奴里部·黑龙江下游阿姆贡河口森林桦皮木庐部落聚落] 《新唐书·黑水靺鞨传》载黑水西北有思慕、郡利、窟说、莫曳皆与盆奴里诸部，苦寒针叶林渔猎小部无城郭且人口不足2000人，定城寨。' },

    // 古尔王朝（Ghurids）呼罗珊边缘要塞
    { id: 'city_malulude', name: '马尔夫鲁德', factionId: 'seljuq', lat: 35.58, lng: 63.32, type: 'stockade', troops: 10000, region: 'PERSIAN_CASTLE', buildingStyle: 'PERSIAN', note: '[萨珊巴赫拉姆五世胜白匈奴处至阿拔斯塞尔柱穆尔加布河上游马尔夫鲁德（小木鹿／巴拉穆尔加布）·河岸泥砖小邑] 区别于下游大木鹿（Merv al-Shahijan），10世纪伊斯塔赫里《道路与王国志》明载「小木鹿」（Marw al-Rudh）仅为河谷农业小集镇，泥砖矮垣且人口不足1万，定城寨。' },



    // 巴达赫尚（Badakhshan）山地政权
    { id: 'city_pengdi', name: '彭迪', factionId: 'sashan', lat: 36, lng: 62.7, type: 'stockade', troops: 10000, region: 'CENTRAL_ASIA', buildingStyle: 'PERSIAN', mirror: true , note: '[阿拔斯至塞尔柱古尔期穆尔加布河中游绿洲五村联合聚落潘杰迪赫（彭迪）·巴德吉斯北缘生土泥砖五村群] 波斯语Panjdeh意即「五个村庄」，10世纪穆卡达西与哈菲兹·阿布鲁《地理志》均记其为穆尔加布河谷五个毗邻生土农业村镇而无大城砖石垣，常住数千人<1万，定城寨。' },



    // 黠戛斯（坚昆）汗庭漠北牧地
    { id: 'city_wubusabo', name: '乌布萨泊', factionId: 'keerkezi', lat: 49.9762, lng: 92.0929, type: 'stockade', region: 'STEPPE_FEUDAL',
buildingStyle: 'MONGOL', troops: 10000,
        note: '[唐回鹘西境与黠戛斯（坚昆）南拓牧地乌布萨泊·大湖盆地荒漠草原游牧毡帐营盘] 会昌年间黠戛斯阿热破回鹘后南控西北蒙古大湖盆地，17世纪为卫拉特杜尔伯特与辉特冬牧湖岸（《新唐书·黠戛斯传》《朔方备乘》），游牧湖岸无城郭，定城寨。',
    },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」推出的二级与史实不符 → 归 CENTRAL_ASIA：真珠河：锡尔河上游，中亚
    { id: 'city_zhenzhuhe', name: '真珠河', factionId: 'xierhe', lat: 41.2773, lng: 67.9312, type: 'stockade', troops: 10000, region: 'CENTRAL_ASIA', buildingStyle: 'CENTRAL_ASIA', note: '[8至11世纪突厥碑铭与乌古斯叶护国南界真珠河（锡尔河中游药杀水）渡口牧营·河岸胡杨芦苇冬营聚落] 《暾欲谷碑》明载突厥西征远渡「真珠河（Yinčü ügüz，即锡尔河）」直抵铁门，10世纪为乌古斯人冬季沿河驻牧营地，无砖石城墙且单营<1万，定城寨。', mirror: true },
//镜像
    { id: 'city_wuyun', name: '乌云', factionId: 'manzhou_d', lat: 49.018048, lng: 129.91539, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST' , note: '[清初黑龙江中游右岸鄂伦春索伦使马猎部游牧地乌云河口（嘉荫，设县在民国超限）·小兴安岭江岸撮罗子猎营] 康熙间沙尔虎达、萨布素巡江通道沿岸索伦鄂伦春桦皮斜仁柱（撮罗子）狩猎聚落（《柳边纪略》），无城墙且常住仅数百人，定城寨。' },



    // 占城国（林邑/环王国）佛临城阇槃；与占婆国（美山）分立，各 1 势力 1 据点
    { id: 'city_dupan', name: '阇槃', factionId: 'champa', lat: 13.93, lng: 109.11, type: 'small_city', isPort: true, troops: 10000, region: 'SEAS', buildingStyle: 'KHMER' , note: '[10至15世纪占婆王国毗阇耶王朝首都阇槃（佛逝城）·红土石夹烧砖方城垣] 1000–1471年占婆国都毗阇耶（平定省皇城遗址，马欢《瀛涯胜览》详记占城国砖石砌城周二十余里开四门），1471年越南黎圣宗攻破时《大越史记全书》载俘斩城中军民逾六万，>1万且具砖石墙，定小城。；🔴 [2026-11-11 按史改] 据点文化 VIETNAMESE→KHMER（代理）：占婆毗阇耶王都，红砖神庙塔群' },

    // 孟邦墨侬族故地
    { id: 'city_bangdun', name: '邦敦', factionId: 'nongzhigao', lat: 12.87, lng: 107.8, type: 'stockade', troops: 10000,
        note: '[中世纪占婆西境长山山脉高地墨侬（Mnong）猎象部族聚落邦敦·斯雷博克河干栏长屋竹栅村寨] 西原多乐高原孟-高棉语族墨侬人捕捉驯养战象供占婆、真腊与澜沧王室之传统林寨，全为竹木干栏长屋无石砖城垣且常住不足3000人，定城寨。；🔴 [2026-11-11 按史改] 据点文化 VIETNAMESE→KHMER（代理）：西原高地孟—高棉语族墨侬人猎象聚落，取同语族KHMER', region: 'SEAS',
        buildingStyle: 'KHMER' },
    // 水真腊南境部族
    { id: 'city_sanpu', name: '三菩', factionId: 'chenla', lat: 12.77, lng: 105.97, type: 'stockade', troops: 10000,
        note: '[6至8世纪陆真腊分裂后水真腊主都婆罗提拔（三菩跋摩／三波博达Sambhupura）·湄公河桔井红砖神庙河埠小邑] 《新唐书·真腊传》载神龙后真腊分水陆二半，水真腊王居婆罗提拔（今柬埔寨桔井Sambor遗址），除数座小型红砖印度教祠塔外民居皆木竹高脚屋无城墙，常住人口无确载<1万，定城寨。', region: 'SEAS',
        // 🔴 [2026-09-18 主人定] 原 'SEAS' 只是一级母体、无二级/三级 → 按真实地理历史归**高棉 KHMER**：
        //    三菩在柬埔寨磅湛一带、水真腊（真腊南境）故地，吴哥高棉文化圈。
        buildingStyle: 'KHMER' },
    { id: 'city_juyansai', name: '遮虏障', factionId: 'han_d', lat: 41.8942, lng: 101.044, type: 'pass', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[西汉太初三年强弩都尉路博德筑·额济纳弱水夯土障塞（遮虏障）] 汉武帝太初三年遣路博德筑居延泽上遮虏障，天汉二年李陵自遮虏障出塞北伐（《史记·李将军列传》《汉书·武帝纪》及居延汉简），纯边防军事夯土塞障且未成万人城，定险要。' },




    { id: 'city_gongzhubao', name: '公主堡', factionId: 'kepantuo', lat: 37.2008, lng: 75.3745, type: 'pass', troops: 10000, 
        note: '[唐代朅盘陀国·瓦罕走廊东端海拔四千米片石夹柳山堡] 踞帕米尔塔什库尔干孜拉甫河口四千米高山悬崖，南面筑片石夹红柳枝高墙控瓦罕丝路南道（玄奘《大唐西域记》卷十二及斯坦因《西域考古记》），名带「堡」且具石墙，<1万定险要。', region: 'WESTERN_FEUDAL',
        buildingStyle: 'WESTERN' },
    { id: 'city_jimai', name: '吉麦', factionId: 'ganden', lat: 29.3012, lng: 90.6812, type: 'stockade', region: 'TIBET_IMPERIAL',
buildingStyle: 'TIBET', troops: 10000,
        note: '[吐蕃山南羊卓雍错湖滨牧场至帕竹甘丹颇章浪卡子白地吉麦·海拔4440米圣湖半岛土石溪卡村聚] 控拉萨翻甘巴拉山赴江孜亚东官道湖岸驿村（桑顶寺近旁，《卫藏通志》），高寒湖岸土石藏房聚落无城墙且常住不足2000人，定城寨。',
    },
    // ── 2026-06-11 新增：库页岛民族据点 ──
    { id: 'city_nuotuoluo', name: '诺托罗', factionId: 'eluoke', lat: 49.2, lng: 143.1, type: 'stockade', region: 'MANCHU', buildingStyle: 'NORTHEAST', troops: 10000, note: '[元明库页岛东岸中部诺托罗河口鄂罗克（乌尔奇）驯鹿海豹部族聚落·海滨圆木鱼皮帐营] 库页岛东海岸通古斯语系鄂罗克氏族夏渔冬猎集散河口（间宫林藏《东鞑纪行》考述传统聚落），无城郭且仅数百人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】库页岛鄂罗克/阿伊努渔猎聚落，取最近NORTHEAST' },
    { id: 'city_baizhu', name: '白主', factionId: 'jilimi', lat: 46.71, lng: 142.52, type: 'stockade', isPort: true, region: 'MANCHU', buildingStyle: 'NORTHEAST', troops: 10000, note: '[元至元二十一年至大德末征东元帅府跨海征骨嵬（阿伊努）登陆终点库页岛最南端白主土城·宗谷海峡北岸方形夯土小垒] 《元史·世祖纪》《经世大典》骨嵬招讨司遗迹，今库页岛南端克里利翁角现存元代风格120×110米仅1.3公顷方形夯土矮垣（日本称白主土城），纯渡海前哨小土垒常住不足千人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】库页岛骨嵬/吉里迷渔猎聚落，取最近NORTHEAST' },
    { id: 'city_bailao', name: '白老', factionId: 'ayinu_ezo', lat: 42.55, lng: 141.36, type: 'stockade', isPort: true, region: 'AINU', buildingStyle: 'JAPAN', troops: 10000, note: '[15世纪康正三年（1457）胡奢魔犬抗和人起义时代北海道太平洋岸阿伊努大聚落白老·海滨茅草奇塞（Chise）与木栅查希] 北海道胆振海岸阿伊努重要Kotan（村落）与山丘壕沟木栅祭祀防砦（Chashi，《新罗之记录》），无石垣城郭且≤1700年单聚落阿伊努居民仅数百至千余人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】北海道阿伊努/鄂霍次克渔猎聚落，67键无此文化，取最近JAPAN' },
    { id: 'city_zonggu', name: '宗谷', factionId: 'ayinu_ezo', lat: 45.5, lng: 141.93, type: 'stockade', isPort: true, troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[15至17世纪北海道最北端阿伊努对库页山丹锦缎交易口宗谷（1669年沙牟奢允之战时代松前商场所）·海岬木屋渔番屋] 松前藩设宗谷场所与阿伊努、库页岛民以海产易清朝丝锦（「山丹贸易」，《松前志》），严寒海角无城墙且常住阿伊努渔民仅数百人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】北海道阿伊努/鄂霍次克渔猎聚落，67键无此文化，取最近JAPAN' },
    { id: 'city_xierka', name: '锡尔喀', factionId: 'manzhou_d', lat: 46.9, lng: 134.1, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[辽女真故地至明永乐置奴儿干属卫乌苏里江支流锡尔喀（今俄罗斯希尔卡／伊曼河口）·林江木栅渔猎聚落] 明代乌苏里江流域野人女真与那乃部族朝贡水驿河口村寨（《明实录》《皇舆全览图》），木屋树皮帐无城墙且常住不足2000人，定城寨。' },
    { id: 'city_niman', name: '尼满', factionId: 'wure', lat: 45.51, lng: 131.96, type: 'stockade', region: 'MOHE', buildingStyle: 'NORTHEAST', troops: 10000, note: '[辽统和十三年兀惹国主乌昭度降辽故境至明永乐七年置兀者／尼满河卫·乌苏里江东支大乌苏里河（尼满河）口土垣木寨] 《辽史·圣宗纪》兀惹乌昭度据勃海故地及《明太宗实录》永乐置尼满河卫羁縻女真诸部，江口林地小型土垒木栅聚落人口无载<1万，定城寨。' },
    // ── 2026-06-11 新增：外兴安岭/外贝加尔边境据点 ──
    { id: 'city_nibuchu', name: '尼布楚', factionId: 'ewenki', lat: 51.99, lng: 116.58, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[17世纪鄂温克根特木尔游牧地与1658年俄哥萨克帕什科夫筑涅尔琴斯克木堡（1689年《尼布楚条约》缔约处）·石勒喀涅尔恰汇口原木塔寨] 康熙二十八年索额图与戈洛文于尼布楚木堡外搭帐议定中俄东段边界（随团耶稣会士徐日昇、张诚《日记》详载俄方尼布楚仅为四角原木塔楼立栅小寨，驻军哥萨克与猎商不足千人），木栅不算墙且<1万，定城寨。' },

    { id: 'city_yakesa', name: '雅克萨', factionId: 'suolun', lat: 53.39056, lng: 124.0775, type: 'stockade', region: 'MANCHU', buildingStyle: 'NORTHEAST', troops: 10000, note: '[17世纪达斡尔头人阿尔巴西木城故址与1685至1686年清军彭春萨布素两克俄军阿尔巴津寨·黑龙江左岸高培土夹原木棱寨] 本为达斡尔敖拉氏木栅屯，俄人托尔布津增筑生土夹巨木厚胸墙拒清军红衣炮，康熙二十八年条约订立后彻底平毁（《平定罗刹方略》），非长期万人居民城市且驻兵仅八百余人，定城寨。' },
    { id: 'city_geerbiqi', name: '格尔必齐', factionId: 'manzhou_d', lat: 53.33, lng: 121.45, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST', note: '[清康熙二十八年（1689）《中俄尼布楚条约》法定界河格尔必齐河口立碑处·黑龙江北岸针叶林河口哨卡猎营] 清廷以满汉蒙俄拉丁五体勒石立界碑于格尔必齐河入黑龙江东岸（《清圣祖实录》《朔方备乘》），林莽界河巡边卡伦营点无城墙无居民城，定城寨。' },

    { id: 'city_shilekahe', name: '石勒喀堡', factionId: 'eluosi_diguo', lat: 51.7321, lng: 115.8151, type: 'stockade', region: 'STEPPE_FEUDAL', buildingStyle: 'SLAVIC', troops: 10000, note: '[17世纪末沙俄外贝加尔扩张·石勒喀河岸圆木栅寨（奥斯特罗格）] 1650年代至1689年《尼布楚条约》前后俄国哥萨克帕什科夫等于石勒喀河筑原木立栅尖桩寨（《清圣祖实录》及俄国西伯利亚档案），木栅按规不算墙，驻兵仅数百人<1万，定城寨。' },
    { id: 'city_chita', name: '赤塔', factionId: 'buriat', lat: 52.0333, lng: 113.5017, type: 'stockade', region: 'STEPPE_IMPERIAL', buildingStyle: 'MONGOL', troops: 10000, note: '[17世纪外贝加尔布里亚特游牧猎场与1653年俄哥萨克别克托夫建印戈达越冬木屋（赤塔木寨建于1687年）·河口原木冬营] 1653年建越冬木屋、1699年仅升格小型原木立栅奥斯特罗格（1825年十二月党人流放前全镇仅三百居民！俄国西伯利亚地志实载），木栅且≤1700年不足500人，定城寨。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CUMAN：养吉干：锡尔河入咸海处要塞，花剌子模/钦察故地，归库曼 CUMAN
    { id: 'city_yangjigan', name: '养吉干', factionId: 'xierhe', lat: 45.6, lng: 62, type: 'stockade', region: 'STEPPE', buildingStyle: 'CENTRAL_ASIA', troops: 10000, note: '[10至12世纪乌古斯叶护国首都养吉干（Yangi-kent「新城」）·锡尔河入咸海三角洲泥砖高台沼泽王城] 10世纪伊本·鲁斯塔与马苏第记养吉干为乌古斯叶护冬都，苏联托尔斯托夫花剌子模考古队发掘泥砖T形遗址（面积仅约12公顷泥砖生土垣），1219年成吉思汗长子术赤攻取后渐废，生土小城不足8000人，定城寨。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CUMAN：毡的（Jand）：锡尔河下游乌古斯—钦察要城，归库曼 CUMAN
    { id: 'city_zhande', name: '毡的', factionId: 'seljuq', lat: 44.85, lng: 65.5, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'CENTRAL_ASIA', note: '[10世纪末塞尔柱贝伊始迁伊斯兰改宗圣战起点毡的（Jand）·锡尔河下游左岸泥砖草原边贸城] 985年前后塞尔柱率乌古斯部众驻牧毡的改信伊斯兰，花剌子模沙阿屡以此为讨钦察前哨、1220年术赤攻占（志费尼《世界征服者史》），沙漠河道改道后沙埋，泥砖城垣且人口无确载<1万，定城寨。' },

    // ── 2026-06-11 新增：琉球/台湾据点（叛军旗）──
    { id: 'city_mengjia', name: '艋舺', factionId: 'ketagalan', lat: 25.03, lng: 121.50, type: 'small_city', isPort: true, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', troops: 10000, note: '🔴 [2026-11-07 按史补依据] 台北艋舺；清代台北府淡水厅南境要地，万华故称艋舺；定级依据§6.2：艋舺非关隘/要塞/堡垒（淡水河内河港市，"一府二鹿三艋舺"），按城市判级；1875年约1.8万人（臺北府淡水縣大加蚋堡艋舺）→ 小城；推算：城居 1.8 万（艋舺，1875 年约 1.8 万）→ 小城' },
    { id: 'city_diaoyudao', name: '钓鱼岛', factionId: 'ming_d', lat: 25.75, lng: 123.5, type: 'stockade', isPort: true, troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '🔴 [2026-11-07 按史补依据] 钓鱼岛；人口待考：≤1700 年城居人口查不到 → 按 2026-10-25 标准③末行「查不到人口 → 城寨」置城寨（2026-10-28 按史补注）' },




    { id: 'city_gugudao', name: '平良', factionId: 'ryukyu', lat: 24.805, lng: 125.281, type: 'stockade', isPort: true, troops: 10000, region: 'JAPAN', buildingStyle: 'JAPAN', note: '[14至16世纪琉球三山朝贡统一期宫古岛仲宗根丰见亲平良治所·珊瑚礁岛涨水御岳与干砌珊瑚石屋村落] 1500年仲宗根丰见亲率宫古水军助尚真王平八重山赤蜂之乱（《球阳》《宫古岛旧记》），岛上无城郭天守，≤1700年平良五村散居人口仅约3000–4000人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】琉球宫古/先岛石城聚落，67键无琉球，取最近JAPAN' },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CUMAN：哲德：锡尔河下游毡的故址一带，乌古斯后钦察，归库曼 CUMAN
    { id: 'city_qihe', name: '哲德', factionId: 'xierhe', lat: 44.2219, lng: 64.3332, type: 'stockade', region: 'STEPPE_FEUDAL', buildingStyle: 'CENTRAL_ASIA', troops: 10000, note: '[10至11世纪乌古斯与早期塞尔柱家族锡尔河下游右岸冬牧营邑哲德（巴尔奇肯特一带）·河岸芦苇生土冬营] 乌古斯叶护国与钦察汗部交替控制之锡尔河下游右岸过冬泥砖小邑（巴托尔德《突厥斯坦史》），生土泥墙且常住不足5000人，定城寨。' },
    // ── 2026-06-20 替换：巴哈尔兹·泰巴德（原扎姆）──
    { id: 'city_taibade', name: '泰巴德', factionId: 'seljuq', lat: 34.7763, lng: 60.7764, type: 'stockade', region: 'PERSIAN_CASTLE', buildingStyle: 'PERSIAN', stockadeShape: 'square', stockadeFence: 'HARDWOOD', troops: 10000, note: '[伊利汗国至14至15世纪帖木儿王朝呼罗珊巴哈尔兹区苏菲圣镇泰巴德·烧砖圣祠与泥砖丝路商驿镇] 1381年帖木儿东征赫拉特前亲诣泰巴德拜谒苏菲大师扎因丁·阿布·伯克尔，沙哈鲁为其建宏丽琉璃砖陵寺（现存），但镇区本身无石砌城墙且常住仅3000–5000人<1万，定城寨。' },
    { id: 'city_helate_city', name: '赫拉特', factionId: 'aqimeinide', lat: 34.34, lng: 62.19, type: 'medium_city', troops: 10000, region: 'PASHTUN', buildingStyle: 'PERSIAN', note: '[阿契美尼德行省治至15世纪帖木儿帝国都城·烧砖石基伊赫蒂亚尔丁巨城] 沙哈鲁与忽辛·拜哈拉定都时期（1405–1506年）赫拉特烧砖方城及城北连片关厢峰值达10万（巴布尔《回忆录》及Chandler 1450–1500年表10万），≥10万定中城。' },
    // ── 2026-06-20 新增：哈里·萨拉赫斯 ──
    { id: 'city_salahesi', name: '萨拉赫斯', factionId: 'seljuq', lat: 36.5449, lng: 61.1577, type: 'stockade', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN', note: '[安息东境、阿拔斯马蒙驻跸至1089年塞尔柱与14世纪商道镇萨拉赫斯·哈里河出山口泥砖干涸绿洲镇] 扼尼沙布尔东赴木鹿沙漠商道中点，10世纪伊斯塔赫里明载萨拉赫斯水缺田少、城墙为生土泥砖，1221年遭蒙军屠毁后沦为小驿村，常住未满1万确数，定城寨。' },



    // ── 2026-06-20 新增：卡伦·图斯 ──
    { id: 'city_tusi', name: '图斯', factionId: 'ansxi', lat: 36.45, lng: 59.57, type: 'small_city', region: 'SASANIAN', buildingStyle: 'SASANIAN', troops: 10000, note: '[萨珊东北重镇至9至12世纪阿拔斯塞尔柱名城图斯·塔巴兰城垣与石基内堡] 菲尔多西与安萨里故乡、呼罗珊学术大邑图斯（含塔巴兰与努坎），1220年蒙军破城前城垣内人口达3–5万（雅库特《地名辞典》及Bulliet呼罗珊城市考），>1万定小城。' },
    // ── 2026-06-20 新增：锡斯坦·博斯特 ──
    { id: 'city_bosite', name: '博斯特', factionId: 'xisi', lat: 31.5833, lng: 64.36, type: 'small_city', troops: 10000, region: 'PERSIAN_CASTLE', buildingStyle: 'PERSIAN', note: '[9世纪萨法尔重镇至11至12世纪伽色尼帝国冬都博斯特·赫尔曼德河烧砖巨拱内堡与拉什卡里巴扎王城] 马哈茂德与马斯乌德冬都博斯特，法国DAFA考古发掘7公里沿河烧砖宫苑与大巴扎，伊斯塔赫里《道路与王国志》与拜哈基《马斯乌德史》记其商旅辐辏，盛期城居约2–4万，>1万定小城。' },
    // ── 2026-06-20 新增：德兰吉亚·法拉 ──
    { id: 'city_fala', name: '法拉', factionId: 'ansxi', lat: 32.3700, lng: 62.1100, type: 'stockade', region: 'PERSIAN', buildingStyle: 'PERSIAN', troops: 10000, note: '[前330年亚历山大进占弗拉达（普罗夫塔西亚）至安息苏伦家族锡斯坦北门法拉·法拉河畔泥砖高垣绿洲城] 亚历山大在此破获菲罗塔斯谋反案，伊斯塔赫里记法拉具生土泥砖内堡与枣椰巴扎，经成吉思汗与1383年帖木儿两度屠毁，生土夯筑泥墙（无石砖城垣）且≤1700年常住约5000–8000人<1万，定城寨。' },
    // ── 2026-06-20 新增：杜兰尼·坎大哈 ──
    { id: 'city_kandaha', name: '坎大哈', factionId: 'dulan_d', lat: 31.6289, lng: 65.7372, type: 'small_city', troops: 10000, region: 'PASHTUN', buildingStyle: 'PERSIAN' , note: '[亚历山大阿拉霍西亚至16至17世纪莫卧儿萨法维争霸重镇·厚重石基泥砖棱堡坚城] 阿富汗南路总锁钥坎大哈，1622与1649–1653年萨法维与莫卧儿三次十万大军围城争夺旧坎大哈坚固山腰垒城，17世纪常住军民商旅达2–3.5万（塔维尼埃记述），>1万定小城。' },

    // ── 2026-06-20 新增：呼罗珊·菲鲁兹库赫 ──
    { id: 'city_helate', name: '菲鲁兹库赫', factionId: 'huluo', lat: 34.396, lng: 64.516, type: 'small_city', troops: 10000, region: 'PERSIAN_CASTLE', buildingStyle: 'PERSIAN' , note: '[12世纪末至13世纪初古尔帝国夏都菲鲁兹库赫·哈里河峡谷石砖王城与宣礼塔] 吉亚斯丁与穆伊兹丁·古尔兄弟夏都（贾姆宣礼塔UNESCO遗址），朱兹贾尼《纳昔儿史话》详记两岸石砖宫堡跨桥相连，1222年窝阔台军毁城前谷地都邑常住约2–3万，>1万定小城。' },


    // ── 2026-06-20 新增：阿巴尔·尼沙布尔 ──
    { id: 'city_nishabuer', name: '尼沙布尔', factionId: 'sashan', lat: 36.2133, lng: 58.7958, type: 'medium_city', tier: 1, region: 'PERSIAN', buildingStyle: 'SASANIAN', troops: 10000, note: '[萨珊省治至9至12世纪塔希尔塞尔柱期·泥砖烧砖呼罗珊大邑] 塔希尔王朝都城至塞尔柱前期尼沙布尔（1153年乌古斯洗劫前）城垣与商坊达数十街区，城居峰值约12–20万（穆卡达西《地理志》及Chandler 1000–1100年表12.5万、Bulliet考算），>10万定中城。' },
    // —— 2026-06-20 新增：那竭国·顶骨城 ——
    { id: 'city_dinggucheng', name: '难揭', factionId: 'yinduxila', lat: 34.43, lng: 70.45, type: 'stockade', troops: 10000, region: 'PURU', buildingStyle: 'PURU', stockadeShape: 'rect', stockadeFence: 'HARDWOOD', note: '[前2世纪印度-希腊王国米南德一世至5至7世纪佛顶骨圣地那揭罗曷（难揭／贾拉拉巴德）·喀布尔河谷泥砖片石佛塔邑] 法显《佛国记》与玄奘《大唐西域记》卷二详记那揭罗曷国「城周二十余里，无大君长役属迦毕试，伽蓝虽多僧徒寡少」，7世纪已呈半荒废宗教聚落（莫卧儿贾拉拉巴德镇迟至1570年重建亦仅数千人），查无破万城居确数，定城寨。' },

    // —— 2026-06-20 新增：旁遮普·阿托克 ——
    { id: 'city_atuoke', name: '阿托克', factionId: 'xike', lat: 33.7666, lng: 72.3608, type: 'pass', region: 'PURU', buildingStyle: 'PURU', troops: 10000, note: '[莫卧儿阿克巴至锡克帝国·印度河渡口红砂岩石砖巨堡] 1581年阿克巴命筑阿托克石砖要塞（周逾一英里）锁控开伯尔山口东出渡印度河唯一咽喉，后哈里·辛格驻守（《阿克巴纪》），纯守渡口军事石堡且未成万人居民城，定险要。' },
    { id: 'city_meng', name: '蒙格', factionId: 'bulu', lat: 32.64744, lng: 73.50914, type: 'stockade', region: 'PURU', buildingStyle: 'PURU', troops: 10000, note: '[前326年五月亚历山大与印度波鲁斯王海达斯佩斯河决战渡岸蒙格（尼凯亚古址）·杰赫勒姆河南岸高丘泥砖村镇] 亚历山大击败波鲁斯战象大军后于战场南岸建纪念城尼凯亚（阿里安《远征记》V.19，斯坦因勘定今巴基斯坦旁遮普Mung土丘），希腊化后湮没为普通泥砖大村且查无人口数字，定城寨。' },
    { id: 'city_shwebo', name: '瑞波', factionId: 'konbaung', lat: 22.57, lng: 95.7, type: 'stockade', troops: 10000, region: 'SEASIA_IMPERIAL', buildingStyle: 'BURMESE', note: '[1700年前上缅甸穆河平原猎人小村木疏（Moksobo，雍笈牙1752年起兵称帝改都瑞波远超1700年红线）·竹木栅栏旱塬村落] 贡榜王朝开国君主雍笈牙筑木栅起兵定都瑞波在1752–1753年（违反≤1700年红线，18世纪中叶都城人口不采）；≤1700年木疏仅为三百余户无城墙猎农小村（《琉璃宫史》），定城寨。' },

    { id: 'city_hengyu', name: '横屿', factionId: 'ming_d', lat: 26.77, lng: 119.7, type: 'stockade', isPort: true, troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[明嘉靖四十一年（1562）戚继光踏烂泥破倭老巢横屿大捷·福建宁德三都澳近岸泥涂孤岛木栅贼巢] 倭寇数千盘踞宁德海滩涨潮成岛、退潮陷泥之横屿立双层木栅大营数年，戚继光命士卒人持草束填泥仰攻焚破木寨斩首二千六百（《明史·戚继光传》《纪效新书》），纯海岛木栅营寨无居民城，定城寨。' },


    { id: 'city_luobo', name: '罗博', factionId: 'buyi_d', lat: 25.4112, lng: 106.7377, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[宋元罗番罗甸南界至明清黔南红水河畔仲家（布依族）韦氏王氏土司寨聚罗博（罗甸）·樟江河谷干栏竹木山寨] 地处贵州南部红水河炎瘴低谷（清置罗斛厅更在乾隆四十七年1782超限，《黔南识略》），≤1700年纯属布依族干栏木楼村寨无城墙且单寨不足2000人，定城寨。' },

    { id: 'city_situo', name: '思陀', factionId: 'ming_d', lat: 23.2243, lng: 102.8485, type: 'stockade', region: 'BASHU',
buildingStyle: 'BASHU', troops: 10000,
        note: '[元置和泥路思陀甸长官司至明洪武置思陀甸长官司（哈尼族李氏土司世袭）·哀牢山红河西岸梯田土掌房山寨] 滇南红河哈尼族（古和泥）溪处、思陀、落恐诸土司之一（《元史·地理志》《明史·云南土司传》），高山云海梯田夯土平顶房（土掌房）村寨无城郭且单寨仅一二千人，定城寨。',
    },
    { id: 'city_shangding', name: '上丁', factionId: 'lancang', lat: 13.5581, lng: 106.0098, type: 'stockade', region: 'SEAS',
        // 🔴 [2026-09-18 主人定] 原 'SEAS' 只是一级母体、无二级/三级 → 按真实地理历史归**高棉 KHMER**：
        //    上丁（Stung Treng）在今柬埔寨北部，湄公河畔高棉故地（巴沙/占巴塞一带）。
        buildingStyle: 'KHMER', troops: 10000,
        note: '[真腊水陆道要津至15至17世纪澜沧王国南境湄公河孔恩瀑布下水陆换船埠上丁·色公河入湄公口高脚木屋商镇] 因上游孔恩大瀑布阻断舟楫而成老挝下寮至柬埔寨木材象牙换船集镇（《老挝史》），全为木竹干栏民居无城墙且≤1700年常住不足4000人，定城寨。',
    },
    // ── 2026-06-12 新增：夏顿@廷布 ──
    { id: 'city_tingbu', name: '廷布', factionId: 'xiadun', lat: 27.472, lng: 89.639, type: 'stockade', troops: 10000, region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', note: '[1641年夏仲阿旺朗杰统一不丹建扎西却宗（廷布宗）为夏宫政教署·旺楚河谷石木大宗寺与散居农庄] 不丹夏仲法王制度下廷布扎西却宗仅为政府夏季驻锡寺院宗堡（冬季迁普那卡宗），17–19世纪英使博格尔与彭伯顿亲访实记河谷全无市镇街坊，仅宗内数百喇嘛官役与谷坡零星农舍，定城寨。' },

    { id: 'city_huangchuan', name: '弋阳', factionId: 'caowei', lat: 32.131, lng: 115.051, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[春秋弦黄古国、三国魏弋阳郡治（贾逵经营）至唐光州弋阳郡南宋抗金榷场重镇·潢水南北条石包砖双城] 全国唯一保存潢水隔江相望南北两座独立砖石城垣之州治，南宋端平间光州军民浴血抗蒙，明洪武因宋基重修南北双砖石城（《三国志·贾逵传》《光州志》），南北双城商民达2–3万，>1万定小城。' },

    { id: 'city_yongqiu', name: '雍丘', factionId: 'dongjin', lat: 34.55, lng: 114.78, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[夏商杞国都城、楚汉高祖破章邯雍丘、东晋祖逖北伐镇雍丘至唐张巡守雍丘·汴南夯土包砖紧邻京畿名邑] 至德元载（756）张巡率数千兵合城民据雍丘孤城六十日挫令狐潮四万叛军（《新唐书·张巡传》），北宋为开封府东畿赤县、金改杞县，明包砖筑城，盛期畿邑城居逾1.2–2万，>1万定小城。' },


    { id: 'city_mengcheng', name: '蒙城', factionId: 'song', lat: 33.27, lng: 116.56, type: 'stockade', region: 'CENTRAL', buildingStyle: 'CENTRAL', troops: 10000, note: '[两汉沛郡山桑至唐天宝蒙城县·涡水畔夯土县城] 汉山桑县、唐天宝元年改蒙城县，北宋为亳州属县（《新唐书·地理志》《宋史·地理志》），唐宋代表阶段为夯土小县城且查无城居破万史料，定城寨。' },
    { id: 'city_yongcheng', name: '永城', factionId: 'han_d', lat: 33.93, lng: 116.37, type: 'stockade', region: 'CENTRAL', buildingStyle: 'CENTRAL', troops: 10000, note: '[秦汉芒砀二县至隋唐永城县·芒砀山南麓夯土县邑] 汉高祖隐于芒砀山泽、萧何起沛丰旁邑，隋大业六年置永城县（《史记·高祖本纪》《隋书·地理志》），汉唐阶段为夯土县城且城居不足1万，定城寨。' },
    { id: 'city_kunyang', name: '昆阳', factionId: 'han_d', lat: 33.22, lng: 113.22, type: 'stockade', region: 'CENTRAL', buildingStyle: 'CENTRAL', troops: 10000, note: '[新莽地皇四年昆阳大战·汝坟南道夯土小县城] 《后汉书·光武帝纪》明载王寻、王邑率大军围昆阳时「城中唯有八九千人」（含守军与全城吏民合计八九千口），按1万整不设容差硬线，<1万且为汉代夯土墙，定城寨。' },
    { id: 'city_yucheng', name: '虞城', factionId: 'hou_liang', lat: 34.7758, lng: 116.0678, type: 'stockade', region: 'CENTRAL', buildingStyle: 'CENTRAL', troops: 10000, note: '[夏商虞国故邑至汉唐五代虞城县·豫东黄河故道夯土县城] 汉梁国虞县、隋唐五代宋州虞城县（《汉书·地理志》《旧五代史》），五代以前为夯土小县城且查无城居逾万史料，定城寨。' },
    { id: 'city_bengbu', name: '钟离', factionId: 'ming_d', lat: 32.92, lng: 117.38, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[春秋钟离国、南朝梁天监六年韦睿曹景宗钟离大捷至唐宋濠州及明洪武中都凤阳皇城·淮河南岸包砖巨石中都城] 梁韦睿守钟离破北魏元英八十万众（《梁书·韦睿传》），朱元璋龙兴濠州，洪武二年至八年建中都大明皇城与周五十里外郭砖石城垣（《明史·地理志》《中都志》），明代凤阳府卫同城达4–6万，>1万定小城。' },




    { id: 'city_liaocheng', name: '聊城', factionId: 'wei', lat: 36.4322, lng: 115.9552, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL' , note: '[战国燕将守聊城鲁仲连射书、唐宋博州博平郡至明会通河漕运巨埠东昌府·东昌湖环水周六里包砖光岳楼方城] 明永乐疏浚会通河后东昌府与临清并列山东运河两大都会（《明史·河渠志》称「东昌繁庶甲齐鲁」），洪武五年筑包砖水城与光岳楼，城内及运河东西关厢达4–6万，>1万定小城。' },


    { id: 'city_sapi', name: '萨毗营', factionId: 'tubo', lat: 37.631470, lng: 88.884888, type: 'stockade', region: 'TIBET',
buildingStyle: 'TIBET', troops: 10000,
        note: '[南北朝苏毗女国北境至唐吐蕃萨毗军节度营地·柴达木盆地西南昆仑北麓戈壁河口牧屯] 敦煌古藏文文书与《新唐书·吐蕃传》所载吐蕃控制西域南道与青海通道之萨毗部军牧营点，高寒荒漠绿洲无砖石城垣且不足3000人，定城寨。',
    },
    { id: 'city_shayuan', name: '长宁', factionId: 'tang', lat: 35.0032, lng: 109.9319, type: 'small_city', region: 'CENTRAL', buildingStyle: 'CENTRAL', troops: 10000, note: '[西魏大统三年宇文泰沙苑大捷、唐三辅之东辅同州冯翊郡（长宁近辖）·洛渭交汇夯土包砖京畿大州] 关中东大门三辅重镇同州（与华州、岐州夹辅长安，《旧唐书·地理志》同州户60,928并设沙苑监牧马），明嘉靖大地震后重筑包砖同州城，唐明州城在籍人口达2–3.5万，>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」推出的二级与史实不符 → 归 CENTRAL_ASIA：噶斯口：若羌—阿尔金山口，塔里木
    { id: 'city_gasikou', name: '噶斯口', factionId: 'khoshut', lat: 38.078345, lng: 89.288635, type: 'stockade', troops: 10000, region: 'TIBET', buildingStyle: 'TIBET', note: '[吐蕃至17世纪青海和硕特顾实汗右翼西境牧卡噶斯口·阿尔金山南麓柴达木西端入疆古道水草营口] 控青海柴达木西越阿克赛钦或若羌之荒漠山口游牧卡点（《西宁府新志》《青海记》），名不带关隘堡戍且荒漠无城墙，常住牧卒不足千人，定城寨。', mirror: true },


    { id: 'city_niubiziliang', name: '牛鼻子梁', factionId: 'golog', lat: 37.838198, lng: 91.678162, type: 'stockade', troops: 10000, region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', note: '[吐蕃至明清青海和硕特北境穿阿尔金山入敦煌罗布泊旱道牛鼻子梁·柴达木西北冷湖戈壁盐滩歇驼站] 处于极端干旱雅丹戈壁商驼猎径歇脚高梁（《西域图志》），无城垣且仅季节性游牧巡卡数百人，定城寨。' },

    { id: 'city_mahaitai', name: '马海台', factionId: 'khoshut', lat: 38.045995, lng: 94.622498, type: 'stockade', troops: 10000, region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', note: '[唐吐蕃青海西道至17世纪和硕特右翼柴达木北缘马海绿洲·祁连山党河南山南麓荒漠泉草牧营] 大柴旦北马海盆地内陆河尾闾胡杨草滩牧场（《西宁府新志》），毡帐游牧冬窝子无城墙且不足千人，定城寨。' },

    { id: 'city_taijinaier', name: '台吉乃尔', factionId: 'khoshut', lat: 36.4266, lng: 94.896, type: 'stockade', troops: 10000, region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', note: '[唐开元十五年王君㚟袭吐蕃大非川西走青海西境至17世纪和硕特台吉乃尔扎萨克旗牧地·台吉乃尔双湖芦苇草滩牧营] 顾实汗后裔色布腾扎勒受封青海和硕特西右中旗（台吉乃尔旗）驻牧那棱格勒河与东西台吉乃尔湖畔（《蒙古游牧记》卷十二），内陆盐湖草甸毡帐无城垣，定城寨。' },



    { id: 'city_gasinaoer', name: '尕斯淖尔', factionId: 'khoshut', lat: 38.3593, lng: 90.1334, type: 'stockade', troops: 10000, region: 'TIBET_IMPERIAL', buildingStyle: 'TIBET', note: '[吐蕃通婼羌古道至17世纪青海和硕特西端牧地尕斯库勒湖（尕斯淖尔）·铁木里克河入湖草甸冬牧营] 柴达木最西端不冻泉草滩牧场（《青海记》），毡帐游牧驻点无城墙且常住不足千人，定城寨。', mirror: true },




    { id: 'city_biaoshi', name: '表氏', factionId: 'juqu_d', lat: 39.8, lng: 99.8, type: 'stockade', troops: 10000, region: 'STEPPE_FEUDAL', buildingStyle: 'HEXI', note: '[西汉元鼎置张掖郡表氏县至东晋隆安沮渠蒙逊起兵建北凉骆驼城·黑河南岸高台戈壁夯土双城] 隆安元年（397）匈奴沮渠蒙逊伯侄起兵拔临松屯据建康郡表氏（高台骆驼城遗址南北夯土城面积约0.3平方公里，《汉书·地理志》《晋书·沮渠蒙逊载记》），魏晋后沙化荒废，夯土小城不足6000人，定城寨。' },

    { id: 'city_hakone', name: '箱根关', factionId: 'hojo', lat: 35.1861, lng: 138.9999, type: 'pass', region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', troops: 10000, note: '[镰仓战国北条氏至江户幕府·芦之湖山道石垣番所大关] 扼东海道翻越箱根外轮山咽喉，战国后北条氏设水陆关防、元和五年德川幕府定筑石垣关门严查「入铁炮出女」（《吾妻镜》《德川实纪》），带「关」字且具石垣，未成万人城，定险要。' },
    // 🔴 [2026-09-19 主人令「源义经新建镰仓，据点可以错位，错位的时候要两边据点都要一点一点移动」]
    //    **镰仓** —— 源赖朝 1180 年于此设幕府，是源氏（镰仓殿）的政权中枢；
    //    原来一之谷的攻方写成奥州藤原氏（据点柳之御所，在东北），与史实不符。
    //    坐标 **35.3195,139.5503 为镰仓真实位置，未做任何位移**；
    //    为满足「据点间距 ≥50km」，改为**相邻两处各微调**：
    //      · 箱根关西移 3km（35.1925,139.0261 → 35.1861,138.9999，更靠其真址小田原）
    //      · 江户城东北移 9km（35.68,139.76 → 35.75,139.8007）
    //    结果间距全部 ≥50km：镰仓↔箱根关 52.1 / 镰仓↔江户城 53.0 / 江户城↔箱根关 95.9。
    { id: 'city_kamakura', name: '镰仓', factionId: 'genji', lat: 35.3195, lng: 139.5503, type: 'medium_city', isPort: true, troops: 10000, region: 'JAPAN', buildingStyle: 'JAPAN' , note: '[13世纪镰仓幕府执权盛期·切通山隘土垒武家都城] 北条执权后期镰仓七口切通与由比滨连片武家屋敷町屋建成区，城居峰值约8–12万（河野真一郎镰仓考古及鬼头宏估6–10万、Chandler 1250年表估20万，取审慎区间8–12万），≥8万定中城。' },

    { id: 'city_osaka', name: '大阪', factionId: 'toyotomi', lat: 34.6873, lng: 135.5262, type: 'medium_city', isPort: true, troops: 20000, region: 'JAPAN', buildingStyle: 'JAPAN', note: '[丰臣至江户元禄期·巨石垣水网商都] 江户元禄十二年（1699）大坂三乡町人实测345,524人、元禄十六年（1703）351,708人，合城代武家约36–38万（《新修大阪市史》实测户籍，宝历年间1749年方破40万），≤1700年未满40万，定中城。', },





    { id: 'city_fuwa', name: '不破关', factionId: 'toyotomi', lat: 35.3577, lng: 136.4602, type: 'pass', troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[日本飞鸟奈良三关至战国关原·美浓山峡夯土版筑关塞] 壬申之乱（672）后天武天皇置律令三关之首不破关扼东山道咽喉，考古发掘确证瓦顶城门与夯筑土垒关墙（《日本书纪》及岐阜不破关迹发掘报告），带「关」字且具夯土墙，未成万人城，定险要。', mirror: true },

    { id: 'city_cheollyeong', name: '铁岭关', factionId: 'goryeo', lat: 38.8102, lng: 127.4959, type: 'pass', troops: 10000, region: 'SONG', buildingStyle: 'KOREA', note: '[高丽末至朝鲜王朝·太白山脉东北界道石筑关隘] 扼江原道北入咸镜道唯一山岭孔道，高丽恭愍王收复双城后及朝鲜世宗筑石城关门戍守（《高丽史·地理志》《新增东国舆地胜览》），带「关」字且具石墙，未成万人城，定险要。' },

    { id: 'city_penghu', name: '澎湖', factionId: 'manzhou_d', lat: 23.5, lng: 119.5, type: 'stockade', isPort: true, troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[元至元立澎湖巡检司、明天启沈有容俞咨皋驱荷拆红毛木石小城至康熙二十二年施琅克澎湖·妈宫港水师澳寨] 天启四年明军攻毁荷兰风柜尾临时乱石土城，康熙二十二年（1683）施琅破明郑刘国轩于澎湖设水师副将驻防（澎湖砖石厅城迟至光绪十三年1887方筑，超限不采，《澎湖纪略》），≤1700年无城墙且渔军数千人<1万，定城寨。' },

    { id: 'city_fengtian', name: '奉天', factionId: 'tang', lat: 34.53, lng: 108.24, type: 'small_city', region: 'CENTRAL', buildingStyle: 'CENTRAL', troops: 10000, note: '[唐光宅置奉天县拱护乾陵、建中四年唐德宗奉天之难浑瑊死守行在至后唐乾州·梁山南麓夯土包砖子母双城] 建中四年（783）泾原兵变德宗奔奉天，浑瑊率神策军与城民拒朱泚十万大军围攻月余，战后扩筑罗城升赤县（《旧唐书·浑瑊传》《奉天录》），唐行在赤县及宋明乾州城居约1.5–2.5万，>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」推出的二级与史实不符 → 归 CENTRAL_ASIA：它乾城：东汉西域都护治所，塔里木
    { id: 'city_taqian', name: '它乾城', factionId: 'han_d', lat: 41.875, lng: 83.59, type: 'stockade', troops: 10000, region: 'KHITAN', buildingStyle: 'WESTERN', mirror: true , note: '[东汉永元西域都护班超驻治·龟兹境夯土驻戍屯城] 《后汉书·西域传》《班超传》载永元三年复置西域都护居龟兹它乾城（新和通古斯巴什夯土古城周仅约1公里），系汉军驻防夯土小城且人口不足5000，定城寨。' },

    { id: 'city_shaozhou', name: '邵州', factionId: 'machu', lat: 27.24, lng: 111.47, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[三国吴昭陵郡、五代马楚敏州至南宋理宗潜邸升宝庆府及明宝庆府·资水邵水汇口青石条砌包砖铁打宝庆城] 素有「铁打宝庆」之誉，南宋绍定升府，明洪武六年指挥黄荣临资水采巨青条石包砖修筑周九里宝庆府坚城（顺治间屡经腾蛟与清军拉锯，《宝庆府志》），湘中水陆重镇城居达2.5–3.5万，>1万定小城。' },

    { id: 'city_zizhou_d', name: '梓州', factionId: 'qianshu', lat: 31.0788, lng: 105.0925, type: 'small_city', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU' , note: '[隋梓州新城郡、唐剑南东川节度使首府（与成都并称东西两川）至五代前蜀后蜀宋潼川府·涪江郪江条石包砖节度大城] 杜甫旅居梓州、唐代统领东川十五州军政财赋之藩府梓州治郪县（《新唐书·地理志》梓州户61,824、《宋史·地理志》潼川府户逾十万），明修条石城垣，唐宋节度帅府在城达3–5万，>1万定小城。' },


    { id: 'city_qingchi', name: '清池', factionId: 'you', lat: 38.3, lng: 116.83, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[北魏置浮阳沧州、隋改清池至中晚唐横海军节度使治所沧州及明长芦盐运司沧州城·京杭运河包砖盐漕重镇] 唐宪宗平李师道后设横海军节度镇清池（旧沧州铁狮子遗址），明初迁今沧州筑包砖城并设长芦都转运盐使司统辖北方海盐（《旧唐书·地理志》《沧州志》），节度藩城及明盐运司城达2.5–4万，>1万定小城。' },
    { id: 'city_shandan', name: '删丹', factionId: 'huihu', lat: 38.78, lng: 101.08, type: 'stockade', troops: 10000, region: 'STEPPE_FEUDAL', buildingStyle: 'HEXI', note: '[西汉张掖郡删丹县（焉支山麓霍去病破匈奴处）、宋西夏甘州东翼至明山丹卫·焉支山北夯土卫城] 明洪武二十三年置山丹卫筑周七里黄土夯筑卫城（《明史·地理志》《甘镇志》明载山丹卫城在明代为纯夯土城垣未包青砖），苦寒峡口军屯卫城在城军余约5000–7000人<1万，定城寨。' },

    { id: 'city_chongan', name: '崇安', factionId: 'minyue', lat: 27.76, lng: 118.02, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[西汉闽越王城（城村汉城）·武夷山南麓夯土宫城邑聚] 闽越王无诸、繇君丑王城（武夷山城村汉城遗址面积0.48平方公里夯土城垣，《史记·东越列传》及福建博物院发掘报告），城圈不足半平方公里、城居约5000–8000人<1万且为夯土墙，定城寨。' },
    { id: 'city_piyetuo', name: '毗耶陀', factionId: 'funan', lat: 11.66, lng: 104.93, type: 'small_city', troops: 10000, region: 'SEASIA_ANTIQUITY', buildingStyle: 'KHMER', mirror: true , note: '[2至6世纪扶南王国都城特牧城（毗耶陀补罗）·巴普农山麓环壕土垣都邑] 《梁书·扶南国传》所载「城周三十余里」之扶南国都毗耶陀补罗（波萝勉省Ba Phnom考古区），扶南极盛期王城建成区人口约1.5–2.5万（Coedès及Stark扶南考古），>1万定小城。' },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「SEAS」推出的二级与史实不符 → 归 KHMER：琅勃拉邦：澜沧（寮）王国，湄公河—吴哥文化圈
    { id: 'city_langbolabang', name: '琅勃拉邦', factionId: 'lancang', lat: 20.0469, lng: 102.2292, type: 'small_city', troops: 10000, region: 'SONG', buildingStyle: 'KHMER' , note: '[14至16世纪中叶老挝澜沧王国法昂开国古都勐苏瓦·湄公南康两河交汇砖木王城] 1353年法昂立澜沧王国定都勐苏瓦（后迎勃拉邦金佛改名琅勃拉邦），至1560年塞塔提腊迁万象前为上寮商政中心，连片王城寺坊人口约1.5–2万（Stuart-Fox《老挝史》），>1万定小城。' },

    { id: 'city_geergang', name: '戈尔冈', factionId: 'ahaomu', lat: 27.479, lng: 94.8889, type: 'small_city', troops: 10000, region: 'BENGALIS', buildingStyle: 'BENGALIS', note: '[16至17世纪阿萨姆阿豪姆王国首都戈尔冈·烧砖宫城（Kareng Ghar）与竹刺高堤外郭] 1540年苏克伦蒙定都戈尔冈，1662年莫卧儿名将米尔·朱姆拉占城时随军史官希哈布丁·塔利什《阿萨姆征服记》详载其烧砖宫门与稠密坊巷，盛期城居约2–3万，>1万定小城。' },

    { id: 'city_huma', name: '呼玛', factionId: 'elunchunzu', lat: 51.72, lng: 126.65, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'NORTHEAST' , note: '[17世纪达斡尔鄂伦春呼玛尔河口窝集与1655年清军明安达礼围攻俄哥萨克斯特潘诺夫呼玛尔木寨·黑龙江右岸原木土垒寨] 顺治十二年俄人据呼玛尔河口筑原木夹土小寨抗清军围攻旋弃（《清世祖实录》《平定罗刹方略》，清设呼玛卡伦金厂更在晚清），木土小寨且常住鄂伦春猎户不足千人，定城寨。' },

    { id: 'city_cangyuan', name: '沧源', factionId: 'manzhou_d', lat: 23.3725, lng: 99.4263, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[明代孟定耿马土司南邻阿佤山葫芦王地（清乾隆茂隆银厂兴于1743年后超限）·澜沧江怒江间竹木牛头桩佤寨] 明清之际滇西南佤族司岗里部族聚居深山（茂隆银厂吴尚贤聚矿工数万在乾隆八年1743以后，违反≤1700年红线不采），≤1700年纯木竹干栏刺竹壕沟佤寨且单寨仅一二千人，定城寨。' },

    { id: 'city_huoluoge', name: '霍罗格', factionId: 'tajikezu', lat: 37.49, lng: 71.55, type: 'stockade', troops: 10000, region: 'WESTERN_IMPERIAL', buildingStyle: 'WESTERN', note: '[唐识匿国（五个山谷部族）至中世纪帕米尔舒格南伯克山寨霍罗格·喷赤河与贡特河交汇高寒石木山村] 慧超《往五天竺国传》与《新唐书·西域传》载识匿国「散居山谷有五大城涧，地寒无五谷」（俄军帕米尔哨所建于1895年超限），深谷石木小寨常住仅千余人，定城寨。' },

    { id: 'city_mizhina', name: '密支那', factionId: 'jingpozu', lat: 25.38, lng: 97.4, type: 'stockade', troops: 10000, region: 'BURMESE', buildingStyle: 'BURMESE' , note: '[元征缅江头城北道至东吁时期上缅甸伊洛瓦底江上游景颇（克钦）与掸族渡口寨聚密支那·江岸竹木栅村] 控迈立开江与恩梅开江合流下八莫水路之掸语「大江边」渡村（英属铁路城镇兴于1890年代后），≤1700年仅为竹木高脚屋集镇无砖石城垣且常住不足5000人，定城寨。' },

    { id: 'city_sandou', name: '三都', factionId: 'shuizu', lat: 25.98, lng: 107.87, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[唐抚水州水族源地至元明都匀烂土合江州陈蒙蒙氏土司辖境三都·都柳江上游水族干栏木楼村寨] 黔南九阡三洞水族聚居山林河谷（清设三脚屯州同在雍正十年1732后超限，《贵州通志》），≤1700年全为杉木干栏村寨无城墙且常住不足3000人，定城寨。' },

    { id: 'city_tanzhong', name: '潭中', factionId: 'tang', lat: 24.28, lng: 109.41, type: 'small_city', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN' , note: '[西汉潭中县、唐柳宗元刺柳州龙城郡至明洪武包砖柳州府卫同城·柳江壶城三面环水条石包砖周七里桂中重镇] 元和十年柳宗元任柳州刺史兴学凿井，明洪武十二年桂林右卫分调置柳州卫并采青石火砖环江筑城、嘉靖名将沈希仪镇柳庆（《旧唐书·柳宗元传》《柳州府志》），卫府同城商民约1.5–2.5万，>1万定小城。' },
    { id: 'city_yunyang', name: '郧阳', factionId: 'ming_d', lat: 32.8127, lng: 110.8122, type: 'small_city', troops: 10000, region: 'MING', buildingStyle: 'CENTRAL' , note: '[汉钖县、宋明郧县至成化十二年平荆襄流民特设郧阳抚治及郧阳府·汉江北岸条石包砖周六里三省军门府城] 成化间原杰抚安荆襄百余万流民，奏置郧阳府并设郧阳巡抚都御史开府节制鄂豫陕川四省交界兵备，修筑坚固条石包砖府卫城（《明史·原杰传》《郧阳府志》），抚治军门及汉水码头城居达2–3万，>1万定小城。' },
    { id: 'city_zhongshan', name: '中山', factionId: 'murong', lat: 38.4708, lng: 115.0626, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[战国中山与十六国后燕都城卢奴·夯土都城垣] 后燕慕容垂定都中山（卢奴，今定州）及北魏定州、北宋定州军城，夯土（明包砖）城垣内历代城居峰值约5–7万（《晋书·慕容垂载记》《宋史·地理志》定州在城折算），未达8万容差线，定小城。' },
    { id: 'city_ledou', name: '乐都', factionId: 'tang', lat: 36.49, lng: 102.37, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[西汉神爵二年赵充国破羌置破羌县、十六国南凉秃发乌孤初都廉川至唐陇右节度使治所鄯州·湟水北岸夯土军州城] 开元天宝间哥舒翰、皇甫惟明镇陇右节度驻鄯州湟水县，《旧唐书·地理志》明载天宝极盛期鄯州全州三县合计仅「户五千三百八十九，口二万七千二百一十九」，州治在城军民不足8000人且唐代为夯土城垣，定城寨。', mirror: true },



    { id: 'city_xuecheng', name: '薛寨', factionId: 'tang', lat: 31.43, lng: 103.16, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[唐维州保州薛城戍（大中三年收复三州之一）至明威州保县薛城千户所·岷江支流杂谷脑河峡谷片石土垒羌藏小所寨] 扼威州西入孟董九子嘉绒藏寨峡谷咽喉（非带关名关，系唐薛城县与明洪武小千户所，《新唐书·吐蕃传》《四川通志》），高山深谷狭仄小邑常住不足3000人，定城寨。' },
    { id: 'city_zhangguojuncheng', name: '彰国军城', factionId: 'shatuo', lat: 39.5761, lng: 113.1894, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[唐末沙陀李克用置金城应州、后唐明宗李嗣源龙潜升彰国军节度至辽应州木塔名城·桑干河南岸夯土包砖节度州城] 辽清宁二年建高67米释迦木塔，辽应州彰国军节度领浑源等三县为西京道南屏富邑，明洪武八年包砖修筑周七里应州城抗瓦剌俺答（《辽史·地理志》《应州志》），辽明州城常住约1.5–2.5万，>1万定小城。' },

    { id: 'city_yunzhongcheng', name: '君子津', factionId: 'han_d', lat: 40.2732, lng: 111.1404, type: 'stockade', troops: 10000, region: 'CENTRAL', buildingStyle: 'XIANBEI', note: '[战国赵武灵王置云中郡治故址旁黄河东折渡口君子津（东汉威虏津、北魏拓跋珪渡河破刘卫辰处）·托克托河岸夯土津聚] 登国六年（391）北魏道武帝自君子津乘冰渡河奇袭铁弗匈奴刘卫辰（《水经注·河水》《魏书·太祖纪》），名字不带关隘堡戍且系古渡口夯土村邑，常住<1万，定城寨。' },

    { id: 'city_haomen', name: '浩门', factionId: 'manzhou_d', lat: 37.464, lng: 101.4258, type: 'stockade', troops: 10000, region: 'MANCHU', buildingStyle: 'HEXI', note: '[西汉元狩二年霍去病出陇西置金城郡浩亹县（东汉马武邓训讨羌战地）·大通河（浩亹水）门源峡谷夯土小边县] 控祁连山南麓大通河谷通道之汉代边县，东汉屡经羌乱残破（《汉书·地理志》《后汉书·邓训传》），高寒河谷夯土小县城常住不足4000人，定城寨。' },
    { id: 'city_yulin', name: '榆林', factionId: 'ming_d', lat: 38.3567, lng: 109.7644, type: 'small_city', troops: 10000, region: 'WEI', buildingStyle: 'WEI' , note: '[明正统筑榆林庄堡、成化九年巡抚余子俊移延绥镇总兵驻榆林卫·红山榆溪河三拓南城中城北城条石包砖九边雄镇] 号称「九边重镇、小北京」，成化弘治正德三次南北拓城连成十三里条石包砖巨垣与星罗骑营，九边互市与卫所将士商民常住达3.5–5万（《延绥镇志》《明史·余子俊传》），>1万定小城。' },
    { id: 'city_jingbianbao', name: '靖边堡', factionId: 'dangxiang', lat: 37.5685, lng: 108.8608, type: 'pass', troops: 10000, region: 'TANGUT', buildingStyle: 'HEXI', note: '[明成化十一年延绥镇长城防线·毛乌素南缘夯土包砖营堡] 明巡抚余子俊修筑延绥边墙东起清水营西抵花马池，置靖边营堡屯军拒河套鞑靼（《明史·余子俊传》《延绥镇志》），名带「堡」且具夯土包砖城垣，纯守边军堡未成万人城，定险要。' },
    { id: 'city_quyancheng', name: '朐衍', factionId: 'han_d', lat: 37.7794, lng: 107.4078, type: 'stockade', troops: 10000, region: 'HEXI', buildingStyle: 'HEXI', note: '[战国秦昭襄王灭义渠朐衍戎置煦衍县（西汉北地郡盐池县邑）·鄂尔多斯南缘花马池盐湖夯土小邑] 《史记·匈奴列传》岐梁北有义渠大荔乌氏朐衍之戎，汉置煦衍县管盐官（东汉荒废，《汉书·地理志》），干旱荒原夯土小县人口无载<1万，定城寨。' },

    { id: 'city_lishi', name: '离石', factionId: 'han_zhao', lat: 37.48, lng: 111.09, type: 'stockade', troops: 10000, region: 'NORTH', buildingStyle: 'WEI' , note: '[东汉末匈奴左部至十六国汉赵起兵地·吕梁山谷夯土郡县小城] 东汉西河郡南徙离石（《续汉书·郡国志》西河全郡十三城仅5,698户），元熙元年（304）刘渊于离石左国城称汉王（《晋书·刘元海载记》），夯土山谷小城且城居不足1万，定城寨。' },
    { id: 'city_chiwubao', name: '赤乌堡', factionId: 'han_d', lat: 37.477, lng: 102.8815, type: 'stockade', troops: 10000, region: 'CENTRAL', buildingStyle: 'HEXI', note: '[西汉武威郡苍松南境乌逆水赤乌镇（三国姜维出石营经苍松赤乌、前凉张轨置武兴郡地）·乌鞘岭东麓夯土军屯小聚] 控河西走廊翻越乌鞘岭咽喉旁之汉晋赤乌聚落（今古浪天祝间，史名赤乌镇聚而非明修砌墙军堡，《水经注》《晋书·地理志》），查无夯土石砖关墙遗存且常住不足3000人，定城寨。' },


    { id: 'city_wulihong', name: '乌利洪', factionId: 'menggu_d', lat: 49.53, lng: 112.54, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[12世纪末成吉思汗创业功臣忙忽部畏答儿驻牧地乌利洪·克鲁伦河土拉河分水草原毡帐营盘] 畏答儿率忙忽部精骑血战阔亦田受封世袭千户牧地（《元史·畏答儿传》），漠北纯草原毡帐牧营无城郭，定城寨。' },
    { id: 'city_mubang', name: '木邦', factionId: 'xingwei', lat: 23.32, lng: 97.98, type: 'stockade', troops: 10000, region: 'BURMESE', buildingStyle: 'BURMESE' , note: '[元木邦路总管府至明永乐二年升木邦军民宣慰使司（掸邦北部兴威Hsenwi）·瑞丽江支流南渡河竹木夯土司城] 明代滇缅边境六慰大土司之一木邦罕氏，助明征麓川、万历间遭东吁莽应里攻破焚掠（《明史·云南土司传》），掸族坝子夯土矮堤竹木栅王寨无砖石城墙且司城常住约5000–8000人<1万，定城寨。' },
    { id: 'city_baihage', name: '白哈格', factionId: 'saerbadaer', lat: 36.21, lng: 57.68, type: 'stockade', troops: 10000, region: 'PERSIAN_CASTLE', buildingStyle: 'PERSIAN', note: '[11世纪史学家拜哈基故乡至1337至1381年呼罗珊萨尔巴达尔起义国首都萨卜泽瓦尔（白哈格区）·泥砖城垣绿洲邑] 反抗伊利汗国暴政建立之什叶派平民国家萨尔巴达尔都城，1383年帖木儿破城屠杀将生人筑入泥砖塔中彻底夷毁（伊本·白图泰游记及哈菲兹·阿布鲁《史汇》），生土泥砖墙且灾后≤1700年常住不足1万确数，定城寨。', stockadeShape: 'square', stockadeFence: 'HARDWOOD' },
    { id: 'city_damugan', name: '达姆甘', factionId: 'seljuq', lat: 36.17, lng: 54.35, type: 'small_city', troops: 10000, region: 'PERSIAN_CASTLE', buildingStyle: 'PERSIAN', note: '[安息早期百门王都赫卡托姆皮洛斯至塞尔柱库米斯省首府达姆甘·烧砖泥砖城垣丝路大邑] 帕提亚早期王都百门之城（波利比乌斯X.28、斯特拉波XI.9.1），伊斯兰至塞尔柱时期为呼罗珊大道库米斯省会（塔里哈内清真寺现存，穆卡达西《地理志》记其城郭繁盛），盛期城居约1.5–2.5万，>1万定小城。', stockadeShape: 'square', stockadeFence: 'HARDWOOD' },
    { id: 'city_bistam', name: '比斯塔姆', factionId: 'sashan', lat: 36.48, lng: 55.00, type: 'small_city', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN', note: '[萨珊北境重邑至塞尔柱伊利汗国丝路名城比斯塔姆·石砖多塔城垣与苏菲圣祠群] 扼呼罗珊大道入里海山口之比斯塔姆，现存萨珊至伊利汗国烧砖清真寺群与带圆塔城垣，10–14世纪穆卡达西与哈姆杜拉·穆斯陶菲《心悦志》记其为商业重邑，城居约1–1.5万，定小城。' },
    // [2026-08-19 修] region 原为 WEST_ASIA，与紧邻的达姆甘、加兹温（均 CENTRAL_ASIA）不一致：
    // 三城同在伊朗高原北路（呼罗珊大道）上首尾相接，文化同质，雷伊无 note 说明为何单列西亚。
    // 本项目 WEST_ASIA 的定义是安纳托利亚/黎凡特/阿拉伯/埃及/两河，不含伊朗高原。
    { id: 'city_leiyi', name: '雷伊', factionId: 'seljuq', lat: 35.6, lng: 51.44, type: 'medium_city', troops: 10000, region: 'SASANIAN', buildingStyle: 'PERSIAN' , note: '[10至12世纪白益与塞尔柱王朝期·泥砖烧砖穆罕默迪耶巨城] 1220年蒙古屠城前雷伊（古拉格斯）为波斯北部第一大都会，城垣与拉巴特坊市峰值约10–20万（伊本·豪卡勒称其仅次巴格达，Chandler 1000–1100年表10万），≥10万定中城。' },
    { id: 'city_lihaimen', name: '里海门', factionId: 'aqimeinide', lat: 35.25, lng: 52.34, type: 'stockade', troops: 10000, region: 'ORIE', buildingStyle: 'PERSIAN', stockadeShape: 'trapezoid', stockadeFence: 'ARCHAIC', note: '[前4世纪阿契美尼德末期·厄尔布尔士山南麓天然峡道驿聚] 前330年亚历山大追击大流士三世穿行之里海门天然石峡（阿里安《远征记》III.20），阿契美尼德时期峡口并无人工石砖夯土关城，系附峡驿路小村聚且人口<1万，定城寨。', mirror: true },
    { id: 'city_jiaziwen', name: '加兹温', factionId: 'safawei_d', lat: 36.27, lng: 50, type: 'small_city', troops: 10000, region: 'SAFAVID', buildingStyle: 'PERSIAN' , note: '[1555至1598年萨法维帝国首都加兹温·烧砖宫苑城门与大巴扎王都] 塔赫玛斯普一世自大不里士迁都加兹温逾四十年，英国商人安东尼·詹金森1562年出使亲历记王都繁盛，迁伊斯法罕前城居峰值达4–6万（Chandler 1575年表5–6万），>1万定小城。' },


    { id: 'city_zanzhan', name: '赞詹', factionId: 'safawei_d', lat: 36.67, lng: 48.48, type: 'stockade', troops: 10000, region: 'ILKHANATE', buildingStyle: 'SASANIAN', note: '[13世纪伊利汗国阿杰姆走廊重驿与16世纪萨法维红头军集结镇赞詹·赞詹河谷泥砖夯土市镇] 1220年遭蒙军哲别速不台彻底攻毁，1340年本土学者哈姆杜拉·穆斯陶菲《心悦志》明记赞詹旧墙倾圮大半荒芜，17世纪奥莱阿里乌斯游记亦记为无城墙泥砖集镇，≤1700年常住约5000–8000人<1万，定城寨。' },



    { id: 'city_dabulishi', name: '大不里士', factionId: 'yilihanguo_d', lat: 38.08, lng: 46.29, type: 'medium_city', troops: 10000, region: 'ILKHANATE', buildingStyle: 'SASANIAN', note: '[13至16世纪伊利汗国白羊萨法维期·烧砖石基丝路帝都] 伊利汗合赞汗扩建外郭至白羊王朝乌尊哈桑、萨法维初年，大不里士城居峰值达20–25万（克拉维约记20万、Chandler 1500年表25万），<40万而>10万，定中城。' },
    { id: 'city_malagai', name: '马拉盖', factionId: 'yilihanguo_d', lat: 37.39, lng: 46.24, type: 'small_city', troops: 10000, region: 'ILKHANATE', buildingStyle: 'SASANIAN', note: '[1256至1265年伊利汗国开国首府马拉盖·旭烈兀王廷与图西天文台烧砖大邑] 旭烈兀平定西亚后首定马拉盖为汗国行政中枢并建天文台，哈姆杜拉·穆斯陶菲《心悦志》记其城大税丰，13世纪下半叶城居峰值约3–5万，>1万定小城。' },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「EAST」推出的二级与史实不符 → 归 ARMENIANS：埃里温：亚美尼亚
    { id: 'city_ailiwen', name: '埃里温', factionId: 'wulaertu', lat: 40.18, lng: 44.51, type: 'small_city', troops: 10000, region: 'WEST_ASIA', buildingStyle: 'ARMENIANS' , note: '[前8世纪乌拉尔图埃雷布尼巨石城至16至17世纪萨法维埃里温省首府·双层石砖巨堡城] 1583年法尔哈德帕夏筑赫拉兹丹河悬崖双层巨石城墙要塞城，1673年夏尔丹《波斯游记》亲访详绘埃里温石城与近关坊市，17世纪城居约1.5–2.5万且具双层石墙，定小城。' },
    { id: 'city_tushpa', name: '图什帕', factionId: 'wulaertu_guo', lat: 38.5, lng: 43.37, type: 'small_city', troops: 10000, region: 'ARMENIANS', buildingStyle: 'ARMENIANS' , note: '[前9至前7世纪乌拉尔图王国首都图什帕（凡城）·凡湖巨岩楔形巨石卫城与下城] 萨尔杜里一世至阿尔吉什提一世营建之乌拉尔图帝国王都，悬崖巨石筑城并修70公里门乌阿石渠供水，帝国盛期岩下主城居民约2.5–4万（Zimansky《乌拉尔图生态与帝国》），>1万且具巨石墙，定小城。' },
    { id: 'city_ani', name: '阿尼', factionId: 'wulaertu', lat: 40.507, lng: 43.572, type: 'medium_city', troops: 10000, region: 'ARMENIANS', buildingStyle: 'ARMENIANS', note: '[10至11世纪巴格拉图尼亚美尼亚王都·双层玄武岩巨石城垣] 阿硕特三世至加吉克一世盛期（约1000–1045年）「千零一教堂之城」阿尼双层石墙与峡谷关厢人口约10万（马修《编年史》及Chandler 1000年表10万），≥10万定中城。' },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「EAST」推出的二级与史实不符 → 归 GEORGIANS：第比利斯：格鲁吉亚都城
    { id: 'city_dibilisi', name: '第比利斯', factionId: 'gelujiya', lat: 41.72, lng: 44.79, type: 'medium_city', troops: 10000, region: 'WEST_ASIA_CASTLE', buildingStyle: 'GEORGIANS' , note: '[12世纪末至13世纪初格鲁吉亚黄金时代·纳里卡拉石墙王都] 大卫四世收复至塔玛尔女王极盛期（1184–1225年，花剌子模攻掠前），第比利斯库拉河两岸石墙城区与商坊人口峰值约8–10万（Meskhia《第比利斯史》及格鲁吉亚中世纪税籍推算），≥8万容差线，定中城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「EAST」推出的二级与史实不符 → 归 BYZANTINE：特拉布宗：拜占庭系特拉布宗帝国都城
    { id: 'city_telabuzong', name: '特拉布宗', factionId: 'bendou', lat: 41, lng: 39.73, type: 'small_city', isPort: true, troops: 10000, region: 'WEST_ASIA_CASTLE', buildingStyle: 'BYZANTINE' , note: '[1204至1461年特拉布宗科穆宁帝国首都·深谷双峡巨石三重高墙黑海港都] 大科穆宁王朝二百五十年帝都，筑上堡、中城、下城直抵海港之完整巨石高墙，14–15世纪威尼斯热那亚商馆林立，1438年贝萨里翁《特拉布宗颂》及Bryer考算城居约2–4万，>1万定小城。' },

    { id: 'city_kutayixi', name: '库塔伊西', factionId: 'abkhazia_kingdom', lat: 42.27, lng: 42.7, type: 'small_city', troops: 10000, region: 'GEORGIANS', buildingStyle: 'GEORGIANS' , note: '[8至12世纪初阿布哈兹与统一格鲁吉亚旧都库塔伊西·乌克梅里奥尼巨石卫城与里奥尼河城区] 巴格拉特三世至大卫四世1122年收复第比利斯前之格鲁吉亚王都（巴格拉特石砌大教堂UNESCO遗产），具拜占庭与格鲁吉亚双层巨石城墙，11–12世纪城居约1.5–2万，>1万定小城。' },
    { id: 'city_amaxiya', name: '阿马西亚', factionId: 'bendou_d', lat: 40.65, lng: 35.83, type: 'small_city', troops: 10000, region: 'WEST_ASIA_ANTIQUITY', buildingStyle: 'BYZANTINE', note: '[前3至前2世纪本都王国首任王都至奥斯曼皇子驻城·伊里斯河绝壁巨石城墙阿马西亚] 斯特拉波故乡并在《地理志》XII.3.39详述阿马西亚绝壁巨石城墙围合王宫与岩凿王陵，奥斯曼时期为王储历练名城，16世纪税册城居约1.5–2.5万且具巨石城垣，定小城。' },
    { id: 'city_hatusha', name: '哈图沙', factionId: 'heti', lat: 40.02, lng: 34.61, type: 'small_city', troops: 10000, region: 'HITTITES', buildingStyle: 'TURKS', note: '[前14至前13世纪赫梯新王国帝国首都哈图沙·6.8公里独眼式巨石狮门王门大城垣] 苏庇路里乌玛一世至哈图西里三世时期上城与下城巨石城墙围合180公顷，德国考古研究所Seeher与Neve发掘测算帝国极盛期城居约3–4.5万，>1万且具巨石城墙，定小城。' },
    { id: 'city_geerdiweng', name: '戈尔迪乌姆', factionId: 'fulijiya', lat: 39.65, lng: 31.98, type: 'small_city', troops: 10000, region: 'WEST_ASIA_ANTIQUITY', buildingStyle: 'TURKS', note: '[前9至前6世纪弗里吉亚王国首都戈尔迪乌姆·13米高斜坡切石城门卫城与外郭] 米达斯王都城及前333年亚历山大斩戈尔迪乌姆之结所在地（阿里安II.3），宾夕法尼亚大学发掘确证保存高达10米之精美切石城垣与100公顷内外城区，盛期城居约1.5–2.5万，定小城。' },
    { id: 'city_sifaerde', name: '斯法尔德', factionId: 'ldiya', lat: 38.48, lng: 28.03, type: 'small_city', troops: 10000, region: 'GREECE', buildingStyle: 'GREECE', note: '[前7至前4世纪吕底亚王国都城与波斯小亚细亚总督首府萨第斯·巨石泥砖厚达20米城垣] 克罗伊索斯王都及波斯王家御道西端总首府（希罗多德I.80–84、V.100），哈佛康奈尔考古队发掘确证巨石基座厚墙围合115公顷下城与天险卫城，盛期城居约3–5万，>1万定小城。' },
    { id: 'city_peierjiameng', name: '佩尔加蒙', factionId: 'pajiama', lat: 39.12, lng: 27.18, type: 'small_city', troops: 10000, region: 'GREEK', buildingStyle: 'GREECE' , note: '[前3至前2世纪阿塔罗斯王朝帕加马王国都城与罗马大邑·欧迈尼斯二世巨石环山城墙] 欧迈尼斯二世扩筑4公里切石城墙围合卫城大祭坛与山麓城区，至2世纪盖伦医典明载本邦罗马公民及奴隶合算主城人口约4–6万（Radt《佩加蒙历史与建筑》），>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「EAST」推出的二级与史实不符 → 归 BYZANTINE：尼凯亚：拜占庭尼西亚帝国都城
    { id: 'city_nixiya', name: '尼凯亚', factionId: 'baizanting', lat: 40.43, lng: 29.72, type: 'small_city', troops: 10000, region: 'WEST_ASIA_CASTLE', buildingStyle: 'BYZANTINE' , note: '[基督教大公会议名城至1204至1261年尼凯亚流亡帝国首都·4.97公里百塔砖石双层城墙] 拉斯卡里斯王朝复国帝都尼凯亚（伊兹尼克），现存完好近5公里罗马—拜占庭红砖夹巨石双层高墙与四座城门，13世纪帝国首都期城居约2–3万（Foss《尼凯亚史》），>1万定小城。' },
    { id: 'city_junshitandingbao', name: '君士坦丁堡', factionId: 'baizanting', lat: 41.01, lng: 28.97, type: 'big_city', isPort: true, troops: 10000, region: 'EAST', buildingStyle: 'BYZANTINE' , note: '[东罗马查士丁尼至马其顿期·狄奥多西三重石墙帝都] 6世纪查士丁尼初年及10世纪马其顿王朝复兴期狄奥多西石墙内城居峰值约50–80万（普罗科匹厄斯史料及Magdalino／Chandler考算），>50万定大城。' },
    { id: 'city_yikeniwumu', name: '伊科尼乌姆', factionId: 'luomu', lat: 37.8744, lng: 32.4931, type: 'small_city', troops: 10000, region: 'WEST_ASIA_CASTLE', buildingStyle: 'TURKS', note: '[12至13世纪罗姆塞尔柱苏丹国首都科尼亚（伊科尼乌姆）·凯库巴德一世百零八塔切石高墙] 1221年阿拉丁·凯库巴德一世镶嵌古典雕石筑成百零八座石塔环城墙（鲁米驻锡地），1190年十字军腓特烈一世攻城及13世纪盛期城居达3–5万（Cahen《前奥斯曼土耳其》），>1万定小城。；原 ORIE（萨拉森生土要塞，黎凡特—埃及代理）不符 → 改 TURKS' },
    { id: 'city_tiyana', name: '提亚纳', factionId: 'kapaduoxiya', lat: 37.848, lng: 34.611, type: 'small_city', troops: 10000, region: 'WEST_ASIA_ANTIQUITY', buildingStyle: 'TURKS', note: '[卡帕多细亚南门重镇至罗马第二卡帕多细亚省首府·大理石水道与罗马切石城墙提亚纳] 扼奇里乞亚门北口（阿里安II.4），272年奥勒良围攻帕尔米拉守军之石墙坚城（《奥古斯都史·奥勒良传》22–23），现存罗马大理石高架引水渠与石墙基垣，盛期城居约1–2万且具石墙，定小城。' },
        { id: 'city_nikexiya', name: '尼科西亚', factionId: 'saipulusi', lat: 35.18, lng: 33.38, type: 'small_city', troops: 10000, region: 'ATHENIANS', buildingStyle: 'FRANKS', note: '[1192至1570年吕西尼昂塞浦路斯王国与威尼斯首府·萨沃尔尼安十一棱堡圆形切石城墙] 十字军吕西尼昂王朝三百年王都，1567年威尼斯筑周4.8公里圆形十一棱堡切石城墙，1570年奥斯曼拉拉·穆斯塔法围城时城内军民达2.5–3万（Hill《塞浦路斯史》第3卷），>1万定小城。' },
    { id: 'city_famagusta', name: '法马古斯塔', factionId: 'saipulusi', lat: 35.1200, lng: 33.9400, type: 'small_city', isPort: true, region: 'ATHENIANS', buildingStyle: 'FRANKS', troops: 10000, note: '[14至16世纪吕西尼昂与威尼斯塞浦路斯东港·马丁嫩戈巨石棱堡环城] 1291年后东地中海最富转口商港，威尼斯重筑高15米完整切石棱堡环城墙，1570–1571年抗奥斯曼十一个月围城时城内军民约1–1.5万（Hill《塞浦路斯史》），>1万且具巨石墙，定小城。' },
{ id: 'city_antiejiya', name: '安提俄基亚', factionId: 'sailiugu', lat: 36.2, lng: 36.16, type: 'big_city', isPort: true, troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', mirror: true , note: '[塞琉古晚期至罗马帝国前期·巨石环山都城郭] 罗马帝国1–2世纪安提俄基亚石墙内及达芙妮关厢居民峰值约40–50万（斯特拉波XVI.2.5、约瑟夫斯《犹太战记》及Modelski估50万），≥40万容差线，定大城。' },
    { id: 'city_teluowulan', name: '特罗武兰', factionId: 'manzheboyi', lat: -7.55, lng: 112.37, type: 'medium_city', isPort: true, troops: 10000, region: 'SEASIA_CASTLE', buildingStyle: 'MALAY', note: '[14世纪满者伯夷帝国哈亚姆乌鲁克期·红砖宫墙连片都邑] 满者伯夷极盛期都城特罗武兰红砖宫院与水道坊巷连片建成区（《爪哇史颂》所述王城核心区），考古与东南亚城市史折算常住城居约8–12万（Miksic 2009及Reid《商业时代的东南亚》），≥8万定中城。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 阿杰梅尔＝乔汉王朝都城（拉杰普特/印度西部）→ GURJARAS；原标 INDIA
    { id: 'city_ajiemier', name: '阿杰梅尔', factionId: 'zhelouqi', lat: 26.45, lng: 74.64, type: 'small_city', troops: 10000, region: 'GURJARAS', buildingStyle: 'GURJARAS', note: '[12世纪乔汉王都至莫卧儿行省首府·石砌山堡与城垣] 普里特维拉杰三世都城及17世纪莫卧儿苏巴首府阿杰梅尔，塔拉加尔石堡与山下石墙城区峰值约4–6万（Habib《莫卧儿帝国地图集》及Chandler表均未达8万），<8万容差线，定小城。' },
    { id: 'city_kumubi', name: '库姆比萨利赫', factionId: 'suosuo', lat: 15.77, lng: -7.97, type: 'small_city', troops: 10000, region: 'GHANA', buildingStyle: 'AFRICA', note: '[9至11世纪西非加纳（瓦加杜）黄金帝国王都推定址·干砌片石双层楼宇连片商都] 1068年巴克里《道路与王国志》详记加纳双生王城与商人石屋大城，毛里塔尼亚库姆比萨利赫遗址探明250公顷干石砌筑高密度街坊，盛期城居约1.5–2万（Berthier 1997发掘考算），>1万定小城。；🔴 [2026-11-11 补标] 【建筑风格代理】索宁克人加纳帝国都城，67键无加纳，取最近AFRICA（马里系）' },
    { id: 'city_latajiya', name: '拉塔基亚', factionId: 'antiaokegongguo', lat: 35.52, lng: 35.79, type: 'small_city', isPort: true, troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[塞琉古四国名港老底嘉至拜占庭赞吉阿尤布海防城·切石港墙与双城堡拉塔基亚] 塞琉古一世按棋盘规制所建叙利亚四大姊妹城之一（斯特拉波XVI.2.9），罗马至十字军萨拉丁争夺期具切石海陆城垣，古典及阿尤布盛期城居约1.5–3万，>1万定小城。' },
    { id: 'city_lansi', name: '兰斯', factionId: 'gaolu', lat: 49.26, lng: 4.03, type: 'small_city', troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS', note: '[罗马比利时高卢首府杜罗科托鲁姆至法兰西历代国王加冕城·5公里白垩石环城墙兰斯] 罗马盛期及14世纪百年战争筑5公里完整石砌环城墙（1429年贞德护送查理七世加冕），1600–1700年城内实居达2.5–3万（Desportes《中世纪兰斯》及de Vries表3万），>1万定小城。' },
    // 🔴 [2026-10-18 按史] 卡那封城堡为爱德华一世铁环城堡群之首，实建为英格兰/萨伏伊规制石堡 → BRITONS；不取凯尔特。
    { id: 'city_kanafeng', name: '卡那封', factionId: 'yinggelan', lat: 53.14, lng: -4.27, type: 'pass', isPort: true, troops: 10000, region: 'BRITONS', buildingStyle: 'BRITONS', note: '[13世纪末英王爱德华一世征服威尔士·梅奈海峡巨石多角塔要塞] 1283年爱德华一世仿君士坦丁堡城垣筑卡那封巨石城堡与戍卫小垣锁控北威尔士海峡通道，附堡英人驻防聚落仅约千人（Taylor《威尔士王家城堡史》），石堡要塞<1万，定险要。' },
    { id: 'city_meierfei', name: '梅尔菲', factionId: 'xixiliwangguo', lat: 40.99, lng: 15.65, type: 'small_city', troops: 10000, region: 'SICILIANS', buildingStyle: 'SICILIANS', note: '[11世纪诺曼欧特维尔家族阿普利亚公国首府与腓特烈二世颁宪城·玄武岩石堡与石砌环城墙] 1041年铁臂威廉定为诺曼南意十二伯爵首府、1231年腓特烈二世颁《梅尔菲宪章》，具完整诺曼—斯瓦本玄武岩石堡与环城石墙，中世纪盛期城居约0.8–1.2万且具石墙，定小城。' },
    { id: 'city_saimien', name: '塞米恩', factionId: 'saimien', lat: 13.3, lng: 38.2, type: 'stockade', troops: 10000, region: 'ETHIOPIANS', buildingStyle: 'ETHIOPIANS', note: '[10至16世纪埃塞俄比亚北部塞米恩高山贝塔以色列（法拉沙人）吉迪恩王朝据点·海拔4000米火山断崖安巴干石山寨] 传说尤迪特女王兴起及15–17世纪抗所罗门王朝征讨之天险孤峰山寨（Amba Jew，《埃塞俄比亚编年史》），非守大道关门且高寒山顶散寨常住仅数千人<1万，定城寨。' },
    { id: 'city_seyute', name: '瑟于特', factionId: 'osman', lat: 40.03, lng: 30.18, type: 'stockade', troops: 10000, region: 'OTTOMAN', buildingStyle: 'TURKS', note: '[1299至1326年奥斯曼一世与埃尔图鲁尔贝伊肇基第一牧邑瑟于特·比提尼亚桑加里乌斯河谷土库曼冬牧小镇] 罗姆塞尔柱赐予卡伊部落越冬小邑，1326年奥尔汗攻克布尔萨迁都后瑟于特即退为陵墓小镇（阿什克帕夏扎德《奥斯曼史》），16世纪奥斯曼税册实载全镇仅百余户不足2000人且无城墙，定城寨。' },
    { id: 'city_anfeibolisi', name: '安菲波利斯', factionId: 'lagoniya', lat: 40.82, lng: 23.85, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'ATHENIANS', note: '[前437年雅典殖民重邦与腓力二世马其顿银矿商都·7.5公里斯特里蒙河切石长城] 前422年布拉西达斯与克里昂同殁于城下（修昔底德V.6–11），希腊考古学家Lazaridis发掘出保存极佳之7.5公里古典切石环城高墙与木石大桥，前4世纪城居约1.5–2.5万，>1万定小城。' },
    { id: 'city_yanghe', name: '羊河', factionId: 'xila', lat: 40.332, lng: 26.6, type: 'stockade', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'ATHENIANS', stockadeShape: 'rect', stockadeFence: 'ARCHAIC', note: '🔴 [2026-11-07 按史补依据] 羊河（埃戈斯波塔米，雅典舰队覆灭处）；羊河（伊哥斯波塔米）海战战场，吕山德405年全歼雅典舰队。🔴 [2026-09-24 主人令「据点坐标错误请修正」] 原 40.36,26.61 偏离 3.23 公里，按英文维基百科 Aegospotami 坐标改为 40.332,26.6。' },
    { id: 'city_gelanikusi', name: '格拉尼库斯', factionId: 'aqimeinide', lat: 40.32, lng: 27.28, type: 'stockade', troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '🔴 [2026-11-07 按史补依据] 格拉尼库斯河（亚历山大首战）；格拉尼库斯河会战战场，帕曼纽334年统左翼大破波斯' },
    // 🔴 [2026-09-12 主人定] 战场**不再是据点**（主人：「把战场独立出来，不做为据点，就叫战场。
    //   一个地名而已。类似奇观」）→ 原先这里的 `city_yisusi`、`city_gelanikusihe` 两行
    //   已迁到 **`src/data/Battlefields.ts`**（`bf_yisusi` / `bf_gelanikusihe`），
    //   由 `src/map/BattlefieldLayer.ts` 独立图层渲染。
    //   ⚠️ 因此「格拉尼库斯河 ↔ 格拉尼库斯」10.6km 这种「过近」问题**整类消失**（战场不再占据点名额）。
    { id: 'city_peiluximu', name: '佩鲁西姆', factionId: 'aiji', lat: 31.04, lng: 32.55, type: 'pass', troops: 10000, region: 'EGYPT', buildingStyle: 'ORIE', note: '[古埃及晚王朝至托勒密罗马期·尼罗河东支海口烧砖石基边防要塞] 扼西奈沙漠入埃及东门咽喉，前525年冈比西斯、前321年佩尔狄卡斯攻埃皆争此塞，遗址存罗马烧砖巨型军团要塞垣（希罗多德III.10、斯特拉波XVII.1.21），边防要塞且常住<1万，定险要。' },
    { id: 'city_matelugang', name: '马特鲁港', factionId: 'tuolemi', lat: 31.35, lng: 27.23, type: 'stockade', isPort: true, troops: 10000, region: 'EGYPT', buildingStyle: 'ORIE', stockadeShape: 'trapezoid', stockadeFence: 'ARCHAIC', note: '[前331年亚历山大赴锡瓦神谕转折海驿帕拉伊托尼乌姆（今马特鲁港）与前30年安东尼西翼守港·潟湖海湾小商站] 阿里安《远征记》III.3与斯特拉波XVII.1.14所载埃及西界沙漠海岸避风锚地，腹地全系利比亚荒漠，古典至伊斯兰时期常住水手戍兵不足3000人且无合围石城郭，定城寨。' },
    { id: 'city_halikanasu', name: '哈利卡纳苏斯', factionId: 'kaliya', lat: 37.03, lng: 27.43, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前4世纪卡里亚赫卡托姆努斯王朝摩索拉斯新都·7公里明多斯石门巨石城墙] 摩索拉斯迁八城居民充实新都并筑7公里安山岩切石高墙与摩索拉斯陵墓，前334年门农凭坚固石墙与深壕顽抗亚历山大数月（阿里安I.20–23），盛期城居约2–3万，>1万定小城。' },
    { id: 'city_kelazuomeinai', name: '克拉佐美奈', factionId: 'aqimeinide', lat: 38.36, lng: 26.77, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[古风至古典爱奥尼亚十二城邦·陆城与海岛长堤切石城墙港邦] 爱奥尼亚同盟十二邦之一克拉佐美奈，前5世纪末至前4世纪迁建近岸小岛并筑切石环城墙与通陆石堤（修昔底德VIII.14、保萨尼亚斯VII.3.9；Hansen 2004），城居约6000–10000人具石墙，定小城。' },
    { id: 'city_tiluo', name: '提洛', factionId: 'xila', lat: 37.39, lng: 25.27, type: 'stockade', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'ATHENIANS', note: '[古希腊阿波罗诞辰圣岛与前478年提洛同盟金库所在提洛岛·无设防城墙之神庙圣域与前1世纪末彻底荒废岛邑] 古典时代全岛为不设城墙之净土圣地（修昔底德III.104），前88与前69年遭本都米特拉达梯军与海盗两度屠掠后彻底沦为无人牧羊废墟（斯特拉波X.5.2–4；罗马免税港瞬时商客非古典雅典阶段），定城寨。' },
    // 🔴 [2026-09-18 主人定「每个据点都必须是一级 16 之一 + 二级 62+3 之一」]
    //    本据点原先**没有 buildingStyle 字段**（region=ORIE、troops=20000 —— 早前走快速新建建成），
    //    编辑器里一级那一格因此是空的。补写 'ORIE'：一级 = 中东（ORIE），二级 = 中东·萨拉森（ORIE，同键）。
    { id: 'city_aerbeila', name: '阿尔贝拉', factionId: 'adiyabeina', lat: 36.19, lng: 44.01, type: 'small_city', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE' , note: '[新亚述圣城、阿契美尼德驿站至罗马藩属阿迪亚贝纳王国都城·30米高台砖石卫城与下城] 人类持续定居古都阿尔贝拉（埃尔比勒），前331年高加米拉战后亚历山大入城缴获大流士宝库，帕提亚藩属阿迪亚贝纳王都及12世纪穆扎法尔丁时期城居达2–4万（Nováček考古测算），>1万定小城。' },

    // ── 2026-11-13 新增：编年史第一段（主人批「超过 50km 就是另一个据点」，--probe 全部通过 ≥50km）──
    { id: 'city_xanthos', name: '克桑托斯', factionId: 'lycia', lat: 36.356, lng: 29.318, type: 'small_city', troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前6至前4世纪古典吕基亚首邑·多边形巨石卫城与环城石垣] 吕基亚联盟最大都邑克桑托斯，前545年抗波斯哈尔帕古斯围攻（希罗多德I.176），现存古典时代完整多边形切石卫城与石砌环城墙（Hansen & Nielsen 2004《城邦名录》），城居约0.6–1万但具石墙城郭，定小城。；实建为吕基亚柱墓与希腊式涅瑞伊得斯祠堂、剧场，库内无吕基亚专属文化，取 GREECE 代理' },
    { id: 'city_skyros', name: '斯库罗斯', factionId: 'dolopes', lat: 38.904, lng: 24.563, type: 'stockade', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前5世纪初爱琴海多洛佩斯期·海岛山岩海盗聚落] 前475年雅典客蒙攻取多洛佩斯海盗所据斯库罗斯岛（修昔底德I.98、普鲁塔克《客蒙传》8），前古典海岛聚落人口不足5000且无确凿合围石砌下城墙（雅典克勒鲁奇石墙晚筑），定城寨。' },
    { id: 'city_thasos', name: '萨索斯', factionId: 'thasos', lat: 40.779, lng: 24.711, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前5至前4世纪古典萨索斯城邦·4公里白色大理石环城高墙] 帕罗斯殖民富邦萨索斯，前465–463年抗雅典客蒙三年围城（修昔底德I.100–101），现存周4公里白色大理石巨筑城垣与海港防墙，古典盛期城居约1–1.5万（Hansen & Nielsen 2004），定小城。' },
    { id: 'city_corinth', name: '科林斯', factionId: 'corinth', lat: 37.906, lng: 22.88, type: 'medium_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[古典希腊要邦至罗马帝国盛期·切石长墙双港名城] 古典科林斯（修昔底德I.13）及罗马亚该亚行省首府期，主城石墙内连同莱开翁港关厢峰值约8–10万（Engels 1990《Roman Corinth》pp.27–33、81–84考算约8万），踩8万容差线，定中城。' },
    { id: 'city_melos', name: '米洛斯', factionId: 'melos', lat: 36.725, lng: 24.423, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前5世纪古典米洛斯城邦·多边形火山玄武岩石砌城垣] 前416年雅典远征军筑墙合围米洛斯城（修昔底德V.84–116），考古发掘确证古典米洛斯主城具多边形粗面玄武岩石砌城墙与石门（Renfrew & Wagstaff 1982），城居约3000人<1万但具石墙，定小城。' },
    { id: 'city_torone', name: '托罗尼', factionId: 'chalkidike', lat: 39.977, lng: 23.888, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前5世纪伯罗奔尼撒战争期·哈尔基季基半岛切石环城墙港邦] 前424年布拉西达斯与前422年克里昂反复争夺托罗尼城垣与海墙（修昔底德IV.110–116、V.2–3），澳大利亚考古队发掘确证古典切石与多边形石墙体系（Cambitoglou 2001），<1万具石墙，定小城。' },
    { id: 'city_mytilene', name: '米蒂利尼', factionId: 'mytilene', lat: 39.11, lng: 26.555, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前5至前4世纪莱斯博斯首邦·切石城墙与南北双军商港] 前428–427年米蒂利尼抗雅典帕凯斯围城（修昔底德III.2–50），具完整古典石砌城墙与防波石堤，城居峰值约1.5–2.5万（Hansen & Nielsen 2004 p.1026），>1万且具石墙，定小城。' },
    { id: 'city_mantinea', name: '曼丁尼亚', factionId: 'mantinea', lat: 37.617, lng: 22.395, type: 'stockade', troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前5至前4世纪阿卡迪亚同盟要邦·石基生晒泥砖环城垣] 前385年斯巴达王阿格西波利斯一世筑坝壅奥菲斯河泡塌曼丁尼亚生晒泥砖城墙并拆散为四村（色诺芬《希腊史》V.2.4–7），泥砖非烧砖石墙且常住聚落未满1万确数，定城寨。' },
    // ── 2026-11-14 新增：编年史第三至十六段缺据点（主人批「全部新建」；与全库、彼此均 ≥50km；道路待主人画）──
    { id: 'city_tarraco', name: '塔拉科', factionId: 'luoma_gongheguo', lat: 41.12, lng: 1.25, type: 'small_city', isPort: true, troops: 10000, region: 'ROMA', buildingStyle: 'ROMA', note: '[前2世纪罗马共和国至帝国近西班牙首府·巨石基切石高墙省都] 前218年西庇阿兄弟扩筑巨石城墙（李维XXI.61），奥古斯都驻跸定为塔拉科西班牙行省首府，帝国盛期石墙内与港区居民约2–3万（Alföldy塔拉科铭文与城市考），>1万且具罗马石墙，定小城。' },
    { id: 'city_ilerda', name: '伊莱尔达', factionId: 'luoma_gongheguo', lat: 41.62, lng: 0.62, type: 'stockade', troops: 10000, region: 'ARAGON', buildingStyle: 'SPANISH', note: '[前1世纪罗马内战期·塞格雷河畔伊比利亚山丘土石混筑小邑] 前49年恺撒于伊莱尔达断水迫降庞培派阿弗拉尼乌斯五军团（恺撒《内战记》I.37–84），共和末城邑狭小、城居人口与规整石墙均无确载，定城寨。；库内无伊比利亚土著文化，取最近据点萨拉戈萨 SPANISH 代理' },
    { id: 'city_cirta', name: '奇尔塔', factionId: 'luoma_diguo', lat: 36.37, lng: 6.61, type: 'small_city', troops: 10000, region: 'BERBER', buildingStyle: 'BERBER', note: '[前2世纪努米底亚王国都城至罗马殖民城·卢梅尔深谷绝壁石墙王都] 马西尼萨、米齐普萨与朱古达王都奇尔塔（今君士坦丁），斯特拉波XVII.3.13载米齐普萨招希腊移民使该城可出步兵二万骑兵一万，萨卢斯特《朱古达战争》21–26载石墙坚固，城居逾2万，定小城。' },
    { id: 'city_lilybaeum', name: '利利拜乌姆', factionId: 'buni', lat: 37.8, lng: 12.43, type: 'small_city', isPort: true, troops: 10000, region: 'CARTHAGE', buildingStyle: 'BERBER', note: '[前4至前3世纪迦太基西西里海防主城·巨石高墙与凿岩深壕港邑] 前397年摩提亚毁后迦太基筑利利拜乌姆巨石厚墙与深阔干壕，前250–241年拒罗马陆海围攻十年不破（波利比乌斯I.41–48、狄奥多罗斯XXII.10），城居逾1万且具布匿巨石城墙，定小城。' },
    { id: 'city_brundisium', name: '布林迪西', factionId: 'luoma_gongheguo', lat: 40.63, lng: 17.94, type: 'small_city', isPort: true, troops: 10000, region: 'IMPERIAL_ROME', buildingStyle: 'ROMA', note: '[前3至前1世纪罗马东渡主港·阿庇亚大道终点石砖城墙港市] 前244年设罗马殖民城，前49年恺撒围庞培于港城内（恺撒《内战记》I.24–28），具完整罗马石砖城墙与双内港，共和末至帝国初城居约1.5–2.5万，定小城。' },
    { id: 'city_dyrrachium', name: '迪拉基乌姆', factionId: 'luoma_gongheguo', lat: 41.32, lng: 19.46, type: 'small_city', isPort: true, troops: 10000, region: 'IMPERIAL_ROME', buildingStyle: 'ROMA', note: '[罗马共和末至拜占庭军区首府·埃格那提亚大道起点石砖高墙港城] 古埃皮达姆诺斯，前48年庞培以此为基地拒恺撒（恺撒《内战记》III.41–72），5世纪皇帝阿纳斯塔修斯一世筑三道砖石高墙，盛期城居约1.5–2.5万，定小城。' },
    { id: 'city_vetera', name: '维特拉', factionId: 'luoma_diguo', lat: 51.65, lng: 6.45, type: 'pass', troops: 10000, region: 'ROMA', buildingStyle: 'ROMA', note: '[罗马帝国早期莱茵河防线·双军团石砖长城大营要塞] 前12年德鲁苏斯始建、尼禄与弗拉维期改筑石砖军团城垣之维特拉双军团大营，控利珀河入莱茵河渡口（塔西佗《编年史》I.45、《历史》IV.21–60），纯军事石砖军营未成万人市民城，定险要。' },
    { id: 'city_caen', name: '卡昂', factionId: 'gaolu', lat: 49.19, lng: -0.36, type: 'small_city', troops: 10000, region: 'LATIN', buildingStyle: 'FRANKS', note: '[11至15世纪诺曼底公国副都·卡昂石灰岩城堡与环城石墙大邑] 约1060年征服者威廉筑石堡与双修道院，1346与1417年英王爱德华三世、亨利五世两度围攻（弗鲁瓦萨尔《编年史》），1700年前城居达2.5–3万（de Vries 1984 p.273）且具石墙，定小城。' },
    { id: 'city_harfleur', name: '阿夫勒尔', factionId: 'gaolu', lat: 49.51, lng: 0.2, type: 'small_city', isPort: true, troops: 10000, region: 'LATIN', buildingStyle: 'FRANKS', note: '[14至15世纪百年战争法兰西王家军港·塞纳河口二十六塔石砌城墙] 诺曼底首席海防商港阿夫勒尔，筑有完整石砌环城墙、护城水闸与26座石塔，1415年亨利五世率万军重炮围攻五周方陷（《亨利五世行纪》），城居约5000–8000人<1万但具石墙，定小城。' },
    { id: 'city_rouen', name: '鲁昂', factionId: 'gaolu', lat: 49.44, lng: 1.1, type: 'medium_city', troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS', note: '[中世纪末至17世纪诺曼底首府·石砌城墙塞纳河大邑] 诺曼底高等法院首府鲁昂1418年英军围城时逾4万，至1650年石墙内与圣塞韦尔关厢城居达8.2万（de Vries 1984 p.273、Benedict《宗教战争时期的鲁昂》），≥8万容差线，定中城。' },
    { id: 'city_saint_valery', name: '圣瓦莱里', factionId: 'gaolu', lat: 50.19, lng: 1.63, type: 'stockade', isPort: true, troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS', note: '[11世纪诺曼征服前夕·索姆河口木石锚泊渔商小港] 1066年9月诺曼底公爵威廉远征舰队集结候风之圣瓦莱里锚地（普瓦捷的威廉《威廉事迹》II.6–7、贝叶挂毯），11世纪尚无合围石砌城墙且常住仅千余人<1万，定城寨。' },
    { id: 'city_beauvais', name: '博韦', factionId: 'gaolu', lat: 49.43, lng: 2.08, type: 'small_city', troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS', note: '[中世纪至15世纪法兰西主教伯爵城·高卢罗马地基石砌环城墙] 法国王家纺织重镇博韦，1472年大胆查理率勃艮第军猛攻石墙城门，让娜·阿谢特率市民击退之（科明《回忆录》III.8），16–17世纪城居约1.2–1.5万（de Vries 1984）且具石墙，定小城。' },
    { id: 'city_soissons', name: '苏瓦松', factionId: 'falanji', lat: 49.38, lng: 3.32, type: 'small_city', troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS', note: '[5至6世纪高卢罗马末期与墨洛温王都·晚期罗马石砌城墙都邑] 西阿格里乌斯辖区首邑，486年克洛维击败西阿格里乌斯后定为墨洛温早期王都（图尔的格雷戈里《法兰克人史》II.27），承晚期罗马巨石城垣，中世纪至17世纪城居约8000–10000人具石墙，定小城。' },
    { id: 'city_nancy', name: '南锡', factionId: 'gaolu', lat: 48.68, lng: 6.19, type: 'small_city', troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS', note: '[15至17世纪洛林公国首都·石砖星形棱堡双城垣都城] 洛林公爵雷内二世都城，1477年大胆查理围攻石墙坚城败亡于城外（科明《回忆录》V.8），16世纪末夏尔三世扩筑新旧双棱堡石城，≤1700年城居约1.2–1.6万，定小城。' },
    { id: 'city_hericourt', name: '埃里库尔', factionId: 'bogendigongguo', lat: 47.58, lng: 6.76, type: 'pass', troops: 10000, region: 'BURGUNDIANS', buildingStyle: 'BURGUNDIANS', note: '[15世纪勃艮第战争期·贝尔福山口西侧石砌棱塔要塞堡] 控勃艮第通上莱茵贝尔福走廊之石砌领主军堡，1474年瑞士与上莱茵同盟军围攻埃里库尔堡大破勃艮第援军（科明《回忆录》及《伯尔尼编年史》），石堡要塞且附镇仅千余人<1万，定险要。' },
    { id: 'city_eresburg', name: '埃雷斯堡', factionId: 'wende', lat: 51.46, lng: 8.85, type: 'stockade', troops: 10000, region: 'GERMANIC_CASTLE', buildingStyle: 'SAXONS', note: '[8世纪撒克逊战争期·迪默尔河山巅木栅土垒部族丘堡] 《法兰克王家年代记》772年条载查理曼攻克撒克森人埃雷斯堡并毁伊尔明柱；其撒克森本相为原木夹土部族山丘营寨（木栅不算正式城墙，亦非守道关门），常住不足3000人，定城寨。' },
    { id: 'city_tortona', name: '托尔托纳', factionId: 'lunbadi', lat: 44.9, lng: 8.87, type: 'small_city', troops: 10000, region: 'LATIN_IMPERIAL', buildingStyle: 'LATIN', note: '[12世纪伦巴第同盟自治市镇·山丘卫城与石砖环城墙] 米兰南翼盟邦托尔托纳，1155年红胡子腓特烈一世围攻石砖城墙两月断水方降，后米兰助其复筑石城（弗赖辛的奥托《腓特烈事迹》II.20–26），城居约6000–9000人<1万具石砖墙，定小城。' },
    { id: 'city_aquileia', name: '阿奎莱亚', factionId: 'luoma_diguo', lat: 45.77, lng: 13.37, type: 'medium_city', isPort: true, troops: 10000, region: 'IMPERIAL_ROME', buildingStyle: 'ROMA', note: '[罗马帝国盛期至4世纪·砖石双道城垣与河港重镇] 罗马意大利第十区首府及亚得里亚海北端大港，4世纪奥索尼乌斯《名城次第》列帝国第九大城，452年阿提拉毁城前城居峰值约8–10万（Brusin考古及罗马城市史通估），≥8万定中城。' },
    { id: 'city_tabor', name: '塔博尔', factionId: 'hussites', lat: 49.41, lng: 14.66, type: 'small_city', troops: 10000, region: 'BOHEMIANS', buildingStyle: 'BOHEMIANS', note: '[15世纪胡斯战争塔博尔派大本营·卢日尼采河半岛双重石砌棱塔城墙] 1420年扬·日什卡与胡斯派信众于河曲高台筑双重石砌城墙、前伸炮塔与地下坑道之塔博尔圣城（劳伦斯《胡斯战争编年史》），常住军民约4000–6000人<1万但具坚固石墙，定小城。' },
    { id: 'city_kljuc', name: '克柳奇', factionId: 'bosiniya', lat: 44.53, lng: 16.78, type: 'pass', troops: 10000, region: 'SERBIA', buildingStyle: 'SLAVIC', note: '[14至15世纪波斯尼亚王国·萨纳河峡谷绝壁石砌山堡] 名意「锁钥」，筑巨石城堡于萨纳河高崖控北波斯尼亚通道，1463年波斯尼亚末王斯捷潘·托马舍维奇退守此堡降穆罕默德二世（哈尔科孔狄利斯《历史》X），石堡锁钥且<1万，定险要。' },
    { id: 'city_khotyn', name: '霍京', factionId: 'moerdaweiya', lat: 48.52, lng: 26.5, type: 'pass', troops: 10000, region: 'SLAVIC_CASTLE', buildingStyle: 'SLAVIC', note: '[15至17世纪摩尔达维亚与波土战争·德涅斯特河崖巨石边防要塞] 斯特凡大公扩建40米高花岗岩与石灰岩巨堡扼德涅斯特河渡口，1621及1673年索别斯基两度于堡下大破奥斯曼军（波兰王家战报），纯渡口石堡且<1万，定险要。' },
    { id: 'city_mansoura', name: '曼苏拉', factionId: 'ayoubu', lat: 31.04, lng: 31.38, type: 'stockade', troops: 10000, region: 'EGYPT', buildingStyle: 'ORIE', note: '[13世纪阿尤布抗十字军期·尼罗河支流畔泥砖急筑御营市镇] 1219年阿尤布苏丹卡米勒阻第五次十字军筑营成镇，1250年拜巴尔斯于泥砖窄巷全歼十字军阿图瓦伯爵前锋（儒安维尔《圣路易传》、马格里齐《志略》），初创期泥砖无石墙且常住未满1万确数，定城寨。' },
    { id: 'city_damietta', name: '达米埃塔', factionId: 'ayoubu', lat: 31.42, lng: 31.81, type: 'small_city', isPort: true, troops: 10000, region: 'EGYPT', buildingStyle: 'ORIE', note: '[法蒂玛至阿尤布海防商都期·尼罗河东口三重石砖水陆城垣] 埃及地中海第二大港达米埃塔，具三重石砖城墙与封江铁链塔，1218–1219年抗第五次十字军围城时城中军民达4–6万（雅克·德·维特里书信及儒安维尔《圣路易传》），>1万定小城。' },
    { id: 'city_qaqun', name: '卡昆', factionId: 'mamuluke', lat: 32.36, lng: 35.0, type: 'pass', troops: 10000, region: 'ORIE', buildingStyle: 'FRANKS', note: '[12至13世纪十字军与马穆鲁克期·沙仑平原十字路口石砌军堡] 医院与圣殿骑士团筑卡昆（Caco）石堡控沿海大道通纳布卢斯山口，1267年拜巴尔斯夺堡重修、1271年英王子爱德华夜袭其外营（伊本·沙达德《拜巴尔斯传》及Pringle十字军城堡考），石堡<1万，定险要。' },
    { id: 'city_mazaka', name: '凯撒利亚马扎卡', factionId: 'luoma_diguo', lat: 38.72, lng: 35.48, type: 'small_city', troops: 10000, region: 'WEST_ASIA_ANTIQUITY', buildingStyle: 'TURKS', note: '[罗马卡帕多细亚首府至罗姆塞尔柱期·黑色玄武岩双层石墙开塞利] 古马扎卡／凯撒利亚，斯特拉波XII.2.7载卡帕多细亚王都，查士丁尼与13世纪塞尔柱苏丹凯库巴德一世重筑黑色火山石城墙，13–16世纪城居约2–3万（Faroqhi奥斯曼城市考），>1万定小城。；现存城堡、清真寺为塞尔柱遗构，取 TURKS 代理' },
    { id: 'city_tephrike', name: '特夫里克', factionId: 'baizanting', lat: 39.37, lng: 38.11, type: 'pass', troops: 10000, region: 'WEST_ASIA_CASTLE', buildingStyle: 'TURKS', note: '[9世纪保罗派军事据点期·上幼发拉底峡谷巨石山顶堡塞] 843年后保罗派首领卡尔贝阿斯于拜占庭与阿拔斯边山筑特夫里克（迪夫里伊）石堡抗击东罗马，872年巴西尔一世平之（《续塞奥法尼斯编年史》IV），山地军事石塞且<1万，定险要。；现存为门居切克王朝遗构，取 TURKS 代理' },
    { id: 'city_melitene', name: '马拉蒂亚', factionId: 'abasi', lat: 38.35, lng: 38.31, type: 'small_city', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[罗马军团城至9世纪阿拉伯边境埃米尔都城·双层切石城墙马拉蒂亚] 查士丁尼扩筑双层巨石城墙，8–10世纪为阿拔斯前沿重镇，863年埃米尔乌马尔由此出征（巴拉祖里《诸国征服史》、《续塞奥法尼斯编年史》IV），城居约1.5–2.5万，定小城。' },
    { id: 'city_resaina', name: '雷萨伊纳', factionId: 'luoma_diguo', lat: 36.85, lng: 40.07, type: 'small_city', troops: 10000, region: 'ASSYRIAN', buildingStyle: 'ORIE', note: '[3至6世纪罗马波斯边境重城·哈布尔河源切石方塔城垣] 塞维鲁升殖民城、243年戈尔迪安三世破沙普尔一世于城外，383年狄奥多西一世重筑大型切石城垣改名狄奥多西波利斯（阿米阿努斯、普罗科匹厄斯《建筑志》II.5），具罗马石墙城郭，定小城。' },
    { id: 'city_amida', name: '阿米达', factionId: 'luoma_diguo', lat: 37.91, lng: 40.23, type: 'small_city', troops: 10000, region: 'ASSYRIAN', buildingStyle: 'ORIE', note: '[4世纪罗马东方重镇至伊斯兰期·底格里斯河岸黑色玄武岩巨墙坚城] 君士坦提乌斯二世筑5.5公里黑色玄武岩高墙（今迪亚巴克尔城墙），359年沙普尔二世围攻73日破城时城内军民与避难者逾2万（阿米阿努斯XIX.1–9亲历记），16世纪城居约2.5–3万，定小城。' },
    { id: 'city_rahba', name: '拉赫巴', factionId: 'abasi', lat: 35, lng: 40.42, type: 'pass', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[9至13世纪阿拔斯与阿尤布期·幼发拉底河西岸石砌沙漠边堡] 马利克·伊本·陶克始筑、希尔库迁建石砌拉赫巴新堡（Qal\'at al-Rahba）扼叙利亚入伊拉克河道咽喉，1058年巴萨西里自此举兵（伊本·阿西尔《全史》），河防石堡且<1万，定险要。', mirror: true },
    { id: 'city_singara', name: '辛加拉', factionId: 'luoma_diguo', lat: 36.32, lng: 41.86, type: 'pass', troops: 10000, region: 'ASSYRIAN', buildingStyle: 'ORIE', note: '[2至4世纪罗马美索不达米亚防线·辛贾尔山南麓石筑军团要塞] 第一帕提亚军团驻防之辛加拉石砌军团边塞（现存罗马U形石塔基垣），344年夜战及360年沙普尔二世以攻城槌破塞（阿米阿努斯《历史》XX.6），纯边境军塞且<1万，定险要。' },
    { id: 'city_hatra', name: '哈特拉', factionId: 'ansxi', lat: 35.59, lng: 42.72, type: 'small_city', troops: 10000, region: 'ASSYRIAN', buildingStyle: 'ORIE', note: '[2至3世纪安息藩属哈特拉王国·两公里直径双道石灰岩切石环城] 太阳神圣城哈特拉具直径两公里双层石灰岩切石城墙与百六十余座石塔，117与198年连挫图拉真、塞维鲁御驾围攻，240年萨珊攻陷（卡西乌斯·狄奥LXVIII.31、LXXV.10–12），城居约1.5–2.5万，定小城。' },
    { id: 'city_alamut', name: '阿剌模忒', factionId: 'yilihanguo_d', lat: 36.45, lng: 50.59, type: 'pass', troops: 10000, region: 'SAFAVID', buildingStyle: 'PERSIAN', note: '[11至13世纪尼扎里伊斯玛仪派·厄尔布尔士绝壁石砌鹰巢山堡] 1090年哈桑·萨巴赫夺取并扩建阿剌模忒绝顶石堡为木剌夷总大本营，1256年旭烈兀迫降鲁克赖丁拆毁其堡（志费尼《世界征服者史》下卷），纯山巅石堡要塞且<1万，定险要。' },
    { id: 'city_tamid', name: '怛蜜', factionId: 'womaya', lat: 37.22, lng: 67.28, type: 'small_city', troops: 10000, region: 'KUSHAN', buildingStyle: 'CENTRAL_ASIA', note: '[唐代怛蜜至萨曼花剌子模期·阿姆河北岸烧砖包砌大城忒耳迷] 《大唐西域记》卷一载怛蜜国大都城周二十余里，10–13世纪初铁尔梅兹具烧砖河岸内城与商业外郭，1220年成吉思汗围破前城居约2–4万（穆卡达西《地理志》、志费尼《世界征服者史》），>1万定小城。' },
    { id: 'city_shuman', name: '舒曼', factionId: 'womaya', lat: 38.52, lng: 68.55, type: 'stockade', troops: 10000, region: 'SOGDIANS', buildingStyle: 'CENTRAL_ASIA', note: '[7至8世纪吐火罗北境舒曼侯国·吉萨尔谷地生土山丘小城] 玄奘《大唐西域记》卷一载苏漫国（舒曼），710年倭马亚名将屈底波攻拔舒曼王城（塔巴里《历代先知与帝王史》II.1227），生土夯筑小邑且人口无载，定城寨。' },
    { id: 'city_lianyun', name: '连云堡', factionId: 'tubo', lat: 36.89, lng: 73.71, type: 'pass', troops: 10000, region: 'TIBET', buildingStyle: 'WESTERN', note: '[8世纪唐与吐蕃争夺帕米尔期·瓦罕河谷石土戍堡] 吐蕃于小勃律北道瓦罕河畔置连云堡屯兵千人据险阻唐，天宝六载（747）高仙芝自护密渡河仰攻拔连云堡（《旧唐书·高仙芝传》《资治通鉴》），名带「堡」且具石土堡垣，<1万定险要。' },
    { id: 'city_firozpur', name: '费罗兹普尔', factionId: 'yinggelan', lat: 30.93, lng: 74.61, type: 'stockade', troops: 10000, region: 'PURU', buildingStyle: 'PURU', note: '[14世纪德里苏丹国菲鲁兹沙始建·萨特莱杰河岸泥砖边镇] 14世纪中叶图格鲁克苏丹菲鲁兹沙三世始建河畔边镇（阿菲夫《菲鲁兹沙史》；1846年英锡战争属1700年后不采），≤1700年无石砖大城且人口无载，定城寨。；取最近拉合尔 PURU 代理' },
    { id: 'city_kaungton', name: '老官屯', factionId: 'konbaung', lat: 24.13, lng: 97.21, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BURMESE', note: '[1700年前伊洛瓦底江东岸·勐卯入缅水陆渡口木栅江村] 乾隆三十四年（1769）贡榜缅军筑双层湿圆木栅水寨拒清军傅恒、阿桂（《清史稿·缅甸传》，且晚于1700年）；木栅不算墙，≤1700年仅为江岸竹木渡村且人口<1万，定城寨。' },
    { id: 'city_chanthaburi', name: '尖竹汶', factionId: 'siam', lat: 12.61, lng: 102.1, type: 'stockade', isPort: true, troops: 10000, region: 'SEAS', buildingStyle: 'KHMER', note: '[阿瑜陀耶时期暹罗东岸·竹木土垒沿海小邑尖竹汶] 阿瑜陀耶王朝暹罗湾东岸边鄙海邑（1767年郑信破城整军属1700年后，《吞武里纪年》），≤1700年仅为土垒木栅小港镇且人口不足5000，定城寨。；取吞武里 KHMER 代理' },
    { id: 'city_guankou', name: '灌口', factionId: 'song', lat: 30.99, lng: 103.62, type: 'stockade', troops: 10000, region: 'BASHU', buildingStyle: 'BASHU', note: '[唐灌口镇至北宋平蜀之役·都江堰岷江出山口军商镇寨] 扼岷江出山入川西平原水口，乾德四年（966）宋军破蜀地全师雄乱军于灌口寨（《宋史·太祖纪》《元丰九域志》永康军导江县灌口镇），宋代为镇寨无砖石县城墙且人口<1万，定城寨。' },
    { id: 'city_longcheng', name: '陇城', factionId: 'han_d', lat: 35.03, lng: 105.91, type: 'stockade', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[东汉来歙袭略阳至北魏隋唐陇城县·清水河谷夯土县城] 建武八年（32）来歙伐山开道奇袭隗嚣略阳城坚守待援，北魏改置陇城县（《后汉书·来歙传》《魏书·地形志》），夯土山谷小县城且城居无破万记载，定城寨。' },
    { id: 'city_giadinh', name: '嘉定', factionId: 'yuenan', lat: 10.78, lng: 106.7, type: 'stockade', troops: 10000, region: 'HUAXIA_IMPERIAL', buildingStyle: 'VIETNAMESE', note: '[1698年广南阮主初置嘉定府·西贡河畔竹木营屯新垦聚落] 1698年阮有镜始置嘉定府柴棍营，1790年阮福映方筑砖石八卦棱堡城（《大南实录》，1790年砖石城超1700年红线不采）；≤1700年初设两年仅为竹木无墙屯垦镇且城居不足1万，定城寨。' },
    { id: 'city_zhennanguan', name: '镇南关', factionId: 'ming_d', lat: 21.97, lng: 106.75, type: 'pass', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[汉鸡陵关至宋大南关明镇南关·凭祥两山夹峙条石关城] 扼广西入交趾陆路第一咽喉，永乐五年（1407）张辅大军由此出关平定安南胡氏，明筑条石包砖关楼城垣（《明史·安南传》《广西通志》），带「关」字且具石砖关墙，未成万人城，定险要。；取最近花山 JIANGNAN 代理' },
    { id: 'city_baoanjun', name: '保安军', factionId: 'song', lat: 36.82, lng: 108.77, type: 'pass', troops: 10000, region: 'SONG', buildingStyle: 'WEI', note: '[北宋太平兴国至康定庆历御夏期·洛河上游夯土边防军寨] 宋改永康镇置保安军扼延州西北入西夏孔道，宝元至康定间狄青驻此四年中流矢屡破夏兵（《宋史·地理志》《狄青传》），纯西北边防夯土军城且常住不足1万，定险要。' },
    { id: 'city_danhanshan', name: '弹汗山', factionId: 'xianbei', lat: 41.08, lng: 114.02, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'XIANBEI', note: '[2世纪东汉末鲜卑檀石槐霸业期·歠水畔游牧毡帐王庭] 檀石槐立庭于高柳北三百余里弹汗山歠水之上统领东西中三部大人，熹平六年挫汉夏育等三路出塞军（《后汉书·鲜卑传》），草原毡帐汗庭无城垣且常住<1万，定城寨。' },
    { id: 'city_luze', name: '陆泽', factionId: 'tang', lat: 38.01, lng: 115.55, type: 'stockade', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[唐代河北藩镇深州治陆泽·滹沱河北岸夯土州治小城] 长庆二年（822）成德王庭凑围深州治陆泽城，刺史牛元翼率骑突围（《旧唐书·牛元翼传》《元和郡县图志》），唐代为夯土城垣且在城常住人口无确数（约数千<1万），定城寨。' },
    { id: 'city_dongping', name: '东平', factionId: 'tang', lat: 35.92, lng: 116.3, type: 'small_city', troops: 10000, region: 'CENTRAL', buildingStyle: 'CENTRAL', note: '[唐淄青节度郓州至北宋京东西路东平府·夯土包砖漕运重镇] 中晚唐李正己至李师道三代经营郓州为淄青十二州藩府，北宋升东平府（《旧唐书·李师道传》《宋史·地理志》东平府崇宁户130,305），州府在城及汶济漕渠关厢常住约2–4万，>1万定小城。' },
    { id: 'city_pinghaiwei', name: '平海卫', factionId: 'ming_d', lat: 25.23, lng: 119.34, type: 'pass', isPort: true, troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[明洪武至嘉靖抗倭期·莆田平海湾条石海防卫城] 洪武二十年江夏侯周德兴筑平海卫条石城垣（周四里余）控兴化湾海防，嘉靖四十二年戚继光、俞大猷合破倭寇收复卫城（《明史·戚继光传》《八闽通志》），纯海防石砌卫堡且常住<1万，定险要。' },
    { id: 'city_zhuluo', name: '诸罗', factionId: 'manzhou_d', lat: 23.48, lng: 120.45, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[清康熙二十三年初设诸罗县·台湾嘉南平原木栅刺竹县治] 康熙二十三年（1684）置诸罗县，康熙四十三年始筑木栅城（乾隆林爽文事在1787年超限，《诸罗县志》），≤1700年县治草创仅数百户不足5000人且为木栅无砖石墙，定城寨。' },
    { id: 'city_zhoushan', name: '舟山', factionId: 'ming_d', lat: 30.02, lng: 122.11, type: 'stockade', isPort: true, troops: 10000, region: 'JIANGNAN', buildingStyle: 'JIANGNAN', note: '[东晋孙恩起事至明代嘉靖双屿抗倭·舟山群岛海防所寨聚落] 隆安三年孙恩据翁洲海岛起兵、明洪武废昌国县置中中千户所（嘉靖二十七年卢镗破双屿港木栅窝巢，《晋书·孙恩传》《筹海图编》），明代岛上卫所与港聚分散未成万人城市，定城寨。' },
    { id: 'city_pingguo', name: '平郭', factionId: 'murong', lat: 40.25, lng: 122.12, type: 'stockade', troops: 10000, region: 'KOREA', buildingStyle: 'KOREA', note: '[两汉辽东郡属县至前燕慕容皝袭城·辽东半岛西岸夯土县城] 汉置平郭县有铁官盐官，咸康二年（336）慕容皝自昌黎踏冰渡海奇袭平郭擒慕容仁（《汉书·地理志》《晋书·慕容皝载记》），魏晋战乱后夯土边县城居不足1万，定城寨。；取最近安市城 KOREA 代理' },
    { id: 'city_kitanosho', name: '北之庄城', factionId: 'oda', lat: 36.06, lng: 136.22, type: 'small_city', troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[安土桃山柴田胜家至江户越前松平藩·九头龙川石垣巨城与福井城下町] 天正三年（1575）柴田胜家筑九重天守石垣北之庄城，庆长六年结城秀康扩建为越前68万石福井城下町，17世纪中叶城居达2.5–3万（《福井县史》及斋藤诚治江户都市人口表），>1万定小城。' },
    { id: 'city_kalisituosi', name: '卡里斯托斯', factionId: 'aqimeinide', lat: 38.01, lng: 24.42, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前5至前4世纪古典优卑亚南端城邦·大理石卫城与石砌环城墙港邦] 前490年抗波斯达提斯围攻、前472年入提洛同盟之卡里斯托斯城邦（希罗多德VI.99、修昔底德I.98），盛产奇波利诺大理石并筑有古典石砌城墙（Hansen & Nielsen 2004 p.653），<1万具石墙，定小城。' },
    { id: 'city_antiwali', name: '安提瓦里', factionId: 'saierweiya', lat: 42.10, lng: 19.10, type: 'small_city', isPort: true, troops: 10000, region: 'ITALIANS', buildingStyle: 'LATIN', note: '[中世纪塞尔维亚大主教驻地至威尼斯海防市镇·断崖巨石环城墙巴尔] 1089年升天主教大主教座、1443–1571年属威尼斯阿尔巴尼亚，筑完整中世纪至文艺复兴巨石环城墙、钟楼与石砌引水桥，常住市民约4000–5000人，<1万具完整石墙，定小城。' },
    { id: 'city_aolinsuosi', name: '奥林索斯', factionId: 'maqidun', lat: 40.29, lng: 23.35, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前5至前4世纪中叶卡尔基季基同盟盟主都城·南北双丘规则棋盘街坊与砖石城墙] 前348年马其顿腓力二世攻陷夷平前为北爱琴最大城邦（德摩斯梯尼《奥林索斯演说》载将逾万市民卖为奴），罗宾逊发掘数百座标准宅院确证前348年城居约1.5–2.5万（Cahill 2002），>1万定小城。' },
    { id: 'city_kawunas', name: '卡乌纳斯', factionId: 'litaowan', lat: 54.90, lng: 23.91, type: 'small_city', troops: 10000, region: 'LITHUANIANS', buildingStyle: 'LITHUANIANS', note: '[14至17世纪立陶宛大公国内河贸易第二大城·尼曼河红砖石堡与汉萨砖墙卡乌纳斯] 1362年科斯图提斯据红砖石堡血战条顿骑士团，1408年获马格德堡城市法并设汉萨商馆、16世纪筑砖石城垣与城门，16世纪末至1655年前城居约1.2–1.6万（Kiaupa《考纳斯史》），>1万定小城。' },
    { id: 'city_delusitaer', name: '德鲁斯塔尔', factionId: 'baojialiya', lat: 44.12, lng: 27.26, type: 'pass', troops: 10000, region: 'SLAVIC_CASTLE', buildingStyle: 'BULGARIANS', note: '[第一至第二保加利亚帝国·多瑙河下游巨石渡口要塞多罗斯托隆] 承罗马军团石城垣扼多瑙河下游多布罗加咽喉，971年斯维亚托斯拉夫据守、1278年保加利亚沙皇伊瓦伊洛于此抗击蒙古那海（帕希梅雷斯《历史》），河防石塞且中世纪常住<1万，定险要。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 CENTRAL_ASIA：也儿的石：额尔齐斯河上游乃蛮故地（屈出律退守处），归鞑靼（中亚草原）
    { id: 'city_yeerdishi', name: '也儿的石', factionId: 'naiman', lat: 47.85, lng: 85.60, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[1204年成吉思汗灭乃蛮后太阳汗之子屈出律与蔑儿乞脱黑脱阿退守集结地也儿的石河·额尔齐斯河上游草甸林营] 1208年冬成吉思汗长驱至也儿的石河（额尔齐斯河）击毙脱黑脱阿、迫屈出律西奔西辽（《元朝秘史》第198节、《元史·太祖纪》），河谷游牧驻营无城墙，定城寨。' },
    { id: 'city_mierkefu', name: '密尔科夫', factionId: 'kuman_oleshky', lat: 45.65, lng: 27.05, type: 'stockade', troops: 10000, region: 'CUMAN', buildingStyle: 'CUMAN', note: '[13世纪初钦察库曼汗博尔奇受洗所设天主教库曼主教区驻地密尔科夫·东喀尔巴阡米尔科夫河谷木土寨聚] 1227年匈牙利安德烈二世与教皇格列高利九世敕立库曼主教区（1241年蒙古拔都大军西征首破密尔科夫彻底焚毁，罗杰修士《悲歌》），原木土垒山麓教寨且人口不足3000人，定城寨。' },
    { id: 'city_oleshky', name: '奥列什基', factionId: 'kuman_oleshky', lat: 46.61, lng: 32.72, type: 'stockade', troops: 10000, region: 'CUMAN', buildingStyle: 'CUMAN', note: '[10至13世纪基辅罗斯第聂伯河口飞地商站奥列什耶（库曼草原南门）·河口芦苇沙洲木栅转运埠] 《往年纪事》与1223年迦勒迦河战前罗斯船队集结地奥列什耶，1220–1240年代库曼忽炭汗牧地南缘，沙洲木构码头聚落无石砖墙且常住仅两三千人，定城寨。', mirror: true },
    { id: 'city_saksin', name: '萨克辛', factionId: 'kuman_oleshky', lat: 46.72, lng: 47.92, type: 'small_city', troops: 10000, region: 'CUMAN', buildingStyle: 'CUMAN', note: '[11至13世纪初伏尔加河三角洲库曼乌古斯国际商都·烧砖泥砖多族坊区萨克辛] 接替可萨伊蒂尔兴起之里海北岸商贸大都会，1130–1150年代阿拉伯旅行家阿布·哈米德·格拉纳达人旅居萨克辛二十年亲笔记城分四十部族坊区、商民数万，1236年毁于蒙军，>1万定小城。', mirror: true },
    { id: 'city_ahexikesi', name: '阿赫西克特', factionId: 'mowoer', lat: 40.89, lng: 71.34, type: 'stockade', troops: 10000, region: 'WESTERN_CASTLE', buildingStyle: 'WESTERN', note: '[15世纪末帖木儿后裔乌马儿·谢赫（巴布尔之父）费尔干纳国都阿赫西克特·锡尔河北岸黄土断崖生土泥砖高城] 巴布尔《回忆录》开卷详述阿赫西克特据锡尔河深涧黄土高台筑生土泥砖城（非烧砖石墙），1620年特大地震彻底震塌沦为废墟迁往纳曼干，≤1700年存续期泥砖小王城常住约6000–9000人<1万，定城寨。' },
    { id: 'city_hongsa', name: '洪萨', factionId: 'muisca', lat: 5.53, lng: -73.36, type: 'small_city', troops: 10000, region: 'SOUTHAM_IMPERIAL', buildingStyle: 'MUISCA', note: '[15至16世纪初哥伦比亚高原穆伊斯卡北盟扎克王都·双层巨木栅墙宫苑与连片都邑洪萨] 穆伊斯卡北方最高君主扎克（Zaque）首都洪萨（今通哈），1537年西军克萨达入城目击报告载城内宫宇神庙与密集圆形房舍逾数千座、常住人口约2–3万（Langebaek穆伊斯卡聚落考古），>1万定小城。' },
    { id: 'city_kabufoliwu', name: '卡布弗里乌', factionId: 'tamoyue', lat: -22.88, lng: -42.03, type: 'stockade', isPort: true, troops: 10000, region: 'TUPI', buildingStyle: 'TUPI', note: '[16世纪巴西东南岸图皮南巴人塔莫约部族联盟昆汉贝贝大木栅村寨卡布弗里乌·海岸红木林双排原木尖桩长屋寨] 1550年代德国炮手汉斯·施塔登被俘亲历所著《真实记述》插图详绘昆汉贝贝海滨寨落：双圈粗原木立栅围绕数座巨型茅顶长屋（Maloca），无石墙且单寨人口约2000–4000人<1万，定城寨。' },
    { id: 'city_kelipuli', name: '科利普利', factionId: 'mapuche', lat: -37.95, lng: -72.43, type: 'stockade', troops: 10000, region: 'MAPUCHE', buildingStyle: 'MAPUCHE', note: '[16世纪智利阿劳科战争马普切人抗西集结要地科利普利·马列科河谷原木栅栏土壕部族战寨（普卡拉）] 埃尔西利亚史诗《阿劳卡纳》所记马普切战酋考波利坎、加尔瓦里诺誓师抗西之纳韦尔布塔山麓谷地，原木栅栏战壕营寨且无万人城镇，定城寨。' },
    { id: 'city_bideluoa', name: '彼得罗阿', factionId: 'mapuche', lat: -35.03, lng: -71.55, type: 'stockade', troops: 10000, region: 'MAPUCHE', buildingStyle: 'MAPUCHE', note: '[1557年马普切青年统帅劳塔罗北逼圣地亚哥阵亡殉国地彼得罗阿·马塔基托河岸原木鹿砦壕沟军寨] 劳塔罗率马普切军于马塔基托河岸彼得罗阿筑原木削尖拒马深壕营寨，遭西班牙总督比亚格拉偷袭力战阵亡（贡戈拉·马莫莱霍《智利王国史》），战时木栅营垒无居民城，定城寨。' },
    { id: 'city_mengteluo', name: '蒙特罗', factionId: 'bogendigongguo', lat: 48.39, lng: 2.95, type: 'pass', troops: 10000, region: 'BURGUNDIANS', buildingStyle: 'BURGUNDIANS', note: '[百年战争勃艮第与法兰西争衡期·塞纳约讷两河汇口石砌桥堡] 扼塞纳河与约讷河交汇水陆锁钥之石砌桥头城堡，1419年无畏的约翰于蒙特罗桥塞会盟被刺、1437年查理七世围克（科明及蒙斯特勒莱《编年史》），守津石堡且常住<1万，定险要。' },
    { id: 'city_oushi', name: '欧什', factionId: 'amaniyake', lat: 43.65, lng: 0.58, type: 'small_city', troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS', note: '[高卢罗马奥古斯塔奥斯乔鲁姆至中世纪阿马尼亚克伯爵首府与大主教座·热尔河高岸石砌环城墙] 加斯科涅历史首府与阿马尼亚克派大本营欧什，上城筑完整中世纪石灰岩环城墙与普伊斯特里石门，≤1700年城居约6000–8000人，<1万但具完整石砌城墙，定小城。' },
    { id: 'city_geluosite', name: '格洛斯特', factionId: 'yinggelan', lat: 51.86, lng: -2.24, type: 'small_city', troops: 10000, region: 'BRITONS', buildingStyle: 'BRITONS', note: '[罗马格莱维姆殖民城至英格兰伯爵首府·塞文河石砌环城墙自治市] 沿袭罗马石墙地基修筑中世纪四门石砌环城墙，11–17世纪为西英格兰航运与羊毛市镇（1643年凭石墙土垒抗查理一世围攻），城居约5000–7000人，<1万具石墙，定小城。' },
    { id: 'city_kesenza', name: '科森扎', factionId: 'xigete', lat: 39.30, lng: 16.25, type: 'small_city', troops: 10000, region: 'LATIN', buildingStyle: 'LATIN', note: '[布鲁蒂人古都、410年西哥特亚拉里克卒地至诺曼斯瓦本卡拉布里亚重镇·石堡与石砌城墙] 扼克拉蒂河谷孔道之科森扎，腓特烈二世扩建潘多西亚石堡与中世纪石砌城墙，16世纪那不勒斯王国户灶清册（fuochi）实测城居约1–1.3万且具石墙，定小城。' },
    { id: 'city_nabone', name: '纳博讷', factionId: 'xigete', lat: 43.18, lng: 3.00, type: 'small_city', isPort: true, troops: 10000, region: 'GOTHS', buildingStyle: 'GOTHS', note: '[罗马纳博高卢行省首府、5世纪西哥特阿陶尔夫王廷至16世纪法南边防石城·文艺复兴巨石棱堡墙] 罗马外高卢第一殖民首府（盛期逾3万），西哥特曾驻王廷，16世纪弗朗索瓦一世镶嵌古罗马石碑重筑完整巨石棱堡环城墙，16–17世纪城居约1–1.2万且具石墙，定小城。' },
    // 🔴 [2026-10-13 主人令「添加一个据点，关岛」] 太平洋新增据点（全库此前无马里亚纳/查莫罗任何记录）
    // 🔴 [2026-10-13 主人令「查不到的一律城寨」] 定级：非险要（拉特石柱是屋基、无石头城墙）→ 城市档；
    //    阿加尼亚**单邑城居人口史料查不到**，不许拿全岛 4–10 万去推一个村落 ⇒ 按「算不出来一律按城寨」落 **城寨(stockade)**。
    { id: 'city_hagatna', name: '阿加尼亚', factionId: 'chamorro', lat: 13.4757, lng: 144.7500, type: 'stockade', isPort: true, troops: 10000, region: 'SEASIA_IMPERIAL', buildingStyle: 'MALAY', stockadeShape: 'square', stockadeFence: 'DARK', note: '[15至17世纪马里亚纳群岛查莫罗人拉提石柱主村与1668年西属教区阿加尼亚·关岛珊瑚礁岸高脚拉提石木屋聚落] 1521年麦哲伦环球首靠岛屿，1670年代查莫罗首领胡劳率众围攻西班牙木栅教会寨（《马里亚纳传教史》），拉提石基柱茅顶木屋无城墙且全村不足3000人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】密克罗尼西亚查莫罗拉提石聚落，取最近南岛MALAY' },
    { id: 'city_lier', name: '里尔', factionId: 'bogendigongguo', lat: 50.63, lng: 3.06, type: 'small_city', troops: 10000, region: 'BURGUNDIANS', buildingStyle: 'BURGUNDIANS', note: '[15世纪勃艮第公国北都（好人菲利普宫廷）至1668年沃邦扩建·砖石星形棱堡纺织大城里尔] 佛兰德商业重镇里尔，好人菲利普筑里尔宫，1667年路易十四攻克后沃邦筑巴黎门与五角砖石棱堡外城，1600年城居3.3万、1700年达5.5万（de Vries 1984 p.273），>1万定小城。' },
    // 🔴 [2026-09-18 主人定：一级按真实地理、二级按民族政权] 原「WEST」→ 归 CELTS：哈瓦登：威尔士东北，凯尔特
    { id: 'city_hawadeng', name: '哈瓦登', factionId: 'weiershigongguo', lat: 53.18, lng: -3.03, type: 'pass', troops: 10000, region: 'BRITONS', buildingStyle: 'CELTS', note: '[13世纪威尔士抗英战争·迪河口砂岩石砌圆形主塔边堡] 扼切斯特入北威尔士沿海走廊之哈瓦登石堡，1282年棕枝主日戴菲德突袭英军守将克利福德引发威尔士终战（《威尔士王公编年史》），纯边境石堡且<1万，定险要。' },
    // 🔴 [2026-09-18 主人定：一级按真实地理、二级按民族政权] 原「BRITONS」→ 归 CELTS：布伊尔斯：威尔士中部，凯尔特
    { id: 'city_buyiersi', name: '布伊尔斯', factionId: 'weiershigongguo', lat: 52.15, lng: -3.40, type: 'pass', troops: 10000, region: 'BRITONS', buildingStyle: 'CELTS', note: '[13世纪末威尔士战争·怀伊河渡口爱德华一世石筑军堡] 1277年爱德华一世于中威尔士怀伊河渡口改筑石砌环墙多塔军堡，1282年末代亲王卢埃林于堡旁伊尔冯桥阵亡（Taylor《国王工役史》），守渡石堡且<1万，定险要。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1」] 原「ASIA」只给一级、二级靠 region 推 → 归 VIETNAMESE：义安（Nghe An）：越南中部；AGENTS 归位原则「越南归东南亚」，一级随 VIETNAMESE = SEAS
    { id: 'city_yian', name: '义安', factionId: 'daquyue', lat: 18.67, lng: 105.68, type: 'small_city', isPort: true, troops: 10000, region: 'VIETNAMESE', buildingStyle: 'VIETNAMESE', note: '[唐驩州至大越李陈后黎南界重镇乂安镇·蓝江流域砖土镇城与商港会统] 大越南疆经略占婆之军事行政重镇乂安（黎利蓝山起义曾移师茶麟乂安席卷全国，《大越史记全书》），后黎镇营治所与蓝江港埠连片常住逾1–1.5万，定小城。' },
    { id: 'city_debuleidamo', name: '德布雷达莫', factionId: 'ethiopia', lat: 14.37, lng: 39.27, type: 'stockade', troops: 10000, region: 'AFRICA_CASTLE', buildingStyle: 'ETHIOPIANS', note: '[6世纪阿克苏姆加布雷·马斯卡尔王创修至16世纪抗阿达尔入侵王室避难所德布雷达莫·提格雷平顶砂岩绝壁孤峰修道院] 高悬百尺垂直绝壁、惟赖15米皮绳攀登而上之平顶山修道院（1530年代勒布纳·登格尔王室据峰顶避格拉尼大军，《埃塞俄比亚编年史》），非守道关门且崖顶仅住修士数百人无城墙，定城寨。' },
    { id: 'city_waka', name: '瓦卡', factionId: 'wulaertu', lat: 37.81, lng: 35.91, type: 'pass', troops: 10000, region: 'ARMENIANS', buildingStyle: 'ARMENIANS', note: '[11至13世纪奇里乞亚亚美尼亚鲁本王朝·陶鲁斯山巅玄武岩绝壁山堡] 鲁本王室发祥要塞瓦卡堡（Vahka），踞陶鲁斯峡谷绝顶筑巨石墙控奇里乞亚北通卡帕多细亚山道，托罗斯二世据此复国（《斯姆巴特编年史》），纯山道石塞且<1万，定险要。' },
    { id: 'city_debuleilibanuosi', name: '德布雷利巴诺斯', factionId: 'ethiopia', lat: 9.71, lng: 38.85, type: 'stockade', troops: 10000, region: 'ETHIOPIANS', buildingStyle: 'ETHIOPIANS', note: '[1284年圣特克莱·海马诺特创立之埃塞俄比亚正教会首席修道中心德布雷利巴诺斯·肖阿高原杰马峡谷石木修院聚落] 所罗门王朝精神支柱修道院（1531年遭阿达尔军焚毁后重建，Pankhurst考证），属山谷纯宗教修院村落无防卫城墙且常住修士佃民约2000–3000人<1万，定城寨。' },
    { id: 'city_santaguan', name: '三塔关', factionId: 'konbaung', lat: 14.35, lng: 98.43, type: 'pass', troops: 10000, region: 'BURMESE', buildingStyle: 'BURMESE', note: '[东吁至贡榜缅泰战争期·他念他翁山脉砖石佛塔山口关隘] 扼下缅甸通暹罗桂河走廊唯一低平山口，16–18世纪莽应龙、雍笈牙与摩诃悉都屡由此关进兵阿瑜陀耶（《琉璃宫史》《大城王朝编年史》），带「关」字且史明为界山雄关，未成万人城，定险要。' },
    { id: 'city_danmaxi', name: '淡马锡', factionId: 'malacca', lat: 1.29, lng: 103.85, type: 'small_city', isPort: true, troops: 10000, region: 'MALAY', buildingStyle: 'MALAY', note: '[14世纪海峡古国单马锡（新加坡拉王国）·皇家山夯土石基防墙与新加坡河口港邑] 汪大渊《岛夷志略》亲历记龙牙门与单马锡，新加坡福康宁山与河岸考古发掘大量元代瓷器及《马来纪年》所载防墙护城河，Miksic（2013）据遗址范围测算14世纪城居约1万，刚及门槛定小城。' },
    { id: 'city_jinqi', name: '金奇', factionId: 'taimier', lat: 12.25, lng: 79.42, type: 'pass', troops: 10000, region: 'INDIA_IMPERIAL', buildingStyle: 'INDIA', note: '[16至17世纪毗奢耶那伽罗与马拉塔期·泰米尔三山连环花岗岩巨堡] 连接拉贾吉里等三座花岗岩孤峰筑13公里巨石高墙与深壕，1690–1698年马拉塔王拉贾拉姆凭金奇堡拒莫卧儿祖尔菲卡尔汗八年长围（萨卡尔《奥朗则布史》），纯山城巨塞且常住<1万，定险要。' },
    { id: 'city_damasikusi', name: '大马士革', factionId: 'womaya', lat: 33.5131, lng: 36.3094, type: 'medium_city', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[8世纪倭马亚哈里发国至马穆鲁克期·罗马地基巨石都城墙] 倭马亚王朝帝都期及阿尤布、马穆鲁克盛期，大马士革石墙与贴城萨利希亚关厢人口约10–15万（Chandler 750年表15万、1500年表10万），>10万定中城。' },
    { id: 'city_emesa', name: '埃梅萨', factionId: 'mamuluke', lat: 34.73, lng: 36.71, type: 'small_city', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[罗马塞维鲁皇室母邦至阿尤布马穆鲁克叙利亚中枢·黑色玄武岩七门环城墙霍姆斯] 罗马太阳神庙名城埃梅萨，阿尤布希尔库王系都城（1281年马穆鲁克大破伊利汗国蒙军于城外），筑黑色玄武岩环城墙与卫城，中世纪至奥斯曼前期城居约1.5–2.5万且具石墙，定小城。' },

    { id: 'city_yelusaleng', name: '耶路撒冷', factionId: 'xibolai', lat: 31.77, lng: 35.21, type: 'medium_city', troops: 10000, region: 'HEBREWS', buildingStyle: 'ORIE', note: '[公元1世纪第二圣殿末期·希律巨石三重城墙圣城] 公元41–66年阿格里帕一世增筑第三道巨石城墙后，城垣围合180公顷，扣除逾越节临时朝圣客后常住城居约8–10万（Levine 2002《第二圣殿时期耶路撒冷》及Geva考古测算），≥8万容差线，定中城。' },
    { id: 'city_ake', name: '阿卡', factionId: 'yelusalengwg', lat: 32.92139, lng: 35.06889, type: 'small_city', isPort: true, troops: 10000, region: 'ORIE', buildingStyle: 'FRANKS', mirror: true, note: '[1191至1291年十字军耶路撒冷王国后期首都圣让达克尔·双层巨石高塔海陆城墙] 第三次十字军收复后为东地中海十字军王都及三大骑士团总部，外扩蒙穆萨尔新城区并筑双道巨石高墙，1291年马穆鲁克破城前城居达3–4万（Jacoby十字军阿卡人口考），>1万定小城。' },
    { id: 'city_beirut', name: '贝鲁特', factionId: 'mamuluke', lat: 33.8900, lng: 35.5000, type: 'small_city', isPort: true, region: 'ORIE', buildingStyle: 'ORIE', troops: 10000, note: '[马穆鲁克至17世纪法赫尔丁埃米尔都城·砂岩石砌环城墙黎凡特商港] 1291年后大马士革首席外港，17世纪初德鲁兹埃米尔法赫尔丁二世扩建宫苑与砂岩石砌城墙，≤1700年城居约1–1.5万且具完整石墙，定小城。' },
    // 🔴 [2026-09-23 主人令「先添加据点」] 推罗城（腓尼基母城、黎凡特海岛港市）。
    //    id / 坐标取**英文维基百科 Tyre, Lebanon 的坐标 33.27083,35.19611**；2026-09-12 主人特批时它与阿卡相距 39.42 km、
    //    曾列入 §2.1.1.1 唯一一条特许例外；🔴 [2026-09-24 主人令「可以稍微移动一点坐标」] 阿卡锚点改取旧城坐标后，
    //    两城现距 40.63 公里，已过 ≥40 公里硬闸，**特许例外清单清空、无需特批**。
    //    理由同主人原批：「攻城战必须打一座真据点，战场承载不了」——亚历山大剧本第三段「推罗战役」的攻城载体。
    //    🔴 [2026-09-24 主人定「攻城战必须有据点，攻城战不要搞什么战场」] 此后再无 `bf_tuile` 战场记录：
    //    攻城战的目标就是这座城，地点/坐标以本据点为准，战后以据点易主（cityUpdates）体现战果。
    //    region 取 ORIE：迦南的番号「推罗水师」登记在 OrieExpeditionLegions（本区）；同区大马士革/加沙/耶路撒冷亦为 ORIE 系。
    { id: 'city_tuile', name: '推罗', factionId: 'kanan', lat: 33.2709, lng: 35.1962, type: 'small_city', isPort: true, troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[前10至前4世纪腓尼基海上母邦与十字军大主教坚城·高达45米海岛巨石城墙推罗] 前332年亚历山大筑跨海长堤围攻七个月破推罗岛城，阿里安II.24.4–5与狄奥多罗斯XVII.46明载城破战死八千、被卖为奴平民三万人（合逾4万）且具巨石高墙，>1万定小城。' },

    { id: 'city_kolossi', name: '科洛西', factionId: 'shengdian_qishi', lat: 34.664, lng: 32.934, type: 'pass', isPort: true, troops: 10000, region: 'ATHENIANS', buildingStyle: 'FRANKS', note: '[13至15世纪圣殿与医院骑士团·塞浦路斯南岸切石方形主楼军堡] 1210年吕西尼昂王赐地筑堡、1454年医院骑士团重建高21米石灰岩切石方堡控利马索尔海岸平原（大海纯军事统领驻所，Pringle考证），石堡要塞且无万人镇，定险要。' },
    { id: 'city_mengfeisi', name: '孟菲斯', factionId: 'aiji', lat: 29.85, lng: 31.25, type: 'medium_city', troops: 10000, region: 'EGYPT', buildingStyle: 'ORIE' , note: '[古埃及古王国至托勒密期·白墙泥砖石庙尼罗河大都会] 埃及千年旧都孟菲斯（「白墙城」），新王国至晚埃及、托勒密时期建成区逾6平方公里，城居峰值约10–15万（斯特拉波XVII.1.32称埃及第二大城，Chandler前430年表10万、Thompson 2012考算8–15万），≥10万定中城。' },
    { id: 'city_xiwa', name: '锡瓦绿洲', factionId: 'aiji', lat: 29.2, lng: 25.52, type: 'stockade', troops: 10000, region: 'EGYPT', buildingStyle: 'ORIE', stockadeShape: 'octagon', stockadeFence: 'FENCE', note: '[古埃及第26王朝建阿蒙神谕庙至前331年亚历山大西征问卜圣地锡瓦绿洲·利比亚大沙海盐泥块（Kershef）台丘寨村] 阿里安《远征记》III.3–4详记亚历山大穿酷旱沙漠抵阿蒙绿洲问卜，中世纪筑沙利（Shali）盐泥块密集蜂巢村寨，深漠孤立绿洲全境常住仅约2000–3000人且为盐泥墙，定城寨。' },
    { id: 'city_wasaite', name: '瓦塞特', factionId: 'aiji', lat: 25.7, lng: 32.64, type: 'medium_city', troops: 10000, region: 'EGYPT', buildingStyle: 'ORIE', note: '[古埃及新王国第18至19王朝·泥砖石庙百门帝都底比斯] 图特摩斯三世至拉美西斯二世时期上埃及都城瓦塞特（底比斯／卢克索）尼罗河两岸连片建成区峰值约8–12万（Chandler前1400–前1200年表8–10万、Modelski估10万以上），≥8万定中城。' },
    { id: 'city_yalishanda', name: '亚历山大', factionId: 'tuolemi', lat: 31.1975, lng: 29.8925, type: 'big_city', isPort: true, troops: 10000, region: 'EGYPT', buildingStyle: 'MACEDONIAN', mirror: true, note: '[托勒密晚期至罗马初期·切石海陆大城垣] 前1世纪中叶狄奥多罗斯《历史丛书》XVII.52.6明载城内自由民逾30万，合奴隶与外侨城居峰值约45–50万（Chandler／Modelski表），≥40万容差线，定大城。' },
    { id: 'city_babilun', name: '巴比伦', factionId: 'jialedi', lat: 32.5425, lng: 44.4211, type: 'medium_city', troops: 10000, region: 'BABYLON', buildingStyle: 'ORIE', note: '[前6世纪新巴比伦尼布甲尼撒二世期·烧砖琉璃双城垣帝都] 新巴比伦帝国极盛期（前562年前后）内外烧砖大城垣围合逾850公顷，城居峰值约15–20万（希罗多德I.178及Chandler／Modelski前600–前500年表15–20万），>10万定中城。' },
    { id: 'city_tademoer', name: '塔德莫尔', factionId: 'paermila', lat: 34.55, lng: 38.27, type: 'small_city', troops: 10000, region: 'ORIE_ANTIQUITY', buildingStyle: 'ORIE', note: '[2至3世纪罗马东方商贸王国帕尔米拉（芝诺比娅女王都城）·戴克里先切石城墙绿洲都会] 连接两河与地中海之沙漠商队王都塔德莫尔，公元272年奥勒良征讨前柱廊大街建成区逾120公顷，按供水与墓塔家族容量测算城居峰值约3–5万（Yon 2002《帕尔米拉贵显社会》），>1万定小城。' },
    { id: 'city_bageda', name: '巴格达', factionId: 'abasi', lat: 33.33, lng: 44.37, type: 'big_city', troops: 10000, region: 'WEST_ASIA', buildingStyle: 'ORIE' , note: '[8至9世纪阿拔斯极盛期·烧砖泥砖圆城两岸大都] 阿拔斯王朝哈伦·拉希德至马蒙时期圆城及卡尔赫、鲁萨法两岸连片城区峰值约70–90万（雅库比《列国志》及Chandler 800–900年表70–90万），>50万定大城。' },
    { id: 'city_samaila', name: '萨迈拉', factionId: 'abasi', lat: 34.206, lng: 43.880, type: 'medium_city', troops: 10000, region: 'WEST_ASIA', buildingStyle: 'ORIE' , note: '[9世纪阿拔斯迁都期·底格里斯河东岸泥砖烧砖狭长帝都] 836–892年穆阿台绥姆至穆塔瓦基勒营建阿拔斯新都萨迈拉，沿河35公里连片宫苑军营坊市峰值约15–25万（雅库比《列国志》及Northedge《萨迈拉历史地形学》考算），>10万定中城。' },
    { id: 'city_awalisi', name: '阿瓦里斯', factionId: 'xikesuosi', lat: 30.79, lng: 31.83, type: 'medium_city', troops: 10000, region: 'EGYPT', buildingStyle: 'ORIE', note: '[前17至前13世纪喜克索斯都城与兰塞城·泥砖防墙三角洲大都] 喜克索斯第十五王朝都城阿瓦里斯（泰勒达巴遗址逾250公顷）及毗连的拉美西斯二世都城皮-拉美西斯，建成区峰值达10–16万（Bietak 1996奥地利考古队发掘测算及Modelski表10–16万），≥10万定中城。' },
    { id: 'city_niniwei', name: '尼尼微', factionId: 'yashu', lat: 36.36, lng: 43.15, type: 'medium_city', troops: 10000, region: 'ASSYRIAN', buildingStyle: 'ORIE', note: '[前7世纪新亚述帝国极盛期·巨石基泥砖十五门王都] 辛那赫里布与亚述巴尼拔时期（前700–前612年）12公里石基泥砖城墙围合750公顷，城居峰值约10–15万（Stronach考古测算及Chandler／Modelski前650年表12万），>10万定中城。' },
    { id: 'city_tapusakusi', name: '塔普萨库斯', factionId: 'aqimeinide', lat: 35.91, lng: 38.53, type: 'stockade', troops: 10000, region: 'ASSYRIAN', buildingStyle: 'ORIE', stockadeShape: 'rect', stockadeFence: 'ARCHAIC', note: '[前401年小居鲁士十万军与前331年亚历山大架双浮桥东渡幼发拉底河古渡镇塔普萨库斯·河岸泥砖渡津商驿] 色诺芬《长征记》I.4.11称其富裕大镇，然前331年波斯总督马泽乌斯弃守、塞琉古时期渡口北移泽乌格马后塔普萨库斯迅速湮没至连确址亦失考（普林尼V.21），无石墙实证且查无人口数字，定城寨。' },
    { id: 'city_nixibisi', name: '尼西比斯', factionId: 'luoma_diguo', lat: 37.07, lng: 41.22, type: 'small_city', troops: 10000, region: 'ASSYRIAN', buildingStyle: 'ORIE', note: '[3至4世纪罗马美索不达米亚屏障重镇·双层烧砖巨石厚墙尼西比斯] 337、346、350年三挫波斯王沙普尔二世围城，363年约维安割让该城时阿米阿努斯XXV.9与佐西姆斯明载罗马迁出城内市民数万人（约3–4万），具双层砖石城墙且逾万，定小城。' },

    { id: 'city_anate', name: '阿纳特', factionId: 'abasi', lat: 34.47, lng: 41.96, type: 'stockade', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE' , note: '[古亚述安纳特、363年尤里安大帝波斯远征受降河心岛堡至阿拔斯幼发拉底河驿镇阿纳·狭长河心岛泥砖碎石小聚] 阿米阿努斯XXIV.1载尤里安受降河岛小堡Anatha并迁走居民焚堡，中世纪伊斯兰地理志记其为幼发拉底河心长岛椰枣园聚落，岛窄无万人空间（常住仅两三千人），定城寨。' },
    { id: 'city_hamadan', name: '哈马丹', factionId: 'midi', lat: 34.8, lng: 48.51, type: 'medium_city', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN', note: '[前6至前4世纪米底与阿契美尼德夏都·埃克巴坦那宫堡大邑] 米底王国都城及波斯阿契美尼德夏都埃克巴坦那（哈马丹），建成区峰值约8–10万（波利比乌斯X.27及Modelski《世界城市史》前500年表10万），≥8万容差线，定中城。' },
    { id: 'city_adana', name: '阿达纳', factionId: 'heti', lat: 37.0, lng: 35.3213, type: 'small_city', troops: 10000, region: 'HITTITES', buildingStyle: 'TURKS', note: '[赫梯古邑、罗马庞培重整至奥斯曼拉马赞侯国首府·塞汉河罗马石桥与砖石城堡城垣] 奇里乞亚平原中枢阿达纳，14–16世纪为突厥曼拉马赞王朝都城，1572年奥斯曼税册约5100人、17世纪增至近万，具罗马拜占庭与马穆鲁克重修砖石城防体系，按石砖城郭定小城。' },
    { id: 'city_bosibolisi', name: '波斯波利斯', factionId: 'aqimeinide', lat: 29.93, lng: 52.89, type: 'small_city', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN' , note: '[前6至前4世纪阿契美尼德帝国礼仪王都帕尔萨·18米巨石台基宫城与山麓下城] 大流士一世与薛西斯营建之巨石宫台，近年伊朗—意大利联合地球物理与考古勘探确证宫台西侧Firuzi连片贵族工匠下城，前330年焚毁前常住工役卫队市民约2–3万，>1万定小城。' },


    { id: 'city_feiluzhabade', name: '菲鲁扎巴德', factionId: 'sashan', lat: 28.85, lng: 52.53, type: 'small_city', troops: 10000, region: 'PERSIAN', buildingStyle: 'SASANIAN', note: '[公元224年萨珊开国君主阿尔达希尔一世首建圆城古尔·直径1.95公里双道土石高墙] 萨珊王朝发祥王都阿尔达希尔-花拉（菲鲁扎巴德），以圆规规划精确直径近2公里双层高墙四门与中央石塔（塔巴里《历代先知与帝王史》），萨珊盛期圆城及外坊常住约2–4万，>1万定小城。' },
    { id: 'city_susa', name: '苏萨', factionId: 'ailan', lat: 32.1906, lng: 48.2578, type: 'small_city', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN', note: '[埃兰王国千年古都至前6至前4世纪阿契美尼德冬都·大流士石柱宫台与400公顷泥砖烧砖城垣] 波斯帝国行政冬都苏萨（希罗多德V.52波斯御道东端），法国考古团发掘皇家城、工匠城等四重台城，阿契美尼德至塞琉古盛期城居约3–5万（Chandler前500年表4–5万），>1万定小城。' },
    { id: 'city_yisifahan', name: '伊斯法罕', factionId: 'safawei_d', lat: 32.65, lng: 51.66, type: 'big_city', troops: 10000, region: 'SAFAVID', buildingStyle: 'PERSIAN', note: '[17世纪萨法维阿拔斯大帝期·砖石泥砖王城与关厢] 萨法维都城伊斯法罕1620–1670年城垣内及新朱尔法等贴城关厢常住人口约40–55万（夏尔丹《波斯游记》扣除远郊村镇折算；Chandler 1650年表35–50万），≥40万容差线，定大城。' },
    { id: 'city_wuluke', name: '乌鲁克', factionId: 'sumeier', lat: 31.32, lng: 45.64, type: 'medium_city', troops: 10000, region: 'BABYLON', buildingStyle: 'ORIE' , note: '[前29世纪苏美尔早王朝盛期·吉尔伽美什烧砖泥砖巨垣都城] 乌鲁克早王朝一期9.5公里城墙围合400–550公顷建成区，城居峰值约8万（Nissen德国考古队测算5–8万、Modelski 2003《世界城市》前2800年表8万），踩8万容差线，定中城。' },

    { id: 'city_alepo', name: '阿勒颇', factionId: 'ayoubu', lat: 36.2, lng: 37.16, type: 'medium_city', troops: 10000, region: 'MAMLUKS', buildingStyle: 'ORIE', note: '[阿尤布至16至17世纪奥斯曼商都期·巨石卫城与石砌城垣] 阿尤布都城及16–17世纪奥斯曼黎凡特陆上丝路枢纽，阿勒颇石墙与朱代达等关厢实测纳税户折算人口达11–13万（Raymond《奥斯曼阿拉伯大城》户籍册考证），>10万定中城。' },
    // ── 2026-08-04 新增：埃德萨（奥斯若恩国都；十字军埃德萨伯国首府）──
    { id: 'city_aidesa', name: '埃德萨', factionId: 'aosiruowen', lat: 37.15, lng: 38.7825, type: 'small_city', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[奥斯若恩王国古都、拜占庭重镇至1098至1144年十字军埃德萨伯国首都·查士丁尼双层切石城墙] 美索不达米亚西北锁钥埃德萨（乌尔法），查士丁尼重筑防洪切石双层城墙与深凿护城壕，1144年赞吉破城时城内基督徒与各族居民达3–4万（Chandler 1100年表2.5–3.5万），>1万定小城。' },
    { id: 'city_daerban', name: '打耳班', factionId: 'kesa', lat: 42.06, lng: 48.3, type: 'pass', troops: 10000, region: 'KHAZARS', buildingStyle: 'SASANIAN', note: '[6世纪萨珊霍斯劳一世至阿拉伯可萨争霸期·里海高加索巨石双道关城] 萨珊修筑纳林卡拉石堡及直伸入里海之40公里双道巨石长城锁死高加索东岸走廊（巴拉祖里《诸国征服史》称「关门之门」Bab al-Abwab），纯山海雄关且早期常住<1万，定险要。' },
    { id: 'city_miletus', name: '米利都', factionId: 'aiaoniya', lat: 37.5303, lng: 27.2783, type: 'small_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前6至前4世纪爱奥尼亚首席名邦·切石高墙与四港棋盘都会米利都] 希波吕达姆斯规划棋盘街区与坚固切石海陆城垣，前494年拉德海战独出战舰八十艘（希罗多德VI.8，前334年亚历山大围攻石墙破城），古典盛期城居达3–5万（Greaves 2002），>1万且具石墙，定小城。' },
    { id: 'city_yifusuo', name: '以弗所', factionId: 'aiaoniya', lat: 37.94, lng: 27.34, type: 'medium_city', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE' , note: '[希腊化至罗马帝国亚细亚省首府·利西马科斯巨石城垣] 公元1–2世纪罗马亚细亚行省首府以弗所9公里石墙围合逾400公顷，据剧场容量与水道供水及铭文公民数折算城居峰值约15–20万（Hanson 2011及Modelski表20万），>10万定中城。' },
    { id: 'city_ankala', name: '安卡拉', factionId: 'jialatai', lat: 39.9289, lng: 32.8547, type: 'small_city', troops: 10000, region: 'HITTITES', buildingStyle: 'TURKS', note: '[加拉太王国首邑、罗马奥古斯都神庙行省首府至拜占庭军区重镇·双层巨石夹砖安卡拉城墙] 罗马加拉太行省首府安基拉（7世纪赫拉克勒斯与米海尔三世嵌古大理石筑双层高耸内城外城石墙），罗马盛期及16世纪安哥拉山羊毛贸易期城居约2–3万（Faroqhi考证），>1万定小城。' },
    { id: 'city_buersa', name: '布尔萨', factionId: 'osman', lat: 40.18, lng: 29.06, type: 'medium_city', troops: 10000, region: 'OTTOMAN', buildingStyle: 'TURKS', note: '[14至15世纪奥斯曼第一帝国都城·石砖内堡与丝绸商坊] 巴耶济德一世至穆拉德二世及16世纪丝绸贸易盛期，布尔萨城关人口1450年约13万（Barkan奥斯曼税册考算及Chandler 1450年表13万），>10万定中城。' },
    { id: 'city_yashucheng', name: '亚述城', factionId: 'yashu', lat: 35.46, lng: 43.26, type: 'small_city', troops: 10000, region: 'ASSYRIAN', buildingStyle: 'ORIE' , note: '[前19至前9世纪古亚述与中亚述帝国首都亚述城·底格里斯河崖双道石灰岩基烧砖泥砖高墙] 亚述民族发祥圣都与历代王陵所在（Qal\'at Sherqat），德国Andrae发掘确证内外两道石基厚墙与玄武岩门阙，中亚述至新亚述前期城居峰值约3–4万（Modelski前1200年表3–4万），>1万定小城。' },

    { id: 'city_nisa', name: '尼萨', factionId: 'ansxi', lat: 37.9, lng: 58.2, type: 'small_city', troops: 10000, region: 'CENTRAL_ASIA', buildingStyle: 'SASANIAN', note: '[前3至前1世纪安息（帕提亚）帝国初都米特拉达梯克特·新尼萨城市城垣与旧尼萨王城] 阿尔沙克一世与米特拉达梯一世营建之安息首任王都（UNESCO遗产），由旧尼萨皇家宗庙堡与新尼萨18公顷高墙贵族市民城及关厢组成（伊西多尔《帕提亚驿程志》），盛期城居约1–2万，定小城。' },
    { id: 'city_peitra', name: '佩特拉', factionId: 'nabatai', lat: 30.3, lng: 35.4, type: 'small_city', troops: 10000, region: 'NABATAEANS', buildingStyle: 'ORIE', note: '[前1世纪至公元2世纪纳巴泰王国都城与罗马阿拉伯省首府·红砂岩峡谷切石防墙与岩凿都会] 垄断乳香没药商路之纳巴泰王都佩特拉，中心谷地石筑市街、大剧场及南北两道切石城墙，公元1世纪极盛期常住人口约2–3万（斯特拉波XVI.4.21及Joukowsky考古测算），>1万定小城。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 拉合尔＝锡克帝国首都（旁遮普）→ PURU（五河/帝国旁遮普）；原标 INDIA
    { id: 'city_laheer', name: '拉合尔', factionId: 'xike', lat: 31.55, lng: 74.35, type: 'medium_city', troops: 10000, region: 'PURU', buildingStyle: 'PURU', note: '[16至17世纪莫卧儿帝国陪都·烧砖红堡与十二门砖城] 阿克巴、贾汉吉尔与沙贾汗驻跸期（1585–1650年）拉合尔砖城与近郊关厢峰值约25–35万（Chandler 1600–1650年表30–36万，未满40万大城线），>10万定中城。' },
    { id: 'city_deli', name: '德里', factionId: 'deli', lat: 28.61, lng: 77.23, type: 'big_city', troops: 10000, region: 'DELHI', buildingStyle: 'MUGHAL', note: '[17世纪莫卧儿沙贾汗纳巴德期·红砂岩包砖帝都] 沙贾汗迁都至奥朗则布时期（1650–1700年）德里砖石城墙内及贴城坊市城居峰值约40–50万（贝尔尼埃《莫卧儿帝国游记》及Chandler 1650–1700年表50万），≥40万定大城。' },
    { id: 'city_agela', name: '阿格拉', factionId: 'mowoer', lat: 27.18, lng: 78.02, type: 'big_city', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', note: '[16至17世纪莫卧儿帝国·红砂岩包砖都城] 阿克巴至沙贾汗定都时期（1600–1650年）阿格拉堡城与亚穆纳河沿岸连片坊市人口峰值约50–66万（曼里克记述及Chandler 1638年表66万），>50万定大城。' },
        // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 曲女城＝戒日帝国首都（北印）→ MUGHAL（封建戒日军团）；原标 INDIA
        { id: 'city_qunvcheng', name: '曲女城', factionId: 'jieri', lat: 27.05, lng: 79.92, type: 'medium_city', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', note: '[7至9世纪戒日帝国与瞿折罗波罗争霸都城·恒河砖土长垣] 7世纪玄奘《大唐西域记》卷五载曲女城（羯若鞠阇）「长二十余里、广四五里，居人丰乐家室富饶」，至9世纪瞿折罗普拉蒂哈拉王都期城居峰值约15–20万（Chandler公元622–900年表15–20万），>10万定中城。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 瓦拉纳西＝迦尸国都、恒河北印 → MUGHAL；原标 INDIA
    { id: 'city_walanaxi', name: '瓦拉纳西', factionId: 'jiashi_d', lat: 25.32, lng: 83.01, type: 'medium_city', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', note: '[古迦尸都城至莫卧儿17世纪圣城·恒河石阶砖石城区] 莫卧儿时期（1600–1700年）瓦拉纳西（贝拿勒斯）恒河西岸连片砖石城区常住人口约10–15万（塔维尼埃游记及Chandler 1600年表13–15万），>10万定中城。' },
        // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 华氏城＝孔雀王朝都城（摩揭陀/恒河北印）→ MUGHAL（古典孔雀军团）；原标 PURU 是西北印
        { id: 'city_huashicheng', name: '华氏城', factionId: 'kongque', lat: 25.61, lng: 85.13, type: 'medium_city', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', mirror: true, note: '[前4至前3世纪孔雀帝国阿育王都·巨木包砖六十四门重城] 麦伽斯梯尼《印度志》（斯特拉波XV.1.36引）载华氏城长80斯塔迪亚、宽15斯塔迪亚，孔雀帝国盛期城居峰值约25–35万（Chandler前300–前200年表30–35万），<40万而>10万，定中城。' },

        // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 王舍城＝摩揭陀古都（频毗娑罗/阿阇世）→ MUGHAL（古典孔雀军团）；原标 PURU
        { id: 'city_wangshecheng', name: '王舍城', factionId: 'mojietuo', lat: 25.03, lng: 85.42, type: 'small_city', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', note: '[前6至前5世纪摩揭陀王国频毗娑罗与阿阇世王古都·40公里五山独眼式巨石外郭城墙] 佛陀说法重镇与摩揭陀迁华氏城前王都王舍城（玄奘《大唐西域记》曷罗阇姞利墎），现存环五山脊干砌巨石长城与谷内新城垣，前5世纪盛期城居约3–5万（Erdösy 1988），>1万且具巨石墙，定小城。' },
    { id: 'city_gaodacheng', name: '高达城', factionId: 'boluo', lat: 24.88, lng: 88.13, type: 'medium_city', troops: 10000, region: 'BENGALIS', buildingStyle: 'BENGALIS', note: '[波罗帝国至16世纪孟加拉苏丹国都·烧砖高墙高达城] 孟加拉侯赛因·沙希王朝盛期（1500–1575年）高达（Gaur）烧砖内外城垣内人口约10–20万（葡使皮雷斯记述及Chandler 1550–1575年表9–15万），≥10万定中城。' },
    { id: 'city_suomapuli', name: '索玛普利', factionId: 'boluo', lat: 25.031111, lng: 88.976944, type: 'stockade', troops: 10000, region: 'BENGALIS', buildingStyle: 'BENGALIS', note: '[8世纪末波罗帝国达磨波罗王敕建南亚最大佛教大学寺院索玛普利大寺（巴哈尔布尔）·方形烧砖僧房围院（非城市）] UNESCO世界遗产巴哈尔布尔遗址实测为边长274米正方形烧砖寺院围墙（内设177间单人僧房供约600–800名比丘修学，12世纪毁弃），系纯粹单体佛寺而非居民城镇，常住不足2000人，定城寨。' },
    { id: 'city_jidagang', name: '吉大港', factionId: 'gurjara', lat: 22.335, lng: 91.8325, type: 'small_city', isPort: true, troops: 10000, region: 'BENGALIS', buildingStyle: 'BENGALIS', note: '[14至17世纪孟加拉苏丹国、若开与莫卧儿争夺第一海港·卡纳普利河口砖石海防大埠吉大港] 伊本·白图泰与马欢《瀛涯胜览》（榜葛剌国「察地港」）所载入孟加拉门户大港，葡人称「大港」（Porto Grande），16–17世纪港城常住人口达2–4万（Qanungo《吉大港史》），>1万定小城。' },
        { id: 'city_danmoledi', name: '耽摩栗底', factionId: 'shunga', lat: 22.28, lng: 87.92, type: 'small_city', isPort: true, troops: 10000, region: 'BENGALIS', buildingStyle: 'BENGALIS', note: '[孔雀巽伽至5至7世纪笈多时期东印度第一海港耽摩栗底·鲁普纳拉扬河口烧砖港城遗址] 阿育王送菩提树苗出海港、法显《佛国记》住二年写经乘商舶泛海与玄奘《大唐西域记》（城周十余里）所记东印总海口，考古发掘烧砖码头与城垣，盛期城居约2–3万，>1万定小城。' },
    { id: 'city_beileinisi', name: '贝雷尼斯', factionId: 'tuolemi', lat: 23.91, lng: 35.48, type: 'small_city', isPort: true, troops: 10000, region: 'EGYPT', buildingStyle: 'ORIE', note: '[前3世纪托勒密二世建至罗马帝国红海第一天竺商港·珊瑚石砌城区贝雷尼斯] 普林尼《自然史》VI.26与《厄立特里亚海航行记》所载埃及对印香料胡椒贸易总港，美荷Sidebotham考古队发掘珊瑚石街区与码头，1–2世纪盛期港镇约0.8–1.2万且为石构港城，定小城。' },
    { id: 'city_taima', name: '泰马', factionId: 'dedan', lat: 27.6, lng: 38.5, type: 'stockade', troops: 10000, region: 'ORIE_ANTIQUITY', buildingStyle: 'ORIE', note: '[前6世纪新巴比伦末王那波尼德驻跸十年与德丹利哈扬古国绿洲泰马·阿拉伯西北沙漠砂岩泥砖古墙绿洲聚落] 《那波尼德编年史》载前552–前543年巴比伦王那波尼德远驻泰马绿洲十年，虽青铜铁器时代遗有泥砖砂石沙埋矮垣，但伊斯兰至1700年穆卡达西等仅记为汲井枣园沙漠小驿镇（常住数千人<1万），定城寨。' },
        { id: 'city_maidina', name: '麦地那', factionId: 'maidina', lat: 24.5, lng: 39.6, type: 'small_city', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[7世纪先知穆罕默德与四大哈里发伊斯兰首任帝都·974年阿杜德道莱重筑玄武岩砖石环城墙] 伊斯兰政教发祥帝都麦地那（叶斯里卜），正统哈里发时期及中世纪阿拔斯、奥斯曼苏莱曼大帝重筑完整玄武岩石墙，常住市民（不含朝觐客）峰值约2–4万，>1万且具石墙，定小城。' },
        { id: 'city_maijia', name: '麦加', factionId: 'gulaishi', lat: 21.4, lng: 39.8, type: 'small_city', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[7世纪伊斯兰第一圣城至阿拔斯马穆鲁克奥斯曼谢里夫驻都·山谷石构城区麦加] 古莱什商业圣城及历代麦加谢里夫首府，扣除朝觐季数十万流动信众后，中世纪至17世纪山谷连片石屋坊区常住居民约3–5万（Faroqhi《朝觐者与苏丹》），>1万定小城。' },
    { id: 'city_baku', name: '巴库', factionId: 'safawei_d', lat: 40.4, lng: 49.9, type: 'pass', troops: 10000, region: 'WEST_ASIA_CASTLE', buildingStyle: 'SASANIAN', note: '[萨珊阿尔巴尼亚至希尔万海防期·阿普歇伦半岛双层石灰岩海防石堡] 萨珊帝国沿里海防线修筑巴库石堡基垣，后希尔万沙阿增筑双层石灰岩内城海防塔墙控里海西岸航道（巴托尔德《里海沿岸史地研究》），本据点锁定萨珊海防要塞阶段且常住<1万，定险要。' },
    { id: 'city_xiemianjieer', name: '谢缅杰尔', factionId: 'xiemian', lat: 43, lng: 47.4, type: 'stockade', troops: 10000, region: 'KHAZARS', buildingStyle: 'CUMAN', note: '[7至10世纪可萨汗国早期旧都·达吉斯坦里海西岸木柳泥墙园邑] 阿拉伯与可萨战争要地谢缅杰尔，10世纪伊斯塔赫里与伊本·豪卡勒《大地志》明载该城房屋与围篱以木条编织涂泥筑成并多葡萄园，965年毁于罗斯，无石砖墙且人口无确数<1万，定城寨。' },
        { id: 'city_yidier', name: '伊蒂尔', factionId: 'kesa', lat: 46, lng: 48, type: 'small_city', troops: 10000, region: 'KHAZARS', buildingStyle: 'CUMAN', note: '[8至10世纪可萨汗国极盛期首都伊蒂尔·伏尔加三角洲两岸烧砖王宫城垣与多族商都] 马苏第《黄金草原》与伊斯塔赫里《道路与王国志》详载伊蒂尔分西岸可萨汗烧砖宫城（惟大汗准用烧砖筑墙）与东岸三十法区商业大城，965年毁城前常住约3–5万（Dunlop《犹太可萨史》），>1万定小城。' },
    { id: 'city_saerkeer', name: '萨尔克尔', factionId: 'luosi', lat: 47.705, lng: 42.27306, type: 'pass', troops: 10000, region: 'SLAVIC', buildingStyle: 'CUMAN', note: '[9世纪可萨汗国联拜占庭筑塞·顿河左岸烧砖白石渡口要塞] 君士坦丁七世《帝国治理论》第42章详载830年代拜占庭技师佩特罗纳斯助可萨烧红砖夹白灰石筑萨尔克尔（「白堡」）扼顿河渡口，堡址仅2.6公顷、常驻轮戍骑兵300人及附塞千人，纯砖石军事要塞<1万，定险要。' },
    { id: 'city_weishen', name: '维申斯卡亚', factionId: 'gesake', lat: 49.63, lng: 41.74, type: 'stockade', troops: 10000, region: 'RUSSIAN', buildingStyle: 'SLAVIC', note: '[17世纪下半叶顿河上游哥萨克军村维申斯卡亚（首见于1672年俄国档案）·顿河岸木栅教堂哥萨克斯坦尼察村镇] 布拉温起义军与上游顿河哥萨克聚居木屋大村（1708年彼得大帝镇压起义时曾焚掠上游诸木寨），≤1700年全村仅数百户哥萨克木屋无石砖城墙，定城寨。' },
    { id: 'city_salaichuke', name: '萨莱楚克', factionId: 'salai', lat: 47.5, lng: 51.7, type: 'small_city', troops: 10000, region: 'CUMAN', buildingStyle: 'CENTRAL_ASIA', note: '[13至15世纪金帐汗国东道大城与诺盖汗国都城·乌拉尔河渡口烧砖泥砖手工业商都] 1333年伊本·白图泰经萨莱楚克记其浮桥宏阔，哈萨克考古队发掘100余公顷烧砖陶管供水城区与钱币铸造坊，14世纪极盛期城居约1.5–2.5万（Samashev发掘报告），>1万定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「CEAS」只是一级母体、取不到 62 类 → 归 TURKS：曼格什拉克：里海东岸乌古斯—塞尔柱草原，归突厥 TURKS
    { id: 'city_mangshilake', name: '曼格什拉克', factionId: 'seljuq', lat: 44, lng: 52, type: 'stockade', troops: 10000, region: 'STEPPE_FEUDAL', buildingStyle: 'CENTRAL_ASIA', note: '[10至12世纪乌古斯与塞尔柱恰格里贝伊控扼里海东岸曼格什拉克半岛商船锚站（克孜勒卡拉）·荒漠海岸白垩土石商栈] 连接伏尔加河口萨克辛与花剌子模陆路之里海东岸半岛转运站（11世纪穆卡达西与雅库特记其设商栈堡寨），干旱荒漠半岛无淡水大城，常住商兵仅一二千人，定城寨。' },
    { id: 'city_kefu', name: '科孚', factionId: 'kelite', lat: 39.62, lng: 19.92, type: 'small_city', isPort: true, troops: 10000, region: 'ATHENIANS', buildingStyle: 'LATIN', note: '[古典科基拉名邦至1386至1700年威尼斯亚得里亚海门户首府·旧堡新堡与斯皮亚纳达巨石棱堡环墙] 修昔底德笔下海军强邦，威尼斯统治期筑全套圣米凯利式巨石海防棱堡城墙（1537与1716年两挫奥斯曼围攻），16–17世纪城墙内市民达1.5–2万（Miller《拉丁黎凡特》），>1万且具巨石墙，定小城。' },
    { id: 'city_malta', name: '马耳他', factionId: 'maerta_qishi', lat: 35.9, lng: 14.44, type: 'pass', isPort: true, troops: 10000, region: 'LATIN_IMPERIAL', buildingStyle: 'LATIN', note: '[16世纪医院骑士团海防要塞期·大港比尔古与圣埃尔莫巨石棱堡群] 1530年医院骑士团入驻筑圣安杰洛、圣埃尔莫巨石星形海防棱堡扼中地中海咽喉，1565年大团长拉·瓦莱特率军民约9000人死守挫败奥斯曼四万军（巴尔比《马耳他大围攻日记》），要塞岛堡<1万，定险要。' },
    { id: 'city_gebenhagen', name: '哥本哈根', factionId: 'danmai', lat: 55.68, lng: 12.57, type: 'small_city', isPort: true, troops: 10000, region: 'GERMANIC_CASTLE', buildingStyle: 'DANES', note: '[15至17世纪丹麦挪威联合王国首都·砖石星形棱堡环海都城] 1443年定为丹麦王都，克里斯蒂安四世大扩建克里斯蒂安港与砖石棱堡环墙，1658–1659年抗瑞典围城，1700年城居达6.2–6.5万（de Vries 1984 p.269），>1万（未满8万）定小城。' },
    { id: 'city_jelling', name: '耶灵', factionId: 'danmai', lat: 55.756, lng: 9.42, type: 'stockade', troops: 10000, region: 'DANES', buildingStyle: 'DANES', note: '[10世纪丹麦老戈姆王与蓝牙哈拉尔一世王室祖陵圣地耶灵·日德兰双皇家巨土冢、卢恩大石碑与橡木立栅围院] 965年前后蓝牙哈拉尔立耶灵大石碑宣示统一丹麦归信基督，近年丹麦国家博物馆发掘确证外围1.4公里菱形橡木原木立栅围墙（UNESCO遗产），木栅不算墙且王庄常住仅数百人，定城寨。' },
    { id: 'city_hedeby', name: '海瑟比', factionId: 'danmai', lat: 54.487, lng: 9.565, type: 'stockade', isPort: true, troops: 10000, region: 'DANES', buildingStyle: 'DANES', note: '[808至1066年维京时代北欧最大地峡转运商埠海瑟比·施莱湾高10米半圆形夯土覆木栅城垣与木排街巷] 丹麦王戈德弗雷德迁商民所建、连结丹麦长城之24公顷半圆形高土堤木栅商镇（1050年哈拉尔·哈德拉达焚掠、1066年斯拉夫人彻底毁灭废弃），纯土垒木栅无石砖墙且常住峰值约1500–3000人（Hilberg海瑟比考古），定城寨。' },
    { id: 'city_sidedegelmo', name: '斯德哥尔摩', factionId: 'ruidian_si', lat: 59.32, lng: 18.06, type: 'small_city', isPort: true, troops: 10000, region: 'GERMANIC_CASTLE', buildingStyle: 'VIKINGS' , note: '[13世纪建城至17世纪瑞典波罗的海帝国首都·城岛石墙与南北关厢斯德哥尔摩] 古斯塔夫二世与克里斯蒂娜女王时期随瑞典帝国崛起人口激增，1600年约1万、1690–1700年连片主岛及南北马尔姆城区达4.5–5.7万（de Vries 1984 p.269、Lilja考证），>1万定小城。' },
    { id: 'city_madeli', name: '马德里', factionId: 'kasidiliya', lat: 40.41, lng: -3.7, type: 'medium_city', troops: 10000, region: 'CASTILE', buildingStyle: 'SPANISH', note: '[16世纪末至17世纪哈布斯堡西班牙王都·砖石税墙都城] 1561年腓力二世迁都后马德里迅速扩建，1600年约8.5–9.5万、1650年达12.5–13万（Carbajo Isla《马德里人口史》教区受洗账册实算及de Vries 1650年表13万），>10万定中城。' },
    { id: 'city_numantia', name: '努曼提亚', factionId: 'arevaci', lat: 41.81, lng: -2.43, type: 'small_city', troops: 10000, region: 'CASTILE', buildingStyle: 'SPANISH', note: '[前2世纪凯尔特伊比利亚抗罗战争·杜罗河台地巨石厚墙山城邦] 阿雷瓦西人首邑努曼提亚，前134–133年小西庇阿筑九公里围墙困城十五月（阿庇安《伊比利亚战争》76–98），考古发掘确证厚达5米石砌城垣，守兵4000–8000、居民约8000–12000且具石墙，定小城。' },
    { id: 'city_boertu', name: '波尔图', factionId: 'putaoya', lat: 41.15, lng: -8.62, type: 'small_city', isPort: true, troops: 10000, region: 'PORTUGUESE', buildingStyle: 'PORTUGUESE', note: '[12至17世纪葡萄牙第二大城与航海王恩里克舰队出发港·1336至1376年费尔南多花岗岩环城高墙] 杜罗河口海贸重镇波尔图，阿方索四世与费尔南多一世筑完整3公里花岗岩高塔城垣，1600–1700年城居达1.5–2.4万（de Vries 1984 p.278），>1万且具石墙，定小城。' },
    { id: 'city_teluoyi', name: '特洛伊', factionId: 'teluoyi', lat: 39.9575, lng: 26.2389, type: 'stockade', isPort: true, troops: 10000, region: 'WEST_ASIA_ANTIQUITY', buildingStyle: 'GREECE', note: '[青铜晚期特洛伊第六至七层王城（荷马史诗伊利昂）与前4世纪波斯吕底亚辖下小邑·希萨尔勒克山丘切石卫城与木石下城] 施里曼、布莱根与科夫曼（Korfmann）考古实测青铜晚期特洛伊VI/VIIa石砌卫城仅2公顷、连外围挖壕木栅下城共约25–30公顷，人口峰值约5000–8000人<1万（古典时代更萎缩为希罗多德与斯特拉波XIII.1.27所称小村邑），定城寨。' },

    { id: 'city_bashila', name: '巴士拉', factionId: 'womaya', lat: 30.50, lng: 47.78, type: 'medium_city', isPort: true, troops: 10000, region: 'WEST_ASIA', buildingStyle: 'ORIE', note: '[7至9世纪倭马亚阿拔斯初期·泥砖烧砖海贸大军镇城] 636年建营后迅即成城，倭马亚中期至阿拔斯初期巴士拉城垣与运河坊市居民达15–20万（巴拉祖里《诸国征服史》在册军民赡养名额及Chandler 800年表18万），>10万定中城。' },
    { id: 'city_tenochtitlan', name: '特诺奇提特兰', factionId: 'aztec', lat: 19.43, lng: -99.13, type: 'medium_city', troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'AMERICA', note: '[15世纪末至1519年阿兹特克帝国都城·湖心岛石筑堤道王都] 1519年西班牙征服前夕特诺奇提特兰与特拉特洛尔科连片人工岛建成区（约13.5平方公里）人口约20–25万（科尔特斯《书信集》及Calnek／Sanders考古人口学测算），<40万而>10万，定中城。' },
    { id: 'city_cusco', name: '库斯科', factionId: 'inca', lat: -13.52, lng: -71.97, type: 'medium_city', troops: 10000, region: 'ANDE', buildingStyle: 'INCA' , note: '[15世纪末至1532年印加帝国都城·萨克塞瓦曼巨石卫城与连片都邑] 帕查库特克至瓦伊纳卡帕克时期库斯科主城神庙宫区及托科卡奇等十二座贴邻连片居住坊（无外墙按连片建成区计），1534年桑乔·德·拉·奥斯目击记两万户约8–10万口（Bauer 2004《古代库斯科》），≥8万定中城。' },

    { id: 'city_tikal', name: '蒂卡尔', factionId: 'maya', lat: 17.22, lng: -89.62, type: 'small_city', troops: 10000, region: 'MAYANS', buildingStyle: 'MAYANS', note: '[8世纪玛雅古典晚期穆图尔王国极盛都城·大广场石灰岩金字塔宫殿群与中心连片聚落] 玛雅低地霸主蒂卡尔（Yax Mutal），扣除远郊散居农带及土堤外围后，中心16平方公里连片石灰岩居住台院常住人口约1.5–2.5万（Haviland 2003蒂卡尔人口考古测算），>1万定小城。' },
    { id: 'city_palenque', name: '帕伦克', factionId: 'maya', lat: 17.484, lng: -92.046, type: 'stockade', troops: 10000, region: 'MAYANS', buildingStyle: 'MAYANS', note: '[7世纪玛雅古典期巴加尔王国帕卡尔大帝都城拉卡姆哈（帕伦克）·恰帕斯雨林山麓石灰岩宫庙台地无墙王城] 铭文神庙与水道宫殿群所在地，据Barnhart（2001）全城测绘发掘报告，帕伦克无防御城墙、山坡高密度台地建筑约1,480座，折算7–8世纪极盛期常住人口约6000–8000人（不足1万整且9世纪彻底荒废），定城寨。' },
    { id: 'city_tucapel', name: '图卡佩尔', factionId: 'mapuche', lat: -37.7, lng: -73.4, type: 'stockade', troops: 10000, region: 'MAPUCHE', buildingStyle: 'MAPUCHE', note: '[1553年十二月马普切领袖劳塔罗全歼西班牙征服者佩德罗·德·瓦尔迪维亚战场图卡佩尔·阿劳科海岸山脉原木土垒小堡] 瓦尔迪维亚始建三座前线原木泥土小砦之一，旋遭劳塔罗攻毁并诱歼西军全队（比瓦尔《智利编年史》），阿劳科战争中屡建屡焚之百人原木栅砦无居民城，定城寨。' },
    { id: 'city_bacata', name: '巴卡塔', factionId: 'muisca', lat: 4.71, lng: -74.07, type: 'small_city', troops: 10000, region: 'MUISCA', buildingStyle: 'MUISCA', note: '[15世纪末至1538年穆伊斯卡南部西帕最高王都·波哥大高原双重巨木栅宫垣与连片聚落] 穆伊斯卡南盟君主西帕（Zipa）首邑巴卡塔，1538年西班牙征服者克萨达《墓志纪略》记其木构大宫与平原中心连片屋舍上万座，折算中心建成区常住约2–3万（Broadbent考证），>1万定小城。' },
    { id: 'city_guanabara', name: '瓜纳巴拉', factionId: 'tupi', lat: -22.9, lng: -43.2, type: 'stockade', isPort: true, troops: 10000, region: 'TUPI', buildingStyle: 'TUPI', note: '[1555至1567年法属南极法兰西殖民岛寨与塔莫约图皮盟军决战地瓜纳巴拉湾（初创期里约热内卢）·海湾木石炮台与丘顶小镇] 1565–1567年葡军梅姆·德·萨联合图皮酋长阿拉里博亚驱逐法军迁镇卡斯特罗山，≤1700年黄金出口兴起前里约无环城陆墙且常住白人市民与印非人口仅约5000–8000人<1万（Boxer《巴西黄金时代》），定城寨。' },
    { id: 'city_onondaga', name: '奥农多加', factionId: 'yiluokui', lat: 43.05, lng: -76.15, type: 'stockade', troops: 10000, region: 'IROQUOIS', buildingStyle: 'AMERICA', note: '[15至17世纪北美五大湖易洛魁五族联盟中央火塘大议事村奥农多加·三排圆木立栅围绕榆树皮长屋大寨] 海华沙与和平缔造者创立易洛魁联盟盟会中心，1650年代法国《耶稣会士关系书》与1677年格林哈尔希实测记奥农多加主寨有约140座长屋、常住人口约2000–3000人且每隔十余年迁址重建木栅，定城寨。；城堡外观用 VIKI_CASTLE_AGE3（诺斯长屋环形要塞）代理长屋+木栅，不再用 MESO 金字塔' },
    { id: 'city_chanchan', name: '昌昌', factionId: 'qimu', lat: -8.11, lng: -79.07, type: 'small_city', troops: 10000, region: 'CHIMU', buildingStyle: 'INCA', note: '[13至15世纪中叶秘鲁北海岸奇穆帝国首都·十座高9米巨型生土宫城（Ciudadelas）与工匠坊区] 前哥伦布美洲最大生土泥砖城市昌昌（UNESCO遗产，核心建成区6平方公里），1470年印加征服前城内十座高墙宫院及周围2.6万工匠常住人口达3–5万（Moseley & Mackey考古测算），>1万定小城。；🔴 [2026-11-11 补标] 【建筑风格代理】奇穆王国土坯城，67键无奇穆，取最近INCA' },
    { id: 'city_tzintzuntzan', name: '钦聪灿', factionId: 'talasike', lat: 19.63, lng: -101.58, type: 'small_city', troops: 10000, region: 'TARASCAN', buildingStyle: 'AMERICA', note: '[15世纪至1522年西墨西哥塔拉斯科（普雷佩查）帝国首都·帕茨夸罗湖石筑五圆台与连片王都] 唯一屡挫阿兹特克入侵之强国塔拉斯科王都钦聪灿，美国考古学家Pollard（1993）实测王都6.7平方公里石基阶地连片建成区，1520年前夕常住城居达2.5–3.5万，>1万定小城。；🔴 [2026-11-11 补标] 【建筑风格代理】塔拉斯坎圆形阶梯金字塔Yacata，67键无塔拉斯坎，取最近AMERICA' },
    // 🔴 [2026-10-18 主人令] 新阿姆斯特丹按建城者（荷兰西印度公司）定 SAXONS（低地日耳曼/北海砖木要塞）；旧注释「归 BRITONS」作废。
    { id: 'city_newamsterdam', name: '新阿姆斯特丹', factionId: 'nidelan', lat: 40.71, lng: -74.01, type: 'stockade', isPort: true, troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'GERMANIC', note: '[1626至1664年荷属新尼德兰首府新阿姆斯特丹（1664年后英属早期纽约）·曼哈顿南端阿姆斯特丹小堡与华尔街木栅镇] 1653年总督斯泰弗森特筑横跨半岛之华尔街原木立栅防英人，据1664年降英时1500人及1698年英属纽约官方人口普查全城实数仅4,937人（≤1700年远不满1万且市镇无环城石墙），定城寨。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「WEST」推出的二级与史实不符 → 归 FRANKS：魁北克：法兰西殖民地（新法兰西）
    { id: 'city_quebec', name: '魁北克', factionId: 'gaolu', lat: 46.81, lng: -71.21, type: 'stockade', troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'FRANKS', note: '[1608至1700年尚普兰所建法属新法兰西首府魁北克·圣劳伦斯河钻石岬圣路易木石堡与1690年急筑木土防线] 1608年尚普兰建木构居住站、1690年总督弗龙特纳克凭木栅土垒石台击退英军菲普斯舰队，据新法兰西1698年官方逐户人口普查魁北克全城实居仅1,988人（石砌环城大墙亦在1745年后方成），<1万定城寨。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 SPANISH：阿卡普尔科：西班牙殖民地（马尼拉大帆船港）
    { id: 'city_acapulco', name: '阿卡普尔科', factionId: 'xibanya', lat: 16.85, lng: -99.92, type: 'stockade', isPort: true, troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'SPANISH', note: '[1565至1700年马尼拉大帆船美洲唯一法定终点港阿卡普尔科·海湾五角圣迭戈石堡与无墙棕榈木泥屋港镇] 虽1617年于港湾小山建圣迭戈五角石堡护锚地，但炎热瘴疠使平时市镇仅住黑人混血码头工与兵役约2000–3000人且镇无城墙（仅每年冬船到商展一月骤聚客商，意大利旅行家卡雷里1697年亲历实记），定城寨。' },
    { id: 'city_teyuna', name: '特尤纳', factionId: 'tailuona', lat: 11.04, lng: -73.93, type: 'stockade', troops: 10000, region: 'TAIRONA', buildingStyle: 'MUISCA', note: '[12至16世纪哥伦比亚圣玛尔塔雪山泰罗纳文明山地中心特尤纳（失落之城Buritaca-200）·169级干石护坡圆台木茅屋山聚] 海拔1200米热带云雾林山脊筑169座干石挡土圆台基承托木骨茅顶圆屋（无防御外城墙，1600年前后弃置），哥伦比亚人类学研究所Giraldo（2010）测算常住人口约2000–4000人<1万，定城寨。；🔴 [2026-11-11 按史改] 据点文化 INCA→MUISCA（代理）：泰罗纳山城，与穆伊斯卡同属奇布查语系、同金铜祭祀信仰，从未属印加' },
    // 🔴 [2026-10-18 按史] 圣胡利安港历史上从未建过欧洲永久石造城郭/要塞，仅麦哲伦等临时泥木锚地；真实长期实体建筑为特维尔切木骨皮蒙营帐，故取南安第斯 MAPUCHE（无 TEHUELCHE 分支）。
    { id: 'city_sanjulian', name: '圣胡利安港', factionId: 'teweierqie', lat: -49.31, lng: -67.72, type: 'stockade', isPort: true, troops: 10000, region: 'TEHUELCHE', buildingStyle: 'MAPUCHE', note: '[1520年麦哲伦环球舰队越冬平叛与1578年德雷克停泊之巴塔哥尼亚圣胡利安湾·特维尔切游猎民兽皮帐营锚地] 皮加费塔《麦哲伦首次环球航行记》详载在此越冬五个月首遇高大特维尔切（巴塔哥尼）游猎小群，≤1700年无常设欧洲城镇，仅土著流动猎营数百人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】巴塔哥尼亚特维尔切营地，取最近MAPUCHE' },
    // ── [2026-08-26] 葡萄牙「大西洋西南大迂回—南美沿岸南下」航线据点 ──
    //  1501 韦斯普奇船队：里斯本 → 佛得角 → 借东北信风横渡 → 圣罗克角 → 沿岸南下
    //  → 1502-01-01 发现瓜纳巴拉湾（误认作河，命名 Rio de Janeiro）。
    //  1565-67 葡军自圣维森特北上逐走法国「南极法兰西」，正式建里约城。
    { id: 'city_ribeira', name: '里贝拉', factionId: 'putaoya', lat: 14.92, lng: -23.60, type: 'small_city', isPort: true, troops: 10000, region: 'PORTUGUESE', buildingStyle: 'PORTUGUESE', note: '[15至17世纪葡属佛得角首府与跨大西洋奴隶航线中枢·圣菲利佩皇家石堡与石砌海防墙旧城] 1462年建热带首座欧洲城市里贝拉格兰德（UNESCO遗产旧城），1585年德雷克袭掠后腓力二世敕筑山顶圣菲利佩巨石棱堡及海岸石砌防墙连防体系，城居约3000–5000人<1万具石砌城防，定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 PORTUGUESE：萨尔瓦多（巴西巴伊亚）：葡萄牙殖民地
    { id: 'city_salvador', name: '萨尔瓦多', factionId: 'putaoya', lat: -12.97, lng: -38.51, type: 'small_city', isPort: true, troops: 10000, region: 'TUPI', buildingStyle: 'PORTUGUESE', note: '[1549至1700年葡属巴西总督区首都圣萨尔瓦多·全圣湾上下城石砖棱堡环城防线] 1549年托梅·德·索萨建都并筑城墙，1624–1625年西葡联军收复荷占萨尔瓦多后增筑完整石砖棱堡，1700年常住人口达2–2.5万（Schwartz《巴西糖业种植园与城市》），>1万定小城。' },
    // 🔴 [2026-10-18 按史] 圣维森特 1532 年葡萄牙首座永久拓殖城镇：石木防御要塞屋、总督府、小教堂、葡式石砌磨坊 → PORTUGUESE；不因驻将本地而降为 TUPI。
    { id: 'city_saovicente', name: '圣维森特', factionId: 'putaoya', lat: -23.96, lng: -46.39, type: 'stockade', isPort: true, troops: 10000, region: 'TUPI', buildingStyle: 'PORTUGUESE', note: '[1532年马丁·阿方索·德·索萨所建葡萄牙美洲第一座永久自治市镇圣维森特·大西洋海岛泥木糖坊小镇] 巴西殖民母镇及1565年反攻里约基地，后深水航道淤塞商贸转入邻港桑托斯与高原圣保罗，≤1700年全镇常住仅约1500–2500人且无石砌环城墙，定城寨。' },
    // ── [2026-08-26] 跨大西洋航线据点：让美洲接入旧大陆，并给特诺奇提特兰补出海口 ──
    //  依据：西班牙「珍宝船队」(Flota de Indias) 与葡萄牙大西洋航线的历史必经节点。
    //  去程借东北信风走加那利，东返借西风带走亚速尔 —— 两条不同航线，各设一个中继。
    // 🔴 [2026-10-18 按史] 韦拉克鲁斯真实建成的实体是西班牙圣胡安德乌卢阿珊瑚石星形棱堡、防御石墙与西属美洲殖民巴洛克建筑群 → SPANISH；不因驻将奇科马卡特为托托纳克人而降为 AMERICA。
    { id: 'city_veracruz', name: '韦拉克鲁斯', factionId: 'xibanya', lat: 19.19, lng: -96.14, type: 'stockade', isPort: true, troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'SPANISH', note: '[1519年科尔特斯登陆建镇至17世纪新西班牙大西洋银船门户韦拉克鲁斯·圣胡安德乌卢阿礁岛石堡与对岸木板无墙港镇] 虽离岸珊瑚礁筑乌卢阿海堡，但陆岸韦拉克鲁斯市镇全为木板房且无环城石墙（故1683年海盗洛伦西略率千人自陆侧一夜洗劫全镇，城墙迟至18世纪方筑），黄热病肆虐使平时常住仅约5000–6000人<1万，定城寨。' },
    // 🔴 [2026-10-18 按史] 哈瓦那真实建成的实体是莫罗城堡、皇家军队城堡、拉卡瓦尼亚堡与西班牙殖民街区，西欧文艺复兴转古典主义砖石海防要塞城 → SPANISH；不因驻将哈土依为泰诺人而降为 AMERICA。
    // 🔴 [2026-10-20 主人令「武将文化一定要符合建筑风格，不然套的军团都是错的」] 古巴东部泰诺人村落「亚拉」：给泰诺反抗领袖哈土依一个建筑风格对口（TUPI 热带美洲原住民茅草村落）的据点
    { id: 'city_yala', name: '亚拉', factionId: 'taino_d', lat: 20.35, lng: -76.85, type: 'stockade', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'TUPI', note: '[1511至1512年古巴东部泰诺人酋长哈土依率众抗击西班牙征服者贝拉斯克斯据点亚拉·棕榈圆屋（Bohío）原住民林寨] 拉斯·卡萨斯《西印度毁灭述略》动情记述哈土依自海地渡海聚古巴泰诺部民于亚拉河林莽抗西就义，新石器木竹村社无城墙且常住仅千余人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】古巴泰诺人木屋村寨，67键无泰诺，取最近TUPI' },
    { id: 'city_havana', name: '哈瓦那', factionId: 'xibanya', lat: 23.13, lng: -82.38, type: 'small_city', isPort: true, troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'SPANISH', note: '[16至17世纪西属古巴首府与珍宝船队总集结港·莫罗石堡与1674年珊瑚石灰岩环城墙] 西印度护航大帆船总母港哈瓦那，除海口莫罗、蓬塔双石堡外1674年起修筑完整厚重珊瑚石环城陆墙，1690–1700年城内常住人口达1.2–1.5万（Fuente《16至17世纪哈瓦那港城考》），>1万定小城。' },
    { id: 'city_telde', name: '特尔德', factionId: 'guanche', lat: 28.00, lng: -15.42, type: 'stockade', isPort: true, troops: 10000, region: 'AFRICA_CASTLE', buildingStyle: 'BERBER', note: '[14至15世纪西班牙征服前大加那利岛柏柏尔裔关切人两大土王首邑特尔德·火山凝灰岩千洞聚落与干石圆屋] 1483年卡斯蒂利亚征服前关切王本特胡伊等治下特尔德（四门山与塔拉百洞聚落，《加那利征服纪事》），无城墙且征服后16–17世纪蔗糖小镇常住仅约2000–3000人<1万，定城寨。' },
    { id: 'city_angra', name: '安格拉', factionId: 'putaoya', lat: 38.66, lng: -27.22, type: 'stockade', isPort: true, troops: 10000, region: 'PORTUGUESE', buildingStyle: 'PORTUGUESE', note: '[15至17世纪葡属亚速尔群岛首府与东印度大帆船返航补给港安格拉·巴西山圣若昂石堡与无陆墙海湾市镇] 1581年萨尔加湾牛群冲阵破西军、1591年后西军在港侧巴西山半岛修圣若昂石堡，但安格拉市镇陆侧敞开无环城墙，≤1700年常住人口约5000–7000人<1万，定城寨。' },
    { id: 'city_lima', name: '利马', factionId: 'xibanya', lat: -12.05, lng: -77.04, type: 'small_city', isPort: true, troops: 10000, region: 'INCA', buildingStyle: 'SPANISH', note: '[1535至1700年西属秘鲁总督区首都「诸王之城」·1684至1687年11公里三十四棱堡泥砖石基环城墙] 皮萨罗所建南美西属最高政治银贸首都利马，17世纪接连人口普查实载1614年25,454人、1700年墙内常住达3.7万（Cook《秘鲁殖民人口史》1700年实查册37,234人），>1万定小城。' },
    { id: 'city_timbuktu', name: '廷巴克图', factionId: 'manding', lat: 16.77, lng: -3.01, type: 'small_city', troops: 10000, region: 'AFRICA', buildingStyle: 'AFRICA', note: '[15至16世纪马里与桑海阿斯基亚王朝黄金学术之都·泥砖清真寺学府与高密度商队城区] 桑科雷经学院与跨撒哈拉金盐贸易总都会廷巴克图，1591年摩洛哥火枪军入侵前夕据《苏丹史》（Tarikh al-Fattash）户数记录折算城居峰值达5–7万（Hunwick 1999考证，<8万），定小城。' },

    { id: 'city_aksum', name: '阿克苏姆', factionId: 'ethiopia', lat: 14.13, lng: 38.72, type: 'small_city', troops: 10000, region: 'AFRICA_ANTIQUITY', buildingStyle: 'ETHIOPIANS' , note: '[3至6世纪东非阿克苏姆帝国极盛王都·巨石方尖碑群与石砌多层王宫城区] 摩尼列为世界四大帝国之一、埃扎纳王与卡莱布王东征也门之都阿克苏姆，核心石构宫邸与工商业建成区逾100公顷，4–6世纪城居峰值约2–3万（Munro-Hay 1991《阿克苏姆考》），>1万定小城。' },

    { id: 'city_malacca', name: '马六甲', factionId: 'malacca', lat: 2.19, lng: 102.25, type: 'medium_city', isPort: true, troops: 10000, region: 'MALAY', buildingStyle: 'MALAY', note: '[15世纪末至1511年满剌加苏丹国·木石王城与跨河连片港市] 1511年葡军攻占前夕马六甲河两岸连片港市常住人口约8–10万（托梅·皮雷斯《东方志》、阿尔布克尔克《纪事》及Chandler 1500年表8万、Reid 1993估8–10万），踩8万容差线，定中城。' },
        { id: 'city_xibo', name: '希波', factionId: 'luoma_diguo', lat: 36.90, lng: 7.76, type: 'small_city', isPort: true, troops: 10000, region: 'BERBER', buildingStyle: 'ROMA', note: '[罗马阿非利加行省重埠与5世纪初圣奥古斯丁主教驻城·巨石海港城墙希波（安纳巴）] 努米底亚王室旧邑及罗马富庶谷物出口港希波，430–431年凭坚固罗马切石环城墙抗汪达尔王盖萨里克十四个月围攻（波西迪乌斯《奥古斯丁传》28），帝国晚期城居约2–3万且具罗马石墙，定小城。' },
    { id: 'city_sanfoqi', name: '巨港', factionId: 'sanfoqi', lat: -2.99, lng: 104.75, type: 'small_city', isPort: true, troops: 10000, region: 'SRIVIJAYA', buildingStyle: 'MALAY', note: '[7至11世纪室利佛逝（三佛齐）海洋帝国都城巨港·穆西河口砖构佛塔与连片水上浮筏商都] 义净《大唐西域求法高僧传》居此译经记僧逾千人、赵汝适《诸蕃志》记「居民散处城外水上连筏为屋」控马六甲与巽他海峡，按无墙连片聚落口径盛期常住约2–3万（Manguin巨港考古），>1万定小城。' },
    { id: 'city_kalasan', name: '卡拉桑', factionId: 'medang', lat: -7.756, lng: 110.445, type: 'stockade', troops: 10000, region: 'JAVANESE', buildingStyle: 'MALAY', note: '[公元778年爪哇马打蓝夏连特拉王朝帕南卡兰王敕建度母佛寺卡拉桑·普兰巴南平原安山岩佛殿僧院聚落] 古爪哇梵文《卡拉桑碑铭》（778年）明载王室划拨卡拉萨村赋税兴建度母神庙与僧舍，系纯宗教神庙村落而非城市城郭，常住僧侣村农不足3000人，定城寨。' },
    { id: 'city_deernate', name: '德尔纳特', factionId: 'ternate', lat: 0.7852, lng: 127.3832, type: 'small_city', isPort: true, troops: 10000, region: 'SEASIA_IMPERIAL', buildingStyle: 'MALAY', note: '[16世纪末特尔纳特苏丹国巴布拉苏丹霸权期·珊瑚火山石王城（Gamalama）与葡荷石棱堡] 世界丁香原产母岛与东印尼海上霸主都城德尔纳特，巴布拉苏丹1575年夺取葡建圣若昂石堡、1607年荷建奥兰治巨石堡，16–17世纪环堡连片港镇常住约1–1.5万（Andaya《摩鹿加世界》），定小城。' },
    { id: 'city_huoluo', name: '霍洛', factionId: 'sulu', lat: 6.0531, lng: 121.0008, type: 'stockade', isPort: true, troops: 10000, region: 'MALAY', buildingStyle: 'MALAY', note: '[15至17世纪苏禄苏丹国都霍洛·海湾高脚木屋与圆木栅王寨] 永乐十五年苏禄三王来朝（《明史·苏禄传》），16–17世纪西军屡征苏禄史料明载霍洛为木构水屋与圆木防栅（Kota木寨，无石砖城垣），本镇常住仅数千人未满1万，定城寨。' },
    // 🔴 [2026-11-02 主人令「添加三个（海上丝绸之路与郑和下西洋枢纽港）」]
    { id: 'city_yaqi', name: '亚齐', factionId: 'yaqi', lat: 5.55, lng: 95.32, type: 'small_city', isPort: true, troops: 10000, region: 'MALAY', buildingStyle: 'MALAY', note: '[17世纪前半亚齐苏丹国伊斯坎达尔·穆达极盛期·石木王宫与连片港都] 马六甲海峡北口霸主亚齐都城库塔拉贾，1607–1636年全盛期连片港区与坊巷常住人口达4–6万（法国航海家博利厄1621年目击记述及Reid 1993考算），>1万定小城。' },
    { id: 'city_manila', name: '马尼拉', factionId: 'maynila', lat: 14.5904, lng: 120.9804, type: 'small_city', isPort: true, troops: 10000, region: 'SEASIA_IMPERIAL', buildingStyle: 'MALAY', note: '[1571至1700年西属菲律宾都督府首府·王城（Intramuros）巨石棱堡城墙与华人八连关厢] 达斯马里尼亚斯总督筑完整火山凝灰岩巨石王城环墙，合紧贴城墙外之华人涧内（Parian，常住华商工匠逾两万）与岷伦洛关厢，17世纪前半叶城关实居达4–5万（Reed《殖民马尼拉》），>1万定小城。' },
    { id: 'city_patan', name: '帕坦', factionId: 'gurjara', lat: 23.84, lng: 72.12, type: 'medium_city', troops: 10000, region: 'GURJARAS', buildingStyle: 'GURJARAS', note: '[11至13世纪索兰基（遮娄其）古吉拉特王都·石砖城垣阿纳希拉瓦拉] 索兰基王朝都城阿纳希拉帕塔卡（帕坦）1100–1250年石砖城垣内人口峰值约10万（海马赞德拉文献及Chandler 1100–1200年表10万），≥10万定中城。' },
    { id: 'city_suomunate', name: '索姆纳特', factionId: 'suomunate', lat: 20.8878, lng: 70.4014, type: 'stockade', isPort: true, troops: 10000, region: 'INDIA_CASTLE', buildingStyle: 'GURJARAS', note: '[1026年伽色尼马哈茂德远征洗劫与12世纪索兰基库马拉帕拉王重建之印度教圣庙索姆纳特·海滨神庙石垣朝圣小港镇] 十二光辉林伽之首湿婆大庙所在地帕布哈斯帕坦，伊本·阿西尔《全史》记神庙卫垣而非巨型市民都城，中世纪屡经苏丹国拆毁，平时常住祭司渔商约4000–7000人<1万，定城寨。' },
    { id: 'city_surat', name: '苏拉特', factionId: 'mowoer', lat: 21.1702, lng: 72.8311, type: 'medium_city', isPort: true, region: 'INDIA_CASTLE', buildingStyle: 'GURJARAS', troops: 10000, startYear: 1615, note: '[17世纪莫卧儿西岸第一大港·烧砖石砌双道城墙商都] 奥朗则布筑砖石内外墙时期（1660–1700年）苏拉特港城常住人口达15–20万（欧亚商船日志及Chandler 1700年表20万、Gokhale《苏拉特与十七世纪》），>10万定中城。' },
    { id: 'city_madras', name: '马德拉斯', factionId: 'yinggelan', lat: 13.0827, lng: 80.2707, type: 'small_city', isPort: true, region: 'INDIA_CASTLE', buildingStyle: 'INDIA', troops: 10000, startYear: 1639, note: '[17世纪下半叶英属东印度公司东岸总部·圣乔治砖石堡城与黑城连片港区] 1639年建圣乔治堡后印欧商工云集，1670–1700年白城与毗连黑城砖墙坊市常住人口达4–6万（Love《旧马德拉斯遗录》及Fryer 1673年纪行），>1万定小城。' },
    { id: 'city_mumbai', name: '孟买', factionId: 'yinggelan', lat: 18.9388, lng: 72.8354, type: 'small_city', isPort: true, region: 'INDIA_CASTLE', buildingStyle: 'INDIA', troops: 10000, startYear: 1668, note: '[17世纪末英属东印度公司西岸总部·孟买石堡与岛港建成区] 1668年英东印度公司接管后昂吉尔总督修筑石堡炮台、招徕古吉拉特织工，1675–1690年代岛城常住人口增至1.5–3万（大卫《孟买早期史》及1698年瘴疫前商馆报告），>1万定小城。' },
    { id: 'city_kolkata', name: '加尔各答', factionId: 'yinggelan', lat: 22.5726, lng: 88.3639, type: 'small_city', region: 'BENGALIS', buildingStyle: 'BENGALIS', troops: 10000, startYear: 1690, note: '[1690至1700年英属孟加拉总部初创期·旧威廉砖石堡与三镇连片商埠] 1690年查诺克建商站、1698年购苏塔努蒂、戈宾德布尔、卡利卡塔三镇筑旧威廉砖堡，1700–1701年连片商埠常住人口达1–1.2万（Hamilton《新东印度纪》及Nair考算），刚逾1万定小城。' },
    { id: 'city_guoa', name: '果阿', factionId: 'putaoya', lat: 15.5023, lng: 73.9117, type: 'medium_city', isPort: true, troops: 10000, region: 'INDIA', buildingStyle: 'PORTUGUESE', note: '[16世纪末至17世纪初葡属东方首府黄金果阿·红土巨石城垣] 1580–1620年「东方罗马」果阿旧城红土石外墙与近关教区常住人口峰值约8–10万（林斯霍滕《东印度水路志》及Pearson／Subrahmanyam据教会户籍折算约8–10万；Chandler 1600年表7.5–10万），≥8万定中城。' },
    { id: 'city_guli', name: '古里', factionId: 'zhamolin', lat: 11.25, lng: 75.78, type: 'medium_city', isPort: true, troops: 10000, region: 'INDIA', buildingStyle: 'INDIA', note: '[15世纪萨穆里王朝香料大港古里·红土石木宫垣连片港市] 郑和七下西洋与1498年达·伽马登陆时卡利卡特（古里）连片海岸商埠常住人口约8–10万（马欢《瀛涯胜览》、瓦尔泰马游记及Chandler 1500年表8–9万），≥8万容差线，定中城。' },
    { id: 'city_cochin', name: '柯枝', factionId: 'zhamolin', lat: 9.9700, lng: 76.2400, type: 'small_city', isPort: true, region: 'INDIA', buildingStyle: 'INDIA', troops: 10000, note: '[15至17世纪柯枝王国与葡荷首府·圣十字石砖棱堡环城港市] 郑和立碑之柯枝国，1503年葡筑首堡并发展为石砖环墙之圣十字城与邻接马坦切里商区，16–17世纪初城居约2–3万（博卡罗1635《要塞图志》及Malekandathil考算），>1万定小城。' },
    { id: 'city_quilon', name: '小葛兰', factionId: 'zhamolin', lat: 8.8800, lng: 76.6000, type: 'small_city', isPort: true, region: 'INDIA', buildingStyle: 'INDIA', troops: 10000, note: '[宋元海外名港至16世纪维纳德王国·红土石港城奎隆（小葛兰）] 周去非《岭外代答》与马可·波罗所载故临大港，伊本·白图泰称其为马拉巴尔最美商城之一，鼎盛期港城常住人口约1.5–2.5万，>1万定小城。' },
    { id: 'city_tanjiawuer', name: '坦贾武尔', factionId: 'zhuluo', lat: 10.79, lng: 79.14, type: 'medium_city', troops: 10000, region: 'INDIA', buildingStyle: 'INDIA', note: '[10至12世纪朱罗帝国极盛王都·花岗岩巨石双城垣] 拉贾拉贾一世与拉金德拉一世时期（1000–1150年）坦贾武尔王城及外郭神庙坊市峰值约15–20万（大庙铭文供养职役记录及Chandler 1050年表20万），>10万定中城。' },
    { id: 'city_madula', name: '马杜赖', factionId: 'pandiya', lat: 9.93, lng: 78.12, type: 'medium_city', troops: 10000, region: 'INDIA', buildingStyle: 'INDIA', note: '[潘地亚古都至17世纪马杜赖纳亚克期·花岗岩重垣庙城] 潘地亚盛期及17世纪蒂鲁马拉·纳亚克扩建时期，马杜赖双层石墙内人口峰值约8–10万（耶稣会《马杜赖布道年报》及Chandler表7–9万），≥8万容差线，定中城。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 阿努拉德普勒＝斯里兰卡僧伽罗圣都（无专属 66 文化，取最近南印建筑圈）→ INDIA；原标 PURU
    { id: 'city_anulade', name: '阿努拉德', factionId: 'sengjialuo', lat: 8.3533, lng: 80.3956, type: 'medium_city', troops: 10000, region: 'INDIA', buildingStyle: 'INDIA', note: '[前1至公元4世纪僧伽罗圣都·砖石内城与寺院连片城区] 杜图伽摩尼光复后至公元1–4世纪阿努拉德普勒砖石王城及三大寺连片城区峰值约10–13万（《大史》Mahavamsa及Chandler／Bairoch公元100年表13万），>10万定中城。' },
    { id: 'city_jiale', name: '加勒', factionId: 'sengjialuo', lat: 6.05, lng: 80.21, type: 'small_city', isPort: true, troops: 10000, region: 'INDIA', buildingStyle: 'INDIA', note: '[15至17世纪科提王国主港与葡荷石城期·花岗岩珊瑚石环海棱堡城] 郑和立《布施锡兰山佛寺三语碑》之别罗里（加勒），1588年葡筑石墙、1663年荷扩建36公顷花岗岩珊瑚石环城墙（UNESCO遗产），城居约0.8–1.5万且具完整石墙，定小城。' },
    // 🔴 [2026-11-02 主人令「请添加这三个据点，然后把昇龙，阿瑜陀耶，麦加的港口属性取消，删除海路」]
    { id: 'city_yuntun', name: '云屯', factionId: 'dayue', lat: 20.86, lng: 106.68, type: 'small_city', isPort: true, troops: 10000, region: 'VIETNAMESE', buildingStyle: 'VIETNAMESE', note: '[12至15世纪大越李陈二朝唯一法定海贸港·云屯海岛石岸连片商庄] 1149年李英宗设云屯庄为唯一外贸海港，1288年陈庆余于此截歼元军张文虎粮船（《大越史记全书》），陈朝盛期本港及连片商庄常住商民水手逾1–1.5万，定小城。' },
    { id: 'city_tunwuli', name: '吞武里', factionId: 'siam', lat: 13.68, lng: 100.53, type: 'small_city', isPort: true, troops: 10000, region: 'SEAS', buildingStyle: 'KHMER', note: '[16至17世纪阿瑜陀耶王朝湄南河口重镇·砖石星形棱堡海关港城] 阿瑜陀耶海防门户吞武里（曼谷），1680年代那莱王聘法工程师德·拉马尔筑东西两岸砖石星形棱堡、1688年围城战所在地，≤1700年港镇常住人口约1.5–2.5万，定小城。' },
    { id: 'city_jida', name: '吉达', factionId: 'maidina', lat: 21.49, lng: 39.19, type: 'small_city', isPort: true, troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[7世纪设港至16世纪马穆鲁克奥斯曼海防期·珊瑚石砖环城墙朝觐主港] 646年哈里发奥斯曼定为麦加外港，1517年马穆鲁克将领侯赛因·库尔迪筑六门珊瑚石砖环城墙击退葡国苏亚雷斯舰队（伊本·伊亚斯《埃及编年史》），常住约1–1.5万且具石墙，定小城。' },
    // ── [2026-08-28] 奇观周边补据点（19座，对应原野外奇观）──
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「SEAS」推出的二级与史实不符 → 归 KHMER：万象：澜沧（寮）王国都城，同圈
    { id: 'city_wanxiang', name: '万象', factionId: 'lancang', lat: 17.976, lng: 102.636, type: 'small_city', troops: 10000, region: 'HUAXIA_IMPERIAL', buildingStyle: 'KHMER', note: '[1560至1700年澜沧王国迁都盛期与苏里亚旺萨黄金时代·湄公河畔烧砖内外两道高墙万象] 1560年塞塔提腊王自琅勃拉邦迁都万象并筑塔銮与厚重红砖环城墙，1641–1642年荷兰使臣范·乌斯托夫与耶稣会士莱里亚亲访记述都城殷盛，17世纪城居约2–3万，>1万且具砖墙，定小城。' },
    { id: 'city_mailuoe', name: '麦罗埃', factionId: 'kushi', lat: 16.938, lng: 33.750, type: 'small_city', troops: 10000, region: 'KUSH', buildingStyle: 'ETHIOPIANS', note: '[前6世纪至公元4世纪库施王国后期铁器时代王都·切石砂岩太阳王城垣与炼铁城区麦罗埃] 自纳帕塔南迁后努比亚库施王国九百年首都（UNESCO遗产），中心石砌皇家城（Royal City）围墙内宫庙与东侧大型炼铁手工业连片城区，盛期城居约2–3万（Shinnie & Török库施考古），>1万定小城。；【建筑风格代理】麦罗埃属努比亚/库施，66 文化无库施分支，取最近东非分支埃塞俄比亚（代理，非精确）' },
    { id: 'city_diyawanake', name: '蒂亚瓦纳科', factionId: 'inca', lat: -16.554, lng: -68.673, type: 'small_city', troops: 10000, region: 'SOUTHAM_IMPERIAL', buildingStyle: 'INCA', note: '[公元600至1000年安第斯高原蒂亚瓦纳科帝国都城·安山岩巨石神庙核心与6平方公里建成区] 的的喀喀湖南岸巨石文明母都蒂亚瓦纳科，据Janusek（2008）与Parsons高密度居住遗迹考古测算，核心连片城市建成区（不含湖盆农村）常住人口约1.5–3万，>1万定小城。；🔴 [2026-11-11 补标] 【建筑风格代理】前印加蒂亚瓦纳科巨石城，取最近INCA' },
    { id: 'city_puli', name: '普里', factionId: 'aolisha', lat: 19.810, lng: 85.831, type: 'small_city', isPort: true, troops: 10000, region: 'INDIA_CASTLE', buildingStyle: 'INDIA', note: '[12世纪东恒伽王朝建贾格纳特大庙至17世纪奥里萨圣城·石砌神庙重垣与连片朝圣商工城区普里] 阿难陀跋摩·乔达恒伽建巨石神庙后成印度四大圣地之一，扣除战车节数十万临时香客后，16–17世纪围绕大庙二十尺高石墙之常住婆罗门、工匠与商民城区约2–3万，>1万定小城。' },
    { id: 'city_hengbi', name: '亨比', factionId: 'kanata', lat: 15.335, lng: 76.460, type: 'big_city', troops: 10000, region: 'INDIA_IMPERIAL', buildingStyle: 'INDIA', note: '[16世纪初毗奢耶那伽罗帝国·七重花岗岩巨石王都] 克里希纳德瓦拉亚统治盛期（1500–1525年）亨比七重巨石城垣内及近关商坊人口约45–50万（葡使帕埃斯《纪行》及Chandler 1500年表50万），≥40万定大城。' },
    { id: 'city_bijiabuer', name: '比贾布尔', factionId: 'adile', lat: 16.830, lng: 75.736, type: 'medium_city', troops: 10000, region: 'INDIA_IMPERIAL', buildingStyle: 'INDIA', note: '[17世纪中叶阿迪勒沙阿王朝·玄武岩巨石双城垣都城] 比贾布尔苏丹国极盛期（1650–1670年）巨石外城与那拉萨普尔关厢峰值约30–35万（Chandler 1650年表确值为35万，Eaton《德干苏菲史》同估），未达40万容差线，定中城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 SPANISH：圣奥古斯丁（佛罗里达）：西班牙殖民地
    { id: 'city_shengaogusiding', name: '圣奥古斯丁', factionId: 'xibanya', lat: 29.897, lng: -81.313, type: 'stockade', isPort: true, troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'SPANISH', note: '[1565至1700年西班牙北美大陆最古据点佛罗里达圣奥古斯丁·1672年贝壳灰岩圣马可小星堡与木棕榈屋戍镇] 1565年梅嫩德斯灭法军卡罗琳堡建木砦，1672–1695年筑圣马可贝壳石堡（1702年英军摩尔焚毁堡外全镇），据1689–1700年西属驻军教区实名册全镇军民合计仅约1400–1500人且镇无环墙，定城寨。' },
    { id: 'city_deerfei', name: '德尔斐', factionId: 'xila', lat: 38.482, lng: 22.501, type: 'stockade', troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前6至前4世纪泛希腊阿波罗神谕圣地与第三次神圣战争福基斯菲洛墨洛斯据点德尔斐·帕尔纳索斯山坡圣域围垣小邦] 前356年菲洛墨洛斯占领神庙征雇佣兵（狄奥多罗斯XVI.24–30），圣域仅具神庙围墙（Temenos）而市民小邑无合围石城墙，Hansen（2004 p.412）考定德尔斐常住公民与家属仅约2000–3000人<1万，定城寨。' },
    { id: 'city_aolinpiya', name: '奥林匹亚', factionId: 'yilisi', lat: 37.639, lng: 21.631, type: 'stockade', troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前776年起古典希腊奥林匹克竞技与宙斯神庙圣地奥林匹亚·阿尔费奥斯河谷阿尔提斯圣林祭祀区（无常住城市）] 埃利斯城邦管辖之纯宗教竞技圣地（保萨尼亚斯《希腊志》卷五至六），除四年一度赛会短期云集数万观众外，平时全无市民街道与城墙，仅住祭司工匠数百人，定城寨。' },
    { id: 'city_boergong', name: '博尔贡', factionId: 'nuowei', lat: 61.047, lng: 7.812, type: 'stockade', troops: 10000, region: 'VIKINGS', buildingStyle: 'VIKINGS', note: '[12世纪末挪威内战桦皮鞋党斯韦雷王时代松恩峡湾博尔贡·峡湾山谷全木构龙首木板教堂与散居农庄] 约1180年建挪威保存最完好全木构博尔贡木板教堂（Stavkirke），峡湾通东挪威山道小教区仅教堂与十余座分散自由农木庄无市镇城墙，人口不足500人，定城寨。' },
    { id: 'city_beiergen', name: '卑尔根', factionId: 'nuowei', lat: 60.39, lng: 5.32, type: 'small_city', isPort: true, region: 'VIKINGS', buildingStyle: 'VIKINGS', troops: 10000, note: '[13至17世纪挪威王国最大城与汉萨商埠·石砌王堡与布吕根港市] 13世纪挪威王都，后为汉萨四大海外商站之一，1600–1700年连片港区常住人口稳定在1.4–1.5万（Bairoch 1988《欧洲城市人口》p.55载1600年1.5万），>1万定小城。' },
    { id: 'city_kanpeier', name: '坎佩尔', factionId: 'keernuwaye', lat: 47.995, lng: -4.103, type: 'small_city', isPort: true, troops: 10000, region: 'CELTS_FEUDAL', buildingStyle: 'BRITONS', note: '[中世纪布列塔尼科努瓦耶伯爵领与主教座城·奥代河与斯泰尔河交汇13世纪花岗岩环城石墙坎佩尔] 下布列塔尼宗教商贸首府坎佩尔，13世纪修筑完整高大花岗岩环城墙与戍塔（1344年布卢瓦的查理围攻石墙破城），15–17世纪城居约7000–9000人，<1万但具完整花岗岩石墙，定小城。' },
    { id: 'city_waerna', name: '瓦尔纳', factionId: 'baojialiya', lat: 43.214, lng: 27.915, type: 'small_city', isPort: true, troops: 10000, region: 'THRACIAN', buildingStyle: 'THRACIAN', note: '[古希腊奥德索斯至拜占庭保加利亚黑海要港·切石夹砖环城墙港市] 米利都殖民城奥德索斯，罗马拜占庭及保加利亚第二帝国时期筑坚固石砖环城港墙，1597年奥斯曼税册载城居约5500人，<1万但具古典至中世纪石砖城墙，定小城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 LATIN：杰姆（突尼斯）：罗马阿非利加行省，罗马古典
    { id: 'city_jiemu', name: '杰姆', factionId: 'luoma_diguo', lat: 35.296, lng: 10.706, type: 'small_city', troops: 10000, region: 'CARTHAGE', buildingStyle: 'ROMA', note: '[2至3世纪罗马阿非利加橄榄油富豪名城蒂斯德鲁斯（杰姆）·三万五千座巨石圆形竞技场与石构城区] 238年戈尔迪安一世称帝之城，拥有罗马帝国第三大纯切石圆形竞技场（可容3.5万人，仅次罗马与卡普阿），考古探明富裕马赛克石宅城区盛期人口达3–4.5万（Slim杰姆考古），>1万定小城。' },
    { id: 'city_yazide', name: '亚兹德', factionId: 'yilihanguo_d', lat: 31.897, lng: 54.356, type: 'small_city', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN' , note: '[12至15世纪阿塔贝格、莫扎法尔与帖木儿期丝路绿洲织锦名城·高耸生土夹烧砖多塔双环城墙亚兹德] 马可·波罗《游记》盛赞之高级丝锦制造大城亚兹德，穆巴里兹丁扩筑高墙与坎儿井水系，14–17世纪萨法维丝织盛期城居达3–5万（《亚兹德新史》及Aubin伊朗城市考），>1万定小城。' },

    { id: 'city_wuer', name: '乌尔城', factionId: 'wuer', lat: 30.962, lng: 46.103, type: 'small_city', troops: 10000, region: 'BABYLON', buildingStyle: 'ORIE', note: '[前21至前20世纪乌尔第三王朝帝国首都·乌尔纳姆泥砖底座包2.4米厚沥青烧砖斜坡城墙] 两河下游海贸与苏美尔复兴帝都乌尔，伦纳德·伍利爵士发掘确证烧砖包护环城河墙与高密度双层院落住宅区，乌尔第三王朝至伊辛拉尔萨期城垣与港区人口达3–6万（Woolley & Postgate折算），>1万定小城。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 桑奇＝阿育王始建大佛塔（孔雀/笈多北印）→ MUGHAL；原标 PURU
    { id: 'city_sangqi', name: '桑奇', factionId: 'shunga', lat: 23.48, lng: 77.739, type: 'stockade', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', note: '[前3世纪孔雀阿育王始建至前1世纪巽伽王朝扩雕石栏之佛教圣丘桑奇大塔·砂岩孤山顶寺院塔群（无城镇）] 山顶佛塔僧院群与山脚古维迪沙城相距十公里，桑奇山本身从非世俗市镇（14世纪后更掩入荒林直至1818年重现），无城墙且常住仅比丘数百人，定城寨。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 菩提伽耶＝摩揭陀佛陀成道地（孔雀/笈多北印）→ MUGHAL；原标 PURU
    { id: 'city_putijiaye', name: '菩提伽耶', factionId: 'kongque', lat: 24.696, lng: 84.991, type: 'stockade', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL' , note: '[前3世纪阿育王建金刚座寺至波罗王朝玄奘亲访之释迦成道圣地菩提伽耶·尼连禅河畔烧砖摩诃菩提寺垣与僧村] 玄奘《大唐西域记》卷八详载菩提树垣「垒砖为之高峻坚固，周五百余步」及垣北摩诃菩提伽蓝僧千余人，13世纪初毁衰为小村，砖墙系寺院内垣而非世俗城市且常住僧俗不足5000人，定城寨。' },

    { id: 'city_jienei', name: '杰内城', factionId: 'jienei', lat: 13.905, lng: -4.555, type: 'small_city', troops: 10000, region: 'GHANA', buildingStyle: 'AFRICA', note: '[13至16世纪马里与桑海帝国尼日尔内三角洲黄金转运商都·巴尼河环水高泥垣密集城区杰内] 与廷巴克图互为唇齿之西非商贸学术名城，1468–1473年桑海王孙尼·阿里水陆围攻七年方下（萨迪《苏丹史》），15–16世纪盛期岛城常住人口约2–3万（McIntosh杰内考古），>1万定小城。' },
    { id: 'city_agesi', name: '库尔泰亚', factionId: 'walajiyia', lat: 45.353, lng: 24.635, type: 'stockade', troops: 10000, region: 'SLAVIC_CASTLE', buildingStyle: 'SLAVIC' , note: '[14世纪瓦拉几亚开国大公巴萨拉布一世与尼古拉·亚历山德鲁早期王廷库尔泰亚-德阿尔杰什·石砌王公教堂院与木屋山麓镇] 1330年波萨达大捷后瓦拉几亚首座王廷（现存圣尼古拉王公石教堂），但15世纪迁都特尔戈维什泰后即退为小集镇，无环城石墙且常住仅约2000–4000人<1万，定城寨。' },

    { id: 'city_puleisilafu', name: '普雷斯拉夫', factionId: 'baojialiya', lat: 43.142315, lng: 26.813148, type: 'small_city', troops: 10000, region: 'BULGARIANS', buildingStyle: 'BULGARIANS', note: '[893至971年保加利亚第一帝国西美昂大帝黄金时代首都·3.5平方公里巨石内外双重方砌高墙] 西美昂一世迁都大普雷斯拉夫，筑厚达3.2米白色石灰岩切石内外两重宫城与外郭城垣（面积3.5平方公里，为同时代巴尔干仅次君士坦丁堡之巨石规划城），10世纪盛期城居约2–4万，>1万定小城。' },
    { id: 'city_aidiernei', name: '埃迪尔内', factionId: 'osman', lat: 41.6781, lng: 26.5591, type: 'medium_city', troops: 10000, region: 'OTTOMAN', buildingStyle: 'TURKS', note: '[14至17世纪奥斯曼帝国旧都与副都·石砖城垣色雷斯重镇] 奥斯曼第二都城埃迪尔内（阿德里安堡）1500年城居12.5万、1575年峰值达18.3万、1700年仍逾9.3万（Barkan奥斯曼帝国税册实算及Chandler 1500–1700年表），远超10万，定中城。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「EAST」只是一级母体、取不到 62 类 → 归 BYZANTINE：色雷斯鲁西翁（Rousion）：1206 年保加利亚破拉丁帝国处，该地在拜占庭/拉丁帝国核心区
    { id: 'city_luxiweng', name: '鲁西翁', factionId: 'baojialiya', lat: 40.88, lng: 26.63, type: 'stockade', troops: 10000, region: 'EAST', buildingStyle: 'BYZANTINE', note: '[1206年保加利亚沙皇卡洛扬率库曼骑兵全歼拉丁帝国精锐之鲁西翁大战场（今凯尚）·色雷斯军道小堡镇] 维尔阿杜安《征服君士坦丁堡记》详记1206年一月拉丁骑士一百二十名名爵与守军于鲁西翁（Rousion）城外遭卡洛扬歼灭、城民弃镇逃散，系非咽喉小军驿镇且常住不足5000人，定城寨。' },
    { id: 'city_suojiamosuo', name: '索加莫索', factionId: 'yilaka', lat: 5.715, lng: -72.933, type: 'stockade', troops: 10000, region: 'SOUTHAM_IMPERIAL', buildingStyle: 'MUISCA', note: '[15世纪末至1537年穆伊斯卡宗教圣城苏阿莫斯（索加莫索）·伊拉卡大祭司巨木太阳神庙与山谷散居村社] 1537年9月西军士兵夜持火把抢掠黄金不慎焚毁涂树脂巨木茅顶太阳神庙大火数日不熄（卡斯特利亚诺斯《新格拉纳达挽歌》），全为木栅茅屋宗教聚落无石墙且常住不足6000人，定城寨。' },
    { id: 'city_yiguasu', name: '伊瓜苏', factionId: 'gualani', lat: -25.695, lng: -54.437, type: 'stockade', troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'TUPI', note: '[1542年卡韦萨·德·巴卡徒步穿越发现伊瓜苏大瀑布与17世纪初耶稣会瓜拉尼传教村·亚热带雨林木竹村社] 巴拉那河与伊瓜苏河交汇瓜拉尼人农猎雨林及1626年圣玛利亚传教点（旋避保利斯塔捕奴队南迁，《巴拉圭耶稣会史》），无石墙且常住一二千人，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】瓜拉尼人长屋，取最近TUPI' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 SPANISH：巴拿马城：西班牙殖民地
    { id: 'city_banama', name: '巴拿马', factionId: 'xibanya', lat: 9.0056, lng: -79.4858, type: 'small_city', isPort: true, troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'SPANISH', note: '[1519至1671年西班牙美洲太平洋首府老巴拿马与1673年新石墙城·秘鲁白银地峡终点城] 1671年亨利·摩根焚毁老巴拿马时城内石木宅院市民与奴仆约1万，1673年迁址半岛修筑完整高10米珊瑚巨石环海棱堡城墙（Casco Viejo世遗），≤1700年破万且具完整石墙，定小城。' },
    // 🔴 [2026-11-02 主人令「添加波多韦洛据点」] 圣费利佩-德波多韦洛：西属美洲珍宝船队大西洋白银大帆船装船要塞港
    { id: 'city_portobelo', name: '波多韦洛', factionId: 'xibanya', lat: 9.5544, lng: -79.6644, type: 'stockade', isPort: true, troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'SPANISH', note: '[17世纪西属巴拿马珍宝船队装银港·湾口分立石炮台与无环墙海关镇] 1597年设港，虽湾口山嘴分设圣费利佩、圣地亚哥海防炮台，但市镇本身无合围城墙（1668年摩根自陆侧长驱入镇），平时常住仅2000–3000人（商展客商属临时流动），<1万定城寨。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 SPANISH：圣多明各：西班牙美洲第一城
    { id: 'city_shengduomingge', name: '圣多明各', factionId: 'xibanya', lat: 18.4715, lng: -69.8868, type: 'small_city', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'SPANISH', note: '[1496至1700年西班牙美洲首座总督最高法院首府·奥萨马河西岸珊瑚石灰岩完整环城棱堡墙] 哥伦布胞弟建城、奥万多按石构棋盘重建，1543年起修筑完整珊瑚石灰岩环城墙与二十二棱堡门（1655年凭石墙击退英军佩恩与维纳布尔斯万军登陆），城居约6000–10000人具完整石墙，定小城。' },
    { id: 'city_martinique', name: '马提尼克', factionId: 'gaolu', lat: 14.60, lng: -61.07, type: 'stockade', isPort: true, region: 'AMERICA', buildingStyle: 'FRANKS', troops: 10000, startYear: 1635, note: '[17世纪法属安的列斯首府皇家堡·海岬木石小堡与木构港镇] 1635年设防、1669年筑皇家堡（Fort-Royal），1674年击退荷兰德·鲁伊特舰队，≤1700年市镇人口仅约2000–3000人且镇区无环城石墙（Pritchard法属美洲史），定城寨。' },
    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「MEDI」推出的二级与史实不符 → 归 SPANISH：卡塔赫纳（哥伦比亚）：西班牙殖民地
    { id: 'city_katachena', name: '卡塔赫纳', factionId: 'xibanya', lat: 10.4266, lng: -75.5442, type: 'small_city', isPort: true, troops: 10000, region: 'NORTHAM_IMPERIAL', buildingStyle: 'SPANISH', note: '[16至17世纪西属新格拉纳达珍宝船队第一坚城·圣费利佩石堡与环城珊瑚石灰岩巨墙卡塔赫纳] 南美白银黄金与奴隶总集散港，1586年后安东尼利父子设计修筑厚重珊瑚石灰岩环城高墙（Murallas）围合主城与赫塞马尼关厢，17世纪下半叶常住人口达1–1.5万且具巨石城墙，定小城。' },
    { id: 'city_lalibeila', name: '拉利贝拉', factionId: 'zhagewei', lat: 12.033689, lng: 39.043350, type: 'stockade', troops: 10000, region: 'AFRICA_CASTLE', buildingStyle: 'ETHIOPIANS', note: '[12世纪末至13世纪初埃塞俄比亚扎格维王朝拉利贝拉王凿建「新耶路撒冷」罗哈·凝灰岩整石下沉式十一教堂圣镇] 海拔2600米拉斯塔山区向下凿岩而成之朝圣宗教中心（1520年葡国神父阿尔瓦雷斯亲访实记当时罗哈已非政治都城，仅住祭司修士与少量农户），无防御城墙且常住不足5000人，定城寨。' },
    { id: 'city_zeila', name: '塞拉', factionId: 'adal', lat: 11.3533, lng: 43.4731, type: 'small_city', isPort: true, troops: 10000, region: 'ETHIOPIANS', buildingStyle: 'ORIE', note: '[14至16世纪初阿达尔苏丹国古都与红海巨埠·珊瑚石建筑港城塞拉] 1331年伊本·白图泰与1503年瓦尔泰马亲历记塞拉为红海出口黄金象牙与埃塞高原贸易大都会，1517年葡军焚城前常住人口达1–1.5万（Pankhurst 1982《埃塞俄比亚城镇史》pp.55–62），>1万定小城。；【建筑风格代理】阿达尔/泽拉属东非索马里，66 文化无斯瓦希里/索马里分支，取最近东非分支埃塞俄比亚（代理，非精确）；🔴 [2026-11-11 按史改] 据点文化 ETHIOPIANS→ORIE（代理）：阿达尔苏丹国古都，逊尼派伊斯兰与红海海商，珊瑚石清真寺' },
    { id: 'city_dasijiliweng', name: '达斯基利翁', factionId: 'aqimeinide', lat: 40.1322, lng: 28.0504, type: 'stockade', troops: 10000, region: 'ACHAEMENIDS', buildingStyle: 'PERSIAN', note: '[前6至前4世纪阿契美尼德波斯赫勒斯滂弗里吉亚总督治所达斯基利翁·曼雅斯湖畔总督宫苑猎园小台邑] 色诺芬《希腊史》IV.1.15–16盛赞法尔纳巴佐斯总督在达斯基利翁之华美园林猎场与周边富村，前334年帕曼纽不战接收（阿里安I.17.2），土耳其考古发掘证实仅为几公顷总督宫台而非万人市民城，定城寨。' },
    { id: 'city_bishnupur', name: '比什努普尔', factionId: 'mallabhum', lat: 23.075, lng: 87.317, type: 'small_city', troops: 10000, region: 'INDIA_IMPERIAL', buildingStyle: 'BENGALIS', note: '[16至17世纪孟加拉末罗（Malla）王国毗湿奴派王都·红土巨石城门（Dalmadal）与七英里重壕砖石城垣] 比尔·汉比尔与拉古纳特·辛格王盛期筑大石门、红砖赤陶神庙群与三重护城壕墙抗御莫卧儿与马拉塔，17世纪王都常住人口约1.5–2.5万（Mallik《比什努普尔史》），>1万且具石砖城防，定小城。' },
    { id: 'city_baba_vida', name: '巴巴维达', factionId: 'vidin_tsardom', lat: 43.993056, lng: 22.886667, type: 'pass', troops: 10000, region: 'SLAVIC_CASTLE', buildingStyle: 'BULGARIANS', note: '[第二保加利亚帝国维丁沙皇国·多瑙河大弯双层砖石水畔城堡] 伊凡·斯拉齐米尔扩建巴巴维达双层石砖塔堡扼多瑙河维丁渡口，1396年尼科波利斯战役十字军与奥斯曼争夺此堡（希尔特贝格尔《游记》），河防石堡且堡镇<1万，定险要。' },
    { id: 'city_fasil_fort', name: '法西尔堡', factionId: 'ethiopia', lat: 12.6075, lng: 37.469, type: 'small_city', troops: 10000, region: 'AFRICA_IMPERIAL', buildingStyle: 'ETHIOPIANS', note: '[17世纪埃塞俄比亚所罗门王朝贡德尔期·玄武岩石砌皇城与连片都邑] 1636年法西里德帝营建法西尔盖比石砌皇城并定都贡德尔，至1699年法国医师庞塞亲访实记贡德尔全城常住人口达6万以上（Poncet《埃塞俄比亚游记》及Pankhurst《埃塞俄比亚城市史》），远超1万按城判，定小城。' },
    { id: 'city_chambord', name: '香波堡', factionId: 'gaolu', lat: 47.616, lng: 1.517, type: 'stockade', troops: 10000, region: 'LATIN_IMPERIAL', buildingStyle: 'FRANKS', note: '[16世纪法兰西文艺复兴弗朗索瓦一世期·卢瓦尔林苑石筑王室猎宫] 1519年弗朗索瓦一世于索洛涅森林兴建文艺复兴双螺旋梯猎庄离宫，无外郭设防亦非守道军事关塞，周边林村居民不足千人，按非关塞且人口<1万无城郭，定城寨。' },

    // 🔴 [2026-09-18 主人定「据点必须二级 62+3 选 1（套城堡素材）」] 原「EAST」推出的二级与史实不符 → 归 GEORGIANS：阿哈尔齐赫：格鲁吉亚南部
    { id: 'city_akhaltsikhe', name: '阿哈尔齐赫', factionId: 'samtskhe', lat: 41.642, lng: 42.975, type: 'small_city', troops: 10000, region: 'WEST_ASIA_CASTLE', buildingStyle: 'GEORGIANS', note: '[13至16世纪萨姆茨赫贾克利王公都城至17世纪奥斯曼省会·拉巴提双层巨石城墙阿哈尔齐赫] 南格鲁吉亚贾克利家族首府，1578年后为奥斯曼奇尔德尔省首府，扩筑拉巴提巨石城堡与下城石墙，17世纪埃夫利亚·切莱比《旅行记》载城内逾千户石木街坊且具完整石墙，定小城。' },
    { id: 'city_gwalior_fort', name: '瓜廖尔堡', factionId: 'tomara_gwalior', lat: 26.231, lng: 78.169, type: 'medium_city', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', note: '[15至16世纪托摩罗王都与莫卧儿重镇·红砂岩山堡及城下大邑] 曼·辛格扩建瓜廖尔石堡并营山下旧城，1550年苏尔与莫卧儿交替期城堡连片居民达8万（Chandler 1550年表8万）；已形成万人以上大城不再算纯军事设施，踩8万容差线，定中城。' },
    { id: 'city_machu_picchu', name: '马丘比丘', factionId: 'inca', lat: -13.1631, lng: -72.545, type: 'stockade', troops: 10000, region: 'ANDE', buildingStyle: 'INCA', note: '[15世纪中叶印加帕查库特克期·乌鲁班巴山脊花岗岩王家离宫庄园] 约1450年帕查库特克营建之王室山居庄园与祭祀离宫（Burger & Salazar 2004考古考证常住侍从约750人），非守道关塞且无环城防御外墙，按非关塞且<1万定城寨。' },
    { id: 'city_golconda', name: '戈尔康达', factionId: 'qutb_shahi', lat: 17.3833, lng: 78.4011, type: 'small_city', troops: 10000, region: 'INDIA_IMPERIAL', buildingStyle: 'INDIA', note: '[16世纪库特布沙希苏丹国都城期·7公里花岗岩巨石外郭都城] 1518–1591年戈尔康达为库特布沙希王朝正式都城，7公里花岗岩巨石外墙内坊市人口饱和达5–7万（因城内逾数万人拥挤方于1591年东营海得拉巴，Sherwani《库特布沙希史》），已成超万人城不再算设施，定小城。' },
    { id: 'city_bidar', name: '比达尔', factionId: 'bahemani', lat: 17.91, lng: 77.52, type: 'small_city', troops: 10000, region: 'INDIA_IMPERIAL', buildingStyle: 'MUGHAL', note: '[15世纪巴赫曼尼苏丹国迁都期·红土巨石三重壕墙王都比达尔] 1429年艾哈迈德沙一世自古尔伯加迁都比达尔，筑三重红土巨石城墙、七门及马哈茂德·加万经学院，1470年俄商尼基京《三海纪行》亲历记都城繁盛，城居约3–5万且具巨石城墙，定小城。；建筑为波斯风伊斯兰式，取 MUGHAL（印度斯坦）代理' },
    { id: 'city_pagaruyung', name: '帕加鲁荣', factionId: 'minangkabau', lat: -0.471, lng: 100.621, type: 'stockade', troops: 10000, region: 'MALAY', buildingStyle: 'MALAY', note: '[14世纪阿迪蒂亚瓦尔曼建国至17世纪苏门答腊西高地米南加保王廷帕加鲁荣·牛角尖顶巨木王宫与竹刺围篱村群] 1684年荷兰东印度公司首位内陆使臣托马斯·迪亚斯亲访王廷实记帕加鲁荣由三道竹木栅门拱卫木构大宫，连周边随扈村寨约八千人（未满1万整硬门槛且为竹木无石砖墙），定城寨。' },
    { id: 'city_uxmal', name: '乌斯马尔', factionId: 'tutul_xiu', lat: 20.359, lng: -89.771, type: 'small_city', troops: 10000, region: 'MAYANS', buildingStyle: 'MAYANS', note: '[9至10世纪古典终末期尤卡坦普克玛雅霸主都城·总督宫石灰岩建筑群与同心石砌防墙乌斯马尔] 查克王（Chan Chak K\'ak\'nal Ajaw）统治极盛期普克区域首都，考古实测中心纪念区外筑有周3公里同心石灰岩防御矮墙，连片建成区常住人口约1.5–2.5万（Dunning & Kowalski普克考古），>1万定小城。' },
    { id: 'city_bam_citadel', name: '巴姆', factionId: 'xisi', lat: 29.116, lng: 58.368, type: 'pass', troops: 10000, region: 'SASANIAN', buildingStyle: 'PERSIAN', note: '[萨珊至9世纪萨法尔王朝期·卢特沙漠南缘高台生土夯筑巨堡（阿格-巴姆）] 扼克尔曼通锡斯坦沙漠商道咽喉，高岩台筑重重夯土生土高墙与三十八座戍塔护卫水源要冲（伊斯塔赫里《道路与王国志》），守道绿洲要塞且堡内常住<1万，定险要。' },
    { id: 'city_bedzin', name: '本津堡', factionId: 'bolan', lat: 50.327217, lng: 19.129145, type: 'pass', troops: 10000, region: 'POLES', buildingStyle: 'POLES', note: '[14世纪波兰卡齐米日三世期·黑普热姆沙河畔石灰岩王家边防石堡] 1348年卡齐米日大帝筑本津王家石堡，属鹰巢石堡防线最西端锁钥以御波希米亚西里西亚方向入侵（《扬·德乌戈什波兰史》），纯边境守道石堡且镇民仅千余人<1万，定险要。' },
    { id: 'city_braganca', name: '布拉干萨', factionId: 'putaoya', lat: 41.8042, lng: -6.7492, type: 'small_city', troops: 10000, region: 'PORTUGUESE', buildingStyle: 'PORTUGUESE', note: '[12至15世纪葡萄牙王国与布拉干萨公爵领·花岗岩环城石墙边城] 1187年桑乔一世赐市镇特许状、1464年升格城市（Cidade），具完整市政厅、教区户籍及花岗岩环城石墙（非纯军事哨卡），≤1700年城居约3000–5000人，按<1万石墙城市定小城。' },
    { id: 'city_la_mota', name: '拉莫塔堡', factionId: 'kasidiliya', lat: 41.309, lng: -4.9085, type: 'pass', troops: 10000, region: 'ARAGON', buildingStyle: 'SPANISH', note: '[15世纪卡斯蒂利亚特拉斯塔马拉与天主教双王期·红砖高塔王家军械要塞] 1440年代扩建拉莫塔双层红砖高墙与深壕大要塞，为王室火炮军械总库及伊莎贝拉女王驻防重堡（门多萨编年史），名带「堡」且具包砖厚墙之纯王家军堡，定险要。' },
    { id: 'city_seuthopolis', name: '塞乌托波利', factionId: 'seleisi', lat: 42.618056, lng: 25.305556, type: 'small_city', troops: 10000, region: 'THRACIAN', buildingStyle: 'THRACIAN', note: '[前4世纪末色雷斯奥德里西亚国王塞乌特斯三世新都·石基泥砖五公顷四角塔王城塞乌托波利] 约前320年塞乌特斯三世仿希腊化棋盘规划营建，1948–1954年水库抢救发掘确证全城筑厚2米花岗岩与碎石高基城墙、四角方塔及王宫内堡（Dimitrov发掘报告），<1万但具石砌城郭，定小城。' },
    { id: 'city_chimarros', name: '希马鲁塔', factionId: 'xila', lat: 36.965, lng: 25.53, type: 'pass', isPort: true, troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前4至前3世纪希腊化基克拉泽斯海防期·纳克索斯大理石圆塔哨塞] 筑于纳克索斯东南扎斯山麓之高15米双层大理石圆形设防戍塔外加方形石砌外院，专司爱琴海航道烽火预警与驻兵守险（Lawrence《希腊筑城学》），纯军事石砌哨塔且无居民城，定险要。' },
    { id: 'city_themiskyra', name: '忒弥斯基拉', factionId: 'bendou_d', lat: 41.2, lng: 36.98, type: 'stockade', troops: 10000, region: 'ORIE', buildingStyle: 'BYZANTINE', note: '[古希腊神话亚马逊女战士故都与前73至前71年第三次米特拉达梯战争卢库鲁斯围攻本都港镇忒弥斯基拉·特尔莫冬河口小邑] 阿庇安《米特拉达梯战争史》78记卢库鲁斯掘地道围攻后城毁荒废，至前1世纪斯特拉波与公元1世纪梅拉、普林尼均明载忒弥斯基拉早已荡然无存连遗址亦难寻，古典人口与石墙均无实据，定城寨。' },
    // 🔴 [2026-09-12 主人「加沙用什么看历史」] 亚历山大剧本第四章「加沙围城战」的攻城载体。
    //    定级依据 §6.2：加沙非关隘/要塞/堡垒 → 按城市；城内军民数万 >1 万 → 小城（腓利斯丁五城之一）。
    //    坐标实测：最近邻耶路撒冷 76.43 km ≥50 km ✓ 合法，无需特批。
    { id: 'city_jiasa', name: '加沙', factionId: 'feilisidin', lat: 31.5017, lng: 34.4668, type: 'small_city', isPort: true, troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[非利士五城、前332年亚历山大围城名邑至罗马拜占庭马穆鲁克大商埠·高丘石砖城墙加沙] 扼埃及通叙利亚海岸大道咽喉，前332年巴提斯凭高墙拒亚历山大两月（阿里安II.26–27记全城男丁战死、妇孺逾万被卖），5–6世纪拜占庭及16世纪奥斯曼税册城居皆达1.5–3万，>1万定小城。' },
    // 🔴 [2026-09-30 主人令「添加据点：佩利纳（Pelina，色萨利）39.5295,21.8958」]
    //    来由：佩利昂与底比斯之间库里没有任何据点，路网只能绕经佩拉，两头路重叠；阿里安《远征记》I.7 原文点名的停留地正是佩利纳。
    { id: 'city_pelina', name: '佩利纳', factionId: 'sesali', lat: 39.57, lng: 21.93, type: 'small_city', troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前4世纪古典色萨利四区重邦佩利纳·皮尼奥斯河北岸切石双卫城与环城石墙] 前335年亚历山大南征底比斯驻军要邑（阿里安I.7.5），希腊考古发掘确证其具上下两重切石多边形石墙与方塔围合山坡城区（Hansen & Nielsen 2004 p.700），<1万具古典石墙，定小城。' },

    // 🔴 [2026-09-30 主人令「添加据点：兹拉卡塔 36.84,54.43」] 赫卡尼亚首府、阿契美尼德二十大行省之一赫卡尼亚的行政首府与王家驻地。
    { id: 'city_zilakata', name: '兹拉卡塔', factionId: 'aqimeinide', lat: 36.84, lng: 54.43, type: 'small_city', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN', note: '[前4世纪阿契美尼德与希腊化赫卡尼亚行省首府扎德拉卡塔·厄尔布尔士北麓高垣王宫省都] 前330年亚历山大受纳波斯残军与希腊雇佣兵投降并驻留十五日举行竞技之最大省城（阿里安III.23–25明确称其为赫卡尼亚最大都邑与王宫所在），里海走廊省会常住约1.5–2.5万，>1万定小城。' },
    { id: 'city_peiliang', name: '佩利昂', factionId: 'dasaleiti', lat: 40.7306, lng: 20.8625, type: 'small_city', troops: 10000, region: 'THRACIAN', buildingStyle: 'MACEDONIAN', note: '[前4世纪伊利里亚达萨雷提部设防首邑佩利昂·德沃尔河峡口干砌巨石山城垣] 前335年克莱图斯与格劳基亚斯据城抗亚历山大，阿里安I.5.5称佩利昂为全境最坚固之城，阿尔巴尼亚考古探明兹韦兹代一带伊利里亚巨石砌筑城垣，具石墙城郭，定小城。' },
    { id: 'city_peierge', name: '阿斯彭杜斯', factionId: 'aqimeinide', lat: 36.9389, lng: 31.1722, type: 'small_city', troops: 10000, region: 'GREEK', buildingStyle: 'GREECE', note: '[前5至前4世纪潘菲利亚富邦至罗马巨石剧场名城阿斯彭杜斯·欧里梅东河切石高台城墙] 前334年亚历山大课银五十塔兰特并派兵进驻其坚固高台石墙城（阿里安I.26–27），现存罗马巨石剧场、高架石水道与希腊化切石城门，古典至罗马盛期城居约1.5–2.5万，>1万定小城。' },
    { id: 'city_baihaliye', name: '拜哈里耶', factionId: 'aiji', lat: 28.35, lng: 28.86, type: 'stockade', troops: 10000, region: 'EGYPT', buildingStyle: 'ORIE', stockadeShape: 'rect', stockadeFence: 'FENCE', note: '[古埃及第26王朝神庙商站与罗马「小绿洲」驻点拜哈里耶·西部沙漠椰枣葡萄酒绿洲泥砖村聚] 撒哈拉西部沙漠绿洲链北站（发掘第26王朝总督杰德孔苏伊乌夫安赫墓与亚历山大泥砖小庙），罗马置小队辅兵戍泉，绿洲散村泥砖墙且总常住仅数千人<1万，定城寨。' },
    { id: 'city_kuida', name: '奎达', factionId: 'dulan_d', lat: 30.58, lng: 67.01, type: 'stockade', troops: 10000, region: 'PASHTUN', buildingStyle: 'PERSIAN', note: '[萨珊至近代前俾路支沙尔（奎达）·波兰山口北端土丘聚落] 古称沙尔科特（Shal Kot），18世纪前仅为土坯夯筑小土丘村镇而无石砖夯土正式关塞城垣（1876年英军占领后方建近代棱堡要塞，超年不采），常住数千人<1万，定城寨。' },
    { id: 'city_zhalange', name: '扎兰格', factionId: 'xisi', lat: 30.96, lng: 61.86, type: 'small_city', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN', note: '[9世纪萨法尔王朝开国首都扎兰格（锡斯坦首府）·烧砖泥砖双重深壕五门大城] 铜匠雅库布·伊本·莱斯861年自扎兰格起兵建立萨法尔王朝，10世纪伊斯塔赫里《道路与王国志》详记内外两城周数里、引赫尔曼德河入壕、巴扎绵延，帖木儿毁城前盛期城居约3–5万，>1万定小城。' },
    { id: 'city_teerbate', name: '特尔巴特', factionId: 'dulan_d', lat: 26.00, lng: 63.05, type: 'stockade', troops: 10000, region: 'PERSIAN', buildingStyle: 'PERSIAN', note: '[阿契美尼德马卡行省至中世纪莫克兰内陆首邑凯奇（特尔巴特）·凯奇河谷坎儿井枣椰林泥砖土堡聚落] 马可·波罗与伊本·白图泰所记莫克兰（吉德罗西亚）内陆凯奇河谷绿洲集镇，山丘立泥砖米里小土堡（Miri Kalat）而镇无石砖环墙，干旱绿洲常住约4000–7000人<1万，定城寨。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 奥拉＝欣戈尔河口（莫克兰，判不出→最近同风格据点卡拉奇）→ PURU；原标 INDIA
    { id: 'city_aola', name: '奥拉', factionId: 'yinduxila', lat: 25.51, lng: 65.51, type: 'stockade', isPort: true, troops: 10000, region: 'PURU', buildingStyle: 'PURU', stockadeShape: 'trapezoid', stockadeFence: 'FENCE', note: '[前325年亚历山大西征穿越奥里泰境攻拔之沿海土邑奥拉（Ora）·俾路支欣戈尔河流域生土泥砖村邑] 阿里安《亚历山大远征记》VI.22.1–3载亚历山大派兵轻取奥里泰人奥拉邑并留阿波罗多洛斯筹粮，旋随马其顿军撤退废弃，生土小邑查无人口数字且<1万，定城寨。' },
    { id: 'city_wuqi', name: '乌奇', factionId: 'deli', lat: 29.24, lng: 71.05, type: 'small_city', troops: 10000, region: 'PURU', buildingStyle: 'PURU', note: '[前325年印度河亚历山大城故地至13世纪纳西尔丁·卡巴查王都·烧砖高垣苏菲圣城乌奇] 五河交汇重镇乌奇（Uch Sharif），1206–1228年卡巴查苏丹定为信德与旁遮普王国首都广纳流亡学者，朱兹贾尼《纳昔儿史话》记其烧砖高城与经学院繁盛，13–16世纪城居约2–3万，>1万定小城。' },
    { id: 'city_aluoer', name: '阿罗尔', factionId: 'kongque', lat: 27.68, lng: 68.9, type: 'small_city', troops: 10000, region: 'PURU', buildingStyle: 'PURU', note: '[前4世纪穆西卡诺斯王都至7至8世纪信德拉伊与查奇王朝首都·印度河岸石砖高墙阿罗尔] 711年阿拉伯名将穆罕默德·伊本·卡西姆围攻信德达希尔王首都阿罗尔，《查奇纪年》（Chachnama）详载其濒河筑有高大石砖城墙、王宫与神庙，信德古都城居约1.5–2.5万且具石砖墙，定小城。' },
    { id: 'city_kalaqi', name: '卡拉奇', factionId: 'deli', lat: 24.86, lng: 67.01, type: 'stockade', isPort: true, troops: 10000, region: 'PURU', buildingStyle: 'PURU' , note: '[前325年尼阿尔库斯印度洋舰队起航锚地克罗卡拉至1700年前信德海岸木栅小渔村科拉奇（卡拉奇）·红树林泻湖渔埠] 阿里安《印度志》21章载尼阿尔库斯舰队泊克罗卡拉沙岛一日，而泥筑科拉奇商埠迟至1729年方因邻港淤塞建双门泥栅小寨（违反≤1700年红线），≤1700年仅为数十户俾路支渔民小村，定城寨。' },
    { id: 'city_dunadd', name: '邓纳德', factionId: 'dalriada', lat: 56.0914, lng: -5.4875, type: 'stockade', troops: 10000, region: 'SCOTLAND', buildingStyle: 'CELTS', note: '[6至9世纪苏格兰达尔里阿达王国·克里南沼泽岩丘干石王廷寨] 盖尔人达尔里阿达王国的加冕岩丘王都邓纳德（《阿尔斯特编年史》683、736年条及Lane & Campbell 2000发掘报告），实为部族王室居住工坊丘寨而非守道关隘，常住数百人<1万，定城寨。' },
    { id: 'city_scone', name: '斯昆', factionId: 'scotland', lat: 56.4189, lng: -3.4217, type: 'stockade', troops: 10000, region: 'SCOTLAND', buildingStyle: 'CELTS', note: '[9至17世纪苏格兰王国历代国王命运之石加冕圣地斯昆·泰河东岸莫特山丘与奥古斯丁修道院聚落] 肯尼思一世至1651年查理二世加冕之苏格兰王权礼仪圣所斯昆修道院（非设防城市，邻近市镇在珀斯），无城墙且修院附村常住仅数百人<1万，定城寨。' },
    // 🔴 [2026-10-25 主人令「存在就建」] 因弗内斯＝苏格兰高地首府/因弗内斯城堡；离最近据点斯昆 128km（>50km）故新建；文化按当地政权＝苏格兰高地 → CELTS
    { id: 'city_yinfeineisi', name: '因弗内斯', factionId: 'scotland', lat: 57.48, lng: -4.22, type: 'stockade', isPort: true, troops: 10000, region: 'SCOTLAND', buildingStyle: 'CELTS', note: '[6世纪皮克特王布鲁德驻地至12至17世纪苏格兰高地门户皇家自治镇因弗内斯·尼斯河口小堡与无墙木石市镇] 虽河岸小丘历建木石王室城堡（1650年代克伦威尔另筑五角棱堡于1662年即全拆），但因弗内斯市镇本身始终无环城石墙（仅挖沟设木栅），17世纪常住仅约2000–3000人<1万，定城寨。' },
    { id: 'city_andahuaylas', name: '安达瓦伊拉斯', factionId: 'chanka', lat: -13.6556, lng: -73.3872, type: 'stockade', troops: 10000, region: 'ANDE', buildingStyle: 'INCA', note: '[15世纪初印加帕查库特克决战劲敌昌卡（Chanka）部族联盟大本营安达瓦伊拉斯·阿普里马克河谷山地干石梯田村寨群] 昌卡统帅阿斯塔瓦兰卡与乌斯科维尔卡自安达瓦伊拉斯起兵猛攻库斯科败亡（加西拉索《印加王室述评》），安第斯山谷分散农牧石屋聚落无合围都城墙且单寨<1万，定城寨。' },
    { id: 'city_yamaguchi', name: '山口', factionId: 'ouchi', lat: 34.1861, lng: 131.4714, type: 'small_city', troops: 10000, region: 'JAPAN', buildingStyle: 'JAPAN', note: '[15至16世纪周防大内氏守护都城「西之京都」·仿京都棋盘条坊建成区山口] 大内政弘、义兴、义隆三代招纳应仁战乱公卿与勘合贸易明商，沙勿略1551年布道书信实记山口逾万户繁华，日本中世都市史通估天文年间城居峰值达3–4万（《山口县史》），>1万定小城。' },
    { id: 'city_comagre', name: '科马格雷', factionId: 'cueva', lat: 8.95, lng: -78.15, type: 'stockade', troops: 10000, region: 'SOUTHAM_IMPERIAL', buildingStyle: 'MUISCA', note: '[1511年巴尔沃亚探获太平洋（南海）与印加黄金情报之达连库埃瓦大酋邦科马格雷·热带丛林巨木宫屋木栅村寨] 彼得·马特《新世界十年记》与拉斯·卡萨斯详记科马格雷酋长拥有百五十步巨木雕梁大殿及长子潘基亚科指路越山见太平洋，系热带雨林原木长屋酋长寨（约3000人）无石砖墙，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】巴拿马库埃瓦木构宫寨，取最近MUISCA' },
    { id: 'city_ahmedabad', name: '艾哈迈达巴德', factionId: 'gujarat', lat: 23.0225, lng: 72.5714, type: 'big_city', troops: 10000, region: 'INDIA_CASTLE', buildingStyle: 'GURJARAS', note: '[16至17世纪古吉拉特苏丹国与莫卧儿巨镇·烧砖石门十二门大城] 艾哈迈德沙始建后为西印度最大工商业都会，城垣内与贴城普拉坊厢1600年约30万、1650年约38万、1700年达40万（Chandler 1700年表40万；Gillion《艾哈迈达巴德城市史》），踩40万容差线，定大城。' },
    { id: 'city_miaowu', name: '妙乌', factionId: 'arakan', lat: 20.5925, lng: 93.1953, type: 'medium_city', troops: 10000, region: 'BURMESE', buildingStyle: 'BURMESE', note: '[16至17世纪若开阿拉干王国都城·巨石山棱石墙水网王都] 明彬筑30公里依山巨石水闸城防至1630年代极盛期，妙乌城内及贴城外侨商馆常住人口约10–16万（葡国修士曼里克1630年亲历记16万，Gutman／Charney折实约10–12万），>10万定中城。' },
    { id: 'city_batavia', name: '巴达维亚', factionId: 'nidelan', lat: -6.1352, lng: 106.8133, type: 'small_city', isPort: true, troops: 10000, region: 'JAVANESE', buildingStyle: 'MALAY', note: '[17世纪荷兰东印度公司亚洲总督府总部巴达维亚·珊瑚巨石棱堡城堡与砖墙运河城区] 1619年科恩于爪哇顺达卡拉帕建巴达维亚砖石环城墙与四角珊瑚石城堡，据VOC官方年度户口清册（Dagh-Register）1673–1700年城墙内连同紧贴南关厢常住人口达2.7–5万（Blussé考证），>1万定小城。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 舍卫城＝拘萨罗国都、恒河北印 → MUGHAL；原标 INDIA（南印）
    { id: 'city_sheweicheng', name: '舍卫城', factionId: 'kosala', lat: 27.5112, lng: 82.0388, type: 'small_city', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', note: '[前6至前4世纪十六大国憍萨罗国都·马赫特5公里烧砖土基新月巨垣] 《长阿含·游行经》所列古印度六大城之一舍卫城（玄奘《大唐西域记》室罗伐悉底），考古实测城墙围合160公顷，佛世至孔雀期城居峰值约3–5万（Erdösy 1988及Chandler前500年表5万），>1万定小城。' },
    { id: 'city_danta', name: '丹塔普拉', factionId: 'kalinga', lat: 18.4, lng: 84, type: 'stockade', isPort: true, troops: 10000, region: 'INDIA_CASTLE', buildingStyle: 'INDIA', note: '[古印度羯陵伽王国传说供奉佛牙舍利圣港丹塔普拉（帕卢拉一带）·奥里萨海岸河口早期铁器泥砖海贸遗址] 巴利文《佛牙史》（Dathavamsa）记4世纪自羯陵伽丹塔普拉护送佛牙渡海赴锡兰阿努拉德普勒，具体城址学界尚存多说且无可靠人口史料与石墙确证，按查无人口定城寨。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 瞻波＝鸯伽国都、恒河与瞻波河交汇（后并入摩揭陀）→ MUGHAL；原标 PURU
    { id: 'city_zhanbo', name: '瞻波', factionId: 'anga', lat: 25.2425, lng: 86.9842, type: 'small_city', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', note: '[前6至前3世纪十六大国鸯伽王国都城·恒河南岸烧砖包护高垣巨邑] 古印度佛世六大城之一瞻波（今巴格尔布尔昌帕纳加尔遗址），考古发掘确证厚重土基包烧砖卫城垣与深壕，前5–前3世纪城居约2–3万（Erdösy《早期历史印度城市化》），>1万定小城。' },
    // 🔴 [2026-10-25 主人令「全面修复」印度据点文化] 阿逾陀＝拘萨罗/巽伽北印古城 → MUGHAL；原标 INDIA
    { id: 'city_ayuta', name: '阿逾陀', factionId: 'shunga', lat: 26.8, lng: 82.2, type: 'small_city', troops: 10000, region: 'MUGHAL', buildingStyle: 'MUGHAL', note: '[前6世纪早期憍萨罗都城至笈多莫卧儿圣城·萨罗瑜河砖石城邑阿逾陀] 古印度名城阿逾陀（沙祇大城Saketa），孔雀至笈多及16–17世纪莫卧儿阿瓦德省首府时期连片城区人口约3–5万（Bakker 1986《阿逾陀考》及Chandler前400年表4–5万），>1万定小城。' },
    { id: 'city_kailaina', name: '凯莱奈', factionId: 'antigonid', lat: 38.06, lng: 30.16, type: 'small_city', troops: 10000, region: 'MACEDONIAN', buildingStyle: 'MACEDONIAN', note: '[波斯弗里吉亚总督治所、安提柯一世都城凯莱奈至塞琉古阿帕梅亚·石砌卫城与商贸大邑] 色诺芬《长征记》I.2.7亲历明载凯莱奈为「弗里吉亚人口稠密、宏大富庶之城」并具薛西斯石筑卫城，后安提柯一世以此为治所、塞琉古迁建毗邻阿帕梅亚为小亚第二大商都（斯特拉波XII.8.15），城居达2–4万，>1万定小城。' },
    { id: 'city_coimbra', name: '科英布拉', factionId: 'putaoya', lat: 40.21, lng: -8.43, type: 'small_city', troops: 10000, region: 'PORTUGUESE', buildingStyle: 'PORTUGUESE', note: '[1139至1255年葡萄牙王国开国首都与大学城·蒙德戈河山坡摩尔及罗曼切石环城高墙] 阿方索·恩里克斯建国首任王都与1290/1308年科英布拉大学驻地，现存阿尔梅迪纳石门与山上切石城墙，16世纪葡国普查城居约1.2–1.5万且具完整石墙，定小城。' },
    { id: 'city_suceava', name: '苏恰瓦', factionId: 'moerdaweiya', lat: 47.65, lng: 26.26, type: 'small_city', troops: 10000, region: 'SLAVIC_CASTLE', buildingStyle: 'SLAVIC', note: '[1388至1565年摩尔达维亚公国首都（斯特凡大公王都）·4米厚砂岩石砌席位堡与市民城防] 斯特凡三世扩建双层巨石外墙与圆形炮台（1476年抗住穆罕默德二世御驾亲征围攻而未破），15–16世纪迁都雅西前城居峰值约1–1.5万且具坚固石墙，定小城。' },
    { id: 'city_skopje', name: '斯科普里', factionId: 'saierweiya', lat: 41.99, lng: 21.43, type: 'small_city', troops: 10000, region: 'SERBIA', buildingStyle: 'MACEDONIAN', note: '[1346年塞尔维亚帝国杜尚沙皇加冕都城与16至17世纪奥斯曼巴尔干巨镇·卡莱巨石城墙斯科普里] 查士丁尼始筑卡莱巨石卫城、斯特凡·杜尚定为帝国首都，1689年奥军皮科洛米尼焚城前埃夫利亚·切莱比与奥军战报实记城内逾万户、常住人口达4–6万（Bairoch 1988），>1万定小城。' },
    { id: 'city_prilep', name: '普里莱普', factionId: 'saierweiya', lat: 41.35, lng: 21.55, type: 'stockade', troops: 10000, region: 'SERBIA', buildingStyle: 'SLAVIC', note: '[14世纪末塞尔维亚局部君主武卡辛与马尔科王子领地首邑普里莱普·花岗岩峰顶马尔科卫城与山脚无墙集镇] 虽奇峰山巅筑有马尔科塔楼（Markovi Kuli）石砌避难卫城，但山脚商业市镇（Varoš）无外郭环城石墙，15–16世纪奥斯曼税册实载普里莱普镇民约3000–5000人<1万，定城寨。' },
    { id: 'city_niani', name: '尼亚尼', factionId: 'manding', lat: 11.4, lng: -8.5, type: 'stockade', troops: 10000, region: 'AFRICA', buildingStyle: 'AFRICA', tier: 4, note: '[13至16世纪西非马里帝国开国雄主松迪亚塔·凯塔推定王都尼亚尼·桑卡拉尼河畔红土泥坯（Banco）无石墙王廷聚落] 波兰—几内亚联合考古队Filipowiak发掘尼亚尼泥坯王宫区与炼铁聚落（学界对马里王都确址尚有争鸣，且遗址为夯土泥坯无石砖城郭），常住人口查无可靠确数，定城寨。' },
    { id: 'city_quito', name: '基多', factionId: 'inca', lat: -0.18, lng: -78.47, type: 'small_city', troops: 10000, region: 'ANDE', buildingStyle: 'INCA', note: '[16世纪初印加北部阿塔瓦尔帕王都至西属皇家听审区首府·安第斯火山石修院棋盘城基多] 印加北方军事都城，1534年贝纳尔卡萨尔重建西属首府，1650–1700年城内西班牙市民与印第安教区常住人口达2.5–3万（Minchom《基多人民史》教会与市政户口考算），>1万定小城。' },
    { id: 'city_oristano', name: '奥里斯塔诺', factionId: 'aboerleiya', lat: 39.9, lng: 8.59, type: 'small_city', isPort: true, troops: 10000, region: 'SICILIANS', buildingStyle: 'SICILIANS', note: '[11至15世纪撒丁岛阿尔博雷亚判官国首都·马里亚诺二世切石高塔环城墙] 埃莱奥诺拉女判官颁《宪章》之都奥里斯塔诺，1290年筑完整石灰岩切石环城墙与28座方塔（圣克里斯托弗石塔现存），中世纪盛期城居约5000–8000人，<1万具完整石墙，定小城。' },
    { id: 'city_jinju', name: '晋州', factionId: 'joseon', lat: 35.19, lng: 128.1, type: 'small_city', troops: 10000, region: 'JOSEON', buildingStyle: 'KOREA', note: '[高丽晋州牧至朝鲜庆尚右道首邑·南江绝壁周4.3公里花岗岩石筑晋州城] 壬辰倭乱万历二十年（1592）金时敏以三千八百兵凭石城大捷、次年第二次晋州城之战《宣祖实录》与日方战报载城破军民死难数万人，具完整巨石城垣且盛期城居逾1.5–3万，定小城。' },
    { id: 'city_xindu', name: '信都', factionId: 'han_d', lat: 37.55, lng: 115.57, type: 'small_city', troops: 10000, region: 'NORTH', buildingStyle: 'WEI', note: '[战国赵信都、西汉信都国安平国、东汉光武发祥任光守信都拒王郎至北魏唐宋冀州·滏阳漳水夯土包砖河北首藩州城] 更始二年刘秀奔信都得太守任光开城精兵四千遂破王郎定河北（《后汉书·光武帝纪》《任光传》），西汉信都国领十七县、北魏冀州户逾十二万，汉魏唐宋州国治城人口达3–5万，>1万定小城。' },
    { id: 'city_hangai', name: '杭爱山', factionId: 'kaerka', lat: 47, lng: 101, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', tier: 4, note: '[匈奴突厥回鹘至17世纪喀尔喀中路三音诺颜部图蒙肯汗裔核心夏牧场杭爱山·鄂尔浑塔米尔河源高山草甸王帐] 漠北水草最丰美之森林草原牧场，清封三音诺颜部盟旗牧地（《蒙古游牧记》卷七），纯毡帐游牧营盘无城郭且单营<1万，定城寨。' },
    { id: 'city_onon', name: '斡难河', factionId: 'zhadalan', lat: 49, lng: 112, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', tier: 4, note: '[12世纪成吉思汗诞生与1206年树九斿白纛即大汗位圣河斡难河（鄂嫩河）·肯特山东麓乞颜与札答兰部河谷毡帐大营] 《元朝秘史》所载铁木真与安答札木合结盟分牧及1206年大忽里勒台建号大蒙古国之斡难河源营地，纯草原毡帐无城垣且平时单营常住<1万，定城寨。' },
    { id: 'city_norwich', name: '诺里奇', factionId: 'danmai', lat: 52.63, lng: 1.3, type: 'small_city', troops: 10000, region: 'ANGLO_SAXON', buildingStyle: 'BRITONS', note: '[诺曼至17世纪仅次伦敦之英格兰第二大城·4公里燧石夹砖十二门环城墙诺里奇] 东盎格利亚毛纺制造之都，1297–1344年建成完整燧石砖砌环城墙，1670–1700年实居人口达2.8–3万（de Vries 1984 p.270及Pound诺里奇炉灶税考证），>1万定小城。' },
    // 🔴 [2026-11-03 主人批准超长陆路增补中间据点]
    { id: 'city_taghaza', name: '塔加扎', factionId: 'mulabite', lat: 23.62, lng: -5.00, type: 'stockade', troops: 10000, region: 'BERBER', buildingStyle: 'BERBER', note: '[11至16世纪西撒哈拉马里桑海盐矿重镇·岩盐块砌屋无城墙矿聚] 1352年伊本·白图泰亲访记塔加扎以岩盐板与骆驼皮筑屋，无树木农田全仰赖商队运粮，常住采盐奴工与监吏仅一二千人且无城垣，定城寨。' },
    { id: 'city_atacama', name: '阿塔卡马', factionId: 'inca', lat: -22.91, lng: -68.20, type: 'pass', troops: 10000, region: 'AMERICA', buildingStyle: 'INCA', note: '[12至16世纪阿塔卡梅尼奥与印加南道期·基托尔红石普卡拉山堡] 筑基托尔（Pukará de Quitor）多层红石干砌山坡堡垣控阿塔卡马沙漠绿洲与印加南征孔道，1540年巴尔迪维亚率西军仰攻夺取此石堡（比瓦尔《智利王国编年史》），石堡要塞且常住<1万，定险要。；🔴 [2026-11-11 补标] 【建筑风格代理】阿塔卡梅尼奥石堡Pukara，取最近INCA' },
    { id: 'city_nicaragua', name: '尼加拉瓜', factionId: 'xibanya', lat: 11.44, lng: -85.83, type: 'stockade', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'SPANISH', note: '[16至17世纪西属尼加拉瓜格拉纳达港镇·尼加拉瓜湖畔土坯木屋无墙市镇] 1524年科尔多瓦建格拉纳达镇，旧注所谓逾万系混入全辖区农村印第安村社（违反城居红线）；16–17世纪本镇无城墙（1665–1685年屡遭海盗徒步焚掠），城居仅约3000–5000人，定城寨。' },
    { id: 'city_mendoza', name: '门多萨', factionId: 'xibanya', lat: -32.89, lng: -68.84, type: 'stockade', troops: 10000, region: 'AMERICA', buildingStyle: 'SPANISH', note: '[16至17世纪西属库约山麓首府·乌斯帕亚塔道口生土泥砖无墙小邑] 1561年建镇控安第斯山东麓通道，17世纪全镇仅数十西班牙市民户合印第安劳役约2000–3000人，生土泥砖民居无石砖城垣，定城寨。' },
    { id: 'city_saopaulo', name: '圣保罗', factionId: 'putaoya', lat: -23.35, lng: -46.85, type: 'stockade', troops: 10000, region: 'AMERICA', buildingStyle: 'PORTUGUESE', note: '[16至17世纪葡属巴西内陆保利斯塔基地·高原夯土泥墙小市镇] 1554年耶稣会建院，17世纪为旗队（Bandeirantes）内陆远征大本营，≤1700年黄金热兴起前镇内常住人口仅约3000–6000人且为夯土泥墙无石砖城郭（Morse《圣保罗城市史》），定城寨。' },
    { id: 'city_sanaa', name: '萨那', factionId: 'ayoubu', lat: 15.35, lng: 44.21, type: 'medium_city', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[希木叶尔古都至阿尤布拉苏里德期·石基生土高楼城垣] 也门高原千年首邑萨那（古姆丹宫故地），阿尤布至拉苏里德及宰德派伊玛目盛期城墙与比尔阿扎卜城区峰值约8–10万（哈姆达尼《阿拉伯半岛志》及Serjeant《萨那：阿拉伯伊斯兰城市》），≥8万定中城。' },
    // 🔴 [2026-11-03 主人批准超长海路增补中转岛屿据点]
    { id: 'city_nanmadol', name: '南马都尔', factionId: 'bolinixiya', lat: 6.84, lng: 158.33, type: 'stockade', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'MALAY', note: '[12至17世纪波纳佩绍德雷尔王朝·珊瑚礁人工岛玄武岩柱祭仪王廷] 以玄武岩六棱石柱垒筑92座人工礁岛平台（UNESCO遗产），实为无外郭城墙之海上贵族祭司礼仪居所，常住仅约500–1000人（Ayres波纳佩考古测算）<1万，定城寨。；🔴 [2026-11-11 补标] 【建筑风格代理】波纳佩玄武岩水上巨石城，取最近南岛MALAY' },
    { id: 'city_bermuda', name: '百慕大', factionId: 'yinggelan', lat: 32.38, lng: -64.68, type: 'stockade', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'BRITONS', note: '[17世纪英属百慕大圣乔治镇·礁岛海岬小石台与无环墙木石小镇] 1609年萨默斯触礁定居、1612年建圣乔治镇，海口散设小型炮台而镇无城墙，1700年全群岛总人口仅约6000人、圣乔治本镇不足1500人，定城寨。' },
    // 🔴 [2026-11-05 主人批准新建] 商路补点第一批（广宁、安市城、布尔戈斯、都灵、埃武拉）
    { id: 'city_guangning', name: '广宁', factionId: 'ming_d', lat: 41.6, lng: 121.8, type: 'small_city', troops: 10000, region: 'WEI', buildingStyle: 'WEI', note: '[明洪武至天启辽东镇总兵巡抚驻城·医巫闾山麓包砖重垣卫城] 洪武二十三年置广宁卫、永乐至成化包砖扩建周十二里五门大城，为辽东巡抚与总兵李成梁驻节首镇，军余商民城居达3–4万（《全辽志》《明史·李成梁传》），>1万定小城。' },
    { id: 'city_anshicheng', name: '安市城', factionId: 'gaogouli', lat: 40.8, lng: 122.75, type: 'small_city', troops: 10000, region: 'KOREA', buildingStyle: 'KOREA', note: '[高句丽晚期辽东核心防城·海城英城子石筑山城邑] 贞观十九年（645）唐太宗亲率大军围攻安市城六十余日不克，《旧唐书·高丽传》《资治通鉴》明载城中精兵与居民数万、城主率众死守石筑城垣，城居逾1万且具石墙，定小城。' },
    { id: 'city_burgos', name: '布尔戈斯', factionId: 'kasidiliya', lat: 42.34, lng: -3.7, type: 'small_city', troops: 10000, region: 'CASTILE', buildingStyle: 'SPANISH', note: '[9至16世纪卡斯蒂利亚旧都与美利奴羊毛商都·石灰岩环城高墙与圣玛利亚门] 884年建城为卡斯蒂利亚早期王都，16世纪上半叶羊毛领事商会鼎盛期石墙城区人口达2–2.7万（Ruiz与de Vries 1550年表2.7万），>1万且具完整石墙，定小城。' },
    { id: 'city_turin', name: '都灵', factionId: 'safuyi', lat: 45.07, lng: 7.69, type: 'small_city', troops: 10000, region: 'ITALIANS', buildingStyle: 'LATIN', note: '[16至17世纪萨伏伊公国首都·砖石五角星形棱堡与巴洛克棋盘都城] 1563年伊曼纽尔·菲利贝托迁都都灵并筑棱堡城墙，1700年（1706年大围城前夕）城内实测人口达4.2万（de Vries 1984 p.276及Symcox《都灵围城考》），>1万定小城。' },
    { id: 'city_evora', name: '埃武拉', factionId: 'putaoya', lat: 38.57, lng: -7.91, type: 'small_city', troops: 10000, region: 'PORTUGUESE', buildingStyle: 'PORTUGUESE', note: '[12至16世纪葡萄牙阿连特茹首府与第二王廷·罗马摩尔双环石墙名城] 1165年无畏者吉拉尔多夜袭夺城，15–16世纪阿维斯王朝常驻王廷，具罗马与中世纪双层花岗岩石墙，1527年葡国人口普查城居约1.3–1.8万，>1万定小城。' },
    // 🔴 [2026-11-05 主人批准新建] 商路补点第二批（埃尔祖鲁姆、巴约讷、桑塔伦、巴达霍斯、潘普洛纳、尼什）
    { id: 'city_erzurum', name: '埃尔祖鲁姆', factionId: 'osman', lat: 39.9, lng: 41.27, type: 'small_city', troops: 10000, region: 'OTTOMAN', buildingStyle: 'TURKS', note: '[拜占庭狄奥多西波利斯至16至17世纪奥斯曼东方大镇·玄武岩双城墙商都] 安纳托利亚东门与波斯丝路税关首府，具拜占庭与奥斯曼玄武岩石墙，17世纪埃夫利亚·切莱比与图尔内福尔实记城居约2.5–4万（Faroqhi《奥斯曼城镇与市民》），>1万定小城。' },
    { id: 'city_bayonne', name: '巴约讷', factionId: 'gaolu', lat: 43.49, lng: -1.47, type: 'small_city', isPort: true, troops: 10000, region: 'FRENCH', buildingStyle: 'FRANKS', note: '[中世纪英属加斯科涅至17世纪沃邦棱堡期·阿杜尔河口石砌双城垣港城] 罗马石墙基址上扩筑中世纪城垣与1680年代沃邦石砌星形棱堡，1700年前城居约1.1–1.5万（de Vries 1984 p.273）且具完整石墙，定小城。' },
    { id: 'city_badajoz', name: '巴达霍斯', factionId: 'kasidiliya', lat: 38.88, lng: -6.97, type: 'small_city', troops: 10000, region: 'CASTILE', buildingStyle: 'SPANISH', note: '[9世纪摩尔泰法王都至17世纪西葡战争·石砖夯土卫城与八棱堡环城墙] 875年伊本·马尔万建城为巴达霍斯泰法都城，1640–1668年葡萄牙王政复古战争增筑完整石砖八棱堡环城墙，16–17世纪城居约1.2–1.5万，定小城。' },
    { id: 'city_pamplona', name: '潘普洛纳', factionId: 'kasidiliya', lat: 42.82, lng: -1.64, type: 'small_city', troops: 10000, region: 'ARAGON', buildingStyle: 'SPANISH', note: '[10至16世纪纳瓦拉王国首都·三区合一石墙与腓力二世五角石棱堡] 纳瓦拉王都潘普洛纳（1521年围城罗耀拉负伤），1571年增筑五角石棱堡与厚重石砌环城墙，16–17世纪城居约1–1.2万且具完整石墙，定小城。' },
    { id: 'city_nis', name: '尼什', factionId: 'saierweiya', lat: 43.32, lng: 21.9, type: 'small_city', troops: 10000, region: 'SERBIA', buildingStyle: 'SLAVIC', note: '[罗马奈苏斯至塞尔维亚与奥斯曼巴尔干要冲·尼沙瓦河石砖城垣重邑] 巴尔干大道咽喉尼什，罗马拜占庭石砖城墙基址，16–17世纪奥斯曼商旅税册与西方使团记城居约1–1.5万且具石砖城防（1809年战事超限不采），定小城。' },
    // 🔴 [2026-11-05 主人批准新建] 商路补点第三批（锡瓦斯、埃尔津詹、梅里达；新势力三家）
    { id: 'city_sivas', name: '锡瓦斯', factionId: 'xiwasi', lat: 39.75, lng: 37.02, type: 'small_city', troops: 10000, region: 'WEST_ASIA_CASTLE', buildingStyle: 'TURKS', note: '[13至14世纪罗姆塞尔柱重都与布尔汉丁苏丹国·切石双层城墙商都] 1221年凯库巴德一世重筑坚固切石城垣，1381–1398年卡迪·布尔汉丁定都，1400年帖木儿破城前城居达3–4万（伊本·阿拉伯沙记述及Faroqhi考算），>1万定小城。' },
    { id: 'city_erzincan', name: '埃尔津詹', factionId: 'mengguqieke', lat: 39.75, lng: 39.49, type: 'small_city', troops: 10000, region: 'WEST_ASIA_CASTLE', buildingStyle: 'TURKS', note: '[12至13世纪门古切克侯国都城至白羊期·幼发拉底上游石墙丝路商邑] 门古切克王朝巴赫拉姆沙治下文化商贸盛期及马可·波罗所记丝银织造名城，具石砌内堡与城墙，13–15世纪城居约1.5–2万，>1万定小城。' },
    { id: 'city_merida', name: '梅里达', factionId: 'womaya', lat: 38.92, lng: -6.34, type: 'small_city', troops: 10000, region: 'ORIE', buildingStyle: 'ORIE', note: '[罗马卢西塔尼亚首府至西哥特后倭马亚期·花岗岩巨石城墙与罗马石桥] 罗马奥古斯塔埃梅里塔盛期城居逾2–3万，9世纪后倭马亚阿卜杜·拉赫曼二世拆罗马巨石增筑伊斯兰石砌阿卡萨巴城垣（868年伊本·马尔万据城），具完整罗马与摩尔石墙，定小城。' },
    // 🔴 [2026-11-05 主人批准新建] 航行港口第四批（鸟羽、奥林达、菲利普王城、雷亚尔港、康塞普西翁）
    { id: 'city_toba', name: '鸟羽', factionId: 'oda', lat: 34.48, lng: 136.84, type: 'stockade', isPort: true, troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[文禄三年九鬼嘉隆水军本据·志摩海湾小石垣海城与渔港聚落] 1594年九鬼嘉隆筑鸟羽水军小城控伊势湾口，江户时代鸟羽藩仅二至三万石小藩，≤1700年城下町狭仄仅约3000–4000人且町区无外郭石墙，定城寨。' },
    { id: 'city_olinda', name: '奥林达', factionId: 'putaoya', lat: -8.01, lng: -34.86, type: 'stockade', isPort: true, troops: 10000, region: 'TUPI', buildingStyle: 'PORTUGUESE', note: '[16至17世纪初葡属伯南布哥首府·海丘土垒栅栏蔗糖商镇] 1537年科埃略建镇，1630年荷兰西印度公司攻占前常住市民与教士奴仆约4000–7000人，因仅设海滩土垒木栅无完整环城石墙故被荷军一举攻入焚毁（Boxer《巴西荷兰人》），<1万定城寨。' },
    { id: 'city_felipe', name: '菲利普王城', factionId: 'xibanya', lat: -53.64, lng: -70.92, type: 'stockade', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'SPANISH', note: '[1584年西属麦哲伦海峡殖民定居点·泥木栅寨饥饿港] 1584年萨米恩托率三百余军民于麦哲伦海峡建泥木栅栏小城菲利普王城，三年内严寒断粮殆尽、1587年卡文迪什名之饥饿港，木栅无墙且人口仅三百余，定城寨。' },
    { id: 'city_realejo', name: '雷亚尔港', factionId: 'xibanya', lat: 12.54, lng: -87.17, type: 'stockade', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'SPANISH', note: '[16至17世纪西属中美洲太平洋造船港·红树林河口木构船厂小镇] 1532年辟港、阿尔瓦拉多太平洋舰队造船地，镇内皆木屋船坞无石砌城墙（1685年遭海盗丹皮尔焚掠），≤1700年常住工匠水手不足3000人，定城寨。' },
    { id: 'city_concepcion', name: '康塞普西翁', factionId: 'xibanya', lat: -36.83, lng: -73.05, type: 'stockade', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'SPANISH', note: '[16至17世纪西属智利阿劳科前线军港·彭科湾木栅土垒边镇] 1550年巴尔迪维亚始建于彭科湾，阿劳科战争中屡遭马普切人攻毁重建，≤1700年仅具木栅土垒防卫且常住军民约2000–4000人<1万，定城寨。' },
    // 🔴 [2026-11-05 主人批准新建] 航行港口第五批（瓜亚基尔、瓦尔迪维亚、下田、索法拉、阿里卡、帕拉帕格）
    { id: 'city_guayaquil', name: '瓜亚基尔', factionId: 'xibanya', lat: -2.19, lng: -79.89, type: 'stockade', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'SPANISH', note: '[16至17世纪西属太平洋皇家造船港·瓜亚斯河高脚木屋无墙港镇] 1538年奥雷利亚纳建镇，全镇以热带硬木与竹材建房且无环城石墙（1687年遭英法海盗攻破勒索），≤1700年常住人口约4000–6000人（Clayton瓜亚基尔船厂史）<1万，定城寨。；1538 年奥雷利亚纳建城并任代理总督（武将自利马移来）' },
    { id: 'city_valdivia', name: '瓦尔迪维亚', factionId: 'xibanya', lat: -39.81, lng: -73.25, type: 'stockade', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'SPANISH', note: '[16至17世纪西属智利南疆河口据点·木栅市镇与河口外岛炮台] 1552年建镇、1599年马普切大起义彻底夷平荒废近五十年，1645年后仅于科拉尔湾口修筑海防炮台守港而内镇常住军民不足2000人，定城寨。' },
    { id: 'city_shimoda', name: '下田', factionId: 'hojo', lat: 34.68, lng: 138.95, type: 'stockade', isPort: true, troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[战国末后北条水军伊豆据点·海岸丘陵土垒空堀海城（下田城）] 天正十八年（1590）清水康英率六百兵据伊豆下田土垒海城抗丰臣一万水军五十日（《北条五代记》），土垒木栅无高石垣且港村人口仅约3000人<1万，定城寨。' },
    { id: 'city_sofala', name: '索法拉', factionId: 'kilwa', lat: -20.18, lng: 34.73, type: 'stockade', isPort: true, troops: 10000, region: 'ETHIOPIANS', buildingStyle: 'ORIE', note: '[10至16世纪斯瓦希里黄金贸易港与葡建小堡·沙洲红树林木石港镇] 基尔瓦苏丹国南端黄金出口港，1505年葡建圣卡埃塔诺小石堡，海岸泥沙侵蚀且镇无环城墙，常住人口约2000–4000人（Newitt《莫桑比克史》）<1万，定城寨。；【建筑风格代理】同基尔瓦；🔴 [2026-11-11 按史改] 据点文化 ETHIOPIANS→ORIE（代理）：斯瓦希里海岸最南伊斯兰黄金贸易港，同基尔瓦' },
    { id: 'city_arica', name: '阿里卡', factionId: 'xibanya', lat: -18.48, lng: -70.31, type: 'stockade', isPort: true, troops: 10000, region: 'AMERICA', buildingStyle: 'SPANISH', note: '[16至17世纪西属秘鲁波托西装银港·干旱海岸土坯无墙小埠] 1541年建埠专司波托西白银下海转运利马，因疟疾与干旱≤1700年常住居民与水手仅约1500–2500人且镇无环城石墙（屡拒海盗仅靠海滩胸墙），定城寨。' },
    { id: 'city_palapag', name: '帕拉帕格', factionId: 'sumuroyi', lat: 12.57, lng: 125, type: 'stockade', isPort: true, troops: 10000, region: 'MALAY', buildingStyle: 'MALAY', note: '[17世纪西属菲律宾萨马岛锚泊港·木石教会围院与高脚木屋村社] 马尼拉大帆船返航首锚地，1649年米沙鄢人苏穆罗伊据山林木栅起事（布莱尔与罗伯逊《菲律宾群岛史料》第38卷），村镇无石城墙且人口不足4000，定城寨。' },
    // 🔴 [2026-11-05 主人批准新建] 航行中转站（昆仑岛、尼科巴）
    { id: 'city_kunlundao', name: '昆仑岛', factionId: 'yuenan', lat: 8.69, lng: 106.61, type: 'stockade', isPort: true, troops: 10000, region: 'HUAXIA_IMPERIAL', buildingStyle: 'VIETNAMESE', note: '[1700年前南海针路候风淡水岛·广南阮氏海岛渔樵小聚落] 英东印度公司筑木栅堡在1702年（且1705年即因兵变焚毁，超1700年红线不采）；≤1700年仅为《顺风相送》所载昆仑山淡水补给小聚落，无墙且常住数百人，定城寨。' },
    { id: 'city_nikoba', name: '尼科巴', factionId: 'danmai', lat: 8.03, lng: 93.53, type: 'stockade', isPort: true, troops: 10000, region: 'MALAY', buildingStyle: 'MALAY', note: '[1700年前孟加拉湾翠蓝屿·无城垣南亚语系岛民椰林村社] 丹麦1756年殖民远超1700年红线不采；≤1700年即义净与马欢《瀛涯胜览》所记翠蓝屿，岛民散居茅屋、无城郭且单村仅数百人，定城寨。' },
    // 🔴 [2026-11-05 主人批准新建] 航行港口第七批（串本）
    { id: 'city_kushimoto', name: '串本', factionId: 'toyotomi', lat: 33.47, lng: 135.78, type: 'stockade', isPort: true, troops: 10000, region: 'JAPAN_IMPERIAL', buildingStyle: 'JAPAN', note: '[战国末熊野水军潮岬锚泊港·纪伊南端无墙候风渔港聚落] 熊野水军首领堀内氏善辖下绕行纪伊潮岬候风良港串本浦（《纪伊续风土记》），无城郭石垣且江户前期渔商人口仅约2000–3000人<1万，定城寨。' },

    { id: 'city_rhandeia', name: '兰德亚', factionId: 'armenia_arsacid', lat: 38.69, lng: 39.93, type: 'pass', troops: 10000, region: 'ARMENIANS', buildingStyle: 'ARMENIANS', note: '塔西佗《编年史》XV.10–15：62年罗马将领派图斯于阿尔萨尼亚斯河畔筑兰德亚营垒受围，系河谷军事关隘要塞，未成万人城，定险要。' },
    { id: 'city_tigranocerta', name: '提格拉诺塞塔', factionId: 'armenia_arsacid', lat: 38.14, lng: 41.0, type: 'medium_city', troops: 10000, region: 'ARMENIANS', buildingStyle: 'ARMENIANS', note: '[前1世纪亚美尼亚帝国·巨石高墙都城] 前77年提格拉尼二世迁希腊与卡帕多西亚居民约30万营建南都（普鲁塔克《卢库鲁斯传》26、阿庇安《米特拉达梯战争史》84），城居峰值逾10万，定中城。' },
    { id: 'city_sunzhong', name: '损中', factionId: 'shule', lat: 39.58, lng: 75.39, type: 'stockade', troops: 10000, region: 'WESTERN_FEUDAL', buildingStyle: 'WESTERN', note: '[东汉西域·夯土军屯小城] 《后汉书·班超传》载疏勒西境损中城，葱岭东麓军屯小邑，城居不足5000且为夯土墙，定城寨。' },
    { id: 'city_lugidunum', name: '卢吉杜努姆', factionId: 'lugii', lat: 51.21, lng: 16.16, type: 'stockade', troops: 10000, region: 'POLES', buildingStyle: 'POLES', note: '[公元1至2世纪日耳曼尼亚卢吉部联盟·奥得河支流木栅土垒部族聚落] 托勒密《地理志》II.11所载日耳曼东部卢吉人聚落（琥珀之路节点），为早期原木栅栏与土垒部族寨聚，查无人口数字且无石砖墙，定城寨。' },
    { id: 'city_marisia', name: '马里西亚', factionId: 'gepids', lat: 46.18, lng: 21.31, type: 'stockade', troops: 10000, region: 'GOTHS', buildingStyle: 'GOTHS', note: '[3至5世纪哥特与革皮德争霸期·穆列什河流域部族木栅营寨] 约达尼斯《哥特史》22载马里西亚河畔革皮德与哥特部族聚居营寨，属迁徙期木构村寨无石砖城垣且人口<1万，定城寨。' },
    { id: 'city_clavenna', name: '克拉文纳', factionId: 'luoma_diguo', lat: 46.32, lng: 9.4, type: 'stockade', troops: 10000, region: 'ROMA', buildingStyle: 'ROMA', note: '[罗马帝国阿尔卑斯南麓·梅拉河谷无墙驿站村镇（维库斯）] 《安东尼行纪》与《波伊廷格古图》所载基亚文纳（Clavenna）系罗马分叉山道补给驿村，名字不带关隘堡戍且罗马时代无石砖关塞城垣（中世纪石墙属后代），人口不足3000，定城寨。' },
    { id: 'city_wolgast', name: '沃尔加斯特', factionId: 'meikelunbao', lat: 54.05, lng: 13.77, type: 'stockade', troops: 10000, region: 'SLAVIC', buildingStyle: 'SLAVIC', note: '[8至12世纪西斯拉夫文德人期·佩内河口木栅土垒神庙堡寨] 萨克索《丹麦人史》XIV载丹麦王瓦尔德马一世征讨佩内河口文德人木土神庙寨堡沃尔加斯特，木栅土垒不算石砖墙且城居不足5000，定城寨。' },
    { id: 'city_kamba', name: '坎普堡', factionId: 'awaer', lat: 48.4, lng: 15.7, type: 'stockade', troops: 10000, region: 'HUNS', buildingStyle: 'HUNS', note: '[8世纪末法兰克征阿瓦尔期·坎普河口双排原木填土环寨] 《法兰克王家年代记》791年条与艾因哈德《查理大帝传》13章明载阿瓦尔西境防线以双排橡木山毛榉树干夹填泥石筑木栅环垒；木栅土垒按规不算正式城墙，未成万人城，定城寨。' },
    { id: 'city_canburg', name: '卡努尔格', factionId: 'boximiya', lat: 50.37, lng: 13.79, type: 'stockade', troops: 10000, region: 'BOHEMIANS', buildingStyle: 'BOHEMIANS', note: '[9世纪初早期波希米亚斯拉夫部族·奥赫热河高地木土丘堡] 《莫瓦萨克编年史》805年条载查理曼之子小查理围攻波希米亚斯拉夫人木土丘堡卡努尔格（Canburg），原木夹土寨垣非石砖墙且人口<1万，定城寨。' },
    { id: 'city_dingkou', name: '鼎口寨', factionId: 'zhongxiang', lat: 29.15, lng: 112.65, type: 'stockade', troops: 10000, region: 'JIANGNAN', buildingStyle: 'HUGUANG', note: '[南宋绍兴洞庭钟相杨幺起义·沅澧入湖口巨木水寨群] 李心传《建炎以来系年要录》绍兴五年载杨幺于洞庭鼎口立木栅水寨屯车船抗岳飞，纯木栅水寨无石砖城郭且非常设万人居民城，定城寨。' },
    { id: 'city_saerdulu', name: '撒儿都鲁', factionId: 'yuan_d', lat: 43.85, lng: 120.55, type: 'stockade', troops: 10000, region: 'STEPPE', buildingStyle: 'MONGOL', note: '[元至元二十四年辽东宗王乃颜之乱·西拉木伦河畔毡帐驻冬大营] 《元史·世祖纪》至元二十四年载忽必烈亲征辽东斡赤斤后王乃颜于撒儿都鲁之地，系草原游牧宗王毡帐驻营无城郭且常住<1万，定城寨。' },
    { id: 'city_guikushan', name: '鬼哭山', factionId: 'luchuan', lat: 24.85, lng: 96.82, type: 'stockade', troops: 10000, region: 'BURMESE', buildingStyle: 'BURMESE', note: '[明正统麓川之役·山巅木栅营寨] 《明史·王骥传》载正统十三年麓川思陆发据孟养鬼哭山立木栅大寨；木栅不算墙且名不带关隘堡戍，非正式关塞，人口<1万，定城寨。' },
    { id: 'city_orenburg', name: '奥伦堡', factionId: 'eluosi_diguo', lat: 51.77, lng: 55.1, type: 'stockade', troops: 10000, region: 'SLAVIC', buildingStyle: 'SLAVIC', note: '[1700年前乌拉尔河中游巴什基尔草原·无城垣游牧河滩] 俄国奥伦堡石砖棱堡始建于1743年（违反≤1700年红线，18世纪中后期人口与城墙一概不采）；≤1700年乌拉尔河该处仅为巴什基尔与哈萨克游牧渡滩，无城墙无万人聚落，定城寨。' },
    { id: 'city_vellica', name: '韦利卡', factionId: 'cantabri', lat: 42.79, lng: -4.27, type: 'stockade', troops: 10000, region: 'SPANISH', buildingStyle: 'CELTS', note: '[前1世纪罗马坎塔布里亚战争·伊比利亚北麓山地干石木栅部族主寨] 弗罗鲁斯《罗马史纲》II.33载前25年奥古斯都亲征于韦利卡山寨下击破坎塔布里人，系铁器时代山地部族丘寨而非石墙城市，人口<1万，定城寨。' },
].map((city): CityDataV2 => { const base = city as CityDataV2; return HUGUANG_CITY_IDS.has(base.id) ? { ...base, buildingStyle: 'HUGUANG' as const } : base; });
// ── 14 文化区（RegionType）────────────────────────────────
// region: 'JAPAN',         // 日本
// region: 'KOREA',         // 朝鲜
// region: 'NORTHEAST',     // 东北
// region: 'STEPPE',        // 草原
// region: 'WESTERN',       // 西域
// region: 'CENTRAL_ASIA',  // 中亚
// region: 'TIBET',         // 青藏
// region:      // 滇缅
// region:       // 岭南
// region:         // 川蜀
// region: 'CENTRAL',          // 河西
// region: 'CENTRAL',         // 北方
// region: 'CENTRAL',       // 中原
// region: 'JIANGNAN',      // 南方



