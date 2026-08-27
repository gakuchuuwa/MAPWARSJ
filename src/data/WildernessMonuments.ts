/**
 * 欧亚非大地图·野外独立历史名胜与战略圣地（29座）
 * 真实世界地理经纬度精准定位，直接渲染在大地图的山川、旷野与海滨之上。
 */

export interface WildernessMonument {
    id: string;
    name: string;
    category: 'HOLY_SITE' | 'ANCIENT_WONDER' | 'HERITAGE_FORT' | 'SACRED_PAGODA';
    lat: number;
    lng: number;
    asset: string;
    scale?: number;
    description: string;
}

export const WILDERNESS_MONUMENTS: WildernessMonument[] = [
    {
        id: 'monument_stonehenge',
        name: '巨石阵',
        category: 'ANCIENT_WONDER',
        lat: 51.178,
        lng: -1.826,
        asset: '/SUCAI_BUILDING/SCEN_STONEHENGE/preview.png',
        scale: 1.1,
        description: '公元前3000年索尔兹伯里平原环形巨石阵，不列颠古代德鲁伊与天文观测圣地。'
    },
    {
        id: 'monument_giza_pyramids',
        name: '吉萨大金字塔',
        category: 'ANCIENT_WONDER',
        lat: 29.979,
        lng: 31.134,
        asset: '/SUCAI_BUILDING/SCEN_CUSHITE_PYRAMIDS/preview.png',
        scale: 1.3,
        description: '古埃及第四王朝胡夫金字塔群，古代世界七大奇迹之首，矗立于尼罗河西岸荒漠。'
    },
    {
        id: 'monument_sphinx',
        name: '狮身人面像',
        category: 'ANCIENT_WONDER',
        lat: 29.975,
        lng: 31.137,
        asset: '/SUCAI_BUILDING/SCEN_SPHINX/preview.png',
        scale: 1.0,
        description: '卡夫拉金字塔前守护法老陵寝的整石雕凿巨型斯芬克斯像。'
    },
    {
        id: 'monument_cushite_pyramids',
        name: '麦罗埃黑金字塔',
        category: 'ANCIENT_WONDER',
        lat: 16.938,
        lng: 33.750,
        asset: '/SUCAI_BUILDING/SCEN_CUSHITE_PYRAMIDS/preview.png',
        scale: 1.1,
        description: '苏丹努比亚麦罗埃古王国修建的陡峭高耸黑金字塔群。'
    },
    {
        id: 'monument_torii_gate',
        name: '严岛水上鸟居',
        category: 'HOLY_SITE',
        lat: 34.297,
        lng: 132.319,
        asset: '/SUCAI_BUILDING/SCEN_TORII_GATE/preview.png',
        scale: 1.1,
        description: '日本安艺国严岛神社建在潮间带海中的朱红色大鸟居，人神相通的海上圣境。'
    },
    {
        id: 'monument_tholos_delphi',
        name: '德尔斐神谕万神殿',
        category: 'ANCIENT_WONDER',
        lat: 38.482,
        lng: 22.501,
        asset: '/SUCAI_BUILDING/SCEN_ARCHAIC_THOLOS/preview.png',
        scale: 1.0,
        description: '希腊帕纳塞斯山麓阿波罗神谕圣所多柱式圆形大殿（Tholos）。'
    },
    {
        id: 'monument_pagoda_shaolin',
        name: '嵩山塔林与琉璃宝塔',
        category: 'SACRED_PAGODA',
        lat: 34.508,
        lng: 112.935,
        asset: '/SUCAI_BUILDING/SCEN_PAGODA_A/preview.png',
        scale: 1.2,
        description: '中原嵩山少林古刹高耸密檐式五重琉璃佛塔。'
    },
    {
        id: 'monument_pagoda_dayan',
        name: '长安大雁塔',
        category: 'SACRED_PAGODA',
        lat: 34.218,
        lng: 108.964,
        asset: '/SUCAI_BUILDING/SCEN_PAGODA_B/preview.png',
        scale: 1.2,
        description: '唐永徽年间玄奘法师为保存天竺经像修建的七层四方楼阁式砖塔。'
    },
    {
        id: 'monument_pagoda_dali',
        name: '大理崇圣寺三塔',
        category: 'SACRED_PAGODA',
        lat: 25.708,
        lng: 100.147,
        asset: '/SUCAI_BUILDING/SCEN_PAGODA_E/preview.png',
        scale: 1.2,
        description: '云南南诏与大理国千寻塔，苍山洱海间的佛教密宗圣殿。'
    },
    {
        id: 'monument_pagoda_fogong',
        name: '应县释迦木塔',
        category: 'SACRED_PAGODA',
        lat: 39.565,
        lng: 113.183,
        asset: '/SUCAI_BUILDING/SCEN_PAGODA_D/preview.png',
        scale: 1.2,
        description: '辽清宁年间建造的世界现存最高全木结构无钉纯榫卯巨塔。'
    },
    {
        id: 'monument_leshan_buddha',
        name: '乐山摩崖大佛',
        category: 'HOLY_SITE',
        lat: 29.544,
        lng: 103.771,
        asset: '/SUCAI_BUILDING/SCEN_BUDDHA_STATUE/preview.png',
        scale: 1.3,
        description: '唐开元海通禅师在岷江、大渡河、青衣江三江汇流峭壁开凿的71米弥勒坐佛。'
    },
    {
        id: 'monument_sanchi_stupa',
        name: '桑奇大佛塔',
        category: 'HOLY_SITE',
        lat: 23.480,
        lng: 77.739,
        asset: '/SUCAI_BUILDING/SCEN_REKHADEUL_TEMPLE/preview.png',
        scale: 1.2,
        description: '孔雀王朝阿育王始建的印度现存最古老半球形覆钵式舍利佛塔与四方托拉那石门。'
    },
    {
        id: 'monument_zoroaster_fire',
        name: '亚兹德拜火教拜火坛',
        category: 'HOLY_SITE',
        lat: 31.897,
        lng: 54.356,
        asset: '/SUCAI_BUILDING/SCEN_FIRE_SHRINE/preview.png',
        scale: 1.0,
        description: '伊朗古代琐罗亚斯德教（拜火教）燃烧千百年不灭的神圣阿塔什巴赫拉姆圣火坛。'
    },
    {
        id: 'monument_roman_amphitheater',
        name: '杰姆古罗马斗兽场',
        category: 'ANCIENT_WONDER',
        lat: 35.296,
        lng: 10.706,
        asset: '/SUCAI_BUILDING/SCEN_ROMAN_RUINS/preview.png',
        scale: 1.2,
        description: '北非突尼斯保存最完好的三层拱廊大型古罗马露天斗兽场。'
    },
    {
        id: 'monument_poenari_castle',
        name: '德古拉波耶纳里血之城堡',
        category: 'HERITAGE_FORT',
        lat: 45.353,
        lng: 24.635,
        asset: '/SUCAI_BUILDING/SCEN_CASTLE_RUINS/preview.png',
        scale: 1.2,
        description: '瓦拉几亚大公弗拉德三世（穿刺公德古拉）在喀尔巴阡山峭壁顶修筑的绝险要塞。'
    },
    {
        id: 'monument_ancient_stone_ruins',
        name: '乌尔大塔庙古遗迹',
        category: 'ANCIENT_WONDER',
        lat: 30.962,
        lng: 46.103,
        asset: '/SUCAI_BUILDING/SCEN_ANCIENT_RUINS/preview.png',
        scale: 1.2,
        description: '两河流域美索不达米亚苏美尔乌尔纳姆国王修建的月神阶梯金字塔基座。'
    },
    {
        id: 'monument_chinese_ancient_ruins',
        name: '玉门关汉长城烽燧遗址',
        category: 'ANCIENT_WONDER',
        lat: 40.354,
        lng: 93.861,
        asset: '/SUCAI_BUILDING/SCEN_CHINESE_RUINS/preview.png',
        scale: 1.1,
        description: '丝绸之路西出阳关与玉门关的汉代版筑夯土烽燧长城遗址。'
    },
    {
        id: 'monument_andean_tiahuanaco',
        name: '蒂亚瓦纳科太阳门遗迹',
        category: 'ANCIENT_WONDER',
        lat: -16.554,
        lng: -68.673,
        asset: '/SUCAI_BUILDING/SCEN_ANDEAN_RUINS/preview.png',
        scale: 1.1,
        description: '安第斯高原的的喀喀湖畔前印加古帝国巨石雕刻太阳门与卡拉萨萨亚神庙。'
    },
    {
        id: 'monument_indian_hampi',
        name: '亨比巨石神庙群遗迹',
        category: 'ANCIENT_WONDER',
        lat: 15.335,
        lng: 76.460,
        asset: '/SUCAI_BUILDING/SCEN_INDIAN_RUINS/preview.png',
        scale: 1.1,
        description: '德干高原毗奢耶那伽罗帝国古都花岗岩巨石神庙与石雕战车。'
    },
    {
        id: 'monument_jam_minaret',
        name: '杰姆古尔宣礼塔',
        category: 'HOLY_SITE',
        lat: 34.396,
        lng: 64.516,
        asset: '/SUCAI_BUILDING/SCEN_PAGODA_C/preview.png',
        scale: 1.1,
        description: '阿富汗古尔省深山峡谷哈里河流域耸立的65米绿松石烧砖古塔。'
    },
    {
        id: 'monument_svan_towers',
        name: '斯万高山防御石碉楼',
        category: 'HERITAGE_FORT',
        lat: 43.044,
        lng: 42.730,
        asset: '/SUCAI_BUILDING/SCEN_HERO_SHRINE/preview.png',
        scale: 1.1,
        description: '大高加索山脉斯瓦涅梯千百年抵御外敌的家族防御高石塔群。'
    },
    {
        id: 'monument_pharos',
        name: '亚历山大古灯塔',
        category: 'ANCIENT_WONDER',
        lat: 31.214,
        lng: 29.885,
        asset: '/SUCAI_BUILDING/SCEN_PAGODA_A/preview.png',
        scale: 1.2,
        description: '埃及托勒密王朝在法罗斯岛建造的120米古代世界七大奇迹灯塔。'
    },
    {
        id: 'monument_aachen',
        name: '查理曼亚琛皇家大教堂',
        category: 'HOLY_SITE',
        lat: 50.774,
        lng: 6.083,
        asset: '/SUCAI_BUILDING/SCEN_ARCHAIC_THOLOS/preview.png',
        scale: 1.1,
        description: '查理曼大帝的八角形皇家宫廷礼拜堂，神圣罗马帝国皇帝加冕圣殿。'
    },
    {
        id: 'monument_templar_colossi',
        name: '圣殿骑士团科洛西要塞',
        category: 'HERITAGE_FORT',
        lat: 34.664,
        lng: 32.934,
        asset: '/SUCAI_BUILDING/SCEN_CASTLE_RUINS/preview.png',
        scale: 1.1,
        description: '十字军东征时期圣殿骑士团与医院骑士团在塞浦路斯的海防重堡基地。'
    },
    {
        id: 'monument_pagan_romuva',
        name: '罗姆瓦神圣橡树圣坛',
        category: 'HOLY_SITE',
        lat: 54.687,
        lng: 25.290,
        asset: '/SUCAI_BUILDING/SCEN_FIRE_SHRINE/preview.png',
        scale: 1.0,
        description: '波罗的海立陶宛原初信仰永恒圣火与神圣橡树祭祀圣所。'
    },
    {
        id: 'monument_valhalla_shrine',
        name: '乌普萨拉英灵神殿',
        category: 'HOLY_SITE',
        lat: 59.898,
        lng: 17.633,
        asset: '/SUCAI_BUILDING/SCEN_HERO_SHRINE/preview.png',
        scale: 1.1,
        description: '北欧斯堪的纳维亚古乌普萨拉奥丁与托尔异教大神殿长屋。'
    },
    {
        id: 'monument_trowulan',
        name: '满者伯夷善恶城门',
        category: 'ANCIENT_WONDER',
        lat: -7.558,
        lng: 112.381,
        asset: '/SUCAI_BUILDING/SCEN_TORII_GATE/preview.png',
        scale: 1.1,
        description: '印尼东爪哇满者伯夷帝国古都特罗武兰红砖开敞式善恶护法门。'
    },
    {
        id: 'monument_quimper',
        name: '坎佩尔圣科朗坦大教堂',
        category: 'HOLY_SITE',
        lat: 47.995,
        lng: -4.103,
        asset: '/SUCAI_BUILDING/SCEN_ARCHAIC_THOLOS/preview.png',
        scale: 1.1,
        description: '布列塔尼公国双尖塔高耸哥特式主教座堂。'
    },
    {
        id: 'monument_eurasia_center',
        name: '欧亚大陆极点胜利纪念碑',
        category: 'ANCIENT_WONDER',
        lat: 40.000,
        lng: 60.000,
        asset: '/SUCAI_BUILDING/SCEN_PAGODA_C/preview.png',
        scale: 1.2,
        description: '欧亚内陆大陆地理中心，象征最高战略统治力的方尖胜利坛。'
    }
];
