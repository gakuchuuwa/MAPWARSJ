# MAPWARSJ 第六轮任务书：编年史主线精修、版图归属与新补数据勘正（供 GG 执行）

> **派单日期**：2026-11-15  
> **角色分工**：本地 AI 负责导演编排、脚本导入与代码校验；**GG 负责史料考据、脏数据清洗、缺表回填与播报文案撰写**。  
> **执行原则**：请按下方 **【第 1 单】→【第 6 单】** 顺序分批交付，每单独立输出指定格式的 `.json` 或 `.csv` 文件，**切勿把多单挤在同一次回复里导致输出截断**。

---

## 〇、同步真源文件与全局铁律（动笔前必读）

网页版环境不会自动注入项目规则，**本任务书所有产出必须 100% 遵守以下铁律（新旧口径若有差异，一律以本节为准）**：

### 1. 请直接对照读取的项目同步真源文件（只读字典，严禁盲猜 ID）
1. **主线导演编排表**：`src/data/chronicle/ChronicleDirectorScript.ts`（当前实装 **183 个棒号 `baton`、764 场事件**）
2. **二十四卷事件真源**：`docs/战争编年史（纯史实重写）/战争事件编年史_全二十四卷_前550至1870年_2526场纯史实引擎全库.json`
3. **据点唯一字典**：`src/data/cities_v2.ts`（共 **1,331 座据点**，一切 `cityId` / `from` 必须在此表存在）
4. **据点建城年表**：`src/data/cityFoundedYears.ts`
5. **据点历年归属表**：`src/data/chronicle/ChronicleCityOwnership.ts`（当前仅含约 270 城样板）
6. **势力唯一字典**：`src/data/factions.ts`（共 **898 个势力**，一切存量 `factionId` 必须在此表存在）
7. **武将、精锐与生卒表**：`src/data/FactionGenerals.ts`、`src/data/GeneralLifeYears.ts`、`src/data/GeneralFirstBattleBackgrounds.ts`

### 2. 全局红线速查（触碰任一条即在本地校验脚本报错拒收）
- **文案与播报铁律**：
  - **纯第三人称现场纪实**：零对话；**严禁第一/二人称**（我/你/我们/吾/汝/壮士）；**严禁第三人称代词**（他/她/他们/其 → 一律直呼姓名或军名）；禁家庭称谓（父王/先王）与后世庙号追尊（大帝/太祖/高祖）。
  - **纪年与数字**：年份一律写全汉字「**公元前X年 / 公元X年**」（如「公元前二六〇年」「公元一四五三年」）；**零括号、零阿拉伯数字、禁省「公元」二字、禁年号纪年**；**不写兵力确数**（改用「大军」「精骑」「数倍之众」等虚指，蒙古「万户」等制度专名除外）。
  - **古称与禁词**：地名、官爵一律用**当时历史称呼**；战败方必冠势力名；**严禁出现「朝 / 王朝」（唯国号「朝鲜」除外）**、**严禁「古城 / 古都 / 旧都」**、**严禁近代学术/政治词**（丝绸之路、中世纪、希腊化、封建、殖民、游击战、革命、解放等）、**严禁后人视角结局词**（末王、亡国之君、注定灭亡、奠定基础等）。
  - **禁剧透**：衔接播报（`bridge`）与战略播报（`strategic`）**严禁提前剧透本场胜负或战死结局**。
