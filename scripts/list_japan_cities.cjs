const fs = require('fs');
const c = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

// Also check which faction these specific city IDs belong to
const checkCities = ['city_kyoto', 'city_shinotachi', 'city_okou', 'city_yoshida',
  'city_kiyosu', 'city_kasugayama', 'city_kofu', 'city_gimhae'];

console.log('=== 按城市ID查询所属势力 ===');
checkCities.forEach(cid => {
  // Try single-quote format first (TypeScript)
  const re1 = new RegExp("id: '" + cid.replace(/'/g, "\\'") + "'[\\s\\S]*?factionId: '([^']+)'");
  const m1 = c.match(re1);
  if (m1) {
    const nameM = c.match(new RegExp("id: '" + cid.replace(/'/g, "\\'") + "'[\\s\\S]*?name: '([^']+)'"));
    console.log('  ' + cid + ' | ' + (nameM ? nameM[1] : '?') + ' -> factionId: ' + m1[1]);
  } else {
    console.log('  ' + cid + ' -> NOT FOUND');
  }
});

console.log('');
console.log('=== 日本势力城市完整列表 ===');
console.log('');

const jpFactions = [
  { id: 'riben', name: '日本(京都)', capital: 'city_kyoto' },
  { id: 'yamatai', name: '邪马台', capital: 'city_dazaifu' },
  { id: 'yamato', name: '大和', capital: 'city_nara' },
  { id: 'kamakura', name: '镰仓', capital: 'city_kamakura' },
  { id: 'edo', name: '江户', capital: 'city_edo' },
  { id: 'oshu', name: '奥州', capital: 'city_hiraizumi' },
  { id: 'izumo', name: '出云', capital: 'city_izumo' },
  { id: 'satsuma', name: '萨摩', capital: 'city_satsuma' },
  { id: 'emishi', name: '虾夷', capital: 'city_shinotachi' },
  { id: 'ryukyu', name: '琉球', capital: 'city_shuri' },
  { id: 'taiwan', name: '台湾', capital: 'city_tainan' },
  { id: 'so', name: '对马', capital: 'city_tsushima' },
  { id: 'kakizaki', name: '蛎崎', capital: 'city_katsuyama' },
  { id: 'fujiwara', name: '藤原', capital: 'city_yanaginogosho' },
  { id: 'gaya', name: '伽耶', capital: 'city_gimhae' },
  { id: 'tosa', name: '土佐', capital: 'city_okou' },
  { id: 'aki', name: '安艺', capital: 'city_yoshida' },
  { id: 'echigo', name: '上杉(越后)', capital: 'city_kasugayama' },
  { id: 'kai', name: '甲斐', capital: 'city_kofu' },
  { id: 'owari', name: '尾张', capital: 'city_kiyosu' }
];

jpFactions.forEach(f => {
  // Count cities for this faction
  const escaped = f.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp("factionId: '" + escaped + "'", 'g');
  const matches = c.match(re);
  const count = matches ? matches.length : 0;

  // Check if capital city exists and what faction it's assigned to
  const capRe = new RegExp("id: '" + f.capital.replace(/'/g, "\\'") + "'[\\s\\S]*?factionId: '([^']+)'");
  const capM = c.match(capRe);
  const capFac = capM ? capM[1] : 'NOT FOUND';

  const status = count > 0 ? '✅' : '❌';
  const capMatch = (capFac === f.id) ? '✅ 匹配' : ('❌ 实际=' + capFac);
  console.log(status + ' ' + f.id + ' (' + f.name + ')');
  console.log('   城市数: ' + count + ' | 首都: ' + f.capital + ' -> ' + capMatch);
});
