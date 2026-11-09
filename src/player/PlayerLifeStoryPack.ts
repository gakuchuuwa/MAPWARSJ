/**
 * 一生故事资料包（视频分享用）。
 *
 * 🔴 [2026-11-09 主人定「分两步：一步是直播，一步是视频分享」「资料包要写清楚时间，这样我才知道是哪场视频的直播」]
 *    把一生履历导出成一份 Markdown：主角概况 + 按时间排的每件事 + 一段给 AI 写故事的提示词。
 *    每条都写**现实日期时间（本机时间，精确到秒）**和**当时连着的 YouTube 直播**，
 *    主人拿 YouTube 后台里那场直播的开播时间一减，就是录像里的第几分第几秒。
 *    旁白不在游戏里念，剪视频时用这份资料让 AI 写文案、再离线配音。
 */
import { formatBcYearChinese } from '../data/QinRegnalCalendar';
import { cleanLifeText, type LifeEvent, type PlayerLifeLog } from './PlayerLifeLog';

const SEASON_NAMES = ['春', '夏', '秋', '冬'] as const;

function pad(n: number): string { return n < 10 ? `0${n}` : String(n); }

/** 本机时间 YYYY-MM-DD HH:mm:ss */
export function formatRealTime(ms: number): string {
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function gameTime(e: LifeEvent): string {
    return `${formatBcYearChinese(e.year)}${SEASON_NAMES[e.season] ?? ''}`;
}

/** 直播网址或编号 → 可点开的网址 */
function videoUrl(v: string): string {
    if (/^https?:\/\//i.test(v)) return v;
    return `https://www.youtube.com/watch?v=${v}`;
}

function cell(text: string): string {
    return text.replace(/\|/g, '｜').replace(/\r?\n/g, ' ');
}

export interface StoryPackHero {
    name: string;
    rank: string;
    peakRank: string;
}

export function buildLifeStoryPack(log: PlayerLifeLog, hero: StoryPackHero, exportedAtMs = Date.now()): string {
    const events = log.getEvents();
    const t = log.getBattleTotals();
    const patron = log.getPatron();
    const rival = log.getRival();
    const first = events[0];
    const last = events[events.length - 1];

    // 按直播分场：同一个视频连续的一段算一场
    const sessions: { video: string; from: number; to: number; count: number }[] = [];
    const sessionOf: number[] = [];
    for (const e of events) {
        const v = e.video ?? '';
        const cur = sessions[sessions.length - 1];
        if (cur && cur.video === v) {
            cur.to = e.realMs;
            cur.count++;
        } else {
            sessions.push({ video: v, from: e.realMs, to: e.realMs, count: 1 });
        }
        sessionOf.push(sessions.length);
    }

    const lines: string[] = [];
    lines.push(`# 一生资料包：${hero.name}`);
    lines.push('');
    lines.push(`- 导出时间：${formatRealTime(exportedAtMs)}（本机时间）`);
    if (first && last) {
        lines.push(`- 这一生的记录：${formatRealTime(first.realMs)} 至 ${formatRealTime(last.realMs)}（本机时间），共 ${events.length} 条`);
        lines.push(`- 游戏里：${gameTime(first)} ${first.age} 岁起家，到 ${gameTime(last)} ${last.age} 岁`);
    }
    lines.push(`- 现任官职：${hero.rank}；最高资历：${hero.peakRank}`);
    lines.push(`- 战绩：亲身上阵 ${t.battles} 场，胜 ${t.wins}，败 ${t.losses}，斩敌 ${t.killed}`);
    if (patron) lines.push(`- 恩主：${patron.name}（随他出战 ${patron.battles} 场）`);
    if (rival) lines.push(`- 宿敌：${rival.name}（交手 ${rival.battles} 场）`);
    lines.push('');

    lines.push('## 直播场次');
    lines.push('');
    lines.push('录像里的时间点 ＝ 下表「现实时间」减去这场直播在 YouTube 后台的开播时间。');
    lines.push('');
    lines.push('| 场次 | 直播 | 本场第一条记录 | 本场最后一条记录 | 条数 |');
    lines.push('|---|---|---|---|---|');
    sessions.forEach((s, i) => {
        lines.push(`| ${i + 1} | ${s.video ? videoUrl(s.video) : '没连直播'} | ${formatRealTime(s.from)} | ${formatRealTime(s.to)} | ${s.count} |`);
    });
    lines.push('');

    lines.push('## 时间线');
    lines.push('');
    lines.push('| 现实时间 | 直播场次 | 游戏时间 | 年龄 | 官职 | 事件 |');
    lines.push('|---|---|---|---|---|---|');
    events.forEach((e, i) => {
        lines.push(`| ${formatRealTime(e.realMs)} | ${sessionOf[i]} | ${gameTime(e)} | ${e.age} | ${cell(e.rank)} | ${cell(cleanLifeText(e.text))} |`);
    });
    lines.push('');

    lines.push('## 给 AI 的写作要求（去 AI 味 · 历史纪录片白描风）');
    lines.push('');
    lines.push('```');
    lines.push(`下面是古代军人「${hero.name}」一生的真实记录，来自一款历史战争模拟游戏。请据此写一篇适合做视频旁白的中文故事文案。`);
    lines.push('要求：');
    lines.push('1. 只用记录里真实发生的事：投效了谁、打了哪几仗、胜负、兵力、斩敌、升迁与削职、封号。不许编造记录里没有的人物、战役和情节。');
    lines.push('2. 按时间顺序讲，写出起落：重点写以少胜多、兵败削职、东山再起、与宿敌再次交锋、封侯立国这类转折。');
    lines.push('3. 每一段开头标出对应的「现实时间」，方便剪辑时对应录像画面。');
    lines.push('4. 严格去 AI 味（Humanizer 准则）：');
    lines.push('   - 禁用网文与 AI 套话：不许出现「命运的齿轮开始转动」「不仅…而且…」「在这场战役中」「值得一提的是」「总而言之」「书写了属于自己的传奇」等总结陈词；');
    lines.push('   - 禁用程序员与游戏黑话：不许出现「兵模」「原军团」「功劳归零」「系统」等词；');
    lines.push('   - 用《史记》列传与央视历史纪录片的冷峻白描口吻：多用具体动词与短句，少用形容词与感叹号，适合沉稳男声朗读；全文 800～1500 字。');
    lines.push('5. 结尾只用两三句平实的话收束他的一生，不要升华说教。');
    lines.push('```');
    lines.push('');
    return lines.join('\n');
}

/** 资料包文件名：一生资料包_名字_导出时间.md */
export function storyPackFileName(heroName: string, exportedAtMs = Date.now()): string {
    const d = new Date(exportedAtMs);
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const safe = heroName.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 24) || '主角';
    return `一生资料包_${safe}_${stamp}.md`;
}

/** 把资料包存成文件（浏览器下载到「下载」文件夹） */
export function downloadLifeStoryPack(log: PlayerLifeLog, hero: StoryPackHero): string {
    const now = Date.now();
    const text = buildLifeStoryPack(log, hero, now);
    const name = storyPackFileName(hero.name, now);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return name;
}
