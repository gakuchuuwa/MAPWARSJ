/**
 * 诸葛亮北伐中原圆梦脚本（2026-08-16）
 *
 * 蜀汉建兴六年（228年），诸葛亮上《出师表》，率五万大军誓师汉中，
 * 出祁山、平二郡、收陇右、破街亭、战渭水，直捣长安，兴复汉室，还于旧都。
 *
 * 玩家点「⚔ 诸葛亮北伐中原」按钮：
 *   · 场上尚无诸葛亮军 → 汉中生成诸葛亮·白毦兵（5 万），镜头跟拍，开北伐脚本；
 *   · 场上已有诸葛亮军 → 加兵 1 万（吸引重复点击），切跟随并继续北伐。
 * 按 6 站 100% 连通真实路标逐城远征：
 *   南郑(汉中) → 略阳(祁山道) → 河池(武都) → 天水(降姜维) → 汧源(街亭口) → 岐山(五丈原) → 长安。
 *
 * 两场脚本专属野战（道路锚点精准触发，不干扰大乱斗）：
 *   · 街亭阻击战（逼近汧源街亭口）：刷魏将张郃 5 万铁骑阻击，击破后汧源归汉；
 *   · 上方谷决战（逼近岐山五丈原）：刷司马懿 8 万关中主力决战，火攻大破之，诸葛亮大军加至 5 万直取长安。
 *
 * 旗号与势力：北伐脚本运行期间旗面显示「漢」、势力名显示「季汉」；结束/覆没后恢复。
 * 木牛流马：战后兵力低于 2 万触发，补到 [22222, 29000] 随机（与忠义归顺同参数）。
 */

import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { applyLegionCultureComposition } from '../types/CultureFormations';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { roadRegistry } from '../roads/RoadRegistry';
import { gameLog } from '../utils/GameLogger';
import { spawnMapFloatingText } from '../utils/MapFloatingText';
import { speechAnnouncer } from '../audio/SpeechAnnouncer';

/** 起兵据点：南郑（汉中） */
const START_CITY_ID = 'city_hanzhong';
const FACTION_ID = 'huizhou_d';
const GENERAL_ID = 'huizhou_zhugeliang';
const ELITE_NAME = '白毦兵';
/** 起兵 5 万 */
const TROOPS = 50000;
/** 已有诸葛亮军时，再点 UI 加兵量 */
const CLICK_REINFORCE_TROOPS = 10000;

/** 必打路标：逐城攻取，终点长安 */
const ROUTE: { id: string; name: string }[] = [
    { id: 'city_lueyang',   name: '略阳' },
    { id: 'city_huixian',   name: '河池' },
    { id: 'city_tianshui',  name: '天水' },
    { id: 'city_longzhou',  name: '汧源' },
    { id: 'city_qishan',    name: '岐山' },
    { id: 'city_changan',   name: '长安' },
];

/** 木牛流马补员：触发线 */
const MUNU_TRIGGER = 20000;
/** 补到目标区间 */
const MUNU_TARGET_MIN = 22222;
const MUNU_TARGET_MAX = 29000;

/** ── 两场脚本专属野战 ── */

/** 街亭阻击战：逼近汧源街亭口，阻击张郃 */
const JIETING_TRIGGER_DIST = 0.35; // 约 35-40 km
const ZHANGHE_GENERAL = 'cao_d_caocao'; // 魏军前锋统帅
const ZHANGHE_FACTION = 'cao_d';
const ZHANGHE_TROOPS = 50000;

/** 上方谷决战：逼近岐山五丈原，决战司马懿 */
const SHANGFANG_TRIGGER_DIST = 0.40;
const SIMAYI_GENERAL = 'sima_d_simayi';
const SIMAYI_FACTION = 'sima_d';
const SIMAYI_TROOPS = 80000;
const ZHUGE_REINFORCE_TROOPS = 50000; // 决战诸葛亮补至 5 万

const TICK_INTERVAL_MS = 500;

type BattlePhase = 'pending' | 'spawned' | 'engaged' | 'defeated';

interface ZhugeLiangDeps {
    legionManager: any;
    cityManager: any;
    combatSystem: any;
    cameraFollowUI: any;
    snapCameraToArmy?: (armyId: string) => void;
    kickLegionAi?: (armyId: string) => void;
    ensureUnpaused?: () => void;
    notify?: (msg: string) => void;
}

