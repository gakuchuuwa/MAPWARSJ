/**
 * 战场事件编辑器落盘 —— 服务 `/api/battlefield-editor/save`（页面 /battlefield-editor.html）
 *
 * 🔴 [2026-09-16 主人定] 一场历史战役要写清楚的东西：
 *    年代 / 战役名称（历史上最知名的那个叫法）/ 战场坐标 / 攻城战还是野战 /
 *    双方武将 / 双方兵力 / 谁赢了 / 战役播报内容。
 *
 * 这八项分落两个文件，本模块一次写两处，并强制两处坐标同源：
 *   ① `src/data/Battlefields.ts`          战场（地名 + 坐标 + scriptYear）
 *   ② `src/data/HistoricalEventScript.ts` 剧本（双方将/兵力/胜负/播报/航点）
 *
 * ── 两条铁律 ──────────────────────────────────────────────────────
 * 🔴 **绝不整表重写**（legion-editor 曾把 465 条洗成 1 条）：只定位**单个**条目动刀，
 *    且写盘前校验条目数只许持平或 +1。
 * 🔴 **绝不洗掉史料注释**：更新走**字段级就地替换**，只换 `key:` 后面那个值，
 *    行尾的 `// 史料 35000–40000 步骑`、`// 推罗末代国王阿泽米尔库斯` 原样留着。
 *    第一版是「重新生成整个对象」，实测把主人 44 处史料考据全抹了，已废弃。
 */
import * as fs from 'fs';
import * as path from 'path';

export interface BattlefieldEventDraft {
    bfId: string;
    bfName: string;
    bfNote: string;
    year: number;
    season: number;
    type: 'field_battle' | 'siege';
    title: string;
    eventTitle: string;
    description: string;
    battleDescription: string;
    lat: number;
    lng: number;
    attackerFactionId: string;
    attackerGeneralId: string;
    attackerTroops: number;
    attackerSourceCityId: string;
    defenderFactionId: string;
    defenderGeneralId: string;
    defenderTroops: number;
    defenderSourceCityId: string;
    defenderCityId: string;
    result: 'attacker_win' | 'defender_win';
    marchWaypoints: string[];
    cityUpdates: Array<{ cityId: string; factionId: string }>;
}

// ── 扫描工具：一律跳过字符串与注释里的括号 ────────────────────────────
// 🔴 必须跳过：史料注释里写着「（前332年1月–7/8月）」这种东西，
//    裸计数括号会在注释里提前配平，切出半截对象把数据文件写烂。

interface ScanState { inStr: string | null; inLine: boolean; inBlock: boolean; }

/** 推进一个字符，维护「当前在不在字符串/注释里」。返回要跳几个字符（0 = 交给调用方处理） */
function step(text: string, i: number, st: ScanState): number {
    const c = text[i];
    const n = text[i + 1];
    if (st.inLine) { if (c === '\n') st.inLine = false; return 1; }
    if (st.inBlock) { if (c === '*' && n === '/') { st.inBlock = false; return 2; } return 1; }
    if (st.inStr) {
        if (c === '\\') return 2;
        if (c === st.inStr) st.inStr = null;
        return 1;
    }
    if (c === '/' && n === '/') { st.inLine = true; return 2; }
    if (c === '/' && n === '*') { st.inBlock = true; return 2; }
    if (c === '"' || c === "'" || c === '`') { st.inStr = c; return 1; }
    return 0;
}

function newState(): ScanState { return { inStr: null, inLine: false, inBlock: false }; }

/** 从 `openIdx` 处的 `{` 找到配对的 `}`；找不到返回 -1 */
function matchBraceEnd(text: string, openIdx: number): number {
    let depth = 0;
    let i = openIdx;
    const st = newState();
    while (i < text.length) {
        const skip = step(text, i, st);
        if (skip) { i += skip; continue; }
        const c = text[i];
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return i; }
        i++;
    }
    return -1;
}

/** 扫到某个字段值的结束（深度 0 的 `,` 或闭括号）；值可以跨行（description 的 + 拼接） */
function fieldValueEnd(text: string, from: number, limit: number): number {
    let i = from;
    let depth = 0;
    const st = newState();
    while (i < limit) {
        const skip = step(text, i, st);
        if (skip) { i += skip; continue; }
        const c = text[i];
        if (c === '{' || c === '[' || c === '(') { depth++; i++; continue; }
        if (c === '}' || c === ']' || c === ')') { if (depth === 0) return i; depth--; i++; continue; }
        if (c === ',' && depth === 0) return i;
        i++;
    }
    return limit;
}

