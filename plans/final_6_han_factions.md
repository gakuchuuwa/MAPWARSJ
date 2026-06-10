# 最终方案：添加6个汉朝势力

## 完整列表

| # | 中文名 | 首领 | Faction ID | 都城 | 操作 |
|---|--------|------|-----------|------|------|
| 1 | 翟 | 董翳 | `zhai_han` | 高奴(延安) | `city_yanan` panjun→zhai_han |
| 2 | 殷 | 司马卬 | `yin` | 朝歌(鹤壁) | 新建`city_zhaoge`(35.60,114.18) |
| 3 | 英 | 英布 | `ying_d` | 六县(六安) | 新建`city_liuxian`(31.75,116.50) |
| 4 | 衡山 | 吴芮 | `hengshan` | 邾县(黄冈) | 新建`city_zhuxian`(30.45,114.88) |
| 5 | 临江 | 共敖 | `linjiang` | 江陵(荆州) | 新建`city_jiangling`(30.33,112.22) |
| 6 | 瓯越 | 摇(东瓯王) | `ouyue` | 东瓯(温州) | 新建`city_dongou`(27.99,120.70) |

## 需修改的文件

1. **factions.ts** → 末尾添加6条
2. **cities_v2.ts** → city_yanan改factionId + 新建5个城市
3. **GameApp.ts** → STARTING_CAPITALS加6条
4. **CityAssetManager.ts** → factionFlagMap + sandboxDisplayNames加6条
5. **EventParser.ts** → 中文→ID映射加6条
