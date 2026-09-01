import { AssetLoader } from '../../core/AssetLoader';
import { perfDoctor } from '../../debug/PerfDoctor';
import type { NavalFormationMode } from '../../types/CultureFormations';
import { FACTION_COMPOSITIONS } from '../../data/FactionCompositions';
import { SPRITE_PATHS } from '../../config/GameConfig';
import { GeneralDrawer } from '../GeneralDrawer';
import {LegionPhalanxStateManager} from './LegionPhalanxState';
import { LegionType } from '../../types/UnitTypes';
import { SpriteTinter } from '../../systems/tinting/SpriteTinter';
import {getCompositionTier, expandCompositionSlots} from '../../types/LegionComposition';
import type { FormationMode } from '../../types/CultureFormations';
import { getNavalShipDrawScale, getCultureNavalShip, type NavalShipAssetId } from '../../types/NavalShipTiers';
import { gameLog } from '../../utils/GameLogger';
import { popCostOf } from '../../data/UnitPopCost';

/** 启动时不预载（S10DB 860+ 素材尚未部署），首次水战再按需加载 */
import { NavalPhalanxStateManager, shipCountForTroops, type NavalUnitState } from './NavalPhalanxState';
import { NavalWakeDrawer } from './NavalWakeDrawer';
import { audioManager } from '../../audio/AudioManager';

// 海战音效节流（模块级，避免每帧触发；仅跟拍军团实际发声）
//   箭声 1.2s / 炮声 2.6s 两条独立节流，错开后是「持续箭雨 + 偶发重炮」的层次，
//   同周期会糊成一片。落水声不独立触发：它必须跟在某一发炮之后（炮弹飞行 700ms 才落海），
//   自己定时播会变成「凭空落水」。
let lastNavalFireAt = 0;
let lastNavalCannonAt = 0;
/** 待播落水声的时刻（0 = 无待播）；由炮声排程，见 NAVAL_SPLASH_DELAY_MS */
let pendingNavalSplashAt = 0;
/** 上述三个计时器归属的军团 id —— 跟拍换船队立即清零，否则新船队会继承旧船队的节流相位 */
let navalSfxUnitId = '';

/** [2026-08-27 §② 划桨随速] 逐舰队连续划桨相位（帧单位）与上帧 tick：变速只影响后续推进，不跳帧 */
const navalOarPhase = new Map<string, number>();
const navalOarTick = new Map<string, number>();

/** 炮响 → 炮弹落水的间隔（ms），按 DE 里炮弹的飞行观感取值 */
const NAVAL_SPLASH_DELAY_MS = 700;
/** 每发炮打空（播落水声）的概率：全中显得没有落点、全空显得没打中，取一半 */
const NAVAL_SPLASH_CHANCE = 0.5;

/** 启动时不预载（S10DB 860+ 素材尚未部署），首次水战再按需加载 */
const LAZY_BOOT_UNIT_IDS = new Set(['ship_small', 'ship_medium', 'ship_large']);

/**
 * 🔴 [2026-08-31 开机长任务风暴] 启动**只**预载这两个兜底兵种，其余全部按需加载。
 *
 * 实测证据（PerfDoctor churn 计数器）：开机把 UNIT_ASSETS 里 300 多个兵种全量解码，
 * 每个都要走抠绿（`getImageData` + 逐像素 + `toDataURL`），而其中 **144 个装完就被淘汰、
 * 全程没被用过一次**（`evicts:144 / reAdds:0`）—— 一多半是纯白干，
 * 却贡献了开机那批 600 次 / 合计 160 秒、最长 4.8 秒的长任务。
 *
 * 为什么能安全改成懒加载：绘制入口有完整兜底链
 * （`unitAssetsId → legionType → mixed → light_infantry`），
 * 且缺哪个就 `ensureUnitTypeLoading` 后台补载、当帧先用兜底集顶着，**不会画空白**。
 * 这两个键是兜底链的终点，必须常驻，否则会走到 `Rendering Aborted`。
 *
 * 代价：某兵种**首次**出现的一两秒内用兜底贴图，之后自动换成正确的。
 */
const EAGER_BOOT_UNIT_IDS = new Set(['mixed', 'light_infantry']);

/** AoE2 DE（SLD）动态帧框素材目录：走 hotspot 对齐渲染，读 `_meta.json`。其余（S10DB/征服版 SLP）走正方形帧。 */
const DE_DYN_DIRS = ["/SUCAI/AMAZONARCHER/","/SUCAI/AMAZONWARRIOR/","/SUCAI/ANTIQUITY_BATTERINGRAM/","/SUCAI/ANTIQUITY_CAPPED_RAM/","/SUCAI/ANTIQUITY_CAVALRY_ARCHER/","/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/","/SUCAI/ANTIQUITY_HEAVY_SCORPION/","/SUCAI/ANTIQUITY_LIGHT_CAVALRY/","/SUCAI/ANTIQUITY_MANGONEL/","/SUCAI/ANTIQUITY_ONAGER/","/SUCAI/ANTIQUITY_SCORPION/","/SUCAI/ANTIQUITY_SCOUT_CAVALRY/","/SUCAI/ANTIQUITY_SIEGE_ONAGER/","/SUCAI/ANTIQUITY_SIEGE_RAM/","/SUCAI/ANTIQUITY_SIEGE_TOWER/","/SUCAI/ANTIQUITY_SKIRMISHER/","/SUCAI/ANTIQUITY_SPEARMAN/","/SUCAI/ANT_ELITE_GALLEY/",
"/SUCAI/ANT_SCOUT/","/SUCAI/ARAMBAI/","/SUCAI/ARBALEST/","/SUCAI/ARBALESTER/","/SUCAI/ARCHER/","/SUCAI/ARMORED_ELEPHANT/","/SUCAI/AZTEC_RAIDER/","/SUCAI/BACTRIAN_ARCHER/","/SUCAI/BALLISTAELEPHANT/","/SUCAI/BALLISTA_ELEPHANT/","/SUCAI/BATTERINGRAM/","/SUCAI/BATTLEELEPHANT/","/SUCAI/BAYINNAUNG_ELEPHANT/","/SUCAI/BERSERK/","/SUCAI/BLACKWOODARCHER/","/SUCAI/BOLASRIDER/","/SUCAI/BOMBARDCANNON/","/SUCAI/BOWMAN/","/SUCAI/BOYAR/","/SUCAI/CAMELARCHER/","/SUCAI/CAMELRIDER/","/SUCAI/CAMELSCOUT/","/SUCAI/CAMEL_HEAVY/","/SUCAI/CAMEL_IMPERIAL/","/SUCAI/CAMEL_RAIDER/","/SUCAI/CAPPEDRAM/","/SUCAI/CATAPHRACT/","/SUCAI/CAVALIER/","/SUCAI/CAVALRYARCHER/","/SUCAI/CAV_ARCHER/","/SUCAI/CAV_ARCHER_HEAVY/","/SUCAI/CENTURION/","/SUCAI/CHAKRAMTHROWER/","/SUCAI/CHAMPION/","/SUCAI/CHAMPIRUNNER/","/SUCAI/CHAMPISCOUT/","/SUCAI/CHAMPIWARRIOR/","/SUCAI/CHUKONU/","/SUCAI/COMPANION_CAVALRY/","/SUCAI/COMPOSITEBOWMAN/","/SUCAI/COMPOSITE_BOWMAN/","/SUCAI/CONDOTTIERO/","/SUCAI/CONQUISTADOR/","/SUCAI/COUSTILLIER/","/SUCAI/CRETAN_ARCHER/","/SUCAI/CROSSBOWMAN/","/SUCAI/CRUSADERKNIGHT/","/SUCAI/DAGNAJAN_ELEPHANT/","/SUCAI/EAGLESCOUT/","/SUCAI/EAGLEWARRIOR/","/SUCAI/EASTERN_SWORDSMAN/","/SUCAI/EKDROMOS/","/SUCAI/ELEPHANTARCHER/","/SUCAI/ELEPHANT_ARCHER/","/SUCAI/ELITEARAMBAI/","/SUCAI/ELITEARMOREDELEPHANT/","/SUCAI/ELITEBALLISTAELEPHANT/","/SUCAI/ELITEBATTLEELEPHANT/","/SUCAI/ELITEBERSERK/","/SUCAI/ELITEBLACKWOODARCHER/","/SUCAI/ELITEBOLASRIDER/","/SUCAI/ELITEBOYAR/","/SUCAI/ELITECAMELARCHER/","/SUCAI/ELITECATAPHRACT/","/SUCAI/ELITECENTURION/","/SUCAI/ELITECHAKRAMTHROWER/","/SUCAI/ELITECHAMPIWARRIOR/","/SUCAI/ELITECHUKONU/","/SUCAI/ELITECOMPOSITEBOWMAN/","/SUCAI/ELITECONQUISTADOR/","/SUCAI/ELITECOUSTILLIER/","/SUCAI/ELITEEAGLEWARRIOR/","/SUCAI/ELITEELEPHANTARCHER/","/SUCAI/ELITEFIREARCHER/","/SUCAI/ELITEFIRELANCER/","/SUCAI/ELITEFOOTKONNIK/","/SUCAI/ELITEGBETO/","/SUCAI/ELITEGENITOUR/","/SUCAI/ELITEGENOESECROSSBOWMAN/","/SUCAI/ELITEGHULAM/","/SUCAI/ELITEGUECHAWARRIOR/","/SUCAI/ELITEHUSKARL/","/SUCAI/ELITEHUSSITEWAGON/","/SUCAI/ELITEIBIRAPEMAWARRIOR/","/SUCAI/ELITEIRONPAGODA/","/SUCAI/ELITEJAGUARWARRIOR/","/SUCAI/ELITEJANISSARY/","/SUCAI/ELITEKAMAYUK/","/SUCAI/ELITEKARAMBITWARRIOR/","/SUCAI/ELITEKESHIK/","/SUCAI/ELITEKIPCHAK/","/SUCAI/ELITEKONA/","/SUCAI/ELITEKONNIK/","/SUCAI/ELITELEITIS/","/SUCAI/ELITELIAODAO/","/SUCAI/ELITELONGBOWMAN/","/SUCAI/ELITEMAGYARHUSZAR/","/SUCAI/ELITEMAMELUKE/","/SUCAI/ELITEMANGUDAI/","/SUCAI/ELITEMONASPA/","/SUCAI/ELITEOBUCH/","/SUCAI/ELITEORGANGUN/","/SUCAI/ELITEPLUMEDARCHER/","/SUCAI/ELITERATHAMELEE/","/SUCAI/ELITERATHARANGED/","/SUCAI/ELITERATTANARCHER/","/SUCAI/ELITESAMURAI/","/SUCAI/ELITESERJEANT/","/SUCAI/ELITESHOTELWARRIOR/","/SUCAI/ELITESHRIVAMSHARIDER/","/SUCAI/ELITESKIRMISHER/","/SUCAI/ELITESTEPPELANCER/","/SUCAI/ELITETARKAN/","/SUCAI/ELITETEMPLEGUARD/","/SUCAI/ELITETEUTONICKNIGHT/","/SUCAI/ELITETHROWINGAXEMAN/","/SUCAI/ELITETIGERCAVALRY/","/SUCAI/ELITEURUMISWORDSMAN/","/SUCAI/ELITEWARDOG/","/SUCAI/ELITEWARELEPHANT/","/SUCAI/ELITEWARWAGON/","/SUCAI/ELITEWHITEFEATHERGUARD/","/SUCAI/ELITEWOADRAIDER/","/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/","/SUCAI/ELITE_CHUKONU/","/SUCAI/ELITE_COMPOSITE_BOWMAN/","/SUCAI/ELITE_FIRE_ARCHER/","/SUCAI/ELITE_FIRE_LANCER/","/SUCAI/ELITE_GREEK_CAVALRY/","/SUCAI/ELITE_GUARDSMAN/","/SUCAI/ELITE_HOPLITE/","/SUCAI/ELITE_KIPCHAK/","/SUCAI/ELITE_LIAO_DAO/","/SUCAI/ELITE_PELTAST/","/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/","/SUCAI/ELITE_STEPPE_LANCER/","/SUCAI/ELITE_TARKAN/","/SUCAI/ELITE_WAR_CHARIOT/","/SUCAI/ELITE_WHITE_FEATHER_GUARD/","/SUCAI/EQUITES/","/SUCAI/FIREARCHER/","/SUCAI/FIRELANCER/","/SUCAI/FIRE_ARCHER/","/SUCAI/FIRE_LANCER/","/SUCAI/FLAMETHROWER/","/SUCAI/FLAMINGCAMEL/","/SUCAI/FLEMISHPIKEMAN/","/SUCAI/FLEMISHPIKEMAN_F/","/SUCAI/FOOTKONNIK/","/SUCAI/GALLEY/", // 🔴 2026-08-19 海军三档船（DE 桨帆船系列，16 向）
"/SUCAI/GASTRAPHETES/","/SUCAI/GBETO/","/SUCAI/GENITOUR/","/SUCAI/GENOESECROSSBOWMAN/","/SUCAI/GHULAM/","/SUCAI/GREEK_NOBLE_CAVALRY/","/SUCAI/GRENADIER/","/SUCAI/GUARDSMAN/","/SUCAI/GUECHAWARRIOR/","/SUCAI/GUECHA_ELITE/","/SUCAI/HALBERDIER/","/SUCAI/HANDCANNONEER/","/SUCAI/HEAVYCAMELRIDER/","/SUCAI/HEAVYCAVALRYARCHER/","/SUCAI/HEAVYHEIKUANG/","/SUCAI/HEAVYPIKEMAN/","/SUCAI/HEAVYROCKETCART/","/SUCAI/HEAVYSCORPION/","/SUCAI/HEAVY_PIKEMAN/","/SUCAI/HEIKUANG/","/SUCAI/HEI_KUANG/","/SUCAI/HEI_KUANG_HEAVY/","/SUCAI/HELEPOLIS/","/SUCAI/HILL_TRIBESMAN/","/SUCAI/HIPPEUS/","/SUCAI/HOPLITE/","/SUCAI/HOUFNICE/","/SUCAI/HUSKARL/","/SUCAI/HUSSAR/","/SUCAI/HUSSITEWAGON/","/SUCAI/IBIRAPEMAWARRIOR/","/SUCAI/IBIRAPEMA_ELITE/","/SUCAI/IMMORTAL/","/SUCAI/IMPERIALCAMELRIDER/","/SUCAI/IMPERIALCENTURION/","/SUCAI/IMPERIALSKIRMISHER/","/SUCAI/IMPERIAL_CAVALRY/","/SUCAI/IMPERIAL_SKIRMISHER/","/SUCAI/INDIAN_TRIBESMAN/","/SUCAI/IRONPAGODA/","/SUCAI/IRON_PAGODA/","/SUCAI/IROQUOISWARRIOR/","/SUCAI/JAGUARWARRIOR/","/SUCAI/JANISSARY/","/SUCAI/JIANSWORDMANSHIELDED/","/SUCAI/JIAN_SWORDMAN_UNSHIELDED/","/SUCAI/JIAN_SWORDSMAN/","/SUCAI/JI_INFANTRY/","/SUCAI/JI_INFANTRY_ELITE/","/SUCAI/KAMAYUK/","/SUCAI/KARAMBITWARRIOR/","/SUCAI/KARAMBIT_WARRIOR/","/SUCAI/KARAMBIT_WARRIOR_ELITE/","/SUCAI/KESHIK/","/SUCAI/KIPCHAK/","/SUCAI/KNIGHT/","/SUCAI/KONA/","/SUCAI/KONNIK/","/SUCAI/LAMINATED_BOWMAN/","/SUCAI/LANCER/","/SUCAI/LEGIONARY/","/SUCAI/LEITIS/","/SUCAI/LEVY/","/SUCAI/LIAODAO/","/SUCAI/LIAO_DAO/","/SUCAI/LIGHTCAVALRY/","/SUCAI/LIGHT_RIDERS/","/SUCAI/LONGBOWMAN/","/SUCAI/LONGBOWMAN_ELITE/","/SUCAI/LONGSWORDSMAN/","/SUCAI/MAGYARHUSZAR/","/SUCAI/MAMELUKE/","/SUCAI/MANATARMS/","/SUCAI/MANGONEL/","/SUCAI/MANGUDAI/","/SUCAI/MANGUDAI_ELITE/","/SUCAI/MILITIA/","/SUCAI/MONASPA/","/SUCAI/MOUNTEDTREBUCHET/","/SUCAI/NINJA/","/SUCAI/NORSE_WARRIOR/","/SUCAI/OBUCH/","/SUCAI/ONAGER/","/SUCAI/ORGANGUN/","/SUCAI/ORGAN_ELITE/","/SUCAI/PALADIN/","/SUCAI/PARAGON/","/SUCAI/PATTIYODA_LONGBOWMAN/","/SUCAI/PATTIYODHA_LONGBOWMAN/","/SUCAI/PETARD/","/SUCAI/PHALANGITE/","/SUCAI/PIKEMAN/","/SUCAI/PLUMEDARCHER/","/SUCAI/PORUS_ELEPHANT/","/SUCAI/PROJ_ARROW/","/SUCAI/PROJ_ARROW_FIRE/","/SUCAI/PROJ_BALL/","/SUCAI/PROJ_MANGONEL/","/SUCAI/PROJ_ROCK/","/SUCAI/PROJ_BOLT/","/SUCAI/PROJ_DART/","/SUCAI/PROJ_GRENADE/","/SUCAI/PROJ_SHOT/","/SUCAI/PROJ_SLING/","/SUCAI/PROJ_SPEAR/","/SUCAI/PROJ_THROWING_AXE/","/SUCAI/QIZILBASHWARRIOR/","/SUCAI/RAIDER/","/SUCAI/RANGED_IMMORTAL/","/SUCAI/RATHAMELEE/","/SUCAI/RATHARANGED/","/SUCAI/RATTANARCHER/","/SUCAI/RATTAN_ARCHER/","/SUCAI/RATTAN_ARCHER_ELITE/","/SUCAI/RECURVE_BOWMAN/","/SUCAI/RHODIAN_SLINGER/","/SUCAI/RHOMPHAIA_WARRIOR/","/SUCAI/ROCKETCART/","/SUCAI/ROYALJANISSARY/","/SUCAI/SACRED_BAND/","/SUCAI/SAKAN_AXEMAN/","/SUCAI/SAMURAI/","/SUCAI/SAMURAI_DE/","/SUCAI/SAMURAI_ELITE/","/SUCAI/SANNAHYA/","/SUCAI/SARMATIAN/","/SUCAI/SAVAR/","/SUCAI/SCORPION/","/SUCAI/SCOUTCAVALRY/","/SUCAI/SCYTHIAN_AXE_CAVALRY/","/SUCAI/SCYTHIAN_HORSE_ARCHER/","/SUCAI/SERJEANT/","/SUCAI/SHOCK_CAVALRY/","/SUCAI/SHOTELWARRIOR/","/SUCAI/SHRIVAMSHARIDER/","/SUCAI/SICKLE_WARRIOR/","/SUCAI/SIEGEELEPHANT/","/SUCAI/SIEGEONAGER/","/SUCAI/SIEGERAM/","/SUCAI/SIEGETOWER/","/SUCAI/SKIRMISHER/","/SUCAI/SLINGER/","/SUCAI/SOGDIANCATAPHRACT/","/SUCAI/SOSSO_GUARD/","/SUCAI/SPARABARA/","/SUCAI/SPEARMAN/","/SUCAI/STEPPELANCER/","/SUCAI/STEPPE_LANCER/","/SUCAI/STRATEGOS/","/SUCAI/SWORDSMAN/","/SUCAI/TARANTINE_CAVALRY/","/SUCAI/TARKAN/","/SUCAI/TEMPLEGUARD/","/SUCAI/TEUTONICKNIGHT/","/SUCAI/THRACIAN_PELTAST/","/SUCAI/THROWINGAXEMAN/","/SUCAI/THROWING_AXEMAN/","/SUCAI/TIGERCAVALRY/","/SUCAI/TIGER_RIDER/","/SUCAI/TRACTIONTREBUCHET/","/SUCAI/TWOHANDEDSWORDSMAN/","/SUCAI/URUMISWORDSMAN/","/SUCAI/VANGUARD/","/SUCAI/WARCHARIOT/","/SUCAI/WARDOG/","/SUCAI/WARRIORPRIEST/","/SUCAI/WARWAGON/","/SUCAI/WAR_CHARIOT/","/SUCAI/WAR_GALLEY/","/SUCAI/WAR_ELEPHANT/","/SUCAI/WHITEFEATHERGUARD/","/SUCAI/WHITE_FEATHER_GUARD/","/SUCAI/WINGEDHUSSAR/","/SUCAI/WOADRAIDER/","/SUCAI/XIANBEIRAIDER/","/SUCAI/XIANBEI_RAIDER/","/SUCAI/XOLOTLWARRIOR/"];

export type PhalanxAnimState = 'IDLE' | 'MOVE' | 'ATTACK' | 'DAMAGE' | 'DEATH';

export class LegionPhalanxDrawer {

    /** 骑兵格位内部小三角（6 人 1+2+3）：denseFront 时每个骑兵编队内部展开成楔形。
     *  2026-08-09 主人定，本次阵型重构**不动**（只改主阵 9 格位排布，编队内部保持 6 人小三角）。 */
    private static readonly TRIANGLE_LAYOUT = [
        { r: 0, c: 0 },
        { r: 1, c: -1 }, { r: 1, c: 1 },
        { r: 2, c: -2 }, { r: 2, c: 0 }, { r: 2, c: 2 },
    ] as const;

    /** 主阵·三角 2+3+4（9 格位）：尖端 2 在前（排 0），中 3，底边 4（排 2）。
     *  c 为横向偏移（半格步），r 为纵深排（0=最前）。2026-08-15 主人定：1-2-3 → 2+3+4。 */
    private static readonly TRIANGLE_9_LAYOUT = [
        { r: 0, c: -0.5 }, { r: 0, c: 0.5 },
        { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 },
        { r: 2, c: -1.5 }, { r: 2, c: -0.5 }, { r: 2, c: 0.5 }, { r: 2, c: 1.5 },
    ] as const;

