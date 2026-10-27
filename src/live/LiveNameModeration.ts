/**
 * 直播观众可编辑名称统一审核（玩家名，以及后续公侯势力名/军团名共用）。
 * 规则：限制字数（≤6字）、过滤控制符/网址/长串联系号、拦截敏感与辱骂恶意词，并支持主播一键否决动态拉黑。
 */

export const LIVE_NAME_MAX_LEN = 6;

const STATIC_BAD_PATTERNS: readonly RegExp[] = [
    /傻\s*逼|煞\s*笔|沙\s*币|傻\s*b|s\s*b\b/i,
    /操\s*你|草\s*泥\s*马|肏|日\s*你|妈\s*逼|你\s*妈|他\s*妈\s*的|t\s*m\s*d/i,
    /脑\s*残|智\s*障|弱\s*智|贱\s*人|婊\s*子|狗\s*日|杂\s*种|畜\s*生|去\s*死/i,
    /法\s*轮|六\s*四|天\s*安\s*门|台\s*独|港\s*独|藏\s*独|疆\s*独|支\s*那|纳\s*粹|希\s*特\s*勒/i,
    /赌\s*博|博\s*彩|外\s*挂|代\s*练|加\s*微|微\s*信|q\s*q\s*群|色\s*情|黄\s*片|裸\s*聊/i,
    /fuck|shit|bitch|cunt|nigger|faggot|hitler|nazi|porn|whore/i,
];

const dynamicBlockedCompact = new Set<string>();
const dynamicBlockedRaw = new Set<string>();

function compactForCheck(s: string): string {
    return s
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\s\p{P}\p{S}_]+/gu, '');
}

export function blockLiveName(raw: string): void {
    const trimmed = raw.normalize('NFKC').trim();
    if (!trimmed) return;
    dynamicBlockedRaw.add(trimmed.toLowerCase());
    const compact = compactForCheck(trimmed);
    if (compact) dynamicBlockedCompact.add(compact);
}

export function getBlockedLiveNames(): string[] {
    return [...dynamicBlockedRaw];
}

export function hydrateBlockedLiveNames(list: readonly string[] | undefined): void {
    dynamicBlockedRaw.clear();
    dynamicBlockedCompact.clear();
    if (!Array.isArray(list)) return;
    for (const item of list.slice(0, 500)) {
        if (typeof item === 'string') blockLiveName(item);
    }
}

export type LiveNameModerationResult =
    | { ok: true; name: string }
    | { ok: false; reason: string };

export function moderateLiveName(raw: string): LiveNameModerationResult {
    const cleaned = raw
        .normalize('NFKC')
        .replace(/\p{C}/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned) {
        return { ok: false, reason: '名字不能为空' };
    }
    if (/(?:https?:\/\/|www\.)\S+/i.test(cleaned) || /\S+\.(?:com|net|org|cn|io|me|gg|tv|top|xyz)\b/i.test(cleaned)) {
        return { ok: false, reason: '名字不能包含网址' };
    }
    if (/\d{5,}/.test(cleaned)) {
        return { ok: false, reason: '名字不能包含长串数字' };
    }

    const chars = Array.from(cleaned);
    if (chars.length > LIVE_NAME_MAX_LEN) {
        return { ok: false, reason: `名字最多 ${LIVE_NAME_MAX_LEN} 个字` };
    }
    if (!/[\p{L}\p{N}]/u.test(cleaned)) {
        return { ok: false, reason: '名字需包含汉字、字母或数字' };
    }

    const lower = cleaned.toLowerCase();
    const compact = compactForCheck(cleaned);
    if (dynamicBlockedRaw.has(lower) || (compact && dynamicBlockedCompact.has(compact))) {
        return { ok: false, reason: '该名字已被主播封禁' };
    }

    for (const re of STATIC_BAD_PATTERNS) {
        if (re.test(cleaned) || (compact && re.test(compact))) {
            return { ok: false, reason: '名字含违规词，未予修改' };
        }
    }

    return { ok: true, name: cleaned };
}
