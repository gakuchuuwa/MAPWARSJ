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

/**
 * 🔴 [2026-08-29 修复·地中海冬天结冰] 从 URL 加载 world-base.png 并注入查找表。
 *
 *    此前 `setWorldBaseData` 定义了但**全项目零调用点**——`store` 恒为 null，
 *    `queryWinterSnow` 恒返回 null，`isSnowArea` 落回「纯纬度估算」兜底，
 *    把地中海（巴勒莫/罗得岛/克里特，最冷月 8~12°C 从不结冰）判成雪区，
 *    战术背景图冬天出了 ic2 结冰水面 + ice_beach 结冰海滩。此函数在启动时调用一次补上。
 *
 *    返回 true 表示数据已就绪；加载失败返回 false，调用方回退到纬度估算（配合
 *    isSnowArea 里的 mediterranean 兜底，地中海永不出冰）。
 */
export async function loadWorldBaseData(url: string): Promise<boolean> {
    if (store) return true;
    try {
        const resp = await fetch(url);
        if (!resp.ok) return false;
        const blob = await resp.blob();
        // createImageBitmap 优先（走 GPU 解码），老环境回退 <img>
        let bmp: ImageBitmap | null = null;
        try {
            bmp = await createImageBitmap(blob);
        } catch {
            bmp = null;
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return false;
        let W: number, H: number;
        if (bmp) {
            W = bmp.width; H = bmp.height;
            canvas.width = W; canvas.height = H;
            ctx.drawImage(bmp, 0, 0);
        } else {
            const img = await new Promise<HTMLImageElement>((res, rej) => {
                const i = new Image();
                i.onload = () => res(i);
                i.onerror = () => rej(new Error('image decode failed'));
                i.src = url;
            });
            W = img.naturalWidth; H = img.naturalHeight;
            canvas.width = W; canvas.height = H;
            ctx.drawImage(img, 0, 0);
        }
        // 🔴 数据在 RGB 三通道，alpha 全 255，getImageData 的 alpha 预乘不改变 RGB。
        const imgData = ctx.getImageData(0, 0, W, H);
        setWorldBaseData(imgData.data, W, H);
        bmp?.close();
        return true;
    } catch (e) {
        console.warn('[WorldBaseMap] world-base.png 加载失败，冬季积雪回退纬度估算', e);
        return false;
    }
}

export interface WorldBaseQuery {
    lat: number;
    lng: number;
    /** 攻城战 = 城郊踩踏裸土；野战 = 荒野原貌 */
    isSiege: boolean;
    /** 冬季走另一套通道（长期积雪地区换雪地） */
    isWinter: boolean;
    /** 据点建筑风格（66 种二/三级风格或 16 种一级风格）：作为底图设计的第一层基调 */
    buildingStyle?: string;
}

/** 66 种二/三级建筑风格 → 16 种一级建筑风格母体映射（无 DOM 依赖，供 Worker 与战术层同源调用） */
const STYLE_TO_BASE16: Readonly<Record<string, string>> = {
    ASIA: 'ASIA', CENTRAL: 'ASIA', WEI: 'ASIA', BASHU: 'ASIA', JIANGNAN: 'ASIA',
    NORTHEAST: 'ASIA', KOREA: 'ASIA', JAPAN: 'ASIA', KHITAN: 'ASIA', XIANBEI: 'ASIA', MONGOL: 'ASIA', YURT: 'ASIA',
    WEST: 'WEST', FRANKS: 'WEST', GERMANIC: 'WEST', BRITONS: 'WEST', CELTS: 'WEST',
    BURGUNDIANS: 'WEST', GOTHS: 'WEST', VIKINGS: 'WEST', SAXONS: 'WEST', DANES: 'WEST', VARANGIANS: 'WEST',
    EAST: 'EAST', BYZANTINE: 'EAST', ARMENIANS: 'EAST', GEORGIANS: 'EAST',
    SLAV: 'SLAV', SLAVIC: 'SLAV', POLES: 'SLAV', LITHUANIANS: 'SLAV', BOHEMIANS: 'SLAV', BULGARIANS: 'SLAV', MAGYAR: 'SLAV',
    MEDI: 'MEDI', LATIN: 'MEDI', SPANISH: 'MEDI', PORTUGUESE: 'MEDI', SICILIANS: 'MEDI', ROMA: 'MEDI', ITALIANS: 'MEDI',
    GREEK: 'GREEK', GREECE: 'GREEK', ATHENIANS: 'GREEK', SPARTANS: 'GREEK', MACEDONIAN: 'GREEK',
    THRACIAN: 'THRACIAN',
    ORIE: 'ORIE',
    PERSIAN: 'PERSIAN', SASANIAN: 'PERSIAN', ACHAEMENIDS: 'PERSIAN',
    CEAS: 'CEAS', WESTERN: 'CEAS', CENTRAL_ASIA: 'CEAS', CUMAN: 'CEAS', TURKS: 'CEAS', HUNS: 'CEAS',
    PURU: 'PURU', TIBET: 'PURU',
    INDI: 'INDI', INDIA: 'INDI', MUGHAL: 'INDI', BENGALIS: 'INDI', GURJARAS: 'INDI',
    SEAS: 'SEAS', VIETNAMESE: 'SEAS', BURMESE: 'SEAS', KHMER: 'SEAS', MALAY: 'SEAS',
    AFRI: 'AFRI', BERBER: 'AFRI', ETHIOPIANS: 'AFRI', AFRICA: 'AFRI',
    MESO: 'MESO', AMERICA: 'MESO', MAYANS: 'MESO',
    ANDE: 'ANDE', INCA: 'ANDE', MUISCA: 'ANDE', MAPUCHE: 'ANDE', TUPI: 'ANDE',
};

/**
 * 将 world-base.png 中因 18km 网格山麓落差产生的 `rck`（编号 20，岩石配属图不当底色）
 * 与低海拔河谷误判的 `gravel_default`（编号 13）还原为真实气候底图（由同像素 R 通道 siegeCode 推导）。
 */
function resolveRawFieldTile(siegeCode: number, fieldCode: number, lat: number, lng: number): string | null {
    const inLoessOrHexi = lat >= 33.5 && lat <= 41.5 && lng >= 99.5 && lng <= 112.0;
    const inCoreTibet = lat >= 27.5 && lat <= 36.6 && lng >= 76.0 && lng <= 101.0;

    // 1. rck（编号 20）只做陡坡配属斑块，绝不当整场主底图（2026-08-23 主人定）
    if (fieldCode === 20) {
        switch (siegeCode) {
            case 1: return inLoessOrHexi ? 'ds2' : 'ds5'; // 极旱山麓（姑臧/高阙塞→黄土 ds2；石头城/巴里坤/佩特拉→戈壁沙砾 ds5）
            case 2: return 'ds2';                         // 半干旱黄土山麓（赤乌堡/伏俟城/大散关/汶山城/索格狄亚那岩→黄土荒原 ds2）
            case 3: return 'gr3';                         // 温带山林关隘（兴势山/库尔泰亚→半干草地 gr3）
            case 4: return (lat >= 20 && lat <= 30 && lng >= 95 && lng <= 106) ? 'gr2' : 'gr6'; // 亚热带山地（永昌/马丘比丘）
            case 5: return 'gr4';                         // 黑土/湿润河谷
            case 6: return 'gr7';                         // 草原山麓（碎叶/赤谷城/居鲁士城/尼沙布尔/大马士革→干草原 gr7）
            case 7: return 'sno';                         // 终年积雪高山
            default: return 'ds2';
        }
    }

    // 2. gravel_default（编号 13，高山砾石）若落在河西/陇右/黄土河谷（非青藏高原核心区），还原为黄土河谷 ds2
    if (fieldCode === 13 && siegeCode === 2 && inLoessOrHexi && !inCoreTibet) {
        return 'ds2';
    }

    return FIELD_TILES[fieldCode] ?? null;
}

/**
 * 以 16 种一级建筑风格为基础底座 + 66 种二/三级子风格与局部地理气候微调底图。
 */
export function refineBaseTileWithBuildingStyle(
    rawTile: string,
    buildingStyle: string | undefined,
    lat: number,
    lng: number,
    isSiege: boolean,
    isWinter: boolean,
): string {
    // 冬季已进入积雪贴图（sno/sn2/snf/snd）时，保持积雪状态（攻城踩实雪地基 snd，野战保留原雪地）
    if (isWinter && (rawTile === 'sno' || rawTile === 'sn2' || rawTile === 'snf' || rawTile === 'snd')) {
        return isSiege ? 'snd' : rawTile;
    }
    if (!buildingStyle) return rawTile;

    const sub = buildingStyle.toUpperCase();
    const base16 = STYLE_TO_BASE16[sub] ?? sub;
    const isAridRaw = rawTile === 'pal' || rawTile === 'des' || rawTile === 'ds5' || rawTile === 'qs' || rawTile === 'pal1';

    switch (base16) {
        case 'ASIA': {
            if (sub === 'KHITAN') {
                // 河西走廊 / 西夏塞上（lng < 106.5）：西段极旱绿洲（敦煌/玉门关/阳关/赤金堡）用戈壁沙砾 ds5/des，中东段（姑臧/赤乌堡/张掖/皋兰/枹罕/伏俟城）用西北黄土荒原 ds2（与东亚温带 gr2/ds3 严格区分）
                if (lng < 106.5) {
                    if (isSiege) return (lng < 99.5 || isAridRaw) ? 'des' : 'ds2';
                    return (lng < 99.5 || isAridRaw) ? 'ds5' : 'ds2';
                }
                // 辽西 / 燕北契丹（临潢/大定）：塞外干草原 gr7 / 草原泥地 gr5
                return isSiege ? 'gr5' : (isAridRaw ? 'ds5' : 'gr7');
            }
            if (sub === 'XIANBEI') {
                // 漠南鲜卑 / 阴山河套：塞外干草原 gr7（毛乌素/高阙塞干旱缘用戈壁沙砾 ds5），攻城用草原地 gr5（与东亚 gr2/ds3 严格区分）
                if (isSiege) return isAridRaw ? 'ds2' : 'gr5';
                return isAridRaw ? 'ds5' : 'gr7';
            }
            if (sub === 'MONGOL' || sub === 'YURT') {
                // 漠北蒙古：蒙古干枯大草原 gr7 与大戈壁 ds5，攻城用草原牧场 gr5（绝不用东亚农耕 gr2/ds3）
                if (isSiege) return isAridRaw ? 'ds5' : 'gr5';
                return isAridRaw ? 'ds5' : 'gr7';
            }
            if (sub === 'NORTHEAST') {
                // 东北黑土与寒温带针阔林海（gr4 黑土 / underbrush_leaves 针叶林地，与关内温带绿草 gr2 区分）
                if (isSiege) return 'gr4';
                return (rawTile === 'gr4' || rawTile === 'underbrush_leaves') ? rawTile : 'gr4';
            }
            if (sub === 'JAPAN' || sub === 'KOREA') {
                // 日本 / 朝鲜：温带湿润绿草 gr2 / grs
                if (isSiege) return 'ds3';
                return (rawTile === 'grs' || rawTile === 'gr2' || rawTile === 'for') ? rawTile : 'gr2';
            }
            if (sub === 'JIANGNAN') {
                // 江南水乡（lat >= 27.5）黑泥水田 gr4/grs；岭南闽浙台（lat < 27.5）亚热带丛林草 gr6/gr2
                if (lat >= 27.5) {
                    if (isSiege) return 'gr4';
                    return (rawTile === 'gr4' || rawTile === 'grs' || rawTile === 'qs2' || rawTile === 'sh4') ? rawTile : 'gr4';
                }
                if (isSiege) return 'ds4';
                return (rawTile === 'gr6' || rawTile === 'fo2' || rawTile === 'grs') ? rawTile : 'gr6';
            }
            if (sub === 'BASHU') {
                // 秦岭/陇南关隘（lat >= 32.5）用温带半干草/黄土 gr3/ds2；巴蜀盆地与云贵用盆地红壤/绿草 ds4/gr2
                if (lat >= 32.5) {
                    if (isSiege) return 'ds2';
                    return (rawTile === 'ds2' || rawTile === 'gr3' || rawTile === 'for') ? rawTile : 'gr3';
                }
                if (isSiege) return 'ds4';
                return (rawTile === 'gr2' || rawTile === 'grs' || rawTile === 'gr6' || rawTile === 'fo2' || rawTile === 'ds4') ? rawTile : 'gr2';
            }
            // CENTRAL / WEI（中原、关中、陇右、华北）：黄土高原段用 ds2，中原华北与关中平原用温带草地 gr2/gr3 + 攻城 ds3
            const inLoessPlateau = lng < 111.5 && lat >= 34.2 && (rawTile === 'ds2' || rawTile === 'gr7' || isAridRaw || lng < 107.2);
            if (inLoessPlateau) return 'ds2';
            if (isSiege) return 'ds3';
            return (rawTile === 'gr2' || rawTile === 'gr3' || rawTile === 'grs' || rawTile === 'gr4') ? rawTile : 'gr2';
        }

        case 'CEAS': {
            if (sub === 'WESTERN') {
                // 西域（塔里木/吐鲁番/天山/帕米尔）：与东亚彻底区分 —— 盆地沙海用 des，罗布泊盐壳用 pal1，天山/昆仑戈壁绿洲一律用戈壁沙砾 ds5，攻城用极旱沙土 des
                if (rawTile === 'pal1') return isSiege ? 'des' : 'pal1';
                if (isSiege) return 'des';
                if (rawTile === 'pal' || rawTile === 'des' || rawTile === 'qs') return 'des';
                return 'ds5';
            }
            if (sub === 'CUMAN' || sub === 'TURKS' || sub === 'HUNS') {
                // 钦察-哈萨克大草原：干草原 gr7 / 草原泥地 gr5
                if (isSiege) return 'gr5';
                return isAridRaw ? 'ds5' : 'gr7';
            }
            // CENTRAL_ASIA（河中/呼罗珊/七河/阿富汗）：沙漠用 des/ds5，绿洲与河谷草原用 ds2/gr7
            if (isAridRaw) return isSiege ? 'des' : 'ds5';
            if (isSiege) return 'ds2';
            return (rawTile === 'ds2' || rawTile === 'gr7') ? rawTile : 'gr7';
        }

        case 'PURU': {
            if (sub === 'TIBET') {
                // 青藏高原吐蕃：与东亚彻底区分 —— 野战与攻城一律用青藏高山砾石冻土 gravel_default（仅柴达木盐泽保留 pal1）
                if (rawTile === 'pal1') return 'pal1';
                return 'gravel_default';
            }
            // PURU（五河流域旁遮普 / 健驮逻）：半干旱冲积平原 ds2 / gr3
            if (isSiege) return 'ds2';
            return (rawTile === 'ds2' || rawTile === 'gr3' || rawTile === 'gr5' || rawTile === 'ds4') ? rawTile : 'ds2';
        }

        case 'ORIE': {
            // 中东（阿拉伯/两河/埃及/黎凡特）：沙漠用 pal/des，黎凡特/叙利亚半干旱区用 ds2/gr7
            if (isSiege) return isAridRaw ? 'des' : 'ds2';
            if (isAridRaw) return rawTile === 'pal1' ? 'pal1' : (rawTile === 'ds5' ? 'ds5' : 'pal');
            return (rawTile === 'ds2' || rawTile === 'gr7' || rawTile === 'gr3') ? rawTile : 'ds2';
        }

        case 'PERSIAN': {
            // 波斯（伊朗高原/帕提亚/两河东麓）：高原黄土 ds2 与干草原 gr7，卡维尔/卢特盐漠保留 pal1
            if (rawTile === 'pal1') return isSiege ? 'des' : 'pal1';
            if (isSiege) return isAridRaw ? 'des' : 'ds2';
            if (isAridRaw) return 'ds5';
            return (rawTile === 'ds2' || rawTile === 'gr7') ? rawTile : 'ds2';
        }

        case 'INDI': {
            if (sub === 'BENGALIS') {
                return isSiege ? 'gr4' : ((rawTile === 'sh4' || rawTile === 'qs2' || rawTile === 'gr4') ? rawTile : 'gr4');
            }
            if (sub === 'GURJARAS') {
                return isSiege ? 'ds2' : (isAridRaw ? 'ds5' : 'ds2');
            }
            if (isSiege) return 'ds4';
            return (rawTile === 'ds4' || rawTile === 'gr5' || rawTile === 'gr6') ? rawTile : 'ds4';
        }

        case 'SEAS': {
            // 东南亚（越南/缅甸/高棉/马来）：与东亚温带草 gr2/ds3 彻底区分 —— 野战一律用热带深绿丛林草地 gr6，攻城一律用热带红壤 ds4
            if (isSiege) return 'ds4';
            return 'gr6';
        }

        case 'WEST': {
            // 西欧（含不列颠/法兰克/日耳曼/北欧）：温带海洋性深绿草地 gr2 / grs / gr3
            if (isSiege) return 'ds3';
            return (rawTile === 'grs' || rawTile === 'gr2' || rawTile === 'gr3' || rawTile === 'for') ? rawTile : 'gr2';
        }

        case 'EAST': {
            // 东南欧（拜占庭/亚美尼亚/格鲁吉亚）：温带半干草地 gr3 / gr2
            if (isSiege) return 'ds3';
            return (rawTile === 'gr3' || rawTile === 'gr2' || rawTile === 'gr7' || rawTile === 'for') ? rawTile : 'gr3';
        }

        case 'SLAV': {
            // 东北欧（斯拉夫/波兰/立陶宛/波西米亚/保加利亚/马扎尔）：黑土 gr4 与半干草林 gr3
            if (isSiege) return rawTile === 'gr4' ? 'gr4' : 'ds3';
            return (rawTile === 'gr4' || rawTile === 'gr3' || rawTile === 'gr2' || rawTile === 'for' || rawTile === 'underbrush_leaves') ? rawTile : 'gr3';
        }

        case 'MEDI':
        case 'GREEK': {
            // 地中海 & 希腊：地中海夏旱草地 gr7 / gr3 / ds2
            if (isSiege) return 'ds2';
            return (rawTile === 'gr7' || rawTile === 'gr3' || rawTile === 'ds2' || rawTile === 'gr2') ? rawTile : 'gr7';
        }

        case 'THRACIAN': {
            // 色雷斯：巴尔干半干草地 gr3
            if (isSiege) return 'ds3';
            return (rawTile === 'gr3' || rawTile === 'gr2' || rawTile === 'gr7') ? rawTile : 'gr3';
        }

        case 'AFRI': {
            if (sub === 'BERBER') {
                // 北非马格里布与撒哈拉绿洲：撒哈拉腹地用 pal/des，马格里布海岸高原用 ds2/gr7
                if (lat < 26.0 || isAridRaw) return isSiege ? 'des' : 'pal';
                return isSiege ? 'ds2' : ((rawTile === 'ds2' || rawTile === 'gr7' || rawTile === 'gr3') ? rawTile : 'ds2');
            }
            // 撒哈拉以南非洲（埃塞俄比亚/西非/东非）：萨凡纳稀树草原 gr5 或丛林草 gr6
            if (isSiege) return rawTile === 'gr6' ? 'ds4' : 'gr5';
            return (rawTile === 'gr5' || rawTile === 'gr6' || rawTile === 'fo2' || rawTile === 'gr7') ? rawTile : 'gr5';
        }

        case 'MESO': {
            // 中美：墨西哥高原用 ds3/gr7，玛雅/加勒比热带用 gr6
            if (sub === 'MAYANS' || lat < 18.5) {
                return isSiege ? 'ds4' : 'gr6';
            }
            if (isSiege) return 'ds3';
            return (rawTile === 'ds3' || rawTile === 'gr7' || rawTile === 'gr3' || rawTile === 'gr6') ? rawTile : 'ds3';
        }

        case 'ANDE': {
            if (sub === 'TUPI') {
                return isSiege ? 'ds4' : 'gr6';
            }
            // 安第斯山脉（印加/穆伊斯卡/马普切）：山地黄土 ds2 与高山草地 gr3
            if (isSiege) return 'ds2';
            return (rawTile === 'ds2' || rawTile === 'gr3' || rawTile === 'gr7' || rawTile === 'gr2') ? rawTile : 'ds2';
        }

        default:
            return rawTile;
    }
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
                if (q.isWinter && winterFlag > 0 && winterFlag !== 4) {
                    // 3=雪林地（林区）  2=深雪（极寒/终年冰冻）  1=雪地
                    const code = winterFlag === 3 ? 23 : winterFlag === 2 ? 22 : 21;
                    const snowTile = FIELD_TILES[code] ?? null;
                    return snowTile && q.buildingStyle
                        ? refineBaseTileWithBuildingStyle(snowTile, q.buildingStyle, q.lat, q.lng, q.isSiege, true)
                        : snowTile;
                }
                const rawTile = resolveRawFieldTile(siegeCode, fieldCode, q.lat, q.lng);
                if (!rawTile) return null;
                return q.buildingStyle
                    ? refineBaseTileWithBuildingStyle(rawTile, q.buildingStyle, q.lat, q.lng, q.isSiege, false)
                    : rawTile;
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
