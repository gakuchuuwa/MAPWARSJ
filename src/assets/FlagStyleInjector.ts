/**
 * 旗帜 CSS 注入器（.flag-faction-* / .flag-rebel-*）
 *
 * [PERF 2026-07-17 重写] 旧实现读写整个 <style> 的 textContent：719 条内嵌 dataURL 的规则
 * ≈ 数十 MB 字符串，每次更新 = 多 MB 正则 + 整表重新解析 + 全 DOM 样式重算。
 * boot-timing 实测：开局一次性灌 719 条产生单笔 21.6s 长任务；此后每染一面旗 200ms~2s，
 * 是「启动数分钟」的最终根因（旗帜像素工作本身仅 ~3ms/面）。
 *
 * 现实现走 CSSOM：每条规则只 insertRule 一次并缓存 CSSStyleRule 句柄，
 * 更新只改该 rule 的 background-image —— 浏览器做增量样式重算，不再整表重解析。
 * 对外 API 与旧版完全一致，调用方无需改动。
 */

let sheetCache: CSSStyleSheet | null = null;
const ruleBySelector = new Map<string, CSSStyleRule>();

function getSheet(): CSSStyleSheet | null {
    if (sheetCache) return sheetCache;
    let styleTag = document.getElementById('dynamic-flag-styles') as HTMLStyleElement | null;
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-flag-styles';
        document.head.appendChild(styleTag);
    }
    sheetCache = styleTag.sheet;
    return sheetCache;
}

/** 单条规则新建/更新（dataURL 为 base64，不含引号；路径 URL 仍做防御性转义） */
function setRule(selector: string, url: string): void {
    const cssUrl = `url('${url.replace(/'/g, "\\'")}')`;
    const existing = ruleBySelector.get(selector);
    if (existing) {
        existing.style.backgroundImage = cssUrl;
        return;
    }
    const sheet = getSheet();
    if (!sheet) return;
    const idx = sheet.insertRule(`${selector} { background-image: ${cssUrl}; }`, sheet.cssRules.length);
    ruleBySelector.set(selector, sheet.cssRules[idx] as CSSStyleRule);
}

/** 启动占位：按势力写入各自 .flag-faction-* 规则（六级旗形不同） */
export function appendBootPlaceholderFlagRulesByFaction(
    factionIdToUrl: ReadonlyMap<string, string> | Record<string, string>,
): void {
    const entries =
        factionIdToUrl instanceof Map
            ? factionIdToUrl.entries()
            : Object.entries(factionIdToUrl);
    for (const [factionId, url] of entries) {
        if (!factionId || factionId === 'panjun' || !url) continue;
        setRule(`.flag-faction-${factionId}`, url);
    }
}

/** @deprecated 单 URL 占位；请用 appendBootPlaceholderFlagRulesByFaction */
export function appendBootPlaceholderFlagRules(factionIds: string[], url: string): void {
    for (const factionId of factionIds) {
        if (!factionId || factionId === 'panjun') continue;
        setRule(`.flag-faction-${factionId}`, url);
    }
}

/** 写入/更新单条叛军旗号 CSS（index 为 processedRebelFlags 下标） */
export function setRebelFlagStyleRule(index: number, url: string): void {
    setRule(`.flag-rebel-${index}`, url);
}

/** 写入/更新单条势力旗号 CSS（占位→染色时必须能覆盖旧规则） */
export function setFactionFlagStyleRule(factionId: string, url: string): void {
    setRule(`.flag-faction-${factionId}`, url);
}
