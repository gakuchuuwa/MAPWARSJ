const fs = require('fs');
let c = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');

// The bad script prepended:
// `        note: '【界城】${currentCity}作为区域核心边界点',\n` + lines[i]
// which looks like:
//         note: '【界城】襄平作为区域核心边界点',
//     { id: 'city_liaoyang', name: '襄平'...

// Let's fix all occurrences of a note line followed immediately by an object opening
c = c.replace(/\s*note:\s*'【界城】([^']+)',\n(\s*\{.*name:\s*'([^']+)'[^}]*\}),?/g, (match, noteText, objLine, cityName) => {
    // If the note corresponds to the city name, we inject it inside the object before the closing brace
    return objLine.replace(' }', `, note: '【界城】${cityName}作为区域核心边界点' }`);
});

// Let's also catch any others that might have been broken similarly
const lines = c.split('\n');
let fixedLines = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("note: '【界城】") && !lines[i].includes("{") && lines[i].trim().startsWith("note: '【界城】")) {
        // Look at the next line
        if (i + 1 < lines.length && lines[i+1].includes("{") && lines[i+1].includes("id:")) {
            // It's broken. Inject it into the next line.
            const noteStr = lines[i].trim().replace(/,$/, ''); // remove trailing comma
            const nextLine = lines[i+1].replace(' }', `, ${noteStr} }`).replace(',,', ',');
            fixedLines.push(nextLine);
            i++; // skip next line
            continue;
        }
    }
    fixedLines.push(lines[i]);
}

fs.writeFileSync('src/data/cities_v2.ts', fixedLines.join('\n'));
console.log("Fixed cities_v2.ts syntax errors.");
