/**
 * 生成「兵种来源类别」：把兵种鉴赏（DE_UNITS_CATALOG）每个兵种按 DE 归入七类，并列出与 DE 对照的缺少／多余。
 *
 * 🔴 [2026-10-19 主人令「城堡兵、文化兵、区域兵、特殊兵、普通兵，英雄，精英兵，请修改下程序……并和DE对照缺少和多余的兵种」]
 *
 * 七类判据（只看 DE 数据，不看兵种名字）：
 *   城堡兵 castle   科技树 Node Type=UniqueUnit，且出自城堡（建筑 82）或保加利亚要塞（建筑 1251）
 *   文化兵 culture  科技树 Node Type=UniqueUnit，出自其他建筑（兵营／靶场／马厩／船坞／主城……）
 *   区域兵 regional 科技树 Node Type=RegionalUnit
 *   普通兵 normal   科技树 Node Type=Unit / UnitUpgrade
 *   特殊兵 special  不在任何科技树、wiki 不可训练单位清单里的非英雄单位（offtree-units.json bucket≠hero）
 *   英雄   hero     offtree-units.json bucket=hero，且兵模是具体人物（名字以「英雄·」开头，或人物御驾战象）
 *   精英兵 elite    offtree-units.json bucket=hero，但没有具体人名（巽他皇家斗士、索索人护卫、法兰克游侠……）
 *   同一兵种在多处出现时按 城堡兵 > 文化兵 > 区域兵 > 普通兵 > 精英兵/英雄/特殊兵 取。
 *
 * 数据源：public/de-techtree/trees/*.json、index.json、legion-names.json（节点 → 兵种鉴赏番号）、offtree-units.json；
 *        src/legion-editor/main.ts 的 DE_UNITS_CATALOG。
 * 产出：
 *   src/data/deUnitSourceTypes.ts                     兵种 id → 类别（兵种鉴赏筛选用）
 *   claudedocs/de-unit-source-types-diff.md           与 DE 对照：缺少／多余清单
 * 用法：node tools/de-unit-source-types.mjs
 */
import fs from 'node:fs';

const CASTLE_BUILDINGS = new Set([82, 1251]);
const PERSON_MOUNTS = new Set(['porus_elephant', 'bayinnaung_elephant', 'dagnajan_elephant']);
const RANK = { castle: 7, culture: 6, regional: 5, normal: 4, elite: 3, hero: 2, special: 1, noncombat: 0 };
const LABEL = { castle: '城堡兵', culture: '文化兵', regional: '区域兵', special: '特殊兵', normal: '普通兵', hero: '英雄', elite: '精英兵', noncombat: '非战斗' };

const mainSrc = fs.readFileSync('src/legion-editor/main.ts', 'utf8');
const block = mainSrc.slice(mainSrc.indexOf('export const DE_UNITS_CATALOG'), mainSrc.indexOf('export const DE_UNITS_MAP'));
const catalog = [...block.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)'/g)]
    .map((m) => ({ id: m[1], name: m[2], category: m[3] }));
const catById = new Map(catalog.map((c) => [c.id, c]));

const ln = JSON.parse(fs.readFileSync('public/de-techtree/legion-names.json', 'utf8'));
const index = JSON.parse(fs.readFileSync('public/de-techtree/index.json', 'utf8'));
const offtree = JSON.parse(fs.readFileSync('public/de-techtree/offtree-units.json', 'utf8'));
// 只读 units：文件头的 generatedAt / sources / totals 不是单位
const offArr = Array.isArray(offtree) ? offtree : (offtree.units ?? []);

const type = new Map();          // 兵种 id → 类别
const civsOf = new Map();        // 兵种 id → 出现的 DE 文明
// 🔴 [2026-10-19 主人令「优先英雄，哪是城堡兵，是兵」] 兵模是具体人物的（名字以「英雄·」开头或人物御驾战象），
//    一律归英雄，哪怕 DE 里能在城堡训练（魏蜀吴的曹操、刘备、孙坚）。
const isPerson = (id) => PERSON_MOUNTS.has(id) || (catById.get(id)?.name ?? '').startsWith('英雄·');
const set = (id, t) => {
    if (isPerson(id)) t = 'hero';
    // 🔴 [2026-10-19 主人令] 村民、渔船、贸易车、僧侣、女祭司、传教士（兵种鉴赏类别＝非战斗）一律归非战斗
    if (catById.get(id)?.category === 'civilian') { type.set(id, 'noncombat'); return; }
    if (!type.has(id) || RANK[t] > RANK[type.get(id)]) type.set(id, t);
};

