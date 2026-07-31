// Test new bounding logic
function getRegionNew(lat, lng) {
    // 1) 远北: lat > 50
    if (lat > 50.0) return (lng > 120.0) ? 'NORTHEAST' : 'STEPPE';

    // 2) 高原 (含藏南/尼泊尔/不丹/拉达克列城)
    if (lat > 26.0 && lat <= 37.0 && lng >= 76.0 && lng < 103.0) return 'TIBET';

    // 4) 西域
    if (lat >= 35.0 && lat <= 44.0 && lng >= 75.0 && lng < 93.0) return 'WESTERN';

    // 5) 中亚
    if (lng < 75.0) return 'CENTRAL_ASIA';

    // 6) 塞外 (蒙古高原, 41-50N, lng <= 120)
    if (lat > 41.0 && lng <= 120.0) return 'STEPPE';

    // 7) 东北
    if (lat > 40.0 && lng > 120.0) return 'NORTHEAST';

    // 8) 日本
    if (lng > 127.0) return 'JAPAN';

    // 9) 朝鲜 (123-127E, > 33N, 收窄)
    if (lat > 33.0 && lng > 123.0 && lng <= 127.0) return 'KOREA';

    // === 新的 5 区核心逻辑 (安阳-延安-天水-汉中-寿春 体系) ===
    // 限制在核心区经纬度范围内再做精细划分
    
    // 工具函数：计算点 (lat, lng) 在线段 P1(lat1, lng1)-P2(lat2, lng2) 的左右
    // 给定 lat，求该线段上的 lngBoundary
    function getLngBoundary(targetLat, lat1, lng1, lat2, lng2) {
        if (targetLat > Math.max(lat1, lat2) || targetLat < Math.min(lat1, lat2)) return null;
        if (lat1 === lat2) return lng1;
        return lng1 + (targetLat - lat1) * (lng2 - lng1) / (lat2 - lat1);
    }
    // 给定 lng，求该线段上的 latBoundary
    function getLatBoundary(targetLng, lat1, lng1, lat2, lng2) {
        if (targetLng > Math.max(lng1, lng2) || targetLng < Math.min(lng1, lng2)) return null;
        if (lng1 === lng2) return lat1;
        return lat1 + (targetLng - lng1) * (lat2 - lat1) / (lng2 - lng1);
    }

    // A: 延安 (36.6, 109.5)
    // B: 天水 (34.6, 105.7)
    // C: 汉中 (33.1, 107.0)
    // D: 寿春 (32.6, 116.8)
    
    // 判断河西 (HEXI) - 延安-天水线以西
    // 对于 lat > 36.6 (延安以北到41)，西界假设为 109.5
    if (lat > 36.6 && lat <= 41.0 && lng >= 93.0 && lng < 109.5) return 'HEXI';
    // 延安到天水段
    if (lat > 34.6 && lat <= 36.6 && lng >= 93.0) {
        let lngBound = getLngBoundary(lat, 36.6, 109.5, 34.6, 105.7);
        if (lng < lngBound) return 'HEXI';
    }

    // 判断巴蜀 (BASHU) 与滇黔 (DIANQIAN) - 天水-汉中线以西/以南
    // 东南亚 (LINGNAN/DIANQIAN)
    if (lat <= 26.0 && lng >= 92.0 && lng < 102.0) return 'DIANQIAN';
    if (lat <= 26.0 && lng >= 102.0) return 'LINGNAN';
    
    // 岭南 (福建/两广/海南) -> 简化为旧逻辑
    if (lat > 23.5 && lat <= 28.0 && lng > 116.0 && lng <= 120.5) return 'LINGNAN'; // 福建
    
    // 天水到汉中段 (判断巴蜀西界)
    if (lat > 33.1 && lat <= 34.6) {
        let lngBound = getLngBoundary(lat, 34.6, 105.7, 33.1, 107.0);
        if (lng < lngBound) return 'BASHU';
    }
    // 汉中以南 (lat <= 33.1)，四川盆地
    if (lat <= 33.1 && lng > 98.0 && lng <= 111.0) {
        // 川渝盆地
        if (lat > 28.0 && lng > 103.0 && lng <= 110.0) return 'BASHU';
        if (lng <= 110.0) return 'DIANQIAN'; // 剩余云贵
    }

    // 南方 (JIANGNAN) - 汉中-寿春线以南
    if (lng > 107.0 && lng <= 124.0) {
        let latBound = 32.6; // 寿春以东，默认 32.6
        if (lng <= 116.8) {
            latBound = getLatBoundary(lng, 33.1, 107.0, 32.6, 116.8);
        }
        if (lat <= latBound) {
            // 排除掉福建和两广的范围
            if (!(lat > 23.5 && lat <= 28.0 && lng > 116.0 && lng <= 120.5) && !(lat <= 26.0 && lng >= 102.0)) {
                return 'JIANGNAN';
            }
        }
    }

    // 北方 (NORTH) - 安阳 36.1 以北
    if (lat > 36.1 && lng > 109.5 && lng <= 124.0) return 'NORTH';

    // 剩下的是中原 (CENTRAL)
    if (lng > 105.7 && lng <= 124.0) return 'CENTRAL';

    return 'UNKNOWN';
}

const testCities = [
    {name: '洛阳', lat: 34.61, lng: 112.45},
    {name: '长安', lat: 34.26, lng: 108.93},
    {name: '天水', lat: 34.58, lng: 105.73}, // 边界
    {name: '武威', lat: 37.93, lng: 102.64},
    {name: '汉中', lat: 33.07, lng: 107.02}, // 边界
    {name: '成都', lat: 30.66, lng: 104.06},
    {name: '南京', lat: 32.06, lng: 118.79}, // 寿春32.6以南，江南
    {name: '寿春', lat: 32.59, lng: 116.80}, // 边界
    {name: '安阳', lat: 36.10, lng: 114.39}, // 边界
    {name: '北京', lat: 39.90, lng: 116.40},
    {name: '徐州', lat: 34.20, lng: 117.18}, // 中原
    {name: '延安', lat: 36.60, lng: 109.48},
    {name: '广州', lat: 23.12, lng: 113.26},
    {name: '平壤', lat: 39.03, lng: 125.76},
];

testCities.forEach(c => {
    console.log(`${c.name}: ${getRegionNew(c.lat, c.lng)}`);
});
