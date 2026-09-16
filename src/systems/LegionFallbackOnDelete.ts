/**
 * 三级军团被删除后的**回落安置**（🔴 2026-09-16 主人定）。
 *
 * ── 规则（主人原话）────────────────────────────────────────────
 * 「一级和二级军团的 16+59 是不能被删除的，只有三级军团可以增加和减少。
 *   如果三级军团被删除，要给该武将重新安排军团，在重安排军团的时候，
 *   要看每个武将的时代和据点的建筑风格。
 *   如果二级正好有相同时代的军团，就安置；如果没有，就按一级的军团安置。」
 *
 * 主人给的样例（杨业）：删「城堡时代宋禁军团」→ 先看雁门关是**北方**建筑风格 →
 * 二级里有没有「城堡时代 + 北方」的军团 → 没有 → 北方归一级**东亚** → 退到东亚军团。
 *
 * ── 落地口径 ────────────────────────────────────────────────
 * ① 谁要重排：`FACTION_COMPOSITIONS` 里 `legionName` 正是被删那支的势力（一家一条）。
 * ② 武将时代：该势力的开局名将（`getFactionGeneral`）→ `GENERAL_ERA`。
 * ③ 据点：该势力名下据点里**城级最高**的一座（`tier` 最小，缺省当 9；并列取表中先出现的），
 *    取它的 `buildingStyle`。建筑风格现在是 75 类（16 母体 + 59 文明），本来就带文明身份。
 * ④ 二级命中：`LEVEL_2_CIV_59_LEGIONS` 里 `region === buildingStyle` 且 `age === 武将时代`。
 *    二级一个 region 只有一支，所以命中即唯一，不存在「同风格同时代多支」的挑选问题。
 * ⑤ 不命中 → 把建筑风格归到 16 母体，安置该母体的一级军团（`BASE16_LEGION_NAMES`）。
 *
 * ⚠️ 取不到武将、取不到据点、或建筑风格归不到母体的，一律**跳过不动**（列进 skipped 由调用方提示），
 *    绝不用默认值硬塞 —— `BASE16_OF_REGION` 查不到会静默回落 CENTRAL，那种错比不动更难查。
 */
import { CITIES_V2, type CityDataV2 } from '../data/cities_v2';
import { GENERAL_ERA, type GeneralEra } from '../data/GeneralEra';
import { LEVEL_2_CIV_59_LEGIONS } from '../data/level2Civ59Legions';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { getFactionGeneral } from '../data/FactionGenerals';
import { BASE16_NAMES, BASE16_OF_REGION, STYLE_TO_BASE16, type Base16Culture } from './CultureBase16';
// 🔴 一级 16 母体的军团名只有一份权威（CultureFormations 的这张表，getLegionCompositionByName 也走它），
//    别在别处再抄一份 —— 抄出来的副本必然漂移。
import { BASE_16_LEGION_NAME_BY_REGION } from '../types/CultureFormations';

export interface FallbackPlanItem {
    factionId: string;
    generalId: string;
    generalName: string;
    era: GeneralEra;
    cityId: string;
    cityName: string;
    buildingStyle: string;
    /** 安置到的军团名 */
    newLegionName: string;
    /** level2 = 二级同时代命中；level1 = 回落母体一级 */
    via: 'level2' | 'level1';
    /** 给人看的一句话说明 */
    note: string;
}

export interface FallbackPlanSkip {
    factionId: string;
    reason: string;
}

export interface FallbackPlan {
    deletedLegion: string;
    items: FallbackPlanItem[];
    skipped: FallbackPlanSkip[];
}

/** 势力的代表据点：城级最高（tier 小）的一座 */
function pickFactionCity(factionId: string): CityDataV2 | null {
    let best: CityDataV2 | null = null;
    for (const c of CITIES_V2) {
        if (c.factionId !== factionId) continue;
        if (!best || (c.tier ?? 9) < (best.tier ?? 9)) best = c;
    }
    return best;
}

