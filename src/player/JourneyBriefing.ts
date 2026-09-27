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
 * 切法：**文本里一句 = 一次 `speak()` = 一屏字幕**（不再把相邻短句并起来）；
 * 单句本身超过 `maxChars` 的，按逗号再切一刀（兜底，保证一屏放得下）。
 *
 * 🔴 [2026-09-26 主人报「行军播报更加对不上了」＋「一句一句的看，第一段有几句？」]
 *   原来这里把**相邻的短句合并**（`current.length + p.length <= maxChars` 就并成一句）——
 *   实测全片 65 段共 230 句，被并成 **193 次**，**35 个段是「几句话说成一口气」**：
 *   第一段 44 字就是「腓力二世遇刺…趁丧起事；」＋「公元前335年春…北上平乱。」两句并成 1 次念的。
 *   一句一屏这条已经被并没了，字幕与语音的「一句对一句」自然又对不上。已改为不合并。
 */
/**
 * 🔴 [2026-09-27 口径已改] **游戏里不再用它** —— 主人定「一路一句」，一条路整句一次 speak()、整句一屏
 *   （见 `PlayerQuestSystem` 的赶路播报与 `SubtitleBanner.show(..., singleScreen)`）。
 *   这个切句器只留给验收脚本做「一句几屏」的分析，别在游戏里调用。
 */
export function journeyBriefingSentences(text: string, maxChars = 60): string[] {
    const paragraphs = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const out: string[] = [];
    for (const para of paragraphs) {
        // 句末标点：。！？；……（含其后的收尾引号/括号）
        const sentences = para.match(/[^。！？；…]+[。！？；…]+[”’」』）)]?|[^。！？；…]+$/g) ?? [para];
        for (const raw of sentences) {
            const s = raw.trim();
            if (!s) continue;
            // 单句本身太长 → 按逗号再切（保证一屏一行放得下）；其余**一句就是一句**，不并
            const pieces = Array.from(s).length > maxChars ? splitByComma(s, maxChars) : [s];
            out.push(...pieces);
        }
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
