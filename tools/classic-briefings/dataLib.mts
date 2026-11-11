/**
 * 经典战导入用的「改游戏数据」共用件：新增势力（连同它的名将）、新增战场人物、改经典战条目、写补选表。
 *
 * 🔴 [2026-11-11 主人定「没有的该添加就添加，但是势力要和有名字的武将同步添加」]
 *   新增势力一次登记齐 6 张表：势力表、旗号（沙盘名）、旗帜文字、时代、颜色、都城；
 *   名将进「战场人物」表（只在战场上出现、不参与城池掷将，立绘留空走势力/文化池回落）。
 *   全部幂等：已经有的不重复加。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { GeneralFirstBattle } from '../../src/data/GeneralFirstBattles';
import { FACTIONS } from '../../src/data/factions';
import { FACTION_GENERALS, type FactionGeneral } from '../../src/data/FactionGenerals';
import { BATTLEFIELD_CHARACTERS } from '../../src/data/BattlefieldCharacters';
import { CITIES_V2 } from '../../src/data/cities_v2';

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** 在文件里某个锚点行（含 `export const X`）的下一行插入一段；锚点找不到就报错 */
function insertAfterAnchor(file: string, anchor: RegExp, lines: string, existsCheck: RegExp): boolean {
    const src = readFileSync(file, 'utf8');
    if (existsCheck.test(src)) return false;
    const m = anchor.exec(src);
    if (!m) throw new Error(`${file} 找不到插入点 ${anchor}`);
    const eol = src.includes('\r\n') ? '\r\n' : '\n';   // 保持文件原有换行风格
    const at = src.indexOf('\n', m.index) + 1;
    writeFileSync(file, src.slice(0, at) + lines + eol + src.slice(at), 'utf8');
    return true;
}

// ── 名字 → 编号 ─────────────────────────────────────────────
const addedFactions = new Map<string, string>();    // 本次新加的：国号 → id
const addedCharacters = new Map<string, string>();  // 本次新加的：人名 → id

export function factionIdByName(name: string, aliases: Readonly<Record<string, string>> = {}): string | null {
    if (!name) return null;
    if (aliases[name]) return aliases[name];
    if (addedFactions.has(name)) return addedFactions.get(name)!;
    const exact = FACTIONS.find((f) => f.name === name);
    if (exact) return exact.id;
    const loose = FACTIONS.filter((f) => f.name && (f.name.includes(name) || name.includes(f.name)));
    return loose.length === 1 ? loose[0].id : null;
}

const generalByName = new Map<string, string>();
for (const entry of Object.values(FACTION_GENERALS)) {
    for (const g of (Array.isArray(entry) ? entry : [entry]) as FactionGeneral[]) {
        if (g?.generalName && !generalByName.has(g.generalName)) generalByName.set(g.generalName, g.generalId);
    }
}
for (const c of Object.values(BATTLEFIELD_CHARACTERS)) if (!generalByName.has(c.generalName)) generalByName.set(c.generalName, c.generalId);

/** 已有武将或战场人物里按名字认人 */
export function generalIdByName(name: string): string | null {
    return generalByName.get(name) ?? addedCharacters.get(name) ?? null;
}

export function cityIdByName(name: string): string | null {
    return CITIES_V2.find((c) => c.name === name)?.id ?? null;
}

