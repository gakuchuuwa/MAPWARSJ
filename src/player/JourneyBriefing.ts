/** 赶路字幕按每秒约五字留出阅读时间，短段至少显示七秒。 */
export function journeyBriefingDuration(text: string): number {
    return Math.max(7000, Array.from(text.trim()).length * 200 + 1500);
}

/**
 * 战役解说按段落切分：兼容单换行与多换行，
 * 保证每段约 60~120 字独立流式展示，避免长文堆砌成巨大黑块遮挡地图。
 */
export function journeyBriefingParagraphs(text: string): string[] {
    return text.split(/\n+/).map(s => s.trim()).filter(Boolean);
}