    /** 主阵·雁行 4+3+2（9 格位）：宽面 4 顶前（排 0），中 3，后收 2（排 2）。
     *  2026-08-15 主人定：新增雁行阵（远程为主的两翼展开）。 */
    private static readonly ECHELON_9_LAYOUT = [
        { r: 0, c: -1.5 }, { r: 0, c: -0.5 }, { r: 0, c: 0.5 }, { r: 0, c: 1.5 },
        { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 },
        { r: 2, c: -0.5 }, { r: 2, c: 0.5 },
    ] as const;

    /** 主阵·鱼鳞 3+4+2（9 格位）：前排 3（排 0），中阔鳞叠 4（排 1），后收尾 2（排 2）。
     *  2026-08-18 主人定：鱼鳞阵升级为 3-4-2（前抵·鳞叠·尾收），前中后交错，后排2与前排3两翼对齐。 */
    private static readonly FISH_SCALE_9_LAYOUT = [
        { r: 0, c: -1 }, { r: 0, c: 0 }, { r: 0, c: 1 },
        { r: 1, c: -1.5 }, { r: 1, c: -0.5 }, { r: 1, c: 0.5 }, { r: 1, c: 1.5 },
        { r: 2, c: -1 }, { r: 2, c: 1 },
    ] as const;

    /** 主阵·鹤翼 2+4+3（9 格位）：前锋 2 引敌（排 0），中排两翼展开 4（排 1），后排中军托底 3（排 2）。
     *  2026-08-18 主人定：新增鹤翼阵（双锋引敌·两翼合围），前中后交错，双锋与后排两翼对齐。 */
    private static readonly CRANE_WING_9_LAYOUT = [
        { r: 0, c: -1 }, { r: 0, c: 1 },
        { r: 1, c: -1.5 }, { r: 1, c: -0.5 }, { r: 1, c: 0.5 }, { r: 1, c: 1.5 },
        { r: 2, c: -1 }, { r: 2, c: 0 }, { r: 2, c: 1 },
    ] as const;

    /** 主阵·方阵 3+3+3（9 格位）：前排 3（排 0），中排 3（排 1），后排 3（排 2）。
     *  2026-08-18 主人定：新增方阵（九宫等边·坚若磐石）。 */
    private static readonly SQUARE_9_LAYOUT = [
        { r: 0, c: -1 }, { r: 0, c: 0 }, { r: 0, c: 1 },
        { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 },
        { r: 2, c: -1 }, { r: 2, c: 0 }, { r: 2, c: 1 },
    ] as const;

    /** 主阵·偃月 3+2+4（9 格位）：前排 3（排 0），中窄 2（排 1），后排决胜 4（排 2）。
     *  2026-08-20 主人定：新增偃月阵（前阻中虚·后发制人）。 */
    private static readonly CRESCENT_9_LAYOUT = [
        { r: 0, c: -1 }, { r: 0, c: 0 }, { r: 0, c: 1 },
        { r: 1, c: -0.5 }, { r: 1, c: 0.5 },
        { r: 2, c: -1.5 }, { r: 2, c: -0.5 }, { r: 2, c: 0.5 }, { r: 2, c: 1.5 },
    ] as const;

    /** 主阵·衡轭 4+2+3（9 格位）：前排横推 4（排 0），中窄 2（排 1），后排托底 3（排 2）。
     *  2026-08-20 主人定：新增衡轭阵（前宽后稳·前线硬碰）。 */
    private static readonly BALANCE_YOKE_9_LAYOUT = [
        { r: 0, c: -1.5 }, { r: 0, c: -0.5 }, { r: 0, c: 0.5 }, { r: 0, c: 1.5 },
        { r: 1, c: -0.5 }, { r: 1, c: 0.5 },
        { r: 2, c: -1 }, { r: 2, c: 0 }, { r: 2, c: 1 },
    ] as const;

    private static readonly PURE_CAVALRY_LEGION_TYPES: LegionType[] = ['cavalry', 'archer_cavalry'];

    private static readonly STRATEGIC_DE_UNIT_REPLACEMENTS: Readonly<Record<string, string>> = {
        mixed: 'militia',
        huaxia_infantry: 'spearman',
        huaxia_mixed: 'spearman',
        huaxia_cavalry: 'light_riders',
        huihui_cavalry: 'cav_archer',
        huihui_mixed: 'spearman',
        zhonghua_infantry: 'spearman',
        tianchao_infantry: 'spearman',
        zhonghua_mixed: 'spearman',
        song_infantry: 'longswordsman',
        shu_infantry: 'longswordsman',
        zhou_infantry: 'spearman',
        yue_infantry: 'longswordsman',
        e_infantry: 'jian_swordman_shielded',
        zhonghua_cavalry: 'light_riders',
        chaoxian_cavalry: 'light_riders',
        liang_cavalry: 'steppe_lancer',
        wei_cavalry: 'knight',
        tujue_cavalry: 'steppe_lancer',
        tian_cavalry: 'knight',
        xiyu_cavalry: 'light_riders',
        crossbow: 'crossbowman',
        ballista: 'scorpion',
        light_infantry: 'militia',
        heavy_infantry: 'longswordsman',
        shield: 'jian_swordman_shielded',
        spear: 'spearman',
        axe: 'norse_warrior',
        armored: 'champion',
        lancer: 'light_riders',
        heavy_cavalry: 'knight',
        general_cavalry: 'cavalier',
        horse_archer: 'cav_archer',
        elephant: 'war_elephant',
    };

    private static resolveStrategicDEUnitType(unitType: string): string {
        return this.STRATEGIC_DE_UNIT_REPLACEMENTS[unitType] ?? unitType;
    }

    /**
     * [2026-08-09 13场景阵型] 步兵类型判定：是否展开为 4×2 小阵。
     * 与 UnitAssets.ts / CultureFormations.ts 的步兵分类一致
     * （light_infantry/heavy_infantry/shield/spear/armored/axe + 华夏步兵）。
     * 骑兵（lancer/heavy_cavalry/general_cavalry/horse_archer/huihui_cavalry）、
     * 远程（archer/crossbow/ballista）、象兵（elephant）不是步兵，保持单格。
     */
    private static readonly INFANTRY_TYPES: ReadonlySet<string> = new Set([
        'light_infantry',
        'heavy_infantry',
        'shield',
        'spear',
        'armored',
        'axe',
        'huaxia_infantry',
    ]);

    private static isInfantryType(type: string): boolean {
        return LegionPhalanxDrawer.INFANTRY_TYPES.has(type);
    }

    /**
     * [2026-08-16 DE 骑兵识别] DE 兵种（AoE2 DE SLD 素材）的骑兵类型集合。
     * 旧判定只认 cavalry 后缀 / lancer / horse_archer，DE 骑兵名（kipchak/mangudai/cav_archer 等）
     * 全漏判 → 被当成步兵（方阵 / 步兵颠簸 / 不冲锋）。此集合补齐 DE 骑兵识别。
     * 注意：与 LegionComposition.getDefaultScaleForUnitType（scale 1.2）**故意不同源**——
     * 1.2 是 S10DB 素材补偿，DE 素材用自身 sz/hotspot，scale 保持 1.0 不动；这里只管阵型/冲锋/微动作的骑兵识别。
     */
    private static readonly DE_CAVALRY_TYPES: ReadonlySet<string> = new Set([
        'hei_kuang', 'iron_pagoda', 'kipchak', 'cav_archer', 'cav_archer_heavy',
        'light_riders', 'tarkan', 'elite_tarkan', 'steppe_lancer', 'xianbei_raider',
        'tiger_rider', 'arambai', 'mangudai', 'keshik', 'boyar', 'savar',
        'elite_kipchak', 'camel_heavy', 'elite_steppe_lancer', 'paladin', 'coustillier',
        'hei_kuang_heavy', 'mangudai_elite', 'steppe_horse_archer',
    ]);

    /**
     * [2026-08-09 13场景阵型] 骑兵类型判定：是否展开为 1-2-3 六人小三角。
     * 旧 S10DB 骑兵（lancer/heavy_cavalry/general_cavalry/horse_archer/huihui_cavalry + 任何含 cavalry 的兵种）
     * + DE 骑兵（DE_CAVALRY_TYPES）。
     * public：GlobalUnitRenderer 的编队判定（视觉框收缩系数）也用它，两处必须同源。
     */
    /**
     * 取死亡帧；素材没有 death 动作时回退到 idle。
     * 🔴 [2026-09-01] DE 船只素材 41 套里有 28 套**没有 death 动作**（`npm run naval:sprite-audit`
     *    会列出来）。原来直接 `currentSet.DEATH[dir]` 取到 undefined → 整格跳过绘制 →
     *    船在阵亡那一刻**凭空消失**，没有下沉过程。
     *    回退时必须**连 animState 一起退回 IDLE**：动态帧框（_meta.json 的 fw/帧数）是按
     *    动作分别记的，拿 DEATH 的参数去切 IDLE 的雪碧图会切出错位的半张图。
     */
    private static pickDeathFrame(
        set: { DEATH: HTMLImageElement[]; IDLE: HTMLImageElement[] },
        dir: number,
    ): { sprite: HTMLImageElement | undefined; state: PhalanxAnimState } {
        const death = set.DEATH?.[dir] || set.DEATH?.[0];
        if (death) return { sprite: death, state: 'DEATH' };
        return { sprite: set.IDLE?.[dir] || set.IDLE?.[0], state: 'IDLE' };
    }

    public static isCavalryType(type: string): boolean {
        return (
            type === 'lancer' ||
            type === 'heavy_cavalry' ||
            type === 'general_cavalry' ||
            type === 'horse_archer' ||
            type === 'huihui_cavalry' ||
            type.includes('cavalry') ||
            LegionPhalanxDrawer.DE_CAVALRY_TYPES.has(type)
        );
    }

    /**
     * [2026-08-09 13场景阵型] 远程类型判定：是否展开为远程方阵。
     * archer（弓兵）/ crossbow（弩兵）。床弩 ballista 已划入攻城类（主人 2026-08-09 定）。
     * public：GlobalUnitRenderer 的后排射击判定也用它（两处必须同源）。
     */
    public static isRangedType(type: string): boolean {
        return type === 'archer' || type === 'crossbow';
    }

    /**
     * [2026-08-09 13场景阵型] 攻城类型判定：是否展开为 2×2 四人小阵。
     * 主人 2026-08-09 定：象兵/床弩/冲车/井阑/投石均属攻城类。
     * 在槽位数据中实际出现的是 elephant（象兵）与 ballista（床弩兵，拉丁蝎子弩）；
     * 冲车/井阑/投石为独立器械系统（SIEGE_GEAR_DEFS），不占编队槽位。
     */
    private static isSiegeType(type: string): boolean {
        // 🔴 [2026-08-18 修·主人报「双轮战车的阵型不对」]
        //    原来只认老 S10DB 的 'elephant' / 'ballista' 两个键，于是**七种战车与全部 DE 战象
        //    一个分类都不命中**（不含 'cavalry'、不在 DE_CAVALRY_TYPES、不是 archer/crossbow、
        //    不在 INFANTRY_TYPES）→ 落到「未知兵种」兜底，被按步兵的 5×2 交错方阵展开。
        //    车马象这种大家伙挤成步兵棋盘格，就是主人看到的「阵型不对」。
        //
        //    判据改用**占人口**（popCostOf > 1），与 13 战斗那边同源（src/data/UnitPopCost.ts）：
        //    象 2 / 战车 3.75~5 / 火炮攻城 3 —— 一次覆盖，将来加新大型单位自动生效，不用再维护名单。
        //    攻城类走的是「1×4 一字横排」（主人 2026-08-10 定「把大象排成一排」），车正该走这条。
        return type === 'elephant' || type === 'ballista' || popCostOf(type) > 1;
    }

    /** S10DB 多数步兵/弩弓条带行高 64px；长枪、骑兵条带为 84px。绘制时按 64 归一化，避免同 scale 下 84px 素材显小。 */
    private static readonly S10DB_REF_FRAME_H = 64;

    /**
     * [2026-08-09 接触距离] 各类编队的**横向占位宽度**（单位：单兵宽，含两端各半个精灵）。
     * 与四支展开分支的子间距一一对应，改子间距务必同步改这里：
     *   步兵 4×2 交错 = 3.5 列 × 0.75 + 1 = 3.625  ← 最宽，格位间距按它定
     *   骑兵 1-2-3    = 4 × 0.64 × 0.7 + 1 ≈ 2.79
     *   远程 3×3      = 2 × 0.75 + 1 = 2.50
     *   攻城 2×2      = 1 × 1.20 + 1 = 2.20
     * 用途：**并肩让位**（squadEngagePoint 侧移一个编队宽）。
     * 🔴 2026-08-10 起不再用于接触距离 —— 接触距离改由 getSquadSupportRadius 按**真实外框形状**
     *    （步兵长方形 / 骑兵三角形）沿接敌方向算。用宽度当接触距离会让步兵停在两个多编队
     *    深度之外（主人实锤「步兵隔着一大段距离」），用纵深又只是换一个标量近似，都不对。
     */
    public static getSquadWidthFactor(type: string): number {
        // [2026-08-10 5×2 交错方阵] 步兵/远程统一 5 列交错：并集 = 4.5×0.75 + 1 = 4.375
        if (this.isInfantryType(type)) return 4.375;
        if (this.isCavalryType(type)) return 2.79;
        if (this.isRangedType(type)) return 4.375;
        if (this.isSiegeType(type)) return 3.25; // 攻城 1×4 = 3 × 0.75 + 1（2026-08-10 一排同步，原 2×2 = 2.20 已废弃）
        return 3.625; // 未知兵种按最宽算，宁可留缝也不穿模
    }

    /**
     * [2026-08-10 调试可视化] 画编队外框（DEV 专用，生产剥离）：旋转矩形 = 编队占位
     * （宽 = getSquadWidthFactor×单兵宽，深 = 纵深 factor×单兵高），红短线 = 编队朝向。
     * 供主人直观核对编队间距 / 接触线 / 「隔空」到底隔多远。仅 denseFront(13) 下由 draw 调用，
     * 攻方与守军（renderSiegeDefenders 也走 draw）自动全覆盖。
     */
    public static debugDrawSquadBox(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        direction: number,
        dw: number,
        dh: number,
        type: string,
    ): void {
        // [2026-08-10 主人定] 外框要比编队本身小（交战判定框语义）——占位矩形收进编队
        // 视觉内。骑兵是 1-2-3 三角阵、矩形框四角空，观感框特大 → 骑兵单独再缩（主人
        // 2026-08-10「把骑兵边框再次缩小」）。**判定与视觉同源**（squadContactDistance
        // 用同一组系数），框相切 = 判定碰到 = 开战（主人：「边框碰到才能开战」）。
        const SHRINK = this.isCavalryType(type) ? 0.55 : 0.70;
        const w = dw * LegionPhalanxDrawer.getSquadWidthFactor(type) * SHRINK;
        let depth: number;
        // [2026-08-10 5×2 十人方阵] 步兵/远程 2 排：深度 = 1×0.4 + 1 = 1.4 兵高
        if (this.isInfantryType(type)) depth = 1.40;
        else if (this.isCavalryType(type)) depth = 2.20;
        else if (this.isRangedType(type)) depth = 1.40;
        else if (this.isSiegeType(type)) depth = 1.00; // 攻城 1×4 单排深 = 1 精灵高（2026-08-10 一排同步）
        else depth = 1.50;
        const h = dh * depth * SHRINK;
        const angle = (direction + 1) * Math.PI / 4;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.strokeStyle = 'rgba(0, 230, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.restore();
    }

    /**
     * [2026-08-10 接触距离] 各类编队的**纵深占位**（单位：单兵**高**，含两端各半个精灵）。
     * 两队正面对撞时，挨上的是双方的前排 —— 中心距 = (己方纵深 + 敌方纵深) / 2 × 单兵高，
     * 与横向宽度无关。数值由四支展开分支的 localY 跨度反算，改子间距务必同步改这里：
     *   步兵 4×2   localY=(sr-0.5)×dh×0.50, sr∈{0,1} → 1×0.50+1 = 1.50
     *   骑兵 1-2-3 localY=(r-1.0)×dh×0.60, r∈{0,1,2} → 2×0.60+1 = 2.20
     *   远程 3×3   localY=(sr-1.0)×dh×0.50, sr∈{0,1,2} → 2×0.50+1 = 2.00 ← 最深，格位纵距按它定
     *   攻城 2×2   localY=(sr-0.5)×dh×0.80, sr∈{0,1} → 1×0.80+1 = 1.80
     * 单兵高从格位纵距反解：unitH = sp.y / (2.00 × 1.10)（与 computeDenseSpacing 同一套常数）。
     */
    /**
     * [2026-08-10 编队外框·主人定稿] 编队外框沿某方向的「支撑半径」——
     * 从编队中心出发、沿 dl 方向走到外框边缘的距离（凸集支撑函数）。
     *
     * 外框形状：**步兵/远程/攻城 = 长方形，骑兵 = 三角形（尖端朝前）**，与各自的
     * 子兵展开一一对应。两个编队「外框刚好贴上」的中心距 =
     *     支撑半径_我(d) + 支撑半径_敌(−d)      （d = 我 → 敌 的单位方向）
     * 这比旧的「一个标量停止距离」准得多：编队是扁的/尖的，从正面压上来和从侧面
     * 包过来，该停的距离本就不同，标量做不到（旧写法步兵一律停在最宽的 3.625 外）。
     *
     * 数学：外框 = 子兵中心点的凸包 ⊕ 单个精灵矩形（Minkowski 和），
     * 而凸集的支撑函数可加，所以直接把两段支撑相加即可：
     *   点阵凸包：矩形阵 = halfSpanX|dx| + halfSpanY|dy|；三角阵 = 三顶点投影取最大
     *   精灵矩形：(dw/2)|dx| + (dh/2)|dy|
     *
     * 各阵的点阵半跨（与四支展开分支的子间距逐项对应，改子间距务必同步改这里）：
     *   步兵 4×2   x ±1.75×0.75 = ±1.3125 dw   y ±0.5×0.50 = ±0.25 dh
     *   远程 3×3   x ±1.0 ×0.75 = ±0.75   dw   y ±1.0×0.50 = ±0.50 dh
     *   攻城 2×2   x ±0.5 ×1.20 = ±0.60   dw   y ±0.5×0.80 = ±0.40 dh
     *   骑兵三角   顶点 (0,−0.35dh) / (±2×0.32×0.7 dw, +0.35dh) = (±0.448dw, +0.35dh)
     * 校验：加回一个精灵后总宽 = 3.625/1.896/2.50/2.20 兵宽（与 getSquadWidthFactor 一致），
     *       总深 = 1.50/1.70/2.00/1.80 兵高。
     *
     * @param dlx,dly 单位方向，**编队本地坐标**（+x = 阵型横向，+y = 阵型纵深/后方）
     * @param dw,dh   单兵渲染宽 / 高（像素）
     */
    public static getSquadSupportRadius(
        type: string,
        dlx: number,
        dly: number,
        dw: number,
        dh: number,
    ): number {
        // [2026-08-10 据点编队] 城图（据点）＝守方一个不可动的编队：外框 = 城图矩形本体，
        // dw/dh 由发布方传城图全宽/全高（halfW×2 / halfH×2），支撑半径 = 矩形方向投影。
        // 城图不可缩（本体），无精灵加成段。
        if (type === 'city') {
            return (dw / 2) * Math.abs(dlx) + (dh / 2) * Math.abs(dly);
        }
        // 单个精灵那一段（所有兵种共用）
        const sprite = (dw / 2) * Math.abs(dlx) + (dh / 2) * Math.abs(dly);

        if (this.isCavalryType(type)) {
            // 三角形：尖端 (0,−0.60dh) 在前，底边两角 (±0.896dw, +0.60dh)
            const tipY = -0.60 * dh;
            const baseX = 0.896 * dw;
            const baseY = 0.60 * dh;
            const hull = Math.max(tipY * dly, baseX * Math.abs(dlx) + baseY * dly);
            return hull + sprite;
        }

        let halfX: number;
        let halfY: number;
        // [2026-08-10 5×2 交错方阵] 步兵/远程统一 5 列 2 排交错：halfX = 2.25×0.75 列距半跨、
        // halfY = 0.5×0.4 排距半跨
        if (this.isInfantryType(type)) { halfX = 1.6875 * dw; halfY = 0.20 * dh; }
        else if (this.isRangedType(type)) { halfX = 1.6875 * dw; halfY = 0.20 * dh; }
        else if (this.isSiegeType(type)) { halfX = 1.125 * dw; halfY = 0; } // 1×4 单排：1.5×0.75 / 无纵深（2026-08-10 一排同步）
        else { halfX = 1.3125 * dw; halfY = 0.25 * dh; } // 未知按步兵（最宽）
        return halfX * Math.abs(dlx) + halfY * Math.abs(dly) + sprite;
    }


    /**
     * 密集编队（zoom13 战斗场景）的 3×3 格位间距 —— 唯一实现，draw() 与外部对齐都走这里。
     *
     * 格位间距必须由「单兵实际绘制尺寸」推导，不能用估计常数：
     *   dw = SPRITE_BASE_H * scale * slotScale * (frameH / S10DB_REF_FRAME_H) * (frameW / frameH)
     * 编队占位需含两端各半个精灵，不能只算中心点跨度：
     *   步兵 4×2 交错 横向 3.5×0.75+1 = 3.625 兵宽 ← 最宽
     *   远程 3×3      纵深 2×0.50+1  = 2.00 兵高 ← 最深
     */
    private static computeDenseSpacing(
        refSprite: HTMLImageElement,
        refTotalFrames: number,
        scale: number,
        cultureScales: number[] | null,
    ): { x: number; y: number } {
        const SPRITE_BASE_H = 60;      // 与 draw() 循环内 baseHeight 一致
        // [2026-08-10 修·编队挤团] 5×2 交错方阵并集宽 = 4.5 列距 + 两端半兵 = 4.375 兵宽
        // （与 getSquadWidthFactor 步兵同源）。原 3.625 是 4×2 时代旧值 → 编队实际宽 > 格距
        // → 相邻编队横向压叠（主人实锤「一上来就重叠/挤成一团」）。
        const INFANTRY_SPAN_W = 4.375; // 最宽编队（步兵/远程 5×2 交错）横向占位（兵宽）
        // [2026-08-10 修·出场交叉] 格距参考素材是 64px，但中排重骑素材是 84px；
        // 骑兵阵深实际需 2.20×84/64 = 2.8875 个参考兵高。旧 2.00 不足，导致同一军团
        // 中排骑兵刚出场就侵入前后排（主人连续实锤「一出来两军就交叉」）。
        // 🔴 2026-08-16 随骑兵三角间距 0.35→0.60 同步放大（骑兵阵深 1.70→2.20）。
        const DEEPEST_SPAN_H = 2.90;   // 向上取整覆盖 84px 骑兵真实阵深
        const GAP = 1.10;              // 编队之间留 10% 缝

        const refFrameW = refSprite.width / refTotalFrames;
        const refFrameH = refSprite.height;
        const maxSlotScale = cultureScales && cultureScales.length
            ? Math.max(...cultureScales)
            : 1;
        const unitH = SPRITE_BASE_H * scale * maxSlotScale
            * (refFrameH / LegionPhalanxDrawer.S10DB_REF_FRAME_H);
        const unitW = unitH * (refFrameW / refFrameH);

        return { x: unitW * INFANTRY_SPAN_W * GAP, y: unitH * DEEPEST_SPAN_H * GAP };
    }