// ── 新增：战场人物 ──────────────────────────────────────────
/** 登记一位只在战场上出现的真名人物；已有同名的直接返回他的编号 */
export function ensureBattlefieldCharacter(name: string, factionId: string, note: string, dry: boolean): string {
    const found = generalIdByName(name);
    if (found) return found;
    let n = 1;
    let id = `bfe_cb_${factionId}_${n}`;
    const taken = (x: string) => !!BATTLEFIELD_CHARACTERS[x] || [...addedCharacters.values()].includes(x);
    while (taken(id)) id = `bfe_cb_${factionId}_${++n}`;
    addedCharacters.set(name, id);
    if (!dry) {
        insertAfterAnchor('src/data/BattlefieldCharacters.ts', /export const BATTLEFIELD_CHARACTERS[^\n]*\{/,
            `    ${id}: { generalId: ${q(id)}, generalName: ${q(name)}, factionId: ${q(factionId)}, note: ${q(`🔴 [经典战导入] ${note}`)} },`,
            new RegExp(`\\n\\s+${id}: \\{`));
    }
    return id;
}

// ── 新增：势力 ─────────────────────────────────────────────
const ERA: Record<string, string> = { 古典: 'antiquity', 上古: 'antiquity', 封建: 'feudal', 城堡: 'castle', 帝国: 'imperial' };

function colorFor(id: string): string {
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const hue = h % 360, s = 0.45, l = 0.42;
    const f = (n: number) => {
        const k = (n + hue / 30) % 12;
        const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(c * 255).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export interface NewFactionSpec {
    id: string; name: string; flag: string; era: string; capitalCityName: string;
    generalName: string; generalNote: string; source: string;
}

/** 检查一条新增势力能不能加；返回错误列表（空＝能加） */
export function checkNewFaction(spec: NewFactionSpec): string[] {
    const errs: string[] = [];
    if (!/^[a-z][a-z0-9_]{2,30}$/.test(spec.id)) errs.push(`势力编号「${spec.id}」要小写字母/数字/下划线`);
    if (FACTIONS.some((f) => f.id === spec.id)) errs.push(`势力编号「${spec.id}」已被占用`);
    if (FACTIONS.some((f) => f.name === spec.name)) errs.push(`国号「${spec.name}」游戏里已有，不用新增`);
    if (Array.from(spec.flag).length < 1 || Array.from(spec.flag).length > 2) errs.push('旗号要一到两个字');
    const flags = readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
    if (new RegExp(`:\\s*'${spec.flag}'`).test(flags)) errs.push(`旗号「${spec.flag}」与别的势力撞了`);
    if (!ERA[spec.era]) errs.push(`时代「${spec.era}」只能是 古典 / 封建 / 城堡 / 帝国`);
    if (!cityIdByName(spec.capitalCityName)) errs.push(`都城「${spec.capitalCityName}」不是游戏里的据点名`);
    if (!spec.generalName) errs.push('势力必须同时登记一位有名字的名将（主人定）');
    return errs;
}

/** 新增一个势力并登记它的名将；返回名将编号 */
export function addFaction(spec: NewFactionSpec, dry: boolean): string {
    addedFactions.set(spec.name, spec.id);
    if (!dry) {
        const tag = `🔴 [经典战导入] ${spec.source}`;
        const has = new RegExp(`'${spec.id}'`);
        insertAfterAnchor('src/data/factions.ts', /export const FACTIONS: Faction\[\] = \[/,
            `  { id: ${q(spec.id)}, name: ${q(spec.name)} },   // ${tag}`, new RegExp(`id: '${spec.id}'`));
        insertAfterAnchor('src/data/SandboxDisplayNames.ts', /export const SANDBOX_DISPLAY_NAMES[^\n]*\{/,
            `    ${q(spec.id)}: ${q(spec.flag)}, // ${spec.name}`, has);
        insertAfterAnchor('src/assets/CityAssetManager.ts', /factionFlagMap: \{ \[key: string\]: string \} = \{/,
            `        ${q(spec.id)}: ${q(spec.flag)},   // ${spec.name}（经典战导入）`, has);
        insertAfterAnchor('src/data/FactionEra.ts', /export const FACTION_ERA[^\n]*\{/,
            `    ${q(spec.id)}: [{ from: -9999, era: ${q(ERA[spec.era])} }], // ${spec.name}（经典战导入）`, has);
        insertAfterAnchor('src/data/HistoricalFactionColors.ts', /export const HISTORICAL_FACTION_COLORS[^\n]*\{/,
            `    ${spec.id}: ${q(colorFor(spec.id))}, // ${spec.name}（经典战导入）`, new RegExp(`\\n\\s+'?${spec.id}'?:`));
        insertAfterAnchor('src/data/StartingCapitals.ts', /export const STARTING_CAPITALS[^\n]*\{/,
            `    ${q(spec.id)}: ${q(cityIdByName(spec.capitalCityName)!)},   // ${spec.name}（经典战导入，登记用）`, has);
    }
    const existing = generalIdByName(spec.generalName);
    if (existing) {
        // 已有的武将／战场人物：把他改挂到新势力（武将档案只改显示势力 `factionId`，不动据点、精锐与军团编制）
        if (!dry) repointGeneralFaction(existing, spec.id);
        return existing;
    }
    return ensureBattlefieldCharacter(spec.generalName, spec.id, `${spec.name}名将：${spec.generalNote}`, dry);
}

/** 把一位已有的人物改挂到某势力：FactionGenerals 写显示势力 factionId；战场人物改 factionId */
function repointGeneralFaction(generalId: string, factionId: string): void {
    for (const file of ['src/data/FactionGenerals.ts', 'src/data/BattlefieldCharacters.ts']) {
        const src = readFileSync(file, 'utf8');
        const lineRe = new RegExp(`^.*generalId: '${generalId}'.*$`, 'm');
        const m = lineRe.exec(src);
        if (!m) continue;
        const line = m[0];
        const next = /factionId: '[^']*'/.test(line)
            ? line.replace(/factionId: '[^']*'/, `factionId: '${factionId}'`)
            : line.replace(`generalId: '${generalId}',`, `generalId: '${generalId}', factionId: '${factionId}',`);
        writeFileSync(file, src.replace(line, next), 'utf8');
        console.log(`  改挂势力：${generalId} → ${factionId}（${file}）`);
        return;
    }
}

// ── 改经典战条目 ────────────────────────────────────────────
const FB_FILE = 'src/data/GeneralFirstBattles.ts';

/** 改第一场经典战（GeneralFirstBattles.ts 里键＝generalId 的那一条）的一个字段；没有该字段就补一行 */
export function patchFirstBattle(generalId: string, field: keyof GeneralFirstBattle, value: string | number, dry: boolean): void {
    if (dry) return;
    const src = readFileSync(FB_FILE, 'utf8');
    const eol = src.includes('\r\n') ? '\r\n' : '\n';   // 本文件是 CRLF，保持原样
    const start = src.search(new RegExp(`\\n    ${generalId}: \\{\\r?\\n`));
    if (start < 0) throw new Error(`找不到经典战条目 ${generalId}`);
    const endRel = src.slice(start + 1).search(/\n    \},/);
    if (endRel < 0) throw new Error(`经典战条目 ${generalId} 找不到结尾`);
    const end = start + 1 + endRel;
    let block = src.slice(start, end);
    const lit = typeof value === 'number' ? String(value) : q(value);
    // 只换值，保留行尾注释
    const re = new RegExp(`(\\n        ${String(field)}: )[^,\\r\\n]+,`);
    if (re.test(block)) block = block.replace(re, `$1${lit},`);
    else block = block.replace(/(\n        enemyFactionName: [^\r\n]+)/, `$1${eol}        ${String(field)}: ${lit},`);
    writeFileSync(FB_FILE, src.slice(0, start) + block + src.slice(end), 'utf8');
}

const EXTRA_FILE = 'src/data/GeneralExtraClassicBattles.ts';

/** 整份写回补选表（保留文件头注释） */
export function writeExtras(extras: Record<string, GeneralFirstBattle[]>): void {
    const src = readFileSync(EXTRA_FILE, 'utf8');
    const head = src.slice(0, src.indexOf('export const GENERAL_EXTRA_CLASSIC_BATTLES'));
    const body = Object.keys(extras).filter((g) => extras[g].length).sort()
        .map((gid) => `    ${JSON.stringify(gid)}: ${JSON.stringify(extras[gid], null, 4).replace(/\n/g, '\n    ')},`)
        .join('\n');
    writeFileSync(EXTRA_FILE,
        `${head}export const GENERAL_EXTRA_CLASSIC_BATTLES: Readonly<Record<string, readonly GeneralFirstBattle[]>> = {\n${body}${body ? '\n' : ''}};\n`, 'utf8');
    console.log(`已写入 ${EXTRA_FILE}`);
}
