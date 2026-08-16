/**
 * Scene13WarLayer — 13 战斗模式 v2：出兵口互攻演出（2026-08-11 主人定稿）
 *
 * 从 public/__war.html 原型移植进主游戏，三条主人决策（2026-08-11）：
 *   1. 13 = 双将战专属，胜负只看本演出（出兵口互攻、全军覆没判负），不看八环
 *   2. ZOOM10 及以下照旧，一根毛不动（本类只在 isBattleScene13 时激活）
 *   3. 出兵口 UI 不渲染，只画精灵（出兵口只是「兵从哪里出来」的位置，不是攻击目标）
 *   4. 2026-08-11 主人再定：**中军特权取消**，所有兵一同行动，目标只有一个——杀光对方有生力量。
 *      随之删除：中军待命/转正、护卫圈、限流 30、打口伤害、口对口配对。规则少一半。
 *
 * 与原型的三处主游戏化：
 *   - 出兵口 = 大地图编制槽位（CultureFormations.getCultureTier(...).slots 派生），不手抄
 *   - 素材 = SPRITE_PATHS.UNIT_ASSETS 的 8 向帧 URL（与 __war.html 帧号体系一致）
 *   - 胜负 = 演出判负 → onDecision 回调（GameAppCombatHooks 写回 presetResult + forceResolve）
 *
 * 渲染：全屏透明 canvas 叠在地图上，只画精灵/尸体；出兵口不画。
 */

import { getCultureTier, inferFormationModeFromSlots, type FormationMode } from '../types/CultureFormations';
import { expandCompositionSlots } from '../types/LegionComposition';
import { SPRITE_PATHS } from '../config/UnitAssets';
import { SpriteTinter } from '../systems/tinting/SpriteTinter';
import { LegionFlagDrawer } from '../map/legion/LegionFlagDrawer';
import { gameLog } from '../utils/GameLogger';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';

// ── 帧族（与 __war.html / docs/03-runtime/s10db-frame-layout.md 一致）──
// 远程/弓骑的「第 2 组 = 近战抡砸、第 5 组 = 射击」，UNIT_ASSETS 已按组拆分：
//   ATTACK = 近战（+8）  SHOOT = 射击（+40）  —— 直接取数组，不再手算偏移。
const RANGED_TYPES = new Set(['archer', 'crossbow', 'ballista', 'horse_archer', 'fire_archer', 'kipchak', 'longbowman_elite', 'cav_archer', 'cav_archer_heavy', 'chukonu', 'rattan_archer', 'elite_fire_archer', 'elite_chukonu', 'imperial_skirmisher', 'elite_composite_bowman', 'composite_bowman', 'crossbowman', 'arbalest', 'throwing_axeman', 'arambai', 'mangudai', 'mangudai_elite', 'elite_kipchak', 'pattiyoda_longbowman', 'ballista_elephant', 'elephant_archer', 'rattan_archer_elite', 'amazon_archer', 'bactrian_archer', 'blackwood_archer', 'bolas_rider', 'bombard_cannon', 'camel_archer', 'chakram_thrower', 'conquistador', 'cretan_archer', 'elite_arambai', 'elite_ballista_elephant', 'elite_blackwood_archer', 'elite_bolas_rider', 'elite_camel_archer', 'elite_chakram_thrower', 'elite_conquistador', 'elite_elephant_archer', 'elite_gbeto', 'elite_genitour', 'elite_genoese_crossbowman', 'elite_guecha_warrior', 'elite_hussite_wagon', 'elite_janissary', 'elite_mameluke', 'elite_organ_gun', 'elite_plumed_archer', 'elite_ratha_ranged', 'elite_scythian_horse_archer', 'elite_skirmisher', 'elite_throwing_axeman', 'elite_war_wagon', 'gbeto', 'genitour', 'genoese_crossbowman', 'grenadier', 'guecha_warrior', 'hand_cannoneer', 'heavy_rocket_cart', 'heavy_scorpion', 'houfnice', 'hussite_wagon', 'immortal_ranged', 'janissary', 'longbowman', 'mameluke', 'mangonel', 'mounted_trebuchet', 'onager', 'organ_gun', 'plumed_archer', 'ratha_ranged', 'rhodian_slinger', 'rocket_cart', 'royal_janissary', 'scorpion', 'scythian_horse_archer', 'siege_onager', 'skirmisher', 'slinger', 'tarantine_cavalry', 'thracian_peltast', 'traction_trebuchet', 'war_chariot_ranged', 'war_wagon']);

/** 🔴 上策（2026-08-16 主人定）：抠绿 + Base64 结果跨战斗缓存。
 *  抠绿（getImageData 逐像素去绿幕）+ toDataURL（PNG 编码）是素材处理最耗时的一步，
 *  且只去绿幕、与势力色无关 → 跨战斗、跨势力都能复用。第二次打同样素材跳过抠绿/编码，
 *  只重做染色（势力色每局随机，走 SpriteTinter 现链路）。key = 源图 URL，value = 抠绿后 data URL。
 */
const DECROMA_CACHE = new Map<string, string>();

// ── 兵种属性 ──
//   全面套用 AoE2 DE 真实数据（2026-08-16 主人定）：五维 = 血 hp / 攻 atk / 防(近防+远防) / 射程 rng / 射速 reload。
//   数值来自本机 empires2_x2_p1.dat（genieutils 实测抽取，非精锐基础档）。
//   相克废弃旧 C=1.8 全局系数，改用 DE 加成伤害（bonus）+ 近/远防减法自然涌现。
//   移速 spd 保留原值（「五维」不含移速）。
interface WarType {
    name: string;
    /** 近战 / 骑兵 / 远程（决定移动速度组、风筝等行为；伤害类型看 dmgType） */
    cls: 'melee' | 'cav' | 'ranged';
    /** 尺寸倍率（象兵大、骑兵略大） */
    sz: number;
    /** 范围伤（象兵） */
    aoe?: boolean;
    /** 放风筝距离（弓骑） */
    kite?: number;
    /** 血（DE hit_points） */
    hp: number;
    /** 攻（DE displayed_attack，基础攻击） */
    atk: number;
    /** 近防（DE melee armor） */
    meleeArmor: number;
    /** 远防（DE pierce armor） */
    pierceArmor: number;
    /** 射程（px = DE max_range × 40；0 = 贴身白刃） */
    rng: number;
    /** 装填时间（秒，DE reload_time，即射速） */
    reload: number;
    /** 伤害类型（DE attack class：3=pierce / 4=melee） */
    dmgType: 'melee' | 'pierce';
    /** 移动速度（px/秒，保留原值） */
    spd: number;
    /** 加成伤害（DE attacks 非 3/4 类）：护甲类 → 额外攻击 */
    bonus?: Record<number, number>;
    /** 自身护甲类（DE armors 非 3/4 类，供被加成伤害命中判定） */
    armorTags?: number[];
}

