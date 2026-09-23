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
import type { City, HistoricalEvent } from '../types/core';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getCityEliteLegionName, getExpeditionEliteConfig } from '../data/ExpeditionLegions';
import { WAR_TYPES } from '../data/WarTypes';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { GameConfig } from '../config/GameConfig';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { comparePlayerGeneralsByPriority } from '../data/generalSelection';
import { getFactionCompositionSlots } from '../types/CultureFormations';
import { resolveGeneralPortraitPath } from '../config/portrait_defaults';
import { getCityRegion } from '../systems/RegionSystem';
import { markSpawnTierConsumed } from '../legion/LegionSpawnTier';
import { getEuclideanDistance, joinStartToRoadPolyline } from '../core/DistanceUtils';
import { roadRegistry } from '../roads/RoadRegistry';
import { gameLog } from '../utils/GameLogger';
import type { PlayerHero } from './PlayerHero';
import { PLAYER_QUEST_TARGET_MAX_HOPS } from './PlayerConfig';
import { BATTLEFIELDS, type BattlefieldData } from '../data/Battlefields';
import { findHistoricalEventsOfGeneral, findGeneralOfBattlefield } from '../data/HistoricalEventScript';
import { isBattlefieldFought } from '../events/battlefieldState';
import { journeyBriefingDuration, journeyBriefingParagraphs } from './JourneyBriefing';