- **武将、势力与精锐铁律**：
  - **武将名**：只留**本名**（可带君主序数「X世」或通用尊称），禁职位/封号/绰号前缀，**禁「XX二」式重名尾缀**；汉字圈人名 ≤5 字，非汉字圈音译写全不截断；**同一历史人物全库只许唯一 `generalId`**（如遇已入库同人，直接指明合并至旧 ID，严禁双 ID 并存）。
  - **实名与泛指**：史书有主帅/守将真名者**必用真名**；确系史失其名者用**史载身份泛指**（如「林胡王」「罗得执政官」），严禁私编人名，**严禁把部队/兵种编制当人名**（如「北地廉县守城弩手」「青徐郡县讨捕军」均属违规）。
  - **出发据点**：武将必挂代表事件的**出发据点**（起兵地 / 出征集合地 / 所守之城），**严禁挂战后才久驻之城、出生地、籍贯、死葬地或遥领地**。
  - **势力命名**：≤9 字，须为政权本体；**禁含「朝 / 王朝」**（朝鲜除外）、**禁含「叛军」**（系统无主占位 `panshu` 除外；割据军阀或起义军按史载军号/政权号或「史载地域＋义军」命名）、禁纯地名。正规势力唯一旗号 1–2 字（禁含「州」「国」「族」「氏」；汉字圈一字国号优先，非汉字文化区一律 2 字简称）。
  - **精锐五级**：① **史源原名不限字数**（须附史书出处以便加入白名单 `ELITE_HISTORIC_NAMES`）；② **自拟番号严格 `4–8 字`**，**严禁两字机械截断病句**（如「意大」「第比」「木剌」），**严禁批量模板套壳词**（「XX卫戍锐卒」「XX征战锐卒」「XX中军精骑」），禁「部队 / 军团」后缀；③ **同势力 × 同番号人数上限**：`T0`=1（普将禁挂）｜`T1`≤2｜`T2`≤4｜`T3`≤8｜`T4`≤9（名将禁挂），同一番号全库限固定一档。

---

## 【第 1 单 · 速赢单】补齐新增 60 座编年史据点建城年 ＋ 14 座补注 ＋ 4 座暂挂势力核验

### 1. 背景问题
`src/data/cities_v2.ts` 第 3777–3837 行新增的 **60 座编年史据点**全部漏登 `src/data/cityFoundedYears.ts`，导致台湾诸罗（1684）、越南嘉定（1698）、日本北之庄城（1575）、捷克塔博尔（1420）等近世城市在公元前 550 年开局即显现；另有末尾 14 座缺史源注释，4 座据点留有「暂挂待改」注释。

### 2. 待办清单（锁死主键，共 60 + 14 + 4 项）
- **A. 漏登建城年的 60 座据点 `cityId`**（按方圆 50km 内最早成规模筑城/置县/立塞/建聚落年份核定，公元前用负数）：
  `city_xanthos`, `city_skyros`, `city_thasos`, `city_corinth`, `city_melos`, `city_torone`, `city_mytilene`, `city_mantinea`, `city_tarraco`, `city_ilerda`, `city_cirta`, `city_lilybaeum`, `city_brundisium`, `city_dyrrachium`, `city_vetera`, `city_caen`, `city_harfleur`, `city_rouen`, `city_saint_valery`, `city_beauvais`, `city_soissons`, `city_nancy`, `city_hericourt`, `city_eresburg`, `city_tortona`, `city_aquileia`, `city_tabor`, `city_kljuc`, `city_khotyn`, `city_mansoura`, `city_damietta`, `city_qaqun`, `city_mazaka`, `city_tephrike`, `city_melitene`, `city_resaina`, `city_amida`, `city_rahba`, `city_singara`, `city_hatra`, `city_alamut`, `city_tamid`, `city_shuman`, `city_lianyun`, `city_firozpur`, `city_kaungton`, `city_chanthaburi`, `city_guankou`, `city_longcheng`, `city_giadinh`, `city_zhennanguan`, `city_baoanjun`, `city_danhanshan`, `city_luze`, `city_dongping`, `city_pinghaiwei`, `city_zhuluo`, `city_zhoushan`, `city_pingguo`, `city_kitanosho`
- **B. 已填年份但缺史源注释的 14 座据点**（复核年份准确性并补齐 15–30 字史源注释）：
  `city_rhandeia`, `city_tigranocerta`, `city_sunzhong`, `city_lugidunum`, `city_marisia`, `city_clavenna`, `city_wolgast`, `city_kamba`, `city_canburg`, `city_dingkou`, `city_saerdulu`, `city_guikushan`, `city_orenburg`, `city_vellica`
- **C. 4 座默认势力暂挂据点回绑确认**（核对 `factions.ts` 现库已有键名，确认 `cities_v2.ts` 默认 `factionId` 应改挂哪个合法 ID）：
  - `city_cirta`（现挂 `luoma_diguo`，注释待改努米底亚 `numidia`）
  - `city_nancy`（现挂 `gaolu`，注释待改洛林 `lorraine`）
  - `city_hatra`（现挂 `ansxi`，注释待改哈特拉 `hatra`）
  - `city_alamut`（现挂 `yilihanguo_d`，注释待改木剌夷 `nizari`）

