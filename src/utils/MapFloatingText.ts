/** 当前跟拍军团 id（战略技飘字只给跟拍军团显示；无跟拍时返回 null → 全部不飘） */
export function getFollowedArmyId(): string | null {
    return (window as any).game?.cameraFollowUI?.getFollowedArmyId?.() ?? null;
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
    // 战略技专属高级视觉：金石兵符（隶书/楷体 + 3D立体厚度 + 强溢光）
    el.style.fontFamily = "'LiSu', 'STXinwei', 'KaiTi', serif"; // 隶书/魏碑，区别于战术的细致宋体，更有大地图的雄浑感
    el.style.color = '#ffffff'; // 采用极致纯白/银白（区别于战术的暖白金），更冷峻犀利
    el.style.fontWeight = '900';
    el.style.fontSize = '20px'; // 隶书字面较小，放大到20px保证气场
    el.style.letterSpacing = '2px';
    // 3D 挤出立体特效：黑影做底层金属块，外加原本技能颜色（如翠绿/橙色）的高亮光晕
    el.style.textShadow = `
        0 1px 0 rgba(0,0,0,0.9),
        0 2px 0 rgba(0,0,0,0.8),
        0 3px 0 rgba(0,0,0,0.7),
        0 4px 6px rgba(0,0,0,0.9),
        0 0 12px ${color},
        0 0 20px ${color}
    `;
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
    // 大招专属高级视觉：金石印章（隶书/楷体 + 深层3D立体厚度 + 强溢光）
    el.style.fontFamily = "'LiSu', 'STXinwei', 'KaiTi', serif";
    el.style.color = '#ffffff'; // 极致纯白，区别于战术的暖白金
    el.style.fontWeight = '900';
    el.style.fontSize = '24px'; // 隶书字面较小，24px 醒目但不压画面
    el.style.letterSpacing = '3px';
    // 3D 挤出立体特效：4层黑影 + 技能色光晕
    el.style.textShadow = `
        0 1px 0 rgba(0,0,0,0.9),
        0 2px 0 rgba(0,0,0,0.8),
        0 3px 0 rgba(0,0,0,0.7),
        0 4px 8px rgba(0,0,0,0.9),
        0 0 10px ${color},
        0 0 22px ${color}
    `;
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
