import { CityType } from '../types/core';
import { CITY_CONFIG } from '../config/CityConfig';
import { getCityExclusiveIconPath } from './city-marker/CityExclusiveIcons';
// import { resolvePath } from '../utils/PathUtils';

function resolvePath(path: string): string {
    return path;
}

// 1. Definition of Regions and Styles
// ============================================================
// [REFACTOR 2026-05-28] 14 文化区方案 (MIN 并入 LINGNAN)
// 福建并入岭南 — 闽据点少 (5个), 历史上五代闽国虽独立但语言/宗族与岭南互动密
// ----------
// 中国汉地核心 4: CENTRAL / NORTH / JIANGNAN / LINGNAN
// 中国西南     2: BASHU / DIANQIAN
// 中国西部边疆 3: HEXI / WESTERN / TIBET
// 塞外+邻邦 5: STEPPE / NORTHEAST / KOREA / JAPAN / CENTRAL_ASIA
// ============================================================
export type RegionType =
    | 'CENTRAL'       // 中原 (豫、关中、晋南)
    | 'NORTH'         // 北方 (河北、山东、晋北)
    | 'JIANGNAN'      // 江南 (长江中下游、湘鄂赣浙)
    | 'LINGNAN'       // 岭南 (粤、桂、海南、福建)    ← 已含原 MIN
    | 'BASHU'         // 巴蜀 (川渝)
    | 'DIANQIAN'      // 滇黔 (云贵、川西)
    | 'HEXI'          // 河西陇右 (甘肃走廊、陇右)
    | 'WESTERN'       // 西域 (塔里木、北疆)
    | 'TIBET'         // 吐蕃 (西藏、青海、川甘藏区)
    | 'STEPPE'        // 塞外 (蒙古高原、含西伯利亚)
    | 'NORTHEAST'     // 东北 (满洲、通古斯)
    | 'KOREA'         // 朝鲜
    | 'JAPAN'         // 日本
    | 'CENTRAL_ASIA'; // 中亚伊斯兰 (粟特、河中、大食)

// Valid region list for validation
export const REGION_ORDER: RegionType[] = [
    'CENTRAL', 'NORTH', 'JIANGNAN', 'LINGNAN',
    'BASHU', 'DIANQIAN', 'HEXI', 'WESTERN', 'TIBET',
    'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA'
];

// [UI] Display labels (Chinese + English code)
// 用于 CityEditor 等 UI 动态生成 region 下拉
export const REGION_LABELS: Record<RegionType, string> = {
    CENTRAL: '中原',
    NORTH: '北方',
    JIANGNAN: '南方',
    LINGNAN: '岭南',  // 含福建
    BASHU: '川蜀',
    DIANQIAN: '滇缅',
    HEXI: '河西',
    WESTERN: '西域',
    TIBET: '青藏',
    STEPPE: '草原',
    NORTHEAST: '东北',
    KOREA: '朝鲜',
    JAPAN: '日本',
    CENTRAL_ASIA: '中亚'
};

// [LEGACY] 向后兼容旧 region 字符串
// cities_v2.ts 里有 58 处旧 region 字段。此映射只处理 "纯改名" 情况
// （旧区和新区的地理范围完全一致，只是名字变了）。
//
// ⚠️ 已被"拆分"的旧名（如 CHU_SHU → BASHU/DIANQIAN 两个）不放在这里！
//    那种情况下：把翻译留空 → 走到下面的 REGION_ORDER 检查 → fail
//    → 自动 fallthrough 到 getRegion(lat, lng) 坐标判定 → 自动得到正确的新区。
//
// 新数据请直接用新枚举值，不要再用旧名。
const LEGACY_REGION_MAP: Record<string, RegionType> = {
    'SOUTH': 'JIANGNAN',            // 纯改名 (boundary 完全一致)
    // 'CHU_SHU': 不放！让坐标自动判定走 getRegion() 分到 BASHU 或 DIANQIAN
    'NORTHWEST': 'HEXI',            // 纯改名
    'NOMADIC': 'STEPPE',            // 纯改名
    'CENTRAL_WORLD': 'CENTRAL_ASIA',// 纯改名
    'WEST_WORLD': 'CENTRAL_ASIA',   // 合并 (老 WEST_WORLD 范围已被 getRegion 自动归中亚)
    'TROPICS': 'LINGNAN',           // 合并 (老 TROPICS 范围已被 getRegion 自动归岭南)
    'SIBERIA': 'STEPPE',            // 合并 (老 SIBERIA 已被 getRegion 自动归塞外)
    'MIN': 'LINGNAN',               // [2026-05-28] 合并: 14 区方案, 福建归岭南
    'SOUTH_HEMISPHERE': 'CENTRAL',  // fallback (不该出现)
    'NEW_WORLD': 'CENTRAL',         // fallback (不该出现)
};

