const fs = require('fs');
const path = require('path');

const extractProperty = (str, prop) => {
    const regex = new RegExp(`(?:${prop}['"]?\\s*:\\s*)(['"])(.*?)\\1`);
    const match = str.match(regex);
    return match ? match[2] : '无';
};

const citiesCode = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const factionsCode = fs.readFileSync('src/data/factions.ts', 'utf8');
const flagsCode = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
const generalsCode = fs.readFileSync('src/data/FactionGenerals.ts', 'utf8');

const legionFiles = fs.readdirSync('src/data').filter(f => f.endsWith('ExpeditionLegions.ts'));
const legionCodes = legionFiles.map(f => fs.readFileSync(path.join('src/data', f), 'utf8')).join('\n');

const getFactionName = (id) => {
    const regex = new RegExp(`id:\\s*['"]${id}['"].*?name:\\s*['"](.*?)['"]`);
    const match = factionsCode.match(regex);
    return match ? match[1] : '未知';
};

const getFlag = (id) => {
    const regex = new RegExp(`['"]${id}['"]\\s*:\\s*['"](.*?)['"]`);
    const match = flagsCode.match(regex);
    return match ? match[1] : '未指定(后备截图)';
};

const getGenerals = (id) => {
    const regex = new RegExp(`['"]?${id}['"]?\\s*:\\s*\\{([\\s\\S]*?)\\}`);
    const match = generalsCode.match(regex);
    if (!match) return "0名";
    const content = match[1];
    // naive count of sub-objects
    const lines = content.split('\n').filter(l => l.includes(': {') || l.includes(':{'));
    return `${lines.length}名`;
};

const getLegion = (id) => {
    // Looks for: id: { name: 'LegionName', tier: X }
    const regex = new RegExp(`\\b${id}\\s*:\\s*\\{\\s*name:\\s*['"](.*?)['"]`);
    const match = legionCodes.match(regex);
    return match ? match[1] : '无精锐';
};

// Target the explicit 20 big cities known
const bigCitiesIds = ['tang','shu','wuzhou_d','shang','ming_d','jinling','wuyue','bing','liangzhou','xinluo','tubo','edo','seljuq','siam','chenla','manzhou_d','tiemuer','guangzhou','song','menggu_d'];
const bigCitiesData = [
  {id: 'tang', city: '长安'}, {id: 'shu', city: '成都'}, {id: 'wuzhou_d', city: '洛阳'},
  {id: 'shang', city: '安阳'}, {id: 'ming_d', city: '北京'}, {id: 'jinling', city: '金陵'},
  {id: 'wuyue', city: '杭州'}, {id: 'bing', city: '晋阳'}, {id: 'liangzhou', city: '姑臧'},
  {id: 'xinluo', city: '金城'}, {id: 'tubo', city: '逻些'}, {id: 'edo', city: '江户城'},
  {id: 'seljuq', city: '木鹿'}, {id: 'siam', city: '阿瑜陀耶'}, {id: 'chenla', city: '吴哥'},
  {id: 'manzhou_d', city: '沈阳'}, {id: 'tiemuer', city: '撒马尔罕'}, {id: 'guangzhou', city: '番禺'},
  {id: 'song', city: '开封'}, {id: 'menggu_d', city: '哈拉和林'}
];

const report = bigCitiesData.map(c => {
    const factionName = getFactionName(c.id);
    const flag = getFlag(c.id);
    const gens = getGenerals(c.id);
    const leg = getLegion(c.id);
    return `| ${c.city} | ${factionName} | ${flag} | ${gens} | ${leg} |`;
});

console.log('| 据点名 | 势力全名 | 旗号 | 绑定武将 | 配属精锐 |');
console.log('|---|---|---|---|---|');
console.log(report.join('\n'));
