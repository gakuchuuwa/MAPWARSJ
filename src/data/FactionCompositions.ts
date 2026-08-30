/**
 * 势力自定义军团方阵数据表 (Faction Legion Compositions)
 * 由独立军团编辑器 (http://localhost:5173/legion-editor.html) 生成与维护。
 *
 * 机制：
 * - key: factionId (如 'qin', 'lagoniya', 'buni', 'luoma_diguo')
 * - 若势力在此表中登记，军团生成与渲染优先使用此配置；
 * - 若未登记，自动回退到 18 大文化区默认方阵 (CULTURE_TIERS_MAP)。
 */

import type { FormationMode, NavalFormationMode } from '../types/CultureFormations';
import type { CompositionSlot } from '../types/LegionComposition';

export interface CustomFactionLegion {
    /** 军团名称（前中后三排组成的这支部队的名字，如「瓦兰吉卫队军团」）。
     *  🔴 与「精锐番号」（ExpeditionLegions 的福建水师/北府兵等）不是一回事，别混。 */
    legionName?: string;
    /** 军团种类（编辑器判型）：region 地区军团 / era 时代军团 / solo 个人军团；缺省按名字语义推断 */
    legionType?: 'region' | 'era' | 'solo';
    formationMode: FormationMode;
    slots: CompositionSlot[];
    /** 水战/航行时的舰队队形；缺省 = 'auto'（按船数自动，旧行为） */
    navalFormation?: NavalFormationMode;
}

