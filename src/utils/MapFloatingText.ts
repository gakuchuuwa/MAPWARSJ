/** 当前跟拍军团 id（战略技飘字只给跟拍军团显示；无跟拍时返回 null → 全部不飘） */
export function getFollowedArmyId(): string | null {
    return (window as any).game?.cameraFollowUI?.getFollowedArmyId?.() ?? null;
}

/** 键控节流：同一 key（军团|技名）冷却时间内只飘一次，防连环战/密集触发短时间重复 */
const lastPulseAt = new Map<string, number>();
export function spawnSkillWordPulse(
    key: string, lat: number, lng: number, word: string, color: string, cooldownMs = 8000,
): void {
    const now = Date.now();
    if (now - (lastPulseAt.get(key) ?? 0) < cooldownMs) return;
    lastPulseAt.set(key, now);
    spawnMapFloatingText(lat, lng, word, color);
}

export function spawnMapFloatingText(lat: number, lng: number, text: string, color: string): void {
    const map = (window as any).game?.map?.getLeafletMap?.();
    if (!map) return;
    
    // 只有在镜头范围内才飘，零干扰
    const bounds = map.getBounds();
    if (!bounds || !bounds.contains([lat, lng])) {
        return;
    }

    // 挂载到 leaflet 的 popupPane 层保证层级足够高
    const container = map.getPanes().popupPane;
    if (!container) return;
    
    const point = map.latLngToLayerPoint([lat, lng]);
    
    const el = document.createElement('div');
    el.innerText = text;
    el.style.position = 'absolute';
    el.style.left = `${point.x}px`;
    el.style.top = `${point.y - 20}px`; // 起点稍微偏上
    el.style.color = color;
    el.style.fontWeight = 'bold';
    el.style.fontSize = '14px';
    el.style.textShadow = '0 1px 2px black, 0 -1px 2px black, 1px 0 2px black, -1px 0 2px black';
    el.style.pointerEvents = 'none';
    el.style.whiteSpace = 'nowrap';
    el.style.transition = 'all 2s ease-out';
    el.style.transform = 'translate(-50%, 0)';
    el.style.zIndex = '1000';
    
    container.appendChild(el);
    
    // 下一帧触发动画
    requestAnimationFrame(() => {
        el.style.transform = 'translate(-50%, -40px)'; // 向上飘动
        el.style.opacity = '0';
    });
    
    // 动画结束后清理
    setTimeout(() => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }, 2000);
}
