/**
 * 战术技 v1 数据表审计：条数、系别分布、引擎就绪度
 * 运行：npm run tactical:audit
 */
import {
    TACTICAL_SKILL_ENTRIES_V1,
    type TacticalSkillEntry,
} from '../src/data/TacticalSkillCatalog';
import { auditTacticalSkillEngineReadiness } from '../src/combat/TacticalSkillResolver';

const SERIES_LABEL: Record<string, string> = {
    enhance: '强化系',
    fate: '命运系',
    troop: '兵力系',
    casualty: '战损系',
    counter: '对抗系',
    morale: '士气系',
};

function main(): void {
    const stats = auditTacticalSkillEngineReadiness();
    console.log('══ 战术技 v1 数据表审计 ══\n');
    console.log(`总条目: ${stats.total}（定稿 49）`);
    console.log(`引擎 ready: ${stats.ready} | hook(需接线): ${stats.hook} | new(新写): ${stats.newEffect}\n`);

    console.log('系别分布:');
    for (const [series, count] of Object.entries(stats.bySeries)) {
        console.log(`  ${SERIES_LABEL[series] ?? series}: ${count}`);
    }

    const byPhase = new Map<string, TacticalSkillEntry[]>();
    for (const e of TACTICAL_SKILL_ENTRIES_V1) {
        const list = byPhase.get(e.phase) ?? [];
        list.push(e);
        byPhase.set(e.phase, list);
    }
    console.log('\n结算时点:');
    for (const [phase, list] of byPhase) {
        console.log(`  ${phase}: ${list.length}`);
    }

    const mutex = TACTICAL_SKILL_ENTRIES_V1.filter((e) => e.mutexGroup);
    if (mutex.length > 0) {
        console.log('\n互斥组:');
        const groups = new Map<string, string[]>();
        for (const e of mutex) {
            const g = e.mutexGroup!;
            const arr = groups.get(g) ?? [];
            arr.push(`${e.index} ${e.displayName}`);
            groups.set(g, arr);
        }
        for (const [g, names] of groups) {
            console.log(`  ${g}: ${names.join(' / ')}`);
        }
    }

    const pending = TACTICAL_SKILL_ENTRIES_V1.filter((e) => e.engineStatus !== 'ready');
    if (pending.length > 0) {
        console.log('\n待实现 / 接线:');
        for (const e of pending) {
            console.log(`  #${e.index} ${e.displayName} [${e.engineStatus}] ${e.baseEffect}`);
        }
    }

    if (stats.total !== 49) {
        console.error(`\n❌ 条目数 ${stats.total} ≠ 49`);
        process.exit(1);
    }
    console.log('\n✅ 数据表结构校验通过');
}

main();
