/**
 * 导入「新增势力表」与「史实定稿表」：把与 GG 共同定下的史实写进游戏数据。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/classic-briefings/import-sync.mts \
 *         [--factions <新增势力表.csv>] [--facts <史实定稿表.csv>] [--dry]
 *
 * 🔴 [2026-11-11 主人定]
 *   · 「没有的该添加就添加，但是势力要和有名字的武将同步添加」→ 新增势力表一行＝一个势力＋它的一位名将；
 *   · 「不确定的年份可以估算一个，其他历史信息也是，不用过于严谨，但是必须要有，而且要和 GG 一致」
 *     → 史实定稿表是双方唯一口径：GG 写稿照它，游戏数据也照它改。
 *
 * 新增势力表表头：势力编号、国号、旗号、时代、都城、名将、名将身份、依据
 * 史实定稿表表头：编号、项目、定值、依据或估算
 *   项目只能是：年份、月份、战场或目标、纬度、经度、敌方国号、敌将
 *   （月份＝同一名将两场落在同年时按史实排先后，写一至十二）
 *   编号＝第一场写 generalId；补选的写 `<generalId>@<年份>`（补选场次的年份不在这里改，回补选表重交）。
 */
import { GENERAL_FIRST_BATTLES, type GeneralFirstBattle } from '../../src/data/GeneralFirstBattles';
import { GENERAL_EXTRA_CLASSIC_BATTLES } from '../../src/data/GeneralExtraClassicBattles';
import { FACTIONS } from '../../src/data/factions';
import { readSheet, reportLine } from './briefingLib.mts';
import {
    checkNewFaction, addFaction, factionIdByName, ensureBattlefieldCharacter, generalIdByName,
    patchFirstBattle, writeExtras, type NewFactionSpec,
} from './dataLib.mts';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const argOf = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const factionsFile = argOf('--factions');
const factsFile = argOf('--facts');
if (!factionsFile && !factsFile) { console.error('至少给一张表：--factions 或 --facts'); process.exit(1); }

/** 游戏原有的势力名（本次新加的不算） */
const GAME_FACTION_NAMES = new Set(FACTIONS.map((f) => f.name));
const report: string[] = [];
let bad = 0;
let ok = 0;

// ── 一、新增势力（先做：定稿表里的国号可能要用到新势力）──
if (factionsFile) {
    const { rows, get } = readSheet(factionsFile, ['势力编号', '国号', '旗号', '时代', '都城', '名将', '名将身份', '依据']);
    for (const r of rows) {
        const g = (n: string) => get(r, n);
        if (!g('国号') || g('国号') === '国号') continue;
        if (GAME_FACTION_NAMES.has(g('国号'))) { report.push(`· ${g('国号')}：游戏里已有，跳过`); continue; }
        const spec: NewFactionSpec = {
            id: g('势力编号'), name: g('国号'), flag: g('旗号'), era: g('时代'), capitalCityName: g('都城'),
            generalName: g('名将'), generalNote: g('名将身份'), source: g('依据'),
        };
        const errs = checkNewFaction(spec);
        const line = reportLine(`新增势力 ${spec.name}（${spec.id}）`, errs, []);
        if (line) report.push(line);
        if (errs.length) { bad++; continue; }
        const gid = addFaction(spec, dry);
        report.push(`✓ 新增势力 ${spec.name}（${spec.id}，旗号「${spec.flag}」）＋名将 ${spec.generalName}（${gid}）`);
        ok++;
    }
}

