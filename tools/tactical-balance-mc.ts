/**
 * 战术技「单层平衡」审计（仅武将战术技这一层，不含精锐/战略技/立绘叠加）
 * 运行：npm run tactical:balance
 *
 * 口径：假设每个技【触发时】，换算成「等效开战乘区」，在对称 2万vs2万(基础~50%)下跑 MC，
 *       得「触发时胜率」，再对照该技的「条件稀有度」判定是否平衡。
 *
 * 平衡标准（锚点 = 百战不殆 ×1.2 ≈ 85%）：
 *   · 高频/无条件技 触发时胜率应 ≤ ~88%（贴近锚点）；>90% = 偏强
 *   · 中频条件技   ≤ ~92%
 *   · 稀有条件技   ≤ ~97%（以寡击众等绝境技允许高，靠稀有+AI/绝境专属平衡）
 *   · 命运系(方差型) 触发时对称 ~50%，只看均值有无破坏
 */
import {
    TACTICAL_SKILL_ENTRIES_V1,
    TACTICAL_ASSIGN_TIER,
    getTacticalAssignTier,
    type TacticalSkillEntry,
    type TacticalSkillCondition,
    type TacticalAssignTier,
} from '../src/data/TacticalSkillCatalog';
import { aggregate, type UnitSpec } from './combat-model';

const N = 20000;

// ── 条件稀有度分档（据 tactical:weights 实测触发率归类；跟随军团视角） ──
type Rarity = 'high' | 'mid' | 'rare';
const CONDITION_RARITY: Record<string, Rarity> = {
    always: 'high',
    enemy_different_culture: 'high',   // 跨文化交战 ~92%，几乎无差别触发
    battle_siege_attacker: 'mid',      // 均势AI攻方~55%(中频)；明星军团92%攻方但碾压无感→按AI视角中频
    terrain_mountain: 'mid',
    terrain_plain: 'mid',
    battle_field: 'mid',
    enemy_famous_general: 'mid',
    terrain_sea: 'rare',
    battle_siege_defender: 'rare',     // 守城技触发 ~7%
    ratio_underdog: 'rare',
    self_troops_below_enemy_pct: 'rare',
    side_comeback: 'rare',
    first_sortie: 'rare',
    has_elite_legion: 'mid',
    siege_attacker_on_water: 'rare',
    lose_as_underdog: 'rare',
    enemy_troops_below_pct: 'rare',
};

const RARITY_LABEL: Record<Rarity, string> = { high: '高频', mid: '中频', rare: '稀有' };
// 各稀有度「触发时胜率」上限（超过=偏强）
const RARITY_CAP: Record<Rarity, number> = { high: 0.88, mid: 0.92, rare: 0.97 };

function mcEquivMultWinRate(equivMult: number): number {
    if (Math.abs(equivMult - 1) < 1e-9) return baselineWin;
    let wins = 0;
    for (let i = 0; i < N; i++) {
        const r = aggregate(
            [{ troops: 20000, maxTroops: 20000, multOverride: equivMult } as UnitSpec],
            [{ troops: 20000, maxTroops: 20000, multOverride: 1 } as UnitSpec],
            1,
            'plain',
        );
        if (r.attackerWinRate >= 1) wins++;
    }
    return wins / N;
}

let baselineWin = 0.5;

/** 换算等效开战乘区；返回 null 表示本表不评（非开战乘区/削敌类，或开战无效） */
function equivMultOf(e: TacticalSkillEntry): { mult: number | null; note?: string } {
    switch (e.baseEffect) {
        case 'ally_power_mult':
            return { mult: e.magnitude ?? 1 };
        case 'enemy_sub_troops_opening': {
            const r = e.magnitude ?? 0;
            return { mult: 1 / (1 - r), note: `削敌${(r * 100).toFixed(0)}%` };
        }
        case 'ally_add_troops_opening':
            // 开战满编 → 补兵封顶 maxTroops → 开战无实际效果
            return { mult: null, note: '开战满编无效（仅未满编时补兵）' };
        default:
            return { mult: null };
    }
}

