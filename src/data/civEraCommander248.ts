/**
 * 248 类主将兵模表：62 个二级文明 × 4 个时代，每格一到多个兵模（英雄 / 精锐 / 高级）。
 * 🔴 [2026-10-05 主人令] 62 个文明按文化与样子分配英雄兵模，不分时代；战车、战象可当英雄兵模用（高丽战车、孟加拉战车、波斯战象精锐、桑纳亚战象高级等，热兵器的不用）；不用别的精锐 / 高级兵种。
 *    吕布与孙权的攻击都是弩，不放进同一个文明；日本用马上枪（孙策），不用马上刀（关羽）。
 * 🔴 [2026-10-05 主人定稿] 来源 = docs/02-design/248分类-英雄兵模归类-草稿.md（主人过目定稿，一格一格归的）。
 *    · 年代界线：古典 ≤400｜封建 400–1050｜城堡 1050–1500｜帝国 1500–1900。
 *    · 武将的年代 = GENERAL_ERA（按成名盛年算，不按出生）。
 *    · 查表入口 resolveCivEraCommander：按武将**所属文明**查，查不到文明就返回 null，绝不兜底成华夏。
 *    · 游戏里有同名英雄的武将，直接用同名英雄（见 generalHeroUnits.ts 的 GENERAL_HERO_UNITS，例：曹操用曹操）；没有的才查本表。
 *    · 同一格有多个兵模时，每局从随机池里随机挑：本局开始时抽一个随机种子，同一局内同一武将始终是同一个，下一局重新抽。
 */
import { GENERAL_ERA, type GeneralEra } from './GeneralEra';
import { getFactionIdOfGeneral, getFactionGeneral } from './FactionGenerals';
import { CITIES_V2 } from './cities_v2';

export type CivEraCell = readonly string[];
export type CivEraRow = Readonly<Record<GeneralEra, CivEraCell>>;