// ── 兵种属性（2026-08-16 全面套用 AoE2 DE 真实数据）──
// 五维 = 血 hp / 攻 atk / 防（meleeArmor 近防 + pierceArmor 远防）/ 射程 rng / 射速 reload。
// 数值一律来自本机 empires2_x2_p1.dat（genieutils 实测抽取），非精锐基础档。
// 相克不再用全局 C=1.8：改用 DE 加成伤害（bonus：护甲类 → 额外攻击）+ 近/远防减法。
// 移速 spd 保留原值（「五维」不含移速，主人未要求动，后续按需调）。
// rng = DE max_range × 40（px）；0 = 贴身白刃。
const WAR_TYPES: Record<string, WarType> = {
    light_infantry: { name: '轻步兵', cls: 'melee', sz: 1, hp: 40, atk: 4, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', armorTags: [1, 31] },
    heavy_infantry: { name: '重步兵', cls: 'melee', sz: 1, hp: 75, atk: 7, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 52, dmgType: 'melee', armorTags: [1, 31] },
    shield: { name: '近卫兵', cls: 'melee', sz: 1, hp: 70, atk: 14, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 47, dmgType: 'melee', bonus: { 21: 4, 29: 8 }, armorTags: [1, 31] },
    spear: { name: '青州兵', cls: 'melee', sz: 1, hp: 55, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 52, dmgType: 'melee', bonus: { 5: 25, 8: 22, 16: 16, 21: 1, 29: 1, 30: 18, 35: 7 }, armorTags: [27, 1, 31] },
    axe: { name: '蛮族兵', cls: 'melee', sz: 1, hp: 54, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    armored: { name: '藤甲兵', cls: 'melee', sz: 1, hp: 60, atk: 9, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 3, 29: 6 }, armorTags: [1, 31] },
    samurai: { name: '日本武士', cls: 'melee', sz: 1, hp: 70, atk: 10, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 1.9, spd: 50, dmgType: 'melee', bonus: { 19: 10, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    samurai_elite: { name: '精锐武士', cls: 'melee', sz: 1, hp: 80, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 1.9, spd: 50, dmgType: 'melee', bonus: { 19: 12, 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    elephant: { name: '象兵', cls: 'melee', sz: 1.6, aoe: true, hp: 450, atk: 15, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 30, 13: 30 }, armorTags: [5, 8, 19, 31] },
    eastern_swordsman: { name: '东方剑士', cls: 'melee', sz: 1, hp: 60, atk: 9, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 29: 6 }, armorTags: [1, 31] },
    hei_kuang: { name: '黑光铠骑兵', cls: 'cav', sz: 1, hp: 60, atk: 11, meleeArmor: 4, pierceArmor: 3, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    fire_archer: { name: '火焰弓箭手', cls: 'ranged', sz: 1, hp: 35, atk: 5, meleeArmor: 0, pierceArmor: 0, rng: 360, reload: 3.5, spd: 50, dmgType: 'pierce', bonus: { 16: 3, 20: 1, 21: 4, 27: 2 }, armorTags: [15, 19, 31] },
    iron_pagoda: { name: '铁浮图', cls: 'cav', sz: 1, hp: 115, atk: 12, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.15, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    kipchak: { name: '钦察', cls: 'cav', sz: 1, kite: 60, hp: 40, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.2, spd: 130, dmgType: 'pierce', bonus: { 27: 1 }, armorTags: [28, 15, 8, 19, 31] },
    longbowman_elite: { name: '精锐长弓兵', cls: 'ranged', sz: 1, hp: 40, atk: 7, meleeArmor: 0, pierceArmor: 1, rng: 240, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    pikeman: { name: '长枪兵', cls: 'melee', sz: 1, hp: 55, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 55, dmgType: 'melee', bonus: { 5: 25, 8: 22, 16: 16, 21: 1, 29: 1, 30: 18, 35: 7 }, armorTags: [27, 1, 31] },
    cav_archer: { name: '骑射手', cls: 'cav', sz: 1, kite: 60, hp: 50, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [28, 15, 8, 31] },
    light_riders: { name: '轻骑兵', cls: 'cav', sz: 1, hp: 60, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 25: 10 }, armorTags: [8, 31] },
    chukonu: { name: '诸葛弩', cls: 'ranged', sz: 1, hp: 45, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    white_feather_guard: { name: '白毦兵', cls: 'melee', sz: 1, hp: 95, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 8, 8: 8, 21: 2, 29: 4, 30: 6 }, armorTags: [1, 19, 31] },
    elite_white_feather_guard: { name: '精锐白毦兵', cls: 'melee', sz: 1, hp: 100, atk: 8, meleeArmor: 0, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 8, 8: 8, 21: 2, 29: 4, 30: 7 }, armorTags: [1, 19, 31] },
    rattan_archer: { name: '藤弓兵', cls: 'ranged', sz: 1, hp: 40, atk: 6, meleeArmor: 0, pierceArmor: 4, rng: 160, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    elite_fire_lancer: { name: '精锐火矛手', cls: 'melee', sz: 1, hp: 85, atk: 10, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 15, 8: 15, 16: 12, 21: 1, 30: 12 }, armorTags: [29, 1, 31, 23] },
    elite_fire_archer: { name: '精锐火焰弓箭手', cls: 'ranged', sz: 1, hp: 40, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 400, reload: 3.5, spd: 50, dmgType: 'pierce', bonus: { 16: 4, 20: 1, 21: 4, 27: 2 }, armorTags: [15, 19, 31] },
    elite_chukonu: { name: '精锐诸葛弩', cls: 'ranged', sz: 1, hp: 50, atk: 10, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    tarkan: { name: '答剌罕骑兵', cls: 'cav', sz: 1, hp: 100, atk: 8, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 11: 8, 13: 12, 22: 8, 26: 10 }, armorTags: [8, 19, 31] },
    elite_tarkan: { name: '精锐答剌罕骑兵', cls: 'cav', sz: 1, hp: 150, atk: 11, meleeArmor: 1, pierceArmor: 4, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 11: 10, 13: 12, 22: 10, 26: 10 }, armorTags: [8, 19, 31] },
    elite_guardsman: { name: '精锐近卫军', cls: 'melee', sz: 1, hp: 60, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 55, dmgType: 'melee', bonus: { 5: 28, 8: 32, 16: 17, 21: 1, 29: 1, 30: 26, 35: 7 }, armorTags: [27, 1, 31] },
    steppe_lancer: { name: '草原枪兵', cls: 'cav', sz: 1, hp: 60, atk: 9, meleeArmor: 0, pierceArmor: 1, rng: 40, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    ninja: { name: '忍者', cls: 'melee', sz: 1, hp: 50, atk: 9, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 1.8, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2, 36: 9 }, armorTags: [1, 31] },
    liao_dao: { name: '辽刀', cls: 'melee', sz: 1, hp: 75, atk: 9, meleeArmor: 3, pierceArmor: 1, rng: 0, reload: 2.4, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    elite_liao_dao: { name: '精锐辽刀', cls: 'melee', sz: 1, hp: 85, atk: 13, meleeArmor: 3, pierceArmor: 1, rng: 0, reload: 2.4, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    fire_lancer: { name: '火矛兵', cls: 'melee', sz: 1, hp: 65, atk: 9, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 5, 8: 5, 16: 4, 21: 1, 30: 4 }, armorTags: [29, 1, 31, 23] },
    swordsman: { name: '剑士', cls: 'melee', sz: 1, hp: 45, atk: 6, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 31] },
    kamayuk: { name: '印加枪兵长', cls: 'melee', sz: 1, hp: 70, atk: 7, meleeArmor: 1, pierceArmor: 0, rng: 40, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 20, 8: 8, 30: 6 }, armorTags: [1, 19, 31] },
    xianbei_raider: { name: '鲜卑掠骑兵', cls: 'cav', sz: 1, hp: 30, atk: 5, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 1.8, spd: 130, dmgType: 'pierce', bonus: { 1: 1, 27: 3 }, armorTags: [28, 15, 8, 19, 31] },
    tiger_rider: { name: '虎豹骑', cls: 'cav', sz: 1, hp: 110, atk: 11, meleeArmor: 0, pierceArmor: 4, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 15: 6 }, armorTags: [8, 19, 31] },
    jian_swordsman: { name: '刀剑手', cls: 'melee', sz: 1, hp: 70, atk: 8, meleeArmor: 0, pierceArmor: 5, rng: 0, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 15: 4, 21: 2 }, armorTags: [1, 31, 29, 19] },
    imperial_skirmisher: { name: '帝王掷矛手', cls: 'ranged', sz: 1, hp: 35, atk: 4, meleeArmor: 0, pierceArmor: 5, rng: 200, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 5, 27: 4, 28: 3, 35: 3 }, armorTags: [15, 31, 38] },
    war_elephant: { name: '象兵', cls: 'melee', sz: 1, aoe: true, hp: 450, atk: 15, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 30, 13: 30 }, armorTags: [5, 8, 19, 31] },
    karambit_warrior: { name: '爪刀勇士', cls: 'melee', sz: 1, hp: 30, atk: 7, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 29: 2 }, armorTags: [1, 19, 31] },
    karambit_warrior_elite: { name: '精锐爪刀勇士', cls: 'melee', sz: 1, hp: 40, atk: 8, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31] },
    arambai: { name: '飞镖骑兵', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 12, meleeArmor: 0, pierceArmor: 1, rng: 200, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 17: 2 }, armorTags: [19, 28, 15, 8, 31] },
    mangudai: { name: '蒙古突骑', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.1, spd: 130, dmgType: 'pierce', bonus: { 20: 3, 27: 1 }, armorTags: [28, 15, 8, 19, 31] },
    keshik: { name: '怯薛军', cls: 'cav', sz: 1, hp: 120, atk: 9, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    boyar: { name: '贵族铁骑', cls: 'cav', sz: 1, hp: 100, atk: 12, meleeArmor: 4, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    savar: { name: '萨瓦尔', cls: 'cav', sz: 1, hp: 145, atk: 14, meleeArmor: 3, pierceArmor: 4, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', bonus: { 15: 2 }, armorTags: [8, 31] },
    elite_kipchak: { name: '精锐钦察', cls: 'cav', sz: 1, kite: 60, hp: 45, atk: 5, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.2, spd: 130, dmgType: 'pierce', bonus: { 27: 1 }, armorTags: [28, 15, 8, 19, 31] },
    elite_composite_bowman: { name: '精锐复合弓箭手', cls: 'ranged', sz: 1, hp: 50, atk: 4, meleeArmor: 2, pierceArmor: 0, rng: 160, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    camel_heavy: { name: '重装骆驼兵', cls: 'cav', sz: 1, hp: 120, atk: 7, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 18, 16: 9, 30: 9, 35: 7 }, armorTags: [30, 31, 39] },
    cav_archer_heavy: { name: '重装骑射手', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 7, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 4 }, armorTags: [28, 15, 8, 31] },
    composite_bowman: { name: '复合弓箭手', cls: 'ranged', sz: 1, hp: 40, atk: 4, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    elite_steppe_lancer: { name: '精锐草原枪兵', cls: 'cav', sz: 1, hp: 80, atk: 11, meleeArmor: 0, pierceArmor: 2, rng: 40, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    throwing_axeman: { name: '掷斧兵', cls: 'ranged', sz: 1, hp: 60, atk: 7, meleeArmor: 0, pierceArmor: 0, rng: 120, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 1, 29: 1 }, armorTags: [1, 19, 31] },
    champion: { name: '冠军剑士', cls: 'melee', sz: 1, hp: 70, atk: 14, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 8 }, armorTags: [1, 31] },
    crossbowman: { name: '弩手', cls: 'ranged', sz: 1, hp: 35, atk: 5, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3 }, armorTags: [15, 31] },
    paladin: { name: '游侠', cls: 'cav', sz: 1, hp: 160, atk: 14, meleeArmor: 2, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    coustillier: { name: '马上轻装兵', cls: 'cav', sz: 1, hp: 115, atk: 8, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    heavy_pikeman: { name: '重装长枪兵', cls: 'melee', sz: 1, hp: 75, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 55, dmgType: 'melee', bonus: { 5: 25, 8: 22, 16: 16, 21: 1, 29: 1, 30: 18, 35: 7 }, armorTags: [27, 1, 31] },
    arbalest: { name: '劲弩手', cls: 'ranged', sz: 1, hp: 40, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3 }, armorTags: [15, 31] },
    hei_kuang_heavy: { name: '精锐黑光铠骑兵', cls: 'cav', sz: 1, hp: 90, atk: 12, meleeArmor: 4, pierceArmor: 3, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', bonus: { 1: 1 }, armorTags: [8, 31] },
    mangudai_elite: { name: '精锐蒙古突骑', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 8, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.1, spd: 130, dmgType: 'pierce', bonus: { 20: 5, 27: 1 }, armorTags: [28, 15, 8, 19, 31] },
    pattiyoda_longbowman: { name: '帕提尤达长弓手', cls: 'ranged', sz: 1, hp: 50, atk: 7, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.2, spd: 50, dmgType: 'pierce', bonus: { 5: 4, 27: 2 }, armorTags: [15, 19, 31] },
    armored_elephant: { name: '皮甲战象', cls: 'melee', sz: 1, aoe: true, hp: 250, atk: 12, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 4, 13: 4 }, armorTags: [5, 8, 31] },
    ballista_elephant: { name: '重弩战象', cls: 'ranged', sz: 1, hp: 250, atk: 9, meleeArmor: 0, pierceArmor: 3, rng: 200, reload: 2.5, spd: 40, dmgType: 'pierce', bonus: { 11: 2, 13: 3, 16: 8, 18: 100, 21: 3 }, armorTags: [8, 19, 5, 20, 31, 37] },
    elephant_archer: { name: '骑象射手', cls: 'ranged', sz: 1, hp: 230, atk: 6, meleeArmor: 0, pierceArmor: 2, rng: 160, reload: 2.0, spd: 40, dmgType: 'pierce', armorTags: [15, 8, 5, 28, 31] },
    rattan_archer_elite: { name: '精锐藤弓兵', cls: 'ranged', sz: 1, hp: 45, atk: 7, meleeArmor: 0, pierceArmor: 6, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    legionary: { name: '罗马军', cls: 'melee', sz: 1, hp: 75, atk: 12, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 31] },
    lancer: { name: '轻骑兵', cls: 'cav', sz: 1.15, hp: 60, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 25: 10 }, armorTags: [8, 31] },
    heavy_cavalry: { name: '重骑兵', cls: 'cav', sz: 1.15, hp: 100, atk: 10, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    general_cavalry: { name: '虎豹骑', cls: 'cav', sz: 1.15, hp: 110, atk: 11, meleeArmor: 0, pierceArmor: 4, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 15: 6 }, armorTags: [8, 19, 31] },
    horse_archer: { name: '突骑兵', cls: 'cav', sz: 1.15, kite: 60, hp: 50, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [28, 15, 8, 31] },
    archer: { name: '弓兵', cls: 'ranged', sz: 1, hp: 30, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3 }, armorTags: [15, 31] },
    crossbow: { name: '弩兵', cls: 'ranged', sz: 1, hp: 35, atk: 5, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3 }, armorTags: [15, 31] },
    ballista: { name: '元戎弩', cls: 'ranged', sz: 1, hp: 40, atk: 11, meleeArmor: 0, pierceArmor: 7, rng: 280, reload: 3.6, spd: 35, dmgType: 'pierce', bonus: { 1: 1, 5: 7, 11: 3, 17: 1 }, armorTags: [20, 31] },
    amazon_archer: { name: '亚马逊弓手', cls: 'ranged', sz: 1, hp: 45, atk: 5, meleeArmor: 0, pierceArmor: 1, rng: 160, reload: 1.9, spd: 50, dmgType: 'pierce', bonus: { 1: 1, 27: 2 }, armorTags: [15, 31] },
    amazon_warrior: { name: '亚马逊战士', cls: 'melee', sz: 1, hp: 45, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 31] },
    bactrian_archer: { name: '巴克特里亚弓手', cls: 'ranged', sz: 1, hp: 60, atk: 6, meleeArmor: 3, pierceArmor: 1, rng: 200, reload: 1.8, spd: 50, dmgType: 'pierce', bonus: { 8: 5, 27: 2 }, armorTags: [15, 31] },
    battering_ram: { name: '攻城槌', cls: 'melee', sz: 1, hp: 175, atk: 2, meleeArmor: -3, pierceArmor: 180, rng: 0, reload: 5.0, spd: 55, dmgType: 'melee', bonus: { 11: 150, 20: 40 }, armorTags: [17, 20, 31] },
    berserk: { name: '狂战士', cls: 'melee', sz: 1, hp: 54, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    blackwood_archer: { name: '黑木弓手', cls: 'ranged', sz: 1, hp: 20, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 1.5, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    bolas_rider: { name: '流星锤骑手', cls: 'cav', sz: 1, kite: 60, hp: 55, atk: 5, meleeArmor: 0, pierceArmor: 1, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 8: 2, 17: 2, 30: 2 }, armorTags: [19, 28, 15, 8, 31] },
    bombard_cannon: { name: '火炮', cls: 'ranged', aoe: true, sz: 1, hp: 80, atk: 40, meleeArmor: 2, pierceArmor: 5, rng: 480, reload: 6.5, spd: 50, dmgType: 'melee', bonus: { 11: 200, 13: 40, 16: 40, 20: 20, 37: 40 }, armorTags: [20, 23, 31] },
    camel_archer: { name: '骆驼弓骑兵', cls: 'cav', sz: 1, kite: 60, hp: 55, atk: 7, meleeArmor: 0, pierceArmor: 1, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 28: 4 }, armorTags: [19, 28, 30, 15, 31, 39] },
    camel_raider: { name: '骆驼突袭者', cls: 'cav', sz: 1, hp: 90, atk: 10, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 18, 16: 9, 30: 9, 35: 7 }, armorTags: [30, 31, 39] },
    camel_rider: { name: '骆驼兵', cls: 'cav', sz: 1, hp: 100, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 9, 16: 5, 30: 5 }, armorTags: [30, 31, 39] },
    camel_scout: { name: '骆驼斥候', cls: 'cav', sz: 1, hp: 70, atk: 2, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [30, 31, 39] },
    capped_ram: { name: '覆甲攻城槌', cls: 'melee', sz: 1, hp: 200, atk: 3, meleeArmor: -2, pierceArmor: 190, rng: 0, reload: 5.0, spd: 55, dmgType: 'melee', bonus: { 11: 160, 20: 50 }, armorTags: [17, 20, 31] },
    cataphract: { name: '甲胄骑兵', cls: 'cav', sz: 1, hp: 110, atk: 9, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', bonus: { 1: 9 }, armorTags: [8, 19, 31] },
    centurion: { name: '百夫长', cls: 'cav', sz: 1, hp: 110, atk: 13, meleeArmor: 2, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    chakram_thrower: { name: '查克拉掷环兵', cls: 'ranged', sz: 1, hp: 40, atk: 3, meleeArmor: 1, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 1, 29: 1 }, armorTags: [1, 19, 31] },
    champion_runner: { name: '冠军剑士', cls: 'melee', sz: 1, hp: 40, atk: 5, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 20: 2, 29: 1 }, armorTags: [1, 31] },
    champion_scout: { name: '冠军剑士', cls: 'melee', sz: 1, hp: 35, atk: 3, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 8: 1, 20: 2, 29: 3, 30: 1 }, armorTags: [1, 31] },
    companion_cavalry: { name: '伙伴骑兵', cls: 'cav', sz: 1, hp: 90, atk: 11, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 19: 5 }, armorTags: [8, 31, 19] },
    condottiero: { name: '雇佣军', cls: 'melee', sz: 1, hp: 80, atk: 10, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 1.9, spd: 55, dmgType: 'melee', bonus: { 21: 2, 23: 10 }, armorTags: [1, 19, 31, 32] },
    conquistador: { name: '征服者', cls: 'cav', sz: 1, kite: 60, hp: 55, atk: 16, meleeArmor: 2, pierceArmor: 1, rng: 240, reload: 2.9, spd: 130, dmgType: 'pierce', bonus: { 17: 4 }, armorTags: [15, 8, 19, 23, 28, 31] },
    cretan_archer: { name: '克里特弓手', cls: 'ranged', sz: 1, hp: 45, atk: 8, meleeArmor: 0, pierceArmor: 1, rng: 240, reload: 2.1, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    eagle_scout: { name: '鹰斥候', cls: 'melee', sz: 1, hp: 50, atk: 4, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 20: 3, 25: 8 }, armorTags: [29, 1, 31] },
    eagle_warrior: { name: '鹰勇士', cls: 'melee', sz: 1, hp: 55, atk: 7, meleeArmor: 0, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 8: 3, 16: 1, 20: 3, 25: 8, 30: 2 }, armorTags: [29, 1, 31] },
    ekdromos: { name: '埃克德罗摩斯', cls: 'melee', sz: 1, hp: 80, atk: 13, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 6 }, armorTags: [1, 31] },
    elite_arambai: { name: '精锐阿兰拜', cls: 'cav', sz: 1, kite: 60, hp: 65, atk: 14, meleeArmor: 0, pierceArmor: 2, rng: 200, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 17: 2 }, armorTags: [19, 28, 15, 8, 31] },
    elite_ballista_elephant: { name: '精锐弩炮战象', cls: 'ranged', sz: 1, kite: 60, aoe: true, hp: 280, atk: 10, meleeArmor: 0, pierceArmor: 3, rng: 200, reload: 2.5, spd: 40, dmgType: 'pierce', bonus: { 11: 4, 13: 4, 16: 8, 18: 100, 21: 4 }, armorTags: [8, 19, 5, 20, 31, 37] },
    elite_battle_elephant: { name: '精锐战斗象', cls: 'melee', sz: 1, aoe: true, hp: 300, atk: 14, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 7, 13: 7 }, armorTags: [5, 8, 31] },
    elite_berserk: { name: '精锐狂战士', cls: 'melee', sz: 1, hp: 62, atk: 14, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    elite_blackwood_archer: { name: '精锐黑木弓手', cls: 'ranged', sz: 1, hp: 25, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 1.5, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    elite_bolas_rider: { name: '精锐流星锤骑手', cls: 'cav', sz: 1, kite: 60, hp: 65, atk: 6, meleeArmor: 0, pierceArmor: 2, rng: 200, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 8: 3, 17: 2, 30: 3 }, armorTags: [19, 28, 15, 8, 31] },
    elite_boyar: { name: '精锐波雅尔', cls: 'cav', sz: 1, hp: 130, atk: 14, meleeArmor: 8, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_camel_archer: { name: '精锐骆驼弓骑兵', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 8, meleeArmor: 1, pierceArmor: 1, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 28: 6 }, armorTags: [19, 28, 30, 15, 31, 39] },
    elite_cataphract: { name: '精锐甲胄骑兵', cls: 'cav', sz: 1, hp: 150, atk: 12, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 1.7, spd: 130, dmgType: 'melee', bonus: { 1: 12 }, armorTags: [8, 19, 31] },
    elite_centurion: { name: '精锐百夫长', cls: 'cav', sz: 1, hp: 155, atk: 15, meleeArmor: 3, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_chakram_thrower: { name: '精锐查克拉掷环兵', cls: 'ranged', sz: 1, hp: 50, atk: 4, meleeArmor: 1, pierceArmor: 0, rng: 240, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 1: 1, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    elite_champi_warrior: { name: '精锐查姆皮勇士', cls: 'melee', sz: 1, hp: 65, atk: 11, meleeArmor: 0, pierceArmor: 4, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 20: 3, 21: 3, 29: 1 }, armorTags: [1, 31] },
    elite_conquistador: { name: '精锐征服者', cls: 'cav', sz: 1, kite: 60, hp: 70, atk: 19, meleeArmor: 2, pierceArmor: 2, rng: 240, reload: 2.9, spd: 130, dmgType: 'pierce', bonus: { 11: 2, 17: 6 }, armorTags: [15, 8, 19, 23, 28, 31] },
    elite_coustillier: { name: '精锐库斯蒂耶', cls: 'cav', sz: 1, hp: 145, atk: 11, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_eagle_warrior: { name: '精锐鹰勇士', cls: 'melee', sz: 1, hp: 60, atk: 9, meleeArmor: 0, pierceArmor: 4, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 8: 4, 16: 2, 20: 5, 25: 10, 30: 3 }, armorTags: [29, 1, 31] },
    elite_elephant_archer: { name: '精锐象弓骑兵', cls: 'ranged', sz: 1, kite: 60, hp: 450, atk: 15, meleeArmor: 0, pierceArmor: 3, rng: 200, reload: 2.5, spd: 40, dmgType: 'pierce', bonus: { 13: 4, 21: 4 }, armorTags: [15, 8, 19, 5, 28, 31, 36] },
    elite_gbeto: { name: '精锐格贝托', cls: 'ranged', sz: 1, hp: 50, atk: 13, meleeArmor: 0, pierceArmor: 0, rng: 240, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 29: 1 }, armorTags: [1, 19, 31] },
    elite_genitour: { name: '精锐杰尼图', cls: 'cav', sz: 1, kite: 60, hp: 55, atk: 4, meleeArmor: 0, pierceArmor: 4, rng: 160, reload: 3.0, spd: 130, dmgType: 'pierce', bonus: { 15: 5, 27: 3, 28: 2, 35: 2 }, armorTags: [15, 8, 28, 19, 31, 38] },
    elite_genoese_crossbowman: { name: '精锐热那亚弩手', cls: 'ranged', sz: 1, hp: 50, atk: 6, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 5: 7, 8: 7, 16: 5, 30: 6 }, armorTags: [15, 19, 31] },
    elite_ghulam: { name: '精锐古拉姆', cls: 'melee', sz: 1, hp: 70, atk: 11, meleeArmor: 0, pierceArmor: 6, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 15: 6, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    elite_guecha_warrior: { name: '精锐格查战士', cls: 'ranged', sz: 1, hp: 60, atk: 8, meleeArmor: 0, pierceArmor: 5, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 4, 27: 2, 28: 2 }, armorTags: [15, 31, 38, 19] },
    elite_huskarl: { name: '精锐哥特近卫军', cls: 'melee', sz: 1, hp: 70, atk: 12, meleeArmor: 0, pierceArmor: 8, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 15: 10, 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    elite_hussite_wagon: { name: '精锐胡斯战车', cls: 'ranged', sz: 1, hp: 230, atk: 13, meleeArmor: 1, pierceArmor: 10, rng: 240, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 11: 2, 17: 3 }, armorTags: [20, 19, 23, 31, 37] },
    elite_ibirapema_warrior: { name: '精锐伊比拉佩马勇士', cls: 'melee', sz: 1, hp: 90, atk: 11, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 3 }, armorTags: [1, 19, 31] },
    elite_iron_pagoda: { name: '精锐铁浮屠', cls: 'cav', sz: 1, hp: 140, atk: 13, meleeArmor: 2, pierceArmor: 3, rng: 0, reload: 2.15, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_jaguar_warrior: { name: '精锐美洲豹勇士', cls: 'melee', sz: 1, hp: 75, atk: 19, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 1: 6, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    elite_janissary: { name: '精锐苏丹亲兵', cls: 'ranged', sz: 1, hp: 40, atk: 22, meleeArmor: 2, pierceArmor: 0, rng: 320, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 17: 3 }, armorTags: [15, 19, 23, 31] },
    elite_kamayuk: { name: '精锐卡马尤克', cls: 'melee', sz: 1, hp: 80, atk: 8, meleeArmor: 1, pierceArmor: 1, rng: 40, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 5: 20, 8: 12, 30: 10 }, armorTags: [1, 19, 31] },
    elite_keshik: { name: '精锐怯薛', cls: 'cav', sz: 1, hp: 230, atk: 19, meleeArmor: 7, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31, 36] },
    elite_kona: { name: '精锐科纳', cls: 'cav', sz: 1, hp: 145, atk: 11, meleeArmor: 0, pierceArmor: 5, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 23: 5 }, armorTags: [8, 19, 31] },
    elite_konnik: { name: '精锐骑士', cls: 'cav', sz: 1, hp: 120, atk: 14, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.4, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_konnik_foot: { name: '精锐下马骑士', cls: 'melee', sz: 1, hp: 50, atk: 13, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.4, spd: 55, dmgType: 'melee', bonus: { 21: 4 }, armorTags: [1, 19, 31] },
    elite_leitis: { name: '精锐列提斯', cls: 'cav', sz: 1, hp: 130, atk: 16, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_mameluke: { name: '精锐马穆鲁克', cls: 'cav', sz: 1, kite: 60, hp: 80, atk: 10, meleeArmor: 1, pierceArmor: 0, rng: 120, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 12 }, armorTags: [35, 30, 19, 31, 39] },
    elite_monaspa: { name: '精锐莫纳斯帕', cls: 'cav', sz: 1, hp: 80, atk: 14, meleeArmor: 5, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_obuch: { name: '精锐奥布奇', cls: 'melee', sz: 1, hp: 95, atk: 10, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 6, 29: 3 }, armorTags: [1, 19, 31] },
    elite_organ_gun: { name: '精锐风琴炮', cls: 'ranged', sz: 1, hp: 70, atk: 8, meleeArmor: 2, pierceArmor: 6, rng: 280, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 1: 2, 11: 1, 17: 1, 38: 2 }, armorTags: [20, 19, 23, 31] },
    elite_plumed_archer: { name: '精锐羽箭手', cls: 'ranged', sz: 1, hp: 65, atk: 5, meleeArmor: 0, pierceArmor: 2, rng: 200, reload: 1.9, spd: 50, dmgType: 'pierce', bonus: { 1: 2, 27: 2 }, armorTags: [15, 19, 31] },
    elite_ratha_melee: { name: '精锐拉塔战车', cls: 'cav', sz: 1, hp: 115, atk: 12, meleeArmor: 3, pierceArmor: 3, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 15, 19, 28, 31] },
    elite_ratha_ranged: { name: '精锐拉塔战车（弓）', cls: 'cav', sz: 1, kite: 60, hp: 115, atk: 6, meleeArmor: 3, pierceArmor: 3, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [8, 15, 19, 28, 31] },
    elite_scythian_horse_archer: { name: '精锐斯基泰骑射手', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 8, meleeArmor: 0, pierceArmor: 1, rng: 240, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 4 }, armorTags: [28, 15, 8, 31] },
    elite_serjeant: { name: '精锐军士长', cls: 'melee', sz: 1, hp: 85, atk: 11, meleeArmor: 6, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    elite_shotel_warrior: { name: '精锐弯刀勇士', cls: 'melee', sz: 1, hp: 50, atk: 18, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31, 39] },
    elite_shrivamsha_rider: { name: '精锐什里瓦姆沙骑手', cls: 'cav', sz: 1, hp: 70, atk: 11, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_skirmisher: { name: '精锐掷矛手', cls: 'ranged', sz: 1, hp: 35, atk: 3, meleeArmor: 0, pierceArmor: 4, rng: 200, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 4, 27: 4, 28: 2, 35: 2 }, armorTags: [15, 31, 38] },
    elite_temple_guard: { name: '精锐神庙守卫', cls: 'melee', sz: 1, hp: 115, atk: 14, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 8, 8: 8, 16: 6, 21: 2, 30: 6 }, armorTags: [1, 19, 31, 29] },
    elite_teutonic_knight: { name: '精锐条顿骑士', cls: 'melee', sz: 1, hp: 110, atk: 17, meleeArmor: 10, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 4 }, armorTags: [1, 19, 31] },
    elite_throwing_axeman: { name: '精锐掷斧兵', cls: 'ranged', sz: 1, hp: 70, atk: 8, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    elite_tiger_cavalry: { name: '精锐猛虎骑兵', cls: 'cav', sz: 1, hp: 125, atk: 13, meleeArmor: 0, pierceArmor: 5, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 15: 7 }, armorTags: [8, 19, 31] },
    elite_urumi_swordsman: { name: '精锐乌拉米剑士', cls: 'melee', sz: 1, hp: 65, atk: 11, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 3 }, armorTags: [1, 19, 31] },
    elite_war_chariot: { name: '精锐战车', cls: 'cav', sz: 1, hp: 125, atk: 10, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 1: 8 }, armorTags: [8, 19, 31] },
    elite_war_dog: { name: '精锐军犬', cls: 'melee', sz: 1, hp: 55, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 1.7, spd: 55, dmgType: 'melee', armorTags: [29, 31] },
    elite_war_elephant: { name: '精锐战象', cls: 'melee', sz: 1, aoe: true, hp: 600, atk: 20, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 30, 13: 30 }, armorTags: [5, 8, 19, 31] },
    elite_war_wagon: { name: '精锐战车', cls: 'cav', sz: 1, kite: 60, hp: 200, atk: 9, meleeArmor: 0, pierceArmor: 4, rng: 200, reload: 2.5, spd: 130, dmgType: 'pierce', bonus: { 21: 2 }, armorTags: [15, 8, 19, 28, 31] },
    elite_woad_raider: { name: '精锐靛蓝突袭者', cls: 'melee', sz: 1, hp: 85, atk: 15, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    flaming_camel: { name: '火焰骆驼', cls: 'melee', sz: 1, hp: 55, atk: 20, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 130, 8: 50, 11: 200, 20: 25, 30: 50 }, armorTags: [19, 30, 31, 39] },
    flemish_pikeman: { name: '佛兰德长枪兵', cls: 'melee', sz: 1, hp: 40, atk: 5, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 6, 8: 6, 16: 4, 29: 2, 30: 4 }, armorTags: [1, 19, 31] },
    flemish_pikeman_f: { name: '佛兰德长枪兵F', cls: 'melee', sz: 1, hp: 40, atk: 5, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 6, 8: 6, 16: 4, 29: 2, 30: 4 }, armorTags: [1, 19, 31] },
    gbeto: { name: '格贝托', cls: 'ranged', sz: 1, hp: 40, atk: 10, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 29: 1 }, armorTags: [1, 19, 31] },
    genitour: { name: '杰尼图', cls: 'cav', sz: 1, kite: 60, hp: 50, atk: 3, meleeArmor: 0, pierceArmor: 4, rng: 160, reload: 3.0, spd: 130, dmgType: 'pierce', bonus: { 15: 4, 27: 3, 35: 2 }, armorTags: [15, 8, 28, 19, 31, 38] },
    genoese_crossbowman: { name: '热那亚弩手', cls: 'ranged', sz: 1, hp: 50, atk: 10, meleeArmor: 1, pierceArmor: 4, rng: 240, reload: 4.2, spd: 50, dmgType: 'pierce', bonus: { 27: 6 }, armorTags: [15, 31] },
    ghulam: { name: '古拉姆', cls: 'melee', sz: 1, hp: 60, atk: 9, meleeArmor: 0, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 15: 5, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    greek_noble_cavalry: { name: '希腊贵族骑兵', cls: 'cav', sz: 1, hp: 150, atk: 10, meleeArmor: 3, pierceArmor: 4, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    grenadier: { name: '掷弹兵', cls: 'ranged', sz: 1, hp: 40, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 240, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 1: 9, 17: 3, 21: 4, 27: 1 }, armorTags: [15, 19, 31, 23] },
    guecha_warrior: { name: '格查战士', cls: 'ranged', sz: 1, hp: 55, atk: 6, meleeArmor: 0, pierceArmor: 3, rng: 120, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 3, 27: 2, 28: 2 }, armorTags: [15, 31, 38, 19] },
    hand_cannoneer: { name: '手炮手', cls: 'ranged', sz: 1, hp: 40, atk: 17, meleeArmor: 1, pierceArmor: 0, rng: 280, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 1: 10, 17: 2, 27: 1 }, armorTags: [15, 23, 31] },
    heavy_rocket_cart: { name: '重型火箭车', cls: 'ranged', aoe: true, sz: 1, hp: 65, atk: 5, meleeArmor: 0, pierceArmor: 8, rng: 320, reload: 5.35, spd: 50, dmgType: 'melee', bonus: { 11: 12, 20: 2, 22: 7, 26: 7, 37: 5 }, armorTags: [20, 31, 23] },
    heavy_scorpion: { name: '重型弩炮', cls: 'ranged', sz: 1, hp: 60, atk: 14, meleeArmor: 1, pierceArmor: 8, rng: 280, reload: 3.6, spd: 50, dmgType: 'pierce', bonus: { 1: 2, 5: 10, 11: 6, 17: 2 }, armorTags: [20, 31] },
    hill_tribesman: { name: '山地部落民', cls: 'melee', sz: 1, hp: 55, atk: 9, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 5, 29: 6 }, armorTags: [1, 19, 31] },
    hippeus: { name: '希皮乌斯', cls: 'melee', sz: 1, hp: 90, atk: 9, meleeArmor: 2, pierceArmor: 4, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4 }, armorTags: [1, 19, 31] },
    hoplite: { name: '希腊重装步兵', cls: 'melee', sz: 1, hp: 55, atk: 10, meleeArmor: 1, pierceArmor: 1, rng: 20, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 2 }, armorTags: [1, 19, 31] },
    houfnice: { name: '榴弹炮', cls: 'ranged', aoe: true, sz: 1, hp: 90, atk: 50, meleeArmor: 2, pierceArmor: 6, rng: 480, reload: 6.5, spd: 50, dmgType: 'melee', bonus: { 11: 250, 13: 50, 16: 50, 20: 20, 37: 50 }, armorTags: [20, 23, 31] },
    huskarl: { name: '哥特近卫军', cls: 'melee', sz: 1, hp: 60, atk: 10, meleeArmor: 0, pierceArmor: 6, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 15: 6, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    hussar: { name: '骠骑兵', cls: 'cav', sz: 1, hp: 75, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 25: 12 }, armorTags: [8, 31] },
    hussite_wagon: { name: '胡斯战车', cls: 'ranged', sz: 1, hp: 160, atk: 10, meleeArmor: 0, pierceArmor: 7, rng: 240, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 11: 1, 17: 3 }, armorTags: [20, 19, 23, 31, 37] },
    ibirapema_warrior: { name: '伊比拉佩马勇士', cls: 'melee', sz: 1, hp: 80, atk: 8, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31] },
    immortal: { name: '不死军', cls: 'melee', sz: 1, hp: 50, atk: 10, meleeArmor: 0, pierceArmor: 3, rng: 0, reload: 1.8, spd: 55, dmgType: 'melee', armorTags: [15, 19, 31, 1] },
    immortal_ranged: { name: '不死军弓手', cls: 'ranged', sz: 1, hp: 50, atk: 5, meleeArmor: 0, pierceArmor: 3, rng: 160, reload: 1.8, spd: 50, dmgType: 'pierce', armorTags: [15, 19, 31, 1] },
    imperial_camel_rider: { name: '帝王骆驼兵', cls: 'cav', sz: 1, hp: 140, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 18, 16: 9, 30: 9, 35: 7 }, armorTags: [30, 31, 39] },
    imperial_centurion: { name: '帝王百夫长', cls: 'cav', sz: 1, hp: 150, atk: 12, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 1.7, spd: 130, dmgType: 'melee', bonus: { 1: 12 }, armorTags: [8, 19, 31] },
    indian_tribesman: { name: '印度部落民', cls: 'melee', sz: 1, hp: 70, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.5, spd: 55, dmgType: 'melee', bonus: { 5: 20, 8: 8, 21: 1, 29: 1 }, armorTags: [27, 1, 31] },
    iroquois_warrior: { name: '易洛魁战士', cls: 'melee', sz: 1, hp: 65, atk: 8, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    jaguar_warrior: { name: '美洲豹勇士', cls: 'melee', sz: 1, hp: 65, atk: 15, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 1: 5, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    janissary: { name: '苏丹亲兵', cls: 'ranged', sz: 1, hp: 35, atk: 17, meleeArmor: 1, pierceArmor: 0, rng: 280, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 17: 2 }, armorTags: [15, 19, 23, 31] },
    knight: { name: '骑士', cls: 'cav', sz: 1, hp: 100, atk: 10, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    kona: { name: '科纳', cls: 'cav', sz: 1, hp: 125, atk: 9, meleeArmor: 0, pierceArmor: 3, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 23: 5 }, armorTags: [19, 8, 31] },
    konnik: { name: '骑士', cls: 'cav', sz: 1, hp: 100, atk: 12, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.4, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    konnik_foot: { name: '下马骑士', cls: 'melee', sz: 1, hp: 45, atk: 12, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.4, spd: 55, dmgType: 'melee', bonus: { 21: 4 }, armorTags: [1, 19, 31] },
    leitis: { name: '列提斯', cls: 'cav', sz: 1, hp: 100, atk: 13, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    longbowman: { name: '长弓兵', cls: 'ranged', sz: 1, hp: 35, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    magyar_huszar: { name: '马扎尔骠骑', cls: 'cav', sz: 1, hp: 90, atk: 11, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', bonus: { 17: 2, 20: 8 }, armorTags: [8, 19, 31] },
    mameluke: { name: '马穆鲁克', cls: 'cav', sz: 1, kite: 60, hp: 80, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 120, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 9 }, armorTags: [35, 30, 19, 31, 39] },
    mangonel: { name: '轻型投石车', cls: 'ranged', aoe: true, sz: 1, hp: 50, atk: 40, meleeArmor: 0, pierceArmor: 6, rng: 280, reload: 6.0, spd: 50, dmgType: 'melee', bonus: { 11: 35, 20: 12, 37: 40 }, armorTags: [20, 31] },
    mercenary_hoplite: { name: '雇佣重装步兵', cls: 'melee', sz: 1, hp: 70, atk: 10, meleeArmor: 3, pierceArmor: 1, rng: 12, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 4 }, armorTags: [1, 19, 31] },
    militia: { name: '民兵', cls: 'melee', sz: 1, hp: 40, atk: 4, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', armorTags: [1, 31] },
    monaspa: { name: '莫纳斯帕', cls: 'cav', sz: 1, hp: 70, atk: 12, meleeArmor: 3, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    mounted_trebuchet: { name: '骑乘投石机', cls: 'cav', sz: 1, kite: 60, hp: 75, atk: 30, meleeArmor: 2, pierceArmor: 4, rng: 400, reload: 6.5, spd: 130, dmgType: 'melee', bonus: { 11: 10, 20: 30, 37: 30 }, armorTags: [20, 31, 19, 37, 30, 39] },
    obuch: { name: '奥布奇', cls: 'melee', sz: 1, hp: 80, atk: 8, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 2 }, armorTags: [1, 19, 31] },
    onager: { name: '重型投石车', cls: 'ranged', aoe: true, sz: 1, hp: 60, atk: 50, meleeArmor: 0, pierceArmor: 7, rng: 320, reload: 6.0, spd: 50, dmgType: 'melee', bonus: { 11: 45, 20: 12, 37: 50 }, armorTags: [20, 31] },
    organ_gun: { name: '风琴炮', cls: 'ranged', sz: 1, hp: 50, atk: 6, meleeArmor: 2, pierceArmor: 4, rng: 280, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 1: 2, 17: 1, 38: 2 }, armorTags: [20, 19, 23, 31] },
    petard: { name: '爆破兵', cls: 'melee', sz: 1, hp: 50, atk: 25, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 11: 500, 20: 60, 22: 900, 26: 100 }, armorTags: [31] },
    phalangite: { name: '马其顿方阵兵', cls: 'melee', sz: 1, hp: 50, atk: 6, meleeArmor: 1, pierceArmor: 0, rng: 72, reload: 2.5, spd: 50, dmgType: 'melee', bonus: { 5: 20, 8: 6, 30: 4 }, armorTags: [1, 19, 31] },
    plumed_archer: { name: '羽箭手', cls: 'ranged', sz: 1, hp: 50, atk: 5, meleeArmor: 0, pierceArmor: 1, rng: 160, reload: 1.9, spd: 50, dmgType: 'pierce', bonus: { 1: 1, 27: 2 }, armorTags: [15, 19, 31] },
    qizilbash_warrior: { name: '克孜尔巴什', cls: 'cav', sz: 1, hp: 100, atk: 8, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 15: 2 }, armorTags: [8, 31] },
    ratha_melee: { name: '拉塔战车', cls: 'cav', sz: 1, hp: 100, atk: 10, meleeArmor: 3, pierceArmor: 1, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 15, 19, 28, 31] },
    ratha_ranged: { name: '拉塔战车（弓）', cls: 'cav', sz: 1, kite: 60, hp: 100, atk: 5, meleeArmor: 3, pierceArmor: 1, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 1 }, armorTags: [8, 15, 19, 28, 31] },
    rhodian_slinger: { name: '罗得岛投石兵', cls: 'ranged', sz: 1, hp: 40, atk: 1, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 1: 15, 27: 1 }, armorTags: [15, 19, 31] },
    rhomphaia_warrior: { name: '龙牙战士', cls: 'melee', sz: 1, hp: 60, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 8: 14, 21: 6, 29: 2, 30: 12 }, armorTags: [1, 19, 31] },
    rocket_cart: { name: '火箭车', cls: 'ranged', aoe: true, sz: 1, hp: 45, atk: 5, meleeArmor: 0, pierceArmor: 6, rng: 280, reload: 5.5, spd: 50, dmgType: 'melee', bonus: { 11: 7, 20: 2, 22: 6, 26: 7, 37: 5 }, armorTags: [20, 31, 23] },
    royal_janissary: { name: '皇家苏丹亲兵', cls: 'ranged', sz: 1, hp: 55, atk: 22, meleeArmor: 2, pierceArmor: 0, rng: 320, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 17: 3 }, armorTags: [15, 19, 23, 31] },
    sacred_band: { name: '圣队', cls: 'melee', sz: 1, hp: 65, atk: 13, meleeArmor: 3, pierceArmor: 1, rng: 20, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 2 }, armorTags: [1, 19, 31] },
    sannahya: { name: '桑纳亚', cls: 'melee', sz: 1, aoe: true, hp: 300, atk: 10, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 13: 4, 21: 4 }, armorTags: [5, 8, 31, 19] },
    scorpion: { name: '弩炮', cls: 'ranged', sz: 1, hp: 40, atk: 11, meleeArmor: 0, pierceArmor: 7, rng: 280, reload: 3.6, spd: 50, dmgType: 'pierce', bonus: { 1: 1, 5: 7, 11: 3, 17: 1 }, armorTags: [20, 31] },
    scythian_axe_cavalry: { name: '斯基泰斧骑', cls: 'cav', sz: 1, hp: 130, atk: 10, meleeArmor: 2, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    scythian_horse_archer: { name: '斯基泰骑射手', cls: 'cav', sz: 1, kite: 60, hp: 50, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [28, 15, 8, 31] },
    serjeant: { name: '军士长', cls: 'melee', sz: 1, hp: 50, atk: 5, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    shotel_warrior: { name: '弯刀勇士', cls: 'melee', sz: 1, hp: 45, atk: 16, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 29: 2 }, armorTags: [1, 19, 31, 39] },
    shrivamsha_rider: { name: '什里瓦姆沙骑手', cls: 'cav', sz: 1, hp: 55, atk: 8, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    sickle_warrior: { name: '镰刀战士', cls: 'melee', sz: 1, hp: 60, atk: 6, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 1.33, spd: 55, dmgType: 'melee', bonus: { 29: 2 }, armorTags: [1, 19, 31, 39] },
    siege_onager: { name: '攻城投石车', cls: 'ranged', aoe: true, sz: 1, hp: 70, atk: 75, meleeArmor: 0, pierceArmor: 8, rng: 320, reload: 6.0, spd: 50, dmgType: 'melee', bonus: { 11: 60, 20: 12, 37: 50 }, armorTags: [20, 31] },
    siege_ram: { name: '攻城槌', cls: 'melee', sz: 1, hp: 270, atk: 4, meleeArmor: -1, pierceArmor: 195, rng: 0, reload: 5.0, spd: 55, dmgType: 'melee', bonus: { 11: 200, 20: 65 }, armorTags: [17, 20, 31] },
    skirmisher: { name: '掷矛手', cls: 'ranged', sz: 1, hp: 30, atk: 2, meleeArmor: 0, pierceArmor: 3, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 3, 27: 3, 35: 2 }, armorTags: [15, 31, 38] },
    slinger: { name: '投石兵', cls: 'ranged', sz: 1, hp: 35, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 1: 4, 20: 3, 25: 4, 27: 1 }, armorTags: [15, 31, 38] },
    sogdian_cataphract: { name: '粟特甲胄骑兵', cls: 'cav', sz: 1, hp: 110, atk: 12, meleeArmor: 0, pierceArmor: 5, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 15: 6 }, armorTags: [8, 19, 31] },
    sparabara: { name: '斯帕拉巴拉', cls: 'melee', sz: 1, hp: 70, atk: 7, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31, 36] },
    spearman: { name: '长矛兵', cls: 'melee', sz: 1, hp: 45, atk: 3, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 55, dmgType: 'melee', bonus: { 5: 15, 8: 15, 16: 9, 21: 1, 29: 1, 30: 12 }, armorTags: [27, 1, 31] },
    strategos: { name: '将军卫队', cls: 'melee', sz: 1, hp: 60, atk: 15, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', armorTags: [1, 19, 31] },
    takabara: { name: '塔卡巴拉', cls: 'melee', sz: 1, hp: 80, atk: 9, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 6 }, armorTags: [1, 19, 31, 36] },
    tarantine_cavalry: { name: '塔兰丁骑兵', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 240, reload: 2.7, spd: 130, dmgType: 'pierce', bonus: { 1: 3, 15: 4, 27: 4, 28: 2 }, armorTags: [15, 8, 28, 19, 31, 38] },
    temple_guard: { name: '神庙守卫', cls: 'melee', sz: 1, hp: 100, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 5, 8: 5, 16: 4, 30: 4 }, armorTags: [1, 19, 31, 29] },
    teutonic_knight: { name: '条顿骑士', cls: 'melee', sz: 1, hp: 90, atk: 14, meleeArmor: 7, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 4 }, armorTags: [1, 19, 31] },
    thracian_peltast: { name: '色雷斯轻装兵', cls: 'ranged', sz: 1, hp: 40, atk: 7, meleeArmor: 0, pierceArmor: 3, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3, 28: 3 }, armorTags: [15, 31, 38] },
    traction_trebuchet: { name: '牵引投石机', cls: 'ranged', sz: 1, hp: 115, atk: 50, meleeArmor: 1, pierceArmor: 8, rng: 560, reload: 11.0, spd: 50, dmgType: 'melee', bonus: { 11: 230 }, armorTags: [17, 20, 31] },
    two_handed_swordsman: { name: '双手剑士', cls: 'melee', sz: 1, hp: 65, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 8 }, armorTags: [1, 31] },
    urumi_swordsman: { name: '乌拉米剑士', cls: 'melee', sz: 1, hp: 55, atk: 9, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31] },
    war_chariot: { name: '战车', cls: 'cav', sz: 1, hp: 100, atk: 8, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 1: 5 }, armorTags: [8, 19, 31] },
    war_chariot_ranged: { name: '远程战车', cls: 'cav', sz: 1, kite: 60, hp: 65, atk: 8, meleeArmor: 0, pierceArmor: 5, rng: 240, reload: 6.5, spd: 130, dmgType: 'pierce', bonus: { 11: 2 }, armorTags: [8, 20, 19, 31, 37] },
    war_dog: { name: '军犬', cls: 'melee', sz: 1, hp: 50, atk: 9, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 1.7, spd: 55, dmgType: 'melee', armorTags: [29, 31] },
    war_wagon: { name: '战车', cls: 'cav', sz: 1, kite: 60, hp: 150, atk: 9, meleeArmor: 0, pierceArmor: 2, rng: 160, reload: 2.5, spd: 130, dmgType: 'pierce', bonus: { 21: 2 }, armorTags: [15, 8, 19, 28, 31] },
    warrior_priest: { name: '战士祭司', cls: 'melee', sz: 1, hp: 80, atk: 11, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', armorTags: [1, 25, 19, 31] },
    winged_hussar: { name: '翼骑兵', cls: 'cav', sz: 1, hp: 80, atk: 9, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 23: 4, 25: 14 }, armorTags: [8, 31] },
    woad_raider: { name: '靛蓝突袭者', cls: 'melee', sz: 1, hp: 70, atk: 11, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    xolotl_warrior: { name: '索洛特尔勇士', cls: 'cav', sz: 1, hp: 100, atk: 10, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
};


/** 取某兵种完整数据（WAR_TYPES 已是 DE 五维全量，无组别覆盖） */
function statsOf(key: string): WarType {
    return WAR_TYPES[key] ?? WAR_TYPES.light_infantry;
}

/** 单次出手伤害（DE 公式）：max(1, 攻 + 加成伤害 − 近防/远防) */
function dmgVs(shooter: WarType, target: WarType): number {
    const armor = shooter.dmgType === 'melee' ? target.meleeArmor : target.pierceArmor;
    let bonus = 0;
    if (shooter.bonus && target.armorTags) {
        for (const tag of target.armorTags) {
            if (shooter.bonus[tag]) bonus += shooter.bonus[tag];
        }
    }
    return Math.max(1, shooter.atk + bonus - armor);
}

/** 三阵型 9 口布局查找表（row 0 最靠中线；idx = 出兵口展开序）：
 *  square 鱼鳞 3×3 = 五通道（前中步3 / 上翼骑·中军·下翼骑 / 后中弓3）
 *  triangle 三角 2+3+4 = 尖刀2 / 中坚3 / 后4（近战尖刀前、弓骑后）
 *  echelon 雁行 4+3+2 = 前4 / 中3 / 后2（近战顶前、远程后） */
const LAYOUT: Record<FormationMode, { col: number; row: number; cols: number }[]> = {
    square: [
        { col: 0, row: 0, cols: 3 }, { col: 1, row: 0, cols: 3 }, { col: 2, row: 0, cols: 3 },
        { col: 0, row: 1, cols: 3 }, { col: 1, row: 1, cols: 3 }, { col: 2, row: 1, cols: 3 },
        { col: 0, row: 2, cols: 3 }, { col: 1, row: 2, cols: 3 }, { col: 2, row: 2, cols: 3 },
    ],
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
};

/** 单兵绘制尺寸（px，可调；2026-08-11 主人「单兵尺寸放大些」30 → 50） */
const UNIT_PX = 50;

/** AoE2 DE（SLD）动态帧框素材目录：走 hotspot 对齐渲染，读 `_meta.json`。其余（S10DB/征服版 SLP）走正方形帧。 */
const DE_DYN_DIRS = ['/SUCAI/ARCHER/', '/SUCAI/SAMURAI_ELITE/', '/SUCAI/SAMURAI_DE/', '/SUCAI/FIRE_ARCHER/', '/SUCAI/HEI_KUANG/', '/SUCAI/EASTERN_SWORDSMAN/', '/SUCAI/IRON_PAGODA/', '/SUCAI/KIPCHAK/', '/SUCAI/LONGBOWMAN_ELITE/', '/SUCAI/PIKEMAN/', '/SUCAI/CAV_ARCHER/', '/SUCAI/CAV_ARCHER_HEAVY/', '/SUCAI/LIGHT_RIDERS/', '/SUCAI/CHUKONU/', '/SUCAI/WHITE_FEATHER_GUARD/', '/SUCAI/ELITE_WHITE_FEATHER_GUARD/', '/SUCAI/RATTAN_ARCHER/', '/SUCAI/ELITE_FIRE_LANCER/', '/SUCAI/ELITE_FIRE_ARCHER/', '/SUCAI/ELITE_CHUKONU/', '/SUCAI/TARKAN/', '/SUCAI/ELITE_TARKAN/', '/SUCAI/ELITE_GUARDSMAN/', '/SUCAI/STEPPE_LANCER/', '/SUCAI/NINJA/', '/SUCAI/LIAO_DAO/', '/SUCAI/ELITE_LIAO_DAO/', '/SUCAI/FIRE_LANCER/', '/SUCAI/XIANBEI_RAIDER/', '/SUCAI/TIGER_RIDER/', '/SUCAI/JIAN_SWORDSMAN/', '/SUCAI/IMPERIAL_SKIRMISHER/', '/SUCAI/WAR_ELEPHANT/', '/SUCAI/KARAMBIT_WARRIOR/', '/SUCAI/ARAMBAI/', '/SUCAI/MANGUDAI/', '/SUCAI/KESHIK/', '/SUCAI/BOYAR/', '/SUCAI/SAVAR/', '/SUCAI/ELITE_KIPCHAK/', '/SUCAI/ELITE_COMPOSITE_BOWMAN/', '/SUCAI/CAMEL_HEAVY/', '/SUCAI/COMPOSITE_BOWMAN/', '/SUCAI/ELITE_STEPPE_LANCER/', '/SUCAI/THROWING_AXEMAN/', '/SUCAI/CHAMPION/', '/SUCAI/CROSSBOWMAN/', '/SUCAI/PALADIN/', '/SUCAI/COUSTILLIER/', '/SUCAI/HEAVY_PIKEMAN/', '/SUCAI/ARBALEST/', '/SUCAI/HEI_KUANG_HEAVY/', '/SUCAI/MANGUDAI_ELITE/', '/SUCAI/PATTIYODA_LONGBOWMAN/', '/SUCAI/ARMORED_ELEPHANT/', '/SUCAI/BALLISTA_ELEPHANT/', '/SUCAI/ELEPHANT_ARCHER/', '/SUCAI/RATTAN_ARCHER_ELITE/', '/SUCAI/LEGIONARY/', '/SUCAI/SWORDSMAN/', '/SUCAI/KAMAYUK/', '/SUCAI/KARAMBIT_WARRIOR_ELITE/', '/SUCAI/AMAZONARCHER/', '/SUCAI/AMAZONWARRIOR/', '/SUCAI/BACTRIAN_ARCHER/', '/SUCAI/BATTERINGRAM/', '/SUCAI/BERSERK/', '/SUCAI/BLACKWOODARCHER/', '/SUCAI/BOLASRIDER/', '/SUCAI/BOMBARDCANNON/', '/SUCAI/CAMELARCHER/', '/SUCAI/CAMEL_RAIDER/', '/SUCAI/CAMELRIDER/', '/SUCAI/CAMELSCOUT/', '/SUCAI/CAPPEDRAM/', '/SUCAI/CATAPHRACT/', '/SUCAI/CENTURION/', '/SUCAI/CHAKRAMTHROWER/', '/SUCAI/CHAMPIRUNNER/', '/SUCAI/CHAMPISCOUT/', '/SUCAI/COMPANION_CAVALRY/', '/SUCAI/CONDOTTIERO/', '/SUCAI/CONQUISTADOR/', '/SUCAI/CRETAN_ARCHER/', '/SUCAI/EAGLESCOUT/', '/SUCAI/EAGLEWARRIOR/', '/SUCAI/EKDROMOS/', '/SUCAI/ELITEARAMBAI/', '/SUCAI/ELITEBALLISTAELEPHANT/', '/SUCAI/ELITEBATTLEELEPHANT/', '/SUCAI/ELITEBERSERK/', '/SUCAI/ELITEBLACKWOODARCHER/', '/SUCAI/ELITEBOLASRIDER/', '/SUCAI/ELITEBOYAR/', '/SUCAI/ELITECAMELARCHER/', '/SUCAI/ELITECATAPHRACT/', '/SUCAI/ELITECENTURION/', '/SUCAI/ELITECHAKRAMTHROWER/', '/SUCAI/ELITECHAMPIWARRIOR/', '/SUCAI/ELITECONQUISTADOR/', '/SUCAI/ELITECOUSTILLIER/', '/SUCAI/ELITEEAGLEWARRIOR/', '/SUCAI/ELITEELEPHANTARCHER/', '/SUCAI/ELITEGBETO/', '/SUCAI/ELITEGENITOUR/', '/SUCAI/ELITEGENOESECROSSBOWMAN/', '/SUCAI/ELITEGHULAM/', '/SUCAI/ELITEGUECHAWARRIOR/', '/SUCAI/ELITEHUSKARL/', '/SUCAI/ELITEHUSSITEWAGON/', '/SUCAI/ELITEIBIRAPEMAWARRIOR/', '/SUCAI/ELITEIRONPAGODA/', '/SUCAI/ELITEJAGUARWARRIOR/', '/SUCAI/ELITEJANISSARY/', '/SUCAI/ELITEKAMAYUK/', '/SUCAI/ELITEKESHIK/', '/SUCAI/ELITEKONA/', '/SUCAI/ELITEKONNIK/', '/SUCAI/ELITEFOOTKONNIK/', '/SUCAI/ELITELEITIS/', '/SUCAI/ELITEMAMELUKE/', '/SUCAI/ELITEMONASPA/', '/SUCAI/ELITEOBUCH/', '/SUCAI/ELITEORGANGUN/', '/SUCAI/ELITEPLUMEDARCHER/', '/SUCAI/ELITERATHAMELEE/', '/SUCAI/ELITERATHARANGED/', '/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/', '/SUCAI/ELITESERJEANT/', '/SUCAI/ELITESHOTELWARRIOR/', '/SUCAI/ELITESHRIVAMSHARIDER/', '/SUCAI/ELITESKIRMISHER/', '/SUCAI/ELITETEMPLEGUARD/', '/SUCAI/ELITETEUTONICKNIGHT/', '/SUCAI/ELITETHROWINGAXEMAN/', '/SUCAI/ELITETIGERCAVALRY/', '/SUCAI/ELITEURUMISWORDSMAN/', '/SUCAI/ELITE_WAR_CHARIOT/', '/SUCAI/ELITEWARDOG/', '/SUCAI/ELITEWARELEPHANT/', '/SUCAI/ELITEWARWAGON/', '/SUCAI/ELITEWOADRAIDER/', '/SUCAI/FLAMINGCAMEL/', '/SUCAI/FLEMISHPIKEMAN/', '/SUCAI/FLEMISHPIKEMAN_F/', '/SUCAI/GBETO/', '/SUCAI/GENITOUR/', '/SUCAI/GENOESECROSSBOWMAN/', '/SUCAI/GHULAM/', '/SUCAI/GREEK_NOBLE_CAVALRY/', '/SUCAI/GRENADIER/', '/SUCAI/GUECHAWARRIOR/', '/SUCAI/HANDCANNONEER/', '/SUCAI/HEAVYROCKETCART/', '/SUCAI/HEAVYSCORPION/', '/SUCAI/HILL_TRIBESMAN/', '/SUCAI/HIPPEUS/', '/SUCAI/HOPLITE/', '/SUCAI/HOUFNICE/', '/SUCAI/HUSKARL/', '/SUCAI/HUSSAR/', '/SUCAI/HUSSITEWAGON/', '/SUCAI/IBIRAPEMAWARRIOR/', '/SUCAI/IMMORTAL/', '/SUCAI/RANGED_IMMORTAL/', '/SUCAI/IMPERIALCAMELRIDER/', '/SUCAI/IMPERIALCENTURION/', '/SUCAI/INDIAN_TRIBESMAN/', '/SUCAI/IROQUOISWARRIOR/', '/SUCAI/JAGUARWARRIOR/', '/SUCAI/JANISSARY/', '/SUCAI/KNIGHT/', '/SUCAI/KONA/', '/SUCAI/KONNIK/', '/SUCAI/FOOTKONNIK/', '/SUCAI/LEITIS/', '/SUCAI/LONGBOWMAN/', '/SUCAI/MAGYARHUSZAR/', '/SUCAI/MAMELUKE/', '/SUCAI/MANGONEL/', '/SUCAI/ELITE_HOPLITE/', '/SUCAI/MILITIA/', '/SUCAI/MONASPA/', '/SUCAI/MOUNTEDTREBUCHET/', '/SUCAI/OBUCH/', '/SUCAI/ONAGER/', '/SUCAI/ORGANGUN/', '/SUCAI/PETARD/', '/SUCAI/PHALANGITE/', '/SUCAI/PLUMEDARCHER/', '/SUCAI/QIZILBASHWARRIOR/', '/SUCAI/RATHAMELEE/', '/SUCAI/RATHARANGED/', '/SUCAI/RHODIAN_SLINGER/', '/SUCAI/RHOMPHAIA_WARRIOR/', '/SUCAI/ROCKETCART/', '/SUCAI/ROYALJANISSARY/', '/SUCAI/SACRED_BAND/', '/SUCAI/SANNAHYA/', '/SUCAI/SCORPION/', '/SUCAI/SCYTHIAN_AXE_CAVALRY/', '/SUCAI/SCYTHIAN_HORSE_ARCHER/', '/SUCAI/SERJEANT/', '/SUCAI/SHOTELWARRIOR/', '/SUCAI/SHRIVAMSHARIDER/', '/SUCAI/SICKLE_WARRIOR/', '/SUCAI/SIEGEONAGER/', '/SUCAI/SIEGERAM/', '/SUCAI/SKIRMISHER/', '/SUCAI/SLINGER/', '/SUCAI/SOGDIANCATAPHRACT/', '/SUCAI/SPARABARA/', '/SUCAI/SPEARMAN/', '/SUCAI/STRATEGOS/', '/SUCAI/SAKAN_AXEMAN/', '/SUCAI/TARANTINE_CAVALRY/', '/SUCAI/TEMPLEGUARD/', '/SUCAI/TEUTONICKNIGHT/', '/SUCAI/THRACIAN_PELTAST/', '/SUCAI/TRACTIONTREBUCHET/', '/SUCAI/TWOHANDEDSWORDSMAN/', '/SUCAI/URUMISWORDSMAN/', '/SUCAI/WAR_CHARIOT/', '/SUCAI/WARCHARIOT/', '/SUCAI/WARDOG/', '/SUCAI/WARWAGON/', '/SUCAI/WARRIORPRIEST/', '/SUCAI/WINGEDHUSSAR/', '/SUCAI/WOADRAIDER/', '/SUCAI/XOLOTLWARRIOR/'];

// ── 场景树装饰（三国群英传地形素材，2026-08-12 主人定：树1绿 / 树2橙 / 树3白）──
// 素材自带 tRNS 透明通道（索引 0 = 透明），无需抠黑，直接 drawImage 即透明。
// 🔴 2026-08-12 主人实机定的两条：
//   ① 树/湖不遮士兵 —— 固定画在最底层（ground 尸体层之下），士兵/尸体永远在树前。
//   ② **原图多大画多大，绝不缩放**（主人原话「不要改写比例，不然有的模糊，有的清晰」）。
//      6 变体的原始尺寸差极大：1 号 184x121、3 号 166x48、2/6 号 707x374。
//      统一成固定 W×H 会把小的放大糊掉、把大的压扁，清晰度参差 —— 所以一律按 naturalWidth/Height 画。
//      变体大小不齐是素材本身的设计（单棵树 vs 森林板块），不是要被抹平的问题。
const TREE_BASE_URL = '/sanguoqunying/樹/';
// 🔴 6 变体全用（素材主人给的，不擅自筛选）。
/**
 * 「森林板块」变体（0 基索引：1 = 2.png、5 = 6.png，均为 707×374）。
 * 这两张不是单棵树，是**远景林地板块**，按单棵树的规则撒会盖掉半个战场（主人 2026-08-12 实机否决）。
 * 它们只压画面上下边缘带、每场最多一块 —— 见 scatterTrees。
 */
const TREE_SLAB_VARIANTS = new Set([1, 5]);
/** 森林板块允许落在的边缘带高度（占画面高度比例），中间主战区留给战斗 */
const TREE_SLAB_BAND = 0.18;

// ── 场景云装饰（同批三国群英传素材，`云/1..10.png`，207x80 ~ 328x97）──
// 🔴 层级与树/湖**完全相反**：树湖垫在最底层不遮兵，云盖在**最上层**（士兵、旗帜、箭矢之上）
//    半透明横向飘过。俯视视角下云本来就该在人上面，别套树湖那套"画在底层"的规矩。
// 🔴 与树/湖同规矩的只有两条：① 原图多大画多大，绝不缩放（主人「不要改写比例」）
//    ② 纯装饰绝不进 pending —— 加载失败就少一朵云，不能拖累演出/引擎。
// 云没有季节之分（素材本身就一套），不参与 sceneSeason。
const CLOUD_BASE_URL = '/sanguoqunying/云/';
/**
 * 可用素材编号。🔴 **只有 9/10 是云**（927×817 的积云，自带地面投影）——
 * 1~5（153×79 ~ 328×97）和 6~8（59×97）都是深灰扁平碎块，是云影/烟雾碎片，不是云，
 * 混进来会在天上飘一堆灰疙瘩（主人 2026-08-12 实机指出）。别改回「1..10 全用」。
 */
const CLOUD_FILES = [9, 10];
/** 每场云数量。🔴 9/10 是 927×817 的大朵积云，一朵就占近半屏高 —— 4 朵会糊住战场，取 2。 */
const CLOUD_COUNT = 2;
/**
 * 云的统一缩放（主人 2026-08-12「云太大了，小一半」）。
 * ⚠️ 树那边的铁律是「原图多大画多大、绝不缩放」，云这里**可以缩**，原因不同：
 *   树的 6 个变体原始尺寸差 4 倍以上，统一到固定 W×H 会把小的放大糊掉、大的压扁，清晰度参差；
 *   云只有 9/10 两张且**尺寸完全相同**（927×817），统一乘同一个系数是纯缩小 —— 宽高比不变、
 *   全部一致清晰，不会出现「有的糊有的清」。改这个数就行，别去改单张的宽高。
 */
const CLOUD_SCALE = 0.5;
/** 漂移速度区间（px/秒）：慢到"看得出在动但不抢戏" */
const CLOUD_SPD_MIN = 6;
const CLOUD_SPD_MAX = 16;
/** 不透明度区间：素材本身已是淡灰，再压一档，绝不糊住战斗 */
const CLOUD_ALPHA_MIN = 0.30;
const CLOUD_ALPHA_MAX = 0.55;
const TREE_VARIANTS = [0, 1, 2, 3, 4, 5];

// ── 场景湖装饰（同批三国群英传地形素材；湖/1夏 湖/2秋 湖/3冬，与树同季，本场统一）──
// 湖是**贴地水域**（俯视贴图），画在最底层（ground 尸体层之下），不参与 y 深度排序。
// 每季只有一张图（334x221），随机水平镜像增加观感变化。素材自带 tRNS 透明，直接 drawImage。
// 🔴 2026-08-12 主人实机：湖太多太大 → 每场 1–2 个、尺寸小一半（400x265 → 200x132）。
const LAKE_BASE_URL = '/sanguoqunying/湖/';
const LAKE_W = 200;             // 渲染宽（px，原 334 × 0.6）
const LAKE_H = 132;             // 渲染高（px，原 221 × 0.6）
/**
 * 相克（2026-08-16 主人定：彻底废弃旧全局 C=1.8，全面套用 DE）——
 * 不再有 COUNTER_C / COUNTERS / counterMul。克制改由 DE 加成伤害（bonus）+ 近/远防减法自然涌现：
 *   枪兵系 +22/+32 vs 骑兵（步克骑）、掷矛系 vs 弓兵、弓兵射程 vs 步兵低远防（弓克步）、骑兵速度+远防 vs 弓兵（骑克弓）。
 * 单次伤害公式见 dmgVs()；每秒伤害 = dmgVs / reload。
 */
/** 围殴加成：被 N 人同时攻击的人受伤 ×(1 + K×min(N-1, CAP))。见 GANG_K 处的长注释 */
function gangMul(victim: WarMan): number {
    return 1 + GANG_K * Math.min(GANG_CAP, Math.max(0, victim.atkers - 1));
}
/**
 * 箭矢**每个远程兵每轮出手都射一支**（主人 2026-08-11 定），只是飞法学大地图：
 *   飞行 420ms + 抛物线（弧高 = 距离×0.3，封顶 100px），与 ProjectileRenderer 同参数。
 * 🔴 之前像机关枪的根因是**飞得太快**（150ms 直线，看着像曳光弹），不是数量多。
 *    420ms 的慢弧线才是箭该有的样子 —— 大地图的箭就是这么飞的。
 *    伤害仍按秒结算，箭只是画面，不改平衡。
 */
/** 死亡动画时长（8 帧 × 6fps）。播完就把最后一帧烙进地面图，尸体永久保留 */
const DEATH_ANIM = 8 / 6;
const ARROW_DUR = 0.42;
/** DE 抛射物缩放 = 士兵同款（UNIT_PX / 64）。DE 素材像素已反映真实比例（标枪 56px 是箭 28px 的 2 倍），统一缩放即可。 */
const PROJ_SCALE = UNIT_PX / 64;
/**
 * 远程兵 → DE 抛射物素材（缺省 = 箭 PROJ_ARROW）。
 * 箭：弓手/弩手/长弓/诸葛弩/骑射手/突骑/复合弓/藤弓/钦察/象弓（默认，不必列）；
 * 火箭：火弓；标枪：掷矛手；飞镖：阿兰拜；飞斧：掷斧兵；弩箭：元戎弩/重弩战象（平直穿透）。
 */
const PROJ_TYPE: Record<string, string> = {
    fire_archer: 'PROJ_ARROW_FIRE',
    elite_fire_archer: 'PROJ_ARROW_FIRE',
    imperial_skirmisher: 'PROJ_SPEAR',
    arambai: 'PROJ_DART',
    throwing_axeman: 'PROJ_THROWING_AXE',
    ballista: 'PROJ_BOLT',
    ballista_elephant: 'PROJ_BOLT',
    // 热兵器（2026-08-16 主人定：火枪/火炮/掷弹兵用 DE 独立抛射物）
    hand_cannoneer: 'PROJ_SHOT',
    janissary: 'PROJ_SHOT',
    elite_janissary: 'PROJ_SHOT',
    royal_janissary: 'PROJ_SHOT',
    conquistador: 'PROJ_SHOT',
    elite_conquistador: 'PROJ_SHOT',
    organ_gun: 'PROJ_SHOT',
    elite_organ_gun: 'PROJ_SHOT',
    bombard_cannon: 'PROJ_BALL',
    houfnice: 'PROJ_BALL',
    grenadier: 'PROJ_GRENADE',
};
/** 平直弹道抛射物（弩炮箭/火枪弹）：不抛弧、直线飞行。 */
const PROJ_FLAT = new Set(['PROJ_BOLT', 'PROJ_SHOT']);
/** 高抛弧线抛射物（炮弹/手榴弹）：弧高翻倍（投石式高抛）。 */
const PROJ_HIGH_ARC = new Set(['PROJ_BALL', 'PROJ_GRENADE']);
/** 抛射物基准朝向偏移（素材竖向朝上 vs 横向朝东）：火枪弹竖向，旋转需 +90°。 */
const PROJ_ANGLE_OFFSET: Record<string, number> = {
    PROJ_SHOT: Math.PI / 2,
};
/** 连弩连发箭数（AoE2 wiki：诸葛弩 3 支、精锐诸葛弩 5 支；其余远程每轮 1 支）。 */
const PROJ_VOLLEY: Record<string, number> = {
    chukonu: 3,
    elite_chukonu: 5,
    organ_gun: 5,        // 风琴炮一次齐射 5 弹（AoE2 DE）
    elite_organ_gun: 5,
};
/** 连发每支箭的发射间隔（秒），诸葛弩 3/5 支依次射出。 */
const PROJ_VOLLEY_DELAY = 0.08;
/**
 * 每方开局数 + 每次补兵批量 = 300（2026-08-13 主人定）。
 * 成批补：开局双方各出 300；之后一方场上 < 150 才再补 300（见 TRIGGER）。
 */
const SIDE_CAP = 300;
/**
 * 补兵触发线 = 150（2026-08-13 主人定）：一方场上掉到 150 以下才再补一波 300。
 * 成批补制造「兵力波次」：一方打掉一半（300→150）才补，战线来回摆动，尸体沿途铺开。
 */
const TRIGGER = 150;
/**
 * 1 精灵 = 多少兵（2026-08-13：10 → 20，修「三万兵演出 168s 超 120s 看门狗」）。
 * 🔴 只改总量语义，**画面不变**：每方开局 300 精灵不动 → 同屏密度一模一样，
 *    只是总池子 3000→1500 精灵、增援批次减半 → 战斗时长 168s→90s（1:20 实测，留 25% 余量）。
 *    不碰出兵速率、不碰打口系数、不碰引擎。回写兵力的乘数（getLiveTroops 等）用本常数。
 *    别调 1:30（池子 1000 太小，对称性难打破，实测有死锁种子）。
 */
const SPRITE_TROOPS = 20;
/**
 * 成批补（2026-08-11 主人定「取代一个一个补」，2026-08-13 定稿「弱方 < 300 一次补 300」）。
 * 🔴 一个一个补的毛病：双方速率一样、损失立刻被填平，谁也推不动谁 ——
 *    战线永远钉在中线，尸体全堆在那一条，没有尸横遍野的感觉。
 *    成批补制造「兵力波次」：弱方被压到 300 以下，一整批 300 人涌上来反推战线，
 *    战线来回摆动，尸体沿途铺开。
 */
/**
 * 烙进地面的尸体保留比例（主人 2026-08-12：先「减半」，同日改 30%）。
 * 嫌尸体推挤堆叠、盖住活人才要减。调这个数即可，`bakeCorpse` 的累加器会自动均匀取样。
 */
const CORPSE_KEEP = 0.3;
/**
 * 溃逃（主人 2026-08-16）：不保留尸体的那 70% 兵不再播死亡动画，改为反向移动 + 渐隐，
 * 模拟兵败溃逃。速度比正常移动快（近战 55 / 骑兵 130）。跑完 FLEE_DUR 秒即消失。
 */
const FLEE_SPD = 150;
/** 溃逃总时长（秒）：反向移动 + 渐隐，跑完即消失（2026-08-16 主人：渐隐距离加长 2 倍 1.5→3.0） */
const FLEE_DUR = 3.0;
/**
 * 旗帜（2026-08-12 主人拍板加入）——**复用战略地图那面旗**（`LegionFlagDrawer`：
 * 旗杆 + 按势力染色的旗面 + 4 帧飘动，与据点旗号同源），13 不画任何新素材。
 *
 * 存在的理由：密集处双方只靠染色区分，肉眼读不出战线在哪。旗帜是**唯一能穿透人群密度的
 * 信息层**——高于人头、竖直、成色块。这几轮改的都是「让战线动起来」，动了要看得见才算数。
 *
 * 🔴 旗手身份在**出生时**定死，不是每帧按比例现挑：现挑会让旗子每帧跳到不同的人身上 = 闪烁乱窜。
 *    🔴 按出兵口独立计数（2026-08-14 主人修「旗帜分布不平均」）：每口每出满 FLAG_EVERY 个精灵出一面旗，
 *       旗帜天然平均铺在每个出兵口，而不是按全局出生顺序落在固定偏移的少数口
 *       （旧逻辑 want/have 全局计数：纯骑 6 口时 20%6=2，旗手只落 {0,2,4}，一半的口永远没旗）。
 *    旗手战死后由本口后续出兵自然补位（spawned 跨批累计，不重置）。
 */
const FLAG_EVERY = 20;
/**
 * 旗帜缩放：大地图 baseSize=60 是给整个军团用的，13 挂在单兵头顶要小一档。
 * 0.9（初版，主人嫌大）→ 0.7 → 0.8（恢复文字后给字留像素）→ **0.65**。
 * 这个数管**整体**（旗面 + 杆）。只想动杆用 FLAG_POLE_RATIO，两个旋钮各管各的。
 */
const FLAG_SCALE = 0.65;
/** 旗手战死 → 军旗倒地淡出的时长（秒）。「军旗倒下」是战场上最强的叙事符号，不让它啪一下消失 */
const FLAG_FALL = 1.2;
/**
 * 旗杆高度系数（主人 2026-08-12「也长，也粗」）—— **只缩杆，旗面大小不变**。
 * 粗细不需要单独的旋钮：`poleRenderWidth = poleRenderHeight × 图片宽高比`，缩高自动变细。
 * 🔴 drawPole 和 drawFlag 必须传**同一个值**：旗面是贴在算出来的杆顶上的，
 *    两边不一致 = 旗面悬空、杆够不着。
 */
const FLAG_POLE_RATIO = 0.8;
/**
 * 旗杆整体上移系数（主人 2026-08-12「上移一小点」→ 同日「再上移一些」：0.1 → 0.4）——
 * 上移量 = 旗面渲染高 × 本系数 = 60 × FLAG_SCALE × 本系数（当前约 15.6px）。
 * 杆缩短后杆顶变低、旗面跟着沉，用这个把整面旗（杆+旗面）抬回去一点。
 * 必须与 FLAG_POLE_RATIO 一样，drawPole / drawFlag 传**同一个值**。
 */
const FLAG_POLE_LIFT = 0.4;
const BATCH_COOLDOWN = 2;      // 批次冷却（秒），两批之间看得出间隔

/** 出场渐显时长（秒）：新兵从透明淡入，不再凭空「啪」地出现（主人 2026-08-11） */
const FADE_IN = 0.5;
/** 开场列阵待命时长（秒）：双方整军渐显、静止对峙，之后才开打（主人 2026-08-16） */
const DEPLOY_SECS = 2.5;
/** 开场整军渐显时长（秒）：与待命同步，实现「双方缓缓显现」（主人 2026-08-16） */
const DEPLOY_FADE = 2.0;
/** 到达判定阈值（px）：离目标比这更近就停，防原地抖动 */
const ARRIVE_EPS = 8;
/**
 * 选敌口时纵向（y）的权重。
 * 🔴 用直线距离选「最近的敌口」对 3×3 没问题，但对**纯骑的 1-2-3 三角阵是灾难**：
 *    三角的尖端口正好在正中、又最靠前，上中下三路的敌兵算下来最近的都是它
 *    （实测上路兵到尖端 754px、到同路的口 986px），于是全军朝正中涌 —— 比不修还挤。
 *    把纵向差放大后，「同一路」压过「更靠前」，各路才各走各的。
 *
 * 🔴 权重必须 ≥6，4 不够（2026-08-11 复查四种阵型组合时抓到）：
 *    三角的口纵向只隔 144px，而尖端比同路的口靠前 144px —— 权重 4 时横向优势仍能压过纵向，
 *    「三角打三角」6 个口里 4 个还是指向正中。实测各组合的平均偏离（0 = 完全各走各的路）：
 *      权重 4 → 3×3打三角 96px、三角打三角 96px（没修好）
 *      权重 6 → 两者都 0px ✅（再往上到 8、12 没有额外收益）
 *    「三角打3×3」恒为 48px 不是缺陷：三角只有 6 个口、3×3 有 9 个，数量对不上，
 *    最近的同路口本来就有偏差，三条路仍然是分开的。
 */
const LANE_W = 6;
/** 行军索敌半径：视野内找不到敌兵才退回敌军重心（所有兵一个规矩，无中军特权） */
const MARCH_R = 300;
/**
 * 移动时冲锋/移动**逐轮交替**（主人 2026-08-12 拍板，取代原先按距离切的「最后冲刺段」方案）。
 * 一轮 = 一个 8 帧循环（≈1 秒）：走一轮 → 冲一轮 → 走一轮…… 只有有冲锋组的兵种（象兵/突骑）受影响。
 * 🔴 必须在**循环边界**上翻（用 floor(ph/8) 的奇偶），不能按时间或距离翻 ——
 *    在循环中途换套会把步态截断，看着就是一顿一顿地换腿。
 */
const CHARGE_CYCLE = 8;
/**
 * 围殴加成（2026-08-12 主人采纳「让战线动起来」方案②）。
 *
 * 🔴 解决的问题：在此之前，3 个人打 1 个和 1 个打 1 个，对挨打的那个来说**伤害完全一样**
 *    —— 每个攻击者各自按秒结算，互相之间没有协同。结果就是**局部人数优势无法兑现**：
 *    战线哪里薄哪里厚都一个死法，谁也压不垮谁，两条线就在中间僵住。
 *
 * 做法：加成挂在**挨打的人**身上（受伤加成），不是攻击者身上——
 *    被 N 个敌人同时攻击时受伤 ×(1 + K×(N-1))，N-1 封顶 GANG_CAP。
 *    这样薄的地方先破 → 破口两侧被包 → 战线弯折、旋转、推进，两翼包抄也终于有意义。
 *
 * 计数用**上一帧**的攻击者数（`atkers`）：伤害是在同一个循环里边遍历边结算的，
 * 当帧计数只会数到一半。差一帧对画面和数值都没有可觉察影响，但省掉一次全场两趟遍历。
 *
 * ⚠️ 这条会放大双方 sideBonus（八环）的差距——强的一方更容易形成局部围殴。
 *    所以 K 取小、封顶 3 人（最高 ×1.45），别往上调之前先看胜率分布有没有被推出 [0.8,1.2] 环带。
 */
const GANG_K = 0.15;
const GANG_CAP = 3;
/**
 * 软推挤：两个精灵靠得比这还近就互相推开（px）。
 * 🔴 这**不是**被禁的 fan-out 瞬移（那是一帧之内把人挪走、看着像闪现）——
 *    这里每帧只推几个像素，是人群自然挤开。挤不动的人沿接触面铺开，
 *    弧形战线和两翼包抄就是这么自己长出来的（主人 2026-08-11 提，帝国时代同款）。
 */
const SEP_DIST = 17;
/** 推开速度（px/秒）：要顶得住 130 的行军速度。实测 55 太小——仍有 17% 完全叠住，120 降到 3% */
const SEP_SPD = 120;
/** 推挤哈希格（= 推挤距离，一格只装一两个人，扫 3×3 很便宜） */
const CELL_S = 20;
/** 哈希键用数字不用字符串：每人每帧拼 9 次字符串 = 两万多次分配，实测是推挤慢的元凶 */
const HKEY = (gx: number, gy: number): number => (gx + 4096) * 8192 + (gy + 4096);
/** 近战哈希格 */
const CELL_M = 80;
/** 远程哈希格 */
const CELL_R = 220;

interface WarSpawn {
    f: 0 | 1;
    key: string;
    x: number;
    y: number;
    pool: number;
    /** 本口累计已出生精灵数（旗手判定：每满 FLAG_EVERY 出一面旗，按口平均分布，跨批不重置） */
    spawned: number;
}

interface WarMan {
    f: 0 | 1;
    key: string;
    x: number;
    y: number;
    tx: number;
    ty: number;
    hp: number;
    dir: number;
    ph: number;
    st: 0 | 1 | 2;
    foe: WarMan | null;
    next: number;
    fightT: number;
    aimT: number;
    /** 出场渐显剩余时间（秒） */
    fadeT: number;
    /** 出场渐显总时长（秒，出生时定死）：render 算 alpha 的分母，勿与 FADE_IN 硬编码混用 */
    fadeMax: number;
    /** 攻击动作交替标志：有冲锋组的兵种（象兵/弓骑）每轮出手翻转，两套攻击动作轮播 */
    atkFlip: boolean;
    /** 是否旗手（出生时定死，见 FLAG_EVERY）：头顶画一面势力旗，战死则军旗倒地 */
    flag: boolean;
    /**
     * 旗帜飘动的相位偏移（毫秒，出生时掷定不再变）。
     * 🔴 没有它十几面旗会**整齐划一地一起抖**：drawFlag 的帧索引是 floor(tick/150)%4，
     *    全场共用一个 tick。大地图一屏没几面旗所以从没暴露，13 里一方十几面就假得明显。
     *    ⚠️ 不能拿 m.ph 当偏移——那个每秒涨 8，会让旗越飘越快且随战斗状态变速。
     */
    fo: number;
    /** 上一帧同时打他的敌人数（围殴加成用；当帧计数见 atkNext） */
    atkers: number;
    /** 本帧累计的攻击者数，帧末结转给 atkers */
    atkNext: number;
    lock: number;
    atkSt: number;
}

/** 箭矢：远程每出一次手射一支（纯画面，伤害仍按秒结算，不改平衡） */
interface WarArrow {
    x: number;
    y: number;
    /** 单位方向向量 */
    dx: number;
    dy: number;
    /** 起点到目标的距离（飞完就消失） */
    len: number;
    t: number;
    dur: number;
    f: 0 | 1;
    /** 抛射物素材 key（PROJ_ARROW / PROJ_SPEAR / ...），决定画哪支箭 */
    proj: string;
    /** 连发发射延迟（秒）：t < delay 尚未射出（诸葛弩 3/5 支依次射）。 */
    delay?: number;
}

/** DE 抛射物素材缓存：一张横排 fly_0.png + _meta.json 的帧框/hotspot。 */
interface ProjAsset {
    img: HTMLImageElement | null;
    /** 帧数 */
    n: number;
    /** 每帧宽/高 */
    fw: number;
    fh: number;
    /** hotspot（旋转中心）相对帧左上角 */
    hx: number;
    hy: number;
}

/** 倒下的军旗：旗手战死后原地转倒 + 淡出（t 走到 FLAG_FALL 即移除） */
interface WarFallenFlag {
    x: number;
    y: number;
    f: 0 | 1;
    t: number;
    /** 沿用旗手的飘动相位，倒下瞬间不跳帧 */
    fo: number;
}

/** 场景树（静态装饰，不参与任何战斗逻辑）：树脚中心 = 屏幕坐标，画在最底层（不遮兵） */
interface SceneTree {
    x: number;
    y: number;
    /** 0=绿 1=橙 2=白 */
    kind: 0 | 1 | 2;
    /** 0..5 变体样式 */
    variant: number;
    /** 水平镜像（同一棵树图的正反两用，减少重复感；主人 2026-08-12） */
    flip: boolean;
    img: HTMLImageElement | null;
}

/**
 * 场景云（飘动装饰，不参与任何战斗逻辑）。
 * 🔴 层级与树/湖**完全相反**：树湖垫在最底层不遮兵，云盖在**最上层**半透明飘过。
 *    俯视视角下云在人上面才是对的 —— 别套树湖那套"画在底层"的规矩。
 */
interface SceneCloud {
    x: number;
    y: number;
    /** 水平漂移速度（px/秒，可正可负） */
    vx: number;
    alpha: number;
    img: HTMLImageElement | null;
}

/** 场景湖（贴地水域装饰，不参与任何战斗逻辑）：中心 = 屏幕坐标，画在最底层 */
interface SceneLake {
    x: number;
    y: number;
    /** 水平镜像（同一张湖图的正反两用，减少重复感） */
    flip: boolean;
    img: HTMLImageElement | null;
}

/** 兵刃碰撞火花：两军近战交锋时在交界处产生的微弱火星 */
interface WarSpark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    t: number;
    dur: number;
    color: string;
    size: number;
}

