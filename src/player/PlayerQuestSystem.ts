/**
 * PlayerQuestSystem —— 据点对话与两层任务（2026-09-05 主人定）。
 *
 * 抵达据点 → 看城中武将在不在（据点锚定武将，且此刻没随军在外）→ 对话：
 *   第一层：据点不是原势力的 → 武将（遗臣）请玩家助其复国。同意 → 遗臣起兵 1 万（本城精锐+本将）
 *           围攻本城，玩家入伍随军；城归原势力即复国成功。
 *   第二层：据点仍是原势力的 → 武将请玩家随他出征一座据点（沿路网最近的敌城）。同意 → 起兵 1 万远征；
 *           占领目标后玩家学会该势力的主力精锐兵种（可选一支带进战术模式）。
 *
 * 军团一律走现成远征机制（expeditionTargetCityId + 行为树），本系统只发令、跟踪结果、收尾。
 */
import type { Army } from '../legion/Army';
import type { City } from '../types/core';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getCityEliteLegionName } from '../data/ExpeditionLegions';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { getScriptProtagonistCityId } from '../data/HistoricalEventScript';
import { GameConfig } from '../config/GameConfig';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { compareGeneralsByPriority } from '../data/generalSelection';
import { getFactionCompositionSlots } from '../types/CultureFormations';
import { resolveGeneralPortraitPath } from '../config/portrait_defaults';
import { getCityRegion } from '../systems/RegionSystem';
import { markSpawnTierConsumed } from '../legion/LegionSpawnTier';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';
import type { PlayerHero } from './PlayerHero';
import { PLAYER_QUEST_TARGET_MAX_HOPS } from './PlayerConfig';

export type PlayerQuestKind = 'restore' | 'campaign';

export interface PlayerQuest {
    kind: PlayerQuestKind;
    /** 发任务的据点 */
    cityId: string;
    cityName: string;
    /** 任务军团所属势力（复国 = 原势力；出征 = 据点现势力） */
    factionId: string;
    factionName: string;
    generalId: string;
    generalName: string;
    legionId: string;
    /** 要打的据点（复国 = 本城；出征 = 目标城） */
    targetCityId: string;
    targetCityName: string;
    /** 出征任务奖励精锐 */
    reward?: { name: string; unitKey: string };
    /**
     * 🔴 [2026-09-11 主人定 A 方案] **剧本任务目标**（真历史剧本）：
     * 玩家随的是**剧本主角军团**时，任务条显示真实历史进度（如「进军格拉尼库斯」），
     * 而不是引擎默认那套「攻【某城】」——剧本拿 `expeditionTargetCityId` 当行军航点用，
     * 引擎那套会把它误显示成"攻打该城"。有此字段即为剧本任务。
     */
    scriptObjective?: { label: string };
}

export interface DialogueOption {
    label: string;
    accent?: boolean;
    onPick: () => void;
}

export interface DialoguePayload {
    speaker: string;
    portrait: string | null;
    factionName: string;
    text: string;
    options: DialogueOption[];
}

export interface PlayerQuestDeps {
    hero: PlayerHero;
    cityManager: {
        getCity(id: string): City | undefined;
        getCities(): City[];
        getFactionName(id: string): string;
        getConnectedCities(cityId: string): City[];
    };
    legionManager: {
        createLegion(
            pos: { lat: number; lng: number },
            troops: number,
            factionId: string,
            name?: string,
            onArrive?: (army: Army) => void,
            legionType?: unknown,
            sourceCityId?: string,
            generalId?: string,
            forceCreate?: boolean,
        ): Army | null;
        getLegionById(id: string): Army | undefined;
        getArmies(): Army[];
    };
    showDialogue: (payload: DialoguePayload) => void;
    closeDialogue: () => void;
    notify: (msg: string) => void;
    kickLegionAi: (armyId: string) => void;
    ensureUnpaused: () => void;
    feed?: {
        pushRestoration?(p: { factionId: string; cityName: string }): void;
        pushExpedition?(p: { legionName: string; cityName: string; kind: 'depart' | 'success' }): void;
    };
    /** 当前游戏年份（负 = 公元前）。自动模式据此判定"当年有没有剧本任务要接"。 */
    getYear: () => number;
    /**
     * 🔴 [2026-09-11 主人定 A 方案] 剧本主角军团的真实历史目标（非剧本军团返回 null）。
     * 有值时：任务条改显示真历史进度，且**入伍不再要求该军团有"目标城"**
     * （剧本军的 `expeditionTargetCityId` 只是行军航点，引擎那套会当成"要攻占的城"）。
     */
    getScriptObjective?: (armyId: string | null | undefined) => { label: string; done: boolean } | null;
}

