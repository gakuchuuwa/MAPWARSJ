/**
 * 战争编年史 · 数据契约（2026-11-12）
 *
 * 上游真源：`docs/战争编年史（纯史实重写）/战争编年史_双段播报总表_2026-11-12.xlsx`
 * 生成器：`tools/chronicle/import.py`（读 xlsx ＋ 游戏库索引 → 本目录 ChronicleSegmentNN.ts）
 * 校验器：`scratch/_chronicle_verify.mts`
 *
 * 口径（见 `docs/02-design/systems/编年史自动推进-设计方案-2026-11-12.md` §2.1）：
 *  - 三段名字：lead（史书主角，可缺库）/ battle（能打的武将，必须在库）/ camera（镜头跟谁）。
 *  - 「关联经典战ID」是候选清单，不是战斗顺序；去重与攻守由导入器按 `battleSteps` 落定。
 *  - 缺库主角一律写 `MISSING:<当期名>`，绝不误绑现库同名异代武将。
 */

/** battle：本事件有可打的经典战；operation：只有叙事推进 */
export type ChronicleKind = 'battle' | 'operation';

/** 事件内的一场仗（同一事件可含多场，按 order 先后） */
export interface ChronicleBattleStep {
    /** 事件内顺序，从 1 起 */
    order: number;
    /** 现有经典战 id（GeneralFirstBattles / GeneralExtraClassicBattles） */
    battleId: string;
    /** 本棒主角在这一战站哪边 */
    role: 'attacker' | 'defender';
    /** 这一战的名称（取自经典战表，审计用，不上屏） */
    label: string;
    /** event：本事件只念事件的战术段；battle：本战有自己的战术段 */
    briefing: 'event' | 'battle';
}

/** 古典地名 → 运行时锚点（锚点可缺，缺了记 MISSING 清单） */
export interface ChroniclePlace {
    /** 播报/上屏用的古典地名（真源原文） */
    name: string;
    /** 已有据点 id */
    cityId?: string;
    /** 已有战场 id */
    battlefieldId?: string;
    /** 坐标（战斗事件取自经典战表） */
    lat?: number;
    lng?: number;
    /** 地名未定位：待补（见导入审计的「地名待定位」清单） */
    anchorMissing?: boolean;
}

export interface ChronicleEvent {
    /** chron_01_01_01 */
    id: string;
    /** 1..16 */
    segment: number;
    /** 1..117；「第N→M棒」记起始棒 N */
    baton: number;
    /** 交接事件：本事件开始时的主角 → 结束时接棒的主角 */
    relay?: { from?: string; to?: string };
    /** 年份（公元前为负） */
    year: number;
    /** 春0 夏1 秋2 冬3 */
    season: 0 | 1 | 2 | 3;
    /** 同年排序（缺省按表内原顺序） */
    month?: number;
    kind: ChronicleKind;
    /** 事件类型原文（野战＋攻城…），只作审计 */
    rawType: string;
    title: string;
    place: ChroniclePlace;
    /** 史书主角：镜头跟着谁（可缺库，写 MISSING:<当期名>） */
    leadGeneralId: string;
    /** 实际出镜/带兵：优先本事件第一场仗的 generalId，否则 lead，否则留空 */
    cameraGeneralId?: string;
    /** 敌方武将 id（表内可解析者） */
    enemyGeneralIds?: string[];
    /** 敌方势力 id（取自经典战表） */
    enemyFactionId?: string;
    battles: ChronicleBattleStep[];
    /**
     * 亚历山大剧本场景（原文，如「亚历山大剧本第12场」）。
     * 这些仗在 `HISTORICAL_EVENT_SCRIPT` 里有坐标与攻守，但还不是经典战条目；
     * 等阶段四生成为经典战条目后，本条清空、battles 填上 battleId。
     */
    scriptScene?: string;
    /** 战略播报（赶路/转场念），一段一屏 */
    strategic: string[];
    /** 战术播报（开战/落地念） */
    tactical: string[];
    /** 史料出处 */
    source: string;
    sourceUrl?: string;
    /** 导入标注（AI 改名、防误绑、待补等原文摘录） */
    note?: string;
    /** 类型是「野战/攻城…」但库里没有可打战斗数据（缺数据，不是缺文案） */
    pendingBattle?: boolean;
}

export interface ChronicleSegment {
    id: number;
    title: string;
    fromYear: number;
    toYear: number;
    status: 'draft' | 'ready' | 'playable';
    events: readonly ChronicleEvent[];
}

/** 缺库主角判定 */
export function isMissingLead(generalId: string): boolean {
    return !generalId || generalId.startsWith('MISSING:');
}

/** 缺库主角的当期刊名（MISSING:哈尔帕古斯 → 哈尔帕古斯） */
export function missingLeadName(generalId: string): string {
    return isMissingLead(generalId) ? generalId.replace(/^MISSING:/, '') : '';
}
