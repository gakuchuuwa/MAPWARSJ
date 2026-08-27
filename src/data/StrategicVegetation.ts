/**
 * 战略大地图自然植被部署数据表 (Strategic Map Vegetation)
 * 按地理经纬度分布各气候带自然林木与特色树种
 */

export interface StrategicTree {
    id: string;
    name: string;
    asset: string;       // SUCAI_NATURE 目录名，如 PEACH_BLOSSOM, ASIAN_PINE, BAMBOO
    lat: number;
    lng: number;
    scale?: number;      // 缩放倍率 (默认 1.0)
    region?: string;
}

export const STRATEGIC_VEGETATION: StrategicTree[] = [
    // 🌸 1. 日本本州·关西与中部（樱花、红枫、黑松、竹林）
    { id: 'tree_jp_yoshino_1', name: '吉野山千本樱', asset: 'PEACH_BLOSSOM', lat: 34.360, lng: 135.860, scale: 1.1, region: 'JAPAN' },
    { id: 'tree_jp_yoshino_2', name: '吉野山樱林', asset: 'PEACH_BLOSSOM', lat: 34.340, lng: 135.880, scale: 0.95, region: 'JAPAN' },
    { id: 'tree_jp_arashiyama', name: '岚山竹海', asset: 'BAMBOO', lat: 35.015, lng: 135.670, scale: 1.05, region: 'JAPAN' },
    { id: 'tree_jp_fuji_pine1', name: '富士山麓黑松', asset: 'ASIAN_PINE', lat: 35.330, lng: 138.710, scale: 1.15, region: 'JAPAN' },
    { id: 'tree_jp_fuji_pine2', name: '青木原松林', asset: 'ASIAN_PINE', lat: 35.450, lng: 138.650, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_biwa_willow', name: '琵琶湖畔垂柳', asset: 'WILLOW', lat: 35.280, lng: 136.080, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_hakone_maple', name: '箱根芦之湖秋枫', asset: 'ASIAN_MAPLE_AUTUMN', lat: 35.205, lng: 139.010, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_nikko_maple', name: '日光中禅寺青枫', asset: 'ASIAN_MAPLE_GREEN', lat: 36.740, lng: 139.500, scale: 1.05, region: 'JAPAN' },
    { id: 'tree_jp_kumano_pine', name: '熊野古道古松', asset: 'ASIAN_PINE', lat: 33.840, lng: 135.770, scale: 1.1, region: 'JAPAN' },
    { id: 'tree_jp_kiso_hinoki', name: '木曾山林', asset: 'ASIAN_PINE', lat: 35.850, lng: 137.680, scale: 1.05, region: 'JAPAN' },

    // 🍁 2. 日本本州·关东与东北（山樱、秋枫、奥羽山脉松林、白桦）
    { id: 'tree_jp_matsushima', name: '松岛古松', asset: 'ASIAN_PINE', lat: 38.370, lng: 141.060, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_hirosaki_sakura', name: '弘前山樱', asset: 'PEACH_BLOSSOM', lat: 40.600, lng: 140.460, scale: 1.05, region: 'JAPAN' },
    { id: 'tree_jp_ou_pine', name: '奥羽山脉针叶林', asset: 'ASIAN_PINE', lat: 39.500, lng: 140.800, scale: 1.1, region: 'JAPAN' },
    { id: 'tree_jp_bandai_maple', name: '磐梯山红叶', asset: 'ASIAN_MAPLE_AUTUMN', lat: 37.600, lng: 140.050, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_echigo_pine', name: '越后山林', asset: 'ASIAN_PINE', lat: 37.050, lng: 138.800, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_chichibu_green', name: '秩父林海', asset: 'ASIAN_MAPLE_GREEN', lat: 35.980, lng: 138.950, scale: 1.0, region: 'JAPAN' },

    // 🌊 3. 日本·中国地方与濑户内海（山樱、竹林、黑松）
    { id: 'tree_jp_miyajima_sakura', name: '严岛弥山山樱', asset: 'PEACH_BLOSSOM', lat: 34.280, lng: 132.320, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_izumo_pine', name: '出云松林', asset: 'ASIAN_PINE', lat: 35.400, lng: 133.000, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_bingo_bamboo', name: '备后竹海', asset: 'BAMBOO', lat: 34.650, lng: 133.300, scale: 0.95, region: 'JAPAN' },

    // ⛰️ 4. 日本·四国与九州（竹林、古松、棕榈）
    { id: 'tree_jp_iya_bamboo', name: '四国祖谷溪竹林', asset: 'BAMBOO', lat: 33.880, lng: 133.820, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_aso_pine', name: '阿苏山松林', asset: 'ASIAN_PINE', lat: 32.880, lng: 131.100, scale: 1.05, region: 'JAPAN' },
    { id: 'tree_jp_kirishima_pine', name: '雾岛山林', asset: 'ASIAN_PINE', lat: 31.900, lng: 130.850, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_yakushima_cedar', name: '屋久岛古林', asset: 'ASIAN_PINE', lat: 30.350, lng: 130.520, scale: 1.2, region: 'JAPAN' },
    { id: 'tree_jp_nichinan_palm', name: '日南海岸棕榈', asset: 'PALM', lat: 31.600, lng: 131.400, scale: 0.9, region: 'JAPAN' },

    // ❄️ 5. 日本·北海道（白桦、雪松、寒带针叶）
    { id: 'tree_jp_daisetsu_birch', name: '大雪山白桦林', asset: 'BIRCH_GREEN', lat: 43.660, lng: 142.850, scale: 1.05, region: 'JAPAN' },
    { id: 'tree_jp_shikotsu_pine', name: '支笏湖冷杉林', asset: 'ASIAN_PINE', lat: 42.750, lng: 141.300, scale: 1.0, region: 'JAPAN' },
    { id: 'tree_jp_shiretoko_snow', name: '知床雪松', asset: 'SNOW_PINE', lat: 44.100, lng: 145.100, scale: 1.1, region: 'JAPAN' },
    { id: 'tree_jp_furano_birch', name: '富良野白桦', asset: 'BIRCH_GREEN', lat: 43.350, lng: 142.400, scale: 0.95, region: 'JAPAN' },
];
