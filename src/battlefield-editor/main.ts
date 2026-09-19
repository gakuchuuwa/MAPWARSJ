/**
 * 战场事件编辑器 —— /battlefield-editor.html
 *
 * 🔴 [2026-09-16 主人定] 一场历史战役要写清楚的东西，就是这张表单上的字段：
 *    年代（前 321 年这种）/ 战役名称（历史上最知名的那个名字，XXX战役）/ 战场坐标 /
 *    攻城战还是野战 / 双方武将 / 双方兵力 / 谁赢了 / 战役播报内容。
 *
 * 一场战役落在**两个**文件里，本编辑器一次写两处，避免手写漏配：
 *   ① `src/data/Battlefields.ts`          —— 战场（地名 + 坐标 + 哪年的剧本打完它上图）
 *   ② `src/data/HistoricalEventScript.ts` —— 剧本（双方将/兵力/胜负/播报/行军航点）
 * 两处坐标**必须一字不差**（Battlefields.ts 的铁律），编辑器强制同源，从根上杜绝写歪。
 *
 * 数据是 import 进来的（Vite 服务这张页面），所以列表不需要服务端；
 * 只有落盘走 `/api/battlefield-editor/save`。
 */
import { BATTLEFIELDS, matchesBattlefield } from '../data/Battlefields';
import { HISTORICAL_EVENT_SCRIPT } from '../data/HistoricalEventScript';
import { FACTION_GENERALS } from '../data/FactionGenerals';
import { getAllBattlefieldCharacters } from '../data/BattlefieldCharacters';
import { CITIES_V2 } from '../data/cities_v2';
import { LEVEL_2_CIV_59_LEGIONS } from '../data/level2Civ59Legions';
import { LEVEL_3_LEGION_MAP } from '../data/level3CustomLegions';
import { BASE_16_LEGION_NAME_BY_REGION, getCultureLegionName } from '../types/CultureFormations';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { getCityRegion } from '../systems/RegionSystem';
import type { HistoricalEvent, FieldBattleData } from '../types/core';
import { journeyBriefingDuration, journeyBriefingParagraphs } from '../player/JourneyBriefing';
// 🔴 [2026-09-19 主人令「把犯的错误在编辑器里设成必填项」] 硬规则检查单独成文件，便于脚本拿全量数据回归
import { checkEventRules } from './eventRules';

// ── 编辑器里一场战役的全貌（= 两个文件的并集） ───────────────────────────
interface BattleDraft {
    /** 战场 id：`bf_` + 拼音（Battlefields.ts 铁律：不是 city_*） */
    bfId: string;
    /** 战场地名（标牌上只显示这个） */
    bfName: string;
    bfNote: string;
    /** 赶路背景播报：玩家在奔赴这个战场的路上逐段播的背景介绍（空行分段） */
    bfBriefing: string;
    /**
     * 🔴 [2026-09-19 主人定] 在场人物（`BattlefieldCharacters.ts` 的人物 id）——
     * 「缺少的人物，做成战场人物。人物和战场点绑定。」这些人物不属于任何据点，只属于这一块战场。
     */
    bfRoster: string[];
    /**
     * 🔴 [2026-09-19 主人定] 攻城战：这个战场**打的是哪座城**。
     * 战场标牌标在史实地点，打的却是最近的据点（一之谷 ↔ 姬路城相差 43km），故显式指名。
     */
    bfEventCityId: string;
    /**
     * 🔴 [2026-09-19 主人定「建立一个一之谷战场」] **本战场即攻城目标**（战场要塞，一之谷）。
     * 攻城目标二选一：打据点给 `bfEventCityId`，打战场要塞给本字段（值 = 自己的战场 id）。
     */
    bfTargetBattlefieldId: string;
    /**
     * 🔴 [2026-09-19 主人定] **战场攻城战的标注套用据点样式**：
     * `big_city` / `medium_city` / `small_city` / `stockade` / `pass`（大中小城寨）。
     * 留空 = 仍画普通战场形态（野战留空）。
     */
    bfSiegeCastleType: string;

    year: number;
    /** 0 春 1 夏 2 秋 3 冬 */
    season: number;
    /**
     * 🔴 [2026-09-19 主人定] **这场战役归属哪位武将** —— 「一个武将一个真实的历史事件」。
     * 玩家与这位武将对话/野外会面并入伍 → 打的就是这一场（见 `PlayerQuestSystem`）。
     * 留空 = 不归属任何武将（自动模式按老规矩挑），与加本字段之前的行为完全一致。
     */
    generalId: string;
    type: 'field_battle' | 'siege';
    /** 战役名称：历史上最知名的那个，如「高加米拉战役」「推罗战役」 */
    title: string;
    /** 事件标题（年表那一行），如「公元前331年 高加米拉战役」 */
    eventTitle: string;
    /** 事件播报：这一年发生了什么 */
    description: string;
    /** 战役播报：这一仗怎么打的（战斗面板/横幅用） */
    battleDescription: string;

    lat: number;
    lng: number;

    attackerFactionId: string;
    attackerGeneralId: string;
    attackerTroops: number;
    attackerSourceCityId: string;
    /** 攻方军团（留空 = 按势力/建筑风格默认） */
    attackerLegionName: string;

    defenderFactionId: string;
    defenderGeneralId: string;
    defenderTroops: number;
    /** 野战：守方从哪座城出兵 */
    defenderSourceCityId: string;
    /** 攻城战：打哪座城（守方就是这座城，不是军团） */
    defenderCityId: string;
    /** 守方军团（留空 = 按势力/建筑风格默认） */
    defenderLegionName: string;

    result: 'attacker_win' | 'defender_win';
    /** 行军航点（据点 id，逐段推进；最后一段走 location） */
    marchWaypoints: string[];
    /** 战后归属变更 */
    cityUpdates: Array<{ cityId: string; factionId: string }>;
}

const SEASONS = ['春', '夏', '秋', '冬'];

// ── 下拉数据源 ───────────────────────────────────────────────────────
/** 全武将（FACTION_GENERALS 的条目可能是数组：一势力多将） */
const ALL_GENERALS: Array<{ generalId: string; generalName: string; factionId: string }> = (() => {
    const out: Array<{ generalId: string; generalName: string; factionId: string }> = [];
    for (const [factionId, entry] of Object.entries(FACTION_GENERALS)) {
        const list = Array.isArray(entry) ? entry : [entry];
        for (const g of list as Array<{ generalId: string; generalName: string }>) {
            out.push({ generalId: g.generalId, generalName: g.generalName, factionId });
        }
    }
    out.sort((a, b) => a.generalName.localeCompare(b.generalName, 'zh'));
    return out;
})();

