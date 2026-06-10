/**
 * 导出「未审计」势力清单 → scratch/faction_tier_pending_audit.json
 * 用法：node scratch/export_faction_tier_pending.mjs
 */
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

const pending = j.entries
    .filter((e) => e.note?.includes('无审计'))
    .map((e) => {
        const cap = caps[e.id];
        return {
            id: e.id,
            flag: e.flag,
            flagLen: e.flagLen,
            currentTier: e.tier,
            currentCategory: e.category,
            flagTemplate: e.flagTemplate,
            capitalCityId: cap || null,
            capitalName: cap ? cities[cap] || cap : null,
            /** 填：民族 | 政权 | 家族 | 州郡 | 起义 | null(维持现状) */
            auditCategory: null,
            /** 若 auditCategory=民族/政权/家族/州郡/起义，填 1–6；null=按规则自动 */
            auditTier: null,
            auditNote: '',
        };
    })
    .sort((a, b) => a.flag.localeCompare(b.flag, 'zh'));

const out = {
    updated: new Date().toISOString().slice(0, 10),
    instruction:
        '未命中四类审计表，暂按旗号字数落入4/5级。请填 auditCategory + auditNote；确认后写入对应 scratch/*_audit.json',
    counts: {
        total: pending.length,
        tier4_default: pending.filter((x) => x.currentTier === 4).length,
        tier5_default: pending.filter((x) => x.currentTier === 5).length,
    },
    pendingAudit: pending,
};

fs.writeFileSync(
    path.join(root, 'scratch/faction_tier_pending_audit.json'),
    JSON.stringify(out, null, 2),
    'utf8',
);

let md = `# 未审计势力清单（共 ${pending.length} 个）\n\n`;
md += `暂按旗号字数：二字→4级(旗46)，一字→5级(旗31)。\n\n`;
md += `| # | 旗号 | id | 首都 | 现级别 |\n|---|------|-----|------|--------|\n`;
pending.forEach((x, i) => {
    md += `| ${i + 1} | ${x.flag} | \`${x.id}\` | ${x.capitalName || '—'} | ${x.currentTier} |\n`;
});

fs.writeFileSync(path.join(root, 'scratch/faction_tier_pending_audit.md'), md, 'utf8');
console.log('scratch/faction_tier_pending_audit.json');
console.log('scratch/faction_tier_pending_audit.md');
console.log(JSON.stringify(out.counts, null, 2));
