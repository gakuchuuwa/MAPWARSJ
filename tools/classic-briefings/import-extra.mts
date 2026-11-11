/**
 * 导入「经典战补选表」→ 生成 src/data/GeneralExtraClassicBattles.ts（名将的第二、第三场经典战），
 * 同时把这些场次的战略／战术播报并进 src/data/ClassicBattleBriefings.generated.ts。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/classic-briefings/import-extra.mts <补选表.csv|.tsv> [--dry]
 *
 * 表头须含：generalId、战役、年份、类型、战场或目标、纬度、经度、敌方国号、敌将、会面台词、应答、
 *          历史资料、史料出处、战略播报、战术播报。
 *
 * 换算（写稿方只给史实，游戏内部编号在这里认）：
 *   · 年份：整数，公元前写负数（也认「前260」）；这一场编号＝`<generalId>@<年份>`；
 *   · 类型：野战 / 攻城 / 守城 → battleType＋role；
 *   · 敌方国号 → 势力编号（先别名表，再全名相同，再互相包含）；认不出就打回——先在「新增势力表」登记
 *     （🔴 主人定：势力要和有名字的武将同步添加），用 import-sync.mts 导入后再导本表；
 *   · 敌将 → 🔴 主人定「必须要有」：已有武将／战场人物按名字认出，认不出就新登记为战场人物（属敌方势力）；
 *   · 攻城 / 守城：取离坐标 30 公里内最近的据点当目标城，没有就打回；野战按坐标打，不挂城；
 *   · 兵力：双方一律 15000（经典战兵力本来就按 1~2 万上钳，胜负按游戏走向）。
 * 规则：只收名将（已有第一场的）；每位最多补两场；不许与他第一场同名同年；同一场（战役名＋年份）
 *       若已是别人的经典战，照收（一局里攻守两方只会触发一次）。增量导入，同编号整条覆盖。
 */
import { GENERAL_FIRST_BATTLES, type GeneralFirstBattle } from '../../src/data/GeneralFirstBattles';
import { GENERAL_EXTRA_CLASSIC_BATTLES } from '../../src/data/GeneralExtraClassicBattles';
import { CLASSIC_BATTLE_BRIEFINGS, type ClassicBattleBriefing } from '../../src/data/ClassicBattleBriefings.generated';
import { GENERAL_LIFE_YEARS } from '../../src/data/GeneralLifeYears';
import { CITIES_V2 } from '../../src/data/cities_v2';
import { readSheet, auditBriefingRow, writeBriefings, reportLine, len } from './briefingLib.mts';
import { factionIdByName as lookupFaction, ensureBattlefieldCharacter, writeExtras } from './dataLib.mts';

const input = process.argv[2];
const dry = process.argv.includes('--dry');
if (!input) { console.error('缺补选表路径'); process.exit(1); }

const MAX_EXTRA_PER_GENERAL = 2;
const DEFAULT_TROOPS = 15000;
const CITY_NEAR_KM = 30;

const { rows, get } = readSheet(input, [
    'generalId', '战役', '年份', '类型', '战场或目标', '纬度', '经度', '敌方国号', '敌将',
    '会面台词', '应答', '历史资料', '史料出处', '战略播报', '战术播报',
]);

/**
 * 国号别名：写稿方给的史书国号在游戏势力表里没有同名的，人工指定对应到哪个现有势力。
 * 只收「确实是它的一部分／同一族群」的对应，不许随便挂到不相干的势力上。
 */
const FACTION_ALIASES: Readonly<Record<string, string>> = {
    // 例：'某城邦': 'aiaoniya'。🔴 2026-11-11 主人定「没有的该添加就添加」→ 优先走新增势力表，别名只给「本就是同一政权的另一叫法」
};
const factionIdByName = (name: string) => lookupFaction(name, FACTION_ALIASES);
function km(aLat: number, aLng: number, bLat: number, bLng: number): number {
    const dLat = (aLat - bLat) * 111.32;
    const dLng = (aLng - bLng) * 111.32 * Math.cos(((aLat + bLat) / 2) * Math.PI / 180);
    return Math.hypot(dLat, dLng);
}
function nearestCity(lat: number, lng: number): { id: string; name: string; d: number } | null {
    let best: { id: string; name: string; d: number } | null = null;
    for (const c of CITIES_V2) {
        const d = km(lat, lng, c.lat, c.lng);
        if (!best || d < best.d) best = { id: c.id, name: c.name, d };
    }
    return best;
}
function parseYear(s: string): number | null {
    const t = s.replace(/\s+/g, '');
    const m = t.match(/^(前|公元前|-)?(\d{1,4})年?$/);
    if (!m) return null;
    const n = Number(m[2]);
    return m[1] ? -n : n;
}
const KIND: Record<string, Pick<GeneralFirstBattle, 'battleType' | 'role'>> = {
    野战: { battleType: 'field', role: 'attacker' },
    攻城: { battleType: 'siege', role: 'attacker' },
    守城: { battleType: 'siege', role: 'defender' },
};

const extras: Record<string, GeneralFirstBattle[]> = {};
for (const [gid, list] of Object.entries(GENERAL_EXTRA_CLASSIC_BATTLES)) extras[gid] = [...list];
const briefings: Record<string, ClassicBattleBriefing> = { ...CLASSIC_BATTLE_BRIEFINGS };
const allBattleKeys = new Map<string, string>();   // 战役名|年份 → 哪一场
for (const fb of Object.values(GENERAL_FIRST_BATTLES)) allBattleKeys.set(`${fb.battleName}|${fb.battleYear}`, fb.generalId);

