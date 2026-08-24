/**
 * VectorSeaRouteData.ts — 海路数据（独立于道路系统）
 *
 * 由海路编辑器（SeaRouteEditor）生成/维护。
 * 与道路编辑器（VectorRoadEditor）完全分离：道路走陆地路网（roads_filtered.geojson），
 * 海路走海上航线网（sea_routes.geojson = NE Ferry Route + 手工历史航线）。
 */
export interface SeaRouteFeature {
    type: 'Feature';
    properties: {
        name: string;
        type: 'sea';
        color?: string;
        id: string;
        startYear?: number;
        endYear?: number;
        startConnection?: string; // 起港城市 id
        endConnection?: string;   // 终港城市 id
    };
    geometry: {
        type: 'LineString';
        coordinates: [number, number][]; // [lng, lat][]
    };
}

export const SEA_ROUTE_DATA: { type: 'FeatureCollection', features: SeaRouteFeature[] } = {
    type: 'FeatureCollection',
    features: [
    ]
};