function main(): void {
    baselineWin = mcEquivMultWinRate(1.0000001); // 触发一次占位；下面单独测
    // 真·基线：×1.0
    {
        let wins = 0;
        for (let i = 0; i < N; i++) {
            const r = aggregate(
                [{ troops: 20000, maxTroops: 20000, multOverride: 1 } as UnitSpec],
                [{ troops: 20000, maxTroops: 20000, multOverride: 1 } as UnitSpec],
                1, 'plain',
            );
            if (r.attackerWinRate >= 1) wins++;
        }
        baselineWin = wins / N;
    }
    const anchor = mcEquivMultWinRate(1.2);

    console.log(`══ 战术技单层平衡审计（N=${N}/技，对称2万vs2万，触发时口径）══\n`);
    console.log(`基线 ×1.0 = ${(baselineWin * 100).toFixed(1)}% ｜ 锚点 百战不殆×1.2 = ${(anchor * 100).toFixed(1)}%\n`);

    // 开战乘区/削敌类
    const rows: {
        e: TacticalSkillEntry; equiv: number; note: string; rarity: Rarity;
        win: number; verdict: string;
    }[] = [];

    for (const e of TACTICAL_SKILL_ENTRIES_V1) {
        if (e.phase !== 'opening_roll' && e.phase !== 'pre_opening_troops') continue;
        if (e.baseEffect === 'luck_variance_self' || e.baseEffect === 'luck_variance_enemy'
            || e.baseEffect === 'luck_lock_self') continue; // 命运系单列
        const { mult, note } = equivMultOf(e);
        if (mult === null) continue;
        const rarity = CONDITION_RARITY[e.condition as TacticalSkillCondition] ?? 'mid';
        const win = mcEquivMultWinRate(mult);
        const cap = RARITY_CAP[rarity];
        let verdict = '✅ 平衡';
        if (win > cap + 0.02) verdict = '🔴 偏强';
        else if (win > cap) verdict = '🟡 略强';
        else if (win < baselineWin + 0.15 && rarity === 'high') verdict = '（偏弱/温和）';
        rows.push({ e, equiv: mult, note: note ?? '', rarity, win, verdict });
    }

    rows.sort((a, b) => b.win - a.win);

    const TIER_LABEL: Record<TacticalAssignTier, string> = {
        common: '大众', limited: '限量', ai_defensive: 'AI守',
        underdog: '绝境', gamble: '豪赌', star_survival: '存活',
    };

    console.log('【开战乘区 / 削敌类】按触发时胜率排序：\n');
    console.log('  技能            等效×   触发时胜率  稀有度  上限   分配   判定   条件/备注');
    console.log('  ' + '─'.repeat(88));
    for (const r of rows) {
        const name = (r.e.displayName + '　').padEnd(7, '　');
        const eq = `×${r.equiv.toFixed(3)}`.padStart(7);
        const wr = `${(r.win * 100).toFixed(1)}%`.padStart(6);
        const rl = RARITY_LABEL[r.rarity].padEnd(2);
        const cap = `${(RARITY_CAP[r.rarity] * 100).toFixed(0)}%`.padStart(4);
        const tier = getTacticalAssignTier(r.e.id);
        const tl = (tier ? TIER_LABEL[tier] : '缺!').padEnd(2);
        console.log(`  ${name} ${eq}  ${wr}      ${rl}   ${cap}  ${tl}   ${r.verdict.padEnd(6)} ${r.e.condition} ${r.note}`);
    }

    // 命运系（方差型，触发时对称口径）
    console.log('\n【命运系·方差型】触发时对称场景应 ~50%（均值口径；劣势/优势翻方差另见 fate-mc）：\n');
    for (const e of TACTICAL_SKILL_ENTRIES_V1) {
        if (e.baseEffect !== 'luck_variance_self' && e.baseEffect !== 'luck_variance_enemy'
            && e.baseEffect !== 'luck_lock_self') continue;
        const lo = e.luckMin ?? 1, hi = e.luckMax ?? 1;
        const mean = e.baseEffect === 'luck_lock_self' ? (e.magnitude ?? 1) : (lo + hi) / 2;
        const span = e.baseEffect === 'luck_lock_self' ? 0 : hi - lo;
        console.log(`  ${(e.displayName + '　').padEnd(7, '　')} 区间[${lo},${hi}] 均值${mean.toFixed(2)} 方差幅${span.toFixed(2)}  ${e.condition}`);
    }

    // 汇总
    const strong = rows.filter(r => r.verdict.includes('偏强') || r.verdict.includes('略强'));
    console.log('\n══ 结论 ══');
    if (strong.length === 0) {
        console.log('✅ 开战乘区/削敌类全部落在各自稀有度上限内，本层平衡。');
    } else {
        console.log(`触发时超稀有度上限 ${strong.length} 个（条件技=设计意图爆发；重点看无条件/高频）：`);
        for (const r of strong) {
            console.log(`   ${r.e.displayName}(${r.e.id}) ${(r.win * 100).toFixed(1)}% > ${RARITY_LABEL[r.rarity]}上限${(RARITY_CAP[r.rarity] * 100).toFixed(0)}% [${r.verdict}]`);
        }
    }

    // ── 分配层校验 ──
    console.log('\n══ 分配层策略校验 ══');
    const missing = TACTICAL_SKILL_ENTRIES_V1.filter(e => !TACTICAL_ASSIGN_TIER[e.id]);
    if (missing.length > 0) {
        console.log(`🔴 ${missing.length} 技缺分配层标注: ${missing.map(e => e.id).join(', ')}`);
    } else {
        console.log('✅ 49 技全部有分配层标注');
    }
    // 高频/无条件却偏强的技，分配层必须非 common（限量/豪赌/AI守）
    const leaks = rows.filter(r =>
        (r.rarity === 'high') && r.win > RARITY_CAP.high &&
        getTacticalAssignTier(r.e.id) === 'common',
    );
    if (leaks.length > 0) {
        console.log(`🔴 高频强技被标 common（会大众乱发污染均势）: ${leaks.map(r => `${r.e.displayName}(${r.e.id}) ${(r.win * 100).toFixed(0)}%`).join(', ')}`);
    } else {
        console.log('✅ 所有高频/无条件强技均已限量（非 common），不会大众乱发');
    }
    // 分配层分布
    const dist: Record<string, number> = {};
    for (const e of TACTICAL_SKILL_ENTRIES_V1) {
        const t = getTacticalAssignTier(e.id) ?? '缺';
        dist[t] = (dist[t] ?? 0) + 1;
    }
    const TIER_ORDER: (TacticalAssignTier | '缺')[] = ['common', 'limited', 'ai_defensive', 'underdog', 'gamble', 'star_survival', '缺'];
    console.log('分配层分布: ' + TIER_ORDER.filter(t => dist[t]).map(t => `${TIER_LABEL[t as TacticalAssignTier] ?? t}=${dist[t]}`).join(' | '));
}

main();
