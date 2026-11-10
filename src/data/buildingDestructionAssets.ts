/**
 * 建筑「倒塌动画 / 残骸」素材解析 —— DE 同族链 + 通用兜底（只此一份）
 *
 * 🔴 [2026-10-15 主人令]「所有建筑请和 DE 保持一致。DE 如何设计的，我们就如何设计，
 *    我觉得蒙古包和其他建筑一样，都是先燃后塌。如果出现规则冲突，删除更早的规则，以新的为主。」
 *
 * 背景（实测）：`public/SUCAI_BUILDING` 里 DE **标准建筑**（民居/磨坊/兵营/城镇中心/城堡/箭塔…）
 * 以及 **城寨/草原/营寨建筑** ——
 *   · 棚屋 `HUT_A~G`（DE `b_scen_hut_a..g_destruction` / `_rubble`）
 *   · 蒙古包 `YURT_A~L`（DE `b_scen_yurt_a..l_destruction` / `_rubble`）
 *   · 定居点 `SETTLEMENT`（DE `b_ande_settlement_age2_destruction` / `_rubble`）
 *   · 哨站 `OUTPOST` / `FORTIFIED_OUTPOST`（DE `b_dark_outpost_age1_*` / `b_archaic_fortified_outpost_age1_*`）
 *   · 军营 `CAMP_BARRACKS` / `CAMP_ARCHERY_RANGE` / `CAMP_STABLE`（DE `b_scen_camp_*_age2_destruction` / `_rubble`）
 *   · 行军帐 `GREEK_WAR_TENT`（DE `b_scen_tent_army_a_destruction` / `_rubble`）
 * 均已从 DE 原版 SLD 完整提取各自的 `_DESTR`（100/101 帧坍塌动画）与 `_RUBBLE`（残骸）。
 *
 * ⚠️ 本表只作同族映射与通用 1×1 兜底，不决定血量/护甲（那在 `WarTypes.DE_BLD_TABLE`）。
 */

/** DE 通用 1×1 坍塌动画（DE 城墙/小屋倒塌共用） */
export const DE_DESTR_FALLBACK = 'FOUNDATION_1X1_DESTR';
/** DE 通用 1×1 残骸 */
export const DE_RUBBLE_FALLBACK = 'FOUNDATION_1X1_RUBBLE';

/** 建筑 → DE 破坏素材族名（拼 `_DESTR` / `_RUBBLE` 即目录名；现全部建筑均有专属 DE 坍塌与残骸素材） */
const DESTR_FAMILY: Record<string, string> = {
    HUGUANG_CASTLE_AGE3: 'CHIN_CASTLE_AGE3',
    WESTERN_CASTLE_AGE3: 'CEAS_CASTLE_AGE3',
    TIBET_CASTLE_AGE3: 'PURU_CASTLE_AGE3',
    THRACIAN_CASTLE_AGE3: 'THRACIANS_CASTLE_AGE3',
    GREEK_CASTLE_AGE3: 'ATHENIANS_CASTLE_AGE3',
    PERSIAN_CASTLE_ACHAEMENIDS_AGE3: 'PERSIAN_CASTLE_AGE3',
    PURU_CASTLE_AGE3_ATTACKUP: 'PURU_CASTLE_AGE3',
    PURU_CASTLE_AGE3_BOTHUP: 'PURU_CASTLE_AGE3',
    PURU_CASTLE_AGE3_DEFENSEUP: 'PURU_CASTLE_AGE3',
    THRACIAN_GATE_FORTIFIED_NE: 'THRACIAN_GATE_STONE_NE',
    THRACIAN_GATE_FORTIFIED_SE: 'THRACIAN_GATE_STONE_SE',
    // 文化专属地标特征件 → 同风格 DE 标准建筑倒塌族
    SCEN_TORII_GATE: 'ASIA_TOWER_AGE2',
    SCEN_PAGODA_A: 'ASIA_MONASTERY_AGE3',
    SCEN_PAGODA_B: 'ASIA_MONASTERY_AGE3',
    SCEN_PAGODA_C: 'ASIA_MONASTERY_AGE3',
    SCEN_PAGODA_D: 'ASIA_MONASTERY_AGE3',
    SCEN_PAGODA_E: 'ASIA_MONASTERY_AGE3',
    SANCHI_STUPA: 'INDI_MONASTERY_AGE3',
    SCEN_REKHADEUL_TEMPLE: 'INDI_MONASTERY_AGE3',
    SCEN_BUDDHA_STATUE: 'INDI_MONASTERY_AGE3',
    PAGAN_SHRINE: 'SEAS_MONASTERY_AGE3',
    AMPHITHEATRE: 'MEDI_UNIVERSITY_AGE3',
    ARCH_OF_CONSTANTINE: 'MEDI_MONASTERY_AGE3',
    SCEN_ARCHAIC_THOLOS: 'GREEK_MONASTERY_AGE3',
    SCEN_HERO_SHRINE: 'GREEK_MONASTERY_AGE3',
    SCEN_STATUE_ALEXANDER: 'GREEK_TOWER_AGE2',
    SCEN_STATUE_ARES_MARBLE: 'GREEK_TOWER_AGE2',
    SCEN_STATUE_GREEK_HERO: 'GREEK_TOWER_AGE2',
    FOLWARK: 'SLAV_MILL_AGE3',
    WOODEN_FORT: 'SLAV_BARRACKS_AGE3',
    QUIMPER_CATHEDRAL: 'WEST_MONASTERY_AGE3',
    SCEN_AACHEN_CATHEDRAL: 'EAST_MONASTERY_AGE3',
    SCEN_HALL_OF_HEROES: 'EAST_BARRACKS_AGE3',
    POENARI_CASTLE: 'EAST_TOWER_AGE3',
    MINARET_OF_JAM: 'CEAS_TOWER_AGE3',
    SCEN_FIRE_SHRINE: 'PERSIAN_MONASTERY_AGE3',
    SCEN_SANKORE_MADRASAH: 'AFRI_MONASTERY_AGE3',
    SCEN_DOME_OF_THE_ROCK: 'ORIE_MONASTERY_AGE3',
    GOL_GUMBAZ: 'INDI_MONASTERY_AGE3',
    SCEN_CUSHITE_PYRAMIDS: 'AFRI_TOWER_AGE3',
    SCEN_ANDEAN_RUINS: 'ANDE_MONASTERY_AGE3',
};

/** 取一件素材的破坏素材族：有专属族就用专属，否则返回自身。 */
export function destrFamilyOf(name: string): string {
    return DESTR_FAMILY[name] ?? name;
}

/** 倒塌候选链（按优先级）：自身 → 同族 → DE 通用兜底。 */
export function destrCandidatesOf(name: string): string[] {
    const fam = destrFamilyOf(name);
    const out = [`BUILDINGANIM:${name}_DESTR`];
    if (fam !== name) out.push(`BUILDINGANIM:${fam}_DESTR`);
    out.push(`BUILDINGANIM:${DE_DESTR_FALLBACK}`);
    return out;
}

/** 残骸候选链（按优先级）：调用方指定 → 自身 → 同族 → DE 通用兜底。 */
export function rubbleCandidatesOf(name: string, customRubble?: string | null): string[] {
    const fam = destrFamilyOf(name);
    const out: string[] = [];
    if (customRubble) out.push(customRubble);
    out.push(`BUILDINGANIM:${name}_RUBBLE`);
    if (fam !== name) out.push(`BUILDINGANIM:${fam}_RUBBLE`);
    out.push(`BUILDINGANIM:${DE_RUBBLE_FALLBACK}`);
    return out;
}