const GENERAL_BY_ID = new Map(ALL_GENERALS.map((g) => [g.generalId, g]));

// 军团下拉数据源：一级 16 + 二级 59 + 三级 126（军团挂建筑风格 16+59+3 一一对应），按层分组便于挑选
const LEGION_GROUPS: Array<{ label: string; legions: string[] }> = (() => {
    const l1 = [...new Set(Object.values(BASE_16_LEGION_NAME_BY_REGION))].sort((a, b) => a.localeCompare(b, 'zh'));
    const l2 = LEVEL_2_CIV_59_LEGIONS.map((l) => l.name).sort((a, b) => a.localeCompare(b, 'zh'));
    const l3 = [...LEVEL_3_LEGION_MAP.keys()].sort((a, b) => a.localeCompare(b, 'zh'));
    return [
        { label: '一级 · 文化军团（16）', legions: l1 },
        { label: '二级 · 文明军团（59）', legions: l2 },
        { label: '三级 · 自定义军团', legions: l3 },
    ];
})();
const ALL_LEGIONS: string[] = LEGION_GROUPS.flatMap((g) => g.legions);
const CITY_BY_ID = new Map(CITIES_V2.map((c) => [c.id, c]));
const ALL_CITIES = [...CITIES_V2].sort((a, b) => a.name.localeCompare(b.name, 'zh'));

/** 🔴 [2026-09-19 主人定] 战场人物下拉（只在场战上出现的人，不参与城池掷将） */
const ALL_BF_CHARACTERS = getAllBattlefieldCharacters();
const BF_CHAR_BY_ID = new Map(ALL_BF_CHARACTERS.map((c) => [c.generalId, c]));

// ── 把现有两个文件合并成编辑器视图 ────────────────────────────────────
type AnyEvent = HistoricalEvent & {
    season?: number;
    siegeData?: FieldBattleData;
    fieldBattleData?: FieldBattleData;
    cityUpdates?: Array<{ cityId: string; factionId?: string }>;
};

function battleDataOf(ev: AnyEvent): FieldBattleData | null {
    return ev.siegeData ?? ev.fieldBattleData ?? null;
}

function loadDrafts(): BattleDraft[] {
    const drafts: BattleDraft[] = [];
    for (const raw of HISTORICAL_EVENT_SCRIPT) {
        const ev = raw as AnyEvent;
        const bd = battleDataOf(ev);
        if (!bd) continue;
        const isSiege = ev.type === 'siege';
        const anyBd = bd as FieldBattleData & { defenderCityId?: string; targetBattlefieldId?: string };
        // 🔴 [2026-09-19 主人定「建立一个一之谷战场」] **战场要塞优先**：攻城战打的是**一块战场**
        //    （`targetBattlefieldId`），这种条目既没有 `location` 也没有 `defenderCityId`，
        //    照旧走下面的坐标兜底会得到 (0,0) → 配不上任何战场 → 列表里显示「未配战场」、
        //    连带 `siegeCastleType` 等字段全丢（血训：一之谷在编辑器里就是这么变成空白的）。
        if (anyBd.targetBattlefieldId) {
            const bfDirect = BATTLEFIELDS.find((b) => b.id === anyBd.targetBattlefieldId) ?? null;
            if (bfDirect) {
                drafts.push(buildDraftFrom(ev, bd, isSiege, bfDirect));
                continue;
            }
        }
        // 🔴 攻城战的剧本条目**可能没有 location**（推罗就是靠 defenderCityId + 航点走的），
        //    这时用被攻据点的坐标兜底，否则列表里坐标会是 0、也配不上战场。
        let loc = bd.location ?? null;
        if (!loc && anyBd.defenderCityId) {
            const c = CITY_BY_ID.get(anyBd.defenderCityId);
            if (c) loc = { lat: c.lat, lng: c.lng };
        }
        loc = loc ?? { lat: 0, lng: 0 };
        // 🔴 [2026-09-17] 配对判据统一到 matchesBattlefield（同年 + 坐标接近），与运行时同一个函数。
        //    改之前这里用 0.5 度、运行时用 0.15 度且不看年份，编辑器配得上运行时未必配得上。见该函数长注释。
        const bf = BATTLEFIELDS.find((b) => matchesBattlefield(b, ev.year, loc)) ?? null;
        drafts.push(buildDraftFrom(ev, bd, isSiege, bf));
    }

    function buildDraftFrom(ev: AnyEvent, bd: FieldBattleData, isSiege: boolean, bf: (typeof BATTLEFIELDS)[number] | null): BattleDraft {
        const anyBd2 = bd as FieldBattleData & { defenderCityId?: string };
        const loc2 = bd.location
            ?? (anyBd2.defenderCityId ? (() => { const c = CITY_BY_ID.get(anyBd2.defenderCityId!); return c ? { lat: c.lat, lng: c.lng } : null; })() : null)
            ?? (bf ? { lat: bf.lat, lng: bf.lng } : { lat: 0, lng: 0 });
        return {
            bfId: bf?.id ?? '',
            bfName: bf?.name ?? '',
            bfNote: bf?.note ?? '',
            bfBriefing: bf?.briefing ?? '',
            bfRoster: [...(bf?.roster ?? [])],
            bfEventCityId: bf?.eventCityId ?? '',
            bfTargetBattlefieldId: bf?.eventBattlefieldId ?? '',
            bfSiegeCastleType: (bf as { siegeCastleType?: string } | undefined)?.siegeCastleType ?? '',
            year: ev.year,
            season: ev.season ?? 0,
            generalId: (ev as AnyEvent & { generalId?: string }).generalId ?? '',
            type: isSiege ? 'siege' : 'field_battle',
            title: bd.title ?? '',
            eventTitle: ev.title ?? '',
            description: ev.description ?? '',
            battleDescription: bd.description ?? '',
            lat: loc2.lat,
            lng: loc2.lng,
            attackerFactionId: bd.attackerFactionId ?? '',
            attackerGeneralId: bd.attackerGeneralId ?? '',
            attackerTroops: bd.attackerTroops ?? 0,
            attackerSourceCityId: bd.attackerSourceCityId ?? '',
            attackerLegionName: bd.attackerLegionName ?? '',
            // 攻城战的守方是城，剧本里常常不写 defenderFactionId（势力从城读）→ 这里按城带出来；
            // 打「战场要塞」的没有城，守方势力从守将反查（与运行时同一口径）
            defenderFactionId: bd.defenderFactionId
                ?? (isSiege && anyBd2.defenderCityId ? CITY_BY_ID.get(anyBd2.defenderCityId)?.factionId ?? '' : ''),
            defenderGeneralId: bd.defenderGeneralId ?? '',
            defenderTroops: bd.defenderTroops ?? 0,
            defenderSourceCityId: bd.defenderSourceCityId ?? '',
            defenderCityId: anyBd2.defenderCityId ?? '',
            defenderLegionName: bd.defenderLegionName ?? '',
            result: bd.result ?? 'attacker_win',
            marchWaypoints: [...(bd.marchWaypoints ?? [])],
            cityUpdates: (ev.cityUpdates ?? [])
                .filter((u) => !!u.factionId)
                .map((u) => ({ cityId: u.cityId, factionId: u.factionId as string })),
        };
    }
    drafts.sort((a, b) => a.year - b.year);
    return drafts;
}