    /**
     * 供外部（攻城团锚点等）对齐 3×3 格位用：按与 draw() 同一套资源解析算出密集格位间距。
     * 资源未就绪返回 null —— 调用方应退回原行为，不要自己猜数值。
     */
    public static getDenseSquadSpacing(
        unitAssetsId: string,
        legionType: string,
        direction: number,
        scale: number,
        cultureScales: number[] | null,
    ): { x: number; y: number } | null {
        const assets = this.unitSpriteCache.get(unitAssetsId)
            ?? this.unitSpriteCache.get(legionType)
            ?? this.unitSpriteCache.get('mixed')
            ?? this.unitSpriteCache.get('light_infantry');
        if (!assets) return null;
        // LRU 打点：谁最近被画过，谁就不该被淘汰（见 evictUnitSprites）
        LegionPhalanxDrawer.spriteLastUsed.set(unitAssetsId, performance.now());
        const refSprite = assets.IDLE[direction] || assets.IDLE[0];
        if (!refSprite) return null;
        return this.computeDenseSpacing(
            refSprite, this.getFrameCount(refSprite), scale, cultureScales,
        );
    }

    // [DYNAMIC ASSET SYSTEM]
    // Key: unitAssetId (e.g. 'huaxia_infantry') -> Local Sprite Cache
    private static unitSpriteCache: Map<string, {
        MOVE: HTMLImageElement[],
        ATTACK: HTMLImageElement[],
        IDLE: HTMLImageElement[],
        DAMAGE: HTMLImageElement[],
        DEATH: HTMLImageElement[],
        /**
         * AoE2 DE 动态帧框元数据（有此项 = 走 hotspot 对齐渲染；无此项 = S10DB 正方形帧）。
         * 键 = cacheEntry 字段名（MOVE/ATTACK/IDLE/DAMAGE/DEATH/SHOOT/CHARGE），
         * 值 = { frames: 帧数, dirs: { [dir]: { fw, fh, hx, hy } } }，
         * fw/fh = 该动作该方向 box 尺寸，hx/hy = hotspot(canvas中心) 在 box 里的位置。
         */
        dyn?: Record<string, { frames: number; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> }>;
        SECONDARY?: {
            MOVE: HTMLImageElement[],
            ATTACK: HTMLImageElement[],
            IDLE: HTMLImageElement[],
            DAMAGE: HTMLImageElement[],
            DEATH: HTMLImageElement[],
            SHOOT: HTMLImageElement[]
        },
        TERTIARY?: {
            MOVE: HTMLImageElement[],
            ATTACK: HTMLImageElement[],
            IDLE: HTMLImageElement[],
            DAMAGE: HTMLImageElement[],
            DEATH: HTMLImageElement[],
            SHOOT: HTMLImageElement[]
        }
    }> = new Map();

    /** AoE2 DE 元数据缓存（目录 → dyn，键 = cacheEntry 字段名） */
    private static dynMetaCache: Map<string, Record<string, { frames: number; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> }>> = new Map();

    /** 读 AoE2 DE 素材的 `_meta.json`（帧数 + 每方向 box 尺寸/hotspot 偏移），映射到 cacheEntry 字段名。 */
    private static async loadDynMeta(dir: string): Promise<Record<string, { frames: number; dirs16?: boolean; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> }> | null> {
        const cached = this.dynMetaCache.get(dir);
        if (cached) return cached;
        try {
            const res = await fetch(`${dir}_meta.json`);
            if (!res.ok) return null;
            const meta: any = await res.json();
            const dyn: Record<string, { frames: number; dirs16?: boolean; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> }> = {};
            // 🔴 [2026-08-20] DE 战船等素材是 **16 向**（_meta.json 顶层 dirs16:true，键 0..15），
            //    而 UnitAssets 只采样偶数向（0,2,..,14）当作游戏的 8 向。元数据必须按 direction*2 查，
            //    否则 fw/fh/hotspot 全取错 → 战船被竖直切掉一半（主人实锤）。标志位在此保留，勿再丢。
            const dirs16 = meta.dirs16 === true;
            // _meta.json 的 action 键 → cacheEntry 字段名；DAMAGE/SHOOT/CHARGE 复用 attack。
            const map: Record<string, string[]> = {
                idle: ['IDLE'], move: ['MOVE'], attack: ['ATTACK', 'DAMAGE', 'SHOOT', 'CHARGE'], death: ['DEATH'],
            };
            for (const [act, slots] of Object.entries(map)) {
                if (!meta[act]) continue;
                for (const slot of slots) {
                    dyn[slot] = { frames: meta[act].frames, dirs16, dirs: meta[act].dirs };
                }
            }
            this.dynMetaCache.set(dir, dyn);
            return dyn;
        } catch { return null; }
    }

    /**
     * DE 动态帧框元数据取向：**唯一入口**，所有读 `_meta.json` 的 dirs 都必须走这里。
     * 16 向素材（dirs16:true，如全部战船）在 UnitAssets 里按偶数向采样成 8 向（陆军/旗），
     * 所以游戏的 direction k 对应元数据键 2k；8 向素材原样。
     * 🔴 [2026-08-21 全 16 向船] 战船已挂全 16 向，drawNaval 传 is16=true → 键 = direction 直取（0-15）。
     *    其余调用（陆军 8 向）不传 → 行为逐像素不变。
     */
    /** 取 9 格阵型的布局表（行 r / 列 c）；非 9 格阵型返回 null，走老的方阵网格。 */
    private static layoutOf(mode: FormationMode): readonly { r: number; c: number }[] | null {
        switch (mode) {
            case 'triangle': return this.TRIANGLE_9_LAYOUT;
            case 'echelon': return this.ECHELON_9_LAYOUT;
            case 'fish_scale': return this.FISH_SCALE_9_LAYOUT;
            case 'crane_wing': return this.CRANE_WING_9_LAYOUT;
            case 'square': return this.SQUARE_9_LAYOUT;
            case 'crescent': return this.CRESCENT_9_LAYOUT;
            case 'balance_yoke': return this.BALANCE_YOKE_9_LAYOUT;
            default: return null;
        }
    }

    /**
     * 逐行格位间距（战略地图 8/9/10 专用）。
     *
     * 🔴 [2026-09-01 修「孔雀战象的阵型和别人不一样」] 原来整团只算**一个**间距，
     *    取的是全团最大兵种的尺寸 —— 混编军团里最大的那个把 9 个格位全撑开：
     *    孔雀是 2 象 + 4 软剑士 + 3 长弓，桑纳亚战象 108×168 比软剑士 32×48 大近 4 倍
     *    （横 3.86× / 纵 4.20×），于是 7 个人也按象的间距站位，人和人之间空出大片。
     *    反过来若按小兵算，象又会叠成一坨（2026-08-18 主人实锤过）。
     *
     *    解法：**每一行按自己那个兵种算**（编成本来就是按行定义的，一行 = 一个兵种）：
     *      · 行内横向间距 = 该行兵种的宽
     *      · 行与行的纵向间距 = 相邻两行取较大者（谁高听谁的，两边都不糊）
     *    象那一排照旧拉开，软剑士和长弓两排紧凑。
     *    同尺寸军团（门巴那种全骑兵，团内只差 1.14×）算出来每行都一样，**逐像素不变**。
     */
    private static rowMetrics(
        layout: readonly { r: number; c: number }[],
        slotTypes: (string | undefined)[],
        baseSpacingX: number,
        baseSpacingY: number,
        scale: number,
        cultureScales: number[] | null,
        direction: number,
        fallbackFrame: { fw: number; fh: number },
    ): { spacingX: number[]; gapY: number[] } {
        const rowCount = layout.reduce((m, p) => Math.max(m, p.r), 0) + 1;
        const spacingX: number[] = new Array(rowCount).fill(baseSpacingX);
        const rowH: number[] = new Array(rowCount).fill(baseSpacingY);

        for (let r = 0; r < rowCount; r++) {
            let w = 0;
            let h = 0;
            for (let i = 0; i < layout.length; i++) {
                if (layout[i].r !== r) continue;
                const type = slotTypes[i];
                const set = type ? this.unitSpriteCache.get(type) : undefined;
                const dyn = set ? this.metaDirFor((set as any).dyn?.IDLE, direction) : undefined;
                const ref = set?.IDLE?.[direction] || set?.IDLE?.[0];
                // DE 有 dyn 元数据 → 真实帧框；S10DB 无 dyn → 帧为正方形，用整图高
                const fw = dyn ? dyn.fw : (ref ? ref.height : fallbackFrame.fw);
                const fh = dyn ? dyn.fh : (ref ? ref.height : fallbackFrame.fh);
                const slotScale = cultureScales?.[i] ?? 1;
                const unitScale = 60 * scale * slotScale / LegionPhalanxDrawer.S10DB_REF_FRAME_H;
                w = Math.max(w, fw * unitScale * 0.5);
                // 所有军团统一采用前中后三排，纵向排距统一收紧。
                h = Math.max(h, fh * unitScale * 0.65);
            }
            // 只抬不降：与 2026-08-18 的口径一致，小兵种保持原有密集队列
            spacingX[r] = Math.max(baseSpacingX, w);
            rowH[r] = Math.max(baseSpacingY, h);
        }

        // 行距取相邻两行的较大者：谁高听谁的
        const gapY: number[] = [];
        for (let r = 0; r + 1 < rowCount; r++) gapY.push(Math.max(rowH[r], rowH[r + 1]));
        return { spacingX, gapY };
    }

    private static metaDirFor(
        dynEntry: { dirs16?: boolean; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> } | undefined,
        direction: number,
        is16: boolean = false,
    ): { fw: number; fh: number; hx: number; hy: number } | undefined {
        if (!dynEntry?.dirs) return undefined;
        const idx = dynEntry.dirs16 ? (is16 ? direction : direction * 2) : direction;
        return dynEntry.dirs[String(idx)];
    }

    // [RTS INTERFACE] Expose assets for RTS renderer
    public static getUnitAssets(unitAssetsId: string) {
        return this.unitSpriteCache.get(unitAssetsId);
    }

    private static isLoaded = false;
    // [PERF-FIX] Re-entrancy guard：防止被并发调用时重复跑全量 canvas 处理
    private static loadingPromise: Promise<void> | null = null;

    // ─── 攻城器械通用系统（2026-07-18）────────────────────────────
    private static readonly SIEGE_GEAR_DEFS = {
        ram: {
            attackIds: [731, 732, 733, 734, 735, 736, 737, 738],
            deathIds: [755, 756, 757, 758, 759, 760, 761, 762],
            posOffsetX: 0,      // 正中
            posOffsetY: -2.0,  // 第一排前
            scaleMul: 0.70,
        },
        well_lan: {
            attackIds: [774, 775, 776, 777, 778, 779, 780, 781],
            deathIds: [782, 783, 784, 785, 786, 787, 788, 789],
            posOffsetX: -1.7,    // 第三排左
            posOffsetY: +0.75,   // 左稍前
            scaleMul: 0.70,
        },
        well_lan_r: {
            attackIds: [774, 775, 776, 777, 778, 779, 780, 781],
            deathIds: [782, 783, 784, 785, 786, 787, 788, 789],
            posOffsetX: +1.7,    // 第三排右
            posOffsetY: +0.85,
            scaleMul: 0.70,
        },
        catapult_l: {
            attackIds: [801, 802, 803, 804, 805, 806, 807, 808],
            deathIds: [825, 826, 827, 828, 829, 830, 831, 832],
            posOffsetX: -0.8,     // 第三排后左
            posOffsetY: +1.70,    // 左稍前
            scaleMul: 0.70,
            frameStagger: 0,
            frameSpeed: 250,
        },
        catapult_r: {
            attackIds: [801, 802, 803, 804, 805, 806, 807, 808],
            deathIds: [825, 826, 827, 828, 829, 830, 831, 832],
            posOffsetX: +0.8,     // 第三排后右
            posOffsetY: +1.90,    // 右稍后
            scaleMul: 0.70,
            frameStagger: 4,      // 错开半周期
            frameSpeed: 250,      // 投石慢速（ms/帧）
        },
    } as const;

    /** 每场攻城随机交换井阑/投石机位置：key = unitId（+ 团索引，13 场景 4 团各自独立随机） */
    private static gearShuffle = new Map<string, Record<string, 'well' | 'catapult'>>();
    private static readonly SHUFFLE_GEAR_KEYS = ['well_lan', 'well_lan_r', 'catapult_l', 'catapult_r'] as const;

    private static ensureGearShuffle(unitId: string, groupIndex = 0): Record<string, 'well' | 'catapult'> {
        // [2026-08-09 主人定] 4 个攻城团完全一样 → 每团独立随机（key 含团索引），
        // 团与团之间的井阑/投石分布不再相同。
        const key = `${unitId}|${groupIndex}`;
        let s = this.gearShuffle.get(key);
        if (!s) {
            const types: ('well' | 'catapult')[] = ['well', 'well', 'catapult', 'catapult'];
            for (let i = types.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [types[i], types[j]] = [types[j], types[i]];
            }
            s = {};
            for (let i = 0; i < this.SHUFFLE_GEAR_KEYS.length; i++) {
                s[this.SHUFFLE_GEAR_KEYS[i]] = types[i];
            }
            this.gearShuffle.set(key, s);
        }
        return s;
    }


    private static siegeGearCaches = new Map<string, any>();

    private static getGearCache(type: string): any {
        let c = this.siegeGearCaches.get(type);
        if (!c) {
            c = {
                attackSprites: [],
                deathSprites: [],
                deathStarts: new Map(),
                deathThresholds: new Map(),
                loaded: false,
                loading: false,
            } as any;
            this.siegeGearCaches.set(type, c);
        }
        return c;
    }

    /** 外部查询：该 unit 是否曾参与攻城（用于覆灭后保留器械尸体） */
    public static wasSiegeUnit(unitId: string): boolean {
        for (const cache of this.siegeGearCaches.values()) {
            if (cache.deathThresholds.has(unitId)) return true;
        }
        return false;
    }

    /** 攻城器械渐显起始 tick：key = unitId */
    private static gearSpawnTicks = new Map<string, number>();
    private static readonly GEAR_SPAWN_DURATION = 2000; // 2 秒渐显
    /** 攻城器械渐隐起始 tick：key = unitId（胜利后 4 秒淡出） */
    private static gearFadeOutStarts = new Map<string, number>();
    private static readonly GEAR_FADE_OUT_DURATION = 4000; // 4 秒渐隐

    private static async ensureSiegeGearLoaded(type: string): Promise<void> {
        const cache = this.getGearCache(type);
        if (cache.loaded) return;
        if (cache.loading) {
            let waited = 0;
            while (cache.loading && waited < 100) {
                await new Promise(r => setTimeout(r, 50));
                waited++;
            }
            return;
        }
        cache.loading = true;
        const def = (LegionPhalanxDrawer.SIEGE_GEAR_DEFS as any)[type];
        try {
            const allPaths = [
                ...def.attackIds.map((id: number) => `/SUCAI/S10DB/${id}-1.png`),
                ...def.deathIds.map((id: number) => `/SUCAI/S10DB/${id}-1.png`),
            ];
            await AssetLoader.preloadImages(allPaths);
            for (const id of def.attackIds) {
                const raw = AssetLoader.getImage(`/SUCAI/S10DB/${id}-1.png`);
                if (raw) cache.attackSprites.push(await this.processImage(raw));
            }
            for (const id of def.deathIds) {
                const raw = AssetLoader.getImage(`/SUCAI/S10DB/${id}-1.png`);
                if (raw) cache.deathSprites.push(await this.processImage(raw));
            }
            cache.loaded = true;
            gameLog('unit', `🔨 攻城器械 ${type} 加载完成`);
        } finally {
            cache.loading = false;
        }
    }

    public static async preload(): Promise<void> {
        if (this.isLoaded) return;
        if (this.loadingPromise) return this.loadingPromise;
        this.loadingPromise = this._doPreload();
        try {
            await this.loadingPromise;
        } finally {
            this.loadingPromise = null;
        }
    }

    private static async _doPreload(): Promise<void> {

        gameLog('unit', '🔄 LegionPhalanxDrawer: Processing Dynamic Unit Assets...');

        // 1. Load Generic / Legacy Assets (if needed)
        // ...

        // 2. 预载兜底兵种（其余按需，见 EAGER_BOOT_UNIT_IDS）
        //    🔴 [2026-08-31] 这里**只委托 _loadNavalAssets**，绝不再自己写一份加载逻辑。
        //       原来开机和按需各写一份，按需那份漏了 SHOOT/CHARGE/SECONDARY/TERTIARY，
        //       结果圣殿骑士军团的二三线掉回兜底集，十字军阵里出现三国志10 的兵。
        await this._loadNavalAssets([...EAGER_BOOT_UNIT_IDS]);

        await GeneralDrawer.preload();

        // 预载攻城器械素材（避免首次攻城时懒加载延迟）
        gameLog('unit', '🔨 预载攻城器械素材...');
        for (const gearType of Object.keys(LegionPhalanxDrawer.SIEGE_GEAR_DEFS)) {
            await LegionPhalanxDrawer.ensureSiegeGearLoaded(gearType);
        }

        this.isLoaded = true;
        LegionPhalanxDrawer.startSpriteEvictLoop();
        gameLog('unit', '✅ LegionPhalanxDrawer: All dynamic unit assets loaded.');
    }

    // ─── 船贴图懒加载（2026-06-12 修复）────────────────────────────
    // LAZY_BOOT_UNIT_IDS 当年只做了"启动跳过"没做"事后加载"，
    // unitSpriteCache 永远没有三种船 → drawNaval 永远早退 → 船从不显示。
    // 现在由 drawNaval 首次被调用时触发后台加载（与 _doPreload 同样的分批 + 抠绿流程）。
    private static navalLoadStarted = false;

    private static ensureNavalAssetsLoading(): void {
        if (this.navalLoadStarted) return;
        this.navalLoadStarted = true;
        void this._loadNavalAssets().catch((e) => {
            gameLog('unit', '❌ 船贴图懒加载失败', e);
            this.navalLoadStarted = false; // 允许下次重试
        });
    }

    /** 按需加载单个兵种（被淘汰后自动重来的入口，见 ensureUnitTypeLoading） */
    private static unitLoadInFlight = new Set<string>();
    public static ensureUnitTypeLoading(key: string): void {
        if (!key || this.unitSpriteCache.has(key) || this.unitLoadInFlight.has(key)) return;
        this.unitLoadInFlight.add(key);
        this.noteUnitLoad(key);   // 抖动计数：这兵种是不是刚被淘汰又要回来
        void this._loadNavalAssets([key])
            .catch(() => { /* 失败下次再试 */ })
            .finally(() => this.unitLoadInFlight.delete(key));
    }

