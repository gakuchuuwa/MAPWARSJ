import type { FormationMode } from '../../types/CultureFormations';
import type { RegionType } from '../../systems/RegionSystem';
import type { WarType } from '../../data/WarTypes';
import { popCostOf } from '../../data/UnitPopCost';
import type { WarBank } from './Scene13Types';

// ── 帧族（与 __war.html / docs/03-runtime/s10db-frame-layout.md 一致）──
// 远程/弓骑的「第 2 组 = 近战抡砸、第 5 组 = 射击」，UNIT_ASSETS 已按组拆分：
//   ATTACK = 近战（+8）  SHOOT = 射击（+40）  —— 直接取数组，不再手算偏移。
export const RANGED_TYPES = new Set(['archer', 'crossbow', 'ballista', 'horse_archer', 'fire_archer', 'kipchak', 'longbowman_elite', 'cav_archer', 'cav_archer_heavy', 'chukonu', 'rattan_archer', 'elite_fire_archer', 'elite_chukonu', 'imperial_skirmisher', 'elite_composite_bowman', 'composite_bowman', 'crossbowman', 'arbalest', 'throwing_axeman', 'arambai', 'mangudai', 'mangudai_elite', 'elite_kipchak', 'pattiyoda_longbowman', 'ballista_elephant', 'elephant_archer', 'dagnajan_elephant', 'rattan_archer_elite', 'amazon_archer', 'bactrian_archer', 'blackwood_archer', 'bolas_rider', 'bombard_cannon', 'camel_archer', 'chakram_thrower', 'conquistador', 'cretan_archer', 'elite_arambai', 'elite_ballista_elephant', 'elite_blackwood_archer', 'elite_bolas_rider', 'elite_camel_archer', 'elite_chakram_thrower', 'elite_conquistador', 'elite_elephant_archer', 'elite_gbeto', 'elite_genitour', 'elite_genoese_crossbowman', 'elite_guecha_warrior', 'elite_hussite_wagon', 'elite_janissary', 'elite_mameluke', 'elite_organ_gun', 'elite_plumed_archer', 'elite_ratha_ranged', 'elite_scythian_horse_archer', 'elite_skirmisher', 'elite_throwing_axeman', 'elite_war_wagon', 'gbeto', 'genitour', 'genoese_crossbowman', 'grenadier', 'guecha_warrior', 'hand_cannoneer', 'heavy_rocket_cart', 'heavy_scorpion', 'houfnice', 'hussite_wagon', 'immortal_ranged', 'elite_immortal_ranged', 'elite_pattiyoda_longbowman', 'janissary', 'longbowman', 'mameluke', 'mangonel', 'mounted_trebuchet', 'onager', 'organ_gun', 'plumed_archer', 'ratha_ranged', 'rhodian_slinger', 'rocket_cart', 'royal_janissary', 'scorpion', 'scythian_horse_archer', 'siege_onager', 'siege_tower', 'skirmisher', 'slinger', 'tarantine_cavalry', 'hero_harald', 'hero_arariboiaranged', 'varangian_jarl', 'elite_varangian_jarl', 'thracian_peltast', 'traction_trebuchet', 'war_chariot_ranged', 'war_wagon', 'xianbei_raider', 'gastraphetes', 'laminated_bowman', 'recurve_bowman', 'elite_peltast', 'bowman', 'antiquity_skirmisher', 'elite_antiquity_skirmisher', 'antiquity_cavalry_archer', 'antiquity_heavy_cavalry_archer', 'antiquity_scorpion', 'antiquity_heavy_scorpion', 'antiquity_mangonel', 'antiquity_onager', 'antiquity_siege_onager', 'antiquity_siege_tower', 'flamethrower', 'helepolis', 'siege_ballista']);

/**
 * 攻城战守方城墙/城门属性 —— 照 DE 本机 empires2_x2_p1.dat 实测（2026-08-22）：
 *  - 石墙 Stone Wall：hp 1080、近防 8、远防 10
 *  - 城门 Gate：hp 1650、近防 6、远防 6
 * 护甲类 armorTags = [11(石质防御 stone defense), 21(建筑 building)]：
 *   攻城武器（冲车对 11 +150、投石机 +230、火炮 +200）才打得动；普通兵近防 8/远防 10 → 每下 1。
 */
export const WALL_GATE_STATS: Record<string, WarType> = {
    STONE_WALL: { name: '石墙', cls: 'melee', sz: 1, hp: 1080, atk: 0, meleeArmor: 8, pierceArmor: 10, rng: 0, reload: 1, spd: 0, dmgType: 'melee', armorTags: [11, 13, 21, 22] },
    FORTIFIED_WALL: { name: '加固城墙', cls: 'melee', sz: 1, hp: 3000, atk: 0, meleeArmor: 12, pierceArmor: 12, rng: 0, reload: 1, spd: 0, dmgType: 'melee', armorTags: [11, 13, 21, 22] },
    STONE_GATE: { name: '城门', cls: 'melee', sz: 1, hp: 2750, atk: 0, meleeArmor: 6, pierceArmor: 6, rng: 0, reload: 1, spd: 0, dmgType: 'melee', armorTags: [11, 13, 21, 22] },
    FORTIFIED_GATE: { name: '加固城门', cls: 'melee', sz: 1, hp: 4000, atk: 0, meleeArmor: 6, pierceArmor: 6, rng: 0, reload: 1, spd: 0, dmgType: 'melee', armorTags: [11, 13, 21, 22] },
    // 🔴 [2026-10-13 全面体检抓出·已修] **木栅栏门 / 篱笆门**原来套的是 `STONE_GATE`（1650 血 + 6/6 甲），
    //    与相邻木墙（`WOOD_WALL` 540/2/5）差 3 倍 —— 一排木栅栏上却嵌着一扇比石墙还硬的门。
    //    木门与木墙同一材质，照 `WOOD_WALL` 档（键名仍写 `STONE_GATE`，见下方建门处的说明）。
    // 🔴 [2026-09-18 主人定] 木栅栏/篱笆单开一档：hp 540（= 石墙 1080 的一半）、近防 2、远防 5（木质，照 DE）。
    //    改前栅栏直接套 STONE_WALL（hp 1080、防 8/10）—— 一排木桩和石墙一样硬，正是主人实锤的
    //    「攻城武器打很久栅栏都不坏」。
    //    ⚠️ 血量不取 DE 本体的 250：那是玩家临时圈地的栅栏值，当城防太薄、一发就散。
    //    540 → 砸开要三四发、比石墙快一档，材质差别看得出来又不至于一碰就没。
    WOOD_WALL: { name: '木栅栏', cls: 'melee', sz: 1, hp: 540, atk: 0, meleeArmor: 2, pierceArmor: 5, rng: 0, reload: 1, spd: 0, dmgType: 'melee', armorTags: [11, 21, 22] },
};

/**
 * 🔴 [2026-10-12 主人令「城内建筑和箭塔按 DE 设计血量」] 血量/近防/远防逐项取自 DE 本体
 * （empires2_x2_p1.dat，genieutils 读出；护甲类 4=近战 3=穿刺，与上面石墙 1080/8/10 同口径）。
 * 行 = [血, 近防, 远防]，下标 0~3 = 黑暗/封建/城堡/帝国（AGE1~AGE4）；DE 没有的时代沿用相邻档。
 * 蒙古包/棚屋/定居点按民居，无 DE 对应项。
 */
export const DE_BLD_TABLE: Record<string, Array<[number, number, number]>> = {
    HOUSE: [[550, -2, 7], [750, -1, 8], [900, 1, 9], [900, 3, 10]],
    MILL: [[600, 0, 7], [800, 1, 8], [1000, 2, 9], [1000, 3, 10]],
    BARRACKS: [[1200, 0, 7], [1500, 1, 8], [1800, 2, 9], [2100, 3, 10]],
    ARCHERY_RANGE: [[1500, 1, 8], [1500, 1, 8], [1800, 2, 9], [2100, 3, 10]],
    STABLE: [[1500, 1, 8], [1500, 1, 8], [1800, 2, 9], [2100, 3, 10]],
    BLACKSMITH: [[1800, 0, 7], [1800, 1, 8], [2100, 2, 9], [2100, 3, 10]],
    TOWN_CENTER: [[2400, 3, 5], [2400, 4, 6], [2400, 5, 7], [2400, 6, 8]],
    MARKET: [[1800, 1, 8], [1800, 1, 8], [2100, 2, 9], [2100, 3, 10]],
    SIEGE_WORKSHOP: [[1500, 1, 8], [1500, 1, 8], [1800, 2, 9], [2100, 3, 10]],
    UNIVERSITY: [[2100, 2, 9], [2100, 2, 9], [2100, 2, 9], [2100, 3, 10]],
    MONASTERY: [[2100, 0, 7], [2100, 1, 8], [2100, 2, 9], [2100, 3, 10]],
    TOWER: [[850, 1, 7], [850, 1, 7], [1500, 2, 8], [2250, 3, 9]],
    OUTPOST: [[500, 0, 0], [500, 0, 0], [500, 0, 0], [500, 0, 0]],
    CASTLE: [[4800, 8, 11], [4800, 8, 11], [4800, 8, 11], [4800, 8, 11]],
    WONDER: [[4800, 3, 10], [4800, 3, 10], [4800, 3, 10], [4800, 3, 10]],
};

