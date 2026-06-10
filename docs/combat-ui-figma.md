# 战斗界面 Figma 设计

## 文件

- **Figma**：[MAPWAR Combat UI](https://www.figma.com/design/CuNa1HgmyH0rnFLRppmP0n)
- **代码**：[`src/ui/CombatUI.ts`](../src/ui/CombatUI.ts)
- **Tokens**：[`src/config/combat-ui-tokens.ts`](../src/config/combat-ui-tokens.ts)

## 页面结构

| 页面 | 内容 |
|------|------|
| Reference | `Reference / v0-Current` — 游戏截图对照 |
| Combat / 区域冲突 | `CombatPanel / Regional` 组件 + `Spec / CombatPanel v1` 标注 |

## 组件层级（与代码 DOM 对应）

```
CombatPanel / Regional
├── PortraitSlot-L + SideHud-Attacker
├── CenterCard
│   ├── Accent / GoldLine   ← 仅中栏，不跨立绘
│   ├── BattleTitle
│   ├── ClashBar
│   └── SkipButton
└── PortraitSlot-R + SideHud-Defender
```

## Safe Zone 规则

- **顶金线、边框、半透明底**：只在 `CenterCard`（代码里 `centerPanel`）
- **左右立绘区**：无顶横线；`z-index: 20` 保证立绘在装饰层之上
- 立绘素材：29 张 PNG，见 [`portrait_defaults.ts`](../src/config/portrait_defaults.ts)
- **对峙镜像**：`scaleX` 只在 wrap 层；全库 PNG 朝右 → 左攻不镜像、右守镜像（`portrait_defaults.ts`）。`portrait_config.json` 仅手动导入或 localStorage。

## 尺寸（scale 0.7 后像素）

| Token | 设计稿 | 运行时 |
|-------|--------|--------|
| panelWidth | 1700 | 1190px |
| panelHeight | 300 | 210px |
| portraitSlotWidth | 380 | 266px |
| centerMargin | 400 | 280px each side |
| clashBarTrackWidth | 1200 | 840px |

**黑底渐隐（代码）**：`centerBackdrop` 使用单层 `radial-gradient` + 真 alpha 停点；勿用 `background-blend-mode: multiply` 搭配 `transparent`（边缘会呈实黑、看不见地图）。

## 评审清单（你在 Figma 里可改）

- [ ] 标题字体/字距是否够「史诗感」（代码用 Noto Serif SC）
- [ ] 对峙条渐变与交锋线亮度
- [ ] SideHud 金/蓝边条粗细
- [ ] 跳过按钮位置与点击区域
- [ ] 确认金线**不进入**左右 Safe Zone

改完 Figma 后，把 Inspect 数值同步到 `combat-ui-tokens.ts`，必要时再调 `CombatUI.ts`。