export type CityScale = 'big' | 'medium' | 'small' | 'pass';

// 2. Polygon Definitions (Approximate Geographic Boundaries)
interface Point { lat: number; lng: number; }
type Polygon = Point[];

// === Region Definitions (Polygons DELETED) ===
// Legacy polygon data removed to enforce strict Latitude/Longitude logic.

// 3. Region Deterministic Logic
// ============================================================
// [REFACTOR 2026-05-29 v4] 14 文化区判定流程
//
// v4 修正:
//   - TIBET lat 上限 38→37 (让出武威 37.93 给 HEXI)
//   - HEXI 大扩: lng 93-111 (西吃玉门关/敦煌, 东吃陕北延安/统万/河套)
//   - WESTERN lng 收到 75-93 (让 HEXI 优先)
// v3 (2026-05-28):
//   - 福建 → LINGNAN (取消独立 MIN, 14 区)
//   - 东南亚: 越南柬+粤桂海 → LINGNAN, 泰缅 → DIANQIAN
//   - 岭南南海界（不经过占城据点）: 牡丹社 → 阇槃(必 LINGNAN) → 吴哥(岭南/滇缅角点)
//   - 藏南/尼泊尔/列城 → TIBET
//   - 远北/远东 → NORTHEAST (东北扩大)
//   - 中亚收紧 lng < 75
//   - 琉球 → JAPAN
//
// 个别据点 explicit override (cities_v2.ts region 字段):
//   - 归化城 → STEPPE (蒙古土默特部都城)
//   - 伊犁固尔札 → STEPPE (准噶尔汗国都城)
//   - 松州 → TIBET (川西藏羌)
// ============================================================
const REGIONS: { id: RegionType; polygon: {lat:number,lng:number}[] }[] = [
    { id: 'CENTRAL', polygon: [{lat:33.07,lng:107.02},{lat:32.01,lng:112.12},{lat:32.45,lng:119.40},{lat:37.51,lng:122.12},{lat:36.59,lng:109.48},{lat:36.04,lng:103.82}] },
    { id: 'NORTH', polygon: [{lat:37.51,lng:122.12},{lat:36.59,lng:109.48},{lat:40.84,lng:111.68},{lat:41.27,lng:123.17}] },
    { id: 'NORTHEAST', polygon: [{lat:41.27,lng:123.17},{lat:41.13,lng:126.19},{lat:41.80,lng:140.10},{lat:52.21,lng:141.95},{lat:49.25,lng:118.26}] },
    { id: 'KOREA', polygon: [{lat:41.27,lng:123.17},{lat:37.51,lng:122.12},{lat:32.45,lng:119.40},{lat:34.20,lng:129.29},{lat:41.80,lng:140.10},{lat:41.13,lng:126.19}] },
    { id: 'JAPAN', polygon: [{lat:41.80,lng:140.10},{lat:34.20,lng:129.29},{lat:32.45,lng:119.40},{lat:28.45,lng:129.67},{lat:35.68,lng:139.76},{lat:38.99,lng:141.12},{lat:40.50,lng:141.46}] },
    { id: 'WESTERN', polygon: [{lat:42.83,lng:93.51},{lat:38.99,lng:88.95},{lat:34.57,lng:80.35},{lat:37.77,lng:75.23},{lat:44.10,lng:79.81}] },
    { id: 'HEXI', polygon: [{lat:36.04,lng:103.82},{lat:37.93,lng:102.64},{lat:38.99,lng:88.95},{lat:42.83,lng:93.51},{lat:40.84,lng:111.68},{lat:36.59,lng:109.48}] },
    { id: 'STEPPE', polygon: [{lat:41.27,lng:123.17},{lat:40.84,lng:111.68},{lat:42.83,lng:93.51},{lat:44.10,lng:79.81},{lat:46.48,lng:83.63},{lat:47.79,lng:88.12},{lat:49.95,lng:92.10},{lat:49.66,lng:95.77},{lat:50.32,lng:106.49},{lat:49.25,lng:118.26}] },
    { id: 'BASHU', polygon: [{lat:32.01,lng:112.12},{lat:26.89,lng:112.60},{lat:28.08,lng:104.25},{lat:30.05,lng:101.96},{lat:36.04,lng:103.82},{lat:33.07,lng:107.02}] },
    { id: 'JIANGNAN', polygon: [{lat:32.45,lng:119.40},{lat:32.01,lng:112.12},{lat:26.89,lng:112.60},{lat:28.45,lng:129.67}] },
    { id: 'LINGNAN', polygon: [{lat:28.08,lng:104.25},{lat:26.89,lng:112.60},{lat:28.45,lng:129.67},{lat:26.22,lng:127.72},{lat:22.20,lng:120.83},{lat:13.93,lng:109.11},{lat:13.41,lng:103.86}] },
    { id: 'DIANQIAN', polygon: [{lat:30.05,lng:101.96},{lat:26.87,lng:100.22},{lat:27.72,lng:85.19},{lat:17.33,lng:96.47},{lat:16.53,lng:97.63},{lat:14.35,lng:100.58},{lat:13.41,lng:103.86},{lat:28.08,lng:104.25}] },
    { id: 'TIBET', polygon: [{lat:27.72,lng:85.19},{lat:36.73,lng:71.61},{lat:37.77,lng:75.23},{lat:34.57,lng:80.35},{lat:38.99,lng:88.95},{lat:37.93,lng:102.64},{lat:36.04,lng:103.82},{lat:30.05,lng:101.96},{lat:26.87,lng:100.22}] },
    { id: 'CENTRAL_ASIA', polygon: [{lat:37.77,lng:75.23},{lat:36.73,lng:71.61},{lat:35.58,lng:63.31},{lat:36.00,lng:62.70},{lat:37.62,lng:62.23},{lat:42.24,lng:59.63},{lat:43.30,lng:68.27},{lat:44.10,lng:79.81}] },
];

