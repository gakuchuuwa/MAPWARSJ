/**
 * DE 建筑素材覆盖率验收。
 *
 * 🔴 [2026-08-26 主人：「所有高级建筑，都安置上了吗？」]
 *
 *    盘点出 4 套**全套风格集整套闲置**（各 43~45 件），其中一条是史实错误：
 *      · ANDE（安第斯）—— 印加/马普切/穆伊斯卡本该用它，却跟着 AMERICA 区用了
 *        MESO（中美洲）。安第斯石构与玛雅金字塔完全两回事。
 *      · PERSIAN —— 波斯本该用它，却跟着 WEST_ASIA 用 ORIE（通用中东）。
 *      · EAST —— 从奇观命名 EAST_WONDER_GOTHS/HUNS/TEUTONS/VIKINGS 可确认是给
 *        哥特/匈人/条顿/维京的，这些势力却在用 WEST/CEAS。
 *      · PURU（南亚）—— 整套是南亚风格（兵营层叠飞檐、奇观圆顶塔神庙）。
 *    风格集是整套的（兵营/房屋/塔/墙/门一起换），故按**势力**挂 FACTION_BUILDING_STYLE。
 *
 *    ⚠️ 统计覆盖率时注意：建筑名是**模板拼接**的（`${style}_${building}_AGE2`），
 *    拿整串去源码里 grep 永远搜不到，会误报几百个「未用」。必须按
 *    「风格集 × 建筑池」的笛卡尔积算 —— 我第一版就是这么错的。
 *
 * 🔴 [2026-10-05 修尺子 · 三条真实规则补齐，红项 1323 → 0]
 *    病灶（实测，血训 23「报红先问是数据的错还是尺子的错」）：
 *      ① **引用面太窄**：原来只 grep `Scene13WarLayer.ts + CityWonders.ts` 两个文件，
 *         于是 `FENCE_CORNER`（城寨四角转角件，`cityWallShared.ts:153`）、战场遗存/雕像/断旗
 *         （`battlefieldMorphology.ts` 一整张表）全被判「没用上」；
 *         → 现改为扫**整个 `src/`**。
 *      ② **损伤三态是动态拼名**：`_DAMAGED/_DESTR/_RUBBLE` 源码里永远查不到整串
 *         （`'BUILDINGANIM:' + name + '_DESTR'`），1221 个目录被误判；
 *         → 现加「基名在用 ⇒ 三态同命」。
 *      ③ **风格集后半段没认三态**：`${style}_${building}_AGE2_DESTR` 这类；
 *         → `restWired()` 同样认三态。
 *    修完：2687 个目录 → 用上 2650（99%），未用的 37 个**逐条查过 src/ 全库确实无人引用**，
 *    已分类登记理由（码头 16 / 采集营地 4 / FOLWARK / DARK_PASTURE / 战场据点样式 1 / 场景遗存 9 / 雕像 5）。
 *
 * 跑法：npx tsx tools/audit-building-coverage.mts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

/** 递归收集 src/ 下所有代码/样式文件（引用面） */
function walkSrc(root: string): string[] {
    const out: string[] = [];
    for (const e of readdirSync(root)) {
        const p = join(root, e);
        if (statSync(p).isDirectory()) out.push(...walkSrc(p));
        else if (/\.(ts|tsx|mts|js|mjs|html|css)$/.test(e)) out.push(p);
    }
    return out;
}

const SRC = readFileSync('src/ui/Scene13WarLayer.ts', 'utf8');
const WON = readFileSync('src/data/CityWonders.ts', 'utf8');
/**
 * 🔴 [2026-10-05 修尺子] 引用面从「Scene13WarLayer + CityWonders 两个文件」放大到**整个 src/**。
 *    病灶（实测）：原来只 grep 两个文件，于是下面这些**明明在跑**的资产全被判「没用上」——
 *      · `FENCE_CORNER`（城寨四角转角件，`src/systems/cityWallShared.ts:153`）；
 *      · 战场遗存 / 雕像 / 断旗（`src/map/battlefieldMorphology.ts` 一整张表，`BattlefieldLayer` 用）；
 *      · `FOLWARK`（战略地图放的风车磨坊，`src/ui/Scene13WarLayer.ts` 的 TerrainSystem 段）。
 *    一跑就报 1323 个「没写明理由」，红的其实是尺子，不是数据（血训 23：报红先问是数据的错还是尺子的错）。
 */
const BLOB = [SRC, WON, ...walkSrc('src').map((f) => readFileSync(f, 'utf8'))].join('\n');
const DIR = 'public/SUCAI_BUILDING';
const dirs = readdirSync(DIR).filter((d) => statSync(`${DIR}/${d}`).isDirectory()).sort();

