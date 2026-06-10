/** 势力旗染色完成后：刷新军团画布旗缓存并触发 onFactionFlagReady 回调 */
export function notifyFactionFlagReady(
    factionId: string,
    callbacks: Map<string, Set<() => void>>
): void {
    void import('../map/legion/LegionFlagDrawer')
        .then(({ LegionFlagDrawer }) => LegionFlagDrawer.invalidateFaction(factionId))
        .catch(() => {});

    const listeners = callbacks.get(factionId);
    if (!listeners || listeners.size === 0) return;
    callbacks.delete(factionId);
    for (const cb of listeners) {
        try {
            cb();
        } catch (e) {
            console.error('[CityAssetManager] factionFlagReady callback failed', e);
        }
    }
}