export function getRegion(lat: number, lng: number): RegionType {
    for (const region of REGIONS) {
        const poly = region.polygon;
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].lng, yi = poly[i].lat;
            const xj = poly[j].lng, yj = poly[j].lat;
            const d = Math.sqrt((lat - yi) ** 2 + (lng - xi) ** 2);
            if (d < 0.01) return region.id;
            if (((yi >= lat) !== (yj >= lat)) && (lng <= (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
        }
        if (inside) return region.id;
    }
    return 'CENTRAL';
}
// 4. Hybrid City Region Detection (Explicit Override + Auto-detection)
export function getCityRegion(city: { latitude: number; longitude: number; region?: string }): RegionType {
    // Priority 1: Explicit region override (含旧名翻译)
    if (city.region) {
        // 旧名 → 新名 翻译 (向后兼容 cities_v2.ts 里 58 处遗留值)
        const translated = LEGACY_REGION_MAP[city.region] ?? city.region;
        if (REGION_ORDER.includes(translated as RegionType)) {
            return translated as RegionType;
        }
        // 未知 region 字符串 → 落入坐标自动判定
    }
    // Priority 2: Auto-detect from coordinates
    return getRegion(city.latitude, city.longitude);
}

// 4. Style Mapping Table — 15 文化区
// ============================================================
// 注释 ✅ = 已有自己的 PNG；⚠️ = 暂用兜底 PNG（待美术补图）
// 暂用兜底的 region 后续补图只需把路径里的旧名替换成新名即可。
// ============================================================
const STYLE_MAP: Record<RegionType, { small: string, medium: string, big: string, pass: string }> = {
    // === 中国汉地核心 ===
    CENTRAL: { // ✅ 已有
        small: resolvePath('/cities/central_small.png'),
        medium: resolvePath('/cities/central_medium.png'),
        big: resolvePath('/cities/central_big.png'),
        pass: resolvePath('/cities/central_pass.png')
    },
    NORTH: { // ✅ 已有
        small: resolvePath('/cities/north_small.png'),
        medium: resolvePath('/cities/north_medium.png'),
        big: resolvePath('/cities/north_big.png'),
        pass: resolvePath('/cities/north_pass.png')
    },
    JIANGNAN: { // ✅ 继承原 SOUTH 全部 PNG (south_*.png)
        small: resolvePath('/cities/south_small.png'),
        medium: resolvePath('/cities/south_medium.png'),
        big: resolvePath('/cities/south_big.png'),
        pass: resolvePath('/cities/south_pass.png')
    },
    LINGNAN: { // ✅ 已有 (范围收窄，福建剥离到 MIN)
        small: resolvePath('/cities/lingnan_small.png'),
        medium: resolvePath('/cities/lingnan_medium.png'),
        big: resolvePath('/cities/lingnan_big.png'),
        pass: resolvePath('/cities/lingnan_pass.png')
    },

    // === 中国南方/西南 ===
    BASHU: { // ✅ 继承原 CHU_SHU 全部 PNG (chushu_*.png) - 川渝盆地素材
        small: resolvePath('/cities/chushu_small.png'),
        medium: resolvePath('/cities/chushu_medium.png'),
        big: resolvePath('/cities/chushu_big.png'),
        pass: resolvePath('/cities/chushu_pass.png')
    },
    DIANQIAN: { // ✅ 已有
        small: resolvePath('/cities/dianqian_small.png'),
        medium: resolvePath('/cities/dianqian_medium.png'),
        big: resolvePath('/cities/dianqian_big.png'),
        pass: resolvePath('/cities/dianqian_pass.png')
    },

    // === 中国西部边疆 ===
    HEXI: { // ✅ 继承原 NORTHWEST 全部 PNG (northwest_*.png)
        small: resolvePath('/cities/northwest_small.png'),
        medium: resolvePath('/cities/northwest_medium.png'),
        big: resolvePath('/cities/northwest_big.png'),
        pass: resolvePath('/cities/northwest_pass.png')
    },
    WESTERN: { // ✅ 已有
        small: resolvePath('/cities/western_small.png'),
        medium: resolvePath('/cities/western_medium.png'),
        big: resolvePath('/cities/western_big.png'),
        pass: resolvePath('/cities/western_pass.png')
    },
    TIBET: { // ✅ 已有 (范围扩到含青海+川西甘孜)
        small: resolvePath('/cities/tibet_small.png'),
        medium: resolvePath('/cities/tibet_medium.png'),
        big: resolvePath('/cities/tibet_big.png'),
        pass: resolvePath('/cities/tibet_pass.png')
    },

    // === 塞外 + 邻邦 ===
    STEPPE: { // ✅ 继承原 NOMADIC 全部 PNG (nomadic_*.png)，吞掉原 SIBERIA
        small: resolvePath('/cities/nomadic_small.png'),
        medium: resolvePath('/cities/nomadic_medium.png'),
        big: resolvePath('/cities/nomadic_big.png'),
        pass: resolvePath('/cities/nomadic_pass.png')
    },
    NORTHEAST: { // ✅ 已有
        small: resolvePath('/cities/northeast_small.png'),
        medium: resolvePath('/cities/northeast_medium.png'),
        big: resolvePath('/cities/northeast_big.png'),
        pass: resolvePath('/cities/northeast_pass.png')
    },
    KOREA: { // ✅ 已有
        small: resolvePath('/cities/korea_small.png'),
        medium: resolvePath('/cities/korea_medium.png'),
        big: resolvePath('/cities/korea_big.png'),
        pass: resolvePath('/cities/korea_pass.png')
    },
    JAPAN: { // ✅ 已有
        small: resolvePath('/cities/japan_small.png'),
        medium: resolvePath('/cities/japan_medium.png'),
        big: resolvePath('/cities/japan_big.png'),
        pass: resolvePath('/cities/japan_pass.png')
    },
    CENTRAL_ASIA: {
        small: resolvePath('/cities/central_asia_small.png'),
        medium: resolvePath('/cities/central_asia_medium.png'),
        big: resolvePath('/cities/central_asia_big.png'),
        pass: resolvePath('/cities/central_asia_pass.png')
    }
};

// 5. Main Accessor
export function getCityImage(city: { lat?: number; lng?: number; latitude?: number; longitude?: number; type: CityType; id: string; region?: string }): string {
    // Resolve Coordinates (Support both CityData and Runtime City)
    const lat = city.lat ?? city.latitude;
    const lng = city.lng ?? city.longitude;

    if (lat === undefined || lng === undefined) {
        console.warn(`[RegionSystem] City ${city.id} missing coordinates!`);
        return resolvePath('/cities/city_small.png');
    }

    const exclusiveIcon = getCityExclusiveIconPath(city.id);
    if (exclusiveIcon) {
        return resolvePath(exclusiveIcon);
    }

    // 其它 zhiding 专属（西方等）
    if (city.id === 'city_rome') return resolvePath('/cities/zhiding/luoma.png');
    if (city.id === 'city_alexandria') return resolvePath('/cities/zhiding/yalishanda.png');
    if (city.id === 'city_antioch') return resolvePath('/cities/zhiding/antiaoke.png');
    if (city.id === 'city_damascus') return resolvePath('/cities/zhiding/damashige.png');
    if (city.id === 'city_jerusalem') return resolvePath('/cities/zhiding/yelusaleng.png');
    if (city.id === 'city_baghdad') return resolvePath('/cities/zhiding/bageda.png');
    if (city.id === 'city_constantinople') return resolvePath('/cities/zhiding/junshitanding.png');
    if (city.id === 'city_venice') return resolvePath('/cities/zhiding/weinisi.png');
    if (city.id === 'city_ctesiphon') return resolvePath('/cities/zhiding/taixifeng.png');
    if (city.id === 'city_rayy') return resolvePath('/cities/zhiding/leiyi.png');

    // const config = CITY_CONFIG[city.type]; // Removed dependency
    let scale: CityScale = 'small';

    if (city.type === 'big_city') {
        scale = 'big';
    } else if (city.type === 'medium_city') {
        scale = 'medium';
    } else if (city.type === 'pass') {
        scale = 'pass';
    } else {
        scale = 'small';
    }

    // 3. Identify Region (Hybrid: Explicit Override + Auto-detection)
    const region = getCityRegion({ latitude: lat as number, longitude: lng as number, region: city.region });

    // 4. Map to Image
    const styleSet = STYLE_MAP[region];
    let image = styleSet[scale];

    // Fallback if specific scale is missing in some sparse sets
    if (!image) image = styleSet.small;

    return image;
}




// ═══════════════════════════════════════════════════════════════
// 【15 区中心 — 2026-05-30 立】
//
// 14 文化区, 但 CENTRAL (中原) 双核 = 长安 + 洛阳, 故 15 个中心。
//
// 用途:
//   1. 道路骨架: 同区据点向中心连接 (build_region_skeleton.mjs 待写)
//   2. AI 战略目标: 占领区中心 = 控制全区
//   3. UI: 区中心可高亮 / 渲染特殊符号
//
// ⚠️ 此处的"中心" ≠ big_city
//    - 区中心是 "文化-政治意义的核心"
//    - big_city 是 "累计国都年 ≥ 92 或人口 ≥ 50万"
//    - 二者独立: 例: 羊苴咩城 是 DIANQIAN 中心, 但等级 medium_city
//                    临淄 可为 medium_city, 但不是 NORTH 中心 (北京才是)
//
// ⚠️ 任何 AI 不许擅自改变这 15 个 cityId
//    增减需项目主人 (人类) 显式同意 + 同步更新 AGENTS.md §七
// ═══════════════════════════════════════════════════════════════

export const REGION_CENTERS: Record<RegionType, string[]> = {
    CENTRAL:      ['city_changan', 'city_luoyang'], // 长安 + 洛阳 (双核)
    NORTH:        ['city_beijing'],                  // 北京
    JIANGNAN:     ['city_nanjing'],                  // 南京
    LINGNAN:      ['city_panyu'],                    // 番禺 (古名, 即广州)
    BASHU:        ['city_chengdu'],                  // 成都
    DIANQIAN:     ['city_dali_city'],                // 羊苴咩城 (大理国都)
    HEXI:         ['city_wuwei'],                    // 姑臧 (古名, 即凉州/武威)
    WESTERN:      ['city_yiluolucheng'],             // 伊逻卢城 (龟兹国都; 延城)
    TIBET:        ['city_luoxie'],                   // 逻些 (古名, 即拉萨)
    STEPPE:       ['city_karakorum'],                // 哈拉和林
    NORTHEAST:    ['city_ningan'],                   // 龙泉府 (渤海上京)
    KOREA:        ['city_kaesong'],                  // 开城 (高丽都)
    JAPAN:        ['city_kyoto'],                    // 京都 (平安京)
    CENTRAL_ASIA: ['city_samaerhan'],                // 撒马尔罕
};

/** 辅助: 判断某城是否为某区的核心城 */
export function isRegionCenter(cityId: string): boolean {
    return Object.values(REGION_CENTERS).some(arr => arr.includes(cityId));
}

/** 辅助: 取某区的中心 cityId 列表 (CENTRAL 返回 2 个, 其他返回 1 个) */
export function getRegionCenters(region: RegionType): string[] {
    return REGION_CENTERS[region] || [];
}
