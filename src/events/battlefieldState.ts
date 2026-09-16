/**
 * 战场显示状态（全局单例）。
 *
 * 🔴 [2026-09-12 主人定死]「你知道什么是战场吗，打完了才叫战场，没打的不叫战场」——
 *   战场（`src/data/Battlefields.ts` 里的 `bf_*`，**不是据点**）平时**只显示地名**，
 *   **该场战斗结束**（打完了）才显示**战场形态**（拒马/尸体/骨骸…）。没打的一律不显示形态。
 *
 * 写入：`HistoricalEventManager`（战斗结束时按剧本 `location` 找到本场战场并标记）。
 * 读取：`src/map/BattlefieldLayer.ts`（未打完 → 只画地名；打完 → 画形态）。
 *
 * ⚠️ 历史教训：本模块原先存的是「`battlefield: true` 的**据点 id**」，
 *    因为那会儿战场还混在 `cities_v2` 里。战场独立成 `bf_*` 之后，
 *    这里存的是**战场 id**，与据点再无关系。
 */

/** 已打完、允许显示形态的战场 id */
const foughtBattlefieldIds = new Set<string>();

/** 打完通知（图层订阅后重绘） */
const listeners = new Set<(id: string) => void>();

/** 标记某战场「战斗已结束」→ 允许显示形态 */
export function markBattlefieldFought(battlefieldId: string): void {
    const isNew = !foughtBattlefieldIds.has(battlefieldId);
    foughtBattlefieldIds.add(battlefieldId);
    if (isNew) {
        for (const cb of listeners) cb(battlefieldId);
    }
}

/** 某战场是否已打完（打完才显示形态） */
export function isBattlefieldFought(battlefieldId: string): boolean {
    return foughtBattlefieldIds.has(battlefieldId);
}

/** 订阅「战场打完」（返回退订函数） */
export function onBattlefieldFought(cb: (battlefieldId: string) => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

/** 仅供测试/重开一局：清空 */
export function resetBattlefieldState(): void {
    foughtBattlefieldIds.clear();
}
