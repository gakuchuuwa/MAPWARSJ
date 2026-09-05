/**
 * HistoricalRegions.ts
 * 中国历史地理特殊区域定义
 *
 * 为何硬编码而非用 NDVI:
 * - 历史模拟需要古代地貌(云梦泽、居延泽), 现代卫星数据反映的是今天
 * - 沙漠/湿地是离散区域, 多边形比连续植被指数更适合
 * - 未来可与游戏时间挂钩, 实现"地貌随朝代演化"
 *
 * 衰减模型: 椭圆形软边界(避免硬切)
 */

export interface HistoricalRegion {
    id: string;
    name: string;
    type: 'desert' | 'wetland' | 'ancient_lake' | 'loess' | 'plateau';
    /** 椭圆中心 [lat, lng] */
    center: [number, number];
    /** 椭圆半径 [latDeg, lngDeg] - 控制覆盖范围 */
    radii: [number, number];
    /** 目标 RGB 颜色 */
    color: [number, number, number];
    /** 与底色混合强度 0-1 (1=完全覆盖, 0.7=保留 30% 地形阴影) */
    blendStrength: number;
    /** 适用海拔范围, 防止染到不该染的地方 */
    elevMin?: number;
    elevMax?: number;
}

// 历史地理特殊区域 (秦汉到唐代基线)
export const HISTORICAL_REGIONS: HistoricalRegion[] = [
    // === 沙漠类 ===
    {
        id: 'taklamakan',
        name: '塔克拉玛干',
        type: 'desert',
        center: [38.5, 83.0],
        radii: [3.2, 6.5],
        color: [230, 205, 150],  // 明亮沙黄
        blendStrength: 0.75,
        elevMin: 700, elevMax: 2500
    },
    {
        id: 'badain_jaran',
        name: '巴丹吉林',
        type: 'desert',
        center: [40.0, 102.0],
        radii: [1.5, 2.2],
        color: [235, 210, 155],  // 略亮沙黄(沙丘高)
        blendStrength: 0.7,
        elevMin: 800, elevMax: 2000
    },
    {
        id: 'tengger',
        name: '腾格里',
        type: 'desert',
        center: [38.8, 104.5],
        radii: [1.2, 2.0],
        color: [225, 200, 150],
        blendStrength: 0.65,
        elevMin: 1000, elevMax: 2000
    },
    {
        id: 'kubuqi',
        name: '库布齐',
        type: 'desert',
        center: [40.3, 108.5],
        radii: [0.6, 2.0],
        color: [220, 200, 155],
        blendStrength: 0.6,
        elevMin: 1000, elevMax: 1800
    },
    {
        id: 'gobi_south',
        name: '戈壁南缘',
        type: 'desert',
        center: [42.5, 106.0],
        radii: [2.0, 5.0],
        color: [200, 190, 165],  // 戈壁石漠偏灰
        blendStrength: 0.55,
        elevMin: 900, elevMax: 2000
    },
    {
        id: 'qattara_depression',
        name: '卡塔拉洼地',
        type: 'desert',
        center: [29.5, 27.5],
        radii: [1.2, 2.2],
        color: [225, 205, 155],  // 撒哈拉沙漠低地沙黄
        blendStrength: 0.85,
        elevMin: -150, elevMax: 0
    },
    {
        id: 'turpan_depression',
        name: '吐鲁番盆地',
        type: 'desert',
        center: [42.7, 89.2],
        radii: [0.6, 1.2],
        color: [230, 210, 160],  // 西域吐鲁番干旱盆地色
        blendStrength: 0.85,
        elevMin: -160, elevMax: 200
    },

    // === 撒哈拉系（古代自然沙漠，非现代沙化带） ===
    {
        id: 'sahara_west',
        name: '撒哈拉西部',
        type: 'desert',
        center: [23.0, -8.0],
        radii: [6.0, 8.0],
        color: [230, 208, 150],  // 亮沙金
        blendStrength: 0.75,
        elevMin: 0, elevMax: 500
    },
    {
        id: 'sahara_central',
        name: '撒哈拉中部',
        type: 'desert',
        center: [24.0, 4.0],
        radii: [5.0, 7.0],
        color: [228, 206, 150],
        blendStrength: 0.75,
        elevMin: 200, elevMax: 600
    },
    {
        id: 'libyan_desert',
        name: '利比亚沙漠',
        type: 'desert',
        center: [25.0, 22.0],
        radii: [5.0, 8.0],
        color: [230, 208, 152],
        blendStrength: 0.75,
        elevMin: 0, elevMax: 500
    },
    {
        id: 'arabian_desert_egypt',
        name: '阿拉伯沙漠',
        type: 'desert',
        center: [26.0, 33.0],
        radii: [2.5, 4.0],
        color: [225, 203, 148],  // 尼罗河以东荒漠
        blendStrength: 0.7,
        elevMin: 100, elevMax: 900
    },
    {
        id: 'danakil',
        name: '达纳基尔',
        type: 'desert',
        center: [13.5, 41.0],
        radii: [1.5, 2.5],
        color: [220, 200, 150],  // 非洲之角低地荒漠
        blendStrength: 0.65,
        elevMin: -120, elevMax: 400
    },

    // === 阿拉伯半岛 ===
    {
        id: 'rub_al_khali',
        name: '鲁卜哈利',
        type: 'desert',
        center: [21.0, 51.0],
        radii: [4.0, 8.0],
        color: [233, 212, 155],  // 红沙区亮沙
        blendStrength: 0.8,
        elevMin: 50, elevMax: 400
    },
    {
        id: 'an_nafud',
        name: '内夫得',
        type: 'desert',
        center: [28.5, 41.0],
        radii: [2.5, 4.5],
        color: [228, 202, 150],  // 北阿拉伯红沙
        blendStrength: 0.7,
        elevMin: 600, elevMax: 1100
    },
    {
        id: 'syrian_desert',
        name: '叙利亚沙漠',
        type: 'desert',
        center: [33.0, 38.5],
        radii: [3.0, 5.0],
        color: [218, 198, 148],  // 两河以西半荒漠
        blendStrength: 0.65,
        elevMin: 400, elevMax: 900
    },

    // === 伊朗高原 ===
    {
        id: 'dash-e_kavir',
        name: '卡维尔盐漠',
        type: 'desert',
        center: [34.0, 55.0],
        radii: [3.0, 5.5],
        color: [222, 202, 152],  // 盐漠偏灰沙
        blendStrength: 0.7,
        elevMin: 400, elevMax: 900
    },
    {
        id: 'dash-e_lut',
        name: '卢特沙漠',
        type: 'desert',
        center: [30.5, 58.5],
        radii: [2.0, 4.0],
        color: [228, 206, 152],
        blendStrength: 0.7,
        elevMin: 200, elevMax: 800
    },

    // === 中亚（咸海/里海东岸） ===
    {
        id: 'karakum',
        name: '卡拉库姆',
        type: 'desert',
        center: [39.5, 60.5],
        radii: [3.0, 5.0],
        color: [230, 208, 152],  // 黑沙洲沙海
        blendStrength: 0.75,
        elevMin: 0, elevMax: 300
    },
    {
        id: 'kyzylkum',
        name: '克孜勒库姆',
        type: 'desert',
        center: [42.0, 64.5],
        radii: [3.0, 4.5],
        color: [226, 204, 152],  // 红沙洲
        blendStrength: 0.7,
        elevMin: 100, elevMax: 400
    },

    // === 南亚 ===
    {
        id: 'thar',
        name: '塔尔沙漠',
        type: 'desert',
        center: [27.0, 71.0],
        radii: [2.5, 4.5],
        color: [226, 204, 152],  // 印度河以东沙海
        blendStrength: 0.75,
        elevMin: 50, elevMax: 400
    },

    // === 中国西北/蒙古（17 世纪前确定存在的古代沙漠，现代沙化带不录） ===
    {
        id: 'gurbantünggüt',
        name: '古尔班通古特',
        type: 'desert',
        center: [45.2, 87.5],
        radii: [2.0, 4.0],
        color: [226, 204, 152],  // 准噶尔盆地沙海
        blendStrength: 0.7,
        elevMin: 300, elevMax: 800
    },
    {
        id: 'qaidam_gobi',
        name: '柴达木戈壁',
        type: 'desert',
        center: [37.5, 95.5],
        radii: [2.5, 4.5],
        color: [205, 195, 160],  // 高原荒漠偏灰
        blendStrength: 0.65,
        elevMin: 2600, elevMax: 3300
    },
    {
        id: 'gobi_altai',
        name: '外阿尔泰戈壁',
        type: 'desert',
        center: [44.5, 103.5],
        radii: [2.0, 4.0],
        color: [202, 192, 162],  // 蒙古戈壁灰调
        blendStrength: 0.6,
        elevMin: 900, elevMax: 1700
    },

    // === 黄土高原与西北干旱走廊（恢复历史苍茫厚重黄土地貌，保护平原与南方森林） ===
    {
        id: 'loess_plateau',
        name: '黄土高原',
        type: 'loess',
        center: [36.8, 108.8],
        radii: [3.4, 4.8],
        color: [214, 192, 138],  // 苍茫厚重暖土黄
        blendStrength: 0.72,
        elevMin: 580, elevMax: 2400 // 580m以下保护关中/汾河平原绿地，2400m以上保护高山岩石
    },
    {
        id: 'longxi_plateau',
        name: '陇西高原',
        type: 'loess',
        center: [35.5, 104.5],
        radii: [2.0, 2.8],
        color: [212, 190, 140],  // 陇右暖黄土
        blendStrength: 0.68,
        elevMin: 1100, elevMax: 2500
    },
    {
        id: 'hexi_corridor',
        name: '河西走廊',
        type: 'loess',
        center: [39.3, 99.5],
        radii: [2.0, 5.2],
        color: [220, 198, 145],  // 干燥戈壁沙驼黄
        blendStrength: 0.68,
        elevMin: 1000, elevMax: 2500 // 避开祁连山高寒雪峰
    },

    // === 湿地/古湖 ===
    {
        id: 'yunmeng',
        name: '云梦泽',
        type: 'wetland',
        center: [30.3, 113.0],
        radii: [1.0, 1.8],
        color: [115, 140, 110],  // 暗湿地绿
        blendStrength: 0.6,
        elevMin: 0, elevMax: 80
    },
    {
        id: 'baiyangdian',
        name: '白洋淀',
        type: 'wetland',
        center: [38.9, 116.0],
        radii: [0.3, 0.5],
        color: [125, 150, 115],
        blendStrength: 0.55,
        elevMin: 0, elevMax: 30
    },
    {
        id: 'juyan',
        name: '居延泽',
        type: 'ancient_lake',
        center: [41.7, 101.5],
        radii: [0.5, 0.8],
        color: [140, 165, 160],  // 古湖青绿(已干涸)
        blendStrength: 0.5,
        elevMin: 800, elevMax: 1200
    }
];
