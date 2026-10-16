/**
 * 三级军团表（自建 / 延伸军团）—— 🔴 [2026-09-14 主人定]
 *
 * > 主人原话：「所有军团只有一级 16 个，二级 62 个，其他都是三级」「怎么还有什么文化表，全部清除」
 *
 * ── 为什么有这个文件 ─────────────────────────────────────────────
 * 一级 16 母体的编制在 `CultureFormations.ts` 的 `BASE_16_TIERS_MAP`，
 * 二级 62 文明的编制在 `level2Civ62Legions.ts`，
 * 唯独三级军团的编制原先**没有自己的表**，散着寄存在 173 个文化区的格子里
 * （`CULTURE_TIERS_MAP` / `CULTURE_FORMATION_MODE`，也就是主人说的「文化表」）。
 * 那套东西不属于三层里的任何一层，是第四份权威，于是同一支军团的编制能在两处打架。
 * 本文件把三级军团的编制搬回军团自己身上；文化区从此只剩一个指针
 * （`CULTURE_LEGION_NAMES`：这个区默认挂哪支军团），不再持有任何编制。
 *
 * ⚠️ 军团数量一支未增未减：搬家前后都是 一级 16 + 二级 62 + 三级 N。
 */
import type { FormationMode } from '../types/CultureFormations';
import type { CompositionSlot } from '../types/LegionComposition';
import type { BuildingStyle } from './cities_v2';

export interface Level3LegionDef {
    /** 军团名（时代 + 民族 + 军团） */
    name: string;
    formationMode: FormationMode;
    slots: CompositionSlot[];
    /** 默认挂这支军团的文化区（只作溯源用，编制不再按区存） */
    regions: string[];
    /** 归属的 78 种正统军团名（一级 16 母体 16 支 + 二级 62 文明 62 支，🔴 2026-09-16 主人定） */
    parentLegion: string;
    /** 绑定的史实海军战船（对齐四大时代与历史，🔴 2026-09-16 主人定） */
    shipId: string;
    buildingStyle: BuildingStyle;
}

