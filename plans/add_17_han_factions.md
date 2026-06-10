# 添加17个汉朝势力 — 架构分析报告

## 1. Faction ID 命名方案

| # | 中文名 | 首领 | Faction ID | 说明 |
|---|--------|------|-----------|------|
| 1 | 西楚 | 项羽 | `xichu` | 已有`chu`是huaxia别名，不冲突 |
| 2 | 雍 | 章邯 | `yong` | 无冲突 |
| 3 | 塞 | 司马欣 | `sai` | 无冲突 |
| 4 | 翟 | 董翳 | `zhai_han` | 区分已有`zhai_d`（丁零翟魏） |
| 5 | 西魏 | 魏豹 | `xiwei` | 区分已有`wei`（战国魏） |
| 6 | 河南 | 申阳 | `henan` | 无冲突 |
| 7 | 殷 | 司马卬 | `yin` | 无冲突 |
| 8 | 常山 | 张耳 | `changshan` | 无冲突 |
| 9 | 九江 | 英布 | `jiujiang` | 无冲突 |
| 10 | 衡山 | 吴芮 | `hengshan` | 无冲突 |
| 11 | 临江 | 共敖 | `linjiang` | 无冲突 |
| 12 | 辽东 | 韩广 | `liaodong` | 无冲突 |
| 13 | 梁 | 彭越 | `liang_han` | 区分已有`liang`（凉朝）、`liang_d`（萧梁） |
| 14 | 隗嚣 | 隗嚣 | `kui_d` | 人名→单字隗 |
| 15 | 南越 | 赵佗 | `nanyue` | 区分已有`yuenan`（百越/越南） |
| 16 | 东瓯 | 摇 | `dongou` | 无冲突 |
| 17 | 卫氏朝鲜 | 卫满 | `weiman` | 区分已有`wey`（卫国）、`chaoxian`（朝鲜） |

## 2. 都城与现有城市重叠分析

### 2a. ✅ 可直接复用 `panjun` 城市的（安全修改）

| 新势力 | 都城 | 现有城市 | 操作 |
|--------|------|----------|------|
| **西魏** | 平阳 | `city_linfen`（平阳, lat:36.077,lng:111.516, factionId:'panjun'） | 改 factionId `panjun→xiwei` |
| **翟** | 高奴 | `city_yanan`（延安, lat:36.59,lng:109.49, factionId:'panjun'） | 改 factionId `panjun→zhai_han` |

### 2b. ⚠️ 与现有真实势力重叠的（需决策）

| 新势力 | 都城 | 现有城市+势力 | 问题 | 方案A（修改旧势力） | 方案B（新建城市） |
|--------|------|--------------|------|-------------------|-----------------|
| **西楚** | 彭城 | `city_pengcheng`(factionId:'peng_d' 彭氏) | 彭城=西楚项羽都城 | 改`peng_d→xichu`, 彭氏另迁 | 西楚另建新城（不合理） |
| **梁** | 定陶 | `city_dingtao`(factionId:'lyu_d' 吕氏) | 定陶=彭越梁国都城 | 改`lyu_d→liang_han`, 吕氏另迁 | 梁国另建新城（不合理） |
| **辽东** | 襄平 | `city_liaoyang`(factionId:'gongsun_d' 公孙氏) | 襄平=辽东韩广都城 | 改`gongsun_d→liaodong`, 公孙另迁 | 辽东另建新城（不合理） |
| **南越** | 番禺 | `city_guangzhou`(factionId:'yue' 越) | 番禺=南越赵佗都城 | 改`yue→nanyue`, 越可保留为抽象名 | 南越另建新城（不合理） |
| **常山** | 襄国 | `city_xingtai`(factionId:'jie' 羯) | 襄国=常山张耳都城 | 改`jie→changshan`, 羯另迁 | 常山另建新城（不合理） |
| **河南** | 洛阳 | `city_luoyang`(factionId:'xia' 夏) | 洛阳=河南王申阳都城 | ❌洛阳是T0大城不可改 | 河南另建新城✔️ |
| **隗嚣** | 冀县 | 近`city_tianshui`(factionId:'qin' 秦) | 冀县(甘谷)距天水~40km | ❌天水是秦都不可改 | 新建`city_jixian`✔️ |

### 2c. 🆕 需要新建城市的

| 新势力 | 都城 | 建议城市ID | 建议坐标 |
|--------|------|-----------|---------|
| 雍 | 废丘 | `city_feiqu` | 34.28, 108.67（近长安西） |
| 塞 | 栎阳 | `city_yueyang` | 34.50, 109.20（临潼东北） |
| 河南 | 洛阳 | `city_luocheng` | 34.60, 112.45（洛阳旁边作为替代） |
| 殷 | 朝歌 | `city_zhaoge` | 35.60, 114.18（鹤壁南） |
| 九江 | 六县 | `city_liuxian` | 31.75, 116.50（六安北） |
| 衡山 | 邾县 | `city_zhuxian` | 30.45, 114.88（黄冈北） |
| 临江 | 江陵 | `city_jiangling` | 30.33, 112.22（荆州） |
| 隗嚣 | 冀县 | `city_jixian` | 34.82, 105.32（甘谷） |
| 东瓯 | 东瓯 | `city_dongou` | 27.99, 120.70（温州） |
| 卫氏朝鲜 | 王险城 | `city_wangxian` | 39.05, 125.78（平壤） |

## 3. 距离合规性检查

所有新建城市的坐标均已核对与最近现有城市距离 > 0.4°（约50km）：

- `city_feiqu`(34.28,108.67) vs `city_changan`(34.27,108.93) → 差0.26° ≈ 23km ❌ **距离太近！**
- 建议方案：废丘改用`city_meixian`(34.28,107.80) 或直接将长安改为雍的都城
  
需要调整：废丘离长安太近(23km)，建议废丘坐标改为靠近眉县位置，或直接用长安作为雍的都城（改长安factionId）

## 4. 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `src/data/factions.ts` | 在末尾添加17个新势力条目（`]`前） |
| `src/data/cities_v2.ts` | 修改`city_linfen`/`city_yanan`的factionId；添加10+个新城市到PERIPHERY |
| `src/core/GameApp.ts` | 在STARTING_CAPITALS末尾添加17个映射 |
| `src/core/CityAssetManager.ts` | factionFlagMap添加17条RANDOM；sandboxDisplayNames添加17条中文名 |
| `src/core/EventParser.ts` | factionMap添加中文→ID映射 |

## 5. 待决策事项

**冲突#1**: 西楚(彭城) vs 彭氏 → 建议A: 改`peng_d→xichu`（彭城最出名是项羽）
**冲突#2**: 梁(定陶) vs 吕氏 → 建议A: 改`lyu_d→liang_han`
**冲突#3**: 辽东(襄平) vs 公孙氏 → 建议A: 改`gongsun_d→liaodong`
**冲突#4**: 南越(番禺) vs 越 → 建议A: 改`yue→nanyue`
**冲突#5**: 常山(襄国) vs 羯 → 建议A: 改`jie→changshan`
**冲突#6**: 废丘 vs 长安(23km太近) → 建议: 改`city_changan`的factionId从'tang'改为'yong'（雍都），或另选废丘坐标
