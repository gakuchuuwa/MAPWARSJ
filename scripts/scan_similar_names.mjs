/**
 * 扫描现有 cities_v2.ts + factions.ts + SDN, 找出名字"包含/被包含"关系的可疑重复.
 * 输出: 让用户判断要不要合并 / 重命名.
 *
 * 规则: 名字 A 是 名字 B 的子串 (或反之), 且两者长度都 >= 2, 视为可疑.
 *       严格相等不算 (那叫真重复, 编辑器会自动 replace).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readText(p) { return fs.readFileSync(path.join(__dirname, '..', p), 'utf-8'); }

// ─── cities ───
const citiesText = readText('src/data/cities_v2.ts');
const cities = [];
for (const m of citiesText.matchAll(/id:\s*'(city_[^']+)'\s*,?\s*name:\s*'([^']+)'/g)) {
    cities.push({ id: m[1], name: m[2] });
}

// ─── factions ───
const factionsText = readText('src/data/factions.ts');
const factions = [];
for (const m of factionsText.matchAll(/id:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'/g)) {
    factions.push({ id: m[1], name: m[2] });
}

// ─── SDN (旗号) ───
const sdnText = readText('src/data/SandboxDisplayNames.ts');
const flags = []; // [{ factionId, flagText }]
const start = sdnText.indexOf('SANDBOX_DISPLAY_NAMES');
const end = sdnText.indexOf('};', start);
const sdnBody = sdnText.slice(start, end);
for (const m of sdnBody.matchAll(/'([^']+)':\s*'([^']+)'/g)) {
    flags.push({ factionId: m[1], flagText: m[2] });
}

function checkOverlap(list, label) {
    console.log(`\n═══ ${label} (共 ${list.length} 项) ═══`);
    const hits = [];
    for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
            const a = list[i].name;
            const b = list[j].name;
            if (!a || !b) continue;
            if (a === b) continue;          // 严格相等 = 真重复, 不在本扫描范围
            if (a.length < 2 || b.length < 2) continue;
            if (a.includes(b) || b.includes(a)) {
                hits.push([list[i], list[j]]);
            }
        }
    }
    if (hits.length === 0) { console.log('  ✅ 无可疑'); return; }
    console.log(`  ⚠️ ${hits.length} 对可疑:`);
    for (const [a, b] of hits.slice(0, 50)) {
        const ka = a.name.length > b.name.length ? a.name : b.name;
        const kb = a.name.length > b.name.length ? b.name : a.name;
        console.log(`    ${ka.padEnd(8, ' ')} ⊃ ${kb.padEnd(6, ' ')}  (${a.id} ↔ ${b.id})`);
    }
    if (hits.length > 50) console.log(`    ... 还有 ${hits.length - 50} 对`);
}

function checkFlagOverlap() {
    console.log(`\n═══ 旗号 (共 ${flags.length} 项) ═══`);
    const hits = [];
    for (let i = 0; i < flags.length; i++) {
        for (let j = i + 1; j < flags.length; j++) {
            const a = flags[i].flagText;
            const b = flags[j].flagText;
            if (!a || !b) continue;
            if (a === b) continue;
            if (a.length < 2 || b.length < 2) continue;
            if (a.includes(b) || b.includes(a)) {
                hits.push([flags[i], flags[j]]);
            }
        }
    }
    if (hits.length === 0) { console.log('  ✅ 无可疑'); return; }
    console.log(`  ⚠️ ${hits.length} 对可疑:`);
    for (const [a, b] of hits.slice(0, 30)) {
        const ka = a.flagText.length > b.flagText.length ? a.flagText : b.flagText;
        const kb = a.flagText.length > b.flagText.length ? b.flagText : a.flagText;
        console.log(`    ${ka.padEnd(6, ' ')} ⊃ ${kb.padEnd(4, ' ')}  (${a.factionId} ↔ ${b.factionId})`);
    }
    if (hits.length > 30) console.log(`    ... 还有 ${hits.length - 30} 对`);
}

checkOverlap(cities, '据点名包含关系扫描');
checkOverlap(factions, '势力名包含关系扫描');
checkFlagOverlap();
console.log('');
