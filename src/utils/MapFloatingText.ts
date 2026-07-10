/** 当前跟拍军团 id（战略技飘字只给跟拍军团显示；无跟拍时返回 null → 全部不飘） */
export function getFollowedArmyId(): string | null {
    return (window as any).game?.cameraFollowUI?.getFollowedArmyId?.() ?? null;
}

/**
 * 长驱深入专用：密集小城区域 3 秒内只飘一次，防连过多城叠字。
 * 其余技能（战后一次性 / 每城一次 / 满千一次）均有天然去重，不走此函数。
 */
const bypassLastAt = new Map<string, number>();
export function tryBypassPulse(armyId: string, lat: number, lng: number, color: string): void {
    const now = Date.now();
    if (now - (bypassLastAt.get(armyId) ?? 0) < 3000) return;
    bypassLastAt.set(armyId, now);
    spawnMapFloatingText(lat, lng, '长驱深入', color);
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
    el.style.top = `${point.y - 30}px`; // 军团头顶起飘
    el.style.color = color;
    el.style.fontWeight = '900'; // 加粗
    el.style.fontSize = '16px'; // 稍微加大
    el.style.letterSpacing = '1px';
    // 更立体的黑边 + 随字体颜色的柔和发光，增强在复杂地图背景上的可读性
    el.style.textShadow = `0 1.5px 2px black, 0 -1.5px 2px black, 1.5px 0 2px black, -1.5px 0 2px black, 0 0 8px ${color}`;
    el.style.pointerEvents = 'none';
    el.style.whiteSpace = 'nowrap';
    el.style.zIndex = '1000';
    
    container.appendChild(el);
    
    // 使用 Web Animations API 打造更细腻的“弹出 + 缓升 + 渐隐”飘字效果
    el.animate([
        { opacity: 0, transform: 'translate(-50%, 0) scale(0.5)' },
        { opacity: 1, transform: 'translate(-50%, -15px) scale(1.1)', offset: 0.15 },
        { opacity: 1, transform: 'translate(-50%, -20px) scale(1)', offset: 0.3 },
        { opacity: 1, transform: 'translate(-50%, -50px) scale(1)', offset: 0.8 },
        { opacity: 0, transform: 'translate(-50%, -60px) scale(0.9)' }
    ], {
        duration: 2500,
        easing: 'ease-out',
        fill: 'forwards'
    });
    
    // 动画结束后清理
    setTimeout(() => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }, 2600);
}

/** 
 * 大地图技能脉冲（闪卡级演出）：用于显示“所向披靡”等战役级大招，呈现类似战斗面板的大字闪烁脉冲效果
 */
export function spawnMapPulse(lat: number, lng: number, text: string, color: string): void {
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
    el.style.top = `${point.y - 50}px`; // 军团头顶稍微高一点，给大字留空间
    el.style.color = color;
    el.style.fontWeight = '900';
    el.style.fontSize = '36px'; // 大字闪卡
    el.style.letterSpacing = '4px';
    el.style.textShadow = '0 2px 4px black, 0 -2px 4px black, 2px 0 4px black, -2px 0 4px black, 0 0 10px ' + color; // 发光边缘
    el.style.pointerEvents = 'none';
    el.style.whiteSpace = 'nowrap';
    el.style.zIndex = '1000';
    
    container.appendChild(el);
    
    // 使用 Web Animations API 模拟战斗面板的 tactical-skill-pop 效果
    el.animate([
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.6)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1.08)', offset: 0.15 },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.85 },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(1.15)' }
    ], {
        duration: 1500,
        easing: 'ease-out',
        fill: 'forwards'
    });
    
    // 动画结束后清理
    setTimeout(() => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }, 1600);
}
