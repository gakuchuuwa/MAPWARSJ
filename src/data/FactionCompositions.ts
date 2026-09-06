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
    /** 军团种类（编辑器判型）：region 文化军团 / solo 特定军团。
     *  🔴 [2026-09-06 主人铁律] 只有这两种，era「时代军团」已废除，不许再写。 */
    legionType?: 'region' | 'solo';
    formationMode: FormationMode;
    slots: CompositionSlot[];
    /** 水战/航行时的舰队队形；缺省 = 'auto'（按船数自动，旧行为） */
    navalFormation?: NavalFormationMode;
}

export const FACTION_COMPOSITIONS: Record<string, CustomFactionLegion> = {
    // 秦国军团·天水/咸阳/长子/武关/骊山/商邑/番禺（司马错 / 白起 / 王翦 / 章邯 / 商鞅 / 赵佗 · 雁行阵 4+3+2：枪兵长 4 + 先秦远程战车 3 + 诸葛弩 2）
    "qin": {
        legionName: "秦国军团",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "xin": {
        legionName: "秦国军团",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "wazhai": {
        legionName: "秦国军团",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "nanyue": {
        legionName: "秦国军团",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
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
    "jin": {
        legionName: "秦国军团",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    // 大秦长城军团·高阙塞（蒙恬 · 长城烽火卫 · 鱼鳞阵 4+3+2：虎豹骑 4 + 先秦远程战车 3 + 古典骑射手 2）
    "baiyang": {
        legionName: "秦长城军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_chukonu", count: 3 },
            { type: "war_chariot_ranged", count: 3 },
            { type: "tiger_rider", count: 2 },
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
    "ruo": {
        legionName: "秦国军团",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
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
    "shangzhou": {
        legionName: "秦国军团",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
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
        legionName: "忠孝军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'iron_pagoda', count: 4 },            // Row 0 前卫铁骑 = 女真铁浮屠 4骑（忠孝军精锐重铠铁骑，前锋雷霆冲击）
            { type: 'fire_lancer', count: 3 },            // Row 1 中军火矛 = 火矛手 3人（飞火枪突进，近距离喷火刺杀破阵）
            { type: 'grenadier', count: 2 },              // Row 2 尾收火器 = 掷弹兵 2人（震天雷铁罐火药弹，后排范围轰炸破坚）
        ],
    },
    // 满清军团·抚顺/赫图阿拉/盛京/吉林乌拉/呼伦贝尔/威远营/西宁（努尔哈赤 / 皇太极 / 多尔衮 / 阿桂 / 海兰察 / 年羹尧 / 岳钟琪 · 鱼鳞阵 3+4+2：女真铁浮屠 3 + 草原枪骑兵精锐 4 + 重装骑射手 2）
    // 南宋·岳飞 / 韩世忠 / 孟珙 / 刘锜 火矛手军团（鱼鳞阵 3+4+2：精锐火矛手前卫 3 + 刀剑手主力 4 + 诸葛弩 2）
    "yanchuan_d": {
        legionName: "背嵬军团",
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
        legionName: "北宋禁军团",
        formationMode: "fish_scale",
        slots: [
            { type: "liao_dao", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "keshik", count: 2 },
        ],
    },
    "heng1": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "keshik", count: 2 },
        ],
    },
    "changshan": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "keshik", count: 2 },
        ],
    },
    "zhai_han": {
        legionName: "蕃落骑军团",
        legionType: "solo",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "keshik", count: 2 },
        ],
    },
    "yanzhou": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "keshik", count: 2 },
        ],
    },
    "huan": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "keshik", count: 2 },
        ],
    },
    "didao": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "keshik", count: 2 },
        ],
    },
    "qing": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "keshik", count: 2 },
        ],
    },
    "xiangzhou": {
        legionName: "蕃落骑军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "keshik", count: 2 },
        ],
    },
    // 奥斯曼帝国·布尔萨（穆罕默德二世 · 三角阵 2+3+4：土耳其禁卫军 2 + 土耳其禁卫军精锐 3 + 奥斯曼皇家禁卫军主力 4）
    // 草原与中亚诸大汗·怯薛铁骑军团（鱼鳞阵 3+4+2：怯薛军前卫 3 + 精锐怯薛军主力 4 + 蒙古突骑 2）
    // 包含：成吉思汗、拔都、忽必烈、帖木儿、旭烈兀、速不台、木华黎、也速该、札木合、也先、噶尔丹、昔班尼、巴布尔、突厥大汗等
    "menggu_d": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "jinzhang": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yuan_d": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    // 帖木儿帝国·撒马尔罕（帖木儿 · 蒙古军团 · 偃月阵 3+2+4：怯薛军 3 + 草原枪兵 2 + 精锐蒙古突骑 4）
    "tiemuer": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "asaibaijiang": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "wuliangha": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "jalair": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kiyad": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "zhadalan": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "wala": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "oirat_ming": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "an": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "babuer": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "da_yuan": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "chahar": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "zhaowu": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "manghuti": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "khoshut": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yilihanguo_d": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yilihanguo": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "salai": {
        legionName: "蒙古军团",
        formationMode: "crescent",
        slots: [
            { type: "elite_keshik", count: 3 },
            { type: "steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    // 贝雷尼斯·红海东非要塞（达格纳詹 · 东非阿克苏姆双曲弯刀与御驾巨象战阵 · 鱼鳞阵 4+3+2：弯刀勇士 4 + 精锐弯刀勇士 3 + 御驾战象 2）
    "beileinisi": {
        legionName: "托勒密海军团",
        formationMode: "fish_scale",
        slots: [
            { type: "elite_shotel_warrior", count: 3 },
            { type: "pattiyoda_longbowman", count: 4 },
            { type: "dagnajan_elephant", count: 2 },
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
    "talanduo": {
        legionName: "塔兰托军团",
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 4 },
            { type: "tarantine_cavalry", count: 3 },
            { type: "rhodian_slinger", count: 2 },
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
    // 萨非帝国·伊斯法罕/加兹温（阿拔斯大帝 / 艾斯迈尔 · 奇兹尔巴什红头军团 · 鹤翼阵 2+4+3：古拉姆近卫 2 + 奇兹尔巴什红头战士主力 4 + 火枪兵 3）
    // 粟特王国·瓦拉赫沙（德瓦什提奇 · 鹤翼阵 2+4+3：持盾步兵 2 + 粟特甲胄铁骑主力 4 + 古典重装骑射 3）
    // 圣殿骑士团·阿卡（莫莱 · 圣殿骑士团军团 · 鱼鳞阵 4+3+2：圣殿楷模武士 4 + 十字军骑士 3 + 劲弩手 2）
    "shengdian_qishi": {
        legionName: "圣殿骑士军团",
        formationMode: "triangle",
        slots: [
            { type: "halberdier", count: 2 },
            { type: "arbalest", count: 3 },
            { type: "crusader_knight", count: 4 },
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
    "anggelu": {
        legionName: "撒克逊盾墙军团",
        legionType: "solo",
        formationMode: "crescent",
        slots: [
            { type: "legionary", count: 3 },
            { type: "halberdier", count: 2 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    // 法兰克与法兰西·查理曼 / 查理马特 / 查理七世 / 吉尔德雷斯（法兰克军团 · 偃月阵 3+2+4：冠军剑士 3 + 游侠 2 + 精锐掷斧兵 4）
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
    // 扶南与高棉·范蔓 / 刀更孟 战象与爪刀精锐军团（鱼鳞阵 3+4+2：精锐战象前卫 3 + 精锐爪刀勇士主力 4 + 步弓手 2；象拆入战象一排）
    "funan": {
        legionName: "高棉军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "elite_ballista_elephant", count: 2 },
            { type: "spearman", count: 3 },
            { type: "archer", count: 4 },
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
    // 萨拉森、后倭马亚与安达卢西亚·萨拉赫丁 / 穆阿维叶 / 阿卜杜拉 马穆鲁克弯刀重骑与骆驼弓精锐军团（鱼鳞阵 3+4+2：马穆鲁克前卫 3 + 精锐马穆鲁克主力 4 + 骆驼弓骑 2）
    andaluoxiya: {
        legionName: "马穆鲁克军团",
        formationMode: 'fish_scale',
        slots: [
            { type: 'mameluke', count: 3 },
            { type: 'elite_mameluke', count: 4 },
            { type: 'camel_archer', count: 2 },
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
    // 印度与锡克·兰季特·辛格 / 拉其特 / 哈里·辛格 飞轮掷手漫天破阵精锐军团（三角阵 2+3+4：重装长枪前卫 2 + 飞轮掷手 3 + 精锐飞轮掷手主力 4）
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
    // 古埃及、赫梯与美索不达米亚·拉美西斯 / 穆瓦塔利 / 图特摩斯 / 卢伽尔扎克西 / 尼布甲尼撒 / 萨尔贡 / 沙姆希阿达德 / 萨利蒂 双轮战车军团（雁行阵 4+3+2：弓兵 4 + 双轮战车精锐 3 + 持盾步兵 2）
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
    // 撒拉森军团·麦地那/巴格达/麦加/巴士拉（哈立德 / 曼苏尔 / 艾布苏富扬 / 齐亚德 · 鹤翼阵 2+4+3：重装骆驼兵 2 + 精锐马穆鲁克 4 + 重装骑射手 3）
    abasi: {
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
    // 马格里布骆驼弓骑军团·特莱姆森/布佳亚/凯鲁万/非斯/马拉喀什/阿尔及尔/的黎波里（亚格姆拉森 / 哈马德 / 奥克巴 / 伊德里斯 / 塔什芬 / 巴巴罗萨 / 德拉古特 · 三角阵 2+3+4：萨拉森马穆鲁克 2 + 柏柏尔标枪骑兵 3 + 柏柏尔骆驼弓骑主力 4）
    // 休达·直布罗陀（恩里克王子 · 1415征服休达葡萄牙要塞军团 · 鱼鳞阵 4+3+2：重装长枪兵 4 + 重装骑士 3 + 劲弩手 2）
    "zhibuluotuo": {
        legionName: "十字军团",
        legionType: "solo",
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
        legionName: "圣殿骑士军团",
        formationMode: "triangle",
        slots: [
            { type: "halberdier", count: 2 },
            { type: "arbalest", count: 3 },
            { type: "crusader_knight", count: 4 },
        ],
    },
    // 耶路撒冷王国·阿卡（鲍德温四世 · 耶路撒冷王国军团 · 鱼鳞阵 4+3+2：圣殿楷模武士 4 + 十字军骑士 3 + 劲弩手 2）
    "yelusalengwg": {
        legionName: "圣殿骑士军团",
        formationMode: "triangle",
        slots: [
            { type: "halberdier", count: 2 },
            { type: "arbalest", count: 3 },
            { type: "crusader_knight", count: 4 },
        ],
    },
    // 纳巴泰王国·佩特拉（阿雷塔斯 · 纳巴驼骑军团 · 鹤翼阵 2+4+3：火焰骆驼 2 + 骆驼骑兵 4 + 骆驼弓骑 3）
    // 奴儿干都司与极北海岛军团·特林/囊哈儿/普禄/诺托罗/白主/宗谷/莫约罗/白老（康旺/吉里迷/费雅喀/鄂罗克/苦夷/阿伊努 · 三角阵 2+3+4：答剌罕骑兵 2 + 反曲长弓手 3 + 鲜卑掠骑兵 4）
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
    "xideweina": {
        legionName: "波洛公国军团",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_steppe_lancer", count: 2 },
            { type: "elite_boyar", count: 4 },
            { type: "composite_bowman", count: 3 },
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
    "xiaofulijiya": {
        legionName: "希腊雇佣军团",
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 3 },
            { type: "hoplite", count: 4 },
            { type: "gastraphetes", count: 2 },
        ],
    },
    // 瓦卢瓦王朝·香波堡（法兰西）→ 法兰克军团
    "aqimeinide": {
        legionName: "不死军团",
        formationMode: "square",
        slots: [
            { type: "elite_war_elephant", count: 3 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 3 },
        ],
    },
    "zhagewei": {
        legionName: "扎格维军团",
        legionType: "solo",
        formationMode: "fish_scale",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
};
