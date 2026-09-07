> # 🔴 铁律 · 兵种归属只看「子分类 + 文化区挨不挨着」
>
> 判断一个兵种能不能进某支军团，**只看两条**：
>
> 1. **兵种子分类对不对** —— 近战骑兵 / 弓骑兵 / 枪骑兵 / 步弓手 / 重步兵 / 攻城器…
>    要补的是哪一类，就从那一类里挑。
> 2. **文化区在地理上挨着** —— 这个兵的本源文化区，和要用它的文化区，别隔太远。挨着就行，不必同族。
>
> 兵种 id 里的民族词（女真 / 波兰 / 越南 / 图皮 / 库曼…）、中文兵名、`age` 时代标签，**都不是判据**。
> 那是《帝国时代 2 DE》的出处标签，不是本作里这个兵属于谁。
>
> **正例**：铁浮屠是**近战骑兵**、本源**东北** → 朝鲜、北方、草原、契丹、女真、西夏、蒙古**都能用**。
> 　　　　西辽挨着蒙古、离女真远 → 西辽 4 档用**怯薛军**比铁浮屠更合适。
> **反例**：图皮黑木弓箭手（南美）给阿伊努（北海道）—— 子分类虽同是步弓，但隔着太平洋，**太远，不行**。
>
> **禁止**：只因为兵名里带别族的民族词，就说「跨国乱炖 / 不符合历史」。这条已被主人当场抓过三次：
> - 「契丹军团用女真铁浮屠 = 乱炖」→ **错**，同是东北近战骑兵，文化区挨着。
> - 「库曼钦察弓骑不该给东北民族」→ **错**。
> - 「捷克军团 4 档是波兰奥布奇战锤兵 = 乱炖」→ **错**，波兰捷克接壤。
>
> 另一条同级铁律：**别人（主人 / 其他 AI）已经做好的编制，不许擅自改。**
> 只有改动前就是红的（格位不符阵型 / 兵种不存在 / 象攻城违规 / 战力离群）才准动，其余一律先问。
> 自动闸门：`npm run legion:no-unjustified-edits`（已挂 PostToolUse 钩子，改完自动拦）。

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
