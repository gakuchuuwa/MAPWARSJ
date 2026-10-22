/**
 * 三级军团被删除后的**重新套军团**（🔴 2026-09-16 主人定；2026-10-16 主人收紧口径）。
 *
 * ── 规则（主人原话）────────────────────────────────────────────
 * 「每个武将都有一个据点，武将分四个时代，据点分 66 种。
 *   二级军团也分四个时代，66 种，一个武将套一个军团。」
 * 「只套二级，跟一级没关系。」
 *
 * ── 落地口径 ────────────────────────────────────────────────
 * ① 谁要重套：`FACTION_COMPOSITIONS` 里 `legionName` 正是被删那支的势力（一家一条）。
 * ② 武将时代：该势力的开局名将（`getFactionGeneral`）→ `GENERAL_ERA`（古典 / 封建 / 城堡 / 帝国）。
 * ③ 据点风格：该势力名下据点里**城级最高**的一座（`tier` 最小，缺省当 9；并列取表中先出现的），
 *    取它的 `buildingStyle`。据点建筑风格共 66 种，1128 座据点**每座都写了**，一座不缺。
 * ④ 二级命中：`LEVEL_2_CIV_62_LEGIONS` 里 **`buildingStyle` === 据点建筑风格** 且 `age === 武将时代`。
 *    66 种风格 × 4 时代 = 264 格，现存 257 支；同一格至多一支 ⇒ 命中即唯一，没有挑选余地。
 * ⑤ 不命中 = 这一格二级还没有军团 → **判不了，跳过**（列进 skipped，由调用方提示）。
 *    🔴 **绝不退一级母体、绝不塞默认值** —— 只套二级。
 *
 * ⚠️ 取不到武将 / 取不到据点 / 建筑风格解析不出来的，同样跳过不动，绝不用默认值硬塞。
 */
import { CITIES_V2, type CityDataV2 } from '../data/cities_v2';
import { resolveCityDeBuildingStyle } from './cityDeStyle';
import { GENERAL_ERA, type GeneralEra } from '../data/GeneralEra';
import { LEVEL_2_CIV_62_LEGIONS } from '../data/level2Civ62Legions';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { FACTION_GENERALS, getFactionGeneral, getFactionGenerals } from '../data/FactionGenerals';
import { getGeneralEraSubtagLegion, getGeneralEraSubtagLabel } from '../data/GeneralEraSubtags';
import { getGeneralCulture } from '../data/GeneralCulture';

