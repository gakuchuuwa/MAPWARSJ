/**
 * 武将「属性标签」——四时代之下的细分（🔴 2026-10-16 主人令）。
 *
 * 主人原话：「给这些先秦武将添加一个属性标签，他们属于**古典里的先秦**。」
 *   · 四时代是**大档**（`GENERAL_ERA`：古典 / 封建 / 城堡 / 帝国）；
 *   · 本表是**大档之下的细分标签**，与「建筑风格 → 16 母体 / 62 文明 / 4 自建」那套层级同构：
 *     一级 = 四时代，二级 = 细分（现存只开了「先秦」一个）。
 *
 * ── 「先秦」的判据（主人 2026-10-16 定，两轮收口）────────────────
 *   ① **以登场年为准，不以出生年**（登场年 = 生年＋20，`debut` 字段优先、不晚于卒年、
 *      跳过公元 0 年 —— 全项目唯一算法 `debutYearOf()`，见 `GeneralLifeYears.ts`）；
 *   ② **登场年 公元前 403 年（三家分晋）以前**；
 *   ③ 且属**中国（东亚系建筑文化：CENTRAL / WEI / JIANGNAN / BASHU / KHITAN / NORTHEAST）**——
 *      非中国的同期武将（列奥尼达／赫梯／埃及／亚述／苏美尔…）**不打此标签**，各归其文化军团。
 *
 * 与军团的关系：这 16 位所在势力在势力表里一致挂「古典时代先秦军团」（`FACTION_COMPOSITIONS`）。
 * 自检：`npx tsx --import ./tools/sim-preload.mjs scratch/_check_era_subtag.mts`
 */

export type GeneralEraSubtag = 'pre_qin';

/** 标签显示名（军情/编辑器用） */
export const GENERAL_ERA_SUBTAG_LABEL: Record<GeneralEraSubtag, string> = {
    pre_qin: '古典 · 先秦',
};

/** 标签所属的大档（四时代），供 UI 显示「古典里的先秦」 */
export const GENERAL_ERA_SUBTAG_ERA: Record<GeneralEraSubtag, 'antiquity' | 'feudal' | 'castle' | 'imperial'> = {
    pre_qin: 'antiquity',
};

/** generalId → 细分标签。只写有细分的；没写的＝只有四时代大档。 */
export const GENERAL_ERA_SUBTAG: Readonly<Record<string, GeneralEraSubtag>> = {    // ── 古典 · 先秦（16 位，登场年 < 前 403）──────────────────────
    'shang_fuhao': 'pre_qin',          // 妇好 · 商国 · 登场 -1225
    'wei_wuqi': 'pre_qin',             // 吴起 · 魏国 · 登场 -420
    'zi_changhong': 'pre_qin',         // 苌弘 · 资州 · 登场 -545
    'jin_xianzhen': 'pre_qin',         // 先轸 · 晋国 · 登场 -640
    'qi_simarangju': 'pre_qin',        // 司马穰苴 · 齐国 · 登场 -520
    'zhou_jifa': 'pre_qin',            // 姬发 · 周国 · 登场 -1067
    'yun_wuli': 'pre_qin',             // 吾离 · 允戎 · 登场 -590
    'yin_dixin': 'pre_qin',            // 子受 · 殷国 · 登场 -1065
    'shen_shenbo': 'pre_qin',          // 申伯 · 申国 · 登场 -840
    'yangshe_yangshezhi': 'pre_qin',   // 羊舌职 · 羊舌 · 登场 -605
    'ruochu_doulian': 'pre_qin',       // 鬬廉 · 若敖 · 登场 -730
    'yue_goujian': 'pre_qin',          // 勾践 · 越国 · 登场 -500
    'wu_sunwu': 'pre_qin',             // 孙武 · 吴国 · 登场 -525
    'mi_chu_xionglv': 'pre_qin',       // 熊旅 · 安陆 · 登场 -606
    'kong_d_caogui': 'pre_qin',        // 曹刿 · 鲁国 · 登场 -695
    'yong_lujili': 'pre_qin',          // 庐戢黎 · 庸国 · 登场 -635
};

/** 取某武将的细分标签（无则 null） */
export function getGeneralEraSubtag(generalId: string | null | undefined): GeneralEraSubtag | null {
    return generalId ? (GENERAL_ERA_SUBTAG[generalId] ?? null) : null;
}

/**
 * 细分标签 → 它对应的**军团**（该细分专属，优先于「建筑文化 × 四时代」的二级命中）。
 * 目前只有「先秦」：先秦武将的势力一律挂「古典时代先秦军团」（三级子区域军团，主人已做好的指派）。
 */
export const GENERAL_ERA_SUBTAG_LEGION: Record<GeneralEraSubtag, string> = {
    pre_qin: '古典时代先秦军团',
};

/** 取某武将细分标签对应的军团名（无细分返回 null） */
export function getGeneralEraSubtagLegion(generalId: string | null | undefined): string | null {
    const t = getGeneralEraSubtag(generalId);
    return t ? GENERAL_ERA_SUBTAG_LEGION[t] : null;
}

/** 取显示名，如「古典 · 先秦」；无细分返回 null */
export function getGeneralEraSubtagLabel(generalId: string | null | undefined): string | null {
    const t = getGeneralEraSubtag(generalId);
    return t ? GENERAL_ERA_SUBTAG_LABEL[t] : null;
}
