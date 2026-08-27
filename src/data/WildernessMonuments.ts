/**
 * 欧亚非大地图·野外独立历史名胜与战略圣地（21座）
 * 真实世界地理经纬度精准定位，直接渲染在大地图的山川、旷野与海滨之上。
 *
 * [2026-08-27 历史审计] 逐座对照 DE 素材 SLD 源与设计文档，纠正素材张冠李戴：
 *   从 DE 场景编辑器补提取 9 个缺失素材（大金字塔/桑奇佛塔/杰姆宣礼塔/异教圣坛/
 *   坎佩尔大教堂/波耶纳里城堡/戈尔贡巴兹/圆形剧场/君士坦丁凯旋门），
 *   按真实历史位置重新安置；狮身人面像（埃及，DE 无此素材）与虚构/无素材项已移除。
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
        id: 'monument_giza_pyramid',
        name: '吉萨大金字塔',
        category: 'ANCIENT_WONDER',
        lat: 29.979,
        lng: 31.134,
        asset: '/SUCAI_BUILDING/GREAT_PYRAMID/preview.png',
        scale: 1.0,
        description: '古埃及第四王朝胡夫法老修建的吉萨大金字塔，古代世界七大奇迹之首。'
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
        asset: '/SUCAI_BUILDING/SANCHI_STUPA/preview.png',
        scale: 1.0,
        description: '印度孔雀王朝阿育王始建的桑奇大佛塔，现存最古老的半球形覆钵式窣堵坡。'
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
        id: 'monument_jam_minaret',
        name: '杰姆宣礼塔',
        category: 'HOLY_SITE',
        lat: 34.396,
        lng: 64.516,
        asset: '/SUCAI_BUILDING/MINARET_OF_JAM/preview.png',
        scale: 0.85,
        description: '阿富汗古尔省哈里河深山峡谷中耸立的65米绿松石烧砖宣礼塔。'
    },
    {
        id: 'monument_roman_amphitheater',
        name: '杰姆古罗马圆形剧场',
        category: 'ANCIENT_WONDER',
        lat: 35.296,
        lng: 10.706,
        asset: '/SUCAI_BUILDING/AMPHITHEATRE/preview.png',
        scale: 1.0,
        description: '北非突尼斯埃尔杰姆保存最完好的三层拱廊大型古罗马露天圆形剧场。'
    },
    {
        id: 'monument_arch_constantine',
        name: '君士坦丁凯旋门',
        category: 'ANCIENT_WONDER',
        lat: 41.890,
        lng: 12.492,
        asset: '/SUCAI_BUILDING/ARCH_OF_CONSTANTINE/preview.png',
        scale: 1.0,
        description: '罗马城斗兽场旁为纪念君士坦丁一世战胜马克森提乌斯而建的凯旋门。'
    },
    {
        id: 'monument_poenari_castle',
        name: '德古拉波耶纳里城堡',
        category: 'HERITAGE_FORT',
        lat: 45.353,
        lng: 24.635,
        asset: '/SUCAI_BUILDING/POENARI_CASTLE/preview.png',
        scale: 0.9,
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
        id: 'monument_gol_gumbaz',
        name: '戈尔贡巴兹圆顶陵',
        category: 'ANCIENT_WONDER',
        lat: 16.830,
        lng: 75.736,
        asset: '/SUCAI_BUILDING/GOL_GUMBAZ/preview.png',
        scale: 0.9,
        description: '印度比贾布尔苏丹国修建的巨型无柱回音圆顶陵墓（Gol Gumbaz）。'
    },
    {
        id: 'monument_pagan_romuva',
        name: '罗姆瓦异教圣坛',
        category: 'HOLY_SITE',
        lat: 54.687,
        lng: 25.290,
        asset: '/SUCAI_BUILDING/PAGAN_SHRINE/preview.png',
        scale: 1.0,
        description: '波罗的海立陶宛原初信仰罗姆瓦的神圣橡树与永恒圣火祭祀圣所。'
    },
    {
        id: 'monument_aachen',
        name: '查理曼亚琛皇家大教堂',
        category: 'HOLY_SITE',
        lat: 50.774,
        lng: 6.083,
        asset: '/SUCAI_BUILDING/SCEN_AACHEN_CATHEDRAL/preview.png',
        scale: 1.1,
        description: '查理曼大帝的八角形皇家宫廷礼拜堂，神圣罗马帝国皇帝加冕圣殿。'
    },
    {
        id: 'monument_quimper',
        name: '坎佩尔圣科朗坦大教堂',
        category: 'HOLY_SITE',
        lat: 47.995,
        lng: -4.103,
        asset: '/SUCAI_BUILDING/QUIMPER_CATHEDRAL/preview.png',
        scale: 0.4,
        description: '法国布列塔尼坎佩尔的双尖塔高耸哥特式主教座堂。'
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
];
