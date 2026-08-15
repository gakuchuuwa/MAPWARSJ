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
const RANGED_TYPES = new Set(['archer', 'crossbow', 'ballista', 'horse_archer', 'fire_archer', 'kipchak', 'longbowman_elite', 'cav_archer', 'chukonu', 'rattan_archer', 'elite_fire_archer', 'elite_chukonu', 'imperial_skirmisher', 'elite_composite_bowman', 'composite_bowman', 'crossbowman', 'arbalest', 'throwing_axeman', 'arambai', 'mangudai', 'mangudai_elite', 'elite_kipchak', 'pattiyoda_longbowman', 'ballista_elephant', 'elephant_archer', 'rattan_archer_elite']);

// ── 兵种属性 ──
//   三类基准（CLS_STATS）：近战 150/45/55、骑兵 130/45/130、远程 90/28/50 射程160
//   步兵族已差异化（2026-08-13，以轻步 150/45/55 为基准）：
//     重步 158/45/52、近卫 176/42/47、青州 120/58/52、蛮斧 98/70/55、藤甲 168/42/50、象兵 aoe+spd40
//   弓骑 = 骑兵属性 + 远程射击（dmg 15 是平衡值勿改，见 horse_archer 行注释锁死）
interface WarType {
    name: string;
    /** 近战 / 骑兵 / 远程（决定属性组） */
    cls: 'melee' | 'cav' | 'ranged';
    /** 尺寸倍率（象兵大、骑兵略大） */
    sz: number;
    /** 范围伤（象兵） */
    aoe?: boolean;
    /** 放风筝距离（弓骑） */
    kite?: number;
    /**
     * 单项覆盖属性组（目前只有突骑兵用）。
     * 🔴 突骑兵是**骑兵 + 用射的**：血/速走骑兵组，射程/伤害必须走远程组。
     *    只写 cls:'cav' 会让它射程 = 0（65px 贴身），而 kite 是 70 —— 70 > 65，
     *    它一接敌就后撤、退开又够不着，永远在原地抽搐，画面上却在播射击动作。
     *    纯骑三文化（草原/青藏/中亚）后排全是它，必须覆盖。
     */
    rng?: number;
    dmg?: number;
    /** 单项覆盖生命（2026-08-13 步兵族差异化：重甲/藤甲/禁军血厚，青州/蛮族血薄） */
    hp?: number;
    /** 单项覆盖移动速度（重武器用：象兵笨重、床弩拖拽，都比同类慢） */
    spd?: number;
}

