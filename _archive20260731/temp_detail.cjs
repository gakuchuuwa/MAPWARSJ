const fs = require('fs');
const fc = fs.readFileSync('src/data/factions.ts', 'utf8');
const fMatch = fc.match(/FACTIONS[^=]*=\s*\[([\s\S]*?)\];/);
const items = fMatch[1].split('},');
const allInfo = {};
items.forEach((item) => {
  const mM = item.match(/id:\s*['"](.+?)['"],\s*name:\s*['"](.+?)['"],/);
  const cM = item.match(/\/\/\s*(.+)$/m);
  if (mM) { allInfo[mM[1]] = { id: mM[1], chinese: mM[2], comment: cM ? cM[1].trim() : '' }; }
});

const pairs = [
  ['yan', 'luoyi'],
  ['chen', 'chendiaoyan'],
  ['ming_d', 'daming'],
  ['huang_d', 'huang_tianzhou'],
  ['gaogouli', 'goryeo'],
  ['zhai_d', 'zhai_han'],
  ['fangla', 'fang_guozhen'],
  ['yezongliu', 'taiping'],
  ['khoja', 'rexidin'],
  ['han_nian', 'han_dadian'],
  ['yuan_d', 'da_yuan'],
  ['an', 'an_shuixi']
];

pairs.forEach(([id1, id2]) => {
  const a = allInfo[id1];
  const b = allInfo[id2];
  if (a && b) {
    console.log(id1 + ' -> name="' + a.chinese + '"  // ' + a.comment);
    console.log(id2 + ' -> name="' + b.chinese + '"  // ' + b.comment);
    console.log('');
  }
});
