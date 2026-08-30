# SUCAI_RESOURCE — 帝国时代2（AoE2 DE）自然资源与矿产素材库

> 数据源：AoE2DE/resources/_common/drs/graphics/n_mine_*, a_fish_*, n_oysters_*, s_grapevine_*, n_forage_*, n_decal_*。
> 提取脚本：scratch/extract_all_resources.py（hotspot 精确对齐 + 水平居中 + 完整 sprite strip + preview 预览图）。
> 规格标准：包含完整动画帧（鱼群飞跃/水花/水下倒影 90~104 帧、矿石结晶/多变体 4~16 帧）。

## 素材清单（共 55 种资源实体体系）

### 一、露天金矿、石矿与采矿矿坑（15 种）
| 目录名 | 中文名 | 帧数 | 特征描述 |
|---|---|---|---|
| GOLD_MINE | 露天金矿（满储量） | 7 | 金光灿烂的天然晶体露天金矿脉 |
| GOLD_MINE_66 | 露天金矿（中储量 66%） | 7 | 部分开采形态 |
| GOLD_MINE_33 | 露天金矿（少储量 33%） | 7 | 残矿开采形态 |
| STONE_MINE | 露天石矿（满储量） | 7 | 规整坚实的石料矿脉 |
| STONE_MINE_66 | 露天石矿（中储量 66%） | 7 | 中期开采石矿 |
| STONE_MINE_33 | 露天石矿（少储量 33%） | 7 | 残余石矿基岩 |
| QUARRY | 露天采石场 / 矿坑 A | 1 | 大型人工/露天采石遗迹 |
| QUARRY_B | 露天采石场 / 矿坑 B | 1 | 矿坑作业面 |
| ROCK_FORMATION1 | 结晶矿岩 / 天然矿脉 1 | 1 | 奇峰矿岩 |
| ROCK_FORMATION2 | 结晶矿岩 / 天然矿脉 2 | 1 | 连绵矿石露头 |
| ROCK_FORMATION3 | 结晶矿岩 / 天然矿脉 3 | 1 | 伴生矿石岩体 |
| ROCK_PILLAR | 石矿巨柱 / 石笋石柱 | 1 | 险要石柱景观 |
| ROCK_LIMESTONE | 石灰岩矿石脉 | 1 | 白色石灰岩地貌 |
| ROCK_JUNGLE | 雨林伴生矿石岩 | 1 | 青苔矿岩 |
| ROCK_BEACH | 河滩/海滩鹅卵石矿 | 1 | 滩涂湿石 |

### 二、盐田、干盐湖与硫磺地热（3 种）
| 目录名 | 中文名 | 帧数 | 特征描述 |
|---|---|---|---|
| SULFUR_CRATER | 硫磺坑 / 火山口地质热坑 | 5 | 冒着热气与硫磺沉积的地表矿坑 |
| SALT_CRACK | 盐田 / 干盐湖龟裂地壳 | 5 | 干燥龟裂的盐湖/盐碱地面 |
| SALT_ICE_DECAL | 盐壳 / 盐渍结晶地表 | 5 | 白色盐华结晶斑块 |