    /** @param keys 要加载的兵种；缺省 = 启动跳过的三种船（历史行为不变） */
    private static async _loadNavalAssets(keys?: readonly string[]): Promise<void> {
        const yieldMain = () => document.hidden
            ? Promise.resolve()
            : new Promise<void>(r => setTimeout(r, 0));
        const PROC_BATCH = 4;

        const loadBatch = async (sourcePaths: readonly string[], targetArray: HTMLImageElement[]) => {
            await AssetLoader.preloadImages([...sourcePaths]);
            for (let i = 0; i < sourcePaths.length; i += PROC_BATCH) {
                const slice = sourcePaths.slice(i, i + PROC_BATCH);
                await Promise.all(slice.map(async (path, batchIdx) => {
                    const img = AssetLoader.getImage(path);
                    if (img) {
                        const processed = await this.processImage(img);
                        targetArray[i + batchIdx] = processed;
                        // 抠绿产物是另一张图，原图从此没人用 —— 放掉，别存两份位图
                        if (processed !== img) AssetLoader.release(path);
                    }
                }));
                if (i + PROC_BATCH < sourcePaths.length) await yieldMain();
            }
        };

        const unitAssets = SPRITE_PATHS.UNIT_ASSETS as any;
        for (const key of (keys ?? [...LAZY_BOOT_UNIT_IDS])) {
            const config = unitAssets?.[key];
            if (!config || this.unitSpriteCache.has(key)) continue;

            // 🔴 [2026-08-31] 这里**必须和开机预载载一模一样的东西**。
            //    漏了 SECONDARY/TERTIARY 那一版上线后，圣殿骑士军团的二三线掉回兜底集
            //    （`mixed` 是 S10DB 素材）→ 十字军阵中出现三国志10 的兵。
            //    开机预载现在直接委托本函数，两条路不再各写一份，杜绝再次漂移。
            const cacheEntry = {
                MOVE: [] as HTMLImageElement[],
                ATTACK: [] as HTMLImageElement[],
                IDLE: [] as HTMLImageElement[],
                DAMAGE: [] as HTMLImageElement[],
                DEATH: [] as HTMLImageElement[],
                SHOOT: [] as HTMLImageElement[],
                CHARGE: [] as HTMLImageElement[],
                SECONDARY: config.SECONDARY ? {
                    MOVE: [] as HTMLImageElement[],
                    ATTACK: [] as HTMLImageElement[],
                    IDLE: [] as HTMLImageElement[],
                    DAMAGE: [] as HTMLImageElement[],
                    DEATH: [] as HTMLImageElement[],
                    SHOOT: [] as HTMLImageElement[],
                    CHARGE: [] as HTMLImageElement[],
                } : undefined,
                TERTIARY: config.TERTIARY ? {
                    MOVE: [] as HTMLImageElement[],
                    ATTACK: [] as HTMLImageElement[],
                    IDLE: [] as HTMLImageElement[],
                    DAMAGE: [] as HTMLImageElement[],
                    DEATH: [] as HTMLImageElement[],
                    SHOOT: [] as HTMLImageElement[],
                } : undefined,
            };
            // 🔴 AoE2 DE 动态帧框：读 `_meta.json`（帧数 + 每方向 box 尺寸/hotspot 偏移），渲染走 hotspot 对齐。
            //    船目录在 DE_DYN_DIRS 时才有 dyn —— 否则每向 frameW/frameH 不同会画得忽大忽小、锚点乱飘。
            const _firstUrl: string = (config.MOVE?.[0] ?? config.ATTACK?.[0] ?? config.IDLE?.[0] ?? config.DEATH?.[0] ?? '') as string;
            if (typeof _firstUrl === 'string' && DE_DYN_DIRS.some(dir => _firstUrl.includes(dir))) {
                const _dir = _firstUrl.substring(0, _firstUrl.lastIndexOf('/') + 1);
                const dyn = await LegionPhalanxDrawer.loadDynMeta(_dir);
                if (dyn) (cacheEntry as any).dyn = dyn;
            }
            const jobs = [
                loadBatch(config.MOVE, cacheEntry.MOVE),
                loadBatch(config.ATTACK, cacheEntry.ATTACK),
                loadBatch(config.IDLE, cacheEntry.IDLE),
                loadBatch(config.DAMAGE, cacheEntry.DAMAGE),
                loadBatch(config.DEATH, cacheEntry.DEATH),
            ];
            if (config.SHOOT) jobs.push(loadBatch(config.SHOOT, cacheEntry.SHOOT));
            if (config.CHARGE) jobs.push(loadBatch(config.CHARGE, cacheEntry.CHARGE));
            if (config.SECONDARY && cacheEntry.SECONDARY) {
                const sec = cacheEntry.SECONDARY;
                jobs.push(loadBatch(config.SECONDARY.MOVE, sec.MOVE));
                jobs.push(loadBatch(config.SECONDARY.ATTACK, sec.ATTACK));
                jobs.push(loadBatch(config.SECONDARY.IDLE, sec.IDLE));
                jobs.push(loadBatch(config.SECONDARY.DAMAGE, sec.DAMAGE));
                jobs.push(loadBatch(config.SECONDARY.DEATH, sec.DEATH));
                if (config.SECONDARY.SHOOT) jobs.push(loadBatch(config.SECONDARY.SHOOT, sec.SHOOT));
                if (config.SECONDARY.CHARGE) jobs.push(loadBatch(config.SECONDARY.CHARGE, sec.CHARGE));
            }
            if (config.TERTIARY && cacheEntry.TERTIARY) {
                const ter = cacheEntry.TERTIARY;
                jobs.push(loadBatch(config.TERTIARY.MOVE, ter.MOVE));
                jobs.push(loadBatch(config.TERTIARY.ATTACK, ter.ATTACK));
                jobs.push(loadBatch(config.TERTIARY.IDLE, ter.IDLE));
                jobs.push(loadBatch(config.TERTIARY.DAMAGE, ter.DAMAGE));
                jobs.push(loadBatch(config.TERTIARY.DEATH, ter.DEATH));
                if (config.TERTIARY.SHOOT) jobs.push(loadBatch(config.TERTIARY.SHOOT, ter.SHOOT));
            }
            await Promise.all(jobs);
            this.unitSpriteCache.set(key, cacheEntry);
            this.spriteLastUsed.set(key, performance.now());
            await yieldMain();
        }
    }

    /**
     * 抠绿结果按源图 URL 缓存。
     * [PERF 2026-08-05] S10DB 帧被多个 unit type 共用（如 154-161 被 8 个单位各引一次），
     * 开局 42 个单位共发起 2416 次 processImage，去重后只有 600 张不同的图 —— 75% 是重复劳动，
     * 每次都要 getImageData + 像素环 + putImageData + toDataURL + 二次 decode。
     * AssetLoader 只对下载去重、不对处理结果去重，所以缓存放在这一层。
     * 产物只作 drawImage 源使用（只读），多处共享同一个 HTMLImageElement 是安全的。
     */
    /** 每个兵种最近一次被绘制的时刻（LRU 淘汰用） */
    private static spriteLastUsed = new Map<string, number>();
    /**
     * 兵种贴图集**字节预算**。
     *
     * 🔴 [2026-08-31 实测] 这个缓存原来**完全没有上限**，Shift+F3 量出 **4900MB**（154 个兵种）。
     *    而它存的是**已解码位图**——不在 JS 堆里，`performance.memory` 看不到，
     *    所以之前一直查堆、一直查不出问题（堆只显示 702MB）。
     *    浏览器图像内存被这么占着，长任务 438 次 / 合计 49 秒，主线程被反复整块占住。
     *
     * 1.2GB 的取法：一屏/一场战斗通常用到 10~20 个兵种（≈32MB/种 → 320~640MB），
     * 留 2 倍余量，**正在画的那批永远不会被淘汰**。
     * ⚠️ 绝不能激进淘汰：把正在画的兵种顶掉 = 士兵当场消失（2026-08-31 已经栽过一次）。
     */
    //  [2026-08-31] 1200 → 2000MB。当时的理由是「稳态 1134MB 卡在预算边缘 → 反复淘汰又重载」，
    //     ⚠️ 但那个因果**没有测过**（当时还没有 churn 计数器），别当定论引用。
    //     同日改成按需加载后，这个缓存开机只占 5.9MB、打完一场战术也只有 139MB，
    //     离 2000MB 预算极远，`evicts/reAdds` 全 0 —— 这个数现在实际上已经不起作用了。
    //     真正的收益来自 EAGER_BOOT_UNIT_IDS（开机不再全量预载），不是这里的预算。
    private static readonly SPRITE_BUDGET_BYTES = 2000 * 1024 * 1024;
    /** 这么久没被画过才允许淘汰（秒）——防止刚切走镜头就把兵种顶掉、切回来又要重载 */
    //  有了 ensureUnitTypeLoading 按需补载，淘汰不再意味着「永远回不来」。
    //  但 20 秒太短：镜头在军团间来回切，兵种反复进出视野 → 淘汰-重载-再抠绿的死循环。
    //  120 秒＝真正「这一带打完了」才回收。正在画的兵种每帧打点，永远不会被选中。
    private static readonly SPRITE_IDLE_SEC = 120;

    /**
     * 定期淘汰。
     * 🔴 只在「加载新兵种时」淘汰是不够的：开局把 322 个兵种全预载完之后就再也不会有新加载，
     *    淘汰器从此不再运行，12.9GB 会一直挂着。必须有一条独立的定期检查。
     */
    private static evictTimer: ReturnType<typeof setInterval> | null = null;
    public static startSpriteEvictLoop(): void {
        if (this.evictTimer) return;
        this.evictTimer = setInterval(() => {
            // 🔴 战术演出期间不淘汰：13 用的是它自己的 bank，此时动兵种缓存只会在
            //    战斗最吃紧的时候平白制造一次全量扫描 + 重载。等回战略地图再收拾。
            if ((window as any).game?.scene13War?.isActive?.() === true) return;
            this.evictUnitSprites();
        }, 10000);
    }

    /** 单个兵种贴图集占多少字节（淘汰时按型号减，避免重复全量扫描） */
    private static setBytes(set: unknown): number {
        let b = 0;
        const seen = new Set<HTMLImageElement>();
        for (const key of Object.keys(set as Record<string, unknown>)) {
            const arr = (set as Record<string, unknown>)[key];
            if (!Array.isArray(arr)) continue;
            for (const im of arr as (HTMLImageElement | null)[]) {
                if (!im || seen.has(im)) continue;
                seen.add(im);
                b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
                if (im.src && im.src.startsWith('data:')) b += im.src.length * 2;
            }
        }
        return b;
    }

    private static evictUnitSprites(): void {
        // 🔴 [2026-08-31] 全量扫描只做**一次**。
        //    原实现每淘汰一个兵种就 `debugSpriteBytes()` 重扫整个缓存（约 1.5 万张图），
        //    淘汰 100 个 = 扫 100 遍，这个淘汰器自己就变成了长任务。
        let bytes = this.debugSpriteBytes();
        if (bytes <= this.SPRITE_BUDGET_BYTES) return;
        const now = performance.now();
        const cands = [...this.unitSpriteCache.keys()]
            .map((k) => ({ k, last: this.spriteLastUsed.get(k) ?? 0 }))
            .filter((c) => (now - c.last) / 1000 >= this.SPRITE_IDLE_SEC)   // 只淘汰久未使用的
            .sort((a, b) => a.last - b.last);                               // 最久没用的先走
        for (const c of cands) {
            if (bytes <= this.SPRITE_BUDGET_BYTES) break;
            const set = this.unitSpriteCache.get(c.k);
            if (set) bytes -= this.setBytes(set);   // 按型号减，不再重扫全量
            this.unitSpriteCache.delete(c.k);
            this.spriteLastUsed.delete(c.k);
            this.churn.evicts++;
            if (this.churnEvicted.size > 4000) this.churnEvicted.clear();
            this.churnEvicted.add(c.k);
        }
    }

    /**
     * 抖动计数（2026-08-31）。淘汰掉的兵种**又被重新加载回来** = 预算装不下工作集。
     * 只看占用 MB 分不出「正常淘汰冷兵种」和「反复重载同一批兵种」。
     */
    private static churn = { evicts: 0, reAdds: 0 };
    private static churnEvicted = new Set<string>();
    public static debugChurn(): { evicts: number; reAdds: number } { return { ...this.churn }; }
    /** 在 ensureUnitTypeLoading 真正开始加载某兵种时调用。 */
    private static noteUnitLoad(key: string): void {
        if (this.churnEvicted.delete(key)) this.churn.reAdds++;
    }

    private static processedBySrc = new Map<string, Promise<HTMLImageElement>>();
    /**
     * 抠绿结果缓存上限（条）。
     * 🔴 实测 **4272 条**且从不淘汰 —— 它持有已解码 Image 的强引用，
     *    不清它，上面 unitSpriteCache 淘汰了也**释放不掉内存**（图还被这里钉着）。
     *    这是派生缓存，淘汰只是下次重新抠一遍绿，不会导致贴图缺失。
     */
    private static readonly PROCESSED_MAX = 1200;

    /**
     * PerfDoctor 体检口子。
     * 🔴 [2026-08-31] 这两个是**全游戏最大的图片缓存**，此前完全没被监控：
     *    · `processedBySrc`：抠绿后的图，static Map、**从不淘汰**，且每张都带自己的 data URL；
     *      注释自陈开局就有 600 张不同的图。
     *    · `unitSpriteCache`：每个兵种 × 6 动作 × 8 向的整套帧。
     *    先让它们在 Shift+F3 里**看得见**，再谈要不要加预算 —— 看不见的东西没法优化。
     */
    public static debugProcessedCount(): number { return this.processedBySrc.size; }
    public static debugUnitSetCount(): number { return this.unitSpriteCache.size; }
    /** 已解码字节：遍历兵种贴图集累加 w×h×4，外加抠绿图的 data URL 字符串 */
    public static debugSpriteBytes(): number {
        let b = 0;
        const seen = new Set<HTMLImageElement>();
        const addImg = (im: HTMLImageElement | null | undefined) => {
            if (!im || seen.has(im)) return;
            seen.add(im);
            b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            if (im.src && im.src.startsWith('data:')) b += im.src.length * 2;
        };
        for (const set of this.unitSpriteCache.values()) {
            for (const key of Object.keys(set as Record<string, unknown>)) {
                const arr = (set as unknown as Record<string, unknown>)[key];
                if (Array.isArray(arr)) for (const im of arr) addImg(im as HTMLImageElement);
            }
        }
        return b;
    }

    private static processImage(img: HTMLImageElement): Promise<HTMLImageElement> {
        // 未就绪的图走原路返回且不入缓存 —— 否则会把没抠绿的原图永久钉死在缓存里
        if (!img.complete || img.naturalWidth === 0) return Promise.resolve(img);
        const key = img.src;
        if (!key) return this.doProcessImage(img);
        const hit = this.processedBySrc.get(key);
        if (hit) return hit;
        const pending = this.doProcessImage(img);
        this.processedBySrc.set(key, pending);
        // 超上限按插入序丢最旧的：它只是派生缓存，丢了下次重抠一遍，不会让贴图缺失。
        while (this.processedBySrc.size > this.PROCESSED_MAX) {
            const oldest = this.processedBySrc.keys().next().value;
            if (oldest === undefined) break;
            this.processedBySrc.delete(oldest);
        }
        return pending;
    }

