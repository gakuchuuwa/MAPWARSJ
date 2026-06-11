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
//   - 岭南南海界（不经过占城据点）: 牡丹社 → 阇槃(必 LINGNAN) → 吴哥(岭南环线西南锚点，文化 LINGNAN)
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
// ── 2026-06-11 文化区界城环线（zoom=6 绘线 + 多边形锚点）──
//
// 环线代称（据点名已删或异写时，锚点 cityId 不变）:
//   威海卫 → city_wendeng 文登（胶东，文化 NORTH）
//   钓鱼岛城 → city_diaoyudao 钓鱼岛（琉球海界，文化 JAPAN）
//   也迷离 → city_emil 也迷里（草原环线锚点，文化 STEPPE）
//   弓月 → city_almaliq 弓月城；江户 → city_edo 江户城
//
// 界城 region 标准（环线锚点 vs 实际文化，主人 2026-06-11 拍板）:
//   据点          cityId              region      说明
//   石门关        city_shimenguan     BASHU       岭南环线西北锚，文化川蜀门户
//   临烝          city_linzheng       JIANGNAN    岭南/南方共用
//   牡丹社        city_mudan          LINGNAN
//   邦敦/三菩     city_bangdun/sanpu  LINGNAN
//   吴哥          city_angkor         LINGNAN     岭南环线西南锚（非滇缅）
//   广陵/襄阳     city_yangzhou/xiangyang JIANGNAN
//   钓鱼岛        city_diaoyudao      JAPAN       南方/日本环线共用
//   宫古岛        city_gugudao        JAPAN
//   江户城        city_edo            JAPAN
//   根城/宗谷     city_genjo/zonggu   JAPAN       宗谷兼东北/朝鲜/日本锚
//   星主厅        city_xingzhuting    KOREA       南方/日本/朝鲜共用（济州）
//   文登          city_wendeng        NORTH       代威海卫，朝鲜环线锚
//   襄平          city_liaoyang       NORTHEAST   东北/朝鲜/草原三圈共用
//   白主~尼布楚   city_baizhu…nibuchu NORTHEAST   东北环线
//   尼布楚        city_nibuchu        NORTHEAST   兼草原环线锚（文化东北）
//   归化城        city_guihua         STEPPE
//   哈密卫        city_hamiwei        WESTERN     草原环线锚，文化西域（非草原）
//   弓月城/也迷里 city_almaliq/emil   STEPPE
//   乌布萨泊~赤塔 city_wubusabo/chita STEPPE
//
// 14 区环线标准（主人 2026-06-11 定稿，zoom=6 绘线唯一来源）:
//   1 中原  汉中→襄阳→广陵→威海卫→肤施→皋兰
//   2 北方  威海卫→肤施→归化→襄平
//   3 东北  襄平→宗谷→白主→诺托罗→囊哈儿→奴儿干→雅克萨→格尔必齐→尼布楚
//   4 朝鲜  襄平→威海卫→广陵→星主厅→宗谷
//   5 日本  钓鱼岛→宫古岛→江户→根城→宗谷→星主厅
//   6 草原  襄平→归化→哈密→弓月→也迷离→乌布萨泊→贝加尔湖畔→赤塔→尼布楚
//   7 河西  皋兰→姑臧→卡克里克→哈密→归化→肤施
//   8 川蜀  襄阳→临烝→石门关→打箭炉→皋兰→汉中
//   9 南方  广陵→襄阳→临烝→牡丹社→钓鱼岛城→星主厅
//  10 岭南  石门关→临烝→牡丹社→邦敦→三菩→吴哥
//  11 滇缅  打箭炉→大研→加德满都→勃固→直通→阿瑜陀耶→吴哥→石门关
//  12 青藏  加德满都→护密城→塔什库尔干→龙木错→卡克里克→姑臧→皋兰→打箭炉→大研
//  13 中亚  塔什库尔干→护密城→马鲁鲁德→彭迪→梅尔夫→玉龙杰赤→养吉干→弓月
//  14 西域  哈密→卡克里克→龙木错→塔什库尔干→弓月（文化西域）
//
// 绘线: RegionBoundaryLayer @ zoom=6（REGION_BOUNDARY_ZOOM），共 14 区
// ============================================================
export const REGION_BOUNDARY_LOOPS: { region: RegionType; cityIds: string[] }[] = [
    { region: 'CENTRAL', cityIds: ['city_hanzhong', 'city_xiangyang', 'city_yangzhou', 'city_wendeng', 'city_fushi', 'city_lanzhou'] },
    { region: 'NORTH', cityIds: ['city_wendeng', 'city_fushi', 'city_guihua', 'city_liaoyang'] },
    { region: 'NORTHEAST', cityIds: ['city_liaoyang', 'city_zonggu', 'city_baizhu', 'city_nuotuoluo', 'city_nanghar', 'city_nuergan', 'city_yakesa', 'city_geerbiqi', 'city_nibuchu'] },
    { region: 'KOREA', cityIds: ['city_liaoyang', 'city_wendeng', 'city_yangzhou', 'city_xingzhuting', 'city_zonggu'] },
    { region: 'JAPAN', cityIds: ['city_diaoyudao', 'city_gugudao', 'city_edo', 'city_genjo', 'city_zonggu', 'city_xingzhuting'] },
    { region: 'STEPPE', cityIds: ['city_liaoyang', 'city_guihua', 'city_hamiwei', 'city_almaliq', 'city_emil', 'city_wubusabo', 'city_xiaoyenisei', 'city_chita', 'city_nibuchu'] },
    { region: 'HEXI', cityIds: ['city_lanzhou', 'city_wuwei', 'city_ruoqiang', 'city_hamiwei', 'city_guihua', 'city_fushi'] },
    { region: 'BASHU', cityIds: ['city_xiangyang', 'city_linzheng', 'city_shimenguan', 'city_dajianlu', 'city_lanzhou', 'city_hanzhong'] },
    { region: 'JIANGNAN', cityIds: ['city_yangzhou', 'city_xiangyang', 'city_linzheng', 'city_mudan', 'city_diaoyudao', 'city_xingzhuting'] },
    { region: 'LINGNAN', cityIds: ['city_shimenguan', 'city_linzheng', 'city_mudan', 'city_bangdun', 'city_sanpu', 'city_angkor'] },
    { region: 'DIANQIAN', cityIds: ['city_dajianlu', 'city_dayan', 'city_kathmandu', 'city_bago', 'city_thaton', 'city_ayutthaya', 'city_angkor', 'city_shimenguan'] },
    { region: 'TIBET', cityIds: ['city_kathmandu', 'city_humicheng', 'city_hepancheng', 'city_longmucuo', 'city_ruoqiang', 'city_wuwei', 'city_lanzhou', 'city_dajianlu', 'city_dayan'] },
    { region: 'CENTRAL_ASIA', cityIds: ['city_hepancheng', 'city_humicheng', 'city_malulude', 'city_pengdi', 'city_merv', 'city_urgench', 'city_yangjigan', 'city_almaliq'] },
    { region: 'WESTERN', cityIds: ['city_hamiwei', 'city_ruoqiang', 'city_longmucuo', 'city_hepancheng', 'city_almaliq'] },
];

