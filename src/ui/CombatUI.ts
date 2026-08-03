import { getFactionGeneral, getGeneralRecordByGeneralId, setGeneralPortraitOverride } from '../data/FactionGenerals';
import { registerPortraitPathRuntime, unregisterPortraitPathRuntime } from '../config/portrait_defaults';
import { Battle, IBattleUnit } from '../core/CombatSystem';
import { BattleField } from '../core/BattleField';
import { SPRITE_PATHS, GameConfig } from '../config/GameConfig';
import {
    BATTLE_PORTRAIT_FALLBACK,
    getCombatPortraitPath,
    getRandomRegionPortraitPath,
    normalizePortraitWebPath,
    portraitUrlsEqual,
    resolvePortraitAssetPath,
    resolvePortraitSourceFacing,
    shouldMirrorPortraitForSide,
    type PortraitSourceFacing,
} from '../config/portrait_defaults';
import { resolveUnitCultureRegion } from '../systems/CultureCombat';
import { alignPortraitCenterFromUrl } from '../config/portraitAutoFit';
import {
    applyPortraitAdjustToElement,
    extractPortraitFolder,
    getPortraitCorrectorCrosshairGuide,
    resolvePortraitAdjust,
} from '../config/PortraitAdjust';
import {
    DEFAULT_PORTRAIT_ADJUST,
    PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X,
    PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y,
    type PortraitAdjustData,
    type PortraitAdjustValues,
} from '../data/portrait_adjust';
import { COMBAT_UI_TOKENS, COMBAT_UI_SCALE, uiPx } from '../config/combat-ui-tokens';
import { PortraitConfigManager } from '../core/PortraitConfigManager';
import { getUnitCultureCombatMultiplier, getEliteCombatMultiplier, getCultureOnlyCombatMultiplier, getPassGarrisonCombatMultiplier, getRegionCenterCombatMultiplier, getUnitEliteTier } from '../systems/CultureCombat';
import type { LandTerrainKind } from '../world/land-sea';
import { resolveGeneralTacticalEntry } from '../combat/TacticalSkillResolver';
import { EFFECT_TO_SIX_SET, type TacticalSixSet } from '../data/TacticalSkillCatalog';
import {
    getOpeningTacticalPowerMultiplier,
    getGeneralSkillDisplayTags,
    getPassGarrisonDefenseSkillDisplay,
    getRegionCenterDefenseSkillDisplay,
    getReinforcementJoinSkillDisplay,
    canUnitUseGeneralSkills,
    getBattleTerrainKind,
    resolveSkillPulseStaggerSec,
    SKILL_PULSE_STAGGER_IDEAL_SEC,
    PHASE_STALEMATE_START,
    PHASE_COLLAPSE_START,
    pickSideSkillGeneralUnit,
    resolveStalemateUiThresholdSec,
    resolveSituationalSkillId,
    getAttackStylePowerMult,
    getAptitudePowerMult,
    getFamousGeneralMult,
    getActiveTacticalSkillId,
} from '../combat/GeneralSkillCombat';
import { PASS_GARRISON_DEFENSE_SKILL, REGION_CENTER_DEFENSE_SKILL, getGeneralProfile } from '../data/GeneralSkills';
import { readSiegeGarrisonEliteName } from '../combat/SiegeGarrisonTier';
import { getCityEliteConfig, getLegionEliteLegionName } from '../data/ExpeditionLegions';
import type { Army } from '../legion/Army';
import { speechAnnouncer, type CaptureJu } from '../audio/SpeechAnnouncer';
import { audioManager } from '../audio/AudioManager';
const T = COMBAT_UI_TOKENS;

/**
 * 拉锯条交界安全带（2026-07-31 修）——兵力悬殊时交界线连同落后方血槽整段滑进立绘底下的修复。
 *
 * 【几何】全部由 tokens 推导，改立绘槽宽/血条宽自动跟随，不留裸数字：
 *   立绘内缘 **不是** 立绘槽的内缘——`createPortraitFrame` 是 overflow: visible，
 *   而 `createPortraitClip` 只钉死高度（550）、宽度由图片长宽比撑出来，
 *   所以真正压住血条的是「绘制宽度 = 550 × 长宽比 × 滑入/脉冲放大」。
 *   [2026-07-31 实测] 立绘统一 768×1024 → 长宽比 0.75，绘制宽 431 设计 px，
 *   立绘内缘落在拉锯条的 80.5%（按槽宽算会得到 83.0%，偏乐观 22 屏 px，曾据此定过一版没救住）。
 *
 * 【标尺剧本（2026-07-31 主人定稿·逐字规格）】战斗 30 秒 = 12 / 12 / 6：
 *   开局        标尺在**正中 50**（铁律，见 memory: bar-opening-always-centered），
 *               再用 2 秒按兵力比"进入"到位
 *   第一阶段    相持 12 秒，标尺停在真实兵力比上，**不封顶**
 *   第二阶段    一边倒 12 秒，标尺移到 **80%** 左右（悬殊局是往回退，均势局是往外推）
 *   第三阶段    6 秒 = 在 80% 左右**大幅摇摆**相持 5 秒 + 断崖 1 秒**直接到底结束**
 *   80/20 与断崖终点**都不看兵力比**；只有第一阶段看。
 *   12/12/6 恰好等于三幕常量 0.4/0.8，故血条与攻城火、武将技脉冲天然同步，不另起时间轴。
 *
 * 【为什么原来的 75/25 没救到】那条线写成 `Math.max(75, r0)`，只防回拉不防越界；
 *   悬殊局 r0 本身就是 90+，僵持线跟着停在 90+，**整个僵持段都在血条尾端的立绘底下**。
 *   现在第二、三阶段的落点是常数，与兵力比无关，再悬殊也不会退到尾端。
 *   注：主人明确要求第一阶段不封顶，故 10万:1万 那 10 秒标尺仍在 90.9%（立绘后），这是既定取舍。
 *
 * 【只改血条】三幕常量 PHASE_STALEMATE_START / PHASE_COLLAPSE_START（0.4/0.8）继续管
 *   攻城三坨火与武将技脉冲，**不动**；血条走自己下面这套三等分时间轴。
 */
const PORTRAIT_CLIP_HEIGHT_DESIGN = 550;
/** 立绘长宽比（宽/高）：2026-07-31 抽样 80 张，全部 768×1024 或 765×1024 → 0.75 */
const PORTRAIT_ASPECT_W_OVER_H = 0.75;
/** 滑入/技能脉冲把立绘框放大到 1.045（transform-origin: center bottom），最宽时刻按这个算 */
const PORTRAIT_MAX_SCALE = 1.045;
/** 第二、三阶段的落点（主人定 80% 左右），与兵力比无关 */
const CLASH_STALEMATE_PCT = 80;
/** 第三阶段内部切分：前 5/6 相持（5 秒），后 1/6 断崖（1 秒） */
const BAR_CLIFF_START = 5 / 6;
/**
 * 「按兵力比进入」占第一阶段的比例 = 1，即**整个第一阶段 12 秒**都在从正中往兵力比爬。
 * 接上第二阶段的 12 秒（兵力比 → 80%），就是主人要的「24 秒逐步进入」一气呵成。
 * 曾取 1/6（2 秒）——太快，开局居中那一下几乎看不见，被主人当场否掉。
 */
const BAR_ENTER_RATIO_OF_ACT1 = 1;
/**
 * 第一阶段的缓动幂次：越大越"黏"。2 = 半程只走完 1/4，前 6 秒基本还在中间附近磨，
 * 后 6 秒才明显拉开——这才是「相持」。1 = 匀速，3 = 末段过于突兀。
 */
const BAR_ACT1_EASE_POWER = 2;
/** 第一阶段摆幅（小幅角力，不与开战语音抢戏） */
const BAR_SWING_ACT1 = 1;
/** 第二阶段摆幅：起手拉满 4 → 收束到 1，与「一边倒」的推进叠加 */
const BAR_SWING_ACT2_FROM = 4;
const BAR_SWING_ACT2_TO = 1;
/** 第三阶段相持的摆幅（主人要「大浮动摇摆」，故远大于前两阶段的收束值） */
const BAR_SWING_ACT3 = 4;
/** 溃败悬停（2026-08-03 主人定）：败方兵力数字减到初始的该比例即停住（残兵困守），
 *  断崖 1 秒内随条子 u^6 同步崩到 0（兵败如山倒）。纯显示层，不碰引擎实际兵力。 */
const LOSER_HOLD_PCT = 0.10;

/**
 * 文化标签文案表：技能条上那枚「能征惯战 / 山河险固」样式的名牌。
 *
 * 键 = `GameConfig.CULTURE_COMBAT.TIER_TABLE` 里的系数档（野战取 [0]，守军取 [1]）。
 *
 * ⚠️ **改六维表时必须同步这里**：2026-07-29 把青藏/日本野战改成 1.05、西域守军改成 1.15，
 *    而当时这两张表没有对应档位，`LABELS[round] ?? ''` 直接返回空串 → 文化标签整枚消失且零报错。
 *    西亚野战 1.05 更是从加入那天起就一直没标签。教训：查不到不能静默吞掉。
 *    现已改为**就近取档兜底**（下面的 resolveCultureTagLabel），并由 `npm run culture:audit`
 *    校验六维表里每个攻/防档位都能精确命中一个标签。
 */
const CULTURE_TAG_ATK_LABELS: Record<number, string> = {
    1.20: '侵略如火', 1.15: '骁勇善战', 1.10: '能征惯战', 1.05: '士马精强',
    1.00: '习于行阵', 0.95: '缮甲厉兵', 0.90: '据阵自保', 0.85: '力战自守', 0.80: '堪以一战',
};
const CULTURE_TAG_DEF_LABELS: Record<number, string> = {
    1.20: '山河险固', 1.15: '金城汤池', 1.10: '城池为固', 1.05: '堡山而立',
    1.00: '据城而守', 0.95: '凭城为守', 0.90: '山城自顾', 0.85: '土垣自蔽', 0.80: '无遮无蔽',
};

/** 取文化标签；档位未精确命中时就近取档（绝不返回空串让标签凭空消失） */
export function resolveCultureTagLabel(mult: number, isGarrison: boolean): string {
    const table = isGarrison ? CULTURE_TAG_DEF_LABELS : CULTURE_TAG_ATK_LABELS;
    const exact = table[mult];
    if (exact) return exact;
    let best = '';
    let bestGap = Infinity;
    for (const k of Object.keys(table)) {
        const gap = Math.abs(parseFloat(k) - mult);
        if (gap < bestGap) { bestGap = gap; best = table[parseFloat(k)]; }
    }
    return best;
}

/** 供审计脚本核对覆盖率：该系数档是否在文案表里有**精确**对应（就近兜底不算命中） */
export function hasCultureTagLabel(mult: number, isGarrison: boolean): boolean {
    return !!(isGarrison ? CULTURE_TAG_DEF_LABELS : CULTURE_TAG_ATK_LABELS)[mult];
}

/** 战报技能条/系数链：精锐（第 7 环）用番号专名作标签（去「军团」等尾缀） */
function getLegionEliteBadgeName(unit: IBattleUnit): string {
    if (unit.unitType === 'city') {
        const eliteName = readSiegeGarrisonEliteName(unit.getEntity?.());
        if (eliteName) return eliteName;
    }
    // 优先实时军团名（精锐改名/远征改名），勿死读 adapter 创建时快照
    const army = unit.getEntity?.() as Army | undefined;
    const live = (army?.name ?? '').trim();
    const elite = army ? getLegionEliteLegionName(army) : null;
    const raw = (live || elite || unit.name || '').trim();
    if (!raw) return '精锐';
    const match = raw.match(/(军团|驻军|守军)$/);
    const stripped = match ? raw.substring(0, match.index).trim() : raw;
    return stripped || raw;
}

/** 精锐五级 → 二字标签（2026-07-16）。按 unit 所属据点查精锐，不依赖 army.isElite */
function getEliteTierLabel(unit: IBattleUnit): string | null {
    const tier = getUnitEliteTier(unit);
    if (tier !== null) {
        const LABELS = ['天神军', '王者师', '劲锐旅', '精英团', '戍卫营'];
        return LABELS[tier] ?? null;
    }
    // fallback：从 entity 的 cityId 直接查精锐 config
    const entity = unit.getEntity?.() as { homeCityId?: string; getSourceCityId?: () => string | null } | undefined;
    const cityId = entity?.homeCityId ?? entity?.getSourceCityId?.() ?? null;
    if (cityId) {
        const config = getCityEliteConfig(cityId);
        if (config?.tier !== undefined) {
            const LABELS = ['天神军', '王者师', '劲锐旅', '精英团', '戍卫营'];
            return LABELS[config.tier] ?? null;
        }
    }
    return null;
}

export class CombatUI {
    private container: HTMLDivElement;
    private leftPortrait!: HTMLImageElement;
    private rightPortrait!: HTMLImageElement;
    /** scaleX 仅在此层；frame 负责进场位移，img 不挂 transform */
    private leftPortraitWrap!: HTMLDivElement;
    private rightPortraitWrap!: HTMLDivElement;
    private leftPortraitFrame!: HTMLDivElement;
    private rightPortraitFrame!: HTMLDivElement;
    private leftGeneralNameTag!: HTMLDivElement;
    private rightGeneralNameTag!: HTMLDivElement;
    private leftFamousBadge!: HTMLDivElement;
    private rightFamousBadge!: HTMLDivElement;
    private indicatorLeftYou!: HTMLDivElement;
    private indicatorLeftLie!: HTMLDivElement;
    private indicatorRightYou!: HTMLDivElement;
    private indicatorRightLie!: HTMLDivElement;
    private indicatorJun!: HTMLDivElement;
    private leftCenterSixBadge!: HTMLSpanElement;
    private rightCenterSixBadge!: HTMLSpanElement;
    private centerSixBadgeGroup!: HTMLDivElement;

    /** 技能脉冲状态：同名技能一局只放一次；双方撞车时后到方延后错开 */
    private skillPulseShownKeys = new Set<string>();
    /** 已燃时刻表（P1）：技能 Cut-in 实际弹出时刻 → 1.9s（surge 播完）后标签进入已燃态 */
    private readonly skillSpentAt = new Map<string, number>();
    /** 胜负定格（P0）：true 时 updateStats 不再覆写拉锯条/交界（终态已由 showBattleOutcome 写死） */
    private outcomeLocked = false;
    /** 第三幕剧本锚点（2026-07-18 主人定）：进入第三幕瞬间的真实攻方%，崩溃/僵持/断崖从此起算 */
    private collapseStartAttPct: number | null = null;
    private skillPulseLastAt = 0;
    private skillPulseTimers: number[] = [];
    /** 同场双方技能连放时仅首句插技能音效（无语音兜底路径） */
    private skillBurstSfxPlayed = false;
    /**
     * 蓄力收缩（winddown）：会放技的一侧立绘从沉降后的 1.0 继续缓缩到 0.94，
     * 到相持阈值（技能亮相时刻）缩到底，脉冲从收缩值弹起 → 一收一放对比更狠。
     * 无技可放侧【不缩】（主人定：单侧缩到底没有回弹，两边立绘不对称）。
     * 逐帧按游戏内 elapsed 驱动（CSS 动画走真实时间，倍速下会漂移，故不用）。只动外框，不碰 img 调校。
     */
    private portraitWind: Record<'attacker' | 'defender', { driving: boolean; pulsed: boolean; scale: number; lastE?: number }> = {
        attacker: { driving: false, pulsed: false, scale: 1 },
        defender: { driving: false, pulsed: false, scale: 1 },
    };
    /** 蓄力收缩主段目标比例（线性缓缩到 0.90；主人定：要慢、要一直缩到释放） */
    private static readonly PORTRAIT_WIND_MIN_SCALE = 0.90;
    /** 主段走完后若技能仍未释放：继续极缓下潜的每秒速率与硬底（别停，直至释放） */
    private static readonly PORTRAIT_WIND_DRIFT_PER_SEC = 0.004;
    private static readonly PORTRAIT_WIND_FLOOR = 0.88;
    /** 慢直播：双方技能 Cut-in 理想错开（与 GeneralSkillCombat 同步） */
    private static readonly SKILL_PULSE_STAGGER_MS = SKILL_PULSE_STAGGER_IDEAL_SEC * 1000;

    // UI Elements
    private centerBackdrop!: HTMLDivElement;
    private centerPanel!: HTMLDivElement;
    private topInfoRow!: HTMLDivElement;
    private healthBarContainer!: HTMLDivElement;
    private leftTotalMultBadge!: HTMLSpanElement;
    private rightTotalMultBadge!: HTMLSpanElement;
    private attackerBar!: HTMLDivElement;
    private defenderBar!: HTMLDivElement;
    private clashEffect!: HTMLDivElement;
    private bottomInfoRow!: HTMLDivElement;
    private sideStatsRow!: HTMLDivElement;
    private skillsRow!: HTMLDivElement;
    private leftSkillsBox!: HTMLDivElement;
    private rightSkillsBox!: HTMLDivElement;

    // Text Elements
    private leftSideLabel!: HTMLDivElement;
    private rightSideLabel!: HTMLDivElement;
    private leftSideNameSpan!: HTMLSpanElement;
    private leftSideTroopsSpan!: HTMLSpanElement;
    private rightSideNameSpan!: HTMLSpanElement;
    private rightSideTroopsSpan!: HTMLSpanElement;
    private battleTitle!: HTMLDivElement;
    private battleYear!: HTMLDivElement;
    private eventDescription!: HTMLDivElement;
    /** 侧栏展示用名称（不含兵力，由 updateStats 拼成「名称: 兵力」） */
    private attackerDisplayName = '';
    private defenderDisplayName = '';
    private attackerFactionId: string | null = null;
    private defenderFactionId: string | null = null;
    private leftMultBadge: HTMLSpanElement | null = null;
    private rightMultBadge: HTMLSpanElement | null = null;
    private leftFactionNameSpan!: HTMLSpanElement;
    private rightFactionNameSpan!: HTMLSpanElement;
    private leftFactionMultSpan!: HTMLSpanElement;
    private rightFactionMultSpan!: HTMLSpanElement;
    private leftCultureBadge!: HTMLSpanElement;
    private rightCultureBadge!: HTMLSpanElement;
    private leftSkillBadge!: HTMLSpanElement;
    private rightSkillBadge!: HTMLSpanElement;
    private leftLegionBadge!: HTMLSpanElement;
    private rightLegionBadge!: HTMLSpanElement;
    private leftLuckBadge!: HTMLSpanElement;
    private rightLuckBadge!: HTMLSpanElement;
    private leftAptitudeBadge!: HTMLSpanElement;
    private rightAptitudeBadge!: HTMLSpanElement;
    private leftReinfJoinBadge!: HTMLSpanElement;
    private rightReinfJoinBadge!: HTMLSpanElement;
    private leftReinfRow!: HTMLDivElement;
    private rightReinfRow!: HTMLDivElement;
    private leftReinfNameSpan!: HTMLSpanElement;
    private leftReinfTroopsSpan!: HTMLSpanElement;
    private leftReinfMultBadge!: HTMLSpanElement;
    private rightReinfNameSpan!: HTMLSpanElement;
    private rightReinfTroopsSpan!: HTMLSpanElement;
    private rightReinfMultBadge!: HTMLSpanElement;

    private currentBattle: Battle | null = null;
    private currentRegionalUnits: { attackers: IBattleUnit[], defenders: IBattleUnit[] } | null = null;
    private isVisible: boolean = false;
    private static readonly REGIONAL_TAIL_MS = 3000; // 短尾 3 秒：容纳战报定格卡 + 败方褪灰
    /** 无战场绑定时兜底（现实毫秒） */
    private static readonly REGIONAL_FALLBACK_MS = 65_000;
    private regionalHideTimer: ReturnType<typeof setTimeout> | null = null;
    /** 绑定战场后按「剩余游戏时长」刷新，避免援军加时 / 暂停时 UI 提前关 */
    private regionalSafetyDeadline = 0;
    private boundRegionalBattleField: BattleField | null = null;
    /** 旧版 1v1 Battle 无 BattleField 时，用此字段供徽章识别攻城/野战 */
    private currentBattleType: import('../combat/CombatSystem').BattleType | undefined;
    private lastTimeScale = 1;

    // Interactive Customization (Per-Event Keying)
    private fileInput!: HTMLInputElement;
    private currentBattleKey: string = '';
    private tempIsLeft: boolean = true;
    public portraitConfig: PortraitConfigManager;
    private portraitSourceFacing: Record<'attacker' | 'defender', PortraitSourceFacing> = {
        attacker: 'right',
        defender: 'right',
    };

    /** 旧版右键翻转曾用泛用标题作 key，勿再让 mirror 覆盖自动朝向 */
    private static readonly LEGACY_GENERIC_PORTRAIT_KEYS = new Set(['区域冲突']);

    /** 暂停钩子（GameApp 注入 timeSystem），游戏内校正立绘时暂停推演 */
    public pauseHook?: { setPaused(p: boolean): void; isGamePaused(): boolean };
    /** 立绘校正面板（游戏内一键校正 + 方向键微调 + 保存） */
    private correctorOpen = false;
    private correctorSide: 'attacker' | 'defender' = 'attacker';
    private correctorPanel: HTMLDivElement | null = null;
    private correctorPrevPaused = false;
    /** 实时预览用：DEFAULT_PORTRAIT_ADJUST 的工作副本，仅覆盖当前编辑张 */
    private correctorData: PortraitAdjustData = structuredClone(DEFAULT_PORTRAIT_ADJUST);
    /** 上次开战时从磁盘刷新调校的时间（节流用，混战时开战频繁） */
    private correctorLastDiskFetchMs = 0;
    private correctorDraft: Required<PortraitAdjustValues> = { scale: 1, offsetX: 0, offsetY: 0 };
    /** 本场 F2 内改过的立绘路径；Esc 退出时一并写盘 */
    private correctorDirtyPaths = new Set<string>();
    /** 每累积 N 张不同立绘自动触发一次写盘（防页面崩溃丢失调校） */
    private static readonly AUTO_SAVE_EVERY = 10;
    /** 十字准星参照线（竖中线 + 24% 眼线）开关与元素 */
    private correctorCrosshairOn = true;
    /** F2 打开前 Leaflet 键盘缩放是否启用（关闭 F2 时恢复） */
    private correctorMapKeyboardWasEnabled = true;
    private leftCrosshair: HTMLDivElement | null = null;
    private rightCrosshair: HTMLDivElement | null = null;
    private crosshairBtn: HTMLButtonElement | null = null;

    /** F2 开启时：点击武将名 → 选文件夹 + 绑立绘 */
    private portraitPickerPanel: HTMLDivElement | null = null;
    private portraitPickerGrid: HTMLDivElement | null = null;
    private portraitPickerStatus: HTMLDivElement | null = null;
    private portraitPickerTitle: HTMLDivElement | null = null;
    private portraitPickerFolderSelect: HTMLSelectElement | null = null;
    /** 浏览与绑定共用：该夹下列图，并写入 {generalId}.png */
    private portraitPickerFolder = '/assets/inbox/';
    private portraitPickerCatalog: { folder: string; label: string; images: string[] }[] = [];
    private portraitPickerGeneralId: string | null = null;
    private portraitPickerSide: 'attacker' | 'defender' | null = null;
    private portraitPickerSelectedPath: string | null = null;
    private portraitPickerOpen = false;
    /** 选图器 catalog 版本号（写盘/绑图后 bump，强制缩略图 cache-bust） */
    private portraitPickerCatalogRev = 0;
    private portraitBindStaging: {
        generalId: string;
        sourcePath: string;
        targetFolder: string;
        side: 'attacker' | 'defender';
        destPath: string;
    }[] = [];

    constructor() {
        document.querySelectorAll('#combat-ui-panel').forEach((el) => el.remove());
        this.portraitConfig = new PortraitConfigManager();
        this.injectGlobalStyles();
        this.container = this.createContainer();
        this.createElements();
        document.body.appendChild(this.container);
        // F2 立绘校正/绑定是开发期专用工具（依赖 dev-only 写盘 API），与右侧调试面板一样
        // 仅在 DEV 启用；生产构建 import.meta.env.DEV 恒为 false，此调用被 dead-code 剥离。
        if (import.meta.env.DEV) {
            this.setupCorrectorHotkeys();
        }
    }

    // [NEW] Inject Keyframes for high-end animations
    private injectGlobalStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&family=Cinzel:wght@700&display=swap');

