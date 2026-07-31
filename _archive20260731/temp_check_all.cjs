const fs = require('fs');

// === 1. 势力汉字重复 ===
console.log('=== 1. 势力名重复 ===');
const fc = fs.readFileSync('src/data/factions.ts', 'utf8');
const fMatch = fc.match(/FACTIONS[^=]*=\s*\[([\s\S]*?)\];/);
if (fMatch) {
  const items = fMatch[1].split('},');
  const nameMap = {};
  items.forEach((item, idx) => {
    const mm = item.match(/id:\s*['"](.+?)['"],\s*name:\s*['"](.+?)['"],/);
    if (mm) {
      const id = mm[1], name = mm[2];
      if (!nameMap[name]) nameMap[name] = [];
      nameMap[name].push(id);
    }
  });
  let found = false;
  Object.entries(nameMap).forEach(([name, ids]) => {
    if (ids.length > 1) { console.log('  重复「' + name + '」: ' + ids.join(', ')); found = true; }
  });
  if (!found) console.log('  无重复');
}

// === 2. 旗号汉字重复 ===
console.log('\n=== 2. 旗号文字重复 ===');
const sdn = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
const dnMatch = sdn.match(/SANDBOX_DISPLAY_NAMES[^=]*=\s*\{([\s\S]*?)\};/);
if (dnMatch) {
  const dnLines = dnMatch[1].split('\n');
  const textMap = {};
  dnLines.forEach((l) => {
    const t = l.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    const mm = t.match(/['"](\w+)['"]\s*:\s*['"](.+?)['"]/);
    if (mm) {
      const fid = mm[1], txt = mm[2];
      if (!textMap[txt]) textMap[txt] = [];
      textMap[txt].push(fid);
    }
  });
  let found = false;
  Object.entries(textMap).forEach(([txt, ids]) => {
    if (ids.length > 1) { console.log('  重复「' + txt + '」: ' + ids.join(', ')); found = true; }
  });
  if (!found) console.log('  无重复');
}

// === 3. 据点汉字重复 ===
console.log('\n=== 3. 据点名重复 ===');
const cv = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const cityMatch = cv.match(/CITIES_V2[^=]*=\s*\[([\s\S]*?)\];/);
if (cityMatch) {
  const items = cityMatch[1].split('},');
  const nameMap = {};
  items.forEach((item) => {
    const idM = item.match(/id:\s*['"](.+?)['"]/);
    const nmM = item.match(/name:\s*['"](.+?)['"]/);
    if (idM && nmM) {
      if (!nameMap[nmM[1]]) nameMap[nmM[1]] = [];
      nameMap[nmM[1]].push(idM[1]);
    }
  });
  let found = false;
  Object.entries(nameMap).forEach(([name, ids]) => {
    if (ids.length > 1) { console.log('  重复「' + name + '」: ' + ids.join(', ')); found = true; }
  });
  if (!found) console.log('  无重复');
}

console.log('\n--- 完毕 ---');
