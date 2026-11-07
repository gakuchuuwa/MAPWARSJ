import { getFactionCultureRegion } from '../config/portrait_defaults';
import { getRegionLegionComposition, getFactionCompositionSlots } from '../types/CultureFormations';
import { WAR_TYPES } from '../data/WarTypes';
import { isShipUnitKey } from '../data/generalHeroUnits';
import { GameConfig } from '../config/GameConfig';
/**
 * PlayerHero —— 玩家单骑（乱入者）在战略地图上的本体。
 *
 * 设计（2026-09-05 主人定）：
 *   · 玩家是一个"乱入者"，不属于任何军团管理器：不进 LegionManager、不触发攻城/野战/AI/减兵，
 *     只借 Army 的道路行军与渲染注册（GlobalUnitRenderer 按 isPlayerHero 单独画一个精灵）。
 *   · 点据点 → 沿路网前往；抵达后由 PlayerQuestSystem 接管对话。
 *   · 接任务后"入伍"（attachTo）到任务军团：位置逐帧贴军团，镜头跟军团即跟玩家；
 *     军团开打进 13 时，Scene13WarLayer 通过 buildScene13Setup 把玩家放到本方前排前面。
 *   · 当前功劳定官职；离开势力功劳清零、官职重来（新势力从斥候做起），历史最高官职只当资历，管离队能选哪里。
 */
import { Army } from '../legion/Army';
import type { GameMap } from '../map/GameMap';
import { getCultureNavalShip } from '../types/NavalShipTiers';
import type { City } from '../types/core';
import { roadRegistry } from '../roads/RoadRegistry';
import { getTourChain } from './TourRoutes';
import { getEuclideanDistance, joinStartToRoadPolyline } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';
import { getCityAnchoredGenerals } from '../data/CityGeneralBridge';
import { isGeneralOnStage } from '../data/generalOnStage';
import { getScriptEventStart } from '../events/scriptPeriod';
import { HorseStable, type HorseStableSave } from './HorseStable';
import {
    clonePlayerPeakStats,
    createInitialPlayerPeakStats,
    mergePlayerPeakFromUnit,
    restorePlayerPeakStats,
    type PlayerPeakStats,
} from './PlayerGrowth';
import {
    PLAYER_CITY_ARRIVE_DIST,
    PLAYER_DEFEAT_HOLD_MS,
    PLAYER_ELITE_SQUAD_TROOPS,
    heroKeyForRank,
    factionlessAppearancePriority,
    PLAYER_START_SHIP_KEY,
    PLAYER_BUILTIN_SHIP_KEYS,
    moveClassForHeroKey,
    type PlayerRankId,
    PLAYER_HERO_NAME,
    PLAYER_HERO_SPEED_MULT,
    PLAYER_PLAIN_SPEED_SCALE,
    PLAYER_MOUNTAIN_SPEED_SCALE,
    PLAYER_SEA_SPEED_SCALE,
    PLAYER_RANKS,
    PLAYER_KILL_MERIT,
    PLAYER_BATTLE_MERIT_CAP,
    rankFor,
    type PlayerRank,
} from './PlayerConfig';
import { moderateLiveName } from '../live/LiveNameModeration';

/** 自动模式的三套玩法：乱斗模式（现行开局默认，全部武将恒在场）、百岁模式（按登场年～百岁出现）、剧本模式（按历史顺序去战场）（主人 2026-10-18 定；🔴 2026-10-24 主人令恢复百岁默认）。 */
export type PlayerAutoPlan = 'centenarian' | 'script' | 'melee';
export type PlayerPlayMode = 'auto' | 'rest' | 'globe' | 'sail';

/** 从 fromLng 往西走到 toLng 要跨多少经度（0~360，跨 180° 经线自动接续） */
function westwardDeg(fromLng: number, toLng: number): number {
    return (((fromLng - toLng) % 360) + 360) % 360;
}

/**
 * 🔴 [2026-11-02 主人令「在代码中实装这一套严格的环球单向无回头路推进算法」]
 *    单向向西无回头：目标经度差必须严格向西推进，绝不回退到全部候选（严禁反向挑选东侧城市）。
 */
function pickWestward<T extends { longitude: number }>(cands: T[], fromLng: number): T[] {
    const near = cands.filter((c) => {
        const d = westwardDeg(fromLng, c.longitude);
        return d >= 3.5 && d <= 85;
    });
    if (near.length > 0) return near;
    const half = cands.filter((c) => {
        const d = westwardDeg(fromLng, c.longitude);
        return d >= 1.5 && d < 165;
    });
    return half;
}

/**
 * 历史远洋大航海主干针路网（郑和下西洋 + 达·伽马好望角印度航线 + 麦哲伦—埃尔卡诺环球航线 + 哥伦布大西洋航线 + 马尼拉大帆船航线）：
 * - 占婆（阇槃）直航满剌加（马六甲）或龙牙门（淡马锡/新加坡），不绕进暹罗湾（吞武里）；
 * - 锡兰（加勒）—古里（卡利卡特）/果阿横渡印度洋直抵阿丹（亚丁）或木骨都束（摩加迪沙）、慢八撒（蒙巴萨），不钻入波斯湾（巴士拉/奥拉/卡拉奇）与红海死胡同；
 * - 沿斯瓦希里海岸（蒙巴萨—基尔瓦—莫桑比克）南下好望角（开普敦），北上佛得角（里贝拉），跨大西洋经里约（瓜纳巴拉）至麦哲伦海峡（圣胡利安港），横渡太平洋至阿加尼亚（关岛）—马尼拉，再返航广州（番禺）/泉州（刺桐）或经香料群岛（德尔纳特）—爪哇（巴达维亚）重返好望角。
 */
const HISTORICAL_SAIL_NEXT: Record<string, string[]> = {
    city_nanghar: ['city_zonggu', 'city_baizhu'],
    city_baizhu: ['city_moyoro'],
    city_moyoro: ['city_zonggu'],
    city_zonggu: ['city_katsuyama'],
    city_bailao: ['city_genjo', 'city_xiantai'],
    city_katsuyama: ['city_genjo'],
    city_genjo: ['city_xiantai'],
    city_xiantai: ['city_edo'],
    city_edo: ['city_junfucheng'],
    city_kamakura: ['city_junfucheng', 'city_okafu'],
    city_junfucheng: ['city_himeji', 'city_noshima'],
    city_himeji: ['city_noshima', 'city_okafu'],
    city_okafu: ['city_akaogicheng'],
    city_noshima: ['city_chijianguan'],
    city_songshan: ['city_funei', 'city_chijianguan'],
    city_chijianguan: ['city_yuanzhishi', 'city_suncheon_k'],
    city_funei: ['city_satsuma', 'city_xingzhuting'],
    city_satsuma: ['city_akaogicheng'],
    city_akaogicheng: ['city_akakinagusuku'],
    city_akakinagusuku: ['city_shuri'],
    city_shuri: ['city_qingyuan_zj', 'city_diaoyudao', 'city_gugudao'],
    city_gugudao: ['city_diaoyudao', 'city_mudan'],
    city_diaoyudao: ['city_mengjia'],
    city_mengjia: ['city_fuzhou'],
    city_mudan: ['city_fuzhou'],
    city_yuanzhishi: ['city_taizaifu', 'city_jindo'],
    city_taizaifu: ['city_qingyuan_zj', 'city_goto'],
    city_goto: ['city_qingyuan_zj', 'city_nagasaki'],
    city_nagasaki: ['city_qingyuan_zj', 'city_tainan', 'city_aomen'],
    city_gimhae: ['city_qingyuan_zj', 'city_tsushima'],
    city_tsushima: ['city_goto', 'city_satsuma', 'city_suncheon_k'],
    city_suncheon_k: ['city_xingzhuting'],
    city_xingzhuting: ['city_shanghai'],
    city_hanseong: ['city_haeju', 'city_sabi'],
    city_haeju: ['city_sabi'],
    city_sabi: ['city_jindo'],
    city_jindo: ['city_wendeng', 'city_xingzhuting'],
    city_kaesong: ['city_pidao', 'city_wendeng'],
    city_pidao: ['city_dengzhou'],
    city_shanhaiguan: ['city_piaoyujin', 'city_beishacheng', 'city_wendeng'],
    city_piaoyujin: ['city_beishacheng', 'city_dengzhou'],
    city_beishacheng: ['city_dengzhou'],
    city_dengzhou: ['city_sabi'],
    city_wendeng: ['city_shanghai'],
    city_shanghai: ['city_hangzhou', 'city_taizhou_zj', 'city_fuzhou'],
    city_hangzhou: ['city_qingyuan_zj'],
    city_qingyuan_zj: ['city_taizhou_zj'],
    city_taizhou_zj: ['city_qingjingsi', 'city_fuzhou'],
    city_fuzhou: ['city_zhangzhou', 'city_dupan'],
    city_zhangzhou: ['city_penghu', 'city_manila'],
    city_penghu: ['city_qingjingsi', 'city_tainan'],
    city_tainan: ['city_manila', 'city_pattani'],
    city_qingjingsi: ['city_panyu', 'city_donghai'],
    city_panyu: ['city_dupan', 'city_haikang'],
    city_aomen: ['city_malacca', 'city_manila'],
    city_haikang: ['city_yazhou'],
    city_yuntun: ['city_yian', 'city_hepu'],
    city_hepu: ['city_yazhou'],
    city_yian: ['city_yazhou'],
    city_donghai: ['city_yazhou'],
    city_yazhou: ['city_dupan'],
    city_dupan: ['city_malacca', 'city_danmaxi'],
    city_tunwuli: ['city_danmaxi'],
    city_pattani: ['city_danmaxi', 'city_sanfoqi'],
    city_danmaxi: ['city_sanfoqi'],
    city_sanfoqi: ['city_malacca', 'city_batavia'],
    city_valparaiso: ['city_rapanui', 'city_lima'],
    city_lima: ['city_rapanui', 'city_banama', 'city_nicaragua'],
    city_banama: ['city_acapulco'],
    city_nicaragua: ['city_acapulco'],
    city_acapulco: ['city_honolulu'],
    city_rapanui: ['city_tahiti'],
    city_tahiti: ['city_mua', 'city_honolulu'],
    city_honolulu: ['city_mua', 'city_nanmadol'],
    city_mua: ['city_nanmadol'],
    city_hagatna: ['city_manila', 'city_cebu'],
    city_manila: ['city_panyu', 'city_cebu', 'city_huoluo'],
    city_cebu: ['city_deernate'],
    city_huoluo: ['city_teluowulan', 'city_deernate'],
    city_deernate: ['city_batavia', 'city_teluowulan', 'city_ambon'],
    city_ambon: ['city_batavia', 'city_banda'],
    city_banda: ['city_wandan'],
    city_teluowulan: ['city_wandan'],
    city_wandan: ['city_yaqi'],
    city_malacca: ['city_yaqi', 'city_jiale', 'city_batavia'],
    city_batavia: ['city_malacca'],
    city_mauritius: ['city_cape_town'],
    city_jidagang: ['city_kolkata', 'city_danmoledi', 'city_danta'],
    city_danmoledi: ['city_danta'],
    city_danta: ['city_kelunpo'],
    city_kolkata: ['city_malacca'],
    city_thaton: ['city_puli', 'city_yaqi'],
    city_puli: ['city_madras', 'city_jiale'],
    city_madras: ['city_jiale'],
    city_yaqi: ['city_jiale', 'city_kelunpo', 'city_quilon'],
    city_jiale: ['city_guli', 'city_mauritius'],
    city_kelunpo: ['city_cochin', 'city_guoa'],
    city_quilon: ['city_jiale'],
    city_cochin: ['city_malindi', 'city_mombasa', 'city_guoa'],
    city_guli: ['city_mogadishu', 'city_aden'],
    city_guoa: ['city_aden'],
    city_mumbai: ['city_guli', 'city_kalaqi'],
    city_surat: ['city_mogadishu', 'city_aden'],
    city_suomunate: ['city_malindi', 'city_mogadishu', 'city_surat'],
    city_bashila: ['city_hormuz', 'city_aola'],
    city_aola: ['city_kalaqi', 'city_suomunate'],
    city_kalaqi: ['city_mogadishu', 'city_hormuz'],
    city_hormuz: ['city_mogadishu', 'city_malindi', 'city_aden'],
    city_beileinisi: ['city_jida', 'city_zeila'],
    city_jida: ['city_zeila', 'city_aden'],
    city_zeila: ['city_aden', 'city_mogadishu'],
    city_aden: ['city_mogadishu', 'city_barawa'],
    city_mogadishu: ['city_mombasa'],
    city_barawa: ['city_malindi', 'city_mombasa', 'city_kilwa'],
    city_kilwa: ['city_malindi'],
    city_malindi: ['city_mozambique'],
    city_mombasa: ['city_mozambique'],
    city_mozambique: ['city_cape_town'],
    city_cape_town: ['city_sainthelena', 'city_luanda'],
    city_luanda: ['city_sainthelena', 'city_elmina'],
    city_sainthelena: ['city_ribeira', 'city_salvador'],
    city_elmina: ['city_ribeira'],
    city_ribeira: ['city_salvador'],
    city_shengpidebao: ['city_sidedegelmo', 'city_kenisibao'],
    city_talin: ['city_sidedegelmo', 'city_kenisibao'],
    city_liga: ['city_sidedegelmo', 'city_shiqieqing', 'city_gebenhagen'],
    city_sidedegelmo: ['city_weishibi'],
    city_kenisibao: ['city_weishibi', 'city_rostock'],
    city_gdansk: ['city_weishibi', 'city_gebenhagen'],
    city_weishibi: ['city_lubeck', 'city_shiqieqing'],
    city_shiqieqing: ['city_gothenburg'],
    city_gebenhagen: ['city_rostock', 'city_aidingbao'],
    city_rostock: ['city_gothenburg'],
    city_gothenburg: ['city_hague'],
    city_beiergen: ['city_hamburg'],
    city_lubeck: ['city_beiergen'],
    city_hamburg: ['city_amsterdam', 'city_hague', 'city_bruges', 'city_lundun'],
    city_bruges: ['city_lundun'],
    city_amsterdam: ['city_angra', 'city_telde', 'city_lundun'],
    city_hague: ['city_angra', 'city_calais'],
    city_boergong: ['city_aidingbao', 'city_yinfeineisi'],
    city_yinfeineisi: ['city_aidingbao'],
    city_aidingbao: ['city_dublin'],
    city_kanafeng: ['city_dublin', 'city_dunadd'],
    city_dublin: ['city_dunadd'],
    city_dunadd: ['city_limerick'],
    city_limerick: ['city_angra', 'city_kanpeier'],
    city_lundun: ['city_calais'],
    city_calais: ['city_bordeaux'],
    city_plymouth: ['city_angra', 'city_jiadisi', 'city_bordeaux'],
    city_kanpeier: ['city_bordeaux'],
    city_bordeaux: ['city_boertu'],
    city_nantes: ['city_angra', 'city_lisiben'],
    city_boertu: ['city_lisiben'],
    city_lisiben: ['city_angra', 'city_telde', 'city_labate'],
    city_jiadisi: ['city_angra', 'city_telde'],
    city_labate: ['city_telde'],
    city_telde: ['city_ribeira', 'city_bermuda'],
    city_angra: ['city_bermuda'],
    city_telabuzong: ['city_kafa', 'city_junshitandingbao'],
    city_pantika: ['city_yanghe'],
    city_kafa: ['city_junshitandingbao', 'city_genoa'],
    city_oleshky: ['city_akeman', 'city_heersongniesi'],
    city_heersongniesi: ['city_waerna'],
    city_akeman: ['city_waerna'],
    city_waerna: ['city_junshitandingbao'],
    city_junshitandingbao: ['city_genoa'],
    city_yanghe: ['city_teluoyi'],
    city_teluoyi: ['city_salonica', 'city_aolinsuosi', 'city_kalisituosi'],
    city_aolinsuosi: ['city_kelazuomeinai'],
    city_kelazuomeinai: ['city_kalisituosi'],
    city_halikanasu: ['city_tiluo'],
    city_yifusuo: ['city_tiluo', 'city_chimarros'],
    city_tiluo: ['city_kalisituosi', 'city_chimarros'],
    city_chimarros: ['city_knossos'],
    city_kalisituosi: ['city_rhodes'],
    city_salonica: ['city_yadian'],
    city_miletus: ['city_yadian'],
    city_latajiya: ['city_adana', 'city_jiasa'],
    city_adana: ['city_nikexiya', 'city_antiejiya'],
    city_jiasa: ['city_tuile'],
    city_tuile: ['city_peiluximu', 'city_antiejiya'],
    city_antiejiya: ['city_kolossi', 'city_nikexiya'],
    city_nikexiya: ['city_rhodes'],
    city_rhodes: ['city_matelugang'],
    city_matelugang: ['city_peiluximu'],
    city_peiluximu: ['city_kolossi'],
    city_famagusta: ['city_beirut', 'city_venice'],
    city_beirut: ['city_yalishanda'],
    city_ake: ['city_yalishanda', 'city_venice'],
    city_kolossi: ['city_yalishanda'],
    city_yalishanda: ['city_knossos', 'city_venice'],
    city_knossos: ['city_banjiaxi', 'city_yadian', 'city_venice'],
    city_yadian: ['city_syracuse'],
    city_banjiaxi: ['city_malta'],
    city_ravenna: ['city_venice', 'city_ragusa'],
    city_venice: ['city_ragusa'],
    city_ragusa: ['city_antiwali'],
    city_antiwali: ['city_kefu', 'city_anbulajiya'],
    city_kefu: ['city_talanduo'],
    city_talanduo: ['city_syracuse'],
    city_anbulajiya: ['city_messina'],
    city_syracuse: ['city_palermo', 'city_deliboli'],
    city_deliboli: ['city_malta'],
    city_malta: ['city_jiataji', 'city_messina'],
    city_messina: ['city_naples'],
    city_naples: ['city_palermo', 'city_oristano'],
    city_palermo: ['city_jiataji'],
    city_jiataji: ['city_cagliari'],
    city_genoa: ['city_barcelona', 'city_oristano', 'city_luoma'],
    city_luoma: ['city_xibo', 'city_cagliari'],
    city_oristano: ['city_barcelona', 'city_xibo'],
    city_cagliari: ['city_bujiaya'],
    city_bujiaya: ['city_valencia'],
    city_valencia: ['city_aerjier'],
    city_barcelona: ['city_aerjier'],
    city_xibo: ['city_aerjier'],
    city_aerjier: ['city_xiuta'],
    city_xiuta: ['city_jiadisi', 'city_labate'],
    city_newamsterdam: ['city_shengaogusiding'],
    city_jamestown: ['city_havana', 'city_shengduomingge'],
    city_shengaogusiding: ['city_havana', 'city_shengduomingge'],
    city_veracruz: ['city_havana', 'city_katachena'],
    city_havana: ['city_portobelo', 'city_portroyal'],
    city_portobelo: ['city_katachena', 'city_portroyal'],
    city_yala: ['city_portroyal', 'city_shengduomingge'],
    city_portroyal: ['city_shengduomingge', 'city_katachena'],
    city_katachena: ['city_martinique'],
    city_shengduomingge: ['city_martinique'],
    city_martinique: ['city_ribeira'],
    city_salvador: ['city_guanabara', 'city_saovicente', 'city_kabufoliwu'],
    city_kabufoliwu: ['city_saovicente'],
    city_guanabara: ['city_buenosaires'],
    city_saovicente: ['city_buenosaires'],
    city_buenosaires: ['city_sanjulian'],
    city_sanjulian: ['city_valparaiso'],
    city_nanmadol: ['city_hagatna', 'city_deernate'],
    city_bermuda: ['city_jamestown', 'city_newamsterdam', 'city_havana', 'city_portroyal', 'city_shengduomingge', 'city_martinique'],
};

