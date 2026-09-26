/** 赶路字幕按每秒约五字留出阅读时间，短段至少显示七秒。 */
export function journeyBriefingDuration(text: string): number {
    return Math.max(7000, Array.from(text.trim()).length * 200 + 1500);
}

/**
 * 🔴 [2026-09-26 主人「行军和播报对不上」] **旁白自己带锚点**：段落开头写 `【据点名】`，
 *   表示「军团走到这座据点附近才念这一段」（锚点由 `PlayerQuestSystem.scriptSegmentStarts` 认）。
 *   锚点是**给机器看的**，不念、不显示 —— 这里把它从正文里剥掉。
 */
export function stripBriefingAnchor(text: string): string {
    return text.replace(/^\s*【[^】]{1,12}】\s*/, '');
}

/** 取出这一段挂的锚点名（没有锚点返回 null） */
export function briefingAnchorOf(text: string): string | null {
    const m = text.match(/^\s*【([^】]{1,12})】/);
    return m ? m[1].trim() : null;
}

/**
 * 整篇旁白里的锚点（按段落顺序，只取第 2 段起的）。
 * ⚠️ 必须从**原文**上读：`journeyBriefingParagraphs` 会把锚点剥掉，
 *    拿剥过的文本再去找锚点永远找不到（第一次跑就是这么误报的）。
 */
export function briefingAnchors(text: string): string[] {
    return text.split(/\n\s*\n/).slice(1).map((p) => briefingAnchorOf(p)).filter(Boolean) as string[];
}

export function journeyBriefingParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).map(s => stripBriefingAnchor(s.trim())).filter(Boolean);
}

/**
 * 🔴 [2026-09-25 主人报障「字幕的显示和播报对不上」] **把一段旁白切成「一句一屏」**。
 *
 * 病灶：一段旁白（现在 100~250 字）原来是**整段**交给 `speak()` ——
 *   · 语音：由 TTS 实际朗读时长说了算（云健云合成 / Web Speech，逐句停顿都不一样）；
 *   · 字幕：`SubtitleBanner` 把整段按字数比例**用定时器自己翻屏**（`hold × 字数占比`）。
 *   两条时钟各走各的，段越长错得越远（实测 253 字那一段：第一屏要排 57 秒，语音 30 秒就读完了）。
 *
 * 解法：**一句一次 `speak()`** —— 字幕文本与语音文本就是**同一条字符串**，
 *   字幕随开口（onStart）亮、随念完（onDone）换下一句，不存在「猜时长」这一环。
 *   句子之间那点合成往返（约几百毫秒）正好当自然停顿。
 *
 * 切法：先按中文句末标点断句，再把过短的句子并到 `maxChars` 以内；
 * 单句本身超过 `maxChars` 的，按逗号再切一刀（兜底，保证一屏放得下）。
 */
export function journeyBriefingSentences(text: string, maxChars = 60): string[] {
    const paragraphs = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const out: string[] = [];
    for (const para of paragraphs) {
        // 句末标点：。！？；……（含其后的收尾引号/括号）
        const sentences = para.match(/[^。！？；…]+[。！？；…]+[”’」』）)]?|[^。！？；…]+$/g) ?? [para];
        let current = '';
        const flush = () => { if (current.trim()) out.push(current.trim()); current = ''; };
        for (const raw of sentences) {
            const s = raw.trim();
            if (!s) continue;
            // 单句太长 → 按逗号再切，保证一屏一行放得下
            const pieces = Array.from(s).length > maxChars ? splitByComma(s, maxChars) : [s];
            for (const p of pieces) {
                if (!current) { current = p; continue; }
                if (Array.from(current).length + Array.from(p).length <= maxChars) current += p;
                else { flush(); current = p; }
            }
        }
        flush();
    }
    return out.length ? out : [text.trim()];
}

/** 按逗号/顿号把超长单句切开，每片不超过 maxChars（切不动就原样返回） */
function splitByComma(sentence: string, maxChars: number): string[] {
    const parts = sentence.match(/[^，、]+[，、]?/g) ?? [sentence];
    const out: string[] = [];
    let current = '';
    for (const p of parts) {
        if (!current) { current = p; continue; }
        if (Array.from(current).length + Array.from(p).length <= maxChars) current += p;
        else { out.push(current); current = p; }
    }
    if (current) out.push(current);
    return out;
}
