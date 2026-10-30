/**
 * 🔴 [2026-10-23 主人「据点每局归哪个势力不要固定，请随机。但要保证每个势力都有据点。」]
 * 乱斗模式开局：每座据点从「和它有关的势力」里随机抽一个当主人，并保证每个势力至少分到一座。
 *
 * · 和据点有关的势力＝据点原主 ＋ 挂在这座据点的武将各自的政权。
 * · 先保底：每个势力至少分一座（二分匹配，候选城被占就让占的那家换一座）；
 *   真换不开的（几个势力挤同一座城、又都没有别的城）记进「没分到」。
 * · 再分剩下的：每座在候选里随机抽一个（若该据点有名将，优先在名将所属势力里抽，免得普将挤掉名将）。
 * · 只在切进乱斗模式（含新开乱斗局）那一刻抽一次；局中城被占照常换主，不再重抽。
 * · 离开乱斗模式：还挂着本模块所给势力的城还原成原主。
 * · 读档进乱斗：只动还是原主的城（已经换过主的城保持读档里的样子）。
 * · 不走占城流程（`skipCaptureLog`）：不播报、不冒烟。
 */
import { CITIES_V2 } from '../data/cities_v2';
import { FACTION_GENERALS, type FactionGeneral } from '../data/FactionGenerals';
import { getGeneralProfile } from '../data/general-skills/profiles';
import type { CityManager } from '../world/CityManager';

const ORIGINAL_OWNER = new Map(CITIES_V2.map((c) => [c.id, c.factionId]));

/**
 * 🔴 [2026-10-24 主人「据点和势力没有关系…据点只和武将有关系，同文化，势力看武将。没有武将要什么势力呀」]
 * 据点 → 候选势力＝**只取挂在这座据点的武将政权**（不再把 cities_v2 的历史 factionId 当势力）；
 * 没有武将的据点＝**叛军**（panshu：无字旗、不出征），由 rollMeleeOwners 兜底指派。
 */
function buildCandidates(): { cand: Map<string, Set<string>>; famousCand: Map<string, Set<string>> } {
    const cand = new Map<string, Set<string>>();
    const famousCand = new Map<string, Set<string>>();
    for (const [blockFaction, entry] of Object.entries(FACTION_GENERALS)) {
        const list: readonly FactionGeneral[] = Array.isArray(entry) ? entry : [entry as FactionGeneral];
        for (const g of list) {
            if (!g.cityId) continue;
            const fid = g.factionId ?? blockFaction;
            const set = cand.get(g.cityId) ?? new Set<string>();
            set.add(fid);
            cand.set(g.cityId, set);
            if (getGeneralProfile(g.generalId)?.tier === 'famous') {
                const fSet = famousCand.get(g.cityId) ?? new Set<string>();
                fSet.add(fid);
                famousCand.set(g.cityId, fSet);
            }
        }
    }
    return { cand, famousCand };
}

function shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** 抽一局的归属；返回 据点→势力，以及没分到据点的势力 */
export function rollMeleeOwners(): { owners: Map<string, string>; unplaced: string[] } {
    const { cand, famousCand } = buildCandidates();
    const citiesOf = new Map<string, string[]>();
    for (const [cityId, set] of cand) for (const f of set) {
        if (!citiesOf.has(f)) citiesOf.set(f, []);
        citiesOf.get(f)!.push(cityId);
    }
    const owners = new Map<string, string>();
    const unplaced: string[] = [];
    // 保底用二分匹配（增广路）：一个势力挑不到空城时，看能不能让占着它候选城的势力换一座 ——
    // 只有真的换不开（几个势力挤同一座城、又都没有别的城）才算没分到。
    // 同势力有多个候选城时，优先挑「本势力在此有名将」或「未挤占别家名将」的据点（如鲜卑优先取嘎仙洞，不挤占兴和城的元名将燕帖木儿）。
    const factions = shuffle([...citiesOf.keys()]).sort((a, b) => citiesOf.get(a)!.length - citiesOf.get(b)!.length);
    const orderedCitiesFor = (f: string): string[] => {
        const raw = shuffle([...citiesOf.get(f)!]);
        return raw.sort((a, b) => {
            const fa = famousCand.get(a);
            const fb = famousCand.get(b);
            const rank = (fSet: Set<string> | undefined): number => {
                if (!fSet || fSet.size === 0) return 1; // 无名将争抢
                if (fSet.has(f)) return 0;              // 本势力在此有名将
                return 2;                               // 别家在此有名将（尽量让给名将）
            };
            return rank(fa) - rank(fb);
        });
    };
    const tryPlace = (f: string, seen: Set<string>): boolean => {
        for (const c of orderedCitiesFor(f)) {
            if (seen.has(c)) continue;
            seen.add(c);
            const holder = owners.get(c);
            if (holder === undefined || tryPlace(holder, seen)) { owners.set(c, f); return true; }
        }
        return false;
    };
    for (const f of factions) if (!tryPlace(f, new Set())) unplaced.push(f);
    for (const [cityId, set] of cand) {
        if (owners.has(cityId)) continue;
        const fSet = famousCand.get(cityId);
        const list = fSet && fSet.size > 0 ? [...fSet] : [...set];
        owners.set(cityId, list[Math.floor(Math.random() * list.length)]);
    }
    // 🔴 [2026-10-24 主人「叛军是旗帜上没有字、不能出征」] 无将据点＝叛军 panshu（无字旗、不征兵、不出征）；
    //    「义军」是历史起义首领各自的独立正常势力（旧 panjun 占位势力已于 2026-10-25 删除），两者不是一回事
    for (const c of CITIES_V2) if (!owners.has(c.id)) owners.set(c.id, 'panshu');
    return { owners, unplaced };
}

const applied = new Map<string, string>();
let active = false;
/** 上一局没分到据点的势力（排查用：控制台 game 里看） */
export let lastUnplacedFactions: string[] = [];

export function syncMeleeRandomOwners(cityManager: CityManager, meleeOn: boolean): void {
    if (!meleeOn) {
        if (!active) return;
        for (const [cityId, factionId] of applied) {
            const city = cityManager.getCity(cityId);
            const orig = ORIGINAL_OWNER.get(cityId);
            if (city && orig && city.factionId === factionId && factionId !== orig) {
                cityManager.updateCity(cityId, { factionId: orig }, { skipCaptureLog: true });
            }
        }
        applied.clear();
        active = false;
        return;
    }
    if (active) return;
    active = true;
    const { owners, unplaced } = rollMeleeOwners();
    lastUnplacedFactions = unplaced;
    for (const [cityId, factionId] of owners) {
        const city = cityManager.getCity(cityId);
        if (!city || city.factionId !== ORIGINAL_OWNER.get(cityId)) continue;   // 读档里已换过主的城不动
        if (city.factionId === factionId) continue;
        cityManager.updateCity(cityId, { factionId }, { skipCaptureLog: true });
        applied.set(cityId, factionId);
    }
}