interface WarCorpse {
    x: number;
    y: number;
    f: 0 | 1;
    key: string;
    dir: number;
    t: number;
    /**
     * 已烙标记：true = 已烙进地面（待移除）。corpses 里只剩「确定保留」的尸体，
     * 死亡动画播完即烙。留不留由 pushCorpse 在死亡时裁定。见 CORPSE_KEEP。
     */
    keep?: boolean;
}

/** 溃逃兵（不保留尸体的那部分）：反向移动 + 渐隐，模拟逃跑（主人 2026-08-16） */
interface WarFleer {
    x: number; y: number;
    f: 0 | 1;
    key: string;
    dir: number;   // 逃跑朝向（背离战场）
    ph: number;    // 跑动动画相位
    t: number;     // 已逃跑时间
    vx: number;    // 逃跑速度向量
    vy: number;
}

/** 帧素材缓存：key -> { fh, frames, sets: {move,atk,die,melee}[faction][dir] } */
interface WarBank {
    /** 帧高（S10DB 所有动作共享同一帧框高度；DE 动态帧框不依赖此值，见 dyn） */
    fh: number;
    /** 各动作的帧数（S10DB=8，AoE2 武士/弓手=30~60；缺失兜底 8） */
    frames: Record<string, number>;
    /** 抠绿 + SpriteTinter 染色后的帧带（[阵营][朝向]） */
    sets: Record<string, CanvasImageSource[][]>;
    /**
     * DE 动态帧框元数据（有此项 = 走 AoE2 DE 的 hotspot 对齐渲染，无此项 = S10DB 正方形帧）。
     * 结构：{ slot: { dir: { fw, fh, hx, hy } } }，slot ∈ move/atk/die/idle/melee/charge，
     * fw/fh = 该动作该方向的 box 尺寸，hx/hy = hotspot(canvas中心) 在 box 里的位置。
     * 渲染时把 hotspot 对齐单位位置，脚底随动作浮动（AoE2 原生），不再脚底对齐。
     */
    dyn?: Record<string, Record<string, { fw: number; fh: number; hx: number; hy: number }>>;
}

