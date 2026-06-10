import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const j = JSON.parse(
    fs.readFileSync(path.join(root, 'scratch/faction_flag_template_by_tier.json'), 'utf8'),
);

const caps = {};
for (const m of fs.readFileSync(path.join(root, 'src/data/StartingCapitals.ts'), 'utf8').matchAll(
    /'([^']+)':\s*'([^']+)'/g,
)) {
    caps[m[1]] = m[2];
}

const cities = {};
for (const m of fs.readFileSync(path.join(root, 'src/data/cities_v2.ts'), 'utf8').matchAll(
    /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g,
)) {
    cities[m[1]] = m[2];
}

const pending = j.entries.filter((e) => e.tier === 5 && e.category.includes('待定'));
const family = j.entries.filter((e) => e.tier === 5 && e.category === '家族');
const jun = j.entries.filter((e) => e.tier === 5 && e.category === '州郡');

function enrich(e) {
    const cap = caps[e.id];
    return {
        id: e.id,
        flag: e.flag,
        capitalCityId: cap || null,
        capitalName: cap ? cities[cap] || cap : null,
        currentTier: 5,
        currentCategory: e.category,
        auditTier: null,
        auditNote: '',
    };
}

const pendingAudit = pending.map(enrich).sort((a, b) => a.flag.localeCompare(b.flag, 'zh'));

const out = {
    updated: '2026-06-09',
    instruction:
        '请填 auditTier: 1大政权 2大民族 3小政权 4小民族 5家族地名 6起义；null 则维持5',
    tierLegend: {
        1: '大政权 / 旗9',
        2: '大民族 / 旗16',
        3: '小政权 / 旗26',
        4: '小民族 / 旗57',
        5: '家族地名 / 旗33',
        6: '起义 / 旗53',
    },
    counts: {
        pending: pending.length,
        familyConfirmed: family.length,
        junConfirmed: jun.length,
    },
    pendingAudit,
    alreadyTier5Family: family.map(enrich),
    alreadyTier5Jun: jun.map(enrich),
};

fs.writeFileSync(
    path.join(root, 'scratch/tier5_pending_audit.json'),
    JSON.stringify(out, null, 2),
    'utf8',
);

let md = `# 五级「待定」势力审计清单（共 ${pending.length} 个）\n\n`;
md += `填法：在 \`tier5_pending_audit.json\` 里改 \`auditTier\`（1–6）和 \`auditNote\`。\n\n`;
md += `| 规则 | 含义 | 旗面 |\n|------|------|------|\n`;
md += `| 1 | 大政权 | 9 |\n| 2 | 大民族 | 16 |\n| 3 | 小政权 | 26 |\n`;
md += `| 4 | 小民族 | 57 |\n| 5 | 家族地名 | 33 |\n| 6 | 起义叛乱 | 53 |\n\n`;
md += `| # | 旗号 | id | 首都 |\n|---|------|-----|------|\n`;
pendingAudit.forEach((x, i) => {
    md += `| ${i + 1} | ${x.flag} | \`${x.id}\` | ${x.capitalName || '—'} |\n`;
});

md += `\n---\n\n## 已标五级·家族（${family.length}，供核对）\n\n`;
for (const x of family.map(enrich)) {
    md += `- **${x.flag}** (\`${x.id}\`) @ ${x.capitalName || '—'}\n`;
}

md += `\n## 已标五级·州郡（${jun.length}，供核对）\n\n`;
for (const x of jun.map(enrich)) {
    md += `- **${x.flag}** (\`${x.id}\`) @ ${x.capitalName || '—'}\n`;
}

fs.writeFileSync(path.join(root, 'scratch/tier5_pending_audit.md'), md, 'utf8');

console.log(`pending ${pending.length}, family ${family.length}, jun ${jun.length}`);
console.log('scratch/tier5_pending_audit.json');
console.log('scratch/tier5_pending_audit.md');