export interface FallbackPlanItem {
    factionId: string;
    generalId: string;
    generalName: string;
    era: GeneralEra;
    cityId: string;
    cityName: string;
    buildingStyle: string;
    /** 套到的军团名 */
    newLegionName: string;
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

/**
 * 🔴 [2026-10-16 主人定] 二级全部 257 支（66 种建筑风格 × 4 时代）是武将的保底军团：
 * 删了它们，该风格 × 该时代的武将就没有二级可套。服务端 `/api/delete-legion` 已拦一级与二级，
 * 此函数给编辑器 UI 同一道闸门。
 */
export function isBaseFallbackLegion(name: string): boolean {
    return LEVEL_2_CIV_62_LEGIONS.some((l) => l.name === name);
}

/**
 * 🔴 [2026-10-16 主人令「看建筑风格，你看 region 干什么？每个据点不是都有建筑风格吗」
 *    →「只套二级，跟一级没关系。不要瞎掺和，删除误导信息。」]
 *
 * 二级命中**只认 `l.buildingStyle`，不许拿 `l.region` 当键**。
 * 二级表 `Level2CivLegionDef` 的 `buildingStyle` 与据点 `CityDataV2.buildingStyle` 是同一套 66 种取值；
 * `region` 是文化区/文明标识，与建筑风格有 33 条不同名（KOREA↔GORYEO、STEPPE↔MONGOL…），
 * 拿它当键才需要别名表打补丁。实测改按 buildingStyle 后 633 家势力逐家算全部命中二级。
 */

/** 势力的主据点：城级最高（tier 小）的一座 */
function pickFactionCity(factionId: string): CityDataV2 | null {
    let best: CityDataV2 | null = null;
    for (const c of CITIES_V2) {
        if (c.factionId !== factionId) continue;
        if (!best || (c.tier ?? 9) < (best.tier ?? 9)) best = c;
    }
    return best;
}

/** 单个势力：按「武将时代 + 据点建筑风格」算它该套哪支二级军团 */
export function resolveFallbackForFaction(factionId: string, generalId?: string | null): FallbackPlanItem | FallbackPlanSkip {
    // 🔴 [2026-10-19 主人令「当军团被删除后，武将要学会自己找对应的军团」] 指定了武将就按这位武将的时代找；没指定仍取势力开局名将
    const general = generalId
        ? (getFactionGenerals(factionId).find((g) => g.generalId === generalId) ?? null)
        : getFactionGeneral(factionId);
    if (!general) return { factionId, reason: '该势力没有配开局武将，判不了时代' };
    const era = GENERAL_ERA[general.generalId];
    if (!era) return { factionId, reason: `武将 ${general.generalName || general.generalId} 不在 GENERAL_ERA 表里` };
    // 🔴 [2026-10-19 主人令「必须给每个武将单独添加一个文化属性，才能对应上军团」] 文化是武将自己的属性（GeneralCulture）；表里没有才退回「势力主据点」的建筑风格
    const city = pickFactionCity(factionId);
    const ownStyle = getGeneralCulture(general.generalId);
    let style: string | undefined = ownStyle;
    if (!style) {
        if (!city) return { factionId, reason: '武将没有文化属性，该势力名下也没有据点，判不了建筑风格' };
        // 没写 buildingStyle 的据点走同一条解析链算出风格（实测 1128 座据点全都写了，这里是兜底）
        style = city.buildingStyle
            ?? resolveCityDeBuildingStyle(city.id, city.type, city.region, city.lat, city.lng, undefined)
            ?? undefined;
    }
    if (!style) return { factionId, reason: `据点 ${city?.name ?? ''} 既没写 buildingStyle，也解析不出建筑风格` };

    const base: Omit<FallbackPlanItem, 'newLegionName' | 'note'> = {
        factionId,
        generalId: general.generalId,
        generalName: general.generalName || general.generalId,
        era,
        cityId: city?.id ?? '',
        cityName: city?.name ?? '（无据点，按武将文化）',
        buildingStyle: style,
    };

    // 🔴 [2026-10-16 主人令] 例外：**武将细分标签**（如「古典 · 先秦」）优先于「风格 × 时代」命中 ——
    //    这批武将挂细分专属军团（先秦 → 古典时代先秦军团，属三级表）。这条与一级无关，是主人单独定的。
    const subtagLegion = getGeneralEraSubtagLegion(general.generalId);
    if (subtagLegion) {
        return {
            ...base,
            newLegionName: subtagLegion,
            note: `${base.generalName}（${era}）带细分标签【${getGeneralEraSubtagLabel(general.generalId)}】→ 套【${subtagLegion}】`,
        };
    }

    // 二级：同建筑风格（l.buildingStyle）× 同武将时代
    const hit = LEVEL_2_CIV_62_LEGIONS.find((l) => String(l.buildingStyle) === style && l.age === era);
    if (!hit) {
        return { factionId, reason: `${style} 风格 × ${era} 这一格二级还没有军团，套不上（不退一级）` };
    }
    return {
        ...base,
        newLegionName: hit.name,
        note: `${base.generalName}（${era}）文化 ${style} → 套二级【${hit.name}】`,
    };
}

/** 删除某支三级军团时，算出所有挂它的势力各自该套哪支二级军团 */
export function planFallbackForDeletedLegion(deletedLegion: string): FallbackPlan {
    const items: FallbackPlanItem[] = [];
    const skipped: FallbackPlanSkip[] = [];
    for (const [factionId, entry] of Object.entries(FACTION_COMPOSITIONS)) {
        if (entry?.legionName !== deletedLegion) continue;
        const r = resolveFallbackForFaction(factionId);
        if ('newLegionName' in r) items.push(r); else skipped.push(r);
    }
    // 武将自己写了「所属军团」且正是被删那支的（同势力里时代不同的武将）：各自按自己的时代再找
    for (const factionId of Object.keys(FACTION_GENERALS)) {
        for (const g of getFactionGenerals(factionId)) {
            if (g.legionName !== deletedLegion) continue;
            const r = resolveFallbackForFaction(factionId, g.generalId);
            if ('newLegionName' in r) items.push(r); else skipped.push(r);
        }
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
                // 只套二级军团 ⇒ legionType 一律 'sub'
                body: JSON.stringify({
                    factionId: it.factionId,
                    legionName: it.newLegionName,
                    legionType: 'sub',
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