export interface Scene13WarInit {
    /** 攻方文化区 */
    attackerRegion: string;
    /** 守方文化区 */
    defenderRegion: string;
    /** 攻方势力 id（取势力本色染色） */
    attackerFactionId: string | null;
    /** 守方势力 id（取势力本色染色） */
    defenderFactionId: string | null;
    /** 攻方总兵力 */
    attackerTroops: number;
    /** 守方总兵力 */
    defenderTroops: number;
    /** [2026-08-11] 每兵总加成（八环战力比除掉兵力后的部分，作用在伤害上）；缺省 1 = 无加成 */
    attackerBonus?: number;
    defenderBonus?: number;
    /** 战场中心坐标（树/湖季节按海拔判定用；由 GameAppCombatHooks 传入） */
    centerLat?: number;
    centerLng?: number;
}

export class Scene13WarLayer {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private active = false;
    /**
     * 残局待命中（战斗已结束、场景还没退的那 5 秒）。
     * active=false 但仍逐帧渲染：士兵播待命帧、旗帜飘、云走、尸体渐隐。见 beginLinger()。
     */
    private lingering = false;
    private spawns: WarSpawn[] = [];
    private men: WarMan[] = [];
    private corpses: WarCorpse[] = [];
    private fleers: WarFleer[] = [];
    private arrows: WarArrow[] = [];
    private sparks: WarSpark[] = [];
    private fallenFlags: WarFallenFlag[] = [];
    /** 场景树装饰（start 时随机布景，stop 清空） */
    private trees: SceneTree[] = [];
    /** 场景湖装饰（start 时随机布景，stop 清空） */
    private lakes: SceneLake[] = [];
    /** 场景云（最上层飘动装饰，与树/湖层级相反） */
    private clouds: SceneCloud[] = [];
    /** 本场季节（0=绿夏 1=橙秋 2=白冬）：start 时定一次，树/湖全场统一，禁混季 */
    private sceneSeason: 0 | 1 | 2 = 0;
    /** 战场中心坐标（海拔判定用；start 时从 init 读） */
    private centerLat: number | undefined;
    private centerLng: number | undefined;
    /**
     * 地面图（尸体永久层）。🔴 主人 2026-08-11「保留所有尸体」：
     * 一场打下来双方共 6000 个精灵，全留成活动尸体的话每帧要多画 6000 个、还要参与排序。
     * 所以死亡动画播完就把最后一帧**烙**进这张图，之后每帧只 drawImage 一次，开销恒定。
     * 代价：窗口 resize 会丢失已烙的尸体（画布尺寸变了，位置无从换算）。
     */
    private ground: HTMLCanvasElement | null = null;
    private groundCtx: CanvasRenderingContext2D | null = null;
    private over = false;
    private bank: Record<string, WarBank> = {};
    /** DE 抛射物素材缓存（箭/标枪/飞镖/飞斧/火箭）：key -> ProjAsset */
    private projBank: Record<string, ProjAsset> = {};
    private pending = 0;
    /** [2026-08-11 防死锁] 素材加载开始时间戳（pending 卡死 10s 强制判负用） */
    private pendingStartedAt = 0;
    private enemyCen: ({ x: number; y: number } | null)[] = [null, null];
    private gm = new Map<number, WarMan[]>();
    private gr = new Map<number, WarMan[]>();
    private gs = new Map<number, WarMan[]>();
    private last = performance.now();
    /** [2026-08-11 势力本色] 攻/守双方染色 rgba（start 时按 factionId 解析） */
    private sideFaction: [string, string] = ['', ''];
    /**
     * 每兵总加成（攻/守），乘在伤害上。把战略层的强弱带进 13 —— 将领、精锐、武将技、
     * 文化、运气都在里面（兵力已除掉，它由精灵数量体现）。兵种相克不受影响：
     * 三类的相对关系不变，只是整体强弱平移。
     */
    private sideBonus: [number, number] = [1, 1];
    /** 成批增援冷却（秒），一次只补一边所以单值 */
    private batchCd = 0;
    /** 开场列阵待命剩余时间（秒）：阶段内全军静止渐显，结束才开打（主人 2026-08-16） */
    private deployT = 0;
    /** 开局总兵力（精灵），攻/守各一 —— 补兵触发线按「剩余占比」缩放时当分母 */
    private initPool: [number, number] = [1, 1];
    /** 尸体保留累加器（攒够 1 留一具）：确定性均匀，不随机斑驳。见 CORPSE_KEEP */
    private corpseAcc = 0;

