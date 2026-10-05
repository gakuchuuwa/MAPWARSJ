/**
 * 主将队（第 10 队）—— 🔴 [2026-09-23 主人定，硬规定]
 *
 * 主人原话：「现在的军团都是9队阵型，我想添加一队，改为10队阵型。亚历山大可以用英雄·骑马亚历山大，
 *           hero_mounted_alexander这个素材。」「我现在说的才是硬规定。现在战略，战术都改为10队。」
 *
 * 10 队 = 编制 9 队（骑兵 / 步兵 / 远程三排，比例规则不变）+ **主将队 1 队**。
 *   · 位置：前排正中再往前 —— 全阵的矛头（亚历山大亲率伙伴骑兵冲在最前，维基百科 Battle of the Granicus「亲统右翼」）；
 *   · 兵种：主将有专属英雄素材就用它；没有 → 用本军团前排的兵种（主将亲兵出自前锋）。
 *   · 兵力：与其余 9 队一起平分全军兵力，军团总兵力不变。
 * 编制数据（各层军团表）一个字不改；第 10 队在展开编制时追加。据点城防不带主将，仍是 9 队。
 * 🔴 剧本模式：每个主角武将的主将队兵种在事件编辑器里**必选**（事件字段 commanderUnit），按素材样貌选、不看兵名。
 */
import { getScriptCommanderUnit } from '../events/scriptPeriod';

/** 武将 → 专属英雄兵种（WAR_TYPES 键）。只登记有现成素材的 */
export const GENERAL_HERO_UNITS: Readonly<Record<string, string>> = {
    // 华夏/三国
    cao_d_caocao: 'hero_caocao',
    shu_liubei: 'hero_liubei',
    huizhou_zhugeliang: 'hero_zhugeliang',
    chu_guanyu: 'hero_guanyu',
    langzhou_zhangfei: 'hero_zhangfei',
    pizhou_lvbu: 'hero_lubu',
    ruzhou_sunjian: 'hero_sunjian',
    shanyue_sunce: 'hero_sunce',
    sunwu_d_sunquan: 'hero_sunquan',

    // 草原游牧
    menggu_d_chengjisihan: 'hero_khan',
    wuliangha_subutai: 'hero_subotai',
    xiongren_atila: 'hero_attila',
    gen_kotyan: 'hero_kotyankhan',
    gen_kuchlug: 'hero_kushluk',
    gen_girgen: 'hero_girgenkhan',
    gen_qutlugh: 'hero_qutlugh',

    // 希腊/马其顿
    gen_alexander_great: 'hero_mounted_alexander',
    gen_philip_ii: 'hero_macedonian_commander',
    gen_parmenion: 'hero_parmenion',
    gen_perdiccas: 'hero_perdiccas',
    gen_cleitus: 'hero_cleitus',
    gen_brasidas: 'hero_brasidas',
    gen_lysander: 'hero_lysander',
    gen_aristides: 'hero_aristides',
    gen_seuthes_iii: 'hero_thracian_chieftain',

    // 波斯
    gen_artaphernes: 'hero_artaphernes',
    gen_datis: 'hero_datis',
    saman_yisimayi: 'hero_shahismail',
    gen_thoros: 'hero_thoros',

    // 西欧
    gen_edward_longshanks: 'hero_edwardlongshanks',
    gen_william_wallace: 'hero_williamwallace',
    gen_joanofarc: 'hero_joanofarc',
    gen_john_fearless: 'hero_johnthefearless',
    gen_philip_good: 'hero_philipthegood',
    gen_bernard_armagnac: 'hero_bernardarmagnac',
    gen_ulrich_jungingen: 'hero_ulrichvonjungingen',
    gen_gilbert: 'hero_gilbertdeclare',
    gen_llywelyn: 'hero_llywelynapgruffydd',
    gen_dafydd: 'hero_dafyddapgruffydd',

    // 地中海
    gen_robert_guiscard: 'hero_robertguiscard',
    gen_bohemond: 'hero_bohemond',

    // 东欧斯拉夫蛮族
    gen_alaric: 'hero_alaric',
    gen_ataulf: 'hero_ataulf',
    gen_jadwiga: 'hero_jadwiga',
    gen_vytautas_great: 'hero_vytautasthegreat',
    gen_kestutis: 'hero_kestutis',
    gen_algirdas: 'hero_algirdas',
    gen_jan_zizka: 'hero_janzizka',
    gen_ivaylo: 'hero_ivaylo',

    // 中东/南亚/东南亚/非洲/美洲
    talike_talike: 'hero_tariqibnziyad',
    gen_osman_i: 'hero_osman',
    gen_bolusi: 'porus_elephant',
    gen_prithviraj: 'hero_prithviraj',
    zhuluo_lajialajia: 'hero_generalaraiyan',
    gen_gajah_mada: 'hero_gajahmada',
    leloi: 'hero_leloi',
    gen_dinhle: 'hero_dinhle',
    hantawadi_mangyinglong: 'bayinnaung_elephant',
    gen_dagnajan: 'dagnajan_elephant',
    gen_gidajan: 'hero_gidajan',
    gen_yodit: 'hero_yodit',
    gen_sundjata: 'hero_sundjata',
    gen_sumanguru: 'hero_sumanguru',
    gen_pachacuti: 'hero_pachacuti',
    gen_pacanchiq: 'hero_pacanchique',
    gen_lautaro: 'hero_lautaro',
    gen_galvarino: 'hero_galvarino',
    gen_guacolda: 'hero_guacolda',
    gen_arariboia: 'hero_arariboiamelee',
    gen_cunhambebe: 'hero_cunhambebe',
};

/** 主将队用哪个兵种：剧本事件里选定的 > 专属英雄 > 本军团前排兵种 */
export function commanderUnitOf(generalId: string | null | undefined, expandedSlots: readonly string[]): string | null {
    const picked = generalId ? getScriptCommanderUnit(generalId) : null;
    const hero = generalId ? GENERAL_HERO_UNITS[generalId] : undefined;
    return picked ?? hero ?? expandedSlots[0] ?? null;
}

/** 编制 9 队展开后追加主将队 → 10 队；不是 9 队的（异常/旧数据）原样返回 */
export function withCommander(generalId: string | null | undefined, expandedSlots: string[]): string[] {
    if (expandedSlots.length !== 9) return expandedSlots;
    const cmd = commanderUnitOf(generalId, expandedSlots);
    return cmd ? [...expandedSlots, cmd] : expandedSlots;
}
