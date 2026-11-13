/**
 * 编年史主线导入器（2026-11-13）：编年史 json（唯一真源）＋ 导演编排表 → src/data/chronicle/ChronicleMainline.generated.ts
 * 跑法：npx tsx --import ./tools/sim-preload.mjs tools/chronicle/import-mainline.mts
 * 校验失败（事件 / 武将 / 势力不存在）直接退出，不写文件。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { CHRONICLE_SCRIPT } from '../../src/data/chronicle/ChronicleDirectorScript';
import type { ChronicleMainlineEvent } from '../../src/data/chronicle/ChronicleTypes';
import { FACTION_GENERALS } from '../../src/data/FactionGenerals';
import { FACTIONS } from '../../src/data/factions';

const SRC = 'docs/战争编年史（纯史实重写）/战争事件编年史_全二十四卷_前550至1870年_2526场纯史实引擎全库.json';
const OUT = 'src/data/chronicle/ChronicleMainline.generated.ts';
/** 经典战口径：攻守兵力 1–2 万，兵力比 ≤1:2 */
const TROOPS = 15000;
const SEASON: Record<string, 0 | 1 | 2 | 3> = { 春: 0, 夏: 1, 秋: 2, 冬: 3 };

const events = new Map((JSON.parse(readFileSync(SRC, 'utf-8')).events as Record<string, string>[]).map((e) => [e['事件ID'], e]));
const generals = new Set<string>();
for (const e of Object.values(FACTION_GENERALS)) for (const g of (Array.isArray(e) ? e : [e]) as { generalId: string }[]) generals.add(g.generalId);
const factionName = new Map(FACTIONS.map((f) => [f.id, f.name]));

const errors: string[] = [];
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
    if (s.kind === 'battle') {
        if (!s.enemyFactionId || !factionName.has(s.enemyFactionId)) errors.push(`${s.eventId} 对手势力 ${s.enemyFactionId} 不在库`);
        if (s.enemyGeneralId && !generals.has(s.enemyGeneralId)) errors.push(`${s.eventId} 对手武将 ${s.enemyGeneralId} 不在库`);
        ev.battle = {
            generalId: s.leadGeneralId,
            battleId: `chron:${s.eventId}`,
            battleName: e['事件名称'],
            battleYear: year,
            battleType: 'field',
            role: s.role ?? 'attacker',
            targetName: e['战场地点'],
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
if (errors.length) {
    console.error('导入失败：\n' + errors.map((x) => '  ' + x).join('\n'));
    process.exit(1);
}
const header = `/* 自动生成，勿手改：tools/chronicle/import-mainline.mts ← 编年史 json ＋ ChronicleDirectorScript.ts */\n`
    + `import type { ChronicleMainlineEvent } from './ChronicleTypes';\n\n`
    + `export const CHRONICLE_MAINLINE: readonly ChronicleMainlineEvent[] = `;
writeFileSync(OUT, header + JSON.stringify(out, null, 4) + ';\n', 'utf-8');
console.log(`已生成 ${OUT}：${out.length} 场（战斗 ${out.filter((x) => x.kind === 'battle').length}、叙事 ${out.filter((x) => x.kind === 'narrative').length}）`);