    /** 演出判负回调（winner: 'attacker' | 'defender'）——由 GameAppCombatHooks 接 */
    public onDecision: ((winner: 'attacker' | 'defender', survivors: { attacker: number; defender: number }) => void) | null = null;

    /** 挂到 body（全屏透明 canvas，叠在地图 DOM 之上；透明像素不遮挡地图，只画精灵） */
    public attach(): void {
        if (this.canvas) return;
        const cv = document.createElement('canvas');
        cv.style.cssText = 'position:fixed;inset:0;z-index:400;pointer-events:none;display:none;';
        cv.width = window.innerWidth;
        cv.height = window.innerHeight;
        document.body.appendChild(cv);
        this.canvas = cv;
        this.ctx = cv.getContext('2d', { alpha: true });
        this.ground = document.createElement('canvas');
        this.ground.width = cv.width;
        this.ground.height = cv.height;
        this.groundCtx = this.ground.getContext('2d', { alpha: true });
        const onResize = () => {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            if (this.ground) {
                this.ground.width = this.canvas.width;
                this.ground.height = this.canvas.height;   // 尺寸一变内容即清空（已烙的尸体丢失）
            }
        };
        window.addEventListener('resize', onResize);
    }

    public isActive(): boolean {
        return this.active;
    }

    /**
     * 演出的实时兵力（人，不是精灵）：场上活着的 + 出兵口没出的，1 精灵 = SPRITE_TROOPS 兵。
     * 供战斗面板显示用 —— 13 期间引擎被冻结，`unit.troops` 是不动的，
     * 面板不接这里就会出现「屏幕上人一直在死、血槽数字纹丝不动」（主人 2026-08-11 提）。
     */
    public getLiveTroops(): { attacker: number; defender: number } | null {
        // 🔴 残局待命（active=false、lingering=true）也必须继续供数，否则战斗一结束
        //    面板会瞬间掉回引擎那套冻结数值 —— 观感就是「数字突然换了个来源」（主人 2026-08-12 实锤）。
        if (!this.active && !this.lingering) return null;
        const n = [0, 0];
        for (const sp of this.spawns) n[sp.f] += Math.max(0, sp.pool);
        for (const m of this.men) if (m.hp > 0) n[m.f]++;
        return { attacker: Math.round(n[0] * SPRITE_TROOPS), defender: Math.round(n[1] * SPRITE_TROOPS) };
    }

    /**
     * 开局总兵力（人），供战斗面板算演出进度用（已消耗占比 → 三幕节奏）。
     * 🔴 引擎在 13 期间是冻结的，`elapsed` 恒为 0，面板不能再用它算进度 —— 见 CombatUI 的说明。
     */
    public getInitialTroops(): { attacker: number; defender: number; total: number } | null {
        if (!this.active && !this.lingering) return null;
        const a = Math.round(this.initPool[0] * SPRITE_TROOPS);
        const d = Math.round(this.initPool[1] * SPRITE_TROOPS);
        return { attacker: a, defender: d, total: a + d };
    }

    /** 战斗开始 → 初始化出兵口（编制槽位派生）+ 开始加载素材 */
    public start(init: Scene13WarInit): void {
        this.attach();
        this.active = true;
        this.over = false;
        this.spawns = [];
        this.men = [];
        this.corpses = [];
        this.fleers = [];
        this.arrows = [];
        this.fallenFlags = [];
        this.trees = [];
        this.lakes = [];
        this.clouds = [];
        this.clearGround();
        // [2026-08-16 修·进 13 闪旧尸体] 主画布同步清空：stop 只隐藏 canvas 不清内容，
        // start 后素材加载期 pending>0 → tick 不 render，会把上一场最后一帧（含尸体）亮出来。
        if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.bank = {};
        this.pending = 0;
        this.pendingStartedAt = 0;   // 防死锁计时重置（新战斗重新计 10s）
        this.enemyCen = [null, null];
        this.gm = new Map();
        this.gr = new Map();
        this.gs = new Map();
        this.last = performance.now();

        const cv = this.canvas;
        if (cv) { cv.style.display = 'block'; }

        // [2026-08-16 主人需求] 进入 13 战斗模式后，军团面板和军情面板自动收起
        const game = (window as any).game;
        if (game?.cameraFollowUI) {
            game.cameraFollowUI.closeList();
        }
        if (game?.brawlFeedPanel) {
            game.brawlFeedPanel.setExpanded(false);
        }

        // [2026-08-11 势力本色] 攻守双方交给主游戏的 SpriteTinter 按 factionId 染色，
        // 与地图上的军团、旗帜、领土同一套色，不另起炉灶。
        const nextFaction: [string, string] = [
            init.attackerFactionId ?? '',
            init.defenderFactionId ?? '',
        ];
        // 🔴 换势力必须清素材缓存：bank 里存的是**已染色**的帧，上一场的颜色会带到下一场
        if (nextFaction[0] !== this.sideFaction[0] || nextFaction[1] !== this.sideFaction[1]) {
            this.bank = {};
            this.pending = 0;
        }
        this.sideFaction = nextFaction;
        this.sideBonus = [init.attackerBonus ?? 1, init.defenderBonus ?? 1];
        this.batchCd = 0;
        this.deployT = DEPLOY_SECS;
        this.centerLat = init.centerLat;
        this.centerLng = init.centerLng;

        try {
            // 攻守各一侧：row 0 最靠中线（攻方在左、守方在右）
            const sides: { region: string; troops: number; f: 0 | 1 }[] = [
                { region: init.attackerRegion, troops: init.attackerTroops, f: 0 },
                { region: init.defenderRegion, troops: init.defenderTroops, f: 1 },
            ];
            const VW = cv?.width ?? 1920;
            const VH = cv?.height ?? 1080;
            const mx = Math.max(60, VW * 0.07);
            const depth = Math.min(150, VW * 0.075);
            const midY = VH / 2;
            const spanY = VH * 0.80;

            for (const side of sides) {
                const lanes = this.slotsOf(side.region);
                const n = lanes.length;
                const mode = this.formationModeOf(side.region);
                // 🔴 前中后固定（主人 2026-08-15 定）：不再随机换序，出兵口顺序 = 编制槽位展开序
                //    （鱼鳞 步骑弓 / 三角 近战+远程+近战 / 雁行 远程+近战+远程）。
                const lanes2 = lanes;
                // 兵力按总量平分到各口（1 精灵 = SPRITE_TROOPS 兵；口少的一边每口出得快）
                const poolPer = Math.max(1, Math.round(side.troops / SPRITE_TROOPS / n));
                lanes2.forEach((lane, idx) => {
                    const key = lane.key;
                    this.ensureType(key);
                    // 布局：row 0 最靠中线（越靠前越深入敌阵）；三阵型 9 口走 LAYOUT 查找表
                    const cell = LAYOUT[mode][idx];
                    const back = mx + (2 - cell.row) * depth;
                    const x = side.f === 0 ? back : VW - back;
                    // 阵型间距 spanY/3
                    const y = midY + (cell.col - (cell.cols - 1) / 2) * (spanY / 3);
                    this.spawns.push({
                        f: side.f, key, x, y,
                        pool: poolPer,
                        spawned: 0,
                    });
                });
            }
            // 开局总兵力存档（精灵），供 getInitialTroops 回写战斗面板演出进度用
            this.initPool = [0, 1].map(f =>
                Math.max(1, this.spawns.reduce((n, s) => n + (s.f === f ? s.pool : 0), 0)),
            ) as [number, number];

            // 场景布景：湖先定（树要避开水域），再撒树；三色（夏/秋/冬）× 六变体随机，
            // 位置避开中央对攻走廊与出兵口
            this.scatterLakes(VW, VH);
            this.scatterTrees(VW, VH);
            this.scatterClouds(VW, VH);
        } catch (e) {
            // 🔴 初始化失败 → 立即停演并解冻（不让 active=true + spawns 残缺 → 战斗永不结束、
            //    跟随军团永远不动）。走 forceResultByRatio 判负通道：它调 onDecision →
            //    Hooks 的 forceScene13Result → 解冻 + 引擎结算，战斗正常收尾。
            console.error('[Scene13WarLayer] start 初始化失败（已停演并判负解冻）:', e);
            this.active = false;
            this.forceResultByRatio(1);
        }
    }

