const fs = require('fs');
let a = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf-8');

// Restore pu_shi
a = a.replace(/'fushi':\s*'保',/, "'pu_shi': '普',");

// Now properly set fushi: '保' where 'fushi': '延' used to be
a = a.replace(/'fushi':\s*'肤',/, "'fushi': '保',");
a = a.replace(/'yanan':\s*'延',/, "'fushi': '保',");

fs.writeFileSync('src/assets/CityAssetManager.ts', a);
console.log("Fixed CityAssetManager.ts");
