/**
 * 世界底图查找表：任意经纬度 → 这一战用哪张地面贴图。
 *
 * 数据来自 public/world/world-base.png（2160×1080 RGB，167 KB），由
 * tools/build-world-base-map.py 按真实气候数据离线烘出来：
 *   R = 攻城战底图编号（非冬季）
 *   G = 野战底图编号（非冬季）
 *   B = 冬季状态标志：0=冬天不积雪  1=雪地  2=深雪  3=雪林地
 *
 * 🔴 数据绝不能放 alpha 通道！canvas 的 getImageData 会做 **alpha 预乘**——
 *    alpha 值只有 1~24 时 RGB 会被乘以 alpha/255 直接毁掉，查出来全是 0。
 *    （踩过：atlas 里长安查出 pm1 牧场而不是 ds3，就是这么来的。）
 *    所以冬季底图由 B 通道的标志**推导**，不单独存一层。
 *
 * 判据与分配的完整说明见 docs/02-design/climate-regions.md。三条要点：
 *   1. 底图只能是纯地表材质——森林是树的组合（第二层），不做底图；
 *      但「矮树丛」系列是森林里没树的地面（林下落叶层），可以做底图。
 *   2. 农田/道路/牧场是第二层配属，不是底图。
 *   3. 雪原/冰原不是地理类型而是**季节状态**，所以冬季单独一个通道，
 *      不占地理分类的位置（否则冬天的类会把西伯利亚这类地方永久吃掉）。
 *
 * 🔴 这里的编号→贴图名必须与 tools/build-world-base-map.py 里的 SIEGE / FIELD 表一致。
 *    改一边就要改另一边，否则查出来的地面会整体错位。
 */

/** 攻城战底图。编号 = PNG 的 R/G 通道值。 */
const SIEGE_TILES: Readonly<Record<number, string>> = {
    1: 'des',   // 泥地 —— 极旱绿洲城（敦煌、和田、吐鲁番、巴格达）
    2: 'ds2',   // 泥地 2 —— 黄土城（黄土高原、河西、青藏河谷、中亚）
    3: 'ds3',   // 泥地 3 —— 温带城（中原、日本、朝鲜、欧洲）
    4: 'ds4',   // 泥地 4 —— 红土城（印度、伊朗高原、澳洲）
    5: 'gr4',   // 泥地，污泥 —— 黑土/水稻土城（江南、东北、乌克兰）
    6: 'gr5',   // 泥地，大草原 —— 草原城（蒙古、中亚）
    7: 'snd',   // 雪地，地基 —— 雪原城 + 冬季长期积雪区
};

/** 野战底图。编号 = PNG 的 B/A 通道值。21~24 只会出现在冬季通道。 */
const FIELD_TILES: Readonly<Record<number, string>> = {
    1: 'grs',                // 草地 1 —— 湿润草地（西欧、日本、江南）
    2: 'gr2',                // 草地 2 —— 温带草地（中原、朝鲜、中欧）
    3: 'gr3',                // 草地 3 —— 半干草地（关中、东欧）
    4: 'gr6',                // 草，丛林 —— 丛林草地（岭南、东南亚）
    5: 'gr7',                // 草地，干枯 —— 干草原（蒙古、中亚）
    6: 'for',                // 矮树丛 —— 温带林地（中原山林、欧洲）
    7: 'fo2',                // 矮树丛，丛林 —— 热带林地（滇缅、南洋）
    8: 'underbrush_leaves',  // 矮树丛，叶子 —— 针叶林地（东北、西伯利亚）
    9: 'pal',                // 砂质沙漠（塔克拉玛干、阿拉伯）
    10: 'qs',                // 沙漠，流沙（沙漠腹地沙丘）
    11: 'pal1',              // 裂开的沙漠 —— 干涸盐湖（罗布泊、咸海）
    12: 'ds5',               // 沙砾，沙漠 —— 戈壁（哈密、蒙古南缘）
    13: 'gravel_default',    // 沙砾，默认 —— 高山砾石（青藏、帕米尔）
    14: 'ds2',               // 泥地 2 —— 黄土荒原
    15: 'ds4',               // 泥地 4 —— 红土荒原（德干、澳洲北）
    16: 'gr4',               // 泥地，污泥 —— 黑土荒原（东北、乌克兰）
    17: 'gr5',               // 泥地，大草原 —— 萨凡纳（东非、德干）
    18: 'qs2',               // 湿地，沼泽（云梦泽、三江平原）
    19: 'sh4',               // 湿地，浅滩（河口、湖滨）
    20: 'rck',               // 岩石 —— 陡峻山地露岩
    21: 'sno',               // 雪地 —— 冬季雪原
    22: 'sn2',               // 雪（松软）—— 冬季深雪（极地、高山）
    23: 'snf',               // 矮树丛，积雪 —— 冬季雪林地
    24: 'ice',               // 冰原 —— 冻结水面（水域层用，陆地不会出现）
};

interface WorldBaseData {
    width: number;
    height: number;
    /** RGBA，长度 = width*height*4 */
    pixels: Uint8ClampedArray;
}