function blankDraft(): BattleDraft {
    return {
        bfId: '', bfName: '', bfNote: '', bfBriefing: '', bfRoster: [], bfEventCityId: '', bfTargetBattlefieldId: '', bfSiegeCastleType: '',
        year: -321, season: 0, generalId: '', type: 'field_battle',
        title: '', eventTitle: '', description: '', battleDescription: '',
        lat: 0, lng: 0,
        attackerFactionId: '', attackerGeneralId: '', attackerTroops: 10000, attackerSourceCityId: '', attackerLegionName: '',
        defenderFactionId: '', defenderGeneralId: '', defenderTroops: 10000,
        defenderSourceCityId: '', defenderCityId: '', defenderLegionName: '',
        result: 'attacker_win', marchWaypoints: [], cityUpdates: [],
    };
}

// ── 校验：写歪了当场拦下，别等运行时才发现 ─────────────────────────────
interface Issue { level: 'error' | 'warn'; msg: string; }

function validate(d: BattleDraft): Issue[] {
    const out: Issue[] = [];
    const err = (msg: string) => out.push({ level: 'error', msg });
    const warn = (msg: string) => out.push({ level: 'warn', msg });

    if (!Number.isFinite(d.year) || d.year === 0) err('年代必须填（公元前写负数，如前321年 = -321）');
    if (!d.title.trim()) err('战役名称必须填');
    // 战役名一律「XXXX战役」、同将多场提示、归属武将可找到性… 全部交给 `eventRules.ts`（末尾统一并入）
    if (!d.eventTitle.trim()) warn('事件标题为空，建议写「公元前XXX年 XXX战役」');
    // 🔴 [2026-09-19 主人定] **删掉原先的「一年一个事件」互斥**。
    //    主人原话：「现在游戏是乱斗，所有先不要时间这个限定条件了，但是再写事件的时候，
    //    还要写上时间，万一以后还要用，就不要再写了。」
    //    年份照旧要填（留着以后用），但不再限制同年只能一场 —— 一年可以有多场战役。
    //
    // 🔴 [2026-09-19 主人令「除亚历山大外尽量一人一场」＋运行时已支持同将多场]
    //    **同一武将可以挂多场**（亚历山大东征 11 场就是一个人打的），运行时
    //    `findHistoricalEventsOfGeneral` 返回数组、`PlayerQuestSystem` 按年份**依次解锁**。
    //    所以这里**只提醒、不拦存**（见 `eventRules.ts` 的同类提示）——
    //    改前是 `err`，而 `hasErr` 会把「保存」按钮置灰，导致亚历山大名下那 11 场
    //    **在编辑器里一场都存不了**（血训：校验比运行时还严，等于把主人的数据锁死）。
    if (!d.description.trim()) err('战役播报内容必须填（事件播报）');
    if (!d.battleDescription.trim()) warn('战役播报（战斗面板那条）为空，建议补上');

    if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng) || (d.lat === 0 && d.lng === 0)) {
        err('战场坐标必须填');
    }
    if (Math.abs(d.lat) > 90) err('纬度超范围');
    if (Math.abs(d.lng) > 180) err('经度超范围');

    if (!d.bfId.trim()) err('战场 id 必须填（bf_ + 拼音）');
    else if (!/^bf_[a-z0-9_]+$/.test(d.bfId.trim())) err('战场 id 必须是 bf_ 开头的小写拼音，且不能是 city_*（战场不是据点）');
    if (!d.bfName.trim()) err('战场地名必须填（标牌上只显示地名）');

    if (!d.attackerGeneralId) err('攻方武将必须选');
    if (!d.defenderGeneralId) err('守方武将必须选');
    if (d.attackerGeneralId && d.attackerGeneralId === d.defenderGeneralId) {
        err('攻守不能是同一个武将');
    }
    if (!d.attackerFactionId) err('攻方势力必须填');
    // 🔴 [2026-09-19] 打**战场要塞**的攻城战没有「城」可读势力，守方势力由守将反查
    //    （与运行时 `getFactionIdOfGeneral` 同一口径），此时不要求手填。
    if (!d.defenderFactionId && !d.bfTargetBattlefieldId) err('守方势力必须填');
    if (d.attackerFactionId && d.attackerFactionId === d.defenderFactionId) {
        err('攻守不能是同一个势力');
    }

    if (!(d.attackerTroops > 0)) err('攻方兵力必须 > 0');
    if (!(d.defenderTroops > 0)) err('守方兵力必须 > 0');
    // 🔴 [2026-09-19 主人定] **取消「5000 硬拦」**。
    //    主人原话：「所有战场一律进入战术模式，不受 5000 限制。兵力要符合历史。」
    //    运行时本来就放行：战场事件的双方军团都带 `isScriptArmy`，
    //    `GameAppCombatHooks.onRegionalBattleStart` 里 `isBattlefieldEvent` 一真就直接进 13，
    //    不看兵力/将领/精锐/调试开关。原先这里那道硬拦是编辑器自己加的，比引擎还严，
    //    把桶狭间（信长 2000~3000）、千早城（楠木千余人）这类**史实就是这么少**的仗挡在门外。
    //    保留一条提醒，不再拦保存。
    if (d.attackerTroops < 5000 || d.defenderTroops < 5000) {
        warn('有一方兵力 < 5000：战场事件不受此限（会自动进战术模式），确认这是史实数字即可');
    }

    if (!d.attackerSourceCityId) err('攻方出兵据点必须选（军团从这里出发）');
    else if (!CITY_BY_ID.has(d.attackerSourceCityId)) err('攻方出兵据点不存在：' + d.attackerSourceCityId);

    if (d.type === 'siege') {
        // 🔴 [2026-09-19 主人定「建立一个一之谷战场」] 攻城目标**二选一**：
        //    打**据点**（推罗战役）给「被攻打的据点」；打**战场要塞**（一之谷战役）给「本战场即攻城目标」。
        const isFortress = !!d.bfTargetBattlefieldId;
        if (!isFortress && !d.defenderCityId) {
            err('攻城战必须指定被攻打的据点，或指定「本战场即攻城目标」（战场要塞）');
        }
        if (d.defenderCityId && !CITY_BY_ID.has(d.defenderCityId)) err('被攻据点不存在：' + d.defenderCityId);
        if (isFortress && !BATTLEFIELDS.some((b) => b.id === d.bfTargetBattlefieldId)) {
            err('战场要塞不存在：' + d.bfTargetBattlefieldId);
        }
        // 打据点才谈「战后归属」；打**战场要塞**不改任何据点归属（战场没有主人，易什么主）
        if (!isFortress && d.defenderCityId && !d.cityUpdates.some((u) => u.cityId === d.defenderCityId)) {
            warn('攻城战通常要写战后归属（主人定：该攻城就攻城，战斗要改据点归属，一切按历史）');
        }
        if (!isFortress && d.defenderCityId && !d.marchWaypoints.includes(d.defenderCityId)) {
            warn('攻城战的行军航点一般以被攻据点收尾');
        }
    } else {
        if (!d.defenderSourceCityId) warn('野战建议填守方出兵据点');
        else if (!CITY_BY_ID.has(d.defenderSourceCityId)) err('守方出兵据点不存在：' + d.defenderSourceCityId);
    }

    for (const wp of d.marchWaypoints) {
        if (!CITY_BY_ID.has(wp)) err('行军航点不存在：' + wp);
    }
    for (const u of d.cityUpdates) {
        if (!CITY_BY_ID.has(u.cityId)) err('战后归属的据点不存在：' + u.cityId);
        if (!u.factionId) err('战后归属没写归给谁：' + u.cityId);
    }

    // 🔴 [2026-09-19 主人令「把犯的错误在编辑器里设成必填项」] 这一轮真犯过的错，统一在 eventRules 里拦：
    //    归属武将找不到 / 不在本场阵中 / 战役名不以「战役」结尾 / 文字里有括号 /
    //    势力记录不存在 / 主帅查不到 / 势力没番号 / 兵力悬殊 / 战场坐标与别处重合。
    out.push(...checkEventRules(d, drafts));

    return out;
}

