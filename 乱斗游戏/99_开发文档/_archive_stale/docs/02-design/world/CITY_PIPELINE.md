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

﻿# 城市数据与地图流程

## 数据来源
- 城市列表统一维护在 `src/data/cities.json`，字段：
  - `id`, `name`, `factionId`, `latitude`, `longitude`
  - `importance` / `type`：`capital`、`major`、`port`、`pass` 等
  - `troops`：进入战斗/界面时展示的驻军数
- 游戏运行时只读取这一份 JSON（或 `GAME_DATA.cities` 内嵌数据），不再在渲染器内部写死城市。

## 运行时流程
1. `GameManager.loadCities()` 读取 JSON → `cloneCities()` 深拷贝。
2. `addLatLngToCities()` 保证每个城市同时拥有 `latitude/longitude` 与 `tileCoord`，供地图和玩法共享。
3. `this.terrain.setCities()`（shim）会把城市数组缓存到 `this.terrain.cityData`，未来地形覆层/调试工具可以直接复用。
4. `drawCities()` 根据 `CITY_STYLE_MAP` 中的样式绘制圆点/菱形/方块，颜色仍由阵营决定，文本只在地图上显示。
5. 若剧情或年份需要新增城市，只需更新 `cities.json`，复用相同步骤即可。

## 样式约定
| 类型 | 形状 | 半径 | 说明 |
| --- | --- | --- | --- |
| `capital` | 圆形 | 11 | 核心都城，文字更粗 |
| `major` | 圆形 | 8 | 一般郡县 |
| `port` | 菱形 | 9 | 港口或水陆节点（仅样式不同） |
| `pass` | 方形 | 8 | 关隘/险要（暂无额外逻辑） |
| `default` | 圆形 | 7 | 兼容旧数据 |

## 编辑建议
- 先在 `cities.json` 填好首批城市，保持 `type` 与 `importance` 同步。
- 日后新增城市：
  1. 打开调试版页面，使用 `TileMapRenderer.latLngToScreen()`/`screenToLatLng()` 查看坐标。
  2. 将新城市信息追加到 JSON，并通过 `npm run dev` 或 `py -3 -m http.server` 启动本地服务器验证。
  3. 如需批量导入，可准备 CSV → 写脚本转换为 JSON（待调试工具完成前可手工操作）。
- 任何城市的新增/修改都通过 `cities.json` 提交流程，避免在其他文件硬编码。

## 后续 TODO
- 编写 `debug_city_editor.html`：可视化添加城市、导出 JSON。
- 在 `cities.json` 中补充 `type` 字段（若暂未填写，可与 `importance` 复用）。
- 若将来开多层缩放，可在城市数据里添加 `visibleMinZoom`/`visibleMaxZoom`。
