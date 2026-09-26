/**
 * 🔴 [2026-09-25 主人定「写剧本的时候，战略地图上据点的旗帜上的字，应该符合历史」]
 * **剧本期据点的史实归属**：剧本那一年，这座城实际归谁管，旗上就写谁。
 *
 * 为什么要这张表：`cities_v2` 的 `factionId` 是乱斗用的「一城一势力」身份，取的是这座城**最有名的那段历史**
 * （尼尼微挂亚述、哈图沙挂赫梯、伊科尼乌姆挂罗姆苏丹国、蓝氏城挂贵霜……），放进前335 年的剧本里就是穿越。
 *
 * 规则：
 *   · 只在剧本期生效（`src/events/scriptHistoricalOwnersSync.ts` 按 `isScriptPeriod()` 套上 / 撤下），乱斗逐字不变；
 *   · 只改**旗号归属**（`factionId`），不改据点名、坐标、守将、精锐；
 *   · 只写与乱斗身份**不同**的城；乱斗身份本来就对的（雅典=阿提卡、萨迪斯=吕底亚总督辖地…）不写；
 *   · 归属优先落到**那一年真实存在的行省 / 王国**（小弗里吉亚总督辖地、埃及行省…），说不清属哪个行省的落到帝国本身；
 *   · 只用**已有势力**，不为此新建势力；没有合适势力的城不写，列进汇报；
 *   · 剧本打下来的城（`cityUpdates` 易主）以打下来为准：本表只动「还是乱斗原主」的城。
 *   · 每条写史料（英文维基为准，§一.1）。
 */

export interface ScriptHistoricalOwner {
    /** 从剧本哪一年起按这个归属显示 */
    year: number;
    cityId: string;
    /** 那一年实际管这座城的势力（必须是 factions.ts 里已有的势力） */
    factionId: string;
    source: string;
}

