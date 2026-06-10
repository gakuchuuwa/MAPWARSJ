const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
pkg.scripts.dev = 'concurrently "vite" "node auto_backup.cjs"';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf-8');
console.log('package.json updated!');