### 3. 交付文件名与格式
输出 `GG交付_第1单_新增据点建城年与回绑_2026-11-15.json`：
```json
{
  "foundedYears": [
    { "cityId": "city_xanthos", "name": "克桑托斯", "foundedYear": -700, "comment": "约前8—前7世纪吕基亚人建克桑托斯卫城（希罗多德 I.176；考古层位）" }
  ],
  "rebindDefaultFactions": [
    { "cityId": "city_cirta", "oldFactionId": "luoma_diguo", "newFactionId": "numidia", "reason": "努米底亚王都，现库 numidia 已建" }
  ]
}
```

---

## 【第 2 单 · 核心除错】清洗并补齐 `ChronicleDirectorScript.ts` 全 764 场行军路线 `from` 与 `route`

### 1. 背景问题（已定位四类实锤数据 Bug）
1. **脏前缀串线 Bug（9+1 场）**：第 `'24A'`～`'30'` 棒及 `'41'` 棒存在未拆分的双线拼接词，导致随行军团跑去敌方首都再折返！必洗场次：`evt_0480`（`｜水路:齐地`）、`evt_0545`（`｜守方:坎达维亚大道`）、`evt_0552`（`｜守方:撒狄`）、`evt_0560`（`｜南道:疏勒`）、`evt_0566`（`｜西路加卢斯:昔兰尼`）、`evt_0580`（`南路:特里登图姆`）、`evt_0597`（`守方终抵锡斯基亚`）、`evt_0614`（`守方:长安`）、`evt_0615`（`攻方:昆阳`、`昆阳｜守方:长安`）、`evt_0957`（`南道木底`）。
2. **违规动作词节点（10 场）**：`evt_1342`（`阿姆河渡`）、`evt_1713`（`佩文西登陆`）、`evt_2011`（`瑟堡登陆`）、`evt_2049`（`保加尔渡伏尔加河`）、`evt_2071`（`瓜洲渡江镇江`）、`evt_2081`（`切尔温斯克渡维斯瓦河`）、`evt_2088`（`图克河口登陆`）、`evt_2137`（`尼科波利斯渡多瑙河`）、`evt_2273`（`义州渡鸭绿江`）、`evt_2369`（`图尔恩渡多瑙河`）——须剥离「渡/登陆」等动作词，只留纯净古地名/津渡名。
3. **守方事件错填敌军进军路线**：多场 `role === 'defender'` 事件误把攻方行军路线填给了守方主将（如 `evt_0820` 随行曹操却填周瑜路线、`evt_0998` 随行谢玄却填苻坚路线，以及 `evt_0392, evt_0597, evt_0621, evt_0988, evt_1081, evt_1267, evt_1536, evt_1718, evt_1793, evt_2188` 等，请全表通查所有 `defender` 场次）。
4. **多城硬拼一格 ＆ 大面积漏填 `route`**：
   - 第 `'40A'`–`'117'` 棒大量把 2～3 座城硬连成一个伪点（如 `潼关长安`、`太原大同宣府`、`九江安庆江宁`），须拆为按行军先后排列的独立坐标点；
   - **第 1–18 棒（179 场中缺 151 场 `route`）**，以及**后段整棒 0 `route` 的 11 个含攻方棒**（`'60C', '68B', '82B', '82C', '84B', '95', '97B', '98B', '98C', '99C', '99D'`）和其余混合棒中的攻城/野战缺漏场次，需按史料补齐史载途经点。

### 2. 行军路线硬性规则
- **只认随行主将本人（`leadGeneralId`）**：`from` 与 `route` **只能写本场玩家随行那一方（第 4 参数 `role`: `'attacker'` 或 `'defender'`）本军亲历的出发据点与途经地**，严禁混入对手路线或未随行的偏师支线！
- **守城战处理**：若本场随行守方（`defender`）且主将开战前本就驻守在被围据点内、无外线机动，则 `from` 填该守城 `cityId`（或与被攻城一致），`route` 填 `[]`；若主将是从外地驰援赴守或迎击，则填其真实出发 `cityId` 与驰援途经点。
- **同将连战衔接**：同一棒内同一主将连续作战时，若史载系自上一战场续行进军，`from` 置 `null`（引擎自动自上一战场续行），只需填两战场之间的真实史载 `route` 途经点。
- **节点纯净度**：`route` 不重复包含起点 `from` 本城与终点战场本身；每个节点 `{ "name": "古地名", "lat": 34.62, "lng": 112.45 }` 必须是**单一纯净当时地名**（零冒号、零竖线、零动作词、零多城粘连），经纬度保留 2 位小数且地理走向顺畅，每场附简短史源出处。