export const CIV_ERA_COMMANDER_248: Readonly<Record<string, CivEraRow>> = {
    '华夏': { antiquity: ['hero_lubu', 'hero_guanyu', 'hero_zhangfei', 'hero_liubei'], feudal: ['hero_lubu', 'hero_guanyu', 'hero_zhangfei', 'hero_liubei'], castle: ['hero_lubu', 'hero_guanyu', 'hero_zhangfei', 'hero_liubei'], imperial: ['hero_lubu', 'hero_guanyu', 'hero_zhangfei', 'hero_liubei'] },
    '巴蜀': { antiquity: ['hero_zhugeliang', 'hero_liubei', 'hero_guanyu', 'hero_zhangfei'], feudal: ['hero_zhugeliang', 'hero_liubei', 'hero_guanyu', 'hero_zhangfei'], castle: ['hero_zhugeliang', 'hero_liubei', 'hero_guanyu', 'hero_zhangfei'], imperial: ['hero_zhugeliang', 'hero_liubei', 'hero_guanyu', 'hero_zhangfei'] },
    '江南': { antiquity: ['hero_sunce', 'hero_sunjian', 'hero_sunquan'], feudal: ['hero_sunce', 'hero_sunjian', 'hero_sunquan'], castle: ['hero_sunce', 'hero_sunjian', 'hero_sunquan'], imperial: ['hero_sunce', 'hero_sunjian', 'hero_sunquan'] },
    '河朔': { antiquity: ['hero_caocao', 'hero_lubu'], feudal: ['hero_caocao', 'hero_lubu'], castle: ['hero_caocao', 'hero_lubu'], imperial: ['hero_caocao', 'hero_lubu'] },
    '河西': { antiquity: ['hero_girgenkhan', 'hero_qutlugh'], feudal: ['hero_girgenkhan', 'hero_qutlugh'], castle: ['hero_girgenkhan', 'hero_qutlugh'], imperial: ['hero_girgenkhan', 'hero_qutlugh'] },
    '白山黑水': { antiquity: ['hero_girgenkhan', 'hero_kotyankhan'], feudal: ['hero_girgenkhan', 'hero_kotyankhan'], castle: ['hero_girgenkhan', 'hero_kotyankhan'], imperial: ['hero_girgenkhan', 'hero_kotyankhan'] },
    '高丽': { antiquity: ['elite_war_wagon', 'hero_sunquan'], feudal: ['elite_war_wagon', 'hero_sunquan'], castle: ['elite_war_wagon', 'hero_sunquan'], imperial: ['elite_war_wagon', 'hero_sunquan'] },
    '日本': { antiquity: ['hero_sunce', 'hero_sunjian'], feudal: ['hero_sunce', 'hero_sunjian'], castle: ['hero_sunce', 'hero_sunjian'], imperial: ['hero_sunce', 'hero_sunjian'] },
    '鲜卑漠南': { antiquity: ['hero_kotyankhan', 'hero_kushluk'], feudal: ['hero_kotyankhan', 'hero_kushluk'], castle: ['hero_kotyankhan', 'hero_kushluk'], imperial: ['hero_kotyankhan', 'hero_kushluk'] },
    '漠北蒙古': { antiquity: ['hero_khan', 'hero_subotai', 'hero_kushluk'], feudal: ['hero_khan', 'hero_subotai', 'hero_kushluk'], castle: ['hero_khan', 'hero_subotai', 'hero_kushluk'], imperial: ['hero_khan', 'hero_subotai', 'hero_kushluk'] },
    '条顿': { antiquity: ['hero_ulrichvonjungingen', 'hero_johnthefearless'], feudal: ['hero_ulrichvonjungingen', 'hero_johnthefearless'], castle: ['hero_ulrichvonjungingen', 'hero_johnthefearless'], imperial: ['hero_ulrichvonjungingen', 'hero_johnthefearless'] },
    '法兰克': { antiquity: ['hero_bernardarmagnac', 'hero_joanofarc', 'hero_joanthemaid'], feudal: ['hero_bernardarmagnac', 'hero_joanofarc', 'hero_joanthemaid'], castle: ['hero_bernardarmagnac', 'hero_joanofarc', 'hero_joanthemaid'], imperial: ['hero_bernardarmagnac', 'hero_joanofarc', 'hero_joanthemaid'] },
    '勃艮第': { antiquity: ['hero_johnthefearless', 'hero_philipthegood'], feudal: ['hero_johnthefearless', 'hero_philipthegood'], castle: ['hero_johnthefearless', 'hero_philipthegood'], imperial: ['hero_johnthefearless', 'hero_philipthegood'] },
    '不列颠': { antiquity: ['hero_edwardlongshanks', 'hero_gilbertdeclare', 'hero_friartuck'], feudal: ['hero_edwardlongshanks', 'hero_gilbertdeclare', 'hero_friartuck'], castle: ['hero_edwardlongshanks', 'hero_gilbertdeclare', 'hero_friartuck'], imperial: ['hero_edwardlongshanks', 'hero_gilbertdeclare', 'hero_friartuck'] },
    '凯尔特': { antiquity: ['hero_dafyddapgruffydd', 'hero_llywelynapgruffydd', 'hero_williamwallace'], feudal: ['hero_dafyddapgruffydd', 'hero_llywelynapgruffydd', 'hero_williamwallace'], castle: ['hero_dafyddapgruffydd', 'hero_llywelynapgruffydd', 'hero_williamwallace'], imperial: ['hero_dafyddapgruffydd', 'hero_llywelynapgruffydd', 'hero_williamwallace'] },
    '维京': { antiquity: ['hero_harald', 'hero_ulf', 'hero_ataulf'], feudal: ['hero_harald', 'hero_ulf', 'hero_ataulf'], castle: ['hero_harald', 'hero_ulf', 'hero_ataulf'], imperial: ['hero_harald', 'hero_ulf', 'hero_ataulf'] },
    '哥特': { antiquity: ['hero_alaric', 'hero_ataulf'], feudal: ['hero_alaric', 'hero_ataulf'], castle: ['hero_alaric', 'hero_ataulf'], imperial: ['hero_alaric', 'hero_ataulf'] },
    '拜占庭': { antiquity: ['hero_basileus', 'hero_tsarkonstantin'], feudal: ['hero_basileus', 'hero_tsarkonstantin'], castle: ['hero_basileus', 'hero_tsarkonstantin'], imperial: ['hero_basileus', 'hero_tsarkonstantin'] },
    '亚美尼亚': { antiquity: ['hero_thoros', 'hero_tamar'], feudal: ['hero_thoros', 'hero_tamar'], castle: ['hero_thoros', 'hero_tamar'], imperial: ['hero_thoros', 'hero_tamar'] },
    '格鲁吉亚': { antiquity: ['hero_tamar', 'hero_thoros'], feudal: ['hero_tamar', 'hero_thoros'], castle: ['hero_tamar', 'hero_thoros'], imperial: ['hero_tamar', 'hero_thoros'] },
    '波兰': { antiquity: ['hero_jadwiga', 'hero_jogaila'], feudal: ['hero_jadwiga', 'hero_jogaila'], castle: ['hero_jadwiga', 'hero_jogaila'], imperial: ['hero_jadwiga', 'hero_jogaila'] },
    '波希米亚': { antiquity: ['hero_janzizka', 'hero_vytautasthegreat'], feudal: ['hero_janzizka', 'hero_vytautasthegreat'], castle: ['hero_janzizka', 'hero_vytautasthegreat'], imperial: ['hero_janzizka', 'hero_vytautasthegreat'] },
    '马扎尔': { antiquity: ['hero_attila', 'hero_cumanchief', 'hero_belaiv'], feudal: ['hero_attila', 'hero_cumanchief', 'hero_belaiv'], castle: ['hero_attila', 'hero_cumanchief', 'hero_belaiv'], imperial: ['hero_attila', 'hero_cumanchief', 'hero_belaiv'] },
    '斯拉夫': { antiquity: ['hero_vladdracula', 'hero_tsarkonstantin'], feudal: ['hero_vladdracula', 'hero_tsarkonstantin'], castle: ['hero_vladdracula', 'hero_tsarkonstantin'], imperial: ['hero_vladdracula', 'hero_tsarkonstantin'] },
    '立陶宛': { antiquity: ['hero_algirdas', 'hero_jogaila', 'hero_kestutis', 'hero_vytautasthegreat'], feudal: ['hero_algirdas', 'hero_jogaila', 'hero_kestutis', 'hero_vytautasthegreat'], castle: ['hero_algirdas', 'hero_jogaila', 'hero_kestutis', 'hero_vytautasthegreat'], imperial: ['hero_algirdas', 'hero_jogaila', 'hero_kestutis', 'hero_vytautasthegreat'] },
    '保加利亚': { antiquity: ['hero_ivaylo', 'hero_ivaylofoot', 'hero_tsarkonstantin'], feudal: ['hero_ivaylo', 'hero_ivaylofoot', 'hero_tsarkonstantin'], castle: ['hero_ivaylo', 'hero_ivaylofoot', 'hero_tsarkonstantin'], imperial: ['hero_ivaylo', 'hero_ivaylofoot', 'hero_tsarkonstantin'] },
    '意大利': { antiquity: ['hero_sforza', 'hero_bohemond'], feudal: ['hero_sforza', 'hero_bohemond'], castle: ['hero_sforza', 'hero_bohemond'], imperial: ['hero_sforza', 'hero_bohemond'] },
    '罗马': { antiquity: ['hero_aristides', 'hero_parmenion', 'hero_lysander'], feudal: ['hero_aristides', 'hero_parmenion', 'hero_lysander'], castle: ['hero_aristides', 'hero_parmenion', 'hero_lysander'], imperial: ['hero_aristides', 'hero_parmenion', 'hero_lysander'] },
    '西西里': { antiquity: ['hero_robertguiscard', 'hero_bohemond', 'hero_rogerbosso'], feudal: ['hero_robertguiscard', 'hero_bohemond', 'hero_rogerbosso'], castle: ['hero_robertguiscard', 'hero_bohemond', 'hero_rogerbosso'], imperial: ['hero_robertguiscard', 'hero_bohemond', 'hero_rogerbosso'] },
    '西班牙': { antiquity: ['hero_bernardarmagnac', 'hero_sforza'], feudal: ['hero_bernardarmagnac', 'hero_sforza'], castle: ['hero_bernardarmagnac', 'hero_sforza'], imperial: ['hero_bernardarmagnac', 'hero_sforza'] },
    '葡萄牙': { antiquity: ['hero_edwardlongshanks', 'hero_gilbertdeclare'], feudal: ['hero_edwardlongshanks', 'hero_gilbertdeclare'], castle: ['hero_edwardlongshanks', 'hero_gilbertdeclare'], imperial: ['hero_edwardlongshanks', 'hero_gilbertdeclare'] },
    '萨拉森': { antiquity: ['hero_tariqibnziyad', 'hero_shahismail', 'hero_shahking', 'hero_imam'], feudal: ['hero_tariqibnziyad', 'hero_shahismail', 'hero_shahking', 'hero_imam'], castle: ['hero_tariqibnziyad', 'hero_shahismail', 'hero_shahking', 'hero_imam'], imperial: ['hero_tariqibnziyad', 'hero_shahismail', 'hero_shahking', 'hero_imam'] },
    '匈人': { antiquity: ['hero_attila', 'hero_cumanchief'], feudal: ['hero_attila', 'hero_cumanchief'], castle: ['hero_attila', 'hero_cumanchief'], imperial: ['hero_attila', 'hero_cumanchief'] },
    '库曼': { antiquity: ['hero_cumanchief', 'hero_kotyankhan'], feudal: ['hero_cumanchief', 'hero_kotyankhan'], castle: ['hero_cumanchief', 'hero_kotyankhan'], imperial: ['hero_cumanchief', 'hero_kotyankhan'] },
    '奥斯曼': { antiquity: ['hero_osman', 'hero_qutlugh'], feudal: ['hero_osman', 'hero_qutlugh'], castle: ['hero_osman', 'hero_qutlugh'], imperial: ['hero_osman', 'hero_qutlugh'] },
    '鞑靼': { antiquity: ['hero_qutlugh', 'hero_kushluk'], feudal: ['hero_qutlugh', 'hero_kushluk'], castle: ['hero_qutlugh', 'hero_kushluk'], imperial: ['hero_qutlugh', 'hero_kushluk'] },
    '西域': { antiquity: ['hero_kotyankhan', 'hero_kushluk'], feudal: ['hero_kotyankhan', 'hero_kushluk'], castle: ['hero_kotyankhan', 'hero_kushluk'], imperial: ['hero_kotyankhan', 'hero_kushluk'] },
    '达罗毗荼': { antiquity: ['hero_generalaraiyan', 'hero_rajendrachola', 'elite_sannahya'], feudal: ['hero_generalaraiyan', 'hero_rajendrachola', 'elite_sannahya'], castle: ['hero_generalaraiyan', 'hero_rajendrachola', 'elite_sannahya'], imperial: ['hero_generalaraiyan', 'hero_rajendrachola', 'elite_sannahya'] },
    '印度斯坦': { antiquity: ['elite_battle_elephant', 'hero_prithviraj', 'hero_rajendrachola', 'elite_sannahya'], feudal: ['elite_battle_elephant', 'hero_prithviraj', 'hero_rajendrachola', 'elite_sannahya'], castle: ['elite_battle_elephant', 'hero_prithviraj', 'hero_rajendrachola', 'elite_sannahya'], imperial: ['elite_battle_elephant', 'hero_prithviraj', 'hero_rajendrachola', 'elite_sannahya'] },
    '孟加拉': { antiquity: ['elite_ratha_melee', 'hero_generalaraiyan', 'hero_rajendrachola'], feudal: ['elite_ratha_melee', 'hero_generalaraiyan', 'hero_rajendrachola'], castle: ['elite_ratha_melee', 'hero_generalaraiyan', 'hero_rajendrachola'], imperial: ['elite_ratha_melee', 'hero_generalaraiyan', 'hero_rajendrachola'] },
    '瞿折罗': { antiquity: ['hero_prithviraj', 'hero_rajendrachola', 'elite_sannahya', 'hero_chandbardai'], feudal: ['hero_prithviraj', 'hero_rajendrachola', 'elite_sannahya', 'hero_chandbardai'], castle: ['hero_prithviraj', 'hero_rajendrachola', 'elite_sannahya', 'hero_chandbardai'], imperial: ['hero_prithviraj', 'hero_rajendrachola', 'elite_sannahya', 'hero_chandbardai'] },
    '普鲁': { antiquity: ['porus_elephant', 'hero_prithviraj'], feudal: ['porus_elephant', 'hero_prithviraj'], castle: ['porus_elephant', 'hero_prithviraj'], imperial: ['porus_elephant', 'hero_prithviraj'] },
    '青藏': { antiquity: ['hero_prithviraj', 'hero_guanyu'], feudal: ['hero_prithviraj', 'hero_guanyu'], castle: ['hero_prithviraj', 'hero_guanyu'], imperial: ['hero_prithviraj', 'hero_guanyu'] },
    '高棉': { antiquity: ['elite_ballista_elephant', 'hero_gajahmada', 'hero_leloi', 'elite_elephant_archer'], feudal: ['elite_ballista_elephant', 'hero_gajahmada', 'hero_leloi', 'elite_elephant_archer'], castle: ['elite_ballista_elephant', 'hero_gajahmada', 'hero_leloi', 'elite_elephant_archer'], imperial: ['elite_ballista_elephant', 'hero_gajahmada', 'hero_leloi', 'elite_elephant_archer'] },
    '缅甸': { antiquity: ['bayinnaung_elephant', 'hero_gajahmada', 'elite_battle_elephant', 'elite_elephant_archer'], feudal: ['bayinnaung_elephant', 'hero_gajahmada', 'elite_battle_elephant', 'elite_elephant_archer'], castle: ['bayinnaung_elephant', 'hero_gajahmada', 'elite_battle_elephant', 'elite_elephant_archer'], imperial: ['bayinnaung_elephant', 'hero_gajahmada', 'elite_battle_elephant', 'elite_elephant_archer'] },
    '越南': { antiquity: ['hero_dinhle', 'hero_leloi', 'elite_battle_elephant'], feudal: ['hero_dinhle', 'hero_leloi', 'elite_battle_elephant'], castle: ['hero_dinhle', 'hero_leloi', 'elite_battle_elephant'], imperial: ['hero_dinhle', 'hero_leloi', 'elite_battle_elephant'] },
    '马来': { antiquity: ['hero_gajahmada', 'hero_dinhle', 'hero_jayanegara'], feudal: ['hero_gajahmada', 'hero_dinhle', 'hero_jayanegara'], castle: ['hero_gajahmada', 'hero_dinhle', 'hero_jayanegara'], imperial: ['hero_gajahmada', 'hero_dinhle', 'hero_jayanegara'] },
    '玛雅': { antiquity: ['hero_cunhambebe', 'hero_cusiyupanqui'], feudal: ['hero_cunhambebe', 'hero_cusiyupanqui'], castle: ['hero_cunhambebe', 'hero_cusiyupanqui'], imperial: ['hero_cunhambebe', 'hero_cusiyupanqui'] },
    '阿兹特克': { antiquity: ['hero_cunhambebe', 'hero_arariboiamelee'], feudal: ['hero_cunhambebe', 'hero_arariboiamelee'], castle: ['hero_cunhambebe', 'hero_arariboiamelee'], imperial: ['hero_cunhambebe', 'hero_arariboiamelee'] },
    '印加': { antiquity: ['hero_cusiyupanqui', 'hero_pachacuti'], feudal: ['hero_cusiyupanqui', 'hero_pachacuti'], castle: ['hero_cusiyupanqui', 'hero_pachacuti'], imperial: ['hero_cusiyupanqui', 'hero_pachacuti'] },
    '穆伊斯卡': { antiquity: ['hero_pacanchique', 'hero_pachacuti'], feudal: ['hero_pacanchique', 'hero_pachacuti'], castle: ['hero_pacanchique', 'hero_pachacuti'], imperial: ['hero_pacanchique', 'hero_pachacuti'] },
    '马普切': { antiquity: ['hero_galvarino', 'hero_guacolda', 'hero_lautaro'], feudal: ['hero_galvarino', 'hero_guacolda', 'hero_lautaro'], castle: ['hero_galvarino', 'hero_guacolda', 'hero_lautaro'], imperial: ['hero_galvarino', 'hero_guacolda', 'hero_lautaro'] },
    '图皮': { antiquity: ['hero_arariboiamelee', 'hero_arariboiaranged', 'hero_cunhambebe'], feudal: ['hero_arariboiamelee', 'hero_arariboiaranged', 'hero_cunhambebe'], castle: ['hero_arariboiamelee', 'hero_arariboiaranged', 'hero_cunhambebe'], imperial: ['hero_arariboiamelee', 'hero_arariboiaranged', 'hero_cunhambebe'] },
    '柏柏尔': { antiquity: ['hero_tariqibnziyad', 'hero_sumanguru'], feudal: ['hero_tariqibnziyad', 'hero_sumanguru'], castle: ['hero_tariqibnziyad', 'hero_sumanguru'], imperial: ['hero_tariqibnziyad', 'hero_sumanguru'] },
    '马里': { antiquity: ['hero_sumanguru', 'hero_sundjata'], feudal: ['hero_sumanguru', 'hero_sundjata'], castle: ['hero_sumanguru', 'hero_sundjata'], imperial: ['hero_sumanguru', 'hero_sundjata'] },
    '埃塞俄比亚': { antiquity: ['hero_yodit', 'dagnajan_elephant', 'hero_gidajan'], feudal: ['hero_yodit', 'dagnajan_elephant', 'hero_gidajan'], castle: ['hero_yodit', 'dagnajan_elephant', 'hero_gidajan'], imperial: ['hero_yodit', 'dagnajan_elephant', 'hero_gidajan'] },
    '波斯': { antiquity: ['hero_shahismail', 'hero_artaphernes', 'elite_war_elephant'], feudal: ['hero_shahismail', 'hero_artaphernes', 'elite_war_elephant'], castle: ['hero_shahismail', 'hero_artaphernes', 'elite_war_elephant'], imperial: ['hero_shahismail', 'hero_artaphernes', 'elite_war_elephant'] },
    '阿契美尼德': { antiquity: ['hero_artaphernes', 'hero_datis'], feudal: ['hero_artaphernes', 'hero_datis'], castle: ['hero_artaphernes', 'hero_datis'], imperial: ['hero_artaphernes', 'hero_datis'] },
    '雅典': { antiquity: ['hero_aristagoras', 'hero_aristides', 'hero_themistocles_hoplite'], feudal: ['hero_aristagoras', 'hero_aristides', 'hero_themistocles_hoplite'], castle: ['hero_aristagoras', 'hero_aristides', 'hero_themistocles_hoplite'], imperial: ['hero_aristagoras', 'hero_aristides', 'hero_themistocles_hoplite'] },
    '斯巴达': { antiquity: ['hero_brasidas', 'hero_lysander'], feudal: ['hero_brasidas', 'hero_lysander'], castle: ['hero_brasidas', 'hero_lysander'], imperial: ['hero_brasidas', 'hero_lysander'] },
    '马其顿': { antiquity: ['hero_cleitus', 'hero_dismounted_alexander', 'hero_mounted_alexander', 'hero_macedonian_commander', 'hero_parmenion', 'hero_perdiccas'], feudal: ['hero_cleitus', 'hero_dismounted_alexander', 'hero_mounted_alexander', 'hero_macedonian_commander', 'hero_parmenion', 'hero_perdiccas'], castle: ['hero_cleitus', 'hero_dismounted_alexander', 'hero_mounted_alexander', 'hero_macedonian_commander', 'hero_parmenion', 'hero_perdiccas'], imperial: ['hero_cleitus', 'hero_dismounted_alexander', 'hero_mounted_alexander', 'hero_macedonian_commander', 'hero_parmenion', 'hero_perdiccas'] },
    '色雷斯': { antiquity: ['hero_thracian_chieftain', 'hero_cleitus'], feudal: ['hero_thracian_chieftain', 'hero_cleitus'], castle: ['hero_thracian_chieftain', 'hero_cleitus'], imperial: ['hero_thracian_chieftain', 'hero_cleitus'] },
    '撒克逊': { antiquity: ['hero_tostig', 'hero_ataulf'], feudal: ['hero_tostig', 'hero_ataulf'], castle: ['hero_tostig', 'hero_ataulf'], imperial: ['hero_tostig', 'hero_ataulf'] },
    '瓦良格': { antiquity: ['hero_harald', 'hero_halldor'], feudal: ['hero_harald', 'hero_halldor'], castle: ['hero_harald', 'hero_halldor'], imperial: ['hero_harald', 'hero_halldor'] },
    '丹麦': { antiquity: ['hero_ulf', 'hero_harald'], feudal: ['hero_ulf', 'hero_harald'], castle: ['hero_ulf', 'hero_harald'], imperial: ['hero_ulf', 'hero_harald'] },
};