// ── 渲染 ─────────────────────────────────────────────────────────────
const app = document.getElementById('app') as HTMLElement;
const drafts = loadDrafts();
let selected = 0;
let working: BattleDraft = drafts[0] ? { ...drafts[0] } : blankDraft();
let isNew = false;

const css = `
.bf-wrap { display: flex; height: 100%; min-height: 0; }
.bf-list { width: 300px; flex: 0 0 300px; border-right: 1px solid #3a342c; overflow-y: auto; background: #131110; }
.bf-list-item { padding: 8px 10px; border-bottom: 1px solid #241f1a; cursor: pointer; font-size: 13px; }
.bf-list-item:hover { background: #1f1b17; }
.bf-list-item.active { background: #3a3120; border-left: 3px solid #c9a33c; }
.bf-list-item .y { color: #c9a33c; font-weight: bold; margin-right: 6px; }
.bf-list-item .t { color: #8a8070; font-size: 11px; }
.bf-form { flex: 1; overflow-y: auto; padding: 14px 18px 60px; min-width: 0; }
.bf-toolbar { padding: 8px 12px; background: #1a1714; border-bottom: 1px solid #3a342c; display: flex; gap: 8px; align-items: center; }
.bf-btn { background: #2f2a22; color: #e8e0d0; border: 1px solid #5a5042; border-radius: 4px; padding: 5px 14px; cursor: pointer; font-family: inherit; font-size: 13px; }
.bf-btn:hover { background: #423a2c; }
.bf-btn.primary { background: #6a5a2a; border-color: #a08a3a; }
.bf-btn.primary:hover { background: #877134; }
.bf-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.bf-btn.danger { background: #5a2a24; border-color: #9a4a3a; }
.bf-btn.danger:hover { background: #743429; }
fieldset { border: 1px solid #3a342c; border-radius: 6px; margin: 0 0 14px; padding: 10px 14px 14px; }
legend { color: #c9a33c; font-size: 13px; padding: 0 6px; }
.row { display: flex; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
.fld { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 160px; }
.fld label { font-size: 11px; color: #9a9080; }
.fld input, .fld select, .fld textarea {
    background: #0c0b0a; color: #e8e0d0; border: 1px solid #443c32; border-radius: 4px;
    padding: 5px 7px; font-family: inherit; font-size: 13px;
}
.fld textarea { min-height: 58px; resize: vertical; }
.fld .hint { font-size: 10px; color: #6a6355; }
.issues { margin: 0 0 12px; padding: 8px 12px; border-radius: 6px; font-size: 12px; }
.issues.err { background: #3a1c1c; border: 1px solid #7a3a3a; }
.issues.ok { background: #1c3a22; border: 1px solid #3a7a4a; }
.issues div { margin: 2px 0; }
.issues .lv-error::before { content: '\\2716 '; color: #ff8a8a; }
.issues .lv-warn::before { content: '\\26A0 '; color: #ffcf7a; }
.chips { display: flex; flex-wrap: wrap; gap: 5px; }
.chip { background: #2a2520; border: 1px solid #4a4238; border-radius: 3px; padding: 2px 6px; font-size: 11px; }
.chip button { background: none; border: none; color: #c98a8a; cursor: pointer; padding: 0 0 0 4px; }
`;
const styleEl = document.createElement('style');
styleEl.textContent = css;
document.head.appendChild(styleEl);

