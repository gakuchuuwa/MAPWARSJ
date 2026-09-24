/**
 * 战场事件编辑器 —— /battlefield-editor.html
 *
 * 🔴🔴🔴 最高铁律（2026-09-19 主人怒斥定死）：**严禁擅自新建 / 添加任何东西**。
 *   主人原话：「别他妈的擅自胡乱瞎建了，写到你的记忆里，写到规矩里，写到所有你能看到的敌方（地方）。」
 *   本编辑器是**主人录数据用的表单**；AI 不许借它自己建战场 / 建势力 / 建人物 / 补番号 / 补旗号 / 补色，
 *   也不许为了「消除审计警告」自己动手 —— 只做主人点名的那一处。细则见 `docs/AGENTS/no-arbitrary-additions.md`。
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
import { BATTLEFIELDS, matchesBattlefield, siegeSiteId } from '../data/Battlefields';
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
import { checkRoute, ROUTE_LIMITS } from './routeCheck';
import { resolveEventStartCityId, type StartEventInfo } from '../events/scriptEventStart';
import { findEventSite } from '../data/eventSites';
import { cityAbsentReason } from '../events/cityInYear';
import { SCRIPT_LEGIONS, SCRIPT_LEGION_MAP } from '../data/scriptLegions';
import { WAR_TYPES } from '../data/WarTypes';
import { SPRITE_PATHS } from '../config/UnitAssets';
import { CITY_ELITE_LEGIONS } from '../data/ExpeditionLegions';
import { EVENT_SOURCE_ITEMS, EVENT_SOURCE_LEVEL_LABEL, type EventSourceEntry, type EventSourceLevel } from '../data/eventSources';
import { slotsMatchFormation } from '../types/CultureFormations';
// 🔴 [2026-09-24 主人定] 本场特殊建筑：库里现成的奇观表（一城主奇观 + 同城第二三座 + 官方中文名）
import { CITY_WONDER, CITY_WONDER_EXTRA } from '../data/CityWonders';
import { WONDER_NAME } from '../data/WonderNames';

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
    /** 🔴 [2026-09-23] 武将邀约对白：剧本模式找到归属武将时他说的话（带语音，念完才开始赶路背景播报） */
    inviteText: string;
    /** 🔴 [2026-09-23] 资料清单：每项依据与可信级别（src/data/eventSources.ts），每项必填 */
    sources: Record<string, EventSourceEntry>;
    /** 🔴 [2026-09-23] 途经但那一年还不存在的据点（剧本期这一场不显示，路照走） */
    absentCities: string[];
    /** 🔴 [2026-09-23] 归属武将军团的主将队（第 10 队）兵种：按素材样貌选，必选 */
    commanderUnit: string;
    /** 🔴 [2026-09-23] 对手一方主帅的主将队兵种：必须是英雄 */
    foeCommanderUnit: string;
    /** 🔴 [2026-09-23] 军团出发据点：这一场归属武将身在哪座城（空 = 他本城） */
    startCityId: string;
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
    /**
     * 🔴 [2026-09-24 主人定] **本场特殊建筑**：奇观素材目录名（`CityWonders.ts` 的 asset），
     * 可多选；编辑器里连立绘一起看，图取自 `public/SUCAI_BUILDING/<素材>/preview.png`。
     */
    wonders: string[];
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