/** 素材名 → DE 建筑属性；护甲类按 DE empires2_x2_p1.dat 实测（11=建筑、13=石质防御、21=标准建筑、26=城堡），士兵与攻城武器对建筑加成照 dmgVs 自然结算。 */
export function deBuildingStats(name: string, forceKind?: string): WarType {
    const m = name.match(/_AGE([1-4])/);
    const age = m ? Number(m[1]) - 1 : 1;
    let kind = forceKind ?? 'HOUSE';
    if (!forceKind) for (const k of ['CASTLE', 'ARCHERY_RANGE', 'SIEGE_WORKSHOP', 'TOWN_CENTER', 'BARRACKS', 'BLACKSMITH', 'UNIVERSITY', 'MONASTERY', 'MARKET', 'STABLE', 'MILL', 'TOWER', 'OUTPOST']) {
        if (name.includes(k)) { kind = k; break; }
    }
    const dark = name.startsWith('DARK_') || name.startsWith('HUT_') || name === 'SETTLEMENT';
    const [hp, melee, pierce] = DE_BLD_TABLE[kind][dark && !forceKind ? 0 : age];
    const armorTags = kind === 'CASTLE' ? [11, 21, 26]
        : kind === 'TOWER' ? [11, 13, 21]
            : kind === 'WONDER' ? [11]
                : [11, 21];
    return { name, cls: 'melee', sz: 1, hp, atk: 0, meleeArmor: melee, pierceArmor: pierce, rng: 0, reload: 1, spd: 0, dmgType: 'melee', armorTags };
}

// ── 兵种属性（2026-08-16 全面套用 AoE2 DE 真实数据）──
// 五维 = 血 hp / 攻 atk / 防（meleeArmor 近防 + pierceArmor 远防）/ 射程 rng / 射速 reload。


export const SIGHT_MAP: Record<string, number> = {
    // ── [2026-08-18 补齐] 新补录兵种：同族继承其基准单位；无同族者远程取射程+80、骑兵200、象/攻城280、步兵160（对齐 DE 规律：视野必须 ≥ 射程） ──
    antiquity_battering_ram: 120,
    antiquity_capped_ram: 120,
    antiquity_cavalry_archer: 300,
    antiquity_heavy_cavalry_archer: 320,
    antiquity_heavy_scorpion: 360,
    antiquity_light_cavalry: 200,
    antiquity_mangonel: 360,
    antiquity_onager: 400,
    antiquity_scorpion: 360,
    antiquity_scout_cavalry: 200,
    antiquity_siege_onager: 400,
    antiquity_siege_ram: 120,
    antiquity_siege_tower: 320,
    antiquity_skirmisher: 240,
    antiquity_spearman: 160,
    bowman: 280,
    crusader_knight: 200,
    elite_antiquity_skirmisher: 240,
    elite_greek_cavalry: 200,
    elite_peltast: 280,
    equites: 200,
    gastraphetes: 280,
    guardsman: 160,
    halberdier: 160,
    imperial_cavalry: 200,
    jian_swordman_shielded: 160,
    laminated_bowman: 280,
    levy: 160,
    norse_warrior: 160,
    paragon: 160,
    raider: 200,
    sarmatian: 200,
    shock_cavalry: 200,
    sosso_guard: 160,
    vanguard: 160,
    tarantine_cavalry: 320,
    varangian_jarl: 280,
    jarl: 280,
    hero_harald: 300,
    hero_arariboiaranged: 300,
    elite_varangian_jarl: 300,
    amazon_archer: 240,
    amazon_warrior: 120,
    arambai: 280,
    arbalest: 280,
    archer: 240,
    armored: 160,
    armored_elephant: 240,
    maceman: 160, mounted_crossbowman: 300, mounted_crossbowman_heavy: 320,
    priestess: 440, polemarch: 200,
    axe: 120,
    bactrian_archer: 280,
    ballista: 360,
    ballista_elephant: 300,
    battle_elephant: 280,
    bayinnaung_elephant: 200,
    dagnajan_elephant: 300,
    battering_ram: 200,
    berserk: 120,
    blackwood_archer: 240,
    bolas_rider: 280,
    bombard_cannon: 560,
    boyar: 200,
    camel_archer: 300,
    camel_heavy: 200,
    camel_raider: 160,
    camel_rider: 200,
    camel_scout: 160,
    capped_ram: 200,
    cataphract: 160,
    cav_archer: 300,
    cav_archer_heavy: 320,
    centurion: 160,
    chakram_thrower: 280,
    champion: 200,
    chukonu: 240,
    companion_cavalry: 200,
    composite_bowman: 280,
    condottiero: 240,
    conquistador: 320,
    coustillier: 200,
    cretan_archer: 280,
    crossbow: 280,
    crossbowman: 280,
    eagle_scout: 200,
    eagle_warrior: 240,
    eastern_swordsman: 160,
    ekdromos: 160,
    elephant: 280,
    elephant_archer: 300,
    elite_arambai: 300,
    elite_armored_elephant: 240,
    elite_ballista_elephant: 320,
    elite_battle_elephant: 320,
    elite_berserk: 200,
    elite_blackwood_archer: 240,
    elite_bolas_rider: 300,
    elite_boyar: 200,
    elite_camel_archer: 320,
    elite_cataphract: 200,
    elite_centurion: 200,
    elite_chakram_thrower: 320,
    elite_champi_warrior: 240,
    elite_chukonu: 240,
    elite_companion_cavalry: 200,
    elite_composite_bowman: 280,
    elite_conquistador: 360,
    elite_coustillier: 200,
    elite_eagle_warrior: 240,
    elite_elephant_archer: 320,
    elite_fire_archer: 440,
    elite_fire_lancer: 240,
    elite_gbeto: 280,
    elite_genitour: 300,
    elite_genoese_crossbowman: 320,
    elite_ghulam: 240,
    elite_guardsman: 160,
    elite_guecha_warrior: 200,
    elite_hippeus: 160,
    elite_huskarl: 200,
    hearth_troop: 200,
    elite_hearth_troop: 200,
    jomsviking: 200,
    elite_jomsviking: 200,
    varangian_guard: 200,
    elite_varangian_guard: 200,
    elite_hussite_wagon: 320,
    elite_ibirapema_warrior: 200,
    elite_iron_pagoda: 200,
    elite_jaguar_warrior: 200,
    elite_janissary: 400,
    elite_kamayuk: 200,
    elite_keshik: 200,
    elite_kipchak: 320,
    elite_kona: 240,
    elite_konnik: 200,
    elite_konnik_foot: 120,
    elite_leitis: 200,
    elite_liao_dao: 120,
    elite_magyar_huszar: 240,
    elite_mameluke: 280,
    elite_monaspa: 200,
    elite_obuch: 120,
    elite_organ_gun: 360,
    elite_pattiyoda_longbowman: 200,
    elite_plumed_archer: 240,
    elite_ratha_melee: 240,
    elite_ratha_ranged: 320,
    elite_scythian_horse_archer: 320,
    elite_serjeant: 200,
    elite_shotel_warrior: 120,
    elite_shrivamsha_rider: 240,
    elite_skirmisher: 280,
    elite_steppe_lancer: 200,
    elite_strategos: 240,
    elite_tarkan: 280,
    elite_temple_guard: 240,
    elite_teutonic_knight: 200,
    elite_throwing_axeman: 360,
    elite_tiger_cavalry: 200,
    elite_urumi_swordsman: 120,
    elite_war_chariot: 200,
    elite_war_dog: 200,
    elite_war_elephant: 320,
    elite_war_wagon: 320,
    elite_white_feather_guard: 200,
    elite_woad_raider: 200,
    fire_archer: 400,
    fire_lancer: 200,
    flaming_camel: 160,
    flemish_pikeman: 200,
    flemish_pikeman_f: 200,
    gbeto: 240,
    general_cavalry: 200,
    genitour: 280,
    genoese_crossbowman: 320,
    ghulam: 240,
    greek_noble_cavalry: 200,
    grenadier: 280,
    guecha_warrior: 160,
    hand_cannoneer: 360,
    heavy_cavalry: 160,
    heavy_infantry: 160,
    heavy_pikeman: 160,
    heavy_rocket_cart: 400,
    heavy_scorpion: 360,
    hei_kuang: 160,
    hei_kuang_heavy: 160,
    hill_tribesman: 160,
    hippeus: 160,
    hoplite: 160,
    elite_hoplite: 160,
    horse_archer: 300,
    houfnice: 560,
    huskarl: 120,
    hussar: 160,
    hussite_wagon: 320,
    ibirapema_warrior: 200,
    immortal: 200,
    elite_immortal: 200,
    immortal_ranged: 200,
    elite_immortal_ranged: 200,
    imperial_camel_rider: 200,
    imperial_centurion: 200,
    imperial_skirmisher: 280,
    indian_tribesman: 160,
    iron_pagoda: 200,
    iroquois_warrior: 120,
    jaguar_warrior: 120,
    janissary: 400,
    jian_swordsman: 160,
    kamayuk: 160,
    karambit_warrior: 120,
    karambit_warrior_elite: 120,
    keshik: 200,
    kipchak: 300,
    knight: 160,
    kona: 200,
    konnik: 200,
    konnik_foot: 120,
    lancer: 160,
    legionary: 200,
    leitis: 200,
    liao_dao: 120,
    light_infantry: 160,
    light_riders: 160,
    longbowman: 280,
    longbowman_elite: 320,
    magyar_huszar: 240,
    mameluke: 280,
    mangonel: 360,
    mangudai: 300,
    mangudai_elite: 320,
    mercenary_hoplite: 200,
    militia: 160,
    monaspa: 160,
    mounted_trebuchet: 520,
    ninja: 160,
    obuch: 120,
    onager: 400,
    organ_gun: 320,
    paladin: 200,
    pattiyoda_longbowman: 200,
    petard: 160,
    phalangite: 160,
    elite_phalangite: 160,
    pikeman: 160,
    plumed_archer: 240,
    porus_elephant: 280,
    qizilbash_warrior: 160,
    ratha_melee: 240,
    ratha_ranged: 300,
    rattan_archer: 240,
    rattan_archer_elite: 240,
    rhodian_slinger: 280,
    rhomphaia_warrior: 160,
    elite_rhomphaia_warrior: 160,
    rocket_cart: 360,
    royal_janissary: 400,
    sacred_band: 160,
    samurai: 160,
    samurai_elite: 200,
    sannahya: 280,
    elite_sannahya: 280,
    savar: 200,
    scorpion: 360,
    siege_ballista: 360,
    scythian_axe_cavalry: 200,
    scythian_horse_archer: 300,
    serjeant: 120,
    shield: 200,
    shotel_warrior: 120,
    shrivamsha_rider: 200,
    sickle_warrior: 120,
    siege_onager: 400,
    siege_ram: 200,
    skirmisher: 240,
    slinger: 280,
    sogdian_cataphract: 200,
    sparabara: 120,
    spear: 160,
    spearman: 160,
    steppe_lancer: 200,
    strategos: 240,
    swordsman: 160,
    sakan_axeman: 120,
    tarkan: 200,
    temple_guard: 200,
    teutonic_knight: 120,
    thracian_peltast: 280,
    throwing_axeman: 280,
    tiger_rider: 200,
    traction_trebuchet: 720,
    two_handed_swordsman: 200,
    urumi_swordsman: 120,
    war_chariot: 200,
    war_chariot_ranged: 320,
    war_dog: 200,
    war_elephant: 280,
    war_wagon: 300,
    warrior_priest: 120,
    white_feather_guard: 160,
    winged_hussar: 160,
    woad_raider: 120,
    xianbei_raider: 300,
    xolotl_warrior: 160,
    longswordsman: 160,
    champi_warrior: 160,
    champi_runner: 200,
    champi_scout: 200,
    jian_swordman_unshielded: 160,
    cavalier: 200,
    ant_scout: 200,
    flamethrower: 200,
    helepolis: 520,   // [2026-08-18 修] 原 360 < 射程 440：看不见自己射程内的敌人，永远打不出去。按 DE 规律取射程+80
    siege_tower: 320,
    recurve_bowman: 240,
};

