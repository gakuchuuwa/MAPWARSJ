/**
 * 势力自定义军团方阵数据表 (Faction Legion Compositions)
 * 由独立军团编辑器 (http://localhost:5173/legion-editor.html) 生成与维护。
 *
 * 机制：
 * - key: factionId (如 'qin', 'lagoniya', 'buni', 'luoma_diguo')
 * - 若势力在此表中登记，军团生成与渲染优先使用此配置；
 * - 若未登记，自动回退到 126 大文化区默认方阵 (CULTURE_TIERS_MAP)。
 */

import type { FormationMode, NavalFormationMode } from '../types/CultureFormations';
import type { CompositionSlot } from '../types/LegionComposition';

export interface CustomFactionLegion {
    /** 军团名称（前中后三排组成的这支部队的名字，如「瓦兰吉卫队军团」）。
     *  🔴 与「精锐番号」（ExpeditionLegions 的福建水师/北府兵等）不是一回事，别混。 */
    legionName?: string;
    /** 军团种类（编辑器判型）：region 文化军团 / sub 制定军团。
     *  🔴 [2026-09-06 主人铁律] 只有这两种，era「时代军团」已废除，不许再写。 */
    legionType?: 'region' | 'sub';
    formationMode: FormationMode;
    slots: CompositionSlot[];
    /** 水战/航行时的舰队队形；缺省 = 'auto'（按船数自动，旧行为） */
    navalFormation?: NavalFormationMode;
}