// ── 科技树 ──
const missingTree = new Map();   // DE 英文名 → { zh, type, civs }
for (const civ of index) {
    const tree = JSON.parse(fs.readFileSync(`public/de-techtree/${civ.file}`, 'utf8'));
    const isAnt = civ.era === 'antiquity';
    for (const n of Object.values(tree.units_techs)) {
        if (n['Use Type'] !== 'Unit') continue;
        const nid = String(n['Node ID']);
        const nt = n['Node Type'];
        const t = nt === 'UniqueUnit' ? (CASTLE_BUILDINGS.has(n['Building ID']) ? 'castle' : 'culture')
            : nt === 'RegionalUnit' ? 'regional' : 'normal';
        // ⚠️ legion-names.json 的 byId 是「先到先得」：古典文明复用中世纪节点号（如 5 在中世纪＝火枪手、古典＝腹弓手），
        //    文件按字母序先读到 ACHAEMENIDS，中世纪的号就被古典兵占了。故先按英文名对号（byNorm），byId 只兜底。
        const byName = ln.byNorm[String(n.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')];
        const id = (isAnt ? (ln.byAntId[nid] ?? byName) : (ln.byMedId[nid] ?? byName)) ?? ln.byId[nid];
        if (id && catById.has(id)) {
            set(id, t);
            if (!civsOf.has(id)) civsOf.set(id, new Set());
            civsOf.get(id).add(civ.name_zh || civ.key);
        } else {
            const rec = missingTree.get(n.name) ?? { zh: String(n.name_zh || '').replace(/\n/g, ''), type: t, civs: new Set() };
            if (RANK[t] > RANK[rec.type]) rec.type = t;
            rec.civs.add(civ.name_zh || civ.key);
            missingTree.set(n.name, rec);
        }
    }
}

// ── 非科技树（wiki 不可训练单位 + 英雄）──
// offtree-units.json 的 catalogId 只对上了 5 个英雄（兵种鉴赏的英雄 id 带 hero_ 前缀），这里按英文名补对号：
// 先比「去掉 hero_ 的 id」与英文名完全相同，再比英文名以它开头且唯一（Attila the Hun → hero_attila）。
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const heroKeys = catalog.filter((c) => c.category === 'hero').map((c) => [norm(c.id.replace(/^hero_/, '')), c.id]);
const matchHero = (nameEn) => {
    const k = norm(nameEn);
    const exact = heroKeys.find(([hk]) => hk === k);
    if (exact) return exact[1];
    const pre = heroKeys.filter(([hk]) => hk.length >= 4 && k.startsWith(hk));
    return pre.length === 1 ? pre[0][1] : undefined;
};
const missingOff = [];
const claimed = new Set();
for (const u of offArr) {
    if (!u) continue;
    const cid = u.catalogId && catById.has(u.catalogId) ? u.catalogId
        : u.bucket === 'hero' ? matchHero(u.name_en) : undefined;
    if (cid && !claimed.has(cid) || (cid && u.catalogId)) {
        claimed.add(cid);
        const c = catById.get(cid);
        const t = u.bucket === 'hero'
            ? (c.name.startsWith('英雄·') || PERSON_MOUNTS.has(c.id) ? 'hero' : 'elite')
            : 'special';
        set(c.id, t);
    } else {
        // 🔴 [2026-10-19 主人令「剩下的动物、平民、秘籍玩笑单位也全部补进兵种鉴赏」] 不再只看英雄与战斗单位
        missingOff.push(u);
    }
}

// ── 逐条登记：自动对号对不上、但 DE 里确有出处的兵种（2026-10-19 逐个核实）──
// 变体（远程形态／女兵素材／带盾不带盾／精锐档）、英文名带变音（Lü Bu）或与 id 写法不同的英雄，按 DE 英文名指认。
const DE_NAME_OF = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync('tools/de-unit-name-alias.json', 'utf8'))).filter(([k]) => !k.startsWith('_')));
// DE 里有（DE 文本或 DE 素材），但既不在科技树、也不在 wiki 不可训练清单里的：直接定类，附依据
const DE_OTHER = {
    xolotl_warrior: ['special', 'DE 文本有「Xolotl Warrior」「Create Xolotl Warrior」'],
    hero_stoertebeker: ['hero', 'DE 文本有「Stoertebeker」，DE 单位 HSTOER id=114'],
    hero_basileus: ['hero', 'DE 本体剧情单位「巴西琉斯」（见 WarTypes 注释）'],
    vanguard: ['special', 'DE 素材 u_inf_vanguard（SLD），DE 文本未见单位名'],
    equites: ['special', 'DE 素材（SLD），DE 文本未见单位名'],
    sarmatian: ['special', 'DE 素材（SLD），DE 文本未见单位名'],
};
const treeTypeByName = new Map();
for (const civ of index) {
    const tree = JSON.parse(fs.readFileSync(`public/de-techtree/${civ.file}`, 'utf8'));
    for (const n of Object.values(tree.units_techs)) {
        if (n['Use Type'] !== 'Unit') continue;
        const t = n['Node Type'] === 'UniqueUnit' ? (CASTLE_BUILDINGS.has(n['Building ID']) ? 'castle' : 'culture')
            : n['Node Type'] === 'RegionalUnit' ? 'regional' : 'normal';
        if (!treeTypeByName.has(n.name) || RANK[t] > RANK[treeTypeByName.get(n.name)]) treeTypeByName.set(n.name, t);
    }
}
const offByName = new Map(offArr.filter(Boolean).map((u) => [u.name_en, u]));
const viaAlias = [];
for (const [cid, deName] of Object.entries(DE_NAME_OF)) {
    if (!catById.has(cid)) continue;
    const c = catById.get(cid);
    let t;
    if (treeTypeByName.has(deName)) t = treeTypeByName.get(deName);
    else if (offByName.has(deName)) {
        const u = offByName.get(deName);
        t = u.bucket === 'hero' ? (c.name.startsWith('英雄·') || PERSON_MOUNTS.has(c.id) ? 'hero' : 'elite') : 'special';
    }
    if (!t) { console.warn('⚠️ 登记的 DE 名在数据里没找到：', cid, deName); continue; }
    set(cid, t);
    missingTree.delete(deName);
    viaAlias.push([cid, c.name, deName, t]);
}
for (let i = missingOff.length - 1; i >= 0; i--) {
    if (Object.values(DE_NAME_OF).includes(missingOff[i].name_en)) missingOff.splice(i, 1);
}
const viaOther = [];
for (const [cid, [t, why]] of Object.entries(DE_OTHER)) {
    if (!catById.has(cid) || type.has(cid)) continue;
    set(cid, t);
    viaOther.push([cid, catById.get(cid).name, t, why]);
}

