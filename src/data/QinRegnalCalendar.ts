/**
 * 秦国纪年 ↔ 公元纪年（负数 = 公元前）
 * 依据项目主人提供的对照表（前250～前236）及《04秦朝军事史》等可考换算延伸。
 */

const REGNAL_EXPLICIT: Readonly<Record<number, string>> = {
    [-250]: '秦孝文王元年',
    [-249]: '秦庄襄王元年',
    [-248]: '秦庄襄王二年',
    [-247]: '秦庄襄王三年',
    [-246]: '秦王政元年',
    [-245]: '秦王政二年',
    [-244]: '秦王政三年',
    [-243]: '秦王政四年',
    [-242]: '秦王政五年',
    [-241]: '秦王政六年',
    [-240]: '秦王政七年',
    [-239]: '秦王政八年',
    [-238]: '秦王政九年',
    [-237]: '秦王政十年',
    [-236]: '秦王政十一年',
};

const CN_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const;

/** 1→元；2→二；11→十一；26→二十六 */
export function formatRegnalYearSuffix(n: number): string {
    if (n <= 0 || !Number.isFinite(n)) return '';
    if (n === 1) return '元';
    if (n < 10) return CN_DIGITS[n]!;
    if (n === 10) return '十';
    if (n < 20) return `十${CN_DIGITS[n - 10]}`;
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return ones === 0 ? `${CN_DIGITS[tens]}十` : `${CN_DIGITS[tens]}十${CN_DIGITS[ones]}`;
}

/** 公元前汉字纪年：前246年 */
export function formatBcYearChinese(year: number): string {
    if (year < 0) return `前${Math.abs(year)}年`;
    if (year === 0) return '公元元年';
    return `${year}年`;
}

/**
 * 秦国纪年；超出秦代范围（前250～前206）返回 null。
 */
export function getQinRegnalYear(year: number): string | null {
    const explicit = REGNAL_EXPLICIT[year];
    if (explicit) return explicit;

    if (year >= -246 && year <= -221) {
        const n = 247 + year;
        return `秦王政${formatRegnalYearSuffix(n)}年`;
    }
    if (year >= -220 && year <= -210) {
        const n = 247 + year;
        return `秦始皇${formatRegnalYearSuffix(n)}年`;
    }
    if (year >= -209 && year <= -206) {
        const n = year + 210;
        return `秦二世${formatRegnalYearSuffix(n)}年`;
    }
    return null;
}

/** HUD / 日志：前246年 · 秦王政元年 */
export function formatGameDateChinese(year: number): string {
    const bc = formatBcYearChinese(year);
    const regnal = getQinRegnalYear(year);
    return regnal ? `${bc} · ${regnal}` : bc;
}