    /**
     * [2026-08-11 防死锁] 素材卡死/演出异常时强制判负（绝不永冻引擎）。
     * 按当前兵力比判：守方（f=1）吃 homeDiscount（城防/主场）折扣。
     * 走 onDecision 正常通道（→ forceScene13Result → 解冻 + 结算），
     * 与演出自然判负完全同链路，只是赢家按兵力比估算。
     */
    private forceResultByRatio(homeDiscount: number): void {
        if (this.over || !this.onDecision) {
            // 没有回调（演出层没接）→ 至少把自己停掉，别留 canvas
            this.stop('防死锁（无回调）');
            return;
        }
        const alive = [0, 0];
        for (const s of this.spawns) alive[s.f] += Math.max(0, s.pool);
        for (const m of this.men) if (m.hp > 0) alive[m.f]++;
        const att = Math.max(1, alive[0]);
        const def = Math.max(1, alive[1] * homeDiscount);
        const attackerWins = att > def;
        this.over = true;
        console.warn(`🏁 [Scene13War] 防死锁判负：攻 ${alive[0]} 守 ${alive[1]}（守方×${homeDiscount}）→ ${attackerWins ? '攻方胜' : '守方胜'}`);
        this.onDecision(
            attackerWins ? 'attacker' : 'defender',
            { attacker: Math.round(alive[0] * SPRITE_TROOPS), defender: Math.round(alive[1] * SPRITE_TROOPS) },
        );
    }

    /**
     * 演出结束（战斗被外部终结）→ 清场。
     * @param keepFrame 战败停留用：true = 保留最后一帧画面（canvas 不隐藏、尸体烙图不丢），
     *   只停逻辑（men/spawns 清空）——13 画面冻结在战场残局，直到 linger 到期 exit 才真正清场。
     *   正常结束（胜方画面）默认 false 直接清空。
     */
    /**
     * 战斗结束 → 进入**残局待命**（主人 2026-08-12：「这 5 秒我的意思是全军待命动作、旗帜依然飘扬」）。
     *
     * 🔴 修前这里调的是 `stop(..., keepFrame=true)`：演出被整个停掉、数组清空，
     *    画布上只剩最后渲染的**那一张静止帧** —— 所以看着像卡死（主人实锤）。
     * 现在改成：`active=false`（战斗逻辑全停：不索敌、不掉血、不死人、不补兵，
     * 且 isActive() 返回 false，跟拍切换那套判据行为不变），但 `lingering=true`
     * 让 tick 继续跑 —— 士兵播待命帧、旗帜继续飘、云继续走、尸体继续渐隐。
     */
    public beginLinger(): void {
        if (!this.active) return;
        this.active = false;
        this.lingering = true;
    }

    /** 残局待命的每帧推进：只推动画，不推战斗 */
    private lingerStep(dt: number): void {
        // 待命动作（8 帧循环，与战斗时同速）
        for (const m of this.men) m.ph += dt * 8 / 1.5;
        // 尸体照常推进：死亡动画播完烙地面
        for (const c of this.corpses) {
            c.t += dt;
            if (c.keep !== true && c.t >= DEATH_ANIM) {
                this.bakeCorpse(c);
                c.keep = true;
            }
        }
        this.corpses = this.corpses.filter(c => c.keep !== true);
        // 溃逃兵继续跑 + 渐隐
        for (const f of this.fleers) {
            f.t += dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.ph += dt * 8;
        }
        this.fleers = this.fleers.filter(f => f.t < FLEE_DUR);
        // 倒下的军旗继续淡出
        for (const ff of this.fallenFlags) ff.t += dt;
        this.fallenFlags = this.fallenFlags.filter(ff => ff.t < FLAG_FALL);
        // 云继续飘（旗帜的飘动用的是 performance.now()，本来就不受这里影响）
        if (this.clouds.length && this.canvas) {
            const vw = this.canvas.width;
            for (const c of this.clouds) {
                c.x += c.vx * dt;
                const w = (c.img?.naturalWidth ?? 600) * CLOUD_SCALE;
                if (c.x > vw + w) c.x = -w;
            }
        }
    }

    public stop(reason = 'unknown', keepFrame = false): void {
        this.lingering = false;
        if (this.active) {
            // [2026-08-11 诊断] 谁把演出停掉的。over=false 还被停 = 外部提前收场
            let field = 0, pool = 0;
            for (const m of this.men) if (m.hp > 0) field++;
            for (const sp of this.spawns) pool += Math.max(0, sp.pool);
            console.warn(`⏹️ [Scene13War] 停止（${reason}）：演出已判负=${this.over} 场上${field}精灵 池${Math.round(pool)}精灵`);
        }
        this.active = false;
        this.spawns = [];
        this.men = [];
        this.corpses = [];
        this.fleers = [];
        this.arrows = [];
        this.fallenFlags = [];
        this.trees = [];
        this.lakes = [];
        this.clouds = [];
        if (!keepFrame && this.canvas) {
            this.canvas.style.display = 'none';
        }
    }

    // ── 出兵口 = 编制槽位（getCultureTier(...).slots 展开）──
    /**
     * 返回出兵口序列（主游戏编制槽位展开，不手抄）：
     *   - 三阵型（鱼鳞 3×3 / 三角 2+3+4 / 雁行 4+3+2）展开后均为 9 口，展开序 = 前/中/后三排
     * 口内 key 为兵种 id，与 UNIT_ASSETS 键一致。
     */
    private slotsOf(region: string): { key: string }[] {
        try {
            const tier = getCultureTier(region as any, 50000);
            if (tier?.slots?.length) {
                const types = expandCompositionSlots(tier.slots);
                // 三阵型展开均为 9 口
                if (types.length === 9) {
                    // 🔴 防御：WAR_TYPES 没有的兵种（势力专属/新兵种）替换成轻步，防运行时 wt.cls 崩溃
                    return types.map((key) => ({
                        key: WAR_TYPES[key] ? key : 'light_infantry',
                    }));
                }
            }
        } catch (e) {
            console.warn('[Scene13WarLayer] 编制槽位派生失败，回退 3×3 默认:', e);
        }
        return [
            { key: 'light_infantry' }, { key: 'light_infantry' }, { key: 'light_infantry' },
            { key: 'lancer' }, { key: 'general_cavalry' }, { key: 'lancer' },
            { key: 'archer' }, { key: 'archer' }, { key: 'archer' },
        ];
    }

    /** 从编制槽位结构推断阵型（鱼鳞/三角/雁行）；与 slotsOf 用同一 tier，保证布局一致 */
    private formationModeOf(region: string): FormationMode {
        try {
            const tier = getCultureTier(region as any, 50000);
            if (tier?.slots?.length) {
                return inferFormationModeFromSlots(tier.slots);
            }
        } catch (e) {
            console.warn('[Scene13WarLayer] 阵型推断失败，回退鱼鳞:', e);
        }
        return 'square';
    }

    // ── 场景树/湖：随机布景 + 加载（纯装饰，不参与战斗逻辑，也不进 pending）──
    /**
     * 随机分布湖：**本场季节一张**（夏/秋/冬三选一，由 scatterLakes 开头按游戏日历定，树/湖同季）：
     * - 每场 1–2 个（主人 2026-08-12：每局1-2个即可）
     * - 避开中央对攻走廊与出兵口
     * - 湖与湖之间留距（不叠成一大片）
     * 湖是贴地水域，画在最底层（ground 之下），不参与 y 深度排序。
     */
    private scatterLakes(VW: number, VH: number): void {
        this.sceneSeason = this.currentSeasonKind();
        const lakeWant = 1 + ((Math.random() * 2) | 0);   // 1 或 2 个湖
        let guard = 0;
        while (this.lakes.length < lakeWant && guard++ < 200) {
            const x = LAKE_W * 0.6 + Math.random() * (VW - LAKE_W * 1.2);
            const y = LAKE_H * 0.6 + Math.random() * (VH - LAKE_H * 1.2);
            // 🔴 不避中央（2026-08-12 主人：不用避开中央）——湖/树在最底层不遮兵，全屏随机
            if (this.spawns.some(s => (s.x - x) ** 2 + (s.y - y) ** 2 < 140 ** 2)) continue;
            if (this.lakes.some(l => (l.x - x) ** 2 + (l.y - y) ** 2 < (LAKE_W * 0.7) ** 2)) continue;
            this.lakes.push({ x, y, flip: Math.random() < 0.5, img: null });
        }
        for (const lk of this.lakes) this.ensureLake(lk);
    }

    /**
     * 本场树/湖季节 = **战场真实海拔**（主人 2026-08-12 定「应该根据海拔」）：
     *   ≥2500m（高原/高山，如青藏/帕米尔）→ 白(2)
     *   600–2500m（山地/高原边缘，如云贵/东北/高加索）→ 橙(1)
     *   <600m（低地/平原）→ 绿(0)     [600m = LandTerrainSystem.MOUNTAIN_ELEVATION_M 同源]
     * 数据源 = 项目现成 ElevationSampler（Terrarium 高程瓦片 + LRU 缓存）：
     *   - 瓦片已缓存 → 同步命中，直接定色
     *   - 未缓存 → 后台拉取 + 日历季节兜底（装饰绝不等待网络）
     * 无坐标/采样失败（防御）→ 日历季节：春/夏绿、秋橙、冬白。
     */
    private currentSeasonKind(): 0 | 1 | 2 {
        if (this.centerLat !== undefined && this.centerLng !== undefined) {
            try {
                const sampler = LandSeaSystem.getSampler();
                const elev = sampler.getElevationSync(this.centerLat, this.centerLng);
                if (elev !== null) {
                    if (elev >= 2500) return 2;   // 高原 → 白
                    if (elev >= 600) return 1;    // 山地 → 橙
                    return 0;                     // 低地 → 绿
                }
                sampler.scheduleFetch(this.centerLat, this.centerLng);   // 预取，下局命中
            } catch (e) {
                // 采样异常 → 走日历兜底
            }
        }
        const ts = (window as any).game?.timeSystem;
        const season = typeof ts?.getSeason === 'function' ? ts.getSeason() : 0;
        if (season === 3) return 2;   // 冬 → 白
        if (season === 2) return 1;   // 秋 → 橙
        return 0;                     // 春/夏/未知 → 绿
    }

    /** 加载单湖素材（本季一张；纯装饰：失败就少一个湖，绝不进 pending） */
    private ensureLake(lk: SceneLake): void {
        const im = new Image();
        im.onload = () => { lk.img = im; };
        im.src = LAKE_BASE_URL + (this.sceneSeason + 1) + '/1.png';
    }

    /**
     * 随机布云：全屏散开，各自随机方向漂移。云没有季节，10 张随机取。
     * 🔴 云在**最上层**，所以位置不用避开出兵口/湖/树 —— 它本来就该盖在什么上面都行。
     */
    private scatterClouds(VW: number, VH: number): void {
        for (let i = 0; i < CLOUD_COUNT; i++) {
            const c: SceneCloud = {
                x: Math.random() * VW,
                y: Math.random() * VH,
                // 🔴 一律**从左往右**（主人 2026-08-12）：全场风向必须一致 ——
                //    攻方 f=0 永远在左（出兵口 x = f===0 ? back : VW-back），所以「左→右」
                //    就是「攻方→守方」；旗帜固定 row 5 走 facingLeft 分支、旗面画在杆的右侧，
                //    也是向右飘。云和旗同向，风向才成立。**别改回随机方向。**
                vx: CLOUD_SPD_MIN + Math.random() * (CLOUD_SPD_MAX - CLOUD_SPD_MIN),
                alpha: CLOUD_ALPHA_MIN + Math.random() * (CLOUD_ALPHA_MAX - CLOUD_ALPHA_MIN),
                img: null,
            };
            this.clouds.push(c);
            this.ensureCloud(c);
        }
    }

    /** 加载单朵云（纯装饰：失败就少一朵，绝不进 pending） */
    private ensureCloud(c: SceneCloud): void {
        const im = new Image();
        im.onload = () => { c.img = im; };
        im.src = CLOUD_BASE_URL + CLOUD_FILES[(Math.random() * CLOUD_FILES.length) | 0] + '.png';
    }

    /**
     * 随机分布树木：**本场季节统一**（绿夏 / 橙秋 / 白冬，随游戏日历，与湖同季，全场一个色系，禁混季）：
     * - **不避中央**（主人 2026-08-12：树在最底层不遮兵，全屏随机即可）
     * - 避开出兵口（太近会盖住出生中的兵）
     * - 避开湖（湖是水域，树不长在水里）
     * 树脚（图底）中心为锚点。**不参与 y 深度排序**——树固定画在尸体层之下，永远不遮士兵。
     */
    private scatterTrees(VW: number, VH: number): void {
        // 🔴 [2026-08-12 主人实机否决「森林板块占半个战场」] 6 变体全用，但**按尺寸分两类撒**：
        //   小变体（1/3/4/5，最大 187px）= 单棵树/小树丛 → 全场随机，每种 1–2 棵。
        //   大变体（2/6，707×374）= **远景森林板块，不是树** → 只压画面上下边缘带、每场最多一块。
        // 病根：把 707px 的林地板块和 184px 的单棵树丢进同一个池子按同样规则撒，
        //   一场出现 2–4 块就盖掉半个可战区；而且树画在士兵层之下（主人定的不遮兵），
        //   单棵小树看不出来，一整片林冠被人踩在脚下就非常穿帮。
        for (const variant of TREE_VARIANTS) {
            const isSlab = TREE_SLAB_VARIANTS.has(variant);
            const want = isSlab
                ? (Math.random() < 0.5 ? 1 : 0)          // 大板块：一半概率来一块，可以没有
                : 1 + ((Math.random() * 2) | 0);         // 小树：1–2 棵
            let got = 0;
            let guard = 0;                                // 🔴 每个变体各自计数：共享会让后面的变体一棵都摆不出
            while (got < want && guard++ < 60) {
                const x = 40 + Math.random() * (VW - 80);
                // 大板块只落在上下边缘带（各占画面高度的 TREE_SLAB_BAND），中间主战区留给战斗
                const y = isSlab
                    ? (Math.random() < 0.5
                        ? Math.random() * VH * TREE_SLAB_BAND
                        : VH - Math.random() * VH * TREE_SLAB_BAND)
                    : 50 + Math.random() * (VH - 150);
                if (this.spawns.some(s => (s.x - x) ** 2 + (s.y - y) ** 2 < 120 ** 2)) continue;
                if (this.lakes.some(l => Math.abs(l.x - x) < LAKE_W * 0.6 && Math.abs(l.y - y) < LAKE_H * 0.55)) continue;
                const t: SceneTree = {
                    x, y,
                    kind: this.sceneSeason,
                    variant,
                    flip: Math.random() < 0.5,
                    img: null,
                };
                this.trees.push(t);
                this.ensureTree(t);
                got++;
            }
        }
    }

    /** 加载单棵树素材。🔴 树是纯装饰：加载失败就少一棵，绝不进 pending（素材卡死不能拖累演出/引擎） */
    private ensureTree(t: SceneTree): void {
        const im = new Image();
        im.onload = () => { t.img = im; };
        im.src = TREE_BASE_URL + (t.kind + 1) + '/' + (t.variant + 1) + '.png';
    }

    // ── 素材：按需加载 + 去绿幕 + 染色（同 __war.html / 主游戏启动管线）──
    private dechroma(img: HTMLImageElement): HTMLCanvasElement {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext('2d', { willReadFrequently: true })!;
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
        for (let i = 0; i < p.length; i += 4) {
            if (p[i + 1] > 150 && p[i] < 110 && p[i + 2] < 110) p[i + 3] = 0;
        }
        g.putImageData(d, 0, 0);
        return c;
    }


    /** 读 AoE2 DE 素材的 `_meta.json`（帧数 + 每方向 box 尺寸/hotspot 偏移），映射到 slot。 */
    private async loadDynMeta(dir: string): Promise<{ dyn: NonNullable<WarBank['dyn']>; frames: Record<string, number> } | null> {
        try {
            const res = await fetch(`${dir}_meta.json`);
            if (!res.ok) return null;
            const meta: any = await res.json();
            const dyn: NonNullable<WarBank['dyn']> = {};
            const frames: Record<string, number> = {};
            // _meta.json 的 action 键 → slot；melee/charge 复用 attack 的元数据。
            const map: Record<string, string[]> = {
                idle: ['idle'], move: ['move'], attack: ['atk', 'melee', 'charge'], death: ['die'],
            };
            for (const [act, slots] of Object.entries(map)) {
                if (!meta[act]) continue;
                for (const slot of slots) { dyn[slot] = meta[act].dirs; frames[slot] = meta[act].frames; }
            }
            return { dyn, frames };
        } catch { return null; }
    }

    private ensureType(key: string): void {
        if (this.bank[key]) return;
        try {
            const assets = (SPRITE_PATHS.UNIT_ASSETS as Record<string, any>)[key];
            if (!assets) { this.bank[key] = { fh: 84, frames: {}, sets: { move: [[], []], atk: [[], []], die: [[], []], melee: [[], []], charge: [[], []], idle: [[], []] } }; return; }
            const b: WarBank = { fh: 84, frames: {}, sets: { move: [[], []], atk: [[], []], die: [[], []], melee: [[], []], charge: [[], []], idle: [[], []] } };
            // 🔴 AoE2 DE 动态帧框：读 `_meta.json`（帧数 + hotspot 偏移），渲染走 hotspot 对齐。
            const _firstUrl: string = (assets.MOVE?.[0] ?? assets.ATTACK?.[0] ?? assets.IDLE?.[0] ?? assets.DEATH?.[0] ?? '') as string;
            const isDE = DE_DYN_DIRS.some(dir => _firstUrl.includes(dir));
            if (isDE) {
                const dir = _firstUrl.substring(0, _firstUrl.lastIndexOf('/') + 1);
                this.pending++;
                this.loadDynMeta(dir).then(meta => {
                    if (meta) { b.dyn = meta.dyn; Object.assign(b.frames, meta.frames); }
                    this.pending--;
                }).catch(() => { this.pending--; });
            }
            const ranged = RANGED_TYPES.has(key);
            // 远程：atk = SHOOT（射击 +40），melee = ATTACK（近战 +8）；近战/骑兵：atk = ATTACK
            // 冲锋组：**象兵 637-644 / 弓骑 688-695**（2026-08-11 主人口述）。
            // 🔴 冲锋属于「进攻的一种」，所以攻击时在**攻击帧和冲锋帧之间来回切**，
            //    不是拿它当赶路动画（我一度把突骑赶路改成冲锋，被主人纠正）。
            const groups: [string, string[]][] = [
                ['move', assets.MOVE ?? []],
                ['atk', ranged ? (assets.SHOOT ?? assets.ATTACK ?? []) : (assets.ATTACK ?? [])],
                ['melee', ranged ? (assets.ATTACK ?? []) : []],
                ['die', assets.DEATH ?? []],
                ['charge', assets.CHARGE ?? []],
                // 待命帧：战斗结束后的 5 秒残局用（全军待命，见 beginLinger）
                ['idle', assets.IDLE ?? []],
            ];
            for (const [slot, urls] of groups) {
                if (!urls.length) continue;
                for (let d = 0; d < 8; d++) {
                    const url = urls[d % urls.length];
                    if (!url) continue;
                    this.pending++;
                    const im = new Image();
                    im.onload = () => {
                        // 🔴 全程 try-catch：onload 是异步回调，外层 catch（547 行）抓不到这里抛的异常。
                        //    若 dechroma/getTintedSprite 异常导致 pending 不减，tick 会永久卡在
                        //    `pending > 0` → 演出冻结、战斗面板数字不动（主人 2026-08-11 截图实锤
                        //    「松山攻防战进了 13 但界面不动」的根因候选）。
                        try {
                            // 抠绿 → 转回 Image → 交给主游戏的 SpriteTinter 染色。
                            // 🔴 不能自己「盖一层半透明势力色」：那会把贴图洗白、并和素材底色混成脏色
                            //    （主人 2026-08-11 截图实锤「色不正」，一军发紫一军发黄）。
                            //    SpriteTinter 才是正牌链路（主战场军团同款，LegionPhalanxDrawer:1259）：
                            //    它保护高光（金属不发假）、保护黑色轮廓（兵不隐身）、用灰度混合去掉素材底色。
                            // 🔴 上策：抠绿 + Base64 跨战斗缓存（DECROMA_CACHE）。第二次同素材直接复用，
                            //    跳过最耗时的 getImageData 逐像素抠绿 + PNG 编码；染色仍走现链路（势力色每局变）。
                            let dataUrl = DECROMA_CACHE.get(url);
                            if (!dataUrl) {
                                const base = this.dechroma(im);
                                dataUrl = base.toDataURL();
                                DECROMA_CACHE.set(url, dataUrl);
                            }
                            const clean = new Image();
                            // [2026-08-15 玩家色遮罩] 抠绿后 src 变 data: URL，保留源路径供 SpriteTinter 推导 `.pc.png`。
                            (clean as any).sourceUrl = url;
                            clean.onload = () => {
                                try {
                                    // DE 动态帧框：帧数/hotspot 已由 loadDynMeta 的 _meta.json 填好，这里不再从宽高推（非正方形 box 会算错）。
                                    if (!isDE) {
                                        b.fh = clean.naturalHeight;
                                        // [2026-08-15 全帧修复] 帧数 = 宽/高（每帧正方形），各动作独立：
                                        //   S10DB 横排 8 帧不变；AoE2 武士/弓手 30~60 帧也正确切。
                                        b.frames[slot] = clean.naturalWidth / clean.naturalHeight;
                                    }
                                    b.sets[slot][0][d] = SpriteTinter.getTintedSprite(clean, this.sideFaction[0]);
                                    b.sets[slot][1][d] = SpriteTinter.getTintedSprite(clean, this.sideFaction[1]);
                                } catch (e) {
                                    console.warn('[Scene13WarLayer] 染色失败（回退空帧）:', key, slot, d, e);
                                }
                                this.pending--;
                            };
                            clean.onerror = () => { this.pending--; };
                            clean.src = dataUrl;
                        } catch (e) {
                            console.warn('[Scene13WarLayer] 抠绿失败（回退空帧）:', key, e);
                            this.pending--;
                        }
                    };
                    im.onerror = () => { this.pending--; };
                    im.src = url;
                }
            }
            this.bank[key] = b;
        } catch (e) {
            console.warn('[Scene13WarLayer] 素材加载失败（回退空帧）:', key, e);
            this.bank[key] = { fh: 84, frames: {}, sets: { move: [[], []], atk: [[], []], die: [[], []], melee: [[], []], charge: [[], []], idle: [[], []] } };
        }
    }

