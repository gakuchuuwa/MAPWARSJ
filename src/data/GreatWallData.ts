import { CITIES_V2 } from './cities_v2';
import { VECTOR_ROAD_DATA } from './VectorRoadData';

export interface GreatWallSegmentDef {
    id: string;
    name: string;
    startCityId: string;
    endCityId: string;
    /** 若与已有矢量道路重合，填对应 roadId，自动复用该道路坐标 */
    roadId?: string;
    /** 尚未入路网的关隘衔接段：按 [lng, lat] 给出的路线坐标 */
    coordinates?: [number, number][];
    /** 史实修筑年代（暂供后续年份闸门使用） */
    startYear: number;
    endYear?: number;
}

/**
 * 战略地图长城主线定义（西起嘉峪关，东至山海关）。
 *
 * 当前用于第一阶段线路预览（复用已有路网片段 + 补齐宁武关-雁门关、紫荆关-居庸关-古北口-卢龙塞-山海关等长城脊线）；
 * 待线路确认后，再按同样结构接入战略路网并沿线铺设 DE 垛墙素材。
 */
export const GREAT_WALL_SEGMENTS: readonly GreatWallSegmentDef[] = [
    {
        id: 'gw_jiuquan_zhangye',
        name: '嘉峪关-张掖',
        startCityId: 'city_jiuquan',
        endCityId: 'city_zhangye',
        roadId: 'road_city_zhangye_city_jiuquan_1785352160810',
        startYear: 1372,
    },
    {
        id: 'gw_zhangye_shandan',
        name: '张掖-删丹',
        startCityId: 'city_zhangye',
        endCityId: 'city_shandan',
        roadId: 'road_city_shandan_city_zhangye_1782744184845',
        startYear: 1372,
    },
    {
        id: 'gw_shandan_fanhe',
        name: '删丹-番禾',
        startCityId: 'city_shandan',
        endCityId: 'city_fanhe',
        roadId: 'road_city_shandan_city_fanhe_1794806872940',
        startYear: 1372,
    },
    {
        id: 'gw_fanhe_wuwei',
        name: '番禾-姑臧',
        startCityId: 'city_fanhe',
        endCityId: 'city_wuwei',
        roadId: 'road_city_wuwei_city_fanhe_1794806865842',
        startYear: 1372,
    },
    {
        id: 'gw_wuwei_chiwubao',
        name: '姑臧-赤乌堡',
        startCityId: 'city_wuwei',
        endCityId: 'city_chiwubao',
        roadId: 'road_city_chiwubao_city_wuwei_1784292944789',
        startYear: 1372,
    },
    {
        id: 'gw_chiwubao_aowei',
        name: '赤乌堡-媪围',
        startCityId: 'city_chiwubao',
        endCityId: 'city_aowei',
        roadId: 'road_city_chiwubao_city_aowei_1789322075113',
        startYear: 1372,
    },
    {
        id: 'gw_aowei_mingsha',
        name: '媪围-鸣沙',
        startCityId: 'city_aowei',
        endCityId: 'city_mingsha',
        roadId: 'road_city_mingsha_city_aowei_1780158823056',
        startYear: 1372,
    },
    {
        id: 'gw_mingsha_lingzhou',
        name: '鸣沙-回乐',
        startCityId: 'city_mingsha',
        endCityId: 'city_lingzhou',
        roadId: 'road_city_mingsha_city_lingzhou_1780869177084',
        startYear: 1372,
    },
    {
        id: 'gw_lingzhou_quyancheng',
        name: '回乐-朐衍',
        startCityId: 'city_lingzhou',
        endCityId: 'city_quyancheng',
        roadId: 'road_city_quyancheng_city_lingzhou_1783509525173',
        startYear: 1372,
    },
    {
        id: 'gw_quyancheng_jingbianbao',
        name: '朐衍-靖边堡',
        startCityId: 'city_quyancheng',
        endCityId: 'city_jingbianbao',
        coordinates: [
            [107.4078, 37.7794],
            [107.62, 37.62],
            [108.05, 37.53],
            [108.48, 37.52],
            [108.8608, 37.5685],
        ],
        startYear: 1474,
    },
    {
        id: 'gw_jingbianbao_tongwancheng',
        name: '靖边堡-统万城',
        startCityId: 'city_jingbianbao',
        endCityId: 'city_tongwancheng',
        roadId: 'road_city_tongwancheng_city_jingbianbao_1783508882110',
        startYear: 1474,
    },
    {
        id: 'gw_tongwancheng_yulin',
        name: '统万城-榆林',
        startCityId: 'city_tongwancheng',
        endCityId: 'city_yulin',
        roadId: 'road_city_tongwancheng_city_yulin_1783507055293',
        startYear: 1474,
    },
    {
        id: 'gw_yulin_fugu',
        name: '榆林-府谷',
        startCityId: 'city_yulin',
        endCityId: 'city_fuzhou_fugu',
        roadId: 'road_city_yulin_city_fuzhou_fugu_1783507116299',
        startYear: 1474,
    },
    {
        id: 'gw_fugu_piantouguan',
        name: '府谷-偏头关',
        startCityId: 'city_fuzhou_fugu',
        endCityId: 'city_piantouguan',
        roadId: 'road_city_fuzhou_fugu_city_piantouguan_1780158230196',
        startYear: 1390,
    },
    {
        id: 'gw_piantouguan_ningwuguan',
        name: '偏头关-宁武关',
        startCityId: 'city_piantouguan',
        endCityId: 'city_ningwuguan',
        roadId: 'road_city_piantouguan_city_ningwuguan_1780158230136',
        startYear: 1450,
    },
    {
        id: 'gw_ningwuguan_yanmenguan',
        name: '宁武关-雁门关',
        startCityId: 'city_ningwuguan',
        endCityId: 'city_yanmenguan',
        coordinates: [
            [112.24, 39.05],
            [112.42, 39.13],
            [112.65, 39.18],
            [112.87, 39.19],
        ],
        startYear: 1374,
    },
    {
        id: 'gw_yanmenguan_pingxingguan',
        name: '雁门关-平型关',
        startCityId: 'city_yanmenguan',
        endCityId: 'city_pingxingguan',
        roadId: 'road_city_pingxingguan_city_yanmenguan_1782938028252',
        startYear: 1545,
    },
    {
        id: 'gw_pingxingguan_feihu',
        name: '平型关-飞狐',
        startCityId: 'city_pingxingguan',
        endCityId: 'city_feihu',
        roadId: 'road_city_pingxingguan_city_feihu_1780158230556',
        startYear: 1545,
    },
    {
        id: 'gw_feihu_zijingguan',
        name: '飞狐-紫荆关',
        startCityId: 'city_feihu',
        endCityId: 'city_zijingguan',
        roadId: 'road_city_feihu_city_zijingguan_1780158229007',
        startYear: 1449,
    },
    {
        id: 'gw_zijingguan_juyongguan',
        name: '紫荆关-居庸关',
        startCityId: 'city_zijingguan',
        endCityId: 'city_juyongguan',
        coordinates: [
            [115.2658, 39.4722],
            [115.48, 39.68],
            [115.72, 39.94],
            [115.90, 40.14],
            [116.06, 40.28],
        ],
        startYear: 1368,
    },
    {
        id: 'gw_juyongguan_gubeikou',
        name: '居庸关-古北口',
        startCityId: 'city_juyongguan',
        endCityId: 'city_gubeikou',
        coordinates: [
            [116.06, 40.28],
            [116.32, 40.41],
            [116.56, 40.43],
            [116.86, 40.55],
            [117.16, 40.69],
        ],
        startYear: 1368,
    },
    {
        id: 'gw_gubeikou_lulong',
        name: '古北口-卢龙塞',
        startCityId: 'city_gubeikou',
        endCityId: 'city_lulong_pass',
        coordinates: [
            [117.16, 40.69],
            [117.32, 40.67],
            [117.65, 40.50],
            [117.98, 40.42],
            [118.28, 40.39],
            [118.35, 40.42],
        ],
        startYear: 1368,
    },
    {
        id: 'gw_lulong_shanhaiguan',
        name: '卢龙塞-山海关',
        startCityId: 'city_lulong_pass',
        endCityId: 'city_shanhaiguan',
        coordinates: [
            [118.35, 40.42],
            [118.75, 40.29],
            [119.06, 40.21],
            [119.30, 40.17],
            [119.58, 40.11],
            [119.80, 40.00],
        ],
        startYear: 1381,
    },
];

/** 解析一条长城段落的 [lat, lng][] 坐标（按 startCityId → endCityId 顺序对齐） */
export function resolveGreatWallSegmentLatLngs(seg: GreatWallSegmentDef): [number, number][] {
    const cityById = new Map(CITIES_V2.map((c) => [c.id, c]));
    let coords: [number, number][] | undefined = seg.coordinates;

    if (!coords && seg.roadId) {
        const road = VECTOR_ROAD_DATA.features.find((f) => f.properties.id === seg.roadId);
        if (road && road.geometry.coordinates.length >= 2) {
            const raw = road.geometry.coordinates as [number, number][];
            const reversed = road.properties.endConnection === seg.startCityId
                || road.properties.startConnection === seg.endCityId;
            coords = reversed ? [...raw].reverse() : raw;
        }
    }

    if (!coords || coords.length < 2) {
        const s = cityById.get(seg.startCityId);
        const e = cityById.get(seg.endCityId);
        if (!s || !e) return [];
        coords = [[s.lng, s.lat], [e.lng, e.lat]];
    }

    return coords.map(([lng, lat]) => [lat, lng]);
}
