/**
 * 建筑「倒塌动画 / 残骸」素材解析 —— DE 同族链 + 通用兜底（只此一份）
 *
 * 🔴 [2026-10-15 主人令]「所有建筑请和 DE 保持一致。DE 如何设计的，我们就如何设计，
 *    我觉得蒙古包和其他建筑一样，都是先燃后塌。如果出现规则冲突，删除更早的规则，以新的为主。」
 *
 * 背景（实测）：`public/SUCAI_BUILDING` 里 DE **标准建筑**（民居/磨坊/兵营/城镇中心/城堡/箭塔…）
 * 都带 `_DESTR`（destruction 动画）+ `_RUBBLE`（残骸）；而**场景装饰建筑**——
 * 棚屋 `HUT_A~G`、定居点 `SETTLEMENT`、简易帐篷/蒙古包 `YURT_A~L`、哨站 `OUTPOST`/`FORTIFIED_OUTPOST`、
 * 营帐 `CAMP_*`、`GREEK_WAR_TENT`——DE 本体**没有**对应破坏素材，只有一帧静态图。
 * 于是城寨（全库 1039 座据点里 356 座）里随机抽到的建筑，血一归零就「凭空消失」，
 * 与主人令「先燃后塌、和 DE 一致」直接冲突。
 *
 * 解法：给这些装饰建筑**逐族指定 DE 同族/同时代的破坏素材**，再兜底到 DE 通用 1×1 坍塌：
 *   · 棚屋 / 简易帐篷 / 蒙古包 → DE 黑暗时代民居 `DARK_HOUSE_AGE1`
 *     （与 `WarTypes` 的 DE_BLD_TABLE 同口径：城寨＝古典、这些一律按民居算）
 *   · 定居点 → DE 黑暗时代定居点大屋 `DARK_SETTLEMENT_AGE1`
 *   · 哨站 / 强化哨站 → DE 通用 1×1 坍塌 `FOUNDATION_1X1`
 *   · 其余（标准建筑）→ 自身
 *
 * ⚠️ 本表只决定**用哪套 DE 素材**，不决定血量/护甲（那在 `WarTypes.DE_BLD_TABLE`）。
 */

/** DE 通用 1×1 坍塌动画（DE 城墙/小屋倒塌共用） */
export const DE_DESTR_FALLBACK = 'FOUNDATION_1X1_DESTR';
/** DE 通用 1×1 残骸 */
export const DE_RUBBLE_FALLBACK = 'FOUNDATION_1X1_RUBBLE';

/** 装饰建筑 → DE 破坏素材族名（拼 `_DESTR` / `_RUBBLE` 即目录名） */
const DESTR_FAMILY: Record<string, string> = {
    // 黑暗时代定居点大屋（DE b_dark_settlement_age1_destruction）
    SETTLEMENT: 'DARK_SETTLEMENT_AGE1',
    // 哨站类：DE 无 destruction → 通用 1×1 坍塌
    OUTPOST: 'FOUNDATION_1X1',
    FORTIFIED_OUTPOST: 'FOUNDATION_1X1',
    // 营帐/帐篷按民居处理
    GREEK_WAR_TENT: 'DARK_HOUSE_AGE1',
    CAMP_ARCHERY_RANGE: 'DARK_HOUSE_AGE1',
    CAMP_BARRACKS: 'DARK_HOUSE_AGE1',
    CAMP_STABLE: 'DARK_HOUSE_AGE1',
};
// 棚屋 HUT_A~G、简易帐篷/真蒙古包 YURT_A~L：一律按黑暗时代民居（同 DE_BLD_TABLE 口径）
for (let i = 0; i < 7; i++) DESTR_FAMILY[`HUT_${String.fromCharCode(65 + i)}`] = 'DARK_HOUSE_AGE1';
for (let i = 0; i < 12; i++) DESTR_FAMILY[`YURT_${String.fromCharCode(65 + i)}`] = 'DARK_HOUSE_AGE1';

/** 取一件素材的破坏素材族：有专属族就用专属，装饰建筑走本表。 */
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
