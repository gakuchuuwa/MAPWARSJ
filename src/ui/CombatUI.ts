import { getFactionGeneral, getGeneralRecordByGeneralId, setGeneralPortraitOverride } from '../data/FactionGenerals';
import { registerPortraitPathRuntime } from '../config/portrait_defaults';
import { Battle, IBattleUnit } from '../core/CombatSystem';
import { BattleField } from '../core/BattleField';
import { SPRITE_PATHS, GameConfig } from '../config/GameConfig';
import {
    BATTLE_PORTRAIT_FALLBACK,
    getCombatPortraitPath,
    getRandomRegionPortraitPath,
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
import { COMBAT_UI_TOKENS, uiPx } from '../config/combat-ui-tokens';
import { PortraitConfigManager } from '../core/PortraitConfigManager';
import { getUnitCultureCombatMultiplier, getCampaignLegionCombatMultiplier, getCultureOnlyCombatMultiplier, getPassGarrisonCombatMultiplier } from '../systems/CultureCombat';
import type { LandTerrainKind } from '../world/land-sea';
import {
    getOpeningTacticalPowerMultiplier,
    getStrategicBattlePowerMultiplier,
    getGeneralSkillDisplayTags,
    getPassGarrisonDefenseSkillDisplay,
    getReinforcementJoinSkillDisplay,
    getExpeditionForageSkillDisplay,
    canUnitUseGeneralSkills,
    getBattleTerrainKind,
} from '../combat/GeneralSkillCombat';
import { PASS_GARRISON_DEFENSE_SKILL, REINFORCEMENT_JOIN_SKILL, getGeneralProfile } from '../data/GeneralSkills';
import { readSiegeGarrisonEliteName } from '../combat/SiegeGarrisonTier';
import type { Army } from '../legion/Army';
const T = COMBAT_UI_TOKENS;

/** 战报技能条/系数链：精锐或远征 ×1.2 用番号专名作标签（去「军团」等尾缀） */
function getLegionEliteBadgeName(unit: IBattleUnit): string {
    if (unit.unitType === 'city') {
        const eliteName = readSiegeGarrisonEliteName(unit.getEntity?.());
        if (eliteName) return eliteName;
    }
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
        this.leftSkillsBox.style.cssText = `display: flex; gap: ${uiPx(4)}; flex-wrap: nowrap;`;
        this.rightSkillsBox = document.createElement('div');
        this.rightSkillsBox.style.cssText = `display: flex; gap: ${uiPx(4)}; flex-wrap: nowrap;`;
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
            animation: clash-pulse 1.2s infinite ease-in-out;
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
        if (u.unitType === 'legion' || u.unitType === 'army') score += 10_000;
        if (u.generalId && getGeneralProfile(u.generalId)) score += 1_000;
        const army = u.getEntity?.() as Army | undefined;
        if (army?.isElite) score += 500;
        if (u.unitType === 'city' && readSiegeGarrisonEliteName(u.getEntity?.())) score += 500;
        score += Math.min(Math.max(0, u.troops) / 1000, 99);
        return score;
    }

    private updateSkillBadges(attacker: IBattleUnit | null, defender: IBattleUnit | null): void {
        this.leftSkillsBox.innerHTML = '';
        this.rightSkillsBox.innerHTML = '';

        const createSkillTag = (name: string, effect: string, isFamous: boolean, isAttacker: boolean) => {
            const tag = document.createElement('div');
            const borderColor = isFamous ? 'rgba(255, 215, 0, 0.7)' : 'rgba(200, 200, 200, 0.6)';
            
            // 加入攻守阵营颜色区分：攻方带红色调，守方带蓝色调
            let bgColor = '';
            if (isAttacker) {
                bgColor = isFamous ? 'rgba(80, 20, 0, 0.85)' : 'rgba(50, 15, 0, 0.8)';
            } else {
                bgColor = isFamous ? 'rgba(10, 40, 70, 0.85)' : 'rgba(10, 25, 45, 0.8)';
            }
            const sideColor = isAttacker ? '#ff8800' : '#00aabb'; // 攻橙 守蓝

            tag.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 0 0 ${uiPx(98)};
                width: ${uiPx(98)};
                box-sizing: border-box;
                background: ${bgColor};
                border: 1px solid ${borderColor};
                border-bottom: 2px solid ${sideColor};
                border-radius: 4px;
                padding: ${uiPx(4)} ${uiPx(3)};
                box-shadow: 0 2px 6px rgba(0,0,0,0.85);
                overflow: hidden;
            `;
            
            const nameEl = document.createElement('div');
            nameEl.style.cssText = `
                font-family: 'Noto Serif SC', serif;
                font-size: ${uiPx(16)};
                font-weight: 900;
                color: #fff8e0;
                letter-spacing: 1px;
                margin-bottom: ${uiPx(2)};
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
            effectEl.textContent = effect;
            
            tag.appendChild(nameEl);
            tag.appendChild(effectEl);
            return tag;
        };

        const renderSide = (box: HTMLDivElement, unit: IBattleUnit | null, isAttacker: boolean) => {
            if (!unit) return;
            const pending: HTMLDivElement[] = [];
            const add = (name: string, effect: string, famous: boolean) => {
                if (pending.length < 4) pending.push(createSkillTag(name, effect, famous, isAttacker));
            };

            const passSkill = getPassGarrisonDefenseSkillDisplay(unit);
            if (passSkill) add(passSkill.name, passSkill.effectLabel, false);

            const joinLuck = this.boundRegionalBattleField?.getReinforcementJoinLuck(unit.id) ?? null;
            const reinfSkill = getReinforcementJoinSkillDisplay(joinLuck);
            if (reinfSkill) add(reinfSkill.name, reinfSkill.effectLabel, false);

            const forageSkill = getExpeditionForageSkillDisplay(unit);
            if (forageSkill) add(forageSkill.name, forageSkill.effectLabel, true);

            if (unit.generalId) {
                for (const tag of getGeneralSkillDisplayTags(unit)) {
                    add(tag.name, tag.effectLabel, tag.isFamous);
                }
            }

            const legionMult = getCampaignLegionCombatMultiplier(unit);
            if (Math.abs(legionMult - 1) > 0.001) {
                add(getLegionEliteBadgeName(unit), `×${parseFloat(legionMult.toFixed(2))}`, true);
            }

            for (const tag of pending) box.appendChild(tag);
        };
        renderSide(this.leftSkillsBox, attacker, true);
        renderSide(this.rightSkillsBox, defender, false);
    }

    private getReinforcementJoinLuckForUnit(unit: IBattleUnit): number | null {
        return this.boundRegionalBattleField?.getReinforcementJoinLuck(unit.id) ?? null;
    }

    private getBattleTerrainForUi(): LandTerrainKind | null {
        if (!this.boundRegionalBattleField) return null;
        const units = [
            ...this.boundRegionalBattleField.getAttackerUnits(),
            ...this.boundRegionalBattleField.getDefenderUnits(),
        ];
        return getBattleTerrainKind(units, this.boundRegionalBattleField.type);
    }

    private formatBattlePowerBadge(unit: IBattleUnit): string {
        const isGarrison = unit.unitType === 'city';
        const battleType = this.boundRegionalBattleField?.type ?? this.currentBattleType;
        const terrain = this.getBattleTerrainForUi();
        const role = isGarrison ? '城防' : battleType === 'siege' ? '攻城' : '野战';
        
        let product = 1;
        product *= getUnitCultureCombatMultiplier(unit);
        product *= getCampaignLegionCombatMultiplier(unit);
        product *= getOpeningTacticalPowerMultiplier(unit);
        product *= getStrategicBattlePowerMultiplier(unit, battleType, terrain);
        const joinLuck = this.getReinforcementJoinLuckForUnit(unit);
        if (joinLuck !== null) product *= joinLuck;
        
        if (Math.abs(product - 1) <= 0.001) return `${role}×1`;
        return `${role}×${parseFloat(product.toFixed(2))}`;
    }

    private formatBattlePowerFactorChain(unit: IBattleUnit): { chain: string; title: string } {
        const isGarrison = unit.unitType === 'city';
        const battleType = this.boundRegionalBattleField?.type ?? this.currentBattleType;
        const terrain = this.getBattleTerrainForUi();
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
        pushIfNotOne('战略', getStrategicBattlePowerMultiplier(unit, battleType, terrain));
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

        const attacker = this.pickPrimaryDisplayUnit(attackers) ?? attackers[0];
        const defender = this.pickPrimaryDisplayUnit(defenders) ?? defenders[0];

        const attName = this.buildWaveGroupedSideName(attackers);
        const defName = this.buildWaveGroupedSideName(defenders);

        this.attackerFactionId = attacker.factionId;
        this.defenderFactionId = defender.factionId;
        this.currentBattleKey = this.buildPortraitConfigKey(displayTitle, attacker, defender);

        this.updateMultiplierBadges(attacker, defender);
        this.updateSkillBadges(attacker, defender);
        this.updateInfoDirect(attName, defName, displayTitle, displayYear, description);

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

    /** 援军编入后刷新参战列表与侧栏（不重复播入场动画） */
    public syncRegionalParticipantsFromBattleField(battleField: BattleField): void {
        if (!this.isBoundToBattleField(battleField) || battleField.isOver) return;

        const attackers = battleField.getAttackerUnits();
        const defenders = battleField.getDefenderUnits();
        if (attackers.length === 0 || defenders.length === 0) return;

        this.currentRegionalUnits = { attackers, defenders };

        this.attackerDisplayName = this.buildWaveGroupedSideName(attackers);
        this.defenderDisplayName = this.buildWaveGroupedSideName(defenders);

        const attPrimary = this.pickPrimaryDisplayUnit(attackers) ?? attackers[0];
        const defPrimary = this.pickPrimaryDisplayUnit(defenders) ?? defenders[0];

        this.updateMultiplierBadges(attPrimary, defPrimary);
        this.updateSkillBadges(attPrimary, defPrimary);
        this.setPortrait(this.leftPortrait, attPrimary, attPrimary.generalId, attPrimary.factionId, attPrimary.portraitPath, 'attacker');
        this.setPortrait(
            this.rightPortrait,
            defPrimary,
            defPrimary.generalId,
            defPrimary.factionId,
            defPrimary.portraitPath,
            'defender',
            this.leftPortrait.src || undefined,
        );
        this.updateGeneralNameTags(attPrimary, defPrimary);
        this.refreshRegionalSafetyDeadline();
        this.updateStats();
    }

    private buildWaveGroupedSideName(units: IBattleUnit[]): string {
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
                const garrisonElite = u.unitType === 'city' ? readSiegeGarrisonEliteName(u.getEntity?.()) : undefined;
                if (garrisonElite) {
                    html += `<span style="opacity:${dim}; font-size:${size}; white-space: nowrap;">${garrisonElite}</span>`;
                    continue;
                }
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
     * 存盘 key：按立绘「自身路径」存（每个将领独立一格），不再归并到 canonical 代表路径。
     * 归并代表路径会让内容相同的不同将领共用一格、互相覆盖（「调好又恢复」），见
     * claudedocs/立绘调校问题解决方案.md。读取侧 resolvePortraitAdjust 自身路径优先、canonical 兜底。
     * 待绑定图用 destPath（最终落盘路径）。
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
        this.rightPortraitFrame.style.outline = '';
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
        const on = '3px solid #f5d78e';
        this.leftPortraitFrame.style.outline = this.correctorSide === 'attacker' ? on : '';
        this.rightPortraitFrame.style.outline = this.correctorSide === 'defender' ? on : '';
    }

    private buildCrosshair(): HTMLDivElement {
        const ch = document.createElement('div');
        ch.className = 'pt-crosshair';
        ch.innerHTML = '<div class="ch-face"></div><div class="ch-eye"></div><div class="ch-chin"></div><div class="ch-waist"></div><div class="ch-mid"></div>';
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
            const eyePct = (g.eyeLineY * 100).toFixed(1);
            const chinPct = (g.chinLineY * 100).toFixed(1);
            const waistPct = (g.waistLineY * 100).toFixed(1);
            const chestPct = (g.chestLineX * 100).toFixed(1);
            const ovalW = g.ovalW * 100;
            const ovalH = g.ovalH * 100;
            const ovalCx = g.ovalCx * 100;
            const ovalCy = g.ovalCy * 100;
            const chFace = ch.querySelector('.ch-face') as HTMLElement | null;
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
            const res = await fetch('/api/portrait-adjust');
            const disk: PortraitAdjustData = res.ok ? await res.json() : structuredClone(DEFAULT_PORTRAIT_ADJUST);
            disk.images = disk.images ?? {};
            for (const path of this.correctorDirtyPaths) {
                const adj = this.correctorData.images?.[path];
                if (adj) disk.images[path] = { ...adj };
            }
            const save = await fetch('/api/save-portrait-adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // autoTrigger 时附带 backup:true，让服务端额外存一份带时间戳的备份
                body: JSON.stringify(autoTrigger ? { ...disk, backup: true } : disk),
            });
            if (!save.ok) throw new Error(`HTTP ${save.status}`);
            const result = await save.json() as { ok: boolean; error?: string; backupFile?: string };
            if (!result.ok) throw new Error(result.error || '保存失败');
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

    /** 一侧开战底力（无运气）：Σ(兵力×文化×远征×关隘) × 名将技乘区 */
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
        const terrain = this.getBattleTerrainForUi();
        for (const u of units) {
            if (canUnitUseGeneralSkills(u)) {
                base *= getOpeningTacticalPowerMultiplier(u)
                    * getStrategicBattlePowerMultiplier(u, this.currentBattleType, terrain);
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
        this.oddsRow.style.display = 'none';
        this.oddsRow.innerHTML = '';
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
        this.updateSkillBadges(
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
        const rec = unit.generalId ? getGeneralRecordByGeneralId(unit.generalId) : null;
        if (rec) {
            tag.textContent = rec.generalName;
            tag.style.display = 'block';
            tag.dataset.generalId = unit.generalId!;
        } else {
            tag.textContent = '';
            tag.style.display = 'none';
            delete tag.dataset.generalId;
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
            background: linear-gradient(to bottom, rgba(20, 5, 0, 0.85), rgba(40, 10, 5, 0.85));
            border: 1px solid rgba(220, 160, 60, 0.5);
            border-radius: 4px;
            padding: ${uiPx(14)} ${uiPx(8)};
            box-shadow: 0 4px 15px rgba(0,0,0,0.9);
            text-shadow: 0 2px 4px rgba(0,0,0,1);
            z-index: ${T.zIndex.portrait + 5};
            display: none;
            pointer-events: none;
            letter-spacing: 4px;
        `;
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