function escapeHtml(s: string): string {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
}
function escapeAttr(s: string): string {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
function opt(value: string, label: string, cur: string): string {
    const sel = value === cur ? ' selected' : '';
    return `<option value="${escapeAttr(value)}"${sel}>${escapeHtml(label)}</option>`;
}
/** 赶路播报分几段（与引擎同口径：空行分段） */
function briefingParagraphs(text: string): number {
    return text.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).length;
}
/** 包括最后一段阅读时间，与游戏字幕使用同一时长算法。 */
function briefingSeconds(text: string): number {
    return Math.ceil(journeyBriefingParagraphs(text).reduce((sum, p) => sum + journeyBriefingDuration(p), 0) / 1000);
}

function generalOptions(cur: string): string {
    // 🔴 [2026-09-19 主人定]「缺少的人物，做成战场人物」——这些人也在攻守两方的下拉里，
    //    否则「窦建德当守方主帅」根本选不出来。单列一个 optgroup 标明他们只在场战上出现。
    const bfChars = ALL_BF_CHARACTERS.filter((c) => c.generalId !== cur);
    return '<option value="">（未选）</option>'
        + ALL_GENERALS.map((g) => opt(g.generalId, `${g.generalName} — ${g.factionId}`, cur)).join('')
        + (bfChars.length
            ? `<optgroup label="⚔ 战场人物（只在场战上出现）">${bfChars.map((c) => opt(c.generalId, `${c.generalName} — ${c.factionId}`, cur)).join('')}</optgroup>`
            : '');
}
function cityOptions(cur: string): string {
    return '<option value="">（未选）</option>'
        + ALL_CITIES.map((c) => opt(c.id, `${c.name} — ${c.id}`, cur)).join('');
}
/** 留空时实际会套的军团（势力 → 建筑风格，与运行时 spawnBattlefieldSide 同一套口径） */
function resolveCurrentLegion(factionId: string, sourceCityId: string): string {
    const fac = FACTION_COMPOSITIONS[factionId];
    if (fac?.legionName) return fac.legionName;
    const city = sourceCityId ? CITY_BY_ID.get(sourceCityId) : undefined;
    if (!city) return '';
    return getCultureLegionName(getCityRegion({ latitude: city.lat, longitude: city.lng })) || '';
}
function legionOptions(cur: string, currentLegion: string): string {
    const tip = currentLegion ? `（不指定 · 当前：${currentLegion}）` : '（不指定）';
    return `<option value="">${escapeHtml(tip)}</option>`
        + LEGION_GROUPS.map((g) => `<optgroup label="${escapeHtml(g.label)}">${g.legions.map((n) => opt(n, n, cur)).join('')}</optgroup>`).join('');
}
/** 按搜索词过滤军团下拉（隐藏不匹配的 option + 空的 optgroup） */
function filterLegionSelect(selectId: string, searchId: string): void {
    const sel = document.getElementById(selectId) as HTMLSelectElement | null;
    const inp = document.getElementById(searchId) as HTMLInputElement | null;
    if (!sel || !inp) return;
    const q = inp.value.trim().toLowerCase();
    for (const optEl of Array.from(sel.options)) {
        if (optEl.value === '') { optEl.hidden = false; continue; }
        optEl.hidden = q !== '' && !optEl.textContent.toLowerCase().includes(q);
    }
    for (const g of Array.from(sel.querySelectorAll('optgroup'))) {
        const anyVisible = Array.from(g.querySelectorAll('option')).some((o) => !(o as HTMLOptionElement).hidden);
        (g as HTMLOptGroupElement).hidden = !anyVisible;
    }
}