export const SCRIPT_HISTORICAL_OWNERS: readonly ScriptHistoricalOwner[] = [
    // ── 马其顿王国本土与腓力二世的征服（前335 已属马其顿） ──
    { year: -335, cityId: 'city_anfeibolisi', factionId: 'maqidun', source: '英文维基 Amphipolis：前357 年腓力二世攻取，派马其顿总督治理，货币历法全换马其顿制。' },
    { year: -335, cityId: 'city_aolinsuosi', factionId: 'maqidun', source: '英文维基 Olynthus：前348 年被腓力二世围攻摧毁，卡尔基狄克同盟随之并入马其顿。' },
    { year: -335, cityId: 'city_plovdiv', factionId: 'maqidun', source: '英文维基 Plovdiv：前342 年腓力二世征服此城、废黜奥德里西亚国王，移民两千马其顿人。' },
    { year: -335, cityId: 'city_yanghe', factionId: 'maqidun', source: '英文维基 Thracian Chersonese：雅典与马其顿长期争夺，前338 年割让给腓力二世。' },

    // ── 阿契美尼德波斯·小亚细亚诸行省 ──
    // 🔴 [2026-09-26 第二片逐座核旗号] 前334 年爱奥尼亚诸希腊城邦仍是波斯属地（前387《大王和约》划归波斯，
    //    亚历山大东征才解放），与上一条「克拉佐美奈」同一口径 —— 乱斗旗号「爱奥尼亚」「伊奥尼亚」是这两座城
    //    最有名那段历史的旗号，放进前334 就是穿越。
    { year: -335, cityId: 'city_yifusuo', factionId: 'aqimeinide', source: '英文维基 Ephesus / Peace of Antalcidas：前387 年《大王和约》把伊奥尼亚诸希腊城邦划归波斯，直到前334 年亚历山大东征才脱离波斯（与同表「克拉佐美奈」一条同一口径）。' },
    { year: -335, cityId: 'city_miletus', factionId: 'aqimeinide', source: '英文维基 Siege of Miletus：前334 年米利都为波斯治下的希腊城邦，守将赫格西斯特拉图斯为波斯所任，另有波斯守军据内城；城破后归马其顿（本剧本第 5 场 `cityUpdates` 易主）。' },
    { year: -335, cityId: 'city_damasikusi', factionId: 'aqimeinide', source: '英文维基 Damascus / Battle of Issus：前 4 世纪大马士革为阿契美尼德属地，是波斯王室与总督寄存战金的城；前333 年伊苏斯战后帕曼纽南下取之（阿里安《亚历山大远征记》II.11，本剧本第 7 场 `cityUpdates` 易主）。乱斗旗号「倭马亚」是 7 世纪以后的事。' },
    { year: -335, cityId: 'city_teluoyi', factionId: 'xiaofulijiya', source: '英文维基 Troad：直到亚历山大征服前，特洛阿德属阿契美尼德帝国赫勒斯滂弗里吉亚（小弗里吉亚）行省。' },
    { year: -335, cityId: 'city_peierjiameng', factionId: 'xiaofulijiya', source: '英文维基 Pergamon / Mysia：佩尔加蒙由亲波斯的贡吉洛斯家族领有，直到亚历山大才脱离波斯；密细亚在阿契美尼德时代称「小弗里吉亚」。阿塔罗斯王国前282 年才建。' },
    { year: -335, cityId: 'city_kelazuomeinai', factionId: 'aqimeinide', source: '英文维基 Clazomenae：前387 年《大王和约》把克拉佐美奈划归波斯。统一用阿契美尼德旗，免得同一帝国两面旗。' },
    { year: -335, cityId: 'city_ankala', factionId: 'fulijiya', source: '英文维基 Ankara：安库拉原为弗里吉亚城市，阿契美尼德时属弗里吉亚行省；加拉太人前278 年后才来。' },
    { year: -335, cityId: 'city_yikeniwumu', factionId: 'aqimeinide', source: '英文维基 Konya：伊科尼乌姆在阿契美尼德帝国治下，直到亚历山大征服；罗姆苏丹国是 11 世纪以后的事。' },
    { year: -335, cityId: 'city_hatusha', factionId: 'aqimeinide', source: '英文维基 Hattusa：赫梯帝国前 12 世纪已亡；前 4 世纪此地属阿契美尼德卡帕多西亚行省。' },
    { year: -335, cityId: 'city_amaxiya', factionId: 'aqimeinide', source: '英文维基 Amasya / Kingdom of Pontus：本都王国前281 年才建，此前属阿契美尼德卡帕多西亚行省。' },
    { year: -335, cityId: 'city_themiskyra', factionId: 'aqimeinide', source: '英文维基 Themiscyra：亚马逊人是传说；前 4 世纪黑海南岸属阿契美尼德卡帕多西亚行省。' },
    { year: -335, cityId: 'city_tushpa', factionId: 'wulaertu', source: '英文维基 Urartu：乌拉尔图约前590 年灭亡；此后图什帕属阿契美尼德亚美尼亚行省（前 4 世纪总督奥龙特斯）。' },

    // ── 阿契美尼德波斯·两河、黎凡特、伊朗 ──
    { year: -335, cityId: 'city_niniwei', factionId: 'aqimeinide', source: '英文维基 Nineveh：亚述帝国前612 年亡；此后属阿契美尼德亚述（阿苏拉）行省。' },
    { year: -335, cityId: 'city_yashucheng', factionId: 'aqimeinide', source: '英文维基 Assur：前614 年被米底攻毁，阿契美尼德时属亚述（阿苏拉）行省。' },
    { year: -335, cityId: 'city_aerbeila', factionId: 'aqimeinide', source: '英文维基 Erbil：阿契美尼德时代属亚述行省，高加米拉战前大流士三世的辎重大营即在阿尔贝拉；阿迪亚波纳王国是前 1 世纪以后的事。' },
    { year: -335, cityId: 'city_babilun', factionId: 'aqimeinide', source: '英文维基 Babylon：前539 年居鲁士攻取，此后为阿契美尼德巴比伦行省首府，直到前331 年开城迎亚历山大；迦勒底王朝前539 年已亡。' },
    { year: -335, cityId: 'city_wuluke', factionId: 'aqimeinide', source: '英文维基 Uruk：阿契美尼德时代属巴比伦行省；苏美尔城邦时代早已过去。' },
    { year: -335, cityId: 'city_wuer', factionId: 'aqimeinide', source: '英文维基 Ur：阿契美尼德时代仍有人居，属巴比伦行省。' },
    { year: -335, cityId: 'city_susa', factionId: 'aqimeinide', source: '英文维基 Susa：大流士一世以来为阿契美尼德帝国都城之一，前331 年降亚历山大；埃兰王国前 7 世纪已亡。' },
    { year: -335, cityId: 'city_jiasa', factionId: 'aqimeinide', source: '英文维基 Siege of Gaza：前332 年加沙由波斯守将巴提斯据守；腓力斯丁人前 7 世纪末已被巴比伦灭掉。' },
    { year: -335, cityId: 'city_yelusaleng', factionId: 'aqimeinide', source: '英文维基 Yehud (Persian province)：耶路撒冷为阿契美尼德耶胡德省首府，直到亚历山大征服。' },
    { year: -335, cityId: 'city_tademoer', factionId: 'aqimeinide', source: '英文维基 Palmyra：阿契美尼德时代属河西（阿巴尔纳哈拉）行省；帕尔米拉王国是 3 世纪的事。' },

    // ── 阿契美尼德波斯·埃及行省（前343 年阿尔塔薛西斯三世再征服） ──
    { year: -335, cityId: 'city_wasaite', factionId: 'aiji', source: '英文维基 Thirty-first Dynasty of Egypt：前343 年波斯再征服埃及，直到前332 年总督马扎克斯开城降亚历山大；上埃及亦在其内。' },
    { year: -335, cityId: 'city_awalisi', factionId: 'aiji', source: '英文维基 Avaris / Thirty-first Dynasty of Egypt：喜克索斯人前 16 世纪已被逐；前335 年属波斯埃及行省。' },
    { year: -335, cityId: 'city_peiluximu', factionId: 'aiji', source: '英文维基 Pelusium：前343 年波斯再征服埃及的门户，前332 年随埃及行省降亚历山大。' },

    // ── 阿契美尼德波斯·东方诸行省 ──
    { year: -335, cityId: 'city_salahesi', factionId: 'aqimeinide', source: '英文维基 Parthia (satrapy)：萨拉赫斯一带属阿契美尼德帕提亚行省；萨洛尔土库曼部落是中世纪的事。' },
    { year: -335, cityId: 'city_lanshi', factionId: 'aqimeinide', source: '英文维基 Bactria / Bessus：巴克特拉为阿契美尼德巴克特里亚行省首府，总督贝苏斯；贵霜帝国是 1 世纪的事。' },

    // ── 印度：难陀王朝治下的摩揭陀（孔雀王朝前322 年才建） ──
    { year: -335, cityId: 'city_huashicheng', factionId: 'mojietuo', source: '英文维基 Pataliputra / Nanda Empire：前 4 世纪华氏城为难陀王朝摩揭陀的都城；孔雀王朝前322 年才建。' },
    { year: -335, cityId: 'city_walanaxi', factionId: 'mojietuo', source: '英文维基 Kashi Kingdom：迦尸国前 5 世纪已被摩揭陀吞并，前 4 世纪属难陀王朝。' },
    { year: -335, cityId: 'city_tiyana', factionId: 'aqimeinide', source: '英文维基 Tyana / Cappadocia (satrapy)：前 4 世纪卡帕多细亚属阿契美尼德波斯行省；前333 年亚历山大穿越该地、任命萨比克塔斯为总督（阿里安 II.4），此后归马其顿。🔴 [2026-09-25 主人令「可以请添加」] 新建据点，旗号按剧本年份定。' },
];
