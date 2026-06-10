const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');

// Helper to clean ID: convert to pinyin, lowercase, remove non-alphanumeric
function generateId(name) {
    // toneType: 'none' -> no tones (e.g. 'han')
    // type: 'array' -> ['han', 'gu', 'guan']
    // join('') -> 'hanguguan'
    const py = pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    // remove any leftover special chars just in case
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

// We process splitting by lines to preserve comments/structure
const lines = citiesContent.split('\n');
const idMap = new Map(); // OldID -> NewID
const seenIds = new Set(); // Track all IDs (kept + new) to avoid collisions

// Pass 1: Collect existing "Good" IDs to reserve them
lines.forEach(line => {
    // Regex to capture ID: { id: 'some_id', ... }
    const match = line.match(/id:\s*['"]([^'"]+)['"]/);
    if (match) {
        const id = match[1];
        // Heuristic: If ID has no Chinese chars AND no long timestamp suffix (>=10 digits), keep it
        // Example "messy": city_晋阳_1766149774406
        // Example "good": changan, luoyang, city_rome
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
    // Capture both ID and Name
    const match = line.match(/\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]/);
    if (match) {
        const oldId = match[1];
        const name = match[2];

        const hasChinese = /[\u4e00-\u9fa5]/.test(oldId);
        const hasTimestamp = /_\d{10,}/.test(oldId);

        // Target: messy IDs
        if (hasChinese || hasTimestamp) {
            let newId = generateId(name);

            // Collision handling
            let counter = 0;
            let candidateId = newId;
            while (seenIds.has(candidateId) || idMap.has(candidateId)) {
                // If collision, check if it's because we processed it just now? 
                // No, seenIds stores confirmed IDs.
                counter++;
                candidateId = `${newId}_${counter}`;
            }
            newId = candidateId;

            seenIds.add(newId);
            idMap.set(oldId, newId);
            replacementCount++;

            // console.log(`Mapped: ${oldId} -> ${newId}`);

            // Replace in line
            // Be careful to only replace the ID part
            return line.replace(`id: '${oldId}'`, `id: '${newId}'`).replace(`id: "${oldId}"`, `id: "${newId}"`);
        } else {
            // Already good, ensure it's tracked (should be from Pass 1, but just in case)
            seenIds.add(oldId);
        }
    }
    return line;
});

// Save cities.ts
fs.writeFileSync(CITIES_PATH, newLines.join('\n'));
console.log(`Updated cities.ts. Replaced ${replacementCount} IDs.`);

// 3. Update events.ts
let eventsContent = fs.readFileSync(EVENTS_PATH, 'utf-8');
let eventReplacements = 0;

idMap.forEach((newId, oldId) => {
    // Global replacement for each ID
    // We use split/join for global replacement without regex escaping issues
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