// ── 特殊建筑（奇观）目录：CITY_WONDER + CITY_WONDER_EXTRA，按素材目录名去重 ──────────
interface WonderOption { asset: string; name: string; cityId: string; cityName: string; description: string }
const ALL_WONDERS: WonderOption[] = (() => {
    const m = new Map<string, WonderOption>();
    for (const [cityId, asset] of Object.entries(CITY_WONDER)) {
        if (m.has(asset)) continue;
        m.set(asset, {
            asset, name: WONDER_NAME[asset] ?? asset, cityId,
            cityName: CITY_BY_ID.get(cityId)?.name ?? cityId, description: '',
        });
    }
    for (const [cityId, list] of Object.entries(CITY_WONDER_EXTRA)) {
        for (const w of list) {
            if (m.has(w.asset)) continue;
            m.set(w.asset, {
                asset: w.asset, name: w.name || (WONDER_NAME[w.asset] ?? w.asset), cityId,
                cityName: CITY_BY_ID.get(cityId)?.name ?? cityId, description: w.description ?? '',
            });
        }
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh'));
})();
const WONDER_BY_ASSET = new Map(ALL_WONDERS.map((w) => [w.asset, w]));
const wonderName = (asset: string): string => WONDER_BY_ASSET.get(asset)?.name ?? WONDER_NAME[asset] ?? asset;

/** 建筑立绘：库里现成的奇观图（一滴不改，只显示） */
const wonderImg = (asset: string): string => `/SUCAI_BUILDING/${asset}/preview.png`;

function wonderOptions(selected: readonly string[]): string {
    return ALL_WONDERS.map((w) => {
        const has = selected.includes(w.asset);
        return `<option value="${escapeAttr(w.asset)}"${has ? ' disabled' : ''}>`
            + `${escapeHtml(w.name)}　·　${escapeHtml(w.cityName)}${has ? '　（已在本场）' : ''}</option>`;
    }).join('');
}

/** 下拉里当前选中那座建筑的立绘与史实说明（换选项就刷新，不用整页重画） */
function refreshWonderPreview(): void {
    const sel = document.getElementById('wonder-pick') as HTMLSelectElement | null;
    const img = document.getElementById('wonder-preview-img') as HTMLImageElement | null;
    const cap = document.getElementById('wonder-preview-cap');
    const desc = document.getElementById('wonder-preview-desc');
    const asset = sel?.value ?? '';
    const w = asset ? WONDER_BY_ASSET.get(asset) : undefined;
    if (img) img.src = asset ? wonderImg(asset) : '';
    if (cap) cap.textContent = w ? `${w.name}　·　${w.cityName}` : '—';
    if (desc) desc.textContent = w?.description || (asset ? '（这条没有史实说明：说明写在 CityWonders.ts 的 CITY_WONDER_EXTRA 里）' : '');
}

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
        // 🔴 [2026-09-24 主人定「攻城战必须有据点……攻城战，你搞什么战场呀」] 攻城据点：地点就是那座城
        //    （eventSites 按「据点 + 年份」生成，播报存在事件本身）；野战才去战场表里配战场。
        const siegeCity = isSiege && !(bd as { targetBattlefieldId?: string }).targetBattlefieldId
            ? (bd as { defenderCityId?: string }).defenderCityId : undefined;
        const bf = siegeCity
            ? (findEventSite(siegeSiteId(siegeCity, ev.year)) ?? null)
            : (BATTLEFIELDS.find((b) => matchesBattlefield(b, ev.year, loc)) ?? null);
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
            bfBriefing: (isSiege ? (ev as AnyEvent & { briefing?: string }).briefing : undefined) ?? bf?.briefing ?? '',
            bfRoster: [...(bf?.roster ?? [])],
            bfEventCityId: bf?.eventCityId ?? '',
            bfTargetBattlefieldId: bf?.eventBattlefieldId ?? '',
            bfSiegeCastleType: (bf as { siegeCastleType?: string } | undefined)?.siegeCastleType ?? '',
            year: ev.year,
            season: ev.season ?? 0,
            generalId: (ev as AnyEvent & { generalId?: string }).generalId ?? '',
            inviteText: (ev as AnyEvent & { inviteText?: string }).inviteText ?? '',
            sources: Object.fromEntries(Object.entries((ev as AnyEvent & { sources?: Record<string, EventSourceEntry> }).sources ?? {})
                .map(([k, v]) => [k, { ...v }])),
            absentCities: [...((ev as AnyEvent & { absentCities?: string[] }).absentCities ?? [])],
            wonders: [...((ev as AnyEvent & { wonders?: string[] }).wonders ?? [])],
            commanderUnit: (ev as AnyEvent & { commanderUnit?: string }).commanderUnit ?? '',
            foeCommanderUnit: (ev as AnyEvent & { foeCommanderUnit?: string }).foeCommanderUnit ?? '',
            startCityId: (ev as AnyEvent & { startCityId?: string }).startCityId ?? '',
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
        year: -321, season: 0, generalId: '', inviteText: '', sources: {}, absentCities: [], wonders: [], commanderUnit: '', foeCommanderUnit: '', startCityId: '', type: 'field_battle',
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

    // 🔴 [2026-09-24 主人定] 两种事件两套规矩：野战有战场（战场 id + 地名），攻城战只有被攻打的据点，没有战场
    if (d.type !== 'siege') {
        if (!d.bfId.trim()) err('战场 id 必须填（bf_ + 拼音）');
        else if (!/^bf_[a-z0-9_]+$/.test(d.bfId.trim())) err('战场 id 必须是 bf_ 开头的小写拼音，且不能是 city_*（战场不是据点）');
        if (!d.bfName.trim()) err('战场地名必须填（标牌上只显示地名）');
    }

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
        // 🔴 [2026-09-24 主人定「攻城战必须有据点，就这么简单」] 不再接受「战场要塞」当攻城目标
        if (isFortress) {
            err('攻城战必须有据点：现在打的是战场要塞，请先在据点编辑里加上这座城，再在守方一栏把「被攻打的据点」选成它');
        } else if (!d.defenderCityId) {
            err('攻城战必须选被攻打的据点（攻城战没有战场，地点就是这座城）');
        }
        if (d.defenderCityId && !CITY_BY_ID.has(d.defenderCityId)) err('被攻据点不存在：' + d.defenderCityId);
        if (isFortress && !BATTLEFIELDS.some((b) => b.id === d.bfTargetBattlefieldId)) {
            err('战场要塞不存在：' + d.bfTargetBattlefieldId);
        }
        // 🔴 [2026-09-24 主人定「还有一个问题，就是战后据点归属问题」＋ 2026-09-16 铁律 3]
        //    **攻城战必须写战后归属**：被攻打的据点要易主，一切按历史、无论输赢。
        if (!isFortress && d.defenderCityId && !d.cityUpdates.some((u) => u.cityId === d.defenderCityId)) {
            err('攻城战必须写「战后归属」：被攻打的据点【' + (CITY_BY_ID.get(d.defenderCityId)?.name ?? d.defenderCityId)
                + '】没有易主 —— 主人定「该攻城就攻城，战斗要改据点归属，一切按历史，无论输赢」，请在「战后归属」栏加上这座城');
        }
        // 易主归谁：按史料。归给既不是攻方、也不是守方的第三方时才提醒核对
        for (const u of d.cityUpdates) {
            if (u.factionId && u.factionId !== d.attackerFactionId && u.factionId !== d.defenderFactionId) {
                warn(`战后归属：据点【${CITY_BY_ID.get(u.cityId)?.name ?? u.cityId}】既没归攻方、也没归守方，归的是「${u.factionId}」—— 请核对史料`);
            }
        }
        // 🔴 [2026-09-24 主人定「所有事件就两种……攻城战必须有据点，攻城战不要搞什么战场」]
        //    攻城战的行军终点**就是这座城**（引擎自动把 `defenderCityId` 当终点，见 PlayerQuestSystem.marchTarget），
        //    所以不再提示「航点要以被攻据点收尾」—— 那条提示会让人把城又写进航点，多出一段零长度路。
        //    航点只在史料另有途经地时才填。
    } else {
        if (!d.defenderSourceCityId) warn('野战建议填守方出兵据点');
        else if (!CITY_BY_ID.has(d.defenderSourceCityId)) err('守方出兵据点不存在：' + d.defenderSourceCityId);
        // 🔴 [2026-09-24 主人定「野战后，根据历史，据点也要有归属问题，例如沙加打完，孟菲斯是不是应该归马其顿」]
        //    **野战也可以有战后归属**：按历史，这一战之后确实易主的据点照写（格拉尼库斯后的达斯基利翁、
        //    加沙后的孟菲斯都是史实）。编辑器只提醒一句，要求把它写进史料依据「胜负与战后归属」里。
        if (d.cityUpdates.length) {
            const names = d.cityUpdates.map((u) => CITY_BY_ID.get(u.cityId)?.name ?? u.cityId).join('、');
            warn(`本场是野战，带了 ${d.cityUpdates.length} 条「战后归属」【${names}】—— `
                + '主人定：野战后按历史该易主的据点也要写；请确认这几座城确实是这一战之后归了某方，并在史料依据「胜负与战后归属」里写明出处');
        }
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
    // 🔴 [2026-09-23 主人令「注意行军路线怎么呈现，点与点之间要控制的范围」] 行军路线检查（与游戏同一套寻路）
    const routeReport = checkRoute({ ...d, startCityId: effectiveStart(d)?.cityId ?? '' });
    out.push(...routeReport.issues);
    // 🔴 [2026-09-24 主人问「不按历史线路行军，这个问题如何解决」] **路网偷偷改道要当场看得见**：
    //    行军的路径是 `roadRegistry.findPathOnRoad(起点, 终点)` 算出来的（**路网最短路**），
    //    路标只约束你写出来的那几个点，两点之间走哪条路由路网说了算 —— 一个路标都没写时尤其如此。
    //    血训：加沙一场没写路标，路网把它带去了**耶路撒冷**；高加米拉一场写着**大马士革**（那是前333年帕曼纽取财宝的路），
    //    两处都不是史书上的走法。
    //    故：**本场一个路标都没写时**，把实测经过的城逐条点出来，请作者对照史料确认 ——
    //    史料里没写的城，要么加路标绕开它，要么在「史料依据·行军路线」里写明为什么经过它。
    if (!d.marchWaypoints.length) {
        const via = [...new Set(routeReport.legs.flatMap((l) => l.via))];
        if (via.length) {
            out.push({
                level: 'warn',
                msg: `本场没写行军路标：走哪条路由路网最短路决定，实测经过【${via.join('、')}】`
                    + '—— 请对照史料确认；史料里没写的城，要么加路标绕开它，要么在「史料依据·行军路线」里写明为什么经过它',
            });
        }
    }
    // 🔴 [2026-09-23 主人定「剧本模式中，每一个主角武将的军团都必须是10队，样式从兵模素材中找，不要名字，要看样子符合就行」]
    if (d.generalId && !d.commanderUnit) {
        out.push({ level: 'error', msg: '主将队兵种没选：剧本模式每个主角武将的军团都是 10 队，第 10 队按素材样貌选一个符合这位武将的兵模' });
    } else if (d.commanderUnit && !WAR_TYPES[d.commanderUnit]) {
        out.push({ level: 'error', msg: `主将队兵种不存在：${d.commanderUnit}` });
    }
    // 🔴 [2026-09-23 主人定「第十队必须是英雄人物构成的」] 双方主将队都必须是英雄兵模
    if (d.commanderUnit && !d.commanderUnit.startsWith('hero_')) {
        out.push({ level: 'error', msg: '主将队兵种必须是英雄兵模：第十队由英雄人物构成' });
    }
    if (!d.foeCommanderUnit) {
        out.push({ level: 'error', msg: '对手主将队兵种没选：对面主帅的军团也是 10 队，第十队必须是英雄，按样貌或文化年代相近的人物选' });
    } else if (!d.foeCommanderUnit.startsWith('hero_') || !WAR_TYPES[d.foeCommanderUnit]) {
        out.push({ level: 'error', msg: `对手主将队兵种必须是存在的英雄兵模：${d.foeCommanderUnit}` });
    }
    if (d.generalId && d.commanderUnit) {
        const diff = drafts.filter((x) => x.title !== d.title && x.generalId === d.generalId && x.commanderUnit && x.commanderUnit !== d.commanderUnit);
        if (diff.length) {
            out.push({ level: 'warn', msg: `同一武将在【${diff.map((x) => x.title).join('、')}】里主将队用的是别的兵模：同一个人前后应当是同一个样子` });
        }
    }
    // 🔴 [2026-09-23] 跨事件一致性：同一武将的第二场起，默认从他上一场打完的地方出发（scriptEventStart.ts）；
    //    史料另有记载（中途回过别处）才写「军团出发据点」。写了的，离上一场太远就提醒写明中间行程。
    if (d.generalId && d.startCityId) {
        const earlier = drafts
            .filter((x) => x.generalId === d.generalId && x.title !== d.title
                && (x.year < d.year || (x.year === d.year && x.season < d.season)))
            .sort((a, b) => (b.year - a.year) || (b.season - a.season))[0];
        const c = CITY_BY_ID.get(d.startCityId);
        if (earlier && c) {
            const km = Math.hypot(c.lat - earlier.lat, (c.lng - earlier.lng) * Math.cos(c.lat * Math.PI / 180)) * 111;
            if (km > 800) {
                out.push({ level: 'warn', msg: `军团出发据点【${c.name}】离上一场【${earlier.title}】的战场约 ${Math.round(km)} 公里：中间这段行程请在史料依据「行军路线」里写明` });
            }
        }
    }
    if (d.startCityId && !CITY_BY_ID.has(d.startCityId)) {
        out.push({ level: 'error', msg: '军团出发据点不存在：' + d.startCityId });
    }
    // 🔴 [2026-09-24 主人「历史上哪年有了哪个据点，就显示哪个据点……符合历史」] 出发据点那一年必须已经存在
    if (d.startCityId && CITY_BY_ID.has(d.startCityId)) {
        const why = cityAbsentReason(d.startCityId, d.year);
        if (why) out.push({ level: 'error', msg: `军团出发据点【${CITY_BY_ID.get(d.startCityId)!.name}】在这一年不存在：${why}。换一座那一年已有的城，或留空（从上一场打完的地方出发）` });
    }
    // 🔴 [2026-09-24 血训 · 主人揪出「飞过去的？瞬移吗？」] 第二场起，军团**此刻**就在上一场打完的地方。
    //    这时再写「军团出发据点」，军团会**从那里直接开拔**（不是走过去）。
    //    只有「这位武将此刻不在军中、玩家须去某座城与他会面」才该写 —— 写了就提醒一句。
    if (d.generalId && d.startCityId) {
        const real = effectiveStart({ ...d, startCityId: '' });
        if (real && real.from === 'previous' && real.cityId !== d.startCityId) {
            const written = CITY_BY_ID.get(d.startCityId);
            const where = CITY_BY_ID.get(real.cityId);
            out.push({ level: 'warn', msg: `本场写了「军团出发据点」【${written?.name ?? d.startCityId}】，可军团此刻在【${where?.name ?? real.cityId}】：`
                + '写了它，军团就从写的那座城**直接开拔**（等于瞬移过去）。除非这位武将此刻不在军中、玩家须去城中与他会面，否则请留空 —— 留空即从上一场打完的地方出发' });
        }
    }
    // 🔴 [2026-09-23 主人定「确保每次事件收集的资料都是一致性的」] 资料清单每项必填，绝不留空
    for (const it of EVENT_SOURCE_ITEMS) {
        const e = d.sources[it.key];
        if (!e || !e.text.trim()) {
            out.push({ level: 'error', msg: `史料依据「${it.label}」没写：先查；查不到用知名度最大的说法；再没有就合理推定并写明理由，绝不留空` });
        }
    }
    // 🔴 [2026-09-23] 剧本军团三兵种 / 史料 / 名实相符
    out.push(...checkSideLegion('攻方', d.attackerLegionName, resolveCurrentLegion(d.attackerFactionId, d.attackerSourceCityId)));
    out.push(...checkSideLegion('守方', d.defenderLegionName,
        resolveCurrentLegion(d.defenderFactionId, d.type === 'siege' ? d.defenderCityId : d.defenderSourceCityId)));
    // 🔴 [2026-09-23 主人：「这是亚历山大率领的远征军……下一场还要换军团吗？」]
    //    剧本军团是一支历史军队本身，同一武将的各场事件用同一支；只有史书记载编成确实变了才另立。
    for (const [side, gid, legion] of [['攻方', d.attackerGeneralId, d.attackerLegionName], ['守方', d.defenderGeneralId, d.defenderLegionName]] as const) {
        if (!gid) continue;
        const others = new Set<string>();
        for (const x of drafts) {
            if (x.title === d.title) continue;
            if (x.attackerGeneralId === gid && x.attackerLegionName) others.add(x.attackerLegionName);
            if (x.defenderGeneralId === gid && x.defenderLegionName) others.add(x.defenderLegionName);
        }
        others.delete(legion);
        if (others.size) {
            const name = GENERAL_BY_ID.get(gid)?.generalName ?? gid;
            out.push({ level: 'warn', msg: `${side}【${name}】在别的事件里用的是「${[...others].join('、')}」，这里是「${legion || '未指定'}」：`
                + '同一支军队整场战争用同一支剧本军团，除非史书记载它的编成确实变了' });
        }
    }

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
/**
 * 🔴 [2026-09-23 主人定「新建一个四级……为剧本军团」] 事件里只许选**第四层剧本军团**：
 * 前三层的名字填进事件，运行时只改名字、兵种仍按势力取 —— 名不副实就是幽灵军团。
 * 已存数据里若还有前三层的名字，照样列出来（标 ✖），好让校验指出来改。
 */
function legionOptions(cur: string, currentLegion: string): string {
    const tip = currentLegion ? `（不指定 · 用势力乱斗那支：${currentLegion}）` : '（不指定）';
    const legacy = cur && !SCRIPT_LEGION_MAP.has(cur) ? opt(cur, `✖ ${cur}（前三层军团，事件里不能用）`, cur) : '';
    return `<option value="">${escapeHtml(tip)}</option>` + legacy
        + `<optgroup label="四级 · 剧本军团（按这一仗史实配三兵种）">${SCRIPT_LEGIONS.map((l) => opt(l.name, l.name, cur)).join('')}</optgroup>`;
}

/**
 * 🔴 [2026-09-23 主人定「样式从兵模素材中找，不要名字，要看样子符合就行」] 兵种素材样貌缩略图：
 * 画该兵种 idle 动作第 2 方向的第一帧（DE 素材按 _meta.json 的帧宽裁；老素材按正方形帧裁）。
 */
function spriteThumb(key: string, size = 48): string {
    return key ? `<canvas class="spr-thumb" data-spr="${escapeAttr(key)}" width="${size}" height="${size}" style="background:#0c0b0a;border:1px solid #443c32;border-radius:4px;flex:none;"></canvas>` : '';
}
const thumbCache = new Map<string, Promise<{ img: HTMLImageElement; fw: number; fh: number } | null>>();
function loadThumb(key: string): Promise<{ img: HTMLImageElement; fw: number; fh: number } | null> {
    const hit = thumbCache.get(key);
    if (hit) return hit;
    const p = (async () => {
        const assets = (SPRITE_PATHS.UNIT_ASSETS as unknown as Record<string, { IDLE?: readonly string[] }>)[key];
        const src = assets?.IDLE?.[2] ?? assets?.IDLE?.[0];
        if (!src) return null;
        const img = new Image();
        // 等 load 事件，不用 img.decode()：标签页在后台时 decode() 永远不返回，缩略图就一直是空的
        await new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
            img.src = src;
        });
        if (!img.naturalWidth) return null;
        let fw = img.naturalHeight, fh = img.naturalHeight;
        try {
            const meta = await (await fetch(src.replace(/[^/]+$/, '_meta.json'))).json();
            const d = meta?.idle?.dirs?.['2'] ?? meta?.idle?.dirs?.['0'];
            if (d?.fw) { fw = d.fw; fh = d.fh; }
        } catch { /* 老素材没有 _meta.json：按正方形帧 */ }
        return { img, fw, fh };
    })();
    thumbCache.set(key, p);
    return p;
}
function drawThumbs(): void {
    document.querySelectorAll<HTMLCanvasElement>('canvas.spr-thumb').forEach((cv) => {
        const key = cv.dataset.spr!;
        void loadThumb(key).then((t) => {
            const ctx = cv.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, cv.width, cv.height);
            if (!t) { ctx.fillStyle = '#7a3a3a'; ctx.fillText('无素材', 4, cv.height / 2); return; }
            const k = Math.min(cv.width / t.fw, cv.height / t.fh);
            const w = t.fw * k, h = t.fh * k;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(t.img, 0, 0, t.fw, t.fh, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
        });
    });
}
/** 主将队兵种下拉：英雄在前，其余按名 */
function commanderOptions(cur: string): string {
    const all = Object.entries(WAR_TYPES as Record<string, { name: string }>)
        .filter(([k]) => (SPRITE_PATHS.UNIT_ASSETS as Record<string, unknown>)[k]);
    const heroes = all.filter(([k]) => k.startsWith('hero_')).sort((a, b) => a[1].name.localeCompare(b[1].name, 'zh'));
    const others = all.filter(([k]) => !k.startsWith('hero_')).sort((a, b) => a[1].name.localeCompare(b[1].name, 'zh'));
    return '<option value="">（未选）</option>'
        + `<optgroup label="英雄">${heroes.map(([k, v]) => opt(k, v.name, cur)).join('')}</optgroup>`
        + `<optgroup label="其他兵种">${others.map(([k, v]) => opt(k, v.name, cur)).join('')}</optgroup>`;
}

