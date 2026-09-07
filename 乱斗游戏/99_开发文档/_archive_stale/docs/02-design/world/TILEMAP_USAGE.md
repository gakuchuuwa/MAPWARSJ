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