            @keyframes text-shimmer {
                0% { text-shadow: 0 0 5px rgba(255,215,0,0.3); }
                50% { text-shadow: 0 0 15px rgba(255,215,0,0.8), 0 0 30px rgba(255,100,0,0.6); }
                100% { text-shadow: 0 0 5px rgba(255,215,0,0.3); }
            }
            @keyframes clash-pulse {
                0% { opacity: 0.8; box-shadow: 0 0 12px #FFD700, 0 0 20px rgba(255, 120, 40, 0.5); }
                50% { opacity: 1; box-shadow: 0 0 24px #FFD700, 0 0 40px rgba(255, 120, 40, 0.9), 0 0 60px rgba(255, 80, 20, 0.4); }
                100% { opacity: 0.8; box-shadow: 0 0 12px #FFD700, 0 0 20px rgba(255, 120, 40, 0.5); }
            }
            @keyframes troop-pulse {
                0% { transform: scale(1); }
                40% { transform: scale(1.12); }
                100% { transform: scale(1); }
            }
            @keyframes tactical-skill-pop {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
                15% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
                85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.15); }
            }
            /* 武将技释放：立绘快速放大 → 缓缓复原（动外框，不碰 img 调校）
               起点读 --pre-scale：蓄力收缩(winddown)把立绘缓缩到 0.90 后，从收缩值直接弹到 1.1，
               对比幅度 ≈ +22%，爆发感更强。无蓄力时回退 scale(1)，行为同旧版。 */
            @keyframes portrait-skill-surge {
                0% { transform: scale(var(--pre-scale, 1)); animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
                15% { transform: scale(1.10); animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1); }
                100% { transform: scale(1); }
            }
            @keyframes skill-cut-in {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                10% { 
                    transform: translate(-50%, -50%) scale(1.1); 
                    opacity: 1; 
                }
                15% { transform: translate(-50%, -50%) scale(1.0); }
                85% { 
                    transform: translate(-50%, -50%) scale(1.05); 
                    opacity: 1; 
                }
                100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0; }
            }
            @keyframes panel-entrance {
                0% { transform: translate(-50%, 250%); }
                60% { transform: translate(-50%, -6px); }
                80% { transform: translate(-50%, 3px); }
                100% { transform: translate(-50%, 0); }
            }
            /* 立绘外框进场：左从左→右，右从右→左；overshoot 越位再弹回 */
            @keyframes portrait-frame-enter-left {
                0%   { opacity: 0; transform: translateX(-150px) scale(1.045); }
                70%  { opacity: 1; transform: translateX(6px)   scale(1.045); }
                100% { opacity: 1; transform: translateX(0)     scale(1.045); }
            }
            @keyframes portrait-frame-enter-right {
                0%   { opacity: 0; transform: translateX(150px) scale(1.045); }
                70%  { opacity: 1; transform: translateX(-6px)  scale(1.045); }
                100% { opacity: 1; transform: translateX(0)     scale(1.045); }
            }
            /* 胜负定格（2026-07-18 主人定 P0）：「XX 勝」标题弹出 */
            @keyframes outcome-title-pop {
                0% { transform: scale(1.35); opacity: 0.3; filter: brightness(2.2) drop-shadow(0 0 26px rgba(255, 215, 0, 0.9)); }
                60% { transform: scale(0.97); opacity: 1; }
                100% { transform: scale(1); filter: brightness(1) drop-shadow(0 2px 2px rgba(0,0,0,0.8)) drop-shadow(0 6px 12px rgba(0,0,0,0.6)); }
            }
            /* 胜负定格：clash 交界爆闪（末帧回到 clash-pulse 的原生辉光） */
            @keyframes clash-burst-flash {
                0% { filter: brightness(3.2); box-shadow: 0 0 30px #FFF, 0 0 64px #FFD700, 0 0 96px rgba(255, 120, 40, 0.95); }
                100% { filter: brightness(1); box-shadow: 0 0 16px #FFD700, 0 0 28px rgba(255, 120, 40, 0.6), 0 0 48px rgba(255, 80, 20, 0.25); }
            }
            /* 已燃技能标签（2026-07-18 主人定 P1）：放过的技不再复原——降亮度+金框；
               中途进场的观众一眼看出双方各放了几个技（悬念：谁还捏着技）。
               标签每帧由 updateSkillBadges 重建，此类在创建时按 skillSpentAt 补挂 */
            .skill-tag-spent {
                position: relative !important;
                filter: brightness(0.5) saturate(0.55) !important;
                border-color: rgba(255, 215, 0, 0.75) !important;
                border-bottom: 2px solid rgba(255, 215, 0, 0.9) !important;
                box-shadow: 0 0 10px rgba(255, 200, 60, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.12) !important;
            }
        `;
        document.head.appendChild(style);
    }

    private createContainer(): HTMLDivElement {
        const div = document.createElement('div');
        div.id = 'combat-ui-panel';
        div.style.cssText = `
            position: fixed;
            bottom: 0; 
            left: 50%;
            transform: translate(-50%, 250%);
            width: ${uiPx(T.panelWidth)};
            height: ${uiPx(T.panelHeight)};
            background: transparent;
            padding: 0;
            z-index: ${T.zIndex.panel};
            pointer-events: none;
            overflow: visible;
        `;

        return div;
    }

    /** 顶饰金线：仅铺在左右立绘之间的中栏顶部（不画在立绘区） */
    private createCenterGoldAccent(): HTMLDivElement {
        const accent = document.createElement('div');
        accent.style.cssText = `
            position: absolute;
            top: 0;
            left: 5%;
            right: 5%;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.6) 20%, rgba(253, 185, 49, 0.85) 50%, rgba(255, 215, 0, 0.6) 80%, transparent 100%);
            pointer-events: none;
        `;
        return accent;
    }

    private createElements() {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/png, image/jpeg';
        this.fileInput.style.display = 'none';
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.container.appendChild(this.fileInput);

        // --- PORTRAITS + 侧栏军名/兵力 ---
        const leftFrame = this.createPortraitFrame();
        this.leftPortraitFrame = leftFrame;
        leftFrame.style.left = uiPx(T.portraitInset + T.portraitPullToCenter);
        leftFrame.style.pointerEvents = 'auto';
        this.leftPortraitWrap = this.createPortraitFacingWrap('left');
        this.leftPortrait = this.createPortraitImage();
        this.setupPortraitInteraction(this.leftPortrait, true);
        const leftClip = this.createPortraitClip();
        leftClip.appendChild(this.leftPortrait);
        this.leftPortraitWrap.appendChild(leftClip);
        leftFrame.appendChild(this.leftPortraitWrap);
        this.leftGeneralNameTag = this.createGeneralNameTag('left');
        leftFrame.appendChild(this.leftGeneralNameTag);
        this.leftFamousBadge = this.createFamousBadge('left');
        leftFrame.appendChild(this.leftFamousBadge);

        const rightFrame = this.createPortraitFrame();
        this.rightPortraitFrame = rightFrame;
        rightFrame.style.right = uiPx(T.portraitInset + T.portraitPullToCenter);
        rightFrame.style.pointerEvents = 'auto';
        this.rightPortraitWrap = this.createPortraitFacingWrap('right');
        this.rightPortrait = this.createPortraitImage();
        this.setupPortraitInteraction(this.rightPortrait, false);
        const rightClip = this.createPortraitClip();
        rightClip.appendChild(this.rightPortrait);
        this.rightPortraitWrap.appendChild(rightClip);
        rightFrame.appendChild(this.rightPortraitWrap);
        this.rightGeneralNameTag = this.createGeneralNameTag('right');
        rightFrame.appendChild(this.rightGeneralNameTag);
        this.rightFamousBadge = this.createFamousBadge('right');
        rightFrame.appendChild(this.rightFamousBadge);

        // --- 优劣均 兵力状态指示器（2026-07-18 应主人要求按 Git 旧实现恢复，仅此 UI）---
        const leftIndGroup = document.createElement('div');
        leftIndGroup.style.cssText = `position: absolute; bottom: 41.5%; right: -${uiPx(7)}; transform: translateX(50%); display: flex; gap: ${uiPx(8)}; z-index: 20; pointer-events: none;`;
        this.indicatorLeftYou = this.createIndicatorNode('优');
        this.indicatorLeftLie = this.createIndicatorNode('劣');
        leftIndGroup.appendChild(this.indicatorLeftYou);
        leftIndGroup.appendChild(this.indicatorLeftLie);
        leftFrame.appendChild(leftIndGroup);

        const rightIndGroup = document.createElement('div');
        rightIndGroup.style.cssText = `position: absolute; bottom: 41.5%; left: -${uiPx(7)}; transform: translateX(-50%); display: flex; gap: ${uiPx(8)}; z-index: 20; pointer-events: none;`;
        this.indicatorRightYou = this.createIndicatorNode('优');
        this.indicatorRightLie = this.createIndicatorNode('劣');
        rightIndGroup.appendChild(this.indicatorRightYou);
        rightIndGroup.appendChild(this.indicatorRightLie);
        rightFrame.appendChild(rightIndGroup);

        this.indicatorJun = this.createIndicatorNode('均');
        this.indicatorJun.style.position = 'absolute';
        this.indicatorJun.style.bottom = `calc(${uiPx(T.portraitBottom)} + ${uiPx(620 * 0.415)})`;
        this.indicatorJun.style.left = '50%';
        this.indicatorJun.style.transform = 'translateX(-50%)';
        this.indicatorJun.style.zIndex = '20';
        this.indicatorJun.style.pointerEvents = 'none';
        this.container.appendChild(this.indicatorJun);

        // 中央局势正下方的六计一字双角标
        this.centerSixBadgeGroup = document.createElement('div');
        this.centerSixBadgeGroup.style.cssText = `
            position: absolute;
            top: calc(100% + ${uiPx(4)});
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: ${uiPx(4)};
            z-index: 25;
            pointer-events: none;
            white-space: nowrap;
        `;
        this.leftCenterSixBadge = document.createElement('span');
        this.rightCenterSixBadge = document.createElement('span');
        this.centerSixBadgeGroup.appendChild(this.leftCenterSixBadge);
        this.centerSixBadgeGroup.appendChild(this.rightCenterSixBadge);
        this.indicatorJun.appendChild(this.centerSixBadgeGroup);

        this.wireGeneralNameTagClicks();
        this.refreshGeneralNameTagInteract();

        // --- 中栏黑底：椭圆径向 alpha 渐隐（勿 multiply + transparent），HUD 叠在上 ---
        const backdropEdge = uiPx(T.centerBackdropEdge);
        this.centerBackdrop = document.createElement('div');
        this.centerBackdrop.style.cssText = `
            position: absolute;
            left: -100px;
            right: -100px;
            top: 0;
            bottom: 0;
            z-index: 0;
            pointer-events: none;
            background: ${this.buildCenterBackdropBackground()};
            background-repeat: no-repeat;
            background-size: 100% 100%;
            -webkit-backdrop-filter: blur(8px);
            backdrop-filter: blur(8px);
            -webkit-mask-image: radial-gradient(ellipse 45% 100% at 50% 50%, black 75%, transparent 100%);
            mask-image: radial-gradient(ellipse 45% 100% at 50% 50%, black 75%, transparent 100%);
        `;

        this.centerPanel = document.createElement('div');
        this.centerPanel.style.cssText = `
            position: absolute;
            left: ${backdropEdge};
            right: ${backdropEdge};
            top: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: ${T.zIndex.centerCard};
            padding: ${uiPx(20)} ${uiPx(42)} ${uiPx(18)};
            box-sizing: border-box;
            pointer-events: auto;
            overflow: visible;
            background: transparent;
        `;
        this.centerPanel.appendChild(this.createCenterGoldAccent());

        // [NEW] Description Text (Minimal & Elegant)
        this.eventDescription = document.createElement('div');
        this.eventDescription.style.cssText = `
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(T.typography.descriptionSize)};
            color: rgba(216, 200, 160, 0.7);
            text-align: left; /* [MODIFIED] User requested left align for wrapped lines */
            max-width: ${uiPx(700)};
            margin-top: ${uiPx(15)};
            line-height: 1.6;
            letter-spacing: 1px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            display: none; /* Hidden by default */
        `;

        // 纪年副标题（叠深色地图：浅字 + 稳态黑描边，不用闪烁动画以免发虚）
        this.battleYear = document.createElement('div');
        this.battleYear.style.cssText = `
            font-family: 'Noto Serif SC', 'Cinzel', serif;
            font-size: ${uiPx(T.typography.yearSize)};
            font-weight: 700;
            color: ${T.typography.yearColor};
            letter-spacing: ${uiPx(4)};
            margin-top: ${uiPx(8)};
            margin-bottom: ${uiPx(6)};
            text-align: center;
            width: 100%;
            text-shadow:
                0 1px 2px rgba(0,0,0,1),
                0 2px 10px rgba(0,0,0,0.92),
                0 0 14px rgba(255,200,90,0.28);
            border-bottom: 1px solid rgba(255, 215, 0, 0.22);
            padding-bottom: ${uiPx(6)};
        `;


        // 1. Battle Title — 区域冲突稿：居中金色大标题
        this.battleTitle = document.createElement('div');
        this.battleTitle.style.cssText = `
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(T.typography.titleSize + 4)};
            font-weight: 900;
            color: transparent;
            background: linear-gradient(180deg, #fffcd5 0%, #ffdf73 35%, #d4951a 60%, #8f5a0a 100%);
            -webkit-background-clip: text;
            background-clip: text;
            letter-spacing: ${uiPx(10)};
            margin-bottom: ${uiPx(12)};
            white-space: nowrap;
            text-align: center;
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.8)) drop-shadow(0 6px 12px rgba(0,0,0,0.6));
        `;

        // 中央对峙条（攻橙 / 守蓝，参考稿主进度条）
        this.topInfoRow = document.createElement('div');
        this.topInfoRow.style.display = 'none';

        this.skillsRow = document.createElement('div');
        this.skillsRow.style.cssText = `
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: ${uiPx(6)};
            margin-bottom: ${uiPx(6)};
            padding: 0 ${uiPx(T.portraitHorizontalReserve)};
            box-sizing: border-box;
            pointer-events: none;
            z-index: ${T.zIndex.portrait + 2};
        `;
        this.leftSkillsBox = document.createElement('div');
        this.leftSkillsBox.style.cssText = `display: flex; gap: ${uiPx(4)}; flex-wrap: nowrap;`;
        this.rightSkillsBox = document.createElement('div');
        this.rightSkillsBox.style.cssText = `display: flex; gap: ${uiPx(4)}; flex-wrap: nowrap;`;
        this.skillsRow.appendChild(this.leftSkillsBox);
        this.skillsRow.appendChild(this.rightSkillsBox);

        this.leftTotalMultBadge = document.createElement('span');
        this.leftTotalMultBadge.style.cssText = `
            position: absolute;
            right: ${uiPx(64)};
            top: 50%;
            transform: translateY(-50%);
            z-index: 5;
            display: none;
            padding: 2px 8px;
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(14)};
            font-weight: 900;
            line-height: 1.15;
            border: 1px solid rgba(253, 185, 49, 0.9);
            color: #FFD700;
            background: rgba(35, 12, 4, 0.85);
            border-radius: 3px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.8), 0 0 6px rgba(255, 215, 0, 0.4);
            white-space: nowrap;
            pointer-events: auto;
            cursor: help;
        `;

        this.rightTotalMultBadge = document.createElement('span');
        this.rightTotalMultBadge.style.cssText = `
            position: absolute;
            left: calc(50% + ${uiPx(36)});
            top: 50%;
            transform: translateY(-50%);
            z-index: 5;
            display: none;
            padding: 2px 8px;
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(14)};
            font-weight: 900;
            line-height: 1.15;
            border: 1px solid rgba(90, 170, 190, 0.9);
            color: #70E0FF;
            background: rgba(5, 20, 30, 0.85);
            border-radius: 3px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.8), 0 0 6px rgba(90, 170, 190, 0.4);
            white-space: nowrap;
            pointer-events: auto;
            cursor: help;
        `;

        this.healthBarContainer = document.createElement('div');
        this.healthBarContainer.style.cssText = `
            width: 100%;
            max-width: ${uiPx(T.clashBarTrackWidth)};
            height: ${uiPx(T.clashBar.height + 4)};
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(6px);
            box-shadow:
                inset 0 0 0 1px rgba(255, 215, 0, 0.18),
                inset 0 2px 10px rgba(0,0,0,0.75),
                0 0 24px rgba(255, 140, 40, 0.15),
                0 0 18px rgba(70, 150, 180, 0.12);
            position: relative;
            margin-bottom: ${uiPx(8)};
            overflow: hidden;
            clip-path: polygon(
                8px 0, calc(100% - 8px) 0, 
                100% 8px, 100% calc(100% - 8px), 
                calc(100% - 8px) 100%, 8px 100%, 
                0 calc(100% - 8px), 0 8px
            );
        `;

        this.defenderBar = document.createElement('div');
        this.defenderBar.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: 
                repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.12) 4px, rgba(0,0,0,0.12) 8px),
                linear-gradient(90deg, #162530 0%, #2a5565 35%, #3d7a8f 65%, #5aacbe 100%);
            z-index: 1;
        `;

        this.attackerBar = document.createElement('div');
        this.attackerBar.style.cssText = `
            position: absolute;
            top: 0; left: 0; bottom: 0;
            width: 50%;
            background: 
                repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px),
                linear-gradient(90deg, #7a1528 0%, #b04818 30%, #d47020 60%, #f0a830 100%);
            z-index: 2;
            transition: width 0.45s cubic-bezier(0.16, 1, 0.3, 1);
            clip-path: polygon(0 0, 100% 0, calc(100% - ${uiPx(T.clashBar.clipPx)}) 100%, 0% 100%);
            box-shadow: inset 0 -3px 10px rgba(255, 200, 80, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        `;

        // 左牌挂 attackerBar 内部自然跟随；右牌挂 healthBarContainer（attackerBar 有 clip-path 会切掉外部子节点）
        this.attackerBar.appendChild(this.leftTotalMultBadge);

        this.clashEffect = document.createElement('div');
        this.clashEffect.style.cssText = `
            position: absolute;
            top: -2px;
            bottom: -2px;
            width: ${uiPx(T.clashBar.clashWidth)};
            background: linear-gradient(180deg, rgba(255,255,255,1.0), rgba(255, 230, 140, 0.95), rgba(255, 180, 60, 0.85));
            box-shadow: 0 0 16px #FFD700, 0 0 28px rgba(255, 120, 40, 0.6), 0 0 48px rgba(255, 80, 20, 0.25);
            z-index: 10;
            transform: skewX(-18deg);
            left: 50%;
            margin-left: -${uiPx(T.clashBar.clashWidth / 2 + 2)};
            pointer-events: none;
            transition: left 0.45s cubic-bezier(0.16, 1, 0.3, 1);
            animation: clash-pulse 1.2s infinite ease-in-out;
            mix-blend-mode: screen; /* 滤色模式，使其在底层上爆亮 */
        `;

        // 横向能量耀斑 (Flare)
        const clashFlare = document.createElement('div');
        clashFlare.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: ${uiPx(80)};
            height: ${uiPx(2)};
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 0 12px #FFD700, 0 0 20px #FF6000;
            /* 抵消父级的倾斜，让耀斑保持水平横向切割 */
            transform: translate(-50%, -50%) skewX(18deg);
            border-radius: 50%;
            filter: blur(0.5px);
        `;
        
        // 高亮能量核心 (Core)
        const clashCore = document.createElement('div');
        clashCore.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: ${uiPx(14)};
            height: ${uiPx(14)};
            background: #FFF;
            border-radius: 50%;
            box-shadow: 0 0 10px #FFF, 0 0 24px #FFD700;
            transform: translate(-50%, -50%);
            filter: blur(1px);
        `;

        this.clashEffect.appendChild(clashFlare);
        this.clashEffect.appendChild(clashCore);

        this.healthBarContainer.appendChild(this.defenderBar);
        this.healthBarContainer.appendChild(this.attackerBar);
        this.healthBarContainer.appendChild(this.clashEffect);
        this.healthBarContainer.appendChild(this.rightTotalMultBadge);


        // 军团信息：以「区域冲突」中线为界，左右各占一半；外缘避开立绘。
        const portraitPad = uiPx(T.portraitHorizontalReserve);
        this.sideStatsRow = document.createElement('div');
        this.sideStatsRow.style.cssText = `
            width: 100%;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            grid-template-rows: auto auto auto;
            column-gap: ${uiPx(8)};
            align-items: end;
            margin-top: ${uiPx(10)};
            padding: 0 ${portraitPad};
            box-sizing: border-box;
            pointer-events: none;
            position: relative;
            z-index: ${T.zIndex.portrait + 2};
            overflow: visible;
        `;

        const leftHud = this.createSideHud('attacker');
        leftHud.appendChild(this.createFactionRow('attacker'));
        this.leftSideLabel = this.buildSideLabel('attacker');
        leftHud.appendChild(this.leftSideLabel);
        this.leftReinfRow = this.buildReinforcementRow('attacker');
        leftHud.appendChild(this.leftReinfRow);
        this.sideStatsRow.appendChild(leftHud);
        this.sideStatsRow.appendChild(this.createSideVsIcon());

        const rightHud = this.createSideHud('defender');
        rightHud.appendChild(this.createFactionRow('defender'));
        this.rightSideLabel = this.buildSideLabel('defender');
        rightHud.appendChild(this.rightSideLabel);
        this.rightReinfRow = this.buildReinforcementRow('defender');
        rightHud.appendChild(this.rightReinfRow);
        this.sideStatsRow.appendChild(rightHud);


        this.bottomInfoRow = document.createElement('div');
        this.bottomInfoRow.style.display = 'none';

        this.centerPanel.appendChild(this.battleYear);
        this.centerPanel.appendChild(this.battleTitle);
        this.centerPanel.appendChild(this.skillsRow);
        this.centerPanel.appendChild(this.healthBarContainer);
        this.centerPanel.appendChild(this.sideStatsRow);
        this.centerPanel.appendChild(this.eventDescription);
        this.container.appendChild(this.centerBackdrop);
        this.container.appendChild(this.centerPanel);
        this.container.appendChild(leftFrame);
        this.container.appendChild(rightFrame);

        this.applyPortraitFacing('attacker');
        this.applyPortraitFacing('defender');
    }

    /** 中央面板底部：左半攻 / 右半守，「军团名: 兵力」+ 小血条 */
    private createSideHud(side: 'attacker' | 'defender'): HTMLDivElement {
        const isAtt = side === 'attacker';
        const strip = document.createElement('div');
        strip.style.cssText = `
            width: 100%;
            min-width: 0;
            max-width: 100%;
            display: grid;
            grid-template-rows: subgrid;
            grid-row: 1 / -1;
            justify-items: ${isAtt ? 'start' : 'end'};
            padding: 0;
            text-align: ${isAtt ? 'left' : 'right'};
            pointer-events: none;
            overflow: visible;
        `;
        return strip;
    }

    /** 两势力之间的交叉剑装饰（居中列） */
    private createSideVsIcon(): HTMLDivElement {
        const size = uiPx(T.sideBar.centerVsIconSize);
        const wrap = document.createElement('div');
        wrap.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${size};
            height: ${size};
            pointer-events: none;
            flex-shrink: 0;
            grid-row: 1 / -1;
            align-self: center;
            position: relative;
            z-index: 10;
            margin: 0 ${uiPx(4)};
        `;

        const img = document.createElement('img');
        img.src = '/ui-assets/battlefield_icon.png';
        img.alt = '';
        img.draggable = false;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 2px 10px rgba(0,0,0,0.85));
        `;
        wrap.appendChild(img);
        return wrap;
    }

    /** 第一层：势力名（左/右顶头）+ 文化标签（对侧顶头） */
    private createFactionRow(side: 'attacker' | 'defender'): HTMLDivElement {
        const isAtt = side === 'attacker';
        const row = document.createElement('div');
        row.style.cssText = `
            width: 100%;
            margin-bottom: ${uiPx(4)};
            display: flex;
            flex-direction: ${isAtt ? 'row' : 'row-reverse'};
            align-items: center;
            justify-content: space-between;
            pointer-events: none;
        `;

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = `
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(T.sideBar.factionNameSize)};
            font-weight: 900;
            letter-spacing: ${uiPx(2)};
            text-shadow: 0 2px 6px rgba(0,0,0,0.85);
            white-space: nowrap;
            color: #FFF;
        `;
        row.appendChild(nameSpan);

        // 标签组：总加成 + 文化 + 技能，紧挨排列
        const badgeGroup = document.createElement('div');
        badgeGroup.style.cssText = `
            display: flex;
            flex-direction: ${isAtt ? 'row' : 'row-reverse'};
            align-items: center;
            gap: ${uiPx(2)};
            flex-shrink: 0;
        `;

        const multBadge = document.createElement('span');
        multBadge.style.cssText = `display:none;flex-shrink:0;white-space:nowrap;`;
        badgeGroup.appendChild(multBadge);

        const cultureBadge = document.createElement('span');
        cultureBadge.style.cssText = `display:none;flex-shrink:0;white-space:nowrap;`;
        badgeGroup.appendChild(cultureBadge);

        const skillBadge = document.createElement('span');
        skillBadge.style.cssText = `display:none;flex-shrink:0;white-space:nowrap;`;
        badgeGroup.appendChild(skillBadge);

        row.appendChild(badgeGroup);

        // multSpan 保留引用（其他标签层之后独立挂载）
        const multSpan = document.createElement('span');
        multSpan.style.display = 'none';

        if (isAtt) {
            this.leftFactionNameSpan = nameSpan;
            this.leftFactionMultSpan = multSpan;
            this.leftMultBadge = multBadge;
            this.leftCultureBadge = cultureBadge;
            this.leftSkillBadge = skillBadge;
        } else {
            this.rightFactionNameSpan = nameSpan;
            this.rightFactionMultSpan = multSpan;
            this.rightMultBadge = multBadge;
            this.rightCultureBadge = cultureBadge;
            this.rightSkillBadge = skillBadge;
        }
        return row;
    }

    /** 第二层：军队名 + 兵力（左/右顶头），精锐(军)+适性+运气标签（对侧顶头，攻方靠右，守方靠左） */
    private buildSideLabel(side: 'attacker' | 'defender'): HTMLDivElement {
        const isAtt = side === 'attacker';
        const label = document.createElement('div');
        this.applySideLabelStyle(label, side);
        label.style.display = 'flex';
        label.style.flexDirection = isAtt ? 'row' : 'row-reverse';
        label.style.alignItems = 'center';
        label.style.justifyContent = 'space-between';
        label.style.flexWrap = 'nowrap';
        label.style.width = '100%';

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = `
            white-space: nowrap;
            line-height: 1.15;
            color: ${isAtt ? T.colors.attackerName : T.colors.defenderName};
            text-align: ${isAtt ? 'left' : 'right'};
        `;

        // 标签组：精锐(军) + 三势 + 运气，紧挨排列
        const badgeGroup = document.createElement('div');
        badgeGroup.style.cssText = `
            display: flex;
            flex-direction: ${isAtt ? 'row' : 'row-reverse'};
            align-items: center;
            gap: ${uiPx(2)};
            flex-shrink: 0;
        `;

        const legionBadge = document.createElement('span');
        legionBadge.style.cssText = `display:none;flex-shrink:0;white-space:nowrap;`;
        badgeGroup.appendChild(legionBadge);

        const aptitudeBadge = document.createElement('span');
        aptitudeBadge.style.cssText = `display:none;flex-shrink:0;white-space:nowrap;`;
        badgeGroup.appendChild(aptitudeBadge);

        const luckBadge = document.createElement('span');
        luckBadge.style.cssText = `display:none;flex-shrink:0;white-space:nowrap;`;
        badgeGroup.appendChild(luckBadge);

        const reinfJoinBadge = document.createElement('span');
        reinfJoinBadge.style.cssText = `display:none;flex-shrink:0;white-space:nowrap;`;
        badgeGroup.appendChild(reinfJoinBadge);

        label.appendChild(nameSpan);
        label.appendChild(badgeGroup);

        if (isAtt) {
            this.leftSideNameSpan = nameSpan;
            this.leftSideTroopsSpan = document.createElement('span');
            this.leftLegionBadge = legionBadge;
            this.leftLuckBadge = luckBadge;
            this.leftAptitudeBadge = aptitudeBadge;
            this.leftReinfJoinBadge = reinfJoinBadge;
        } else {
            this.rightSideNameSpan = nameSpan;
            this.rightSideTroopsSpan = document.createElement('span');
            this.rightLegionBadge = legionBadge;
            this.rightLuckBadge = luckBadge;
            this.rightAptitudeBadge = aptitudeBadge;
            this.rightReinfJoinBadge = reinfJoinBadge;
        }

        return label;
    }

    /** 第四行：独立援军专行（左/右顶头），援军标签（得×N.N / 掣×N.N，对侧顶头；无援军时隐藏） */
    private buildReinforcementRow(side: 'attacker' | 'defender'): HTMLDivElement {
        const isAtt = side === 'attacker';
        const row = document.createElement('div');
        this.applySideLabelStyle(row, side);
        row.style.display = 'none';
        row.style.flexDirection = isAtt ? 'row' : 'row-reverse';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.flexWrap = 'nowrap';
        row.style.width = '100%';
        row.style.marginTop = uiPx(6);
        row.style.paddingTop = uiPx(4);
        row.style.borderTop = '1px dashed rgba(255, 255, 255, 0.18)';

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = `
            white-space: nowrap;
            line-height: 1.15;
            color: rgba(255, 230, 180, 0.95);
            text-align: ${isAtt ? 'left' : 'right'};
        `;

        const badgeGroup = document.createElement('div');
        badgeGroup.style.cssText = `
            display: flex;
            flex-direction: ${isAtt ? 'row' : 'row-reverse'};
            align-items: center;
            gap: ${uiPx(4)};
            flex-shrink: 0;
        `;

        const reinfMultBadge = document.createElement('span');
        reinfMultBadge.style.cssText = `display:none;flex-shrink:0;white-space:nowrap;`;
        badgeGroup.appendChild(reinfMultBadge);

        row.appendChild(nameSpan);
        row.appendChild(badgeGroup);

        if (isAtt) {
            this.leftReinfNameSpan = nameSpan;
            this.leftReinfTroopsSpan = document.createElement('span');
            this.leftReinfMultBadge = reinfMultBadge;
        } else {
            this.rightReinfNameSpan = nameSpan;
            this.rightReinfTroopsSpan = document.createElement('span');
            this.rightReinfMultBadge = reinfMultBadge;
        }

        return row;
    }

    /** 战力八环标签：第一行5标签(名,城,文,技,军) + 第二行3标签(势,攻/防,运)，援军专行兵力+标签 */
    private updateMultiplierBadges(attacker: IBattleUnit | null, defender: IBattleUnit | null): void {
        const applySideBadges = (
            multSpan: HTMLSpanElement,
            multBadge: HTMLSpanElement | null,
            totalBadge: HTMLSpanElement | null,
            unit: IBattleUnit | null,
            opponent: IBattleUnit | null,
            side: 'attacker' | 'defender',
        ) => {
            if (!unit) {
                multSpan.style.display = 'none';
                if (multBadge) multBadge.style.display = 'none';
                if (totalBadge) totalBadge.style.display = 'none';
                return;
            }
            const { topChain, bottomChain, title, totalMult, totalTitle } = this.renderEightRingBadges(unit, opponent, side);

            if (topChain) {
                multSpan.innerHTML = topChain;
                multSpan.title = title;
                multSpan.style.display = 'inline-grid';
            } else {
                multSpan.style.display = 'none';
            }

            if (multBadge) {
                const fmtTotalStr = String(parseFloat(totalMult.toFixed(2)));
                multBadge.innerHTML = `总×${fmtTotalStr}`;
                multBadge.title = totalTitle;
                const isBuff = totalMult > 1.001;
                const isAtt = side === 'attacker';
                const borderColor = isBuff ? (isAtt ? 'rgba(253, 185, 49, 0.85)' : 'rgba(90, 170, 190, 0.85)') : 'rgba(235, 85, 75, 0.85)';
                const color = isBuff ? (isAtt ? '#FFD700' : '#70E0FF') : '#FFAA99';
                const bg = isBuff ? (isAtt ? 'rgba(50, 20, 5, 0.9)' : 'rgba(10, 30, 45, 0.9)') : 'rgba(50, 10, 10, 0.9)';
                multBadge.style.cssText = `display:inline-block;padding:1px 4px;margin:0 1px;font-size:11.5px;font-weight:800;line-height:1.15;border:1px solid ${borderColor};color:${color};background:${bg};border-radius:3px;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.4);cursor:help;`;
            }
            // totalBadge 现在专门由 renderSideLabel 写入兵力数值，此处不再覆盖
        };

        const updateReinforcements = (side: 'attacker' | 'defender') => {
            const isAtt = side === 'attacker';
            const nameEl = isAtt ? this.leftReinfNameSpan : this.rightReinfNameSpan;
            const troopsEl = isAtt ? this.leftReinfTroopsSpan : this.rightReinfTroopsSpan;
            const badgeEl = isAtt ? this.leftReinfMultBadge : this.rightReinfMultBadge;
            const joinBadgeEl = isAtt ? this.leftReinfJoinBadge : this.rightReinfJoinBadge;
            const rowEl = isAtt ? this.leftReinfRow : this.rightReinfRow;
            if (!nameEl || !badgeEl || !rowEl || !joinBadgeEl) return;

            const bf = this.boundRegionalBattleField;
            if (!bf || bf.isOver) {
                rowEl.style.display = 'none';
                joinBadgeEl.style.display = 'none';
                return;
            }

            const units = side === 'attacker' ? bf.getAttackerUnits() : bf.getDefenderUnits();
            const commander = side === 'attacker' ? bf.getAttackerCommander() : bf.getDefenderCommander();

            // 主力乘区行绝不展示援军合兵标签，统一强制隐藏
            joinBadgeEl.style.display = 'none';

            // 确定主力乘区行已展示的主力单位，避免援军行重复
            const primaryBattler = this.pickPrimaryDisplayUnit(units);

            // 过滤掉主力乘区行已展示的主力单位
            // 侧栏援军行展现该侧额外的野外援军或据点城防驻军（分行显示各自的名字与兵力）
            const reinfUnits = units.filter(u => {
                if (u.isDestroyed || u.troops <= 0) return false;
                if (primaryBattler && u.id === primaryBattler.id) return false;
                return true;
            });

            // 逐行/分隔显示每个单位的独立名字与兵力
            const lines: string[] = [];
            for (const u of reinfUnits) {
                const dName = u.name || (u.unitType === 'city' ? '据点驻军' : '援军');
                const t = Math.floor(u.troops);
                const tStr = t >= 10000 ? `${(t / 10000).toFixed(2)}万` : `${t}`;
                const ns = `<span style="white-space: nowrap; color: rgba(255, 235, 200, 0.95);">${dName}</span>`;
                const ts = `<span style="font-weight: 700; color: #ffd700; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; white-space: nowrap;">${tStr}</span>`;
                const line = isAtt
                    ? `${ns}<span style="margin-left: 6px;">${ts}</span>`
                    : `<span style="margin-right: 6px;">${ts}</span>${ns}`;
                lines.push(`<div style="display: inline-flex; align-items: center; justify-content: ${isAtt ? 'flex-start' : 'flex-end'}; white-space: nowrap;">${line}</div>`);
            }
            const sep = `<span style="margin: 0 6px; opacity: 0.45; color: #ffd700; font-size: 10px;">•</span>`;
            nameEl.innerHTML = lines.join(sep);

            // 全局查找该侧任意有合兵记录的存活单位（无论是主力还是援军），统一在援军行对齐展示标签
            const activeUnits = units.filter(u => !u.isDestroyed && u.troops > 0);
            const luckUnit = activeUnits.find(u => {
                const l = bf.getReinforcementJoinLuck(u.id);
                return l !== null && l !== undefined;
            });

            if (luckUnit) {
                const joinLuck = bf.getReinforcementJoinLuck(luckUnit.id)!;
                const fmtVal = joinLuck.toFixed(1);
                const isBuff = joinLuck > 1.001;
                const isNerf = joinLuck < 0.999;
                let borderColor: string, color: string, bg: string;
                let label = '增';
                if (isBuff) {
                    label = '得';
                    borderColor = 'rgba(253, 185, 49, 0.65)';
                    color = 'rgba(255, 230, 160, 1)';
                    bg = 'rgba(50, 20, 5, 0.85)';
                } else if (isNerf) {
                    label = '掣';
                    borderColor = 'rgba(235, 85, 75, 0.75)';
                    color = 'rgba(255, 170, 160, 1)';
                    bg = 'rgba(50, 10, 10, 0.85)';
                } else {
                    label = '增';
                    borderColor = 'rgba(160, 160, 160, 0.5)';
                    color = 'rgba(200, 200, 200, 0.9)';
                    bg = 'rgba(30, 30, 30, 0.85)';
                }
                applyBadgeStyleToElement(badgeEl, label, fmtVal, borderColor, color, bg, `援军合兵：×${fmtVal}`);
            } else {
                badgeEl.style.display = 'none';
            }

            if (reinfUnits.length > 0 || luckUnit) {
                rowEl.style.display = 'flex';
            } else {
                rowEl.style.display = 'none';
            }
        };

        const applyBadgeStyleToElement = (badge: HTMLSpanElement, shortName: string, fmtVal: string, borderColor: string, color: string, bg: string, title: string) => {
            badge.textContent = `${shortName}×${fmtVal}`;
            badge.title = title;
            badge.style.cssText = `
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                height: 18px !important;
                padding: 0 4px !important;
                font-family: 'Noto Sans SC', sans-serif !important;
                font-size: 11px !important;
                font-weight: 800 !important;
                line-height: 1 !important;
                letter-spacing: 0 !important;
                text-shadow: none !important;
                border: 1px solid ${borderColor} !important;
                color: ${color} !important;
                background: ${bg} !important;
                border-radius: 3px !important;
                white-space: nowrap !important;
                box-shadow: 0 1px 2px rgba(0,0,0,0.4) !important;
                box-sizing: border-box !important;
                flex-shrink: 0 !important;
                vertical-align: middle !important;
            `;
        };

        const updateCultureBadge = (unit: IBattleUnit | null, side: 'attacker' | 'defender') => {
            const isAtt = side === 'attacker';
            const badge = isAtt ? this.leftCultureBadge : this.rightCultureBadge;
            if (!badge) return;
            if (!unit) { badge.style.display = 'none'; return; }

            const resolved = this.resolvePowerBadgeUnit(unit, side);
            const cultureMult = getUnitCultureCombatMultiplier(resolved);
            const fmtVal = cultureMult.toFixed(1);

            const isBuff = cultureMult > 1.001;
            const isNerf = cultureMult < 0.999;
            let borderColor: string, color: string, bg: string;
            if (isBuff) {
                borderColor = isAtt ? 'rgba(253, 185, 49, 0.65)' : 'rgba(90, 170, 190, 0.65)';
                color = isAtt ? 'rgba(255, 230, 160, 1)' : 'rgba(190, 240, 255, 1)';
                bg = isAtt ? 'rgba(50, 20, 5, 0.85)' : 'rgba(10, 30, 45, 0.85)';
            } else if (isNerf) {
                borderColor = 'rgba(235, 85, 75, 0.75)';
                color = 'rgba(255, 170, 160, 1)';
                bg = 'rgba(50, 10, 10, 0.85)';
            } else {
                borderColor = 'rgba(160, 160, 160, 0.5)';
                color = 'rgba(200, 200, 200, 0.9)';
                bg = 'rgba(30, 30, 30, 0.85)';
            }

            applyBadgeStyleToElement(badge, '文', fmtVal, borderColor, color, bg, `文化加成：×${fmtVal}`);
        };

        const updateStyleBadge = (unit: IBattleUnit | null, side: 'attacker' | 'defender') => {
            const isAtt = side === 'attacker';
            const badge = isAtt ? this.leftSkillBadge : this.rightSkillBadge;
            if (!badge) return;
            if (!unit) { badge.style.display = 'none'; return; }

            const resolved = this.resolvePowerBadgeUnit(unit, side);
            const styleChar = isAtt ? '攻' : '防';
            const styleMult = getAttackStylePowerMult(resolved, isAtt);
            const fmtVal = styleMult.toFixed(1);

            const isBuff = styleMult > 1.001;
            const isNerf = styleMult < 0.999;
            let borderColor: string, color: string, bg: string;
            if (isBuff) {
                borderColor = isAtt ? 'rgba(253, 185, 49, 0.65)' : 'rgba(90, 170, 190, 0.65)';
                color = isAtt ? 'rgba(255, 230, 160, 1)' : 'rgba(190, 240, 255, 1)';
                bg = isAtt ? 'rgba(50, 20, 5, 0.85)' : 'rgba(10, 30, 45, 0.85)';
            } else if (isNerf) {
                borderColor = 'rgba(235, 85, 75, 0.75)';
                color = 'rgba(255, 170, 160, 1)';
                bg = 'rgba(50, 10, 10, 0.85)';
            } else {
                borderColor = 'rgba(160, 160, 160, 0.5)';
                color = 'rgba(200, 200, 200, 0.9)';
                bg = 'rgba(30, 30, 30, 0.85)';
            }

            applyBadgeStyleToElement(badge, styleChar, fmtVal, borderColor, color, bg, `攻防风格：×${fmtVal}`);
        };

        const updateLegionBadge = (unit: IBattleUnit | null, side: 'attacker' | 'defender') => {
            const isAtt = side === 'attacker';
            const badge = isAtt ? this.leftLegionBadge : this.rightLegionBadge;
            if (!badge) return;
            if (!unit) { badge.style.display = 'none'; return; }

            const resolved = this.resolvePowerBadgeUnit(unit, side);
            const legionMult = getEliteCombatMultiplier(resolved);
            const fmtVal = legionMult.toFixed(1);

            const isBuff = legionMult > 1.001;
            const isNerf = legionMult < 0.999;
            let borderColor: string, color: string, bg: string;
            if (isBuff) {
                borderColor = isAtt ? 'rgba(253, 185, 49, 0.65)' : 'rgba(90, 170, 190, 0.65)';
                color = isAtt ? 'rgba(255, 230, 160, 1)' : 'rgba(190, 240, 255, 1)';
                bg = isAtt ? 'rgba(50, 20, 5, 0.85)' : 'rgba(10, 30, 45, 0.85)';
            } else if (isNerf) {
                borderColor = 'rgba(235, 85, 75, 0.75)';
                color = 'rgba(255, 170, 160, 1)';
                bg = 'rgba(50, 10, 10, 0.85)';
            } else {
                borderColor = 'rgba(160, 160, 160, 0.5)';
                color = 'rgba(200, 200, 200, 0.9)';
                bg = 'rgba(30, 30, 30, 0.85)';
            }

            applyBadgeStyleToElement(badge, '军', fmtVal, borderColor, color, bg, `精锐部队：×${fmtVal}`);
        };

        const updateLuckBadge = (side: 'attacker' | 'defender') => {
            const isAtt = side === 'attacker';
            const badge = isAtt ? this.leftLuckBadge : this.rightLuckBadge;
            if (!badge) return;

            const fateLuck = isAtt
                ? (this.boundRegionalBattleField?.getAttackerCurrentFateLuck() ?? 1)
                : (this.boundRegionalBattleField?.getDefenderCurrentFateLuck() ?? 1);
            const fmtVal = fateLuck.toFixed(1);

            const isBuff = fateLuck > 1.001;
            const isNerf = fateLuck < 0.999;
            let borderColor: string, color: string, bg: string;
            if (isBuff) {
                borderColor = isAtt ? 'rgba(253, 185, 49, 0.65)' : 'rgba(90, 170, 190, 0.65)';
                color = isAtt ? 'rgba(255, 230, 160, 1)' : 'rgba(190, 240, 255, 1)';
                bg = isAtt ? 'rgba(50, 20, 5, 0.85)' : 'rgba(10, 30, 45, 0.85)';
            } else if (isNerf) {
                borderColor = 'rgba(235, 85, 75, 0.75)';
                color = 'rgba(255, 170, 160, 1)';
                bg = 'rgba(50, 10, 10, 0.85)';
            } else {
                borderColor = 'rgba(160, 160, 160, 0.5)';
                color = 'rgba(200, 200, 200, 0.9)';
                bg = 'rgba(30, 30, 30, 0.85)';
            }

            applyBadgeStyleToElement(badge, '运', fmtVal, borderColor, color, bg, `命运运气：×${fmtVal}`);
        };

        const updateAptitudeBadge = (unit: IBattleUnit | null, side: 'attacker' | 'defender') => {
            const isAtt = side === 'attacker';
            const badge = isAtt ? this.leftAptitudeBadge : this.rightAptitudeBadge;
            if (!badge) return;
            if (!unit) { badge.style.display = 'none'; return; }

            const resolved = this.resolvePowerBadgeUnit(unit, side);
            const myUnits = this.getUnitsForSide(side);
            const oppUnits = this.getOpponentUnitsFor(side);
            const bf = this.boundRegionalBattleField;
            const cachedMyTroops = isAtt ? bf?.getCachedAttackerTroops() : bf?.getCachedDefenderTroops();
            const cachedOppTroops = isAtt ? bf?.getCachedDefenderTroops() : bf?.getCachedAttackerTroops();

            let aptChar = '势';
            if (resolved.generalId) {
                const profile = getGeneralProfile(resolved.generalId);
                if (profile?.aptitude) {
                    const APT_MAP: Record<string, string> = { create: '造', leverage: '借', reverse: '逆' };
                    if (APT_MAP[profile.aptitude]) aptChar = APT_MAP[profile.aptitude];
                }
            }
            const aptMult = getAptitudePowerMult(myUnits, oppUnits, resolved, cachedMyTroops, cachedOppTroops);
            const fmtVal = aptMult.toFixed(1);

            const isBuff = aptMult > 1.001;
            const isNerf = aptMult < 0.999;
            let borderColor: string, color: string, bg: string;
            if (isBuff) {
                borderColor = isAtt ? 'rgba(253, 185, 49, 0.65)' : 'rgba(90, 170, 190, 0.65)';
                color = isAtt ? 'rgba(255, 230, 160, 1)' : 'rgba(190, 240, 255, 1)';
                bg = isAtt ? 'rgba(50, 20, 5, 0.85)' : 'rgba(10, 30, 45, 0.85)';
            } else if (isNerf) {
                borderColor = 'rgba(235, 85, 75, 0.75)';
                color = 'rgba(255, 170, 160, 1)';
                bg = 'rgba(50, 10, 10, 0.85)';
            } else {
                borderColor = 'rgba(160, 160, 160, 0.5)';
                color = 'rgba(200, 200, 200, 0.9)';
                bg = 'rgba(30, 30, 30, 0.85)';
            }

            applyBadgeStyleToElement(badge, aptChar, fmtVal, borderColor, color, bg, `三势适性：×${fmtVal}`);
        };

        const updateCenterSixSetBadges = (attUnit: IBattleUnit | null, defUnit: IBattleUnit | null) => {
            const getSixChar = (unit: IBattleUnit | null, side: 'attacker' | 'defender') => {
                if (!unit) return null;
                const resolved = this.resolvePowerBadgeUnit(unit, side);
                if (resolved.generalId) {
                    // [2026-07-31 修] 必须与引擎同源：getActiveTacticalSkillId = 夺来技 → 局技(已定义即用) → 招牌技兜底。
                    // 原来直接读 battleOverriddenSkillId：局技未分配（assignSituationalSkills 里 pool 为空会 continue，
                    // 援军入场走懒分配）时该字段是 undefined，引擎照常拿招牌技结算、技能条也照常显示技名，
                    // 唯独这枚角标空着；夺取系技能生效后也认不出新类别。
                    // 末尾保留 negatedSkillId：技被看破时 battleOverriddenSkillId=null，仍按原技类别显示。
                    const skillId = getActiveTacticalSkillId(resolved) ?? resolved.negatedSkillId ?? null;
                    const entry = skillId ? resolveGeneralTacticalEntry(skillId) : null;
                    if (entry) {
                        const cls = EFFECT_TO_SIX_SET[entry.baseEffect] as TacticalSixSet;
                        const TAC_MAP: Record<TacticalSixSet, string> = {
                            gongzhan: '攻', shengzhan: '胜', dizhan: '敌',
                            hunzhan: '混', bingzhan: '并', baizhan: '败',
                        };
                        if (cls && TAC_MAP[cls]) return TAC_MAP[cls];
                    }
                }
                return null;
            };

            const applyCenterBadge = (el: HTMLSpanElement, char: string | null, isAtt: boolean) => {
                if (!char) {
                    el.style.display = 'none';
                    return;
                }
                const SIX_STYLES: Record<string, { color: string; bg: string; border: string; glow: string }> = {
                    攻: { color: '#FFEADB', bg: 'linear-gradient(135deg, rgba(140, 60, 10, 0.95), rgba(50, 15, 5, 0.95))', border: 'rgba(249, 115, 22, 0.85)', glow: 'rgba(249, 115, 22, 0.5)' },
                    胜: { color: '#E2FFED', bg: 'linear-gradient(135deg, rgba(20, 100, 45, 0.95), rgba(5, 40, 15, 0.95))', border: 'rgba(34, 197, 94, 0.85)', glow: 'rgba(34, 197, 94, 0.5)' },
                    敌: { color: '#D6F9FF', bg: 'linear-gradient(135deg, rgba(10, 90, 110, 0.95), rgba(5, 30, 45, 0.95))', border: 'rgba(6, 182, 212, 0.85)', glow: 'rgba(6, 182, 212, 0.5)' },
                    混: { color: '#F3E8FF', bg: 'linear-gradient(135deg, rgba(90, 30, 120, 0.95), rgba(30, 5, 45, 0.95))', border: 'rgba(168, 85, 247, 0.85)', glow: 'rgba(168, 85, 247, 0.5)' },
                    并: { color: '#DBEAFE', bg: 'linear-gradient(135deg, rgba(20, 60, 120, 0.95), rgba(5, 20, 45, 0.95))', border: 'rgba(59, 130, 246, 0.85)', glow: 'rgba(59, 130, 246, 0.5)' },
                    败: { color: '#FEE2E2', bg: 'linear-gradient(135deg, rgba(120, 20, 20, 0.95), rgba(45, 5, 5, 0.95))', border: 'rgba(239, 68, 68, 0.85)', glow: 'rgba(239, 68, 68, 0.5)' },
                };
                const st = SIX_STYLES[char] ?? {
                    color: '#ffffff',
                    bg: isAtt ? 'linear-gradient(135deg, rgba(100, 20, 10, 0.95), rgba(40, 5, 5, 0.95))' : 'linear-gradient(135deg, rgba(10, 50, 90, 0.95), rgba(5, 20, 40, 0.95))',
                    border: isAtt ? 'rgba(230, 57, 0, 0.85)' : 'rgba(0, 102, 204, 0.85)',
                    glow: isAtt ? 'rgba(230, 57, 0, 0.5)' : 'rgba(0, 102, 204, 0.5)',
                };
                el.textContent = char;
                el.title = `${isAtt ? '攻方' : '守方'}战术六计：【${char}】`;
                el.style.cssText = `
                    display: inline-block !important;
                    width: ${uiPx(22)} !important;
                    height: ${uiPx(22)} !important;
                    line-height: ${uiPx(20)} !important;
                    text-align: center !important;
                    font-family: 'Noto Serif SC', serif !important;
                    font-size: ${uiPx(15)} !important;
                    font-weight: 900 !important;
                    color: ${st.color} !important;
                    background: ${st.bg} !important;
                    border: 1px solid ${st.border} !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 10px ${st.glow}, inset 0 0 6px ${st.glow} !important;
                    text-shadow: 0 0 5px ${st.glow} !important;
                    box-sizing: border-box !important;
                `;
            };

            const attChar = getSixChar(attUnit, 'attacker');
            const defChar = getSixChar(defUnit, 'defender');

            applyCenterBadge(this.leftCenterSixBadge, attChar, true);
            applyCenterBadge(this.rightCenterSixBadge, defChar, false);
        };

        applySideBadges(this.leftFactionMultSpan, this.leftMultBadge, this.leftTotalMultBadge, attacker, defender, 'attacker');
        applySideBadges(this.rightFactionMultSpan, this.rightMultBadge, this.rightTotalMultBadge, defender, attacker, 'defender');
        updateCultureBadge(attacker, 'attacker');
        updateCultureBadge(defender, 'defender');
        updateStyleBadge(attacker, 'attacker');
        updateStyleBadge(defender, 'defender');
        updateLegionBadge(attacker, 'attacker');
        updateLegionBadge(defender, 'defender');
        updateAptitudeBadge(attacker, 'attacker');
        updateAptitudeBadge(defender, 'defender');
        updateLuckBadge('attacker');
        updateLuckBadge('defender');
        updateCenterSixSetBadges(attacker, defender);
        updateReinforcements('attacker');
        updateReinforcements('defender');
    }

    private getPrimaryBattler(side: 'attacker' | 'defender'): IBattleUnit | null {
        if (this.currentBattle) {
            return side === 'attacker' ? this.currentBattle.attacker : this.currentBattle.defender;
        }
        const bf = this.boundRegionalBattleField;
        let units: IBattleUnit[] | undefined;
        if (bf && !bf.isOver) {
            units = side === 'attacker' ? bf.getAttackerUnits() : bf.getDefenderUnits();
        } else if (this.currentRegionalUnits) {
            units = side === 'attacker'
                ? this.currentRegionalUnits.attackers
                : this.currentRegionalUnits.defenders;
        }
        if (!units || units.length === 0) return null;

        const followedId = (window as unknown as { game?: { cameraFollowUI?: { getFollowedArmyId(): string | null } } })
            .game?.cameraFollowUI?.getFollowedArmyId();
        if (followedId) {
            const followed = units.find((u) => u.id === followedId);
            if (followed) return followed;
        }
        return this.pickPrimaryDisplayUnit(units);
    }

    /** 侧栏立绘/名牌/技能：与放技将领一致（城防将优先于无将军团） */
    private pickGeneralDisplayUnit(units: IBattleUnit[]): IBattleUnit | null {
        return pickSideSkillGeneralUnit(units) ?? this.pickPrimaryDisplayUnit(units);
    }

    /** 侧栏立绘/技能/系数：优先带将+精锐的军团，避免攻城时城防「驻军」盖住守城军团 */
    private pickPrimaryDisplayUnit(units: IBattleUnit[]): IBattleUnit | null {
        if (units.length === 0) return null;
        let best = units[0];
        let bestScore = Number.NEGATIVE_INFINITY;
        for (const u of units) {
            const score = this.scoreBattleDisplayUnit(u);
            if (score > bestScore) {
                bestScore = score;
                best = u;
            }
        }
        return best;
    }

    private scoreBattleDisplayUnit(u: IBattleUnit): number {
        let score = 0;
        // 守城精锐优先于援军军团：据点本位，守城精锐是这座城的「主人」
        if (u.unitType === 'city' && readSiegeGarrisonEliteName(u.getEntity?.())) score += 20_000;
        else if (u.unitType === 'legion' || u.unitType === 'army') score += 10_000;
        if (u.generalId && getGeneralProfile(u.generalId)) score += 1_000;
        const army = u.getEntity?.() as Army | undefined;
        if (army?.isElite) score += 500;
        score += Math.min(Math.max(0, u.troops) / 1000, 99);
        return score;
    }

    private updateSkillBadges(attacker: IBattleUnit | null, defender: IBattleUnit | null): void {
        // 技能条与系数链/六计角标同源：一律落到开战锁定的指挥官（见 resolvePowerBadgeUnit）。
        // 此前各调用点传进来的单位各挑各的，才会出现「技能条有技、中央角标空」。
        if (attacker) attacker = this.resolvePowerBadgeUnit(attacker, 'attacker');
        if (defender) defender = this.resolvePowerBadgeUnit(defender, 'defender');
        this.leftSkillsBox.innerHTML = '';
        this.rightSkillsBox.innerHTML = '';

        const createSkillTag = (
            name: string,
            effect: string,
            isFamous: boolean,
            isAttacker: boolean,
            skillType: 'tactical' | 'pass' | 'elite' | 'culture' | 'other' = 'other',
            sixSetChar?: string,
        ) => {
            const tag = document.createElement('div');
            const borderColor = isFamous ? 'rgba(255, 215, 0, 0.7)' : 'rgba(200, 200, 200, 0.6)';
            
            // 战术 / 地形 / 精锐 / 文化颜色区分
            let bgColor = '';
            let bgHighlight = '';
            let sideColor = isAttacker ? '#e63900' : '#0066cc'; // 默认战术/其他：攻血红 守深蓝

            if (skillType === 'pass') {
                if (isAttacker) {
                    bgColor = isFamous ? 'rgba(70, 50, 20, 0.85)' : 'rgba(50, 40, 20, 0.8)';
                    bgHighlight = 'rgba(196, 164, 90, 0.15)';
                    sideColor = '#c4a45a';
                } else {
                    bgColor = isFamous ? 'rgba(40, 50, 30, 0.85)' : 'rgba(30, 40, 25, 0.8)';
                    bgHighlight = 'rgba(148, 173, 110, 0.15)';
                    sideColor = '#94ad6e';
                }
            } else if (skillType === 'elite') {
                // 精锐部队：极具质感的黑金 / 暗夜冰银
                if (isAttacker) {
                    bgColor = isFamous ? 'rgba(45, 25, 0, 0.9)' : 'rgba(30, 15, 0, 0.85)';
                    bgHighlight = 'rgba(255, 200, 50, 0.15)';
                    sideColor = '#ffc800'; // 纯粹的正金
                } else {
                    bgColor = isFamous ? 'rgba(5, 20, 35, 0.9)' : 'rgba(0, 15, 25, 0.85)';
                    bgHighlight = 'rgba(160, 210, 255, 0.15)';
                    sideColor = '#aaddff'; // 冰霜银蓝
                }
            } else if (skillType === 'culture') {
                // 文化区标签：沉稳的大地暖色 / 青岩色
                if (isAttacker) {
                    bgColor = isFamous ? 'rgba(55, 30, 15, 0.85)' : 'rgba(40, 20, 10, 0.8)';
                    bgHighlight = 'rgba(212, 136, 60, 0.15)';
                    sideColor = '#c86b28'; // 偏暗的赤铜
                } else {
                    bgColor = isFamous ? 'rgba(10, 35, 25, 0.85)' : 'rgba(5, 25, 15, 0.8)';
                    bgHighlight = 'rgba(90, 158, 143, 0.15)';
                    sideColor = '#4a8f7c'; // 沉稳的青石
                }
            } else {
                // 战术或其他：具有攻击性的红橙 / 深邃的海洋蓝
                if (isAttacker) {
                    bgColor = isFamous ? 'rgba(70, 10, 0, 0.85)' : 'rgba(45, 5, 0, 0.8)';
                    bgHighlight = 'rgba(255, 60, 20, 0.12)';
                    sideColor = '#e63900'; // 血红偏橙
                } else {
                    bgColor = isFamous ? 'rgba(0, 25, 60, 0.85)' : 'rgba(0, 15, 40, 0.8)';
                    bgHighlight = 'rgba(40, 120, 255, 0.12)';
                    sideColor = '#0066cc'; // 纯粹的深湛蓝
                }
            }

            tag.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 0 0 ${uiPx(108)};
                width: ${uiPx(108)};
                box-sizing: border-box;
                background: linear-gradient(180deg, ${bgHighlight} 0%, rgba(0,0,0,0.5) 40%, ${bgColor} 100%);
                backdrop-filter: blur(4px);
                border: 1px solid rgba(0, 0, 0, 0.6);
                border-top: 1px solid rgba(255, 255, 255, 0.15);
                border-bottom: 2px solid ${sideColor};
                border-radius: 4px;
                padding: ${uiPx(4)} ${uiPx(3)};
                box-shadow: 
                    inset 0 1px 1px rgba(255,255,255,0.25), 
                    inset 0 -10px 20px ${sideColor}35, 
                    0 3px 8px rgba(0,0,0,0.9);
                overflow: visible;
                position: relative;
            `;
            
            const nameEl = document.createElement('div');
            nameEl.style.cssText = `
                font-family: 'Noto Serif SC', serif;
                font-size: ${uiPx(18)};
                font-weight: 900;
                color: #fff8e0;
                letter-spacing: 1px;
                margin-bottom: ${uiPx(2)};
                position: relative;
                top: ${uiPx(7)};
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
                text-align: center;
            `;
            nameEl.textContent = name;

            const effectEl = document.createElement('div');
            effectEl.style.cssText = `
                font-family: 'Noto Sans SC', sans-serif;
                font-size: ${uiPx(10)};
                font-weight: 400;
                color: rgba(255, 255, 255, 0.7);
                letter-spacing: 1px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
                text-align: center;
            `;
            effectEl.textContent = effect || '\u00A0';

            tag.appendChild(nameEl);
            tag.appendChild(effectEl);
            return tag;
        };

        const renderSide = (box: HTMLDivElement, unit: IBattleUnit | null, isAttacker: boolean) => {
            if (!unit) return;
            const pending: HTMLDivElement[] = [];
            const sideKey = isAttacker ? 'attacker' : 'defender';
            const add = (
                name: string,
                effect: string,
                famous: boolean,
                skillType: 'tactical' | 'pass' | 'elite' | 'culture' | 'other' = 'other'
            ) => {
                if (pending.length >= 4) return;
                const el = createSkillTag(name, effect, famous, isAttacker, skillType);
                // 已燃态（P1）：本局已放过的技能——Cut-in 弹出 0.6s 后定格为降亮度+金框+✓；
                // 标签每帧重建，必须按 skillSpentAt 在创建时补挂
                const spentAt = this.skillSpentAt.get(`${sideKey}-${name}`);
                if (spentAt !== undefined && Date.now() - spentAt >= 600) {
                    el.classList.add('skill-tag-spent');
                }
                pending.push(el);
            };

            // 关隘/名城不再显示为顶部四字卡（2026-07-17 主人定口径：顶部卡=恒有信息（文化/技能/精锐），
            // 时有时无的条件信息走下方乘区链条二字词——关隘「险要」、区中心「名城」，避免双份显示）
            // const passSkill = getPassGarrisonDefenseSkillDisplay(unit);
            // if (passSkill) add(passSkill.name, passSkill.effectLabel, false, 'pass');
            // const regionCenterSkill = getRegionCenterDefenseSkillDisplay(unit);
            // if (regionCenterSkill) add(regionCenterSkill.name, regionCenterSkill.effectLabel, false, 'pass');

            const addElite = () => {
                const legionMult = getEliteCombatMultiplier(unit);
                if (Math.abs(legionMult - 1) > 0.001) {
                    add(getLegionEliteBadgeName(unit), '', true, 'elite');
                }
            };

            const addCulture = () => {
                const cultureMult = getCultureOnlyCombatMultiplier(unit);
                const round = Math.round(cultureMult * 100) / 100;
                const isGarrison = unit.unitType === 'city';
                const label = resolveCultureTagLabel(round, isGarrison);
                if (label) add(label, '', false, 'culture');
            };

            const addSkills = () => {
                if (unit.generalId) {
                    for (const tag of getGeneralSkillDisplayTags(unit)) {
                        add(tag.name, '', tag.isFamous, tag.skillType);
                    }
                }
            };

            if (isAttacker) {
                // 攻击方：精锐 -> 文化 -> 技能
                addElite();
                addCulture();
                addSkills();
            } else {
                // 防守方：技能 -> 文化 -> 精锐
                addSkills();
                addCulture();
                addElite();
            }

            for (const tag of pending) box.appendChild(tag);
        };
        renderSide(this.leftSkillsBox, attacker, true);
        renderSide(this.rightSkillsBox, defender, false);
    }

    private getReinforcementJoinLuckForUnit(unit: IBattleUnit): number | null {
        return this.boundRegionalBattleField?.getReinforcementJoinLuck(unit.id) ?? null;
    }

    /**
     * 本侧全体援军（wave≥1）的兵力加权合兵 luck；无援军返回 null。
     * buildWaveGroupedSideName 中按单位粒度显示「得助/掣肘」标签（紧跟援军名后）。
     */
    private getSideReinforcementJoinLuck(side: 'attacker' | 'defender'): number | null {
        const bf = this.boundRegionalBattleField;
        if (!bf || bf.isOver) return null;
        const units = side === 'attacker' ? bf.getAttackerUnits() : bf.getDefenderUnits();
        let weighted = 0;
        let weight = 0;
        for (const u of units) {
            if (u.isDestroyed || u.troops <= 0) continue;
            const luck = bf.getReinforcementJoinLuck(u.id);
            if (luck === null) continue;
            const w = Math.max(1, u.troops);
            weighted += luck * w;
            weight += w;
        }
        if (weight <= 0) return null;
        return weighted / weight;
    }

    private getBattleTerrainForUi(): LandTerrainKind | null {
        if (!this.boundRegionalBattleField) return null;
        const units = [
            ...this.boundRegionalBattleField.getAttackerUnits(),
            ...this.boundRegionalBattleField.getDefenderUnits(),
        ];
        return getBattleTerrainKind(units, this.boundRegionalBattleField.type);
    }

    /**
     * 面板主将唯一入口（2026-07-31 主人定：援军是后来的，只显示初始的）。
     *
     * 读引擎开战时锁定的指挥官——引擎结算也只认这个单位
     * （`getOpeningTacticalPowerMultiplier` → `findEligibleGeneralUnit(units, commander)`），
     * 所以立绘 / 名牌 / 技能条 / 系数链 / 六计角标必须全走这里，否则面板会
     * 「用甲的脸配乙的数字」：观众看到的将和实际决定胜负的将不是同一个人。
     *
     * 曾经的三套口径（已废）：
     *   ① `pickGeneralDisplayUnit` —— 立绘/名牌，实时挑，援军编入时被 syncRegionalParticipants 换掉；
     *   ② `getPrimaryBattler` —— 技能条，另一套评分 + 摄像机跟随覆盖，同一批单位都可能挑出不同的将；
     *   ③ 本函数 —— 系数链。
     * 无战场 / 指挥官未锁定时才退回实时挑选。
     */

    private resolvePowerBadgeUnit(fallback: IBattleUnit, side: 'attacker' | 'defender'): IBattleUnit {
        const bf = this.boundRegionalBattleField;
        if (bf) {
            const cmd = side === 'attacker' ? bf.getAttackerCommander() : bf.getDefenderCommander();
            if (cmd) return cmd;
        }
        // 无战场 / 指挥官未锁定 → 退回到当前最优将
        return pickSideSkillGeneralUnit(this.getUnitsForSide(side)) ?? fallback;
    }

    private renderEightRingBadges(
        unit: IBattleUnit,
        opponent: IBattleUnit | null,
        side: 'attacker' | 'defender',
    ): { topChain: string; bottomChain: string; title: string; totalMult: number; totalTitle: string } {
        unit = this.resolvePowerBadgeUnit(unit, side);
        const battleType = this.boundRegionalBattleField?.type ?? this.currentBattleType;
        const terrain = this.getBattleTerrainForUi();
        const myUnits = this.getUnitsForSide(side);
        const oppUnits = this.getOpponentUnitsFor(side);
        const bf = this.boundRegionalBattleField;
        const cachedMyTroops = side === 'attacker' ? bf?.getCachedAttackerTroops() : bf?.getCachedDefenderTroops();
        const cachedOppTroops = side === 'attacker' ? bf?.getCachedDefenderTroops() : bf?.getCachedAttackerTroops();

        const isAtt = side === 'attacker';
        const renderBadge = (label: string, shortName: string, mult: number) => {
            const isBuff = mult > 1.001;
            const fmtVal = String(parseFloat(mult.toFixed(1)));
            if (Math.abs(mult - 1) <= 0.001 || fmtVal === '1' || fmtVal === '1.0') {
                return `<span style="display:inline-block;width:${uiPx(36)};height:1px;visibility:hidden;flex-shrink:0;"></span>`;
            }

            const borderColor = isBuff
                ? (isAtt ? 'rgba(253, 185, 49, 0.65)' : 'rgba(90, 170, 190, 0.65)')
                : 'rgba(235, 85, 75, 0.75)';
            const color = isBuff
                ? (isAtt ? 'rgba(255, 230, 160, 1)' : 'rgba(190, 240, 255, 1)')
                : 'rgba(255, 170, 160, 1)';
            const bg = isBuff
                ? (isAtt ? 'rgba(50, 20, 5, 0.85)' : 'rgba(10, 30, 45, 0.85)')
                : 'rgba(50, 10, 10, 0.85)';

            return `<span style="display:inline-block;padding:1px 4px;margin:0 1px;font-size:11.5px;font-weight:800;line-height:1.15;flex-shrink:0;border:1px solid ${borderColor};color:${color};background:${bg};border-radius:3px;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.4);" title="${label}：×${fmtVal}">${shortName}×${fmtVal}</span>`;
        };

        // ========== 第一行 5 标签: 名, 城, 文, 技, 军 ==========
        const famousMult = getFamousGeneralMult(unit);
        const top1 = renderBadge('名将光环', '名', famousMult);

        const passMult = getPassGarrisonCombatMultiplier(unit);
        const regionMult = getRegionCenterCombatMultiplier(unit);
        const top2 = renderBadge('据点城池', '城', passMult * regionMult);

        const cultureMult = getUnitCultureCombatMultiplier(unit);
        const top3 = renderBadge('文化加成', '文', cultureMult);

        let tacChar = '技';
        if (unit.generalId) {
            // 与中央六计角标、引擎同源（见 updateCenterSixSetBadges 内同款注释）
            const skillId = getActiveTacticalSkillId(unit) ?? unit.negatedSkillId ?? null;
            const entry = skillId ? resolveGeneralTacticalEntry(skillId) : null;
            if (entry) {
                const cls = EFFECT_TO_SIX_SET[entry.baseEffect] as TacticalSixSet;
                const TAC_MAP: Record<TacticalSixSet, string> = {
                    gongzhan: '攻', shengzhan: '胜', dizhan: '敌',
                    hunzhan: '混', bingzhan: '并', baizhan: '败',
                };
                if (cls && TAC_MAP[cls]) tacChar = TAC_MAP[cls];
            }
        }
        const tacMult = getOpeningTacticalPowerMultiplier(
            myUnits, oppUnits, side === 'attacker', { battleType, terrain }, unit,
            side === 'attacker' ? bf?.getDefenderCommander() : bf?.getAttackerCommander(),
            cachedMyTroops, cachedOppTroops,
        );
        const top4 = renderBadge('战术技能', tacChar, tacMult);

        const legionMult = getEliteCombatMultiplier(unit);
        const top5 = renderBadge('精锐部队', '军', legionMult);

        // ========== 第二行 3 标签: 势, 攻/防, 运 ==========
        let aptChar = '势';
        if (unit.generalId) {
            const profile = getGeneralProfile(unit.generalId);
            if (profile?.aptitude) {
                const APT_MAP: Record<string, string> = { create: '造', leverage: '借', reverse: '逆' };
                if (APT_MAP[profile.aptitude]) aptChar = APT_MAP[profile.aptitude];
            }
        }
        const aptMult = getAptitudePowerMult(myUnits, oppUnits, unit, cachedMyTroops, cachedOppTroops);
        const bot1 = renderBadge('三势适性', aptChar, aptMult);

        const styleChar = side === 'attacker' ? '攻' : '防';
        const styleMult = getAttackStylePowerMult(unit, side === 'attacker');
        const bot2 = renderBadge('攻防风格', styleChar, styleMult);

        const fateLuck = side === 'attacker'
            ? (this.boundRegionalBattleField?.getAttackerCurrentFateLuck() ?? 1)
            : (this.boundRegionalBattleField?.getDefenderCurrentFateLuck() ?? 1);
        const bot3 = renderBadge('命运运气', '运', fateLuck);

        const reinfLuck = this.getReinforcementJoinLuckForUnit(unit);
        let bot4 = '';
        if (reinfLuck !== null && Math.abs(reinfLuck - 1.0) > 0.001) {
            const reinfChar = reinfLuck > 1.001 ? '得' : '掣';
            bot4 = renderBadge('合兵协同', reinfChar, reinfLuck);
        }

        const topSlots = [top1, top2, top3, top4, top5];
        const botSlots = [bot1, bot2, bot3, bot4];

        const orderedTop = isAtt ? topSlots : [...topSlots].reverse();
        const orderedBot = isAtt ? botSlots : [...botSlots].reverse();

        const topChain = orderedTop.join('');
        const bottomChain = orderedBot.join('');

        const allDetail = [
            { label: '名将光环', shortName: '名', val: famousMult },
            { label: '据点城池', shortName: '城', val: passMult * regionMult },
            { label: '文化加成', shortName: '文', val: cultureMult },
            { label: '战术技能', shortName: tacChar, val: tacMult },
            { label: '精锐部队', shortName: '军', val: legionMult },
            { label: '三势适性', shortName: aptChar, val: aptMult },
            { label: '攻防风格', shortName: styleChar, val: styleMult },
            { label: '命运运气', shortName: '运', val: fateLuck },
        ].filter(f => Math.abs(f.val - 1) > 0.001);

        const effectiveReinfLuck = (reinfLuck !== null && reinfLuck !== undefined) ? reinfLuck : 1;
        const totalMult = famousMult * (passMult * regionMult) * cultureMult * tacMult * legionMult * aptMult * styleMult * fateLuck * effectiveReinfLuck;
        const fmtTotalStr = String(parseFloat(totalMult.toFixed(2)));

        const title = `战力加成明细：\n` + allDetail.map((f) => `• ${f.label}(${f.shortName})：×${parseFloat(f.val.toFixed(2))}`).join('\n');
        const totalTitle = `综合战力加成（八环连乘）：×${fmtTotalStr}\n` + (allDetail.length > 0
            ? allDetail.map((f) => `• ${f.label}(${f.shortName})：×${parseFloat(f.val.toFixed(2))}`).join('\n')
            : '• 无额外增减益（均势 1.00）');

        return { topChain, bottomChain, title, totalMult, totalTitle };
    }

    /** 返回当前战场中指定 side 自己的单位数组（= 对手的对手；与 getOpponentUnitsFor 同源） */
    private getUnitsForSide(side: 'attacker' | 'defender'): IBattleUnit[] {
        return this.getOpponentUnitsFor(side === 'attacker' ? 'defender' : 'attacker');
    }

    /** 返回当前战场中指定 side 的对手单位数组（用于压制减益读取） */
    private getOpponentUnitsFor(side: 'attacker' | 'defender'): IBattleUnit[] {
        const opponentSide = side === 'attacker' ? 'defender' : 'attacker';
        if (this.boundRegionalBattleField && !this.boundRegionalBattleField.isOver) {
            return opponentSide === 'attacker'
                ? this.boundRegionalBattleField.getAttackerUnits()
                : this.boundRegionalBattleField.getDefenderUnits();
        }
        if (this.currentRegionalUnits) {
            return opponentSide === 'attacker'
                ? this.currentRegionalUnits.attackers
                : this.currentRegionalUnits.defenders;
        }
        return [];
    }

    /** 援军信息容器（替代原侧栏小血条） */
    private applySideLabelStyle(el: HTMLDivElement, side: 'attacker' | 'defender'): void {
        const isAtt = side === 'attacker';
        el.style.cssText = `
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(T.sideBar.labelSize)};
            font-weight: 900;
            letter-spacing: ${uiPx(1)};
            line-height: 1.25;
            text-shadow: 0 2px 8px rgba(0,0,0,0.9);
            white-space: nowrap;
        `;
        el.dataset.side = side;
        el.style.color = isAtt ? T.colors.attackerName : T.colors.defenderName;
    }

    /**
     * 渲染「范阳军团: 1.78万」式侧栏标签（仅更新文本，不改 DOM 结构）。
     * [2026-06-12 美化] 数字与地图标签统一为「万」制：≥1 万显示两位小数（战斗中百位变动可见），
     * <1 万保留整数。弃用 en-US 千分位逗号（同屏两套数字格式）。
     */
    private renderSideLabel(side: 'attacker' | 'defender', name: string, troops: number): void {
        const nameEl = side === 'attacker' ? this.leftSideNameSpan : this.rightSideNameSpan;
        const totalBadge = side === 'attacker' ? this.leftTotalMultBadge : this.rightTotalMultBadge;
        nameEl.innerHTML = name;
        if (totalBadge) {
            const t = Math.max(0, Math.floor(troops));
            const troopStr = t >= 10000 ? `${(t / 10000).toFixed(2)}万` : `${t}`;
            totalBadge.innerHTML = troopStr;
            totalBadge.title = `${side === 'attacker' ? '攻方' : '守方'}现役兵力：${t} 人`;
            totalBadge.style.display = 'inline-block';
        }
    }

    private resolveFactionLabel(factionId: string | null): string {
        if (!factionId || factionId === 'panjun') return '叛军';
        const fm = (window as any).game?.factionManager;
        return fm?.getFactionName(factionId) ?? factionId;
    }

    private updateFactionDisplay(): void {
        this.applyFactionName(this.attackerFactionId, this.leftFactionNameSpan);
        this.applyFactionName(this.defenderFactionId, this.rightFactionNameSpan);
    }

    /** 战斗 HUD 叠在深色地图上：势力名一律浅色字，不用旗面色（浅旗会变黑字看不见） */
    private applyFactionName(factionId: string | null, nameSpan: HTMLSpanElement): void {
        nameSpan.textContent = this.resolveFactionLabel(factionId);
        nameSpan.style.color = '#f0f0e8';
        nameSpan.style.textShadow = '0 0 3px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.9)';
    }

    // --- INTERACTION ---

    private setupPortraitInteraction(img: HTMLImageElement, _isLeft: boolean) {
        img.style.cursor = 'default';
        img.style.pointerEvents = 'none';

        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!this.correctorOpen || !this.currentBattleKey) return;
            const side = img === this.leftPortrait ? 'attacker' : 'defender';
            this.toggleMirror(side);
        });
    }

    private createPortraitFrame(): HTMLDivElement {
        const frame = document.createElement('div');
        frame.style.cssText = `
            width: ${uiPx(T.portraitSlotWidth)};
            height: ${uiPx(620)};
            position: absolute;
            bottom: ${uiPx(T.portraitBottom)};
            overflow: visible;
            pointer-events: auto;
            z-index: ${T.zIndex.portrait};
        `;
        return frame;
    }

    private createPortraitFacingWrap(side: 'left' | 'right'): HTMLDivElement {
        const wrap = document.createElement('div');
        const edge = side === 'left' ? 'left' : 'right';

        wrap.style.cssText = `
            position: absolute;
            bottom: 0;
            ${edge}: ${uiPx(-T.portraitImageOffset)};
            height: 100%;
            display: flex;
            align-items: flex-end;
            ${side === 'left' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
            transform-origin: center bottom;
            pointer-events: none;
            filter: drop-shadow(0 20px 30px rgba(0,0,0,0.8));
        `;
        return wrap;
    }

    private createPortraitImage(): HTMLImageElement {
        // 给立绘本体叠一层更轻的边缘渐隐（弱于外层框架裁剪渐隐），
        // 让人物与框架融合更自然，但不抢 UI 框架主效果。
        const innerFade = Math.max(1.5, Math.min(4.5, T.portraitEdgeFade * 0.35));
        const innerHorizontal =
            `linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${innerFade}%, rgba(0,0,0,1) calc(100% - ${innerFade}%), rgba(0,0,0,0) 100%)`;
        const innerVertical =
            `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${innerFade}%, rgba(0,0,0,1) calc(100% - ${innerFade}%), rgba(0,0,0,0) 100%)`;
        const innerMask = `${innerHorizontal}, ${innerVertical}`;
        const img = document.createElement('img');
        img.style.cssText = `
            width: auto;
            height: 100%;
            display: block;
            pointer-events: auto;
            -webkit-mask-image: ${innerMask};
            mask-image: ${innerMask};
            -webkit-mask-composite: source-in;
            mask-composite: intersect;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
        `;
        return img;
    }

    /** 立绘裁剪框：固定尺寸 + 四缘渐隐 + overflow 裁切。
     *  渐隐做在此框上（不随 F2 缩放），img 在框内缩放/平移，超框部分被柔化裁掉。 */
    private createPortraitClip(): HTMLDivElement {
        const f = T.portraitEdgeFade;
        const horizontal = `linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%, rgba(0,0,0,1) calc(100% - ${f}%), rgba(0,0,0,0) 100%)`;
        const vertical = `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%, rgba(0,0,0,1) calc(100% - ${f}%), rgba(0,0,0,0) 100%)`;
        const mask = `${horizontal}, ${vertical}`;
        const clip = document.createElement('div');
        clip.style.cssText = `
            height: ${uiPx(550)};
            display: inline-block;
            overflow: hidden;
            -webkit-mask-image: ${mask};
            mask-image: ${mask};
            -webkit-mask-composite: source-in;
            mask-composite: intersect;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
        `;
        return clip;
    }

    /** 椭圆径向渐变：中心深、四边 rgba(...,0) 透出地图 */
    private buildCenterBackdropBackground(): string {
        const ex = T.centerFadeEllipseX;
        const ey = T.centerFadeEllipseY;
        const s0 = T.centerFadeStopInner;
        const sm = T.centerFadeStopMid;
        const so = T.centerFadeStopOuter;
        return `radial-gradient(
            ellipse ${ex}% ${ey}% at 50% 50%,
            rgba(12, 11, 10, 0.97) ${s0}%,
            rgba(10, 10, 14, 0.9) ${sm * 0.55}%,
            rgba(10, 10, 14, 0.72) ${sm}%,
            rgba(10, 10, 14, 0.32) ${so}%,
            rgba(8, 8, 12, 0) 100%)`;
    }

    private playPortraitEntrance(): void {
        // 面板落位后立绘再滑入，分层有节奏
        // 缩放只动外框 transform，绝不碰 img 的调校 transform（F2 位置/缩放数据）。
        this.leftPortraitFrame.style.animation =
            'portrait-frame-enter-left 0.5s ease-out 0.50s both';
        this.rightPortraitFrame.style.animation =
            'portrait-frame-enter-right 0.5s ease-out 0.55s both';
        // 蓄力收缩状态复位（换场重新蓄力；清上一场残留的内联缩放与 --pre-scale）
        for (const side of ['attacker', 'defender'] as const) {
            this.portraitWind[side] = { driving: false, pulsed: false, scale: 1 };
        }
        for (const frame of [this.leftPortraitFrame, this.rightPortraitFrame]) {
            frame.style.transform = '';
            frame.style.removeProperty('--pre-scale');
        }
    }

    /**
     * 蓄力收缩逐帧驱动（updateStats 每帧调）：
     * 仅当该侧存在可放技将领（pickSideSkillGeneralUnit，与保底亮相同判据）才收缩，
     * 从滑入结束(0.7s)即刻开始，随游戏内 elapsed 缓缩至 0.90，相持阈值处缩到底。
     * 无将侧保持 1.0（对称铁律）；脉冲放完（pulsed）不再二次收缩。
     */
    private updatePortraitWinddown(): void {
        const bf = this.boundRegionalBattleField;
        if (!bf || bf.isOver) return;
        const threshold = resolveStalemateUiThresholdSec(bf.targetDuration);
        const startSec = 0.7; // 滑入结束即刻蓄力
        if (bf.elapsed <= startSec) return;
        for (const side of ['attacker', 'defender'] as const) {
            const st = this.portraitWind[side];
            if (st.pulsed) continue;
            const units = side === 'attacker' ? bf.getAttackerUnits() : bf.getDefenderUnits();
            if (!pickSideSkillGeneralUnit(units)) continue; // 无技可放 → 不缩，保持两侧对称
            const frame = side === 'attacker' ? this.leftPortraitFrame : this.rightPortraitFrame;
            if (!st.driving) {
                st.driving = true;
                frame.style.animation = 'none'; // 清掉 settle 的 forwards 填充，让内联 transform 生效
                console.log(`✨ [PortraitWind] ${side === 'attacker' ? '攻方' : '守方'}立绘开始蓄力收缩 → ${CombatUI.PORTRAIT_WIND_MIN_SCALE}（至 ${threshold.toFixed(1)}s 技能亮相）`);
            }
            // 主段：线性缓缩到 0.90，终点 = 相持阈值 + 双方脉冲错开上限（后放侧也缩到它释放那一刻）
            const endSec = threshold + SKILL_PULSE_STAGGER_IDEAL_SEC;
            const k = Math.min(1, (bf.elapsed - startSec) / Math.max(0.001, endSec - startSec));
            if (k < 1) {
                st.scale = 1 - (1 - CombatUI.PORTRAIT_WIND_MIN_SCALE) * k;
            } else {
                // 主段走完技能仍未放（罕见）：不停，极缓下潜到硬底，直至脉冲释放
                const dt = Math.max(0, bf.elapsed - (st.lastE ?? bf.elapsed));
                st.scale = Math.max(CombatUI.PORTRAIT_WIND_FLOOR, st.scale - CombatUI.PORTRAIT_WIND_DRIFT_PER_SEC * dt);
            }
            st.lastE = bf.elapsed;
            frame.style.transform = `scale(${st.scale.toFixed(4)})`;
        }
    }

    /** 复位上一场的败方褪灰与技能脉冲状态（仅真正换场时清，同场 UI 刷新保留去重） */
    private resetBattleOverlays(battleField?: BattleField | null): void {
        for (const img of [this.leftPortrait, this.rightPortrait]) {
            img.style.transition = '';
            img.style.filter = '';
        }
        // 同场刷新（援军编入等）不清技能去重集/已燃表，防止脉冲重复、已燃态丢失
        if (!battleField || this.boundRegionalBattleField !== battleField) {
            this.skillPulseShownKeys.clear();
            this.skillSpentAt.clear();
            // [2026-07-18] 第三幕锚点仅换场清：镜头切进一场已过 80% 的战斗时，
            // 若沿用上一场锚点，崩溃/断崖方向可能画反（进度<80% 的自愈清零覆盖不到这条路径）
            this.collapseStartAttPct = null;
            // 「开局标尺在中间」：无缓动地归位到 50%，下一帧写入兵力比时才靠 0.45s 缓动滑进去。
            // 不归位的话新场会从上一场的收尾位置（可能是 100%）起步。
            this.attackerBar.style.transition = 'none';
            this.clashEffect.style.transition = 'none';
            this.rightTotalMultBadge.style.transition = 'none';
            this.attackerBar.style.width = '50%';
            this.clashEffect.style.left = 'calc(50% - 8px)';
            this.rightTotalMultBadge.style.left = `calc(50% + ${uiPx(36)})`;
            void this.attackerBar.offsetWidth; // 强制回流，让归位与随后的缓动分成两帧
        }
        // P0 终态复位：恢复拉锯条/交界/兵力牌同频 0.45s 缓动与呼吸、标题动画
        this.outcomeLocked = false;
        this.attackerBar.style.transition = 'width 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        this.clashEffect.style.transition = 'left 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        this.rightTotalMultBadge.style.transition = 'left 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        this.clashEffect.style.animation = 'clash-pulse 1.2s infinite ease-in-out';
        this.battleTitle.style.animation = '';
        this.skillPulseLastAt = 0;
        this.skillBurstSfxPlayed = false;
        for (const t of this.skillPulseTimers) window.clearTimeout(t);
        this.skillPulseTimers.length = 0;
    }

    /** 胜负揭晓·定格一拍（2026-07-18 主人定 P0）：
     *  ① 拉锯条 0.2s 快速撞底（不等 updateStats 的 0.55s 缓滑与 98% 钳制）
     *  ② 交界爆闪 → 交还呼吸
     *  ③ 标题改写「XX 勝」并从 1.35 倍弹出；败方立绘缓缓褪灰 */
    private showBattleOutcome(winnerFactionId: string | null): void {
        if (!winnerFactionId) return;
        this.outcomeLocked = true;
        // ① 拉锯条撞底
        const attackerWon = winnerFactionId === this.attackerFactionId;
        const finalPct = attackerWon ? 100 : 0;
        const slam = '0.2s cubic-bezier(0.55, 0, 0.9, 0.4)';
        this.attackerBar.style.transition = `width ${slam}`;
        this.clashEffect.style.transition = `left ${slam}`;
        this.rightTotalMultBadge.style.transition = `left ${slam}`;
        this.attackerBar.style.width = `${finalPct}%`;
        this.clashEffect.style.left = `calc(${finalPct}% - 8px)`;
        this.rightTotalMultBadge.style.left = `calc(${finalPct}% + ${uiPx(36)})`;
        // ② 交界爆闪：撞底同刻起闪，0.6s 后交还呼吸循环
        this.clashEffect.style.animation = 'clash-burst-flash 0.6s ease-out';
        window.setTimeout(() => {
            this.clashEffect.style.animation = 'clash-pulse 1.2s infinite ease-in-out';
        }, 600);
        // ③ 「XX 勝」弹出
        const name = (window as any).game?.cityManager?.getFactionName?.(winnerFactionId) ?? '';
        if (name && name !== '未知势力') {
            this.battleTitle.textContent = `${name} 勝`;
            this.battleTitle.style.animation = 'none';
            void this.battleTitle.offsetWidth;
            this.battleTitle.style.animation = 'outcome-title-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both';
        }
        // 败方立绘缓缓褪灰（只动 filter，不碰调校 transform；下场开战时复位）
        let loserImg: HTMLImageElement | null = null;
        if (winnerFactionId === this.attackerFactionId) loserImg = this.rightPortrait;
        else if (winnerFactionId === this.defenderFactionId) loserImg = this.leftPortrait;
        if (loserImg) {
            loserImg.style.transition = 'filter 1.6s ease';
            loserImg.style.filter = 'grayscale(0.9) brightness(0.8)';
        }
        // 不在此清空 skillPulseTimers：相持段错开中的后手脉冲须播完；run() 内 isOver 挡逆局/致死技即可
    }

    // --- LOGIC ---

    public show(battle: Battle) {
        this.currentBattle = battle;
        this.currentRegionalUnits = null;
        this.boundRegionalBattleField = null;
        this.currentBattleType = battle.type;
        this.isVisible = true;
        this.refreshCorrectorDataOnBattleOpen();
        this.resetBattleOverlays();
        this.attackerFactionId = battle.attacker.factionId;
        this.defenderFactionId = battle.defender.factionId;
        this.updateMultiplierBadges(battle.attacker, battle.defender);
        this.updateSkillBadges(battle.attacker, battle.defender);
        this.updateInfo(battle.attacker, battle.defender, '正在交战', '');
        this.container.style.animation = 'panel-entrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        this.playPortraitEntrance();
    }

    public showRegional(
        attackers: IBattleUnit[],
        defenders: IBattleUnit[],
        attackerPortrait?: string,
        defenderPortrait?: string,
        title?: string,
        description?: string,
        isNarrative?: boolean,
        battleDurationGameSec: number = 17,
        timeScale: number = 1,
        battleField?: BattleField
    ) {
        if (attackers.length === 0 || defenders.length === 0) return;

        this.clearRegionalTimers();
        this.resetBattleOverlays(battleField);

        this.currentBattle = null;
        this.currentRegionalUnits = { attackers, defenders };
        this.boundRegionalBattleField = battleField ?? null;
        this.currentBattleType = battleField?.type;
        this.lastTimeScale = Math.max(0.1, timeScale);
        this.isVisible = true;
        this.refreshCorrectorDataOnBattleOpen();

        if (this.boundRegionalBattleField) {
            this.refreshRegionalSafetyDeadline();
            this.boundRegionalBattleField.tryReleaseStalemateSkillUi();
        } else {
            const wallMs = Math.max(3500, (battleDurationGameSec / this.lastTimeScale) * 1000);
            this.regionalSafetyDeadline = performance.now() + wallMs + CombatUI.REGIONAL_TAIL_MS;
        }

        let displayTitle = title || '区域冲突';
        let displayYear = '';

        // [MODIFIED] Year Parsing Logic
        // Expect format: "公元前236年，始皇帝十一年，秦赵邺城之战"
        if (title) {
            const parts = title.split(/[，,]/).map(s => s.trim()); // Split and trim
            if (parts.length >= 3) {
                // Format: Year, Era, Title
                if (parts[0].includes('年')) {
                    // Combine Year and Era: "公元前236年 · 始皇帝十一年"
                    displayYear = `${parts[0]} · ${parts[1]}`;
                }
                displayTitle = parts[parts.length - 1];
            } else if (parts.length >= 2) {
                // Fallback: "前260年，秦赵长平之战"
                if (parts[0].includes('年')) {
                    displayYear = parts[0];
                }
                displayTitle = parts[parts.length - 1];
            } else {
                displayTitle = title;
            }
        }

        const attBattler = this.pickPrimaryDisplayUnit(attackers) ?? attackers[0];
        const defBattler = this.pickPrimaryDisplayUnit(defenders) ?? defenders[0];
        // 立绘单位：跟随军团优先（切换跟拍后立绘立即换新主角）；否则退回指挥官锁定。
        // 与 updateStats 的 getPrimaryBattler 同口径——此前用纯分数 pickPrimaryDisplayUnit +
        // resolvePowerBadgeUnit 的锁定指挥官，切跟拍到同场另一军团时立绘仍显示旧指挥官。
        const attacker = this.getPrimaryBattler('attacker')
            ?? this.resolvePowerBadgeUnit(this.pickGeneralDisplayUnit(attackers) ?? attBattler, 'attacker');
        const defender = this.getPrimaryBattler('defender')
            ?? this.resolvePowerBadgeUnit(this.pickGeneralDisplayUnit(defenders) ?? defBattler, 'defender');

        const attName = this.buildWaveGroupedSideName(attackers, 'attacker');
        const defName = this.buildWaveGroupedSideName(defenders, 'defender');

        this.attackerFactionId = attacker.factionId;
        this.defenderFactionId = defender.factionId;
        this.currentBattleKey = this.buildPortraitConfigKey(displayTitle, attacker, defender);

        this.updateMultiplierBadges(attBattler, defBattler);
        this.updateSkillBadges(attacker, defender);
        this.updateInfoDirect(attName, defName, displayTitle, displayYear, description, defenders);

        this.setPortrait(
            this.leftPortrait,
            attacker,
            attacker.generalId,
            attacker.factionId,
            attacker.generalId ? attackerPortrait : (attackerPortrait ?? attacker.portraitPath),
            'attacker',
        );
        this.setPortrait(
            this.rightPortrait,
            defender,
            defender.generalId,
            defender.factionId,
            defender.generalId ? defenderPortrait : (defenderPortrait ?? defender.portraitPath),
            'defender',
            this.leftPortrait.src || undefined,
        );

        const setGeneralName = (tag: HTMLDivElement, unit: IBattleUnit, side: 'attacker' | 'defender') => {
            this.fillGeneralNameTag(tag, unit, side);
        };
        setGeneralName(this.leftGeneralNameTag, attacker, 'attacker');
        setGeneralName(this.rightGeneralNameTag, defender, 'defender');

        this.updateStats();
        this.container.style.animation = 'panel-entrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        this.playPortraitEntrance();
    }

    public isRegionalVisible(): boolean {
        return this.isVisible && this.currentRegionalUnits !== null;
    }

    /** 以战场单位列表判定 generalId 属攻/守（优先于名牌 dataset，防攻城城防将错位） */
    private resolveGeneralBattleSide(
        bf: BattleField,
        generalId: string,
    ): 'attacker' | 'defender' | null {
        if (bf.getDefenderUnits().some((u) => u.generalId === generalId)) return 'defender';
        if (bf.getAttackerUnits().some((u) => u.generalId === generalId)) return 'attacker';
        return null;
    }

    private resolveGeneralSpeechName(
        generalId: string,
        side: 'attacker' | 'defender',
    ): string | null {
        const tag = side === 'attacker' ? this.leftGeneralNameTag : this.rightGeneralNameTag;
        if (tag.dataset.generalId === generalId && tag.textContent?.trim()) {
            return tag.textContent.trim();
        }
        return getGeneralRecordByGeneralId(generalId)?.generalName ?? null;
    }

    /** 技能事件是否属于当前绑定战场（异场事件禁止上面板/进语音，防同名技能冒名顶替） */
    public isTacticalEventForBoundBattle(info: { unitId?: string; generalId?: string }): boolean {
        const bf = this.boundRegionalBattleField;
        if (!bf) return true; // 未绑战场（旧调用路径）：维持原有启发式
        if (info.unitId) return bf.hasUnit(info.unitId);
        if (info.generalId) return this.resolveGeneralBattleSide(bf, info.generalId) !== null;
        return true;
    }

    /** 战术武将技触发效果（侧边徽章闪烁，不再弹大字） */
    public flashTacticalSkill(displayName: string, generalId?: string, skillId?: string): void {
        if (!displayName) return;
        // 战略技（str_*）只在大地图展示，禁止战斗 Cut-in
        if (skillId?.startsWith('str_')) return;
        // 如果战斗已经结束（胜负已分），不再响应任何新的脉冲（例如致死一击触发的逆局技）
        if (this.boundRegionalBattleField?.isOver) return;
        const bf = this.boundRegionalBattleField;
        const addFlash = (badge: HTMLSpanElement | null) => {
            if (!badge || !badge.textContent?.includes(displayName)) return;
            badge.style.animation = 'none';
            void badge.offsetWidth;
            badge.style.animation = 'tactical-skill-pop 1.5s ease-out forwards';
        };
        addFlash(this.leftMultBadge);
        addFlash(this.rightMultBadge);

        // —— 立绘/标签脉冲 ——
        // 武将技一局只放一次：UI 事件可能被重复广播（援军编入补发等），每侧一局只脉冲一次。
        // 侧别：① 战场单位列表 ② generalId 对名牌 ③ 技能标签兜底（仅限无将事件——
        //    带将事件若两级都找不到，多半是异场事件漏进来，用标签文字猜侧会冒名顶替，直接丢弃）。
        let side: 'attacker' | 'defender' | null = null;
        if (generalId && bf) {
            side = this.resolveGeneralBattleSide(bf, generalId);
        }
        if (!side && generalId) {
            if (this.leftGeneralNameTag.dataset.generalId === generalId) side = 'attacker';
            else if (this.rightGeneralNameTag.dataset.generalId === generalId) side = 'defender';
        }
        if (!side && !generalId) {
            const inLeft = !!this.findSkillTag(this.leftSkillsBox, displayName);
            const inRight = !!this.findSkillTag(this.rightSkillsBox, displayName);
            if (inLeft !== inRight) {
                side = inLeft ? 'attacker' : 'defender';
            }
        }
        if (!side) return;
        const pulseSide = side;
        // 一将一技按 skillId 分键去重（战略技 str_* 已在本函数入口拦截，不会到这里；
        // 分键是为同将不同战术技——如开局技与逆局技——互不误吞）
        if (generalId) {
            const genKey = `${pulseSide}|${generalId}|${skillId ?? ''}`;
            if (this.skillPulseShownKeys.has(genKey)) return;
            this.skillPulseShownKeys.add(genKey);
        }
        const key = `${pulseSide}-${displayName}`;
        if (this.skillPulseShownKeys.has(key)) return;
        this.skillPulseShownKeys.add(key);

        const units = pulseSide === 'attacker' ? bf?.getAttackerUnits() : bf?.getDefenderUnits();
        const pulseUnit = generalId ? units?.find((u) => u.generalId === generalId) : undefined;
        const audioUnitId = pulseUnit?.id ?? null;

        const runUi = () => {
            if (this.boundRegionalBattleField?.isOver) return;
            // 实际弹出时刻记档：混合场景（一侧语音驱动、一侧计时兜底）也按真实弹出时间错开
            this.skillPulseLastAt = Math.max(this.skillPulseLastAt, Date.now());
            // 已燃时刻（P1）：0.6s 后标签定格为降亮度+金框+✓——updateSkillBadges 每帧重建时按此补挂；
            // 「标明放了哪个技」由已燃态承担（旧标签 surge 附着于每帧被重建的元素，从未真正可见，已清理）
            this.skillSpentAt.set(`${pulseSide}-${displayName}`, Date.now());
            this.pulsePortraitForSkill(pulseSide);
            
            // 联动：在立绘正中央弹出巨大化技能文字 Cut-in
            const frame = pulseSide === 'attacker' ? this.leftPortraitFrame : this.rightPortraitFrame;
            const cutIn = document.createElement('div');
            cutIn.textContent = displayName;
            const isAtt = pulseSide === 'attacker';
            const coreGlow = isAtt ? 'rgba(255, 100, 0, 1)' : 'rgba(0, 150, 255, 1)';
            const wideGlow = isAtt ? 'rgba(255, 50, 0, 0.8)' : 'rgba(0, 100, 255, 0.8)';
            cutIn.style.cssText = `
                position: absolute;
                top: 70%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.5);
                color: #ffffff;
                font-size: ${uiPx(46)};
                font-weight: 900;
                font-family: 'Noto Serif SC', serif;
                font-style: italic;
                letter-spacing: ${uiPx(4)};
                pointer-events: none;
                z-index: 100;
                text-shadow: 
                    0 2px 2px rgba(0,0,0,0.9),
                    0 0 10px ${coreGlow},
                    0 0 20px ${coreGlow},
                    0 0 40px ${wideGlow},
                    0 10px 20px rgba(0,0,0,0.9);
                animation: skill-cut-in 3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                white-space: nowrap;
            `;
            frame.appendChild(cutIn);
            window.setTimeout(() => cutIn.remove(), 3000);
        };

        /** 无语音兜底：音效与 Cut-in 同刻；双方紧挨时仅首句插音效 */
        const runWithSfx = () => {
            if (!this.skillBurstSfxPlayed && audioUnitId) {
                this.skillBurstSfxPlayed = true;
                audioManager.playGeneralSkillSfx(audioUnitId);
            }
            runUi();
        };

        // [语音播报] 技能释放：语音入队成功则由「开口那一刻」驱动 Cut-in（念谁弹谁，声画同刻；
        // 入队顺序由 BattleField 排：优势先放，均势攻方先放）。不播 → 走下方错开计时兜底。
        const voiceWillPlaySfx = speechAnnouncer.isSkillVoiceIdle();
        if (this.announceSkillReleaseVoice(pulseSide, displayName, runUi, generalId, skillId, audioUnitId)) {
            if (voiceWillPlaySfx) this.skillBurstSfxPlayed = true;
            return;
        }
        // 长战错开念名；短战（≤10s）或相持窗不足时允许叠字，但双方都必须 Cut-in（顺序跟入队）
        const now = Date.now();
        const staggerMs = bf && !bf.isOver && bf.targetDuration > 0
            ? resolveSkillPulseStaggerSec(bf.targetDuration, bf.elapsed) * 1000
            : CombatUI.SKILL_PULSE_STAGGER_MS;
        const startAt = staggerMs <= 0
            ? now
            : Math.max(now, this.skillPulseLastAt + staggerMs);
        this.skillPulseLastAt = startAt;
        if (startAt <= now) {
            runWithSfx();
        } else {
            this.skillPulseTimers.push(window.setTimeout(runWithSfx, startAt - now));
        }
    }

    private findSkillTag(box: HTMLDivElement, displayName: string): HTMLElement | null {
        return (Array.from(box.children).find(
            (el) => el.textContent?.includes(displayName),
        ) as HTMLElement | undefined) ?? null;
    }

    /**
     * 技能释放语音：武将，势技名，精锐番号，八字诀（八字诀由 skillId 推六套，攻守分表）。
     * 入队成功返回 true，onStart 在该句开口时触发（驱动脉冲 Cut-in，念谁弹谁）；false = 不播，调用方自排脉冲。
     */
    private announceSkillReleaseVoice(
        side: 'attacker' | 'defender',
        displayName: string,
        onStart: () => void,
        generalId?: string,
        skillId?: string,
        audioUnitId?: string | null,
    ): boolean {
        if (!generalId || !skillId || !displayName) return false;
        const bf = this.boundRegionalBattleField;
        if (!bf || bf.isOver) return false;
        const rec = getGeneralRecordByGeneralId(generalId);
        if (!rec) return false;

        const battleSide = this.resolveGeneralBattleSide(bf, generalId) ?? side;
        const units = battleSide === 'attacker' ? bf.getAttackerUnits() : bf.getDefenderUnits();
        const gUnit = units.find((u) => u.generalId === generalId) ?? null;
        const generalName = this.resolveGeneralSpeechName(generalId, battleSide) ?? rec.generalName;
        const eliteName = gUnit ? getLegionEliteBadgeName(gUnit) : null;
        const opponentHasGeneral = battleSide === 'attacker'
            ? !!this.rightGeneralNameTag.dataset.generalId
            : !!this.leftGeneralNameTag.dataset.generalId;
        // 技能八字诀按兵力比势选，与该侧视角一致
        const bfRatio = bf.getInitialAttDefRatio();
        const sideR = battleSide === 'attacker' ? bfRatio : (1 / Math.max(bfRatio, 0.001));
        const skillJu: CaptureJu = sideR > 1.5 ? 'advantage' : sideR < 0.67 ? 'disadvantage' : 'balance';
        return speechAnnouncer.announceSkillRelease({
            side: battleSide,
            ju: skillJu,
            generalId,
            generalName,
            skillDisplayName: displayName,
            skillId,
            eliteName,
            opponentHasGeneral,
            audioUnitId: audioUnitId ?? gUnit?.id ?? null,
            onStart,
        });
    }

    /** 武将技释放的立绘脉冲：快起慢落（0.15s 放大到 1.08 → 缓缓落回），只动外框 transform。
     *  起点接蓄力收缩值（--pre-scale）：缩到 0.94 后弹到 1.08，一收一放；无蓄力时同旧版从 1 弹起。 */
    private pulsePortraitForSkill(side: 'attacker' | 'defender'): void {
        const frame = side === 'attacker' ? this.leftPortraitFrame : this.rightPortraitFrame;
        const st = this.portraitWind[side];
        frame.style.setProperty('--pre-scale', st.scale.toFixed(4));
        frame.style.transform = ''; // 交还给 surge 动画（both 填充结束时停在 scale(1)）
        st.pulsed = true; // 放完不再二次收缩；同侧后续脉冲 --pre-scale 已是 1 附近，行为同旧版
        st.scale = 1;
        frame.style.animation = 'none';
        void frame.offsetWidth;
        frame.style.animation = 'portrait-skill-surge 1.6s cubic-bezier(0.22, 1, 0.36, 1) both';
    }

    public isBoundToBattleField(battleField: BattleField): boolean {
        return this.isRegionalVisible() && this.boundRegionalBattleField === battleField;
    }

    /** 援军编入后刷新参战列表与侧栏（不重复播入场动画） */
    public syncRegionalParticipantsFromBattleField(battleField: BattleField): void {
        if (!this.isBoundToBattleField(battleField) || battleField.isOver) return;

        const attackers = battleField.getAttackerUnits();
        const defenders = battleField.getDefenderUnits();
        if (attackers.length === 0 || defenders.length === 0) return;

        this.currentRegionalUnits = { attackers, defenders };

        this.attackerDisplayName = this.buildWaveGroupedSideName(attackers, 'attacker');
        this.defenderDisplayName = this.buildWaveGroupedSideName(defenders, 'defender');

        const attBattler = this.pickPrimaryDisplayUnit(attackers) ?? attackers[0];
        const defBattler = this.pickPrimaryDisplayUnit(defenders) ?? defenders[0];
        // 【关键】援军编入不换立绘/名牌/技能：一律沿用开战锁定的指挥官。
        // 这里原本重挑一次，援军带来更强的将时会当场把主将顶掉，而引擎仍按锁定指挥官结算 → 脸和数字对不上。
        const attGeneral = this.resolvePowerBadgeUnit(this.pickGeneralDisplayUnit(attackers) ?? attBattler, 'attacker');
        const defGeneral = this.resolvePowerBadgeUnit(this.pickGeneralDisplayUnit(defenders) ?? defBattler, 'defender');

        this.updateMultiplierBadges(attBattler, defBattler);
        this.updateSkillBadges(attGeneral, defGeneral);
        this.setPortrait(this.leftPortrait, attGeneral, attGeneral.generalId, attGeneral.factionId, attGeneral.portraitPath, 'attacker');
        this.setPortrait(
            this.rightPortrait,
            defGeneral,
            defGeneral.generalId,
            defGeneral.factionId,
            defGeneral.portraitPath,
            'defender',
            this.leftPortrait.src || undefined,
        );
        this.updateGeneralNameTags(attGeneral, defGeneral);
        this.refreshRegionalSafetyDeadline();
        this.updateStats();
    }

    /**
     * 侧栏参战名单用名：读实体实时名（军团改名/精锐番号），勿用 adapter 创建快照。
     */
    private resolveBattleUnitListName(u: IBattleUnit): string {
        if (u.unitType === 'city') {
            const garrisonElite = readSiegeGarrisonEliteName(u.getEntity?.());
            if (garrisonElite) return garrisonElite;
            const city = u.getEntity?.() as { name?: string } | undefined;
            const cityName = (city?.name ?? '').trim();
            if (cityName) return `${cityName}驻军`;
            return (u.name || '驻军').trim();
        }
        const army = u.getEntity?.() as Army | undefined;
        if (army) {
            const live = (army.name ?? '').trim();
            if (live) return live;
            const elite = getLegionEliteLegionName(army);
            if (elite) return elite;
        }
        return (u.name || '军团').trim();
    }

    private buildWaveGroupedSideName(units: IBattleUnit[], side: 'attacker' | 'defender'): string {
        const activeUnits = units.filter(u => !u.isDestroyed && u.troops > 0);
        if (activeUnits.length === 0) return '';

        // 优先挑选带将/精锐/移动军团的主力部队；若只有城池单位，则取城池单位作守防主力
        const primary = [...activeUnits].sort(
            (a, b) => this.scoreBattleDisplayUnit(b) - this.scoreBattleDisplayUnit(a),
        )[0] ?? activeUnits[0];

        const displayName = this.resolveBattleUnitListName(primary);
        if (!displayName) return '';

        const isAtt = side === 'attacker';
        const nameSpan = `<span style="white-space: nowrap;">${displayName}</span>`;

        return `<div style="display: inline-flex; align-items: center; justify-content: ${isAtt ? 'flex-start' : 'flex-end'};">${nameSpan}</div>`;
    }

    // ============================================================
    // 游戏内立绘校正：F2 暂停 → 微调/绑图 → Enter 内存暂存 → Ctrl+S 写盘
    // ============================================================

    private correctorBusy = false;

    /** 串行化 F2 内的 async 操作（居中/重置/切换/写盘/绑图），避免手速过快时并发交错 */
    private runCorrectorExclusive(fn: () => Promise<unknown>): void {
        if (this.correctorBusy) return;
        this.correctorBusy = true;
        void Promise.resolve(fn()).finally(() => { this.correctorBusy = false; });
    }

    private setupCorrectorHotkeys(): void {
        // 捕获阶段拦截 +/-：避免与小键盘缩放立绘时触发 Leaflet 地图 zoom
        document.addEventListener('keydown', (e) => {
            if (!this.correctorOpen || this.portraitPickerOpen) return;
            if (!this.isPortraitScaleKey(e)) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (this.isPortraitScaleOutKey(e)) {
                this.nudgeCorrector(-0.02, 0, 0);
            } else {
                this.nudgeCorrector(0.02, 0, 0);
            }
        }, true);

        document.addEventListener('keydown', (e) => {
            // F2 在战斗界面可见时开关校正面板
            if (e.key === 'F2') {
                if (!this.isVisible) return;
                e.preventDefault();
                if (this.correctorOpen) this.closeCorrector();
                else this.openCorrector();
                return;
            }
            if (!this.correctorOpen) return;

            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                this.runCorrectorExclusive(() => this.flushCorrectorPendingToDisk(false));
                return;
            }

            if (this.portraitPickerOpen && e.key === 'Escape') {
                e.preventDefault();
                this.closePortraitPicker();
                return;
            }

            const tag = (document.activeElement?.tagName ?? '').toUpperCase();
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

            const fine = e.shiftKey ? 5 : 1;
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    if (e.shiftKey) this.closeCorrector(true);
                    else this.closeCorrector();
                    break;
                case 'Tab': e.preventDefault(); this.switchCorrectorSide(); break;
                case 'Enter': e.preventDefault(); this.runCorrectorExclusive(() => this.flushCorrectorPendingToDisk(false)); break;
                case 'ArrowLeft': e.preventDefault(); this.nudgeCorrector(0, -fine, 0); break;
                case 'ArrowRight': e.preventDefault(); this.nudgeCorrector(0, fine, 0); break;
                case 'ArrowUp': e.preventDefault(); this.nudgeCorrector(0, 0, -fine); break;
                case 'ArrowDown': e.preventDefault(); this.nudgeCorrector(0, 0, fine); break;
                default:
                    if (this.isPortraitScaleOutKey(e)) {
                        e.preventDefault();
                        this.nudgeCorrector(-0.02, 0, 0);
                    } else if (this.isPortraitScaleInKey(e)) {
                        e.preventDefault();
                        this.nudgeCorrector(0.02, 0, 0);
                    }
                    break;
            }
        });
    }

    private correctorImg(): HTMLImageElement {
        return this.correctorSide === 'attacker' ? this.leftPortrait : this.rightPortrait;
    }

    /** 从 img.src 取出 "/assets/.../x.png" 形式路径（解码空格等）。
     *  统一经 normalizePortraitWebPath 去掉可能混入的 /public 前缀——保证调校的
     *  「存 key」与「读 key」永远一致，杜绝 /public 前缀导致的「调了又丢」。 */
    private srcToPath(img: HTMLImageElement): string {
        const src = img.currentSrc || img.src;
        if (!src) return '';
        try {
            return normalizePortraitWebPath(decodeURIComponent(new URL(src, location.href).pathname));
        } catch {
            return '';
        }
    }

    /** 当前显示路径（用于像素读取、文件夹标尺、状态栏显示） */
    private correctorPath(): string {
        return this.correctorPathForSide(this.correctorSide);
    }

    /** 调校/保存用的立绘自身路径（待绑定时用目标 {generalId}.png，而非源图路径） */
    private correctorPathForSide(side: 'attacker' | 'defender'): string {
        const staged = this.portraitBindStaging.find((b) => b.side === side);
        if (staged) return staged.destPath;
        const img = side === 'attacker' ? this.leftPortrait : this.rightPortrait;
        return this.srcToPath(img);
    }

    /**
     * 存盘 key：立绘自身路径（每张图独立存一格）。与读取侧 resolvePortraitAdjust 的
     * 「自身路径优先」一致 → 换图 / 绑图后调校永远落在该将领自己的槽位，绝不串到别人格子里；
     * canonical 仅作读取兜底。待绑定图用 destPath（{generalId}.png，即该将领自身槽位）。
     */
    private correctorSaveKey(): string {
        return this.correctorPath();
    }

    private correctorSaveKeyForSide(side: 'attacker' | 'defender'): string {
        return this.correctorPathForSide(side);
    }

    /** 读像素/居中时用实际显示的 URL（待绑定图仍在源路径） */
    private correctorPixelUrl(): string {
        const staged = this.portraitBindStaging.find((b) => b.side === this.correctorSide);
        if (staged) return staged.sourcePath;
        return this.correctorPath();
    }

    private openCorrector(): void {
        this.correctorOpen = true;
        this.setCorrectorMapKeyboardSuppressed(true);
        this.correctorPrevPaused = this.pauseHook?.isGamePaused() ?? false;
        this.pauseHook?.setPaused(true);
        if (!this.correctorPanel) this.correctorPanel = this.buildCorrectorPanel();
        this.correctorPanel.style.display = 'flex';
        this.refreshGeneralNameTagInteract();
        void this.bootstrapCorrector();
    }

    /** 打开 F2：拉磁盘最新 portrait_adjust → 左右立绘均套用已存调校 */
    private async bootstrapCorrector(): Promise<void> {
        this.correctorDirtyPaths.clear();
        this.correctorData = structuredClone(DEFAULT_PORTRAIT_ADJUST);
        try {
            const res = await fetch('/api/portrait-adjust');
            if (res.ok) {
                this.mergePortraitAdjustInto(this.correctorData, await res.json());
            }
        } catch {
            // 无 dev API 时沿用打包进 DEFAULT 的数据
        }
        this.loadCorrectorDraft();
        this.applyBothCorrectorPortraits();
        this.highlightCorrectorSide();
        this.scheduleCorrectorCrosshairRefresh();
    }

    private mergePortraitAdjustInto(target: PortraitAdjustData, source: PortraitAdjustData): void {
        if (source.folders) {
            target.folders = { ...target.folders, ...source.folders };
        }
        if (source.images) {
            target.images = { ...target.images, ...source.images };
        }
        if (source.folderGuides) {
            target.folderGuides = { ...target.folderGuides, ...source.folderGuides };
        }
    }

    /**
     * 开战时后台拉一次磁盘最新调校。portrait-tuner 等其它页面写盘后，本页的整页刷新
     * 被 suppress-portrait-dev-hmr 拦截（防打断对局），内存数据会变旧——以前只有打开 F2
     * 才会重新同步（bootstrapCorrector），表现为「换完立绘开战显示不对，重开 F2 才恢复」。
     * 这里让战斗打开时就同步，立绘直接按最新调校显示。
     */
    private refreshCorrectorDataOnBattleOpen(): void {
        if (!import.meta.env.DEV) return;
        // F2 使用中 / 有未写盘的改动或待绑图时不碰内存数据，避免覆盖手上的调整
        if (this.correctorOpen || this.correctorDirtyPaths.size > 0 || this.portraitBindStaging.length > 0) return;
        const now = Date.now();
        if (now - this.correctorLastDiskFetchMs < 5000) return;
        this.correctorLastDiskFetchMs = now;
        void fetch('/api/portrait-adjust')
            .then((res) => (res.ok ? (res.json() as Promise<PortraitAdjustData>) : null))
            .then((disk) => {
                if (!disk) return;
                this.mergePortraitAdjustInto(this.correctorData, disk);
                this.mergePortraitAdjustInto(DEFAULT_PORTRAIT_ADJUST, disk);
                this.applyBothCorrectorPortraits();
            })
            .catch(() => { /* 无 dev API / 请求失败时静默，沿用内存数据 */ });
    }

    private canPersistPortraitPath(path: string): boolean {
        return path.startsWith('/assets/') && path.toLowerCase().endsWith('.png');
    }

    /** 主键盘 -/=、小键盘 +/-、[ ] 均用于立绘缩放 */
    private isPortraitScaleOutKey(e: KeyboardEvent): boolean {
        return e.key === '['
            || e.key === '-'
            || e.key === '_'
            || e.code === 'Minus'
            || e.code === 'NumpadSubtract'
            || e.code === 'BracketLeft';
    }

    private isPortraitScaleInKey(e: KeyboardEvent): boolean {
        return e.key === ']'
            || e.key === '+'
            || e.key === '='
            || e.code === 'Equal'
            || e.code === 'NumpadAdd'
            || e.code === 'BracketRight';
    }

    private isPortraitScaleKey(e: KeyboardEvent): boolean {
        return this.isPortraitScaleOutKey(e) || this.isPortraitScaleInKey(e);
    }

    /** F2 期间关闭 Leaflet 键盘 +/- 缩放，避免与立绘调校冲突 */
    private setCorrectorMapKeyboardSuppressed(suppress: boolean): void {
        const map = (window as any).game?.map?.getLeafletMap?.() as { keyboard?: { enabled(): boolean; disable(): void; enable(): void } } | undefined;
        const kb = map?.keyboard;
        if (!kb) return;
        if (suppress) {
            this.correctorMapKeyboardWasEnabled = kb.enabled();
            kb.disable();
            return;
        }
        if (this.correctorMapKeyboardWasEnabled) {
            kb.enable();
        } else {
            kb.disable();
        }
    }

    private applyPortraitAdjustToImg(img: HTMLImageElement, data: PortraitAdjustData = this.correctorData): void {
        const side: 'attacker' | 'defender' = img === this.leftPortrait ? 'attacker' : 'defender';
        const path = this.correctorPathForSide(side);
        if (!this.canPersistPortraitPath(path)) return;
        applyPortraitAdjustToElement(img, path, data);
    }

    /** 左右立绘都套用 correctorData（换边 / 打开 F2 时保证「以前保存好的状态」） */
    private applyBothCorrectorPortraits(): void {
        this.applyPortraitAdjustToImg(this.leftPortrait);
        this.applyPortraitAdjustToImg(this.rightPortrait);
    }

    /** 立绘 img 布局盒就绪后再铺准星（避免 offset 为 0） */
    private scheduleCorrectorCrosshairRefresh(): void {
        const refresh = () => this.updateCorrectorCrosshair();
        refresh();
        requestAnimationFrame(refresh);
        for (const img of [this.leftPortrait, this.rightPortrait]) {
            if (!img.complete) {
                img.addEventListener('load', refresh, { once: true });
            }
        }
    }

    private closeCorrector(forceDiscardDisk = false): void {
        this.runCorrectorExclusive(() => this.closeCorrectorAsync(forceDiscardDisk));
    }

    private async closeCorrectorAsync(forceDiscardDisk = false): Promise<void> {
        this.flushCorrectorSessionMemory();
        if (!forceDiscardDisk) {
            if (this.correctorHasPendingDiskWork()) this.setCorrectorStatus('写盘中…');
            if (!(await this.flushCorrectorPendingToDisk(true))) {
                return;
            }
        }
        this.correctorOpen = false;
        this.setCorrectorMapKeyboardSuppressed(false);
        this.closePortraitPicker();
        if (this.correctorPanel) this.correctorPanel.style.display = 'none';
        this.leftPortraitFrame.style.outline = '';
        this.leftPortraitFrame.style.boxShadow = 'none';
        this.rightPortraitFrame.style.outline = '';
        this.rightPortraitFrame.style.boxShadow = 'none';
        this.refreshGeneralNameTagInteract();
        this.updateCorrectorCrosshair(); // correctorOpen=false → 隐藏准星
        // 自动保存模式下改动即所见即所得（已写入 correctorData/DEFAULT），无需回退重绘
        // 仅当进入校正前游戏在运行时才恢复运行（尊重用户原本的暂停）
        if (!this.correctorPrevPaused) this.pauseHook?.setPaused(false);
    }

    private loadCorrectorDraft(): void {
        const path = this.correctorPath();
        const r = resolvePortraitAdjust(path, this.correctorData);
        this.correctorDraft = { scale: r.scale, offsetX: r.offsetX, offsetY: r.offsetY };
        this.renderCorrectorReadout();
        this.applyPortraitAdjustToImg(this.correctorImg());
    }

    private applyCorrectorPreview(): void {
        const saveKey = this.correctorSaveKey();
        if (!saveKey) return;
        this.correctorData.images = this.correctorData.images ?? {};
        this.correctorData.images[saveKey] = { ...this.correctorDraft };

        if (this.canPersistPortraitPath(saveKey)) {
            const prevSize = this.correctorDirtyPaths.size;
            this.correctorDirtyPaths.add(saveKey);
            const n = this.correctorDirtyPaths.size;
            // 每新增第 AUTO_SAVE_EVERY 张不同立绘时自动写盘（防崩溃丢失）
            if (n > prevSize && n % CombatUI.AUTO_SAVE_EVERY === 0) {
                this.runCorrectorExclusive(() => this.flushCorrectorPendingToDisk(false, true));
            } else {
                this.setCorrectorStatus(`已改 ${n} 张 · Enter/F2/Esc 写盘`);
            }
        }
        applyPortraitAdjustToElement(this.correctorImg(), this.correctorPath(), this.correctorData);
        this.renderCorrectorReadout();
        this.updateCorrectorCrosshair();
    }

    /** Tab 换边前：把当前边草稿写入内存，不落盘 */
    private syncCurrentCorrectorDraftToData(): void {
        const saveKey = this.correctorSaveKey();
        if (!this.canPersistPortraitPath(saveKey)) return;
        this.correctorData.images = this.correctorData.images ?? {};
        this.correctorData.images[saveKey] = { ...this.correctorDraft };

        if (this.correctorDirtyPaths.size > 0) {
            this.setCorrectorStatus(`已改 ${this.correctorDirtyPaths.size} 张 · Enter/F2/Esc 写盘`);
        }
    }

    private nudgeCorrector(dScale: number, dx: number, dy: number): void {
        const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
        this.correctorDraft.scale = Math.round(clamp(this.correctorDraft.scale + dScale, 0.4, 2.2) * 100) / 100;
        this.correctorDraft.offsetX = clamp(this.correctorDraft.offsetX + dx, -240, 240);
        this.correctorDraft.offsetY = clamp(this.correctorDraft.offsetY + dy, -240, 240);
        this.applyCorrectorPreview();
    }

    private async centerAlignCorrectorCurrent(): Promise<void> {
        const path = this.correctorPath();
        if (!path) return;
        this.setCorrectorStatus('居中中…');
        const folder = extractPortraitFolder(path) ?? '';
        const guide = this.correctorData.folderGuides?.[folder];
        const eyeY = guide?.eyeLineY ?? PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y;
        const chestX = guide?.chestLineX ?? PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X;
        const fit = await alignPortraitCenterFromUrl(this.correctorPixelUrl(), {
            keepScale: this.correctorDraft.scale,
            eyeLineY: eyeY,
            chestLineX: chestX,
        });
        if (!fit) { this.setCorrectorStatus('⚠ 读取像素失败，请手动微调'); return; }
        this.correctorDraft = { scale: fit.scale, offsetX: fit.offsetX, offsetY: fit.offsetY };
        this.applyCorrectorPreview();
        this.setCorrectorStatus('✓ 已居中（Enter 写盘）');
    }

    private async resetCorrectorCurrent(): Promise<void> {
        const saveKey = this.correctorSaveKey();
        if (!saveKey) return;
        this.setCorrectorStatus('恢复默认…');
        if (this.correctorData.images?.[saveKey]) {
            delete this.correctorData.images[saveKey];
            if (Object.keys(this.correctorData.images).length === 0) delete this.correctorData.images;
        }
        if (DEFAULT_PORTRAIT_ADJUST.images?.[saveKey]) {
            delete DEFAULT_PORTRAIT_ADJUST.images[saveKey];
            if (Object.keys(DEFAULT_PORTRAIT_ADJUST.images).length === 0) {
                delete DEFAULT_PORTRAIT_ADJUST.images;
            }
        }
        this.correctorDirtyPaths.add(saveKey);
        this.loadCorrectorDraft();
        applyPortraitAdjustToElement(this.correctorImg(), this.correctorPath(), this.correctorData);
        this.renderCorrectorReadout();
        const name = (this.correctorPath().split('/').pop() ?? saveKey);
        this.setCorrectorStatus(`✓ 已恢复默认：${name}（Enter 写盘）`);
    }

    private switchCorrectorSide(): void {
        this.runCorrectorExclusive(() => this.switchCorrectorSideAsync());
    }

    private async switchCorrectorSideAsync(): Promise<void> {
        this.syncCurrentCorrectorDraftToData();
        this.correctorSide = this.correctorSide === 'attacker' ? 'defender' : 'attacker';
        this.loadCorrectorDraft();
        this.highlightCorrectorSide();
        this.updateCorrectorCrosshair();
    }

    private highlightCorrectorSide(): void {
        const outlineStyle = '6px dashed #ff3333';
        const shadowStyle = '0 0 30px #ff3333';

        if (this.correctorSide === 'attacker') {
            this.leftPortraitFrame.style.outline = outlineStyle;
            this.leftPortraitFrame.style.boxShadow = shadowStyle;
            this.rightPortraitFrame.style.outline = '';
            this.rightPortraitFrame.style.boxShadow = 'none';
        } else {
            this.rightPortraitFrame.style.outline = outlineStyle;
            this.rightPortraitFrame.style.boxShadow = shadowStyle;
            this.leftPortraitFrame.style.outline = '';
            this.leftPortraitFrame.style.boxShadow = 'none';
        }
    }

    private buildCrosshair(): HTMLDivElement {
        const ch = document.createElement('div');
        ch.className = 'pt-crosshair';
        ch.innerHTML = '<div class="ch-face"></div><div class="ch-top"></div><div class="ch-eye"></div><div class="ch-chin"></div><div class="ch-waist"></div><div class="ch-mid"></div>';
        return ch;
    }

    /** 在两张立绘上铺准星：脸椭圆 + 眼线 + 胸线（手动对齐「大小差不多」） */
    private updateCorrectorCrosshair(): void {
        const pairs: Array<{ wrap: HTMLDivElement; img: HTMLImageElement; side: 'left' | 'right' }> = [
            { wrap: this.leftPortraitWrap, img: this.leftPortrait, side: 'left' },
            { wrap: this.rightPortraitWrap, img: this.rightPortrait, side: 'right' },
        ];
        for (const { wrap, img, side } of pairs) {
            let ch = side === 'left' ? this.leftCrosshair : this.rightCrosshair;
            if (!ch) {
                ch = this.buildCrosshair();
                wrap.appendChild(ch);
                if (side === 'left') this.leftCrosshair = ch; else this.rightCrosshair = ch;
            }
            const show = this.correctorOpen && this.correctorCrosshairOn && img.offsetWidth > 0;
            ch.style.display = show ? 'block' : 'none';
            if (!show) continue;
            if (!ch.querySelector('.ch-top')) {
                const top = document.createElement('div');
                top.className = 'ch-top';
                const mid = ch.querySelector('.ch-mid');
                if (mid) ch.insertBefore(top, mid);
                else ch.appendChild(top);
            }
            if (!ch.querySelector('.ch-chin')) {
                const chin = document.createElement('div');
                chin.className = 'ch-chin';
                const mid = ch.querySelector('.ch-mid');
                if (mid) ch.insertBefore(chin, mid);
                else ch.appendChild(chin);
            }
            if (!ch.querySelector('.ch-waist')) {
                const waist = document.createElement('div');
                waist.className = 'ch-waist';
                const mid = ch.querySelector('.ch-mid');
                if (mid) ch.insertBefore(waist, mid);
                else ch.appendChild(waist);
            }
            const g = getPortraitCorrectorCrosshairGuide();
            const topPct = (g.topLineY * 100).toFixed(1);
            const eyePct = (g.eyeLineY * 100).toFixed(1);
            const chinPct = (g.chinLineY * 100).toFixed(1);
            const waistPct = (g.waistLineY * 100).toFixed(1);
            const chestPct = (g.chestLineX * 100).toFixed(1);
            const ovalW = g.ovalW * 100;
            const ovalH = g.ovalH * 100;
            const ovalCx = g.ovalCx * 100;
            const ovalCy = g.ovalCy * 100;
            const chFace = ch.querySelector('.ch-face') as HTMLElement | null;
            const chTop = ch.querySelector('.ch-top') as HTMLElement | null;
            const chEye = ch.querySelector('.ch-eye') as HTMLElement | null;
            const chChin = ch.querySelector('.ch-chin') as HTMLElement | null;
            const chWaist = ch.querySelector('.ch-waist') as HTMLElement | null;
            const chMid = ch.querySelector('.ch-mid') as HTMLElement | null;
            if (chFace) {
                chFace.style.left = `${ovalCx - ovalW / 2}%`;
                chFace.style.top = `${ovalCy - ovalH / 2}%`;
                chFace.style.width = `${ovalW}%`;
                chFace.style.height = `${ovalH}%`;
            }
            if (chTop) chTop.style.top = `${topPct}%`;
            if (chEye) chEye.style.top = `${eyePct}%`;
            if (chChin) chChin.style.top = `${chinPct}%`;
            if (chWaist) chWaist.style.top = `${waistPct}%`;
            if (chMid) chMid.style.left = `${chestPct}%`;
            // 贴合 img 的未变换布局盒（缩放只动 transform，不动 offset*，故准星保持固定参照）
            ch.style.left = `${img.offsetLeft}px`;
            ch.style.top = `${img.offsetTop}px`;
            ch.style.width = `${img.offsetWidth}px`;
            ch.style.height = `${img.offsetHeight}px`;
        }
    }

    private toggleCorrectorCrosshair(): void {
        this.correctorCrosshairOn = !this.correctorCrosshairOn;
        if (this.crosshairBtn) this.crosshairBtn.textContent = this.correctorCrosshairOn ? '准星：开' : '准星：关';
        this.updateCorrectorCrosshair();
    }

    private correctorHasPendingDiskWork(): boolean {
        return this.portraitBindStaging.length > 0 || this.correctorDirtyPaths.size > 0;
    }

    /** Enter / Esc 退出：仅合并到内存，本场战斗立即生效，不触发 Vite 写盘刷新 */
    private flushCorrectorSessionMemory(): void {
        this.syncCurrentCorrectorDraftToData();
        DEFAULT_PORTRAIT_ADJUST.images = DEFAULT_PORTRAIT_ADJUST.images ?? {};
        for (const path of this.correctorDirtyPaths) {
            const adj = this.correctorData.images?.[path];
            if (adj) {
                DEFAULT_PORTRAIT_ADJUST.images[path] = { ...adj };
            } else if (DEFAULT_PORTRAIT_ADJUST.images[path]) {
                delete DEFAULT_PORTRAIT_ADJUST.images[path];
            }
        }
        if (DEFAULT_PORTRAIT_ADJUST.images && Object.keys(DEFAULT_PORTRAIT_ADJUST.images).length === 0) {
            delete DEFAULT_PORTRAIT_ADJUST.images;
        }
        // 写盘前：仅用 sourcePath（源图）做本场视觉预览，不污染将领档案路径
        // 写盘成功后，commitAllPendingPortraitBinds 会用服务端返回的最终路径覆盖
        for (const bind of this.portraitBindStaging) {
            if (!bind.destPath || bind.destPath === bind.sourcePath) {
                setGeneralPortraitOverride(bind.generalId, bind.sourcePath);
            }
            // 已有最终路径（写盘完成）则 override 已在 commit 里设好，无需重设
        }
        this.applyBothCorrectorPortraits();
        const nAdj = this.correctorDirtyPaths.size;
        const nBind = this.portraitBindStaging.length;
        if (nAdj === 0 && nBind === 0) return;
        const parts: string[] = ['✓ 本场已生效（内存）'];
        if (nAdj > 0) parts.push(`${nAdj} 张位置`);
        if (nBind > 0) parts.push(`${nBind} 张待绑`);
        parts.push('Enter/F2/Esc 写盘');
        this.setCorrectorStatus(parts.join(' · '));
    }

    /** Enter / Esc / Ctrl+S：写盘；Enter·Ctrl+S 不关 F2，Esc 写盘后关闭
     *  @param autoTrigger  true = 由 AUTO_SAVE_EVERY 触发的自动写盘 */
    private async flushCorrectorPendingToDisk(onExit: boolean, autoTrigger = false): Promise<boolean> {
        this.syncCurrentCorrectorDraftToData();
        const boundCount = this.portraitBindStaging.length;
        if (boundCount > 0) {
            if (!(await this.commitAllPendingPortraitBinds())) {
                return false;
            }
        }
        const hadAdjust = this.correctorDirtyPaths.size > 0;
        await this.saveCorrectorSession(onExit, autoTrigger);
        try {
            await this.refreshPortraitPickerAfterDiskWrite();
        } catch { /* 刷新选图器失败不阻断写盘结果 */ }
        if (!onExit && boundCount > 0 && !hadAdjust) {
            this.setCorrectorStatus(`✓ 已绑定 ${boundCount} 张立绘到磁盘`);
        }
        return true;
    }

    /** 写盘/绑图后 bump 缩略图 cache-bust 版本 */
    private bumpPortraitPickerCatalogRev(): void {
        this.portraitPickerCatalogRev = Date.now();
    }

    /** 预加载立绘 URL（绑图 rename 后 Windows 上偶发首帧 404，短重试） */
    private preloadPortraitWebPath(webPath: string, retries = 4): Promise<void> {
        const tryLoad = (attempt: number): Promise<void> =>
            new Promise((resolve, reject) => {
                const probe = new Image();
                probe.onload = () => resolve();
                probe.onerror = () => {
                    if (attempt >= retries) {
                        reject(new Error(`立绘加载失败：${webPath}`));
                        return;
                    }
                    window.setTimeout(() => {
                        tryLoad(attempt + 1).then(resolve, reject);
                    }, 80 * attempt);
                };
                probe.src = `${webPath}?v=${this.portraitPickerCatalogRev}&r=${attempt}`;
            });
        return tryLoad(0);
    }

    private createPortraitPickerThumbImg(webPath: string, alt: string): HTMLImageElement {
        const img = document.createElement('img');
        img.alt = alt;
        let attempt = 0;
        const load = () => {
            img.src = `${webPath}?v=${this.portraitPickerCatalogRev}&r=${attempt}`;
        };
        img.addEventListener('error', () => {
            if (attempt >= 3) return;
            attempt += 1;
            window.setTimeout(load, 60 * attempt);
        });
        load();
        return img;
    }

    /** 写盘/绑图后刷新选图器（源 PNG 可能已被 rename 走） */
    private async refreshPortraitPickerAfterDiskWrite(): Promise<void> {
        this.bumpPortraitPickerCatalogRev();
        if (!this.portraitPickerOpen) return;
        this.portraitPickerSelectedPath = null;
        const bindBtn = this.portraitPickerPanel?.querySelector('.pp-btn-bind') as HTMLButtonElement | null;
        if (bindBtn) bindBtn.disabled = true;
        await this.loadPortraitPickerCatalog();
        this.populatePortraitPickerFolderSelect();
        await this.renderPortraitPickerGrid();
    }

    private async applyBoundPortraitToCombatImg(
        bind: { destPath: string; sourcePath: string; side: 'attacker' | 'defender'; generalId: string },
    ): Promise<void> {
        // 先用 sourcePath 做临时 override（源图保证可访问），避免 destPath 尚未就绪时显示空白
        setGeneralPortraitOverride(bind.generalId, bind.sourcePath);
        try {
            await this.preloadPortraitWebPath(bind.destPath);
        } catch {
            // Windows 文件系统延迟，destPath 暂 404；源图已在战斗 UI 显示，不额外操作
            // 刷新页面后 FactionGenerals.ts 的 destPath 生效
            return;
        }
        // destPath 确认可访问，升级 override 并更新 img.src
        setGeneralPortraitOverride(bind.generalId, bind.destPath);
        const img = bind.side === 'attacker' ? this.leftPortrait : this.rightPortrait;
        const bust = `${bind.destPath}?v=${this.portraitPickerCatalogRev}`;
        await new Promise<void>((resolve) => {
            const done = () => {
                this.loadCorrectorDraft();
                applyPortraitAdjustToElement(img, bind.destPath, this.correctorData);
                this.scheduleCorrectorCrosshairRefresh();
                resolve();
            };
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
            img.src = bust;
            if (img.complete && img.naturalWidth > 0) done();
        });
    }

    private async commitAllPendingPortraitBinds(): Promise<boolean> {
        const pending = [...this.portraitBindStaging];
        if (pending.length === 0) return true;
        const committed: typeof pending = [];
        let failedBind: typeof pending[number] | null = null;
        try {
            for (const bind of pending) {
                failedBind = bind; // 本张未成功前先记为失败张，成功后清空
                const res = await fetch('/api/bind-general-portrait', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        generalId: bind.generalId,
                        sourcePath: bind.sourcePath,
                        targetFolder: bind.targetFolder,
                    }),
                });
                const result = await res.json() as { ok: boolean; error?: string; portraitPath?: string };
                if (!res.ok || !result.ok) {
                    throw new Error(result.error || `HTTP ${res.status}`);
                }
                // 绑定成功：用服务端返回的最终路径（而非源图路径）更新内存
                const finalPath = result.portraitPath ?? bind.destPath;
                registerPortraitPathRuntime(finalPath);           // 注入 KNOWN_PORTRAIT_PATHS
                setGeneralPortraitOverride(bind.generalId, finalPath); // 更新将领立绘缓存
                bind.destPath = finalPath;                        // 同步 staging 的 destPath
                committed.push(bind);
                failedBind = null;
                await this.applyBoundPortraitToCombatImg(bind);
            }
            this.portraitBindStaging = this.portraitBindStaging.filter(
                (b) => !committed.some((c) => c.generalId === b.generalId && c.side === b.side),
            );
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // 丢弃已成功的 + 当前失败的这一张：失败张若留在 staging，每次关闭 F2 都会重试并失败，
            // 导致只能 Shift+Esc 才能退出的死循环。未尝试的其余张保留，下次关闭再试。
            const drop = failedBind ? [...committed, failedBind] : committed;
            this.portraitBindStaging = this.portraitBindStaging.filter(
                (b) => !drop.some((c) => c.generalId === b.generalId && c.side === b.side),
            );
            this.setCorrectorStatus(`⚠ 绑图写盘失败：${msg} · 已跳过该图，可重新选择`);
            return false;
        }
    }

    /** Esc 退出（或 Enter）时写盘：本场 F2 改过的所有立绘路径一次性合并保存
     *  @param onExit  true = 退出时后台写盘（不改状态栏）
     *  @param autoTrigger  true = 自动触发（每 AUTO_SAVE_EVERY 张），状态栏显示"自动写盘" */
    private async saveCorrectorSession(onExit = false, autoTrigger = false): Promise<void> {
        this.syncCurrentCorrectorDraftToData();
        if (this.correctorDirtyPaths.size === 0) {
            if (!onExit) this.setCorrectorStatus('无改动，无需保存');
            return;
        }
        if (!onExit) this.setCorrectorStatus(autoTrigger ? '自动写盘中…' : '保存中…');
        try {
            // [2026-08-03 乐观锁] 与 tuner 同款：GET 带回 X-Adjust-Mtime，POST 原样交回；
            // 读写间隙有别的页面写盘 → 服务端 409 → 自动重拉重合并（最多 3 次），谁也不覆盖谁。
            let disk!: PortraitAdjustData;
            let result!: { ok: boolean; error?: string; backupFile?: string };
            for (let attempt = 0; ; attempt++) {
                const res = await fetch('/api/portrait-adjust');
                const baseMtime = res.ok ? (res.headers.get('X-Adjust-Mtime') ?? '') : '';
                disk = res.ok ? await res.json() : structuredClone(DEFAULT_PORTRAIT_ADJUST);
                disk.images = disk.images ?? {};
                for (const path of this.correctorDirtyPaths) {
                    const adj = this.correctorData.images?.[path];
                    if (adj) disk.images[path] = { ...adj };
                }
                const save = await fetch('/api/save-portrait-adjust', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Adjust-Base-Mtime': baseMtime },
                    // autoTrigger 时附带 backup:true，让服务端额外存一份带时间戳的备份
                    body: JSON.stringify(autoTrigger ? { ...disk, backup: true } : disk),
                });
                if (save.status === 409 && attempt < 2) {
                    console.warn(`[F2] 保存冲突（他处刚写盘），自动重拉合并重试 ${attempt + 1}/2`);
                    continue;
                }
                if (!save.ok) throw new Error(`HTTP ${save.status}`);
                result = await save.json() as { ok: boolean; error?: string; backupFile?: string };
                if (!result.ok) throw new Error(result.error || '保存失败');
                break;
            }
            this.mergePortraitAdjustInto(this.correctorData, disk);
            this.mergePortraitAdjustInto(DEFAULT_PORTRAIT_ADJUST, disk);
            this.applyBothCorrectorPortraits();
            const n = this.correctorDirtyPaths.size;
            this.correctorDirtyPaths.clear();
            if (!onExit) {
                let label: string;
                if (autoTrigger) {
                    const bname = result.backupFile ? result.backupFile.replace(/.*[\\/]/, '') : '';
                    label = bname
                        ? `✓ 自动写盘 ${n} 张 · 备份→${bname}`
                        : `✓ 自动写盘 ${n} 张 · 继续调整`;
                } else {
                    label = `✓ 已保存 ${n} 张（已永久生效）`;
                }
                this.setCorrectorStatus(label);
            }
        } catch (err) {
            this.setCorrectorStatus(`⚠ 保存失败：${err}`);
        }
    }

    private renderCorrectorReadout(): void {
        if (!this.correctorPanel) return;
        const readout = this.correctorPanel.querySelector('.cc-readout');
        if (readout) {
            const sideLabel = this.correctorSide === 'attacker' ? '左·攻' : '右·守';
            const name = (this.correctorPath().split('/').pop() ?? '—');
            readout.textContent =
                `${sideLabel}　${name}　缩放 ${this.correctorDraft.scale.toFixed(2)}　X ${this.correctorDraft.offsetX}　Y ${this.correctorDraft.offsetY}`;
        }
    }

    private setCorrectorStatus(msg: string): void {
        const el = this.correctorPanel?.querySelector('.cc-status');
        if (el) el.textContent = msg;
    }

    private buildCorrectorPanel(): HTMLDivElement {
        const panel = document.createElement('div');
        panel.id = 'portrait-corrector-panel';
        panel.style.cssText = `
            position: fixed; left: 50%; top: 16px; transform: translateX(-50%);
            display: none; flex-direction: column; gap: 8px;
            background: rgba(20,18,16,0.96); border: 1px solid #6a5a30; border-radius: 10px;
            padding: 12px 16px; z-index: 2147483000;
            font-family: "Noto Serif SC","Microsoft YaHei",serif; color: #e8e0d0;
            box-shadow: 0 8px 28px rgba(0,0,0,0.6); min-width: 460px; pointer-events: auto;
        `;
        const btn = (label: string, primary = false) =>
            `<button type="button" class="cc-btn${primary ? ' cc-btn-primary' : ''}">${label}</button>`;
        panel.innerHTML = `
            <div style="font-size:14px;font-weight:700;color:#f5d78e;">立绘校正（Enter/Esc 写盘 · 不刷新）</div>
            <div class="cc-readout" style="font-size:13px;color:#c4b89a;"></div>
            <div class="cc-actions" style="display:flex;flex-wrap:wrap;gap:8px;">
                ${btn('🗑️ 清除缓存')}
                ${btn('↔ 居中本张')}
                ${btn('↩ 恢复默认')}
                ${btn('准星：开')}
                ${btn('切换左右 (Tab)')}
                ${btn('💾 写盘 (Enter)', true)}
                ${btn('关闭 (Esc)')}
            </div>
            <div style="font-size:11px;color:#9a8f7a;line-height:1.5;">
                准星（<b>左右统一</b>）：<span style="color:#e8c878;">金椭圆</span>，<span style="color:#6ec8ff;">蓝=眼线</span>，<span style="color:#88e0d0;">青=下巴</span>，<span style="color:#c8a8e8;">紫=腰</span>，<span style="color:#ff9a7a;">橙竖=胸线</span>。眼/下巴/腰贴线，<b>[ ] / ± / 小键盘±</b> 缩放<br>
                方向键微调；Tab 换边；<b>Enter 写盘并继续</b>；<b>Esc / F2 写盘并关闭</b>（均不刷新）；Ctrl+S 同 Enter；F2 期间地图键盘缩放已关闭<br>
                Shift+Esc 关闭不写盘
            </div>
            <div class="cc-status" style="font-size:12px;color:#9fd4a8;min-height:1.2em;"></div>
        `;
        const style = document.createElement('style');
        style.textContent = `
            #portrait-corrector-panel .cc-btn {
                background:#2a2620;color:#e8e0d0;border:1px solid #4a4238;border-radius:5px;
                padding:7px 12px;cursor:pointer;font-size:13px;
            }
            #portrait-corrector-panel .cc-btn:hover { background:#3a342c; }
            #portrait-corrector-panel .cc-btn-primary { background:#5a4a28;border-color:#8a7038;color:#fff8e8; }
            .pt-crosshair { position:absolute; pointer-events:none; z-index:6; }
            .pt-crosshair .ch-face {
                position:absolute; box-sizing:border-box;
                border:2px dashed #e8c878; border-radius:50%;
                background:rgba(232,200,120,0.07);
                box-shadow:0 0 10px rgba(232,200,120,0.45);
            }
            .pt-crosshair .ch-top {
                position:absolute; left:0; right:0; height:0;
                border-top:2px dashed #ffa8ec; box-shadow:0 0 6px rgba(255,168,236,0.85);
            }
            .pt-crosshair .ch-eye {
                position:absolute; left:0; right:0; height:0;
                border-top:2px dashed #6ec8ff; box-shadow:0 0 6px rgba(96,196,255,0.85);
            }
            .pt-crosshair .ch-chin {
                position:absolute; left:0; right:0; height:0;
                border-top:2px dashed #88e0d0; box-shadow:0 0 6px rgba(120,220,200,0.8);
            }
            .pt-crosshair .ch-waist {
                position:absolute; left:0; right:0; height:0;
                border-top:2px dashed #c8a8e8; box-shadow:0 0 6px rgba(200,168,232,0.75);
            }
            .pt-crosshair .ch-mid {
                position:absolute; top:0; bottom:0; width:0;
                border-left:2px dashed #ff9a7a; box-shadow:0 0 6px rgba(255,120,80,0.85);
            }
        `;
        document.head.appendChild(style);
        const [clearCacheBtn, centerBtn, resetBtn, crossBtn, switchBtn, saveBtn, closeBtn] =
            Array.from(panel.querySelectorAll('.cc-btn')) as HTMLButtonElement[];
        this.crosshairBtn = crossBtn;
        // 按钮不抢焦点，避免点完按钮后按 Enter 既触发按钮又触发热键
        for (const b of [centerBtn, resetBtn, crossBtn, switchBtn, saveBtn, clearCacheBtn, closeBtn]) {
            b.addEventListener('mousedown', (e) => e.preventDefault());
        }
        centerBtn.addEventListener('click', () => this.runCorrectorExclusive(() => this.centerAlignCorrectorCurrent()));
        resetBtn.addEventListener('click', () => this.runCorrectorExclusive(() => this.resetCorrectorCurrent()));
        crossBtn.addEventListener('click', () => this.toggleCorrectorCrosshair());
        switchBtn.addEventListener('click', () => this.switchCorrectorSide());
        saveBtn.addEventListener('click', () => this.runCorrectorExclusive(() => this.flushCorrectorPendingToDisk(false)));
        clearCacheBtn.addEventListener('click', () => {
            localStorage.removeItem('PORTRAIT_CONFIG_DATA');
            window.location.reload();
        });
        closeBtn.addEventListener('click', () => this.closeCorrector());
        document.body.appendChild(panel);
        return panel;
    }

    public hide() {
        if (this.correctorOpen) this.closeCorrector();
        else this.closePortraitPicker();
        this.clearRegionalTimers();
        this.isVisible = false;
        this.currentBattle = null;
        this.currentRegionalUnits = null;
        this.boundRegionalBattleField = null;
        this.currentBattleType = undefined;
        this.regionalSafetyDeadline = 0;
        this.attackerFactionId = null;
        this.defenderFactionId = null;
        this.resetBattleOverlays();
        this.container.style.animation = 'none';
        this.container.style.transform = 'translate(-50%, 250%)';
        this.leftPortraitFrame.style.animation = 'none';
        this.rightPortraitFrame.style.animation = 'none';
        this.leftPortraitFrame.style.transform = '';
        this.rightPortraitFrame.style.transform = '';
    }

    /** 区域战结束回调：仅当绑定的战场确实结束时才收尾 */
    public notifyRegionalBattlesEnded(endedFields: BattleField[]): void {
        const bound = this.boundRegionalBattleField;
        if (!bound || !this.isRegionalVisible()) return;
        if (!endedFields.includes(bound)) return;
        this.boundRegionalBattleField = null;
        this.showBattleOutcome(bound.winnerFactionId);
        this.finishRegionalBattle();
    }

    /** 区域战结束：保留短尾展示后关闭 */
    public finishRegionalBattle(): void {
        if (!this.isRegionalVisible() || this.regionalHideTimer) return;
        this.regionalHideTimer = setTimeout(() => {
            this.regionalHideTimer = null;
            if (this.currentRegionalUnits) this.hide();
        }, CombatUI.REGIONAL_TAIL_MS);
    }

    private clearRegionalTimers(): void {
        if (this.regionalHideTimer) {
            clearTimeout(this.regionalHideTimer);
            this.regionalHideTimer = null;
        }
    }

    private refreshRegionalSafetyDeadline(): void {
        const bf = this.boundRegionalBattleField;
        if (!bf || bf.isOver) return;
        const remainingGameSec = Math.max(8, bf.targetDuration - bf.elapsed + 4);
        const wallMs = (remainingGameSec / this.lastTimeScale) * 1000 + CombatUI.REGIONAL_TAIL_MS;
        this.regionalSafetyDeadline = performance.now() + wallMs;
    }

    public update(timeScale: number = 1) {
        if (!this.isVisible) return;
        this.lastTimeScale = Math.max(0.1, timeScale);

        if (this.boundRegionalBattleField) {
            if (this.boundRegionalBattleField.isOver) {
                if (!this.regionalHideTimer) {
                    const ended = this.boundRegionalBattleField;
                    this.boundRegionalBattleField = null;
                    if (this.isRegionalVisible()) {
                        this.showBattleOutcome(ended.winnerFactionId);
                        this.finishRegionalBattle();
                    }
                }
            } else {
                this.refreshRegionalSafetyDeadline();
                if (this.regionalSafetyDeadline > 0 && performance.now() > this.regionalSafetyDeadline) {
                    console.warn('[CombatUI] 区域战 UI 兜底超时，强制关闭');
                    this.hide();
                    return;
                }
            }
        } else if (
            this.currentRegionalUnits &&
            this.regionalSafetyDeadline > 0 &&
            performance.now() > this.regionalSafetyDeadline
        ) {
            this.hide();
            return;
        }

        try {
            this.updateStats();
        } catch (e) {
            console.warn('[CombatUI] updateStats failed, forcing hide', e);
            this.hide();
        }
    }

    private updateInfo(att: IBattleUnit, def: IBattleUnit, title: string, year: string) {
        const mapName = (u: IBattleUnit) => {
            if (u.unitType === 'city') {
                const eliteName = readSiegeGarrisonEliteName(u.getEntity?.());
                if (eliteName) {
                    return `<div style="text-align: inherit;"><span style="white-space: nowrap;">${eliteName}</span></div>`;
                }
            }
            const match = u.name.match(/(军团|驻军|守军)$/);
            const base = match ? u.name.substring(0, match.index) : u.name;
            const suffix = match ? match[0] : '';
            if (!suffix) {
                return `<div style="text-align: inherit;"><span style="white-space: nowrap;">${base}</span></div>`;
            }
            return `<div style="display: grid; grid-template-columns: max-content max-content; column-gap: 4px; text-align: inherit;"><span style="white-space: nowrap;">${base}</span><span style="opacity: 0.85; font-size: 0.95em; margin-left: 2px; white-space: nowrap;">${suffix}</span></div>`;
        };
        this.attackerFactionId = att.factionId;
        this.defenderFactionId = def.factionId;
        
        this.updateInfoDirect(mapName(att), mapName(def), title, year, undefined, def);
        
        this.currentBattleKey = title || `battle_${Date.now()}`;
        this.setPortrait(this.leftPortrait, att, att.generalId, att.factionId, undefined, 'attacker');
        this.setPortrait(this.rightPortrait, def, def.generalId, def.factionId, undefined, 'defender', this.leftPortrait.src || undefined);
        this.updateStats();
    }

    private updateInfoDirect(attName: string, defName: string, title: string, year: string, description?: string, defUnits?: IBattleUnit | IBattleUnit[]) {
        this.attackerDisplayName = attName;
        this.defenderDisplayName = defName;
        
        let suffix = '';
        const defs = defUnits ? (Array.isArray(defUnits) ? defUnits : [defUnits]) : [];
        const cityUnit = defs.find(u => u.unitType === 'city');
        if (cityUnit) {
            if (Math.abs(getPassGarrisonCombatMultiplier(cityUnit) - 1) > 0.001) suffix = '险要';
            else if (Math.abs(getRegionCenterCombatMultiplier(cityUnit) - 1) > 0.001) suffix = '名城';
        }
        
        if (suffix) {
            this.battleTitle.innerHTML = `${title}<span style="display:inline-block;padding:0 4px;border:1px solid rgba(255,215,0,0.4);border-radius:2px;font-size:0.35em;background:rgba(0,0,0,0.5);margin-left:8px;color:rgba(255,215,0,0.85);vertical-align:bottom;transform:translateY(-6px);letter-spacing:normal;">${suffix}</span>`;
        } else {
            this.battleTitle.textContent = title;
        }
        
        this.battleYear.textContent = year;
        this.battleYear.style.display = year ? 'block' : 'none';

        if (description) {
            this.eventDescription.textContent = description;
            this.eventDescription.style.display = 'block';
        } else {
            this.eventDescription.style.display = 'none';
        }
    }

    private updateStats() {
        let attCurrent = 0, attMax = 0;
        let defCurrent = 0, defMax = 0;

        if (this.currentBattle) {
            attCurrent = this.currentBattle.attacker.troops;
            attMax = this.currentBattle.attacker.maxTroops;
            defCurrent = this.currentBattle.defender.troops;
            defMax = this.currentBattle.defender.maxTroops;
        } else if (this.currentRegionalUnits) {
            if (this.boundRegionalBattleField && !this.boundRegionalBattleField.isOver) {
                const info = this.boundRegionalBattleField.getInfo();
                attCurrent = info.attackerTroops;
                defCurrent = info.defenderTroops;
                attMax = Math.max(info.attackerInitial, attCurrent);
                defMax = Math.max(info.defenderInitial, defCurrent);

                const atts = this.boundRegionalBattleField.getAttackerUnits();
                const defs = this.boundRegionalBattleField.getDefenderUnits();
                if (atts.length > 0) this.attackerDisplayName = this.buildWaveGroupedSideName(atts, 'attacker');
                if (defs.length > 0) this.defenderDisplayName = this.buildWaveGroupedSideName(defs, 'defender');
            } else {
                for (const u of this.currentRegionalUnits.attackers) {
                    if (u.isDestroyed) continue;
                    attCurrent += u.troops;
                    attMax += u.maxTroops;
                }
                for (const u of this.currentRegionalUnits.defenders) {
                    if (u.isDestroyed) continue;
                    defCurrent += u.troops;
                    defMax += u.maxTroops;
                }
                if (this.currentRegionalUnits.attackers.length > 0) {
                    this.attackerDisplayName = this.buildWaveGroupedSideName(this.currentRegionalUnits.attackers, 'attacker');
                }
                if (this.currentRegionalUnits.defenders.length > 0) {
                    this.defenderDisplayName = this.buildWaveGroupedSideName(this.currentRegionalUnits.defenders, 'defender');
                }
            }
        }

        // 蓄力收缩：会放技侧立绘随游戏时间缓缩，技能亮相时刻缩到底（脉冲从收缩值弹起）
        this.updatePortraitWinddown();

        // 溃败悬停（2026-08-03 主人定）：第三阶段起败方兵力数字减到初始 10% 即停住，
        // 断崖 1 秒内随条子 u^6 同步崩到 0——「残兵困守 → 兵败如山倒」的溃败感。
        // 方向跟随 collapseStartAttPct（第三阶段锁定，与条子断崖同侧），翻盘不横穿。
        // 纯显示层：只改渲染给玩家的数字，title 仍写引擎真实兵力。
        // outcomeLocked 后停用：否则第三阶段中段被 forceResolve/城易主提前结束时，
        // 败方引擎兵力已清零，数字却会被钳回 10% 一直挂着（正常流程 u≈1 已崩到 0，无碍）。
        if (!this.outcomeLocked && this.collapseStartAttPct !== null) {
            const bc: any = this.boundRegionalBattleField || this.currentBattle;
            const prog = bc ? Math.min(1, (bc.elapsed || 0) / Math.max(1, bc.targetDuration || 17)) : 1;
            if (prog >= PHASE_COLLAPSE_START) {
                const s = Math.min(1, (prog - PHASE_COLLAPSE_START) / Math.max(0.0001, 1 - PHASE_COLLAPSE_START));
                const attWins = this.collapseStartAttPct >= 50;
                const applyLoserHold = (cur: number, max: number) => {
                    const base = max * LOSER_HOLD_PCT;
                    if (s < BAR_CLIFF_START) return Math.max(cur, base); // 相持段：减到 10% 即悬停
                    const u = (s - BAR_CLIFF_START) / Math.max(0.0001, 1 - BAR_CLIFF_START);
                    return base * (1 - Math.pow(u, 6)); // 断崖段：10% 随条子 u^6 崩到 0
                };
                if (!attWins) attCurrent = applyLoserHold(attCurrent, attMax);
                else defCurrent = applyLoserHold(defCurrent, defMax);
            }
        }

        // 侧栏「名称: 兵力」+ 各自小血条；中央主条为双方兵力比
        this.renderSideLabel('attacker', this.attackerDisplayName, attCurrent);
        this.renderSideLabel('defender', this.defenderDisplayName, defCurrent);
        this.updateFactionDisplay();
        this.updateMultiplierBadges(
            this.getPrimaryBattler('attacker'),
            this.getPrimaryBattler('defender'),
        );
        this.updateSkillBadges(
            this.getPrimaryBattler('attacker'),
            this.getPrimaryBattler('defender'),
        );

        const total = attCurrent + defCurrent;
        const realAttPct = total > 0 ? (attCurrent / total) * 100 : 50;

        // 视觉微摆：配合 BattleField 三阶段节奏（40%/80%/100%）
        let progress = 0;
        let battleClockSec = 0; // 战斗逻辑秒（已乘 timeScale）：暂停即停摆、倍速同频
        if (this.currentBattle) {
            const b: any = this.currentBattle;
            battleClockSec = b.elapsed || 0;
            progress = Math.min(1, battleClockSec / Math.max(1, b.targetDuration || 17));
        } else if (this.boundRegionalBattleField && !this.boundRegionalBattleField.isOver) {
            battleClockSec = this.boundRegionalBattleField.elapsed;
            progress = Math.min(1, battleClockSec / Math.max(1, this.boundRegionalBattleField.targetDuration));
        } else {
            progress = 1;
        }

        // 占优方（=标尺要倒向的一面）：区域性战斗读引擎判定的强方（八环有效战力比，援军/败战翻盘会重算翻转），
        // 与胜负一致——兵力少但名将局打赢时标尺不再向输家倾斜；均势局也不再 50% 临界反复突跳。
        // 旧面板（currentBattle，无 BattleField）退回实时兵力比。
        const attStronger = this.boundRegionalBattleField
            ? this.boundRegionalBattleField.isAttackerPredictedStronger()
            : realAttPct >= 50;
        const lead = attStronger ? 1 : -1;
        /** 第二、三阶段的落点：恒定 80/20，不看兵力比 */
        const stalematePct = 50 + lead * (CLASH_STALEMATE_PCT - 50);

        // 摇摆走战斗逻辑时钟（2026-08-03 主人定）：周期约 12.6s，平时沉稳缓慢，
        // 只有崩溃段（u^6）才快速下落；暂停即停摆、倍速随战斗同频。谐波弱化去「碎动」。
        const swingT = battleClockSec / 2.0;
        const swingUnit = Math.sin(swingT) * 0.8 + Math.sin(swingT * 1.4) * 0.1;

        let attPct: number;
        if (progress < PHASE_STALEMATE_START) {
            // 第一阶段（12 秒）：开局标尺在**正中**（铁律，勿改），整段 12 秒逐步爬向真实兵力比，
            // 到本阶段末刚好到位；**不封顶**。与第二阶段的 12 秒接起来 = 24 秒连续逐步移动。
            this.collapseStartAttPct = null;
            const enterK = Math.min(1, progress / Math.max(0.0001, PHASE_STALEMATE_START * BAR_ENTER_RATIO_OF_ACT1));
            // 「相持」= 前期几乎黏在中间，越往后拉得越开（幂次缓入，不是匀速也不是 smoothstep）。
            // smoothstep 在半程就走完一半，看着像匀速滑——相持感不够，主人否掉了。
            const eased = Math.pow(enterK, BAR_ACT1_EASE_POWER);
            attPct = 50 + (realAttPct - 50) * eased + swingUnit * BAR_SWING_ACT1;
        } else if (progress < PHASE_COLLAPSE_START) {
            // 第二阶段·一边倒（12 秒）：从兵力比位置移到强方落点 80/20（2026-08-03 起方向读引擎强方，
            // 以少胜多局从兵力劣势侧往回退到强方侧；均势局从 50 附近往外推）
            this.collapseStartAttPct = null;
            const k = (progress - PHASE_STALEMATE_START) / (PHASE_COLLAPSE_START - PHASE_STALEMATE_START);
            const eased = k * k * (3 - 2 * k); // smoothstep：两端柔和，中段果断
            const swingAmp = BAR_SWING_ACT2_FROM + (BAR_SWING_ACT2_TO - BAR_SWING_ACT2_FROM) * k;
            attPct = realAttPct + (stalematePct - realAttPct) * eased + swingUnit * swingAmp;
        } else {
            // 第三阶段（6 秒）：在 80% 大幅摇摆相持 5 秒 + 最后 1 秒断崖直接到底。
            // 落点在进入本阶段时锁定：败战计中途翻盘换边时，条子不会在最后 6 秒里横穿中线。
            if (this.collapseStartAttPct === null) this.collapseStartAttPct = stalematePct;
            const hold = this.collapseStartAttPct;
            const s = Math.min(1, (progress - PHASE_COLLAPSE_START) / Math.max(0.0001, 1 - PHASE_COLLAPSE_START));
            if (s < BAR_CLIFF_START) {
                attPct = hold + swingUnit * BAR_SWING_ACT3;
            } else {
                // 断崖段：u^6 瞬间崩塌，直接推到底（100/0），不再留给宣判撞底。
                // 摇摆按 (1-u) 淡出，否则崩塌起点会从摆动中的任意位置突跳回 hold。
                const u = (s - BAR_CLIFF_START) / (1 - BAR_CLIFF_START);
                const cliff = hold >= 50 ? 100 : 0;
                attPct = hold + (cliff - hold) * Math.pow(u, 6) + swingUnit * BAR_SWING_ACT3 * (1 - u);
            }
        }
        attPct = Math.max(0, Math.min(100, attPct));

        if (!this.outcomeLocked) {
            this.attackerBar.style.width = `${attPct}%`;
            this.clashEffect.style.left = `calc(${attPct}% - 8px)`;
            this.rightTotalMultBadge.style.left = `calc(${attPct}% + ${uiPx(36)})`;
        }

        // 溃败预兆（2026-07-18 主人定 P2）：第三幕起，落后方立绘渐染血红+变暗、名牌闪烁——高潮前的情绪铺垫；
        // 定格后（outcomeLocked）交给 showBattleOutcome 的褪灰，不插手
        if (!this.outcomeLocked && progress >= PHASE_COLLAPSE_START && total > 0 && attCurrent !== defCurrent) {
            const k = Math.min(1, (progress - PHASE_COLLAPSE_START) / Math.max(0.0001, 1 - PHASE_COLLAPSE_START));
            const attBehind = attCurrent < defCurrent;
            const behindImg = attBehind ? this.leftPortrait : this.rightPortrait;
            const aheadImg = attBehind ? this.rightPortrait : this.leftPortrait;
            const behindTag = attBehind ? this.leftGeneralNameTag : this.rightGeneralNameTag;
            const aheadTag = attBehind ? this.rightGeneralNameTag : this.leftGeneralNameTag;
            aheadImg.style.filter = '';
            aheadTag.style.opacity = '';
            behindImg.style.filter =
                `drop-shadow(0 0 ${6 + 8 * k}px rgba(255, 40, 20, ${0.3 + 0.25 * k})) brightness(${1 - 0.06 * k})`;
            behindTag.style.opacity = `${0.45 + 0.55 * Math.abs(Math.sin(performance.now() / 160))}`;
        } else if (!this.outcomeLocked) {
            // 未进第三幕（或战平）：清掉两側残留（resetBattleOverlays 开场已清，这里防同场拉锯反复）
            this.leftPortrait.style.filter = '';
            this.rightPortrait.style.filter = '';
            this.leftGeneralNameTag.style.opacity = '';
            this.rightGeneralNameTag.style.opacity = '';
        }

        // --- 优劣均 兵力状态指示器 ---
        const bfRatio = this.boundRegionalBattleField ? this.boundRegionalBattleField.getInitialAttDefRatio() : (attMax / Math.max(1, defMax));
        const attAdvantage = bfRatio > 1.5;
        const attDisadvantage = bfRatio < 0.67;

        const setActive = (el: HTMLDivElement, theme: 'you' | 'lie' | 'jun') => {
            el.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            if (theme === 'you') {
                el.style.color = '#FFF2D4'; // 柔和的鎏金色
                el.style.background = 'linear-gradient(135deg, rgba(120, 80, 10, 0.95), rgba(40, 20, 5, 0.95))';
                el.style.borderColor = 'rgba(255, 184, 0, 0.8)';
                el.style.boxShadow = '0 0 12px rgba(255, 184, 0, 0.5), inset 0 0 8px rgba(255, 184, 0, 0.3)';
                el.style.textShadow = '0 0 6px rgba(255, 184, 0, 0.8)';
            } else if (theme === 'lie') {
                el.style.color = '#FFD4D4'; // 柔和的血月色
                el.style.background = 'linear-gradient(135deg, rgba(90, 20, 20, 0.95), rgba(30, 5, 5, 0.95))';
                el.style.borderColor = 'rgba(255, 59, 48, 0.8)';
                el.style.boxShadow = '0 0 12px rgba(255, 59, 48, 0.5), inset 0 0 8px rgba(255, 59, 48, 0.3)';
                el.style.textShadow = '0 0 6px rgba(255, 59, 48, 0.8)';
            } else if (theme === 'jun') {
                el.style.color = '#D4F4FF'; // 柔和的冰蓝色
                el.style.background = 'linear-gradient(135deg, rgba(15, 60, 90, 0.95), rgba(5, 20, 40, 0.95))';
                el.style.borderColor = 'rgba(0, 229, 255, 0.8)';
                el.style.boxShadow = '0 0 12px rgba(0, 229, 255, 0.5), inset 0 0 8px rgba(0, 229, 255, 0.3)';
                el.style.textShadow = '0 0 6px rgba(0, 229, 255, 0.8)';
            }
        };

        const setInactive = (el: HTMLDivElement) => {
            el.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            el.style.color = 'rgba(255, 255, 255, 0.15)'; // 极暗的灰字
            el.style.background = 'linear-gradient(135deg, rgba(30, 30, 32, 0.8), rgba(10, 10, 12, 0.8))';
            el.style.borderColor = 'rgba(80, 80, 85, 0.4)'; // 黯淡的边框
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.6)';
            el.style.textShadow = 'none';
        };

        setInactive(this.indicatorLeftYou);
        setInactive(this.indicatorLeftLie);
        setInactive(this.indicatorRightYou);
        setInactive(this.indicatorRightLie);
        setInactive(this.indicatorJun);

        if (attAdvantage) {
            setActive(this.indicatorLeftYou, 'you');
            setActive(this.indicatorRightLie, 'lie'); // 守方劣势
        } else if (attDisadvantage) {
            setActive(this.indicatorLeftLie, 'lie');
            setActive(this.indicatorRightYou, 'you'); // 守方优势
        } else {
            setActive(this.indicatorJun, 'jun');
        }

    }

    private wireGeneralNameTagClicks(): void {
        for (const tag of [this.leftGeneralNameTag, this.rightGeneralNameTag]) {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this.correctorOpen) return;
                const gid = tag.dataset.generalId;
                const side = tag.dataset.side as 'attacker' | 'defender' | undefined;
                if (!gid || !side || !getGeneralRecordByGeneralId(gid)) return;
                void this.openPortraitPicker(gid, side);
            });
        }
    }

    private fillGeneralNameTag(
        tag: HTMLDivElement,
        unit: IBattleUnit,
        side: 'attacker' | 'defender',
    ): void {
        let generalId = unit.generalId;
        let rec = generalId ? getGeneralRecordByGeneralId(generalId) : null;
        if (!rec) {
            // 显示单位无在册将（典型：攻城战守方顶到前排的城防驻军）→ 名牌退回
            // 开战锁定指挥官/放技将，与技能条同口径（resolvePowerBadgeUnit），
            // 否则出现「技能条在放将技、名牌却空着」（2026-08-03 顺昌攻防战守方无名）。
            const cmd = this.resolvePowerBadgeUnit(unit, side);
            const cmdRec = cmd.generalId ? getGeneralRecordByGeneralId(cmd.generalId) : null;
            if (cmdRec) {
                generalId = cmd.generalId;
                rec = cmdRec;
            }
        }
        const famousBadge = side === 'attacker' ? this.leftFamousBadge : this.rightFamousBadge;
        if (rec) {
            tag.textContent = rec.generalName;
            tag.style.display = 'block';
            tag.dataset.generalId = generalId!;
            if (generalId && getGeneralProfile(generalId)?.tier === 'famous') {
                famousBadge.style.display = 'block';
            } else {
                famousBadge.style.display = 'none';
            }
        } else {
            tag.textContent = '';
            tag.style.display = 'none';
            delete tag.dataset.generalId;
            famousBadge.style.display = 'none';
        }
        tag.dataset.side = side;
        this.refreshGeneralNameTagInteract();
    }

    private updateGeneralNameTags(attacker: IBattleUnit, defender: IBattleUnit): void {
        this.fillGeneralNameTag(this.leftGeneralNameTag, attacker, 'attacker');
        this.fillGeneralNameTag(this.rightGeneralNameTag, defender, 'defender');
    }

    /** F2 关：名牌/立绘均不可点；F2 开：仅名牌虚线可点 */
    private refreshGeneralNameTagInteract(): void {
        for (const tag of [this.leftGeneralNameTag, this.rightGeneralNameTag]) {
            const gid = tag.dataset.generalId;
            const interactive =
                this.correctorOpen &&
                !!gid &&
                !!getGeneralRecordByGeneralId(gid) &&
                !this.portraitPickerOpen;
            tag.style.pointerEvents = interactive ? 'auto' : 'none';
            tag.style.cursor = interactive ? 'pointer' : 'default';
            tag.style.outline = interactive ? '2px dashed rgba(232,200,120,0.7)' : 'none';
            tag.style.outlineOffset = interactive ? '3px' : '';
            tag.title = interactive ? 'F2：点击选择文件夹并绑定立绘' : '';
        }
        this.refreshPortraitPointerState();
    }

    /** 立绘框：F2 关整框不可点；F2 开仅名牌可点（立绘本身不响应点击） */
    private refreshPortraitPointerState(): void {
        const dev = this.correctorOpen;
        for (const frame of [this.leftPortraitFrame, this.rightPortraitFrame]) {
            frame.style.pointerEvents = dev ? 'auto' : 'none';
        }
        for (const img of [this.leftPortrait, this.rightPortrait]) {
            img.style.pointerEvents = 'none';
            img.style.cursor = 'default';
        }
    }

    private buildPortraitPickerPanel(): HTMLDivElement {
        const panel = document.createElement('div');
        panel.id = 'portrait-picker-panel';
        panel.style.cssText = `
            position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
            display: none; flex-direction: column; gap: 10px;
            width: min(720px, 92vw); max-height: 78vh;
            background: rgba(12, 10, 8, 0.97); border: 1px solid #8a7038; border-radius: 12px;
            padding: 14px 16px; z-index: 2147483100;
            font-family: "Noto Serif SC","Microsoft YaHei",serif; color: #e8e0d0;
            box-shadow: 0 12px 40px rgba(0,0,0,0.75); pointer-events: auto;
        `;
        panel.innerHTML = `
            <div class="pp-title" style="font-size:15px;font-weight:700;color:#f5d78e;"></div>
            <div class="pp-hint" style="font-size:12px;color:#9a8f7a;line-height:1.45;">
                选文件夹 → 点图 →「选定」→ 微调 → <b>Enter 写盘</b>（继续）或 <b>Esc 写盘并关</b>。
            </div>
            <label class="pp-folder-row" style="display:flex;align-items:center;gap:8px;font-size:13px;">
                <span style="color:#c4b89a;white-space:nowrap;min-width:3.5em;">文件夹</span>
                <select class="pp-folder-select" style="flex:1;min-width:0;padding:6px 8px;background:#1a1814;color:#e8e0d0;border:1px solid #4a4238;border-radius:5px;"></select>
            </label>
            <div class="pp-grid" style="
                display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
                gap: 10px; overflow: auto; max-height: 52vh; padding: 4px;
            "></div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;">
                <button type="button" class="pp-btn pp-btn-bind" disabled>选定</button>
                <button type="button" class="pp-btn pp-btn-close">关闭</button>
            </div>
            <div class="pp-status" style="font-size:12px;color:#9fd4a8;min-height:1.2em;"></div>
        `;
        const style = document.createElement('style');
        style.textContent = `
            #portrait-picker-panel .pp-btn {
                background:#2a2620;color:#e8e0d0;border:1px solid #4a4238;border-radius:5px;
                padding:8px 14px;cursor:pointer;font-size:13px;
            }
            #portrait-picker-panel .pp-btn:hover:not(:disabled) { background:#3a342c; }
            #portrait-picker-panel .pp-btn-bind { background:#4a3820;border-color:#8a7038;color:#fff8e8; }
            #portrait-picker-panel .pp-btn:disabled { opacity:0.45;cursor:not-allowed; }
            #portrait-picker-panel .pp-thumb {
                border:2px solid transparent;border-radius:6px;cursor:pointer;overflow:hidden;
                background:#1a1814; aspect-ratio:3/4;
            }
            #portrait-picker-panel .pp-thumb img { width:100%;height:100%;object-fit:cover;display:block; }
            #portrait-picker-panel .pp-thumb.pp-selected { border-color:#e8c878; box-shadow:0 0 12px rgba(232,200,120,0.45); }
        `;
        document.head.appendChild(style);

        this.portraitPickerTitle = panel.querySelector('.pp-title');
        this.portraitPickerFolderSelect = panel.querySelector('.pp-folder-select') as HTMLSelectElement;
        this.portraitPickerGrid = panel.querySelector('.pp-grid');
        this.portraitPickerStatus = panel.querySelector('.pp-status');
        this.portraitPickerFolderSelect.addEventListener('change', () => {
            this.portraitPickerFolder = this.portraitPickerFolderSelect?.value || '/assets/inbox/';
            this.portraitPickerSelectedPath = null;
            const bindBtn = this.portraitPickerPanel?.querySelector('.pp-btn-bind') as HTMLButtonElement | null;
            if (bindBtn) bindBtn.disabled = true;
            void this.renderPortraitPickerGrid();
        });
        const bindBtn = panel.querySelector('.pp-btn-bind') as HTMLButtonElement;
        const closeBtn = panel.querySelector('.pp-btn-close') as HTMLButtonElement;
        bindBtn.addEventListener('mousedown', (e) => e.preventDefault());
        closeBtn.addEventListener('mousedown', (e) => e.preventDefault());
        bindBtn.addEventListener('click', () => void this.bindSelectedPortrait());
        closeBtn.addEventListener('click', () => this.closePortraitPicker());
        document.body.appendChild(panel);
        return panel;
    }

    private inferDefaultPortraitFolder(rec: { portrait: string }): string {
        return extractPortraitFolder(rec.portrait) ?? '/assets/inbox/';
    }

    private async loadPortraitPickerCatalog(): Promise<void> {
        try {
            const res = await fetch('/api/portrait-picker-catalog');
            const data = res.ok ? await res.json() : null;
            if (data?.ok && Array.isArray(data.catalog)) {
                this.portraitPickerCatalog = data.catalog;
            }
        } catch {
            this.portraitPickerCatalog = [];
        }
    }

    private populatePortraitPickerFolderSelect(): void {
        if (!this.portraitPickerFolderSelect) return;
        this.portraitPickerFolderSelect.innerHTML = '';
        const folders = this.portraitPickerCatalog.length > 0
            ? this.portraitPickerCatalog
            : [{ folder: '/assets/inbox/', label: 'inbox', images: [] }];
        for (const row of folders) {
            const opt = document.createElement('option');
            opt.value = row.folder;
            const n = row.images.length;
            opt.textContent = n > 0 ? `${row.label}（${n}）` : row.label;
            this.portraitPickerFolderSelect.appendChild(opt);
        }
        const has = folders.some((f) => f.folder === this.portraitPickerFolder);
        if (!has) this.portraitPickerFolder = folders[0]?.folder ?? '/assets/inbox/';
        this.portraitPickerFolderSelect.value = this.portraitPickerFolder;
    }

    private async openPortraitPicker(generalId: string, side: 'attacker' | 'defender'): Promise<void> {
        if (!this.correctorOpen) return;
        const rec = getGeneralRecordByGeneralId(generalId);
        if (!rec) {
            this.setCorrectorStatus(`⚠ ${generalId} 未入 FactionGenerals.ts，无法绑定`);
            return;
        }
        if (!this.portraitPickerPanel) this.portraitPickerPanel = this.buildPortraitPickerPanel();
        this.portraitPickerOpen = true;
        this.portraitPickerGeneralId = generalId;
        this.portraitPickerSide = side;
        this.portraitPickerSelectedPath = null;
        this.bumpPortraitPickerCatalogRev();
        this.portraitPickerFolder = this.inferDefaultPortraitFolder(rec);
        this.portraitPickerPanel.style.display = 'flex';
        if (this.portraitPickerStatus) this.portraitPickerStatus.textContent = '加载文件夹…';
        await this.loadPortraitPickerCatalog();
        this.populatePortraitPickerFolderSelect();
        if (this.portraitPickerTitle) {
            this.portraitPickerTitle.textContent =
                `绑定立绘 · ${rec.generalName}（${generalId}）`;
        }
        const bindBtn = this.portraitPickerPanel.querySelector('.pp-btn-bind') as HTMLButtonElement;
        bindBtn.disabled = true;
        await this.renderPortraitPickerGrid();
        this.refreshGeneralNameTagInteract();
    }

    private closePortraitPicker(): void {
        this.portraitPickerOpen = false;
        this.portraitPickerGeneralId = null;
        this.portraitPickerSide = null;
        this.portraitPickerSelectedPath = null;
        this.portraitPickerCatalog = [];
        if (this.portraitPickerPanel) this.portraitPickerPanel.style.display = 'none';
        this.refreshGeneralNameTagInteract();
    }

    private async renderPortraitPickerGrid(): Promise<void> {
        if (!this.portraitPickerGrid) return;
        this.portraitPickerGrid.innerHTML = '';
        const folder = this.portraitPickerFolder;
        const generalId = this.portraitPickerGeneralId;
        const row = this.portraitPickerCatalog.find((c) => c.folder === folder);
        const images = row?.images ?? [];
        const destHint = generalId ? `${folder}${generalId}.png` : '';

        if (images.length === 0) {
            this.portraitPickerGrid.innerHTML =
                `<div style="grid-column:1/-1;color:#b8a890;font-size:13px;padding:12px;">` +
                `文件夹 <code>${folder}</code> 暂无 PNG。可将新图放入 <code>public${folder}</code> 后切换文件夹刷新。</div>`;
            if (this.portraitPickerStatus) {
                this.portraitPickerStatus.textContent = destHint
                    ? `目标：${destHint} · 当前文件夹无图`
                    : '当前文件夹无图';
            }
            return;
        }
        const bindBtn = this.portraitPickerPanel?.querySelector('.pp-btn-bind') as HTMLButtonElement | null;
        if (generalId && destHint && images.some((p) => p.endsWith(`/${generalId}.png`))) {
            const cell = document.createElement('div');
            cell.className = 'pp-thumb pp-current';
            cell.style.borderColor = 'rgba(120,200,255,0.85)';
            cell.style.cursor = 'default';
            cell.title = `当前：${generalId}.png（写盘后的正式文件）`;
            cell.appendChild(this.createPortraitPickerThumbImg(destHint, `${generalId}.png`));
            const cap = document.createElement('div');
            cap.textContent = '当前';
            cap.style.cssText = 'position:absolute;bottom:2px;left:0;right:0;text-align:center;font-size:10px;color:#a8d8ff;background:rgba(0,0,0,0.55);';
            cell.style.position = 'relative';
            cell.appendChild(cap);
            this.portraitPickerGrid.appendChild(cell);
        }
        for (const webPath of images) {
            // 绑图目标文件已在上方「当前」格展示，不再作为待选素材
            if (generalId && webPath.endsWith(`/${generalId}.png`)) {
                continue;
            }
            const cell = document.createElement('div');
            cell.className = 'pp-thumb';
            const fileName = webPath.split('/').pop() ?? webPath;
            cell.title = fileName;
            if (generalId && fileName === `${generalId}.png`) {
                cell.classList.add('pp-current');
                cell.style.borderColor = 'rgba(120,200,255,0.55)';
            }
            cell.appendChild(this.createPortraitPickerThumbImg(webPath, fileName));
            cell.addEventListener('click', () => {
                this.portraitPickerGrid?.querySelectorAll('.pp-thumb.pp-selected').forEach((el) => {
                    el.classList.remove('pp-selected');
                });
                cell.classList.add('pp-selected');
                this.portraitPickerSelectedPath = webPath;
                if (bindBtn) bindBtn.disabled = false;
                if (this.portraitPickerStatus) {
                    this.portraitPickerStatus.textContent = `已选：${fileName} → 绑定为 ${destHint}`;
                }
            });
            this.portraitPickerGrid.appendChild(cell);
        }
        if (this.portraitPickerStatus) {
            this.portraitPickerStatus.textContent =
                `${folder} 共 ${images.length} 张 · 绑定为 ${destHint}`;
        }
    }

    private bindSelectedPortrait(): void {
        const generalId = this.portraitPickerGeneralId;
        const side = this.portraitPickerSide;
        const sourcePath = this.portraitPickerSelectedPath;
        const targetFolder = this.portraitPickerFolder;
        if (!generalId || !side || !sourcePath || !targetFolder) return;

        const destPath = `${targetFolder}${generalId}.png`;
        this.portraitBindStaging = this.portraitBindStaging.filter(
            (b) => b.generalId !== generalId && b.side !== side,
        );
        this.portraitBindStaging.push({ generalId, sourcePath, targetFolder, side, destPath });

        this.correctorSide = side;
        this.highlightCorrectorSide();
        const img = side === 'attacker' ? this.leftPortrait : this.rightPortrait;
        const onPortraitLoaded = () => {
            // 用源图已有的调校初始化草稿，让预览立即以调好的状态显示
            // 按自身路径优先解析（resolvePortraitAdjust 内部会自身→canonical→文件夹兜底）
            const sourceAdj = resolvePortraitAdjust(sourcePath, this.correctorData);
            this.correctorDraft = { scale: sourceAdj.scale, offsetX: sourceAdj.offsetX, offsetY: sourceAdj.offsetY };
            // 同时把调校值写入 destPath，并标记 dirty
            // 这样即使用户不动滑块直接关 F2，下场战斗也会用正确的位置
            if (this.canPersistPortraitPath(destPath)) {
                this.correctorData.images = this.correctorData.images ?? {};
                this.correctorData.images[destPath] = { ...this.correctorDraft };
                this.correctorDirtyPaths.add(destPath);
            }
            this.renderCorrectorReadout();
            applyPortraitAdjustToElement(img, sourcePath, this.correctorData);
            this.scheduleCorrectorCrosshairRefresh();
        };
        img.addEventListener('load', onPortraitLoaded, { once: true });
        img.src = `${sourcePath}?v=${Date.now()}`;
        if (img.complete) onPortraitLoaded();

        this.closePortraitPicker();
        this.setCorrectorStatus(
            `✓ 已选定 ${generalId}.png · 微调后 Enter 写盘（不关 F2）`,
        );
        this.refreshGeneralNameTagInteract();
    }

    private createIndicatorNode(text: string): HTMLDivElement {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = `
            width: ${uiPx(24)};
            height: ${uiPx(24)};
            line-height: ${uiPx(22)};
            text-align: center;
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(16)};
            font-weight: 900;
            color: rgba(255, 255, 255, 0.3);
            background: rgba(20, 20, 20, 0.8);
            border: 1px solid rgba(100, 100, 100, 0.5);
            border-radius: 2px;
            box-shadow: 0 0 4px rgba(0,0,0,0.8);
            transition: all 0.3s ease;
        `;
        return el;
    }

    private createGeneralNameTag(side: 'left' | 'right'): HTMLDivElement {
        const tag = document.createElement('div');
        tag.className = 'combat-general-name-tag';
        tag.dataset.side = side === 'left' ? 'attacker' : 'defender';
        tag.style.cssText = `
            position: absolute;
            bottom: 52%;
            ${side === 'left' ? 'right' : 'left'}: -${uiPx(25)};
            writing-mode: vertical-rl;
            text-orientation: upright;
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(18)};
            font-weight: 900;
            color: #fff8e0;
            background: linear-gradient(135deg, rgba(55, 30, 15, 0.95) 0%, rgba(20, 5, 0, 0.95) 100%);
            border-top: 1px solid rgba(255, 215, 0, 0.6);
            border-left: 1px solid rgba(255, 215, 0, 0.4);
            border-right: 1px solid rgba(150, 100, 20, 0.6);
            border-bottom: 1px solid rgba(100, 50, 10, 0.8);
            border-radius: 3px;
            padding: ${uiPx(14)} ${uiPx(8)};
            box-shadow: 
                inset 0 1px 2px rgba(255,255,255,0.15), 
                inset 0 -4px 8px rgba(0,0,0,0.6), 
                0 6px 16px rgba(0,0,0,0.9);
            text-shadow: 0 1px 2px rgba(0,0,0,1), 0 0 8px rgba(255, 200, 50, 0.3);
            z-index: ${T.zIndex.portrait + 5};
            display: none;
            pointer-events: none;
            letter-spacing: 4px;
        `;
        return tag;
    }

    private createFamousBadge(side: 'left' | 'right'): HTMLDivElement {
        const tag = document.createElement('div');
        const isAtt = side === 'left';
        tag.style.cssText = `
            position: absolute;
            bottom: 52%;
            ${isAtt ? 'right' : 'left'}: -${uiPx(80)};
            display: none;
            padding: 1px 5px;
            border: 1px solid ${isAtt ? 'rgba(253,185,49,0.3)' : 'rgba(90,170,190,0.3)'};
            border-radius: 3px;
            background: ${isAtt ? 'rgba(60,25,5,0.35)' : 'rgba(10,35,55,0.35)'};
            color: ${isAtt ? 'rgba(255,180,40,1)' : 'rgba(80,200,240,1)'};
            font-size: ${uiPx(16)};
            font-family: 'Noto Serif SC', serif;
            font-weight: 700;
            z-index: ${T.zIndex.portrait + 5};
            pointer-events: none;
            writing-mode: horizontal-tb;
        `;
        tag.textContent = '名将';
        return tag;
    }

    // --- SHARED UTILS ---

    // Priority: ① portrait_config → ②b 将领专图 → ② 脚本/军团随机 → ③ portraitPath → …
    private setPortrait(
        img: HTMLImageElement,
        unit: IBattleUnit | undefined,
        generalId?: string,
        factionId?: string | null,
        providedDefault?: string,
        side?: 'attacker' | 'defender',
        excludePath?: string,
    ) {
        const rememberFacing = (url: string) => {
            if (!side) return;
            this.portraitSourceFacing[side] = resolvePortraitSourceFacing(unit, url);
        };
        const applyFacing = () => {
            if (side) this.applyPortraitFacing(side);
        };
        const setSrc = (rawUrl: string, isRetry = false) => {
            const resolveOptsWithExclude = { ...portraitOpts, exclude: excludePath };
            let finalUrl = rawUrl?.trim()
                ? resolvePortraitAssetPath(rawUrl, resolveOptsWithExclude)
                : '';
            if (!finalUrl?.trim() && unit) {
                finalUrl = getCombatPortraitPath(unit, excludePath);
            }
            if (!finalUrl?.trim()) {
                finalUrl = getRandomRegionPortraitPath(cultureRegion, {
                    factionId: portraitOpts.factionId,
                    exclude: excludePath,
                });
            }
            if (!finalUrl?.trim()) {
                finalUrl = BATTLE_PORTRAIT_FALLBACK;
            }

            rememberFacing(finalUrl);
            const onLoad = () => {
                applyFacing();
                applyPortraitAdjustToElement(img, finalUrl, this.correctorData);
            };
            img.addEventListener('load', onLoad, { once: true });
            if (!isRetry) {
                img.onerror = () => {
                    img.onerror = null;
                    // 主人边玩边删立绘：加载失败即从内存清单剔除，
                    // 之后所有池子抽签自动跳过它，同一张坏图只会坑一次，无需重启 dev server
                    if (!portraitUrlsEqual(finalUrl, BATTLE_PORTRAIT_FALLBACK)) {
                        unregisterPortraitPathRuntime(finalUrl);
                    }
                    if (!unit) {
                        if (finalUrl !== BATTLE_PORTRAIT_FALLBACK) {
                            setSrc(BATTLE_PORTRAIT_FALLBACK, true);
                        }
                        return;
                    }
                    const fallback = getCombatPortraitPath(unit, excludePath);
                    const alt =
                        fallback?.trim() && !portraitUrlsEqual(fallback, finalUrl)
                            ? fallback
                            : BATTLE_PORTRAIT_FALLBACK;
                    if (!portraitUrlsEqual(alt, finalUrl)) {
                        setSrc(alt, true);
                    }
                };
            }
            img.src = this.portraitPickerCatalogRev
                ? `${finalUrl}?v=${this.portraitPickerCatalogRev}`
                : finalUrl;
            applyFacing();
            applyPortraitAdjustToElement(img, finalUrl, this.correctorData);
        };

        const cultureRegion = unit ? resolveUnitCultureRegion(unit) : 'CENTRAL';
        const portraitOpts = {
            factionId: unit?.factionId ?? factionId ?? undefined,
            region: cultureRegion,
        };

        // ① 场次立绘路径（localStorage / 自选 JSON）
        if (side && this.currentBattleKey) {
            const configPath = this.portraitConfig.getPortrait(this.currentBattleKey, side);
            if (configPath?.trim()) {
                setSrc(configPath);
                return;
            }
        }
        // ②b 武将：专属立绘 → 政权专夹 → 文化区夹
        if (generalId) {
            const rec = getGeneralRecordByGeneralId(generalId, { region: cultureRegion });
            if (rec?.portrait?.trim()) {
                setSrc(rec.portrait);
                return;
            }
        }
        // ② 事件脚本立绘（无武将专图时；不与对侧相同）
        if (providedDefault?.trim()) {
            if (!excludePath || !portraitUrlsEqual(providedDefault, excludePath)) {
                setSrc(providedDefault);
                return;
            }
        }
        // ③ 军团/城防已 resolve 的 portraitPath
        if (unit?.portraitPath?.trim()) {
            if (!excludePath || !portraitUrlsEqual(unit.portraitPath, excludePath)) {
                setSrc(unit.portraitPath);
                return;
            }
        }
        const portraits = (SPRITE_PATHS.GENERAL_PORTRAITS || {}) as Record<string, string>;
        // ④ 将领 ID（如 baiqi）
        if (generalId && portraits[generalId]) {
            setSrc(portraits[generalId]);
            return;
        }
        // ⑤ 势力默认（秦国 qin → qinjiang.png）
        if (factionId && portraits[factionId]) {
            setSrc(portraits[factionId]);
            return;
        }
        // ⑥ 文化区军队/守军 + panjun
        if (unit) {
            setSrc(getCombatPortraitPath(unit, excludePath));
            return;
        }
        setSrc(getRandomRegionPortraitPath('CENTRAL', { factionId: factionId ?? undefined }));
    }

    /** 配置 key：展示标题 + 攻守双方，避免「区域冲突」一条污染全部区域战 */
    private buildPortraitConfigKey(
        displayTitle: string,
        attacker: IBattleUnit,
        defender: IBattleUnit,
    ): string {
        const defTag = defender.unitType === 'city'
            ? `守:${defender.name}`
            : `军:${defender.name}`;
        return `${displayTitle}|${attacker.name}|${defTag}`;
    }

    private getEffectiveMirror(side: 'attacker' | 'defender'): boolean {
        const key = this.currentBattleKey;
        const explicit = key && !CombatUI.LEGACY_GENERIC_PORTRAIT_KEYS.has(key)
            ? this.portraitConfig.getMirror(key, side)
            : undefined;
        return explicit ?? shouldMirrorPortraitForSide(side, this.portraitSourceFacing[side]);
    }

    private applyPortraitFacing(side: 'attacker' | 'defender'): void {
        const wrap = side === 'attacker' ? this.leftPortraitWrap : this.rightPortraitWrap;
        wrap.style.transformOrigin = 'center bottom';
        wrap.style.transform = this.getEffectiveMirror(side) ? 'scaleX(-1)' : 'none';
    }

    private handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0] && this.currentBattleKey) {
            const file = input.files[0];
            const side = this.tempIsLeft ? 'attacker' : 'defender';
            const battleKey = this.currentBattleKey;

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                if (!base64) return;

                // 自选立绘存 data URL，不依赖 public/assets/portraits
                this.portraitConfig.setPortrait(battleKey, side, base64);

                const targetImg = this.tempIsLeft ? this.leftPortrait : this.rightPortrait;
                targetImg.src = base64;
                this.portraitSourceFacing[side] = resolvePortraitSourceFacing(undefined, file.name);
                this.applyPortraitFacing(side);

                this.portraitConfig.saveToFile().then(ok => {
                    if (ok) console.log(`🖼️ [Portrait] Config saved to file`);
                });
            };
            reader.readAsDataURL(file);
        }
        input.value = '';
    }

    private toggleMirror(side: 'attacker' | 'defender') {
        if (!this.currentBattleKey) return;
        this.portraitConfig.setMirror(this.currentBattleKey, side, !this.getEffectiveMirror(side));
        this.applyPortraitFacing(side);
    }
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        document.querySelectorAll('#combat-ui-panel').forEach((el) => el.remove());
    });
}
