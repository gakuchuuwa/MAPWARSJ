> # 🔴 铁律 · 兵种只认素材样貌，不认兵名
>
> 判断一个兵种能不能进某支军团，**只看 `public/SUCAI/` 里的素材长什么样**——甲胄形制、武器、马匹、旗号。
>
> 兵种 id 里的民族词（女真 / 波兰 / 越南 / 图皮 / 库曼…）、中文兵名、`age` 时代标签，**全都不算数**。
> 那是《帝国时代 2 DE》的出处标签，不是本作里这个兵属于谁。
>
> 反面教材（都被主人当场抓过）：
> - 「契丹军团用女真铁浮屠精锐 = 乱炖」→ **错**。契丹有铁林军重甲骑兵，那副具装甲骑的样貌本来就对。
> - 「库曼钦察弓骑不该给东北民族」→ **错**。那个素材的样貌和东北人本来就像。
> - 「捷克军团 4 档是波兰奥布奇战锤兵 = 乱炖」→ **错**。胡斯军本来就用连枷 / 战锤。
>
> **没裁图看过素材，就不许下「不符合历史 / 跨国乱炖 / 时代不对」的结论。**
> 裁图工具：`scratch/tools_sprite_sheet.py`。判据优先级：**样貌 → 兵种类型 → 时代 → 名字**。

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