### 3. 分批交付文件名与格式（分上下两卷防截断）
- **第 2 单 A**：`GG交付_第2单A_第1至38棒行军路线_2026-11-15.json`（覆盖第 `1` 棒 ～ 第 `'38'` 棒全部事件）
- **第 2 单 B**：`GG交付_第2单B_第39至117棒行军路线_2026-11-15.json`（覆盖第 `'39A'` 棒 ～ 第 `'117'` 棒全部事件）
```json
[
  {
    "eventId": "evt_0615",
    "baton": "30",
    "leadGeneralId": "lulin_liuxiu",
    "role": "attacker",
    "action": "fix_dirty_route",
    "from": "city_yancheng2",
    "route": [
      { "name": "昆阳", "lat": 33.70, "lng": 113.37 },
      { "name": "定陵", "lat": 33.52, "lng": 113.78 },
      { "name": "郾城", "lat": 33.58, "lng": 114.03 }
    ],
    "source": "《后汉书·光武帝纪上》：刘秀自昆阳夜出定陵、郾城发诸营兵还救昆阳（剔除原误混入之王邑王寻长安—洛阳—颍阳守方路线）"
  }
]
```

---

## 【第 3 单 · 演出闭环】编写编年史主线《衔接播报（`bridge`）》JSON

### 1. 背景问题
`src/data/chronicle/ChronicleTypes.ts` 已实装 `bridge?: string[]`（在上一场 `tactical` 战术总结念完后、下一场 `strategic` 战略背景开念前播报），但目前 **763 个场间过渡全部为空（0 / 763）**。尤其在 **182 处跨棒切换（换主将/跨洲切视角）** 时，画面直接硬切，缺乏史诗连贯感。

### 2. 分批范围与硬性文风
严格按 `src/data/chronicle/ChronicleDirectorScript.ts` 中 `CHRONICLE_MAINLINE_SCRIPT` 数组的实际先后顺序（共 764 场，产生 763 个相邻对 `"prevEvtId->nextEvtId"`）：
- **第 3 单 A（最优先急单）**：全部 **182 处跨棒切换**（即相邻两场的 `baton` 不同，玩家「告辞」旧主、转投下一棒新主将之处）。
- **第 3 单 B（次优先补完）**：同一 `baton` 内部，相邻两场**年份跨度 ≥3 年**或**战场跨大区转移**、仅靠本场 `strategic` 无法交代中间空白史事的场间过渡（同一年份连战且 `strategic` 已自然衔接者无需硬凑）。
- **写作规范**：
  1. 每条 `bridge` 为单段字符串数组 `["..."]`，字数严格控制在 **`80～120 字`**；
  2. 前半句收束上一棒/上一战后的历史余波或旧主归宿，后半句自然将天下视线引向下一棒所在的纪年、地域大势与新主登场背景；
  3. **严守〇节文案铁律**：汉字公元纪年（「公元前X年 / 公元X年」）、零阿拉伯数字、零括号、零第一二人称与他/其代词、零「朝/王朝/古都/近代词/兵力确数」，且**绝对禁止剧透下一场（`nextEvtId`）的战斗胜负**。

### 3. 交付文件名与格式
- `GG交付_第3单A_跨棒衔接播报_2026-11-15.json`
- `GG交付_第3单B_同棒跨年衔接播报_2026-11-15.json`
```json
{
  "evt_0009->evt_0010": [
    "公元前五三〇年，居鲁士二世北征马萨革泰战殁于药杀水畔，波斯诸军奉丧南归。新君冈比西斯二世嗣立于帕萨尔加德，尽抚两河与吕底亚旧部，旋即将目光投向尼罗河畔孤悬海外之埃及王国，大军集结于巴勒斯坦南境佩鲁西姆城外。"
  ]
}
```

---

## 【第 4 单 · 世界版图】补全 `ChronicleCityOwnership.ts` 全图 1,331 城历年政权更迭表（前 550—1870）

