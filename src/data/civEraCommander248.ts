/**
 * 62 文明 × 4 时代 = 248 类主将兵模映射体系
 * 🔴 [2026-10-05 主人定]
 *   公分 59+3，共 62 种文明。4 个时代：古典、封建、城堡、帝王，共 248 种。
 *   - 古典时代：起始 – 公元 400 年
 *   - 封建时代：公元 400 年 – 公元 1050 年
 *   - 城堡时代：公元 1050 年 – 公元 1500 年
 *   - 帝王时代：公元 1500 年 – 公元 1900 年
 *
 * 铁律：
 *   1. 先套已有英雄兵模（符合历史年代与文明归属）。
 *   2. 其他时代没有英雄的，套用该文明该时代的精锐兵模、高级兵模或重装兵模。
 */

import { GENERAL_ERA, type GeneralEra } from './GeneralEra';
import { getFactionIdOfGeneral } from './FactionGenerals';
import { CITIES_V2 } from './cities_v2';
import { REGION_TO_DE_STYLE } from '../systems/cityDeStyle';

export interface CivEraCommanderEntry {
    civKey: string;
    civName: string;
    deStyle: string;
    antiquity: string; // 古典 (起始-400)
    feudal: string;    // 封建 (400-1050)
    castle: string;    // 城堡 (1050-1500)
    imperial: string;  // 帝王 (1500-1900)
}