interface ScriptArmy {
    id: string;
    factionId: string | null;
    generalId: string | null;
    homeCityId: string | null;
    name?: string;
    troops?: number;
    getTroops(): number;
    setTroops(n: number): void;
    isDestroyed?: boolean;
    isInCombat?: boolean;
    lat: number;
    lng: number;
    expeditionTargetCityId: string | null;
    expeditionSavedName: string | null;
    expeditionUnlocked: boolean;
    isElite?: boolean;
    formationMode?: 'square' | 'triangle' | 'echelon';
    slots?: any[];
}

export class ZhugeLiangExpedition {
    private deps: ZhugeLiangDeps;
    private armyId: string | null = null;
    private waypointIndex = 0;
    private timer: number | null = null;
    private wasInCombat = false;
    private battleJustEnded = false;

    /** 两场专属野战阶段 */
    private jietingPhase: BattlePhase = 'pending';
    private jietingEnemyId: string | null = null;

    private shangfangPhase: BattlePhase = 'pending';
    private shangfangEnemyId: string | null = null;

    /** 语音与播报拦截 */
    private _origAnnounceCityCapture: ((...args: any[]) => void) | null = null;
    private _origAnnounceFieldBattleEnd: ((...args: any[]) => void) | null = null;

    constructor(deps: ZhugeLiangDeps) {
        this.deps = deps;
    }

    public isRunning(): boolean {
        return this.timer != null && !!this.findExistingZhugeArmy();
    }

    private isZhugeArmy(army: ScriptArmy): boolean {
        if (army.isDestroyed || army.getTroops() <= 0) return false;
        if (army.generalId === GENERAL_ID) return true;
        if (army.homeCityId === START_CITY_ID && army.name === ELITE_NAME) return true;
        return false;
    }

    private findExistingZhugeArmy(): ScriptArmy | undefined {
        if (this.armyId) {
            const cached = this.deps.legionManager.getLegionById(this.armyId);
            if (cached && this.isZhugeArmy(cached)) return cached;
        }
        const candidates = this.deps.legionManager
            .getArmies()
            .filter((a: ScriptArmy) => this.isZhugeArmy(a));
        if (candidates.length === 0) return undefined;
        return candidates.sort((a: ScriptArmy, b: ScriptArmy) => b.getTroops() - a.getTroops())[0];
    }

    private attachFollowAndMarch(army: ScriptArmy): void {
        this.deps.ensureUnpaused?.();
        this.deps.cameraFollowUI.setFollow(army.id, '诸葛亮·白毦兵');
        this.deps.snapCameraToArmy?.(army.id);

        if (this.timer == null) {
            this.tick();
            this.timer = window.setInterval(() => this.tick(), TICK_INTERVAL_MS);
        } else {
            this.tick();
        }
        this.deps.kickLegionAi?.(army.id);
    }

    private resumeOrStartScript(army: ScriptArmy): void {
        this.armyId = army.id;
        army.expeditionUnlocked = true;
        army.isElite = true;
        if (!army.generalId) army.generalId = GENERAL_ID;
        this.attachFollowAndMarch(army);
    }

    private applyExpeditionOverride(): void {
        this.deps.cityManager.refreshFactionFlagText?.(FACTION_ID);
        this.overrideFactionName();
        this.muteGameAnnouncements();
    }

    private _origGetFactionName: ((id: string) => string) | null = null;

    private overrideFactionName(): void {
        const fm = (window as any).game?.factionManager;
        if (!fm || this._origGetFactionName) return;
        this._origGetFactionName = fm.getFactionName.bind(fm);
        const self = this;
        fm.getFactionName = function (id: string): string {
            if (id === FACTION_ID) return '季汉';
            return self._origGetFactionName!(id);
        };
    }

    private muteGameAnnouncements(): void {
        if (this._origAnnounceCityCapture) return;
        const MILESTONE_NAMES = new Set(['略阳', '河池', '天水', '汧源', '岐山', '长安']);
        this._origAnnounceCityCapture = speechAnnouncer.announceCityCapture.bind(speechAnnouncer);
        this._origAnnounceFieldBattleEnd = speechAnnouncer.announceFieldBattleEnd.bind(speechAnnouncer);
        speechAnnouncer.announceCityCapture = (opts: any) => {
            if (MILESTONE_NAMES.has(opts?.cityName)) return;
            this._origAnnounceCityCapture!(opts);
        };
        speechAnnouncer.announceFieldBattleEnd = () => {};
    }

    private unmuteGameAnnouncements(): void {
        if (this._origAnnounceCityCapture) {
            speechAnnouncer.announceCityCapture = this._origAnnounceCityCapture;
            this._origAnnounceCityCapture = null;
        }
        if (this._origAnnounceFieldBattleEnd) {
            speechAnnouncer.announceFieldBattleEnd = this._origAnnounceFieldBattleEnd;
            this._origAnnounceFieldBattleEnd = null;
        }
    }