const TICK_MS = 400;

export class PlayerQuestSystem {
    private quest: PlayerQuest | null = null;
    /** 开局原势力快照（以 CityManager 开局状态为准，与 RebellionSystem 同口径） */
    private initialFaction = new Map<string, string>();
    private timer: number | null = null;
    private changeListeners = new Set<() => void>();

    constructor(private deps: PlayerQuestDeps) {
        for (const c of deps.cityManager.getCities()) {
            if (c.factionId) this.initialFaction.set(c.id, c.factionId);
        }
        deps.hero.onArriveCity = (city) => this.onArrive(city);
        // 🔴 [2026-09-09 主人定] 在野外追上带兵的武将 → 直接谈随军（见 onMeetArmy）
        deps.hero.onMeetArmy = (army) => this.onMeetArmy(army);
        deps.hero.onHostLost = (lastId) => this.onHostLost(lastId);
        this.timer = window.setInterval(() => this.tick(), TICK_MS);
    }

    public getQuest(): PlayerQuest | null { return this.quest; }
    public onChange(fn: () => void): void { this.changeListeners.add(fn); }
    private emitChange(): void { for (const fn of this.changeListeners) fn(); }

    public getInitialFactionId(cityId: string): string | null {
        return this.initialFaction.get(cityId) ?? null;
    }

    /** 城中武将：据点锚定武将，且此刻没有活着的军团带着他 */
    public generalInCity(cityId: string): { generalId: string; generalName: string; portrait: string } | null {
        const g = getCityAnchoredGeneral(cityId);
        if (!g) return null;
        const away = this.deps.legionManager.getArmies().some(
            (a) => !a.isDestroyed && a.getTroops() > 0 && a.generalId === g.generalId,
        );
        if (away) return null;
        const rec = getGeneralRecordByGeneralId(g.generalId);
        return {
            generalId: g.generalId,
            generalName: rec?.generalName ?? g.generalName,
            portrait: rec?.portrait ?? g.portrait,
        };
    }

    // ── 抵达对话 ──────────────────────────────────────────
    private onArrive(city: City): void {
        const hero = this.deps.hero;
        if (hero.isAttached()) return;
        const g = this.generalInCity(city.id);
        if (!g) {
            const anchored = getCityAnchoredGeneral(city.id);
            // 🔴 [2026-09-09 主人定] 扑空不再换人：他既然带兵出去了，就追出去找他。
            //    （赶路途中武将出征是常态，原来在这里直接放弃，玩家就一直在空跑。）
            const army = anchored ? this.armyOfGeneral(anchored.generalId) : null;
            if (anchored && army) {
                this.chaseCityId = city.id;
                if (this.deps.hero.travelToArmy(army.id, anchored.generalName)) {
                    this.deps.notify(`抵达【${city.name}】：${anchored.generalName}已率军在外，追往其军中`);
                    return;
                }
            }
            this.deps.notify(anchored
                ? `抵达【${city.name}】：${anchored.generalName}已率军在外，且无从追及`
                : `抵达【${city.name}】：城中无将可谈`);
            return;
        }
        if (this.quest) {
            this.deps.notify(`抵达【${city.name}】：手上还有任务未了（${this.quest.targetCityName}），先完成再谈`);
            return;
        }
        const original = this.initialFaction.get(city.id) ?? city.factionId;
        const factionName = this.deps.cityManager.getFactionName(city.factionId);
        const portrait = resolveGeneralPortraitPath(g.portrait, {
            factionId: original,
            region: getCityRegion(city),
        });
        if (city.factionId !== original) {
            const originalName = this.deps.cityManager.getFactionName(original);
            this.deps.showDialogue({
                speaker: g.generalName,
                portrait,
                factionName: originalName,
                text: `壮士远来辛苦。此城本是我${originalName}故土，如今为${factionName}所据，旧部含恨、父老翘首。`
                    + `某欲举义复国，苦无勇士相助。壮士若肯同举义旗，事成之日，${originalName}上下必不相负！`,
                options: [
                    { label: '⚔ 助其复国', accent: true, onPick: () => this.startRestoration(city, g, original) },
                    { label: '告辞', onPick: () => this.deps.closeDialogue() },
                ],
            });
            return;
        }
        const target = this.pickCampaignTarget(city);
        if (!target) {
            this.deps.showDialogue({
                speaker: g.generalName,
                portrait,
                factionName,
                text: `壮士远来。四境暂无敌患，${factionName}无事相托，请自便。`,
                options: [{ label: '告辞', onPick: () => this.deps.closeDialogue() }],
            });
            return;
        }
        const targetFactionName = this.deps.cityManager.getFactionName(target.factionId);
        const eliteName = getCityEliteLegionName(city.id) ?? `${g.generalName}部`;
        this.deps.showDialogue({
            speaker: g.generalName,
            portrait,
            factionName,
            text: `壮士远来。【${target.name}】为${targetFactionName}所据，久为我${factionName}心腹之患。`
                + `某奉命出征，愿请壮士同行。若得克城，某当以「${eliteName}」之战法相授，壮士可自领一军。`,
            options: [
                { label: `⚔ 随军出征【${target.name}】`, accent: true, onPick: () => this.startCampaign(city, g, target, eliteName) },
                { label: '告辞', onPick: () => this.deps.closeDialogue() },
            ],
        });
    }