export const CIV_ERA_COMMANDER_248: Record<string, CivEraCommanderEntry> = {
    // ── 1. 东亚 ASIA (9) ──
    JAPAN: {
        civKey: 'JAPAN', civName: '日本', deStyle: 'ASIA',
        antiquity: 'jian_swordsman',      // 古坟/弥生时代直刀剑士
        feudal: 'samurai',               // 平安/源平武士
        castle: 'samurai_elite',         // 室町幕府精锐武士
        imperial: 'ninja',               // 战国/江户隐秘死士/忍者
    },
    CENTRAL: {
        civKey: 'CENTRAL', civName: '华夏中原', deStyle: 'ASIA',
        antiquity: 'hero_lubu',          // 吕布 / 汉代甲骑
        feudal: 'paladin',               // 隋唐玄甲重骑兵
        castle: 'elite_fire_lancer',     // 两宋精锐火矛手
        imperial: 'elite_iron_pagoda',   // 明清重甲铁骑
    },
    WEI: {
        civKey: 'WEI', civName: '河朔', deStyle: 'ASIA',
        antiquity: 'hero_caocao',        // 魏武帝曹操
        feudal: 'elite_tiger_cavalry',   // 虎豹骑精锐
        castle: 'heavy_cavalry',         // 幽燕重骑兵
        imperial: 'elite_iron_pagoda',   // 河朔重甲骑兵
    },
    JIANGNAN: {
        civKey: 'JIANGNAN', civName: '江南', deStyle: 'ASIA',
        antiquity: 'hero_sunquan',       // 吴大帝孙权
        feudal: 'elite_fire_archer',     // 江南火弩/火箭手
        castle: 'fire_archer',           // 南宋楼船水军火箭
        imperial: 'elite_fire_archer',   // 明代水陆神机火箭
    },
    BASHU: {
        civKey: 'BASHU', civName: '巴蜀', deStyle: 'ASIA',
        antiquity: 'hero_zhugeliang',    // 蜀汉丞相诸葛亮
        feudal: 'elite_white_feather_guard', // 白毦近卫精锐
        castle: 'elite_chukonu',         // 诸葛弩精锐
        imperial: 'chukonu',             // 蜀地连弩卫队
    },
    KHITAN: {
        civKey: 'KHITAN', civName: '河西/契丹', deStyle: 'ASIA',
        antiquity: 'scythian_horse_archer', // 早期草原弓骑
        feudal: 'elite_liao_dao',        // 辽国精锐鹘鹰刀手
        castle: 'hero_girgenkhan',       // 西辽德宗耶律大石(吉尔根汗)
        imperial: 'hei_kuang_heavy',     // 西北重装铁骑
    },
    NORTHEAST: {
        civKey: 'NORTHEAST', civName: '东北/女真', deStyle: 'ASIA',
        antiquity: 'xianbei_raider',     // 肃慎/挹娄/鲜卑突骑
        feudal: 'iron_pagoda',           // 早期渤海/生女真重铠
        castle: 'elite_iron_pagoda',     // 大金精锐铁浮屠
        imperial: 'kipchak',             // 八旗重射精骑
    },
    MONGOL: {
        civKey: 'MONGOL', civName: '鲜卑漠南', deStyle: 'ASIA',
        antiquity: 'xianbei_raider',     // 鲜卑重装突骑
        feudal: 'antiquity_heavy_cavalry_archer', // 突厥/回纥重装弓骑
        castle: 'hero_khan',             // 大蒙古国成吉思汗
        imperial: 'mangudai_elite',      // 精锐蒙古突骑
    },
    KOREA: {
        civKey: 'KOREA', civName: '高丽/朝鲜', deStyle: 'ASIA',
        antiquity: 'jian_swordsman',      // 三国早期铁剑勇士
        feudal: 'fire_archer',           // 新罗/高丽火箭卫队
        castle: 'elite_war_wagon',       // 高丽精锐战车
        imperial: 'elite_war_wagon',     // 朝鲜火车战车
    },

    // ── 2. 西欧 WEST (7) ──
    GERMANIC: {
        civKey: 'GERMANIC', civName: '条顿', deStyle: 'WEST',
        antiquity: 'huskarl',            // 日耳曼重装勇士
        feudal: 'cavalier',              // 早期重装条顿骑兵
        castle: 'hero_ulrichvonjungingen', // 条顿骑士团大团长容金根
        imperial: 'elite_teutonic_knight', // 精锐条顿骑士
    },
    FRANKS: {
        civKey: 'FRANKS', civName: '法兰克', deStyle: 'WEST',
        antiquity: 'throwing_axeman',    // 萨利安法兰西掷斧手
        feudal: 'paladin',               // 查理曼加洛林圣骑士
        castle: 'hero_joanofarc',        // 奥尔良少女圣女贞德
        imperial: 'elite_throwing_axeman', // 精锐近卫重装投斧兵
    },
    BURGUNDIANS: {
        civKey: 'BURGUNDIANS', civName: '勃艮第', deStyle: 'WEST',
        antiquity: 'coustillier',        // 早期低地长枪散兵
        feudal: 'elite_coustillier',     // 精锐轻装骑兵
        castle: 'hero_johnthefearless',  // 勃艮第公爵无畏的约翰
        imperial: 'flemish_pikeman_f',   // 佛兰德精锐长矛卫队
    },
    BRITONS: {
        civKey: 'BRITONS', civName: '不列颠', deStyle: 'WEST',
        antiquity: 'longbowman',         // 古罗马时代不列颠弓手
        feudal: 'longbowman_elite',      // 诺曼征服精锐长弓
        castle: 'hero_edwardlongshanks', // 英国国王长腿爱德华
        imperial: 'cavalier',            // 近代重装骑士
    },
    CELTS: {
        civKey: 'CELTS', civName: '凯尔特', deStyle: 'WEST',
        antiquity: 'elite_woad_raider',  // 罗马时期精锐菘蓝突袭者
        feudal: 'woad_raider',           // 爱尔兰/苏格兰盖尔勇士
        castle: 'hero_williamwallace',   // 苏格兰护国主威廉·华莱士
        imperial: 'longbowman_elite',    // 高地精锐射手
    },
    VIKINGS: {
        civKey: 'VIKINGS', civName: '维京', deStyle: 'WEST',
        antiquity: 'berserk',            // 早期诺斯狂战士
        feudal: 'elite_berserk',         // 维京大扩张精锐狂战士
        castle: 'jarl',                  // 诺斯长屋首领卫队
        imperial: 'elite_berserk',       // 斯堪的纳维亚皇家卫士
    },
    GOTHS: {
        civKey: 'GOTHS', civName: '哥特', deStyle: 'WEST',
        antiquity: 'hero_alaric',        // 西哥特首王亚拉里克一世
        feudal: 'hero_ataulf',           // 西哥特国王阿陶尔夫
        castle: 'elite_huskarl',         // 精锐近卫军盾牌重步兵
        imperial: 'cav_archer_heavy',    // 晚期重装骑射卫士
    },

    // ── 3. 东南欧 EAST (3) ──
    BYZANTINE: {
        civKey: 'BYZANTINE', civName: '拜占庭', deStyle: 'EAST',
        antiquity: 'cataphract',         // 罗马古典铁甲圣骑兵
        feudal: 'hero_basileus',         // 东罗马皇帝巴西尔二世
        castle: 'elite_cataphract',      // 精锐拜占庭圣骑兵
        imperial: 'cretan_archer',       // 帝国精锐克里特重弓
    },
    ARMENIANS: {
        civKey: 'ARMENIANS', civName: '亚美尼亚', deStyle: 'EAST',
        antiquity: 'composite_bowman',   // 高加索古典复合弓兵
        feudal: 'warrior_priest',        // 埃奇米阿津战斗僧侣
        castle: 'hero_thoros',           // 奇里乞亚亚美尼亚索罗斯二世
        imperial: 'elite_composite_bowman', // 精锐复合弓重装兵
    },
    GEORGIANS: {
        civKey: 'GEORGIANS', civName: '格鲁吉亚', deStyle: 'EAST',
        antiquity: 'composite_bowman',   // 伊比利亚王国古典弓手
        feudal: 'monaspa',               // 高加索莫纳斯帕重骑兵
        castle: 'hero_tamar',            // 格鲁吉亚黄金时代塔玛尔女王
        imperial: 'elite_monaspa',       // 精锐莫纳斯帕具装骑兵
    },

    // ── 4. 东北欧 SLAV (6) ──
    POLES: {
        civKey: 'POLES', civName: '波兰', deStyle: 'SLAV',
        antiquity: 'obuch',              // 西斯拉夫重装战锤兵
        feudal: 'elite_obuch',           // 皮雅斯特精锐奥布奇战锤
        castle: 'hero_jadwiga',          // 波兰第一位女性君主雅德维加女王
        imperial: 'winged_hussar',       // 帝国时代波兰精锐翼骑兵
    },
    BOHEMIANS: {
        civKey: 'BOHEMIANS', civName: '波希米亚', deStyle: 'SLAV',
        antiquity: 'heavy_pikeman',      // 中欧古典重装长枪兵
        feudal: 'arbalest',              // 强弩重步兵
        castle: 'hero_janzizka',         // 独眼统帅扬·杰式卡
        imperial: 'elite_hussite_wagon', // 精锐胡斯装甲战车
    },
    MAGYAR: {
        civKey: 'MAGYAR', civName: '马扎尔', deStyle: 'SLAV',
        antiquity: 'magyar_huszar',      // 潘诺尼亚早期骠骑
        feudal: 'elite_magyar_huszar',   // 阿尔帕德精锐马扎尔骠骑
        castle: 'hero_vladdracula',      // 龙之子弗拉德三世·德古拉
        imperial: 'hussite_wagon',       // 匈牙利重装黑军车垒
    },
    SLAVIC: {
        civKey: 'SLAVIC', civName: '斯拉夫', deStyle: 'SLAV',
        antiquity: 'recurve_bowman',     // 早期东斯拉夫反曲弓兵
        feudal: 'boyar',                 // 基辅罗斯波雅尔贵族铁骑
        castle: 'elite_boyar',           // 精锐波雅尔重装骑兵
        imperial: 'elite_boyar',         // 莫斯科大公国亲卫禁骑
    },
    LITHUANIANS: {
        civKey: 'LITHUANIANS', civName: '立陶宛', deStyle: 'SLAV',
        antiquity: 'leitis',             // 波罗的海早期亲卫骑兵
        feudal: 'elite_leitis',          // 精锐雷蒂斯皇家铁骑
        castle: 'hero_vytautasthegreat', // 立陶宛维陶塔斯大帝
        imperial: 'winged_hussar',       // 联邦精锐翼骑兵
    },
    BULGARIANS: {
        civKey: 'BULGARIANS', civName: '保加利亚', deStyle: 'SLAV',
        antiquity: 'elite_peltast',      // 早期色雷斯标枪勇士
        feudal: 'konnik',                // 保加利亚康尼克骑兵
        castle: 'hero_ivaylo',           // 保加利亚沙皇起义领袖伊瓦伊洛
        imperial: 'elite_konnik',        // 精锐康尼克重甲铁骑
    },

    // ── 5. 地中海 MEDI (5) ──
    LATIN: {
        civKey: 'LATIN', civName: '意大利', deStyle: 'MEDI',
        antiquity: 'centurion',          // 意大利同盟百夫长
        feudal: 'condottiero',           // 中世纪城邦雇佣军长
        castle: 'hero_sforza',           // 米兰公爵弗朗切斯科·斯福尔扎
        imperial: 'elite_genoese_crossbowman', // 热那亚精锐重弩兵
    },
    ROMA: {
        civKey: 'ROMA', civName: '罗马', deStyle: 'MEDI',
        antiquity: 'elite_centurion',    // 古典罗马精锐百夫长
        feudal: 'legionary',             // 罗马军团方阵卫队
        castle: 'centurion',             // 中世纪罗马重步兵长
        imperial: 'legionary',           // 罗马禁卫军方阵
    },
    SICILIANS: {
        civKey: 'SICILIANS', civName: '西西里', deStyle: 'MEDI',
        antiquity: 'serjeant',           // 南意古典重装步兵
        feudal: 'elite_serjeant',        // 诺曼萨金特精锐步兵
        castle: 'hero_bohemond',         // 安条克亲王十字军名将博希蒙德
        imperial: 'crusader_knight',     // 圣殿十字军重甲骑士
    },
    SPANISH: {
        civKey: 'SPANISH', civName: '西班牙', deStyle: 'MEDI',
        antiquity: 'heavy_pikeman',      // 伊比利亚重装方阵长枪兵
        feudal: 'conquistador',          // 收复失地骑士
        castle: 'conquistador',          // 卡斯蒂利亚征服者骑士
        imperial: 'elite_conquistador',  // 精锐西班牙火枪征服者
    },
    PORTUGUESE: {
        civKey: 'PORTUGUESE', civName: '葡萄牙', deStyle: 'MEDI',
        antiquity: 'heavy_pikeman',      // 卢西塔尼亚重装枪兵
        feudal: 'organ_gun',             // 早期城寨防御火炮
        castle: 'organ_gun',             // 葡萄牙海堡手风琴炮
        imperial: 'elite_organ_gun',     // 精锐手风琴连发火炮
    },

    // ── 6. 中东 ORIE (1) ──
    ORIE: {
        civKey: 'ORIE', civName: '萨拉森', deStyle: 'ORIE',
        antiquity: 'camel_heavy',        // 贝都因重装骆驼铁骑
        feudal: 'mameluke',              // 倭马亚/阿拔斯马穆鲁克
        castle: 'elite_mameluke',        // 萨拉丁阿尤布精锐马穆鲁克
        imperial: 'elite_mameluke',      // 马穆鲁克弯刀近卫军
    },

    // ── 7. 中亚草原 CEAS (4) ──
    HUNS: {
        civKey: 'HUNS', civName: '匈人', deStyle: 'CEAS',
        antiquity: 'antiquity_heavy_cavalry_archer', // 早期草原重装弓骑
        feudal: 'hero_attila',           // 上帝之鞭阿提拉
        castle: 'elite_tarkan',          // 精锐答剌罕火炬重骑兵
        imperial: 'tarkan',              // 游牧重装破城骑兵
    },
    CUMAN: {
        civKey: 'CUMAN', civName: '库曼', deStyle: 'CEAS',
        antiquity: 'kipchak',            // 黑海北岸钦察弓骑
        feudal: 'elite_steppe_lancer',   // 精锐草原标枪骑兵
        castle: 'hero_kotyankhan',       // 库曼首领忽炭汗
        imperial: 'elite_kipchak',       // 精锐连发钦察弓骑兵
    },
    TURKS: {
        civKey: 'TURKS', civName: '奥斯曼/突厥', deStyle: 'CEAS',
        antiquity: 'light_cavalry',      // 早期阿尔泰突厥轻骑
        feudal: 'janissary',             // 塞尔柱近卫步兵
        castle: 'hero_osman',            // 奥斯曼帝国奠基人奥斯曼一世
        imperial: 'elite_janissary',     // 精锐苏丹亲兵火枪卫队
    },
    CENTRAL_ASIA: {
        civKey: 'CENTRAL_ASIA', civName: '鞑靼', deStyle: 'CEAS',
        antiquity: 'keshik',             // 昭武九姓/突厥侍卫骑兵
        feudal: 'elite_keshik',          // 喀喇汗精锐怯薛重骑
        castle: 'hero_kushluk',          // 乃蛮部首领屈出律
        imperial: 'mangudai_elite',      // 帖木儿帝国精锐弓骑
    },

    // ── 8. 印度次大陆 INDI (4) ──
    INDIA: {
        civKey: 'INDIA', civName: '达罗毗荼', deStyle: 'INDI',
        antiquity: 'urumi_swordsman',    // 喀拉拉软剑死士
        feudal: 'hero_rajendrachola',    // 朱罗王朝罗贞陀罗一世
        castle: 'hero_generalaraiyan',   // 朱罗帝国名将阿拉扬元帅
        imperial: 'elite_ratha_melee',   // 精锐近战双相战车
    },
    MUGHAL: {
        civKey: 'MUGHAL', civName: '印度斯坦', deStyle: 'INDI',
        antiquity: 'ghulam',             // 早期北印度重装侍卫
        feudal: 'elite_ghulam',          // 德里苏丹精锐古拉姆奴隶卫士
        castle: 'imperial_camel_rider',  // 莫卧儿帝国重装骆驼骑兵
        imperial: 'imperial_camel_rider', // 帝国近卫骆驼火绳铳骑兵
    },
    BENGALIS: {
        civKey: 'BENGALIS', civName: '孟加拉', deStyle: 'INDI',
        antiquity: 'elite_ratha_ranged', // 恒河三角洲精锐双相战车
        feudal: 'indian_tribesman',      // 波罗王朝丛林勇士
        castle: 'imperial_skirmisher',   // 孟加拉重装散兵卫队
        imperial: 'elite_ratha_ranged',  // 纳瓦卜重装战车战队
    },
    GURJARAS: {
        civKey: 'GURJARAS', civName: '瞿折罗', deStyle: 'INDI',
        antiquity: 'chakram_thrower',    // 索拉什特拉战轮手
        feudal: 'elite_shrivamsha_rider', // 普拉蒂哈拉精锐施里瓦姆沙骑兵
        castle: 'hero_prithviraj',       // 恰哈马纳王朝末代英雄普里特维拉吉
        imperial: 'elite_chakram_thrower', // 精锐高速战轮勇士
    },

    // ── 9. 普鲁 PURU (1) ──
    PURU: {
        civKey: 'PURU', civName: '普鲁', deStyle: 'PURU',
        antiquity: 'porus_elephant',     // 旁遮普国王波鲁斯王御驾战象
        feudal: 'elite_sannahya',        // 笈多帝国精锐具装甲士
        castle: 'pattiyoda_longbowman',  // 印度次大陆长弓手
        imperial: 'elite_pattiyoda_longbowman', // 精锐长弓亲卫队
    },

    // ── 10. 东南亚 SEAS (4) ──
    KHMER: {
        civKey: 'KHMER', civName: '高棉', deStyle: 'SEAS',
        antiquity: 'spearman',           // 早期扶南重装矛兵
        feudal: 'ballista_elephant',     // 真腊巨型攻城弩象
        castle: 'elite_ballista_elephant', // 吴哥帝国精锐双弩重装战象
        imperial: 'elite_ballista_elephant', // 高棉御卫弩象兵
    },
    BURMESE: {
        civKey: 'BURMESE', civName: '缅甸', deStyle: 'SEAS',
        antiquity: 'arambai',            // 骠国早期飞镖骑手
        feudal: 'elite_arambai',         // 蒲甘王朝精锐阿兰拜飞镖骑兵
        castle: 'elite_battle_elephant', // 勃固精锐重装战象
        imperial: 'bayinnaung_elephant', // 东吁帝国莽应龙大帝御驾战象
    },
    VIETNAMESE: {
        civKey: 'VIETNAMESE', civName: '越南', deStyle: 'SEAS',
        antiquity: 'rattan_archer',      // 雒越/交趾藤甲弓手
        feudal: 'elite_battle_elephant', // 征氏姐妹/李朝重装战象
        castle: 'hero_leloi',            // 蓝山起义后黎朝开国太祖黎利
        imperial: 'rattan_archer_elite', // 阮朝精锐金吾藤甲弓兵
    },
    MALAY: {
        civKey: 'MALAY', civName: '马来', deStyle: 'SEAS',
        antiquity: 'karambit_warrior',   // 早期群岛爪刀勇士
        feudal: 'elite_battle_elephant', // 三佛齐王国重装战象
        castle: 'hero_gajahmada',        // 满者伯夷帝国宰相加查·马达
        imperial: 'karambit_warrior_elite', // 精锐双持爪刀近卫死士
    },

    // ── 11. 中美洲 MESO (2) ──
    MAYANS: {
        civKey: 'MAYANS', civName: '玛雅', deStyle: 'MESO',
        antiquity: 'plumed_archer',      // 提卡尔阶梯金字塔羽箭手
        feudal: 'elite_plumed_archer',   // 精锐黑曜石羽箭卫士
        castle: 'elite_eagle_warrior',   // 玛雅潘精锐鹰勇士
        imperial: 'elite_plumed_archer', // 奇琴伊察精锐近卫神射手
    },
    AMERICA: {
        civKey: 'AMERICA', civName: '阿兹特克', deStyle: 'MESO',
        antiquity: 'xolotl_warrior',     // 特奥蒂瓦坎修洛特尔勇士
        feudal: 'jaguar_warrior',        // 托尔特克美洲豹勇士
        castle: 'elite_jaguar_warrior',  // 特诺奇蒂特兰精锐豹勇士
        imperial: 'elite_jaguar_warrior', // 阿兹特克帝国三皇禁卫豹勇士
    },

    // ── 12. 安第斯南美 ANDE (4) ──
    INCA: {
        civKey: 'INCA', civName: '印加', deStyle: 'ANDE',
        antiquity: 'champi_runner',      // 莫切文化双头斧信使
        feudal: 'kamayuk',               // 瓦里长枪手
        castle: 'hero_pachacuti',        // 印加帝国缔造者帕查库蒂
        imperial: 'elite_kamayuk',       // 精锐卡马约克长矛方阵
    },
    MUISCA: {
        civKey: 'MUISCA', civName: '穆伊斯卡', deStyle: 'ANDE',
        antiquity: 'guecha_warrior',     // 昆迪纳马卡高原格查战士
        feudal: 'elite_guecha_warrior',  // 精锐黑曜石飞标战士
        castle: 'elite_temple_guard',    // 黄金湖精锐神庙守卫
        imperial: 'hero_pacanchique',    // 齐布查抗殖勇士帕坎奇克
    },
    MAPUCHE: {
        civKey: 'MAPUCHE', civName: '马普切', deStyle: 'ANDE',
        antiquity: 'kona',               // 阿劳卡尼亚大地勇士
        feudal: 'elite_kona',            // 精锐托基战士
        castle: 'elite_bolas_rider',     // 精锐套索石飞掷骑兵
        imperial: 'hero_lautaro',        // 阿劳卡尼亚战争民族领袖劳塔罗
    },
    TUPI: {
        civKey: 'TUPI', civName: '图皮', deStyle: 'ANDE',
        antiquity: 'blackwood_archer',   // 亚马逊黑木大弓手
        feudal: 'elite_blackwood_archer', // 精锐丛林毒箭神射手
        castle: 'elite_ibirapema_warrior', // 精锐伊比拉佩马硬木重战棍兵
        imperial: 'hero_arariboiamelee', // 特米米诺酋长近战英雄阿拉里博亚
    },

    // ── 13. 非洲 AFRI (3) ──
    BERBER: {
        civKey: 'BERBER', civName: '柏柏尔', deStyle: 'AFRI',
        antiquity: 'genitour',           // 古典努米底亚标枪轻骑
        feudal: 'hero_tariqibnziyad',    // 征服伊比利亚之统帅塔里克·伊本·齐亚德
        castle: 'camel_archer',          // 穆拉比特骆驼重装弓骑
        imperial: 'elite_camel_archer',  // 穆瓦希德精锐骆驼火弩骑兵
    },
    AFRICA: {
        civKey: 'AFRICA', civName: '马里', deStyle: 'AFRI',
        antiquity: 'camel_raider',       // 早期跨撒哈拉骆驼突袭者
        feudal: 'gbeto',                 // 达荷美/曼丁哥飞刀女兵
        castle: 'hero_sundjata',         // 马里帝国狮王奠基人松迪亚塔
        imperial: 'elite_gbeto',         // 精锐飞刀近卫近身死士
    },
    ETHIOPIANS: {
        civKey: 'ETHIOPIANS', civName: '埃塞俄比亚', deStyle: 'AFRI',
        antiquity: 'shotel_warrior',     // 阿克苏姆帝国双曲弯刀勇士
        feudal: 'dagnajan_elephant',     // 阿克苏姆末代君王达格纳詹御驾战象
        castle: 'elite_shotel_warrior',  // 扎格维王朝精锐弯刀近卫军
        imperial: 'elite_camel_archer',  // 红海沿岸精锐火铳骆驼兵
    },

    // ── 14. 波斯 PERSIAN (2) ──
    SASANIAN: {
        civKey: 'SASANIAN', civName: '波斯萨珊', deStyle: 'PERSIAN',
        antiquity: 'sparabara',          // 萨珊早期重步兵盾牌手
        feudal: 'elite_war_elephant',    // 萨珊帝国精锐装甲战象
        castle: 'imperial_cavalry',      // 泰西封皇家禁卫铁甲骑兵
        imperial: 'hero_shahismail',     // 萨非王朝缔造者伊斯玛仪一世
    },
    PERSIAN: {
        civKey: 'PERSIAN', civName: '阿契美尼德', deStyle: 'PERSIAN',
        antiquity: 'hero_artaphernes',   // 阿契美尼德帝国萨迪斯总督阿尔塔弗涅斯
        feudal: 'immortal',              // 万王之王近卫万骑不死军
        castle: 'elite_immortal',        // 精锐波斯金枪不死军
        imperial: 'war_elephant',        // 帝国中枢御前重装战象
    },

    // ── 15. 希腊古典 GREEK (3) ──
    ATHENIANS: {
        civKey: 'ATHENIANS', civName: '雅典', deStyle: 'GREEK',
        antiquity: 'hero_aristides',     // 雅典正义者阿里斯提德将军
        feudal: 'strategos',             // 提洛同盟军团将军亲卫
        castle: 'elite_strategos',       // 精锐重装战术将军队
        imperial: 'elite_greek_cavalry', // 精锐希腊近卫骑兵
    },
    SPARTANS: {
        civKey: 'SPARTANS', civName: '斯巴达', deStyle: 'GREEK',
        antiquity: 'hero_brasidas',      // 伯罗奔尼撒战争斯巴达名将布拉西达斯
        feudal: 'hippeus',               // 斯巴达三百骑士方阵
        castle: 'elite_hippeus',         // 精锐斯巴达王家重骑兵
        imperial: 'paragon',             // 斯巴达至尊精锐重铠甲士
    },
    MACEDONIAN: {
        civKey: 'MACEDONIAN', civName: '马其顿', deStyle: 'GREEK',
        antiquity: 'hero_mounted_alexander', // 伙伴骑兵之锋骑马亚历山大大帝
        feudal: 'companion_cavalry',     // 伙伴骑兵方阵矛头
        castle: 'elite_companion_cavalry', // 精锐伙伴骑兵
        imperial: 'elite_phalangite',    // 萨里沙长矛精锐方阵兵
    },

    // ── 16. 色雷斯古典 THRACIAN (1) ──
    THRACIAN: {
        civKey: 'THRACIAN', civName: '色雷斯', deStyle: 'THRACIAN',
        antiquity: 'hero_thracian_chieftain', // 奥德里西亚国王色雷斯酋长塞乌特斯三世
        feudal: 'rhomphaia_warrior',     // 罗多彼山色雷斯双刃长刀手
        castle: 'elite_rhomphaia_warrior', // 精锐色雷斯重斩马刀勇士
        imperial: 'elite_peltast',       // 精锐色雷斯重装轻步标枪手
    },

    // ── 17. 三级自建专属 (3) ──
    TIBET: {
        civKey: 'TIBET', civName: '吐蕃', deStyle: 'PURU',
        antiquity: 'hei_kuang',          // 青藏高原早期黑光铁甲骑士
        feudal: 'tarkan',                // 吐蕃赞普精锐拓跋/突骑
        castle: 'hei_kuang_heavy',       // 吐蕃帝国精锐黑光铠甲骑
        imperial: 'hei_kuang_heavy',     // 藏式金顶宗堡近卫铁骑
    },
    WESTERN: {
        civKey: 'WESTERN', civName: '西域', deStyle: 'CEAS',
        antiquity: 'elite_scythian_horse_archer', // 疏勒/塞种精锐大弓骑兵
        feudal: 'sakan_axeman',          // 西域绿洲重装战斧勇士
        castle: 'scythian_axe_cavalry',  // 龟兹/于阗战斧具装铁骑
        imperial: 'elite_scythian_horse_archer', // 绿洲城邦精锐重骑射
    },
    MOBEI_MONGOL: {
        civKey: 'MOBEI_MONGOL', civName: '漠北蒙古', deStyle: 'ASIA',
        antiquity: 'xianbei_raider',     // 漠北鲜卑拓跋重突骑
        feudal: 'antiquity_heavy_cavalry_archer', // 柔然/回鹘重装骑射
        castle: 'hero_subotai',          // 蒙古帝国西征先锋四狗速不台
        imperial: 'mangudai_elite',      // 精锐蒙古突骑
    },
};