    private restoreFactionName(): void {
        const fm = (window as any).game?.factionManager;
        if (!fm || !this._origGetFactionName) return;
        fm.getFactionName = this._origGetFactionName;
        this._origGetFactionName = null;
    }

    private rollbackExpeditionOverride(): void {
        (window as any).__zhugeliangExpeditionActive = false;
        this.deps.cityManager.refreshFactionFlagText?.(FACTION_ID);
        this.restoreFactionName();
        this.unmuteGameAnnouncements();
    }

    public start(): void {
        (window as any).__zhugeliangExpeditionActive = true;
        this.applyExpeditionOverride();
        const existing = this.findExistingZhugeArmy();
        if (existing) {
            const before = existing.getTroops();
            existing.setTroops(before + CLICK_REINFORCE_TROOPS);
            this.resumeOrStartScript(existing);
            gameLog(
                'expedition',
                `📜 [北伐中原] 诸葛亮·白毦军增援 +${CLICK_REINFORCE_TROOPS.toLocaleString()}（现兵力 ${existing.getTroops().toLocaleString()}），继续北伐！`
            );
            return;
        }

        const hanzhong = this.deps.cityManager.getCity(START_CITY_ID);
        if (!hanzhong) {
            console.error('[ZhugeLiangExpedition] 未找到起兵据点 汉中:', START_CITY_ID);
            this.rollbackExpeditionOverride();
            return;
        }

        // 汉中起兵
        const spawnPos = { lat: hanzhong.lat, lng: hanzhong.lng };
        const army = this.deps.legionManager.createLegion({
            name: ELITE_NAME,
            factionId: FACTION_ID,
            homeCityId: START_CITY_ID,
            troops: TROOPS,
            lat: spawnPos.lat,
            lng: spawnPos.lng,
            generalId: GENERAL_ID,
            isElite: true,
        }) as ScriptArmy | undefined;

        if (!army) {
            console.error('[ZhugeLiangExpedition] 创建诸葛亮军团失败');
            this.rollbackExpeditionOverride();
            return;
        }

        // 应用川蜀精锐阵型（鱼鳞阵：白毦兵 + 精锐诸葛弩 + 藤弓兵）
        applyLegionCultureComposition(army as any, 'BASHU', TROOPS);
        army.expeditionSavedName = army.name || ELITE_NAME;
        army.expeditionUnlocked = true;
        army.isElite = true;

        this.armyId = army.id;
        this.waypointIndex = 0;
        this.jietingPhase = 'pending';
        this.shangfangPhase = 'pending';

        this.attachFollowAndMarch(army);

        spawnMapFloatingText(
            '《出师表》：鞠躬尽瘁，北定中原！',
            army.lat,
            army.lng,
            '#f59e0b',
            1.5
        );
        speechAnnouncer.playSpeech('zhugeliang_start', '建兴六年春，诸葛亮誓师汉中，六出祁山北伐中原！');
        gameLog(
            'expedition',
            `📜 [北伐中原] 诸葛亮率五万白毦军誓师汉中：略阳 → 河池 → 天水 → 汧源(街亭) → 岐山(五丈原) → 长安！`
        );
    }

    private tick(): void {
        const army = this.findExistingZhugeArmy();
        if (!army) {
            const reached = this.waypointIndex > 0 ? ROUTE[this.waypointIndex - 1]?.name : '南郑';
            spawnMapFloatingText(
                `诸葛丞相壮志未酬，星落秋风...`,
                34.3,
                107.5,
                '#ef4444',
                1.3
            );
            speechAnnouncer.playSpeech('zhugeliang_fail', `诸葛亮北伐大军覆没，止步于${reached}一线。`);
            gameLog('expedition', `📜 [北伐中原] 诸葛亮·白毦军覆没，北伐止步于 ${reached} 一线`);
            this.stop();
            return;
        }

        this.armyId = army.id;
        army.expeditionUnlocked = true;

        // 捕捉战斗刚结束瞬间
        const nowInCombat = !!army.isInCombat;
        const battleEndedJustNow = this.wasInCombat && !nowInCombat;
        this.wasInCombat = nowInCombat;

        if (battleEndedJustNow) {
            this.battleJustEnded = true;
            this.onBattleVictory(army);
            // 战后重置野战追踪
            if (this.jietingPhase === 'engaged') this.jietingPhase = 'defeated';
            if (this.shangfangPhase === 'engaged') this.shangfangPhase = 'defeated';
        }

        if (army.isInCombat) return;

        // 检查野战触发
        if (this.checkJietingAmbush(army)) return;
        if (this.checkShangfangAmbush(army)) return;

        // 推进必打路标
        this.advanceRoute(army, battleEndedJustNow);
    }