/** 据点建筑风格键 → 二级文明名（二级 59 + 三级 3 = 62）。一级母体键（ASIA / SLAV / WEST …）不在这里。 */
const STYLE_KEY_TO_CIV: Readonly<Record<string, string>> = {
    JAPAN: '日本', CENTRAL: '华夏', WEI: '河朔', JIANGNAN: '江南', BASHU: '巴蜀', KHITAN: '河西', NORTHEAST: '白山黑水', MONGOL: '鲜卑漠南', KOREA: '高丽',
    GERMANIC: '条顿', FRANKS: '法兰克', BURGUNDIANS: '勃艮第', BRITONS: '不列颠', CELTS: '凯尔特', VIKINGS: '维京', GOTHS: '哥特',
    BYZANTINE: '拜占庭', ARMENIANS: '亚美尼亚', GEORGIANS: '格鲁吉亚', POLES: '波兰', BOHEMIANS: '波希米亚', MAGYAR: '马扎尔', SLAVIC: '斯拉夫', LITHUANIANS: '立陶宛', BULGARIANS: '保加利亚',
    LATIN: '意大利', ROMA: '罗马', SICILIANS: '西西里', SPANISH: '西班牙', PORTUGUESE: '葡萄牙', ORIE: '萨拉森',
    HUNS: '匈人', CUMAN: '库曼', TURKS: '奥斯曼', CENTRAL_ASIA: '鞑靼', INDIA: '达罗毗荼', MUGHAL: '印度斯坦', BENGALIS: '孟加拉', GURJARAS: '瞿折罗', PURU: '普鲁',
    KHMER: '高棉', BURMESE: '缅甸', VIETNAMESE: '越南', MALAY: '马来', MAYANS: '玛雅', AMERICA: '阿兹特克', INCA: '印加', MUISCA: '穆伊斯卡', MAPUCHE: '马普切', TUPI: '图皮',
    BERBER: '柏柏尔', AFRICA: '马里', ETHIOPIANS: '埃塞俄比亚', SASANIAN: '波斯',
    SAXONS: '撒克逊', VARANGIANS: '瓦良格', DANES: '丹麦',
    ATHENIANS: '雅典', SPARTANS: '斯巴达', MACEDONIAN: '马其顿', THRACIAN: '色雷斯',
    TIBET: '青藏', WESTERN: '西域', MOBEI_MONGOL: '漠北蒙古', YURT: '漠北蒙古',
};

