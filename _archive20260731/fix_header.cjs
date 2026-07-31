const fs = require('fs');
let content = fs.readFileSync('src/data/VectorRoadData.ts', 'utf-8');

const header = `export interface VectorRoadFeature {
    type: 'Feature';
    properties: {
        name: string;
        type: 'road';
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
    features: [
`;

// The broken file starts with "export interface VectorRoadFeature {\n    "
// followed directly by the first feature: properties: { ... } or something.
// Wait, my clean_roads.cjs split by "type: 'Feature'".
// So the first block is "export interface VectorRoadFeature {\n    "
// And the second block starts with the REST of the first feature, which is:
// "properties: { ... "
// So if I find "properties: {", I can prepend the header and "{ type: 'Feature',"
const propIdx = content.indexOf('properties:');
if (propIdx !== -1) {
    let rest = content.substring(propIdx);
    fs.writeFileSync('src/data/VectorRoadData.ts', header + "        { type: 'Feature', " + rest, 'utf-8');
    console.log('Fixed header forcefully!');
}