### 三、浅海与深海跃水鱼群、牡蛎礁与水产资源（19 种）
| 目录名 | 中文名 | 帧数 | 特征描述 |
|---|---|---|---|
| SHORE_FISH | 浅海/近岸鱼群（跃水） | 90 | 连续 90 帧水花跃动与跳水动画 |
| SHORE_FISH_UNDERWATER | 浅海鱼群（水下群游） | 90 | 水下游动暗影与波光 |
| SNAPPER_FISH | 深海红鲷鱼飞跃 | 91 | 91 帧完整破水飞跃 |
| SNAPPER_FISH_UNDERWATER| 红鲷鱼水下阴影 | 91 | 水下跟随阴影 |
| SALMON_FISH | 鲑鱼/三文鱼跃水 | 90 | 90 帧逆流飞跃跳水 |
| SALMON_FISH_UNDERWATER | 鲑鱼水下阴影 | 90 | 水下群游影 |
| TUNA_FISH | 深海巨型金枪鱼跃水 | 90 | 90 帧高速破浪飞跃 |
| TUNA_FISH_UNDERWATER | 金枪鱼水下阴影 | 90 | 水下游水阴影 |
| MARLIN_FISH | 剑鱼 / 蓝枪鱼跃水 | 90 | 90 帧破空飞跃长吻剑鱼 |
| MARLIN_FISH_UNDERWATER | 剑鱼水下阴影 | 90 | 剑鱼水下流线暗影 |
| DORADO_FISH | 鲯鳅 / 鬼头刀鱼跃水 | 90 | 90 帧金绿色彩飞跃 |
| DORADO_FISH_UNDERWATER | 鲯鳅水下阴影 | 90 | 水下游动光影 |
| PERCH_FISH | 河鲈 / 湖泊鱼群跃水 | 90 | 90 帧淡水鱼群翻腾 |
| PERCH_FISH_UNDERWATER | 河鲈水下阴影 | 90 | 水下群游影 |
| OYSTERS | 牡蛎礁 / 珍珠贝海床（满）| 4 | 水面波光粼粼的天然牡蛎礁石 |
| OYSTERS_66 | 牡蛎礁（66% 储量） | 4 | 采集中期牡蛎礁 |
| OYSTERS_33 | 牡蛎礁（33% 残礁） | 4 | 残存生蚝礁 |
| SEA_ROCK1 | 海蚀生蚝礁石 1 | 1 | 附着贝类的海上礁石 |
| SEA_ROCK2 | 海蚀生蚝礁石 2 | 1 | 附着贝类的海上礁石 |
| BOX_TURTLES | 箱龟 / 浅海海龟群 | 104 | 104 帧悠游水面海龟 |
| DOLPHIN | 海豚跃水生态 | 104 | 104 帧海豚伴游破浪 |
| WHALE | 巨鲸浮水喷水 | 104 | 104 帧巨鲸潜浮大洋 |

### 四、农林经济作物、葡萄园与采集业（18 种）
| 目录名 | 中文名 | 帧数 | 特征描述 |
|---|---|---|---|
| VINEYARD | 葡萄园 / 葡萄藤架 | 16 | 16 种不同方向排列的葡萄架与果实 |
| FORAGE_BUSH | 浆果灌木丛（满） | 4 | 挂满红果的天然灌木 |
| FORAGE_BUSH_66 | 浆果丛（66%） | 4 | 部分采集后灌木 |
| FORAGE_BUSH_33 | 浆果丛（33%） | 4 | 残余灌木 |
| FORAGE_FRUIT | 野生果树丛（满） | 4 | 挂果果树 |
| FORAGE_FRUIT_66 | 野生果树丛（66%） | 4 | 部分采摘果树 |
| FORAGE_FRUIT_33 | 野生果树丛（33%） | 4 | 残存果树 |
| FORAGE_PAPAYA | 热带木瓜丛（满） | 4 | 热带木瓜经济树丛 |
| FORAGE_PAPAYA_66 | 热带木瓜丛（66%） | 4 | 中期采摘木瓜 |
| FORAGE_PAPAYA_33 | 热带木瓜丛（33%） | 4 | 残余木瓜丛 |
| FORAGE_PINEAPPLE | 热带菠萝地（满） | 4 | 地生热带菠萝作物 |
| FORAGE_PINEAPPLE_66 | 菠萝地（66%） | 4 | 部分收割菠萝 |
| FORAGE_PINEAPPLE_33 | 菠萝地（33%） | 4 | 残余菠萝苗 |
| OLIVE_TREE | 橄榄树种植园 | 1 | 地中海经典橄榄经济树 |
| WATER_LILY | 湿地睡莲水生植物 | 1 | 沼泽与浅水水生资源 |
