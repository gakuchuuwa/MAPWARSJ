# SUCAI_TRADE — 商贸、民俗与交通（AoE2 DE 素材）

> 数据源：`AoE2DE/resources/_common/drs/graphics/*.sld`（AoE2 DE 决定版 SLD，genie 格式）。
> 提取脚本：`scratch/extract_trade_transport.py`；复用 `scratch/sld_extract.py` 解析 + `scratch/aoe2de_unit_convert.py` 合成
> （hotspot 对齐 + 阴影 + 玩家色遮罩 `.pc.png`）。
> 用途：战略地图自动移动的单位素材，增加地图多样性。
> 2026-08-31 主人定：5 区域贸易车**只要移动**、8 方向；商船 16 方向；不要死亡。

## 素材清单

每个子目录含 `_meta.json`（帧数 + 每方向 box 尺寸 / hotspot 偏移）+ 每个方向一张横排 sprite sheet
（`{action}_{dir}.png` 主图层、`{action}_{dir}.pc.png` 玩家色遮罩）。

### 贸易马车（交通工具 · 车）
| 目录 | 区域皮肤 | 动物/动力 | 动作 | 方向 |
|------|---------|----------|------|------|
| `TRADE_CART_WEST` | 西方 | 马 | move | 8 |
| `TRADE_CART_WEST_EMPTY` | 西方 · 空车 | 马 | move | 8 |
| `TRADE_CART_ASIA` | 亚洲 | 牛 | move | 8 |
| `TRADE_CART_ASIA_EMPTY` | 亚洲 · 空车 | 牛 | move | 8 |
| `TRADE_CART_AFRI` | 非洲 | 牛 | move | 8 |
| `TRADE_CART_AFRI_EMPTY` | 非洲 · 空车 | 牛 | move | 8 |
| `TRADE_CART_MESO` | 中美洲 | 羊驼/人 | move | 8 |
| `TRADE_CART_MESO_EMPTY` | 中美洲 · 空车 | 羊驼/人 | move | 8 |

### 丝路骆驼商队（交通工具 · 骆驼）
| 目录 | 区域皮肤 | 动力 | 动作 | 方向 |
|------|---------|------|------|------|
| `TRADE_CART_ORIE` | 东方（Middle-East） | **骆驼** | move | 8 |
| `TRADE_CART_ORIE_EMPTY` | 东方 · 空车 | **骆驼** | move | 8 |

> 注：AoE2 贸易车为同一单位（Trade Cart）的分区域皮肤，`orie` 区即骆驼拉车的「丝路骆驼商队」。

### 商船（交通运输 · 船）
| 目录 | 中文名 | 源码 SLD | 动作 | 方向 |
|------|-------|---------|------|------|
| `MERCHANT_SHIP` | 帆布商船（游戏内「商船」单位） | `u_shp_trade_ship_x1` | idle | 16 |
| `TRADE_COG` | 柯克货船 | `u_shp_trade_cog_x1` | idle | 16 |
| `JUNK` | 中式帆船 | `u_shp_junk_x1` | idle | 16 |

> 商船源只有 idle 单帧（每方向 1 帧，AoE2 原版如此），16 方向即可用于移动。

### 步行商人（商贸 · 徒步商旅）
| 目录 | 文化圈 | 源码 SLD | 动作 | 方向 |
|------|-------|---------|------|------|
| `MERCHANT_ASIA` | 东亚 | `u_merchant_asia_walkA` | move | 8 |
| `MERCHANT_ORIE` | 中东/阿拉伯 | `u_merchant_orie_walkA` | move | 8 |
| `MERCHANT_WEST` | 西欧 | `u_merchant_west_walkA` | move | 8 |
| `MERCHANT_AFRI` | 非洲 | `u_merchant_afri_walkA` | move | 8 |
| `MERCHANT_MESO` | 中美洲 | `u_merchant_meso_walkA` | move | 8 |
| `MERCHANT_ANT` | 古典（希腊/罗马） | `u_merchant_ant_walkA` | move | 8 |

### 民间运输车（民俗 · 车）
| 目录 | 中文名 | 源码 SLD | 动作 | 方向 |
|------|-------|---------|------|------|
| `MULE_CART` | 骡车/驴车 | `b_misc_cart_mule_walkA` | move | 8 |

### 渡运与民俗水上交通（船）
| 目录 | 中文名 | 源码 SLD | 动作 | 方向 |
|------|-------|---------|------|------|
| `TRANSPORT_SHIP` | 运输船/渡船 | `u_shp_transport_ship_x1` | idle | 16 |
| `CANOE` | 独木舟/内河小艇 | `u_shp_canoe_x1` + `u_shp_canoe_walk_x1` | idle + move | 16 |

> `CANOE` 的 move（划桨，源 60 帧/向）抽稀到 30 帧/向。

## 未收录（已实测剔除，勿再提取）

| 项 | 剔除理由 |
|----|---------|
| 牛车 `u_misc_cart_ox` / 牛拉四轮车 `u_misc_wagon_ox` | 与已提取的 `TRADE_CART_ASIA`/`TRADE_CART_AFRI`（牛/水牛拉车）重复 |
| 篷车 `u_misc_relic_cart` | 实为「圣物车/仪仗车」，用途窄 |
| 内河帆船 `u_shp_sail_*_boat/ship`（约 120 个） | 与 3 商船重复且量大，易顶爆体积 |
| 野骆驼 `a_hors_camel` / 野驴 `a_hors_donkey` / 羊驼群 `a_herd_llama` | `a_` 前缀 = 环境装饰动物，非商队驮兽；且曾有人误报 llama 文件名为 `a_hors_llama_walkA`（不存在） |

## 命名说明

- `{action}_{dir}.png`：主图层（含脚底阴影）；`dir` = 游戏方向索引（8 向 0–7 / 16 向 0–15）。
- `{action}_{dir}.pc.png`：玩家色遮罩，仅在非零 alpha 处染玩家色（背旗/货物布/皮肤），与 DE 游戏内渲染一致。
- `_meta.json`：顶层 `dirs16`（true=16 向，false=8 向）、`nDir`、每动作 `frames` / `src_frames` / `dirs{dir:{fw,fh,hx,hy}}`。
