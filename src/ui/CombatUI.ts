import { getFactionGeneral, getGeneralRecordByGeneralId, setGeneralPortraitOverride } from '../data/FactionGenerals';
import { registerPortraitPathRuntime, unregisterPortraitPathRuntime } from '../config/portrait_defaults';
import { Battle, IBattleUnit } from '../core/CombatSystem';
import { BattleField } from '../core/BattleField';
import type { Scene13WarInit } from './Scene13WarLayer';
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
import type { RegionType } from '../systems/RegionSystem';
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
import { summarizeTechEffects, summarizeSingleTechEffect, unlockedTechs } from '../systems/MilitaryTechState';
import type { MilitaryTech } from '../data/MilitaryTechs';
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
    getOwnSixSetSkillId,
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
const CLASH_STALEMATE_PCT = 77;
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
/** 第一阶段摆幅（小幅角力，不与开战语音抢戏；2026-08-03 从 1 提到 3：±0.9% 太死，几乎看不出争斗感） */
const BAR_SWING_ACT1 = 4;
/** 第二阶段摆幅：起手拉满 4 → 收束到 3（2026-08-03 从 1 提到 3：收束太狠导致后半段几乎静止） */
const BAR_SWING_ACT2_FROM = 6;
const BAR_SWING_ACT2_TO = 4;
/** 第三阶段相持的摆幅（主人要「大浮动摇摆」，故远大于前两阶段的收束值） */
const BAR_SWING_ACT3 = 7;
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
    return raw;
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
    /** [军事科技] 科技行：双方各自已解锁科技名（只在 13 出兵口互攻时显示） */
    private techRow!: HTMLDivElement;
    /** [军事科技] 双方科技徽记区（内容由 renderTechSide 重绘） */
    /** [13 布局] 当前是否处于战术模式专属布局；进入/退出各执行一次，不逐帧重排 */
    private scene13LayoutOn = false;
    /** [13 布局] 进入 13 前的内联样式快照，退出时逐字还原（保证 8/9/10 逐像素不变） */
    private scene13SavedCss = new Map<HTMLElement, string>();
    /** [13 布局] 被临时移到 body 的元素 → 原父节点与原位置，退出时插回原处 */
    private scene13Reparented = new Map<HTMLElement, { parent: HTMLElement; next: Node | null }>();
    /** [13 布局] 攻守科技之间的分隔徽记（主人 2026-08-26：两侧科技中间放个 UI 作区分） */
    private techDivider: HTMLDivElement | null = null;
    private leftTechBox!: HTMLDivElement;
    private rightTechBox!: HTMLDivElement;
    private toggleCollapseBtn!: HTMLButtonElement;
    private exitBattleBtn!: HTMLButtonElement;
    private isCollapsed: boolean = false;

    /** 技能脉冲状态：同名技能一局只放一次；双方撞车时后到方延后错开 */
    private skillPulseShownKeys = new Set<string>();
    /** 已燃时刻表（P1）：技能 Cut-in 实际弹出时刻 → 1.9s（surge 播完）后标签进入已燃态 */
    private readonly skillSpentAt = new Map<string, number>();
    /** 胜负定格（P0）：true 时 updateStats 不再覆写拉锯条/交界（终态已由 showBattleOutcome 写死） */
    private outcomeLocked = false;
    /** 第三幕剧本锚点（2026-07-18 主人定）：进入第三幕瞬间的真实攻方%，崩溃/僵持/断崖从此起算 */
    private collapseStartAttPct: number | null = null;
    /** 平滑过渡的目标锚点：防止引擎翻盘时标尺跨半屏瞬间闪现 */
    private smoothedStalematePct: number = 50;
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
            .combat-ui-collapse-btn {
                position: absolute;
                top: -24px;
                left: 50%;
                transform: translateX(-50%);
                height: 24px;
                padding: 0 18px;
                background: linear-gradient(180deg, rgba(28, 22, 16, 0.94) 0%, rgba(12, 10, 8, 0.96) 100%);
                border: 1px solid rgba(212, 175, 55, 0.6);
                border-bottom: none;
                border-radius: 8px 8px 0 0;
                color: #f5e6c8;
                font-family: 'Noto Serif SC', 'Cinzel', serif;
                font-size: 12px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                cursor: pointer;
                pointer-events: auto;
                z-index: 40;
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 215, 0, 0.25);
                transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
                user-select: none;
                outline: none;
            }
            .combat-ui-collapse-btn:hover {
                background: linear-gradient(180deg, rgba(55, 42, 28, 0.98) 0%, rgba(30, 22, 15, 0.98) 100%) !important;
                border-color: rgba(255, 215, 0, 0.9) !important;
                color: #FFF !important;
                box-shadow: 0 -3px 14px rgba(255, 215, 0, 0.45), inset 0 1px 3px rgba(255, 215, 0, 0.4) !important;
            }
            .combat-ui-collapse-btn:active {
                filter: brightness(0.9);
            }
            #combat-ui-panel.is-collapsed > *:not(.combat-ui-collapse-btn) {
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
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
        this.centerBackdrop.style.transition = 'opacity 0.3s ease';
        this.centerPanel = document.createElement('div');
        this.centerPanel.style.transition = 'opacity 0.3s ease';
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

        // [军事科技] 科技行（2026-08-18 主人定：语音播报改 UI 显示，双方各显自己已解锁科技）
        this.techRow = this.buildTechRow();


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

        // --- 隐藏/展开战斗面板 下拉箭头按钮（点击收起面板，避开遮挡战场）---
        this.toggleCollapseBtn = document.createElement('button');
        this.toggleCollapseBtn.className = 'combat-ui-collapse-btn';
        this.toggleCollapseBtn.title = '隐藏战斗面板 (点击收起)';
        this.toggleCollapseBtn.innerHTML = `<span>▼</span>`;
        this.toggleCollapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCollapse();
        });
        this.container.appendChild(this.toggleCollapseBtn);

        // [2026-08-19 主人指令] 退出战斗按钮：放到右上角边缘安全区域（避开军情），防止误点，全战斗模式通用
        this.exitBattleBtn = document.createElement('button');
        this.exitBattleBtn.className = 'combat-ui-exit-btn';
        this.exitBattleBtn.textContent = '⚔️ 退出战斗';
        this.exitBattleBtn.title = '点击后按当前战况自动结算战果并退出';
        this.exitBattleBtn.style.cssText = [
            'position:fixed',
            'top:14px',
            'right:110px',
            'z-index:450',
            'padding:5px 14px',
            'background:linear-gradient(180deg, rgba(28,22,16,0.92) 0%, rgba(12,10,8,0.96) 100%)',
            'border:1px solid rgba(212,175,55,0.6)',
            'border-radius:5px',
            'color:#f5e6c8',
            "font-family:'Noto Serif SC','Cinzel',serif",
            'font-size:13px',
            'font-weight:bold',
            'cursor:pointer',
            'pointer-events:auto',
            'user-select:none',
            'display:none',
            'box-shadow:0 2px 10px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,215,0,0.25)',
            'transition:all 0.2s ease',
        ].join(';');
        this.exitBattleBtn.addEventListener('mouseenter', () => {
            this.exitBattleBtn.style.borderColor = '#ffd700';
            this.exitBattleBtn.style.color = '#ffffff';
            this.exitBattleBtn.style.boxShadow = '0 0 12px rgba(255,215,0,0.4), inset 0 1px 2px rgba(255,215,0,0.4)';
        });
        this.exitBattleBtn.addEventListener('mouseleave', () => {
            this.exitBattleBtn.style.borderColor = 'rgba(212,175,55,0.6)';
            this.exitBattleBtn.style.color = '#f5e6c8';
            this.exitBattleBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,215,0,0.25)';
        });
        this.exitBattleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.exitCurrentBattle();
        });
        document.body.appendChild(this.exitBattleBtn);

        this.applyPortraitFacing('attacker');
        this.applyPortraitFacing('defender');
    }

    /**
     * [军事科技] 科技行：左攻右守各显示已解锁科技名（「科技」弱色标签 + 名列表）。
     * 默认隐藏，updateStats 里按 scene13War.getSideTechs() 开关显示（只在 13 出兵口互攻时）。
     */
    /**
     * [军事科技] 面板底部的科技徽记行（13 战斗专用）。
     *
     * 🔴 为什么不是直接列科技名：1450 年拉丁有 16 条科技，平铺就是一堵文字墙，
     *    直播观众扫一眼什么也读不到。改成**四组点阵徽记 + 独有科技高亮**：
     *      · 点阵（冶/甲/射/术）→ 双方并排，哪条线点满了一眼可比
     *      · 独有科技 → 只列「对面没有的」，那才是本场科技差距的故事
     *    点与独有名都用该方势力色（攻金 / 守青），跟血条、名牌同一套视觉语言。
     */
    /**
     * [军事科技] 年份行 = 「左攻科技效果 ｜ 年份 ｜ 右守科技效果」三栏。
     *
     * 🔴 放这里而不是面板底部：底部是**援军行**的地盘（主人 2026-08-18 指出挤在一起不合适）。
     *    科技本来就是年份的函数，与年份同行，因果一眼就明白。
     * 🔴 显示的是**效果不是科技名**（主人定「科技效果要体现」）：
     *    列「锁子甲·板甲·板甲马铠」观众读不出强弱，列「步甲+3/4」才知道强了多少。
     *    科技名只留「本方独有、对面没有」那几条 —— 那才是本场科技差距的故事。
     */
    /**
     * [军事科技] 挂载于顶部中央 HUD 容器（#top-center-hud）左右两翼的科技胶囊。
     * （2026-08-18 主人定：部署在中央跟随/改名胶囊两边）。
     *
     * 结构：
     *   左翼 (order: -1): 攻方科技胶囊 [ ⚔️ 攻方科技  近攻+3 远攻+4 ... | 科技名列表 ]
     *   中央 (order:  0): 跟随/改名胶囊 [ 太平 石达开 率 石敢当  ✎改名  ✕取消 ]
     *   右翼 (order:  1): 守方科技胶囊 [ 科技名列表 | 步甲+2/3 远攻+2 ...  守方科技 🛡️ ]
     */

    /**
     * [13 布局] 战术模式（ZOOM 13）专属面板布局。主人 2026-08-26 定：
     *   · 人物立绘分置屏幕**左下角 / 右下角**
     *   · 上方只保留「战争地点 + 战争类型」标题与血槽
     *   · 纪年、事件描述、双方兵力 HUD 都是大地图的信息 → 13 期间隐藏
     *   · 科技从顶部 HUD（#top-center-hud）移到屏幕**下方**
     *
     * 🔴 CombatUI 是 ZOOM 8/9/10 共用的成品（AGENTS.md 红线：8/9/10 严禁改动）。
     *    所以这里不改任何元素的原始样式定义，只在进入 13 时**快照内联样式再覆盖**，
     *    退出时逐字还原 —— 非 13 逐像素不变。
     */
        public applyScene13Layout(on: boolean): void {
        if (this.scene13LayoutOn === on) return;
        this.scene13LayoutOn = on;

        if (!on) {
            // 退出 13 模式：100% 恢复所有元素的初始 CSS 样式
            if (this.techDivider) {
                this.techDivider.style.opacity = '0';
                this.techDivider.style.display = 'none';
            }
            for (const [el, css] of this.scene13SavedCss) el.style.cssText = css;
            this.scene13SavedCss.clear();
            for (const [el, at] of [...this.scene13Reparented.entries()].reverse()) {
                try {
                    if (at.next && at.next.parentNode === at.parent) at.parent.insertBefore(el, at.next);
                    else at.parent.appendChild(el);
                } catch {
                    try { at.parent.appendChild(el); } catch { /* ignore */ }
                }
            }
            this.scene13Reparented.clear();
            return;
        }

        const topHud = document.getElementById('top-center-hud');
        const save = (el?: HTMLElement | null) => {
            if (el && !this.scene13SavedCss.has(el)) this.scene13SavedCss.set(el, el.style.cssText);
        };
        for (const el of [this.container, this.leftPortraitFrame, this.rightPortraitFrame, this.centerPanel,
            this.centerBackdrop, this.battleYear, this.eventDescription, this.sideStatsRow,
            this.leftTechBox, this.rightTechBox, this.indicatorJun, this.toggleCollapseBtn,
            this.skillsRow, this.healthBarContainer, this.battleTitle, this.leftTotalMultBadge,
            this.rightTotalMultBadge, topHud]) save(el);

        const detach = (el?: HTMLElement | null) => {
            if (!el || !el.parentElement || el.parentElement === document.body) return;
            this.scene13Reparented.set(el, { parent: el.parentElement, next: el.nextSibling });
            document.body.appendChild(el);
        };

        // 科技盒挂在 top-center-hud 里，13 期间 top-center-hud 隐藏，需搬到 body
        for (const el of [this.leftTechBox, this.rightTechBox]) detach(el);

        // ① 立绘 → 屏幕左下 / 右下角
        for (const [frame, edge] of [[this.leftPortraitFrame, 'left'], [this.rightPortraitFrame, 'right']] as const) {
            if (!frame) continue;
            frame.style.position = 'fixed';
            frame.style.bottom = '0';
            frame.style.top = 'auto';
            frame.style[edge === 'left' ? 'right' : 'left'] = 'auto';
            frame.style[edge] = '0';
            frame.style.zIndex = String(T.zIndex.panel);
            frame.style.opacity = '1';
            frame.style.visibility = 'visible';
            frame.style.display = 'block';
        }

        // ② 顶部战术面板极简呈现
        if (topHud) {
            topHud.style.display = 'none';
        }

        // ③ 科技 → 屏幕下方居中左右分列
        if (this.leftTechBox) {
            this.leftTechBox.style.position = 'fixed';
            this.leftTechBox.style.bottom = '1.8vh';
            this.leftTechBox.style.top = 'auto';
            this.leftTechBox.style.right = '50.5vw';
            this.leftTechBox.style.left = 'auto';
            this.leftTechBox.style.zIndex = String(T.zIndex.panel + 1);
            this.leftTechBox.style.color = '#e8dcc0';
        }
        if (this.rightTechBox) {
            this.rightTechBox.style.position = 'fixed';
            this.rightTechBox.style.bottom = '1.8vh';
            this.rightTechBox.style.top = 'auto';
            this.rightTechBox.style.left = '50.5vw';
            this.rightTechBox.style.right = 'auto';
            this.rightTechBox.style.zIndex = String(T.zIndex.panel + 1);
            this.rightTechBox.style.color = '#e8dcc0';
        }

        // ④ 科技框之间的金色双刃斧小徽记
        if (!this.techDivider) {
            this.techDivider = document.createElement('div');
            this.techDivider.id = 'scene13-tech-divider';
            this.techDivider.style.cssText = `
                position: fixed;
                bottom: 1.8vh;
                left: 50%;
                transform: translateX(-50%);
                z-index: ${T.zIndex.panel + 2};
                font-family: 'Noto Serif SC', serif;
                font-size: 13px;
                font-weight: 900;
                color: rgba(255, 215, 0, 0.9);
                text-shadow: 0 0 6px rgba(255, 180, 40, 0.7);
                pointer-events: none;
                display: flex;
                align-items: center;
                gap: 4px;
                background: rgba(15, 10, 5, 0.75);
                padding: 2px 8px;
                border: 1px solid rgba(212, 175, 55, 0.6);
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
            `;
            this.techDivider.innerHTML = '<span style="color:#d4af37">⚔</span>';
            document.body.appendChild(this.techDivider);
        }
        this.techDivider.style.display = 'flex';
        this.techDivider.style.opacity = '1';
    }
            } else if (this.leftTechBox.dataset.sig !== '') {
                this.leftTechBox.dataset.sig = '';
                this.rightTechBox.dataset.sig = '';
                this.leftTechBox.textContent = '';
                this.rightTechBox.textContent = '';
                this.leftTechBox.style.opacity = '0';
                this.leftTechBox.style.display = 'none';
                this.rightTechBox.style.opacity = '0';
                this.rightTechBox.style.display = 'none';
                if (this.techDivider) {
                    this.techDivider.style.opacity = '0';
                    this.techDivider.style.display = 'none';
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
        // 🔴 [2026-08-12 修「兵没死光数字已归零」] 13 期间**整段跳过**这套溃败表演。
        //    它是给 8/9/10 引擎战斗做戏剧化的（把败方数字钉在 10% 再按 u^6 崩到 0），
        //    可 13 里屏幕上摆着真实精灵，数字必须等于场上实数 —— 两套一起跑就会出现
        //    「地图上兵还在打、数字已经 0」（主人实锤）。演出在跑时 liveWar 即唯一真相。
        if (!liveWar && !this.outcomeLocked && this.collapseStartAttPct !== null) {
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

        // 第二行名字/兵力 = pickSideNameUnit（本城或开局波次）；立绘/标签 = pickPortraitTagUnit。
        // 其余部队由 updateReinforcements 第三行列出。
        const attUnitsNow = this.boundRegionalBattleField
            ? this.boundRegionalBattleField.getAttackerUnits()
            : (this.currentRegionalUnits?.attackers ?? []);
        const defUnitsNow = this.boundRegionalBattleField
            ? this.boundRegionalBattleField.getDefenderUnits()
            : (this.currentRegionalUnits?.defenders ?? []);
        const attPrimary = attUnitsNow.length > 0
            ? (this.pickSideNameUnit(attUnitsNow, 'attacker') ?? attUnitsNow[0])
            : null;
        const defPrimary = defUnitsNow.length > 0
            ? (this.pickSideNameUnit(defUnitsNow, 'defender') ?? defUnitsNow[0])
            : null;
        this.renderSideLabel('attacker', this.attackerDisplayName, attCurrent);
        this.renderSideLabel('defender', this.defenderDisplayName, defCurrent);
        this.updateFactionDisplay();
        const attTag = attUnitsNow.length > 0 ? this.pickPortraitTagUnit(attUnitsNow, 'attacker') : null;
        const defTag = defUnitsNow.length > 0 ? this.pickPortraitTagUnit(defUnitsNow, 'defender') : null;
        this.updateMultiplierBadges(attTag, defTag);
        this.updateSkillBadges(attTag, defTag);

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

        // 🔴 [2026-08-12 修「只有数字动、条子不动」] 13 期间引擎被冻结，`elapsed` 永远是 0，
        //    上面算出的 progress 就恒为 0 → 血条一辈子停在第一幕（开局居中），只有数字在跳。
        //    改用**演出自己的进度**：双方已消耗的兵力占开局总量的比例。
        //    ✅「开局标尺永远居中」的铁律不破：开战一兵未损 → progress=0 → 仍是第一幕居中，
        //       差距完全靠打出来，和引擎战斗的三幕节奏语义一致。
        if (liveWar) {
            const live0 = (window as any).game?.scene13War?.getInitialTroops?.();
            const spent = live0 && live0.total > 0
                ? 1 - (liveWar.attacker + liveWar.defender) / live0.total
                : 0;
            progress = Math.min(1, Math.max(0, spent));
        }

        // 占优方（=标尺最后崩塌要倒向的一面）：区域性战斗读引擎判定的强方
        const attStronger = this.boundRegionalBattleField
            ? this.boundRegionalBattleField.isAttackerPredictedStronger()
            : realAttPct >= 50;
        
        /** 
         * 第二、三阶段的落点：严格按真实兵力比（realAttPct）显示，
         * 但如果是兵力碾压局，为了防止看不到兵力数字，将标尺截断在 77%（或 23%）位置。
         */
        const lowerBound = 100 - CLASH_STALEMATE_PCT;
        const upperBound = CLASH_STALEMATE_PCT;
        const targetStalematePct = Math.max(lowerBound, Math.min(upperBound, realAttPct));
        
        // 平滑追踪目标落点，防止翻盘时标尺瞬间闪现
        this.smoothedStalematePct += (targetStalematePct - this.smoothedStalematePct) * 0.05;
        const stalematePct = this.smoothedStalematePct;

        // 摇摆走战斗逻辑时钟（2026-08-03 主人定）：周期约 12.6s，平时沉稳缓慢，
        // 只有崩溃段（u^6）才快速下落；暂停即停摆、倍速随战斗同频。谐波 0.2 提供拍频变化感
        // （0.1 时调制太浅，摆动幅度几乎恒定，观感死板）。
        const swingT = battleClockSec * 0.8;
        const swingUnit = Math.sin(swingT) * 0.8 + Math.sin(swingT * 1.4) * 0.2;

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
            // 第二阶段（12 秒）：保持在真实兵力比位置，不提前回撤，仅逐步放大摇摆幅度
            this.collapseStartAttPct = null;
            const k = (progress - PHASE_STALEMATE_START) / (PHASE_COLLAPSE_START - PHASE_STALEMATE_START);
            const swingAmp = BAR_SWING_ACT2_FROM + (BAR_SWING_ACT2_TO - BAR_SWING_ACT2_FROM) * k;
            attPct = realAttPct + swingUnit * swingAmp;
        } else {
            // 第三阶段（6 秒）：只在第三阶段初，如果是碾压局，才回撤到 77% (stalematePct) 保底线。
            if (this.collapseStartAttPct === null || (this.collapseStartAttPct > 50) !== (stalematePct > 50)) {
                this.collapseStartAttPct = realAttPct; // 从第二阶段末尾（真实兵力比）开始回撤
            }
            const s = Math.min(1, (progress - PHASE_COLLAPSE_START) / Math.max(0.0001, 1 - PHASE_COLLAPSE_START));
            
            if (s < BAR_CLIFF_START) {
                // 在前 5 秒内，利用开头的 1 秒（s = 1/6）完成平滑回撤
                const retreatK = Math.min(1, s / (1 / 6));
                const easedRetreat = retreatK * retreatK * (3 - 2 * retreatK); // smoothstep
                const hold = this.collapseStartAttPct + (stalematePct - this.collapseStartAttPct) * easedRetreat;
                attPct = hold + swingUnit * BAR_SWING_ACT3;
            } else {
                // 断崖段：u^6 瞬间崩塌，直接推到底（100/0），方向读真实胜负，不再留给宣判撞底。
                const u = (s - BAR_CLIFF_START) / (1 - BAR_CLIFF_START);
                const hold = this.collapseStartAttPct + (stalematePct - this.collapseStartAttPct); // 回撤终点
                const cliff = attStronger ? 100 : 0;
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
            let loaded = false;
            const onLoad = () => {
                if (loaded) return;
                loaded = true;
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
                    const alt = getRandomRegionPortraitPath(cultureRegion, {
                        factionId: portraitOpts.factionId,
                        exclude: finalUrl,
                    }) || BATTLE_PORTRAIT_FALLBACK;
                    if (!portraitUrlsEqual(alt, finalUrl)) {
                        setSrc(alt, true);
                    }
                };
            }
            // 切换立绘先清空旧图：img.src 是异步加载，不清空会残留上一场人物（新图 onload 才替换）
            img.removeAttribute('src');
            img.src = this.portraitPickerCatalogRev
                ? `${finalUrl}?v=${this.portraitPickerCatalogRev}`
                : finalUrl;
            if (img.complete && img.naturalWidth > 0) {
                onLoad();
            } else {
                applyFacing();
                applyPortraitAdjustToElement(img, finalUrl, this.correctorData);
            }
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
