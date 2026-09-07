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

﻿---
title: MAPWAR Tile Zoom Guide
summary: Simplified single-layer tile strategy focused on zoom level 9 assets.
owner: GAKU
status: active
last_updated: 2025-11-19
phase: production
---
# MAPWAR Tile Zoom Guide

## Single-Layer Update
- 2025-11-19: project locked to one tile layer to reduce scripting bugs and movement issues.
- Zoom wheel still works, but TileMapRenderer now clamps to the only available entry, so players always see level 9 detail.
- Directories 5dixingtu/6dixingtu/7dixingtu/8dixingtu/10dixingtu/11dixingtu/12dixingtu stay in the repo only as backups and are no longer referenced by runtime code.

## Active Layer Specification
| Field | Value |
| --- | --- |
| Zoom level | 9 (CORE) |
| Tiles path | `/9dixingtu/Google Terrain Maps without labels  roads and POI  512px` |
| Tile size | 512 px |
| Coverage | x: 359-443, y: 173-229 |
| Default center | lat 34.26, lng 108.94 |

## Engine Touch Points
1. `src/map/TileMapConfig.js`
   - Only exposes zoom 9 in `TILE_PATHS`, `ZOOM_LEVELS`, and `COVERAGE_BOUNDS`.
   - `MIN_ZOOM`, `MAX_ZOOM`, and `DEFAULT_ZOOM` are all set to 9.
2. `src/map/TileMapRenderer.js`
   - Reads available zooms from config and ignores scroll input when only one layer exists.
   - Initializes the viewport with zoom 9 if config data is missing or mismatched.
3. Terrain overlay + gameplay code continue to consume lat/lng positions; no extra work is required for the single-layer change.

## File Cleanup Checklist
- [ ] Archive or zip the unused tile directories once backups are verified.
- [x] Remove config references to deprecated zoom levels.
- [x] Document the new behaviour for designers and scripters.

## Migration Notes for Designers
- Any scripts that referenced `ZOOM_LEVELS.COUNTRY`/`...CITY` must now use hard-coded zoom 9 values or derive behaviour from gameplay scale instead of map zoom.
- Debug HTML files (test_zoom7/test_tilemap/etc.) still exist for historical comparison but are not maintained; open them only when investigating legacy behaviour.
- When new tile art is prepared, prefer exporting it directly into the `9dixingtu` folder to avoid confusion.
