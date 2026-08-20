# 给 DS 的指令：norse_warrior 方向映射，重跑后仍然是错的

> **本文件**：`C:\MAPWARSJ\claudedocs\ds-norse-direction-20260820.md`
> **配图（必看）**：`C:\MAPWARSJ\claudedocs\norse-dir-move-compare-20260820.png`
> —— 三兵种 MOVE 首帧、同一方向索引并排，看 `dir3` 那一列。

## 0. 相关路径一览（全部实测存在）

| 用途 | 路径 |
|---|---|
| 出问题的素材目录 | `C:\MAPWARSJ\public\SUCAI\NORSE_WARRIOR\` |
| 对照组素材（正确） | `C:\MAPWARSJ\public\SUCAI\ELITEBERSERK\` |
| 对照组素材（正确） | `C:\MAPWARSJ\public\SUCAI\ELITETHROWINGAXEMAN\` |
| 提取脚本 | `C:\MAPWARSJ\scratch\aoe2de_unit_convert.py` |
| └ 方向映射常量（第 29 行） | `GAME_DIR_TO_DE_ANGLE = [14, 0, 2, 4, 6, 8, 10, 12]` |
| └ SLD 源目录（第 25 行） | `C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common\drs\graphics` |
| 帧数声明表（错误来源） | `C:\MAPWARSJ\scratch\extract_queue.json` |
| 素材路径声明 | `C:\MAPWARSJ\src\config\UnitAssets.ts`（`norse_warrior` 条目） |
| 军团编成 | `C:\MAPWARSJ\src\data\FactionCompositions.ts` 的 `luosi`（约 1532 行） |
| 渲染层（单兵朝向） | `C:\MAPWARSJ\src\map\legion\LegionPhalanxDrawer.ts:1160` `effDir = squadDirections?.[i] ?? direction` |
| 渲染层（整军朝向） | `C:\MAPWARSJ\src\map\GlobalUnitRenderer.ts:2069` 非 13 时 `squadInfo = null` |

## 一、现状：你的修复没有解决问题

`public/SUCAI/NORSE_WARRIOR/` 的 move 已经重跑成 60 帧（文件时间 12:12，`_meta.json` 里 `move.frames=60`）。
**重跑之后，朝向依然和其他兵种对不上。**

实测证据（磁盘素材直接截首帧，三兵种同一方向索引并排，见配图）：

| 方向索引 | 诺斯狂暴战士 (norse_warrior) | 维京狂战士精锐 (elite_berserk) | 掷斧兵精锐 (elite_throwing_axeman) |
|---|---|---|---|
| **dir3** | **背对观众** | 正面朝观众 | 正面朝观众 |

三排共用同一个 `direction`（战略地图非 13 路径下 `squadDirections=null`，全部退回整军 `directionIndex`），
画出来却差一个朝向 —— 这就是主人看到的"第一排朝向有问题"。

补充佐证：**诺斯战士的 8 个方向里找不到"正面朝观众"的那一向**，而另外两个兵种都有（在 dir3）。
8 向本该均匀覆盖整圈、必然包含正南，缺了它 → 它的角度序不是标准 8 方位。

## 二、你的验证方法有盲区（这是重跑没修好的原因）

"用当前脚本重跑 + 逐像素 diff = corr 1.00" 只证明了：

    素材 == 当前脚本的输出

**没有证明**：

    当前脚本的输出 == 正确朝向

如果 `u_inf_norse_warrior` 这个 SLD 本身的角度起点/顺序与常规单位不同，那么用同一个
`GAME_DIR_TO_DE_ANGLE=[14,0,2,4,6,8,10,12]` 重跑，会**一字不差地重现同样的错误**。
自洽 ≠ 正确。这就是为什么 idle/attack/death 全部 corr=1.00，画出来却还是和别人对不上。

## 三、请你做的事

### 不要做
- ❌ 不要再按现有 `GAME_DIR_TO_DE_ANGLE` 重跑一次 —— 只会得到一模一样的结果。
- ❌ 不要改 `src/config/UnitAssets.ts` 里的路径数组做循环重排 —— 缺"正南"说明不是固定偏移，重排修不好。
- ❌ 不要换素材（huskarl / berserk 顶替）—— 素材本身是好的，且会让罗斯军团第 1、2 排变成同一种兵，
      丢掉瓦兰吉卫队的史实编成（`FactionCompositions.ts` 的 `luosi` 鱼鳞阵 3+4+2）。

### 要做：导出 SLD 原始角度全览图
1. **跳过 `GAME_DIR_TO_DE_ANGLE`**，直接按 SLD 内部的**原始角度顺序**导出，不做任何映射。
2. 目标 SLD（在上表的 Steam graphics 目录下）：
   - `u_inf_norse_warrior_idleA_x1.sld`
   - `u_inf_norse_warrior_walkA_x1.sld`
   - `u_inf_norse_warrior_attackA_x1.sld`
   - `u_inf_norse_warrior_deathA_x1.sld`
   四个动作都要 —— idle 同样对不上，不是 walk 独有的问题。
3. 每个角度取**首帧**，横排拼成一张 PNG，**每格标注 SLD 内的角度索引**（0..N-1，N = 该 SLD 实际角度数）。
4. 同一张图里加一行**对照组**：`u_inf_elite_berserk_*` 的同名动作，同样按原始角度序导出。
   两行并排是关键 —— 能直接看出两个 SLD 的角度起点差多少。
5. 一并报出每个 SLD 的：**实际角度数**、**每角度帧数**、**总帧数**。

### 交付物
- 一张（或每动作一张）双行全览 PNG，格子带角度索引标注。**存到 `C:\MAPWARSJ\claudedocs\` 下并把文件名报出来。**
- 上述帧数/角度数的实测数字。

交付后由主人指认"哪个角度是正南"，据此为这个单位单独定映射。这是唯一能一次定死、不靠猜的办法。

## 四、已经排干净、不用再查的（省得重复劳动）

以下均已实测，**不是问题所在**：

- **素材没有裁切**：norse 全部 4 动作 × 8 方向 × 全帧共 1440 帧，实心像素（alpha>200）触到帧边界的帧数 = **0**。
  触边的只有 alpha>0 的抗锯齿羽化层，那正是紧包围盒的定义。`fw=24/28` 是算出来的不是设定的，侧身角度投影本来就窄。
- **切片参数自洽**：三个兵种所有动作所有方向，`png宽度 ÷ fw` 精确等于 `meta.frames`、高度等于 `fh`，无一处不整除。
- **渲染链没有像素裁剪**：全链只有一处 `ctx.clip()`（`src/map/legion/LegionFlagDrawer.ts:366` 将领头像圆形裁剪），
  `save/clip/restore` 配对完整，不泄漏。`GlobalUnitRenderer` 里叫"裁剪"的是整军可见性剔除，不是像素裁剪。
- **遮罩没错位**：8 向主图与 `.pc.png` 尺寸全部一致，重跑没留坑。
  （另：`MASK_DIRS` 白名单已于 2026-08-18 废除，见 `src/systems/tinting/SpriteTinter.ts:72`，
  新素材不需要登记，缺遮罩会自动回落亮度染色。）
- **播放节奏不受帧数影响**：13 走 `src/ui/Scene13WarLayer.ts:4491` 的 `Math.floor(v.fr * n / 8) % n`（每秒 8 相位归一化），
  战略地图走 `src/map/legion/LegionPhalanxDrawer.ts:1417` 的 `frameMs = 1000 / spriteTotalFrames`，
  两条路径都按"整轮固定时长"自适应，30→60 帧不会变慢。

## 五、收尾提醒

改完素材必须 `git add` 提交，**`_meta.json` 要和 png 一起提交**——
线上 meta 写 30、图是 60 帧的话切帧会全错，比现在更糟。本项目部署停摆的主因之一就是素材没入库。
