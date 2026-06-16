import { getScriptedCampaignById } from '../data/ScriptedCampaigns';
import { getFactionGeneral } from '../data/FactionGenerals';
import { Battle, IBattleUnit } from '../core/CombatSystem';
import { BattleField } from '../core/BattleField';
import { SPRITE_PATHS, GameConfig } from '../config/GameConfig';
import {
    getCombatPortraitPath,
    portraitUrlsEqual,
    resolvePortraitSourceFacing,
    shouldMirrorPortraitForSide,
    type PortraitSourceFacing,
} from '../config/portrait_defaults';
import { applyPortraitAdjustToElement, extractPortraitFolder, resolvePortraitAdjust } from '../config/PortraitAdjust';
import { autoFitPortraitFromUrl } from '../config/portraitAutoFit';
import {
    DEFAULT_PORTRAIT_ADJUST,
    PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y,
    type PortraitAdjustData,
    type PortraitAdjustValues,
} from '../data/portrait_adjust';
import { COMBAT_UI_TOKENS, uiPx } from '../config/combat-ui-tokens';
import { PortraitConfigManager } from '../core/PortraitConfigManager';
import { getUnitCultureCombatMultiplier, getCampaignLegionCombatMultiplier, getCultureOnlyCombatMultiplier, getPassGarrisonCombatMultiplier } from '../systems/CultureCombat';
import { getOpeningTacticalPowerMultiplier, getStrategicBattlePowerMultiplier, getGeneralSkillDisplayTags, getPassGarrisonDefenseSkillDisplay, getReinforcementJoinSkillDisplay, getExpeditionForageSkillDisplay, canUnitUseGeneralSkills } from '../combat/GeneralSkillCombat';
import { PASS_GARRISON_DEFENSE_SKILL, REINFORCEMENT_JOIN_SKILL } from '../data/GeneralSkills';
const T = COMBAT_UI_TOKENS;