export const FACTION_COMPOSITIONS: Record<string, CustomFactionLegion> = {
    "dian": {
        legionName: "封建时代白蛮军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "elite_chukonu", count: 4 },
            { type: "archer", count: 3 },
        ],
    },
    "shuizhen": {
        legionName: "帝国时代华夏军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 3 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "wu": {
        legionName: "古典时代华夏江南军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordman_shielded", count: 2 },
            { type: "fire_archer", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "shanzhou": {
        legionName: "封建时代隋唐军团",
        formationMode: "echelon",
        slots: [
            { type: "liao_dao", count: 4 },
            { type: "elite_chukonu", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "qin": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "xin": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "ruo": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "baiyang": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "wazhai": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "shangzhou": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "nanyue": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "han_d": {
        legionName: "古典时代华夏中原军团",
        legionType: "sub",
        formationMode: "square",
        slots: [
            { type: "chukonu", count: 3 },
            { type: "elite_chukonu", count: 3 },
            { type: "white_feather_guard", count: 3 },
        ],
    },
    "xianyu": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "shuofang": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "li_lx_d": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "huaiyang": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "yangshao": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "xiyuduhu": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "jiluo_d": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "lulin": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "you": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "jingzhou_gs": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "quli": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "dongsheng": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "liu": {
        legionName: "古典时代秦汉军团",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "huizhou_d": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "shu": {
        legionName: "古典时代华夏巴蜀军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 2 },
        ],
    },
    "chu": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "langzhou": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "jingmen": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "cangsong": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "qingqiang": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "cao_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "sima_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "lu": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "wudu": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "guzhu": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "huang_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "bozhou_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "danyang": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "yuzhou": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "zhong": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "tingzhou_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "liangzhou": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "ranwei_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "chukonu", count: 4 },
            { type: "elite_tiger_cavalry", count: 2 },
        ],
    },
    "maqidun": {
        legionName: "古典时代马其顿军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_phalangite", count: 4 },
            { type: "phalangite", count: 3 },
            { type: "elite_companion_cavalry", count: 2 },
        ],
    },
    "xiqin": {
        legionName: "城堡时代女真军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_iron_pagoda", count: 4 },
            { type: "iron_pagoda", count: 3 },
            { type: "jian_swordman_shielded", count: 2 },
        ],
    },
    "li_s": {
        legionName: "古典时代秦汉军团",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "dianguo": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "zhen": {
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "jian_swordman_unshielded", count: 4 },
            { type: "bowman", count: 3 },
            { type: "iron_pagoda", count: 2 },
        ],
    },
    "ming_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "yizhi": {
        formationMode: "crane_wing",
        slots: [
            { type: "skirmisher", count: 2 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 3 },
        ],
    },
    "mazhaer": {
        legionName: "城堡时代马扎尔军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_magyar_huszar", count: 4 },
            { type: "magyar_huszar", count: 3 },
            { type: "recurve_bowman", count: 2 },
        ],
    },
    "xiongyati": {
        legionName: "城堡时代马扎尔军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_magyar_huszar", count: 4 },
            { type: "magyar_huszar", count: 3 },
            { type: "recurve_bowman", count: 2 },
        ],
    },
    "qiekase": {
        legionName: "帝国时代斯拉夫军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "composite_bowman", count: 3 },
            { type: "hand_cannoneer", count: 2 },
        ],
    },
    "keluodiya": {
        legionName: "帝国时代斯拉夫军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "composite_bowman", count: 3 },
            { type: "hand_cannoneer", count: 2 },
        ],
    },
    "bolan": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_obuch", count: 4 },
            { type: "obuch", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "deniesite": {
        legionName: "帝国时代斯拉夫军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "composite_bowman", count: 3 },
            { type: "hand_cannoneer", count: 2 },
        ],
    },
    "baojialiya": {
        legionName: "封建时代保加利亚军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_konnik", count: 4 },
            { type: "konnik", count: 3 },
            { type: "elite_konnik_foot", count: 2 },
        ],
    },
    "mengtainiya": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "boyar", count: 3 },
            { type: "heavy_pikeman", count: 2 },
        ],
    },
    "moerdaweiya": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "boyar", count: 3 },
            { type: "heavy_pikeman", count: 2 },
        ],
    },
    "walajiyia": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "boyar", count: 3 },
            { type: "heavy_pikeman", count: 2 },
        ],
    },
    "duobuluojia": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "boyar", count: 3 },
            { type: "heavy_pikeman", count: 2 },
        ],
    },
    "kuertaiya": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "boyar", count: 3 },
            { type: "heavy_pikeman", count: 2 },
        ],
    },
    "vidin_tsardom": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "boyar", count: 3 },
            { type: "heavy_pikeman", count: 2 },
        ],
    },
    "shaiyue": {
        legionName: "封建时代斯拉夫军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "composite_bowman", count: 3 },
            { type: "berserk", count: 2 },
        ],
    },
    "molaweiya": {
        legionName: "封建时代斯拉夫军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "composite_bowman", count: 3 },
            { type: "berserk", count: 2 },
        ],
    },
    "damolaweiya": {
        legionName: "封建时代斯拉夫军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "composite_bowman", count: 3 },
            { type: "berserk", count: 2 },
        ],
    },
    "piyasite": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_obuch", count: 4 },
            { type: "obuch", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "zhituo": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "boyar", count: 3 },
            { type: "heavy_pikeman", count: 2 },
        ],
    },
    "luosi": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_boyar", count: 4 },
            { type: "boyar", count: 3 },
            { type: "heavy_pikeman", count: 2 },
        ],
    },
    "qiernigeweifu_gongguo": {
        legionName: "封建时代罗斯军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "boyar", count: 3 },
            { type: "elite_composite_bowman", count: 4 },
            { type: "berserk", count: 2 },
        ],
    },
    "xideweina": {
        legionName: "封建时代罗斯军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "boyar", count: 3 },
            { type: "elite_composite_bowman", count: 4 },
            { type: "berserk", count: 2 },
        ],
    },
    "fangla": {
        legionName: "帝国时代华夏军团",
        formationMode: "echelon",
        slots: [
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 3 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "xiadunhe": {
        legionName: "封建时代罗斯军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "boyar", count: 3 },
            { type: "elite_composite_bowman", count: 4 },
            { type: "berserk", count: 2 },
        ],
    },
    "batawei": {
        legionName: "古典时代日耳曼军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "antiquity_light_cavalry", count: 2 },
            { type: "vanguard", count: 4 },
            { type: "elite_antiquity_skirmisher", count: 3 },
        ],
    },
    "aersasi": {
        legionName: "古典时代日耳曼军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "antiquity_light_cavalry", count: 2 },
            { type: "vanguard", count: 4 },
            { type: "elite_antiquity_skirmisher", count: 3 },
        ],
    },
    "xianlingqiang": {
        legionName: "古典时代羌族军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "antiquity_cavalry_archer", count: 4 },
            { type: "hill_tribesman", count: 2 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "shaodang": {
        legionName: "古典时代羌族军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "antiquity_cavalry_archer", count: 4 },
            { type: "hill_tribesman", count: 2 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "guangwu": {
        legionName: "古典时代羌族军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "antiquity_cavalry_archer", count: 4 },
            { type: "hill_tribesman", count: 2 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "xiutu": {
        legionName: "古典时代羌族军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "antiquity_cavalry_archer", count: 4 },
            { type: "hill_tribesman", count: 2 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "nuogai": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "bashekeer": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "xibo_d": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "oirat_ming": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "dzungar": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "kazakh": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "tuoming": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "tuerhute": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "tushetu": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "tumed": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "tumengken": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "tuva": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "zhasaketu": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "kaerka": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "wuzhumuqin": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "xingan": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "chechen": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "sunite": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "buriat": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "huite": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "nuoyan_d": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "wuli_d": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "wulianghai": {
        legionName: "帝国时代草原军团",
        legionType: "region",
        formationMode: "balance_yoke",
        slots: [
            { type: "elite_keshik", count: 4 },
            { type: "elite_steppe_lancer", count: 2 },
            { type: "mangudai_elite", count: 3 },
        ],
    },
    "xiajiasi": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "juqu_d": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "helian": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "tiele": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xueyantuo": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "shiwei": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "gaoche": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "bulat": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "bayegu": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xierhe": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yuezhi": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "mangshi": {
        legionName: "封建时代草原军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "dingling": {
        legionName: "古典时代草原军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "mangudai", count: 3 },
            { type: "xianbei_raider", count: 3 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "xiongnu": {
        legionName: "古典时代草原军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "mangudai", count: 3 },
            { type: "xianbei_raider", count: 3 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "cheshihou": {
        legionName: "古典时代草原军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "mangudai", count: 3 },
            { type: "xianbei_raider", count: 3 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "xijue": {
        legionName: "古典时代草原军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "mangudai", count: 3 },
            { type: "xianbei_raider", count: 3 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "huyan": {
        legionName: "古典时代草原军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "mangudai", count: 3 },
            { type: "xianbei_raider", count: 3 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "baidi": {
        legionName: "古典时代草原军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "mangudai", count: 3 },
            { type: "xianbei_raider", count: 3 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "heisha_d": {
        legionName: "古典时代草原军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "mangudai", count: 3 },
            { type: "xianbei_raider", count: 3 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "yada": {
        legionName: "封建时代河中军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "sogdian_cataphract", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "elite_kipchak", count: 4 },
        ],
    },
    "jie": {
        legionName: "封建时代河中军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "sogdian_cataphract", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "elite_kipchak", count: 4 },
        ],
    },
    "saman": {
        legionName: "封建时代河中军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "sogdian_cataphract", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "elite_kipchak", count: 4 },
        ],
    },
    "mamon": {
        legionName: "封建时代河中军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "sogdian_cataphract", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "elite_kipchak", count: 4 },
        ],
    },
    "keerkezi": {
        legionName: "封建时代河中军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "sogdian_cataphract", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "elite_kipchak", count: 4 },
        ],
    },
    "qiepantuo": {
        legionName: "封建时代河中军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "sogdian_cataphract", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "elite_kipchak", count: 4 },
        ],
    },
    "maer_d": {
        legionName: "封建时代河中军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "sogdian_cataphract", count: 2 },
            { type: "steppe_lancer", count: 3 },
            { type: "elite_kipchak", count: 4 },
        ],
    },
    "jiatailuoniya": {
        legionName: "封建时代拉丁军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "legionary", count: 4 },
            { type: "greek_noble_cavalry", count: 3 },
            { type: "elite_antiquity_skirmisher", count: 2 },
        ],
    },
    "fuguo": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "yangtong": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "tufa_d": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "dangxiang": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "song2": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "tubo": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "qifu_d": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "tuyu_d": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "xiaobolu": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "xihai_d": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "heyuan_d": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "dafeichuan": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "yeli": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "guge": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "supi": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "spurgyal": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "humi": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "khyungpo": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "bailang": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "keliya": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "gongbu": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "xiangxiong": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "gaoliang": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "nandou": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "gar": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "duomi": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "nvguo": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "jiashi": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "xiazhou": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "hei_kuang_heavy", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "gongtang": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "khoshut": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "gaxa": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "jinchuan_g": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "gurkha": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xiadun": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "ladakh": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "tsangpa": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "monpa": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "lopi": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "karmapa": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "golog": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "nanjie": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "gandenpozhang": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "gar_kham": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kongsa": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "daca": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "hor": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "jiantang": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "galangdiba": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "ali": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "dulan": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kangba": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xining": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kalun": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "keshik", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "qian_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "suzhou_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "tujia_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "zu_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "fang_guozhen": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "longwu": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "lujian": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "mao_wenlong": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "ming_zheng": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "jingjiang": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "linhu": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "linyu": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "heng": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "jinzhou": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "qi_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "sunqin": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "guizhou": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "dayu": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "liuzhou": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "luming": {
        legionName: "帝国时代大明军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "weiming": {
        legionName: "城堡时代党项军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "hill_tribesman", count: 2 },
            { type: "chukonu", count: 4 },
            { type: "elite_keshik", count: 3 },
        ],
    },
    "nifuhe": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "bailian": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "manzhou": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "manzhou_d": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "aisin_d": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "haixi_nvzhen": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "yeren_nvzhen": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "hezhe": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "agui": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "gumie": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "nanai": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "feiyaka": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "dawoer": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "suolun": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "jilin": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "keerqin": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "eluoke": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "kuye": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "ewenki": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "dongping": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "maomingan": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "aola": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "yehe": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "wula": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "qinghai": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "wenling": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "elunchunzu": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "weiyuan": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "kipchak", count: 3 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "jiujiang": {
        legionName: "古典时代华夏军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 2 },
        ],
    },
    "wuwu_d": {
        legionName: "古典时代华夏军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 2 },
        ],
    },
    "shanyue": {
        legionName: "古典时代秦汉军团",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "chu_d": {
        legionName: "古典时代华夏军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 2 },
        ],
    },
    "minyue": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "ouyue": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "yue_d": {
        legionName: "古典时代华夏军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 2 },
        ],
    },
    "juandu": {
        legionName: "封建时代隋唐军团",
        formationMode: "echelon",
        slots: [
            { type: "liao_dao", count: 4 },
            { type: "elite_chukonu", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "shang": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "quanrong": {
        legionName: "古典时代草原军团",
        legionType: "region",
        formationMode: "square",
        slots: [
            { type: "mangudai", count: 3 },
            { type: "xianbei_raider", count: 3 },
            { type: "elite_kipchak", count: 3 },
        ],
    },
    "yanchuan_d": {
        legionName: "城堡时代岳家军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "liao_dao", count: 4 },
            { type: "elite_chukonu", count: 3 },
            { type: "elite_keshik", count: 2 },
        ],
    },
    "qi": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "kong_d": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "yin": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "zhou": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "shen": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "zi": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "jin": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "yangshe": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "yue": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "mi_chu": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "ruochu": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "yong": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "zhao": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "wuzhou": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "lingqiu": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "liguo": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "wei": {
        legionName: "古典时代华夏北方军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_tiger_cavalry", count: 4 },
            { type: "tiger_rider", count: 3 },
            { type: "elite_chukonu", count: 2 },
        ],
    },
    "liangshidu": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "yan": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "han": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "jiaodong": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "dongxian": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "chunshen": {
        legionName: "古典时代先秦军团",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "muong": {
        legionName: "城堡时代京族军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "white_feather_guard", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "xian_d": {
        legionName: "封建时代白蛮军团",
        legionType: "sub",
        formationMode: "crane_wing",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "elite_chukonu", count: 4 },
            { type: "archer", count: 3 },
        ],
    },
    "nanzhao": {
        legionName: "封建时代白蛮军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "elite_chukonu", count: 4 },
            { type: "archer", count: 3 },
        ],
    },
    "dali": {
        legionName: "封建时代白蛮军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "elite_chukonu", count: 4 },
            { type: "archer", count: 3 },
        ],
    },
    "zangke": {
        legionName: "封建时代白蛮军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "elite_chukonu", count: 4 },
            { type: "archer", count: 3 },
        ],
    },
    "wuman": {
        legionName: "封建时代白蛮军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "battle_elephant", count: 2 },
            { type: "elite_chukonu", count: 4 },
            { type: "archer", count: 3 },
        ],
    },
    "luodesi": {
        legionName: "城堡时代十字军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "teutonic_knight", count: 2 },
            { type: "paragon", count: 3 },
            { type: "crusader_knight", count: 4 },
        ],
    },
    "yelusalengwg": {
        legionName: "城堡时代十字军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "teutonic_knight", count: 2 },
            { type: "paragon", count: 3 },
            { type: "crusader_knight", count: 4 },
        ],
    },
    "shengdian_qishi": {
        legionName: "城堡时代十字军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "teutonic_knight", count: 2 },
            { type: "paragon", count: 3 },
            { type: "crusader_knight", count: 4 },
        ],
    },
    "saipulusi": {
        legionName: "城堡时代十字军团",
        legionType: "region",
        formationMode: "triangle",
        slots: [
            { type: "teutonic_knight", count: 2 },
            { type: "paragon", count: 3 },
            { type: "crusader_knight", count: 4 },
        ],
    },
    "aosiruowen": {
        legionName: "城堡时代十字军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "teutonic_knight", count: 2 },
            { type: "paragon", count: 3 },
            { type: "crusader_knight", count: 4 },
        ],
    },
    "antiaokegongguo": {
        legionName: "城堡时代十字军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "teutonic_knight", count: 2 },
            { type: "paragon", count: 3 },
            { type: "crusader_knight", count: 4 },
        ],
    },
    "baojian_qishi": {
        legionName: "城堡时代条顿军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_teutonic_knight", count: 4 },
            { type: "teutonic_knight", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    "tiaodun_qishi": {
        legionName: "城堡时代条顿军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_teutonic_knight", count: 4 },
            { type: "teutonic_knight", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    "boumeilaniyan": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_obuch", count: 4 },
            { type: "obuch", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "dabolan": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_obuch", count: 4 },
            { type: "obuch", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "hongluseniya": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_obuch", count: 4 },
            { type: "obuch", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "lesser_poland": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_obuch", count: 4 },
            { type: "obuch", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "bolisiya": {
        legionName: "城堡时代立陶宛军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_leitis", count: 4 },
            { type: "leitis", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "litaowan": {
        legionName: "城堡时代立陶宛军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_leitis", count: 4 },
            { type: "leitis", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "nieman": {
        legionName: "城堡时代立陶宛军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_leitis", count: 4 },
            { type: "leitis", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "weijiebusike_gongguo": {
        legionName: "城堡时代立陶宛军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_leitis", count: 4 },
            { type: "leitis", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "telakaigongguo": {
        legionName: "城堡时代立陶宛军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_leitis", count: 4 },
            { type: "leitis", count: 3 },
            { type: "winged_hussar", count: 2 },
        ],
    },
    "yashu": {
        legionName: "古典时代亚述军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "thracian_peltast", count: 2 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
            { type: "war_chariot", count: 3, scale: 0.66 },
        ],
    },
    "guyashu": {
        legionName: "古典时代亚述军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "thracian_peltast", count: 2 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
            { type: "war_chariot", count: 3, scale: 0.66 },
        ],
    },
    "adiyabeina": {
        legionName: "古典时代亚述军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "thracian_peltast", count: 2 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
            { type: "war_chariot", count: 3, scale: 0.66 },
        ],
    },
    "tuoba": {
        legionName: "封建时代隋唐军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "liao_dao", count: 4 },
            { type: "elite_chukonu", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "bing": {
        legionName: "封建时代隋唐军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "liao_dao", count: 4 },
            { type: "elite_chukonu", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "zhongshan": {
        legionName: "封建时代隋唐军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "liao_dao", count: 4 },
            { type: "elite_chukonu", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "xila": {
        legionName: "古典时代雅典军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_strategos", count: 4 },
            { type: "strategos", count: 3 },
            { type: "elite_greek_cavalry", count: 2 },
        ],
    },
    "lagoniya": {
        legionName: "古典时代斯巴达军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_hippeus", count: 4 },
            { type: "hippeus", count: 3 },
            { type: "elite_greek_cavalry", count: 2 },
        ],
    },
    "boootiya": {
        legionName: "古典时代希伦军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "hippeus", count: 4 },
            { type: "sacred_band", count: 3 },
            { type: "strategos", count: 2 },
        ],
    },
    "yamaxun": {
        legionName: "古典时代亚马逊军团",
        legionType: "sub",
        formationMode: "crane_wing",
        slots: [
            { type: "amazon_archer", count: 2 },
            { type: "elite_scythian_horse_archer", count: 4 },
            { type: "amazon_warrior", count: 3 },
        ],
    },
    "talanduo": {
        legionName: "古典时代大希腊军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "ekdromos", count: 4 },
            { type: "greek_noble_cavalry", count: 3 },
            { type: "tarantine_cavalry", count: 2 },
        ],
    },
    "baizanting": {
        legionName: "封建时代拜占庭军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_cataphract", count: 4 },
            { type: "cataphract", count: 3 },
            { type: "heavy_pikeman", count: 2 },
        ],
    },
    "ayoubu": {
        legionName: "城堡时代萨拉森军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "eastern_swordsman", count: 2 },
            { type: "mameluke", count: 3 },
            { type: "elite_mameluke", count: 4 },
        ],
    },
    "mamuluke": {
        legionName: "城堡时代马穆鲁克军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_camel_archer", count: 2 },
            { type: "mameluke", count: 4 },
            { type: "camel_rider", count: 3 },
        ],
    },
    "guanche": {
        legionName: "城堡时代非洲军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "gbeto", count: 3 },
            { type: "camel_heavy", count: 4 },
            { type: "genitour", count: 2 },
        ],
    },
    "tigelei": {
        legionName: "城堡时代非洲军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "gbeto", count: 3 },
            { type: "camel_heavy", count: 4 },
            { type: "genitour", count: 2 },
        ],
    },
    "zhagewei": {
        legionName: "城堡时代非洲军团",
        legionType: "region",
        formationMode: "fish_scale",
        slots: [
            { type: "gbeto", count: 3 },
            { type: "camel_heavy", count: 4 },
            { type: "genitour", count: 2 },
        ],
    },
    "inca": {
        legionName: "城堡时代印加军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_champi_warrior", count: 4 },
            { type: "champi_warrior", count: 3 },
            { type: "slinger", count: 2 },
        ],
    },
    "tang": {
        legionName: "封建时代隋唐军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "liao_dao", count: 4 },
            { type: "elite_chukonu", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "jinzhang": {
        legionName: "城堡时代库曼军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_steppe_lancer", count: 2 },
            { type: "kipchak", count: 3 },
            { type: "elite_kipchak", count: 4 },
        ],
    },
    "baojiaer": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kelimiya": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "fuerjia": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kelie": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "wala": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "wuliangha": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "dongshengwei": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "menggu_d": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kumo": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "ogodei": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kereyid": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "naiman": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "tatar": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "merkit": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "ongut": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "dada_ming": {
        legionName: "城堡时代鞑靼军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "chahar": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "yuan_d": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "da_yuan": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "kiyad": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "borjigin": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "jalair": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "hongirad": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "choros": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "zhadalan": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "zhuerqi": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "houliao": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "xianhai": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "mengwu": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "zubu": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "wugu_d": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "chenli_d": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "manghuti": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "salai": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "aertai": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "xuan": {
        legionName: "帝国时代大明军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "tuolemi": {
        legionName: "古典时代马其顿军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_phalangite", count: 4 },
            { type: "phalangite", count: 3 },
            { type: "elite_companion_cavalry", count: 2 },
        ],
    },
    "siam": {
        legionName: "帝国时代东南亚军团",
        legionType: "sub",
        formationMode: "crane_wing",
        slots: [
            { type: "elite_armored_elephant", count: 2 },
            { type: "champion", count: 4 },
            { type: "hand_cannoneer", count: 3 },
        ],
    },
    "xushouhui": {
        legionName: "帝国时代大明军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "fire_lancer", count: 4 },
            { type: "elite_fire_archer", count: 3 },
            { type: "mangudai_elite", count: 2 },
        ],
    },
    "sunwu_d": {
        legionName: "古典时代华夏军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_white_feather_guard", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "elite_chukonu", count: 2 },
        ],
    },
    "kongque": {
        legionName: "古典时代印度军团",
        legionType: "sub",
        formationMode: "crane_wing",
        slots: [
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "ratha_melee", count: 4 },
            { type: "sickle_warrior", count: 3 },
        ],
    },
    "tiemuer": {
        legionName: "城堡时代鞑靼军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_keshik", count: 2 },
            { type: "mangudai", count: 3 },
            { type: "mangudai_elite", count: 4 },
        ],
    },
    "varendra": {
        legionName: "城堡时代孟加拉军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "ghulam", count: 2 },
            { type: "chakram_thrower", count: 3 },
            { type: "elite_ratha_ranged", count: 4 },
        ],
    },
    "mojietuo": {
        legionName: "古典时代摩揭陀军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "sickle_warrior", count: 2 },
            { type: "antiquity_skirmisher", count: 3 },
            { type: "ratha_ranged", count: 4 },
        ],
    },
    "jialatai": {
        legionName: "古典时代加拉太军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "antiquity_skirmisher", count: 2 },
            { type: "antiquity_spearman", count: 3 },
            { type: "war_chariot", count: 4, scale: 0.66 },
        ],
    },
    "osman": {
        legionName: "帝国时代奥斯曼军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "hussar", count: 2 },
            { type: "janissary", count: 3 },
            { type: "elite_janissary", count: 4 },
        ],
    },
    "aosimanbeiyiguo": {
        legionName: "帝国时代奥斯曼军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "hussar", count: 2 },
            { type: "janissary", count: 3 },
            { type: "elite_janissary", count: 4 },
        ],
    },
    "lumiliya": {
        legionName: "帝国时代奥斯曼军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "hussar", count: 2 },
            { type: "janissary", count: 3 },
            { type: "elite_janissary", count: 4 },
        ],
    },
    "saierdika": {
        legionName: "封建时代保加利亚军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_konnik", count: 4 },
            { type: "konnik", count: 3 },
            { type: "elite_konnik_foot", count: 2 },
        ],
    },
    "duonaobaojia": {
        legionName: "封建时代保加利亚军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_konnik", count: 4 },
            { type: "konnik", count: 3 },
            { type: "elite_konnik_foot", count: 2 },
        ],
    },
    "jialiboli": {
        legionName: "封建时代保加利亚军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_konnik", count: 4 },
            { type: "konnik", count: 3 },
            { type: "elite_konnik_foot", count: 2 },
        ],
    },
    "kesa": {
        legionName: "封建时代可萨军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "konnik_foot", count: 2 },
            { type: "elite_konnik", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "xiemian": {
        legionName: "封建时代可萨军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "konnik_foot", count: 2 },
            { type: "elite_konnik", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "yidier": {
        legionName: "封建时代可萨军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "konnik_foot", count: 2 },
            { type: "elite_konnik", count: 4 },
            { type: "cav_archer", count: 3 },
        ],
    },
    "aqimeinide": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_immortal", count: 4 },
            { type: "immortal", count: 3 },
            { type: "elite_immortal_ranged", count: 2 },
        ],
    },
    "xiaofulijiya": {
        legionName: "古典时代波斯联合军团",
        legionType: "sub",
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 3 },
            { type: "lancer", count: 4 },
            { type: "antiquity_skirmisher", count: 2 },
        ],
    },
    "kanan": {
        legionName: "古典时代迦南军团",
        legionType: "sub",
        formationMode: "crescent",
        slots: [
            { type: "mercenary_hoplite", count: 3 },
            { type: "sparabara", count: 2 },
            { type: "antiquity_skirmisher", count: 4 },
        ],
    },
    "tawantinsuyu": {
        legionName: "城堡时代克丘亚军团",
        legionType: "region",
        formationMode: "echelon",
        slots: [
            { type: "champi_warrior", count: 4 },
            { type: "elite_kamayuk", count: 3 },
            { type: "champi_scout", count: 2 },
        ],
    },
    "feilisidin": {
        legionName: "古典时代腓利斯丁军团",
        legionType: "region",
        formationMode: "crescent",
        slots: [
            { type: "sparabara", count: 3 },
            { type: "lancer", count: 2 },
            { type: "antiquity_skirmisher", count: 4 },
        ],
    },
    "xianbei": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "iron_pagoda", count: 2 },
            { type: "xianbei_raider", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "wuhuan": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "iron_pagoda", count: 2 },
            { type: "xianbei_raider", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "fuyu": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "iron_pagoda", count: 2 },
            { type: "xianbei_raider", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "donghu": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "iron_pagoda", count: 2 },
            { type: "xianbei_raider", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "murong": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "iron_pagoda", count: 2 },
            { type: "xianbei_raider", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "yingzhou_ying_d": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "iron_pagoda", count: 2 },
            { type: "xianbei_raider", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "yilou": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "iron_pagoda", count: 2 },
            { type: "xianbei_raider", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "xiongding": {
        legionName: "古典时代鲜卑军团",
        legionType: "sub",
        formationMode: "crane_wing",
        slots: [
            { type: "iron_pagoda", count: 2 },
            { type: "xianbei_raider", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "dingzhou": {
        legionName: "古典时代鲜卑军团",
        legionType: "sub",
        formationMode: "crane_wing",
        slots: [
            { type: "iron_pagoda", count: 2 },
            { type: "xianbei_raider", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "qidan": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "liao_d": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "dongdan": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "yel": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "kumoxi": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "sumo": {
        legionName: "古典时代印度军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "ratha_melee", count: 4 },
            { type: "sickle_warrior", count: 3 },
        ],
    },
    "jiashi_d": {
        legionName: "古典时代印度军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
            { type: "ratha_melee", count: 4 },
            { type: "sickle_warrior", count: 3 },
        ],
    },
    "funan": {
        legionName: "古典时代东南亚军团",
        legionType: "region",
        formationMode: "crane_wing",
        slots: [
            { type: "sannahya", count: 2 },
            { type: "vanguard", count: 4 },
            { type: "antiquity_skirmisher", count: 3 },
        ],
    },
    "xichu": {
        legionName: "古典时代秦汉军团",
        legionType: "sub",
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_chukonu", count: 4 },
            { type: "tiger_rider", count: 2 },
        ],
    },
    "shazhou": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_liao_dao", count: 4 },
            { type: "liao_dao", count: 3 },
            { type: "hei_kuang_heavy", count: 2 },
        ],
    },
    "aztec": {
        legionName: "城堡时代阿兹特克军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_jaguar_warrior", count: 4 },
            { type: "jaguar_warrior", count: 3 },
            { type: "xolotl_warrior", count: 2 },
        ],
    },
    "bogendi": {
        legionName: "城堡时代勃艮第军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_coustillier", count: 4 },
            { type: "coustillier", count: 3 },
            { type: "flemish_pikeman", count: 2 },
        ],
    },
    "bogendigongguo": {
        legionName: "城堡时代勃艮第军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_coustillier", count: 4 },
            { type: "coustillier", count: 3 },
            { type: "flemish_pikeman", count: 2 },
        ],
    },
    "bogengnidielan": {
        legionName: "城堡时代勃艮第军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_coustillier", count: 4 },
            { type: "coustillier", count: 3 },
            { type: "flemish_pikeman", count: 2 },
        ],
    },
    "aquidan": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "paladin", count: 2 },
            { type: "longbowman", count: 3 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    "yinggelan": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "paladin", count: 2 },
            { type: "longbowman", count: 3 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    "tuomengde": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "paladin", count: 2 },
            { type: "longbowman", count: 3 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    "jinquehua": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "paladin", count: 2 },
            { type: "longbowman", count: 3 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    "geluositeboguo": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "paladin", count: 2 },
            { type: "longbowman", count: 3 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    "gewennesi": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "paladin", count: 2 },
            { type: "longbowman", count: 3 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    "weiershigongguo": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "paladin", count: 2 },
            { type: "longbowman", count: 3 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    "wuzhou_d": {
        legionName: "古典时代华夏中原军团",
        legionType: "sub",
        formationMode: "square",
        slots: [
            { type: "chukonu", count: 3 },
            { type: "elite_chukonu", count: 3 },
            { type: "white_feather_guard", count: 3 },
        ],
    },
    "gaer": {
        legionName: "古典时代凯尔特军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_woad_raider", count: 4 },
            { type: "woad_raider", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
        ],
    },
    "kaernute": {
        legionName: "古典时代凯尔特军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_woad_raider", count: 4 },
            { type: "woad_raider", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 2 },
        ],
    },
    "boluo": {
        legionName: "古典时代孟加拉军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_ratha_melee", count: 4 },
            { type: "ratha_melee", count: 3 },
            { type: "elite_ratha_ranged", count: 2 },
        ],
    },
    "luoma_diguo": {
        legionName: "古典时代罗马军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "legionary", count: 4 },
            { type: "centurion", count: 3 },
            { type: "elite_centurion", count: 2 },
        ],
    },
    "seleisi": {
        legionName: "古典时代色雷斯军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_rhomphaia_warrior", count: 4 },
            { type: "rhomphaia_warrior", count: 3 },
            { type: "elite_peltast", count: 2 },
        ],
    },
    "pangzha": {
        legionName: "古典时代普鲁军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_sannahya", count: 2 },
            { type: "pattiyoda_longbowman", count: 3 },
            { type: "elite_pattiyoda_longbowman", count: 4 },
        ],
    },
    "gaolu": {
        legionName: "封建时代法兰克军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "frankish_paladin", count: 2 },
            { type: "throwing_axeman", count: 3 },
            { type: "elite_throwing_axeman", count: 4 },
        ],
    },
    "falanji": {
        legionName: "封建时代法兰克军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "frankish_paladin", count: 2 },
            { type: "throwing_axeman", count: 3 },
            { type: "elite_throwing_axeman", count: 4 },
        ],
    },
    "xigete": {
        legionName: "封建时代哥特军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_huskarl", count: 4 },
            { type: "huskarl", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "donggete": {
        legionName: "封建时代哥特军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_huskarl", count: 4 },
            { type: "huskarl", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "sashan": {
        legionName: "封建时代波斯军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_war_elephant", count: 4 },
            { type: "war_elephant", count: 3 },
            { type: "savar", count: 2 },
        ],
    },
    "nuosi": {
        legionName: "封建时代维京军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_berserk", count: 4 },
            { type: "berserk", count: 3 },
            { type: "jarl", count: 2 },
        ],
    },
    "danmai": {
        legionName: "封建时代维京军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_berserk", count: 4 },
            { type: "berserk", count: 3 },
            { type: "jarl", count: 2 },
        ],
    },
    "nuowei": {
        legionName: "封建时代维京军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_berserk", count: 4 },
            { type: "berserk", count: 3 },
            { type: "jarl", count: 2 },
        ],
    },
    "xiongren": {
        legionName: "封建时代匈人军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_tarkan", count: 4 },
            { type: "tarkan", count: 3 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "ethiopia": {
        legionName: "封建时代埃塞俄比亚军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_shotel_warrior", count: 4 },
            { type: "shotel_warrior", count: 3 },
            { type: "elite_camel_archer", count: 2 },
        ],
    },
    "yidelisi": {
        legionName: "封建时代柏柏尔军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "camel_raider", count: 2 },
            { type: "camel_archer", count: 3 },
            { type: "elite_camel_archer", count: 4 },
        ],
    },
    "mulabite": {
        legionName: "封建时代柏柏尔军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "camel_raider", count: 2 },
            { type: "camel_archer", count: 3 },
            { type: "elite_camel_archer", count: 4 },
        ],
    },
    "chenla": {
        legionName: "封建时代高棉军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "ballista_elephant", count: 3 },
            { type: "elite_ballista_elephant", count: 4 },
        ],
    },
    "gurjara": {
        legionName: "封建时代瞿折罗军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "camel_scout", count: 2 },
            { type: "shrivamsha_rider", count: 3 },
            { type: "elite_shrivamsha_rider", count: 4 },
        ],
    },
    "wulaertu": {
        legionName: "封建时代亚美尼亚军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "warrior_priest", count: 2 },
            { type: "composite_bowman", count: 3 },
            { type: "elite_composite_bowman", count: 4 },
        ],
    },
    "anggelu": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "paladin", count: 2 },
            { type: "longbowman", count: 3 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    "ashikaga": {
        legionName: "城堡时代日本军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "samurai_elite", count: 4 },
            { type: "samurai", count: 3 },
            { type: "ninja", count: 2 },
        ],
    },
    "yamato": {
        legionName: "城堡时代日本军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "samurai_elite", count: 4 },
            { type: "samurai", count: 3 },
            { type: "ninja", count: 2 },
        ],
    },
    "womaya": {
        legionName: "城堡时代萨拉森军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "eastern_swordsman", count: 2 },
            { type: "mameluke", count: 3 },
            { type: "elite_mameluke", count: 4 },
        ],
    },
    "alabo": {
        legionName: "城堡时代萨拉森军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "eastern_swordsman", count: 2 },
            { type: "mameluke", count: 3 },
            { type: "elite_mameluke", count: 4 },
        ],
    },
    "maya": {
        legionName: "城堡时代玛雅军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_eagle_warrior", count: 2 },
            { type: "plumed_archer", count: 3 },
            { type: "elite_plumed_archer", count: 4 },
        ],
    },
    "goryeo": {
        legionName: "城堡时代高丽军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordman_shielded", count: 2 },
            { type: "war_wagon", count: 3 },
            { type: "elite_war_wagon", count: 4 },
        ],
    },
    "joseon": {
        legionName: "城堡时代高丽军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "jian_swordman_shielded", count: 2 },
            { type: "war_wagon", count: 3 },
            { type: "elite_war_wagon", count: 4 },
        ],
    },
    "yadelaiya": {
        legionName: "城堡时代意大利军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "condottiero", count: 2 },
            { type: "genoese_crossbowman", count: 3 },
            { type: "elite_genoese_crossbowman", count: 4 },
        ],
    },
    "lunbadi": {
        legionName: "城堡时代意大利军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "condottiero", count: 2 },
            { type: "genoese_crossbowman", count: 3 },
            { type: "elite_genoese_crossbowman", count: 4 },
        ],
    },
    "tuosikana": {
        legionName: "城堡时代意大利军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "condottiero", count: 2 },
            { type: "genoese_crossbowman", count: 3 },
            { type: "elite_genoese_crossbowman", count: 4 },
        ],
    },
    "bohepingyuan": {
        legionName: "城堡时代意大利军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "condottiero", count: 2 },
            { type: "genoese_crossbowman", count: 3 },
            { type: "elite_genoese_crossbowman", count: 4 },
        ],
    },
    "deli": {
        legionName: "城堡时代印度斯坦军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_ghulam", count: 4 },
            { type: "ghulam", count: 3 },
            { type: "imperial_camel_rider", count: 2 },
        ],
    },
    "mowoer": {
        legionName: "城堡时代印度斯坦军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_ghulam", count: 4 },
            { type: "ghulam", count: 3 },
            { type: "imperial_camel_rider", count: 2 },
        ],
    },
    "manding": {
        legionName: "城堡时代马里军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "cavalier", count: 2 },
            { type: "gbeto", count: 3 },
            { type: "elite_gbeto", count: 4 },
        ],
    },
    "jienei": {
        legionName: "城堡时代马里军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "cavalier", count: 2 },
            { type: "gbeto", count: 3 },
            { type: "elite_gbeto", count: 4 },
        ],
    },
    "malacca": {
        legionName: "城堡时代马来军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "karambit_warrior_elite", count: 4 },
            { type: "karambit_warrior", count: 3 },
            { type: "elite_battle_elephant", count: 2 },
        ],
    },
    "malai": {
        legionName: "城堡时代马来军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "karambit_warrior_elite", count: 4 },
            { type: "karambit_warrior", count: 3 },
            { type: "elite_battle_elephant", count: 2 },
        ],
    },
    "sanfoqi": {
        legionName: "城堡时代马来军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "karambit_warrior_elite", count: 4 },
            { type: "karambit_warrior", count: 3 },
            { type: "elite_battle_elephant", count: 2 },
        ],
    },
    "pagan": {
        legionName: "城堡时代缅甸军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "arambai", count: 3 },
            { type: "elite_arambai", count: 4 },
        ],
    },
    "miandian": {
        legionName: "城堡时代缅甸军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "arambai", count: 3 },
            { type: "elite_arambai", count: 4 },
        ],
    },
    "dayue": {
        legionName: "城堡时代越南军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "rattan_archer", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "nguyen_guangnan": {
        legionName: "城堡时代越南军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_battle_elephant", count: 2 },
            { type: "rattan_archer", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "qincha": {
        legionName: "城堡时代库曼军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_steppe_lancer", count: 2 },
            { type: "kipchak", count: 3 },
            { type: "elite_kipchak", count: 4 },
        ],
    },
    "xixiliwangguo": {
        legionName: "城堡时代西西里军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_serjeant", count: 4 },
            { type: "serjeant", count: 3 },
            { type: "crusader_knight", count: 2 },
        ],
    },
    "boximiya": {
        legionName: "城堡时代波希米亚军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "hussite_wagon", count: 3 },
            { type: "elite_hussite_wagon", count: 4 },
        ],
    },
    "zhuluo": {
        legionName: "城堡时代达罗毗荼军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_elephant_archer", count: 2 },
        ],
    },
    "pandiya": {
        legionName: "城堡时代达罗毗荼军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "urumi_swordsman", count: 3 },
            { type: "elite_elephant_archer", count: 2 },
        ],
    },
    "gelujiya": {
        legionName: "城堡时代格鲁吉亚军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_monaspa", count: 4 },
            { type: "monaspa", count: 3 },
            { type: "elite_composite_bowman", count: 2 },
        ],
    },
    "dajin": {
        legionName: "城堡时代女真军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_iron_pagoda", count: 4 },
            { type: "iron_pagoda", count: 3 },
            { type: "jian_swordman_shielded", count: 2 },
        ],
    },
    "jurchen": {
        legionName: "城堡时代女真军团",
        legionType: "sub",
        formationMode: "echelon",
        slots: [
            { type: "elite_iron_pagoda", count: 4 },
            { type: "iron_pagoda", count: 3 },
            { type: "jian_swordman_shielded", count: 2 },
        ],
    },
    "muisca": {
        legionName: "城堡时代穆伊斯卡军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_temple_guard", count: 2 },
            { type: "guecha_warrior", count: 3 },
            { type: "elite_guecha_warrior", count: 4 },
        ],
    },
    "tupi": {
        legionName: "城堡时代图皮军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_ibirapema_warrior", count: 2 },
            { type: "blackwood_archer", count: 3 },
            { type: "elite_blackwood_archer", count: 4 },
        ],
    },
    "kasidiliya": {
        legionName: "帝国时代西班牙军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "conquistador", count: 3 },
            { type: "elite_conquistador", count: 4 },
        ],
    },
    "xibanya": {
        legionName: "帝国时代西班牙军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "conquistador", count: 3 },
            { type: "elite_conquistador", count: 4 },
        ],
    },
    "alagong": {
        legionName: "帝国时代西班牙军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "conquistador", count: 3 },
            { type: "elite_conquistador", count: 4 },
        ],
    },
    "putaoya": {
        legionName: "帝国时代葡萄牙军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "cavalier", count: 2 },
            { type: "organ_gun", count: 3 },
            { type: "elite_organ_gun", count: 4 },
        ],
    },
    "mapuche": {
        legionName: "帝国时代马普切军团",
        legionType: "sub",
        formationMode: "triangle",
        slots: [
            { type: "elite_kona", count: 2 },
            { type: "bolas_rider", count: 3 },
            { type: "elite_bolas_rider", count: 4 },
        ],
    },
};