    private static doProcessImage(img: HTMLImageElement): Promise<HTMLImageElement> {
        return new Promise((resolve) => {
            if (!img.complete || img.naturalWidth === 0) { resolve(img); return; }
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(img); return; }
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 1] > 200 && data[i] < 100 && data[i + 2] < 100) data[i + 3] = 0;
            }
            ctx.putImageData(imageData, 0, 0);
            const newImg = new Image();
            // [2026-08-15 玩家色遮罩] 抠绿后 src 变 data: URL，丢失原始路径；
            // 保留 sourceUrl 供 SpriteTinter 推导同目录 `.pc.png` 遮罩（帝国决定 DE 素材）。
            (newImg as any).sourceUrl = img.src;
            newImg.onload = () => resolve(newImg);
            newImg.src = canvas.toDataURL();
        });
    }

    // [New Standard] 3x3 Grid Offset


    // [POOLED RENDERING] Reuse objects to reduce GC
    private static renderPool: { y: number, drawParams: any }[] = [];
    private static poolIndex = 0;

    // [OFFSET CACHING] Cache grid calculations
    // Key: `${index}_${rows}_${cols}_${spacingX}_${spacingY}_${direction}`
    private static offsetCache: Map<string, { x: number, y: number }> = new Map();

    private static getPooledItem(): { y: number, drawParams: any } {
        if (this.poolIndex >= this.renderPool.length) {
            this.renderPool.push({
                y: 0,
                drawParams: {
                    img: null,
                    sx: 0, sy: 0, sw: 0, sh: 0,
                    dx: 0, dy: 0, dw: 0, dh: 0,
                    alpha: 1, scale: 1 // [NEW] Supports opacity and scale
                }
            });
        }
        return this.renderPool[this.poolIndex++];
    }
    private static resetPool(): void {
        this.poolIndex = 0;
    }

    public static resetUnit(unitId: string): void {
        LegionPhalanxStateManager.reset(unitId);
        // 攻城器械 deathThresholds / spawn / fade 故意保留：
        // 战终后仍靠 wasSiegeUnit 继续画 4s 渐隐；真正清理由 clearSiegeGearState。
    }

    /** 攻城器械相关 Map 全清（渐隐结束 / 单位注销） */
    public static clearSiegeGearState(unitId: string): void {
        this.gearSpawnTicks.delete(unitId);
        this.gearFadeOutStarts.delete(unitId);
        this.gearShuffle.delete(unitId);
        for (const cache of this.siegeGearCaches.values()) {
            cache.deathStarts?.delete(unitId);
            cache.deathThresholds?.delete(unitId);
        }
    }

    /** 单位从渲染器移除：方阵 + 器械状态一并释放 */
    public static disposeUnit(unitId: string): void {
        this.resetUnit(unitId);
        this.clearSiegeGearState(unitId);
        this.resetNavalDeath(unitId);
        NavalPhalanxStateManager.dispose(unitId);
        navalOarPhase.delete(unitId);
        navalOarTick.delete(unitId);
    }

    // [NEW] Helper: Get Frame Count based on Aspect Ratio
    private static getFrameCount(img: HTMLImageElement | null): number {
        if (!img || img.naturalWidth === 0) return 1;
        // If width approx equals height (< 2x), it's single frame (S10DB/NPC)
        if (img.naturalWidth < img.naturalHeight * 2) return 1;
        // 帧数 = 宽/高（每帧正方形）：S10DB 8 帧不变；AoE2 全帧（30~60）也支持（2026-08-15 修「少帧」）
        return Math.max(1, Math.round(img.naturalWidth / img.naturalHeight));
    }

    /**
     * 方阵微动参数（2026-07-18 主人定：只动方阵绘制层，行军 bob + 待机 sway）
     * 振幅按 scale 缩放：直播远观（scale<1）自动收敛为微光感，近看才有明显起伏。
     */
    private static readonly MICRO_MOTION = {
        SWAY_AMP: 0.7,          // 待机呼吸振幅（px，scale=1 基准）
        SWAY_SPEED: 0.0011,     // 待机呼吸角速度（rad/ms，≈5.7s 一次呼吸）
        BOB_INF_AMP: 1.5,       // 步兵行军起伏振幅
        BOB_INF_SPEED: 0.0052,  // 步兵步频：对齐 150ms×8 帧步态循环（约每步一伏）
        BOB_CAV_AMP: 1.4,       // 骑兵起伏振幅
        BOB_CAV_SPEED: 0.0078,  // 骑兵步频：快而碎（小跑）
        BOB_ELE_AMP: 2.0,       // 象兵起伏振幅：更沉
        BOB_ELE_SPEED: 0.0039,  // 象兵步频：更稳
    } as const;

    /** [2026-08-27 §D 浮沉横摇] 船贴「活着」的微动：浮沉(bob)竖向 1~2px + 横摇(roll)小角度，逐船错相。
     *  速度单位 rad/ms（同 MICRO_MOTION）；振幅按 scale 缩放，远观自动收敛为微光感。 */
    private static readonly NAVAL_MICRO = {
        BOB_AMP: 1.2,
        BOB_SPEED: 0.0026,   // ≈2.4s 一次升沉，比步兵(1.2s)更沉
        ROLL_AMP: 0.024,     // 弧度，≈1.4°
        ROLL_SPEED: 0.0021,  // 稍慢于升沉，避免机械同频
    } as const;

    /**
     * 方阵微动偏移：待机/交战 sway（双轴错相呼吸漂移），行军 bob（按兵种分频的步态起伏）。
     * 逐 slot 错开相位，避免整阵同频"僵尸共振"。纯函数只读 tick，不改任何游戏状态。
     */
    private static getMicroMotion(
        slotIndex: number,
        state: PhalanxAnimState,
        unitType: string,
        tick: number,
        scale: number,
    ): { dx: number; dy: number } {
        const MM = LegionPhalanxDrawer.MICRO_MOTION;
        const phase = slotIndex * 0.9;

        if (state === 'MOVE') {
            const isElephant = unitType.includes('elephant');
            // 复用 isCavalryType（含 DE 骑兵）；象兵单独判（isElephant 独立振幅）
            const isCavalry = LegionPhalanxDrawer.isCavalryType(unitType);
            const amp = isElephant ? MM.BOB_ELE_AMP : isCavalry ? MM.BOB_CAV_AMP : MM.BOB_INF_AMP;
            const speed = isElephant ? MM.BOB_ELE_SPEED : isCavalry ? MM.BOB_CAV_SPEED : MM.BOB_INF_SPEED;
            return { dx: 0, dy: Math.sin(tick * speed + phase) * -amp * scale };
        }

        if (state === 'DEATH') return { dx: 0, dy: 0 };

        // IDLE / ATTACK / DAMAGE：双轴呼吸漂移（x、y 频率错开，避免圆周式机械感）
        const amp = MM.SWAY_AMP * scale;
        const t = tick * MM.SWAY_SPEED + phase;
        return { dx: Math.sin(t) * amp, dy: Math.cos(t * 0.83) * amp * 0.7 };
    }

    /**
     * Draw a Legion Phalanx (3x3 Grid or Hex)
     */
    public static draw(
        unitId: string,
        ctx: CanvasRenderingContext2D,
        center: { x: number, y: number },
        state: PhalanxAnimState,
        direction: number,
        scale: number,
        troops: number,
        tick: number = 0,
        hasGeneral: boolean = false,
        isFighting: boolean = false,
        projectFn?: (lat: number, lng: number) => { x: number, y: number },
        unprojectFn?: (x: number, y: number) => { lat: number, lng: number },
        legionType: LegionType = 'infantry',
        factionId: string = 'zhonghua',
        cultureSlots: string[] | null = null,
        unitAssetsId: string = 'light_infantry',
        isPlayer: boolean = false, // [NEW] Identify plain player units
        cultureScales: number[] | null = null, // [NEW] Custom scales
        denseFront: boolean = false, // [2026-08-09 13场景阵型] 第一排 3 步兵 → 3 组 2×4（每组 8 个），贴图/动画沿用原 slot
        /** [2026-08-09 编队独立移动] 9 个格位（编队）各自的额外屏幕偏移（像素），旋转前叠加随 direction 转。
         *  每个编队独立推进时由渲染层传入，静止/非场景为 null → 与改动前逐像素一致。 */
        squadOffsets: readonly { x: number; y: number }[] | null = null,
        /** [2026-08-09 编队独立战斗] 9 个格位各自的动作状态（MOVE/ATTACK/IDLE）；null = 整军 state。
         *  仅覆盖常规动作选择，整军 DEATH/DAMAGE 仍优先（编队级不覆盖死亡/受击）。 */
        squadStates: readonly (string | null)[] | null = null,
        /** [2026-08-09 编队级朝向] 9 个格位各自的朝向（0-7，面向自己的目标）；null = 整军 direction。
         *  默认不传 → 其他 zoom 与改动前逐像素一致。 */
        squadDirections: readonly number[] | null = null,
        /** 五阵型（triangle / echelon / fish_scale / crane_wing / square）；null = 靠 slots.length 兜底（6 人=三角，否则方阵）。 */
        formationMode: FormationMode | null = null
    ): void {
        if (!this.isLoaded) return;

        // --- 1. SETUP & CONFIG ---
        // [CLEANED] Data-driven: cultureSlots defines count. No more hardcoded legionType checks.
        let count = 9; // Default for 3x3
        let gridSize = 3; // Default 3x3
        // 五阵型（2026-08-18）：五种阵型都是 9 人，不能再靠 count===6 区分，必须显式传 formationMode。
        let formationKind: FormationMode = 'square';

        // Priority 1: Use cultureSlots length (from editor / CultureFormations.ts)
        if (cultureSlots && cultureSlots.length > 0) {
            count = cultureSlots.length;
            gridSize = 3;
            // 显式 formationMode 优先；null 时兜底：6 人=三角（旧），否则=方阵
            formationKind = formationMode ?? (count === 6 ? 'triangle' : 'square');
        } else {
            // Priority 2: Try legacy getCompositionTier fallback
            const tier = getCompositionTier(troops, legionType);
            if (tier) {
                gridSize = tier.gridSize;
                count = gridSize * gridSize;
            }
            if (LegionPhalanxDrawer.PURE_CAVALRY_LEGION_TYPES.includes(legionType)) {
                count = 9;
                gridSize = 3;
                formationKind = 'triangle';
            }
        }

        const rows = gridSize;
        const cols = gridSize;

        let strategicSlotTypes: string[] | null = null;
        if (!denseFront) {
            if (cultureSlots && cultureSlots.length > 0) {
                strategicSlotTypes = cultureSlots.map(type => this.resolveStrategicDEUnitType(type));
            } else {
                const tier = getCompositionTier(troops, legionType);
                const expandedSlots = tier ? expandCompositionSlots(tier.slots) : [];
                strategicSlotTypes = (expandedSlots.length > 0 ? expandedSlots : [unitAssetsId])
                    .map(type => this.resolveStrategicDEUnitType(type));
            }

            let waitingForActualAssets = false;
            for (const type of new Set(strategicSlotTypes)) {
                if (this.unitSpriteCache.has(type)) {
                    this.spriteLastUsed.set(type, performance.now());
                    continue;
                }
                this.ensureUnitTypeLoading(type);
                waitingForActualAssets = true;
            }
            if (waitingForActualAssets) return;
        }

        const displayedUnitAssetsId = denseFront
            ? unitAssetsId
            : (strategicSlotTypes?.[0] ?? this.resolveStrategicDEUnitType(unitAssetsId));
        let assets = this.unitSpriteCache.get(displayedUnitAssetsId);

        if (!assets && denseFront) {
            LegionPhalanxDrawer.ensureUnitTypeLoading(displayedUnitAssetsId);
            assets = this.unitSpriteCache.get(legionType);
        }
        if (!assets && denseFront) {
            assets = this.unitSpriteCache.get('mixed');
        }
        if (!assets && denseFront) {
            assets = this.unitSpriteCache.get('light_infantry');
        }
        if (!assets) {
            console.error(`❌ [LPD] CRITICAL: No assets found for ${displayedUnitAssetsId} / ${legionType}. Rendering Aborted.`);
            return;
        }

        // Base Dimension Reference (from Primary Idle)
        const refSprite = assets.IDLE[direction] || assets.IDLE[0];
        if (!refSprite) return;

        const refTotalFrames = this.getFrameCount(refSprite);
        // [2026-08-20 主人：战略地图的兵有点大] 方阵格位间距基准 75 → 68（−10%），与下面单兵
        // 绘制基准 60 → 54 同比例，整个方阵等比缩小、疏密不变。
        // 🔴 只影响非 13（denseFront=false）：13 的间距由 computeDenseSpacing 覆盖、绘制基准另走
        //    分支，逐像素不变（8/9/10 是成品，13 是禁区，这次只动战略地图的观感）。
        const baseHeight = 68; // Standard size for all units

        // [DYNAMIC RATIO]
        // Do NOT force unitRatio here. We calculate it per-sprite in the loop.
        // We just need a rough spacing estimation here.
        // Assuming typical sprite is roughly square-ish or 0.8 ratio.
        const estRatio = 0.8;
        const renderH = baseHeight * scale;
        const estRenderW = renderH * estRatio;

        // [3x3 TUNED] 前后排距拉开为长方形军阵（0.60 兵高），三排层次分明不遮挡
        let spacingX = estRenderW * 0.50;
        let spacingY = renderH * 0.60;
        /** 逐行格位间距（战略地图混编军团用；13 场景不走这条） */
        let rowMetric: { spacingX: number[]; gapY: number[] } | null = null;

        // [2026-08-09 13场景阵型] 主阵 3×3 间距放大到「编队占位尺寸」：
        // 9 个格位 = 9 个编队锚点，按比例分开，避免 8人/6人编队互相重叠（主人截图实锤「9个编队挤在一起」）。
        // 步兵编队最宽（4 列交错并集 ≈ 3.5×0.75 = 2.625 兵宽），主阵间距须大于它并留缝：
        //   squadW = 4.0 兵宽（编队 2.625 + 缝 ≈ 1.4 兵宽）
        //   squadH = 1.6 兵高（编队 2 排深 1.0 + 缝 ≈ 0.6）
        if (denseFront) {
            const dense = LegionPhalanxDrawer.computeDenseSpacing(
                refSprite, refTotalFrames, scale, cultureScales,
            );
            spacingX = dense.x;
            spacingY = dense.y;
        } else {
            // 🔴 [2026-08-18 修·战斗象糊成一坨] 上面那两个间距是**与素材尺寸无关的固定常数**
            //    （estRatio 0.8 + baseHeight 75 全写死），而单兵**绘制尺寸是按素材帧尺寸走的**
            //    （DE 路径 dw = frameW × 60×scale/64）。两者不挂钩 → 帧越大的兵种被压得越狠：
            //      戟兵   48×44  → 画 45×41px，占 30×45px 格 = 横向 1.5 倍重叠（正常的密集队列）
            //      战斗象 104×144 → 画 97×135px，占**同样** 30×45px 格 = 横向 3.3 / 纵向 3.0 倍
            //      → 二十头象叠成一整块，象背的鞍布连成一片（主人实锤「东南亚战斗象」）。
            //    修法：按本兵种真实绘制尺寸给间距加一条**下限，只抬不降**。
            //    基准取素材参考尺寸 64px 见方的标准兵：它按绘制口径画 60×60px、占 30×45px 格，
            //    所以占位比 = 横向 0.5、纵向 0.75 —— 代进去正好还原今天的 30/45，现状零改动。
            //    ⚠️ 别拿上面那个 estRatio(0.8) 推系数：绘制路径根本不用它，用它会算出 37.5 反把
            //       S10DB 全体撑开。系数只能从**绘制口径**（dw = frameW × 60×scale/64）推。
            //    效果：≤ 参考尺寸的兵种间距逐像素不变（戟兵算下来 22.5/30.9，都低于现值 30/45），
            //    超大素材被撑开的倍数正好等于它比标准兵大的倍数 ——
            //    战斗象 30→48.8 / 45→101.3，压叠比回到 2.0 倍，**与所有其他兵种完全一致**。
            const dyn = this.metaDirFor((assets as any).dyn?.IDLE, direction);
            const maxSlotScale = cultureScales && cultureScales.length ? Math.max(...cultureScales) : 1;
            const unitScale = 60 * scale * maxSlotScale / LegionPhalanxDrawer.S10DB_REF_FRAME_H;
            // DE 有 dyn 元数据 → 用真实帧框；S10DB 无 dyn → 用整图比例推（帧为正方形，宽=高）
            const fw = dyn ? dyn.fw : refSprite.height;
            const fh = dyn ? dyn.fh : refSprite.height;
            spacingX = Math.max(spacingX, fw * unitScale * 0.5);
            spacingY = Math.max(spacingY, fh * unitScale * 0.75);

            // 🔴 [2026-09-01] 上面这两个是**全团一个**间距（按最大兵种撑开）。混编军团里
            //    最大的那个会把 9 个格位全撑开 —— 孔雀 2 象 + 7 人，人也按象的间距站位（散）。
            //    这里再按行各算一份，行内用本行兵种的宽、行距取相邻两行较大者；
            //    同尺寸军团每行算出来都一样，退化成上面的值，逐像素不变。
            const layoutForRows = LegionPhalanxDrawer.layoutOf(formationKind);
            if (layoutForRows) {
                const slotTypes: (string | undefined)[] = [];
                for (let i = 0; i < layoutForRows.length; i++) {
                    const raw = cultureSlots && i < cultureSlots.length ? cultureSlots[i] : undefined;
                    slotTypes.push(
                        raw
                            ? (strategicSlotTypes?.[i] ?? this.resolveStrategicDEUnitType(raw))
                            : undefined,
                    );
                }
                rowMetric = LegionPhalanxDrawer.rowMetrics(
                    layoutForRows, slotTypes, spacingX, spacingY, scale, cultureScales, direction,
                    { fw, fh },
                );
            }
        }

        // --- 2. UPDATE STATE ---
        // 全局 DEATH（整军覆灭尸体）：对齐水军——不因 isFighting=false 走和平补员/清态；
        // 用 isFighting=true 保住战中槽位，由下方 DEATH 分支画尸体，保留 CORPSE_DISPLAY_MS。
        // [2026-08-09 阵亡位置] 位置回调叠加编队推进偏移（squadOffsets 旋转前 → 转屏幕）：
        // 否则编队推进后阵亡，deadLat/deadLng 还是「原地」位置，尸体倒在没推进的原地（主人实锤）。
        const currentState = LegionPhalanxStateManager.update(
            unitId, troops, rows, cols, count, direction, tick,
            isFighting || state === 'DEATH',
            center, unprojectFn,
            (idx) => {
                const baseOff = this.getFormationOffset(idx, spacingX, spacingY, direction, legionType, rows, formationKind, rowMetric);
                const squadOff = squadOffsets && squadOffsets[idx];
                if (!squadOff) return baseOff;
                const sa = (direction + 1) * Math.PI / 4;
                const sc = Math.cos(sa);
                const ss = Math.sin(sa);
                return {
                    x: baseOff.x + squadOff.x * sc - squadOff.y * ss,
                    y: baseOff.y + squadOff.x * ss + squadOff.y * sc,
                };
            },
            // [2026-08-09 编队级阵亡] 13 场景（denseFront）：关闭整军随机侵蚀，
            // 槽位死亡改由 squadStates[i]='DEATH' 逐编队驱动（见下方 effState==='DEATH' 分支）。
            // 8/9/10 denseFront=false → skipErosion=false → 整军侵蚀逐像素不变。
            denseFront,
        );

        // 整军 DEATH 且兵力归零：残留 ALIVE 格一并标死，避免只画「活着的站桩」
        if (state === 'DEATH' && troops <= 0) {
            for (const slot of currentState.slots) {
                if (slot.state === 'ALIVE') {
                    slot.state = 'DYING';
                    if (slot.deathDirection === undefined) {
                        slot.deathDirection = Math.floor(Math.random() * 8);
                    }
                    slot.stateStartTime = tick;
                }
            }
        }

        this.resetPool();
        const activeItems: { y: number, drawParams: any }[] = [];
        const totalSlots = currentState.slots.length;

        // --- 3. RENDER LOOP ---
        // [NEW] Spawn Animation Progress（整军 DEATH 尸体不走出场渐显，避免「先全透明」像直接消失）
        const spawnDuration = 800;
        const timeAlive = tick - (currentState.spawnTick || 0);
        const isSpawning = state !== 'DEATH' && timeAlive < spawnDuration && timeAlive >= 0;

        // B. Select Sprite Set & Identify Unit Type (Moved Up for Logic)
        for (let i = 0; i < totalSlots; i++) {
            const slot = currentState.slots[i];
            // [2026-08-09 编队独立战斗] 编队级动作/朝向：squadStates/squadDirections 逐格位覆盖；
            // 整军 DEATH/DAMAGE 仍优先（编队级不覆盖死亡/受击）。默认 null → 整军 state/direction，其他 zoom 不变。
            const effState: PhalanxAnimState = (state === 'DEATH' || state === 'DAMAGE')
                ? state
                : ((squadStates?.[i] ?? state) as PhalanxAnimState);
            const effDir = squadDirections?.[i] ?? direction;
            // [2026-08-10] 13 场景槽位生死的**唯一权威**是编队级 squadStates（整军侵蚀/复活已门控关闭）。
            // 这里补上「编队活着但槽位还是尸体」的回正：进 13 之前在 8/9/10 被整军侵蚀杀掉的槽位，
            // 若不回正就永远缺人（复活逻辑已随侵蚀一起关掉，不会再帮忙补）。
            if (denseFront && squadStates && squadStates[i] && squadStates[i] !== 'DEATH'
                && state !== 'DEATH' && slot.state !== 'ALIVE') {
                slot.state = 'ALIVE';
                slot.stateStartTime = tick;
                slot.deathDirection = undefined;
                slot.deadOffsetX = undefined;
                slot.deadOffsetY = undefined;
                slot.deadLat = undefined;
                slot.deadLng = undefined;
            }
            let currentSet = assets;
            let resolvedUnitType = unitAssetsId; // Default

            // [NEW] 14-culture formation slots override
            if (cultureSlots && i < cultureSlots.length) {
                resolvedUnitType = denseFront
                    ? cultureSlots[i]
                    : (strategicSlotTypes?.[i] ?? this.resolveStrategicDEUnitType(cultureSlots[i]));
                const loadedSet = this.unitSpriteCache.get(resolvedUnitType);
                if (loadedSet) {
                    currentSet = loadedSet;
                    LegionPhalanxDrawer.spriteLastUsed.set(resolvedUnitType, performance.now());
                } else if (!denseFront) {
                    LegionPhalanxDrawer.ensureUnitTypeLoading(resolvedUnitType);
                    continue;
                } else {
                    LegionPhalanxDrawer.ensureUnitTypeLoading(resolvedUnitType);
                }
            } else {
                // [GENERIC FALLBACK] 
                // If no cultureSlots are defined (e.g. legacy or unconfigured army),
                // attempt to resolve via generic getCompositionTier data structure.
                const tier = getCompositionTier(troops, legionType);
                if (tier) {
                    const expandedSlots = expandCompositionSlots(tier.slots);
                    const slotUnitType = expandedSlots[i] || unitAssetsId;
                    resolvedUnitType = denseFront
                        ? slotUnitType
                        : (strategicSlotTypes?.[i] ?? this.resolveStrategicDEUnitType(slotUnitType));
                    const loadedSet = this.unitSpriteCache.get(resolvedUnitType);
                    if (loadedSet) {
                        currentSet = loadedSet;
                        LegionPhalanxDrawer.spriteLastUsed.set(resolvedUnitType, performance.now());
                    } else if (!denseFront) {
                        LegionPhalanxDrawer.ensureUnitTypeLoading(resolvedUnitType);
                        continue;
                    } else {
                        LegionPhalanxDrawer.ensureUnitTypeLoading(resolvedUnitType);
                    }
                }
            }

            // A. Calculate Position
            let drawX: number, drawY: number;
            let dynamicScale = 1.0;
            let dynamicAlpha = 1.0;

            // [NEW] Spawn Animation
            if (isSpawning) {
                const cx = (cols - 1) / 2;
                const cy = (rows - 1) / 2;
                const r = Math.floor(i / cols);
                const c = i % cols;
                const dist = Math.sqrt((r - cy) ** 2 + (c - cx) ** 2);

                const delay = dist * 50;
                const unitTime = timeAlive - delay;

                if (unitTime < 0) {
                    dynamicScale = 0;
                    dynamicAlpha = 0;
                } else {
                    const progress = Math.min(1, unitTime / 400);
                    const back = (t: number) => {
                        const c1 = 1.70158;
                        const c3 = c1 + 1;
                        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
                    };
                    dynamicScale = back(progress);
                    dynamicAlpha = progress;
                }
            } else {
                dynamicScale = 1.0;
                dynamicAlpha = 1.0;
            }

            // Skip if invisible
            if (dynamicAlpha <= 0.01) continue;

            const baseOffset = this.getFormationOffset(i, spacingX, spacingY, direction, legionType, rows, formationKind, rowMetric);
            // [2026-08-09 编队独立移动] 每编队独立推进偏移（像素，旋转前叠加随 direction 转）：
            // getFormationOffset 有缓存（key 不含偏移），返回的是共享对象 → 只读，另建新对象叠加。
            let drawOffset = baseOffset;
            const squadOff = squadOffsets && squadOffsets[i];
            if (squadOff) {
                const sa = (direction + 1) * Math.PI / 4;
                const sc = Math.cos(sa);
                const ss = Math.sin(sa);
                drawOffset = {
                    x: baseOffset.x + squadOff.x * sc - squadOff.y * ss,
                    y: baseOffset.y + squadOff.x * ss + squadOff.y * sc,
                };
            }
            drawX = center.x + drawOffset.x;
            drawY = center.y + drawOffset.y;

            if ((slot.state === 'DEAD' || slot.state === 'DYING') && slot.deadLat && slot.deadLng && projectFn) {
                const proj = projectFn(slot.deadLat, slot.deadLng);
                drawX = proj.x;
                drawY = proj.y;
            } else if (isFighting && slot.state !== 'DEAD' && slot.state !== 'DYING') {
                // 3. JITTER
                // 【2026-08-10 修】13 场景（denseFront）跳过 jitter：主阵间距被放大到编队占位
                // （spacingX ≈ 4 兵宽 ≈ 400px）后，jitterAmt = 8×(spacingX/35) ≈ 91px，
                // 比步兵列距（75px）还大 → 子兵被随机打散、兵与兵交叉重叠，
                // 编队视觉中心偏离锚点（主人实锤「锚点交叉」）。
                // 13 演出档要的是围绕编队中心的严格对称排列；8/9/10 denseFront=false 不变。
                const jitterAmt = denseFront ? 0 : 8 * (spacingX / 35);
                const seed = (i * 9301 + 49297) % 233280;
                const rnd = seed / 233280.0;
                drawX += (rnd - 0.5) * jitterAmt;
                drawY += ((1.0 - rnd) - 0.5) * jitterAmt;
            }

            // 3.5 方阵微动（2026-07-18 主人定：行军 bob + 待机 sway，全项目只此一处）
            // 仅活体士兵；尸体保持静止，出生渐显期不叠加（缩放入场本身已足够动感）
            if (slot.state === 'ALIVE' && !isSpawning) {
                // [2026-08-09 编队独立战斗] 微动按编队级状态（推进中走 bob，到位 sway）
                const mm = LegionPhalanxDrawer.getMicroMotion(i, effState, resolvedUnitType, tick, scale);
                drawX += mm.dx;
                drawY += mm.dy;
            }

            // C. Select Specific Sprite based on State
            // (Note: currentSet is already selected above)
            let rawSprite: HTMLImageElement | undefined;
            let animState = state; // Default to global state

            if (slot.state === 'DYING' || slot.state === 'DEAD') {
                const deathDir = slot.deathDirection ?? direction;
                const picked = LegionPhalanxDrawer.pickDeathFrame(currentSet, deathDir);
                rawSprite = picked.sprite;
                animState = picked.state;
            } else if (state === 'DEATH') {
                // [2026-05-30] 全局 DEATH 状态 (ArmyEditor 预览用)
                // 每兵真随机朝向 (Math.random) + 起始时间
                // slot.deathDirection 设一次后缓存, 不闪
                if (slot.deathDirection === undefined) {
                    slot.deathDirection = Math.floor(Math.random() * 8);
                    slot.stateStartTime = tick;
                }
                const pickedGlobal = LegionPhalanxDrawer.pickDeathFrame(currentSet, slot.deathDirection);
                rawSprite = pickedGlobal.sprite;
                animState = pickedGlobal.state;
            } else if (effState === 'DEATH') {
                // [2026-08-09 编队级阵亡] 编队独立死亡：首次进入把槽位转 DYING
                // （设死亡朝向/起始帧），后续帧走 slot DYING/DEAD 分支播死亡动画 +
                // 尸体保留——与整军侵蚀死亡同构。死亡位置 = 当前位置（drawX/drawY 已含
                // squadOffsets 推进偏移，未设 deadLat 时 950 行直接用当前坐标画尸体）。
                if (slot.state === 'ALIVE') {
                    slot.state = 'DYING';
                    slot.stateStartTime = tick;
                    slot.deathDirection = Math.floor(Math.random() * 8);
                    // 【2026-08-10 修】尸体必须钉在**地面世界坐标**，与侵蚀死亡同一套（见 LegionPhalanxState
                    // 的 deadLat/deadLng）。原来只改 slot.state，954 行的锚定条件不成立 → 尸体退回
                    // 「军团 center + 冻结偏移」，军团一动尸体就跟着飘走（主人此前实锤过同类问题）。
                    // drawX/drawY 已含本编队推进偏移，倒在推进到的位置，不是出发点。
                    if (unprojectFn) {
                        const world = unprojectFn(drawX, drawY);
                        slot.deadLat = world.lat;
                        slot.deadLng = world.lng;
                        slot.deadOffsetX = drawX - center.x;
                        slot.deadOffsetY = drawY - center.y;
                    }
                }
                const deathDir = slot.deathDirection ?? direction;
                const pickedSquad = LegionPhalanxDrawer.pickDeathFrame(currentSet, deathDir);
                rawSprite = pickedSquad.sprite;
                animState = pickedSquad.state;
            } else if (effState === 'DAMAGE') {
                animState = 'DAMAGE';
                rawSprite = currentSet.DAMAGE[effDir] || currentSet.DAMAGE[0];
            } else if (effState === 'ATTACK') {
                // [2026-08-10 修·动作定格] animState 必须跟随编队级状态——它驱动下方帧循环，
                // 漏设时整军兜底 IDLE 会把攻击/移动动画锁死在第 0 帧（主人实锤「没有动作」）。
                animState = 'ATTACK';
                // [2026-08-09 消失修复·进入条件] 轮播只在 SHOOT/CHARGE「本方向帧真实可用」时进——
                // 原来只看数组非空，元素未加载完(complete=false)时取到无效帧 → 1037 跳过整格消失（主人实锤弓骑闪没）。
                const shootFrame = (currentSet as any).SHOOT?.[effDir] ?? (currentSet as any).SHOOT?.[0];
                const chargeFrame = (currentSet as any).CHARGE?.[effDir] ?? (currentSet as any).CHARGE?.[0];
                if (shootFrame && chargeFrame && shootFrame.complete && chargeFrame.complete) {
                    const cycleDuration = 4000;
                    // [2026-08-10 每个编队单独] 13 场景（denseFront）：轮播加格位相位，
                    // 9 编队按 450ms 间隔铺满一圈，各自节奏；8/9/10 denseFront=false → 纯全局 tick 逐像素不变。
                    const cyclePhase = ((tick + (denseFront ? i * 450 : 0)) % cycleDuration) / cycleDuration;
                    if (cyclePhase < 0.25) rawSprite = shootFrame;
                    else if (cyclePhase < 0.50) rawSprite = chargeFrame;
                    else if (cyclePhase < 0.75) rawSprite = currentSet.ATTACK[effDir] || currentSet.ATTACK[0];
                    else rawSprite = shootFrame;
                } else if ((currentSet as any).SHOOT && (currentSet as any).SHOOT.length > 0) {
                    rawSprite = (currentSet as any).SHOOT[effDir] || (currentSet as any).SHOOT[0];
                } else {
                    rawSprite = currentSet.ATTACK[effDir] || currentSet.ATTACK[0];
                }
            } else if (effState === 'MOVE') {
                animState = 'MOVE';
                rawSprite = currentSet.MOVE[effDir] || currentSet.MOVE[0];
            } else {
                animState = 'IDLE';
                rawSprite = currentSet.IDLE[effDir] || currentSet.IDLE[0];
            }

            // Fallback to IDLE if specific action missing
            if (!rawSprite && effState !== 'IDLE') {
                rawSprite = currentSet.IDLE[effDir] || currentSet.IDLE[0];
            }

            // [2026-08-09 消失修复·兜底] 素材未加载完(complete=false / naturalWidth=0)时
            // 退待命帧再试一次——原 1033 兜底只处理「空」，漏掉「加载中」→ 整格消失（主人实锤）。
            // 加载完成自动恢复攻击帧，观众几乎察觉不到。
            if (!rawSprite || !rawSprite.complete || rawSprite.naturalWidth === 0) {
                rawSprite = currentSet.IDLE[direction] || currentSet.IDLE[0];
                if (!rawSprite || !rawSprite.complete || rawSprite.naturalWidth === 0) continue;
            }

            // D. Tinting (Apply Tint)
            // Ideally we cache this, but SpriteTinter has internal cache
            const tintedSprite = SpriteTinter.getTintedSprite(rawSprite, factionId);
            if (!tintedSprite) continue;

            // E. Frame Calculation
            // 🔴 AoE2 DE 动态帧框：帧数/box 尺寸/hotspot 从元数据读；无 dyn = S10DB 正方形帧（getFrameCount）。
            const dynEntry = currentSet.dyn?.[animState];
            // 🔴 [2026-08-15 尸体贴图错乱修复] 死亡动画的朝向是 slot.deathDirection（随机 0-7），
            //    不是编队朝向 effDir。dyn 帧框必须跟着「实际贴图朝向」走——否则 frameW/frameH 用了
            //    错方向的 box（东/西向 120×64 vs 南向 40×112），帧切片 sx=fr*frameW 错位、跨帧切到邻帧内容，
            //    靠旗/身体被切碎、尸体贴图错乱（主人实锤「尸体贴图都不正确」）。
            const dynSpriteDir = animState === 'DEATH' ? (slot.deathDirection ?? direction) : effDir;
            const dynDir = this.metaDirFor(dynEntry, dynSpriteDir);
            const spriteTotalFrames = dynEntry ? dynEntry.frames : this.getFrameCount(tintedSprite);
            let currentFrameIndex = 0;

            if (slot.state === 'ALIVE') {
                if (animState === 'DEATH') {
                    // [2026-05-30] DEATH 不循环, 播 1 次冻结末帧
                    const startT = slot.stateStartTime || tick;
                    const timeDead = tick - startT;
                    const deathFrame = Math.floor(timeDead / 150);
                    currentFrameIndex = Math.min(deathFrame, spriteTotalFrames - 1);
                } else if (animState === 'MOVE' || animState === 'ATTACK' || animState === 'DAMAGE') {
                    // 帧循环
                    // [2026-08-10 每个编队单独] 13 场景（denseFront）：stagger = i（步长 1 与任何帧数互质，
                    // 相邻编队必不同相，9 格全铺满）；8/9/10 denseFront=false → 原 i*2（4 帧素材只有 2 种相位）逐像素不变。
                    const stagger = denseFront ? i : i * 2;
                    // [2026-08-15 主人：ZOOM10 动作太慢] 根因：固定 frameMs（150/75）是 S10DB 8 帧素材时代的遗留，
                    //   DE 全帧素材（30~60 帧）按固定值播 → 移动慢 5 倍、攻击慢 2 倍。
                    //   改为对齐 zoom13 已定稿节奏 + AoE2 DE 原生（DAT frame_duration 实测 walk≈30ms / attack≈37ms）：
                    //   DE 素材按帧数动态算（移动整轮 1s / 攻击整轮 1.5s）；S10DB 8 帧素材保持原速不动。
                    const frameMs = dynEntry
                        ? (animState === 'ATTACK' ? 1500 / spriteTotalFrames : 1000 / spriteTotalFrames)
                        : (animState === 'ATTACK' ? 75 : 150);
                    currentFrameIndex = Math.floor((tick / frameMs) + stagger) % spriteTotalFrames;
                } else {
                    // IDLE: Force Frame 0
                    currentFrameIndex = 0;
                }
            } else if (slot.state === 'DYING' || slot.state === 'DEAD') {
                // Death Animation
                if (spriteTotalFrames === 1) {
                    currentFrameIndex = 0; // Single frame corpse
                } else {
                    const timeDead = tick - slot.stateStartTime;
                    const deathFrame = Math.floor(timeDead / 150);
                    currentFrameIndex = Math.min(deathFrame, spriteTotalFrames - 1);
                }

                // Transition to fully DEAD if anim done
                if (currentFrameIndex >= spriteTotalFrames - 1) {
                    slot.state = 'DEAD';
                }
            }

            // F. Prepare Draw
            // 🔴 AoE2 DE 动态帧框（hotspot 对齐）：帧宽/帧高/hotspot 从元数据读，统一缩放 s，hotspot 对齐单位位置。
            //    S10DB 正方形帧：帧宽=宽/帧数，中心对齐（原逻辑不变）。
            const frameW = dynDir ? dynDir.fw : tintedSprite.width / spriteTotalFrames;
            const frameH = dynDir ? dynDir.fh : tintedSprite.height;
            const frameCol = currentFrameIndex;

            // Pool Item
            const item = this.getPooledItem();
            item.y = drawY + renderH / 2;

            item.drawParams.img = tintedSprite;
            item.drawParams.sx = frameCol * frameW;
            item.drawParams.sy = 0;
            item.drawParams.sw = frameW;
            item.drawParams.sh = frameH;
            item.drawParams.alpha = dynamicAlpha; // Store Alpha

            let scalingFactor = 1.0; // [USER REQUEST] Default to 1.0 exactly.

            // [DYNAMIC RENDERING]
            // If the user has saved custom culture scales from the editor, 
            // those scales OVERRIDE the legacy perspective scaling entirely
            // to ensure 100% visual consistency with the editor's UI grid.
            if (cultureScales && i < cultureScales.length) {
                scalingFactor = cultureScales[i];
            }
            // Apply dynamic scale (spawn animation etc.) into the single scaling factor
            scalingFactor *= dynamicScale;

            // 战略地图军团兵模：非 13 单兵绘制基准 50 → 54（2026-08-30 主人「战略地图士兵稍大一点」）；
            // 13（denseFront）保持 60 不动，13 的对位/前缘半径按 60 算（见 §measure 的 SPRITE_BASE_H）。
            const baseHeight = denseFront ? 60 : 54;
            if (dynDir) {
                // 🔴 DE：统一缩放 s（站立高度 64 参考），hotspot(canvas中心) 对齐单位位置，脚底随动作浮动。
                const s = baseHeight * scale * scalingFactor / 64;
                item.drawParams.dx = drawX - dynDir.hx * s;
                item.drawParams.dy = drawY - dynDir.hy * s;
                item.drawParams.dw = frameW * s;
                item.drawParams.dh = frameH * s;
            } else {
                // S10DB：中心对齐（原逻辑，height-based sizing，脚底不参与）
                const currentRatio = frameW / frameH;
                const frameHeightNorm = frameH / this.S10DB_REF_FRAME_H;
                const targetH = baseHeight * scale * scalingFactor * frameHeightNorm;
                const targetW = targetH * currentRatio;
                item.drawParams.dx = drawX - targetW / 2;
                item.drawParams.dy = drawY - targetH * 0.5;
                item.drawParams.dw = targetW;
                item.drawParams.dh = targetH;
            }

            // [DEBUG] One-time dimension check
            if (!(LegionPhalanxDrawer as any)._debugLogDone && unitAssetsId === 'huaxia_infantry' && (i === 0 || i === 6)) {
                console.log(`🔍 [LPD Analysis] Slot ${i} (${i === 0 ? 'Infantry' : 'Crossbow'}):`,
                    `NatSize: ${tintedSprite.width}x${tintedSprite.height}`,
                    `Frames: ${spriteTotalFrames}`,
                    `FrameSize: ${frameW.toFixed(1)}x${frameH}`,
                    `Ratio: ${(frameW / frameH).toFixed(2)}`,
                    `Render: ${item.drawParams.dw.toFixed(1)}x${item.drawParams.dh.toFixed(1)}`
                );
                if (i === 6) (LegionPhalanxDrawer as any)._debugLogDone = true;
            }

            // [2026-08-10 调试可视化] 13 场景显示编队外框（DEV 门控，生产剥离）：
            // 青色旋转矩形 = 编队占位（宽×纵深按兵种），红短线 = 朝向。
            // 用途：直观检查编队间距 / 接触线 / 「隔空」到底隔多远。
            if (denseFront && import.meta.env.DEV) {
                LegionPhalanxDrawer.debugDrawSquadBox(
                    ctx, drawX, drawY, direction,
                    item.drawParams.dw, item.drawParams.dh, resolvedUnitType,
                );
            }

            // [2026-08-09 13场景阵型] 步兵格 → 4×2 小阵（8 人）/ 骑兵格 → 1-2-3 三角（6 人）/ 远程格 → 2×3（6 人）
            // 克隆同一 slot 的绘制参数（共享状态：同生同死同动画），各自独立战斗单位。
            // 按兵种类型判定：步兵展开 4 列×2 排；骑兵展开 1-2-3 三角；远程展开 2 排×3 列；象兵保持单格。
            if (denseFront && LegionPhalanxDrawer.isInfantryType(resolvedUnitType)) {
                // [2026-08-10 主人：步兵 5×2 十人方阵] 5 列 × 2 排（10 人），排距 0.4（第二排往前）。
                // 🔴 改这里必须同步 getSquadSupportRadius（步兵 halfX/halfY）、
                //    getSquadWidthFactor（= 列并集）、debug depth（= 排并集）。
                const SUB_ROWS = 2; // 2 排（纵深，第二排往前：排距 0.4）
                const SUB_COLS = 5; // 5 列（横向）
                // 子间距：横向列距 = 兵宽 × 0.75，纵深排距 = 兵高 × 0.4（紧凑）
                const subSpacingX = item.drawParams.dw * 0.75;
                const subSpacingY = item.drawParams.dh * 0.4;
                // 锚点 = 本格位中心（item.drawParams.dx/dy 已含 baseOffset 偏移）。
                // 🔴 不再减 baseOffset：item.drawParams.dx 本身就 = center + baseOffset - w/2，
                //    再减 baseOffset 会把 9 个编队全部拉回军团中心重叠（主人实锤「步兵挤成一团」根因，2026-08-09 修）。
                // 🔴 子偏移必须先按「阵内坐标」算，再用 direction 旋转到屏幕——
                //    直接沿屏幕 X 轴排会在军团朝东西时变成纵向（主人截图实锤「竖着」）。
                // 旋转矩阵（与 getFormationOffset 同款：angle = (direction+1)*π/4）
                const fAngle = (direction + 1) * Math.PI / 4;
                const fCos = Math.cos(fAngle);
                const fSin = Math.sin(fAngle);
                const toScreen = (ox: number, oy: number) => ({
                    x: ox * fCos - oy * fSin,
                    y: ox * fSin + oy * fCos,
                });
                for (let sub = 0; sub < SUB_ROWS * SUB_COLS; sub++) {
                    const sr = Math.floor(sub / SUB_COLS); // 0..1
                    const sc = sub % SUB_COLS;             // 0..3
                    const subItem = this.getPooledItem();
                    const dp = subItem.drawParams;
                    dp.img = item.drawParams.img;
                    dp.sx = item.drawParams.sx;
                    dp.sy = item.drawParams.sy;
                    dp.sw = item.drawParams.sw;
                    dp.sh = item.drawParams.sh;
                    // [2026-08-10 5×2 十人方阵·交错] 第二排插第一排间隙（主人 08-09 定的交错，
                    // 5×2 改成对齐后被主人否：「怎么前后对齐啦」）。
                    // 对称交错：排 0 起点 -2.25、排 1 起点 -1.75（偏 +0.5 插缝），并集 ±2.25 列距
                    const localX = ((sr === 0 ? -2.25 : -1.75) + sc) * subSpacingX;
                    const localY = (sr - 0.5) * subSpacingY;
                    const scr = toScreen(localX, localY);
                    dp.dx = item.drawParams.dx + scr.x;
                    dp.dy = item.drawParams.dy + scr.y;
                    subItem.y = item.y + scr.y;
                    dp.dw = item.drawParams.dw;
                    dp.dh = item.drawParams.dh;
                    dp.alpha = item.drawParams.alpha;
                    dp.scale = item.drawParams.scale;
                    activeItems.push(subItem);
                }
            } else if (denseFront && LegionPhalanxDrawer.isCavalryType(resolvedUnitType)) {
                // 1-2-3 等腰三角（6 人）：尖端在前（排 0 单骑），两翼展开（排 1 双骑 / 排 2 三骑）
                // 子间距：翼展(上下) = 兵宽 × 0.64，纵深(前后) = 兵高 × 0.60。
                // 🔴 2026-08-16 主人改：原 0.32/0.35 太挤 → 6 骑叠成圆团、1-2-3 楔形被压没（实机截图实锤）。
                //    放大到 0.64/0.60 让楔形肉眼可见。改此值须同步 getSquadSupportRadius / getSquadWidthFactor / debug depth。
                const triSpacingX = item.drawParams.dw * 0.64;
                const triSpacingY = item.drawParams.dh * 0.60;
                const cAngle = (direction + 1) * Math.PI / 4;
                const cCos = Math.cos(cAngle);
                const cSin = Math.sin(cAngle);
                const toScreenC = (ox: number, oy: number) => ({
                    x: ox * cCos - oy * cSin,
                    y: ox * cSin + oy * cCos,
                });
                for (let sub = 0; sub < 6; sub++) {
                    const pos = LegionPhalanxDrawer.TRIANGLE_LAYOUT[sub] ?? LegionPhalanxDrawer.TRIANGLE_LAYOUT[0];
                    const subItem = this.getPooledItem();
                    const dp = subItem.drawParams;
                    dp.img = item.drawParams.img;
                    dp.sx = item.drawParams.sx;
                    dp.sy = item.drawParams.sy;
                    dp.sw = item.drawParams.sw;
                    dp.sh = item.drawParams.sh;
                    // 阵内坐标：X = c × 0.7×triSpacingX（横向），Y = (r-1) × triSpacingY（纵深，尖端 r=0 在前）
                    const scrC = toScreenC(pos.c * triSpacingX * 0.7, (pos.r - 1.0) * triSpacingY);
                    dp.dx = item.drawParams.dx + scrC.x;
                    dp.dy = item.drawParams.dy + scrC.y;
                    subItem.y = item.y + scrC.y;
                    dp.dw = item.drawParams.dw;
                    dp.dh = item.drawParams.dh;
                    dp.alpha = item.drawParams.alpha;
                    dp.scale = item.drawParams.scale;
                    activeItems.push(subItem);
                }
            } else if (denseFront && LegionPhalanxDrawer.isRangedType(resolvedUnitType)) {
                // [2026-08-10 主人：远程弓手/弩手改为和步兵一样] 5×2 十人方阵（同步兵）。
                // 🔴 改这里必须同步 getSquadSupportRadius（远程 halfX/halfY）、
                //    getSquadWidthFactor、debug depth。
                const subSpacingX = item.drawParams.dw * 0.75;
                const subSpacingY = item.drawParams.dh * 0.4;
                // 旋转矩阵（与步兵/骑兵同款）：方阵随军团 direction 转向，斜向行军不滑步
                const rAngle = (direction + 1) * Math.PI / 4;
                const rCos = Math.cos(rAngle);
                const rSin = Math.sin(rAngle);
                const toScreenR = (ox: number, oy: number) => ({
                    x: ox * rCos - oy * rSin,
                    y: ox * rSin + oy * rCos,
                });
                const R_COLS = 5;
                const R_ROWS = 2;
                for (let sub = 0; sub < R_ROWS * R_COLS; sub++) {
                    const sr = Math.floor(sub / R_COLS); // 0..1
                    const sc = sub % R_COLS;             // 0..4
                    const subItem = this.getPooledItem();
                    const dp = subItem.drawParams;
                    dp.img = item.drawParams.img;
                    dp.sx = item.drawParams.sx;
                    dp.sy = item.drawParams.sy;
                    dp.sw = item.drawParams.sw;
                    dp.sh = item.drawParams.sh;
                    // 阵内相对坐标（5 列交错：排 0 起点 -2.25 / 排 1 起点 -1.75 插缝；2 排 ±0.5）
                    const localX = ((sr === 0 ? -2.25 : -1.75) + sc) * subSpacingX;
                    const localY = (sr - 0.5) * subSpacingY;
                    const scr = toScreenR(localX, localY);
                    dp.dx = item.drawParams.dx + scr.x;
                    dp.dy = item.drawParams.dy + scr.y;
                    subItem.y = item.y + scr.y;
                    dp.dw = item.drawParams.dw;
                    dp.dh = item.drawParams.dh;
                    dp.alpha = item.drawParams.alpha;
                    dp.scale = item.drawParams.scale;
                    activeItems.push(subItem);
                }
            } else if (denseFront && LegionPhalanxDrawer.isSiegeType(resolvedUnitType)) {
                // 1×4 一字横排（2026-08-10 主人「把大象排成一排不要2*2了」——与冲车
                // 4 台一排同风格）。子间距横向 = 兵宽 × 0.75（步兵同款，紧凑）。
                // 🔴 改这里必须同步 getSquadSupportRadius 的攻城 halfX（= 1.5×间距）
                //    与 getSquadWidthFactor（= 3×间距 + 1 精灵）。
                const subSpacingX = item.drawParams.dw * 0.75;
                const subSpacingY = item.drawParams.dh * 0.5;
                // 旋转矩阵（与步兵/骑兵同款）：器械方阵随军团 direction 转向
                const sAngle = (direction + 1) * Math.PI / 4;
                const sCos = Math.cos(sAngle);
                const sSin = Math.sin(sAngle);
                const toScreenS = (ox: number, oy: number) => ({
                    x: ox * sCos - oy * sSin,
                    y: ox * sSin + oy * sCos,
                });
                const S_COLS = 4;
                const S_ROWS = 1;
                for (let sub = 0; sub < S_ROWS * S_COLS; sub++) {
                    const sr = Math.floor(sub / S_COLS); // 0
                    const sc = sub % S_COLS;             // 0..3
                    const subItem = this.getPooledItem();
                    const dp = subItem.drawParams;
                    dp.img = item.drawParams.img;
                    dp.sx = item.drawParams.sx;
                    dp.sy = item.drawParams.sy;
                    dp.sw = item.drawParams.sw;
                    dp.sh = item.drawParams.sh;
                    // 阵内相对坐标（单排居中：y = 0）→ 旋转到屏幕；y 深度排序用旋转后 y
                    const localX = (sc - 1.5) * subSpacingX;
                    const localY = (sr - 0) * subSpacingY;
                    const scr = toScreenS(localX, localY);
                    dp.dx = item.drawParams.dx + scr.x;
                    dp.dy = item.drawParams.dy + scr.y;
                    subItem.y = item.y + scr.y;
                    dp.dw = item.drawParams.dw;
                    dp.dh = item.drawParams.dh;
                    dp.alpha = item.drawParams.alpha;
                    dp.scale = item.drawParams.scale;
                    activeItems.push(subItem);
                }
            } else {
                activeItems.push(item);
            }
        }

        // --- 4. FLUSH ---
        activeItems.sort((a, b) => a.y - b.y);
        // [FIX 2026-07-28] 原来是「设成 p.alpha，再硬重置成 1.0」，两处都错：
        //   · 设值时覆盖了外层透明度，而不是与之相乘
        //   · 重置成 1.0 而非恢复原值 ⇒ 一旦有一个兵 alpha<1，其后所有兵都被拉回全不透明
        // 外层调用方是会设 globalAlpha 的（GlobalUnitRenderer 的尸体渐隐、器械渐隐），
        // 这样写会把外层的淡出整个抹掉。改为先存基准、按基准相乘、再恢复基准。
        // 目前 p.alpha<1 只出现在出场动画，与尸体渐隐碰不到一起，属提前堵住的隐患。
        const baseAlpha = ctx.globalAlpha;
        for (let i = 0; i < activeItems.length; i++) {
            const p = activeItems[i].drawParams;
            if (p.alpha < 1) ctx.globalAlpha = baseAlpha * p.alpha;
            ctx.drawImage(p.img, p.sx, p.sy, p.sw, p.sh, p.dx, p.dy, p.dw, p.dh);
            if (p.alpha < 1) ctx.globalAlpha = baseAlpha;
        }
    }

    /** 舰队逐艘阵亡起始时间（参考陆军 PhalanxAnimState 逐兵阵亡） */
    private static navalDeathStarts = new Map<string, number[]>();

    public static resetNavalDeath(unitId: string): void {
        this.navalDeathStarts.delete(unitId);
    }

    /** 为舰队分配逐艘阵亡起始时间（首次进入 DEATH 时调用）：队尾先沉、旗舰最后。 */
    private static ensureNavalDeathStarts(unitId: string, shipCount: number, now: number): number[] {
        let starts = this.navalDeathStarts.get(unitId);
        if (!starts) {
            // 索引 0=旗舰，索引 shipCount-1=队尾；队尾 delayMs 最小（先沉），旗舰最大（最后沉）
            const delayMs: number[] = [];
            for (let i = 0; i < shipCount; i++) {
                delayMs.push((shipCount - 1 - i) * 300);
            }
            starts = delayMs.map(d => now + d);
            this.navalDeathStarts.set(unitId, starts);
        }
        return starts;
    }

    /** 兵力驱动的舰队队形（2026-08-19 主人定）：旗舰居前，后随成列。
     *  ≤4 艘单纵队（内河/海峡横向最窄不蹭岸）；≥5 艘旗舰 + 后方双列交错（纵向段数压到 ~4 行）。
     *  r 为沿朝向的段距，单位 = 一条船长（旗舰 0，后随为负 = 朝航向反方向排）；c 为横向（±0.5 船宽交错）。 */
    private static navalFormation(
        shipCount: number,
        mode: NavalFormationMode = 'auto',
        shipId: NavalShipAssetId = 'LOU_CHUAN',
    ): { r: number; c: number; ship: NavalShipAssetId }[] {
        const formation: { r: number; c: number; ship: NavalShipAssetId }[] = [
            { r: 0, c: 0, ship: shipId },
        ];

        // [2026-08-20] 队形改为可配置（军团编辑器「海军阵型」），auto = 下面的旧行为逐像素不变。
        if (mode === 'line') {
            // 一字横阵：全队与航向垂直排开，舷侧齐射面最大。左右交替向外长，旗舰居中。
            for (let i = 1; i < shipCount; i++) {
                const k = Math.ceil(i / 2);
                formation.push({ r: 0, c: (i % 2 === 1 ? -k : k), ship: shipId });
            }
            return formation;
        }
        if (mode === 'wedge') {
            // 楔形雁行：旗舰居前，后随向两翼斜后方展开（每多一对，后退一段、外扩一列）
            for (let i = 1; i < shipCount; i++) {
                const k = Math.ceil(i / 2);
                formation.push({ r: -k, c: (i % 2 === 1 ? -k * 0.6 : k * 0.6), ship: shipId });
            }
            return formation;
        }
        if (mode === 'column' || (mode === 'auto' && shipCount <= 4)) {
            // 单纵队：后随船依次向后排
            for (let i = 1; i < shipCount; i++) {
                formation.push({ r: -i, c: 0, ship: shipId });
            }
        } else {
            // 双列：后 4~7 艘分两列交错（左右各一行，最后单艘补左列）
            let r = 1;
            for (let i = 1; i < shipCount; i++) {
                const col = (i % 2 === 1) ? -0.5 : 0.5;   // ±0.5 × 船宽 = 两列中心隔一个船宽
                formation.push({ r: -r, c: col, ship: shipId });
                if (i % 2 === 0) r += 1;
            }
        }
        return formation;
    }

    /**
     * 航迹方向与当前朝向是否一致（最新段方向与朝向夹角 < 45°）。
     * 行进中：航迹 = 刚走过的路 = 当前朝向 → true，沿航迹排（转弯跟河道弯）；
     * 静止/待命/攻城面向：航迹是过去的旧路线，方向 ≠ 当前朝向 → false，改按当前朝向排纵队。
     * [2026-08-21 修·并排不并列] 原无条件沿航迹排：待命船队船头朝东、船队却沿旧南北航迹堆叠（主人实锤）。
     * @param hx/hy 船头方向单位向量（= (sin, -cos)，旋转矩阵 x 轴 (cos,sin) 是船头顺时针 90°，非船头本身）
     */
    private static trailAlignedWithHeading(trail: { x: number; y: number }[], hx: number, hy: number): boolean {
        const n = trail.length;
        if (n < 2) return false;
        const a = trail[n - 1], b = trail[n - 2];
        const dx = a.x - b.x, dy = a.y - b.y;
        const len = Math.hypot(dx, dy);
        if (len < 0.001) return false;
        const dot = (dx / len) * hx + (dy / len) * hy;
        return dot > Math.cos(Math.PI / 4); // 夹角 < 45° 视为同向
    }

    /** 沿航迹取点：从队尾（最新点，靠近旗舰）往回走 distAlong 弧长，落在两采样点间线性插值。 */
    private static trailPointAt(trail: { x: number; y: number }[], distAlong: number): { x: number; y: number } {
        let acc = 0;
        for (let j = trail.length - 1; j > 0; j--) {
            const a = trail[j], b = trail[j - 1];
            const seg = Math.hypot(a.x - b.x, a.y - b.y);
            if (acc + seg >= distAlong) {
                // 🔴 [2026-08-19 修] 插值方向原先是反的（`b + (a-b)*t`）：
                //   t=0 表示"恰好落在较新点 a 上"却返回了较旧点 b，t=1 反过来返回 a，
                //   每个航迹段内后随船都会反向滑一遍 → 队列抖动、间距忽大忽小。
                //   正确是从 a（新）朝 b（旧）走 t 段：a + (b-a)*t。
                const t = (distAlong - acc) / (seg || 1);
                return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
            }
            acc += seg;
        }
        // 🔴 [2026-08-19 修] 航迹总长不够时原先 `return trail[0]` —— 所有排不下的后随船
        //   **全部堆在航迹最老那一个点上**，实测：27000 兵（3 艘）画不出船、60000（5 艘）只见 4 艘、
        //   90000（8 艘）只见 5 艘且互相重叠，且航迹越攒越长船越来越多。
        //   刚下水、刚转向、低速船队都会撞上（航迹按 16px 采样，8 艘要 6.4 个船身长的航迹才排得满）。
        //   改为沿最老一段的方向继续外推：航迹用完就顺着它的来向延长，队列始终完整。
        const tail = trail[1] ?? trail[0];
        const oldest = trail[0];
        const ex = oldest.x - tail.x, ey = oldest.y - tail.y;
        const elen = Math.hypot(ex, ey);
        if (elen < 0.001) return oldest;          // 航迹退化成一个点 → 无方向可外推
        const rest = distAlong - acc;
        return { x: oldest.x + (ex / elen) * rest, y: oldest.y + (ey / elen) * rest };
    }

    /**
     * 航迹折线（2026-08-27 §A 蛇形跟随）：pts[0] = 旗舰当前点，往后越来越老；cum = 自旗舰起的累积弧长。
     * 一次构建、多次二分采样，避免每艘船各扫一遍 64 点航迹。
     */
    private static buildNavalPath(
        center: { x: number; y: number },
        trail: { x: number; y: number }[] | undefined,
    ): { pts: { x: number; y: number }[]; cum: number[] } {
        const pts: { x: number; y: number }[] = [{ x: center.x, y: center.y }];
        const cum: number[] = [0];
        if (trail) {
            for (let i = trail.length - 1; i >= 0; i--) {
                const q = trail[i];
                const last = pts[pts.length - 1];
                const d = Math.hypot(last.x - q.x, last.y - q.y);
                if (d < 0.5) continue;   // 与上一点几乎重合（地图缩放后航迹会挤在一起）
                pts.push({ x: q.x, y: q.y });
                cum.push(cum[cum.length - 1] + d);
            }
        }
        return { pts, cum };
    }

    /**
     * 沿航迹从旗舰向后回溯 dist 像素取点，返回坐标 + 当地切线角（屏幕数学角，指向前进方向）。
     * 航迹短于 dist（刚下水 / 直线航行采样稀疏）→ 沿最后一段直线外推，
     * 航迹为空 → 完全退化成 fallbackAng 直线，即改动前的刚体阵型，逐像素一致。
     */
    private static sampleNavalPath(
        path: { pts: { x: number; y: number }[]; cum: number[] },
        dist: number,
        fallbackAng: number,
    ): { x: number; y: number; ang: number } {
        const { pts, cum } = path;
        const d = Math.max(0, dist);
        const head = pts[0];
        if (pts.length < 2) {
            return { x: head.x - Math.cos(fallbackAng) * d, y: head.y - Math.sin(fallbackAng) * d, ang: fallbackAng };
        }
        const total = cum[cum.length - 1];
        if (d >= total) {
            // 航迹用尽：沿最老一段的方向继续外推
            const a = pts[pts.length - 2], b = pts[pts.length - 1];
            const ang = Math.atan2(a.y - b.y, a.x - b.x);
            const over = d - total;
            return { x: b.x - Math.cos(ang) * over, y: b.y - Math.sin(ang) * over, ang };
        }
        // 二分定位所在段 [i, i+1]
        let lo = 0, hi = cum.length - 1;
        while (lo + 1 < hi) {
            const mid = (lo + hi) >> 1;
            if (cum[mid] <= d) lo = mid; else hi = mid;
        }
        const a = pts[lo], b = pts[lo + 1];
        const segLen = cum[lo + 1] - cum[lo];
        const t = segLen > 0.0001 ? (d - cum[lo]) / segLen : 0;
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
            ang: Math.atan2(a.y - b.y, a.x - b.x),   // 老 → 新 = 前进方向
        };
    }

    public static drawNaval(
        ctx: CanvasRenderingContext2D,
        center: { x: number; y: number },
        state: PhalanxAnimState,
        direction: number,
        scale: number,
        troops: number,
        tick: number,
        factionId: string,
        lockedShipId: NavalShipAssetId | null = null,
        unitId: string = '',
        trail?: { x: number; y: number }[],
        /**
         * 旗舰精确航向（度，北=0 顺时针）。给了就用它算「量化残差角」做微旋（§B），
         * 消除 16 向 22.5° 的台阶跳；不给则按 direction 反推（残差 0 = 改动前行为）。
         */
        headingDeg?: number,
        /**
         * [2026-08-27 §② 划桨随速] 舰队当前世界速度相对海速底的归一值（≈1 常态，>1 快，0=停）。
         * 驱动划桨帧率：快船快桨、慢船慢桨、停船收桨。缺省 1 = 改动前 150ms 固定步。
         */
        speedFactor?: number,
    ): void {
        // 兵力驱动纵队舰队（2026-08-19 主人定）：船数随兵力、旗舰领航、后随成列。
        // 海军船贴图略微缩小（baseHeight 72），避免靠港/围城时遮挡过重。
        const baseHeight = 72;
        // 海军阵型来自军团编辑器的势力配置；没配过 = 'auto'（旧行为，逐像素不变）
        const navalMode: NavalFormationMode =
            (FACTION_COMPOSITIONS as any)[factionId]?.navalFormation ?? 'auto';

        // 逐舰阵亡状态更新（2026-07-18）：参照 LegionPhalanxStateManager 模式
        const isFighting = state === 'ATTACK' || state === 'DAMAGE';
        let navalState: NavalUnitState | undefined;
        if (unitId) {
            // 🔴 [2026-08-19] 这里原本每帧调 NavalPhalanxStateManager.reset()，已删除。
            //   reset 会 delete 整个 state（含航迹），而军团航行时 state 恒为 MOVE、
            //   isFighting 恒为 false —— 于是航迹每帧被清空、后随船永远走退化直线排开，
            //   §4 要的「转弯跟着河道弯」从未真正生效过。
            //   脱战恢复满编现在由 update() 自己负责（非战斗 + 有沉船/档位变 → 重建），
            //   既保住航迹，也不必每帧置空重建。
            navalState = NavalPhalanxStateManager.update(unitId, troops, isFighting, tick);
            // 跟拍换了船队 → 三条节流归零，新船队从干净相位起算（否则会继承旧队的冷却/待播落水）
            if (navalSfxUnitId !== unitId) {
                navalSfxUnitId = unitId;
                lastNavalFireAt = 0;
                lastNavalCannonAt = 0;
                pendingNavalSplashAt = 0;
            }
            const nowMs = Date.now();

            // 海战沉没音效：本帧有新船沉没（playNavalSfx 内部判跟拍军团，非跟拍静默）
            //   最后一艘沉 = 全队覆没 → 改播爆炸（旗舰殉爆），比第 5 声普通沉没更像收尾。
            if (navalState.justSank > 0) {
                const stillAlive = navalState.ships.some((sh) => sh.state === 'ALIVE');
                audioManager.playNavalSfx(unitId, stillAlive ? 'naval_sink' : 'naval_explode');
            }
            // 海战开火音效：ATTACK 状态周期性触发（仅跟拍军团实际发声）
            //   箭声 1.2s 一轮；炮声 2.6s 一轮，且只有旗舰档（ship_large 在编队里恒存在）开炮。
            if (isFighting) {
                if (nowMs - lastNavalFireAt > 1200 && audioManager.playNavalSfx(unitId, 'naval_arrow_fire')) {
                    lastNavalFireAt = nowMs;
                }
                if (nowMs - lastNavalCannonAt > 2600 && audioManager.playNavalSfx(unitId, 'naval_cannon_fire')) {
                    lastNavalCannonAt = nowMs;
                    // 这一发是否打空：打空才排落水声，命中就没有落水
                    pendingNavalSplashAt =
                        Math.random() < NAVAL_SPLASH_CHANCE ? nowMs + NAVAL_SPLASH_DELAY_MS : 0;
                }
            }
            // 炮弹落水：到点就播一次并清零（脱战也要播完 —— 炮已经出膛了，半路静音更怪）
            if (pendingNavalSplashAt > 0 && nowMs >= pendingNavalSplashAt) {
                pendingNavalSplashAt = 0;
                audioManager.playNavalSfx(unitId, 'naval_cannon_splash');
            }
        }

        // 🔴 [2026-08-23 修·沉没突然消失] 船数取 state 稳定值：战斗中 troops 减员时
        //   navalState.ships 保持编队满员逐舰沉没（DYING 渐隐→DEAD），若这里仍按当前兵力
        //   shipCountForTroops(troops) 现算，编队会随 troops 缩短、队尾沉没中的船被直接裁掉
        //   不渲染 = 突然消失。无 unitId/首次无 state 时才按 troops 兜底。
        // 确定文化专属战舰（每文化一种，舰队统一）
        const targetShipId: NavalShipAssetId = (lockedShipId && lockedShipId !== 'ship_small' && lockedShipId !== 'ship_medium' && lockedShipId !== 'ship_large')
            ? lockedShipId
            : getCultureNavalShip((FACTION_COMPOSITIONS as any)[factionId]?.region, factionId);

        const shipCount = navalState?.shipCount ?? shipCountForTroops(troops);
        const formation = this.navalFormation(shipCount, navalMode, targetShipId);

        // 按所需船型准备贴图集与绘制尺寸；缺任一档 → 触发懒加载，等下一帧
        interface NavalTypeDraw {
            set: NonNullable<ReturnType<typeof LegionPhalanxDrawer.getUnitAssets>>;
            totalFrames: number;
            w: number;
            h: number;
            /** DE 动态帧框（hotspot 对齐）：统一缩放 s = baseHeight×scale/64。
             *  🔴 [2026-08-27] 帧框不再在这里定死一个方向——蛇形跟随后每艘船朝向都不同，
             *     改为存 dynEntry，在船循环里按**该船自己的** shipDir 查框。 */
            s?: number;
            dyn?: boolean;
            dynEntry?: { dirs16?: boolean; frames: number; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> };
        }
        const typeDraws = new Map<NavalShipAssetId, NavalTypeDraw>();
        const neededShips = Array.from(new Set(formation.map(f => f.ship)));
        for (const typeId of neededShips) {
            const set = this.unitSpriteCache.get(typeId);
            const sample = set?.IDLE[direction] || set?.IDLE[0];
            if (!set || !sample?.complete || sample.naturalWidth === 0) {
                this.ensureUnitTypeLoading(typeId);
                return;
            }
            // 🔴 DE 动态帧框（hotspot 对齐）：每向 box 尺寸不同，用 _meta.json 的 fw/fh/hx/hy + 统一缩放 s。
            //    S10DB 走正方形帧（旧逻辑）：frameH 每向一致，按高算 h。
            // 🔴 [2026-08-20 修复战船裁切] 战船是 16 向素材 → 元数据键统一走 metaDirFor(…, true)；
            //    旧代码直接查 dirs[direction] 取到一半宽的框，船被竖直切掉半条（主人实锤）。
            const dynEntry = (set as any).dyn?.IDLE;
            if (dynEntry && this.metaDirFor(dynEntry, direction, true)) {
                const s = baseHeight * scale * getNavalShipDrawScale(typeId) / 64;
                typeDraws.set(typeId, { set, totalFrames: dynEntry.frames, w: 0, h: 0, s, dyn: true, dynEntry });
            } else {
                const totalFrames = this.getFrameCount(sample);
                const frameW = sample.width / totalFrames;
                const frameH = sample.height;
                const h = baseHeight * scale * (frameH / this.S10DB_REF_FRAME_H) * getNavalShipDrawScale(typeId);
                typeDraws.set(typeId, { set, totalFrames, w: h * (frameW / frameH), h });
            }
        }

        // 编队间距以旗舰（首舰）尺寸为基准。
        // 🔴 [2026-08-19 修·叠船] 纵向间距基准 = 船长（fw）× 1.15，配 formation 的 r 步进 1.0 → 船距 1.15 船长。
        // 🔴 [2026-08-19 实测修] 横向基准 = 整个船宽，c=±0.5 → 两列中心隔一个船宽，刚好不叠。
        const flagship = typeDraws.get(targetShipId) || typeDraws.values().next().value;
        if (!flagship) return;
        const flagDyn = flagship.dyn ? this.metaDirFor(flagship.dynEntry, direction, true) : undefined;
        const flagshipW = flagDyn ? flagDyn.fw * flagship.s! : flagship.w;
        const shipDepth = flagshipW * 1.15;
        const shipSpread = flagshipW;

        // 对角朝向 c 轴加 0.15 补偿视觉压缩；正朝向不变。
        // 🔴 [2026-08-21 16 向] d16%4==0 = 视觉 45° 对角 →1.15；%4==2 = 正方向 →1.0；奇数 = 22.5° 中间向 →1.075。
        const dMod4 = direction % 4;
        const cMult = dMod4 === 2 ? 1.0 : (dMod4 === 0 ? 1.15 : 1.075);

        // 🔴 [2026-08-27 §A 蛇形跟随 + §B 残差微旋] —— 「航行丝滑」的两处核心改动。
        //   旧实现：整队走一个刚体旋转矩阵（origX·cos−origY·sin），旗舰一转，后面 7 条船同一帧
        //   横移到新位置，像一块钢板在拐弯；且朝向量化到 16 向后残差直接丢掉，转弯 22.5° 一跳。
        //   新实现：
        //     ① 后随船沿旗舰**走过的航迹**回溯定位（航迹早就在采样了，一路传下来却被丢掉），
        //        每船朝向 = 自己所在那段航迹的切线 → 转弯自动排成蛇形，也不会切弯插上岸。
        //     ② 每船各自量化出 16 向帧，量化丢掉的 ±11.25° 用 ctx.rotate 补回去，台阶消失。
        //   无航迹（军团编辑器预览、刚下水第一帧）→ sampleNavalPath 退化为直线，逐像素回到旧行为。
        const headDeg = headingDeg ?? (45 + 22.5 * direction);
        const flagAng = headDeg * Math.PI / 180 - Math.PI / 2;   // 屏幕数学角（前进方向）
        const path = this.buildNavalPath(center, trail);
        const smoothSpan = shipDepth * 0.45;   // 切线取前后各半档船距的弦向，抹掉 16px 采样锯齿

        // 收集舰队各舰位置（旗舰 + 后随），逐舰读取阵亡状态
        const ships: { ax: number; ay: number; ox: number; oy: number; r: number; img: HTMLImageElement; sx: number; sy: number; sw: number; sh: number; w: number; h: number; alpha?: number; rot: number; bobY?: number; roll?: number }[] = [];
        const shipPositions: { x: number; y: number; r: number; isAlive: boolean; dir: number }[] = [];

        for (let i = 0; i < formation.length; i++) {
            const pos = formation[i] ?? formation[0];
            const td = typeDraws.get(pos.ship)!;
            const currentSet = td.set;

            // ① 沿航迹定位：backDist = 该船落后旗舰多少像素（r 为负代表后方）
            const backDist = -pos.r * shipDepth;
            let node: { x: number; y: number };
            let localAng: number;
            if (backDist <= 0.0001) {
                // 旗舰（及横列阵同排船）：位置就是逻辑点，朝向永远用精确航向，不受航迹采样抖动影响
                node = { x: center.x, y: center.y };
                localAng = flagAng;
            } else {
                node = this.sampleNavalPath(path, backDist, flagAng);
                const a0 = this.sampleNavalPath(path, backDist - smoothSpan, flagAng);
                const a1 = this.sampleNavalPath(path, backDist + smoothSpan, flagAng);
                localAng = Math.atan2(a0.y - a1.y, a0.x - a1.x);
            }
            // ② 横向偏移沿当地法线（与旧刚体式 (cos angle, sin angle) 同向：angle = localAng + π/2）
            const origX = pos.c * shipSpread * cMult;
            const dx = node.x + origX * -Math.sin(localAng);
            const dy = node.y + origX * Math.cos(localAng);

            // ③ 该船自己的 16 向帧 + 量化残差角
            let shipDeg = (localAng + Math.PI / 2) * 180 / Math.PI;
            shipDeg = ((shipDeg % 360) + 360) % 360;
            const shipDir = ((Math.round((shipDeg - 45) / 22.5) % 16) + 16) % 16;
            let resDeg = shipDeg - (45 + 22.5 * shipDir);
            while (resDeg > 180) resDeg -= 360;
            while (resDeg < -180) resDeg += 360;
            const shipRot = resDeg * Math.PI / 180;

            // [2026-08-27 §D 浮沉横摇] 逐船错相微动：浮沉竖移 + 横摇小角度。只叠在贴图绘制上，
            //   不动舰队逻辑位/尾迹（wake 仍踩逻辑位，1~2px 浮沉不会脱节）。
            //   相位 = 舰队 id 哈希(0..2π) + 船位序 i×1.7：同舰队不错频，跨舰队也不同步。
            let unitPhase = 0;
            if (unitId) {
                let h = 0;
                for (let k = 0; k < unitId.length; k++) h = (h * 31 + unitId.charCodeAt(k)) | 0;
                unitPhase = (h % 628) / 100;
            }
            const microPhase = unitPhase + i * 1.7;
            const bobY = Math.sin(tick * LegionPhalanxDrawer.NAVAL_MICRO.BOB_SPEED + microPhase) * -LegionPhalanxDrawer.NAVAL_MICRO.BOB_AMP * scale;
            const roll = Math.sin(tick * LegionPhalanxDrawer.NAVAL_MICRO.ROLL_SPEED + microPhase * 1.3) * LegionPhalanxDrawer.NAVAL_MICRO.ROLL_AMP;

            // 逐舰读取个体状态（2026-07-18）
            const shipSlot = navalState?.ships[i];
            const shipDying = shipSlot?.state === 'DYING';
            const shipDead = shipSlot?.state === 'DEAD';
            const isShipAlive = !shipDead && !shipDying && state !== 'DEATH';
            shipPositions.push({ x: dx, y: dy, r: pos.r, isAlive: isShipAlive, dir: shipDir });

            let rawSprite: HTMLImageElement | undefined;
            let currentFrameIndex = 0;

            let shipAlpha: number | undefined;
            if (shipDead) {
                // 残骸：定格在死亡动画最后一帧，随军团尸体一同渐隐；无 death 帧（DE 桨帆船）→ 已沉没，不画
                if (currentSet.DEATH.length === 0) continue;
                rawSprite = currentSet.DEATH[shipSlot.deathDirection] || currentSet.DEATH[0];
                currentFrameIndex = td.totalFrames - 1;
            } else if (shipDying) {
                // 逐舰阵亡动画：用该舰的 stateStartTime 驱动；无 death 帧 → idle 兜底 + 渐隐淡出
                const timeDead = Math.max(0, tick - shipSlot.stateStartTime);
                if (currentSet.DEATH.length === 0) {
                    rawSprite = currentSet.IDLE[shipDir] || currentSet.IDLE[0];
                    currentFrameIndex = 0;
                    shipAlpha = Math.max(0, 1 - timeDead / 5000);
                } else {
                    rawSprite = currentSet.DEATH[shipSlot.deathDirection] || currentSet.DEATH[0];
                    currentFrameIndex = Math.min(Math.floor(timeDead / 150), td.totalFrames - 1);
                }
            } else if (state === 'DEATH') {
                // 全局 DEATH（战斗结束残余舰统一沉没）；无 death 帧 → 淡出
                const starts = this.ensureNavalDeathStarts(unitId, formation.length, tick);
                const timeDead = Math.max(0, tick - (starts[i] ?? tick));
                if (currentSet.DEATH.length === 0) {
                    rawSprite = currentSet.IDLE[shipDir] || currentSet.IDLE[0];
                    currentFrameIndex = 0;
                    shipAlpha = Math.max(0, 1 - timeDead / 5000);
                } else {
                    rawSprite = currentSet.DEATH[shipDir] || currentSet.DEATH[0];
                    currentFrameIndex = Math.min(Math.floor(timeDead / 150), td.totalFrames - 1);
                }
            } else if (state === 'DAMAGE') {
                rawSprite = currentSet.DAMAGE[shipDir] || currentSet.DAMAGE[0];
                currentFrameIndex = Math.floor((tick + i * 80) / 150) % td.totalFrames;
            } else if (state === 'ATTACK') {
                rawSprite = currentSet.ATTACK[shipDir] || currentSet.ATTACK[0];
                currentFrameIndex = Math.floor((tick + i * 80) / 150) % td.totalFrames;
            } else if (state === 'MOVE') {
                rawSprite = currentSet.MOVE[shipDir] || currentSet.MOVE[0];
                // [2026-08-27 §② 划桨随速] 浆速贴真实船速：speedFactor>1 快浆、<1 慢浆、≈0 收浆锚泊。
                //   连续相位累加（本帧推进 dt/oarMs 帧）：变速只影响后续推进，不会让帧跳到任意处。
                const oarMs = Math.max(55, Math.min(600, 150 / Math.max(0.05, speedFactor ?? 1)));
                const prevTick = navalOarTick.get(unitId) ?? tick;
                navalOarTick.set(unitId, tick);
                // dt 钳到 120ms：舰队闲置/战斗后回归 MOVE 时不猛跳，日常 60fps(≈17ms) 不受影响。
                const dtMs = Math.min(120, Math.max(0, tick - prevTick));
                const phase = (navalOarPhase.get(unitId) ?? 0) + dtMs / oarMs;
                navalOarPhase.set(unitId, phase);
                currentFrameIndex = Math.floor(phase + i * 0.18) % td.totalFrames;
            } else {
                rawSprite = currentSet.IDLE[shipDir] || currentSet.IDLE[0];
            }
            if (!rawSprite?.complete || rawSprite.naturalWidth === 0) continue;

            const tintedSprite = SpriteTinter.getTintedSprite(rawSprite, factionId);
            if (!tintedSprite) continue;

            if (td.dyn) {
                // DE：hotspot 对齐。帧框按该船自己的朝向查；缺该向元数据 → 回落旗舰向（typeDraws 已确认存在）
                const dd = this.metaDirFor(td.dynEntry, shipDir, true) ?? this.metaDirFor(td.dynEntry, direction, true)!;
                ships.push({
                    ax: dx, ay: dy, ox: -dd.hx * td.s!, oy: -dd.hy * td.s!, r: pos.r,
                    img: tintedSprite,
                    sx: currentFrameIndex * dd.fw, sy: 0, sw: dd.fw, sh: dd.fh,
                    w: dd.fw * td.s!, h: dd.fh * td.s!,
                    alpha: shipAlpha, rot: shipRot, bobY, roll,
                });
            } else {
                const tfw = tintedSprite.width / td.totalFrames;
                ships.push({
                    ax: dx, ay: dy, ox: -td.w / 2, oy: -td.h / 2, r: pos.r,
                    img: tintedSprite,
                    sx: currentFrameIndex * tfw, sy: 0, sw: tfw, sh: tintedSprite.height,
                    w: td.w, h: td.h,
                    alpha: shipAlpha, rot: shipRot, bobY, roll,
                });
            }
        }

        // ─── 船只水上拖尾与浪花（NavalWakeDrawer：DE 16 向 WAKE_BACK / WAKE_FRONT）───
        NavalWakeDrawer.drawNavalWakes(
            ctx,
            shipPositions,
            direction,
            scale,
            tick,
            state === 'MOVE',
            trail,
            shipDepth,
        );

        // 队尾先画、旗舰最后画（旗舰盖在最上层）
        ships.sort((a, b) => a.r - b.r);
        for (const s of ships) {
            if (s.alpha !== undefined && s.alpha < 1) ctx.globalAlpha = s.alpha;
            // 🔴 [2026-08-27 §B] rot = 16 向量化丢掉的残差角（|rot| ≤ 11.25°），绕逻辑点（ax/ay）旋转消除台阶。
            //    [2026-08-27 §D] 再叠 roll（横摇小角度）与 bobY（浮沉竖移）；浮沉只移绘制 y，不动逻辑位/尾迹。
            const tRot = s.rot + (s.roll ?? 0);
            const tY = s.ay + (s.bobY ?? 0);
            if (Math.abs(tRot) > 0.001) {
                ctx.save();
                ctx.translate(s.ax, tY);
                ctx.rotate(tRot);
                ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, s.ox, s.oy, s.w, s.h);
                ctx.restore();
            } else {
                ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, s.ax + s.ox, tY + s.oy, s.w, s.h);
            }
            if (s.alpha !== undefined && s.alpha < 1) ctx.globalAlpha = 1;
        }
    }

    // [NEW] Custom Formation Offset Calculation
    // ─── 攻城器械通用绘制（2026-07-18）────────────────────────────

    /** 绘制所有攻城器械（冲车、井阑等） */
    public static drawSiegeGear(
        ctx: CanvasRenderingContext2D,
        center: { x: number, y: number },
        state: PhalanxAnimState,
        direction: number,
        scale: number,
        tick: number,
        spacingX: number,
        spacingY: number,
        unitId: string,
        troops: number,
        /**
         * 攻城团整体复制偏移，**单位是像素**（阵内坐标，旋转前叠加，随 direction 一起转）。
         * 用像素是为了能和 3×3 编队格位对齐——两边的「格」不是同一个单位
         * （器械走 ramSpacing≈30px，编队格位走 getDenseSquadSpacing）。
         * 默认单个 {0,0} = 与改动前逐像素一致，其他 zoom 不受影响。
         */
        groupOffsets: readonly { x: number; y: number }[] = [{ x: 0, y: 0 }],
    ): void {
        // [2026-08-09 13锁死] 13 战斗场景：编队推进 state=MOVE / 交战 ATTACK，战斗仍在进行——
        // 器械不得因非 ATTACK 状态误判「胜利渐隐」而淡出消失（主人实锤 13 看不到冲车）。
        // 13 下器械一律定格攻击姿态（与士兵同节奏），仅 zoom 已到 13 才生效。
        const scene13 = (window as any).game?.battleScene?.isActive?.() === true
            && ((window as any).gameMap?.getLeafletMap?.().getZoom?.() ?? 0) >= 13;
        if (scene13 && state !== 'DEATH') {
            state = 'ATTACK';
            LegionPhalanxDrawer.gearFadeOutStarts.delete(unitId);
        }
        // 多器械类型共用 unitId 的 spawn/fade 标记；整轮画完后再删，避免同帧后几种器械重开渐隐
        let fadeFullyDone = false;
        for (const gearType of Object.keys(LegionPhalanxDrawer.SIEGE_GEAR_DEFS) as string[]) {
            drawSingleGear(gearType);
        }
        if (fadeFullyDone) {
            LegionPhalanxDrawer.clearSiegeGearState(unitId);
        }

        function drawSingleGear(origType: string): void {
            // 冲车独立编队（13 场景，主人 2026-08-09 定）：不随 4 攻城团复制，
            // 4 台一字横排顶在最前排中央——冲车攻城门，后排够不到城门，只能一排 4 个。
            // 横向间距 2.5 格（≈105px，冲车宽 ≈103px，几乎不重叠）；
            // 偏移单位 = 格（×spacingX/Y），叠加在 ram 自身「第一排前」posOffset 之上；
            // 其余器械仍走 groupOffsets（像素，整团复制）。
            const ramFrontExtra = [
                { x: -3.75, y: -1.2 }, { x: -1.25, y: -1.2 },
                { x: +1.25, y: -1.2 }, { x: +3.75, y: -1.2 },
            ] as const;
            const useRamFront = origType === 'ram'
                && (window as any).game?.battleScene?.isActive?.() === true
                // 13 锁死：仅 zoom 已到 13 才独立排冲车（flyTo 途中/非 13 保持整团复制）
                && ((window as any).gameMap?.getLeafletMap?.().getZoom?.() ?? 0) >= 13;
            const offsets = useRamFront ? ramFrontExtra : groupOffsets;
            // [2026-08-09 主人定] 4 个攻城团各自独立随机：井阑/投石互换按团索引取映射，
            // 团与团之间的器械分布不再相同。
            for (let gi = 0; gi < offsets.length; gi++) {
                const g = offsets[gi];
                // 井阑/投石 4 个位置随机交换：用互换类型的精灵帧，保持原坐标
                let type = origType;
                let extraPosOverride: { x?: number; y?: number } = {};
                if ((LegionPhalanxDrawer.SHUFFLE_GEAR_KEYS as readonly string[]).includes(origType)) {
                    const shuffle = LegionPhalanxDrawer.ensureGearShuffle(unitId, gi);
                    if (shuffle[origType] !== (origType.startsWith('catapult') ? 'catapult' : 'well')) {
                        type = origType.startsWith('catapult')
                            ? (origType === 'catapult_l' ? 'well_lan' : 'well_lan_r')
                            : (origType === 'well_lan' ? 'catapult_l' : 'catapult_r');
                        const rawDef = (LegionPhalanxDrawer.SIEGE_GEAR_DEFS as any)[origType];
                        extraPosOverride = { x: rawDef.posOffsetX, y: rawDef.posOffsetY };
                    }
                }
                const cache = LegionPhalanxDrawer.getGearCache(type);
                const def = (LegionPhalanxDrawer.SIEGE_GEAR_DEFS as any)[type];

                if (!cache.loaded) {
                    void LegionPhalanxDrawer.ensureSiegeGearLoaded(type);
                    continue;
                }

            // 战斗结束 + 兵力 > 0 = 胜利，器械渐隐
            if (state !== 'ATTACK' && state !== 'DEATH' && troops > 0) {
                if (!LegionPhalanxDrawer.gearFadeOutStarts.has(unitId)) {
                    LegionPhalanxDrawer.gearFadeOutStarts.set(unitId, tick);
                }
                const fadeStart = LegionPhalanxDrawer.gearFadeOutStarts.get(unitId)!;
                const fadeElapsed = tick - fadeStart;
                if (fadeElapsed >= LegionPhalanxDrawer.GEAR_FADE_OUT_DURATION) {
                    // 渐隐完毕，清本器械状态；共享 spawn/fade 等整轮结束后再删
                    cache.deathStarts.delete(unitId);
                    cache.deathThresholds.delete(unitId);
                    fadeFullyDone = true;
                    continue;
                }
                // 继续画，alpha 由下面统一处理
            } else {
                // 战斗中，清除渐隐标记
                LegionPhalanxDrawer.gearFadeOutStarts.delete(unitId);
            }

            // 首次攻城：记录渐显起始 tick
            if (!LegionPhalanxDrawer.gearSpawnTicks.has(unitId)) {
                LegionPhalanxDrawer.gearSpawnTicks.set(unitId, tick);
            }
            const spawnStart = LegionPhalanxDrawer.gearSpawnTicks.get(unitId)!;
            const spawnElapsed = tick - spawnStart;
            let gearAlpha = Math.min(1, spawnElapsed / LegionPhalanxDrawer.GEAR_SPAWN_DURATION);

            // 胜利渐隐（与渐显取较暗值：速胜时器械未显全，若直接覆盖会先跳亮再淡出）
            const fadeOutStart = LegionPhalanxDrawer.gearFadeOutStarts.get(unitId);
            if (fadeOutStart !== undefined) {
                const fadeElapsed = tick - fadeOutStart;
                gearAlpha = Math.min(gearAlpha, Math.max(0, 1 - fadeElapsed / LegionPhalanxDrawer.GEAR_FADE_OUT_DURATION));
            }

            // 随机阵亡阈值，首次设置
            if (!cache.deathThresholds.has(unitId)) {
                cache.deathThresholds.set(unitId, 0.05 + Math.random() * 0.90);
            }
            const threshold = cache.deathThresholds.get(unitId)!;

            const phState = LegionPhalanxStateManager.getState(unitId);
            const maxT = phState?.maxTroops ?? troops;
            const aliveRatio = maxT > 0 ? troops / maxT : 0;

            if (!cache.deathStarts.has(unitId) && aliveRatio <= threshold) {
                cache.deathStarts.set(unitId, tick);
            }
            const gearDead = cache.deathStarts.has(unitId);

            const dirIdx = ((direction % 8) + 8) % 8;
            let sprite: HTMLImageElement | null = null;
            let frameCount = 1;
            let frameIndex = 0;

            if (state === 'DEATH' || gearDead) {
                sprite = cache.deathSprites[dirIdx] ?? null;
                if (!sprite || !sprite.complete || sprite.naturalWidth === 0) continue;
                frameCount = Math.floor(sprite.width / sprite.height);
                let deathStart = cache.deathStarts.get(unitId);
                if (deathStart === undefined) {
                    deathStart = tick;
                    cache.deathStarts.set(unitId, deathStart);
                }
                const elapsed = tick - deathStart;
                frameIndex = Math.min(Math.floor(elapsed / 150), frameCount - 1);
            } else if (state === 'ATTACK' || fadeOutStart !== undefined) {
                // [修复 2026-07-18] 胜利渐隐期 state 已非 ATTACK，原先掉进末尾 return 导致器械瞬间消失
                // （4 秒渐隐计时空转、无物可画）。渐隐期继续画攻击贴图，帧定格在战斗结束瞬间。
                sprite = cache.attackSprites[dirIdx] ?? null;
                if (!sprite || !sprite.complete || sprite.naturalWidth === 0) continue;
                frameCount = Math.floor(sprite.width / sprite.height);
                const speed = def.frameSpeed ?? 150;
                const animTick = fadeOutStart !== undefined ? fadeOutStart : tick;
                frameIndex = (Math.floor((animTick / speed)) + (def.frameStagger ?? 0)) % frameCount;
            } else {
                continue;
            }

            const frameW = sprite.width / frameCount;
            const frameH = sprite.height;

            // ── 位置 ──
            const angle = (direction + 1) * Math.PI / 4;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const baseOffX = extraPosOverride.x ?? def.posOffsetX;
            const baseOffY = extraPosOverride.y ?? def.posOffsetY;

            // ── 尺寸 ──
            const baseHeight = 60;
            const currentRatio = frameW / frameH;
            const frameHeightNorm = frameH / LegionPhalanxDrawer.S10DB_REF_FRAME_H;
            const targetH = baseHeight * scale * def.scaleMul * frameHeightNorm;
            const targetW = targetH * currentRatio;

            const sx = frameIndex * frameW;
            const prevAlpha = ctx.globalAlpha;
            ctx.globalAlpha = prevAlpha * gearAlpha;

            // 攻城团整体复制：团偏移在旋转前加到器械自身偏移上，整团随 direction 一起转。
            // groupOffsets 默认单元素 {0,0} → 与改动前逐像素一致。
            // 冲车（useRamFront）不走团复制：4 台一字横排顶最前，偏移是格单位 ×spacing。
            // 当前团 = 外层 gi 循环的 g（每团独立随机器械分布）。
            const origX = useRamFront
                ? (baseOffX + g.x) * spacingX
                : baseOffX * spacingX + g.x;
            const origY = useRamFront
                ? (baseOffY + g.y) * spacingY
                : baseOffY * spacingY + g.y;
            const gx = center.x + (origX * cos - origY * sin);
            const gy = center.y + (origX * sin + origY * cos);
            ctx.drawImage(
                sprite,
                sx, 0, frameW, frameH,
                gx - targetW / 2, gy - targetH * 0.5, targetW, targetH,
            );
            ctx.globalAlpha = prevAlpha;
            } // end for gi（攻城团循环）
        }
    }

    /** 攻城额外士兵（弓步兵）已删除（2026-08-16 主人定：攻城只留 5 件器械） */

    private static getFormationOffset(
        index: number,
        spacingX: number,
        spacingY: number,
        direction: number,
        type: LegionType,
        gridSizeInput?: number,
        formationMode: FormationMode = 'square',
        /** 逐行间距（见 rowMetrics）：给了就按行摆，没给退回全团统一间距 */
        rowMetric?: { spacingX: number[]; gapY: number[] } | null,
    ): { x: number, y: number } {
        const rowKey = rowMetric
            ? `${rowMetric.spacingX.map((v) => v.toFixed(1)).join(',')}|${rowMetric.gapY.map((v) => v.toFixed(1)).join(',')}`
            : '';
        const key = `${index}_${direction}_${spacingX.toFixed(2)}_${spacingY.toFixed(2)}_${type}_${gridSizeInput}_${formationMode}_${rowKey}`;

        if (this.offsetCache.has(key)) {
            return this.offsetCache.get(key)!;
        }

        let originalX = 0;
        let originalY = 0;

        // --- FORMATION LOGIC ---
        const layout = index < 9 ? this.layoutOf(formationMode) : null;
        if (layout) {
            const pos = layout[index] ?? layout[0];
            // 逐行度量：行内用该行自己的横向间距，行距用相邻两行的较大者（中间行为基准 y=0）。
            // 没有逐行度量时退回原公式 (pos.r - 1.0) * spacingY / pos.c * spacingX，逐像素不变。
            if (rowMetric && rowMetric.spacingX.length > pos.r) {
                originalX = pos.c * rowMetric.spacingX[pos.r];
                const mid = 1;   // 3 排编成的中间排
                let y = 0;
                if (pos.r > mid) for (let r = mid; r < pos.r; r++) y += rowMetric.gapY[r] ?? spacingY;
                else if (pos.r < mid) for (let r = pos.r; r < mid; r++) y -= rowMetric.gapY[r] ?? spacingY;
                originalY = y;
            } else {
                originalY = (pos.r - 1.0) * spacingY;
                originalX = pos.c * spacingX;
            }
        } else {
            const gridSize = gridSizeInput || 3;
            const rows = gridSize;
            const cols = gridSize;
            const r = Math.floor(index / cols);
            const c = index % cols;

            const centerX = (cols - 1) / 2;
            const centerY = (rows - 1) / 2;

            originalX = (c - centerX) * spacingX;
            originalY = (r - centerY) * spacingY;
        }

        // [ROTATION]
        // Rotate the formation based on direction
        const angle = (direction + 1) * Math.PI / 4;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const result = {
            x: originalX * cos - originalY * sin,
            y: originalX * sin + originalY * cos
        };

        if (this.offsetCache.size > 2000) this.offsetCache.clear();
        this.offsetCache.set(key, result);

        return result;
    }
}