/** 选中的剧本军团长什么样：阵型 + 前中后三排兵种 + 史料出处（没选就显示乱斗那支的兵种，提醒没按史实核对） */
function legionPreview(name: string, fallback: string): string {
    const def = name ? SCRIPT_LEGION_MAP.get(name) : undefined;
    if (!def) {
        return `<span class="hint">${fallback ? `未指定剧本军团：将用势力乱斗那支「${escapeHtml(fallback)}」，兵种没按此役史实核对` : '未指定剧本军团'}</span>`;
    }
    const rows = ['前排', '中排', '后排'];
    const CLS: Record<string, string> = { cav: '骑兵', melee: '步兵', ranged: '远程' };
    const cells = def.slots.map((sl, i) =>
        `${rows[i] ?? '第' + (i + 1) + '排'}${CLS[WAR_TYPES[sl.type]?.cls ?? ''] ?? ''} ×${sl.count}（${escapeHtml(WAR_TYPES[sl.type]?.name ?? sl.type)}）`).join(' · ');
    const thumbs = def.slots.map((sl) => spriteThumb(sl.type, 48)).join('');
    return `<div style="display:flex;gap:4px;margin:4px 0;">${thumbs}</div>`
        + `<span class="hint" style="color:#cbb98e">${escapeHtml(FORMATION_LABEL[def.formationMode] ?? def.formationMode)} · ${cells}<br>史料：${escapeHtml(def.source)}</span>`;
}