/** 界城环线配色（与 REGION_LABELS 对应，zoom=6 虚线） */
export const REGION_BOUNDARY_COLORS: Record<RegionType, string> = {
    CENTRAL: '#8d6e63',
    NORTH: '#5d4037',
    JIANGNAN: '#1565c0',
    LINGNAN: '#e65100',
    BASHU: '#2e7d32',
    DIANQIAN: '#6a1b9a',
    HEXI: '#bf360c',
    WESTERN: '#f9a825',
    TIBET: '#00838f',
    STEPPE: '#c0a050',
    NORTHEAST: '#388e3c',
    KOREA: '#7b1fa2',
    JAPAN: '#c2185b',
    CENTRAL_ASIA: '#455a64',
};

const REGIONS: { id: RegionType; polygon: {lat:number,lng:number}[] }[] = [
    { id: 'CENTRAL', polygon: [{lat:33.07,lng:107.02},{lat:32.01,lng:112.12},{lat:32.45,lng:119.40},{lat:37.51,lng:122.12},{lat:36.59,lng:109.48},{lat:36.04,lng:103.82}] },
    { id: 'NORTH', polygon: [{lat:37.51,lng:122.12},{lat:36.59,lng:109.48},{lat:40.84,lng:111.68},{lat:37.20,lng:122.05}] },
    { id: 'NORTHEAST', polygon: [{lat:41.27,lng:123.17},{lat:45.50,lng:141.93},{lat:46.71,lng:142.52},{lat:49.20,lng:143.10},{lat:52.21,lng:141.95},{lat:52.92,lng:139.77},{lat:53.39,lng:124.08},{lat:53.33,lng:121.45},{lat:51.99,lng:116.58}] },
    { id: 'KOREA', polygon: [{lat:41.27,lng:123.17},{lat:37.20,lng:122.05},{lat:32.45,lng:119.40},{lat:33.51,lng:126.52},{lat:45.50,lng:141.93}] },
    { id: 'JAPAN', polygon: [{lat:25.75,lng:123.50},{lat:24.81,lng:125.28},{lat:35.68,lng:139.76},{lat:40.50,lng:141.46},{lat:45.50,lng:141.93},{lat:33.51,lng:126.52}] },
    { id: 'WESTERN', polygon: [{lat:42.83,lng:93.51},{lat:38.99,lng:88.95},{lat:34.57,lng:80.35},{lat:37.77,lng:75.23},{lat:44.10,lng:79.81}] },
    { id: 'HEXI', polygon: [{lat:36.04,lng:103.82},{lat:37.93,lng:102.64},{lat:38.99,lng:88.95},{lat:42.83,lng:93.51},{lat:40.84,lng:111.68},{lat:36.59,lng:109.48}] },
    { id: 'STEPPE', polygon: [{lat:41.27,lng:123.17},{lat:40.84,lng:111.68},{lat:42.83,lng:93.51},{lat:43.98,lng:79.65},{lat:46.48,lng:83.63},{lat:49.98,lng:92.09},{lat:51.84,lng:107.61},{lat:52.03,lng:113.50},{lat:51.99,lng:116.58}] },
    { id: 'BASHU', polygon: [{lat:32.01,lng:112.12},{lat:26.89,lng:112.60},{lat:28.08,lng:104.25},{lat:30.05,lng:101.96},{lat:36.04,lng:103.82},{lat:33.07,lng:107.02}] },
    { id: 'JIANGNAN', polygon: [{lat:32.45,lng:119.40},{lat:32.01,lng:112.12},{lat:26.89,lng:112.60},{lat:22.20,lng:120.83},{lat:25.75,lng:123.50},{lat:33.51,lng:126.52}] },
    { id: 'LINGNAN', polygon: [{lat:28.08,lng:104.25},{lat:26.89,lng:112.60},{lat:22.20,lng:120.83},{lat:12.87,lng:107.80},{lat:12.77,lng:105.97},{lat:13.41,lng:103.87}] },
    { id: 'DIANQIAN', polygon: [{lat:30.05,lng:101.96},{lat:26.87,lng:100.22},{lat:27.72,lng:85.19},{lat:17.33,lng:96.47},{lat:16.53,lng:97.63},{lat:14.35,lng:100.58},{lat:12.77,lng:105.97},{lat:28.08,lng:104.25}] },
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
//    - 二者独立: 例: 姑臧 是 HEXI 中心, 但等级 medium_city
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
    DIANQIAN:     ['city_ayutthaya'],                // 阿瑜陀耶 (主人 2026-06-11 改: 原羊苴咩城; 阿瑜陀耶更靠边陲, 远征纵深更足)
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
