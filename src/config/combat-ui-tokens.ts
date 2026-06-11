/**
 * 战斗 VS 面板 Design Tokens
 * 与 Figma「MAPWAR Combat UI」CombatPanel / Regional 对齐
 * @see docs/combat-ui-figma.md
 */
export const COMBAT_UI_SCALE = 0.7;

export const uiPx = (n: number): string => `${Math.round(n * COMBAT_UI_SCALE)}px`;

export const COMBAT_UI_TOKENS = {
    /** 战斗条设计宽；屏幕宽 = uiPx(panelWidth) ≈ 1190px（勿直接填 1190） */
    panelWidth: 1700,
    panelHeight: 360,
    portraitSlotWidth: 380,
    /** 黑底条距容器左右边距（越小条越宽） */
    centerBackdropEdge: 16,
    /** 黑底径向渐隐椭圆半径（%）；越小四边越易透出地图 */
    centerFadeEllipseX: 88,
    centerFadeEllipseY: 96,
    /** 径向渐隐色标（%，从中心向外）
     *  [2026-06-12 美化] 内/中色标外推：文字核心区（势力名/军团名/数字）下必须是实底，
     *  此前地图标签（朝歌 4081 等）穿透叠在战报文字上。立绘区边缘仍保持渐隐透出地图。 */
    centerFadeStopInner: 30,
    centerFadeStopMid: 58,
    centerFadeStopOuter: 84,
    /** 中央对峙血条最大宽度（设计 px）；屏宽 ≈ uiPx(本值)。略伸入立绘槽底缘以铺满中栏黑底 */
    clashBarTrackWidth: 1280,
    centerMargin: 400,
    portraitBottom: -50,
    portraitInset: 12,
    /** 立绘槽向中栏轻推，使身体叠在黑底前缘上 */
    portraitPullToCenter: 36,
    portraitImageOffset: 20,
    /** 立绘左下/右下水印渐隐（椭圆半径%，相对立绘槽） */
    portraitCornerFadeX: 48,
    portraitCornerFadeY: 30,
    /**
     * 立绘横占宽度（设计 px）= inset + slot + pull ≈ 428 → 屏 300px。
     * 军团信息区须落在此线以右（左）/以左（右），否则被立绘遮挡。
     */
    portraitHorizontalReserve:
        12 + 380 + 36, // keep in sync with portraitInset + portraitSlotWidth + portraitPullToCenter

    colors: {
        attackerGold: '#FDB931',
        attackerName: '#f5e6c8',
        attackerTroopGlow: 'rgba(253, 80, 50, 0.35)',
        defenderJade: '#5A9AAA',
        defenderName: '#d8eaf0',
        defenderTroopGlow: 'rgba(76, 161, 175, 0.45)',
        hudCenterBg: 'rgba(10, 12, 18, 0.55)',
        hudCenterBorder: 'rgba(255, 255, 255, 0.06)',
        titleGradientTop: '#f5f0e6',
        titleGradientBottom: '#b8a88a',
        sideHudBg: 'rgba(6, 8, 12, 0.92)',
        skipBorder: 'rgba(212, 160, 80, 0.35)',
        panelBorderGold: 'rgba(212, 170, 60, 0.5)',
        panelBorderGoldFaint: 'rgba(212, 170, 60, 0.15)',
        portraitGlowAttacker: 'rgba(253, 185, 49, 0.35)',
        portraitGlowDefender: 'rgba(90, 154, 170, 0.35)',
    },

    typography: {
        titleSize: 48,
        yearSize: 22,
        /** 纪年副标题：浅色字 + 深描边，叠在地图上不依赖旗面色 */
        yearColor: '#f5e8c8',
        legionNameSize: 26,
        troopsSize: 32,
        skipSize: 15,
        descriptionSize: 14,
    },

    clashBar: {
        height: 36,
        clipPx: 14,
        clashWidth: 6,
    },

    /** 左右侧栏「军团名: 兵力」+ 小血条；以中线为界各占一半 */
    sideBar: {
        /** 小血条高度（设计 px） */
        height: 18,
        iconSize: 32,
        /** 中线两侧列间距（设计 px） */
        centerSplitGap: 24,
        /** 两势力之间的交叉剑图标（设计 px） */
        centerVsIconSize: 56,
        /**
         * 侧栏字号（设计 px）。半宽 ≈ (1190-600)/2 ≈ 295 屏 px；
         * 8 字名 + 冒号 + 8ch 兵力 ≈ 17ch × 10px ≈ 170px，可贴中线对齐。
         */
        labelSize: 28,
        maxDisplayNameCh: 8,
        maxNameSuffixCh: 5,
        /** 十万 → "100,000" 7 字符，固定 8ch 防抖动 */
        troopsMinCh: 8,
        /** 侧栏势力名称字号（设计 px）；略大于军团名 labelSize */
        factionNameSize: 30,
    },

    zIndex: {
        panel: 9000,
        centerCard: 1,
        portrait: 100,
    },
} as const;

export const COMBAT_FIGMA_FILE_URL =
    'https://www.figma.com/design/CuNa1HgmyH0rnFLRppmP0n/MAPWAR-Combat-UI';
