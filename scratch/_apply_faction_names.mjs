import fs from 'fs';

const map = {
    qian: '黔中',
    wan: '舒州',
    guo: '果州',
    zi: '资州',
    jing2: '景州',
    long2: '陇州',
    song2: '松州',
    qing: '庆州',
    ting: '汀州',
    quan: '权州',
    leizhou: '雷州',
    ning: '宁州',
    danyang: '宣州',
    huai: '淮州',
    cai: '蔡州',
    ying: '郢州',
    heng: '衡州',
    chen2: '郴州',
    xin2: '信州',
    kui: '夔州',
    qi2: '蕲州',
    yingchuan: '漯河',
    fu2: '抚州',
    huan: '环州',
    zhai_han: '翟国',
    yuwenhuaji: '许国',
    yingbu: '九江',
    lu: '东道',
    fangla: '圣公',
    zhongxiang: '钟楚',
    yao: '尧帝',
    fu: '苻秦',
    kang: '长泽',
    wei2: '静塞',
    qiao: '乔氏',
    baibo: '郭氏',
    khon: '萨迦昆氏',
    lang_clan: '帕竹朗氏',
    zhong: '仲家',
    cuanshi: '爨族',
    boren: '僰族',
    hui: '濊族',
    qiong: '邛都',
    niang: '觉木宗',
    li_s: '里族',
};

let text = fs.readFileSync('./src/data/factions.ts', 'utf8');
const applied = [];
const missed = [];

for (const [id, to] of Object.entries(map)) {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pat = new RegExp(`(\\{\\s*id:\\s*'${esc(id)}',\\s*name:\\s*')([^']+)(')`);
    const m = text.match(pat);
    if (!m) {
        missed.push(id);
        continue;
    }
    const from = m[2];
    if (from === to) {
        applied.push(`${id}: unchanged ${to}`);
        continue;
    }
    text = text.replace(pat, `$1${to}$3`);
    applied.push(`${id}: ${from} → ${to}`);
}

fs.writeFileSync('./src/data/factions.ts', text);
console.log('applied', applied.length);
for (const line of applied) console.log(line);
if (missed.length) console.log('missed', missed);

const singles = [];
const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g;
let mm;
while ((mm = re.exec(text))) {
    if (Object.hasOwn(map, mm[1]) && [...mm[2]].length === 1) {
        singles.push(`${mm[1]}:${mm[2]}`);
    }
}
console.log('still single from map:', singles.length ? singles : 'none');
