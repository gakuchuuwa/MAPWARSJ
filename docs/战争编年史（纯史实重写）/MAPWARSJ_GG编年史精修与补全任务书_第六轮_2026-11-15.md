# MAPWARSJ 编年史主线精修、版图归属汇总与新补数据勘正任务书（供 GG 执行 · 2026-11-15）

> **统一目录约定**：所有编年史真源、本任务书及 GG 全部交付物，**一律统一放在 `docs/战争编年史（纯史实重写）/`**（对应云盘文件夹：[战争编年史（纯史实重写）](https://drive.google.com/drive/folders/1X5VZmg88YI9b8oeCv9OB6th95K0XXy37)），不再分散到其他文件夹。  
> **与已有成果衔接说明**：你已交付的《主线 1022 场合并战略播报定稿》与《据点历年归属_第三至十六段.xlsx》均已完好保存在本目录中，**绝不重做已完工内容**；本任务书专门针对当前代码库里尚未解决的 **5 项真实数据缺口与脏数据 Bug**，请按 **【第 1 单】→【第 5 单】** 逐单独立交付，切勿多单合并导致截断。

---

## 〇、同步真源文件与全局铁律（动笔前必读）

网页版环境不会自动加载项目根目录规则，**本任务书所有产出必须 100% 遵守以下现行铁律（新旧口径若有差异，一律以本节为准）**：

### 1. 请直接对照读取的项目同步真源文件（只读字典，严禁盲猜 ID）
1. **二十四卷事件唯一真源**：`docs/战争编年史（纯史实重写）/战争事件编年史_全二十四卷_前550至1870年_2526场纯史实引擎全库.json`
2. **主线导演编排表**：`src/data/chronicle/ChronicleDirectorScript.ts`（当前实装 **183 个棒号 `baton`、764 场事件**）
3. **据点唯一字典**：`src/data/cities_v2.ts`（共 **1,331 座据点**，一切 `cityId` / `from` 必须在此表存在）
4. **据点建城年表**：`src/data/cityFoundedYears.ts`（现有 1,271 条，差额 60 座待补）
5. **据点历年归属表**：`src/data/chronicle/ChronicleCityOwnership.ts`（仅录了第 1–2 段约 270 城，可结合本目录已有《据点历年归属_第三至十六段.xlsx》汇总补全）
6. **势力唯一字典**：`src/data/factions.ts`（共 **898 个势力**，一切存量 `factionId` 必须在此表存在）
7. **武将、精锐与生卒表**：`src/data/FactionGenerals.ts`、`src/data/GeneralLifeYears.ts`、`src/data/BattlefieldCharacters.ts`、`src/data/GeneralFirstBattleBackgrounds.ts`

### 2. 全局红线速查（触碰任一条即在本地导入/校验脚本报错拒收）
- **文案与地名铁律**：
  - 年份一律写全汉字「**公元前X年 / 公元X年**」（零写作「〇」）；**零括号、零阿拉伯数字、零分号、零引号书名号、禁省「公元」二字、禁年号纪年**；**不写兵力确数**（蒙古「万户」除外）。
  - 地名、官爵一律用**当时历史称呼**；**严禁以「朝 / 王朝」称呼政权**（唯国号「朝鲜」除外；公元 330 年后东罗马一律称「东罗马帝国」，禁称「拜占庭」）；**严禁「古城 / 古都 / 旧都」及近代词、后人结局词**。
- **武将、势力与精锐铁律**：
  - **武将名**：只留**本名**（可带君主序数「X世」或通用尊称），禁职位/封号/绰号前缀，**禁「XX二」式重名尾缀**；汉字圈人名 ≤5 字，非汉字圈音译写全不截断；**同一历史人物全库只许唯一 `generalId` 且全局禁人物重名**（`import-mainline.mts` 有严格重名拦截，如遇已入库同人必须指明复用/合并方案，严禁造出重名第二人）。
  - **实名与泛指**：史书有主帅/守将真名者**必用真名**；确系史失其名者用**史载身份泛指**（如「林胡王」「罗得执政官」），严禁私编人名，**严禁把部队/兵种编制当人名**（如「北地廉县守城弩手」「青徐郡县讨捕军」均属违规）。
  - **出发据点**：武将必挂代表事件的**出发据点**（起兵地 / 出征集合地 / 所守之城），**严禁挂战后才久驻之城、出生地、籍贯、死葬地或遥领地**。
  - **势力命名**：≤9 字，须为政权本体；**禁含「朝 / 王朝」**（朝鲜除外）、**禁含「叛军」**（系统无主占位 `panshu` 除外；割据军阀或起义军按史载军号/政权号或「史载地域＋义军」命名）、禁纯地名。正规势力唯一旗号 1–2 字（禁含「州」「国」「族」「氏」；汉字圈一字国号优先，非汉字文化区一律 2 字简称）。
  - **精锐五级**：① **史源原名不限字数**（须附史书出处以便加入白名单 `ELITE_HISTORIC_NAMES`）；② **自拟番号严格 `4–8 字`**，**严禁两字机械截断病句**（如「意大」「第比」「木剌」），**严禁批量模板套壳词**（「XX卫戍锐卒」「XX征战锐卒」「XX中军精骑」），禁「部队 / 军团」后缀；③ **同势力 × 同番号人数上限**：`T0`=1（普将禁挂）｜`T1`≤2｜`T2`≤4｜`T3`≤8｜`T4`≤9（名将禁挂），同一番号全库限固定一档。

---

## 【第 1 单 · 速赢单】补齐新增 60 座编年史据点建城年 ＋ 14 座补注 ＋ 4 座暂挂势力核验

### 1. 背景问题
`src/data/cities_v2.ts` 第 3777–3837 行新增的 **60 座编年史据点**全部漏登 `src/data/cityFoundedYears.ts`（1,331 − 1,271＝60），导致台湾诸罗（1684）、越南嘉定（1698）、日本北之庄城（1575）、捷克塔博尔（1420）等近世城市在公元前 550 年开局即显现；另有末尾 14 座缺史源注释，4 座据点留有「暂挂待改」注释。

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

### 3. 交付路径与格式
保存至 `docs/战争编年史（纯史实重写）/GG交付_第1单_新增据点建城年与回绑_2026-11-15.json`：
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
- **守城战处理**：跟守方武将守城（`isSiege && role === 'defender'`）引擎强制就地守城不行军，`from` 填该守城 `cityId`，**`route` 必须填 `[]` 空数组**；守方野战迎击则填其真实出发 `cityId` 与迎击途经点。
- **同将连战衔接**：同一棒内同一主将连续作战时，若史载系自上一战场续行进军，`from` 置 `null`（引擎自动自上一战场续行），只需填两战场之间的真实史载 `route` 途经点。
- **节点纯净度**：`route` 不重复包含起点 `from` 本城与终点战场本身；每个节点 `{ "name": "古地名", "lat": 34.62, "lng": 112.45 }` 必须是**单一纯净当时地名**（零冒号、零竖线、零动作词、零多城粘连），经纬度保留 2 位小数且地理走向顺畅，每场附简短史源出处。

### 3. 分批交付路径与格式（分上下两卷防截断）
- `docs/战争编年史（纯史实重写）/GG交付_第2单A_第1至38棒行军路线_2026-11-15.json`（覆盖第 `1` 棒 ～ 第 `'38'` 棒全部事件）
- `docs/战争编年史（纯史实重写）/GG交付_第2单B_第39至117棒行军路线_2026-11-15.json`（覆盖第 `'39A'` 棒 ～ 第 `'117'` 棒全部事件）
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

## 【第 3 单 · 人物与编制精修】核定 76 个占位 `*_shouling` ＋ 清洗 743 名新将病句精锐与生卒 ＋ 3 个「叛军」改名

### 1. 子任务 3A：逐一核定第 19–117 棒批导入的 **76 个占位 `*_shouling`** ＆ **3 个违规「叛军」势力**
> **免检名单**：第 1–18 棒已核实的 15 个泛指将（`paeonia_shouling`, `messenia_shouling`, `rhodes_shouling`, `linhu_shouling`, `chalcis_shouling`, `methone_shouling`, `epidaurus_shouling`, `lycia_shouling`, `dolopes_shouling`, `thasos_shouling`, `melos_shouling`, `mytilene_shouling`, `mantinea_shouling`, `kesaiya_shouling`, `malli_shouling`）及 `jite_shouling`、`aolitai_shouling` **已合规，无需重查**。

- **需逐个结合 `ChronicleDirectorScript.ts` 所出场次核查的 76 个 `generalId`**：
  - **既有势力块内 42 个**：`seleisi_shouling`, `luoma_gongheguo_shouling`, `luoma_diguo_shouling`, `luoma_diguo_shouling_2`, `falanji_shouling`（⚠️现名「埃里克二」）, `falanji_shouling_2`（⚠️现名「路易三世二」）, `awaer_shouling`, `arevaci_shouling`, `cherusci_shouling`, `haikou_shouling`, `goths_migration_shouling`, `old_saxons_shouling`（⚠️现名「赫尔曼二」）, `alamanni_shouling`, `lombard_league_shouling`, `armenia_arsacid_shouling`, `baizanting_shouling`, `qiuci_shouling`, `tubo_shouling`, `tubo_shouling_2`, `han_d_shouling`（⚠️现名「北地廉县守城弩手」）, `gaogouli_shouling`, `xianbei_shouling`, `xiongnu_shouling`, `xiongnu_shouling_2`, `xiongnu_shouling_3`, `xiongnu_shouling_4`, `xiongnu_shouling_5`（⚠️现名「呼衍王二」）, `wuhuan_shouling`, `shaodang_shouling`, `gaoche_shouling`, `chagatai_shouling`, `zubu_shouling`, `shache_shouling`, `xiaobolu_shouling`, `fushi_shouling`（⚠️现名「杨安二」）, `baibo_shouling`, `dixiang_shouling`（⚠️现名「青徐郡县讨捕军」）, `gaoqi_d_shouling`, `shanshan_shouling`, `luomu_shouling`, `sailiugu_shouling`, `yelusalengwg_shouling`
  - **新建势力块内 34 个**：`achaea_shouling`, `aitolia_shouling`, `antioch_principality_shouling`, `aquitani_shouling`, `bactria_shouling`, `baima_di_shouling`, `camunni_shouling`, `canlang_qiang_shouling`, `cantabri_shouling`, `caowei_shouling`（⚠️现名「西安平辽东守军」）, `dayueshi_shouling`, `dou_hexi_shouling`, `emesa_shouling`, `fatimids_shouling`, `hafsids_shouling`, `hou_liang_lv_shouling`, `jieyan_shouling`, `juthungi_shouling`, `kangju_shouling`, `lishouzhen_jun_shouling`, `pannonii_shouling`, `pinglu_wang_shouling`, `qi_li_shouling`, `qiedong_qiang_shouling`, `raeti_shouling`, `shifa_rouran_shouling`（⚠️现名「示发余党」）, `shuman_guo_shouling`, `soissons_shouling`, `tbilisi_emirate_shouling`, `tongma_shouling`, `vaccaei_shouling`, `wang_zheng_shouling`, `xianlian_qiang_shouling`, `zhangfeng_jun_shouling`
- **处置准则**：
  1. 凡史书有明确主将/守将真名者：① 先查 `FactionGenerals.ts` 与 `BattlefieldCharacters.ts` 是否**已有同名同人 ID**（例如 `hou_han` 下已有 `houhan_lishouzhen`「李守贞」，隋末已有王世充，前秦已有杨安等），若有则标明复用/合并方案，**绝不许造出重名第二人**；② 若库内尚无此人，给出新 `generalId`、真实本名、生卒年、出发 `cityId`、合规精锐番号与档位。
  2. 若一个 `*_shouling` 被多场不同年代的仗共用（如 `luoma_gongheguo_shouling`），请**按场次逐场拆出对应的真实历史统帅**。
  3. 确系史失其名者：改为合规「史载地域/政权＋统帅身份」泛指（消灭兵种名/部队名/重名「二」后缀），并换掉模板精锐 `XX卫戍锐卒`。
- **3 个违规「叛军」势力改名与旗号核定**：`zhangfeng_jun`（`'涿郡叛军'`）、`lishouzhen_jun`（`'河中叛军'`，注意与 `houhan_lishouzhen` 去重）、`yinaer_jun`（`'哈马丹叛军'`），给出合规势力名（禁含「叛军」「朝/王朝」）与 1–2 字唯一旗号。

### 2. 子任务 3B：清洗 `*_gen_1` ～ `*_gen_743`（743 名新将）的伪精锐番号、战年暴毙生卒与错挂据点
1. 全面替换 `意大中军精骑`、`第比卫戍锐卒`、`木剌征战锐卒` 等两字截断病句及所有 `XX卫戍锐卒 / XX征战锐卒 / XX中军精骑` 批量套壳词，控管同势力同番号人数上限（T1≤2、T2≤4、T3≤8、T4≤9）。
2. 排查 `GeneralLifeYears.ts` 中被填成 `[战年-45, 战年]` 的武将：凡该战未战死、战后仍有史事者，修正为真实（或合理推算至退场后）的生卒年，并排查同人重名与错挂战后驻地。

### 3. 交付路径
- `docs/战争编年史（纯史实重写）/GG交付_第3单A_76首领实名化与3叛军改名_2026-11-15.json`
- `docs/战争编年史（纯史实重写）/GG交付_第3单B_743新将精锐与生卒勘误表_2026-11-15.csv`

---

## 【第 4 单 · 世界版图】汇总已有第 1–16 段归属表并补齐 `ChronicleCityOwnership` 全图 1,331 城（前 550—1870）

### 1. 背景与已有基础（直接复用你已做好的分段表，勿从零重查）
- 代码端 `src/data/chronicle/ChronicleCityOwnership.ts` 目前只导入了第 1–2 段的约 **270 座城**；
- 你此前整理好的 **`样板_据点历年归属_第一二段_2026-11-13.csv`** 与 **`据点历年归属_第三段_2026-11-13.xlsx` ～ `据点历年归属_第十六段_2026-11-14.xlsx`** 均在本目录内！
- 请直接**合并汇总上述第 1–16 段已有成果**，并针对 `src/data/cities_v2.ts` 全量 **1,331 座城**做差集补齐（含未上场的边缘洲际据点、11-13/11-14 新增的 75 座编年史据点，以及洛阳 1233 后、雅典 395 后、耶路撒冷 -37 后等断代续写）。

### 2. 填表铁律
- `cityId` 取自 `src/data/cities_v2.ts` 全量 1,331 城，一座不漏；
- `factionId` **必须 100% 存在于最新 `src/data/factions.ts`**（注意带 `_d` 的分段键名，严禁自造 ID；库内无对应政权的土著/无主时段填 `""` 空字符串，严禁填 `panshu`）；
- 时间范围 `-550` ～ `1870`，按年份严格升序 `[[year, factionId], ...]`。

### 3. 分 4 批按地理大区交付路径
- `docs/战争编年史（纯史实重写）/GG交付_第4单A_西亚地中海北非中亚南亚归属_2026-11-15.json`
- `docs/战争编年史（纯史实重写）/GG交付_第4单B_中国东北亚草原青藏归属_2026-11-15.json`
- `docs/战争编年史（纯史实重写）/GG交付_第4单C_欧洲全境归属_2026-11-15.json`
- `docs/战争编年史（纯史实重写）/GG交付_第4单D_东南亚非洲美洲大洋洲及新增城归属_2026-11-15.json`

---

## 【第 5 单 · 收尾巡检】剩余「时代 × 67 文化」空格军团摸底 ＋ 24 卷真源 `战场地点` 与播报违禁词清洗

1. **剩余「时代 × 67 文化」空格军团史料摸底**：对照 67 文化 × 4 时代（古典 `≤476` ｜ 封建 `476–1050` ｜ 城堡 `1050–1500` ｜ 帝国 `1500–1900`），找出当前 `FactionGenerals.ts` 中仍无留名武将落格的空白格，逐格检索正史：「该文化或相近后裔人群在该时代段是否有留名统帅、对应政权、代表战役与现库 50km 内出发据点？」输出候选清单供本地逐格向主人报批（严禁自行增删 67 文化）。
2. **24 卷真源 `战场地点` 现代词剥离与全库播报禁词补丁**：将 `2526场纯史实引擎全库.json` 后半卷 `战场地点` 混入的现代省市县名与文学修饰词（如 `"安徽庐州肥西巢湖西岸三河镇砖垒浓雾圩田"`）清洗为纯净当时古地名；扫描 `GeneralFirstBattleBackgrounds.ts` 尾部残留的 `XX王朝`、`西山朝`、`旧都` 等违禁词，并检查 11-13～11-15 新入库 `famous` 名将是否缺首战背景播报，一并输出补丁 JSON。
- **交付路径**：`docs/战争编年史（纯史实重写）/GG交付_第5单_空格军团候选与真源清洗_2026-11-15.json`