/** 扫出顶层数组里每个条目的起止区间 */
function scanEntries(
    text: string,
    arrayDecl: string,
): { entries: Array<{ start: number; end: number; body: string }>; arrayEnd: number } {
    const at = text.indexOf(arrayDecl);
    if (at < 0) throw new Error('找不到数组声明: ' + arrayDecl);
    // 🔴 必须从 `=` 之后找 `[`：声明写作 `export const BATTLEFIELDS: BattlefieldData[] = [`，
    //    直接 indexOf('[') 会撞上**类型注解**里的 `[]`，扫出来的条目数恒为 0/1，
    //    连带把「找不到就新增」判成永远新增（实测 update 被误判成 insert）。
    const eq = text.indexOf('=', at);
    if (eq < 0) throw new Error('数组声明后没有 =: ' + arrayDecl);
    const open = text.indexOf('[', eq);
    if (open < 0) throw new Error('数组声明后没有 [: ' + arrayDecl);

    const entries: Array<{ start: number; end: number; body: string }> = [];
    let i = open + 1;
    let bracket = 1;
    let arrayEnd = -1;
    const st = newState();

    while (i < text.length) {
        const skip = step(text, i, st);
        if (skip) { i += skip; continue; }
        const c = text[i];
        if (c === '[') { bracket++; i++; continue; }
        if (c === ']') { bracket--; if (bracket === 0) { arrayEnd = i; break; } i++; continue; }
        if (c === '{' && bracket === 1) {
            const end = matchBraceEnd(text, i);
            if (end < 0) throw new Error('条目括号不配对，已中止（未改动文件）');
            entries.push({ start: i, end, body: text.slice(i, end + 1) });
            i = end + 1;
            continue;
        }
        i++;
    }
    if (arrayEnd < 0) throw new Error('数组没有收尾 ]: ' + arrayDecl);
    return { entries, arrayEnd };
}

/** 生成 TS 单引号字符串字面量 */
function tsStr(v: string): string {
    return "'" + String(v ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '')
        .replace(/\n/g, '\\n') + "'";
}

// ── 字段级就地替换（更新路径：保注释） ────────────────────────────────

/** 对象体内某一层字段的缩进（取该层第一行的缩进） */
function indentOf(text: string, objStart: number, objEnd: number): string {
    const m = text.slice(objStart, objEnd).match(/\n([ \t]+)\S/);
    return m ? m[1] : '        ';
}

/**
 * 在 [objStart, objEnd] 这个对象里找某个**本层**字段。
 * 按「换行 + 本层缩进 + key:」定位 —— 嵌套对象里的同名字段缩进更深，天然不会撞上。
 */
function findField(
    text: string, objStart: number, objEnd: number, key: string, indent: string,
): { lineStart: number; valueStart: number; valueEnd: number } | null {
    const needle = '\n' + indent + key + ':';
    const at = text.indexOf(needle, objStart);
    if (at < 0 || at >= objEnd) return null;
    // valueStart 紧跟冒号（**不**跳空白）：原值可能是 `: -332` 也可能是 `:\n    '长文本'`，
    // 统一由 patchFields 在新值前补一个空格，两种写法都得到 `key: value`。
    const vs = at + needle.length;
    return { lineStart: at + 1, valueStart: vs, valueEnd: fieldValueEnd(text, vs, objEnd) };
}

/**
 * 就地改一批字段的值；字段不存在就插到对象末尾。
 * 返回改过的整份文本（只动值，行尾注释原样保留）。
 */
function patchFields(
    text: string,
    objStart: number,
    objEnd: number,
    fields: Array<[string, string]>,
): { text: string; objEnd: number } {
    const indent = indentOf(text, objStart, objEnd);
    // 先算好所有位置，再**从后往前**replace，避免下标失效
    const hits: Array<{ valueStart: number; valueEnd: number; code: string }> = [];
    const missing: Array<[string, string]> = [];
    for (const [key, code] of fields) {
        const f = findField(text, objStart, objEnd, key, indent);
        if (f) hits.push({ valueStart: f.valueStart, valueEnd: f.valueEnd, code });
        else missing.push([key, code]);
    }
    hits.sort((a, b) => b.valueStart - a.valueStart);

    let out = text;
    let delta = 0;
    for (const h of hits) {
        const before = out.slice(0, h.valueStart);
        const after = out.slice(h.valueEnd);
        const code = ' ' + h.code;   // valueStart 紧跟冒号，这里补回那个空格
        delta += code.length - (h.valueEnd - h.valueStart);
        out = before + code + after;
    }

    let end = objEnd + delta;
    if (missing.length) {
        // 插在对象收尾的 `}` 之前
        const lineStart = out.lastIndexOf('\n', end) + 1;
        const block = missing.map(([k, c]) => `${indent}${k}: ${c},\n`).join('');
        out = out.slice(0, lineStart) + block + out.slice(lineStart);
        end += block.length;
    }
    return { text: out, objEnd: end };
}