function render(): void {
    const issues = validate(working);
    const hasErr = issues.some((i) => i.level === 'error');
    const attCurrentLegion = resolveCurrentLegion(working.attackerFactionId, working.attackerSourceCityId);
    const defSrcCity = working.type === 'siege' ? working.defenderCityId : working.defenderSourceCityId;
    const defCurrentLegion = resolveCurrentLegion(working.defenderFactionId, defSrcCity);

    app.innerHTML = `
    <div class="bf-toolbar">
        <button class="bf-btn" id="btn-new">＋ 新建战役</button>
        <button class="bf-btn primary" id="btn-save"${hasErr ? ' disabled' : ''}>保存到数据文件</button>
        <button class="bf-btn danger" id="btn-delete"${isNew ? ' disabled' : ''}>删除这场战役</button>
        <span style="color:#8a8070;font-size:12px;">共 ${drafts.length} 场战役${isNew ? ' · 当前是新建，未保存' : ''}</span>
    </div>
    <div class="bf-wrap">
        <div class="bf-list">
            ${drafts.map((d, i) => `
                <div class="bf-list-item ${i === selected && !isNew ? 'active' : ''}" data-i="${i}">
                    <div><span class="y">${d.year < 0 ? '前' + (-d.year) : d.year}年</span>${escapeHtml(d.title || '无名')}</div>
                    <div class="t">${d.type === 'siege' ? '攻城战' : '野战'} · ${escapeHtml(d.bfName || '未配战场')}</div>
                </div>`).join('')}
        </div>
        <div class="bf-form">
            ${issues.length ? `<div class="issues ${hasErr ? 'err' : 'ok'}">
                ${issues.map((i) => `<div class="lv-${i.level}">${escapeHtml(i.msg)}</div>`).join('')}
            </div>` : '<div class="issues ok">✔ 字段齐全，可以保存</div>'}

            <fieldset><legend>一、年代与战役名称</legend>
                <div class="row">
                    <div class="fld" style="max-width:150px;">
                        <label>年代</label>
                        <input type="number" id="f-year" value="${working.year}">
                        <span class="hint">公元前写负数：前321年 = -321</span>
                    </div>
                    <div class="fld" style="max-width:110px;">
                        <label>季节</label>
                        <select id="f-season">${SEASONS.map((s, i) => opt(String(i), s, String(working.season))).join('')}</select>
                    </div>
                    <div class="fld">
                        <label>归属武将 · 玩家与这位武将入伍，打的就是这一场</label>
                        <select id="f-general">${generalOptions(working.generalId)}</select>
                        <span class="hint">同一武将可挂多场（按年份依次解锁）；留空 = 不归属任何武将</span>
                    </div>
                    <div class="fld">
                        <label>战役名称 · 历史上最知名的叫法</label>
                        <input id="f-title" value="${escapeAttr(working.title)}" placeholder="例：高加米拉战役　推罗战役">
                    </div>
                </div>
                <div class="row">
                    <div class="fld">
                        <label>事件标题 · 年表那一行</label>
                        <input id="f-eventTitle" value="${escapeAttr(working.eventTitle)}" placeholder="例：公元前331年 高加米拉战役">
                    </div>
                </div>
            </fieldset>

            <fieldset><legend>二、战场坐标与战斗类型</legend>
                <div class="row">
                    <div class="fld" style="max-width:150px;">
                        <label>纬度 lat</label>
                        <input type="number" step="0.0001" id="f-lat" value="${working.lat}">
                    </div>
                    <div class="fld" style="max-width:150px;">
                        <label>经度 lng</label>
                        <input type="number" step="0.0001" id="f-lng" value="${working.lng}">
                    </div>
                    <div class="fld" style="max-width:160px;">
                        <label>攻城战还是野战</label>
                        <select id="f-type">
                            ${opt('field_battle', '野战', working.type)}
                            ${opt('siege', '攻城战', working.type)}
                        </select>
                    </div>
                    <div class="fld">
                        <label>战场 id</label>
                        <input id="f-bfId" value="${escapeAttr(working.bfId)}" placeholder="bf_gaojiamila">
                        <span class="hint">战场不是据点，必须 bf_ 开头</span>
                    </div>
                    <div class="fld">
                        <label>战场地名</label>
                        <input id="f-bfName" value="${escapeAttr(working.bfName)}" placeholder="高加米拉">
                        <span class="hint">标牌上只显示地名</span>
                    </div>
                </div>
                <div class="row">
                    <div class="fld">
                        <label>在场人物 · 与这块战场绑定的人（战场人物表 src/data/BattlefieldCharacters.ts）</label>
                        <div class="chips" id="roster">
                            ${working.bfRoster.map((id, i) => `<span class="chip">${escapeHtml(BF_CHAR_BY_ID.get(id)?.generalName ?? id)}<button data-rm-ros="${i}">×</button></span>`).join('')}
                        </div>
                        <div class="row" style="margin-top:6px;">
                            <select id="ros-char" style="flex:1;min-width:180px;">
                                <option value="">（未选）</option>
                                ${ALL_BF_CHARACTERS.map((c) => opt(c.generalId, `${c.generalName} — ${c.factionId}`, '')).join('')}
                            </select>
                            <button class="bf-btn" id="ros-add">加入在场人物</button>
                        </div>
                        <span class="hint">攻守两方的武将下拉里已单列「⚔ 战场人物」，可直接选来当主帅</span>
                    </div>
                    ${working.type === 'siege' ? `
                    <div class="fld" style="max-width:320px;">
                        <label>这个战场打的是哪座城 · 攻城战专用</label>
                        <select id="f-eventCity">${cityOptions(working.bfEventCityId)}</select>
                        <span class="hint">打**据点**时用（如推罗战役 ↔ 推罗城）；打**战场要塞**请用右栏，两者二选一</span>
                    </div>
                    <div class="fld" style="max-width:320px;">
                        <label>本战场即攻城目标 · 战场要塞（如「一之谷」）</label>
                        <select id="f-eventBf">${opt('', '（不是）', working.bfTargetBattlefieldId)}${BATTLEFIELDS.map((x) => opt(x.id, `${x.name} — ${x.id}`, working.bfTargetBattlefieldId)).join('')}</select>
                        <span class="hint">战场本身就是被强攻的目标时选它（不攻任何据点、战后不改任何据点归属）</span>
                    </div>
                    <div class="fld" style="max-width:260px;">
                        <label>标注套用哪一档据点样式 · 攻城战专用</label>
                        <select id="f-siegeCastle">
                            ${opt('', '（不套用，画战场形态）', working.bfSiegeCastleType)}
                            ${opt('big_city', '大城', working.bfSiegeCastleType)}
                            ${opt('medium_city', '中城', working.bfSiegeCastleType)}
                            ${opt('small_city', '小城', working.bfSiegeCastleType)}
                            ${opt('stockade', '城寨', working.bfSiegeCastleType)}
                            ${opt('pass', '险要（砦/关隘）', working.bfSiegeCastleType)}
                        </select>
                        <span class="hint">打完这一仗后，地图上这个战场就画成据点那样（与真据点同一套组装，样式不会走样）</span>
                    </div>` : ''}
                </div>
            </fieldset>

            <fieldset><legend>三、攻方</legend>
                <div class="row">
                    <div class="fld"><label>武将</label>
                        <select id="f-attGeneral">${generalOptions(working.attackerGeneralId)}</select></div>
                    <div class="fld" style="max-width:160px;"><label>势力 id</label>
                        <input id="f-attFaction" value="${escapeAttr(working.attackerFactionId)}"></div>
                    <div class="fld" style="max-width:140px;"><label>兵力</label>
                        <input type="number" id="f-attTroops" value="${working.attackerTroops}"></div>
                    <div class="fld"><label>出兵据点</label>
                        <select id="f-attCity">${cityOptions(working.attackerSourceCityId)}</select></div>
                    <div class="fld"><label>军团</label>
                        <input id="f-attLegionSearch" placeholder="搜索军团…" value="">
                        <select id="f-attLegion">${legionOptions(working.attackerLegionName, attCurrentLegion)}</select></div>
                </div>
            </fieldset>

            <fieldset><legend>四、守方</legend>
                <div class="row">
                    <div class="fld"><label>武将</label>
                        <select id="f-defGeneral">${generalOptions(working.defenderGeneralId)}</select></div>
                    <div class="fld" style="max-width:160px;"><label>势力 id</label>
                        <input id="f-defFaction" value="${escapeAttr(working.defenderFactionId)}"></div>
                    <div class="fld" style="max-width:140px;"><label>兵力</label>
                        <input type="number" id="f-defTroops" value="${working.defenderTroops}"></div>
                    ${working.type === 'siege' ? `
                    <div class="fld"><label>被攻打的据点 · 守方就是这座城</label>
                        <select id="f-defCity">${cityOptions(working.defenderCityId)}</select></div>`
                    : `
                    <div class="fld"><label>出兵据点</label>
                        <select id="f-defSrcCity">${cityOptions(working.defenderSourceCityId)}</select></div>`}
                    <div class="fld"><label>军团</label>
                        <input id="f-defLegionSearch" placeholder="搜索军团…" value="">
                        <select id="f-defLegion">${legionOptions(working.defenderLegionName, defCurrentLegion)}</select></div>
                </div>
            </fieldset>

            <fieldset><legend>五、谁赢了</legend>
                <div class="row">
                    <div class="fld" style="max-width:220px;">
                        <label>结果 · 按史实写死，无论输赢</label>
                        <select id="f-result">
                            ${opt('attacker_win', '攻方胜', working.result)}
                            ${opt('defender_win', '守方胜', working.result)}
                        </select>
                    </div>
                    <div class="fld">
                        <label>战后据点归属</label>
                        <div class="chips" id="cityupdates">
                            ${working.cityUpdates.map((u, i) => `<span class="chip">${escapeHtml(CITY_BY_ID.get(u.cityId)?.name ?? u.cityId)} → ${escapeHtml(u.factionId)}<button data-rm-cu="${i}">×</button></span>`).join('')}
                        </div>
                        <div class="row" style="margin-top:6px;">
                            <select id="cu-city" style="flex:1;min-width:140px;">${cityOptions('')}</select>
                            <input id="cu-faction" placeholder="归给哪个势力 id" style="flex:1;min-width:120px;">
                            <button class="bf-btn" id="cu-add">添加</button>
                        </div>
                    </div>
                </div>
            </fieldset>

            <fieldset><legend>六、战役播报内容</legend>
                <div class="row">
                    <div class="fld"><label>事件播报 · 这一年发生了什么</label>
                        <textarea id="f-desc">${escapeHtml(working.description)}</textarea></div>
                </div>
                <div class="row">
                    <div class="fld"><label>战役播报 · 战斗面板与横幅</label>
                        <textarea id="f-battleDesc">${escapeHtml(working.battleDescription)}</textarea></div>
                </div>
                <div class="row">
                    <div class="fld"><label>赶路背景播报 · 玩家在路上逐段播，空行分段</label>
                        <textarea id="f-bfBriefing" style="min-height:120px;">${escapeHtml(working.bfBriefing)}</textarea>
                        <span class="hint">${working.bfBriefing.trim() ? briefingParagraphs(working.bfBriefing) + ' 段，约 ' + briefingSeconds(working.bfBriefing) + ' 秒播完' : '留空则赶路时只有一条「奔赴XXX」提示'}</span></div>
                </div>
                <div class="row">
                    <div class="fld"><label>战场备注 · 史料出处，可空</label>
                        <textarea id="f-bfNote" style="min-height:40px;">${escapeHtml(working.bfNote)}</textarea></div>
                </div>
            </fieldset>

            <fieldset><legend>七、行军航点 · 军团逐段推进，最后一段走战场坐标</legend>
                <div class="chips" id="waypoints">
                    ${working.marchWaypoints.map((w, i) => `<span class="chip">${escapeHtml(CITY_BY_ID.get(w)?.name ?? w)}<button data-rm-wp="${i}">×</button></span>`).join('')}
                </div>
                <div class="row" style="margin-top:6px;">
                    <select id="wp-city" style="flex:1;max-width:280px;">${cityOptions('')}</select>
                    <button class="bf-btn" id="wp-add">添加航点</button>
                </div>
            </fieldset>
        </div>
    </div>`;

    bind();
}