let store: WorldBaseData | null = null;

/**
 * 注入查找图数据。浏览器侧从 <img>/fetch 解码后调用，Node 侧用 sharp 读 raw 后调用。
 * 模块本身不做加载，避免把浏览器 API 绑进只跑数据的路径里。
 */
export function setWorldBaseData(pixels: Uint8ClampedArray, width: number, height: number): void {
    if (pixels.length !== width * height * 4) {
        throw new Error(`world-base 数据长度不符：${pixels.length} vs ${width * height * 4}`);
    }
    store = { width, height, pixels };
}

export function hasWorldBaseData(): boolean {
    return store !== null;
}

export interface WorldBaseQuery {
    lat: number;
    lng: number;
    /** 攻城战 = 城郊踩踏裸土；野战 = 荒野原貌 */
    isSiege: boolean;
    /** 冬季走另一套通道（长期积雪地区换雪地） */
    isWinter: boolean;
}

/**
 * 查一个经纬度该用哪张底图。数据未注入或落在海面上时返回 null，
 * 调用方负责回退（不要在这里编一个默认值——那会掩盖数据缺失）。
 */
export function queryBaseTile(q: WorldBaseQuery): string | null {
    if (!store) return null;
    const { width: W, height: H, pixels } = store;

    const fx = ((q.lng + 180) / 360) * W;
    const fy = ((90 - q.lat) / 180) * H;
    const x0 = ((Math.floor(fx) % W) + W) % W;
    const y0 = Math.max(0, Math.min(H - 1, Math.floor(fy)));

    // 城常建在河口/海岸，正中那一格可能落在海面（无数据）。
    // 向外找最近的有效格，最多 4 圈（≈70km），再远就不是采样误差了。
    for (let r = 0; r <= 4; r++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (r > 0 && Math.max(Math.abs(dy), Math.abs(dx)) !== r) continue;
                const y = y0 + dy;
                if (y < 0 || y >= H) continue;
                const x = ((x0 + dx) % W + W) % W;
                const i = (y * W + x) * 4;
                const siegeCode = pixels[i];
                const fieldCode = pixels[i + 1];
                const winterFlag = pixels[i + 2];
                if (siegeCode === 0 && fieldCode === 0) continue;   // 海面，继续往外找

                // 🔴 标志 4 = 零星残雪（最冷月 -3~+2°C，会下雪但存不住）：
                //    **底图不换**，仍用非冬季那张；雪由引擎在上面铺少量斑块表现。
                //    见 climate-regions.md §5.6.17。
                if (q.isSiege) {
                    // 冬季长期积雪 → 城郊是踩实的雪地地基
                    if (q.isWinter && winterFlag > 0 && winterFlag !== 4) return SIEGE_TILES[7] ?? null;
                    return SIEGE_TILES[siegeCode] ?? null;
                }
                if (q.isWinter && winterFlag > 0 && winterFlag !== 4) {
                    // 3=雪林地（林区）  2=深雪（极寒/终年冰冻）  1=雪地
                    const code = winterFlag === 3 ? 23 : winterFlag === 2 ? 22 : 21;
                    return FIELD_TILES[code] ?? null;
                }
                return FIELD_TILES[fieldCode] ?? null;
            }
        }
    }
    return null;
}

/**
 * 这个坐标冬天积不积雪。0=不积雪 1=雪地 2=深雪 3=雪林地 **4=零星残雪**；查不到返回 null。
 *
 * 🔴 [2026-08-24] 判积雪只认这一份数据，别再自己按纬度估。
 *    旧的 `isSnowArea` 对「温带中高纬」一律返回 true，于是**罗得岛、克里特岛、
 *    底比斯这些爱琴海城冬天结了冰**——地中海从不结冰，是硬伤。
 *    这里的标志来自 WorldClim 实测气温，和底图同源，一处真相。
 */
export function queryWinterSnow(lat: number, lng: number): number | null {
    if (!store) return null;
    const { width: W, height: H, pixels } = store;
    const fx = ((lng + 180) / 360) * W;
    const fy = ((90 - lat) / 180) * H;
    const x0 = ((Math.floor(fx) % W) + W) % W;
    const y0 = Math.max(0, Math.min(H - 1, Math.floor(fy)));
    // 与 queryBaseTile 同一套「向外找最近有效格」，否则海岸城会查空
    for (let r = 0; r <= 4; r++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (r > 0 && Math.max(Math.abs(dy), Math.abs(dx)) !== r) continue;
                const y = y0 + dy;
                if (y < 0 || y >= H) continue;
                const x = ((x0 + dx) % W + W) % W;
                const i = (y * W + x) * 4;
                if (pixels[i] === 0 && pixels[i + 1] === 0) continue;   // 海面
                return pixels[i + 2];
            }
        }
    }
    return null;
}

/** 调试用：把编号表暴露出去，便于工具打印「这一格是什么」 */
export function baseTileTables(): { siege: Readonly<Record<number, string>>; field: Readonly<Record<number, string>> } {
    return { siege: SIEGE_TILES, field: FIELD_TILES };
}
