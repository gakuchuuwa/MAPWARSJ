/** 修 id 冲突：kelimiya 已是「热那亚共和国」，克里米亚汗国改用 kelimiya_han */
import { readFileSync, writeFileSync } from 'node:fs';
const NL = '\r\n';
const WRITE = process.argv.includes('--write');
const edits: [string, RegExp, string][] = [
    ['src/data/factions.ts', /^  \{ id: 'kelimiya', name: '克里米亚汗国' \},(.*)$/, `  { id: 'kelimiya_han', name: '克里米亚汗国' },    // 🔴 [2026-11-11 GG第五轮·武将缺政权新建公认政权] 克里米亚汗国（1441–1783）`],
    ['src/data/FactionLifeYears.ts', /^    kelimiya: \{ start: 1441, end: 1783.*$/, `    kelimiya_han: { start: 1441, end: 1783, source: 'Wikipedia「Crimean Khanate」：1441 年哈吉·格莱立国（巴赫奇萨赖为都），1783 年为俄国兼并', note: '克里米亚鞑靼汗国；库内无巴赫奇萨赖据点，首都取最近同文化据点奥列什基' },`],
    ['src/data/FactionEra.ts', /^    'kelimiya': \[\{ from: -9999, era: 'imperial' \}\], \/\/ 克里米亚汗国.*$/, `    'kelimiya_han': [{ from: -9999, era: 'imperial' }], // 克里米亚汗国（1441–1783）`],
    ['src/data/SandboxDisplayNames.ts', /^  kelimiya: '克米',.*$/, `  kelimiya_han: '克米',  // 克里米亚汗国（1441–1783）`],
    ['src/assets/CityAssetManager.ts', /^        'kelimiya': '克米',.*$/, `        'kelimiya_han': '克米',   // 克里米亚汗国（1441–1783）`],
    ['src/data/HistoricalFactionColors.ts', /^    kelimiya: '#5B4E7A',.*$/, `    kelimiya_han: '#5B4E7A', // 克里米亚汗国（1441–1783）`],
    ['src/data/StartingCapitals.ts', /^  'kelimiya': 'city_oleshky',.*$/, `  'kelimiya_han': 'city_oleshky',   // 克里米亚汗国（1441–1783）`],
    ["src/data/FactionGenerals.ts", /^        \{ generalId: 'gen_haci_giray', factionId: 'kelimiya',/, `        { generalId: 'gen_haci_giray', factionId: 'kelimiya_han',`],
];
for (const [p, re, rep] of edits) {
    const L = readFileSync(p, 'utf8').split(NL);
    const i = L.findIndex(l => re.test(l));
    if (i < 0) { console.log(`[MISS] ${p} ${re}`); continue; }
    L[i] = L[i].replace(re, rep);
    if (WRITE) writeFileSync(p, L.join(NL), 'utf8');
    console.log(`[OK] ${p}:${i + 1} → ${L[i].trim().slice(0, 70)}`);
}
