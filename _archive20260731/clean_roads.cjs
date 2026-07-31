const fs = require('fs');

let content = fs.readFileSync('src/data/VectorRoadData.ts', 'utf-8');
const searchString = "type: 'Feature'";
let blocks = content.split(searchString);

let newContent = blocks[0]; // Header
let removed = 0;

for (let i = 1; i < blocks.length; i++) {
    let block = searchString + blocks[i];
    
    // We need to find where this feature object ends.
    // It's part of an array, so it ends with }, or }\n]
    if (block.includes("'city_champa'") || block.includes('"city_champa"')) {
        // Skip adding this block
        removed++;
        // If the previous block ended with a comma and we skip this one, we might leave a trailing comma
        // But we will clean trailing commas at the end
    } else {
        newContent += block;
    }
}

// Clean up any double commas or trailing commas in the array
newContent = newContent.replace(/},\s*,\s*{/g, '},\n    {');
newContent = newContent.replace(/},\s*];/g, '}\n];');

fs.writeFileSync('src/data/VectorRoadData.ts', newContent, 'utf-8');
console.log('Removed', removed, 'roads containing city_champa!');