    /** 读 DE 抛射物 `_meta.json`（帧数 + 帧框 + hotspot）。 */
    private async loadProjMeta(dir: string): Promise<{ frames: number; box_w: number; box_h: number; anchor_x: number; anchor_y: number } | null> {
        try {
            const res = await fetch(`${dir}_meta.json`);
            if (!res.ok) return null;
            return await res.json();
        } catch { return null; }
    }

    /** 按需加载 DE 抛射物素材（透明底 fly_0.png，不抠绿不染色——箭/标枪/飞斧 DE 里无玩家色）。 */
    private ensureProj(key: string): void {
        if (this.projBank[key]) return;
        const dir = `/SUCAI/${key}/`;
        // 占位先立（img=null），防同一 key 重复加载；渲染时 img 未就绪就跳过不画。
        this.projBank[key] = { img: null, n: 8, fw: 0, fh: 0, hx: 0, hy: 0 };
        this.pending++;
        this.loadProjMeta(dir).then(meta => {
            if (meta) {
                this.projBank[key].n = meta.frames;
                this.projBank[key].fw = meta.box_w;
                this.projBank[key].fh = meta.box_h;
                this.projBank[key].hx = meta.anchor_x;
                this.projBank[key].hy = meta.anchor_y;
            }
            const im = new Image();
            im.onload = () => { this.projBank[key].img = im; this.pending--; };
            im.onerror = () => { this.pending--; };
            im.src = `${dir}fly_0.png`;
        }).catch(() => { this.pending--; });
    }

    /** 炮弹/手榴弹落地爆炸：径向散开一片火星（2026-08-16 热兵器特效）。 */
    private explode(x: number, y: number): void {
        const colors = ['#FFD800', '#FF8C00', '#FF4500', '#FFF4D0'];
        const count = 14;
        for (let i = 0; i < count; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 20 + Math.random() * 60;
            this.sparks.push({
                x, y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 24,   // 略向上偏，模拟爆炸气浪
                t: 0,
                dur: 0.25 + Math.random() * 0.30,
                color: colors[(Math.random() * colors.length) | 0],
                size: 1.5 + Math.random() * 2.0,
            });
        }
    }

    private dir8(dx: number, dy: number): number {
        let a = Math.atan2(-dy, dx) * 180 / Math.PI;
        a = ((a % 360) + 360) % 360;
        return (9 - Math.floor(((a + 22.5) % 360) / 45)) % 8;
    }

    /** 对面最近的**还在出兵的**敌口（纵向加权 = 同一路优先）。空口不算——认死空口会让整路兵原地朝前走不转向 */
    private nearestEnemySpawn(s: WarSpawn): WarSpawn | null {
        let best: WarSpawn | null = null, bd = Infinity;
        for (const t of this.spawns) {
            if (t.f === s.f || t.pool <= 0) continue;
            const dy = (t.y - s.y) * LANE_W;                 // 纵向加权 = 优先同一路（见 LANE_W）
            const d = (t.x - s.x) ** 2 + dy * dy;
            if (d < bd) { bd = d; best = t; }
        }
        return best;
    }

    private spawnTick(dt: number): void {
        const onField = [0, 0];
        for (const m of this.men) if (m.hp > 0) onField[m.f]++;

        // 【2026-08-13 主人定·成批补】开局双方各出 300；之后一方场上 < 150 才再补 300。
        //   成批补（不是死一个补一个），一方打掉一半才补一波，靠成批的兵反推战线。
        this.batchCd -= dt;
        if (this.batchCd > 0) return;
        // 渐显时长：开场列阵待命阶段的兵拉长淡入（整军缓缓显现），中途补兵保持短淡入
        const fadeDur = this.deployT > 0 ? DEPLOY_FADE : FADE_IN;

        // 每一方独立判断：场上 < 150 才补 300（开局双方 0 → 各补 300，一帧同时出）
        for (let f = 0; f < 2; f++) {
            if (onField[f] >= TRIGGER) continue;   // 场上 >= 150 不补

            const ports = this.spawns.filter(s => s.f === f && s.pool > 0);
            if (!ports.length) continue;
            let batch = SIDE_CAP;                  // 一次补 300（固定批量）

            // 从**所有还有兵的出兵口**一起涌出，不是一个点
            let pi = 0;
            while (batch > 0) {
                const s = ports[pi % ports.length];
                pi++;
                if (s.pool <= 0) {
                    if (ports.every(p => p.pool <= 0)) break;
                    continue;
                }
                s.pool--;
                batch--;
                const tgt = this.nearestEnemySpawn(s) ?? this.enemyCen[1 - s.f];
                if (!tgt) break;
                // 旗手身份出生时定死（勿改成每帧现挑，见 FLAG_EVERY）。
                // 每个出兵口独立计数：本口每出满 FLAG_EVERY 个精灵出一面旗 → 旗帜按口平均分布。
                s.spawned++;
                const bearer = (s.spawned % FLAG_EVERY === 0);
                this.men.push({
                    f: s.f, key: s.key,
                    x: s.x + (Math.random() - .5) * 60, y: s.y + (Math.random() - .5) * 110,
                    tx: tgt.x, ty: tgt.y, hp: statsOf(s.key).hp, dir: 0,
                    ph: Math.random() * 8, st: 0, foe: null, next: Math.random() * 0.2,
                    fightT: 0, aimT: 0, lock: 0, atkSt: 0, atkFlip: false,
                    flag: bearer, fo: Math.random() * 600,
                    atkers: 0, atkNext: 0, fadeT: fadeDur, fadeMax: fadeDur,
                });
            }
        }
        this.batchCd = BATCH_COOLDOWN;
    }

    private put(map: Map<number, WarMan[]>, cell: number, m: WarMan): void {
        const k = HKEY((m.x / cell) | 0, (m.y / cell) | 0);
        let a = map.get(k);
        if (!a) map.set(k, a = []);
        a.push(m);
    }

    private rebuild(): void {
        this.gm = new Map(); this.gr = new Map(); this.gs = new Map();
        for (const m of this.men) {
            this.put(this.gm, CELL_M, m);
            this.put(this.gr, CELL_R, m);
            this.put(this.gs, CELL_S, m);
        }
    }

    /**
     * 软推挤：贴太近的两个人互相推开一点，谁也不完全重叠。
     * 敌我都推（战线才会顶住而不是穿过去）。每人最多看 6 个邻居，保证 O(n)。
     */
    private separate(dt: number): void {
        const push = SEP_SPD * dt;
        const d2 = SEP_DIST * SEP_DIST;
        for (const m of this.men) {
            if (m.hp <= 0) continue;
            const cx = (m.x / CELL_S) | 0, cy = (m.y / CELL_S) | 0;
            let ox = 0, oy = 0, seen = 0, nearest2 = d2;
            for (let gx = cx - 1; gx <= cx + 1 && seen < 6; gx++) {
                for (let gy = cy - 1; gy <= cy + 1 && seen < 6; gy++) {
                    const a = this.gs.get(HKEY(gx, gy));
                    if (!a) continue;
                    for (let i = 0; i < a.length && seen < 6; i++) {
                        const o = a[i];
                        if (o === m || o.hp <= 0) continue;
                        const dx = m.x - o.x, dy = m.y - o.y;
                        const dd = dx * dx + dy * dy;
                        if (dd >= d2) continue;
                        if (dd < nearest2) nearest2 = dd;
                        seen++;
                        if (dd < 1e-4) { ox += (Math.random() - .5); oy += (Math.random() - .5); continue; }
                        const inv = 1 / Math.sqrt(dd);
                        ox += dx * inv; oy += dy * inv;
                    }
                }
            }
            if (!seen) continue;
            const l = Math.hypot(ox, oy) || 1;
            // 🔴 按**重叠深度**缩放推力：几乎不重叠时几乎不推。
            //    原来不管挤多深都按全速推，而邻居集合每帧都在变（只看 6 个），
            //    推的方向来回摆 → 人在原地微微发抖。
            const depth = Math.max(0, 1 - Math.sqrt(nearest2) / SEP_DIST);
            m.x += ox / l * push * depth;
            m.y += oy / l * push * depth;
        }
    }

    private search(m: { x: number; y: number; f: number }, radius: number, nearest = false): WarMan | null {
        const useR = radius > CELL_M;
        const map: Map<number, WarMan[]> = useR ? this.gr : this.gm; const cell = useR ? CELL_R : CELL_M;
        const span = Math.max(1, Math.ceil(radius / cell));
        const cx = (m.x / cell) | 0, cy = (m.y / cell) | 0;
        // 🔴 2026-08-13 回退到 08-11 原状（打架逮到就返回 + 行军 nearest 24 上限）：
        //   nearest 全翻虽让镜像对称（A55%），但破坏「骑克弩」克制边（cav vs ranged 92%→25%，
        //   远程集群集中集火最近骑兵 + 围殴放大）。克制三边是 08-11 主人拍板的核心，优先保住。
        //   镜像偏袒（攻方 10% 偏守方）作为已知遗留，与「哪边兵少补哪边」的平衡诉求一并另议。
        const r2 = radius * radius;
        let best: WarMan | null = null, bd = r2, seen = 0;
        for (let gx = cx - span; gx <= cx + span; gx++) {
            for (let gy = cy - span; gy <= cy + span; gy++) {
                const a = map.get(HKEY(gx, gy));
                if (!a) continue;
                for (let i = 0; i < a.length; i++) {
                    const o = a[i];
                    if (o.f === m.f || o.hp <= 0) continue;
                    const d = (o.x - m.x) ** 2 + (o.y - m.y) ** 2;
                    if (d >= r2) continue;
                    if (!nearest) return o;              // 打架：逮到就打，别翻完
                    if (d < bd) { bd = d; best = o; }
                    if (++seen >= 24) return best;       // 行军：找最近，但最多看 24 个
                }
            }
        }
        return best;
    }

    /**
     * 范围伤（象兵）。
     * 伤害按 DE 公式逐个受害者算：dmgVs(攻+加成−防) / reload，再乘八环 sideBonus 与围殴。
     */
    private splash(m: WarMan, radius: number, shooter: WarType, dt: number): void {
        const span = Math.max(1, Math.ceil(radius / CELL_M));
        const cx = (m.x / CELL_M) | 0, cy = (m.y / CELL_M) | 0;
        for (let gx = cx - span; gx <= cx + span; gx++) {
            for (let gy = cy - span; gy <= cy + span; gy++) {
                const a = this.gm.get(HKEY(gx, gy));
                if (!a) continue;
                for (const o of a) {
                    if (o.f === m.f || o.hp <= 0) continue;
                    if ((o.x - m.x) ** 2 + (o.y - m.y) ** 2 > radius * radius) continue;
                    // 范围伤同样吃围殴加成：加成挂在挨打的人身上，被围住的人谁打都更疼
                    const dps = dmgVs(shooter, WAR_TYPES[o.key] ?? WAR_TYPES.light_infantry) / shooter.reload;
                    o.atkNext++;
                    o.hp -= dps * this.sideBonus[m.f] * gangMul(o) * dt;
                    if (o.hp <= 0) this.pushCorpse(o);
                }
            }
        }
    }

    /**
     * 该往哪走：**所有兵一个目标——杀光对方有生力量**（主人 2026-08-11 定，中军特权已废）。
     *   ① 视野内最近的敌兵（MARCH_R 内，用远程哈希格找）
     *   ② 找不到 → 敌军重心
     *   ③ 场上一个敌兵都没有（开局那几秒）→ 敌方出兵口方向，当作行军朝向
     * 出兵口不再是攻击目标，只是「敌人在那边」的路标。
     */
    private aimAt(m: WarMan): { x: number; y: number } | null {
        // ① 视野内最近的敌兵（找最近，不是逮到就算）
        const near = this.search(m, MARCH_R, true);
        if (near) return { x: near.x, y: near.y };
        // ② 身边没人 → 朝**还在出兵的敌口**走（纵向加权 = 同一路优先）。
        //    3×3 排布下上路兵最近的活口就是对面上路那个，所以各走各的路，不会汇到中间。
        //    🔴 必须筛 pool>0：我一度不筛（想让空口继续当路标），结果上路敌人死光、上路敌口也空了之后，
        //       上路的兵还认死那个空口一直往前走，屏幕下方全是敌人也不去（主人 2026-08-11 实锤）。
        let best: { x: number; y: number } | null = null, bd = Infinity;
        for (const s of this.spawns) {
            if (s.f === m.f || s.pool <= 0) continue;
            const dy = (s.y - m.y) * LANE_W;                 // 纵向加权 = 优先同一路
            const dd = (s.x - m.x) ** 2 + dy * dy;
            if (dd < bd) { bd = dd; best = { x: s.x, y: s.y }; }
        }
        if (best) return best;
        // ③ 敌口全空（收尾阶段）→ 扑向敌军重心，去补最后的刀。
        //    🔴 重心 = 全场敌人的平均位置 = 屏幕正中，只能当**兜底**：
        //       当主力兜底会让所有兵都往中间挤（主人 2026-08-11 实锤「上路兵下路兵怎么都去打中路」）。
        //       但战斗中途口都还有兵，走不到这一步，所以各路照样各走各的。
        const cen = this.enemyCen[1 - m.f];
        if (cen) return cen;
        // ④ 场上也没敌人了 → 随便找个敌口（正常打不到这一步）
        for (const s of this.spawns) if (s.f !== m.f) return { x: s.x, y: s.y };
        return null;
    }

    /**
     * 战场边界 = 屏幕：兵的任何移动（追目标 / 风筝后撤 / 软推挤）都不许走出屏幕。
     * 🔴 2026-08-13 修「寻敌走出屏幕」：三处移动原本都不 clamp，追目标/风筝/推挤都可能把兵推出屏幕。
     *    统一在此收口，margin = 半身 UNIT_PX/2。
     */
    private fieldBound(x: number, y: number): [number, number] {
        const vw = this.canvas?.width ?? 0, vh = this.canvas?.height ?? 0;
        if (vw <= 0 || vh <= 0) return [x, y];
        const mx = UNIT_PX * 0.5, my = UNIT_PX * 0.5;
        return [Math.min(Math.max(x, mx), vw - mx), Math.min(Math.max(y, my), vh - my)];
    }

    private step(dt: number): void {
        if (this.over) return;
        this.spawnTick(dt);
        // 开场列阵待命倒计时：阶段内全军静止渐显，结束才开打（主人 2026-08-16）
        if (this.deployT > 0) this.deployT -= dt;
        const deploying = this.deployT > 0;
        // 敌军重心（每帧 O(n)，供 aimAt 兜底）
        const cx = [0, 0], cy = [0, 0], cn = [0, 0];
        for (const m of this.men) { cx[m.f] += m.x; cy[m.f] += m.y; cn[m.f]++; }
        this.enemyCen = [0, 1].map(f => cn[f] ? { x: cx[f] / cn[f], y: cy[f] / cn[f] } : null);

        this.rebuild();
        for (const m of this.men) {
            if (m.hp <= 0) continue;
            // 开场列阵待命：静止渐显，不索敌、不移动、不攻击（主人 2026-08-16）
            if (deploying) {
                m.st = 0;
                m.foe = null;
                m.fightT = 0;
                if (m.fadeT > 0) m.fadeT -= dt;
                m.ph += dt * 8 / 1.5;   // 待命动画（与残局待命同速）
                continue;
            }
            const wt = WAR_TYPES[m.key];
            const stats = statsOf(m.key);
            const R = stats.rng || 65;

            // 目标每 0.2s 重找（错开相位）；目标死/跑远保持不换
            m.next -= dt;
            const keep = m.foe && m.foe.hp > 0
                && (m.foe.x - m.x) ** 2 + (m.foe.y - m.y) ** 2 < R * R * 1.44;
            if (!keep && m.next <= 0) {
                m.foe = this.search(m, R);
                m.next = 0.2;
            } else if (!keep) m.foe = null;

            // 没在打架就持续更新移动目标走过去（0.5s 刷新一次）
            if (!m.foe) {
                m.aimT = (m.aimT ?? 0) - dt;
                if (m.aimT <= 0) {
                    const aim = this.aimAt(m);
                    if (aim) { [m.tx, m.ty] = this.fieldBound(aim.x, aim.y); }
                    m.aimT = 0.5;
                }
            }

            const foe = m.foe;
            if (foe) {
                m.fightT = (m.fightT || 0) + dt;
                // 缠斗 4 秒脱离
                if (m.fightT > 4) {
                    m.foe = null; m.fightT = 0; m.next = 0.4; m.lock = 0;
                    const aim = this.aimAt(m);
                    if (aim) { [m.tx, m.ty] = this.fieldBound(aim.x, aim.y); }
                    continue;
                }
                const close = (foe.x - m.x) ** 2 + (foe.y - m.y) ** 2 < 65 * 65;
                m.st = (stats.rng && close && this.bank[m.key]?.sets.melee[0].length) ? 2 : 1;
                m.dir = this.dir8(foe.x - m.x, foe.y - m.y);
                m.lock = (m.lock ?? 0) - dt;
                if (m.lock <= 0) {
                    m.lock = 1.5; m.ph = 0;
                    // 攻击动作交替（主人 2026-08-11 拍板）：有冲锋组的兵种（象兵/弓骑）每轮出手翻转，
                    // 在「攻击帧/冲锋帧」两套动作间轮播，丰富表现；无冲锋组的兵种不受影响。
                    if (this.bank[m.key]?.sets.charge?.[0]?.length) m.atkFlip = !m.atkFlip;
                    // 一轮出手开始 = 射箭（主人 2026-08-11「每个远程应该拥有自己的弓箭」）。
                    // 只有真正在放箭的那一轮才有箭：被贴身改白刃（st=2）时不射。
                    // 🔴 2026-08-16 主人定：抛射物按兵种一一对应 DE 素材（箭/标枪/飞镖/飞斧/火箭），
                    //    连弩（诸葛弩）连发多支（普通 3、精锐 5，AoE2 wiki），其余每轮 1 支。
                    if (stats.rng > 65 && m.st === 1) {
                        const ax = foe.x - m.x, ay = foe.y - m.y;
                        const ad = Math.hypot(ax, ay) || 1;
                        const proj = PROJ_TYPE[m.key] ?? 'PROJ_ARROW';
                        const volley = PROJ_VOLLEY[m.key] ?? 1;
                        this.ensureProj(proj);
                        for (let v = 0; v < volley; v++) {
                            this.arrows.push({
                                x: m.x, y: m.y - UNIT_PX * 0.45,   // 从胸口高度射出，不是脚底
                                dx: ax / ad, dy: ay / ad, len: ad,
                                t: 0, dur: ARROW_DUR + Math.random() * 0.06, f: m.f,
                                proj,
                                delay: v * PROJ_VOLLEY_DELAY,      // 连发：第 v 支延迟 v×80ms 射出
                            });
                        }
                    }
                }
                m.atkSt = m.st;
                // 总加成：把战略层强弱（将领/精锐/武将技/文化/运气）带进每一刀
                // 伤害 = DE 公式 dmgVs(攻+加成−防) / reload（装填时间），再乘 sideBonus（八环）与围殴。
                // 相克由 DE 加成伤害 + 近/远防自然涌现（步克骑/弓克步/骑克弓），无全局系数。
                const shooter = WAR_TYPES[m.key] ?? WAR_TYPES.light_infantry;
                const target = WAR_TYPES[foe.key] ?? WAR_TYPES.light_infantry;
                const dps = dmgVs(shooter, target) / shooter.reload;
                if (wt.aoe) this.splash(m, R, shooter, dt);
                else {
                    foe.atkNext++;
                    foe.hp -= dps * this.sideBonus[m.f] * gangMul(foe) * dt;
                    if (foe.hp <= 0) this.pushCorpse(foe);
                }
                // 兵刃交界处火花微特效（仅近战贴身接触时概率产生）
                if (close && Math.random() < 0.06) {
                    const sparkX = (m.x + foe.x) * 0.5 + (Math.random() - 0.5) * 12;
                    const sparkY = (m.y + foe.y) * 0.5 - UNIT_PX * 0.4 + (Math.random() - 0.5) * 12;
                    const colors = ['#FFF4D0', '#FFE066', '#FFB830', '#FFFFFF'];
                    const count = 1 + ((Math.random() * 2) | 0);
                    for (let i = 0; i < count; i++) {
                        const ang = Math.random() * Math.PI * 2;
                        const spd = 15 + Math.random() * 35;
                        this.sparks.push({
                            x: sparkX,
                            y: sparkY,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd - 12,
                            t: 0,
                            dur: 0.10 + Math.random() * 0.10,
                            color: colors[(Math.random() * colors.length) | 0],
                            size: 1.0 + Math.random() * 1.5,
                        });
                    }
                }
                if (wt.kite) {
                    const dx = m.x - foe.x, dy = m.y - foe.y, d = Math.hypot(dx, dy) || 1;
                    if (d < wt.kite) { m.x += dx / d * stats.spd * dt; m.y += dy / d * stats.spd * dt; }
                }
            } else {
                if ((m.lock ?? 0) > 0) {
                    m.lock -= dt;
                    m.st = (m.atkSt || 1) as 0 | 1 | 2;
                    m.ph += dt * 8 / 1.5;
                    continue;
                }
                // 没敌人在打 → 朝目标（最近的敌兵/敌军重心）走。所有兵一个规矩，没有例外。
                m.st = 0;
                m.fightT = 0;
                const dx = m.tx - m.x, dy = m.ty - m.y;
                const d = Math.hypot(dx, dy);
                // 🔴 到达判定：目标只剩几像素时**停下**，不要照全速冲过去。
                //    没有这一条，目标剩 2px 也走 4px → 冲过头 → 下一帧回头 → 原地来回抖，
                //    朝向又每帧按移动方向重算，就在 8 个方向之间乱跳 = 主人看到的「闪动、颤抖」。
                const step = stats.spd * dt;
                if (stats.spd > 0 && d > Math.max(ARRIVE_EPS, step)) {
                    m.x += dx / d * step;
                    m.y += dy / d * step;
                    m.dir = this.dir8(dx, dy);        // 只在真的在走时更新朝向
                }
            }
            if (m.fadeT > 0) m.fadeT -= dt;
            m.ph += dt * (m.st ? 8 / 1.5 : 8);
        }

        // 围殴计数结转：本帧数到的攻击者数留给下一帧用（同帧边遍历边结算，只能数到一半）
        for (const m of this.men) { m.atkers = m.atkNext; m.atkNext = 0; }

        this.separate(dt);
        // 边界收口：追目标/风筝/推挤都可能把兵推出屏幕，统一 clamp 回场内（见 fieldBound）
        for (const m of this.men) { [m.x, m.y] = this.fieldBound(m.x, m.y); }
        // 旗手战死 → 原地留下一面倒下的军旗。men 数组只在这一处出人，死亡侦测放这里最稳。
        for (const m of this.men) {
            if (m.hp <= 0 && m.flag) this.fallenFlags.push({ x: m.x, y: m.y, f: m.f, t: 0, fo: m.fo });
        }
        this.men = this.men.filter(m => m.hp > 0);
        for (const ff of this.fallenFlags) ff.t += dt;
        this.fallenFlags = this.fallenFlags.filter(ff => ff.t < FLAG_FALL);
        for (const a of this.arrows) a.t += dt;
        // 🔴 连发延迟：t 走到 delay+dur 才移除（delay 内还没射出，不算飞行时间）。
        // 炮弹/手榴弹落地瞬间 → 爆炸火花（径向散开，2026-08-16 热兵器特效）。
        for (const a of this.arrows) {
            if ((a.t >= (a.delay ?? 0) + a.dur) && (a.proj === 'PROJ_BALL' || a.proj === 'PROJ_GRENADE')) {
                this.explode(a.x + a.dx * a.len, a.y + a.dy * a.len);
            }
        }
        this.arrows = this.arrows.filter(a => a.t < (a.delay ?? 0) + a.dur);
        for (const s of this.sparks) {
            s.t += dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
        }
        this.sparks = this.sparks.filter(s => s.t < s.dur);
        // 云漂移：一律左→右（攻方→守方），飘出右边就从左边绕回来
        // （用原图宽当余量，保证是整朵飘出去、整朵飘进来，绝不在画面里半途闪现）
        if (this.clouds.length && this.canvas) {
            const vw = this.canvas.width;
            for (const c of this.clouds) {
                c.x += c.vx * dt;
                const w = (c.img?.naturalWidth ?? 600) * CLOUD_SCALE;
                if (c.x > vw + w) c.x = -w;
            }
        }
        // 留下的尸体：死亡动画播完 → 烙进地面图永久保留（不再逐帧重画、不再参与排序）
        for (const c of this.corpses) {
            c.t += dt;
            if (c.keep !== true && c.t >= DEATH_ANIM) {
                this.bakeCorpse(c);
                c.keep = true;
            }
        }
        this.corpses = this.corpses.filter(c => c.keep !== true);
        // 溃逃兵：反向移动 + 渐隐，跑完即消失（主人 2026-08-16）
        for (const f of this.fleers) {
            f.t += dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.ph += dt * 8;
        }
        this.fleers = this.fleers.filter(f => f.t < FLEE_DUR);

        // 胜负：一方兵力枯竭（池 + 场上全灭）才算输（2026-08-11 主人修复后口径）
        const alive = [0, 0];
        for (const s of this.spawns) alive[s.f] += Math.max(0, s.pool);
        for (const m of this.men) if (m.hp > 0) alive[m.f]++;
        if (alive[0] <= 0 || alive[1] <= 0) {
            this.over = true;
            const attackerLost = alive[0] <= 0;
            // [2026-08-11 诊断] 主人报「兵没死光就结束」。这条日志证明是不是演出自己判的：
            // 若这条没打、场景却退了，说明是外部路径（自愈 exit / 引擎结算）提前收的场。
            // 🔴 用 console.warn 不用 gameLog：gameLog 要频道开启才打印，上一版诊断因此一条没出来
            console.warn(`🏁 [Scene13War] 演出判负：攻方余 ${alive[0]} 守方余 ${alive[1]} 精灵（1精灵=10兵）`);
            this.onDecision?.(
                attackerLost ? 'defender' : 'attacker',
                { attacker: Math.round(alive[0] * SPRITE_TROOPS), defender: Math.round(alive[1] * SPRITE_TROOPS) },
            );
        }
    }

