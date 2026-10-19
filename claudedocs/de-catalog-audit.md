# 兵种鉴赏 × DE 逐条对号审计

由 `python tools/de-catalog-audit.py` 生成。主人定：所有兵种都必须取自 DE，没有自建；两个兵种对同一个 DE 单位即重复。

兵种鉴赏共 641 个；对上 DE 单位的 636 个；**对不上（自建，违规）5 个**；**重复（多个兵种对同一 DE 单位）3 组**。

## 对不上 DE 单位（5 个）

| id | 名字 | 类别 | 素材 |
|---|---|---|---|
| `equites` | 罗马伴随骑士高级 | cavalry | /SUCAI/EQUITES/ |
| `sarmatian` | 萨尔马提亚骑兵 | cavalry | /SUCAI/SARMATIAN/ |
| `vanguard` | 诺曼先锋步兵高级 | infantry | /SUCAI/VANGUARD/ |
| `hero_basileus` | 英雄·皇帝巴西琉斯·拜占庭 | hero | /SUCAI/BASILEUS/ |
| `boarding_galley` | 欧洲接舷战船特殊 | naval | /SUCAI/GALLEY/ |

## 重复：多个兵种对同一个 DE 单位（3 组）

| DE 单位 | 兵种 |
|---|---|
| #1974 Jian Swordsman（u_inf_jian_swordman_shielded_idleA_x1） | `jian_swordsman` 华夏步兵（/SUCAI/JIAN_SWORDSMAN/，科技树）；`jian_swordman_shielded` 华夏步兵高级（/SUCAI/JIANSWORDMANSHIELDED/，对号表「Jian Swordsman#1974」） |
| #2322 Greek Noble Cavalry（u_cav_elite_greek_cavalry_idleA_x1） | `greek_noble_cavalry` 希腊贵族骑兵特殊（/SUCAI/GREEK_NOBLE_CAVALRY/，不可训练单位「Greek Noble Cavalry」）；`elite_greek_cavalry` 希腊贵族骑兵高级（/SUCAI/ELITE_GREEK_CAVALRY/，对号表「Greek Noble Cavalry」） |
| #2332 Mercenary Peltast（u_arc_thracian_skirmisher_idleA_x1） | `thracian_peltast` 色雷斯雇佣轻盾兵特殊（/SUCAI/THRACIAN_PELTAST/，不可训练单位「Mercenary Peltast」）；`elite_peltast` 色雷斯标枪手高级（/SUCAI/ELITE_PELTAST/，对号表「Mercenary Peltast」） |
