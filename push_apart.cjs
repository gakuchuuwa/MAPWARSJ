const fs = require('fs');
const file = 'src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf-8');

// 1. Jieting vs Weirong (49.0km -> push Jieting slightly South)
content = content.replace(/(id:\s*'city_jieting'[\s\S]*?lat:\s*)([0-9.-]+)/, (m, p1, p2) => p1 + (parseFloat(p2) - 0.02).toFixed(6));

// 2. Dihua vs Beilu (49.4km -> push Dihua slightly West)
content = content.replace(/(id:\s*'city_dihua'[\s\S]*?lng:\s*)([0-9.-]+)/, (m, p1, p2) => p1 + (parseFloat(p2) - 0.02).toFixed(6));

// 3. Xiushan vs Bamian (49.8km -> push Bamian slightly East)
content = content.replace(/(id:\s*'city_bamian'[\s\S]*?lng:\s*)([0-9.-]+)/, (m, p1, p2) => p1 + (parseFloat(p2) + 0.02).toFixed(6));

fs.writeFileSync(file, content);
console.log("Cities pushed apart.");
