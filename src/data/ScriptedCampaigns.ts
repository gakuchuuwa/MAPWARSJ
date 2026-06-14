/**
 * 剧本军团（Scripted Campaigns）— 通用历史剧本系统（2026-06-12 主人拍板）
 *
 * 与「乱斗远征」彻底分离（后者保持原样，玩家点远征、打文化中心、真实结算会输）：
 *   剧本军团 = 指定时间，名将率精锐登场，沿真实道路网实时行军直取史实目标。
 *   例：前246年白起率秦之锐士，开局自天水出发，一路实时推进到邯郸。
 *
 * **一剧本、一精锐、一将领、一立绘**（四条一一绑定，禁止随机池、禁止复用）：
 *   id（剧本）→ eliteName（精锐番号=军团名）→ generalId/generalName（将领）→ portrait（立绘路径）
 *
 * **出兵与据点兵力无关**：不读 city.troops、不扣驻军、不走募兵 90% 规则、**禁止御驾亲征从据点抽兵**；
 * 出生城/时间/兵力/精锐/将领/立绘/目标序列均在剧本数据中初始设定，播放时按数据直接生成。
 *
 * 一条剧本 = 一份数据：出生（城+时间）→ 精锐+将领+立绘+兵力 → 目标序列（实时 march 逐城）
 *
 * 运行驱动：RecruitmentSystem.spawnScriptedCampaigns / onScriptedCampaignYear → LegionSpawnPolicy
 * 目标推进：LegionBehaviors.resolveExpeditionState → tickScriptedCampaignExpedition（逐城换目标）
 * 策略表：src/legion/LegionSpawnPolicy.ts（补兵/募兵/兵力/立绘判定集中在此）
 * 番号/名将史料：史料/古代精锐部队.md、各区 *ExpeditionLegions.ts 注释。
 * 秦国方阵：CultureFormations.QIN_FACTION_COMPOSITION（据点/剧本/远征三军系统一）。
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
    /** 精锐番号 = 地图军团名（与 ExpeditionLegions 一致，如「秦之锐士」；禁止泛称「秦军」） */
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
    /** 目标序列：按史实顺序的 cityId，剧本军团逐城实时推进 */
    targetSequence: string[];
    /**
     * 末城兵败覆没（如邯郸）：攻城此城时强制 defender_win，军团 destroy。
     * 须在 targetSequence 末位；与「破末城剧本完成」互斥。
     */
    finaleDefeatCityId?: string;
    /** @deprecated 用 finaleDefeatCityId + 序列内 attacker_win；保留字段兼容 */
    invincible: boolean;
}

/**
 * 已收录剧本（先做秦跑通，做完一个再做下一个）。
 * 秦（前246年）：白起率秦之锐士，开局自天水东出。
 *   路线对齐 index_01_qin「秦东进十城」：汧源→…→阏与→邯郸。
 *   终局：邯郸城下兵败（finaleDefeatCityId），秦之锐士全军覆没。
 */
export const SCRIPTED_CAMPAIGNS: Readonly<ScriptedCampaign[]> = [
    {
        id: 'qin_handan',
        factionId: 'qin',
        eliteName: '秦之锐士',         // 精锐番号 = 军团名（CentralExpeditionLegions qin）
        generalId: 'baiqi',
        generalName: '白起',
        portrait: '/assets/qin/baiqi.png',
        spawnCityId: 'city_tianshui',
        troops: 20000,
        spawnAtStart: true,
        spawnYear: -246,               // 与 TIMELINE_START_YEAR / 旧 EVENTS_QIN 首年一致
        targetSequence: [
            'city_longzhou',           // 汧邑（秦王政元年）
            'city_qishan',             // 岐山
            'city_changan',            // 咸阳
            'city_weinan',             // 下邽（据点渭南）
            'city_tongguan',           // 桃林塞/潼关隘
            'city_hanguguan',          // 函谷关 — 出关东进咽喉
            'city_mianchi',            // 渑池
            'city_luoyang',            // 洛邑
            'city_tianjinguan',        // 天井关
            'city_shangdang',          // 长子（上党）
            'city_eyu',                // 阏与（据点东胜关）
            'city_handan',             // 邯郸（剧本终局·兵败覆没）
        ],
        finaleDefeatCityId: 'city_handan', // 邯郸城下 defender_win，全军覆没
        invincible: false,
    },
];

/** 取某势力的剧本（一势力最多一条剧本，与 1势力=1军 公理一致） */
export function getScriptedCampaignByFaction(factionId: string): ScriptedCampaign | null {
    return SCRIPTED_CAMPAIGNS.find((c) => c.factionId === factionId) ?? null;
}

/** 按剧本 id 查询 */
export function getScriptedCampaignById(id: string): ScriptedCampaign | null {
    return SCRIPTED_CAMPAIGNS.find((c) => c.id === id) ?? null;
}

/** 开发期校验：id / factionId 不得重复，目标序列不得为空 */
function validateScriptedCampaigns(): void {
    const ids = new Set<string>();
    const factionIds = new Set<string>();
    for (const c of SCRIPTED_CAMPAIGNS) {
        if (ids.has(c.id)) {
            console.error(`[ScriptedCampaigns] 重复剧本 id: ${c.id}`);
        }
        if (factionIds.has(c.factionId)) {
            console.error(`[ScriptedCampaigns] 重复 factionId（1势力=1剧本）: ${c.factionId}`);
        }
        if (c.targetSequence.length === 0) {
            console.error(`[ScriptedCampaigns] 目标序列为空: ${c.id}`);
        }
        if (c.finaleDefeatCityId) {
            const last = c.targetSequence[c.targetSequence.length - 1];
            if (c.finaleDefeatCityId !== last) {
                console.error(
                    `[ScriptedCampaigns] finaleDefeatCityId 须与 targetSequence 末城一致: ${c.id}`,
                );
            }
        }
        ids.add(c.id);
        factionIds.add(c.factionId);
    }
}
validateScriptedCampaigns();
