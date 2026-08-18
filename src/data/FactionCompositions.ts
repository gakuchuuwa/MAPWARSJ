/**
 * 势力自定义军团方阵数据表 (Faction Legion Compositions)
 * 由独立军团编辑器 (http://localhost:5173/legion-editor.html) 生成与维护。
 *
 * 机制：
 * - key: factionId (如 'qin', 'lagoniya', 'buni', 'luoma_diguo')
 * - 若势力在此表中登记，军团生成与渲染优先使用此配置；
 * - 若未登记，自动回退到 18 大文化区默认方阵 (CULTURE_TIERS_MAP)。
 */

import type { FormationMode } from '../types/CultureFormations';
import type { CompositionSlot } from '../types/LegionComposition';

export interface CustomFactionLegion {
    formationMode: FormationMode;
    slots: CompositionSlot[];
}

export const FACTION_COMPOSITIONS: Record<string, CustomFactionLegion> = {
    // 秦及先秦·雁行阵（4+3+2：印加枪兵长 4 + 双轮远程战车 3 + 诸葛弩 2）——2026-08-18 主人定
    qin: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 弩兵 4（秦弩／汉强弩是军中主力）
            { type: 'kamayuk', count: 3 },                   // 中军接应 = 长矛兵 3
            { type: 'war_chariot_ranged', count: 2 },        // 压阵战车 = 双轮远程战车 2（🔴 占人口的只许 2 档）
        ],
    },
    // 韩国·雁行阵（4+3+2：与秦国同阵）——2026-08-18 主人定「秦国及以前武将都套此阵」
    han: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 弩兵 4（秦弩／汉强弩是军中主力）
            { type: 'kamayuk', count: 3 },                   // 中军接应 = 长矛兵 3
            { type: 'war_chariot_ranged', count: 2 },        // 压阵战车 = 双轮远程战车 2（🔴 占人口的只许 2 档）
        ],
    },
    han_d: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'jian_swordsman', count: 2 },      // Row 0 步兵前锋 = 刀剑手 2人
            { type: 'tiger_rider', count: 4 },         // Row 1 骑兵主力两翼合围 = 虎豹骑 4人
            { type: 'chukonu', count: 3 },             // Row 2 中军后排支援 = 诸葛弩 3人
        ],
    },
    // 曹魏·曹操军团（鹤翼阵 2+4+3：曹魏虎豹骑 2 + 曹魏虎豹骑精锐 4 + 华夏诸葛弩 3）
    cao_d: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'tiger_rider', count: 2 },          // Row 0 前哨牵制 = 曹魏虎豹骑 2人
            { type: 'elite_tiger_cavalry', count: 4 },  // Row 1 铁骑主力两翼合围 = 曹魏虎豹骑精锐 4人
            { type: 'chukonu', count: 3 },              // Row 2 中军后排支援 = 华夏诸葛弩 3人
        ],
    },
    // 南宋·岳飞 / 韩世忠 / 孟珙 / 刘锜 火矛手军团（鱼鳞阵 3+4+2：火矛手前卫 3 + 精锐火矛手突击主力 4 + 诸葛弩 2）
    yanchuan_d: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    sizhou: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    yingzhou_d: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    zaoyang_d: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    fengzhou: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    hezhou: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    changshaguo: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    shenshi: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    luoping: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    // 北宋·赵匡胤 / 杨业 / 杨延昭 / 狄青 / 种世衡 / 种师道 / 王韶 等火矛手军团（鱼鳞阵 3+4+2）
    // 2026-08-18 主人定「所有宋武将统一此阵」：火矛手前卫 3 + 精锐火矛手突击主力 4 + 诸葛弩 2
    song: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    heng1: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    changshan: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    zhai_han: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    yanzhou: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    huan: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    didao: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    qing: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    xiangzhou: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    tingzhou_d: {
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 诸葛弩 4（宋以强弩立国：神臂弓、床子弩）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_fire_lancer', count: 2 },         // 压阵火器 = 精锐火矛手 2（🔴 热兵器只许 2 档）
        ],
    },
    // 蜀汉·刘备 / 诸葛亮 / 关羽 / 张飞 / 赵云 / 马超 / 姜维 / 王平 / 张嶷 / 廖化 / 严颜 白毦兵精锐军团（鱼鳞阵 3+4+2：白毦兵前卫 3 + 精锐白毦兵主力 4 + 诸葛弩 2）
    shu: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },       // Row 0 前卫 = 蜀汉白毦兵 3人
            { type: 'elite_white_feather_guard', count: 4 }, // Row 1 中军突击主力 = 精锐白毦兵 4人
            { type: 'chukonu', count: 2 },                   // Row 2 尾收支援 = 诸葛弩 2人
        ],
    },
    huizhou_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    chu: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    langzhou: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    jingmen: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    cangsong: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    qingqiang: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    yangzhou: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    yueyi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    lizhou_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    fu_zhou: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    // 中欧·匈牙利 马扎尔骠骑军团（鹤翼阵 2+4+3：冠军剑士前锋 2 + 马扎尔骠骑主力 4 + 弩手后排 3）
    // 2026-08-18 主人定：马扎尔城堡兵「马扎尔骠骑」配给匈牙利（布达佩斯）
    mazhaer: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'champion', count: 2 },        // Row 0 步兵前锋 = 冠军剑士
            { type: 'magyar_huszar', count: 4 },   // Row 1 骑兵主力两翼合围 = 马扎尔骠骑
            { type: 'crossbowman', count: 3 },     // Row 2 后排支援 = 弩手
        ],
    },
    // 西亚·奥斯曼帝国 苏丹亲兵军团（雁行阵 4+3+2：苏丹亲兵火枪齐射 4 + 西帕希重骑接应 3 + 阿金吉骑射压阵 2）
    // 2026-08-18 主人定：新增奥斯曼势力，城堡兵「苏丹亲兵」作主力
    osman: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'janissary', count: 2 },                 // 前排火绳枪 = 苏丹亲兵 2（🔴 热兵器只许 2 档；亲兵是少而精的常备步兵）
            { type: 'paladin', count: 4 },                   // 主力·两翼合围 = 西帕希封建重骑 4（奥斯曼军队主体）
            { type: 'cav_archer_heavy', count: 3 },          // 中军骑射 = 重装骑射手 3
        ],
    },
    // 草原与中亚诸大汗·鞑靼怯薛军团（鱼鳞阵 3+4+2：怯薛军前卫 3 + 精锐怯薛军主力 4 + 蒙古突骑 2）
    // 包含：成吉思汗、拔都、忽必烈、帖木儿、旭烈兀、速不台、木华黎、也速该、札木合、也先、噶尔丹、昔班尼、巴布尔、突厥大汗等
    menggu_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },          // Row 0 前卫突破 = 鞑靼怯薛军 3骑
            { type: 'elite_keshik', count: 4 },    // Row 1 中军主力 = 鞑靼怯薛军精锐 4骑
            { type: 'mangudai', count: 2 },        // Row 2 尾收远射 = 蒙古突骑 2骑
        ],
    },
    jinzhang: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    yuan_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    tiemuer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    asaibaijiang: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    wuliangha: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    jalair: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    kiyad: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    zhadalan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    wala: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    oirat_ming: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    an: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    babuer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    da_yuan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    chahar: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    zhaowu: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    manghuti: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    khoshut: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    yilihanguo_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    yilihanguo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    salai: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    // 马其顿·亚历山大帝国军团（雁行阵 4+3+2：马其顿方阵兵 4 + 伙伴骑兵 3 + 克里特弓手 2）
    maqidun: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 托勒密（亚历山大旧部，套用亚历山大帝国军团配置）
    tuolemi: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 塞琉古帝国（安提俄基亚 · 塞琉古一世/安条克，银盾方阵体系）
    sailiugu: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 佩尔加蒙（欧迈尼斯 · 亚历山大王家秘书长与近卫方阵统帅）
    pajiama: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 贝雷尼斯（托勒密二世 · 托勒密王朝红海据点）
    beileinisi: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 昔兰尼加（班加西 · 托勒密一世养子马加斯）
    jileinaijia: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 拉哥尼亚·斯巴达（列奥尼达 · 方形阵 3+3+3：全斯巴达希皮乌斯 300 勇士近卫阵）
    lagoniya: {
        formationMode: 'square',
        slots: [
            { type: 'hippeus', count: 3 },             // Row 0 前排 = 斯巴达希皮乌斯 3人
            { type: 'hippeus', count: 3 },             // Row 1 中坚 = 斯巴达希皮乌斯 3人
            { type: 'hippeus', count: 3 },             // Row 2 后排 = 斯巴达希皮乌斯 3人
        ],
    },
    // 底比斯（伊巴密浓达 · 方形阵 3+3+3：全底比斯圣队死士同袍阵）
    boootiya: {
        formationMode: 'square',
        slots: [
            { type: 'sacred_band', count: 3 },         // Row 0 前排 = 底比斯圣队 3人
            { type: 'sacred_band', count: 3 },         // Row 1 中坚 = 底比斯圣队 3人
            { type: 'sacred_band', count: 3 },         // Row 2 后排 = 底比斯圣队 3人
        ],
    },
    // 日本战国·织田信长军团（方阵 3+3+3：日本武士 3 + 火枪兵 3 + 火枪兵 3）
    owari: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'samurai', count: 3 },                   // 前卫 = 武士 3
            { type: 'samurai_elite', count: 4 },             // 主力 = 精锐武士 4
            { type: 'hand_cannoneer', count: 2 },            // 压阵铁炮 = 手炮手 2（🔴 热兵器只许 2 档）
        ],
    },
    // 伊贺·忍者军团（方阵 3+3+3：忍者 3 + 忍者 3 + 忍者 3）
    iga_d: {
        formationMode: 'square',
        slots: [
            { type: 'ninja', count: 3 },        // Row 0 前排 = 忍者 3人
            { type: 'ninja', count: 3 },        // Row 1 中坚 = 忍者 3人
            { type: 'ninja', count: 3 }         // Row 2 后排 = 忍者 3人
        ],
    },
    // 罗马帝国·恺撒 / 君士坦丁 / 尤里安 / 庞培 百夫长精锐军团（雁行阵 4+3+2：军团步兵前锋 4 + 精锐百夫长中坚 3 + 百夫长压阵 2）
    luoma_diguo: {
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },           // Row 0 前排大盾宽线 = 罗马军团步兵 4人
            { type: 'elite_centurion', count: 3 },     // Row 1 中军主力突击 = 罗马百夫长精锐 3骑
            { type: 'centurion', count: 2 },           // Row 2 尾收指挥调度 = 罗马百夫长 2骑
        ],
    },
    gaolu_luoma: {
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'elite_centurion', count: 3 },
            { type: 'centurion', count: 2 },
        ],
    },
    mozeer: {
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'elite_centurion', count: 3 },
            { type: 'centurion', count: 2 },
        ],
    },
    aersasi: {
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'elite_centurion', count: 3 },
            { type: 'centurion', count: 2 },
        ],
    },
    qiliqiya: {
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'elite_centurion', count: 3 },
            { type: 'centurion', count: 2 },
        ],
    },
    // 阿契美尼德·波斯帝国军团（大流士 · 三角阵 2+3+4：萨珊铁骑 2 + 不死战士 3 + 波斯弓手主力 4）
    aqimeinide: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },           // Row 0 尖刀突击 = 萨珊萨瓦尔铁骑 2骑
            { type: 'immortal', count: 3 },        // Row 1 冲击中坚 = 不死战士 3人
            { type: 'immortal_ranged', count: 4 }, // Row 2 底边主力齐射 = 波斯长生军弓手 4人
        ],
    },
    // 萨珊波斯军团（沙普尔大帝 · 尼沙布尔）
    aba: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 萨非波斯军团（阿拔斯大帝 · 伊斯法罕 · 方形阵 3+3+3：全红头骑士奇兹尔巴什圣战死士阵）
    safawei_d: {
        formationMode: 'square',
        slots: [
            { type: 'qizilbash_warrior', count: 3 },   // Row 0 前排 = 红头骑士 3人
            { type: 'qizilbash_warrior', count: 3 },   // Row 1 中坚 = 红头骑士 3人
            { type: 'qizilbash_warrior', count: 3 },   // Row 2 后排 = 红头骑士 3人
        ],
    },
    // 萨非波斯军团（伊斯玛仪一世 · 加兹温 · 方形阵 3+3+3：全红头骑士奇兹尔巴什圣战死士阵）
    safawei: {
        formationMode: 'square',
        slots: [
            { type: 'qizilbash_warrior', count: 3 },
            { type: 'qizilbash_warrior', count: 3 },
            { type: 'qizilbash_warrior', count: 3 },
        ],
    },
    // 安息波斯帝国（阿尔沙克 · 尼萨）
    ansxi: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 苏伦家族（苏伦 · 法拉）
    delan: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 卡伦家族（苏赫拉 · 图斯）
    kalan: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 米底王国（戴奥凯斯 · 哈马丹）
    midi: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 萨法尔王朝（雅库布 · 博斯特）
    xisi: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 埃兰古波斯（舒特鲁克 · 苏萨）
    ailan: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 萨尔巴达尔（拉扎克 · 白哈格）
    saerbadaer: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 库米斯（阿尔普 · 达姆甘）
    kumisi: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 哈利（戈达尔兹 · 萨拉赫斯）
    hali: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 巴哈尔兹（盖瓦姆 · 泰巴德）
    baha: {
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 波兰王国·华沙（雅盖沃 · 鹤翼阵 2+4+3：战锤破甲勇士 2 + 精锐翼骑兵主力 4 + 劲弩手 3）
    bolan: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'obuch', count: 2 },         // Row 0 步兵前锋 = 战锤破甲勇士 2人
            { type: 'winged_hussar', count: 4 }, // Row 1 骑兵主力两翼合围 = 精锐翼骑兵 4人
            { type: 'arbalest', count: 3 },      // Row 2 中军后排支援 = 劲弩手 3人
        ],
    },
    // 皮雅斯特王朝·克拉科夫（卡齐米日大帝）
    piyasite: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'obuch', count: 2 },
            { type: 'winged_hussar', count: 4 },
            { type: 'arbalest', count: 3 },
        ],
    },
    // 大波兰·波兹南（普热梅斯二世）
    dabolan: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'obuch', count: 2 },
            { type: 'winged_hussar', count: 4 },
            { type: 'arbalest', count: 3 },
        ],
    },
    // 立陶宛大公国·维尔纽斯 / 涅曼·格罗德诺（格迪米纳斯 / 维托夫特 列提斯破甲铁骑与劲弩精锐军团 · 鱼鳞阵 3+4+2：列提斯前卫 3 + 精锐列提斯主力 4 + 劲弩手 2）
    litaowan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'leitis', count: 3 },        // Row 0 前卫突击 = 立陶宛列提斯 3骑
            { type: 'elite_leitis', count: 4 },  // Row 1 中军主力撕裂 = 立陶宛列提斯精锐 4骑（无视护甲之王主力突破）
            { type: 'arbalest', count: 2 },      // Row 2 尾收远程压阵 = 劲弩手 2人（SLAVIC 文化区标准远程）
        ],
    },
    nieman: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'leitis', count: 3 },
            { type: 'elite_leitis', count: 4 },
            { type: 'arbalest', count: 2 },
        ],
    },
    // 条顿骑士团·柯尼斯堡（容金根 · 鱼鳞阵 3+4+2：条顿武士 3 + 精锐条顿武士主力 4 + 十字军骑士 2）
    tiaodun_qishi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'teutonic_knight', count: 3 },        // Row 0 前卫抗线 = 条顿武士 3人（全钢板甲双手阔剑步行铁罐头）
            { type: 'elite_teutonic_knight', count: 4 },  // Row 1 中军主力 = 条顿武士精锐 4人（王牌重甲剑士主力决战）
            { type: 'crusader_knight', count: 2 },        // Row 2 尾收铁骑 = 十字军骑士 2骑（圣殿战马重骑后排策应）
        ],
    },
    // 圣殿骑士团·阿卡（莫莱 · 方形阵 3+3+3：全十字军骑士纯圣堂重骑冲击阵）
    shengdian_qishi: {
        formationMode: 'square',
        slots: [
            { type: 'crusader_knight', count: 3 },      // Row 0 前排 = 十字军骑士 3人
            { type: 'crusader_knight', count: 3 },      // Row 1 中坚 = 十字军骑士 3人
            { type: 'crusader_knight', count: 3 },      // Row 2 后排 = 十字军骑士 3人
        ],
    },
    // 宝剑骑士团·里加（阿尔伯特）
    baojian_qishi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'teutonic_knight', count: 3 },
            { type: 'elite_teutonic_knight', count: 4 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    // 利沃尼亚骑士团·塔林（普雷特贝格）
    liwoniya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'teutonic_knight', count: 3 },
            { type: 'elite_teutonic_knight', count: 4 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    // 拜占庭帝国·君士坦丁堡（巴西尔二世 / 福卡斯 · 鱼鳞阵 3+4+2：拜占庭圣骑兵 3 + 拜占庭圣骑兵精锐主力 4 + 复合弓手 2）
    baizanting: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'cataphract', count: 3 },        // Row 0 前卫 = 拜占庭圣骑兵 3人
            { type: 'elite_cataphract', count: 4 },  // Row 1 中军突破主力 = 拜占庭圣骑兵精锐 4人
            { type: 'composite_bowman', count: 2 },  // Row 2 尾收压阵 = 复合弓手 2人
        ],
    },
    kelite: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'cataphract', count: 3 },
            { type: 'elite_cataphract', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    // 陶里卡·赫尔松涅斯（拜占庭克里米亚军区要塞）
    taolika: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'cataphract', count: 3 },
            { type: 'elite_cataphract', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    // 达尔达尼亚·特洛伊（赫克托耳 · 古典希腊重骑战阵）
    teluoyi: {
        formationMode: 'square',
        slots: [
            { type: 'hippeus', count: 3 },
            { type: 'hippeus', count: 3 },
            { type: 'hippeus', count: 3 },
        ],
    },
    // 马耳他·圣约翰医院骑士团（瓦莱特 · 十字军骑士战阵）
    maerta_qishi: {
        formationMode: 'square',
        slots: [
            { type: 'crusader_knight', count: 3 },
            { type: 'crusader_knight', count: 3 },
            { type: 'crusader_knight', count: 3 },
        ],
    },
    // 不列颠·黑太子爱德华 / 阿尔弗雷德大帝 紫杉长弓兵精锐军团（三角阵 2+3+4：双手剑士前卫 2 + 长弓兵 3 + 精锐长弓兵主力 4）
    aquidan: {
        formationMode: 'triangle',
        slots: [
            { type: 'two_handed_swordsman', count: 2 }, // Row 0 尖刀坚壁 = 双手剑士 2人
            { type: 'longbowman', count: 3 },           // Row 1 齐射中坚 = 不列颠长弓兵 3人
            { type: 'longbowman_elite', count: 4 },     // Row 2 底边主力齐射 = 不列颠长弓兵精锐 4人
        ],
    },
    anggelu: {
        formationMode: 'triangle',
        slots: [
            { type: 'two_handed_swordsman', count: 2 },
            { type: 'longbowman', count: 3 },
            { type: 'longbowman_elite', count: 4 },
        ],
    },
    // 法兰克与法兰西·查理曼 / 查理马特 / 查理七世 / 吉尔德雷斯 掷斧兵与圣骑士精锐军团（鹤翼阵 2+4+3：掷斧兵前哨 2 + 精锐掷斧兵主力 4 + 游侠圣骑 3）
    jialuolin: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },       // Row 0 前哨飞斧破盾 = 法兰克掷斧兵 2人
            { type: 'elite_throwing_axeman', count: 4 }, // Row 1 狂暴突贯主力 = 法兰克掷斧兵精锐 4人
            { type: 'paladin', count: 3 },               // Row 2 中军后排圣骑驰援 = 游侠圣骑士 3人
        ],
    },
    falanji: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'paladin', count: 3 },
        ],
    },
    gaolu: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'paladin', count: 3 },
        ],
    },
    aermolika: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'paladin', count: 3 },
        ],
    },
    // 西班牙·熙德 / 费尔南多三世 / 阿方索诸王 征服者火枪骑兵精锐军团（三角阵 2+3+4：重装长枪前卫 2 + 征服者 3 + 精锐征服者主力 4）
    balunxiya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },      // 前卫剑盾 = 双手剑士 3
            { type: 'heavy_pikeman', count: 4 },             // 主力·长枪方阵 = 重装长枪兵 4（西班牙大方阵 tercio 的主体）
            { type: 'elite_conquistador', count: 2 },        // 压阵火绳枪骑 = 精锐征服者 2（🔴 热兵器只许 2 档）
        ],
    },
    guadaer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },      // 前卫剑盾 = 双手剑士 3
            { type: 'heavy_pikeman', count: 4 },             // 主力·长枪方阵 = 重装长枪兵 4（西班牙大方阵 tercio 的主体）
            { type: 'elite_conquistador', count: 2 },        // 压阵火绳枪骑 = 精锐征服者 2（🔴 热兵器只许 2 档）
        ],
    },
    kasidiliya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },      // 前卫剑盾 = 双手剑士 3
            { type: 'heavy_pikeman', count: 4 },             // 主力·长枪方阵 = 重装长枪兵 4（西班牙大方阵 tercio 的主体）
            { type: 'elite_conquistador', count: 2 },        // 压阵火绳枪骑 = 精锐征服者 2（🔴 热兵器只许 2 档）
        ],
    },
    leangongguo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },      // 前卫剑盾 = 双手剑士 3
            { type: 'heavy_pikeman', count: 4 },             // 主力·长枪方阵 = 重装长枪兵 4（西班牙大方阵 tercio 的主体）
            { type: 'elite_conquistador', count: 2 },        // 压阵火绳枪骑 = 精锐征服者 2（🔴 热兵器只许 2 档）
        ],
    },
    xigete: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },      // 前卫剑盾 = 双手剑士 3
            { type: 'heavy_pikeman', count: 4 },             // 主力·长枪方阵 = 重装长枪兵 4（西班牙大方阵 tercio 的主体）
            { type: 'elite_conquistador', count: 2 },        // 压阵火绳枪骑 = 精锐征服者 2（🔴 热兵器只许 2 档）
        ],
    },
    alagong: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },      // 前卫剑盾 = 双手剑士 3
            { type: 'heavy_pikeman', count: 4 },             // 主力·长枪方阵 = 重装长枪兵 4（西班牙大方阵 tercio 的主体）
            { type: 'elite_conquistador', count: 2 },        // 压阵火绳枪骑 = 精锐征服者 2（🔴 热兵器只许 2 档）
        ],
    },
    // 北欧与维京·阿布萨隆 / 卡尔九世 / 比尔格雅尔 狂战士精锐军团（鱼鳞阵 3+4+2：狂战士前卫 3 + 精锐狂战士主力 4 + 掷矛手 2）
    danmai: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'berserk', count: 3 },       // Row 0 前卫冲锋 = 维京狂战士 3人
            { type: 'elite_berserk', count: 4 }, // Row 1 中军狂暴主力 = 维京狂战士精锐 4人
            { type: 'skirmisher', count: 2 },    // Row 2 尾收远程投掷 = 掷矛手 2人（维京接敌前标志性标枪破盾）
        ],
    },
    ruidian_yota: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'berserk', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    ruidian_si: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'berserk', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    // 高丽王朝·王建 / 姜邯赞 / 崔茂宣 / 尹瓘 / 金就砺 高丽战车车垒军团（雁行阵 4+3+2：华夏刀剑手 4 + 精锐高丽战车 3 + 高丽战车 2）
    goryeo: {
        formationMode: 'echelon',
        slots: [
            { type: 'fire_archer', count: 4 },               // 主力·宽线齐射 = 火焰弓箭手 4（高丽以弓术著称）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_war_wagon', count: 2 },           // 压阵战车 = 精锐高丽战车 2（🔴 占人口的只许 2 档）
        ],
    },
    chungju_d: {
        formationMode: 'echelon',
        slots: [
            { type: 'fire_archer', count: 4 },               // 主力·宽线齐射 = 火焰弓箭手 4（高丽以弓术著称）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_war_wagon', count: 2 },           // 压阵战车 = 精锐高丽战车 2（🔴 占人口的只许 2 档）
        ],
    },
    sabeol: {
        formationMode: 'echelon',
        slots: [
            { type: 'fire_archer', count: 4 },               // 主力·宽线齐射 = 火焰弓箭手 4（高丽以弓术著称）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_war_wagon', count: 2 },           // 压阵战车 = 精锐高丽战车 2（🔴 占人口的只许 2 档）
        ],
    },
    hai2: {
        formationMode: 'echelon',
        slots: [
            { type: 'fire_archer', count: 4 },               // 主力·宽线齐射 = 火焰弓箭手 4（高丽以弓术著称）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_war_wagon', count: 2 },           // 压阵战车 = 精锐高丽战车 2（🔴 占人口的只许 2 档）
        ],
    },
    woju: {
        formationMode: 'echelon',
        slots: [
            { type: 'fire_archer', count: 4 },               // 主力·宽线齐射 = 火焰弓箭手 4（高丽以弓术著称）
            { type: 'jian_swordsman', count: 3 },            // 中军接应 = 刀剑手 3
            { type: 'elite_war_wagon', count: 2 },           // 压阵战车 = 精锐高丽战车 2（🔴 占人口的只许 2 档）
        ],
    },
    // 波希米亚与捷克·扬·杰式卡 胡斯车阵军团（雁行 4+3+2：劲弩手主力 4 + 双手剑士 3 + 胡斯战车 2）
    //
    // 🔴 2026-08-18 改：原编制是**方阵 3+3+3、九档全是胡斯战车**——史实上不成立。
    //    胡斯军的车阵（Wagenburg）里车是骨架，车间车后站的是连枷手、弩手、火铳手：
    //    一支万人规模的胡斯军配二三百辆车，不是一万辆车（主人原话「一方出兵一万，
    //    另一方出车也是一万吗」）。而且九档全车也违反主人定的「攻城类只能占 2 档」。
    //    改法：弩手当主力（胡斯以弩与火器闻名）→ 远程主力配雁行；战车退到 2 档当车阵骨架。
    boximiya: {
        formationMode: 'echelon',
        slots: [
            { type: 'arbalest', count: 4 },            // Row 0 主力·宽线齐射 = 劲弩手 4
            { type: 'two_handed_swordsman', count: 3 },// Row 1 中军接应 = 双手剑士 3（连枷/长柄武器的近战主体）
            { type: 'elite_hussite_wagon', count: 2 }, // Row 2 车阵骨架 = 精锐胡斯战车 2（🔴 攻城类只许 2 档）
        ],
    },
    // 意大利与热那亚·安德烈亚·多利亚 / 丹多洛 / 洛伦佐 全甲佣兵与大盾热那亚重弩军团（鱼鳞阵 3+4+2：意大利佣兵 3 + 精锐热那亚弩手主力 4 + 热那亚弩手 2）
    liguliya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'condottiero', count: 3 },                // Row 0 前卫抗线 = 意大利佣兵 3人（全钢板甲双手阔剑佣兵统领）
            { type: 'elite_genoese_crossbowman', count: 4 },  // Row 1 中军主力 = 意大利热那亚弩手精锐 4人（背负大盾超远重弩齐射）
            { type: 'genoese_crossbowman', count: 2 },        // Row 2 尾收掩护 = 意大利热那亚弩手 2人（大盾步弩后排掩护）
        ],
    },
    anuo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
            { type: 'genoese_crossbowman', count: 2 },
        ],
    },
    tuosikana: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
            { type: 'genoese_crossbowman', count: 2 },
        ],
    },
    lunbadi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
            { type: 'genoese_crossbowman', count: 2 },
        ],
    },
    yadelaiya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
            { type: 'genoese_crossbowman', count: 2 },
        ],
    },
    // 葡萄牙·阿方索一世 / 桑乔一世 风琴炮火器与长枪精锐军团（三角阵 2+3+4：重装长枪前卫 2 + 葡萄牙风琴炮 3 + 精锐风琴炮主力 4）
    putaoya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },      // 前卫剑盾 = 双手剑士 3
            { type: 'heavy_pikeman', count: 4 },             // 主力·长枪方阵 = 重装长枪兵 4
            { type: 'elite_organ_gun', count: 2 },           // 压阵火炮 = 精锐风琴炮 2（🔴 热兵器只许 2 档）
        ],
    },
    duluo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },      // 前卫剑盾 = 双手剑士 3
            { type: 'heavy_pikeman', count: 4 },             // 主力·长枪方阵 = 重装长枪兵 4
            { type: 'elite_organ_gun', count: 2 },           // 压阵火炮 = 精锐风琴炮 2（🔴 热兵器只许 2 档）
        ],
    },
    // 格鲁吉亚·塔玛尔女王 莫纳斯帕王家近卫铁骑精锐军团（鱼鳞阵 3+4+2：莫纳斯帕前卫 3 + 精锐莫纳斯帕主力 4 + 复合弓手 2）
    gelujiya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'monaspa', count: 3 },              // Row 0 前卫冲击 = 格鲁吉亚莫纳斯帕 3骑
            { type: 'elite_monaspa', count: 4 },        // Row 1 中军破阵主力 = 格鲁吉亚莫纳斯帕精锐 4骑（王家近卫铁骑主力）
            { type: 'composite_bowman', count: 2 },     // Row 2 尾收远程掩护 = 复合弓手 2人（WEST_ASIA 文化区标准远程）
        ],
    },
    // 缅甸东吁王朝·莽应龙 / 莽瑞体 / 雍笈牙 白象御驾与飞镖铁骑军团（鱼鳞阵 3+4+2：御驾金鞍战象 3 + 飞镖骑兵精锐主力 4 + 飞镖骑兵 2）
    hantawadi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'bayinnaung_elephant', count: 3 },   // Row 0 前卫冲击 = 莽应龙御驾战象 3头（金鞍披甲巨象践踏破阵）
            { type: 'elite_arambai', count: 4 },         // Row 1 中军主力 = 缅甸飞镖骑兵精锐 4骑（王牌飞镖破甲高爆输出）
            { type: 'arambai', count: 2 },               // Row 2 尾收压阵 = 缅甸飞镖骑兵 2骑（密林快骑后方抛射掩护）
        ],
    },
    dongxu: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'bayinnaung_elephant', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'arambai', count: 2 },
        ],
    },
    konbaung: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'bayinnaung_elephant', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'arambai', count: 2 },
        ],
    },
    pyu: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'bayinnaung_elephant', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'arambai', count: 2 },
        ],
    },
    mon: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'bayinnaung_elephant', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'arambai', count: 2 },
        ],
    },
    // 扶南与高棉·范蔓 / 刀更孟 弩炮战象与爪刀精锐军团（三角阵 2+3+4：爪刀勇士前卫 2 + 弩炮战象 3 + 精锐弩炮战象主力 4）
    funan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'archer', count: 3 },                    // 前卫散射 = 步弓手 3
            { type: 'karambit_warrior_elite', count: 4 },    // 主力 = 精锐爪刀勇士 4
            { type: 'elite_ballista_elephant', count: 2 },   // 压阵巨兽 = 精锐弩战象 2（🔴 象只许 2 档）
        ],
    },
    basha_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'archer', count: 3 },                    // 前卫散射 = 步弓手 3
            { type: 'karambit_warrior_elite', count: 4 },    // 主力 = 精锐爪刀勇士 4
            { type: 'elite_ballista_elephant', count: 2 },   // 压阵巨兽 = 精锐弩战象 2（🔴 象只许 2 档）
        ],
    },
    // 西西里与诺曼·腓特烈二世 / 罗杰二世 / 埃莱奥诺拉 军士长方阵与劲弩精锐军团（鱼鳞阵 3+4+2：军士长前卫 3 + 精锐军士长主力 4 + 劲弩手 2）
    xixiliwangguo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'serjeant', count: 3 },            // Row 0 前卫坚壁 = 西西里军士长 3人（纯步兵·无马，持诺曼大盾长枪正面结阵抗线）
            { type: 'elite_serjeant', count: 4 },      // Row 1 中军主力破阵 = 西西里军士长精锐 4人（主力重装步兵方阵推进）
            { type: 'arbalest', count: 2 },            // Row 2 尾收远程压制 = 劲弩手 2人（纯步兵·无马，后排破甲重弩强力压制）
        ],
    },
    moxina: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'serjeant', count: 3 },
            { type: 'elite_serjeant', count: 4 },
            { type: 'arbalest', count: 2 },
        ],
    },
    sading: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'serjeant', count: 3 },
            { type: 'elite_serjeant', count: 4 },
            { type: 'arbalest', count: 2 },
        ],
    },
    // 勃艮第与弗兰德·罗贝尔二世 马上轻骑与强弩精锐军团（鱼鳞阵 3+4+2：马上轻骑前卫 3 + 精锐马上轻骑主力 4 + 弩兵 2）
    fulandesi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'coustillier', count: 3 },        // Row 0 前卫突击 = 勃艮第马上轻骑 3骑（前锋突击）
            { type: 'elite_coustillier', count: 4 },  // Row 1 中军主力爆发 = 勃艮第马上轻骑精锐 4骑（冲锋一击蓄力爆发主力）
            { type: 'crossbowman', count: 2 },        // Row 2 尾收远程压制 = 弩兵 2人（纯步兵·无马，后排强弩齐射破盾）
        ],
    },
    // 萨拉森与阿拉伯·萨拉赫丁 / 穆阿维叶 马穆鲁克弯刀重骑与骆驼弓精锐军团（鱼鳞阵 3+4+2：马穆鲁克前卫 3 + 精锐马穆鲁克主力 4 + 骆驼弓骑 2）
    ayoubu: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'mameluke', count: 3 },            // Row 0 前卫突击 = 萨拉森马穆鲁克 3骑（弯刀重骑前锋撕裂）
            { type: 'elite_mameluke', count: 4 },      // Row 1 中军主力劈杀 = 萨拉森马穆鲁克精锐 4骑（近卫重骑主力突破）
            { type: 'camel_archer', count: 2 },        // Row 2 尾收远程掩护 = 柏柏尔骆驼弓骑 2骑（高机动骆驼骑射压制）
        ],
    },
    womaya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'mameluke', count: 3 },
            { type: 'elite_mameluke', count: 4 },
            { type: 'camel_archer', count: 2 },
        ],
    },
    // 哥特·狄奥多里克大帝 哥特近卫军盾墙与弩手精锐军团（鱼鳞阵 3+4+2：哥特近卫军前卫 3 + 精锐哥特近卫军主力 4 + 弩兵 2）
    donggete: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'huskarl', count: 3 },            // Row 0 前卫坚壁 = 哥特近卫军 3人（纯步兵·无马，持重盾顶着箭雨推进）
            { type: 'elite_huskarl', count: 4 },      // Row 1 中军主力破阵 = 哥特近卫军精锐 4人（主力近卫步兵盾墙撕裂）
            { type: 'crossbowman', count: 2 },        // Row 2 尾收远程压制 = 弩兵 2人（纯步兵·无马，后排强弩射击压制）
        ],
    },
    // 保加利亚·西美昂大帝 龙骑兵突击与复合弓精锐军团（鱼鳞阵 3+4+2：保加利亚骑兵前卫 3 + 精锐保加利亚骑兵主力 4 + 复合弓手 2）
    seleisi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'konnik', count: 3 },               // Row 0 前卫突击 = 保加利亚骑兵 3骑（前锋冲锋）
            { type: 'elite_konnik', count: 4 },         // Row 1 中军主力破阵 = 保加利亚骑兵精锐 4骑（龙骑兵主力突破）
            { type: 'composite_bowman', count: 2 },     // Row 2 尾收远程掩护 = 复合弓手 2人（纯步兵·无马，后排复合弓吊射）
        ],
    },
    // 保加利亚帝国·克鲁姆大汗 下马保加利亚勇士死斗军团（鱼鳞阵 3+4+2：下马保加利亚骑兵前卫 3 + 下马保加利亚骑兵精锐主力 4 + 复合弓手 2）
    saierdika: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'konnik_foot', count: 3 },             // Row 0 前卫坚盾 = 下马保加利亚骑兵 3人（纯步兵·无马，重盾前卫抗线破阵）
            { type: 'elite_konnik_foot', count: 4 },       // Row 1 中军主力 = 下马保加利亚骑兵精锐 4人（纯步兵·无马，王牌重装勇士主力死斗血战）
            { type: 'composite_bowman', count: 2 },        // Row 2 尾收远射 = 复合弓手 2人（纯步兵·无马，后方步弓压制掩护）
        ],
    },
    // 凯尔特与苏格兰·威廉·华莱士 / 奥恩格斯 / 多姆纳尔 靛蓝突袭者与长弓精锐军团（鱼鳞阵 3+4+2：靛蓝突袭者前卫 3 + 精锐靛蓝突袭者主力 4 + 长弓兵 2）
    kanbuliya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },          // Row 0 前卫突袭 = 凯尔特靛蓝突袭者 3人（纯步兵·无马，高速突袭）
            { type: 'elite_woad_raider', count: 4 },    // Row 1 中军主力破阵 = 凯尔特靛蓝突袭者精锐 4人（主力狂暴劈杀）
            { type: 'longbowman', count: 2 },           // Row 2 尾收远程吊射 = 长弓兵 2人（纯步兵·无马，后排战弓抛射压制）
        ],
    },
    piketai: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },
            { type: 'elite_woad_raider', count: 4 },
            { type: 'longbowman', count: 2 },
        ],
    },
    gaer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },
            { type: 'elite_woad_raider', count: 4 },
            { type: 'longbowman', count: 2 },
        ],
    },
    // 印度与达罗毗荼·旃陀罗笈多 / 戒日王 / 频毗娑罗 / 达磨波罗 / 梵摩达 / 苏摩 软剑士与象弓精锐军团（鱼鳞阵 3+4+2：软剑士前卫 3 + 精锐软剑士主力 4 + 象弓骑兵 2）
    kongque: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },          // Row 0 前卫突击 = 达罗毗荼软剑士 3人（纯步兵·无马，持双刃软剑高速回旋）
            { type: 'elite_urumi_swordsman', count: 4 },    // Row 1 中军主力撕裂 = 达罗毗荼软剑士精锐 4人（主力钢带软剑旋斩破阵）
            { type: 'elephant_archer', count: 2 },          // Row 2 尾收远程压制 = 印度象弓骑兵 2头（战象背负箭楼高台抛射）
        ],
    },
    jieri: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    mojietuo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    boluo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    jiashi_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    sumo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    // 印度斯坦与德里苏丹·阿拉乌丁·卡尔吉 / 阿克巴大帝 古拉姆重装近卫与象弓精锐军团（鱼鳞阵 3+4+2：古拉姆前卫 3 + 精锐古拉姆主力 4 + 象弓骑兵 2）
    deli: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'ghulam', count: 3 },              // Row 0 前卫坚壁 = 印度斯坦古拉姆 3人（纯步兵·无马，持长枪重剑正面结阵）
            { type: 'elite_ghulam', count: 4 },        // Row 1 中军主力破阵 = 印度斯坦古拉姆精锐 4人（近卫铁甲主力强力破阵）
            { type: 'elephant_archer', count: 2 },     // Row 2 尾收远程压制 = 印度象弓骑兵 2头（战象背负箭楼高台抛射）
        ],
    },
    mowoer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'ghulam', count: 3 },
            { type: 'elite_ghulam', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    // 印度与锡克·兰季特·辛格 / 拉其特 / 哈里·辛格 飞轮掷手漫天破阵精锐军团（三角阵 2+3+4：重装长枪前卫 2 + 飞轮掷手 3 + 精锐飞轮掷手主力 4）
    xike: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },           // Row 0 尖刀坚壁 = 重装长枪兵 2人（纯步兵·无马，前排抗线拒马）
            { type: 'chakram_thrower', count: 3 },         // Row 1 中军投射 = 古吉拉特飞轮掷手 3人（纯步兵·无马，中距离回旋飞轮）
            { type: 'elite_chakram_thrower', count: 4 },   // Row 2 底边主力弹幕 = 古吉拉特飞轮掷手精锐 4人（纯步兵·无马，漫天飞轮破阵）
        ],
    },
    ahaomu: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'chakram_thrower', count: 3 },
            { type: 'elite_chakram_thrower', count: 4 },
        ],
    },
    pangzha: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'chakram_thrower', count: 3 },
            { type: 'elite_chakram_thrower', count: 4 },
        ],
    },
    // 迦太基与布匿·汉尼拔 / 哈米尔卡 战象践踏与标枪精锐军团（鱼鳞阵 3+4+2：战象前卫 3 + 精锐战象主力 4 + 掷矛手 2）
    buni: {
        formationMode: 'echelon',
        slots: [
            { type: 'skirmisher', count: 4 },                // 主力·宽线投射 = 掷矛手 4
            { type: 'spearman', count: 3 },                  // 中军接应 = 长矛兵 3
            { type: 'elite_war_elephant', count: 2 },        // 压阵巨兽 = 精锐战象 2（🔴 象只许 2 档）
        ],
    },
    feiniqi: {
        formationMode: 'echelon',
        slots: [
            { type: 'skirmisher', count: 4 },                // 主力·宽线投射 = 掷矛手 4
            { type: 'spearman', count: 3 },                  // 中军接应 = 长矛兵 3
            { type: 'elite_war_elephant', count: 2 },        // 压阵巨兽 = 精锐战象 2（🔴 象只许 2 档）
        ],
    },
    // 古埃及、赫梯与美索不达米亚·拉美西斯 / 穆瓦塔利 / 图特摩斯 / 卢伽尔扎克西 / 尼布甲尼撒 / 萨尔贡 / 沙姆希阿达德 古典双轮战车车阵军团（雁行阵 4+3+2：波斯持盾步兵 4 + 双轮战车精锐 3 + 双轮战车 2）
    heti: {
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // 主力·宽线齐射 = 弓兵 4（埃及／赫梯／亚述军队主体是大量弓手）
            { type: 'sparabara', count: 3 },                 // 中军接应 = 持盾步兵 3
            { type: 'war_chariot_ranged', count: 2 },        // 战车队 = 双轮远程战车 2（🔴 占人口只许 2 档；战车主武器是弓，非近战）
        ],
    },
    aiji: {
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // 主力·宽线齐射 = 弓兵 4（埃及／赫梯／亚述军队主体是大量弓手）
            { type: 'sparabara', count: 3 },                 // 中军接应 = 持盾步兵 3
            { type: 'war_chariot_ranged', count: 2 },        // 战车队 = 双轮远程战车 2（🔴 占人口只许 2 档；战车主武器是弓，非近战）
        ],
    },
    dibisi: {
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // 主力·宽线齐射 = 弓兵 4（埃及／赫梯／亚述军队主体是大量弓手）
            { type: 'sparabara', count: 3 },                 // 中军接应 = 持盾步兵 3
            { type: 'war_chariot_ranged', count: 2 },        // 战车队 = 双轮远程战车 2（🔴 占人口只许 2 档；战车主武器是弓，非近战）
        ],
    },
    sumeier: {
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // 主力·宽线齐射 = 弓兵 4（埃及／赫梯／亚述军队主体是大量弓手）
            { type: 'sparabara', count: 3 },                 // 中军接应 = 持盾步兵 3
            { type: 'war_chariot_ranged', count: 2 },        // 战车队 = 双轮远程战车 2（🔴 占人口只许 2 档；战车主武器是弓，非近战）
        ],
    },
    jialedi: {
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // 主力·宽线齐射 = 弓兵 4（埃及／赫梯／亚述军队主体是大量弓手）
            { type: 'sparabara', count: 3 },                 // 中军接应 = 持盾步兵 3
            { type: 'war_chariot_ranged', count: 2 },        // 战车队 = 双轮远程战车 2（🔴 占人口只许 2 档；战车主武器是弓，非近战）
        ],
    },
    yashu: {
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // 主力·宽线齐射 = 弓兵 4（埃及／赫梯／亚述军队主体是大量弓手）
            { type: 'sparabara', count: 3 },                 // 中军接应 = 持盾步兵 3
            { type: 'war_chariot_ranged', count: 2 },        // 战车队 = 双轮远程战车 2（🔴 占人口只许 2 档；战车主武器是弓，非近战）
        ],
    },
    guyashu: {
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // 主力·宽线齐射 = 弓兵 4（埃及／赫梯／亚述军队主体是大量弓手）
            { type: 'sparabara', count: 3 },                 // 中军接应 = 持盾步兵 3
            { type: 'war_chariot_ranged', count: 2 },        // 战车队 = 双轮远程战车 2（🔴 占人口只许 2 档；战车主武器是弓，非近战）
        ],
    },
    // 中南半岛·纳黎萱 / 阿奴律陀 / 阇耶跋摩 东南亚战象与步弓精锐军团（鱼鳞阵 3+4+2：战斗象前卫 3 + 精锐战斗象主力 4 + 步弓手 2）
    siam: {
        formationMode: 'echelon',
        slots: [
            { type: 'archer', count: 4 },                    // 主力·宽线齐射 = 步弓手 4（东南亚军队主体是征召弓手与步兵）
            { type: 'karambit_warrior', count: 3 },          // 中军接应 = 爪刀勇士 3
            { type: 'elite_battle_elephant', count: 2 },     // 压阵巨兽 = 精锐战斗象 2（🔴 象是王室精锐，少而精）
        ],
    },
    pagan: {
        formationMode: 'echelon',
        slots: [
            { type: 'archer', count: 4 },                    // 主力·宽线齐射 = 步弓手 4（东南亚军队主体是征召弓手与步兵）
            { type: 'karambit_warrior', count: 3 },          // 中军接应 = 爪刀勇士 3
            { type: 'elite_battle_elephant', count: 2 },     // 压阵巨兽 = 精锐战斗象 2（🔴 象是王室精锐，少而精）
        ],
    },
    chenla: {
        formationMode: 'echelon',
        slots: [
            { type: 'archer', count: 4 },                    // 主力·宽线齐射 = 步弓手 4（东南亚军队主体是征召弓手与步兵）
            { type: 'karambit_warrior', count: 3 },          // 中军接应 = 爪刀勇士 3
            { type: 'elite_battle_elephant', count: 2 },     // 压阵巨兽 = 精锐战斗象 2（🔴 象是王室精锐，少而精）
        ],
    },
    // 阿拉伯与近东·哈立德 / 曼苏尔 / 艾布苏富扬 / 齐亚德 骆驼弓骑精锐军团（三角阵 2+3+4：东方剑士前锋 2 + 骆驼弓骑 3 + 精锐骆驼弓骑主力 4）
    maidina: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },      // Row 0 尖刀先锋 = 东方剑士 2人（纯步兵·无马，弯刀前排坚壁抗线）
            { type: 'camel_archer', count: 3 },           // Row 1 冲击中坚 = 骆驼弓骑兵 3骑（大漠机动奔袭）
            { type: 'elite_camel_archer', count: 4 },     // Row 2 底边主力齐射 = 精锐骆驼弓骑兵 4骑（王牌精锐大漠重弓齐射）
        ],
    },
    abasi: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    gulaishi: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    alabo: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    // 小亚细亚·密特里达梯 / 克罗伊斯 / 迈达斯 / 狄奥多尔 古代重装近卫军精锐军团（鱼鳞阵 3+4+2：重装近卫前卫 3 + 重装近卫精锐主力 4 + 复合弓手 2）
    bendou_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },              // Row 0 前卫抗线 = 古代重装近卫军 3人（纯步兵·无马，重装铜铠大盾前线坚壁抗线）
            { type: 'elite_guardsman', count: 4 },        // Row 1 中军主力 = 古代重装近卫军精锐 4人（纯步兵·无马，王家近卫精锐长矛主力突击）
            { type: 'composite_bowman', count: 2 },       // Row 2 尾收远射 = 复合弓手 2人（纯步兵·无马，后排步弓远射压制）
        ],
    },
    ldiya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    fulijiya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    bitiniya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    // 古典希腊与黑海·阿里斯塔 / 阿历克塞 / 舒伦堡 希腊贵族骑兵与克里特神弓精锐军团（鱼鳞阵 3+4+2：贵族骑兵前卫 3 + 贵族骑兵精锐主力 4 + 克里特弓箭手 2）
    aiaoniya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },    // Row 0 前卫突击 = 希腊贵族骑兵 3骑（重装前锋破线）
            { type: 'elite_greek_cavalry', count: 4 },    // Row 1 中军主力 = 希腊贵族骑兵精锐 4骑（王牌精锐贵族重骑主力突贯决战）
            { type: 'cretan_archer', count: 2 },          // Row 2 尾收远射 = 克里特弓箭手 2人（纯步兵·无马，后方步弓压制）
        ],
    },
    bendou: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'elite_greek_cavalry', count: 4 },
            { type: 'cretan_archer', count: 2 },
        ],
    },
    kejila: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'elite_greek_cavalry', count: 4 },
            { type: 'cretan_archer', count: 2 },
        ],
    },
    // 西北印度与兴都库什·米南德 / 谢尔 / 艾哈迈德 什里瓦姆沙避箭神骑精锐军团（鱼鳞阵 3+4+2：什里瓦姆沙骑手前卫 3 + 什里瓦姆沙骑手精锐主力 4 + 步弓手 2）
    najie: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'shrivamsha_rider', count: 3 },        // Row 0 前卫突击 = 什里瓦姆沙骑手 3骑（大漠与高原神速先锋破阵）
            { type: 'elite_shrivamsha_rider', count: 4 },  // Row 1 中军主力 = 什里瓦姆沙骑手精锐 4骑（王牌避箭神骑主力突贯决战）
            { type: 'archer', count: 2 },                  // Row 2 尾收远射 = 步弓手 2人（纯步兵·无马，后方步弓压制）
        ],
    },
    fanyanna: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'shrivamsha_rider', count: 3 },
            { type: 'elite_shrivamsha_rider', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    dulan_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'shrivamsha_rider', count: 3 },
            { type: 'elite_shrivamsha_rider', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    // 扎扬王朝·特莱姆森（亚格姆拉森 · 三角阵 2+3+4：萨拉森马穆鲁克 2 + 柏柏尔标枪骑兵 3 + 柏柏尔骆驼弓骑主力 4）
    zhayan: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },      // Row 0 尖刀先锋 = 萨拉森马穆鲁克 2人
            { type: 'genitour', count: 3 },      // Row 1 冲击中坚 = 柏柏尔标枪骑兵 3人
            { type: 'camel_archer', count: 4 },  // Row 2 底边主力齐射 = 柏柏尔骆驼弓骑 4人
        ],
    },
    // 哈马德王朝·布佳亚（哈马德）
    hamade: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 阿格拉布王朝·凯鲁万（奥克巴）
    aguelabu: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 伊德里斯王朝·非斯（伊德里斯一世）
    yidelisi: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 穆拉比特王朝·马拉喀什（塔什芬）
    mulabite: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 巴巴里海岸·阿尔及尔（巴巴罗萨·海雷丁）
    babali: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 的黎波里塔尼亚·的黎波里（德拉古特）
    telibolisi: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 休达·直布罗陀（海峡哨塞）
    zhibuluotuo: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 中南半岛·占婆王国·制蓬峨 / 制旻 爪刀勇士与藤弓精锐军团（鱼鳞阵 3+4+2：爪刀勇士前卫 3 + 爪刀勇士精锐主力 4 + 藤弓兵 2）
    champa: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'karambit_warrior', count: 3 },        // Row 0 前卫突入 = 爪刀勇士 3人（纯步兵·无马，前排双持近战弯刃）
            { type: 'karambit_warrior_elite', count: 4 },  // Row 1 中军主力 = 爪刀勇士精锐 4人（纯步兵·无马，主力极速贴身近战突刺）
            { type: 'rattan_archer', count: 2 },           // Row 2 尾收远射 = 藤弓兵 2人（纯步兵·无马，后方步弓压制掩护）
        ],
    },
    zhancheng: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'karambit_warrior', count: 3 },
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
    },
    // 波美拉尼亚与波罗的海要塞·卡西米尔四世 奥布奇破甲战锤精锐军团（鱼鳞阵 3+4+2：战锤步兵前卫 3 + 战锤精锐主力 4 + 劲弩手 2）
    boumeilaniyan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'obuch', count: 3 },                   // Row 0 前卫破线 = 奥布奇战锤步兵 3人（纯步兵·无马，破甲战锤前卫破线）
            { type: 'elite_obuch', count: 4 },             // Row 1 中军主力 = 奥布奇战锤精锐 4人（纯步兵·无马，王牌重装战锤主力撕裂敌甲）
            { type: 'arbalest', count: 2 },                // Row 2 尾收远射 = 劲弩手 2人（纯步兵·无马，后方重型劲弩压制掩护）
        ],
    },
    // 中南半岛阿瓦王朝·思机法 拉塔战车车阵军团（雁行阵 4+3+2：步弓手主力 4 + 爪刀勇士 3 + 精锐拉塔战车 2）
    ava: {
        formationMode: 'echelon',
        slots: [
            { type: 'archer', count: 4 },          // 主力·宽线齐射 = 步弓手 4（东南亚军队主体是弓手）
            { type: 'karambit_warrior', count: 3 }, // 中军接应 = 爪刀勇士 3
            { type: 'elite_ratha_ranged', count: 2 }, // 战车 = 精锐拉塔战车 2（🔴 占人口只许 2 档）
        ],
    },
};

