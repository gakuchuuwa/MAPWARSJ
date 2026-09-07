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