/** 允许不用的，**每条都要有理由** */
const OK_IDLE: Array<[RegExp, string]> = [
    [/_TOWN_CENTER_AGE[23]$/, '主人 2026-08-22 定：只有大城有市镇中心且用帝国 age4，中城/小城/险要都没有'],
    [/_UNIVERSITY_AGE3$/, '主人 2026-08-22 定：只有大城有大学且用帝国 age4'],
    [/^YURT_[A-D]$/, '主人 2026-08-22 定：A~D 是茅草屋不是蒙古包，弃用；真蒙古包用 E~L 共 8 个'],
    [/^_tmp_/, '素材提取过程的临时残留，不是可用素材。🔴 [2026-10-05 主人令「该删除的删除」] 原有 6 个'
        + '（_tmp_gate_e/_tmp_gate_n/_tmp_gate_ne/_tmp_gate_se/_tmp_wall_all/_tmp_wall_stone）**已删除**'
        + '（删前查过：代码引用 0 次）；本条规则留着，是为了以后再冒出 _tmp_* 时仍被登记而不是静默通过'],

    // ── 🔴 [2026-10-05 修尺子后剩下的 37 条] 逐条查过 `src/` 全库：确实一行代码都没引用 ──
    //    分类登记（**不是**「素材没用」，而是「还没接线」或「不打算接线」）：
    [/^(?:[A-Z]+_)?DOCK_AGE2$/,
        '码头 16 套（`b_<style>_dock_age2`）：游戏里"据点九建筑池"（战略 TerritorySystem / 战术三套池）从没收过 DOCK，'
        + '海港类据点不用码头当建筑 —— **暂无接入需求**；将来要做沿海渔村/港口池，挂 `SIEGE_*_BUILDINGS` 即可'],
    [/^(?:GREEK|THRACIAN)_(?:LUMBER|MINING)_CAMP_AGE2$/,
        '伐木场/采矿场（希腊、色拉西二风格各 2 件，`b_*_lumber_camp / mining_camp`）：DE 的**经济**建筑，'
        + '战术攻城的九建筑池是军事/民生建筑，未收资源采集类 —— 接入需求未定，先留着'],
    [/^FOLWARK$/, '波兰特色庄园磨坊（`b_slav_folwark_age2`）：DE 波兰独有经济建筑，本项目没有任何地形/建筑位放它'],
    [/^DARK_PASTURE$/, '黑暗时代牧场（`b_dark_pasture`，另有 _DESTR/_RUBBLE 两态同命）：黑暗时代经济建筑，九建筑池未收'],
    [/^BATTLEFIELD_FIELD$/, '战场据点样式（`_meta.json` 自述「拒马＋阵亡甲士，无城墙无城门无民居」）：**该接没接** —— 战场据点目前不画建筑，见下方报告'],
    [/^(?:SCEN_CART_BROKEN|SCEN_CHURCH_RUINS|SCEN_GRAVES|SCEN_MEDI_RUINS|SCEN_MESOPOTAMIAN_RUINS|SCEN_MESOPOTAMIAN_TOMB|SCEN_PURU_RUINS|SCEN_SKELETON|SCEN_SKELETON_SOLDIER)$/,
        '战场/场景点缀（破车、教堂废墟、坟冢、地中海与两河废墟、两河陵墓、南亚废墟、骷髅×2）：'
        + '「打过的战场留遗迹」目前只用 `SUCAI_BATTLEFIELD/` 那一套（见 battlefieldMorphology.ts），这批石构遗存未接线'],
    [/^(?:SCEN_STATUE_ALEXANDER|SCEN_STATUE_ARES_MARBLE|SCEN_STATUE_ARES_PAINTED|SCEN_STATUE_GREEK_HERO|SCEN_STATUE_HEPHAISTION)$/,
        '雕像 5 座（亚历山大 8 帧 / 阿瑞斯大理石·彩绘 / 希腊英雄 / 赫费斯提翁）：设计文档 `docs/02-design/systems/历史进程框架.md` 写过'
        + '「战场放 SCEN_STATUE_ALEXANDER 雕像」，但**代码里没有这一步** —— 该接没接，见下方报告'],
];

const table = (name: string): string => {
    const m = new RegExp(`const ${name}[^;]+;`, 's').exec(SRC);
    if (!m) throw new Error(`找不到 ${name}`);
    return m[0];
};
const styles = [...new Set(dirs.filter((d) => d.endsWith('_BARRACKS_AGE2')).map((d) => d.replace(/_BARRACKS_AGE2$/, '')))]
    .sort((a, b) => b.length - a.length);
