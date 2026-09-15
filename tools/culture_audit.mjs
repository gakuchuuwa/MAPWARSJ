/**
 * 文化六维属性审计（2026-07-29 立；2026-09-15 改为 16 母体口径）
 *
 * 🔴 [2026-09-15 主人定]「文化只有 16 种，就是 16 个建筑风格」——六维表不再按 172 个
 *    文化区开键（那样只填得动 29 个，55.4% 的据点静默回落 1.0），改为只在
 *    `BASE16_CULTURES` 这 16 个母体上开键，文化区一律经 `toBase16()` 归入母体。
 *    本脚本的「键完整性」因此改成两条：① 16 母体 × 5 表齐全且无多余键；
 *    ② 172 个文化区在 BASE16_OF_REGION 里**一个不漏**（漏一个就会回落东亚而不报错）。
 * ------------------------------------------------------------------
 * 校验 GameConfig.CULTURE_COMBAT 的两条约束（表头注释同款，改表后必跑）：
 *
 *   ① 邻区不得出现严格支配 —— 排名相邻的两个文化不存在「A 六维逐项 ≥ B 且至少一项 >」。
 *      （跨区支配是高位综合强的自然结果，不视为违规。）
 *   ② 每个文化必须有真实短板 —— 至少一项 ≤0.95，且不能只落在「据点兵上限」上
 *      （该维影响最小，拿它当短板等于没短板）。
 *
 * 另附键完整性检查：5 张表 × 全部文化，缺键会静默回落 1.0 而不报错，是最隐蔽的坑。
 *
 * 用法：npm run culture:audit
 * 退出码：0 = 全绿；1 = 有硬伤（①② 任一被违反或缺键）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfgSrc = fs.readFileSync(path.join(ROOT, 'src/config/GameConfig.ts'), 'utf-8');
const regionSrc = fs.readFileSync(path.join(ROOT, 'src/systems/RegionSystem.ts'), 'utf-8');
const formSrc = fs.readFileSync(path.join(ROOT, 'src/types/CultureFormations.ts'), 'utf-8');

/** 六维合计口径：攻×军团上限 + 防×据点上限 + 速 + 产 */
const DIMS = ['atk', 'def', 'spd', 'rec', 'lcap', 'ccap'];
const DIM_LABEL = { atk: '军团攻', def: '据点防', spd: '军团速', rec: '据点兵', lcap: '军上限', ccap: '城上限' };

// CULTURE_COMBAT 上方的说明注释里也写着 "TIER_TABLE:"，必须从 static 声明处往后找
const CC_AT = cfgSrc.indexOf('static CULTURE_COMBAT');

function grabTable(name) {
    const i = cfgSrc.indexOf(name + ':', CC_AT);
    if (i < 0) throw new Error(`GameConfig 里找不到 ${name}`);
    const start = cfgSrc.indexOf('{', i);
    let depth = 0, end = -1;
    for (let k = start; k < cfgSrc.length; k++) {
        if (cfgSrc[k] === '{') depth++;
        else if (cfgSrc[k] === '}') { depth--; if (depth === 0) { end = k; break; } }
    }
    const body = cfgSrc.slice(start + 1, end);
    const out = {};
    for (const m of body.matchAll(/(\w+)\s*:\s*\[([\d.]+)\s*,\s*([\d.]+)\]/g)) {
        out[m[1]] = [parseFloat(m[2]), parseFloat(m[3])];
    }
    for (const m of body.matchAll(/(\w+)\s*:\s*([\d.]+)\s*[,}]/g)) {
        if (!(m[1] in out)) out[m[1]] = parseFloat(m[2]);
    }
    return out;
}

const TABLES = {
    TIER_TABLE: grabTable('TIER_TABLE'),
    SPEED_TABLE: grabTable('SPEED_TABLE'),
    RECRUIT_TABLE: grabTable('RECRUIT_TABLE'),
    LEGION_TROOP_CAP_TABLE: grabTable('LEGION_TROOP_CAP_TABLE'),
    CITY_TROOP_CAP_TABLE: grabTable('CITY_TROOP_CAP_TABLE'),
};

