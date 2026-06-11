import { Battle, IBattleUnit } from '../core/CombatSystem';
import { BattleField } from '../core/BattleField';
import { SPRITE_PATHS } from '../config/GameConfig';
import {
    getCombatPortraitPath,
    resolvePortraitSourceFacing,
    shouldMirrorPortraitForSide,
    type PortraitSourceFacing,
} from '../config/portrait_defaults';
import { COMBAT_UI_TOKENS, uiPx } from '../config/combat-ui-tokens';
import { PortraitConfigManager } from '../core/PortraitConfigManager';
import { getUnitCultureCombatMultiplier } from '../systems/CultureCombat';
const T = COMBAT_UI_TOKENS;

export class CombatUI {
    private container: HTMLDivElement;
    private leftPortrait!: HTMLImageElement;
    private rightPortrait!: HTMLImageElement;
    /** scaleX 仅在此层；frame 负责进场位移，img 不挂 transform */
    private leftPortraitWrap!: HTMLDivElement;
    private rightPortraitWrap!: HTMLDivElement;
    private leftPortraitFrame!: HTMLDivElement;
    private rightPortraitFrame!: HTMLDivElement;

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

    // Text Elements
    private leftSideLabel!: HTMLDivElement;
    private rightSideLabel!: HTMLDivElement;
    private leftSideNameSpan!: HTMLSpanElement;
    private leftSideTroopsSpan!: HTMLSpanElement;
    private rightSideNameSpan!: HTMLSpanElement;
    private rightSideTroopsSpan!: HTMLSpanElement;
    private leftSideBarFill!: HTMLDivElement;
    private rightSideBarFill!: HTMLDivElement;
    /** 战力系数徽章（野战/城防 × 文化关隘综合系数） */
    private leftMultBadge: HTMLSpanElement | null = null;
    private rightMultBadge: HTMLSpanElement | null = null;
    private battleTitle!: HTMLDivElement;
    private battleYear!: HTMLDivElement;
    private eventDescription!: HTMLDivElement;
    /** 侧栏展示用名称（不含兵力，由 updateStats 拼成「名称: 兵力」） */
    private attackerDisplayName = '';
    private defenderDisplayName = '';
    private attackerFactionId: string | null = null;
    private defenderFactionId: string | null = null;
    private leftFactionNameSpan!: HTMLSpanElement;
    private rightFactionNameSpan!: HTMLSpanElement;

    private skipBtn!: HTMLButtonElement;

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

    constructor() {
        document.querySelectorAll('#combat-ui-panel').forEach((el) => el.remove());
        this.portraitConfig = new PortraitConfigManager();
        this.injectGlobalStyles();
        this.container = this.createContainer();
        this.createElements();
        document.body.appendChild(this.container);
    }

    // [NEW] Inject Keyframes for high-end animations
    private injectGlobalStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&family=Cinzel:wght@700&display=swap');