function bind(): void {
    const on = <T extends HTMLElement>(id: string, ev: string, fn: (el: T) => void) => {
        const el = document.getElementById(id) as T | null;
        if (el) el.addEventListener(ev, () => fn(el));
    };
    const num = (v: string) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

    document.querySelectorAll<HTMLElement>('.bf-list-item').forEach((el) => {
        el.addEventListener('click', () => {
            selected = Number(el.dataset.i);
            isNew = false;
            working = { ...drafts[selected] };
            render();
        });
    });

    on<HTMLInputElement>('f-year', 'change', (el) => { working.year = num(el.value); render(); });
    on<HTMLSelectElement>('f-season', 'change', (el) => { working.season = num(el.value); });
    on<HTMLInputElement>('f-title', 'input', (el) => { working.title = el.value; });
    // 归属武将：只写 generalId 一个字段，**不顺手带出攻守势力** ——
    // 事件归属的武将常常是攻方主帅，但也有以守方身份出面的时候（同一位将可能被请去打他守的那一仗），
    // 自动改势力会把主人已经配好的数据弄乱。要带势力，用下面攻/守两处的武将选择器。
    on<HTMLSelectElement>('f-general', 'change', (el) => { working.generalId = el.value; render(); });
    on<HTMLInputElement>('f-eventTitle', 'input', (el) => { working.eventTitle = el.value; });
    on<HTMLInputElement>('f-lat', 'change', (el) => { working.lat = num(el.value); render(); });
    on<HTMLInputElement>('f-lng', 'change', (el) => { working.lng = num(el.value); render(); });
    on<HTMLSelectElement>('f-type', 'change', (el) => {
        working.type = el.value as BattleDraft['type']; render();
    });    on<HTMLInputElement>('f-bfId', 'input', (el) => { working.bfId = el.value; });
    on<HTMLInputElement>('f-bfName', 'input', (el) => { working.bfName = el.value; });

    // 选武将自动带出势力 id：少一处手写就少一处写歪
    on<HTMLSelectElement>('f-attGeneral', 'change', (el) => {
        working.attackerGeneralId = el.value;
        const g = GENERAL_BY_ID.get(el.value);
        if (g) working.attackerFactionId = g.factionId;
        render();
    });
    on<HTMLSelectElement>('f-defGeneral', 'change', (el) => {
        working.defenderGeneralId = el.value;
        const g = GENERAL_BY_ID.get(el.value);
        if (g) working.defenderFactionId = g.factionId;
        render();
    });
    on<HTMLInputElement>('f-attFaction', 'input', (el) => { working.attackerFactionId = el.value; });
    on<HTMLInputElement>('f-defFaction', 'input', (el) => { working.defenderFactionId = el.value; });
    on<HTMLInputElement>('f-attTroops', 'change', (el) => { working.attackerTroops = num(el.value); render(); });
    on<HTMLInputElement>('f-defTroops', 'change', (el) => { working.defenderTroops = num(el.value); render(); });
    on<HTMLSelectElement>('f-attCity', 'change', (el) => { working.attackerSourceCityId = el.value; render(); });
    on<HTMLSelectElement>('f-attLegion', 'change', (el) => { working.attackerLegionName = el.value; render(); });
    on<HTMLInputElement>('f-attLegionSearch', 'input', () => { filterLegionSelect('f-attLegion', 'f-attLegionSearch'); });
    on<HTMLSelectElement>('f-defCity', 'change', (el) => {
        working.defenderCityId = el.value;
        // 攻城战守方就是这座城：势力跟着城走，省得手写写歪
        const c = CITY_BY_ID.get(el.value);
        if (c && c.factionId) working.defenderFactionId = c.factionId;
        // 🔴 [2026-09-19] 攻城战「打的是哪座城」缺省就跟着被攻据点走（一之谷那种史实战场坐标另填）
        if (!working.bfEventCityId) working.bfEventCityId = el.value;
        render();
    });
    // 🔴 [2026-09-19] 攻城战：战场 ↔ 被攻据点的显式链接（不比坐标）
    on<HTMLSelectElement>('f-eventCity', 'change', (el) => { working.bfEventCityId = el.value; render(); });
    // 🔴 [2026-09-19] 攻城战：本战场即攻城目标（战场要塞，一之谷）
    on<HTMLSelectElement>('f-eventBf', 'change', (el) => { working.bfTargetBattlefieldId = el.value; render(); });
    // 🔴 [2026-09-19 主人定] 攻城战战场标注套用哪一档据点样式（大中小城寨）
    on<HTMLSelectElement>('f-siegeCastle', 'change', (el) => { working.bfSiegeCastleType = el.value; render(); });
    on<HTMLSelectElement>('f-defSrcCity', 'change', (el) => { working.defenderSourceCityId = el.value; render(); });
    on<HTMLSelectElement>('f-defLegion', 'change', (el) => { working.defenderLegionName = el.value; render(); });
    on<HTMLInputElement>('f-defLegionSearch', 'input', () => { filterLegionSelect('f-defLegion', 'f-defLegionSearch'); });
    on<HTMLSelectElement>('f-result', 'change', (el) => { working.result = el.value as BattleDraft['result']; });
    on<HTMLTextAreaElement>('f-desc', 'input', (el) => { working.description = el.value; });
    on<HTMLTextAreaElement>('f-battleDesc', 'input', (el) => { working.battleDescription = el.value; });
    on<HTMLTextAreaElement>('f-bfNote', 'input', (el) => { working.bfNote = el.value; });
    on<HTMLTextAreaElement>('f-bfBriefing', 'change', (el) => { working.bfBriefing = el.value; render(); });

    on<HTMLButtonElement>('wp-add', 'click', () => {
        const sel = document.getElementById('wp-city') as HTMLSelectElement | null;
        if (sel && sel.value) { working.marchWaypoints.push(sel.value); render(); }
    });
    // 🔴 [2026-09-19 主人定] 在场人物增删（战场人物与战场点绑定）
    on<HTMLButtonElement>('ros-add', 'click', () => {
        const sel = document.getElementById('ros-char') as HTMLSelectElement | null;
        if (sel && sel.value && !working.bfRoster.includes(sel.value)) {
            working.bfRoster.push(sel.value); render();
        }
    });
    document.querySelectorAll<HTMLElement>('[data-rm-ros]').forEach((el) => {
        el.addEventListener('click', () => {
            working.bfRoster.splice(Number(el.dataset.rmRos), 1); render();
        });
    });
    document.querySelectorAll<HTMLElement>('[data-rm-wp]').forEach((el) => {
        el.addEventListener('click', () => {
            working.marchWaypoints.splice(Number(el.dataset.rmWp), 1); render();
        });
    });
    on<HTMLButtonElement>('cu-add', 'click', () => {
        const c = document.getElementById('cu-city') as HTMLSelectElement | null;
        const f = document.getElementById('cu-faction') as HTMLInputElement | null;
        if (c && c.value && f && f.value.trim()) {
            working.cityUpdates.push({ cityId: c.value, factionId: f.value.trim() });
            render();
        }
    });
    document.querySelectorAll<HTMLElement>('[data-rm-cu]').forEach((el) => {
        el.addEventListener('click', () => {
            working.cityUpdates.splice(Number(el.dataset.rmCu), 1); render();
        });
    });

    on<HTMLButtonElement>('btn-new', 'click', () => {
        isNew = true; working = blankDraft(); render();
    });
    on<HTMLButtonElement>('btn-save', 'click', () => { void save(); });
    on<HTMLButtonElement>('btn-delete', 'click', () => { void removeBattle(); });
}

