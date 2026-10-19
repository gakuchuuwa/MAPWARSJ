/**
 * 把「兵种鉴赏 × DE 对照」里缺少的单位写进项目：兵种鉴赏（DE_UNITS_CATALOG）、子类（UNIT_SUBCATEGORY）、
 * 数值（WAR_TYPES）、素材（UNIT_ASSETS）。🔴 [2026-10-19 主人令「全部解析……不能缺少任何单位」]
 *
 * 输入：scratch/out/de_missing_units_resolved.json（tools/de-extract-missing-units.py --run 产出，含 DE 本体数值与素材目录）
 *       tools/de-missing-units-table.json（逐条登记：id、中文名、是否具体人物、文化、时代）
 * 规则：
 *   · 具体人物 → 「英雄·人名·文化」；没有人名 → 精英兵，用 DE 官方中文名；
 *   · 时代按兵模样子：借用哪个兵种的模型，就取那个兵种在兵种鉴赏里的时代（登记表写了 age 的以登记表为准）；
 *   · 数值照 DE 本体（射程、速度 ×40 换算成 px，与 WAR_TYPES 现有口径一致）；
 *     DE 里攻击为 0 的英雄按 2026-10-18 主人定「非攻击性英雄统一设为简单魔法形态，威力与其他英雄对齐」，
 *     取与伊玛目、贾亚纳加拉相同的法术形态（攻 14、射程 220、装填 2 秒、穿刺），原值写进注释。
 * 幂等：id 已存在的跳过。用法：node tools/de-add-missing-units.mjs
 */
import fs from 'node:fs';

const resolved = JSON.parse(fs.readFileSync('scratch/out/de_missing_units_resolved.json', 'utf8')).rows;
const table = JSON.parse(fs.readFileSync('tools/de-missing-units-table.json', 'utf8'));

const readLF = (f) => { const raw = fs.readFileSync(f, 'utf8'); return { crlf: raw.includes('\r\n'), s: raw.replace(/\r\n/g, '\n') }; };
const writeBack = (f, o) => fs.writeFileSync(f, o.crlf ? o.s.replace(/\n/g, '\r\n') : o.s);

const MAIN = 'src/legion-editor/main.ts';
const WAR = 'src/data/WarTypes.ts';
const ASSETS = 'src/config/UnitAssets.ts';
const main = readLF(MAIN), war = readLF(WAR), assets = readLF(ASSETS);

