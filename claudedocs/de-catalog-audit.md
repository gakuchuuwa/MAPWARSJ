# 兵种鉴赏 × DE 逐条对号审计

由 `python tools/de-catalog-audit.py` 生成。主人定：所有兵种都必须取自 DE，没有自建；两个兵种对同一个 DE 单位即重复。

兵种鉴赏共 637 个；对上 DE 单位的 633 个；**对不上（自建，违规）4 个**；**重复（多个兵种对同一 DE 单位）0 组**。

## 对不上 DE 单位（4 个）

| id | 名字 | 类别 | 素材 |
|---|---|---|---|
| `equites` | 罗马伴随骑士高级 | cavalry | /SUCAI/EQUITES/ |
| `sarmatian` | 萨尔马提亚骑兵 | cavalry | /SUCAI/SARMATIAN/ |
| `elite_peltast` | 色雷斯标枪手高级 | ranged | /SUCAI/ELITE_PELTAST/ |
| `hero_basileus` | 英雄·皇帝巴西琉斯·拜占庭 | hero | /SUCAI/BASILEUS/ |

## 重复：多个兵种对同一个 DE 单位（0 组）

| DE 单位 | 兵种 |
|---|---|