### 1. 背景问题
`src/data/chronicle/ChronicleCityOwnership.ts` 目前只覆盖第 1～18 棒涉及的 **约 270 座城**，其余 **约 1,060 座城**空白；且已录名城也多断在中世纪（如 `city_luoyang` 停在 `1233 menggu_d` 缺元明顺清、`city_yadian` 停在 `395 baizanting`、`city_yelusaleng` 停在 `-37 luoma_diguo`）。编年史每次跳年都会按此表刷新全球底图势力色。

### 2. 填表铁律
- **主键与外键 100% 锁死**：
  - `cityId` 必须取自 `src/data/cities_v2.ts` 全量 1,331 城，一座不漏；
  - `factionId` **必须 100% 存在于 `src/data/factions.ts`**（注意分段政权键名与带 `_d` 键名，如 `han_d`, `ming_d`, `manzhou_d`, `yuan_d` 等，请严格查 `factions.ts` 实有键，**严禁凭印象编造 ID**）；
  - 若某城在某历史阶段归属土著部落或地方政权，而 `factions.ts` 中确无对应势力，该时段填 `""`（空字符串，代表无在场正规政权归属），**严禁填 `panshu`**。
- **时间范围与颗粒度**：覆盖 **`-550` 至 `1870`** 年，按起始年严格升序 `[[year, factionId], ...]`。重点保证主线涉及的政权更迭、大帝国兴替（波斯/马其顿/罗马/拜占庭/阿拉伯诸哈里发/蒙古诸汗国/奥斯曼/秦汉晋隋唐宋辽金元明清/莫卧儿/英法西葡俄等）节点准确；短暂数月叛乱无需拆碎，具体战役易手会由导演剧本动态覆盖。

### 3. 分 4 批按地理大区交付（防单文件超长）
- **第 4 单 A**：`GG交付_第4单A_西亚地中海北非中亚南亚归属_2026-11-15.json`（含现有 270 城断代续完 ＋ 该区全部未录据点）
- **第 4 单 B**：`GG交付_第4单B_中国东北亚草原青藏归属_2026-11-15.json`
- **第 4 单 C**：`GG交付_第4单C_欧洲全境归属_2026-11-15.json`（西欧、南欧、中欧、东欧、北欧）
- **第 4 单 D**：`GG交付_第4单D_东南亚非洲美洲大洋洲及新增城归属_2026-11-15.json`（核验四批合集共覆盖满 1,331 个 `cityId`）

```json
{
  "city_luoyang": {
    "name": "洛阳",
    "timeline": [
      [-550, "zhou"], [-256, "qin"], [-205, "han_d"], [9, "dixiang"], [23, "gengshi"],
      [25, "han_d"], [189, "xiliangjun"], [196, "caowei"], [265, "dongjin"], [311, "han_zhao"],
      [325, "hou_zhao"], [351, "dongjin"], [365, "murong"], [370, "fushi"], [384, "dongjin"],
      [394, "hou_qin"], [416, "dongjin"], [420, "liusong"], [422, "tuoba"], [534, "yuwen"],
      [538, "gaoqi_d"], [577, "yuwen"], [581, "sui"], [619, "wang_zheng"], [621, "tang"],
      [690, "wuzhou_d"], [705, "tang"], [755, "da_yan"], [762, "tang"], [907, "hou_liang"],
      [923, "shatuo"], [936, "hou_jin"], [960, "song"], [1126, "dajin"], [1234, "menggu_d"],
      [1271, "yuan_d"], [1368, "ming_d"], [1641, "dashun"], [1644, "manzhou_d"]
    ],
    "note": "补齐1234后元明顺清归属"
  }
}
```

---

## 【第 5 单 · 人物与编制精修】核定 76 个占位 `*_shouling` ＋ 清洗 743 名新将病句精锐与生卒 ＋ 3 个「叛军」改名

### 1. 子任务 5A：逐一核定第 19–117 棒批导入的 **76 个占位 `*_shouling`** ＆ **3 个违规「叛军」势力**
> **免检提示**：第 1–18 棒已核实的 15 个泛指将（`paeonia_shouling`, `messenia_shouling`, `rhodes_shouling`, `linhu_shouling`, `chalcis_shouling`, `methone_shouling`, `epidaurus_shouling`, `lycia_shouling`, `dolopes_shouling`, `thasos_shouling`, `melos_shouling`, `mytilene_shouling`, `mantinea_shouling`, `kesaiya_shouling`, `malli_shouling`）及 `jite_shouling`、`aolitai_shouling` **已合规，无需重查**。