export const DE_FORMATION_LAYOUT = (() => {
    try {
        if (typeof location === 'undefined') return false;
        return new URLSearchParams(location.search).get('deForm') === '1';
    } catch {
        return false;
    }
})();

export const LAYOUT: Record<FormationMode, { col: number; row: number; cols: number }[]> = {
    triangle: [
        { col: 0, row: 0, cols: 2 }, { col: 1, row: 0, cols: 2 },
        { col: 0, row: 1, cols: 3 }, { col: 1, row: 1, cols: 3 }, { col: 2, row: 1, cols: 3 },
        { col: 0, row: 2, cols: 4 }, { col: 1, row: 2, cols: 4 }, { col: 2, row: 2, cols: 4 }, { col: 3, row: 2, cols: 4 },
    ],
    echelon: [
        { col: 0, row: 0, cols: 4 }, { col: 1, row: 0, cols: 4 }, { col: 2, row: 0, cols: 4 }, { col: 3, row: 0, cols: 4 },
        { col: 0, row: 1, cols: 3 }, { col: 1, row: 1, cols: 3 }, { col: 2, row: 1, cols: 3 },
        { col: 0, row: 2, cols: 2 }, { col: 1, row: 2, cols: 2 },
    ],
    fish_scale: [
        { col: 0, row: 0, cols: 3 }, { col: 1, row: 0, cols: 3 }, { col: 2, row: 0, cols: 3 },
        { col: 0, row: 1, cols: 4 }, { col: 1, row: 1, cols: 4 }, { col: 2, row: 1, cols: 4 }, { col: 3, row: 1, cols: 4 },
        { col: 0, row: 2, cols: 3 }, { col: 2, row: 2, cols: 3 },
    ],
    crane_wing: [
        { col: 0, row: 0, cols: 3 }, { col: 2, row: 0, cols: 3 },
        { col: 0, row: 1, cols: 4 }, { col: 1, row: 1, cols: 4 }, { col: 2, row: 1, cols: 4 }, { col: 3, row: 1, cols: 4 },
        { col: 0, row: 2, cols: 3 }, { col: 1, row: 2, cols: 3 }, { col: 2, row: 2, cols: 3 },
    ],
    square: [
        { col: 0, row: 0, cols: 3 }, { col: 1, row: 0, cols: 3 }, { col: 2, row: 0, cols: 3 },
        { col: 0, row: 1, cols: 3 }, { col: 1, row: 1, cols: 3 }, { col: 2, row: 1, cols: 3 },
        { col: 0, row: 2, cols: 3 }, { col: 1, row: 2, cols: 3 }, { col: 2, row: 2, cols: 3 },
    ],
    crescent: [
        { col: 0, row: 0, cols: 3 }, { col: 1, row: 0, cols: 3 }, { col: 2, row: 0, cols: 3 },
        { col: 0, row: 1, cols: 2 }, { col: 1, row: 1, cols: 2 },
        { col: 0, row: 2, cols: 4 }, { col: 1, row: 2, cols: 4 }, { col: 2, row: 2, cols: 4 }, { col: 3, row: 2, cols: 4 },
    ],
    balance_yoke: [
        { col: 0, row: 0, cols: 4 }, { col: 1, row: 0, cols: 4 }, { col: 2, row: 0, cols: 4 }, { col: 3, row: 0, cols: 4 },
        { col: 0, row: 1, cols: 2 }, { col: 1, row: 1, cols: 2 },
        { col: 0, row: 2, cols: 3 }, { col: 1, row: 2, cols: 3 }, { col: 2, row: 2, cols: 3 },
    ],
};

export const SIDE_LANES = 10;
/** 
 * 各阵型第 10 口主将队/英雄队的站位：
 * 🔴 [2026-10-15 主人令]「英雄队的位置统一改为在2之间，除了3*3方阵」
 * 所有阵型（除方阵 3+3+3）都有一个「2 队」的排，英雄队统一放在那 2 队正中间；
 * 方阵无 2 队排，保持 row -1 前排正中矛头位置。
 */
export const COMMANDER_CELL: Record<FormationMode, { col: number; row: number; cols: number }> = {
    triangle: { col: 0.5, row: 0, cols: 2 },     // 三角 2+3+4：前排 2 组（col 0/1）中间
    crane_wing: { col: 1, row: 0, cols: 3 },     // 鹤翼 2+4+3：前排 2 组（col 0/2）中间
    echelon: { col: 0.5, row: 2, cols: 2 },      // 雁行 4+3+2：后排 2 组（col 0/1）中间
    square: { col: 0, row: -1, cols: 1 },        // 方阵 3+3+3：无 2 队，保持前排正中矛头
    balance_yoke: { col: 0.5, row: 1, cols: 2 }, // 衡轭 4+2+3：中排 2 组（col 0/1）中间
    fish_scale: { col: 1, row: 2, cols: 3 },     // 鱼鳞 3+4+2：后排 2 组（col 0/2）中间
    crescent: { col: 0.5, row: 1, cols: 2 },     // 偃月 3+2+4：中排 2 组（col 0/1）中间
};

/** 建筑占地边长档位（格）：与 TerritorySystem.deBuildingFootprint 对齐，城堡与世界奇观作为核心决胜建筑定为 5 档（28 秒保底） */
export function bldFootprintSide(b: string): number {
    if (b.includes('CASTLE') || b.includes('WONDER')) return 5;
    if (b.includes('TOWN_CENTER') || b.includes('MARKET') || b.includes('UNIVERSITY') || b.includes('SIEGE_WORKSHOP')) return 4;
    if (b.includes('BARRACKS') || b.includes('ARCHERY_RANGE') || b.includes('STABLE') || b.includes('BLACKSMITH') || b.includes('MONASTERY')) return 3;
    if (b.includes('HOUSE') || b.includes('MILL') || b.startsWith('YURT_') || b.includes('TENT') || b.includes('HUT') || b.includes('PAVILION')) return 2;
    if (b.includes('TOWER') || b.includes('OUTPOST')) return 1;
    return 3;
}

