/**
 * 「只有弓骑兵能放风筝」验收。
 *
 * 🔴 [2026-08-25 主人定]「战术模式中，只有弓骑兵可以放风筝，把其他的取消。」
 *
 *    改前 `kite: 70` 撒在 30 个兵种上，其中 19 个根本不是弓骑：
 *      · 投掷类：飞镖骑兵(arambai)、套索骑兵(bolas_rider)、标枪骑兵(genitour)
 *      · 近战：马穆鲁克(mameluke，dmgType=melee，投的是刀)
 *      · 火器：西班牙征服者(conquistador)
 *      · 战车：高丽战车(war_wagon)、拉塔战车(ratha_ranged)、先秦远程战车(war_chariot_ranged)
 *      · 攻城：骆驼投石机(mounted_trebuchet)、弩炮战象(ballista_elephant)
 *      · 塔兰丁骑兵(tarantine_cavalry)：史实是希腊化时期**投标枪**的轻骑，不是弓骑
 *      · 象弓骑兵(elephant_archer)：名字带「弓骑」，但象 spd=40 对骑兵 130，
 *        跑不掉、风筝根本不成立 —— 判据是「游戏合理」，不是名字里有没有「弓」
 *
 *    `kite` 全项目只有一处消费（Scene13WarLayer 的放风筝分支），所以这张表就是唯一开关。
 *
 * 跑法：npx tsx tools/audit-kite-archers-only.mts
 */
import { readFileSync } from 'node:fs';

/** 允许放风筝的**弓骑兵**白名单：骑乘 + 用弓 + 跑得掉。新增兵种要放风筝必须先进这张表。 */
const ARCHER_CAVALRY: Readonly<Record<string, string>> = {
    cav_archer: '骑射手',
    cav_archer_heavy: '骑射手重装',
    horse_archer: '突骑兵',
    mangudai: '蒙古突骑（DE Mangudai，弓骑）',
    mangudai_elite: '蒙古突骑精锐',
    kipchak: '库曼钦察弓骑',
    elite_kipchak: '库曼钦察弓骑精锐',
    scythian_horse_archer: '斯基泰骑射手',
    elite_scythian_horse_archer: '斯基泰骑射手高级',
    camel_archer: '柏柏尔骆驼弓骑（DE Camel Archer，骑乘射弓）',
    elite_camel_archer: '柏柏尔骆驼弓骑精锐',
};

interface Row { key: string; name: string; cls: string; spd: number; dmg: string }

function kiteRows(src: string): Row[] {
    const out: Row[] = [];
    const re = /^\s{4}(\w+):\s*\{([^}]*?kite:\s*\d+[^}]*)\}/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
        const [, key, body] = m;
        out.push({
            key,
            name: /name:\s*'([^']*)'/.exec(body)?.[1] ?? '?',
            cls: /cls:\s*'(\w+)'/.exec(body)?.[1] ?? '?',
            spd: Number(/spd:\s*(\d+)/.exec(body)?.[1] ?? 0),
            dmg: /dmgType:\s*'(\w+)'/.exec(body)?.[1] ?? '?',
        });
    }
    return out;
}

const SRC = readFileSync('src/ui/Scene13WarLayer.ts', 'utf8');
let fail = 0;

// ① kite 只能有一处消费点：这张表就是唯一开关
const uses = (SRC.match(/\bwt\.kite\b|\bstats\.kite\b/g) ?? []).length;
console.log(`kite 的消费点：${uses} 处（放风筝分支）`);
if (uses !== 1) {
    console.log(`  🔴 期望恰好 1 处 —— 多了说明 kite 被挪作他用，白名单不再等于「谁能放风筝」`);
    fail++;
} else console.log('  ✅ 唯一开关，改这张表就等于改放风筝资格');

// ② 带 kite 的必须全在白名单里
const rows = kiteRows(SRC);
console.log(`\n带 kite 的兵种 ${rows.length} 个：`);
const bad = rows.filter((r) => !(r.key in ARCHER_CAVALRY));
for (const r of rows.filter((r) => r.key in ARCHER_CAVALRY).sort((a, b) => a.key.localeCompare(b.key))) {
    console.log(`  ✅ ${r.key.padEnd(30)}${ARCHER_CAVALRY[r.key]}`);
}
for (const r of bad) {
    console.log(`  🔴 ${r.key.padEnd(30)}${r.name}（cls=${r.cls} spd=${r.spd} dmg=${r.dmg}）—— 不是弓骑兵，不该放风筝`);
    fail++;
}

// ③ 白名单里的都得真在表里（改名/删兵种时白名单要跟着改）
const missing = Object.keys(ARCHER_CAVALRY).filter((k) => !rows.some((r) => r.key === k));
if (missing.length) { console.log(`\n🔴 白名单里这些已经没有 kite 了：${missing.join(', ')}`); fail++; }

// ④ 白名单自身的合理性：必须跑得掉（象/攻城那种 spd 40 的放不了风筝）
for (const r of rows.filter((r) => r.key in ARCHER_CAVALRY)) {
    if (r.spd < 100) { console.log(`\n🔴 ${r.key} spd=${r.spd} 太慢，追兵 130 追得上，风筝不成立`); fail++; }
    if (r.dmg !== 'pierce') { console.log(`\n🔴 ${r.key} dmgType=${r.dmg} —— 弓骑应是 pierce（melee 说明是投刀/撞击类）`); fail++; }
}

// ⑤ 量具 war_sim 必须同口径（不同步就会假报，见 war-sim 四条缺腿）
const SIM = readFileSync('scratch/war_sim.mjs', 'utf8');
const simBad = kiteRows(SIM).filter((r) => !(r.key in ARCHER_CAVALRY));
console.log('\n量具 scratch/war_sim.mjs：');
if (simBad.length) {
    console.log(`  🔴 这些非弓骑还带着 kite：${simBad.map((r) => r.key).join(', ')}`);
    fail++;
} else console.log(`  ✅ 与游戏层同口径（${kiteRows(SIM).length} 个带 kite，全在白名单内）`);

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
