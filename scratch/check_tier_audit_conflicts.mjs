/**
 * 级别审计冲突检查（单字 1 级锁定 + 跨表重复 + 运行时级别）
 * 运行: npm run tier:check
 */
import fs from 'fs';
import {
    classifyFactionTier,
    TIER1_REGIME_SEED,
    flagCharLen,
} from '../src/data/factionTierClassify.ts';
import { SANDBOX_DISPLAY_NAMES } from '../src/data/SandboxDisplayNames.ts';

const AUDIT_FILES = [
    { key: 'ethnic', file: 'ethnic_homeland_audit.json', label: '民族' },
    { key: 'regime', file: 'regime_capital_audit.json', label: '政权' },
    { key: 'family', file: 'family_state_audit.json', label: '家族' },
    { key: 'county', file: 'county_seat_audit.json', label: '州郡' },
];

function loadIds(path) {
    const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
    const entries = raw.entries ?? raw;
    return new Set(entries.map((e) => e.factionId ?? e.id).filter(Boolean));
}

const byFile = Object.fromEntries(
    AUDIT_FILES.map(({ key, file }) => [key, loadIds(`scratch/${file}`)]),
);

/** 单字正式国号 1 级 — 定好勿改 */
const tier1SingleLocked = [...TIER1_REGIME_SEED].filter((id) => {
    const flag = SANDBOX_DISPLAY_NAMES[id];
    return flag && flagCharLen(flag) === 1;
});

const errors = [];
const warnings = [];

// 1) 单字 1 级锁定：不得出现在 ethnic / family / county
for (const id of tier1SingleLocked) {
    for (const { key, label } of AUDIT_FILES) {
        if (key === 'regime') continue;
        if (byFile[key].has(id)) {
            errors.push(`[1级锁定] ${id}（${SANDBOX_DISPLAY_NAMES[id]}）不得写入${label}审计`);
        }
    }
}

// 2) 跨表重复
const idToFiles = new Map();
for (const { key, label } of AUDIT_FILES) {
    for (const id of byFile[key]) {
        const list = idToFiles.get(id) ?? [];
        list.push(label);
        idToFiles.set(id, list);
    }
}
for (const [id, labels] of idToFiles) {
    if (labels.length > 1) {
        warnings.push(`[跨表重复] ${id} 同时出现在: ${labels.join('、')}`);
    }
}

// 3) 单字 TIER1 种子运行时须为 1 级
for (const id of tier1SingleLocked) {
    const flag = SANDBOX_DISPLAY_NAMES[id];
    const r = classifyFactionTier(id, flag);
    if (r.tier !== 1) {
        errors.push(
            `[1级运行时] ${id}「${flag}」应为 1 级，实际 ${r.tier} 级（${r.category}）`,
        );
    }
}

console.log('=== tier:check ===');
console.log(`单字 1 级锁定: ${tier1SingleLocked.length} 个`);
console.log(`errors: ${errors.length} | warnings: ${warnings.length}`);
if (errors.length) {
    console.log('\n--- ERRORS ---');
    errors.forEach((e) => console.log(e));
}
if (warnings.length) {
    console.log('\n--- WARNINGS ---');
    warnings.forEach((w) => console.log(w));
}

const report = {
    checkedAt: new Date().toISOString(),
    tier1SingleLocked,
    errors,
    warnings,
    pass: errors.length === 0,
};
fs.writeFileSync('scratch/tier_audit_conflicts_report.json', JSON.stringify(report, null, 2));
console.log('\nWrote scratch/tier_audit_conflicts_report.json');

process.exit(errors.length ? 1 : 0);
