const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Safely get the original file content without modifying the workspace
    const originalContent = execSync('git show HEAD:src/data/VectorRoadData.ts').toString('utf-8');
    
    // Now we parse and filter
    const prefix = originalContent.substring(0, originalContent.indexOf('export const VECTOR_ROAD_DATA'));
    const objStr = originalContent.substring(originalContent.indexOf('{', originalContent.indexOf('export const VECTOR_ROAD_DATA')));
    
    // Unfortunately eval fails if there are TS types inside the JS object
    // But VECTOR_ROAD_DATA = { type: 'FeatureCollection', features: [ { type: 'Feature' } ] }
    // It is pure JSON-like structure! But keys might not be quoted.
    
    // Let's just use string replace on the original content, but MUCH more carefully.
    // We can use a regex to match { ... "city_champa" ... }
    
    let newContent = originalContent;
    newContent = newContent.replace(/\{\s*type:\s*'Feature',\s*properties:\s*\{[^{}]*?(?:startConnection|endConnection):\s*'city_champa'[^{}]*?\},[^{}]*?geometry:\s*\{[^{}]*?\}\s*\},?\s*/g, '');
    
    fs.writeFileSync('src/data/VectorRoadData.ts', newContent, 'utf-8');
    console.log('Successfully restored and cleaned VectorRoadData.ts!');
} catch (e) {
    console.error('Failed:', e.message);
}
