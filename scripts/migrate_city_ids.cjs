const fs = require('fs');
const path = require('path');
// Dynamic import for pinyin-pro if it's ESM-only, or try require. 
// If pinyin-pro is ESM only, require will fail. 
// Let's assume it supports CJS or we use dynamic import() in an async function.
// But valid CJS file cannot use top-level await easily without a wrapper.
// Let's try standard require first.
let pinyin;
try {
    const pkg = require('pinyin-pro');
    pinyin = pkg.pinyin;
} catch (e) {
    console.error('Failed to require pinyin-pro. It might be ESM-only.');
    process.exit(1);
}

// Helper to clean ID
function generateId(name) {
    const py = pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    return 'city_' + py.replace(/[^a-z0-9]/g, '');
}

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CITIES_PATH = path.join(PROJECT_ROOT, 'src/data/cities.ts');
const EVENTS_PATH = path.join(PROJECT_ROOT, 'src/data/events.ts');

console.log('Migrating IDs...');
console.log('Cities Path:', CITIES_PATH);
console.log('Events Path:', EVENTS_PATH);

if (!fs.existsSync(CITIES_PATH) || !fs.existsSync(EVENTS_PATH)) {
    console.error('Error: Files not found!');
    process.exit(1);
}

let citiesContent = fs.readFileSync(CITIES_PATH, 'utf-8');

const lines = citiesContent.split('\n');
const idMap = new Map();
const seenIds = new Set();

// Pass 1: Collect existing "Good" IDs
lines.forEach(line => {
    const match = line.match(/id:\s*['"]([^'"]+)['"]/);
    if (match) {
        const id = match[1];
        const hasChinese = /[\u4e00-\u9fa5]/.test(id);
        const hasTimestamp = /_\d{10,}/.test(id);

        if (!hasChinese && !hasTimestamp) {
            seenIds.add(id);
        }
    }
});

console.log(`Reserved ${seenIds.size} existing clean IDs.`);

// Pass 2: Generate new IDs for messy ones
let replacementCount = 0;
const newLines = lines.map(line => {
    const match = line.match(/\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]/);
    if (match) {
        const oldId = match[1];
        const name = match[2];

        const hasChinese = /[\u4e00-\u9fa5]/.test(oldId);
        const hasTimestamp = /_\d{10,}/.test(oldId);

        if (hasChinese || hasTimestamp) {
            let newId = generateId(name);

            let counter = 0;
            let candidateId = newId;
            while (seenIds.has(candidateId) || idMap.has(candidateId)) {
                counter++;
                candidateId = `${newId}_${counter}`;
            }
            newId = candidateId;

            seenIds.add(newId);
            idMap.set(oldId, newId);
            replacementCount++;

            return line.replace(`id: '${oldId}'`, `id: '${newId}'`).replace(`id: "${oldId}"`, `id: "${newId}"`);
        } else {
            seenIds.add(oldId);
        }
    }
    return line;
});

fs.writeFileSync(CITIES_PATH, newLines.join('\n'));
console.log(`Updated cities.ts. Replaced ${replacementCount} IDs.`);

// 3. Update events.ts
let eventsContent = fs.readFileSync(EVENTS_PATH, 'utf-8');
let eventReplacements = 0;

idMap.forEach((newId, oldId) => {
    const splitsSingle = eventsContent.split(`'${oldId}'`);
    if (splitsSingle.length > 1) {
        eventsContent = splitsSingle.join(`'${newId}'`);
        eventReplacements += (splitsSingle.length - 1);
    }

    const splitsDouble = eventsContent.split(`"${oldId}"`);
    if (splitsDouble.length > 1) {
        eventsContent = splitsDouble.join(`"${newId}"`);
        eventReplacements += (splitsDouble.length - 1);
    }
});

fs.writeFileSync(EVENTS_PATH, eventsContent);
console.log(`Updated events.ts. Updated refs: ${eventReplacements}`);
