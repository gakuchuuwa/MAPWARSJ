# war_sim 量具边界说明（唯一口径）

> 建立：2026-10-13 ｜ 适用：`tools/war_sim.mjs`
> 用途：**回答"某个改动在纯野战中是好是坏"**。凡引用 war_sim 数字的结论，必须先对照本文的"能测 / 不能测"。

---

## 一、这台量具是什么

- 文件：`tools/war_sim.mjs`（**2026-10-13 从 `scratch/` 迁入**）。⚠️ **迁入时它仍是未跟踪状态（`git status` 显示 `??`）**，要等下一次自动备份提交后才真正有版本历史 —— 在此之前别声称"已纳入"。
- 迁入前的事实：它**从未被 git 跟踪过**（`git log --all -- tools/war_sim.mjs` 与 `-- scratch/war_sim.mjs` 均为空），所以在 `scratch/` 时期**根本不存在任何版本历史**，不是"丢了备份"。
- 性质：**无渲染的纯野战对撞器**，把 `Scene13WarLayer` 的兵-兵索敌/伤害/推挤规则复制过来跑。
- 导出：`run(keyA, keyB, spritesPerSide, seed, spritesPerSideB?, opts?)` 与 `TYPES`（见第三节）。
- 用法：`node tools/war_sim.mjs`（本机 Node **v24.15.0** 原生支持 import `.ts`；旧版 Node 需 `npx tsx`）。
- 迁移影响：`scratch/` 下 **29 个脚本、31 处引用**（静态 import ×20、动态 import ×7、读源码 ×2、注释/命令 ×2）已一并改指 `tools/`；**脚本内部逻辑一行未动**。`scratch/` 另有两处纯注释仍写旧路径（`navy_sim.mjs`、`_noop_check.mjs`），无功能影响，未改。

### 残留引用检查（可复跑）

```powershell
cd C:\MAPWARSJ
rg -n "scratch/war_sim\.mjs|\.\./war_sim\.mjs|\./war_sim\.mjs" src tools scratch scripts package.json
```

**判据**：命中的行里**不许出现可执行代码**（`import` / `from` / `await import(` / `readFileSync`）。纯注释提及不算。
**实测（2026-10-13 迁移后）**：全仓仅 2 处命中，都是注释，**可执行引用 0 处**。
- 文件 mtime 与规则口径：见文件头注（2026-08-11 起的多轮修订）。

## 二、🔴 兵种数值的唯一来源（2026-10-13 改）

**兵种数值不再手抄，直接引用游戏数据**：

```js
import { WAR_TYPES } from '../src/data/WarTypes.ts';
export const TYPES = WAR_TYPES;
```

- 原因：本文件原有 153 行手抄表，**速度整体停在旧值**（轻步兵 55 vs 游戏 36、重骑兵 130 vs 54、弓兵 50 vs 38），量出来的结论不是游戏的结论（血训 47「两份必定漂移」）。
- 替换前逐字段核过：手抄表与 `WAR_TYPES` 的 **7 个字段（hp/atk/meleeArmor/pierceArmor/rng/reload/spd）中 6 个 0 差异，只有 `spd` 全面漂移**；`cls` 全一致 ⇒ 是纯接线替换，不涉及字段翻译。
- 覆盖：手抄表 **75** 个兵种 → 现在 **468** 个（`WAR_TYPES` 全量，含 `hero_*`）。
- ⚠️ **`WarTypes.ts` 是兵种属性的唯一来源，任何脚本都不许在别处再存一份数值。**
- ⚠️ 下游约 **50** 个脚本 `import { TYPES }`，**导出名不许改**。
- ⚠️ 变量名 `TYPES`、`KEY_ALIAS`（melee/heavy/cav/ranged 四个短别名）保持不变。

## 三、能测什么（可信）

| 项 | 说明 |
|---|---|
| **同一改动的前后对比** | 同兵种、同人数、同种子，只改一个变量，比较指标变化 —— **这是本量具唯一的正式用途** |
| 多种子统计 | `SEED` 可换，`bench_los.mjs` 用 `SEEDS=[7,11,23,31,47,59,71,83,97,113]` 十种子 |
| 索敌指标 | `PROBE=1` 输出：真·索敌失败率、换目标次数/人·秒、claims 挤掉目标数、卡在 0.2s 节流窗比例 |
| 推挤指标 | 平移 px/人·秒、方向反转率（越低越不抖） |
| 战场形状 | 横向标准差（铺开程度）、中间 90% 落点带、战线位置 SD、方向反转次数 |
| 结局 | 胜方、余兵、用时、超时（`MAXSEC` 封顶 900s） |