/** 建筑风格 → 16 母体；查不到返回 null（绝不默认 CENTRAL） */
export function base16OfBuildingStyle(style: string): Base16Culture | null {
    // ① 风格本身就是 16 个 DE 风格之一（ASIA / WEST / MEDI …）
    if (Object.prototype.hasOwnProperty.call(STYLE_TO_BASE16, style)) return STYLE_TO_BASE16[style];
    // ② 风格是 59 文明之一，且同名文化区在母体表里（JAPAN / WEI / BASHU …）
    if (Object.prototype.hasOwnProperty.call(BASE16_OF_REGION, style)) return BASE16_OF_REGION[style];
    // ③ 兜到二级表：该文明军团的 deStyle 就是它的 DE 风格
    const l2 = LEVEL_2_CIV_59_LEGIONS.find((l) => String(l.region) === style);
    if (l2 && Object.prototype.hasOwnProperty.call(STYLE_TO_BASE16, l2.deStyle)) return STYLE_TO_BASE16[l2.deStyle];
    return null;
}

/** 单个势力：按「武将时代 + 据点建筑风格」算它该去哪支军团 */
export function resolveFallbackForFaction(factionId: string): FallbackPlanItem | FallbackPlanSkip {
    const general = getFactionGeneral(factionId);
    if (!general) return { factionId, reason: '该势力没有配开局武将，判不了时代' };
    const era = GENERAL_ERA[general.generalId];
    if (!era) return { factionId, reason: `武将 ${general.generalName || general.generalId} 不在 GENERAL_ERA 表里` };
    const city = pickFactionCity(factionId);
    if (!city) return { factionId, reason: '该势力名下没有据点，判不了建筑风格' };
    const style = city.buildingStyle;
    if (!style) return { factionId, reason: `据点 ${city.name} 没写 buildingStyle` };

    const base: Omit<FallbackPlanItem, 'newLegionName' | 'via' | 'note'> = {
        factionId,
        generalId: general.generalId,
        generalName: general.generalName || general.generalId,
        era,
        cityId: city.id,
        cityName: city.name,
        buildingStyle: style,
    };

    // 二级：同建筑风格（region）且同时代
    const hit = LEVEL_2_CIV_59_LEGIONS.find((l) => String(l.region) === style && l.age === era);
    if (hit) {
        return {
            ...base,
            newLegionName: hit.name,
            via: 'level2',
            note: `${base.generalName}（${era}）据点 ${city.name} 是 ${style} 风格，二级有同时代的【${hit.name}】→ 安置二级`,
        };
    }

    const mother = base16OfBuildingStyle(style);
    if (!mother) return { factionId, reason: `建筑风格 ${style} 归不到 16 母体，请先补映射` };
    const name = BASE_16_LEGION_NAME_BY_REGION[mother];
    if (!name) return { factionId, reason: `母体 ${mother} 没有对应的一级军团名` };
    return {
        ...base,
        newLegionName: name,
        via: 'level1',
        note: `${base.generalName}（${era}）据点 ${city.name} 是 ${style} 风格，二级没有同时代的 → ${style} 归母体${BASE16_NAMES[mother]} → 退一级【${name}】`,
    };
}

/** 删除某支三级军团时，算出所有挂它的势力各自该去哪 */
export function planFallbackForDeletedLegion(deletedLegion: string): FallbackPlan {
    const items: FallbackPlanItem[] = [];
    const skipped: FallbackPlanSkip[] = [];
    for (const [factionId, entry] of Object.entries(FACTION_COMPOSITIONS)) {
        if (entry?.legionName !== deletedLegion) continue;
        const r = resolveFallbackForFaction(factionId);
        if ('newLegionName' in r) items.push(r); else skipped.push(r);
    }
    return { deletedLegion, items, skipped };
}

/**
 * 把计划逐条写进势力表。
 * 🔴 **只走单条写入** `/api/save-faction-legion` —— 整表覆盖的那个接口在 2026-09-15
 *    把 465 条洗成过 1 条，这里绝不碰它。
 */
export async function applyFallbackPlan(plan: FallbackPlan): Promise<{ ok: number; failed: Array<{ factionId: string; error: string }> }> {
    let ok = 0;
    const failed: Array<{ factionId: string; error: string }> = [];
    for (const it of plan.items) {
        try {
            const res = await fetch('/api/save-faction-legion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // legionType 跟层级走：一级 16 母体 = 文化军团 'region'；二级 59 = 制定军团 'sub'
                body: JSON.stringify({
                    factionId: it.factionId,
                    legionName: it.newLegionName,
                    legionType: it.via === 'level1' ? 'region' : 'sub',
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
            ok++;
        } catch (e) {
            failed.push({ factionId: it.factionId, error: (e as Error)?.message ?? String(e) });
        }
    }
    return { ok, failed };
}