    /** 沿路网 BFS 最近敌城（跳数优先，同跳取直线最近）；找不到就全图直线最近敌城 */
    private pickCampaignTarget(city: City): City | null {
        const faction = city.factionId;
        const seen = new Set<string>([city.id]);
        let frontier: City[] = [city];
        for (let hop = 1; hop <= PLAYER_QUEST_TARGET_MAX_HOPS; hop++) {
            const next: City[] = [];
            for (const c of frontier) {
                for (const n of this.deps.cityManager.getConnectedCities(c.id)) {
                    if (seen.has(n.id)) continue;
                    seen.add(n.id);
                    next.push(n);
                }
            }
            const hostile = next.filter((c) => c.factionId && c.factionId !== faction);
            if (hostile.length) {
                hostile.sort((a, b) =>
                    getEuclideanDistance({ lat: city.latitude, lng: city.longitude }, { lat: a.latitude, lng: a.longitude })
                    - getEuclideanDistance({ lat: city.latitude, lng: city.longitude }, { lat: b.latitude, lng: b.longitude }));
                return hostile[0];
            }
            if (!next.length) break;
            frontier = next;
        }
        let best: City | null = null;
        let bd = Infinity;
        for (const c of this.deps.cityManager.getCities()) {
            if (!c.factionId || c.factionId === faction || c.id === city.id) continue;
            const d = getEuclideanDistance({ lat: city.latitude, lng: city.longitude }, { lat: c.latitude, lng: c.longitude });
            if (d < bd) { bd = d; best = c; }
        }
        return best;
    }

    /** 势力主力精锐兵种 = 编成里数量最多的那一档（精锐放 4 档铁律） */
    private mainUnitKeyOf(factionId: string, generalId: string): string | null {
        const slots = getFactionCompositionSlots(factionId, generalId);
        if (!slots || !slots.length) return null;
        let best = slots[0];
        for (const s of slots) if (s.count > best.count) best = s;
        return best.type ?? null;
    }

