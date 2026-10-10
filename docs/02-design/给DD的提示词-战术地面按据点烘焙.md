# 给 DD 的提示词：战术模式地面数据按据点烘焙

## 背景（读码所得，已核对）
新战术模式（WebGL 地面层）现在每一场都读同一份 `scratch/rms-out/mapdata_vienna_danube_120.json`（维也纳多瑙河测试图），
不管战场在哪。取数处 `Scene13WarLayer.requestGroundLayerGL()` 的注释写明「待 DD 烘焙数据到位后替换」。

结果：沙漠、雪原、草原的**水体 / 沙滩 / 树林 / 高程 / 树木物件**全是维也纳那一份。
已由 CC 临时做好的一条：草地底图贴图按气候带换（沙漠＝沙地），**只换了底色，地形形状仍是维也纳的**。

## 要你做的
按**据点（或战场经纬度）**烘焙 120×120 的地图数据，格式与现有 JSON **完全一致**，字段：
`header, source, width, height, terrain, layer, elev, passable, speed, objects`
（terrain 为 DE 地形 id：水 / 沙 id=2 / 林 id=10,19,71,89,104 等，沿用 `DE_TERRAIN_MANIFEST`）。

1. 数据按地点分文件，文件名用据点 id 或 `lat_lng` 取整，放 `public/` 下可被 `fetch` 到的位置。
2. 水、沙、林、高程、树木必须来自该地点的真实地理（水系、海岸、植被带、地势），不是维也纳模板的复制。
3. 沙漠地区不应出现大片林地；雪原、草原同理，树种用该气候带能长的。
4. 没有数据的地点，保留现有维也纳图作兜底，不能让战斗开不起来。
5. 攻城战：城心（画面右侧约 0.2~0.85 宽、0.15~0.85 高）要是平地，不能是水、不能是密林。

## 验收（你自己先跑）
- 不同气候带各取一座城（沙漠、草原、雪原、湿润林地、海岸），开攻城战截图，地面形状彼此不同且与地理相符。
- `window.game.scene13War.useGroundGL === true`，无 `PageError`。

## 接口约定（CC 负责接线，不用你改）
CC 会把 `requestGroundLayerGL` 里的取数改成：按 `init.centerLat/centerLng`（或据点 id）取对应 JSON，取不到再用维也纳图。
你只需告诉 CC：文件放在哪、命名规则是什么。