/** 16 母体 + 中文名 + 区→母体映射，全部从 CultureBase16.ts 读，避免第二份权威 */
const b16Src = fs.readFileSync(path.join(ROOT, 'src/systems/CultureBase16.ts'), 'utf-8');
/** 取 `export const <name> ... = [...]` / `= {...}` 的字面量体（按括号配对，别用 indexOf(']；')
 *  —— 数组是 `] as const;` 结尾，那样会一路吞掉后面的表，实测会让 16 母体重复出现几十遍。 */
const grabBlock = (name) => {
    const i = b16Src.indexOf('export const ' + name);
    if (i < 0) throw new Error('CultureBase16.ts 里找不到 ' + name);
    const eq = b16Src.indexOf('=', i);
    let start = eq + 1;
    while (/\s/.test(b16Src[start])) start++;
    const open = b16Src[start];
    const close = open === '[' ? ']' : '}';
    let depth = 0;
    for (let k = start; k < b16Src.length; k++) {
        if (b16Src[k] === open) depth++;
        else if (b16Src[k] === close) { depth--; if (depth === 0) return b16Src.slice(start, k + 1); }
    }
    throw new Error(name + ' 括号不配对');
};
const ORDER = [...grabBlock('BASE16_CULTURES').matchAll(/'(\w+)'/g)].map((m) => m[1]);
const NAMES = {};
for (const m of grabBlock('BASE16_NAMES').matchAll(/(\w+)\s*:\s*'([^']+)'/g)) NAMES[m[1]] = m[2];
/** 全部文化区（REGION_ORDER）与它们的母体归属 */
const ALL_REGIONS = [...regionSrc
    .slice(regionSrc.indexOf('REGION_ORDER'), regionSrc.indexOf('REGION_LABELS'))
    .matchAll(/'(\w+)'/g)].map((m) => m[1]);
const REGION_TO_B16 = {};
for (const m of grabBlock('BASE16_OF_REGION').matchAll(/(\w+)\s*:\s*'(\w+)'/g)) REGION_TO_B16[m[1]] = m[2];

const MOVE_CLASS = {};
for (const m of formSrc
    .slice(formSrc.indexOf('CULTURE_MOVEMENT_CLASS: Record'), formSrc.indexOf('export function getCultureMovementClass'))
    .matchAll(/(\w+)\s*:\s*'(CAVALRY|MIXED|INFANTRY|ELEPHANT)'/g)) MOVE_CLASS[m[1]] = m[2];