    // ── 起兵 ──────────────────────────────────────────────
    private raiseLegion(
        city: City,
        factionId: string,
        general: { generalId: string; generalName: string; portrait: string },
        targetCityId: string,
    ): Army | null {
        const eliteName = getCityEliteLegionName(city.id) ?? `${general.generalName}部`;
        // 🔴 [2026-09-10 主人定] 玩家起兵 = 势力本身的兵力（本城城防），不凭空造固定值；
        //    起兵即本城兵力转入军团、据点城防归零（兵力守恒，和其他无关）。
        const troops = Math.max(1, city.troops || 0);
        const army = this.deps.legionManager.createLegion(
            { lat: city.latitude, lng: city.longitude },
            troops,
            factionId,
            eliteName,
            undefined,
            undefined,
            city.id,
            general.generalId,
            true,
        );
        if (!army || !this.deps.legionManager.getLegionById(army.id)) return null;
        army.setTroops(troops);
        city.troops = 0;
        army.isElite = true;
        army.name = eliteName;
        army.homeCityId = city.id;
        if (!army.generalId) army.generalId = general.generalId;
        const rec = getGeneralRecordByGeneralId(general.generalId);
        if (rec?.portrait) army.portraitPath = rec.portrait;
        army.expeditionUnlocked = true;
        army.expeditionTargetCityId = targetCityId;
        // 将/精随军离城：据点档位标记消耗，城防不再影分身（与募兵同口径）
        markSpawnTierConsumed(city, { general: true, elite: true });
        return army;
    }

    private startRestoration(city: City, g: { generalId: string; generalName: string; portrait: string }, original: string): void {
        this.deps.closeDialogue();
        const army = this.raiseLegion(city, original, g, city.id);
        if (!army) {
            this.deps.notify('起兵失败（军团未能建立）');
            return;
        }
        const factionName = this.deps.cityManager.getFactionName(original);
        this.quest = {
            kind: 'restore',
            cityId: city.id,
            cityName: city.name,
            factionId: original,
            factionName,
            generalId: g.generalId,
            generalName: g.generalName,
            legionId: army.id,
            targetCityId: city.id,
            targetCityName: city.name,
        };
        this.deps.hero.joinFaction(original);
        this.deps.hero.attachTo(army);
        this.deps.ensureUnpaused();
        this.deps.kickLegionAi(army.id);
        this.deps.notify(`⚔️ ${g.generalName}于【${city.name}】举义，${factionName}复国之战开始`);
        gameLog('expedition', `[玩家] 复国任务：${g.generalName} 起兵 ${army.name} 围攻 ${city.name}（${factionName}）`);
        this.emitChange();
    }

    private startCampaign(
        city: City,
        g: { generalId: string; generalName: string; portrait: string },
        target: City,
        eliteName: string,
    ): void {
        this.deps.closeDialogue();
        const army = this.raiseLegion(city, city.factionId, g, target.id);
        if (!army) {
            this.deps.notify('起兵失败（军团未能建立）');
            return;
        }
        const factionName = this.deps.cityManager.getFactionName(city.factionId);
        const unitKey = this.mainUnitKeyOf(city.factionId, g.generalId);
        this.quest = {
            kind: 'campaign',
            cityId: city.id,
            cityName: city.name,
            factionId: city.factionId,
            factionName,
            generalId: g.generalId,
            generalName: g.generalName,
            legionId: army.id,
            targetCityId: target.id,
            targetCityName: target.name,
            reward: unitKey ? { name: eliteName, unitKey } : undefined,
        };
        this.deps.hero.joinFaction(city.factionId);
        this.deps.hero.attachTo(army);
        this.deps.ensureUnpaused();
        this.deps.kickLegionAi(army.id);
        this.deps.feed?.pushExpedition?.({ legionName: army.name, cityName: target.name, kind: 'depart' });
        this.deps.notify(`🐎 随${g.generalName}出征【${target.name}】`);
        gameLog('expedition', `[玩家] 出征任务：${g.generalName} 率 ${army.name} 自 ${city.name} 远征 ${target.name}`);
        this.emitChange();
    }