- **需逐个结合 `ChronicleDirectorScript.ts` 所出场次核查的 76 个 `generalId`**：
  - **既有势力块内 42 个**：`seleisi_shouling`, `luoma_gongheguo_shouling`, `luoma_diguo_shouling`, `luoma_diguo_shouling_2`, `falanji_shouling`（⚠️现名「埃里克二」带重名尾缀）, `falanji_shouling_2`（⚠️现名「路易三世二」）, `awaer_shouling`, `arevaci_shouling`, `cherusci_shouling`, `haikou_shouling`, `goths_migration_shouling`, `old_saxons_shouling`（⚠️现名「赫尔曼二」）, `alamanni_shouling`, `lombard_league_shouling`, `armenia_arsacid_shouling`, `baizanting_shouling`, `qiuci_shouling`, `tubo_shouling`, `tubo_shouling_2`, `han_d_shouling`（⚠️现名「北地廉县守城弩手」兵种当人名）, `gaogouli_shouling`, `xianbei_shouling`, `xiongnu_shouling`, `xiongnu_shouling_2`, `xiongnu_shouling_3`, `xiongnu_shouling_4`, `xiongnu_shouling_5`（⚠️现名「呼衍王二」）, `wuhuan_shouling`, `shaodang_shouling`, `gaoche_shouling`, `chagatai_shouling`, `zubu_shouling`, `shache_shouling`, `xiaobolu_shouling`, `fushi_shouling`（⚠️现名「杨安二」）, `baibo_shouling`, `dixiang_shouling`（⚠️现名「青徐郡县讨捕军」部队当人名）, `gaoqi_d_shouling`, `shanshan_shouling`, `luomu_shouling`, `sailiugu_shouling`, `yelusalengwg_shouling`
  - **新建势力块内 34 个**：`achaea_shouling`, `aitolia_shouling`, `antioch_principality_shouling`, `aquitani_shouling`, `bactria_shouling`, `baima_di_shouling`, `camunni_shouling`, `canlang_qiang_shouling`, `cantabri_shouling`, `caowei_shouling`（⚠️现名「西安平辽东守军」）, `dayueshi_shouling`, `dou_hexi_shouling`, `emesa_shouling`, `fatimids_shouling`, `hafsids_shouling`, `hou_liang_lv_shouling`, `jieyan_shouling`, `juthungi_shouling`, `kangju_shouling`, `lishouzhen_jun_shouling`, `pannonii_shouling`, `pinglu_wang_shouling`, `qi_li_shouling`, `qiedong_qiang_shouling`, `raeti_shouling`, `shifa_rouran_shouling`（⚠️现名「示发余党」）, `shuman_guo_shouling`, `soissons_shouling`, `tbilisi_emirate_shouling`, `tongma_shouling`, `vaccaei_shouling`, `wang_zheng_shouling`, `xianlian_qiang_shouling`, `zhangfeng_jun_shouling`
- **处置准则**：
  1. 若该场次史书有明确主将/守将真名：① 先查 `FactionGenerals.ts` 是否**已有同人 ID**（例如 `hou_han` 下已有 `houhan_lishouzhen`「李守贞」、`wang_zheng` 或隋末已有王世充、前秦已有杨安等），若有则标 `merge_to_existing`（若涉及叛离原政权独立割据，按史实裁定保留哪一边 ID 或改挂）；② 若库内尚无此人，给出新 `generalId`、真实本名、生卒年、出发 `cityId`、合规精锐番号与档位。
  2. 若一个 `*_shouling` 被多场不同年代的仗共用（如 `luoma_gongheguo_shouling`），请**按场次逐场拆出对应的真实历史统帅**！
  3. 确系正史失载姓名者：保留泛指，但必须修正违规部队名/重名尾缀，改为合规的「史载地域/政权＋统帅身份」（如「廉县长」「青徐校尉」），并把模板精锐 `XX卫戍锐卒` 换为合规番号。