/** AoE2 DE（SLD）动态帧框素材目录：走 hotspot 对齐渲染，读 `_meta.json`。其余（S10DB/征服版 SLP）走正方形帧。 */
export const DE_DYN_DIRS = ["/SUCAI/GUANYU/","/SUCAI/AMAZONARCHER/","/SUCAI/AMAZONWARRIOR/","/SUCAI/ANTIQUITY_BATTERINGRAM/","/SUCAI/ANTIQUITY_CAPPED_RAM/","/SUCAI/ANTIQUITY_CAVALRY_ARCHER/","/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/","/SUCAI/ANTIQUITY_HEAVY_SCORPION/","/SUCAI/ANTIQUITY_LIGHT_CAVALRY/","/SUCAI/ANTIQUITY_MANGONEL/","/SUCAI/ANTIQUITY_ONAGER/","/SUCAI/ANTIQUITY_SCORPION/","/SUCAI/ANTIQUITY_SCOUT_CAVALRY/","/SUCAI/ANTIQUITY_SIEGE_ONAGER/","/SUCAI/ANTIQUITY_SIEGE_RAM/","/SUCAI/ANTIQUITY_SIEGE_TOWER/","/SUCAI/ANTIQUITY_SKIRMISHER/","/SUCAI/ANTIQUITY_SPEARMAN/","/SUCAI/ARAMBAI/","/SUCAI/ARBALEST/","/SUCAI/ARCHER/","/SUCAI/ARMORED_ELEPHANT/","/SUCAI/BACTRIAN_ARCHER/","/SUCAI/BALLISTA_ELEPHANT/","/SUCAI/BATTERINGRAM/","/SUCAI/BATTLEELEPHANT/","/SUCAI/BAYINNAUNG_ELEPHANT/","/SUCAI/BERSERK/","/SUCAI/BLACKWOODARCHER/","/SUCAI/BOLASRIDER/","/SUCAI/BOMBARDCANNON/","/SUCAI/BOWMAN/","/SUCAI/BOYAR/","/SUCAI/CAMELARCHER/","/SUCAI/CAMELRIDER/","/SUCAI/CAMELSCOUT/","/SUCAI/CAMEL_HEAVY/","/SUCAI/CAMEL_RAIDER/","/SUCAI/CAPPEDRAM/","/SUCAI/CATAPHRACT/","/SUCAI/CAVALIER/","/SUCAI/CAV_ARCHER/","/SUCAI/CAV_ARCHER_HEAVY/","/SUCAI/CENTURION/","/SUCAI/CHAKRAMTHROWER/","/SUCAI/CHAMPION/","/SUCAI/CHAMPIRUNNER/","/SUCAI/CHAMPISCOUT/","/SUCAI/CHAMPIWARRIOR/","/SUCAI/CHUKONU/","/SUCAI/COMPANION_CAVALRY/","/SUCAI/COMPOSITE_BOWMAN/","/SUCAI/CONDOTTIERO/","/SUCAI/CONQUISTADOR/","/SUCAI/COUSTILLIER/","/SUCAI/CRETAN_ARCHER/","/SUCAI/CROSSBOWMAN/","/SUCAI/CRUSADERKNIGHT/","/SUCAI/DAGNAJAN_ELEPHANT/","/SUCAI/EAGLESCOUT/","/SUCAI/EAGLEWARRIOR/","/SUCAI/EASTERN_SWORDSMAN/","/SUCAI/EKDROMOS/","/SUCAI/ELEPHANT_ARCHER/","/SUCAI/ELITEARAMBAI/","/SUCAI/ELITEARMOREDELEPHANT/","/SUCAI/ELITEBALLISTAELEPHANT/","/SUCAI/ELITEBATTLEELEPHANT/","/SUCAI/ELITEBERSERK/","/SUCAI/ELITEBLACKWOODARCHER/","/SUCAI/ELITEBOLASRIDER/","/SUCAI/ELITEBOYAR/","/SUCAI/ELITECAMELARCHER/","/SUCAI/ELITECATAPHRACT/","/SUCAI/ELITECENTURION/","/SUCAI/ELITECHAKRAMTHROWER/","/SUCAI/ELITECHAMPIWARRIOR/","/SUCAI/ELITECONQUISTADOR/","/SUCAI/ELITECOUSTILLIER/","/SUCAI/ELITEEAGLEWARRIOR/","/SUCAI/ELITEELEPHANTARCHER/","/SUCAI/ELITEFOOTKONNIK/","/SUCAI/ELITEGBETO/","/SUCAI/ELITEGENITOUR/","/SUCAI/ELITEGENOESECROSSBOWMAN/","/SUCAI/ELITEGHULAM/","/SUCAI/ELITEGUECHAWARRIOR/","/SUCAI/ELITEHUSKARL/","/SUCAI/ELITEHUSSITEWAGON/","/SUCAI/ELITEIBIRAPEMAWARRIOR/","/SUCAI/ELITEIRONPAGODA/","/SUCAI/ELITEJAGUARWARRIOR/","/SUCAI/ELITEJANISSARY/","/SUCAI/ELITEKAMAYUK/","/SUCAI/ELITEKESHIK/","/SUCAI/ELITEKONA/","/SUCAI/ELITEKONNIK/","/SUCAI/ELITELEITIS/","/SUCAI/ELITEMAGYARHUSZAR/","/SUCAI/ELITEMAMELUKE/","/SUCAI/ELITEMONASPA/","/SUCAI/ELITEOBUCH/","/SUCAI/ELITEORGANGUN/","/SUCAI/ELITEPLUMEDARCHER/","/SUCAI/ELITERATHAMELEE/","/SUCAI/ELITERATHARANGED/","/SUCAI/ELITESERJEANT/","/SUCAI/ELITESHOTELWARRIOR/","/SUCAI/ELITESHRIVAMSHARIDER/","/SUCAI/ELITESKIRMISHER/","/SUCAI/ELITETEMPLEGUARD/","/SUCAI/ELITETEUTONICKNIGHT/","/SUCAI/ELITETHROWINGAXEMAN/","/SUCAI/ELITETIGERCAVALRY/","/SUCAI/ELITEURUMISWORDSMAN/","/SUCAI/ELITEWARDOG/","/SUCAI/ELITEWARELEPHANT/","/SUCAI/ELITEWARWAGON/","/SUCAI/ELITEWOADRAIDER/","/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/","/SUCAI/ELITE_CHUKONU/","/SUCAI/ELITE_COMPOSITE_BOWMAN/","/SUCAI/ELITE_FIRE_ARCHER/","/SUCAI/ELITE_FIRE_LANCER/","/SUCAI/ELITE_GREEK_CAVALRY/","/SUCAI/ELITE_GUARDSMAN/","/SUCAI/ELITE_HOPLITE/","/SUCAI/ELITE_KIPCHAK/","/SUCAI/ELITE_LIAO_DAO/","/SUCAI/ELITE_PELTAST/","/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/","/SUCAI/ELITE_STEPPE_LANCER/","/SUCAI/ELITE_TARKAN/","/SUCAI/ELITE_WAR_CHARIOT/","/SUCAI/ELITE_WHITE_FEATHER_GUARD/","/SUCAI/EQUITES/","/SUCAI/FIRE_ARCHER/","/SUCAI/FIRE_LANCER/","/SUCAI/FLAMETHROWER/","/SUCAI/FLAMINGCAMEL/","/SUCAI/FLEMISHPIKEMAN/","/SUCAI/FLEMISHPIKEMAN_F/","/SUCAI/FOOTKONNIK/","/SUCAI/GASTRAPHETES/","/SUCAI/GBETO/","/SUCAI/GENITOUR/","/SUCAI/GENOESECROSSBOWMAN/","/SUCAI/GHULAM/","/SUCAI/GREEK_NOBLE_CAVALRY/","/SUCAI/GRENADIER/","/SUCAI/GUARDSMAN/","/SUCAI/GUECHAWARRIOR/","/SUCAI/HALBERDIER/","/SUCAI/HANDCANNONEER/","/SUCAI/HEAVYROCKETCART/","/SUCAI/HEAVYSCORPION/","/SUCAI/HEAVY_PIKEMAN/","/SUCAI/HEI_KUANG/","/SUCAI/HEI_KUANG_HEAVY/","/SUCAI/HELEPOLIS/","/SUCAI/HILL_TRIBESMAN/","/SUCAI/HIPPEUS/","/SUCAI/HOPLITE/","/SUCAI/HOUFNICE/","/SUCAI/HUSKARL/","/SUCAI/HUSSAR/","/SUCAI/HUSSITEWAGON/","/SUCAI/IBIRAPEMAWARRIOR/","/SUCAI/IMMORTAL/","/SUCAI/IMPERIALCAMELRIDER/","/SUCAI/IMPERIALCENTURION/","/SUCAI/IMPERIAL_CAVALRY/","/SUCAI/IMPERIAL_SKIRMISHER/","/SUCAI/INDIAN_TRIBESMAN/","/SUCAI/IRON_PAGODA/","/SUCAI/IROQUOISWARRIOR/","/SUCAI/JAGUARWARRIOR/","/SUCAI/JANISSARY/","/SUCAI/JIANSWORDMANSHIELDED/","/SUCAI/JIAN_SWORDMAN_UNSHIELDED/","/SUCAI/JIAN_SWORDSMAN/","/SUCAI/KAMAYUK/","/SUCAI/KARAMBIT_WARRIOR/","/SUCAI/KARAMBIT_WARRIOR_ELITE/","/SUCAI/KESHIK/","/SUCAI/KIPCHAK/","/SUCAI/KNIGHT/","/SUCAI/KONA/","/SUCAI/KONNIK/","/SUCAI/LAMINATED_BOWMAN/","/SUCAI/LANCER/","/SUCAI/LEGIONARY/","/SUCAI/LEITIS/","/SUCAI/LEVY/","/SUCAI/LIAO_DAO/","/SUCAI/LIGHTCAVALRY/","/SUCAI/LIGHT_RIDERS/","/SUCAI/LONGBOWMAN/","/SUCAI/LONGBOWMAN_ELITE/","/SUCAI/LONGSWORDSMAN/","/SUCAI/MAGYARHUSZAR/","/SUCAI/MAMELUKE/","/SUCAI/MANATARMS/","/SUCAI/MANGONEL/","/SUCAI/MANGUDAI/","/SUCAI/MANGUDAI_ELITE/","/SUCAI/MILITIA/","/SUCAI/MONASPA/","/SUCAI/MOUNTED_ALEXANDER/","/SUCAI/ARTAPHERNES/","/SUCAI/MOUNTEDTREBUCHET/","/SUCAI/NINJA/","/SUCAI/NORSE_WARRIOR/","/SUCAI/OBUCH/","/SUCAI/ONAGER/","/SUCAI/ORGANGUN/","/SUCAI/PALADIN/","/SUCAI/PARAGON/","/SUCAI/PATTIYODA_LONGBOWMAN/","/SUCAI/PETARD/","/SUCAI/PHALANGITE/","/SUCAI/PIKEMAN/","/SUCAI/PLUMEDARCHER/","/SUCAI/PORUS_ELEPHANT/","/SUCAI/PROJ_ARROW/","/SUCAI/PROJ_ARROW_FIRE/","/SUCAI/PROJ_BALL/","/SUCAI/PROJ_MANGONEL/","/SUCAI/PROJ_ROCK/","/SUCAI/PROJ_BOLT/","/SUCAI/PROJ_DART/","/SUCAI/PROJ_GRENADE/","/SUCAI/PROJ_SHOT/","/SUCAI/PROJ_SLING/","/SUCAI/PROJ_SPEAR/","/SUCAI/PROJ_THROWING_AXE/","/SUCAI/QIZILBASHWARRIOR/","/SUCAI/RAIDER/","/SUCAI/RANGED_IMMORTAL/","/SUCAI/RATHAMELEE/","/SUCAI/RATHARANGED/","/SUCAI/RATTAN_ARCHER/","/SUCAI/RATTAN_ARCHER_ELITE/","/SUCAI/RECURVE_BOWMAN/","/SUCAI/RHODIAN_SLINGER/","/SUCAI/RHOMPHAIA_WARRIOR/","/SUCAI/ROCKETCART/","/SUCAI/ROYALJANISSARY/","/SUCAI/SACRED_BAND/","/SUCAI/SAKAN_AXEMAN/","/SUCAI/SAMURAI_DE/","/SUCAI/SAMURAI_ELITE/","/SUCAI/SANNAHYA/","/SUCAI/SARMATIAN/","/SUCAI/SAVAR/","/SUCAI/SCORPION/","/SUCAI/SCOUTCAVALRY/","/SUCAI/SCYTHIAN_AXE_CAVALRY/","/SUCAI/SCYTHIAN_HORSE_ARCHER/","/SUCAI/SERJEANT/","/SUCAI/SHOCK_CAVALRY/","/SUCAI/SHOTELWARRIOR/","/SUCAI/SHRIVAMSHARIDER/","/SUCAI/SICKLE_WARRIOR/","/SUCAI/SIEGEONAGER/","/SUCAI/SIEGERAM/","/SUCAI/SIEGETOWER/","/SUCAI/SIEGE_BALLISTA/","/SUCAI/SKIRMISHER/","/SUCAI/SLINGER/","/SUCAI/SOGDIANCATAPHRACT/","/SUCAI/SOSSO_GUARD/","/SUCAI/SPARABARA/","/SUCAI/SPEARMAN/","/SUCAI/STEPPE_LANCER/","/SUCAI/STRATEGOS/","/SUCAI/SWORDSMAN/","/SUCAI/TARANTINE_CAVALRY/","/SUCAI/TARKAN/","/SUCAI/TEMPLEGUARD/","/SUCAI/TEUTONICKNIGHT/","/SUCAI/THRACIAN_PELTAST/","/SUCAI/THROWING_AXEMAN/","/SUCAI/TIGER_RIDER/","/SUCAI/TRACTIONTREBUCHET/","/SUCAI/TWOHANDEDSWORDSMAN/","/SUCAI/URUMISWORDSMAN/","/SUCAI/VANGUARD/","/SUCAI/WARCHARIOT/","/SUCAI/WARDOG/","/SUCAI/WARRIORPRIEST/","/SUCAI/WARWAGON/","/SUCAI/WAR_CHARIOT/","/SUCAI/WAR_ELEPHANT/","/SUCAI/WHITE_FEATHER_GUARD/","/SUCAI/WINGEDHUSSAR/","/SUCAI/WOADRAIDER/","/SUCAI/XIANBEI_RAIDER/","/SUCAI/XOLOTLWARRIOR/"];

