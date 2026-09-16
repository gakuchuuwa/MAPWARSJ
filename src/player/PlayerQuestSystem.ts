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
import { WAR_TYPES } from '../data/WarTypes';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { GameConfig } from '../config/GameConfig';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { comparePlayerGeneralsByPriority } from '../data/generalSelection';
import { getFactionCompositionSlots } from '../types/CultureFormations';
import { resolveGeneralPortraitPath } from '../config/portrait_defaults';
import { getCityRegion } from '../systems/RegionSystem';
import { markSpawnTierConsumed } from '../legion/LegionSpawnTier';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';
import type { PlayerHero } from './PlayerHero';
import { PLAYER_QUEST_TARGET_MAX_HOPS } from './PlayerConfig';
import { BATTLEFIELDS, type BattlefieldData } from '../data/Battlefields';
import { isBattlefieldFought } from '../events/battlefieldState';
import { journeyBriefingDuration, journeyBriefingParagraphs } from './JourneyBriefing';

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
    notify: (msg: string, durationMs?: number) => void | (() => void);
    /**
     * 🔴 [2026-09-16 主人定]「字幕显示在下面」——赶路背景解说走**画面下方的字幕条**，
     * 不走上方那个 toast（那是到达/入伍/报错的操作提示，两者不能混）。
     */
    subtitle?: (text: string, durationMs?: number) => void | (() => void);
    kickLegionAi: (armyId: string) => void;
    ensureUnpaused: () => void;
    feed?: {
        pushRestoration?(p: { factionId: string; cityName: string }): void;
        pushExpedition?(p: { legionName: string; cityName: string; kind: 'depart' | 'success' }): void;
    };
    /** 当前游戏年份（负 = 公元前）。 */
    getYear: () => number;
    /**
     * 🔴 [2026-09-14 主人定] 战场玩法的接口（只用得着这三个，不整个 import 管理器免得绕成循环依赖）。
     */
    battlefields?: {
        checkReady(bfId: string, playerPos?: { lat: number; lng: number }): string | null;
        /** 战场坐标（玩家赶路用；战场不是据点，不在路网里） */
        locate(bfId: string): { lat: number; lng: number } | null;
        findBattle(bfId: string): { attackerFactionId: string; defenderFactionId: string;
            attackerGeneralId?: string; defenderGeneralId?: string; title?: string;
            attackerSourceCityId?: string; defenderSourceCityId?: string } | null;
        start(bfId: string,
            onSpawned: (sides: { attacker: Army; defender: Army }) => void,
            onFinished: (sides: { attacker: Army; defender: Army }) => void): string | null;
    };
}