## 四、不能测什么（不可信，别拿它下结论）

| ❌ 不能测 | 原因（已核实） |
|---|---|
| **"谁克谁"这类绝对结论** | 三个基准兵本来就差着量级（骑兵 hp100/atk10/spd54 vs 弓兵 hp30/atk4/spd38）⇒ 骑兵必然碾压。**要问克制必须按造价/档位配平**，不能用 `melee/cav/ranged` 三个短别名直接对撞 |
| 城墙 / 城门 / 建筑 | 全文 grep `bld\|wall\|building` **零命中**（只有一个形参名 `spritesPerSide`）。攻城战、城墙挡路、打墙不封顶 **全部无量具** |
| 攻城武器分档 | `siegeFirstTier`（城门→城墙→箭塔→中心建筑）、`blockedWall` **没有对应物** |
| 守方出门 / 待命闸 | `gateExit`、`manOut`、`insideRing/outOnly/inOnly` **全部没有** |
| 被攻击反击 | `hurtBy`/`hurtAt`/`recentAttacker`（游戏半秒回头）**零命中** |
| 最小射程 | 无 `minRange` 参数 ⇒ 判据只有**两级** `(SPREAD && free) ? free : best`，游戏是**三级** `free ?? inRange ?? best` |
| 十队编制 / 阵型槽位 | 有"队"与分组，但**不等于**游戏的十队/三排槽位 |
| 科技 / 八环血量 | `WAR_TYPES` 是**白板数值**。游戏实际走 `statsFor()`（`Scene13WarLayer.ts:4385`）＝白板＋按年份/文化加科技＋八环乘血量。**war_sim 默认不含这两层**（要含须显式接线，见 `tech_ab.mjs` 的变体 key 做法） |

## 五、会改变结论的开关（报数时必须连口径一起报）

`SPREAD=4`（对标游戏 `SPREAD_CAP`）｜`SEARCH_MODE=3`（环形最近邻）｜`CLAIMS_LIVE=1`｜**`KEEP_CLAIMS=0`（默认关，而游戏一直开着 ⇒ 默认口径测不到 keep 的 claims 闸）**｜`NOGAP=0`｜`REGROUP`默认开｜`WING`默认开｜`SEP_SMOOTH=0.15`｜`BONUS=1`｜`MAXSEC=900`。

其余可调：`N`、`NB`、`PAIR`、`SEED`、`PROBE`、`BRACE`、`BRACE_TAKEN`、`GANG`、`KEEP`、`KEEP_HP`、`KITE`、`MARCH*`、`ROW_SHUFFLE`、`SEARCH_DIR`、`SLIDE*`、`SEPD`、`SEP_*`、`AIM_JITTER`、`LANE_*`、`MIX`、`ENG`、`FIGHT_T`、`BREAK_T`、`CAP`、`ATTR_*`、`RADIUS`、`ROUTE`、`ARRIVE`、`NEAR_PORT`、`BATCH`。

⚠️ 全部开关在**模块加载时**读 `process.env` ⇒ 进程内改无效，必须启动进程时给。

## 六、基线（对照用）

镜像局 `melee,melee`，N=500，SEED=7，`PROBE=1`：

| 指标 | **新基线（引用游戏数据后）** | 旧基线（手抄表，已作废） | 游戏代码注释记的 |
|---|---|---|---|
| 真·索敌失败 | **3.1%** | 3.9% | 3.1~3.2% ✅ |
| 打/走切换（次/人·秒） | **0.17** | 0.23 | 0.24~0.25 |
| 用时 | **114s** | 87s | — |
| 尸体数 | 955 | 944 | — |
| 横向标准差 | 127px | 121px | — |

> **新基线与几个月前注释里记的 3.1% 精确吻合** —— 这是"量具已与游戏对表"的最硬证据。
> **旧基线只作记录，不再用于比较。** 任何"改前/改后"必须两次都跑新量具。

## 七、流程铁律

1. **先量后改**：改任何寻敌/战斗规则前，先用本量具量基线；改完用同一组种子复量。
2. **一次只改一个变量**，其余开关保持默认并**写进结论**。
3. **结论冲突时以真机为准**（war_sim 只是代理，测不了第四节的任何一项）。
4. 引用本文档数字时，必须同时给出：`PAIR`、`N`、`SEED`、以及被改动的开关。