// ── 新建路径：生成完整条目 ───────────────────────────────────────────

function buildBattlefieldEntry(d: BattlefieldEventDraft): string {
    const lines = [
        '    {',
        `        id: ${tsStr(d.bfId)},`,
        `        name: ${tsStr(d.bfName)},`,
        `        lat: ${d.lat},`,
        `        lng: ${d.lng},`,
        `        scriptYear: ${d.year},`,
    ];
    if (d.bfNote && d.bfNote.trim()) lines.push(`        note: ${tsStr(d.bfNote.trim())},`);
    lines.push('    },');
    return lines.join('\n');
}

function buildScriptEntry(d: BattlefieldEventDraft): string {
    const isSiege = d.type === 'siege';
    const dataKey = isSiege ? 'siegeData' : 'fieldBattleData';
    const wp = d.marchWaypoints.map((w) => tsStr(w)).join(', ');
    const L: string[] = [];
    L.push('    // ── 由战场事件编辑器生成（/battlefield-editor.html）──');
    L.push('    {');
    L.push(`        year: ${d.year},`);
    L.push(`        season: ${d.season},`);
    L.push(`        type: ${tsStr(d.type)},`);
    L.push(`        title: ${tsStr(d.eventTitle || d.title)},`);
    L.push(`        description: ${tsStr(d.description)},`);
    L.push(`        ${dataKey}: {`);
    L.push(`            title: ${tsStr(d.title)},`);
    L.push(`            description: ${tsStr(d.battleDescription || d.description)},`);
    // 🔴 只有野战写 location：`SiegeData` 没有这个字段（攻城战走「航点 → 奔目标城
    //    defenderCityId」，不去野战场坐标）。给攻城战写 location 会直接编译不过。
    if (!isSiege) L.push(`            location: { lat: ${d.lat}, lng: ${d.lng} },`);
    if (wp) L.push(`            marchWaypoints: [${wp}],`);
    L.push(`            attackerFactionId: ${tsStr(d.attackerFactionId)},`);
    L.push(`            attackerGeneralId: ${tsStr(d.attackerGeneralId)},`);
    L.push(`            attackerTroops: ${d.attackerTroops},`);
    if (d.attackerSourceCityId) L.push(`            attackerSourceCityId: ${tsStr(d.attackerSourceCityId)},`);
    // 🔴 `SiegeData` 没有 defenderFactionId：攻城战的守方就是那座城，势力从城读。
    //    野战的守方是军团，才需要显式写势力。写错一边直接编译不过。
    if (!isSiege) L.push(`            defenderFactionId: ${tsStr(d.defenderFactionId)},`);
    L.push(`            defenderGeneralId: ${tsStr(d.defenderGeneralId)},`);
    L.push(`            defenderTroops: ${d.defenderTroops},`);
    if (isSiege) {
        L.push(`            defenderCityId: ${tsStr(d.defenderCityId)},`);
    } else if (d.defenderSourceCityId) {
        L.push(`            defenderSourceCityId: ${tsStr(d.defenderSourceCityId)},`);
    }
    L.push(`            result: ${tsStr(d.result)},`);
    L.push('            autoEnterRTS: true,');
    L.push('        },');
    if (d.cityUpdates.length) {
        const ups = d.cityUpdates
            .map((u) => `{ cityId: ${tsStr(u.cityId)}, factionId: ${tsStr(u.factionId)} }`)
            .join(', ');
        L.push(`        cityUpdates: [${ups}],`);
    }
    L.push('    },');
    return L.join('\n');
}

/** 按 year 升序找插入点，把新条目插进数组 */
function insertEntry(
    text: string,
    arrayDecl: string,
    entryCode: string,
    yearOf: (body: string) => number,
    newYear: number,
): string {
    const { entries, arrayEnd } = scanEntries(text, arrayDecl);
    let insertAt = arrayEnd;
    for (const e of entries) {
        if (yearOf(e.body) > newYear) {
            insertAt = text.lastIndexOf('\n', e.start) + 1;
            break;
        }
    }
    return text.slice(0, insertAt) + entryCode + '\n' + text.slice(insertAt);
}

const yearFromScriptBody = (body: string): number => {
    const m = body.match(/year:\s*(-?\d+)/);
    return m ? Number(m[1]) : Number.NEGATIVE_INFINITY;
};
const yearFromBattlefieldBody = (body: string): number => {
    const m = body.match(/scriptYear:\s*(-?\d+)/);
    return m ? Number(m[1]) : Number.NEGATIVE_INFINITY;
};

