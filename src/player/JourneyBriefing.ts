/** 赶路字幕按每秒约五字留出阅读时间，短段至少显示七秒。 */
export function journeyBriefingDuration(text: string): number {
    return Math.max(7000, Array.from(text.trim()).length * 200 + 1500);
}

export function journeyBriefingParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
}