const WAR_TYPES: Record<string, WarType> = {
    // ── 近战 8 ──（2026-08-13 步兵族差异化定稿：以轻步 150/45/55 为基准，血厚=防护、攻按武器、速按装备轻重）
    light_infantry: { name: '轻步兵', cls: 'melee', sz: 1 },
    heavy_infantry: { name: '重步兵', cls: 'melee', sz: 1, hp: 158, spd: 52 },         // 重甲：血厚同攻，略慢
    shield:         { name: '近卫兵', cls: 'melee', sz: 1, hp: 176, dmg: 42, spd: 47 },// 禁军：极肉城墙，最慢
    spear:          { name: '青州兵', cls: 'melee', sz: 1, hp: 120, dmg: 58, spd: 52 },// 精锐枪兵：攻高脆
    axe:            { name: '蛮族兵', cls: 'melee', sz: 1, hp: 98, dmg: 70, spd: 55 }, // 蛮族：极攻·脆
    armored:        { name: '藤甲兵', cls: 'melee', sz: 1, hp: 168, dmg: 42, spd: 50 },// 藤甲：肉，藤编轻便
    samurai:        { name: '日本武士', cls: 'melee', sz: 1, hp: 168, dmg: 42, spd: 50 },// AoE2 DE 日本武士，视觉替换藤甲兵，数值不变；sz=1 统一（2026-08-15 日本全决定版）
    samurai_elite:  { name: '精锐武士', cls: 'melee', sz: 1, hp: 168, dmg: 42, spd: 50 },// AoE2 DE 精锐武士，视觉替换藤甲兵，数值不变；sz=1 统一
    elephant:       { name: '象兵',   cls: 'melee', sz: 1.6, aoe: true, spd: 40 },
    // ── 朝鲜全决定版（2026-08-15 主人定：前排刀剑手/中排黑光铠骑兵/后排火焰弓箭手，数值照抄被替换兵种）──
    eastern_swordsman:{ name: '东方剑士', cls: 'melee', sz: 1, hp: 168, dmg: 42, spd: 50 },// 视觉替换藤甲兵（armored），数值不变（中东东方剑士）
    hei_kuang:      { name: '黑光铠骑兵', cls: 'cav', sz: 1 },                             // 视觉替换重骑兵（heavy_cavalry）；帝国决定版兵种 sz 统一=1
    fire_archer:    { name: '火焰弓箭手', cls: 'ranged', sz: 1 },                          // 视觉替换弓兵（archer），数值不变
    // ── 东北全决定版（2026-08-15 主人定：前排铁浮图/中排钦察/后排精锐长弓兵，数值照抄被替换兵种）──
    iron_pagoda:      { name: '铁浮图', cls: 'cav', sz: 1 },                                // 视觉替换重骑兵（heavy_cavalry）；帝国决定版兵种 sz 统一=1
    kipchak:          { name: '钦察', cls: 'cav', sz: 1, kite: 60, rng: 120, dmg: 22 },     // 视觉替换突骑兵（horse_archer），数值不变（弓骑算骑兵+风筝）
    longbowman_elite: { name: '精锐长弓兵', cls: 'ranged', sz: 1 },                         // 视觉替换弓兵（archer），数值不变
    // ── 西域全决定版（2026-08-15 主人定：前排长枪兵/中排骑射手/后排轻骑兵，数值照抄被替换兵种）──
    pikeman:        { name: '长枪兵', cls: 'melee', sz: 1 },                                 // 视觉替换轻步兵（light_infantry），数值不变
    cav_archer:     { name: '骑射手', cls: 'cav', sz: 1, kite: 60, rng: 120, dmg: 22 },      // 视觉替换突骑兵（horse_archer），数值不变（弓骑算骑兵+风筝）
    light_riders:   { name: '轻骑兵', cls: 'cav', sz: 1 },                                   // 视觉替换轻骑兵（lancer）；帝国决定版兵种 sz 统一=1
    // ── 江南全决定版（2026-08-15 主人定：前排刀剑手/中排诸葛弩/后排火焰弓箭手，数值照抄被替换兵种）──
    chukonu:        { name: '诸葛弩', cls: 'ranged', sz: 1 },                                // 视觉替换弩兵（crossbow），数值不变
    // ── 川蜀全决定版（2026-08-15 主人定：前排白毦兵/中排诸葛弩/后排藤弓兵，数值照抄被替换兵种）──
    white_feather_guard: { name: '白毦兵', cls: 'melee', sz: 1 },                            // 视觉替换重步兵（heavy_infantry），数值不变
    rattan_archer:  { name: '藤弓兵', cls: 'ranged', sz: 1 },                                // 视觉替换弩兵（crossbow），数值不变
    // ── 河西全决定版（2026-08-15 主人定：前排精锐火矛手/中排诸葛弩/后排黑光铠骑兵，数值照抄被替换兵种）──
    elite_fire_lancer: { name: '精锐火矛手', cls: 'melee', sz: 1 },                          // 视觉替换青州兵（spear），数值不变
    // ── 江南/川蜀精英版（2026-08-15 主人修订：江南后排精锐火焰弓箭手、川蜀中排精锐诸葛弩）──
    elite_fire_archer: { name: '精锐火焰弓箭手', cls: 'ranged', sz: 1 },                     // 视觉替换火焰弓箭手（fire_archer），数值不变
    elite_chukonu:   { name: '精锐诸葛弩', cls: 'ranged', sz: 1 },                           // 视觉替换诸葛弩（chukonu），数值不变
    // ── 青藏全决定版（2026-08-15 主人定：答剌罕骑兵+精锐答剌罕骑兵，纯骑三角）──
    tarkan:           { name: '答剌罕骑兵', cls: 'cav', sz: 1 },                              // 视觉替换重骑兵（heavy_cavalry），数值不变
    elite_tarkan:     { name: '精锐答剌罕骑兵', cls: 'cav', sz: 1 },                          // 视觉替换突骑兵（horse_archer），数值不变（纯骑，无风筝）
    // ── 西域修订（2026-08-15 主人定：前排精锐近卫军/后排草原枪兵，骑射手不变）──
    elite_guardsman:  { name: '精锐近卫军', cls: 'melee', sz: 1 },                            // 视觉替换长枪兵（pikeman），数值不变
    steppe_lancer:    { name: '草原枪兵', cls: 'cav', sz: 1 },                                // 视觉替换轻骑兵（light_riders），数值不变
    // ── 日本修订（2026-08-15 主人定：后排步弓手→忍者）──
    ninja:            { name: '忍者', cls: 'melee', sz: 1 },                                  // 视觉替换步弓手（archer），数值不变（近战步兵）
    // ── 剩余 10 文化全决定版（2026-08-15 主人定：北方/中原/岭南/滇缅/草原/中亚/西亚/斯拉夫/日耳曼/拉丁，数值照抄被替换兵种）──
    liao_dao:           { name: '辽刀', cls: 'melee', sz: 1 },                                // 视觉替换青州兵（spear），数值不变
    fire_lancer:        { name: '火矛兵', cls: 'melee', sz: 1 },                              // 视觉替换轻步兵（light_infantry），数值不变
    swordsman:          { name: '剑士', cls: 'melee', sz: 1 },                                // 视觉替换火矛兵（fire_lancer），数值不变（中原前排，AoE2 剑士）
    kamayuk:            { name: '印加枪兵长', cls: 'melee', sz: 1 },                          // 视觉替换火矛兵（fire_lancer），数值不变（北方后排，AoE2 印加枪兵长）
    xianbei_raider:     { name: '鲜卑掠骑兵', cls: 'cav', sz: 1 },                            // 视觉替换重骑兵（heavy_cavalry），数值不变
    tiger_rider:        { name: '虎豹骑', cls: 'cav', sz: 1 },                                // 视觉替换重骑兵（heavy_cavalry），数值不变
    jian_swordsman:     { name: '刀剑手', cls: 'melee', sz: 1, hp: 168, dmg: 42, spd: 50 },   // 视觉替换藤甲兵（armored），数值不变（吴国刀剑手）
    imperial_skirmisher:{ name: '帝王掷矛手', cls: 'ranged', sz: 1 },                         // 视觉替换弩兵（crossbow），数值不变
    war_elephant:       { name: '象兵', cls: 'melee', sz: 1, aoe: true, spd: 40 },            // 视觉替换象兵（elephant），数值不变（DE 素材自带尺寸）
    karambit_warrior:   { name: '爪刀勇士', cls: 'melee', sz: 1 },                            // 视觉替换藤甲兵（armored），数值不变
    karambit_warrior_elite: { name: '精锐爪刀勇士', cls: 'melee', sz: 1 },                   // 视觉替换爪刀勇士（karambit_warrior），数值不变
    arambai:            { name: '飞镖骑兵', cls: 'cav', sz: 1, kite: 60, rng: 120, dmg: 22 }, // 视觉替换突骑兵（horse_archer），数值不变（弓骑）
    mangudai:           { name: '蒙古突骑', cls: 'cav', sz: 1, kite: 60, rng: 120, dmg: 22 }, // 视觉替换突骑兵（horse_archer），数值不变（弓骑）
    keshik:             { name: '怯薛军', cls: 'cav', sz: 1 },                                // 视觉替换重骑兵（heavy_cavalry），数值不变
    boyar:              { name: '贵族铁骑', cls: 'cav', sz: 1 },                              // 视觉替换重骑兵（heavy_cavalry），数值不变
    elite_kipchak:      { name: '精锐钦察', cls: 'cav', sz: 1, kite: 60, rng: 120, dmg: 22 },// 视觉替换突骑兵（horse_archer），数值不变（弓骑）
    elite_composite_bowman: { name: '精锐复合弓箭手', cls: 'ranged', sz: 1 },                // 视觉替换弓兵（archer），数值不变
    camel_heavy:        { name: '重装骆驼兵', cls: 'cav', sz: 1 },                            // 视觉替换重骑兵（heavy_cavalry），数值不变
    composite_bowman:   { name: '复合弓箭手', cls: 'ranged', sz: 1 },                         // 视觉替换弓兵（archer），数值不变
    elite_steppe_lancer:{ name: '精锐草原枪兵', cls: 'cav', sz: 1 },                          // 视觉替换重骑兵（heavy_cavalry），数值不变
    throwing_axeman:    { name: '掷斧兵', cls: 'ranged', sz: 1 },                             // 视觉替换弓兵（archer），数值不变（远程掷斧）
    champion:           { name: '冠军剑士', cls: 'melee', sz: 1 },                            // 视觉替换重步兵（heavy_infantry），数值不变
    crossbowman:        { name: '弩手', cls: 'ranged', sz: 1 },                               // 视觉替换弩兵（crossbow），数值不变
    paladin:            { name: '游侠', cls: 'cav', sz: 1 },                                  // 视觉替换重骑兵（heavy_cavalry），数值不变
    coustillier:        { name: '马上轻装兵', cls: 'cav', sz: 1 },                            // 视觉替换轻骑兵（lancer），数值不变
    heavy_pikeman:      { name: '重装长枪兵', cls: 'melee', sz: 1 },                          // 视觉替换青州兵（spear），数值不变
    arbalest:           { name: '劲弩手', cls: 'ranged', sz: 1 },                             // 视觉替换弩兵（crossbow），数值不变
    // ── 阵型重构新增（2026-08-15 主人定：鱼鳞/三角/雁行三阵型，新兵种数值照抄被替换兵种）──
    hei_kuang_heavy:      { name: '精锐黑光铠骑兵', cls: 'cav', sz: 1 },                      // 视觉替换黑光铠骑兵（hei_kuang），数值不变
    mangudai_elite:       { name: '精锐蒙古突骑', cls: 'cav', sz: 1, kite: 60, rng: 120, dmg: 22 },// 视觉替换蒙古突骑（mangudai），数值不变（弓骑）
    pattiyoda_longbowman: { name: '帕提尤达长弓手', cls: 'ranged', sz: 1 },                   // 视觉替换精锐长弓兵（longbowman_elite），数值不变
    armored_elephant:     { name: '皮甲战象', cls: 'melee', sz: 1, aoe: true, spd: 40 },      // 视觉替换象兵（war_elephant），数值不变（DE 素材自带尺寸）
    ballista_elephant:    { name: '重弩战象', cls: 'ranged', sz: 1, spd: 40 },                // 视觉替换弩兵（crossbow），数值不变（象背远程，慢）
    elephant_archer:      { name: '骑象射手', cls: 'ranged', sz: 1, spd: 40 },                // 视觉替换弓兵（archer），数值不变（象背远程，慢）
    rattan_archer_elite:  { name: '精锐藤弓兵', cls: 'ranged', sz: 1 },                       // 视觉替换藤弓兵（rattan_archer），数值不变
    legionary:            { name: '罗马军', cls: 'melee', sz: 1 },                            // 视觉替换掷斧兵（throwing_axeman），数值不变（近战步兵）
    // ── 骑兵 4 ──（突骑 = 骑兵属性 + 远程射击 + 放风筝）
    lancer:         { name: '轻骑兵', cls: 'cav', sz: 1.15 },
    heavy_cavalry:  { name: '重骑兵', cls: 'cav', sz: 1.15 },
    general_cavalry:{ name: '虎豹骑', cls: 'cav', sz: 1.15 },
    // 🔴🔴 弓骑算骑兵（2026-08-14 主人定稿）：克制关系统一按骑兵（骑克步/被弓克），不再「射人算远程」。
    //    dmg 15→22、rng 160→120（war_sim 实测，3 万兵、种子 7/11/23）：
    //      弓骑克步兵 = 骑克步 ×1.8 + 风筝 → 克制方损失 25.8%（比纯骑兵 32% 更碾压，风筝天然优势）；
    //      弓兵克弓骑 = 弓克骑 ×1.8，rng 120 < 弓兵 160 先手 → 克制方损失 30.1%（对齐基准 31%）。
    //    dmg 22 = 远程 20 + 2（骑射略强于步射）；rng 120 = 弓兵 160 − 40（马背射程短于步弓）。
    // 🔴 kite 100→60（2026-08-13 修「纯突骑守军风筝无解」）：60 < 接战距离 65 = 被贴脸不能再后撤。
    horse_archer:   { name: '突骑兵', cls: 'cav', sz: 1.15, kite: 60, rng: 120, dmg: 22 },
    // ── 远程 5 ──
    archer:         { name: '弓兵',   cls: 'ranged', sz: 1 },
    crossbow:       { name: '弩兵',   cls: 'ranged', sz: 1 },
    ballista:       { name: '元戎弩', cls: 'ranged', sz: 1, spd: 35 },
};

