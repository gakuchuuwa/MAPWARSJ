/**
 * DE 城堡素材覆盖率验收：所有能用的城堡都得真被安置到战斗模式里。
 *
 * 🔴 [2026-08-26 主人：「DE 中的城堡，分别安置在战斗模式中，现在没有把所有的城堡都用上」]
 *
 *    DE 的建筑分两层，这是根子：
 *      · **风格集**（AFRI/ASIA/CEAS/MEDI/MESO/ORIE/SEAS/SLAV/WEST/INDI/EAST 等）——
 *        兵营/房屋/塔/墙/门全套，按地域共用。
 *      · **文明专属城堡**（BYZA/FRAN/SHU/WU/WEI/KORE/JURC/KHIT/MONG…）——
 *        `public/SUCAI_BUILDING/` 里这些前缀**只有 CASTLE_AGE3**，没有配套建筑，
 *        所以不能当风格集用，必须单独查表。
 *    原来城堡跟着风格集写成 `${style}_CASTLE_AGE3`，65 个城堡只用到 10 个。
 *
 *    现为三层：**守方势力专属（FACTION_CASTLE）→ 守方文化区（REGION_CASTLE）→ 风格集默认**。
 *
 * 跑法：npx tsx tools/audit-castle-coverage.mts
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';

let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

const SRC = readFileSync('src/ui/Scene13WarLayer.ts', 'utf8');
const DIR = 'public/SUCAI_BUILDING';

/** 允许闲置的城堡，**每条都要有理由**（照「有依据的素材闲置是允许的」那条规矩） */
const OK_IDLE: Readonly<Record<string, string>> = {
    BENG_CASTLE_AGE3: '孟加拉风格（红砖圆顶），项目 954 个势力里没有孟加拉/东印度政权；将来加了再启用',
    PURU_CASTLE_AGE3_ATTACKUP: 'PURU 城堡的科技升级态外观，本作没有城堡升级机制',
    PURU_CASTLE_AGE3_BOTHUP: '同上',
    PURU_CASTLE_AGE3_DEFENSEUP: '同上',
};

const tableOf = (name: string): string => {
    const m = new RegExp(`const ${name}[^;]+;`, 's').exec(SRC);
    if (!m) throw new Error(`找不到 ${name}`);
    return m[0];
};

console.log('城堡选择的三层结构：');
if (!/private castleAssetFor\(/.test(SRC)) bad('缺 castleAssetFor —— 城堡又跟着风格集走了');
else ok('有 castleAssetFor（势力 → 文化区 → 风格集）');
if (/place\(side\[castleIdx\], `\$\{style\}_CASTLE_AGE3`\)/.test(SRC)) {
    bad('城堡又直接写死 `${style}_CASTLE_AGE3` —— 56 个文明城堡会重新闲置');
} else ok('城堡走 castleAssetFor，没有写死风格集');

const facTable = tableOf('FACTION_CASTLE');
const regTable = tableOf('REGION_CASTLE');
const styTable = tableOf('REGION_BUILDING_STYLE');
const pick = (tbl: string): string[] =>
    [...tbl.matchAll(/^\s{4}\w+:\s*'([A-Z_0-9]+)',/gm)].map((m) => m[1]);
const facVals = pick(facTable);
const regVals = pick(regTable);
const styles = [...styTable.matchAll(/'([A-Z]+)'/g)].map((m) => m[1]);

console.log('\n映射有效性：');
const onDisk = new Set(readdirSync(DIR));
const dangling = [...facVals, ...regVals].filter((v) => !onDisk.has(v));
if (dangling.length) bad(`指向不存在的素材：${dangling.join(', ')}`);
else ok(`${facVals.length} 条势力映射 + ${regVals.length} 条文化区映射，素材全部存在`);

// 势力 id 必须真实存在，否则是白写的死条目
const FACTIONS = readFileSync('src/data/factions.ts', 'utf8');
const facKeys = [...facTable.matchAll(/^\s{4}(\w+):\s*'[A-Z_0-9]+',/gm)].map((m) => m[1]);
const ghosts = facKeys.filter((k) => !new RegExp(`id:\\s*'${k}'`).test(FACTIONS));
if (ghosts.length) bad(`这些势力 id 不存在（映射永远命中不了）：${ghosts.join(', ')}`);
else ok(`${facKeys.length} 个势力 id 全部真实存在`);

console.log('\n覆盖率：');
const all = [...onDisk].filter((d) => d.includes('_CASTLE')).sort();
const used = new Set<string>([...facVals, ...regVals, ...styles.map((s) => `${s}_CASTLE_AGE3`)].filter((v) => onDisk.has(v)));
const idle = all.filter((c) => !used.has(c));
const unexplained = idle.filter((c) => !(c in OK_IDLE));
console.log(`  素材 ${all.length} 个 → 用上 ${used.size} 个（${Math.round(used.size / all.length * 100)}%）`);
for (const c of idle) {
    if (c in OK_IDLE) console.log(`  ⚪ ${c} 闲置（合理）：${OK_IDLE[c]}`);
}
if (unexplained.length) {
    bad(`这些城堡闲置且没写明理由：${unexplained.join(', ')}`);
} else ok('闲置的每一个都有登记理由');

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
