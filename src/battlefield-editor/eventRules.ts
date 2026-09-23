/**
 * eventRules.ts —— 战场事件编辑器的**硬规则检查**（2026-09-19 主人令「把犯的错误设成必填项」）。
 *
 * 🔴🔴🔴 最高铁律（2026-09-19 主人怒斥定死）：**严禁擅自新建 / 添加任何东西**。
 *   主人原话：「别他妈的擅自胡乱瞎建了，写到你的记忆里，写到规矩里，写到所有你能看到的敌方（地方）。」
 *   编辑器这边同样只做主人点名的事：**不许自己建势力 / 建据点 / 建战场 / 建人物 / 补番号 / 补旗号 / 补色**；
 *   审计警告只报给主人看，**不是动手许可**。细则见 `docs/AGENTS/no-arbitrary-additions.md`。
 *   本文件里的检查只**拦错**（拦住写歪的数据），绝不替主人补数据。
 *
 * 为什么单独成文件：这些规则是**这一轮真犯过的错**，每一条都写明「犯过错所以拦」。
 *  · 放在编辑器里 → 主人录入时当场拦住；
 *  · 又能被脚本直接 import → 我可以在 Node 里拿**全部 23 场现存数据**跑一遍，
 *    确认「新规则不会把主人已有的数据锁死」（血训：校验比运行时还严 = 数据全存不了）。
 *
 * 铁律：**只拦「结构性错误」**（写歪了就一定跑不通的那种）；
 *       史实判断（谁打谁、兵力多少）编辑器管不了，不做假校验。
 */
import { BATTLEFIELDS } from '../data/Battlefields';
import { CITIES_V2 } from '../data/cities_v2';
import { FACTIONS } from '../data/factions';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { isBattlefieldCharacter, getBattlefieldCharacter } from '../data/BattlefieldCharacters';
import { getExpeditionEliteConfig } from '../data/ExpeditionLegions';

export interface EventRuleIssue { level: 'error' | 'warn'; msg: string; }

/** 规则需要的字段（`BattleDraft` 结构上是它的超集，直接传即可） */
export interface EventRuleInput {
    bfId: string;
    bfName: string;
    bfNote: string;
    bfBriefing: string;
    year: number;
    type: 'field_battle' | 'siege';
    title: string;
    eventTitle: string;
    description: string;
    battleDescription: string;
    generalId: string;
    /** 武将邀约对白 */
    inviteText: string;
    lat: number;
    lng: number;
    attackerFactionId: string;
    attackerGeneralId: string;
    attackerTroops: number;
    defenderFactionId: string;
    defenderGeneralId: string;
    defenderTroops: number;
    bfTargetBattlefieldId: string;
    defenderCityId: string;
    /** 在场人物（战场人物 id 列表） */
    bfRoster: string[];
}

// ── 惰性索引（编辑器每次校验都建一次全表太浪费）──────────────────────────
const FACTION_IDS = new Set(FACTIONS.map((f) => f.id));
let _anchoredGenerals: Set<string> | null = null;
function anchoredGeneralIds(): Set<string> {
    if (_anchoredGenerals) return _anchoredGenerals;
    const s = new Set<string>();
    for (const c of CITIES_V2) {
        const g = getCityAnchoredGeneral(c.id);
        if (g) s.add(g.generalId);
    }
    _anchoredGenerals = s;
    return s;
}

/**
 * 括号检查：**只查圆/方/六角括号**。
 * 🔴 主人令「播报不要有括号内容」→「全清，不要括号」。
 * ⚠️ 【】不在禁列 —— 那是主人定的「【XXX战役】」专用格式。
 */
const BRACKET = /[（(［\[〔][^）)］\]〕]*[）)］\]〕]/;
function bracketFields(d: EventRuleInput): Array<[string, string]> {
    return [
        ['战役名称', d.title],
        ['事件标题', d.eventTitle],
        ['事件播报', d.description],
        ['战役播报', d.battleDescription],
        ['战场地名', d.bfName],
        ['战场注释', d.bfNote],
        ['赶路播报', d.bfBriefing],
        ['武将邀约对白', d.inviteText],
    ];
}