/** 攻城战守方建筑：按守方文化区匹配 DE 建筑风格前缀（2026-08-22 主人定）。
 *  风格前缀 + 建筑名 + AGE3 = 素材目录名（如 `WEST_CASTLE_AGE3`、`ASIA_BARRACKS_AGE3`）。 */
export const REGION_BUILDING_STYLE: Record<RegionType, string> = {
    SLAVIC: 'SLAV',
    SLAVIC_FEUDAL: 'SLAV',
    SLAVIC_CASTLE: 'SLAV',
    SLAVIC_IMPERIAL: 'SLAV',
    GERMANIC: 'WEST',
    GERMANIC_FEUDAL: 'WEST',
    GERMANIC_IMPERIAL: 'WEST',
    GERMANIC_CASTLE: 'WEST',
    LATIN: 'MEDI',
    LATIN_CASTLE: 'MEDI',
    LATIN_IMPERIAL: 'MEDI',
    LATIN_FEUDAL: 'MEDI',
    CENTRAL: 'ASIA',
    NORTH: 'ASIA',
    JIANGNAN: 'ASIA',
     // [2026-08-27] SEAS→ASIA（主人定滇缅归中国区，与战略一致）
    HEXI: 'ASIA',
    WESTERN: 'CEAS',   // 主人定：西域用中亚（CEAS）
    WESTERN_FEUDAL: 'CEAS',
    WESTERN_CASTLE: 'CEAS',
    WESTERN_IMPERIAL: 'CEAS',
    TIBET: 'PURU',     // 🔴 [2026-09-11 主人定「同步游戏和程序」] 三层建筑风格：吐蕃=南亚古典 PURU 粗石红褐石墙，
    TIBET_CASTLE: 'PURU',   //    与战略地图 REGION_TO_DE_STYLE 和 _citytest.html 预览页完全一致；
    TIBET_IMPERIAL: 'PURU', //    守城宗堡仍走 castleAssetFor() → TIBET_CASTLE_AGE3 藏式金顶宗堡（不受本表影响）。
    STEPPE: 'CEAS',    // 草原特例：战术无蒙古包，用库曼建筑近似（保持不动）
    STEPPE_IMPERIAL: 'CEAS',
    STEPPE_ANTIQUITY: 'CEAS',
    STEPPE_FEUDAL: 'CEAS',
    NORTHEAST: 'ASIA',
    KOREA: 'ASIA',
    JAPAN: 'ASIA',
    JAPAN_ANTIQUITY: 'ASIA',
    JAPAN_IMPERIAL: 'ASIA',
    CENTRAL_ASIA: 'CEAS', // [2026-09-02] ORIE→CEAS（塞尔柱/花拉子模/帖木儿=中亚鞑靼，与战略对齐）
    CENTRAL_ASIA_IMPERIAL: 'CEAS',
    CENTRAL_ASIA_ANTIQUITY: 'CEAS',
    CENTRAL_ASIA_CASTLE: 'CEAS',
    WEST_ASIA: 'ORIE',
    WEST_ASIA_ANTIQUITY: 'ORIE',
    WEST_ASIA_CASTLE: 'ORIE',
    INDIA: 'INDI',
    INDIA_FEUDAL: 'INDI',
    INDIA_CASTLE: 'INDI',
    INDIA_IMPERIAL: 'INDI',
    BERBER: 'ORIE',    // [2026-08-27] AFRI→ORIE（柏柏尔在北非近东，与战略一致）
    AMERICA: 'MESO',  // [2026-08-24] 美洲石造（阿兹特克/玛雅/印加）
    NORTHAM_IMPERIAL: 'MESO',
    AFRICA: 'AFRI',   // [2026-08-24] 非洲（马里/埃塞）
    AFRICA_IMPERIAL: 'AFRI',
    AFRICA_ANTIQUITY: 'AFRI',
    AFRICA_CASTLE: 'AFRI',
    MALAY: 'SEAS',    // [2026-08-24] 马来东南亚
    SEASIA_ANTIQUITY: 'SEAS',
    SEASIA_IMPERIAL: 'SEAS',
    SEASIA_CASTLE: 'SEAS',
    SEASIA_FEUDAL: 'SEAS',
    ANDE: 'ANDE',     // [2026-08-27] 安第斯石构（印加/马普切/穆伊斯卡）
    SOUTHAM_IMPERIAL: 'ANDE',
    PURU: 'PURU',     // [2026-08-27] 南亚达罗毗荼（朱罗/潘地亚）
    ORIE: 'ORIE',     // [2026-08-27] 阿拉伯（埃及/黎凡特/阿拉伯半岛）
    ORIE_ANTIQUITY: 'ORIE',
    EAST: 'EAST',     // 拜占庭
    GREEK: 'GREEK',   // [2026-09-07] 古典希腊 → DE 的 GREEK 风格集（183 件已补提，不再 404）
    THRACIAN: 'THRACIAN',   // [2026-09-07] 古典色雷斯 → DE 的 THRACIAN 风格集（165 件已补提）
    PERSIAN: 'PERSIAN', // [2026-08-27] 波斯（阿契美尼德/萨珊）
    PERSIAN_CASTLE: 'PERSIAN',
    CUMAN: 'CEAS',      // [2026-08-27] 库曼（钦察/鞑靼草原）
    BRITONS: 'WEST',  // 不列颠[2026-08-28]
    GOTHS: 'WEST',  // 哥特[2026-08-28]
    HUNS: 'CEAS',  // 匈人[2026-08-28]
    TEUTONS: 'WEST',  // 条顿[2026-08-28]
    VIKINGS: 'WEST',  // 维京[2026-08-28]
     // 凯尔特[2026-08-28]
    CELTS_FEUDAL: 'WEST',
    ITALIANS: 'MEDI',  // 意大利[2026-08-28]
    SICILIANS: 'MEDI',  // 西西里[2026-08-28]
    BULGARIANS: 'SLAV',  // 保加利亚[2026-08-28]
    MAGYAR: 'SLAV',  // 马扎尔[2026-08-28]
    LITHUANIANS: 'SLAV',  // 立陶宛[2026-08-28]
    POLES: 'SLAV',  // 波兰[2026-08-28]
    BOHEMIANS: 'SLAV',  // 波希米亚[2026-08-28]
    BURGUNDIANS: 'WEST',  // 勃艮第[2026-08-28]
    SPANISH: 'MEDI',  // 西班牙[2026-08-28]
    PORTUGUESE: 'MEDI',  // 葡萄牙[2026-08-28]
    ETHIOPIANS: 'AFRI',  // 埃塞俄比亚[2026-08-28]
    BENGALIS: 'INDI',  // 孟加拉[2026-08-28]
    BENGALIS_ANTIQUITY: 'INDI',  // 孟加拉[2026-08-28]
    GURJARAS: 'INDI',  // 瞿折罗[2026-08-28]
    VIETNAMESE: 'ASIA',  // 越南[2026-08-28]
    KHMER: 'SEAS',  // 高棉[2026-08-28]
    MAYANS: 'MESO',  // 玛雅[2026-08-28]
    MAPUCHE: 'ANDE',  // 马普切[2026-08-28]
    MUISCA: 'ANDE',  // 穆伊斯卡[2026-08-28]
    TUPI: 'ANDE',  // 图皮[2026-08-28]
    IROQUOIS: 'MESO',   // [2026-09-07] 城堡易洛魁：AMERICA 是文化区名不是风格集名（我建区时写错）
    CHIMU: 'ANDE',  // 城堡奇穆[2026-09-07 新建]
    TARASCAN: 'MESO',   // [2026-09-07] 城堡塔拉斯科：同上，且塔拉斯科本就在中美
    TAIRONA: 'ANDE',   // [2026-09-07] 城堡泰罗纳：MUISCA 是文化区名不是风格集名（我写错）；泰罗纳在安第斯北端
    TEHUELCHE: 'ANDE',   // [2026-09-07] 帝国特维尔切：同上；巴塔哥尼亚归安第斯
    ARMENIANS: 'MEDI',  // 亚美尼亚[2026-08-28]
    GEORGIANS: 'MEDI',  // 格鲁吉亚[2026-08-28]
    BURMESE: 'SEAS',
    EGYPT: 'ORIE',
    CARTHAGE: 'MEDI',
    BABYLON: 'ORIE',
    HITTITES: 'ORIE',
    ASSYRIAN: 'ORIE',
    SCYTHIANS: 'CEAS',
    BYZANTINE: 'MEDI',
    FRANKS: 'WEST',
    SASANIAN: 'PERSIAN',
    TURKS: 'CEAS',
    NANZHAO: 'ASIA',
    SRIVIJAYA: 'SEAS',
    KUSHAN: 'CEAS',
    KUSH: 'AFRI',
    KHITAN: 'ASIA',
    UIGHUR: 'CEAS',
    MOHE: 'ASIA',
    ANGLO_SAXON: 'WEST',
    GHANA: 'AFRI',
    KHAZARS: 'CEAS',
    VANDALS: 'WEST',
    LOMBARDS: 'WEST',
    ROURAN: 'CEAS',
    SOGDIANS: 'CEAS',
    TANGUT: 'ASIA',
    JAVANESE: 'SEAS',
    JURCHEN: 'ASIA',
    SELJUQ: 'CEAS',
    OTTOMAN: 'ORIE',
    OTTOMAN_IMPERIAL: 'ORIE',
    FRENCH: 'WEST',
    MANCHU: 'ASIA',
    MUGHAL: 'INDI',
    SAFAVID: 'PERSIAN',   // [2026-09-07] 帝国波斯：PERS 只有 3 件城堡，是拼写掉字，风格集叫 PERSIAN
    RUSSIAN: 'SLAV',
    SIKH: 'INDI',
    HEBREWS: 'ORIE',
    WUSUN: 'CEAS',
    QIANG: 'ASIA',
    YARLUNG: 'PURU',   // 🔴 [2026-09-11 主人「萨噶是羌，是青藏，是吐蕃，请按历史修复」]
                       //    古典雅隆＝吐蕃发祥地 → 与战略地图、_citytest.html 预览页统一走青藏三层风格的 PURU 底座
                       //    （守城宗堡仍走 castleAssetFor() → TIBET_CASTLE_AGE3）。原写 'ASIA' 与战略表的 'INDI' 打架。
    NABATAEANS: 'ORIE',
    HEPHTHALITES: 'CEAS',
    AINU: 'ASIA',
      // [2026-09-07] 城堡瑞士：EUROPE 不是 DE 风格集
    PASHTUN: 'CENTRAL_ASIA',
    SWEDISH: 'WEST',   // 帝国瑞典：与北欧日耳曼同用 WEST
    MACEDONIAN: 'GREEK',   // 古典马其顿
    HELLENIC: 'GREEK',   // [2026-09-07] 古典希伦（雅典/斯巴达/底比斯）
    IMPERIAL_ROME: 'MEDI',   // [2026-09-07] 古典罗马禁卫 → 罗马是地中海风格，不是希腊
    GREEK_MERCENARY: 'GREEK',   // [2026-09-07] 古典希腊雇佣
    MAGNA_GRAECIA: 'GREEK',   // [2026-09-07] 古典大希腊（南意大利希腊殖民城邦）
    ACHAEMENIDS: 'MIDDLE_EAST',
    AMAZONS: 'GREEK',   // [2026-09-07] 古典亚马逊（忒弥斯基拉在小亚黑海南岸，希腊人笔下的城）
    SONG: 'ASIA',
    GORYEO: 'ASIA',
    JOSEON: 'ASIA',
    GOJOSEON: 'ASIA',
    PRE_QIN: 'ASIA',
    MING: 'ASIA',
    HUAXIA_IMPERIAL: 'ASIA',
    DALI: 'SEAS',
    MAMLUKS: 'ORIE',
    CRUSADERS: 'WEST',
    RUS: 'SLAV',
    KARA_KHITAN: 'CEAS',
    TIMURID: 'CEAS',
    DELHI: 'INDI',
    CASTILE: 'WEST',
    SCOTLAND: 'WEST',
    HRE: 'WEST',
    ALMOHAD: 'ORIE',
    SERBIA: 'SLAV',
    ILKHANATE: 'CEAS',
    ARAGON: 'MEDI',
};


