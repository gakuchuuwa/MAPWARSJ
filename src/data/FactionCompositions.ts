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
    nanyue: {
        legionName: "秦国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'kamayuk', count: 4 },
            { type: 'war_chariot_ranged', count: 3 },
            { type: 'chukonu', count: 2 },
        ],
    },
    // 韩国·雁行阵（4+3+2：与秦国同阵）
    han: {
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
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },                      // Row 0 尖刀突骑 = 虎豹骑 2骑（轻勇突击先锋）
            { type: 'antiquity_cavalry_archer', count: 3 },        // Row 1 中坚机动 = 古典骑射手 3骑（胡服轻骑环射）
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },  // Row 2 主力重射 = 重装古典骑射手 4骑（强弓重箭贯穿主力）
        ],
    },
    shuofang: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    xianyu: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    li_lx_d: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    lingqiu: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    hejian: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    linhu: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    jiyuan: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    jiluo_d: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    pulei: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    you: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
    },
    dongsheng: {
        legionName: "轻勇骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
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
    // 曹魏·曹操 / 张辽 / 邓艾 / 司马懿 / 于禁 / 田豫 虎豹铁骑军团（鹤翼阵 2+4+3：魏武虎豹骑 2 + 魏武虎豹骑精锐 4 + 诸葛弩 3）
    cao_d: {
        legionName: "虎豹铁骑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'tiger_rider', count: 2 },          // Row 0 前哨牵制 = 魏武虎豹骑 2骑
            { type: 'elite_tiger_cavalry', count: 4 },  // Row 1 铁骑主力两翼合围 = 魏武虎豹骑精锐 4骑
            { type: 'chukonu', count: 3 },              // Row 2 中军后排支援 = 诸葛弩 3人
        ],
    },
    lu: {
        legionName: "虎豹铁骑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'elite_tiger_cavalry', count: 4 },
            { type: 'chukonu', count: 3 },
        ],
    },
    wudu: {
        legionName: "虎豹铁骑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'elite_tiger_cavalry', count: 4 },
            { type: 'chukonu', count: 3 },
        ],
    },
    sima_d: {
        legionName: "虎豹铁骑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'tiger_rider', count: 2 },
            { type: 'elite_tiger_cavalry', count: 4 },
            { type: 'chukonu', count: 3 },
        ],
    },
    bozhou_d: {
        legionName: "虎豹铁骑军团",
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
    mi_chu: {
        legionName: "先秦军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 2 },
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
    // 大明帝国·北京（朱棣 / 徐达 / 于谦 / 戚继光 明军三大营步骑火协同军团 · 鱼鳞阵 3+4+2：持盾刀剑手 3 + 黑光铠骑兵主力 4 + 神机箭火箭车 2）
    ming_d: {
        legionName: "明军三大营步骑火协同军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'jian_swordman_shielded', count: 3 }, // Row 0 前卫抗线 = 持盾刀剑手 3人（大盾刀牌手正面抗线防矢）
            { type: 'hei_kuang', count: 4 },              // Row 1 中军主力 = 黑光铠骑兵 4骑（三千营精锐重骑主力突破）
            { type: 'heavy_rocket_cart', count: 2 },      // Row 2 尾收火器 = 神机箭重型火箭车 2车（神机营一窝蜂连发弹幕轰击）
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
    // 大金帝国·五国城/会宁（完颜宗弼 / 完颜陈和尚 · 铁浮图震天雷大阵 · 鱼鳞阵 4+3+2：女真铁浮屠 4 + 火焰弓 3 + 掷弹兵 2）
    jurchen: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 4 },            // Row 0 前卫铁骑 = 女真铁浮屠 4骑（女真重甲铁骑前锋，如墙而进正面突贯）
            { type: 'fire_archer', count: 3 },            // Row 1 中军神弓 = 吴火焰弓箭手 3人（火箭火矢连发，中坚烈焰压制）
            { type: 'grenadier', count: 2 },              // Row 2 尾收火器 = 掷弹兵 2人（金军震天雷火药弹死士，后排范围轰炸破坚）
        ],
    },
    // 金末忠孝军·真宁（完颜陈和尚 · 忠孝军飞火震天雷大阵 · 鱼鳞阵 4+3+2：铁浮图 4 + 火矛兵 3 + 掷弹兵 2）
    xiqin: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 4 },            // Row 0 前卫铁骑 = 女真铁浮屠 4骑（忠孝军精锐重铠铁骑，前锋雷霆冲击）
            { type: 'fire_lancer', count: 3 },            // Row 1 中军火矛 = 火矛手 3人（飞火枪突进，近距离喷火刺杀破阵）
            { type: 'grenadier', count: 2 },              // Row 2 尾收火器 = 掷弹兵 2人（震天雷铁罐火药弹，后排范围轰炸破坚）
        ],
    },
    // 满清军团·抚顺/赫图阿拉/盛京/吉林乌拉/呼伦贝尔/威远营/西宁（努尔哈赤 / 皇太极 / 多尔衮 / 阿桂 / 海兰察 / 年羹尧 / 岳钟琪 · 鱼鳞阵 3+4+2：女真铁浮屠 3 + 草原枪骑兵精锐 4 + 重装骑射手 2）
    manzhou: {
        legionName: "满清军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 3 },          // Row 0 前卫重骑 = 女真铁浮屠 3骑（八旗重装铁甲前锋突破）
            { type: 'elite_steppe_lancer', count: 4 },  // Row 1 中军主力 = 草原枪骑兵精锐 4骑（八旗长枪铁骑中坚突击）
            { type: 'cav_archer_heavy', count: 2 },     // Row 2 尾收远程 = 重装骑射手 2骑（八旗重装弓骑兵两翼齐射火力支援）
        ],
    },
    aisin_d: {
        legionName: "满清军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 3 },
            { type: 'elite_steppe_lancer', count: 4 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },
    manzhou_d: {
        legionName: "满清军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 3 },
            { type: 'elite_steppe_lancer', count: 4 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },
    agui: {
        legionName: "满清军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 3 },
            { type: 'elite_steppe_lancer', count: 4 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },
    xingan: {
        legionName: "满清军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 3 },
            { type: 'elite_steppe_lancer', count: 4 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },
    weiyuan: {
        legionName: "满清军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 3 },
            { type: 'elite_steppe_lancer', count: 4 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },
    qinghai: {
        legionName: "满清军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 3 },
            { type: 'elite_steppe_lancer', count: 4 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },
    // 南宋·岳飞 / 韩世忠 / 孟珙 / 刘锜 火矛手军团（鱼鳞阵 3+4+2：精锐火矛手前卫 3 + 刀剑手主力 4 + 诸葛弩 2）
    yanchuan_d: {
        legionName: "火矛手军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },         // 前卫突击 = 精锐火矛手 3
            { type: 'jian_swordsman', count: 4 },            // 中军主力 = 刀剑手 4
            { type: 'chukonu', count: 2 },                   // 后排压阵 = 诸葛弩 2
        ],
    },
    sizhou: {
        legionName: "火矛手军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },         // 前卫突击 = 精锐火矛手 3
            { type: 'jian_swordsman', count: 4 },            // 中军主力 = 刀剑手 4
            { type: 'chukonu', count: 2 },                   // 后排压阵 = 诸葛弩 2
        ],
    },
    yingzhou_d: {
        legionName: "火矛手军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },         // 前卫突击 = 精锐火矛手 3
            { type: 'jian_swordsman', count: 4 },            // 中军主力 = 刀剑手 4
            { type: 'chukonu', count: 2 },                   // 后排压阵 = 诸葛弩 2
        ],
    },
    zaoyang_d: {
        legionName: "火矛手军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },         // 前卫突击 = 精锐火矛手 3
            { type: 'jian_swordsman', count: 4 },            // 中军主力 = 刀剑手 4
            { type: 'chukonu', count: 2 },                   // 后排压阵 = 诸葛弩 2
        ],
    },
    fengzhou: {
        legionName: "火矛手军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },         // 前卫突击 = 精锐火矛手 3
            { type: 'jian_swordsman', count: 4 },            // 中军主力 = 刀剑手 4
            { type: 'chukonu', count: 2 },                   // 后排压阵 = 诸葛弩 2
        ],
    },
    hezhou: {
        legionName: "火矛手军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },         // 前卫突击 = 精锐火矛手 3
            { type: 'jian_swordsman', count: 4 },            // 中军主力 = 刀剑手 4
            { type: 'chukonu', count: 2 },                   // 后排压阵 = 诸葛弩 2
        ],
    },
    changshaguo: {
        legionName: "火矛手军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },         // 前卫突击 = 精锐火矛手 3
            { type: 'jian_swordsman', count: 4 },            // 中军主力 = 刀剑手 4
            { type: 'chukonu', count: 2 },                   // 后排压阵 = 诸葛弩 2
        ],
    },
    shenshi: {
        legionName: "火矛手军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },         // 前卫突击 = 精锐火矛手 3
            { type: 'jian_swordsman', count: 4 },            // 中军主力 = 刀剑手 4
            { type: 'chukonu', count: 2 },                   // 后排压阵 = 诸葛弩 2
        ],
    },
    luoping: {
        legionName: "火矛手军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },         // 前卫突击 = 精锐火矛手 3
            { type: 'jian_swordsman', count: 4 },            // 中军主力 = 刀剑手 4
            { type: 'chukonu', count: 2 },                   // 后排压阵 = 诸葛弩 2
        ],
    },
    // 赵宋军团·开封及宋将（赵匡胤 / 杨业 / 杨延昭 / 狄青 / 种世衡 / 种师道 / 王韶 / 宗泽 / 韩世忠 / 文天祥 · 鱼鳞阵 3+4+2：火矛兵 3 + 火矛兵精锐主力 4 + 火焰弓手 2）
    song: {
        legionName: "赵宋军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },               // Row 0 前卫突进 = 火矛兵 3人
            { type: 'elite_fire_lancer', count: 4 },         // Row 1 中军主力 = 精锐火矛兵 4人（赵宋突火枪精锐主力）
            { type: 'fire_archer', count: 2 },               // Row 2 尾收火矢 = 吴火焰弓箭手 2人（后排烈焰火矢齐射）
        ],
    },
    heng1: {
        legionName: "赵宋军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'fire_archer', count: 2 },
        ],
    },
    changshan: {
        legionName: "赵宋军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'fire_archer', count: 2 },
        ],
    },
    zhai_han: {
        legionName: "赵宋军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'fire_archer', count: 2 },
        ],
    },
    yanzhou: {
        legionName: "赵宋军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'fire_archer', count: 2 },
        ],
    },
    huan: {
        legionName: "赵宋军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'fire_archer', count: 2 },
        ],
    },
    didao: {
        legionName: "赵宋军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'fire_archer', count: 2 },
        ],
    },
    qing: {
        legionName: "赵宋军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'fire_archer', count: 2 },
        ],
    },
    xiangzhou: {
        legionName: "赵宋军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'fire_archer', count: 2 },
        ],
    },
    // 蜀汉·刘备 / 诸葛亮 / 关羽 / 张飞 / 赵云 / 马超 / 姜维 / 王平 / 张嶷 / 廖化 / 严颜 白毦兵精锐军团（鱼鳞阵 3+4+2：白毦兵前卫 3 + 精锐白毦兵主力 4 + 诸葛弩 2）
    shu: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },       // Row 0 前卫 = 蜀汉白毦兵 3人
            { type: 'elite_white_feather_guard', count: 4 }, // Row 1 中军突击主力 = 精锐白毦兵 4人
            { type: 'chukonu', count: 2 },                   // Row 2 尾收支援 = 诸葛弩 2人
        ],
    },
    huizhou_d: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    chu: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    langzhou: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    jingmen: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    cangsong: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    qingqiang: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    yangzhou: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    yueyi: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    lizhou_d: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    fu_zhou: {
        legionName: "白毦兵精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    // 匈牙利王国·布达佩斯（匈雅提亚诺什 · 黑军车堡火器军团 · 鹤翼阵 2+4+3：胡斯战车 2 + 马扎尔骠骑兵 4 + 火枪兵 3）
    mazhaer: {
        legionName: "黑军车堡火器军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'hussite_wagon', count: 2 },    // Row 0 前排掩体 = 胡斯战车 2辆（战车环列构筑车堡防线）
            { type: 'magyar_huszar', count: 4 },   // Row 1 两翼主力 = 马扎尔骠骑兵 4骑（匈牙利核心主力两翼雷霆突贯）
            { type: 'hand_cannoneer', count: 3 },  // Row 2 车堡火力 = 火枪兵 3人（纯步兵·无马，车堡掩体内排枪齐射压制）
        ],
    },
    // 奥斯曼帝国·布尔萨（穆罕默德二世 · 三角阵 2+3+4：土耳其禁卫军 2 + 土耳其禁卫军精锐 3 + 奥斯曼皇家禁卫军主力 4）
    osman: {
        formationMode: 'triangle',
        slots: [
            { type: 'janissary', count: 2 },                 // Row 0 尖刀前排 = 土耳其禁卫军 2人（苏丹火枪前哨齐射）
            { type: 'elite_janissary', count: 3 },           // Row 1 冲击中坚 = 土耳其禁卫军精锐 3人（耶尼切里精锐排枪射击）
            { type: 'royal_janissary', count: 4 },           // Row 2 底边主力 = 奥斯曼皇家禁卫军 4人（皇家最高阶苏丹火枪绝杀）
        ],
    },
    // 草原与中亚诸大汗·怯薛铁骑军团（鱼鳞阵 3+4+2：怯薛军前卫 3 + 精锐怯薛军主力 4 + 蒙古突骑 2）
    // 包含：成吉思汗、拔都、忽必烈、帖木儿、旭烈兀、速不台、木华黎、也速该、札木合、也先、噶尔丹、昔班尼、巴布尔、突厥大汗等
    menggu_d: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },          // Row 0 前卫突破 = 鞑靼怯薛军 3骑
            { type: 'elite_keshik', count: 4 },    // Row 1 中军主力 = 鞑靼怯薛军精锐 4骑
            { type: 'mangudai', count: 2 },        // Row 2 尾收远射 = 蒙古突骑 2骑
        ],
    },
    jinzhang: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    yuan_d: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    // 帖木儿帝国·撒马尔罕（帖木儿 · 怯薛铁骑军团 · 鱼鳞阵 3+4+2：怯薛军前卫 3 + 精锐怯薛军主力 4 + 蒙古突骑 2）
    tiemuer: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },              // Row 0 前卫突骑 = 鞑靼怯薛军 3骑（前沿突击尖刀）
            { type: 'elite_keshik', count: 4 },        // Row 1 中军主力 = 鞑靼怯薛军精锐 4骑（帖木儿亲军重装具装铁骑核心突破）
            { type: 'mangudai', count: 2 },            // Row 2 尾收远射 = 蒙古突骑 2骑（高机动轻骑精锐游射压制）
        ],
    },
    asaibaijiang: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    wuliangha: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    jalair: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    kiyad: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    zhadalan: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    wala: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    oirat_ming: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    an: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    babuer: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    da_yuan: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    chahar: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    zhaowu: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    manghuti: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    khoshut: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    yilihanguo_d: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    yilihanguo: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    salai: {
        legionName: "怯薛铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai', count: 2 },
        ],
    },
    // 马其顿·亚历山大帝国军团（雁行阵 4+3+2：马其顿方阵兵 4 + 伙伴骑兵 3 + 克里特弓手 2）
    maqidun: {
        legionName: "亚历山大帝国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 托勒密（亚历山大旧部，套用亚历山大帝国军团配置）
    tuolemi: {
        legionName: "亚历山大帝国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 塞琉古帝国（安提俄基亚 · 塞琉古一世/安条克，银盾方阵体系）
    sailiugu: {
        legionName: "亚历山大帝国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 佩尔加蒙（欧迈尼斯 · 亚历山大王家秘书长与近卫方阵统帅）
    pajiama: {
        legionName: "亚历山大帝国军团",
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 贝雷尼斯·红海东非要塞（达格纳詹 · 东非阿克苏姆双曲弯刀与御驾巨象战阵 · 鱼鳞阵 4+3+2：弯刀勇士 4 + 精锐弯刀勇士 3 + 御驾战象 2）
    beileinisi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'shotel_warrior', count: 4 },        // Row 0 前卫主力破盾 = 埃塞俄比亚弯刀勇士 4人（纯步兵·无马，手持半月双曲弯刀极速钩杀破甲）
            { type: 'elite_shotel_warrior', count: 3 },  // Row 1 中军精锐绞杀 = 埃塞俄比亚弯刀勇士精锐 3人（纯步兵·无马，王牌重装肖特尔弯刀死士）
            { type: 'dagnajan_elephant', count: 2 },     // Row 2 尾收御驾巨象 = 达格纳詹御驾战象 2头（全游最高 HP 930 御驾巨象，压阵毁灭性践踏冲锋）
        ],
    },
    // 昔兰尼加（班加西 · 托勒密一世养子马加斯）
    jileinaijia: {
        legionName: "亚历山大帝国军团",
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
            { type: 'hippeus', count: 3 },             // Row 0 前排 = 斯巴达希皮乌斯 3人（纯步兵·无马，斯巴达国王300近卫死士）
            { type: 'hippeus', count: 3 },             // Row 1 中坚 = 斯巴达希皮乌斯 3人（纯步兵·无马，全钢青铜大盾同袍誓死不退）
            { type: 'hippeus', count: 3 },             // Row 2 后排 = 斯巴达希皮乌斯 3人（纯步兵·无马，温泉关300勇士九宫死守）
        ],
    },
    // 伊庇鲁斯王国·安布拉基亚（皮洛士大帝 · 战象与希腊长枪铁骑大阵 · 鱼鳞阵 4+3+2：希腊雇佣重步兵 4 + 冲击重骑兵 3 + 战象 2）
    yipilusi: {
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
        formationMode: 'fish_scale',
        slots: [
            { type: 'hoplite', count: 3 },              // Row 0 前卫抗线 = 希腊重装步兵 3人（雅典公民大盾长枪方阵正面抗线）
            { type: 'strategos', count: 4 },            // Row 1 中军主力 = 雅典将军卫队 4人（地米斯托克利十将军王牌亲军核心）
            { type: 'cretan_archer', count: 2 },        // Row 2 尾收远程 = 克里特弓箭手 2人（爱琴海神射手后排远距齐射）
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
        legionName: "战国武士军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hei_kuang', count: 3 },                 // Row 0 前卫铁骑 = 黑光铠骑兵 3骑（战国赤备突骑先锋）
            { type: 'samurai_elite', count: 4 },             // Row 1 中军主力 = 精锐日本武士 4人（大铠近卫武士主力突破）
            { type: 'rattan_archer', count: 2 },             // Row 2 尾收远射 = 藤弓手 2人（战国竹藤长弓精准掩护）
        ],
    },
    sanada_d: {
        legionName: "战国武士军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hei_kuang', count: 3 },
            { type: 'samurai_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
    },
    hashiba: {
        legionName: "战国武士军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hei_kuang', count: 3 },
            { type: 'samurai_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
    },
    date_d: {
        legionName: "战国武士军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'hei_kuang', count: 3 },
            { type: 'samurai_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
    },
    echigo: {
        legionName: "战国武士军团",
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
        formationMode: 'fish_scale',
        slots: [
            { type: 'vanguard', count: 4 },            // Row 0 前卫主力 = 先锋重装步兵 4人（纯步兵·无马，阿尔卑斯山地重装长矛死斗破坚）
            { type: 'cavalier', count: 3 },            // Row 1 中军铁骑 = 重装骑士 3骑（萨伏伊圣天使报喜骑士团中坚冲击）
            { type: 'arbalest', count: 2 },            // Row 2 尾收重弩 = 劲弩手 2人（纯步兵·无马，山地高穿透强弩射击掩护）
        ],
    },
    // 塔兰托·大希腊古都（阿契塔 · 塔兰丁标枪轻骑与重步兵方阵 · 鱼鳞阵 4+3+2：希腊雇佣重步兵 4 + 塔兰丁骑兵 3 + 罗得岛投石兵 2）
    talanduo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 4 },   // Row 0 前卫长枪坚壁 = 希腊雇佣重步兵 4人（纯步兵·无马，大希腊青铜圆盾长枪抗线）
            { type: 'tarantine_cavalry', count: 3 },   // Row 1 中军标枪突击 = 塔兰丁骑兵 3骑（大希腊王牌机动穿甲轻标枪轻骑）
            { type: 'rhodian_slinger', count: 2 },     // Row 2 尾收超远投石 = 罗得岛投石兵 2人（纯步兵·无马，地中海重铅弹超视距压制）
        ],
    },
    // 罗马帝国·恺撒 / 君士坦丁 / 尤里安 / 庞培 罗马军团步兵与百夫长伴随骑士战阵（雁行阵 4+3+2：军团步兵前锋 4 + 罗马百夫长中坚 3 + 掷矛手压阵 2）
    luoma_diguo: {
        legionName: "罗马军团",
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },           // Row 0 前排大盾宽线 = 罗马军团步兵 4人（纯步兵·无马，矩形大盾短剑正面推进）
            { type: 'equites', count: 3 },             // Row 1 中军铁骑突击 = 罗马百夫长 3骑（罗马贵族伴随战马重骑中坚突贯）
            { type: 'skirmisher', count: 2 },          // Row 2 尾收标枪压制 = 掷矛手 2人（纯步兵·无马，青年维利特斯重标枪破盾抛射）
        ],
    },
    gaolu_luoma: {
        legionName: "罗马军团",
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'equites', count: 3 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    mozeer: {
        legionName: "罗马军团",
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'equites', count: 3 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    aersasi: {
        legionName: "罗马军团",
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'equites', count: 3 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    qiliqiya: {
        legionName: "罗马军团",
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'equites', count: 3 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    // 阿契美尼德·波斯帝国军团（大流士 · 三角阵 2+3+4：萨珊铁骑 2 + 不死战士 3 + 波斯弓手主力 4）
    aqimeinide: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },           // Row 0 尖刀突击 = 萨珊萨瓦尔铁骑 2骑
            { type: 'immortal', count: 3 },        // Row 1 冲击中坚 = 不死战士 3人
            { type: 'immortal_ranged', count: 4 }, // Row 2 底边主力齐射 = 波斯长生军弓手 4人
        ],
    },
    // 波斯帝国军团（沙普尔大帝 · 尼沙布尔）
    aba: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 萨非帝国·伊斯法罕/加兹温（阿拔斯大帝 / 艾斯迈尔 · 奇兹尔巴什红头军团 · 鹤翼阵 2+4+3：古拉姆近卫 2 + 奇兹尔巴什红头战士主力 4 + 火枪兵 3）
    safawei_d: {
        legionName: "奇兹尔巴什红头军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'ghulam', count: 2 },            // Row 0 前哨抗线 = 古拉姆近卫战士 2人（高加索重装死士抗线）
            { type: 'qizilbash_warrior', count: 4 }, // Row 1 两翼主力 = 奇兹尔巴什红头战士 4骑（萨非核心红头狂热战骑雷霆突贯）
            { type: 'hand_cannoneer', count: 3 },    // Row 2 后排火力 = 火枪兵 3人（波斯正规火枪军团排枪齐射）
        ],
    },
    safawei: {
        legionName: "奇兹尔巴什红头军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'ghulam', count: 2 },
            { type: 'qizilbash_warrior', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
        ],
    },
    // 安息波斯帝国（阿尔沙克 · 尼萨）
    ansxi: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 苏伦家族（苏伦 · 法拉）
    delan: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 卡伦家族（苏赫拉 · 图斯）
    kalan: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 米底王国（戴奥凯斯 · 哈马丹）
    midi: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 萨法尔王朝（雅库布 · 博斯特）
    xisi: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 埃兰古波斯（舒特鲁克 · 苏萨）
    ailan: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 萨尔巴达尔（拉扎克 · 白哈格）
    saerbadaer: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 库米斯（阿尔普 · 达姆甘）
    kumisi: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 哈利（戈达尔兹 · 萨拉赫斯）
    hali: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 巴哈尔兹（盖瓦姆 · 泰巴德）
    baha: {
        legionName: "波斯帝国军团",
        formationMode: 'triangle',
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // 粟特王国·瓦拉赫沙（德瓦什提奇 · 鹤翼阵 2+4+3：持盾步兵 2 + 粟特甲胄铁骑主力 4 + 古典重装骑射 3）
    sogdian: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'sparabara', count: 2 },                      // Row 0 前哨诱敌 = 波斯持盾步兵 2人（大盾结阵抗线吸引火力）
            { type: 'sogdian_cataphract', count: 4 },            // Row 1 两翼绝对主力 = 粟特甲胄骑兵 4骑（全人马披挂重装具装铁骑合围突破）
            { type: 'antiquity_heavy_cavalry_archer', count: 3 }, // Row 2 中军后排支援 = 古典重装骑射手 3骑（重装弓骑兵漫天箭雨压制）
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
        legionName: "列提斯破甲铁骑与劲弩精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'leitis', count: 3 },        // Row 0 前卫突击 = 立陶宛列提斯 3骑
            { type: 'elite_leitis', count: 4 },  // Row 1 中军主力撕裂 = 立陶宛列提斯精锐 4骑（无视护甲之王主力突破）
            { type: 'arbalest', count: 2 },      // Row 2 尾收远程压阵 = 劲弩手 2人（SLAVIC 文化区标准远程）
        ],
    },
    nieman: {
        legionName: "列提斯破甲铁骑与劲弩精锐军团",
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
    // 圣殿骑士团·阿卡（莫莱 · 圣殿骑士团军团 · 鱼鳞阵 4+3+2：圣殿楷模武士 4 + 十字军骑士 3 + 劲弩手 2）
    shengdian_qishi: {
        legionName: "圣殿骑士团军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'paragon', count: 4 },              // Row 0 前卫主力破坚 = 圣殿楷模武士 4人（纯步兵·无马，全钢重铠双手大剑正面破坚）
            { type: 'crusader_knight', count: 3 },      // Row 1 中军铁骑冲击 = 十字军骑士 3骑（圣殿骑士团重装战马铁骑中坚突贯）
            { type: 'arbalest', count: 2 },             // Row 2 尾收远程压制 = 劲弩手 2人（纯步兵·无马，十字军重装城市强弩高穿透射击）
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
    // 拜占庭圣骑兵军团·君士坦丁堡/干尼亚（巴西尔二世 / 福卡斯 · 鱼鳞阵 3+4+2：拜占庭圣骑兵 3 + 拜占庭圣骑兵精锐主力 4 + 重装骑射手 2）
    baizanting: {
        legionName: "拜占庭圣骑兵军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'cataphract', count: 3 },        // Row 0 前卫 = 拜占庭圣骑兵 3骑（具装重铠甲骑兵前锋突破）
            { type: 'elite_cataphract', count: 4 },  // Row 1 中军突破主力 = 拜占庭圣骑兵精锐 4骑（帝国王牌圣骑兵重锤冲击）
            { type: 'cav_archer_heavy', count: 2 },  // Row 2 尾收压阵 = 重装骑射手 2骑（拜占庭重装弓骑兵两翼火力掩护）
        ],
    },
    kelite: {
        legionName: "拜占庭圣骑兵军团",
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
    // 不列颠·黑太子爱德华 / 阿尔弗雷德大帝 紫杉长弓兵精锐军团（三角阵 2+3+4：双手剑士前卫 2 + 长弓兵 3 + 精锐长弓兵主力 4）
    aquidan: {
        legionName: "紫杉长弓兵精锐军团",
        formationMode: 'triangle',
        slots: [
            { type: 'two_handed_swordsman', count: 2 }, // Row 0 尖刀坚壁 = 双手剑士 2人
            { type: 'longbowman', count: 3 },           // Row 1 齐射中坚 = 不列颠长弓兵 3人
            { type: 'longbowman_elite', count: 4 },     // Row 2 底边主力齐射 = 不列颠长弓兵精锐 4人
        ],
    },
    anggelu: {
        legionName: "紫杉长弓兵精锐军团",
        formationMode: 'triangle',
        slots: [
            { type: 'two_handed_swordsman', count: 2 },
            { type: 'longbowman', count: 3 },
            { type: 'longbowman_elite', count: 4 },
        ],
    },
    // 法兰克与法兰西·查理曼 / 查理马特 / 查理七世 / 吉尔德雷斯 掷斧兵与圣骑士精锐军团（鹤翼阵 2+4+3：掷斧兵前哨 2 + 精锐掷斧兵主力 4 + 游侠圣骑 3）
    jialuolin: {
        legionName: "掷斧兵与圣骑士精锐军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },       // Row 0 前哨飞斧破盾 = 法兰克掷斧兵 2人
            { type: 'elite_throwing_axeman', count: 4 }, // Row 1 狂暴突贯主力 = 法兰克掷斧兵精锐 4人
            { type: 'paladin', count: 3 },               // Row 2 中军后排圣骑驰援 = 游侠圣骑士 3人
        ],
    },
    falanji: {
        legionName: "掷斧兵与圣骑士精锐军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'paladin', count: 3 },
        ],
    },
    gaolu: {
        legionName: "掷斧兵与圣骑士精锐军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'paladin', count: 3 },
        ],
    },
    aermolika: {
        legionName: "掷斧兵与圣骑士精锐军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'paladin', count: 3 },
        ],
    },
    // 西班牙·熙德 / 费尔南多三世 / 阿方索十一世等 西班牙大方阵与希内特中世纪圣骑战阵（鱼鳞阵 4+3+2：重装长枪兵 4 + 精锐标枪骑兵 3 + 十字军圣骑士 2）
    balunxiya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },             // Row 0 前卫长枪方阵 = 重装长枪兵 4人（纯步兵·无马，西班牙大方阵坚固长矛之墙）
            { type: 'elite_genitour', count: 3 },            // Row 1 中军标枪轻骑 = 标枪骑兵精锐 3骑（西班牙希内特 Jinete 穿甲标枪机动穿插）
            { type: 'crusader_knight', count: 2 },           // Row 2 尾收圣殿铁骑 = 十字军圣骑士 2骑（收复失地十字军重装圣骑突击压阵）
        ],
    },
    guadaer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },
            { type: 'elite_genitour', count: 3 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    kasidiliya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },
            { type: 'elite_genitour', count: 3 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    leangongguo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },
            { type: 'elite_genitour', count: 3 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    xigete: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },
            { type: 'elite_genitour', count: 3 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    alagong: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },
            { type: 'elite_genitour', count: 3 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    // 基辅罗斯·基辅/切尔尼戈夫（雅罗斯拉夫 / 勇士姆斯季斯拉夫 · 瓦兰吉卫队军团 · 鱼鳞阵 3+4+2：诺斯狂暴战士 3 + 维京狂战士精锐 4 + 斯拉夫贵族铁骑 2）
    luosi: {
        legionName: "瓦兰吉卫队军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'norse_warrior', count: 3 },          // Row 0 前卫抗线 = 诺斯狂暴战士 3人（单手持斧配大圆盾，前排结盾墙筑壁抗线）
            { type: 'elite_berserk', count: 4 },          // Row 1 中军主力 = 维京狂战士精锐 4人（瓦兰吉双手大斧重铠近卫死士，中军主力突破）
            { type: 'boyar', count: 2 },                  // Row 2 两翼铁骑 = 斯拉夫贵族铁骑 2骑（罗斯波雅尔亲军战马两翼突击合围）
        ],
    },
    qiernigeweifu_gongguo: {
        legionName: "瓦兰吉卫队军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'norse_warrior', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'boyar', count: 2 },
        ],
    },
    // 北欧与维京·奥拉夫 / 阿布萨隆 / 比尔格雅尔 诺斯狂战士军团（鱼鳞阵 3+4+2：诺斯狂暴战士 3 + 精锐狂战士主力 4 + 掷矛手 2）
    nuosi: {
        legionName: "诺斯狂战士军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'norse_warrior', count: 3 }, // Row 0 前卫冲锋 = 诺斯狂暴战士 3人（双手持战斧狂暴死斗冲锋）
            { type: 'elite_berserk', count: 4 }, // Row 1 中军主力 = 维京狂战士精锐 4人（王牌重甲近卫狂战主力）
            { type: 'skirmisher', count: 2 },    // Row 2 尾收远程投掷 = 掷矛手 2人（北欧重型飞掷标枪破盾）
        ],
    },
    danmai: {
        legionName: "诺斯狂战士军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'norse_warrior', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    ruidian_yota: {
        legionName: "诺斯狂战士军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'norse_warrior', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    ruidian_si: {
        legionName: "诺斯狂战士军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'norse_warrior', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    // 高丽王朝·王建 / 姜邯赞 / 崔茂宣 / 尹瓘 / 金就砺 高丽战车车垒军团（雁行阵 4+3+2：火焰弓箭手 4 + 精锐高丽战车 3 + 刀剑手 2）
    goryeo: {
        legionName: "高丽战车车垒军团",
        formationMode: 'echelon',
        slots: [
            { type: 'fire_archer', count: 4 },               // Row 0 前排齐射 = 火焰弓箭手 4（高丽以弓术著称）
            { type: 'elite_war_wagon', count: 3 },           // Row 1 核心战车 = 精锐高丽战车 3（主力 3 档，战车不占 4 档）
            { type: 'jian_swordsman', count: 2 },            // Row 2 后排接应 = 刀剑手 2
        ],
    },
    chungju_d: {
        legionName: "高丽战车车垒军团",
        formationMode: 'echelon',
        slots: [
            { type: 'fire_archer', count: 4 },               // Row 0 前排齐射 = 火焰弓箭手 4
            { type: 'elite_war_wagon', count: 3 },           // Row 1 核心战车 = 精锐高丽战车 3
            { type: 'jian_swordsman', count: 2 },            // Row 2 后排接应 = 刀剑手 2
        ],
    },
    sabeol: {
        legionName: "高丽战车车垒军团",
        formationMode: 'echelon',
        slots: [
            { type: 'fire_archer', count: 4 },               // Row 0 前排齐射 = 火焰弓箭手 4
            { type: 'elite_war_wagon', count: 3 },           // Row 1 核心战车 = 精锐高丽战车 3
            { type: 'jian_swordsman', count: 2 },            // Row 2 后排接应 = 刀剑手 2
        ],
    },
    hai2: {
        legionName: "高丽战车车垒军团",
        formationMode: 'echelon',
        slots: [
            { type: 'fire_archer', count: 4 },               // Row 0 前排齐射 = 火焰弓箭手 4
            { type: 'elite_war_wagon', count: 3 },           // Row 1 核心战车 = 精锐高丽战车 3
            { type: 'jian_swordsman', count: 2 },            // Row 2 后排接应 = 刀剑手 2
        ],
    },
    woju: {
        legionName: "高丽战车车垒军团",
        formationMode: 'echelon',
        slots: [
            { type: 'fire_archer', count: 4 },               // Row 0 前排齐射 = 火焰弓箭手 4
            { type: 'elite_war_wagon', count: 3 },           // Row 1 核心战车 = 精锐高丽战车 3
            { type: 'jian_swordsman', count: 2 },            // Row 2 后排接应 = 刀剑手 2
        ],
    },
    // 波希米亚与捷克·扬杰斯卡 胡斯战车军团（雁行 4+3+2：锤炼兵 4 + 精锐胡斯战车 3 + 火枪兵 2）
    boximiya: {
        legionName: "胡斯战车军团",
        formationMode: 'echelon',
        slots: [
            { type: 'konnik_foot', count: 4 },         // Row 0 前卫筑墙 = 锤炼兵 4（重甲前卫抗线破阵）
            { type: 'elite_hussite_wagon', count: 3 }, // Row 1 核心车阵 = 精锐胡斯战车 3（主力 3 档，战车不占 4 档）
            { type: 'hand_cannoneer', count: 2 },      // Row 2 后排齐射 = 手炮手/火枪兵 2
        ],
    },
    // 意大利与热那亚·安德烈亚·多利亚 / 丹多洛 / 洛伦佐 全甲佣兵与大盾热那亚重弩军团（鱼鳞阵 3+4+2：意大利佣兵 3 + 精锐热那亚弩手主力 4 + 热那亚弩手 2）
    liguliya: {
        legionName: "全甲佣兵与大盾热那亚重弩军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'condottiero', count: 3 },                // Row 0 前卫抗线 = 意大利佣兵 3人（全钢板甲双手阔剑佣兵统领）
            { type: 'elite_genoese_crossbowman', count: 4 },  // Row 1 中军主力 = 意大利热那亚弩手精锐 4人（背负大盾超远重弩齐射）
            { type: 'genoese_crossbowman', count: 2 },        // Row 2 尾收掩护 = 意大利热那亚弩手 2人（大盾步弩后排掩护）
        ],
    },
    anuo: {
        legionName: "全甲佣兵与大盾热那亚重弩军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
            { type: 'genoese_crossbowman', count: 2 },
        ],
    },
    tuosikana: {
        legionName: "全甲佣兵与大盾热那亚重弩军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
            { type: 'genoese_crossbowman', count: 2 },
        ],
    },
    lunbadi: {
        legionName: "全甲佣兵与大盾热那亚重弩军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
            { type: 'genoese_crossbowman', count: 2 },
        ],
    },
    yadelaiya: {
        legionName: "全甲佣兵与大盾热那亚重弩军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
            { type: 'genoese_crossbowman', count: 2 },
        ],
    },
    // 葡萄牙军团·吉马良斯/波尔图（阿方索一世 / 桑乔一世 · 鱼鳞阵 3+4+2：双手剑士 3 + 重装长枪兵 4 + 劲弩手 2）
    putaoya: {
        legionName: "葡萄牙军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },      // 前卫剑士 = 双手剑士 3人（葡萄牙开国近卫大剑士）
            { type: 'heavy_pikeman', count: 4 },             // 主力长枪 = 重装长枪兵 4人（中世纪长矛方阵）
            { type: 'arbalest', count: 2 },                  // 尾收强弩 = 欧洲劲弩手 2人（开国十字军劲弩精准压制）
        ],
    },
    duluo: {
        legionName: "葡萄牙军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'heavy_pikeman', count: 4 },
            { type: 'arbalest', count: 2 },
        ],
    },
    // 格鲁吉亚·塔玛尔女王 莫纳斯帕王家近卫铁骑精锐军团（鱼鳞阵 3+4+2：莫纳斯帕前卫 3 + 精锐莫纳斯帕主力 4 + 复合弓手 2）
    gelujiya: {
        legionName: "莫纳斯帕王家近卫铁骑精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'monaspa', count: 3 },              // Row 0 前卫冲击 = 格鲁吉亚莫纳斯帕 3骑
            { type: 'elite_monaspa', count: 4 },        // Row 1 中军破阵主力 = 格鲁吉亚莫纳斯帕精锐 4骑（王家近卫铁骑主力）
            { type: 'composite_bowman', count: 2 },     // Row 2 尾收远程掩护 = 复合弓手 2人（WEST_ASIA 文化区标准远程）
        ],
    },
    // 亚美尼亚·埃里温（瓦尔丹 · 战锤修士与复合弓军团 · 3+2+4 阵型：亚美尼亚修士战士 3 + 重装骑士 2 + 精锐复合弓手 4）
    wulaertu: {
        legionName: "战锤修士与复合弓军团",
        formationMode: 'triangle',
        slots: [
            { type: 'warrior_priest', count: 3 },              // Row 0 前排抗线 = 亚美尼亚修士战士 3人（圣十字重锤强力破甲）
            { type: 'cavalier', count: 2 },                    // Row 1 中军铁骑 = 重装骑士 2骑（高山具装重骑机动接应）
            { type: 'elite_composite_bowman', count: 4 },      // Row 2 底边主力 = 精锐复合弓手 4人（王牌高加索复合强弓持续压制）
        ],
    },
    // 缅甸东吁王朝·莽应龙 / 莽瑞体 / 雍笈牙 白象御驾与飞镖铁骑军团（鱼鳞阵 3+4+2：御驾金鞍战象 3 + 飞镖骑兵精锐主力 4 + 飞镖骑兵 2）
    hantawadi: {
        legionName: "白象御驾与飞镖铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'bayinnaung_elephant', count: 3 },   // Row 0 前卫冲击 = 莽应龙御驾战象 3头（金鞍披甲巨象践踏破阵）
            { type: 'elite_arambai', count: 4 },         // Row 1 中军主力 = 缅甸飞镖骑兵精锐 4骑（王牌飞镖破甲高爆输出）
            { type: 'arambai', count: 2 },               // Row 2 尾收压阵 = 缅甸飞镖骑兵 2骑（密林快骑后方抛射掩护）
        ],
    },
    dongxu: {
        legionName: "白象御驾与飞镖铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'bayinnaung_elephant', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'arambai', count: 2 },
        ],
    },
    konbaung: {
        legionName: "白象御驾与飞镖铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'bayinnaung_elephant', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'arambai', count: 2 },
        ],
    },
    pyu: {
        legionName: "白象御驾与飞镖铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'bayinnaung_elephant', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'arambai', count: 2 },
        ],
    },
    mon: {
        legionName: "白象御驾与飞镖铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'bayinnaung_elephant', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'arambai', count: 2 },
        ],
    },
    // 扶南与高棉·范蔓 / 刀更孟 弩炮战象与爪刀精锐军团（鱼鳞阵 3+4+2：弩炮战象前卫 3 + 精锐爪刀勇士主力 4 + 步弓手 2）
    funan: {
        legionName: "弩炮战象与爪刀精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_ballista_elephant', count: 3 },   // Row 0 前卫巨兽 = 精锐弩战象 3（主力 3 档，象兵不占 4 档）
            { type: 'karambit_warrior_elite', count: 4 },    // Row 1 中军主力 = 精锐爪刀勇士 4
            { type: 'archer', count: 2 },                    // Row 2 尾收支援 = 步弓手 2
        ],
    },
    basha_d: {
        legionName: "弩炮战象与爪刀精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_ballista_elephant', count: 3 },   // Row 0 前卫巨兽 = 精锐弩战象 3
            { type: 'karambit_warrior_elite', count: 4 },    // Row 1 中军主力 = 精锐爪刀勇士 4
            { type: 'archer', count: 2 },                    // Row 2 尾收支援 = 步弓手 2
        ],
    },
    // 西西里与诺曼·腓特烈二世 / 罗杰二世 / 埃莱奥诺拉 军士长方阵与劲弩精锐军团（鱼鳞阵 3+4+2：军士长前卫 3 + 精锐军士长主力 4 + 劲弩手 2）
    xixiliwangguo: {
        legionName: "军士长方阵与劲弩精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'serjeant', count: 3 },            // Row 0 前卫坚壁 = 西西里军士长 3人（纯步兵·无马，持诺曼大盾长枪正面结阵抗线）
            { type: 'elite_serjeant', count: 4 },      // Row 1 中军主力破阵 = 西西里军士长精锐 4人（主力重装步兵方阵推进）
            { type: 'arbalest', count: 2 },            // Row 2 尾收远程压制 = 劲弩手 2人（纯步兵·无马，后排破甲重弩强力压制）
        ],
    },
    moxina: {
        legionName: "军士长方阵与劲弩精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'serjeant', count: 3 },
            { type: 'elite_serjeant', count: 4 },
            { type: 'arbalest', count: 2 },
        ],
    },
    sading: {
        legionName: "军士长方阵与劲弩精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'serjeant', count: 3 },
            { type: 'elite_serjeant', count: 4 },
            { type: 'arbalest', count: 2 },
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
    // 勃艮第公国·第戎（大胆查理 · 敕令军团马上轻骑爆发冲锋大阵 · 鱼鳞阵 4+3+2：重装长枪兵 4 + 马上轻骑精锐 3 + 劲弩手 2）
    bogendi: {
        legionName: "敕令军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },        // Row 0 前卫长枪坚壁 = 重装长枪兵 4人（纯步兵·无马，前排长矛筑起坚固拒马线）
            { type: 'elite_coustillier', count: 3 },    // Row 1 中军铁骑冲击 = 马上轻骑精锐 3骑（勃艮第敕令军团王牌，骑枪爆发充能冲锋）
            { type: 'arbalest', count: 2 },             // Row 2 尾收城市劲弩 = 劲弩手 2人（纯步兵·无马，后排高穿透强弩射击）
        ],
    },
    // 萨拉森与阿拉伯·萨拉赫丁 / 穆阿维叶 马穆鲁克弯刀重骑与骆驼弓精锐军团（鱼鳞阵 3+4+2：马穆鲁克前卫 3 + 精锐马穆鲁克主力 4 + 骆驼弓骑 2）
    ayoubu: {
        legionName: "马穆鲁克弯刀重骑与骆驼弓精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mameluke', count: 3 },            // Row 0 前卫突击 = 萨拉森马穆鲁克 3骑（弯刀重骑前锋撕裂）
            { type: 'elite_mameluke', count: 4 },      // Row 1 中军主力劈杀 = 萨拉森马穆鲁克精锐 4骑（近卫重骑主力突破）
            { type: 'camel_archer', count: 2 },        // Row 2 尾收远程掩护 = 柏柏尔骆驼弓骑 2骑（高机动骆驼骑射压制）
        ],
    },
    womaya: {
        legionName: "马穆鲁克弯刀重骑与骆驼弓精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mameluke', count: 3 },
            { type: 'elite_mameluke', count: 4 },
            { type: 'camel_archer', count: 2 },
        ],
    },
    // 哥特·狄奥多里克大帝 哥特近卫军盾墙与弩手精锐军团（鱼鳞阵 3+4+2：哥特近卫军前卫 3 + 精锐哥特近卫军主力 4 + 弩兵 2）
    donggete: {
        legionName: "哥特近卫军盾墙与弩手精锐军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'huskarl', count: 3 },            // Row 0 前卫坚壁 = 哥特近卫军 3人（纯步兵·无马，持重盾顶着箭雨推进）
            { type: 'elite_huskarl', count: 4 },      // Row 1 中军主力破阵 = 哥特近卫军精锐 4人（主力近卫步兵盾墙撕裂）
            { type: 'crossbowman', count: 2 },        // Row 2 尾收远程压制 = 弩兵 2人（纯步兵·无马，后排强弩射击压制）
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
        legionName: "1415征服休达葡萄牙要塞军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },        // Row 0 前卫长枪 = 重装长枪兵 4人（纯步兵·无马，十字军重装长枪抗线拒马）
            { type: 'cavalier', count: 3 },             // Row 1 中军铁骑 = 重装骑士 3骑（吕西尼昂王家十字军重装铁骑中坚冲击）
            { type: 'arbalest', count: 2 },             // Row 2 尾收重弩 = 劲弩手 2人（纯步兵·无马，海岛要塞高穿透强弩射击掩护）
        ],
    },
    // 博斯普鲁斯王国·潘提卡彭（琉孔一世 · 萨尔马提亚具装重骑与希腊长枪大阵 · 鱼鳞阵 4+3+2：希腊雇佣重步兵 4 + 帝国具装骑兵 3 + 复合弓手 2）
    bosi_puluosi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 4 },   // Row 0 前卫坚壁 = 希腊雇佣重步兵 4人（纯步兵·无马，博斯普鲁斯青铜圆盾长枪抗线）
            { type: 'imperial_cavalry', count: 3 },    // Row 1 中军铁骑 = 帝国具装骑兵 3骑（萨尔马提亚全具装铁骑中坚冲击）
            { type: 'composite_bowman', count: 2 },    // Row 2 尾收神弓 = 复合弓手 2人（纯步兵·无马，黑海斯基泰-希腊复合重弓射击掩护）
        ],
    },
    // 保加利亚帝国·特尔诺沃（阿森一世 · 具装近卫铁骑与重盾勇士大阵 · 鹤翼阵 2+4+3：下马保加利亚勇士 2 + 保加利亚骑兵精锐 4 + 复合弓手 3）
    baojialiya: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'konnik_foot', count: 2 },          // Row 0 前锋坚壁 = 下马保加利亚勇士 2人（纯步兵·无马，重盾前卫引敌接战）
            { type: 'elite_konnik', count: 4 },         // Row 1 中军主力 = 保加利亚骑兵精锐 4骑（王牌具装近卫重骑，重锤破甲核心冲击）
            { type: 'composite_bowman', count: 3 },     // Row 2 尾收远射 = 复合弓手 3人（纯步兵·无马，巴尔干角木重弓精准两翼掩护）
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
        legionName: "凯尔特突袭者军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },          // Row 0 前卫突袭 = 凯尔特靛蓝突袭者 3人（纯步兵·无马，高速突袭）
            { type: 'elite_woad_raider', count: 4 },    // Row 1 中军主力破阵 = 凯尔特靛蓝突袭者精锐 4人（主力狂暴劈杀）
            { type: 'longbowman', count: 2 },           // Row 2 尾收远程吊射 = 长弓兵 2人（纯步兵·无马，后排战弓抛射压制）
        ],
    },
    piketai: {
        legionName: "凯尔特突袭者军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },
            { type: 'elite_woad_raider', count: 4 },
            { type: 'longbowman', count: 2 },
        ],
    },
    gaer: {
        legionName: "凯尔特突袭者军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },
            { type: 'elite_woad_raider', count: 4 },
            { type: 'longbowman', count: 2 },
        ],
    },
    // 孔雀战象软剑军团·华氏城/曲女城/瓦拉纳西/索姆纳特（旃陀罗笈多 / 戒日王 / 频毗娑罗 / 普拉塔帕 · 鹤翼阵 2+4+3：桑纳亚装甲战象 2 + 软剑士精锐主力 4 + 帕提尤达长弓 3）
    kongque: {
        legionName: "孔雀战象软剑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },                 // Row 0 前锋破坚 = 孔雀王朝桑纳亚战象 2头（《政事论》经典巨象开路撞阵）
            { type: 'elite_urumi_swordsman', count: 4 },    // Row 1 中军主力 = 达罗毗荼软剑士精锐 4人（王牌主力近战双刃钢带旋斩）
            { type: 'pattiyoda_longbowman', count: 3 },     // Row 2 后排掩护 = 僧伽罗帕提尤达长弓手 3人（古印度高穿透重竹木长弓）
        ],
    },
    jieri: {
        legionName: "孔雀战象软剑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'pattiyoda_longbowman', count: 3 },
        ],
    },
    // 摩揭陀王国·王舍城（频毗娑罗王 · 弧刃弯刀死士与披甲战象大阵 · 鱼鳞阵 4+3+2：达罗毗荼镰刀战士 4 + 帕提尤达长弓手 3 + 孔雀王朝战象 2）
    mojietuo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'sickle_warrior', count: 4 },           // Row 0 前卫主力突击 = 达罗毗荼镰刀战士 4人（纯步兵·无马，手持弧刃弯刀近身极速砍杀破盾）
            { type: 'pattiyoda_longbowman', count: 3 },     // Row 1 中军长弓神射 = 僧伽罗帕提尤达长弓手 3人（纯步兵·无马，古印度竹木重长弓连绵抛射）
            { type: 'sannahya', count: 2 },                 // Row 2 尾收装甲巨象 = 孔雀王朝战象 2头（披甲巨象压阵发起毁灭性践踏冲锋）
        ],
    },
    // 波罗帝国·高达城/孟加拉（达磨波罗 · 拉塔重装双栖战车与长弓大阵 · 雁行阵 4+3+2：重装长枪兵 4 + 孟加拉拉塔战车精锐 3 + 僧伽罗长弓手 2）
    boluo: {
        formationMode: 'echelon',
        slots: [
            { type: 'heavy_pikeman', count: 4 },           // Row 0 前卫长枪坚壁 = 重装长枪兵 4人（前排筑起钢铁长矛拒马线）
            { type: 'elite_ratha_melee', count: 3 },       // Row 1 核心战车 = 孟加拉拉塔战车精锐 3乘（主力 3 档，战车不占 4 档）
            { type: 'pattiyoda_longbowman', count: 2 },    // Row 2 后排长弓 = 僧伽罗帕提尤达长弓手 2人
        ],
    },
    jiashi_d: {
        legionName: "孔雀战象软剑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'pattiyoda_longbowman', count: 3 },
        ],
    },
    sumo: {
        legionName: "孔雀战象软剑军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'pattiyoda_longbowman', count: 3 },
        ],
    },
    // 德里苏丹国·德里（阿拉乌丁·卡尔吉 · 象背重弓高台与近卫古拉姆铁甲大阵 · 鱼鳞阵 4+3+2：重装长枪兵 4 + 象弓骑兵精锐 3 + 古拉姆 2）
    deli: {
        formationMode: 'echelon',
        slots: [
            { type: 'heavy_pikeman', count: 4 },            // Row 0 前卫长枪坚壁 = 重装长枪兵 4人（前排筑起钢铁长矛拒马线）
            { type: 'elite_elephant_archer', count: 3 },    // Row 1 核心象弓高台 = 象弓骑兵精锐 3头（主力 3 档，象兵不占 4 档）
            { type: 'ghulam', count: 2 },                   // Row 2 后排接应 = 印度斯坦古拉姆 2人
        ],
    },
    mowoer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'ghulam', count: 3 },
            { type: 'imperial_camel_rider', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    // 印度与锡克·兰季特·辛格 / 拉其特 / 哈里·辛格 飞轮掷手漫天破阵精锐军团（三角阵 2+3+4：重装长枪前卫 2 + 飞轮掷手 3 + 精锐飞轮掷手主力 4）
    xike: {
        legionName: "飞轮掷手漫天破阵精锐军团",
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },           // Row 0 尖刀坚壁 = 重装长枪兵 2人（纯步兵·无马，前排抗线拒马）
            { type: 'chakram_thrower', count: 3 },         // Row 1 中军投射 = 古吉拉特飞轮掷手 3人（纯步兵·无马，中距离回旋飞轮）
            { type: 'elite_chakram_thrower', count: 4 },   // Row 2 底边主力弹幕 = 古吉拉特飞轮掷手精锐 4人（纯步兵·无马，漫天飞轮破阵）
        ],
    },
    ahaomu: {
        legionName: "飞轮掷手漫天破阵精锐军团",
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'chakram_thrower', count: 3 },
            { type: 'elite_chakram_thrower', count: 4 },
        ],
    },
    // 旁遮普·阿托克（哈里·辛格 · 海达斯佩斯河波鲁斯王巨象战阵 · 鱼鳞阵 4+3+2：重装长枪兵 4 + 帕提尤达长弓手 3 + 波鲁斯王战象 2）
    pangzha: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },           // Row 0 前卫抗线 = 重装长枪兵 4人（纯步兵·无马，长盾重枪筑起坚固拒马防线）
            { type: 'pattiyoda_longbowman', count: 3 },    // Row 1 中军远射 = 僧伽罗帕提尤达长弓手 3人（纯步兵·无马，南亚高穿透竹木重长弓连绵抛射）
            { type: 'porus_elephant', count: 2 },          // Row 2 尾收巨兽 = 波鲁斯王战象 2头（全游最高 HP 530 范围践踏，压阵毁灭性冲锋）
        ],
    },
    // 迦太基与布匿·汉尼拔 / 哈米尔卡 战象践踏与标枪精锐军团（雁行阵 4+3+2：掷矛手 4 + 精锐战象 3 + 长矛兵 2）
    buni: {
        legionName: "战象践踏与标枪精锐军团",
        formationMode: 'echelon',
        slots: [
            { type: 'skirmisher', count: 4 },                // Row 0 前排投射 = 掷矛手 4
            { type: 'elite_war_elephant', count: 3 },        // Row 1 核心战象 = 精锐战象 3（主力 3 档，象兵不占 4 档）
            { type: 'spearman', count: 2 },                  // Row 2 后排接应 = 长矛兵 2
        ],
    },
    feiniqi: {
        legionName: "战象践踏与标枪精锐军团",
        formationMode: 'echelon',
        slots: [
            { type: 'skirmisher', count: 4 },                // Row 0 前排投射 = 掷矛手 4
            { type: 'elite_war_elephant', count: 3 },        // Row 1 核心战象 = 精锐战象 3
            { type: 'spearman', count: 2 },                  // Row 2 后排接应 = 长矛兵 2
        ],
    },
    // 古埃及、赫梯与美索不达米亚·拉美西斯 / 穆瓦塔利 / 图特摩斯 / 卢伽尔扎克西 / 尼布甲尼撒 / 萨尔贡 / 沙姆希阿达德 / 萨利蒂 双轮战车军团（雁行阵 4+3+2：弓兵 4 + 双轮战车精锐 3 + 持盾步兵 2）
    heti: {
        legionName: "双轮战车军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4（埃及／赫梯／亚述军队主体是大量弓手）
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3（主力 3 档，战车不占 4 档）
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    aiji: {
        legionName: "双轮战车军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    dibisi: {
        legionName: "双轮战车军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    sumeier: {
        legionName: "双轮战车军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    jialedi: {
        legionName: "双轮战车军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    yashu: {
        legionName: "双轮战车军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    guyashu: {
        legionName: "双轮战车军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    xikesuosi: {
        legionName: "双轮战车军团",
        formationMode: 'echelon',
        slots: [
            { type: 'bowman', count: 4 },                    // Row 0 前排齐射 = 弓兵 4
            { type: 'elite_war_chariot', count: 3 },         // Row 1 核心战车 = 双轮战车精锐 3
            { type: 'sparabara', count: 2 },                 // Row 2 后排接应 = 持盾步兵 2
        ],
    },
    // 中南半岛·纳黎萱 / 阿奴律陀 / 阇耶跋摩 东南亚战象与步弓精锐军团（雁行阵 4+3+2：步弓手 4 + 精锐战斗象 3 + 爪刀勇士 2）
    siam: {
        legionName: "东南亚战象与步弓精锐军团",
        formationMode: 'echelon',
        slots: [
            { type: 'archer', count: 4 },                    // Row 0 前排齐射 = 步弓手 4（东南亚军队主体是征召弓手与步兵）
            { type: 'elite_battle_elephant', count: 3 },     // Row 1 核心战象 = 精锐战斗象 3（主力 3 档，象兵不占 4 档）
            { type: 'karambit_warrior', count: 2 },          // Row 2 后排接应 = 爪刀勇士 2
        ],
    },
    pagan: {
        legionName: "东南亚战象与步弓精锐军团",
        formationMode: 'echelon',
        slots: [
            { type: 'archer', count: 4 },                    // Row 0 前排齐射 = 步弓手 4
            { type: 'elite_battle_elephant', count: 3 },     // Row 1 核心战象 = 精锐战斗象 3
            { type: 'karambit_warrior', count: 2 },          // Row 2 后排接应 = 爪刀勇士 2
        ],
    },
    // 高棉帝国·吴哥/真腊（阇耶跋摩七世 · 象背机械弩炮与皇家爪刀卫队 · 鱼鳞阵 4+3+2：重装长枪兵 4 + 爪刀勇士精锐 3 + 高棉弩炮战象 2）
    chenla: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },             // Row 0 前卫长矛坚壁 = 重装长枪兵 4人（纯步兵·无马，前排筑起长矛拒马线）
            { type: 'karambit_warrior_elite', count: 3 },    // Row 1 中军精锐突刺 = 爪刀勇士精锐 3人（纯步兵·无马，高棉王牌近战极速绞杀）
            { type: 'ballista_elephant', count: 2 },         // Row 2 尾收机械重弩 = 高棉弩炮战象 2头（象背双人机械床弩，后排超远距离贯穿重箭）
        ],
    },
    // 阿拉伯骆驼弓骑军团·麦地那/巴格达/麦加/巴士拉（哈立德 / 曼苏尔 / 艾布苏富扬 / 齐亚德 · 三角阵 2+3+4：东方剑士前锋 2 + 骆驼弓骑 3 + 精锐骆驼弓骑主力 4）
    maidina: {
        legionName: "阿拉伯骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },      // Row 0 尖刀先锋 = 东方剑士 2人（纯步兵·无马，弯刀前排坚壁抗线）
            { type: 'camel_archer', count: 3 },           // Row 1 冲击中坚 = 骆驼弓骑兵 3骑（大漠机动奔袭）
            { type: 'elite_camel_archer', count: 4 },     // Row 2 底边主力齐射 = 精锐骆驼弓骑兵 4骑（王牌精锐大漠重弓齐射）
        ],
    },
    abasi: {
        legionName: "阿拉伯骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    gulaishi: {
        legionName: "阿拉伯骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    alabo: {
        legionName: "阿拉伯骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    // 小亚细亚近卫军团·阿马西亚/斯法尔德/戈尔迪翁/尼科米底亚（密特里达梯 / 克罗伊斯 / 迈达斯 / 狄奥多尔 · 鱼鳞阵 3+4+2：重装近卫前卫 3 + 重装近卫精锐主力 4 + 复合弓手 2）
    bendou_d: {
        legionName: "小亚细亚近卫军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },              // Row 0 前卫抗线 = 古代重装近卫军 3人（纯步兵·无马，重装铜铠大盾前线坚壁抗线）
            { type: 'elite_guardsman', count: 4 },        // Row 1 中军主力 = 古代重装近卫军精锐 4人（纯步兵·无马，王家近卫精锐长矛主力突击）
            { type: 'composite_bowman', count: 2 },       // Row 2 尾收远射 = 复合弓手 2人（纯步兵·无马，后排步弓远射压制）
        ],
    },
    ldiya: {
        legionName: "小亚细亚近卫军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    fulijiya: {
        legionName: "小亚细亚近卫军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    bitiniya: {
        legionName: "小亚细亚近卫军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    // 希腊贵族铁骑军团·米利都/特拉布宗/科孚（阿里斯塔 / 阿历克塞 / 舒伦堡 · 鱼鳞阵 3+4+2：贵族骑兵前卫 3 + 贵族骑兵精锐主力 4 + 克里特弓箭手 2）
    aiaoniya: {
        legionName: "希腊贵族铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },    // Row 0 前卫突击 = 希腊贵族骑兵 3骑（重装前锋破线）
            { type: 'elite_greek_cavalry', count: 4 },    // Row 1 中军主力 = 希腊贵族骑兵精锐 4骑（王牌精锐贵族重骑主力突贯决战）
            { type: 'cretan_archer', count: 2 },          // Row 2 尾收远射 = 克里特弓箭手 2人（纯步兵·无马，后方步弓压制）
        ],
    },
    bendou: {
        legionName: "希腊贵族铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'elite_greek_cavalry', count: 4 },
            { type: 'cretan_archer', count: 2 },
        ],
    },
    kejila: {
        legionName: "希腊贵族铁骑军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'elite_greek_cavalry', count: 4 },
            { type: 'cretan_archer', count: 2 },
        ],
    },
    // 印度-希腊王国·那竭/顶骨城（米南德一世 · 巴克特里亚神弓与希腊铁骑战阵 · 鱼鳞阵 4+3+2：希腊雇佣重步兵 4 + 冲击重骑兵 3 + 巴克特里亚弓手 2）
    najie: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 4 },   // Row 0 前卫长枪坚壁 = 希腊雇佣重步兵 4人（纯步兵·无马，大夏希腊青铜圆盾长枪抗线）
            { type: 'shock_cavalry', count: 3 },       // Row 1 中军铁骑突击 = 冲击重骑兵 3骑（希腊-大夏突击铁骑中坚冲击）
            { type: 'bactrian_archer', count: 2 },     // Row 2 尾收复合神弓 = 巴克特里亚弓手 2人（纯步兵·无马，中亚希腊化复合重弓超远距离高伤害抛射）
        ],
    },
    // 刹帝利灵猫骑兵军团·巴米扬/坎大哈（突骑施 / 艾哈迈德沙 · 鱼鳞阵 3+4+2：刹帝利灵猫骑兵前卫 3 + 刹帝利精锐主力 4 + 步弓手 2）
    fanyanna: {
        legionName: "刹帝利灵猫骑兵军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'shrivamsha_rider', count: 3 },
            { type: 'elite_shrivamsha_rider', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    dulan_d: {
        legionName: "刹帝利灵猫骑兵军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'shrivamsha_rider', count: 3 },
            { type: 'elite_shrivamsha_rider', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    // 马格里布骆驼弓骑军团·特莱姆森/布佳亚/凯鲁万/非斯/马拉喀什/阿尔及尔/的黎波里（亚格姆拉森 / 哈马德 / 奥克巴 / 伊德里斯 / 塔什芬 / 巴巴罗萨 / 德拉古特 · 三角阵 2+3+4：萨拉森马穆鲁克 2 + 柏柏尔标枪骑兵 3 + 柏柏尔骆驼弓骑主力 4）
    zhayan: {
        legionName: "马格里布骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },      // Row 0 尖刀先锋 = 萨拉森马穆鲁克 2人
            { type: 'genitour', count: 3 },      // Row 1 冲击中坚 = 柏柏尔标枪骑兵 3人
            { type: 'camel_archer', count: 4 },  // Row 2 底边主力齐射 = 柏柏尔骆驼弓骑 4人
        ],
    },
    hamade: {
        legionName: "马格里布骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    aguelabu: {
        legionName: "马格里布骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    yidelisi: {
        legionName: "马格里布骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    mulabite: {
        legionName: "马格里布骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    babali: {
        legionName: "马格里布骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    telibolisi: {
        legionName: "马格里布骆驼弓骑军团",
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 休达·直布罗陀（恩里克王子 · 1415征服休达葡萄牙要塞军团 · 鱼鳞阵 4+3+2：重装长枪兵 4 + 重装骑士 3 + 劲弩手 2）
    zhibuluotuo: {
        legionName: "1415征服休达葡萄牙要塞军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 4 },        // Row 0 前卫长枪坚壁 = 重装长枪兵 4人（纯步兵·无马，休达要塞长矛死守抗线）
            { type: 'cavalier', count: 3 },             // Row 1 中军铁骑突贯 = 重装骑士 3骑（葡萄牙阿维斯王朝皇家重骑中坚冲击）
            { type: 'arbalest', count: 2 },             // Row 2 尾收要塞劲弩 = 劲弩手 2人（纯步兵·无马，海防要塞高穿透强弩射击）
        ],
    },
    // 占婆爪刀藤弓军团·毗阇耶/因陀罗补罗（制蓬峨 / 制旻 · 鱼鳞阵 3+4+2：爪刀勇士前卫 3 + 爪刀勇士精锐主力 4 + 藤弓兵 2）
    champa: {
        legionName: "占婆爪刀藤弓军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'karambit_warrior', count: 3 },        // Row 0 前卫突入 = 爪刀勇士 3人（纯步兵·无马，前排双持近战弯刃）
            { type: 'karambit_warrior_elite', count: 4 },  // Row 1 中军主力 = 爪刀勇士精锐 4人（纯步兵·无马，主力极速贴身近战突刺）
            { type: 'rattan_archer', count: 2 },           // Row 2 尾收远射 = 藤弓兵 2人（纯步兵·无马，后方步弓压制掩护）
        ],
    },
    zhancheng: {
        legionName: "占婆爪刀藤弓军团",
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
    // 中南半岛阿瓦王朝·思机法 掸族战象与密林劲弓大阵（三角阵 2+3+4：皮甲战象尖刀 2 + 缅刀双手剑士中坚 3 + 步弓手主力 4）
    ava: {
        formationMode: 'triangle',
        slots: [
            { type: 'armored_elephant', count: 2 },        // Row 0 尖刀巨象 = 皮甲战象 2头（掸族象卫前沿开路践踏破阵）
            { type: 'two_handed_swordsman', count: 3 },    // Row 1 刀手近战 = 双手剑士 3人（缅刀近卫中坚贴身接战）
            { type: 'archer', count: 4 },                  // Row 2 底边主力齐射 = 步弓手 4人（密林步弓后排暴雨抛射）
        ],
    },
    // 大越帝国·升龙（陈国峻/陈兴道 · 岭南三角阵 2+3+4：皮甲战象尖刀 2 + 帝王掷矛手中坚 3 + 精锐藤弓兵主力 4）
    dayue: {
        formationMode: 'triangle',
        slots: [
            { type: 'armored_elephant', count: 2 },        // Row 0 尖刀巨兽 = 皮甲战象 2头（前沿象阵开路冲撞）
            { type: 'imperial_skirmisher', count: 3 },     // Row 1 掷矛中坚 = 帝王掷矛手 3人（大越专属王牌掷矛手，中距离重标枪穿甲反弓）
            { type: 'rattan_archer_elite', count: 4 },     // Row 2 底边主力齐射 = 精锐藤弓兵 4人（密林精锐藤弓，后排暴雨抛射）
        ],
    },
    // 哥萨克纯骑兵军团·塞契/阿速城/切尔卡瑟（赫梅利 / 塔塔里诺夫 / 拜达 · 鹤翼阵 2+4+3：骑马火枪前锋 2 + 马扎尔骠骑主力 4 + 重装骑射 3）
    gesake: {
        legionName: "哥萨克纯骑兵军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'conquistador', count: 2 },          // Row 0 前锋破线 = 骑马火枪手 2骑（哥萨克战马火枪前哨放排枪破甲）
            { type: 'magyar_huszar', count: 4 },         // Row 1 中军主力 = 马扎尔骠骑兵 4骑（哥萨克精锐战骑核心冲击）
            { type: 'cav_archer_heavy', count: 3 },      // Row 2 尾收远射 = 重装骑射手 3骑（东欧草原快马重弓后排驰射掩护）
        ],
    },
    dunhe: {
        legionName: "哥萨克纯骑兵军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'conquistador', count: 2 },
            { type: 'magyar_huszar', count: 4 },
            { type: 'cav_archer_heavy', count: 3 },
        ],
    },
    qiekase: {
        legionName: "哥萨克纯骑兵军团",
        formationMode: 'crane_wing',
        slots: [
            { type: 'conquistador', count: 2 },
            { type: 'magyar_huszar', count: 4 },
            { type: 'cav_archer_heavy', count: 3 },
        ],
    },
    // 奥斯若恩·埃德萨（鲍德温 · 圣殿骑士团军团 · 鱼鳞阵 4+3+2：圣殿楷模武士 4 + 十字军圣殿骑士 3 + 劲弩手 2）
    aosiruowen: {
        legionName: "圣殿骑士团军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'paragon', count: 4 },              // Row 0 前卫主力破坚 = 圣殿楷模武士 4人（双手大剑正面破坚）
            { type: 'crusader_knight', count: 3 },      // Row 1 中军铁骑冲击 = 十字军圣殿骑士 3骑（白袍红十字重装铁骑核心突击）
            { type: 'arbalest', count: 2 },             // Row 2 尾收远程压制 = 劲弩手 2人（十字军重型劲弩高穿透射击）
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
        legionName: "奴儿干都司与极北海岛军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },           // Row 0 尖刀突骑 = 答剌罕骑兵 2骑（极北通古斯重骑突击）
            { type: 'recurve_bowman', count: 3 },   // Row 1 中坚步射 = 反曲长弓手 3人（林海强弓齐射）
            { type: 'xianbei_raider', count: 4 },   // Row 2 主力骑射 = 鲜卑掠骑兵 4骑（雪原快马游射压制）
        ],
    },
    jilimi: {
        legionName: "奴儿干都司与极北海岛军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    feiyaka: {
        legionName: "奴儿干都司与极北海岛军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    eluoke: {
        legionName: "奴儿干都司与极北海岛军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    kuye: {
        legionName: "奴儿干都司与极北海岛军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    beihai: {
        legionName: "奴儿干都司与极北海岛军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    ayinu_ezo: {
        legionName: "奴儿干都司与极北海岛军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    ayinu: {
        legionName: "奴儿干都司与极北海岛军团",
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'recurve_bowman', count: 3 },
            { type: 'xianbei_raider', count: 4 },
        ],
    },
    "yehe": {
        legionName: "满清军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "wula": {
        legionName: "满清军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "haixi_nvzhen": {
        legionName: "满清军团",
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "wenling": {
        formationMode: "triangle",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "chukonu", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
};