    /** 战后木牛流马补员 */
    private onBattleVictory(army: ScriptArmy): void {
        const current = army.getTroops();
        if (current <= 0) return;

        if (current < MUNU_TRIGGER) {
            const target = Math.floor(
                MUNU_TARGET_MIN + Math.random() * (MUNU_TARGET_MAX - MUNU_TARGET_MIN)
            );
            if (target > current) {
                const add = target - current;
                army.setTroops(target);
                spawnMapFloatingText(
                    `木牛流马接济 +${add.toLocaleString()} 兵力`,
                    army.lat,
                    army.lng,
                    '#22c55e',
                    1.2
                );
                gameLog(
                    'expedition',
                    `🌾 [木牛流马] 战后粮秣接济、陇西义军来投：补员 +${add.toLocaleString()}（现有 ${target.toLocaleString()}）`
                );
            }
        }
    }

    /** 路标推进 */
    private advanceRoute(army: ScriptArmy, battleEnded: boolean): void {
        if (this.waypointIndex >= ROUTE.length) {
            this.onVictory(army);
            return;
        }

        const wp = ROUTE[this.waypointIndex];
        const city = this.deps.cityManager.getCity(wp.id);

        if (!city) {
            this.waypointIndex++;
            return;
        }

        // 若当前路标已归属己方
        if (city.factionId === FACTION_ID) {
            gameLog('expedition', `📜 [北伐中原] 诸葛亮·白毦军已克复 ${wp.name}`);
            spawnMapFloatingText(`克复 ${wp.name}！`, city.lat, city.lng, '#22c55e', 1.3);

            // 专属剧情播报
            if (wp.id === 'city_tianshui') {
                speechAnnouncer.playSpeech('zhugeliang_tianshui', '克复天水，得陇右英杰姜伯约归汉！');
                spawnMapFloatingText(`天水大捷！降收姜维！`, city.lat, city.lng, '#38bdf8', 1.4);
            } else if (wp.id === 'city_changan') {
                this.onVictory(army);
                return;
            }

            this.waypointIndex++;
            if (this.waypointIndex >= ROUTE.length) {
                this.onVictory(army);
                return;
            }
        }

        // 锁定目标城池
        const target = ROUTE[this.waypointIndex];
        if (target && army.expeditionTargetCityId !== target.id) {
            army.expeditionTargetCityId = target.id;
            gameLog('expedition', `📜 [北伐中原] 诸葛亮·白毦军进军目标：【${target.name}】`);
            this.deps.kickLegionAi?.(army.id);
        }
    }

    /** 专属野战①：街亭阻击战 */
    private checkJietingAmbush(army: ScriptArmy): boolean {
        if (this.jietingPhase !== 'pending') return false;
        const currentTarget = ROUTE[this.waypointIndex];
        if (!currentTarget || currentTarget.id !== 'city_longzhou') return false;

        const jietingCity = this.deps.cityManager.getCity('city_longzhou');
        if (!jietingCity) return false;

        const dist = getEuclideanDistance(army.lat, army.lng, jietingCity.lat, jietingCity.lng);
        if (dist <= JIETING_TRIGGER_DIST) {
            this.jietingPhase = 'spawned';
            this.spawnJietingEnemy(army, jietingCity);
            return true;
        }
        return false;
    }

    private spawnJietingEnemy(zhugeArmy: ScriptArmy, targetCity: any): void {
        const roadPos = roadRegistry.nearestRoadPoint(targetCity.lat, targetCity.lng) || {
            lat: targetCity.lat,
            lng: targetCity.lng,
        };

        const enemy = this.deps.legionManager.createLegion({
            name: '魏·张郃先锋骑',
            factionId: ZHANGHE_FACTION,
            homeCityId: targetCity.id,
            troops: ZHANGHE_TROOPS,
            lat: roadPos.lat,
            lng: roadPos.lng,
            generalId: ZHANGHE_GENERAL,
            isElite: true,
        }) as ScriptArmy | undefined;

        if (!enemy) {
            this.jietingPhase = 'defeated';
            return;
        }

        applyLegionCultureComposition(enemy as any, 'CENTRAL', ZHANGHE_TROOPS);
        enemy.expeditionUnlocked = true;
        this.jietingEnemyId = enemy.id;
        this.jietingPhase = 'engaged';

        spawnMapFloatingText(
            '街亭告急！张郃大军截击！',
            enemy.lat,
            enemy.lng,
            '#ef4444',
            1.5
        );
        speechAnnouncer.playSpeech('zhugeliang_jieting', '街亭之战爆发！丞相亲督连弩全歼魏军先锋！');
        gameLog(
            'expedition',
            `⚔️ [街亭之战] 魏先锋大将张郃率 5 万精骑截击街亭！诸葛亮白毦军正面接战！`
        );

        this.deps.kickLegionAi?.(enemy.id);
        this.deps.kickLegionAi?.(zhugeArmy.id);
    }

