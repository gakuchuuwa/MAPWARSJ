/**
 * 普将三格战术技去模板化：收回 limited 专技、摊薄高频 common 撞衫
 * 运行：npx tsx tools/diversify-ordinary-slots.ts [--dry-run|--write]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    TACTICAL_SKILL_ENTRIES_V1,
    TACTICAL_ASSIGN_TIER,
    getTacticalTriClass,
    type TacticalSkillEntry,
    type TacticalTriClass,
} from '../src/data/TacticalSkillCatalog';
import { GENERAL_PROFILES, type GeneralProfile } from '../src/data/GeneralSkills';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CAP = 10;
const DRY = !process.argv.includes('--write');

function getBatchTriClass(entry: TacticalSkillEntry): TacticalTriClass {
    const UNDERDOG = new Set([
        'ratio_underdog', 'self_troops_below_enemy_pct', 'side_comeback', 'lose_as_underdog', 'battle_siege_defender',
    ]);
    const VARIANCE = new Set(['luck_variance_self', 'luck_variance_enemy', 'luck_lock_self', 'recompute_comeback']);
    if (UNDERDOG.has(entry.condition)) return 'disadvantage';
    if (VARIANCE.has(entry.baseEffect)) return 'disadvantage';
    return getTacticalTriClass(entry);
}

const byId = new Map<string, TacticalSkillEntry>();
for (const e of TACTICAL_SKILL_ENTRIES_V1) byId.set(e.id, e);

const NON_COMMON_TIER = new Set(['limited', 'ai_defensive', 'underdog', 'gamble', 'star_survival']);

type SlotField = 'advantageSkillId' | 'balanceSkillId' | 'disadvantageSkillId';
const SLOTS: Array<[SlotField, TacticalTriClass]> = [
    ['advantageSkillId', 'advantage'],
    ['balanceSkillId', 'balance'],
    ['disadvantageSkillId', 'disadvantage'],
];

function isCommonPool(id: string): boolean {
    return TACTICAL_ASSIGN_TIER[id] === 'common';
}

function poolFor(tri: TacticalTriClass, mode: 'common' | 'wide'): string[] {
    const ok = (id: string) => {
        const t = TACTICAL_ASSIGN_TIER[id];
        if (!t) return false;
        if (mode === 'common') return t === 'common';
        return t === 'common' || t === 'ai_defensive' || t === 'underdog';
    };
    return TACTICAL_SKILL_ENTRIES_V1
        .filter((e) => ok(e.id) && e.engineStatus === 'ready' && getBatchTriClass(e) === tri)
        .map((e) => e.id)
        .sort((a, b) => a.localeCompare(b));
}

function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
}

function pickRoundRobin(
    tri: TacticalTriClass,
    pool: string[],
    taken: Set<string>,
    cursor: Record<TacticalTriClass, number>,
): string | null {
    const n = pool.length;
    if (n === 0) return null;
    const start = cursor[tri];
    for (let i = 0; i < n; i++) {
        const id = pool[(start + i) % n];
        if (!taken.has(id)) {
            cursor[tri] = (start + i + 1) % n;
            return id;
        }
    }
    return null;
}

type Change = { gid: string; field: SlotField; from: string; to: string; reason: string };

function main(): void {
    const work = JSON.parse(JSON.stringify(GENERAL_PROFILES)) as typeof GENERAL_PROFILES;
    const usage = new Map<string, number>();
    for (const p of Object.values(work)) {
        if (p.tier !== 'ordinary') continue;
        for (const [f] of SLOTS) {
            const id = p[f];
            if (id) usage.set(id, (usage.get(id) ?? 0) + 1);
        }
    }

    const pools = {
        advantage: poolFor('advantage', 'common'),
        balance: poolFor('balance', 'common'),
        disadvantage: poolFor('disadvantage', 'common'),
    };
    const widePools = {
        advantage: poolFor('advantage', 'wide'),
        balance: poolFor('balance', 'wide'),
        disadvantage: poolFor('disadvantage', 'wide'),
    };
    console.log(`common池: 优${pools.advantage.length} 均${pools.balance.length} 劣${pools.disadvantage.length}`);
    console.log(`wide池:  优${widePools.advantage.length} 均${widePools.balance.length} 劣${widePools.disadvantage.length}`);

    const changes: Change[] = [];
    const rrCursor: Record<TacticalTriClass, number> = { advantage: 0, balance: 0, disadvantage: 0 };

    // ── 阶段 A：收回他人 limited/专档技 + 三格类别错挂（batch 口径）──
    for (const [gid, p] of Object.entries(work)) {
        if (p.tier !== 'ordinary') continue;
        const taken = new Set(SLOTS.map(([f]) => p[f]).filter(Boolean) as string[]);
        for (const [field, tri] of SLOTS) {
            const skillId = p[field];
            if (!skillId) continue;
            const entry = byId.get(skillId);
            if (!entry) continue;
            const tier = TACTICAL_ASSIGN_TIER[skillId];
            const wrongTier =
                p.aptitude !== 'leverage' && getBatchTriClass(entry) !== tri;
            const stolenLimited =
                tier && NON_COMMON_TIER.has(tier) && p.tacticalSkillId !== skillId;
            const stolenAiDef =
                tier === 'ai_defensive' && p.tacticalSkillId !== skillId;
            if (!wrongTier && !stolenLimited && !stolenAiDef) continue;

            const next = pickRoundRobin(tri, pools[tri], taken, rrCursor);
            if (!next || next === skillId) continue;
            const reason = stolenLimited || stolenAiDef ? 'limited专技回收' : '三格类别纠偏';
            changes.push({ gid, field, from: skillId, to: next, reason });
            usage.set(skillId, (usage.get(skillId) ?? 1) - 1);
            usage.set(next, (usage.get(next) ?? 0) + 1);
            taken.delete(skillId);
            taken.add(next);
            p[field] = next;
        }
    }

    // ── 阶段 B：迭代压顶，ordinary 单技频次 ≤ CAP ──
    for (let round = 0; round < 50; round++) {
        let moved = 0;
        const snap: Array<{ gid: string; field: SlotField; skillId: string; tri: TacticalTriClass }> = [];
        for (const [gid, p] of Object.entries(work)) {
            if (p.tier !== 'ordinary') continue;
            for (const [field, tri] of SLOTS) {
                const skillId = p[field];
                if (skillId) snap.push({ gid, field, skillId, tri });
            }
        }
        const bySkill = new Map<string, typeof snap>();
        for (const a of snap) {
            const list = bySkill.get(a.skillId) ?? [];
            list.push(a);
            bySkill.set(a.skillId, list);
        }

        for (const [skillId, list] of bySkill) {
            if (!isCommonPool(skillId)) continue;
            const excess = list.length - CAP;
            if (excess <= 0) continue;
            const victim = [...list].sort((a, b) => a.gid.localeCompare(b.gid))[0];
            const p = work[victim.gid];
            const taken = new Set(SLOTS.map(([f]) => p[f]).filter(Boolean) as string[]);
            taken.delete(victim.skillId);
            const cands = widePools[victim.tri]
                .filter((id) => !taken.has(id) && id !== skillId)
                .map((id) => ({ id, u: usage.get(id) ?? 0 }))
                .sort((a, b) => a.u - b.u || a.id.localeCompare(b.id));
            const next = cands[0]?.id;
            if (!next) continue;
            changes.push({ gid: victim.gid, field: victim.field, from: victim.skillId, to: next, reason: `高频撞衫>${CAP}` });
            usage.set(victim.skillId, (usage.get(victim.skillId) ?? 1) - 1);
            usage.set(next, (usage.get(next) ?? 0) + 1);
            p[victim.field] = next;
            moved++;
        }
        if (moved === 0) break;
    }

    console.log(`══ 普将三格去模板化 ${DRY ? '(dry-run)' : '(write)'} ══\n`);
    console.log(`替换条数: ${changes.length}`);
    const byReason = new Map<string, number>();
    for (const c of changes) byReason.set(c.reason, (byReason.get(c.reason) ?? 0) + 1);
    for (const [r, n] of byReason) console.log(`  ${r}: ${n}`);

    const ordUsage = new Map<string, number>();
    for (const p of Object.values(work)) {
        if (p.tier !== 'ordinary') continue;
        for (const [f] of SLOTS) {
            const id = p[f];
            if (id) ordUsage.set(id, (ordUsage.get(id) ?? 0) + 1);
        }
    }
    console.log('\n替换后 ordinary Top12:');
    for (const [id, n] of [...ordUsage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
        console.log(`  ${id} ${byId.get(id)?.displayName ?? '?'} ×${n}`);
    }

    let bad = 0;
    for (const [gid, p] of Object.entries(work)) {
        if (p.tier !== 'ordinary' || p.aptitude === 'leverage') continue;
        for (const [field, tri] of SLOTS) {
            const id = p[field];
            if (!id) continue;
            const e = byId.get(id);
            if (e && getBatchTriClass(e) !== tri) {
                bad++;
                if (bad <= 8) console.error(`❌ ${gid} ${field}=${id} batch=${getBatchTriClass(e)} need=${tri}`);
            }
        }
    }
    if (bad > 0) {
        console.error(`❌ batch 三格违规 ${bad} 条（含改前存量，写盘前须手修）`);
        process.exit(1);
    }
    console.log('\n✅ batch-manager 口径三格合规');

    if (!DRY && changes.length > 0) {
        const gsPath = path.resolve(__dirname, '../src/data/general-skills/profiles.ts'); // [2026-07-13 拆分] 档案在 profiles.ts，勿写转发壳
        let text = fs.readFileSync(gsPath, 'utf-8');
        for (const c of changes) {
            const re = new RegExp(
                `(${c.gid}:\\s*\\{[^}]*${c.field}:\\s*)'${c.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`,
            );
            const next = text.replace(re, `$1'${c.to}'`);
            if (next === text) {
                console.error(`❌ 未命中: ${c.gid} ${c.field} ${c.from}→${c.to}`);
                process.exit(1);
            }
            text = next;
        }
        fs.writeFileSync(gsPath, text, 'utf-8');
        console.log(`\n✅ 已写入 ${changes.length} 处`);
    }
}

main();
