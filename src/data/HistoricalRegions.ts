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
    type: 'desert' | 'wetland' | 'ancient_lake';
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