            @keyframes magma-flow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            @keyframes clash-pulse {
                0% { box-shadow: 0 0 18px rgba(255, 200, 100, 0.7); transform: skewX(-18deg) scale(1); }
                50% { box-shadow: 0 0 32px rgba(255, 250, 200, 1.0), 0 0 48px rgba(255, 120, 40, 0.5); transform: skewX(-18deg) scale(1.15); }
                100% { box-shadow: 0 0 18px rgba(255, 200, 100, 0.7); transform: skewX(-18deg) scale(1); }
            }
            @keyframes text-shimmer {
                0% { text-shadow: 0 0 5px rgba(255,215,0,0.3); }
                50% { text-shadow: 0 0 15px rgba(255,215,0,0.8), 0 0 30px rgba(255,100,0,0.6); }
                100% { text-shadow: 0 0 5px rgba(255,215,0,0.3); }
            }
            @keyframes bar-glow-att {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.15); }
            }
            @keyframes bar-glow-def {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.1); }
            }
            @keyframes title-glow {
                0%, 100% { filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 4px rgba(255,215,0,0.15)); }
                50% { filter: drop-shadow(0 2px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 12px rgba(255,215,0,0.4)); }
            }
            @keyframes troop-pulse {
                0% { transform: scale(1); }
                40% { transform: scale(1.12); }
                100% { transform: scale(1); }
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
            @keyframes gold-line-shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `;
        document.head.appendChild(style);
    }

    private createContainer(): HTMLDivElement {
        const div = document.createElement('div');
        div.id = 'combat-ui-panel';
        div.style.cssText = `
            position: fixed;
            bottom: ${uiPx(40)}; 
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
            background-size: 200% 100%;
            animation: gold-line-shimmer 6s ease-in-out infinite;
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

        const rightFrame = this.createPortraitFrame();
        this.rightPortraitFrame = rightFrame;
        rightFrame.style.right = uiPx(T.portraitInset + T.portraitPullToCenter);
        rightFrame.style.pointerEvents = 'auto';
        this.rightPortraitWrap = this.createPortraitFacingWrap('right');
        this.rightPortrait = this.createPortraitImage();
        this.setupPortraitInteraction(this.rightPortrait, false);
        this.rightPortraitWrap.appendChild(this.rightPortrait);
        rightFrame.appendChild(this.rightPortraitWrap);

        // --- 中栏黑底：椭圆径向 alpha 渐隐（勿 multiply + transparent），HUD 叠在上 ---
        const backdropEdge = uiPx(T.centerBackdropEdge);
        this.centerBackdrop = document.createElement('div');
        this.centerBackdrop.style.cssText = `
            position: absolute;
            left: ${backdropEdge};
            right: ${backdropEdge};
            top: 0;
            bottom: 0;
            z-index: 0;
            pointer-events: none;
            background: ${this.buildCenterBackdropBackground()};
            background-repeat: no-repeat;
            background-size: 100% 100%;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
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
            padding: ${uiPx(18)} ${uiPx(42)} ${uiPx(18)};
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
            animation: title-glow 4s ease-in-out infinite;
            white-space: nowrap;
            text-align: center;
        `;

        // 中央对峙条（攻橙 / 守蓝，参考稿主进度条）
        this.topInfoRow = document.createElement('div');
        this.topInfoRow.style.display = 'none';

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
            animation: bar-glow-def 3s ease-in-out infinite;
        `;

        this.attackerBar = document.createElement('div');
        this.attackerBar.style.cssText = `
            position: absolute;
            top: 0; left: 0; bottom: 0;
            width: 50%;
            background: linear-gradient(90deg, #7a1528 0%, #b04818 30%, #d47020 60%, #f0a830 100%);
            background-size: 200% 100%;
            animation: magma-flow 4s ease infinite, bar-glow-att 2.5s ease-in-out infinite;
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
            animation: clash-pulse 1.8s infinite;
        `;

        this.healthBarContainer.appendChild(this.defenderBar);
        this.healthBarContainer.appendChild(this.attackerBar);
        this.healthBarContainer.appendChild(this.clashEffect);

        // [2026-06-12 美化] 比例条两端「攻/守」字：此前这根条无任何标注，观众不知其义
        const makeBarTag = (text: string, edge: 'left' | 'right') => {
            const tag = document.createElement('span');
            tag.textContent = text;
            tag.style.cssText = `
                position: absolute;
                ${edge}: ${uiPx(8)};
                top: 50%;
                transform: translateY(-50%);
                z-index: 5;
                font-family: 'Noto Serif SC', serif;
                font-size: ${uiPx(13)};
                font-weight: 900;
                color: rgba(255, 248, 230, 0.92);
                text-shadow: 0 1px 3px rgba(0,0,0,0.95);
                letter-spacing: 0;
                pointer-events: none;
            `;
            return tag;
        };
        this.healthBarContainer.appendChild(makeBarTag('攻', 'left'));
        this.healthBarContainer.appendChild(makeBarTag('守', 'right'));

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

        // [NEW] Skip Battle Button (Absolute Positioned, Minimal)
        this.skipBtn = document.createElement('button');
        this.skipBtn.textContent = '跳过 ⏭';
        this.skipBtn.style.cssText = `
            position: absolute;
            bottom: ${uiPx(8)};
            right: 0;
            padding: ${uiPx(4)} ${uiPx(10)};
            background: rgba(0, 0, 0, 0.25);
            border: 1px solid ${T.colors.skipBorder};
            border-radius: 2px;
            color: rgba(216, 200, 160, 0.75);
            font-family: 'Noto Serif SC', serif;
            font-size: ${uiPx(T.typography.skipSize)};
            cursor: pointer;
            letter-spacing: 1px;
            transition: color 0.2s, border-color 0.2s, background 0.2s;
            z-index: 100;
        `;

        this.skipBtn.onmouseover = () => {
            this.skipBtn.style.color = '#fff';
            this.skipBtn.style.textShadow = '0 0 8px rgba(255, 215, 0, 0.6)';
        };
        this.skipBtn.onmouseout = () => {
            this.skipBtn.style.color = 'rgba(216, 200, 160, 0.5)';
            this.skipBtn.style.textShadow = 'none';
        };
        // Removed mousedown/mouseup scale transform for minimal link style
        this.skipBtn.onclick = () => {
            console.log('⏩ [CombatUI] Skip Battle clicked');
            const game = (window as any).game;
            if (game && game.combatSystem) {
                game.combatSystem.forceResolveAll();
            }
        };

        this.bottomInfoRow = document.createElement('div');
        this.bottomInfoRow.style.display = 'none';

        this.centerPanel.appendChild(this.battleYear);
        this.centerPanel.appendChild(this.battleTitle);
        this.centerPanel.appendChild(this.healthBarContainer);
        this.centerPanel.appendChild(this.sideStatsRow);
        this.centerPanel.appendChild(this.eventDescription);
        this.centerPanel.appendChild(this.skipBtn);

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

    /** 侧栏势力名称（位于「军团名: 兵力」之上） */
    private createFactionRow(side: 'attacker' | 'defender'): HTMLDivElement {
        const isAtt = side === 'attacker';
        const row = document.createElement('div');
        row.style.cssText = `
            width: 100%;
            margin-bottom: ${uiPx(6)};
            text-align: ${isAtt ? 'right' : 'left'};
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
        `;

        row.appendChild(nameSpan);

        if (isAtt) {
            this.leftFactionNameSpan = nameSpan;
        } else {
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
        label.style.alignItems = 'baseline';
        label.style.justifyContent = isAtt ? 'flex-start' : 'flex-end';
        label.style.flexWrap = 'nowrap';
        label.style.width = '100%';
        label.style.maxWidth = '100%';
        label.style.overflow = 'visible';

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = `
            overflow: visible;
            white-space: nowrap;
            flex-shrink: 1;
            min-width: 0;
            max-width: ${T.sideBar.maxDisplayNameCh + T.sideBar.maxNameSuffixCh}ch;
            color: ${isAtt ? T.colors.attackerName : T.colors.defenderName};
        `;

        const colonSpan = document.createElement('span');
        colonSpan.textContent = ': ';
        colonSpan.style.cssText = `
            color: rgba(255,255,255,0.85);
            flex-shrink: 0;
        `;

        const troopsSpan = document.createElement('span');
        troopsSpan.style.cssText = `
            color: rgba(255,255,255,0.92);
            font-weight: 700;
            flex-shrink: 0;
            min-width: ${T.sideBar.troopsMinCh}ch;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
            text-align: right;
            letter-spacing: 0.02em;
        `;

        // [2026-06-12 美化] 战力系数徽章：把后台的文化攻防/关隘加成晒给观众
        // （无解说直播里这是"为什么少打多能赢"的唯一解释渠道）
        const multBadge = document.createElement('span');
        multBadge.style.cssText = `
            flex-shrink: 0;
            margin-left: ${uiPx(8)};
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
        label.appendChild(colonSpan);
        label.appendChild(troopsSpan);
        label.appendChild(multBadge);
        return label;
    }

    /**
     * 战力系数徽章：野战/城防 × 综合系数（文化五级 × 关隘，同 CultureCombat 结算口径）。
     * 双方都常显——「野战×1.2 vs 城防×1.32」本身就是战斗解说。
     */
    private updateMultiplierBadges(attacker: IBattleUnit | null, defender: IBattleUnit | null): void {
        const apply = (badge: HTMLSpanElement | null, unit: IBattleUnit | null) => {
            if (!badge) return;
            if (!unit) {
                badge.style.display = 'none';
                return;
            }
            const isGarrison = unit.unitType === 'city';
            const mult = getUnitCultureCombatMultiplier(unit);
            const value = parseFloat(mult.toFixed(2));
            badge.textContent = `${isGarrison ? '城防' : '野战'}×${value}`;
            badge.style.display = 'inline-block';
        };
        apply(this.leftMultBadge, attacker);
        apply(this.rightMultBadge, defender);
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
        nameEl.textContent = name;
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
        const fx = T.portraitCornerFadeX;
        const fy = T.portraitCornerFadeY;
        const cornerMask = [
            `radial-gradient(ellipse ${fx}% ${fy}% at 0% 100%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)`,
            `radial-gradient(ellipse ${fx}% ${fy}% at 100% 100%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)`,
            'linear-gradient(#000 0 0)',
        ].join(', ');
        wrap.style.cssText = `
            position: absolute;
            bottom: 0;
            ${edge}: ${uiPx(-T.portraitImageOffset)};
            height: 100%;
            display: flex;
            align-items: flex-end;
            ${side === 'right' ? 'justify-content: flex-end;' : ''}
            transform-origin: center bottom;
            pointer-events: none;
            -webkit-mask-image: ${cornerMask};
            mask-image: ${cornerMask};
            -webkit-mask-composite: source-over, source-over;
            mask-composite: add, add;
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
        this.isVisible = true;
        this.attackerFactionId = battle.attacker.factionId;
        this.defenderFactionId = battle.defender.factionId;
        this.updateMultiplierBadges(battle.attacker, battle.defender);
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
        this.lastTimeScale = Math.max(0.1, timeScale);
        this.isVisible = true;

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
        const attName = attacker.name + (attackers.length > 1 ? ` +${attackers.length - 1}` : '');
        const defName = (defender.unitType === 'city' ? `${defender.name}守军` : defender.name) + (defenders.length > 1 ? ` +${defenders.length - 1}` : '');

        this.attackerFactionId = attacker.factionId;
        this.defenderFactionId = defender.factionId;
        this.currentBattleKey = this.buildPortraitConfigKey(displayTitle, attacker, defender);

        this.updateMultiplierBadges(attacker, defender);
        this.updateInfoDirect(attName, defName, displayTitle, displayYear, description);

        this.setPortrait(this.leftPortrait, attacker, attacker.generalId, attacker.factionId, attackerPortrait, 'attacker');
        this.setPortrait(this.rightPortrait, defender, defender.generalId, defender.factionId, defenderPortrait, 'defender');

        this.updateStats();
        this.container.style.animation = 'panel-entrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        this.playPortraitEntrance();
    }

    public isRegionalVisible(): boolean {
        return this.isVisible && this.currentRegionalUnits !== null;
    }

    public isBoundToBattleField(battleField: BattleField): boolean {
        return this.isRegionalVisible() && this.boundRegionalBattleField === battleField;
    }

    public hide() {
        this.clearRegionalTimers();
        this.isVisible = false;
        this.currentBattle = null;
        this.currentRegionalUnits = null;
        this.boundRegionalBattleField = null;
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
        this.attackerDisplayName = att.name;
        this.defenderDisplayName = def.unitType === 'city' ? `${def.name}守军` : def.name;
        this.attackerFactionId = att.factionId;
        this.defenderFactionId = def.factionId;
        this.battleTitle.textContent = title;
        this.battleYear.textContent = year;
        this.battleYear.style.display = year ? 'block' : 'none';

        this.currentBattleKey = title || `battle_${Date.now()}`;
        this.setPortrait(this.leftPortrait, att, att.generalId, att.factionId, undefined, 'attacker');
        this.setPortrait(this.rightPortrait, def, def.generalId, def.factionId, undefined, 'defender');
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

        const attSidePct = attMax > 0 ? Math.max(0, Math.min(100, (attCurrent / attMax) * 100)) : 0;
        const defSidePct = defMax > 0 ? Math.max(0, Math.min(100, (defCurrent / defMax) * 100)) : 0;
        this.leftSideBarFill.style.width = `${attSidePct}%`;
        this.rightSideBarFill.style.width = `${defSidePct}%`;

        const total = attCurrent + defCurrent;
        let attPct = total > 0 ? (attCurrent / total) * 100 : 50;

        this.attackerBar.style.width = `${attPct}%`;
        this.clashEffect.style.left = `calc(${attPct}% - 8px)`;
    }

    // --- SHARED UTILS ---

    // Priority: ① portrait_config → ② providedDefault → ③④ GENERAL_PORTRAITS（将领/势力）→ ⑤ 文化区 → ⑥ default
    private setPortrait(
        img: HTMLImageElement,
        unit: IBattleUnit | undefined,
        generalId?: string,
        factionId?: string | null,
        providedDefault?: string,
        side?: 'attacker' | 'defender',
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
            img.addEventListener('load', applyFacing, { once: true });
            img.src = url;
            applyFacing();
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
        const portraits = (SPRITE_PATHS.GENERAL_PORTRAITS || {}) as Record<string, string>;
        // ③ 将领 ID（如 baiqi）
        if (generalId && portraits[generalId]) {
            setSrc(portraits[generalId]);
            return;
        }
        // ④ 势力默认（秦国 qin → qinjiang.png）
        if (factionId && portraits[factionId]) {
            setSrc(portraits[factionId]);
            return;
        }
        // ⑤ 文化区军队/守军 + panjun
        if (unit) {
            setSrc(getCombatPortraitPath(unit));
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