const FORMATION_LABEL: Record<string, string> = {
    square: '方阵 3-3-3', echelon: '雁行阵 4-3-2', fish_scale: '鱼鳞阵 3-4-2', crane_wing: '鹤翼阵 2-4-3',
    triangle: '锥形阵 2-3-4', crescent: '偃月阵 3-2-4', balance_yoke: '衡轭阵 4-2-3',
};

/**
 * 剧本军团硬规则（2026-09-23 主人：「确保以后新的军团都要符合历史」「军团都是三兵种构成的」）：
 *   · 只许选第四层剧本军团（否则名不副实）；
 *   · 三排 = 三个**不同**兵种（普通 / 高级 / 精锐只是档位，算同一兵种）；
 *   · 九格位合计 9 且与阵型对得上；兵种必须在兵种库里；必须写史料出处。
 */
function checkSideLegion(side: string, name: string, fallback: string): Issue[] {
    const out: Issue[] = [];
    if (!name) {
        out.push({ level: 'warn', msg: `${side}没指定剧本军团：会用势力乱斗那支「${fallback || '？'}」，兵种没按此役史实核对，建议按史料配一支剧本军团` });
        return out;
    }
    const def = SCRIPT_LEGION_MAP.get(name);
    if (!def) {
        out.push({ level: 'error', msg: `${side}军团「${name}」不是剧本军团：前三层的名字填进事件，运行时只改名不改兵（幽灵军团），请改选剧本军团` });
        return out;
    }
    // 🔴 [2026-09-23 主人定「军团中只有骑兵，步兵，远程，不要分的那么细」] 三排 = 骑兵、步兵、远程各一排
    const clsOf = (t: string) => WAR_TYPES[t]?.cls;
    const classes = def.slots.map((sl) => clsOf(sl.type));
    if (def.slots.length !== 3 || !['cav', 'melee', 'ranged'].every((c) => classes.includes(c as never))) {
        out.push({ level: 'error', msg: `${side}剧本军团「${name}」三排不是骑兵、步兵、远程各一排：军团只分这三类兵种` });
    }
    if (!slotsMatchFormation(def.slots, def.formationMode)) {
        out.push({ level: 'error', msg: `${side}剧本军团「${name}」三排人数与阵型对不上（合计必须 9，按阵型分排）` });
    }
    for (const sl of def.slots) {
        if (!WAR_TYPES[sl.type]) out.push({ level: 'error', msg: `${side}剧本军团「${name}」的兵种不存在：${sl.type}` });
    }
    if (!def.source.trim()) out.push({ level: 'error', msg: `${side}剧本军团「${name}」没写史料出处` });
    // 🔴 [2026-09-23 主人定] 剧本军团不加时代：用真实历史名或后世通称
    if (/^(古典|封建|城堡|帝国)时代/.test(name)) {
        out.push({ level: 'error', msg: `${side}剧本军团「${name}」带了时代前缀：剧本军团用真实历史名或后世通称（如「马其顿军」），不加时代` });
    }
    // 名字用史实原名，不硬加「军团」；但不许与精锐番号同名（军团 ≠ 精锐）
    if (Object.values(CITY_ELITE_LEGIONS).some((e) => e.name === name)) {
        out.push({ level: 'error', msg: `${side}剧本军团「${name}」和一个精锐番号同名：军团与精锐不能混用一个名字` });
    }
    return out;
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
                        <label>主将队兵种 · 第 10 队，按素材样貌选，不看兵名</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <select id="f-commander" style="flex:1;">${commanderOptions(working.commanderUnit)}</select>
                            ${spriteThumb(working.commanderUnit, 72)}
                        </div>
                        <span class="hint">剧本模式每个主角武将的军团都是 10 队：编制 9 队 + 主将队 1 队（前排正中再往前）；第十队必须是英雄</span>
                    </div>
                    <div class="fld">
                        <label>对手主将队兵种 · 对面那位主帅的第 10 队，必须是英雄，按样貌或文化年代相近的人物选</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <select id="f-foeCommander" style="flex:1;">${commanderOptions(working.foeCommanderUnit)}</select>
                            ${spriteThumb(working.foeCommanderUnit, 72)}
                        </div>
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
                    ${working.type !== 'siege' ? `
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
                    ` : `
                    <div class="fld"><label>地点</label><span class="hint">攻城战没有战场：地点就是守方一栏选的「被攻打的据点」，打完以据点易主体现战果</span></div>`}
                </div>
                ${working.type !== 'siege' ? `
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
                </div>
                ` : ''}
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
                        <select id="f-attLegion">${legionOptions(working.attackerLegionName, attCurrentLegion)}</select>
                        ${legionPreview(working.attackerLegionName, attCurrentLegion)}</div>
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
                        <select id="f-defLegion">${legionOptions(working.defenderLegionName, defCurrentLegion)}</select>
                        ${legionPreview(working.defenderLegionName, defCurrentLegion)}</div>
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
                    <div class="fld"><label>武将邀约对白 · 玩家找到归属武将时他说的话，只显示文字；称呼要合乎人物的时代与文化，如亚历山大称「朋友」，不用中式的「壮士」</label>
                        <textarea id="f-invite" style="min-height:58px;">${escapeHtml(working.inviteText)}</textarea>
                        <span class="hint">${working.inviteText.trim() ? '' : '留空则用通用的一句邀约'}</span></div>
                </div>
                <div class="row">
                    <div class="fld"><label>赶路背景播报 · 玩家在路上逐段播，空行分段</label>
                        <textarea id="f-bfBriefing" style="min-height:120px;">${escapeHtml(working.bfBriefing)}</textarea>
                        <span class="hint">${working.bfBriefing.trim() ? briefingParagraphs(working.bfBriefing) + ' 段，约 ' + briefingSeconds(working.bfBriefing) + ' 秒播完' : '留空则赶路时只有一条「奔赴XXX」提示'}</span></div>
                </div>
                <div class="row">
                    ${working.type !== 'siege' ? `<div class="fld"><label>战场备注 · 史料出处，可空</label>
                        <textarea id="f-bfNote" style="min-height:40px;">${escapeHtml(working.bfNote)}</textarea></div>` : ''}
                </div>
            </fieldset>

            <fieldset><legend>七、行军航点 · 军团逐段推进，最后一段走战场坐标</legend>
                <div class="row">
                    <div class="fld" style="max-width:360px;"><label>军团出发据点 · 这一场归属武将此时身在哪座城（玩家去那里找他，大军从那里出发）</label>
                        <select id="f-startCity">${cityOptions(working.startCityId)}</select>
                        <span class="hint">留空 = 武将本城；同一武将的第二场起必填（他不会每场都回老家）</span></div>
                </div>
                <div class="chips" id="waypoints">
                    ${working.marchWaypoints.map((w, i) => `<span class="chip">${escapeHtml(CITY_BY_ID.get(w)?.name ?? w)}<button data-rm-wp="${i}">×</button></span>`).join('')}
                </div>
                <div class="row" style="margin-top:6px;">
                    <select id="wp-city" style="flex:1;max-width:280px;">${cityOptions('')}</select>
                    <button class="bf-btn" id="wp-add">添加航点</button>
                </div>
                ${renderRouteReport()}
            </fieldset>

            <fieldset><legend>八、史料依据 · 每项必填：先查 —— 以**英文维基为基准、当地语种维基补细节**（中国史查中文维基、日本史查日文维基）；查到写史实出处；查不到用知名度最大的说法；再没有就合理推定并写明理由</legend>
                ${EVENT_SOURCE_ITEMS.map((it) => {
                    const cur = working.sources[it.key] ?? { level: 'fact', text: '' };
                    const lv = (Object.keys(EVENT_SOURCE_LEVEL_LABEL) as EventSourceLevel[])
                        .map((l) => opt(l, EVENT_SOURCE_LEVEL_LABEL[l], cur.level)).join('');
                    return `<div class="row">
                        <div class="fld" style="max-width:170px;"><label>${escapeHtml(it.label)}</label>
                            <select data-src-level="${it.key}">${lv}</select></div>
                        <div class="fld"><label>依据 · ${escapeHtml(it.hint)}</label>
                            <textarea data-src-text="${it.key}" style="min-height:40px;">${escapeHtml(cur.text)}</textarea></div>
                    </div>`;
                }).join('')}
            </fieldset>

            <fieldset><legend>九、本场特殊建筑 · 历史上知名的建筑（可多选，留空也可以）</legend>
                <div class="row" id="wonder-cards">
                    ${working.wonders.length ? working.wonders.map((a, i) => `
                    <div class="fld" style="max-width:210px;">
                        <img src="${wonderImg(a)}" alt="" style="width:100%;border-radius:6px;background:#0b0b0b;">
                        <span class="hint">🏛 ${escapeHtml(wonderName(a))}　·　${escapeHtml(WONDER_BY_ASSET.get(a)?.cityName ?? '')}
                            <button data-rm-wonder="${i}">× 移除</button></span>
                    </div>`).join('') : '<span class="hint">（本场还没加特殊建筑）</span>'}
                </div>
                <div class="row" style="margin-top:6px;">
                    <div class="fld" style="max-width:420px;"><label>选建筑 · 全库奇观（可搜名字或据点）</label>
                        <input id="wonder-search" placeholder="搜索建筑名 / 据点名…" value="">
                        <select id="wonder-pick">${wonderOptions(working.wonders)}</select></div>
                    <div class="fld" style="max-width:240px;"><label>立绘预览 · <span id="wonder-preview-cap">—</span></label>
                        <img id="wonder-preview-img" alt="" style="width:100%;border-radius:6px;background:#0b0b0b;">
                        <span class="hint" id="wonder-preview-desc"></span></div>
                    <button class="bf-btn" id="wonder-add">添加到本场</button>
                </div>
                <span class="hint">立绘取库里现成的奇观素材（public/SUCAI_BUILDING/&lt;素材&gt;/preview.png），AI 不新增、不替换任何立绘；
                    史实说明与挂靠据点在 src/data/CityWonders.ts，中文名在 src/data/WonderNames.ts。</span>
            </fieldset>
        </div>
    </div>`;

    bind();
}

/** 草稿 → 算出发地用的精简信息（与游戏 scriptCityVisibility.toStartInfo 同口径） */
function draftStartInfo(x: BattleDraft): StartEventInfo {
    const siegeCityId = x.type === 'siege' && !x.bfTargetBattlefieldId ? x.defenderCityId || undefined : undefined;
    const sc = siegeCityId ? CITY_BY_ID.get(siegeCityId) : undefined;
    return {
        generalId: x.generalId, year: x.year, season: x.season,
        startCityId: x.startCityId || undefined, absentCities: x.absentCities,
        point: sc ? { lat: sc.lat, lng: sc.lng } : { lat: x.lat, lng: x.lng }, siegeCityId,
    };
}
const START_CITIES = CITIES_V2.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng }));
/** 这一场军团实际从哪出发：写明的 / 上一场打完的地方 / null = 归属武将本城（与游戏同一个函数） */
function effectiveStart(d: BattleDraft): { cityId: string; from: 'set' | 'previous' } | null {
    return resolveEventStartCityId(draftStartInfo(d), drafts.map(draftStartInfo), START_CITIES);
}

/**
 * 行军路线实测（与游戏同一套寻路）：每段实际经过哪些城、哪段坐船、多远、绕不绕；
 * 以及剧本期地图上会出现的据点与它们挂的特殊建筑 —— 供主人逐个核对那一年是否存在。
 */
function renderRouteReport(): string {
    const st = effectiveStart(working);
    const r = checkRoute({ ...working, startCityId: st?.cityId ?? '' });
    const legRows = r.legs.map((l) => {
        const detour = l.straightKm > 0 ? l.roadKm / l.straightKm : 1;
        const bad = !l.ok || l.straightKm > ROUTE_LIMITS.MAX_LEG_STRAIGHT_KM
            || (l.straightKm > 20 && detour > ROUTE_LIMITS.MAX_DETOUR_RATIO) || l.offroadKm > ROUTE_LIMITS.MAX_OFFROAD_KM;
        const style = bad ? 'color:#ffcf7a' : '';
        const body = l.ok
            ? `${Math.round(l.roadKm)} 公里（直线 ${Math.round(l.straightKm)}）`
                + (l.seaKm > 0 ? ` · ⚓坐船 ${Math.round(l.seaKm)} 公里` : '')
                + (l.offroadKm > 0 ? ` · 离路直行 ${Math.round(l.offroadKm)} 公里` : '')
                + (l.via.length ? ` · 经过：${escapeHtml(l.via.join(' → '))}` : '')
            : '✖ 无路可达';
        return `<div style="${style}">${l.continuation ? '🚩连续行军 ' : ''}【${escapeHtml(l.from)}】→【${escapeHtml(l.to)}】${body}</div>`;
    }).join('');
    const cityRows = r.shownCities.map((c) => {
        // 年代闸门没过 → 那年不上图（与游戏同一套口径，见 routeCheck.eraGateReason）
        const blocked = !c.absent && !!c.eraBlocked;
        const style = c.absent ? 'opacity:.55;text-decoration:line-through'
            : blocked ? 'opacity:.6;border-color:#8a6a2a;' : '';
        return `<span class="chip" style="${style}" title="${escapeAttr(c.eraBlocked ?? '')}">${escapeHtml(c.name)}`
            + `${c.wonders.length ? ' · 🏛' + escapeHtml(c.wonders.join('、')) : ''}`
            + `${blocked ? ' · 🚫不上图（' + escapeHtml(c.eraBlocked!) + '）' : ''}`
            + `<button data-absent="${escapeAttr(c.id)}" title="${c.absent ? '改回：那一年已存在，显示' : '那一年还不存在：剧本期不显示，路照走'}">${c.absent ? '↺' : '✕不存在'}</button></span>`;
    }).join('');
    return `
        <div class="fld" style="margin-top:10px;">
            <label>行军路线实测 · 军团从【${escapeHtml(r.startCityName ?? '？')}】${r.fromPrevBattlefield ? '继续行军，沿地图道路' : '（归属武将所在城）出发'}，与游戏同一套寻路</label>
            <div style="font-size:12px;line-height:1.7;">${legRows || '<span class="hint">算不出路线</span>'}</div>
            <span class="hint">控制范围：一段直线超过 ${ROUTE_LIMITS.MAX_LEG_STRAIGHT_KM} 公里、绕远超过 ${ROUTE_LIMITS.MAX_DETOUR_RATIO} 倍、离路直行超过 ${ROUTE_LIMITS.MAX_OFFROAD_KM} 公里都要提醒加路标；渡海处应显示 ⚓坐船。🚩 那一段是**剧本期连续行军**：军团打完上一场**就地开拔**，起点是**上一处战场**（不经过出发据点），也必须受同一套控制范围约束</span>
        </div>
        <div class="fld" style="margin-top:8px;">
            <label>剧本期地图上会出现的据点（事件用到的 + 沿途经过的）· 🏛 为挂在该城的特殊建筑 · 逐个核对那一年是否存在、名字对不对；🚫 为**年代闸门没过**（建立年代 / 归属武将时代不符），那年不画、路照走；不存在的点「✕不存在」</label>
            <div class="chips">${cityRows}</div>
        </div>`;
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
            working = { ...drafts[selected], sources: { ...drafts[selected].sources }, absentCities: [...drafts[selected].absentCities] };
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
    on<HTMLTextAreaElement>('f-invite', 'change', (el) => { working.inviteText = el.value; render(); });
    on<HTMLSelectElement>('f-commander', 'change', (el) => { working.commanderUnit = el.value; render(); });
    on<HTMLSelectElement>('f-foeCommander', 'change', (el) => { working.foeCommanderUnit = el.value; render(); });
    on<HTMLSelectElement>('f-startCity', 'change', (el) => { working.startCityId = el.value; render(); });
    drawThumbs();
    // 那一年还不存在的途经据点：切换
    document.querySelectorAll<HTMLButtonElement>('[data-absent]').forEach((el) => {
        el.addEventListener('click', () => {
            const id = el.dataset.absent!;
            working.absentCities = working.absentCities.includes(id)
                ? working.absentCities.filter((x) => x !== id)
                : [...working.absentCities, id];
            render();
        });
    });
    // 史料依据：每项的级别与依据
    document.querySelectorAll<HTMLSelectElement>('[data-src-level]').forEach((el) => {
        el.addEventListener('change', () => {
            const k = el.dataset.srcLevel!;
            working.sources[k] = { level: el.value as EventSourceLevel, text: working.sources[k]?.text ?? '' };
            render();
        });
    });
    document.querySelectorAll<HTMLTextAreaElement>('[data-src-text]').forEach((el) => {
        el.addEventListener('change', () => {
            const k = el.dataset.srcText!;
            working.sources[k] = { level: working.sources[k]?.level ?? 'fact', text: el.value };
            render();
        });
    });
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

    // 🔴 [2026-09-24 主人定] 本场特殊建筑：加 / 删 / 换选中项看立绘 / 搜索
    on<HTMLButtonElement>('wonder-add', 'click', () => {
        const sel = document.getElementById('wonder-pick') as HTMLSelectElement | null;
        if (sel && sel.value && !working.wonders.includes(sel.value)) { working.wonders.push(sel.value); render(); }
    });
    document.querySelectorAll<HTMLElement>('[data-rm-wonder]').forEach((el) => {
        el.addEventListener('click', () => {
            working.wonders.splice(Number(el.dataset.rmWonder), 1); render();
        });
    });
    on<HTMLSelectElement>('wonder-pick', 'change', () => { refreshWonderPreview(); });
    on<HTMLInputElement>('wonder-search', 'input', (el) => {
        const q = el.value.trim();
        const sel = document.getElementById('wonder-pick') as HTMLSelectElement | null;
        if (!sel) return;
        for (const o of [...sel.options]) {
            const hide = !!q && !(o.textContent ?? '').includes(q);
            o.hidden = hide; o.style.display = hide ? 'none' : '';
        }
        const first = [...sel.options].find((o) => !o.hidden && !o.disabled);
        if (first) sel.value = first.value;
        refreshWonderPreview();
    });
    refreshWonderPreview();

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

/**
 * 🔴 [2026-09-23 血训] 防「旧页面把新内容写回旧的」：
 *    一个很早打开的编辑器页面，里面存着格拉尼库斯河的旧草稿；在它上面一保存，
 *    坐标、兵力、主将队、史料依据 13 项全被写回了旧值（页面不认识的新字段被当成「没有」删掉）。
 *    做法：打开页面时记下两个数据文件的全文，保存前再取一次，不一样就不保存、让先刷新。
 */
const DATA_FILES = ['/src/data/Battlefields.ts', '/src/data/HistoricalEventScript.ts'];
async function dataFilesSnapshot(): Promise<string> {
    const texts = await Promise.all(DATA_FILES.map((u) =>
        fetch(`${u}?raw&t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.text())));
    return texts.join('|');
}
const loadedSnapshot: Promise<string | null> = dataFilesSnapshot().catch(() => null);

async function save(): Promise<void> {
    const issues = validate(working);
    if (issues.some((i) => i.level === 'error')) { alert('还有必填项没填对，先按红色提示改完'); return; }
    const before = await loadedSnapshot;
    const nowSnap = await dataFilesSnapshot().catch(() => null);
    if (before !== null && nowSnap !== null && before !== nowSnap) {
        alert('数据文件在你打开本页之后被改过（别的页面、别的 AI 或刚才的改动）。\n'
            + '为免把新内容覆盖成旧的，这次不保存。\n'
            + '请先把你改的文字复制下来，刷新页面，再贴回去保存。');
        return;
    }
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