export const FACTION_COMPOSITIONS: Record<string, CustomFactionLegion> = {
    // 秦国军团·天水/咸阳/长子/武关/骊山/商邑/番禺（司马错 / 白起 / 王翦 / 章邯 / 商鞅 / 赵佗 · 雁行阵 4+3+2：枪兵长 4 + 先秦远程战车 3 + 诸葛弩 2）
    qin: {
        legionName: "秦国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'kamayuk', count: 4 },                   // Row 0 前排·步兵前锋 = 枪兵长 4人
            { type: 'war_chariot_ranged', count: 3 },        // Row 1 中排 = 先秦远程战车 3乘
            { type: 'chukonu', count: 2 },                   // Row 2 后排压阵 = 诸葛弩 2人
        ],
    },
    xin: {
        legionName: "秦国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'kamayuk', count: 4 },
            { type: 'war_chariot_ranged', count: 3 },
            { type: 'chukonu', count: 2 },
        ],
    },
    wazhai: {
        legionName: "秦国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'kamayuk', count: 4 },
            { type: 'war_chariot_ranged', count: 3 },
            { type: 'chukonu', count: 2 },
        ],
    },
    "nanyue": {
        legionName: "秦国军团",
        formationMode: "echelon",
        slots: [
            { type: "kamayuk", count: 4 },
            { type: "war_chariot_ranged", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    // 韩国·雁行阵（4+3+2：与秦国同阵）
    han: {
        legionName: "韩卒劲弩军团",
        formationMode: 'echelon',
        slots: [
            { type: 'chukonu', count: 4 },                   // 主力·宽线齐射 = 劲弩手 4人
            { type: 'heavy_pikeman', count: 3 },             // 中军接应 = 长枪方阵 3人
            { type: 'war_chariot_ranged', count: 2 },        // 压阵战车 = 先秦远程战车 2乘
        ],
    },
    // 晋国·曲沃（先轸 · 晋中军 · 先秦战车大阵 · 雁行阵 4+3+2：长矛前阵 4 + 先秦战车 3 + 劲弩压阵 2）
    jin: {
        legionName: "秦国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'kamayuk', count: 4 },                   // Row 0 前排坚矛 = 枪兵长 4人（春秋长矛步兵列阵抗线）
            { type: 'war_chariot_ranged', count: 3 },        // Row 1 中排战车主力 = 先秦远程战车 3乘（晋中军春秋战车核心冲击）
            { type: 'chukonu', count: 2 },                   // Row 2 后排压阵齐射 = 劲弩手 2人（后排劲弩暴雨抛射）
        ],
    },
    // 大秦长城军团·高阙塞（蒙恬 · 长城烽火卫 · 鱼鳞阵 4+3+2：虎豹骑 4 + 先秦远程战车 3 + 古典骑射手 2）
    baiyang: {
        legionName: "大秦长城军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'tiger_rider', count: 4 },                      // Row 0 前卫突骑 = 虎豹骑 4骑（北逐匈奴前锋突骑）
            { type: 'war_chariot_ranged', count: 3 },               // Row 1 中军战车 = 先秦远程战车 3乘（塞外平原战车核心冲击）
            { type: 'antiquity_cavalry_archer', count: 2 },         // Row 2 尾收远射 = 古典骑射手 2骑（长城边防轻骑游射压制）
        ],
    },
    // 轻勇骑军团·嘉峪关/延恩/井陉关/襄武/平型关/文安/偏头关/轵关/涿邪山/巴里坤/居庸关/君子津（霍去病 / 卫青 / 韩信 / 李广 / 赵雍 / 公孙瓒 / 马芳 / 斛律光 / 窦宪 / 窦固 / 耿弇 / 魏尚 · 三角阵 2+3+4：虎豹骑 2 + 古典骑射手 3 + 重装古典骑射手 4）
    suzhou: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },                      // Row 0 尖刀突骑 = 虎豹骑 2骑（轻勇突击先锋）
            { type: 'antiquity_cavalry_archer', count: 3 },        // Row 1 中坚机动 = 古典骑射手 3骑（胡服轻骑环射）
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },  // Row 2 主力重射 = 重装古典骑射手 4骑（强弓重箭贯穿主力）
        ],
    },
    shuofang: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    xianyu: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    li_lx_d: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    lingqiu: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    hejian: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    linhu: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    jiyuan: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    jiluo_d: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    pulei: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    you: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    dongsheng: {
        legionName: "汉朝军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    han_d: {
        legionName: "赤帝军军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'jian_swordsman', count: 2 },      // Row 0 步兵前锋 = 刀剑手 2人
            { type: 'tiger_rider', count: 4 },         // Row 1 骑兵主力两翼合围 = 虎豹骑 4人
            { type: 'chukonu', count: 3 },             // Row 2 中军后排支援 = 诸葛弩 3人
        ],
    },
    // 曹魏·曹操 / 张辽 / 邓艾 / 司马懿 / 于禁 / 田豫 虎豹铁骑军团（鹤翼阵 2+4+3：魏武虎豹骑 2 + 魏武虎豹骑精锐 4 + 诸葛弩 3）
    cao_d: {
        legionName: "曹魏军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'tiger_rider', count: 2 },          // Row 0 前哨牵制 = 魏武虎豹骑 2骑
            { type: 'elite_tiger_cavalry', count: 4 },  // Row 1 铁骑主力两翼合围 = 魏武虎豹骑精锐 4骑
            { type: 'chukonu', count: 3 },              // Row 2 中军后排支援 = 诸葛弩 3人
        ],
    },
    "lu": {
        legionName: "庐州军团",
        formationMode: "crane_wing",
        slots: [
            { type: "jian_swordman_unshielded", count: 2 },
            { type: "elite_tiger_cavalry", count: 4 },
            { type: "chukonu", count: 3 },
        ],
    },
    wudu: {
        legionName: "曹魏军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'elite_tiger_cavalry', count: 4 },
            { type: 'chukonu', count: 3 },
        ],
    },
    sima_d: {
        legionName: "曹魏军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'elite_tiger_cavalry', count: 4 },
            { type: 'chukonu', count: 3 },
        ],
    },
    bozhou_d: {
        legionName: "曹魏军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'elite_tiger_cavalry', count: 4 },
            { type: 'chukonu', count: 3 },
        ],
    },
    // 白袍军团·虎牢关（陈庆之 · 白袍破阵纯骑军团 · 方形阵 3+3+3：精锐虎豹骑 3 + 精锐虎豹骑 3 + 精锐虎豹骑 3 / 9骑纯骑兵大阵）
    zhengzhou: {
        legionName: "白袍破阵纯骑军团",
        formationMode: 'square',
        slots: [
            { type: 'elite_tiger_cavalry', count: 3 },       // Row 0 前排 = 魏武虎豹骑精锐 3骑（白袍突骑先锋）
            { type: 'elite_tiger_cavalry', count: 3 },       // Row 1 中坚 = 魏武虎豹骑精锐 3骑（白袍铁骑中坚）
            { type: 'elite_tiger_cavalry', count: 3 },       // Row 2 后排 = 魏武虎豹骑精锐 3骑（白袍扫荡后卫）
        ],
    },
    // 先秦军团·朝歌/殷墟/岐山/孤竹/姑苏/临淄/云梦/会稽/安邑/邯郸/古北口/郯城/武关/即墨/曲阜/上海/商邑/重庆/铜鞮/竟陵/竹山（子受/妇好/姬发/孙武/司马穰苴/熊旅/勾践/吴起/廉颇/乐毅/孙膑/王翦/田单/曹刿/黄歇/商鞅/巴蔓子/羊舌职/鬬廉/庐戢黎 · 鱼鳞阵 3+4+2：华夏刀剑手 3 + 弓兵 4 + 先秦远程战车 2）
    yin: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },            // Row 0 前卫抗线 = 华夏刀剑手 3人（商周春秋戈盾甲士）
            { type: 'bowman', count: 4 },                    // Row 1 中军主力 = 弓兵 4人（先秦步弓手齐射）
            { type: 'war_chariot_ranged', count: 2 },        // Row 2 尾收战车 = 先秦远程战车 2乘（先秦驷马戎车压阵轰击）
        ],
    },
    shang: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    zhou: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    guzhu: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    wu: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    qi: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    "mi_chu": {
        legionName: "安陆军团",
        formationMode: "echelon",
        slots: [
            { type: "white_feather_guard", count: 4 },
            { type: "crossbowman", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    yue: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    wei: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    zhao: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    yan: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    dongxian: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    ruo: {
        legionName: "秦国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'kamayuk', count: 4 },
            { type: 'war_chariot_ranged', count: 3 },
            { type: 'chukonu', count: 2 },
        ],
    },
    jiaodong: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    kong_d: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    chunshen: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    shangzhou: {
        legionName: "秦国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'kamayuk', count: 4 },
            { type: 'war_chariot_ranged', count: 3 },
            { type: 'chukonu', count: 2 },
        ],
    },
    ba: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    yangshe: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    ruochu: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    yong: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
    },
    // ⚠ 例外（用户特批 2026-08-26）：神机营三排全火器，突破「三排最多一排特殊」规则——大明神机营本就是全火器营，历史特色保留
    // 大明帝国·北京（朱棣 / 徐达 / 于谦 / 戚继光 神机营军团 · 雁行阵 4+3+2：精锐火矛兵 4 + 重型火箭推车 3 + 手推炮 2）
    "ming_d": {
        legionName: "明军三大营军团",
        formationMode: "echelon",
        slots: [
            { type: "jian_swordman_unshielded", count: 4 },
            { type: "heavy_rocket_cart", count: 3 },
            { type: "iron_pagoda", count: 2 },
        ],
    },
    // 大明军团·潼关/郧阳/宁远（孙传庭 / 卢象升 / 袁崇焕 · 三角阵 2+3+4：火矛手 2 + 黑光铠骑兵 3 + 精锐火焰弓 4）
    sunqin: {
        legionName: "大明军团",
        formationMode: 'triangle',
        slots: [
            { type: 'fire_lancer', count: 2 },            // Row 0 前锋尖刀 = 火矛手 2人（突火枪前锋破坚）
            { type: 'hei_kuang', count: 3 },              // Row 1 中军铁骑 = 黑光铠骑兵 3骑（大明精锐重骑中坚突破）
            { type: 'elite_fire_archer', count: 4 },      // Row 2 底边主力 = 精锐火焰弓 4人（王牌火矢后排火力压制）
        ],
    },
    luming: {
        legionName: "大明军团",
        formationMode: 'triangle',
        slots: [
            { type: 'fire_lancer', count: 2 },
            { type: 'hei_kuang', count: 3 },
            { type: 'elite_fire_archer', count: 4 },
        ],
    },
    zu_d: {
        legionName: "大明军团",
        formationMode: 'triangle',
        slots: [
            { type: 'fire_lancer', count: 2 },
            { type: 'hei_kuang', count: 3 },
            { type: 'elite_fire_archer', count: 4 },
        ],
    },
    // 大金帝国·五国城/会宁（完颜宗弼 / 完颜陈和尚 · 女真军团 · 鹤翼阵 2+4+3：铁浮屠 2 + 精锐铁浮屠 4 + 重装骑射手 3）
    jurchen: {
        legionName: "女真军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'iron_pagoda', count: 2 },            // Row 0 前卫铁骑 = 铁浮屠 2骑（女真重甲铁骑前锋，如墙而进正面突贯）
            { type: 'elite_iron_pagoda', count: 4 },      // Row 1 中军主力 = 精锐铁浮屠 4骑（铁浮屠精锐重铠主战）
            { type: 'cav_archer_heavy', count: 3 },       // Row 2 后排 = 重装骑射手 3骑（重装骑射远程游射掩护）
        ],
    },
    // 金末忠孝军·真宁（完颜陈和尚 · 忠孝军飞火震天雷大阵 · 鱼鳞阵 4+3+2：铁浮图 4 + 火矛兵 3 + 掷弹兵 2）
    xiqin: {
        legionName: "忠孝军军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 4 },            // Row 0 前卫铁骑 = 女真铁浮屠 4骑（忠孝军精锐重铠铁骑，前锋雷霆冲击）
            { type: 'fire_lancer', count: 3 },            // Row 1 中军火矛 = 火矛手 3人（飞火枪突进，近距离喷火刺杀破阵）
            { type: 'grenadier', count: 2 },              // Row 2 尾收火器 = 掷弹兵 2人（震天雷铁罐火药弹，后排范围轰炸破坚）
        ],
    },
    // 满清军团·抚顺/赫图阿拉/盛京/吉林乌拉/呼伦贝尔/威远营/西宁（努尔哈赤 / 皇太极 / 多尔衮 / 阿桂 / 海兰察 / 年羹尧 / 岳钟琪 · 鱼鳞阵 3+4+2：女真铁浮屠 3 + 草原枪骑兵精锐 4 + 重装骑射手 2）
    "manzhou": {
        legionName: "满清军团",
        formationMode: "crescent",
        slots: [
            { type: "steppe_lancer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    "aisin_d": {
        legionName: "满清军团",
        formationMode: "crescent",
        slots: [
            { type: "steppe_lancer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    "manzhou_d": {
        legionName: "满清军团",
        formationMode: "crescent",
        slots: [
            { type: "steppe_lancer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    "agui": {
        legionName: "满清军团",
        legionType: "region",
        formationMode: "crescent",
        slots: [
            { type: "steppe_lancer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    "xingan": {
        legionName: "满清军团",
        legionType: "region",
        formationMode: "crescent",
        slots: [
            { type: "steppe_lancer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    "weiyuan": {
        legionName: "满清军团",
        formationMode: "crescent",
        slots: [
            { type: "steppe_lancer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    "qinghai": {
        legionName: "满清军团",
        formationMode: "crescent",
        slots: [
            { type: "steppe_lancer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    // 南宋·岳飞 / 韩世忠 / 孟珙 / 刘锜 火矛手军团（鱼鳞阵 3+4+2：精锐火矛手前卫 3 + 刀剑手主力 4 + 诸葛弩 2）
    "yanchuan_d": {
        legionName: "背嵬军军团",
        legionType: "solo",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_fire_lancer", count: 2 },
            { type: "elite_chukonu", count: 4 },
            { type: "elite_keshik", count: 3 },
        ],
    },
    "sizhou": {
        legionName: "南宋行营军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_fire_lancer", count: 2 },
            { type: "liao_dao", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "yingzhou_d": {
        legionName: "南宋行营军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_fire_lancer", count: 2 },
            { type: "liao_dao", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "zaoyang_d": {
        legionName: "南宋行营军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_fire_lancer", count: 2 },
            { type: "liao_dao", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "fengzhou": {
        legionName: "南宋行营军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_fire_lancer", count: 2 },
            { type: "liao_dao", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "hezhou": {
        legionName: "南宋行营军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_fire_lancer", count: 2 },
            { type: "liao_dao", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "changshaguo": {
        legionName: "南宋行营军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_fire_lancer", count: 2 },
            { type: "liao_dao", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "shenshi": {
        legionName: "南宋行营军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_fire_lancer", count: 2 },
            { type: "liao_dao", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "luoping": {
        legionName: "南宋行营军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_fire_lancer", count: 2 },
            { type: "liao_dao", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    // 赵宋军团·开封及宋将（赵匡胤 / 杨业 / 杨延昭 / 狄青 / 种世衡 / 种师道 / 王韶 / 宗泽 / 韩世忠 / 文天祥 · 鱼鳞阵 3+4+2：火矛兵 3 + 火矛兵精锐主力 4 + 火焰弓手 2）
    "song": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "heng1": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "changshan": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "zhai_han": {
        legionName: "翟国军团",
        legionType: "solo",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "yanzhou": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "huan": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "didao": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "qing": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "xiangzhou": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    // 蜀汉·刘备 / 诸葛亮 / 关羽 / 张飞 / 赵云 / 马超 / 姜维 / 王平 / 张嶷 / 廖化 / 严颜 白毦兵精锐军团（鱼鳞阵 3+4+2：白毦兵前卫 3 + 精锐白毦兵主力 4 + 诸葛弩 2）
    "shu": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "huizhou_d": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "chu": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "langzhou": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "jingmen": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "cangsong": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "qingqiang": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "yangzhou": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "yueyi": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "lizhou_d": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "fu_zhou": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    // 匈牙利王国·布达佩斯（马加什一世 · 马扎尔军团 · 鱼鳞阵 3+4+2：马扎尔骠骑 3 + 精锐马扎尔骠骑 4 + 骑射手 2）
    mazhaer: {
        legionName: "马扎尔军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'magyar_huszar', count: 3 },        // Row 0 前排 = 马扎尔骠骑兵 3骑（匈牙利轻骑突进开路）
            { type: 'elite_magyar_huszar', count: 4 },  // Row 1 中军主力 = 精锐马扎尔骠骑兵 4骑（精锐骠骑主战突贯）
            { type: 'cav_archer', count: 2 },           // Row 2 后排 = 骑射手 2骑（骑射游走远程袭扰）
        ],
    },
    // 奥斯曼帝国·布尔萨（穆罕默德二世 · 三角阵 2+3+4：土耳其禁卫军 2 + 土耳其禁卫军精锐 3 + 奥斯曼皇家禁卫军主力 4）
    osman: {
        legionName: "土耳其军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'steppe_lancer', count: 2 },           // Row 0 前卫 = 草原枪骑兵 2骑（草原枪骑兵突击开路）
            { type: 'cav_archer_heavy', count: 4 },        // Row 1 中军主力 = 重装骑射手 4骑（骑射手重装主力游射）
            { type: 'elite_janissary', count: 3 },         // Row 2 后排 = 精锐苏丹亲兵 3人（土耳其禁卫军精锐火枪）
        ],
    },
    // 草原与中亚诸大汗·怯薛铁骑军团（鱼鳞阵 3+4+2：怯薛军前卫 3 + 精锐怯薛军主力 4 + 蒙古突骑 2）
    // 包含：成吉思汗、拔都、忽必烈、帖木儿、旭烈兀、速不台、木华黎、也速该、札木合、也先、噶尔丹、昔班尼、巴布尔、突厥大汗等
    menggu_d: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },          // Row 0 前卫突破 = 鞑靼怯薛军 3骑
            { type: 'steppe_lancer', count: 2 },   // Row 1 中军 = 草原枪骑兵 2骑（草原枪骑兵接应）
            { type: 'mangudai_elite', count: 4 },  // Row 2 底边主力 = 精锐蒙古突骑 4骑（蒙古突骑精锐主力游射）
        ],
    },
    jinzhang: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    yuan_d: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    // 帖木儿帝国·撒马尔罕（帖木儿 · 蒙古军团 · 偃月阵 3+2+4：怯薛军 3 + 草原枪兵 2 + 精锐蒙古突骑 4）
    tiemuer: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },              // Row 0 前卫突骑 = 鞑靼怯薛军 3骑（前沿突击尖刀）
            { type: 'steppe_lancer', count: 2 },       // Row 1 中军 = 草原枪骑兵 2骑（草原枪骑兵接应）
            { type: 'mangudai_elite', count: 4 },      // Row 2 底边主力 = 精锐蒙古突骑 4骑（高机动轻骑精锐游射压制）
        ],
    },
    asaibaijiang: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    wuliangha: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    jalair: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    kiyad: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    zhadalan: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    wala: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    oirat_ming: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    an: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    babuer: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    da_yuan: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    chahar: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    zhaowu: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    manghuti: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    khoshut: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    yilihanguo_d: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    yilihanguo: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    salai: {
        legionName: "蒙古军团",
        formationMode: 'crescent',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    // 马其顿·亚历山大帝国军团（雁行阵 4+3+2：马其顿方阵兵 4 + 伙伴骑兵 3 + 克里特弓手 2）
    "maqidun": {
        legionName: "马其顿军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "cretan_archer", count: 2 },
            { type: "companion_cavalry", count: 3 },
        ],
    },
    // 托勒密（亚历山大旧部，套用亚历山大帝国军团配置）
    "tuolemi": {
        legionName: "马其顿军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "cretan_archer", count: 2 },
            { type: "companion_cavalry", count: 3 },
        ],
    },
    // 塞琉古帝国（安提俄基亚 · 塞琉古一世/安条克，银盾方阵体系）
    "sailiugu": {
        legionName: "马其顿军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "cretan_archer", count: 2 },
            { type: "companion_cavalry", count: 3 },
        ],
    },
    // 佩尔加蒙（欧迈尼斯 · 亚历山大王家秘书长与近卫方阵统帅）
    "pajiama": {
        legionName: "马其顿军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "cretan_archer", count: 2 },
            { type: "companion_cavalry", count: 3 },
        ],
    },
    // 贝雷尼斯·红海东非要塞（达格纳詹 · 东非阿克苏姆双曲弯刀与御驾巨象战阵 · 鱼鳞阵 4+3+2：弯刀勇士 4 + 精锐弯刀勇士 3 + 御驾战象 2）
    "beileinisi": {
        legionName: "托勒密海军军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_shotel_warrior", count: 3 },
            { type: "pattiyoda_longbowman", count: 4 },
            { type: "dagnajan_elephant", count: 2 },
        ],
    },
    // 昔兰尼加（班加西 · 托勒密一世养子马加斯）
    "jileinaijia": {
        legionName: "马其顿军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "cretan_archer", count: 2 },
            { type: "companion_cavalry", count: 3 },
        ],
    },
    // 拉哥尼亚·斯巴达（列奥尼达 · 方形阵 3+3+3：全斯巴达希皮乌斯 300 勇士近卫阵）
    lagoniya: {
        legionName: "斯巴达重装军团",
        formationMode: 'square',
        slots: [
            { type: 'hippeus', count: 3 },             // Row 0 前排 = 斯巴达希皮乌斯 3人（纯步兵·无马，斯巴达国王300近卫死士）
            { type: 'hippeus', count: 3 },             // Row 1 中坚 = 斯巴达希皮乌斯 3人（纯步兵·无马，全钢青铜大盾同袍誓死不退）
            { type: 'hippeus', count: 3 },             // Row 2 后排 = 斯巴达希皮乌斯 3人（纯步兵·无马，温泉关300勇士九宫死守）
        ],
    },
    // 伊庇鲁斯王国·安布拉基亚（皮洛士大帝 · 战象与希腊长枪铁骑大阵 · 鱼鳞阵 4+3+2：希腊雇佣重步兵 4 + 冲击重骑兵 3 + 战象 2）
    yipilusi: {
        legionName: "皮洛士战象军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 4 },   // Row 0 前卫坚壁 = 希腊雇佣重步兵 4人（纯步兵·无马，青铜圆盾重长枪抗线拒马）
            { type: 'shock_cavalry', count: 3 },       // Row 1 中军铁骑 = 冲击重骑兵 3骑（皮洛士近卫贵族突击铁骑中坚冲击）
            { type: 'war_elephant', count: 2 },        // Row 2 尾收战象 = 战象 2头（皮洛士远征东方战象，后排践踏敌阵）
        ],
    },
    // 底比斯圣队军团·底比斯（伊巴密浓达 · 鱼鳞阵 3+4+2：希腊重装步兵 3 + 底比斯圣队主力 4 + 色雷斯标枪手 2）
    boootiya: {
        legionName: "底比斯圣队军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hoplite', count: 3 },              // Row 0 前卫抗线 = 希腊重装步兵 3人（青铜圆盾长枪正面抗线）
            { type: 'sacred_band', count: 4 },          // Row 1 中军主力 = 底比斯圣队 4人（300同袍死士王牌突击主力）
            { type: 'thracian_peltast', count: 2 },     // Row 2 尾收远程 = 色雷斯标枪手 2人（希腊高穿透投枪两翼掩护）
        ],
    },
    // 叙拉古·锡拉库萨（阿加索克利斯 / 狄奥尼修斯一世 · 机械腹弩与雇佣重装步兵军团 · 鱼鳞阵 4+3+2：希腊雇佣重步兵 4 + 冲击重骑兵 3 + 机械腹弩手 2）
    xilagu: {
        legionName: "机械腹弩与雇佣重装步兵军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 4 },   // Row 0 前卫坚壁 = 希腊雇佣重步兵 4人（纯步兵·无马，叙拉古青铜圆盾重长枪结阵抗线）
            { type: 'shock_cavalry', count: 3 },       // Row 1 中军铁骑 = 冲击重骑兵 3骑（叙拉古贵族重装铁骑中坚机动策应）
            { type: 'gastraphetes', count: 2 },        // Row 2 尾收机械重弩 = 希腊机械腹弩手 2人（纯步兵·无马，叙拉古独门机械重弩超远距离高穿透齐射）
        ],
    },
    // 罗得岛·罗得城（维拉雷 · 罗得岛铅弹投石与海岛要塞军团 · 鱼鳞阵 4+3+2：希腊雇佣重步兵 4 + 十字军骑士 3 + 罗得岛投石兵 2）
    luodesi: {
        legionName: "罗得岛铅弹投石与海岛要塞军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 4 },   // Row 0 前卫坚壁 = 希腊雇佣重步兵 4人（纯步兵·无马，罗得岛要塞青铜圆盾重枪死守抗线）
            { type: 'crusader_knight', count: 3 },     // Row 1 中军铁骑 = 十字军骑士 3骑（罗得岛医院骑士团重装铁骑中坚策应）
            { type: 'rhodian_slinger', count: 2 },     // Row 2 尾收超远投石 = 罗得岛投石兵 2人（纯步兵·无马，世界最远射程重铅弹超视距精准压制）
        ],
    },
    // 雅典·雅典城（地米斯托克利 · 鱼鳞阵 3+4+2：希腊重装步兵 3 + 雅典将军卫队 4 + 克里特弓箭手 2）
    xila: {
        legionName: "雅典海军军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hoplite', count: 3 },              // Row 0 前卫抗线 = 希腊重装步兵 3人（雅典公民大盾长枪方阵正面抗线）
            { type: 'strategos', count: 4 },            // Row 1 中军主力 = 雅典将军卫队 4人（地米斯托克利十将军王牌亲军核心）
            { type: 'elite_antiquity_skirmisher', count: 2 },  // Row 2 尾收远程 = 古典掷矛手高级 2人（古典散兵反远程压制）
        ],
    },
    // 日本战国·织田信长军团（鱼鳞阵 3+4+2：日本武士 3 + 精锐武士 4 + 手炮手 2）
    owari: {
        legionName: "织田信长军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'samurai', count: 3 },                   // 前卫 = 武士 3
            { type: 'samurai_elite', count: 4 },             // 主力 = 精锐武士 4
            { type: 'hand_cannoneer', count: 2 },            // 压阵铁炮 = 手炮手 2（🔴 热兵器只许 2 档）
        ],
    },
    // 战国武士军团·甲斐/上田/姬路/仙台/越后（武田信玄 / 真田幸村 / 丰臣秀吉 / 伊达政宗 / 上杉谦信 · 鱼鳞阵 3+4+2：黑光铠骑兵 3 + 精锐日本武士 4 + 藤弓手 2）
    kai: {
        legionName: "日本战国军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hei_kuang', count: 3 },                 // Row 0 前卫铁骑 = 黑光铠骑兵 3骑（战国赤备突骑先锋）
            { type: 'samurai_elite', count: 4 },             // Row 1 中军主力 = 精锐日本武士 4人（大铠近卫武士主力突破）
            { type: 'rattan_archer', count: 2 },             // Row 2 尾收远射 = 藤弓手 2人（战国竹藤长弓精准掩护）
        ],
    },
    sanada_d: {
        legionName: "日本战国军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hei_kuang', count: 3 },
            { type: 'samurai_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
    },
    hashiba: {
        legionName: "日本战国军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hei_kuang', count: 3 },
            { type: 'samurai_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
    },
    date_d: {
        legionName: "日本战国军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hei_kuang', count: 3 },
            { type: 'samurai_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
    },
    echigo: {
        legionName: "日本战国军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hei_kuang', count: 3 },
            { type: 'samurai_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
    },
    // 伊贺·忍者军团（方阵 3+3+3：忍者 3 + 忍者 3 + 忍者 3）
    iga_d: {
        legionName: "忍者军团",
        formationMode: 'square',
        slots: [
            { type: 'ninja', count: 3 },        // Row 0 前排 = 忍者 3人
            { type: 'ninja', count: 3 },        // Row 1 中坚 = 忍者 3人
            { type: 'ninja', count: 3 }         // Row 2 后排 = 忍者 3人
        ],
    },
    // 廓尔喀王国·加德满都（巴都尔萨野 · 廓尔喀弯刀军团 · 鱼鳞阵 4+3+2：精锐弯刀勇士 4 + 弯刀勇士 3 + 复合弓手 2）
    gurkha: {
        legionName: "廓尔喀弯刀军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_shotel_warrior', count: 4 },      // Row 0 前卫主力 = 精锐弯刀勇士 4人（廓尔喀库克里反曲弯刀死斗突击）
            { type: 'shotel_warrior', count: 3 },            // Row 1 中军接应 = 弯刀勇士 3人（山地反曲弯刀近卫中坚突破）
            { type: 'composite_bowman', count: 2 },          // Row 2 尾收远射 = 复合弓箭手 2人（喜马拉雅山地精锐复合弓精准掩护）
        ],
    },
    // 萨伏伊公国·尚贝里（阿梅迪奥六世 · 先锋重步兵与萨伏伊铁骑大阵 · 鱼鳞阵 4+3+2：先锋重装步兵 4 + 重装骑士 3 + 劲弩手 2）
    safuyi: {
        legionName: "萨伏伊重骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'vanguard', count: 4 },            // Row 0 前卫主力 = 先锋重装步兵 4人（纯步兵·无马，阿尔卑斯山地重装长矛死斗破坚）
            { type: 'cavalier', count: 3 },            // Row 1 中军铁骑 = 重装骑士 3骑（萨伏伊圣天使报喜骑士团中坚冲击）
            { type: 'arbalest', count: 2 },            // Row 2 尾收重弩 = 劲弩手 2人（纯步兵·无马，山地高穿透强弩射击掩护）
        ],
    },
    // 塔兰托·大希腊古都（阿契塔 · 塔兰丁标枪轻骑与重步兵方阵 · 鱼鳞阵 4+3+2：希腊雇佣重步兵 4 + 塔兰丁骑兵 3 + 罗得岛投石兵 2）
    talanduo: {
        legionName: "塔兰托骑兵军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 4 },   // Row 0 前卫长枪坚壁 = 希腊雇佣重步兵 4人（纯步兵·无马，大希腊青铜圆盾长枪抗线）
            { type: 'tarantine_cavalry', count: 3 },   // Row 1 中军标枪突击 = 塔兰丁骑兵 3骑（大希腊王牌机动穿甲轻标枪轻骑）
            { type: 'rhodian_slinger', count: 2 },     // Row 2 尾收超远投石 = 罗得岛投石兵 2人（纯步兵·无马，地中海重铅弹超视距压制）
        ],
    },
    // 罗马帝国·恺撒 / 君士坦丁 / 尤里安 / 庞培（罗马军团 · 雁行阵 4+3+2：罗马军 4 + 精锐百夫长 3 + 精锐掷矛手 2）
    luoma_diguo: {
        legionName: "罗马军团",
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },           // Row 0 前排大盾宽线 = 罗马军 4人（纯步兵·无马，矩形大盾短剑正面推进）
            { type: 'elite_centurion', count: 3 },     // Row 1 中军铁骑突击 = 精锐百夫长 3骑（罗马百夫长精锐伴随重骑中坚突贯）
            { type: 'elite_skirmisher', count: 2 },    // Row 2 尾收标枪压制 = 精锐掷矛手 2人（重标枪破盾抛射）
        ],
    },
    gaolu_luoma: {
        legionName: "法兰克军团",
        formationMode: 'crescent',
        slots: [
            { type: 'champion', count: 3 },
            { type: 'paladin', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
        ],
    },
    mozeer: {
        legionName: "罗马军团",
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'elite_centurion', count: 3 },
            { type: 'elite_skirmisher', count: 2 },
        ],
    },
    aersasi: {
        legionName: "罗马军团",
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'elite_centurion', count: 3 },
            { type: 'elite_skirmisher', count: 2 },
        ],
    },
    qiliqiya: {
        legionName: "罗马军团",
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'elite_centurion', count: 3 },
            { type: 'elite_skirmisher', count: 2 },
        ],
    },
    // 阿契美尼德·波斯帝国军团（大流士 · 鱼鳞阵 3+4+2：精锐战象 3 + 萨瓦尔 4 + 骑射手 2）
    aqimeinide: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },   // Row 0 前卫 = 波斯战象精锐 3头（象兵碾压前阵）
            { type: 'savar', count: 4 },                // Row 1 中军主力 = 萨瓦尔重骑 4骑（萨珊铁骑重锤冲击）
            { type: 'cav_archer', count: 2 },           // Row 2 尾收 = 骑射手 2骑（弓骑游射掩护）
        ],
    },
    // 波斯帝国军团（沙普尔大帝 · 尼沙布尔）
    aba: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 萨非帝国·伊斯法罕/加兹温（阿拔斯大帝 / 艾斯迈尔 · 奇兹尔巴什红头军团 · 鹤翼阵 2+4+3：古拉姆近卫 2 + 奇兹尔巴什红头战士主力 4 + 火枪兵 3）
    safawei_d: {
        legionName: "萨法维军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'ghulam', count: 2 },            // Row 0 前哨抗线 = 古拉姆近卫战士 2人（高加索重装死士抗线）
            { type: 'qizilbash_warrior', count: 4 }, // Row 1 两翼主力 = 奇兹尔巴什红头战士 4骑（萨非核心红头狂热战骑雷霆突贯）
            { type: 'hand_cannoneer', count: 3 },    // Row 2 后排火力 = 火枪兵 3人（波斯正规火枪军团排枪齐射）
        ],
    },
    safawei: {
        legionName: "萨法维军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'ghulam', count: 2 },
            { type: 'qizilbash_warrior', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
        ],
    },
    // 安息波斯帝国（阿尔沙克 · 尼萨）
    ansxi: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 苏伦家族（苏伦 · 法拉）
    delan: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 卡伦家族（苏赫拉 · 图斯）
    kalan: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 米底王国（戴奥凯斯 · 哈马丹）
    midi: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 萨法尔王朝（雅库布 · 博斯特）
    xisi: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 埃兰古波斯（舒特鲁克 · 苏萨）
    ailan: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 萨尔巴达尔（拉扎克 · 白哈格）
    saerbadaer: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 库米斯（阿尔普 · 达姆甘）
    kumisi: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 哈利（戈达尔兹 · 萨拉赫斯）
    hali: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 巴哈尔兹（盖瓦姆 · 泰巴德）
    baha: {
        legionName: "波斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_war_elephant', count: 3 },
            { type: 'savar', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 粟特王国·瓦拉赫沙（德瓦什提奇 · 鹤翼阵 2+4+3：持盾步兵 2 + 粟特甲胄铁骑主力 4 + 古典重装骑射 3）
    sogdian: {
        legionName: "粟特商队护卫军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'sparabara', count: 2 },                      // Row 0 前哨诱敌 = 波斯持盾步兵 2人（大盾结阵抗线吸引火力）
            { type: 'sogdian_cataphract', count: 4 },            // Row 1 两翼绝对主力 = 粟特甲胄骑兵 4骑（全人马披挂重装具装铁骑合围突破）
            { type: 'antiquity_heavy_cavalry_archer', count: 3 }, // Row 2 中军后排支援 = 古典重装骑射手 3骑（重装弓骑兵漫天箭雨压制）
        ],
    },
    // 波兰王国·华沙（雅盖沃 · 波兰军团 · 雁行阵 4+3+2：精锐奥布奇战锤兵 4 + 波兰翼骑兵 3 + 骑射手 2）
    bolan: {
        legionName: "波兰军团",
        formationMode: 'echelon',
        slots: [
            { type: 'elite_obuch', count: 4 },    // Row 0 前排主力 = 精锐奥布奇战锤兵 4人（步兵破甲重锤前锋）
            { type: 'winged_hussar', count: 3 },  // Row 1 中排冲锋 = 波兰翼骑兵 3骑（翼骑兵冲击中坚）
            { type: 'cav_archer', count: 2 },     // Row 2 后排游射 = 骑射手 2骑（弓骑火力掩护）
        ],
    },
    // 皮雅斯特王朝·克拉科夫（卡齐米日大帝）
    piyasite: {
        legionName: "波兰军团",
        formationMode: 'echelon',
        slots: [
            { type: 'elite_obuch', count: 4 },
            { type: 'winged_hussar', count: 3 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 大波兰·波兹南（普热梅斯二世）
    dabolan: {
        legionName: "波兰军团",
        formationMode: 'echelon',
        slots: [
            { type: 'elite_obuch', count: 4 },
            { type: 'winged_hussar', count: 3 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 立陶宛大公国·维尔纽斯 / 涅曼·格罗德诺（格迪米纳斯 / 维托夫特 · 立陶宛军团 · 鱼鳞阵 3+4+2：波兰翼骑兵 3 + 精锐烈堤司 4 + 骑射手 2）
    litaowan: {
        legionName: "立陶宛军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'winged_hussar', count: 3 },   // Row 0 前卫 = 波兰翼骑兵 3骑（翼骑兵突击）
            { type: 'elite_leitis', count: 4 },    // Row 1 中军主力 = 精锐烈堤司 4骑（无视护甲之王主力突破）
            { type: 'cav_archer', count: 2 },      // Row 2 尾收 = 骑射手 2骑（弓骑游射）
        ],
    },
    nieman: {
        legionName: "立陶宛军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'winged_hussar', count: 3 },
            { type: 'elite_leitis', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    // 条顿骑士团·柯尼斯堡（容金根 · 鱼鳞阵 3+4+2：条顿武士 3 + 精锐条顿武士主力 4 + 十字军骑士 2）
    tiaodun_qishi: {
        legionName: "条顿军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'teutonic_knight', count: 3 },        // Row 0 前卫抗线 = 条顿武士 3人（全钢板甲双手阔剑步行铁罐头）
            { type: 'elite_teutonic_knight', count: 4 },  // Row 1 中军主力 = 条顿武士精锐 4人（王牌重甲剑士主力决战）
            { type: 'crusader_knight', count: 2 },        // Row 2 尾收铁骑 = 十字军骑士 2骑（圣殿战马重骑后排策应）
        ],
    },
    // 圣殿骑士团·阿卡（莫莱 · 圣殿骑士团军团 · 鱼鳞阵 4+3+2：圣殿楷模武士 4 + 十字军骑士 3 + 劲弩手 2）
    "shengdian_qishi": {
        legionName: "圣殿骑士团军团",
        formationMode: "fish_scale",
        slots: [
            { type: "halberdier", count: 3 },
            { type: "crusader_knight", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    // 宝剑骑士团·里加（阿尔伯特）
    baojian_qishi: {
        legionName: "条顿军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'teutonic_knight', count: 3 },
            { type: 'elite_teutonic_knight', count: 4 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    // 利沃尼亚骑士团·塔林（普雷特贝格）
    liwoniya: {
        legionName: "条顿军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'teutonic_knight', count: 3 },
            { type: 'elite_teutonic_knight', count: 4 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    // 拜占庭圣骑兵军团·君士坦丁堡/干尼亚（巴西尔二世 / 福卡斯 · 鱼鳞阵 3+4+2：拜占庭圣骑兵 3 + 拜占庭圣骑兵精锐主力 4 + 重装骑射手 2）
    baizanting: {
        legionName: "拜占庭军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'cataphract', count: 3 },        // Row 0 前卫 = 拜占庭圣骑兵 3骑（具装重铠甲骑兵前锋突破）
            { type: 'elite_cataphract', count: 4 },  // Row 1 中军突破主力 = 拜占庭圣骑兵精锐 4骑（帝国王牌圣骑兵重锤冲击）
            { type: 'cav_archer_heavy', count: 2 },  // Row 2 尾收压阵 = 重装骑射手 2骑（拜占庭重装弓骑兵两翼火力掩护）
        ],
    },
    kelite: {
        legionName: "拜占庭军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'cataphract', count: 3 },
            { type: 'elite_cataphract', count: 4 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },
    // 陶里卡·赫尔松涅斯（阿斯普尔 · 萨尔马提亚具装铁骑军团 · 鹤翼阵 2+4+3：古典长矛兵 2 + 萨尔马提亚重骑主力 4 + 古典重装骑射 3）
    taolika: {
        legionName: "萨尔马提亚具装铁骑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'antiquity_spearman', count: 2 },              // Row 0 步兵前哨 = 古典长矛兵 2人（纯步兵·无马，黑海希腊长盾结阵抗线）
            { type: 'sarmatian', count: 4 },                       // Row 1 两翼绝对主力 = 萨尔马提亚重骑兵 4骑（人马俱装鱼鳞铁甲冲击重骑大合围）
            { type: 'antiquity_heavy_cavalry_archer', count: 3 },  // Row 2 中军后排支援 = 古典重装骑射手 3骑（斯基泰-萨尔马提亚复合强弓漫天箭雨）
        ],
    },
    // 特洛伊卫队军团·特洛伊（赫克托耳 · 鱼鳞阵 3+4+2：希腊雇佣重步兵 3 + 近卫军精锐 4 + 弓兵 2）
    teluoyi: {
        legionName: "特洛伊卫队军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 3 },    // Row 0 前卫抗线 = 希腊雇佣重步兵 3人（青铜大盾结阵御敌）
            { type: 'elite_guardsman', count: 4 },      // Row 1 中军主力 = 近卫军精锐 4人（赫克托耳重装近卫精锐主力）
            { type: 'bowman', count: 2 },               // Row 2 尾收远程 = 弓兵 2人（步弓手远距齐射）
        ],
    },
    // 马耳他·圣约翰（瓦莱特 · 马耳他医院骑士军团 · 鱼鳞阵 3+4+2：重装长枪兵 3 + 十字军圣骑士 4 + 火枪兵 2）
    maerta_qishi: {
        legionName: "马耳他医院骑士军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 3 },     // Row 0 前卫坚壁 = 重装长枪兵 3人（大盾长矛要塞拒马抗线）
            { type: 'crusader_knight', count: 4 },   // Row 1 中军主力 = 十字军圣骑士 4人（医院骑士团白十字重铠主力突破）
            { type: 'hand_cannoneer', count: 2 },    // Row 2 要塞火力 = 火枪兵 2人（城垒火绳枪齐射火力压制）
        ],
    },
    // 不列颠·黑太子爱德华 / 阿尔弗雷德大帝（不列颠军团 · 锥形阵 2+3+4：冠军剑士 2 + 长弓兵 3 + 精锐长弓兵 4）
    aquidan: {
        legionName: "不列颠军团",
        formationMode: 'triangle',
        slots: [
            { type: 'champion', count: 2 },          // Row 0 尖刀 = 冠军剑士 2人（重剑前锋）
            { type: 'longbowman', count: 3 },        // Row 1 中坚 = 长弓兵 3人（紫杉长弓齐射）
            { type: 'longbowman_elite', count: 4 },  // Row 2 底边主力 = 精锐长弓兵 4人（长弓火力核心）
        ],
    },
    anggelu: {
        legionName: "不列颠军团",
        formationMode: 'triangle',
        slots: [
            { type: 'champion', count: 2 },
            { type: 'longbowman', count: 3 },
            { type: 'longbowman_elite', count: 4 },
        ],
    },
    // 法兰克与法兰西·查理曼 / 查理马特 / 查理七世 / 吉尔德雷斯（法兰克军团 · 偃月阵 3+2+4：冠军剑士 3 + 游侠 2 + 精锐掷斧兵 4）
    jialuolin: {
        legionName: "法兰克军团",
        formationMode: 'crescent',
        slots: [
            { type: 'champion', count: 3 },               // Row 0 前卫重剑 = 冠军剑士 3人
            { type: 'paladin', count: 2 },                // Row 1 中排驰援 = 游侠圣骑士 2人
            { type: 'elite_throwing_axeman', count: 4 },  // Row 2 底边主力 = 法兰克掷斧兵精锐 4人
        ],
    },
    falanji: {
        legionName: "法兰克军团",
        formationMode: 'crescent',
        slots: [
            { type: 'champion', count: 3 },
            { type: 'paladin', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
        ],
    },
    gaolu: {
        legionName: "法兰克军团",
        formationMode: 'crescent',
        slots: [
            { type: 'champion', count: 3 },
            { type: 'paladin', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
        ],
    },
    aermolika: {
        legionName: "法兰克军团",
        formationMode: 'crescent',
        slots: [
            { type: 'champion', count: 3 },
            { type: 'paladin', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
        ],
    },
    // 西班牙·熙德 / 费尔南多三世 / 阿方索十一世等 西班牙大方阵与希内特中世纪圣骑战阵（鱼鳞阵 4+3+2：重装长枪兵 4 + 精锐标枪骑兵 3 + 十字军圣骑士 2）
    balunxiya: {
        legionName: "西班牙军团",
        formationMode: 'crescent',
        slots: [
            { type: 'halberdier', count: 3 },          // Row 0 前卫 = 长戟兵 3人（长戟方阵抗骑开路）
            { type: 'hand_cannoneer', count: 2 },      // Row 1 中军 = 火枪手 2人（火枪齐射）
            { type: 'elite_conquistador', count: 4 },  // Row 2 底边主力 = 精锐西班牙征服者 4骑（征服者火枪骑主力骑射）
        ],
    },
    guadaer: {
        legionName: "西班牙军团",
        formationMode: 'crescent',
        slots: [
            { type: 'halberdier', count: 3 },
            { type: 'hand_cannoneer', count: 2 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    kasidiliya: {
        legionName: "西班牙军团",
        formationMode: 'crescent',
        slots: [
            { type: 'halberdier', count: 3 },
            { type: 'hand_cannoneer', count: 2 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    leangongguo: {
        legionName: "西班牙军团",
        formationMode: 'crescent',
        slots: [
            { type: 'halberdier', count: 3 },
            { type: 'hand_cannoneer', count: 2 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    xigete: {
        legionName: "西班牙军团",
        formationMode: 'crescent',
        slots: [
            { type: 'halberdier', count: 3 },
            { type: 'hand_cannoneer', count: 2 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    alagong: {
        legionName: "西班牙军团",
        formationMode: 'crescent',
        slots: [
            { type: 'halberdier', count: 3 },
            { type: 'hand_cannoneer', count: 2 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    // 基辅罗斯·基辅/切尔尼戈夫（雅罗斯拉夫 / 勇士姆斯季斯拉夫 · 瓦兰吉卫队军团 · 鱼鳞阵 3+4+2：诺斯狂暴战士 3 + 维京狂战士精锐 4 + 斯拉夫贵族铁骑 2）
    "luosi": {
        legionName: "瓦兰吉军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_berserk", count: 4 },
            { type: "elite_throwing_axeman", count: 3 },
            { type: "boyar", count: 2 },
        ],
    },
    "qiernigeweifu_gongguo": {
        legionName: "瓦兰吉军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_berserk", count: 4 },
            { type: "elite_throwing_axeman", count: 3 },
            { type: "boyar", count: 2 },
        ],
    },
    // 北欧与维京·奥拉夫 / 阿布萨隆 / 比尔格雅尔 诺斯狂战士军团（鱼鳞阵 3+4+2：诺斯狂暴战士 3 + 精锐狂战士主力 4 + 掷矛手 2）
    nuosi: {
        legionName: "北欧军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'norse_warrior', count: 3 }, // Row 0 前卫冲锋 = 诺斯狂暴战士 3人（双手持战斧狂暴死斗冲锋）
            { type: 'elite_berserk', count: 4 }, // Row 1 中军主力 = 维京狂战士精锐 4人（王牌重甲近卫狂战主力）
            { type: 'skirmisher', count: 2 },    // Row 2 尾收远程投掷 = 掷矛手 2人（北欧重型飞掷标枪破盾）
        ],
    },
    danmai: {
        legionName: "北欧军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'norse_warrior', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    ruidian_yota: {
        legionName: "北欧军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'norse_warrior', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    ruidian_si: {
        legionName: "北欧军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'norse_warrior', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    // 高丽王朝·王建 / 姜邯赞 / 崔茂宣 / 尹瓘 / 金就砺（高丽军团 · 锥形阵 2+3+4：火矛兵 2 + 精锐高丽战车 3 + 火焰弓手 4）
    goryeo: {
        legionName: "高丽军团",
        formationMode: 'triangle',
        slots: [
            { type: 'fire_lancer', count: 2 },               // Row 0 尖刀 = 火矛兵 2人（火药火矛突击）
            { type: 'elite_war_wagon', count: 3 },           // Row 1 核心战车 = 精锐高丽战车 3辆
            { type: 'fire_archer', count: 4 },               // Row 2 底边主力 = 火焰弓手 4人（高丽弓术火箭齐射）
        ],
    },
    chungju_d: {
        legionName: "高丽军团",
        formationMode: 'triangle',
        slots: [
            { type: 'fire_lancer', count: 2 },
            { type: 'elite_war_wagon', count: 3 },
            { type: 'fire_archer', count: 4 },
        ],
    },
    sabeol: {
        legionName: "高丽军团",
        formationMode: 'triangle',
        slots: [
            { type: 'fire_lancer', count: 2 },
            { type: 'elite_war_wagon', count: 3 },
            { type: 'fire_archer', count: 4 },
        ],
    },
    hai2: {
        legionName: "高丽军团",
        formationMode: 'triangle',
        slots: [
            { type: 'fire_lancer', count: 2 },
            { type: 'elite_war_wagon', count: 3 },
            { type: 'fire_archer', count: 4 },
        ],
    },
    woju: {
        legionName: "高丽军团",
        formationMode: 'triangle',
        slots: [
            { type: 'fire_lancer', count: 2 },
            { type: 'elite_war_wagon', count: 3 },
            { type: 'fire_archer', count: 4 },
        ],
    },
    // 波希米亚与捷克·扬杰斯卡 胡斯战车军团（雁行 4+3+2：长戟兵 4 + 胡斯战车精锐 3 + 劲弩手 2；步兵前置，战车唯一特殊）
    boximiya: {
        legionName: "胡斯战车军团",
        formationMode: 'echelon',
        slots: [
            { type: 'halberdier', count: 4 },             // Row 0 前卫主力 = 长戟兵 4人（近战步兵前置抗线）
            { type: 'elite_hussite_wagon', count: 3 },    // Row 1 中军精锐 = 胡斯战车精锐 3辆（精锐3档·唯一特殊=战车）
            { type: 'arbalest', count: 2 },               // Row 2 底边 = 劲弩手 2人（远程后排掩护）
        ],
    },
    // 意大利与热那亚·安德烈亚·多利亚 / 丹多洛 / 洛伦佐 全甲佣兵与大盾热那亚重弩军团（鱼鳞阵 3+4+2：意大利佣兵 3 + 精锐热那亚弩手主力 4 + 热那亚弩手 2）
    liguliya: {
        legionName: "意大利军团",
        formationMode: 'crescent',
        slots: [
            { type: 'condottiero', count: 3 },                // Row 0 前卫抗线 = 意大利佣兵 3人（全钢板甲双手阔剑佣兵统领）
            { type: 'genoese_crossbowman', count: 2 },        // Row 1 中军 = 热那亚弩手 2人（大盾步弩中坚掩护）
            { type: 'elite_genoese_crossbowman', count: 4 },  // Row 2 底边主力 = 精锐热那亚弩手 4人（大盾超远重弩主力齐射）
        ],
    },
    anuo: {
        legionName: "意大利军团",
        formationMode: 'crescent',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'genoese_crossbowman', count: 2 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    tuosikana: {
        legionName: "意大利军团",
        formationMode: 'crescent',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'genoese_crossbowman', count: 2 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    lunbadi: {
        legionName: "意大利军团",
        formationMode: 'crescent',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'genoese_crossbowman', count: 2 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    yadelaiya: {
        legionName: "意大利军团",
        formationMode: 'crescent',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'genoese_crossbowman', count: 2 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    // 葡萄牙军团·吉马良斯（阿方索一世 · 衡轭阵 4+2+3：长戟兵 4 + 劲弩手 2 + 精锐风琴炮 3；火器拆剩风琴炮一排）
    putaoya: {
        legionName: "葡萄牙军团",
        formationMode: 'balance_yoke',
        slots: [
            { type: 'halberdier', count: 4 },          // Row 0 前线主力 = 长戟兵 4人（长戟抗骑方阵主力）
            { type: 'arbalest', count: 2 },            // Row 1 中排 = 劲弩手 2人（强弩齐射）
            { type: 'elite_organ_gun', count: 3 },     // Row 2 后排 = 精锐风琴炮 3门（唯一火器，风琴炮五弹连发齐射）
        ],
    },
    // 葡萄牙骑士军团·波尔图（桑乔一世 · 鱼鳞阵 3+4+2：重装长枪兵 3 + 重装骑士 4 + 火枪手 2；火器拆入火枪一排）
    duluo: {
        legionName: "葡萄牙骑士军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 3 },             // Row 0 前卫长枪 = 重装长枪兵 3人（十字军步兵拒马抗线）
            { type: 'cavalier', count: 4 },                  // Row 1 中军主力 = 重装骑士 4骑（收复失地十字军重装铁骑突贯冲击）
            { type: 'hand_cannoneer', count: 2 },            // Row 2 尾收火器 = 火枪手 2人（唯一火器，火枪齐射）
        ],
    },
    // 格鲁吉亚·塔玛尔女王（格鲁吉亚军团 · 鱼鳞阵 3+4+2：莫纳斯帕 3 + 精锐莫纳斯帕 4 + 骑射手 2）
    gelujiya: {
        legionName: "格鲁吉亚军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'monaspa', count: 3 },              // Row 0 前卫冲击 = 格鲁吉亚莫纳斯帕 3骑
            { type: 'elite_monaspa', count: 4 },        // Row 1 中军破阵主力 = 格鲁吉亚莫纳斯帕精锐 4骑（王家近卫铁骑主力）
            { type: 'cav_archer', count: 2 },           // Row 2 尾收远程 = 骑射手 2骑（弓骑游射掩护）
        ],
    },
    // 亚美尼亚·埃里温（瓦尔丹 · 战锤修士与复合弓军团 · 3+2+4 阵型：亚美尼亚修士战士 3 + 重装骑士 2 + 精锐复合弓手 4）
    wulaertu: {
        legionName: "亚美尼亚军团",
        formationMode: 'crescent',
        slots: [
            { type: 'warrior_priest', count: 3 },              // Row 0 前排抗线 = 牧师战士 3人（亚美尼亚修士战士圣锤破甲）
            { type: 'composite_bowman', count: 2 },            // Row 1 中军 = 复合弓手 2人（复合弓射击）
            { type: 'elite_composite_bowman', count: 4 },      // Row 2 底边主力 = 复合弓手精锐 4人（复合弓精锐主力齐射）
        ],
    },
    // 缅甸东吁王朝·莽应龙 / 莽瑞体 / 雍笈牙（缅甸军团 · 鹤翼阵 2+4+3：精锐象兵 2 + 精锐飞镖骑兵 4 + 精锐掷矛手 3）
    "hantawadi": {
        legionName: "缅甸军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "elite_arambai", count: 4 },
        ],
    },
    "dongxu": {
        legionName: "缅甸军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "elite_arambai", count: 4 },
        ],
    },
    "konbaung": {
        legionName: "缅甸军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "elite_arambai", count: 4 },
        ],
    },
    "pyu": {
        legionName: "缅甸军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "elite_arambai", count: 4 },
        ],
    },
    "mon": {
        legionName: "缅甸军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "elite_arambai", count: 4 },
        ],
    },
    // 扶南与高棉·范蔓 / 刀更孟 战象与爪刀精锐军团（鱼鳞阵 3+4+2：精锐战象前卫 3 + 精锐爪刀勇士主力 4 + 步弓手 2；象拆入战象一排）
    funan: {
        legionName: "扶南军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_battle_elephant', count: 3 },     // Row 0 前卫巨兽 = 精锐战象 3（唯一象，战斗象高级践踏）
            { type: 'karambit_warrior_elite', count: 4 },    // Row 1 中军主力 = 精锐爪刀勇士 4
            { type: 'archer', count: 2 },                    // Row 2 尾收支援 = 步弓手 2
        ],
    },
    basha_d: {
        legionName: "扶南军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_battle_elephant', count: 3 },   // Row 0 前卫巨兽 = 精锐战象 3
            { type: 'karambit_warrior_elite', count: 4 },    // Row 1 中军主力 = 精锐爪刀勇士 4
            { type: 'archer', count: 2 },                    // Row 2 尾收支援 = 步弓手 2
        ],
    },
    // 西西里与诺曼·腓特烈二世 / 罗杰二世 / 埃莱奥诺拉 军士长方阵与劲弩精锐军团（鱼鳞阵 3+4+2：军士长前卫 3 + 精锐军士长主力 4 + 劲弩手 2）
    xixiliwangguo: {
        legionName: "西西里军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'serjeant', count: 2 },            // Row 0 前卫坚壁 = 萨金特卫兵 2人（西西里军士长结阵抗线）
            { type: 'elite_serjeant', count: 4 },      // Row 1 中军主力 = 精锐萨金特卫兵 4人（军士长精锐主力推进）
            { type: 'arbalest', count: 3 },            // Row 2 后排 = 劲弩手 3人（破甲重弩压制）
        ],
    },
    moxina: {
        legionName: "西西里军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'serjeant', count: 2 },
            { type: 'elite_serjeant', count: 4 },
            { type: 'arbalest', count: 3 },
        ],
    },
    sading: {
        legionName: "西西里军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'serjeant', count: 2 },
            { type: 'elite_serjeant', count: 4 },
            { type: 'arbalest', count: 3 },
        ],
    },
    // 弗兰德斯伯国·加莱（罗贝尔二世 · 1302金马刺之战长矛军团 · 鱼鳞阵 4+3+2：佛兰德长矛民兵主力 4 + 重装骑士中军 3 + 劲弩手 2）
    fulandesi: {
        legionName: "1302金马刺之战长矛军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'flemish_pikeman', count: 4 },    // Row 0 前卫坚壁抗线 = 佛兰德长矛民兵 4人（纯步兵·无马，金马刺之战以密集成林长矛全歼重骑）
            { type: 'cavalier', count: 3 },           // Row 1 中军铁骑接应 = 重装骑士 3骑（低地重装骑士中坚防线接应）
            { type: 'arbalest', count: 2 },           // Row 2 尾收远程压制 = 劲弩手 2人（纯步兵·无马，城市行会强弩持续压制）
        ],
    },
    // 勃艮第公国·第戎（大胆查理 · 勃艮第军团 · 锥形阵 2+3+4：火枪手 2 + 弗拉芒民兵 3 + 精锐马上轻装兵 4）
    bogendi: {
        legionName: "勃艮第军团",
        formationMode: 'triangle',
        slots: [
            { type: 'hand_cannoneer', count: 2 },      // Row 0 尖刀 = 火枪手 2人（前排火枪齐射）
            { type: 'flemish_pikeman', count: 3 },     // Row 1 中坚 = 弗拉芒民兵 3人（佛兰德长矛民兵抗线）
            { type: 'elite_coustillier', count: 4 },   // Row 2 底边主力 = 精锐马上轻装兵 4骑（敕令军团骑枪爆发冲锋）
        ],
    },
    // 萨拉森、后倭马亚与安达卢西亚·萨拉赫丁 / 穆阿维叶 / 阿卜杜拉 马穆鲁克弯刀重骑与骆驼弓精锐军团（鱼鳞阵 3+4+2：马穆鲁克前卫 3 + 精锐马穆鲁克主力 4 + 骆驼弓骑 2）
    ayoubu: {
        legionName: "马穆鲁克军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mameluke', count: 3 },            // Row 0 前卫突击 = 萨拉森马穆鲁克 3骑（弯刀重骑前锋撕裂）
            { type: 'elite_mameluke', count: 4 },      // Row 1 中军主力劈杀 = 萨拉森马穆鲁克精锐 4骑（近卫重骑主力突破）
            { type: 'camel_archer', count: 2 },        // Row 2 尾收远程掩护 = 柏柏尔骆驼弓骑 2骑（高机动骆驼骑射压制）
        ],
    },
    womaya: {
        legionName: "马穆鲁克军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mameluke', count: 3 },
            { type: 'elite_mameluke', count: 4 },
            { type: 'camel_archer', count: 2 },
        ],
    },
    andaluoxiya: {
        legionName: "马穆鲁克军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mameluke', count: 3 },
            { type: 'elite_mameluke', count: 4 },
            { type: 'camel_archer', count: 2 },
        ],
    },
    // 哥特·狄奥多里克大帝（哥特军团 · 雁行阵 4+3+2：哥特近卫军精锐 4 + 长戟兵 3 + 长弓兵 2）
    donggete: {
        legionName: "哥特军团",
        formationMode: 'echelon',
        slots: [
            { type: 'elite_huskarl', count: 4 },      // Row 0 前卫主力 = 哥特近卫军精锐 4人（哥特城堡兵·反弓重盾步兵主力盾墙）
            { type: 'halberdier', count: 3 },         // Row 1 中排 = 长戟兵 3人（长戟反骑接应）
            { type: 'longbowman', count: 2 },         // Row 2 后排 = 长弓兵 2人（远程压制）
        ],
    },
    // 色雷斯·普罗夫迪夫（西美昂 · 色雷斯长刃斩手与精锐重骑军团 · 鹤翼阵 2+4+3：色雷斯长刃斩手 2 + 冲击重骑兵 4 + 精锐标枪手 3）
    seleisi: {
        legionName: "色雷斯长刃斩手与精锐重骑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'rhomphaia_warrior', count: 2 },   // Row 0 前锋坚壁 = 色雷斯长刃斩手 2人（纯步兵·无马，双手逆刃长刀引敌接战）
            { type: 'shock_cavalry', count: 4 },       // Row 1 中军主力 = 冲击重骑兵 4骑（重装贵族铁骑核心冲锋破阵）
            { type: 'elite_peltast', count: 3 },       // Row 2 尾收远射 = 精锐标枪手 3人（纯步兵·无马，高穿透投枪两翼火力掩护）
        ],
    },
    // 塞浦路斯王国·尼科西亚（居伊·德·吕西尼昂 · 十字军重骑士与劲弩大阵 · 鱼鳞阵 4+3+2：重装长枪兵 4 + 重装骑士 3 + 劲弩手 2）
    saipulusi: {
        legionName: "塞浦路斯军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },        // Row 0 前卫长枪 = 重装长枪兵 4人（纯步兵·无马，十字军重装长枪抗线拒马）
            { type: 'cavalier', count: 3 },             // Row 1 中军铁骑 = 重装骑士 3骑（吕西尼昂王家十字军重装铁骑中坚冲击）
            { type: 'arbalest', count: 2 },             // Row 2 尾收重弩 = 劲弩手 2人（纯步兵·无马，海岛要塞高穿透强弩射击掩护）
        ],
    },
    // 博斯普鲁斯王国·潘提卡彭（琉孔一世 · 萨尔马提亚具装重骑与希腊长枪大阵 · 鱼鳞阵 4+3+2：希腊雇佣重步兵 4 + 帝国具装骑兵 3 + 复合弓手 2）
    bosi_puluosi: {
        legionName: "博斯普鲁斯骑兵军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 4 },   // Row 0 前卫坚壁 = 希腊雇佣重步兵 4人（纯步兵·无马，博斯普鲁斯青铜圆盾长枪抗线）
            { type: 'imperial_cavalry', count: 3 },    // Row 1 中军铁骑 = 帝国具装骑兵 3骑（萨尔马提亚全具装铁骑中坚冲击）
            { type: 'composite_bowman', count: 2 },    // Row 2 尾收神弓 = 复合弓手 2人（纯步兵·无马，黑海斯基泰-希腊复合重弓射击掩护）
        ],
    },
    // 保加利亚帝国·特尔诺沃（阿森一世 · 保加利亚军团 · 鱼鳞阵 3+4+2：保加利亚骑兵 3 + 精锐保加利亚骑兵 4 + 骑射手 2）
    baojialiya: {
        legionName: "保加利亚军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'konnik', count: 3 },               // Row 0 前卫 = 保加利亚骑兵 3骑（具装骑兵前锋）
            { type: 'elite_konnik', count: 4 },         // Row 1 中军主力 = 精锐保加利亚骑兵 4骑（王牌具装近卫重骑破甲冲击）
            { type: 'cav_archer', count: 2 },           // Row 2 尾收 = 骑射手 2骑（弓骑两翼火力掩护）
        ],
    },
    // 保加利亚帝国·克鲁姆大汗 下马保加利亚勇士死斗军团（鱼鳞阵 3+4+2：下马保加利亚骑兵前卫 3 + 下马保加利亚骑兵精锐主力 4 + 复合弓手 2）
    saierdika: {
        legionName: "下马保加利亚勇士死斗军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'konnik_foot', count: 3 },             // Row 0 前卫坚盾 = 下马保加利亚骑兵 3人（纯步兵·无马，重盾前卫抗线破阵）
            { type: 'elite_konnik_foot', count: 4 },       // Row 1 中军主力 = 下马保加利亚骑兵精锐 4人（纯步兵·无马，王牌重装勇士主力死斗血战）
            { type: 'composite_bowman', count: 2 },        // Row 2 尾收远射 = 复合弓手 2人（纯步兵·无马，后方步弓压制掩护）
        ],
    },
    // 凯尔特突袭者军团·卡莱尔/斯昆/邓迪（威廉·华莱士 / 奥恩格斯 / 多姆纳尔 · 鱼鳞阵 3+4+2：靛蓝突袭者前卫 3 + 精锐靛蓝突袭者主力 4 + 长弓兵 2）
    kanbuliya: {
        legionName: "凯尔特军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },          // Row 0 前卫突袭 = 凯尔特靛蓝突袭者 3人（纯步兵·无马，高速突袭）
            { type: 'elite_woad_raider', count: 4 },    // Row 1 中军主力破阵 = 凯尔特靛蓝突袭者精锐 4人（主力狂暴劈杀）
            { type: 'longbowman', count: 2 },           // Row 2 尾收远程吊射 = 长弓兵 2人（纯步兵·无马，后排战弓抛射压制）
        ],
    },
    piketai: {
        legionName: "凯尔特军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },
            { type: 'elite_woad_raider', count: 4 },
            { type: 'longbowman', count: 2 },
        ],
    },
    gaer: {
        legionName: "凯尔特军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },
            { type: 'elite_woad_raider', count: 4 },
            { type: 'longbowman', count: 2 },
        ],
    },
    // 孔雀战象软剑军团·华氏城/曲女城/瓦拉纳西/索姆纳特（旃陀罗笈多 / 戒日王 / 频毗娑罗 / 普拉塔帕 · 鹤翼阵 2+4+3：桑纳亚装甲战象 2 + 软剑士精锐主力 4 + 帕提尤达长弓 3）
    kongque: {
        legionName: "印度军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },                 // Row 0 前锋破坚 = 孔雀王朝桑纳亚战象 2头（《政事论》经典巨象开路撞阵）
            { type: 'elite_urumi_swordsman', count: 4 },    // Row 1 中军主力 = 达罗毗荼软剑士精锐 4人（王牌主力近战双刃钢带旋斩）
            { type: 'pattiyoda_longbowman', count: 3 },     // Row 2 后排掩护 = 僧伽罗帕提尤达长弓手 3人（古印度高穿透重竹木长弓）
        ],
    },
    jieri: {
        legionName: "印度军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'pattiyoda_longbowman', count: 3 },
        ],
    },
    // 摩揭陀王国·王舍城（频毗娑罗王 · 弧刃弯刀死士与披甲战象大阵 · 鱼鳞阵 4+3+2：达罗毗荼镰刀战士 4 + 帕提尤达长弓手 3 + 孔雀王朝战象 2）
    mojietuo: {
        legionName: "摩揭陀象兵军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'sickle_warrior', count: 4 },           // Row 0 前卫主力突击 = 达罗毗荼镰刀战士 4人（纯步兵·无马，手持弧刃弯刀近身极速砍杀破盾）
            { type: 'pattiyoda_longbowman', count: 3 },     // Row 1 中军长弓神射 = 僧伽罗帕提尤达长弓手 3人（纯步兵·无马，古印度竹木重长弓连绵抛射）
            { type: 'sannahya', count: 2 },                 // Row 2 尾收装甲巨象 = 孔雀王朝战象 2头（披甲巨象压阵发起毁灭性践踏冲锋）
        ],
    },
    // 波罗帝国·高达城/孟加拉（达磨波罗 · 孟加拉军团 · 雁行阵 4+3+2：剑士 4 + 拉塔战车弓精锐 3 + 步弓手 2；步兵前置，战车唯一特殊）
    boluo: {
        legionName: "孟加拉军团",
        formationMode: 'echelon',
        slots: [
            { type: 'swordsman', count: 4 },               // Row 0 前卫主力 = 剑士 4人（近战步兵前置抗线）
            { type: 'elite_ratha_ranged', count: 3 },      // Row 1 中军精锐 = 拉塔战车弓精锐 3乘（精锐3档·唯一特殊=战车）
            { type: 'archer', count: 2 },                  // Row 2 底边 = 步弓手 2人（远程后排掩护）
        ],
    },
    jiashi_d: {
        legionName: "印度军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'pattiyoda_longbowman', count: 3 },
        ],
    },
    // 苏摩国·耽摩栗底港/孟加拉（苏摩 · 苏摩军团 · 雁行阵 4+3+2：剑士 4 + 战斗象 3 + 步弓手 2；步兵前置，象唯一特殊）
    sumo: {
        legionName: "苏摩军团",
        formationMode: 'echelon',
        slots: [
            { type: 'swordsman', count: 4 },               // Row 0 前卫主力 = 剑士 4人（近战步兵前置抗线）
            { type: 'battle_elephant', count: 3 },         // Row 1 中军 = 战斗象 3头（唯一特殊=象，践踏压阵）
            { type: 'archer', count: 2 },                  // Row 2 底边 = 步弓手 2人（远程后排掩护）
        ],
    },
    // 德里苏丹国·德里（阿拉乌丁·卡尔吉 · 象背重弓高台与近卫古拉姆铁甲大阵 · 鱼鳞阵 4+3+2：重装长枪兵 4 + 象弓骑兵精锐 3 + 古拉姆 2）
    deli: {
        legionName: "印度斯坦军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_armored_elephant', count: 2 },    // Row 0 前卫 = 装甲攻城战象精锐 2头（印度斯坦装甲战象精锐破城开路）
            { type: 'elite_ghulam', count: 4 },              // Row 1 中军主力 = 精锐古拉姆 4人（印度斯坦古拉姆精锐主力）
            { type: 'imperial_camel_rider', count: 3 },      // Row 2 后排 = 帝王骆驼兵 3骑（帝王骆驼骑兵护阵）
        ],
    },
    mowoer: {
        legionName: "阿克巴火器军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'ghulam', count: 3 },
            { type: 'imperial_camel_rider', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    // 印度与锡克·兰季特·辛格 / 拉其特 / 哈里·辛格 飞轮掷手漫天破阵精锐军团（三角阵 2+3+4：重装长枪前卫 2 + 飞轮掷手 3 + 精锐飞轮掷手主力 4）
    xike: {
        legionName: "锡克军团",
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },           // Row 0 尖刀坚壁 = 重装长枪兵 2人（纯步兵·无马，前排抗线拒马）
            { type: 'chakram_thrower', count: 3 },         // Row 1 中军投射 = 古吉拉特飞轮掷手 3人（纯步兵·无马，中距离回旋飞轮）
            { type: 'elite_chakram_thrower', count: 4 },   // Row 2 底边主力弹幕 = 古吉拉特飞轮掷手精锐 4人（纯步兵·无马，漫天飞轮破阵）
        ],
    },
    ahaomu: {
        legionName: "锡克军团",
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'chakram_thrower', count: 3 },
            { type: 'elite_chakram_thrower', count: 4 },
        ],
    },
    // 旁遮普·阿托克（哈里·辛格 · 海达斯佩斯河波鲁斯王巨象战阵 · 鱼鳞阵 4+3+2：重装长枪兵 4 + 帕提尤达长弓手 3 + 波鲁斯王战象 2）
    pangzha: {
        legionName: "旁遮普军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },           // Row 0 前卫抗线 = 重装长枪兵 4人（纯步兵·无马，长盾重枪筑起坚固拒马防线）
            { type: 'pattiyoda_longbowman', count: 3 },    // Row 1 中军远射 = 僧伽罗帕提尤达长弓手 3人（纯步兵·无马，南亚高穿透竹木重长弓连绵抛射）
            { type: 'porus_elephant', count: 2 },          // Row 2 尾收巨兽 = 波鲁斯王战象 2头（全游最高 HP 530 范围践踏，压阵毁灭性冲锋）
        ],
    },
    // 迦太基与布匿·汉尼拔 / 哈米尔卡 战象践踏与标枪精锐军团（雁行阵 4+3+2：掷矛手 4 + 精锐战象 3 + 长矛兵 2）
    buni: {
        legionName: "迦太基军团",
        formationMode: 'echelon',
        slots: [
            { type: 'skirmisher', count: 4 },                // Row 0 前排投射 = 掷矛手 4
            { type: 'elite_war_elephant', count: 3 },        // Row 1 核心战象 = 精锐战象 3（主力 3 档，象兵不占 4 档）
            { type: 'spearman', count: 2 },                  // Row 2 后排接应 = 长矛兵 2
        ],
    },
    feiniqi: {
        legionName: "迦太基军团",
        formationMode: 'echelon',
        slots: [
            { type: 'skirmisher', count: 4 },                // Row 0 前排投射 = 掷矛手 4
            { type: 'elite_war_elephant', count: 3 },        // Row 1 核心战象 = 精锐战象 3
            { type: 'spearman', count: 2 },                  // Row 2 后排接应 = 长矛兵 2
        ],
    },
    // 古埃及、赫梯与美索不达米亚·拉美西斯 / 穆瓦塔利 / 图特摩斯 / 卢伽尔扎克西 / 尼布甲尼撒 / 萨尔贡 / 沙姆希阿达德 / 萨利蒂 双轮战车军团（雁行阵 4+3+2：弓兵 4 + 双轮战车精锐 3 + 持盾步兵 2）
    heti: {
        legionName: "近东军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4（埃及／赫梯／亚述军队主体是大量弓手）
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    aiji: {
        legionName: "近东军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    dibisi: {
        legionName: "近东军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    sumeier: {
        legionName: "近东军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    jialedi: {
        legionName: "近东军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    yashu: {
        legionName: "近东军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    guyashu: {
        legionName: "近东军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    xikesuosi: {
        legionName: "近东军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    // 中南半岛·纳黎萱 / 阿奴律陀 / 阇耶跋摩 东南亚战象与步弓精锐军团（雁行阵 4+3+2：步弓手 4 + 精锐战斗象 3 + 爪刀勇士 2）
    siam: {
        legionName: "暹罗军团",
        formationMode: 'echelon',
        slots: [
            { type: 'archer', count: 4 },                    // Row 0 前排齐射 = 步弓手 4（东南亚军队主体是征召弓手与步兵）
            { type: 'elite_battle_elephant', count: 3 },     // Row 1 核心战象 = 精锐战斗象 3（主力 3 档，象兵不占 4 档）
            { type: 'karambit_warrior', count: 2 },          // Row 2 后排接应 = 爪刀勇士 2
        ],
    },
    "pagan": {
        legionName: "缅甸军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "elite_arambai", count: 4 },
        ],
    },
    // 高棉帝国·吴哥/真腊（阇耶跋摩七世 · 高棉军团 · 锥形阵 2+3+4：长矛兵 2 + 精锐重弩战象 3 + 步弓手 4；象拆剩弩炮象一排）
    chenla: {
        legionName: "高棉军团",
        formationMode: 'triangle',
        slots: [
            { type: 'spearman', count: 2 },                   // Row 0 尖刀 = 长矛兵 2人（近战步兵前置）
            { type: 'elite_ballista_elephant', count: 3 },    // Row 1 中坚 = 精锐重弩战象 3头（唯一象，象背机械床弩贯穿）
            { type: 'archer', count: 4 },                     // Row 2 底边主力 = 步弓手 4人（远程齐射）
        ],
    },
    // 撒拉森军团·麦地那/巴格达/麦加/巴士拉（哈立德 / 曼苏尔 / 艾布苏富扬 / 齐亚德 · 鹤翼阵 2+4+3：重装骆驼兵 2 + 精锐马穆鲁克 4 + 重装骑射手 3）
    maidina: {
        legionName: "撒拉森军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'camel_heavy', count: 2 },            // Row 0 前卫 = 重装骆驼兵 2骑（骆驼兵重装开路）
            { type: 'elite_mameluke', count: 4 },         // Row 1 中军主力 = 精锐马穆鲁克 4骑（萨拉森马穆鲁克精锐主力）
            { type: 'cav_archer_heavy', count: 3 },       // Row 2 后排 = 重装骑射手 3骑（骑射手重装远程游射）
        ],
    },
    abasi: {
        legionName: "撒拉森军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'camel_heavy', count: 2 },
            { type: 'elite_mameluke', count: 4 },
            { type: 'cav_archer_heavy', count: 3 },
        ],
    },
    gulaishi: {
        legionName: "撒拉森军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'camel_heavy', count: 2 },
            { type: 'elite_mameluke', count: 4 },
            { type: 'cav_archer_heavy', count: 3 },
        ],
    },
    alabo: {
        legionName: "撒拉森军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'camel_heavy', count: 2 },
            { type: 'elite_mameluke', count: 4 },
            { type: 'cav_archer_heavy', count: 3 },
        ],
    },
    // 小亚细亚近卫军团·阿马西亚/斯法尔德/戈尔迪翁/尼科米底亚（密特里达梯 / 克罗伊斯 / 迈达斯 / 狄奥多尔 · 鱼鳞阵 3+4+2：重装近卫前卫 3 + 重装近卫精锐主力 4 + 复合弓手 2）
    bendou_d: {
        legionName: "小亚细亚军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },              // Row 0 前卫抗线 = 古代重装近卫军 3人（纯步兵·无马，重装铜铠大盾前线坚壁抗线）
            { type: 'elite_guardsman', count: 4 },        // Row 1 中军主力 = 古代重装近卫军精锐 4人（纯步兵·无马，王家近卫精锐长矛主力突击）
            { type: 'composite_bowman', count: 2 },       // Row 2 尾收远射 = 复合弓手 2人（纯步兵·无马，后排步弓远射压制）
        ],
    },
    ldiya: {
        legionName: "小亚细亚军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    fulijiya: {
        legionName: "小亚细亚军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    bitiniya: {
        legionName: "小亚细亚军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    // 希腊贵族铁骑军团·米利都/特拉布宗/科孚（阿里斯塔 / 阿历克塞 / 舒伦堡 · 鱼鳞阵 3+4+2：贵族骑兵前卫 3 + 贵族骑兵精锐主力 4 + 克里特弓箭手 2）
    aiaoniya: {
        legionName: "希腊军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },    // Row 0 前卫突击 = 希腊贵族骑兵 3骑（重装前锋破线）
            { type: 'elite_greek_cavalry', count: 4 },    // Row 1 中军主力 = 希腊贵族骑兵精锐 4骑（王牌精锐贵族重骑主力突贯决战）
            { type: 'cretan_archer', count: 2 },          // Row 2 尾收远射 = 克里特弓箭手 2人（纯步兵·无马，后方步弓压制）
        ],
    },
    bendou: {
        legionName: "希腊军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'elite_greek_cavalry', count: 4 },
            { type: 'cretan_archer', count: 2 },
        ],
    },
    kejila: {
        legionName: "希腊军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'elite_greek_cavalry', count: 4 },
            { type: 'cretan_archer', count: 2 },
        ],
    },
    // 印度-希腊王国·那竭/顶骨城（米南德一世 · 巴克特里亚神弓与希腊铁骑战阵 · 鱼鳞阵 4+3+2：希腊雇佣重步兵 4 + 冲击重骑兵 3 + 巴克特里亚弓手 2）
    najie: {
        legionName: "那竭军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 4 },   // Row 0 前卫长枪坚壁 = 希腊雇佣重步兵 4人（纯步兵·无马，大夏希腊青铜圆盾长枪抗线）
            { type: 'shock_cavalry', count: 3 },       // Row 1 中军铁骑突击 = 冲击重骑兵 3骑（希腊-大夏突击铁骑中坚冲击）
            { type: 'bactrian_archer', count: 2 },     // Row 2 尾收复合神弓 = 巴克特里亚弓手 2人（纯步兵·无马，中亚希腊化复合重弓超远距离高伤害抛射）
        ],
    },
    // 刹帝利灵猫骑兵军团·巴米扬/坎大哈（突骑施 / 艾哈迈德沙 · 鱼鳞阵 3+4+2：刹帝利灵猫骑兵前卫 3 + 刹帝利精锐主力 4 + 步弓手 2）
    fanyanna: {
        legionName: "阿富汗军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'shrivamsha_rider', count: 3 },
            { type: 'elite_shrivamsha_rider', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    dulan_d: {
        legionName: "阿富汗军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'shrivamsha_rider', count: 3 },
            { type: 'elite_shrivamsha_rider', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    // 马格里布骆驼弓骑军团·特莱姆森/布佳亚/凯鲁万/非斯/马拉喀什/阿尔及尔/的黎波里（亚格姆拉森 / 哈马德 / 奥克巴 / 伊德里斯 / 塔什芬 / 巴巴罗萨 / 德拉古特 · 三角阵 2+3+4：萨拉森马穆鲁克 2 + 柏柏尔标枪骑兵 3 + 柏柏尔骆驼弓骑主力 4）
    zhayan: {
        legionName: "马格里布军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },      // Row 0 尖刀先锋 = 萨拉森马穆鲁克 2人
            { type: 'genitour', count: 3 },      // Row 1 冲击中坚 = 柏柏尔标枪骑兵 3人
            { type: 'camel_archer', count: 4 },  // Row 2 底边主力齐射 = 柏柏尔骆驼弓骑 4人
        ],
    },
    hamade: {
        legionName: "马格里布军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    aguelabu: {
        legionName: "马格里布军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    yidelisi: {
        legionName: "马格里布军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    mulabite: {
        legionName: "马格里布军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    babali: {
        legionName: "马格里布军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    telibolisi: {
        legionName: "马格里布军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 休达·直布罗陀（恩里克王子 · 1415征服休达葡萄牙要塞军团 · 鱼鳞阵 4+3+2：重装长枪兵 4 + 重装骑士 3 + 劲弩手 2）
    "zhibuluotuo": {
        legionName: "十字军军团",
        legionType: "era",
        formationMode: "fish_scale",
        slots: [
            { type: "teutonic_knight", count: 3 },
            { type: "crusader_knight", count: 4 },
            { type: "arbalest", count: 2 },
        ],
    },
    // 占婆爪刀藤弓军团·毗阇耶/因陀罗补罗（制蓬峨 / 制旻 · 鱼鳞阵 3+4+2：爪刀勇士前卫 3 + 爪刀勇士精锐主力 4 + 藤弓兵 2）
    champa: {
        legionName: "占婆军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'karambit_warrior', count: 3 },        // Row 0 前卫突入 = 爪刀勇士 3人（纯步兵·无马，前排双持近战弯刃）
            { type: 'karambit_warrior_elite', count: 4 },  // Row 1 中军主力 = 爪刀勇士精锐 4人（纯步兵·无马，主力极速贴身近战突刺）
            { type: 'rattan_archer', count: 2 },           // Row 2 尾收远射 = 藤弓兵 2人（纯步兵·无马，后方步弓压制掩护）
        ],
    },
    zhancheng: {
        legionName: "占婆军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'karambit_warrior', count: 3 },
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
    },
    // 波美拉尼亚与波罗的海要塞·卡西米尔四世 奥布奇破甲战锤精锐军团（鱼鳞阵 3+4+2：战锤步兵前卫 3 + 战锤精锐主力 4 + 劲弩手 2）
    boumeilaniyan: {
        legionName: "奥布奇破甲战锤精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'obuch', count: 3 },                   // Row 0 前卫破线 = 奥布奇战锤步兵 3人（纯步兵·无马，破甲战锤前卫破线）
            { type: 'elite_obuch', count: 4 },             // Row 1 中军主力 = 奥布奇战锤精锐 4人（纯步兵·无马，王牌重装战锤主力撕裂敌甲）
            { type: 'arbalest', count: 2 },                // Row 2 尾收远射 = 劲弩手 2人（纯步兵·无马，后方重型劲弩压制掩护）
        ],
    },
    // 中南半岛阿瓦王朝·思机法 掸族战象与飞镖铁骑大阵（鱼鳞阵 3+4+2：皮甲战象前卫 3 + 精锐飞镖骑兵主力 4 + 步弓手后排 2）
    "ava": {
        legionName: "缅甸军团",
        formationMode: "triangle",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "elite_arambai", count: 4 },
        ],
    },
    // 大越帝国·升龙（陈国峻/陈兴道 · 岭南三角阵 2+3+4：皮甲战象尖刀 2 + 帝王掷矛手中坚 3 + 精锐藤弓兵主力 4）
    dayue: {
        legionName: "越南军团",
        formationMode: 'triangle',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },   // Row 0 尖刀巨兽 = 精锐象兵 2头（战斗象高级开路冲撞）
            { type: 'imperial_skirmisher', count: 3 },     // Row 1 掷矛中坚 = 帝王掷矛手 3人（大越专属王牌掷矛手，中距离重标枪穿甲反弓）
            { type: 'rattan_archer_elite', count: 4 },     // Row 2 底边主力齐射 = 精锐藤弓兵 4人（密林精锐藤弓，后排暴雨抛射）
        ],
    },
    // 哥萨克纯骑兵军团·塞契/阿速城/切尔卡瑟（赫梅利 / 塔塔里诺夫 / 拜达 · 鹤翼阵 2+4+3：骑马火枪前锋 2 + 马扎尔骠骑主力 4 + 重装骑射 3）
    gesake: {
        legionName: "哥萨克军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'conquistador', count: 2 },          // Row 0 前锋破线 = 骑马火枪手 2骑（哥萨克战马火枪前哨放排枪破甲）
            { type: 'magyar_huszar', count: 4 },         // Row 1 中军主力 = 马扎尔骠骑兵 4骑（哥萨克精锐战骑核心冲击）
            { type: 'cav_archer_heavy', count: 3 },      // Row 2 尾收远射 = 重装骑射手 3骑（东欧草原快马重弓后排驰射掩护）
        ],
    },
    dunhe: {
        legionName: "哥萨克军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'conquistador', count: 2 },
            { type: 'magyar_huszar', count: 4 },
            { type: 'cav_archer_heavy', count: 3 },
        ],
    },
    qiekase: {
        legionName: "哥萨克军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'conquistador', count: 2 },
            { type: 'magyar_huszar', count: 4 },
            { type: 'cav_archer_heavy', count: 3 },
        ],
    },
    // 奥斯若恩·埃德萨（鲍德温 · 圣殿骑士团军团 · 鱼鳞阵 4+3+2：圣殿楷模武士 4 + 十字军圣殿骑士 3 + 劲弩手 2）
    "aosiruowen": {
        legionName: "圣殿骑士团军团",
        formationMode: "fish_scale",
        slots: [
            { type: "halberdier", count: 3 },
            { type: "crusader_knight", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    // 耶路撒冷王国·阿卡（鲍德温四世 · 耶路撒冷王国军团 · 鱼鳞阵 4+3+2：圣殿楷模武士 4 + 十字军骑士 3 + 劲弩手 2）
    yelusalengwg: {
        legionName: "圣殿骑士团军团",
        formationMode: "fish_scale",
        slots: [
            { type: "halberdier", count: 3 },
            { type: "crusader_knight", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    // 纳巴泰王国·佩特拉（阿雷塔斯 · 纳巴驼骑军团 · 鹤翼阵 2+4+3：火焰骆驼 2 + 骆驼骑兵 4 + 骆驼弓骑 3）
    nabatai: {
        legionName: "纳巴驼骑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'flaming_camel', count: 2 },        // Row 0 前锋奇兵 = 鞑靼火焰骆驼 2头（沙漠火攻突袭）
            { type: 'camel_rider', count: 4 },          // Row 1 中军主力 = 骆驼骑兵 4骑（纳巴泰沙漠重驼骑核心合围）
            { type: 'camel_archer', count: 3 },         // Row 2 尾收远射 = 柏柏尔骆驼弓骑 3骑（沙漠驼背复合弓游射压制）
        ],
    },
    // 奴儿干都司与极北海岛军团·特林/囊哈儿/普禄/诺托罗/白主/宗谷/莫约罗/白老（康旺/吉里迷/费雅喀/鄂罗克/苦夷/阿伊努 · 三角阵 2+3+4：答剌罕骑兵 2 + 反曲长弓手 3 + 鲜卑掠骑兵 4）
    nuergan: {
        legionName: "奴儿干军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },           // Row 0 尖刀突骑 = 答剌罕骑兵 2骑（极北通古斯重骑突击）
            { type: 'recurve_bowman', count: 3 },   // Row 1 中坚步射 = 反曲长弓手 3人（林海强弓齐射）
            { type: 'xianbei_raider', count: 4 },   // Row 2 主力骑射 = 鲜卑掠骑兵 4骑（雪原快马游射压制）
        ],
    },
    jilimi: {
        legionName: "奴儿干军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    feiyaka: {
        legionName: "奴儿干军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    eluoke: {
        legionName: "奴儿干军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    kuye: {
        legionName: "奴儿干军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    beihai: {
        legionName: "奴儿干军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    ayinu_ezo: {
        legionName: "奴儿干军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    "ayinu": {
        legionName: "奴儿干军团",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "recurve_bowman", count: 3 },
            { type: "xianbei_raider", count: 4 },
        ],
    },
    "yehe": {
        legionName: "满清军团",
        formationMode: "crescent",
        slots: [
            { type: "steppe_lancer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    "wula": {
        legionName: "满清军团",
        formationMode: "crescent",
        slots: [
            { type: "steppe_lancer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    "haixi_nvzhen": {
        legionName: "满清军团",
        formationMode: "crescent",
        slots: [
            { type: "steppe_lancer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    "wenling": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    // 阿兹特克·特诺奇提特兰（库奥特莫克 · 阿兹特克军团 · 偃月阵 3+2+4：精锐鹰勇士 3 + 豹勇士 2 + 精锐豹勇士 4）
    aztec: {
        legionName: "阿兹特克军团",
        formationMode: 'crescent',
        slots: [
            { type: 'elite_eagle_warrior', count: 3 },   // Row 0 前排抗线 = 精锐鹰勇士 3人（反骑兵反僧侣快速近战）
            { type: 'jaguar_warrior', count: 2 },        // Row 1 中排过渡 = 豹勇士 2人（反步兵中坚）
            { type: 'elite_jaguar_warrior', count: 4 },  // Row 2 后排主力 = 精锐豹勇士 4人（反步兵后发制人）
        ],
    },
    // 埃塞俄比亚·阿克苏姆（埃扎纳 · 埃塞俄比亚军团 · 雁行阵 4+3+2：弯刀勇士精锐 4 + 重装骆驼兵 3 + 步弓手 2）
    ethiopia: {
        legionName: "埃塞俄比亚军团",
        formationMode: 'echelon',
        slots: [
            { type: 'elite_shotel_warrior', count: 4 },   // Row 0 前排主力 = 弯刀勇士精锐 4人（反步兵半月弯刀破阵）
            { type: 'camel_heavy', count: 3 },            // Row 1 中排冲锋 = 重装骆驼兵 3骑（反骑兵重装突击）
            { type: 'archer', count: 2 },                 // Row 2 后排远射 = 步弓手 2人（远程掩护）
        ],
    },
    // 塔里克·丹吉尔（塔里克 · 柏柏尔军团 · 锥形阵 2+3+4：重装骆驼兵 2 + 标枪骑兵精锐 3 + 骆驼射手精锐 4）
    talike: {
        legionName: "柏柏尔军团",
        formationMode: 'triangle',
        slots: [
            { type: 'camel_heavy', count: 2 },        // Row 0 尖刀先锋 = 重装骆驼兵 2骑（反骑兵破阵尖刀）
            { type: 'elite_genitour', count: 3 },     // Row 1 冲击中坚 = 标枪骑兵精锐 3骑（远程标枪压制）
            { type: 'elite_camel_archer', count: 4 }, // Row 2 底边主力 = 骆驼射手精锐 4骑（柏柏尔王牌骆驼弓骑齐射）
        ],
    },
    // 朱罗王朝·坦贾武尔（拉金德拉 · 达罗毗荼军团 · 偃月阵 3+2+4：剑士 3 + 攻城战象 2 + 精锐乌鲁米剑士 4；象拆剩攻城象一排，骑象弓迁潘地亚）
    zhuluo: {
        legionName: "达罗毗荼军团",
        formationMode: 'crescent',
        slots: [
            { type: 'swordsman', count: 3 },              // Row 0 前卫 = 剑士 3人（近战步兵前置抗线）
            { type: 'ballista_elephant', count: 2 },      // Row 1 中军 = 攻城战象 2头（唯一特殊=象，弩炮战象破阵）
            { type: 'elite_urumi_swordsman', count: 4 },  // Row 2 底边主力 = 精锐乌鲁米剑士 4人（软剑主力旋斩）
        ],
    },
    // 潘地亚王朝·马杜赖（贾塔瓦尔曼 · 潘地亚军团 · 雁行阵 4+3+2：剑士 4 + 精锐骑象弓 3 + 步弓手 2；骑象弓自朱罗迁入，象一排）
    pandiya: {
        legionName: "潘地亚军团",
        formationMode: 'echelon',
        slots: [
            { type: 'swordsman', count: 4 },              // Row 0 前卫主力 = 剑士 4人（近战步兵前置抗线）
            { type: 'elite_elephant_archer', count: 3 },  // Row 1 中军 = 精锐骑象弓 3头（唯一特殊=象，象背弓骑游射）
            { type: 'archer', count: 2 },                 // Row 2 底边 = 步弓手 2人（远程后排掩护）
        ],
    },
    // 鞑靼部·河套（巴图蒙克 · 鞑靼军团 · 衡轭阵 4+2+3：精锐怯薛骑兵 4 + 草原枪兵 2 + 重装骑射手 3）
    dada_ming: {
        legionName: "鞑靼军团",
        formationMode: 'balance_yoke',
        slots: [
            { type: 'elite_keshik', count: 4 },        // Row 0 前线主力 = 精锐怯薛骑兵 4骑（鞑靼怯薛军精锐主力）
            { type: 'steppe_lancer', count: 2 },       // Row 1 中排 = 草原枪兵 2骑（草原枪骑兵突击）
            { type: 'cav_archer_heavy', count: 3 },    // Row 2 后排 = 重装骑射手 3骑（重装弓骑火力）
        ],
    },
    // 钦察·萨拉托夫（巴奇曼 · 库曼军团 · 锥形阵 2+3+4：草原枪兵 2 + 精锐草原枪兵 3 + 精锐钦察 4）
    qincha: {
        legionName: "库曼军团",
        formationMode: 'triangle',
        slots: [
            { type: 'steppe_lancer', count: 2 },       // Row 0 尖刀 = 草原枪兵 2骑（草原枪骑兵突击）
            { type: 'elite_steppe_lancer', count: 3 }, // Row 1 中坚 = 精锐草原枪兵 3骑（草原枪骑兵精锐）
            { type: 'elite_kipchak', count: 4 },       // Row 2 底边主力 = 精锐钦察 4骑（库曼钦察弓骑齐射）
        ],
    },
    // 马六甲·满剌加苏丹国（拜里米苏拉 · 马来军团 · 鹤翼阵 2+4+3：精锐象兵 2 + 精锐爪刀勇士 4 + 步弓手 3）
    malacca: {
        legionName: "马来军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },    // Row 0 前卫 = 精锐象兵 2头（战斗象高级开路）
            { type: 'karambit_warrior_elite', count: 4 },   // Row 1 中军主力 = 精锐爪刀勇士 4人（爪刀贴身突刺主力）
            { type: 'archer', count: 3 },                   // Row 2 后排 = 步弓手 3人（远程齐射）
        ],
    },
    // 卡拉桑·马打蓝王国（帕南卡兰 · 马打蓝军团 · 鹤翼阵 2+4+3：精锐象兵 2 + 精锐爪刀勇士 4 + 步弓手 3）
    medang: {
        legionName: "马来军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },    // Row 0 前卫 = 精锐象兵 2头（战斗象高级开路）
            { type: 'karambit_warrior_elite', count: 4 },   // Row 1 中军主力 = 精锐爪刀勇士 4人（爪刀贴身突刺主力）
            { type: 'archer', count: 3 },                   // Row 2 后排 = 步弓手 3人（远程齐射）
        ],
    },
    // 廷巴克图·马里帝国（松迪亚塔 · 马里军团 · 鱼鳞阵 3+4+2：飞刀女兵 3 + 精锐飞刀女兵 4 + 步弓手 2）
    manding: {
        legionName: "马里军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'gbeto', count: 3 },        // Row 0 前排 = 飞刀女兵 3人（格贝托掷刀开路）
            { type: 'elite_gbeto', count: 4 },  // Row 1 中军主力 = 精锐飞刀女兵 4人（格贝托精锐掷刀主力）
            { type: 'archer', count: 2 },       // Row 2 后排 = 步弓手 2人（远程齐射）
        ],
    },
    // 图卡佩尔·马普切人（劳塔罗 · 马普切军团 · 鱼鳞阵 3+4+2：科那 3 + 精锐科那 4 + 锐掷石绳骑兵 2）
    mapuche: {
        legionName: "马普切军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'kona', count: 3 },            // Row 0 前排 = 科那 3骑（马普切科纳勇士突进开路）
            { type: 'elite_kona', count: 4 },      // Row 1 中军主力 = 精锐科那 4骑（科纳勇士高级主战）
            { type: 'elite_bolas_rider', count: 2 }, // Row 2 后排 = 锐掷石绳骑兵 2骑（精锐流星锤骑手远程投石）
        ],
    },
    // 巴卡塔·穆伊斯卡联盟（萨瓜曼奇卡 · 穆伊斯卡军团 · 锥形阵 2+3+4：精锐蔷琵战士 2 + 精锐神庙护卫 3 + 精锐格查战士 4）
    muisca: {
        legionName: "穆伊斯卡军团",
        formationMode: 'triangle',
        slots: [
            { type: 'elite_champi_warrior', count: 2 },  // Row 0 尖刀 = 精锐蔷琵战士 2人（尚皮勇士高级开路）
            { type: 'elite_temple_guard', count: 3 },    // Row 1 中坚 = 精锐神庙护卫 3人（神庙守卫高级护阵）
            { type: 'elite_guecha_warrior', count: 4 },  // Row 2 底边主力 = 精锐格查战士 4人（格查标枪兵主力齐射）
        ],
    },
    // 蒂卡尔·玛雅城邦（亚斯纳昌 · 玛雅军团 · 偃月阵 3+2+4：鹰勇士 3 + 羽箭手 2 + 精锐羽箭手 4）
    maya: {
        legionName: "玛雅军团",
        formationMode: 'crescent',
        slots: [
            { type: 'eagle_warrior', count: 3 },         // Row 0 前卫 = 鹰勇士 3人（美洲鹰武士近战突进）
            { type: 'plumed_archer', count: 2 },         // Row 1 中军 = 羽箭手 2人（玛雅羽箭中坚射击）
            { type: 'elite_plumed_archer', count: 4 },   // Row 2 底边主力 = 精锐羽箭手 4人（玛雅羽箭精锐主力齐射）
        ],
    },
    // 木叶山·契丹（述律平 · 契丹军团 · 雁行阵 4+3+2：精锐辽刀兵 4 + 草原枪兵 3 + 骆驼投石机 2）
    qidan: {
        legionName: "契丹军团",
        formationMode: 'echelon',
        slots: [
            { type: 'elite_liao_dao', count: 4 },       // Row 0 前线主力 = 精锐辽刀兵 4人（契丹长刀步兵主力突贯）
            { type: 'steppe_lancer', count: 3 },        // Row 1 中排 = 草原枪兵 3骑（草原枪骑兵突击）
            { type: 'mounted_trebuchet', count: 2 },    // Row 2 后排 = 骆驼投石机 2台（骑驼投石机远程轰击）
        ],
    },
    // 帕坦·瞿折罗（迷企罗波阇 · 瞿折罗军团 · 鹤翼阵 2+4+3：精锐骑象弓兵 2 + 精锐飞轮刃投掷手 4 + 精锐施里瓦姆沙骑手 3）
    gurjara: {
        legionName: "瞿折罗军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_elephant_archer', count: 2 },     // Row 0 前卫 = 精锐骑象弓兵 2头（象弓骑兵高级开路）
            { type: 'elite_chakram_thrower', count: 4 },     // Row 1 中军主力 = 精锐飞轮刃投掷手 4人（古吉拉特飞轮掷手精锐主力）
            { type: 'elite_shrivamsha_rider', count: 3 },    // Row 2 后排 = 精锐施里瓦姆沙骑手 3骑（什里瓦姆沙骑手高级护阵）
        ],
    },
    // 瓜纳巴拉·图皮人（阿拉里博亚 · 图皮军团 · 锥形阵 2+3+4：精锐蔷琵战士 2 + 精锐伊比拉贝玛战士 3 + 精锐黑檀木步弓手 4）
    tupi: {
        legionName: "图皮军团",
        formationMode: 'triangle',
        slots: [
            { type: 'elite_champi_warrior', count: 2 },       // Row 0 尖刀 = 精锐蔷琵战士 2人（尚皮勇士高级开路）
            { type: 'elite_ibirapema_warrior', count: 3 },    // Row 1 中坚 = 精锐伊比拉贝玛战士 3人（图皮战棍勇士高级护阵）
            { type: 'elite_blackwood_archer', count: 4 },     // Row 2 底边主力 = 精锐黑檀木步弓手 4人（图皮黑木弓箭手高级主力齐射）
        ],
    },
    // 利马·西班牙征服者（皮萨罗 · 西班牙军团 · 偃月阵 3+2+4：长戟兵 3 + 火枪手 2 + 精锐西班牙征服者 4）
    xibanya: {
        legionName: "西班牙军团",
        formationMode: 'crescent',
        slots: [
            { type: 'halberdier', count: 3 },          // Row 0 前卫 = 长戟兵 3人（长戟方阵抗骑开路）
            { type: 'hand_cannoneer', count: 2 },      // Row 1 中军 = 火枪手 2人（火枪齐射）
            { type: 'elite_conquistador', count: 4 },  // Row 2 底边主力 = 精锐西班牙征服者 4骑（征服者火枪骑主力骑射）
        ],
    },
    // 塞格德·匈人（阿提拉 · 匈人军团 · 衡轭阵 4+2+3：精锐答刺罕骑兵 4 + 草原枪骑兵 2 + 骑射手 3）
    xiongren: {
        legionName: "匈人军团",
        formationMode: 'balance_yoke',
        slots: [
            { type: 'elite_tarkan', count: 4 },        // Row 0 前线主力 = 精锐答刺罕骑兵 4骑（匈奴重装具装铁骑主力突贯）
            { type: 'steppe_lancer', count: 2 },       // Row 1 中排 = 草原枪骑兵 2骑（草原枪骑兵突击）
            { type: 'cav_archer', count: 3 },          // Row 2 后排 = 骑射手 3骑（骑射游走远程袭扰）
        ],
    },
    // 库斯科·印加帝国（帕查库提 · 印加军团 · 鱼鳞阵 3+4+2：印加枪兵长 3 + 印加枪兵长精锐 4 + 投石手 2）
    inca: {
        legionName: "印加军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'kamayuk', count: 3 },          // Row 0 前卫 = 印加枪兵长 3人（枪兵长结阵抗线）
            { type: 'elite_kamayuk', count: 4 },    // Row 1 中军主力 = 印加枪兵长精锐 4人（枪兵长精锐主力突刺）
            { type: 'slinger', count: 2 },          // Row 2 后排 = 投石手 2人（投石兵远程投石）
        ],
    },
    "xideweina": {
        legionName: "波洛公国军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_boyar", count: 4 },
            { type: "composite_bowman", count: 3 },
        ],
    },
    "bohepingyuan": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "weixi": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "lagusa": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "meikelunbao": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "didi": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "bosiniya": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "maixiya": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "nidelan": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "pomeilaniya": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "langgeduoke": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "kanpaniya": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "jiatailuoniya": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "nasier": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "bolisiya": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "zhituo": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "pufaerci": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "hansa": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "batawei": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "weijing_york": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "puluowangsi": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "shaiyue": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "yinggelan": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "bulietani": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "saierweiya": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "habusibao": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "rierman": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "shiwaben": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "asikanani": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "wende": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "bafaliya": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "huohengsuolun": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "ruishi": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "molaweiya": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "damolaweiya": {
        legionName: "英格兰长弓军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "longbowman_elite", count: 4 },
            { type: "shock_cavalry", count: 2 },
        ],
    },
    "liulike": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "mosike_gongguo": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "xieerpuhuofu_gongguo": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "fulajimier_gongguo": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "daniebo": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "jialixiya": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "pusikefu_gongheguo": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "ouka": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "baojiaer": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kelimiya": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "keluodiya": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "mengtainiya": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "teweier_gongguo": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "suzidaer": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "siluoboda": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "yedi": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "moerdaweiya": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "walajiyia": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "chude": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "deniesite": {
        legionName: "白堡守军团",
        legionType: "solo",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "fuerjia": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "nuogai": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "bashekeer": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "beisilafu": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "peilieya_gongguo": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "weijiebusike_gongguo": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "eluosi_diguo": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "kaleiliya": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "heishui": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "kelie": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "donghui": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "gonggu": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "fuguo": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "fushi": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "gongtang": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "chizhou": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "yada": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "quli": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "guazhou": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "guishuang": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "juandu": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "sai": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "yangtong": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "monong": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "shuizhen": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "dingling": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "nifuhe": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "muer": {
        legionName: "伊朗军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "xiajiasi": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "zhen": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "dongshengwei": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "dizhou": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "bailian": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "chimei": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "yunzhong": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "qian": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "wan": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "qingyuan_bd": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "zhong": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "xichu": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "weihaiwei": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "guangzhou": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "guangping": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "duanzhou_d": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "dingxiang_d": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "xiayang_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "dian": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "liangzhou": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "juqu_d": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "tufa_d": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "qiuchi": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "helian": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xiongnu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xianbei": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "jie": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "beidi": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "tuoba": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yuwen": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "liang_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "chen": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "sui": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "tang": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "min": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "quanzhou": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "shazhou": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "shatuo": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "bing": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "bohai": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "dangxiang": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "liao_d": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "dangzhou": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "dai_d": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "zhongshan": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "wang_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "xiao_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "yuan_cj_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "xie_cj_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "yue_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "qian_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "jiujiang": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "jingzhou_gs": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "guo": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "zi": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "long2": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "song2": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "jibei": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "wusun": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "dayuan": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "gouding": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "wuhuan": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xianlingqiang": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "yelang": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "ailao": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "fuyu": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "shule": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "loulan": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "shache": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "qiuci": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "yanqi": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "gaogouli": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "xinluo": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "ashikaga": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "quanrong": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "sushen": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "chile": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "rouran": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "baishui": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "baiji": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "tubo": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "tujue": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "tiele": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "huige": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yamato": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "edo": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "izumo": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "satsuma": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "ryukyu": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "so": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "kakizaki": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "fujiwara": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "gaya": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "aki": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "chosokabe": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "shimotsuke": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "aizu": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "xingliao": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "gongsun_d": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "donghu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "luoyue": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "qifu_d": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "tuyu_d": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "linyi": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "pingyuan": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yao": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "murong": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yingzhou_ying_d": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "erzhu": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "chanzhou": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "pizhou": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "tongma": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "tongzhou": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "baibo": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "cheshihou": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "qu_d": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "liu": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "ouyue": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "suzhou_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "lanzhou": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "gaoqi_d": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "wuzhou_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "zhuozhou": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "tujia_d": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "zhuang_d": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "buyi_d": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "hani_d": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "xibo_d": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "jinling": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "wuwu_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "shizhao_d": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "ranwei_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "taizhou": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "sunwu_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "liangshidu": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "linshihong": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "kumo": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xijue": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xian_d": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "xueyantuo": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "tujishi": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "nanzhao": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "nanzhong": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "xiaobolu": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "qiufu": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "dongdan": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "dali": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "luodian": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "nongzhigao": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "fangla": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "zhongxiang": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "yang_aner": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "jinan": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "liwang": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "huarazim": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "dongxia": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "chagatai": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "ogodei": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kereyid": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "naiman": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "tatar": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "merkit": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "ongut": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xushouhui": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "zhangshicheng": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "wenzhou": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "chendiaoyan": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "fang_guozhen": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "dixiang": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "dengmaoqi": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "yezongliu": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "jianzhou_nvzhen": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "yeren_nvzhen": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "hezhe": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "luchuan": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "chijin": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "xihai_d": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "heyuan_d": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "guiyi": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "dafeichuan": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "joseon": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "dashun": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "daxi_ming": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "chenghan": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "shuixi": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "yang_zhou": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "longwu": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "lujian": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "dzungar": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yarkand": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "khoja": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "gaxa": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "jinchuan_g": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "geng": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "shuntian": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "miaomin": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "xiadun": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "kazakh": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kokand": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "badakhshan": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "taiping": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "dacheng": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "pingnan": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "pinghai": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "qianhui": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "miao_qing": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "tuoming": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "dajin": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "yizhou": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "yilou": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "wuji": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "mohe": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "shiwei": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "huimo": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "mao_wenlong": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "kala": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "xiliao": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "jiazini": {
        legionName: "伊朗军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "jibin": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "kangju": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "geluolu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yuchi": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "shi_clan": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "gaoche": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "huyan": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yujiulu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "ashina": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "ashide": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "borjigin": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "hongirad": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "choros": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "weiming": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yeli": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "guge": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "ladakh": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "tsangpa": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "ganden": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "bailan": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "supi": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "monpa": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "lopi": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "spurgyal": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "khon": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "lang_clan": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "karmapa": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "meitai": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "baiman": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "kunming_yi": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "miao": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "yang_bozhou": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "tian_sizhou": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "mu_lijiang": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "ming_zheng": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "xiou": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "jing": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "muong": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "paiwan": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "leloi": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "nguyen_guangnan": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "cong": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "zhe_d": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "shanyue": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "she_ethnic": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "wuling": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "weili": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "pishan": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "tuerhute": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "bandun": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "seljuq": {
        legionName: "伊朗军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "cen_d": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "wang_s": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "xiang_d": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "tan_d": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "ran_d": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "chu_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "hu_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "qingyi": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "wuxi": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "gumie": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "shengmiao": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "kuai": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "shen": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "sou": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "shaodang": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "jingjiang": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "xinjiang": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "panyao": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "jiang_s": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "li_s": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "leizhou": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "golog": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "tushetu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "tumed": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "she": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "liao": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "nong2": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "yaoluoge": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "nanbu": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "saman": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "hepan": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "humi": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "mamon": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "guzgan": {
        legionName: "伊朗军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "dai": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "taiyuan": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "luohu": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "nanai": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "anushidgin": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "nanjie": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "gandenpozhang": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "dawoer": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "tumengken": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "liren": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "gling": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "khyungpo": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "suolun": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "tuva": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "osumi": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "anmei": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "dalung": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "gar_kham": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "kongsa": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "mingzheng": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "daca": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "jingdong": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "hor": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "dong": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "bailang": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "duolu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "zhuxie": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "hunxie": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "kawusi": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "keerkezi": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "yiduhu": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "yangshao": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "yel": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yizhi": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "zhuqian": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "jibei2": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "jinchuan": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "totomi": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "xuan": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "liguo": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "kang": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "woye": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "lushui": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yingli": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "guangwu": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "huizhou": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yiwu": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "duerbote": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "zhasaketu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kaerka": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "huihu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "wuzhumuqin": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "zhuerqi": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "chechen": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "linyu": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "loufan": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yi": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "pisha": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "yumi": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "keliya": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "xiye": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "faqiang": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "jiantang": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "gongbu": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "niang": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "ganzhou": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "galangdiba": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "ali": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "pazhu": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "qiong": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "zhuoshi": {
        legionName: "唐朝军团",
        legionType: "era",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "chenzhou_d": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "qianzhong": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "cuanshi": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "dianguo": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "xinggu": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "zangke": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "guangxin": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "kejia": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "tingzhou_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "chaozhou_d": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "ouyang": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "ningkou": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "hongzhou": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "danyang": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "huai": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "huaiyang": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "cai": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "ying": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "heng": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "chen2": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "shixing": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "shaozhou": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "yidou": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "boren": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "wanzhou": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "kui": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "danluo": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "chen3": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "jingcheng_d": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "naju_d": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "hui": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "luzhou": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "xuantu": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "sambyeol": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "sheng_d": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "jinzhou": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "wure": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "houliao": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "dazhen": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "jilin": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "sunite": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "dayuzi": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "weiwuer": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "wensu": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "keerqin": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "xiangxiong": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "gaoliang": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "ruoqiang": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "qiemo": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "weitou": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "dangchang": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "mi": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "fu2": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "xinping": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "wei2": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "lingzhou": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "qiepantuo": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "ewenki": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "dongping": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "maomingan": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "aola": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "bulat": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "buriat": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xianhai": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "nandou": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "kaga_d": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "higo_d": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "iyo_d": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "otomo_d": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "suwa_d": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "yanda": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "anxi": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "qi_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "wangyan": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "tianxiong": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "huang_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "yuzhou": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "yiyang_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "mengcheng_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "guide_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "lulin": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "dang_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "hao_d": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "hongnong_jun": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "gar": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "ruzhou": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "yun": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "xiongding": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yaozhou": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "huo": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "mushi": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "lai": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "zuo_d": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "huangwang": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "chuzhou_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "guizhou": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "paiyao": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "daozhou": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "dayu": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "yingzhou": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "taira": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "wuman": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "xiutu": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "dongzu": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "mengwu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "pugu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "bayegu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "ketagalan": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "shanrong": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "suke": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "gaochang": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "chuyue": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "baidi": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "dulan": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "duomi": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "wumeng": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "lelang": {
        legionName: "朝鲜军团",
        formationMode: "crane_wing",
        slots: [
            { type: "swordsman", count: 2 },
            { type: "hei_kuang", count: 4 },
            { type: "fire_archer", count: 3 },
        ],
    },
    "huite": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "zubu": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kangba": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "nvguo": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "jiashi": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "wuhu": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "huluo": {
        legionName: "伊朗军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "maer_d": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "wugu_d": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xierhe": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "adao_d": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "wuyuan_d": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "chenli_d": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "nuoyan_d": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "wuli_d": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "heisha_d": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "wuzhou": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "bailong": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "jilizhou": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "xingxingxia": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yangguan": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "wulianghai": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kepantuo": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "xining": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "kalun": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "sagami": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "mino": {
        legionName: "日本军团",
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "ssangseong": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "kumoxi": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "haikou": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "shanshan": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "qianzhou": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "wuyue": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "xiyuduhu": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "shaozhou_d": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "zizhou": {
        legionName: "江南军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "cangzhou": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yuezhi": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "minyue": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "lancang": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "elunchunzu": {
        legionName: "东北军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_iron_pagoda", count: 4 },
            { type: "kipchak", count: 2 },
        ],
    },
    "wazu": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "tajikezu": {
        legionName: "西域军团",
        formationMode: "triangle",
        slots: [
            { type: "scythian_axe_cavalry", count: 2 },
            { type: "scythian_horse_archer", count: 3 },
            { type: "elite_scythian_horse_archer", count: 4 },
        ],
    },
    "jingpozu": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "shuizu": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "liuzhou": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "dingzhou": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "shanzhou": {
        legionName: "青藏军团",
        formationMode: "crane_wing",
        slots: [
            { type: "hei_kuang", count: 2 },
            { type: "elite_tarkan", count: 4 },
            { type: "mangudai", count: 3 },
        ],
    },
    "weizhou": {
        legionName: "唐朝军团",
        formationMode: "crescent",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
        ],
    },
    "yingzhou_d2": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yansui": {
        legionName: "中原军团",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 4 },
        ],
    },
    "xiazhou": {
        legionName: "河西军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "hei_kuang", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "shizhou": {
        legionName: "河朔军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "xingwei": {
        legionName: "滇缅军团",
        formationMode: "triangle",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "archer", count: 3 },
            { type: "karambit_warrior", count: 4 },
        ],
    },
    "ribale": {
        legionName: "伊朗军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "wulaertu_guo": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "keerjisi": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "luomu": {
        legionName: "西亚军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "xibolai": {
        legionName: "马格里布军团",
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "paermila": {
        legionName: "马格里布军团",
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "youfaladi": {
        legionName: "马格里布军团",
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "sashan": {
        legionName: "伊朗军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "mamuluke": {
        legionName: "马格里布军团",
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "kesa": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "jialatai": {
        legionName: "西亚军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "dedan": {
        legionName: "马格里布军团",
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "xierwan": {
        legionName: "中亚军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "savar", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "xiemian": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yidier": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "mangshi": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "fodejiao": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "baiyiya": {
        legionName: "美洲军团",
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "tupinijin": {
        legionName: "美洲军团",
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "tuotuonake": {
        legionName: "美洲军团",
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "taino": {
        legionName: "美洲军团",
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "guanche": {
        legionName: "马格里布军团",
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "yasuer": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "liaozu": {
        legionName: "岭南军团",
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "kushi": {
        legionName: "非洲军团",
        formationMode: "fish_scale",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "aimala": {
        legionName: "美洲军团",
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "aolisha": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    "kanata": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    "adile": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    "foluolida": {
        legionName: "美洲军团",
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "fujisi": {
        legionName: "福基斯重步军团",
        formationMode: "fish_scale",
        slots: [
            { type: "hoplite", count: 3 },
            { type: "mercenary_hoplite", count: 4 },
            { type: "thracian_peltast", count: 2 },
        ],
    },
    "yilisi": {
        legionName: "埃利斯战车军团",
        formationMode: "fish_scale",
        slots: [
            { type: "war_chariot", count: 3 },
            { type: "hoplite", count: 4 },
            { type: "thracian_peltast", count: 2 },
        ],
    },
    "nuowei": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "keernuwaye": {
        legionName: "拉丁军团",
        formationMode: "crane_wing",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "aodesuosi": {
        legionName: "色雷斯军团",
        formationMode: "fish_scale",
        slots: [
            { type: "rhomphaia_warrior", count: 3 },
            { type: "elite_peltast", count: 4 },
            { type: "thracian_peltast", count: 2 },
        ],
    },
    "disidelusi": {
        legionName: "马格里布军团",
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "yisatisi": {
        legionName: "伊朗军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "wuer": {
        legionName: "西亚军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_composite_bowman", count: 4 },
            { type: "eastern_swordsman", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "pidisha": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    "jiaye": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    "jienei": {
        legionName: "非洲军团",
        formationMode: "fish_scale",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "kuertaiya": {
        legionName: "白堡守军团",
        formationMode: "fish_scale",
        slots: [
            { type: "swordsman", count: 3 },
            { type: "halberdier", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "puxiangyindu": {
        legionName: "葡属印度军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "kamayuk", count: 4 },
            { type: "hand_cannoneer", count: 2 },
            { type: "crossbowman", count: 3 },
        ],
    },
    "lumiliya": {
        legionName: "阿肯骑兵军团",
        legionType: "solo",
        formationMode: "crescent",
        slots: [
            { type: "pikeman", count: 3 },
            { type: "laminated_bowman", count: 2 },
            { type: "cav_archer_heavy", count: 4 },
        ],
    },
    "muwaxide": {
        legionName: "马格里布军团",
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "yilaka": {
        legionName: "美洲军团",
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "knight", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "xiadunhe": {
        legionName: "草原军团",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "zhagewei": {
        legionName: "非洲军团",
        formationMode: "fish_scale",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "suomunate": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    "sengjialuo": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    "varendra": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    "chatigangren": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    "bulu": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    "duonaobaojia": {
        legionName: "色雷斯军团",
        formationMode: "fish_scale",
        slots: [
            { type: "rhomphaia_warrior", count: 3 },
            { type: "elite_peltast", count: 4 },
            { type: "thracian_peltast", count: 2 },
        ],
    },
    "ternate": {
        legionName: "马来军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "karambit_warrior_elite", count: 4 },
            { type: "archer", count: 3 },
        ],
    },
    "sulu": {
        legionName: "马来军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "karambit_warrior_elite", count: 4 },
            { type: "archer", count: 3 },
        ],
    },
    "xishudongyin": {
        legionName: "马来军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "karambit_warrior_elite", count: 4 },
            { type: "archer", count: 3 },
        ],
    },
    "xiaofulijiya": {
        legionName: "希腊雇佣军团",
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 3 },
            { type: "hoplite", count: 4 },
            { type: "gastraphetes", count: 2 },
        ],
    },
    // ============================================================
    // 同编制同名 / 同名同编制 修复（2026-08-30 主人定：相同编制军团必须同名）
    // 以下势力此前为 custom=0，落在 DE 文明区「暂复用父文化」默认编成上，
    // 与其他文化区默认/既有军团撞名撞编；此处按各自史实姊妹军团补齐同名同编。
    // ============================================================
    // 特拉斯塔马拉王朝·拉莫塔堡（西班牙）→ 西班牙军团
    "trastamara": {
        legionName: "西班牙军团",
        formationMode: "crescent",
        slots: [
            { type: "halberdier", count: 3 },
            { type: "hand_cannoneer", count: 2 },
            { type: "elite_conquistador", count: 4 },
        ],
    },
    // 纳克索斯（马其顿编年史素材）→ 马其顿军团
    "naxos_ancient": {
        legionName: "马其顿军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "cretan_archer", count: 2 },
            { type: "companion_cavalry", count: 3 },
        ],
    },
    // 维丁国·巴巴维达（保加利亚）→ 保加利亚军团
    "vidin_tsardom": {
        legionName: "保加利亚军团",
        formationMode: "fish_scale",
        slots: [
            { type: "konnik", count: 3 },
            { type: "elite_konnik", count: 4 },
            { type: "cav_archer", count: 2 },
        ],
    },
    // 布拉干萨家族·布拉干萨（葡萄牙）→ 葡萄牙军团
    "braganza_house": {
        legionName: "葡萄牙军团",
        formationMode: "balance_yoke",
        slots: [
            { type: "halberdier", count: 4 },
            { type: "arbalest", count: 2 },
            { type: "elite_organ_gun", count: 3 },
        ],
    },
    // 小波兰·本津堡（波兰）→ 波兰军团
    "lesser_poland": {
        legionName: "波兰军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_obuch", count: 4 },
            { type: "winged_hussar", count: 3 },
            { type: "cav_archer", count: 2 },
        ],
    },
    // 萨姆茨赫·阿哈尔齐赫（格鲁吉亚）→ 格鲁吉亚军团
    "samtskhe": {
        legionName: "格鲁吉亚军团",
        formationMode: "fish_scale",
        slots: [
            { type: "monaspa", count: 3 },
            { type: "elite_monaspa", count: 4 },
            { type: "cav_archer", count: 2 },
        ],
    },
    // 末罗王国·比什努普尔（孟加拉）→ 孟加拉军团
    "mallabhum": {
        legionName: "孟加拉军团",
        formationMode: "echelon",
        slots: [
            { type: "swordsman", count: 4 },
            { type: "elite_ratha_ranged", count: 3 },
            { type: "archer", count: 2 },
        ],
    },
    // 休族·乌斯马尔（玛雅）→ 玛雅军团
    "tutul_xiu": {
        legionName: "玛雅军团",
        formationMode: "crescent",
        slots: [
            { type: "eagle_warrior", count: 3 },
            { type: "plumed_archer", count: 2 },
            { type: "elite_plumed_archer", count: 4 },
        ],
    },
    // 贡德尔朝·法西尔堡（埃塞俄比亚）→ 埃塞俄比亚军团
    "gondarine": {
        legionName: "埃塞俄比亚军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_shotel_warrior", count: 4 },
            { type: "camel_heavy", count: 3 },
            { type: "archer", count: 2 },
        ],
    },
    // 米南加保（马来）→ 马来军团
    "minangkabau": {
        legionName: "马来军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "karambit_warrior_elite", count: 4 },
            { type: "archer", count: 3 },
        ],
    },
    // 托摩罗·瓜廖尔堡（瞿折罗）→ 瞿折罗军团
    "tomara_gwalior": {
        legionName: "瞿折罗军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_elephant_archer", count: 2 },
            { type: "elite_chakram_thrower", count: 4 },
            { type: "elite_shrivamsha_rider", count: 3 },
        ],
    },
    // 瓦卢瓦王朝·香波堡（法兰西）→ 法兰克军团
    "valois_angouleme": {
        legionName: "法兰克军团",
        formationMode: "crescent",
        slots: [
            { type: "champion", count: 3 },
            { type: "paladin", count: 2 },
            { type: "elite_throwing_axeman", count: 4 },
        ],
    },
    // 塔万廷苏尤（印加帝国）·马丘比丘 → 印加军团
    "tawantinsuyu": {
        legionName: "印加军团",
        formationMode: "fish_scale",
        slots: [
            { type: "kamayuk", count: 3 },
            { type: "elite_kamayuk", count: 4 },
            { type: "slinger", count: 2 },
        ],
    },
    // 库特布朝·戈尔康达（德干）→ 天竺军团
    "qutb_shahi": {
        legionName: "天竺军团",
        formationMode: "fish_scale",
        slots: [
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "sannahya", count: 2 },
        ],
    },
    // 克尔曼·巴姆古城（波斯）→ 波斯军团
    "kerman_bam": {
        legionName: "波斯军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_war_elephant", count: 3 },
            { type: "savar", count: 4 },
            { type: "cav_archer", count: 2 },
        ],
    },
    // 奥德里西亚王国·塞乌托波利（色雷斯）→ 色雷斯军团
    "odrysian_late": {
        legionName: "色雷斯军团",
        formationMode: "fish_scale",
        slots: [
            { type: "rhomphaia_warrior", count: 3 },
            { type: "elite_peltast", count: 4 },
            { type: "thracian_peltast", count: 2 },
        ],
    },
};
