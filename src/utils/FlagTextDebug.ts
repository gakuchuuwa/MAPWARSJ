/**
 * FlagTextDebug - 旗帜文字渲染调试工具
 * 在浏览器控制台运行 window.__debugFlagText('chahar') 即可查看详细信息
 */
async function debugFlagText(factionId: string): Promise<void> {
    console.group(`🔍 旗帜文字调试: ${factionId}`);

    // 1. 检查 SANDBOX_DISPLAY_NAMES
    try {
        const { SANDBOX_DISPLAY_NAMES } = await import('../data/SandboxDisplayNames');
        const displayName = SANDBOX_DISPLAY_NAMES[factionId];
        console.log(`📋 SANDBOX_DISPLAY_NAMES['${factionId}'] =`, displayName);
        if (!displayName) {
            console.warn(`⚠ 未在 SandboxDisplayNames.ts 中找到 ${factionId} 的短名配置`);
        }
    } catch (e) {
        console.error('❌ 导入 SANDBOX_DISPLAY_NAMES 失败:', e);
    }

    // 2. 检查 factionFlagMap
    try {
        const { CityAssetManager } = await import('../core/CityAssetManager');
        const flagMapEntry = CityAssetManager.factionFlagMap[factionId];
        console.log(`📋 factionFlagMap['${factionId}'] =`, flagMapEntry);
        if (!flagMapEntry) {
            console.warn(`⚠ 未在 factionFlagMap 中找到 ${factionId} 的条目`);
        }

        // 3. 直接调用 getProcessedFlagText
        const startTime = performance.now();
        const textUrl = CityAssetManager.getProcessedFlagText(factionId);
        const elapsed = performance.now() - startTime;
        console.log(`📋 getProcessedFlagText('${factionId}') 耗时:`, elapsed.toFixed(2), 'ms');
        console.log(`📋 返回值:`, textUrl ? `data URL (${textUrl.length} 字符)` : 'null');
        if (textUrl) {
            console.log(`📋 前 100 字符:`, textUrl.substring(0, 100));
        }

        // 4. 检查 processedFlagCache
        const imgCacheKey = `dynamic_text_${factionId}`;
        const processedCache = (CityAssetManager as any).processedFlagCache;
        const hasCached = processedCache?.has?.(imgCacheKey);
        console.log(`📋 processedFlagCache.has('${imgCacheKey}'):`, hasCached);

        const lumCached = (CityAssetManager as any).flagLumCache?.get?.(factionId);
        console.log(`📋 flagLumCache.get('${factionId}'):`, lumCached);

        // 5. 检查旗帜是否加载
        const flagCached = processedCache?.has?.(factionId);
        console.log(`📋 旗帜图片已缓存:`, flagCached);
    } catch (e) {
        console.error('❌ 查询 CityAssetManager 失败:', e);
    }

    console.groupEnd();
}

// 挂载到全局（仅开发环境由 GameApp 动态 import 本模块）
(window as any).__debugFlagText = debugFlagText;
if (import.meta.env.DEV) {
    console.log('✅ 旗帜文字调试工具已加载 — 在控制台运行 await __debugFlagText("chahar") 查看诊断信息');
}