export type PlayerQuestKind = 'restore' | 'campaign' | 'general_event';

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
     * 🔴 [2026-09-19 主人定] 只给 `kind: 'general_event'` 用 —— **这位武将的那一场史实战役**。
     * 主人原话：「每个武将一个真实的历史事件」。战役的战场、坐标、胜负、兵力全在
     * `HistoricalEventScript` + `Battlefields` 里（照搬，不在本系统里另存一份免得出现第二真源）。
     */
    event?: {
        /** 战场 id（`bf_*`） */
        battlefieldId: string;
        /** 战场地名（标牌上那个） */
        battlefieldName: string;
        /** 战役全称，如【格拉尼库斯河战役】 */
        title: string;
        lat: number;
        lng: number;
        /**
         * 攻城战才有：**要打的那座城**。
         * 🔴 [2026-09-19] 攻城战的战场标在**史实地点**（一之谷 34.64,135.10），
         *    而要打的城是姬路城（34.8394,134.6939）—— 两者差 0.2 度。军团赶路必须开向**城**，
         *    否则会停在史实地点、离城二十公里，这一仗永远触发不了。
         */
        defenderCityId: string | null;
    };
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
     * 🔴 [2026-09-16 主人定]「播报出来，字幕显示在下面」——赶路背景解说。
     * 由 `SpeechAnnouncer.announceBriefing` 一并负责**语音 + 下方字幕条**，
     * 不走上方那个 toast（那是到达/入伍/报错的操作提示，两者不能混）。
     * `onDone` 在念完时回调，调用方据此推下一段。
     */
    announceBriefing?: (text: string, onDone?: () => void, onStart?: () => void) => void;
    kickLegionAi: (armyId: string) => void;
    ensureUnpaused: () => void;
    feed?: {
        pushRestoration?(p: { factionId: string; cityName: string }): void;
        pushExpedition?(p: { legionName: string; cityName: string; kind: 'depart' | 'success' }): void;
    };
    /**
     * 当前游戏年份（负 = 公元前）。
     * 🔴 [2026-09-19 主人定] **本系统已不再读它** —— 「先不要时间这个限定条件了」，
     *    武将触发、乱斗寻将、战场引导三条路都不看年份。字段保留为可选，只为将来若要用时不必再改接线；
     *    GameApp 照旧传，不传也不影响。
     */
    getYear?: () => number;
    /**
     * 🔴 [2026-09-14 主人定] 战场玩法的接口（只用得着这三个，不整个 import 管理器免得绕成循环依赖）。
     */
    battlefields?: {
        /** ignoreArmyId：玩家随武将赶来的赶路军团（不算「主帅率军在外」） */
        checkReady(bfId: string, playerPos?: { lat: number; lng: number }, ignoreArmyId?: string): string | null;
        /** 战场坐标（玩家赶路用；战场不是据点，不在路网里） */
        locate(bfId: string): { lat: number; lng: number } | null;
        findBattle(bfId: string): { attackerFactionId: string; defenderFactionId: string;
            attackerGeneralId?: string; defenderGeneralId?: string; title?: string;
            attackerSourceCityId?: string; defenderSourceCityId?: string } | null;
        start(bfId: string,
            onSpawned: (sides: { attacker: Army; defender: Army }) => void,
            onFinished: (sides: { attacker: Army; defender: Army }) => void,
            ignoreArmyId?: string): string | null;
        /** 某武将在这一仗里那一方的史实兵力与军团名（主角赶路军团用） */
        sideOfGeneral?(bfId: string, generalId: string): { troops: number; legionName: string } | null;
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
        // 已抵达（见到人或到了城）→ 「赶去与武将碰头」这一轮作废，下一拍按需重规划
        this.headingToEventGeneralId = null;
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

        // 🔴 [2026-09-19 主人定] **武将优先**：这位武将有归属他的史实战役 → 就是他请壮士同赴此役。
        //    主人原话：「我希望和武将对话后，加入武将军团，然后触发事件任务。……
        //      之前是时间来触发，我想改为找到武将后，第一次触发，每个武将一个真实的历史事件。」
        //    排在复国/乱斗两条老路之前 —— 有史实的一律走史实，没配的才回落到原来的随机乱斗。
        //    （主人：「一个一个武将写，先写名将，名将肯定都有，不是名将的玩家也不会找。」）
        const ge = this.generalEventFor(g.generalId);
        if (ge) {
            const ev = this.describeGeneralEvent(ge);
            if (ev) {
                const foe = ev.foeGeneralName ? `【${ev.foeGeneralName}】` : '敌军';
                const eliteName0 = getCityEliteLegionName(city.id) ?? `${g.generalName}部`;
                this.deps.showDialogue({
                    speaker: g.generalName,
                    portrait,
                    factionName,
                    text: `壮士远来。某正要提兵赴【${ev.title}】，与${foe}决战于${ev.battlefieldName}。`
                        + `此战关系重大，某愿请壮士同往。破敌之日，当以「${eliteName0}」之战法相授。`,
                    options: [
                        { label: `⚔ 随${g.generalName}赴【${ev.title}】`, accent: true, onPick: () => this.joinGeneralEvent(city, g, ev, null) },
                        { label: '告辞', onPick: () => this.deps.closeDialogue() },
                    ],
                });
                return;
            }
        }

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
        const battleTitle = this.getBattlefieldBattleTitle(bfId, bfName);
        // 🔴 [2026-09-19 主人定] 玩家带着武将的军团赶到战场时**不再被「你正在军中」挡回**：
        //    原先这里是不由分说 `if (hero.isAttached()) { notify('你正在军中…'); return; }`，
        //    那是「玩家单骑点战场」那条老路的闸门。武将触发这条链上，玩家**本来就是随军来的** ——
        //    跟着自己的主帅走到战场，理应能选边开打。
        //    闸门保留原意（在军中不许另投一方），只放行一种情形：**这就是我随的这位武将的那一仗**。
        if (this.deps.hero.isAttached() && !this.isFollowingGeneralEvent(bfId)) {
            this.deps.notify('你正在军中，随军出征，军团解散前不可另投一方');
            return;
        }

        // 先看「能不能打」里与距离无关的那些（打过了 / 主帅在外 / 已有战事）
        // 随武将赶来的这一仗：他本人率领的赶路军团不算「主帅率军在外」
        const ownMarchArmyId = this.isFollowingGeneralEvent(bfId) ? this.quest?.legionId : undefined;
        const hardBlock = bfApi.checkReady(bfId, undefined, ownMarchArmyId);
        if (hardBlock) { this.deps.notify(hardBlock); return; }

        // 没到战场 → 不是报错，是**自动赶过去**，到了再弹选边（主人：玩家要抵达战场才能触发）
        const far = bfApi.checkReady(bfId, this.deps.hero.getPosition(), ownMarchArmyId);
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

        // 🔴 [2026-09-19 主人令「谁的人物，玩家就帮谁」] 随武将而来的这一仗：**默认就是这位武将那一方**。
        //    见 `ownSideOfFollowingEvent` 的血训说明 —— accent 一给错，自动模式就会反帮敌人。
        //    自己单骑跑来战场（没随军）时才回到「可自择一方」的老口径。
        const ownSide = this.ownSideOfFollowingEvent(bfId);
        const ownGeneral = ownSide === 'attacker' ? atkGeneral : ownSide === 'defender' ? defGeneral : '';
        const otherSide: 'attacker' | 'defender' = ownSide === 'attacker' ? 'defender' : 'attacker';
        const otherGeneral = otherSide === 'attacker' ? atkGeneral : defGeneral;
        const otherFaction = otherSide === 'attacker' ? atkName : defName;

        const join = (side: 'attacker' | 'defender' | null) => {
            this.deps.closeDialogue();
            // 已经在战场上了 → 清掉「正奔赴【XXX战役】」的标注，HUD 动向栏不再指着这里
            // （单骑那条路由 travelToPoint 的抵达回调清；随军这条链没有那个回调，故在这里统一清）
            this.deps.hero.setTravelPointLabel(null);
            // 先结束选边暂停，再开战；开战后战术场景会接管暂停，不能再解除，
            // 否则引擎已冻结而 GameAppLoop 不走战术 tick，画面会停在大地图。
            this.deps.ensureUnpaused();
            const msg = bfApi.start(
                bfId,
                ({ attacker, defender }) => {
                    // 🔴 [2026-09-19 主人定] 战场上打的是**为这一仗生成的两支史实军团**，玩家先前随的
                    //    那支「赶路军团」到这里就功成身退 —— 必须收掉，否则两件事同时出问题：
                    //    ① 它身上还挂着这位武将（`army.generalId`），而战场准入要判「主帅在城，
                    //       不能东边打完西边又打」（`HistoricalEventManager.isGeneralAvailable`）；
                    //       不散掉这支军团，玩家自己跟着来的那一仗会被一句「主帅正率军在外」挡死。
                    //    ② 它不属于战场玩法，不会随 `withdrawBattlefieldLegions` 班师，
                    //       会变成棋盘上一支多出来的、没人管的军团。
                    this.disposeHostMarchLegion();
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
                    const unitKey = this.mainUnitKeyOf(joinedFaction, joinedGeneral);
                    if (unitKey) {
                        // 🔴 [2026-09-19 主人令「精锐凭什么不能挂战场」＋CC 独立审计第 3 条]
                        //    **番号按势力取**（`getExpeditionEliteConfig(factionId)`），
                        //    不再从「出兵城」取。
                        //    改前的血训：守方那条路我修了、**玩家奖励这条路漏了** —— 于是玩家投哪边
                        //    就可能拿到**别人家的番号**：投长平的赵守方拿到**秦的「上党锐骑」**、
                        //    投桶狭间的今川守方拿到**织田的「织田马廻众」**、
                        //    投法萨卢斯的庞培军拿到雅典的**「萨拉米斯舰」**（海军番号）、
                        //    投虎牢关的唐/夏两边都拿到郑州的**「白袍军」**。
                        const eliteName = getExpeditionEliteConfig(joinedFaction)?.name
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
                    // 🔴 [2026-09-19 主人定] 武将触发的那条链，打完由这里收尾（战役名与结算一起报）
                    this.finishGeneralEvent(bfId, battleTitle);
                    this.emitChange();
                },
                ownMarchArmyId,
            );
            if (msg) { this.deps.notify(msg); return; }
        };

        // 🔴 [2026-09-19 主人令「抵达据点接任务…为什么自动接攻击方的？谁的人物，玩家就帮谁」]
        //    随军而来的这一仗：加粗高亮（= HUD 3 秒后自动确认的那一个）改成**自己主帅那一方**，
        //    文案也点明「你随他而来，自当与他并肩」；想换边的仍可手动转投，但不再默认站到对面去。
        if (ownSide) {
            this.deps.showDialogue({
                speaker: battleTitle,
                portrait: null,
                factionName: battleTitle,
                text: `${atkName}【${atkGeneral}】与${defName}【${defGeneral}】将于此地会战。`
                    + `壮士既随【${ownGeneral}】而来，此役自当与其并肩，共击${otherFaction}。`,
                options: [
                    { label: `⚔ 与${ownGeneral}并肩`, accent: true, onPick: () => join(ownSide) },
                    { label: `⚔ 转投${otherFaction}·${otherGeneral}`, onPick: () => join(otherSide) },
                    { label: '👁 只在旁观战', onPick: () => join(null) },
                    { label: '告辞', onPick: () => this.deps.closeDialogue() },
                ],
            });
            return;
        }

        this.deps.showDialogue({
            speaker: battleTitle,
            portrait: null,
            factionName: battleTitle,
            text: `${atkName}【${atkGeneral}】与${defName}【${defGeneral}】将于此地会战。`
                + `壮士既已亲临，可自择一方效力，亦可袖手旁观。`,
            options: [
                { label: `⚔ 助${atkName}·${atkGeneral}`, accent: true, onPick: () => join('attacker') },
                { label: `🛡 助${defName}·${defGeneral}`, onPick: () => join('defender') },
                { label: '👁 只在旁观战', onPick: () => join(null) },
                { label: '告辞', onPick: () => this.deps.closeDialogue() },
            ],
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // 武将的史实战役（🔴 2026-09-19 主人定，「一个武将一个真实的历史事件」）
    //
    // 主人原话：「我希望和武将对话后，加入武将军团，然后触发事件任务。
    //   ……之前是时间来触发，我想改为找到武将后，第一次触发，每个武将一个真实的历史事件，
    //   然后就随机。」
    // 主人原话（乱斗）：「现在游戏是乱斗，所有先不要时间这个限定条件了，但是再写事件的时候，
    //   还要写上时间，万一以后还要用。」
    //
    // 落点只有三条，其余全部复用现成的战场玩法：
    //   ① 触发判据：`HistoricalEvent.generalId === 这位武将`（不看攻守主帅，也不看游戏年份）；
    //   ② 行军：军团（host）自己沿路网开赴战场坐标，玩家随军（attach 后位置本来就跟军团走）；
    //   ③ 开打：抵达后走**现成的** `onBattlefieldClicked` → 选边 → `startBattlefieldBattle`。
    // ══════════════════════════════════════════════════════════════════

    /** 正在执行的那位武将的战役（供 `isFollowingGeneralEvent` 判「这就是我随的这位武将的那一仗」） */
    private followingEventGeneralId: string | null = null;

    /**
     * 这位武将**此刻该接的那一场史实战役**。
     *
     * 🔴 [2026-09-19 主人定] 一位武将可以有**多场**戏（亚历山大东征 11 场），
     *    定案是「**按年份早→晚依次解锁**」：
     *    · 取他名下**还没打过**的战役里年份最早的那一场（打过 = 战场遗址已点亮）；
     *    · 全部打完 → 返回 null，他回到乱斗（主人定「第一次触发……然后就随机」）；
     *    · 某一场一时去不了（`bfRetryAfter` 里正在冷却，例如寻路失败）→ **退到下一场**，
     *      免得玩家的整条线被一个暂时到不了的战场钉死。
     */
    private generalEventFor(
        generalId: string,
    ): { event: HistoricalEvent; battlefieldId: string } | null {
        if (!generalId) return null;
        const all = findHistoricalEventsOfGeneral(generalId, (id) => {
            const c = this.deps.cityManager.getCity(id);
            return c ? { lat: c.latitude, lng: c.longitude } : undefined;
        });
        if (!all.length) return null;
        const unfought = all.filter((h) => !isBattlefieldFought(h.battlefieldId));
        if (!unfought.length) return null;
        const now = Date.now();
        const reachable = unfought.find((h) => now >= (this.bfRetryAfter.get(h.battlefieldId) ?? 0));
        return reachable ?? unfought[0];
    }

    /**
     * 把一条史实事件摊成界面要用的几样：战役名、战场地名、坐标、对手主帅名。
     * 战场地名与坐标一律取自 `Battlefields`（**战场记录才是地名的真源**，标牌上显示的也是它）。
     */
    private describeGeneralEvent(
        hit: { event: HistoricalEvent; battlefieldId: string },
    ): {
        title: string; battlefieldId: string; battlefieldName: string;
        lat: number; lng: number; foeGeneralName: string | null;
        /** 攻城战：要打的那座城（赶路终点是**城**，不是史实战场坐标） */
        defenderCityId: string | null;
        /** 主人设定的行军路标（据点 id，按顺序经过） */
        marchWaypoints: string[];
    } | null {
        const bf = BATTLEFIELDS.find((b) => b.id === hit.battlefieldId);
        if (!bf) return null;
        const data = hit.event.siegeData ?? hit.event.fieldBattleData;
        const atk = data?.attackerGeneralId ?? '';
        const def = data?.defenderGeneralId ?? '';
        // 对手＝不是我这位武将在打的那一位（本事件归我，故对手取另一方主帅）
        const foeId = atk === hit.event.generalId ? def : atk;
        return {
            title: this.getBattlefieldBattleTitle(bf.id, bf.name),
            battlefieldId: bf.id,
            battlefieldName: bf.name,
            lat: bf.lat,
            lng: bf.lng,
            foeGeneralName: foeId ? (getGeneralRecordByGeneralId(foeId)?.generalName ?? null) : null,
            // 🔴 [2026-09-19 主人定「建立一个一之谷战场」] 攻城战的赶路终点：
            //   · **战场要塞**（`targetBattlefieldId`）→ 就是这块战场本身的坐标；
            //   · 普通攻城（打下某座**据点**）→ 那座城的坐标。
            //   原先一律取 `defenderCityId`，一之谷改成打战场后就没有城可取了。
            defenderCityId: hit.event.type === 'siege' && !hit.event.siegeData?.targetBattlefieldId
                ? (hit.event.siegeData?.defenderCityId ?? null)
                : null,
            marchWaypoints: [...(data?.marchWaypoints ?? [])],
        };
    }

    /** 玩家此刻随的这位武将，打的是不是这个战场（是 → 放行「在军中也能开打」） */
    private isFollowingGeneralEvent(bfId: string): boolean {
        const q = this.quest;
        return !!q && q.kind === 'general_event' && q.event?.battlefieldId === bfId;
    }

    /**
     * 玩家随的那位武将，在他自己那一仗里站**哪一方**。
     *
     * 🔴 [2026-09-19 主人令「谁的人物，玩家就帮谁」] 血训：HUD 对话是「3 秒后自动点 accent 那一个」，
     *    而选边对话原先把 accent **永远给攻方** —— 玩家跟着楠木正成去守千早城，
     *    自动确认却把他塞进**攻方**，等于反帮敌人。
     *    故此处给出「本将所在的一方」，供选边默认用。没随军 / 本将不在阵中 → null（回到自择一方）。
     */
    private ownSideOfFollowingEvent(bfId: string): 'attacker' | 'defender' | null {
        if (!this.isFollowingGeneralEvent(bfId)) return null;
        const gid = this.quest?.generalId;
        if (!gid) return null;
        const fb = this.deps.battlefields?.findBattle(bfId);
        if (!fb) return null;
        if (fb.attackerGeneralId === gid) return 'attacker';
        if (fb.defenderGeneralId === gid) return 'defender';
        return null;
    }

    /**
     * 入伍 + 接下这位武将的史实战役。
     * @param army 已在野外的现成军团（野外会面走这条）；城内对话时为 null（自己起兵）
     */
    private joinGeneralEvent(
        city: City,
        g: { generalId: string; generalName: string; portrait: string },
        ev: { title: string; battlefieldId: string; battlefieldName: string; lat: number; lng: number; defenderCityId?: string | null; marchWaypoints?: string[] },
        army: Army | null,
    ): void {
        this.deps.closeDialogue();
        const host = army ?? this.raiseLegion(city, city.factionId, g, city.id);
        if (!host) {
            this.deps.notify('起兵失败（军团未能建立）');
            return;
        }
        // 🔴 [2026-09-23 主人定「路上就显示史实兵力和军团名」] 赶路军团直接用这一仗的史实兵力与军团名
        //    （如亚历山大 35000、古典时代马其顿军团·伙伴骑兵），与战场上生成的史实军团同源。
        //    只在剧本模式；乱斗模式保持原样（起兵 = 本城兵力九成）。
        const scriptMode = this.deps.hero.autoPlan === 'script';
        const side = scriptMode ? this.deps.battlefields?.sideOfGeneral?.(ev.battlefieldId, g.generalId) : null;
        if (side) {
            host.setTroops(side.troops);
            host.name = side.legionName;
        }
        const factionId = host.getFactionId() || city.factionId;
        const factionName = this.deps.cityManager.getFactionName(factionId);
        const unitKey = this.mainUnitKeyOf(factionId, g.generalId);
        this.quest = {
            kind: 'general_event',
            cityId: city.id,
            cityName: city.name,
            factionId,
            factionName,
            generalId: g.generalId,
            generalName: g.generalName,
            legionId: host.id,
            // 「目标」不是据点而是战场：这两个字段照旧填，任务条/HUD 用的是 event.title
            targetCityId: city.id,
            targetCityName: ev.battlefieldName,
            reward: unitKey ? { name: getCityEliteLegionName(city.id) ?? g.generalName, unitKey } : undefined,
            event: {
                battlefieldId: ev.battlefieldId,
                battlefieldName: ev.battlefieldName,
                title: ev.title,
                lat: ev.lat,
                lng: ev.lng,
                defenderCityId: ev.defenderCityId ?? null,
            },
        };
        this.followingEventGeneralId = g.generalId;
        // 记一笔「这一仗还没打完、归属这位武将」：中途被打断（军团覆灭/离队）时靠它把战役接回来
        this.pendingEventGeneralId = g.generalId;
        if (!this.pendingEventOptions.includes(g.generalId)) this.pendingEventOptions.unshift(g.generalId);
        // 🔴 随军：**先 attach 再驱动军团**。attach 之后玩家位置每帧跟着 host 走（PlayerHero.update），
        //    所以只要把 host 送出去，玩家就在他身边，不需要另给玩家开一条「在军中还能自己走」的路。
        this.deps.hero.joinFaction(factionId);
        this.deps.hero.attachTo(host);
        this.deps.ensureUnpaused();
        // 🔴 钉住这支军团，不让 AI 行为树把它拉去攻别的城：本仗有**史实目标**，不是乱斗选目标。
        //    走引擎既有的 `__scriptPinned`（AIController.tickArmy 第一句就 return）——
        //    不新加任何开关，也不改行为树。
        (host as Army & { __scriptPinned?: boolean }).__scriptPinned = true;
        // 与剧本军同口径：赶路途中不主动与别人交战（免得半路被野战拦住去不了战场）
        host.scriptMarchExempt = true;
        // 起兵路径把「本城」写成了远征目标（`raiseLegion` 的入参语义）——本仗目标是**战场坐标**，
        // 把这个目标清掉，免得 AI 或别处把它当成「要攻打自己这座城」。
        host.expeditionTargetCityId = null;
        this.armyMarchPoint = null;
        // 攻城战：赶路终点是**被攻的那座城**（战场标牌仍在史实地点，那是给玩家看的地理参照）
        const defCity = ev.defenderCityId ? this.deps.cityManager.getCity(ev.defenderCityId) : null;
        const marchTarget = defCity
            ? { lat: defCity.latitude, lng: defCity.longitude }
            : { lat: ev.lat, lng: ev.lng };
        // 行军路标只在剧本模式走；乱斗模式照旧走最近的路
        this.marchWaypointsLeft = scriptMode ? [...(ev.marchWaypoints ?? [])] : [];
        this.startMarchToBattlefield(host, marchTarget);
        // 与战场玩法同一条赶路播报（HUD 动向栏也跟着显示【XXX战役】）
        this.deps.hero.setTravelPointLabel(ev.title);
        this.startJourneyBriefing(BATTLEFIELDS.find((b) => b.id === ev.battlefieldId) ?? null, ev.title);
        this.deps.notify(`⚔ 随${g.generalName}赴【${ev.title}】，战场在${ev.battlefieldName}`);
        gameLog('expedition',
            `[玩家] 武将史实战役：${g.generalName} 率 ${host.name} 自 ${city.name} 奔赴【${ev.title}】`);
        this.emitChange();
    }

    /** 这一趟还没走到的行军路标（据点 id，按顺序） */
    private marchWaypointsLeft: string[] = [];

    /** 路标段 + 最后一段拼成一条路；最后一段不通 → null（交给调用方兜底） */
    private withViaPath(
        via: { lat: number; lng: number }[],
        last: { lat: number; lng: number }[] | null,
    ): { lat: number; lng: number }[] | null {
        if (!last || last.length < 2) return null;
        return via.length ? [...via, ...last.slice(1)] : last;
    }

    /**
     * 续路时去掉已经走过的路标：军团离「下一站」比路标离「下一站」还近，说明已越过这个路标。
     */
    private dropPassedWaypoints(pos: { lat: number; lng: number }, target: { lat: number; lng: number }): void {
        while (this.marchWaypointsLeft.length) {
            const wp = this.deps.cityManager.getCity(this.marchWaypointsLeft[0]);
            if (!wp) { this.marchWaypointsLeft.shift(); continue; }
            const wpPos = { lat: wp.latitude, lng: wp.longitude };
            const nextId = this.marchWaypointsLeft[1];
            const nextCity = nextId ? this.deps.cityManager.getCity(nextId) : null;
            const next = nextCity ? { lat: nextCity.latitude, lng: nextCity.longitude } : target;
            const reached = getEuclideanDistance(pos, wpPos) * 111 <= 3;
            if (reached || getEuclideanDistance(pos, next) < getEuclideanDistance(wpPos, next)) {
                this.marchWaypointsLeft.shift();
                continue;
            }
            break;
        }
    }

    /** 军团自己沿路网开赴战场坐标（玩家随军，位置跟着走） */
    private startMarchToBattlefield(host: Army, target: { lat: number; lng: number }, resume = false): void {
        // 🔴 [2026-09-19 主人定「把战场和据点分开」] **本来就在战场上**（战场自带攻守、军团就生成在战场）
        //    → 没有"赶路"这一段，立刻接战。否则 `moveAlongPath` 收到零长路径不会触发抵达回调，
        //    玩家会永远站在战场上等一个不会来的对话框。
        if (getEuclideanDistance(host.getPosition(), target) * 111 <= 2) {
            this.armyMarchPoint = { lat: target.lat, lng: target.lng };
            this.onHostReachBattlefield();
            return;
        }
        if (!roadRegistry.isInitialized()) return;
        const from = host.getPosition();
        // 🔴 [2026-09-23 主人定「军团按你设的路线走」] 先依次经过主人设的行军路标（据点），最后一段奔战场。
        //    续路时（卡住重铺）已走过的路标不再回头去走（见 dropPassedWaypoints）。
        if (resume) this.dropPassedWaypoints(from, target);
        let legStart: { lat: number; lng: number } = from;
        const viaPath: { lat: number; lng: number }[] = [];
        for (const wpId of this.marchWaypointsLeft) {
            const wp = this.deps.cityManager.getCity(wpId);
            if (!wp) continue;
            const wpPos = { lat: wp.latitude, lng: wp.longitude };
            const leg = roadRegistry.findPathOnRoad(legStart, wpPos);
            if (!leg || leg.length < 2) {
                gameLog('expedition', `[玩家] 行军路标【${wp.name}】无路可达，跳过`);
                continue;
            }
            viaPath.push(...(viaPath.length ? leg.slice(1) : leg));
            legStart = wpPos;
        }
        let path = this.withViaPath(viaPath, roadRegistry.findPathOnRoad(legStart, target));
        if (!path || path.length < 2) {
            // 战场不是据点、不在路网上（波斯门深在扎格罗斯山里就是这种）→ 沿路网走到最近那座城，
            // 最后一段直奔战场。与 `PlayerHero.travelToPoint` 同一套兜底，别再写第二套。
            const anchor = roadRegistry.getNearestCityPos(target.lat, target.lng, 5);
            if (anchor) {
                const via = roadRegistry.findPathOnRoad(legStart, anchor);
                if (via && via.length >= 2) path = this.withViaPath(viaPath, [...via, target]);
            }
        }
        if (!path || path.length < 2) {
            this.deps.notify(`无路可达【${this.quest?.event?.battlefieldName ?? '战场'}】`);
            return;
        }
        const marchPath = joinStartToRoadPolyline(from, path, GameConfig.ROAD.JOIN_EPS);
        host.setTargetCity(null);
        host.setOnArriveCallback(() => this.onHostReachBattlefield());
        host.moveAlongPath(marchPath.slice(1).map((p) => ({ lat: p.lat, lng: p.lng, sea: (p as { sea?: boolean }).sea })));
        this.armyMarchPoint = { lat: target.lat, lng: target.lng };
    }

    /** 军团抵达战场 → 弹选边（与点击战场同一条路，不另写开战逻辑） */
    private onHostReachBattlefield(): void {
        const q = this.quest;
        if (!q || q.kind !== 'general_event' || !q.event) return;
        this.armyMarchPoint = null;
        this.onBattlefieldClicked(q.event.battlefieldId, q.event.battlefieldName);
    }

    /** 武将事件打完的收尾：战功 + 交付战法提示（战法本身由 onBattlefieldClicked 的授奖负责） */
    private finishGeneralEvent(bfId: string, battleTitle: string): void {
        const q = this.quest;
        if (!q || q.kind !== 'general_event' || q.event?.battlefieldId !== bfId) return;
        this.quest = null;
        this.followingEventGeneralId = null;
        this.armyMarchPoint = null;
        // 这一仗打完了 → 这位武将的记事作废（主人定：第一次触发，之后就随机）
        this.pendingEventGeneralId = null;
        this.pendingEventOptions = this.pendingEventOptions.filter((id) => id !== q.generalId);
        this.deps.hero.addMerit(500);
        this.deps.notify(`🚩 【${battleTitle}】战毕，亲历此役，赏大功 500`);
        gameLog('expedition', `[玩家] 武将史实战役战毕：【${battleTitle}】`);
    }

    /** 军团正在奔赴的战场坐标（抵达判定与失败重试用；null = 没在赶赴战场） */
    private armyMarchPoint: { lat: number; lng: number } | null = null;

    /**
     * 未入伍时把「还没打完的那场武将战役」续上。
     *
     * 为什么要它：玩家在赶赴战场途中军团被灭/主动离队后，`quest` 就空了，
     * 而战役还没打（遗址没点亮）。此时若按老规矩去乱斗选城，那场史实战役就再也接不上
     * —— 主人定「第一次触发」，指的是**这一仗没打过就该还能打**，不是「接一次就作废」。
     * 所以先找回那位武将（人在城里就去城、带兵在外就追出去），再走 `onArrive` / `onMeetArmy`
     * 同一条对话链，由它们决定还是不是他那一仗。
     *
     * @returns true = 已经接手（调用方不要再另选目标）
     */
    private resumePendingGeneralEvent(): boolean {
        const gid = this.pendingEventGeneralId;
        if (!gid || this.pendingEventOptions.length === 0) return false;
        if (this.deps.hero.autoPlan !== 'melee') return false;   // 剧本模式那条链由 checkAndTriggerNextBattlefield 负责
        if (this.deps.hero.isTraveling()) return true;           // 正在赶路，别打断
        // 从「最后谈过的那位武将」往回找，找到第一个还在场的就重新去谈
        while (this.pendingEventOptions.length) {
            const id = this.pendingEventOptions.shift()!;
            const cityId = [...this.deps.cityManager.getCities()]
                .find((c) => getCityAnchoredGeneral(c.id)?.generalId === id)?.id;
            if (!cityId) continue;
            const army = this.armyOfGeneral(id);
            if (army) {
                this.chaseCityId = cityId;
                if (this.deps.hero.travelToArmy(army.id, getGeneralRecordByGeneralId(id)?.generalName ?? '将军')) return true;
            }
            this.chaseCityId = null;
            if (this.deps.hero.travelToCity(cityId)) return true;
        }
        this.pendingEventGeneralId = null;
        return false;
    }

    /** 随军赶赴战场途中的每拍维护：HUD 动向栏 + 播报续念 + 卡住时续路 */
    private followPendingGeneralEvent(): void {
        const q = this.quest;
        if (!q?.event) return;
        this.deps.hero.setTravelPointLabel(q.event.title);
        const host = this.deps.legionManager.getLegionById(q.legionId);
        if (!host || !this.armyMarchPoint) return;
        // 🔴 卡住续路：军团若因故停住（被野战打断、复员等）而人还没到战场，就重新铺一次路，
        //    免得玩家被永远钉在半路。重铺有冷却，不会每 400ms 刷屏。
        const atTarget = getEuclideanDistance(host.getPosition(), this.armyMarchPoint) * 111 <= 3;
        if (atTarget || host.isMarching()) return;
        const now = Date.now();
        if (now < this.marchRetryAfter) return;
        this.marchRetryAfter = now + 10_000;
        this.startMarchToBattlefield(host, this.armyMarchPoint, true);
    }

    /** 续路冷却（与战场寻路冷却同口径，避免每拍重铺） */
    private marchRetryAfter = 0;
    /** 武将战役被中断后，还能去找回的那几位武将（最近谈过的在前；用掉即清） */
    private pendingEventGeneralId: string | null = null;
    private pendingEventOptions: string[] = [];

    /**
     * 收掉「赶路军团」：仗一开打，随玩家赶路的那支军团就没用了（战场上用的是新生成的史实军团）。
     * 只在**确实是武将史实战役那条链**上动手 —— 乱斗出征/复国两条老路的军团照旧不动。
     *
     * 不清空玩家对它的引用：`attachTo` 紧接在后面把玩家挂到战场那支军团上，
     * 万一没挂上（选了观战），`PlayerHero.update` 会走「军团没了 → onHostLost」那条现成的清理路。
     */
    private disposeHostMarchLegion(): void {
        const q = this.quest;
        if (!q || q.kind !== 'general_event') return;
        const host = this.deps.legionManager.getLegionById(q.legionId);
        if (!host || host.isDestroyed) return;
        host.disband();
        gameLog('expedition', `[玩家] 赶路军团 ${host.name} 归队解散（战场改用史实军团）`);
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
        //    起兵即本城兵力转入军团（兵力守恒，和其他无关）。
        // 🔴 [2026-09-17 主人报障「有的军团出征后，据点留守兵力是0」] 原来这里是**带走全部、city.troops = 0**，
        //    那是 9-10 定的老口径；9-17 已改定「据点**永**留 10% 驻军」，本路径没跟上，就成了唯一的归零点。
        //    现在与 AI 募兵同口径：征 90%，留 10%（RecruitmentSystem 那两处也是 Math.floor(troops * 0.9)）。
        //    ⚠️ 全项目只有这一处会把据点兵力清零——CityManager 的抽兵扣到 MIN_GARRISON 为止、
        //       FollowResupplySystem 的补给留 minCity，两条都有下限保护，不必动。
        const troops = Math.max(1, Math.floor((city.troops || 0) * 0.9));
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
        // 扣掉带走的那部分，剩下的 10% 留城当驻军（兵力守恒不变，只是不再清零）
        city.troops = Math.max(0, (city.troops || 0) - troops);
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
     * 1. 战场未打过（`!isBattlefieldFought(bf.id)`）
     * 2. 按发生年份由先到后排序（-334 -> -333 -> -332 -> -331…）
     *
     * 🔴 [2026-09-19 主人定] **删掉「发生年份已到（`bf.scriptYear <= currentYear`）」这条过滤**。
     *    主人原话：「现在游戏是乱斗，所有先不要时间这个限定条件了，但是再写事件的时候，
     *    还要写上时间，万一以后还要用，就不要再写了。」
     *    于是「剧本模式」这条自动引导不再看游戏年份，剩下的判据只有「打没打过」；
     *    `scriptYear` 字段与编辑器里的年代**照旧保留**（主人：万一以后还要用）。
     */
    public findNextAvailableBattlefield(): { bf: BattlefieldData; title: string } | null {
        const bfApi = this.deps.battlefields;
        if (!bfApi) return null;

        const available = BATTLEFIELDS
            .filter((bf) => !isBattlefieldFought(bf.id))
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

        // 🔴 [2026-09-19 主人令「也改成『先找该战场的武将对话、随他一起去』」]
        //    剧本模式原来是把玩家**一个人**赶到战场坐标、到场才选边；
        //    现在先去找**这一仗归属的那位武将**（战场事件的 `generalId`）：
        //    走到他身边（在城里就进城、带兵在外就追出去）→ 触发对话 → 随他一起赶赴战场。
        const owner = this.eventOwnerOfBattlefield(bf.id);
        if (owner && !this.deps.hero.isAttached()) {
            // 上次寻路失败还在冷却：不打断当前行程，先让玩家去找别的武将乱斗
            const now2 = Date.now();
            if (now2 < (this.bfRetryAfter.get(bf.id) ?? 0)) return false;
            const name = getGeneralRecordByGeneralId(owner)?.generalName ?? '将军';
            if (this.headingToEventGeneralId !== owner) {
                const cityId = this.generalCityId(owner);
                const army = this.armyOfGeneral(owner);
                this.deps.hero.cancelTravel();
                this.chaseCityId = army ? (cityId ?? null) : null;
                const ok = army
                    ? this.deps.hero.travelToArmy(army.id, name)
                    : cityId
                        ? this.deps.hero.travelToCity(cityId)
                        : false;
                if (ok) {
                    this.headingToEventGeneralId = owner;
                    this.bfRetryAfter.delete(bf.id);
                    this.deps.notify(`🐎 先赴${name}军前，与他谈过再同赴【${title}】`);
                    return true;
                }
                // 这位武将既不在城、也无在外军团（孤立无援）→ 冷却后回落「单骑赴战场」老路
                this.bfRetryAfter.set(bf.id, now2 + BF_RETRY_COOLDOWN_MS);
                return false;
            }
            return true;   // 正在赶去找他的路上，别重铺
        }

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
     *
     * 🔴 [2026-09-19] 多一个 `titleOverride`：**武将触发**那条链上玩家是**随军**赶路
     *   （`hero.isAttached() === true`），而下面的 `stillHeading` 有一道「未入伍才算在路上」的闸门
     *   —— 那是给「单骑点战场」写的。若照旧判 `isAttached`，跟随武将时说第一段就会被掐断。
     *   故随军赴战场时由调用方传 override，改用「HUD 动向栏还挂着这个战役名」判在不在路上。
     */
    private startJourneyBriefing(bf: BattlefieldData | null, titleOverride?: string): void {
        if (!bf) return;
        const text = bf.briefing?.trim();
        if (!text) return;
        if (this.briefedBattlefields.has(bf.id)) return;
        this.briefedBattlefields.add(bf.id);

        const paragraphs = journeyBriefingParagraphs(text);
        if (!paragraphs.length) return;

        this.clearJourneyBriefing();
        let i = 0;
        const title = titleOverride ?? this.getBattlefieldBattleTitle(bf.id, bf.name);
        // 玩家还在赶这个战场的路上才继续念（改道/入伍/到了都停）
        const stillHeading = () => this.deps.hero.getTravelPointLabel() === title
            && (titleOverride ? true : !this.deps.hero.isAttached());

        const pushNext = () => {
            if (this.briefingCancelled) return;
            if (i >= paragraphs.length || !stillHeading()) {
                this.flushBriefingTrace(bf.id, i >= paragraphs.length ? 'done' : 'aborted');
                this.clearJourneyBriefing();
                return;
            }
            const line = paragraphs[i];
            i++;
            // 🔴 念完再推下一段：语音时长由 TTS 说了算，定时器猜出来的必然对不上口型
            const speak = this.deps.announceBriefing;
            if (speak) {
                // 🔴 [2026-09-16] 段间停留到底花在哪，靠实测不靠猜：
                //    记「请求 → 真正开口 → 念完」三个时刻，整段播完落盘一次。
                //    开口前那段就是玩家听到的「停留」（云健探测 + 合成往返）。
                const tReq = Date.now();
                let tSpeak = 0;
                this.briefingTrace.push({ seg: i, chars: line.length, reqAt: tReq - this.briefingT0 });
                speak(line, () => {
                    const rec = this.briefingTrace[this.briefingTrace.length - 1];
                    if (rec && rec.seg === i) {
                        rec.waitMs = tSpeak ? tSpeak - tReq : null;   // 停留：请求到开口
                        rec.readMs = tSpeak ? Date.now() - tSpeak : null;  // 朗读时长
                        rec.totalMs = Date.now() - tReq;
                    }
                    pushNext();
                }, () => { tSpeak = Date.now(); });
            } else {
                // 没接播报（无声环境）→ 回落到按字数留阅读时间的字幕
                const duration = journeyBriefingDuration(line);
                this.deps.notify(line, duration);
                this.briefingTimer = window.setTimeout(() => pushNext(), duration);
            }
        };
        this.briefingCancelled = false;
        this.briefingTrace = [];
        this.briefingT0 = Date.now();
        pushNext();
    }

    /** 把这次播报的逐段计时落盘，供排查「段间停留」用（AI 读 scratch，不劳主人看日志） */
    private flushBriefingTrace(bfId: string, why: 'done' | 'aborted'): void {
        if (!this.briefingTrace.length) return;
        const payload = {
            at: new Date().toISOString(),
            why: 'journeyBriefing',
            bfId,
            end: why,
            totalSec: +((Date.now() - this.briefingT0) / 1000).toFixed(1),
            segments: this.briefingTrace,
        };
        this.briefingTrace = [];
        void fetch('/api/scene13-probe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(() => { /* 诊断落盘失败不影响对局 */ });
    }

    private clearJourneyBriefing(): void {
        this.briefingCancelled = true;   // 已发出的 onDone 回来时不再往下念
        if (this.briefingTimer !== null) {
            window.clearTimeout(this.briefingTimer);
            this.briefingTimer = null;
        }
    }

    // ── 跟踪 ──────────────────────────────────────────────
    public tick(): void {
        // 🔴 [2026-09-23 主人定]「只有等剧本都结束后，自动切换到乱斗模式。」
        //    剧本都结束 = 战场表里没有未打的战场（战场在战毕那一刻才标记打过，故此时已无战役在打）。
        //    切过去之后募兵（含推迟的开局首发）与 AI 寻敌随之恢复（二者都看 autoPlan）。
        if (this.deps.hero.autoPlan === 'script' && !this.quest
            && this.findNextAvailableBattlefield() === null) {
            this.deps.hero.setAutoPlan('melee');
            this.deps.notify('📜 历史剧本已全部演完，转入乱斗模式');
            gameLog('expedition', '[玩家] 历史剧本全部结束 → 自动切换乱斗模式');
        }
        // 🔴 [2026-09-19 主人定] **武将优先**：未入伍时若身上还有一场没打完的武将史实战役，
        //    接着赶赴那个战场（赶路途中解散/失败/改道后能自动续上），而不是另选一座城。
        //    判据只有一条：这场战役还没打过（`isBattlefieldFought`）—— 主人定「第一次触发……然后就随机」。
        if (this.deps.hero.autoMode && !this.quest && !this.deps.hero.isAttached()) {
            if (this.resumePendingGeneralEvent()) return;
        }
        // 🔴 [2026-09-16 主人定]
        // 玩家未加入势力（未入伍、无任务）时：
        // 优先前往历史战场触发战役事件；
        // 若当前年份无可用战场，且未在行军，才去找武将加入势力乱斗；
        // 若玩家已加入势力（isAttached），则全程跟随武将，不触发战场事件。
        // 🔴 [2026-09-17 主人定]「剧本和乱斗模式分开……乱斗模式的话，玩家不去战场。」
        //    乱斗模式下整条战场分支不走，直接去找武将入伍。切模式时已出发的行程由 setAutoPlan 掐掉。
        if (this.deps.hero.autoMode && !this.quest && !this.deps.hero.isAttached()) {
            const headingToBattlefield = this.deps.hero.autoPlan === 'script'
                && this.checkAndTriggerNextBattlefield();
            // 🔴 [2026-09-23] 剧本期不去找武将乱斗：军团此时不寻敌，起兵入伍只会原地停着；
            //    战场一时去不了（寻路冷却）就等冷却后再试。
            if (!headingToBattlefield && !this.deps.hero.isTraveling()
                && this.deps.hero.autoPlan !== 'script') {
                this.autoTravelToBestCity();
            }
        }
        const q = this.quest;
        if (!q) return;

        // 🔴 武将史实战役：目标不是据点，而是**战场坐标**，故成败判据与出征/复国两条不同
        if (q.kind === 'general_event' && q.event) {
            this.followPendingGeneralEvent();
            const host = this.deps.legionManager.getLegionById(q.legionId);
            if (!host || host.isDestroyed || host.getTroops() <= 0) {
                this.deps.notify(`❌ 军团覆灭，未能抵达【${q.event.title}】`);
                gameLog('expedition', `[玩家] 武将史实战役中断：${q.event.title}`);
                this.quest = null;
                this.followingEventGeneralId = null;
                this.armyMarchPoint = null;
                // 留下「这位武将那一仗还没打」的记事，好让自动模式把他找回来续上（见 resumePendingGeneralEvent）
                this.pendingEventGeneralId = q.generalId;
                if (!this.pendingEventOptions.includes(q.generalId)) this.pendingEventOptions.unshift(q.generalId);
                this.emitChange();
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
    /** 停播闸：已经发出去的那段念完回调时，据此不再往下念 */
    private briefingCancelled = false;
    /** 播报计时（诊断用）：每段「请求 → 开口 → 念完」的毫秒数，整段结束落盘 */
    private briefingTrace: Array<{ seg: number; chars: number; reqAt: number;
        waitMs?: number | null; readMs?: number | null; totalMs?: number }> = [];
    private briefingT0 = 0;

    /**
     * 🔴 [2026-09-09 主人定] 在野外追上了带兵的武将：直接谈随军。
     * 与城中对话的区别只有一个 —— **不用起兵**，那支军团已经在打仗了，直接入伍即可。
     */
    public onMeetArmy(army: Army): void {
        // 已经追上了 → 「赶去与武将碰头」这一轮作废
        this.headingToEventGeneralId = null;
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
        // 🔴 [2026-09-19 主人定] 野外会面同城中对话一个口径：这位武将若有归属他的史实战役，
        //    谈的就是那一仗（主人：「和武将对话后，加入武将军团，然后触发事件任务」）。
        //    军团现成的，直接随他奔赴战场，不起兵。
        const ge = this.generalEventFor(gid);
        if (ge) {
            const ev = this.describeGeneralEvent(ge);
            if (ev) {
                const foe = ev.foeGeneralName ? `【${ev.foeGeneralName}】` : '敌军';
                this.deps.showDialogue({
                    speaker: generalName,
                    portrait,
                    factionName,
                    text: `壮士竟寻到军中来了。某正提兵赴【${ev.title}】，将于${ev.battlefieldName}与${foe}决战。`
                        + `军旅之中不便设宴，壮士便随某同去——破敌之日，功劳簿上少不了你。`,
                    options: [
                        { label: `⚔ 就此随${generalName}赴【${ev.title}】`, accent: true, onPick: () => this.joinGeneralEvent(city, { generalId: gid, generalName, portrait: rec?.portrait ?? '' }, ev, army) },
                        { label: '告辞', onPick: () => this.deps.closeDialogue() },
                    ],
                });
                return;
            }
        }
        const targetId = army.expeditionTargetCityId ?? army.siegeTargetCityId ?? army.getTargetCity()?.id ?? null;
        const target = targetId ? this.deps.cityManager.getCity(targetId) : null;
        const targetName = target?.name ?? '前方敌城';
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

    /** 这位武将的**本城**（据点锚定他的那座城）；找不到返回 null */
    private generalCityId(generalId: string): string | null {
        for (const c of this.deps.cityManager.getCities()) {
            if (getCityAnchoredGeneral(c.id)?.generalId === generalId) return c.id;
        }
        return null;
    }

    /**
     * 🔴 [2026-09-19 主人令「先找该战场的武将对话、随他一起去」]
     * **这块战场归属哪位武将** —— 走 `findGeneralOfBattlefield`（数据层唯一口径）。
     */
    private eventOwnerOfBattlefield(bfId: string): string | null {
        return findGeneralOfBattlefield(bfId, (id) => {
            const c = this.deps.cityManager.getCity(id);
            return c ? { lat: c.latitude, lng: c.longitude } : undefined;
        });
    }

    /**
     * 剧本模式：正在赶去与哪位武将碰头（先谈、再随他赴战场）。
     * 只用来避免每 400ms 重铺一次路；见到人（`onArrive` / `onMeetArmy`）即清空。
     */
    private headingToEventGeneralId: string | null = null;

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