    /** 专属野战②：上方谷/渭水决战 */
    private checkShangfangAmbush(army: ScriptArmy): boolean {
        if (this.shangfangPhase !== 'pending') return false;
        const currentTarget = ROUTE[this.waypointIndex];
        if (!currentTarget || currentTarget.id !== 'city_qishan') return false;

        const qishanCity = this.deps.cityManager.getCity('city_qishan');
        if (!qishanCity) return false;

        const dist = getEuclideanDistance(army.lat, army.lng, qishanCity.lat, qishanCity.lng);
        if (dist <= SHANGFANG_TRIGGER_DIST) {
            this.shangfangPhase = 'spawned';
            this.spawnShangfangEnemy(army, qishanCity);
            return true;
        }
        return false;
    }

    private spawnShangfangEnemy(zhugeArmy: ScriptArmy, targetCity: any): void {
        const roadPos = roadRegistry.nearestRoadPoint(targetCity.lat, targetCity.lng) || {
            lat: targetCity.lat,
            lng: targetCity.lng,
        };

        // 诸葛亮决战前整编补至 5 万
        if (zhugeArmy.getTroops() < ZHUGE_REINFORCE_TROOPS) {
            zhugeArmy.setTroops(ZHUGE_REINFORCE_TROOPS);
        }

        const enemy = this.deps.legionManager.createLegion({
            name: '魏·司马懿关中军',
            factionId: SIMAYI_FACTION,
            homeCityId: targetCity.id,
            troops: SIMAYI_TROOPS,
            lat: roadPos.lat,
            lng: roadPos.lng,
            generalId: SIMAYI_GENERAL,
            isElite: true,
        }) as ScriptArmy | undefined;

        if (!enemy) {
            this.shangfangPhase = 'defeated';
            return;
        }

        applyLegionCultureComposition(enemy as any, 'CENTRAL', SIMAYI_TROOPS);
        enemy.expeditionUnlocked = true;
        this.shangfangEnemyId = enemy.id;
        this.shangfangPhase = 'engaged';

        spawnMapFloatingText(
            '五丈原渭水对峙！上方谷决战！',
            enemy.lat,
            enemy.lng,
            '#ef4444',
            1.6
        );
        speechAnnouncer.playSpeech('zhugeliang_shangfang', '五丈原渭水对峙，上方谷大决战爆发！');
        gameLog(
            'expedition',
            `⚔️ [上方谷决战] 曹魏大都督司马懿率 8 万主力背水列阵！诸葛亮火攻连弩齐发！`
        );

        this.deps.kickLegionAi?.(enemy.id);
        this.deps.kickLegionAi?.(zhugeArmy.id);
    }

    /** 终点长安大捷圆梦 */
    private onVictory(army: ScriptArmy): void {
        army.expeditionTargetCityId = null;
        spawnMapFloatingText(
            '克复长安！还于旧都！季汉功成！',
            army.lat,
            army.lng,
            '#f59e0b',
            2.0
        );
        speechAnnouncer.playSpeech(
            'zhugeliang_win',
            '千载遗恨，今朝圆梦！诸葛丞相克复长安，还于旧都，季汉一统天下归心！'
        );
        gameLog(
            'expedition',
            `🏆 [克复旧都] 诸葛亮·白毦军攻克大城长安！兴复汉室，还于旧都，天下归心！`
        );
        this.stop();
    }

    public stop(): void {
        if (this.timer != null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
        (window as any).__zhugeliangExpeditionActive = false;
        this.deps.cityManager.refreshFactionFlagText?.(FACTION_ID);
        this.restoreFactionName();
        this.unmuteGameAnnouncements();

        if (this.armyId) {
            const army = this.deps.legionManager.getLegionById(this.armyId);
            if (army) {
                army.expeditionTargetCityId = null;
            }
        }
        this.armyId = null;
    }
}