/** 据点风格键 → 文明；PERSIAN 一键两用：古典 = 阿契美尼德，其后 = 波斯。 */
function civOfStyleKey(key: string | undefined, era: GeneralEra): string | null {
    if (!key) return null;
    if (key === 'PERSIAN') return era === 'antiquity' ? '阿契美尼德' : '波斯';
    return STYLE_KEY_TO_CIV[key] ?? null;
}

const _factionCivCache = new Map<string, Map<string, string | null>>();

/** 势力所属文明：先看自己名下据点里数量最多的二级风格；一个都没有（只写了一级母体）就取离代表据点最近的二级据点的文明。 */
function civOfFaction(factionId: string, era: GeneralEra): string | null {
    let byEra = _factionCivCache.get(factionId);
    if (!byEra) { byEra = new Map(); _factionCivCache.set(factionId, byEra); }
    if (byEra.has(era)) return byEra.get(era) ?? null;

    const own = CITIES_V2.filter((c) => c.factionId === factionId);
    const count = new Map<string, number>();
    for (const c of own) {
        const civ = civOfStyleKey(c.buildingStyle, era);
        if (civ) count.set(civ, (count.get(civ) ?? 0) + 1);
    }
    let result: string | null = null;
    if (count.size > 0) {
        let best = 0;
        for (const [civ, n] of count) if (n > best) { best = n; result = civ; }
    } else if (own.length > 0) {
        let rep = own[0];
        for (const c of own) if ((c.tier ?? 9) < (rep.tier ?? 9)) rep = c;
        const cosLat = Math.cos((rep.lat * Math.PI) / 180);
        let bestD = Infinity;
        for (const c of CITIES_V2) {
            const civ = civOfStyleKey(c.buildingStyle, era);
            if (!civ) continue;
            const dy = c.lat - rep.lat;
            const dx = (c.lng - rep.lng) * cosLat;
            const d = dx * dx + dy * dy;
            if (d < bestD) { bestD = d; result = civ; }
        }
    }
    byEra.set(era, result);
    return result;
}