const TICK_MS = 400;
/** 战场寻路失败后的重试冷却，避免每 tick 重试刷屏并打断行程 */
const BF_RETRY_COOLDOWN_MS = 60_000;

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

    /**
     * 获取战场的战役标准名称（统一为【XXX战役】或【XXX围城战】）
     * 🔴 [2026-09-16 主人定]「战场名称要写为XXX战役」
     */
    public getBattlefieldBattleTitle(bfId: string, fallbackName?: string): string {
        const fb = this.deps.battlefields?.findBattle(bfId);
        if (fb?.title) return fb.title;
        const bf = BATTLEFIELDS.find((b) => b.id === bfId);
        const name = fallbackName ?? bf?.name ?? '历史战役';
        if (name.endsWith('战役') || name.endsWith('围城战')) return name;
        return `${name}战役`;
    }

    /**
     * 🔴 [2026-09-14 主人定] 点击战场 → 打这一场真实战役。
     *
     * 主人的规矩逐条落在这里：
     *   ·「玩家要抵达战场才能触发」→ 先按玩家当前位置查距离，没到就只告诉他还差多远。
     *   ·「必须是武将在城」「一个战场只能打一次」→ 交给 checkReady 统一裁决。
     *   ·「玩家可以选择加入哪一方」→ 双方各一个选项，另给一个只看不打的选项。
     *   ·「战场名称要写为XXX战役」（2026-09-16 主人定）
     */
    public onBattlefieldClicked(bfId: string, bfName: string): void {
        const bfApi = this.deps.battlefields;
        if (!bfApi) return;
        if (this.deps.hero.isAttached()) {
            this.deps.notify('你正在军中，随军出征，军团解散前不可另投一方');
            return;
        }
        const battleTitle = this.getBattlefieldBattleTitle(bfId, bfName);

        // 先看「能不能打」里与距离无关的那些（打过了 / 主帅在外 / 已有战事）
        const hardBlock = bfApi.checkReady(bfId, undefined);
        if (hardBlock) { this.deps.notify(hardBlock); return; }

        // 没到战场 → 不是报错，是**自动赶过去**，到了再弹选边（主人：玩家要抵达战场才能触发）
        const far = bfApi.checkReady(bfId, this.deps.hero.getPosition());
        if (far) {
            const pos = bfApi.locate(bfId);
            if (!pos) { this.deps.notify(far); return; }
            this.deps.notify(`${far}，正赶往【${battleTitle}】`);
            const ok = this.deps.hero.travelToPoint(pos, battleTitle, () => this.onBattlefieldClicked(bfId, battleTitle));
            const bf = BATTLEFIELDS.find(b => b.id === bfId);
            if (ok && bf) this.startJourneyBriefing(bf);
            return;
        }

        const fb = bfApi.findBattle(bfId);
        if (!fb) { this.deps.notify(`【${battleTitle}】还没有配战役数据`); return; }

        const atkName = this.deps.cityManager.getFactionName(fb.attackerFactionId);
        const defName = this.deps.cityManager.getFactionName(fb.defenderFactionId);
        const atkGeneral = fb.attackerGeneralId
            ? getGeneralRecordByGeneralId(fb.attackerGeneralId)?.generalName ?? atkName : atkName;
        const defGeneral = fb.defenderGeneralId
            ? getGeneralRecordByGeneralId(fb.defenderGeneralId)?.generalName ?? defName : defName;

        const join = (side: 'attacker' | 'defender' | null) => {
            this.deps.closeDialogue();
            // 先结束选边暂停，再开战；开战后战术场景会接管暂停，不能再解除，
            // 否则引擎已冻结而 GameAppLoop 不走战术 tick，画面会停在大地图。
            this.deps.ensureUnpaused();
            const msg = bfApi.start(
                bfId,
                ({ attacker, defender }) => {
                    if (!side) return;   // 只观战
                    const host = side === 'attacker' ? attacker : defender;
                    this.deps.hero.joinFaction(side === 'attacker' ? fb.attackerFactionId : fb.defenderFactionId);
                    this.deps.hero.attachTo(host);
                    this.deps.notify(`⚔ 你加入${side === 'attacker' ? atkName : defName}，随${side === 'attacker' ? atkGeneral : defGeneral}出战`);
                },
                () => {
                    if (!side) return;   // 只观战：没参战，不授战法
                    // 🔴 [2026-09-14 主人定]「无论谁赢，玩家可以获得一个兵模，然后继续找其他势力。」
                    //    奖的是**所投那一方**的主力兵种，与胜负无关 —— 亲历此役即得其战法。
                    const joinedFaction = side === 'attacker' ? fb.attackerFactionId : fb.defenderFactionId;
                    const joinedGeneral = (side === 'attacker' ? fb.attackerGeneralId : fb.defenderGeneralId) ?? '';
                    const sourceCityId = side === 'attacker' ? fb.attackerSourceCityId : fb.defenderSourceCityId;
                    const unitKey = this.mainUnitKeyOf(joinedFaction, joinedGeneral);
                    if (unitKey) {
                        // 番号优先取出兵那座城的精锐番号，没有就用兵种本名
                        const eliteName = (sourceCityId ? getCityEliteLegionName(sourceCityId) : null)
                            ?? WAR_TYPES[unitKey]?.name ?? unitKey;
                        const learned = this.deps.hero.learnElite({
                            name: eliteName,
                            unitKey,
                            factionId: joinedFaction,
                            factionName: this.deps.cityManager.getFactionName(joinedFaction),
                        });
                        this.deps.notify(learned
                            ? `⚔ 【${battleTitle}】战毕，习得「${eliteName}」之战法`
                            : `⚔ 【${battleTitle}】战毕（「${eliteName}」已会）`);
                    }
                    // 战后双方军团会撤场（见 withdrawBattlefieldLegions）。玩家若还挂在上面，
                    // 军团一没就成了"随一支不存在的军团"，所以这里把他放回单骑，好去找下一家。
                    if (this.deps.hero.isAttached()) {
                        this.deps.hero.detach();
                        this.deps.notify('解甲归为单骑，可另寻他处');
                    }
                    this.emitChange();
                },
            );
            if (msg) { this.deps.notify(msg); return; }
        };

        this.deps.showDialogue({
            speaker: battleTitle,
            portrait: null,
            factionName: battleTitle,
            text: `${atkName}【${atkGeneral}】与${defName}【${defGeneral}】将于此地会战。`
                + `壮士既已亲临，可自择一方效力，亦可袖手旁观。`,
            options: [
                { label: `⚔ 助${atkName}（${atkGeneral}）`, accent: true, onPick: () => join('attacker') },
                { label: `🛡 助${defName}（${defGeneral}）`, onPick: () => join('defender') },
                { label: '👁 只在旁观战', onPick: () => join(null) },
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

    /**
     * 寻找下一个待触发的历史战场：
     * 1. 发生年份已到（bf.scriptYear <= currentYear）
     * 2. 战场未打过（!isBattlefieldFought(bf.id)）
     * 按发生年份由先到后排序（-334 -> -333 -> -332 -> -331...）
     */
    public findNextAvailableBattlefield(): { bf: BattlefieldData; title: string } | null {
        const bfApi = this.deps.battlefields;
        if (!bfApi) return null;
        const currentYear = this.deps.getYear();

        const available = BATTLEFIELDS
            .filter((bf) => bf.scriptYear <= currentYear && !isBattlefieldFought(bf.id))
            .sort((a, b) => a.scriptYear - b.scriptYear);

        if (!available.length) return null;
        const nextBf = available[0];
        const title = this.getBattlefieldBattleTitle(nextBf.id, nextBf.name);
        return { bf: nextBf, title };
    }

    /**
     * 检查并自动引导玩家前往下一个历史战场：
     * 🔴 [2026-09-16 主人定]
     * 「如果玩家没有加入势力，就优先参加去战场，触发战争事件。游戏开始是-334年，就去格拉尼库斯河战役。
     *   战场名称要写为XXX战役。打完后如果时间没到-333年就先去找武将加入势力乱斗，如果时间到了-333年就接着去下一个战场。
     *   同理-332年也是如此。如果玩家加入了势力后，就不在触发战场事件，是跟着武将走，直至玩家离开势力，
     *   先看时间触发战场时间，然后再去找武将乱斗。」
     */
    private checkAndTriggerNextBattlefield(): boolean {
        const next = this.findNextAvailableBattlefield();
        if (!next) return false;

        const { bf, title } = next;
        const bfApi = this.deps.battlefields;
        if (!bfApi) return false;

        // 已经在前往该战场的路上，继续行军
        if (this.deps.hero.getTravelPointLabel() === title) {
            return true;
        }

        // 上次寻路失败还在冷却里：不打断当前行程，先让玩家去找武将乱斗
        const now = Date.now();
        if (now < (this.bfRetryAfter.get(bf.id) ?? 0)) return false;

        const pos = bfApi.locate(bf.id) ?? { lat: bf.lat, lng: bf.lng };
        this.chaseCityId = null;
        this.deps.hero.cancelChase();
        this.deps.hero.cancelTravel();

        const ok = this.deps.hero.travelToPoint(pos, title, () => {
            this.onBattlefieldClicked(bf.id, title);
        });

        if (ok) {
            this.bfRetryAfter.delete(bf.id);
            this.deps.notify(`🐎 奔赴【${title}】`);
            this.startJourneyBriefing(bf);
            return true;
        }
        // 寻路失败（无路可达/正在军中）→ 冷却 60 秒再试，期间走找武将那条路
        this.bfRetryAfter.set(bf.id, now + BF_RETRY_COOLDOWN_MS);
        return false;
    }

    /**
     * 🔴 [2026-09-16 主人定] 赶路背景播报：玩家**在奔赴战场的路上**逐段播这场仗的背景。
     * 空行分段，按各段字数保留阅读时间；抵达、改道或入伍时停止。
     * 同一个战场只播一次（`briefedBattlefields`），中途改道或再次触发都不重播。
     */
    private startJourneyBriefing(bf: BattlefieldData): void {
        const text = bf.briefing?.trim();
        if (!text) return;
        if (this.briefedBattlefields.has(bf.id)) return;
        this.briefedBattlefields.add(bf.id);

        const paragraphs = journeyBriefingParagraphs(text);
        if (!paragraphs.length) return;

        this.clearJourneyBriefing();
        let i = 0;
        let nextAt = 0;
        let dismiss: void | (() => void);
        const title = this.getBattlefieldBattleTitle(bf.id, bf.name);
        const pushNext = () => {
            // 玩家已经不在赶这个战场的路上（改道/入伍/到了）→ 停播，别追着他念
            if (!this.deps.hero.isTraveling() || this.deps.hero.isAttached()
                || this.deps.hero.getTravelPointLabel() !== title) {
                if (typeof dismiss === 'function') dismiss();
                this.clearJourneyBriefing();
                return;
            }
            if (Date.now() < nextAt) return;
            if (i >= paragraphs.length) {
                this.clearJourneyBriefing();
                return;
            }
            const duration = journeyBriefingDuration(paragraphs[i]);
            // 历史直播的解说字幕：优先走下方字幕条，没接线才回落到 toast
            dismiss = (this.deps.subtitle ?? this.deps.notify)(paragraphs[i], duration);
            nextAt = Date.now() + duration;
            i++;
        };
        this.briefingTimer = window.setInterval(pushNext, 250);
        pushNext();   // 第一段立刻出，别让玩家先干等
    }

    private clearJourneyBriefing(): void {
        if (this.briefingTimer !== null) {
            window.clearInterval(this.briefingTimer);
            this.briefingTimer = null;
        }
    }

    // ── 跟踪 ──────────────────────────────────────────────
    public tick(): void {
        // 🔴 [2026-09-16 主人定]
        // 玩家未加入势力（未入伍、无任务）时：
        // 优先前往历史战场触发战役事件；
        // 若当前年份无可用战场，且未在行军，才去找武将加入势力乱斗；
        // 若玩家已加入势力（isAttached），则全程跟随武将，不触发战场事件。
        if (this.deps.hero.autoMode && !this.quest && !this.deps.hero.isAttached()) {
            const headingToBattlefield = this.checkAndTriggerNextBattlefield();
            if (!headingToBattlefield && !this.deps.hero.isTraveling()) {
                this.autoTravelToBestCity();
            }
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

    /**
     * 自动选据点前往：判据只有「兵多 → 名将」两条，同档随机/就近取一个。
     * 🔴 [2026-09-15 主人定]「玩家找武将，改为兵多、名将。去掉其他的条件。」
     * [2026-09-14] 原有的「当年剧本主角优先」已随剧本系统一并删除。
     */
    private autoTravelToBestCity(): void {
        const city = this.pickAutoCity();
        if (!city) return;
        this.rememberVisit(city);
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

    /** 追击中的那位武将的**本城**（会面后谈事仍以这座城的势力/目标为准） */
    private chaseCityId: string | null = null;
    /**
     * 战场寻路失败的冷却表：bfId -> 在此时间戳之前不再重试。
     * tick 每 400ms 跑一次，若不记冷却，无路可达的战场会每秒 2.5 次
     * 打断玩家去找武将的行程并重复弹「无路可达」，把玩家钉死在原地。
     */
    private bfRetryAfter = new Map<string, number>();
    /** 已经播过赶路背景的战场：同一个战场只播一次，改道或再次触发都不重播 */
    private briefedBattlefields = new Set<string>();
    private briefingTimer: number | null = null;

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
        const goalText = `往【${targetName}】`;
        const eliteName = getCityEliteLegionName(city.id) ?? `${generalName}部`;
        this.deps.showDialogue({
            speaker: generalName,
            portrait,
            factionName,
            text: `壮士竟寻到军中来了。某正提兵往【${targetName}】，军旅之中不便设宴。`
                + `壮士若不嫌鞍马劳顿，便随某同去，克城之日当以「${eliteName}」之战法相授。`,
            options: [
                { label: `⚔ 就此随军【${targetName}】`, accent: true, onPick: () => this.joinMarchingArmy(city, army, generalName, eliteName) },
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
        if (!target) {
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
            targetCityName: target?.name ?? city.name,
            reward: unitKey ? { name: eliteName, unitKey } : undefined,
        };
        this.deps.hero.joinFaction(factionId);
        this.deps.hero.attachTo(army);
        this.deps.ensureUnpaused();
        this.deps.kickLegionAi(army.id);
        const goal = `同征【${target?.name ?? '前方敌城'}】`;
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
     *  🔴 [2026-09-15 主人定]「玩家找武将，改为**兵多、名将**。去掉其他的条件。」
     *     判据只剩两条，攻防风格（双行/擅攻）**完全不参与**。顺序是：
     *       ① 先用 comparePlayerGeneralsByPriority 排出最优档（兵最多→名将）；
     *       ② **只在与第一名完全同档的候选里**，按面板开关决定随机还是就近。
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

        // ① [2026-09-15 主人定]「兵多、名将，去掉其他的条件」→ 玩家专用两条判据比较器。
        //    ⚠️ 不再用 compareGeneralsByPriority（那套含双行/擅攻，仍归军团出征用）。
        const sorted = [...candidates].sort((a, b) => comparePlayerGeneralsByPriority(
            { troops: a.troops || 0, cityId: a.id },
            { troops: b.troops || 0, cityId: b.id },
        ));
        const best = sorted[0];
        if (!best) return null;

        // ② 取出与第一名同档的那一批（🔴 [2026-09-15 方案A 主人定]）：
        //    不要用 troops 绝对数值判定同档，改为梯队容差：
        //    驻军差在 500 人以内、或同属 10000+ 满编档（差值在 1000 内）即视为同档；
        //    欧洲 10,180 兵与华夏 10,220 兵同属第一梯队名将城，欧洲名将城不会被淘汰。
        const bestIsFamous = (getGeneralProfile(getCityAnchoredGeneral(best.id)?.generalId || '')?.tier === 'famous');
        const bestTroops = best.troops || 0;
        const tied = sorted.filter((c) => {
            const g = getCityAnchoredGeneral(c.id);
            const p = g ? getGeneralProfile(g.generalId) : null;
            const isFamous = p?.tier === 'famous';
            if (isFamous !== bestIsFamous) return false;
            const diff = bestTroops - (c.troops || 0);
            return diff <= 500 || (bestTroops >= 10000 && (c.troops || 0) >= 10000 && diff <= 1000);
        });
        if (tied.length === 1) return best;

        // ③-0 **远游**：每 VOYAGE_EVERY 次寻将放一次不看距离的均匀抽签。
        //    🔴 [2026-09-15 主人定]「一般就是就近，N 次后有一次不就近」。
        //    没有它玩家永远到不了美洲 —— 旧大陆到新大陆最短城距是里斯本→安格拉 1568km，
        //    而「最近 K 座」里永远有 K 座更近的没去过的城挡着，实测美洲命中恒为 0。
        //    这一签只看兵多名将、完全不看距离，在同档候选里均匀抽。
        this.huntCount++;
        // 🔴 [2026-09-16 主人定]「军团战败后重新寻将，不要找太近的 —— 太近的话刚打完又碰上」
        //    标志只管**战败后的这一次**寻将，取出来就清掉；远游那一签本来就跨洲，不必再过滤，
        //    但同样要把标志消费掉，否则会顺延到下一次普通寻将上。
        const avoidNear = this.postDefeatHunt;
        this.postDefeatHunt = false;
        if (this.huntCount % PlayerQuestSystem.VOYAGE_EVERY === 0) {
            return tied[Math.floor(Math.random() * tied.length)] ?? best;
        }

        // ③ 同档之间怎么挑：**最近 K 座里随机 + 排除已访问**。
        //    🔴 [2026-09-15 主人报障 → DD 分析 → 实测拍板] 前两版都被否掉了：
        //      · 全局随机：300 次寻将摸到 217 位，平均每趟 4627km —— 全浪费在路上；
        //      · 永远挑最近：摸到 **3** 位 —— 走完这趟下一座最近的还是附近那几座，原地打转；
        //      · 我自己那版「按距离加权随机 + 12 条冷却」：207 位 / 1035km，两头都不如下面这套。
        //    **排除已访问是灵魂，不是细节**：同样的随机逻辑，排除窗口取 20 只摸到 125 位，
        //    取 200 是 276 位，**永久**才是 301 位（≈ 走遍全图）。排除的都是身边去过的城，
        //    于是每走一趟就把附近摘掉一座，逼着范围一圈圈往外扩 —— 而且平均路程反而更短
        //    （永久 424km ＜ 窗口200 的 478km），不存在「永久排除会越跑越远」。
        //    实测 K=5 + 永久排除 + 远游20：摸到 295 位、平均每趟 554km。
        //    验算脚本：scratch/_hunt_compare.ts（各方案横向对比）、scratch/_hunt_verify.ts（照抄本实现跑验收）。
        //    两者都要 node --import tsx --import ./scratch/vhook.mjs 跑（vhook 把 virtual:portrait-manifest 桩掉）。
        const me = this.deps.hero.getPosition();
        if (!me || typeof me.lat !== 'number') {
            return tied[Math.floor(Math.random() * tied.length)] ?? best;
        }
        // 全去遍了就清空重来：城会易主、武将会死，隔了一整圈再回去是合理的。
        let fresh = tied.filter((c) => !this.visited.has(c.id));
        if (!fresh.length) {
            this.visited.clear();
            fresh = tied;
        }
        // K 由面板「就近寻将」定：开 = 1（永远挑最近的那座没去过的，路程最短 436km），
        // 关 = 5（最近五座里抽，554km，留出随机性）。摸到的数量两档一样，K 只管路程。
        // 战败后这一趟：先把战场周边 POST_DEFEAT_MIN_KM 内的城整片剔掉，再照常「最近 K 座里抽」。
        // 于是落点自然落在闸外最近的那一圈（约 300~400km），既离开了刚打完的那片，也没被甩到天边。
        // 实测（scratch/_hunt_mindist.ts，430 座名将城）：第 5 近的城距离中位 312km，
        // 而 300km 闸外仍剩候选 p50=425 座、**一座「无城可选」的城都没有** —— 闸不会落空。
        // 兜底仍保留：万一某天据点分布变了导致闸外没人，就不强求，照旧用原池子，绝不卡死寻将。
        if (avoidNear) {
            const far = fresh.filter((c) => PlayerQuestSystem.distKm(
                me, { lat: c.latitude, lng: c.longitude },
            ) >= PlayerQuestSystem.POST_DEFEAT_MIN_KM);
            if (far.length) fresh = far;
        }
        const K = this.deps.hero.nearbyFirst ? 1 : PlayerQuestSystem.NEAR_K;
        const ranked = fresh
            .map((c) => ({ c, d: PlayerQuestSystem.distKm(me, { lat: c.latitude, lng: c.longitude }) }))
            .sort((a, b) => a.d - b.d)
            .slice(0, K);
        return ranked[Math.floor(Math.random() * ranked.length)]?.c ?? best;
    }

    /** 「最近 K 座里随机」的 K。摸到多少位与 K 无关（那是排除已访问决定的），K 只管每趟路程：
     *  实测 K=1→436km、3→519km、5→554km、8→649km。取 5 是在「路程短」和「别太可预测」之间。 */
    private static readonly NEAR_K = 5;
    /** 每多少次寻将放一次「远游」。实测 10 次太密（光远游就把平均路程从 424 抬到 830km），
     *  20 次是 554~616km 且仍能摸到美洲。 */
    private static readonly VOYAGE_EVERY = 20;
    /** 🔴 [2026-09-16 主人定] 军团战败后那一次寻将的最小距离（km）：刚打完别在原地附近再卷进去。
     *  取 300：正好是「第 5 近的名将城」的中位距离（312km），相当于把平时会抽中的那最近五座整体推到圈外；
     *  再大就开始抢远游那一签的活了。 */
    private static readonly POST_DEFEAT_MIN_KM = 300;
    /** 下一次寻将要不要避开近处（军团覆灭时置位，用掉即清）。 */
    private postDefeatHunt = false;
    /** 已自动寻将次数，只用来数远游节拍。 */
    private huntCount = 0;
    /** 已拜访过的城（**永久**排除，去遍全图才清空）。这是「别困在一个圈里」的唯一机制。 */
    private readonly visited = new Set<string>();

    /** 选定一座城后记一笔，下次就不再选它了（直到全图走遍后清空）。 */
    private rememberVisit(city: City): void {
        this.visited.add(city.id);
    }

    private onHostLost(_lastId: string): void {
        // 🔴 [2026-09-16 主人定] 军团没了 → 下一次寻将避开战场周边（见 POST_DEFEAT_MIN_KM）。
        //    置位放在这里是因为**两条覆灭路径**（PlayerHero 的战败停顿分支与军团被打光分支）
        //    都汇到这一个回调，写一处就都盖住了。
        this.postDefeatHunt = true;
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
                : `❌ 出征【${q.targetCityName}】失败，军团解散`);
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
        this.clearJourneyBriefing();
    }
}