const MOVE_MATRIX = {};
for (const m of cfgSrc
    .slice(cfgSrc.indexOf('MOVEMENT_MATRIX'), cfgSrc.indexOf('TERRAIN_SPEED_LERP_TAU_SEC'))
    .matchAll(/(\w+):\s*\{\s*plain:\s*([\d.]+),\s*mountain:\s*([\d.]+)/g)) {
    MOVE_MATRIX[m[1]] = { plain: parseFloat(m[2]), mountain: parseFloat(m[3]) };
}

let failed = 0;
const fail = (msg) => { failed++; console.log('  ✗ ' + msg); };

// ── 0) 键完整性 ──
console.log(`=== 键完整性（${ORDER.length} 母体 × 5 张表；缺键会静默回落 1.0）===`);
let keyBad = false;
for (const [tn, t] of Object.entries(TABLES)) {
    const miss = ORDER.filter((r) => !(r in t));
    const extra = Object.keys(t).filter((k) => !ORDER.includes(k));
    if (miss.length) { fail(`${tn} 缺键: ${miss.join(', ')}`); keyBad = true; }
    if (extra.length) { fail(`${tn} 多出未知键: ${extra.join(', ')}`); keyBad = true; }
}
for (const r of ORDER) {
    if (!(r in MOVE_CLASS)) { fail(`CULTURE_MOVEMENT_CLASS 缺 ${r}`); keyBad = true; }
}
if (ORDER.length !== 16) { fail(`母体应为 16 个，实为 ${ORDER.length} 个`); keyBad = true; }
// 文化区归属完整性：漏一个区 → toBase16 回落东亚，且零报错，是最隐蔽的坑
const unmapped = ALL_REGIONS.filter((r) => !(r in REGION_TO_B16));
const badTarget = Object.entries(REGION_TO_B16).filter(([, b]) => !ORDER.includes(b));
if (unmapped.length) { fail(`BASE16_OF_REGION 漏了 ${unmapped.length} 个文化区（会静默回落东亚）: ${unmapped.join(', ')}`); keyBad = true; }
if (badTarget.length) { fail(`BASE16_OF_REGION 指向了非母体: ${badTarget.map(([r, b]) => `${r}→${b}`).join(', ')}`); keyBad = true; }
if (!keyBad) console.log(`  ✓ 齐全（16 母体 × 5 表；${ALL_REGIONS.length} 个文化区全部有母体归属）`);

// 缺键的文化区无法算六维（引擎对它们静默回落 ×1.0）——上面已报红，这里跳过以免审计中途崩溃
const SKIPPED = ORDER.filter((r) => !TABLES.TIER_TABLE[r]);
if (SKIPPED.length) console.log(`  ↳ 以下区缺数值，不入后续六维表与平衡检查: ${SKIPPED.join(', ')}`);

const rows = ORDER.filter((r) => !SKIPPED.includes(r)).map((r) => {
    const x = {
        r, name: NAMES[r] ?? r,
        atk: TABLES.TIER_TABLE[r][0], def: TABLES.TIER_TABLE[r][1],
        spd: TABLES.SPEED_TABLE[r], rec: TABLES.RECRUIT_TABLE[r],
        lcap: TABLES.LEGION_TROOP_CAP_TABLE[r], ccap: TABLES.CITY_TROOP_CAP_TABLE[r],
        cls: MOVE_CLASS[r],
    };
    x.off = x.atk * x.lcap;
    x.dfn = x.def * x.ccap;
    x.total = x.off + x.dfn + x.spd + x.rec;
    x.plainSpd = (MOVE_MATRIX[x.cls]?.plain ?? 1) * x.spd;
    return x;
});

const pad = (s, n) => String(s).padEnd(n, ' ');
const num = (v, n = 5) => v.toFixed(2).padStart(n);

console.log('\n=== 六维表（按六维合计降序）===');
console.log('文化   大类       军团攻 据点防 军团速 据点兵 军上限 城上限 | 攻+防 合计 平原速');
for (const x of [...rows].sort((a, b) => b.total - a.total)) {
    console.log(
        `${pad(x.name, 5)} ${pad(x.cls, 9)} ${num(x.atk)} ${num(x.def)} ${num(x.spd)} ` +
        `${num(x.rec)} ${num(x.lcap)} ${num(x.ccap)} |${num(x.atk + x.def)}${num(x.total)}${num(x.plainSpd)}`,
    );
}
const totals = rows.map((x) => x.total).sort((a, b) => a - b);
console.log(
    `  合计区间 ${totals[0].toFixed(2)} ~ ${totals[totals.length - 1].toFixed(2)}` +
    `（极差 ${(((totals[totals.length - 1] / totals[0]) - 1) * 100).toFixed(1)}%）`,
);

// ── ① 邻区支配（仅检查排名相邻的文化，跨区支配是高位综合强的自然结果）──
console.log('\n=== ① 邻区支配（排名相邻文化逐项 ≥ 且至少一项 >）===');
let dom = 0;
for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i], b = rows[i + 1];
    if (DIMS.every((d) => a[d] >= b[d]) && DIMS.some((d) => a[d] > b[d])) {
        dom++;
        fail(`${a.name} 严格支配 ${b.name} —— ` +
            DIMS.map((d) => `${DIM_LABEL[d]} ${b[d]}${a[d] > b[d] ? '<' : '='}${a[d]}`).join('，'));
    }
}
if (!dom) console.log('  ✓ 无严格支配');

