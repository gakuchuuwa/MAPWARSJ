/**
 * 兵种鉴赏的「时代」对照 DE 科技树（只管能生产出来的兵：普通兵、区域兵、文化兵；城堡兵、英雄等不管）。
 * 🔴 [2026-10-19 主人令「兵种鉴赏中的兵……不算城堡兵，只看普通兵，区域兵，文化兵，可以生产出来的兵。对应的时代不对，请参考科技树」]
 *
 * 对应规则：
 *   · 只在古典文明（编年史：阿契美尼德、雅典、斯巴达、马其顿、色雷斯、普鲁）科技树里出现 → 古典 antiquity
 *   · 中世纪文明：取多数文明科技树里能生产它的时代（不计该文明造不了的；个别文明提前一个时代的特权——如亚美尼亚封建出重装剑士——不算）：
 *     黑暗 1 / 封建 2 → 封建 feudal（项目没有黑暗时代），
 *     城堡 3 → 城堡 castle，帝王 4 → 帝国 imperial
 * 对号与 tools/de-unit-source-types.mjs 相同（legion-names.json + de-unit-name-alias.json）。
 * 用法：node tools/de-unit-age-from-techtree.mjs          只列不一致
 *       node tools/de-unit-age-from-techtree.mjs --write  把不一致的时代写回 src/legion-editor/main.ts
 */
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const MAIN = 'src/legion-editor/main.ts';
const raw = fs.readFileSync(MAIN, 'utf8');
const crlf = raw.includes('\r\n');
let s = crlf ? raw.replace(/\r\n/g, '\n') : raw;

const catalog = new Map([...s.matchAll(/\{ id: '([^']+)', name: '([^']+)', category: '(\w+)', age: '(\w+)'/g)].map((m) => [m[1], { name: m[2], age: m[4] }]));
const src = Object.fromEntries([...fs.readFileSync('src/data/deUnitSourceTypes.ts', 'utf8').matchAll(/"([^"]+)": '(\w+)'/g)].map((m) => [m[1], m[2]]));
const ln = JSON.parse(fs.readFileSync('public/de-techtree/legion-names.json', 'utf8'));
const alias = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync('tools/de-unit-name-alias.json', 'utf8'))).filter(([k]) => !k.startsWith('_')));
const index = JSON.parse(fs.readFileSync('public/de-techtree/index.json', 'utf8'));
const norm = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// 兵种 id → 对号用的 DE 单位编号 / 英文名
const aliasId = {}, aliasName = {};
for (const [cid, v] of Object.entries(alias)) {
    const [nm, id] = String(v).split('#');
    if (id) aliasId[cid] = Number(id);
    if (nm) aliasName[cid] = norm(nm);
}

const seen = new Map();   // 兵种 id → { votes: {Age ID: 文明数}, ant: bool }
const hit = (cid, era, age, available) => {
    if (!catalog.has(cid)) return;
    const r = seen.get(cid) ?? { votes: {}, ant: false, med: null };
    if (era === 'antiquity') r.ant = true;
    else if (available) r.votes[age] = (r.votes[age] || 0) + 1;
    else r.votes0 = { ...(r.votes0 || {}), [age]: ((r.votes0 || {})[age] || 0) + 1 };
    seen.set(cid, r);
};
const byAliasId = new Map(Object.entries(aliasId).map(([c, i]) => [i, c]));
const byAliasName = new Map(Object.entries(aliasName).map(([c, n]) => [n, c]));
for (const civ of index) {
    const tree = JSON.parse(fs.readFileSync(`public/de-techtree/${civ.file}`, 'utf8'));
    const isAnt = civ.era === 'antiquity';
    for (const n of Object.values(tree.units_techs)) {
        if (n['Use Type'] !== 'Unit') continue;
        const nid = n['Node ID'];
        const k = norm(n.name);
        const cid = byAliasId.get(nid)
            ?? (isAnt ? ln.byAntId[String(nid)] : ln.byMedId[String(nid)])
            ?? ln.byNorm[k] ?? byAliasName.get(k) ?? ln.byId[String(nid)];
        if (cid) hit(cid, civ.era, Number(n['Age ID'] ?? 1), n['Node Status'] !== 'NotAvailable');
    }
}

const AGE = { 1: 'feudal', 2: 'feudal', 3: 'castle', 4: 'imperial' };
const LABEL = { antiquity: '古典', feudal: '封建', castle: '城堡', imperial: '帝国' };
const DE_AGE = { 1: '黑暗', 2: '封建', 3: '城堡', 4: '帝王' };
// 多数文明的时代；平票取早的。全都造不了（只在个别文明出现且标 NotAvailable）就用那些节点的时代
for (const r of seen.values()) {
    const v = Object.keys(r.votes).length ? r.votes : (r.votes0 || {});
    const ages = Object.entries(v).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    r.med = ages.length ? Number(ages[0][0]) : null;
}
const want = (r) => (r.med != null ? AGE[r.med] : 'antiquity');
// 科技树里没有单独节点的变体（女兵素材、不带盾形态）跟随基础版
const VARIANT_OF = { flemish_pikeman_f: 'flemish_pikeman', jian_swordman_unshielded: 'jian_swordsman' };
for (const [v, b] of Object.entries(VARIANT_OF)) if (!seen.has(v) && seen.has(b)) seen.set(v, seen.get(b));
const diffs = [];
for (const [cid, c] of catalog) {
    if (!['normal', 'regional', 'culture'].includes(src[cid])) continue;
    const r = seen.get(cid);
    if (!r) { diffs.push([cid, c.name, c.age, null, '科技树里没对上']); continue; }
    const w = want(r);
    if (w !== c.age) diffs.push([cid, c.name, c.age, w, r.med != null ? `中世纪科技树多数文明在${DE_AGE[r.med]}时代` : '只在古典文明科技树']);
}
console.log(`普通兵/区域兵/文化兵与科技树时代不一致：${diffs.length} 个`);
for (const [cid, nm, from, to, why] of diffs) console.log(`  ${nm}（${cid}）：${LABEL[from]} → ${to ? LABEL[to] : '?'}　${why}`);

if (WRITE) {
    let n = 0;
    for (const [cid, , , to] of diffs) {
        if (!to) continue;
        const re = new RegExp(`(\\{ id: '${cid}', name: '[^']+', category: '\\w+', age: ')\\w+(')`);
        if (re.test(s)) { s = s.replace(re, `$1${to}$2`); n++; }
    }
    fs.writeFileSync(MAIN, crlf ? s.replace(/\n/g, '\r\n') : s);
    console.log(`已写回 ${n} 个`);
}