/** 属性组（2026-08-14 主人定稿：弓克骑/骑克步/步克弓 三边均衡重算——骑兵 dmg 45→32、远程 dmg 28→20） */
const CLS_STATS = {
    melee:  { hp: 150, dmg: 45, spd: 55, rng: 0 },
    cav:    { hp: 130, dmg: 32, spd: 130, rng: 0 },
    ranged: { hp: 90,  dmg: 20, spd: 50, rng: 160 },
} as const;

/** 取某兵种的四个数：先按类取组，再套单项覆盖（突骑兵的射程/伤害走远程组） */
function statsOf(key: string): { hp: number; dmg: number; spd: number; rng: number } {
    const wt = WAR_TYPES[key] ?? WAR_TYPES.light_infantry;
    const base = CLS_STATS[wt.cls];
    return { hp: wt.hp ?? base.hp, spd: wt.spd ?? base.spd, dmg: wt.dmg ?? base.dmg, rng: wt.rng ?? base.rng };
}

/** 三阵型 9 口布局查找表（row 0 最靠中线；idx = 出兵口展开序）：
 *  square 鱼鳞 3×3 = 五通道（前中步3 / 上翼骑·中军·下翼骑 / 后中弓3）
 *  triangle 三角 2+3+4 = 尖刀2 / 中坚3 / 后4（近战尖刀前、弓骑后）
 *  echelon 雁行 4+3+2 = 前4 / 中3 / 后2（近战顶前、远程后） */