    private clearGround(): void {
        if (this.ground && this.groundCtx) {
            this.groundCtx.clearRect(0, 0, this.ground.width, this.ground.height);
        }
    }

    /** 兵阵亡去向：累加器裁定留尸体（死亡动画→烙地面）还是溃逃（反向移动渐隐）——主人 2026-08-16 */
    private pushCorpse(m: WarMan): void {
        if (this.takeCorpseSlot()) {
            this.corpses.push({ x: m.x, y: m.y, f: m.f, key: m.key, dir: m.dir, t: 0 });
            return;
        }
        const back = m.f === 0 ? -1 : 1;   // 攻方在左往左逃、守方在右往右逃
        this.fleers.push({
            x: m.x, y: m.y, f: m.f, key: m.key,
            dir: this.dir8(back, (Math.random() - 0.5) * 0.8),
            ph: Math.random() * 8, t: 0,
            vx: back * FLEE_SPD * (0.9 + Math.random() * 0.2),
            vy: (Math.random() - 0.5) * FLEE_SPD * 0.6,
        });
    }

    /**
     * 这具尸体留不留？[2026-08-12 主人要求：先减半，同日再收到 30%] 战场只留 CORPSE_KEEP 比例。
     * 用**累加器**而不是随机丢弃：每具加 0.3，攒够 1 才留一具 —— 十具留三具且间隔均匀，
     * 随机丢弃会让尸体分布斑驳（这也是原来「隔一留一」写死 50% 时的同一个理由）。
     */
    private takeCorpseSlot(): boolean {
        this.corpseAcc += CORPSE_KEEP;
        if (this.corpseAcc < 1) return false;
        this.corpseAcc -= 1;
        return true;
    }

    /** 把一具尸体的死亡末帧永久烙进地面图（留不留已由 takeCorpseSlot 裁定） */
    private bakeCorpse(c: WarCorpse): void {
        const g = this.groundCtx;
        if (!g) return;
        const b = this.bank[c.key];
        if (!b) return;
        const img = b.sets.die?.[c.f]?.[c.dir];
        if (!img) return;
        const wt = WAR_TYPES[c.key];
        const dieN = b.frames.die ?? 8;

        g.save();
        // [环境融入] 仅做轻微压暗。去除 sepia（战场底色因地貌多变），保持 100% 不透明
        g.filter = 'brightness(80%) contrast(95%)';
        g.globalAlpha = 1.0;
        const dm = b.dyn?.die?.[c.dir];
        if (dm) {
            // 🔴 AoE2 DE 动态帧框（2026-08-15 修复「尸体一个都留不下」）：
            //   之前走 S10DB 正方形假设（dieFw = b.fh = 84）切 DE 动态 sheet（fw 40~120 不等），
            //   末帧切片错位/越界 → 烙进地面是空白或碎片 → 保留的 1/3 尸体视觉上全丢。
            //   这里与渲染循环同一套 hotspot 对齐 + 动态帧框。
            const s = UNIT_PX * (wt?.sz ?? 1) / 64;
            g.drawImage(img, (dieN - 1) * dm.fw, 0, dm.fw, dm.fh, c.x - dm.hx * s, c.y - dm.hy * s, dm.fw * s, dm.fh * s);
        } else {
            // S10DB 正方形帧（原逻辑不变）
            const px = UNIT_PX * (wt?.sz ?? 1) * (b.fh / 64);
            const dieFw = b.fh;   // 帧宽 = 帧高（每帧正方形）
            g.drawImage(img, (dieN - 1) * dieFw, 0, dieFw, b.fh, c.x - px / 2, c.y - px * 0.9, px, px);
        }
        g.restore();
    }

    /** 每帧推进（GameAppLoop 场景激活分支调用；dt = 真实秒） */
    public tick(dt: number): void {
        // 残局待命：战斗已结束、场景还没退（5 秒切换延迟）——继续跑，只是不打仗
        if (!this.active && this.lingering) {
            this.lingerStep(dt);
            this.render();
            return;
        }
        if (!this.active) return;
        if (this.pending > 0) {
            // 🔴 [2026-08-11 实锤] 素材 pending 卡死 = 演出冻结 + 引擎冻结（scene13Frozen）
            //    → 跟随军团永远不动、战斗面板数字不动（主人截图实锤）。
            //    素材若 10 秒内没加载完（404/跨域/异常），强制判负退出，绝不永冻：
            //    按当前兵力比判（池+场上），守方（f=1）吃 0.85 城防/主场折扣。
            if (this.pendingStartedAt === 0) this.pendingStartedAt = performance.now();
            if (performance.now() - this.pendingStartedAt > 30000) {
                console.warn(`🏁 [Scene13War] 素材 30s 未就绪（pending=${this.pending}），强制判负防死锁`);
                this.forceResultByRatio(0.85);
            }
            return;
        }
        const now = performance.now();
        this.step(dt);
        this.render();
        this.last = now;
    }

    /**
     * 画旗面（不含旗杆——杆在士兵层**之下**另画，见 render 里的旗杆趟）。
     *
     * 🔴 分层与大地图完全一致（GlobalUnitRenderer 的注释原话）：
     *    `drawPole` = Behind Soldiers，`drawFlag` = On Top of Soldiers。
     *    我一开始把杆和旗面一起画在了兵之上，杆就压在人身上了（主人 2026-08-12 实锤）。
     * 🔴 白色光晕已按主人要求去掉（2026-08-12），只画一趟，不要再加回描边/阴影。
     * 🔴 飘向固定 row 5，与大地图统一 —— 别再改成跟行军方向联动（试过，主人否决）。
     *
     * 🔴 **旗面文字必须保留**（2026-08-12 主人指出，我一度关掉是错的）：
     *    势力固定色两两中位距离只有 8.0，**势力色相近是常态**（葡萄牙 vs 杜罗两边都是蓝的），
     *    光靠颜色区分不了敌我。而且旗上的字**不需要被读懂、只需要作为图案能区分**，
     *    所以小尺寸也成立 —— 这个门槛比「读清楚」低得多。
     *
     * @param tick 已含本面旗的相位偏移，别再在里面加（见 WarMan.fo）
     */
    private drawOneFlag(ctx: CanvasRenderingContext2D, x: number, y: number, f: 0 | 1, tick: number): void {
        const faction = this.sideFaction[f];
        LegionFlagDrawer.drawFlag(ctx, { x, y }, 5, FLAG_SCALE, tick, faction, -999, FLAG_POLE_RATIO, FLAG_POLE_LIFT);
    }

    // ── 绘制：只画精灵 + 尸体（出兵口 UI 不渲染）──
    private render(): void {
        const ctx = this.ctx, cv = this.canvas;
        if (!ctx || !cv) return;
        ctx.clearRect(0, 0, cv.width, cv.height);

        const vis: { y: number; x: number; f: number; key: string; dir: number; set: string; fr: number; a: number }[] = [];
        // 湖：贴地水域，画在最底层（ground 尸体层之下），不参与 y 排序；本季一张图，随机镜像
        for (const lk of this.lakes) {
            if (!lk.img) continue;
            if (lk.flip) {
                ctx.save();
                ctx.translate(lk.x, lk.y);
                ctx.scale(-1, 1);
                ctx.drawImage(lk.img, -LAKE_W / 2, -LAKE_H / 2, LAKE_W, LAKE_H);
                ctx.restore();
            } else {
                ctx.drawImage(lk.img, lk.x - LAKE_W / 2, lk.y - LAKE_H / 2, LAKE_W, LAKE_H);
            }
        }
        // 树：与湖同层（ground 尸体层之下），不参与 y 排序、不遮挡士兵；原图多大画多大，随机镜像。
        for (const t of this.trees) {
            if (!t.img) continue;
            const iw = t.img.naturalWidth, ih = t.img.naturalHeight;
            if (!iw || !ih) continue;
            if (t.flip) {
                ctx.save();
                ctx.translate(t.x, t.y);
                ctx.scale(-1, 1);
                ctx.drawImage(t.img, -iw / 2, -ih, iw, ih);
                ctx.restore();
            } else {
                ctx.drawImage(t.img, t.x - iw / 2, t.y - ih, iw, ih);
            }
        }
        // 已烙的尸体：一张图搞定（在所有活人之下）
        if (this.ground) ctx.drawImage(this.ground, 0, 0);
        // 留下的尸体：死亡动画逐帧画（全程不透明，播完即烙地面）
        for (const c of this.corpses) vis.push({
            y: c.y, x: c.x, f: c.f, key: c.key, dir: c.dir, set: 'die',
            fr: c.t,
            a: 1,
        });
        // 溃逃兵：跑动帧 + 反向移动 + 渐隐（主人 2026-08-16）
        for (const f of this.fleers) vis.push({
            y: f.y, x: f.x, f: f.f, key: f.key, dir: f.dir, set: 'move',
            fr: f.ph,
            a: Math.max(0, 1 - f.t / FLEE_DUR),
        });
        for (const m of this.men) {
            // 有冲锋组的兵种（象兵/弓骑）两处用冲锋帧（主人 2026-08-12 拍板「两者都要」）：
            //   ① 移动时**逐轮交替**：一轮移动、一轮冲锋（见 CHARGE_CYCLE）；
            //   ② 攻击时按出手轮次与攻击帧交替（m.atkFlip 每轮出手翻转）。
            // 其余兵种不受影响：赶路一律移动帧、攻击固定攻击帧。白刃（st=2）用近战帧。
            const hasChg = !!this.bank[m.key]?.sets.charge?.[0]?.length;
            let set: string;
            // 残局待命 / 开场列阵待命：全军播待命帧（没有待命素材的退回移动帧，绝不留静止画面）
            if (this.lingering || this.deployT > 0) {
                set = this.bank[m.key]?.sets.idle?.[0]?.length ? 'idle' : 'move';
            }
            else if (m.st === 0) {
                const odd = Math.floor(m.ph / CHARGE_CYCLE) % 2 === 1;
                set = (hasChg && odd) ? 'charge' : 'move';
            }
            else if (m.st === 2) set = 'melee';
            else if (m.atkFlip && hasChg) set = 'charge';
            else set = 'atk';
            const fade = m.fadeT > 0 ? 1 - m.fadeT / (m.fadeMax || FADE_IN) : 1;
            vis.push({ y: m.y, x: m.x, f: m.f, key: m.key, dir: m.dir, set, fr: m.ph, a: fade });
        }
        vis.sort((a, b) => a.y - b.y);

        // ── 旗杆：画在士兵层**之下**（主人 2026-08-12「只改旗杆，放到士兵层下面」）──
        // 与大地图同序：GlobalUnitRenderer 先 drawPole（Behind Soldiers）、后 drawFlag（On Top）。
        // 只画不等：LegionFlagDrawer 没预加载完时自己 return，绝不在 13 里 await。
        const flagTick = performance.now();
        for (const m of this.men) {
            if (!m.flag) continue;
            LegionFlagDrawer.drawPole(ctx, { x: m.x, y: m.y }, FLAG_SCALE, this.sideFaction[m.f], FLAG_POLE_RATIO, FLAG_POLE_LIFT);
        }

        for (const v of vis) {
            const b = this.bank[v.key];
            if (!b) continue;
            const img = b.sets[v.set]?.[v.f]?.[v.dir];
            if (!img) continue;
            const wt = WAR_TYPES[v.key];
            // [2026-08-15 全帧修复] 各动作帧数不同（S10DB=8，AoE2=30~60），
            // 帧宽按该动作实际帧数算、帧号按「每秒 8 相位」换算，循环节奏与原 8 帧素材一致。
            const n = b.frames[v.set] ?? 8;
            const fr = v.set === 'die'
                ? Math.min(n - 1, Math.floor(v.fr / DEATH_ANIM * n))   // 死亡：DEATH_ANIM 内播完 n 帧，冻结末帧
                : Math.floor(v.fr * n / 8) % n;                        // 活人：8 相位/秒 → 换算该动作帧号
            if (v.a < 1) ctx.globalAlpha = v.a;
            const dm = b.dyn?.[v.set]?.[v.dir];
            if (dm) {
                // 🔴 AoE2 DE 动态帧框（hotspot 对齐，2026-08-15 定稿）：
                //   游戏里 hotspot = canvas 中心，渲染时 hotspot 对齐单位位置，脚底随动作浮动（倒地时大幅下移）。
                //   这里把 box 里的 hotspot(dm.hx/dm.hy) 对齐 v.x/v.y，统一缩放 s —— 站立帧/横躺帧都完整，无裁切。
                const s = UNIT_PX * (wt?.sz ?? 1) / 64;   // 统一缩放（站立高度 64 参考）
                ctx.drawImage(img, fr * dm.fw, 0, dm.fw, dm.fh, v.x - dm.hx * s, v.y - dm.hy * s, dm.fw * s, dm.fh * s);
            } else {
                // S10DB 正方形帧（原逻辑不变）
                const px = UNIT_PX * (wt?.sz ?? 1) * (b.fh / 64);
                ctx.drawImage(img, fr * b.fh, 0, b.fh, b.fh, v.x - px / 2, v.y - px * 0.9, px, px);
            }
            if (v.a < 1) ctx.globalAlpha = 1;
        }

        // ── 旗面：画在所有人之上（旗杆已在士兵层之下画过）──
        // 🔴 必须**单开一趟、不参与 y 排序**：排序看的是脚底 y，而旗杆比人高得多，
        //    混进 vis 会让前排的人盖住后排的旗面 —— 旗帜作为「穿透人群的信息层」就废了一半。
        // 🔴 只画不等：LegionFlagDrawer 没预加载完时 drawFlag 自己 return（不崩、只是暂时没旗）。
        //    绝不在 13 里 await 旗帜加载 —— 启动慢那次（89s→11s）就是全屏 24 面旗 await 阻塞。
        for (const m of this.men) {
            if (!m.flag) continue;
            this.drawOneFlag(ctx, m.x, m.y, m.f, flagTick + m.fo);
        }
        // 倒下的军旗：前半程转倒 90°，全程淡出。
        // 这里**杆和旗面一起**画在旋转变换里 —— 倒下的是整面旗，杆不能留在原地竖着。
        for (const ff of this.fallenFlags) {
            const p = ff.t / FLAG_FALL;
            ctx.save();
            ctx.translate(ff.x, ff.y);
            ctx.rotate(Math.PI / 2 * Math.min(1, p * 2));
            ctx.globalAlpha = 1 - p;
            LegionFlagDrawer.drawPole(ctx, { x: 0, y: 0 }, FLAG_SCALE, this.sideFaction[ff.f], FLAG_POLE_RATIO, FLAG_POLE_LIFT);
            this.drawOneFlag(ctx, 0, 0, ff.f, flagTick + ff.fo);
            ctx.restore();
        }

        // 箭矢画在人上面。🔴 2026-08-16 主人定：抛射物统一用 DE 素材（箭/标枪/飞镖/飞斧/火箭），
        //   水平朝向 rotate（箭朝目标方向）+ 帧序号内置俯仰/自转（箭/标枪/火箭=仰射→俯冲，飞斧=360°自转）。
        //   抛物线位置照旧（420ms + 弧高 = 距离×0.3 封顶 100px），只换画法不换飞法。
        if (this.arrows.length) {
            ctx.save();
            const S = PROJ_SCALE;
            for (const a of this.arrows) {
                const delay = a.delay ?? 0;
                if (a.t < delay) continue;          // 连发尚未射出
                const pa = this.projBank[a.proj];
                if (!pa?.img || !pa.fw) continue;   // 素材未就绪（加载中跳过）
                const p = (a.t - delay) / a.dur;
                const d = a.len * p;
                // 高抛（炮弹/手榴弹）弧高翻倍；平直（弩炮/火枪弹）无弧。
                const arcH = PROJ_HIGH_ARC.has(a.proj) ? Math.min(a.len * 0.5, 160) : Math.min(a.len * 0.3, 100);
                const arc = PROJ_FLAT.has(a.proj) ? 0 : 4 * arcH * p * (1 - p);
                const x = a.x + a.dx * d;
                const y = a.y + a.dy * d - arc;
                // 🔴 [2026-08-16 修复向北及全向弹道切线角]
                // 用瞬时速度切线角（vx, vy - dArc/dp）驱动全 360° 旋转，
                // 彻底解决朝北/朝南射击时帧序俯仰变横向摆头、箭头左右晃动或反转倒插的 Bug。
                const vx = a.dx * a.len;
                const vy = a.dy * a.len - (PROJ_FLAT.has(a.proj) ? 0 : 4 * arcH * (1 - 2 * p));
                const angle = Math.atan2(vy, vx) + (PROJ_ANGLE_OFFSET[a.proj] ?? 0);

                let fr = 0;
                if (a.proj === 'PROJ_THROWING_AXE') {
                    // 飞斧空中 360° 旋转
                    fr = Math.floor(p * 24) % pa.n;
                } else if (pa.n > 1) {
                    // 箭矢/标枪/飞镖取正水平基准帧，由 rotate(angle) 切线角精确控制全 360° 俯仰与起伏
                    fr = Math.floor(pa.n / 2);
                }

                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.drawImage(pa.img, fr * pa.fw, 0, pa.fw, pa.fh, -pa.hx * S, -pa.hy * S, pa.fw * S, pa.fh * S);
                ctx.rotate(-angle);
                ctx.translate(-x, -y);
            }
            ctx.restore();
        }

        // ── 云：画在**所有东西之上**（士兵/旗帜/箭矢之后），半透明横向飘过 ──
        // 🔴 这是全场唯一"盖在人上面"的装饰层，和树/湖的规矩正好相反，别混。
        //    以中心为锚点，统一乘 CLOUD_SCALE（两张云同尺寸，纯缩小不会有清晰度参差）。
        for (const c of this.clouds) {
            if (!c.img) continue;
            const iw = c.img.naturalWidth * CLOUD_SCALE, ih = c.img.naturalHeight * CLOUD_SCALE;
            if (!iw || !ih) continue;
            ctx.globalAlpha = c.alpha;
            ctx.drawImage(c.img, c.x - iw / 2, c.y - ih / 2, iw, ih);
            ctx.globalAlpha = 1;
        }

        // 两军交界处兵刃火花（微粒火星）
        if (this.sparks.length) {
            ctx.save();
            for (const s of this.sparks) {
                const alpha = Math.max(0, 1 - s.t / s.dur);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
}