export const LEVEL_3_LEGIONS: Level3LegionDef[] = [
    {
        name: '古典时代亚马逊军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'amazon_archer', count: 2 },
            { type: 'amazon_warrior', count: 4 },
            { type: 'elite_scythian_horse_archer', count: 3 },
        ],
        regions: ['AMAZONS'],
        parentLegion: '古典时代色雷斯军团',
        shipId: 'ELITE_LEMBOS',
        buildingStyle: 'THRACIAN',
    },
    {
        name: '古典时代先秦军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'fire_archer', count: 3 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
        regions: ['PRE_QIN'],
        parentLegion: '古典时代秦汉军团',
        shipId: 'LOU_CHUAN',
        buildingStyle: 'CENTRAL',
    },
    {
        name: '古典时代希腊军团',
        formationMode: 'echelon',
        slots: [
            { type: 'sacred_band', count: 4 },
            { type: 'hoplite', count: 3 },
            { type: 'gastraphetes', count: 2 },
        ],
        regions: ['GREEK'],
        // 🔴 [2026-10-05 主人定「这66的父级都是一级」] 三级基础军团的父级＝一级母体 → 古典希腊属希腊军团。
        parentLegion: '希腊军团',
        shipId: 'HERO_DIONYSUS',
        buildingStyle: 'GREECE',
    },
    // 🔴 [2026-10-05 主人定「同族同时代不另立」＋「删除吧」] —— 已删「古典时代希腊雇佣军团」。
    //    原挂它的 2 个势力都不是雇佣兵，已按主人令改挂同族／同地军团：
    //      特洛伊·赫克托耳 → 古典时代色雷斯军团（小亚细亚西北，隔赫勒斯滂与色雷斯相望）
    //      伊皮鲁斯·皮洛士 → 古典时代马其顿军团（马其顿式方阵＋战象）
    {
        name: '古典时代斯基泰军团',
        formationMode: 'triangle',
        slots: [
            { type: 'sarmatian', count: 2 },
            { type: 'scythian_axe_cavalry', count: 3 },
            { type: 'scythian_horse_archer', count: 4 },
        ],
        regions: ['SCYTHIANS'],
        parentLegion: '古典时代色雷斯军团',
        shipId: 'MONOREME',
        buildingStyle: 'THRACIAN',
    },
    // 🔴 [2026-10-16 主人令「有重复的三级军团就删除，以后大部分都只套用 257 个二级军团」]
    //   原三级【古典时代赫梯军团】（HITTITES 哈图沙，锥形：古典掷矛手2 / 古典长枪兵3 / 双轮战车高级4）
    //   ＝ 与二级【古典时代赫梯军团】（奥斯曼·古典·安纳托利亚）同名同史，重复，已删。
    //   HITTITES 文化区指针与弗里吉亚／吕底亚／卡帕多西亚三家势力指针仍写「古典时代赫梯军团」，
    //   取数顺序 一级→二级→三级，现在自然落到留下来的那支二级军团。
    // 🔴 [2026-10-05 主人定「按地区划分，删除古典鲜卑。删除」] —— 已删「古典时代鲜卑军团」。
    //    原先挂它的 12 个势力已按主人令改套「古典时代羌族军团」；
    //    其文化区 `NORTHEAST`（7 座）默认军团一并改指「古典时代羌族军团」。
    {
        name: '城堡时代十字军团',
        formationMode: 'triangle',
        slots: [
            { type: 'knight', count: 2 },
            { type: 'cavalier', count: 3 },
            { type: 'crusader_knight', count: 4 },
        ],
        regions: ['CRUSADERS'],
        // 🔴 [2026-10-05 主人定「城堡时代十字军团挂法兰克吧」] 十字军主力＝法兰克人
        //    （阿拉伯／拜占庭均称十字军为「法兰克人」），故挂法兰克那条线（封建→城堡两代）。
        parentLegion: '封建时代法兰克军团',
        shipId: 'ELITE_CARAVEL',
        buildingStyle: 'FRANKS',
    },
    {
        name: '城堡时代大理军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'jian_swordman_shielded', count: 4 },
            { type: 'elite_chukonu', count: 3 },
        ],
        regions: ['DALI'],
        parentLegion: '东亚军团',
        shipId: 'HEAVY_INCENDIARY_SHIP',
        buildingStyle: 'BASHU',
    },
    {
        name: '城堡时代易洛魁军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'eagle_scout', count: 3 },
            { type: 'iroquois_warrior', count: 4 },
            { type: 'elite_plumed_archer', count: 2 },
        ],
        regions: ['IROQUOIS'],
        parentLegion: '中美军团',
        shipId: 'CANOE',
        buildingStyle: 'AMERICA',
    },
    // 🔴 [2026-10-05 主人令「删掉 封建时代柔然军团，武将归到封建漠北」] —— 已删「封建时代柔然军团」。
    //    文化区 `ROURAN` 的默认军团与挂它的势力一并改指「封建漠北军团」。
    {
        name: '封建时代粟特军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_skirmisher', count: 3 },
            { type: 'sogdian_cataphract', count: 4 },
            { type: 'elite_kipchak', count: 2 },
        ],
        regions: ['SOGDIANS'],
        parentLegion: '中亚军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'CENTRAL_ASIA',
    },
    // 🔴 [2026-10-05 主人定「封建时代渤海军团，封建时代高句丽军团选一个删除」] —— 已删「封建时代高句丽军团」。
    //    理由：`KOREA` 那 9 座（国内城／平壤／开城／金城／泗沘…）在**朝鲜半岛**，划归朝鲜半岛那条线；
    //    该文化区默认军团改指「封建时代新罗军团」。白山黑水（满洲）那条线：原改名来的「封建时代白山黑水军团」已按主人令删除，封建节点归新名单的「封建时代渤海军团」（`MOHE` 指针已改指它）。
    {
        name: '城堡时代岳家军团',
        formationMode: 'echelon',
        slots: [
            { type: 'liao_dao', count: 4 },
            { type: 'elite_chukonu', count: 3 },
            { type: 'elite_keshik', count: 2 },
        ],
        regions: [],
        parentLegion: '东亚军团',
        shipId: 'LOU_CHUAN',
        buildingStyle: 'CENTRAL',
    },
    // 🔴 [2026-10-05 主人令「都套用在游戏中」] 瓦良格卫队本体（兵营兵）与精锐首领，二级瓦良格军团的 3 个槽位放不下，单列一支三级军团，
    //    给罗斯（雅罗斯拉夫，瓦良格卫队的发源地）用；时代按 988 年起的卫队与雅罗斯拉夫在位（1019–1054）定为封建。
    // ───────────────────────────────────────────────────────────────────
    // 帝国时代·基础城堡兵专属 4 支　【2026-10-16 主人令新建】
    // 四个帝国文明的城堡兵「普通档」落在各自 3 档。
    // ───────────────────────────────────────────────────────────────────
    {
        name: '帝国时代西班牙征服军团',
        formationMode: 'triangle',
        slots: [
            { type: 'pikeman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
        regions: ['SPANISH'],
        parentLegion: '帝国时代西班牙方阵军团',
        shipId: 'GALLEON',
        buildingStyle: 'SPANISH',
    },
    {
        name: '帝国时代葡萄牙风琴军团',
        formationMode: 'echelon',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'organ_gun', count: 3 },
            { type: 'pikeman', count: 2 },
        ],
        regions: ['PORTUGUESE'],
        parentLegion: '帝国时代葡萄牙军团',
        shipId: 'CARAVEL',
        buildingStyle: 'PORTUGUESE',
    },
    {
        name: '帝国时代安第斯游击军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_kona', count: 4 },
            { type: 'kona', count: 3 },
            { type: 'bolas_rider', count: 2 },
        ],
        regions: ['MAPUCHE'],
        parentLegion: '帝国时代阿劳卡尼亚军团',
        shipId: 'CANOE',
        buildingStyle: 'MAPUCHE',
    },
    {
        name: '帝国时代苏丹亲兵军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_janissary', count: 4 },
            { type: 'janissary', count: 3 },
            { type: 'hussar', count: 2 },
        ],
        regions: ['OTTOMAN'],
        parentLegion: '帝国时代土耳其军团',
        shipId: 'CANNON_GALLEON',
        buildingStyle: 'TURKS',
    },
];

export const LEVEL_3_LEGION_MAP: ReadonlyMap<string, Level3LegionDef> =
    new Map(LEVEL_3_LEGIONS.map(l => [l.name, l]));

export const LEVEL_3_LEGION_NAMES: ReadonlySet<string> =
    new Set(LEVEL_3_LEGIONS.map(l => l.name));