let ok = 0;
let bad = 0;
let skipped = 0;
const report: string[] = [];
for (const r of rows) {
    const g = (n: string) => get(r, n);
    const gid = g('generalId');
    if (!gid || gid === 'generalId') { skipped++; continue; }
    if (!g('战役')) { skipped++; continue; }
    const errors: string[] = [];
    const warns: string[] = [];
    const first = GENERAL_FIRST_BATTLES[gid];
    if (!first) errors.push('generalId 不是有经典战的名将');
    const year = parseYear(g('年份'));
    if (year == null) errors.push(`年份「${g('年份')}」认不出（写整数，公元前写负数）`);
    const kind = KIND[g('类型')];
    if (!kind) errors.push(`类型「${g('类型')}」只能是 野战 / 攻城 / 守城`);
    const lat = Number(g('纬度'));
    const lng = Number(g('经度'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) errors.push('纬度/经度不是有效数字');
    const enemyFactionId = factionIdByName(g('敌方国号'));
    if (!enemyFactionId) errors.push(`敌方国号「${g('敌方国号')}」游戏里没有——先在新增势力表登记（连同一位有名字的名将）`);
    if (!g('敌将')) errors.push('没有敌将（主人定：必须要有；主将不详就写对方当时的君主或最高统帅）');
    const life = GENERAL_LIFE_YEARS[gid];
    if (life && year != null && (year < life.birth || year > life.death)) warns.push(`年份 ${year} 不在他的生卒年 ${life.birth}~${life.death} 之内`);
    if (first && year != null && first.battleName === g('战役') && first.battleYear === year) errors.push('与他的第一场经典战是同一场');
    let targetCityId: string | undefined;
    if (kind?.battleType === 'siege' && Number.isFinite(lat) && Number.isFinite(lng)) {
        const near = nearestCity(lat, lng);
        if (!near || near.d > CITY_NEAR_KM) errors.push(`攻城/守城要有目标城：坐标 ${CITY_NEAR_KM} 公里内没有据点${near ? `（最近的${near.name}在 ${near.d.toFixed(0)} 公里外）` : ''}`);
        else targetCityId = near.id;
    }
    for (const [label, text] of [['会面台词', g('会面台词')], ['应答', g('应答')]] as const) {
        if (!text) errors.push(`没有${label}`);
        else if (len(text) > 80) warns.push(`${label} ${len(text)} 字，偏长`);
        if (/[0-9()（）]/.test(text)) errors.push(`${label} 有阿拉伯数字或括号`);
    }
    const briefing = auditBriefingRow(g, errors, warns);
    const battleId = year != null ? `${gid}@${year}` : gid;
    const key = `${g('战役')}|${year}`;
    const owner = allBattleKeys.get(key);
    if (owner && owner !== gid) warns.push(`与 ${owner} 的经典战是同一场——一局里只会触发一次`);
    const line = reportLine(`${g('战役')}·${battleId}`, errors, warns);
    if (line) report.push(line);
    if (errors.length || !briefing || !kind || year == null || !enemyFactionId) { bad++; continue; }

    const enemyGeneralId = ensureBattlefieldCharacter(g('敌将'), enemyFactionId, `${g('战役')}敌方主将`, dry);
    const fb: GeneralFirstBattle = {
        generalId: gid,
        battleId,
        battleName: g('战役'),
        battleYear: year,
        battleType: kind.battleType,
        role: kind.role,
        targetName: g('战场或目标'),
        ...(targetCityId ? { targetCityId } : {}),
        targetLat: lat,
        targetLng: lng,
        myTroops: DEFAULT_TROOPS,
        enemyFactionId,
        enemyFactionName: g('敌方国号'),
        enemyGeneralId,
        enemyTroops: DEFAULT_TROOPS,
        introLines: [
            { speaker: 'general', text: g('会面台词') },
            { speaker: 'player', text: g('应答') },
        ],
    };
    const list = (extras[gid] ?? []).filter((x) => x.battleId !== battleId);
    list.push(fb);
    list.sort((a, b) => a.battleYear - b.battleYear);
    if (list.length > MAX_EXTRA_PER_GENERAL) {
        report.push(`✗ ${g('战役')}·${battleId}\n    ${gid} 已补满 ${MAX_EXTRA_PER_GENERAL} 场，这一场没收`);
        bad++;
        continue;
    }
    extras[gid] = list;
    briefings[battleId] = briefing;
    allBattleKeys.set(key, allBattleKeys.get(key) ?? battleId);
    ok++;
}

const totalExtra = Object.values(extras).reduce((n, l) => n + l.length, 0);
console.log(report.join('\n'));
console.log(`\n本次：合格 ${ok} 行、有错 ${bad} 行（未写入）、空行跳过 ${skipped} 行；累计补选 ${totalExtra} 场，涉及 ${Object.keys(extras).length} 位名将${dry ? '（--dry 未写文件）' : ''}`);

if (!dry) {
    writeExtras(extras);
    writeBriefings(briefings);
}
if (bad) process.exitCode = 2;
