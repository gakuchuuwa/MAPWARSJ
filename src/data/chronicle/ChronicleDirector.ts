/**
 * 编年史导演层（2026-11-13）：百岁模式下按主线逐场推演。
 * 只管「演到第几场、这一场跟谁、打哪一仗、念哪两段」；走路、会面、开战、播报全部交给现有经典战管线。
 * 总方针见 `docs/02-design/systems/编年史自动推进-设计方案-2026-11-12.md` 〇节。
 */
import type { GeneralFirstBattle } from '../GeneralFirstBattles';
import { getGameMode } from '../generalOnStage';
import { CHRONICLE_MAINLINE } from './ChronicleMainline.generated';
import type { ChronicleMainlineEvent } from './ChronicleTypes';
import { CHRONICLE_CITY_OWNERSHIP } from './ChronicleCityOwnership';

let active = false;
let index = 0;
/** 编年史战事按史载结果改写的归属（据点 → 势力 ＋ 改写当年）：优先于同年及更早的历年归属表项 */
const cityOwners = new Map<string, { factionId: string; year: number }>();

export function setChronicleCityOwner(cityId: string, factionId: string): void {
    cityOwners.set(cityId, { factionId, year: currentChronicleEvent()?.year ?? Number.NEGATIVE_INFINITY });
}

/** 编年史推演中某年各据点的史实归属（历年归属表 ＋ 战事改写）；不在推演中返回空 */
export function chronicleOwnershipAt(year: number): ReadonlyMap<string, string> {
    const out = new Map<string, string>();
    if (!isChronicleActive()) return out;
    const tableYear = new Map<string, number>();
    for (const [cityId, rows] of Object.entries(CHRONICLE_CITY_OWNERSHIP)) {
        let hit: readonly [number, string] | undefined;
        for (const row of rows) if (row[0] <= year) hit = row;
        if (hit) { out.set(cityId, hit[1]); tableYear.set(cityId, hit[0]); }
    }
    for (const [cityId, o] of cityOwners) {
        if (o.year <= year && o.year >= (tableYear.get(cityId) ?? Number.NEGATIVE_INFINITY)) out.set(cityId, o.factionId);
    }
    return out;
}
const BY_BATTLE_ID = new Map<string, ChronicleMainlineEvent>(
    CHRONICLE_MAINLINE.filter((e) => e.battle).map((e) => [e.battle!.battleId!, e]),
);

/** 新开一局百岁模式：从主线第一场演起 */
export function startChronicle(): void {
    active = CHRONICLE_MAINLINE.length > 0;
    index = 0;
    cityOwners.clear();
}

/** 编年史正在推演（百岁模式、已开演、主线未演完） */
export function isChronicleActive(): boolean {
    return active && getGameMode() === 'centenarian' && index < CHRONICLE_MAINLINE.length;
}

export function currentChronicleEvent(): ChronicleMainlineEvent | null {
    return isChronicleActive() ? CHRONICLE_MAINLINE[index] : null;
}

export function firstChronicleEvent(): ChronicleMainlineEvent | null {
    return CHRONICLE_MAINLINE[0] ?? null;
}

/** 推进到下一场；返回新的当前场（演完为 null） */
export function advanceChronicle(): ChronicleMainlineEvent | null {
    if (!isChronicleActive()) return null;
    index++;
    return currentChronicleEvent();
}

/** 这位武将眼下该打的编年史之战（只认当前场的随行主将） */
export function chronicleBattleFor(generalId: string | null | undefined): GeneralFirstBattle | null {
    const ev = currentChronicleEvent();
    if (!ev || ev.kind !== 'battle' || !ev.battle || ev.leadGeneralId !== generalId) return null;
    return ev.battle;
}

export function getChronicleBattleById(battleId: string | null | undefined): GeneralFirstBattle | null {
    return (battleId && BY_BATTLE_ID.get(battleId)?.battle) || null;
}

/** 编年史之战的两段播报（非编年史之战返回 null） */
export function getChronicleBriefing(battleId: string | null | undefined): { strategic: string[]; tactical: string[] } | null {
    const ev = battleId ? BY_BATTLE_ID.get(battleId) : undefined;
    return ev ? { strategic: ev.strategic, tactical: ev.tactical } : null;
}

export function isChronicleBattleId(battleId: string | null | undefined): boolean {
    return !!battleId && BY_BATTLE_ID.has(battleId);
}