    // ── 跟踪 ──────────────────────────────────────────────
    public tick(): void {
        // [2026-09-05 玩家] 自动模式：空闲（无任务、未入伍、未行军）时自动选据点前往
        if (this.deps.hero.autoMode && !this.quest && !this.deps.hero.isAttached() && !this.deps.hero.isTraveling()) {
            this.autoTravelToBestCity();
        }
        const q = this.quest;
        if (!q) return;

        // 🔴 [2026-09-11 主人定 A 方案] 剧本任务：**完成判定看剧本真实进度**，
        //    不看"某座城归我方了"（剧本军的航点城本来就不该被攻占）。
        if (q.scriptObjective) {
            if (!GameConfig.SYSTEM.ENABLE_SCRIPT_EVENTS) {
                this.quest = null;
                this.emitChange();
                return;
            }
            const obj = this.deps.getScriptObjective?.(q.legionId) ?? null;
            if (obj?.done) {
                this.finishQuest(true);
                return;
            }
            const army0 = this.deps.legionManager.getLegionById(q.legionId);
            if (!army0 || army0.isDestroyed || army0.getTroops() <= 0) {
                this.finishQuest(false);
            }
            return;
        }

        const target = this.deps.cityManager.getCity(q.targetCityId);
        if (target && target.factionId === q.factionId) {
            this.finishQuest(true);
            return;
        }
        const army = this.deps.legionManager.getLegionById(q.legionId);
        if (!army || army.isDestroyed || army.getTroops() <= 0) {
            this.finishQuest(false);
        }
    }

    /**
     * 自动选据点前往：优先「名将 + 双行」武将的势力据点，同分随机取一个。
     *
     * 🔴 [2026-09-11 主人定「自动模式打开，玩家 -334 年要去找亚历山大接任务」]
     *    当年若有剧本事件 → **无条件优先去剧本主角那座城**：压过"兵最多/名将/双行"排序，
     *    也压过「就近寻将」开关——剧本任务是硬要求，不是可选项。
     *    主角已率军出征时无需另写逻辑：下面既有的「认人不认城」分支会就地转成追出城。
     *    没有剧本的年份 → 完全退回原有排序，行为一字不变。
     */
    private autoTravelToBestCity(): void {
        const city = this.pickScriptTargetCity() ?? this.pickAutoCity();
        if (!city) return;
        const g = getCityAnchoredGeneral(city.id);
        const army = g ? this.armyOfGeneral(g.generalId) : null;
        if (army) {
            // 人不在城中 → 直接去野外找他（PlayerHero.stepChase 每帧续航）
            this.chaseCityId = city.id;
            if (this.deps.hero.travelToArmy(army.id, g!.generalName)) {
                this.deps.notify(`🐎 ${g!.generalName}已率军在外，前往其军中相见`);
                return;
            }
        }
        this.chaseCityId = null;
        this.deps.hero.travelToCity(city.id);
    }

    /**
     * 当年剧本主角所在的城（当年无剧本事件 → null）。
     * 只回答"该去哪座城"；主角在不在城中由 `autoTravelToBestCity` 的既有分支处理。
     */
    private pickScriptTargetCity(): City | null {
        if (!GameConfig.SYSTEM.ENABLE_SCRIPT_EVENTS) return null;
        const cityId = getScriptProtagonistCityId(this.deps.getYear());
        if (!cityId) return null;
        return this.deps.cityManager.getCity(cityId) ?? null;
    }

    /** 追击中的那位武将的**本城**（会面后谈事仍以这座城的势力/目标为准） */
    private chaseCityId: string | null = null;

    /**
     * 🔴 [2026-09-09 主人定] 在野外追上了带兵的武将：直接谈随军。
     * 与城中对话的区别只有一个 —— **不用起兵**，那支军团已经在打仗了，直接入伍即可。
     */
    public onMeetArmy(army: Army): void {
        const hero = this.deps.hero;
        if (hero.isAttached() || this.quest) return;
        const cityId = this.chaseCityId;
        this.chaseCityId = null;
        const city = cityId ? this.deps.cityManager.getCity(cityId) : null;
        const gid = army.generalId;
        if (!city || !gid) return;
        const rec = getGeneralRecordByGeneralId(gid);
        const generalName = rec?.generalName ?? '将军';
        const factionId = army.getFactionId() || city.factionId;
        const factionName = this.deps.cityManager.getFactionName(factionId);
        const portrait = resolveGeneralPortraitPath(rec?.portrait ?? '', {
            factionId,
            region: getCityRegion(city),
        });
        const targetId = army.expeditionTargetCityId ?? army.siegeTargetCityId ?? army.getTargetCity()?.id ?? null;
        const target = targetId ? this.deps.cityManager.getCity(targetId) : null;
        const targetName = target?.name ?? '前方敌城';
        // 🔴 [2026-09-11 主人定 A 方案] 剧本主角军团：说真历史目标，不说"攻某城"
        const scriptObj = this.deps.getScriptObjective?.(army.id) ?? null;
        const goalText = scriptObj ? scriptObj.label : `往【${targetName}】`;
        const eliteName = getCityEliteLegionName(city.id) ?? `${generalName}部`;
        this.deps.showDialogue({
            speaker: generalName,
            portrait,
            factionName,
            text: scriptObj
                ? `壮士竟寻到军中来了。某正提兵${scriptObj.label}，军旅之中不便设宴。`
                    + `壮士若不嫌鞍马劳顿，便随某同去。`
                : `壮士竟寻到军中来了。某正提兵往【${targetName}】，军旅之中不便设宴。`
                    + `壮士若不嫌鞍马劳顿，便随某同去，克城之日当以「${eliteName}」之战法相授。`,
            options: [
                { label: scriptObj ? `⚔ 就此随军（${scriptObj.label}）` : `⚔ 就此随军【${targetName}】`, accent: true, onPick: () => this.joinMarchingArmy(city, army, generalName, eliteName) },
                { label: '告辞', onPick: () => this.deps.closeDialogue() },
            ],
        });
    }