const extra = catalog.filter((c) => !type.has(c.id));

// ── 写 TS ──
const entries = catalog.filter((c) => type.has(c.id)).map((c) => `    ${JSON.stringify(c.id)}: '${type.get(c.id)}',`);
fs.writeFileSync('src/data/deUnitSourceTypes.ts', `/**
 * 兵种来源类别（DE 七类）—— 由 tools/de-unit-source-types.mjs 生成，勿手改；改判据请改脚本后重跑。
 * 🔴 [2026-10-19 主人令] 城堡兵、文化兵、区域兵、特殊兵、普通兵、英雄、精英兵、非战斗。
 * 查不到 DE 出处的兵种不在本表（兵种鉴赏显示「项目自建」）。
 */
export type DeSourceType = 'castle' | 'culture' | 'regional' | 'special' | 'normal' | 'hero' | 'elite' | 'noncombat';

export const DE_SOURCE_TYPE_LABEL: Record<DeSourceType, string> = ${JSON.stringify(LABEL, null, 4).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'")};

export const DE_SOURCE_TYPE_ORDER: DeSourceType[] = ['castle', 'culture', 'regional', 'special', 'normal', 'hero', 'elite', 'noncombat'];

export const DE_UNIT_SOURCE_TYPE: Record<string, DeSourceType> = {
${entries.join('\n')}
};
`);

// ── 写对照报告 ──
const count = {};
for (const t of type.values()) count[t] = (count[t] || 0) + 1;
const nonCombat = /Villager|Fishing|Trade|Monk|Missionary|Priestess|Transport|King|Queen|Petard|Flaming Camel|Cart/i;
const mt = [...missingTree.entries()].sort((a, b) => RANK[b[1].type] - RANK[a[1].type] || a[0].localeCompare(b[0]));
const lines = [];
lines.push('# 兵种鉴赏 × DE 对照：七类归属与缺少／多余', '');
lines.push('由 `node tools/de-unit-source-types.mjs` 生成。判据见脚本文件头。', '');
lines.push(`兵种鉴赏共 ${catalog.length} 个；能在 DE 找到出处的 ${type.size} 个：` +
    Object.keys(LABEL).map((k) => `${LABEL[k]} ${count[k] || 0}`).join('、') + '。', '');
