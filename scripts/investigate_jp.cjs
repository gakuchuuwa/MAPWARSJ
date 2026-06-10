const fs = require('fs');
const c = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

// Check specific city entries
['city_hiraizumi','city_izumo','city_satsuma','city_shuri'].forEach(cid => {
  const idx = c.indexOf("id: '" + cid + "'");
  if (idx === -1) {
    console.log(cid + ' NOT FOUND');
    return;
  }
  const start = c.lastIndexOf('{', idx);
  const end = c.indexOf('}', idx);
  const block = c.substring(start, end + 1);
  console.log('=== ' + cid + ' ===');
  console.log(block);
  console.log('');
});

// Also check if there's any issue with their type
console.log('=== Checking for potential issues ===');
['oshu','izumo','satsuma','ryukyu'].forEach(fid => {
  // Check sandboxDisplayNames
  const assetContent = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
  const sdnMatch = assetContent.match(new RegExp("'" + fid + "':\\s*'([^']+)'"));
  console.log(fid + ' sandboxDisplayName: ' + (sdnMatch ? sdnMatch[1] : 'NOT FOUND'));

  // Check factionFlagMap
  const ffmMatch = assetContent.match(new RegExp("'" + fid + "':\\s*'([^']+)'"));
  console.log(fid + ' factionFlagMap: ' + (ffmMatch ? ffmMatch[1] : 'NOT FOUND'));
  
  // Check factions.ts
  const fc = fs.readFileSync('src/data/factions.ts', 'utf8');
  const fMatch = fc.match(new RegExp("id: '" + fid + "',\\s*name: '([^']+)'"));
  console.log(fid + ' factions.ts name: ' + (fMatch ? fMatch[1] : 'NOT FOUND'));
  console.log('');
});