// [2026-08-31] 登记进 PerfDoctor 体检。这两个是全游戏最大的图片缓存，
//   此前完全在监控之外 —— 「卡但查不出来」的一大盲区。
if (import.meta.env.DEV) {
    // 开发期暴露给控制台/AI 体检用（验按需加载有没有把 SECONDARY/TERTIARY 载全）
    (window as any).LegionPhalanxDrawer = LegionPhalanxDrawer;
    perfDoctor.registerCache({
        name: 'LegionPhalanxDrawer:unitSpriteCache(兵种帧集)',
        where: 'src/map/legion/LegionPhalanxDrawer.ts:unitSpriteCache',
        entries: () => LegionPhalanxDrawer.debugUnitSetCount(),
        bytes: () => LegionPhalanxDrawer.debugSpriteBytes(),
        // [2026-08-31] 已经有字节预算 + LRU 淘汰了，登记信息要跟上，
        // 否则报告里一直误报 cache-unbounded/critical，把真问题淹掉。
        limitKind: 'bytes',
        limitValue: 2000 * 1024 * 1024,
        churn: () => LegionPhalanxDrawer.debugChurn(),
    });
    perfDoctor.registerCache({
        name: 'LegionPhalanxDrawer:processedBySrc(抠绿图·从不淘汰)',
        where: 'src/map/legion/LegionPhalanxDrawer.ts:processedBySrc',
        entries: () => LegionPhalanxDrawer.debugProcessedCount(),
        // 这个 Map 存的是 Promise，取不到实际字节；条目数已能暴露量级，
        // 真实字节由上面 unitSpriteCache 那条覆盖（同一批图）。
        bytes: () => 0,
        limitKind: 'count',
        limitValue: 1200,
    });
}