const LAYOUT: Record<FormationMode, { col: number; row: number; cols: number }[]> = {
    square: [
        { col: 1, row: 0, cols: 5 }, { col: 2, row: 0, cols: 5 }, { col: 3, row: 0, cols: 5 },
        { col: 0, row: 1, cols: 5 }, { col: 2, row: 1, cols: 5 }, { col: 4, row: 1, cols: 5 },
        { col: 1, row: 2, cols: 5 }, { col: 2, row: 2, cols: 5 }, { col: 3, row: 2, cols: 5 },
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
const DE_DYN_DIRS = ['/SUCAI/ARCHER/', '/SUCAI/SAMURAI_ELITE/', '/SUCAI/SAMURAI_DE/', '/SUCAI/FIRE_ARCHER/', '/SUCAI/HEI_KUANG/', '/SUCAI/EASTERN_SWORDSMAN/', '/SUCAI/IRON_PAGODA/', '/SUCAI/KIPCHAK/', '/SUCAI/LONGBOWMAN_ELITE/', '/SUCAI/PIKEMAN/', '/SUCAI/CAV_ARCHER/', '/SUCAI/LIGHT_RIDERS/', '/SUCAI/CHUKONU/', '/SUCAI/WHITE_FEATHER_GUARD/', '/SUCAI/RATTAN_ARCHER/', '/SUCAI/ELITE_FIRE_LANCER/', '/SUCAI/ELITE_FIRE_ARCHER/', '/SUCAI/ELITE_CHUKONU/', '/SUCAI/TARKAN/', '/SUCAI/ELITE_TARKAN/', '/SUCAI/ELITE_GUARDSMAN/', '/SUCAI/STEPPE_LANCER/', '/SUCAI/NINJA/', '/SUCAI/LIAO_DAO/', '/SUCAI/FIRE_LANCER/', '/SUCAI/XIANBEI_RAIDER/', '/SUCAI/TIGER_RIDER/', '/SUCAI/JIAN_SWORDSMAN/', '/SUCAI/IMPERIAL_SKIRMISHER/', '/SUCAI/WAR_ELEPHANT/', '/SUCAI/KARAMBIT_WARRIOR/', '/SUCAI/ARAMBAI/', '/SUCAI/MANGUDAI/', '/SUCAI/KESHIK/', '/SUCAI/BOYAR/', '/SUCAI/ELITE_KIPCHAK/', '/SUCAI/ELITE_COMPOSITE_BOWMAN/', '/SUCAI/CAMEL_HEAVY/', '/SUCAI/COMPOSITE_BOWMAN/', '/SUCAI/ELITE_STEPPE_LANCER/', '/SUCAI/THROWING_AXEMAN/', '/SUCAI/CHAMPION/', '/SUCAI/CROSSBOWMAN/', '/SUCAI/PALADIN/', '/SUCAI/COUSTILLIER/', '/SUCAI/HEAVY_PIKEMAN/', '/SUCAI/ARBALEST/', '/SUCAI/HEI_KUANG_HEAVY/', '/SUCAI/MANGUDAI_ELITE/', '/SUCAI/PATTIYODA_LONGBOWMAN/', '/SUCAI/ARMORED_ELEPHANT/', '/SUCAI/BALLISTA_ELEPHANT/', '/SUCAI/ELEPHANT_ARCHER/', '/SUCAI/RATTAN_ARCHER_ELITE/', '/SUCAI/LEGIONARY/', '/SUCAI/SWORDSMAN/', '/SUCAI/KAMAYUK/', '/SUCAI/KARAMBIT_WARRIOR_ELITE/'];

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
 * 克制系数 C（2026-08-13 主人定稿方向，一个数调全三角松紧）。
 * 相克表（循环：弓克骑 → 骑克步 → 步克弓）：
 *   我克你 = ×C，你克我 = ÷C（=×1/C）。**机制对称，但结果强度不对称**——见下方判据。
 *
 * ─────────────── 调相克前必读：判据与读法（2026-08-12 CC/DS/ANTI 三方复核定） ───────────────
 *
 * ① **边强度闭式**。设 X 克 Y，边强度 = 双方击杀时间之比：
 *        TTK_X = hp_Y / (dmg_X × C)      TTK_Y = hp_X × C / dmg_Y
 *        边强度 = TTK_Y / TTK_X = C² × (dmg_X × hp_X) / (dmg_Y × hp_Y)
 *    决定边强度的是 **dmg × hp 这个乘积**（下称战力积 P），不是 dmg 单项。
 *
 * ② **三条边强度相乘恒等于 C⁶**（P 全约掉）→ 推论：
 *    **三条边强度完全相等 ⟺ 三类的 dmg × hp 相等。**
 *    所以「机制对称」不等于「结果对称」。08-11 注释里那句"三条边强度完全一样"，
 *    成立的只有机制那一半；只要三类基数不同，结果就必然悬殊，这是数学必然不是实现错。
 *    ⚠️ 别再把「三条边数值相等」当目标去追：要三边都落进 2~4 倍，P_ranged 必须 ∈ [4738, 8333]，
 *       即 hp70→dmg 要 68+，或 dmg15→hp 要 316+，折中解 dmg30/hp160 比近战还肉。
 *       **「三边数值拉平」和「远程是脆皮」不可兼得**，正确目标是「每条边都克得动、没有反向边」。
 *
 * ③ **读模拟输出要看「胜方损失」，不要看「余兵」**。三条边打到最后都是全歼（兰彻斯特雪球：
 *    赢方死得少→人更多→死得更少），所以"谁赢"没有信息量。2026-08-12 实测（war_sim.mjs，
 *    每方 3000 精灵）：余兵 26380/23680/22130，离散度只有 1.19 倍；换成损失
 *    3620/6320/7870，离散度 2.17 倍，且与闭式排序一致。
 *    ⚠️ 闭式能预测**排序**，预测不了**幅度**（最弱那条边会因为打得久、雪球跑满而被压缩：
 *       实测 2.17 倍 vs 闭式 6.20 倍）。**闭式筛方向，模拟定数值，两步都不能省。**
 *
 * ④ **镜像脚本 scratch/*.mts + war_sim.mjs 不含游戏层的放大器**（gangMul 围殴加成）。
 *    所以镜像结论**偏保守**：三边相对关系可信，绝对强度必须实机看。
 *    曾有人把镜像里的全歼归因为围殴加成——镜像里根本没有那东西。
 *
 * ⑤ **两病分治**：远程太强 → 动远程数值；整体太一边倒 → 动 GANG_K（全局放大器，三条边同时受影响）。
 *    别混着调，否则分不清是哪个在起作用。
 * ──────────────────────────────────────────────────────────────────────────
 *
 * 🔴 C 的取值是模拟实测定的：1.25/1.5 时「步克弓」不成立（近战血厚、远程射程先手，见下）；
 *    C=1.8 是成立的最小值（8 局换边实测：弓克骑 100%、骑克步 100%、步克弓 100%）。
 *    C=1.8 → 每条边约 1.8 倍差距，符合主人「相克不要太大」。
 *    [2026-08-12] 远程 15/70 → 28/90（修「弓克骑」断边，见 CLS_STATS）：1v1 白嫖 1.4~1.9s 后
 *    肉搏 50.4 DPS 打骑兵、骑兵 25 DPS 打 90 血 —— 远程实战胜（剩 ~50 血）。C 不动。
 *    ⚠️ [2026-08-13 方向反转] 上述 1.8 论证基于旧方向（近→骑→远），反转后四维重算中。
 */
const COUNTER_C = 1.8;
/** 循环克制表：我克谁。ranged→cav（弓克骑）、cav→melee（骑克步）、melee→ranged（步克弓）——2026-08-13 主人定稿方向 */
const COUNTERS: Record<string, string> = { ranged: 'cav', cav: 'melee', melee: 'ranged' };
/** 攻击方 cls + 目标 cls → 伤害系数（对称：我克你 ×C / 你克我 ÷C / 无关 ×1） */
function counterMul(shooterCls: string | undefined, targetCls: string | undefined): number {
    if (!shooterCls || !targetCls || shooterCls === targetCls) return 1;
    if (COUNTERS[shooterCls] === targetCls) return COUNTER_C;          // 我克你
    if (COUNTERS[targetCls] === shooterCls) return 1 / COUNTER_C;      // 你克我
    return 1;
}
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
 * 箭矢笔画缩放：大地图在 zoom≥10 用 currentScale=1.4、单兵 138px；
 * 我们单兵 50px，按比例 50/138×1.4 ≈ 0.5 太细，取 0.7 让箭看得清。
 */
const ARROW_SCALE = 0.7;
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
 * 没被留下的那 70% 尸体的渐隐时长（秒，主人 2026-08-12「其他尸体消失的时候可以渐隐吗」
 * → 同日「1 秒不行，怎么也 5 秒，或者 10 秒」：1.0 → 5.0）。
 * 🔴 修前它们在死亡动画播完那一帧**直接凭空消失**，满地尸体一具具「啪」地不见，很跳。
 *    现在多活这么久，停在死亡末帧上把透明度拉到 0。留下的那 30% 不走这条路——
 *    它们烙进地面图后就不再逐帧重画了，本来就没有消失这回事。
 * ⚠️ 这个数和 CORPSE_KEEP=0.3 是一对矛盾：当初砍到 30% 就是嫌尸体堆叠盖住活人，
 *    而渐隐拉长又把那 70% 的可见时间加回来了。调大之前先想清楚要的是哪一头。
 *    性能不是约束：实测阵亡速率约 35 精灵/秒，×70%×5s ≈ 同屏多 120 具，
 *    离 drawImage 4000 次/帧的墙还很远，10 秒也只有约 240 具。
 */
const CORPSE_FADE = 5.0;
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
/** 两翼抄后：绕到敌军重心后方多少 px（攻方在左则 +，守方在右则 -，见 aimAt） */
const WING_BACK = 240;
/** 两翼抄后：翼侧偏移多少 px（上翼 -，下翼 +） */
const WING_SIDE = 330;
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
    /** 两翼标记：0=中央，1=上翼，-1=下翼（两翼兵抄后绕行用） */
    wing: number;
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
    /** 两翼标记：0=中央，1=上翼，-1=下翼（继承自出兵口，aimAt 抄后绕行用） */
    wing: number;
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
     * 死亡动画播完时由累加器裁定：true = 烙进地面永久保留，false = 渐隐消失。
     * undefined = 还在播死亡动画，尚未裁定。见 CORPSE_KEEP / CORPSE_FADE。
     */
    keep?: boolean;
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
        this.arrows = [];
        this.fallenFlags = [];
        this.trees = [];
        this.lakes = [];
        this.clouds = [];
        this.clearGround();
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
                // 🔴 排级随机互换（主人 2026-08-13 定）：步/骑/弩三类在「前后中」三排随机换序，
                //    双方独立随机。横向 col 结构不变（三阵型各按 LAYOUT 查找表），
                //    只换「哪类兵在哪排」——前排可能变骑兵（中央突破）或弩兵（克制循环制衡）。
                const lanes2 = this.shuffleRows(lanes, mode);
                // 兵力按总量平分到各口（1 精灵 = SPRITE_TROOPS 兵；口少的一边每口出得快）
                const poolPer = Math.max(1, Math.round(side.troops / SPRITE_TROOPS / n));
                lanes2.forEach((lane, idx) => {
                    const key = lane.key;
                    this.ensureType(key);
                    // 布局：row 0 最靠中线（越靠前越深入敌阵）；三阵型 9 口走 LAYOUT 查找表
                    const cell = LAYOUT[mode][idx];
                    const back = mx + (2 - cell.row) * depth;
                    const x = side.f === 0 ? back : VW - back;
                    // 5 通道间距 spanY/5；三角/雁行保持原型 spanY/3
                    const y = midY + (cell.col - (cell.cols - 1) / 2) * (spanY / (cell.cols === 5 ? 5 : 3));
                    this.spawns.push({
                        f: side.f, key, x, y,
                        pool: poolPer,
                        spawned: 0,
                        wing: mode === 'square' ? (cell.col === 0 ? 1 : cell.col === 4 ? -1 : 0) : 0,
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
        // 尸体照常渐隐，别在残局里僵住
        for (const c of this.corpses) c.t += dt;
        this.corpses = this.corpses.filter(c => c.keep !== true && c.t < DEATH_ANIM + CORPSE_FADE);
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

    /**
     * 排级洗牌（主人 2026-08-13 定）：把出兵口按「排」分组随机换纵深顺序。
     *   - square 9 口 = 前3 / 中3 / 后3 三组随机换序
     *   - triangle 9 口 = 尖刀2 / 中坚3 / 后4 三组随机换序
     *   - echelon 9 口 = 前4 / 中3 / 后2 三组随机换序
     *   横向 col 结构不变（LAYOUT 查找表按 idx 固定），只换「哪类兵在哪排」。
     */
    private shuffleRows(lanes: { key: string }[], mode: FormationMode): { key: string }[] {
        const groups = mode === 'triangle'
            ? [lanes.slice(0, 2), lanes.slice(2, 5), lanes.slice(5, 9)]
            : mode === 'echelon'
              ? [lanes.slice(0, 4), lanes.slice(4, 7), lanes.slice(7, 9)]
              : [lanes.slice(0, 3), lanes.slice(3, 6), lanes.slice(6, 9)];
        for (let i = groups.length - 1; i > 0; i--) {
            const j = (Math.random() * (i + 1)) | 0;
            [groups[i], groups[j]] = [groups[j], groups[i]];
        }
        return groups.flat();
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
                            const base = this.dechroma(im);
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
                            clean.src = base.toDataURL();
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
                    atkers: 0, atkNext: 0, fadeT: FADE_IN,
                    wing: s.wing,
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
     * 🔴 克制系数必须**逐个受害者**算，不能拿主目标那一个套全场：
     *    象兵打一群混编敌人时，主目标是远程（象兵吃 ÷C）、旁边的骑兵本该被 ×C 打，
     *    用同一个系数就差了 C² ≈ 3.2 倍（2026-08-11 复查 DS 实现时抓到）。
     * @param dmg 已含总加成、**不含**克制系数
     */
    private splash(m: WarMan, radius: number, dmg: number, shooterCls: string): void {
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
                    o.atkNext++;
                    o.hp -= dmg * counterMul(shooterCls, WAR_TYPES[o.key]?.cls) * gangMul(o);
                    if (o.hp <= 0) this.corpses.push({ x: o.x, y: o.y, f: o.f, key: o.key, dir: o.dir, t: 0 });
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
        // 两翼兵（上翼/下翼）：绕到敌军侧后包抄，不是朝最近敌兵/敌口走。
        if (m.wing !== 0) {
            const cen = this.enemyCen[1 - m.f];
            if (cen) {
                // 🔴 两翼包抄（2026-08-13 立，2026-08-14 修成两段式）：
                //    绕后点 = 重心 + 固定偏移（√240²+330²≈408px）。骑兵先绕到敌军侧后，
                //    一进包抄圈（离重心 ≤408px）就直扑重心 → 「绕后 → 夹击中间」的钳形。
                //    ⚠️ 不能用「偏移 × 收敛系数」：目标点到重心距离 = 408 × converge，
                //    而 converge 被 min(1,…) 钳住——只要 dist ≥ reach 就恒为 1，目标恒是固定 408px 空地，
                //    骑兵绕到侧后即停死，永远打不到中间（08-14 线性/平方两版均实测卡死在 408px）。
                //    两段式保证骑兵持续向内收拢，最终贴脸接敌。禁止改回收敛系数版。
                const dx = cen.x - m.x, dy = cen.y - m.y;
                const dist = Math.hypot(dx, dy) || 1;
                const reach = Math.hypot(WING_BACK, WING_SIDE);   // 包抄圈半径（≈408px）
                if (dist > reach) {
                    const backX = (m.f === 0 ? WING_BACK : -WING_BACK);   // 攻方绕守方右后，守方绕攻方左后
                    const sideY = (m.wing > 0 ? -WING_SIDE : WING_SIDE);  // 上翼绕上、下翼绕下
                    return { x: cen.x + backX, y: cen.y + sideY };
                }
                return cen;   // 进了包抄圈 → 直扑重心，与中央敌军接战
            }
            return null;
        }
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
     * 🔴 2026-08-13 修「寻敌走出屏幕」：三处移动原本都不 clamp，两翼包抄点（敌军重心 + 固定
     *    偏移 WING_BACK/WING_SIDE）常在屏外，骑兵一路走出去。统一在此收口，margin = 半身 UNIT_PX/2。
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
        // 敌军重心（每帧 O(n)，供 aimAt 兜底）
        const cx = [0, 0], cy = [0, 0], cn = [0, 0];
        for (const m of this.men) { cx[m.f] += m.x; cy[m.f] += m.y; cn[m.f]++; }
        this.enemyCen = [0, 1].map(f => cn[f] ? { x: cx[f] / cn[f], y: cy[f] / cn[f] } : null);

        this.rebuild();
        for (const m of this.men) {
            if (m.hp <= 0) continue;
            const wt = WAR_TYPES[m.key];
            const stats = statsOf(m.key);
            const R = stats.rng || 65;

            // 目标每 0.2s 重找（错开相位）；目标死/跑远保持不换
            m.next -= dt;
            const keep = m.foe && m.foe.hp > 0
                && (m.foe.x - m.x) ** 2 + (m.foe.y - m.y) ** 2 < R * R * 1.44;
            if (!keep && m.next <= 0) {
                m.foe = this.search(m, R);
                // 没在打架就重新瞄一个敌人走过去。
                // 🔴 0.5s 一次，比打架索敌（0.2s）慢一档：它扫的格子多得多，
                //    半径 700 + 0.2s 实测 21ms/帧（超 60fps 预算），收到 300 + 0.5s 才回到 2ms。
                if (!m.foe) {
                    m.aimT = (m.aimT ?? 0) - 0.2;
                    if (m.aimT <= 0) {
                        const aim = this.aimAt(m);
                        if (aim) { [m.tx, m.ty] = this.fieldBound(aim.x, aim.y); }
                        m.aimT = 0.5;
                    }
                }
                m.next = 0.2;
            } else if (!keep) m.foe = null;

            const foe = m.foe;
            if (foe) {
                m.fightT = (m.fightT || 0) + dt;
                // 缠斗 4 秒脱离、脱离后 2 秒不重新缠斗（2026-08-11 实测定档，改回原值）。
                // 🔴 我一度改成 1.5s/3s 想让尸体铺得更开，结果**闪动是这么来的**：
                //    起停频率高了 2.7 倍，兵在「打」和「走」之间来回跳（主人实锤「闪动、颤抖」）。
                //    实测两档在真实对局（近战 vs 骑兵）里铺开度几乎一样（855px vs 954px），
                //    但 4s/2s 的打走切换 1.01 次/人·秒、原地打转 1.3%，都是最低的一档 —— 改回来。
                //    （当初测出 1.5s 更开，是拿同族对镜测的；那种势均局战线本来就不动，不代表实战。）
                if (m.fightT > 4) { m.foe = null; m.fightT = 0; m.next = 2; m.lock = 0; }
                const close = (foe.x - m.x) ** 2 + (foe.y - m.y) ** 2 < 65 * 65;
                m.st = (stats.rng && close && this.bank[m.key]?.sets.melee[0].length) ? 2 : 1;
                m.dir = this.dir8(foe.x - m.x, foe.y - m.y);
                m.lock = (m.lock ?? 0) - dt;
                if (m.lock <= 0) {
                    m.lock = 1.5; m.ph = 0;
                    // 攻击动作交替（主人 2026-08-11 拍板）：有冲锋组的兵种（象兵/弓骑）每轮出手翻转，
                    // 在「攻击帧/冲锋帧」两套动作间轮播，丰富表现；无冲锋组的兵种不受影响。
                    if (this.bank[m.key]?.sets.charge?.[0]?.length) m.atkFlip = !m.atkFlip;
                    // 一轮出手开始 = 射出一支箭（主人 2026-08-11「每个远程应该拥有自己的弓箭」）。
                    // 只有真正在放箭的那一轮才有箭：被贴身改白刃（st=2）时不射。
                    if (stats.rng > 65 && m.st === 1) {
                        const ax = foe.x - m.x, ay = foe.y - m.y;
                        const ad = Math.hypot(ax, ay) || 1;
                        this.arrows.push({
                            x: m.x, y: m.y - UNIT_PX * 0.45,   // 从胸口高度射出，不是脚底
                            dx: ax / ad, dy: ay / ad, len: ad,
                            t: 0, dur: ARROW_DUR + Math.random() * 0.06, f: m.f,
                        });
                    }
                }
                m.atkSt = m.st;
                // 总加成：把战略层强弱（将领/精锐/武将技/文化/运气）带进每一刀
                // [2026-08-13 主人定稿方向] 循环克制：弓克骑 → 骑克步 → 步克弓。
                //   我克你 ×C、你克我 ÷C、同类/无关 ×1 —— 三条边强度一样，一个 COUNTER_C 调松紧。
                //   象兵（aoe）同一张表：范围伤也乘克制系数（CC 实锤「象兵完全不吃相克」已修）。
                //   弓骑算骑兵（2026-08-14 主人定稿）：克制统一按骑兵算，不再「射人算远程」。
                const shooterCls = (WAR_TYPES[m.key]?.cls ?? 'melee');
                const targetCls = WAR_TYPES[foe.key]?.cls ?? 'melee';
                const accMul = counterMul(shooterCls, targetCls);
                if (wt.aoe) this.splash(m, R, stats.dmg * this.sideBonus[m.f] * dt, shooterCls);
                else {
                    foe.atkNext++;
                    foe.hp -= stats.dmg * accMul * this.sideBonus[m.f] * gangMul(foe) * dt;
                    if (foe.hp <= 0) this.corpses.push({ x: foe.x, y: foe.y, f: foe.f, key: foe.key, dir: foe.dir, t: 0 });
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
        this.arrows = this.arrows.filter(a => a.t < a.dur);
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
        // 死亡动画播完 → 累加器裁定：留下的烙进地面图（不再逐帧重画、不再参与排序），
        // 没留下的不立刻消失，改为停在死亡末帧渐隐 CORPSE_FADE 秒（见 CORPSE_FADE）。
        for (const c of this.corpses) {
            c.t += dt;
            if (c.keep === undefined && c.t >= DEATH_ANIM) {
                c.keep = this.takeCorpseSlot();
                if (c.keep) this.bakeCorpse(c);
            }
        }
        // keep=true 已烙进地面，本帧起就交给地面图了；keep=false 渐隐完才移除
        this.corpses = this.corpses.filter(c => c.keep !== true && c.t < DEATH_ANIM + CORPSE_FADE);

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
            if (performance.now() - this.pendingStartedAt > 10000) {
                console.warn(`🏁 [Scene13War] 素材 10s 未就绪（pending=${this.pending}），强制判负防死锁`);
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
        // 正在播死亡动画的（1.3 秒内）逐帧画；之后是没被留下的那 70%，停在末帧渐隐
        for (const c of this.corpses) vis.push({
            y: c.y, x: c.x, f: c.f, key: c.key, dir: c.dir, set: 'die',
            fr: c.t,
            a: c.t <= DEATH_ANIM ? 1 : Math.max(0, 1 - (c.t - DEATH_ANIM) / CORPSE_FADE),
        });
        for (const m of this.men) {
            // 有冲锋组的兵种（象兵/弓骑）两处用冲锋帧（主人 2026-08-12 拍板「两者都要」）：
            //   ① 移动时**逐轮交替**：一轮移动、一轮冲锋（见 CHARGE_CYCLE）；
            //   ② 攻击时按出手轮次与攻击帧交替（m.atkFlip 每轮出手翻转）。
            // 其余兵种不受影响：赶路一律移动帧、攻击固定攻击帧。白刃（st=2）用近战帧。
            const hasChg = !!this.bank[m.key]?.sets.charge?.[0]?.length;
            let set: string;
            // 残局待命：全军播待命帧（没有待命素材的退回移动帧，绝不留静止画面）
            if (this.lingering) {
                set = this.bank[m.key]?.sets.idle?.[0]?.length ? 'idle' : 'move';
            }
            else if (m.st === 0) {
                const odd = Math.floor(m.ph / CHARGE_CYCLE) % 2 === 1;
                set = (hasChg && odd) ? 'charge' : 'move';
            }
            else if (m.st === 2) set = 'melee';
            else if (m.atkFlip && hasChg) set = 'charge';
            else set = 'atk';
            const fade = m.fadeT > 0 ? 1 - m.fadeT / FADE_IN : 1;
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

        // 箭矢画在人上面。🔴 画法**逐笔照抄大地图**（ProjectileRenderer.draw 的 arrow 分支）：
        //   箭杆 #2c3e50（-12→+6）+ 银色箭头三角（6 处，±2.5）+ 褐色尾羽两撇（-12→-15，±3），
        //   并且**沿抛物线切线旋转**——飞出去时抬头、落下时低头。
        //   之前我只抄了飞行时间和弧高，画法自己瞎编成一根深褐直线，所以不像箭（主人实锤）。
        if (this.arrows.length) {
            ctx.save();
            ctx.lineCap = 'round';
            const S = ARROW_SCALE;
            for (const a of this.arrows) {
                const p = a.t / a.dur;
                const d = a.len * p;
                const arcH = Math.min(a.len * 0.3, 100);
                const arc = 4 * arcH * p * (1 - p);
                const x = a.x + a.dx * d;
                const y = a.y + a.dy * d - arc;
                // 切线：线性速度 + 抛物线的竖直分量
                const vx = a.dx * a.len;
                const vy = a.dy * a.len - 4 * arcH * (1 - 2 * p);
                const angle = Math.atan2(vy, vx);

                ctx.translate(x, y);
                ctx.rotate(angle);

                ctx.strokeStyle = '#2c3e50';          // 箭杆
                ctx.lineWidth = 1.5 * S;
                ctx.beginPath();
                ctx.moveTo(-12 * S, 0);
                ctx.lineTo(6 * S, 0);
                ctx.stroke();

                ctx.fillStyle = '#95a5a6';            // 箭头
                ctx.beginPath();
                ctx.moveTo(6 * S, 0);
                ctx.lineTo(3 * S, -2.5 * S);
                ctx.lineTo(3 * S, 2.5 * S);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#8b4513';          // 尾羽
                ctx.lineWidth = 1 * S;
                ctx.beginPath();
                ctx.moveTo(-12 * S, 0);
                ctx.lineTo(-15 * S, -3 * S);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-12 * S, 0);
                ctx.lineTo(-15 * S, 3 * S);
                ctx.stroke();

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