/**
 * 🔴 [2026-08-26 主人「所有高级建筑都安置上了吗」] 势力级建筑风格集（覆盖 REGION_BUILDING_STYLE）。
 *
 *    盘点发现 4 套**全套风格集整套闲置**（各 43~45 件），其中一条还是史实错误：
 *      · ANDE（安第斯）—— 印加/马普切/穆伊斯卡本该用它，却跟着 AMERICA 区用了
 *        **MESO（中美洲）**。安第斯石构与玛雅/阿兹特克金字塔完全两回事，这是错配。
 *      · PERSIAN —— 波斯本该用它，却跟着 WEST_ASIA 区用了 ORIE（通用中东）。
 *      · EAST（东欧/日耳曼东部）—— 从奇观命名 EAST_WONDER_GOTHS/HUNS/TEUTONS/VIKINGS
 *        可确认它是给哥特/匈人/条顿/维京的，这些势力却在用 WEST/CEAS。
 *      · PURU（南亚）—— 见 FACTION_CASTLE 里的更正说明。
 *    风格集是整套的（兵营/房屋/塔/墙/门都换），所以按**势力**挂，别动 REGION_BUILDING_STYLE。
 */
export const FACTION_BUILDING_STYLE: Readonly<Record<string, string>> = {
    // ── 安第斯（ANDE）：与中美洲 MESO 分开 ──
    inca: 'ANDE', mapuche: 'ANDE', muisca: 'ANDE', tupi: 'ANDE',
    // ── 波斯（PERSIAN）：三代波斯 + 埃兰 ──
    aqimeinide: 'PERSIAN', ansxi: 'PERSIAN', sashan: 'PERSIAN', ailan: 'PERSIAN',
    // ── 东欧 / 日耳曼东部：哥特 / 匈人 / 条顿 / 维京（原 EAST 风格已拆）──
    donggete: 'WEST', xigete: 'WEST', xiongren: 'CEAS', xiongnu: 'CEAS',
    tiaodun_qishi: 'WEST', danmai: 'WEST', ruidian_si: 'WEST', ruidian_yota: 'WEST',
    nuosi: 'WEST', weijing_york: 'WEST', luosi: 'SLAV',
    // ── 南亚（PURU）：与 INDI 分开，给南印度/恒河诸国 ──
    zhuluo: 'PURU', pangzha: 'PURU', kongque: 'PURU', mojietuo: 'PURU',
};

/** 攻城战守方（大城）建筑池，与战略大城一致：城镇中心/市场/大学必有，其余 AGE3 随机取 6。 */
export const SIEGE_IMPERIAL_BUILDINGS: Array<[string, string]> = [
    ['TOWN_CENTER', 'AGE4'],
    ['HOUSE', 'AGE3'],
    ['BARRACKS', 'AGE3'],
    ['ARCHERY_RANGE', 'AGE3'],
    ['STABLE', 'AGE3'],
    ['BLACKSMITH', 'AGE3'],
    ['MARKET', 'AGE4'],
    ['MILL', 'AGE3'],
    ['UNIVERSITY', 'AGE4'],
    ['MONASTERY', 'AGE3'],
    ['SIEGE_WORKSHOP', 'AGE3'],
];
/** 攻城战守方（中城）11 种城堡时代建筑，和战略中城一致（去掉箭塔，城墙内侧已有 4 座并列箭塔）：随机取 9 种且不重复。 */
export const SIEGE_MEDIUM_BUILDINGS = ['MILL', 'HOUSE', 'BARRACKS', 'BLACKSMITH', 'ARCHERY_RANGE', 'TOWN_CENTER', 'STABLE', 'MARKET', 'SIEGE_WORKSHOP', 'UNIVERSITY', 'MONASTERY'];

