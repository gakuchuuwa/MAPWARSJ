/**
 * 生成「非科技树兵种」数据集 → public/de-techtree/offtree-units.json
 * 数据来源（只读外部 wiki + 本仓库已提取的 DE 数据）：
 *   1) wiki「Scenario Editor (Age of Empires II)#Scenario Editor units」不可训练单位清单（78 条）
 *   2) wiki Hero (Age of Empires II) 的 untrainable 英雄表 + Hero (Chronicles) 英雄表
 *   3) wiki Category:Scenario Editor units (AoE2/Chronicles) 里但清单没写的补充条目
 *   4) 本仓库：src/legion-editor/main.ts 的 DE_UNITS_CATALOG（是否已收录）、
 *      public/de-techtree/unit-icons.json（DE 图标号）、public/de-techtree/strings-en|zh.json（官方中英文名）
 * 用法: node tools/gen-de-offtree-units.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://ageofempires.fandom.com/api.php';
const OUT = 'public/de-techtree/offtree-units.json';
const get = async (u) => {
    for (let i = 0; i < 3; i++) {
        try { const r = await fetch(u); if (r.ok) return await r.json(); } catch { /* retry */ }
        await new Promise((r) => setTimeout(r, 800));
    }
    throw new Error('fetch failed: ' + u);
};

// ---------------------------------------------------------------- 本地数据
const en = JSON.parse(fs.readFileSync('public/de-techtree/strings-en.json', 'utf8'));
const zh = JSON.parse(fs.readFileSync('public/de-techtree/strings-zh.json', 'utf8'));
const unitIcons = JSON.parse(fs.readFileSync('public/de-techtree/unit-icons.json', 'utf8'));

const mainSrc = fs.readFileSync('src/legion-editor/main.ts', 'utf8');
const block = mainSrc.slice(mainSrc.indexOf('export const DE_UNITS_CATALOG'), mainSrc.indexOf('export const DE_UNITS_MAP'));
const catalog = [...block.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)'/g)]
    .map((m) => ({ id: m[1], name: m[2], category: m[3] }));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const catByKey = new Map(catalog.map((c) => [norm(c.id), c]));
const CATEGORY_TO_CLS = { infantry: 'infantry', cavalry: 'cavalry', ranged: 'ranged', siege: 'siege', naval: 'naval', hero: 'hero' };

/** 英文名 → 官方中文名（用 strings-en 反查 string id，再取 strings-zh 同 id） */
const zhByName = new Map();
for (const [id, v] of Object.entries(en)) {
    if (typeof v !== 'string' || !v || v.length > 40) continue;
    const key = norm(v);
    if (key && !zhByName.has(key) && typeof zh[id] === 'string' && zh[id]) zhByName.set(key, zh[id]);
}
const zhOf = (nameEn) => zhByName.get(norm(nameEn)) || null;

/** 兵种表收录情况（按英文名 token 或 wiki 名匹配） */
// wiki 名 → 项目兵种表 id 的别名（同一个 DE 单位在两个体系里叫法不同）
const CATALOG_ALIAS = {
    'mercenarypeltast': 'thracian_peltast',   // wiki「Mercenary Peltast」= DE dat 内部名 "Thracian Peltast"（兵种表：色雷斯标枪手）
    'lysandersraider': 'lysander_raider',     // 撇号导致规范化后多一个 s
};
const catalogOf = (nameEn) => {
    const k = norm(nameEn);
    if (CATALOG_ALIAS[k] && catByKey.has(norm(CATALOG_ALIAS[k]))) return catByKey.get(norm(CATALOG_ALIAS[k]));
    if (catByKey.has(k)) return catByKey.get(k);
    // "Heavy Pikeman (Age of Empires II)" → heavy_pikeman
    for (const [key, c] of catByKey) if (key === k.replace(/ageofempiresii$/, '')) return c;
    return null;
};

