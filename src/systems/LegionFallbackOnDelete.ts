/**
 * 三级军团被删除后的**回落安置**（🔴 2026-09-16 主人定）。
 *
 * ── 规则（主人原话）────────────────────────────────────────────
 * 「一级和二级军团的 16+62 是不能被删除的，只有三级军团可以增加和减少。
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
 *    取它的 `buildingStyle`。建筑风格现在是 66 种（62 文明 + 4 其它；16 母体是另一套据点分类），本来就带文明身份。
 * ④ 二级命中：`LEVEL_2_CIV_62_LEGIONS` 里 `region === buildingStyle` 且 `age === 武将时代`。
 *    二级一个 region 只有一支，所以命中即唯一，不存在「同风格同时代多支」的挑选问题。
 * ⑤ 不命中 → 把建筑风格归到 16 母体，安置该母体的一级军团（`BASE16_LEGION_NAMES`）。
 *
 * ⚠️ 取不到武将、取不到据点、或建筑风格归不到母体的，一律**跳过不动**（列进 skipped 由调用方提示），
 *    绝不用默认值硬塞 —— `BASE16_OF_REGION` 查不到会静默回落 CENTRAL，那种错比不动更难查。
 */
import { CITIES_V2, type CityDataV2 } from '../data/cities_v2';
import { resolveCityDeBuildingStyle } from './cityDeStyle';
import { GENERAL_ERA, type GeneralEra } from '../data/GeneralEra';
import { LEVEL_2_CIV_62_LEGIONS } from '../data/level2Civ62Legions';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { getFactionGeneral } from '../data/FactionGenerals';
import { getGeneralEraSubtagLegion, getGeneralEraSubtagLabel } from '../data/GeneralEraSubtags';
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

/**
 * 🔴 [2026-10-16 主人定]「16+62 的 78 个基础军团不能被删除」—— 一级 16 与**二级全部**
 * （文明 × 时代名册，现存 257 支）都是保底军团：删了它们，该风格/该时代的武将就没有军团可接，
 * 回落链路当场断掉。服务端 `/api/delete-legion` 已拦一级与二级，此函数给编辑器 UI 同一道闸门。
 *
 * ⚠️ 2026-10-16 **删掉旧「三级专属风格保底三支」**（青藏→封建时代吐蕃军团／西域→古典时代西域军团／
 *    漠北毡帐→城堡时代蒙古军团）：那是**与时代无关的固定指派**，与主人最新口径
 *    「武将定时代 ＋ 建筑风格定建筑文化 → 挂该文明 × 该时代的二级军团」直接冲突；
 *    且「古典时代西域军团」已按主人名册删除（该分支新名为古典时代塞种军团）。
 *    现在一律走 ④「同风格 ＋ 同时代」命中，不再有绕过时代的保底。
 */
export function isBaseFallbackLegion(name: string): boolean {
    return LEVEL_2_CIV_62_LEGIONS.some((l) => l.name === name);
}


/**
 * 🔴 [2026-09-18] 二级 62：**建筑风格的 key** 与 **二级军团表的 region** 有几处不同名，
 * 指的是同一个文明（对照 _citytest.html 里那几条 label 即可确认；军团名已按 2026-10-16 名册更新）：
 *     KOREA(🏯 高丽)        ↔ GORYEO      【城堡时代高丽军团】
 *     GERMANIC(🛡️ 条顿)     ↔ TEUTONS     【城堡时代德意志骑士团】
 *     LATIN(🏛️ 意大利)      ↔ ITALIANS    【城堡时代卡罗乔民兵团】
 *     TURKS(🕌 奥斯曼)      ↔ OTTOMAN     【帝国时代土耳其军团】
 *     AFRICA(🌍 马里)       ↔ MALI        【城堡时代马里军团】
 *     PERSIAN(🏛️ 阿契美尼德) ↔ ACHAEMENIDS 【古典时代不死军团】
 *     YURT / MOBEI_MONGOL(⛺ 漠北毡帐) ↔ MONGOL 【漠北蒙古四档：匈奴/突厥/蒙古/喀尔喀】
 *
 * 不做这层别名，二级查找 `l.region === buildingStyle` 对这几种风格必然落空 →
 * 明明有同文明的二级军团，却会一路退到一级母体（高丽退东亚军团、条顿退西欧军团…），
 * 保底安置就安错了。
 */
const L2_STYLE_ALIAS: Record<string, string> = {
    KOREA: 'GORYEO',
    GERMANIC: 'TEUTONS',
    LATIN: 'ITALIANS',
    TURKS: 'OTTOMAN',
    AFRICA: 'MALI',
    PERSIAN: 'ACHAEMENIDS',
    YURT: 'MONGOL',
    MOBEI_MONGOL: 'MONGOL',
};

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
    // ② 风格是 62 文明之一，且同名文化区在母体表里（JAPAN / WEI / BASHU …）
    if (Object.prototype.hasOwnProperty.call(BASE16_OF_REGION, style)) return BASE16_OF_REGION[style];
    // ③ 兜到二级表：该文明军团的 deStyle 就是它的 DE 风格
    const l2 = LEVEL_2_CIV_62_LEGIONS.find((l) => String(l.region) === style);
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
    // [2026-09-18] 没写 buildingStyle 的据点（实测 2 座，如五峰燧）不再跳过 ——
    //    改用同一条解析链算出风格，保证「三级军团被删 → 每个武将都有军团接」一家都不落。
    const style = city.buildingStyle
        ?? resolveCityDeBuildingStyle(city.id, city.type, city.region, city.lat, city.lng, undefined);
    if (!style) return { factionId, reason: `据点 ${city.name} 既没写 buildingStyle，也解析不出建筑风格` };

    const base: Omit<FallbackPlanItem, 'newLegionName' | 'via' | 'note'> = {
        factionId,
        generalId: general.generalId,
        generalName: general.generalName || general.generalId,
        era,
        cityId: city.id,
        cityName: city.name,
        buildingStyle: style,
    };

    // ⓪（2026-10-16 删除）旧「三级专属风格固定保底」不再存在 —— 一律按主人口径走
    //    「同建筑风格 ＋ 同武将时代」的二级命中，见下。
    // 🔴 [2026-10-16 主人令] 例外：**武将细分标签**（如「古典 · 先秦」）优先于二级命中 ——
    //    这批武将属于古典里的细分文化，势力就挂该细分专属军团（先秦 → 古典时代先秦军团）。
    const subtagLegion = getGeneralEraSubtagLegion(general.generalId);
    if (subtagLegion) {
        return {
            ...base,
            newLegionName: subtagLegion,
            via: 'level2',
            note: `${base.generalName}（${era}）带细分标签【${getGeneralEraSubtagLabel(general.generalId)}】→ 保底【${subtagLegion}】`,
        };
    }

    // 二级：同建筑风格（region）且同时代
    const l2Key = L2_STYLE_ALIAS[style] ?? style;
    const hit = LEVEL_2_CIV_62_LEGIONS.find((l) => String(l.region) === l2Key && l.age === era);
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
                // legionType 跟层级走：一级 16 母体 = 文化军团 'region'；二级 62 = 制定军团 'sub'
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