/** 🔴 [2026-09-16 主人定] 二级「蒙古」(buildingStyle === 'MONGOL') 守城方：城池 9 建筑池里随机掺入蒙古包。
 *  用真蒙古包 `YURT_E~L`（旧款 A~D 是茅草屋，2026-08-22 主人定弃用）；目录名直接传 `place()`，
 *  没有「风格前缀」问题。总数仍严格 9（大/中/小城都只从候选里取 9 栋）。 */
export const MONGOL_CITY_YURTS = ['YURT_E', 'YURT_F', 'YURT_G', 'YURT_H', 'YURT_I', 'YURT_J', 'YURT_K', 'YURT_L'];
/** 攻城战守方（小城）9 种封建时代建筑（age2；2026-08-26 主人定「战略战术统一 9 建筑」，08-29 去箭塔补民居：磨坊/民居×2/兵营/铁匠铺/靶场/城镇中心/马厩/市场） */
export const SIEGE_FEUDAL_BUILDINGS = ['MILL', 'HOUSE', 'HOUSE', 'BARRACKS', 'BLACKSMITH', 'ARCHERY_RANGE', 'TOWN_CENTER', 'STABLE', 'MARKET'];
/** ZOOM 13 守方城郭内建筑统一缩放。
 *  🔴🔴 [2026-10-03 主人令「**城墙这个不能动，切记**」] **城墙、城门、墙柱一律保持原尺寸（scale 不设 = 1.0）**：
 *     它们是按固定步距严丝合缝拼接、自带碰撞格的，改缩放会漏缝/错位。**AI 永不许动这一支。**
 *  🔴 [2026-10-03 主人报障「战术模式下，攻击方的箭塔，和防守方的箭塔大小不一样，请按防守方的一致」]
 *     ⇒ **攻方营地里那两座塔状工事（瞭望塔／强化哨站）改用守方箭塔的同一缩放 `SIEGE_CITY_BUILDING_SCALE`**：
 *        守方城墙内侧的 4 座箭塔就是这一档缩放（见 `this.arrowTowers` 建塔处），而它们与守方的强化哨站是**同一族**工事
 *        （城寨守方的 4 座里就有 2 座是 FORTIFIED_OUTPOST）—— 两边同类必须一样大。
 *  🔴 [2026-10-03 主人令「战术模式中，攻击方的建筑请改为80%」]
 *     ⇒ 攻方营地**整座**改 80%：3 营地（CAMP_ARCHERY_RANGE／CAMP_BARRACKS／CAMP_STABLE）、
 *        4 帐篷（GREEK_WAR_TENT）、蒙古包营地的 8 个 YURT_* 也一并按此缩放（改前这些是原尺寸 1.0）。 */
export const SIEGE_CITY_BUILDING_SCALE = 1.0;
/** 险要九建筑中的守城城堡专用缩放。🔴 [2026-10-10 主人令「全部恢复为 DE 原版的 100%（scale = 1.0），让建筑、植被和兵模全部与 DE 绝对一致」] */
export const SIEGE_CASTLE_SCALE = 1.0;
/** 市场单独缩放：🔴 [2026-10-10 主人令「全部恢复为 DE 原版的 100%（scale = 1.0）」] */

/** 按建筑类型取攻城战守城缩放：🔴 [2026-10-10 主人令「全部恢复为 DE 原版的 100%（scale = 1.0）」] 全部 1.0 */
export function siegeBuildingScale(building: string): number {
    return 1.0;
}
/** ZOOM 13 名城世界奇观地标缩放：🔴 [2026-10-10 主人令「全部恢复为 DE 原版的 100%（scale = 1.0）」] */
export const SIEGE_WONDER_SCALE = 1.0;

export const MARCH_FILES_DEFAULT = 10;   // 普通兵种 10 列（每队 50 人 = 10 列 × 5 排，左右长）
export const MARCH_FILES_WAGON = 9;   // 大体型兵种 9 列（左右长）
export function marchFilesOf(key: string): number {
    return popCostOf(key) >= 2 ? MARCH_FILES_WAGON : MARCH_FILES_DEFAULT;
}
/**
 * 槽位间距基准（px）：步兵半径 8、骑兵 10，两两之和 16~20，24 够用。
 * 🔴 [2026-08-19 修] 原先这是**全兵种唯一常量**，注释写着「必须 ≥ 两兵半径之和
 *    （UNIT_RADIUS 最大档 20）」—— 但 20 是**半径本身**，两辆车的半径之和是 40，
 *    规则从来没被满足过。于是双轮远程战车（r=20，全表最大）、高丽/胡斯战车、攻城锤（r=18）
 *    列阵时槽位只隔 24px 而车宽 40px，开局方阵直接叠成一堵墙（主人 2026-08-19 截图实锤）。
 *    现按兵种半径取 max，步骑维持 24 不变（不动已调平的队形），只有大体型单位撑开。
 */
export const MARCH_SP = 24;
/** 列阵纵深方向的槽位间距上限（px），见使用处。 */
export const MARCH_SP_DEPTH_MAX = 48;
/** 🔴 [2026-10-14 主人令「排距、队距改成固定值……不再跟着窗口变」] 三排之间的排距（px）。原为「窗口宽×0.14，夹在 240~280」，取主人窗口下的 280 */
export const ROW_DEPTH = 280;
/** 🔴 [2026-10-14 同上] 同一排相邻两队的队距（px）。原为「窗口高×0.8÷4，夹在 300~320」，取 300 */
export const COL_SPACING = 300;
/** 本兵种的列阵槽位间距：两倍半径 + 4px 余量，下限为 MARCH_SP（同一出兵口恒为同一兵种）。 */
export function marchSpacingOf(key: string): number {
    // 🔴 [2026-10-12 主人选方案 2「大体型兵种在 DE 里本来就是挤着走的，叠一点不难看」]
    //    9 列 × 两倍半径（40~44）宽达 396px，压进隔壁队（出兵口只隔 300）⇒ 大体型列距收到 30（宽约 284），允许互叠
    if (popCostOf(key) >= 2) return 30;
    const r = UNIT_RADIUS[key] ?? 8;
    return Math.max(MARCH_SP, r * 2 + 4);
}