// ---------------------------------------------------------------- wiki：不可训练清单
const sec = await get(`${API}?action=parse&page=Scenario%20Editor%20(Age%20of%20Empires%20II)&prop=wikitext&section=28&format=json`);
const listWt = sec.parse.wikitext['*'];
const listEntries = [];
for (const line of listWt.split('\n').filter((l) => l.startsWith('* '))) {
    // 只取正文链接，跳过 File:/Image: 图片链接
    const links = [...line.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)].filter((m) => !/^(File|Image):/i.test(m[1]));
    const isUpgrade = /→/.test(line);
    // 「普通 → 精锐」行取基础形态（第一个链接），其余取最后一个链接
    const link = links.length ? (isUpgrade ? links[0] : links[links.length - 1]) : null;
    const raw = line.replace(/^\* /, '').replace(/\*\*\s*$/, '').trim();
    const display = (link ? (link[2] || link[1]) : raw).split('→')[0].trim();
    listEntries.push({
        wikiTitle: link ? link[1] : null,
        name_en: display.replace(/\s*\((Age of Empires II|Chronicles|Age of Empires|Unconvertible)[^)]*\)\s*/g, '').trim(),
        gaia: line.trimEnd().endsWith('**'),
        game: /Chronicles/.test(line) ? 'chronicles' : 'aoe2',
        hasUpgrade: isUpgrade,
    });
}