// ── ② 真实短板 ──
console.log('\n=== ② 真实短板（≥1 项 ≤0.95，且不能只有「城上限」一项）===');
let weakBad = 0;
for (const x of rows) {
    const lows = DIMS.filter((d) => x[d] <= 0.95);
    if (lows.length === 0) { weakBad++; fail(`${x.name} 六维无一项 ≤0.95 —— 无代价文化`); }
    else if (lows.length === 1 && lows[0] === 'ccap') {
        weakBad++;
        fail(`${x.name} 唯一低点是城上限(${x.ccap}) —— 该维影响最小，等于没短板`);
    }
}
if (!weakBad) console.log('  ✓ 每个文化都有真实代价');

// ── ③ 纯骑不得进前三 ──
// 真正的机动差距在 MOVEMENT_MATRIX（平原 象1.2/步1.4/步骑1.5/纯骑2.4，差 100%），
// 六维的速只是 ±10% 微调；纯骑若再把六维合计也做到最高，就是没有代价的全面强势。
console.log('\n=== ③ 纯骑六维合计不得进前三 ===');
const ranked = [...rows].sort((a, b) => b.total - a.total);
let cavBad = 0;
ranked.forEach((x, i) => {
    if (x.cls !== 'CAVALRY') return;
    if (i < 3) { cavBad++; fail(`纯骑文化 ${x.name} 合计排第 ${i + 1}（${x.total.toFixed(2)}），须退出前三`); }
    else console.log(`  · ${x.name} 第 ${i + 1}（${x.total.toFixed(2)}）`);
});
if (!cavBad) console.log('  ✓ 纯骑均在前三之外');

// ── ④ 文化标签文案覆盖 ──
// 战报技能条上的「能征惯战 / 山河险固」名牌按系数档精确查表，查不到会静默消失（2026-07-29 踩过）
console.log('\n=== ④ 文化标签文案覆盖（CombatUI 的 CULTURE_TAG_*_LABELS 需含每个档位）===');
const uiSrc = fs.readFileSync(path.join(ROOT, 'src/ui/CombatUI.ts'), 'utf-8');
function grabLabels(constName) {
    const i = uiSrc.indexOf(constName);
    const start = uiSrc.indexOf('{', i);
    const end = uiSrc.indexOf('};', start);
    const keys = new Set();
    for (const m of uiSrc.slice(start, end).matchAll(/([\d.]+)\s*:\s*'/g)) keys.add(parseFloat(m[1]));
    return keys;
}
const ATK_KEYS = grabLabels('CULTURE_TAG_ATK_LABELS');
const DEF_KEYS = grabLabels('CULTURE_TAG_DEF_LABELS');
let labelBad = 0;
for (const x of rows) {
    if (!ATK_KEYS.has(x.atk)) { labelBad++; fail(`${x.name} 野战 ${x.atk} 在 CULTURE_TAG_ATK_LABELS 里没有对应文案 —— 标签会消失`); }
    if (!DEF_KEYS.has(x.def)) { labelBad++; fail(`${x.name} 守军 ${x.def} 在 CULTURE_TAG_DEF_LABELS 里没有对应文案 —— 标签会消失`); }
}
if (!labelBad) {
    console.log(`  ✓ 野战 ${[...ATK_KEYS].sort((a, b) => b - a).join('/')} · 守军 ${[...DEF_KEYS].sort((a, b) => b - a).join('/')} 全覆盖`);
}

console.log(failed ? `\n✗ 审计未通过：${failed} 处硬伤` : '\n✓ 文化六维审计全绿');
process.exit(failed ? 1 : 0);