/** 战报技能条/系数链：精锐或远征 ×1.2 用番号专名作标签（去「军团」等尾缀） */
function getLegionEliteBadgeName(unit: IBattleUnit): string {
    const raw = (unit.name ?? '').trim();
    if (!raw) return '精锐';
    const match = raw.match(/(军团|驻军|守军)$/);
    const stripped = match ? raw.substring(0, match.index).trim() : raw;
    return stripped || raw;
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

    // UI Elements
    private centerBackdrop!: HTMLDivElement;
    private centerPanel!: HTMLDivElement;
    private topInfoRow!: HTMLDivElement;
    private healthBarContainer!: HTMLDivElement;
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
    private leftSideBarFill!: HTMLDivElement;
    private rightSideBarFill!: HTMLDivElement;
    private battleTitle!: HTMLDivElement;
    private oddsRow!: HTMLDivElement;
    /** 开战即定的攻方胜率（闭式结算 → 开战时算一次缓存，全程不变） */
    private cachedOddsAtt: number | null = null;
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
    /** 势力名前的战力系数链（例 1.2×1.2×1.2） */
    private leftFactionMultSpan!: HTMLSpanElement;
    private rightFactionMultSpan!: HTMLSpanElement;

    private currentBattle: Battle | null = null;
    private currentRegionalUnits: { attackers: IBattleUnit[], defenders: IBattleUnit[] } | null = null;
    private isVisible: boolean = false;
    private static readonly REGIONAL_TAIL_MS = 2000;
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
    private correctorDraft: Required<PortraitAdjustValues> = { scale: 1, offsetX: 0, offsetY: 0 };
    /** 自动保存防抖计时器：调整停手后自动写盘，无需按 Enter */
    private correctorSaveTimer: ReturnType<typeof setTimeout> | null = null;
    /** 十字准星参照线（竖中线 + 24% 眼线）开关与元素 */
    private correctorCrosshairOn = true;
    private leftCrosshair: HTMLDivElement | null = null;
    private rightCrosshair: HTMLDivElement | null = null;
    private crosshairBtn: HTMLButtonElement | null = null;

    constructor() {
        document.querySelectorAll('#combat-ui-panel').forEach((el) => el.remove());
        this.portraitConfig = new PortraitConfigManager();
        this.injectGlobalStyles();
        this.container = this.createContainer();
        this.createElements();
        document.body.appendChild(this.container);
        this.setupCorrectorHotkeys();
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
            @keyframes panel-entrance {
                0% { transform: translate(-50%, 250%); }
                60% { transform: translate(-50%, -6px); }
                80% { transform: translate(-50%, 3px); }
                100% { transform: translate(-50%, 0); }
            }
            /* 立绘外框进场：左从左→右，右从右→左 */
            @keyframes portrait-frame-enter-left {
                0% { opacity: 0; transform: translateX(-72px); }
                100% { opacity: 1; transform: translateX(0); }
            }
            @keyframes portrait-frame-enter-right {
                0% { opacity: 0; transform: translateX(72px); }
                100% { opacity: 1; transform: translateX(0); }
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
        this.leftPortraitWrap.appendChild(this.leftPortrait);
        leftFrame.appendChild(this.leftPortraitWrap);
        this.leftGeneralNameTag = this.createGeneralNameTag('left');
        leftFrame.appendChild(this.leftGeneralNameTag);

        const rightFrame = this.createPortraitFrame();
        this.rightPortraitFrame = rightFrame;
        rightFrame.style.right = uiPx(T.portraitInset + T.portraitPullToCenter);
        rightFrame.style.pointerEvents = 'auto';
        this.rightPortraitWrap = this.createPortraitFacingWrap('right');
        this.rightPortrait = this.createPortraitImage();
        this.setupPortraitInteraction(this.rightPortrait, false);
        this.rightPortraitWrap.appendChild(this.rightPortrait);
        rightFrame.appendChild(this.rightPortraitWrap);
        this.rightGeneralNameTag = this.createGeneralNameTag('right');
        rightFrame.appendChild(this.rightGeneralNameTag);

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
            background: linear-gradient(180deg, #fff4c8 0%, #f0c040 45%, #c88620 100%);
            -webkit-background-clip: text;
            background-clip: text;
            letter-spacing: ${uiPx(10)};
            margin-bottom: ${uiPx(12)};
            white-space: nowrap;
            text-align: center;
        `;

        // 赔率行：开战即亮胜率（🔒 必胜 / 胜率 XX% : YY%），制造悬念
        this.oddsRow = document.createElement('div');
        this.oddsRow.style.cssText = `
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(20)};
            font-weight: 700;
            letter-spacing: ${uiPx(2)};
            text-align: center;
            margin-bottom: ${uiPx(8)};
            text-shadow: 0 2px 6px rgba(0,0,0,0.9);
            white-space: nowrap;
            display: none;
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
            margin-bottom: ${uiPx(6)};
            padding: 0 ${uiPx(T.portraitHorizontalReserve)};
            box-sizing: border-box;
            pointer-events: none;
            z-index: ${T.zIndex.portrait + 2};
        `;
        this.leftSkillsBox = document.createElement('div');
        this.leftSkillsBox.style.cssText = `display: flex; gap: ${uiPx(6)}; flex-wrap: wrap; justify-content: flex-start;`;
        this.rightSkillsBox = document.createElement('div');
        this.rightSkillsBox.style.cssText = `display: flex; gap: ${uiPx(6)}; flex-wrap: wrap; justify-content: flex-end;`;
        this.skillsRow.appendChild(this.leftSkillsBox);
        this.skillsRow.appendChild(this.rightSkillsBox);

        this.healthBarContainer = document.createElement('div');
        this.healthBarContainer.style.cssText = `
            width: 100%;
            max-width: ${uiPx(T.clashBarTrackWidth)};
            height: ${uiPx(T.clashBar.height + 4)};
            background: rgba(0, 0, 0, 0.45);
            border: 1px solid rgba(255, 215, 0, 0.18);
            border-radius: 4px;
            box-shadow:
                inset 0 2px 10px rgba(0,0,0,0.75),
                0 0 24px rgba(255, 140, 40, 0.15),
                0 0 18px rgba(70, 150, 180, 0.12);
            position: relative;
            margin-bottom: ${uiPx(8)};
            overflow: hidden;
        `;

        this.defenderBar = document.createElement('div');
        this.defenderBar.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(90deg, #162530 0%, #2a5565 35%, #3d7a8f 65%, #5aacbe 100%);
            z-index: 1;
        `;

        this.attackerBar = document.createElement('div');
        this.attackerBar.style.cssText = `
            position: absolute;
            top: 0; left: 0; bottom: 0;
            width: 50%;
            background: linear-gradient(90deg, #7a1528 0%, #b04818 30%, #d47020 60%, #f0a830 100%);
            z-index: 2;
            transition: width 0.55s cubic-bezier(0.22, 1, 0.36, 1);
            clip-path: polygon(0 0, 100% 0, calc(100% - ${uiPx(T.clashBar.clipPx)}) 100%, 0% 100%);
            box-shadow: inset 0 -3px 10px rgba(255, 200, 80, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        `;

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
            transition: left 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        `;

        this.healthBarContainer.appendChild(this.defenderBar);
        this.healthBarContainer.appendChild(this.attackerBar);
        this.healthBarContainer.appendChild(this.clashEffect);


        // 军团信息：以「区域冲突」中线为界，左右各占一半；外缘避开立绘。
        const portraitPad = uiPx(T.portraitHorizontalReserve);
        this.sideStatsRow = document.createElement('div');
        this.sideStatsRow.style.cssText = `
            width: 100%;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            column-gap: ${uiPx(8)};
            align-items: center;
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
        this.leftSideBarFill = document.createElement('div');
        leftHud.appendChild(this.leftSideLabel);
        leftHud.appendChild(this.createSideBarRow('attacker', this.leftSideBarFill));
        this.sideStatsRow.appendChild(leftHud);
        this.sideStatsRow.appendChild(this.createSideVsIcon());

        const rightHud = this.createSideHud('defender');
        rightHud.appendChild(this.createFactionRow('defender'));
        this.rightSideLabel = this.buildSideLabel('defender');
        this.rightSideBarFill = document.createElement('div');
        rightHud.appendChild(this.rightSideLabel);
        rightHud.appendChild(this.createSideBarRow('defender', this.rightSideBarFill));
        this.sideStatsRow.appendChild(rightHud);


        this.bottomInfoRow = document.createElement('div');
        this.bottomInfoRow.style.display = 'none';

        this.centerPanel.appendChild(this.battleYear);
        this.centerPanel.appendChild(this.battleTitle);
        this.centerPanel.appendChild(this.oddsRow);
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
            display: flex;
            flex-direction: column;
            align-items: ${isAtt ? 'flex-end' : 'flex-start'};
            padding: 0;
            text-align: ${isAtt ? 'right' : 'left'};
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
            align-self: center;
        `;

        const img = document.createElement('img');
        img.src = '/assets/UI/battlefield_icon.png';
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

    /** 侧栏势力名称 + 其前战力系数链（位于「军团名: 兵力」之上） */
    private createFactionRow(side: 'attacker' | 'defender'): HTMLDivElement {
        const isAtt = side === 'attacker';
        const row = document.createElement('div');
        row.style.cssText = `
            width: 100%;
            margin-bottom: ${uiPx(6)};
            display: flex;
            flex-direction: ${isAtt ? 'row' : 'row-reverse'};
            align-items: baseline;
            pointer-events: none;
        `;
        const multSpan = document.createElement('span');
        multSpan.style.cssText = `
            margin-${isAtt ? 'left' : 'right'}: auto;
            font-family: 'Noto Sans SC', sans-serif;
            font-size: ${uiPx(T.sideBar.factionMultSize)};
            font-weight: 700;
            letter-spacing: 0.02em;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
            color: ${isAtt ? 'rgba(255, 218, 130, 0.95)' : 'rgba(150, 210, 225, 0.95)'};
            text-shadow: 0 1px 3px rgba(0,0,0,0.9);
            white-space: nowrap;
            display: none;
        `;

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = `
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(T.sideBar.factionNameSize)};
            font-weight: 900;
            letter-spacing: ${uiPx(2)};
            text-shadow: 0 2px 6px rgba(0,0,0,0.85);
            white-space: nowrap;
        `;

        row.appendChild(nameSpan);
        row.appendChild(multSpan);

        if (isAtt) {
            this.leftFactionMultSpan = multSpan;
            this.leftFactionNameSpan = nameSpan;
        } else {
            this.rightFactionMultSpan = multSpan;
            this.rightFactionNameSpan = nameSpan;
        }
        return row;
    }

    /** 构建「名称: 兵力」标签；兵力用等宽数字区，避免位数变化抖动 */
    private buildSideLabel(side: 'attacker' | 'defender'): HTMLDivElement {
        const isAtt = side === 'attacker';
        const label = document.createElement('div');
        this.applySideLabelStyle(label, side);
        label.style.display = 'flex';
        label.style.flexDirection = isAtt ? 'row' : 'row-reverse';
        label.style.alignItems = 'baseline';
        label.style.flexWrap = 'nowrap';
        label.style.width = '100%';
        label.style.maxWidth = '100%';
        label.style.overflow = 'visible';

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = `
            overflow: visible;
            white-space: pre-wrap;
            line-height: 1.15;
            flex-shrink: 1;
            min-width: 0;
            max-width: ${T.sideBar.maxDisplayNameCh + T.sideBar.maxNameSuffixCh}ch;
            color: ${isAtt ? T.colors.attackerName : T.colors.defenderName};
        `;

        const troopsSpan = document.createElement('span');
        troopsSpan.style.cssText = `
            color: rgba(255,255,255,0.92);
            font-weight: 700;
            flex-shrink: 0;
            margin-${isAtt ? 'left' : 'right'}: auto;
            min-width: ${T.sideBar.troopsMinCh}ch;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
            text-align: right;
            letter-spacing: 0.02em;
        `;

        const multBadge = document.createElement('span');
        multBadge.style.cssText = `
            flex-shrink: 0;
            margin-${isAtt ? 'left' : 'right'}: ${uiPx(8)};
            padding: 0 ${uiPx(6)};
            font-size: ${uiPx(12)};
            font-weight: 700;
            line-height: 1.5;
            border-radius: 3px;
            border: 1px solid ${isAtt ? 'rgba(253, 185, 49, 0.45)' : 'rgba(90, 170, 190, 0.45)'};
            color: ${isAtt ? 'rgba(255, 218, 130, 0.95)' : 'rgba(150, 210, 225, 0.95)'};
            background: rgba(0, 0, 0, 0.35);
            text-shadow: 0 1px 2px rgba(0,0,0,0.9);
            white-space: nowrap;
            display: none;
        `;

        if (isAtt) {
            this.leftSideNameSpan = nameSpan;
            this.leftSideTroopsSpan = troopsSpan;
            this.leftMultBadge = multBadge;
        } else {
            this.rightSideNameSpan = nameSpan;
            this.rightSideTroopsSpan = troopsSpan;
            this.rightMultBadge = multBadge;
        }

        label.appendChild(nameSpan);
        label.appendChild(troopsSpan);
        label.appendChild(multBadge);
        return label;
    }

    /** 战力系数链：写在势力名前方，多一层非 1 系数就多叠一个（例 1.2×1.2×1.2） */
    private updateMultiplierBadges(attacker: IBattleUnit | null, defender: IBattleUnit | null): void {
        const applyChain = (multSpan: HTMLSpanElement, unit: IBattleUnit | null) => {
            if (!unit) {
                multSpan.style.display = 'none';
                multSpan.removeAttribute('title');
                multSpan.textContent = '';
                return;
            }
            const { chain, title } = this.formatBattlePowerFactorChain(unit);
            if (!chain) {
                multSpan.style.display = 'none';
                multSpan.removeAttribute('title');
                multSpan.textContent = '';
                return;
            }
            multSpan.textContent = chain;
            multSpan.title = title;
            multSpan.style.display = 'inline';
        };
        applyChain(this.leftFactionMultSpan, attacker);
        applyChain(this.rightFactionMultSpan, defender);

        const applyTotal = (badge: HTMLSpanElement | null, unit: IBattleUnit | null) => {
            if (!badge) return;
            if (!unit) {
                badge.style.display = 'none';
                return;
            }
            badge.textContent = this.formatBattlePowerBadge(unit);
            badge.style.display = 'inline-block';
        };
        applyTotal(this.leftMultBadge, attacker);
        applyTotal(this.rightMultBadge, defender);
    }

    private getPrimaryBattler(side: 'attacker' | 'defender'): IBattleUnit | null {
        if (this.currentBattle) {
            return side === 'attacker' ? this.currentBattle.attacker : this.currentBattle.defender;
        }
        if (this.currentRegionalUnits) {
            const units =
                side === 'attacker'
                    ? this.currentRegionalUnits.attackers
                    : this.currentRegionalUnits.defenders;
            const followedId = (window as unknown as { game?: { cameraFollowUI?: { getFollowedArmyId(): string | null } } })
                .game?.cameraFollowUI?.getFollowedArmyId();
            if (followedId) {
                const followed = units.find((u) => u.id === followedId);
                if (followed) return followed;
            }
            return units[0] ?? null;
        }
        return null;
    }

    private updateSkillBadges(attacker: IBattleUnit | null, defender: IBattleUnit | null): void {
        this.leftSkillsBox.innerHTML = '';
        this.rightSkillsBox.innerHTML = '';

        const createSkillTag = (name: string, effect: string, isFamous: boolean) => {
            const tag = document.createElement('div');
            const borderColor = isFamous ? 'rgba(255, 215, 0, 0.7)' : 'rgba(200, 200, 200, 0.6)';
            const bgColor = isFamous ? 'rgba(80, 20, 0, 0.8)' : 'rgba(20, 40, 60, 0.8)';
            tag.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                background: ${bgColor};
                border: 1px solid ${borderColor};
                border-radius: 4px;
                padding: ${uiPx(4)} ${uiPx(10)};
                box-shadow: 0 2px 6px rgba(0,0,0,0.85);
            `;
            
            const nameEl = document.createElement('div');
            nameEl.style.cssText = `
                font-family: 'Noto Serif SC', serif;
                font-size: ${uiPx(16)};
                font-weight: 900;
                color: #fff8e0;
                letter-spacing: 2px;
                margin-bottom: ${uiPx(2)};
            `;
            nameEl.textContent = name;
            
            const effectEl = document.createElement('div');
            effectEl.style.cssText = `
                font-family: 'Noto Sans SC', sans-serif;
                font-size: ${uiPx(10)};
                font-weight: 400;
                color: rgba(255, 255, 255, 0.7);
                letter-spacing: 1px;
            `;
            effectEl.textContent = effect;
            
            tag.appendChild(nameEl);
            tag.appendChild(effectEl);
            return tag;
        };

        const renderSide = (box: HTMLDivElement, unit: IBattleUnit | null) => {
            if (!unit) return;

            const passSkill = getPassGarrisonDefenseSkillDisplay(unit);
            if (passSkill) {
                box.appendChild(createSkillTag(passSkill.name, passSkill.effectLabel, false));
            }

            const joinLuck = this.boundRegionalBattleField?.getReinforcementJoinLuck(unit.id) ?? null;
            const reinfSkill = getReinforcementJoinSkillDisplay(joinLuck);
            if (reinfSkill) {
                box.appendChild(createSkillTag(reinfSkill.name, reinfSkill.effectLabel, false));
            }

            const forageSkill = getExpeditionForageSkillDisplay(unit); // 远征军：因粮于敌
            if (forageSkill) {
                box.appendChild(createSkillTag(forageSkill.name, forageSkill.effectLabel, true));
            }

            if (unit.generalId) {
                for (const tag of getGeneralSkillDisplayTags(unit)) {
                    box.appendChild(createSkillTag(tag.name, tag.effectLabel, tag.isFamous));
                }
            }

            const legionMult = getCampaignLegionCombatMultiplier(unit);
            if (Math.abs(legionMult - 1) > 0.001) {
                const effectLabel = `×${parseFloat(legionMult.toFixed(2))}`;
                box.appendChild(createSkillTag(getLegionEliteBadgeName(unit), effectLabel, true));
            }
        };
        renderSide(this.leftSkillsBox, attacker);
        renderSide(this.rightSkillsBox, defender);
    }

    private getReinforcementJoinLuckForUnit(unit: IBattleUnit): number | null {
        return this.boundRegionalBattleField?.getReinforcementJoinLuck(unit.id) ?? null;
    }

    private formatBattlePowerBadge(unit: IBattleUnit): string {
        const isGarrison = unit.unitType === 'city';
        const battleType = this.boundRegionalBattleField?.type ?? this.currentBattleType;
        const role = isGarrison ? '城防' : battleType === 'siege' ? '攻城' : '野战';
        
        let product = 1;
        product *= getUnitCultureCombatMultiplier(unit);
        product *= getCampaignLegionCombatMultiplier(unit);
        product *= getOpeningTacticalPowerMultiplier(unit);
        product *= getStrategicBattlePowerMultiplier(unit, battleType);
        const joinLuck = this.getReinforcementJoinLuckForUnit(unit);
        if (joinLuck !== null) product *= joinLuck;
        
        if (Math.abs(product - 1) <= 0.001) return `${role}×1`;
        return `${role}×${parseFloat(product.toFixed(2))}`;
    }

    private formatBattlePowerFactorChain(unit: IBattleUnit): { chain: string; title: string } {
        const isGarrison = unit.unitType === 'city';
        const battleType = this.boundRegionalBattleField?.type ?? this.currentBattleType;
        const role = isGarrison ? '城防' : battleType === 'siege' ? '攻城' : '野战';
        const fmt = (n: number) => String(parseFloat(n.toFixed(2)));

        const labeled: { label: string; value: number }[] = [];
        const pushIfNotOne = (label: string, n: number) => {
            if (Math.abs(n - 1) > 0.001) labeled.push({ label, value: n });
        };
        pushIfNotOne('文化', getCultureOnlyCombatMultiplier(unit));
        pushIfNotOne(PASS_GARRISON_DEFENSE_SKILL.displayName, getPassGarrisonCombatMultiplier(unit));
        pushIfNotOne(getLegionEliteBadgeName(unit), getCampaignLegionCombatMultiplier(unit));
        pushIfNotOne('战术', getOpeningTacticalPowerMultiplier(unit));
        pushIfNotOne('战略', getStrategicBattlePowerMultiplier(unit, battleType));
        const joinLuck = this.getReinforcementJoinLuckForUnit(unit);
        if (joinLuck !== null) {
            pushIfNotOne(REINFORCEMENT_JOIN_SKILL.displayName, joinLuck);
        }

        if (labeled.length === 0) {
            return { chain: '', title: '' };
        }

        const chain = labeled.map((l) => fmt(l.value)).join('×');
        const title = `${role}：${labeled.map((l) => `${l.label}×${fmt(l.value)}`).join(' ')}`;
        return { chain, title };
    }

    /** 侧栏小血条 + 攻剑 / 守盾图标（撑满各自半宽） */
    private createSideBarRow(side: 'attacker' | 'defender', fillEl: HTMLDivElement): HTMLDivElement {
        const isAtt = side === 'attacker';
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: ${uiPx(10)};
            margin-top: ${uiPx(8)};
            width: 100%;
            min-width: 0;
            flex-direction: row;
        `;

        const track = document.createElement('div');
        track.style.cssText = `
            flex: 1 1 0;
            min-width: 0;
            height: ${uiPx(T.sideBar.height)};
            background: rgba(0, 0, 0, 0.55);
            border-radius: 3px;
            overflow: hidden;
            box-shadow: inset 0 2px 6px rgba(0,0,0,0.85);
            display: flex;
        `;

        fillEl.style.cssText = `
            height: 100%;
            width: 100%;
            flex-shrink: 0;
            ${isAtt ? '' : 'margin-left: auto;'}
            background: ${isAtt
                ? 'linear-gradient(90deg, #8a1828 0%, #d47020 55%, #f0a830 100%)'
                : 'linear-gradient(90deg, #5aacbe 0%, #3d7a8f 55%, #1a3540 100%)'};
            transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
        `;
        track.appendChild(fillEl);

        const icon = document.createElement('span');
        icon.textContent = isAtt ? '⚔' : '🛡';
        icon.style.cssText = `
            font-size: ${uiPx(T.sideBar.iconSize)};
            line-height: 1;
            color: ${isAtt ? T.colors.attackerGold : T.colors.defenderJade};
            text-shadow: 0 0 12px ${isAtt ? 'rgba(253, 185, 49, 0.65)' : 'rgba(90, 170, 190, 0.65)'};
            flex-shrink: 0;
        `;

        if (isAtt) {
            row.appendChild(icon);
            row.appendChild(track);
        } else {
            row.appendChild(track);
            row.appendChild(icon);
        }
        return row;
    }

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
        const troopsEl = side === 'attacker' ? this.leftSideTroopsSpan : this.rightSideTroopsSpan;
        nameEl.innerHTML = name;
        const t = Math.max(0, Math.floor(troops));
        troopsEl.textContent = t >= 10000 ? `${(t / 10000).toFixed(2)}万` : String(t);
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

    private setupPortraitInteraction(img: HTMLImageElement, isLeft: boolean) {
        img.style.cursor = 'pointer';
        img.style.pointerEvents = 'auto';

        img.addEventListener('click', () => {
            if (this.currentBattleKey) {
                this.tempIsLeft = isLeft;
                this.fileInput.click();
            }
        });

        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.currentBattleKey) {
                this.toggleMirror(isLeft ? 'attacker' : 'defender');
            }
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
        const fadeDir = side === 'left' ? 'right' : 'left';
        
        const maskCSS = `linear-gradient(to ${fadeDir}, transparent 0px, black 12px, black 100%)`;

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
            -webkit-mask-image: ${maskCSS};
            mask-image: ${maskCSS};
        `;
        return wrap;
    }

    private createPortraitImage(): HTMLImageElement {
        const img = document.createElement('img');
        img.style.cssText = `
            width: auto;
            height: 100%;
            max-height: ${uiPx(550)};
            display: block;
            filter: drop-shadow(0 20px 30px rgba(0,0,0,0.8));
            pointer-events: auto;
        `;
        return img;
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
        this.leftPortraitFrame.style.animation = 'portrait-frame-enter-left 0.55s ease-out 0.12s both';
        this.rightPortraitFrame.style.animation = 'portrait-frame-enter-right 0.55s ease-out 0.18s both';
    }

    // --- LOGIC ---

    public show(battle: Battle) {
        this.currentBattle = battle;
        this.currentRegionalUnits = null;
        this.boundRegionalBattleField = null;
        this.currentBattleType = battle.type;
        this.isVisible = true;
        this.attackerFactionId = battle.attacker.factionId;
        this.defenderFactionId = battle.defender.factionId;
        this.computeAndRenderOdds([battle.attacker], [battle.defender]);
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

        this.currentBattle = null;
        this.currentRegionalUnits = { attackers, defenders };
        this.boundRegionalBattleField = battleField ?? null;
        this.currentBattleType = battleField?.type;
        this.lastTimeScale = Math.max(0.1, timeScale);
        this.isVisible = true;
        this.computeAndRenderOdds(attackers, defenders);

        if (this.boundRegionalBattleField) {
            this.refreshRegionalSafetyDeadline();
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

        const attacker = attackers[0];
        const defender = defenders[0];
        
        const buildWaveGroupedName = (units: IBattleUnit[], _isAttacker: boolean): string => {
            const waves = new Map<number, IBattleUnit[]>();
            for (const u of units) {
                const wi = this.boundRegionalBattleField?.getUnitWaveIndex(u.id) ?? 0;
                if (!waves.has(wi)) waves.set(wi, []);
                waves.get(wi)!.push(u);
            }
            const sortedWaves = [...waves.entries()].sort((a, b) => b[0] - a[0]);

            const maxWave = sortedWaves.length > 0 ? sortedWaves[0][0] : 0;
            let html = '';
            for (const [wi, waveUnits] of sortedWaves) {
                const dim = maxWave <= 1 ? 1 : wi === 0 ? 1 : wi === 1 ? 0.82 : 0.62;
                const size = maxWave <= 1 ? '1em' : wi === 0 ? '1em' : wi === 1 ? '0.92em' : '0.82em';
                
                for (const u of waveUnits) {
                    const match = u.name.match(/(军团|驻军|守军)$/);
                    const base = match ? u.name.substring(0, match.index) : u.name;
                    const suffix = match ? match[0] : '';
                    html += `<span style="opacity:${dim}; font-size:${size}; white-space: nowrap;">${base}</span>`;
                    if (suffix) {
                        html += `<span style="opacity:${dim * 0.85}; font-size:calc(${size} * 0.95); margin-left:2px; white-space: nowrap;">${suffix}</span>`;
                    }
                }
            }
            return `<div style="display: grid; grid-template-columns: max-content max-content; column-gap: 4px; row-gap: 4px; text-align: inherit;">${html}</div>`;
        };
        const attName = buildWaveGroupedName(attackers, true);
        const defName = buildWaveGroupedName(defenders, false);

        this.attackerFactionId = attacker.factionId;
        this.defenderFactionId = defender.factionId;
        this.currentBattleKey = this.buildPortraitConfigKey(displayTitle, attacker, defender);

        this.updateMultiplierBadges(attacker, defender);
        this.updateSkillBadges(attacker, defender);
        this.updateInfoDirect(attName, defName, displayTitle, displayYear, description);

        this.setPortrait(this.leftPortrait, attacker, attacker.generalId, attacker.factionId, attackerPortrait, 'attacker');
        this.setPortrait(this.rightPortrait, defender, defender.generalId, defender.factionId, defenderPortrait, 'defender', this.leftPortrait.src || undefined);

        const setGeneralName = (tag: HTMLDivElement, unit: IBattleUnit) => {
            let name = '';
            const entity = unit.getEntity?.();
            if (entity?.scriptedCampaignId) {
                const campaign = getScriptedCampaignById(entity.scriptedCampaignId);
                if (campaign?.generalName) name = campaign.generalName;
            }
            if (!name && unit.generalId) {
                const gen = getFactionGeneral(unit.factionId || '');
                if (gen && gen.generalId === unit.generalId) {
                    name = gen.generalName;
                }
            }
            if (name) {
                tag.textContent = name;
                tag.style.display = 'block';
            } else {
                tag.style.display = 'none';
            }
        };
        setGeneralName(this.leftGeneralNameTag, attacker);
        setGeneralName(this.rightGeneralNameTag, defender);

        this.updateStats();
        this.container.style.animation = 'panel-entrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        this.playPortraitEntrance();
    }

    public isRegionalVisible(): boolean {
        return this.isVisible && this.currentRegionalUnits !== null;
    }

    /** 战术武将技触发效果（侧边徽章闪烁，不再弹大字） */
    public flashTacticalSkill(displayName: string): void {
        if (!displayName) return;
        const addFlash = (badge: HTMLSpanElement | null) => {
            if (!badge || !badge.textContent?.includes(displayName)) return;
            badge.style.animation = 'none';
            void badge.offsetWidth;
            badge.style.animation = 'tactical-skill-pop 1.5s ease-out forwards';
        };
        addFlash(this.leftMultBadge);
        addFlash(this.rightMultBadge);
    }

    public isBoundToBattleField(battleField: BattleField): boolean {
        return this.isRegionalVisible() && this.boundRegionalBattleField === battleField;
    }

    // ============================================================
    // 游戏内立绘校正：战斗中按 F2 暂停 → 一键自动校正 + 方向键微调 → 保存
    // ============================================================

    private setupCorrectorHotkeys(): void {
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

            const tag = (document.activeElement?.tagName ?? '').toUpperCase();
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

            const fine = e.shiftKey ? 5 : 1;
            switch (e.key) {
                case 'Escape': e.preventDefault(); this.closeCorrector(); break;
                case 'Tab': e.preventDefault(); this.switchCorrectorSide(); break;
                case 'Enter': e.preventDefault(); this.saveCorrector(); break;
                case 'ArrowLeft': e.preventDefault(); this.nudgeCorrector(0, -fine, 0); break;
                case 'ArrowRight': e.preventDefault(); this.nudgeCorrector(0, fine, 0); break;
                case 'ArrowUp': e.preventDefault(); this.nudgeCorrector(0, 0, -fine); break;
                case 'ArrowDown': e.preventDefault(); this.nudgeCorrector(0, 0, fine); break;
                case '[': case '-': e.preventDefault(); this.nudgeCorrector(-0.02, 0, 0); break;
                case ']': case '=': case '+': e.preventDefault(); this.nudgeCorrector(0.02, 0, 0); break;
                // 自动校正只放在按钮上，不绑 A 键（A 与地图 WASD 平移冲突）
                default: break;
            }
        });
    }

    private correctorImg(): HTMLImageElement {
        return this.correctorSide === 'attacker' ? this.leftPortrait : this.rightPortrait;
    }

    /** 从 img.src 取出 "/assets/.../x.png" 形式路径（解码空格等） */
    private srcToPath(img: HTMLImageElement): string {
        const src = img.currentSrc || img.src;
        if (!src) return '';
        try {
            return decodeURIComponent(new URL(src, location.href).pathname);
        } catch {
            return '';
        }
    }

    private correctorPath(): string {
        return this.srcToPath(this.correctorImg());
    }

    private openCorrector(): void {
        this.correctorOpen = true;
        this.correctorPrevPaused = this.pauseHook?.isGamePaused() ?? false;
        this.pauseHook?.setPaused(true);
        this.correctorData = structuredClone(DEFAULT_PORTRAIT_ADJUST);
        if (!this.correctorPanel) this.correctorPanel = this.buildCorrectorPanel();
        this.correctorPanel.style.display = 'flex';
        this.loadCorrectorDraft();
        this.highlightCorrectorSide();
        this.updateCorrectorCrosshair();
    }

    private closeCorrector(): void {
        this.flushCorrectorAutoSave(); // 关闭前把未落盘的改动存掉
        this.correctorOpen = false;
        if (this.correctorPanel) this.correctorPanel.style.display = 'none';
        this.leftPortraitFrame.style.outline = '';
        this.rightPortraitFrame.style.outline = '';
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
    }

    private applyCorrectorPreview(): void {
        const path = this.correctorPath();
        if (!path) return;
        this.correctorData.images = this.correctorData.images ?? {};
        this.correctorData.images[path] = { ...this.correctorDraft };
        applyPortraitAdjustToElement(this.correctorImg(), path, this.correctorData);
        this.renderCorrectorReadout();
    }

    private nudgeCorrector(dScale: number, dx: number, dy: number): void {
        const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
        this.correctorDraft.scale = Math.round(clamp(this.correctorDraft.scale + dScale, 0.4, 2.2) * 100) / 100;
        this.correctorDraft.offsetX = clamp(this.correctorDraft.offsetX + dx, -240, 240);
        this.correctorDraft.offsetY = clamp(this.correctorDraft.offsetY + dy, -240, 240);
        this.applyCorrectorPreview();
        this.scheduleCorrectorAutoSave();
    }

    /** 调整停手 ~0.4s 后自动写盘（无需按 Enter）；期间继续调整会重新计时 */
    private scheduleCorrectorAutoSave(): void {
        if (this.correctorSaveTimer) clearTimeout(this.correctorSaveTimer);
        this.setCorrectorStatus('调整中…');
        this.correctorSaveTimer = setTimeout(() => {
            this.correctorSaveTimer = null;
            void this.saveCorrector();
        }, 400);
    }

    /** 立刻落盘待保存的改动（切换左右 / 关闭前调用） */
    private flushCorrectorAutoSave(): void {
        if (this.correctorSaveTimer) {
            clearTimeout(this.correctorSaveTimer);
            this.correctorSaveTimer = null;
            void this.saveCorrector();
        }
    }

    private async autoFitCorrectorCurrent(): Promise<void> {
        const path = this.correctorPath();
        if (!path) return;
        this.setCorrectorStatus('自动校正中…');
        const folder = extractPortraitFolder(path) ?? '';
        const eyeY = this.correctorData.folderGuides?.[folder]?.eyeLineY ?? PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y;
        const fit = await autoFitPortraitFromUrl(path, eyeY);
        if (!fit) { this.setCorrectorStatus('⚠ 读取像素失败，请手动微调'); return; }
        this.correctorDraft = { scale: fit.scale, offsetX: fit.offsetX, offsetY: fit.offsetY };
        this.applyCorrectorPreview();
        this.scheduleCorrectorAutoSave();
    }

    private switchCorrectorSide(): void {
        this.flushCorrectorAutoSave(); // 切换前先把当前张存掉
        this.correctorSide = this.correctorSide === 'attacker' ? 'defender' : 'attacker';
        this.loadCorrectorDraft();
        this.highlightCorrectorSide();
    }

    private highlightCorrectorSide(): void {
        const on = '3px solid #f5d78e';
        this.leftPortraitFrame.style.outline = this.correctorSide === 'attacker' ? on : '';
        this.rightPortraitFrame.style.outline = this.correctorSide === 'defender' ? on : '';
    }

    private buildCrosshair(): HTMLDivElement {
        const ch = document.createElement('div');
        ch.className = 'pt-crosshair';
        ch.innerHTML = '<div class="ch-eye"></div><div class="ch-mid"></div>';
        return ch;
    }

    /** 在两张立绘上铺十字准星：竖线=图中心(50%)，横线=眼线(24%)，作为手动对齐参照 */
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

    private async saveCorrector(): Promise<void> {
        const path = this.correctorPath();
        if (!path) { this.setCorrectorStatus('⚠ 当前无立绘路径'); return; }
        this.setCorrectorStatus('保存中…');
        try {
            // 先取磁盘上最新数据再合并，避免覆盖其它编辑
            const res = await fetch('/api/portrait-adjust');
            const disk: PortraitAdjustData = res.ok ? await res.json() : structuredClone(DEFAULT_PORTRAIT_ADJUST);
            disk.images = disk.images ?? {};
            disk.images[path] = { ...this.correctorDraft };
            const save = await fetch('/api/save-portrait-adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(disk),
            });
            if (!save.ok) throw new Error(`HTTP ${save.status}`);
            const result = await save.json();
            if (!result.ok) throw new Error(result.error || '保存失败');
            // 写回内存中的 DEFAULT，本场及后续战斗立即生效（无需 F5）
            DEFAULT_PORTRAIT_ADJUST.images = DEFAULT_PORTRAIT_ADJUST.images ?? {};
            DEFAULT_PORTRAIT_ADJUST.images[path] = { ...this.correctorDraft };
            const name = path.split('/').pop() ?? path;
            this.setCorrectorStatus(`✓ 已保存：${name}（已永久生效）`);
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
            <div style="font-size:14px;font-weight:700;color:#f5d78e;">立绘校正（已暂停 · 自动保存）</div>
            <div class="cc-readout" style="font-size:13px;color:#c4b89a;"></div>
            <div class="cc-actions" style="display:flex;flex-wrap:wrap;gap:8px;">
                ${btn('🪄 自动校正本张')}
                ${btn('准星：开')}
                ${btn('切换左右 (Tab)')}
                ${btn('关闭 (Esc)', true)}
            </div>
            <div style="font-size:11px;color:#9a8f7a;line-height:1.5;">
                准星：<span style="color:#ff9a7a;">橙竖线=图中心</span>，<span style="color:#6ec8ff;">蓝横线=眼线24%</span>。把眼睛对到蓝线、脸对橙线，用 <b>[ ]</b> 把头调到差不多大<br>
                方向键微调位置（Shift=快），Tab 换左右，Esc 关闭；调完<b>自动保存</b>，Enter 可立即保存
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
            .pt-crosshair .ch-eye {
                position:absolute; left:0; right:0; top:25%; height:0;
                border-top:2px dashed #6ec8ff; box-shadow:0 0 6px rgba(96,196,255,0.85);
            }
            .pt-crosshair .ch-mid {
                position:absolute; top:0; bottom:0; left:50%; width:0;
                border-left:2px dashed #ff9a7a; box-shadow:0 0 6px rgba(255,120,80,0.85);
            }
        `;
        document.head.appendChild(style);
        const [autoBtn, crossBtn, switchBtn, closeBtn] =
            Array.from(panel.querySelectorAll('.cc-btn')) as HTMLButtonElement[];
        this.crosshairBtn = crossBtn;
        // 按钮不抢焦点，避免点完按钮后按 Enter 既触发按钮又触发热键
        for (const b of [autoBtn, crossBtn, switchBtn, closeBtn]) {
            b.addEventListener('mousedown', (e) => e.preventDefault());
        }
        autoBtn.addEventListener('click', () => this.autoFitCorrectorCurrent());
        crossBtn.addEventListener('click', () => this.toggleCorrectorCrosshair());
        switchBtn.addEventListener('click', () => this.switchCorrectorSide());
        closeBtn.addEventListener('click', () => this.closeCorrector());
        document.body.appendChild(panel);
        return panel;
    }

    public hide() {
        if (this.correctorOpen) this.closeCorrector();
        this.cachedOddsAtt = null;
        if (this.oddsRow) this.oddsRow.style.display = 'none';
        this.clearRegionalTimers();
        this.isVisible = false;
        this.currentBattle = null;
        this.currentRegionalUnits = null;
        this.boundRegionalBattleField = null;
        this.currentBattleType = undefined;
        this.regionalSafetyDeadline = 0;
        this.attackerFactionId = null;
        this.defenderFactionId = null;
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
                    this.boundRegionalBattleField = null;
                    if (this.isRegionalVisible()) this.finishRegionalBattle();
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
            const match = u.name.match(/(军团|驻军|守军)$/);
            const base = match ? u.name.substring(0, match.index) : u.name;
            const suffix = match ? match[0] : '';
            if (!suffix) {
                return `<div style="text-align: inherit;"><span style="white-space: nowrap;">${base}</span></div>`;
            }
            return `<div style="display: grid; grid-template-columns: max-content max-content; column-gap: 4px; text-align: inherit;"><span style="white-space: nowrap;">${base}</span><span style="opacity: 0.85; font-size: 0.95em; margin-left: 2px; white-space: nowrap;">${suffix}</span></div>`;
        };
        this.attackerDisplayName = mapName(att);
        this.defenderDisplayName = mapName(def);
        this.attackerFactionId = att.factionId;
        this.defenderFactionId = def.factionId;
        this.battleTitle.textContent = title;
        this.battleYear.textContent = year;
        this.battleYear.style.display = year ? 'block' : 'none';

        this.currentBattleKey = title || `battle_${Date.now()}`;
        this.setPortrait(this.leftPortrait, att, att.generalId, att.factionId, undefined, 'attacker');
        this.setPortrait(this.rightPortrait, def, def.generalId, def.factionId, undefined, 'defender', this.leftPortrait.src || undefined);
        this.updateStats();
    }

    private updateInfoDirect(attName: string, defName: string, title: string, year: string, description?: string) {
        this.attackerDisplayName = attName;
        this.defenderDisplayName = defName;
        this.battleTitle.textContent = title;
        this.battleYear.textContent = year;
        this.battleYear.style.display = year ? 'block' : 'none';

        if (description) {
            this.eventDescription.textContent = description;
            this.eventDescription.style.display = 'block';
        } else {
            this.eventDescription.style.display = 'none';
        }
    }

    // ============================================================
    // 赔率：开战即定胜率（闭式结算，运气单侧各掷一次 [0.8,1.2]）
    // ============================================================

    /** 一侧开战底力（无运气）：Σ(兵力×文化×剧本/远征×关隘) × 名将技乘区 */
    private sideBasePower(units: IBattleUnit[]): number {
        let base = 0;
        for (const u of units) {
            const t = Math.max(0, u.troops ?? 0);
            if (t <= 0) continue;
            base += t
                * getUnitCultureCombatMultiplier(u)
                * getCampaignLegionCombatMultiplier(u)
                * getPassGarrisonCombatMultiplier(u);
        }
        // 名将技乘区（该侧第一支可用名将的军团，开局战术 × 战略）
        for (const u of units) {
            if (canUnitUseGeneralSkills(u)) {
                base *= getOpeningTacticalPowerMultiplier(u)
                    * getStrategicBattlePowerMultiplier(u, this.currentBattleType);
                break;
            }
        }
        return base;
    }

    /**
     * 攻方胜率 P(attBase·U1 ≥ defBase·U2)，U~Unif[LUCK_MIN,LUCK_MAX]。
     * 底力比 ≥ 运气最大摆动(H/L=1.5) → 锁定 100%/0%；之间为平滑曲线（数值积分）。
     */
    private computeWinProbability(attBase: number, defBase: number): number {
        if (attBase <= 0) return defBase <= 0 ? 0.5 : 0;
        if (defBase <= 0) return 1;
        const L = GameConfig.COMBAT.LUCK_MIN;
        const H = GameConfig.COMBAT.LUCK_MAX;
        const K = attBase / defBase;
        const N = 400;
        let acc = 0;
        for (let i = 0; i < N; i++) {
            const u1 = L + ((H - L) * (i + 0.5)) / N; // 攻方运气样本
            const x = K * u1;                          // 守方运气需 ≤ x 攻方才胜
            acc += Math.max(0, Math.min(1, (x - L) / (H - L)));
        }
        return acc / N;
    }

    /** 开战算一次胜率并渲染（之后兵力变动不重算，结果开战已定） */
    private computeAndRenderOdds(attUnits: IBattleUnit[], defUnits: IBattleUnit[]): void {
        const attBase = this.sideBasePower(attUnits);
        const defBase = this.sideBasePower(defUnits);
        this.cachedOddsAtt = this.computeWinProbability(attBase, defBase);
        this.renderOdds(this.cachedOddsAtt);
    }

    private renderOdds(winAtt: number): void {
        const att = '#f0a830', def = '#5aacbe';
        let html: string;
        const lockSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: sub; margin-right: 4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
        
        if (winAtt >= 0.995) {
            html = `<span style="color:${att}; font-weight: 900; text-shadow: 0 0 8px rgba(240,168,48,0.5);">${lockSvg} 攻方必胜</span>`;
        } else if (winAtt <= 0.005) {
            html = `<span style="color:${def}; font-weight: 900; text-shadow: 0 0 8px rgba(90,172,190,0.5);">${lockSvg} 守方必胜</span>`;
        } else {
            const a = Math.round(winAtt * 100);
            html = `<span style="color:${att};">胜率 ${a}%</span>`
                + `<span style="opacity:0.55; margin:0 ${uiPx(8)};">:</span>`
                + `<span style="color:${def};">${100 - a}%</span>`;
        }
        this.oddsRow.innerHTML = html;
        this.oddsRow.style.display = 'block';
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

        const attSidePct = attMax > 0 ? Math.max(0, Math.min(100, (attCurrent / attMax) * 100)) : 0;
        const defSidePct = defMax > 0 ? Math.max(0, Math.min(100, (defCurrent / defMax) * 100)) : 0;
        this.leftSideBarFill.style.width = `${attSidePct}%`;
        this.rightSideBarFill.style.width = `${defSidePct}%`;

        const total = attCurrent + defCurrent;
        let attPct = total > 0 ? (attCurrent / total) * 100 : 50;

        this.attackerBar.style.width = `${attPct}%`;
        this.clashEffect.style.left = `calc(${attPct}% - 8px)`;
    }

    private createGeneralNameTag(side: 'left' | 'right'): HTMLDivElement {
        const tag = document.createElement('div');
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
            background: linear-gradient(to bottom, rgba(20, 5, 0, 0.85), rgba(40, 10, 5, 0.85));
            border: 1px solid rgba(220, 160, 60, 0.5);
            border-radius: 4px;
            padding: ${uiPx(14)} ${uiPx(8)};
            box-shadow: 0 4px 15px rgba(0,0,0,0.9);
            text-shadow: 0 2px 4px rgba(0,0,0,1);
            z-index: ${T.zIndex.portrait + 5};
            display: none;
            letter-spacing: 4px;
        `;
        return tag;
    }

    // --- SHARED UTILS ---

    // Priority: ① portrait_config → ② providedDefault → ③ portraitPath（军团/守军已固定）→ ④⑤ GENERAL_PORTRAITS → ⑥ 文化区 → ⑦ default
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
        const setSrc = (url: string) => {
            rememberFacing(url);
            img.addEventListener('load', () => {
                applyFacing();
                applyPortraitAdjustToElement(img, url);
            }, { once: true });
            img.src = url;
            applyFacing();
            applyPortraitAdjustToElement(img, url);
        };

        // ① 场次立绘路径（localStorage / 自选 JSON）
        if (side && this.currentBattleKey) {
            const configPath = this.portraitConfig.getPortrait(this.currentBattleKey, side);
            if (configPath) {
                setSrc(configPath);
                return;
            }
        }
        // ② 事件脚本指定立绘
        if (providedDefault) {
            setSrc(providedDefault);
            return;
        }
        // ③ 军团创建时已固定的立绘（若与攻方相同则跳过，走下方随机逻辑）
        if (unit?.portraitPath) {
            if (!excludePath || !portraitUrlsEqual(unit.portraitPath, excludePath)) {
                setSrc(unit.portraitPath);
                return;
            }
            // 与攻方相同 → 跳过，走下方随机去重
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
        setSrc(portraits['default'] || '/assets/general_default.png');
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
            const fileName = file.name; // e.g., "wangjian.png"
            const portraitPath = `/assets/portraits/${fileName}`;

            this.portraitConfig.setPortrait(this.currentBattleKey, side, portraitPath);

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                if (base64) {
                    const targetImg = this.tempIsLeft ? this.leftPortrait : this.rightPortrait;
                    targetImg.src = base64;
                    this.portraitSourceFacing[side] = resolvePortraitSourceFacing(undefined, portraitPath);
                    this.applyPortraitFacing(side);
                }
            };
            reader.readAsDataURL(file);

            this.portraitConfig.saveToFile().then(ok => {
                if (ok) console.log(`🖼️ [Portrait] Config saved to file`);
            });
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
