/** 启动占位：按势力写入各自 .flag-faction-* 规则（六级旗形不同） */
export function appendBootPlaceholderFlagRulesByFaction(
    factionIdToUrl: ReadonlyMap<string, string> | Record<string, string>,
): void {
    let styleTag = document.getElementById('dynamic-flag-styles') as HTMLStyleElement | null;
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-flag-styles';
        document.head.appendChild(styleTag);
    }
    const fragment = document.createDocumentFragment();
    const entries =
        factionIdToUrl instanceof Map
            ? factionIdToUrl.entries()
            : Object.entries(factionIdToUrl);
    for (const [factionId, url] of entries) {
        if (!factionId || factionId === 'panjun' || !url) continue;
        const escapedUrl = url.replace(/'/g, "\\'");
        fragment.appendChild(
            document.createTextNode(
                `.flag-faction-${factionId} { background-image: url('${escapedUrl}'); }\n`,
            ),
        );
    }
    if (fragment.childNodes.length > 0) {
        styleTag.appendChild(fragment);
    }
}

/** @deprecated 单 URL 占位；请用 appendBootPlaceholderFlagRulesByFaction */
export function appendBootPlaceholderFlagRules(factionIds: string[], url: string): void {
    let styleTag = document.getElementById('dynamic-flag-styles') as HTMLStyleElement | null;
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-flag-styles';
        document.head.appendChild(styleTag);
    }
    const escapedUrl = url.replace(/'/g, "\\'");
    const fragment = document.createDocumentFragment();
    for (const factionId of factionIds) {
        if (!factionId || factionId === 'panjun') continue;
        fragment.appendChild(
            document.createTextNode(
                `.flag-faction-${factionId} { background-image: url('${escapedUrl}'); }\n`,
            ),
        );
    }
    if (fragment.childNodes.length > 0) {
        styleTag.appendChild(fragment);
    }
}

/** 写入/更新单条叛军旗号 CSS（index 为 processedRebelFlags 下标） */
export function setRebelFlagStyleRule(index: number, url: string): void {
    let styleTag = document.getElementById('dynamic-flag-styles') as HTMLStyleElement | null;
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-flag-styles';
        document.head.appendChild(styleTag);
    }

    const selector = `.flag-rebel-${index}`;
    const escapedUrl = url.replace(/'/g, "\\'");
    const rule = `${selector} { background-image: url('${escapedUrl}'); }\n`;
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${escaped}\\s*\\{[^}]*\\}\\s*`, 'g');
    const body = styleTag.textContent ?? '';
    if (re.test(body)) {
        styleTag.textContent = body.replace(re, rule);
    } else {
        styleTag.appendChild(document.createTextNode(rule));
    }
}

/** 写入/更新单条势力旗号 CSS（占位→染色时必须能覆盖旧规则） */
export function setFactionFlagStyleRule(factionId: string, url: string): void {
    let styleTag = document.getElementById('dynamic-flag-styles') as HTMLStyleElement | null;
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-flag-styles';
        document.head.appendChild(styleTag);
    }

    const selector = `.flag-faction-${factionId}`;
    const rule = `${selector} { background-image: url('${url}'); }\n`;
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${escaped}\\s*\\{[^}]*\\}\\s*`, 'g');
    const body = styleTag.textContent ?? '';
    if (re.test(body)) {
        styleTag.textContent = body.replace(re, rule);
    } else {
        styleTag.appendChild(document.createTextNode(rule));
    }
}