/** 本局随机种子：每局（页面加载一次）抽一次，保证同一局内同一武将的形象不变，不同局之间不同。 */
const SESSION_SEED = Math.floor(Math.random() * 0x7fffffff);

function stableHash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

/** 该时代所有文明的兵模并集（去重）：武将查不到所属文明时的全局随机池。 */
const _eraGlobalPool = new Map<GeneralEra, string[]>();
function eraGlobalPool(era: GeneralEra): string[] {
    let pool = _eraGlobalPool.get(era);
    if (!pool) {
        const set = new Set<string>();
        for (const row of Object.values(CIV_ERA_COMMANDER_248)) for (const k of row[era]) set.add(k);
        pool = [...set];
        _eraGlobalPool.set(era, pool);
    }
    return pool;
}

/**
 * 248 主将兵模：武将 → 所属文明（按势力据点推）→ 按武将年代取该格兵模。
 * 🔴 [2026-10-05 主人令「每个军团都有主将队」] 武将没有势力、势力查不到文明时，不再返回空，
 *    改从该时代全部文明的兵模池里按本局种子随机取一个（宁可放错，不能不套；绝不兜底成华夏）。
 */
export function resolveCivEraCommander(generalId: string | null | undefined): string | null {
    if (!generalId) return null;
    const era: GeneralEra = GENERAL_ERA[generalId] ?? 'castle';
    const factionId = getFactionIdOfGeneral(generalId);
    const civ = factionId ? civOfFaction(factionId, era) : null;
    const row = civ ? CIV_ERA_COMMANDER_248[civ] : undefined;
    const own = row?.[era];
    const cell = own && own.length > 0 ? own : eraGlobalPool(era);
    if (cell.length === 0) return null;
    return cell[stableHash(generalId + ':' + SESSION_SEED) % cell.length];
}

/**
 * 没有武将的军团的主将队兵模（🔴 [2026-10-05 主人令「没有武将的军团也用英雄，每个军团都必须有」]）。
 * 按军团所属势力推：势力开局名将的时代 + 势力据点定的文明 → 取该格兵模；势力查不到就取该时代全局池。
 * `seedKey` 只用来在池里稳定地挑一个（本局内同一势力永远同一个），传势力 id 或军团名即可。
 */
export function resolveFactionCommander(factionId: string | null | undefined, seedKey: string): string | null {
    const gid = factionId ? getFactionGeneral(factionId)?.generalId : null;
    const era: GeneralEra = (gid ? GENERAL_ERA[gid] : undefined) ?? 'castle';
    const civ = factionId ? civOfFaction(factionId, era) : null;
    const row = civ ? CIV_ERA_COMMANDER_248[civ] : undefined;
    const own = row?.[era];
    const cell = own && own.length > 0 ? own : eraGlobalPool(era);
    if (cell.length === 0) return null;
    return cell[stableHash((factionId ?? '') + ':' + SESSION_SEED) % cell.length];
}