// ── 二、史实定稿 ──
const FIELD: Record<string, keyof GeneralFirstBattle> = {
    年份: 'battleYear', 月份: 'battleMonth', 战场或目标: 'targetName', 纬度: 'targetLat', 经度: 'targetLng',
};
if (factsFile) {
    const { rows, get } = readSheet(factsFile, ['编号', '项目', '定值', '依据或估算']);
    const extras: Record<string, GeneralFirstBattle[]> = {};
    for (const [gid, list] of Object.entries(GENERAL_EXTRA_CLASSIC_BATTLES)) extras[gid] = list.map((x) => ({ ...x }));
    let extrasTouched = false;
    // 同一场这次定下的敌方势力（改敌将时要用）
    const pendingEnemyFaction = new Map<string, string>();
    // 🔴 [2026-11-11] 敌将最后办：它要挂到「这一批定下的敌方国号」下，而定稿表里
    //    「敌方国号」行与「敌将」行的先后是写稿方随手写的；按表里的顺序办会把敌将挂到旧的敌势力上。
    //    所以先办年份/战场/坐标/敌方国号，再办敌将。
    const isEnemyGeneralRow = (r: string[]) => get(r, '项目') === '敌将';
    const orderedRows = [...rows.filter((r) => !isEnemyGeneralRow(r)), ...rows.filter(isEnemyGeneralRow)];
    for (const r of orderedRows) {
        const g = (n: string) => get(r, n);
        const id = g('编号');
        if (!id || id === '编号') continue;
        const item = g('项目');
        const value = g('定值');
        const errors: string[] = [];
        const isExtra = id.includes('@');
        const gidOfExtra = id.split('@')[0];
        const target: GeneralFirstBattle | undefined = isExtra
            ? extras[gidOfExtra]?.find((x) => x.battleId === id)
            : GENERAL_FIRST_BATTLES[id];
        if (!target) errors.push('编号不在经典战表里');
        if (!value) errors.push('定值是空的（主人定：不确定也要估算一个，不能空）');
        if (!g('依据或估算')) errors.push('没写依据或估算说明');
        let apply: (() => void) | null = null;
        if (target && value) {
            if (item === '年份') {
                const y = Number(value.replace(/^前/, '-'));
                if (!Number.isInteger(y)) errors.push(`年份「${value}」要写整数，公元前写负数`);
                else if (isExtra) errors.push('补选场次的年份请回补选表重交（年份是它编号的一部分）');
                else apply = () => patchFirstBattle(id, 'battleYear', y, dry);
            } else if (item === '月份') {
                // 🔴 [2026-11-11 主人定「同年两场谁先，按历史」] 同一名将两场同年时按月份排先后
                const m = Number(value);
                if (!Number.isInteger(m) || m < 1 || m > 12) errors.push(`月份「${value}」要写一至十二的整数`);
                else apply = () => { if (isExtra) { (target as any).battleMonth = m; extrasTouched = true; } else patchFirstBattle(id, 'battleMonth', m, dry); };
            } else if (item === '纬度' || item === '经度') {
                const v = Number(value);
                if (!Number.isFinite(v) || Math.abs(v) > (item === '纬度' ? 90 : 180)) errors.push(`${item}「${value}」不是有效数字`);
                else apply = () => { if (isExtra) { (target as any)[FIELD[item]] = v; extrasTouched = true; } else patchFirstBattle(id, FIELD[item], v, dry); };
            } else if (item === '战场或目标') {
                apply = () => { if (isExtra) { target.targetName = value; extrasTouched = true; } else patchFirstBattle(id, 'targetName', value, dry); };
            } else if (item === '敌方国号') {
                const fid = factionIdByName(value);
                if (!fid) errors.push(`国号「${value}」游戏里没有——先在新增势力表登记（连同一位有名字的名将）`);
                else apply = () => {
                    pendingEnemyFaction.set(id, fid);
                    if (isExtra) { target.enemyFactionId = fid; target.enemyFactionName = value; extrasTouched = true; }
                    else { patchFirstBattle(id, 'enemyFactionId', fid, dry); patchFirstBattle(id, 'enemyFactionName', value, dry); }
                };
            } else if (item === '敌将') {
                apply = () => {
                    const fid = pendingEnemyFaction.get(id) ?? target.enemyFactionId;
                    const known = generalIdByName(value);
                    const eid = known ?? ensureBattlefieldCharacter(value, fid, `${target.battleName}敌方主将`, dry);
                    if (!known) report.push(`  ＋新增战场人物 ${value}（${eid}，属 ${fid}）`);
                    if (isExtra) { target.enemyGeneralId = eid; extrasTouched = true; } else patchFirstBattle(id, 'enemyGeneralId', eid, dry);
                };
            } else errors.push(`项目「${item}」只能是 年份、月份、战场或目标、纬度、经度、敌方国号、敌将`);
        }
        const name = target ? `${target.battleName}·${id}·${item}` : `${id}·${item}`;
        const line = reportLine(name, errors, []);
        if (line) { report.push(line); bad++; continue; }
        apply?.();
        report.push(`✓ ${name} → ${value}`);
        ok++;
    }
    if (extrasTouched && !dry) writeExtras(extras);
}

console.log(report.join('\n'));
console.log(`\n本次：生效 ${ok} 条、有错 ${bad} 条${dry ? '（--dry 未写文件）' : ''}`);
if (bad) process.exitCode = 2;