lines.push(`## 多余：兵种鉴赏有、DE 查不到出处（${extra.length} 个）`, '');
lines.push('多为项目自建或改名后对不上号的兵种，需逐个核对是自建还是对号漏了。', '');
lines.push('| id | 名字 | 类别 |', '|---|---|---|');
for (const c of extra) lines.push(`| \`${c.id}\` | ${c.name} | ${c.category} |`);
lines.push('', `## 按 DE 英文名逐条对号的兵种（${viaAlias.length} 个）`, '');
lines.push('自动对号对不上（变体形态、女兵素材、英文名带变音等），逐个核实后登记在 tools/de-unit-name-alias.json。', '');
lines.push('| id | 名字 | DE 英文名 | 类别 |', '|---|---|---|---|');
for (const [cid, nm, de, t] of viaAlias) lines.push(`| \`${cid}\` | ${nm} | ${de} | ${LABEL[t]} |`);
lines.push('', `## DE 里有，但不在科技树和 wiki 不可训练清单里的兵种（${viaOther.length} 个）`, '');
lines.push('| id | 名字 | 类别 | 依据 |', '|---|---|---|---|');
for (const [cid, nm, t, why] of viaOther) lines.push(`| \`${cid}\` | ${nm} | ${LABEL[t]} | ${why} |`);
lines.push('', `## 缺少①：DE 科技树里有、兵种鉴赏没有（${mt.length} 个）`, '');
lines.push('| DE 英文名 | DE 中文名 | 类别 | 是否战斗单位 | 出现于文明 |', '|---|---|---|---|---|');
for (const [name, r] of mt) {
    const civs = [...r.civs];
    lines.push(`| ${name} | ${r.zh} | ${LABEL[r.type]} | ${nonCombat.test(name) ? '非战斗' : '战斗'} | ${civs.length > 6 ? civs.slice(0, 6).join('、') + ` 等 ${civs.length} 个` : civs.join('、')} |`);
}
const heroMiss = missingOff.filter((u) => u.bucket === 'hero');
const combatMiss = missingOff.filter((u) => u.bucket === 'combat');
const otherMiss = missingOff.filter((u) => u.bucket !== 'hero' && u.bucket !== 'combat');
const BUCKET_ZH = { hero: '英雄', combat: '战斗单位', animal: '动物', civilian: '平民', joke: '秘籍玩笑', object: '物件', other: '其他' };
lines.push('', `## 缺少②：DE 不可训练单位里有、兵种鉴赏没有（英雄 ${heroMiss.length} 个、战斗单位 ${combatMiss.length} 个、动物／平民／秘籍玩笑等 ${otherMiss.length} 个）`, '');
lines.push('| DE 英文名 | DE 中文名 | DE 分组 | 备注 |', '|---|---|---|---|');
for (const u of [...combatMiss, ...heroMiss, ...otherMiss]) lines.push(`| ${u.name_en} | ${u.name_zh ?? ''} | ${BUCKET_ZH[u.bucket] ?? u.bucket} | ${u.note ?? ''} |`);
// 缺少清单（机器读）：给 tools/de-extract-missing-units.py 提取素材用
fs.mkdirSync('scratch/out', { recursive: true });
fs.writeFileSync('scratch/out/de_missing_units.json', JSON.stringify([
    ...mt.map(([name, r]) => ({ name_en: name, name_zh: r.zh, from: 'tree', type: r.type, nonCombat: nonCombat.test(name) })),
    ...[...combatMiss, ...heroMiss, ...otherMiss].map((u) => ({ name_en: u.name_en, name_zh: u.name_zh ?? '', from: 'offtree', bucket: u.bucket, game: u.game, removed: !!u.removed, note: u.note ?? '' })),
], null, 1));
fs.mkdirSync('claudedocs', { recursive: true });
fs.writeFileSync('claudedocs/de-unit-source-types-diff.md', lines.join('\n') + '\n');

console.log('分类：', Object.fromEntries(Object.keys(LABEL).map((k) => [LABEL[k], count[k] || 0])));
console.log(`多余 ${extra.length}；缺少：科技树 ${mt.length}、不可训练英雄 ${heroMiss.length}、不可训练战斗单位 ${combatMiss.length}、动物／平民／秘籍玩笑 ${otherMiss.length}`);
