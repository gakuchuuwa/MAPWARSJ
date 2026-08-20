/**
 * 势力自定义军团方阵数据表 (Faction Legion Compositions)
 * 由独立军团编辑器 (http://localhost:5173/legion-editor.html) 生成与维护。
 */

import type { FormationMode } from '../types/CultureFormations';
import type { CompositionSlot } from '../types/LegionComposition';

export interface CustomFactionLegion {
    formationMode: FormationMode;
    slots: CompositionSlot[];
}

export const FACTION_COMPOSITIONS: Record<string, CustomFactionLegion> = {
    "qin": {
        formationMode: "echelon",
        slots: [
            { type: "kamayuk", count: 4 },
            { type: "war_chariot_ranged", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "xin": {
        formationMode: "echelon",
        slots: [
            { type: "kamayuk", count: 4 },
            { type: "war_chariot_ranged", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "wazhai": {
        formationMode: "echelon",
        slots: [
            { type: "kamayuk", count: 4 },
            { type: "war_chariot_ranged", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "nanyue": {
        formationMode: "echelon",
        slots: [
            { type: "kamayuk", count: 4 },
            { type: "war_chariot_ranged", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "han": {
        formationMode: "echelon",
        slots: [
            { type: "chukonu", count: 4 },
            { type: "heavy_pikeman", count: 3 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "jin": {
        formationMode: "echelon",
        slots: [
            { type: "kamayuk", count: 4 },
            { type: "war_chariot_ranged", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "baiyang": {
        formationMode: "fish_scale",
        slots: [
            { type: "tiger_rider", count: 4 },
            { type: "war_chariot_ranged", count: 3 },
            { type: "antiquity_cavalry_archer", count: 2 },
        ],
    },
    "suzhou": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "shuofang": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "xianyu": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "li_lx_d": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "lingqiu": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "hejian": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "linhu": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "jiyuan": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "jiluo_d": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "pulei": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "you": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "dongsheng": {
        formationMode: "triangle",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "antiquity_cavalry_archer", count: 3 },
            { type: "antiquity_heavy_cavalry_archer", count: 4 },
        ],
    },
    "han_d": {
        formationMode: "crane_wing",
        slots: [
            { type: "jian_swordsman", count: 2 },
            { type: "tiger_rider", count: 4 },
            { type: "chukonu", count: 3 },
        ],
    },
    "cao_d": {
        formationMode: "crane_wing",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "elite_tiger_cavalry", count: 4 },
            { type: "chukonu", count: 3 },
        ],
    },
    "lu": {
        formationMode: "crane_wing",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "elite_tiger_cavalry", count: 4 },
            { type: "chukonu", count: 3 },
        ],
    },
    "wudu": {
        formationMode: "crane_wing",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "elite_tiger_cavalry", count: 4 },
            { type: "chukonu", count: 3 },
        ],
    },
    "sima_d": {
        formationMode: "crane_wing",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "elite_tiger_cavalry", count: 4 },
            { type: "chukonu", count: 3 },
        ],
    },
    "bozhou_d": {
        formationMode: "crane_wing",
        slots: [
            { type: "tiger_rider", count: 2 },
            { type: "elite_tiger_cavalry", count: 4 },
            { type: "chukonu", count: 3 },
        ],
    },
    "zhengzhou": {
        formationMode: "square",
        slots: [
            { type: "elite_tiger_cavalry", count: 3 },
            { type: "elite_tiger_cavalry", count: 3 },
            { type: "elite_tiger_cavalry", count: 3 },
        ],
    },
    "yin": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "shang": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "zhou": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "guzhu": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "wu": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "qi": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "mi_chu": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "yue": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "wei": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "zhao": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "yan": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "dongxian": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "ruo": {
        formationMode: "echelon",
        slots: [
            { type: "kamayuk", count: 4 },
            { type: "war_chariot_ranged", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "jiaodong": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "kong_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "chunshen": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "shangzhou": {
        formationMode: "echelon",
        slots: [
            { type: "kamayuk", count: 4 },
            { type: "war_chariot_ranged", count: 3 },
            { type: "chukonu", count: 2 },
        ],
    },
    "ba": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "yangshe": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "ruochu": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "yong": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordsman", count: 3 },
            { type: "bowman", count: 4 },
            { type: "war_chariot_ranged", count: 2 },
        ],
    },
    "ming_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "jian_swordman_shielded", count: 3 },
            { type: "hei_kuang", count: 4 },
            { type: "heavy_rocket_cart", count: 2 },
        ],
    },
    "sunqin": {
        formationMode: "triangle",
        slots: [
            { type: "fire_lancer", count: 2 },
            { type: "hei_kuang", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "luming": {
        formationMode: "triangle",
        slots: [
            { type: "fire_lancer", count: 2 },
            { type: "hei_kuang", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "zu_d": {
        formationMode: "triangle",
        slots: [
            { type: "fire_lancer", count: 2 },
            { type: "hei_kuang", count: 3 },
            { type: "elite_fire_archer", count: 4 },
        ],
    },
    "jurchen": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 4 },
            { type: "fire_archer", count: 3 },
            { type: "grenadier", count: 2 },
        ],
    },
    "xiqin": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 4 },
            { type: "fire_lancer", count: 3 },
            { type: "grenadier", count: 2 },
        ],
    },
    "manzhou": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "aisin_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "manzhou_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "agui": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "xingan": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "weiyuan": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "qinghai": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "yehe": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "wula": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "haixi_nvzhen": {
        formationMode: "fish_scale",
        slots: [
            { type: "iron_pagoda", count: 3 },
            { type: "elite_steppe_lancer", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "yanchuan_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "sizhou": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yingzhou_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "zaoyang_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "fengzhou": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "hezhou": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "changshaguo": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "shenshi": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "luoping": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_fire_lancer", count: 3 },
            { type: "jian_swordsman", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "song": {
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "heng1": {
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "changshan": {
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "zhai_han": {
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "yanzhou": {
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "huan": {
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "didao": {
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "qing": {
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "xiangzhou": {
        formationMode: "fish_scale",
        slots: [
            { type: "fire_lancer", count: 3 },
            { type: "elite_fire_lancer", count: 4 },
            { type: "fire_archer", count: 2 },
        ],
    },
    "shu": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "huizhou_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "chu": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "langzhou": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "jingmen": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "cangsong": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "qingqiang": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yangzhou": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "yueyi": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "lizhou_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "fu_zhou": {
        formationMode: "fish_scale",
        slots: [
            { type: "white_feather_guard", count: 3 },
            { type: "elite_white_feather_guard", count: 4 },
            { type: "chukonu", count: 2 },
        ],
    },
    "mazhaer": {
        formationMode: "crane_wing",
        slots: [
            { type: "hussite_wagon", count: 2 },
            { type: "magyar_huszar", count: 4 },
            { type: "hand_cannoneer", count: 3 },
        ],
    },
    "osman": {
        formationMode: "triangle",
        slots: [
            { type: "janissary", count: 2 },
            { type: "elite_janissary", count: 3 },
            { type: "royal_janissary", count: 4 },
        ],
    },
    "menggu_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "jinzhang": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "yuan_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "tiemuer": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "asaibaijiang": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "wuliangha": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "jalair": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "kiyad": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "zhadalan": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "wala": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "oirat_ming": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "an": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "babuer": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "da_yuan": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "chahar": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "zhaowu": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "manghuti": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "khoshut": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "yilihanguo_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "yilihanguo": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "salai": {
        formationMode: "fish_scale",
        slots: [
            { type: "keshik", count: 3 },
            { type: "elite_keshik", count: 4 },
            { type: "mangudai", count: 2 },
        ],
    },
    "maqidun": {
        formationMode: "echelon",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "companion_cavalry", count: 3 },
            { type: "cretan_archer", count: 2 },
        ],
    },
    "tuolemi": {
        formationMode: "echelon",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "companion_cavalry", count: 3 },
            { type: "cretan_archer", count: 2 },
        ],
    },
    "sailiugu": {
        formationMode: "echelon",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "companion_cavalry", count: 3 },
            { type: "cretan_archer", count: 2 },
        ],
    },
    "pajiama": {
        formationMode: "echelon",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "companion_cavalry", count: 3 },
            { type: "cretan_archer", count: 2 },
        ],
    },
    "beileinisi": {
        formationMode: "fish_scale",
        slots: [
            { type: "shotel_warrior", count: 4 },
            { type: "elite_shotel_warrior", count: 3 },
            { type: "dagnajan_elephant", count: 2 },
        ],
    },
    "jileinaijia": {
        formationMode: "echelon",
        slots: [
            { type: "phalangite", count: 4 },
            { type: "companion_cavalry", count: 3 },
            { type: "cretan_archer", count: 2 },
        ],
    },
    "lagoniya": {
        formationMode: "square",
        slots: [
            { type: "hippeus", count: 3 },
            { type: "hippeus", count: 3 },
            { type: "hippeus", count: 3 },
        ],
    },
    "yipilusi": {
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 4 },
            { type: "shock_cavalry", count: 3 },
            { type: "war_elephant", count: 2 },
        ],
    },
    "boootiya": {
        formationMode: "fish_scale",
        slots: [
            { type: "hoplite", count: 3 },
            { type: "sacred_band", count: 4 },
            { type: "thracian_peltast", count: 2 },
        ],
    },
    "xilagu": {
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 4 },
            { type: "shock_cavalry", count: 3 },
            { type: "gastraphetes", count: 2 },
        ],
    },
    "luodesi": {
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 4 },
            { type: "crusader_knight", count: 3 },
            { type: "rhodian_slinger", count: 2 },
        ],
    },
    "xila": {
        formationMode: "fish_scale",
        slots: [
            { type: "hoplite", count: 3 },
            { type: "strategos", count: 4 },
            { type: "cretan_archer", count: 2 },
        ],
    },
    "owari": {
        formationMode: "fish_scale",
        slots: [
            { type: "samurai", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "hand_cannoneer", count: 2 },
        ],
    },
    "kai": {
        formationMode: "fish_scale",
        slots: [
            { type: "hei_kuang", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "sanada_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "hei_kuang", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "hashiba": {
        formationMode: "fish_scale",
        slots: [
            { type: "hei_kuang", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "date_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "hei_kuang", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "echigo": {
        formationMode: "fish_scale",
        slots: [
            { type: "hei_kuang", count: 3 },
            { type: "samurai_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "iga_d": {
        formationMode: "square",
        slots: [
            { type: "ninja", count: 3 },
            { type: "ninja", count: 3 },
            { type: "ninja", count: 3 },
        ],
    },
    "gurkha": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_shotel_warrior", count: 4 },
            { type: "shotel_warrior", count: 3 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "safuyi": {
        formationMode: "fish_scale",
        slots: [
            { type: "vanguard", count: 4 },
            { type: "cavalier", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    "talanduo": {
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 4 },
            { type: "tarantine_cavalry", count: 3 },
            { type: "rhodian_slinger", count: 2 },
        ],
    },
    "luoma_diguo": {
        formationMode: "echelon",
        slots: [
            { type: "legionary", count: 4 },
            { type: "equites", count: 3 },
            { type: "skirmisher", count: 2 },
        ],
    },
    "gaolu_luoma": {
        formationMode: "echelon",
        slots: [
            { type: "legionary", count: 4 },
            { type: "equites", count: 3 },
            { type: "skirmisher", count: 2 },
        ],
    },
    "mozeer": {
        formationMode: "echelon",
        slots: [
            { type: "legionary", count: 4 },
            { type: "equites", count: 3 },
            { type: "skirmisher", count: 2 },
        ],
    },
    "aersasi": {
        formationMode: "echelon",
        slots: [
            { type: "legionary", count: 4 },
            { type: "equites", count: 3 },
            { type: "skirmisher", count: 2 },
        ],
    },
    "qiliqiya": {
        formationMode: "echelon",
        slots: [
            { type: "legionary", count: 4 },
            { type: "equites", count: 3 },
            { type: "skirmisher", count: 2 },
        ],
    },
    "aqimeinide": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "aba": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "safawei_d": {
        formationMode: "crane_wing",
        slots: [
            { type: "ghulam", count: 2 },
            { type: "qizilbash_warrior", count: 4 },
            { type: "hand_cannoneer", count: 3 },
        ],
    },
    "safawei": {
        formationMode: "crane_wing",
        slots: [
            { type: "ghulam", count: 2 },
            { type: "qizilbash_warrior", count: 4 },
            { type: "hand_cannoneer", count: 3 },
        ],
    },
    "ansxi": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "delan": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "kalan": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "midi": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "xisi": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "ailan": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "saerbadaer": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "kumisi": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "hali": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "baha": {
        formationMode: "triangle",
        slots: [
            { type: "savar", count: 2 },
            { type: "immortal", count: 3 },
            { type: "immortal_ranged", count: 4 },
        ],
    },
    "sogdian": {
        formationMode: "crane_wing",
        slots: [
            { type: "sparabara", count: 2 },
            { type: "sogdian_cataphract", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "bolan": {
        formationMode: "crane_wing",
        slots: [
            { type: "obuch", count: 2 },
            { type: "winged_hussar", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "piyasite": {
        formationMode: "crane_wing",
        slots: [
            { type: "obuch", count: 2 },
            { type: "winged_hussar", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "dabolan": {
        formationMode: "crane_wing",
        slots: [
            { type: "obuch", count: 2 },
            { type: "winged_hussar", count: 4 },
            { type: "arbalest", count: 3 },
        ],
    },
    "litaowan": {
        formationMode: "fish_scale",
        slots: [
            { type: "leitis", count: 3 },
            { type: "elite_leitis", count: 4 },
            { type: "arbalest", count: 2 },
        ],
    },
    "nieman": {
        formationMode: "fish_scale",
        slots: [
            { type: "leitis", count: 3 },
            { type: "elite_leitis", count: 4 },
            { type: "arbalest", count: 2 },
        ],
    },
    "tiaodun_qishi": {
        formationMode: "fish_scale",
        slots: [
            { type: "teutonic_knight", count: 3 },
            { type: "elite_teutonic_knight", count: 4 },
            { type: "crusader_knight", count: 2 },
        ],
    },
    "shengdian_qishi": {
        formationMode: "fish_scale",
        slots: [
            { type: "paragon", count: 4 },
            { type: "crusader_knight", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    "baojian_qishi": {
        formationMode: "fish_scale",
        slots: [
            { type: "teutonic_knight", count: 3 },
            { type: "elite_teutonic_knight", count: 4 },
            { type: "crusader_knight", count: 2 },
        ],
    },
    "liwoniya": {
        formationMode: "fish_scale",
        slots: [
            { type: "teutonic_knight", count: 3 },
            { type: "elite_teutonic_knight", count: 4 },
            { type: "crusader_knight", count: 2 },
        ],
    },
    "baizanting": {
        formationMode: "fish_scale",
        slots: [
            { type: "cataphract", count: 3 },
            { type: "elite_cataphract", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "kelite": {
        formationMode: "fish_scale",
        slots: [
            { type: "cataphract", count: 3 },
            { type: "elite_cataphract", count: 4 },
            { type: "cav_archer_heavy", count: 2 },
        ],
    },
    "taolika": {
        formationMode: "crane_wing",
        slots: [
            { type: "antiquity_spearman", count: 2 },
            { type: "sarmatian", count: 4 },
            { type: "antiquity_heavy_cavalry_archer", count: 3 },
        ],
    },
    "teluoyi": {
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 3 },
            { type: "elite_guardsman", count: 4 },
            { type: "bowman", count: 2 },
        ],
    },
    "maerta_qishi": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 3 },
            { type: "crusader_knight", count: 4 },
            { type: "hand_cannoneer", count: 2 },
        ],
    },
    "aquidan": {
        formationMode: "triangle",
        slots: [
            { type: "two_handed_swordsman", count: 2 },
            { type: "longbowman", count: 3 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    "anggelu": {
        formationMode: "triangle",
        slots: [
            { type: "two_handed_swordsman", count: 2 },
            { type: "longbowman", count: 3 },
            { type: "longbowman_elite", count: 4 },
        ],
    },
    "jialuolin": {
        formationMode: "crane_wing",
        slots: [
            { type: "throwing_axeman", count: 2 },
            { type: "elite_throwing_axeman", count: 4 },
            { type: "paladin", count: 3 },
        ],
    },
    "falanji": {
        formationMode: "crane_wing",
        slots: [
            { type: "throwing_axeman", count: 2 },
            { type: "elite_throwing_axeman", count: 4 },
            { type: "paladin", count: 3 },
        ],
    },
    "gaolu": {
        formationMode: "crane_wing",
        slots: [
            { type: "throwing_axeman", count: 2 },
            { type: "elite_throwing_axeman", count: 4 },
            { type: "paladin", count: 3 },
        ],
    },
    "aermolika": {
        formationMode: "crane_wing",
        slots: [
            { type: "throwing_axeman", count: 2 },
            { type: "elite_throwing_axeman", count: 4 },
            { type: "paladin", count: 3 },
        ],
    },
    "balunxiya": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "elite_genitour", count: 3 },
            { type: "crusader_knight", count: 2 },
        ],
    },
    "guadaer": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "elite_genitour", count: 3 },
            { type: "crusader_knight", count: 2 },
        ],
    },
    "kasidiliya": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "elite_genitour", count: 3 },
            { type: "crusader_knight", count: 2 },
        ],
    },
    "leangongguo": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "elite_genitour", count: 3 },
            { type: "crusader_knight", count: 2 },
        ],
    },
    "xigete": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "elite_genitour", count: 3 },
            { type: "crusader_knight", count: 2 },
        ],
    },
    "alagong": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "elite_genitour", count: 3 },
            { type: "crusader_knight", count: 2 },
        ],
    },
    "luosi": {
        formationMode: "fish_scale",
        slots: [
            { type: "norse_warrior", count: 3 },
            { type: "elite_berserk", count: 4 },
            { type: "boyar", count: 2 },
        ],
    },
    "qiernigeweifu_gongguo": {
        formationMode: "fish_scale",
        slots: [
            { type: "norse_warrior", count: 3 },
            { type: "elite_berserk", count: 4 },
            { type: "boyar", count: 2 },
        ],
    },
    "nuosi": {
        formationMode: "fish_scale",
        slots: [
            { type: "norse_warrior", count: 3 },
            { type: "elite_berserk", count: 4 },
            { type: "skirmisher", count: 2 },
        ],
    },
    "danmai": {
        formationMode: "fish_scale",
        slots: [
            { type: "norse_warrior", count: 3 },
            { type: "elite_berserk", count: 4 },
            { type: "skirmisher", count: 2 },
        ],
    },
    "ruidian_yota": {
        formationMode: "fish_scale",
        slots: [
            { type: "norse_warrior", count: 3 },
            { type: "elite_berserk", count: 4 },
            { type: "skirmisher", count: 2 },
        ],
    },
    "ruidian_si": {
        formationMode: "fish_scale",
        slots: [
            { type: "norse_warrior", count: 3 },
            { type: "elite_berserk", count: 4 },
            { type: "skirmisher", count: 2 },
        ],
    },
    "goryeo": {
        formationMode: "echelon",
        slots: [
            { type: "fire_archer", count: 4 },
            { type: "elite_war_wagon", count: 3 },
            { type: "jian_swordsman", count: 2 },
        ],
    },
    "chungju_d": {
        formationMode: "echelon",
        slots: [
            { type: "fire_archer", count: 4 },
            { type: "elite_war_wagon", count: 3 },
            { type: "jian_swordsman", count: 2 },
        ],
    },
    "sabeol": {
        formationMode: "echelon",
        slots: [
            { type: "fire_archer", count: 4 },
            { type: "elite_war_wagon", count: 3 },
            { type: "jian_swordsman", count: 2 },
        ],
    },
    "hai2": {
        formationMode: "echelon",
        slots: [
            { type: "fire_archer", count: 4 },
            { type: "elite_war_wagon", count: 3 },
            { type: "jian_swordsman", count: 2 },
        ],
    },
    "woju": {
        formationMode: "echelon",
        slots: [
            { type: "fire_archer", count: 4 },
            { type: "elite_war_wagon", count: 3 },
            { type: "jian_swordsman", count: 2 },
        ],
    },
    "boximiya": {
        formationMode: "echelon",
        slots: [
            { type: "konnik_foot", count: 4 },
            { type: "elite_hussite_wagon", count: 3 },
            { type: "hand_cannoneer", count: 2 },
        ],
    },
    "liguliya": {
        formationMode: "fish_scale",
        slots: [
            { type: "condottiero", count: 3 },
            { type: "elite_genoese_crossbowman", count: 4 },
            { type: "genoese_crossbowman", count: 2 },
        ],
    },
    "anuo": {
        formationMode: "fish_scale",
        slots: [
            { type: "condottiero", count: 3 },
            { type: "elite_genoese_crossbowman", count: 4 },
            { type: "genoese_crossbowman", count: 2 },
        ],
    },
    "tuosikana": {
        formationMode: "fish_scale",
        slots: [
            { type: "condottiero", count: 3 },
            { type: "elite_genoese_crossbowman", count: 4 },
            { type: "genoese_crossbowman", count: 2 },
        ],
    },
    "lunbadi": {
        formationMode: "fish_scale",
        slots: [
            { type: "condottiero", count: 3 },
            { type: "elite_genoese_crossbowman", count: 4 },
            { type: "genoese_crossbowman", count: 2 },
        ],
    },
    "yadelaiya": {
        formationMode: "fish_scale",
        slots: [
            { type: "condottiero", count: 3 },
            { type: "elite_genoese_crossbowman", count: 4 },
            { type: "genoese_crossbowman", count: 2 },
        ],
    },
    "putaoya": {
        formationMode: "fish_scale",
        slots: [
            { type: "two_handed_swordsman", count: 3 },
            { type: "heavy_pikeman", count: 4 },
            { type: "arbalest", count: 2 },
        ],
    },
    "duluo": {
        formationMode: "fish_scale",
        slots: [
            { type: "two_handed_swordsman", count: 3 },
            { type: "heavy_pikeman", count: 4 },
            { type: "arbalest", count: 2 },
        ],
    },
    "gelujiya": {
        formationMode: "fish_scale",
        slots: [
            { type: "monaspa", count: 3 },
            { type: "elite_monaspa", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "wulaertu": {
        formationMode: "triangle",
        slots: [
            { type: "warrior_priest", count: 3 },
            { type: "cavalier", count: 2 },
            { type: "elite_composite_bowman", count: 4 },
        ],
    },
    "hantawadi": {
        formationMode: "fish_scale",
        slots: [
            { type: "bayinnaung_elephant", count: 3 },
            { type: "elite_arambai", count: 4 },
            { type: "arambai", count: 2 },
        ],
    },
    "dongxu": {
        formationMode: "fish_scale",
        slots: [
            { type: "bayinnaung_elephant", count: 3 },
            { type: "elite_arambai", count: 4 },
            { type: "arambai", count: 2 },
        ],
    },
    "konbaung": {
        formationMode: "fish_scale",
        slots: [
            { type: "bayinnaung_elephant", count: 3 },
            { type: "elite_arambai", count: 4 },
            { type: "arambai", count: 2 },
        ],
    },
    "pyu": {
        formationMode: "fish_scale",
        slots: [
            { type: "bayinnaung_elephant", count: 3 },
            { type: "elite_arambai", count: 4 },
            { type: "arambai", count: 2 },
        ],
    },
    "mon": {
        formationMode: "fish_scale",
        slots: [
            { type: "bayinnaung_elephant", count: 3 },
            { type: "elite_arambai", count: 4 },
            { type: "arambai", count: 2 },
        ],
    },
    "funan": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_ballista_elephant", count: 3 },
            { type: "karambit_warrior_elite", count: 4 },
            { type: "archer", count: 2 },
        ],
    },
    "basha_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "elite_ballista_elephant", count: 3 },
            { type: "karambit_warrior_elite", count: 4 },
            { type: "archer", count: 2 },
        ],
    },
    "xixiliwangguo": {
        formationMode: "fish_scale",
        slots: [
            { type: "serjeant", count: 3 },
            { type: "elite_serjeant", count: 4 },
            { type: "arbalest", count: 2 },
        ],
    },
    "moxina": {
        formationMode: "fish_scale",
        slots: [
            { type: "serjeant", count: 3 },
            { type: "elite_serjeant", count: 4 },
            { type: "arbalest", count: 2 },
        ],
    },
    "sading": {
        formationMode: "fish_scale",
        slots: [
            { type: "serjeant", count: 3 },
            { type: "elite_serjeant", count: 4 },
            { type: "arbalest", count: 2 },
        ],
    },
    "fulandesi": {
        formationMode: "fish_scale",
        slots: [
            { type: "flemish_pikeman", count: 4 },
            { type: "cavalier", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    "bogendi": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "elite_coustillier", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    "ayoubu": {
        formationMode: "fish_scale",
        slots: [
            { type: "mameluke", count: 3 },
            { type: "elite_mameluke", count: 4 },
            { type: "camel_archer", count: 2 },
        ],
    },
    "womaya": {
        formationMode: "fish_scale",
        slots: [
            { type: "mameluke", count: 3 },
            { type: "elite_mameluke", count: 4 },
            { type: "camel_archer", count: 2 },
        ],
    },
    "donggete": {
        formationMode: "fish_scale",
        slots: [
            { type: "huskarl", count: 3 },
            { type: "elite_huskarl", count: 4 },
            { type: "crossbowman", count: 2 },
        ],
    },
    "seleisi": {
        formationMode: "crane_wing",
        slots: [
            { type: "rhomphaia_warrior", count: 2 },
            { type: "shock_cavalry", count: 4 },
            { type: "elite_peltast", count: 3 },
        ],
    },
    "saipulusi": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "cavalier", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    "bosi_puluosi": {
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 4 },
            { type: "imperial_cavalry", count: 3 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "baojialiya": {
        formationMode: "crane_wing",
        slots: [
            { type: "konnik_foot", count: 2 },
            { type: "elite_konnik", count: 4 },
            { type: "composite_bowman", count: 3 },
        ],
    },
    "saierdika": {
        formationMode: "fish_scale",
        slots: [
            { type: "konnik_foot", count: 3 },
            { type: "elite_konnik_foot", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "kanbuliya": {
        formationMode: "fish_scale",
        slots: [
            { type: "woad_raider", count: 3 },
            { type: "elite_woad_raider", count: 4 },
            { type: "longbowman", count: 2 },
        ],
    },
    "piketai": {
        formationMode: "fish_scale",
        slots: [
            { type: "woad_raider", count: 3 },
            { type: "elite_woad_raider", count: 4 },
            { type: "longbowman", count: 2 },
        ],
    },
    "gaer": {
        formationMode: "fish_scale",
        slots: [
            { type: "woad_raider", count: 3 },
            { type: "elite_woad_raider", count: 4 },
            { type: "longbowman", count: 2 },
        ],
    },
    "kongque": {
        formationMode: "crane_wing",
        slots: [
            { type: "sannahya", count: 2 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "pattiyoda_longbowman", count: 3 },
        ],
    },
    "jieri": {
        formationMode: "crane_wing",
        slots: [
            { type: "sannahya", count: 2 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "pattiyoda_longbowman", count: 3 },
        ],
    },
    "mojietuo": {
        formationMode: "fish_scale",
        slots: [
            { type: "sickle_warrior", count: 4 },
            { type: "pattiyoda_longbowman", count: 3 },
            { type: "sannahya", count: 2 },
        ],
    },
    "boluo": {
        formationMode: "echelon",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "elite_ratha_melee", count: 3 },
            { type: "pattiyoda_longbowman", count: 2 },
        ],
    },
    "jiashi_d": {
        formationMode: "crane_wing",
        slots: [
            { type: "sannahya", count: 2 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "pattiyoda_longbowman", count: 3 },
        ],
    },
    "sumo": {
        formationMode: "crane_wing",
        slots: [
            { type: "sannahya", count: 2 },
            { type: "elite_urumi_swordsman", count: 4 },
            { type: "pattiyoda_longbowman", count: 3 },
        ],
    },
    "deli": {
        formationMode: "echelon",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "elite_elephant_archer", count: 3 },
            { type: "ghulam", count: 2 },
        ],
    },
    "mowoer": {
        formationMode: "fish_scale",
        slots: [
            { type: "ghulam", count: 3 },
            { type: "imperial_camel_rider", count: 4 },
            { type: "elephant_archer", count: 2 },
        ],
    },
    "xike": {
        formationMode: "triangle",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "chakram_thrower", count: 3 },
            { type: "elite_chakram_thrower", count: 4 },
        ],
    },
    "ahaomu": {
        formationMode: "triangle",
        slots: [
            { type: "heavy_pikeman", count: 2 },
            { type: "chakram_thrower", count: 3 },
            { type: "elite_chakram_thrower", count: 4 },
        ],
    },
    "pangzha": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "pattiyoda_longbowman", count: 3 },
            { type: "porus_elephant", count: 2 },
        ],
    },
    "buni": {
        formationMode: "echelon",
        slots: [
            { type: "skirmisher", count: 4 },
            { type: "elite_war_elephant", count: 3 },
            { type: "spearman", count: 2 },
        ],
    },
    "feiniqi": {
        formationMode: "echelon",
        slots: [
            { type: "skirmisher", count: 4 },
            { type: "elite_war_elephant", count: 3 },
            { type: "spearman", count: 2 },
        ],
    },
    "heti": {
        formationMode: "echelon",
        slots: [
            { type: "bowman", count: 4 },
            { type: "elite_war_chariot", count: 3 },
            { type: "sparabara", count: 2 },
        ],
    },
    "aiji": {
        formationMode: "echelon",
        slots: [
            { type: "bowman", count: 4 },
            { type: "elite_war_chariot", count: 3 },
            { type: "sparabara", count: 2 },
        ],
    },
    "dibisi": {
        formationMode: "echelon",
        slots: [
            { type: "bowman", count: 4 },
            { type: "elite_war_chariot", count: 3 },
            { type: "sparabara", count: 2 },
        ],
    },
    "sumeier": {
        formationMode: "echelon",
        slots: [
            { type: "bowman", count: 4 },
            { type: "elite_war_chariot", count: 3 },
            { type: "sparabara", count: 2 },
        ],
    },
    "jialedi": {
        formationMode: "echelon",
        slots: [
            { type: "bowman", count: 4 },
            { type: "elite_war_chariot", count: 3 },
            { type: "sparabara", count: 2 },
        ],
    },
    "yashu": {
        formationMode: "echelon",
        slots: [
            { type: "bowman", count: 4 },
            { type: "elite_war_chariot", count: 3 },
            { type: "sparabara", count: 2 },
        ],
    },
    "guyashu": {
        formationMode: "echelon",
        slots: [
            { type: "bowman", count: 4 },
            { type: "elite_war_chariot", count: 3 },
            { type: "sparabara", count: 2 },
        ],
    },
    "xikesuosi": {
        formationMode: "echelon",
        slots: [
            { type: "bowman", count: 4 },
            { type: "elite_war_chariot", count: 3 },
            { type: "sparabara", count: 2 },
        ],
    },
    "siam": {
        formationMode: "echelon",
        slots: [
            { type: "archer", count: 4 },
            { type: "elite_battle_elephant", count: 3 },
            { type: "karambit_warrior", count: 2 },
        ],
    },
    "pagan": {
        formationMode: "echelon",
        slots: [
            { type: "archer", count: 4 },
            { type: "elite_battle_elephant", count: 3 },
            { type: "karambit_warrior", count: 2 },
        ],
    },
    "chenla": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "karambit_warrior_elite", count: 3 },
            { type: "ballista_elephant", count: 2 },
        ],
    },
    "maidina": {
        formationMode: "triangle",
        slots: [
            { type: "eastern_swordsman", count: 2 },
            { type: "camel_archer", count: 3 },
            { type: "elite_camel_archer", count: 4 },
        ],
    },
    "abasi": {
        formationMode: "triangle",
        slots: [
            { type: "eastern_swordsman", count: 2 },
            { type: "camel_archer", count: 3 },
            { type: "elite_camel_archer", count: 4 },
        ],
    },
    "gulaishi": {
        formationMode: "triangle",
        slots: [
            { type: "eastern_swordsman", count: 2 },
            { type: "camel_archer", count: 3 },
            { type: "elite_camel_archer", count: 4 },
        ],
    },
    "alabo": {
        formationMode: "triangle",
        slots: [
            { type: "eastern_swordsman", count: 2 },
            { type: "camel_archer", count: 3 },
            { type: "elite_camel_archer", count: 4 },
        ],
    },
    "bendou_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "guardsman", count: 3 },
            { type: "elite_guardsman", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "ldiya": {
        formationMode: "fish_scale",
        slots: [
            { type: "guardsman", count: 3 },
            { type: "elite_guardsman", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "fulijiya": {
        formationMode: "fish_scale",
        slots: [
            { type: "guardsman", count: 3 },
            { type: "elite_guardsman", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "bitiniya": {
        formationMode: "fish_scale",
        slots: [
            { type: "guardsman", count: 3 },
            { type: "elite_guardsman", count: 4 },
            { type: "composite_bowman", count: 2 },
        ],
    },
    "aiaoniya": {
        formationMode: "fish_scale",
        slots: [
            { type: "greek_noble_cavalry", count: 3 },
            { type: "elite_greek_cavalry", count: 4 },
            { type: "cretan_archer", count: 2 },
        ],
    },
    "bendou": {
        formationMode: "fish_scale",
        slots: [
            { type: "greek_noble_cavalry", count: 3 },
            { type: "elite_greek_cavalry", count: 4 },
            { type: "cretan_archer", count: 2 },
        ],
    },
    "kejila": {
        formationMode: "fish_scale",
        slots: [
            { type: "greek_noble_cavalry", count: 3 },
            { type: "elite_greek_cavalry", count: 4 },
            { type: "cretan_archer", count: 2 },
        ],
    },
    "najie": {
        formationMode: "fish_scale",
        slots: [
            { type: "mercenary_hoplite", count: 4 },
            { type: "shock_cavalry", count: 3 },
            { type: "bactrian_archer", count: 2 },
        ],
    },
    "fanyanna": {
        formationMode: "fish_scale",
        slots: [
            { type: "shrivamsha_rider", count: 3 },
            { type: "elite_shrivamsha_rider", count: 4 },
            { type: "archer", count: 2 },
        ],
    },
    "dulan_d": {
        formationMode: "fish_scale",
        slots: [
            { type: "shrivamsha_rider", count: 3 },
            { type: "elite_shrivamsha_rider", count: 4 },
            { type: "archer", count: 2 },
        ],
    },
    "zhayan": {
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "hamade": {
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "aguelabu": {
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "yidelisi": {
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "mulabite": {
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "babali": {
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "telibolisi": {
        formationMode: "triangle",
        slots: [
            { type: "mameluke", count: 2 },
            { type: "genitour", count: 3 },
            { type: "camel_archer", count: 4 },
        ],
    },
    "zhibuluotuo": {
        formationMode: "fish_scale",
        slots: [
            { type: "heavy_pikeman", count: 4 },
            { type: "cavalier", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    "champa": {
        formationMode: "fish_scale",
        slots: [
            { type: "karambit_warrior", count: 3 },
            { type: "karambit_warrior_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "zhancheng": {
        formationMode: "fish_scale",
        slots: [
            { type: "karambit_warrior", count: 3 },
            { type: "karambit_warrior_elite", count: 4 },
            { type: "rattan_archer", count: 2 },
        ],
    },
    "boumeilaniyan": {
        formationMode: "fish_scale",
        slots: [
            { type: "obuch", count: 3 },
            { type: "elite_obuch", count: 4 },
            { type: "arbalest", count: 2 },
        ],
    },
    "ava": {
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "two_handed_swordsman", count: 3 },
            { type: "archer", count: 4 },
        ],
    },
    "dayue": {
        formationMode: "triangle",
        slots: [
            { type: "armored_elephant", count: 2 },
            { type: "imperial_skirmisher", count: 3 },
            { type: "rattan_archer_elite", count: 4 },
        ],
    },
    "gesake": {
        formationMode: "crane_wing",
        slots: [
            { type: "conquistador", count: 2 },
            { type: "magyar_huszar", count: 4 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "dunhe": {
        formationMode: "crane_wing",
        slots: [
            { type: "conquistador", count: 2 },
            { type: "magyar_huszar", count: 4 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "qiekase": {
        formationMode: "crane_wing",
        slots: [
            { type: "conquistador", count: 2 },
            { type: "magyar_huszar", count: 4 },
            { type: "cav_archer_heavy", count: 3 },
        ],
    },
    "aosiruowen": {
        formationMode: "fish_scale",
        slots: [
            { type: "paragon", count: 4 },
            { type: "crusader_knight", count: 3 },
            { type: "arbalest", count: 2 },
        ],
    },
    "nabatai": {
        formationMode: "crane_wing",
        slots: [
            { type: "flaming_camel", count: 2 },
            { type: "camel_rider", count: 4 },
            { type: "camel_archer", count: 3 },
        ],
    },
    "nuergan": {
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "recurve_bowman", count: 3 },
            { type: "xianbei_raider", count: 4 },
        ],
    },
    "jilimi": {
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "recurve_bowman", count: 3 },
            { type: "xianbei_raider", count: 4 },
        ],
    },
    "feiyaka": {
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "recurve_bowman", count: 3 },
            { type: "xianbei_raider", count: 4 },
        ],
    },
    "eluoke": {
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "recurve_bowman", count: 3 },
            { type: "xianbei_raider", count: 4 },
        ],
    },
    "kuye": {
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "recurve_bowman", count: 3 },
            { type: "xianbei_raider", count: 4 },
        ],
    },
    "beihai": {
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "recurve_bowman", count: 3 },
            { type: "xianbei_raider", count: 4 },
        ],
    },
    "ayinu_ezo": {
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "recurve_bowman", count: 3 },
            { type: "xianbei_raider", count: 4 },
        ],
    },
    "ayinu": {
        formationMode: "triangle",
        slots: [
            { type: "tarkan", count: 2 },
            { type: "recurve_bowman", count: 3 },
            { type: "xianbei_raider", count: 4 },
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
