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

import { getCultureTier, getFactionCompositionSlots, inferFormationModeFromSlots, type FormationMode } from '../types/CultureFormations';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { expandCompositionSlots } from '../types/LegionComposition';
import { SPRITE_PATHS } from '../config/UnitAssets';
import { SpriteTinter } from '../systems/tinting/SpriteTinter';
import { LegionFlagDrawer } from '../map/legion/LegionFlagDrawer';
import { gameLog } from '../utils/GameLogger';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { getRegion, type RegionType } from '../systems/RegionSystem';
import { unlockedTechs, applyTechsToStats } from '../systems/MilitaryTechState';
import type { MilitaryTech } from '../data/MilitaryTechs';
import { GameConfig } from '../config/GameConfig';

// ── 帧族（与 __war.html / docs/03-runtime/s10db-frame-layout.md 一致）──
// 远程/弓骑的「第 2 组 = 近战抡砸、第 5 组 = 射击」，UNIT_ASSETS 已按组拆分：
//   ATTACK = 近战（+8）  SHOOT = 射击（+40）  —— 直接取数组，不再手算偏移。
const RANGED_TYPES = new Set(['archer', 'crossbow', 'ballista', 'horse_archer', 'fire_archer', 'kipchak', 'longbowman_elite', 'cav_archer', 'cav_archer_heavy', 'chukonu', 'rattan_archer', 'elite_fire_archer', 'elite_chukonu', 'imperial_skirmisher', 'elite_composite_bowman', 'composite_bowman', 'crossbowman', 'arbalest', 'throwing_axeman', 'arambai', 'mangudai', 'mangudai_elite', 'elite_kipchak', 'pattiyoda_longbowman', 'ballista_elephant', 'elephant_archer', 'dagnajan_elephant', 'rattan_archer_elite', 'amazon_archer', 'bactrian_archer', 'blackwood_archer', 'bolas_rider', 'bombard_cannon', 'camel_archer', 'chakram_thrower', 'conquistador', 'cretan_archer', 'elite_arambai', 'elite_ballista_elephant', 'elite_blackwood_archer', 'elite_bolas_rider', 'elite_camel_archer', 'elite_chakram_thrower', 'elite_conquistador', 'elite_elephant_archer', 'elite_gbeto', 'elite_genitour', 'elite_genoese_crossbowman', 'elite_guecha_warrior', 'elite_hussite_wagon', 'elite_janissary', 'elite_mameluke', 'elite_organ_gun', 'elite_plumed_archer', 'elite_ratha_ranged', 'elite_scythian_horse_archer', 'elite_skirmisher', 'elite_throwing_axeman', 'elite_war_wagon', 'gbeto', 'genitour', 'genoese_crossbowman', 'grenadier', 'guecha_warrior', 'hand_cannoneer', 'heavy_rocket_cart', 'heavy_scorpion', 'houfnice', 'hussite_wagon', 'immortal_ranged', 'janissary', 'longbowman', 'mameluke', 'mangonel', 'mounted_trebuchet', 'onager', 'organ_gun', 'plumed_archer', 'ratha_ranged', 'rhodian_slinger', 'rocket_cart', 'royal_janissary', 'scorpion', 'scythian_horse_archer', 'siege_onager', 'siege_tower', 'skirmisher', 'slinger', 'tarantine_cavalry', 'thracian_peltast', 'traction_trebuchet', 'war_chariot_ranged', 'war_wagon', 'xianbei_raider', 'gastraphetes', 'laminated_bowman', 'recurve_bowman', 'elite_peltast', 'bowman', 'antiquity_skirmisher', 'elite_antiquity_skirmisher', 'antiquity_cavalry_archer', 'antiquity_heavy_cavalry_archer', 'antiquity_scorpion', 'antiquity_heavy_scorpion', 'antiquity_mangonel', 'antiquity_onager', 'antiquity_siege_onager', 'antiquity_siege_tower', 'flamethrower', 'helepolis']);

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
export const WAR_TYPES: Record<string, WarType> = {
    tarantine_cavalry: { name: '塔兰丁骑兵', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 240, reload: 2.7, spd: 130, dmgType: 'pierce', bonus: { 1: 3, 15: 4, 27: 4, 28: 2 }, armorTags: [15, 8, 28, 19, 31, 38] },
    light_infantry: { name: '轻步兵', cls: 'melee', sz: 1, hp: 40, atk: 4, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', armorTags: [1, 31] },
    heavy_infantry: { name: '重步兵', cls: 'melee', sz: 1, hp: 75, atk: 7, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 52, dmgType: 'melee', armorTags: [1, 31] },
    shield: { name: '近卫兵', cls: 'melee', sz: 1, hp: 70, atk: 14, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 47, dmgType: 'melee', bonus: { 21: 4, 29: 8 }, armorTags: [1, 31] },
    spear: { name: '青州兵', cls: 'melee', sz: 1, hp: 55, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 52, dmgType: 'melee', bonus: { 5: 25, 8: 22, 16: 16, 21: 1, 29: 1, 30: 18, 35: 7 }, armorTags: [27, 1, 31] },
    axe: { name: '蛮族兵', cls: 'melee', sz: 1, hp: 54, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    armored: { name: '藤甲兵', cls: 'melee', sz: 1, hp: 60, atk: 9, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 3, 29: 6 }, armorTags: [1, 31] },
    samurai: { name: '日本武士', cls: 'melee', sz: 1, hp: 70, atk: 10, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 1.9, spd: 50, dmgType: 'melee', bonus: { 19: 10, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    samurai_elite: { name: '日本武士精锐', cls: 'melee', sz: 1, hp: 80, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 1.9, spd: 50, dmgType: 'melee', bonus: { 19: 12, 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    elephant: { name: '象兵', cls: 'melee', sz: 1.6, aoe: true, hp: 450, atk: 15, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 30, 13: 30 }, armorTags: [5, 8, 19, 31] },
    eastern_swordsman: { name: '东方剑士', cls: 'melee', sz: 1, hp: 60, atk: 9, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 29: 6 }, armorTags: [1, 31] },
    hei_kuang: { name: '南北朝黑光铠骑兵', cls: 'cav', sz: 1, hp: 60, atk: 11, meleeArmor: 4, pierceArmor: 3, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    fire_archer: { name: '东吴火箭手', cls: 'ranged', sz: 1, hp: 35, atk: 5, meleeArmor: 0, pierceArmor: 0, rng: 360, reload: 3.5, spd: 50, dmgType: 'pierce', bonus: { 16: 3, 20: 1, 21: 4, 27: 2 }, armorTags: [15, 19, 31] },
    iron_pagoda: { name: '金国铁浮屠', cls: 'cav', sz: 1, hp: 115, atk: 12, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.15, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    kipchak: { name: '库曼钦察弓骑', cls: 'cav', sz: 1, kite: 60, hp: 40, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.2, spd: 130, dmgType: 'pierce', bonus: { 27: 1 }, armorTags: [28, 15, 8, 19, 31] },
    longbowman_elite: { name: '不列颠长弓兵精锐', cls: 'ranged', sz: 1, hp: 40, atk: 7, meleeArmor: 0, pierceArmor: 1, rng: 240, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    pikeman: { name: '长枪兵', cls: 'melee', sz: 1, hp: 55, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 55, dmgType: 'melee', bonus: { 5: 25, 8: 22, 16: 16, 21: 1, 29: 1, 30: 18, 35: 7 }, armorTags: [27, 1, 31] },
    cav_archer: { name: '骑射手', cls: 'cav', sz: 1, kite: 60, hp: 50, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [28, 15, 8, 31] },
    light_riders: { name: '轻骑兵', cls: 'cav', sz: 1, hp: 60, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 25: 10 }, armorTags: [8, 31] },
    chukonu: { name: '华夏诸葛弩', cls: 'ranged', sz: 1, hp: 45, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    white_feather_guard: { name: '蜀汉白毦兵', cls: 'melee', sz: 1, hp: 95, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 8, 8: 8, 21: 2, 29: 4, 30: 6 }, armorTags: [1, 19, 31] },
    elite_white_feather_guard: { name: '蜀汉白毦兵精锐', cls: 'melee', sz: 1, hp: 100, atk: 8, meleeArmor: 0, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 8, 8: 8, 21: 2, 29: 4, 30: 7 }, armorTags: [1, 19, 31] },
    rattan_archer: { name: '越南藤弓兵', cls: 'ranged', sz: 1, hp: 40, atk: 6, meleeArmor: 0, pierceArmor: 4, rng: 160, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    elite_fire_lancer: { name: '南宋火矛手精锐', cls: 'melee', sz: 1, hp: 85, atk: 10, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 15, 8: 15, 16: 12, 21: 1, 30: 12 }, armorTags: [29, 1, 31, 23] },
    elite_fire_archer: { name: '东吴火箭手精锐', cls: 'ranged', sz: 1, hp: 40, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 400, reload: 3.5, spd: 50, dmgType: 'pierce', bonus: { 16: 4, 20: 1, 21: 4, 27: 2 }, armorTags: [15, 19, 31] },
    elite_chukonu: { name: '华夏诸葛弩精锐', cls: 'ranged', sz: 1, hp: 50, atk: 10, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    tarkan: { name: '匈奴答剌罕骑兵', cls: 'cav', sz: 1, hp: 100, atk: 8, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 11: 8, 13: 12, 22: 8, 26: 10 }, armorTags: [8, 19, 31] },
    elite_tarkan: { name: '匈奴答剌罕骑兵精锐', cls: 'cav', sz: 1, hp: 150, atk: 11, meleeArmor: 1, pierceArmor: 4, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 11: 10, 13: 12, 22: 10, 26: 10 }, armorTags: [8, 19, 31] },
    elite_guardsman: { name: '近卫军精锐', cls: 'melee', sz: 1, hp: 60, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 55, dmgType: 'melee', bonus: { 5: 28, 8: 32, 16: 17, 21: 1, 29: 1, 30: 26, 35: 7 }, armorTags: [27, 1, 31] },
    steppe_lancer: { name: '草原枪骑兵', cls: 'cav', sz: 1, hp: 60, atk: 9, meleeArmor: 0, pierceArmor: 1, rng: 40, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    ninja: { name: '日本忍者', cls: 'melee', sz: 1, hp: 50, atk: 9, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 1.8, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2, 36: 9 }, armorTags: [1, 31] },
    liao_dao: { name: '辽国大刀兵', cls: 'melee', sz: 1, hp: 75, atk: 9, meleeArmor: 3, pierceArmor: 1, rng: 0, reload: 2.4, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    elite_liao_dao: { name: '辽国大刀兵精锐', cls: 'melee', sz: 1, hp: 85, atk: 13, meleeArmor: 3, pierceArmor: 1, rng: 0, reload: 2.4, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    fire_lancer: { name: '南宋火矛手', cls: 'melee', sz: 1, hp: 65, atk: 9, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 5, 8: 5, 16: 4, 21: 1, 30: 4 }, armorTags: [29, 1, 31, 23] },
    swordsman: { name: '剑士', cls: 'melee', sz: 1, hp: 45, atk: 6, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 31] },
    kamayuk: { name: '印加枪兵长', cls: 'melee', sz: 1, hp: 70, atk: 7, meleeArmor: 1, pierceArmor: 0, rng: 40, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 20, 8: 8, 30: 6 }, armorTags: [1, 19, 31] },
    xianbei_raider: { name: '鲜卑掠骑兵', cls: 'cav', sz: 1, hp: 30, atk: 5, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 1.8, spd: 130, dmgType: 'pierce', bonus: { 1: 1, 27: 3 }, armorTags: [28, 15, 8, 19, 31] },
    tiger_rider: { name: '曹魏虎豹骑', cls: 'cav', sz: 1, hp: 110, atk: 11, meleeArmor: 0, pierceArmor: 4, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 15: 6 }, armorTags: [8, 19, 31] },
    jian_swordsman: { name: '华夏刀剑手', cls: 'melee', sz: 1, hp: 70, atk: 8, meleeArmor: 0, pierceArmor: 5, rng: 0, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 15: 4, 21: 2 }, armorTags: [1, 31, 29, 19] },
    imperial_skirmisher: { name: '越南帝王掷矛手', cls: 'ranged', sz: 1, hp: 35, atk: 4, meleeArmor: 0, pierceArmor: 5, rng: 200, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 5, 27: 4, 28: 3, 35: 3 }, armorTags: [15, 31, 38] },
    war_elephant: { name: '波斯战象', cls: 'melee', sz: 1, aoe: true, hp: 450, atk: 15, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 30, 13: 30 }, armorTags: [5, 8, 19, 31] },
    karambit_warrior: { name: '马来爪刀勇士', cls: 'melee', sz: 1, hp: 30, atk: 7, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 29: 2 }, armorTags: [1, 19, 31] },
    karambit_warrior_elite: { name: '马来爪刀勇士精锐', cls: 'melee', sz: 1, hp: 40, atk: 8, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31] },
    arambai: { name: '缅甸飞镖骑兵', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 12, meleeArmor: 0, pierceArmor: 1, rng: 200, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 17: 2 }, armorTags: [19, 28, 15, 8, 31] },
    mangudai: { name: '蒙古突骑', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.1, spd: 130, dmgType: 'pierce', bonus: { 20: 3, 27: 1 }, armorTags: [28, 15, 8, 19, 31] },
    keshik: { name: '鞑靼怯薛军', cls: 'cav', sz: 1, hp: 120, atk: 9, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    boyar: { name: '斯拉夫贵族铁骑', cls: 'cav', sz: 1, hp: 100, atk: 12, meleeArmor: 4, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    savar: { name: '萨珊萨瓦尔重骑', cls: 'cav', sz: 1, hp: 145, atk: 14, meleeArmor: 3, pierceArmor: 4, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', bonus: { 15: 2 }, armorTags: [8, 31] },
    elite_kipchak: { name: '库曼钦察弓骑精锐', cls: 'cav', sz: 1, kite: 60, hp: 45, atk: 5, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.2, spd: 130, dmgType: 'pierce', bonus: { 27: 1 }, armorTags: [28, 15, 8, 19, 31] },
    elite_composite_bowman: { name: '亚美尼亚复合弓手精锐', cls: 'ranged', sz: 1, hp: 50, atk: 4, meleeArmor: 2, pierceArmor: 0, rng: 160, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    camel_heavy: { name: '重装骆驼兵', cls: 'cav', sz: 1, hp: 120, atk: 7, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 18, 16: 9, 30: 9, 35: 7 }, armorTags: [30, 31, 39] },
    cav_archer_heavy: { name: '重装骑射手', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 7, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 4 }, armorTags: [28, 15, 8, 31] },
    composite_bowman: { name: '亚美尼亚复合弓手', cls: 'ranged', sz: 1, hp: 40, atk: 4, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    elite_steppe_lancer: { name: '草原枪骑兵精锐', cls: 'cav', sz: 1, hp: 80, atk: 11, meleeArmor: 0, pierceArmor: 2, rng: 40, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    throwing_axeman: { name: '法兰克掷斧兵', cls: 'ranged', sz: 1, hp: 60, atk: 7, meleeArmor: 0, pierceArmor: 0, rng: 120, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 1, 29: 1 }, armorTags: [1, 19, 31] },
    champion: { name: '冠军剑士', cls: 'melee', sz: 1, hp: 70, atk: 14, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 8 }, armorTags: [1, 31] },
    crossbowman: { name: '弩兵', cls: 'ranged', sz: 1, hp: 35, atk: 5, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3 }, armorTags: [15, 31] },
    paladin: { name: '游侠(圣骑士)', cls: 'cav', sz: 1, hp: 160, atk: 14, meleeArmor: 2, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    coustillier: { name: '勃艮第马上轻骑', cls: 'cav', sz: 1, hp: 115, atk: 8, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    heavy_pikeman: { name: '重装长枪兵', cls: 'melee', sz: 1, hp: 75, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 55, dmgType: 'melee', bonus: { 5: 25, 8: 22, 16: 16, 21: 1, 29: 1, 30: 18, 35: 7 }, armorTags: [27, 1, 31] },
    arbalest: { name: '劲弩手', cls: 'ranged', sz: 1, hp: 40, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3 }, armorTags: [15, 31] },
    hei_kuang_heavy: { name: '南北朝黑光铠骑兵精锐', cls: 'cav', sz: 1, hp: 90, atk: 12, meleeArmor: 4, pierceArmor: 3, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', bonus: { 1: 1 }, armorTags: [8, 31] },
    mangudai_elite: { name: '蒙古突骑精锐', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 8, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.1, spd: 130, dmgType: 'pierce', bonus: { 20: 5, 27: 1 }, armorTags: [28, 15, 8, 19, 31] },
    pattiyoda_longbowman: { name: '僧伽罗帕提尤达长弓手', cls: 'ranged', sz: 1, hp: 50, atk: 7, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.2, spd: 50, dmgType: 'pierce', bonus: { 5: 4, 27: 2 }, armorTags: [15, 19, 31] },
    battle_elephant: { name: '东南亚战斗象', cls: 'melee', sz: 1, aoe: true, hp: 250, atk: 12, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 4, 13: 4 }, armorTags: [5, 8, 31] },
    armored_elephant: { name: '装甲攻城战象', cls: 'melee', sz: 1, aoe: true, hp: 180, atk: 4, meleeArmor: -2, pierceArmor: 140, rng: 0, reload: 3.0, spd: 40, dmgType: 'melee', bonus: { 11: 90, 20: 25 }, armorTags: [5, 8, 20, 17, 31] },
    elite_armored_elephant: { name: '装甲攻城战象精锐', cls: 'melee', sz: 1, aoe: true, hp: 220, atk: 4, meleeArmor: -2, pierceArmor: 150, rng: 0, reload: 3.0, spd: 40, dmgType: 'melee', bonus: { 11: 105, 20: 35 }, armorTags: [5, 8, 20, 17, 31] },
    ballista_elephant: { name: '高棉弩炮战象', cls: 'ranged', sz: 1, hp: 250, atk: 9, meleeArmor: 0, pierceArmor: 3, rng: 200, reload: 2.5, spd: 40, dmgType: 'pierce', bonus: { 11: 2, 13: 3, 16: 8, 18: 100, 21: 3 }, armorTags: [8, 19, 5, 20, 31, 37] },
    elephant_archer: { name: '印度象弓骑兵', cls: 'ranged', sz: 1, hp: 230, atk: 6, meleeArmor: 0, pierceArmor: 2, rng: 160, reload: 2.0, spd: 40, dmgType: 'pierce', armorTags: [15, 8, 5, 28, 31] },
    bayinnaung_elephant: { name: '莽应龙御驾战象', cls: 'melee', sz: 1.1, aoe: true, hp: 400, atk: 18, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 10, 13: 10 }, armorTags: [5, 8, 19, 31, 36] },
    dagnajan_elephant: { name: '达格纳詹御驾战象', cls: 'ranged', sz: 1.1, hp: 930, atk: 12, meleeArmor: 1, pierceArmor: 7, rng: 160, reload: 2.5, spd: 40, dmgType: 'pierce', bonus: { 21: 4, 13: 4 }, armorTags: [15, 8, 19, 5, 28, 31, 36] },
    porus_elephant: { name: '波鲁斯王战象', cls: 'melee', sz: 1.1, aoe: true, hp: 530, atk: 16, meleeArmor: 1, pierceArmor: 5, rng: 0, reload: 2.5, spd: 40, dmgType: 'melee', bonus: { 21: 4, 13: 4 }, armorTags: [5, 8, 19, 31, 36] },
    rattan_archer_elite: { name: '越南藤弓兵精锐', cls: 'ranged', sz: 1, hp: 45, atk: 7, meleeArmor: 0, pierceArmor: 6, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    legionary: { name: '罗马军团步兵', cls: 'melee', sz: 1, hp: 75, atk: 12, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 31] },
    lancer: { name: '轻骑兵', cls: 'cav', sz: 1.15, hp: 60, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 25: 10 }, armorTags: [8, 31] },
    heavy_cavalry: { name: '重骑兵', cls: 'cav', sz: 1.15, hp: 100, atk: 10, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    general_cavalry: { name: '虎豹骑', cls: 'cav', sz: 1.15, hp: 110, atk: 11, meleeArmor: 0, pierceArmor: 4, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 15: 6 }, armorTags: [8, 19, 31] },
    horse_archer: { name: '突骑兵', cls: 'cav', sz: 1.15, kite: 60, hp: 50, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [28, 15, 8, 31] },
    archer: { name: '步弓手', cls: 'ranged', sz: 1, hp: 30, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3 }, armorTags: [15, 31] },
    crossbow: { name: '弩兵', cls: 'ranged', sz: 1, hp: 35, atk: 5, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3 }, armorTags: [15, 31] },
    ballista: { name: '元戎弩', cls: 'ranged', sz: 1, hp: 40, atk: 11, meleeArmor: 0, pierceArmor: 7, rng: 280, reload: 3.6, spd: 35, dmgType: 'pierce', bonus: { 1: 1, 5: 7, 11: 3, 17: 1 }, armorTags: [20, 31] },
    amazon_archer: { name: '亚马逊女弓手', cls: 'ranged', sz: 1, hp: 45, atk: 5, meleeArmor: 0, pierceArmor: 1, rng: 160, reload: 1.9, spd: 50, dmgType: 'pierce', bonus: { 1: 1, 27: 2 }, armorTags: [15, 31] },
    amazon_warrior: { name: '亚马逊女战士', cls: 'melee', sz: 1, hp: 45, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 31] },
    bactrian_archer: { name: '巴克特里亚弓手', cls: 'ranged', sz: 1, hp: 60, atk: 6, meleeArmor: 3, pierceArmor: 1, rng: 200, reload: 1.8, spd: 50, dmgType: 'pierce', bonus: { 8: 5, 27: 2 }, armorTags: [15, 31] },
    battering_ram: { name: '轻型攻城槌', cls: 'melee', sz: 1, hp: 175, atk: 2, meleeArmor: -3, pierceArmor: 180, rng: 0, reload: 5.0, spd: 55, dmgType: 'melee', bonus: { 11: 150, 20: 40 }, armorTags: [17, 20, 31] },
    berserk: { name: '维京狂战士', cls: 'melee', sz: 1, hp: 54, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    blackwood_archer: { name: '图皮黑木弓箭手', cls: 'ranged', sz: 1, hp: 20, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 1.5, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    bolas_rider: { name: '马普切套索骑兵', cls: 'cav', sz: 1, kite: 60, hp: 55, atk: 5, meleeArmor: 0, pierceArmor: 1, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 8: 2, 17: 2, 30: 2 }, armorTags: [19, 28, 15, 8, 31] },
    bombard_cannon: { name: '火炮', cls: 'ranged', aoe: true, sz: 1, hp: 80, atk: 40, meleeArmor: 2, pierceArmor: 5, rng: 480, reload: 6.5, spd: 50, dmgType: 'melee', bonus: { 11: 200, 13: 40, 16: 40, 20: 20, 37: 40 }, armorTags: [20, 23, 31] },
    camel_archer: { name: '柏柏尔骆驼弓骑', cls: 'cav', sz: 1, kite: 60, hp: 55, atk: 7, meleeArmor: 0, pierceArmor: 1, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 28: 4 }, armorTags: [19, 28, 30, 15, 31, 39] },
    camel_raider: { name: '骆驼突袭者', cls: 'cav', sz: 1, hp: 90, atk: 10, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 18, 16: 9, 30: 9, 35: 7 }, armorTags: [30, 31, 39] },
    camel_rider: { name: '骆驼骑兵', cls: 'cav', sz: 1, hp: 100, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 9, 16: 5, 30: 5 }, armorTags: [30, 31, 39] },
    camel_scout: { name: '古吉拉特骆驼斥候', cls: 'cav', sz: 1, hp: 70, atk: 2, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [30, 31, 39] },
    capped_ram: { name: '装甲攻城槌', cls: 'melee', sz: 1, hp: 200, atk: 3, meleeArmor: -2, pierceArmor: 190, rng: 0, reload: 5.0, spd: 55, dmgType: 'melee', bonus: { 11: 160, 20: 50 }, armorTags: [17, 20, 31] },
    cataphract: { name: '拜占庭圣骑兵', cls: 'cav', sz: 1, hp: 110, atk: 9, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', bonus: { 1: 9 }, armorTags: [8, 19, 31] },
    centurion: { name: '罗马百夫长', cls: 'cav', sz: 1, hp: 110, atk: 13, meleeArmor: 2, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    chakram_thrower: { name: '古吉拉特飞轮掷手', cls: 'ranged', sz: 1, hp: 40, atk: 3, meleeArmor: 1, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 1, 29: 1 }, armorTags: [1, 19, 31] },
    champion_runner: { name: '印加尚皮飞毛腿', cls: 'melee', sz: 1, hp: 40, atk: 5, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 20: 2, 29: 1 }, armorTags: [1, 31] },
    champion_scout: { name: '印加尚皮斥候', cls: 'melee', sz: 1, hp: 35, atk: 3, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 8: 1, 20: 2, 29: 3, 30: 1 }, armorTags: [1, 31] },
    companion_cavalry: { name: '马其顿伙伴骑兵', cls: 'cav', sz: 1, hp: 90, atk: 11, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 19: 5 }, armorTags: [8, 31, 19] },
    condottiero: { name: '意大利佣兵', cls: 'melee', sz: 1, hp: 80, atk: 10, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 1.9, spd: 55, dmgType: 'melee', bonus: { 21: 2, 23: 10 }, armorTags: [1, 19, 31, 32] },
    conquistador: { name: '西班牙征服者', cls: 'cav', sz: 1, kite: 60, hp: 55, atk: 16, meleeArmor: 2, pierceArmor: 1, rng: 240, reload: 2.9, spd: 130, dmgType: 'pierce', bonus: { 17: 4 }, armorTags: [15, 8, 19, 23, 28, 31] },
    cretan_archer: { name: '克里特弓箭手', cls: 'ranged', sz: 1, hp: 45, atk: 8, meleeArmor: 0, pierceArmor: 1, rng: 240, reload: 2.1, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    eagle_scout: { name: '美洲鹰斥候', cls: 'melee', sz: 1, hp: 50, atk: 4, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 20: 3, 25: 8 }, armorTags: [29, 1, 31] },
    eagle_warrior: { name: '美洲鹰勇士', cls: 'melee', sz: 1, hp: 55, atk: 7, meleeArmor: 0, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 8: 3, 16: 1, 20: 3, 25: 8, 30: 2 }, armorTags: [29, 1, 31] },
    ekdromos: { name: '埃克德罗摩斯', cls: 'melee', sz: 1, hp: 80, atk: 13, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 6 }, armorTags: [1, 31] },
    elite_arambai: { name: '缅甸飞镖骑兵精锐', cls: 'cav', sz: 1, kite: 60, hp: 65, atk: 14, meleeArmor: 0, pierceArmor: 2, rng: 200, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 17: 2 }, armorTags: [19, 28, 15, 8, 31] },
    elite_ballista_elephant: { name: '高棉弩炮战象精锐', cls: 'ranged', sz: 1, kite: 60, aoe: true, hp: 280, atk: 10, meleeArmor: 0, pierceArmor: 3, rng: 200, reload: 2.5, spd: 40, dmgType: 'pierce', bonus: { 11: 4, 13: 4, 16: 8, 18: 100, 21: 4 }, armorTags: [8, 19, 5, 20, 31, 37] },
    elite_battle_elephant: { name: '东南亚战斗象精锐', cls: 'melee', sz: 1, aoe: true, hp: 300, atk: 14, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 7, 13: 7 }, armorTags: [5, 8, 31] },
    elite_berserk: { name: '维京狂战士精锐', cls: 'melee', sz: 1, hp: 62, atk: 14, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    elite_blackwood_archer: { name: '图皮黑木弓箭手精锐', cls: 'ranged', sz: 1, hp: 25, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 1.5, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    elite_bolas_rider: { name: '马普切套索骑兵精锐', cls: 'cav', sz: 1, kite: 60, hp: 65, atk: 6, meleeArmor: 0, pierceArmor: 2, rng: 200, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 8: 3, 17: 2, 30: 3 }, armorTags: [19, 28, 15, 8, 31] },
    elite_boyar: { name: '斯拉夫贵族铁骑精锐', cls: 'cav', sz: 1, hp: 130, atk: 14, meleeArmor: 8, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_camel_archer: { name: '柏柏尔骆驼弓骑精锐', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 8, meleeArmor: 1, pierceArmor: 1, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 28: 6 }, armorTags: [19, 28, 30, 15, 31, 39] },
    elite_cataphract: { name: '拜占庭圣骑兵精锐', cls: 'cav', sz: 1, hp: 150, atk: 12, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 1.7, spd: 130, dmgType: 'melee', bonus: { 1: 12 }, armorTags: [8, 19, 31] },
    elite_centurion: { name: '罗马百夫长精锐', cls: 'cav', sz: 1, hp: 155, atk: 15, meleeArmor: 3, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_chakram_thrower: { name: '古吉拉特飞轮掷手精锐', cls: 'ranged', sz: 1, hp: 50, atk: 4, meleeArmor: 1, pierceArmor: 0, rng: 240, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 1: 1, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    elite_champi_warrior: { name: '印加尚皮勇士精锐', cls: 'melee', sz: 1, hp: 65, atk: 11, meleeArmor: 0, pierceArmor: 4, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 20: 3, 21: 3, 29: 1 }, armorTags: [1, 31] },
    elite_conquistador: { name: '西班牙征服者精锐', cls: 'cav', sz: 1, kite: 60, hp: 70, atk: 19, meleeArmor: 2, pierceArmor: 2, rng: 240, reload: 2.9, spd: 130, dmgType: 'pierce', bonus: { 11: 2, 17: 6 }, armorTags: [15, 8, 19, 23, 28, 31] },
    elite_coustillier: { name: '勃艮第马上轻骑精锐', cls: 'cav', sz: 1, hp: 145, atk: 11, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_eagle_warrior: { name: '美洲鹰勇士精锐', cls: 'melee', sz: 1, hp: 60, atk: 9, meleeArmor: 0, pierceArmor: 4, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 8: 4, 16: 2, 20: 5, 25: 10, 30: 3 }, armorTags: [29, 1, 31] },
    elite_elephant_archer: { name: '印度象弓骑兵精锐', cls: 'ranged', sz: 1, kite: 60, hp: 280, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 160, reload: 2.0, spd: 40, dmgType: 'pierce', armorTags: [5, 8, 15, 28, 31] },
    elite_gbeto: { name: '马里格贝托女兵精锐', cls: 'ranged', sz: 1, hp: 50, atk: 13, meleeArmor: 0, pierceArmor: 0, rng: 240, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 29: 1 }, armorTags: [1, 19, 31] },
    elite_genitour: { name: '柏柏尔标枪骑兵精锐', cls: 'cav', sz: 1, kite: 60, hp: 55, atk: 4, meleeArmor: 0, pierceArmor: 4, rng: 160, reload: 3.0, spd: 130, dmgType: 'pierce', bonus: { 15: 5, 27: 3, 28: 2, 35: 2 }, armorTags: [15, 8, 28, 19, 31, 38] },
    elite_genoese_crossbowman: { name: '意大利热那亚弩手精锐', cls: 'ranged', sz: 1, hp: 50, atk: 6, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 5: 7, 8: 7, 16: 5, 30: 6 }, armorTags: [15, 19, 31] },
    elite_ghulam: { name: '印度斯坦古拉姆精锐', cls: 'melee', sz: 1, hp: 70, atk: 11, meleeArmor: 0, pierceArmor: 6, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 15: 6, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    elite_guecha_warrior: { name: '穆伊斯卡格查勇士精锐', cls: 'ranged', sz: 1, hp: 60, atk: 8, meleeArmor: 0, pierceArmor: 5, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 4, 27: 2, 28: 2 }, armorTags: [15, 31, 38, 19] },
    elite_huskarl: { name: '哥特近卫军精锐', cls: 'melee', sz: 1, hp: 70, atk: 12, meleeArmor: 0, pierceArmor: 8, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 15: 10, 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    elite_hussite_wagon: { name: '波希米亚胡斯战车精锐', cls: 'ranged', sz: 1, hp: 230, atk: 13, meleeArmor: 1, pierceArmor: 10, rng: 240, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 11: 2, 17: 3 }, armorTags: [20, 19, 23, 31, 37] },
    elite_ibirapema_warrior: { name: '图皮战棍勇士精锐', cls: 'melee', sz: 1, hp: 90, atk: 11, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 3 }, armorTags: [1, 19, 31] },
    elite_iron_pagoda: { name: '金国铁浮屠精锐', cls: 'cav', sz: 1, hp: 140, atk: 13, meleeArmor: 2, pierceArmor: 3, rng: 0, reload: 2.15, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_jaguar_warrior: { name: '阿兹特克豹勇士精锐', cls: 'melee', sz: 1, hp: 75, atk: 19, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 1: 6, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    elite_janissary: { name: '土耳其禁卫军精锐', cls: 'ranged', sz: 1, hp: 40, atk: 22, meleeArmor: 2, pierceArmor: 0, rng: 320, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 17: 3 }, armorTags: [15, 19, 23, 31] },
    elite_kamayuk: { name: '印加枪兵长精锐', cls: 'melee', sz: 1, hp: 80, atk: 8, meleeArmor: 1, pierceArmor: 1, rng: 40, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 5: 20, 8: 12, 30: 10 }, armorTags: [1, 19, 31] },
    elite_keshik: { name: '鞑靼怯薛军精锐', cls: 'cav', sz: 1, hp: 145, atk: 11, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_kona: { name: '马普切科纳勇士精锐', cls: 'cav', sz: 1, hp: 145, atk: 11, meleeArmor: 0, pierceArmor: 5, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 23: 5 }, armorTags: [8, 19, 31] },
    elite_konnik: { name: '保加利亚骑兵精锐', cls: 'cav', sz: 1, hp: 120, atk: 14, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.4, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_konnik_foot: { name: '下马保加利亚骑兵精锐', cls: 'melee', sz: 1, hp: 50, atk: 13, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.4, spd: 55, dmgType: 'melee', bonus: { 21: 4 }, armorTags: [1, 19, 31] },
    elite_leitis: { name: '立陶宛列提斯精锐', cls: 'cav', sz: 1, hp: 130, atk: 16, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_mameluke: { name: '萨拉森马穆鲁克精锐', cls: 'cav', sz: 1, kite: 60, hp: 80, atk: 10, meleeArmor: 1, pierceArmor: 0, rng: 120, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 12 }, armorTags: [35, 30, 19, 31, 39] },
    elite_monaspa: { name: '格鲁吉亚莫纳斯帕精锐', cls: 'cav', sz: 1, hp: 80, atk: 14, meleeArmor: 5, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_obuch: { name: '波兰奥布奇战锤兵精锐', cls: 'melee', sz: 1, hp: 95, atk: 10, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 6, 29: 3 }, armorTags: [1, 19, 31] },
    elite_organ_gun: { name: '葡萄牙风琴炮精锐', cls: 'ranged', sz: 1, hp: 70, atk: 8, meleeArmor: 2, pierceArmor: 6, rng: 280, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 1: 2, 11: 1, 17: 1, 38: 2 }, armorTags: [20, 19, 23, 31] },
    elite_plumed_archer: { name: '玛雅羽箭手精锐', cls: 'ranged', sz: 1, hp: 65, atk: 5, meleeArmor: 0, pierceArmor: 2, rng: 200, reload: 1.9, spd: 50, dmgType: 'pierce', bonus: { 1: 2, 27: 2 }, armorTags: [15, 19, 31] },
    elite_ratha_melee: { name: '孟加拉拉塔战车精锐', cls: 'cav', sz: 1, hp: 115, atk: 12, meleeArmor: 3, pierceArmor: 3, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 15, 19, 28, 31] },
    elite_ratha_ranged: { name: '孟加拉拉塔战车(弓)精锐', cls: 'cav', sz: 1, kite: 60, hp: 115, atk: 6, meleeArmor: 3, pierceArmor: 3, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [8, 15, 19, 28, 31] },
    elite_scythian_horse_archer: { name: '斯基泰骑射手精锐', cls: 'cav', sz: 1, kite: 60, hp: 60, atk: 8, meleeArmor: 0, pierceArmor: 1, rng: 240, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 4 }, armorTags: [28, 15, 8, 31] },
    elite_serjeant: { name: '西西里军士长精锐', cls: 'melee', sz: 1, hp: 85, atk: 11, meleeArmor: 6, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    elite_shotel_warrior: { name: '埃塞俄比亚弯刀勇士精锐', cls: 'melee', sz: 1, hp: 50, atk: 18, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31, 39] },
    elite_shrivamsha_rider: { name: '古吉拉特什里瓦姆沙骑手精锐', cls: 'cav', sz: 1, hp: 70, atk: 11, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_skirmisher: { name: '掷矛手精锐', cls: 'ranged', sz: 1, hp: 35, atk: 3, meleeArmor: 0, pierceArmor: 4, rng: 200, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 4, 27: 4, 28: 2, 35: 2 }, armorTags: [15, 31, 38] },
    elite_temple_guard: { name: '穆伊斯卡神庙守卫精锐', cls: 'melee', sz: 1, hp: 115, atk: 14, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 8, 8: 8, 16: 6, 21: 2, 30: 6 }, armorTags: [1, 19, 31, 29] },
    elite_teutonic_knight: { name: '条顿武士精锐', cls: 'melee', sz: 1, hp: 110, atk: 17, meleeArmor: 10, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 4 }, armorTags: [1, 19, 31] },
    elite_throwing_axeman: { name: '法兰克掷斧兵精锐', cls: 'ranged', sz: 1, hp: 70, atk: 8, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    elite_tiger_cavalry: { name: '曹魏虎豹骑精锐', cls: 'cav', sz: 1, hp: 125, atk: 13, meleeArmor: 0, pierceArmor: 5, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 15: 7 }, armorTags: [8, 19, 31] },
    elite_urumi_swordsman: { name: '达罗毗荼软剑士精锐', cls: 'melee', sz: 1, hp: 65, atk: 11, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 3 }, armorTags: [1, 19, 31] },
    elite_war_chariot: { name: '双轮战车精锐', cls: 'cav', sz: 1, hp: 125, atk: 10, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 1: 8 }, armorTags: [8, 19, 31] },
    elite_war_dog: { name: '战犬精锐', cls: 'melee', sz: 1, hp: 55, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 1.7, spd: 55, dmgType: 'melee', armorTags: [29, 31] },
    elite_war_elephant: { name: '波斯战象精锐', cls: 'melee', sz: 1, aoe: true, hp: 600, atk: 20, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 11: 30, 13: 30 }, armorTags: [5, 8, 19, 31] },
    elite_war_wagon: { name: '高丽战车精锐', cls: 'cav', sz: 1, kite: 60, hp: 200, atk: 9, meleeArmor: 0, pierceArmor: 4, rng: 200, reload: 2.5, spd: 130, dmgType: 'pierce', bonus: { 21: 2 }, armorTags: [15, 8, 19, 28, 31] },
    elite_woad_raider: { name: '凯尔特靛蓝突袭者精锐', cls: 'melee', sz: 1, hp: 85, atk: 15, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 3 }, armorTags: [1, 19, 31] },
    flaming_camel: { name: '鞑靼火焰骆驼', cls: 'melee', sz: 1, hp: 55, atk: 20, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 130, 8: 50, 11: 200, 20: 25, 30: 50 }, armorTags: [19, 30, 31, 39] },
    flemish_pikeman: { name: '勃艮第佛兰德民兵', cls: 'melee', sz: 1, hp: 40, atk: 5, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 6, 8: 6, 16: 4, 29: 2, 30: 4 }, armorTags: [1, 19, 31] },
    flemish_pikeman_f: { name: '勃艮第佛兰德民兵F', cls: 'melee', sz: 1, hp: 40, atk: 5, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 6, 8: 6, 16: 4, 29: 2, 30: 4 }, armorTags: [1, 19, 31] },
    gbeto: { name: '马里格贝托女兵', cls: 'ranged', sz: 1, hp: 40, atk: 10, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 29: 1 }, armorTags: [1, 19, 31] },
    genitour: { name: '柏柏尔标枪骑兵', cls: 'cav', sz: 1, kite: 60, hp: 50, atk: 3, meleeArmor: 0, pierceArmor: 4, rng: 160, reload: 3.0, spd: 130, dmgType: 'pierce', bonus: { 15: 4, 27: 3, 35: 2 }, armorTags: [15, 8, 28, 19, 31, 38] },
    genoese_crossbowman: { name: '意大利热那亚弩手', cls: 'ranged', sz: 1, hp: 50, atk: 10, meleeArmor: 1, pierceArmor: 4, rng: 240, reload: 4.2, spd: 50, dmgType: 'pierce', bonus: { 27: 6 }, armorTags: [15, 31] },
    ghulam: { name: '印度斯坦古拉姆', cls: 'melee', sz: 1, hp: 60, atk: 9, meleeArmor: 0, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 15: 5, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    greek_noble_cavalry: { name: '希腊贵族骑兵', cls: 'cav', sz: 1, hp: 150, atk: 10, meleeArmor: 3, pierceArmor: 4, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    grenadier: { name: '女真掷弹兵', cls: 'ranged', sz: 1, hp: 40, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 240, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 1: 9, 17: 3, 21: 4, 27: 1 }, armorTags: [15, 19, 31, 23] },
    guecha_warrior: { name: '穆伊斯卡格查勇士', cls: 'ranged', sz: 1, hp: 55, atk: 6, meleeArmor: 0, pierceArmor: 3, rng: 120, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 3, 27: 2, 28: 2 }, armorTags: [15, 31, 38, 19] },
    hand_cannoneer: { name: '手炮手', cls: 'ranged', sz: 1, hp: 40, atk: 17, meleeArmor: 1, pierceArmor: 0, rng: 280, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 1: 10, 17: 2, 27: 1 }, armorTags: [15, 23, 31] },
    heavy_rocket_cart: { name: '重型火箭车', cls: 'ranged', aoe: true, sz: 1, hp: 65, atk: 5, meleeArmor: 0, pierceArmor: 8, rng: 320, reload: 5.35, spd: 50, dmgType: 'melee', bonus: { 11: 12, 20: 2, 22: 7, 26: 7, 37: 5 }, armorTags: [20, 31, 23] },
    heavy_scorpion: { name: '重型弩炮', cls: 'ranged', sz: 1, hp: 60, atk: 14, meleeArmor: 1, pierceArmor: 8, rng: 280, reload: 3.6, spd: 50, dmgType: 'pierce', bonus: { 1: 2, 5: 10, 11: 6, 17: 2 }, armorTags: [20, 31] },
    hill_tribesman: { name: '山地部落民', cls: 'melee', sz: 1, hp: 55, atk: 9, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 5, 29: 6 }, armorTags: [1, 19, 31] },
    hippeus: { name: '斯巴达希皮乌斯', cls: 'melee', sz: 1, hp: 90, atk: 9, meleeArmor: 2, pierceArmor: 4, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4 }, armorTags: [1, 19, 31] },
    hoplite: { name: '希腊重装步兵', cls: 'melee', sz: 1, hp: 55, atk: 10, meleeArmor: 1, pierceArmor: 1, rng: 20, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 2 }, armorTags: [1, 19, 31] },
    houfnice: { name: '波希米亚榴弹炮', cls: 'ranged', aoe: true, sz: 1, hp: 90, atk: 50, meleeArmor: 2, pierceArmor: 6, rng: 480, reload: 6.5, spd: 50, dmgType: 'melee', bonus: { 11: 250, 13: 50, 16: 50, 20: 20, 37: 50 }, armorTags: [20, 23, 31] },
    huskarl: { name: '哥特近卫军', cls: 'melee', sz: 1, hp: 60, atk: 10, meleeArmor: 0, pierceArmor: 6, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 15: 6, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    hussar: { name: '骠骑兵', cls: 'cav', sz: 1, hp: 75, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 25: 12 }, armorTags: [8, 31] },
    hussite_wagon: { name: '波希米亚胡斯战车', cls: 'ranged', sz: 1, hp: 160, atk: 10, meleeArmor: 0, pierceArmor: 7, rng: 240, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 11: 1, 17: 3 }, armorTags: [20, 19, 23, 31, 37] },
    ibirapema_warrior: { name: '图皮战棍勇士', cls: 'melee', sz: 1, hp: 80, atk: 8, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31] },
    immortal: { name: '波斯长生军', cls: 'melee', sz: 1, hp: 50, atk: 10, meleeArmor: 0, pierceArmor: 3, rng: 0, reload: 1.8, spd: 55, dmgType: 'melee', armorTags: [15, 19, 31, 1] },
    immortal_ranged: { name: '波斯长生军(弓)', cls: 'ranged', sz: 1, hp: 50, atk: 5, meleeArmor: 0, pierceArmor: 3, rng: 160, reload: 1.8, spd: 50, dmgType: 'pierce', armorTags: [15, 19, 31, 1] },
    imperial_camel_rider: { name: '印度斯坦帝王骆驼', cls: 'cav', sz: 1, hp: 140, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 18, 16: 9, 30: 9, 35: 7 }, armorTags: [30, 31, 39] },
    imperial_centurion: { name: '帝国百夫长', cls: 'cav', sz: 1, hp: 150, atk: 12, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 1.7, spd: 130, dmgType: 'melee', bonus: { 1: 12 }, armorTags: [8, 19, 31] },
    indian_tribesman: { name: '印度部落民', cls: 'melee', sz: 1, hp: 70, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.5, spd: 55, dmgType: 'melee', bonus: { 5: 20, 8: 8, 21: 1, 29: 1 }, armorTags: [27, 1, 31] },
    iroquois_warrior: { name: '易洛魁战士', cls: 'melee', sz: 1, hp: 65, atk: 8, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    jaguar_warrior: { name: '阿兹特克豹勇士', cls: 'melee', sz: 1, hp: 65, atk: 15, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 1: 5, 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    janissary: { name: '土耳其禁卫军', cls: 'ranged', sz: 1, hp: 35, atk: 17, meleeArmor: 1, pierceArmor: 0, rng: 280, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 17: 2 }, armorTags: [15, 19, 23, 31] },
    knight: { name: '骑士', cls: 'cav', sz: 1, hp: 100, atk: 10, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    kona: { name: '马普切科纳勇士', cls: 'cav', sz: 1, hp: 125, atk: 9, meleeArmor: 0, pierceArmor: 3, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 23: 5 }, armorTags: [19, 8, 31] },
    konnik: { name: '保加利亚骑兵', cls: 'cav', sz: 1, hp: 100, atk: 12, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.4, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    konnik_foot: { name: '下马保加利亚骑兵', cls: 'melee', sz: 1, hp: 45, atk: 12, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.4, spd: 55, dmgType: 'melee', bonus: { 21: 4 }, armorTags: [1, 19, 31] },
    leitis: { name: '立陶宛列提斯', cls: 'cav', sz: 1, hp: 100, atk: 13, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    longbowman: { name: '不列颠长弓兵', cls: 'ranged', sz: 1, hp: 35, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    magyar_huszar: { name: '马扎尔骠骑兵', cls: 'cav', sz: 1, hp: 90, atk: 11, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', bonus: { 17: 2, 20: 8 }, armorTags: [8, 19, 31] },
    mameluke: { name: '萨拉森马穆鲁克', cls: 'cav', sz: 1, kite: 60, hp: 80, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 120, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 8: 9 }, armorTags: [35, 30, 19, 31, 39] },
    mangonel: { name: '轻型投石车', cls: 'ranged', aoe: true, sz: 1, hp: 50, atk: 40, meleeArmor: 0, pierceArmor: 6, rng: 280, reload: 6.0, spd: 50, dmgType: 'melee', bonus: { 11: 35, 20: 12, 37: 40 }, armorTags: [20, 31] },
    mercenary_hoplite: { name: '希腊雇佣重步兵', cls: 'melee', sz: 1, hp: 70, atk: 10, meleeArmor: 3, pierceArmor: 1, rng: 12, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 4 }, armorTags: [1, 19, 31] },
    militia: { name: '民兵', cls: 'melee', sz: 1, hp: 40, atk: 4, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', armorTags: [1, 31] },
    monaspa: { name: '格鲁吉亚莫纳斯帕', cls: 'cav', sz: 1, hp: 70, atk: 12, meleeArmor: 3, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    mounted_trebuchet: { name: '契丹巨型投石机', cls: 'cav', sz: 1, kite: 60, hp: 75, atk: 30, meleeArmor: 2, pierceArmor: 4, rng: 400, reload: 6.5, spd: 130, dmgType: 'melee', bonus: { 11: 10, 20: 30, 37: 30 }, armorTags: [20, 31, 19, 37, 30, 39] },
    obuch: { name: '波兰奥布奇战锤兵', cls: 'melee', sz: 1, hp: 80, atk: 8, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 2 }, armorTags: [1, 19, 31] },
    onager: { name: '中型投石车', cls: 'ranged', aoe: true, sz: 1, hp: 60, atk: 50, meleeArmor: 0, pierceArmor: 7, rng: 320, reload: 6.0, spd: 50, dmgType: 'melee', bonus: { 11: 45, 20: 12, 37: 50 }, armorTags: [20, 31] },
    organ_gun: { name: '葡萄牙风琴炮', cls: 'ranged', sz: 1, hp: 50, atk: 6, meleeArmor: 2, pierceArmor: 4, rng: 280, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 1: 2, 17: 1, 38: 2 }, armorTags: [20, 19, 23, 31] },
    petard: { name: '爆破工兵', cls: 'melee', sz: 1, hp: 50, atk: 25, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 11: 500, 20: 60, 22: 900, 26: 100 }, armorTags: [31] },
    phalangite: { name: '马其顿方阵步兵', cls: 'melee', sz: 1, hp: 50, atk: 6, meleeArmor: 1, pierceArmor: 0, rng: 72, reload: 2.5, spd: 50, dmgType: 'melee', bonus: { 5: 20, 8: 6, 30: 4 }, armorTags: [1, 19, 31] },
    plumed_archer: { name: '玛雅羽箭手', cls: 'ranged', sz: 1, hp: 50, atk: 5, meleeArmor: 0, pierceArmor: 1, rng: 160, reload: 1.9, spd: 50, dmgType: 'pierce', bonus: { 1: 1, 27: 2 }, armorTags: [15, 19, 31] },
    qizilbash_warrior: { name: '红头骑士(奇兹尔巴什)', cls: 'cav', sz: 1, hp: 100, atk: 8, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 15: 2 }, armorTags: [8, 31] },
    ratha_melee: { name: '孟加拉拉塔战车', cls: 'cav', sz: 1, hp: 100, atk: 10, meleeArmor: 3, pierceArmor: 1, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 15, 19, 28, 31] },
    ratha_ranged: { name: '孟加拉拉塔战车(弓)', cls: 'cav', sz: 1, kite: 60, hp: 100, atk: 5, meleeArmor: 3, pierceArmor: 1, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 1 }, armorTags: [8, 15, 19, 28, 31] },
    rhodian_slinger: { name: '罗得岛投石兵', cls: 'ranged', sz: 1, hp: 40, atk: 1, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 1: 15, 27: 1 }, armorTags: [15, 19, 31] },
    rhomphaia_warrior: { name: '色雷斯长刃斩手', cls: 'melee', sz: 1, hp: 60, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 8: 14, 21: 6, 29: 2, 30: 12 }, armorTags: [1, 19, 31] },
    rocket_cart: { name: '火箭车', cls: 'ranged', aoe: true, sz: 1, hp: 45, atk: 5, meleeArmor: 0, pierceArmor: 6, rng: 280, reload: 5.5, spd: 50, dmgType: 'melee', bonus: { 11: 7, 20: 2, 22: 6, 26: 7, 37: 5 }, armorTags: [20, 31, 23] },
    royal_janissary: { name: '奥斯曼皇家禁卫军', cls: 'ranged', sz: 1, hp: 55, atk: 22, meleeArmor: 2, pierceArmor: 0, rng: 320, reload: 3.45, spd: 50, dmgType: 'pierce', bonus: { 17: 3 }, armorTags: [15, 19, 23, 31] },
    sacred_band: { name: '底比斯圣队', cls: 'melee', sz: 1, hp: 65, atk: 13, meleeArmor: 3, pierceArmor: 1, rng: 20, reload: 2.0, spd: 50, dmgType: 'melee', bonus: { 21: 2 }, armorTags: [1, 19, 31] },
    sannahya: { name: '孔雀王朝桑纳亚战象', cls: 'melee', sz: 1, aoe: true, hp: 300, atk: 10, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 40, dmgType: 'melee', bonus: { 13: 4, 21: 4 }, armorTags: [5, 8, 31, 19] },
    scorpion: { name: '弩炮', cls: 'ranged', sz: 1, hp: 40, atk: 11, meleeArmor: 0, pierceArmor: 7, rng: 280, reload: 3.6, spd: 50, dmgType: 'pierce', bonus: { 1: 1, 5: 7, 11: 3, 17: 1 }, armorTags: [20, 31] },
    scythian_axe_cavalry: { name: '斯基泰斧骑兵', cls: 'cav', sz: 1, hp: 130, atk: 10, meleeArmor: 2, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    scythian_horse_archer: { name: '斯基泰骑射手', cls: 'cav', sz: 1, kite: 60, hp: 50, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [28, 15, 8, 31] },
    serjeant: { name: '西西里军士长', cls: 'melee', sz: 1, hp: 50, atk: 5, meleeArmor: 2, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    shotel_warrior: { name: '埃塞俄比亚弯刀勇士', cls: 'melee', sz: 1, hp: 45, atk: 16, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 29: 2 }, armorTags: [1, 19, 31, 39] },
    shrivamsha_rider: { name: '古吉拉特什里瓦姆沙骑手', cls: 'cav', sz: 1, hp: 55, atk: 8, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    sickle_warrior: { name: '达罗毗荼镰刀战士', cls: 'melee', sz: 1, hp: 60, atk: 6, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 1.33, spd: 55, dmgType: 'melee', bonus: { 29: 2 }, armorTags: [1, 19, 31, 39] },
    siege_onager: { name: '重型攻城投石车', cls: 'ranged', aoe: true, sz: 1, hp: 70, atk: 75, meleeArmor: 0, pierceArmor: 8, rng: 320, reload: 6.0, spd: 50, dmgType: 'melee', bonus: { 11: 60, 20: 12, 37: 50 }, armorTags: [20, 31] },
    siege_ram: { name: '重型攻城槌', cls: 'melee', sz: 1, hp: 270, atk: 4, meleeArmor: -1, pierceArmor: 195, rng: 0, reload: 5.0, spd: 55, dmgType: 'melee', bonus: { 11: 200, 20: 65 }, armorTags: [17, 20, 31] },
    skirmisher: { name: '掷矛手', cls: 'ranged', sz: 1, hp: 30, atk: 2, meleeArmor: 0, pierceArmor: 3, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 3, 27: 3, 35: 2 }, armorTags: [15, 31, 38] },
    slinger: { name: '投石兵', cls: 'ranged', sz: 1, hp: 35, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 1: 4, 20: 3, 25: 4, 27: 1 }, armorTags: [15, 31, 38] },
    sogdian_cataphract: { name: '粟特甲胄骑兵', cls: 'cav', sz: 1, hp: 110, atk: 12, meleeArmor: 0, pierceArmor: 5, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 15: 6 }, armorTags: [8, 19, 31] },
    sparabara: { name: '波斯持盾步兵', cls: 'melee', sz: 1, hp: 70, atk: 7, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31, 36] },
    spearman: { name: '长矛兵', cls: 'melee', sz: 1, hp: 45, atk: 3, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 55, dmgType: 'melee', bonus: { 5: 15, 8: 15, 16: 9, 21: 1, 29: 1, 30: 12 }, armorTags: [27, 1, 31] },
    strategos: { name: '雅典将军卫队', cls: 'melee', sz: 1, hp: 60, atk: 15, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', armorTags: [1, 19, 31] },
    takabara: { name: '波斯轻盾标枪兵', cls: 'melee', sz: 1, hp: 80, atk: 9, meleeArmor: 1, pierceArmor: 3, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 3, 29: 6 }, armorTags: [1, 19, 31, 36] },
    temple_guard: { name: '穆伊斯卡神庙守卫', cls: 'melee', sz: 1, hp: 100, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 5: 5, 8: 5, 16: 4, 30: 4 }, armorTags: [1, 19, 31, 29] },
    teutonic_knight: { name: '条顿武士', cls: 'melee', sz: 1, hp: 90, atk: 14, meleeArmor: 7, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 4 }, armorTags: [1, 19, 31] },
    thracian_peltast: { name: '色雷斯标枪手', cls: 'ranged', sz: 1, hp: 40, atk: 7, meleeArmor: 0, pierceArmor: 3, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3, 28: 3 }, armorTags: [15, 31, 38] },
    traction_trebuchet: { name: '牵引投石机', cls: 'ranged', sz: 1, hp: 115, atk: 50, meleeArmor: 1, pierceArmor: 8, rng: 560, reload: 11.0, spd: 50, dmgType: 'melee', bonus: { 11: 230 }, armorTags: [17, 20, 31] },
    two_handed_swordsman: { name: '双手剑士', cls: 'melee', sz: 1, hp: 65, atk: 12, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 8 }, armorTags: [1, 31] },
    urumi_swordsman: { name: '达罗毗荼软剑士', cls: 'melee', sz: 1, hp: 55, atk: 9, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31] },
    war_chariot: { name: '双轮战车', cls: 'cav', sz: 1, hp: 100, atk: 8, meleeArmor: 1, pierceArmor: 0, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 1: 5 }, armorTags: [8, 19, 31] },
    war_chariot_ranged: { name: '双轮远程战车', cls: 'cav', sz: 1, kite: 60, hp: 65, atk: 8, meleeArmor: 0, pierceArmor: 5, rng: 240, reload: 6.5, spd: 130, dmgType: 'pierce', bonus: { 11: 2 }, armorTags: [8, 20, 19, 31, 37] },
    war_dog: { name: '战犬', cls: 'melee', sz: 1, hp: 50, atk: 9, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 1.7, spd: 55, dmgType: 'melee', armorTags: [29, 31] },
    war_wagon: { name: '高丽战车', cls: 'cav', sz: 1, kite: 60, hp: 150, atk: 9, meleeArmor: 0, pierceArmor: 2, rng: 160, reload: 2.5, spd: 130, dmgType: 'pierce', bonus: { 21: 2 }, armorTags: [15, 8, 19, 28, 31] },
    warrior_priest: { name: '亚美尼亚修士战士', cls: 'melee', sz: 1, hp: 80, atk: 11, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', armorTags: [1, 25, 19, 31] },
    winged_hussar: { name: '波兰翼骑兵', cls: 'cav', sz: 1, hp: 80, atk: 9, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', bonus: { 23: 4, 25: 14 }, armorTags: [8, 31] },
    woad_raider: { name: '凯尔特靛蓝突袭者', cls: 'melee', sz: 1, hp: 70, atk: 11, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    xolotl_warrior: { name: '阿兹特克索洛特尔骑兵', cls: 'cav', sz: 1, hp: 100, atk: 10, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    longswordsman: {name:"长剑士",cls:"melee",sz:1,hp:60,atk:9,meleeArmor:1,pierceArmor:1,rng:0,reload:2,spd:45,dmgType:"melee",bonus:{29:6,21:3},armorTags:[1,31]},
    champi_warrior: { name: '印加尚皮勇士',cls:"melee",sz:1,hp:55,atk:9,meleeArmor:0,pierceArmor:3,rng:0,reload:2,spd:55,dmgType:"melee",bonus:{29:1,21:2,20:3},armorTags:[1,31]},
    champi_runner: { name: '印加尚皮飞毛腿',cls:"melee",sz:1,hp:40,atk:5,meleeArmor:0,pierceArmor:2,rng:0,reload:2,spd:55,dmgType:"melee",bonus:{29:1,20:2},armorTags:[1,31]},
    champi_scout: { name: '印加尚皮斥候',cls:"melee",sz:1,hp:35,atk:3,meleeArmor:0,pierceArmor:2,rng:0,reload:2,spd:55,dmgType:"melee",bonus:{29:3,8:1,30:1,20:2},armorTags:[1,31]},
    jian_swordman_unshielded: {name:"双手剑士(华夏)",cls:"melee",sz:1,hp:70,atk:11,meleeArmor:0,pierceArmor:2,rng:0,reload:2.0,spd:50,dmgType:"melee",bonus:{21:2,15:4},armorTags:[1,19,29,31]},
    cavalier: {name:"重装骑士",cls:"cav",sz:1.2,hp:120,atk:12,meleeArmor:2,pierceArmor:2,rng:0,reload:1.8,spd:130,dmgType:"melee",armorTags:[8,31]},
    ant_scout: {name:"斥候骑兵",cls:"cav",sz:1.1,hp:45,atk:3,meleeArmor:0,pierceArmor:2,rng:0,reload:2,spd:130,dmgType:"melee",bonus:{25:6},armorTags:[8,31]},
    flamethrower: { name: '猛火油柜(喷火器)',cls:"ranged",sz:1.1,aoe:true,hp:160,atk:4,meleeArmor:2,pierceArmor:2,rng:200,reload:0.25,spd:40,dmgType:"melee",bonus:{11:4,13:10},armorTags:[20,31]},
    helepolis: { name: '希腊赫勒波利斯攻城塔',cls:"ranged",sz:1.4,hp:350,atk:20,meleeArmor:-2,pierceArmor:100,rng:440,reload:5,spd:30,dmgType:"pierce",bonus:{16:50},armorTags:[20,17,31]},
    siege_tower: { name: '攻城塔', cls: 'ranged', sz: 1.4, hp: 220, atk: 6, meleeArmor: -2, pierceArmor: 100, rng: 240, reload: 4.0, spd: 40, dmgType: 'pierce', bonus: { 11: 6 }, armorTags: [20, 17, 31] },
    halberdier: { name: '戟兵', cls: 'melee', sz: 1, hp: 60, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 55, dmgType: 'melee', bonus: { 5: 28, 8: 32, 16: 17, 21: 1, 29: 1, 30: 26, 35: 7 }, armorTags: [27, 1, 31] },
    norse_warrior: { name: '诺斯狂暴战士', cls: 'melee', sz: 1, hp: 60, atk: 9, meleeArmor: 0, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 29: 6 }, armorTags: [1, 31] },
    sosso_guard: { name: '西非索索禁卫军', cls: 'melee', sz: 1, hp: 95, atk: 15, meleeArmor: 1, pierceArmor: 2, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 1, 29: 2 }, armorTags: [1, 19, 31] },
    elite_greek_cavalry: { name: '希腊贵族骑兵精锐', cls: 'cav', sz: 1, hp: 150, atk: 10, meleeArmor: 3, pierceArmor: 4, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    jian_swordman_shielded: { name: '持盾刀剑手', cls: 'melee', sz: 1, hp: 70, atk: 8, meleeArmor: 0, pierceArmor: 5, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 15: 4, 21: 2 }, armorTags: [1, 29, 19, 31] },
    levy: { name: '征召民兵', cls: 'melee', sz: 1, hp: 35, atk: 3, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', armorTags: [1, 31] },
    gastraphetes: { name: '希腊腹弩手', cls: 'ranged', sz: 1, hp: 45, atk: 8, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 3.5, spd: 50, dmgType: 'pierce', bonus: { 27: 4 }, armorTags: [15, 31] },
    laminated_bowman: { name: '层压复合弓手', cls: 'ranged', sz: 1, hp: 40, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    recurve_bowman: { name: '反曲长弓手', cls: 'ranged', sz: 1, hp: 35, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 240, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [15, 19, 31] },
    paragon: { name: '圣殿楷模武士', cls: 'melee', sz: 1, hp: 80, atk: 15, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 8 }, armorTags: [1, 19, 31] },
    shock_cavalry: { name: '冲击重骑兵', cls: 'cav', sz: 1, hp: 120, atk: 15, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', bonus: { 1: 8 }, armorTags: [8, 19, 31] },
    imperial_cavalry: { name: '帝国具装骑兵', cls: 'cav', sz: 1, hp: 130, atk: 12, meleeArmor: 3, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', bonus: { 1: 10 }, armorTags: [8, 19, 31] },
    equites: { name: '罗马伴随骑士', cls: 'cav', sz: 1, hp: 90, atk: 9, meleeArmor: 2, pierceArmor: 2, rng: 0, reload: 1.8, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    sarmatian: { name: '萨尔马提亚重骑兵', cls: 'cav', sz: 1, hp: 140, atk: 13, meleeArmor: 3, pierceArmor: 3, rng: 0, reload: 1.9, spd: 130, dmgType: 'melee', armorTags: [8, 19, 31] },
    elite_peltast: { name: '色雷斯标枪手精锐', cls: 'ranged', sz: 1, hp: 40, atk: 4, meleeArmor: 0, pierceArmor: 4, rng: 200, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 4, 27: 4, 28: 2, 35: 2 }, armorTags: [15, 31, 38] },
    vanguard: { name: '先锋重装步兵', cls: 'melee', sz: 1, hp: 70, atk: 13, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 4, 29: 6 }, armorTags: [1, 19, 31] },
    bowman: { name: '弓兵', cls: 'ranged', sz: 1, hp: 30, atk: 4, meleeArmor: 0, pierceArmor: 0, rng: 200, reload: 2.0, spd: 50, dmgType: 'pierce', bonus: { 27: 3 }, armorTags: [15, 31] },
    crusader_knight: { name: '十字军骑士', cls: 'cav', sz: 1, hp: 100, atk: 18, meleeArmor: 4, pierceArmor: 4, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    raider: { name: '掠骑兵', cls: 'cav', sz: 1, hp: 60, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', armorTags: [8, 31] },
    guardsman: { name: '近卫军', cls: 'melee', sz: 1, hp: 65, atk: 7, meleeArmor: 1, pierceArmor: 1, rng: 0, reload: 2.0, spd: 55, dmgType: 'melee', bonus: { 21: 2, 29: 2 }, armorTags: [1, 19, 31] },
    antiquity_skirmisher: { name: '古典掷矛手', cls: 'ranged', sz: 1, hp: 30, atk: 2, meleeArmor: 0, pierceArmor: 3, rng: 160, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 3, 27: 3, 35: 2 }, armorTags: [15, 31, 38] },
    elite_antiquity_skirmisher: { name: '古典掷矛手精锐', cls: 'ranged', sz: 1, hp: 35, atk: 3, meleeArmor: 0, pierceArmor: 4, rng: 200, reload: 3.0, spd: 50, dmgType: 'pierce', bonus: { 15: 4, 27: 4, 28: 2, 35: 2 }, armorTags: [15, 31, 38] },
    antiquity_cavalry_archer: { name: '古典骑射手', cls: 'cav', sz: 1, hp: 50, atk: 6, meleeArmor: 0, pierceArmor: 0, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 2 }, armorTags: [28, 15, 8, 31] },
    antiquity_heavy_cavalry_archer: { name: '重装古典骑射手', cls: 'cav', sz: 1, hp: 60, atk: 7, meleeArmor: 1, pierceArmor: 0, rng: 160, reload: 2.0, spd: 130, dmgType: 'pierce', bonus: { 27: 4 }, armorTags: [28, 15, 8, 31] },
    antiquity_light_cavalry: { name: '古典轻骑兵', cls: 'cav', sz: 1, hp: 60, atk: 7, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 25: 10 }, armorTags: [8, 31] },
    antiquity_scout_cavalry: { name: '古典斥候骑兵', cls: 'cav', sz: 1, hp: 45, atk: 3, meleeArmor: 0, pierceArmor: 2, rng: 0, reload: 2.0, spd: 130, dmgType: 'melee', bonus: { 25: 6 }, armorTags: [8, 31] },
    antiquity_spearman: { name: '古典长矛兵', cls: 'melee', sz: 1, hp: 45, atk: 3, meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 3.0, spd: 55, dmgType: 'melee', bonus: { 5: 15, 8: 15, 16: 9, 21: 1, 29: 1, 30: 12 }, armorTags: [27, 1, 31] },
    antiquity_battering_ram: { name: '古典轻型攻城槌', cls: 'melee', sz: 1, hp: 175, atk: 2, meleeArmor: -3, pierceArmor: 180, rng: 0, reload: 5.0, spd: 55, dmgType: 'melee', bonus: { 11: 150, 20: 40 }, armorTags: [17, 20, 31] },
    antiquity_capped_ram: { name: '古典装甲攻城槌', cls: 'melee', sz: 1, hp: 200, atk: 3, meleeArmor: -2, pierceArmor: 190, rng: 0, reload: 5.0, spd: 55, dmgType: 'melee', bonus: { 11: 160, 20: 50 }, armorTags: [17, 20, 31] },
    antiquity_scorpion: { name: '古典弩炮', cls: 'ranged', sz: 1, hp: 40, atk: 11, meleeArmor: 0, pierceArmor: 7, rng: 280, reload: 3.6, spd: 50, dmgType: 'pierce', bonus: { 1: 1, 5: 7, 11: 3, 17: 1 }, armorTags: [20, 31] },
    antiquity_heavy_scorpion: { name: '古典重型弩炮', cls: 'ranged', sz: 1, hp: 60, atk: 14, meleeArmor: 1, pierceArmor: 8, rng: 280, reload: 3.6, spd: 50, dmgType: 'pierce', bonus: { 1: 2, 5: 10, 11: 6, 17: 2 }, armorTags: [20, 31] },
    antiquity_mangonel: { name: '古典轻型投石车', cls: 'ranged', sz: 1, aoe: true, hp: 50, atk: 40, meleeArmor: 0, pierceArmor: 6, rng: 280, reload: 6.0, spd: 50, dmgType: 'melee', bonus: { 11: 35, 20: 12, 37: 40 }, armorTags: [20, 31] },
    antiquity_onager: { name: '古典中型投石车', cls: 'ranged', sz: 1, aoe: true, hp: 60, atk: 50, meleeArmor: 0, pierceArmor: 7, rng: 320, reload: 6.0, spd: 50, dmgType: 'melee', bonus: { 11: 45, 20: 12, 37: 50 }, armorTags: [20, 31] },
    antiquity_siege_onager: { name: '古典重型投石车', cls: 'ranged', sz: 1, aoe: true, hp: 70, atk: 75, meleeArmor: 0, pierceArmor: 8, rng: 320, reload: 6.0, spd: 50, dmgType: 'melee', bonus: { 11: 60, 20: 12, 37: 50 }, armorTags: [20, 31] },
    antiquity_siege_ram: { name: '古典重型攻城槌', cls: 'melee', sz: 1, hp: 270, atk: 4, meleeArmor: -1, pierceArmor: 195, rng: 0, reload: 5.0, spd: 55, dmgType: 'melee', bonus: { 11: 200, 20: 65 }, armorTags: [17, 20, 31] },
    antiquity_siege_tower: { name: '古典攻城塔', cls: 'ranged', sz: 1.4, hp: 220, atk: 6, meleeArmor: -2, pierceArmor: 100, rng: 240, reload: 4.0, spd: 40, dmgType: 'pierce', bonus: { 11: 6 }, armorTags: [20, 17, 31] },
};


const SIGHT_MAP: Record<string, number> = {
    // ── [2026-08-18 补齐] 新补录兵种：同族继承其基准单位；无同族者远程取射程+80、骑兵200、象/攻城280、步兵160（对齐 DE 规律：视野必须 ≥ 射程） ──
    antiquity_battering_ram: 120,
    antiquity_capped_ram: 120,
    antiquity_cavalry_archer: 240,
    antiquity_heavy_cavalry_archer: 240,
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
    tarantine_cavalry: 240,
    amazon_archer: 240,
    amazon_warrior: 120,
    arambai: 280,
    arbalest: 280,
    archer: 240,
    armored: 160,
    armored_elephant: 160,
    axe: 120,
    bactrian_archer: 280,
    ballista: 360,
    ballista_elephant: 280,
    battle_elephant: 280,
    bayinnaung_elephant: 200,
    dagnajan_elephant: 280,
    battering_ram: 120,
    berserk: 120,
    blackwood_archer: 240,
    bolas_rider: 280,
    bombard_cannon: 560,
    boyar: 200,
    camel_archer: 200,
    camel_heavy: 200,
    camel_raider: 160,
    camel_rider: 200,
    camel_scout: 160,
    capped_ram: 120,
    cataphract: 160,
    cav_archer: 200,
    cav_archer_heavy: 240,
    centurion: 160,
    chakram_thrower: 280,
    champion: 200,
    champion_runner: 200,
    champion_scout: 200,
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
    elephant_archer: 280,
    elite_arambai: 280,
    elite_armored_elephant: 160,
    elite_ballista_elephant: 280,
    elite_battle_elephant: 320,
    elite_berserk: 200,
    elite_blackwood_archer: 240,
    elite_bolas_rider: 280,
    elite_boyar: 200,
    elite_camel_archer: 200,
    elite_cataphract: 200,
    elite_centurion: 200,
    elite_chakram_thrower: 320,
    elite_champi_warrior: 240,
    elite_chukonu: 240,
    elite_composite_bowman: 280,
    elite_conquistador: 360,
    elite_coustillier: 200,
    elite_eagle_warrior: 240,
    elite_elephant_archer: 280,
    elite_fire_archer: 440,
    elite_fire_lancer: 240,
    elite_gbeto: 280,
    elite_genitour: 240,
    elite_genoese_crossbowman: 320,
    elite_ghulam: 240,
    elite_guardsman: 160,
    elite_guecha_warrior: 200,
    elite_huskarl: 200,
    elite_hussite_wagon: 320,
    elite_ibirapema_warrior: 200,
    elite_iron_pagoda: 200,
    elite_jaguar_warrior: 200,
    elite_janissary: 400,
    elite_kamayuk: 200,
    elite_keshik: 200,
    elite_kipchak: 240,
    elite_kona: 240,
    elite_konnik: 200,
    elite_konnik_foot: 120,
    elite_leitis: 200,
    elite_liao_dao: 120,
    elite_mameluke: 200,
    elite_monaspa: 200,
    elite_obuch: 120,
    elite_organ_gun: 360,
    elite_plumed_archer: 240,
    elite_ratha_melee: 240,
    elite_ratha_ranged: 240,
    elite_scythian_horse_archer: 240,
    elite_serjeant: 200,
    elite_shotel_warrior: 120,
    elite_shrivamsha_rider: 240,
    elite_skirmisher: 280,
    elite_steppe_lancer: 200,
    elite_tarkan: 280,
    elite_temple_guard: 240,
    elite_teutonic_knight: 200,
    elite_throwing_axeman: 240,
    elite_tiger_cavalry: 200,
    elite_urumi_swordsman: 120,
    elite_war_chariot: 3.75,
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
    genitour: 200,
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
    horse_archer: 200,
    houfnice: 560,
    huskarl: 120,
    hussar: 160,
    hussite_wagon: 320,
    ibirapema_warrior: 200,
    immortal: 200,
    immortal_ranged: 200,
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
    kipchak: 240,
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
    mameluke: 200,
    mangonel: 360,
    mangudai: 240,
    mangudai_elite: 240,
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
    pikeman: 160,
    plumed_archer: 240,
    porus_elephant: 280,
    qizilbash_warrior: 160,
    ratha_melee: 240,
    ratha_ranged: 240,
    rattan_archer: 240,
    rattan_archer_elite: 240,
    rhodian_slinger: 280,
    rhomphaia_warrior: 160,
    rocket_cart: 360,
    royal_janissary: 400,
    sacred_band: 160,
    samurai: 160,
    samurai_elite: 200,
    sannahya: 280,
    savar: 200,
    scorpion: 360,
    scythian_axe_cavalry: 200,
    scythian_horse_archer: 200,
    serjeant: 120,
    shield: 200,
    shotel_warrior: 120,
    shrivamsha_rider: 200,
    sickle_warrior: 120,
    siege_onager: 400,
    siege_ram: 120,
    skirmisher: 240,
    slinger: 280,
    sogdian_cataphract: 200,
    sparabara: 120,
    spear: 160,
    spearman: 160,
    steppe_lancer: 200,
    strategos: 240,
    swordsman: 160,
    takabara: 120,
    tarkan: 200,
    temple_guard: 200,
    teutonic_knight: 120,
    thracian_peltast: 280,
    throwing_axeman: 200,
    tiger_rider: 200,
    traction_trebuchet: 720,
    two_handed_swordsman: 200,
    urumi_swordsman: 120,
    war_chariot: 3.75,
    war_chariot_ranged: 3.75,
    war_dog: 200,
    war_elephant: 280,
    war_wagon: 280,
    warrior_priest: 120,
    white_feather_guard: 160,
    winged_hussar: 160,
    woad_raider: 120,
    xianbei_raider: 240,
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

/**
 * 取某兵种完整数据（🔴 已迁入类方法 `Scene13WarLayer.statsFor`：按 side 查科技分表，
 * 每方按自己文化区 + 当前年份算，同一兵种攻守双方数值可能不同）。
 * 原模块函数 statsOf 直接读 WAR_TYPES 基础档、不含科技——2026-08-18 军事科技接线时删除。
 */

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

/** 五阵型 9 口布局查找表（row 0 最靠中线；idx = 出兵口展开序）：
 *  triangle 三角 2+3+4 = 尖刀2 / 中坚3 / 后4（近战尖刀前、弓骑后）
 *  echelon 雁行 4+3+2 = 前4 / 中3 / 后2（近战顶前、远程后）
 *  fish_scale 鱼鳞 3+4+2 = 前3 / 中4 / 后2（前抵·鳞叠·尾收）
 *  crane_wing 鹤翼 2+4+3 = 双锋2 / 鹤翼4 / 中军3（双锋引敌·两翼合围）
 *  square 方阵 3+3+3 = 前3 / 中3 / 后3（九宫等边·坚若磐石） */
const LAYOUT: Record<FormationMode, { col: number; row: number; cols: number }[]> = {
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
};

/** 单兵绘制尺寸（px，可调；2026-08-11 主人「单兵尺寸放大些」30 → 50） */
const UNIT_PX = 50;

/**
 * 落点散开半径（px）——每个兵出生时分到一个**固定**偏移，终身不变。
 *
 * 治的病（2026-08-17 主人提问「攻方上路强、守方下路强会不会正好错开，导致战斗结束不了」）：
 *   aimAt 的后两级兜底（敌方出兵口 / 敌军重心）对全军返回**同一个坐标**，几百人挤向一个点，
 *   球心里的人身边全是自己人、65px 内找不到敌人 → 不寻敌、原地打转；两边强弱翼交错时
 *   还会磨成打不完的局（游戏 2026-08-16 已取消 120s 时间限制，打不完 = 引擎一直冻结、军团不动）。
 *
 * 实测（`scratch/war_sim.mjs`，量具已按本文件三处对齐：WING=0 / 敌口筛 pool>0 / 重心兜底）：
 *   | 局面（12 或 6 种子）           | 不散开        | 散开 120 |
 *   |--------------------------------|---------------|----------|
 *   | 强弱翼交错（攻上强/守下强）    | **1 局打不完** | 12/12 结束 |
 *   | 强弱翼同路                     | 6/6 结束      | 6/6 结束 |
 *   | 同兵种对镜                     | 6/6 结束      | 6/6 结束 |
 *   收尾干净度不变（败方余兵仍归 0）；平均时长 147s → 152s。
 *
 * 🔴 只许加在共用坐标上。加在「最近的那个敌兵」上会让兵停在敌人身旁 120px 处够不着，
 *    接战距离只有 65px，那等于把所有近战废掉。
 */
const AIM_JITTER = 120;


/**
 * 巡逻航路的「到达」判定半径（px）——见 aimAt。
 * 必须大于落点偏移 AIM_JITTER(120)，否则带偏移的兵永远判不到到达，会钉死在航点旁边。
 */
const ROUTE_ARRIVE = 200;

/**
 * 追击时绕着目标散开的半径（px）——治「一群兵冲着同一个点挤成团、来回颤抖」。
 *
 * 每个兵按自身固定角度（由 jx/jy 推出，终身不变）瞄准目标**周围一圈**而不是目标那一个点，
 * 于是从不同方向围上去，而不是全挤在同一条直线上。
 * 🔴 必须**小于近战够得着的 65px**：停不停手看的是「离目标本人多远」，
 *    偏移比 65 大就会出现「瞄着敌人旁边的空地、永远进不了攻击距离」——
 *    这正是共用坐标那个 120px 偏移绝不能套到具体敌兵身上的原因。
 */
const CHASE_RING = 45;

/**
 * 🔴 **两道闸当前是「只观察、不动手」**（主人 2026-08-17 傍晚定：
 *    「现在先允许打不完吧，这样才能看到出现的问题；如果没有问题，这个设计也就没必要了」）。
 *
 * 所以下面 NO_KILL_SEC / HARD_STOP_SEC 命中时**不再强制收场**，只做两件事：
 *   ① 控制台 warn 一条；② 往 `scratch/scene13_probe_log.jsonl` 单独落一条 `stallDetected` 记录。
 * 这很关键：挂住的那一局原本**一条记录都不会留**（诊断只在判负/停止时发一次），
 * 于是"卡了没有、卡在什么局面"事后无从查证。现在挂住会立刻留档，含双方场上/池里人数、
 * 已打多久、多久没死人 —— 之后要不要装这道闸，看这些记录说话。
 *
 * 要真正启用（一行）：把 `STALL_GUARD_ENFORCE` 改成 true。
 */
const STALL_GUARD_ENFORCE = false;

/**
 * ── 兜底：这场仗一定会结束（主人 2026-08-17 定：「不要让 13 战斗没有结束时间、士兵原地打转、无法结束」）──
 *
 * 背景：2026-08-16 主人取消了原来的 120s 看门狗，理由是它会把还在正常打的仗一刀砍断。
 * 那次取消之后，13 的唯一结束条件就只剩「一方兵力全灭」，一旦演出磨住，
 * 引擎会一直冻结（`BattleField.update` 在 `scene13Frozen` 时直接 return）→ 军团永远不动。
 *
 * 所以这里**不是**把那个 120s 看门狗装回来，而是两道只在「确实出事」时才响的闸：
 *   · NO_KILL_SEC：连续这么久一个人都没死 = 真的卡住（谁也够不着谁），立刻按兵力比判。
 *     正常仗每秒都在死人（实测一场 150s 的仗留下 1000~1700 具尸体），碰不到这条。
 *     🔴 60 秒不是拍脑袋：**最慢的兵**（象兵/攻城器械 spd=40）横穿全场 1900px 要 47 秒，
 *        收尾期胜方走去补最后几个人时，本来就会有几十秒没人死。定 25s 会把这种正常收尾误判掉
 *        （误判虽然赢家不变，但败方会剩一点残兵而不是被全歼，战果要写回引擎，不能马虎）。
 *     🔴 第一滴血之前不计时：开局双方要相向而行，步兵 spd=50 走完 1650px 需要 33 秒，
 *        从 0 开始计时会把每一场步兵仗都在 25~60 秒时掐掉。所以只有「已经死过人」才启用这条闸。
 *   · HARD_STOP_SEC：绝对上限，兜住「还在慢慢磨但明显打不完」的拉锯。
 *     🔴 600 不是随手写的，是被象兵打脸后改的：步兵局 168s、骑兵局 127s（真实规模 1350 精灵），
 *        但**象兵对镜要 415~459s**（450 血 + 高护甲，互相啃得极慢，四个种子实测）。
 *        原先定 240s 会把每一场象兵战都误判成「打不完」——这正是主人 2026-08-16 删掉
 *        老 120s 看门狗的同一个毛病（到点就砍正常仗）。600s ≈ 实测最慢局的 1.3 倍。
 *        真正的「卡住」由 NO_KILL_SEC 抓，那条不看总时长、只看有没有进展，才是主力判据。
 * 两道闸都走 `forceResultByRatio` —— 与素材防死锁同一条通道（onDecision → 引擎解冻结算），
 * 按当时兵力比判胜负，守方吃 0.85 城防折扣。不会出现"没人赢"的悬空局面。
 */
const NO_KILL_SEC = 60;
const HARD_STOP_SEC = 600;

/** AoE2 DE（SLD）动态帧框素材目录：走 hotspot 对齐渲染，读 `_meta.json`。其余（S10DB/征服版 SLP）走正方形帧。 */
const DE_DYN_DIRS = ["/SUCAI/AMAZONARCHER/","/SUCAI/AMAZONWARRIOR/","/SUCAI/ANTIQUITY_BATTERINGRAM/","/SUCAI/ANTIQUITY_CAPPED_RAM/","/SUCAI/ANTIQUITY_CAVALRY_ARCHER/","/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/","/SUCAI/ANTIQUITY_HEAVY_SCORPION/","/SUCAI/ANTIQUITY_LIGHT_CAVALRY/","/SUCAI/ANTIQUITY_MANGONEL/","/SUCAI/ANTIQUITY_ONAGER/","/SUCAI/ANTIQUITY_SCORPION/","/SUCAI/ANTIQUITY_SCOUT_CAVALRY/","/SUCAI/ANTIQUITY_SIEGE_ONAGER/","/SUCAI/ANTIQUITY_SIEGE_RAM/","/SUCAI/ANTIQUITY_SIEGE_TOWER/","/SUCAI/ANTIQUITY_SKIRMISHER/","/SUCAI/ANTIQUITY_SPEARMAN/","/SUCAI/ANT_SCOUT/","/SUCAI/ARAMBAI/","/SUCAI/ARBALEST/","/SUCAI/ARBALESTER/","/SUCAI/ARCHER/","/SUCAI/ARMORED_ELEPHANT/","/SUCAI/AZTEC_RAIDER/","/SUCAI/BACTRIAN_ARCHER/","/SUCAI/BALLISTAELEPHANT/","/SUCAI/BALLISTA_ELEPHANT/","/SUCAI/BATTERINGRAM/","/SUCAI/BATTLEELEPHANT/","/SUCAI/BAYINNAUNG_ELEPHANT/","/SUCAI/BERSERK/","/SUCAI/BLACKWOODARCHER/","/SUCAI/BOLASRIDER/","/SUCAI/BOMBARDCANNON/","/SUCAI/BOWMAN/","/SUCAI/BOYAR/","/SUCAI/CAMELARCHER/","/SUCAI/CAMELRIDER/","/SUCAI/CAMELSCOUT/","/SUCAI/CAMEL_HEAVY/","/SUCAI/CAMEL_IMPERIAL/","/SUCAI/CAMEL_RAIDER/","/SUCAI/CAPPEDRAM/","/SUCAI/CATAPHRACT/","/SUCAI/CAVALIER/","/SUCAI/CAVALRYARCHER/","/SUCAI/CAV_ARCHER/","/SUCAI/CAV_ARCHER_HEAVY/","/SUCAI/CENTURION/","/SUCAI/CHAKRAMTHROWER/","/SUCAI/CHAMPION/","/SUCAI/CHAMPIRUNNER/","/SUCAI/CHAMPISCOUT/","/SUCAI/CHAMPIWARRIOR/","/SUCAI/CHUKONU/","/SUCAI/COMPANION_CAVALRY/","/SUCAI/COMPOSITEBOWMAN/","/SUCAI/COMPOSITE_BOWMAN/","/SUCAI/CONDOTTIERO/","/SUCAI/CONQUISTADOR/","/SUCAI/COUSTILLIER/","/SUCAI/CRETAN_ARCHER/","/SUCAI/CROSSBOWMAN/","/SUCAI/CRUSADERKNIGHT/","/SUCAI/DAGNAJAN_ELEPHANT/","/SUCAI/EAGLESCOUT/","/SUCAI/EAGLEWARRIOR/","/SUCAI/EASTERN_SWORDSMAN/","/SUCAI/EKDROMOS/","/SUCAI/ELEPHANTARCHER/","/SUCAI/ELEPHANT_ARCHER/","/SUCAI/ELITEARAMBAI/","/SUCAI/ELITEARMOREDELEPHANT/","/SUCAI/ELITEBALLISTAELEPHANT/","/SUCAI/ELITEBATTLEELEPHANT/","/SUCAI/ELITEBERSERK/","/SUCAI/ELITEBLACKWOODARCHER/","/SUCAI/ELITEBOLASRIDER/","/SUCAI/ELITEBOYAR/","/SUCAI/ELITECAMELARCHER/","/SUCAI/ELITECATAPHRACT/","/SUCAI/ELITECENTURION/","/SUCAI/ELITECHAKRAMTHROWER/","/SUCAI/ELITECHAMPIWARRIOR/","/SUCAI/ELITECHUKONU/","/SUCAI/ELITECOMPOSITEBOWMAN/","/SUCAI/ELITECONQUISTADOR/","/SUCAI/ELITECOUSTILLIER/","/SUCAI/ELITEEAGLEWARRIOR/","/SUCAI/ELITEELEPHANTARCHER/","/SUCAI/ELITEFIREARCHER/","/SUCAI/ELITEFIRELANCER/","/SUCAI/ELITEFOOTKONNIK/","/SUCAI/ELITEGBETO/","/SUCAI/ELITEGENITOUR/","/SUCAI/ELITEGENOESECROSSBOWMAN/","/SUCAI/ELITEGHULAM/","/SUCAI/ELITEGUECHAWARRIOR/","/SUCAI/ELITEHUSKARL/","/SUCAI/ELITEHUSSITEWAGON/","/SUCAI/ELITEIBIRAPEMAWARRIOR/","/SUCAI/ELITEIRONPAGODA/","/SUCAI/ELITEJAGUARWARRIOR/","/SUCAI/ELITEJANISSARY/","/SUCAI/ELITEKAMAYUK/","/SUCAI/ELITEKARAMBITWARRIOR/","/SUCAI/ELITEKESHIK/","/SUCAI/ELITEKIPCHAK/","/SUCAI/ELITEKONA/","/SUCAI/ELITEKONNIK/","/SUCAI/ELITELEITIS/","/SUCAI/ELITELIAODAO/","/SUCAI/ELITELONGBOWMAN/","/SUCAI/ELITEMAMELUKE/","/SUCAI/ELITEMANGUDAI/","/SUCAI/ELITEMONASPA/","/SUCAI/ELITEOBUCH/","/SUCAI/ELITEORGANGUN/","/SUCAI/ELITEPLUMEDARCHER/","/SUCAI/ELITERATHAMELEE/","/SUCAI/ELITERATHARANGED/","/SUCAI/ELITERATTANARCHER/","/SUCAI/ELITESAMURAI/","/SUCAI/ELITESERJEANT/","/SUCAI/ELITESHOTELWARRIOR/","/SUCAI/ELITESHRIVAMSHARIDER/","/SUCAI/ELITESKIRMISHER/","/SUCAI/ELITESTEPPELANCER/","/SUCAI/ELITETARKAN/","/SUCAI/ELITETEMPLEGUARD/","/SUCAI/ELITETEUTONICKNIGHT/","/SUCAI/ELITETHROWINGAXEMAN/","/SUCAI/ELITETIGERCAVALRY/","/SUCAI/ELITEURUMISWORDSMAN/","/SUCAI/ELITEWARDOG/","/SUCAI/ELITEWARELEPHANT/","/SUCAI/ELITEWARWAGON/","/SUCAI/ELITEWHITEFEATHERGUARD/","/SUCAI/ELITEWOADRAIDER/","/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/","/SUCAI/ELITE_CHUKONU/","/SUCAI/ELITE_COMPOSITE_BOWMAN/","/SUCAI/ELITE_FIRE_ARCHER/","/SUCAI/ELITE_FIRE_LANCER/","/SUCAI/ELITE_GREEK_CAVALRY/","/SUCAI/ELITE_GUARDSMAN/","/SUCAI/ELITE_HOPLITE/","/SUCAI/ELITE_KIPCHAK/","/SUCAI/ELITE_LIAO_DAO/","/SUCAI/ELITE_PELTAST/","/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/","/SUCAI/ELITE_STEPPE_LANCER/","/SUCAI/ELITE_TARKAN/","/SUCAI/ELITE_WAR_CHARIOT/","/SUCAI/ELITE_WHITE_FEATHER_GUARD/","/SUCAI/EQUITES/","/SUCAI/FIREARCHER/","/SUCAI/FIRELANCER/","/SUCAI/FIRE_ARCHER/","/SUCAI/FIRE_LANCER/","/SUCAI/FLAMETHROWER/","/SUCAI/FLAMINGCAMEL/","/SUCAI/FLEMISHPIKEMAN/","/SUCAI/FLEMISHPIKEMAN_F/","/SUCAI/FOOTKONNIK/","/SUCAI/GASTRAPHETES/","/SUCAI/GBETO/","/SUCAI/GENITOUR/","/SUCAI/GENOESECROSSBOWMAN/","/SUCAI/GHULAM/","/SUCAI/GREEK_NOBLE_CAVALRY/","/SUCAI/GRENADIER/","/SUCAI/GUARDSMAN/","/SUCAI/GUECHAWARRIOR/","/SUCAI/GUECHA_ELITE/","/SUCAI/HALBERDIER/","/SUCAI/HANDCANNONEER/","/SUCAI/HEAVYCAMELRIDER/","/SUCAI/HEAVYCAVALRYARCHER/","/SUCAI/HEAVYHEIKUANG/","/SUCAI/HEAVYPIKEMAN/","/SUCAI/HEAVYROCKETCART/","/SUCAI/HEAVYSCORPION/","/SUCAI/HEAVY_PIKEMAN/","/SUCAI/HEIKUANG/","/SUCAI/HEI_KUANG/","/SUCAI/HEI_KUANG_HEAVY/","/SUCAI/HELEPOLIS/","/SUCAI/HILL_TRIBESMAN/","/SUCAI/HIPPEUS/","/SUCAI/HOPLITE/","/SUCAI/HOUFNICE/","/SUCAI/HUSKARL/","/SUCAI/HUSSAR/","/SUCAI/HUSSITEWAGON/","/SUCAI/IBIRAPEMAWARRIOR/","/SUCAI/IBIRAPEMA_ELITE/","/SUCAI/IMMORTAL/","/SUCAI/IMPERIALCAMELRIDER/","/SUCAI/IMPERIALCENTURION/","/SUCAI/IMPERIALSKIRMISHER/","/SUCAI/IMPERIAL_CAVALRY/","/SUCAI/IMPERIAL_SKIRMISHER/","/SUCAI/INDIAN_TRIBESMAN/","/SUCAI/IRONPAGODA/","/SUCAI/IRON_PAGODA/","/SUCAI/IROQUOISWARRIOR/","/SUCAI/JAGUARWARRIOR/","/SUCAI/JANISSARY/","/SUCAI/JIANSWORDMANSHIELDED/","/SUCAI/JIAN_SWORDMAN_UNSHIELDED/","/SUCAI/JIAN_SWORDSMAN/","/SUCAI/JI_INFANTRY/","/SUCAI/JI_INFANTRY_ELITE/","/SUCAI/KAMAYUK/","/SUCAI/KARAMBITWARRIOR/","/SUCAI/KARAMBIT_WARRIOR/","/SUCAI/KARAMBIT_WARRIOR_ELITE/","/SUCAI/KESHIK/","/SUCAI/KIPCHAK/","/SUCAI/KNIGHT/","/SUCAI/KONA/","/SUCAI/KONNIK/","/SUCAI/LAMINATED_BOWMAN/","/SUCAI/LANCER/","/SUCAI/LEGIONARY/","/SUCAI/LEITIS/","/SUCAI/LEVY/","/SUCAI/LIAODAO/","/SUCAI/LIAO_DAO/","/SUCAI/LIGHTCAVALRY/","/SUCAI/LIGHT_RIDERS/","/SUCAI/LONGBOWMAN/","/SUCAI/LONGBOWMAN_ELITE/","/SUCAI/LONGSWORDSMAN/","/SUCAI/MAGYARHUSZAR/","/SUCAI/MAMELUKE/","/SUCAI/MANATARMS/","/SUCAI/MANGONEL/","/SUCAI/MANGUDAI/","/SUCAI/MANGUDAI_ELITE/","/SUCAI/MILITIA/","/SUCAI/MONASPA/","/SUCAI/MOUNTEDTREBUCHET/","/SUCAI/NINJA/","/SUCAI/NORSE_WARRIOR/","/SUCAI/OBUCH/","/SUCAI/ONAGER/","/SUCAI/ORGANGUN/","/SUCAI/ORGAN_ELITE/","/SUCAI/PALADIN/","/SUCAI/PARAGON/","/SUCAI/PATTIYODA_LONGBOWMAN/","/SUCAI/PATTIYODHA_LONGBOWMAN/","/SUCAI/PETARD/","/SUCAI/PHALANGITE/","/SUCAI/PIKEMAN/","/SUCAI/PLUMEDARCHER/","/SUCAI/PORUS_ELEPHANT/","/SUCAI/PROJ_ARROW/","/SUCAI/PROJ_ARROW_FIRE/","/SUCAI/PROJ_BALL/","/SUCAI/PROJ_BOLT/","/SUCAI/PROJ_DART/","/SUCAI/PROJ_GRENADE/","/SUCAI/PROJ_SHOT/","/SUCAI/PROJ_SLING/","/SUCAI/PROJ_SPEAR/","/SUCAI/PROJ_THROWING_AXE/","/SUCAI/QIZILBASHWARRIOR/","/SUCAI/RAIDER/","/SUCAI/RANGED_IMMORTAL/","/SUCAI/RATHAMELEE/","/SUCAI/RATHARANGED/","/SUCAI/RATTANARCHER/","/SUCAI/RATTAN_ARCHER/","/SUCAI/RATTAN_ARCHER_ELITE/","/SUCAI/RECURVE_BOWMAN/","/SUCAI/RHODIAN_SLINGER/","/SUCAI/RHOMPHAIA_WARRIOR/","/SUCAI/ROCKETCART/","/SUCAI/ROYALJANISSARY/","/SUCAI/SACRED_BAND/","/SUCAI/SAKAN_AXEMAN/","/SUCAI/SAMURAI/","/SUCAI/SAMURAI_DE/","/SUCAI/SAMURAI_ELITE/","/SUCAI/SANNAHYA/","/SUCAI/SARMATIAN/","/SUCAI/SAVAR/","/SUCAI/SCORPION/","/SUCAI/SCOUTCAVALRY/","/SUCAI/SCYTHIAN_AXE_CAVALRY/","/SUCAI/SCYTHIAN_HORSE_ARCHER/","/SUCAI/SERJEANT/","/SUCAI/SHOCK_CAVALRY/","/SUCAI/SHOTELWARRIOR/","/SUCAI/SHRIVAMSHARIDER/","/SUCAI/SICKLE_WARRIOR/","/SUCAI/SIEGEELEPHANT/","/SUCAI/SIEGEONAGER/","/SUCAI/SIEGERAM/","/SUCAI/SIEGETOWER/","/SUCAI/SKIRMISHER/","/SUCAI/SLINGER/","/SUCAI/SOGDIANCATAPHRACT/","/SUCAI/SOSSO_GUARD/","/SUCAI/SPARABARA/","/SUCAI/SPEARMAN/","/SUCAI/STEPPELANCER/","/SUCAI/STEPPE_LANCER/","/SUCAI/STRATEGOS/","/SUCAI/SWORDSMAN/","/SUCAI/TARANTINE_CAVALRY/","/SUCAI/TARKAN/","/SUCAI/TEMPLEGUARD/","/SUCAI/TEUTONICKNIGHT/","/SUCAI/THRACIAN_PELTAST/","/SUCAI/THROWINGAXEMAN/","/SUCAI/THROWING_AXEMAN/","/SUCAI/TIGERCAVALRY/","/SUCAI/TIGER_RIDER/","/SUCAI/TRACTIONTREBUCHET/","/SUCAI/TWOHANDEDSWORDSMAN/","/SUCAI/URUMISWORDSMAN/","/SUCAI/VANGUARD/","/SUCAI/WARCHARIOT/","/SUCAI/WARDOG/","/SUCAI/WARRIORPRIEST/","/SUCAI/WARWAGON/","/SUCAI/WAR_CHARIOT/","/SUCAI/WAR_ELEPHANT/","/SUCAI/WHITEFEATHERGUARD/","/SUCAI/WHITE_FEATHER_GUARD/","/SUCAI/WINGEDHUSSAR/","/SUCAI/WOADRAIDER/","/SUCAI/XIANBEIRAIDER/","/SUCAI/XIANBEI_RAIDER/","/SUCAI/XOLOTLWARRIOR/"];

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
 * 云的缩放区间（目前 0.5 算最大，大小随机：0.28 ~ 0.50）。
 * ⚠️ 树那边的铁律是「原图多大画多大、绝不缩放」，云这里**可以缩**，原因不同：
 *   树的 6 个变体原始尺寸差 4 倍以上，统一到固定 W×H 会把小的放大糊掉、大的压扁，清晰度参差；
 *   云只有 9/10 两张且**尺寸完全相同**（927×817），纯缩小不会有清晰度参差。
 */
const CLOUD_SCALE_MAX = 0.5;
const CLOUD_SCALE_MIN = 0.28;
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
/**
 * 各兵种发射/出手相位表（0~8 相位）：shootPhase = DE type_50.frame_delay（攻击前摇帧）÷ attack_graphic.frame_count（动画总帧）× 8。
 * 放箭帧不再是「动画中点」一刀切——每个远程兵种的拉弓/撒放时机不同（掷矛手 3.38、骑射手 6.22、弓兵 4.0、火枪 4.0）。
 * 全表由 scratch/extract_de_shootphase.py 用 genieutils 从 empires2_x2_p1.dat 抽出（2026-08-17）。
 */
const SHOOT_PHASE_BY_TYPE: Record<string, number> = {
    // ── [2026-08-18 补齐] 新补录远程兵种：同族继承；无同族者用弓兵基准 3.73（DE 无对应单位，无法取真值） ──
    antiquity_cavalry_archer: 3.73,
    antiquity_heavy_cavalry_archer: 3.73,
    antiquity_heavy_scorpion: 1.6,
    antiquity_mangonel: 0.5,
    antiquity_onager: 0.5,
    antiquity_scorpion: 1.6,
    antiquity_siege_onager: 0.5,
    antiquity_siege_tower: 3.73,
    antiquity_skirmisher: 3.38,
    bowman: 3.73,
    elite_antiquity_skirmisher: 3.38,
    elite_peltast: 3.73,
    flamethrower: 3.73,
    gastraphetes: 3.73,
    helepolis: 3.73,
    laminated_bowman: 3.73,
    recurve_bowman: 3.73,
    siege_tower: 3.73,
    tarantine_cavalry: 3.2,
    // [2026-08-17 补全] 用 DE 真实数据精确对齐每个远程兵种的放箭相位：
    //   shootPhase = type_50.frame_delay（攻击前摇帧）÷ attack_graphic.frame_count（动画总帧）× 8。
    //   替代此前只登记 26 个特殊兵种、其余远程全吃 DEFAULT=4 大锅饭的表（「远程动作和箭不同步」的次要根因）。
    //   异常兜底：投石车 frame_delay=0（数据缺）保留观察值 0.5；精英/皇家苏丹亲兵 frame_delay=0（bug）沿用普通版 3.2；
    //   精锐斯基泰骑射手 frame_delay=46 > 动画 45 帧 → clamp 7.5。
    mangonel: 0.5,
    onager: 0.5,
    siege_onager: 0.5,
    heavy_rocket_cart: 0.13,
    rocket_cart: 0.13,
    war_chariot_ranged: 3.75,
    bombard_cannon: 0.93,
    houfnice: 0.93,
    ballista: 1.6,
    elite_mameluke: 1.6,
    elite_organ_gun: 1.6,
    heavy_scorpion: 1.6,
    organ_gun: 1.6,
    scorpion: 1.6,
    traction_trebuchet: 1.78,
    conquistador: 2.31,
    elite_conquistador: 2.31,
    chukonu: 2.53,
    elite_chukonu: 2.53,
    fire_archer: 2.67,
    longbowman_elite: 2.67,
    elite_fire_archer: 2.67,
    pattiyoda_longbowman: 2.67,
    amazon_archer: 2.67,
    elite_plumed_archer: 2.67,
    longbowman: 2.67,
    plumed_archer: 2.67,
    kipchak: 2.8,
    elite_kipchak: 2.8,
    mounted_trebuchet: 2.8,
    mangudai: 3.07,
    mangudai_elite: 3.07,
    elite_composite_bowman: 3.2,
    composite_bowman: 3.2,
    dagnajan_elephant: 3.2,
    ballista_elephant: 3.2,
    elephant_archer: 3.2,
    elite_ballista_elephant: 3.2,
    elite_elephant_archer: 3.2,
    elite_genitour: 3.2,
    genitour: 3.2,
    janissary: 3.2,
    elite_janissary: 3.2,
    royal_janissary: 3.2,
    mameluke: 3.2,
    elite_guecha_warrior: 3.33,
    guecha_warrior: 3.33,
    imperial_skirmisher: 3.38,
    elite_skirmisher: 3.38,
    skirmisher: 3.38,
    thracian_peltast: 3.38,
    arbalest: 3.56,
    elite_hussite_wagon: 3.56,
    hussite_wagon: 3.56,
    elite_ratha_ranged: 3.73,
    grenadier: 3.73,
    ratha_ranged: 3.73,
    rhodian_slinger: 3.73,
    slinger: 3.73,
    arambai: 4.0,
    crossbowman: 4.0,
    archer: 4.0,
    crossbow: 4.0,
    blackwood_archer: 4.0,
    camel_archer: 4.0,
    chakram_thrower: 4.0,
    elite_arambai: 4.0,
    elite_blackwood_archer: 4.0,
    elite_camel_archer: 4.0,
    elite_chakram_thrower: 4.0,
    elite_gbeto: 4.0,
    elite_genoese_crossbowman: 4.0,
    gbeto: 4.0,
    genoese_crossbowman: 4.0,
    hand_cannoneer: 4.0,
    immortal_ranged: 4.0,
    rattan_archer: 4.09,
    rattan_archer_elite: 4.09,
    cretan_archer: 4.27,
    throwing_axeman: 4.98,
    elite_throwing_axeman: 4.98,
    bactrian_archer: 5.07,
    bolas_rider: 5.07,
    elite_bolas_rider: 5.07,
    phalangite: 5.07,
    elite_war_wagon: 5.69,
    war_wagon: 5.69,
    cav_archer_heavy: 6.13,
    cav_archer: 6.22,
    xianbei_raider: 6.22,
    horse_archer: 6.22,
    scythian_horse_archer: 6.22,
    elite_scythian_horse_archer: 7.5,
};
const DEFAULT_SHOOT_PHASE = 4;
/** DE 抛射物缩放 = 士兵同款（UNIT_PX / 64）。DE 素材像素已反映真实比例（标枪 56px 是箭 28px 的 2 倍），统一缩放即可。 */
const PROJ_SCALE = UNIT_PX / 64;
/**
 * 远程兵 → DE 抛射物素材（缺省 = 箭 PROJ_ARROW）。
 * 箭：弓手/弩手/长弓/诸葛弩/骑射手/突骑/复合弓/藤弓/钦察/象弓（默认，不必列）；
 * 火箭：火弓；标枪：掷矛手；飞镖：阿兰拜；飞斧：掷斧兵；弩箭：元戎弩/重弩战象（平直穿透）。
 */
const PROJ_TYPE: Record<string, string> = {
    // ── [2026-08-18 补] 这些范围伤远程原本没映射，会退回默认的 PROJ_ARROW（投石车射箭矢）──
    antiquity_mangonel: 'PROJ_BALL',
    antiquity_onager: 'PROJ_BALL',
    antiquity_siege_onager: 'PROJ_BALL',
    antiquity_scorpion: 'PROJ_BOLT',
    antiquity_heavy_scorpion: 'PROJ_BOLT',
    antiquity_siege_tower: 'PROJ_ARROW',
    flamethrower: 'PROJ_SHOT',        // 猛火油柜喷火，用火器弹丸
    helepolis: 'PROJ_BOLT',           // 攻城塔射弩箭
    // 🔴 [2026-08-18 修·主人报「车的攻击效果还是射箭」] 胡斯战车是**火铳车**，不射箭：
    //    DE 里它有专属弹丸 `Projectile Hussite Wagon`(id 1733)，我们没登记 → 落回默认 PROJ_ARROW。
    //    改用火器弹丸 PROJ_SHOT。（高丽战车弹丸是 `Projectile War Galley` id 373 = 弩箭，射箭是对的，不动。）
    hussite_wagon: 'PROJ_SHOT',
    elite_hussite_wagon: 'PROJ_SHOT',
    fire_archer: 'PROJ_ARROW_FIRE',
    elite_fire_archer: 'PROJ_ARROW_FIRE',
    rocket_cart: 'PROJ_ARROW_FIRE',
    heavy_rocket_cart: 'PROJ_ARROW_FIRE',
    skirmisher: 'PROJ_SPEAR',
    elite_skirmisher: 'PROJ_SPEAR',
    imperial_skirmisher: 'PROJ_SPEAR',
    genitour: 'PROJ_SPEAR',
    elite_genitour: 'PROJ_SPEAR',
    thracian_peltast: 'PROJ_SPEAR',
    arambai: 'PROJ_DART',
    elite_arambai: 'PROJ_DART',
    throwing_axeman: 'PROJ_THROWING_AXE',
    elite_throwing_axeman: 'PROJ_THROWING_AXE',
    ballista: 'PROJ_BOLT',
    ballista_elephant: 'PROJ_BOLT',
    elite_ballista_elephant: 'PROJ_BOLT',
    scorpion: 'PROJ_BOLT',
    heavy_scorpion: 'PROJ_BOLT',
    // 投石兵/投索兵（投掷轻石弹：标准弧线、落地无爆炸；复用重炮石弹素材但弹道独立）
    slinger: 'PROJ_SLING',
    rhodian_slinger: 'PROJ_SLING',
    bolas_rider: 'PROJ_SLING',
    elite_bolas_rider: 'PROJ_SLING',
    // 飞刀/飞轮/弯刀（独立飞刃素材）
    gbeto: 'PROJ_DART',
    elite_gbeto: 'PROJ_DART',
    chakram_thrower: 'PROJ_THROWING_AXE',
    elite_chakram_thrower: 'PROJ_THROWING_AXE',
    mameluke: 'PROJ_DART',
    elite_mameluke: 'PROJ_DART',
    // 投石机/重炮（抛石弹/大炮弹，高抛弧线 + 落地冲击）
    mangonel: 'PROJ_BALL',
    onager: 'PROJ_BALL',
    siege_onager: 'PROJ_BALL',
    traction_trebuchet: 'PROJ_BALL',
    mounted_trebuchet: 'PROJ_BALL',
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
/** 高抛弧线抛射物（炮弹/手榴弹/投石）：弧高翻倍（投石式高抛）。 */
const PROJ_HIGH_ARC = new Set(['PROJ_BALL', 'PROJ_GRENADE']);
/** 具有火药发射炮口焰/枪口焰的火器单位。 */
/**
 * 【无攻击动画的兵种】—— **由数据生成，别手改**：`node scratch/build_no_attack_anim.mjs` 重新生成后整段替换。
 *
 * 判据 = 素材目录里 `attack_N.png` 与 `idle_N.png` **字节相同**（扫 339 个目录，命中 7 个）。
 * 根因不是抽取漏了，是 AoE2 DE 本身没画：dat 铁证 —— 高丽战车 `WarWagon (Attack)` 图 id 7233 与
 * `WarWagon (Idle)` 图 id 7239 的 file_name 都是 `u_cav_warwagon_idleA_x1`（精锐版 2480/2482 同理）。
 *
 * 🔴 **别改回运行时用 URL 比较**（我 2026-08-18 第一版就栽在这，判定恒 false、补救分支一次没进过）：
 *    抽取时同一份源图被写成了**两个不同文件名**（attack_*.png / idle_*.png），
 *    `atkUrls.join('|') === IDLE.join('|')` 永远不成立。
 *    「DE 里攻击图 = 待命图」指的是**同一个源文件**，不是同一个 URL。
 * 🔴 也别改成运行时逐像素比：那要 getImageData 读整条帧带（战车 5940×116），
 *    而 13 开场卡 12.8 秒的旧账正是 getImageData 造成的。离线生成一次，运行时零成本。
 */
const NO_ATTACK_ANIM = new Set([
    'elite_hussite_wagon',       // ELITEHUSSITEWAGON
    'elite_war_wagon',           // ELITEWARWAGON
    'flaming_camel',             // FLAMINGCAMEL（自爆兵，走 SUICIDE_TYPES 爆炸，不进放箭分支）
    'hussite_wagon',             // HUSSITEWAGON
    'petard',                    // PETARD（同上）
    'war_chariot_ranged',        // WARCHARIOT
    'war_wagon',                 // WARWAGON
]);

/** 无攻击动画的车辆开火时的尘烟配色（素色木屑/尘土，区别于火器的橙黄炮口焰） */
const SHOT_DUST_COLORS = ['#D8CDB8', '#B9A98C', '#8C7F66', '#EDE6D6'] as const;
const FIREARM_TYPES = new Set([
    'hussite_wagon', 'elite_hussite_wagon',   // 胡斯火铳车（2026-08-18）
    'bombard_cannon', 'houfnice', 'hand_cannoneer',
    'janissary', 'elite_janissary', 'royal_janissary',
    'conquistador', 'elite_conquistador', 'organ_gun', 'elite_organ_gun',
]);
/** 抛射物基准朝向偏移（素材竖向朝上 vs 横向朝东）：火枪弹竖向，旋转需 +90°。 */
const PROJ_ANGLE_OFFSET: Record<string, number> = {
    PROJ_SHOT: Math.PI / 2,
};
/** 连弩/火箭车连发箭数（AoE2 wiki：诸葛弩 3/5 支；风琴炮 5 弹；火箭车 5 支；其余远程每轮 1 支）。 */
const PROJ_VOLLEY: Record<string, number> = {
    chukonu: 3,
    elite_chukonu: 5,
    organ_gun: 5,        // 风琴炮一次齐射 5 弹（AoE2 DE）
    elite_organ_gun: 5,
    rocket_cart: 5,      // 火箭车/一窝蜂一次齐射 5 支火箭
    heavy_rocket_cart: 5,
};
/** 连发每支箭的发射间隔（秒），诸葛弩 3/5 支依次射出。 */
const PROJ_VOLLEY_DELAY = 0.08;
/** 抛射物飞行基准时长（秒）：火枪弹丸极速穿梭（0.22s），重炮/石弹沉重高抛（0.65s），手榴弹（0.55s），其余标准（0.42s）。 */
const PROJ_DUR: Record<string, number> = {
    PROJ_SHOT: 0.22,
    PROJ_BALL: 0.65,
    PROJ_GRENADE: 0.55,
};
/** 炸药自爆单位（DE 爆破兵/火焰骆驼：冲入敌阵一旦近身引爆，造成毁灭性 AoE 伤害并自爆牺牲）。 */
const SUICIDE_TYPES = new Set(['petard', 'flaming_camel']);
/** 具有最小射程盲区的远程/器械单位（原版 DE：投石车 min range 3 格、巨投 min range 4 格；1 格 = 40px，与 rng 同换算）。 */
const MIN_RANGE_TYPES: Record<string, number> = {
    mangonel: 120,
    onager: 120,
    siege_onager: 120,
    traction_trebuchet: 160,
    mounted_trebuchet: 160,
};
/** 火矛手（DE 充能喷火兵）：进战先喷 3 发低精度短程火枪弹，30 秒充能（AoE2 DE update 141935）。 */
const FIRE_LANCER_TYPES = new Set(['fire_lancer', 'elite_fire_lancer']);
const FIRE_LANCER_VOLLEY = 3;
const FIRE_LANCER_CHARGE = 30;
/**
 * 每方开局数 + 每次补兵批量 = 324（2026-08-18 主人改：9 口 × 36 = 每口 6×6 方正）。
 * 成批补：开局双方各出 324；之后一方场上 < 150 才再补 324（见 TRIGGER）。
 */
const SIDE_CAP = 324;
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

/* ── 【兵种人口占用】2026-08-18 主人定，照搬 AoE2 DE population cost ──────────────────
 *
 * 口径：**人口 = 一个精灵占几个兵额**。人 1、马 1、车 2、象 2、炮 3。
 *   → 同样兵力下，象/车只出一半、炮只出三分之一；单个精灵代表的兵额同比增加，**总兵力守恒**。
 *   （不守恒的话象类文化的面板兵力会凭空缩水，与地图层 unit.troops 对不上。）
 *
 * 🔴 不能只按 unit class 发：**战象和战车在 DE 里的 class 都是 12（骑兵）**，与普通骑兵同类，
 *    所以象/车必须按名字单独点名，其余 class 12 才算 1。
 *    （class 47 不是战象、是斥候 SCOUT —— 别再拿 47 认象，证据见 scratch/build_unit_class_by_stats.mjs。）
 */
/**
 * 人口占用表 —— **由数据生成，别手改**：`node scratch/build_pop_cost.mjs` 重新生成后整段替换。
 *
 * 🔴 初版是三条正则猜名字（/elephant/、/chariot/、/mangonel|onager|…/），2026-08-18 迁走。
 *    迁移时对账，正则版被抓出 7 处错：
 *      · 巨弩 ballista 判成 1（漏），实为弩炮 class 55 → 3
 *      · 掷环兵 chakram_thrower 判成 3 —— 正则 `ram_` 误命中「cha**kram_t**hrower」，它是步兵 → 1
 *      · 高丽战车／胡斯战车四个判成 1（漏），它们是「车」→ 2
 *    这就是「看名字不看数据」的典型代价。
 *
 * 判据两级（缺一不可，见生成器文件头）：
 *   ① 炮/攻城/弩炮 → 按 DE unit class {13, 35, 55} → 3
 *   ② 象/车        → 按 DE **原型名**，不能按 class：**象和车的 class 都是 12（骑兵）**，class 分不开
 *   其余默认 1（步/弓/骑/弓骑/轻型火器）
 */
const POP_COST_BY_KEY: Record<string, number> = {
    antiquity_battering_ram: 3,     // class 13（攻城器械）
    antiquity_capped_ram: 3,        // class 13（攻城器械）
    antiquity_heavy_scorpion: 3,    // class 55（类55）
    antiquity_mangonel: 3,          // class 13（攻城器械）
    antiquity_onager: 3,            // class 13（攻城器械）
    antiquity_scorpion: 3,          // class 55（类55）
    antiquity_siege_onager: 3,      // class 13（攻城器械）
    antiquity_siege_ram: 3,         // class 13（攻城器械）
    antiquity_siege_tower: 3,       // 人工指定
    ballista: 3,                    // class 55（类55）
    battering_ram: 3,               // class 13（攻城器械）
    bombard_cannon: 3,              // class 13（攻城器械）
    capped_ram: 3,                  // class 13（攻城器械）
    elite_organ_gun: 3,             // class 13（攻城器械）
    heavy_rocket_cart: 3,           // class 13（攻城器械）
    heavy_scorpion: 3,              // class 55（类55）
    helepolis: 3,                   // 人工指定
    houfnice: 3,                    // class 13（攻城器械）
    mangonel: 3,                    // class 13（攻城器械）
    mounted_trebuchet: 3,           // 人工指定
    onager: 3,                      // class 13（攻城器械）
    organ_gun: 3,                   // class 13（攻城器械）
    rocket_cart: 3,                 // class 13（攻城器械）
    scorpion: 3,                    // class 55（类55）
    siege_onager: 3,                // class 13（攻城器械）
    siege_ram: 3,                   // class 13（攻城器械）
    siege_tower: 3,                 // 人工指定
    traction_trebuchet: 3,          // class 13（攻城器械）
    armored_elephant: 2,            // 人工指定
    ballista_elephant: 2,           // DE原型 ELEBALI（象）
    battle_elephant: 2,             // DE原型 BATELE（象）
    bayinnaung_elephant: 2,         // 人工指定
    dagnajan_elephant: 2,           // 人工指定
    elephant: 2,                    // 人工指定
    elephant_archer: 2,             // DE原型 ELEAR（象）
    elite_armored_elephant: 2,      // 人工指定
    elite_ballista_elephant: 2,     // DE原型 EELEBALI（象）
    elite_battle_elephant: 2,       // DE原型 EBATELE（象）
    elite_elephant_archer: 2,       // 人工指定
    elite_hussite_wagon: 5,         // 人工指定
    elite_war_chariot: 3.75,           // 人工指定
    elite_war_elephant: 2,          // 人工指定
    elite_war_wagon: 5,             // 人工指定
    hussite_wagon: 5,               // 人工指定
    porus_elephant: 2,              // 人工指定
    war_chariot: 3.75,                 // 人工指定
    war_chariot_ranged: 3.75,          // 人工指定
    war_elephant: 2,                // 人工指定
    war_wagon: 5,                   // 人工指定
};
function popCostOf(key: string): number {
    return POP_COST_BY_KEY[key] ?? 1;
}
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

/* ── 【列阵推进】2026-08-18 主人定，对齐帝国时代 DE 的阵型行军 ──────────────────────────
 *
 * 原来：待命一结束，600 个兵各自 search(SIGHT) 找自己最近的敌人扑上去，
 *       出生时按 LAYOUT（鱼鳞/三角/雁行）摆好的阵型**一开动就散**，看着不像军队像人潮。
 * 现在：开局那批（每方 324）在各自出兵口列成 6×6 方阵，整体平移压向敌方，
 *       期间**不脱离队形去追人**；索敌与出手照旧 —— 远程在队形里够得着就放箭，不出列。
 *       两军「前锋线」逼近到 MARCH_REL 时全军**同时**解除，无缝切回原有的索敌散开逻辑。
 *
 * 🔴 补兵也排方阵出生（主人 2026-08-18：比一盘散沙好），但 march=false **不迁就速度**、
 *    各自按兵种速度走；只有开局那批整体平移迁就最慢（阵型刚体）。
 *
 * 🔴 不禁火：行军段禁止远程开火会让它们白白损失一整段射击窗口（火焰弓射程 400，
 *    前锋线还差 250px 就已经够得着），实测口径下「弩克步」这条边会被动过 —— 所以只压移动，不压开火。
 *
 * 平衡实测（war_sim，SIDE_CAP=324，N=1350，WING=0 SPREAD=4 AIM_JITTER=120）：
 *   三臂对照（基线全散 / 只开局列阵 / 开局列阵+补兵方阵，各 6 种子 × 9 组，量具 scratch/march_ab.mjs）：
 *   克制三边（骑克弩/骑克步/弩克步）方向与换位结论**三臂完全一致**；打不完 0/0；时长持平。
 *
 * 🔴 【别再引用「镜像骑兵 0:6 守方通杀」这个结论——它是 6 种子的噪声，不是偏袒】
 *   我（CC）先报过 0:6，DS 复现后写成「既有方向偏袒」，两次都是 6 种子。
 *   加到 20 种子（scratch/mirror_bias.mjs）后全部回归五五开、无一显著：
 *     现行配置  步 12:8 (p=.50) / 骑 8:12 (p=.50) / 远程 7:13 (p=.26)
 *     基线配置  步 11:9 (p=.82) / 骑 7:13 (p=.26) / 远程 11:9 (p=.82)
 *     合计 56:64，双尾 p≈0.5 —— 没有可检出的左右偏袒。
 *   教训：**镜像局方差极大，6 种子只够看克制三边（6:0 这种压倒性结果），看不了镜像。**
 *   要对镜像下任何结论，先跑 mirror_bias.mjs 的 20 种子。
 */
/** 解除距离（px）：两军前锋线逼近到这个距离就全军散开接战。步兵视野量级，双方相隔约三个身位 */
const MARCH_REL = 160;
/** 车类兵种（与人口表口径联动：popCost 2.25 ⇔ 4×4 = 16 辆） */
const WAGON_KEYS = new Set([
    'war_wagon', 'elite_war_wagon',
    'hussite_wagon', 'elite_hussite_wagon',
    'war_chariot', 'elite_war_chariot', 'war_chariot_ranged',
]);
/**
 * 每个出兵口方阵的**边长**（既是横向列数，也决定该口出多少精灵 = 边长²）。
 *
 * 主人 2026-08-18 定：**人 6×6 = 36，车 4×4 = 16**（战车体型大，36 辆排出来就是一堵墙）。
 * 🔴 边长与人口**联动**，改一个必须改另一个：该口出兵数 = 36 / popCost，
 *    所以车要出 16 辆，popCost 必须 = 36/16 = 2.25。只改排布不改人口 = 还是 36 辆、只是排得更宽。
 *    这样兵力仍守恒：16 辆 × 2.25 兵额 = 36 = 步兵那一口的兵额。
 */
const MARCH_FILES_DEFAULT = 6;
const MARCH_FILES_WAGON = 4;
function marchFilesOf(key: string): number {
    return WAGON_KEYS.has(key) ? MARCH_FILES_WAGON : MARCH_FILES_DEFAULT;
}
/** 槽位间距（px）：必须 ≥ 两兵半径之和（UNIT_RADIUS 最大档 20），否则软推挤会把队形挤散 */
const MARCH_SP = 24;
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
 * 索敌时「这个目标已经被几个人打了就换一个」的门槛（见 search）。
 * = 围殴加成封顶人数 `GANG_CAP + 1`：第 GANG_CAP+2 个人挤上去伤害一分不加，纯白挤。
 * 改 GANG_CAP 时这里跟着走，别让两个数脱节。
 */
const SPREAD_CAP = GANG_CAP + 1;
/**
 * 软推挤：两个精灵靠得比这还近就互相推开（px）。
 * 🔴 这**不是**被禁的 fan-out 瞬移（那是一帧之内把人挪走、看着像闪现）——
 *    这里每帧只推几个像素，是人群自然挤开。挤不动的人沿接触面铺开，
 *    弧形战线和两翼包抄就是这么自己长出来的（主人 2026-08-11 提，帝国时代同款）。
 */
const SEP_DIST = 17;
/**
 * 每个兵的**占地半径**（px）——DE 真值 `collision_size_x/y × 40`（与射程同尺），
 * 由 `scratch/extract_de_radius.py` 从 `empires2_x2_p1.dat` 抽出，226 个兵种。
 *
 * 为什么要按兵种分（主人 2026-08-17 提「帝国时代被挡住会形成弧形，我们能不能照做」）：
 * 弧形阵面的物理基础就是**每个兵占多大地方不一样**。原来全兵种共用 SEP_DIST=17px，
 * 于是攻城槌和弓箭手挤得一样密（DE 里攻城槌半径 18px、火炮 20px，是步兵 8px 的两倍多），
 * 大家伙不占地方，人群就摊不出层次。
 * 取值只有 7 档：爪刀 6 / 步兵 8 / 方阵兵 9 / 骑兵象兵 10 / 风琴炮 16 / 攻城槌战车 18 / 重型攻城 20。
 * 表里没有的（老 S10DB 兵种等）落 SEP_DIST/2，与旧行为一致。
 */
const UNIT_RADIUS: Record<string, number> = {
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
    elite_elephant_archer: 10.0,
    elite_greek_cavalry: 10.0,
    elite_ibirapema_warrior: 8.0,
    elite_iron_pagoda: 10.0,
    elite_kamayuk: 8.0,
    elite_keshik: 10.0,
    elite_peltast: 8.0,
    elite_throwing_axeman: 8.0,
    elite_tiger_cavalry: 10.0,
    elite_war_elephant: 10.0,
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
    armored_elephant: 10.0,
    axe: 8.0,
    bactrian_archer: 8.0,
    ballista: 20.0,
    ballista_elephant: 10.0,
    battering_ram: 18.0,
    battle_elephant: 10.0,
    bayinnaung_elephant: 10.0,
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
    champion_runner: 8.0,
    champion_scout: 8.0,
    chukonu: 8.0,
    companion_cavalry: 10.0,
    composite_bowman: 8.0,
    condottiero: 8.0,
    conquistador: 10.0,
    coustillier: 10.0,
    cretan_archer: 8.0,
    crossbow: 8.0,
    crossbowman: 8.0,
    dagnajan_elephant: 10.0,
    eagle_scout: 8.0,
    eagle_warrior: 8.0,
    eastern_swordsman: 8.0,
    ekdromos: 8.0,
    elephant: 10.0,
    elephant_archer: 10.0,
    elite_arambai: 10.0,
    elite_armored_elephant: 10.0,
    elite_ballista_elephant: 10.0,
    elite_battle_elephant: 10.0,
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
    elite_hussite_wagon: 18.0,
    elite_jaguar_warrior: 8.0,
    elite_janissary: 8.0,
    elite_kipchak: 10.0,
    elite_kona: 10.0,
    elite_konnik: 10.0,
    elite_konnik_foot: 8.0,
    elite_leitis: 10.0,
    elite_liao_dao: 8.0,
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
    elite_war_chariot: 3.75,
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
    hoplite: 8.0,
    horse_archer: 10.0,
    houfnice: 20.0,
    huskarl: 8.0,
    hussar: 10.0,
    hussite_wagon: 18.0,
    immortal: 8.0,
    immortal_ranged: 8.0,
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
    petard: 8.0,
    phalangite: 9.0,
    pikeman: 8.0,
    plumed_archer: 8.0,
    porus_elephant: 10.0,
    qizilbash_warrior: 10.0,
    ratha_melee: 10.0,
    ratha_ranged: 10.0,
    rattan_archer: 8.0,
    rattan_archer_elite: 8.0,
    rhodian_slinger: 8.0,
    rhomphaia_warrior: 8.0,
    rocket_cart: 20.0,
    royal_janissary: 8.0,
    sacred_band: 8.0,
    samurai: 8.0,
    samurai_elite: 8.0,
    sannahya: 10.0,
    savar: 10.0,
    scorpion: 20.0,
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
    swordsman: 8.0,
    takabara: 8.0,
    tarantine_cavalry: 10.0,
    tarkan: 10.0,
    temple_guard: 8.0,
    teutonic_knight: 8.0,
    thracian_peltast: 8.0,
    throwing_axeman: 8.0,
    tiger_rider: 10.0,
    traction_trebuchet: 20.0,
    two_handed_swordsman: 8.0,
    urumi_swordsman: 8.0,
    war_chariot: 3.75,
    war_chariot_ranged: 3.75,
    war_dog: 8.0,
    war_elephant: 10.0,
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
const SEP_SMOOTH = 0.15;
/** 推开速度（px/秒）：要顶得住 130 的行军速度。实测 55 太小——仍有 17% 完全叠住，120 降到 3% */
const SEP_SPD = 120;
/** 推挤哈希格（= 推挤距离，一格只装一两个人，扫 3×3 很便宜） */
const CELL_S = 20;
/** 远程兵接敌被己方前排挡住时，站住待命时长（秒）：别再往前挤（往前顶一步 + 推挤推回一步 = 抖） */
/**
 * 「想走但走不动」持续多久就改播待命帧（秒）。见 WarMan.stuckT。
 * 0.3s ≈ 走路动画的四分之一个循环：短于它的卡顿不切（避免走/停边界上每帧切动画，那又是一种抖），
 * 长于它就说明是真被前面的人堵住了，站住别迈腿。
 */
const STUCK_IDLE_SEC = 0.3;
/**
 * 绕行时的速度比例（相对本兵移速）。被己方兵挡住时沿垂直方向侧滑绕过去，
 * 比直冲慢一点：既像人挤过人群，也让后面的人有机会先补上空位、自然铺成弧形阵面。
 */
const SLIDE_RATE = 0.8;
/**
 * 绕行时侧向分量的占比（0=直冲不绕，1=纯绕圈）。
 * 🔴 实测扫过 0 / 0.35 / 0.6 / 1（war_sim，步骑对镜各 2 种子）：
 *    0 → 184/187/159/168s；0.35 → 173/194/147/149s；0.6 → 183/212/147/161s；
 *    **1（纯绕圈）→ 467/456/260/245s** —— 全军贴着人墙转圈就是不接敌，战斗直接拖垮。
 *    所以绕行只能是「偏一点」，不能变成绕着走。
 */
const SLIDE_W = 0.4;

/**
 * 目标血量低于这个比例时，**不执行「缠斗 4 秒换人」**——把快死的人打完再走。
 * 主人 2026-08-17：「敌人快死了，自己逃跑？搞什么」。
 * 🔴 那条 4 秒换人本身不能删：实测删掉后骑兵对镜 1/6 打满 600s（它在防同兵种僵持死锁）。
 *    实测 0.5 这一档与现状时长持平甚至略快（步 202/174→195/175s、骑 147/144→137/142s）。
 */
const KEEP_TARGET_HP = 0.5;
/** 哈希键用数字不用字符串：每人每帧拼 9 次字符串 = 两万多次分配，实测是推挤慢的元凶 */
const HKEY = (gx: number, gy: number): number => (gx + 4096) * 8192 + (gy + 4096);
/** 近战哈希格 */
const CELL_M = 80;
/** 远程哈希格 */
const CELL_R = 220;

/** [军事科技] 供战斗面板渲染徽记用的精简结构（id 用于分组比对，name 用于显示） */
export interface TechBrief { id: string; name: string; }

interface WarSpawn {
    f: 0 | 1;
    key: string;
    x: number;
    y: number;
    pool: number;
    /** 本口累计已出生精灵数（旗手判定：每满 FLAG_EVERY 出一面旗，按口平均分布，跨批不重置） */
    spawned: number;
    /** 本口列阵方阵已发出的槽位数（开局 + 补兵每批都排方阵；每批重置，见 MARCH_*） */
    slotN: number;
    /** 本口兵种的人口占用（1 精灵 = pop × SPRITE_TROOPS 兵；见 popCostOf） */
    pop: number;
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
    /** 推挤力的平滑量（见 SEP_SMOOTH，逐帧向当前推力靠拢，防方向突变导致原地哆嗦） */
    sepX: number;
    sepY: number;
    /** 出生时所在的 y（巡逻航路要用：航点①是敌方底边的**本路** y，航点③是己方底边的对角 y） */
    y0: number;
    /** 上一帧位置（算真实位移用，见 stuckT） */
    prevX: number;
    prevY: number;
    /**
     * 「想走但走不动」已持续多久（秒）。
     * 走路动画只在**真的位移**时播：被前面的人堵住时位移≈0，再播移动帧就是原地迈腿（主人 2026-08-17 提）。
     * 用累计时间而不是单帧判定，避免在走/停边界上每帧切动画（那又是一种抖）。
     */
    stuckT: number;
    /**
     * 落点散开偏移（出生时定死，终身不变；见 AIM_JITTER）。
     * 只加在「全军共用的那个坐标」上（敌口/敌军重心），不加在「最近的那个敌兵」上。
     */
    jx: number;
    jy: number;
    /** 本轮是否已放箭（远程）：动画播到放箭相位才射，避免箭和拉弓动作脱节 */
    shot?: boolean;
    /** 本轮是否已出刀/出枪（近战）：动画播到命中相位才触发刀光与火花 */
    slashed?: boolean;
    /** 火矛手充能冷却（秒）：进战先喷一轮火枪弹，30 秒充能（DE 充能攻击） */
    chargeCd?: number;
    /** 是否旗手（出生时定死，见 FLAG_EVERY）：头顶画一面势力旗，战死则军旗倒地 */
    flag: boolean;
    /**
     * 旗帜飘动的相位偏移（毫秒，出生时掷定不再变）。
     * 🔴 没有它十几面旗会**整齐划一地一起抖**：drawFlag 的帧索引是 floor(tick/150)%4，
     *    全场共用一个 tick。大地图一屏没几面旗所以从没暴露，13 里一方十几面就假得明显。
     *    ⚠️ 不能拿 m.ph 当偏移——那个每秒涨 8，会让旗越飘越快且随战斗状态变速。
     */
    fo: number;
    /**
     * 列阵推进（见 MARCH_REL）：本兵是否还在开局的列阵行军阶段。
     * true 期间移动只跟自己的槽位，够不着敌人**不追**；索敌与出手照旧（远程在队形里放箭）。
     */
    march: boolean;
    /** 列阵槽位所属出兵口（阵型锚点；非列阵兵为 null） */
    port: WarSpawn | null;
    /** 列阵槽位：dep = 沿推进方向的纵深（0 = 最前排，越大越靠后）；sy = 横向偏移 */
    dep: number;
    slotY: number;
    /** 人口占用（1 精灵 = pop × SPRITE_TROOPS 兵；出生时从所属出兵口继承，见 popCostOf） */
    pop: number;
    /** 上一帧同时打他的敌人数（围殴加成用；当帧计数见 atkNext） */
    atkers: number;
    /** 本帧累计的攻击者数，帧末结转给 atkers */
    atkNext: number;
    lock: number;
    atkSt: number;
    /** 远程兵接敌被己方前排挡住的待命剩余秒数：>0 时站住不挤，归零再试 */
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
    scale: number;
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

/** 刀光剑影：近战攻击挥砍半月弧光 / 长枪突刺锐芒 */
interface WarSlash {
    x: number;
    y: number;
    angle: number;
    kind: 'slash' | 'thrust';
    t: number;
    dur: number;
    radius: number;
    color: string;
    flip: boolean;
}

/** 兵刃碰撞火花：两军近战交锋时在交界处产生的金属飞溅火星线 */
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
    /**
     * 这个兵种是否**真的有一套单独的近战动作**。
     * 🔴 只有它为真时，远程兵被贴脸才切近战姿态（st=2，不放弹丸）。
     *    DE 素材的 SHOOT 和 ATTACK 指向的是**同一批图**（如投石兵两者都是 attack_*.png），
     *    切过去动画一模一样、却把弹丸掐掉了 —— 主人 2026-08-17 实锤「看不到投石兵的石弹」。
     *    真正有两套动作的是老 S10DB 混编兵（114 个，SHOOT 与 ATTACK 指向不同文件）。
     */
    realMelee: boolean;
    /**
     * 该兵种**没有攻击动画**（攻击帧与待命帧是同一批图）。
     * 全库 329 个兵种里只有 7 个这样，且全是车辆/自爆兵 —— 这不是抽取漏了，是 DE 本身就没画：
     * 实证 `WagonAttack` 图 id 7233 与 `WagonIdle` 图 id 7239 **指向同一个素材文件**
     * `u_cav_warwagon_idleA_x1`（精锐版 2480/2482 同理）。
     * 后果：高丽战车/胡斯战车开火时车身纹丝不动，观众完全看不出它在打人（主人 2026-08-18 报）。
     * 补救沿用项目既有做法 —— 火器那条注释原话「DE 攻击动画含炮口闪光，这里用火花补」，同一套路。
     */
    noAttackAnim: boolean;
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
    /** 攻方武将 id（武将专属编制判断用，如秦及先秦统一雁行阵） */
    attackerGeneralId?: string | null;
    /** 守方武将 id（同上） */
    defenderGeneralId?: string | null;
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
    /** [军事科技] 当前年份 getter（由 GameAppCombatHooks 注入；战斗跨年时刷新科技分表） */
    getYear?: () => number;
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
    private slashes: WarSlash[] = [];
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
    /**
     * 每方共享的航点进度（见 aimAt 的巡逻航路）。
     * 🔴 必须**按方共享**，不能每个兵各记各的：各记各的时，新出生的兵在航点0（冲敌方底边）、
     *    老兵已经在航点2（回己方对角），同一时刻全军散在航路不同阶段、方向各不相同 ——
     *    画面上就是一群人朝四面八方乱走（主人 2026-08-18 实锤「到底线后不往中心，而是乱转」）。
     *    共享之后整支军队一起转向，才像一支军队在机动。
     */
    private routeWp: [number, number] = [0, 0];
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
    /** [军事科技] 双方文化区（start 时从 init 存；科技按文化门控，每方按自己的算） */
    private sideCulture: [string, string] = ['CENTRAL', 'STEPPE'];
    /** [军事科技] 当前生效年份（跨年时重建分表 + 播报新解锁） */
    private techYear: number = GameConfig.TIME.TIMELINE_START_YEAR;
    /** [军事科技] 年份 getter（由 GameAppCombatHooks 注入；解耦 TimeSystem） */
    private techYearGetter: (() => number) | null = null;
    /** [军事科技] 双方兵种分表（key → 基础档 + 该方已解锁科技；🔴 绝不原地改 WAR_TYPES，否则逐场累积爆表） */
    private techStats: [Map<string, WarType & { sight?: number }>, Map<string, WarType & { sight?: number }>] = [new Map(), new Map()];
    /** 成批增援冷却（秒），一次只补一边所以单值 */
    private batchCd = 0;
    /** 开场列阵待命剩余时间（秒）：阶段内全军静止渐显，结束才开打（主人 2026-08-16） */
    private deployT = 0;
    /** 列阵推进阶段是否仍在进行（见 MARCH_REL）；解除后整场不再回到列阵 */
    private marching = false;
    /** 两方阵型各自已推进的距离（px），列阵解除后不再使用 */
    private adv: [number, number] = [0, 0];
    /** 开局总兵力（精灵），攻/守各一 —— 补兵触发线按「剩余占比」缩放时当分母 */
    private initPool: [number, number] = [1, 1];
    /** 尸体保留累加器（攒够 1 留一具）：确定性均匀，不随机斑驳。见 CORPSE_KEEP */
    private corpseAcc = 0;
    /** 本场已打了多少秒（真实秒，开场列阵也算）。见 HARD_STOP_SEC / NO_KILL_SEC */
    private battleSec = 0;
    /** 最近一次有人阵亡的时刻（秒，battleSec 计）。长时间没人死 = 卡住了 */
    private lastKillSec = 0;
    /** 本场是否已报过「打不完」（只报一次，别刷屏也别重复落盘） */
    private stallReported = false;
    /** 首批素材是否已经全部就绪过一次：之后再有素材加载都不许冻结演出（见 tick 里那道闸） */
    private assetsReadyOnce = false;

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
        // 🔴 按人口加权：象/车 1 精灵 = 2 个兵额、炮 = 3。不加权的话象类文化的兵力会凭空缩水。
        const n = [0, 0];
        for (const sp of this.spawns) n[sp.f] += Math.max(0, sp.pool) * sp.pop;
        for (const m of this.men) if (m.hp > 0) n[m.f] += m.pop;
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

    /**
     * [军事科技] 取某兵种完整数据：基础档 + 该方（f = 0 攻 / 1 守）已解锁科技。
     * 🔴 每方按自己文化区 + 当前年份算（同一兵种攻守双方数值可能不同）。
     * 🔴 返回新对象、绝不原地改 WAR_TYPES（就地改会逐场累积爆表）。分表缓存，一年才失效一次。
     */
    private statsFor(key: string, f: number): WarType & { sight?: number } {
        const y = this.techYearGetter?.() ?? this.techYear;
        if (y !== this.techYear) this.onTechYearChanged(y);
        let v = this.techStats[f].get(key);
        if (!v) {
            const base = WAR_TYPES[key] ?? WAR_TYPES.light_infantry;
            const techs = unlockedTechs(y, this.sideCulture[f] as RegionType);
            v = applyTechsToStats(base, key, techs, SIGHT_MAP[key] ?? 160);
            this.techStats[f].set(key, v);
        }
        return v;
    }

    /** [军事科技] 跨年：重建双方分表。🔴 播报不在这里——已挪 TimeSystem 年变回调（挂 13 循环会漏掉绝大多数解锁年份） */
    private onTechYearChanged(year: number): void {
        this.techYear = year;
        this.techStats = [new Map(), new Map()];
    }

    /**
     * [军事科技] 双方各自已解锁的科技名（13 战斗面板「科技行」用；表顺序）。
     * 每方按自己文化区 + 当前年份算——同一时刻双方科技树可能不同（门控），观众一目了然。
     */
    public getSideTechs(): { attacker: MilitaryTech[]; defender: MilitaryTech[] } | null {
        if (!this.active && !this.lingering) return null;
        const year = this.techYearGetter?.() ?? this.techYear;
        // 🔴 必须返回**完整科技对象**：面板要用 `effects` 汇总数值。
        //    2026-08-18 曾返回精简的 {id,name}，`summarizeTechEffects` 遍历 t.effects 当场抛
        //    `t.effects is not iterable`，整个 updateStats 中断 → 面板什么都不显示（主人实锤「科技呢，去哪了」）。
        //    当时用 `as never` 把类型错误压掉了，tsc 不报、运行时每帧炸。别再压类型。
        return {
            attacker: unlockedTechs(year, this.sideCulture[0] as RegionType),
            defender: unlockedTechs(year, this.sideCulture[1] as RegionType),
        };
    }

    /** 战斗开始 → 初始化出兵口（编制槽位派生）+ 开始加载素材 */
    public start(init: Scene13WarInit): void {
        this.diagT0 = performance.now();
        this.perfStep = [];
        this.perfRender = [];
        this.perfFrames = 0;
        this.diagEvents = [];
        this.diagSent = false;
        this.diagPush('start', {
            att: init.attackerTroops, def: init.defenderTroops,
            attR: init.attackerRegion, defR: init.defenderRegion,
            attB: init.attackerBonus, defB: init.defenderBonus,
        });
        this.attach();
        this.active = true;
        this.over = false;
        this.spawns = [];
        this.men = [];
        this.corpses = [];
        this.fleers = [];
        this.arrows = [];
        this.slashes = [];
        this.sparks = [];
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
        this.pendingStartedAt = 0;   // 防死锁计时重置（新战斗重新计 30s）
        this.battleSec = 0;          // 本场计时归零（HARD_STOP_SEC / NO_KILL_SEC 都按它算）
        this.lastKillSec = 0;
        this.stallReported = false;
        this.assetsReadyOnce = false;
        this.enemyCen = [null, null];
        this.routeWp = [0, 0];
        this.gm = new Map();
        this.gr = new Map();
        this.gs = new Map();
        this.last = performance.now();

        const cv = this.canvas;
        if (cv) { cv.style.display = 'block'; }

        // [2026-08-16 主人需求] 进入 13 战斗模式后，军团面板和军情面板自动收起（记录状态供退出时还原）
        const game = (window as any).game;
        game?.cameraFollowUI?.onEnterBattleScene13?.();
        game?.brawlFeedPanel?.onEnterBattleScene13?.();

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
        // [军事科技] 双方文化区 + 年份来源 + 分表重置（新一场战斗按当前年份重算，不沿用旧缓存）
        this.sideCulture = [init.attackerRegion || 'CENTRAL', init.defenderRegion || 'STEPPE'];
        this.techYearGetter = init.getYear ?? null;
        this.techYear = this.techYearGetter?.() ?? GameConfig.TIME.TIMELINE_START_YEAR;
        this.techStats = [new Map(), new Map()];
        this.batchCd = 0;
        this.deployT = DEPLOY_SECS;
        this.marching = true;    // 待命结束后进入列阵推进（见 MARCH_REL）
        this.adv = [0, 0];
        this.centerLat = init.centerLat;
        this.centerLng = init.centerLng;

        try {
            // 攻守各一侧：row 0 最靠中线（攻方在左、守方在右）
            const sides: { region: string; troops: number; f: 0 | 1; factionId?: string | null; generalId?: string | null }[] = [
                { region: init.attackerRegion, troops: init.attackerTroops, f: 0, factionId: init.attackerFactionId, generalId: init.attackerGeneralId },
                { region: init.defenderRegion, troops: init.defenderTroops, f: 1, factionId: init.defenderFactionId, generalId: init.defenderGeneralId },
            ];
            const VW = cv?.width ?? 1920;
            const VH = cv?.height ?? 1080;
            const mx = Math.max(60, VW * 0.07);
            const depth = Math.min(150, VW * 0.075);
            const midY = VH / 2;
            const spanY = VH * 0.80;

            for (const side of sides) {
                const lanes = this.slotsOf(side.region, side.factionId, side.generalId);
                const n = lanes.length;
                const mode = this.formationModeOf(side.region, side.factionId, side.generalId);
                // 🔴 前中后固定（主人 2026-08-15 定）：不再随机换序，出兵口顺序 = 编制槽位展开序
                //    （鱼鳞 步骑弓 / 三角 近战+远程+近战 / 雁行 远程+近战+远程）。
                const lanes2 = lanes;
                // 兵力按总量平分到各口（1 精灵 = SPRITE_TROOPS 兵；口少的一边每口出得快）
                const poolPer = Math.max(1, Math.round(side.troops / SPRITE_TROOPS / n));
                lanes2.forEach((lane, idx) => {
                    const key = lane.key;
                    this.ensureType(key);
                    // 🔴 [2026-08-17 修·「刚一交战就卡一下」] 抛射物素材必须**开战前**就跟着兵种一起预载。
                    //    原来是第一次放箭那一刻才 ensureProj（懒加载），而 ensureProj 会把 pending +1，
                    //    tick() 只要 pending>0 就整场 return —— 不推进也不渲染。
                    //    于是每个远程兵种第一次出手，整个战场**当场冻住**，等一次 meta.json + 一张图
                    //    （两趟请求，冷启动时几百毫秒）。主人实锤：「每次远程准备攻击的时候就卡一下」。
                    //    放到这里 = 并进开场那批素材，由列阵待命阶段吸收，战斗中途不再有任何懒加载。
                    //    口径与出手那一处保持一致：射程 > 65 才会真的放弹丸，未登记的一律落 PROJ_ARROW。
                    if (this.statsFor(key, side.f).rng > 65) this.ensureProj(PROJ_TYPE[key] ?? 'PROJ_ARROW');
                    if (FIRE_LANCER_TYPES.has(key)) this.ensureProj('PROJ_SHOT');   // 火矛手充能喷火用
                    // 布局：row 0 最靠中线（越靠前越深入敌阵）；三阵型 9 口走 LAYOUT 查找表
                    const cell = LAYOUT[mode][idx];
                    const back = mx + (2 - cell.row) * depth;
                    const x = side.f === 0 ? back : VW - back;
                    // 阵型间距 spanY/3
                    const y = midY + (cell.col - (cell.cols - 1) / 2) * (spanY / 3);
                    this.spawns.push({
                        f: side.f, key, x, y,
                        // 人口折算：象/车 2、炮 3 → 精灵数按比例减少，单个精灵代表的兵额同比增加，总兵力守恒
                        pool: Math.max(1, Math.round(poolPer / popCostOf(key))),
                        pop: popCostOf(key),
                        spawned: 0,
                        slotN: 0,
                    });
                });
            }
            // 开局总兵力存档（精灵），供 getInitialTroops 回写战斗面板演出进度用
            this.initPool = [0, 1].map(f =>
                Math.max(1, this.spawns.reduce((n, s) => n + (s.f === f ? s.pool * s.pop : 0), 0)),
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
        for (const s of this.spawns) alive[s.f] += Math.max(0, s.pool) * s.pop;
        for (const m of this.men) if (m.hp > 0) alive[m.f] += m.pop;
        const att = Math.max(1, alive[0]);
        const def = Math.max(1, alive[1] * homeDiscount);
        const attackerWins = att > def;
        this.over = true;
        console.warn(`🏁 [Scene13War] 防死锁判负：攻 ${alive[0]} 守 ${alive[1]}（守方×${homeDiscount}）→ ${attackerWins ? '攻方胜' : '守方胜'}`);
        this.diagPush('forceByRatio', { alive, homeDiscount, winner: attackerWins ? 'attacker' : 'defender' });
        this.diagFlush('forceByRatio');
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
                const w = (c.img?.naturalWidth ?? 600) * c.scale;
                if (c.x > vw + w) c.x = -w;
            }
        }
    }

    /**
     * [2026-08-17 诊断] 13 生命周期打点 → `scratch/scene13_probe_latest.json` + `scene13_probe_log.jsonl`。
     * 装它是因为主人报「刚开战卡一下、10 秒左右就退」，而我这边多次实测复现不出（素材 0.7s 就绪、
     * 演出跑满 2 分钟）。与其反复试，不如让现场数据自己落盘：一场 13 结束时自动 POST，
     * 事后读 jsonl 就能看出是「演出正常判负」「素材超时强判」还是「被外部提前停掉」。
     * 仅 DEV 生效；定位完连同 diag* 一起删。
     */
    private diagT0 = 0;
    /**
     * [性能探针 2026-08-18] 逐帧耗时采样（DEV，主人报「13 有点卡」）。
     * 只累加不排序，落盘时才算分位；开销 ≈ 两次 performance.now()/帧，可忽略。
     * 记 step（推演）与 render（绘制）分开，才能判断卡在算还是卡在画。
     */
    private perfStep: number[] = [];
    private perfRender: number[] = [];
    private perfFrames = 0;
    private diagEvents: Array<[number, string, unknown]> = [];
    private diagSent = false;
    private diagAssetsReady = false;

    private diagPush(ev: string, data?: unknown): void {
        if (!import.meta.env.DEV) return;
        this.diagEvents.push([+((performance.now() - this.diagT0) / 1000).toFixed(2), ev, data ?? null]);
    }

    private diagFlush(why: string): void {
        if (!import.meta.env.DEV || this.diagSent || this.diagEvents.length === 0) return;
        this.diagSent = true;
        this.diagPost(why);
    }

    /**
     * 单独发一条记录，**不占用**「一局只发一次」的名额（diagSent 不动）。
     * 给「卡住了但还在打」这种情况用：那一局如果最后真的挂死，永远走不到 decision/stop，
     * 就永远不会落盘 —— 事后查无对证。所以卡住的当下先补一条快照。
     */
    private diagReport(why: string): void {
        if (!import.meta.env.DEV) return;
        this.diagPost(why);
    }

    private diagPost(why: string): void {
        const field = [0, 0], pool = [0, 0];
        for (const m of this.men) if (m.hp > 0) field[m.f]++;
        for (const sp of this.spawns) pool[sp.f] += Math.max(0, sp.pool);
        const body = JSON.stringify({
            at: new Date().toISOString(),
            why,
            totalSec: +((performance.now() - this.diagT0) / 1000).toFixed(2),
            field, pool,
            // [性能探针] 逐帧耗时（ms）：step = 推演，render = 绘制。
            // 60fps 的预算是 16.7ms/帧；两项之和逼近或超过它就是「卡」。
            perf: {
                frames: this.perfFrames,
                onField: field[0] + field[1],
                step: this.perfStat(this.perfStep),
                render: this.perfStat(this.perfRender),
            },
            events: this.diagEvents,
        });
        try {
            fetch('/api/scene13-probe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
                .catch(() => { /* 诊断失败绝不影响演出 */ });
        } catch { /* 同上 */ }
    }

    public stop(reason = 'unknown', keepFrame = false): void {
        this.diagPush('stop', { reason, keepFrame, active: this.active, over: this.over });
        this.diagFlush('stop:' + reason);
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
        this.slashes = [];
        this.sparks = [];
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
    private slotsOf(region: string, factionId?: string | null, generalId?: string | null): { key: string }[] {
        try {
            // 🔴 势力专属方阵最优先（如伊贺 iga_d 忍者军团、织田 owari 等）
            const factionSlots = factionId ? getFactionCompositionSlots(factionId, generalId) : null;
            const tier = factionSlots ? { slots: factionSlots } : getCultureTier(region as any, 50000);
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
    private formationModeOf(region: string, factionId?: string | null, generalId?: string | null): FormationMode {
        try {
            if (factionId) {
                const custom = FACTION_COMPOSITIONS[factionId];
                if (custom?.formationMode) return custom.formationMode;
                const factionSlots = getFactionCompositionSlots(factionId, generalId);
                if (factionSlots?.length) return inferFormationModeFromSlots(factionSlots);
            }
            const tier = getCultureTier(region as any, 50000);
            if (tier?.slots?.length) {
                return inferFormationModeFromSlots(tier.slots);
            }
        } catch (e) {
            console.warn('[Scene13WarLayer] 阵型推断失败，回退方阵:', e);
        }
        return 'square';
    }

    // ── 场景树/湖：随机布景 + 加载（纯装饰，不参与战斗逻辑，也不进 pending）──
    /**
     * 随机分布湖：**本场季节一张**（夏/秋/冬三选一，由 scatterLakes 开头按游戏日历定，树/湖同季）：
     * - 每场 1 个（主人 2026-08-18 定：只贴一个湖泊）
     * - 避开中央对攻走廊与出兵口
     * - 湖与湖之间留距（不叠成一大片）
     * 湖是贴地水域，画在最底层（ground 之下），不参与 y 深度排序。
     */
    private scatterLakes(VW: number, VH: number): void {
        this.sceneSeason = this.currentSeasonKind();
        const lakeWant = 1;   // 固定 1 个湖
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
     * 本场树/湖季节 = **战场真实海拔**（2026-08-18 主人定稿）：
     *   ≥3600m（雪线高原/高山雪顶，如青藏高原、帕米尔/昆仑雪峰）→ 白(2)
     *   600–3600m（山地/黄土高原/戈壁山麓/西域播仙一带/蒙古草原）→ 橙/秋(1)
     *   <600m（低地/平原）→ 绿(0)     [600m = LandTerrainSystem.MOUNTAIN_ELEVATION_M 同源]
     * 数据源 = 项目现成 ElevationSampler（Terrarium 高程瓦片 + LRU 缓存）：
     *   - 瓦片已缓存 → 同步命中，直接定色
     *   - 未缓存 → 后台拉取 + 文化区地貌/日历季节兜底（装饰绝不等待网络）
     * 无坐标/采样失败（防御）→ 日历季节：春/夏绿、秋橙、冬白。
     */
    private currentSeasonKind(): 0 | 1 | 2 {
        if (this.centerLat !== undefined && this.centerLng !== undefined) {
            try {
                const sampler = LandSeaSystem.getSampler();
                const elev = sampler.getElevationSync(this.centerLat, this.centerLng);
                if (elev !== null) {
                    if (elev >= 3600) return 2;   // 高原雪线 → 白
                    if (elev >= 600) return 1;    // 山地/黄土/西域高地 → 橙
                    return 0;                     // 低地平原 → 绿
                }
                sampler.scheduleFetch(this.centerLat, this.centerLng);   // 预取，下局命中

                // 首次未缓存时文化区地貌智能兜底：
                const reg = getRegion(this.centerLat, this.centerLng);
                if (reg === 'TIBET') return 2;
                if (reg === 'WESTERN' || reg === 'STEPPE' || reg === 'HEXI' || reg === 'NORTH' || reg === 'CENTRAL_ASIA' || reg === 'NORTHEAST') {
                    return 1; // 西域、草原、河西等黄色海拔带优先秋景
                }
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
                scale: CLOUD_SCALE_MIN + Math.random() * (CLOUD_SCALE_MAX - CLOUD_SCALE_MIN),
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
            if (!assets) { this.bank[key] = { realMelee: false, noAttackAnim: false, fh: 84, frames: {}, sets: { move: [[], []], atk: [[], []], die: [[], []], melee: [[], []], charge: [[], []], idle: [[], []] } }; return; }
            const b: WarBank = { realMelee: false, noAttackAnim: false, fh: 84, frames: {}, sets: { move: [[], []], atk: [[], []], die: [[], []], melee: [[], []], charge: [[], []], idle: [[], []] } };
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
            const atkUrls = ranged ? (assets.SHOOT ?? assets.ATTACK ?? []) : (assets.ATTACK ?? []);
            const meleeUrls = ranged ? (assets.ATTACK ?? []) : [];
            // 两套图完全一样 = 没有真正的近战动作（DE 素材普遍如此），贴脸时就别切姿态掐弹丸
            b.realMelee = meleeUrls.length > 0 && meleeUrls.join('|') !== atkUrls.join('|');
            // 没有攻击动作的兵种（攻击帧与待命帧字节相同），清单由离线扫描生成，见 NO_ATTACK_ANIM
            b.noAttackAnim = NO_ATTACK_ANIM.has(key);
            const groups: [string, string[]][] = [
                ['move', assets.MOVE ?? []],
                ['atk', atkUrls],
                ['melee', meleeUrls],
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
            this.bank[key] = { realMelee: false, noAttackAnim: false, fh: 84, frames: {}, sets: { move: [[], []], atk: [[], []], die: [[], []], melee: [[], []], charge: [[], []], idle: [[], []] } };
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
        // 抛射物素材目录：投石索 PROJ_SLING 已提取真实小石弹素材（2026-08-18，此前误复用大炮弹 PROJ_BALL）
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

    /** 火炮炮口焰：发射瞬间炮口火焰闪光（DE 攻击动画含炮口闪光，这里用火花补）。 */
    private muzzleFlash(m: WarMan, ax: number, ay: number, palette?: readonly string[]): void {
        const ang = Math.atan2(ay, ax);
        const ox = m.x + Math.cos(ang) * UNIT_PX * 0.6;
        const oy = m.y + Math.sin(ang) * UNIT_PX * 0.6 - UNIT_PX * 0.4;
        const colors = palette ?? ['#FFF4D0', '#FFD800', '#FF8C00', '#FFFFFF'];
        for (let i = 0; i < 6; i++) {
            const spd = 20 + Math.random() * 40;
            const spread = (Math.random() - 0.5) * 0.8;
            this.sparks.push({
                x: ox, y: oy,
                vx: Math.cos(ang + spread) * spd,
                vy: Math.sin(ang + spread) * spd - 6,
                t: 0,
                dur: 0.10 + Math.random() * 0.14,
                color: colors[(Math.random() * colors.length) | 0],
                size: 1.4 + Math.random() * 1.6,
            });
        }
    }

    /** 火矛手充能喷火（DE 进战先喷）：3 发低精度短程火枪弹 + 矛头火焰喷射。 */
    private fireLanceVolley(m: WarMan, foe: WarMan): void {
        const ax = foe.x - m.x, ay = foe.y - m.y;
        const ad = Math.hypot(ax, ay) || 1;
        const ang = Math.atan2(ay, ax);
        this.ensureProj('PROJ_SHOT');
        for (let v = 0; v < FIRE_LANCER_VOLLEY; v++) {
            const spread = (Math.random() - 0.5) * 0.55;   // 低精度散射
            const c = Math.cos(spread), s = Math.sin(spread);
            this.arrows.push({
                x: m.x, y: m.y - UNIT_PX * 0.45,   // 从胸口高度射出
                dx: ax / ad * c - ay / ad * s,
                dy: ax / ad * s + ay / ad * c,
                len: Math.min(ad, 170),            // 短程火枪弹（DE range 4 ≈ 160px）
                t: 0, dur: ARROW_DUR + Math.random() * 0.05, f: m.f,
                proj: 'PROJ_SHOT',
            });
        }
        // 矛头喷火：沿朝向喷一串橙红火焰火星
        const ox = m.x + Math.cos(ang) * UNIT_PX * 0.5;
        const oy = m.y + Math.sin(ang) * UNIT_PX * 0.5 - UNIT_PX * 0.45;
        const flame = ['#FFD800', '#FF8C00', '#FF4500', '#FFF4D0'];
        for (let i = 0; i < 9; i++) {
            const spd = 26 + Math.random() * 54;
            const spread = (Math.random() - 0.5) * 1.0;
            this.sparks.push({
                x: ox, y: oy,
                vx: Math.cos(ang + spread) * spd,
                vy: Math.sin(ang + spread) * spd - 8,
                t: 0,
                dur: 0.14 + Math.random() * 0.22,
                color: flame[(Math.random() * flame.length) | 0],
                size: 1.2 + Math.random() * 1.5,
            });
        }
    }

    private dir8(dx: number, dy: number): number {
        let a = Math.atan2(-dy, dx) * 180 / Math.PI;
        a = ((a % 360) + 360) % 360;
        return (9 - Math.floor(((a + 22.5) % 360) / 45)) % 8;
    }

    /**
     * 带迟滞的八向朝向：角度**贴着扇区边界**时不换向。
     *
     * 治的是主人反复报的「颤抖」里属于朝向的那一半：8 个方向每格 45°，
     * 一旦目标方位卡在两格交界（被推挤/目标自己也在动，每帧摆动一两度），
     * 贴图就会在两个朝向之间每帧来回跳。行军分支早有防抖（到达判定 + 只在真的走时才转向），
     * 但 2026-08-17 新加的追击分支没有 —— 追击时目标一直在动，正好长期贴在边界上。
     * 这里留 10° 缓冲：越过边界 10° 以上才真的换朝向。
     */
    private dir8Hyst(cur: number, dx: number, dy: number): number {
        const next = this.dir8(dx, dy);
        if (next === cur) return cur;
        let a = Math.atan2(-dy, dx) * 180 / Math.PI;
        a = ((a % 360) + 360) % 360;
        const off = (a + 22.5) % 45;      // 在本扇区内的位置：0 或 45 都表示正贴边界
        if (off < 10 || off > 35) return cur;
        return next;
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
            let batch = SIDE_CAP;                  // 一次补 324（固定批量）
            for (const s of ports) s.slotN = 0;    // 每批重置槽位计数（补兵也排方阵）

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
                // 本兵终身固定的落点偏移（见 AIM_JITTER）：出生时抽一次，之后 aimAt 的共用坐标都加它
                const jx = (Math.random() - 0.5) * 2 * AIM_JITTER;
                const jy = (Math.random() - 0.5) * 2 * AIM_JITTER;
                // 旗手身份出生时定死（勿改成每帧现挑，见 FLAG_EVERY）。
                // 每个出兵口独立计数：本口每出满 FLAG_EVERY 个精灵出一面旗 → 旗帜按口平均分布。
                s.spawned++;
                const bearer = (s.spawned % FLAG_EVERY === 0);
                // 列阵推进：**所有批次**都按口排方阵（rank=沿 x 纵深、file=沿 y 横列），补兵不再随机散布；
                // 但只有开局那批 march=true 整体平移迁就最慢，补兵 march=false 各自按兵种速度走。
                const inMarch = this.deployT > 0;
                const slotIdx = s.slotN++;
                const files = marchFilesOf(s.key);
                const dep = ((slotIdx / files) | 0) * MARCH_SP;
                const slotY = ((slotIdx % files) - (files - 1) / 2) * MARCH_SP;
                this.men.push({
                    f: s.f, key: s.key, jx, jy,
                    x: s.x + (s.f === 0 ? -dep : dep),
                    y: s.y + slotY,
                    tx: tgt.x + jx, ty: tgt.y + jy, hp: this.statsFor(s.key, s.f).hp, dir: this.dir8(tgt.x - s.x, tgt.y - s.y),
                    ph: Math.random() * 8, st: 0, foe: null, next: Math.random() * 0.2,
                    fightT: 0, aimT: 0, lock: 0, atkSt: 0, atkFlip: false,
                    prevX: s.x, prevY: s.y, stuckT: 0, sepX: 0, sepY: 0, y0: s.y,
                    flag: bearer, fo: Math.random() * 600,
                    march: inMarch, port: inMarch ? s : null, dep, slotY, pop: s.pop,
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
    /** 本兵占地半径（DE 真值，见 UNIT_RADIUS）；表里没有的落旧行为 SEP_DIST/2 */
    private radiusOf(key: string): number {
        return UNIT_RADIUS[key] ?? SEP_DIST / 2;
    }

    private separate(dt: number): void {
        const push = SEP_SPD * dt;
        for (const m of this.men) {
            if (m.hp <= 0) continue;
            const cx = (m.x / CELL_S) | 0, cy = (m.y / CELL_S) | 0;
            // 两个兵的最小间距 = 各自占地半径之和（DE 同款）。象兵/攻城器械因此真的占地方，
            // 挤不进去的兵沿接触面铺开 —— 弧形阵面就是这么长出来的。
            const rm = this.radiusOf(m.key);
            let ox = 0, oy = 0, seen = 0, nearest2 = Infinity, minGap = SEP_DIST;
            for (let gx = cx - 1; gx <= cx + 1 && seen < 6; gx++) {
                for (let gy = cy - 1; gy <= cy + 1 && seen < 6; gy++) {
                    const a = this.gs.get(HKEY(gx, gy));
                    if (!a) continue;
                    for (let i = 0; i < a.length && seen < 6; i++) {
                        const o = a[i];
                        if (o === m || o.hp <= 0) continue;
                        const dx = m.x - o.x, dy = m.y - o.y;
                        const dd = dx * dx + dy * dy;
                        const gap = rm + this.radiusOf(o.key);      // 这一对的最小间距
                        if (dd >= gap * gap) continue;
                        if (dd < nearest2) { nearest2 = dd; minGap = gap; }
                        seen++;
                        if (dd < 1e-4) { ox += (Math.random() - .5); oy += (Math.random() - .5); continue; }
                        const inv = 1 / Math.sqrt(dd);
                        ox += dx * inv; oy += dy * inv;
                    }
                }
            }
            // 邻居为空也要让平滑量衰减回 0，否则会带着上一次的推力继续滑
            if (!seen) {
                m.sepX += (0 - m.sepX) * SEP_SMOOTH;
                m.sepY += (0 - m.sepY) * SEP_SMOOTH;
                m.x += m.sepX; m.y += m.sepY;
                continue;
            }
            const l = Math.hypot(ox, oy) || 1;
            // 🔴 按**重叠深度**缩放推力：几乎不重叠时几乎不推。
            //    原来不管挤多深都按全速推，而邻居集合每帧都在变（只看 6 个），
            //    推的方向来回摆 → 人在原地微微发抖。
            const depth = Math.max(0, 1 - Math.sqrt(nearest2) / minGap);
            // 先算出「这一帧本该推多少」，再让实际推力慢慢向它靠拢（见 SEP_SMOOTH）
            const vx = ox / l * push * depth, vy = oy / l * push * depth;
            m.sepX += (vx - m.sepX) * SEP_SMOOTH;
            m.sepY += (vy - m.sepY) * SEP_SMOOTH;
            m.x += m.sepX;
            m.y += m.sepY;
        }
    }

    /**
     * 索敌：以自身为中心**环形向外扩展**，返回半径内**最近**的敌人（精确最近邻）。
     *
     * 🔴 [2026-08-17 修「攻方白拿 10~15% 战力」] 旧实现是「gx 从 cx-span 递增扫，逮到就返回」，
     *    这让胜负取决于网格遍历方向而非战力：攻方在左、守方在右，攻方的兵先扫到的是离自己
     *    最近的敌人，守方的兵先扫到的却是离自己最远的。实测（war_sim，同兵种对镜）：
     *      · 旧实现          → 攻方 16 胜 0 负
     *      · 仅翻转扫描方向  → 守方 16 胜 0 负（完全镜像，证明根因就是遍历顺序）
     *      · 本实现（最近邻）→ 6 : 6，对称
     *    等效战力约 10~15%：给劣势方 1.15 倍八环加成、或多 10~20% 兵力即可翻盘。因为 13 是
     *    **裁决层**（onDecision → forceScene13Result 写死战果、跳过八环推演），这个偏袒直接
     *    决定真实胜负，不是观感问题。
     *
     *    改法依据帝国决定版：DE 的单位自动索敌一律选**最近**的敌人，克制关系由护甲与加成
     *    伤害实现（本作 dmgVs 已照搬 DE 数值：骑士 100/10/2/2、弓兵 30/4/0/0），不靠目标
     *    选择偏差去撑。实测三种索敌模式下「骑克弩」都成立，旧注释担心的「nearest 会把
     *    cav vs ranged 从 92% 打到 25%」在 08-13 数值定稿后已复现不出来。
     *
     *    环形 + 提前退出（当前最优已近于下一环的最小可能距离就停）在数学上等价于全翻找最近，
     *    war_sim 逐种子比对余兵完全一致，但通常只需展开 1~2 环，不必把 span²（远程 25）格翻完。
     *    ⚠️ 别改回「逮到就返回」，也别加「只看前 N 个」的截断——两者都会重新引入方向偏差
     *      （实测带 24 上限的最近邻仍偏袒攻方 9:3）。
     */
    /**
     * 找目标：环形最近邻，但**已经被 SPREAD_CAP 个人打的目标优先跳过**（主人 2026-08-17「不能分散攻击吗」）。
     *
     * 为什么是这个数：围殴加成 `1 + 0.15 × min(GANG_CAP, N-1)` 在 N=4 就封顶了，
     * **第 5 个人挤上去一点伤害都不加**，纯粹是白挤 —— 挤出来的就是主人反复报的
     * 「一堆兵冲着同一个点拥挤颤抖」。所以让第 5 个人去找次近的空闲目标，
     * 既散得开，又一分伤害不多不少（挤上去本来也没收益）。
     *
     * 🔴 找不到空闲目标时**照旧返回最近的那个**，绝不让人没目标可打。
     * 🔴 判据对双方完全对称，不引入方向偏袒 —— 那是 SEARCH_MODE「逮到就返回 / 只看前 N 个」
     *    的老毛病（曾让攻方白拿 10~15% 战力，见 2026-08-17 索敌修复）。
     *
     * 实测（war_sim，同兵种对镜）：横向铺开 30→36px（+20%）、攻击/移动状态切换 0.30→0.26 次/人·秒；
     * 克制三边方向不变、幅度差 1~7%；时长在噪声内。
     */
    private search(m: { x: number; y: number; f: number }, radius: number, minRange = 0): WarMan | null {
        const useR = radius > CELL_M;
        const map: Map<number, WarMan[]> = useR ? this.gr : this.gm; const cell = useR ? CELL_R : CELL_M;
        const span = Math.max(1, Math.ceil(radius / cell));
        const cx = (m.x / cell) | 0, cy = (m.y / cell) | 0;
        const r2 = radius * radius;
        let best: WarMan | null = null, bd = r2;      // 最近的（兜底）
        let free: WarMan | null = null, fd = r2;      // 最近的**还没被打满**的（优先）
        // 🔴 [2026-08-17] 投石车/投石机有最小射程：贴太近就抛不出去（DE 同款）。
        //    原来只在**放弹丸**那一步判 tooClose，结果贴脸时「照样扣血、就是不出石弹」——
        //    主人实锤「看不到投石兵的石弹」。改成索敌时就避开太近的目标：
        //    优先挑够得着又打得出的，实在只剩贴脸的才打（总比呆站着强）。
        const minR2 = minRange * minRange;
        for (let ring = 0; ring <= span; ring++) {
            // 已有候选，且它比下一环任何格子的最小可能距离都近 → 不可能更近了，停
            // （按真正会被返回的那个候选判，否则会在还能找到空闲目标时提前收工）
            const cand = free ?? best;
            const cd = free ? fd : bd;
            if (cand) {
                const floor = (ring - 1) * cell;
                if (floor > 0 && cd < floor * floor) break;
            }
            for (let gx = cx - ring; gx <= cx + ring; gx++) {
                for (let gy = cy - ring; gy <= cy + ring; gy++) {
                    if (Math.max(Math.abs(gx - cx), Math.abs(gy - cy)) !== ring) continue;   // 只走本环
                    const a = map.get(HKEY(gx, gy));
                    if (!a) continue;
                    for (let i = 0; i < a.length; i++) {
                        const o = a[i];
                        if (o.f === m.f || o.hp <= 0) continue;
                        const d = (o.x - m.x) ** 2 + (o.y - m.y) ** 2;
                        if (d >= r2) continue;
                        const tooNear = minR2 > 0 && d < minR2;
                        if (d < bd) { bd = d; best = o; }
                        if (!tooNear && o.atkers < SPREAD_CAP && d < fd) { fd = d; free = o; }
                    }
                }
            }
        }
        return free ?? best;
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
                    const dps = dmgVs(shooter, this.statsFor(o.key, o.f)) / shooter.reload;
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
    /**
     * 推进两方的巡逻航点（每方一个共享进度，见 routeWp / aimAt）。
     *
     * 判据：本方**过半**的兵已经进到当前航点 ROUTE_ARRIVE 范围内 → 整军转向下一个航点。
     * 用「过半」而不是「有人到了就转」：先头部队刚摸到就全军掉头的话，后队会在半路上被反复调头，
     * 看起来同样是乱走。也不用「全部到齐」——总有被缠住的散兵永远到不了，那样航点会卡死不推进。
     */
    private advanceRoute(): void {
        const vw = this.canvas?.width ?? 1920;
        const vh = this.canvas?.height ?? 1080;
        for (let f = 0 as 0 | 1; f <= 1; f = (f + 1) as 0 | 1) {
            const homeX = f === 0 ? vw * 0.07 : vw * 0.93;
            const foeX = f === 0 ? vw * 0.93 : vw * 0.07;
            const idx = this.routeWp[f] % 4;
            let total = 0, arrived = 0;
            for (const m of this.men) {
                if (m.f !== f || m.hp <= 0) continue;
                total++;
                // 航点①③ 的 y 是各兵自己的出生路/对角路，所以逐兵算
                const t = idx === 0 ? { x: foeX, y: m.y0 }
                    : idx === 2 ? { x: homeX, y: vh - m.y0 }
                        : { x: vw / 2, y: vh / 2 };
                if ((t.x - m.x) ** 2 + (t.y - m.y) ** 2 < ROUTE_ARRIVE * ROUTE_ARRIVE) arrived++;
            }
            if (total > 0 && arrived * 2 >= total) this.routeWp[f] = (this.routeWp[f] + 1) % 4;
        }
    }

    /**
     * 列阵推进：整体平移 + 前锋线接触解除（见 MARCH_REL）。
     * 待命阶段不推进（那时全军静止渐显）；解除后本方法整场空转。
     */
    private marchTick(dt: number, deploying: boolean): void {
        if (!this.marching || deploying) return;
        // 阵型速度 = 本方列阵兵里**最慢**的那个。
        // 阵型行军的定义就是全队迁就最慢的人 —— 不这么做骑兵会把步兵甩下，队形当场散架。
        const spdMin = [Infinity, Infinity];
        let anyMarcher = false;
        for (const m of this.men) {
            if (m.hp <= 0 || !m.march) continue;
            anyMarcher = true;
            const sp = this.statsFor(m.key, m.f).spd;
            if (sp < spdMin[m.f]) spdMin[m.f] = sp;
        }
        if (!anyMarcher) { this.marching = false; return; }   // 列阵那批没了（理论上到不了），直接放开
        for (let f = 0; f < 2; f++) if (spdMin[f] < Infinity) this.adv[f] += spdMin[f] * dt;
        // 前锋线 = 本方最靠前那排出兵口的 x ± 已推进距离。
        // 阵型是刚体，直接由锚点算即可，不受个别掉队/落单兵影响（拿存活兵均值算会被拖后腿）。
        let front0 = -Infinity, front1 = Infinity;
        for (const sp of this.spawns) {
            if (sp.f === 0) front0 = Math.max(front0, sp.x + this.adv[0]);
            else front1 = Math.min(front1, sp.x - this.adv[1]);
        }
        if (front1 - front0 < MARCH_REL) {
            this.marching = false;
            for (const m of this.men) m.march = false;   // 全军同时解除，双方一起炸开接战
        }
    }

    private aimAt(m: WarMan): { x: number; y: number } | null {
        // ① 视野内最近的敌兵（找最近，不是逮到就算）。这一级是**每人各自的目标**，不加散开偏移。
        const near = this.search(m, MARCH_R);
        if (near) return { x: near.x, y: near.y };

        // ── ② 没人可打时走「巡逻航路」（主人 2026-08-17 定）──────────────────────────
        //
        // 为什么不再用「走敌方出兵口 → 扑敌军重心」那套：
        //   出兵口是**静止的路标**，兵冲到敌方底边发现没人，下一个候选还是另一个出兵口
        //   （彼此相距远超 NEAR_PORT 判定圈），于是**沿着敌方底边从一个口挪到另一个口来回转悠**，
        //   永远轮不到「扑重心」那一级，也就永远不会掉头回中间找人。
        //   实测死局有据：scratch/scene13_probe_log.jsonl 2026-08-17T11:57Z 那条 ——
        //   60 秒零阵亡、双方场上 170/219 都卡在补兵线 150 以上，补兵闸门两边同时焊死，打到天荒地老。
        //
        // 主人的方案（已实测）：给每个兵一条**循环航路**，两军航路必然交叉，不可能一直碰不上。
        //   ⓵ 敌方底边·本路 y（各走各的路，不汇中间，保留原来的分路作战）
        //   ⓶ 战场中心
        //   ⓷ 己方底边·**对角** y（上路兵去己方下边）
        //   ⓸ 回中心，循环
        // 任何时候视野内出现敌人，上面的 ① 立刻接管，航路只管「没人可打时往哪走」。
        //
        // war_sim 实测（12 局，与旧兜底对照）：时长持平（步 184/178 vs 202/174s、
        // 骑 141/158 vs 147/144s、远程 171/121 vs 129/130s）；克制三边方向不变；
        // 收尾更干净（三个种子败方余兵全归 0，旧兜底有两局残兵收不掉）。
        const jit = (p: { x: number; y: number }): { x: number; y: number } => ({ x: p.x + m.jx, y: p.y + m.jy });
        const vw = this.canvas?.width ?? 1920;
        const vh = this.canvas?.height ?? 1080;
        const homeX = m.f === 0 ? vw * 0.07 : vw * 0.93;   // 己方底边
        const foeX = m.f === 0 ? vw * 0.93 : vw * 0.07;    // 敌方底边
        const route = [
            { x: foeX, y: m.y0 },
            { x: vw / 2, y: vh / 2 },
            { x: homeX, y: vh - m.y0 },
            { x: vw / 2, y: vh / 2 },
        ];
        // 用**本方共享**的航点进度（推进逻辑在 step 里按全军统一判定，见 advanceRoute）
        return jit(route[this.routeWp[m.f] % route.length]);
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
        // ── 打不完的检测（当前只观察不动手，见 STALL_GUARD_ENFORCE）──
        this.battleSec += dt;
        const hardStop = this.battleSec > HARD_STOP_SEC;
        // lastKillSec > 0 = 本场已经死过人；第一滴血之前不启用这条（开局双方还在相向而行）
        const noKill = this.lastKillSec > 0 && this.battleSec - this.lastKillSec > NO_KILL_SEC;
        if ((hardStop || noKill) && !this.stallReported) {
            this.stallReported = true;
            const why = hardStop ? 'hardStop' : 'noKillStall';
            const quietSec = +(this.battleSec - this.lastKillSec).toFixed(1);
            console.warn(
                `⚠️ [Scene13War] 这一局判定为「打不完」（${why}）：已打 ${this.battleSec.toFixed(0)}s、`
                + `${quietSec}s 没人阵亡。当前放行不收场（STALL_GUARD_ENFORCE=false），已落一条 stallDetected 记录。`,
            );
            this.diagPush(why, { sec: +this.battleSec.toFixed(1), quietSec });
            this.diagReport('stallDetected:' + why);   // 挂死也留档（不占最终那条记录的名额）
            if (STALL_GUARD_ENFORCE) {
                this.forceResultByRatio(0.85);
                return;
            }
        }
        this.spawnTick(dt);
        // 开场列阵待命倒计时：阶段内全军静止渐显，结束才开打（主人 2026-08-16）
        if (this.deployT > 0) this.deployT -= dt;
        const deploying = this.deployT > 0;
        // 敌军重心（每帧 O(n)，供 aimAt 兜底）
        const cx = [0, 0], cy = [0, 0], cn = [0, 0];
        for (const m of this.men) { cx[m.f] += m.x; cy[m.f] += m.y; cn[m.f]++; }
        this.enemyCen = [0, 1].map(f => cn[f] ? { x: cx[f] / cn[f], y: cy[f] / cn[f] } : null);
        this.advanceRoute();
        this.marchTick(dt, deploying);

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
            const wt = this.statsFor(m.key, m.f);
            const stats = wt;
            const SIGHT = stats.sight ?? 160;   // 寻敌/丢目标迟滞（DE LOS，已含羽箭/锥头/护腕视野科技）
            const REACH = Math.max(stats.rng, 65);   // 出手扣血（近战贴身 65 / 远程 rng）
            // 火矛手充能冷却递减（DE 30 秒充能，出生即满 → 首次进战就喷）
            if (FIRE_LANCER_TYPES.has(m.key)) m.chargeCd = Math.max(0, (m.chargeCd ?? 0) - dt);

            // 目标每 0.2s 重找（错开相位）；目标死/跑远保持不换
            m.next -= dt;
            const keep = m.foe && m.foe.hp > 0
                && (m.foe.x - m.x) ** 2 + (m.foe.y - m.y) ** 2 < SIGHT * SIGHT * 1.44;
            if (!keep && m.next <= 0) {
                m.foe = this.search(m, SIGHT, MIN_RANGE_TYPES[m.key] ?? 0);
                m.next = 0.2;
            } else if (!keep) m.foe = null;

            // 列阵推进期间：移动目标恒为「本口锚点 + 自己的槽位」，每帧跟着阵型走，不走 aimAt。
            // 索敌（上面那段）照旧执行 —— 远程够得着就在队形里放箭，只是不许脱队去追（见下）。
            if (m.march && m.port) {
                const sx = m.port.x + (m.f === 0 ? this.adv[0] - m.dep : -this.adv[1] + m.dep);
                [m.tx, m.ty] = this.fieldBound(sx, m.port.y + m.slotY);
            } else if (!m.foe) {
                // 没在打架就持续更新移动目标走过去（0.5s 刷新一次）
                m.aimT = (m.aimT ?? 0) - dt;
                if (m.aimT <= 0) {
                    const aim = this.aimAt(m);
                    if (aim) { [m.tx, m.ty] = this.fieldBound(aim.x, aim.y); }
                    m.aimT = 0.5;
                }
            }

            const foe = m.foe;
            if (foe) {
                const fd2 = (foe.x - m.x) ** 2 + (foe.y - m.y) ** 2;
                const close = fd2 < 65 * 65;
                // 🔴 [2026-08-17 修·「动作切换时的颤抖」] 够得着的判定必须带迟滞。
                //    没有迟滞时，站在射程/贴身边缘上的兵会每帧翻面：
                //      够得着 → 站桩出手（st=1，播攻击帧）→ 被 separate 推开半步 → 够不着
                //      → 转身追击（st=0，播移动帧）→ 走半步又够着 → ……
                //    每帧在「攻击帧/移动帧」之间来回切 = 主人看到的动作抖。近战最明显：
                //    贴身圈 65px，而推挤力 120px/s 与移动速度同量级，边界上必然反复穿越。
                //    🔴 迟滞**只用来稳住姿势，绝不放宽出手距离**：
                //    直接把 REACH 乘 1.2 会让远程白得 20% 射程（火焰弓 400→480），那是改数值不是修画面。
                //    所以出手判据 inReach 保持严格，另设一条「迟滞带」：
                //    刚被推出攻击距离、但还没退出 1.2 倍的兵，既不追也不打，**站住保持原姿势**，
                //    等真的被拉开了才转身去追。伤害一分不多给（迟滞带里本来就够不着，不结算）。
                const engaged = m.st !== 0;                       // m.st 此刻仍是上一帧的值
                const inReach = fd2 < REACH * REACH;              // 严格：出手/扣血用这个
                // 🔴 [2026-08-17 再修] 迟滞带宽度取「20% 射程」与「25px」的**较小值**。
                //    原来只按比例算，远程兵会宽得离谱：射程 400 的火焰弓，400~480px 之间
                //    既不放箭也不挪窝 —— 主人反馈「离敌军很近还在待命」就有这一份。
                //    抖动来自贴身互推（每帧一两个像素），25px 足够盖住，不需要更宽。
                const hystBand = REACH + Math.min(REACH * 0.2, 25);
                const inHystBand = !inReach && engaged && fd2 < hystBand ** 2;
                // 缠斗 4 秒脱离。
                // 🔴 [2026-08-17 修] 只在**够得着**的时候计时——把「跑过去的路上」也算进这 4 秒，
                //    会让慢速大视野兵种永远打不到人：象兵 LOS 280、贴身 65、速度 40，
                //    从视野边缘跑到跟前要 5.4s（精锐战象 320/6.4s），4 秒一到就丢目标重找，
                //    再锁再跑再丢，一刀都砍不出去。实测这样的兵种共 6 个（全是象 + 桑纳亚）。
                if (inReach) {
                    m.fightT = (m.fightT || 0) + dt;
                    // 🔴 [2026-08-17 主人拍板] 目标只剩半血以下就**不换人**，把他打死再走。
                    //    原来不看血量：跟一个人打满 4 秒，哪怕对方只剩一口气也照样掉头去找别人 ——
                    //    主人原话「敌人快死了，自己逃跑？搞什么」。
                    //    ⚠️ 但这条 4 秒换人**不能整个删掉**：实测关掉后骑兵对镜 1/6 打不完（600s 上限），
                    //       它在防同兵种对镜的僵持死锁。只去掉「快死了还走」这个荒唐场面即可。
                    //    实测阈值 0 / 0.3 / 0.5（war_sim 步骑远程各 2 种子）：0.5 与现状持平甚至略快。
                    const foeMax = this.statsFor(foe.key, foe.f).hp;
                    const nearlyDead = foe.hp < foeMax * KEEP_TARGET_HP;
                    if (m.fightT > 4 && !nearlyDead) {
                        m.foe = null; m.fightT = 0; m.next = 0.4; m.lock = 0;
                        const aim = this.aimAt(m);
                        if (aim) { [m.tx, m.ty] = this.fieldBound(aim.x, aim.y); }
                        continue;
                    }
                }
                // 列阵推进期间**够不着就不追**（帝国 DE 的 Stand Ground 行军）：回自己的槽位随队压上。
                // 放在迟滞带之前：迟滞带会让人站住不动，那是接战后的防抖装置，列阵段必须继续走。
                // 够得着的照常落到下面的攻击分支 —— 远程在队形里放箭，不禁火。
                if (m.march && !inReach) {
                    m.st = 0;
                    const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
                    const step = stats.spd * dt;
                    if (stats.spd > 0 && d > Math.max(ARRIVE_EPS, step)) {
                        m.x += dx / d * step;
                        m.y += dy / d * step;
                        m.dir = this.dir8(dx, dy);
                    }
                    // 🔴 这里 continue 会跳过循环尾部的渐显与动画推进，必须就地补上
                    //    （不补 = 贴地滑行不迈腿 + 新兵一路半透明，见追击分支同款血训）
                    if (m.fadeT > 0) m.fadeT -= dt;
                    m.ph += dt * 8;
                    continue;
                }
                // 够不着 → 追击（DE「看见就冲上去」；近战从 LOS 圈走向贴身，远程够射程前走位）
                if (inHystBand) {
                    // 迟滞带：被推挤挤出攻击距离一点点，站住别动，姿势保持不变（见上面的说明）。
                    // 不改 m.st，所以渲染继续用上一帧那套帧，不会在攻击帧/移动帧之间来回跳。
                    if (m.fadeT > 0) m.fadeT -= dt;
                    m.ph += dt * (m.st ? 8 / 1.5 : 8);
                    continue;
                }
                if (!inReach) {
                    m.st = 0;
                    // 绕着目标散开：瞄目标**周围一圈**上属于自己的那个点，不是目标本人那一个点。
                    // 角度由 jx/jy 推出（出生时定死，终身不变），所以每个兵稳定从同一个方位围上去。
                    // 停手判据仍看「离目标本人多远」（inReach），所以偏移不会让人够不着。见 CHASE_RING。
                    const ra = Math.atan2(m.jy, m.jx);
                    const fdx = foe.x + Math.cos(ra) * CHASE_RING - m.x;
                    const fdy = foe.y + Math.sin(ra) * CHASE_RING - m.y;
                    const fd = Math.hypot(fdx, fdy) || 1;
                    // ── 前方被己方兵挡住 → **绕过去**，不是站着等 ──────────────────────
                    // 🔴 [2026-08-17 主人拍板] 「战场上被挡着就站 2 秒」不成立，人会绕。
                    //    帝国时代的弧形阵面就是这么长出来的：每个兵有自己的占地，被前面的人挡住时
                    //    寻路把他从侧面带过去，一层层绕不过去的就沿接触面铺开 = 弧形。
                    //    我们没有寻路，用最省的等效做法：**沿垂直方向侧滑**。
                    //    绕行方向按本兵固定（取自 jy 的符号），不每帧现挑 —— 现挑会左右摇摆，又是一种抖。
                    //    绕开之后下一帧自然判定不堵，立刻恢复直冲。
                    const ux = fdx / fd, uy = fdy / fd;
                    const px = m.x + ux * CELL_S, py = m.y + uy * CELL_S;
                    const bcx = (px / CELL_S) | 0, bcy = (py / CELL_S) | 0;
                    let blocked = false;
                    for (let gx = bcx - 1; gx <= bcx + 1 && !blocked; gx++) {
                        for (let gy = bcy - 1; gy <= bcy + 1 && !blocked; gy++) {
                            const a = this.gs.get(HKEY(gx, gy));
                            if (!a) continue;
                            for (const o of a) {
                                if (o === m || o.f !== m.f || o.hp <= 0) continue;
                                const odx = px - o.x, ody = py - o.y;
                                const rr = this.radiusOf(m.key) + this.radiusOf(o.key);
                                if (odx * odx + ody * ody < rr * rr) { blocked = true; break; }
                            }
                        }
                    }
                    let mvx = ux, mvy = uy;
                    if (blocked) {
                        // 🔴 **绕行必须保留前进分量**：纯侧滑=全军绕圈不接敌，实测步兵对镜 184s→467s、
                        //    骑兵 159s→260s（war_sim 扫 SLIDE_W=0/0.35/0.6/1）。取 0.4 一档实测与不绕行持平甚至略快。
                        const side = m.jy >= 0 ? 1 : -1;      // 本兵固定绕行侧，避免左右摇摆
                        const bx = ux * (1 - SLIDE_W) + (-uy * side) * SLIDE_W;
                        const by = uy * (1 - SLIDE_W) + (ux * side) * SLIDE_W;
                        const bl = Math.hypot(bx, by) || 1;
                        mvx = bx / bl; mvy = by / bl;
                    }
                    m.x += mvx * stats.spd * (blocked ? SLIDE_RATE : 1) * dt;
                    m.y += mvy * stats.spd * (blocked ? SLIDE_RATE : 1) * dt;
                    m.dir = this.dir8Hyst(m.dir, mvx, mvy);   // 朝向跟着实际走向（绕行时朝侧面）
                    // 🔴 [2026-08-17 修] 这里 continue 会跳过循环尾部的渐显与动画推进，
                    //    所以必须就地补上：不补的话，追击中的兵**踏步动画冻结**（贴地滑行），
                    //    刚出生就开始追的兵还会**一直半透明**（fadeT 不递减）。
                    if (m.fadeT > 0) m.fadeT -= dt;
                    m.ph += dt * 8;          // st=0 走路节奏，与尾部同式
                    continue;
                }
                // 炸药自爆兵（DE 爆破兵/火焰骆驼：冲入敌阵一旦近身引爆，造成毁灭性范围 AoE 伤害并自爆牺牲）
                if (SUICIDE_TYPES.has(m.key) && close && m.hp > 0) {
                    this.explode(m.x, m.y);
                    // 自爆兵 key 出生时已校验在 WAR_TYPES（原 petard 兜底不会触发；statsFor 内部有 light_infantry 防崩）
                    const shooter = this.statsFor(m.key, m.f);
                    this.splash(m, 75, shooter, 1.0);
                    m.hp = 0;
                    this.pushCorpse(m);
                    continue;
                }
                m.st = (stats.rng && close && this.bank[m.key]?.realMelee) ? 2 : 1;
                // 交战中也走迟滞：贴身互推时目标方位每帧摆动，直接 dir8 会让贴图在两个朝向间跳
                m.dir = this.dir8Hyst(m.dir, foe.x - m.x, foe.y - m.y);
                m.lock = (m.lock ?? 0) - dt;
                const reloadTime = stats.reload || 2.0;
                if (m.lock <= 0) {
                    m.lock = reloadTime; m.ph = 0;
                    m.shot = false;   // 新一轮：等攻击动画播到放箭相位再射
                    m.slashed = false;
                    // 攻击动作交替（主人 2026-08-11 拍板）：有冲锋组的兵种（象兵/弓骑）每轮出手翻转，
                    // 在「攻击帧/冲锋帧」两套动作间轮播，丰富表现；无冲锋组的兵种不受影响。
                    if (this.bank[m.key]?.sets.charge?.[0]?.length) m.atkFlip = !m.atkFlip;
                    // 火矛手充能喷火（DE：进战先喷 3 发短程火枪弹，30 秒充能）
                    if (FIRE_LANCER_TYPES.has(m.key) && (m.chargeCd ?? 0) <= 0 && foe) {
                        m.chargeCd = FIRE_LANCER_CHARGE;
                        this.fireLanceVolley(m, foe);
                    }
                } else {
                    // 攻击动画推进：
                    // 动作以自然节奏（~1.2-1.5s）播满 8 相位后收势，长装填兵种（火炮 6.5s、火枪 3.45s 等）在发射后等待装填完毕。
                    // 🔴 [2026-08-17 定] 职责划分：**ph 只管计时，"播一遍还是循环"由渲染层决定**。
                    //    所以这里不再给 ph 封顶（封顶会让装填期的待命帧定格在第 0 帧不动）：
                    //      · 攻击类帧（atk/charge/melee）渲染时 clamp 到末帧 → 播满自然停住；
                    //      · 待命/移动帧渲染时取模循环 → ph 继续涨才能动起来。
                    //    动作节奏固定 ~1.5s 播完一遍，装填时间另算（长装填兵种播完就回待命站姿）。
                    const animDur = Math.min(reloadTime, 1.5);
                    m.ph += dt * 8 / animDur;
                    // 放箭/开火：动画播到该兵种专属发射相位（shootPhase）才射出，和动作对齐。
                    // 只有真正在放箭/开火的那一轮才有弹丸：被贴身改白刃（st=2）或处于攻城盲区（minRange）时不射。
                    // 🔴 2026-08-16 主人定：抛射物按兵种一一对应 DE 素材（箭/标枪/飞镖/飞斧/火箭/炮弹/弹丸），
                    //    连弩（诸葛弩）连发多支（普通 3、精锐 5，AoE2 wiki），风琴炮 5 弹，火箭车 5 支，其余每轮 1 支。
                    const minR = MIN_RANGE_TYPES[m.key] ?? 0;
                    const tooClose = minR > 0 && ((foe.x - m.x) ** 2 + (foe.y - m.y) ** 2 < minR * minR);
                    const shootPhase = SHOOT_PHASE_BY_TYPE[m.key] ?? DEFAULT_SHOOT_PHASE;
                    if (!m.shot && m.ph >= shootPhase && stats.rng > 65 && m.st === 1 && !tooClose) {
                        m.shot = true;
                        const ax = foe.x - m.x, ay = foe.y - m.y;
                        const ad = Math.hypot(ax, ay) || 1;
                        const proj = PROJ_TYPE[m.key] ?? 'PROJ_ARROW';
                        const volley = PROJ_VOLLEY[m.key] ?? 1;
                        const baseDur = PROJ_DUR[proj] ?? ARROW_DUR;
                        this.ensureProj(proj);
                        const isFirearm = FIREARM_TYPES.has(m.key);
                        for (let v = 0; v < volley; v++) {
                            // 火枪兵/火器轻微自然散射（DE 65%~75% 精度模拟）
                            const spread = isFirearm ? (Math.random() - 0.5) * 0.14 : 0;
                            const c = Math.cos(spread), s = Math.sin(spread);
                            const ndx = (ax / ad) * c - (ay / ad) * s;
                            const ndy = (ax / ad) * s + (ay / ad) * c;
                            this.arrows.push({
                                x: m.x, y: m.y - UNIT_PX * 0.45,   // 从胸口高度射出，不是脚底
                                dx: ndx, dy: ndy, len: ad,
                                t: 0, dur: baseDur + Math.random() * 0.05, f: m.f,
                                proj,
                                delay: v * PROJ_VOLLEY_DELAY,      // 连发：第 v 支延迟 v×80ms 射出
                            });
                        }
                        // 火器炮口焰/枪口焰：发射瞬间火焰闪光（DE 攻击动画含炮口闪光，这里用火花补）
                        if (isFirearm) this.muzzleFlash(m, ax, ay);
                        // 没有攻击动画的车辆（高丽战车/胡斯战车）：车身不动，靠一簇射击尘烟让观众看出它在开火。
                        // 用素色而不是火器的橙黄焰 —— 它们射的是箭，不是火药。
                        else if (this.bank[m.key]?.noAttackAnim) this.muzzleFlash(m, ax, ay, SHOT_DUST_COLORS);
                    }
                }
                m.atkSt = m.st;
                // 总加成：把战略层强弱（将领/精锐/武将技/文化/运气）带进每一刀
                // 伤害 = DE 公式 dmgVs(攻+加成−防) / reload（装填时间），再乘 sideBonus（八环）与围殴。
                // 相克由 DE 加成伤害 + 近/远防自然涌现（步克骑/弓克步/骑克弓），无全局系数。
                const shooter = this.statsFor(m.key, m.f);
                const target = this.statsFor(foe.key, foe.f);
                const dps = dmgVs(shooter, target) / shooter.reload;
                if (wt.aoe) this.splash(m, REACH, shooter, dt);
                else {
                    foe.atkNext++;
                    foe.hp -= dps * this.sideBonus[m.f] * gangMul(foe) * dt;
                    if (foe.hp <= 0) this.pushCorpse(foe);
                }
                // ── 近战出手：生成刀光剑影（微弯斩击刀痕 / 突刺枪芒）与碰撞金属火花 ──
                const keyStr = m.key.toLowerCase();
                const isHeavyNonBlade = keyStr.includes('elephant') || keyStr.includes('ram') || keyStr.includes('wagon');
                const isMeleeAttacking = !isHeavyNonBlade && (stats.rng <= 65 || m.st === 2 || close);
                if (isMeleeAttacking && !m.slashed && m.ph >= 3) {
                    m.slashed = true;
                    const attackAngle = Math.atan2(foe.y - m.y, foe.x - m.x);
                    const contactX = m.x * 0.45 + foe.x * 0.55;
                    const contactY = (m.y * 0.45 + foe.y * 0.55) - UNIT_PX * 0.35;
                    const isThrust = keyStr.includes('spear') || keyStr.includes('pike') ||
                        keyStr.includes('lancer') || keyStr.includes('kamayuk') ||
                        keyStr.includes('kuang') || keyStr.includes('hoplite');
                    const kind: 'slash' | 'thrust' = isThrust ? 'thrust' : 'slash';
                    const slashColors = ['#FFFFFF', '#FFF8D6', '#FFE58F', '#F0F8FF'];
                    const color = slashColors[(Math.random() * slashColors.length) | 0];

                    this.slashes.push({
                        x: contactX,
                        y: contactY,
                        angle: attackAngle,
                        kind,
                        t: 0,
                        dur: kind === 'thrust' ? 0.08 : 0.09,
                        radius: kind === 'thrust' ? 10 : 12,
                        color,
                        flip: Math.random() < 0.5,
                    });

                    // 出手伴随 1~2 颗微小金属飞溅火花
                    const sparkCount = Math.random() < 0.7 ? 1 : 2;
                    const sparkColors = ['#FFF9E6', '#FFE066', '#FFB830', '#FFFFFF'];
                    for (let i = 0; i < sparkCount; i++) {
                        const spd = 14 + Math.random() * 20;
                        const baseAng = attackAngle + Math.PI * 0.5 * (Math.random() > 0.5 ? 1 : -1);
                        const ang = baseAng + (Math.random() - 0.5) * 0.8;
                        this.sparks.push({
                            x: contactX + (Math.random() - 0.5) * 3,
                            y: contactY + (Math.random() - 0.5) * 3,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd - 8,
                            t: 0,
                            dur: 0.08 + Math.random() * 0.05,
                            color: sparkColors[(Math.random() * sparkColors.length) | 0],
                            size: 0.6 + Math.random() * 0.3,
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
                    // 🔴 [2026-08-17 修] 目标消失后收势：攻击动画**播完就停在末帧**，
                    //    不再从头无限循环（这就是「像得了羊癫疯」的直接来源）。
                    //    停住这件事由渲染层的 clamp 负责，这里照常推进 ph（见上「职责划分」），
                    //    ph 继续涨，装填完那一刻若还没敌人就正好接上待命帧循环。
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
            // 🔴 [2026-08-17 修] 只有走路（st=0）在循环尾部推进 ph。攻击（st=1/2）的 ph 已在
            //    攻击分支（animDur 速度，见上「攻击动画推进」）或收势分支（foe 消失 lock>0）推进过——
            //    这里再推一次 = 双重推进，攻击动画快近一倍，箭射出的相位和拉弓动作脱节（「远程动作和箭不同步」根因）。
            if (m.st === 0) m.ph += dt * 8;
        }

        // 围殴计数结转：本帧数到的攻击者数留给下一帧用（同帧边遍历边结算，只能数到一半）
        for (const m of this.men) { m.atkers = m.atkNext; m.atkNext = 0; }

        this.separate(dt);
        // 边界收口：追目标/风筝/推挤都可能把兵推出屏幕，统一 clamp 回场内（见 fieldBound）
        for (const m of this.men) { [m.x, m.y] = this.fieldBound(m.x, m.y); }
        // 🔴 [2026-08-17] 结算「这一帧到底挪了没有」——推挤和边界都收口之后才算得准。
        //    想走却被前面的人堵住时位移≈0，此时再播移动帧就是**原地迈腿**（主人实锤）。
        //    这里只记录，渲染层据此改播待命帧；用累计时间而不是单帧，避免在走/停边界上每帧切动画。
        for (const m of this.men) {
            const dx = m.x - m.prevX, dy = m.y - m.prevY;
            const want = (this.statsFor(m.key, m.f).spd || 0) * dt;
            // 实际位移不到「想走的距离」的四分之一 = 基本没挪动
            if (m.st === 0 && want > 0 && (dx * dx + dy * dy) < (want * 0.25) ** 2) m.stuckT += dt;
            else m.stuckT = 0;
            m.prevX = m.x; m.prevY = m.y;
        }
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
        for (const s of this.slashes) s.t += dt;
        this.slashes = this.slashes.filter(s => s.t < s.dur);
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
                const w = (c.img?.naturalWidth ?? 600) * c.scale;
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
        for (const s of this.spawns) alive[s.f] += Math.max(0, s.pool) * s.pop;
        for (const m of this.men) if (m.hp > 0) alive[m.f] += m.pop;
        if (alive[0] <= 0 || alive[1] <= 0) {
            this.over = true;
            const attackerLost = alive[0] <= 0;
            // [2026-08-11 诊断] 主人报「兵没死光就结束」。这条日志证明是不是演出自己判的：
            // 若这条没打、场景却退了，说明是外部路径（自愈 exit / 引擎结算）提前收的场。
            // 🔴 用 console.warn 不用 gameLog：gameLog 要频道开启才打印，上一版诊断因此一条没出来
            console.warn(`🏁 [Scene13War] 演出判负：攻方余 ${alive[0]} 守方余 ${alive[1]} 精灵（1精灵=10兵）`);
            this.diagPush('decision', { winner: attackerLost ? 'defender' : 'attacker', alive });
            this.diagFlush('decision');
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
        // 死人打点：唯一的死亡入口，卡死检测（NO_KILL_SEC）就靠它。留尸/溃逃两条路都要记。
        this.lastKillSec = this.battleSec;
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
        // 🔴 [2026-08-17 修·根治「加载什么都会卡一下」] 这道等素材的闸**只在开战前**有效。
        //    开战后再有任何素材没就绪，都不许冻结整场：`return` 掉的是 step + render，
        //    也就是全场静止一下 —— 主人反复报的「刚一交战卡一下」「打到一半卡一下」都是它。
        //    开战后缺图不影响推演：抛射物渲染本来就是「img 未就绪跳过不画」，顶多少画几支箭。
        //    （这一版还顺手把抛射物挪到开场预载了，正常已经不会走到这条；留着是防下一次有人再加懒加载。）
        if (this.pending > 0 && !this.assetsReadyOnce) {
            // 🔴 [2026-08-11 实锤] 素材 pending 卡死 = 演出冻结 + 引擎冻结（scene13Frozen）
            //    → 跟随军团永远不动、战斗面板数字不动（主人截图实锤）。
            //    素材若 30 秒内没加载完（404/跨域/异常），强制判负退出，绝不永冻：
            //    按当前兵力比判（池+场上），守方（f=1）吃 0.85 城防/主场折扣。
            if (this.pendingStartedAt === 0) this.pendingStartedAt = performance.now();
            if (performance.now() - this.pendingStartedAt > 30000) {
                console.warn(`🏁 [Scene13War] 素材 30s 未就绪（pending=${this.pending}），强制判负防死锁`);
                this.diagPush('assetTimeout', { pending: this.pending });
                this.forceResultByRatio(0.85);
            }
            return;
        }
        // 🔴 [2026-08-17 修·「打到一半突然卡一下就退场」] 计时器必须在素材就绪时归零。
        //    原来只在 start() 里置 0，于是它记的是**开战时刻**而不是「本次卡住的时刻」：
        //      t=0 首批素材加载 → pendingStartedAt=t0；t≈2.4s 全部就绪（pending=0）但计时器不清；
        //      战斗打到 30s 后，任何一次**中途懒加载**（ensureProj 首次放某种抛射物 / ensureType 新兵种）
        //      把 pending 抬回 1 → 上面那段立刻算出「已卡 30 秒」→ 当场强制判负退场。
        //    实测证据 scratch/scene13_probe_log.jsonl（2026-08-17T07:57Z 那条，主人当场报「卡顿退出」）：
        //      assetsReady 在 2.42s，assetTimeout 在 30.2s 且 pending 只有 1，
        //      双方场上还各有 291/288 精灵、池里还有 1050/1203 —— 图其实是秒回的，纯属计时器记错了起点。
        //    归零后：30 秒只用来兜「这一次真的卡住不动」，正常懒加载几毫秒就过去，不再误杀。
        this.pendingStartedAt = 0;
        // 首批素材齐了 → 从此这场仗不再为任何素材停下（见上面那道闸）
        if (this.pending <= 0) this.assetsReadyOnce = true;
        if (!this.diagAssetsReady) {   // 素材就绪的那一刻打点（诊断用，见 diagPush）
            this.diagAssetsReady = true;
            this.diagPush('assetsReady');
        }
        const now = performance.now();
        // [性能探针 2026-08-18] step/render 分开计时，落盘时随诊断一起发（DEV 才采）
        if (import.meta.env.DEV) {
            const t0 = performance.now();
            this.step(dt);
            const t1 = performance.now();
            this.render();
            const t2 = performance.now();
            this.perfStep.push(t1 - t0);
            this.perfRender.push(t2 - t1);
            this.perfFrames++;
            if (this.perfStep.length > 1800) { this.perfStep.shift(); this.perfRender.shift(); }
        } else {
            this.step(dt);
            this.render();
        }
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
    /** 采样统计：返回 {n, avg, p50, p95, max}，全部保留两位 */
    private perfStat(a: number[]): Record<string, number> | null {
        if (!a.length) return null;
        const s = [...a].sort((x, y) => x - y);
        const sum = a.reduce((p, c) => p + c, 0);
        const q = (f: number) => +s[Math.min(s.length - 1, Math.floor(s.length * f))].toFixed(2);
        return { n: a.length, avg: +(sum / a.length).toFixed(2), p50: q(0.5), p95: q(0.95), max: +s[s.length - 1].toFixed(2) };
    }

    private render(): void {
        const ctx = this.ctx, cv = this.canvas;
        if (!ctx || !cv) return;
        ctx.clearRect(0, 0, cv.width, cv.height);

        const vis: { y: number; x: number; f: number; key: string; dir: number; set: string; fr: number; a: number; st?: number }[] = [];
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
            // 🔴 [2026-08-17] 站着不动的兵播待命帧（远程让位、被挤住、走不动，全算在内）。
            //    **按结果判不按原因判**：不管挡路判定有没有漏网、不管近战远程，
            //    只要连着 STUCK_IDLE_SEC 没挪窝就别迈腿；一旦真的挪起来，当帧就切回走路。
            else if (m.stuckT > STUCK_IDLE_SEC && this.bank[m.key]?.sets.idle?.[0]?.length) {
                set = 'idle';
            }
            else if (m.st === 0) {
                const odd = Math.floor(m.ph / CHARGE_CYCLE) % 2 === 1;
                set = (hasChg && odd) ? 'charge' : 'move';
            }
            // 🔴 [2026-08-17] 攻击动作播完、还在等装填 → 回待命姿势，别定格在最后一帧。
            //    DE 的做法就是这样：攻击动画只播一遍，播完回 idle 站姿，装填走它自己的计时。
            //    不加这条的话，长装填兵种会**保持挥/举的姿势僵住好几秒**：
            //    动作固定 1.5s 播完，而火炮装填 6.5s（僵 5s）、牵引投石机 11s（僵 9.5s）。
            //    （短装填兵种 reload≈2s 只僵 0.5s，本来就看不出来。）
            //    没有 idle 素材的兵种退回原样定格末帧 —— 绝不退回 move，站着原地迈腿更假。
            else if (m.ph >= 8 && (m.lock ?? 0) > 0 && this.bank[m.key]?.sets.idle?.[0]?.length) {
                set = 'idle';
            }
            else if (m.st === 2) set = 'melee';
            else if (m.atkFlip && hasChg) set = 'charge';
            else set = 'atk';
            const fade = m.fadeT > 0 ? 1 - m.fadeT / (m.fadeMax || FADE_IN) : 1;
            vis.push({ y: m.y, x: m.x, f: m.f, key: m.key, dir: m.dir, set, fr: m.ph, a: fade, st: m.st });
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
                : (v.set === 'move' || v.set === 'idle' || v.st === 0)
                    ? Math.floor(v.fr * n / 8) % n                     // 移动/待命/走路：循环
                    : Math.min(n - 1, Math.floor(v.fr * n / 8));       // 攻击/近战/冲锋：播满停末帧（ph=8 不再溢出回第一帧）
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
        //    以中心为锚点，各自按 c.scale 缩放绘制。
        for (const c of this.clouds) {
            if (!c.img) continue;
            const iw = c.img.naturalWidth * c.scale, ih = c.img.naturalHeight * c.scale;
            if (!iw || !ih) continue;
            ctx.globalAlpha = c.alpha;
            ctx.drawImage(c.img, c.x - iw / 2, c.y - ih / 2, iw, ih);
            ctx.globalAlpha = 1;
        }

        // ── 刀光剑影（轻微半月斩击弧光 & 突刺枪芒，小巧克制）──
        if (this.slashes.length) {
            ctx.save();
            for (const s of this.slashes) {
                const p = Math.min(1, s.t / s.dur);
                const alpha = Math.max(0, 1 - p * p) * 0.85;
                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.angle);
                ctx.globalAlpha = alpha;

                if (s.kind === 'slash') {
                    // 刀剑微弯斩击刀痕（非圆圈，短促贝塞尔弧刃）
                    const len = s.radius * (0.9 + p * 0.2);
                    const h = s.flip ? -2.8 : 2.8;

                    // 外层微光
                    ctx.beginPath();
                    ctx.moveTo(0, -len * 0.5);
                    ctx.quadraticCurveTo(h, 0, 0, len * 0.5);
                    ctx.strokeStyle = s.color;
                    ctx.lineWidth = 1.4 * (1 - p);
                    ctx.lineCap = 'round';
                    ctx.shadowColor = s.color;
                    ctx.shadowBlur = 2;
                    ctx.stroke();

                    // 核心白亮线
                    ctx.beginPath();
                    ctx.moveTo(0, -len * 0.38);
                    ctx.quadraticCurveTo(h * 0.7, 0, 0, len * 0.38);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 0.7 * (1 - p);
                    ctx.stroke();
                } else {
                    // 长枪/矛突刺短芒（沿刺击方向的细直短线）
                    const len = s.radius * (0.8 + p * 0.3);

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(len, 0);
                    ctx.strokeStyle = s.color;
                    ctx.lineWidth = 1.3 * (1 - p);
                    ctx.lineCap = 'round';
                    ctx.shadowColor = '#FFFFFF';
                    ctx.shadowBlur = 2;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(len * 0.75, 0);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 0.6 * (1 - p);
                    ctx.stroke();
                }
                ctx.restore();
            }
            ctx.restore();
        }

        // ── 兵刃交锋火花（微小金属细线）──
        if (this.sparks.length) {
            ctx.save();
            for (const s of this.sparks) {
                const alpha = Math.max(0, 1 - s.t / s.dur) * 0.85;
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = s.color;
                ctx.lineWidth = s.size;
                ctx.lineCap = 'round';

                // 沿速度反方向拉出极短火星尾迹线
                const tailScale = 0.018;
                const tailX = s.x - s.vx * tailScale;
                const tailY = s.y - s.vy * tailScale;

                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();

                // 火星头部微小亮点
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
}
