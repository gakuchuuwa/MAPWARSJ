const fs = require('fs');

const oldText = fs.readFileSync('old.txt', 'utf8').replace(/\r\n/g, '\n');
const newText = fs.readFileSync('new.txt', 'utf8');

let target = fs.readFileSync('vite.config.ts', 'utf8');
const targetNorm = target.replace(/\r\n/g, '\n');

if (targetNorm.includes(oldText)) {
    target = targetNorm.replace(oldText, newText);
    fs.writeFileSync('vite.config.ts', target);
    console.log('REPLACEMENT SUCCESSFUL');
} else {
    console.log('FAILED TO MATCH EXACTLY. Check old.txt contents.');
}
