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
 * 跑法：npx tsx tools/audit-building-coverage.mts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';

let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

const SRC = readFileSync('src/ui/Scene13WarLayer.ts', 'utf8');
const WON = readFileSync('src/data/CityWonders.ts', 'utf8');
const BLOB = SRC + WON;
const DIR = 'public/SUCAI_BUILDING';
const dirs = readdirSync(DIR).filter((d) => statSync(`${DIR}/${d}`).isDirectory()).sort();

/** 允许不用的，**每条都要有理由** */
const OK_IDLE: Array<[RegExp, string]> = [
    [/_TOWN_CENTER_AGE[23]$/, '主人 2026-08-22 定：只有大城有市镇中心且用帝国 age4，中城/小城/险要都没有'],
    [/_UNIVERSITY_AGE3$/, '主人 2026-08-22 定：只有大城有大学且用帝国 age4'],
    [/^YURT_[A-D]$/, '主人 2026-08-22 定：A~D 是茅草屋不是蒙古包，弃用；真蒙古包用 E~L 共 8 个'],
    [/^_tmp_/, '素材提取过程的临时残留，不是可用素材（建议主人自行清理，我不动用户文件）'],
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

const referenced = (d: string): boolean => {
    const p = d.split('_');
    for (let i = p.length; i > 1; i--) if (BLOB.includes(p.slice(0, i).join('_'))) return true;
    return BLOB.includes(d);
};
const idle: string[] = [];
for (const d of dirs) {
    let hit = referenced(d);
    if (!hit) {
        for (const s of styles) {
            if (d.startsWith(`${s}_`)) {
                const rest = d.slice(s.length + 1);
                hit = live.has(s) && (pool.has(rest) || /^(WALL|GATE)_/.test(rest));
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
