// 验证 2026-08-06「野战打完别立刻再追同一支」：
//   冷却 12s < 双将野战 30s，故冷却章必须由 IsInCombat 每帧续期到脱战为止。
// 跑真实节点 HoldForFieldContact / IsInCombat / HasTarget。
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_field_battle_cooldown.mts
import { IsInCombat, HoldForFieldContact } from '../src/ai/bt/LegionBehaviors';
import { GameConfig } from '../src/config/GameConfig';

const COOLDOWN = GameConfig.AI.FAILED_TARGET_COOLDOWN_MS;
console.log(`FAILED_TARGET_COOLDOWN_MS = ${COOLDOWN / 1000}s；双将野战约 30s（含援军最长 60s）\n`);

// 用可控时钟替换 performance.now
const realNow = performance.now.bind(performance);
let clock = 1_000_000;
(performance as any).now = () => clock;

const FOE = 'enemy_army_7';
let inCombat = false;

const ctx: any = {
  army: {
    id: 'my_army', name: '朔方军',
    getIsInCombat: () => inCombat,
    isIdle: () => true,
    getPosition: () => ({ lat: 0, lng: 0 }),
    getFactionId: () => 'me',
    stopMovement: () => {},
    setTargetCity: () => {},
  },
  strategicTargetCityId: 'city_B',
  strategicTargetArmyId: FOE,
  targetCityId: 'city_B',
  targetPosition: null,
  huntBlockedSinceMs: null,
  marchAnchorCityId: null,
  postBattleFoeArmyId: null,
  recentFailedTargets: new Map<string, number>(),
  moveFailureLogCooldown: new Map(),
  btLogThrottle: new Map(),
  nodeState: new Map(),
  cityManager: { getCity: (id: string) => (id === 'city_B' ? { id, name: 'B城', factionId: 'enemy', latitude: 1, longitude: 1 } : undefined) },
  legionManager: {
    getArmies: () => [{ id: FOE, name: '敌骑', isDestroyed: false, getTroops: () => 8000, getFactionId: () => 'enemy', getIsInCombat: () => inCombat, getPosition: () => ({ lat: 0, lng: 0 }) }],
  },
};

const cooldownLeft = () => {
  const at = ctx.recentFailedTargets.get(`army:${FOE}`);
  return at === undefined ? -1 : Math.max(0, COOLDOWN - (clock - at)) / 1000;
};
const onCooldown = () => cooldownLeft() > 0;

// ── t=0 追上，开战 ──
inCombat = true;
HoldForFieldContact.tick(ctx);
console.log(`t=0s   开战：挂起城=${ctx.strategicTargetCityId}  追击已清=${ctx.strategicTargetArmyId === null}  记下对手=${ctx.postBattleFoeArmyId}`);
console.log(`       冷却剩余 ${cooldownLeft().toFixed(0)}s`);

// ── 打 30 秒（每帧跑根节点第一位 IsInCombat）──
for (let t = 1; t <= 30; t++) {
  clock += 1000;
  IsInCombat.tick(ctx);
}
console.log(`t=30s  仗打完前一刻：冷却剩余 ${cooldownLeft().toFixed(0)}s → ${onCooldown() ? '✅ 仍在冷却（续期生效）' : '❌ 已过期，脱战就会再追'}`);

// ── 脱战 ──
inCombat = false;
clock += 1000;
IsInCombat.tick(ctx);
console.log(`t=31s  脱战：postBattleFoeArmyId=${ctx.postBattleFoeArmyId ?? 'null'}（应为 null，停止续期）  冷却剩余 ${cooldownLeft().toFixed(0)}s`);
console.log(`       → 此刻是否会再追同一支？ ${onCooldown() ? '否 ✅（先回去打 B 城）' : '会 ❌'}`);

// ── 冷却自然到期 ──
clock += COOLDOWN + 1000;
console.log(`t=${((clock - 1_000_000) / 1000).toFixed(0)}s  冷却到期：${onCooldown() ? '仍冷却 ❌' : '✅ 解禁，之后同一支敌军可再被追（不永久拉黑）'}`);

// ── 对照：不续期会怎样 ──
const stamp = 0;
console.log(`\n对照（若只在开战盖一次章）：t=30s 时冷却剩余 ${Math.max(0, COOLDOWN - 30000) / 1000}s → ${COOLDOWN - 30000 > stamp ? '仍有效' : '❌ 早已过期，脱战瞬间再追同一支'}`);

(performance as any).now = realNow;