const catalog = new Map([...main.s.matchAll(/\{ id: '([^']+)', name: '([^']+)', category: '(\w+)', age: '(\w+)', pathPrefix: '([^']+)'/g)]
    .map((m) => [m[1], { id: m[1], name: m[2], category: m[3], age: m[4], path: m[5] }]));
const subBlockStart = main.s.indexOf('export const UNIT_SUBCATEGORY');
const subOf = new Map([...main.s.slice(subBlockStart, main.s.indexOf('\n};', subBlockStart)).matchAll(/(\w+): '(\w+)'/g)].map((m) => [m[1], m[2]]));
const warLine = (id) => war.s.match(new RegExp(`^\\s*${id}: \\{[^\\n]*`, 'm'))?.[0] ?? '';

const MOUNTED = new Set([12, 23, 36, 47]);
const SIEGE = new Set([13, 35, 51, 54]);
const SHIP = new Set([2, 3, 21, 22]);

const catLines = [], subLines = [], warLines = [], assetLines = [], skipped = [], done = [];
for (const r of resolved) {
    let t = table[r.name_en];
    if (!t && ['animal', 'civilian', 'joke', 'combat'].includes(r.bucket)) {
        // 🔴 [2026-10-19 主人令「剩下的动物、平民、秘籍玩笑单位也全部补进」] 没有人名，用 DE 官方中文名；
        //    类别：平民＝非战斗；动物、玩笑单位能打的按作战方式归类，不能打的归非战斗；
        //    时代：动物没有时代，取封建；平民（国王、商人、祭司、牛车……）中世纪样子，取城堡；玩笑单位（光子人、眼镜蛇跑车）现代样子，取帝国
        const id = r.name_en.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        const fights = (r.atk || 0) > 0;
        // 动物、玩笑单位不编入军团 → 「其他」（不参加「步兵/骑兵/远程都要被军团套用」校验）
        const cat = r.bucket === 'animal' || r.bucket === 'joke' ? 'other'
            : r.bucket === 'civilian' || !fights ? 'civilian'
            : SIEGE.has(r.class) ? 'siege'
            : MOUNTED.has(r.class) ? 'cavalry'
            : (r.range || 0) >= 2 ? 'ranged' : 'infantry';
        t = { id, named: false, cat, age: r.bucket === 'joke' ? 'imperial' : r.bucket === 'civilian' ? 'castle' : 'feudal' };
    }
    if (!t) { skipped.push(`${r.name_en}（登记表里没有）`); continue; }
    if (catalog.has(t.id)) { skipped.push(`${r.name_en}（${t.id} 已存在）`); continue; }
    const dir = r.reuseDir || r.newDir;
    if (!dir) { skipped.push(`${r.name_en}（没有素材目录）`); continue; }
    const owner = r.reuseOf ? catalog.get(r.reuseOf) : null;
    const zh = (t.zh || r.name_zh || r.name_en).replace(/\\n|\n/g, '');
    const named = !!t.named;
    const name = named ? `英雄·${zh}·${t.culture}` : zh;
    const category = t.cat || (r.from === 'offtree' ? 'hero' : 'infantry');
    const age = t.age || owner?.age || 'feudal';

    // ── 数值（DE 本体）──
    const attacks = r.attacks || [], armours = r.armours || [];
    const rng = Math.round((r.range || 0) * 40);
    const pierce = rng >= 40 && attacks.some(([c, a]) => c === 3 && a > 0);
    const bonus = Object.fromEntries(attacks.filter(([c, a]) => c !== 3 && c !== 4 && a > 0));
    const armorTags = [...new Set(armours.map(([c]) => c).filter((c) => c !== 3 && c !== 4))];
    const ownerWar = owner ? warLine(owner.id) : '';
    const sz = Number(ownerWar.match(/sz: ([\d.]+)/)?.[1] ?? 1);
    const aoe = /aoe: true/.test(ownerWar);
    const magic = category === 'hero' && !(r.atk > 0);
    let w = {
        cls: MOUNTED.has(r.class) ? 'cav' : rng >= 80 ? 'ranged' : 'melee',
        hp: r.hp, atk: r.atk, meleeArmor: r.meleeArmor, pierceArmor: r.pierceArmor, rng,
        reload: Math.round((r.reload || 2) * 100) / 100, spd: Math.round((r.speed || 0) * 40),
        dmgType: pierce ? 'pierce' : 'melee',
    };
    let note = `DE 本体数值（dat#${r.dat_id} ${r.dat_name}）`;
    if (magic) {
        note = `DE 原值 hp${r.hp} atk${r.atk}；🔴 [2026-10-18 主人定] 非攻击性英雄统一设为简单魔法形态，威力与其他英雄对齐`;
        w = { ...w, cls: w.cls === 'cav' ? 'cav' : 'melee', hp: Math.max(r.hp, r.class === 18 ? 220 : 250), atk: 14, meleeArmor: 2, pierceArmor: 3, rng: 220, reload: 2.0, dmgType: 'pierce' };
    }
    const bonusStr = Object.keys(bonus).length ? `, bonus: { ${Object.entries(bonus).map(([k, v]) => `${k}: ${v}`).join(', ')} }` : '';
    warLines.push(`    ${t.id}: { name: '${name}', cls: '${w.cls}', sz: ${sz}${aoe ? ', aoe: true' : ''}, hp: ${w.hp}, atk: ${w.atk}, meleeArmor: ${w.meleeArmor}, pierceArmor: ${w.pierceArmor}, rng: ${w.rng}, reload: ${w.reload}, spd: ${w.spd}, dmgType: '${w.dmgType}'${bonusStr}, armorTags: [${armorTags.join(', ')}] },   // [2026-10-19 补入] ${note}`);

    // ── 子类 ──
    let sub = null;
    if (category === 'siege') sub = 'mechanical';
    else if (category === 'hero' && !SIEGE.has(r.class)) {
        const ownerSub = owner ? subOf.get(owner.id) : null;
        if (SHIP.has(r.class)) sub = 'naval_hero';
        else if (magic) sub = 'magic_hero';
        else if (ownerSub === 'elephant' || ownerSub === 'elephant_hero' || /_ele_/.test(r.prefix)) sub = 'elephant_hero';
        else if (w.cls === 'cav') sub = w.dmgType === 'pierce' ? 'horse_archer_hero' : 'mounted_hero';
        else sub = w.dmgType === 'pierce' ? 'foot_archer_hero' : 'foot_hero';
    }
    if (sub) subLines.push(`    ${t.id}: '${sub}',`);

    // ── 兵种鉴赏 ──
    const from = owner ? `借用「${owner.name}」兵模` : `素材 ${dir}`;
    catLines.push(`    { id: '${t.id}', name: '${name}', category: '${category}', age: '${age}', pathPrefix: '${dir}' },   // [2026-10-19 补入] DE「${r.name_en}」dat#${r.dat_id}；${from}${t.fix ? '；' + t.fix : ''}`);

    // ── 素材 ──
    const has = (a) => fs.existsSync(`public${dir}${a}_0.png`);
    const arr = (a) => has(a) ? `[0, 1, 2, 3, 4, 5, 6, 7].map(dir => \`${dir}${a}_\${dir}.png\`)` : '[]';
    // 动物库的移动图叫 walk；贸易库的商人只有移动图（没有待命），待命就用移动图
    const moveA = has('move') ? 'move' : has('walk') ? 'walk' : 'idle';
    const idleA = has('idle') ? 'idle' : moveA;
    assetLines.push(`        '${t.id}': {\n            // 【${name}】[2026-10-19 补入] DE「${r.name_en}」，${from}\n            MOVE: ${arr(moveA)},\n            ATTACK: ${arr(has('attack') ? 'attack' : idleA)},\n            IDLE: ${arr(idleA)},\n            DAMAGE: ${arr(has('attack') ? 'attack' : idleA)},\n            DEATH: ${arr('death')},\n        },`);
    done.push(t.id);
}

if (done.length) {
    // 兵种鉴赏：插在 DE_UNITS_CATALOG 结尾
    const mapIdx = main.s.indexOf('export const DE_UNITS_MAP');
    const catEnd = main.s.lastIndexOf('\n]', mapIdx) + 1;   // 数组以「]」收尾（无分号）
    if (mapIdx < 0 || catEnd <= 0 || catEnd < main.s.indexOf('export const DE_UNITS_CATALOG')) throw new Error('DE_UNITS_CATALOG 结尾没找到');
    main.s = main.s.slice(0, catEnd) + '    // ── 2026-10-19 主人令「全部解析……不能缺少任何单位」：补入 DE 有、兵种鉴赏原先没有的单位（tools/de-add-missing-units.mjs 生成）──\n' + catLines.join('\n') + '\n' + main.s.slice(catEnd);
    const s2 = main.s.indexOf('export const UNIT_SUBCATEGORY');
    const subEnd = main.s.indexOf('\n};', s2);
    main.s = main.s.slice(0, subEnd) + '\n    // ── 2026-10-19 补入的 DE 单位 ──\n' + subLines.join('\n') + main.s.slice(subEnd);
    writeBack(MAIN, main);

    const w0 = war.s.indexOf('export const WAR_TYPES');
    const warEnd = war.s.indexOf('\n};', w0);
    war.s = war.s.slice(0, warEnd) + '\n    // ── 2026-10-19 主人令「全部解析……不能缺少任何单位」：补入的 DE 单位（tools/de-add-missing-units.mjs 生成）──\n' + warLines.join('\n') + war.s.slice(warEnd);
    writeBack(WAR, war);

    const anchor = '    },\n    // 旧 public/assets/avg/NPC';
    if (!assets.s.includes(anchor)) throw new Error('UNIT_ASSETS 结尾锚点没找到');
    assets.s = assets.s.replace(anchor, '        // ── 2026-10-19 补入的 DE 单位（tools/de-add-missing-units.mjs 生成）──\n' + assetLines.join('\n') + '\n' + anchor);
    writeBack(ASSETS, assets);
}
console.log(`写入 ${done.length} 个；跳过 ${skipped.length} 个`);
for (const s of skipped) console.log('  跳过', s);
