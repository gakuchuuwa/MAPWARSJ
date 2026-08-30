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

## 命名说明

- `{action}_{dir}.png`：主图层（含脚底阴影）；`dir` = 游戏方向索引（8 向 0–7 / 16 向 0–15）。
- `{action}_{dir}.pc.png`：玩家色遮罩，仅在非零 alpha 处染玩家色（背旗/货物布/皮肤），与 DE 游戏内渲染一致。
- `_meta.json`：顶层 `dirs16`（true=16 向，false=8 向）、`nDir`、每动作 `frames` / `src_frames` / `dirs{dir:{fw,fh,hx,hy}}`。