// ---------------------------------------------------------------- wiki：英雄
const parseHeroes = (wt, game) => {
    const out = [];
    const start = wt.indexOf('List of untrainable hero units') >= 0 ? wt.indexOf('List of untrainable hero units') : wt.indexOf('== Campaign heroes ==');
    const end = wt.indexOf('== List of unconstructible hero buildings') >= 0 ? wt.indexOf('== List of unconstructible hero buildings') : wt.indexOf('== Gallery ==');
    const seg = wt.slice(start, end > start ? end : undefined);
    for (const chunk of seg.split(/\n\|-\n/)) {
        // 取该行的第一个「主体链接」（跳过 File:/Image: 图片链接）
        const nameLine = chunk.split('\n').find((l) => /^\|\s*(\[\[|{{)/.test(l) && !/^\|\s*-/.test(l));
        if (!nameLine) continue;
        const links = [...nameLine.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)].filter((m) => !/^(File|Image):/i.test(m[1]));
        if (!links.length) continue;
        const pick = links[links.length - 1];
        let name = (pick[2] || pick[1]).split('<br')[0].trim();
        if (!name) continue;
        // type 行：紧跟名字行之后的第一行
        const lines = chunk.split('\n');
        const idx = lines.indexOf(nameLine);
        let type = '';
        for (let i = idx + 1; i < lines.length; i++) { if (/^\|/.test(lines[i]) && !/^\|-/.test(lines[i])) { type = lines[i].slice(1).trim(); break; } }
        const clsText = type.replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/<[^>]+>/g, '').trim();
        out.push({
            name_en: name.replace(/\s*\((unit|Chronicles)[^)]*\)\s*/g, '').replace(/\s*\(campaign unit\)\s*/i, '').trim(),
            game,
            removed: /\(removed\)/.test(chunk),
            clsText,
        });
    }
    return out;
};
const heroAoe2Wt = (await get(`${API}?action=parse&page=Hero%20(Age%20of%20Empires%20II)&prop=wikitext&format=json`)).parse.wikitext['*'];
const heroChrWt = (await get(`${API}?action=parse&page=Hero%20(Chronicles)&prop=wikitext&format=json`)).parse.wikitext['*'];
const heroes = [
    ...parseHeroes(heroAoe2Wt, 'aoe2').filter((h) => !/Cao Cao|Liu Bei|Sun Jian/.test(h.name_en) || !/trainable/i.test(h.clsText)),
    ...parseHeroes(heroChrWt, 'chronicles'),
];

// ---------------------------------------------------------------- wiki：分类（判定兵种类别）
const wanted = new Set();
for (const e of listEntries) { if (e.wikiTitle) wanted.add(e.wikiTitle); wanted.add(e.name_en); }
const wantedList = [...wanted].filter(Boolean);
const cats = {};
for (let i = 0; i < wantedList.length; i += 40) {
    const batch = wantedList.slice(i, i + 40).map(encodeURIComponent).join('%7C');
    const r = await get(`${API}?action=query&prop=categories&titles=${batch}&cllimit=500&format=json`);
    for (const p of Object.values(r.query.pages)) cats[p.title] = (p.categories || []).map((c) => c.title.replace(/^Category:/, ''));
}
const catsOf = (e) => cats[e.wikiTitle] || cats[e.name_en] || [];

const JOKE = new Set(['Cobra Car', 'Photonman', 'Furious the Monkey Boy', 'Stormy Dog', 'Sharkatzor', 'Alfred the Alpaca', 'War Penguin', 'Dummy Target', 'VMDL', 'Penguin']);
const ANIMAL_NAMES = new Set(['Alpaca', 'Bactrian Camel', 'Camel', 'Horse', 'Donkey', 'Dire Wolf', 'Iron Boar', 'Monkey', 'Penguin', 'Goat', 'Nessie', 'Rabid Wolf', 'Wild Alpaca', 'Wild Bactrian Camel', 'Wild Camel', 'Wild Horse', 'Butterflies', 'War Dog']);
const CIVILIAN_NAMES = new Set(['King', 'Queen', 'Merchant', 'Cart', 'Ox Cart', 'Ox Wagon', 'Relic Cart', 'Treasure Chest', 'Repairer', 'Priest', 'Pagan Priest', 'Wheeled Ship', 'Spy']);
const CLS_RULES = [
    [/gunpowder infantry/i, 'ranged'], [/ranged infantry|archer|slinger|javelineer/i, 'ranged'],
    [/ranged cavalry|mounted archer/i, 'ranged'],
    [/melee infantry/i, 'infantry'], [/melee cavalry|camel units/i, 'cavalry'],
    [/mechanical artillery|siege/i, 'siege'],
    [/warship|ships in age of empires ii|naval/i, 'naval'],
];
const bucketOf = (e) => {
    const c = catsOf(e);
    const joined = c.join(' | ');
    if (JOKE.has(e.name_en) || /cheat units|easter eggs/i.test(joined)) return 'joke';
    if (ANIMAL_NAMES.has(e.name_en) || /wildlife|huntables|military animals/i.test(joined)) return 'animal';
    if (/hero/i.test(joined)) return 'hero';
    if (/infantry|cavalry|archer|siege|warship|ships in|slinger|javelineer|gunpowder|artillery|camel|elephant/i.test(joined) && !/civilian units|healers|trade units|wagons/i.test(joined)) return 'combat';
    if (CIVILIAN_NAMES.has(e.name_en) || /civilian units|healers|trade units|capturable units|wagons|female units|objects|decoration/i.test(joined)) return 'civilian';
    return 'other';
};
const clsOf = (e) => {
    const joined = catsOf(e).join(' | ');
    for (const [re, cls] of CLS_RULES) if (re.test(joined)) return cls;
    return 'other';
};

// ---------------------------------------------------------------- 汇总
const rows = [];
const push = (o) => rows.push(o);
for (const e of listEntries) {
    const bucket = bucketOf(e);
    const cat = catalogOf(e.name_en);
    const icon = cat ? unitIcons[cat.id] : null;
    push({
        name_en: e.name_en,
        name_zh: zhOf(e.name_en) || (cat ? cat.name : ''),
        cls: clsOf(e),
        bucket,
        game: e.game,
        kind: 'editor',
        gaia: e.gaia,
        hasUpgrade: e.hasUpgrade,
        removed: false,
        inCatalog: !!cat,
        catalogId: cat ? cat.id : null,
        catalogName: cat ? cat.name : null,
        iconUrl: icon || null,
        spriteUrl: cat ? null : null,
        wikiUrl: e.wikiTitle ? `https://ageofempires.fandom.com/wiki/${encodeURIComponent(e.wikiTitle.replace(/ /g, '_'))}` : null,
        note: e.gaia ? 'Gaia 专属' : '',
    });
}
// 英雄（不在 78 条清单里，单列一类）
const heroSeen = new Set();
for (const h of heroes) {
    const key = norm(h.name_en);
    if (!key || heroSeen.has(key)) continue;
    heroSeen.add(key);
    const cat = catalogOf(h.name_en);
    push({
        name_en: h.name_en,
        name_zh: zhOf(h.name_en) || (cat ? cat.name : ''),
        cls: cat ? CATEGORY_TO_CLS[cat.category] ?? 'other' : 'other',
        bucket: 'hero',
        game: h.game,
        kind: 'hero',
        gaia: false,
        hasUpgrade: false,
        removed: !!h.removed,
        inCatalog: !!cat,
        catalogId: cat ? cat.id : null,
        catalogName: cat ? cat.name : null,
        iconUrl: cat ? unitIcons[cat.id] || null : null,
        spriteUrl: null,
        wikiUrl: `https://ageofempires.fandom.com/wiki/${encodeURIComponent(h.name_en.replace(/ /g, '_'))}`,
        note: h.clsText ? `英雄类型：${h.clsText}` : '',
    });
}
// 只在分类里、清单没写的补充条目
for (const extra of [
    { name_en: 'Boarding Galley', cls: 'naval', bucket: 'combat', note: '分类里有、清单未列（接舷战船）' },
    { name_en: 'Outlaw', cls: 'infantry', bucket: 'combat', note: '分类里有、清单未列（Genie 隐藏步兵）' },
    { name_en: 'Spy', cls: 'other', bucket: 'civilian', note: '分类里有、清单未列（谍报单位，非战斗兵种）' },
]) {
    if (rows.some((r) => norm(r.name_en) === norm(extra.name_en))) continue;
    const cat = catalogOf(extra.name_en);
    push({
        name_en: extra.name_en, name_zh: zhOf(extra.name_en) || (cat ? cat.name : ''), cls: extra.cls, bucket: extra.bucket,
        game: 'aoe2', kind: 'gamefile', gaia: false, hasUpgrade: false, removed: false,
        inCatalog: !!cat, catalogId: cat ? cat.id : null, catalogName: cat ? cat.name : null,
        iconUrl: cat ? unitIcons[cat.id] || null : null, spriteUrl: null,
        wikiUrl: `https://ageofempires.fandom.com/wiki/${encodeURIComponent(extra.name_en.replace(/ /g, '_'))}`,
        note: extra.note,
    });
}

// ---------------------------------------------------------------- 图标：给每个单位抓 DE 官方图标（本地缓存，避免运行时依赖外网）
const ICON_DIR = 'public/de-techtree/offtree-icons';
fs.mkdirSync(ICON_DIR, { recursive: true });
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleToRow = new Map();
const ICON_ALIAS = { 'Themistocles (Warship)': 'Themistocles', 'Alexander (Dismounted)': 'Alexander' };
for (const r of rows) {
    let t = (r.wikiUrl ? decodeURIComponent(r.wikiUrl.split('/wiki/')[1] || '') : r.name_en).replace(/_/g, ' ').split('#')[0].trim();
    if (!t) t = r.name_en;
    const variants = [t, r.name_en, ICON_ALIAS[r.name_en], `${r.name_en} (Age of Empires II)`, `${r.name_en} (Chronicles)`]
        .map((x) => String(x || '').split('#')[0].trim())
        .filter(Boolean);
    r._titles = [...new Set(variants)];
    for (const v of r._titles) if (!titleToRow.has(v)) titleToRow.set(v, r);
}
const titles = [...titleToRow.keys()];
const imgUrlByTitle = {};
for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40).map(encodeURIComponent).join('%7C');
    const r = await get(`${API}?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=128&redirects=1&titles=${batch}&format=json`);
    for (const p of Object.values(r.query.pages)) {
        const u = p.thumbnail?.source;
        if (u) imgUrlByTitle[p.title] = u;
    }
    for (const rd of r.query.redirects || []) if (imgUrlByTitle[rd.to]) imgUrlByTitle[rd.from] = imgUrlByTitle[rd.to];
}
let iconOk = 0, iconFail = 0, iconCached = 0;
const noIcon = [];
// 下载必须带浏览器头部：否则 fandom 的 Cloudflare 会返回「Just a moment…」挑战页（HTML）
const DL_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8',
    'Referer': 'https://ageofempires.fandom.com/',
};
/** 已存在的文件是不是真图片（旧的挑战页 HTML 会被判为无效并重下） */
const isRealImage = (file) => {
    if (!fs.existsSync(file)) return false;
    const b = fs.readFileSync(file).subarray(0, 12);
    const hex = b.toString('hex');
    return hex.startsWith('89504e47') || hex.startsWith('ffd8ff') || hex.startsWith('52494646') || hex.startsWith('47494638');
};
const EXT_BY_TYPE = (ct) => (ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('gif') ? 'gif' : 'jpg');
for (const row of rows) {
    const title = (row._titles || []).find((t) => imgUrlByTitle[t]);
    const src = title ? imgUrlByTitle[title] : null;
    if (!src) { iconFail++; noIcon.push(row.name_en); continue; }
    const base = `${ICON_DIR}/${slug(row.name_en)}`;
    let file = ['png', 'jpg', 'webp', 'gif'].map((e) => `${base}.${e}`).find(isRealImage) || null;
    if (file) iconCached++;
    else {
        try {
            const res = await fetch(src, { headers: DL_HEADERS });
            const ct = res.headers.get('content-type') || '';
            if (!res.ok) throw new Error('HTTP ' + res.status);
            if (!ct.startsWith('image/')) throw new Error('非图片 content-type: ' + ct);
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length < 200) throw new Error('文件过小');
            file = `${base}.${EXT_BY_TYPE(ct)}`;
            fs.writeFileSync(file, buf);
        } catch (e) {
            iconFail++; noIcon.push(`${row.name_en}(${String(e).slice(0, 40)})`); continue;
        }
    }
    row.localIcon = `/de-techtree/offtree-icons/${path.basename(file)}`;
    delete row._titles;
    iconOk++;
}
console.log(`图标：成功 ${iconOk}（其中复用缓存 ${iconCached}） / 失败 ${iconFail}${noIcon.length ? ' → ' + noIcon.join(', ') : ''}`);

