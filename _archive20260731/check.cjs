const fs = require('fs');
const content = fs.readFileSync('./src/data/factions.ts', 'utf-8');
const lines = content.split('\n');
const names = new Map();
lines.forEach((line, i) => {
  const match = line.match(/id:\s*['"]([^'"]+)['"].*name:\s*['"]([^'"]+)['"]/);
  if (match) {
    const id = match[1];
    const name = match[2];
    if (names.has(name)) {
      console.log("Duplicate name: " + name);
      console.log("  - 1st: ID [" + names.get(name) + "]");
      console.log("  - 2nd: ID [" + id + "]");
    } else {
      names.set(name, id);
    }
  }
});