    /** 野外会面后入伍：军团现成的，不起兵，其余与 startCampaign 同口径 */
    private joinMarchingArmy(city: City, army: Army, generalName: string, eliteName: string): void {
        this.deps.closeDialogue();
        const factionId = army.getFactionId() || city.factionId;
        const factionName = this.deps.cityManager.getFactionName(factionId);
        const targetId = army.expeditionTargetCityId ?? army.siegeTargetCityId ?? army.getTargetCity()?.id ?? null;
        const target = targetId ? this.deps.cityManager.getCity(targetId) : null;
        // 🔴 [2026-09-11 主人定 A 方案] 剧本主角军团：走真历史目标，**不再要求它有"目标城"**
        //    （剧本军的 expeditionTargetCityId 只是行军航点，引擎那套会当成"要攻占的城"；
        //      没有它时原来直接一句"所部暂无战事"把玩家挡在门外 —— 剧本军必须能入伍。）
        const scriptObj = this.deps.getScriptObjective?.(army.id) ?? null;
        if (!target && !scriptObj) {
            this.deps.notify(`${generalName}所部暂无战事，另寻他人`);
            return;
        }
        const unitKey = this.mainUnitKeyOf(factionId, army.generalId ?? '');
        this.quest = {
            kind: 'campaign',
            cityId: city.id,
            cityName: city.name,
            factionId,
            factionName,
            generalId: army.generalId ?? '',
            generalName,
            legionId: army.id,
            targetCityId: target?.id ?? city.id,
            targetCityName: target?.name ?? scriptObj?.label ?? city.name,
            reward: unitKey ? { name: eliteName, unitKey } : undefined,
            scriptObjective: scriptObj ? { label: scriptObj.label } : undefined,
        };
        this.deps.hero.joinFaction(factionId);
        this.deps.hero.attachTo(army);
        this.deps.ensureUnpaused();
        this.deps.kickLegionAi(army.id);
        const goal = scriptObj ? scriptObj.label : `同征【${target?.name ?? '前方敌城'}】`;
        this.deps.notify(`🐎 于军中投${generalName}，${goal}`);
        gameLog('expedition', `[玩家] 野外入伍：${generalName} 部 ${army.name} → ${goal}`);
        this.emitChange();
    }

