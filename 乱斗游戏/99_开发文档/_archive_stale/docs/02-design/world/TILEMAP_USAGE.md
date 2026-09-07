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
title: Tile Map Usage Notes (Single Layer)
summary: Practical checklist for working with the zoom 9 tile set only.
owner: GAKU
status: active
last_updated: 2025-11-19
phase: production
---
# Tile Map Usage Notes

## Current Setup
- Runtime only consumes `9dixingtu/Google Terrain Maps without labels  roads and POI  512px`.
- `TileMapConfig.js` exposes only zoom level 9, so all loaders/renderers inherit the same constraint.
- Other zoom folders remain on disk strictly as archival material; do not point new scripts to them.

## Loading Tiles in Debug Utilities
1. Start a local server (`py -3 -m http.server 8000` or similar).
2. Open `test_tilemap.html` to verify that zoom 9 tiles respond (other zoom tests are deprecated).
3. When testing asset alignment, confirm the image path resolves to `/9dixingtu/.../{x}/{y}.jpg`.

## Adding New Tiles
- Drop new 512px tiles into the existing `9dixingtu` folder hierarchy.
- Ensure `TileMapLoader` can read them without extra configuration—paths are computed automatically via `getTilePath`.
- If a different geographic window is needed, update `COVERAGE_BOUNDS[9]` and keep the same naming convention.

## Troubleshooting Checklist
- **Missing tile** → open the browser console and confirm `Tile path unavailable for zoom=...` is not triggered (only zoom 9 is valid).
- **Wheel zoom does nothing** → expected; renderer logs a hint because only one layer is active.
- **Player stuck** → verify gameplay coordinates (lat/lng) are still within the zoom 9 coverage window.

## Next Steps
1. Optionally delete unused tile folders after archiving (keep at least one external backup).
2. Consider baking a mini-map or shading overlay if designers still need multiple zoom contexts.
3. When multi-layer support is reintroduced, restore the removed config sections from version control history instead of editing live data.
