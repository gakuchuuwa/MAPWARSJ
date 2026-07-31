const fs = require('fs');
let content = fs.readFileSync('src/app/GameApp.ts', 'utf-8');
content = content.replace(/'weiming':\s*'[^']+',/, "'weiming': 'city_juyansai',");
content = content.replace(/'ruan':\s*'[^']+',\r?\n\s*/, '');
content = content.replace(/'heishui':\s*'[^']+',\r?\n\s*/, '');
fs.writeFileSync('src/app/GameApp.ts', content);
