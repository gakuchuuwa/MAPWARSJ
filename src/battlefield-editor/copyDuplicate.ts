/**
 * copyDuplicate.ts —— 「同一场里两处文案说的是同一件事」的唯一尺子（2026-10-02 立）。
 *
 * 🔴 由来（主人审第 59 路／第 18 场）：
 *   第 59 路（白沙瓦 ➜ 奥诺斯岩）写「相传赫拉克勒斯都攻不下这处绝壁」，
 *   紧接着第 18 场的开战旁白又写「号称连大力神赫拉克勒斯都未能攻克的奥诺斯岩天险」——
 *   同一句招牌话隔几秒念了两遍。主人原话：「播报内容有的地方重复了，请检查。」
 *
 * 口径：**赶路播报管「为什么要去」、开战旁白管「这仗怎么打」、战役说明管「战局始末」**，
 *   三处各司其职；**同一件「事」（战术细节、评价、出处典故）不许说两遍**。
 *   ⚠️ **只点名不算重复** —— 「格拉尼库斯河」「哈利卡纳苏斯」「阿里奥巴赞斯」「北岸盖塔人」
 *   这类地名／人名／势力名／敌方位置的复述，是中文叙事不可避免的，全部放行（血训 23：中文没有词边界，
 *   子串会咬人；也绝不许为了过检查去改历史文案）。
 *
 * 判据：两段归一去标点后，找长度 ≥ 6 的公共子串（极大者），**再剥掉地名／人名／势力名／通名与位置词**，
 *   剩下的实义字数 ≥ 4 才算「内容重复」。尺子自校见 `scratch/_check_copy_duplicate.mts` 头部（正例反例各验）。
 */
import { BATTLEFIELDS } from '../data/Battlefields';
import { CITIES_V2 } from '../data/cities_v2';
import { FACTIONS } from '../data/factions';
import { FACTION_GENERALS } from '../data/FactionGenerals';
import { stripBriefingAnchor } from '../player/JourneyBriefing';

/** 归一到「只留实义字」：剥掉段首【站名】锚点、空白、标点与拉丁数字 */
export function normalizeCopy(text: string): string {
    return stripBriefingAnchor(String(text ?? ''))
        .replace(/\s+/g, '')
        .replace(/[，。；：、！？—…（）()【】《》「」·"'0-9a-zA-Z]/g, '');
}

/**
 * 「只是点名」的词表：地名／战场名／势力名／武将名／通名职务词／位置词。
 * 命中串里剥掉这些以后还剩几个实义字，才是真正重复的「内容字数」。
 */
let _nameTokens: string[] | null = null;
function nameTokens(): string[] {
    if (_nameTokens) return _nameTokens;
    const s = new Set<string>();
    for (const c of CITIES_V2 as any[]) if (c?.name && String(c.name).length >= 2) s.add(String(c.name));
    // ⚔ 战场名也算地名（场13 的「波斯门」是战场节点，不在 cities_v2 里）
    for (const b of BATTLEFIELDS as any[]) if (b?.name && String(b.name).length >= 2) s.add(String(b.name));
    for (const f of FACTIONS as any[]) if (f?.name && String(f.name).length >= 2) s.add(String(f.name));
    // 🔴 名册字段是 `generalName`（不是 `name`）—— 第一版写成 `g.name` 全落了空，
    //    于是「阿里奥巴赞斯」被误判成内容重复（血训 14：「尺子本身是坏的」）。
    for (const v of Object.values(FACTION_GENERALS as any)) {
        for (const g of Array.isArray(v) ? v : [v]) {
            const n = String((g as any)?.generalName ?? (g as any)?.name ?? '');
            if (n.length >= 2) s.add(n);
        }
    }
    // 通名／职务词与位置词：不是「事情」
    for (const w of [
        '总督', '国王', '守将', '主帅', '主将', '将军', '大帝',
        '山脉', '山', '河', '谷', '隘口', '海峡', '海岛', '岛', '城', '湖', '海', '绿洲', '平原', '沙漠', '战场',
        '大军', '守军', '残部', '北岸', '南岸', '两岸', '东岸', '西岸', '对岸', '隔河', '河心', '孤岛',
    ]) s.add(w);
    _nameTokens = [...s].sort((a, b) => b.length - a.length);
    return _nameTokens;
}

/** 命中串里剥掉名字与位置词后，还剩几个实义字 */
export function contentCharCount(run: string): number {
    let s = run;
    for (const t of nameTokens()) s = s.split(t).join('');
    return s.length;
}

const MIN_RUN = 6;
const MIN_CONTENT = 4;

/** 两段的公共子串（长度 ≥ MIN_RUN 的极大者） */
function commonRuns(a: string, b: string): string[] {
    const out: string[] = [];
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            let k = 0;
            while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) k++;
            if (k >= MIN_RUN) {
                const s = a.slice(i, i + k);
                const extendable = i > 0 && j > 0 && a[i - 1] === b[j - 1];
                if (!extendable) out.push(s);
                i += k - 1;
                break;
            }
        }
    }
    const uniq = [...new Set(out)];
    return uniq.filter((s) => !uniq.some((o) => o !== s && o.includes(s)));
}

export interface DuplicateHit {
    /** 是哪两处在重复（如「赶路播报 ↔ 战役说明」） */
    label: string;
    /** 重复的原文串 */
    run: string;
    /** 剥掉地名／人名／位置词后剩下的实义字数 */
    contentChars: number;
}

/**
 * 逐对检查「内容重复」。
 * @param pairs `[label, 文本A, 文本B]`
 */
export function findDuplicateContent(pairs: ReadonlyArray<readonly [string, string, string]>): DuplicateHit[] {
    const hits: DuplicateHit[] = [];
    for (const [label, A, B] of pairs) {
        if (!A || !B) continue;
        for (const run of commonRuns(normalizeCopy(A), normalizeCopy(B))) {
            const contentChars = contentCharCount(run);
            if (contentChars >= MIN_CONTENT) hits.push({ label, run, contentChars });
        }
    }
    return hits;
}