/** 从本势力文化军团三排里学到的兵种。 */
export interface LearnedUnit {
    /** 兵种 key（UNIT_ASSETS / WAR_TYPES 同名） */
    unitKey: string;
    /** 兵种中文名（面板显示） */
    unitName: string;
    /** 学到时所属势力 */
    factionId: string;
    /** 该兵种在本势力军团里的排号：0 前排 / 1 中坚 / 2 后排 / 3 将军兵模（主将队） */
    row: number;
}

export interface PlayerSaveState {
    merit: number;
    /** 历史最高官职（资历）；离开势力不清此字段。旧存档缺省时按功劳与势力状态重建。 */
    rankId?: PlayerRankId;
    /** 玩家自定义名（观众竞拍或主播设定） */
    playerName?: string;
    /** 上一次效忠势力所在据点的 67 建筑文化键（斥候/探马离职后同文化投靠依据） */
    lastCulture?: string | null;
    heroDowns: number;
    factionId: string | null;
    learnedUnits?: LearnedUnit[];
    /** 陆战基础属性历史峰值；旧存档缺省时按 learnedUnits 重建。 */
    peakStats?: PlayerPeakStats;
    /** 玩家亲手换过兵模：读档后不许再自动换装 */
    manualUnitPick?: boolean;
    /** 已获海上兵模（战船 AssetId），终身保留 */
    learnedShips?: string[];
    /** 无势力时自选的战船下标；-1 = 独木舟 */
    selectedShip?: number;
    selectedUnit?: number;
    lat: number;
    lng: number;
    /** 🔴 [2026-10-22] 故事块：已触发过的块 id、剧情标记 */
    storyDone?: string[];
    storyFlags?: string[];
    /** 🔴 [2026-10-22] 马厩：自己的马、谱系 */
    horses?: HorseStableSave;
    /** 🔴 [2026-11-06 主人令] 面板手选的环球商队车 / 航行商船素材目录（null/缺省 = 随当地文化） */
    tourCaravanDir?: string | null;
    tourShipDir?: string | null;
    /** 观众竞价选定的主角立绘（元帅权限）；缺省 = 还没选 */
    livePortrait?: string | null;
    /** 公侯/国王/皇帝：独立封邦势力名、旗号一字、主公同盟势力 ID、根据地据点 ID、自定义军团名与三排兵模、已合军武将 ID 列表 */
    ownFactionName?: string;
    ownFlagChar?: string;
    alliedFactionId?: string | null;
    fiefCityId?: string | null;
    customLegionName?: string;
    customRowUnits?: [string, string, string] | null;
    mergedGenerals?: string[];
}

/** Scene13 用的玩家布置（由 Scene13WarLayer.start 通过 window.game.playerHero 取） */
export interface Scene13PlayerSetup {
    /** 玩家所在一方：0 攻 / 1 守 */
    side: 0 | 1;
    heroKey: string;
    heroName: string;
    /** 历史最高基础属性；伤害类型、范围攻击与自身护甲类别仍取当前 heroKey。 */
    heroStats: PlayerPeakStats;
    control: PlayerRank['control'];
    /* 🔴 [2026-09-18 主人定]「玩家永远不能改变军团的兵种」—— 原 `eliteLane`（玩家自带精锐编队）已删除。
     * 它曾被 Scene13WarLayer 用来**顶替**军团编制里的一口，那是 AI 从 12e「必须 9 支」反推出来的，
     * 主人原话（player-rules-verbatim 三·二）只有控制权四条 + 编队数一条，从未允许玩家带兵入场。
     * 玩家在 13 里只以 hero 身份出场，按官阶指挥军团**现有**部队。别再加回这个字段。 */
    /** 🔴 [2026-09-07 主人定] 玩家当前套用的本势力兵种 key。
     *  受控编队按它挑：探马 = 同兵种的**一队**，先锋 = 同兵种的**一排**。
     *  还没学到兵种时为 null → 退回旧口径（前排第一口 / 整个前排）。 */
    unitKey: string | null;
    onKill: (byHero: boolean) => void;
    onHeroDown: () => void;
}

export interface PlayerHeroDeps {
    map: GameMap;
    cityManager: {
        getCity(id: string): City | undefined;
        getCities(): City[];
        getFactionName(id: string): string;
    };
    getLegionById: (id: string) => Army | undefined;
    notify: (msg: string) => void;
    /** 主角开始移动（行军/入伍）→ 镜头跟随主角 */
    followCamera: () => void;
    /** 主角停止（到达/离队）→ 镜头释放，交给玩家自由移动 */
    releaseCamera: () => void;
    /** 当前游戏年份、季（马厩算马龄、疲劳受伤用） */
    getYear: () => number;
    getSeason: () => number;
}

export class PlayerHeroArmy extends Army {
    public readonly isPlayerHero = true;
}

export class PlayerHero {
    public readonly army: PlayerHeroArmy;
    public merit = 0;
    /** 本场仗已记的功（封顶 PLAYER_BATTLE_MERIT_CAP；进战术战和战后结算时清零） */
    private battleMerit = 0;
    /** 主角这一仗亲身上了战术战场（只有这种仗打赢才记一场功劳） */
    private battleArmed = false;
    /** 历史最高官职（资历）：2026-10-29 主人定「离开势力官职重来」，资历只管离队选去处的范围。 */
    private peakRankId: PlayerRankId = 'civilian';
    /** 战术模式里落马次数（只做统计，不扣功勋） */
    public heroDowns = 0;
    /** 当前效忠势力（接任务时加入；null = 独行） */
    public factionId: string | null = null;

    /** 🔴 [2026-09-07 主人定] 本势力已学兵种：斥候学 1 个、探马再 1 个、先锋再 1 个，
     *  到先锋集齐该势力文化军团的三排。学到的兵种即玩家自己的素材（可在面板里挑）。 */
    public learnedUnits: LearnedUnit[] = [];
    /** 🔴 [2026-10-27 主人定] 陆战属性按已获兵模记录历史峰值，只升不降；新游戏从斥候属性重设。 */
    public peakStats: PlayerPeakStats = createInitialPlayerPeakStats();
    /**
     * 🔴 [2026-09-09 主人定] 海上兵模：**初始独木舟 CANOE，升到将军才可拥有所在军团的战船**。
     * 与陆上兵模同一套规矩：终身不回收，加入军团时若已到将军就把该军团的战船收进来并换上。
     * 没有任何一条时一律独木舟 —— 白身在海上就该是独木舟。
     */
    public learnedShips: string[] = [...PLAYER_BUILTIN_SHIP_KEYS];
    /**
     * ⚠️ 已废弃：原「玩家亲手换过就不再自动换装」的隐式锁。
     * 字段只为读旧存档保留，不再参与任何判据。
     */
    private manualUnitPick = false;
    /** 面板选中的已收兵模下标；-1 = 还没收到（用官阶兜底形象，白身=古典斥候骑兵） */
    public selectedUnit = -1;

    private hostLegionId: string | null = null;
    private travelCityId: string | null = null;
    /** 赶往特定坐标目标（如历史战场）的目标显示名 */
    private travelPointLabel: string | null = null;
    /**
     * 🔴 [2026-09-09 主人定]「到了城里总是没人就换武将，改成直接去找武将，无论在不在城中」。
     * 追的是**军团**（武将带着军团在外行军），不是据点。追击期间照常沿路网走，
     * 只是目的地锚点跟着军团走：军团换城/走远了就重新规划一段。
     */
    private chaseArmyId: string | null = null;
    /** 追击的那位武将名（HUD「追击武将【XXX】」显示用；追的是军团，但对话锚定的是人） */
    private chaseGeneralName: string | null = null;
    /** 自动模式：自动选据点（兵多 + 名将）、自动入伍、军团战败自动换下一个势力。
     *  🔴 [2026-09-15 主人定]「玩家找武将，改为兵多、名将，去掉其他的条件」——判据只剩这两条。
     *  🔴 [2026-10-05 主人令] 开局默认**关闭**（原 2026-09-09「开局默认自动」作废）：
     *     先选好乱斗还是剧本（autoPlan），再手动点「🤖 自动」，之后才按所选模式的逻辑自动运行。 */
    public autoMode = true;
    /** 玩家面板四选一模式（autoMode 仅在 'auto' 时为真，保持旧读取口径不变） */
    public playMode: PlayerPlayMode = 'auto';
    /** 🔴 [2026-10-22] 故事块：已触发过的块 id（只触发一次的不再弹）、剧情标记（随存档保存） */
    public storyDone: string[] = [];
    public storyFlags: string[] = [];
    /** 🔴 [2026-10-22] 马厩：自己的马（坐骑状态决定单骑行军快慢）、通灵马谱系 */
    public readonly horses: HorseStable;
    /**
     * 自动模式走哪套玩法（🔴 2026-09-17 主人定「剧本和乱斗模式分开。因为我还无法确定要不要做剧本。
     *   现在的自动模式分为两种，一种是剧本模式，到了年份，玩家优先去战场。乱斗模式的话，玩家不去战场。」）
     *
     *   · `'script'` 剧本模式 —— 到了年份优先奔赴历史战场，没有可打的战场才去找武将乱斗（9-16 定的那套）；
     *   · `'melee'`  乱斗模式 —— **完全不碰战场**，一直找武将入伍打乱斗。
     *
     * 🔴 [2026-10-24 下午 主人令「好的，默认改为乱斗」（直播用乱斗：百岁模式大部分时间没武将、战术战太少）] 默认＝`'melee'` 乱斗；
     *   同日上午「恢复百岁模式的默认」作废。
     * 🔴 [2026-10-08 主人令「开局默认模式从剧本改为乱斗」] 默认改为 'melee' 乱斗（取代 2026-09-23 的默认剧本）。
     * 🔴 [2026-09-23 主人定] 默认改回 `'script'` 剧本模式，且剧本模式是**整个世界的模式**：
     *   「既然是历史剧本，就不能出现不符合历史的事情，这个总功能中包括其他军团不能随机产生。
     *     军团在历史剧本期间，不能随意寻敌，只有等剧本都结束后，自动切换到乱斗模式。」
     *   · 剧本模式 → 募兵系统不生军团（开局首发 + 季末），AI 行为树不驱动非剧本军团；
     *   · 全部战场打完 → PlayerQuestSystem.tick 自动切到 `'melee'`，募兵与 AI 恢复。
     *   原面板「🚫 不出军团」勾选已并入本项（主人：把不出军团功能放到剧本模式中）。
     *   （9-17 曾定默认乱斗，已被本条取代。）
     */
    public autoPlan: PlayerAutoPlan = 'melee';
    /** 玩家自定义名（改名功能写入；默认「探马者」） */
    private playerName: string = PLAYER_HERO_NAME;
    /** 上一次效忠势力所在据点的 67 文化键；离职后保留，供斥候/探马同文化择主使用 */
    private lastCulture: string | null = null;
    private changeListeners = new Set<() => void>();
    /** 抵达据点回调（PlayerQuestSystem 接管对话） */
    public onArriveCity: ((city: City) => void) | null = null;
    /** 追上带着武将的军团（不在城中时的会面入口） */
    public onMeetArmy: ((army: Army) => void) | null = null;
    /** 🔴 [2026-10-22] 马厩里点「通灵」：读这匹马的记忆（StoryletEngine 接管） */
    public onReadHorseMemory: ((horseId: string) => void) | null = null;
    /** 入伍军团覆灭/解散回调 */
    public onHostLost: ((lastHostId: string) => void) | null = null;

