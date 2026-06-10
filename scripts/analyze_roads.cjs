const fs = require('fs');
let output = '';
const content = fs.readFileSync('src/data/VectorRoadData.ts','utf8');

// 提取所有连接
const startMatches = [...content.matchAll(/startConnection:\s*"([^"]+)"/g)];
const endMatches = [...content.matchAll(/endConnection:\s*"([^"]+)"/g)];

const startCities = startMatches.map(m => m[1]);
const endCities = endMatches.map(m => m[1]);
const allConn = [...startCities, ...endCities];
const uniqueConn = [...new Set(allConn)];

output += '====== 道路数据统计 ======\n\n';
output += '道路ID总数: ' + (content.match(/\"type\":\s*\"LineString\"/g) || []).length + '\n';
output += 'startConnection数: ' + startCities.length + '\n';
output += 'endConnection数: ' + endCities.length + '\n';
output += '已连接城市(去重): ' + uniqueConn.length + '\n';

// 各城市作为起终点的频率
const freq = {};
allConn.forEach(c => { freq[c] = (freq[c] || 0) + 1; });
const sorted = Object.entries(freq).sort((a,b) => b[1] - a[1]);
output += '\n====== 连接最多的枢纽城市(Top 20) ======\n';
sorted.slice(0, 20).forEach(([city, count]) => {
  output += '  ' + city + ' → ' + count + '次\n';
});

// 找出只在start中出现的城市
const onlyStart = startCities.filter(c => !endCities.includes(c));
// 找出只在end中出现的城市
const onlyEnd = endCities.filter(c => !startCities.includes(c));
output += '\n只在startConnection出现的城市: ' + onlyStart.length + '个\n';
output += '只在endConnection出现的城市: ' + onlyEnd.length + '个\n';

// 道路名列表（提取name: "..."）
const nameMatches = content.match(/name:\s*"([^"]+)"/g);
if (nameMatches) {
  output += '\n====== 道路名样例(前30) ======\n';
  nameMatches.slice(0, 30).forEach(n => {
    const name = n.match(/"([^"]+)"/)[1];
    output += '  ' + name + '\n';
  });
  output += '\n道路总数(按name字段): ' + nameMatches.length + '\n';
}

// 检查长路径（坐标点多的道路）
const roadBlocks = content.split(/\{\s*type:\s*"Feature"/);
output += '\n====== 分析坐标点数量 ======\n';
let longRoads = [];
roadBlocks.forEach((block, i) => {
  if (i === 0) return;
  const coordMatch = block.match(/coordinates:\s*\[([\s\S]*?)\]\s*\}/);
  if (coordMatch) {
    const points = coordMatch[1].match(/\[[\d.,\s-]+\]/g);
    if (points && points.length > 100) {
      const nameMatch = block.match(/name:\s*"([^"]+)"/);
      const name = nameMatch ? nameMatch[1] : 'unnamed_' + i;
      longRoads.push({ name, count: points.length });
    }
  }
});
longRoads.sort((a,b) => b.count - a.count);
output += '\n坐标点>100的道路(' + longRoads.length + '条,Top15):\n';
longRoads.slice(0, 15).forEach(r => {
  output += '  ' + r.name + ' → ' + r.count + '点\n';
});

fs.writeFileSync('scripts/road_analysis.txt', output);
console.log('OK');
