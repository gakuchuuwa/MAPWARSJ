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

---
title: MAPWAR 文档清单与清理建议
summary: 列出当前各文档用途、优先级及清理建议，便于后续删除或合并。
owner: GAKU
status: active
last_updated: 2026-05-24
phase: production
---
# 文档清单与清理建议

> ⚠️ **2026-05-24 设计变更**：MAPWAR 已从"实时 2D 文明 6"（4X 沙盒）**重新定义为"历史大乱斗"**。
> 以下文档中，凡涉及"文明 6""4X 沙盒""时代原始→未来""一势力多城"等表述的，**均已被新设计取代**。
> 所有 AI/协作者应首先阅读 [PROJECT_PLAN.md](../PROJECT_PLAN.md) 以了解最新设计。

| 目录 | 文档 | 用途 | 建议 |
|------|------|------|------|
| **(根)** | **[PROJECT_PLAN.md](../PROJECT_PLAN.md)** | **游戏规划唯一入口（历史大乱斗总纲）** | ✅ **已更新：2026-05-24 全面重写** |
| 00-meta | NEXT_STEPS.md | 2025-10-31 当日的重构行动计划 | 保留备查，可视需要并入 REFACTOR_PLAN |
| 00-meta | REFACTOR_PLAN.md | 重构目标与任务拆解 | 保留 |
| 00-meta | TECHNICAL_ROADMAP_CN.md | 长期技术路线（已废弃-Phaser方案） | **已废弃**，勿作开发依据 |
| 00-meta | 更新日志.md | 2025-10-31 更新记录 | 与时间线重复，可考虑精简为时间线附录 |
| **01-overview** | **游戏设计文档.md** | ⚠️ 极早期设计（战国地图战争游戏） | **已过时**，标记为废弃。新设计见 PROJECT_PLAN.md |
| 01-overview | 20251031PROJECT_SUMMARY.md | 重构冲刺总结 | 保留，辅佐 FINAL_REPORT |
| 01-overview | 20251102PROJECT_OVERVIEW.md | 旧项目全貌（部分过时） | 保留做背景资料，但需注意设计已变更 |
| 01-overview | FINAL_REPORT.md | 重构阶段最终报告 | 保留 |
| 02-design/battle | * | 战斗模块相关设计 | 全部保留（技术实现仍有效） |
| **02-design/systems** | **势力配置说明.md** | **势力数据说明（历史大乱斗版）** | ✅ **已更新：2026-05-24 重写为"一势力一城"模型** |
| 02-design/systems | OPTIMIZATION_ANALYSIS.md | 性能评估与建议 | 保留 |
| 02-design/systems | PLAYER_SYSTEM.md | 玩家成长系统（早期设计） | 保留（部分过时，待评估） |
| 02-design/systems | 历史事件说明.md | 事件数据结构 | 保留 |
| 02-design/world | 20251106CITY_ICON_SYSTEM.md | 城市图标实现 | 保留（技术实现仍有效） |
| 02-design/world | EVENT_DISPLAY_OPTIMIZATION.md | 事件显示优化方案 | 保留 |
| 02-design/world | TERRAIN_OVERLAY_SYSTEM.md | 通行层算法 | 保留 |
| 02-design/world | TILE_MAP_IMPLEMENTATION.md | 瓦片地图迁移记录 | 保留 |
| 02-design/world | TILEMAP_USAGE.md | 瓦片地图使用指南 | 与 TILE_MAP_IMPLEMENTATION 有交叉，可在后续合并 |
| 02-design/world | ZOOM_LEVELS_GUIDE.md | 缩放配置指南 | 保留 |
| 02-design/world | 地形通行层使用说明.md | 通行层操作说明 | 保留 |
| 03-runtime | CHECKLIST.md | 版本检查清单 | 保留 |
| 03-runtime | DEV_GUIDE.md | 开发者指南 | 保留 |
| 03-runtime | HOW_TO_RUN.md | 运行指南 | 保留 |
| 03-runtime | TEST_INSTRUCTIONS.md | 测试手册 | 保留 |
| 03-runtime | 如何启动地图测试.md | 地图调试专用指南 | 保留 |
| 04-ai-export | SKILL_SEEKERS_SETUP.md | Skill Seekers 安装与生成流程 | 保留 |
| 04-ai-export | 如何为MAPWAR创建Claude技能.md | 速查流程 | 保留 |
| 04-ai-export | 技能包上传指南.md | 上传检查项 | 保留 |
| 04-ai-export | 超简单上传步骤.md | 面向非技术成员的逐步引导 | 保留 |

## 已删除
- `99-archive/MVP需求说明.md`：文件内容为空，已移除。

## 清理建议
1. **设计变更通知**：在旧设计文档（如 PLAYER_SYSTEM.md、旧 overview 等）顶部添加"⚠️ 设计已变更"横幅，指向 PROJECT_PLAN.md。
2. **精简 AI 导出文档**：将 04-ai-export 下的多个文档整合为一份总指南。
3. **整合瓦片地图文档**：在 TILE_MAP_IMPLEMENTATION.md 中加入指向 TILEMAP_USAGE.md 的引用。
4. **更新日志处理**：将更新日志信息合并进 timeline.md，之后可归档至 99-archive。
5. **废弃文档标记**：TECHNICAL_ROADMAP_CN.md（Phaser 方案）已有"废弃"标记，可移至 99-archive。
6. **数据治理**：逐步清理 `cities_v2.ts` / `cities.ts` 中的多城势力数据，确保"一势力一城"。