export const UNIT_RADIUS: Record<string, number> = {
    // [2026-09-05 玩家] 玩家（骑马英雄）按骑兵档 10.0，与 knight/paladin 同口径。
    //   漏登记会落到 `SEP_DIST / 2 = 8.5` 的步兵档，质量随之从 1.56 掉到 1.13 —— 被小兵推得更动。
    guanyu: 10.0,
    // ── [2026-08-18 补齐] 新补录兵种：同族继承；无同族者按类别取 DE 档位（步/远 8、骑 10、象与攻城 20） ──
    antiquity_battering_ram: 18.0,
    antiquity_capped_ram: 18.0,
    antiquity_cavalry_archer: 10.0,
    antiquity_heavy_cavalry_archer: 10.0,
    antiquity_heavy_scorpion: 20.0,
    antiquity_light_cavalry: 10.0,
    antiquity_mangonel: 20.0,
    antiquity_onager: 20.0,
    antiquity_scorpion: 20.0,
    antiquity_scout_cavalry: 10.0,
    antiquity_siege_onager: 20.0,
    antiquity_siege_ram: 18.0,
    antiquity_siege_tower: 18.0,
    antiquity_skirmisher: 8.0,
    antiquity_spearman: 8.0,
    bowman: 8.0,
    chakram_thrower: 8.0,
    crusader_knight: 10.0,
    elite_antiquity_skirmisher: 8.0,
    elite_boyar: 10.0,
    elite_chakram_thrower: 8.0,
    elite_champi_warrior: 8.0,
    elite_coustillier: 10.0,
    elite_elephant_archer: 18.0,
    elite_greek_cavalry: 10.0,
    elite_ibirapema_warrior: 8.0,
    elite_iron_pagoda: 10.0,
    elite_kamayuk: 8.0,
    elite_keshik: 10.0,
    elite_peltast: 8.0,
    elite_throwing_axeman: 8.0,
    elite_tiger_cavalry: 10.0,
    elite_war_elephant: 18.0,
    equites: 10.0,
    gastraphetes: 8.0,
    guardsman: 8.0,
    halberdier: 8.0,
    ibirapema_warrior: 8.0,
    imperial_cavalry: 10.0,
    jian_swordman_shielded: 8.0,
    laminated_bowman: 8.0,
    levy: 8.0,
    norse_warrior: 8.0,
    paragon: 8.0,
    raider: 10.0,
    recurve_bowman: 8.0,
    sarmatian: 10.0,
    shock_cavalry: 10.0,
    sosso_guard: 8.0,
    vanguard: 8.0,
    xolotl_warrior: 10.0,
    amazon_archer: 8.0,
    amazon_warrior: 8.0,
    ant_scout: 10.0,
    arambai: 10.0,
    arbalest: 8.0,
    archer: 8.0,
    armored: 8.0,
    armored_elephant: 18.0,
    maceman: 8.0, mounted_crossbowman: 10.0, mounted_crossbowman_heavy: 10.0,
    priestess: 8.0, polemarch: 8.0,
    axe: 8.0,
    bactrian_archer: 8.0,
    ballista: 20.0,
    ballista_elephant: 18.0,
    battering_ram: 18.0,
    battle_elephant: 18.0,
    bayinnaung_elephant: 20.0,
    berserk: 8.0,
    blackwood_archer: 8.0,
    bolas_rider: 10.0,
    bombard_cannon: 20.0,
    boyar: 10.0,
    camel_archer: 10.0,
    camel_heavy: 10.0,
    camel_raider: 10.0,
    camel_rider: 10.0,
    camel_scout: 10.0,
    capped_ram: 18.0,
    cataphract: 10.0,
    cav_archer: 10.0,
    cav_archer_heavy: 10.0,
    cavalier: 10.0,
    centurion: 10.0,
    champi_runner: 8.0,
    champi_scout: 8.0,
    champi_warrior: 8.0,
    champion: 8.0,
    chukonu: 8.0,
    companion_cavalry: 10.0,
    elite_companion_cavalry: 10.0,
    composite_bowman: 8.0,
    condottiero: 8.0,
    conquistador: 10.0,
    coustillier: 10.0,
    cretan_archer: 8.0,
    crossbow: 8.0,
    crossbowman: 8.0,
    dagnajan_elephant: 20.0,
    eagle_scout: 8.0,
    eagle_warrior: 8.0,
    eastern_swordsman: 8.0,
    ekdromos: 8.0,
    elephant: 18.0,
    elephant_archer: 18.0,
    elite_arambai: 10.0,
    elite_armored_elephant: 18.0,
    elite_ballista_elephant: 18.0,
    elite_battle_elephant: 18.0,
    elite_berserk: 8.0,
    elite_blackwood_archer: 8.0,
    elite_bolas_rider: 10.0,
    elite_camel_archer: 10.0,
    elite_cataphract: 10.0,
    elite_centurion: 10.0,
    elite_chukonu: 8.0,
    elite_composite_bowman: 8.0,
    elite_conquistador: 10.0,
    elite_eagle_warrior: 8.0,
    elite_fire_archer: 8.0,
    elite_fire_lancer: 8.0,
    elite_gbeto: 8.0,
    elite_genitour: 10.0,
    elite_genoese_crossbowman: 8.0,
    elite_ghulam: 8.0,
    elite_guardsman: 8.0,
    elite_guecha_warrior: 8.0,
    elite_huskarl: 8.0,
    hearth_troop: 8.0,
    elite_hearth_troop: 8.0,
    jomsviking: 8.0,
    elite_jomsviking: 8.0,
    varangian_guard: 8.0,
    elite_varangian_guard: 8.0,
    elite_hussite_wagon: 18.0,
    elite_jaguar_warrior: 8.0,
    elite_janissary: 8.0,
    elite_kipchak: 10.0,
    elite_kona: 10.0,
    elite_konnik: 10.0,
    elite_konnik_foot: 8.0,
    elite_leitis: 10.0,
    elite_liao_dao: 8.0,
    elite_magyar_huszar: 10.0,
    elite_mameluke: 10.0,
    elite_monaspa: 10.0,
    elite_obuch: 8.0,
    elite_organ_gun: 16.0,
    elite_plumed_archer: 8.0,
    elite_ratha_melee: 10.0,
    elite_ratha_ranged: 10.0,
    elite_scythian_horse_archer: 10.0,
    elite_serjeant: 8.0,
    elite_shotel_warrior: 8.0,
    elite_shrivamsha_rider: 10.0,
    elite_skirmisher: 8.0,
    elite_steppe_lancer: 10.0,
    elite_tarkan: 10.0,
    elite_temple_guard: 8.0,
    elite_teutonic_knight: 8.0,
    elite_urumi_swordsman: 8.0,
    elite_war_chariot: 10.0,
    elite_war_dog: 8.0,
    elite_war_wagon: 18.0,
    elite_white_feather_guard: 8.0,
    elite_woad_raider: 8.0,
    fire_archer: 8.0,
    fire_lancer: 8.0,
    flamethrower: 16.0,
    flaming_camel: 10.0,
    flemish_pikeman: 8.0,
    flemish_pikeman_f: 8.0,
    gbeto: 8.0,
    general_cavalry: 10.0,
    genitour: 10.0,
    genoese_crossbowman: 8.0,
    ghulam: 8.0,
    greek_noble_cavalry: 10.0,
    grenadier: 8.0,
    guecha_warrior: 8.0,
    hand_cannoneer: 8.0,
    heavy_cavalry: 10.0,
    heavy_infantry: 8.0,
    heavy_pikeman: 8.0,
    heavy_rocket_cart: 20.0,
    heavy_scorpion: 20.0,
    hei_kuang: 10.0,
    hei_kuang_heavy: 10.0,
    helepolis: 18.0,
    hill_tribesman: 8.0,
    hippeus: 8.0,
    elite_hippeus: 8.0,
    hoplite: 8.0,
    elite_hoplite: 8.0,
    horse_archer: 10.0,
    houfnice: 20.0,
    huskarl: 8.0,
    hussar: 10.0,
    hussite_wagon: 18.0,
    immortal: 8.0,
    elite_immortal: 8.0,
    immortal_ranged: 8.0,
    elite_immortal_ranged: 8.0,
    imperial_camel_rider: 10.0,
    imperial_centurion: 10.0,
    imperial_skirmisher: 8.0,
    indian_tribesman: 8.0,
    iron_pagoda: 10.0,
    iroquois_warrior: 8.0,
    jaguar_warrior: 8.0,
    janissary: 8.0,
    jian_swordman_unshielded: 8.0,
    jian_swordsman: 8.0,
    kamayuk: 8.0,
    karambit_warrior: 6.0,
    karambit_warrior_elite: 6.0,
    keshik: 10.0,
    kipchak: 10.0,
    knight: 10.0,
    kona: 10.0,
    konnik: 10.0,
    konnik_foot: 8.0,
    lancer: 10.0,
    legionary: 8.0,
    leitis: 10.0,
    liao_dao: 8.0,
    light_infantry: 8.0,
    light_riders: 10.0,
    longbowman: 8.0,
    longbowman_elite: 8.0,
    longswordsman: 8.0,
    magyar_huszar: 10.0,
    mameluke: 10.0,
    mangonel: 20.0,
    mangudai: 10.0,
    mangudai_elite: 10.0,
    mercenary_hoplite: 8.0,
    militia: 8.0,
    monaspa: 10.0,
    mounted_trebuchet: 20.0,
    ninja: 8.0,
    obuch: 8.0,
    onager: 20.0,
    organ_gun: 16.0,
    paladin: 10.0,
    pattiyoda_longbowman: 8.0,
    elite_pattiyoda_longbowman: 8.0,
    petard: 8.0,
    phalangite: 9.0,
    elite_phalangite: 9.0,
    pikeman: 8.0,
    plumed_archer: 8.0,
    porus_elephant: 20.0,
    qizilbash_warrior: 10.0,
    ratha_melee: 18.0,
    ratha_ranged: 18.0,
    rattan_archer: 8.0,
    rattan_archer_elite: 8.0,
    rhodian_slinger: 8.0,
    rhomphaia_warrior: 8.0,
    elite_rhomphaia_warrior: 8.0,
    rocket_cart: 20.0,
    royal_janissary: 8.0,
    sacred_band: 8.0,
    samurai: 8.0,
    samurai_elite: 8.0,
    sannahya: 18.0,
    elite_sannahya: 18.0,
    savar: 10.0,
    scorpion: 20.0,
    siege_ballista: 20.0,
    scythian_axe_cavalry: 10.0,
    scythian_horse_archer: 10.0,
    serjeant: 8.0,
    shield: 8.0,
    shotel_warrior: 8.0,
    shrivamsha_rider: 10.0,
    sickle_warrior: 8.0,
    siege_onager: 20.0,
    siege_ram: 18.0,
    siege_tower: 18.0,
    skirmisher: 8.0,
    slinger: 8.0,
    sogdian_cataphract: 10.0,
    sparabara: 8.0,
    spear: 8.0,
    spearman: 8.0,
    steppe_lancer: 10.0,
    strategos: 8.0,
    elite_strategos: 8.0,
    swordsman: 8.0,
    sakan_axeman: 8.0,
    tarantine_cavalry: 10.0,
    varangian_jarl: 10.0,
    elite_varangian_jarl: 10.0,
    tarkan: 10.0,
    temple_guard: 8.0,
    teutonic_knight: 8.0,
    thracian_peltast: 8.0,
    throwing_axeman: 8.0,
    tiger_rider: 10.0,
    traction_trebuchet: 20.0,
    two_handed_swordsman: 8.0,
    urumi_swordsman: 8.0,
    war_chariot: 18.0,
    war_chariot_ranged: 20.0,
    war_dog: 8.0,
    war_elephant: 18.0,
    war_wagon: 18.0,
    warrior_priest: 8.0,
    white_feather_guard: 8.0,
    winged_hussar: 10.0,
    woad_raider: 8.0,
    xianbei_raider: 10.0,
};

/**
 * 推挤力的低通平滑系数（0~1，每帧向目标推力靠拢的比例）——治「站着不动的兵还在轻微哆嗦」。
 *
 * 病因：挤成一坨时，每个兵的邻居集合每帧都在变，合力方向随之翻来覆去，
 * 于是人在原地高频振动（实测稳态每帧抖 1.22px，60 帧走了 75px 的步子净位移却只有 6px）。
 * 光按重叠深度缩放推力（2026-08-17 早先那次）只压住了幅度，方向照样翻。
 *
 * 给推力加惯性后方向不再突变（实测每帧抖动 1.22 → 0.25px，−80%），
 * **而且人群反而散得更开**（平均最近邻距 6.9 → 9.9px）：推力方向能连贯持续，
 * 兵是真被推开，而不是在原地左右互搏。
 * ⚠️ 试过「重叠很浅就不推」的死区方案，实测无效（抖动不降、间距还更挤），别再试。
 */

export const LOOP_WINDOW_MOVE_SEC = 1.0;
export const LOOP_WINDOW_IDLE_SEC = 1.5;
export function loopRate(b: WarBank, set: string): number {
    const dur = b.dur?.[set];
    if (!dur || dur <= 0) return 1;
    if (set === 'move') return LOOP_WINDOW_MOVE_SEC / dur;
    if (set === 'idle') return LOOP_WINDOW_IDLE_SEC / dur;
    return 1;
}
