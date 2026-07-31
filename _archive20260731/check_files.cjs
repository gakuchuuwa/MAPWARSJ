const fs = require('fs');
const files = [
  'src/data/factions.ts',
  'src/data/cities_v2.ts',
  'src/app/GameApp.ts',
  'src/assets/CityAssetManager.ts',
  'src/data/SandboxDisplayNames.ts'
];
const targets = ['zhai_d', 'chaoxian', 'khalkha'];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  targets.forEach(t => {
    if (content.includes(t)) {
      console.log(`Found ${t} in ${file}`);
    }
  });
});