    /** 两点球面距离（公里），只用来在同档候选里比远近，不需要高精度。 */
    private static distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
        const R = 6371;
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLng = (b.lng - a.lng) * Math.PI / 180;
        const la = a.lat * Math.PI / 180, lb = b.lat * Math.PI / 180;
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    }

    /** 遍历据点，找城中武将在（未率军在外）的。
     *  🔴 [2026-09-09 主人定]「**必须**选兵多的、**必须**选名将、**必须**选双行」
     *     —— 这三条是**硬条件，不因为距离而降级**。所以顺序是：
     *       ① 先用 compareGeneralsByPriority 排出最优档（兵最多→名将→双行→擅攻）；
     *       ② **只在与第一名完全同档的候选里**，挑离玩家最近的那个。
     *     绝不能反过来先按距离分圈再挑将——那样近处没名将时就会选到次优的，
     *     等于把「必须」降成了「优先」。 */
    /** 这位武将此刻带着的军团（在外行军中）；没带兵就返回 null = 人在城里 */
    private armyOfGeneral(generalId: string): Army | null {
        return this.deps.legionManager.getArmies().find(
            (a) => !a.isDestroyed && a.getTroops() > 0 && a.generalId === generalId,
        ) ?? null;
    }

    private pickAutoCity(): City | null {
        const candidates: City[] = [];
        for (const c of this.deps.cityManager.getCities()) {
            if (!c.factionId) continue;
            const g = getCityAnchoredGeneral(c.id);
            if (!g) continue;
            // 🔴 [2026-09-09 主人定] 不再排除「已率军在外」的武将 —— 人不在城里就去野外找他。
            //    原来这里 `if (away) continue`，于是玩家赶到城里扑空、当场换目标，反复空跑。
            // 🔴 [2026-09-11 主人定] 不要选 1 万人以下的（兵力不足 1 万的据点直接排除）
            if ((c.troops || 0) < 10000) continue;
            candidates.push(c);
        }
        if (!candidates.length) return null;

        // ① [2026-09-05 主人定] 与军团出征共用同一套选将优先级（compareGeneralsByPriority）
        const sorted = [...candidates].sort((a, b) => compareGeneralsByPriority(
            { troops: a.troops || 0, cityId: a.id },
            { troops: b.troops || 0, cityId: b.id },
        ));
        const best = sorted[0];
        if (!best) return null;

        // ② 取出与第一名**完全同档**的那一批：compareGeneralsByPriority 在四项判据都打平时
        //    返回 Math.random()-0.5（随机数），不能直接拿它判等 —— 必须逐项比对。
        const keyOf = (c: City) => {
            const g = getCityAnchoredGeneral(c.id);
            const p = g ? getGeneralProfile(g.generalId) : null;
            return `${c.troops || 0}|${p ? (p.tier === 'famous' ? 1 : 0) : -1}|${p?.attackStyle ?? '-'}`;
        };
        const bestKey = keyOf(best);
        const tied = sorted.filter((c) => keyOf(c) === bestKey);
        if (tied.length === 1) return best;

        // ③ 同档之间怎么挑，由玩家面板的「就近寻找武将」开关决定（PlayerHero.nearbyFirst）
        //    · 关（默认）→ **随机**：主人实测就近会把玩家永久锁在出生地周边，
        //      因为开局全图据点兵力都是 10000，「兵最多」筛不掉任何城，同档集合极大。
        //    · 开 → 挑最近的，省赶路时间。
        //    ⚠️ 随机必须在这里显式取，别指望 sort 的随机比较器——那个只是打平时返回
        //      Math.random()-0.5，比较器不自洽，排出来的第一名不是均匀随机。
        if (!this.deps.hero.nearbyFirst) {
            return tied[Math.floor(Math.random() * tied.length)] ?? best;
        }
        const me = this.deps.hero.getPosition();
        if (!me || typeof me.lat !== 'number') return best;
        let pick = tied[0];
        let pickD = Infinity;
        for (const c of tied) {
            const d = PlayerQuestSystem.distKm(me, { lat: c.latitude, lng: c.longitude });
            if (d < pickD) { pickD = d; pick = c; }
        }
        return pick;
    }

    private onHostLost(_lastId: string): void {
        // 🔴 [2026-09-08 主人报障「军团覆灭，留在原地……不继续自动，我在面板中开着自动呢」]
        //    改前：没有任务时**只发一句提示，不 detach**。而 PlayerHero.update 的覆灭分支
        //    故意不清 hostLegionId（指望 onHostLost → finishQuest → detach 统一清场），
        //    于是「任务已成功、之后军团才覆灭」这条路上 detach 永远不来 ——
        //    玩家被钉在一支死军团上：每帧重入覆灭分支、travelToCity 因 hostLegionId 还在而拒绝，
        //    tick() 里自动模式的条件 !isAttached() 也永远不成立 → 自动不触发。
        //    现在无论有没有任务，一律先解绑；位置不动（玩家就留在军团覆灭的地方）。
        if (this.quest) {
            this.finishQuest(false);
        } else {
            this.deps.hero.detach();
        }
    }

    private finishQuest(success: boolean): void {
        const q = this.quest;
        if (!q) return;
        this.quest = null;
        const hero = this.deps.hero;
        // [2026-09-05 玩家] 任务成功不 detach：玩家继续跟着军团，直到军团解散才恢复自由。
        // 只有任务失败（军团解散）才 detach。
        if (!success) {
            hero.resetMerit('随军任务失败');
            hero.detach();
            // 🔴 [2026-09-08 主人改口] 原先这里「战败即关闭自动模式」，主人当日又提：
            //    「不继续自动，我在面板中开着自动呢」—— 面板开着自动就该继续找下一支军团，
            //    不许代他把开关关掉。已删除自动关闭；要停自动，玩家自己在面板里取消勾选。
            //    （detach() 已解绑军团，tick() 下一帧就会重新触发 autoTravelToBestCity。）
        }
        if (success) {
            if (q.kind === 'restore') {
                hero.addMerit(600);
                this.deps.feed?.pushRestoration?.({ factionId: q.factionId, cityName: q.cityName });
                this.deps.notify(`🚩 【${q.cityName}】光复，${q.factionName}复国成功！赏大功 600`);
                gameLog('expedition', `[玩家] 复国成功：${q.cityName} → ${q.factionName}，奖战功 600`);
            } else if (q.scriptObjective) {
                // 🔴 [2026-09-11 主人定 A 方案] 剧本任务：措辞是"抵达/完成历史目标"，不是"攻克某城"
                const label = q.scriptObjective.label;
                hero.addMerit(400);
                if (q.reward) {
                    const learned = hero.learnElite({
                        name: q.reward.name,
                        unitKey: q.reward.unitKey,
                        factionId: q.factionId,
                        factionName: q.factionName,
                    });
                    this.deps.notify(learned
                        ? `🚩 ${label} 达成，学会精锐战法「${q.reward.name}」，赏大功 400`
                        : `🚩 ${label} 达成（「${q.reward.name}」已会），赏大功 400`);
                } else {
                    this.deps.notify(`🚩 ${label} 达成，赏大功 400`);
                }
                gameLog('expedition', `[玩家] 剧本目标达成：${label}，奖战功 400`);
            } else {
                hero.addMerit(400);
                this.deps.feed?.pushExpedition?.({ legionName: q.generalName, cityName: q.targetCityName, kind: 'success' });
                if (q.reward) {
                    const learned = hero.learnElite({
                        name: q.reward.name,
                        unitKey: q.reward.unitKey,
                        factionId: q.factionId,
                        factionName: q.factionName,
                    });
                    this.deps.notify(learned
                        ? `🚩 攻克【${q.targetCityName}】，学会精锐战法「${q.reward.name}」，赏大功 400`
                        : `🚩 攻克【${q.targetCityName}】（「${q.reward.name}」已会），赏大功 400`);
                } else {
                    this.deps.notify(`🚩 攻克【${q.targetCityName}】，赏大功 400`);
                }
                gameLog('expedition', `[玩家] 出征成功：${q.targetCityName}，奖励 ${q.reward?.name ?? '无'}，奖战功 400`);
            }
        } else {
            this.deps.notify(q.kind === 'restore'
                ? `❌ 义军解散，${q.factionName}复国失败`
                : q.scriptObjective
                    ? `❌ ${q.scriptObjective.label} 中断，军团解散`
                    : `❌ 出征【${q.targetCityName}】失败，军团解散`);
            gameLog('expedition', `[玩家] 任务失败：${q.kind} ${q.scriptObjective?.label ?? q.targetCityName}`);
        }
        this.emitChange();
    }

    /** 玩家主动离队：任务作废（军团照旧由 AI 打完） */
    public leaveHost(): void {
        const hero = this.deps.hero;
        if (!hero.isAttached()) return;
        const q = this.quest;
        this.quest = null;
        hero.detach();
        this.deps.notify(q ? `离队，放弃任务【${q.targetCityName}】` : '离队');
        this.emitChange();
    }

    public clearForRestore(): void {
        this.quest = null;
        this.emitChange();
    }

    public dispose(): void {
        if (this.timer != null) window.clearInterval(this.timer);
        this.timer = null;
    }
}
