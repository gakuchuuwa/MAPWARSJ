import * as fs from 'fs';
import * as path from 'path';
import { VECTOR_ROAD_DATA, VectorRoadFeature } from '../src/data/VectorRoadData';

const filteredFeatures = VECTOR_ROAD_DATA.features.filter(
    (feature) => feature.geometry.coordinates.length > 2
);

const removedCount = VECTOR_ROAD_DATA.features.length - filteredFeatures.length;

const newFileContent = `export interface VectorRoadFeature {
    type: 'Feature';
    properties: {
        name: string;
        type: 'plank' | 'path' | 'road';
        color?: string;
        id: string;
        startYear?: number;
        endYear?: number;
        startConnection?: string;
        endConnection?: string;
    };
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
}

export const VECTOR_ROAD_DATA: { type: 'FeatureCollection', features: VectorRoadFeature[] } = {
    type: 'FeatureCollection',
    features: ${JSON.stringify(filteredFeatures, null, 4)}
};
`;

fs.writeFileSync('./src/data/VectorRoadData.ts', newFileContent, 'utf-8');
console.log(`Successfully removed ${removedCount} straight-line roads.`);
console.log(`Remaining roads: ${filteredFeatures.length}`);