const KM = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
    const R = 6371, d2r = (x: number) => (x * Math.PI) / 180;
    const dLat = d2r(bLat - aLat), dLng = d2r(bLng - aLng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(d2r(aLat)) * Math.cos(d2r(bLat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

/**
 * 硬规则检查。返回的 issue 与编辑器原有校验**合并**后一起显示（error 会置灰「保存」）。
 * @param allDrafts 全部草稿（判「这位武将名下还有别的战役」用）
 */
export function checkEventRules(d: EventRuleInput, allDrafts: Array<{ generalId: string; title: string }>): EventRuleIssue[] {
    const out: EventRuleIssue[] = [];
    const err = (msg: string) => out.push({ level: 'error', msg });
    const warn = (msg: string) => out.push({ level: 'warn', msg });

    // ① 归属武将必填，且**玩家必须找得到他** ────────────────────────────
    //    血训（2026-09-19）：前323/前322/前321 三场的主人公（安提帕特／安提菲洛斯／欧迈尼斯）
    //    在库里**没有据点**，而玩家「找到武将」只认据点守将 → 这三场永远等不到玩家，
    //    最后被主人令「全删除」。这条就是为它们立的。
    if (!d.generalId) {
        err('归属武将必须选（一个武将一个真实的历史事件：玩家是找到他本人来接这一仗的）');
    } else {
        const anchored = anchoredGeneralIds().has(d.generalId);
        const bfChar = isBattlefieldCharacter(d.generalId);
        const rec = getGeneralRecordByGeneralId(d.generalId);
        const name = rec?.generalName ?? d.generalId;
        if (!rec) err(`归属武将查不到记录：${d.generalId}`);
        if (!anchored && !bfChar) {
            err(`归属武将「${name}」既不是任何据点守将、也不在战场人物表 → 玩家永远找不到他，这一仗触发不了`);
        }
        // 他在自己那一仗里必须出场（否则玩家随他走来，却打一场没有他的仗）
        if (![d.attackerGeneralId, d.defenderGeneralId].includes(d.generalId)) {
            err(`归属武将「${name}」不在本场攻守主帅里（玩家随他而来，这一仗却跟他无关）`);
        }
        const dup = allDrafts.filter((x) => x.generalId === d.generalId && x.title !== d.title);
        if (dup.length) {
            warn(`【${name}】名下还有【${dup.map((x) => x.title).join('、')}】——同一武将可挂多场，`
                + '运行时按年份早→晚依次解锁；若只想一人一场请自行确认');
        }
    }

    // ①b 武将邀约对白：剧本模式里玩家找到他时念的话（2026-09-23 主人定「对话内容写到编辑器中」）
    if (!d.inviteText?.trim()) {
        warn('武将邀约对白没写：剧本模式会用一句通用邀约代替，建议按史料写这位武将此时会说的话');
    }

    // ② 战役名一律「XXXX战役」 ─────────────────────────────────────────
    //    主人令（2026-09-19）：「战役名称一律是XXXX战役可以吗」→ 已全库统一，编辑器同步硬拦。
    if (d.title.trim() && !d.title.trim().endsWith('战役')) {
        err('战役名称必须以「战役」结尾（主人定：一律「XXXX战役」，如「长平战役」「一之谷战役」）');
    }

    // ③ 一切文字字段不许出现括号 ─────────────────────────────────────
    //    主人令：「播报不要有括号内容」→「全清，不要括号」。
    for (const [label, text] of bracketFields(d)) {
        const hit = String(text ?? '').match(new RegExp(BRACKET.source, 'g'));
        if (hit) err(`${label}里有括号内容：${hit.join(' ')}（主人定：不要括号，改成逗号并列）`);
    }

    // ④ 双方势力必须**真实存在**于 factions.ts ───────────────────────
    //    血训：621 虎牢关战役的守方势力 `xia`（夏·窦建德）在 factions.ts 里根本不存在，
    //    精锐番号却早早写了 → 战斗取不到势力名/势力色。此条拦它。
    for (const [label, fid] of [['攻方', d.attackerFactionId], ['守方', d.defenderFactionId]] as const) {
        if (fid && !FACTION_IDS.has(fid)) {
            err(`${label}势力「${fid}」不在 factions.ts 里（先把势力记录建好，再来挂战役）`);
        }
    }

    // ⑤ 双方主帅必须查得到记录 ───────────────────────────────────────
    for (const [label, gid] of [['攻方', d.attackerGeneralId], ['守方', d.defenderGeneralId]] as const) {
        if (gid && !getGeneralRecordByGeneralId(gid)) {
            err(`${label}主帅「${gid}」查不到武将记录（FactionGenerals 或战场人物表里都没有）`);
        }
    }

    // ⑥ 双方势力最好有精锐番号（战斗面板要显示番号标签）──────────────
    //    血训：阿斯瓦卡/马利/卡帕多细亚 三个战场势力长期没有番号 → 战斗中取不到精锐环加成。
    for (const [label, fid] of [['攻方', d.attackerFactionId], ['守方', d.defenderFactionId]] as const) {
        if (fid && FACTION_IDS.has(fid) && !getExpeditionEliteConfig(fid)) {
            warn(`${label}势力「${fid}」没有精锐番号 → 战斗中取不到精锐环加成、面板也无番号标签`);
        }
    }

    // ⑦ 兵力比例：主人定「兵力要符合历史」，且没有低于一半的仗 ────────
    const at = d.attackerTroops, dt = d.defenderTroops;
    if (at > 0 && dt > 0) {
        const ratio = Math.min(at, dt) / Math.max(at, dt);
        if (ratio < 0.5) {
            warn(`兵力悬殊（少方仅为多方的 ${(ratio * 100).toFixed(0)}%）：主人定「兵力要符合历史」，`
                + '若史实确实如此请自行确认');
        }
    }

    // ⑧ 战场坐标不得与**另一块战场**重合 ─────────────────────────────
    for (const b of BATTLEFIELDS) {
        if (b.id === d.bfId) continue;
        const km = KM(d.lat, d.lng, b.lat, b.lng);
        if (km < 1) err(`本战场与「${b.name}」(${b.id}) 坐标几乎重合（${km.toFixed(2)}km）——一块战场只能用一次`);
        else if (km < 5) warn(`本战场与「${b.name}」(${b.id}) 仅 ${km.toFixed(1)}km，地图上两个标牌会挨着`);
    }

    // ⑨ 战场坐标压在同名据点上的提示 ────────────────────────────────
    //    铁律：战场是战场、据点是据点（战场没有主人）。历史战场本来就常在城下
    //    （郾城战役与郾城据点仅 0.9km），所以**只提示、不拦**，坐标不许为了拉开而造假。
    let nearest: { name: string; km: number } | null = null;
    for (const c of CITIES_V2) {
        const km = KM(d.lat, d.lng, c.lat, c.lng);
        if (!nearest || km < nearest.km) nearest = { name: `${c.name}(${c.id})`, km };
    }
    if (nearest && nearest.km < 5) {
        warn(`战场坐标距据点「${nearest.name}」仅 ${nearest.km.toFixed(1)}km —— 两者标牌会挨着（史实如此则不必改坐标）`);
    }

    // ⑩ 在场人物必须查得到，且**所属势力要是本场攻守双方之一** ──────────
    //    血训（2026-09-19 主人质问「防守方怎么两个人呀」）：虎牢关战役的在场人物里
    //    我写进了**王世充**（郑）—— 而虎牢关的守方只有**窦建德**（夏）一人，王世充当时
    //    被围在洛阳、根本不在虎牢关。这条规则就是为这种「守方凭空多一个人」立的。
    //    ⚠️ 只 warn 不 err：历史上确实有**盟军主帅**在场（如沙隆的西哥特王），那不是错。
    for (const id of d.bfRoster ?? []) {
        const c = getBattlefieldCharacter(id);
        if (!c) { err(`在场人物「${id}」不在战场人物表里（BattlefieldCharacters.ts）`); continue; }
        if (c.factionId !== d.attackerFactionId && c.factionId !== d.defenderFactionId) {
            warn(`在场人物「${c.generalName}」属于势力「${c.factionId}」，**不是本场攻守双方** —— `
                + '确认他确实在场（盟军主帅／旁观者可以，无关之人请删掉）');
        }
    }

    // ⑪ 赶路播报里的兵力数必须与攻守兵力数据一致 ─────────────────────
    //    血训（2026-09-23 主人「文本中的兵力和军团兵力不一致呀」）：数据按英文维基信息框改成
    //    18100 / 37000 / 75000 后，播报还写着「三万余步兵与五千骑兵」「三万余将士」「七万余大军」。
    //    规则早就写着「背景播报里的数字必须与数据同口径」，但编辑器没查，所以一改数据就漏。
    //    判据：播报里每一方的总兵力，要么原样写出，要么由同一句里相邻几项相加得出（如「一万五千骑兵与一万二千步兵」= 27000）。
    if (d.bfBriefing.trim()) {
        const troops = briefingTroopNumbers(d.bfBriefing);
        const fuzzy = troops.filter((t) => t.fuzzy);
        if (fuzzy.length) {
            warn(`赶路播报里有约数兵力：${fuzzy.map((t) => t.raw).join('、')} —— 全军总数要写确数，与兵力数据一致`);
        }
        for (const [label, total] of [['攻方', d.attackerTroops], ['守方', d.defenderTroops]] as const) {
            if (!(total > 0) || briefingHasTotal(troops, total)) continue;
            err(`赶路播报与${label}兵力数据不一致：数据是 ${total}，播报里找不到这个数，也没有相邻几项加起来等于它`
                + `（播报里的兵力：${troops.map((t) => t.raw).join('、') || '无'}）。改播报，或先查维基确认数据`);
        }
    }

    return out;
}

// ── ⑪ 用：从播报里取出兵力数 ────────────────────────────────────────────
interface TroopNumber { raw: string; value: number; fuzzy: boolean; sentence: number }
const CN_DIGIT: Record<string, number> = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
/** 万以下一段：五千一百 / 二十 / 十五 */
function cnSection(s: string): number {
    let total = 0, digit = 0;
    for (const ch of s) {
        if (ch in CN_DIGIT) { digit = CN_DIGIT[ch]; continue; }
        const unit = ch === '十' ? 10 : ch === '百' ? 100 : ch === '千' ? 1000 : 0;
        if (unit) { total += (digit || 1) * unit; digit = 0; }
    }
    return total + digit;
}
function cnNumber(s: string): number {
    const i = s.indexOf('万');
    return i < 0 ? cnSection(s) : cnSection(s.slice(0, i) || '一') * 10000 + cnSection(s.slice(i + 1));
}
/** 数字后面紧跟这些量词 = 不是人数（距离、年龄、车船、象、火把…） */
const NOT_TROOP_UNIT = /^(?:辆|头|艘|盏|座|里|米|英里|尺|丈|年|岁|天|日|月|步(?!兵)|倍|面|匹|石|斤|层|道|处)/;
/** 数字后 8 字内出现这些词 = 说的是兵 */
const TROOP_WORD = /兵|骑|将士|大军|军|武士|健儿|士卒|勇士|战士|弓手|死士|人/;
function briefingTroopNumbers(text: string): TroopNumber[] {
    const out: TroopNumber[] = [];
    const sentences = text.split(/[。；！？]/);
    sentences.forEach((sen, si) => {
        const re = /([数近约])?([零〇一二两三四五六七八九十百千万]+)(余|多)?(万)?/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(sen))) {
            const numStr = m[2] + (m[4] ?? '');
            const value = m[3] && m[4] ? cnNumber(m[2]) * 10000 : cnNumber(numStr);
            if (value < 100) continue;
            const after = sen.slice(m.index + m[0].length);
            if (NOT_TROOP_UNIT.test(after) || !TROOP_WORD.test(after.slice(0, 8))) continue;
            out.push({ raw: m[0], value, fuzzy: !!(m[1] || m[3]), sentence: si });
        }
    });
    return out;
}
function briefingHasTotal(troops: TroopNumber[], total: number): boolean {
    for (let i = 0; i < troops.length; i++) {
        let sum = 0;
        for (let j = i; j < troops.length && troops[j].sentence === troops[i].sentence; j++) {
            if (troops[j].fuzzy) break;
            sum += troops[j].value;
            if (sum === total) return true;
        }
    }
    return false;
}