    constructor(private deps: PlayerHeroDeps, startPos: { lat: number; lng: number }) {
        this.horses = new HorseStable({
            getYear: deps.getYear,
            getSeason: deps.getSeason,
            notify: (msg) => this.deps.notify(msg),
            onChange: () => this.onHorsesChanged(),
        });
        this.army = new PlayerHeroArmy(
            deps.map,
            startPos,
            null,
            1,
            '',
            () => { },
            undefined,
            undefined,
            PLAYER_HERO_NAME,
            'cavalry',
            undefined,
        );
        this.army.type = 'hero';
        // 🔴 [2026-09-07 主人定「海上用独木舟」] 玩家单骑无文化区，指定独木舟；
        //    随军时下面 update() 会按宿主舰队覆盖，这里只管一个人漂海。
        this.army.preferredNavalShip = 'CANOE';
        // 🔴 [2026-09-07 主人定「骑兵/步兵/船 移动速度要区分」] 按当前素材定行军大类；
        //    官阶变化会换素材，故 syncMoveProfile() 在升阶/入伙/脱离时都要再调一次。
        this.syncMoveProfile();
        this.army.setSpeedMultiplier(PLAYER_HERO_SPEED_MULT);
        // 开局集结闸门是给首发军团的开场仪式，玩家不受它约束（否则开局 5 秒内点据点没反应）
        this.army.exemptFromDeployHold = true;
        // 渲染包装器是在 super() 里建的，字段初始化晚于它 → 手动补上身份标记
        const r = this.army.getRenderer() as unknown as Record<string, unknown> | null;
        if (r) {
            r.type = 'hero';
            r.isPlayerHero = true;
            r.playerHero = this;
        }
    }

    public get id(): string { return this.army.id; }
    public get name(): string { return this.playerName; }
    /** 玩家当前兵模素材；13 数值取 peakStats 历史峰值，换弱兵模不会降属性。 */
    public get heroKey(): string {
        // 🔴 [2026-09-07 主人定「学到的兵种给玩家套用」] 优先用面板选中的本势力已学兵种；
        //    还没学到（平民/刚入伙那一瞬）才回落到官阶兜底素材（白身=古典斥候骑兵）。
        return this.getSelectedUnit()?.unitKey ?? heroKeyForRank(this.getRank().id);
    }
    public rename(newName: string): void {
        const trimmed = newName.trim();
        if (!trimmed) return;
        this.playerName = trimmed;
        this.army.name = trimmed;
        // renderer.name 是 getter（返回 army.name），改了 army.name 即自动生效，无需给 renderer 赋值
        this.emitChange();
    }

    /** 同步玩家的地图行军大类（骑=CAVALRY 平原2.0 / 步=INFANTRY 平原1.4·山地1.1）。
     *  海上不归它管：登船后全军统一 SEA_SPEED_MULTIPLIER，兵种加成失效。 */
    private syncMoveProfile(): void {
        if (!this.factionId) {
            let picked = this.getSelectedUnit() ? this.selectedUnit : -1;
            for (let i = 0; i < this.learnedUnits.length; i++) {
                if (picked < 0 || factionlessAppearancePriority(this.learnedUnits[i].unitKey)
                    < factionlessAppearancePriority(this.learnedUnits[picked].unitKey)) picked = i;
            }
            // 🔴 修复（2026-09-10）：无势力自动换装里骑兵有保底（初始斥候 = 官阶兜底，优先级 0）。
            //    若学到的兵模里没有骑兵（最优优先级 > 0），回落到官阶兜底「古典斥候骑兵」，
            //    别套用步兵/战车/象兵——否则加入步兵势力解散后就停在步兵、回不到骑兵。
            if (picked >= 0 && factionlessAppearancePriority(this.learnedUnits[picked].unitKey) > 0) {
                picked = -1;
            }
            this.selectedUnit = picked;
        }
        // 🔴 [2026-10-28 主人令] 玩家一直是骑兵，行军大类恒为 CAVALRY
        this.army.preferredMoveClass = 'CAVALRY';
        // 🔴 [2026-09-11 主人定]「平地慢一小点，山地快一小点」—— 只作用于玩家这一支，
        //    幅度见 PLAYER_PLAIN_SPEED_SCALE / PLAYER_MOUNTAIN_SPEED_SCALE 的头注。
        // 🔴 [2026-10-22 马系统] 坐骑疲劳走得慢、没马可骑牵马步行更慢（海上不受影响）；
        //    故事跑腿另有快慢（例：赶着马群走不快）
        const horse = (this.horses?.speedFactor() ?? 1) * this.storyPace;
        this.army.terrainSpeedScale = {
            plain: PLAYER_PLAIN_SPEED_SCALE * horse,
            mountain: PLAYER_MOUNTAIN_SPEED_SCALE * horse,
            sea: PLAYER_SEA_SPEED_SCALE,
        };
    }

    /** 故事跑腿的行军快慢系数（StoryletEngine 跑腿时设，走完回 1） */
    private storyPace = 1;
    public setStoryPace(f: number): void {
        if (this.storyPace === f) return;
        this.storyPace = f;
        this.syncMoveProfile();
    }

    /** 马厩变了：坐骑状态可能变 → 行军快慢跟着变（只在系数真变了时通知面板，换季每次都会调） */
    private lastHorseKey = '';
    private onHorsesChanged(): void {
        if (!this.army) return;   // 构造期间（army 还没建）
        this.syncMoveProfile();
        const m = this.horses.getMount();
        const key = `${this.horses.list().length}|${m?.id}|${m ? this.horses.statusOf(m) : ''}|${this.horses.speedFactor()}`;
        if (key === this.lastHorseKey) return;
        this.lastHorseKey = key;
        this.emitChange();
    }

    public getPosition(): { lat: number; lng: number } { return this.army.getPosition(); }
    public getLastCulture(): string | null { return this.lastCulture; }
    public setLastCulture(culture: string | null): void {
        if (!culture || this.lastCulture === culture) return;
        this.lastCulture = culture;
        this.emitChange();
    }
    /**
     * 🔴 [2026-11-07 主人令定稿] 两条线分开：
     *   · **当前官职** ＝ 本势力功劳定档（`rankFor`）。离开势力／战败＝功劳归 0，官职回到平民，
     *     入伍保底斥候；新势力里重新靠场次升官，**升一次重拿一次兵模**（含与旧势力重复的兵模）。
     *   · **资历**（`getPeakRank`）只升不降，**只管战略权限**：离队后能投靠谁、元帅指派目标与挑立绘。
     *   主人原话：「资历保留是为了观众可以继续有选择的权力，不用为了降职重来。」
     */
    public getRank(): PlayerRank {
        return rankFor(this.merit, this.factionId !== null);
    }
    /** 资历：本局最高官职，只升不降；只决定战略权限（投靠范围、元帅两权），不决定兵模与战力。 */
    public getPeakRank(): PlayerRank {
        const current = this.getRank();
        const peak = PLAYER_RANKS.find((r) => r.id === this.peakRankId) ?? current;
        return PLAYER_RANKS.indexOf(peak) > PLAYER_RANKS.indexOf(current) ? peak : current;
    }
    private rememberRank(rank: PlayerRank): void {
        const nextIdx = PLAYER_RANKS.findIndex((r) => r.id === rank.id);
        const peakIdx = PLAYER_RANKS.findIndex((r) => r.id === this.peakRankId);
        if (nextIdx > peakIdx) this.peakRankId = rank.id;
    }
    public getHostLegionId(): string | null { return this.hostLegionId; }
    public setAutoMode(on: boolean): void {
        this.setPlayMode(on ? 'auto' : 'rest');
    }
    /**
     * 🔴 [2026-11-02 主人令] 玩家面板「自动」改为四选一：自动 / 休息 / 环球 / 航行。
     *   · auto  自动找武将、入伍、接战（原「自动」开）；rest 纯手动（原「自动」关）；
     *   · globe 环球：只在世界各据点间旅行，不找武将、不触发城中对话，水陆路皆可；
     *   · sail  航行：只走海路坐船在港口间环游，不上陆地（不在港口时先走到最近的港口）。
     */
    public setPlayMode(mode: PlayerPlayMode): void {
        if (this.playMode === mode) return;
        this.playMode = mode;
        this.autoMode = mode === 'auto';
        this.tourPlannedAt = 0;
        this.holdUntilMs = 0;
        this.tourTrail = [];   // 换模式后从当前位置重新起算路迹，免得旧路迹误判
        this.tourIdx = -1;     // 商路链序号重新定位
        this.tourPrevId = '';
        if (!this.hostLegionId) {
            this.cancelChase();
            this.cancelTravel();
        }
        this.emitChange();
    }
    public isTourMode(): boolean { return this.playMode === 'globe' || this.playMode === 'sail'; }
    /**
     * 🔴 [2026-11-06 主人令]「给项目中的玩家添加商队和商船模型，如果切换到环球旅行，和环球航行的模式的时候，
     *    就自动切换到商队和商船的模式。」
     *
     * 环球/航行模式下的玩家形态（战略地图精灵由 `PlayerTourSpriteDrawer` 画）：
     *   · globe（环球旅行）→ 陆路走商队车；对马海峡、大西洋、太平洋这些必须渡海的一段自动换商船；
     *   · sail（环球航行）→ 海上商船；上岸去港口的短途走商队车。
     * 随军时（`hostLegionId` 有值）返回 null：那时玩家是军团前排的英雄兵模，由军团统一画
     * （2026-09-07 主人定「玩家加入势力后，海上只显示势力船只，不用显示玩家」同一口径）。
     */
    public getTourModelKind(): 'caravan' | 'ship' | null {
        if (!this.isTourMode() || this.hostLegionId) return null;
        return this.army.isOnSea ? 'ship' : 'caravan';
    }
    /**
     * 🔴 [2026-11-06 主人令]「这些模型请可以在玩家面板中选择」：
     * 环球/航行模式的商队车与商船由玩家自己在面板里挑；null = 随当地文化自动换。
     * 目录见 `PlayerTourSpriteDrawer.TOUR_CARAVAN_CHOICES / TOUR_SHIP_CHOICES`。
     */
    public tourCaravanDir: string | null = null;
    public tourShipDir: string | null = null;
    /**
     * 🔴 [2026-11-07 主人令]「元帅…可以挑选立绘：先选择文化，然后从该文化随机选择10张让玩家挑选」
     *    观众竞价选定的主角立绘（`/assets/<文化>/*.png` 路径）。null = 还没选，面板不显示头像。
     *    只存路径，不搬不复制任何立绘文件；换局/读档跟着存档走。
     */
    public livePortrait: string | null = null;
    public getLivePortrait(): string | null { return this.livePortrait; }
    public setLivePortrait(path: string | null): void {
        const next = typeof path === 'string' && path.trim() ? path.trim() : null;
        if (this.livePortrait === next) return;
        this.livePortrait = next;
        this.emitChange();
    }

    // ── 公侯 / 国王 / 皇帝（第 7～9 阶战略权限状态） ─────────────────────
    /** 玩家封侯自立时的专属势力 ID */
    public static readonly OWN_FACTION_ID = 'player_own';
    /** 玩家自建势力名字（国王阶观众竞拍可改，默认「探马军」） */
    public ownFactionName: string = '探马军';
    /** 玩家自建势力旗号单字（国王阶观众竞拍可改，默认「探」） */
    public ownFlagChar: string = '探';
    /** 封侯时绑定的原主公同盟势力 ID（互不攻伐；国王阶比较 3 倍实力用） */
    public alliedFactionId: string | null = null;
    /** 公侯根据地据点 ID */
    public fiefCityId: string | null = null;
    /** 公侯自定义军团名（观众竞拍可改） */
    public customLegionName: string = '';
    /** 公侯自定义三排兵模（前排/中坚/后排的 unitKey） */
    public customRowUnits: [string, string, string] | null = null;
    /** 国王/皇帝阶已征召合入本军的武将 ID 列表 */
    public mergedGenerals: string[] = [];

    /** 判断当前资历是否已达到指定官阶（战略权限解锁判据） */
    public hasRankPrivilege(minRank: PlayerRankId): boolean {
        const peakIdx = PLAYER_RANKS.findIndex((r) => r.id === this.getPeakRank().id);
        const minIdx = PLAYER_RANKS.findIndex((r) => r.id === minRank);
        return peakIdx >= 0 && minIdx >= 0 && peakIdx >= minIdx;
    }

    /** 判断两个势力是否为「玩家封邦 ↔ 原主公」同盟关系（同盟双方互不攻伐） */
    public isAlliedPair(a?: string | null, b?: string | null): boolean {
        if (!a || !b || a === b) return false;
        if (!this.fiefCityId || !this.alliedFactionId) return false;
        const own = PlayerHero.OWN_FACTION_ID;
        return (a === own && b === this.alliedFactionId) || (b === own && a === this.alliedFactionId);
    }

    /** 全局静态便捷判断：供 AI 寻敌、野战、攻城判定同盟互不侵犯 */
    public static areFactionsAllied(a?: string | null, b?: string | null): boolean {
        if (!a || !b || a === b) return false;
        const hero = (globalThis as any).window?.game?.playerHero as PlayerHero | undefined;
        return hero?.isAlliedPair(a, b) === true;
    }

    /** 将公侯自定义军团名与三排兵模应用到当前随军军团 */
    public applyCustomLegionToArmy(host?: Army | null): void {
        const target = host ?? this.getHostLegion();
        if (!target) return;
        if (this.customLegionName) {
            target.name = this.customLegionName;
        }
        if (this.customRowUnits) {
            const [u0, u1, u2] = this.customRowUnits;
            (target as any).customRowUnits = [u0, u1, u2];
            const cmdKey = target.cultureSlots?.[9] ?? this.heroKey;
            target.cultureSlots = [u0, u0, u0, u1, u1, u1, u2, u2, u2, cmdKey];
        }
        this.emitChange();
    }
    /** 当前该形态要用的手选素材（null = 自动） */
    public getTourModelDir(kind: 'caravan' | 'ship'): string | null {
        return kind === 'ship' ? this.tourShipDir : this.tourCaravanDir;
    }
    public selectTourCaravanDir(dir: string | null): void {
        this.tourCaravanDir = dir || null;
        this.emitChange();
    }
    public selectTourShipDir(dir: string | null): void {
        this.tourShipDir = dir || null;
        this.emitChange();
    }
    /** 清除战败/离队停顿倒计时（手动切换模式时立即响应，不干等 9 秒） */
    public clearHold(): void { this.holdUntilMs = 0; }
    /** 切换到环球/航行后立即规划第一步（不等 1.5s 节流） */
    public kickTourNow(): void {
        this.tourPlannedAt = 0;
        this.stepTour();
    }