// ── 主流程 ───────────────────────────────────────────────────────────

export function saveBattlefieldEvent(
    rootDir: string,
    d: BattlefieldEventDraft,
): {
    mode: 'update' | 'insert';
    battlefields: number;
    script: number;
    /** 算好的新内容；由调用方用 serverSafeWriteFileSync 原子落盘 */
    files: Array<{ file: string; content: string }>;
} {
    if (!d || !d.bfId || !d.title) throw new Error('战场 id 与战役名称必须有');
    if (!/^bf_[a-z0-9_]+$/.test(d.bfId)) throw new Error('战场 id 必须是 bf_ 开头的小写拼音（战场不是据点）');
    if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) throw new Error('战场坐标不合法');
    if (!Number.isFinite(d.year) || d.year === 0) throw new Error('年代不合法');
    if (d.type === 'siege' && !d.defenderCityId) throw new Error('攻城战必须指定被攻打的据点');
    if (!(d.attackerTroops > 0) || !(d.defenderTroops > 0)) throw new Error('双方兵力必须 > 0');
    if (!d.attackerGeneralId || !d.defenderGeneralId) throw new Error('双方武将必须有');

    const bfFile = path.resolve(rootDir, 'src/data/Battlefields.ts');
    const scFile = path.resolve(rootDir, 'src/data/HistoricalEventScript.ts');
    const bfBefore = fs.readFileSync(bfFile, 'utf-8');
    const scBefore = fs.readFileSync(scFile, 'utf-8');

    const BF_DECL = 'export const BATTLEFIELDS';
    const SC_DECL = 'export const HISTORICAL_EVENT_SCRIPT';
    const bfCountBefore = scanEntries(bfBefore, BF_DECL).entries.length;
    const scCountBefore = scanEntries(scBefore, SC_DECL).entries.length;

    // ── ① 战场表：按 bfId 定位 ──────────────────────────────────────
    let bfText: string;
    let bfMode: 'update' | 'insert';
    {
        const { entries } = scanEntries(bfBefore, BF_DECL);
        const hit = entries.find((e) => new RegExp(`id:\\s*'${d.bfId}'`).test(e.body));
        if (hit) {
            const fields: Array<[string, string]> = [
                ['name', tsStr(d.bfName)],
                ['lat', String(d.lat)],
                ['lng', String(d.lng)],
                ['scriptYear', String(d.year)],
            ];
            if (d.bfNote && d.bfNote.trim()) fields.push(['note', tsStr(d.bfNote.trim())]);
            bfText = patchFields(bfBefore, hit.start, hit.end, fields).text;
            bfMode = 'update';
        } else {
            bfText = insertEntry(bfBefore, BF_DECL, buildBattlefieldEntry(d), yearFromBattlefieldBody, d.year);
            bfMode = 'insert';
        }
    }

    // ── ② 剧本：战役名优先，其次被攻据点，最后野战坐标 ────────────────
    let scText: string;
    let scMode: 'update' | 'insert';
    {
        const { entries } = scanEntries(scBefore, SC_DECL);
        const hit = entries.find((e) => {
            const body = e.body;
            const y = body.match(/year:\s*(-?\d+)/);
            if (!y || Number(y[1]) !== d.year) return false;
            // 🔴 攻城战的剧本条目**可能没有 location**（推罗就是靠 defenderCityId + 航点走的），
            //    所以不能只按坐标认人。战役名最准（同年两场围城靠它区分：推罗 vs 加沙）。
            if (body.includes(`title: ${tsStr(d.title)}`)) return true;
            if (d.type === 'siege' && d.defenderCityId
                && body.includes(`defenderCityId: ${tsStr(d.defenderCityId)}`)) return true;
            const loc = body.match(/location:\s*\{\s*lat:\s*(-?[\d.]+)\s*,\s*lng:\s*(-?[\d.]+)/);
            if (!loc) return false;
            return Math.abs(Number(loc[1]) - d.lat) < 0.5 && Math.abs(Number(loc[2]) - d.lng) < 0.5;
        });

        if (hit) {
            const isSiege = d.type === 'siege';
            const dataKey = isSiege ? 'siegeData' : 'fieldBattleData';
            // 战斗数据块必须已经是对应的那种；类型改了（野战↔攻城）就不是就地改值能办的事
            const hasKey = new RegExp(`\\n\\s{8}${dataKey}\\s*:`).test(hit.body);
            if (!hasKey) {
                throw new Error(
                    `这场战役原本是${isSiege ? '野战' : '攻城战'}，改成${isSiege ? '攻城战' : '野战'}会动到整块结构，`
                    + '编辑器不做这种改写（会洗掉史料注释）。请手工改，或换个战场 id 新建一条。',
                );
            }

            // 先改顶层字段
            const topFields: Array<[string, string]> = [
                ['year', String(d.year)],
                ['season', String(d.season)],
                ['type', tsStr(d.type)],
                ['title', tsStr(d.eventTitle || d.title)],
                ['description', tsStr(d.description)],
            ];
            if (d.cityUpdates.length) {
                const ups = d.cityUpdates
                    .map((u) => `{ cityId: ${tsStr(u.cityId)}, factionId: ${tsStr(u.factionId)} }`)
                    .join(', ');
                topFields.push(['cityUpdates', `[${ups}]`]);
            }
            const p1 = patchFields(scBefore, hit.start, hit.end, topFields);

            // 再进战斗数据块改里层字段（位置在 p1 之后要重新定位）
            const innerStart = p1.text.indexOf(`${dataKey}: {`, hit.start);
            if (innerStart < 0) throw new Error('定位不到战斗数据块：' + dataKey);
            const braceAt = p1.text.indexOf('{', innerStart + dataKey.length);
            const braceEnd = matchBraceEnd(p1.text, braceAt);
            if (braceEnd < 0) throw new Error('战斗数据块括号不配对');

            const innerFields: Array<[string, string]> = [
                ['title', tsStr(d.title)],
                ['description', tsStr(d.battleDescription || d.description)],
                ['attackerFactionId', tsStr(d.attackerFactionId)],
                ['attackerGeneralId', tsStr(d.attackerGeneralId)],
                ['attackerTroops', String(d.attackerTroops)],
                ['defenderGeneralId', tsStr(d.defenderGeneralId)],
                ['defenderTroops', String(d.defenderTroops)],
                ['result', tsStr(d.result)],
            ];
            // 🔴 `SiegeData` 既没有 location 也没有 defenderFactionId：攻城战走「航点 → 奔目标城」，
            //    守方就是那座城、势力从城读。这两项只有野战写，写错一边直接编译不过。
            if (!isSiege) {
                innerFields.push(['location', `{ lat: ${d.lat}, lng: ${d.lng} }`]);
                innerFields.push(['defenderFactionId', tsStr(d.defenderFactionId)]);
            }
            if (d.attackerSourceCityId) innerFields.push(['attackerSourceCityId', tsStr(d.attackerSourceCityId)]);
            if (d.marchWaypoints.length) {
                innerFields.push(['marchWaypoints', `[${d.marchWaypoints.map((w) => tsStr(w)).join(', ')}]`]);
            }
            if (isSiege) innerFields.push(['defenderCityId', tsStr(d.defenderCityId)]);
            else if (d.defenderSourceCityId) innerFields.push(['defenderSourceCityId', tsStr(d.defenderSourceCityId)]);

            scText = patchFields(p1.text, braceAt, braceEnd, innerFields).text;
            scMode = 'update';
        } else {
            scText = insertEntry(scBefore, SC_DECL, buildScriptEntry(d), yearFromScriptBody, d.year);
            scMode = 'insert';
        }
    }

    // ── 写盘前体检 ─────────────────────────────────────────────────
    const bfCountAfter = scanEntries(bfText, BF_DECL).entries.length;
    const scCountAfter = scanEntries(scText, SC_DECL).entries.length;
    const okCount = (before: number, after: number, mode: string) =>
        mode === 'insert' ? after === before + 1 : after === before;
    if (!okCount(bfCountBefore, bfCountAfter, bfMode)) {
        throw new Error(`战场表条目数异常（${bfCountBefore} → ${bfCountAfter}，${bfMode}），已中止写盘`);
    }
    if (!okCount(scCountBefore, scCountAfter, scMode)) {
        throw new Error(`剧本条目数异常（${scCountBefore} → ${scCountAfter}，${scMode}），已中止写盘`);
    }
    // 双逗号 / 空洞：`},,` 会在数组里留下 undefined 元素，运行时才炸，这里直接拦
    for (const [label, t] of [['战场表', bfText], ['剧本', scText]] as const) {
        if (/,\s*,/.test(t.replace(/\/\/[^\n]*/g, ''))) {
            throw new Error(`${label}出现了连续逗号（数组空洞），已中止写盘`);
        }
    }

    return {
        mode: scMode,
        battlefields: bfCountAfter,
        script: scCountAfter,
        files: [
            { file: bfFile, content: bfText },
            { file: scFile, content: scText },
        ],
    };
}
