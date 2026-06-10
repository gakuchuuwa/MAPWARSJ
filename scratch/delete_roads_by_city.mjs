import fs from 'fs';

const cityId = process.argv[2];
const roadsPath = 'src/data/VectorRoadData.ts';
let text = fs.readFileSync(roadsPath, 'utf-8');

const lines = text.split('\n');
const outLines = [];
let inBlock = false;
let blockLines = [];
let blockBraceDepth = 0;
let deletedCount = 0;

const refs = [
  `startConnection: "${cityId}"`,
  `startConnection: '${cityId}'`,
  `endConnection: "${cityId}"`,
  `endConnection: '${cityId}'`,
];

for (const line of lines) {
  if (!inBlock) {
    if (/^\s*\{\s*$/.test(line)) {
      inBlock = true;
      blockLines = [line];
      blockBraceDepth = 1;
    } else {
      outLines.push(line);
    }
    continue;
  }

  blockLines.push(line);
  blockBraceDepth += (line.match(/\{/g) || []).length;
  blockBraceDepth -= (line.match(/\}/g) || []).length;

  if (blockBraceDepth <= 0) {
    inBlock = false;
    const blockText = blockLines.join('\n');
    if (refs.some((r) => blockText.includes(r))) {
      deletedCount++;
    } else {
      outLines.push(...blockLines);
    }
    blockLines = [];
  }
}

fs.writeFileSync(roadsPath, outLines.join('\n'), 'utf-8');
console.log(`Deleted ${deletedCount} road blocks referencing ${cityId}`);
