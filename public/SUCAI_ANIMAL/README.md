# SUCAI_ANIMAL — 帝国时代2（AoE2 DE）野生动物与生态素材库

> 数据源：AoE2DE/resources/_common/drs/graphics/a_*.sld（AoE2 DE 决定版高清精灵）。
> 提取脚本：scratch/extract_all_animals.py（hotspot 对齐 + 脚底投影阴影 + 玩家色遮罩 .pc.png）。
> 规格标准：陆地动物 8 方向（偶数角），天空飞鸟 16 方向，包含完整行走(walk)、奔跑(run)、待机(idle)、捕食攻击(attack)、飞行(fly/hover)动画。

## 素材清单（共 65 种动物生态体系）

### 一、顶级掠食猛兽与危险食肉类（16 种）
| 目录名 | 中文名 | 动作包含 | 方向 |
|---|---|---|---|
| LION | 狮子 | idle, walk, run, attack | 8 |
| TIGER | 孟加拉虎/老虎 | idle, walk, run, attack | 8 |
| SNOWLEOPARD | 雪豹 | idle, walk, run, attack | 8 |
| JAGUAR | 美洲豹 | idle, walk, run, attack | 8 |
| BLACK_PANTHER | 黑豹 | idle, walk, run, attack | 8 |
| WOLF | 灰狼 | idle, walk, run, attack | 8 |
| WOLF_ARCTIC | 北极狼 | idle, walk, run, attack | 8 |
| WOLF_ARABIAN | 阿拉伯狼 | idle, walk, run, attack | 8 |
| BEAR | 灰熊/棕熊 | idle, walk, run, attack | 8 |
| BEAR_BLACK | 黑熊 | idle, walk, run, attack | 8 |
| BEAR_POLAR | 北极熊 | idle, walk, run, attack | 8 |
| CROCODILE | 尼罗鳄/大鳄鱼 | idle, walk, attack | 8 |
| CAIMAN | 凯门鳄 | idle, walk, attack | 8 |
| KOMODO | 科莫多巨蜥 | idle, walk, attack | 8 |
| SNAKE_GROUND | 响尾蛇/陆蛇 | idle, walk, attack | 8 |
| SNAKE_WATER | 水蛇 | idle, walk, attack | 8 |

### 二、大型草食动物与原野巨兽（5 种）
| 目录名 | 中文名 | 动作包含 | 方向 |
|---|---|---|---|
| ELEPHANT | 野生大象 | idle, walk, run, attack | 8 |
| RHINO | 犀牛 | idle, walk, run, attack | 8 |
| BOAR | 欧亚野猪 | idle, walk, run, attack | 8 |
| JAVELINA | 美洲野猪/西貒 | idle, walk, run, attack | 8 |
| TAPIR | 貘 | idle, walk, run, attack | 8 |

### 三、野生羚羊、鹿群与原野猎物（16 种）
| 目录名 | 中文名 | 动作包含 | 方向 |
|---|---|---|---|
| DEER | 马鹿/森林鹿群 | idle, walk, run | 8 |
| ZEBRA | 斑马 | idle, walk, run | 8 |
| GAZELLE | 瞪羚/沙漠羚羊 | idle, walk, run | 8 |
| IBEX | 北山羊/岩羊 | idle, walk, run | 8 |
| MOUFLON | 欧洲盘羊/大角野羊 | idle, walk, run | 8 |
| GUANACO | 原驼/野生羊驼 | idle, walk, run | 8 |
| OSTRICH | 非洲鸵鸟 | idle, walk, run | 8 |
| RHEA | 美洲鸵 | idle, walk, run | 8 |
| PEACOCK | 孔雀 | idle, walk | 8 |
| FOX_RED | 赤狐 | idle, walk, run, attack | 8 |
| FOX_ARCTIC | 北极狐 | idle, walk, run, attack | 8 |
| HARE_BROWN | 褐野兔 | idle, walk, run | 8 |
| HARE_GREY | 灰野兔 | idle, walk, run | 8 |
| HARE_ARCTIC | 北极雪兔 | idle, walk, run | 8 |
| PENGUIN | 企鹅 | idle, walk, attack | 8 |
| MONKEY | 猴子 | idle, walk, attack | 8 |

### 四、天空飞鸟与猛禽（9 种，16 方向）
| 目录名 | 中文名 | 动作包含 | 方向 |
|---|---|---|---|
| HAWK | 老鹰 (Hawk) | fly, hover | 16 |
| FALCON | 猎鹰 (Falcon) | fly, hover | 16 |
| VULTURE | 秃鹰/秃鹫 (Vulture) | fly, hover | 16 |
| CONDOR | 神鹰/安第斯大鹰 (Condor) | fly, hover | 16 |
| STORK | 鹳鸟/白鹳 (Stork) | fly, hover | 16 |
| CRANE | 鹤/仙鹤 (Crane) | fly, hover | 16 |
| FLAMINGO | 火烈鸟 (Flamingo) | fly, hover | 16 |
| MACAW | 金刚鹦鹉 (Macaw) | fly, hover | 16 |
| OWL | 猫头鹰 (Owl) | fly, hover | 16 |

### 五、家畜牧群与民俗生态动物（19 种）
| 目录名 | 中文名 | 动作包含 | 方向 |
|---|---|---|---|
| CAMEL | 双峰骆驼 | idle, walk | 8 |
| DROMEDARY | 单峰骆驼 | idle, walk | 8 |
| BUFFALO | 水牛 | idle, walk | 8 |
| COW_BLACK | 黑牛 | idle, walk | 8 |
| COW_BROWN | 黄牛 | idle, walk | 8 |
| COW_BW | 黑白花奶牛 | idle, walk | 8 |
| ARGALI | 盘羊 (高原生态) | idle, walk | 8 |
| SHEEP | 绵羊 | idle, walk | 8 |
| GOAT | 山羊 | idle, walk | 8 |
| PIG | 家猪 | idle, walk | 8 |
| LLAMA | 大羊驼 | idle, walk | 8 |
| ALPACA | 小羊驼 | idle, walk | 8 |
| DONKEY | 毛驴 | idle, walk | 8 |
| HORSE | 马匹 | idle, walk | 8 |
| TURKEY | 火鸡 | idle, walk | 8 |
| GOOSE | 大雁/家鹅 | idle, walk | 8 |
| CHICKEN | 鸡 | idle, walk | 8 |
| CAPYBARA | 水豚 | idle, walk | 8 |
| WAR_DOG | 军犬/猎犬 | idle, walk, run, attack | 8 |
