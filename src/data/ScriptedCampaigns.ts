/**
 * 剧本军团（Scripted Campaigns）— 通用历史剧本系统（2026-06-12 主人拍板）
 *
 * 与「乱斗远征」彻底分离（后者保持原样，玩家点远征、打文化中心、真实结算会输）：
 *   剧本军团 = 指定时间，名将率精锐登场，沿真实道路网实时行军直取史实目标，剧本预设必胜。
 *   例：白起率秦军，开局自天水出发，一路实时推进到邯郸（不再逐年一城）。
 *
 * 一条剧本 = 一份数据（任意名将都能照此挂一条时间线剧本）：
 *   出生（城+时间）→ 名将身份（番号/立绘）→ 目标序列（实时march逐城）→ 必胜
 *
 * 运行驱动见 ScriptedCampaignManager；必胜逻辑见 ScriptedQinLegion（待通用化）。
 * 番号/名将史料：史料/古代精锐部队.md、各区 *ExpeditionLegions.ts 注释。
 */

export interface ScriptedCampaign {
    /** 剧本唯一 id */
    id: string;
    /** 势力（须与 cities_v2 / factions 中一致） */
    factionId: string;
    /** 地图上显示的军团名（剧本主角番号，如「秦军」） */
    legionName: string;
    /** 精锐番号（与 ExpeditionLegions 一致，如「秦锐士」） */
    eliteName: string;
    /** 名将 id（须有 UnitAssets 立绘键，如 'baiqi'） */
    generalId: string;
    /** 名将名（显示用，如「白起」） */
    generalName: string;
    /** 名将立绘路径 */
    portrait: string;
    /** 出生据点 cityId（如 city_tianshui 天水） */
    spawnCityId: string;
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
 * 秦：白起率秦军，开局自天水东出，经长安(咸阳)、长子(上党)，直取赵都邯郸。
 *   cityId 均已核对存在：city_tianshui / city_changan / city_shangdang / city_handan。
 */
export const SCRIPTED_CAMPAIGNS: Readonly<ScriptedCampaign[]> = [
    {
        id: 'qin_handan',
        factionId: 'qin',
        legionName: '秦军',
        eliteName: '秦锐士',
        generalId: 'baiqi',
        generalName: '白起',
        portrait: '/assets/qin/baiqi.png',
        spawnCityId: 'city_tianshui',
        spawnAtStart: true,
        targetSequence: ['city_changan', 'city_shangdang', 'city_handan'],
        invincible: true,
    },
];

/** 取某势力的剧本（一势力最多一条剧本，与 1势力=1军 公理一致） */
export function getScriptedCampaignByFaction(factionId: string): ScriptedCampaign | null {
    return SCRIPTED_CAMPAIGNS.find((c) => c.factionId === factionId) ?? null;
}