// 素材：兵种表里有的，写 SUCAI 贴图路径（懒加载画 idle 帧）
for (const r of rows) {
    if (!r.catalogId) continue;
    const m = block.match(new RegExp(`id: '${r.catalogId}'[^}]*?pathPrefix: '([^']+)'`));
    if (!m) continue;
    // 帧号不一定有 idle_2，按顺序取第一个真实存在的
    const cand = ['idle_2', 'idle_3', 'idle_1', 'idle_0', 'idle_4'].find((f) => fs.existsSync(`public${m[1]}${f}.png`));
    r.spriteDir = m[1];
    r.spriteUrl = cand ? `${m[1]}${cand}.png` : null;
}

const isCombat = (r) => r.bucket === 'combat';
const data = {
    generatedAt: new Date().toISOString(),
    sources: {
        untrainableList: 'https://ageofempires.fandom.com/wiki/Scenario_Editor_(Age_of_Empires_II)#Scenario_Editor_units',
        heroesAoe2: 'https://ageofempires.fandom.com/wiki/Hero_(Age_of_Empires_II)',
        heroesChronicles: 'https://ageofempires.fandom.com/wiki/Hero_(Chronicles)',
        categories: 'Category:Scenario Editor units (Age of Empires II) / (Chronicles)',
        local: 'public/de-techtree/strings-en|zh.json + unit-icons.json + src/legion-editor/main.ts DE_UNITS_CATALOG',
    },
    totals: {
        all: rows.length,
        combat: rows.filter(isCombat).length,
        combatAoe2: rows.filter((r) => isCombat(r) && r.game === 'aoe2').length,
        combatChronicles: rows.filter((r) => isCombat(r) && r.game === 'chronicles').length,
        hero: rows.filter((r) => r.bucket === 'hero').length,
        animal: rows.filter((r) => r.bucket === 'animal').length,
        civilian: rows.filter((r) => r.bucket === 'civilian').length,
        joke: rows.filter((r) => r.bucket === 'joke').length,
        other: rows.filter((r) => r.bucket === 'other').length,
        inCatalog: rows.filter((r) => r.inCatalog).length,
        missing: rows.filter((r) => !r.inCatalog).length,
        combatInCatalog: rows.filter((r) => isCombat(r) && r.inCatalog).length,
        combatMissing: rows.filter((r) => isCombat(r) && !r.inCatalog).length,
        withZhName: rows.filter((r) => r.name_zh).length,
    },
    units: rows,
};
fs.writeFileSync(OUT, JSON.stringify(data, null, 1), 'utf8');
console.log('写入', OUT);
console.log(JSON.stringify(data.totals, null, 1));
console.log('\n兵种（combat）明细:');
for (const r of rows.filter(isCombat)) console.log(`  ${(r.name_zh || '-').padEnd(18)} ${r.name_en.padEnd(28)} ${r.cls.padEnd(9)} ${r.game.padEnd(11)} ${r.inCatalog ? '已收录 ' + r.catalogId : '未收录'}`);