- **3 个违规「叛军」势力改名与旗号核定**：
  1. `zhangfeng_jun`（现名 `'涿郡叛军'`，东汉初涿郡太守张丰自称「无上大将军」或据涿郡反汉）
  2. `lishouzhen_jun`（现名 `'河中叛军'`，948 年河中节度使李守贞自号「秦王」反后汉，注意与 `houhan_lishouzhen` 去重合并）
  3. `yinaer_jun`（现名 `'哈马丹叛军'`，1059 年塞尔柱宗王易卜拉欣·伊纳尔起兵争位）
  → 请按 `faction-naming` 规则给出合规势力名（禁含「叛军」「朝/王朝」）、1–2 字唯一旗号及去重方案。

### 2. 子任务 5B：清洗 `*_gen_1` ～ `*_gen_743`（743 名新将）的伪精锐番号、战年暴毙生卒与错挂据点
扫描 `src/data/FactionGenerals.ts` 与 `src/data/GeneralLifeYears.ts` 中全部带 `_gen_` 的 743 名编年史新补武将：
1. **全面消灭截断病句与套壳精锐名**：将所有 `意大中军精骑`、`第比卫戍锐卒`、`木剌征战锐卒` 及所有 `XX卫戍锐卒 / XX征战锐卒 / XX中军精骑` 替换为符合该政权/民族/统帅历史的真实军制卫队名或通顺 4–8 字精锐名（严格控管同势力同番号人数上限：T1≤2、T2≤4、T3≤8、T4≤9；名将禁挂 T4，普将禁挂 T0）。
2. **修正「打完即卒」的机械生卒年**：排查 `GeneralLifeYears.ts` 第 2550–2940 行凡被脚本填成 `[战年-45, 战年]` 的武将——**只要此人在该战未战死、战后仍有史事或明确卒年，必须改为真实（或合理推算至退场后）的生卒年**，防止其在百岁模式与后续编年史中提前暴毙消失！同时检查是否与库内既有老武将重名/同人双 ID，以及 `cityId` 是否错挂战后驻地。

### 3. 交付文件名
- `GG交付_第5单A_76首领实名化与3叛军改名_2026-11-15.json`
- `GG交付_第5单B_743新将精锐与生卒勘误表_2026-11-15.csv`（列头：`generalId,factionId,generalName,同人合并至已有ID,原cityId,核定出发cityId,原birth,原death,核定birth,核定death,原eliteName,核定eliteName,核定eliteTier,是否史源原名,史料依据`）

---

## 【第 6 单 · 收尾巡检】24 卷真源违禁词清洗 ＋ 新名将首战播报 ＋ 剩余「时代 × 67 文化」空格军团摸底

1. **24 卷真源 JSON 与播报违禁词全量体检**：
   - 检查 `战争事件编年史_全二十四卷_前550至1870年_2526场纯史实引擎全库.json` 后半卷 `战场地点` 中混入的现代行政区划与文学环境描写（如 `"安徽庐州肥西巢湖西岸三河镇砖垒浓雾圩田"`），输出清洗映射表改为纯净当时古地名；
   - 扫描全库播报（含 `src/data/GeneralFirstBattleBackgrounds.ts` 尾部如 `波斯卡扎尔王朝`、`阿富汗杜兰尼王朝`、`西山朝`、`旧都勃固`），输出违禁词替换补丁清单。
2. **剩余「时代 × 67 文化」空格军团史料摸底**：
   - 对照库内 67 文化 × 4 时代（古典 `≤476` ｜ 封建 `476–1050` ｜ 城堡 `1050–1500` ｜ 帝国 `1500–1900`），找出目前仍无留名武将落格的空白格，逐格考证：「该文化或相近后裔人群在该时代段是否有正史留名的统帅、对应政权、代表战役与现库 50km 内出发据点？」输出候选清单供本地逐格向主人报批（严禁自行增删 67 文化）。
3. **新晋名将《经典战播报》补齐**：
   - 为 11-13～11-15 新入库且定为名将（`famous`）但尚缺 `GeneralFirstBattleBackgrounds` 的统帅，按 `70～150 字`、零括号、零阿拉伯数字、不写兵力确数、不剧透结局口径补齐战前历史背景播报。
- **交付文件名**：`GG交付_第6单_真源清洗与空格军团候选_2026-11-15.json`