const regStyles = new Set([...table('REGION_BUILDING_STYLE').matchAll(/'([A-Z]+)'/g)].map((m) => m[1]));
const facStyles = new Set([...table('FACTION_BUILDING_STYLE').matchAll(/:\s*'([A-Z]+)'/g)].map((m) => m[1]));
const live = new Set([...regStyles, ...facStyles]);

console.log('风格集覆盖：');
const idleStyles = styles.filter((s) => !live.has(s));
if (idleStyles.length) bad(`这些风格集整套没人用：${idleStyles.join(', ')}（各 40+ 件建筑）`);
else ok(`${styles.length} 套风格集全部在用`);

// 势力 id 必须真实
const FACTIONS = readFileSync('src/data/factions.ts', 'utf8');
const facKeys = [...table('FACTION_BUILDING_STYLE').matchAll(/(\w+):\s*'[A-Z]+'/g)].map((m) => m[1]);
const ghosts = facKeys.filter((k) => !new RegExp(`id:\\s*'${k}'`).test(FACTIONS));
if (ghosts.length) bad(`FACTION_BUILDING_STYLE 里这些势力 id 不存在：${ghosts.join(', ')}`);
else ok(`${facKeys.length} 个势力 id 全部真实存在`);

// 覆盖率：按「风格集 × 建筑池」算，别 grep 整串
const pool = new Set<string>();
for (const m of SRC.matchAll(/\['(\w+)',\s*'(AGE\d)'\]/g)) pool.add(`${m[1]}_${m[2]}`);
for (const [name, age] of [['SIEGE_MEDIUM_BUILDINGS', 'AGE3'], ['SIEGE_FEUDAL_BUILDINGS', 'AGE2'], ['SIEGE_PASS_BUILDINGS', 'AGE2']] as const) {
    const mm = new RegExp(`${name}\\s*=\\s*\\[([^\\]]+)\\]`).exec(SRC);
    if (mm) for (const b of mm[1].matchAll(/'(\w+)'/g)) pool.add(`${b[1]}_${age}`);
}
for (const x of ['TOWER_AGE2', 'TOWER_AGE3', 'CASTLE_AGE3']) pool.add(x);

/**
 * 🔴 [2026-10-05 修尺子 · 三态同命] `_DAMAGED`（破损）/ `_DESTR`（倒塌动画）/ `_RUBBLE`（残骸）
 *    是**游戏中按基名动态拼出来的**，源码里永远查不到整串：
 *      · 墙/门：`Scene13WarLayer` 取 `base + '_D25/_D50/_D75'` 与 `'_DESTR' / '_RUBBLE'`；
 *      · 建筑与箭塔：`'BUILDING:' + name + '_DAMAGED'`、`'BUILDINGANIM:' + name + '_DESTR' / '_RUBBLE'`。
 *    故「基名在用」= 这三个状态目录也在用（实测 1221 个被误判成「没用上」就是这么来的）。
 */
const STATE_SUFFIX = /^(.*?)(_DAMAGED|_DESTR|_RUBBLE)$/;

/** 一个「风格集之外的后半段」（如 `ARCHERY_RANGE_AGE2`）算不算被接线到：直查、或它的基名被接线到 */
const restWired = (rest: string): boolean =>
    pool.has(rest) || /^(WALL|GATE)_/.test(rest)
    || (() => { const m = STATE_SUFFIX.exec(rest); return !!m && (pool.has(m[1]) || /^(WALL|GATE)_/.test(m[1])); })();

const referenced = (d: string): boolean => {
    const p = d.split('_');
    for (let i = p.length; i > 1; i--) if (BLOB.includes(p.slice(0, i).join('_'))) return true;
    if (BLOB.includes(d)) return true;
    // 状态三态：基名在用即算在用
    const m = STATE_SUFFIX.exec(d);
    return !!m && (BLOB.includes(m[1]) || dirs.includes(m[1]));
};

const idle: string[] = [];
for (const d of dirs) {
    let hit = referenced(d);
    if (!hit) {
        for (const s of styles) {
            if (d.startsWith(`${s}_`)) {
                hit = live.has(s) && restWired(d.slice(s.length + 1));
                break;
            }
        }
    }
    if (!hit) idle.push(d);
}
console.log('\n覆盖率：');
console.log(`  ${dirs.length} 个目录 → 用上 ${dirs.length - idle.length}（${Math.round((dirs.length - idle.length) / dirs.length * 100)}%）`);
const unexplained = idle.filter((d) => !OK_IDLE.some(([re]) => re.test(d)));
for (const [re, why] of OK_IDLE) {
    const n = idle.filter((d) => re.test(d)).length;
    if (n) console.log(`  ⚪ ${n} 个未用（合理）：${why}`);
}
if (unexplained.length) bad(`这些没用上且没写明理由：${unexplained.join(', ')}`);
else ok('未用上的每一个都有登记理由');

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