/** 缓存势力 -> 文明 key 的反向索引 */
let _factionToCivKeyCache: Map<string, string> | null = null;

function getFactionToCivMap(): Map<string, string> {
    if (_factionToCivKeyCache) return _factionToCivKeyCache;
    const m = new Map<string, string>();
    for (const city of Object.values(CITIES_V2)) {
        if (city.factionId && !m.has(city.factionId)) {
            const rawStyle = city.buildingStyle || city.region || 'CENTRAL';
            m.set(city.factionId, rawStyle);
        }
    }
    _factionToCivKeyCache = m;
    return m;
}

/**
 * 248 主将兵模解析：根据武将的文明归属与历史时代，返回该分类的主将兵模
 */
export function resolveCivEraCommander(generalId: string | null | undefined): string | null {
    if (!generalId) return null;
    const era: GeneralEra = GENERAL_ERA[generalId] ?? 'castle';
    const factionId = getFactionIdOfGeneral(generalId);
    let civKey = factionId ? getFactionToCivMap().get(factionId) : null;
    
    // 如果没有直接命中 62 类，尝试从 REGION_TO_DE_STYLE 转成基础风格
    if (!civKey || !CIV_ERA_COMMANDER_248[civKey]) {
        if (civKey && REGION_TO_DE_STYLE[civKey]) {
            civKey = REGION_TO_DE_STYLE[civKey];
        } else {
            civKey = 'CENTRAL'; // 兜底中原华夏
        }
    }

    const row = CIV_ERA_COMMANDER_248[civKey] ?? CIV_ERA_COMMANDER_248['CENTRAL'];
    return row[era] ?? row['castle'] ?? null;
}