    /** 商路链上当前所在站的序号（-1＝未定位） */
    private tourIdx = -1;
    /** 上一站（走回头路检测：新一段路若穿过上一站＝原路折返，跳过该站） */
    private tourPrevId = '';
    /**
     * 按商路链（TourRoutes）规划下一段。成功发车返回 true；链完全走不通返回 false，由旧逻辑兜底。
     *   · 站在链上 → 取链上下一个到得了的站（环形，到末尾回第 0 站）；
     *   · 不在链上 → 先去最近的链站；
     *   · 某段绕路过大（路程 > 直线 ×2 + 100km，说明这两站之间的路还没连好、会绕个大圈）→ 跳过那一站，
     *     等主人把路画通后自动恢复，不会让玩家走冤枉路；
     *   · 陆路段（by=land）只走陆路，陆路不通才退到任意路；海路段只走海路。
     */
    private planChainLeg(mode: 'globe' | 'sail', hereId: string, pos: { lat: number; lng: number }): boolean {
        const chain = getTourChain(mode);
        const n = chain.length;
        if (n < 2) return false;
        const cm = this.deps.cityManager;
        let idx = -1;
        if (this.tourIdx >= 0 && chain[this.tourIdx]?.id === hereId) idx = this.tourIdx;
        else idx = chain.findIndex((s) => s.id === hereId);
        const pathOf = (from: string, to: string, by: 'land' | 'sea') => {
            let res = by === 'land' ? roadRegistry.findLandOnlyPath(from, to) : roadRegistry.findSeaOnlyPath(from, to);
            if (!res && mode === 'globe') res = roadRegistry.findPath(from, to);
            return res && res.coordinates.length >= 2 ? res : null;
        };
        if (idx < 0) {
            const near = chain
                .map((s, i) => ({ s, i, c: cm.getCity(s.id) }))
                .filter((x): x is { s: typeof chain[number]; i: number; c: City } => !!x.c)
                .sort((a, b) => getEuclideanDistance(pos, { lat: a.c.latitude, lng: a.c.longitude })
                    - getEuclideanDistance(pos, { lat: b.c.latitude, lng: b.c.longitude }));
            for (const x of near.slice(0, 8)) {
                const res = pathOf(hereId, x.s.id, mode === 'sail' ? 'sea' : x.s.by);
                if (!res) continue;
                this.tourIdx = x.i;
                this.launchTourLeg(x.c, res, mode === 'sail');
                return true;
            }
            return false;
        }
        const hereCity = cm.getCity(hereId);
        for (let k = 1; k < n; k++) {
            const j = (idx + k) % n;
            const stop = chain[j];
            if (stop.id === hereId) continue;
            const dest = cm.getCity(stop.id);
            if (!dest) continue;
            const res = pathOf(hereId, stop.id, stop.by);
            if (!res) continue;
            if (this.tourPrevId && res.nodes.slice(1, -1).includes(this.tourPrevId) && k < n - 1) continue;   // 穿过上一站＝折返
            if (hereCity) {
                const km = res.edges.reduce((t, e) => t + e.lengthKm, 0);
                const straight = PlayerHero.greatCircleKm(hereCity.latitude, hereCity.longitude, dest.latitude, dest.longitude);
                if (km > straight * 2 + 100 && k < n - 1) continue;
            }
            this.tourIdx = j;
            this.tourPrevId = hereId;
            this.launchTourLeg(dest, res, mode === 'sail');
            return true;
        }
        return false;
    }
    private static greatCircleKm(la1: number, ln1: number, la2: number, ln2: number): number {
        const r = Math.PI / 180;
        const x = Math.sin((la2 - la1) * r / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin((ln2 - ln1) * r / 2) ** 2;
        return 2 * 6371 * Math.asin(Math.sqrt(x));
    }
    private launchTourLeg(dest: City, res: NonNullable<ReturnType<typeof roadRegistry.findPath>>, forceSea: boolean): void {
        const path = roadRegistry.pathToLatLngs(res);
        this.rememberTourStop(dest.id);
        this.rememberTourTrail(path);
        this.travelCityId = dest.id;
        this.travelPointLabel = null;
        this.army.setTargetCity(dest);
        this.army.setOnArriveCallback(() => this.handleArrive(dest.id));
        this.army.moveAlongPath(path.map((p) => ({ lat: p.lat, lng: p.lng, sea: forceSea ? true : (p as any).sea })));
        this.deps.followCamera();
        this.emitChange();
    }

    /** 环球/航行：停下来后挑下一个目的地（每 1.5 秒最多规划一次） */
    private tourPlannedAt = 0;
    private stepTour(): void {
        if (!this.isTourMode() || this.hostLegionId || this.isHeld()) return;
        if (this.travelCityId || this.chaseArmyId || !this.army.isIdle()) return;
        const now = performance.now();
        if (now - this.tourPlannedAt < 1500) return;
        this.tourPlannedAt = now;
        if (!roadRegistry.isInitialized()) return;
        const pos = this.army.getPosition();
        if (this.playMode === 'globe') {
            // 偏远处（昆仑山、海上）0.5° 内常常没有接了路的据点 → 逐级放宽，否则永远出不了门
            const here = roadRegistry.getNearestCityId(pos.lat, pos.lng)
                ?? roadRegistry.getNearestCityId(pos.lat, pos.lng, 5)
                ?? roadRegistry.getNearestCityId(pos.lat, pos.lng, 30);
            if (!here) return;
            this.rememberTourStop(here);
            // 🔴 [2026-11-05 主人令] 环球优先陆路、按知名商路链走（TourRoutes.GLOBE_CHAIN）；链走不通才退回旧的向西选址
            if (this.planChainLeg('globe', here, pos)) return;
            const dists = roadRegistry.getRoadDistancesKmFrom(here);
            const reach = [...dists.entries()]
                .filter(([id, d]) => id !== here && d > 0)
                .map(([id]) => this.deps.cityManager.getCity(id))
                .filter((c): c is City => !!c);
            let legs = this.rankWestLegs(pickWestward(this.skipRecentStops(reach), pos.lng), pos.lng, (c) => {
                const r = roadRegistry.findPath(here, c.id);
                return r ? roadRegistry.pathToLatLngs(r) : null;
            });
            // 局部支线若无可直达西向城，向全图未走过的西向据点寻路
            if (legs.length === 0) {
                const allWestCities = pickWestward(this.skipRecentStops(this.deps.cityManager.getCities().filter((c: City) => c.id !== here)), pos.lng);
                legs = this.rankWestLegs(allWestCities, pos.lng, (c) => {
                    const r = roadRegistry.findPath(here, c.id);
                    return r ? roadRegistry.pathToLatLngs(r) : null;
                });
            }
            if (legs.length > 0) {
                const { city: dest, path } = legs[0];
                this.rememberTourStop(dest.id);
                // 沿途途经的据点也全数记入历史，彻底杜绝回踩
                for (const nearCity of roadRegistry.getNearestCityIdsAlongPath(path, 0.2)) {
                    if (nearCity) this.rememberTourStop(nearCity);
                }
                const fullPath = roadRegistry.getFullPathToCity(pos, dest.id, here);
                const marchPath = fullPath && fullPath.length >= 2 ? fullPath : path;
                this.rememberTourTrail(marchPath);
                this.travelCityId = dest.id;
                this.travelPointLabel = null;
                this.army.setTargetCity(dest);
                this.army.setOnArriveCallback(() => this.handleArrive(dest.id));
                this.army.moveAlongPath(marchPath.map((p) => ({ lat: p.lat, lng: p.lng, sea: (p as any).sea })));
                this.deps.followCamera();
                this.emitChange();
                return;
            }
            return;
        }
        // 航行：先确保站在港口（只认主海路网的港口，里海等孤立湖区不去，免得困在里面出不来）
        const ports = roadRegistry.getMainSeaPortIds()
            .map((id) => this.deps.cityManager.getCity(id))
            .filter((c): c is City => !!c);
        if (ports.length === 0) return;
        const sortedPorts = [...ports].sort(
            (a, b) => getEuclideanDistance(pos, { lat: a.latitude, lng: a.longitude })
                - getEuclideanDistance(pos, { lat: b.latitude, lng: b.longitude }),
        );
        const nearPort = sortedPorts[0];
        if (!nearPort) return;
        const nd = getEuclideanDistance(pos, { lat: nearPort.latitude, lng: nearPort.longitude });
        if (nd > PLAYER_CITY_ARRIVE_DIST) {
            for (const candidatePort of sortedPorts.slice(0, 8)) {
                if (this.travelToCity(candidatePort.id, true, { allowNoGeneral: true })) {
                    this.deps.notify(`航行：先前往最近的港口【${candidatePort.name}】`);
                    return;
                }
            }
            return;
        }
        const startId = nearPort.id;
        this.rememberTourStop(startId);
        // 🔴 [2026-11-05 主人令] 航行只走海路、按知名大航海港口链走（TourRoutes.SAIL_CHAIN）；链走不通才退回旧针路表
        if (this.planChainLeg('sail', startId, pos)) return;
        let chosenDest: City | null = null;
        let chosenPath: Array<{ lat: number; lng: number; sea?: boolean }> | null = null;

        // 1. 全海域 235 个港口均已纳入大航海单向针路网（太平洋·印度洋·大西洋全覆盖，0局部死循环，红海只出不进）
        const nextHubIds = HISTORICAL_SAIL_NEXT[startId];
        if (nextHubIds && nextHubIds.length > 0) {
            let freshIds = nextHubIds.filter((id) => !this.recentTourStops.includes(id));
            if (freshIds.length === 0) {
                // 已完成整圈环球航行回到该港，清空旧足迹开始下一圈环球
                this.recentTourStops = [startId];
                freshIds = [...nextHubIds];
            }
            const shuffled = [...freshIds].sort(() => Math.random() - 0.5);
            for (const targetId of shuffled) {
                const targetCity = this.deps.cityManager.getCity(targetId);
                if (!targetCity) continue;
                const res = roadRegistry.findSeaOnlyPath(startId, targetId);
                if (res && res.coordinates.length >= 2) {
                    chosenDest = targetCity;
                    chosenPath = roadRegistry.pathToLatLngs(res);
                    break;
                }
            }
        }

        // 2. 若当前处于未登记港口，先寻纯海路驶向最近的远洋针路港口汇入主航线
        if (!chosenDest || !chosenPath) {
            const hubPorts = ports
                .filter((c) => c.id !== startId && !!HISTORICAL_SAIL_NEXT[c.id] && !this.recentTourStops.includes(c.id)
                    && westwardDeg(pos.lng, c.longitude) >= 1.5 && westwardDeg(pos.lng, c.longitude) < 165)
                .sort(
                    (a, b) => getEuclideanDistance(pos, { lat: a.latitude, lng: a.longitude })
                        - getEuclideanDistance(pos, { lat: b.latitude, lng: b.longitude }),
                );
            for (const hub of hubPorts.slice(0, 12)) {
                const res = roadRegistry.findSeaOnlyPath(startId, hub.id);
                if (res && res.coordinates.length >= 2) {
                    const p = roadRegistry.pathToLatLngs(res);
                    if (!this.isWestwardPath(p, pos.lng)) continue;
                    chosenDest = hub;
                    chosenPath = p;
                    break;
                }
            }
        }

        // 3. 兜底：从剩余港口中按净向西规则选路
        if (!chosenDest || !chosenPath) {
            const cands = pickWestward(this.skipRecentStops(ports.filter((c) => c.id !== startId)), pos.lng);
            let legs = this.rankWestLegs(cands, pos.lng, (c) => {
                const res = roadRegistry.findSeaOnlyPath(startId, c.id);
                return res && res.coordinates.length >= 2 ? roadRegistry.pathToLatLngs(res) : null;
            });
            if (legs.length === 0) {
                const allWestPorts = pickWestward(ports.filter((c) => c.id !== startId), pos.lng);
                legs = this.rankWestLegs(allWestPorts, pos.lng, (c) => {
                    const res = roadRegistry.findSeaOnlyPath(startId, c.id);
                    return res && res.coordinates.length >= 2 ? roadRegistry.pathToLatLngs(res) : null;
                });
            }
            if (legs.length > 0) {
                chosenDest = legs[0].city;
                chosenPath = legs[0].path;
            }
        }

        if (chosenDest && chosenPath) {
            const dest = chosenDest;
            const path = chosenPath;
            this.rememberTourStop(dest.id);
            this.rememberTourTrail(path);
            this.travelCityId = dest.id;
            this.travelPointLabel = null;
            this.army.setTargetCity(dest);
            this.army.setOnArriveCallback(() => this.handleArrive(dest.id));
            this.army.moveAlongPath(path.map((p) => ({ lat: p.lat, lng: p.lng, sea: true })));
            this.deps.followCamera();
            this.emitChange();
        }
    }

    /** 环球/航行最近走过的站（严格防回头：长期记录历史据点，绝不二度回踩） */
    private recentTourStops: string[] = [];
    /** 整条路线净向西且东折有限（与 rankWestLegs 同口径但略松，供针路表用） */
    private isWestwardPath(path: Array<{ lng: number }>, fromLng: number): boolean {
        let west = 0, east = 0, prev = fromLng;
        for (const p of path) {
            const d = ((p.lng - prev + 540) % 360) - 180;
            if (d > 0) east += d; else west -= d;
            prev = p.lng;
        }
        return west - east >= 1.0 && east <= Math.max(3.0, west * 0.2);
    }
    /**
     * 环球/航行走过的路迹（最近 TOUR_TRAIL_LEGS 段，每段一组 0.1° 格）。
     * 防回头只看目的地不够：从内陆城去更西的港口，路网常要原路退回进来时那个港口——
     * 经度差不大就骗过了东西向检查。这里按「新路线是否压在旧路迹上」直接判回头路。
     */
    private tourTrail: Array<Set<string>> = [];
    private static readonly TOUR_TRAIL_LEGS = 12;
    private static trailCell(lat: number, lng: number): string {
        return `${Math.round(lat * 10)},${Math.round((((lng + 540) % 360) - 180) * 10)}`;
    }
    private rememberTourTrail(path: ReadonlyArray<{ lat: number; lng: number }>): void {
        const cells = new Set<string>();
        for (let i = 1; i < path.length; i++) {
            const a = path[i - 1], b = path[i];
            const dLng = ((b.lng - a.lng + 540) % 360) - 180;
            const n = Math.max(1, Math.ceil(Math.max(Math.abs(b.lat - a.lat), Math.abs(dLng)) / 0.05));
            for (let k = 0; k <= n; k++) {
                cells.add(PlayerHero.trailCell(a.lat + (b.lat - a.lat) * k / n, a.lng + dLng * k / n));
            }
        }
        this.tourTrail.push(cells);
        if (this.tourTrail.length > PlayerHero.TOUR_TRAIL_LEGS) this.tourTrail.shift();
    }
    /** 新路线压在旧路迹上的长度（度）；起点 0.3° 内不算（出城必然贴着进城那条路） */
    private trailOverlapDeg(path: ReadonlyArray<{ lat: number; lng: number }>): number {
        if (this.tourTrail.length === 0 || path.length < 2) return 0;
        const s = path[0];
        const onTrail = (lat: number, lng: number): boolean => {
            if (Math.hypot(lat - s.lat, ((lng - s.lng + 540) % 360) - 180) < 0.3) return false;
            const key = PlayerHero.trailCell(lat, lng);
            for (const t of this.tourTrail) if (t.has(key)) return true;
            return false;
        };
        let overlap = 0;
        for (let i = 1; i < path.length; i++) {
            const a = path[i - 1], b = path[i];
            const dLng = ((b.lng - a.lng + 540) % 360) - 180;
            const len = Math.hypot(b.lat - a.lat, dLng);
            const n = Math.max(1, Math.ceil(len / 0.05));
            let hit = 0;
            for (let k = 0; k <= n; k++) {
                if (onTrail(a.lat + (b.lat - a.lat) * k / n, a.lng + dLng * k / n)) hit++;
            }
            overlap += len * hit / (n + 1);
        }
        return overlap;
    }
    private rememberTourStop(id: string): void {
        if (!this.recentTourStops.includes(id)) {
            this.recentTourStops.push(id);
            if (this.recentTourStops.length > 600) this.recentTourStops.shift();
        }
    }
    private skipRecentStops(cands: City[]): City[] {
        const left = cands.filter((c) => !this.recentTourStops.includes(c.id));
        return left.length > 0 ? left : cands;
    }

    /**
     * 🔴 [2026-11-02 主人令「在代码中实装这一套严格的环球单向无回头路推进算法」]
     *    1. 路线级严格单调向西：净西进位移必须 >= 1.5°，西进量占绝对压倒性优势；
     *    2. 严格限制东向回折分量：east <= Math.min(2.0, west * 0.12)，杜绝任何大调头绕道；
     *    3. 严禁任何东向兜底：宁可扩大全图向西搜寻，也绝不回踩向东的回头路；
     *    4. 候选路线随机打散，兼具路线多样性与严格无回头路。
     */
    private rankWestLegs(
        cands: City[],
        fromLng: number,
        pathOf: (c: City) => Array<{ lat: number; lng: number; sea?: boolean }> | null,
    ): Array<{ city: City; path: Array<{ lat: number; lng: number; sea?: boolean }> }> {
        const pool = [...cands];
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        type Leg = { city: City; path: Array<{ lat: number; lng: number; sea?: boolean }>; west: number; east: number; ok: boolean; overlap: number };
        const strict: Leg[] = [];
        const netWestPool: Leg[] = [];
        const retraced: Leg[] = [];
        /** 压旧路迹超过这个长度（度，约 30km）算走回头路；路口交叉、短暂并线不算 */
        const MAX_RETRACE_DEG = 0.3;
        for (const city of pool.slice(0, 60)) {
            const path = pathOf(city);
            if (!path || path.length < 2) continue;
            let west = 0, east = 0, prev = fromLng;
            for (const p of path) {
                const d = ((p.lng - prev + 540) % 360) - 180;   // 东正西负，跨 180° 经线取近路
                if (d > 0) east += d; else west -= d;
                prev = p.lng;
            }
            const netWest = west - east;
            const maxEast = Math.min(2.0, west * 0.12);
            if (netWest < 1.0) continue;
            const ok = netWest >= 1.5 && east <= maxEast;
            const overlap = this.trailOverlapDeg(path);
            const leg: Leg = { city, path, west, east, ok, overlap };
            if (overlap > MAX_RETRACE_DEG) retraced.push(leg);
            else if (ok) strict.push(leg);
            else netWestPool.push(leg);
        }
        if (strict.length > 0) {
            // 随机打散候选合规路线
            for (let i = strict.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [strict[i], strict[j]] = [strict[j], strict[i]];
            }
            return strict;
        }
        // 半岛/东海岸港口出港绕过海角时可能有 >2° 的局部东向弯折：在净向西（netWest >= 1.0）路线中取东折最少的一条，防原地卡死
        if (netWestPool.length > 0) {
            netWestPool.sort((a, b) => a.east - b.east || (b.west - b.east) - (a.west - a.east));
            return netWestPool;
        }
        // 所有向西路线都要压旧路（死胡同支线、孤岛）：只能退而求其次，挑重走最短的一条，防原地卡死
        if (retraced.length > 0) {
            retraced.sort((a, b) => a.overlap - b.overlap || Number(b.ok) - Number(a.ok) || a.east - b.east);
            return retraced;
        }
        return [];
    }
    /**
     * 切换自动模式的玩法（百岁 / 剧本 / 乱斗）。
     * 🔴 切到非剧本时，若人正走在奔赴战场的路上，**必须把这趟行程掐掉** —— 否则「非剧本模式玩家不去战场」
     *    这条会被一趟已经出发的行程架空，玩家照样一路走到战场再触发。`travelPointLabel` 只在
     *    `travelToPoint` 里设，而全项目只有战场引导会调它，所以它非空就等于「正在奔赴战场」。
     */
    public setAutoPlan(plan: PlayerAutoPlan): void {
        if (this.autoPlan === plan) return;
        this.autoPlan = plan;
        if (plan !== 'script' && this.travelPointLabel !== null) this.cancelTravel();
        this.emitChange();
    }
    public getHostLegion(): Army | undefined {
        return this.hostLegionId ? this.deps.getLegionById(this.hostLegionId) : undefined;
    }
    public isAttached(): boolean { return this.hostLegionId != null; }
    /** 🔴 [2026-09-18 主人定「玩家路过自家被围攻的据点，自动参战救援」]
     *  供外部系统（SiegeManager）向玩家播报一句（如"已随守军参战"）。
     *  玩家提示统一走 deps.notify，外部拿不到私有 deps，故开这个公开口。 */
    public notifyPlayer(msg: string): void { this.deps.notify(msg); }
    public isAttachedTo(armyId: string | null | undefined): boolean {
        return !!armyId && this.hostLegionId === armyId;
    }
    public isTraveling(): boolean {
        return this.travelCityId != null || this.chaseArmyId != null || this.travelPointLabel != null || this.army.isMarching();
    }
    /** 正在追某支军团找武将 */
    public isChasingArmy(): boolean { return this.chaseArmyId != null; }
    public getChaseArmyId(): string | null { return this.chaseArmyId; }
    public getChaseGeneralName(): string | null { return this.chaseGeneralName; }
    public getTravelCityId(): string | null { return this.travelCityId; }
    public getTravelPointLabel(): string | null { return this.travelPointLabel; }
    /**
     * 🔴 [2026-09-19 主人定] 由玩家任务系统设置/清除「正奔赴哪个战役」的标注。
     *
     * 与 `travelToPoint` 的分工：那条路是**玩家单骑**去战场，标注由它自己写、抵达回调自己清；
     * 而「跟随武将赴史实战役」这条链上玩家是**随军**（`hostLegionId` 非空、位置每帧跟着军团走），
     * 走不了 `travelToPoint`（它开头就挡「你正在军中」），标注只能由外部代写 ——
     * 写的是同一个字段，HUD 动向栏与赶路播报读的也是同一个字段，**不另造第二套状态**。
     */
    public setTravelPointLabel(label: string | null): void {
        if (this.travelPointLabel === label) return;
        this.travelPointLabel = label;
        this.emitChange();
    }

    public onChange(fn: () => void): void { this.changeListeners.add(fn); }
    private emitChange(): void { for (const fn of this.changeListeners) fn(); }

    // ── 功勋（离开势力功劳清零重头开始，本势力内从 0 累积冲击下一阶门槛） ──
    public addMerit(n: number): void {
        if (n <= 0) return;
        const before = this.getRank();
        const beforeMeritRank = rankFor(this.merit, this.factionId !== null);
        this.merit += n;
        const afterMeritRank = rankFor(this.merit, this.factionId !== null);
        this.rememberRank(afterMeritRank);
        const after = this.getRank();
        if (after.id !== before.id) {
            this.syncLearnedUnits();  // 升阶 → 按配额补学本势力兵种（斥候1/探马2/先锋3）
            this.syncMoveProfile();   // 素材可能变 → 行军大类跟着变
            this.deps.notify(`🎖️ ${this.name}晋升为【${after.name}】`);
            gameLog('expedition', `[玩家] 晋升 ${before.name} → ${after.name}（功勋 ${this.merit}）`);
            // 晋升：入伍中则同步军团第九环战力乘数 + 官阶名
            const host = this.getHostLegion();
            if (host) {
                host.playerHostPowerMult = after.powerMult;
                host.playerHostRankName = after.name;
            }
            // 若在战术战场内临阵晋升（如斥候→探马），当场同步指挥编队与直播玩家技作用范围
            (window as any).game?.scene13War?.syncPlayerRankFromHero?.(
                after.control,
                this.getSelectedUnit()?.unitKey ?? null,
            );
        } else if (afterMeritRank.id !== beforeMeritRank.id) {
            this.syncLearnedUnits();  // 新势力内功勋从 0 爬升跨档 → 解锁本势力下一档兵模
            this.syncMoveProfile();
        }
        this.emitChange();
    }

    /** 打仗得的功：每场合计不超过封顶 */
    private addBattleMerit(n: number): void {
        const g = Math.min(n, PLAYER_BATTLE_MERIT_CAP - this.battleMerit);
        if (g <= 0) return;
        this.battleMerit += g;
        this.addMerit(g);
    }

    public resetMerit(reason: string = '随军战败'): void {
        const before = this.getRank();
        const prevMerit = this.merit;
        // 🔴 [2026-11-07 主人令定稿] **功劳真正归 0**、当前官职回平民（入伍再从斥候起），
        //    目的是让玩家升官后**重拿兵模（含重复的）**；资历（peakRankId）不动，战略权限照旧。
        this.merit = 0;
        this.factionId = null;
        this.army.setFactionId('');
        const rr = this.army.getRenderer();
        if (rr) rr.factionId = undefined;

        this.syncLearnedUnits();
        this.syncMoveProfile();
        const host = this.getHostLegion();
        if (host) {
            host.playerHostPowerMult = null;
            host.playerHostRankName = null;
        }
        if (prevMerit > 0 || before.id !== 'civilian') {
            this.holdAfterDefeat?.();
            const peak = this.getPeakRank();
            this.deps.notify(`💥 ${reason}！功劳归零、官职回平民，资历【${peak.name}】保留（战略权限不变）`);
            gameLog('expedition', `[玩家] ${reason}，功勋 ${prevMerit} → 0、当前官职【${before.name}】→ 平民，资历【${peak.name}】保留`);
        }
        this.emitChange();
    }

    public noteHeroDown(): void {
        this.heroDowns++;
        this.emitChange();
    }

    // ── 战败停顿：看完 3 秒残局（与胜仗同一条路）再回战略地图，原地停顿合计 9 秒（时长见 PLAYER_DEFEAT_HOLD_MS） ──
    /** 停顿截止时刻（Date.now() 口径）；≤ 现在 = 没在停顿 */
    private holdUntilMs = 0;

    /**
     * 随军战败 → 落地停顿（时长见 PLAYER_DEFEAT_HOLD_MS）。
     *
     * 🔴 [2026-11-05 主人令「无论什么模式，战术结束后，无论战败还是胜利，都统一停 3 秒」]
     *    原来这里第一句就是 `battleScene.exit()`：战败**当场**把战术画面收掉（实测距判负 0 毫秒），
     *    而胜仗走的是残局待命 `FOLLOW_SWITCH_DELAY_MS`（3 秒）—— 于是「输就秒切、赢等 3 秒」。
     *    现在战败也走同一条残局：`beginLinger()`（全军待命、旗帜继续飘）+ `beginLingerAfterDefeat(3 秒)`，
     *    到期由 `BattleSceneLayer.tick` 统一 exit；玩家的停顿改为从「真正退出战术画面」算起
     *    （扣掉这 3 秒），所以在战略地图上原地不动的总时长不变。
     *
     * 本方法在一次战败里会被重复调用 3~4 次（onHostBattleEnd / resetMerit / detach / update 军团覆灭），
     * 所以已经在停顿中就不再重新计时，否则每多调一次就多等一轮。
     */
    public holdAfterDefeat(): void {
        const game = (globalThis as any).window?.game;
        const battleScene = game?.battleScene;
        const inTactic = battleScene?.isActive?.() === true;
        const lingerMs = inTactic ? GameConfig.LEGION.FOLLOW_SWITCH_DELAY_MS : 0;
        if (inTactic) {
            game?.scene13War?.beginLinger?.();
            battleScene.beginLingerAfterDefeat(lingerMs);
        }
        if (this.holdUntilMs > Date.now()) return;   // 已在停顿中：不重复计时
        this.holdUntilMs = Date.now() + Math.max(0, PLAYER_DEFEAT_HOLD_MS - lingerMs);
    }

    /** 是否正处在战败停顿中（停顿期玩家不动） */
    public isHeld(): boolean {
        return Date.now() < this.holdUntilMs;
    }

    /** 离队停顿剩余秒数（向上取整，0 = 未停顿） */
    public getHoldRemainingSec(): number {
        const rem = this.holdUntilMs - Date.now();
        return rem > 0 ? Math.ceil(rem / 1000) : 0;
    }

    /** 大地图战略战斗结算：随军军团战胜补满本场功劳（每胜一场正好一档）；战败离开势力、官职重来。 */
    public onHostBattleEnd(result: 'victory' | 'defeat', enemyKilled: number, opponent?: any): void {
        // 这一仗主角有没有亲身上战术战场（进 13 时由 buildScene13Setup 记下），结算后作废
        const fought = this.battleArmed;
        this.battleArmed = false;
        if (result === 'defeat') {
            this.battleMerit = 0;
            // 战败立即回战略地图，从退场完成开始等待 9 秒，再走脱军清场流程。
            this.holdAfterDefeat();
            // 战败 = 脱离军团：清势力（信息栏不再显示旧势力）+ 清任务 + 关自动模式。
            // 走 onHostLost → finishQuest(false) → detach() 统一清场（含 factionId / host / 权限乘数 / 自动模式）。
            this.resetMerit('随军战败');
            // 🔴 [2026-10-26 主人报障「军团战败后，没有播报」] 脱军清场必须**推迟到本帧战斗结算之后**：
            //    结算顺序 ＝ Army.onBattleEnd（这里）→ 出战单位 onDefeat 回调 → BattleField.resolve 里
            //    的「攻城失败 / 野战结束 / 全军覆没」播报。这几处都靠 `cameraFollowUI.getFollowedArmyId()`
            //    判「是不是跟拍军团」，而**跟随玩家本人**时它取的是 `playerHero.getHostLegionId()`——
            //    原来在这里同步 detach 把 host 清成 null，判定当场落空，战败一句都不播
            //    （胜仗不 detach，所以「胜有播报、败没播报」）。本帧结算跑完再脱军。
            const lastHostId = this.hostLegionId;
            const onLost = this.onHostLost;
            window.setTimeout(() => {
                // 本帧内已被别的路径（`PlayerHero.update` 的军团覆灭分支）清过场 → 不再二次处理
                if (!lastHostId || this.hostLegionId !== lastHostId) return;
                if (onLost) onLost(lastHostId);
                else this.detach();
            }, 0);
            return;
        }
        // 打赢补满本场功劳（见 PLAYER_BATTLE_MERIT_CAP）：每场胜仗正好一档，升官只看连胜几场
        // 🔴 [2026-10-29 主人「才 10 分钟就升到兵马元帅」] 只认主角亲身上场的仗：
        //    原先随军军团在大地图上几秒打完的小仗（没进战术画面、主角没上场）也按一场补满，升官快了好几倍。
        // 🔴 [2026-09-24 主人「删除这种无聊信息」] 只记战功，不弹「大捷！随军斩敌…记战功」
        void enemyKilled;
        if (fought) this.addBattleMerit(PLAYER_BATTLE_MERIT_CAP);
        // 🔴 [2026-11-07 主人令「公侯…往后打败一个有新兵模的军队一次可以获得一个兵模」]
        if (this.hasRankPrivilege('duke')) {
            this.claimBattleSpoilUnit(opponent);
        }
        this.battleMerit = 0;
    }

    /** 公侯战利品：打败敌军时，若敌军三排中有玩家尚未收集过的陆战兵模，随机缴获 1 个 */
    private claimBattleSpoilUnit(opponent?: any): void {
        if (!opponent) return;
        const entity = typeof opponent.getEntity === 'function' ? opponent.getEntity() : opponent;
        const rawSlots: string[] = [];
        if (Array.isArray(entity?.cultureSlots) && entity.cultureSlots.length >= 9) {
            rawSlots.push(entity.cultureSlots[0], entity.cultureSlots[3], entity.cultureSlots[6]);
        } else {
            const oppFactionId: string | undefined =
                typeof opponent.getFactionId === 'function'
                    ? opponent.getFactionId()
                    : (entity?.factionId ?? opponent?.factionId);
            if (oppFactionId) {
                const fSlots = getFactionCompositionSlots(oppFactionId);
                if (fSlots) {
                    rawSlots.push(...fSlots.map((s) => s.type));
                } else {
                    const comp = getRegionLegionComposition(getFactionCultureRegion(oppFactionId));
                    if (comp?.slots) rawSlots.push(...comp.slots.map((s) => s.type));
                }
            }
        }
        const candidates = Array.from(new Set(rawSlots)).filter(
            (k) => !!k && !!WAR_TYPES[k] && !isShipUnitKey(k) && !this.learnedUnits.some((u) => u.unitKey === k),
        );
        if (candidates.length === 0) return;
        const pickKey = candidates[Math.floor(Math.random() * candidates.length)];
        const name = WAR_TYPES[pickKey]?.name ?? pickKey;
        const oppFactionId: string =
            (typeof opponent.getFactionId === 'function' ? opponent.getFactionId() : entity?.factionId) ||
            this.factionId ||
            PlayerHero.OWN_FACTION_ID;
        this.learnedUnits.push({ unitKey: pickKey, unitName: name, factionId: oppFactionId, row: 0 });
        this.peakStats = mergePlayerPeakFromUnit(this.peakStats, pickKey);
        this.deps.notify(`🎁 公侯战利品：击败敌军缴获新兵模【${name}】`);
        this.emitChange();
    }

    // ── 兵模收集（凑卡玩法核心，见 docs/AGENTS/player-rules-verbatim.md 第零节）──
    /**
     * 该官阶在**当前军团这 5 种兵模**（三排 + 将军 + 舰队）里应当已收到几种。
     * 🔴 [2026-09-09 主人定]「每个军团有四种兵模，三排 + 船；斥候/探马/先锋/将军几个级别随机奖励；
     *    加入一个军团就可以获得一个兵模，升级到探马、先锋、将军，该军团获得齐全。」
     */
    private learnQuotaForRank(rankId: PlayerRankId): number {
        const idx = PLAYER_RANKS.findIndex((r) => r.id === rankId);
        const q = (id: PlayerRankId) => PLAYER_RANKS.findIndex((r) => r.id === id);
        // 🔴 [2026-10-30 主人令「除了主将最后拿，其他四个，四阶随机给」]
        //    斥候/探马/先锋/将军 每阶随机给「三排 + 舰队」四张里的一张；元帅最后拿主将（英雄兵模）。
        if (idx >= q('marshal')) return 5;    // 元帅起：五种齐全
        if (idx >= q('general')) return 4;    // 将军：四种
        if (idx >= q('vanguard')) return 3;   // 先锋：三种
        if (idx >= q('outrider')) return 2;   // 探马：两种
        if (idx >= q('scout')) return 1;      // 斥候：一种
        return 0;                              // 平民：还没入伙，用官阶兜底形象（古典斥候骑兵）
    }

    /**
     * 当前该按谁的三排学：入伍了就看**所在军团实际编成**（`army.cultureSlots` 是运行时真值，
     * 势力专属番号编制/文化军团都已在里面），独行期回落到文化区默认表。
     * 返回按首次出现顺序去重后的兵种 key —— 就是这支军团的「三排兵模」。
     */
    private legionUnitKeys(): string[] {
        const host = this.getHostLegion();
        // 只取编制 9 队（三排）；第 10 队是主将队 = 将军兵模，另算（见 legionCommanderKey）
        const expanded = host?.cultureSlots?.slice(0, 9);
        if (expanded && expanded.length) {
            const seen: string[] = [];
            for (const k of expanded) if (k && !seen.includes(k)) seen.push(k);
            if (seen.length) return seen;
        }
        // 还没入伍（joinFaction 先于 attachTo）：按势力专属番号编制 → 文化区默认表，
        // 与他马上要加入的那支军团同源（铁律「一势力一军团一种编制」）
        const region = this.factionId ? getFactionCultureRegion(this.factionId) : null;
        const slots = (this.factionId ? getFactionCompositionSlots(this.factionId) : null)
            ?? (region ? (getRegionLegionComposition(region)?.slots ?? []) : []);
        const seen: string[] = [];
        for (const sl of slots as Array<{ type: string }>) if (sl.type && !seen.includes(sl.type)) seen.push(sl.type);
        return seen;
    }

    /**
     * 所在军团的将军兵模 = 主将队（第 10 队）兵种；与三排重复（主将无专属英雄、用前排兵种兜底）时返回 null。
     * 独行期没有军团，也返回 null。
     */
    private legionCommanderKey(): string | null {
        const slots = this.getHostLegion()?.cultureSlots;
        if (!slots || slots.length < 10) return null;
        const key = slots[9];
        return key && !isShipUnitKey(key) && !slots.slice(0, 9).includes(key) ? key : null;
    }

    /** 所在军团的战船（舰队兵模）；独行期按势力文化区取，取不到返回 null */
    private legionShipKey(): string | null {
        const host = this.getHostLegion();
        if (host) return host.navalShipAssetLock ?? getCultureNavalShip(host.cultureRegion, host.getFactionId());
        if (!this.factionId) return null;
        return getCultureNavalShip(getFactionCultureRegion(this.factionId), this.factionId) ?? null;
    }

    /**
     * 🔴 [2026-09-09 主人定]「加入哪个军团，就变成此军团三排兵模的其中一种」。
     * 入伍时调用：按官阶配额从**该军团**三排里补学（三排每张都自动换上；同文化三排重叠、
     * 一张新卡都学不到时也要换成本军团三排之一），全部逻辑在 `syncLearnedUnits(true)` 一处。
     * 🔴 [2026-10-24 主人令] 三排：加入势力 / 升探马 / 升先锋 每给一张立即换上。
     */
    public onJoinLegion(): void {
        this.syncLearnedUnits(true);
    }

    /**
     * 按当前官阶补齐应学的兵模。
     * 🔴 [2026-10-03 主人定死唯一顺序与自动换装]
     *    「乱入者应该是先随机获得三个兵种素材，获得的时候就换上新的。然后是获得舰队的，最后获得英雄的。所以当玩家最后应该保持在英雄的兵模。」
     *    [2026-10-30 改] 斥候/探马/先锋/将军 四阶随机给「三排 + 舰队」四张；元帅最后给主将（英雄兵模）。
     *    三排与主将拿到即换上；舰队有势力时画面本就用势力舰队，视同已换上。
     * 规则全文见 docs/AGENTS/player-rules-verbatim.md 0-7。
     */
    /**
     * 🔴 [2026-10-24 主人令（取代 2026-10-23「只有入伍骑兵才换」）]
     *    「乱斗模式，探马者加入势力后，兵模没有给……加入势力给一个本势力中三排兵模之一，自动换上。
     *      升为探马再给本势力中三排兵模之一，自动换上。升为先锋再给本势力中三排兵模之一，自动换上。」
     * 所以三排陆地兵模：**入伍、升探马、升先锋，每学到一张立刻换上**（见下面 land 分支）。
     * `joining` 只用于「这次没学到新卡（同文化三排重叠）时，也换成本军团三排之一」的兜底。
     * 舰队/英雄本（将军/元帅档）仍按 2026-10-23 口径：入伍时若为骑兵类才换，其余只收藏。
     */
    public syncLearnedUnits(joining = false): void {
        // 🔴 [2026-09-09 主人定「这种是玩家奖励，终身获取的」]
        //    已学兵种**永不回收**：军团战败、脱离势力、改投他家、掉阶，一律保留。
        //    配额只约束「本势力还能再学几个」，按**当前势力已学数**算，不看历史总数，
        //    所以改投新势力后照样能从头学三排，旧势力学的也还留着能选。
        const rankId = rankFor(this.merit, this.factionId !== null).id;
        const want = this.learnQuotaForRank(rankId);
        const isMarshal = PLAYER_RANKS.findIndex((r) => r.id === rankId) >= PLAYER_RANKS.findIndex((r) => r.id === 'marshal');
        if (!this.factionId) return;               // 独行期：不新收，但旧的原样保留

        const landKeys = this.legionUnitKeys();
        const cmdKey = this.legionCommanderKey();
        const shipKeyOfLegion = this.legionShipKey();
        type Pick = { key: string; row: number; ship: boolean };
        const landPool: Pick[] = landKeys.map((key, row) => ({ key, row, ship: false }));
        const shipPool: Pick[] = shipKeyOfLegion ? [{ key: shipKeyOfLegion, row: -1, ship: true }] : [];
        const heroPool: Pick[] = cmdKey ? [{ key: cmdKey, row: 3, ship: false }] : [];
        const pool = [...landPool, ...shipPool, ...heroPool];
        if (!pool.length) return;

        // 「已收到几种」只数**这个池子里的**，与别处收的互不干扰。
        // 🔴 [2026-11-07 主人令「目的是为了升官后重拿兵模，包括重复的」]
        //    陆地/主将兵模改成**按势力算**：同一个兵种在别家收过，换到这家照样再收一张（收藏里就是两张，
        //    各自记着来自哪个势力）。战船仍按全局算——`learnedShips` 是下标列表，重复登同一条船没有意义。
        const owns = (p: { key: string; ship: boolean }) => p.ship
            ? this.learnedShips.includes(p.key)
            : this.learnedUnits.some((u) => u.unitKey === p.key && u.factionId === this.factionId);
        const got = () => pool.filter(owns).length;
        /** 本军团（本势力）是否已拿到**陆地三排**里的一张（舰队不算）。 */
        const hasLandOfLegion = () => this.learnedUnits.some(
            (u) => u.factionId === this.factionId && landKeys.includes(u.unitKey),
        );

        // 🔴 [2026-10-31 主人报「玩家加入李唐、侯君集势力后，怎么不给兵模呀」]
        //    病根：2026-10-30「三排 + 舰队 四张、四阶随机」把舰队也塞进了第一张卡 —— 入伙（斥候档）那一次
        //    有 1/4 概率直接抽到战船，于是 learnedUnits 仍是空的：HUD 陆战下拉还是灰的（显示官阶兜底素材）、
        //    地图上人也还是官阶兜底形象，看起来就是「没给兵模」。
        //    两条口径并存：2026-10-24「加入势力给一个本势力中三排兵模之一，自动换上」＋
        //    2026-10-30「三排 + 舰队四张、由斥候/探马/先锋/将军四阶随机给」。
        //    落法：**在本军团一张陆地兵模都没拿到之前，这一张只许从三排里抽**（舰队押后）；
        //    拿到之后，剩下的 2 张三排 + 1 张舰队照旧由后面的官阶随机发。
        while (got() < want || (!hasLandOfLegion() && landPool.length > 0)) {
            const landRest = landPool.filter((p) => !owns(p));
            const shipRest = shipPool.filter((p) => !owns(p));
            const heroRest = heroPool.filter((p) => !owns(p));

            let pick: Pick | undefined;
            // 🔴 [2026-10-30 主人令] 三排 + 舰队 四张由斥候/探马/先锋/将军四阶随机给；主将只在元帅给，且最后拿。
            const randomRest = [...landRest, ...shipRest];
            const drawPool = !hasLandOfLegion() && landRest.length > 0 ? landRest : randomRest;
            if (drawPool.length > 0) {
                pick = drawPool[Math.floor(Math.random() * drawPool.length)];
            } else if (isMarshal && heroRest.length > 0) {
                pick = heroRest[0];
            } else {
                break; // 本阶可给的已给完（或该军团全部收齐）
            }

            if (pick.ship) {
                this.learnedShips.push(pick.key);
                // 🔴 [2026-10-30 主人令「给了兵模都自动换上」] 战船也一样：拿到即选上，离队独行时海上就是这条船
                this.selectedShip = this.learnedShips.length - 1;
                this.deps.notify(`⛵ 获得本军团战船【${pick.key}】，已换上`);
            } else {
                const name = WAR_TYPES[pick.key]?.name ?? pick.key;
                this.learnedUnits.push({ unitKey: pick.key, unitName: name, factionId: this.factionId, row: pick.row });
                this.peakStats = mergePlayerPeakFromUnit(this.peakStats, pick.key);
                // 🔴 [2026-10-24 主人令「加入势力给一个本势力中三排兵模之一，自动换上；升为探马再给…自动换上；
                //    升为先锋再给…自动换上」] 三排陆地兵模：入伍与升阶（斥候/探马/先锋）每学到一张**立刻换上**。
                //    取代 2026-10-23「只有入伍拿到的骑兵才换」——那条会让 174 个无骑兵三排的势力入伍后
                //    模型不变（看起来就是「兵模没有给」），升阶也一直不换。
                if (pick.row >= 0 && pick.row <= 2) {
                    // 三排（斥候/探马/先锋档）：入伍、升阶每学到一张立刻换上
                    this.selectedUnit = this.learnedUnits.length - 1;
                    this.syncMoveProfile();
                    this.deps.notify(`🛡️ 换上新兵模【${name}】`);
                } else if (pick.row === 3) {
                    // 🔴 [2026-10-30 主人令] 主将兵模（元帅档）拿到即换上并保持
                    this.selectedUnit = this.learnedUnits.length - 1;
                    this.syncMoveProfile();
                    this.deps.notify(`🛡️ 换上新兵模【${name}】`);
                } else {
                    this.deps.notify(`🛡️ 学到新兵模【${name}】（可在面板里自己换）`);
                }
            }
        }

        // 🔴 [2026-10-15 主人报障「乱入者加入封建时代河中军团却还是火枪手」]
        //    病根：got() 按「已拥有的本军团池子兵种数」算，重叠兵种（如乌兹别克 elite_kipchak 与河中同名）
        //    会让 got() ≥ want ⇒ 一个都不新学、不自动换装，旧势力的兵模（火枪手）残留。
        //    补一条：即便没新学，只要当前穿的兵模不在本军团三排（也不在主将队），就换成已学的本军团三排之一。
        //    （restoreSaveState 只 joinFaction 不 attachTo，onJoinLegion 那套换装跑不到，必须落在这里才兜得住。）
        // 🔴 [2026-10-24 主人「加入势力给一个本势力中三排兵模之一，自动换上」] 兜底不再限骑兵：
        //    同文化势力三排重叠时一张新卡都学不到，也要换成本势力三排之一，否则看起来仍是「兵模没有给」。
        if (joining) {
            const currentKey = this.getSelectedUnit()?.unitKey;
            const inLegion = !!currentKey && (landKeys.includes(currentKey) || currentKey === cmdKey);
            if (!inLegion) {
                const ownedIdx = this.learnedUnits
                    .map((u, i) => ({ u, i }))
                    .filter((x) => landKeys.includes(x.u.unitKey));
                if (ownedIdx.length) {
                    const pick = ownedIdx[Math.floor(Math.random() * ownedIdx.length)];
                    if (pick.i !== this.selectedUnit) {
                        this.selectedUnit = pick.i;
                        this.syncMoveProfile();
                        this.deps.notify(`🛡️ 换上本军团兵模【${pick.u.unitName}】`);
                    }
                }
            }
        }
    }

    /** 面板选兵种素材（探马及以上才开放，见 PlayerHUD） */
    public selectUnit(idx: number): void {
        this.selectedUnit = idx >= 0 && idx < this.learnedUnits.length ? idx : -1;
        this.syncMoveProfile();
        this.emitChange();
    }

    /** 无势力时玩家自选的战船下标（指向 learnedShips）；-1 = 独木舟 */
    public selectedShip = -1;

    /**
     * 当前海上兵模。🔴 [2026-09-09 主人定] 分两种情况，别混：
     *   · **有势力** → 一律画**该势力的舰队兵模**，玩家自己那条不显示、也不可选。
     *     入伍了就用所在军团的船（同一支舰队），没入伍就按势力文化区取舰队船。
     *   · **无势力**（单骑独行）→ 才轮到玩家自己挑：已获战船里选一条，没有就独木舟。
     * 已获战船（learnedShips，随军团四种兵模的档位随机抽到）只在**无势力**时才用得上，
     * 有势力时它只是收藏，不影响画面。
     */
    public get shipKey(): string {
        if (this.factionId) {
            const host = this.getHostLegion();
            if (host) return host.navalShipAssetLock ?? getCultureNavalShip(host.cultureRegion, host.getFactionId());
            return getCultureNavalShip(getFactionCultureRegion(this.factionId), this.factionId);
        }
        return this.learnedShips[this.selectedShip] ?? PLAYER_START_SHIP_KEY;
    }

    /** 无势力时才允许换船（有势力一律随势力舰队） */
    public canPickShip(): boolean { return !this.factionId; }

    public selectShip(idx: number): void {
        if (!this.canPickShip()) return;
        this.selectedShip = idx >= 0 && idx < this.learnedShips.length ? idx : -1;
        this.emitChange();
    }

    public getSelectedUnit(): LearnedUnit | null {
        return this.learnedUnits[this.selectedUnit] ?? null;
    }

    // ── 势力 ──────────────────────────────────────────────
    /**
     * @param learnOnAttach 紧接着就 `attachTo` 时传 true：兵模留到挂上军团后按**该军团实际编成**学。
     *   入伍前只能按势力默认军团查编制，而一武将一军团，约三成武将的军团与势力默认不同——
     *   在这里先学会多拿一张别的军团的兵模（还抬高 peakStats），紧接着又换一次。
     */
    public joinFaction(factionId: string, cultureKey?: string | null, learnOnAttach = false): void {
        this.factionId = factionId;
        const floorRank = rankFor(this.merit, true);
        this.rememberRank(floorRank);
        if (cultureKey) this.lastCulture = cultureKey;
        this.army.setFactionId(factionId);
        if (!learnOnAttach) this.syncLearnedUnits(true);  // 读档只入伙不入伍：按势力默认军团学
        this.syncMoveProfile();   // 素材换成学到的兵 → 行军大类跟着变
        const r = this.army.getRenderer();
        if (r) r.factionId = factionId;
        this.emitChange();
    }

    // ── 入伍 / 离队 ──────────────────────────────────────
    public attachTo(host: Army): void {
        this.cancelChase();
        this.cancelTravel();
        this.hostLegionId = host.id;
        // 第九环·玩家官阶：入伍时把官阶战力乘数 + 4 字官阶名写到军团
        host.playerHostPowerMult = this.getRank().powerMult;
        host.playerHostRankName = this.getRank().name;
        // 🔴 [2026-09-09 主人定] 加入军团即从该军团三排里取兵模并换上（见 docs/AGENTS/player-hero.md）
        this.onJoinLegion();
        if (this.hasRankPrivilege('duke') && (this.customRowUnits || this.customLegionName)) {
            this.applyCustomLegionToArmy(host);
        }
        const p = host.getPosition();
        this.army.setPosition(p.lat, p.lng);
        this.deps.followCamera();
        this.emitChange();
    }

    public detach(): void {
        if (!this.hostLegionId) return;
        // 统一铁律：玩家脱离军团 = 功勋归零降职（无论战败覆灭还是主动离队，一律清零）
        this.holdAfterDefeat();
        this.resetMerit('脱离军团');
        const host = this.getHostLegion();
        if (host) {
            host.playerHostPowerMult = null;   // 离队：清第九环加成
            host.playerHostRankName = null;
            const p = host.getPosition();
            this.army.setPosition(p.lat, p.lng);
        }
        this.hostLegionId = null;
        this.army.setVisible(true);   // 离队：不再跟随军团隐身
        // [2026-09-05 玩家] 退出势力：离队后不再属于该势力，不挂势力旗帜
        this.factionId = null;
        this.army.setFactionId('');
        this.syncLearnedUnits();  // 退出势力：已学兵模**不回收**（终身奖励），这里只是刷新配额口径
        this.syncMoveProfile();   // 素材回官阶兜底形象（古典斥候骑兵，骑兵档）
        const rr = this.army.getRenderer();
        if (rr) rr.factionId = undefined;
        this.deps.releaseCamera();
        this.emitChange();
    }

    // ── 行军 ──────────────────────────────────────────────
    /**
     * 点据点：沿路网前往。入伍中不可单独行动。
     * @param keepChase 追击续航内部调用时为 true —— 这段路只是追人的一程，不算玩家改主意。
     *   玩家手点据点时为 false（默认），会放弃正在进行的追击。
     */
    public travelToCity(
        cityId: string,
        keepChase = false,
        /** 🔴 [2026-10-25 主人令「攻城战就去攻打的城」] 远距经典战的接任务城（被攻的城）不一定有在场武将，
         *  但玩家必须能自己走过去 —— 只给经典战触发流程开这个口子，不全局放开。 */
        opts?: { allowNoGeneral?: boolean },
    ): boolean {
        if (!keepChase) this.cancelChase();
        this.travelPointLabel = null;
        if (this.hostLegionId) {
            this.deps.notify('你正在军中，随军出征，军团解散前不可离开');
            return false;
        }
        const city = this.deps.cityManager.getCity(cityId);
        if (!city) return false;
        // 🔴 [2026-10-18 主人定「玩家只能找在场的武将接任务」] 直接找据点武将时（非追击续航锚点城），目标据点必须有在场武将
        // 🔴 [2026-10-25 主人令「攻城战就去攻打的城」] 例外：远距经典战的接任务城（被攻的城）由
        //    PlayerQuestSystem 显式传 allowNoGeneral 放行，只有这一条路能去「此刻无将」的城。
        if (!keepChase && !opts?.allowNoGeneral) {
            const start = getScriptEventStart();
            const hasOnStage = (start && start.cityId === cityId)
                ? isGeneralOnStage(start.generalId)
                : getCityAnchoredGenerals(cityId).some((g) => isGeneralOnStage(g.generalId));
            if (!hasOnStage) {
                this.deps.notify(`【${city.name}】武将不在场`);
                return false;
            }
        }
        const pos = this.army.getPosition();
        const target = { lat: city.latitude, lng: city.longitude };
        if (getEuclideanDistance(pos, target) <= PLAYER_CITY_ARRIVE_DIST) {
            if (this.isHeld()) {
                this.travelCityId = cityId;
                this.travelPointLabel = null;
                this.army.setTargetCity(city);
                this.army.setOnArriveCallback(() => this.handleArrive(cityId));
                this.army.moveAlongPath([{ lat: target.lat, lng: target.lng }]);
                this.deps.followCamera();
                this.emitChange();
                return true;
            }
            this.cancelTravel();
            // 追人途中或环球/航行路过脚下据点：只是路过，不触发城中对话（同 handleArrive 的闸门）
            if (!this.chaseArmyId && !this.isTourMode()) this.onArriveCity?.(city);
            return true;
        }
        if (!roadRegistry.isInitialized()) return false;
        const nearest = roadRegistry.getNearestCityId(pos.lat, pos.lng)
            ?? roadRegistry.getNearestCityId(pos.lat, pos.lng, 5)
            ?? roadRegistry.getNearestCityId(pos.lat, pos.lng, 30);
        let path = roadRegistry.getFullPathToCity(pos, cityId, nearest);
        if (!path || path.length < 2) path = roadRegistry.getFullPathToCity(pos, cityId, undefined);
        if (!path || path.length < 2) {
            this.deps.notify(`无路可达【${city.name}】`);
            return false;
        }
        this.travelCityId = cityId;
        this.travelPointLabel = null;
        this.army.setTargetCity(city);
        this.army.setOnArriveCallback(() => this.handleArrive(cityId));
        this.army.moveAlongPath(path.map((p) => ({ lat: p.lat, lng: p.lng, sea: (p as any).sea })));
        this.deps.followCamera();
        this.emitChange();
        return true;
    }

    /**
     * 去找带着武将的那支军团（在不在城中都能找）。每帧由 stepChase 续航：
     * 军团走了就重新规划，够近了就触发会面。入伍中不可单独行动。
     */
    /** 彻底放弃追击（玩家改点别处、入伍、离队） */
    public cancelChase(): void { this.chaseArmyId = null; this.chaseGeneralName = null; }

    /**
     * 🔴 [2026-09-14 主人定]「玩家要抵达战场才能触发」—— 战场**不是据点**，不在路网里，
     *    所以 `travelToCity` 用不上（它只认 city id）。
     *
     *    走法：沿路网走到离战场最近的路点，最后一段直接走过去。实测两个战场分别距现成道路
     *    10.2 km 与 0.2 km，所以**不需要给战场画任何专用道路**。
     *    抵达后回调，由任务系统弹选边对话。
     */
    public travelToPoint(
        target: { lat: number; lng: number },
        label: string,
        onArrive?: () => void,
    ): boolean {
        this.cancelChase();
        if (this.hostLegionId) {
            this.deps.notify('你正在军中，随军出征，军团解散前不可离开');
            return false;
        }
        const pos = this.army.getPosition();
        if (!this.isHeld() && getEuclideanDistance(pos, target) * 111 <= 2) {
            this.travelPointLabel = null;
            onArrive?.();       // 已经站在跟前了
            return true;
        }
        let path = roadRegistry.findPathOnRoad(pos, target);
        if (!path || path.length < 2) {
            // 🔴 [2026-09-16 主人报障「无路可达【波斯门战役】」]
            //    战场**不是据点、不在路网上**（见 Battlefields.ts）。`findPathOnRoad` 要求
            //    起终点各自 1.0° 内有据点，而波斯门深在扎格罗斯山里，最近的波斯波利斯都有
            //    167km（1.508°），够不着就直接判无路 —— 玩家于是永远到不了那个战场。
            //    山里没城是**史实**（正是它「一夫当关」的前提），不能为了让路通就往山里塞城。
            //    所以回落：沿路网走到离战场最近的那座城，最后一段直奔战场。
            const anchor = roadRegistry.getNearestCityPos(target.lat, target.lng, 5);
            if (anchor) {
                const viaAnchor = roadRegistry.findPathOnRoad(pos, anchor);
                if (viaAnchor && viaAnchor.length >= 2) path = [...viaAnchor, target];
            }
        }
        if (!path || path.length < 2) {
            this.travelPointLabel = null;
            this.deps.notify(`无路可达【${label}】`);
            return false;
        }
        const marchPath = joinStartToRoadPolyline(pos, path, GameConfig.ROAD.JOIN_EPS);
        this.travelCityId = null;
        this.travelPointLabel = label;
        this.army.setTargetCity(null);
        let fired = false;
        this.army.setOnArriveCallback(() => {
            if (fired) return;   // 到达回调只认一次，避免停步抖动重复触发
            fired = true;
            this.travelPointLabel = null;
            this.deps.releaseCamera();
            this.emitChange();
            onArrive?.();
        });
        this.army.moveAlongPath(marchPath.slice(1).map((p: any) => ({ lat: p.lat, lng: p.lng, sea: p.sea })));
        this.deps.followCamera();
        this.emitChange();
        return true;
    }

    public travelToArmy(armyId: string, generalName?: string): boolean {
        if (this.hostLegionId) {
            this.deps.notify('你正在军中，随军出征，军团解散前不可离开');
            return false;
        }
        const army = this.deps.getLegionById(armyId);
        if (!army || army.isDestroyed || army.getTroops() <= 0) return false;
        if (!army.generalId || !isGeneralOnStage(army.generalId)) return false;
        this.chaseArmyId = armyId;
        this.chaseGeneralName = generalName ?? null;
        if (!this.isHeld()) this.stepChase(true);
        return this.chaseArmyId != null;
    }

    /**
     * 追击续航（每帧，未入伍时调）：
     *   ① 军团没了 → 放弃，交回自动模式重新选目标
     *   ② 够近了 → 停下会面
     *   ③ 否则：锚点城 = 军团正在去的城 ?? 军团脚下最近的城；锚点变了或自己停下了就重新规划
     * 🔴 重新规划走的还是 travelToCity（沿路网），只是抵达锚点城时**不触发城中对话**
     *    —— 见 handleArrive 里的 chaseArmyId 闸门，追人途中路过的城不算数。
     */
    private stepChase(force = false): void {
        const id = this.chaseArmyId;
        if (!id) return;
        const army = this.deps.getLegionById(id);
        if (!army || army.isDestroyed || army.getTroops() <= 0 || !army.generalId || !isGeneralOnStage(army.generalId)) {
            this.chaseArmyId = null;
            this.chaseGeneralName = null;
            this.cancelTravel();
            this.deps.notify('要找的将领所部已覆灭，另寻他人');
            this.emitChange();
            return;
        }
        const me = this.army.getPosition();
        const it = army.getPosition();
        if (getEuclideanDistance(me, it) <= PLAYER_CITY_ARRIVE_DIST) {
            // 🔴 [2026-10-29 主人「武将正在交战，为什么不能直接加入」] 原先追上了但军团在交战就原地干等到打完；
            //    现在照常会面、当场入伍（这一仗已经开打，主角从下一仗起上阵；这一仗打赢不记功，见 battleArmed）。
            this.chaseArmyId = null;
            this.chaseGeneralName = null;
            this.cancelTravel();
            this.deps.followCamera();
            this.emitChange();
            this.onMeetArmy?.(army);
            return;
        }
        // 锚点：军团正在去的城优先（追它的落脚点比追它的当前坐标更省路）
        const anchor: string | null = army.getTargetCity()?.id
            ?? roadRegistry.getNearestCityId(it.lat, it.lng)
            ?? null;
        if (!anchor) return;
        if (force || this.travelCityId !== anchor || this.army.isIdle()) {
            const keep = this.chaseArmyId;
            const ok = this.travelToCity(anchor, true);
            this.chaseArmyId = keep;   // travelToCity 内部可能触发到达清理，追击标记要留住
            // 🔴 规划失败（无路可达/路网未就绪）就放弃追击：不放弃的话下一帧还会走到这儿，
            //    「无路可达」的提示会每帧刷屏，玩家也永远停在原地。
            if (!ok) {
                this.chaseArmyId = null;
                this.chaseGeneralName = null;
                this.emitChange();
            }
        }
    }

    /** 停止行军。⚠️ 不清 chaseArmyId —— 追击靠它续航，停的只是当前这一段路。
     *  要彻底放弃追击请用 cancelChase()。 */
    public cancelTravel(): void {
        this.travelPointLabel = null;
        if (!this.travelCityId && this.army.isIdle()) return;
        this.travelCityId = null;
        this.army.stopMovement(false);
        this.army.setTargetCity(null);
        this.deps.releaseCamera();
    }

    private handleArrive(cityId: string): void {
        if (this.travelCityId !== cityId) return;
        this.travelCityId = null;
        this.army.setTargetCity(null);
        // 追人途中：锚点城只是路上的一站，不谈事；下一帧 stepChase 会继续往军团那边走
        if (this.chaseArmyId) { this.emitChange(); return; }
        // 环球/航行：路过即走，不触发城中对话，下一帧 stepTour 挑下一站
        if (this.isTourMode()) { this.deps.releaseCamera(); this.emitChange(); return; }
        const city = this.deps.cityManager.getCity(cityId);
        this.deps.releaseCamera();
        this.emitChange();
        if (city) this.onArriveCity?.(city);
    }

    /** 每帧（大战略未暂停时）：入伍则贴军团，否则自己走路 */
    public update(dt: number): void {
        const r = this.army.getRenderer();
        if (this.hostLegionId) {
            const host = this.getHostLegion();
            if (!host || host.isDestroyed || (host.getTroops() <= 0 && !host.getIsInCombat())) {
                const lastId = this.hostLegionId;
                // 🔴 [2026-09-11 修「玩家依然是军团一战败就移动，不等」] 停顿必须**也**落在这条路上。
                //    原来只有 onHostBattleEnd('defeat') 里落停顿，而那个回调的触发条件是
                //    `game.playerHero.getHostLegionId() === this.id`（见 Army.onBattleEnd）——
                //    军团被打光时，玩家 update 往往**先**跑到这里检测到 isDestroyed / troops<=0，
                //    detach() 把 hostLegionId 清成 null，等 Army.onBattleEnd 再回调时条件已不成立，
                //    onHostBattleEnd 根本不会执行，停顿也就从没落过 —— 主人看到的就是「一战败就走」。
                //    两条路都落一次，holdAfterDefeat 是幂等的（只改截止时刻），重复调用无害。
                this.holdAfterDefeat();
                // 🔴 不清 hostLegionId：让 onHostLost → finishQuest(false)/detach() 统一「清军团+退出势力+归零」。
                //    ⚠️ [2026-09-08] onHostLost 现在**无论有没有任务都会 detach**（见 PlayerQuestSystem.onHostLost），
                //    否则这里每帧重入、玩家被钉在死军团上动不了、自动模式也永不触发。
                this.resetMerit('随军军团解散');
                this.emitChange();
                this.onHostLost?.(lastId);
                // 兜底：回调没接线或它没解绑时自己清掉，绝不让这个分支空转
                if (this.hostLegionId === lastId) this.detach();
                return;
            }
            const p = host.getPosition();
            this.army.setPosition(p.lat, p.lng);
            this.army.isOnSea = host.isOnSea;
            // 随军军团隐身（神出鬼没等）时玩家精灵跟着隐身/现形
            if (this.army.visible !== host.visible) this.army.setVisible(host.visible);
            const hr = host.getRenderer();
            if (host.isOnSea) {
                // 🔴 [2026-09-09 主人定] 有势力 → 画势力舰队兵模（shipKey 内部已按势力/军团取），
                //    玩家自己那条船在有势力时不显示。
                const hostShip = this.shipKey;
                this.army.navalShipAssetLock = hostShip;
                if (r) (r as any).navalShipAssetLock = hostShip;
            } else {
                this.army.navalShipAssetLock = null;
                if (r) (r as any).navalShipAssetLock = null;
            }
            if (r) {
                r.isOnSea = hr?.isOnSea ?? host.isOnSea;
                r.isMoving = hr?.isMoving ?? host.isMarching();
                r.isAttacking = hr?.isAttacking ?? false;
                r.currentBattleType = hr?.currentBattleType ?? null;
                r.targetPos = hr?.targetPos ?? null;
                // lastDirection 由 GlobalUnitRenderer 写在 IAnimatedUnit 上（UnitRenderer 类型未声明）
                const hd = (hr as unknown as { lastDirection?: number } | null)?.lastDirection;
                if (hd !== undefined) (r as unknown as { lastDirection?: number }).lastDirection = hd;
            }
            return;
        }
        // 🔴 [2026-10-29 主人定 9 秒，原 2026-09-11 定 5 秒]「玩家离开势力后，停留9秒倒计时，然后再移动」：
        //    停顿期内不吃 dt、不续航追击 —— 坐标就钉在战败那一刻，9 秒后照令继续赶路。
        //    指令本身照常受理（没有加「停顿期不许下令」这条额外约束）：
        //    这 9 秒里观众竞选的去处、玩家手点的城，都会在停顿结束后自然出发（自动寻将要等停顿结束才选）。
        if (!this.isHeld()) {
            this.army.update(dt);
            // 追将领：每帧续航（军团在动，锚点跟着变；够近了就会面）
            if (this.chaseArmyId) this.stepChase();
            this.stepTour();
        }
        if (this.army.isOnSea) {
            // 🔴 [2026-09-09 修] 原来写死 MERCHANT_SHIP（商船），与「初始海上兵模是独木舟」的定案不符。
            //    改成走 shipKey：有势力 = 势力舰队船，无势力 = 玩家自选（默认独木舟）。
            const ship = this.shipKey;
            this.army.navalShipAssetLock = ship;
            if (r) (r as any).navalShipAssetLock = ship;
        } else {
            this.army.navalShipAssetLock = null;
            if (r) (r as any).navalShipAssetLock = null;
        }
        if (r) {
            r.isOnSea = this.army.isOnSea;
            // 停顿期内人是钉住的：即便这 9 秒里已受理了新的行军指令（army 处于 marching），
            // 也不能播走路动画，否则会看到「原地踏步」
            r.isMoving = !this.isHeld() && this.army.isMarching();
            r.isAttacking = false;
            r.currentBattleType = null;
        }
    }

    /** 离玩家最近的据点（对话/HUD 用） */
    public nearestCity(): City | null {
        const pos = this.army.getPosition();
        let best: City | null = null;
        let bd = Infinity;
        for (const c of this.deps.cityManager.getCities()) {
            const d = getEuclideanDistance(pos, { lat: c.latitude, lng: c.longitude });
            if (d < bd) { bd = d; best = c; }
        }
        return bd <= PLAYER_CITY_ARRIVE_DIST ? best : null;
    }

    // ── 战术模式布置 ──────────────────────────────────────
    /** 军团进 13 时由 Scene13WarLayer 调：玩家不在军中返回 null（不布置） */
    public buildScene13Setup(followedOnDefenderSide: boolean): Scene13PlayerSetup | null {
        if (!this.hostLegionId) return null;
        this.battleMerit = 0;   // 新的一场仗，功劳封顶重新算
        this.battleArmed = true;   // 主角亲身上场：这一仗打赢才补满功劳
        const rank = this.getRank();
        // 🔴 [2026-09-18 主人定]「玩家永远不能改变军团的兵种」—— 不再下发 eliteLane。
        //    原先把玩家自选精锐传进 13、顶替编制里的一口，那是 AI 从「必须 9 支」反推的，
        //    主人原话（player-rules-verbatim 三·二 12a~12e）只讲控制权，没有一条允许玩家带兵改编制。
        return {
            side: followedOnDefenderSide ? 1 : 0,
            heroKey: this.heroKey,
            heroName: this.name,
            heroStats: clonePlayerPeakStats(this.peakStats),
            control: rank.control,
            unitKey: this.getSelectedUnit()?.unitKey ?? null,
            onKill: () => this.addBattleMerit(PLAYER_KILL_MERIT),
            onHeroDown: () => this.noteHeroDown(),
        };
    }

    /**
     * 🔴 [2026-10-22 主人令] 小队模式（故事块小仗）用：玩家不在军中也能上场，只以本人身份打，不指挥部队。
     */
    public buildScene13SkirmishSetup(side: 0 | 1): Scene13PlayerSetup {
        this.battleMerit = 0;
        return {
            side,
            heroKey: this.heroKey,
            heroName: this.name,
            heroStats: clonePlayerPeakStats(this.peakStats),
            control: 'none',
            unitKey: null,
            onKill: () => this.addBattleMerit(PLAYER_KILL_MERIT),
            onHeroDown: () => this.noteHeroDown(),
        };
    }

    // ── 存档 ──────────────────────────────────────────────
    public toSaveState(): PlayerSaveState {
        const p = this.army.getPosition();
        return {
            merit: this.merit,
            rankId: this.getPeakRank().id,
            playerName: this.playerName,
            lastCulture: this.lastCulture,
            heroDowns: this.heroDowns,
            factionId: this.factionId,
            learnedUnits: this.learnedUnits.map((u) => ({ ...u })),
            peakStats: clonePlayerPeakStats(this.peakStats),
            selectedUnit: this.selectedUnit,
            manualUnitPick: this.manualUnitPick,
            learnedShips: [...this.learnedShips],
            selectedShip: this.selectedShip,
            lat: p.lat,
            lng: p.lng,
            storyDone: [...this.storyDone],
            storyFlags: [...this.storyFlags],
            horses: this.horses.toSave(),
            tourCaravanDir: this.tourCaravanDir,
            tourShipDir: this.tourShipDir,
            livePortrait: this.livePortrait,
            ownFactionName: this.ownFactionName,
            ownFlagChar: this.ownFlagChar,
            alliedFactionId: this.alliedFactionId,
            fiefCityId: this.fiefCityId,
            customLegionName: this.customLegionName,
            customRowUnits: this.customRowUnits ? [...this.customRowUnits] : null,
            mergedGenerals: [...this.mergedGenerals],
        };
    }

    public restoreSaveState(s: PlayerSaveState): void {
        this.hostLegionId = null;
        this.cancelChase();
        this.cancelTravel();
        this.merit = Math.max(0, s.merit ?? 0);
        this.peakRankId = s.rankId && PLAYER_RANKS.some((r) => r.id === s.rankId)
            ? s.rankId
            : rankFor(this.merit, !!s.factionId).id;
        this.rememberRank(rankFor(this.merit, !!s.factionId));
        const checkedName = typeof s.playerName === 'string' ? moderateLiveName(s.playerName) : null;
        this.rename(checkedName && checkedName.ok ? checkedName.name : PLAYER_HERO_NAME);
        this.lastCulture = typeof s.lastCulture === 'string' && s.lastCulture ? s.lastCulture : null;
        this.heroDowns = s.heroDowns ?? 0;
        this.learnedUnits = (s.learnedUnits ?? [])
            .filter((u) => u?.unitKey && !isShipUnitKey(u.unitKey))
            .map((u) => ({ ...u, unitName: WAR_TYPES[u.unitKey]?.name ?? u.unitName }));
        this.peakStats = restorePlayerPeakStats(s.peakStats, this.learnedUnits.map((u) => u.unitKey));
        this.selectedUnit = s.selectedUnit ?? -1;
        this.manualUnitPick = s.manualUnitPick ?? false;
        this.learnedShips = [...(s.learnedShips ?? [])];
        // 旧存档没有内置船：补在末尾，不打乱已存的 selectedShip 下标
        for (const k of PLAYER_BUILTIN_SHIP_KEYS) if (!this.learnedShips.includes(k)) this.learnedShips.push(k);
        this.selectedShip = s.selectedShip ?? -1;
        this.storyDone = [...(s.storyDone ?? [])];
        this.storyFlags = [...(s.storyFlags ?? [])];
        this.tourCaravanDir = s.tourCaravanDir || null;
        this.tourShipDir = s.tourShipDir || null;
        this.livePortrait = typeof s.livePortrait === 'string' && s.livePortrait.trim() ? s.livePortrait.trim() : null;
        this.ownFactionName = typeof s.ownFactionName === 'string' && s.ownFactionName.trim() ? s.ownFactionName.trim() : '探马军';
        this.ownFlagChar = typeof s.ownFlagChar === 'string' && s.ownFlagChar.trim() ? s.ownFlagChar.trim().slice(0, 1) : '探';
        this.alliedFactionId = typeof s.alliedFactionId === 'string' && s.alliedFactionId ? s.alliedFactionId : null;
        this.fiefCityId = typeof s.fiefCityId === 'string' && s.fiefCityId ? s.fiefCityId : null;
        this.customLegionName = typeof s.customLegionName === 'string' ? s.customLegionName.trim() : '';
        this.customRowUnits = Array.isArray(s.customRowUnits) && s.customRowUnits.length === 3
            ? [s.customRowUnits[0], s.customRowUnits[1], s.customRowUnits[2]]
            : null;
        this.mergedGenerals = Array.isArray(s.mergedGenerals) ? [...s.mergedGenerals] : [];
        this.horses.restore(s.horses);
        // 马系统之前的存档：梦醒只记了标记「初马」，读档时补上这匹马
        if (this.horses.isEmpty() && this.storyFlags.includes('初马')) this.giveFirstHorse();
        if (s.factionId) this.joinFaction(s.factionId, this.lastCulture);
        else {
            this.factionId = null;
            this.army.setFactionId('');
            const renderer = this.army.getRenderer();
            if (renderer) renderer.factionId = '';
            this.syncMoveProfile();
        }
        if (Number.isFinite(s.lat) && Number.isFinite(s.lng)) this.army.setPosition(s.lat, s.lng);
        this.emitChange();
    }

    /**
     * 🔴 [2026-10-22 通灵] 通灵战役完全同步：把那一仗里的一种兵放进兵模收藏（已有就不重复）。
     * 不强行换装；独行时外观照「骑兵优先」的老规矩自己挑（见 syncMoveProfile）。返回兵种中文名，已有返回 null。
     */
    public learnUnitFromMemory(unitKey: string, factionId: string): string | null {
        if (this.learnedUnits.some((u) => u.unitKey === unitKey)) return null;
        const name = WAR_TYPES[unitKey]?.name ?? unitKey;
        this.learnedUnits.push({ unitKey, unitName: name, factionId, row: 0 });
        this.peakStats = mergePlayerPeakFromUnit(this.peakStats, unitKey);
        this.syncMoveProfile();
        this.emitChange();
        return name;
    }

    /** 🔴 [2026-10-22] URT-01 梦醒：得到通灵马「初马」（谱系第 1 代；六岁母马） */
    public giveFirstHorse(): void {
        if (this.horses.getSpirit()) return;
        this.horses.addHorse({ name: '初马', sex: 'mare', age: 6, origin: '凡湖岸边自己走来', spirit: true });
    }

    public static rankLabel(id: PlayerRank['id']): string {
        return PLAYER_RANKS.find((r) => r.id === id)?.name ?? id;
    }
}
