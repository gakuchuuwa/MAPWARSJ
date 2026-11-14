/**
 * 编年史主线导入器（2026-11-13）：编年史 json（唯一真源）＋ 导演编排表 → src/data/chronicle/ChronicleMainline.generated.ts
 * 跑法：npx tsx --import ./tools/sim-preload.mjs tools/chronicle/import-mainline.mts
 * 校验失败（事件 / 武将 / 势力不存在）直接退出，不写文件。
 */
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { CHRONICLE_SCRIPT } from '../../src/data/chronicle/ChronicleDirectorScript';
import type { ChronicleMainlineEvent } from '../../src/data/chronicle/ChronicleTypes';
import { FACTION_GENERALS } from '../../src/data/FactionGenerals';
import { BATTLEFIELD_CHARACTERS } from '../../src/data/BattlefieldCharacters';
import { FACTIONS } from '../../src/data/factions';
import { CITIES_V2 } from '../../src/data/cities_v2';

const SRC = 'docs/战争编年史（纯史实重写）/战争事件编年史_全二十四卷_前550至1870年_2526场纯史实引擎全库.json';
const OUT = 'src/data/chronicle/ChronicleMainline.generated.ts';
/** 衔接播报（上一场 → 下一场），按事件 ID 成对匹配 */
const BRIDGE_SRC = 'docs/战争编年史（纯史实重写）/战争编年史_衔接播报_2026-11-14.json';
const OPENING_OUT = 'src/data/chronicle/ChronicleOpening.ts';
const bridges = new Map<string, string>();
let prologue = '';
let epilogue = '';
try {
    const bridgeData = JSON.parse(readFileSync(BRIDGE_SRC, 'utf-8'));
    if (typeof bridgeData['开卷导语'] === 'string' && bridgeData['开卷导语'].trim()) prologue = bridgeData['开卷导语'].trim();
    if (typeof bridgeData['收官播报'] === 'string' && bridgeData['收官播报'].trim()) epilogue = bridgeData['收官播报'].trim();
    for (const b of (bridgeData.bridges as Record<string, string>[])) {
        bridges.set(`${b['上一事件ID']}>${b['下一事件ID']}`, b['衔接播报']);
    }
} catch { /* 无衔接播报文件则不挂 */ }
/** 经典战口径：攻守兵力 1–2 万，兵力比 ≤1:2 */
const TROOPS = 15000;
const SEASON: Record<string, 0 | 1 | 2 | 3> = { 春: 0, 夏: 1, 秋: 2, 冬: 3 };

