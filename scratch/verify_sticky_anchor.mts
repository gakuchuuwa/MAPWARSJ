// 验证 2026-08-06「推进锚点迟滞」：压掉两座己方城距离相近时的锚点名次抖动，
// 但不得挡住真正的推进（刚打下的城 ≈0km 必须顶掉旧锚点）。
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_sticky_anchor.mts
import { resolveStickyAnchor } from '../src/ai/bt/LegionBehaviors';

const cities: Record<string, { id: string; factionId: string }> = {
  A_old: { id: 'A_old', factionId: 'me' },   // 旧锚点：出发方向的前线城
  E_other: { id: 'E_other', factionId: 'me' }, // 另一条战线的己方飞地
  N_new: { id: 'N_new', factionId: 'me' },   // 本军刚打下的城
  A_lost: { id: 'A_lost', factionId: 'enemy' }, // 旧锚点易主
};

const mkCtx = (prev: string | null): any => ({
  marchAnchorCityId: prev,
  cityManager: { getCity: (id: string) => cities[id] },
});

const run = (label: string, prev: string | null, candidate: string, dists: [string, number][], expect: string) => {
  const ctx = mkCtx(prev);
  const got = resolveStickyAnchor(ctx, candidate, 'me', new Map(dists));
  console.log(`${got === expect ? '✅' : '❌'} ${label}\n     旧=${prev ?? '(无)'} 候选=${candidate} → 采用 ${got}（期望 ${expect}）`);
};

console.log('===== 推进锚点迟滞 =====');

run('首次选锚点：无旧值，直接采用候选',
  null, 'A_old', [['A_old', 12]], 'A_old');

run('名次抖动：候选只近一点点（100→95km）→ 留旧锚点，方向池不翻',
  'A_old', 'E_other', [['A_old', 100], ['E_other', 95]], 'A_old');

run('真推进：刚打下的城 0km → 顶掉旧锚点',
  'A_old', 'N_new', [['A_old', 100], ['N_new', 0]], 'N_new');

run('明显更近（100→70km，≤80%）→ 换',
  'A_old', 'E_other', [['A_old', 100], ['E_other', 70]], 'E_other');

run('临界 80km = 100×0.8 → 换（含等号）',
  'A_old', 'E_other', [['A_old', 100], ['E_other', 80]], 'E_other');

run('临界 81km → 不换',
  'A_old', 'E_other', [['A_old', 100], ['E_other', 81]], 'A_old');

run('旧锚点易主 → 无条件换',
  'A_lost', 'E_other', [['A_lost', 10], ['E_other', 999]], 'E_other');

run('旧锚点路网不可达（断路/隔海）→ 无条件换',
  'A_old', 'E_other', [['E_other', 999]], 'E_other');

run('候选不可达但旧锚点还在 → 留旧锚点',
  'A_old', 'E_other', [['A_old', 100]], 'A_old');

run('军团站在旧锚点上（0km）→ 留旧锚点，不被任何候选顶掉',
  'A_old', 'E_other', [['A_old', 0], ['E_other', 50]], 'A_old');

// 无路网表 → 退回候选（保留旧行为）
{
  const ctx = mkCtx('A_old');
  const got = resolveStickyAnchor(ctx, 'E_other', 'me', undefined);
  console.log(`${got === 'E_other' ? '✅' : '❌'} 无路网表 → 退回候选（不做迟滞）\n     → 采用 ${got}（期望 E_other）`);
}