async function removeBattle(): Promise<void> {
    if (isNew) return;
    const name = working.title || working.bfId;
    if (!confirm(`确定删除【${name}】？

战场表与剧本两处的条目会一起删掉，含上方的史料注释。`)) return;
    const btn = document.getElementById('btn-delete') as HTMLButtonElement | null;
    if (btn) { btn.disabled = true; btn.textContent = '删除中…'; }
    try {
        const res = await fetch('/api/battlefield-editor/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bfId: working.bfId, year: working.year, title: working.title }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || '未知错误');
        alert(`已删除【${name}】
战场表剩 ${json.battlefields} 条
剧本剩 ${json.script} 条`);
        location.reload();
    } catch (e) {
        alert('删除失败：' + (e as Error).message);
        if (btn) { btn.disabled = false; btn.textContent = '删除这场战役'; }
    }
}

async function save(): Promise<void> {
    const issues = validate(working);
    if (issues.some((i) => i.level === 'error')) { alert('还有必填项没填对，先按红色提示改完'); return; }
    const btn = document.getElementById('btn-save') as HTMLButtonElement | null;
    if (btn) { btn.disabled = true; btn.textContent = '保存中…'; }
    try {
        const res = await fetch('/api/battlefield-editor/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(working),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || '未知错误');
        alert(`已保存（${json.mode === 'insert' ? '新增' : '更新'}）\n战场表 ${json.battlefields} 条\n剧本 ${json.script} 条`);
        location.reload();
    } catch (e) {
        alert('保存失败：' + (e as Error).message);
        if (btn) { btn.disabled = false; btn.textContent = '保存到数据文件'; }
    }
}

render();