const events = new Map((JSON.parse(readFileSync(SRC, 'utf-8')).events as Record<string, string>[]).map((e) => [e['事件ID'], e]));
const generals = new Map<string, string>();
const errors: string[] = [];
{
    const normName = (s: string) => (s ?? '').replace(/[\s·・\-—–_'’"“”()（）\[\]【】]/g, '');
    const seenNames = new Map<string, string>();
    for (const [fk, e] of Object.entries(FACTION_GENERALS)) {
        for (const g of (Array.isArray(e) ? e : [e]) as { generalId: string; generalName?: string; cityId: string }[]) {
            if (generals.has(g.generalId)) errors.push(`武将 ID 重复：${g.generalId}`);
            generals.set(g.generalId, g.cityId);
            const nn = normName(g.generalName ?? '');
            if (nn) {
                const prev = seenNames.get(nn);
                if (prev && prev !== g.generalId) errors.push(`人物重名：「${g.generalName}」(${g.generalId}@${fk}) 与 ${prev}`);
                else seenNames.set(nn, `${g.generalId}`);
            }
        }
    }
    for (const c of Object.values(BATTLEFIELD_CHARACTERS)) {
        if (generals.has(c.generalId)) errors.push(`战场人物与据点武将 ID 重复：${c.generalId}（${c.generalName}）`);
        const nn = normName(c.generalName ?? '');
        if (nn) {
            const prev = seenNames.get(nn);
            if (prev && prev !== c.generalId) errors.push(`战场人物与据点武将重名：「${c.generalName}」(${c.generalId}@${c.factionId}) 与 ${prev}`);
            else seenNames.set(nn, `${c.generalId}`);
        }
    }
}
const factionName = new Map(FACTIONS.map((f) => [f.id, f.name]));
const cityIds = new Set(CITIES_V2.map((c) => c.id));

const out: ChronicleMainlineEvent[] = [];
for (const s of CHRONICLE_SCRIPT) {
    const e = events.get(s.eventId);
    if (!e) { errors.push(`${s.eventId} 不在编年史 json`); continue; }
    if (!generals.has(s.leadGeneralId)) errors.push(`${s.eventId} 随行主将 ${s.leadGeneralId} 不在库`);
    const year = Number(e['年份year']);
    const lat = Number(e['纬度lat']);
    const lng = Number(e['经度lng']);
    const ev: ChronicleMainlineEvent = {
        id: s.eventId,
        baton: s.baton,
        year,
        season: SEASON[e['季节']] ?? 0,
        title: e['事件名称'],
        kind: s.kind,
        place: { name: e['战场地点'], lat, lng },
        leadGeneralId: s.leadGeneralId,
        strategic: [e['战略播报']].filter(Boolean),
        tactical: [e['战术播报']].filter(Boolean),
        source: e['一手史料出处'],
    };
    const prevId = out.length ? out[out.length - 1].id : '';
    const bridge = prevId ? bridges.get(`${prevId}>${s.eventId}`) : undefined;
    if (bridge) ev.bridge = [bridge];
    else if (prevId && bridges.size) console.warn(`  无衔接播报：${prevId} → ${s.eventId}`);
    if (s.kind !== 'battle') errors.push(`${s.eventId} 主线每场都要开战（不收只播报的场）`);
    if (s.kind === 'battle') {
        // 按史：战斗类型照 json 原文（攻城战／守城战／标有据点的关隘战按攻城管线走），攻城战必须写明被攻的城
        const isSiege = e['战斗类型'] === '攻城战' || e['战斗类型'] === '守城战' || (e['战斗类型'] === '关隘战' && Boolean(s.city));
        // 主人定：跟守方武将守城 → 直接从被守的据点出发（就地守城，不行军）
        const defendsCity = isSiege && s.role === 'defender' && s.city;
        const from = defendsCity ? s.city!.cityId : (s.from ?? generals.get(s.leadGeneralId));
        if (!from || !cityIds.has(from)) errors.push(`${s.eventId} 出发据点 ${from} 不在库`);
        if (!s.enemyFactionId || !factionName.has(s.enemyFactionId)) errors.push(`${s.eventId} 对手势力 ${s.enemyFactionId} 不在库`);
        if (s.enemyGeneralId && !generals.has(s.enemyGeneralId)) errors.push(`${s.eventId} 对手武将 ${s.enemyGeneralId} 不在库`);
        if (!s.winner) errors.push(`${s.eventId} 缺史载胜方`);
        if (isSiege && !s.city) errors.push(`${s.eventId} 攻城战缺被攻据点`);
        for (const c of [s.city?.cityId]) if (c && !cityIds.has(c)) errors.push(`${s.eventId} 据点 ${c} 不在库`);
        for (const f of [s.city?.before, s.city?.after]) if (f && !factionName.has(f)) errors.push(`${s.eventId} 归属势力 ${f} 不在库`);
        ev.winner = s.winner;
        ev.battle = {
            generalId: s.leadGeneralId,
            battleId: `chron:${s.eventId}`,
            battleName: e['事件名称'],
            battleYear: year,
            battleType: isSiege ? 'siege' : 'field',
            role: s.role ?? 'attacker',
            targetName: e['战场地点'],
            ...(isSiege && s.city ? { targetCityId: s.city.cityId } : {}),
            ...(s.city ? { chronicleCity: s.city } : {}),
            ...(s.route?.length ? { routeVia: s.route } : {}),
            chronicleFrom: from,
            targetLat: lat,
            targetLng: lng,
            myTroops: TROOPS,
            enemyFactionId: s.enemyFactionId ?? '',
            enemyFactionName: factionName.get(s.enemyFactionId ?? '') ?? '',
            ...(s.enemyGeneralId ? { enemyGeneralId: s.enemyGeneralId } : {}),
            enemyTroops: TROOPS,
            introLines: [],
        };
    }
    out.push(ev);
}
if (out.length && epilogue) out[out.length - 1].tactical.push(epilogue);
if (errors.length) {
    console.error('导入失败：\n' + errors.map((x) => '  ' + x).join('\n'));
    process.exit(1);
}
if (prologue) {
    const openingSrc = readFileSync(OPENING_OUT, 'utf-8');
    const nextOpening = openingSrc.replace(
        /(export const CHRONICLE_OPENING_PROLOGUE =\s*)'[^']*';/,
        `$1${JSON.stringify(prologue).replace(/^"|"$/g, "'")};`,
    );
    if (nextOpening !== openingSrc) writeFileSync(OPENING_OUT, nextOpening, 'utf-8');
}
const header = `/* 自动生成，勿手改：tools/chronicle/import-mainline.mts ← 编年史 json ＋ ChronicleDirectorScript.ts */\n`
    + `import type { ChronicleMainlineEvent } from './ChronicleTypes';\n\n`
    + `export const CHRONICLE_MAINLINE: readonly ChronicleMainlineEvent[] = `;
const tmpOut = `${OUT}.tmp`;
writeFileSync(tmpOut, header + JSON.stringify(out, null, 4) + ';\n', 'utf-8');
renameSync(tmpOut, OUT);
console.log(`已生成 ${OUT}：${out.length} 场（战斗 ${out.filter((x) => x.kind === 'battle').length}、叙事 ${out.filter((x) => x.kind === 'narrative').length}、挂衔接播报 ${out.filter((x) => x.bridge).length}）`);
