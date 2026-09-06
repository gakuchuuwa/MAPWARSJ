/**
 * PlayerQuestSystem —— 据点对话与两层任务（2026-09-05 主人定）。
 *
 * 抵达据点 → 看城中武将在不在（据点锚定武将，且此刻没随军在外）→ 对话：
 *   第一层：据点不是原势力的 → 武将（遗臣）请玩家助其复国。同意 → 遗臣起兵 2 万（本城精锐+本将）
 *           围攻本城，玩家入伍随军；城归原势力即复国成功。
 *   第二层：据点仍是原势力的 → 武将请玩家随他出征一座据点（沿路网最近的敌城）。同意 → 起兵 2 万远征；
 *           占领目标后玩家学会该势力的主力精锐兵种（可选一支带进战术模式）。
 *
 * 军团一律走现成远征机制（expeditionTargetCityId + 行为树），本系统只发令、跟踪结果、收尾。
 */
import type { Army } from '../legion/Army';
import type { City } from '../types/core';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getCityEliteLegionName } from '../data/ExpeditionLegions';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { compareGeneralsByPriority } from '../data/generalSelection';
import { getFactionCompositionSlots } from '../types/CultureFormations';
import { resolveGeneralPortraitPath } from '../config/portrait_defaults';
import { getCityRegion } from '../systems/RegionSystem';
import { markSpawnTierConsumed } from '../legion/LegionSpawnTier';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';
import type { PlayerHero } from './PlayerHero';
import { PLAYER_QUEST_LEGION_TROOPS, PLAYER_QUEST_TARGET_MAX_HOPS } from './PlayerConfig';

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
            this.deps.notify(anchored
                ? `抵达【${city.name}】：${anchored.generalName}已率军在外，城中无将`
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
        const army = this.deps.legionManager.createLegion(
            { lat: city.latitude, lng: city.longitude },
            PLAYER_QUEST_LEGION_TROOPS,
            factionId,
            eliteName,
            undefined,
            undefined,
            city.id,
            general.generalId,
            true,
        );
        if (!army || !this.deps.legionManager.getLegionById(army.id)) return null;
        army.setTroops(PLAYER_QUEST_LEGION_TROOPS);
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

    /** 自动选据点前往：优先「名将 + 双行」武将的势力据点，同分随机取一个 */
    private autoTravelToBestCity(): void {
        const city = this.pickAutoCity();
        if (city) this.deps.hero.travelToCity(city.id);
    }

    /** 遍历据点，找城中武将在（未率军在外）的，按「兵最多→名将→双行→擅攻」排序取第一个，同档随机（与军团出征一致） */
    private pickAutoCity(): City | null {
        const candidates: City[] = [];
        for (const c of this.deps.cityManager.getCities()) {
            if (!c.factionId) continue;
            const g = getCityAnchoredGeneral(c.id);
            if (!g) continue;
            const away = this.deps.legionManager.getArmies().some(
                (a) => !a.isDestroyed && a.getTroops() > 0 && a.generalId === g.generalId,
            );
            if (away) continue;
            candidates.push(c);
        }
        if (!candidates.length) return null;
        // [2026-09-05 主人定] 与军团出征共用同一套选将优先级（compareGeneralsByPriority）
        candidates.sort((a, b) => compareGeneralsByPriority(
            { troops: a.troops || 0, cityId: a.id },
            { troops: b.troops || 0, cityId: b.id },
        ));
        return candidates[0];
    }

    private onHostLost(_lastId: string): void {
        if (this.quest) this.finishQuest(false);
        else this.deps.notify('所在军团已覆灭，你独自留在原地');
    }

    private finishQuest(success: boolean): void {
        const q = this.quest;
        if (!q) return;
        this.quest = null;
        const hero = this.deps.hero;
        // [2026-09-05 玩家] 任务成功不 detach：玩家继续跟着军团，直到军团覆灭才恢复自由。
        // 只有任务失败（军团覆灭）才 detach。
        if (!success) {
            hero.resetMerit('随军任务失败');
            hero.detach();
        }
        if (success) {
            if (q.kind === 'restore') {
                hero.addMerit(600);
                this.deps.feed?.pushRestoration?.({ factionId: q.factionId, cityName: q.cityName });
                this.deps.notify(`🚩 【${q.cityName}】光复，${q.factionName}复国成功！赏大功 600`);
                gameLog('expedition', `[玩家] 复国成功：${q.cityName} → ${q.factionName}，奖战功 600`);
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
                ? `❌ 义军覆灭，${q.factionName}复国失败`
                : `❌ 出征【${q.targetCityName}】失败，军团覆灭`);
            gameLog('expedition', `[玩家] 任务失败：${q.kind} ${q.targetCityName}`);
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
