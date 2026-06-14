/**
 * 剧本军团（Scripted Campaigns）— 通用历史剧本系统（2026-06-12 主人拍板）
 *
 * 与「乱斗远征」彻底分离（后者保持原样，玩家点远征、打文化中心、真实结算会输）：
 *   剧本军团 = 指定时间，名将率精锐登场，沿真实道路网实时行军直取史实目标。
 *   例：前246年白起率秦锐士，开局自天水出发，一路实时推进到邯郸。
 *
 * **一剧本、一精锐、一将领、一立绘**（四条一一绑定，禁止随机池、禁止复用）：
 *   id（剧本）→ eliteName（精锐番号=军团名）→ generalId/generalName（将领）→ portrait（立绘路径）
 *
 * **出兵与据点兵力无关**：不读 city.troops、不扣驻军、不走募兵 90% 规则；
 * 出生城/时间/兵力/精锐/将领/立绘/目标序列均在剧本数据中初始设定，播放时按数据直接生成。
 *
 * 一条剧本 = 一份数据：出生（城+时间）→ 精锐+将领+立绘+兵力 → 目标序列（实时 march 逐城）
 *
 * 运行驱动：RecruitmentSystem.spawnScriptedCampaigns
 * 番号/名将史料：史料/古代精锐部队.md、各区 *ExpeditionLegions.ts 注释。
 */

/**
 * 剧本军团默认兵力（可被单条剧本 `troops` 覆盖）。
 * 凭空给、不扣出生城驻军；与据点 city.troops 无关。
 */
export const SCRIPTED_LEGION_TROOPS_DEFAULT = 20000;

/** @deprecated 使用各剧本 `troops` 字段；保留别名以免外部引用断裂 */
export const SCRIPTED_LEGION_TROOPS = SCRIPTED_LEGION_TROOPS_DEFAULT;

export interface ScriptedCampaign {
    /** 剧本唯一 id */
    id: string;
    /** 势力（须与 cities_v2 / factions 中一致） */
    factionId: string;
    /** 精锐番号 = 地图军团名（与 ExpeditionLegions 一致，如「秦锐士」；禁止泛称「秦军」） */
    eliteName: string;
    /** 将领 id（UnitAssets.GENERAL_PORTRAITS 键，如 'baiqi'） */
    generalId: string;
    /** 将领名（军情/日志显示，如「白起」） */
    generalName: string;
    /** 将领立绘路径（一剧本固定一张，如 /assets/qin/baiqi.png） */
    portrait: string;
    /** 出生据点 cityId（如 city_tianshui 天水） */
    spawnCityId: string;
    /** 出兵兵力（剧本预设，与据点驻军无关） */
    troops: number;
    /** 开局即出征（true）；否则按 spawnYear 指定年份登场 */
    spawnAtStart?: boolean;
    /** 指定登场年份（spawnAtStart 为 false 时用；负数为公元前） */
    spawnYear?: number;
    /** 目标序列：按史实顺序的 cityId，剧本军团逐城实时推进，破最后一城（如 city_handan 邯郸）剧本完成 */
    targetSequence: string[];
    /** 剧本主角遇敌预设必胜 + 战后回血（同 ScriptedQinLegion） */
    invincible: boolean;
}

/**
 * 已收录剧本（先做秦跑通，做完一个再做下一个）。
 * 秦（前246年）：白起率秦锐士，开局自天水东出，经长安(咸阳)、长子(上党)，直取赵都邯郸。
 *   cityId 均已核对存在：city_tianshui / city_changan / city_shangdang / city_handan。
 */
export const SCRIPTED_CAMPAIGNS: Readonly<ScriptedCampaign[]> = [
    {
        id: 'qin_handan',
        factionId: 'qin',
        eliteName: '秦锐士',           // 精锐番号 = 军团名（CentralExpeditionLegions）
        generalId: 'baiqi',
        generalName: '白起',
        portrait: '/assets/qin/baiqi.png',
        spawnCityId: 'city_tianshui',
        troops: 20000,
        spawnAtStart: true,
        spawnYear: -246,               // 与 TIMELINE_START_YEAR / 旧 EVENTS_QIN 首年一致
        targetSequence: ['city_changan', 'city_shangdang', 'city_handan'],
        invincible: false,             // 主人 2026-06-12：就像远征军一样，真实结算、会赢会输（弃用旧 ScriptedQin 必胜）
    },
];

/** 取某势力的剧本（一势力最多一条剧本，与 1势力=1军 公理一致） */
export function getScriptedCampaignByFaction(factionId: string): ScriptedCampaign | null {
    return SCRIPTED_CAMPAIGNS.find((c) => c.factionId === factionId) ?? null;
}
