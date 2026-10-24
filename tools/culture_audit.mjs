/**
 * 文化战略特性审计（2026-10-24 重写；原 2026-07-29 版按 16 母体 × 五张战斗六维表审计，已作废）
 *
 * 🔴 现行口径（2026-10-18 主人定 + 2026-10-24 代码现状）：
 *   · 文化 100% 归属**大战略层**，不进战斗八环 ⇒ `TIER_TABLE` / `SPEED_TABLE` **已废除（空表）**；
 *     再往里写数值不会被读取，等于死数据。
 *   · 现行文化表按 **66 文化**开键（62 二级 + 4 三级）：`RECRUIT_TABLE`（募兵）、
 *     `LEGION_TROOP_CAP_TABLE`（军团兵力上限）、`CITY_TROOP_CAP_TABLE`（据点驻军上限），
 *     其余文化一律 ×1.00（不写键 = 1.00，属正常，不是缺键）。
 *   · 另有特性清单：山地行军免减速、海行加速、平原疾行、陆/海行军不减兵——里面的文化 ID
 *     必须是 66 之一，写错会静默失效。
 *
 * 本脚本检查：
 *   ① 66 文化键表：键必须在 66 文化里、不能有多余键、倍率在合理区间；
 *   ② TIER_TABLE / SPEED_TABLE 必须为空（已废除；若非空 = 回潮，报硬伤）；
 *   ③ 特性清单里的文化 ID 全部合法、无重复；
 *   ④ 输出每个文化吃到的战略特性（情报）。
 *
 * 用法：npm run culture:audit
 * 退出码：0 = 全绿；1 = 有硬伤
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfgSrc = fs.readFileSync(path.join(ROOT, 'src/config/GameConfig.ts'), 'utf-8');
const hierSrc = fs.readFileSync(path.join(ROOT, 'src/systems/CultureHierarchy.ts'), 'utf-8');

let failed = 0;
const fail = (msg) => { failed++; console.log('  ✗ ' + msg); };
const info = (msg) => console.log('  · ' + msg);

// ── 66 文化：62 二级 + 4 三级，全部从 CultureHierarchy.ts 读（避免第二份权威）──
function grabBlock(name) {
    const i = hierSrc.indexOf('export const ' + name);
    if (i < 0) throw new Error('CultureHierarchy.ts 里找不到 ' + name);
    const eq = hierSrc.indexOf('=', i);
    let start = eq + 1;
    while (/\s/.test(hierSrc[start])) start++;
    const open = hierSrc[start];
    const close = open === '[' ? ']' : '}';
    let depth = 0;
    for (let k = start; k < hierSrc.length; k++) {
        if (hierSrc[k] === open) depth++;
        else if (hierSrc[k] === close) { depth--; if (depth === 0) return hierSrc.slice(start, k + 1); }
    }
    throw new Error(name + ' 括号不配对');
}
const branchKeys = (block) => [...block.matchAll(/\bkey:\s*'([A-Za-z0-9_]+)'/g)].map((m) => m[1]);
const L2 = branchKeys(grabBlock('CULTURE_62_GROUPS'));
const L3 = branchKeys(grabBlock('LAYER3_CUSTOM_GROUPS'));
const CULTURES = [...L2, ...L3];
const CULTURE_SET = new Set(CULTURES);
console.log('=== 66 文化键（62 二级 + 4 三级）===');
console.log(`  二级 ${L2.length}｜三级 ${L3.length}｜合计 ${CULTURES.length}`);
if (L2.length !== 62 || L3.length !== 4 || CULTURES.length !== 66) {
    fail(`应为 62+4=66，实为 ${L2.length}+${L3.length}=${CULTURES.length}`);
}

// ── 读 GameConfig.CULTURE_COMBAT 里的表 / 清单 ──
const CC_AT = cfgSrc.indexOf('static CULTURE_COMBAT');
const ccBody = cfgSrc.slice(CC_AT);
function grabTable(name) {
    const i = ccBody.indexOf(name + ':');
    if (i < 0) throw new Error('GameConfig 里找不到 ' + name);
    const start = ccBody.indexOf('{', i);
    let depth = 0, end = -1;
    for (let k = start; k < ccBody.length; k++) {
        if (ccBody[k] === '{') depth++;
        else if (ccBody[k] === '}') { depth--; if (depth === 0) { end = k; break; } }
    }
    const body = ccBody.slice(start + 1, end);
    const out = {};
    for (const m of body.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([\d.]+)/g)) out[m[1]] = parseFloat(m[2]);
    return out;
}
function grabList(name, body = ccBody) {
    const i = body.indexOf(name + ':');
    if (i < 0) throw new Error('GameConfig 里找不到 ' + name);
    const start = body.indexOf('[', i);
    let depth = 0, end = -1;
    for (let k = start; k < body.length; k++) {
        if (body[k] === '[') depth++;
        else if (body[k] === ']') { depth--; if (depth === 0) { end = k; break; } }
    }
    return [...body.slice(start, end + 1).matchAll(/'([A-Za-z0-9_]+)'/g)].map((m) => m[1]);
}

const TABLES = {
    RECRUIT_TABLE: grabTable('RECRUIT_TABLE'),
    LEGION_TROOP_CAP_TABLE: grabTable('LEGION_TROOP_CAP_TABLE'),
    CITY_TROOP_CAP_TABLE: grabTable('CITY_TROOP_CAP_TABLE'),
};
const LISTS = {
    MOUNTAIN_MARCH_IMMUNE_CULTURES: grabList('MOUNTAIN_MARCH_IMMUNE_CULTURES'),
    SEA_SPEED_BONUS_CULTURES: grabList('SEA_SPEED_BONUS_CULTURES'),
    PLAIN_SPEED_BONUS_CULTURES: grabList('PLAIN_SPEED_BONUS_CULTURES'),
};

// ── ① 66 文化键表 ──
console.log('\n=== ① 66 文化键表（66 文化开键；未写键 = ×1.00）===');
let bad = 0;
for (const [tn, t] of Object.entries(TABLES)) {
    const keys = Object.keys(t);
    const unknown = keys.filter((k) => !CULTURE_SET.has(k));
    const outOfRange = keys.filter((k) => !(t[k] >= 1 && t[k] <= 2));
    if (unknown.length) { fail(`${tn} 含非 66 文化键: ${unknown.join(', ')}`); bad++; }
    if (outOfRange.length) { fail(`${tn} 倍率越界(1~2): ${outOfRange.map((k) => `${k}=${t[k]}`).join(', ')}`); bad++; }
    console.log(`  ${tn}: ${keys.length} 个加成键${unknown.length ? '' : ' ✓'}｜${keys.map((k) => `${k}×${t[k]}`).join('、')}`);
}
if (!bad) info('三张策略表键全部落在 66 文化内');

// ── ② 已废除的两张表必须为空 ──
console.log('\n=== ② 已废除表必须为空（文化不进战斗八环 / 行军速度由兵种+地形决定）===');
const TIER = grabTable('TIER_TABLE');
const SPEED = grabTable('SPEED_TABLE');
const tierKeys = Object.keys(TIER), speedKeys = Object.keys(SPEED);
if (tierKeys.length) fail(`TIER_TABLE 非空（${tierKeys.length} 键）—— 该表已废除，写入不会被读取；要恢复文化战斗加成立案前先问主人`);
else info('TIER_TABLE 为空 ✓（已废除）');
if (speedKeys.length) fail(`SPEED_TABLE 非空（${speedKeys.length} 键）—— 该表已废除，写入不会被读取`);
else info('SPEED_TABLE 为空 ✓（已废除）');

// ── ③ 特性清单合法性 ──
console.log('\n=== ③ 特性清单（文化 ID 必须合法、不重复）===');
for (const [ln, list] of Object.entries(LISTS)) {
    const unknown = list.filter((k) => !CULTURE_SET.has(k));
    const dup = list.filter((k, i) => list.indexOf(k) !== i);
    if (unknown.length) fail(`${ln} 含非 66 文化: ${unknown.join(', ')}`);
    if (dup.length) fail(`${ln} 有重复: ${dup.join(', ')}`);
    if (!unknown.length && !dup.length) info(`${ln}: ${list.length} 个（${list.join('、')}）✓`);
}
const ATTR = [
    ['MARCH_ATTRITION.LAND_IMMUNE_CULTURES', grabList('LAND_IMMUNE_CULTURES', cfgSrc)],
    ['MARCH_ATTRITION.NAVAL_IMMUNE_CULTURES', grabList('NAVAL_IMMUNE_CULTURES', cfgSrc)],
];
for (const [ln, list] of ATTR) {
    const unknown = list.filter((k) => !CULTURE_SET.has(k));
    if (unknown.length) fail(`${ln} 含非 66 文化: ${unknown.join(', ')}`);
    else info(`${ln}: ${list.length} 个 ✓`);
}

// ── ④ 每个文化吃到的特性（情报）──
console.log('\n=== ④ 文化战略特性一览（情报）===');
const traitOf = (c) => {
    const t = [];
    if (TABLES.RECRUIT_TABLE[c]) t.push(`募兵×${TABLES.RECRUIT_TABLE[c]}`);
    if (TABLES.LEGION_TROOP_CAP_TABLE[c]) t.push(`军团上限×${TABLES.LEGION_TROOP_CAP_TABLE[c]}`);
    if (TABLES.CITY_TROOP_CAP_TABLE[c]) t.push(`驻军上限×${TABLES.CITY_TROOP_CAP_TABLE[c]}`);
    if (LISTS.MOUNTAIN_MARCH_IMMUNE_CULTURES.includes(c)) t.push('山地行军免减速');
    if (LISTS.SEA_SPEED_BONUS_CULTURES.includes(c)) t.push('海行加速');
    if (LISTS.PLAIN_SPEED_BONUS_CULTURES.includes(c)) t.push('平原疾行');
    if (ATTR[0][1].includes(c)) t.push('陆行不减兵');
    if (ATTR[1][1].includes(c)) t.push('海行不减兵');
    return t;
};
const noTrait = CULTURES.filter((c) => traitOf(c).length === 0);
console.log(`  ${CULTURES.length - noTrait.length} 个文化有至少 1 条战略特性；无特性 ${noTrait.length} 个（正常，基准值）`);
for (const c of CULTURES) {
    const t = traitOf(c);
    if (t.length) console.log(`  ${c.padEnd(14)} ${t.join('、')}`);
}

console.log(failed ? `\n✗ 审计未通过：${failed} 处硬伤` : '\n✓ 文化战略特性审计全绿');
process.exit(failed ? 1 : 0);
