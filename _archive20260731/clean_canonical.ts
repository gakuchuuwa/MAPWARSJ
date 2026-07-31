import fs from 'fs';

const targetsToRemove = [
    '/assets/panjun/3112895c-8953-4834-bd6f-808bf18f51cd.png',
    '/assets/panjun/a19a176d-0e0e-474e-8432-9885166629b3.png',
    '/assets/NORTHEAST/dongbei (1).png',
    '/assets/NORTHEAST/dongbei (2).png'
];

const text = fs.readFileSync('src/config/portrait_canonical.ts', 'utf-8');
const match = text.match(/export const PORTRAIT_CANONICAL_MAP: Readonly<Record<string, string>> = ([\s\S]+);/);

if (!match) {
    console.error('Regex match failed!');
    process.exit(1);
}

let mapData: Record<string, string>;
eval('mapData = ' + match[1]);

let removedCount = 0;
for (let key in mapData) {
    if (targetsToRemove.includes(mapData[key])) {
        delete mapData[key];
        removedCount++;
    }
}

console.log('Removed ' + removedCount + ' dead links. Generating new file content...');

let newContent = 'export const PORTRAIT_CANONICAL_MAP: Readonly<Record<string, string>> = {\n';
const entries = Object.entries(mapData);
for (let i = 0; i < entries.length; i++) {
    newContent += `    "${entries[i][0]}": "${entries[i][1]}"${i === entries.length - 1 ? '\n' : ',\n'}`;
}
newContent += '};\n';

// Replace the old export with the new one
const newFullContent = text.replace(/export const PORTRAIT_CANONICAL_MAP: Readonly<Record<string, string>> = [\s\S]+;/, newContent.trim());

fs.writeFileSync('src/config/portrait_canonical.ts', newFullContent);
console.log('Done. Wrote updated file.');
